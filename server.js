const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', socket => {

  socket.on('joinRoom', ({ username, roomCode, color }) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: [],
        started: false,
        turnIndex: 0
      };
    }

    const room = rooms[roomCode];

    const player = {
      id: socket.id,
      username,
      color,
      position: 0,
      hype: 0,
      skipNext: false
    };

    room.players.push(player);
    socket.join(roomCode);

    // 👇 ВАЖНО: только в комнату, НЕ в игру
    socket.emit('joinedRoom', { roomCode, players: room.players });
    io.to(roomCode).emit('updatePlayers', room.players);
  });

  socket.on('startGame', roomCode => {
    const room = rooms[roomCode];
    if (!room) return;

    room.started = true;
    room.turnIndex = 0;

    io.to(roomCode).emit('gameStarted');
    io.to(roomCode).emit('nextTurn', room.players[0].id);
  });

  socket.on('rollDice', roomCode => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players[room.turnIndex];
    if (!player || player.id !== socket.id) return;

    const dice = Math.floor(Math.random() * 6) + 1;

    io.to(roomCode).emit('diceRolled', {
      playerId: socket.id,
      dice
    });
  });

  socket.on('playerMoved', ({ roomCode, position, hype, skipNext }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const p = room.players.find(x => x.id === socket.id);
    if (!p) return;

    p.position = position;
    p.hype = hype;
    p.skipNext = skipNext;

    io.to(roomCode).emit('updatePlayers', room.players);

    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    io.to(roomCode).emit('nextTurn', room.players[room.turnIndex].id);
  });

});

server.listen(3000, () => console.log("RUN"));
