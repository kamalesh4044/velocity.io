import * as THREE from 'three';
import { WeaponManager } from '../managers/WeaponManager.js';

export class Player {
    constructor(scene, camera, physics, input, network) {
        this.scene = scene;
        this.camera = camera;
        this.physics = physics;
        this.world = physics.world;
        this.RAPIER = physics.RAPIER;
        this.input = input;
        this.network = network;

        // Core FPS Configuration
        this.speed = 6.0;
        this.sprintMult = 1.5;
        this.jumpForce = 8.0;
        this.mouseSensitivity = 0.002;

        // State
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        this.lastMouseDelta = { x: 0, y: 0 };
        this.pitch = 0;
        this.yaw = 0;
        this.isSliding = false;
        this.slideTime = 0;

        // Health System
        this.maxHealth = 100;
        this.health = 100;
        this.isDead = false;
        this.respawnTime = 0;
        this.lastDamageTime = 0;
        this.healthRegenDelay = 4000; // ms before HP starts regenerating
        this.healthRegenRate = 8; // HP per second

        // Score
        this.kills = 0;
        this.deaths = 0;

        // Spawn points
        this.spawnPoints = [
            new THREE.Vector3(0, 5, 0),
            new THREE.Vector3(10, 5, 10),
            new THREE.Vector3(-10, 5, -10),
            new THREE.Vector3(15, 5, -5),
            new THREE.Vector3(-5, 5, 15),
        ];

        this.initPhysics();
        this.initVisuals();
    }

    initPhysics() {
        let rigidBodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 5, 0);
        this.rigidBody = this.world.createRigidBody(rigidBodyDesc);

        let colliderDesc = this.RAPIER.ColliderDesc.capsule(0.5, 0.4);
        this.collider = this.world.createCollider(colliderDesc, this.rigidBody);

