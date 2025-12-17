// --- 1. GAME STATE & CONFIGURATION ---
const config = {
    colors: {
        neon: 0x00ffcc,
        danger: 0xff3333,
        success: 0x33ff33,
        neutral: 0x444444
    },
    cubeSize: 1.5,
    gameSpeed: 0.15
};

const gameState = {
    mode: 'freeplay', // 'freeplay', 'playing', 'won', 'lost'
    sequence: [],     // The Game State Array: specific chars to type
    currentIdx: 0,
    score: 0,
    winCondition: 10, // Number of correct keys to win
    activeObjects: [] // Array of Three.js meshes currently in scene
};

// --- 2. THREE.JS SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.03);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;
camera.position.y = 5;
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(config.colors.neon, 1, 50);
pointLight.position.set(5, 10, 10);
scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0xff00ff, 1, 50);
pointLight2.position.set(-5, 5, -10);
scene.add(pointLight2);

// Grid
const gridHelper = new THREE.GridHelper(50, 50, 0x222222, 0x111111);
scene.add(gridHelper);

// --- 3. HELPER FUNCTIONS ---

// Generate a texture with text on it (for the cubes)
function createTextTexture(text, colorStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#000000'; // Black background for face
    ctx.fillRect(0, 0, 256, 256);

    // Border
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 20;
    ctx.strokeRect(0, 0, 256, 256);

    // Text
    ctx.fillStyle = colorStr;
    ctx.font = 'bold 160px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Create a 3D Cube representing a key
function spawnKeyCube(key, isTarget = false) {
    const color = isTarget ? '#ff3333' : '#00ffcc';
    const texture = createTextTexture(key, color);
    
    const geometry = new THREE.BoxGeometry(config.cubeSize, config.cubeSize, config.cubeSize);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        emissive: isTarget ? config.colors.danger : config.colors.neon,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
    });

    const cube = new THREE.Mesh(geometry, material);
    
    // Initial position logic
    if (isTarget) {
        // Game mode: Spawns far away and moves towards camera
        cube.position.set((Math.random() - 0.5) * 10, 1, -20);
        cube.userData = { type: 'target', key: key.toLowerCase(), speed: config.gameSpeed + (Math.random() * 0.1) };
    } else {
        // Freeplay mode: Spawns at center and floats up
        cube.position.set(0, 0, 0);
        cube.userData = { 
            type: 'effect', 
            velocity: new THREE.Vector3((Math.random()-0.5)*0.5, Math.random()*0.5 + 0.2, (Math.random()-0.5)*0.5),
            rotVelocity: new THREE.Vector3(Math.random()*0.1, Math.random()*0.1, 0)
        };
    }

    scene.add(cube);
    gameState.activeObjects.push(cube);
    return cube;
}

// Particle explosion effect
function createExplosion(position, color) {
    const particleCount = 15;
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: color });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.userData = {
            type: 'particle',
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 1
            ),
            life: 1.0
        };
        scene.add(particle);
        gameState.activeObjects.push(particle);
    }
}

// --- 4. GAME LOGIC & EVENT HANDLING ---

const uiElements = {
    log: document.getElementById('log-panel'),
    mode: document.getElementById('mode-indicator'),
    score: document.getElementById('score'),
    target: document.getElementById('target'),
    btn: document.getElementById('start-btn'),
    msg: document.getElementById('message-display'),
    bigKey: document.getElementById('key-display')
};

function updateLog(e) {
    const div = document.createElement('div');
    div.className = 'log-item';
    div.innerHTML = `Key: <span>${e.key}</span> | Code: <span>${e.code}</span>`;
    uiElements.log.insertBefore(div, uiElements.log.firstChild);
    if (uiElements.log.children.length > 8) {
        uiElements.log.removeChild(uiElements.log.lastChild);
    }
    
    // Flash large key on screen
    uiElements.bigKey.textContent = e.key.toUpperCase();
    uiElements.bigKey.style.opacity = "0.5";
    setTimeout(() => { uiElements.bigKey.style.opacity = "0.1"; }, 150);
}

// Start Game
uiElements.btn.addEventListener('click', () => {
    startGame();
});

function startGame() {
    // Reset State
    gameState.mode = 'playing';
    gameState.score = 0;
    gameState.currentIdx = 0;
    gameState.sequence = [];
    
    // UI Updates
    uiElements.mode.textContent = "SURVIVAL CHALLENGE";
    uiElements.mode.style.color = "#ff3333";
    uiElements.score.textContent = "0";
    uiElements.target.textContent = gameState.winCondition;
    uiElements.btn.style.display = 'none';
    uiElements.msg.style.display = 'none';

    // Clear existing objects
    gameState.activeObjects.forEach(obj => scene.remove(obj));
    gameState.activeObjects = [];

    // Generate Game State Array (Sequence of random chars)
    const chars = "abcdefghijklmnopqrstuvwxyz";
    for(let i=0; i<gameState.winCondition; i++) {
        gameState.sequence.push(chars[Math.floor(Math.random() * chars.length)]);
    }

    spawnNextTarget();
}

