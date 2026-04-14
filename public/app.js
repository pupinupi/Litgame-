document.addEventListener('DOMContentLoaded', () => {

const socket = io();

let players = [];
let currentTurnId = null;

let username = "";
let roomCode = "";
let color = "";

let isAnimating = false;
let gameOver = false;

// ===== ЗВУКИ =====
const diceSound = new Audio('dice.mp3');
const scandalSound = new Audio('scandal.mp3');

// ===== UI =====
function setStatus(text){
  const el = document.getElementById('gameStatus');
  if(el) el.innerText = text;
}

// ===== ВЫБОР ФИШКИ =====
document.querySelectorAll('.chip').forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
    btn.classList.add('selected');
    color = btn.dataset.color;
  };
});

// ===== ВХОД =====
document.getElementById('joinBtn').onclick = ()=>{
  const nameInput = document.getElementById('usernameInput');
  const roomInput = document.getElementById('roomInput');

  if(!nameInput || !roomInput){
    alert("Ошибка: нет input полей");
    return;
  }

  username = nameInput.value.trim();
  roomCode = roomInput.value.trim();

  if(!username || !roomCode || !color){
    alert("Заполни всё");
    return;
  }

  socket.emit('joinRoom',{username,roomCode,color});
};

// ===== СТАРТ =====
document.getElementById('startBtn').onclick = ()=>{
  if(!roomCode){
    alert("Сначала войди");
    return;
  }
  socket.emit('startGame',roomCode);
};

// ===== КУБИК =====
document.getElementById('rollBtn').onclick = ()=>{
  if(gameOver || isAnimating) return;
  if(currentTurnId !== socket.id) return;

  diceSound.currentTime = 0;
  diceSound.play();

  socket.emit('rollDice',roomCode);
};

// ===== СОКЕТЫ =====
socket.on('updatePlayers', pl=>{
  players = pl;

  const list = document.getElementById('playersList');
  if(list){
    list.innerHTML = players.map(p =>
      `<div style="color:${p.color}">${p.username}</div>`
    ).join('');
  }

  renderHypeBars();
});

socket.on('gameStarted', ()=>{
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
});

socket.on('nextTurn', id=>{
  currentTurnId = id;

  const p = players.find(x=>x.id===id);
  if(p) setStatus(`👉 Ходит ${p.username}`);

  const btn = document.getElementById('rollBtn');
  if(btn){
    btn.disabled = id !== socket.id || gameOver;
  }
});

socket.on('playerSkipped', id=>{
  const p = players.find(x=>x.id===id);
  if(p) setStatus(`⛔ ${p.username} пропускает ход`);
});

socket.on('diceRolled', ({playerId, dice})=>{
  const p = players.find(x=>x.id===playerId);
  if(p) setStatus(`🎲 ${p.username} выбросил ${dice}`);

  const diceEl = document.getElementById('diceResult');
  if(diceEl) diceEl.innerText = "🎲 " + dice;
});


// ===== ПРОСТОЙ РЕНДЕР ХАЙПА =====
function renderHypeBars(){
  const box=document.getElementById('hypeBars');
  if(!box) return;

  box.innerHTML='';

  players.forEach(p=>{
    const percent = Math.min(p.hype,70)/70*100;

    box.innerHTML+=`
      <div style="margin:5px 0;">
        ${p.username}: ${p.hype}/70
        <div style="background:#111;height:10px;">
          <div style="background:#00cfff;height:10px;width:${percent}%"></div>
        </div>
      </div>
    `;
  });
}

});
