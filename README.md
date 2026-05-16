# Velocity.io

A high-performance, competitive multiplayer browser-based FPS game built with **Three.js**, **Rapier3D Physics**, and **Socket.io**.

## Features
- 🏃‍♂️ **Kinematic Character Controller**: Pixel-perfect collision detection, stair-stepping, and momentum-based slide-hopping mechanics.
- 🔫 **Procedural Weapon Mechanics**: Dynamic weapon bobbing, swaying, recoil kicks, and Aim-Down-Sights (ADS).
- 🌐 **Real-time Multiplayer**: Powered by Socket.io with smooth client-side interpolation and dynamically loaded GLB player models.
- 🗺️ **Triangle-Level Map Collision**: Parses 3D `.glb` arenas to construct exact physical hitboxes for floors, ramps, and walls.

## Quick Start
```bash
# Install dependencies
npm install

# Run the frontend game client (Vite)
npm run dev

# Start the multiplayer sync server (in a separate terminal)
node server.js
```

## Technologies Used
- **Frontend**: Vite, Three.js, GLTFLoader
- **Physics**: @dimforge/rapier3d-compat
- **Backend**: Node.js, Express, Socket.io

## License
This project is licensed under the MIT License.
