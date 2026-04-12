const socket = io();

let room = "";
let color = "";

const boardWrap = document.getElementById("boardWrap");

const path = [
  {x:59,y:358},{x:59,y:281},{x:54,y:214},{x:56,y:150},{x:59,y:89},
  {x:125,y:65},{x:200,y:65},{x:299,y:68},{x:380,y:71},{x:484,y:64},
  {x:555,y:76},{x:554,y:153},{x:552,y:212},{x:550,y:271},{x:544,y:352},
  {x:467,y:367},{x:387,y:366},{x:301,y:360},{x:218,y:358},{x:144,y:353}
];

const tokens = {};

function log(t){
  document.getElementById("debug").innerHTML = t;
}

function setColor(c){
  color = c;
  log("Цвет: " + c);
}

function join(){
  const name = document.getElementById("name").value;
  const r = document.getElementById("room").value;

  room = r;

  socket.emit("join_room",{name,room,color});
  log("Вход в комнату");
}

function start(){
  socket.emit("start_game",room);
}

function rollDice(){
  socket.emit("roll_dice",room);
}

// 🔥 создание фишки
function createToken(p){
  const t = document.createElement("div");
  t.className = "token";
  t.style.background = p.color;

  boardWrap.appendChild(t);

  t.style.left = path[0].x + "px";
  t.style.top = path[0].y + "px";

  tokens[p.id] = t;
}

// 🚶 движение
function moveToken(p){
  const t = tokens[p.id];
  if(!t) return;

  const pos = path[p.position];
  if(!pos) return;

  t.style.left = pos.x + "px";
  t.style.top = pos.y + "px";
}

// 👥 лобби
socket.on("update_players",(players)=>{
  document.getElementById("playersList").innerHTML =
    players.map(p=>`<div style="color:${p.color}">${p.name}</div>`).join("");
});

// 🎮 старт
socket.on("game_started",()=>{
  document.getElementById("menu").style.display="none";
  document.getElementById("game").style.display="block";
});

// 🎲 игра
socket.on("game_update",(g)=>{

  document.getElementById("players").innerHTML =
    g.players.map(p=>`${p.name}: ${p.hype}`).join("<br>");

  g.players.forEach(p=>{
    if(!tokens[p.id]) createToken(p);
    moveToken(p);
  });

});

// 🎲 кубик
socket.on("dice_result",(d)=>{
  log("Выпало: " + d);
});
