/**
 * AI Bot Controller with Multi-Tier Difficulty & Trajectory Prediction
 */

export class BotAI {
  constructor(difficulty = 'MEDIUM') {
    this.difficulty = difficulty;
    this.reactionTimer = 0;
    this.targetY = 250;
    this.errorOffset = 0;
    this.lastPredictionTime = 0;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  /**
   * Computes the vertical input vector for Paddle 2
   * @param {PongSimulationEngine} engine 
   * @param {number} currentTime
   * @returns {number} Input vector in range [-1, 1]
   */
  computeInput(engine, currentTime = performance.now()) {
    const config = this.getDifficultyConfig();

    // If ball is moving away from AI (to the left), return toward center gradually
    if (engine.ballVx <= 0) {
      const centerY = engine.height / 2;
      const dist = centerY - engine.p2Y;
      if (Math.abs(dist) < 15) return 0;
      return dist > 0 ? 0.4 : -0.4;
    }

    // Refresh trajectory prediction periodically based on reaction delay
    if (currentTime - this.lastPredictionTime > config.reactionDelayMs) {
      this.lastPredictionTime = currentTime;
      this.targetY = this.predictBallLanding(engine) + this.errorOffset;

      // Randomize error offset occasionally
      if (Math.random() < config.errorChance) {
        this.errorOffset = (Math.random() - 0.5) * config.maxErrorSpread;
      } else {
        this.errorOffset = (Math.random() - 0.5) * (config.maxErrorSpread * 0.2);
      }
    }

    // Move paddle toward predicted target
    const diff = this.targetY - engine.p2Y;
    const deadzone = config.deadzone;

    if (Math.abs(diff) <= deadzone) {
      return 0;
    }

    const direction = diff > 0 ? 1 : -1;
    // Scale tracking speed smoothly based on distance
    const speedFactor = Math.min(1.0, Math.abs(diff) / 40);
    return direction * speedFactor * config.speedMultiplier;
  }

  /**
   * Raycasts the ball forward to predict where it will reach Paddle 2 (paddle2X)
   */
  predictBallLanding(engine) {
    let simX = engine.ballX;
    let simY = engine.ballY;
    let simVx = engine.ballVx;
    let simVy = engine.ballVy;

    const targetX = engine.paddle2X;
    const radius = engine.ballRadius;
    const height = engine.height;

    // Simulate trajectory with wall bounces
    let maxSteps = 400;
    const dt = 0.5;

    while (simX < targetX && maxSteps > 0) {
      simX += simVx * dt;
      simY += simVy * dt;

      if (simY <= radius) {
        simY = radius;
        simVy = Math.abs(simVy);
      } else if (simY >= height - radius) {
        simY = height - radius;
        simVy = -Math.abs(simVy);
      }
      maxSteps--;
    }

    return Math.max(radius, Math.min(height - radius, simY));
  }

  getDifficultyConfig() {
    switch (this.difficulty) {
      case 'EASY':
        return {
          reactionDelayMs: 280,
          speedMultiplier: 0.55,
          deadzone: 20,
          errorChance: 0.45,
          maxErrorSpread: 70
        };
      case 'HARD':
        return {
          reactionDelayMs: 60,
          speedMultiplier: 0.95,
          deadzone: 6,
          errorChance: 0.1,
          maxErrorSpread: 20
        };
      case 'IMPOSSIBLE':
        return {
          reactionDelayMs: 0,
          speedMultiplier: 1.0,
          deadzone: 2,
          errorChance: 0.0,
          maxErrorSpread: 0
        };
      case 'MEDIUM':
      default:
        return {
          reactionDelayMs: 140,
          speedMultiplier: 0.75,
          deadzone: 12,
          errorChance: 0.25,
          maxErrorSpread: 45
        };
    }
  }
}
