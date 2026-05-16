import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class WeaponManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        
        this.isAiming = false;
        this.recoilOffset = new THREE.Vector3();
        this.targetRecoil = new THREE.Vector3();
        this.swayAmount = 0;
        this.bobTime = 0;

        this.hipPosition = new THREE.Vector3(0.18, -0.22, -0.42);
        this.adsPosition = new THREE.Vector3(0.01, -0.19, -0.36);
        
        this.weaponGroup = new THREE.Group();
        this.weaponGroup.position.copy(this.hipPosition);
        this.camera.add(this.weaponGroup);

        this.initWeapon();
    }

    initWeapon() {
        const loader = new GLTFLoader();
        loader.load('/models/weapon_primary.glb', (gltf) => {
            this.mesh = gltf.scene;
            // Scaled up x5 based on feedback
            this.mesh.scale.set(0.5, 0.5, 0.5); 
            
            // We set it to -Math.PI/2 and it was reverse, so Math.PI/2 was actually the correct forward direction!
            this.mesh.rotation.set(0, Math.PI / 2, 0);

            // Add tactical "hands" (gloves) holding the gun
            const handGeo = new THREE.CapsuleGeometry(0.04, 0.15, 4, 8);
            const handMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }); // Black tactical gloves
            
            // Right hand (Trigger)
            const rightHand = new THREE.Mesh(handGeo, handMat);
            rightHand.position.set(0.02, -0.1, 0.05); 
            rightHand.rotation.x = Math.PI / 2.2;
            this.weaponGroup.add(rightHand);

            // Left hand (Barrel/Grip)
            const leftHand = new THREE.Mesh(handGeo, handMat);
            leftHand.position.set(-0.05, -0.05, -0.35);
            leftHand.rotation.x = Math.PI / 2;
            leftHand.rotation.z = Math.PI / 8;
            this.weaponGroup.add(leftHand);
            
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.weaponGroup.add(this.mesh);
        });
    }

    shoot() {
        this.targetRecoil.z += 0.05;
        this.targetRecoil.y += 0.02;
        this.camera.rotation.x += 0.01;
        this.createTracer();
    }

    createTracer() {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const geo = new THREE.CylinderGeometry(0.02, 0.02, 20, 4);
        geo.rotateX(Math.PI / 2);
        const tracer = new THREE.Mesh(geo, mat);
        
        // Get barrel position
        const barrelPos = new THREE.Vector3(0, -0.05, -0.6);
        barrelPos.applyMatrix4(this.weaponGroup.matrixWorld);
        
        const aimDir = new THREE.Vector3(0, 0, -1);
        aimDir.applyQuaternion(this.camera.quaternion);
        
        // Start tracer slightly ahead of barrel so it doesn't clip camera
        tracer.position.copy(barrelPos).addScaledVector(aimDir, 10);
        tracer.quaternion.copy(this.camera.quaternion);
        
        this.scene.add(tracer);
        if(!this.tracers) this.tracers = [];
        this.tracers.push({ mesh: tracer, age: 0, dir: aimDir });
    }

    update(dt, velocity, isGrounded, mouseDelta) {
        const targetPos = this.isAiming ? this.adsPosition : this.hipPosition;
        const lerpSpeed = 15.0;
        
        const swayX = THREE.MathUtils.lerp(0, -mouseDelta.x * 0.0005, 0.1);
        const swayY = THREE.MathUtils.lerp(0, mouseDelta.y * 0.0005, 0.1);
        
        const speed = Math.hypot(velocity.x, velocity.z);
        if (isGrounded && speed > 0.5) {
            this.bobTime += dt * speed * 0.8;
        } else {
            this.bobTime += (0 - this.bobTime) * dt * 5.0;
        }
        
        const bobX = Math.cos(this.bobTime) * 0.02 * (this.isAiming ? 0.2 : 1);
        const bobY = Math.abs(Math.sin(this.bobTime)) * 0.02 * (this.isAiming ? 0.2 : 1);

        this.targetRecoil.lerp(new THREE.Vector3(), dt * 10.0);
        this.recoilOffset.lerp(this.targetRecoil, dt * 20.0);

        this.weaponGroup.position.lerp(
            targetPos.clone().add(new THREE.Vector3(bobX, bobY, 0)).add(this.recoilOffset),
            dt * lerpSpeed
        );

        this.weaponGroup.rotation.y = swayX;
        this.weaponGroup.rotation.x = swayY + this.recoilOffset.y;

        // Update Tracers
        if(this.tracers) {
            for(let i = this.tracers.length - 1; i >= 0; i--) {
                const t = this.tracers[i];
                t.age += dt;
                t.mesh.position.addScaledVector(t.dir, dt * 300.0); // Super fast bullet
                if(t.age > 0.3) {
                    this.scene.remove(t.mesh);
                    this.tracers.splice(i, 1);
                }
            }
        }
    }
}
