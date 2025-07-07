// Game Variables
const canvas = document.getElementById('dino-game');
const ctx = canvas.getContext('2d');
const jumpBtn = document.getElementById('jump-btn');

let dino = { x: 50, y: 80, width: 20, height: 20, vy: 0, gravity: 0.6, jumpForce: -12 };
let obstacles = [];
let speed = 3;
let gameOver = false;

// Disegna dinosauro
function drawDino() {
  ctx.fillStyle = '#555';
  ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
}

// Genera ostacolo
function addObstacle() {
  const height = 20;
  obstacles.push({ x: canvas.width, y: canvas.height - height, width: 10, height });
}

// Disegna ostacoli
function drawObstacles() {
  ctx.fillStyle = '#333';
  obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));
}

// Logica salto
function jump() {
  if (dino.y === canvas.height - dino.height) {
    dino.vy = dino.jumpForce;
  }
}

// Collisione
function checkCollision(obs) {
  return (
    dino.x < obs.x + obs.width &&
    dino.x + dino.width > obs.x &&
    dino.y < obs.y + obs.height &&
    dino.y + dino.height > obs.y
  );
}

// Ciclo di gioco
function update() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dino physics
  dino.vy += dino.gravity;
  dino.y += dino.vy;
  if (dino.y > canvas.height - dino.height) {
    dino.y = canvas.height - dino.height;
    dino.vy = 0;
  }

  // Ostacoli
  if (Math.random() < 0.01) addObstacle();
  obstacles.forEach((obs, i) => {
    obs.x -= speed;
    if (checkCollision(obs)) gameOver = true;
    if (obs.x + obs.width < 0) obstacles.splice(i, 1);
  });

  drawDino();
  drawObstacles();

  if (!gameOver) requestAnimationFrame(update);
  else {
    ctx.fillStyle = 'red';
    ctx.font = '20px sans-serif';
    ctx.fillText('Game Over', canvas.width/2 - 50, canvas.height/2);
  }
}

// Eventi
document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
jumpBtn.addEventListener('click', jump);

// Avvia
update();
