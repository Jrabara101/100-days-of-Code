import { useEffect, useRef, useState } from 'react';
import { useWeatherStore } from '../store/useWeatherStore';

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  layer: number; // 0 = bg, 1 = mid, 2 = fg
  alpha: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface Snowflake {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobbleSpeed: number;
  seed: number;
  alpha: number;
}

interface CloudPuff {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

interface LightningBolt {
  segments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  alpha: number;
}

export function useWeatherParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const particleConfig = useWeatherStore((state) => state.particleConfig);
  const weather = useWeatherStore((state) => state.weather);
  const [fps, setFps] = useState<number>(60);
  const [particleCount, setParticleCount] = useState<number>(0);

  // Mouse interaction coordinates
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Smoothed Lerp Parameters
    const current = {
      rainDensity: particleConfig.rainDensity,
      snowDensity: particleConfig.snowDensity,
      windX: particleConfig.windVector.x,
      windY: particleConfig.windVector.y,
      cloudCover: particleConfig.cloudCover,
      sunRays: particleConfig.sunRayIntensity,
      lightningFreq: particleConfig.lightningFreq,
      fogDensity: particleConfig.fogDensity,
    };

    const target = { ...current };

    // Update targets whenever store changes
    target.rainDensity = particleConfig.rainDensity;
    target.snowDensity = particleConfig.snowDensity;
    target.windX = particleConfig.windVector.x;
    target.windY = particleConfig.windVector.y;
    target.cloudCover = particleConfig.cloudCover;
    target.sunRays = particleConfig.sunRayIntensity;
    target.lightningFreq = particleConfig.lightningFreq;
    target.fogDensity = particleConfig.fogDensity;

    // Allocate particle buffers
    const MAX_RAIN = 350;
    const MAX_SNOW = 200;
    const MAX_CLOUDS = 18;
    const MAX_SPLASHES = 50;

    const rainDrops: RainDrop[] = [];
    const splashes: Splash[] = [];
    const snowflakes: Snowflake[] = [];
    const cloudPuffs: CloudPuff[] = [];
    let activeLightning: LightningBolt | null = null;
    let skyFlashAlpha = 0;

    // Resize Handler
    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize Clouds
    for (let i = 0; i < MAX_CLOUDS; i++) {
      cloudPuffs.push({
        x: Math.random() * (width + 400) - 200,
        y: Math.random() * (height * 0.6),
        radius: 120 + Math.random() * 220,
        speed: 0.15 + Math.random() * 0.35,
        opacity: 0.05 + Math.random() * 0.15,
      });
    }

    // Initialize Rain Pool
    for (let i = 0; i < MAX_RAIN; i++) {
      const layer = Math.random() < 0.3 ? 2 : Math.random() < 0.6 ? 1 : 0;
      rainDrops.push({
        x: Math.random() * (width + 600) - 300,
        y: Math.random() * height,
        length: layer === 2 ? 22 + Math.random() * 12 : layer === 1 ? 16 + Math.random() * 8 : 10 + Math.random() * 6,
        speed: layer === 2 ? 18 + Math.random() * 6 : layer === 1 ? 14 + Math.random() * 4 : 10 + Math.random() * 3,
        layer,
        alpha: layer === 2 ? 0.65 : layer === 1 ? 0.45 : 0.25,
      });
    }

    // Initialize Snow Pool
    for (let i = 0; i < MAX_SNOW; i++) {
      snowflakes.push({
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        size: 1.5 + Math.random() * 3.5,
        speed: 1.0 + Math.random() * 2.2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        seed: Math.random() * 100,
        alpha: 0.3 + Math.random() * 0.6,
      });
    }

    // Mouse tracker
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // FPS computation
    let frameTimes: number[] = [];
    let lastFpsUpdate = performance.now();
    let tick = 0;

