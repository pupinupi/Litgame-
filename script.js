const socket = io();

let room = "";
let color = "";

const path = [
  {x:59,y:358},{x:59,y:281},{x:54,y:214},{x:56,y:150},{x:59,y:89},
  {x:125,y:65},{x:200,y:65},{x:299,y:68},{x:380,y:71},{x:484,y:64},
  {x:555,y:76},{x:554,y:153},{x:552,y:212},{x:550,y:271},{x:544,y:352},
  {x:467,y:367},{x:387,y:366},{x:301,y:360},{x:218,y:358},{x:144,y:353}
];

const tokens = {};

function getToken(p){
  if(!tokens[p.id]){
    const t=document.createElement("div");
    t.style.position="absolute";
    t.style.width="20px";
    t.style.height="20px";
    t.style.borderRadius="50%";
    t.style.background=p.color;
    t.style.boxShadow="0 0 10px white";
    document.body.appendChild(t);
    tokens[p.id]=t;
  }
  return tokens[p.id];
}

function moveToken(p){
  const token=getToken(p);
  let i=p.prevPosition;

  function step(){
    if(i===p.position) return;
    i=(i+1)%path.length;

    const pos=path[i];

    token.style.left=pos.x+"px";
    token.style.top=pos.y+"px";

    setTimeout(step,200);
  }
  step();
}

function setColor(c){color=c;}

function join(){
  const name=document.getElementById("name").value;
  room=document.getElementById("room").value;
  socket.emit("join_room",{name,room,color});
}

function start(){socket.emit("start_game",room);}

function rollDice(){
  new Audio("dice.mp3").play();
  socket.emit("roll_dice",room);
}

socket.on("game_started",()=>{
  menu.style.display="none";
  game.style.display="block";
});

socket.on("game_update",(g)=>{
  players.innerHTML=g.players.map(p=>`${p.name}: ${p.hype}`).join("<br>");

  g.players.forEach(p=>moveToken(p));
});

socket.on("dice_result",(d)=>{
  alert("🎲 "+d);
});
