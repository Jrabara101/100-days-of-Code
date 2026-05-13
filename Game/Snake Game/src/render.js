import { GRID, CELL, BOARD_PX, FOOD_TYPES, lerp, easeOut } from './core.js';

// Canvas renderer for Snake CRT
export function renderBoard(ctx, opts) {
  const { state, theme, phase, interp, particles, trail, toasts, shake, flash, crtIntensity, showTrail, wrapWalls, obstaclesOn } = opts;
  const now = performance.now();
  const W = BOARD_PX, H = BOARD_PX;

  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = theme.bgGrid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < GRID; i++) {
    ctx.moveTo(i * CELL + 0.5, 0);
    ctx.lineTo(i * CELL + 0.5, H);
    ctx.moveTo(0, i * CELL + 0.5);
    ctx.lineTo(W, i * CELL + 0.5);
  }
  ctx.stroke();

  // Border tick marks
  ctx.fillStyle = theme.textDim;
  ctx.font = '8px "VT323", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${GRID}×${GRID}`, 6, 12);

  // Trail
  if (showTrail) {
    for (const tr of trail) {
      const age = (now - tr.born) / 600;
      if (age >= 1) continue;
      const alpha = (1 - age) * 0.4;
      ctx.fillStyle = withAlpha(theme.snakeGlow, alpha);
      const sz = CELL * (1 - age * 0.5);
      ctx.fillRect(tr.x * CELL + (CELL - sz) / 2, tr.y * CELL + (CELL - sz) / 2, sz, sz);
    }
  }

  // Obstacles
  if (obstaclesOn) {
    for (const o of state.obstacles) {
      drawObstacle(ctx, o.x, o.y, theme);
    }
  }

  // Food
  drawFood(ctx, state.food, theme, now);
  if (state.specialFood) drawSpecialFood(ctx, state.specialFood, theme, now);

  // Interpolation factor
  const t = interp.prevSnake
    ? Math.min(1, (now - interp.lastMoveAt) / interp.tickInterval)
    : 1;
  const eased = easeOut(t);

  // Snake
  drawSnake(ctx, state.snake, interp.prevSnake, eased, theme, wrapWalls, state.direction);

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Floating toasts
  for (const tt of toasts) {
    const age = (now - tt.born) / tt.life;
    if (age >= 1) continue;
    const alpha = age > 0.7 ? (1 - age) / 0.3 : 1;
    const yOff = -age * 30;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = tt.color;
    ctx.font = 'bold 14px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = tt.color;
    ctx.shadowBlur = 6;
    ctx.fillText(tt.text, tt.x, tt.y + yOff);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Flash overlay
  if (flash > 0.01) {
    ctx.fillStyle = withAlpha(theme.accent, flash * 0.4);
    ctx.fillRect(0, 0, W, H);
  }

  // Edge indicators when wrap is on
  if (wrapWalls && phase === 'playing') {
    drawWrapEdges(ctx, state.snake[0], state.direction, theme);
  }

  // Border glow
  ctx.strokeStyle = withAlpha(theme.accent, 0.5);
  ctx.lineWidth = 2;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 12;
  ctx.strokeRect(1, 1, W - 2, H - 2);
  ctx.shadowBlur = 0;
}

