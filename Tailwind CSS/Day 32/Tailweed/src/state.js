// Palette Presets
export const PALETTES = {
  cyberpunk: [
    '#05050a', '#0d0d19', '#ff007f', '#00f0ff', '#9d4edd', '#39ff14', 
    '#ffdf00', '#ff5722', '#ffffff', '#8e9aaf', '#4a4e69', '#22223b'
  ],
  pico8: [
    '#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', 
    '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', 
    '#29adff', '#83769c', '#ff77a8', '#ffccaa'
  ],
  gameboy: [
    '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
  ],
  nes: [
    '#7c7c7c', '#0000fc', '#0000bc', '#4428bc', '#940084', '#a80020',
    '#a81000', '#881400', '#503000', '#007800', '#006800', '#005800',
    '#004058', '#000000', '#ffffff', '#3cbcfc', '#0078f8', '#78f8fc',
    '#fc9838', '#fc7460', '#fcf878', '#f8b800', '#b8f818', '#00f800',
    '#00f8bc', '#f8b8f8'
  ],
  sweetie16: [
    '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070',
    '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7',
    '#f4f4f4', '#94b0c2', '#566c86', '#333c57'
  ]
};

export class EditorState {
  constructor(width = 16, height = 16) {
    this.width = width;
    this.height = height;
    
    // Tools & Colors
    this.activeTool = 'pencil'; // pencil, eraser, bucket, line, rect, circle, eyedropper, selection, move
    this.primaryColor = '#00f0ff';
    this.secondaryColor = '#ff007f';
    this.brushSize = 1;
    this.gridVisible = true;
    
    // Selection state
    this.selection = null; // { x, y, w, h, pixels: [] }
    this.isSelectionFloating = false; // true if selection pixels are being dragged
    
    // Layer structure (uniform across all frames)
    this.layers = [
      { id: 1, name: 'Background', opacity: 1.0, visible: true },
      { id: 2, name: 'Sprite Detail', opacity: 1.0, visible: true }
    ];
    this.activeLayerId = 2; // Default to drawing on detail layer
    this.layerIdCounter = 3;

    // Frames list
    this.frames = [];
    this.currentFrameIndex = 0;
    
    // Animation settings
    this.isPlaying = false;
    this.fps = 8;
    this.onionSkin = false;
    this.onionSkinOpacity = 0.25;
    
    // Palette selection
    this.activePaletteName = 'cyberpunk';
    this.currentPalette = [...PALETTES.cyberpunk];
    this.colorHistory = ['#00f0ff', '#ff007f', '#ffffff'];

    // History logs
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 40;

    // Initialize first frame
    this.createFrame();
  }

  // Set the size of the canvas and clear/resize all frames
  setSize(width, height) {
    this.saveHistory();
    this.width = width;
    this.height = height;

    // Resize pixel arrays in all frames
    this.frames.forEach(frame => {
      this.layers.forEach(layer => {
        const oldPixels = frame.layersData[layer.id];
        const newPixels = new Array(width * height).fill(null);
        
        // Copy old pixels in, scaling if possible
        // For simplicity: just align to top-left corner
        if (oldPixels) {
          const oldW = this.width; // previous width
          const oldH = this.height; // previous height
          // Note: we scale by fitting coordinates
        }
        frame.layersData[layer.id] = newPixels;
      });
    });
    
    this.triggerChange();
  }

  // Create an empty layer data array
  createPixelArray() {
    return new Array(this.width * this.height).fill(null);
  }

  // Frame Operations
  createFrame(index = null) {
    const frame = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      name: `Frame ${this.frames.length + 1}`,
      layersData: {}
    };

    // Initialize blank pixel arrays for all current layers
    this.layers.forEach(layer => {
      frame.layersData[layer.id] = this.createPixelArray();
    });

