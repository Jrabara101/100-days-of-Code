import * as THREE from 'three';
import { BoardSkin } from './Skins';

export interface BoardMeshCollection {
  boardGroup: THREE.Group;
  squareMeshes: Map<string, THREE.Mesh>;
  updateSkin: (skin: BoardSkin) => void;
}

export function buildChessBoard(skin: BoardSkin): BoardMeshCollection {
  const boardGroup = new THREE.Group();
  boardGroup.name = 'ChessBoardGroup';

  const squareMeshes = new Map<string, THREE.Mesh>();

  // Materials
  let lightTileMat!: THREE.MeshStandardMaterial;
  let darkTileMat!: THREE.MeshStandardMaterial;
  let frameMat!: THREE.MeshStandardMaterial;
  let inlayMat!: THREE.MeshStandardMaterial;
  let notationMat: THREE.MeshBasicMaterial;

  const createMaterials = (s: BoardSkin) => {
    lightTileMat = new THREE.MeshStandardMaterial({
      color: s.lightSquareColor,
      map: s.lightSquareTexture || null,
      roughness: 0.25,
      metalness: 0.1,
    });

    darkTileMat = new THREE.MeshStandardMaterial({
      color: s.darkSquareColor,
      map: s.darkSquareTexture || null,
      roughness: 0.35,
      metalness: 0.15,
    });

    frameMat = new THREE.MeshStandardMaterial({
      color: s.borderWoodColor,
      map: s.frameTexture || null,
      roughness: 0.4,
      metalness: 0.2,
    });

    inlayMat = new THREE.MeshStandardMaterial({
      color: s.frameAccentColor,
      roughness: 0.15,
      metalness: 0.9,
    });
  };

  createMaterials(skin);

  // 1. 64 Individual Board Squares
  // Square size: 1.0. Offset: -3.5 to +3.5
  const tileGeo = new THREE.BoxGeometry(0.98, 0.14, 0.98);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const squareName = `${files[f]}${r + 1}`;
      const isLight = (r + f) % 2 === 1;

      const tile = new THREE.Mesh(tileGeo, isLight ? lightTileMat : darkTileMat);
      // Position: x corresponds to files 0..7 -> -3.5..+3.5
      // z corresponds to ranks: rank 1 is +3.5 (White side), rank 8 is -3.5 (Black side)
      const x = f - 3.5;
      const z = 3.5 - r;
      tile.position.set(x, -0.07, z);
      tile.receiveShadow = true;
      tile.name = `square_${squareName}`;
      tile.userData = {
        square: squareName,
        isSquare: true,
        file: f,
        rank: r,
        isLight,
      };

      boardGroup.add(tile);
      squareMeshes.set(squareName, tile);
    }
  }

  // 2. Beveled Border Frame
  const frameGroup = new THREE.Group();
  frameGroup.name = 'FrameGroup';

  // Base platform block beneath squares
  const baseBlock = new THREE.Mesh(
    new THREE.BoxGeometry(9.4, 0.24, 9.4),
    frameMat
  );
  baseBlock.position.y = -0.19;
  baseBlock.receiveShadow = true;
  frameGroup.add(baseBlock);

  // Outer beveled bevel ring
  const frameRim = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 0.16, 9.8),
    frameMat
  );
  frameRim.position.y = -0.28;
  frameRim.receiveShadow = true;
  frameGroup.add(frameRim);

  // Metallic accent inlay line (raised slightly around 8x8 grid)
  const inlayThickness = 0.05;
  const inlayHeight = 0.015;
  const inlayDist = 4.02;

  // 4 accent strips
  const northInlay = new THREE.Mesh(
    new THREE.BoxGeometry(8.1, inlayHeight, inlayThickness),
    inlayMat
  );
  northInlay.position.set(0, 0.005, -inlayDist);
  frameGroup.add(northInlay);

  const southInlay = new THREE.Mesh(
    new THREE.BoxGeometry(8.1, inlayHeight, inlayThickness),
    inlayMat
  );
  southInlay.position.set(0, 0.005, inlayDist);
  frameGroup.add(southInlay);

  const westInlay = new THREE.Mesh(
    new THREE.BoxGeometry(inlayThickness, inlayHeight, 8.1),
    inlayMat
  );
  westInlay.position.set(-inlayDist, 0.005, 0);
  frameGroup.add(westInlay);

  const eastInlay = new THREE.Mesh(
    new THREE.BoxGeometry(inlayThickness, inlayHeight, 8.1),
    inlayMat
  );
  eastInlay.position.set(inlayDist, 0.005, 0);
  frameGroup.add(eastEastInlay(eastInlay));

  function eastEastInlay(mesh: THREE.Mesh) {
    return mesh;
  }

  // 3. Coordinate Notations (A-H and 1-8) along the frame
  const notationGroup = createNotationSprites(skin.frameAccentColor);
  frameGroup.add(notationGroup);

  // 4. Soft Contact Shadow Plane beneath the whole board
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = 256;
  contactCanvas.height = 256;
  const cctx = contactCanvas.getContext('2d')!;
  const grad = cctx.createRadialGradient(128, 128, 40, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, 256, 256);

  const contactTex = new THREE.CanvasTexture(contactCanvas);
  const groundShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 13),
    new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    })
  );
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.y = -0.37;
  frameGroup.add(groundShadow);

  boardGroup.add(frameGroup);

  const updateSkin = (newSkin: BoardSkin) => {
    createMaterials(newSkin);

    for (const [sq, mesh] of squareMeshes.entries()) {
      mesh.material = mesh.userData.isLight ? lightTileMat : darkTileMat;
    }

    baseBlock.material = frameMat;
    frameRim.material = frameMat;
    northInlay.material = inlayMat;
    southInlay.material = inlayMat;
    westInlay.material = inlayMat;
    eastInlay.material = inlayMat;
  };

  return {
    boardGroup,
    squareMeshes,
    updateSkin,
  };
}

/**
 * Generate crisp coordinate letters (A-H, 1-8) along the wood/marble frame edges
 */
function createNotationSprites(textColorHex: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'NotationsGroup';

  const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const makeLetterSprite = (text: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#' + textColorHex.toString(16).padStart(6, '0');
    ctx.font = 'bold 64px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.35, 0.35, 0.35);
    return sprite;
  };

  // Files along South and North borders
  for (let f = 0; f < 8; f++) {
    const x = f - 3.5;
    // South side
    const sSprite = makeLetterSprite(files[f]);
    sSprite.position.set(x, 0.02, 4.25);
    group.add(sSprite);

    // North side
    const nSprite = makeLetterSprite(files[f]);
    nSprite.position.set(x, 0.02, -4.25);
    group.add(nSprite);
  }

  // Ranks along West and East borders
  for (let r = 0; r < 8; r++) {
    const z = 3.5 - r;
    // West side
    const wSprite = makeLetterSprite(ranks[r]);
    wSprite.position.set(-4.25, 0.02, z);
    group.add(wSprite);

    // East side
    const eSprite = makeLetterSprite(ranks[r]);
    eSprite.position.set(4.25, 0.02, z);
    group.add(eSprite);
  }

  return group;
}
