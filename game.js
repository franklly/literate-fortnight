const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const statusEl = document.querySelector("#status");
const overlay = document.querySelector("#overlay");
const boardWrap = document.querySelector(".board-wrap");
const startBtn = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");
const speedSelect = document.querySelector("#speed");
const touchButtons = document.querySelectorAll("[data-dir]");

const tileCount = 20;
const tileSize = canvas.width / tileCount;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let best;
let gameTimer;
let running;
let gameOver;
let touchStartX;
let touchStartY;

function loadBestScore() {
  return Number(localStorage.getItem("snakeBestScore")) || 0;
}

function saveBestScore(value) {
  localStorage.setItem("snakeBestScore", String(value));
}

function resetGame() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  direction = directions.right;
  nextDirection = directions.right;
  score = 0;
  gameOver = false;
  running = false;
  placeFood();
  updateScore();
  setStatus("\u53ef\u4ee5\u5148\u8c03\u8282\u901f\u5ea6");
  setOverlay("\u51c6\u5907\u597d\u4e86\uff1f", "\u5148\u9009\u901f\u5ea6\uff0c\u7136\u540e\u7528\u65b9\u5411\u952e / WASD / \u6ed1\u52a8\u63a7\u5236", false);
  draw();
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setOverlay(title, detail, hidden) {
  overlay.querySelector("strong").textContent = title;
  overlay.querySelector("span").textContent = detail;
  overlay.classList.toggle("hidden", hidden);
}

function updateScore() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function startGame() {
  if (gameOver) {
    resetGame();
  }

  running = true;
  startBtn.innerHTML = '<span aria-hidden="true">||</span>\u6682\u505c';
  setStatus("\u5403\u5230\u7ea2\u8272\u679c\u5b50\u5c31\u4f1a\u53d8\u957f");
  setOverlay("", "", true);
  clearInterval(gameTimer);
  gameTimer = setInterval(tick, Number(speedSelect.value));
}

function pauseGame() {
  running = false;
  startBtn.innerHTML = '<span aria-hidden="true">&gt;</span>\u7ee7\u7eed';
  clearInterval(gameTimer);
  setStatus("\u5df2\u6682\u505c");
  setOverlay("\u6682\u505c\u4e2d", "\u6309\u7a7a\u683c\u6216\u70b9\u51fb\u7ee7\u7eed", false);
}

function toggleGame() {
  if (running) {
    pauseGame();
  } else {
    startGame();
  }
}

function tick() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (isWallHit(head) || isSnakeHit(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    if (score > best) {
      best = score;
      saveBestScore(best);
    }
    placeFood();
    updateScore();
  } else {
    snake.pop();
  }

  draw();
}

function endGame() {
  gameOver = true;
  running = false;
  clearInterval(gameTimer);
  startBtn.innerHTML = '<span aria-hidden="true">&gt;</span>\u518d\u6765';
  setStatus("\u6e38\u620f\u7ed3\u675f");
  setOverlay("\u4f60\u8f93\u4e86", "\u70b9\u51fb\u91cd\u5f00\uff0c\u6216\u8005\u6309\u7a7a\u683c\u518d\u6765\u4e00\u5c40", false);
  draw();
}

function isWallHit(point) {
  return point.x < 0 || point.x >= tileCount || point.y < 0 || point.y >= tileCount;
}

function isSnakeHit(point) {
  return snake.some((part) => part.x === point.x && part.y === point.y);
}

function placeFood() {
  const emptyTiles = [];

  for (let y = 0; y < tileCount; y += 1) {
    for (let x = 0; x < tileCount; x += 1) {
      if (!snake.some((part) => part.x === x && part.y === y)) {
        emptyTiles.push({ x, y });
      }
    }
  }

  food = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
}

function draw() {
  drawBoard();
  drawFood();
  drawSnake();
}

function drawBoard() {
  ctx.fillStyle = "#15191f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 1;
  for (let index = 1; index < tileCount; index += 1) {
    const position = index * tileSize;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawFood() {
  const centerX = food.x * tileSize + tileSize / 2;
  const centerY = food.y * tileSize + tileSize / 2;

  ctx.fillStyle = "#ff6b5f";
  ctx.beginPath();
  ctx.arc(centerX, centerY, tileSize * 0.34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
  ctx.beginPath();
  ctx.arc(centerX - tileSize * 0.1, centerY - tileSize * 0.12, tileSize * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  snake.forEach((part, index) => {
    const inset = index === 0 ? 3 : 4;
    const x = part.x * tileSize + inset;
    const y = part.y * tileSize + inset;
    const size = tileSize - inset * 2;

    ctx.fillStyle = index === 0 ? "#42d392" : "#1f9d66";
    roundedRect(x, y, size, size, 7);
    ctx.fill();

    if (index === 0) {
      drawEyes(part);
    }
  });
}

function drawEyes(head) {
  const eyeOffsetX = direction.x * 5;
  const eyeOffsetY = direction.y * 5;
  const perpendicular = { x: -direction.y, y: direction.x };
  const centerX = head.x * tileSize + tileSize / 2 + eyeOffsetX;
  const centerY = head.y * tileSize + tileSize / 2 + eyeOffsetY;

  ctx.fillStyle = "#101418";
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(
      centerX + perpendicular.x * side * 5,
      centerY + perpendicular.y * side * 5,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function changeDirection(newDirection) {
  const target = directions[newDirection];
  const isOpposite = target.x + direction.x === 0 && target.y + direction.y === 0;

  if (!isOpposite) {
    nextDirection = target;
  }
}

function steer(newDirection) {
  changeDirection(newDirection);
  if (!running && !gameOver) {
    startGame();
  }
}

document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  if (keyMap[event.key]) {
    event.preventDefault();
    steer(keyMap[event.key]);
  }

  if (event.code === "Space") {
    event.preventDefault();
    toggleGame();
  }
});

startBtn.addEventListener("click", toggleGame);
restartBtn.addEventListener("click", () => {
  clearInterval(gameTimer);
  resetGame();
  startGame();
});

speedSelect.addEventListener("change", () => {
  if (running) {
    startGame();
  }
});

touchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    steer(button.dataset.dir);
  });
});

boardWrap.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1) {
    return;
  }

  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });

boardWrap.addEventListener("touchmove", (event) => {
  event.preventDefault();
}, { passive: false });

boardWrap.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const minSwipe = 24;

  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < minSwipe) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    steer(deltaX > 0 ? "right" : "left");
  } else {
    steer(deltaY > 0 ? "down" : "up");
  }
});

best = loadBestScore();
resetGame();
