import { EditorState } from './state.js';
import { CanvasController } from './canvas.js';
import { GamePreviewSimulator } from './gamePreview.js';

// Instantiate Core State
const state = new EditorState(16, 16);

// Viewport and Canvas elements
const viewport = document.getElementById('canvas-viewport');
const canvasContainer = document.getElementById('canvas-container');
const editorCanvas = document.getElementById('editor-canvas');

// Initialize Canvas Engine
const canvasController = new CanvasController(viewport, canvasContainer, editorCanvas, state);

// Initialize Game Simulator
const gameCanvas = document.getElementById('game-preview-canvas');
const gameSimulator = new GamePreviewSimulator(gameCanvas, state);

// Animation Playback Interval
let playInterval = null;

// DOM Cache
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnClear = document.getElementById('btn-clear');
const btnImportProject = document.getElementById('btn-import-project');
const btnExportProject = document.getElementById('btn-export-project');
const btnExportSheet = document.getElementById('btn-export-sheet');
const importProjectFile = document.getElementById('import-project-file');

const selectGridSize = document.getElementById('grid-size-select');
const selectBrushSize = document.getElementById('brush-size-select');
const btnToggleGrid = document.getElementById('btn-toggle-grid');
const btnShowHelp = document.getElementById('btn-show-help');
const btnCloseHelp = document.getElementById('btn-close-help');
const dialogHelp = document.getElementById('dialog-help');

const selectPalettePreset = document.getElementById('palette-preset-select');
const inputColorPrimary = document.getElementById('input-color-primary');
const inputColorSecondary = document.getElementById('input-color-secondary');
const labelColorHex = document.getElementById('label-color-hex');
const btnAddPaletteColor = document.getElementById('btn-add-palette-color');
const paletteGrid = document.getElementById('palette-grid');
const paletteHistory = document.getElementById('palette-history');

const layersList = document.getElementById('layers-list');
const btnAddLayer = document.getElementById('btn-add-layer');

const btnPlayAnim = document.getElementById('btn-play-anim');
const sliderFps = document.getElementById('slider-fps');
const labelFps = document.getElementById('label-fps');
const checkboxOnion = document.getElementById('checkbox-onion');
const sliderOnionOpacity = document.getElementById('slider-onion-opacity');
const btnAddFrame = document.getElementById('btn-add-frame');
const timelineFrames = document.getElementById('timeline-frames');

const statusCoords = document.getElementById('status-coords');
const statusZoom = document.getElementById('status-zoom');
const statusLayer = document.getElementById('status-layer');
const statusFrame = document.getElementById('status-frame');

const dialogCustomSize = document.getElementById('dialog-custom-size');
const btnCustomSizeCancel = document.getElementById('btn-custom-size-cancel');
const btnCustomSizeApply = document.getElementById('btn-custom-size-apply');
const inputCustomW = document.getElementById('input-custom-w');
const inputCustomH = document.getElementById('input-custom-h');

// Initialize UI
function init() {
  setupEventListeners();
  updatePaletteUI();
  updateLayersUI();
  updateTimelineUI();
  updateToolsUI();
  
  // Connect state change listener
  state.onChange(() => {
    canvasController.render();
    updateUIElements();
  });
}

// Global UI Updater
function updateUIElements() {
  // Update undo/redo button states
  btnUndo.disabled = state.undoStack.length === 0;
  btnUndo.style.opacity = state.undoStack.length === 0 ? '0.4' : '1';
  btnRedo.disabled = state.redoStack.length === 0;
  btnRedo.style.opacity = state.redoStack.length === 0 ? '0.4' : '1';

  // Update status bar texts
  statusZoom.textContent = `${canvasController.zoom}x`;
  
  const currentFrame = state.getCurrentFrame();
  statusFrame.textContent = currentFrame ? currentFrame.name : 'None';
  
  const activeLayerObj = state.layers.find(l => l.id === state.activeLayerId);
  statusLayer.textContent = activeLayerObj ? activeLayerObj.name : 'None';

  // Colors Hex label
  labelColorHex.textContent = state.primaryColor;
  inputColorPrimary.value = state.primaryColor;
  inputColorSecondary.value = state.secondaryColor;

  // Refresh lists
  updatePaletteUI();
  updateLayersUI();
  updateTimelineUI();
}

