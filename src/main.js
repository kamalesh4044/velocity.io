import { Engine } from './core/Engine.js';
import { Physics } from './core/Physics.js';
import { InputManager } from './managers/InputManager.js';
import { Player } from './entities/Player.js';
import { NetworkManager } from './managers/NetworkManager.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let engine, physics, input, player, network;

async function init() {
    // 1. Init Core Engine
    engine = new Engine('game-canvas');
    
    // 2. Init Physics World
    physics = new Physics();
    await physics.init();

    // 3. Build the Map
    createTestArena();

    // 4. Init Input Manager
    input = new InputManager();

    // 5. Init Player (pass network ref later)
    player = new Player(engine.scene, engine.camera, physics, input, null);

    // 6. Init Multiplayer Networking (pass player for damage callbacks)
    network = new NetworkManager(engine.scene, player);
    player.network = network; // Wire up the circular reference

    // Setup "Click to Play" overlay
    const blocker = document.getElementById('click-to-play');
    blocker.addEventListener('click', () => {
        input.lockPointer();
    });
    
    input.onLock = () => {
        blocker.style.opacity = '0';
        blocker.style.pointerEvents = 'none';
    };
    input.onUnlock = () => {
        blocker.style.opacity = '1';
        blocker.style.pointerEvents = 'auto';
    };

    // 7. Start Main Game Loop
    engine.startLoop(update);
}

function createTestArena() {
    // Load the 3D Map
    const loader = new GLTFLoader();
    loader.load('/models/map.glb', (gltf) => {
        const mapMesh = gltf.scene;
        engine.scene.add(mapMesh);

        // Convert the map into physics collision
        mapMesh.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
                physics.addStaticMesh(child);
            }
        });
    });
    
    // Premium lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    engine.scene.add(ambient);
    
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    engine.scene.add(dirLight);

    // Add a subtle hemisphere light for better ambient color
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362a1e, 0.3);
    engine.scene.add(hemi);
}

function update(dt) {
    // Step the physics world
    physics.step();
    
    // Update the player
    player.update(dt);
    
    // Network sync
    if (network && player.rigidBody) {
        network.sendUpdate(player.rigidBody.translation(), player.yaw, player.pitch);
        network.update(dt);
    }
}

// Bootstrap the game
init();
