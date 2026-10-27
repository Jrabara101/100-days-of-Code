import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BoardSkin, getSkinById } from './Skins';
import { PieceFactory, PieceType, PieceColor } from './PieceFactory';
import { buildChessBoard, BoardMeshCollection } from './BoardBuilder';

// Reusable scratch objects to eliminate Garbage Collection during render loop
const _vec3 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3(0, 0, 0);

export type CameraPreset = 'white' | 'black' | 'tactical' | 'cinematic' | 'free';

export interface SceneManagerOptions {
  container: HTMLElement;
  initialSkinId?: string;
  onSquareClick?: (square: string) => void;
  onHoverSquareChange?: (square: string | null) => void;
  onPieceDrop?: (fromSquare: string, toSquare: string) => void;
  canDragPiece?: (square: string) => boolean;
  getLegalMoves?: (square: string) => string[];
}

export class SceneManager {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private pmremGenerator!: THREE.PMREMGenerator;

  // Lighting
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.DirectionalLight;

  // Chess components
  private activeSkin: BoardSkin;
  private pieceFactory!: PieceFactory;
  private boardCollection!: BoardMeshCollection;
  private piecesGroup: THREE.Group = new THREE.Group();
  private pieceMap: Map<string, THREE.Group> = new Map(); // square -> piece group

  // Highlights & Visual Indicators
  private highlightsGroup: THREE.Group = new THREE.Group();
  private hoverSquareMesh!: THREE.Mesh;
  private selectedSquareMesh!: THREE.Mesh;
  private lastMoveFromMesh!: THREE.Mesh;
  private lastMoveToMesh!: THREE.Mesh;
  private checkIndicatorMesh!: THREE.Mesh;
  private suggestedFromMesh!: THREE.Mesh;
  private suggestedToMesh!: THREE.Mesh;
  private legalMoveIndicators: THREE.Mesh[] = [];

  // Interaction & Callbacks
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private hoveredSquare: string | null = null;
  private selectedSquare: string | null = null;
  private onSquareClick?: (square: string) => void;
  private onHoverSquareChange?: (square: string | null) => void;
  private onPieceDrop?: (fromSquare: string, toSquare: string) => void;
  private canDragPiece?: (square: string) => boolean;
  private getLegalMoves?: (square: string) => string[];

  // Drag-and-Drop state
  private isDraggingPiece = false;
  private draggedPiece: THREE.Group | null = null;
  private draggedFromSquare: string | null = null;
  private draggedOriginalPos = new THREE.Vector3();
  private pointerDownPos = new THREE.Vector2();
  private boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private planeIntersect = new THREE.Vector3();

  // Camera animation
  private currentPreset: CameraPreset = 'white';
  private isCinematic: boolean = false;
  private cinematicAngle: number = 0;
  private targetCameraPos = new THREE.Vector3(0, 7.5, 8.8);
  private targetControlsLookAt = new THREE.Vector3(0, 0, 0);

  // Piece Move Animation (supports primary piece + castling secondary rook)
  private activeMoveAnimation: {
    piece: THREE.Group;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    secondaryPiece?: THREE.Group;
    secondaryFromPos?: THREE.Vector3;
    secondaryToPos?: THREE.Vector3;
    progress: number;
    duration: number; // in seconds
    onComplete?: () => void;
  } | null = null;

  private timer = new THREE.Timer();
  private animationFrameId: number | null = null;
  private isDisposed: boolean = false;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.activeSkin = getSkinById(options.initialSkinId || 'heritage');
    this.onSquareClick = options.onSquareClick;
    this.onHoverSquareChange = options.onHoverSquareChange;
    this.onPieceDrop = options.onPieceDrop;
    this.canDragPiece = options.canDragPiece;
    this.getLegalMoves = options.getLegalMoves;

