import { Engine } from './core/Engine.js';
import { Physics } from './core/Physics.js';
import { InputManager } from './managers/InputManager.js';
import { Player } from './entities/Player.js';
import { NetworkManager } from './managers/NetworkManager.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let engine, physics, input, player, network;

async function init() {
    // 1. Init Core Engine (Three.js Renderer/Camera/Scene)
    engine = new Engine('game-canvas');
    
    // 2. Init Physics World (Rapier3D WASM)
    physics = new Physics();
    await physics.init();

    // 3. Build a Test Environment
    createTestArena();

    // 4. Init Input Manager
    input = new InputManager();

    // 5. Init Player (Kinematic Character Controller)
    player = new Player(engine.scene, engine.camera, physics, input);

    // 6. Init Multiplayer Networking
    network = new NetworkManager(engine.scene);

    // Setup "Click to Play" overlay logic
    const blocker = document.getElementById('click-to-play');
    blocker.addEventListener('click', () => {
        input.lockPointer();
    });
    
    input.onLock = () => blocker.style.opacity = '0';
    input.onUnlock = () => blocker.style.opacity = '1';

    // 6. Start Main Game Loop
    engine.startLoop(update);
}

function createTestArena() {
    // Load the 3D Map
    const loader = new GLTFLoader();
    loader.load('/models/map.glb', (gltf) => {
        const mapMesh = gltf.scene;
        engine.scene.add(mapMesh);

        // Convert the entire map into perfect triangle-level physics collision!
        mapMesh.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
                physics.addStaticMesh(child);
            }
        });
    });
    
    // Lighting setup to make it look premium
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    engine.scene.add(ambient);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    engine.scene.add(dirLight);
}

function update(dt) {
    // Step the physics world forward
    physics.step();
    
    // Update the player logic (movement, camera, jumping)
    player.update(dt);
    
    if (network && player.rigidBody) {
        network.sendUpdate(player.rigidBody.translation(), player.yaw, player.pitch);
        network.update(dt);
    }
}

// Bootstrap the game
init();
