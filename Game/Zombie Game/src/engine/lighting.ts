import { FloodlightEntity } from '../types/game';

export interface PlayerLightSource {
  x: number;
  y: number;
  angle: number;
  isFiring?: boolean;
}

export function isPointInFlashlight(
  px: number,
  py: number,
  player: PlayerLightSource,
  coneAngleRad = 0.95, // ~55 degrees
  coneDistance = 460,
  playerAmbientRadius = 65
): boolean {
  const dx = px - player.x;
  const dy = py - player.y;
  const distSq = dx * dx + dy * dy;

  // Immediate 360 player perimeter
  if (distSq <= playerAmbientRadius * playerAmbientRadius) {
    return true;
  }

  // Maximum range check
  if (distSq > coneDistance * coneDistance) {
    return false;
  }

  // Angular check
  const angleToPoint = Math.atan2(dy, dx);
  let angleDiff = angleToPoint - player.angle;

  // Normalize angle between -PI and PI
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  return Math.abs(angleDiff) <= coneAngleRad / 2;
}

export function isPointIlluminated(
  x: number,
  y: number,
  player: PlayerLightSource,
  floodlights: FloodlightEntity[],
  isBlackout: boolean
): boolean {
  // Check player flashlight cone or close perimeter
  if (isPointInFlashlight(x, y, player)) {
    return true;
  }

  // Check active deployed floodlights
  for (const fl of floodlights) {
    if (fl.active) {
      const dx = x - fl.x;
      const dy = y - fl.y;
      if (dx * dx + dy * dy <= fl.radius * fl.radius) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Renders the 2D raycasted darkness mask and cutouts to the canvas
 */
export function renderLightingMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  player: PlayerLightSource,
  floodlights: FloodlightEntity[],
  isBlackout: boolean,
  muzzleFlashTimer: number
) {
  ctx.save();

  // Draw full-screen darkness
  ctx.fillStyle = isBlackout ? 'rgba(5, 7, 8, 0.96)' : 'rgba(7, 10, 11, 0.78)';
  ctx.fillRect(0, 0, width, height);

  // Now cut out light areas using 'destination-out'
  ctx.globalCompositeOperation = 'destination-out';

  // 1. Player close ambient halo
  const haloRadius = player.isFiring || muzzleFlashTimer > 0 ? 140 : 70;
  const haloGrad = ctx.createRadialGradient(
    player.x,
    player.y,
    0,
    player.x,
    player.y,
    haloRadius
  );
  haloGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
  haloGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.8)');
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Player directional Flashlight Cone
  const coneDist = 480;
  const halfAngle = 0.48; // ~27.5 degrees each side (~55 deg total)

  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.arc(
    player.x,
    player.y,
    coneDist,
    player.angle - halfAngle,
    player.angle + halfAngle
  );
  ctx.closePath();

  const coneGrad = ctx.createRadialGradient(
    player.x,
    player.y,
    10,
    player.x,
    player.y,
    coneDist
  );
  coneGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
  coneGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
  coneGrad.addColorStop(0.95, 'rgba(0, 0, 0, 0.4)');
  coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = coneGrad;
  ctx.fill();

  // 3. Halogen Floodlights
  for (const fl of floodlights) {
    if (fl.active) {
      const flGrad = ctx.createRadialGradient(
        fl.x,
        fl.y,
        0,
        fl.x,
        fl.y,
        fl.radius
      );
      flGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      flGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      flGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = flGrad;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, fl.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