    this.initThree();
    this.initLighting();
    this.initBoardAndPieces();
    this.initHighlightMeshes();
    this.setupEvents();
    this.startLoop();
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.activeSkin.backgroundColor);
    this.scene.fog = new THREE.FogExp2(this.activeSkin.fogColor, 0.038);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 80);
    this.camera.position.set(0, 7.5, 8.8);

    // 3. Renderer with PBR Physical Rendering & Headless detection
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.debug.checkShaderErrors = false;

    this.container.appendChild(this.renderer.domElement);

    // 4. RoomEnvironment for realistic metallic reflections
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    const envTexture = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;

    // 5. OrbitControls with smooth damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't clip under ground
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 22;
    this.controls.target.set(0, 0, 0);

    // Set initial target camera pos
    this.targetCameraPos.copy(this.camera.position);
    this.targetControlsLookAt.set(0, 0, 0);
  }

  private initLighting() {
    // 1. Warm Directional Key Light with tight shadow bounds
    this.keyLight = new THREE.DirectionalLight(this.activeSkin.keyLightColor, 2.2);
    this.keyLight.position.set(5, 12, 6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 30;
    const shadowD = 6;
    this.keyLight.shadow.camera.left = -shadowD;
    this.keyLight.shadow.camera.right = shadowD;
    this.keyLight.shadow.camera.top = shadowD;
    this.keyLight.shadow.camera.bottom = -shadowD;
    this.keyLight.shadow.bias = -0.0001;
    this.keyLight.shadow.normalBias = 0.01;
    this.scene.add(this.keyLight);

    // 2. Cool Sky/Ground Hemisphere fill light
    this.hemiLight = new THREE.HemisphereLight(
      this.activeSkin.ambientLightColor,
      this.activeSkin.fillLightColor,
      1.1
    );
    this.scene.add(this.hemiLight);

    // 3. Subtle Rim Light for piece silhouette definition
    this.rimLight = new THREE.DirectionalLight(this.activeSkin.fillLightColor, 0.9);
    this.rimLight.position.set(-6, 9, -7);
    this.scene.add(this.rimLight);
  }

  private initBoardAndPieces() {
    // Board
    this.boardCollection = buildChessBoard(this.activeSkin);
    this.scene.add(this.boardCollection.boardGroup);

    // Piece Factory & Pieces Group
    this.pieceFactory = new PieceFactory(this.activeSkin);
    this.piecesGroup.name = 'PiecesGroup';
    this.scene.add(this.piecesGroup);

    // Highlights Group
    this.scene.add(this.highlightsGroup);
  }

  private initHighlightMeshes() {
    // 1. Selected square highlight (glowing cyan border)
    const selectGeo = new THREE.PlaneGeometry(0.96, 0.96);
    const selectMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    this.selectedSquareMesh = new THREE.Mesh(selectGeo, selectMat);
    this.selectedSquareMesh.rotation.x = -Math.PI / 2;
    this.selectedSquareMesh.position.y = 0.005;
    this.selectedSquareMesh.visible = false;
    this.highlightsGroup.add(this.selectedSquareMesh);

    // 2. Hover square outline
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.hoverSquareMesh = new THREE.Mesh(selectGeo, hoverMat);
    this.hoverSquareMesh.rotation.x = -Math.PI / 2;
    this.hoverSquareMesh.position.y = 0.004;
    this.hoverSquareMesh.visible = false;
    this.highlightsGroup.add(this.hoverSquareMesh);

    // 3. Last move highlights (From & To)
    const lastMoveMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    this.lastMoveFromMesh = new THREE.Mesh(selectGeo, lastMoveMat);
    this.lastMoveFromMesh.rotation.x = -Math.PI / 2;
    this.lastMoveFromMesh.position.y = 0.003;
    this.lastMoveFromMesh.visible = false;
    this.highlightsGroup.add(this.lastMoveFromMesh);

    this.lastMoveToMesh = new THREE.Mesh(selectGeo, lastMoveMat.clone());
    this.lastMoveToMesh.rotation.x = -Math.PI / 2;
    this.lastMoveToMesh.position.y = 0.003;
    this.lastMoveToMesh.visible = false;
    this.highlightsGroup.add(this.lastMoveToMesh);

    // 4. King Check indicator (pulsating red ring)
    const checkMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.checkIndicatorMesh = new THREE.Mesh(selectGeo, checkMat);
    this.checkIndicatorMesh.rotation.x = -Math.PI / 2;
    this.checkIndicatorMesh.position.y = 0.006;
    this.checkIndicatorMesh.visible = false;
    this.highlightsGroup.add(this.checkIndicatorMesh);

    // 5. Best Move Suggested Target and Origin Highlights (Emerald tactical glow)
    const suggestMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.suggestedFromMesh = new THREE.Mesh(selectGeo, suggestMat);
    this.suggestedFromMesh.rotation.x = -Math.PI / 2;
    this.suggestedFromMesh.position.y = 0.007;
    this.suggestedFromMesh.visible = false;
    this.highlightsGroup.add(this.suggestedFromMesh);

    const suggestRingGeo = new THREE.RingGeometry(0.24, 0.44, 32);
    const suggestToMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.suggestedToMesh = new THREE.Mesh(suggestRingGeo, suggestToMat);
    this.suggestedToMesh.rotation.x = -Math.PI / 2;
    this.suggestedToMesh.position.y = 0.008;
    this.suggestedToMesh.visible = false;
    this.highlightsGroup.add(this.suggestedToMesh);
  }

  /**
   * Translate algebraic square ("e4") to 3D world position
   */
  public squareToWorld(square: string): { x: number; y: number; z: number } {
    const file = square.charCodeAt(0) - 97; // a -> 0, h -> 7
    const rank = parseInt(square[1], 10) - 1; // 1 -> 0, 8 -> 7
    return {
      x: file - 3.5,
      y: 0,
      z: 3.5 - rank,
    };
  }

  /**
   * Set board state from FEN
   */
  public syncFromFen(fen: string) {
    // If a move animation is currently running, finish it immediately
    if (this.activeMoveAnimation) {
      this.activeMoveAnimation.piece.position.copy(this.activeMoveAnimation.toPos);
      this.activeMoveAnimation = null;
    }

    // Clear old pieces
    while (this.piecesGroup.children.length > 0) {
      const obj = this.piecesGroup.children[0];
      this.piecesGroup.remove(obj);
    }
    this.pieceMap.clear();

    const parts = fen.split(' ');
    const position = parts[0];
    const rows = position.split('/');

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
      const rowStr = rows[r];
      let fileIdx = 0;
      const rankNum = 8 - r;

      for (let charIdx = 0; charIdx < rowStr.length; charIdx++) {
        const char = rowStr[charIdx];
        if (char >= '1' && char <= '8') {
          fileIdx += parseInt(char, 10);
        } else {
          const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
          const type = char.toLowerCase() as PieceType;
          const square = `${files[fileIdx]}${rankNum}`;

          const pieceMesh = this.pieceFactory.createPiece(type, color, square);
          const worldPos = this.squareToWorld(square);
          pieceMesh.position.set(worldPos.x, worldPos.y, worldPos.z);

          this.piecesGroup.add(pieceMesh);
          this.pieceMap.set(square, pieceMesh);

          fileIdx++;
        }
      }
    }
  }

  /**
   * Animate smooth piece motion with parabolic arc & squash settle
   */
  public animateMove(
    from: string,
    to: string,
    onComplete?: () => void
  ) {
    const piece = this.pieceMap.get(from);
    if (!piece) {
      onComplete?.();
      return;
    }

    // If destination has a piece (capture), remove it
    const capturedPiece = this.pieceMap.get(to);
    if (capturedPiece && capturedPiece !== piece) {
      this.piecesGroup.remove(capturedPiece);
      this.pieceMap.delete(to);
    }

    // Handle En Passant capture: diagonal pawn move to an empty destination
    if (piece.userData.type === 'p' && from[0] !== to[0] && !capturedPiece) {
      const epSquare = `${to[0]}${from[1]}`;
      const epPiece = this.pieceMap.get(epSquare);
      if (epPiece) {
        this.piecesGroup.remove(epPiece);
        this.pieceMap.delete(epSquare);
      }
    }

    // Handle Castling: animate secondary rook along with king
    let secondaryPiece: THREE.Group | undefined;
    let secondaryFromPos: THREE.Vector3 | undefined;
    let secondaryToPos: THREE.Vector3 | undefined;

    if (piece.userData.type === 'k') {
      let rFrom: string | null = null;
      let rTo: string | null = null;
      if (from === 'e1' && to === 'g1') { rFrom = 'h1'; rTo = 'f1'; }
      else if (from === 'e1' && to === 'c1') { rFrom = 'a1'; rTo = 'd1'; }
      else if (from === 'e8' && to === 'g8') { rFrom = 'h8'; rTo = 'f8'; }
      else if (from === 'e8' && to === 'c8') { rFrom = 'a8'; rTo = 'd8'; }

      if (rFrom && rTo) {
        const rook = this.pieceMap.get(rFrom);
        if (rook) {
          this.pieceMap.delete(rFrom);
          this.pieceMap.set(rTo, rook);
          rook.userData.square = rTo;
          const rPos = this.squareToWorld(rTo);
          secondaryPiece = rook;
          secondaryFromPos = rook.position.clone();
          secondaryToPos = new THREE.Vector3(rPos.x, rPos.y, rPos.z);
        }
      }
    }

    this.pieceMap.delete(from);
    this.pieceMap.set(to, piece);
    piece.userData.square = to;

    const fromPos = new THREE.Vector3().copy(piece.position);
    const target = this.squareToWorld(to);
    const toPos = new THREE.Vector3(target.x, target.y, target.z);

    this.activeMoveAnimation = {
      piece,
      fromPos,
      toPos,
      secondaryPiece,
      secondaryFromPos,
      secondaryToPos,
      progress: 0,
      duration: 0.32,
      onComplete,
    };
  }

  /**
   * Update visual highlights for selected square, legal moves, and check
   */
  public setSelection(
    selectedSquare: string | null,
    legalDestinations: string[] = []
  ) {
    this.selectedSquare = selectedSquare;

    if (selectedSquare) {
      const pos = this.squareToWorld(selectedSquare);
      this.selectedSquareMesh.position.set(pos.x, 0.005, pos.z);
      this.selectedSquareMesh.visible = true;
    } else {
      this.selectedSquareMesh.visible = false;
    }

    // Clear previous legal indicators
    for (const ind of this.legalMoveIndicators) {
      this.highlightsGroup.remove(ind);
      ind.geometry.dispose();
      (ind.material as THREE.Material).dispose();
    }
    this.legalMoveIndicators = [];

    // Create legal move indicators
    for (const dest of legalDestinations) {
      const pos = this.squareToWorld(dest);
      const isCapture = this.pieceMap.has(dest);

      let mesh: THREE.Mesh;
      if (isCapture) {
        // Capture indicator: Hollow target ring
        const ringGeo = new THREE.RingGeometry(0.36, 0.44, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        mesh = new THREE.Mesh(ringGeo, ringMat);
      } else {
        // Move indicator: Solid soft glowing dot
        const dotGeo = new THREE.CircleGeometry(0.14, 24);
        const dotMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        mesh = new THREE.Mesh(dotGeo, dotMat);
      }

      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x, 0.006, pos.z);
      this.highlightsGroup.add(mesh);
      this.legalMoveIndicators.push(mesh);
    }
  }

  public setLastMove(from: string | null, to: string | null) {
    if (from && to) {
      const fromPos = this.squareToWorld(from);
      this.lastMoveFromMesh.position.set(fromPos.x, 0.003, fromPos.z);
      this.lastMoveFromMesh.visible = true;

      const toPos = this.squareToWorld(to);
      this.lastMoveToMesh.position.set(toPos.x, 0.003, toPos.z);
      this.lastMoveToMesh.visible = true;
    } else {
      this.lastMoveFromMesh.visible = false;
      this.lastMoveToMesh.visible = false;
    }
  }

  public setCheckSquare(kingSquare: string | null) {
    if (kingSquare) {
      const pos = this.squareToWorld(kingSquare);
      this.checkIndicatorMesh.position.set(pos.x, 0.006, pos.z);
      this.checkIndicatorMesh.visible = true;
    } else {
      this.checkIndicatorMesh.visible = false;
    }
  }

  /**
   * Visually highlight AI recommended Best Move in 3D scene
   */
  public showSuggestedMove(from: string, to: string) {
    const fromPos = this.squareToWorld(from);
    this.suggestedFromMesh.position.set(fromPos.x, 0.007, fromPos.z);
    this.suggestedFromMesh.visible = true;

    const toPos = this.squareToWorld(to);
    this.suggestedToMesh.position.set(toPos.x, 0.008, toPos.z);
    this.suggestedToMesh.visible = true;
  }

  public clearSuggestedMove() {
    if (this.suggestedFromMesh) this.suggestedFromMesh.visible = false;
    if (this.suggestedToMesh) this.suggestedToMesh.visible = false;
  }

  /**
   * Switch Camera Preset smoothly with damping
   */
  public setCameraPreset(preset: CameraPreset) {
    this.currentPreset = preset;
    this.isCinematic = preset === 'cinematic';

    switch (preset) {
      case 'white':
        this.targetCameraPos.set(0, 7.5, 8.8);
        this.targetControlsLookAt.set(0, 0, 0);
        break;
      case 'black':
        this.targetCameraPos.set(0, 7.5, -8.8);
        this.targetControlsLookAt.set(0, 0, 0);
        break;
      case 'tactical':
        this.targetCameraPos.set(0, 11.5, 0.01);
        this.targetControlsLookAt.set(0, 0, 0);
        break;
      case 'cinematic':
        this.cinematicAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
        this.targetControlsLookAt.set(0, 0, 0);
        break;
      case 'free':
        // Leave current camera position
        break;
    }
  }

  public getCameraPreset(): CameraPreset {
    return this.currentPreset;
  }

  /**
   * Change Skin dynamically
   */
  public setSkin(skin: BoardSkin) {
    this.activeSkin = skin;

    // 1. Atmosphere & Fog
    this.scene.background = new THREE.Color(skin.backgroundColor);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(skin.fogColor);
    }

    // 2. Lights
    this.keyLight.color.setHex(skin.keyLightColor);
    this.hemiLight.color.setHex(skin.ambientLightColor);
    this.hemiLight.groundColor.setHex(skin.fillLightColor);
    this.rimLight.color.setHex(skin.fillLightColor);

    // 3. Board
    this.boardCollection.updateSkin(skin);

    // 4. Piece Factory and Pieces
    this.pieceFactory.updateMaterials(skin);

    // Update existing piece materials
    for (const piece of this.pieceMap.values()) {
      const type = piece.userData.type as PieceType;
      const color = piece.userData.color as PieceColor;
      const sq = piece.userData.square as string;

      const newPiece = this.pieceFactory.createPiece(type, color, sq);
      newPiece.position.copy(piece.position);
      newPiece.rotation.copy(piece.rotation);

      this.piecesGroup.remove(piece);
      this.piecesGroup.add(newPiece);
      this.pieceMap.set(sq, newPiece);
    }
  }

  public getActiveSkin(): BoardSkin {
    return this.activeSkin;
  }

  private setupEvents() {
    const el = this.renderer.domElement;

    const getPointerCoords = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1,
        clientX,
        clientY,
      };
    };

    const getSquareUnderRay = (): string | null => {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const candidates: THREE.Object3D[] = [];
      for (const piece of this.piecesGroup.children) {
        if (piece !== this.draggedPiece) {
          candidates.push(piece);
        }
      }
      for (const sqMesh of this.boardCollection.squareMeshes.values()) {
        candidates.push(sqMesh);
      }

      const intersects = this.raycaster.intersectObjects(candidates, true);
      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr) {
          if (curr.userData?.square) {
            return curr.userData.square;
          }
          curr = curr.parent;
        }
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Left click only
      const coords = getPointerCoords(e);
      this.mouse.x = coords.x;
      this.mouse.y = coords.y;
      this.pointerDownPos.set(coords.clientX, coords.clientY);

      const clickedSquare = getSquareUnderRay();
      if (clickedSquare && this.canDragPiece?.(clickedSquare)) {
        const piece = this.pieceMap.get(clickedSquare);
        if (piece) {
          this.draggedPiece = piece;
          this.draggedFromSquare = clickedSquare;
          this.draggedOriginalPos.copy(piece.position);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const coords = getPointerCoords(e);
      this.mouse.x = coords.x;
      this.mouse.y = coords.y;

      // Check if starting drag
      if (this.draggedPiece && !this.isDraggingPiece) {
        const dist = Math.hypot(coords.clientX - this.pointerDownPos.x, coords.clientY - this.pointerDownPos.y);
        if (dist > 7) {
          this.isDraggingPiece = true;
          this.controls.enabled = false; // Freeze camera orbit during piece drag
          if (this.draggedFromSquare) {
            const legals = this.getLegalMoves?.(this.draggedFromSquare) ?? [];
            this.setSelection(this.draggedFromSquare, legals);
          }
        }
      }

      if (this.isDraggingPiece && this.draggedPiece) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        if (this.raycaster.ray.intersectPlane(this.boardPlane, this.planeIntersect)) {
          this.draggedPiece.position.x = this.planeIntersect.x;
          this.draggedPiece.position.z = this.planeIntersect.z;
          this.draggedPiece.position.y = 0.45; // Elevation above board
        }

        // Highlight square under drag
        const sq = getSquareUnderRay();
        if (sq !== this.hoveredSquare) {
          this.hoveredSquare = sq;
          if (sq) {
            const pos = this.squareToWorld(sq);
            this.hoverSquareMesh.position.set(pos.x, 0.004, pos.z);
            this.hoverSquareMesh.visible = true;
          } else {
            this.hoverSquareMesh.visible = false;
          }
          this.onHoverSquareChange?.(sq);
        }
      } else {
        this.raycastHover();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const coords = getPointerCoords(e);
      const dist = Math.hypot(coords.clientX - this.pointerDownPos.x, coords.clientY - this.pointerDownPos.y);

      if (this.isDraggingPiece && this.draggedPiece && this.draggedFromSquare) {
        const fromSq = this.draggedFromSquare;
        const toSq = getSquareUnderRay();

        // Snap piece back to starting pos immediately (animateMove / syncFromFen will move it if valid)
        this.draggedPiece.position.copy(this.draggedOriginalPos);
        this.isDraggingPiece = false;
        this.draggedPiece = null;
        this.draggedFromSquare = null;
        this.controls.enabled = true;

        if (toSq && toSq !== fromSq && this.onPieceDrop) {
          this.onPieceDrop(fromSq, toSq);
        }
        return;
      }

      this.isDraggingPiece = false;
      this.draggedPiece = null;
      this.draggedFromSquare = null;
      this.controls.enabled = true;

      // Click handling: only trigger if user didn't drag/orbit (> 6px movement)
      if (dist <= 6) {
        const sq = getSquareUnderRay();
        if (sq && this.onSquareClick) {
          this.onSquareClick(sq);
        }
      }
    };

    const onResize = () => {
      if (this.isDisposed) return;
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);

    (this as any)._cleanupEvents = () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
    };
  }

  private raycastHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const candidates: THREE.Object3D[] = [];
    for (const sqMesh of this.boardCollection.squareMeshes.values()) {
      candidates.push(sqMesh);
    }
    for (const piece of this.piecesGroup.children) {
      candidates.push(piece);
    }

    const intersects = this.raycaster.intersectObjects(candidates, true);
    let foundSquare: string | null = null;

    if (intersects.length > 0) {
      let curr: THREE.Object3D | null = intersects[0].object;
      while (curr) {
        if (curr.userData?.square) {
          foundSquare = curr.userData.square;
          break;
        }
        curr = curr.parent;
      }
    }

    if (foundSquare !== this.hoveredSquare) {
      this.hoveredSquare = foundSquare;
      if (foundSquare) {
        const pos = this.squareToWorld(foundSquare);
        this.hoverSquareMesh.position.set(pos.x, 0.004, pos.z);
        this.hoverSquareMesh.visible = true;
      } else {
        this.hoverSquareMesh.visible = false;
      }
      this.onHoverSquareChange?.(foundSquare);
    }
  }

  private startLoop() {
    const animate = () => {
      if (this.isDisposed) return;
      this.animationFrameId = requestAnimationFrame(animate);

      this.timer.update();
      const dt = Math.min(this.timer.getDelta(), 0.05);

      // 1. Piece Move Animation (Parabolic arc + settle)
      if (this.activeMoveAnimation) {
        const anim = this.activeMoveAnimation;
        anim.progress += dt / anim.duration;

        if (anim.progress >= 1) {
          anim.piece.position.copy(anim.toPos);
          anim.piece.scale.set(1, 1, 1);
          if (anim.secondaryPiece && anim.secondaryToPos) {
            anim.secondaryPiece.position.copy(anim.secondaryToPos);
          }
          const callback = anim.onComplete;
          this.activeMoveAnimation = null;
          callback?.();
        } else {
          const t = anim.progress;
          // Smooth ease in-out
          const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

          // Interpolate primary piece X and Z
          anim.piece.position.x = THREE.MathUtils.lerp(anim.fromPos.x, anim.toPos.x, easeT);
          anim.piece.position.z = THREE.MathUtils.lerp(anim.fromPos.z, anim.toPos.z, easeT);

          // Interpolate secondary piece (e.g. castling rook)
          if (anim.secondaryPiece && anim.secondaryFromPos && anim.secondaryToPos) {
            anim.secondaryPiece.position.x = THREE.MathUtils.lerp(anim.secondaryFromPos.x, anim.secondaryToPos.x, easeT);
            anim.secondaryPiece.position.z = THREE.MathUtils.lerp(anim.secondaryFromPos.z, anim.secondaryToPos.z, easeT);
          }

          // Parabolic height arc: peak at 1.15 units
          const arcHeight = Math.sin(t * Math.PI) * 1.15;
          anim.piece.position.y = anim.fromPos.y + arcHeight;

          if (t > 0.85) {
            // Settle squash
            const settle = Math.sin(((t - 0.85) / 0.15) * Math.PI);
            anim.piece.scale.set(1 + settle * 0.1, 1 - settle * 0.1, 1 + settle * 0.1);
          } else {
            anim.piece.scale.set(1, 1, 1);
          }
        }
      }

      // 2. Camera presets damping or Cinematic orbit
      if (this.isCinematic) {
        this.cinematicAngle += dt * 0.22;
        const radius = 9.8;
        this.camera.position.x = Math.cos(this.cinematicAngle) * radius;
        this.camera.position.z = Math.sin(this.cinematicAngle) * radius;
        this.camera.position.y = 6.2 + Math.sin(this.cinematicAngle * 0.5) * 1.5;
        this.controls.target.set(0, 0.4, 0);
      } else if (this.currentPreset !== 'free') {
        // Damp camera position toward target
        const dampFactor = 1 - Math.exp(-6 * dt);
        this.camera.position.lerp(this.targetCameraPos, dampFactor);
        this.controls.target.lerp(this.targetControlsLookAt, dampFactor);

        // If very close to target, finish damping
        if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05) {
          this.currentPreset = 'free'; // Hand over to free OrbitControls smoothly
        }
      }

      // 3. Check & Suggested move indicator pulsation
      if (this.checkIndicatorMesh.visible) {
        const pulse = 0.4 + Math.sin(this.timer.getElapsed() * 6) * 0.2;
        (this.checkIndicatorMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
      }
      if (this.suggestedToMesh.visible) {
        const pulse = 0.5 + Math.sin(this.timer.getElapsed() * 7) * 0.25;
        (this.suggestedToMesh.material as THREE.MeshBasicMaterial).opacity = pulse;
      }

      // 4. Update Controls & Render
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  public dispose() {
    this.isDisposed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    (this as any)._cleanupEvents?.();
    this.controls.dispose();
    this.pmremGenerator.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
