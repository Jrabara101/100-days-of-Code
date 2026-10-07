import type { HardwareProfile } from '../types/telemetry';

let cachedProfile: HardwareProfile | null = null;

/**
 * Extracts unmasked GPU vendor and renderer using WEBGL_debug_renderer_info.
 */
export function getGpuInfo(): { renderer: string; vendor: string; webglVersion: string; maxTextureSize: number } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
                canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      return {
        renderer: 'Software / Unsupported',
        vendor: 'Unknown',
        webglVersion: 'None',
        maxTextureSize: 0,
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let renderer = 'Generic WebGL Accelerator';
    let vendor = 'Generic Vendor';

    if (debugInfo) {
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
    } else {
      renderer = gl.getParameter(gl.RENDERER) || renderer;
      vendor = gl.getParameter(gl.VENDOR) || vendor;
    }

    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    const webglVersion = isWebGL2 ? 'WebGL 2.0' : 'WebGL 1.0';
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;

    return { renderer, vendor, webglVersion, maxTextureSize };
  } catch (err) {
    console.warn('Failed to extract GPU info:', err);
    return {
      renderer: 'WebGL Restricted / Sandboxed',
      vendor: 'Unknown',
      webglVersion: 'Unknown',
      maxTextureSize: 2048,
    };
  }
}

/**
 * Estimates the display refresh rate by measuring 30 consecutive rAF delta intervals.
 */
export function estimateRefreshRate(): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    const targetFrames = 35;
    let startTime = 0;
    const deltas: number[] = [];

    function measure(time: DOMHighResTimeStamp) {
      if (frameCount === 0) {
        startTime = time;
      } else {
        deltas.push(time - startTime);
        startTime = time;
      }

      frameCount++;
      if (frameCount < targetFrames) {
        requestAnimationFrame(measure);
      } else {
        // Drop first 5 warmup frames and compute median
        const cleanDeltas = deltas.slice(5).sort((a, b) => a - b);
        const medianDelta = cleanDeltas[Math.floor(cleanDeltas.length / 2)] || 16.66;
        const rawHz = 1000 / medianDelta;

        // Bucket to standard refresh rates
        let hz = Math.round(rawHz);
        if (hz < 30) hz = 60; // Headless/background throttled rAF fallback
        else if (Math.abs(hz - 60) <= 4) hz = 60;
        else if (Math.abs(hz - 75) <= 3) hz = 75;
        else if (Math.abs(hz - 90) <= 3) hz = 90;
        else if (Math.abs(hz - 120) <= 4) hz = 120;
        else if (Math.abs(hz - 144) <= 4) hz = 144;
        else if (Math.abs(hz - 165) <= 4) hz = 165;
        else if (Math.abs(hz - 240) <= 6) hz = 240;
        else if (Math.abs(hz - 360) <= 8) hz = 360;

        resolve(hz);
      }
    }

    requestAnimationFrame(measure);
  });
}

/**
 * Collects complete device hardware and platform specs.
 */
export async function getHardwareProfile(): Promise<HardwareProfile> {
  if (cachedProfile) return cachedProfile;

  const gpu = getGpuInfo();
  const screenRefreshRate = await estimateRefreshRate();
  const nav = navigator as any;

  cachedProfile = {
    gpuRenderer: gpu.renderer,
    gpuVendor: gpu.vendor,
    cores: nav.hardwareConcurrency || 4,
    deviceMemoryGb: nav.deviceMemory || undefined,
    screenRefreshRate,
    dpr: Number((window.devicePixelRatio || 1).toFixed(2)),
    userAgent: navigator.userAgent,
    webglVersion: gpu.webglVersion,
    maxTextureSize: gpu.maxTextureSize,
  };

  return cachedProfile;
}

/**
 * Returns current memory heap usage if supported (Chromium / Blink).
 */
export function getMemoryStats(): { usedMb?: number; limitMb?: number; totalMb?: number } {
  const perf = window.performance as any;
  if (perf && perf.memory) {
    return {
      usedMb: Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)),
      totalMb: Math.round(perf.memory.totalJSHeapSize / (1024 * 1024)),
      limitMb: Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024)),
    };
  }
  return {};
}
