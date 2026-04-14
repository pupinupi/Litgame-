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
        hostId: socket.id
      };
    }

    const room = rooms[roomCode];

    if (room.players.find(p => p.color === color)) {
      socket.emit('joinError', 'Цвет занят');
      return;
    }

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

    socket.emit('joinedRoom', {
      roomCode,
      players: room.players,
      hostId: room.hostId
    });

    io.to(roomCode).emit('updatePlayers', room.players);
  });

  socket.on('startGame', roomCode => {
    const room = rooms[roomCode];
    if (!room) return;

    if (socket.id !== room.hostId) return;

    io.to(roomCode).emit('gameStarted');
    io.to(roomCode).emit('nextTurn', room.players[0].id);
  });

  socket.on('rollDice', roomCode => {
    const room = rooms[roomCode];
    if (!room) return;

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
  });

});

server.listen(3000);