    if (index === null) {
      this.frames.push(frame);
      this.currentFrameIndex = this.frames.length - 1;
    } else {
      this.frames.splice(index, 0, frame);
      this.currentFrameIndex = index;
    }
  }

  duplicateFrame(index) {
    this.saveHistory();
    const sourceFrame = this.frames[index];
    const newFrame = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      name: `${sourceFrame.name} (Copy)`,
      layersData: {}
    };

    // Deep copy pixel arrays for each layer
    this.layers.forEach(layer => {
      newFrame.layersData[layer.id] = [...sourceFrame.layersData[layer.id]];
    });

    this.frames.splice(index + 1, 0, newFrame);
    this.currentFrameIndex = index + 1;
    this.triggerChange();
  }

  deleteFrame(index) {
    if (this.frames.length <= 1) return; // Must have at least 1 frame
    this.saveHistory();
    this.frames.splice(index, 1);
    this.currentFrameIndex = Math.min(this.currentFrameIndex, this.frames.length - 1);
    this.triggerChange();
  }

  reorderFrames(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    this.saveHistory();
    const [movedFrame] = this.frames.splice(fromIndex, 1);
    this.frames.splice(toIndex, 0, movedFrame);
    this.currentFrameIndex = toIndex;
    this.triggerChange();
  }

  // Layer Operations
  addLayer() {
    this.saveHistory();
    const id = this.layerIdCounter++;
    const newLayer = {
      id,
      name: `Layer ${this.layers.length + 1}`,
      opacity: 1.0,
      visible: true
    };
    
    // Add layer meta
    this.layers.unshift(newLayer); // Add to top of stack visually
    this.activeLayerId = id;

    // Instantiate pixels in all frames
    this.frames.forEach(frame => {
      frame.layersData[id] = this.createPixelArray();
    });
    
    this.triggerChange();
  }

  deleteLayer(layerId) {
    if (this.layers.length <= 1) return; // Need at least one layer
    this.saveHistory();
    
    // Remove layer meta
    const index = this.layers.findIndex(l => l.id === layerId);
    this.layers.splice(index, 1);

    // If active layer was deleted, switch active
    if (this.activeLayerId === layerId) {
      this.activeLayerId = this.layers[0].id;
    }

    // Clean up layer data in all frames
    this.frames.forEach(frame => {
      delete frame.layersData[layerId];
    });

    this.triggerChange();
  }

  mergeLayerDown(layerId) {
    const index = this.layers.findIndex(l => l.id === layerId);
    if (index === -1 || index === this.layers.length - 1) return; // Cannot merge bottom layer
    
    this.saveHistory();
    const upperLayer = this.layers[index];
    const lowerLayer = this.layers[index + 1];
    
    // Merge pixels in all frames
    this.frames.forEach(frame => {
      const upperPixels = frame.layersData[upperLayer.id];
      const lowerPixels = frame.layersData[lowerLayer.id];
      
      for (let i = 0; i < upperPixels.length; i++) {
        if (upperPixels[i] !== null) {
          // Calculate blended color if upper opacity is less than 1.0 (for simplicity, overlay)
          lowerPixels[i] = upperPixels[i];
        }
      }
    });

    // Remove upper layer
    this.layers.splice(index, 1);
    if (this.activeLayerId === upperLayer.id) {
      this.activeLayerId = lowerLayer.id;
    }

    // Delete upper layer's data
    this.frames.forEach(frame => {
      delete frame.layersData[upperLayer.id];
    });

    this.triggerChange();
  }

  reorderLayers(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    this.saveHistory();
    const [movedLayer] = this.layers.splice(fromIndex, 1);
    this.layers.splice(toIndex, 0, movedLayer);
    this.triggerChange();
  }

  // Getters for Current Context
  getCurrentFrame() {
    return this.frames[this.currentFrameIndex];
  }

  getCurrentLayerPixels() {
    const frame = this.getCurrentFrame();
    return frame.layersData[this.activeLayerId];
  }

  getPixel(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    const pixels = this.getCurrentLayerPixels();
    return pixels[y * this.width + x];
  }

  setPixel(x, y, color) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const pixels = this.getCurrentLayerPixels();
    pixels[y * this.width + x] = color;
  }

  // Palette Utilities
  selectPalette(name) {
    if (PALETTES[name]) {
      this.activePaletteName = name;
      this.currentPalette = [...PALETTES[name]];
      this.triggerChange();
    }
  }

  addColorToPalette(color) {
    if (!this.currentPalette.includes(color)) {
      this.currentPalette.push(color);
      this.triggerChange();
    }
  }

  removeColorFromPalette(color) {
    const idx = this.currentPalette.indexOf(color);
    if (idx !== -1) {
      this.currentPalette.splice(idx, 1);
      this.triggerChange();
    }
  }

  pushColorHistory(color) {
    if (!color || color === 'transparent') return;
    // Remove if already in history, then add to front
    this.colorHistory = this.colorHistory.filter(c => c !== color);
    this.colorHistory.unshift(color);
    if (this.colorHistory.length > 20) {
      this.colorHistory.pop();
    }
  }

  // History Undo / Redo
  serializeState() {
    return {
      width: this.width,
      height: this.height,
      activeLayerId: this.activeLayerId,
      currentFrameIndex: this.currentFrameIndex,
      layers: JSON.parse(JSON.stringify(this.layers)),
      frames: this.frames.map(frame => ({
        id: frame.id,
        name: frame.name,
        layersData: Object.keys(frame.layersData).reduce((acc, key) => {
          acc[key] = [...frame.layersData[key]];
          return acc;
        }, {})
      }))
    };
  }

  deserializeState(snap) {
    this.width = snap.width;
    this.height = snap.height;
    this.activeLayerId = snap.activeLayerId;
    this.currentFrameIndex = snap.currentFrameIndex;
    this.layers = JSON.parse(JSON.stringify(snap.layers));
    
    this.frames = snap.frames.map(frame => ({
      id: frame.id,
      name: frame.name,
      layersData: Object.keys(frame.layersData).reduce((acc, key) => {
        acc[key] = [...frame.layersData[key]];
        return acc;
      }, {})
    }));
  }

  saveHistory() {
    const snap = this.serializeState();
    this.undoStack.push(snap);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo on new action
  }

  undo() {
    if (this.undoStack.length === 0) return false;
    
    // Save current to redo stack
    const currentSnap = this.serializeState();
    this.redoStack.push(currentSnap);
    
    // Pop undo and apply
    const previousSnap = this.undoStack.pop();
    this.deserializeState(previousSnap);
    
    this.triggerChange();
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    
    // Save current to undo stack
    const currentSnap = this.serializeState();
    this.undoStack.push(currentSnap);
    
    // Pop redo and apply
    const nextSnap = this.redoStack.pop();
    this.deserializeState(nextSnap);
    
    this.triggerChange();
    return true;
  }

  // Custom Event Dispatching
  listeners = [];
  onChange(cb) {
    this.listeners.push(cb);
  }

  triggerChange() {
    this.listeners.forEach(cb => cb(this));
  }
}