// Tool button selections UI highlighting
function updateToolsUI() {
  const toolButtons = document.querySelectorAll('.tool-btn');
  toolButtons.forEach(btn => {
    const btnTool = btn.dataset.tool;
    if (btnTool === state.activeTool) {
      btn.classList.add('tool-active');
    } else {
      btn.classList.remove('tool-active');
    }
  });
}

// Render dynamic color palette lists
function updatePaletteUI() {
  // Preset Palette Grid
  paletteGrid.innerHTML = '';
  state.currentPalette.forEach(color => {
    const cell = document.createElement('button');
    cell.className = `w-7 h-7 rounded border border-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0 relative`;
    cell.style.backgroundColor = color;
    
    // Highlight if primary color matches
    if (color.toLowerCase() === state.primaryColor.toLowerCase()) {
      cell.classList.add('ring-2', 'ring-[#00f0ff]', 'border-white');
    }

    cell.addEventListener('click', () => {
      state.primaryColor = color;
      state.pushColorHistory(color);
      state.triggerChange();
    });

    cell.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      state.secondaryColor = color;
      state.triggerChange();
    });

    paletteGrid.appendChild(cell);
  });

  // History Palette
  paletteHistory.innerHTML = '';
  state.colorHistory.forEach(color => {
    const cell = document.createElement('button');
    cell.className = `w-5 h-5 rounded border border-slate-800 transition-all hover:scale-105 cursor-pointer`;
    cell.style.backgroundColor = color;
    
    if (color.toLowerCase() === state.primaryColor.toLowerCase()) {
      cell.classList.add('ring-1', 'ring-[#00f0ff]');
    }

    cell.addEventListener('click', () => {
      state.primaryColor = color;
      state.triggerChange();
    });
    paletteHistory.appendChild(cell);
  });
}

