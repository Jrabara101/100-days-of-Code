import React, { useState, useEffect } from 'react';
import { TweaksPanel, TweakSection, TweakRadio, TweakSlider, TweakToggle } from './tweaks-panel.jsx';

export function StatBlock({ label, value, small, accent, highlight }) {
  return (
    <div className={`stat-block ${small ? 'small' : ''} ${accent ? 'accent' : ''} ${highlight ? 'highlight' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export function Buff({ label, active, expires, color }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => force((v) => v + 1), 100);
    return () => clearInterval(id);
  }, [active]);
  const remaining = active ? Math.max(0, expires - performance.now()) : 0;
  const pct = active ? Math.min(100, (remaining / 6000) * 100) : 0;
  return (
    <div className={`buff ${active ? 'active' : ''}`}>
      <div className="buff-row">
        <span className="buff-dot" style={{ background: active ? color : 'transparent', borderColor: color, boxShadow: active ? `0 0 8px ${color}` : 'none' }} />
        <span className="buff-label" style={{ color: active ? color : undefined }}>{label}</span>
        <span className="buff-time">{active ? (remaining / 1000).toFixed(1) + 's' : '--'}</span>
      </div>
      <div className="buff-bar">
        <div className="buff-bar-fill" style={{ width: pct + '%', background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

export function LegendItem({ color, glyph, label }) {
  return (
    <div className="legend-item">
      <span className="legend-glyph" style={{ color, textShadow: `0 0 6px ${color}` }}>{glyph}</span>
      <span className="legend-text">{label}</span>
    </div>
  );
}

export function TitleScreen({ onStart, theme }) {
  return (
    <div className="screen-overlay title-screen">
      <div className="screen-inner">
        <div className="title-tagline">CRT-86 ARCADE</div>
        <h1 className="title-main">SERPENT<span className="title-dot">·</span>28</h1>
        <div className="title-sub">PRESS <kbd>SPACE</kbd> TO BEGIN</div>
        <div className="title-rules">
          <div className="rule">› EAT <span style={{ color: theme.food }}>◆</span> TO GROW</div>
          <div className="rule">› CHAIN BITES FOR COMBO MULT.</div>
          <div className="rule">› <span style={{ color: theme.accent2 }}>◐ ◯</span> &nbsp;BUFFS · <span style={{ color: theme.special }}>★</span> GOLD</div>
          <div className="rule">› AVOID <span style={{ color: theme.obstacle }}>▣</span> AND YOUR TAIL</div>
        </div>
        <button className="cta-button" onClick={onStart}>
          <span className="cta-arrow">▶</span> START GAME
        </button>
        <div className="title-version">v1.0 · 28×28 GRID</div>
      </div>
    </div>
  );
}

export function PauseScreen({ onResume, theme }) {
  return (
    <div className="screen-overlay pause-screen">
      <div className="screen-inner">
        <div className="pause-glyph">⏸</div>
        <h1 className="title-main pause-title">PAUSED</h1>
        <div className="title-sub">PRESS <kbd>ESC</kbd> OR <kbd>SPACE</kbd> TO RESUME</div>
        <button className="cta-button" onClick={onResume}>
          <span className="cta-arrow">▶</span> RESUME
        </button>
      </div>
    </div>
  );
}

export function GameOverScreen({ stats, onRestart, onTitle, theme }) {
  if (!stats) return null;
  const reasonText = {
    self: 'BIT YOUR OWN TAIL',
    wall: 'HIT THE WALL',
    obstacle: 'STRUCK AN OBSTACLE',
  }[stats.reason] || 'GAME OVER';
  return (
    <div className="screen-overlay gameover-screen">
      <div className="screen-inner">
        <div className="go-tag">SIGNAL LOST</div>
        <h1 className="title-main go-title">GAME OVER</h1>
        <div className="go-reason">// {reasonText}</div>
        {stats.newBest && <div className="go-newbest">★ NEW HIGH SCORE ★</div>}
        <div className="go-stats">
          <div className="go-stat"><span>SCORE</span><b>{stats.score}</b></div>
          <div className="go-stat"><span>BEST</span><b>{stats.best}</b></div>
          <div className="go-stat"><span>LENGTH</span><b>{stats.length}</b></div>
          <div className="go-stat"><span>LEVEL</span><b>{stats.level}</b></div>
          <div className="go-stat"><span>MAX COMBO</span><b>×{stats.maxCombo}</b></div>
          <div className="go-stat"><span>EATEN</span><b>{stats.eaten}</b></div>
        </div>
        <div className="go-buttons">
          <button className="cta-button" onClick={onRestart}>
            <span className="cta-arrow">▶</span> PLAY AGAIN
          </button>
          <button className="cta-button ghost" onClick={onTitle}>
            ◂ TITLE
          </button>
        </div>
      </div>
    </div>
  );
}

export function SnakeTweaks({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Theme">
        <TweakRadio
          label="Direction"
          value={t.theme}
          options={[
            { label: 'Neon', value: 'neon' },
            { label: 'Phosphor', value: 'phosphor' },
            { label: 'Amber', value: 'amber' },
          ]}
          onChange={(v) => setTweak('theme', v)}
        />
      </TweakSection>
      <TweakSection title="Gameplay">
        <TweakSlider label="Speed" value={t.speed} min={0.5} max={2} step={0.1} onChange={(v) => setTweak('speed', v)} suffix="×" />
        <TweakToggle label="Wrap-around walls" value={t.wrapWalls} onChange={(v) => setTweak('wrapWalls', v)} />
        <TweakToggle label="Obstacles on board" value={t.obstaclesOn} onChange={(v) => setTweak('obstaclesOn', v)} />
        <TweakToggle label="Special food & power-ups" value={t.specialFoodOn} onChange={(v) => setTweak('specialFoodOn', v)} />
      </TweakSection>
      <TweakSection title="Visuals">
        <TweakSlider label="CRT effect" value={t.crtIntensity} min={0} max={1} step={0.05} onChange={(v) => setTweak('crtIntensity', v)} />
        <TweakToggle label="Tail trail" value={t.showTrail} onChange={(v) => setTweak('showTrail', v)} />
      </TweakSection>
      <TweakSection title="Audio">
        <TweakToggle label="Sound" value={t.soundOn} onChange={(v) => setTweak('soundOn', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}