    // Main 60fps Environmental Physics Loop
    const loop = (timestamp: number) => {
      tick++;

      // FPS tracking
      frameTimes.push(timestamp);
      while (frameTimes.length > 0 && frameTimes[0] < timestamp - 1000) {
        frameTimes.shift();
      }
      if (timestamp - lastFpsUpdate > 500) {
        setFps(frameTimes.length);
        lastFpsUpdate = timestamp;
      }

      // Smooth Parameter Lerping (Target -> Current)
      const LERP_FACTOR = 0.05;
      current.rainDensity += (particleConfig.rainDensity - current.rainDensity) * LERP_FACTOR;
      current.snowDensity += (particleConfig.snowDensity - current.snowDensity) * LERP_FACTOR;
      current.windX += (particleConfig.windVector.x - current.windX) * LERP_FACTOR;
      current.windY += (particleConfig.windVector.y - current.windY) * LERP_FACTOR;
      current.cloudCover += (particleConfig.cloudCover - current.cloudCover) * LERP_FACTOR;
      current.sunRays += (particleConfig.sunRayIntensity - current.sunRays) * LERP_FACTOR;
      current.lightningFreq += (particleConfig.lightningFreq - current.lightningFreq) * LERP_FACTOR;
      current.fogDensity += (particleConfig.fogDensity - current.fogDensity) * LERP_FACTOR;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // 1. ATMOSPHERIC BACKDROP & SKY TINT
      const isDay = weather?.isDay ?? true;
      const isThunder = current.lightningFreq > 0.3;

      let topSky = isDay ? '#0a192f' : '#030712';
      let botSky = isDay ? '#0f2744' : '#090d16';

      if (current.cloudCover > 0.7) {
        topSky = isDay ? '#111827' : '#020617';
        botSky = isDay ? '#1f2937' : '#0b0f19';
      }
      if (isThunder) {
        topSky = '#090b14';
        botSky = '#141724';
      }

      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, topSky);
      skyGrad.addColorStop(1, botSky);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sky flash during lightning
      if (skyFlashAlpha > 0.01) {
        ctx.fillStyle = `rgba(215, 235, 255, ${skyFlashAlpha * 0.35})`;
        ctx.fillRect(0, 0, width, height);
        skyFlashAlpha *= 0.82;
      }

