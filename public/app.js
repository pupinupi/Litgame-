const socket = io();

let players = [];
let roomCode = "";
let username = "";
let color = "";
let currentTurnId = null;
let isAnimating = false;

// DOM
const usernameInput = document.getElementById('username');
const roomInput = document.getElementById('roomCode');
const joinBtn = document.getElementById('joinBtn');
const startBtn = document.getElementById('startBtn');
const rollBtn = document.getElementById('rollBtn');

const lobby = document.getElementById('lobby');
const game = document.getElementById('game');

// ===== КООРДИНАТЫ (ТВОИ) =====
const cells = [
  {x:0.09,y:0.57,type:'start'},
  {x:0.08,y:0.44,type:'plus',v:3},
  {x:0.08,y:0.33,type:'plus',v:2},
  {x:0.09,y:0.22,type:'scandal'},
  {x:0.08,y:0.12,type:'risk'},
  {x:0.20,y:0.09,type:'plus',v:2},
  {x:0.32,y:0.08,type:'scandal'},
  {x:0.49,y:0.09,type:'plus',v:3},
  {x:0.62,y:0.09,type:'plus',v:5},
  {x:0.77,y:0.09,type:'minus',v:8},
  {x:0.89,y:0.12,type:'skip'},
  {x:0.90,y:0.24,type:'plus',v:3},
  {x:0.90,y:0.34,type:'risk'},
  {x:0.90,y:0.45,type:'plus',v:3},
  {x:0.88,y:0.55,type:'skip'},
  {x:0.77,y:0.58,type:'plus',v:2},
  {x:0.63,y:0.59,type:'scandal'},
  {x:0.49,y:0.58,type:'plus',v:8},
  {x:0.35,y:0.58,type:'minus',v:10},
  {x:0.21,y:0.58,type:'plus',v:4}
];

// ===== ВЫБОР ФИШКИ =====
document.querySelectorAll('.chip').forEach(c=>{
  c.onclick = ()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));
    c.classList.add('selected');
    color = c.dataset.color;
  };
});

// ===== ВХОД =====
joinBtn.onclick = ()=>{
  username = usernameInput.value.trim();
  roomCode = roomInput.value.trim();

  if(!username || !roomCode || !color){
    alert("Заполни всё");
    return;
  }

  socket.emit('joinRoom',{username,roomCode,color});
};

// ===== СТАРТ =====
startBtn.onclick = ()=>{
  if(!roomCode){
    alert("Сначала войди");
    return;
  }
  socket.emit('startGame',roomCode);
};

// ===== СОКЕТ =====
socket.on('updatePlayers',p=>{
  players = p;

  // фикс позиции
  players.forEach(pl=>{
    if(pl.position === undefined) pl.position = 0;
    if(pl.hype === undefined) pl.hype = 0;
  });

  renderPlayers();
  renderHype();
  renderLobbyPlayers();
});

socket.on('gameStarted',()=>{
  lobby.style.display="none";
  game.style.display="block";
});

socket.on('nextTurn',id=>{
  currentTurnId = id;

  rollBtn.disabled = (id !== socket.id);
});

socket.on('diceRolled',({playerId,dice})=>{
  document.getElementById('diceText').innerText =
    `🎲 Выпало ${dice}`;

  if(playerId === socket.id){
    move(dice);
  }
});

// ===== ДВИЖЕНИЕ =====
function move(steps){
  const me = players.find(p=>p.id===socket.id);
  if(!me) return;

  isAnimating = true;
  let i = 0;

  function step(){
    if(i >= steps){
      isAnimating = false;
      handleCell(me);
      return;
    }

    me.position = (me.position + 1) % cells.length;

    renderPlayers();

    i++;
    setTimeout(step, 220);
  }

  step();
}

// ===== ЛОГИКА =====
function handleCell(p){
  const c = cells[p.position];

  if(c.type === 'plus') p.hype += c.v;
  if(c.type === 'minus') p.hype = Math.max(0, p.hype - c.v);

  if(c.type === 'skip') p.skip = true;

  if(c.type === 'scandal') return showScandal(p);
  if(c.type === 'risk') return showRisk(p);

  finishTurn(p);
}

// ===== СКАНДАЛ =====
function showScandal(p){
  const list = [
    {t:"🔥 -1",v:-1},
    {t:"🫣 -2",v:-2},
    {t:"😱 -3",v:-3},
    {t:"#️⃣ всем -3",v:-3,all:true},
    {t:"😮 -4",v:-4},
    {t:"🤫 -5",v:-5},
    {t:"🙄 -5 + пропуск",v:-5,skip:true}
  ];

  const e = list[Math.floor(Math.random()*list.length)];

  if(e.all){
    players.forEach(pl=>{
      pl.hype = Math.max(0, pl.hype + e.v);
    });
  } else {
    p.hype = Math.max(0, p.hype + e.v);
  }

  if(e.skip) p.skip = true;

  document.getElementById('scandalText').innerText = e.t;
  document.getElementById('scandalModal').style.display = "flex";
}

function closeScandal(){
  document.getElementById('scandalModal').style.display = "none";
  finishTurn(players.find(p=>p.id===socket.id));
}

// ===== РИСК =====
function showRisk(){
  document.getElementById('riskModal').style.display = "flex";
}

function rollRisk(){
  const me = players.find(p=>p.id===socket.id);

  const d = Math.floor(Math.random()*6)+1;
  const val = d <= 3 ? -5 : 5;

  me.hype = Math.max(0, me.hype + val);

  document.getElementById('riskResult').innerText =
    `🎲 ${d} → ${val}`;
}

function closeRisk(){
  document.getElementById('riskModal').style.display = "none";
  finishTurn(players.find(p=>p.id===socket.id));
}

// ===== КОНЕЦ ХОДА =====
function finishTurn(p){

  renderHype();

  if(p.hype >= 70){
    alert("🏆 Победа: " + p.username);
  }

  socket.emit('updatePlayer',{
    roomCode,
    player:p
  });
}

// ===== РЕНДЕР ФИШЕК =====
function renderPlayers(){
  const board = document.getElementById('gameBoard');

  players.forEach(p=>{
    let el = document.getElementById(p.id);

    if(!el){
      el = document.createElement('div');
      el.className = 'player';
      el.id = p.id;
      board.appendChild(el);
    }

    const c = cells[p.position];

    el.style.left = (c.x * 100) + '%';
    el.style.top = (c.y * 100) + '%';
    el.style.background = p.color;
  });
}

// ===== ХАЙП =====
function renderHype(){
  const box = document.getElementById('hypeBars');
  box.innerHTML = "";

  players.forEach(p=>{
    const percent = Math.min(p.hype,70)/70*100;

    box.innerHTML += `
      <div style="margin:8px 0">
        <div>${p.username} (${p.hype})</div>
        <div style="height:10px;background:#222">
          <div style="height:100%;width:${percent}%;background:#00eaff"></div>
        </div>
      </div>
    `;
  });
}

// ===== ЛОББИ =====
function renderLobbyPlayers(){
  const list = document.getElementById('playersList');

  list.innerHTML = players.map(p =>
    `<div style="color:${p.color}">${p.username}</div>`
  ).join('');
}
