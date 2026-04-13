const socket = io();

let players = [];
let currentTurnId = null;

let username, roomCode, color;
let isAnimating = false;
let gameOver = false;

function setStatus(text){
  document.getElementById('gameStatus').innerText = text;
}

window.onload = () => {

document.querySelectorAll('.chip').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
    btn.classList.add('selected');
    color = btn.dataset.color;
  };
});

joinBtn.onclick=()=>{
  username = username.value.trim();
  roomCode = roomCode.value.trim();
  socket.emit('joinRoom',{username,roomCode,color});
};

startBtn.onclick=()=>{
  socket.emit('startGame',roomCode);
};

rollBtn.onclick=()=>{
  if(gameOver||isAnimating) return;
  if(currentTurnId!==socket.id) return;
  socket.emit('rollDice',roomCode);
};
};

socket.on('updatePlayers',pl=>{
  players = pl;
  renderPlayers();
  renderHypeBars();
});

socket.on('gameStarted',()=>{
  lobby.style.display='none';
  game.style.display='flex';
});

socket.on('nextTurn',id=>{
  currentTurnId=id;
  const p=players.find(x=>x.id===id);
  if(p) setStatus(`👉 Ходит ${p.username}`);
});

socket.on('diceRolled',({playerId,dice})=>{
  const p=players.find(x=>x.id===playerId);
  if(p) setStatus(`🎲 ${p.username} выбросил ${dice}`);
  if(playerId===socket.id) movePlayer(dice);
});

function movePlayer(steps){
  const me=players.find(p=>p.id===socket.id);
  isAnimating=true;
  let i=0;
  function step(){
    if(i>=steps){isAnimating=false;handleCell(me);return;}
    me.position=(me.position+1)%20;
    renderPlayers();
    i++; setTimeout(step,200);
  }
  step();
}

function handleCell(p){
  if(p.position===3||p.position===6||p.position===16){
    setStatus(`💥 ${p.username} попал на скандал`);
    scandalModal.style.display='flex';
    return;
  }

  if(p.position===4||p.position===12){
    setStatus(`⚡ ${p.username} рискует`);
    riskModal.style.display='flex';
    return;
  }

  finishTurn(p);
}

function finishTurn(p){
  renderHypeBars();
  socket.emit('playerMoved',{roomCode,position:p.position,hype:p.hype});
}

function renderPlayers(){
  const board=gameBoard.getBoundingClientRect();
  players.forEach(p=>{
    let el=document.getElementById(p.id);
    if(!el){
      el=document.createElement('div');
      el.id=p.id;
      el.className='player '+p.color;
      gameBoard.appendChild(el);
    }
    el.style.left=board.width*0.5+'px';
    el.style.top=board.height*0.5+'px';
  });
}

function renderHypeBars(){
  hypeBars.innerHTML='';
  players.forEach(p=>{
    hypeBars.innerHTML+=`<div>${p.username}: ${p.hype}/70</div>`;
  });
}
