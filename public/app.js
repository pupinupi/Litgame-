const socket = io();

let players = [];
let currentTurnId = null;

let username, roomCode, color;

let isAnimating = false;
let gameOver = false;

// ===== ВЫБОР ФИШКИ =====
document.querySelectorAll('.chip').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    color = btn.dataset.color;
  };
});

socket.on('colorTaken', () => {
  alert('Цвет занят!');
});

// ===== ВХОД =====
document.getElementById('joinBtn').onclick = () => {
  username = document.getElementById('username').value.trim();
  roomCode = document.getElementById('roomCode').value.trim();

  if (!username || !roomCode || !color) {
    alert("Заполни всё");
    return;
  }

  socket.emit('joinRoom', { username, roomCode, color });
};

// ===== СТАРТ =====
document.getElementById('startBtn').onclick = () => {
  socket.emit('startGame', roomCode);
};

// ===== КУБИК =====
document.getElementById('rollBtn').onclick = () => {
  if (gameOver || isAnimating) return;
  if (currentTurnId !== socket.id) return;

  socket.emit('rollDice', roomCode);
};

// ===== СОКЕТЫ =====
socket.on('updatePlayers', pl => {
  players = pl;
  renderPlayers();
  renderHypeBars();
  renderLobbyPlayers();
});

socket.on('gameStarted', () => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
});

socket.on('nextTurn', id => {
  currentTurnId = id;

  document.getElementById('rollBtn').disabled =
    id !== socket.id || gameOver;

  highlightCurrentPlayer();
});

socket.on('diceRolled', ({ playerId, dice }) => {
  document.getElementById('diceResult').innerText =
    `🎲 ${dice}`;

  if (playerId === socket.id) {
    movePlayer(dice);
  }
});

// ===== КЛЕТКИ =====
const cells = [
  { x: 0.10, y: 0.85, type:'start' },
  { x: 0.10, y: 0.70, type:'plus', value:3 },
  { x: 0.10, y: 0.55, type:'plus', value:2 },
  { x: 0.08, y: 0.35, type:'scandal' },
  { x: 0.10, y: 0.15, type:'risk' },

  { x: 0.25, y: 0.08, type:'plus', value:2 },
  { x: 0.40, y: 0.08, type:'scandal' },
  { x: 0.55, y: 0.08, type:'plus', value:3 },
  { x: 0.70, y: 0.08, type:'plus', value:5 },
  { x: 0.85, y: 0.08, type:'minus', value:10 },

  { x: 0.92, y: 0.20, type:'minusSkip', value:8 },
  { x: 0.92, y: 0.35, type:'plus', value:3 },
  { x: 0.92, y: 0.50, type:'risk' },
  { x: 0.92, y: 0.65, type:'plus', value:3 },
  { x: 0.90, y: 0.85, type:'skip' },

  { x: 0.75, y: 0.90, type:'plus', value:2 },
  { x: 0.60, y: 0.90, type:'scandal' },
  { x: 0.45, y: 0.90, type:'plus', value:8 },
  { x: 0.30, y: 0.90, type:'minus', value:10 },
  { x: 0.15, y: 0.90, type:'plus', value:4 }
];
// ===== ДВИЖЕНИЕ =====
function movePlayer(steps){
  const me = players.find(p => p.id === socket.id);
  if (!me) return;

  isAnimating = true;
  let i = 0;

  function step(){
    if(i >= steps){
      isAnimating = false;
      handleCell(me);
      return;
    }

    const prev = me.position;
    me.position = (me.position + 1) % cells.length;

    if(prev === cells.length - 1 && me.position === 0){
      me.hype += 7;
      showModal("🔁 +7 за круг");
    }

    renderPlayers();

    i++;
    setTimeout(step, 300);
  }

  step();
}

// ===== ОБРАБОТКА КЛЕТКИ =====
function handleCell(p){
  const cell = cells[p.position];
  if(!cell) return;

  switch(cell.type){

    case 'start':
      p.hype += 10;
      showModal("🚀 СТАРТ +10");
      break;

    case 'plus':
      p.hype += cell.value;
      showModal(`➕ +${cell.value}`);
      break;

    case 'minus':
      p.hype = Math.max(0, p.hype - cell.value);
      showModal(`➖ ${cell.value}`);
      break;

    case 'minusSkip':
      p.hype = Math.max(0, p.hype - cell.value);
      p.skipNext = true;
      showModal("🚨 -8 и пропуск");
      break;

    case 'skip':
      p.skipNext = true;
      showModal("🚨 Пропуск хода");
      break;

    case 'risk':
      showRisk(p);
      return;

    case 'scandal':
      showScandal(p);
      return;
  }

  finishTurn(p);
}

