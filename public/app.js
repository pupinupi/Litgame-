const socket = io();

let players = [];
let currentTurnId = null;

let username, roomCode, color;

let isAnimating = false;
let gameOver = false;

// 🔊 ЗВУКИ
const diceSound = new Audio('dice.mp3');
const scandalSound = new Audio('scandal.mp3');

// ===== ЗАПУСК =====
window.onload = () => {

// 🎯 выбор фишки
document.querySelectorAll('.chip').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    color = btn.dataset.color;
  };
});

// 🚪 вход
document.getElementById('joinBtn').onclick = () => {
  username = document.getElementById('username').value.trim();
  roomCode = document.getElementById('roomCode').value.trim();

  if (!username || !roomCode || !color) {
    alert("Заполни всё");
    return;
  }

  socket.emit('joinRoom', { username, roomCode, color });
};

// 🚀 старт
document.getElementById('startBtn').onclick = () => {
  socket.emit('startGame', roomCode);
};

// 🎲 кубик
document.getElementById('rollBtn').onclick = () => {
  if (gameOver || isAnimating) return;
  if (currentTurnId !== socket.id) return;

  diceSound.currentTime = 0;
  diceSound.play();

  socket.emit('rollDice', roomCode);
};

};

// ===== СОКЕТЫ =====
socket.on('updatePlayers', pl => {
  players = pl;

  players.forEach(p => {
    if (p.position === undefined) p.position = 0;
  });

  renderPlayers();
  renderHypeBars();
});

socket.on('gameStarted', () => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
});

socket.on('nextTurn', id => {
  currentTurnId = id;
  document.getElementById('rollBtn').disabled =
    id !== socket.id || gameOver;
});

socket.on('diceRolled', ({ playerId, dice }) => {
  document.getElementById('diceResult').innerText = "🎲 " + dice;

  if (playerId === socket.id) movePlayer(dice);
});

// ===== КООРДИНАТЫ =====
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

// ===== ДВИЖЕНИЕ (ПЛАВНОЕ) =====
function movePlayer(steps){
  const me = players.find(p => p.id === socket.id);
  if (!me) return;

  isAnimating = true;

  let path = [];

  for(let i = 0; i < steps; i++){
    const nextPos = (me.position + 1) % cells.length;
    path.push(nextPos);
    me.position = nextPos;
  }

  if (path.includes(0)) me.hype += 7;

  animatePath(me, path, () => {
    isAnimating = false;
    handleCell(me);
  });
}

function animatePath(player, path, callback){
  const board = document.getElementById('gameBoard');
  const rect = board.getBoundingClientRect();
  const el = document.getElementById(player.id);

  let i = 0;

  function go(){
    if(i >= path.length){
      callback();
      return;
    }

    const c = cells[path[i]];

    el.style.transition = "all 0.25s linear";
    el.style.left = (c.x * rect.width) + 'px';
    el.style.top  = (c.y * rect.height) + 'px';

    i++;
    setTimeout(go, 250);
  }

  go();
}

// ===== КЛЕТКА =====
function handleCell(p){
  const c = cells[p.position];

  if(c.type === 'start') p.hype += 10;
  if(c.type === 'plus') p.hype += c.value;
  if(c.type === 'minus') p.hype = Math.max(0, p.hype - c.value);

  if(c.type === 'minusSkip'){
    p.hype = Math.max(0, p.hype - c.value);
    p.skipNext = true;
  }

  if(c.type === 'skip') p.skipNext = true;

  if(c.type === 'risk'){
    showRisk(p);
    return;
  }

  if(c.type === 'scandal'){
    showScandal(p);
    return;
  }

  finishTurn(p);
}

// ===== РИСК =====
function showRisk(p){
  const modal = document.getElementById('riskModal');
  modal.style.display = "flex";

  document.getElementById('riskResult').innerText = '';

  document.getElementById('riskRollBtn').onclick = () => {
    const dice = Math.floor(Math.random()*6)+1;
    const result = dice <= 3 ? -5 : 5;

    p.hype = Math.max(0, p.hype + result);

    document.getElementById('riskResult').innerText =
      `🎲 ${dice} → ${result > 0 ? '+' : ''}${result}`;

    document.getElementById('riskRollBtn').style.display = 'none';
    document.getElementById('riskCloseBtn').style.display = 'inline-block';
  };

  document.getElementById('riskCloseBtn').onclick = () => {
    modal.style.display = "none";
    finishTurn(p);

    document.getElementById('riskRollBtn').style.display = 'inline-block';
    document.getElementById('riskCloseBtn').style.display = 'none';
  };
}

// ===== СКАНДАЛ =====
const scandalList = [
  {text:'🔥 перегрел аудиторию', val:-1},
  {text:'🫣 громкий заголовок', val:-2},
  {text:'😱 это монтаж', val:-3},
  {text:'#️⃣ меня взломали', val:-3, all:true},
  {text:'😮 подписчики в шоке', val:-4},
  {text:'🤫 удаляй пока не поздно', val:-5},
  {text:'🙄 это контент...', val:-5, skip:true}
];

function showScandal(p){
  scandalSound.currentTime = 0;
  scandalSound.play();

  shakeScreen(); // 💥 тряска

  const modal = document.getElementById('scandalModal');
  modal.style.display = "flex";

  const s = scandalList[Math.floor(Math.random()*scandalList.length)];

  document.getElementById('scandalText').innerText =
    `${s.text} (${s.val})`;

  if(s.all){
    players.forEach(pl=>{
      pl.hype = Math.max(0, pl.hype + s.val);
    });
  } else {
    p.hype = Math.max(0, p.hype + s.val);
  }

  if(s.skip) p.skipNext = true;

  window.closeScandal = () => {
    modal.style.display = "none";
    finishTurn(p);
  };
}

// ===== ТРЯСКА =====
function shakeScreen(){
  const board = document.getElementById('gameBoard');

  board.classList.add('shake');

  setTimeout(() => {
    board.classList.remove('shake');
  }, 400);
}

// ===== ФИНИШ ХОДА =====
function finishTurn(p){
  renderHypeBars();

  if(p.hype >= 70){
    gameOver = true;
    alert("🏆 Победа: " + p.username);
  }

  socket.emit('playerMoved',{
    roomCode,
    position:p.position,
    hype:p.hype,
    skipNext:p.skipNext
  });
}

// ===== UI =====
function renderPlayers(){
  const board = document.getElementById('gameBoard');
  const rect = board.getBoundingClientRect();

  players.forEach((p,i)=>{
    let el = document.getElementById(p.id);

    if(!el){
      el = document.createElement('div');
      el.className = `player ${p.color}`;
      el.id = p.id;
      board.appendChild(el);
    }

    const c = cells[p.position];

    el.style.transition = "none";
    el.style.left = (c.x * rect.width) + 'px';
    el.style.top  = (c.y * rect.height) + 'px';
  });
}

function renderHypeBars(){
  const box = document.getElementById('hypeBars');
  box.innerHTML = '';

  players.forEach(p=>{
    const percent = Math.min(p.hype,70)/70*100;

    box.innerHTML += `
      <div style="margin:6px 0; width:90%;">
        <div style="font-size:18px;font-weight:bold;">
          ${p.username}: ${p.hype}/70
        </div>
        <div style="background:#111;height:14px;border-radius:8px;">
          <div style="
            background:#00cfff;
            height:14px;
            width:${percent}%;
            box-shadow:0 0 15px #00cfff;
            border-radius:8px;
          "></div>
        </div>
      </div>
    `;
  });
}
