import * as THREE from 'three';

// ===== WEAPON DEFINITIONS =====
const WEAPONS = {
    ar: {
        name: 'ASSAULT RIFLE', slot: 1,
        damage: 22, headMult: 2.5, fireRate: 100, // ms between shots
        magSize: 30, reserveAmmo: 120, reloadTime: 2200,
        recoilZ: 0.035, recoilY: 0.012, cameraKick: 0.006,
        spread: 0.015, adsSpread: 0.003, auto: true,
        // Gun geometry builder
        build: (g) => {
            const gm = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.9 });
            const dk = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.4, metalness: 0.85 });
            const wd = new THREE.MeshStandardMaterial({ color: 0x4a2e14, roughness: 0.65, metalness: 0.1 });

            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.28), gm)); // receiver
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.2), dk);
            rail.position.set(0, 0.033, 0.02); g.add(rail);
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.32, 8), gm);
            barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.01, -0.30); g.add(barrel);
            const hg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.16), dk);
            hg.position.set(0, 0, -0.20); g.add(hg);
            const mz = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.013, 0.04, 8), dk);
            mz.rotation.x = Math.PI / 2; mz.position.set(0, 0.01, -0.48); g.add(mz);
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.055), gm);
            mag.position.set(0, -0.085, 0.02); mag.rotation.x = -0.08; g.add(mag);
            const stk = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.16), wd);
            stk.position.set(0, -0.005, 0.20); g.add(stk);
            const bp = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.015), dk);
            bp.position.set(0, -0.005, 0.28); g.add(bp);
            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.07, 0.035), dk);
            grip.position.set(0, -0.06, 0.08); grip.rotation.x = -0.25; g.add(grip);
            const fs = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.025, 0.004), gm);
            fs.position.set(0, 0.04, -0.26); g.add(fs);
            const rs = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.006), gm);
            rs.position.set(0, 0.042, 0.10); g.add(rs);
        }
    },
    smg: {
        name: 'SMG', slot: 2,
        damage: 15, headMult: 2.0, fireRate: 65,
        magSize: 35, reserveAmmo: 140, reloadTime: 1800,
        recoilZ: 0.025, recoilY: 0.008, cameraKick: 0.004,
        spread: 0.025, adsSpread: 0.008, auto: true,
        build: (g) => {
            const gm = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.35, metalness: 0.85 });
            const dk = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.8 });

            g.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.20), gm));
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.22, 8), gm);
            barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.008, -0.22); g.add(barrel);
            const mag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.10, 0.04), gm);
            mag.position.set(0, -0.075, 0); g.add(mag);
            const stk = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, 0.12), dk);
            stk.position.set(0, -0.008, 0.15); g.add(stk);
            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.06, 0.03), dk);
            grip.position.set(0, -0.05, 0.06); grip.rotation.x = -0.2; g.add(grip);
            const hg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.08), dk);
            hg.position.set(0, -0.005, -0.14); g.add(hg);
        }
    },
    shotgun: {
        name: 'SHOTGUN', slot: 3,
        damage: 12, headMult: 2.0, fireRate: 800,
        magSize: 6, reserveAmmo: 24, reloadTime: 2800,
        recoilZ: 0.12, recoilY: 0.04, cameraKick: 0.025,
        spread: 0.06, adsSpread: 0.03, auto: false,
        pellets: 8, // Shoots multiple pellets!
        build: (g) => {
            const gm = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.9 });
            const wd = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.6, metalness: 0.1 });
            const dk = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.4, metalness: 0.85 });

            const body = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.32), gm);
            g.add(body);
            const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.36, 8), gm);
            barrel1.rotation.x = Math.PI / 2; barrel1.position.set(0, 0.012, -0.34); g.add(barrel1);
            const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.36, 8), gm);
            barrel2.rotation.x = Math.PI / 2; barrel2.position.set(0, -0.012, -0.34); g.add(barrel2);
            const stk = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.055, 0.22), wd);
            stk.position.set(0, -0.005, 0.25); g.add(stk);
            const pump = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.10), dk);
            pump.position.set(0, -0.02, -0.18); g.add(pump);
            const grip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.07, 0.03), dk);
            grip.position.set(0, -0.055, 0.06); grip.rotation.x = -0.2; g.add(grip);
        }
    }
};