function drawSnake(ctx, snake, prevSnake, t, theme, wrap, dir) {
  const len = snake.length;
  // Body segments
  for (let i = len - 1; i >= 0; i--) {
    const cur = snake[i];
    const prev = prevSnake && prevSnake[i] ? prevSnake[i] : (prevSnake && prevSnake[i - 1] ? prevSnake[i - 1] : cur);
    // Handle wrap: if distance > 1, snap
    let dx = cur.x - prev.x;
    let dy = cur.y - prev.y;
    if (Math.abs(dx) > 1) dx = 0;
    if (Math.abs(dy) > 1) dy = 0;
    const px = prev.x + dx;
    const py = prev.y + dy;
    const ix = lerp(px, cur.x, t);
    const iy = lerp(py, cur.y, t);
    const isHead = i === 0;
    const isTail = i === len - 1;
    const x = ix * CELL;
    const y = iy * CELL;

    // Outer glow
    const glow = isHead ? 18 : 6;
    ctx.shadowColor = isHead ? theme.snakeHead : theme.snakeGlow;
    ctx.shadowBlur = glow;
    ctx.fillStyle = isHead ? theme.snakeHead : theme.snakeBody;
    // Body shape — pixely rounded rect
    const pad = isHead ? 1 : 2;
    roundRect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 5 : 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Highlight stripe on body
    if (!isHead) {
      ctx.fillStyle = withAlpha('#ffffff', 0.18);
      ctx.fillRect(x + 4, y + 4, CELL - 8, 2);
    }

    // Eyes on head
    if (isHead) {
      ctx.fillStyle = theme.bg;
      const cx = x + CELL / 2;
      const cy = y + CELL / 2;
      const eyeOff = 4;
      const ex1 = cx + dir.dy * eyeOff - dir.dx * 2;
      const ey1 = cy + dir.dx * eyeOff - dir.dy * 2;
      const ex2 = cx - dir.dy * eyeOff - dir.dx * 2;
      const ey2 = cy - dir.dx * eyeOff - dir.dy * 2;
      ctx.beginPath();
      ctx.arc(ex1, ey1, 2.4, 0, Math.PI * 2);
      ctx.arc(ex2, ey2, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // pupil
      ctx.fillStyle = theme.snakeHead;
      ctx.beginPath();
      ctx.arc(ex1 + dir.dx * 0.8, ey1 + dir.dy * 0.8, 0.9, 0, Math.PI * 2);
      ctx.arc(ex2 + dir.dx * 0.8, ey2 + dir.dy * 0.8, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFood(ctx, food, theme, now) {
  const pulse = 0.7 + Math.sin(now * 0.006) * 0.3;
  const cx = food.x * CELL + CELL / 2;
  const cy = food.y * CELL + CELL / 2;
  const r = (CELL / 2 - 3) * pulse;
  ctx.shadowColor = theme.foodGlow;
  ctx.shadowBlur = 16;
  ctx.fillStyle = theme.food;
  // diamond
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  // sparkle
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(cx - 1, cy - r * 0.4, 2, 2);
  ctx.globalAlpha = 1;
}

function drawSpecialFood(ctx, food, theme, now) {
  const ft = FOOD_TYPES[food.type];
  const expiresIn = food.expires - now;
  const expiring = expiresIn < 2000;
  const blink = expiring ? (Math.floor(now / 120) % 2) : 1;
  if (!blink) return;
  const pulse = 0.85 + Math.sin(now * 0.012) * 0.15;
  const cx = food.x * CELL + CELL / 2;
  const cy = food.y * CELL + CELL / 2;
  const color = food.type === 'golden' ? theme.special : theme.accent2;
  const r = (CELL / 2 - 2) * pulse;
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  // ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // glyph
  ctx.fillStyle = theme.bg;
  ctx.font = 'bold 12px "VT323", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ft.glyph, cx, cy + 1);
  // ticking ring
  if (expiresIn > 0) {
    const pct = Math.max(0, expiresIn / 7000);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.stroke();
  }
}

function drawObstacle(ctx, x, y, theme) {
  const px = x * CELL;
  const py = y * CELL;
  ctx.fillStyle = theme.obstacle;
  ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
  ctx.strokeStyle = theme.obstacleEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
  // x mark
  ctx.strokeStyle = theme.obstacleEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px + 5, py + 5);
  ctx.lineTo(px + CELL - 5, py + CELL - 5);
  ctx.moveTo(px + CELL - 5, py + 5);
  ctx.lineTo(px + 5, py + CELL - 5);
  ctx.stroke();
}

function drawWrapEdges(ctx, head, dir, theme) {
  const margin = 2;
  if (head.x <= margin && dir.dx < 0) drawArrow(ctx, BOARD_PX - 14, head.y * CELL + CELL / 2, 'right', theme);
  if (head.x >= GRID - 1 - margin && dir.dx > 0) drawArrow(ctx, 6, head.y * CELL + CELL / 2, 'left', theme);
  if (head.y <= margin && dir.dy < 0) drawArrow(ctx, head.x * CELL + CELL / 2, BOARD_PX - 14, 'down', theme);
  if (head.y >= GRID - 1 - margin && dir.dy > 0) drawArrow(ctx, head.x * CELL + CELL / 2, 6, 'up', theme);
}

function drawArrow(ctx, x, y, dir, theme) {
  ctx.fillStyle = withAlpha(theme.accent2, 0.6 + Math.sin(performance.now() * 0.01) * 0.3);
  ctx.shadowColor = theme.accent2;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  const s = 5;
  if (dir === 'left') { ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y); ctx.lineTo(x + s, y + s); }
  else if (dir === 'right') { ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x - s, y + s); }
  else if (dir === 'up') { ctx.moveTo(x - s, y + s); ctx.lineTo(x, y - s); ctx.lineTo(x + s, y + s); }
  else { ctx.moveTo(x - s, y - s); ctx.lineTo(x, y + s); ctx.lineTo(x + s, y - s); }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function withAlpha(hex, a) {
  if (hex.startsWith('rgba')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
