const socket = io();

let players = [];
let roomCode = "";
let username = "";
let color = "";
let currentTurnId = null;

// ===== DOM =====
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('roomCode');
const joinBtn = document.getElementById('joinBtn');
const startBtn = document.getElementById('startBtn');

const lobby = document.getElementById('lobby');
const game = document.getElementById('game');

// ===== ВЫБОР ФИШКИ =====
document.querySelectorAll('.chip').forEach(c => {
  c.onclick = () => {
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
    color = c.dataset.color;
  };
});

// ===== ВХОД =====
joinBtn.onclick = () => {

  username = usernameInput.value.trim();
  roomCode = roomInput.value.trim();

  if (!username || !roomCode || !color) {
    alert("Заполни имя, комнату и выбери фишку");
    return;
  }

  socket.emit('joinRoom', {
    username,
    roomCode,
    color
  });

};

// ===== СТАРТ =====
startBtn.onclick = () => {

  if (!roomCode) {
    alert("Сначала войди в комнату");
    return;
  }

  socket.emit('startGame', roomCode);

};

// ===== СОКЕТ =====

// список игроков
socket.on('updatePlayers', (p) => {
  players = p;
  renderLobbyPlayers();
});

// старт игры
socket.on('gameStarted', () => {
  lobby.style.display = "none";
  game.style.display = "block";
});

// ===== ОШИБКИ С СЕРВЕРА =====
socket.on('errorMsg', msg => {
  alert(msg);
});

// ===== ЛОББИ СПИСОК =====
function renderLobbyPlayers(){
  const list = document.getElementById('playersList');

  list.innerHTML = players.map(p =>
    `<div style="color:${p.color}">${p.username}</div>`
  ).join('');
}
