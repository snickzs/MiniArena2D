const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let playerColor = 'red';
let player = { x: 100, y: 100, size: 50, speed: 5 };
let obstacles = [];
let powerUps = [];
let keys = {};
let gameRunning = false;
let score = 0;
let level = 1;
let highscore = localStorage.getItem('highscore') || 0;
let obstacleSpeedIncrement = 0.05;
let gameStartedByPlayer = false;
let particles = [];

// Sons
const hitSound = document.getElementById('hitSound');
const collectSound = document.getElementById('collectSound');

// Detectar mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const controlsDiv = document.getElementById('controls');
if (!isMobile) controlsDiv.style.display = 'none';

// Menu e seleção de cor
const charButtons = document.querySelectorAll('.charBtn');
charButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        playerColor = btn.dataset.color;
        charButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});
document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    canvas.style.display = 'block';
    startGame();
});

// Obstáculos
function createObstacles(count) {
    obstacles = [];
    const safeRange = 200;
    for (let i = 0; i < count; i++) {
        let x, y;
        do {
            x = Math.random() * (canvas.width - 50);
            y = Math.random() * (canvas.height - 50);
        } while (Math.abs(x - player.x) < safeRange && Math.abs(y - player.y) < safeRange);
        obstacles.push({
            x, y, size: 50,
            dx: (Math.random() < 0.5 ? 2 : -2) + obstacleSpeedIncrement * level,
            dy: (Math.random() < 0.5 ? 2 : -2) + obstacleSpeedIncrement * level
        });
    }
}

// Power-ups
function createPowerUp() {
    const x = Math.random() * (canvas.width - 30);
    const y = Math.random() * (canvas.height - 30);
    powerUps.push({ x, y, size: 30, collected: false });
}

// Partículas
function createParticles(x, y, color) {
    for(let i=0;i<12;i++){
        particles.push({
            x, y,
            dx: (Math.random()-0.5)*5,
            dy: (Math.random()-0.5)*5,
            life: 25 + Math.random()*10,
            color
        });
    }
}

// Colisão
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.size &&
           rect1.x + rect1.size > rect2.x &&
           rect1.y < rect2.y + rect2.size &&
           rect1.y + rect1.size > rect2.y;
}

// Atualização
function update() {
    if (keys['w'] || keys['a'] || keys['s'] || keys['d'] || keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']) gameStartedByPlayer = true;

    if (keys['w'] || keys['ArrowUp']) player.y -= player.speed;
    if (keys['s'] || keys['ArrowDown']) player.y += player.speed;
    if (keys['a'] || keys['ArrowLeft']) player.x -= player.speed;
    if (keys['d'] || keys['ArrowRight']) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    if (gameStartedByPlayer) {
        obstacles.forEach(obs => {
            obs.x += obs.dx;
            obs.y += obs.dy;
            if (obs.x < 0 || obs.x > canvas.width - obs.size) obs.dx *= -1;
            if (obs.y < 0 || obs.y > canvas.height - obs.size) obs.dy *= -1;

            if (checkCollision(player, obs)) {
                hitSound.play();
                createParticles(player.x + player.size/2, player.y + player.size/2, playerColor);
                gameOver();
            }
        });
    }

    // Coletar power-ups
    powerUps.forEach(p => {
        if (!p.collected && checkCollision(player, p)) {
            p.collected = true;
            score += 5;
            collectSound.play();
            createParticles(p.x + p.size/2, p.y + p.size/2, '#ffd700');
        }
    });

    // Atualizar partículas
    particles.forEach((p,i)=>{
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if(p.life<=0) particles.splice(i,1);
    });
}

// Aumenta dificuldade
function increaseDifficulty() {
    if (!gameStartedByPlayer) return;
    obstacles.forEach(obs => { obs.dx += obs.dx > 0 ? 0.01 : -0.01; obs.dy += obs.dy > 0 ? 0.01 : -0.01; });
    score += 1;
    if (score % 40 === 0) {
        level += 1;
        createObstacles(10 + level * 2);
        createPowerUp();
    }
}

// Desenho
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fce38a';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = playerColor;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    obstacles.forEach(obs => {
        ctx.fillStyle = '#ff6f61';
        ctx.fillRect(obs.x, obs.y, obs.size, obs.size);
    });

    powerUps.forEach(p => {
        if (!p.collected) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(p.x + p.size/2, p.y + p.size/2, p.size/2, 0, Math.PI*2);
            ctx.fill();
        }
    });

    particles.forEach(p=>{
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4,4);
    });

    ctx.font = '36px Comic Sans MS';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#000';
    ctx.fillText(`Pontuação: ${score}`, 20, 50);
    ctx.fillText(`Nível: ${level}`, canvas.width - 180, 50);
    ctx.shadowBlur = 0;
}

// Loop principal
function gameLoop() { if(!gameRunning) return; update(); draw(); requestAnimationFrame(gameLoop); }

// Começar jogo
function startGame(){
    score = 0; level = 1; gameStartedByPlayer=false;
    player.x=100; player.y=100;
    createObstacles(10); powerUps=[];
    gameRunning=true; gameLoop();
    setInterval(()=>{if(gameRunning) increaseDifficulty();},1000);
}

// Game over
function gameOver(){
    gameRunning=false;
    if(score>highscore){
        highscore=score;
        localStorage.setItem('highscore',highscore);
        document.getElementById('highscore').textContent=`Recorde: ${highscore}`;
    }
    alert(`Você morreu! Pontuação final: ${score}`);
    document.getElementById('menu').style.display='flex';
    canvas.style.display='none';
}

// Controles teclado
document.addEventListener('keydown', e => keys[e.key]=true);
document.addEventListener('keyup', e => keys[e.key]=false);

// Controles touch mobile
if(isMobile){
    document.getElementById('up').addEventListener('touchstart', ()=>keys['w']=true);
    document.getElementById('up').addEventListener('touchend', ()=>keys['w']=false);
    document.getElementById('down').addEventListener('touchstart', ()=>keys['s']=true);
    document.getElementById('down').addEventListener('touchend', ()=>keys['s']=false);
    document.getElementById('left').addEventListener('touchstart', ()=>keys['a']=true);
    document.getElementById('left').addEventListener('touchend', ()=>keys['a']=false);
    document.getElementById('right').addEventListener('touchstart', ()=>keys['d']=true);
    document.getElementById('right').addEventListener('touchend', ()=>keys['d']=false);
}

// Redimensiona
window.addEventListener('resize', ()=>{canvas.width=window.innerWidth; canvas.height=window.innerHeight;});