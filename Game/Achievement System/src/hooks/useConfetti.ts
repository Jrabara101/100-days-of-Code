import { useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const colors = [
    '#38bdf8', // Cyan
    '#f59e0b', // Amber / Gold
    '#10b981', // Emerald
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#ffffff', // Sparkle white
  ];

  const triggerCelebration = useCallback((originX?: number, originY?: number, particleCount = 70) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const startX = originX ?? rect.width / 2;
    const startY = originY ?? rect.height / 3;

    // Spawn voxel confetti particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      newParticles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3, // Initial upward burst
        size: 5 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        life: 0,
        maxLife: 60 + Math.random() * 45,
      });
    }

    particlesRef.current.push(...newParticles);

    // Start loop if not running
    if (!animFrameRef.current) {
      const loop = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const activeParticles: Particle[] = [];

        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.22; // Gravity
          p.vx *= 0.98; // Air drag
          p.rotation += p.rotationSpeed;
          p.life++;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);

          if (p.life < p.maxLife) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            // Draw square voxel particle
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();

            activeParticles.push(p);
          }
        }

        particlesRef.current = activeParticles;

        if (activeParticles.length > 0) {
          animFrameRef.current = requestAnimationFrame(loop);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          animFrameRef.current = null;
        }
      };

      animFrameRef.current = requestAnimationFrame(loop);
    }
  }, []);

  return {
    canvasRef,
    triggerCelebration,
  };
}
