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
    prevPosition: 0,
    hype: 0,
    skip: false
  };
}

io.on("connection", (socket) => {

  socket.on("join_room", ({ name, room, color }) => {
    if (!rooms[room]) {
      rooms[room] = { players: [], turn: 0 };
    }

    const game = rooms[room];

    if (game.players.length >= 4) return;

    const player = createPlayer(socket.id, name, color);
    game.players.push(player);

    socket.join(room);

    io.to(room).emit("update_players", game.players);
  });

  socket.on("start_game", (room) => {
    io.to(room).emit("game_started");
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

    player.prevPosition = player.position;
    player.position += dice;

    if (player.position >= 20) {
      player.position = 0;
      player.hype += 7;
    }

    applyCell(player);

    if (player.hype < 0) player.hype = 0;

    game.turn = (game.turn + 1) % game.players.length;

    io.to(room).emit("dice_result", dice);
    io.to(room).emit("game_update", game);
  });

});

function applyCell(p) {
  const map = [
    "start","h3","h2","scandal","risk","h2","scandal","h3","h5","minus15",
    "skip","h3","risk","h3","skip","h2","scandal","h8","minus10","h4"
  ];

  const cell = map[p.position];

  if (cell === "start") p.hype += 10;
  if (cell === "h2") p.hype += 2;
  if (cell === "h3") p.hype += 3;
  if (cell === "h4") p.hype += 4;
  if (cell === "h5") p.hype += 5;
  if (cell === "h8") p.hype += 8;

  if (cell === "minus10") p.hype -= 10;
  if (cell === "minus15") p.hype -= 15;

  if (cell === "skip") p.skip = true;

  if (cell === "risk") {
    const r = Math.floor(Math.random() * 6) + 1;
    p.hype += r <= 3 ? -5 : 5;
  }

  if (cell === "scandal") {
    p.hype -= Math.floor(Math.random() * 5) + 1;
  }
}

server.listen(3000, () => console.log("Server started"));
