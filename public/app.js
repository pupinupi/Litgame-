const socket = io();

let players = [];
let roomCode, username;

let currentTurnId = null;
let isAnimating = false;

/* cells */
const cells = Array.from({length:20}).map((_,i)=>({
  x:0.1+(i%5)*0.2,
  y:0.1+Math.floor(i/5)*0.2
}));

/* LOBBY */
document.getElementById('joinBtn').onclick = () => {
  username = document.getElementById('username').value;
  roomCode = document.getElementById('roomCode').value;

  socket.emit('joinRoom', { username, roomCode, color: "blue" });
};

/* SERVER */
socket.on('joinedRoom', data => {
  document.getElementById('roomStatus').innerText =
    "Ты в комнате: " + data.roomCode;
});

socket.on('gameStarted', () => {
  document.getElementById('lobby').style.display = "none";
  document.getElementById('game').style.display = "block";
});

/* PLAYERS */
socket.on('updatePlayers', p => {
  players = p;
  render();
  renderHype();
});

/* TURN */
socket.on('nextTurn', id => {
  currentTurnId = id;
});

/* DICE */
document.getElementById('rollBtn').onclick = () => {
  if (isAnimating) return;
  if (currentTurnId !== socket.id) return;

  socket.emit('rollDice', roomCode);
};

socket.on('diceRolled', ({playerId, dice}) => {

  let i = 0;
  const el = document.getElementById('diceResult');

  const anim = setInterval(() => {
    el.innerText = Math.floor(Math.random()*6)+1;

    if (++i > 10) {
      clearInterval(anim);
      el.innerText = dice;

      if (playerId === socket.id) move(dice);
    }
  }, 70);
});

/* MOVE */
function move(steps){
  const me = players.find(p => p.id === socket.id);
  if (!me) return;

  isAnimating = true;

  let i = 0;

  function step(){
    if (i >= steps) {
      isAnimating = false;
      finish(me);
      return;
    }

    me.position = (me.position + 1) % cells.length;
    render();

    i++;
    setTimeout(step, 130);
  }

  step();
}

/* FINISH */
function finish(p){
  socket.emit('playerMoved', {
    roomCode,
    position: p.position,
    hype: p.hype,
    skipNext: p.skipNext
  });
}

/* RENDER */
function render(){
  const board = document.getElementById('gameBoard');

  players.forEach(p => {
    let el = document.getElementById(p.id);

    if (!el) {
      el = document.createElement('div');
      el.className = 'player';
      el.id = p.id;
      board.appendChild(el);
    }

    const c = cells[p.position] || cells[0];

    el.style.left = c.x * 100 + "%";
    el.style.top = c.y * 100 + "%";
    el.style.background = p.color;
  });
}

/* HYPE */
function renderHype(){
  let bar = document.getElementById('hypeBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = "hypeBar";
    document.body.insertBefore(bar, document.body.children[1]);
  }

  const me = players.find(p => p.id === socket.id);
  if (!me) return;

  const percent = Math.min(me.hype, 70) / 70 * 100;

  bar.innerHTML = `<div style="width:${percent}%"></div>`;
}
