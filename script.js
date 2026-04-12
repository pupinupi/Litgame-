const socket = io();

let room = "";
let color = "";

// 🎯 ТВОИ КООРДИНАТЫ (НЕ ТРОГАТЬ)
const path = [
  {x:59,y:358},{x:59,y:281},{x:54,y:214},{x:56,y:150},{x:59,y:89},
  {x:125,y:65},{x:200,y:65},{x:299,y:68},{x:380,y:71},{x:484,y:64},
  {x:555,y:76},{x:554,y:153},{x:552,y:212},{x:550,y:271},{x:544,y:352},
  {x:467,y:367},{x:387,y:366},{x:301,y:360},{x:218,y:358},{x:144,y:353}
];

const tokens = {};

// 🎮 создать фишку
function getToken(p){
  if(!tokens[p.id]){
    const t = document.createElement("div");
    t.className = "token";
    t.style.background = p.color;

    document.getElementById("boardWrap").appendChild(t);

    // 💥 СТАВИМ НА СТАРТ СРАЗУ
    const start = path[0];
    t.style.left = start.x + "px";
    t.style.top = start.y + "px";

    tokens[p.id] = t;
  }
  return tokens[p.id];
}

// 🚶 движение по шагам
function moveToken(p){
  const token = getToken(p);

  let i = p.prevPosition ?? 0;

  function step(){
    if(i === p.position) return;

    i = (i + 1) % path.length;

    const pos = path[i];

    token.style.transition = "all 0.25s linear";
    token.style.left = pos.x + "px";
    token.style.top = pos.y + "px";

    setTimeout(step, 250);
  }

  step();
}

// 🎨 цвет
function setColor(c){ color = c; }

// 🚪 вход
function join(){
  const name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  if(!name || !room || !color){
    alert("Заполни всё!");
    return;
  }

  socket.emit("join_room", { name, room, color });
}

// ▶ старт
function start(){
  if(!room) return alert("Сначала войди!");
  socket.emit("start_game", room);
}

// 🎲 кубик
function rollDice(){
  new Audio("dice.mp3").play();
  socket.emit("roll_dice", room);
}

// 🎮 старт игры
socket.on("game_started", () => {
  menu.style.display = "none";
  game.style.display = "block";
});

// 👥 обновление
socket.on("game_update", (g) => {

  players.innerHTML = g.players
    .map(p => `<div style="color:${p.color}">
      ${p.name}: ${p.hype}
    </div>`).join("");

  g.players.forEach(p => {
    if(p.prevPosition === undefined){
      p.prevPosition = 0;
    }
    moveToken(p);
  });
});

// 🎲 результат
socket.on("dice_result", (d)=>{
  alert("🎲 Выпало: " + d);
});
