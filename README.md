<div align="center">

# 🔫 Velocity.io
**High-Performance Multiplayer Browser FPS**

[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

Velocity.io is a fast-paced, competitive multiplayer first-person shooter built entirely for the browser. It leverages the raw power of **Three.js** for rendering, **Rapier3D** for pixel-perfect physics, and **Socket.io** for real-time multiplayer synchronization.

</div>

---

## 🎮 Gameplay Preview

<div align="center">
  <img src="docs/images/gameplay1.png" alt="Velocity.io Gameplay" width="80%">
  <br><br>
  <img src="docs/images/gameplay2.png" alt="In-Game Action" width="45%">
  <img src="docs/images/gameplay3.png" alt="Combat" width="45%">
</div>

---

## ✨ Core Features

- 🏃‍♂️ **Kinematic Character Controller**: Pixel-perfect collision detection, stair-stepping, and momentum-based slide-hopping mechanics.
- 🔫 **Procedural Weapon Mechanics**: Dynamic weapon bobbing, swaying, recoil kicks, and Aim-Down-Sights (ADS).
- 🌐 **Real-time Multiplayer**: Powered by Socket.io with smooth client-side interpolation and dynamically loaded GLB player models.
- 🗺️ **Triangle-Level Map Collision**: Parses 3D `.glb` arenas to construct exact physical hitboxes for floors, ramps, and walls.

---

## 🏗️ Multiplayer Architecture

```mermaid
sequenceDiagram
    participant Player1 as Client 1 (Vite + Three.js)
    participant Server as Node.js + Socket.io Server
    participant Player2 as Client 2 (Vite + Three.js)

    Player1->>Server: Send Position & Rotation (30 tick)
    Player1->>Server: Send Shoot Event (Raycast hit)
    Server-->>Player2: Broadcast Player 1 State
    Server-->>Player2: Broadcast Shoot Event
    Player2->>Player2: Smooth Interpolate Player 1 Movement
    Player2->>Player2: Render Muzzle Flash & Tracers
```

---

## 🚀 Quick Start

Get the game running locally in seconds.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Game Client
```bash
npm run dev
```

### 3. Start the Multiplayer Server
*(Open a separate terminal window)*
```bash
node server.js
```

Open your browser to `http://localhost:5173` (or the port Vite provides) and start shooting!

---

## 💻 Technologies Used

| Domain | Technology |
| :--- | :--- |
| **Frontend Renderer** | Vite, Three.js, GLTFLoader |
| **Physics Engine** | `@dimforge/rapier3d-compat` |
| **Backend Server** | Node.js, Express |
| **Networking** | Socket.io |

---

## 📜 License

This project is licensed under the **MIT License**.


---
<div align="center">
  <img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fkamalesh4044%2Fvelocity.io&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=views&edge_flat=false" alt="Views"/>
</div>
