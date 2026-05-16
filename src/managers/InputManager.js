export class InputManager {
    constructor() {
        this.keys = {
            KeyW: false, KeyA: false, KeyS: false, KeyD: false,
            Space: false, ShiftLeft: false, KeyC: false // C for sliding
        };
        this.mouse = { left: false, right: false };
        this.movement = { x: 0, y: 0 }; 
        this.isLocked = false;
        
        this.onLock = null;
        this.onUnlock = null;

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    onKeyDown(e) { 
        if (this.keys.hasOwnProperty(e.code)) {
            this.keys[e.code] = true; 
        }
    }
    
    onKeyUp(e) { 
        if (this.keys.hasOwnProperty(e.code)) {
            this.keys[e.code] = false; 
        }
    }
    
    onMouseMove(e) {
        if (!this.isLocked) return;
        this.movement.x = e.movementX || 0;
        this.movement.y = e.movementY || 0;
    }

    onMouseDown(e) {
        if (!this.isLocked) return;
        if (e.button === 0) this.mouse.left = true;
        if (e.button === 2) this.mouse.right = true;
    }

    onMouseUp(e) {
        if (e.button === 0) this.mouse.left = false;
        if (e.button === 2) this.mouse.right = false;
    }

    lockPointer() {
        document.body.requestPointerLock();
    }

    onPointerLockChange() {
        this.isLocked = document.pointerLockElement === document.body;
        if (this.isLocked && this.onLock) this.onLock();
        if (!this.isLocked && this.onUnlock) {
            // Unlocked, zero out keys so we don't keep running
            for(let key in this.keys) this.keys[key] = false;
            this.onUnlock();
        }
    }

    // Fetches and immediately resets the mouse delta
    consumeMovement() {
        const mov = { x: this.movement.x, y: this.movement.y };
        this.movement.x = 0;
        this.movement.y = 0;
        return mov;
    }
}
