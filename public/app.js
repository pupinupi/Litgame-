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
  document.getElementById('gameStatus').innerText = text;
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
  username = document.getElementById('usernameInput').value.trim();
  roomCode = document.getElementById('roomInput').value.trim();

  if(!username || !roomCode || !color){
    alert("Заполни всё");
    return;
  }

  socket.emit('joinRoom',{username,roomCode,color});
};

// ===== СТАРТ =====
document.getElementById('startBtn').onclick = ()=>{
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
  renderPlayers();
  renderHypeBars();

  // список игроков в лобби
  const list = document.getElementById('playersList');
  if(list){
    list.innerHTML = players.map(p =>
      `<div style="color:${p.color}">${p.username}</div>`
    ).join('');
  }
});

socket.on('gameStarted', ()=>{
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
});

socket.on('nextTurn', id=>{
  currentTurnId = id;

  const p = players.find(x=>x.id===id);
  if(p){
    setStatus(`👉 Ходит ${p.username}`);
  }

  document.getElementById('rollBtn').disabled =
    id !== socket.id || gameOver;
});

socket.on('playerSkipped', id=>{
  const p = players.find(x=>x.id===id);
  if(p){
    setStatus(`⛔ ${p.username} пропускает ход`);
  }
});

socket.on('diceRolled', ({playerId, dice})=>{
  const p = players.find(x=>x.id===playerId);

  if(p){
    setStatus(`🎲 ${p.username} выбросил ${dice}`);
  }

  document.getElementById('diceResult').innerText = "🎲 " + dice;

  if(playerId === socket.id){
    movePlayer(dice);
  }
});

// ===== КЛЕТКИ =====
const cells = [
  {type:'start'},
  {type:'plus',value:3},
  {type:'plus',value:2},
  {type:'scandal'},
  {type:'risk'},
  {type:'plus',value:2},
  {type:'scandal'},
  {type:'plus',value:3},
  {type:'plus',value:5},
  {type:'minus',value:10},
  {type:'minusSkip',value:8},
  {type:'plus',value:3},
  {type:'risk'},
  {type:'plus',value:3},
  {type:'skip'},
  {type:'plus',value:2},
  {type:'scandal'},
  {type:'plus',value:8},
  {type:'minus',value:10},
  {type:'plus',value:4}
];

// ===== ДВИЖЕНИЕ =====
function movePlayer(steps){
  const me = players.find(p=>p.id===socket.id);
  if(!me) return;

  isAnimating = true;
  let i = 0;

  function step(){
    if(i>=steps){
      isAnimating = false;
      handleCell(me);
      return;
    }

    const prev = me.position;
    me.position = (me.position+1)%cells.length;

    if(prev === cells.length-1 && me.position === 0){
      me.hype += 7;
    }

    renderPlayers();

    i++;
    setTimeout(step,120);
  }

  step();
}

// ===== ЛОГИКА КЛЕТОК =====
function handleCell(p){
  const c = cells[p.position];

  if(c.type==='start') p.hype+=10;
  if(c.type==='plus') p.hype+=c.value;
  if(c.type==='minus') p.hype=Math.max(0,p.hype-c.value);

  if(c.type==='minusSkip'){
    p.hype=Math.max(0,p.hype-c.value);
    p.skipNext=true;
  }

  if(c.type==='skip'){
    p.skipNext=true;
    setStatus(`⛔ ${p.username} пропускает ход`);
  }

  if(c.type==='risk'){
    showRisk(p);
    return;
  }

  if(c.type==='scandal'){
    showScandal(p);
    return;
  }

  finishTurn(p);
}

// ===== РИСК =====
function showRisk(p){
  setStatus(`⚡ ${p.username} рискует`);

  const modal = document.getElementById('riskModal');
  modal.style.display = 'flex';

  document.getElementById('riskResult').innerText = '';

  riskRollBtn.onclick = ()=>{
    const dice = Math.floor(Math.random()*6)+1;
    const result = dice<=3 ? -5 : 5;

    p.hype = Math.max(0,p.hype+result);

    document.getElementById('riskResult').innerText =
      `🎲 ${dice} → ${result>0?'+':''}${result}`;

    riskRollBtn.style.display='none';
    riskCloseBtn.style.display='inline-block';
  };

  riskCloseBtn.onclick = ()=>{
    modal.style.display='none';

    riskRollBtn.style.display='inline-block';
    riskCloseBtn.style.display='none';

    finishTurn(p);
  };
}

// ===== СКАНДАЛ =====
const scandals = [
  {t:'🔥 перегрел аудиторию',v:-1},
  {t:'🫣 громкий заголовок',v:-2},
  {t:'😱 это монтаж',v:-3},
  {t:'#️⃣ взломали',v:-3,all:true},
  {t:'😮 в шоке',v:-4},
  {t:'🤫 удаляй',v:-5},
  {t:'🙄 контент...',v:-5,skip:true}
];

function showScandal(p){
  scandalSound.currentTime = 0;
  scandalSound.play();

  shake();

  setStatus(`💥 ${p.username} попал на скандал`);

  const modal = document.getElementById('scandalModal');
  modal.style.display='flex';

  const s = scandals[Math.floor(Math.random()*scandals.length)];

  document.getElementById('scandalText').innerText =
    `${s.t} (${s.v})`;

  if(s.all){
    players.forEach(pl=>{
      pl.hype = Math.max(0,pl.hype+s.v);
    });
  } else {
    p.hype = Math.max(0,p.hype+s.v);
  }

  if(s.skip) p.skipNext=true;

  window.closeScandal = ()=>{
    modal.style.display='none';
    finishTurn(p);
  };
}

// ===== ТРЯСКА =====
function shake(){
  const b = document.getElementById('gameBoard');
  b.classList.add('shake');
  setTimeout(()=>b.classList.remove('shake'),400);
}

// ===== ФИНИШ =====
function finishTurn(p){
  renderHypeBars();

  if(p.hype>=70){
    gameOver=true;
    alert("🏆 Победа: "+p.username);
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

  players.forEach((p,i)=>{
    let el = document.getElementById(p.id);

    if(!el){
      el=document.createElement('div');
      el.className='player '+p.color;
      el.id=p.id;
      board.appendChild(el);
    }

    el.style.left = (100 + p.position*20) + 'px';
    el.style.top  = (100 + (i*20)) + 'px';
  });
}

function renderHypeBars(){
  const box=document.getElementById('hypeBars');
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
