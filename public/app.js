const socket = io();

let players = [];
let currentTurnId = null;

let username, roomCode, color;

let isAnimating = false;
let gameOver = false;

let currentRisk = null;
let currentScandal = null;

// 🔊 ЗВУКИ
const diceSound = new Audio("dice.mp3");
const scandalSound = new Audio("scandal.mp3");

diceSound.volume = 0.5;
scandalSound.volume = 0.6;

// =========================
// 🔥 УНИВЕРСАЛЬНЫЕ МОДАЛКИ
// =========================
function openModal(id){
  const el = document.getElementById(id);
  el.style.display = "flex";
}

function closeModal(id){
  document.getElementById(id).style.display = "none";
}

// =========================
// ЗАПУСК
// =========================
window.onload = () => {

  document.body.addEventListener('click', () => {
    diceSound.play().then(()=> diceSound.pause()).catch(()=>{});
  }, { once: true });

  document.querySelectorAll('.chip').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      color = btn.dataset.color;
    };
  });

  document.getElementById('joinBtn').onclick = () => {
    username = document.getElementById('username').value.trim();
    roomCode = document.getElementById('roomCode').value.trim();

    if (!username || !roomCode || !color) {
      alert("Заполни всё");
      return;
    }

    socket.emit('joinRoom', { username, roomCode, color });
  };

  document.getElementById('startBtn').onclick = () => {
    socket.emit('startGame', roomCode);
  };

  document.getElementById('rollBtn').onclick = () => {
    if (gameOver || isAnimating) return;
    if (currentTurnId !== socket.id) return;

    socket.emit('rollDice', roomCode);
  };
};

// =========================
// SOCKET
// =========================
socket.on('updatePlayers', pl => {
  players = pl;

  players.forEach(p => {
    if (p.position === undefined) p.position = 0;
  });

  renderPlayers();
  renderHypeBars();
  renderLobbyPlayers();
});

socket.on('gameStarted', () => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
});

socket.on('nextTurn', id => {
  currentTurnId = id;
  document.getElementById('rollBtn').disabled =
    id !== socket.id || gameOver;

  renderPlayers();
});

// =========================
// 🎲 КУБИК
// =========================
socket.on('diceRolled', ({ playerId, dice }) => {

  diceSound.currentTime = 0;
  diceSound.play();

  const el = document.getElementById('diceResult');

  let i = 0;

  const anim = setInterval(() => {
    el.innerText = "🎲 " + (Math.floor(Math.random() * 6) + 1);
    i++;
    if (i > 10) {
      clearInterval(anim);
      el.innerText = "🎲 " + dice;

      if (playerId === socket.id) movePlayer(dice);
    }
  }, 80);
});

// =========================
// КООРДИНАТЫ
// =========================
const cells = [
  { x:0.1057,y:0.5857,type:'start'},
  { x:0.1071,y:0.4557,type:'plus',value:3},
  { x:0.1029,y:0.3486,type:'plus',value:2},
  { x:0.1057,y:0.2357,type:'scandal'},
  { x:0.1014,y:0.13,type:'risk'},
  { x:0.2214,y:0.0843,type:'plus',value:2},
  { x:0.3471,y:0.09,type:'scandal'},
  { x:0.5043,y:0.0886,type:'plus',value:3},
  { x:0.6514,y:0.0857,type:'plus',value:5},
  { x:0.77,y:0.1,type:'minus',value:10},
  { x:0.9157,y:0.1129,type:'minusSkip',value:8},
  { x:0.9043,y:0.2471,type:'plus',value:3},
  { x:0.91,y:0.3429,type:'risk'},
  { x:0.9029,y:0.4486,type:'plus',value:3},
  { x:0.89,y:0.5786,type:'skip'},
  { x:0.7886,y:0.6,type:'plus',value:2},
  { x:0.6329,y:0.6014,type:'scandal'},
  { x:0.4929,y:0.6014,type:'plus',value:8},
  { x:0.3571,y:0.6,type:'minus',value:10},
  { x:0.2143,y:0.6014,type:'plus',value:4}
];

// =========================
// ДВИЖЕНИЕ
// =========================
function movePlayer(steps){
  const me = players.find(p => p.id === socket.id);
  if (!me) return;

  isAnimating = true;
  let i = 0;

  function step(){
    if (i >= steps){
