const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {

  // ===== ВХОД В КОМНАТУ =====
  socket.on('joinRoom', ({ username, roomCode, color }) => {

    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: [],
        turnIndex: 0
      };
    }

    const room = rooms[roomCode];

    if (room.players.length >= 4) {
      socket.emit('errorMsg', 'Комната заполнена');
      return;
    }

    if (room.players.find(p => p.color === color)) {
      socket.emit('errorMsg', 'Цвет занят');
      return;
    }

    const player = {
      id: socket.id,
      username,
      color,
      position: 0,
      hype: 0,
      skip: false
    };

    room.players.push(player);
    socket.join(roomCode);

    io.to(roomCode).emit('updatePlayers', room.players);
  });

  // ===== СТАРТ ИГРЫ =====
  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.turnIndex = Math.floor(Math.random() * room.players.length);

    io.to(roomCode).emit('gameStarted');

    // первый ход
    io.to(roomCode).emit(
      'nextTurn',
      room.players[room.turnIndex].id
    );
  });

  // ===== КУБИК =====
  socket.on('rollDice', (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players[room.turnIndex];
    if (!player) return;

    // не твой ход
    if (player.id !== socket.id) return;

    // пропуск
    if (player.skip) {
      player.skip = false;
      nextTurn(roomCode);
      return;
    }

    const dice = Math.floor(Math.random() * 6) + 1;

    io.to(roomCode).emit('diceRolled', {
      playerId: player.id,
      dice
    });
  });

  // ===== ОБНОВЛЕНИЕ ИГРОКА =====
  socket.on('updatePlayer', ({ roomCode, player }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const p = room.players.find(x => x.id === player.id);
    if (!p) return;

    Object.assign(p, player);

    io.to(roomCode).emit('updatePlayers', room.players);

    nextTurn(roomCode);
  });

  // ===== СЛЕДУЮЩИЙ ХОД =====
  function nextTurn(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.turnIndex = (room.turnIndex + 1) % room.players.length;

    io.to(roomCode).emit(
      'nextTurn',
      room.players[room.turnIndex].id
    );
  }

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server running on " + PORT);
});
