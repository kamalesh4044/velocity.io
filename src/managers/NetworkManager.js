import { io } from 'socket.io-client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        
        // If running Vite dev server locally, connect to port 3000.
        // If deployed on Render, connect dynamically to itself!
        const isLocalDev = window.location.port === '5173';
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


    }

    updatePlayerCount() {
        const countElem = document.getElementById('player-count');
        if(countElem) {
            countElem.innerText = `PLAYERS: ${Object.keys(this.remotePlayers).length + 1}`;
        }
    }

    addPlayer(id, state) {
        // Immediate temporary red box so we see them while Punk loads
        const tempGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
        const tempMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
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

        // Load Punk.glb fresh for this specific player to avoid SkinnedMesh clone bugs
        const loader = new GLTFLoader();
        loader.load('/models/Punk.glb', (gltf) => {
            // If player disconnected before it finished loading, don't add it
            if(!this.remotePlayers[id]) return;
            
            const p = this.remotePlayers[id];
            this.scene.remove(p.mesh); // Remove red box

            const model = gltf.scene;
            // Use standard scaling for Mixamo GLBs
            model.scale.set(0.8, 0.8, 0.8);
            model.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
            model.position.copy(p.targetPosition);
            
            this.scene.add(model);
            p.mesh = model;

            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                // Play the first animation (e.g. idle or walk)
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                this.mixers.push(mixer);
                p.mixer = mixer;
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
            p.mesh.position.lerp(p.targetPosition, dt * 15.0);
            p.mesh.rotation.y = p.targetRotationY;
        }
    }
}
