import * as THREE from 'three';

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        this.scene = new THREE.Scene();
        // A dark, modern aesthetic sky color
        this.scene.background = new THREE.Color(0x0a0a14); 
        this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.015);

        // Standard FPS FOV (75 is common, Krunker uses around 80-90)
        this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            powerPreference: "high-performance" // Ensure we use the dedicated GPU
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        window.addEventListener('resize', () => this.onWindowResize());
        
        this.clock = new THREE.Clock();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    startLoop(updateCallback) {
        this.renderer.setAnimationLoop(() => {
            // Cap delta time to 0.1s to prevent physics explosions if the tab lags
            const dt = Math.min(this.clock.getDelta(), 0.1); 
            
            if (updateCallback) updateCallback(dt);
            
            this.renderer.render(this.scene, this.camera);
        });
    }
}
