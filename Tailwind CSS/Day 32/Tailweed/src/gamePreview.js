export class GamePreviewSimulator {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;

    // Viewport dimensions
    this.width = canvas.width = 320;
    this.height = canvas.height = 180;

    // Physics constants
    this.gravity = 0.5;
    this.friction = 0.82;
    this.jumpForce = -7.5;
    this.speed = 0.8;

    // Player character properties
    this.player = {
      x: 140,
      y: 50,
      vx: 0,
      vy: 0,
      width: 16, // In terms of tile cells
      height: 16,
      scale: 1.5, // Draw pixel size multiplier
      grounded: false,
      facingLeft: false,
      walkAnimTimer: 0,
      walkFrameIdx: 1
    };

    // Platforms in the level
    this.platforms = [
      // Floor
      { x: 0, y: 160, w: 320, h: 20, color: '#181829', borderColor: '#39ff14' },
      // Floating neon bars
      { x: 30, y: 110, w: 80, h: 6, color: '#151522', borderColor: '#00f0ff' },
      { x: 210, y: 110, w: 80, h: 6, color: '#151522', borderColor: '#00f0ff' },
      { x: 110, y: 75, w: 100, h: 6, color: '#151522', borderColor: '#ff007f' }
    ];

    // Background particles for depth (glowing cyber dust)
    this.stars = [];
    for (let i = 0; i < 20; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height - 30),
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.15 + 0.05
      });
    }

    // Keyboard state
    this.keys = {};
    this.initControls();

    // Start Loop
    this.active = true;
    this.loop();
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  stop() {
    this.active = false;
  }

  loop() {
    if (!this.active) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    const p = this.player;

    // Movement inputs
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      p.vx -= this.speed;
      p.facingLeft = true;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      p.vx += this.speed;
      p.facingLeft = false;
    }
    if ((this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']) && p.grounded) {
      p.vy = this.jumpForce;
      p.grounded = false;
    }

    // Physics logic
    p.vx *= this.friction;
    p.vy += this.gravity;

    // Update positions
    p.x += p.vx;
    p.y += p.vy;

    // Scale calculation
    // Match dimensions to state
    p.width = this.state.width;
    p.height = this.state.height;
    
    // Scale fitting inside standard player sizing (approx 24-32 pixels width max)
    p.scale = Math.max(1, Math.min(3, Math.floor(32 / p.width)));

    const pWidthReal = p.width * p.scale;
    const pHeightReal = p.height * p.scale;

    p.grounded = false;

    // Platform collisions
    for (const plat of this.platforms) {
      // Check horizontal collision overlap
      if (p.x + pWidthReal > plat.x && p.x < plat.x + plat.w) {
        // Landing collision (moving down onto platform)
        if (p.y + pHeightReal >= plat.y && p.y + pHeightReal - p.vy <= plat.y + 6) {
          p.y = plat.y - pHeightReal;
          p.vy = 0;
          p.grounded = true;
        }
      }
    }

    // Canvas boundary checks
    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
    }
    if (p.x + pWidthReal > this.width) {
      p.x = this.width - pWidthReal;
      p.vx = 0;
    }
    if (p.y < 0) {
      p.y = 0;
      p.vy = 0;
    }
    if (p.y + pHeightReal > this.height) {
      // Offscreen reset
      p.x = 140;
      p.y = 20;
      p.vx = 0;
      p.vy = 0;
    }

    // Walk animation timer logic
    if (Math.abs(p.vx) > 0.2 && p.grounded) {
      p.walkAnimTimer += Math.abs(p.vx) * 0.15;
      const numFrames = this.state.frames.length;
      if (numFrames > 1) {
        // Frame 0 is Idle. Frames 1 to N-1 are walking.
        const walkFrameCount = numFrames - 1;
        p.walkFrameIdx = 1 + (Math.floor(p.walkAnimTimer) % walkFrameCount);
      } else {
        p.walkFrameIdx = 0;
      }
    } else {
      p.walkFrameIdx = 0; // Idle
    }

    // Background stars parallax
    this.stars.forEach(s => {
      s.x -= s.speed + (p.vx * 0.05); // slight parallax feel
      if (s.x < 0) s.x = this.width;
      if (s.x > this.width) s.x = 0;
    });
  }

  draw() {
    // Clear screen with neon dark gradient
    this.ctx.fillStyle = '#07070f';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Grid details for background feel
    this.ctx.fillStyle = '#10101f';
    for (let x = 0; x < this.width; x += 40) {
      this.ctx.fillRect(x, 0, 1, this.height);
    }
    
    // Draw parallax stars
    this.ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
    this.stars.forEach(s => {
      this.ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Draw platforms
    for (const plat of this.platforms) {
      this.ctx.fillStyle = plat.color;
      this.ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      
      // Draw neon boundary stroke
      this.ctx.strokeStyle = plat.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    }

    // Render player sprite using active editor frame
    this.drawPlayer();
  }

  drawPlayer() {
    const p = this.player;
    const frames = this.state.frames;
    if (frames.length === 0) return;

    let activeFrame = frames[0]; // Fallback to frame 0 (Idle)
    
    if (!p.grounded) {
      // Jump Frame: Use the last frame in the list if there are multiple
      activeFrame = frames[frames.length - 1];
    } else if (Math.abs(p.vx) > 0.2) {
      // Walk Frame
      activeFrame = frames[p.walkFrameIdx] || frames[0];
    }

    const fw = this.state.width;
    const fh = this.state.height;
    
    // Draw layers for this frame
    this.state.layers.forEach(layer => {
      if (!layer.visible) return;
      const pixels = activeFrame.layersData[layer.id];
      if (!pixels) return;

      this.ctx.globalAlpha = layer.opacity;
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          const color = pixels[y * fw + x];
          if (color) {
            this.ctx.fillStyle = color;
            
            // Flip rendering horizontally if facing left
            const rx = p.facingLeft ? (fw - 1 - x) : x;
            const drawX = Math.round(p.x + rx * p.scale);
            const drawY = Math.round(p.y + y * p.scale);
            
            this.ctx.fillRect(drawX, drawY, p.scale, p.scale);
          }
        }
      }
    });
    this.ctx.globalAlpha = 1.0;
  }
}
