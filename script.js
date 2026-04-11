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

// =====================
// 📍 СБОР КООРДИНАТ
// =====================

let coords = [];

// создаём окно для координат
let coordBox = document.createElement("div");
document.body.appendChild(coordBox);

coordBox.style.position = "fixed";
coordBox.style.right = "10px";
coordBox.style.top = "10px";
coordBox.style.background = "black";
coordBox.style.color = "lime";
coordBox.style.padding = "10px";
coordBox.style.fontSize = "12px";
coordBox.style.maxHeight = "300px";
coordBox.style.overflow = "auto";
coordBox.innerHTML = "Координаты:<br>";

// ловим клики ТОЛЬКО по полю
document.addEventListener("click", (e) => {
  const board = document.getElementById("board");
  if (!board) return;

  const rect = board.getBoundingClientRect();

  // проверка: клик именно по картинке
  if (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  ) return;

  const x = Math.round(e.clientX - rect.left);
  const y = Math.round(e.clientY - rect.top);

  coords.push({ x, y });

  coordBox.innerHTML += `x:${x} y:${y}<br>`;

  console.log(coords); // ← смотри тут JSON
});
