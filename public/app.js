const socket = io();

let players = [];
let currentTurnId = null;

let username, roomCode, color;

let isAnimating = false;
let gameOver = false;

let currentScandal = null;

// ===== ЗАЩИТА =====
window.onerror = function(msg){
  alert("Ошибка: " + msg);
};

// ===== ЗАПУСК =====
window.onload = () => {

// выбор фишки
document.querySelectorAll('.chip').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    color = btn.dataset.color;
  };
});

// вход
document.getElementById('joinBtn').onclick = () => {
  username = document.getElementById('username').value.trim();
  roomCode = document.getElementById('roomCode').value.trim();

  if (!username || !roomCode || !color) {
    alert("Заполни всё");
    return;
  }

  socket.emit('joinRoom', { username, roomCode, color });
};

// старт
document.getElementById('startBtn').onclick = () => {
  socket.emit('startGame', roomCode);
};

// кубик
document.getElementById('rollBtn').onclick = () => {
  if (gameOver || isAnimating) return;
  if (currentTurnId !== socket.id) return;

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
    }

    renderPlayers();
    i++;
    setTimeout(step, 300);
  }

  step();
}

// ===== ЛОГИКА КЛЕТОК =====
function handleCell(p){
  const c = cells[p.position];

  if(c.type === 'start') p.hype += 10;
  if(c.type === 'plus') p.hype += c.value;
  if(c.type === 'minus') p.hype = Math.max(0, p.hype - c.value);

  if(c.type === 'minusSkip'){
    p.hype = Math.max(0, p.hype - c.value);
    p.skipNext = true;
  }

  if(c.type === 'skip'){
    p.skipNext = true;
  }

  if(c.type === 'risk'){
  showRisk(p);
  return;
}

  if(c.type === 'scandal'){
    showScandal(p);
    return;
  }

  p.hype = Math.max(0, p.hype);

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

// ===== СКАНДАЛ =====
function showScandal(p){

  const cards = [
    {text:"🔥 перегрел аудиторию (-1)", val:-1},
    {text:"🫣 громкий заголовок (-2)", val:-2},
    {text:"😱 это монтаж (-3)", val:-3},
    {text:"#️⃣ меня взломали (всем -3)", all:-3},
    {text:"😮 подписчики в шоке (-4)", val:-4},
    {text:"🤫 удаляй пока не поздно (-5)", val:-5},
    {text:"🙄 это контент (-5 и пропуск)", val:-5, skip:true}
  ];

  const card = cards[Math.floor(Math.random()*cards.length)];
  currentScandal = { card, player: p };

  document.getElementById('scandalText').innerText = card.text;
  document.getElementById('scandalModal').style.display = "flex";
}

function closeScandal(){

  const { card, player } = currentScandal;

  if(card.val){
    player.hype = Math.max(0, player.hype + card.val);
  }

  if(card.all){
    players.forEach(pl=>{
      pl.hype = Math.max(0, pl.hype + card.all);
    });
  }

  if(card.skip){
    player.skipNext = true;
  }

  document.getElementById('scandalModal').style.display = "none";

  renderHypeBars();

  if(player.hype >= 70){
    gameOver = true;
    alert("🏆 Победа: " + player.username);
  }

  socket.emit('playerMoved',{
    roomCode,
    position: player.position,
    hype: player.hype,
    skipNext: player.skipNext
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
      <div style="margin:5px 0; width:250px;">
        <div>${p.username}: ${p.hype}/70</div>
        <div style="background:#111;height:10px;border-radius:5px;">
          <div style="
            background:#00cfff;
            height:10px;
            width:${percent}%;
            box-shadow:0 0 10px #00cfff;
            border-radius:5px;
          "></div>
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

// фикс старта
setTimeout(() => {
  renderPlayers();
}, 300);

let currentRisk = null;

function showRisk(p){
  currentRisk = p;

  document.getElementById('riskResult').innerText = "";
  document.getElementById('riskRollBtn').style.display = "inline-block";
  document.getElementById('riskCloseBtn').style.display = "none";

  document.getElementById('riskModal').style.display = "flex";
}

function rollRisk(){
  const dice = Math.floor(Math.random()*6)+1;
  const result = dice <= 3 ? -5 : 5;

  currentRisk.hype = Math.max(0, currentRisk.hype + result);

  document.getElementById('riskResult').innerText =
    `🎲 ${dice} → ${result > 0 ? "+" : ""}${result} хайпа`;

  document.getElementById('riskRollBtn').style.display = "none";
  document.getElementById('riskCloseBtn').style.display = "inline-block";

  renderHypeBars();
}

function closeRisk(){

  if(currentRisk.hype >= 70){
    gameOver = true;
    alert("🏆 Победа: " + currentRisk.username);
  }

  document.getElementById('riskModal').style.display = "none";

  socket.emit('playerMoved',{
    roomCode,
    position: currentRisk.position,
    hype: currentRisk.hype,
    skipNext: currentRisk.skipNext
  });
}
