// ===== ЗАЩИТА ОТ ОШИБОК =====
window.onerror = function(msg, url, line){
  alert("❌ Ошибка: " + msg + " (строка " + line + ")");
};

// ===== ЖДЕМ ЗАГРУЗКУ =====
window.onload = function(){

  alert("✅ JS загрузился");

  const socket = io();

  let username = "";
  let roomCode = "";
  let color = "";

  // ===== ВЫБОР ЦВЕТА =====
  const chips = document.querySelectorAll('.chip');

  if (chips.length === 0) {
    alert("❌ Нет кнопок выбора цвета (.chip)");
  }

  chips.forEach(btn => {
    btn.onclick = () => {
      chips.forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      color = btn.dataset.color;

      alert("🎨 выбран цвет: " + color);
    };
  });

  // ===== КНОПКА ВХОД =====
  const joinBtn = document.getElementById('joinBtn');

  if (!joinBtn) {
    alert("❌ Кнопка joinBtn не найдена");
  }

  joinBtn.onclick = () => {

    username = document.getElementById('username')?.value.trim();
    roomCode = document.getElementById('roomCode')?.value.trim();

    if (!username || !roomCode || !color) {
      alert("❌ Заполни имя, комнату и выбери цвет");
      return;
    }

    alert("🚪 Вход в комнату...");

    socket.emit('joinRoom', { username, roomCode, color });
  };

  // ===== КНОПКА СТАРТ =====
  const startBtn = document.getElementById('startBtn');

  if (!startBtn) {
    alert("❌ Кнопка startBtn не найдена");
  }

  startBtn.onclick = () => {
    alert("🎮 Старт игры");
    socket.emit('startGame', roomCode);
  };

  // ===== СОКЕТЫ =====
  socket.on('connect', () => {
    alert("🟢 Подключено к серверу");
  });

  socket.on('updatePlayers', players => {
    alert("👥 Игроков: " + players.length);
  });

  socket.on('colorTaken', () => {
    alert("❌ Цвет занят");
  });

  socket.on('gameStarted', () => {
  alert("🚀 Получен сигнал старта");

  const lobby = document.getElementById('lobby');
  const game = document.getElementById('game');

  if (!lobby) {
    alert("❌ lobby не найден");
    return;
  }

  if (!game) {
    alert("❌ game не найден");
    return;
  }

  lobby.style.display = "none";

  // ЖЁСТКО показываем игру
  game.style.display = "flex";
  game.style.visibility = "visible";
  game.style.opacity = "1";

  alert("✅ Переключили экран");
});

};
