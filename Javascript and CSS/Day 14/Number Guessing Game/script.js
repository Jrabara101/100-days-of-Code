// script.js
import * as THREE from 'three';

// --- GAME LOGIC VARIABLES ---
let targetNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;
let isGameOver = false;

// DOM Elements
const guessInput = document.getElementById('userGuess');
const guessBtn = document.getElementById('guessBtn');
const feedbackEl = document.getElementById('feedback');
const attemptsEl = document.getElementById('attempts');
const restartBtn = document.getElementById('restartBtn');

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.03); // Add depth

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); 
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 3, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// The Main Object (The Orb)
const geometry = new THREE.IcosahedronGeometry(1.8, 1); 
const material = new THREE.MeshStandardMaterial({ 
    color: 0x888888, 
    roughness: 0.3,
    metalness: 0.8,
    flatShading: true
});
const orb = new THREE.Mesh(geometry, material);
scene.add(orb);

// Background Particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 700;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- ANIMATION STATE ---
let targetRotationSpeedX = 0.005;
let targetRotationSpeedY = 0.005;
let targetColor = new THREE.Color(0x888888);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotation
    orb.rotation.x += targetRotationSpeedX;
    orb.rotation.y += targetRotationSpeedY;
    particlesMesh.rotation.y += 0.0005;

    // Smooth Color Transition (Lerp)
    orb.material.color.lerp(targetColor, 0.05);

    renderer.render(scene, camera);
}
animate();

// --- INTERACTION FUNCTIONS ---

function handleGuess() {
    if (isGameOver) return;

    const val = parseInt(guessInput.value);

    // Validation
    if (isNaN(val) || val < 1 || val > 100) {
        feedbackEl.textContent = "Enter 1 - 100!";
        feedbackEl.className = "h-8 mb-4 font-semibold text-lg tracking-wide text-red-400";
        return;
    }

    attempts++;
    attemptsEl.textContent = attempts;

    if (val === targetNumber) {
        // WIN
        isGameOver = true;
        feedbackEl.textContent = `Correct! It was ${targetNumber}`;
        feedbackEl.className = "h-8 mb-4 font-bold text-xl tracking-wide text-green-400";
        
        // 3D Visuals: Green & Fast Spin
        targetColor.setHex(0x00ff00); 
        targetRotationSpeedX = 0.1;
        targetRotationSpeedY = 0.1;
        
        restartBtn.classList.remove('hidden');

    } else if (val < targetNumber) {
        // TOO LOW
        feedbackEl.textContent = "Too Low!";
        feedbackEl.className = "h-8 mb-4 font-semibold text-lg tracking-wide text-blue-400";
        
        // 3D Visuals: Blue & Slow Spin
        targetColor.setHex(0x3b82f6);
        targetRotationSpeedX = 0.01;
        targetRotationSpeedY = 0.005;

    } else {
        // TOO HIGH
        feedbackEl.textContent = "Too High!";
        feedbackEl.className = "h-8 mb-4 font-semibold text-lg tracking-wide text-orange-500";
        
        // 3D Visuals: Red & Wobble Spin
        targetColor.setHex(0xef4444);
        targetRotationSpeedX = 0.02;
        targetRotationSpeedY = 0.04;
    }

    guessInput.value = '';
    guessInput.focus();
}

function restartGame() {
    targetNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    isGameOver = false;
    attemptsEl.textContent = '0';
    feedbackEl.textContent = "Waiting for input...";
    feedbackEl.className = "h-8 mb-4 font-semibold text-lg tracking-wide text-cyan-300";
    
    // Reset 3D State
    targetColor.setHex(0x888888);
    targetRotationSpeedX = 0.005;
    targetRotationSpeedY = 0.005;
    
    restartBtn.classList.add('hidden');
    guessInput.value = '';
}

// --- EVENT LISTENERS ---
guessBtn.addEventListener('click', handleGuess);

guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGuess();
});

restartBtn.addEventListener('click', restartGame);

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});