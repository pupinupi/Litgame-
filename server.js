const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let rooms = {};

function createPlayer(id, name, color) {
  return {
    id,
    name,
    color,
    position: 0,
    hype: 0,
    skip: false,
    lastMoves: []
  };
}

io.on("connection", (socket) => {

  socket.on("join_room", ({ name, room, color }) => {
    if (!rooms[room]) {
      rooms[room] = { players: [], turn: 0, started: false };
    }

    if (rooms[room].players.length >= 4) return;

    const player = createPlayer(socket.id, name, color);
    rooms[room].players.push(player);

    socket.join(room);

    io.to(room).emit("update_players", rooms[room].players);
  });

  socket.on("start_game", (room) => {
    rooms[room].started = true;
    io.to(room).emit("game_started", rooms[room]);
  });

  socket.on("roll_dice", (room) => {
    const game = rooms[room];
    if (!game) return;

    const player = game.players[game.turn];

    if (player.skip) {
      player.skip = false;
      game.turn = (game.turn + 1) % game.players.length;
      io.to(room).emit("game_update", game);
      return;
    }

    const dice = Math.floor(Math.random() * 6) + 1;

    for (let i = 0; i < dice; i++) {
      player.position++;
      if (player.position >= 20) {
        player.position = 0;
        player.hype += 7;
      }
    }

    handleCell(player, game);

    if (player.hype < 0) player.hype = 0;

    game.turn = (game.turn + 1) % game.players.length;

    io.to(room).emit("dice_result", dice);
    io.to(room).emit("game_update", game);
  });

});

function handleCell(player, game) {
  const map = [
    "start", "h3", "h2", "scandal", "risk", "h2", "scandal",
    "h3", "h5", "minus15", "skip", "h3", "risk",
    "h3", "skip", "h2", "scandal", "h8", "minus10", "h4"
  ];

  const cell = map[player.position];

  switch (cell) {
    case "start": player.hype += 10; break;
    case "h2": player.hype += 2; break;
    case "h3": player.hype += 3; break;
    case "h4": player.hype += 4; break;
    case "h5": player.hype += 5; break;
    case "h8": player.hype += 8; break;
    case "minus10": player.hype -= 10; break;
    case "minus15": player.hype -= 15; break;
    case "skip": player.skip = true; break;
    case "risk":
      const roll = Math.floor(Math.random() * 6) + 1;
      player.hype += roll <= 3 ? -5 : 5;
      break;
    case "scandal":
      player.hype -= Math.floor(Math.random() * 5) + 1;
      break;
  }
}

server.listen(3000, () => {
  console.log("Server running");
});
