import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve the built Vite frontend game files directly!
app.use(express.static(path.join(__dirname, 'dist')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

// ===== GAME STATE =====
const players = {};
const playerHealth = {};
const MAX_HEALTH = 100;

io.on('connection', (socket) => {
    console.log(`[+] Player connected: ${socket.id}`);
    
    players[socket.id] = { x: 0, y: 5, z: 0, yaw: 0, pitch: 0 };
    playerHealth[socket.id] = MAX_HEALTH;

    socket.emit('init', players);
    socket.broadcast.emit('playerJoin', { id: socket.id, state: players[socket.id] });

    // === MOVEMENT ===
    socket.on('updateState', (state) => {
        if(players[socket.id]) {
            players[socket.id] = state;
            socket.broadcast.emit('playerUpdate', { id: socket.id, state });
        }
    });

    // === COMBAT: Player Hit ===
    socket.on('playerHit', (data) => {
        const { targetId, damage, headshot, weapon } = data;
        
        // Validate target exists
        if (!playerHealth[targetId]) return;
        if (targetId === socket.id) return; // Can't hit yourself

        // Apply damage (server authoritative)
        playerHealth[targetId] = Math.max(0, playerHealth[targetId] - damage);

        // Tell the target they were hit
        io.to(targetId).emit('youWereHit', {
            damage: damage,
            attackerId: socket.id,
            headshot: headshot
        });

        console.log(`[HIT] ${socket.id.substring(0,6)} -> ${targetId.substring(0,6)} | ${damage}dmg ${headshot ? '(HEADSHOT!)' : ''} | HP: ${playerHealth[targetId]}`);

        // Check for kill
        if (playerHealth[targetId] <= 0) {
            console.log(`[KILL] ${socket.id.substring(0,6)} eliminated ${targetId.substring(0,6)} with ${weapon}`);
            
            // Tell the attacker they got a kill
            io.to(socket.id).emit('youKilledPlayer', { 
                targetId: targetId,
                weapon: weapon
            });

            // Tell everyone about the kill (for kill feed)
            io.emit('playerKilledBy', {
                killerId: socket.id,
                targetId: targetId,
                weapon: weapon
            });

            // Reset health for respawn
            playerHealth[targetId] = MAX_HEALTH;
        }
    });

    // === DEATH ===
    socket.on('playerDeath', (data) => {
        // Reset the player's health on the server
        playerHealth[socket.id] = MAX_HEALTH;
    });

    // === DISCONNECT ===
    socket.on('disconnect', () => {
        console.log(`[-] Player disconnected: ${socket.id}`);
        delete players[socket.id];
        delete playerHealth[socket.id];
        io.emit('playerLeave', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`\n🎯 Velocity.io Multiplayer Server`);
    console.log(`   ├─ WebSocket: ws://localhost:${PORT}`);
    console.log(`   └─ Status: ONLINE\n`);
});
