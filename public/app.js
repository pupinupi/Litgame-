const socket = io();

let players = [];
let roomCode, username, color;
let currentTurnId;

/* КООРДИНАТЫ */
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

/* выбор */
document.querySelectorAll('.chip').forEach(c=>{
  c.onclick=()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));
    c.classList.add('selected');
    color=c.dataset.color;
  };
});

/* вход */
joinBtn.onclick=()=>{
  username=username.value;
  roomCode=roomCode.value;
  socket.emit('joinRoom',{username,roomCode,color});
};

/* старт */
startBtn.onclick=()=>{
  socket.emit('startGame',roomCode);
};

socket.on('gameStarted',()=>{
  lobby.style.display="none";
  game.style.display="block";
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
rollBtn.onclick=()=>{
  if(currentTurnId!==socket.id) return;
  socket.emit('rollDice',roomCode);
};

socket.on('diceRolled',({playerId,dice})=>{
  diceText.innerText = `Выпало ${dice}`;

  if(playerId===socket.id) move(dice);
});

/* движение */
function move(steps){
  const me=players.find(p=>p.id===socket.id);
  let i=0;

  function step(){
    if(i>=steps){
      handleCell(me);
      return;
    }

    me.position=(me.position+1)%cells.length;
    render();

    i++;
    setTimeout(step,200);
  }

  step();
}

/* ЛОГИКА */
function handleCell(p){
  const c=cells[p.position];

  if(c.type==='plus') p.hype+=c.v;
  if(c.type==='minus') p.hype=Math.max(0,p.hype-c.v);

  if(c.type==='skip') p.skip=true;

  if(c.type==='scandal') return showScandal(p);
  if(c.type==='risk') return showRisk(p);

  finish(p);
}

/* СКАНДАЛ */
function showScandal(p){
  const list=[
    {t:"🔥 -1",v:-1},
    {t:"🫣 -2",v:-2},
    {t:"😱 -3",v:-3},
    {t:"#️⃣ всем -3",v:-3,all:true},
    {t:"😮 -4",v:-4},
    {t:"🤫 -5",v:-5},
    {t:"🙄 -5 + пропуск",v:-5,skip:true}
  ];

  const e=list[Math.floor(Math.random()*list.length)];

  if(e.all){
    players.forEach(pl=>pl.hype=Math.max(0,pl.hype+e.v));
  } else {
    p.hype=Math.max(0,p.hype+e.v);
  }

  if(e.skip) p.skip=true;

  scandalText.innerText=e.t;
  scandalModal.style.display="flex";
}

function closeScandal(){
  scandalModal.style.display="none";
  finish(players.find(p=>p.id===socket.id));
}

/* РИСК */
function showRisk(){
  riskModal.style.display="flex";
}

function rollRisk(){
  const me=players.find(p=>p.id===socket.id);
  const d=Math.floor(Math.random()*6)+1;
  const val=d<=3?-5:5;

  me.hype=Math.max(0,me.hype+val);

  riskResult.innerText=`🎲 ${d} → ${val}`;
}

function closeRisk(){
  riskModal.style.display="none";
  finish(players.find(p=>p.id===socket.id));
}

/* конец */
function finish(p){
  if(p.hype>=70){
    alert("🏆 Победа: "+p.username);
  }

  socket.emit('updatePlayer',{roomCode,player:p});
}

/* рендер */
function render(){
  const board=gameBoard;

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

function renderHype(){
  hypeBars.innerHTML="";

  players.forEach(p=>{
    const percent=Math.min(p.hype,70)/70*100;

    hypeBars.innerHTML+=`
      <div>${p.username} (${p.hype})</div>
      <div class="hypeBar">
        <div class="fill" style="width:${percent}%"></div>
      </div>
    `;
  });
}
