const socket = io();

let players = [];
let roomCode, username, color;
let currentTurnId = null;
let isAnimating = false;

/* 🎯 ТВОИ КООРДИНАТЫ */
const cells = [
  {x:0.0933,y:0.5733},
  {x:0.0833,y:0.4467},
  {x:0.0883,y:0.3433},
  {x:0.0983,y:0.23},
  {x:0.085,y:0.1233},
  {x:0.2167,y:0.0883},
  {x:0.3483,y:0.0983},
  {x:0.495,y:0.1017},
  {x:0.6217,y:0.1033},
  {x:0.785,y:0.1},
  {x:0.9067,y:0.1317},
  {x:0.905,y:0.2533},
  {x:0.9067,y:0.3517},
  {x:0.9067,y:0.465},
  {x:0.8883,y:0.5867},
  {x:0.7717,y:0.62},
  {x:0.6383,y:0.6067},
  {x:0.505,y:0.605},
  {x:0.3533,y:0.5917},
  {x:0.2233,y:0.605}
];

/* выбор цвета */
document.querySelectorAll('.chip').forEach(c=>{
  c.onclick=()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));
    c.classList.add('selected');
    color=c.dataset.color;
  };
});

/* вход */
document.getElementById('joinBtn').onclick=()=>{
  username=document.getElementById('username').value;
  roomCode=document.getElementById('roomCode').value;

  socket.emit('joinRoom',{username,roomCode,color});
};

/* старт */
document.getElementById('startBtn').onclick=()=>{
  socket.emit('startGame',roomCode);
};

socket.on('gameStarted',()=>{
  document.getElementById('lobby').style.display='none';
  document.getElementById('game').style.display='block';
});

socket.on('updatePlayers',p=>{
  players=p;
  render();
  renderHype();
});

socket.on('nextTurn',id=>{
  currentTurnId=id;
});

/* кубик */
document.getElementById('rollBtn').onclick=()=>{
  if(currentTurnId!==socket.id || isAnimating) return;
  socket.emit('rollDice',roomCode);
};

socket.on('diceRolled',({playerId,dice})=>{

  let i=0;
  const el=document.getElementById('diceResult');

  const anim=setInterval(()=>{
    el.innerText=Math.floor(Math.random()*6)+1;

    if(++i>10){
      clearInterval(anim);
      el.innerText=dice;

      if(playerId===socket.id) move(dice);
    }
  },70);
});

/* движение */
function move(steps){
  const me=players.find(p=>p.id===socket.id);
  if(!me) return;

  isAnimating=true;
  let i=0;

  function step(){
    if(i>=steps){
      isAnimating=false;
      finish(me);
      return;
    }

    me.position=(me.position+1)%cells.length;
    render();

    i++;
    setTimeout(step,130);
  }

  step();
}

/* конец хода */
function finish(p){
  socket.emit('playerMoved',{
    roomCode,
    position:p.position,
    hype:p.hype,
    skipNext:p.skipNext
  });
}

/* рендер */
function render(){
  const board=document.getElementById('gameBoard');

  players.forEach(p=>{
    let el=document.getElementById(p.id);

    if(!el){
      el=document.createElement('div');
      el.className='player';
      el.id=p.id;
      board.appendChild(el);
    }

    const c=cells[p.position];

    el.style.left=c.x*100+'%';
    el.style.top=c.y*100+'%';
    el.style.background=p.color;
  });
}

/* хайп */
function renderHype(){
  const box=document.getElementById('hypeBars');
  box.innerHTML="";

  players.forEach(p=>{
    const percent=(p.hype/70)*100;

    box.innerHTML+=`
      <div style="margin:5px;">
        ${p.username}
        <div style="height:10px;background:#222;">
          <div style="width:${percent}%;height:100%;background:#00ffcc"></div>
        </div>
      </div>
    `;
  });
}

/* 💡 ПОДСКАЗКИ */
function showHint(text){
  const el = document.getElementById('hint');
  el.innerText = text;
  el.style.display = "block";

  setTimeout(()=> el.style.display="none",2000);
}

/* 💥 SHAKE */
function shakeBoard(){
  const board = document.getElementById('gameBoard');
  board.classList.add('shake');

  setTimeout(()=>{
    board.classList.remove('shake');
  },300);
}

/* 💥 СКАНДАЛ */
function showScandal(p){
  shakeBoard();

  const effects = [
    {text:"🔥 -3 хайпа", val:-3},
    {text:"😱 -5 хайпа", val:-5},
    {text:"🤡 -7 хайпа", val:-7}
  ];

  const e = effects[Math.floor(Math.random()*effects.length)];

  p.hype = Math.max(0, p.hype + e.val);

  document.getElementById('scandalText').innerText = e.text;
  document.getElementById('scandalModal').style.display="flex";

  showHint("Скандал! " + e.text);
}

function closeScandal(){
  document.getElementById('scandalModal').style.display="none";

  const me = players.find(p=>p.id===socket.id);
  finish(me);
}

/* ⚡ РИСК */
function showRisk(p){
  shakeBoard();

  document.getElementById('riskModal').style.display="flex";
  showHint("Риск! Брось кубик");
}

function rollRisk(){
  const dice = Math.floor(Math.random()*6)+1;

  const val = dice <= 3 ? -5 : 5;

  const me = players.find(p=>p.id===socket.id);

  me.hype = Math.max(0, me.hype + val);

  document.getElementById('riskText').innerText =
    `🎲 ${dice} → ${val}`;

  showHint(val > 0 ? "Повезло!" : "Не повезло!");
}

function closeRisk(){
  document.getElementById('riskModal').style.display="none";

  const me = players.find(p=>p.id===socket.id);
  finish(me);
}
