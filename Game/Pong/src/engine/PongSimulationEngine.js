/**
 * Headless Authoritative Pong Physics Simulation Engine
 * 
 * Features:
 * - Sub-Stepped Continuous Collision Detection (CCD) to prevent high-speed tunneling
 * - Continuous Angular Deflection based on paddle impact offset
 * - Velocity scaling per return with speed capping
 * - Particle spark emitter and ball motion trails
 * - Discrete event callbacks for audio / screen shake triggers
 */

export class PongSimulationEngine {
  constructor(width = 800, height = 500, options = {}) {
    this.width = width;
    this.height = height;

    // Paddle Parameters
    this.paddleWidth = 14;
    this.paddleHeight = 80;
    this.paddleSpeed = 7.0;
    this.paddle1X = 32;
    this.paddle2X = width - 32;

    // Ball Parameters
    this.ballRadius = 7;
    this.baseSpeed = options.baseSpeed || 5.5;
    this.maxSpeed = options.maxSpeed || 16.0;
    this.speedMultiplier = 1.05;
    this.scoreLimit = options.scoreLimit || 11;

    // Ball State
    this.ballX = width / 2;
    this.ballY = height / 2;
    this.ballVx = this.baseSpeed;
    this.ballVy = 0;
    this.currentSpeed = this.baseSpeed;

    // Paddle Y Centers
    this.p1Y = height / 2;
    this.p2Y = height / 2;

    // Scores & Match State
    this.score1 = 0;
    this.score2 = 0;
    this.winner = null; // 1 | 2 | null
    this.state = 'READY'; // 'READY' | 'PLAYING' | 'POINT_PAUSE' | 'GAME_OVER'
    this.pointPauseTimer = 0;

    // Visual Enhancements
    this.particles = [];
    this.trail = [];
    this.maxTrailLength = 10;
    this.rallyCount = 0;

    // Event hooks
    this.onEvent = options.onEvent || (() => {});

    this.resetBall(1);
  }

  setScoreLimit(limit) {
    this.scoreLimit = limit;
  }

  setSpeed(base) {
    this.baseSpeed = base;
  }

  resetGame() {
    this.score1 = 0;
    this.score2 = 0;
    this.winner = null;
    this.state = 'PLAYING';
    this.rallyCount = 0;
    this.particles = [];
    this.trail = [];
    this.p1Y = this.height / 2;
    this.p2Y = this.height / 2;
    this.resetBall(Math.random() > 0.5 ? 1 : 2);
  }

  resetBall(scoringPlayer) {
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.currentSpeed = this.baseSpeed;
    this.rallyCount = 0;

    // Launch angle between -35 deg and +35 deg
    const angle = (Math.random() * 0.7 - 0.35) * Math.PI;
    const direction = scoringPlayer === 1 ? -1 : 1;

    this.ballVx = Math.cos(angle) * this.baseSpeed * direction;
    this.ballVy = Math.sin(angle) * this.baseSpeed;
    this.trail = [];
  }

  createImpactSparks(x, y, color = '#38bdf8', count = 14, speed = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.025,
        size: Math.random() * 2.5 + 1.5,
        color
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96; // air resistance
      p.vy *= 0.96;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateTrail() {
    this.trail.unshift({ x: this.ballX, y: this.ballY, speed: this.currentSpeed });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }
  }

