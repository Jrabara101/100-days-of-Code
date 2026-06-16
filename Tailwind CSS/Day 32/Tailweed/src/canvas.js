import { EditorState } from './state.js';

export class CanvasController {
  constructor(viewport, container, canvas, state) {
    this.viewport = viewport;
    this.container = container;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;

    // Viewport transform states
    this.zoom = 24; // Scale factor (pixel size)
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;

    // Drawing states
    this.isDrawing = false;
    this.drawStartX = 0;
    this.drawStartY = 0;
    this.lastDrawX = null;
    this.lastDrawY = null;
    
    // Selection floating position / copy buffer
    this.floatingSelection = null; // { x, y, w, h, pixels: [] }
    this.isMovingSelection = false;
    this.moveSelStartX = 0;
    this.moveSelStartY = 0;
    this.moveSelCurrentX = 0;
    this.moveSelCurrentY = 0;

    // Preview grid overlay
    this.gridCanvas = document.createElement('canvas');
    this.gridCtx = this.gridCanvas.getContext('2d');
    this.gridCanvas.className = 'absolute inset-0 pointer-events-none';
    this.container.appendChild(this.gridCanvas);

    // Bind event handlers
    this.initEvents();
    
    // Initial centering
    this.centerCanvas();
    this.render();
  }

  // Centering the canvas inside the viewport
  centerCanvas() {
    const vRect = this.viewport.getBoundingClientRect();
    const cWidth = this.state.width * this.zoom;
    const cHeight = this.state.height * this.zoom;
    
    this.panX = Math.round((vRect.width - cWidth) / 2);
    this.panY = Math.round((vRect.height - cHeight) / 2);
    
    this.updateTransform();
  }

  updateTransform() {
    const w = this.state.width * this.zoom;
    const h = this.state.height * this.zoom;
    
    // Apply sizes
    this.canvas.width = this.state.width;
    this.canvas.height = this.state.height;
    
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.style.imageRendering = 'pixelated';
    
    this.gridCanvas.width = w;
    this.gridCanvas.height = h;
    
    this.container.style.width = `${w}px`;
    this.container.style.height = `${h}px`;
    this.container.style.transform = `translate(${this.panX}px, ${this.panY}px)`;
  }

