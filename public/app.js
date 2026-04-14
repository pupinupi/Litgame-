const socket = io();

let players = [];
let roomCode, username, color;
let currentTurnId = null;
let isAnimating = false;

/* координаты */
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
  if(playerId===socket.id) move(dice);
});

/* движение (медленнее) */
function move(steps){
  const me=players.find(p=>p.id===socket.id);
  if(!me) return;

  isAnimating=true;
  let i=0;

  function step(){
    if(i>=steps){
      isAnimating=false;

      if(me.position===3) return showScandal(me);
      if(me.position===5) return showRisk(me);

      finish(me);
      return;
    }

    me.position=(me.position+1)%cells.length;
    render();

    i++;
    setTimeout(step,220); // МЕДЛЕННЕЕ
  }

  step();
}

/* 💥 СКАНДАЛ (ТВОИ КАРТОЧКИ) */
function showScandal(p){

  const list = [
    {text:"🔥 -1", val:-1},
    {text:"🫣 -2", val:-2},
    {text:"😱 -3", val:-3},
    {text:"#️⃣ всем -3", val:-3, all:true},
    {text:"😮 -4", val:-4},
    {text:"🤫 -5", val:-5},
    {text:"🙄 -5 + пропуск", val:-5}
  ];

  const e = list[Math.floor(Math.random()*list.length)];

  if(e.all){
    players.forEach(pl=>{
      pl.hype = Math.max(0, pl.hype + e.val);
    });
  } else {
    p.hype = Math.max(0, p.hype + e.val);
  }

  document.getElementById('scandalText').innerText = e.text;
  document.getElementById('scandalModal').style.display="flex";
}

function closeScandal(){
  document.getElementById('scandalModal').style.display="none";
  finish(players.find(p=>p.id===socket.id));
}

/* ⚡ РИСК */
function showRisk(){
  document.getElementById('riskModal').style.display="flex";
}

function rollRisk(){
  const me=players.find(p=>p.id===socket.id);

  const dice=Math.floor(Math.random()*6)+1;
  const val=dice<=3?-5:5;

  me.hype = Math.max(0, me.hype + val);

  document.getElementById('riskText').innerText =
    `🎲 ${dice} → ${val}`;
}

function closeRisk(){
  document.getElementById('riskModal').style.display="none";
  finish(players.find(p=>p.id===socket.id));
}

/* конец */
function finish(p){
  socket.emit('playerMoved',{
    roomCode,
    position:p.position,
    hype:p.hype,
    skipNext:false
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

/* 📊 ХАЙП */
function renderHype(){
  const box=document.getElementById('hypeBars');
  box.innerHTML="";

  players.forEach(p=>{
    const percent = Math.min(p.hype,70)/70*100;

    box.innerHTML += `
      <div class="hypeItem">
        <div>${p.username} (${p.hype})</div>
        <div class="hypeBar">
          <div class="hypeFill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  });
}
