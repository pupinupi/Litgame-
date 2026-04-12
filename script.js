const socket = io();

let room = "";
let color = "";

// 📍 координаты (пока базовые — потом заменим на твои точные)
const path = [
  {x:100,y:900},{x:100,y:700},{x:100,y:500},{x:100,y:300},{x:100,y:100},
  {x:300,y:100},{x:500,y:100},{x:700,y:100},{x:900,y:100},
  {x:900,y:300},{x:900,y:500},{x:900,y:700},{x:900,y:900},
  {x:700,y:900},{x:500,y:900},{x:300,y:900},
  {x:200,y:800},{x:300,y:700},{x:400,y:600},{x:500,y:500}
];

// 🎯 фишки
const tokens = {};

// 📢 лог на экран
function log(text){
  document.getElementById("debug").innerHTML = text;
}

// 🎨 выбор цвета
function setColor(c){
  color = c;
  log("Выбран цвет: " + c);
}

// 🚪 вход
function join(){
  const name = document.getElementById("name").value;
  const roomInput = document.getElementById("room").value;

  if(!name || !roomInput || !color){
    log("❌ Заполни всё");
    return;
  }

  room = roomInput;

  log("✅ Вход: " + name + " / " + room);

  socket.emit("join_room",{name,room,color});
}

// ▶ старт
function start(){
  if(!room){
    log("❌ Сначала войди");
    return;
  }

  log("🚀 Старт игры");

  socket.emit("start_game",room);
}

// 🎲 кубик
function rollDice(){
  log("🎲 Бросок кубика");

  socket.emit("roll_dice",room);
}

// 🟢 СОЗДАНИЕ ФИШКИ
function createToken(player){
  const t = document.createElement("div");

  t.className = "token";
  t.style.background = player.color;

  document.getElementById("boardWrap").appendChild(t);

  // ставим на старт
  t.style.left = path[0].x + "px";
  t.style.top = path[0].y + "px";

  tokens[player.id] = t;
}

// 🚶 ДВИЖЕНИЕ
function moveToken(player){
  const t = tokens[player.id];
  const pos = path[player.position];

  if(!t || !pos) return;

  t.style.left = pos.x + "px";
  t.style.top = pos.y + "px";
}

// 👥 список игроков (лобби)
socket.on("update_players",(players)=>{
  const list = document.getElementById("playersList");

  if(list){
    list.innerHTML = players.map(p =>
      `<div style="color:${p.color}">${p.name}</div>`
    ).join("");
  }

  log("👥 Игроков: " + players.length);
});

// 🎮 старт игры
socket.on("game_started",()=>{
  document.getElementById("menu").style.display="none";
  document.getElementById("game").style.display="block";

  log("🎮 Игра началась");
});

// 🔥 ОБНОВЛЕНИЕ ИГРЫ (ФИШКИ ТУТ)
socket.on("game_update",(g)=>{

  // список очков
  const playersDiv = document.getElementById("players");

  playersDiv.innerHTML = g.players.map(p =>
    `<div style="color:${p.color}">
      ${p.name}: ${p.hype}
    </div>`
  ).join("");

  // фишки
  g.players.forEach(p => {

    if(!tokens[p.id]){
      createToken(p);
    }

    moveToken(p);
  });

});

// 🎲 результат
socket.on("dice_result",(d)=>{
  log("🎲 Выпало: " + d);
});