  /**
   * Authoritative Physics Step (Sub-stepping Continuous Collision Detection)
   * @param {number} p1Input - Vertical input for Paddle 1 (-1 to +1)
   * @param {number} p2Input - Vertical input for Paddle 2 (-1 to +1)
   */
  stepAuthoritative(p1Input, p2Input) {
    // 1. Handle Point Pause Delay after goal
    if (this.state === 'POINT_PAUSE') {
      this.pointPauseTimer -= 1 / 60;
      if (this.pointPauseTimer <= 0) {
        if (this.score1 >= this.scoreLimit) {
          this.state = 'GAME_OVER';
          this.winner = 1;
          this.onEvent('GAME_OVER', { winner: 1, score1: this.score1, score2: this.score2 });
        } else if (this.score2 >= this.scoreLimit) {
          this.state = 'GAME_OVER';
          this.winner = 2;
          this.onEvent('GAME_OVER', { winner: 2, score1: this.score1, score2: this.score2 });
        } else {
          this.state = 'PLAYING';
        }
      }
      this.updateParticles();
      return;
    }

    if (this.state === 'GAME_OVER') {
      this.updateParticles();
      return;
    }

    // 2. Integrate Paddle Positions with boundary clamping
    const halfH = this.paddleHeight / 2;
    this.p1Y = Math.max(halfH, Math.min(this.height - halfH, this.p1Y + p1Input * this.paddleSpeed));
    this.p2Y = Math.max(halfH, Math.min(this.height - halfH, this.p2Y + p2Input * this.paddleSpeed));

    // 3. Sub-stepping Continuous Collision Detection for Ball (4 sub-steps)
    const subSteps = 4;
    const dtSub = 1.0 / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.ballX += this.ballVx * dtSub;
      this.ballY += this.ballVy * dtSub;

      // Wall Collisions (Top & Bottom)
      if (this.ballY <= this.ballRadius) {
        this.ballY = this.ballRadius;
        this.ballVy = Math.abs(this.ballVy);
        this.createImpactSparks(this.ballX, this.ballY, '#94a3b8', 8, 4);
        this.onEvent('WALL_HIT', { x: this.ballX, y: this.ballY });
      } else if (this.ballY >= this.height - this.ballRadius) {
        this.ballY = this.height - this.ballRadius;
        this.ballVy = -Math.abs(this.ballVy);
        this.createImpactSparks(this.ballX, this.ballY, '#94a3b8', 8, 4);
        this.onEvent('WALL_HIT', { x: this.ballX, y: this.ballY });
      }

      // Paddle 1 Collision (Left Player)
      const p1HalfW = this.paddleWidth / 2;
      if (
        this.ballVx < 0 &&
        this.ballX - this.ballRadius <= this.paddle1X + p1HalfW &&
        this.ballX + this.ballRadius >= this.paddle1X - p1HalfW &&
        Math.abs(this.ballY - this.p1Y) <= halfH + this.ballRadius
      ) {
        // Continuous Angular Deflection: normalized offset [-1.0, 1.0]
        const normOffset = Math.max(-1.0, Math.min(1.0, (this.ballY - this.p1Y) / halfH));
        const maxAngle = 0.87; // ~50 degrees in radians
        this.currentSpeed = Math.min(this.maxSpeed, Math.hypot(this.ballVx, this.ballVy) * this.speedMultiplier);
        this.rallyCount++;

        this.ballVx = Math.cos(normOffset * maxAngle) * this.currentSpeed;
        this.ballVy = Math.sin(normOffset * maxAngle) * this.currentSpeed;
        this.ballX = this.paddle1X + p1HalfW + this.ballRadius;

        this.createImpactSparks(this.ballX, this.ballY, '#38bdf8', 16, 7);
        this.onEvent('PADDLE_HIT', { player: 1, offset: normOffset, speed: this.currentSpeed, x: this.ballX, y: this.ballY });
      }

      // Paddle 2 Collision (Right Player)
      const p2HalfW = this.paddleWidth / 2;
      if (
        this.ballVx > 0 &&
        this.ballX + this.ballRadius >= this.paddle2X - p2HalfW &&
        this.ballX - this.ballRadius <= this.paddle2X + p2HalfW &&
        Math.abs(this.ballY - this.p2Y) <= halfH + this.ballRadius
      ) {
        const normOffset = Math.max(-1.0, Math.min(1.0, (this.ballY - this.p2Y) / halfH));
        const maxAngle = 0.87;
        this.currentSpeed = Math.min(this.maxSpeed, Math.hypot(this.ballVx, this.ballVy) * this.speedMultiplier);
        this.rallyCount++;

        this.ballVx = -Math.cos(normOffset * maxAngle) * this.currentSpeed;
        this.ballVy = Math.sin(normOffset * maxAngle) * this.currentSpeed;
        this.ballX = this.paddle2X - p2HalfW - this.ballRadius;

        this.createImpactSparks(this.ballX, this.ballY, '#f43f5e', 16, 7);
        this.onEvent('PADDLE_HIT', { player: 2, offset: normOffset, speed: this.currentSpeed, x: this.ballX, y: this.ballY });
      }

      // Goal Conditions
      if (this.ballX < -15) {
        this.score2++;
        this.createImpactSparks(10, this.ballY, '#f43f5e', 30, 9);
        this.state = 'POINT_PAUSE';
        this.pointPauseTimer = 0.8; // pause for 800ms
        this.resetBall(2);
        this.onEvent('SCORE', { scoringPlayer: 2, score1: this.score1, score2: this.score2 });
        break;
      } else if (this.ballX > this.width + 15) {
        this.score1++;
        this.createImpactSparks(this.width - 10, this.ballY, '#38bdf8', 30, 9);
        this.state = 'POINT_PAUSE';
        this.pointPauseTimer = 0.8;
        this.resetBall(1);
        this.onEvent('SCORE', { scoringPlayer: 1, score1: this.score1, score2: this.score2 });
        break;
      }
    }

    this.updateTrail();
    this.updateParticles();
  }
}
