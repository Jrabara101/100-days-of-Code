import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const BoidsViewport = ({
  engine,
  colorTheme = 'cyan',
  showBounds = true,
  showGrid = false,
  showTarget = true,
  showPredator = true,
  cameraMode = 'default', // 'default' | 'top' | 'follow' | 'cinematic'
  onTelemetryUpdate,
  mouseTargeting = false,
  isPaused = false,
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  const instancedMeshRef = useRef(null);
  const targetMeshRef = useRef(null);
  const targetRingsRef = useRef(null);
  const predatorMeshRef = useRef(null);
  const boundsMeshRef = useRef(null);
  const gridHelperGroupRef = useRef(null);

  // Transformation scratchpads (zero heap allocation in loop)
  const dummyMatrix = useRef(new THREE.Matrix4());
  const dummyColor = useRef(new THREE.Color());
  const dummyQuat = useRef(new THREE.Quaternion());
  const upVec = useRef(new THREE.Vector3(0, 0, 1));
  const dirVec = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const mouseVec = useRef(new THREE.Vector2());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const planeIntersect = useRef(new THREE.Vector3());

  // Palette calculation helper
  const getColorForBoid = (normHeight, speedRatio, theme) => {
    switch (theme) {
      case 'ocean':
        // Aqua -> Deep Teal -> Bioluminescent Blue
        dummyColor.current.setRGB(
          0.05 + speedRatio * 0.2,
          0.5 + normHeight * 0.45,
          0.8 + normHeight * 0.2
        );
        break;
      case 'thermal':
        // Blue (slow) -> Green/Yellow -> Crimson (fast)
        if (speedRatio < 0.5) {
          dummyColor.current.setRGB(0.1, 0.4 + speedRatio * 1.2, 0.9 - speedRatio * 1.4);
        } else {
          dummyColor.current.setRGB(0.6 + speedRatio * 0.4, 0.9 - (speedRatio - 0.5) * 1.6, 0.1);
        }
        break;
      case 'emerald':
        // Deep Forest -> Toxic Lime -> Golden Spark
        dummyColor.current.setRGB(
          0.1 + speedRatio * 0.6,
          0.85 - (1 - normHeight) * 0.3,
          0.3 + speedRatio * 0.4
        );
        break;
      case 'neon':
        // Electric Magenta -> Cyber Violet -> Cyan
        dummyColor.current.setRGB(
          0.85 - normHeight * 0.4,
          0.15 + speedRatio * 0.7,
          0.95
        );
        break;
      case 'cyan':
      default:
        // Futuristic Sky Blue / Deep Navy / Violet
        dummyColor.current.setRGB(
          0.15 + normHeight * 0.7,
          0.45 + speedRatio * 0.5,
          0.98 - normHeight * 0.35
        );
        break;
    }
    return dummyColor.current;
  };

  // 1. Initial Scene, Camera, Lighting & Mesh Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.0075);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500);
    camera.position.set(0, 65, 145);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 450;
    controls.minDistance = 15;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight1.position.set(50, 100, 70);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc084fc, 0.9);
    dirLight2.position.set(-60, -40, -50);
    scene.add(dirLight2);

    // Bounding Wireframe Box
    const bSize = engine.bound * 2;
    const bboxGeo = new THREE.BoxGeometry(bSize, bSize, bSize);
    const bboxEdges = new THREE.EdgesGeometry(bboxGeo);
    const bboxLine = new THREE.LineSegments(
      bboxEdges,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, opacity: 0.22, transparent: true })
    );
    scene.add(bboxLine);
    boundsMeshRef.current = bboxLine;

    // Spatial Grid Visualization Group
    const gridGroup = new THREE.Group();
    gridGroup.visible = false;
    const cellDim = engine.gridDim;
    const cSize = engine.cellSize;
    for (let x = 0; x < cellDim; x += 2) {
      for (let y = 0; y < cellDim; y += 2) {
        for (let z = 0; z < cellDim; z += 2) {
          const cGeo = new THREE.BoxGeometry(cSize * 2, cSize * 2, cSize * 2);
          const cEdges = new THREE.EdgesGeometry(cGeo);
          const cLine = new THREE.LineSegments(
            cEdges,
            new THREE.LineBasicMaterial({ color: 0x1e293b, opacity: 0.15, transparent: true })
          );
          cLine.position.set(
            -engine.bound + x * cSize + cSize,
            -engine.bound + y * cSize + cSize,
            -engine.bound + z * cSize + cSize
          );
          gridGroup.add(cLine);
        }
      }
    }
    scene.add(gridGroup);
    gridHelperGroupRef.current = gridGroup;

    // Dynamic Target Attractor Mesh
    const targetGroup = new THREE.Group();
    const targetCoreGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const targetCoreMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const targetCore = new THREE.Mesh(targetCoreGeo, targetCoreMat);
    targetGroup.add(targetCore);

    const ringGeo = new THREE.RingGeometry(2.4, 2.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfb7185, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const targetRings = new THREE.Mesh(ringGeo, ringMat);
    targetRings.rotation.x = Math.PI / 2;
    targetGroup.add(targetRings);
    targetRingsRef.current = targetRings;

    scene.add(targetGroup);
    targetMeshRef.current = targetGroup;

    // Autonomous Predator Mesh (Glowing Ruby Spire)
    const predGroup = new THREE.Group();
    const predGeo = new THREE.ConeGeometry(1.8, 5.2, 7);
    predGeo.rotateX(Math.PI / 2);
    const predMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0x990033,
      roughness: 0.2,
      metalness: 0.8
    });
    const predMesh = new THREE.Mesh(predGeo, predMat);
    predGroup.add(predMesh);

    const predAuraGeo = new THREE.SphereGeometry(3.2, 16, 16);
    const predAuraMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const predAura = new THREE.Mesh(predAuraGeo, predAuraMat);
    predGroup.add(predAura);

    scene.add(predGroup);
    predatorMeshRef.current = predGroup;

    // Instanced Mesh for Boids
    // Cone points along +Y by default; rotateX(PI/2) aligns tip along +Z
    const coneGeo = new THREE.ConeGeometry(0.55, 2.4, 5);
    coneGeo.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.35,
    });

    const instancedMesh = new THREE.InstancedMesh(coneGeo, coneMat, engine.numBoids);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;

    // Window Resize Listener
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
      scene.clear();
    };
  }, []);

  // 2. Handle Dynamic Re-Allocation of InstancedMesh when Boid Count Changes
  useEffect(() => {
    if (!sceneRef.current) return;

    if (instancedMeshRef.current) {
      sceneRef.current.remove(instancedMeshRef.current);
      instancedMeshRef.current.geometry.dispose();
      instancedMeshRef.current.material.dispose();
    }

    const coneGeo = new THREE.ConeGeometry(0.55, 2.4, 5);
    coneGeo.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.35,
    });

    const newInstancedMesh = new THREE.InstancedMesh(coneGeo, coneMat, engine.numBoids);
    newInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    sceneRef.current.add(newInstancedMesh);
    instancedMeshRef.current = newInstancedMesh;
  }, [engine.numBoids]);

  // 3. Update Visual Guides Visibility & Camera Presets
  useEffect(() => {
    if (boundsMeshRef.current) boundsMeshRef.current.visible = showBounds;
    if (gridHelperGroupRef.current) gridHelperGroupRef.current.visible = showGrid;
    if (targetMeshRef.current) targetMeshRef.current.visible = showTarget && engine.target.active;
    if (predatorMeshRef.current) predatorMeshRef.current.visible = showPredator && engine.predator.active;
  }, [showBounds, showGrid, showTarget, showPredator, engine.target.active, engine.predator.active]);

  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    if (cameraMode === 'top') {
      cameraRef.current.position.set(0, 175, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    } else if (cameraMode === 'default') {
      cameraRef.current.position.set(0, 65, 145);
      controlsRef.current.target.set(0, 0, 0);
    }
  }, [cameraMode]);

  // 4. Mouse Raycast Pointer Interactivity (Click / Drag Attractor)
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!mouseTargeting || !engine.target.active || engine.target.mode !== 'mouse') return;
      if (!containerRef.current || !cameraRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseVec.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouseVec.current, cameraRef.current);
      if (raycaster.current.ray.intersectPlane(plane.current, planeIntersect.current)) {
        const b = engine.bound * 0.9;
        engine.target.x = Math.max(-b, Math.min(b, planeIntersect.current.x));
        engine.target.y = Math.max(-b, Math.min(b, planeIntersect.current.y));
        engine.target.z = Math.max(-b, Math.min(b, planeIntersect.current.z));
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [mouseTargeting, engine]);

  // 5. Main Simulation & WebGL Animation Loop
  useEffect(() => {
    let animId;
    let clock = 0;
    let frameCount = 0;
    let lastTelemetryTime = performance.now();

    const loop = () => {
      clock += 0.016;

      // Lissajous curve orbit for autonomous attractor
      if (engine.target.active && engine.target.mode === 'lissajous') {
        engine.target.x = Math.sin(clock * 0.85) * (engine.bound * 0.68);
        engine.target.y = Math.cos(clock * 0.55) * (engine.bound * 0.48);
        engine.target.z = Math.cos(clock * 0.72) * (engine.bound * 0.68);
      }

      // Sync Attractor Mesh
      if (targetMeshRef.current) {
        targetMeshRef.current.position.set(engine.target.x, engine.target.y, engine.target.z);
        if (targetRingsRef.current) {
          targetRingsRef.current.rotation.z = clock * 1.5;
          const scale = 1.0 + Math.sin(clock * 4.0) * 0.15;
          targetRingsRef.current.scale.set(scale, scale, 1);
        }
      }

      // Sync Predator Mesh
      if (predatorMeshRef.current && engine.predator.active) {
        predatorMeshRef.current.position.set(engine.predator.x, engine.predator.y, engine.predator.z);
        dirVec.current.set(engine.predator.vx, engine.predator.vy, engine.predator.vz).normalize();
        dummyQuat.current.setFromUnitVectors(upVec.current, dirVec.current);
        predatorMeshRef.current.setRotationFromQuaternion(dummyQuat.current);
      }

      // Step Physical Engine if not paused
      if (!isPaused) {
        engine.stepSimulation(1.0);
      }

      // Update InstancedMesh Transforms & Shaded Colors
      const instancedMesh = instancedMeshRef.current;
      if (instancedMesh) {
        const boundSpan = engine.bound * 2;
        const maxSpd = engine.maxSpeed || 1.4;

        let avgFlockX = 0;
        let avgFlockY = 0;
        let avgFlockZ = 0;

        for (let i = 0; i < engine.numBoids; i++) {
          const px = engine.posX[i], py = engine.posY[i], pz = engine.posZ[i];
          const vx = engine.velX[i], vy = engine.velY[i], vz = engine.velZ[i];

          avgFlockX += px;
          avgFlockY += py;
          avgFlockZ += pz;

          // Compute Forward Direction & Quaternion
          dirVec.current.set(vx, vy, vz).normalize();
          dummyQuat.current.setFromUnitVectors(upVec.current, dirVec.current);

          // Construct 4x4 Transformation Matrix
          dummyMatrix.current.makeRotationFromQuaternion(dummyQuat.current);
          dummyMatrix.current.setPosition(px, py, pz);
          instancedMesh.setMatrixAt(i, dummyMatrix.current);

          // Color Shading Calculation
          const normHeight = (py + engine.bound) / boundSpan;
          const currentSpeed = Math.hypot(vx, vy, vz);
          const speedRatio = Math.min(1.0, currentSpeed / maxSpd);
          const col = getColorForBoid(normHeight, speedRatio, colorTheme);
          instancedMesh.setColorAt(i, col);
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

        // Follow Camera mode tracks center of mass
        if (cameraMode === 'follow' && controlsRef.current && engine.numBoids > 0) {
          avgFlockX /= engine.numBoids;
          avgFlockY /= engine.numBoids;
          avgFlockZ /= engine.numBoids;
          controlsRef.current.target.lerp(new THREE.Vector3(avgFlockX, avgFlockY, avgFlockZ), 0.05);
        } else if (cameraMode === 'cinematic' && cameraRef.current) {
          cameraRef.current.position.x = Math.sin(clock * 0.15) * 150;
          cameraRef.current.position.z = Math.cos(clock * 0.15) * 150;
          cameraRef.current.position.y = 50 + Math.sin(clock * 0.1) * 20;
          if (controlsRef.current) controlsRef.current.target.set(0, 0, 0);
        }
      }

      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Telemetry Sampling (~3 times per second)
      frameCount++;
      const now = performance.now();
      const delta = now - lastTelemetryTime;
      if (delta >= 300) {
        const measuredFps = Math.round((frameCount * 1000) / delta);
        if (onTelemetryUpdate) {
          onTelemetryUpdate({
            fps: measuredFps,
            boids: engine.numBoids,
            avgSpeed: engine.telemetry.avgSpeed.toFixed(2),
            activeBuckets: engine.telemetry.activeBuckets,
            stepMs: engine.telemetry.stepDurationMs.toFixed(2),
          });
        }
        frameCount = 0;
        lastTelemetryTime = now;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine, colorTheme, cameraMode, isPaused, onTelemetryUpdate]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
      id="webgl-canvas-container"
    />
  );
};
