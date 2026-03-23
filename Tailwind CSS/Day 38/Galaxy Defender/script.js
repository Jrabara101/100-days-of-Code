/**
 * Space Shooter - Core Logic
 * Author: Beejay T.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State with Proxy for decoupled UI updates
const gameState = new Proxy({
    score: 0,
    lives: 3,
    heat: 0,
    isPaused: false,
    debug: false,
    gameOver: false,
    highScore: parseInt(localStorage.getItem('spaceShooter_highScore')) || 0
}, {
    set(target, prop, value) {
        target[prop] = value;
        if (prop === 'score') {
            document.getElementById('scoreDisplay').innerText = value.toString().padStart(6, '0');
            if (value > target.highScore) {
                target.highScore = value;
                localStorage.setItem('spaceShooter_highScore', value);
            }
        }
        if (prop === 'heat') {
            const heatBar = document.getElementById('heatBar');
            heatBar.style.width = `${value}%`;
            if (value > 80) heatBar.classList.add('animate-pulse');
            else heatBar.classList.remove('animate-pulse');
        }
        if (prop === 'lives') {
            updateLivesDisplay(value);
            document.getElementById('livesCount').innerText = value.toString().padStart(2, '0');
        }
        if (prop === 'isPaused') {
            document.getElementById('pauseMenu').classList.toggle('hidden', !value);
        }
        return true;
    }
});

function updateLivesDisplay(count) {
    const container = document.getElementById('livesDisplay');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const lifeIcon = document.createElement('div');
        lifeIcon.className = "w-5 h-5 bg-[var(--retro-cyan)]";
        lifeIcon.style.clipPath = "polygon(50% 0%, 0% 100%, 50% 80%, 100% 100%)";
        container.appendChild(lifeIcon);
    }
}

class Particle {
    constructor(x, y, vx, vy, life, color, size = 2) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 3;
        this.life = 1.0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.01;

        // Screen Wrap
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    draw(ctx) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.shadowBlur = 0;
    }
}

class Asteroid {
    constructor(x, y, radius, level = 3) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.radius = radius || 40;
        this.level = level; // 3: Large, 2: Medium, 1: Small
        this.vx = (Math.random() - 0.5) * (4 - level);
        this.vy = (Math.random() - 0.5) * (4 - level);
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;

        // Generate blocky vertices
        this.vertices = [];
        const numVertices = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const dist = this.radius * (0.8 + Math.random() * 0.4);
            this.vertices.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist
            });
        }

        const colors = ['#ff9d00', '#ff00ff', '#ffeb00'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;

        if (this.x < -this.radius) this.x = canvas.width + this.radius;
        if (this.x > canvas.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvas.height + this.radius;
        if (this.y > canvas.height + this.radius) this.y = -this.radius;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Blocky Interior Fill
        ctx.fillStyle = this.color + '33'; // Semi-transparent
        ctx.fill();

        if (gameState.debug) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.radius = 15;
        this.thrustPower = 0.15;
        this.friction = 0.985;
        this.rotationSpeed = 0.08;
        this.cooldown = 0;
        this.particles = [];
        this.invulnerable = 120; // Frames
    }

    update(keys) {
        // Rotation
        if (keys['ArrowLeft'] || keys['KeyA']) this.angle -= this.rotationSpeed;
        if (keys['ArrowRight'] || keys['KeyD']) this.angle += this.rotationSpeed;

        // Thrust
        const isThrusting = keys['ArrowUp'] || keys['KeyW'];
        if (isThrusting) {
            this.vx += Math.cos(this.angle) * this.thrustPower;
            this.vy += Math.sin(this.angle) * this.thrustPower;
            this.emitThrustParticles();
        }

        // Apply Friction/Inertia
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Update Position
        this.x += this.vx;
        this.y += this.vy;

        // Screen Wrap
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Shooting
        if (keys['Space'] && this.cooldown <= 0 && gameState.heat < 100) {
            projectiles.push(new Projectile(
                this.x + Math.cos(this.angle) * 20,
                this.y + Math.sin(this.angle) * 20,
                this.angle,
                7
            ));
            this.cooldown = 10;
            gameState.heat = Math.min(100, gameState.heat + 5);
        }

        if (this.cooldown > 0) this.cooldown--;
        if (!isThrusting && gameState.heat > 0) gameState.heat = Math.max(0, gameState.heat - 0.5);

        if (this.invulnerable > 0) this.invulnerable--;
    }

    emitThrustParticles() {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const particleCount = 3 + Math.floor(speed * 3);
        const enginePower = speed / 10; // Normalize

        for (let i = 0; i < particleCount; i++) {
            const pAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.4;
            const pSpeed = 2 + Math.random() * 5;

            // Color transitions from white to bright orange based on speed
            let color;
            if (speed > 4) color = '#ffffff'; // White hot
            else if (speed > 2) color = '#ffeb00'; // Yellow
            else color = '#ff9d00'; // Orange

            particles.push(new Particle(
                this.x - Math.cos(this.angle) * 12,
                this.y - Math.sin(this.angle) * 12,
                Math.cos(pAngle) * pSpeed,
                Math.sin(pAngle) * pSpeed,
                0.3 + Math.random() * 0.4,
                color,
                Math.random() * 5 + 2
            ));
        }
    }

    draw(ctx) {
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

        // Draw Ship twice if crossing boundary for smooth wrap
        this.drawShip(ctx, this.x, this.y);

        // Horizontal Wrap Check
        if (this.x < this.radius) this.drawShip(ctx, this.x + canvas.width, this.y);
        if (this.x > canvas.width - this.radius) this.drawShip(ctx, this.x - canvas.width, this.y);

        // Vertical Wrap Check
        if (this.y < this.radius) this.drawShip(ctx, this.x, this.y + canvas.height);
        if (this.y > canvas.height - this.radius) this.drawShip(ctx, this.x, this.y - canvas.height);

        if (gameState.debug) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawShip(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle);

        // Ship Body (Neon Stylized)
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 0); // Nose
        ctx.lineTo(-15, -12);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-15, 12);
        ctx.closePath();
        ctx.stroke();

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff33';
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(-5, -3, 6, 6);

        ctx.restore();
    }
}

// Global Entities
let ship;
let asteroids = [];
let projectiles = [];
let particles = [];
let stars = [];
const keys = {};

function init() {
    resize();
    ship = new Ship(canvas.width / 2, canvas.height / 2);

    // Background Stars
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            opacity: Math.random()
        });
    }

    spawnAsteroids(8);

    gameState.score = 0;
    gameState.lives = 3;
    gameState.heat = 0;
    gameState.isPaused = false;
    gameState.gameOver = false;

    requestAnimationFrame(loop);
}

function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        // Ensure asteroids don't spawn on the ship
        do {
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
        } while (Math.hypot(x - ship.x, y - ship.y) < 150);

        asteroids.push(new Asteroid(x, y, 40, 3));
    }
}

function resize() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Escape' || e.code === 'KeyP') {
        gameState.isPaused = !gameState.isPaused;
    }
    if (e.code === 'KeyH') {
        gameState.debug = !gameState.debug;
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

function loop() {
    if (!gameState.isPaused && !gameState.gameOver) {
        update();
    }
    render();
    requestAnimationFrame(loop);
}

function update() {
    ship.update(keys);

    // Update Projectiles
    projectiles = projectiles.filter(p => p.life > 0);
    projectiles.forEach(p => p.update());

    // Update Asteroids
    asteroids.forEach(a => a.update());

    // Update Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.update());

    // Collisions: Projectile vs Asteroid
    projectiles.forEach((p, pIdx) => {
        asteroids.forEach((a, aIdx) => {
            const dist = Math.hypot(p.x - a.x, p.y - a.y);
            if (dist < a.radius) {
                p.life = 0;
                handleAsteroidHit(a, aIdx);
            }
        });
    });

    // Collisions: Ship vs Asteroid
    if (ship.invulnerable <= 0) {
        asteroids.forEach(a => {
            const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
            if (dist < ship.radius + a.radius) {
                handleShipHit();
            }
        });
    }

    // Coordinate Panel Update
    document.getElementById('coords').innerText = `X:${Math.floor(ship.x)} Y:${Math.floor(ship.y)}`;
}

function handleAsteroidHit(asteroid, index) {
    gameState.score += (4 - asteroid.level) * 100;

    // Create fragments
    if (asteroid.level > 1) {
        for (let i = 0; i < 2; i++) {
            asteroids.push(new Asteroid(asteroid.x, asteroid.y, asteroid.radius / 2, asteroid.level - 1));
        }
    }

    // Explosion Particles
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(
            asteroid.x,
            asteroid.y,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            1.0,
            asteroid.color,
            Math.random() * 5 + 2
        ));
    }

    asteroids.splice(index, 1);

    if (asteroids.length === 0) {
        spawnAsteroids(gameState.score / 1000 + 5);
    }
}

function handleShipHit() {
    gameState.lives--;
    ship.invulnerable = 120;
    ship.vx = 0;
    ship.vy = 0;

    // Explosion Particles
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(
            ship.x,
            ship.y,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            1.5,
            '#00ffff',
            Math.random() * 6 + 2
        ));
    }

    if (gameState.lives <= 0) {
        gameState.gameOver = true;
        alert(`GAME OVER\nFinal Score: ${gameState.score}`);
        location.reload();
    }
}

function render() {
    // Clear with dark purple background
    ctx.fillStyle = '#1a0524';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Stars
    stars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    projectiles.forEach(p => p.draw(ctx));
    asteroids.forEach(a => a.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    ship.draw(ctx);

    if (gameState.isPaused) {
        // Overlay for Pause (handled by DOM, but could add canvas subtle effects here)
    }
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

init();
