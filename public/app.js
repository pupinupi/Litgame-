const socket = io();

let players = [];
let currentTurnId = null;
let username, roomCode, color;

let isAnimating = false;

const diceSound = new Audio("dice.mp3");

/* CELLS */
const cells = Array.from({length:20}).map((_,i)=>({
  x: 0.1 + (i%5)*0.2,
  y: 0.1 + Math.floor(i/5)*0.2
}));

/* LOBBY */
window.onload = () => {

  document.querySelectorAll('.chip').forEach(c=>{
    c.onclick = ()=>{
      document.querySelectorAll('.chip').forEach(x=>x.classList.remove('selected'));
      c.classList.add('selected');
      color=c.dataset.color;
    };
  });

  document.getElementById('joinBtn').onclick=()=>{
    username=document.getElementById('username').value;
    roomCode=document.getElementById('roomCode').value;

    socket.emit('joinRoom',{username,roomCode,color});
  };

  document.getElementById('startBtn').onclick=()=>{
    socket.emit('startGame',roomCode);
  };

  document.getElementById('rollBtn').onclick=()=>{
    if(currentTurnId!==socket.id || isAnimating) return;
    socket.emit('rollDice',roomCode);
  };
};

/* SOCKET */
socket.on('joinSuccess',()=>{
  document.getElementById('lobby').style.display='none';
  document.getElementById('game').style.display='block';
});

socket.on('joinError',m=>alert(m));

socket.on('updatePlayers',p=>{
  players=p;
  render();
});

socket.on('nextTurn',id=>{
  currentTurnId=id;
});

/* DICE */
socket.on('diceRolled',({playerId,dice})=>{
  diceSound.play();

  let i=0;
  const el=document.getElementById('diceResult');

  const anim=setInterval(()=>{
    el.innerText=Math.floor(Math.random()*6)+1;
    if(++i>10){
      clearInterval(anim);
      el.innerText=dice;
      if(playerId===socket.id) move(dice);
    }
  },80);
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

      socket.emit('playerMoved',{
        roomCode,
        position:me.position,
        hype:me.hype,
        skipNext:me.skipNext
      });
      return;
    }

    me.position=(me.position+1)%cells.length;
    render();
    i++;
    setTimeout(step,140);
  }

  step();
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
