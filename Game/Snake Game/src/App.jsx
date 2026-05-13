import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTweaks } from './tweaks-panel.jsx';
import { getTheme } from './themes.js';
import { initialGameState, wrap, spawnFood, spawnObstacles, rand, key, FOOD_TYPES, ACHIEVEMENTS, GRID, CELL, BOARD_PX, DIRS } from './core.js';
import { SnakeAudio } from './audio.js';
import { renderBoard } from './render.js';
import { StatBlock, Buff, LegendItem, TitleScreen, PauseScreen, GameOverScreen, SnakeTweaks } from './ui.jsx';

export default function SnakeGame() {
  const [t, setTweak] = useTweaks({
    "theme": "neon",
    "soundOn": true,
    "speed": 1,
    "crtIntensity": 0.7,
    "wrapWalls": true,
    "obstaclesOn": true,
    "specialFoodOn": true,
    "showTrail": true
  });

  const theme = getTheme(t.theme);

  const [phase, setPhase] = useState('title'); // title | playing | paused | gameover
  const [, force] = useState(0);
  const tick = useCallback(() => force((v) => v + 1), []);

  const stateRef = useRef(initialGameState());
  const lastDeathStatsRef = useRef(null);
  const canvasRef = useRef(null);
  const interpRef = useRef({ prevSnake: null, lastMoveAt: 0, tickInterval: 120 });
  const particlesRef = useRef([]);
  const trailRef = useRef([]);
  const shakeRef = useRef(0);
  const flashRef = useRef(0);
  const toastRef = useRef([]); // floating "+10" texts
  const achievementToastRef = useRef([]); // achievement popups
  const bestRef = useRef(parseInt(localStorage.getItem('snake_best') || '0', 10));
  const unlockedAchRef = useRef(JSON.parse(localStorage.getItem('snake_achievements') || '{}'));

  // ---------- Game loop tick ----------
  const tickGame = useCallback(() => {
    const s = stateRef.current;
    const now = performance.now();

    // Apply queued direction
    const nd = s.nextDirection;
    if (nd.dx !== -s.direction.dx || nd.dy !== -s.direction.dy) {
      if (nd.dx !== s.direction.dx || nd.dy !== s.direction.dy) {
        s.direction = nd;
      }
    }

    interpRef.current.prevSnake = s.snake.map((p) => ({ ...p }));
    interpRef.current.lastMoveAt = now;

    // Move
    const head = s.snake[0];
    let nx = head.x + s.direction.dx;
    let ny = head.y + s.direction.dy;
    let wrapped = false;
    if (t.wrapWalls) {
      if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) wrapped = true;
      nx = wrap(nx); ny = wrap(ny);
      if (wrapped) s.wraps++;
    } else {
      if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) {
        return doDie('wall');
      }
    }

    // Self collision (skip tail since it will move - unless we grow)
    const willGrow = (nx === s.food.x && ny === s.food.y) || s.pendingGrowth > 0
      || (s.specialFood && nx === s.specialFood.x && ny === s.specialFood.y);
    const checkBody = willGrow ? s.snake : s.snake.slice(0, -1);
    for (const seg of checkBody) {
      if (seg.x === nx && seg.y === ny) return doDie('self');
    }
    // Obstacle collision
    if (t.obstaclesOn) {
      for (const o of s.obstacles) {
        if (o.x === nx && o.y === ny) return doDie('obstacle');
      }
    }

    // Move snake
    s.snake.unshift({ x: nx, y: ny });

    // Eat food
    let ate = false;
    if (nx === s.food.x && ny === s.food.y) {
      const isDouble = s.powerups.double && s.powerups.double > now;
      const pts = FOOD_TYPES.normal.points * (isDouble ? 2 : 1);
      const comboBonus = Math.floor(s.combo * 2);
      s.score += pts + comboBonus;
      s.combo += 1;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.totalEaten++;
      s.pendingGrowth += FOOD_TYPES.normal.growth - 1;
      ate = true;
      SnakeAudio?.play('eat');
      if (s.combo >= 2) SnakeAudio?.play('combo', s.combo);
      spawnParticles(s.food.x, s.food.y, theme.food, 14);
      pushToast(s.food.x, s.food.y, `+${pts + comboBonus}`, theme.food);
      if (comboBonus > 0) pushToast(s.food.x, s.food.y + 0.4, `x${s.combo}`, theme.accent2, 900);
      s.food = spawnFood(s.snake, t.obstaclesOn ? s.obstacles : [], 'normal');
      // Maybe spawn a special food
      if (t.specialFoodOn && !s.specialFood && Math.random() < 0.28) {
        const specials = ['golden', 'slowmo', 'shrink'];
        const type = specials[rand(specials.length)];
        s.specialFood = spawnFood(s.snake, [...(t.obstaclesOn ? s.obstacles : []), s.food], type);
        s.specialFood.expires = now + 7000;
      }
      // Level up every 5 foods
      const newLevel = 1 + Math.floor(s.totalEaten / 5);
      if (newLevel > s.level) {
        s.level = newLevel;
        flashRef.current = 1;
        SnakeAudio?.play('levelup');
        pushToast(s.snake[0].x, s.snake[0].y - 1, `LEVEL ${s.level}`, theme.accent3, 1400);
        // Add an obstacle every other level
        if (t.obstaclesOn && s.level % 2 === 0 && s.obstacles.length < 24) {
          s.obstacles.push(...spawnObstacles(s.snake, 2));
        }
      }
    }

    // Eat special food
    if (s.specialFood && nx === s.specialFood.x && ny === s.specialFood.y) {
      const ft = FOOD_TYPES[s.specialFood.type];
      const pts = ft.points * ((s.powerups.double && s.powerups.double > now) ? 2 : 1);
      s.score += pts;
      s.totalEaten++;
      if (s.specialFood.type === 'golden') s.goldEaten++;
      SnakeAudio?.play('powerup');
      spawnParticles(s.specialFood.x, s.specialFood.y, theme.special, 22);
      shakeRef.current = Math.max(shakeRef.current, 0.6);
      flashRef.current = 0.6;
      pushToast(s.specialFood.x, s.specialFood.y, `+${pts}`, theme.special);
      pushToast(s.specialFood.x, s.specialFood.y - 0.6, ft.label, theme.accent3, 1400);
      if (ft.effect === 'double') s.powerups.double = now + ft.duration;
      if (ft.effect === 'slowmo') s.powerups.slowmo = now + ft.duration;
      if (ft.effect === 'shrink') {
        const cut = Math.min(3, s.snake.length - 4);
        if (cut > 0) s.snake.splice(s.snake.length - cut, cut);
      }
      s.pendingGrowth += ft.growth - (ft.growth < 0 ? 0 : 1);
      s.specialFood = null;
      ate = true;
    }

    if (s.specialFood && s.specialFood.expires < now) s.specialFood = null;

    if (!ate) {
      if (s.pendingGrowth > 0) {
        s.pendingGrowth--;
      } else {
        s.snake.pop();
      }
      // Decay combo if no eat in last 4 ticks
      if (now - (s._lastEatAt || 0) > 4500) s.combo = 0;
    } else {
      s._lastEatAt = now;
    }

    // Push trail particles
    if (t.showTrail && s.snake.length > 0) {
      const tail = s.snake[s.snake.length - 1];
      trailRef.current.push({ x: tail.x, y: tail.y, life: 1, born: now });
      if (trailRef.current.length > 60) trailRef.current.shift();
    }

    // Check achievements
    for (const ach of ACHIEVEMENTS) {
      if (!unlockedAchRef.current[ach.id] && ach.cond(s)) {
        unlockedAchRef.current[ach.id] = true;
        localStorage.setItem('snake_achievements', JSON.stringify(unlockedAchRef.current));
        achievementToastRef.current.push({ name: ach.name, desc: ach.desc, born: now, life: 3000 });
        SnakeAudio?.play('achievement');
      }
    }

    tick();
  }, [t.wrapWalls, t.obstaclesOn, t.specialFoodOn, t.showTrail, theme, tick]);

  function doDie(reason) {
    const s = stateRef.current;
    SnakeAudio?.play('die');
    shakeRef.current = 1.2;
    flashRef.current = 1;
    spawnParticles(s.snake[0].x, s.snake[0].y, theme.snakeHead, 40);
    // Death stats
    if (s.score > bestRef.current) {
      bestRef.current = s.score;
      localStorage.setItem('snake_best', String(s.score));
    }
    lastDeathStatsRef.current = {
      score: s.score,
      best: bestRef.current,
      length: s.snake.length,
      level: s.level,
      maxCombo: s.maxCombo,
      eaten: s.totalEaten,
      reason,
      newBest: s.score >= bestRef.current && s.score > 0,
    };
    setPhase('gameover');
  }

  function spawnParticles(gx, gy, color, count) {
    const cx = gx * CELL + CELL / 2;
    const cy = gy * CELL + CELL / 2;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.5 + Math.random() * 4;
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: 0.012 + Math.random() * 0.025,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  function pushToast(gx, gy, text, color, dur = 1100) {
    toastRef.current.push({
      x: gx * CELL + CELL / 2,
      y: gy * CELL + CELL / 2,
      text, color,
      born: performance.now(),
      life: dur,
    });
  }

  // ---------- Input ----------
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (phase === 'playing') { setPhase('paused'); SnakeAudio?.play('pause'); }
        else if (phase === 'paused') { setPhase('playing'); SnakeAudio?.play('pause'); }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        if (phase === 'title' || phase === 'gameover') {
          startGame();
        } else if (phase === 'paused') {
          setPhase('playing');
        }
        e.preventDefault();
        return;
      }
      if (phase !== 'playing') return;
      const d = DIRS[e.key];
      if (!d) return;
      const cur = stateRef.current.direction;
      if (d.dx === -cur.dx && d.dy === -cur.dy) return; // can't reverse
      stateRef.current.nextDirection = d;
      SnakeAudio?.play('turn');
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  function startGame() {
    stateRef.current = initialGameState();
    particlesRef.current = [];
    trailRef.current = [];
    toastRef.current = [];
    achievementToastRef.current = [];
    shakeRef.current = 0;
    flashRef.current = 0;
    SnakeAudio?.resume();
    SnakeAudio?.play('start');
    setPhase('playing');
  }

  // ---------- Game tick interval ----------
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf;
    let last = performance.now();
    function step() {
      const now = performance.now();
      const s = stateRef.current;
      const baseInterval = 130 - (s.level - 1) * 7;
      const speedMul = t.speed;
      const slowmoMul = (s.powerups.slowmo && s.powerups.slowmo > now) ? 1.8 : 1;
      const interval = Math.max(45, baseInterval / speedMul) * slowmoMul;
      interpRef.current.tickInterval = interval;
      if (now - last >= interval) {
        last = now;
        tickGame();
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, t.speed, tickGame]);

  // ---------- Sound enable wiring ----------
  useEffect(() => {
    SnakeAudio?.setEnabled(t.soundOn);
  }, [t.soundOn]);

  // ---------- Render loop (canvas) ----------
  useEffect(() => {
    let raf;
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(draw); return; }
      const ctx2d = canvas.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== BOARD_PX * dpr) {
        canvas.width = BOARD_PX * dpr;
        canvas.height = BOARD_PX * dpr;
      }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderBoard(ctx2d, {
        state: stateRef.current,
        theme,
        phase,
        interp: interpRef.current,
        particles: particlesRef.current,
        trail: trailRef.current,
        toasts: toastRef.current,
        shake: shakeRef.current,
        flash: flashRef.current,
        crtIntensity: t.crtIntensity,
        showTrail: t.showTrail,
        wrapWalls: t.wrapWalls,
        obstaclesOn: t.obstaclesOn,
      });
      // Decay
      shakeRef.current *= 0.88;
      if (shakeRef.current < 0.01) shakeRef.current = 0;
      flashRef.current *= 0.86;
      if (flashRef.current < 0.01) flashRef.current = 0;
      // Update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.94; p.vy *= 0.94;
        p.life -= p.decay;
        return p.life > 0;
      });
      // Update trail decay
      const now = performance.now();
      trailRef.current = trailRef.current.filter((tr) => (now - tr.born) < 600);
      // Toast cleanup
      toastRef.current = toastRef.current.filter((tt) => (now - tt.born) < tt.life);
      achievementToastRef.current = achievementToastRef.current.filter((tt) => (now - tt.born) < tt.life);
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [theme, phase, t.crtIntensity, t.showTrail, t.wrapWalls, t.obstaclesOn]);

  // ---------- UI ----------
  const s = stateRef.current;
  const slowmoActive = s.powerups.slowmo && s.powerups.slowmo > performance.now();
  const doubleActive = s.powerups.double && s.powerups.double > performance.now();

  return (
    <div className="snake-root" style={{ '--accent': theme.accent, '--accent2': theme.accent2, '--accent3': theme.accent3, '--text': theme.text, '--textDim': theme.textDim, '--bg': theme.bg, '--bezel': theme.bezel, '--bezelEdge': theme.bezelEdge, '--crtGlow': theme.crtGlow }}>
      <div className="snake-stage">
        <header className="snake-header">
          <div className="snake-brand">
            <span className="brand-mark">▮▮</span>
            <span className="brand-text">SERPENT-28</span>
            <span className="brand-sub">CRT</span>
          </div>
          <div className="snake-theme-tag">[{theme.name} MODE]</div>
        </header>

        <div className="snake-main">
          <aside className="snake-side snake-side-left">
            <StatBlock label="SCORE" value={s.score.toString().padStart(6, '0')} accent />
            <StatBlock label="BEST" value={bestRef.current.toString().padStart(6, '0')} />
            <div className="stat-row">
              <StatBlock label="LEVEL" value={s.level} small />
              <StatBlock label="LENGTH" value={s.snake.length} small />
            </div>
            <div className="stat-row">
              <StatBlock label="COMBO" value={`x${s.combo}`} small highlight={s.combo >= 3} />
              <StatBlock label="EATEN" value={s.totalEaten} small />
            </div>
            <div className="powerups">
              <div className="powerups-label">ACTIVE BUFFS</div>
              <div className="powerups-list">
                <Buff label="2× POINTS" active={!!doubleActive} expires={s.powerups.double} color={theme.special} />
                <Buff label="SLOW-MO" active={!!slowmoActive} expires={s.powerups.slowmo} color={theme.accent2} />
              </div>
            </div>
          </aside>

          <div className={`snake-board-wrap ${phase}`}>
            <div className="snake-bezel" style={{
              transform: `translate(${(Math.random() - 0.5) * shakeRef.current * 10}px, ${(Math.random() - 0.5) * shakeRef.current * 10}px)`
            }}>
              <div className="snake-screen">
                <canvas ref={canvasRef} className="snake-canvas" style={{ width: BOARD_PX, height: BOARD_PX }} />
                <div className="crt-scanlines" style={{ opacity: t.crtIntensity }} />
                <div className="crt-vignette" style={{ opacity: t.crtIntensity * 0.9 }} />
                <div className="crt-flicker" style={{ opacity: t.crtIntensity * 0.5 }} />

                {phase === 'title' && <TitleScreen onStart={startGame} theme={theme} />}
                {phase === 'paused' && <PauseScreen onResume={() => setPhase('playing')} theme={theme} />}
                {phase === 'gameover' && <GameOverScreen stats={lastDeathStatsRef.current} onRestart={startGame} onTitle={() => setPhase('title')} theme={theme} />}

                {/* Achievement toasts */}
                <div className="ach-toasts">
                  {achievementToastRef.current.map((a, i) => {
                    const age = (performance.now() - a.born) / a.life;
                    return (
                      <div key={a.born + '_' + i} className="ach-toast" style={{ opacity: age > 0.85 ? (1 - age) * 6.6 : 1, transform: `translateY(${Math.min(0, -20 + age * 200)}px)` }}>
                        <div className="ach-toast-label">◆ ACHIEVEMENT</div>
                        <div className="ach-toast-name">{a.name}</div>
                        {a.desc && <div className="ach-toast-desc">{a.desc}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bezel-bottom">
                <div className="bezel-led" />
                <div className="bezel-text">SERPENT-28 • MODEL CRT-86 • {phase.toUpperCase()}</div>
                <div className="bezel-led off" />
              </div>
            </div>
          </div>

          <aside className="snake-side snake-side-right">
            <div className="achievements">
              <div className="ach-label">ACHIEVEMENTS</div>
              <div className="ach-list">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = !!unlockedAchRef.current[a.id];
                  return (
                    <div key={a.id} className={`ach-item ${unlocked ? 'unlocked' : ''}`}>
                      <span className="ach-dot">{unlocked ? '◆' : '◇'}</span>
                      <span className="ach-name">{a.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="legend">
              <div className="legend-label">LEGEND</div>
              <LegendItem color={theme.food} glyph="◆" label="FOOD +10" />
              <LegendItem color={theme.special} glyph="★" label="GOLD +50" />
              <LegendItem color={theme.accent2} glyph="◐" label="SLOW-MO" />
              <LegendItem color={theme.accent2} glyph="◯" label="SHRINK +30" />
              <LegendItem color={theme.obstacle} glyph="▣" label="ROCK" />
            </div>
            <div className="controls-hint">
              <div className="ctl-label">CONTROLS</div>
              <div className="ctl-row"><kbd>↑↓←→</kbd> MOVE</div>
              <div className="ctl-row"><kbd>SPACE</kbd> START</div>
              <div className="ctl-row"><kbd>ESC</kbd> PAUSE</div>
            </div>
          </aside>
        </div>

        <footer className="snake-footer">
          <div>© CRT-86 ARCADE SYSTEMS · INSERT COIN TO CONTINUE</div>
          <div className="footer-status">
            <span className="status-dot" /> ONLINE
          </div>
        </footer>
      </div>
      <SnakeTweaks t={t} setTweak={setTweak} />
    </div>
  );
}
