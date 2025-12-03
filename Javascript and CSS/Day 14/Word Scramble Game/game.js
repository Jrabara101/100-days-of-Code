// --- Three.js import (ES module from CDN) ---
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// ======================
// Word Scramble Game
// ======================

// Simple word list; add more as needed
const WORDS = [
  { word: 'javascript', hint: 'Language that powers the web browser.' },
  { word: 'function', hint: 'Reusable block of code with parameters.' },
  { word: 'variable', hint: 'Named container that stores a value.' },
  { word: 'asynchronous', hint: 'Non-blocking style often used with promises.' },
  { word: 'browser', hint: 'Software used to view web pages.' },
  { word: 'component', hint: 'Reusable UI building block in modern frameworks.' },
  { word: 'frontend', hint: 'Client-side part of a web application.' },
  { word: 'backend', hint: 'Server-side logic and APIs.' }
];

let currentIndex = 0;
let currentScramble = '';
let score = 0;
let round = 1;

// --- Utility: shuffle characters in a word ---
function shuffleWord(word) {
  const chars = word.split('');
  // Fisher–Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const shuffled = chars.join('');
  // Ensure not identical to original (for short words may still match)
  return shuffled.toLowerCase() === word.toLowerCase() ? shuffleWord(word) : shuffled;
}

// --- Game state update functions ---
function loadNewWord() {
  currentIndex = Math.floor(Math.random() * WORDS.length);
  const entry = WORDS[currentIndex];
  currentScramble = shuffleWord(entry.word);

  document.getElementById('scrambledWord').textContent = currentScramble;
  document.getElementById('hintText').textContent = `Hint: ${entry.hint}`;
  document.getElementById('statusText').textContent = '';
  document.getElementById('statusText').className = '';
  const input = document.getElementById('guessInput');
  input.value = '';
  input.focus();

  document.getElementById('roundText').textContent = `Round: ${round}`;
}

function updateScore(delta) {
  score += delta;
  if (score < 0) score = 0;
  document.getElementById('scoreText').textContent = `Score: ${score}`;
}

// --- Event handlers ---
function handleSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('guessInput');
  const guess = input.value.trim().toLowerCase();
  const correct = WORDS[currentIndex].word.toLowerCase();

  const statusEl = document.getElementById('statusText');

  if (!guess) {
    statusEl.textContent = 'Type a guess first.';
    statusEl.className = 'status-wrong';
    return;
  }

  if (guess === correct) {
    statusEl.textContent = 'Correct! 🎉';
    statusEl.className = 'status-correct';
    updateScore(10);
    round += 1;
    if (window.M && M.toast) {
      M.toast({ html: 'Nice! Correct answer.', classes: 'teal darken-1' });
    }
    setTimeout(loadNewWord, 800);
  } else {
    statusEl.textContent = 'Not quite, try again.';
    statusEl.className = 'status-wrong';
    updateScore(-2);
    if (window.M && M.toast) {
      M.toast({ html: 'Wrong guess.', classes: 'red darken-2' });
    }
  }
}

function handleSkip() {
  round += 1;
  if (window.M && M.toast) {
    M.toast({ html: 'Skipped. New word loaded.', classes: 'orange darken-2' });
  }
  loadNewWord();
}

function handleReset() {
  score = 0;
  round = 1;
  updateScore(0);
  if (window.M && M.toast) {
    M.toast({ html: 'Game reset.', classes: 'blue-grey darken-1' });
  }
  loadNewWord();
}

// --- Initialize DOM events once page is ready ---
document.addEventListener('DOMContentLoaded', () => {
  // Materialize label animation
  if (window.M && M.updateTextFields) {
    M.updateTextFields();
  }

  document.getElementById('gameForm').addEventListener('submit', handleSubmit);
  document.getElementById('skipBtn').addEventListener('click', handleSkip);
  document.getElementById('resetBtn').addEventListener('click', handleReset);

  updateScore(0);
  loadNewWord();
});

// ======================
// Three.js Background
// ======================

function initThreeBackground() {
  const container = document.getElementById('three-bg');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Simple cube with gradient-like color
  const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
  const material = new THREE.MeshStandardMaterial({
    color: 0x26a69a, // teal-ish
    metalness: 0.4,
    roughness: 0.3
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  const pointLight = new THREE.PointLight(0xffab40, 0.9);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  // Resize handling
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.003;
    cube.rotation.y += 0.004;
    renderer.render(scene, camera);
  }

  animate();
}

initThreeBackground();
