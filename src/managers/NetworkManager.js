import { io } from 'socket.io-client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class NetworkManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player; // Reference to local player for damage callbacks

        // Connect to local port 3000 if running locally, otherwise connect to origin
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.socket = isLocalDev ? io('ws://localhost:3000') : io();
        this.remotePlayers = {};
        this.mixers = [];
        this.setupListeners();
    }

    setupListeners() {
        this.socket.on('init', (players) => {
            for (let id in players) {
                if (id !== this.socket.id) this.addPlayer(id, players[id]);
            }
            this.updatePlayerCount();
        });

        this.socket.on('playerJoin', (data) => {
            this.addPlayer(data.id, data.state);
        });

        this.socket.on('playerUpdate', (data) => {
            if (this.remotePlayers[data.id]) {
                const p = this.remotePlayers[data.id];
                p.targetPosition.set(data.state.x, data.state.y - 0.9, data.state.z);
                p.targetRotationY = data.state.yaw;
            }
        });

        this.socket.on('playerLeave', (id) => {
            if (this.remotePlayers[id]) {
                const p = this.remotePlayers[id];
                this.scene.remove(p.mesh);
                if (p.mixer) {
                    const index = this.mixers.indexOf(p.mixer);
                    if (index > -1) this.mixers.splice(index, 1);
                }
                delete this.remotePlayers[id];
                this.updatePlayerCount();
            }
        });

        // === COMBAT EVENTS ===
        this.socket.on('youWereHit', (data) => {
            // Server confirms we got hit
            if (this.player) {
                this.player.takeDamage(data.damage, data.attackerId);
            }
        });

        this.socket.on('youKilledPlayer', (data) => {
            // We killed someone!
            if (this.player) {
                this.player.addKill();
                this.player.showHitMarker(true); // Kill marker (red X)
                this.player.addKillFeed('You', data.targetId.substring(0, 8), data.weapon);
            }
        });

        this.socket.on('playerKilledBy', (data) => {
            // Someone killed someone else (for kill feed)
            if (this.player) {
                this.player.addKillFeed(
                    data.killerId.substring(0, 8),
                    data.targetId.substring(0, 8),
                    data.weapon
                );
            }
        });

        this.socket.on('playerRespawned', (data) => {
            // Remote player respawned — update their position
            if (this.remotePlayers[data.id]) {
                const p = this.remotePlayers[data.id];
                p.targetPosition.set(data.state.x, data.state.y - 0.9, data.state.z);
            }
        });
    }

    updatePlayerCount() {
        const countElem = document.getElementById('player-count');
        if(countElem) {
            countElem.innerText = `PLAYERS: ${Object.keys(this.remotePlayers).length + 1}`;
        }
    }

    /**
     * Creates a simple procedural rifle mesh to attach to the soldier's hand.
     */
    createGunMesh() {
        const gunGroup = new THREE.Group();
        const gunMetal = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.8 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.7, metalness: 0.1 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.3), gunMetal);
        body.position.set(0, 0, 0.05); gunGroup.add(body);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 8), gunMetal);
        barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.015, 0.35); gunGroup.add(barrel);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.06), gunMetal);
        mag.position.set(0, -0.08, 0.05); mag.rotation.x = -0.1; gunGroup.add(mag);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.18), woodMat);
        stock.position.set(0, -0.01, -0.15); gunGroup.add(stock);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.03), gunMetal);
        grip.position.set(0, -0.06, -0.02); grip.rotation.x = -0.3; gunGroup.add(grip);

        return gunGroup;
    }

    addPlayer(id, state) {
        // Placeholder box while model loads
        const tempGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
        const tempMat = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
        const mesh = new THREE.Mesh(tempGeo, tempMat);
        mesh.position.set(state.x, state.y - 0.9, state.z);
        this.scene.add(mesh);

        this.remotePlayers[id] = {
            mixer: null,
            mesh: mesh,
            targetPosition: new THREE.Vector3(state.x, state.y - 0.9, state.z),
            targetRotationY: state.yaw
        };

        this.updatePlayerCount();

        // Load the Soldier.glb model
        const loader = new GLTFLoader();
        loader.load('/models/Soldier.glb', (gltf) => {
            if(!this.remotePlayers[id]) return;

            const p = this.remotePlayers[id];
            this.scene.remove(p.mesh);

            const model = gltf.scene;
            model.scale.set(1.0, 1.0, 1.0);
            model.traverse(c => {
                if(c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                    // Tag all meshes with the player's ID for hit detection!
                    c.userData.playerId = id;
                    c.userData.playerY = state.y - 0.9;
                }
            });
            model.position.copy(p.targetPosition);

            this.scene.add(model);
            p.mesh = model;

            // Setup animation state machine
            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                p.mixer = mixer;

                const getAnim = (name) => {
                    const clip = gltf.animations.find(a => a.name === name);
                    return clip ? mixer.clipAction(clip) : null;
                };

                p.actions = {
                    idle: getAnim('Idle'),
                    walk: getAnim('Walk'),
                    run: getAnim('Run')
                };

                if (p.actions.idle) {
                    p.currentAction = p.actions.idle;
                    p.currentAction.play();
                }
                this.mixers.push(mixer);
            }

            // Attach procedural rifle to right hand bone
            let rightHand = null;
            model.traverse(child => {
                if (child.isBone && child.name === 'mixamorig:RightHand') {
                    rightHand = child;
                }
            });

            if (rightHand) {
                const gun = this.createGunMesh();
                rightHand.add(gun);
                gun.position.set(0, 0.1, 0.05);
                gun.rotation.set(-Math.PI / 2, 0, 0);
            }
        });
    }

    sendUpdate(pos, yaw, pitch) {
        this.socket.emit('updateState', { x: pos.x, y: pos.y, z: pos.z, yaw, pitch });
    }

    update(dt) {
        for (let i = 0; i < this.mixers.length; i++) {
            this.mixers[i].update(dt);
        }

        for (let id in this.remotePlayers) {
            const p = this.remotePlayers[id];

            const dist = p.mesh.position.distanceTo(p.targetPosition);
            p.mesh.position.lerp(p.targetPosition, dt * 15.0);
            p.mesh.rotation.y = p.targetRotationY;

            // Update userData.playerY for headshot detection
            p.mesh.traverse(c => {
                if (c.isMesh && c.userData.playerId) {
                    c.userData.playerY = p.mesh.position.y;
                }
            });

            // Animate based on movement speed
            if (p.mixer && p.actions) {
                const speed = dist / Math.max(dt, 0.001);
                let targetAction;
                if (speed > 5.0) {
                    targetAction = p.actions.run;
                } else if (speed > 0.5) {
                    targetAction = p.actions.walk;
                } else {
                    targetAction = p.actions.idle;
                }

                if (targetAction && p.currentAction !== targetAction) {
                    if (p.currentAction) p.currentAction.fadeOut(0.2);
                    targetAction.reset().fadeIn(0.2).play();
                    p.currentAction = targetAction;
                }
            }
        }
    }
}
