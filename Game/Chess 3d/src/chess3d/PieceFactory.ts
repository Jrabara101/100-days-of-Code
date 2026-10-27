import * as THREE from 'three';
import { BoardSkin } from './Skins';

export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

// Geometry caches to share across identical piece types
const geometryCache = new Map<string, THREE.BufferGeometry>();

function getCachedCylinder(
  rTop: number,
  rBottom: number,
  height: number,
  segments: number = 32
): THREE.CylinderGeometry {
  const key = `cyl_${rTop}_${rBottom}_${height}_${segments}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.CylinderGeometry(rTop, rBottom, height, segments));
  }
  return geometryCache.get(key) as THREE.CylinderGeometry;
}

function getCachedSphere(
  radius: number,
  wSeg: number = 24,
  hSeg: number = 20
): THREE.SphereGeometry {
  const key = `sph_${radius}_${wSeg}_${hSeg}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.SphereGeometry(radius, wSeg, hSeg));
  }
  return geometryCache.get(key) as THREE.SphereGeometry;
}

function getCachedTorus(
  r: number,
  tube: number,
  radialSeg: number = 16,
  tubularSeg: number = 32
): THREE.TorusGeometry {
  const key = `tor_${r}_${tube}_${radialSeg}_${tubularSeg}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.TorusGeometry(r, tube, radialSeg, tubularSeg));
  }
  return geometryCache.get(key) as THREE.TorusGeometry;
}

function getCachedBox(
  w: number,
  h: number,
  d: number
): THREE.BoxGeometry {
  const key = `box_${w}_${h}_${d}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.BoxGeometry(w, h, d));
  }
  return geometryCache.get(key) as THREE.BoxGeometry;
}