// Generate image thumbnail data URL for a frame
function getFrameThumbnail(frame) {
  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.width = state.width;
  thumbnailCanvas.height = state.height;
  const tCtx = thumbnailCanvas.getContext('2d');

  // Draw layers bottom to top
  for (let i = state.layers.length - 1; i >= 0; i--) {
    const layer = state.layers[i];
    if (!layer.visible) continue;
    
    const pixels = frame.layersData[layer.id];
    if (!pixels) continue;
    
    tCtx.globalAlpha = layer.opacity;
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const color = pixels[y * state.width + x];
        if (color) {
          tCtx.fillStyle = color;
          tCtx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
  return thumbnailCanvas.toDataURL();
}

// Render Layers stack UI panel
function updateLayersUI() {
  layersList.innerHTML = '';
  state.layers.forEach((layer, idx) => {
    const item = document.createElement('div');
    item.className = `flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
      layer.id === state.activeLayerId 
        ? 'border-[#9d4edd]/50 bg-[#9d4edd]/10' 
        : 'border-slate-800 bg-[#0e0e1a]/40 hover:bg-[#0e0e1a]'
    }`;

    // Left Section: Click selection & Name
    const titleSec = document.createElement('button');
    titleSec.className = 'flex-1 text-left font-sans font-semibold text-slate-200 outline-none truncate';
    titleSec.textContent = layer.name;
    titleSec.addEventListener('click', () => {
      state.activeLayerId = layer.id;
      state.triggerChange();
    });

    // Middle/Right controls
    const controls = document.createElement('div');
    controls.className = 'flex items-center gap-2 flex-shrink-0';

    // Visibility Eye toggle
    const btnVisible = document.createElement('button');
    btnVisible.className = `p-1 rounded text-slate-400 hover:text-white transition-all`;
    btnVisible.innerHTML = layer.visible
      ? `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`
      : `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`;
    
    btnVisible.addEventListener('click', (e) => {
      e.stopPropagation();
      layer.visible = !layer.visible;
      state.triggerChange();
    });

    // Opacity range slider
    const opSlider = document.createElement('input');
    opSlider.type = 'range';
    opSlider.min = '0.0';
    opSlider.max = '1.0';
    opSlider.step = '0.05';
    opSlider.value = layer.opacity;
    opSlider.className = 'w-10 accent-[#9d4edd] cursor-pointer';
    opSlider.addEventListener('input', (e) => {
      layer.opacity = parseFloat(e.target.value);
      state.triggerChange();
    });

    // Action Dropdown / Trash/ Merge
    const btnMerge = document.createElement('button');
    btnMerge.className = `p-1 rounded text-slate-500 hover:text-slate-200 transition-all`;
    btnMerge.title = 'Merge Down';
    btnMerge.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 13l-7 7-7-7m14-6l-7 7-7-7"/></svg>`;
    btnMerge.disabled = idx === state.layers.length - 1;
    if (idx === state.layers.length - 1) btnMerge.style.opacity = '0.2';
    btnMerge.addEventListener('click', (e) => {
      e.stopPropagation();
      state.mergeLayerDown(layer.id);
    });

    const btnTrash = document.createElement('button');
    btnTrash.className = `p-1 rounded text-red-500/60 hover:text-red-400 transition-all`;
    btnTrash.title = 'Delete Layer';
    btnTrash.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
    btnTrash.disabled = state.layers.length <= 1;
    if (state.layers.length <= 1) btnTrash.style.opacity = '0.2';
    btnTrash.addEventListener('click', (e) => {
      e.stopPropagation();
      state.deleteLayer(layer.id);
    });

    controls.appendChild(btnVisible);
    controls.appendChild(opSlider);
    controls.appendChild(btnMerge);
    controls.appendChild(btnTrash);

    item.appendChild(titleSec);
    item.appendChild(controls);
    layersList.appendChild(item);
  });
}

// Render Timeline panel
function updateTimelineUI() {
  timelineFrames.innerHTML = '';
  
  state.frames.forEach((frame, idx) => {
    const item = document.createElement('div');
    item.className = `flex flex-col items-center justify-between p-2 rounded-lg border text-xs gap-1 transition-all flex-shrink-0 cursor-pointer ${
      idx === state.currentFrameIndex 
        ? 'border-[#00f0ff]/60 bg-[#00f0ff]/10 glow-cyan/10' 
        : 'border-slate-800 bg-[#0d0d16] hover:bg-slate-800'
    }`;
    item.style.width = '75px';

    // Click to switch frame
    item.addEventListener('click', () => {
      state.currentFrameIndex = idx;
      state.triggerChange();
    });

    // Miniature Preview Canvas Thumbnail
    const thumbImg = document.createElement('img');
    thumbImg.src = getFrameThumbnail(frame);
    thumbImg.className = 'w-10 h-10 border border-slate-700 bg-checkerboard rounded object-contain image-render-pixelated';

    // Title label
    const label = document.createElement('span');
    label.className = 'font-mono text-[9px] text-slate-400 select-none';
    label.textContent = `F: ${idx + 1}`;

    // Control buttons (Clone, Delete)
    const buttonRow = document.createElement('div');
    buttonRow.className = 'flex gap-1 items-center justify-center';

    const btnClone = document.createElement('button');
    btnClone.className = 'p-0.5 rounded bg-slate-800 text-slate-400 hover:text-white';
    btnClone.title = 'Duplicate Frame';
    btnClone.innerHTML = `<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>`;
    btnClone.addEventListener('click', (e) => {
      e.stopPropagation();
      state.duplicateFrame(idx);
    });

    const btnDel = document.createElement('button');
    btnDel.className = 'p-0.5 rounded bg-slate-800 text-red-400 hover:text-red-300';
    btnDel.title = 'Delete Frame';
    btnDel.innerHTML = `<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
    btnDel.disabled = state.frames.length <= 1;
    if (state.frames.length <= 1) btnDel.style.opacity = '0.3';
    btnDel.addEventListener('click', (e) => {
      e.stopPropagation();
      state.deleteFrame(idx);
    });

    buttonRow.appendChild(btnClone);
    buttonRow.appendChild(btnDel);

    item.appendChild(thumbImg);
    item.appendChild(label);
    item.appendChild(buttonRow);
    timelineFrames.appendChild(item);
  });
}

// Setup Event Handlers
function setupEventListeners() {
  // Tools selection click
  const toolButtons = document.querySelectorAll('.tool-btn');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTool = btn.dataset.tool;
      updateToolsUI();
    });
  });

  // Brush Size
  selectBrushSize.addEventListener('change', (e) => {
    state.brushSize = parseInt(e.target.value);
  });

  // Toggle Grid lines
  btnToggleGrid.addEventListener('click', () => {
    state.gridVisible = !state.gridVisible;
    btnToggleGrid.classList.toggle('tool-active', state.gridVisible);
    state.triggerChange();
  });

  // Grid Size selector
  selectGridSize.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      // Show modal
      dialogCustomSize.classList.remove('hidden');
      setTimeout(() => dialogCustomSize.classList.add('opacity-100'), 50);
    } else {
      const size = parseInt(val);
      state.setSize(size, size);
      canvasController.centerCanvas();
    }
  });

  btnCustomSizeCancel.addEventListener('click', () => {
    dialogCustomSize.classList.remove('opacity-100');
    setTimeout(() => dialogCustomSize.classList.add('hidden'), 200);
    selectGridSize.value = state.width.toString();
  });

  btnCustomSizeApply.addEventListener('click', () => {
    const w = parseInt(inputCustomW.value) || 16;
    const h = parseInt(inputCustomH.value) || 16;
    
    // Boundary check
    const cleanW = Math.max(4, Math.min(128, w));
    const cleanH = Math.max(4, Math.min(128, h));

    state.setSize(cleanW, cleanH);
    canvasController.centerCanvas();

    dialogCustomSize.classList.remove('opacity-100');
    setTimeout(() => dialogCustomSize.classList.add('hidden'), 200);
  });

  // Undo / Redo / Clear
  btnUndo.addEventListener('click', () => state.undo());
  btnRedo.addEventListener('click', () => state.redo());
  
  btnClear.addEventListener('click', () => {
    state.saveHistory();
    const activePixels = state.getCurrentLayerPixels();
    activePixels.fill(null);
    state.triggerChange();
  });

  // Palette Preset select
  selectPalettePreset.addEventListener('change', (e) => {
    state.selectPalette(e.target.value);
  });

  // Add custom color to palette
  btnAddPaletteColor.addEventListener('click', () => {
    state.addColorToPalette(state.primaryColor);
  });

  // Dual color pickers
  inputColorPrimary.addEventListener('input', (e) => {
    state.primaryColor = e.target.value;
    state.pushColorHistory(e.target.value);
    state.triggerChange();
  });
  inputColorSecondary.addEventListener('input', (e) => {
    state.secondaryColor = e.target.value;
    state.triggerChange();
  });

  // Layer Management: Add
  btnAddLayer.addEventListener('click', () => {
    state.addLayer();
  });

  // Animation Playback controls
  btnPlayAnim.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    
    const playIcon = `<svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Play</span>`;
    const pauseIcon = `<svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span>Pause</span>`;

    btnPlayAnim.innerHTML = state.isPlaying ? pauseIcon : playIcon;

    if (state.isPlaying) {
      startPlaybackLoop();
    } else {
      stopPlaybackLoop();
    }
  });

  sliderFps.addEventListener('input', (e) => {
    const fps = parseInt(e.target.value);
    state.fps = fps;
    labelFps.textContent = fps;
    if (state.isPlaying) {
      stopPlaybackLoop();
      startPlaybackLoop();
    }
  });

  checkboxOnion.addEventListener('change', (e) => {
    state.onionSkin = e.target.checked;
    state.triggerChange();
  });

  sliderOnionOpacity.addEventListener('input', (e) => {
    state.onionSkinOpacity = parseFloat(e.target.value);
    state.triggerChange();
  });

  btnAddFrame.addEventListener('click', () => {
    state.createFrame();
    state.triggerChange();
  });

  // Canvas Hover Coordinate status
  viewport.addEventListener('mousemove', (e) => {
    const coords = canvasController.getCoords(e);
    if (coords) {
      statusCoords.textContent = `${coords.x}, ${coords.y}`;
    } else {
      statusCoords.textContent = `--,--`;
    }
  });

  // Save/Load Project JSON
  btnExportProject.addEventListener('click', () => {
    const serialized = state.serializeState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serialized));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `pixel_project_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnImportProject.addEventListener('click', () => {
    importProjectFile.click();
  });

  importProjectFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const snap = JSON.parse(evt.target.result);
        state.saveHistory();
        state.deserializeState(snap);
        canvasController.centerCanvas();
        state.triggerChange();
        importProjectFile.value = ''; // Reset input
      } catch (err) {
        alert("Failed to parse project file. Ensure it is a valid Tailweed project JSON.");
      }
    };
    reader.readAsText(file);
  });

  // Export Horizontal Spritesheet
  btnExportSheet.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    const cols = state.frames.length;
    exportCanvas.width = state.width * cols;
    exportCanvas.height = state.height;
    
    const exCtx = exportCanvas.getContext('2d');
    
    // Clear and build frame-by-frame
    state.frames.forEach((frame, fIdx) => {
      const offsetX = fIdx * state.width;
      
      // Render layers from bottom to top
      for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        if (!layer.visible) continue;
        
        const pixels = frame.layersData[layer.id];
        if (!pixels) continue;
        
        exCtx.globalAlpha = layer.opacity;
        for (let y = 0; y < state.height; y++) {
          for (let x = 0; x < state.width; x++) {
            const color = pixels[y * state.width + x];
            if (color) {
              exCtx.fillStyle = color;
              exCtx.fillRect(offsetX + x, y, 1, 1);
            }
          }
        }
      }
    });

    exCtx.globalAlpha = 1.0;
    
    // Download Link
    const imgData = exportCanvas.toDataURL('image/png');
    const dlLink = document.createElement('a');
    dlLink.href = imgData;
    dlLink.download = `spritesheet_${Date.now()}.png`;
    dlLink.click();
  });

  // Help Modal Toggle
  btnShowHelp.addEventListener('click', () => {
    dialogHelp.classList.remove('hidden');
    setTimeout(() => dialogHelp.classList.add('opacity-100'), 50);
  });

  btnCloseHelp.addEventListener('click', () => {
    dialogHelp.classList.remove('opacity-100');
    setTimeout(() => dialogHelp.classList.add('hidden'), 200);
  });

  dialogHelp.addEventListener('click', (e) => {
    if (e.target === dialogHelp) {
      dialogHelp.classList.add('hidden');
    }
  });

  // Keyboard Shortcuts Listening
  window.addEventListener('keydown', (e) => {
    // Exclude keyboard captures on inputs
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;

    if (e.ctrlKey) {
      if (e.code === 'KeyZ') {
        e.preventDefault();
        state.undo();
      }
      if (e.code === 'KeyY') {
        e.preventDefault();
        state.redo();
      }
      return;
    }

    switch (e.code) {
      case 'KeyB':
        state.activeTool = 'pencil';
        updateToolsUI();
        break;
      case 'KeyE':
        state.activeTool = 'eraser';
        updateToolsUI();
        break;
      case 'KeyG':
        state.activeTool = 'bucket';
        updateToolsUI();
        break;
      case 'KeyI':
        state.activeTool = 'eyedropper';
        updateToolsUI();
        break;
      case 'KeyL':
        state.activeTool = 'line';
        updateToolsUI();
        break;
      case 'KeyR':
        state.activeTool = 'rect';
        updateToolsUI();
        break;
      case 'KeyC':
        state.activeTool = 'circle';
        updateToolsUI();
        break;
      case 'KeyS':
        state.activeTool = 'selection';
        updateToolsUI();
        break;
      case 'Delete':
      case 'Backspace':
        if (state.selection) {
          state.saveHistory();
          const { sx, sy, sw, sh } = state.selection;
          const layerPixels = state.getCurrentLayerPixels();
          for (let j = 0; j < sh; j++) {
            for (let i = 0; i < sw; i++) {
              const px = sx + i;
              const py = sy + j;
              if (px >= 0 && px < state.width && py >= 0 && py < state.height) {
                layerPixels[py * state.width + px] = null;
              }
            }
          }
          state.selection = null;
          state.triggerChange();
        }
        break;
    }
  });
}

function startPlaybackLoop() {
  const intervalMs = 1000 / state.fps;
  playInterval = setInterval(() => {
    if (state.frames.length > 0) {
      state.currentFrameIndex = (state.currentFrameIndex + 1) % state.frames.length;
      state.triggerChange();
    }
  }, intervalMs);
}

function stopPlaybackLoop() {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

// Start Application
window.addEventListener('DOMContentLoaded', init);
