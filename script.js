const socket = io();

let room = "";
let color = "";

// 📢 вывод на экран
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

// 👥 список игроков
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

// 🎲 результат
socket.on("dice_result",(d)=>{
  log("🎲 Выпало: " + d);
});
