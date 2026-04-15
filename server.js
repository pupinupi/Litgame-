const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const rooms = {};

io.on('connection', socket => {

  socket.on('joinRoom', ({ username, roomCode, color }) => {
  if (!rooms[roomCode]) {
    rooms[roomCode] = {
      players: [],
      turnIndex: 0,
      hostId: socket.id // ← первый игрок = хост
    };
  }

  const room = rooms[roomCode];

  if (room.players.find(p => p.color === color)) {
    socket.emit('colorTaken');
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

  // 🔥 отправляем всем кто хост
  io.to(roomCode).emit('updatePlayers', room.players);
  io.to(roomCode).emit('setHost', room.hostId);
});

    const room = rooms[roomCode];

    if (room.players.find(p => p.color === color)) {
      socket.emit('colorTaken');
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

    io.to(roomCode).emit('updatePlayers', room.players);
  });

  socket.on('startGame', roomCode => {
  const room = rooms[roomCode];
  if (!room) return;

  // ❌ не хост — нельзя стартовать
  if (socket.id !== room.hostId) return;

  room.turnIndex = 0;

  io.to(roomCode).emit('gameStarted');
  io.to(roomCode).emit('nextTurn', room.players[0].id);
});

  socket.on('rollDice', roomCode => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players[room.turnIndex];
    if (!player) return;

    if (socket.id !== player.id) return;

    if (player.skipNext) {
      player.skipNext = false;
      io.to(roomCode).emit('playerSkipped', player.id);
      nextTurn(roomCode);
      return;
    }

    const dice = Math.floor(Math.random() * 6) + 1;

    io.to(roomCode).emit('diceRolled', {
      playerId: player.id,
      dice
    });
  });

  socket.on('playerMoved', ({ roomCode, position, hype, skipNext }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    player.position = position;
    player.hype = hype;
    player.skipNext = skipNext;

    io.to(roomCode).emit('updatePlayers', room.players);

    nextTurn(roomCode);
  });

  function nextTurn(roomCode){
    const room = rooms[roomCode];
    if (!room) return;

    room.turnIndex = (room.turnIndex + 1) % room.players.length;

    io.to(roomCode).emit('nextTurn', room.players[room.turnIndex].id);
  }

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server running on " + PORT);
});