        const offset = 0.05;
        this.characterController = this.world.createCharacterController(offset);
        this.characterController.enableAutostep(0.3, 0.2, true);
        this.characterController.enableSnapToGround(0.3);
    }

    initVisuals() {
        const geo = new THREE.CapsuleGeometry(0.4, 1.0, 4, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, visible: false });
        this.mesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.mesh);

        this.camera.position.set(0, 0.6, 0);
        this.scene.add(this.camera);

        // Init Weapon System
        this.weaponManager = new WeaponManager(this.camera, this.scene);
    }

    takeDamage(amount, attackerId) {
        if (this.isDead) return;

        this.health = Math.max(0, this.health - amount);
        this.lastDamageTime = performance.now();
        this.updateHealthHUD();

        // Damage vignette flash
        const vignette = document.getElementById('damage-vignette');
        if (vignette) {
            vignette.style.opacity = Math.min(0.6, amount / 50);
            setTimeout(() => vignette.style.opacity = '0', 200);
        }

        if (this.health <= 0) {
            this.die(attackerId);
        }
    }

    die(killerId) {
        this.isDead = true;
        this.deaths++;
        this.respawnTime = performance.now() + 3000;

        // Update deaths display
        const deathsEl = document.getElementById('deaths-count');
        if (deathsEl) deathsEl.textContent = this.deaths;

        // Show death screen
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.classList.add('show');
            const killerText = document.getElementById('death-killer-text');
            if (killerText) killerText.textContent = killerId ? `by ${killerId.substring(0, 8)}` : 'by ???';
        }

        // Countdown timer
        let countdown = 3;
        const timerEl = document.getElementById('respawn-timer');
        const interval = setInterval(() => {
            countdown--;
            if (timerEl) timerEl.textContent = countdown;
            if (countdown <= 0) clearInterval(interval);
        }, 1000);

        // Notify network
        if (this.network) {
            this.network.socket.emit('playerDeath', { killerId });
        }
    }

    respawn() {
        this.isDead = false;
        this.health = this.maxHealth;
        this.updateHealthHUD();

        // Random spawn point
        const spawn = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        this.rigidBody.setNextKinematicTranslation({ x: spawn.x, y: spawn.y, z: spawn.z });
        this.velocity.set(0, 0, 0);

        // Refill ammo
        this.weaponManager.ammo[this.weaponManager.currentWeaponKey] = this.weaponManager.currentWeapon.magSize;
        this.weaponManager.updateHUD();

        // Hide death screen
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) deathScreen.classList.remove('show');
    }

    addKill() {
        this.kills++;
        const killsEl = document.getElementById('kills-count');
        if (killsEl) killsEl.textContent = this.kills;
    }

    updateHealthHUD() {
        const fill = document.getElementById('health-fill');
        const text = document.getElementById('health-text');
        if (fill) {
            fill.style.width = `${this.health}%`;
            if (this.health < 30) {
                fill.classList.add('low');
            } else {
                fill.classList.remove('low');
            }
        }
        if (text) text.textContent = Math.ceil(this.health);
    }

    showHitMarker(isKill) {
        const hm = document.getElementById('hitmarker');
        if (!hm) return;
        hm.className = isKill ? 'show kill' : 'show';
        setTimeout(() => hm.className = '', 200);
    }

    addKillFeed(killer, killed, weapon) {
        const feed = document.getElementById('kill-feed');
        if (!feed) return;
        const entry = document.createElement('div');
        entry.className = 'kill-entry';
        entry.innerHTML = `<span class="killer">${killer}</span> <span class="weapon-icon">[${weapon}]</span> <span class="killed">${killed}</span>`;
        feed.appendChild(entry);
        setTimeout(() => { if (entry.parentNode) entry.parentNode.removeChild(entry); }, 4000);

        // Keep max 5 entries
        while (feed.children.length > 5) feed.removeChild(feed.firstChild);
    }

    update(dt) {
        if (!this.input.isLocked) return;

        // Handle death
        if (this.isDead) {
            if (performance.now() >= this.respawnTime) {
                this.respawn();
            }
            return;
        }

        this.handleMouse();
        this.handleMovement(dt);

        // Sync visuals to physics
        const pos = this.rigidBody.translation();
        this.mesh.position.set(pos.x, pos.y, pos.z);

        // Smooth camera
        const targetCamY = this.isSliding ? 0.0 : 0.6;
        this.camera.position.x = pos.x;
        this.camera.position.z = pos.z;
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, pos.y + targetCamY, dt * 10.0);

        // Weapon switching with number keys
        if (this.input.keys.Digit1) this.weaponManager.switchWeapon('ar');
        if (this.input.keys.Digit2) this.weaponManager.switchWeapon('smg');
        if (this.input.keys.Digit3) this.weaponManager.switchWeapon('shotgun');

        // Reload
        if (this.input.keys.KeyR) this.weaponManager.reload();

        // Update weapon state
        this.weaponManager.isAiming = this.input.mouse.right;
        this.weaponManager.update(dt, this.velocity, this.isGrounded, this.lastMouseDelta);
        this.lastMouseDelta = { x: 0, y: 0 };

        // Handle shooting
        const w = this.weaponManager.currentWeapon;
        if (w.auto) {
            // Full auto — hold to shoot
            if (this.input.mouse.left) {
                const hits = this.weaponManager.shoot();
                if (hits) this.processHits(hits);
            }
        } else {
            // Semi-auto — click per shot
            if (this.input.mouse.left && !this.shotHeld) {
                this.shotHeld = true;
                const hits = this.weaponManager.shoot();
                if (hits) this.processHits(hits);
            }
            if (!this.input.mouse.left) this.shotHeld = false;
        }

        // Health Regeneration
        if (performance.now() - this.lastDamageTime > this.healthRegenDelay && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + this.healthRegenRate * dt);
            this.updateHealthHUD();
        }
    }

    processHits(hits) {
        for (const hit of hits) {
            // Send damage to server
            if (this.network) {
                this.network.socket.emit('playerHit', {
                    targetId: hit.playerId,
                    damage: hit.damage,
                    headshot: hit.headshot,
                    weapon: this.weaponManager.currentWeapon.name
                });
            }
            this.showHitMarker(false);
        }
    }

    handleMouse() {
        const mouseMove = this.input.consumeMovement();
        this.lastMouseDelta = mouseMove;
        this.yaw -= mouseMove.x * this.mouseSensitivity;
        this.pitch -= mouseMove.y * this.mouseSensitivity;

        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));

        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        this.mesh.rotation.y = this.yaw;
    }

    handleMovement(dt) {
        const dir = new THREE.Vector3();
        if (this.input.keys.KeyW) dir.z -= 1;
        if (this.input.keys.KeyS) dir.z += 1;
        if (this.input.keys.KeyA) dir.x -= 1;
        if (this.input.keys.KeyD) dir.x += 1;

        dir.normalize();
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        // Slide Logic
        if (this.input.keys.KeyC && this.isGrounded && !this.isSliding && dir.lengthSq() > 0.1) {
            this.isSliding = true;
            this.slideTime = 0.6;
        }

        let currentSpeed = this.input.keys.ShiftLeft ? this.speed * this.sprintMult : this.speed;
        let slideMult = 1.0;

        if (this.isSliding) {
            this.slideTime -= dt;
            if (this.slideTime <= 0 || !this.input.keys.KeyC) {
                this.isSliding = false;
            } else {
                slideMult = 1.0 + (this.slideTime / 0.6) * 1.5;
            }
        }

        const moveSpeed = currentSpeed * slideMult;
        const desiredVelocity = dir.multiplyScalar(moveSpeed);

        if (this.isGrounded && this.input.keys.Space) {
            this.velocity.y = this.jumpForce;
        } else if (!this.isGrounded) {
            this.velocity.y += this.world.gravity.y * dt * 1.5;
        } else if (this.velocity.y < 0) {
            this.velocity.y = -1;
        }

        this.velocity.x = desiredVelocity.x;
        this.velocity.z = desiredVelocity.z;

        const movement = new this.RAPIER.Vector3(this.velocity.x * dt, this.velocity.y * dt, this.velocity.z * dt);
        this.characterController.computeColliderMovement(this.collider, movement);

        const computedMovement = this.characterController.computedMovement();

        const currentPos = this.rigidBody.translation();
        this.rigidBody.setNextKinematicTranslation({
            x: currentPos.x + computedMovement.x,
            y: currentPos.y + computedMovement.y,
            z: currentPos.z + computedMovement.z
        });

        this.isGrounded = this.characterController.computedGrounded();

        if (this.velocity.y > 0 && computedMovement.y < movement.y - 0.001) {
            this.velocity.y = 0;
        }
    }
}
