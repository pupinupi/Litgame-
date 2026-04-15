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
      isAnimating = false;
      handleCell(me);
      return;
    }

    const prev = me.position;
    me.position = (me.position + 1) % cells.length;

    if (prev === cells.length - 1 && me.position === 0){
      me.hype += 7;
    }

    renderPlayers();
    i++;
    setTimeout(step, 300);
  }

  step();
}

// =========================
// КЛЕТКА
// =========================
function handleCell(p){

  highlightCell(p.position);

  const c = cells[p.position];

  if (c.type === 'start') p.hype += 10;
  if (c.type === 'plus') p.hype += c.value;
  if (c.type === 'minus') p.hype = Math.max(0, p.hype - c.value);

  if (c.type === 'minusSkip'){
    p.hype = Math.max(0, p.hype - c.value);
    p.skipNext = true;
  }

  if (c.type === 'skip'){
    p.skipNext = true;
  }

  if (c.type === 'risk'){
    showRisk(p);
    return;
  }

  if (c.type === 'scandal'){
    showScandal(p);
    return;
  }

  p.hype = Math.max(0, p.hype);

  renderHypeBars();

  if (p.hype >= 70){
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

// =========================
// 💥 СКАНДАЛ
// =========================
// ===== СКАНДАЛ (ПОЛНЫЙ ФИКС) =====
function showScandal(p){

  scandalSound.currentTime = 0;
  scandalSound.play();

  currentScandal = p;

  const list = [
    {text:"🔥 перегрел аудиторию -1", val:-1},
    {text:"🫣 громкий заголовок -2", val:-2},
    {text:"😱 это монтаж -3", val:-3},
    {text:"#️⃣ всем -3", val:-3, all:true},
    {text:"😮 шок -4", val:-4},
    {text:"🤫 удаляй -5", val:-5},
    {text:"🙄 контент -5 + пропуск", val:-5, skip:true}
  ];

  const e = list[Math.floor(Math.random()*list.length)];
  currentScandal.effect = e;

  document.getElementById('scandalText').innerText = e.text;

  openModal('scandalModal');
}

// 👉 ДОБАВЬ ЭТУ ФУНКЦИЮ (её у тебя НЕТ)
function closeScandal(){

  const p = currentScandal;
  const e = p.effect;

  if(e.all){
    players.forEach(pl=>{
      pl.hype = Math.max(0, pl.hype + e.val);
    });
  } else {
    p.hype = Math.max(0, p.hype + e.val);
  }

  if(e.skip) p.skipNext = true;

  closeModal('scandalModal');

  // 🔥 ВАЖНО — завершение хода
  socket.emit('playerMoved',{
    roomCode,
    position:p.position,
    hype:p.hype,
    skipNext:p.skipNext
  });
}
// =========================
// ⚡ РИСК
// =========================
function showRisk(p){
  currentRisk = p;
  document.getElementById('riskResult').innerText = "";
  openModal('riskModal');
}

function rollRisk(){
  const dice = Math.floor(Math.random()*6)+1;
  const result = dice <= 3 ? -5 : 5;

  currentRisk.hype = Math.max(0, currentRisk.hype + result);

  document.getElementById('riskResult').innerText =
    `🎲 ${dice} → ${result}`;

  renderHypeBars();
}

function closeRisk(){
  closeModal('riskModal');

  socket.emit('playerMoved',{
    roomCode,
    position: currentRisk.position,
    hype: currentRisk.hype,
    skipNext: currentRisk.skipNext
  });
}

// =========================
// UI
// =========================
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

    el.className = `player ${p.color}`;

    if (p.id === currentTurnId){
      el.classList.add("activePlayer");
    }

    const c = cells[p.position];

    const angle = (i / players.length) * Math.PI * 2;
    const offset = 12;

    el.style.left = (c.x * rect.width + Math.cos(angle)*offset) + 'px';
    el.style.top  = (c.y * rect.height + Math.sin(angle)*offset) + 'px';
  });
}

function renderHypeBars(){
  const box = document.getElementById('hypeBars');
  box.innerHTML = '';

  players.forEach(p=>{
    const percent = Math.min(p.hype,70)/70*100;

    box.innerHTML += `
      <div>
        <div class="hypeText">${p.username}: ${p.hype}/70</div>
        <div class="hypeBarBg">
          <div class="hypeFill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  });
}

function renderLobbyPlayers(){
  const list = document.getElementById('playersList');
  list.innerHTML = players.map(p =>
    `<div style="color:${p.color}">${p.username}</div>`
  ).join('');
}

// =========================
// 🔥 ПОДСВЕТКА
// =========================
function highlightCell(index){
  const board = document.getElementById('gameBoard');
  const rect = board.getBoundingClientRect();
  const c = cells[index];
  const glow = document.createElement('div');
  glow.style.position = 'absolute';
  glow.style.left = (c.x * rect.width - 10) + 'px';
  glow.style.top = (c.y * rect.height - 10) + 'px';
  glow.style.width = '30px';
  glow.style.height = '30px';
  glow.style.borderRadius = '50%';
  glow.style.boxShadow = '0 0 20px yellow';
  glow.style.pointerEvents = 'none';

  board.appendChild(glow);
  setTimeout(()=>glow.remove(), 500);
}
