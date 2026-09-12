import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  ArcRotateCamera,
  HemisphericLight,
  PointLight,
  DirectionalLight,
  StandardMaterial,
  PBRMaterial,
  MeshBuilder,
  Mesh,
  GlowLayer,
  Animation,
  CubicEase,
  EasingFunction,
  PointerEventTypes,
} from '@babylonjs/core';

export class BabylonBoardController {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.options = {
      cellSize: 2.2,
      gridGap: 0.25,
      boardElevation: 0.1,
      dropHeight: 8.0,
      targetY: 0.45,
      ...options,
    };

    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.glowLayer = null;

    // Tile colliders (0..8)
    this.tileMeshes = [];
    this.tileColliders = [];
    this.hoveredCell = null;

    // Spawned piece meshes: cellIndex -> Mesh or TransformNode
    this.pieceMeshes = new Map();
    this.laserMesh = null;

    // Materials cache
    this.materials = {};

    // Observers/Listeners
    this.listeners = new Set();

    this.initEngine();
  }

  initEngine() {
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.027, 0.031, 0.059, 1.0); // #07080f

    // ArcRotateCamera positioned for optimal 3D perspective
    this.camera = new ArcRotateCamera(
      'MainCamera',
      -Math.PI / 2,
      Math.PI / 3.4,
      12.5,
      new Vector3(0, 0, 0),
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerBetaLimit = 0.2;
    this.camera.upperBetaLimit = Math.PI / 2.1;
    this.camera.lowerRadiusLimit = 7;
    this.camera.upperRadiusLimit = 22;
    this.camera.wheelPrecision = 40;
    this.camera.panningSensibility = 0; // Lock panning to focus on the board

    // Glow Layer for Bloom and Neon Laser aesthetics
    this.glowLayer = new GlowLayer('glow', this.scene, {
      mainTextureRatio: 0.5,
      blurKernelSize: 32,
    });
    this.glowLayer.intensity = 1.35;

    this.setupLighting();
    this.setupMaterials();
    this.buildBoard();
    this.setupRaycasting();

    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.scene && this.scene.activeCamera) {
        this.scene.render();
      }
    });

    // Handle window resize
    this.resizeHandler = () => {
      if (this.engine) this.engine.resize();
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  setupLighting() {
    // Soft Ambient
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.45;
    hemiLight.diffuse = new Color3(0.7, 0.85, 1.0);
    hemiLight.groundColor = new Color3(0.05, 0.05, 0.1);

    // Directional Key Light
    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene);
    dirLight.intensity = 0.7;
    dirLight.diffuse = new Color3(0.9, 0.95, 1.0);

    // Cyan Neon Accent Light
    const cyanLight = new PointLight('cyanPoint', new Vector3(-5, 4, -4), this.scene);
    cyanLight.diffuse = new Color3(0.0, 0.94, 1.0);
    cyanLight.intensity = 1.2;
    cyanLight.range = 25;

    // Magenta Neon Accent Light
    const magentaLight = new PointLight('magentaPoint', new Vector3(5, 4, 4), this.scene);
    magentaLight.diffuse = new Color3(1.0, 0.0, 0.5);
    magentaLight.intensity = 1.2;
    magentaLight.range = 25;
  }

  setupMaterials() {
    // 1. Cyber Dark Floor / Arena Ground
    const groundMat = new PBRMaterial('groundMat', this.scene);
    groundMat.albedoColor = new Color3(0.04, 0.05, 0.08);
    groundMat.metallic = 0.85;
    groundMat.roughness = 0.25;
    this.materials.ground = groundMat;

    // 2. Base Grid Platform (Matte Obsidian Metal)
    const platformMat = new PBRMaterial('platformMat', this.scene);
    platformMat.albedoColor = new Color3(0.08, 0.09, 0.14);
    platformMat.metallic = 0.9;
    platformMat.roughness = 0.3;
    this.materials.platform = platformMat;

    // 3. Grid Frame Borders (Metallic with subtle cyan trim)
    const borderMat = new PBRMaterial('borderMat', this.scene);
    borderMat.albedoColor = new Color3(0.12, 0.15, 0.22);
    borderMat.emissiveColor = new Color3(0.0, 0.15, 0.3);
    borderMat.metallic = 0.95;
    borderMat.roughness = 0.2;
    this.materials.border = borderMat;

    // 4. Default Tile Surface (Smoked Glass / Dark Chromium)
    const tileDefaultMat = new PBRMaterial('tileDefaultMat', this.scene);
    tileDefaultMat.albedoColor = new Color3(0.06, 0.08, 0.13);
    tileDefaultMat.metallic = 0.8;
    tileDefaultMat.roughness = 0.25;
    tileDefaultMat.alpha = 0.88;
    this.materials.tileDefault = tileDefaultMat;

    // 5. Tile Hovered Material (Bright Cyan Glow)
    const tileHoverMat = new PBRMaterial('tileHoverMat', this.scene);
    tileHoverMat.albedoColor = new Color3(0.0, 0.6, 0.8);
    tileHoverMat.emissiveColor = new Color3(0.0, 0.7, 0.9);
    tileHoverMat.metallic = 0.5;
    tileHoverMat.roughness = 0.1;
    tileHoverMat.alpha = 0.95;
    this.materials.tileHover = tileHoverMat;

    // 6. Player X Material (Neon Electric Cyan with metallic core)
    const matX = new PBRMaterial('matX', this.scene);
    matX.albedoColor = new Color3(0.0, 0.9, 1.0);
    matX.emissiveColor = new Color3(0.0, 0.85, 1.0);
    matX.metallic = 0.75;
    matX.roughness = 0.15;
    this.materials.pieceX = matX;

    // 7. Player O Material (Vibrant Hot Magenta / Fuchsia)
    const matO = new PBRMaterial('matO', this.scene);
    matO.albedoColor = new Color3(1.0, 0.05, 0.55);
    matO.emissiveColor = new Color3(1.0, 0.05, 0.5);
    matO.metallic = 0.75;
    matO.roughness = 0.15;
    this.materials.pieceO = matO;

    // 8. Winning Laser Beam Material
    const laserMat = new StandardMaterial('laserMat', this.scene);
    laserMat.diffuseColor = new Color3(1, 1, 1);
    laserMat.emissiveColor = new Color3(0.2, 1.0, 0.4); // Intense plasma green/cyan
    laserMat.specularColor = new Color3(1, 1, 1);
    laserMat.alpha = 0.92;
    this.materials.laser = laserMat;
  }

  getCellCoordinates(index) {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const spacing = this.options.cellSize + this.options.gridGap;
    const x = (col - 1) * spacing;
    const z = (1 - row) * spacing;
    return { x, y: this.options.targetY, z, row, col };
  }

  buildBoard() {
    // 1. Circular Ambient Cyber Ground Arena
    const arenaGround = MeshBuilder.CreateCylinder(
      'arenaGround',
      { diameter: 36, height: 0.1, tessellation: 64 },
      this.scene
    );
    arenaGround.position.y = -0.6;
    arenaGround.material = this.materials.ground;
    arenaGround.isPickable = false;

    // Concentric Arena Glow Ring
    const arenaRing = MeshBuilder.CreateTorus(
      'arenaRing',
      { diameter: 18, thickness: 0.08, tessellation: 64 },
      this.scene
    );
    arenaRing.position.y = -0.52;
    const ringMat = new StandardMaterial('ringMat', this.scene);
    ringMat.emissiveColor = new Color3(0.0, 0.4, 0.6);
    arenaRing.material = ringMat;
    arenaRing.isPickable = false;

    // 2. Main Center Base Platform
    const totalSize = (this.options.cellSize + this.options.gridGap) * 3 + 0.6;
    const basePlate = MeshBuilder.CreateBox(
      'basePlate',
      { width: totalSize, depth: totalSize, height: 0.4 },
      this.scene
    );
    basePlate.position.y = -0.2;
    basePlate.material = this.materials.platform;
    basePlate.isPickable = false;

    // 3. Grid Dividers / Borders
    const spacing = this.options.cellSize + this.options.gridGap;
    const barLength = totalSize - 0.4;
    const barThickness = 0.12;
    const barHeight = 0.28;

    const barOffsets = [-spacing / 2, spacing / 2];

    // Vertical Divider Bars (Along Z)
    barOffsets.forEach((bx, idx) => {
      const vBar = MeshBuilder.CreateBox(
        `gridVBar_${idx}`,
        { width: barThickness, depth: barLength, height: barHeight },
        this.scene
      );
      vBar.position.set(bx, 0.05, 0);
      vBar.material = this.materials.border;
      vBar.isPickable = false;
    });

    // Horizontal Divider Bars (Along X)
    barOffsets.forEach((bz, idx) => {
      const hBar = MeshBuilder.CreateBox(
        `gridHBar_${idx}`,
        { width: barLength, depth: barThickness, height: barHeight },
        this.scene
      );
      hBar.position.set(0, 0.05, bz);
      hBar.material = this.materials.border;
      hBar.isPickable = false;
    });

    // 4. Nine Interactive Cell Collider Tiles
    for (let index = 0; index < 9; index++) {
      const { x, z } = this.getCellCoordinates(index);

      // Visual Tile Surface
      const tileVisual = MeshBuilder.CreateBox(
        `tileVisual_${index}`,
        {
          width: this.options.cellSize,
          depth: this.options.cellSize,
          height: 0.14,
        },
        this.scene
      );
      tileVisual.position.set(x, 0.02, z);
      tileVisual.material = this.materials.tileDefault;
      tileVisual.isPickable = false;
      this.tileMeshes[index] = tileVisual;

      // Invisible/Transparent Picking Collider Mesh for Raycast
      const collider = MeshBuilder.CreateBox(
        `tileCollider_${index}`,
        {
          width: this.options.cellSize,
          depth: this.options.cellSize,
          height: 1.2, // Generous hit volume along Y
        },
        this.scene
      );
      collider.position.set(x, 0.6, z);
      collider.isVisible = false; // invisible but pickable
      collider.isPickable = true;
      collider.metadata = { cellIndex: index };
      this.tileColliders[index] = collider;
    }
  }

  setupRaycasting() {
    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERMOVE: {
          const pickResult = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (mesh) => mesh.name.startsWith('tileCollider_')
          );

          if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.metadata) {
            const index = pickResult.pickedMesh.metadata.cellIndex;
            this.setHoveredCell(index);
          } else {
            this.setHoveredCell(null);
          }
          break;
        }

        case PointerEventTypes.POINTERDOWN: {
          // Left click only
          if (pointerInfo.event.button !== 0) return;

          const pickResult = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (mesh) => mesh.name.startsWith('tileCollider_')
          );

          if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.metadata) {
            const index = pickResult.pickedMesh.metadata.cellIndex;
            this.emit('cellClick', { index });
          }
          break;
        }
      }
    });
  }

  setHoveredCell(index) {
    if (this.hoveredCell === index) return;

    // Reset previous hovered tile visual (unless already occupied)
    if (this.hoveredCell !== null && this.tileMeshes[this.hoveredCell]) {
      this.tileMeshes[this.hoveredCell].material = this.materials.tileDefault;
    }

    this.hoveredCell = index;

    if (index !== null && this.tileMeshes[index]) {
      // Highlight with glowing cyan hover material if cell unoccupied
      if (!this.pieceMeshes.has(index)) {
        this.tileMeshes[index].material = this.materials.tileHover;
      }
      this.emit('cellHover', { index });
    } else {
      this.emit('cellHover', { index: null });
    }
  }

  /**
   * Procedural Mesh Synthesis:
   * Player X: Two intersecting beveled bars oriented at ±45 degrees
   */
  createMeshX(index) {
    const parentNode = new Mesh(`piece_X_${index}`, this.scene);

    const barLength = this.options.cellSize * 0.72;
    const barWidth = 0.32;
    const barHeight = 0.32;

    // Diagonal Bar 1 (+45 deg)
    const bar1 = MeshBuilder.CreateBox(
      `x_bar1_${index}`,
      { width: barLength, depth: barWidth, height: barHeight },
      this.scene
    );
    bar1.rotation.y = Math.PI / 4;
    bar1.material = this.materials.pieceX;
    bar1.parent = parentNode;

    // Diagonal Bar 2 (-45 deg)
    const bar2 = MeshBuilder.CreateBox(
      `x_bar2_${index}`,
      { width: barLength, depth: barWidth, height: barHeight },
      this.scene
    );
    bar2.rotation.y = -Math.PI / 4;
    bar2.material = this.materials.pieceX;
    bar2.parent = parentNode;

    return parentNode;
  }

  /**
   * Procedural Mesh Synthesis:
   * Player O: Toroidal mesh centered at cell coordinates
   */
  createMeshO(index) {
    const diameter = this.options.cellSize * 0.65;
    const thickness = 0.28;

    const torus = MeshBuilder.CreateTorus(
      `piece_O_${index}`,
      {
        diameter: diameter,
        thickness: thickness,
        tessellation: 36,
      },
      this.scene
    );
    torus.material = this.materials.pieceO;
    torus.rotation.x = Math.PI / 2; // Flat on the grid

    return torus;
  }

  /**
   * Spawns piece at dropHeight and drives kinetic drop animation
   * with cubic bezier easing + settling bounce
   */
  spawnPiece(index, playerRole, onComplete = null) {
    if (this.pieceMeshes.has(index)) {
      return this.pieceMeshes.get(index);
    }

    const { x, z } = this.getCellCoordinates(index);
    const piece = playerRole === 'X' ? this.createMeshX(index) : this.createMeshO(index);

    const startY = this.options.dropHeight;
    const targetY = this.options.targetY;

    piece.position.set(x, startY, z);
    piece.isPickable = false;

    // Kinetic Drop Animation Setup
    const fps = 60;
    const dropAnim = new Animation(
      `dropAnimation_${index}`,
      'position.y',
      fps,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // Keyframes with bounce settling
    // y(t) = y0 + (ytarget - y0) * (1 - (1 - t)^3)
    const keys = [
      { frame: 0, value: startY },
      { frame: 22, value: targetY },
      { frame: 27, value: targetY + 0.4 }, // settling bounce apex
      { frame: 32, value: targetY },
      { frame: 35, value: targetY + 0.12 }, // secondary micro-bounce
      { frame: 38, value: targetY },
    ];

    // Cubic Ease Out
    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    dropAnim.setEasingFunction(ease);
    dropAnim.setKeys(keys);

    // Gentle spin during fall
    const spinAnim = new Animation(
      `spinAnimation_${index}`,
      'rotation.y',
      fps,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    const initialRotY = piece.rotation.y || 0;
    spinAnim.setKeys([
      { frame: 0, value: initialRotY + Math.PI },
      { frame: 22, value: initialRotY },
      { frame: 38, value: initialRotY },
    ]);

    piece.animations = [dropAnim, spinAnim];

    this.scene.beginAnimation(piece, 0, 38, false, 1.25, () => {
      if (onComplete) onComplete();
      this.emit('pieceSettled', { index, playerRole });
    });

    this.pieceMeshes.set(index, piece);

    // Disable hover highlight on newly filled cell
    if (this.tileMeshes[index]) {
      this.tileMeshes[index].material = this.materials.tileDefault;
    }

    return piece;
  }

  /**
   * Spawns glowing cylindrical neon laser beam connecting centroids of winning cells
   */
  spawnWinLaser(winningIndices) {
    if (!winningIndices || winningIndices.length < 3) return;

    this.removeWinLaser();

    const p0 = this.getCellCoordinates(winningIndices[0]);
    const p1 = this.getCellCoordinates(winningIndices[1]);
    const p2 = this.getCellCoordinates(winningIndices[2]);

    const startVec = new Vector3(p0.x, 0.9, p0.z);
    const endVec = new Vector3(p2.x, 0.9, p2.z);

    // Create Tube / Cylinder beam
    const distance = Vector3.Distance(startVec, endVec);
    const midPoint = Vector3.Center(startVec, endVec);

    const laser = MeshBuilder.CreateCylinder(
      'winLaserBeam',
      {
        height: distance + 0.8,
        diameter: 0.22,
        tessellation: 24,
      },
      this.scene
    );

    laser.position = midPoint;
    laser.material = this.materials.laser;
    laser.isPickable = false;

    // Orient cylinder along the line between startVec and endVec
    laser.setDirection(endVec.subtract(startVec));
    laser.rotation.x = Math.PI / 2;
    laser.lookAt(endVec);

    // Dynamic pulse animation on laser
    const pulseAnim = new Animation(
      'laserPulse',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );
    pulseAnim.setKeys([
      { frame: 0, value: new Vector3(1, 1, 1) },
      { frame: 20, value: new Vector3(1.35, 1, 1.35) },
      { frame: 40, value: new Vector3(1, 1, 1) },
    ]);
    laser.animations = [pulseAnim];
    this.scene.beginAnimation(laser, 0, 40, true, 1.0);

    this.laserMesh = laser;

    // Elevate and gently hover the winning pieces
    winningIndices.forEach((cellIdx) => {
      const mesh = this.pieceMeshes.get(cellIdx);
      if (mesh) {
        const hoverAnim = new Animation(
          `winnerHover_${cellIdx}`,
          'position.y',
          60,
          Animation.ANIMATIONTYPE_FLOAT,
          Animation.ANIMATIONLOOPMODE_CYCLE
        );
        hoverAnim.setKeys([
          { frame: 0, value: this.options.targetY },
          { frame: 30, value: this.options.targetY + 0.3 },
          { frame: 60, value: this.options.targetY },
        ]);
        mesh.animations.push(hoverAnim);
        this.scene.beginAnimation(mesh, 0, 60, true, 0.8);
      }
    });
  }

  removeWinLaser() {
    if (this.laserMesh) {
      this.laserMesh.dispose();
      this.laserMesh = null;
    }
  }

  resetScene() {
    this.removeWinLaser();

    // Dispose all piece meshes
    for (const [, mesh] of this.pieceMeshes) {
      if (mesh) {
        // Stop any active animations
        this.scene.stopAnimation(mesh);
        mesh.dispose();
      }
    }
    this.pieceMeshes.clear();

    // Reset tile materials
    for (let i = 0; i < 9; i++) {
      if (this.tileMeshes[i]) {
        this.tileMeshes[i].material = this.materials.tileDefault;
      }
    }
    this.hoveredCell = null;
  }

  resetCamera() {
    if (this.camera) {
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = Math.PI / 3.4;
      this.camera.radius = 12.5;
      this.camera.target = new Vector3(0, 0, 0);
    }
  }

  on(eventName, callback) {
    this.listeners.add({ eventName, callback });
    return () => {
      this.listeners = new Set(
        [...this.listeners].filter((l) => l.eventName !== eventName || l.callback !== callback)
      );
    };
  }

  emit(eventName, data) {
    for (const listener of this.listeners) {
      if (listener.eventName === eventName) {
        try {
          listener.callback(data);
        } catch (err) {
          console.error(`Error in Babylon controller listener for ${eventName}:`, err);
        }
      }
    }
  }

  dispose() {
    window.removeEventListener('resize', this.resizeHandler);
    this.resetScene();
    if (this.scene) this.scene.dispose();
    if (this.engine) this.engine.dispose();
    this.listeners.clear();
  }
}