export class WeaponManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        this.isAiming = false;
        this.recoilOffset = new THREE.Vector3();
        this.targetRecoil = new THREE.Vector3();
        this.bobTime = 0;
        this.tracers = [];

        this.hipPosition = new THREE.Vector3(0.22, -0.18, -0.40);
        this.adsPosition = new THREE.Vector3(0.0, -0.16, -0.34);

        this.weaponGroup = new THREE.Group();
        this.weaponGroup.position.copy(this.hipPosition);
        this.camera.add(this.weaponGroup);

        // Muzzle flash light
        this.muzzleFlash = new THREE.PointLight(0xffaa44, 0, 5);
        this.muzzleFlash.position.set(0, 0.01, -0.5);
        this.weaponGroup.add(this.muzzleFlash);
        this.muzzleFlashTime = 0;

        // Weapon state
        this.currentWeaponKey = 'ar';
        this.weapons = {};
        this.ammo = {};
        this.reserve = {};
        this.isReloading = false;
        this.reloadStartTime = 0;

        // Init all weapons' ammo
        for (const key in WEAPONS) {
            this.ammo[key] = WEAPONS[key].magSize;
            this.reserve[key] = WEAPONS[key].reserveAmmo;
        }

        this.buildWeapon('ar');
        this.addHands();

        // Last shot tracking
        this.lastShotTime = 0;
        this.shotHeld = false;
    }

    get currentWeapon() { return WEAPONS[this.currentWeaponKey]; }

    addHands() {
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xc8956c, roughness: 0.7, metalness: 0.0 });
        const gloveMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8, metalness: 0.1 });

        // Right hand (trigger)
        const rh = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.06, 4, 8), gloveMat);
        rh.position.set(0.01, -0.07, 0.07); rh.rotation.x = Math.PI / 2.5;
        rh.name = '__hand'; this.weaponGroup.add(rh);

        // Right forearm
        const ra = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.18, 4, 8), skinMat);
        ra.position.set(0.06, -0.10, 0.18); ra.rotation.z = -0.4; ra.rotation.x = 0.3;
        ra.name = '__hand'; this.weaponGroup.add(ra);

        // Left hand (grip/handguard)
        const lh = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.06, 4, 8), gloveMat);
        lh.position.set(-0.01, -0.02, -0.22); lh.rotation.x = Math.PI / 2; lh.rotation.z = 0.1;
        lh.name = '__hand'; this.weaponGroup.add(lh);

        // Left forearm
        const la = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.16, 4, 8), skinMat);
        la.position.set(-0.07, -0.06, -0.14); la.rotation.z = 0.5; la.rotation.x = 0.2;
        la.name = '__hand'; this.weaponGroup.add(la);
    }

    buildWeapon(key) {
        // Remove old gun meshes (keep hands)
        const toRemove = [];
        this.weaponGroup.children.forEach(c => {
            if (c.name !== '__hand' && !(c instanceof THREE.PointLight)) toRemove.push(c);
        });
        toRemove.forEach(c => this.weaponGroup.remove(c));

        this.currentWeaponKey = key;
        const w = WEAPONS[key];
        w.build(this.weaponGroup);

        // Update HUD
        this.updateHUD();
    }

    switchWeapon(key) {
        if (key === this.currentWeaponKey) return;
        if (this.isReloading) return;
        this.buildWeapon(key);
        this.isReloading = false;

        // Highlight correct slot
        document.querySelectorAll('.weapon-slot').forEach(s => s.classList.remove('active'));
        const slot = document.getElementById(`slot-${WEAPONS[key].slot}`);
        if (slot) slot.classList.add('active');
    }

    reload() {
        const w = this.currentWeapon;
        if (this.isReloading) return;
        if (this.ammo[this.currentWeaponKey] >= w.magSize) return;
        if (this.reserve[this.currentWeaponKey] <= 0) return;

        this.isReloading = true;
        this.reloadStartTime = performance.now();

        const reloadBar = document.getElementById('reload-bar');
        if (reloadBar) reloadBar.classList.add('show');
    }

    finishReload() {
        const w = this.currentWeapon;
        const needed = w.magSize - this.ammo[this.currentWeaponKey];
        const available = Math.min(needed, this.reserve[this.currentWeaponKey]);
        this.ammo[this.currentWeaponKey] += available;
        this.reserve[this.currentWeaponKey] -= available;
        this.isReloading = false;

        const reloadBar = document.getElementById('reload-bar');
        if (reloadBar) reloadBar.classList.remove('show');
        this.updateHUD();
    }

    canShoot() {
        if (this.isReloading) return false;
        if (this.ammo[this.currentWeaponKey] <= 0) return false;
        if (performance.now() - this.lastShotTime < this.currentWeapon.fireRate) return false;
        return true;
    }

    shoot() {
        if (!this.canShoot()) {
            // Auto-reload if empty
            if (this.ammo[this.currentWeaponKey] <= 0 && !this.isReloading) {
                this.reload();
            }
            return null;
        }

        const w = this.currentWeapon;
        this.ammo[this.currentWeaponKey]--;
        this.lastShotTime = performance.now();

        // Recoil
        this.targetRecoil.z += w.recoilZ;
        this.targetRecoil.y += w.recoilY;
        this.camera.rotation.x += w.cameraKick;

        // Muzzle Flash
        this.muzzleFlash.intensity = 3;
        this.muzzleFlashTime = 0.05;

        // Create tracers
        const spread = this.isAiming ? w.adsSpread : w.spread;
        const pellets = w.pellets || 1;
        const hits = [];

        for (let p = 0; p < pellets; p++) {
            // Calculate aim direction with spread
            const aimDir = new THREE.Vector3(0, 0, -1);
            aimDir.x += (Math.random() - 0.5) * spread;
            aimDir.y += (Math.random() - 0.5) * spread;
            aimDir.applyQuaternion(this.camera.quaternion);
            aimDir.normalize();

            this.createTracer(aimDir);

            // Raycast for hit detection
            const ray = new THREE.Raycaster(this.camera.position.clone(), aimDir, 0.5, 200);
            const intersects = ray.intersectObjects(this.scene.children, true);

            for (const hit of intersects) {
                // Skip the local player's own meshes and weapon
                if (hit.object.name === '__hand') continue;
                if (this.weaponGroup.children.includes(hit.object)) continue;

                // Check if we hit a remote player
                if (hit.object.userData.playerId) {
                    const isHead = hit.point.y > (hit.object.userData.playerY || 0) + 1.4;
                    hits.push({
                        playerId: hit.object.userData.playerId,
                        damage: isHead ? w.damage * w.headMult : w.damage,
                        headshot: isHead,
                        point: hit.point.clone()
                    });
                }

                // Create bullet impact
                this.createImpact(hit.point, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0));
                break; // Only first hit counts
            }
        }

        // Update HUD
        this.updateHUD();

        // Auto-reload when empty
        if (this.ammo[this.currentWeaponKey] <= 0) {
            this.reload();
        }

        return hits.length > 0 ? hits : null;
    }

    createTracer(dir) {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.7 });
        const geo = new THREE.CylinderGeometry(0.01, 0.01, 12, 4);
        geo.rotateX(Math.PI / 2);
        const tracer = new THREE.Mesh(geo, mat);

        const barrelPos = new THREE.Vector3(0, -0.02, -0.5);
        barrelPos.applyMatrix4(this.weaponGroup.matrixWorld);

        tracer.position.copy(barrelPos).addScaledVector(dir, 8);
        tracer.quaternion.copy(this.camera.quaternion);

        this.scene.add(tracer);
        this.tracers.push({ mesh: tracer, age: 0, dir });
    }

    createImpact(point, normal) {
        // Spark particles
        const count = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.02, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xffaa44 : 0xffcc88 });
            const spark = new THREE.Mesh(geo, mat);
            spark.position.copy(point);
            this.scene.add(spark);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 3
            );
            this.tracers.push({ mesh: spark, age: 0, dir: vel, isSpark: true, gravity: true });
        }

        // Bullet hole decal (a dark circle on surfaces)
        const decalGeo = new THREE.CircleGeometry(0.04, 8);
        const decalMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const decal = new THREE.Mesh(decalGeo, decalMat);
        decal.position.copy(point).addScaledVector(normal, 0.01);
        decal.lookAt(point.clone().add(normal));
        this.scene.add(decal);

        // Remove decal after 10 seconds
        setTimeout(() => this.scene.remove(decal), 10000);
    }

    updateHUD() {
        const w = this.currentWeapon;
        const nameEl = document.getElementById('weapon-name');
        const curEl = document.getElementById('ammo-current');
        const resEl = document.getElementById('ammo-reserve');
        if (nameEl) nameEl.textContent = w.name;
        if (curEl) curEl.textContent = this.ammo[this.currentWeaponKey];
        if (resEl) resEl.textContent = this.reserve[this.currentWeaponKey];
    }

    update(dt, velocity, isGrounded, mouseDelta) {
        const targetPos = this.isAiming ? this.adsPosition : this.hipPosition;
        const lerpSpeed = 15.0;

        // Weapon sway from mouse
        const swayX = THREE.MathUtils.lerp(0, -mouseDelta.x * 0.0004, 0.1);
        const swayY = THREE.MathUtils.lerp(0, mouseDelta.y * 0.0004, 0.1);

        // Weapon bob from movement
        const speed = Math.hypot(velocity.x, velocity.z);
        if (isGrounded && speed > 0.5) {
            this.bobTime += dt * speed * 0.8;
        } else {
            this.bobTime += (0 - this.bobTime) * dt * 5.0;
        }

        const bobScale = this.isAiming ? 0.15 : 1;
        const bobX = Math.cos(this.bobTime) * 0.012 * bobScale;
        const bobY = Math.abs(Math.sin(this.bobTime)) * 0.012 * bobScale;

        // Recoil recovery
        this.targetRecoil.lerp(new THREE.Vector3(), dt * 10.0);
        this.recoilOffset.lerp(this.targetRecoil, dt * 20.0);

        // Final weapon position
        this.weaponGroup.position.lerp(
            targetPos.clone().add(new THREE.Vector3(bobX, bobY, 0)).add(this.recoilOffset),
            dt * lerpSpeed
        );

        this.weaponGroup.rotation.y = swayX;
        this.weaponGroup.rotation.x = swayY + this.recoilOffset.y;

        // Muzzle flash fade
        if (this.muzzleFlashTime > 0) {
            this.muzzleFlashTime -= dt;
            if (this.muzzleFlashTime <= 0) this.muzzleFlash.intensity = 0;
        }

        // Reload progress
        if (this.isReloading) {
            const elapsed = performance.now() - this.reloadStartTime;
            const progress = Math.min(elapsed / this.currentWeapon.reloadTime, 1);
            const fill = document.getElementById('reload-fill');
            if (fill) fill.style.width = `${progress * 100}%`;
            if (progress >= 1) this.finishReload();
        }

        // Update tracers & sparks
        for (let i = this.tracers.length - 1; i >= 0; i--) {
            const t = this.tracers[i];
            t.age += dt;

            if (t.isSpark) {
                t.mesh.position.addScaledVector(t.dir, dt);
                if (t.gravity) t.dir.y -= 9.8 * dt;
                t.mesh.material.opacity = 1 - t.age * 4;
                if (t.age > 0.4) {
                    this.scene.remove(t.mesh);
                    this.tracers.splice(i, 1);
                }
            } else {
                t.mesh.position.addScaledVector(t.dir, dt * 300.0);
                t.mesh.material.opacity = 1 - t.age * 5;
                if (t.age > 0.2) {
                    this.scene.remove(t.mesh);
                    this.tracers.splice(i, 1);
                }
            }
        }
    }
}
