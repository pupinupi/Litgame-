const socket = io();

let room = "";
let color = "";

function setColor(c) {
  color = c;
}

function join() {
  const name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join_room", { name, room, color });
}

function start() {
  socket.emit("start_game", room);
}

function rollDice() {
  socket.emit("roll_dice", room);
}

socket.on("game_started", () => {
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
});

socket.on("update_players", (players) => {
  document.getElementById("players").innerHTML =
    players.map(p => `${p.name}: ${p.hype}`).join("<br>");
});

socket.on("game_update", (game) => {
  document.getElementById("players").innerHTML =
    game.players.map(p => `${p.name}: ${p.hype}`).join("<br>");
});