function spawnNextTarget() {
    if (gameState.currentIdx < gameState.sequence.length) {
        const char = gameState.sequence[gameState.currentIdx];
        spawnKeyCube(char, true);
    }
}

function checkWinCondition() {
    if (gameState.score >= gameState.winCondition) {
        gameState.mode = 'won';
        uiElements.msg.textContent = "SYSTEM SECURED - YOU WIN";
        uiElements.msg.className = "hud-message win-text";
        uiElements.msg.style.display = "block";
        uiElements.btn.textContent = "Reboot System";
        uiElements.btn.style.display = "block";
        createExplosion(new THREE.Vector3(0,0,0), config.colors.success);
    }
}

function triggerFail() {
    gameState.mode = 'lost';
    uiElements.msg.textContent = "BREACH DETECTED - GAME OVER";
    uiElements.msg.className = "hud-message lose-text";
    uiElements.msg.style.display = "block";
    uiElements.btn.textContent = "Retry";
    uiElements.btn.style.display = "block";
}

// Event Handling: Keydown (The core of the prompt)
window.addEventListener('keydown', (e) => {
    // Prevent default scrolling for Space/Arrows
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    updateLog(e);

    if (gameState.mode === 'freeplay' || gameState.mode === 'won' || gameState.mode === 'lost') {
        // Visual Tester Mode
        spawnKeyCube(e.key);
        // Simple camera shake
        camera.position.x += (Math.random()-0.5) * 0.2;
    } else if (gameState.mode === 'playing') {
        // Game Logic
        // Find the closest target object
        const targets = gameState.activeObjects.filter(obj => obj.userData.type === 'target');
        
        if (targets.length > 0) {
            // Sort by proximity (z index close to 0 is closest in this setup usually, but they spawn at -20)
            // Actually, they spawn at -20 and move to +15 (camera). Closest to camera (highest Z) is danger.
            targets.sort((a, b) => b.position.z - a.position.z);
            
            const activeTarget = targets[0]; // The one closest to player
            
            if (e.key.toLowerCase() === activeTarget.userData.key) {
                // Correct Hit
                createExplosion(activeTarget.position, config.colors.neon);
                scene.remove(activeTarget);
                gameState.activeObjects = gameState.activeObjects.filter(obj => obj !== activeTarget);
                
                gameState.score++;
                uiElements.score.textContent = gameState.score;
                gameState.currentIdx++;
                
                checkWinCondition();
                
                if (gameState.mode === 'playing') {
                    setTimeout(spawnNextTarget, 200); // Small delay before next
                }
            } else {
                // Wrong Key - Penalty or Visual feedback?
                camera.position.x = (Math.random()-0.5) * 1; // Shake
            }
        }
    }
});

// --- 5. ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);

    // Clean up list
    let i = gameState.activeObjects.length;
    while (i--) {
        const obj = gameState.activeObjects[i];

        if (obj.userData.type === 'effect') {
            // Freeplay cubes physics
            obj.position.add(obj.userData.velocity);
            obj.rotation.x += obj.userData.rotVelocity.x;
            obj.rotation.y += obj.userData.rotVelocity.y;
            obj.material.opacity -= 0.01;
            obj.scale.multiplyScalar(0.98);

            if (obj.scale.x < 0.1) {
                scene.remove(obj);
                gameState.activeObjects.splice(i, 1);
            }
        } 
        else if (obj.userData.type === 'target') {
            // Incoming Game Cubes
            obj.position.z += obj.userData.speed;
            obj.rotation.z += 0.02;
            obj.rotation.x += 0.01;

            // Fail condition: Passed the camera
            if (obj.position.z > 12) {
                scene.remove(obj);
                gameState.activeObjects.splice(i, 1);
                triggerFail();
            }
        }
        else if (obj.userData.type === 'particle') {
            obj.position.add(obj.userData.velocity);
            obj.userData.life -= 0.03;
            obj.scale.setScalar(obj.userData.life);
            if (obj.userData.life <= 0) {
                scene.remove(obj);
                gameState.activeObjects.splice(i, 1);
            }
        }
    }

    // Passive Camera movement
    const time = Date.now() * 0.0005;
    if (gameState.mode !== 'playing') {
        camera.position.x = Math.sin(time) * 2;
        camera.position.y = 5 + Math.cos(time) * 2;
        camera.lookAt(0, 0, 0);
    } else {
        // Locked camera for gameplay
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.1);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5, 0.1);
        camera.lookAt(0,0,0);
    }

    renderer.render(scene, camera);
}

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();

