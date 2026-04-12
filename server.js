const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let rooms = {};

function createPlayer(id, name, color){
  return {
    id,
    name,
    color,
    position: 0,
    hype: 0
  };
}

io.on("connection", (socket)=>{

  socket.on("join_room", ({name,room,color})=>{
    if(!rooms[room]){
      rooms[room] = { players: [], turn: 0 };
    }

    const game = rooms[room];
    if(game.players.length >= 4) return;

    const player = createPlayer(socket.id,name,color);
    game.players.push(player);

    socket.join(room);

    io.to(room).emit("update_players", game.players);
  });

  socket.on("start_game",(room)=>{
    io.to(room).emit("game_started");
  });

  socket.on("roll_dice",(room)=>{
    const game = rooms[room];
    if(!game) return;

    const player = game.players[game.turn];

    const dice = Math.floor(Math.random()*6)+1;

    player.position = (player.position + dice) % 20;
    player.hype += 2;

    game.turn = (game.turn + 1) % game.players.length;

    io.to(room).emit("dice_result", dice);
    io.to(room).emit("game_update", game);
  });

});

server.listen(3000,()=>console.log("RUNNING"));
