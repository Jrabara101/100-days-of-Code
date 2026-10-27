import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Heart, ExternalLink, Sparkles, Volume2, VolumeX, RotateCcw, Gamepad2, Film, ShieldCheck } from 'lucide-react';
import { GameTitle } from '../types/game';
import { useStore } from '../lib/store';
import { formatPrice, cn } from '../lib/utils';
import { Tabs } from './ui/Tabs';

export interface QuickLookModalProps {
  game: GameTitle | null;
  onClose: () => void;
}

export function QuickLookModal({ game, onClose }: QuickLookModalProps) {
  const [activeTab, setActiveTab] = useState<'demo' | 'breakdown'>('demo');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const setSelectedGame = useStore((s) => s.setSelectedGame);

  const isWishlisted = game ? wishlist.includes(game.id) : false;

  // Browser-Playable Interactive HTML5 Demo Slice Loop
  useEffect(() => {
    if (!game || activeTab !== 'demo') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 720);
    let height = (canvas.height = 420);

    // Player state
    const player = {
      x: width / 2,
      y: height - 60,
      size: 18,
      speed: 6,
      color: '#06B6D4',
      vx: 0,
      vy: 0,
    };

    // Bullets and enemies
    interface Bullet { x: number; y: number; vy: number }
    interface Enemy { x: number; y: number; vx: number; vy: number; size: number; hp: number }
    interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }

    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let particles: Particle[] = [];
    let keys: { [key: string]: boolean } = {};
    let score = 0;
    let spawnTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        // Fire laser
        bullets.push({ x: player.x, y: player.y - player.size, vy: -10 });
        bullets.push({ x: player.x - 8, y: player.y - player.size + 4, vy: -9 });
        bullets.push({ x: player.x + 8, y: player.y - player.size + 4, vy: -9 });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main 60fps Game Loop
    const loop = () => {
      ctx.fillStyle = '#080B11';
      ctx.fillRect(0, 0, width, height);

      // Starfield background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 40; i++) {
        const starX = (Math.sin(i * 99 + Date.now() * 0.0005) * 0.5 + 0.5) * width;
        const starY = ((i * 37 + Date.now() * 0.1) % height);
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      // Handle Input
      if (keys['arrowleft'] || keys['a']) player.x = Math.max(player.size, player.x - player.speed);
      if (keys['arrowright'] || keys['d']) player.x = Math.min(width - player.size, player.x + player.speed);
      if (keys['arrowup'] || keys['w']) player.y = Math.max(player.size, player.y - player.speed);
      if (keys['arrowdown'] || keys['s']) player.y = Math.min(height - player.size, player.y + player.speed);

      // Draw Ship
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(0, -player.size);
      ctx.lineTo(player.size * 0.8, player.size);
      ctx.lineTo(0, player.size * 0.5);
      ctx.lineTo(-player.size * 0.8, player.size);
      ctx.closePath();
      ctx.fillStyle = '#06B6D4';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Thruster flame
      ctx.beginPath();
      ctx.moveTo(-player.size * 0.4, player.size * 0.6);
      ctx.lineTo(0, player.size * 1.2 + Math.random() * 8);
      ctx.lineTo(player.size * 0.4, player.size * 0.6);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();
      ctx.restore();

      // Update Bullets
      ctx.fillStyle = '#38BDF8';
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 8;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y += b.vy;
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        if (b.y < -10) bullets.splice(i, 1);
      }

      // Spawn Enemies
      spawnTimer++;
      if (spawnTimer % 45 === 0) {
        enemies.push({
          x: Math.random() * (width - 40) + 20,
          y: -20,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2 + 2,
          size: 16,
          hp: 2,
        });
      }

      // Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x += e.vx;
        e.y += e.vy;

        // Draw Enemy
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(0, 0, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Check Collision with Bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.size + 4) {
            e.hp--;
            bullets.splice(j, 1);

            // Explosion Particles
            for (let p = 0; p < 8; p++) {
              particles.push({
                x: e.x,
                y: e.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 25,
                color: Math.random() > 0.5 ? '#06B6D4' : '#F43F5E',
              });
            }

            if (e.hp <= 0) {
              score += 150;
              setGameScore(score);
              enemies.splice(i, 1);
              break;
            }
          }
        }

        // Out of bounds
        if (e.y > height + 30) enemies.splice(i, 1);
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2.5, 2.5);
        if (p.life <= 0) particles.splice(i, 1);
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [game, activeTab]);

  if (!game) return null;

  const currentPrice = game.priceCents * (1 - game.discountPercent / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl glass-popover rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-10 text-white flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#101622]/90">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#06B6D4]/15 text-[#38BDF8] border border-[#06B6D4]/30 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              QUICK-LOOK MICRO-THEATER
            </span>
            <h3 className="text-lg font-bold font-display text-white">{game.title}</h3>
          </div>

          <div className="flex items-center gap-3">
            <Tabs
              tabs={[
                { id: 'demo', label: 'Playable Slice', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
                { id: 'breakdown', label: '4K Breakdown', icon: <Film className="w-3.5 h-3.5" /> },
              ]}
              activeTab={activeTab}
              onChange={(t) => setActiveTab(t as any)}
            />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport: Interactive Canvas OR 4K Breakdown */}
        <div className="relative bg-[#080B11] min-h-[420px] flex items-center justify-center overflow-hidden">
          {activeTab === 'demo' ? (
            <div className="relative w-full h-[420px] flex flex-col items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

              {/* HUD Overlay */}
              <div className="absolute top-3 left-4 flex items-center gap-3 pointer-events-none">
                <span className="font-mono text-xs text-[#94A3B8] bg-black/60 px-3 py-1 rounded-md border border-white/10 backdrop-blur-md">
                  SCORE: <span className="text-[#38BDF8] font-bold">{gameScore}</span>
                </span>
                <span className="font-mono text-xs text-emerald-400 bg-black/60 px-3 py-1 rounded-md border border-emerald-500/30 backdrop-blur-md">
                  LOCKED 60 FPS
                </span>
              </div>

              {/* Controls Guidance Overlay */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none text-xs font-mono text-[#94A3B8] bg-black/75 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                <span>CONTROLS: [WASD / Arrows] Maneuver • [SPACE] Fire Triple Plasma</span>
                <span className="text-[#38BDF8]">WebAssembly / Canvas Micro-Slice</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-[420px] relative bg-black">
              <video
                src={game.media.microTrailerWebmUrl}
                poster={game.media.heroBannerUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Footer Tray */}
        <div className="p-4 sm:px-6 bg-[#101622] border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {game.discountPercent > 0 ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#84CC16] text-[#080B11] font-mono font-extrabold text-xs shadow-md glow-lime">
                  -{game.discountPercent}%
                </span>
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-mono line-through text-[#94A3B8]">
                    {formatPrice(game.priceCents)}
                  </span>
                  <span className="text-base font-mono font-bold text-white">
                    {formatPrice(currentPrice)}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-base font-mono font-bold text-white">
                {formatPrice(game.priceCents)}
              </span>
            )}

            <span className="text-xs font-mono text-[#38BDF8] hidden sm:inline">
              {game.reviewSummary.allTimeScore}% Positive ({game.reviewSummary.totalReviews.toLocaleString()} reviews)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleWishlist(game.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all',
                isWishlisted
                  ? 'bg-[#3B82F6] text-white border-blue-400 shadow-md'
                  : 'bg-[#192234] text-[#94A3B8] border-white/10 hover:text-white'
              )}
            >
              <Heart className={cn('w-4 h-4', isWishlisted && 'fill-white')} />
              <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setSelectedGame(game);
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891B2] hover:to-[#2563EB] text-white font-display font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <span>Full Store Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
