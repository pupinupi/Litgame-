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
    skip: false
  };
}

io.on("connection", (socket) => {

  socket.on("join_room", ({ name, room, color }) => {
    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        turn: 0,
        started: false
      };
    }

    const game = rooms[room];

    if (game.players.length >= 4) return;

    const player = createPlayer(socket.id, name, color);
    game.players.push(player);

    socket.join(room);

    io.to(room).emit("update_players", game.players);

    console.log("JOIN:", name, room);
  });

  socket.on("start_game", (room) => {
    if (!rooms[room]) return;

    rooms[room].started = true;

    io.to(room).emit("game_started", rooms[room]);

    console.log("GAME START:", room);
  });

  socket.on("roll_dice", (room) => {
    const game = rooms[room];
    if (!game) return;

    const player = game.players[game.turn];
    if (!player) return;

    if (player.skip) {
      player.skip = false;
      game.turn = (game.turn + 1) % game.players.length;
      io.to(room).emit("game_update", game);
      return;
    }

    const dice = Math.floor(Math.random() * 6) + 1;

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

function applyCell(player) {
  const cell = player.position;

  if (cell === 1) player.hype += 10;
  if (cell === 2) player.hype += 3;
  if (cell === 3) player.hype -= 2;
  if (cell === 4) player.hype -= 5;
  if (cell === 5) player.skip = true;
  if (cell === 6) player.hype += 2;
  if (cell === 7) player.hype -= 3;
  if (cell === 8) player.hype += 5;
  if (cell === 9) player.hype += 8;
  if (cell === 10) player.hype -= 15;
  if (cell === 11) player.skip = true;
  if (cell === 12) player.hype += 3;
  if (cell === 13) player.hype -= 5;
  if (cell === 14) player.hype += 3;
  if (cell === 15) player.skip = true;
  if (cell === 16) player.hype += 2;
  if (cell === 17) player.hype -= 4;
  if (cell === 18) player.hype += 8;
  if (cell === 19) player.hype -= 10;
}

server.listen(3000, () => {
  console.log("Server running on 3000");
});
