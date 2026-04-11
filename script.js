const socket = io();

let room = "";
let color = "";

// 🔊 звуки
const diceSound = new Audio('dice.mp3');
const scandalSound = new Audio('scandal.mp3');

// 🎲 показать результат кубика
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

  if (!name || !room || !color) {
    alert("Заполни всё!");
    return;
  }

  socket.emit("join_room", { name, room, color });
}

// ▶ старт
function start() {
  socket.emit("start_game", room);
}

// 🎲 бросок
function rollDice() {
  diceSound.play();
  socket.emit("roll_dice", room);
}

// 🎮 старт игры
socket.on("game_started", () => {
  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
});

// 👥 обновление игроков
socket.on("update_players", (players) => {
  updatePlayers(players);
});

// 🔄 обновление игры
socket.on("game_update", (game) => {
  updatePlayers(game.players);
  renderTokens(game.players);
});

// 🎲 результат кубика
socket.on("dice_result", (dice) => {
  showDice(dice);
});

// 👥 список игроков + хайп
function updatePlayers(players) {
  const div = document.getElementById("players");

  div.innerHTML = players.map(p => {
    return `
      <div style="color:${p.color}; font-size:18px;">
        ${p.name}: ${p.hype} хайпа
      </div>
    `;
  }).join("");
}

// 🎯 координаты клеток (упрощенно пока)
const path = [
  {x: 500, y: 900}, // старт
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

// 🎮 отрисовка фишек
function renderTokens(players) {
  let board = document.getElementById("board");

  // удалить старые фишки
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

// 💥 звук скандала (если понадобится позже)
function playScandal() {
  scandalSound.play();
}
