const socket = io();

let players = [];
let roomCode = "";
let username = "";
let color = "";
let hostId = null;
let currentTurnId = null;

let isAnimating = false;

/* CELLS */
let cells = [];

/* CHOOSE CHIP */
document.querySelectorAll('.chip').forEach(c=>{
  c.onclick=()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));
    c.classList.add('selected');
    color=c.dataset.color;
  };
});

/* JOIN ROOM */
document.getElementById('joinBtn').onclick=()=>{
  username=document.getElementById('username').value.trim();
  roomCode=document.getElementById('roomCode').value.trim();

  socket.emit('joinRoom',{username,roomCode,color});
};

/* ROOM JOINED */
socket.on('joinedRoom', data=>{
  hostId = data.hostId;
  roomCode = data.roomCode;

  document.getElementById('roomInfo').innerText =
    "Ты в комнате: " + roomCode;

  if(socket.id === hostId){
    document.getElementById('startBtn').classList.remove('hidden');
  }
});

/* START GAME */
document.getElementById('startBtn').onclick=()=>{
  socket.emit('startGame', roomCode);
};

/* SWITCH TO GAME */
socket.on('gameStarted',()=>{
  document.getElementById('lobby').style.display='none';
  document.getElementById('game').style.display='block';
});

/* PLAYERS */
socket.on('updatePlayers',p=>{
  players=p;
  render();
});

/* TURN */
socket.on('nextTurn',id=>{
  currentTurnId=id;
});

/* DICE */
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

/* MOVE */
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

/* FINISH */
function finish(p){
  socket.emit('playerMoved',{
    roomCode,
    position:p.position,
    hype:p.hype,
    skipNext:p.skipNext
  });
}

/* RENDER */
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

    const c=cells[p.position]||cells[0];

    el.style.left=c.x*100+'%';
    el.style.top=c.y*100+'%';
    el.style.background=p.color;
  });
}
