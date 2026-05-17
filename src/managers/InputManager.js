export class InputManager {
    constructor() {
        this.keys = {
            KeyW: false, KeyA: false, KeyS: false, KeyD: false,
            Space: false, ShiftLeft: false, KeyC: false,
            KeyR: false, // Reload
            Digit1: false, Digit2: false, Digit3: false // Weapon slots
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

        // Mouse wheel for weapon switching
        document.addEventListener('wheel', (e) => this.onWheel(e));
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

    onWheel(e) {
        // Scroll up/down to cycle weapons
        if (!this.isLocked) return;
        if (e.deltaY < 0) {
            // Scroll up - previous weapon
            this._scrollDir = -1;
        } else {
            // Scroll down - next weapon
            this._scrollDir = 1;
        }
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
            this.mouse.left = false;
            this.mouse.right = false;
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

    consumeScrollDir() {
        const dir = this._scrollDir || 0;
        this._scrollDir = 0;
        return dir;
    }
}
