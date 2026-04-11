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
// 📍 СБОР КООРДИНАТ (FIX)
// =====================

let coords = [];

// создаём окно
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

// ждём пока появится поле
setInterval(() => {
  const board = document.getElementById("board");
  if (!board) return;

  // чтобы не навешивалось 100 раз
  if (board.dataset.ready) return;
  board.dataset.ready = true;

  board.addEventListener("click", (e) => {
    const rect = board.getBoundingClientRect();

    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    coords.push({ x, y });

    coordBox.innerHTML += `x:${x} y:${y}<br>`;

    console.log("COORDS:", JSON.stringify(coords));
  });

}, 500);
