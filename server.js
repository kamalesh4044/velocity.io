import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

const players = {};

io.on('connection', (socket) => {
    console.log(`[+] Player connected: ${socket.id}`);
    
    players[socket.id] = { x: 0, y: 5, z: 0, yaw: 0, pitch: 0 };
    socket.emit('init', players);
    socket.broadcast.emit('playerJoin', { id: socket.id, state: players[socket.id] });

    socket.on('updateState', (state) => {
        if(players[socket.id]) {
            players[socket.id] = state;
            socket.broadcast.emit('playerUpdate', { id: socket.id, state });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[-] Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerLeave', socket.id);
    });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Velocity.io Multiplayer Server running on ws://localhost:${PORT}`);
});
