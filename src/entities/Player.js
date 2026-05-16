import * as THREE from 'three';
import { WeaponManager } from '../managers/WeaponManager.js';

export class Player {
    constructor(scene, camera, physics, input) {
        this.scene = scene;
        this.camera = camera;
        this.physics = physics;
        this.world = physics.world;
        this.RAPIER = physics.RAPIER;
        this.input = input;

        // Core FPS Configuration (Tuned for normal map scales)
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

        this.initPhysics();
        this.initVisuals(); 
    }

    initPhysics() {
        // Create a Kinematic rigid body. This gives us TOTAL control over movement
        // instead of relying on forces (which feels floaty/slippery).
        let rigidBodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 5, 0);
        this.rigidBody = this.world.createRigidBody(rigidBodyDesc);

        // The "Capsule": The standard FPS hitbox shape
        // radius: 0.4, halfHeight: 0.5 -> total height 1.8 units
        let colliderDesc = this.RAPIER.ColliderDesc.capsule(0.5, 0.4);
        this.collider = this.world.createCollider(colliderDesc, this.rigidBody);

        // Rapier's built-in Character Controller handles stairs and slipping along walls!
        const offset = 0.05; // Skin width to prevent snagging
        this.characterController = this.world.createCharacterController(offset);
        this.characterController.enableAutostep(0.3, 0.2, true); // Step height
        this.characterController.enableSnapToGround(0.3); // Prevents bouncing downstairs
    }

    initVisuals() {
        // Temporary Wireframe Capsule for debugging
        const geo = new THREE.CapsuleGeometry(0.4, 1.0, 4, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, visible: false }); // hidden so it doesn't block camera
        this.mesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.mesh);

        // Attach camera to the "head" (+0.6 from center)
        this.camera.position.set(0, 0.6, 0); 
        this.scene.add(this.camera);

        // Init Weapon
        this.weaponManager = new WeaponManager(this.camera, this.scene);
        this.lastShotTime = 0;
        this.fireRate = 100; // ms per shot
    }

    update(dt) {
        if (!this.input.isLocked) return;

        this.handleMouse();
        this.handleMovement(dt);
        
        // Sync visuals to the physics engine's computed position
        const pos = this.rigidBody.translation();
        this.mesh.position.set(pos.x, pos.y, pos.z);
        
        // Smooth camera drop when sliding
        const targetCamY = this.isSliding ? 0.0 : 0.6;
        this.camera.position.x = pos.x;
        this.camera.position.z = pos.z;
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, pos.y + targetCamY, dt * 10.0);

        // Update Weapon State
        this.weaponManager.isAiming = this.input.mouse.right;
        this.weaponManager.update(dt, this.velocity, this.isGrounded, this.lastMouseDelta);
        this.lastMouseDelta = { x: 0, y: 0 }; // Consume it after passing to weapon

        // Handle Shooting
        if (this.input.mouse.left && performance.now() - this.lastShotTime > this.fireRate) {
            this.weaponManager.shoot();
            this.lastShotTime = performance.now();
        }
    }

    handleMouse() {
        const mouseMove = this.input.consumeMovement();
        this.lastMouseDelta = mouseMove;
        this.yaw -= mouseMove.x * this.mouseSensitivity;
        this.pitch -= mouseMove.y * this.mouseSensitivity;
        
        // Clamp looking up and down so you don't snap your neck
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));

        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        this.mesh.rotation.y = this.yaw; 
    }

    handleMovement(dt) {
        // 1. Calculate desired movement direction from WASD
        const dir = new THREE.Vector3();
        if (this.input.keys.KeyW) dir.z -= 1;
        if (this.input.keys.KeyS) dir.z += 1;
        if (this.input.keys.KeyA) dir.x -= 1;
        if (this.input.keys.KeyD) dir.x += 1;
        
        dir.normalize();
        
        // Rotate the movement vector by our current camera yaw
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        // Slide Logic
        if (this.input.keys.KeyC && this.isGrounded && !this.isSliding && dir.lengthSq() > 0.1) {
            this.isSliding = true;
            this.slideTime = 0.6; // 0.6 seconds slide duration
        }

        let currentSpeed = this.input.keys.ShiftLeft ? this.speed * this.sprintMult : this.speed;
        let slideMult = 1.0;

        if (this.isSliding) {
            this.slideTime -= dt;
            if (this.slideTime <= 0 || !this.input.keys.KeyC) {
                this.isSliding = false;
            } else {
                // Slide momentum boost that decays
                slideMult = 1.0 + (this.slideTime / 0.6) * 1.5; 
            }
        }

        const moveSpeed = currentSpeed * slideMult;

        // 2. Apply X/Z Velocity (Snappy, no inertia yet)
        const desiredVelocity = dir.multiplyScalar(moveSpeed);
        
        // 3. Apply Y Velocity (Gravity & Jumping)
        if (this.isGrounded && this.input.keys.Space) {
            this.velocity.y = this.jumpForce;
        } else if (!this.isGrounded) {
            // Apply gravity over time
            this.velocity.y += this.world.gravity.y * dt * 1.5; 
        } else if (this.velocity.y < 0) {
            // Glue to the floor when grounded
            this.velocity.y = -1; 
        }

        this.velocity.x = desiredVelocity.x;
        this.velocity.z = desiredVelocity.z;

        // 4. Compute movement via Rapier's Character Controller
        const movement = new this.RAPIER.Vector3(this.velocity.x * dt, this.velocity.y * dt, this.velocity.z * dt);
        this.characterController.computeColliderMovement(this.collider, movement);

        const computedMovement = this.characterController.computedMovement();
        
        // 5. Apply the safe movement back to the body
        const currentPos = this.rigidBody.translation();
        this.rigidBody.setNextKinematicTranslation({
            x: currentPos.x + computedMovement.x,
            y: currentPos.y + computedMovement.y,
            z: currentPos.z + computedMovement.z
        });

        // 6. Update Grounded State
        this.isGrounded = this.characterController.computedGrounded();
        
        // Reset vertical velocity if we hit our head on a ceiling
        if (this.velocity.y > 0 && computedMovement.y < movement.y - 0.001) {
            this.velocity.y = 0;
        }
    }
}
