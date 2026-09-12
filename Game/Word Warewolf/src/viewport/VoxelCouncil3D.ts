import * as THREE from 'three';

export class VoxelCouncil3D {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  public width: number = 320;
  public height: number = 200;

  private characters: THREE.Group[] = [];
  private flameCubes: THREE.Mesh[] = [];
  private embers: THREE.Mesh[] = [];
  private fireLight!: THREE.PointLight;
  private suspectMarkers: (THREE.Mesh | null)[] = [null, null, null, null];

  private clock: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private animId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Strict 320x200 low-resolution buffer
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060814);
    this.scene.fog = new THREE.FogExp2(0x060814, 0.035);

    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 6.8, 12.5);
    this.camera.lookAt(0, 0.8, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(1);

    this.buildVoxelScene();
    this.setupListeners();
    this.startLoop();
  }

  private buildVoxelScene() {
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    dirLight.position.set(6, 12, 8);
    this.scene.add(dirLight);

    this.fireLight = new THREE.PointLight(0xf59e0b, 3.8, 20, 1.5);
    this.fireLight.position.set(0, 1.2, 0);
    this.scene.add(this.fireLight);

    const redSuspicionLight = new THREE.PointLight(0xf43f5e, 1.6, 14);
    redSuspicionLight.position.set(-5, 3, -4);
    this.scene.add(redSuspicionLight);

    // Materials
    const darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x131728 });
    const stoneBorderMat = new THREE.MeshLambertMaterial({ color: 0x222b45 });
    const woodPlankMat = new THREE.MeshLambertMaterial({ color: 0x3d271d });
    const fireGlowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const fireCoreMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const councilRobes = [
      new THREE.MeshLambertMaterial({ color: 0x38bdf8 }), // Player 0 (You - Sky)
      new THREE.MeshLambertMaterial({ color: 0xf59e0b }), // Player 1 (Amber)
      new THREE.MeshLambertMaterial({ color: 0xa855f7 }), // Player 2 (Purple)
      new THREE.MeshLambertMaterial({ color: 0xf43f5e })  // Player 3 (Rose)
    ];
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xfcd34d });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });

    // Chamber Base Platform (Voxel Octagon)
    const floorGroup = new THREE.Group();
    const tileSize = 0.95;
    const gridRadius = 6;

    for (let x = -gridRadius; x <= gridRadius; x++) {
      for (let z = -gridRadius; z <= gridRadius; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist <= gridRadius) {
          const tileH = 0.4 + Math.sin(x * 1.5) * Math.cos(z * 1.5) * 0.08;
          const isRim = dist > gridRadius - 1.2;
          const tileGeo = new THREE.BoxGeometry(tileSize, tileH, tileSize);
          const tileMesh = new THREE.Mesh(tileGeo, isRim ? stoneBorderMat : darkStoneMat);
          tileMesh.position.set(x * tileSize, -tileH / 2, z * tileSize);
          floorGroup.add(tileMesh);
        }
      }
    }
    this.scene.add(floorGroup);

    // Campfire Center Ring & Logs
    const campfireGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), stoneBorderMat);
      stone.position.set(Math.cos(angle) * 0.9, 0.1, Math.sin(angle) * 0.9);
      stone.rotation.y = angle;
      campfireGroup.add(stone);
    }
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.22), woodPlankMat);
      log.rotation.y = (i * Math.PI) / 4;
      log.position.y = 0.15;
      campfireGroup.add(log);
    }

    // Dynamic Flickering Fire Voxels
    for (let i = 0; i < 14; i++) {
      const size = 0.15 + Math.random() * 0.2;
      const mat = Math.random() > 0.4 ? fireGlowMat : fireCoreMat;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
      cube.userData = {
        baseY: 0.3 + Math.random() * 0.8,
        speed: 1.5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        rad: 0.1 + Math.random() * 0.35
      };
      campfireGroup.add(cube);
      this.flameCubes.push(cube);
    }
    this.scene.add(campfireGroup);

    // 4 Voxel Council Members around Circle
    const playerDist = 3.6;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const px = Math.cos(angle) * playerDist;
      const pz = Math.sin(angle) * playerDist;

      const member = new THREE.Group();
      member.position.set(px, 0, pz);
      member.lookAt(0, 0.8, 0);

      // Throne Seat & Backrest
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.0), stoneBorderMat);
      seat.position.y = 0.35;
      member.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.25), stoneBorderMat);
      back.position.set(0, 1.1, -0.4);
      member.add(back);

      // Torso / Robe
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.5), councilRobes[i]);
      torso.position.set(0, 0.95, -0.05);
      member.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), skinMat);
      head.position.set(0, 1.55, -0.05);
      member.add(head);

      // Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.3, 0.54), councilRobes[i]);
      hood.position.set(0, 1.72, -0.05);
      member.add(hood);

      // Eyes
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
      eyeL.position.set(-0.13, 1.55, 0.2);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
      eyeR.position.set(0.13, 1.55, 0.2);
      member.add(eyeL);
      member.add(eyeR);

      // Floating Marker (Crystal above seat)
      const markerMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x38bdf8 : 0xf43f5e
      });
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), markerMat);
      marker.position.set(0, 2.3, 0);
      marker.visible = i === 0; // Initially visible only for player
      member.add(marker);
      this.suspectMarkers[i] = marker;

      this.scene.add(member);
      this.characters.push(member);
    }

    // Ambient floating embers
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    for (let i = 0; i < 30; i++) {
      const emb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), emberMat);
      emb.position.set((Math.random() - 0.5) * 8, Math.random() * 5, (Math.random() - 0.5) * 8);
      emb.userData = {
        vy: 0.015 + Math.random() * 0.02,
        seed: Math.random() * 10
      };
      this.scene.add(emb);
      this.embers.push(emb);
    }
  }

  private setupListeners() {
    window.addEventListener('mousemove', this.onMouseMove);
  }

  private onMouseMove = (e: MouseEvent) => {
    this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  public updateMarkers(activeSpeakerIndex: number, highestSuspicionId: number) {
    this.suspectMarkers.forEach((marker, idx) => {
      if (!marker) return;
      if (idx === 0) {
        // User beacon always on
        marker.visible = true;
      } else if (idx === highestSuspicionId) {
        // Prime suspect red marker
        marker.visible = true;
      } else if (idx === activeSpeakerIndex) {
        marker.visible = true;
      } else {
        marker.visible = false;
      }
    });
  }

  private startLoop() {
    const renderFrame = () => {
      if (this.isDestroyed) return;
      this.clock += 0.02;

      // Campfire flame flickering
      this.fireLight.intensity = 3.2 + Math.sin(this.clock * 8) * 0.8 + Math.cos(this.clock * 17) * 0.4;
      this.flameCubes.forEach((cube) => {
        const ud = cube.userData;
        cube.position.y = ud.baseY + Math.sin(this.clock * ud.speed + ud.phase) * 0.2;
        cube.position.x = Math.sin(this.clock * ud.speed * 0.5 + ud.phase) * ud.rad;
        cube.position.z = Math.cos(this.clock * ud.speed * 0.5 + ud.phase) * ud.rad;
        cube.rotation.y += 0.03;
        cube.rotation.x += 0.02;
      });

      // Embers rising
      this.embers.forEach((emb) => {
        emb.position.y += emb.userData.vy;
        emb.position.x += Math.sin(this.clock + emb.userData.seed) * 0.01;
        if (emb.position.y > 6.0) {
          emb.position.y = 0.2;
          emb.position.x = (Math.random() - 0.5) * 3;
          emb.position.z = (Math.random() - 0.5) * 3;
        }
      });

      // Subtle breathing bob for characters & spinning crystals
      this.characters.forEach((char, idx) => {
        const marker = this.suspectMarkers[idx];
        if (marker && marker.visible) {
          marker.rotation.y += 0.05;
          marker.position.y = 2.3 + Math.sin(this.clock * 4 + idx) * 0.08;
        }
      });

      // Orbital camera drift + mouse parallax
      const targetCamX = Math.sin(this.clock * 0.15) * 1.5 + this.mouseX * 1.8;
      const targetCamY = 6.8 - this.mouseY * 1.0;
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.04;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.04;
      this.camera.lookAt(0, 0.8, 0);

      this.renderer.render(this.scene, this.camera);
      this.animId = requestAnimationFrame(renderFrame);
    };

    this.animId = requestAnimationFrame(renderFrame);
  }

  public setSpeakerBob(speakerIdx: number) {
    this.characters.forEach((char, idx) => {
      if (idx === speakerIdx) {
        char.position.y = Math.sin(this.clock * 6) * 0.18;
      } else {
        char.position.y = 0;
      }
    });
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.dispose();
  }
}