  initEvents() {
    // Wheel Zoom
    this.viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const oldZoom = this.zoom;
      
      // Target zoom range
      if (e.deltaY < 0) {
        this.zoom = Math.min(64, this.zoom + 1);
      } else {
        this.zoom = Math.max(2, this.zoom - 1);
      }

      if (this.zoom !== oldZoom) {
        // Zoom relative to cursor position
        const rect = this.viewport.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        
        // Adjust pans to anchor zoom to cursor
        this.panX = cursorX - (cursorX - this.panX) * (this.zoom / oldZoom);
        this.panY = cursorY - (cursorY - this.panY) * (this.zoom / oldZoom);
        
        this.updateTransform();
        this.render();
      }
    }, { passive: false });

    // Pointer events for panning and drawing
    this.viewport.addEventListener('pointerdown', (e) => {
      // Spacebar panning key or middle mouse button triggers panning
      if (e.button === 1 || e.shiftKey || this.state.activeTool === 'pan' || this.isSpacePressed) {
        this.isPanning = true;
        this.panStartX = e.clientX - this.panX;
        this.panStartY = e.clientY - this.panY;
        this.viewport.setPointerCapture(e.pointerId);
        return;
      }

      if (e.button === 0) {
        // Left-click
        const coords = this.getCoords(e);
        if (!coords) return;
        
        // If clicking inside active selection and tool is selection/move, start drag moving
        if (this.state.selection && this.isInsideSelection(coords.x, coords.y)) {
          this.isMovingSelection = true;
          this.moveSelStartX = coords.x;
          this.moveSelStartY = coords.y;
          this.moveSelCurrentX = coords.x;
          this.moveSelCurrentY = coords.y;
          this.state.saveHistory();
          this.viewport.setPointerCapture(e.pointerId);
          return;
        }

        this.isDrawing = true;
        this.drawStartX = coords.x;
        this.drawStartY = coords.y;
        this.lastDrawX = coords.x;
        this.lastDrawY = coords.y;

        this.state.saveHistory();
        this.handleToolAction(coords.x, coords.y, false);
        this.viewport.setPointerCapture(e.pointerId);
      }
    });

    this.viewport.addEventListener('pointermove', (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.panStartX;
        this.panY = e.clientY - this.panStartY;
        this.updateTransform();
        return;
      }

      const coords = this.getCoords(e);
      if (!coords) return;

      if (this.isMovingSelection) {
        const dx = coords.x - this.moveSelStartX;
        const dy = coords.y - this.moveSelStartY;
        if (dx !== 0 || dy !== 0) {
          this.moveSelection(dx, dy);
          this.moveSelStartX = coords.x;
          this.moveSelStartY = coords.y;
        }
        return;
      }

      if (this.isDrawing) {
        this.handleToolAction(coords.x, coords.y, true);
        this.lastDrawX = coords.x;
        this.lastDrawY = coords.y;
      } else {
        // Show brush/coordinates preview on hovering
        this.renderHoverPreview(coords.x, coords.y);
      }
    });

    this.viewport.addEventListener('pointerup', (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        this.viewport.releasePointerCapture(e.pointerId);
        return;
      }

      if (this.isMovingSelection) {
        this.isMovingSelection = false;
        this.viewport.releasePointerCapture(e.pointerId);
        this.state.triggerChange();
        return;
      }

      if (this.isDrawing) {
        this.isDrawing = false;
        this.viewport.releasePointerCapture(e.pointerId);
        
        const coords = this.getCoords(e);
        if (coords) {
          this.finalizeToolAction(coords.x, coords.y);
        }
        this.state.triggerChange();
      }
    });

    // Spacebar listening for pan toggling
    this.isSpacePressed = false;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
        this.isSpacePressed = true;
        this.viewport.classList.add('cursor-grab');
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        this.viewport.classList.remove('cursor-grab');
      }
    });
  }

  // Get grid coordinates under pointer
  getCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / this.state.width));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / this.state.height));
    
    if (x >= 0 && x < this.state.width && y >= 0 && y < this.state.height) {
      return { x, y };
    }
    return null;
  }

  isInsideSelection(x, y) {
    if (!this.state.selection) return false;
    const { sx, sy, sw, sh } = this.state.selection;
    return x >= sx && x < sx + sw && y >= sy && y < sy + sh;
  }

  // Standard Tool Handlers
  handleToolAction(x, y, isDrag) {
    const color = this.state.primaryColor;
    const tool = this.state.activeTool;

    switch (tool) {
      case 'pencil':
        this.drawBrush(x, y, color);
        break;
      case 'eraser':
        this.drawBrush(x, y, null);
        break;
      case 'eyedropper':
        this.pickColor(x, y);
        break;
      case 'bucket':
        if (!isDrag) this.floodFill(x, y, color);
        break;
      case 'line':
      case 'rect':
      case 'circle':
      case 'selection':
        // Shapes are drawn dynamically on top as preview, finalized on pointerup
        this.renderPreviewShape(x, y);
        break;
    }
  }

  finalizeToolAction(x, y) {
    const color = this.state.primaryColor;
    const tool = this.state.activeTool;

    switch (tool) {
      case 'line':
        const linePoints = this.getLinePoints(this.drawStartX, this.drawStartY, x, y);
        linePoints.forEach(p => this.state.setPixel(p.x, p.y, color));
        break;
      case 'rect':
        const rectPoints = this.getRectPoints(this.drawStartX, this.drawStartY, x, y);
        rectPoints.forEach(p => this.state.setPixel(p.x, p.y, color));
        break;
      case 'circle':
        const circlePoints = this.getCirclePoints(this.drawStartX, this.drawStartY, x, y);
        circlePoints.forEach(p => this.state.setPixel(p.x, p.y, color));
        break;
      case 'selection':
        const sx = Math.min(this.drawStartX, x);
        const sy = Math.min(this.drawStartY, y);
        const sw = Math.abs(x - this.drawStartX) + 1;
        const sh = Math.abs(y - this.drawStartY) + 1;
        
        // Crop current pixels from selection bounds
        const pixels = [];
        const layerPixels = this.state.getCurrentLayerPixels();
        
        for (let j = 0; j < sh; j++) {
          for (let i = 0; i < sw; i++) {
            const px = sx + i;
            const py = sy + j;
            const idx = py * this.state.width + px;
            pixels.push(layerPixels[idx]);
          }
        }

        this.state.selection = { sx, sy, sw, sh, pixels };
        break;
    }
    this.render();
  }

  // Draw brush considering size
  drawBrush(x, y, color) {
    const size = this.state.brushSize;
    const offset = Math.floor(size / 2);

    for (let dy = -offset; dy < size - offset; dy++) {
      for (let dx = -offset; dx < size - offset; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < this.state.width && py >= 0 && py < this.state.height) {
          this.state.setPixel(px, py, color);
        }
      }
    }
    
    // Draw a continuous line to prevent gaps when dragging fast
    if (this.lastDrawX !== null && this.lastDrawY !== null && (this.lastDrawX !== x || this.lastDrawY !== y)) {
      const interp = this.getLinePoints(this.lastDrawX, this.lastDrawY, x, y);
      interp.forEach(pt => {
        for (let dy = -offset; dy < size - offset; dy++) {
          for (let dx = -offset; dx < size - offset; dx++) {
            const px = pt.x + dx;
            const py = pt.y + dy;
            if (px >= 0 && px < this.state.width && py >= 0 && py < this.state.height) {
              this.state.setPixel(px, py, color);
            }
          }
        }
      });
    }
    
    this.render();
  }

  pickColor(x, y) {
    // Go top to bottom in layers to find first visible color
    for (let i = 0; i < this.state.layers.length; i++) {
      const layer = this.state.layers[i];
      if (!layer.visible) continue;
      const frame = this.state.getCurrentFrame();
      const color = frame.layersData[layer.id][y * this.state.width + x];
      if (color) {
        this.state.primaryColor = color;
        this.state.pushColorHistory(color);
        this.state.triggerChange();
        break;
      }
    }
  }

  floodFill(startX, startY, fillColor) {
    const pixels = this.state.getCurrentLayerPixels();
    const targetColor = pixels[startY * this.state.width + startX];
    if (targetColor === fillColor) return;

    const width = this.state.width;
    const height = this.state.height;
    const queue = [[startX, startY]];
    const visited = new Set();

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const idx = cy * width + cx;
      if (pixels[idx] === targetColor) {
        pixels[idx] = fillColor;

        if (cx > 0) queue.push([cx - 1, cy]);
        if (cx < width - 1) queue.push([cx + 1, cy]);
        if (cy > 0) queue.push([cx, cy - 1]);
        if (cy < height - 1) queue.push([cx, cy + 1]);
      }
    }
    
    this.render();
  }

  moveSelection(dx, dy) {
    if (!this.state.selection) return;
    const { sx, sy, sw, sh, pixels } = this.state.selection;
    const layerPixels = this.state.getCurrentLayerPixels();
    
    // Clear original region in state
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const px = sx + i;
        const py = sy + j;
        if (px >= 0 && px < this.state.width && py >= 0 && py < this.state.height) {
          const idx = py * this.state.width + px;
          // Only clear if the pixel is identical to selection (handling overlaps safely)
          layerPixels[idx] = null;
        }
      }
    }

    // Apply offset
    const nsx = sx + dx;
    const nsy = sy + dy;

    // Stamp selection pixels down at new location
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const px = nsx + i;
        const py = nsy + j;
        if (px >= 0 && px < this.state.width && py >= 0 && py < this.state.height) {
          const idx = py * this.state.width + px;
          const selColor = pixels[j * sw + i];
          if (selColor !== null) {
            layerPixels[idx] = selColor;
          }
        }
      }
    }

    // Move boundary box
    this.state.selection.sx = nsx;
    this.state.selection.sy = nsy;

    this.render();
  }

  // Algorithms for Line / Rect / Circle
  getLinePoints(x0, y0, x1, y1) {
    const pts = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
      pts.push({ x: x0, y: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    return pts;
  }

  getRectPoints(x0, y0, x1, y1) {
    const pts = [];
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        // Outer boundaries outline
        if (x === minX || x === maxX || y === minY || y === maxY) {
          pts.push({ x, y });
        }
      }
    }
    return pts;
  }

  getCirclePoints(x0, y0, x1, y1) {
    const pts = [];
    const r = Math.round(Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)));
    if (r === 0) return [{ x: x0, y: y0 }];

    const r2 = r * r;
    const rMin2 = Math.pow(r - 0.75, 2);
    const rMax2 = Math.pow(r + 0.75, 2);

    for (let x = x0 - r; x <= x0 + r; x++) {
      for (let y = y0 - r; y <= y0 + r; y++) {
        const dist2 = Math.pow(x - x0, 2) + Math.pow(y - y0, 2);
        if (dist2 >= rMin2 && dist2 <= rMax2) {
          pts.push({ x, y });
        }
      }
    }
    return pts;
  }

  // Renders the layers on the canvas
  render() {
    this.ctx.clearRect(0, 0, this.state.width, this.state.height);
    
    // 1. Render Onion Skin (Previous frame and Next frame)
    if (this.state.onionSkin && this.state.frames.length > 1 && !this.state.isPlaying) {
      this.renderOnionSkin();
    }

    // 2. Render all visible active layers of current frame (bottom to top)
    const frame = this.state.getCurrentFrame();
    for (let i = this.state.layers.length - 1; i >= 0; i--) {
      const layer = this.state.layers[i];
      if (!layer.visible) continue;
      
      const pixels = frame.layersData[layer.id];
      if (!pixels) continue;

      this.ctx.globalAlpha = layer.opacity;
      for (let y = 0; y < this.state.height; y++) {
        for (let x = 0; x < this.state.width; x++) {
          const color = pixels[y * this.state.width + x];
          if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, 1 * y, 1, 1);
          }
        }
      }
    }
    this.ctx.globalAlpha = 1.0;

    // 3. Render grid lines
    this.renderGrid();
  }

  renderOnionSkin() {
    const curIdx = this.state.currentFrameIndex;
    
    // Draw previous frame in red tints
    if (curIdx > 0) {
      this.ctx.globalAlpha = this.state.onionSkinOpacity;
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      const prevFrame = this.state.frames[curIdx - 1];
      this.renderFrameOntoCanvas(prevFrame);
    }
    
    // Draw next frame in green tints
    if (curIdx < this.state.frames.length - 1) {
      this.ctx.globalAlpha = this.state.onionSkinOpacity;
      this.ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
      const nextFrame = this.state.frames[curIdx + 1];
      this.renderFrameOntoCanvas(nextFrame);
    }
    this.ctx.globalAlpha = 1.0;
  }

  renderFrameOntoCanvas(frame) {
    for (let i = this.state.layers.length - 1; i >= 0; i--) {
      const layer = this.state.layers[i];
      if (!layer.visible) continue;
      const pixels = frame.layersData[layer.id];
      if (!pixels) continue;
      
      for (let y = 0; y < this.state.height; y++) {
        for (let x = 0; x < this.state.width; x++) {
          if (pixels[y * this.state.width + x]) {
            this.ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
  }

  renderGrid() {
    this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    if (!this.state.gridVisible || this.zoom < 6) return;

    this.gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.gridCtx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 1; x < this.state.width; x++) {
      const posX = x * this.zoom;
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(posX, 0);
      this.gridCtx.lineTo(posX, this.gridCanvas.height);
      this.gridCtx.stroke();
    }

    // Horizontal grid lines
    for (let y = 1; y < this.state.height; y++) {
      const posY = y * this.zoom;
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(0, posY);
      this.gridCtx.lineTo(this.gridCanvas.width, posY);
      this.gridCtx.stroke();
    }

    // Draw active selection border (marching ants)
    if (this.state.selection) {
      const { sx, sy, sw, sh } = this.state.selection;
      this.gridCtx.strokeStyle = 'var(--neon-cyan)';
      this.gridCtx.lineWidth = 2;
      this.gridCtx.setLineDash([4, 4]);
      this.gridCtx.lineDashOffset = (Date.now() / 100) % 8;
      this.gridCtx.strokeRect(sx * this.zoom, sy * this.zoom, sw * this.zoom, sh * this.zoom);
      this.gridCtx.setLineDash([]);
      
      // Request redraw of selection outline animation
      requestAnimationFrame(() => this.renderGrid());
    }
  }

  // Draw temporary overlay guides during click & drag shapes
  renderPreviewShape(endX, endY) {
    this.render(); // Redraw base layers
    
    const color = this.state.primaryColor;
    const tool = this.state.activeTool;
    this.ctx.fillStyle = color;

    if (tool === 'line') {
      const pts = this.getLinePoints(this.drawStartX, this.drawStartY, endX, endY);
      pts.forEach(p => this.ctx.fillRect(p.x, p.y, 1, 1));
    } else if (tool === 'rect') {
      const pts = this.getRectPoints(this.drawStartX, this.drawStartY, endX, endY);
      pts.forEach(p => this.ctx.fillRect(p.x, p.y, 1, 1));
    } else if (tool === 'circle') {
      const pts = this.getCirclePoints(this.drawStartX, this.drawStartY, endX, endY);
      pts.forEach(p => this.ctx.fillRect(p.x, p.y, 1, 1));
    } else if (tool === 'selection') {
      // Draw temporary marquee box
      const sx = Math.min(this.drawStartX, endX);
      const sy = Math.min(this.drawStartY, endY);
      const sw = Math.abs(endX - this.drawStartX) + 1;
      const sh = Math.abs(endY - this.drawStartY) + 1;
      
      this.gridCtx.strokeStyle = '#ff007f';
      this.gridCtx.lineWidth = 1.5;
      this.gridCtx.strokeRect(sx * this.zoom, sy * this.zoom, sw * this.zoom, sh * this.zoom);
    }
  }

  renderHoverPreview(x, y) {
    this.renderGrid();
    if (this.state.activeTool === 'selection' || this.state.activeTool === 'pan' || this.isSpacePressed) return;
    
    // Draw hollow cyan square at cursor index
    const size = this.state.brushSize;
    const offset = Math.floor(size / 2);
    
    this.gridCtx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    this.gridCtx.lineWidth = 1.5;
    
    const px = (x - offset) * this.zoom;
    const py = (y - offset) * this.zoom;
    const pSize = size * this.zoom;
    
    this.gridCtx.strokeRect(px, py, pSize, pSize);
  }
}
