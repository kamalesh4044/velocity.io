import RAPIER from '@dimforge/rapier3d-compat';

export class Physics {
    constructor() {
        this.world = null;
        this.RAPIER = null;
    }

    async init() {
        await RAPIER.init();
        this.RAPIER = RAPIER;
        
        // Slightly higher gravity than Earth (-9.81) for snappier, arcade-like FPS jumping
        const gravity = { x: 0.0, y: -25.0, z: 0.0 }; 
        this.world = new this.RAPIER.World(gravity);
    }

    step() {
        if (this.world) {
            this.world.step();
        }
    }

    // Creates a large ground plane
    addStaticPlane(normal, offset) {
        // Rapier JS doesn't support halfspace reliably, so we use a huge thin cuboid
        let groundColliderDesc = this.RAPIER.ColliderDesc.cuboid(1000.0, 0.1, 1000.0).setTranslation(0, offset - 0.1, 0);
        this.world.createCollider(groundColliderDesc);
    }

    // Creates a physical block in the world
    addStaticBox(position, halfExtents) {
        let rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z);
        let rigidBody = this.world.createRigidBody(rigidBodyDesc);
        let colliderDesc = this.RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
        this.world.createCollider(colliderDesc, rigidBody);
    }

    // Converts a Three.js Mesh into a pixel-perfect Rapier physics collider
    addStaticMesh(mesh) {
        mesh.updateMatrixWorld(true);
        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld);

        const vertices = new Float32Array(geometry.attributes.position.array);
        let indices;
        if (geometry.index) {
            indices = new Uint32Array(geometry.index.array);
        } else {
            indices = new Uint32Array(vertices.length / 3);
            for (let i = 0; i < indices.length; i++) indices[i] = i;
        }

        let rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed();
        let rigidBody = this.world.createRigidBody(rigidBodyDesc);
        let colliderDesc = this.RAPIER.ColliderDesc.trimesh(vertices, indices);
        this.world.createCollider(colliderDesc, rigidBody);
    }
}
