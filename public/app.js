const socket = io();

let players = [];
let currentTurnId = null;
let username, roomCode, color;

let isAnimating = false;
let gameOver = false;

let currentRisk = null;
let currentScandal = null;

/* SOUND */
const diceSound = new Audio("dice.mp3");
const scandalSound = new Audio("scandal.mp3");

/* MODAL */
function openModal(id){
  document.getElementById(id).style.display = "flex";
}
function closeModal(id){
  document.getElementById(id).style.display = "none";
}

window.onload = () => {

  document.querySelectorAll('.chip').forEach(btn=>{
    btn.onclick = () => {
      document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
      btn.classList.add('selected');
      color = btn.dataset.color;
    };
  });

  document.getElementById('joinBtn').onclick = () => {
    username = document.getElementById('username').value;
    roomCode = document.getElementById('roomCode').value;

    socket.emit('joinRoom', { username, roomCode, color });
  };

  document.getElementById('startBtn').onclick = () => {
    socket.emit('startGame', roomCode);
  };

  document.getElementById('rollBtn').onclick = () => {
    if (currentTurnId !== socket.id) return;
    if (isAnimating || gameOver) return;

    socket.emit('rollDice', roomCode);
  };
};

/* SOCKET */
socket.on('updatePlayers', pl => {
  players = pl;
  renderPlayers();
  renderHypeBars();
});

socket.on('nextTurn', id => {
  currentTurnId = id;
});

/* DICE */
socket.on('diceRolled', ({ playerId, dice }) => {

  diceSound.play();

  let i = 0;
  const el = document.getElementById('diceResult');

  const anim = setInterval(()=>{
    el.innerText = Math.floor(Math.random()*6)+1;
    i++;
    if(i>10){
      clearInterval(anim);
      el.innerText = dice;
      if(playerId === socket.id) movePlayer(dice);
    }
  },80);
});

/* BOARD */
const cells = [
  {x:0.1,y:0.5},
  {x:0.2,y:0.4},
  {x:0.3,y:0.3},
  {x:0.4,y:0.2},
  {x:0.5,y:0.1}
];

/* MOVE FIX */
function movePlayer(steps){
  const me = players.find(p=>p.id===socket.id);
  if(!me) return;

  isAnimating = true;
  let i=0;

  function step(){
    if(i>=steps){
      isAnimating=false;
      handleCell(me);
      return;
    }

    me.position = (me.position+1)%cells.length;
    renderPlayers();

    i++;
    setTimeout(step,180);
  }

  step();
}

/* CELL */
function handleCell(p){
  finishTurn(p);
}

function finishTurn(p){
  socket.emit('playerMoved',{
    roomCode,
    position:p.position,
    hype:p.hype,
    skipNext:p.skipNext
  });
}

/* RENDER */
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

    const c = cells[p.position] || cells[0];

    el.style.left = c.x*100+'%';
    el.style.top = c.y*100+'%';
  });
}

function renderHypeBars(){}

/* SCANDAL + RISK (НЕ ТРОГАЛ ЛОГИКУ) */
function showScandal(p){
  currentScandal=p;
  openModal('scandalModal');
}
function closeScandal(){
  closeModal('scandalModal');
  finishTurn(currentScandal);
}

function showRisk(p){
  currentRisk=p;
  openModal('riskModal');
}
function rollRisk(){
  const d=Math.floor(Math.random()*6)+1;
  currentRisk.hype += d>3?5:-5;
  document.getElementById('riskResult').innerText=d;
}
function closeRisk(){
  closeModal('riskModal');
  finishTurn(currentRisk);
}
