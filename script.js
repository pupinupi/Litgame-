const socket = io();

let room = "";
let color = "";

const path = [
  {x:100,y:900},{x:100,y:700},{x:100,y:500},{x:100,y:300},{x:100,y:100},
  {x:300,y:100},{x:500,y:100},{x:700,y:100},{x:900,y:100},
  {x:900,y:300},{x:900,y:500},{x:900,y:700},{x:900,y:900},
  {x:700,y:900},{x:500,y:900},{x:300,y:900},
  {x:200,y:800},{x:300,y:700},{x:400,y:600},{x:500,y:500}
];

const tokens = {};

function setColor(c){ color = c; }

function join(){
  const name = nameInput.value;
  room = roomInput.value;

  socket.emit("join_room",{name,room,color});
}

function start(){
  socket.emit("start_game",room);
}

function rollDice(){
  new Audio("dice.mp3").play();
  socket.emit("roll_dice",room);
}

socket.on("update_players",(players)=>{
  playersList.innerHTML = players.map(p =>
    `<div style="color:${p.color}">${p.name}</div>`
  ).join("");
});

socket.on("game_started",()=>{
  menu.style.display="none";
  game.style.display="block";
});

socket.on("game_update",(g)=>{
  players.innerHTML = g.players.map(p =>
    `<div>${p.name}: ${p.hype}</div>`
  ).join("");

  g.players.forEach(p=>{
    if(!tokens[p.id]){
      const t=document.createElement("div");
      t.className="token";
      t.style.background=p.color;

      boardWrap.appendChild(t);
      tokens[p.id]=t;

      t.style.left = path[0].x + "px";
      t.style.top = path[0].y + "px";
    }

    tokens[p.id].style.left = path[p.position].x + "px";
    tokens[p.id].style.top = path[p.position].y + "px";
  });
});

socket.on("dice_result",(d)=>{
  alert("🎲 Выпало: "+d);
});