// ===== РИСК (КРАСИВО) =====
function showRisk(p){
  const m = document.getElementById('modal');

  m.innerHTML = `
    <div class="modalContent" style="border:2px solid #00cfff; box-shadow:0 0 20px #00cfff">
      <h3>⚡ РИСК</h3>
      <p>1–3 → -5 хайпа</p>
      <p>4–6 → +5 хайпа</p>
      <button onclick="riskRoll()">Бросить</button>
    </div>
  `;

  m.classList.add('active');

  window.riskRoll = () => {
    const dice = Math.floor(Math.random()*6)+1;

    let result = dice <=3 ? -5 : 5;

    p.hype = Math.max(0, p.hype + result);

    m.innerHTML = `<div class="modalContent">🎲 ${dice} → ${result}</div>`;

    setTimeout(() => {
      m.classList.remove('active');
      finishTurn(p);
    }, 1500);
  };
}

// ===== СКАНДАЛ (КРАСИВО) =====
function showScandal(p){
  const m = document.getElementById('modal');

  const cards = [
    {text:"🔥 перегрел аудиторию (-1)", val:-1},
    {text:"🫣 громкий заголовок (-2)", val:-2},
    {text:"😱 это монтаж (-3)", val:-3},
    {text:"#️⃣ меня взломали (всем -3)", all:-3},
    {text:"😮 подписчики в шоке (-4)", val:-4},
    {text:"🤫 удаляй пока не поздно (-5)", val:-5},
    {text:"🙄 это контент (-5 + пропуск)", val:-5, skip:true}
  ];

  const card = cards[Math.floor(Math.random()*cards.length)];

  m.innerHTML = `
    <div class="modalContent" style="border:2px solid red; box-shadow:0 0 25px red">
      <h3>🔥 СКАНДАЛ</h3>
      <p>${card.text}</p>
      <button onclick="closeScandal()">OK</button>
    </div>
  `;

  m.classList.add('active');

  window.closeScandal = () => {

    if(card.val){
      p.hype = Math.max(0, p.hype + card.val);
    }

    if(card.all){
      players.forEach(pl => {
        pl.hype = Math.max(0, pl.hype + card.all);
      });
    }

    if(card.skip){
      p.skipNext = true;
    }

    m.classList.remove('active');

    finishTurn(p);
  };
}

// ===== ЗАВЕРШЕНИЕ ХОДА =====
function finishTurn(p){

  renderHypeBars();

  if(p.hype >= 70){
    gameOver = true;
    showWin(p.username);
  }

  socket.emit('playerMoved', {
    roomCode,
    position: p.position,
    hype: p.hype,
    skipNext: p.skipNext
  });
}

// ===== UI =====
function renderPlayers(){
  const board = document.getElementById('gameBoard');
  const size = board.offsetWidth;

  players.forEach((p,i)=>{
    let el = document.getElementById(p.id);

    if(!el){
      el = document.createElement('div');
      el.className = `player ${p.color}`;
      el.id = p.id;
      board.appendChild(el);
    }

    const c = cells[p.position];

    el.style.left = (c.x * size + i*8) + 'px';
    el.style.top = (c.y * size) + 'px';
  });
}
function renderHypeBars(){
  const box = document.getElementById('hypeBars');
  box.innerHTML = '';

  players.forEach(p=>{
    const div = document.createElement('div');

    div.innerHTML = `
      <div>${p.username}: ${p.hype}/70</div>
      <div style="background:#111;height:10px;">
        <div style="background:#00cfff;height:10px;width:${Math.min(p.hype,70)/70*100}%"></div>
      </div>
    `;

    box.appendChild(div);
  });
}

function renderLobbyPlayers(){
  const list = document.getElementById('playersList');
  list.innerHTML = players.map(p =>
    `<div style="color:${p.color}">${p.username}</div>`
  ).join('');
}

function highlightCurrentPlayer(){
  players.forEach(p=>{
    const el = document.getElementById(p.id);
    if(!el) return;

    el.style.boxShadow =
      p.id === currentTurnId
      ? '0 0 20px yellow'
      : 'none';
  });
}

function showModal(text){
  const m = document.getElementById('modal');

  m.innerHTML = `<div class="modalContent">${text}</div>`;
  m.classList.add('active');

  setTimeout(()=>m.classList.remove('active'),1500);
}

function showWin(name){
  const m = document.getElementById('modal');

  m.innerHTML = `
    <div class="modalContent">
      <h2>🏆 ПОБЕДА</h2>
      <p>${name}</p>
      <button onclick="location.reload()">Снова</button>
    </div>
  `;

  m.classList.add('active');
}
