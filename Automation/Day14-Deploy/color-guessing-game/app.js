// app.js — Three.js + Matter.js + DOM UI, mobile-friendly + FIXED version

// ----------------------------- Helpers -----------------------------
const CONFIG = {
  sphereCount: 10,
  sphereRadius: 0.55,
  spawnRadius: 6,
  gravity: 0.7,
  colorTolerance: 55
};

function rand(min, max){ return Math.random()*(max-min)+min; }
function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function rgbToHex(r,g,b){
  return "#" + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}
function hexToRgb(hex){
  hex = hex.replace('#','');
  return [
    parseInt(hex.slice(0,2),16),
    parseInt(hex.slice(2,4),16),
    parseInt(hex.slice(4,6),16)
  ];
}
function colorDist(a,b){
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

// ----------------------------- Global -----------------------------
let three = {};
let matter = {};
let meshes = [];
let bodies = [];
let score = 0;
let targetColor = null;

// DOM references
const scoreEl = document.getElementById("score");
const targetTextEl = document.getElementById("target-text");
const swatchEl = document.getElementById("color-swatch");
const messageEl = document.getElementById("message");

// ----------------------------- Three.js -----------------------------
function initThree(container){
  const w = container.clientWidth;
  const h = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(w,h);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w/h, 0.1, 1000);
  camera.position.set(0,4,12);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
  scene.add(hemi);

  window.addEventListener("resize", () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w,h);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  });

  three = {
    scene, camera, renderer, container,
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2()
  };
}

// ----------------------------- Matter.js -----------------------------
function createPhysicsWorld(){
  const Engine = Matter.Engine,
        World = Matter.World,
        Bodies = Matter.Bodies;

  const engine = Engine.create();
  engine.gravity.y = CONFIG.gravity;

  // Walls
  const wallOptions = { isStatic:true, restitution:1, friction:0.1 };
  const walls = [
    Bodies.rectangle(0, 20, 60, 2, wallOptions),
    Bodies.rectangle(0,-20, 60, 2, wallOptions),
    Bodies.rectangle(-20,0, 2,60, wallOptions),
    Bodies.rectangle( 20,0, 2,60, wallOptions)
  ];

  World.add(engine.world, walls);

  matter = { Engine, World, Bodies, engine };
}

function resetPhysicsWorld(){
  if (matter.engine){
    Matter.World.clear(matter.engine.world, false);
    Matter.Engine.clear(matter.engine);
  }
  createPhysicsWorld();
}

// ----------------------------- Spheres -----------------------------
function createSpheres(n){
  const scene = three.scene;

  // Cleanup old objects
  meshes.forEach(m => scene.remove(m.mesh));
  meshes = [];
  bodies.forEach(b => Matter.World.remove(matter.engine.world, b.body));
  bodies = [];

  for (let i=0;i<n;i++){
    const hue = Math.floor(rand(0,360));
    const sat = Math.floor(rand(60,100));
    const light = Math.floor(rand(40,65));

    const color = new THREE.Color(`hsl(${hue} ${sat}% ${light}%)`);
    const rgb = color.toArray().map(v => Math.round(v*255));

    const geo = new THREE.SphereGeometry(CONFIG.sphereRadius, 24, 24);
    const mat = new THREE.MeshStandardMaterial({ color: rgbToHex(...rgb) });
    const mesh = new THREE.Mesh(geo, mat);

    const px = rand(-5,5);
    const py = rand(2,7);
    const pz = rand(-1,1);

    mesh.position.set(px, py, pz);
    mesh.initialZ = pz;

    scene.add(mesh);

    const body = matter.Bodies.circle(
      px,
      py * -1,                   // invert for Matter world
      CONFIG.sphereRadius,
      { restitution:0.9 }
    );

    Matter.World.add(matter.engine.world, body);

    meshes.push({ mesh, rgb });
    bodies.push({ body, mesh });
  }
}

// ----------------------------- UI -----------------------------
function updateUI(){
  scoreEl.textContent = `Score: ${score}`;
  if (!targetColor){
    targetTextEl.textContent = "Target: --";
    swatchEl.style.background = "black";
    return;
  }
  const hex = rgbToHex(...targetColor).toUpperCase();
  targetTextEl.textContent = `Target: ${hex}`;
  swatchEl.style.background = hex;
}

function showMessage(text, duration=1800){
  messageEl.textContent = text;
  messageEl.classList.remove("hidden");
  messageEl.style.opacity = "1";

  setTimeout(() => {
    messageEl.style.opacity = "0";
    setTimeout(()=> messageEl.classList.add("hidden"), 300);
  }, duration);
}

// ----------------------------- Game Logic -----------------------------
function startRound(){
  const picked = pickRandom(meshes);
  targetColor = picked.rgb.slice();
  updateUI();
  showMessage("Select the sphere that matches the color!");
}

function evaluate(rgb){
  const d = colorDist(rgb, targetColor);

  if (d <= CONFIG.colorTolerance){
    score++;
    showMessage("Correct! +1");

    resetPhysicsWorld();
    createSpheres(CONFIG.sphereCount);
    startRound();

  } else {
    showMessage("Not quite, try again!");
  }

  updateUI();
}

// ----------------------------- Input -----------------------------
function setupInput(){
  const container = three.container;

  function handle(event){
    const rect = container.getBoundingClientRect();
    const cx = (event.clientX - rect.left) / rect.width;
    const cy = (event.clientY - rect.top) / rect.height;

    three.pointer.x = cx * 2 - 1;
    three.pointer.y = -(cy * 2 - 1);

    three.raycaster.setFromCamera(three.pointer, three.camera);
    const intersects = three.raycaster.intersectObjects(
      three.scene.children.filter(o => o.isMesh)
    );

    if (intersects.length){
      const obj = intersects[0].object;
      const entry = meshes.find(m => m.mesh === obj);
      if (entry) evaluate(entry.rgb);
    }
  }

  container.addEventListener("pointerdown", handle);
  container.addEventListener("touchstart", (e)=> handle(e.touches[0]));
}

// ----------------------------- Animation -----------------------------
function animate(){
  requestAnimationFrame(animate);

  Matter.Engine.update(matter.engine, 1000/60);

  bodies.forEach(({ body, mesh })=>{
    mesh.position.x = body.position.x;
    mesh.position.y = body.position.y * -1;   // invert back for Three
    mesh.position.z = mesh.initialZ;          // keep stable depth
    mesh.rotation.z = -body.angle;
  });

  three.renderer.render(three.scene, three.camera);
}

// ----------------------------- Boot -----------------------------
function boot(){
  const container = document.getElementById("three-container");

  initThree(container);
  createPhysicsWorld();
  createSpheres(CONFIG.sphereCount);
  startRound();
  setupInput();
  animate();

  // Buttons
  document.getElementById("new-round").onclick = () => {
    resetPhysicsWorld();
    createSpheres(CONFIG.sphereCount);
    startRound();
  };

  document.getElementById("reset-score").onclick = () => {
    score = 0;
    updateUI();
    showMessage("Score reset");
  };
}

boot();
