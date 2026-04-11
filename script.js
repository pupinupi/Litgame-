const socket = io();

let room = "";
let color = "";

// 🎨 цвет
function setColor(c) {
  color = c;
}

// 🚪 вход
function join() {
  const name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  if (!name || !room || !color) {
    alert("Заполни всё!");
    return;
  }

  socket.emit("join_room", { name, room, color });
}

// ▶ старт
function start() {
  if (!room) return alert("Сначала зайди в комнату!");
  socket.emit("start_game", room);
}

// 🎲 кубик
function rollDice() {
  const sound = new Audio("dice.mp3");
  sound.play();

  socket.emit("roll_dice", room);
}

// 🎮 старт игры
socket.on("game_started", () => {
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
});

// 👥 игроки
socket.on("update_players", renderPlayers);
socket.on("game_update", renderPlayers);

// 🎲 кубик результат
socket.on("dice_result", (dice) => {
  alert("Выпало: " + dice);
});

// 👥 отрисовка игроков
function renderPlayers(players) {
  const div = document.getElementById("players");

  div.innerHTML = players.map(p =>
    `<div style="color:${p.color}">
      ${p.name} — ${p.hype} хайпа
    </div>`
  ).join("");
}
