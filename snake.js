// ============================================================
// Snake Game — Pure HTML5 Canvas + JavaScript
// Works in any modern browser. No external dependencies.
// ============================================================

// Polyfill for canvas.roundRect (Safari < 11.1 and others)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, width, height, radius) {
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ── Configuration ──────────────────────────────────────────────
const COLS = 20;       // grid columns
const ROWS = 20;      // grid rows
const CELL = 20;      // pixel size
const SPEED_MS = 130; // milliseconds between frames (lower = faster)

// ── State ──────────────────────────────────────────────────────
let snake = [];           // array of {x, y} positions
let direction = { x: 1, y: 0 }; // current movement
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let gameOver = false;
let paused = false;
let animationId = null;

// ── Initialize ──────────────────────────────────────────────────
function init() {
  // Place snake in the middle
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX, y: startY + 1 },
    { x: startX, y: startY + 2 }
  ];

  // Place first food
  food = placeFood();
  updateUI();
}

function placeFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS)
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

// ── Game Logic ──────────────────────────────────────────────────
function update() {
  if (gameOver || paused) return;

  // Move snake
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Check wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver = true;
    showOverlay(false);
    return;
  }

  // Check self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver = true;
    showOverlay(true);
    return;
  }

  // Add new head
  snake.unshift(head);

  // Check food
  if (head.x === food.x && head.y === food.y) {
    score++;
    food = placeFood();
    updateUI();
  } else {
    snake.pop(); // remove tail if no food eaten
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw food
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.roundRect(food.x * CELL + 1, food.y * CELL + 1, CELL - 2, CELL - 2, 6);
  ctx.fill();

  // Draw snake
  snake.forEach((segment, index) => {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(segment.x * CELL, segment.y * CELL, CELL - 1, CELL - 1, 6);
    ctx.fill();
  });
}

function updateUI() {
  document.getElementById('ui').textContent = 'Score: ' + score;
}

function showOverlay(isGameOver) {
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('overlay-title');
  const text = document.getElementById('overlay-text');

  if (isGameOver) {
    title.textContent = 'GAME OVER';
    text.textContent = 'Final Score: ' + score;
  } else {
    title.textContent = 'PLAY AGAIN';
    text.textContent = 'Press SPACE to resume';
  }
  overlay.style.display = isGameOver ? 'flex' : 'none';
}

// ── Input Handling ──────────────────────────────────────────────
function handleKey(e) {
  if (gameOver) return;

  // Prevent default scrolling for arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }

  switch (e.key.toLowerCase()) {
    case 'w': case 'arrowup':
      if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
      break;
    case 's': case 'arrowdown':
      if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
      break;
    case 'a': case 'arrowleft':
      if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
      break;
    case 'd': case 'arrowright':
      if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
      break;
    case ' ': // Space = pause
      paused = !paused;
      break;
    case 'escape': // Quit
      window.location.reload();
      break;
    case 'r': // Restart
      resetGame();
      break;
  }
}

// ── Restart Button ──────────────────────────────────────────────
document.getElementById('restartBtn').addEventListener('click', resetGame);

// ── Touch Controls (Mobile) ─────────────────────────────────────
document.querySelectorAll('.touch-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = btn.dataset.dir;
    if (dir === 'up') nextDirection = { x: 0, y: -1 };
    if (dir === 'down') nextDirection = { x: 0, y: 1 };
    if (dir === 'left') nextDirection = { x: -1, y: 0 };
    if (dir === 'right') nextDirection = { x: 1, y: 0 };
  });
});

// ── Game Loop ───────────────────────────────────────────────────
let lastTime = 0;

function gameLoop(timestamp = 0) {
  const elapsed = timestamp - lastTime;

  // Update game logic at fixed intervals for consistent speed
  if (elapsed > SPEED_MS) {
    // Apply queued direction change
    direction.x = nextDirection.x;
    direction.y = nextDirection.y;

    update();
    lastTime = timestamp;
  }

  draw();
  animationId = requestAnimationFrame(gameLoop);
}

// ── Reset ───────────────────────────────────────────────────────
function resetGame() {
  init();
  if (animationId) cancelAnimationFrame(animationId);
  gameLoop();
  gameOver = false;
  paused = false;
  document.getElementById('overlay').style.display = 'none';
}

// ── Start ───────────────────────────────────────────────────────
init();
gameLoop();

// Bind keyboard events
window.addEventListener('keydown', handleKey);

// Touch controls (mobile)
document.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const cx = e.touches[0].clientX - rect.left;
  const cy = e.touches[0].clientY - rect.top;
  const col = Math.floor(cx / CELL);
  const row = Math.floor(cy / CELL);
  // Map to directions
  if (col > 0 && col < COLS - 1) nextDirection = { x: -1, y: 0 };
  if (row > 0 && row < ROWS - 1) nextDirection = { x: 0, y: -1 };
  if (col > 0 && col < COLS - 1) nextDirection = { x: 1, y: 0 };
  if (row > 0 && row < ROWS - 1) nextDirection = { x: 0, y: 1 };
});

console.log('🐍 Snake game ready! Open this page in a browser to play.');