function getCachedCone(
  r: number,
  h: number,
  seg: number = 20
): THREE.ConeGeometry {
  const key = `cone_${r}_${h}_${seg}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.ConeGeometry(r, h, seg));
  }
  return geometryCache.get(key) as THREE.ConeGeometry;
}

export class PieceFactory {
  private whiteBodyMat!: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
  private whiteAccentMat!: THREE.MeshStandardMaterial;
  private blackBodyMat!: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
  private blackAccentMat!: THREE.MeshStandardMaterial;
  private contactShadowMat!: THREE.MeshBasicMaterial;

  constructor(skin: BoardSkin) {
    this.updateMaterials(skin);
    this.contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
  }

  public updateMaterials(skin: BoardSkin) {
    // White Piece Material
    if (skin.whitePiece.transmission) {
      this.whiteBodyMat = new THREE.MeshPhysicalMaterial({
        color: skin.whitePiece.color,
        roughness: skin.whitePiece.roughness,
        metalness: skin.whitePiece.metalness,
        transmission: skin.whitePiece.transmission,
        ior: skin.whitePiece.ior ?? 1.5,
        clearcoat: skin.whitePiece.clearcoat ?? 0.8,
        clearcoatRoughness: 0.1,
      });
    } else {
      this.whiteBodyMat = new THREE.MeshStandardMaterial({
        color: skin.whitePiece.color,
        roughness: skin.whitePiece.roughness,
        metalness: skin.whitePiece.metalness,
        emissive: skin.whitePiece.emissive ?? 0x000000,
        emissiveIntensity: skin.whitePiece.emissiveIntensity ?? 0,
      });
    }

    this.whiteAccentMat = new THREE.MeshStandardMaterial({
      color: skin.whitePiece.accentColor,
      roughness: Math.max(0.05, skin.whitePiece.roughness - 0.25),
      metalness: 0.92,
    });

    // Black Piece Material
    if (skin.blackPiece.transmission) {
      this.blackBodyMat = new THREE.MeshPhysicalMaterial({
        color: skin.blackPiece.color,
        roughness: skin.blackPiece.roughness,
        metalness: skin.blackPiece.metalness,
        transmission: skin.blackPiece.transmission,
        ior: skin.blackPiece.ior ?? 1.5,
        clearcoat: skin.blackPiece.clearcoat ?? 0.8,
        clearcoatRoughness: 0.1,
      });
    } else {
      this.blackBodyMat = new THREE.MeshStandardMaterial({
        color: skin.blackPiece.color,
        roughness: skin.blackPiece.roughness,
        metalness: skin.blackPiece.metalness,
        emissive: skin.blackPiece.emissive ?? 0x000000,
        emissiveIntensity: skin.blackPiece.emissiveIntensity ?? 0,
      });
    }

    this.blackAccentMat = new THREE.MeshStandardMaterial({
      color: skin.blackPiece.accentColor,
      roughness: Math.max(0.05, skin.blackPiece.roughness - 0.25),
      metalness: 0.9,
    });
  }

  public createPiece(type: PieceType, color: PieceColor, square: string): THREE.Group {
    const group = new THREE.Group();
    group.name = `${color}_${type}_${square}`;
    group.userData = {
      type,
      color,
      square,
      isPiece: true,
      originalY: 0,
    };

    const bodyMat = color === 'w' ? this.whiteBodyMat : this.blackBodyMat;
    const accentMat = color === 'w' ? this.whiteAccentMat : this.blackAccentMat;

    switch (type) {
      case 'p':
        this.buildPawn(group, bodyMat, accentMat);
        break;
      case 'r':
        this.buildRook(group, bodyMat, accentMat);
        break;
      case 'n':
        this.buildKnight(group, bodyMat, accentMat, color);
        break;
      case 'b':
        this.buildBishop(group, bodyMat, accentMat);
        break;
      case 'q':
        this.buildQueen(group, bodyMat, accentMat);
        break;
      case 'k':
        this.buildKing(group, bodyMat, accentMat);
        break;
    }

    // Add soft contact shadow under piece base flush with ground
    const shadowGeo = getCachedCylinder(0.38, 0.42, 0.002, 24);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.contactShadowMat);
    shadowMesh.position.y = 0.001;
    group.add(shadowMesh);

    // Enable shadow casting for piece parts
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child !== shadowMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }

  /**
   * PAWN: 4-part composite model
   * Base ring + Tapered waist stem + Accent collar bead + Spherical finial
   */
  private buildPawn(
    group: THREE.Group,
    bodyMat: THREE.Material,
    accentMat: THREE.Material
  ) {
    // 1. Base pedestal
    const base = new THREE.Mesh(getCachedCylinder(0.32, 0.36, 0.12, 32), bodyMat);
    base.position.y = 0.06;
    group.add(base);

    // 2. Tapered stem column
    const stem = new THREE.Mesh(getCachedCylinder(0.18, 0.28, 0.45, 32), bodyMat);
    stem.position.y = 0.345;
    group.add(stem);

    // 3. Accent metallic collar ring
    const collar = new THREE.Mesh(getCachedTorus(0.2, 0.045, 16, 32), accentMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.58;
    group.add(collar);

    // 4. Spherical head
    const head = new THREE.Mesh(getCachedSphere(0.21, 24, 20), bodyMat);
    head.position.y = 0.76;
    group.add(head);
  }

  /**
   * ROOK: 6-part composite model
   * Stepped base + Tapered masonry tower + Flared cornice shelf + Castellated parapet ring + Recessed top + Gold accent ring
   */
  private buildRook(
    group: THREE.Group,
    bodyMat: THREE.Material,
    accentMat: THREE.Material
  ) {
    // 1. Base
    const base1 = new THREE.Mesh(getCachedCylinder(0.35, 0.38, 0.14, 32), bodyMat);
    base1.position.y = 0.07;
    group.add(base1);

    // 2. Base accent band
    const band = new THREE.Mesh(getCachedTorus(0.32, 0.03, 16, 32), accentMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.15;
    group.add(band);

    // 3. Tapered tower trunk
    const tower = new THREE.Mesh(getCachedCylinder(0.26, 0.32, 0.65, 32), bodyMat);
    tower.position.y = 0.48;
    group.add(tower);

    // 4. Flared cornice capital
    const cornice = new THREE.Mesh(getCachedCylinder(0.36, 0.26, 0.15, 32), bodyMat);
    cornice.position.y = 0.88;
    group.add(cornice);

    // 5. Parapet battlements (4 crenellations)
    const crenelations = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const cren = new THREE.Mesh(getCachedBox(0.14, 0.16, 0.12), bodyMat);
      cren.position.set(Math.cos(angle) * 0.26, 1.02, Math.sin(angle) * 0.26);
      cren.rotation.y = -angle;
      crenelations.add(cren);
    }
    group.add(crenelations);

    // 6. Recessed center floor
    const centerFloor = new THREE.Mesh(getCachedCylinder(0.24, 0.24, 0.05, 24), accentMat);
    centerFloor.position.y = 0.94;
    group.add(centerFloor);
  }

  /**
   * KNIGHT: 7-part composite model
   * Heavy pedestal + Neck transition + Equine arched neck + Carved muzzle + Mane ridge + Twin ears + Accent bridle collar
   */
  private buildKnight(
    group: THREE.Group,
    bodyMat: THREE.Material,
    accentMat: THREE.Material,
    color: PieceColor
  ) {
    // 1. Base pedestal
    const base = new THREE.Mesh(getCachedCylinder(0.34, 0.38, 0.14, 32), bodyMat);
    base.position.y = 0.07;
    group.add(base);

    // 2. Base accent ring
    const ring = new THREE.Mesh(getCachedTorus(0.32, 0.035, 16, 32), accentMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.15;
    group.add(ring);

    // Knight head assembly (oriented to face opponent)
    const knightHead = new THREE.Group();

    // 3. Arched equine neck (tapered cylinder angled forward)
    const neck = new THREE.Mesh(getCachedCylinder(0.2, 0.27, 0.6, 24), bodyMat);
    neck.position.set(0, 0.44, -0.06);
    neck.rotation.x = -0.35;
    knightHead.add(neck);

    // 4. Carved head / muzzle
    const muzzle = new THREE.Mesh(getCachedBox(0.26, 0.3, 0.42), bodyMat);
    muzzle.position.set(0, 0.72, 0.12);
    muzzle.rotation.x = 0.22;
    knightHead.add(muzzle);

    // 5. Stepped mane ridge along back of neck
    const mane = new THREE.Mesh(getCachedBox(0.08, 0.5, 0.18), accentMat);
    mane.position.set(0, 0.52, -0.2);
    mane.rotation.x = -0.35;
    knightHead.add(mane);

    // 6. Left & Right pricked ears
    const earL = new THREE.Mesh(getCachedCone(0.05, 0.14, 12), bodyMat);
    earL.position.set(0.08, 0.92, -0.04);
    earL.rotation.z = -0.2;
    knightHead.add(earL);

    const earR = new THREE.Mesh(getCachedCone(0.05, 0.14, 12), bodyMat);
    earR.position.set(-0.08, 0.92, -0.04);
    earR.rotation.z = 0.2;
    knightHead.add(earR);

    // 7. Equine jaw / chin accent
    const chin = new THREE.Mesh(getCachedSphere(0.12, 16, 14), bodyMat);
    chin.position.set(0, 0.62, 0.18);
    knightHead.add(chin);

    // Face White toward Black (+Z), and Black toward White (-Z)
    if (color === 'b') {
      knightHead.rotation.y = Math.PI;
    }
    group.add(knightHead);
  }

  /**
   * BISHOP: 6-part composite model
   * Stepped pedestal + Slender waist column + Mid-waist torus + Mitre head + Mitre finial sphere + Accent cut/ring
   */
  private buildBishop(
    group: THREE.Group,
    bodyMat: THREE.Material,
    accentMat: THREE.Material
  ) {
    // 1. Base pedestal
    const base = new THREE.Mesh(getCachedCylinder(0.33, 0.38, 0.14, 32), bodyMat);
    base.position.y = 0.07;
    group.add(base);

    // 2. Lower accent torus
    const ring1 = new THREE.Mesh(getCachedTorus(0.3, 0.035, 16, 32), accentMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.15;
    group.add(ring1);

    // 3. Graceful tapering stem
    const stem = new THREE.Mesh(getCachedCylinder(0.18, 0.28, 0.55, 32), bodyMat);
    stem.position.y = 0.44;
    group.add(stem);

    // 4. Waist ornamental collar bead
    const waistBead = new THREE.Mesh(getCachedTorus(0.21, 0.04, 16, 32), accentMat);
    waistBead.rotation.x = Math.PI / 2;
    waistBead.position.y = 0.72;
    group.add(waistBead);

    // 5. Oval Mitre head
    const mitre = new THREE.Mesh(getCachedSphere(0.24, 28, 24), bodyMat);
    mitre.scale.set(1, 1.45, 1);
    mitre.position.y = 1.05;
    group.add(mitre);

    // 6. Mitre apex finial pearl
    const finial = new THREE.Mesh(getCachedSphere(0.08, 16, 16), accentMat);
    finial.position.y = 1.42;
    group.add(finial);
  }

  /**
   * QUEEN: 8-part composite model
   * Wide pedestal + Concave fluted column + Regal collar + Flared coronet goblet + Coronet pearls (8) + Summit orb + Accent belts
   */
  private buildQueen(
    group: THREE.Group,
    bodyMat: THREE.Material,
    accentMat: THREE.Material
  ) {
    // 1. Broad regal base
    const base = new THREE.Mesh(getCachedCylinder(0.36, 0.41, 0.15, 32), bodyMat);
    base.position.y = 0.075;
    group.add(base);

    // 2. Base accent band
    const baseBand = new THREE.Mesh(getCachedTorus(0.34, 0.04, 16, 32), accentMat);
    baseBand.rotation.x = Math.PI / 2;
    baseBand.position.y = 0.16;
    group.add(baseBand);

    // 3. Fluted royal column
    const column = new THREE.Mesh(getCachedCylinder(0.2, 0.32, 0.72, 32), bodyMat);
    column.position.y = 0.54;
    group.add(column);

    // 4. Royal waist band
    const waist = new THREE.Mesh(getCachedTorus(0.24, 0.045, 16, 32), accentMat);
    waist.rotation.x = Math.PI / 2;
    waist.position.y = 0.92;
    group.add(waist);

    // 5. Flared coronet chalice
    const chalice = new THREE.Mesh(getCachedCylinder(0.34, 0.22, 0.38, 32), bodyMat);
    chalice.position.y = 1.12;
    group.add(chalice);

    // 6. Coronet micro-pearl rim (8 golden pearls)
    const pearlRing = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const pearl = new THREE.Mesh(getCachedSphere(0.04, 12, 10), accentMat);
      pearl.position.set(Math.cos(angle) * 0.33, 1.32, Math.sin(angle) * 0.33);
      pearlRing.add(pearl);
    }
    group.add(pearlRing);

    // 7. Summit pearl orb
    const summitOrb = new THREE.Mesh(getCachedSphere(0.12, 20, 18), accentMat);
    summitOrb.position.y = 1.38;
    group.add(summitOrb);
  }

  /**
   * KING: 8-part composite model
   * Wide sovereign base + Imperial collar + Fluted royal column + Upper neck tier + Imperial dome + Cross shaft + Cross horizontal bar + Crown jewel
   */
  private buildKing(
    group: THREE.Group,
    bodyMat: THREE.Material,
    accentMat: THREE.Material
  ) {
    // 1. Base
    const base = new THREE.Mesh(getCachedCylinder(0.38, 0.43, 0.16, 32), bodyMat);
    base.position.y = 0.08;
    group.add(base);

    // 2. Base gold band
    const baseBand = new THREE.Mesh(getCachedTorus(0.36, 0.045, 16, 32), accentMat);
    baseBand.rotation.x = Math.PI / 2;
    baseBand.position.y = 0.17;
    group.add(baseBand);

    // 3. Dignified fluted column
    const column = new THREE.Mesh(getCachedCylinder(0.23, 0.34, 0.82, 32), bodyMat);
    column.position.y = 0.6;
    group.add(column);

    // 4. Dual royal neck tier
    const neck1 = new THREE.Mesh(getCachedTorus(0.28, 0.045, 16, 32), accentMat);
    neck1.rotation.x = Math.PI / 2;
    neck1.position.y = 1.02;
    group.add(neck1);

    // 5. Imperial coronet dome
    const dome = new THREE.Mesh(getCachedCylinder(0.34, 0.26, 0.36, 32), bodyMat);
    dome.position.y = 1.22;
    group.add(dome);

    // 6. Cross Finial - Vertical Pillar
    const crossVertical = new THREE.Mesh(getCachedBox(0.065, 0.32, 0.065), accentMat);
    crossVertical.position.y = 1.54;
    group.add(crossVertical);

    // 7. Cross Finial - Horizontal Crossbar
    const crossBar = new THREE.Mesh(getCachedBox(0.22, 0.065, 0.065), accentMat);
    crossBar.position.y = 1.58;
    group.add(crossBar);

    // 8. Crown center jewel
    const jewel = new THREE.Mesh(getCachedSphere(0.05, 14, 12), accentMat);
    jewel.position.y = 1.41;
    group.add(jewel);
  }
}
