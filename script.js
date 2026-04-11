const socket = io();

let room = "";
let color = "";

// 🔊 звуки
const diceSound = new Audio('dice.mp3');
const scandalSound = new Audio('scandal.mp3');

// 📍 координаты
let coordMode = true;
let coords = [];

// 🎲 показать кубик
function showDice(dice) {
  let diceDiv = document.getElementById("dice");

  if (!diceDiv) {
    diceDiv = document.createElement("div");
    diceDiv.id = "dice";
    document.body.appendChild(diceDiv);
  }

  diceDiv.innerHTML = "🎲 Выпало: " + dice;

  diceDiv.style.position = "absolute";
  diceDiv.style.top = "20px";
  diceDiv.style.left = "50%";
  diceDiv.style.transform = "translateX(-50%)";
  diceDiv.style.fontSize = "24px";
  diceDiv.style.color = "cyan";
  diceDiv.style.textShadow = "0 0 10px cyan";
}

// 🎨 выбор цвета
function setColor(c) {
  color = c;
}

// 🚪 вход
function join() {
  const name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join_room", { name, room, color });
}

// ▶ старт
function start() {
  socket.emit("start_game", room);
}

// 🎲 кубик
function rollDice() {
  diceSound.play();
  socket.emit("roll_dice", room);
}

// 🎮 старт игры
socket.on("game_started", () => {
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
});

// 👥 игроки
socket.on("update_players", (players) => {
  renderPlayers(players);
});

socket.on("game_update", (game) => {
  renderPlayers(game.players);
  renderTokens(game.players);
});

// 🎲 результат кубика
socket.on("dice_result", (dice) => {
  showDice(dice);
});

// 👥 список игроков
function renderPlayers(players) {
  const div = document.getElementById("players");

  div.innerHTML = players.map(p =>
    `<div style="color:${p.color}">
      ${p.name}: ${p.hype} хайпа
    </div>`
  ).join("");
}

// 🎯 путь (потом заменим на твой)
const path = [
  {x: 500, y: 900},
  {x: 500, y: 800},
  {x: 500, y: 700},
  {x: 500, y: 600},
  {x: 500, y: 500},
  {x: 500, y: 400},
  {x: 600, y: 300},
  {x: 700, y: 200},
  {x: 800, y: 200},
  {x: 900, y: 300},
  {x: 900, y: 400},
  {x: 900, y: 500},
  {x: 900, y: 600},
  {x: 800, y: 700},
  {x: 700, y: 800},
  {x: 600, y: 900},
  {x: 400, y: 900},
  {x: 300, y: 800},
  {x: 200, y: 700},
  {x: 300, y: 600}
];

// 🎮 фишки
function renderTokens(players) {
  document.querySelectorAll(".token").forEach(t => t.remove());

  players.forEach(p => {
    const pos = path[p.position] || path[0];

    const token = document.createElement("div");
    token.className = "token";

    token.style.position = "absolute";
    token.style.width = "20px";
    token.style.height = "20px";
    token.style.borderRadius = "50%";
    token.style.background = p.color;

    token.style.left = pos.x + "px";
    token.style.top = pos.y + "px";

    token.style.boxShadow = "0 0 10px white";

    document.body.appendChild(token);
  });
}

// 📍 КООРДИНАТЫ (КЛИК ПО ПОЛЮ)
document.addEventListener("click", (e) => {
  const board = document.getElementById("board");
  if (!board) return;

  const rect = board.getBoundingClientRect();

  const x = Math.round(e.clientX - rect.left);
  const y = Math.round(e.clientY - rect.top);

  coords.push({ x, y });

  showCoords(x, y);
});

// 📍 вывод координат
function showCoords(x, y) {
  let box = document.getElementById("coordBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "coordBox";
    document.body.appendChild(box);

    box.style.position = "absolute";
    box.style.right = "10px";
    box.style.top = "10px";
    box.style.background = "black";
    box.style.color = "lime";
    box.style.padding = "10px";
    box.style.fontSize = "14px";
    box.style.maxHeight = "300px";
    box.style.overflow = "auto";
  }

  box.innerHTML += `x:${x} y:${y}<br>`;
}

// 📋 копирование в буфер
function copyCoords() {
  console.log(coords);
  navigator.clipboard.writeText(JSON.stringify(coords));
  alert("Координаты скопированы!");
}

// 🔥 скандал звук (потом используем)
function playScandal() {
  scandalSound.play();
}
