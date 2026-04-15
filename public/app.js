const socket = io();

let players = [];
let currentTurnId = null;

let username, roomCode, color;

// координаты (твои)
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

// выбор цвета
document.querySelectorAll('.chip').forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
    btn.classList.add('selected');
    color = btn.dataset.color;
  };
});

// вход
document.getElementById('joinBtn').onclick = ()=>{
  username = document.getElementById('username').value;
  roomCode = document.getElementById('roomCode').value;

  socket.emit('joinRoom',{username,roomCode,color});
};

// старт
document.getElementById('startBtn').onclick = ()=>{
  socket.emit('startGame',roomCode);
};

// кубик
document.getElementById('rollBtn').onclick = ()=>{
  if(currentTurnId !== socket.id) return;
  socket.emit('rollDice',roomCode);
};

// socket
socket.on('updatePlayers',pl=>{
  players = pl;
  renderPlayers();
  renderHype();
});

socket.on('gameStarted',()=>{
  document.getElementById('lobby').style.display='none';
  document.getElementById('game').style.display='block';
});

socket.on('nextTurn',id=>{
  currentTurnId = id;
});

socket.on('diceRolled',({playerId,dice})=>{
  document.getElementById('diceResult').innerText = "🎲 " + dice;

  if(playerId === socket.id){
    movePlayer(dice);
  }
});

// движение
function movePlayer(steps){
  const me = players.find(p=>p.id===socket.id);
  let i = 0;

  function step(){
    if(i >= steps){
      finishTurn(me);
      return;
    }

    me.position = (me.position + 1) % cells.length;
    renderPlayers();

    i++;
    setTimeout(step,200);
  }

  step();
}

// конец хода
function finishTurn(p){
  socket.emit('playerMoved',{
    roomCode,
    position:p.position,
    hype:p.hype,
    skipNext:p.skipNext
  });
}

// рендер
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

// хайп
function renderHype(){
  const box = document.getElementById('hypeBars');
  box.innerHTML = players.map(p =>
    `<div>${p.username}: ${p.hype}</div>`
  ).join('');
}