      // 2. SOLAR VOLUMETRIC RAYS & SUN FLARE
      if (current.sunRays > 0.05 && isDay) {
        const sunX = width * 0.82;
        const sunY = height * 0.18;
        const sunAlpha = current.sunRays * (1 - current.cloudCover * 0.7);

        // Core sun glow
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 320);
        sunGlow.addColorStop(0, `rgba(255, 238, 185, ${0.45 * sunAlpha})`);
        sunGlow.addColorStop(0.3, `rgba(251, 191, 36, ${0.2 * sunAlpha})`);
        sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 320, 0, Math.PI * 2);
        ctx.fill();

        // Radiating light rays
        const numRays = 8;
        ctx.save();
        ctx.translate(sunX, sunY);
        for (let r = 0; r < numRays; r++) {
          const angle = (r * (Math.PI * 2)) / numRays + Math.sin(tick * 0.005 + r) * 0.1;
          const rayWidth = 0.12 + Math.sin(tick * 0.01 + r * 2) * 0.04;
          const rayGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, width * 0.9);
          rayGrad.addColorStop(0, `rgba(255, 245, 200, ${0.12 * sunAlpha})`);
          rayGrad.addColorStop(0.6, `rgba(251, 191, 36, ${0.04 * sunAlpha})`);
          rayGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, width * 0.9, angle - rayWidth, angle + rayWidth);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. DRIFTING CLOUDS & FOG VOLUMETRICS
      const activeCloudCount = Math.floor(MAX_CLOUDS * Math.max(current.cloudCover, current.fogDensity));
      for (let i = 0; i < activeCloudCount; i++) {
        const puff = cloudPuffs[i];
        puff.x += puff.speed * (0.8 + current.windX * 1.5);
        if (puff.x - puff.radius > width) {
          puff.x = -puff.radius;
          puff.y = Math.random() * (height * 0.65);
        } else if (puff.x + puff.radius < 0) {
          puff.x = width + puff.radius;
        }

        const cloudAlpha = puff.opacity * (current.cloudCover * 0.8 + current.fogDensity * 0.6);
        const grad = ctx.createRadialGradient(puff.x, puff.y, puff.radius * 0.15, puff.x, puff.y, puff.radius);
        const cloudColor = isDay ? '210, 225, 245' : '75, 85, 110';
        grad.addColorStop(0, `rgba(${cloudColor}, ${cloudAlpha})`);
        grad.addColorStop(0.6, `rgba(${cloudColor}, ${cloudAlpha * 0.5})`);
        grad.addColorStop(1, `rgba(${cloudColor}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. RAIN PARTICLES & SPLASHES
      const activeRainCount = Math.floor(MAX_RAIN * current.rainDensity);
      let renderedParticles = 0;

      if (activeRainCount > 0) {
        ctx.lineWidth = 1.25;
        const windTiltX = current.windX * 6;
        const baseFallY = 12 + current.windY * 6;

        for (let i = 0; i < activeRainCount; i++) {
          const drop = rainDrops[i];

          // Mouse vortex deflection
          let dx = windTiltX;
          let dy = drop.speed + baseFallY;

          if (mouseRef.current.active) {
            const mDistX = drop.x - mouseRef.current.x;
            const mDistY = drop.y - mouseRef.current.y;
            const distSq = mDistX * mDistX + mDistY * mDistY;
            if (distSq < 15000 && distSq > 0) {
              const force = (1 - distSq / 15000) * 12;
              dx += (mDistX / Math.sqrt(distSq)) * force;
            }
          }

          drop.x += dx;
          drop.y += dy;

          // Ground splash detection
          if (drop.y > height - 10) {
            if (Math.random() < 0.35 && splashes.length < MAX_SPLASHES) {
              splashes.push({
                x: drop.x,
                y: height - Math.random() * 8,
                radius: 1,
                maxRadius: 4 + Math.random() * 8,
                alpha: 0.6,
              });
            }
            drop.y = -drop.length - Math.random() * 40;
            drop.x = Math.random() * (width + 600) - 300;
          }

          if (drop.x > width + 300) drop.x = -200;
          else if (drop.x < -300) drop.x = width + 200;

          // Draw Rain Streak
          const endX = drop.x - (dx / (dy || 1)) * drop.length;
          const endY = drop.y - drop.length;

          const rainGrad = ctx.createLinearGradient(drop.x, drop.y, endX, endY);
          rainGrad.addColorStop(0, `rgba(186, 230, 253, ${drop.alpha * current.rainDensity})`);
          rainGrad.addColorStop(1, `rgba(186, 230, 253, 0.05)`);

          ctx.strokeStyle = rainGrad;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          renderedParticles++;
        }

        // Draw Splashes
        for (let s = splashes.length - 1; s >= 0; s--) {
          const sp = splashes[s];
          sp.radius += 0.8;
          sp.alpha *= 0.85;

          ctx.strokeStyle = `rgba(186, 230, 253, ${sp.alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.radius * 1.5, sp.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (sp.alpha < 0.04) {
            splashes.splice(s, 1);
          }
        }
      }

      // 5. SNOWFLAKE PARTICLES
      const activeSnowCount = Math.floor(MAX_SNOW * current.snowDensity);
      if (activeSnowCount > 0) {
        for (let i = 0; i < activeSnowCount; i++) {
          const flake = snowflakes[i];
          const wobble = Math.sin(tick * flake.wobbleSpeed + flake.seed) * 1.8;
          flake.x += wobble + current.windX * 3.5;
          flake.y += flake.speed * (1 + current.windY * 0.4);

          // Mouse deflection
          if (mouseRef.current.active) {
            const mDistX = flake.x - mouseRef.current.x;
            const mDistY = flake.y - mouseRef.current.y;
            const distSq = mDistX * mDistX + mDistY * mDistY;
            if (distSq < 18000 && distSq > 0) {
              const force = (1 - distSq / 18000) * 8;
              flake.x += (mDistX / Math.sqrt(distSq)) * force;
            }
          }

          if (flake.y > height + 10) {
            flake.y = -10;
            flake.x = Math.random() * (width + 200) - 100;
          }
          if (flake.x > width + 100) flake.x = -50;
          else if (flake.x < -100) flake.x = width + 50;

          const snowAlpha = flake.alpha * current.snowDensity;
          ctx.fillStyle = `rgba(240, 249, 255, ${snowAlpha})`;
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
          ctx.fill();

          renderedParticles++;
        }
      }

      // 6. THUNDERSTORM PROCEDURAL LIGHTNING BOLT
      if (current.lightningFreq > 0.1) {
        // Trigger random lightning discharge
        if (!activeLightning && Math.random() < 0.015 * current.lightningFreq) {
          skyFlashAlpha = 0.9;
          const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
          let startX = width * (0.2 + Math.random() * 0.6);
          let startY = 0;
          const targetY = height * (0.6 + Math.random() * 0.35);

          while (startY < targetY) {
            const nextX = startX + (Math.random() - 0.5) * 60;
            const nextY = startY + 15 + Math.random() * 30;
            segments.push({ x1: startX, y1: startY, x2: nextX, y2: nextY });

            // Branching
            if (Math.random() < 0.35) {
              segments.push({
                x1: startX,
                y1: startY,
                x2: startX + (Math.random() - 0.5) * 80,
                y2: startY + 20 + Math.random() * 30,
              });
            }

            startX = nextX;
            startY = nextY;
          }

          activeLightning = { segments, alpha: 1.0 };
        }

        if (activeLightning) {
          ctx.save();
          ctx.strokeStyle = `rgba(224, 242, 254, ${activeLightning.alpha})`;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 18;
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          activeLightning.segments.forEach((seg) => {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
          });
          ctx.stroke();
          ctx.restore();

          activeLightning.alpha *= 0.78;
          if (activeLightning.alpha < 0.05) {
            activeLightning = null;
          }
        }
      }

      // 7. HIGH WIND AERODYNAMIC STREAMERS
      const windSpeed = Math.abs(current.windX) + Math.abs(current.windY);
      if (windSpeed > 1.2 && Math.random() < 0.2) {
        const streamY = Math.random() * (height * 0.8);
        const streamX = current.windX > 0 ? -100 : width + 100;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * Math.min(windSpeed, 2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(streamX, streamY);
        ctx.lineTo(streamX + current.windX * 80, streamY + current.windY * 20);
        ctx.stroke();
      }

      setParticleCount(renderedParticles);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [particleConfig, weather]);

  return { fps, particleCount };
}
