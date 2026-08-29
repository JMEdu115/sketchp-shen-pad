/**
 * Sketchp Shen Pad - 頂級專家級繪圖工作室引擎
 * 
 * 核心功能：
 * 1. 專業級手繪筆刷 (素描鉛筆、水彩暈染、毛筆提按、純淨清水、水漬暈染、炭筆顆粒、油漆桶、柔和橡皮)
 * 2. 簽名/印章圖檔匯入與自由縮放變換 (PNG, SVG, JPG)
 * 3. 24 色大師級水彩經典色盤
 * 4. 頂部純圖示 (Icon-Only) 簡約高效控制列
 * 5. 畫布固定內部像素解析度與視窗等比例縮放 (Viewport Zoom Fit)
 * 6. 多畫紙分頁管理與拖曳排序 (Multi-Sheet Drag & Drop Reordering)
 * 7. 批次匯出全部畫紙與單張自選格式匯出 (透明 PNG, 底紙 PNG, JPG)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. DOM 元素取得
  // ==========================================
  const canvas = document.getElementById('paint-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const viewport = document.getElementById('canvas-viewport');
  const paperCard = document.getElementById('canvas-paper-card');
  const brushCursor = document.getElementById('brush-cursor');

  // 控制項
  const brushButtons = document.querySelectorAll('.brush-btn');
  const colorPicker = document.getElementById('main-color-picker');
  const colorPreview = document.getElementById('color-preview');
  const colorHexText = document.getElementById('color-hex-text');
  const swatches = document.querySelectorAll('.swatch');
  const brushSizeInput = document.getElementById('brush-size');
  const brushSizeVal = document.getElementById('brush-size-val');
  const brushOpacityInput = document.getElementById('brush-opacity');
  const brushOpacityVal = document.getElementById('brush-opacity-val');
  const brushBleedInput = document.getElementById('brush-bleed');
  const brushBleedVal = document.getElementById('brush-bleed-val');
  const paperButtons = document.querySelectorAll('.paper-btn');
  
  // 頂部功能按鈕 (純圖示)
  const btnCanvasSize = document.getElementById('btn-canvas-size');
  const btnFlipH = document.getElementById('btn-flip-h');
  const btnFlipV = document.getElementById('btn-flip-v');
  const btnRotate90 = document.getElementById('btn-rotate-90');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnClear = document.getElementById('btn-clear');
  const btnSaveTransparentPng = document.getElementById('btn-save-transparent-png');
  const btnSavePng = document.getElementById('btn-save-png');
  const btnSaveJpg = document.getElementById('btn-save-jpg');
  const btnBatchExport = document.getElementById('btn-batch-export');
  const btnEyedropper = document.getElementById('btn-eyedropper');

  // 簽名印章匯入
  const btnImportStamp = document.getElementById('btn-import-stamp');
  const stampFileInput = document.getElementById('stamp-file-input');
  const stampBox = document.getElementById('stamp-transform-box');
  const stampPreviewImg = document.getElementById('stamp-preview-img');
  const stampOpacitySlider = document.getElementById('stamp-opacity');
  const btnApplyStamp = document.getElementById('btn-apply-stamp');
  const btnCancelStamp = document.getElementById('btn-cancel-stamp');
  const stampHandles = document.querySelectorAll('.stamp-handle');

  // 多畫紙管理
  const sheetsTabContainer = document.getElementById('sheets-tab-container');
  const btnAddSheet = document.getElementById('btn-add-sheet');
  const btnDuplicateSheet = document.getElementById('btn-duplicate-sheet');
  const btnDeleteSheet = document.getElementById('btn-delete-sheet');

  // 工作室面板
  const toolbox = document.getElementById('toolbox');
  const toolboxDragHandle = document.getElementById('toolbox-drag-handle');
  const toolboxToggle = document.getElementById('toolbox-toggle');

  // 畫布縮放平移控制列
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const btnZoomFit = document.getElementById('btn-zoom-fit');
  const btnTogglePan = document.getElementById('btn-toggle-pan');
  const zoomLevelLabel = document.getElementById('zoom-level-label');

  // 畫布尺寸 Modal
  const modalCanvasSize = document.getElementById('modal-canvas-size');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const presetSizeButtons = document.querySelectorAll('.preset-size-btn');
  const customWInput = document.getElementById('custom-w');
  const customHInput = document.getElementById('custom-h');
  const btnApplyCustomSize = document.getElementById('btn-apply-custom-size');

  // 批次匯出 Modal
  const modalBatchExport = document.getElementById('modal-batch-export');
  const btnCloseBatchModal = document.getElementById('btn-close-batch-modal');
  const batchSheetsChecklist = document.getElementById('batch-sheets-checklist');
  const btnSelectAllSheets = document.getElementById('btn-select-all-sheets');
  const btnExecuteBatchExport = document.getElementById('btn-execute-batch-export');

  // 吉祥物
  const mascot = document.getElementById('mascot-container');

  // 離屏緩衝層
  const strokeCanvas = document.createElement('canvas');
  const strokeCtx = strokeCanvas.getContext('2d', { willReadFrequently: true });
  const edgeCanvas = document.createElement('canvas');
  const edgeCtx = edgeCanvas.getContext('2d', { willReadFrequently: true });

  // ==========================================
  // 2. 系統狀態與多畫紙資料庫
  // ==========================================
  let sheetCounter = 1;

  const sheetsData = [
    {
      id: 1,
      name: '畫紙 1',
      imageData: null,
      texture: 'watercolor-paper',
      undoStack: [],
      redoStack: [],
    }
  ];

  let currentSheetId = 1;

  const state = {
    brushType: 'sketch',
    color: '#2b2b2b',
    size: 24,
    opacity: 0.85,
    bleed: 3,
    paperTexture: 'watercolor-paper',
    isDrawing: false,
    isEyedropperActive: false,
    
    // 畫布固定內部像素解析度
    canvasWidth: 1200,
    canvasHeight: 900,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanningMode: false,
    isSpacePressed: false,
    isMousePanning: false,
    panStartX: 0,
    panStartY: 0,

    // 筆劃記錄
    strokePoints: [],
    savedBaseImage: null,
    
    // 物理力學
    currentWidth: 5,
    lastSpeed: 0,
    prevPoint: null,

    // 印章變換狀態
    stampImage: null,
    stampX: 50,
    stampY: 50,
    stampW: 160,
    stampH: 160,
    stampOpacity: 0.95,
    isDraggingStamp: false,
    isResizingStamp: false,
    activeResizeHandle: null,
    stampDragStartX: 0,
    stampDragStartY: 0,
    stampInitX: 0,
    stampInitY: 0,
    stampInitW: 0,
    stampInitH: 0,
  };

  // ==========================================
  // 3. 翻轉、旋轉與全螢幕
  // ==========================================
  function flipCanvas(horizontal = true) {
    saveCurrentSheetState();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (horizontal) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }

    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    saveState();
  }

  function rotateCanvas90() {
    saveCurrentSheetState();
    const oldW = state.canvasWidth;
    const oldH = state.canvasHeight;
    const newW = oldH;
    const newH = oldW;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    setCanvasResolution(newW, newH, false);

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    saveState();
    fitCanvasToWindow();
  }

  btnFlipH.addEventListener('click', () => flipCanvas(true));
  btnFlipV.addEventListener('click', () => flipCanvas(false));
  btnRotate90.addEventListener('click', rotateCanvas90);

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // ==========================================
  // 4. 油漆桶填色演算法 (Flood Fill)
  // ==========================================
  function floodFill(startX, startY, fillColorHex, opacity) {
    const dpr = window.devicePixelRatio || 1;
    const physX = Math.round(startX * dpr);
    const physY = Math.round(startY * dpr);

    if (physX < 0 || physX >= canvas.width || physY < 0 || physY >= canvas.height) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const width = canvas.width;
    const height = canvas.height;

    const targetIdx = (physY * width + physX) * 4;
    const targetR = data[targetIdx];
    const targetG = data[targetIdx + 1];
    const targetB = data[targetIdx + 2];
    const targetA = data[targetIdx + 3];

    const fillRGB = hexToRgb(fillColorHex);
    const fillR = fillRGB.r;
    const fillG = fillRGB.g;
    const fillB = fillRGB.b;
    const fillA = Math.round(opacity * 255);

    if (Math.abs(targetR - fillR) < 5 && Math.abs(targetG - fillG) < 5 && Math.abs(targetB - fillB) < 5 && Math.abs(targetA - fillA) < 5) {
      return;
    }

    const tolerance = 32;

    function colorMatch(idx) {
      return Math.abs(data[idx] - targetR) <= tolerance &&
             Math.abs(data[idx + 1] - targetG) <= tolerance &&
             Math.abs(data[idx + 2] - targetB) <= tolerance &&
             Math.abs(data[idx + 3] - targetA) <= tolerance;
    }

    const queue = [[physX, physY]];
    const visited = new Uint8Array(width * height);
    visited[physY * width + physX] = 1;

    while (queue.length > 0) {
      const [x, y] = queue.pop();
      const idx = (y * width + x) * 4;

      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;

      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nPos = ny * width + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            const nIdx = nPos * 4;
            if (colorMatch(nIdx)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveState();
  }

  // ==========================================
  // 5. 簽名 / 印章匯入與變換系統 (支援持續重複調整)
  // ==========================================
  btnImportStamp.addEventListener('click', () => {
    stampFileInput.value = '';
    stampFileInput.click();
  });

  stampFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        state.stampImage = img;
        stampPreviewImg.src = event.target.result;
        
        const aspect = img.width / img.height;
        const maxInitial = Math.min(state.canvasWidth, state.canvasHeight) * 0.35;
        let w = maxInitial;
        let h = maxInitial / aspect;
        if (aspect < 1) {
          h = maxInitial;
          w = maxInitial * aspect;
        }

        state.stampW = Math.max(60, Math.round(w));
        state.stampH = Math.max(60, Math.round(h));
        state.stampX = Math.round((state.canvasWidth - state.stampW) / 2);
        state.stampY = Math.round((state.canvasHeight - state.stampH) / 2);
        state.stampOpacity = parseInt(stampOpacitySlider.value, 10) / 100;

        updateStampBoxPosition();
        stampBox.style.display = 'block';
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  function updateStampBoxPosition() {
    stampBox.style.left = `${state.stampX}px`;
    stampBox.style.top = `${state.stampY}px`;
    stampBox.style.width = `${state.stampW}px`;
    stampBox.style.height = `${state.stampH}px`;
    stampPreviewImg.style.opacity = state.stampOpacity;
  }

  stampOpacitySlider.addEventListener('input', (e) => {
    state.stampOpacity = parseInt(e.target.value, 10) / 100;
    stampPreviewImg.style.opacity = state.stampOpacity;
  });

  stampBox.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.stamp-handle') || e.target.closest('.stamp-floating-toolbar')) return;

    state.isDraggingStamp = true;
    stampBox.setPointerCapture(e.pointerId);

    state.stampDragStartX = e.clientX;
    state.stampDragStartY = e.clientY;
    state.stampInitX = state.stampX;
    state.stampInitY = state.stampY;

    e.stopPropagation();
  });

  stampHandles.forEach(handle => {
    handle.addEventListener('pointerdown', (e) => {
      state.isResizingStamp = true;
      state.activeResizeHandle = handle.getAttribute('data-handle');
      handle.setPointerCapture(e.pointerId);

      state.stampDragStartX = e.clientX;
      state.stampDragStartY = e.clientY;
      state.stampInitX = state.stampX;
      state.stampInitY = state.stampY;
      state.stampInitW = state.stampW;
      state.stampInitH = state.stampH;

      e.stopPropagation();
    });
  });

  window.addEventListener('pointermove', (e) => {
    if (state.isDraggingStamp) {
      const deltaX = (e.clientX - state.stampDragStartX) / state.zoom;
      const deltaY = (e.clientY - state.stampDragStartY) / state.zoom;

      state.stampX = Math.round(state.stampInitX + deltaX);
      state.stampY = Math.round(state.stampInitY + deltaY);
      updateStampBoxPosition();
    } else if (state.isResizingStamp) {
      const deltaX = (e.clientX - state.stampDragStartX) / state.zoom;
      const deltaY = (e.clientY - state.stampDragStartY) / state.zoom;
      const handle = state.activeResizeHandle;

      if (handle === 'br') {
        state.stampW = Math.max(30, Math.round(state.stampInitW + deltaX));
        state.stampH = Math.max(30, Math.round(state.stampInitH + deltaY));
      } else if (handle === 'bl') {
        const newW = Math.max(30, Math.round(state.stampInitW - deltaX));
        state.stampX = Math.round(state.stampInitX + (state.stampInitW - newW));
        state.stampW = newW;
        state.stampH = Math.max(30, Math.round(state.stampInitH + deltaY));
      } else if (handle === 'tr') {
        state.stampW = Math.max(30, Math.round(state.stampInitW + deltaX));
        const newH = Math.max(30, Math.round(state.stampInitH - deltaY));
        state.stampY = Math.round(state.stampInitY + (state.stampInitH - newH));
        state.stampH = newH;
      } else if (handle === 'tl') {
        const newW = Math.max(30, Math.round(state.stampInitW - deltaX));
        const newH = Math.max(30, Math.round(state.stampInitH - deltaY));
        state.stampX = Math.round(state.stampInitX + (state.stampInitW - newW));
        state.stampY = Math.round(state.stampInitY + (state.stampInitH - newH));
        state.stampW = newW;
        state.stampH = newH;
      }

      updateStampBoxPosition();
    }
  });

  function stopStampTransform(e) {
    if (state.isDraggingStamp) {
      state.isDraggingStamp = false;
      try { stampBox.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    if (state.isResizingStamp) {
      state.isResizingStamp = false;
      state.activeResizeHandle = null;
    }
  }

  window.addEventListener('pointerup', stopStampTransform);
  window.addEventListener('pointercancel', stopStampTransform);

  btnApplyStamp.addEventListener('click', () => {
    if (!state.stampImage) return;

    ctx.save();
    ctx.globalAlpha = state.stampOpacity;
    ctx.drawImage(state.stampImage, state.stampX, state.stampY, state.stampW, state.stampH);
    ctx.restore();

    stampBox.style.display = 'none';
    state.stampImage = null;
    saveState();
  });

  btnCancelStamp.addEventListener('click', () => {
    stampBox.style.display = 'none';
    state.stampImage = null;
  });

  // ==========================================
  // 6. 多畫紙管理系統
  // ==========================================
  function getCurrentSheet() {
    return sheetsData.find(s => s.id === currentSheetId) || sheetsData[0];
  }

  function saveCurrentSheetState() {
    const sheet = getCurrentSheet();
    if (sheet && canvas.width > 0 && canvas.height > 0) {
      sheet.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      sheet.texture = state.paperTexture;
    }
  }

  function renderSheetsTabs() {
    sheetsTabContainer.innerHTML = '';

    sheetsData.forEach((sheet, index) => {
      const tab = document.createElement('div');
      tab.className = `sheet-tab-item ${sheet.id === currentSheetId ? 'active' : ''}`;
      tab.draggable = true;
      tab.setAttribute('data-id', sheet.id);
      tab.setAttribute('data-index', index);

      tab.innerHTML = `
        <i class="fa-solid fa-grip-lines-vertical tab-drag-handle" title="拖曳調整紙張順序"></i>
        <span class="tab-title" title="點擊切換，雙擊可重新命名">${sheet.name}</span>
      `;

      tab.addEventListener('click', (e) => {
        if (e.target.closest('.tab-drag-handle')) return;
        if (sheet.id !== currentSheetId) {
          switchSheet(sheet.id);
        }
      });

      tab.addEventListener('dblclick', () => {
        const newName = prompt('請輸入新的畫紙名稱：', sheet.name);
        if (newName && newName.trim()) {
          sheet.name = newName.trim();
          renderSheetsTabs();
        }
      });

      tab.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index.toString());
        tab.classList.add('dragging');
      });

      tab.addEventListener('dragover', (e) => {
        e.preventDefault();
        tab.classList.add('drag-over');
      });

      tab.addEventListener('dragleave', () => {
        tab.classList.remove('drag-over');
      });

      tab.addEventListener('drop', (e) => {
        e.preventDefault();
        tab.classList.remove('drag-over');
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const toIndex = index;

        if (fromIndex !== toIndex && !isNaN(fromIndex)) {
          const movedItem = sheetsData.splice(fromIndex, 1)[0];
          sheetsData.splice(toIndex, 0, movedItem);
          renderSheetsTabs();
        }
      });

      tab.addEventListener('dragend', () => {
        tab.classList.remove('dragging');
        document.querySelectorAll('.sheet-tab-item').forEach(t => t.classList.remove('drag-over'));
      });

      sheetsTabContainer.appendChild(tab);
    });
  }

  function switchSheet(targetId) {
    saveCurrentSheetState();
    currentSheetId = targetId;
    const sheet = getCurrentSheet();

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (sheet.imageData) {
      ctx.putImageData(sheet.imageData, 0, 0);
    }

    setPaperTexture(sheet.texture || 'watercolor-paper');
    renderSheetsTabs();
    updateUndoRedoButtons();
  }

  function addNewSheet(customName = null, copyCurrent = false) {
    saveCurrentSheetState();
    sheetCounter++;
    const newId = sheetCounter;
    const name = customName || `畫紙 ${sheetsData.length + 1}`;

    let newImageData = null;
    let newTexture = state.paperTexture;

    if (copyCurrent) {
      newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    sheetsData.push({
      id: newId,
      name: name,
      imageData: newImageData,
      texture: newTexture,
      undoStack: [],
      redoStack: [],
    });

    switchSheet(newId);
    if (!copyCurrent) {
      saveState();
    }
  }

  function duplicateCurrentSheet() {
    const current = getCurrentSheet();
    addNewSheet(`${current.name} (副本)`, true);
  }

  function deleteCurrentSheet() {
    if (sheetsData.length <= 1) {
      alert('繪本中至少需要保留一張畫紙！');
      return;
    }

    if (confirm(`確定要刪除「${getCurrentSheet().name}」嗎？`)) {
      const idx = sheetsData.findIndex(s => s.id === currentSheetId);
      sheetsData.splice(idx, 1);
      const nextSheet = sheetsData[Math.max(0, idx - 1)];
      switchSheet(nextSheet.id);
    }
  }

  btnAddSheet.addEventListener('click', () => addNewSheet());
  btnDuplicateSheet.addEventListener('click', duplicateCurrentSheet);
  btnDeleteSheet.addEventListener('click', deleteCurrentSheet);

  function setPaperTexture(texture) {
    paperButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-texture') === texture);
    });
    paperCard.classList.remove('watercolor-paper', 'sketch-paper', 'craft-paper', 'smooth-paper');
    paperCard.classList.add(texture);
    state.paperTexture = texture;
    getCurrentSheet().texture = texture;
  }

  // ==========================================
  // 7. 工作室面板平滑拖曳
  // ==========================================
  let isDraggingToolbox = false;
  let toolboxStartX = 0;
  let toolboxStartY = 0;
  let toolboxInitLeft = 0;
  let toolboxInitTop = 0;

  toolboxDragHandle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.toolbox-toggle-btn')) return;
    
    isDraggingToolbox = true;
    toolboxDragHandle.setPointerCapture(e.pointerId);
    toolbox.classList.add('dragging');

    toolboxStartX = e.clientX;
    toolboxStartY = e.clientY;
    toolboxInitLeft = toolbox.offsetLeft;
    toolboxInitTop = toolbox.offsetTop;

    e.preventDefault();
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDraggingToolbox) return;

    const deltaX = e.clientX - toolboxStartX;
    const deltaY = e.clientY - toolboxStartY;

    let newLeft = toolboxInitLeft + deltaX;
    let newTop = toolboxInitTop + deltaY;

    const maxLeft = viewport.offsetWidth - toolbox.offsetWidth - 10;
    const maxTop = viewport.offsetHeight - 60;

    newLeft = Math.max(10, Math.min(newLeft, maxLeft));
    newTop = Math.max(10, Math.min(newTop, maxTop));

    toolbox.style.left = `${newLeft}px`;
    toolbox.style.top = `${newTop}px`;
  });

  function stopToolboxDrag(e) {
    if (isDraggingToolbox) {
      isDraggingToolbox = false;
      try { toolboxDragHandle.releasePointerCapture(e.pointerId); } catch (err) {}
      toolbox.classList.remove('dragging');
    }
  }

  window.addEventListener('pointerup', stopToolboxDrag);
  window.addEventListener('pointercancel', stopToolboxDrag);

  toolboxToggle.addEventListener('click', () => {
    toolbox.classList.toggle('collapsed');
  });

  // ==========================================
  // 8. 畫布固定解析度與視窗等比例適配
  // ==========================================
  function updateCanvasTransform() {
    paperCard.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
    zoomLevelLabel.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function setZoom(newZoom, centerX = null, centerY = null) {
    const clampedZoom = Math.max(0.25, Math.min(5.0, newZoom));
    
    if (centerX !== null && centerY !== null) {
      const zoomRatio = clampedZoom / state.zoom;
      state.panX = centerX - (centerX - state.panX) * zoomRatio;
      state.panY = centerY - (centerY - state.panY) * zoomRatio;
    }

    state.zoom = clampedZoom;
    updateCanvasTransform();
  }

  function resetZoomPan() {
    state.zoom = 1.0;
    state.panX = 0;
    state.panY = 0;
    updateCanvasTransform();
  }

  function fitCanvasToWindow() {
    const rect = viewport.getBoundingClientRect();
    const padding = 36;
    const availW = rect.width - padding;
    const availH = rect.height - padding;
    const scaleW = availW / state.canvasWidth;
    const scaleH = availH / state.canvasHeight;
    const fitScale = Math.min(1.0, Math.min(scaleW, scaleH));

    state.zoom = Math.max(0.25, fitScale);
    state.panX = 0;
    state.panY = 0;
    updateCanvasTransform();
  }

  function setCanvasResolution(targetW, targetH, shouldSaveHistory = true) {
    state.canvasWidth = targetW;
    state.canvasHeight = targetH;

    let tempCanvas = null;
    if (canvas.width > 0 && canvas.height > 0) {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
    }

    paperCard.style.width = `${targetW}px`;
    paperCard.style.height = `${targetH}px`;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = targetW * dpr;
    canvas.height = targetH * dpr;
    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;

    strokeCanvas.width = targetW * dpr;
    strokeCanvas.height = targetH * dpr;
    edgeCanvas.width = targetW * dpr;
    edgeCanvas.height = targetH * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    strokeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    edgeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (tempCanvas) {
      ctx.drawImage(tempCanvas, 0, 0, targetW, targetH);
    }

    if (shouldSaveHistory) {
      saveState();
    }
  }

  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(fitCanvasToWindow, 100);
  });

  btnZoomIn.addEventListener('click', () => setZoom(state.zoom * 1.2));
  btnZoomOut.addEventListener('click', () => setZoom(state.zoom / 1.2));
  btnZoomReset.addEventListener('click', resetZoomPan);
  btnZoomFit.addEventListener('click', fitCanvasToWindow);

  btnTogglePan.addEventListener('click', () => {
    state.isPanningMode = !state.isPanningMode;
    btnTogglePan.classList.toggle('active', state.isPanningMode);
    viewport.classList.toggle('panning', state.isPanningMode);
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !state.isSpacePressed && e.target.tagName !== 'INPUT') {
      state.isSpacePressed = true;
      viewport.classList.add('panning');
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      state.isSpacePressed = false;
      if (!state.isPanningMode) viewport.classList.remove('panning');
    }
  });

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const zoomDelta = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom(state.zoom * zoomDelta, mouseX, mouseY);
  }, { passive: false });

  // 畫布尺寸 Modal
  btnCanvasSize.addEventListener('click', () => modalCanvasSize.style.display = 'flex');
  btnCloseModal.addEventListener('click', () => modalCanvasSize.style.display = 'none');
  modalCanvasSize.addEventListener('click', (e) => {
    if (e.target === modalCanvasSize) modalCanvasSize.style.display = 'none';
  });

  presetSizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetSizeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const w = parseInt(btn.getAttribute('data-w'), 10);
      const h = parseInt(btn.getAttribute('data-h'), 10);
      
      setCanvasResolution(w, h);
      fitCanvasToWindow();
      modalCanvasSize.style.display = 'none';
    });
  });

  btnApplyCustomSize.addEventListener('click', () => {
    const w = parseInt(customWInput.value, 10) || 1200;
    const h = parseInt(customHInput.value, 10) || 900;
    setCanvasResolution(w, h);
    fitCanvasToWindow();
    modalCanvasSize.style.display = 'none';
  });

  // ==========================================
  // 9. 歷史紀錄系統
  // ==========================================
  function saveState() {
    const sheet = getCurrentSheet();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    sheet.undoStack.push(imageData);
    if (sheet.undoStack.length > 25) {
      sheet.undoStack.shift();
    }
    sheet.redoStack = [];
    updateUndoRedoButtons();
  }

  function undo() {
    const sheet = getCurrentSheet();
    if (sheet.undoStack.length > 1) {
      const current = sheet.undoStack.pop();
      sheet.redoStack.push(current);
      const previous = sheet.undoStack[sheet.undoStack.length - 1];
      ctx.putImageData(previous, 0, 0);
      updateUndoRedoButtons();
    }
  }

  function redo() {
    const sheet = getCurrentSheet();
    if (sheet.redoStack.length > 0) {
      const next = sheet.redoStack.pop();
      sheet.undoStack.push(next);
      ctx.putImageData(next, 0, 0);
      updateUndoRedoButtons();
    }
  }

  function updateUndoRedoButtons() {
    const sheet = getCurrentSheet();
    btnUndo.disabled = !sheet || sheet.undoStack.length <= 1;
    btnRedo.disabled = !sheet || sheet.redoStack.length === 0;
    btnUndo.style.opacity = btnUndo.disabled ? '0.4' : '1';
    btnRedo.style.opacity = btnRedo.disabled ? '0.4' : '1';
  }

  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);

  btnClear.addEventListener('click', () => {
    if (confirm(`確定要清空「${getCurrentSheet().name}」上的所有筆跡嗎？`)) {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      saveState();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) redo();
        else undo();
        e.preventDefault();
      } else if (e.key === 'y' || e.key === 'Y') {
        redo();
        e.preventDefault();
      }
    }
  });

  // ==========================================
  // 10. 輔助與筆刷核心
  // ==========================================
  function hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clearStrokeBuffer() {
    const dpr = window.devicePixelRatio || 1;
    strokeCtx.save();
    strokeCtx.setTransform(1, 0, 0, 1, 0, 0);
    strokeCtx.clearRect(0, 0, strokeCanvas.width, strokeCanvas.height);
    strokeCtx.restore();
    strokeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    edgeCtx.save();
    edgeCtx.setTransform(1, 0, 0, 1, 0, 0);
    edgeCtx.clearRect(0, 0, edgeCanvas.width, edgeCanvas.height);
    edgeCtx.restore();
    edgeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildDynamicRibbon(pts, isFinal = false) {
    if (pts.length < 2) return null;

    const leftPoints = [];
    const rightPoints = [];
    const count = pts.length;

    for (let i = 0; i < count; i++) {
      const p = pts[i];
      let angle = 0;

      if (i === 0) {
        angle = Math.atan2(pts[1].y - p.y, pts[1].x - p.x);
      } else if (i === count - 1) {
        angle = Math.atan2(p.y - pts[i - 1].y, p.x - pts[i - 1].x);
      } else {
        const a1 = Math.atan2(p.y - pts[i - 1].y, p.x - pts[i - 1].x);
        const a2 = Math.atan2(pts[i + 1].y - p.y, pts[i + 1].x - p.x);
        angle = (a1 + a2) / 2;
        if (Math.abs(a1 - a2) > Math.PI) angle += Math.PI;
      }

      let taper = 1.0;
      if (i < 4) taper = Math.max(0.12, (i + 0.35) / 4);
      if (isFinal && i > count - 5) {
        const rem = count - 1 - i;
        taper = Math.min(taper, Math.max(0.08, (rem + 0.35) / 4));
      }

      const w = p.width * taper;
      const perp = angle + Math.PI / 2;
      const halfW = w / 2;

      leftPoints.push({
        x: p.x + Math.cos(perp) * halfW,
        y: p.y + Math.sin(perp) * halfW,
      });

      rightPoints.push({
        x: p.x - Math.cos(perp) * halfW,
        y: p.y - Math.sin(perp) * halfW,
      });
    }

    return { leftPoints, rightPoints };
  }

  function fillSmoothRibbon(targetCtx, ribbon) {
    if (!ribbon || ribbon.leftPoints.length < 2) return;
    const left = ribbon.leftPoints;
    const right = ribbon.rightPoints;

    targetCtx.beginPath();
    targetCtx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length - 1; i++) {
      const mx = (left[i].x + left[i + 1].x) / 2;
      const my = (left[i].y + left[i + 1].y) / 2;
      targetCtx.quadraticCurveTo(left[i].x, left[i].y, mx, my);
    }
    targetCtx.lineTo(left[left.length - 1].x, left[left.length - 1].y);
    targetCtx.lineTo(right[right.length - 1].x, right[right.length - 1].y);

    for (let i = right.length - 2; i > 0; i--) {
      const mx = (right[i].x + right[i - 1].x) / 2;
      const my = (right[i].y + right[i - 1].y) / 2;
      targetCtx.quadraticCurveTo(right[i].x, right[i].y, mx, my);
    }
    targetCtx.lineTo(right[0].x, right[0].y);
    targetCtx.lineTo(left[0].x, left[0].y);
    targetCtx.closePath();
    targetCtx.fill();
  }

  function renderSketchStroke(p1, p2) {
    const { r, g, b } = hexToRgb(state.color);
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const perp = angle + Math.PI / 2;
    const radius = Math.max(1, state.size * 0.35);

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    const strands = Math.max(3, Math.floor(radius * 0.8));
    for (let i = 0; i < strands; i++) {
      const offset = (i / (strands - 1 || 1) - 0.5) * radius * 2;
      const ox = Math.cos(perp) * offset;
      const oy = Math.sin(perp) * offset;

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${state.opacity * (0.35 + Math.random() * 0.35)})`;
      ctx.lineWidth = Math.random() * 1.3 + 0.6;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(p1.x + ox, p1.y + oy);
      const midX = (p1.x + p2.x) / 2 + ox + (Math.random() - 0.5) * 1.5;
      const midY = (p1.y + p2.y) / 2 + oy + (Math.random() - 0.5) * 1.5;
      ctx.quadraticCurveTo(midX, midY, p2.x + ox, p2.y + oy);
      ctx.stroke();
    }

    const grainCount = Math.max(2, Math.floor(dist * 0.8 + radius * 0.5));
    for (let j = 0; j < grainCount; j++) {
      const t = Math.random();
      const spread = (Math.random() - 0.5) * radius * 2.2;
      const gx = p1.x + (p2.x - p1.x) * t + Math.cos(perp) * spread;
      const gy = p1.y + (p2.y - p1.y) * t + Math.sin(perp) * spread;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${state.opacity * (0.3 + Math.random() * 0.45)})`;
      ctx.beginPath();
      ctx.arc(gx, gy, Math.random() * 1.4 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function renderCharcoalStroke(p1, p2) {
    const { r, g, b } = hexToRgb(state.color);
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const radius = Math.max(2, state.size * 0.6);

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${state.opacity * 0.65})`;
    ctx.lineWidth = radius * 1.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const particleDensity = Math.max(5, Math.floor(dist * 1.5 + radius * 1.2));
    for (let i = 0; i < particleDensity; i++) {
      const t = Math.random();
      const cx = p1.x + (p2.x - p1.x) * t;
      const cy = p1.y + (p2.y - p1.y) * t;

      const offsetDist = Math.pow(Math.random(), 0.6) * radius * 1.25;
      const theta = Math.random() * Math.PI * 2;
      const px = cx + Math.cos(theta) * offsetDist;
      const py = cy + Math.sin(theta) * offsetDist;

      const pSize = Math.random() * (radius * 0.25) + 0.8;
      const pAlpha = state.opacity * (0.15 + Math.random() * 0.55);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pAlpha})`;
      ctx.fillRect(px, py, pSize, pSize);
    }

    ctx.restore();
  }

  function renderLiveCalligraphyStroke(isFinal = false) {
    const pts = state.strokePoints;
    if (pts.length < 1) return;

    clearStrokeBuffer();
    const { r, g, b } = hexToRgb(state.color);

    if (pts.length === 1) {
      const p = pts[0];
      strokeCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      strokeCtx.beginPath();
      strokeCtx.arc(p.x, p.y, Math.max(1, p.width * 0.18), 0, Math.PI * 2);
      strokeCtx.fill();
    } else {
      const ribbon = buildDynamicRibbon(pts, isFinal);
      if (ribbon) {
        strokeCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        fillSmoothRibbon(strokeCtx, ribbon);
      }
    }

    ctx.putImageData(state.savedBaseImage, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = state.opacity * 0.95;
    ctx.drawImage(strokeCanvas, 0, 0);
    ctx.restore();
  }

  function renderLiveWatercolorStroke(isFinal = false) {
    const pts = state.strokePoints;
    if (pts.length < 1) return;

    clearStrokeBuffer();
    const { r, g, b } = hexToRgb(state.color);
    const dpr = window.devicePixelRatio || 1;

    if (pts.length === 1) {
      const p = pts[0];
      strokeCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      strokeCtx.beginPath();
      strokeCtx.arc(p.x, p.y, Math.max(1, p.width * 0.35), 0, Math.PI * 2);
      strokeCtx.fill();
    } else {
      const ribbon = buildDynamicRibbon(pts, isFinal);
      if (ribbon) {
        strokeCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        fillSmoothRibbon(strokeCtx, ribbon);

        edgeCtx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        edgeCtx.lineWidth = 2.0;
        edgeCtx.lineCap = 'round';
        edgeCtx.lineJoin = 'round';
        fillSmoothRibbon(edgeCtx, ribbon);
        edgeCtx.stroke();

        edgeCtx.save();
        edgeCtx.setTransform(1, 0, 0, 1, 0, 0);
        edgeCtx.globalCompositeOperation = 'destination-out';
        edgeCtx.drawImage(strokeCanvas, 0, 0);
        edgeCtx.restore();
      }
    }

    ctx.putImageData(state.savedBaseImage, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply';

    ctx.globalAlpha = state.opacity * 0.38;
    ctx.drawImage(strokeCanvas, 0, 0);

    ctx.globalAlpha = state.opacity * (0.45 + state.bleed * 0.08);
    ctx.drawImage(edgeCanvas, 0, 0);

    if (state.bleed > 2) {
      ctx.globalAlpha = state.opacity * 0.14;
      ctx.filter = `blur(${state.bleed * 1.5 * dpr}px)`;
      ctx.drawImage(strokeCanvas, 0, 0);
    }

    ctx.restore();
  }

  /**
   * 【筆刷 4A：純淨清水筆 (Pure Water Blender)】
   */
  function renderPureBlenderStroke(p1, p2) {
    const dpr = window.devicePixelRatio || 1;
    const radius = Math.max(8, Math.round(state.size * 1.2));
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const step = Math.max(4, Math.round(radius * 0.35));
    const diffusionStrength = Math.min(0.85, 0.35 + state.bleed * 0.1);

    for (let d = 0; d <= dist; d += step) {
      const cx = Math.round(p1.x + Math.cos(angle) * d);
      const cy = Math.round(p1.y + Math.sin(angle) * d);

      const physRadius = Math.round(radius * dpr);
      const physX = Math.round((cx - radius) * dpr);
      const physY = Math.round((cy - radius) * dpr);
      const physSize = physRadius * 2;

      if (physX < 0 || physY < 0 || physX + physSize > canvas.width || physY + physSize > canvas.height) {
        continue;
      }

      const imgData = ctx.getImageData(physX, physY, physSize, physSize);
      const data = imgData.data;

      let hasPigment = false;
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] > 8) { hasPigment = true; break; }
      }
      if (!hasPigment) continue;

      const src = new Uint8ClampedArray(data);
      const centerPhys = physRadius;
      const kDist = Math.max(1, Math.round(2 + state.bleed * 1.2));

      for (let y = 1; y < physSize - 1; y++) {
        for (let x = 1; x < physSize - 1; x++) {
          const dx = x - centerPhys;
          const dy = y - centerPhys;
          const distSq = dx * dx + dy * dy;

          if (distSq > physRadius * physRadius) continue;

          const idx = (y * physSize + x) * 4;
          const radialWeight = 1 - Math.sqrt(distSq) / physRadius;

          let rWeightedSum = 0;
          let gWeightedSum = 0;
          let bWeightedSum = 0;
          let alphaWeightTotal = 0;
          let kernelWeightTotal = 0;
          let rawAlphaSum = 0;

          for (let ky = -kDist; ky <= kDist; ky += 2) {
            const ny = y + ky;
            if (ny < 0 || ny >= physSize) continue;

            for (let kx = -kDist; kx <= kDist; kx += 2) {
              const nx = x + kx;
              if (nx < 0 || nx >= physSize) continue;

              const nIdx = (ny * physSize + nx) * 4;
              const aVal = src[nIdx + 3];
              const kw = 1.0 / (1 + Math.abs(kx) + Math.abs(ky));

              kernelWeightTotal += kw;
              rawAlphaSum += aVal * kw;

              if (aVal > 2) {
                const effWeight = kw * (aVal / 255);
                rWeightedSum += src[nIdx] * effWeight;
                gWeightedSum += src[nIdx + 1] * effWeight;
                bWeightedSum += src[nIdx + 2] * effWeight;
                alphaWeightTotal += effWeight;
              }
            }
          }

          const newAlpha = (rawAlphaSum / (kernelWeightTotal || 1)) * 0.96;

          if (alphaWeightTotal > 0.001) {
            const pureR = rWeightedSum / alphaWeightTotal;
            const pureG = gWeightedSum / alphaWeightTotal;
            const pureB = bWeightedSum / alphaWeightTotal;

            const blendRate = diffusionStrength * radialWeight * (state.opacity * 0.85);

            if (src[idx + 3] <= 2) {
              data[idx] = pureR;
              data[idx + 1] = pureG;
              data[idx + 2] = pureB;
              data[idx + 3] = newAlpha * blendRate;
            } else {
              data[idx] = src[idx] + (pureR - src[idx]) * blendRate;
              data[idx + 1] = src[idx + 1] + (pureG - src[idx + 1]) * blendRate;
              data[idx + 2] = src[idx + 2] + (pureB - src[idx + 2]) * blendRate;
              data[idx + 3] = src[idx + 3] + (newAlpha - src[idx + 3]) * blendRate;
            }
          }
        }
      }

      ctx.putImageData(imgData, physX, physY);
    }
  }

  /**
   * 【筆刷 4B：水漬暈染筆 (Water Stain Bleed)】
   */
  function renderStainBlenderStroke(p1, p2) {
    const dpr = window.devicePixelRatio || 1;
    const radius = Math.max(8, state.size * 1.1);
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const step = Math.max(3, radius * 0.3);
    const blurRadius = Math.max(3, state.bleed * 2.5);

    for (let d = 0; d <= dist; d += step) {
      const cx = p1.x + Math.cos(angle) * d;
      const cy = p1.y + Math.sin(angle) * d;

      const minX = Math.floor(cx - radius);
      const minY = Math.floor(cy - radius);
      const size = Math.ceil(radius * 2);

      if (minX + size <= 0 || minY + size <= 0 || minX >= state.canvasWidth || minY >= state.canvasHeight) {
        continue;
      }

      const physSize = Math.ceil(size * dpr);
      if (strokeCanvas.width < physSize || strokeCanvas.height < physSize) {
        strokeCanvas.width = physSize + 20;
        strokeCanvas.height = physSize + 20;
      }

      strokeCtx.save();
      strokeCtx.setTransform(1, 0, 0, 1, 0, 0);
      strokeCtx.clearRect(0, 0, physSize, physSize);

      strokeCtx.filter = `blur(${blurRadius * dpr}px)`;
      strokeCtx.drawImage(canvas, minX * dpr, minY * dpr, physSize, physSize, 0, 0, physSize, physSize);
      strokeCtx.filter = 'none';

      strokeCtx.globalCompositeOperation = 'destination-in';
      const grad = strokeCtx.createRadialGradient(physSize / 2, physSize / 2, physSize * 0.15, physSize / 2, physSize / 2, physSize * 0.5);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      strokeCtx.fillStyle = grad;
      strokeCtx.fillRect(0, 0, physSize, physSize);

      strokeCtx.restore();

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(0.75, state.opacity * 0.7);
      ctx.drawImage(strokeCanvas, 0, 0, physSize, physSize, minX * dpr, minY * dpr, physSize, physSize);
      ctx.restore();
    }
  }

  function renderEraserStroke(p1, p2) {
    const radius = Math.max(2, state.size * 1.2);
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const step = Math.max(2, radius * 0.25);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    const eraseAlpha = state.opacity * 0.3;

    for (let d = 0; d <= dist; d += step) {
      const cx = p1.x + Math.cos(angle) * d;
      const cy = p1.y + Math.sin(angle) * d;

      const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      grad.addColorStop(0, `rgba(0, 0, 0, ${eraseAlpha})`);
      grad.addColorStop(0.7, `rgba(0, 0, 0, ${eraseAlpha * 0.65})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================
  // 11. 精準座標映射
  // ==========================================
  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.offsetWidth / rect.width;
    const scaleY = canvas.offsetHeight / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    let hasHardwarePressure = false;
    let rawPressure = 0.5;

    if (e.pressure !== undefined && e.pressure > 0 && e.pressure !== 0.5) {
      hasHardwarePressure = true;
      rawPressure = e.pressure;
    }

    return {
      x: x,
      y: y,
      rawPressure: rawPressure,
      hasHardwarePressure: hasHardwarePressure,
      time: Date.now(),
    };
  }

  function calculateDynamicWidth(pos, speed) {
    const baseSize = state.size;

    if (pos.hasHardwarePressure) {
      const pFactor = Math.pow(pos.rawPressure, 1.5);
      return Math.max(1.5, baseSize * (0.15 + pFactor * 1.7));
    } else {
      const speedNorm = Math.min(speed, 60) / 60;
      const dynamicFactor = Math.pow(1 - speedNorm, 1.4);
      const widthMult = 0.22 + dynamicFactor * 1.55;
      return Math.max(1.8, baseSize * widthMult);
    }
  }

  // ==========================================
  // 12. 畫布事件監聽
  // ==========================================
  function handlePointerDown(e) {
    if (state.isPanningMode || state.isSpacePressed || e.button === 1) {
      state.isMousePanning = true;
      state.panStartX = e.clientX - state.panX;
      state.panStartY = e.clientY - state.panY;
      viewport.classList.add('panning');
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const pos = getCanvasPos(e);

    // 吸管取色
    if (state.isEyedropperActive) {
      pickColorAt(e);
      return;
    }

    // 油漆桶填色
    if (state.brushType === 'bucket') {
      floodFill(pos.x, pos.y, state.color, state.opacity);
      return;
    }

    // 常規筆刷
    state.isDrawing = true;
    pos.width = state.size * 0.28;
    
    state.currentWidth = pos.width;
    state.lastSpeed = 0;
    state.prevPoint = pos;
    state.strokePoints = [pos];
    state.savedBaseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (state.brushType === 'sketch') {
      renderSketchStroke(pos, { x: pos.x + 0.1, y: pos.y + 0.1 });
    } else if (state.brushType === 'charcoal') {
      renderCharcoalStroke(pos, { x: pos.x + 0.1, y: pos.y + 0.1 });
    } else if (state.brushType === 'eraser') {
      renderEraserStroke(pos, { x: pos.x + 0.1, y: pos.y + 0.1 });
    } else if (state.brushType === 'blender_pure') {
      renderPureBlenderStroke(pos, { x: pos.x + 0.1, y: pos.y + 0.1 });
    } else if (state.brushType === 'blender_stain') {
      renderStainBlenderStroke(pos, { x: pos.x + 0.1, y: pos.y + 0.1 });
    } else if (state.brushType === 'calligraphy') {
      renderLiveCalligraphyStroke(false);
    } else if (state.brushType === 'watercolor') {
      renderLiveWatercolorStroke(false);
    }
  }

  function handlePointerMove(e) {
    if (state.isMousePanning) {
      state.panX = e.clientX - state.panStartX;
      state.panY = e.clientY - state.panStartY;
      updateCanvasTransform();
      return;
    }

    updateBrushCursor(e);

    if (!state.isDrawing) return;

    const pos = getCanvasPos(e);
    const prev = state.prevPoint || pos;
    const dist = Math.hypot(pos.x - prev.x, pos.y - prev.y);
    if (dist < 1.0) return;

    const timeDiff = Math.max(1, pos.time - prev.time);
    const instantSpeed = (dist / timeDiff) * 16;
    state.lastSpeed = lerp(state.lastSpeed, instantSpeed, 0.3);

    const targetWidth = calculateDynamicWidth(pos, state.lastSpeed);
    state.currentWidth = lerp(state.currentWidth, targetWidth, 0.28);
    pos.width = state.currentWidth;

    state.strokePoints.push(pos);

    switch (state.brushType) {
      case 'sketch':
        renderSketchStroke(prev, pos);
        break;
      case 'charcoal':
        renderCharcoalStroke(prev, pos);
        break;
      case 'eraser':
        renderEraserStroke(prev, pos);
        break;
      case 'calligraphy':
        renderLiveCalligraphyStroke(false);
        break;
      case 'watercolor':
        renderLiveWatercolorStroke(false);
        break;
      case 'blender_pure':
        renderPureBlenderStroke(prev, pos);
        break;
      case 'blender_stain':
        renderStainBlenderStroke(prev, pos);
        break;
    }

    state.prevPoint = pos;
  }

  function handlePointerUp() {
    if (state.isMousePanning) {
      state.isMousePanning = false;
      if (!state.isPanningMode && !state.isSpacePressed) viewport.classList.remove('panning');
      return;
    }

    if (state.isDrawing) {
      if (state.brushType === 'calligraphy') {
        renderLiveCalligraphyStroke(true);
      } else if (state.brushType === 'watercolor') {
        renderLiveWatercolorStroke(true);
      }

      state.isDrawing = false;
      state.strokePoints = [];
      state.prevPoint = null;
      state.savedBaseImage = null;
      clearStrokeBuffer();
      saveState();
    }
  }

  viewport.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);
  viewport.addEventListener('pointerleave', () => {
    handlePointerUp();
    brushCursor.style.display = 'none';
  });

  // ==========================================
  // 13. 游標與取色
  // ==========================================
  function updateBrushCursor(e) {
    if (state.isEyedropperActive || state.isPanningMode || state.isSpacePressed || state.stampImage || state.brushType === 'bucket') {
      brushCursor.style.display = 'none';
      return;
    }
    
    const pos = getCanvasPos(e);

    if (pos.x >= -20 && pos.x <= state.canvasWidth + 20 && pos.y >= -20 && pos.y <= state.canvasHeight + 20) {
      brushCursor.style.display = 'block';
      brushCursor.style.left = `${pos.x}px`;
      brushCursor.style.top = `${pos.y}px`;
      const size = state.brushType === 'eraser' ? state.size * 2.4 : (state.brushType.includes('blender') ? state.size * 2.2 : state.size);
      brushCursor.style.width = `${size}px`;
      brushCursor.style.height = `${size}px`;
    } else {
      brushCursor.style.display = 'none';
    }
  }

  function pickColorAt(e) {
    const pos = getCanvasPos(e);
    const dpr = window.devicePixelRatio || 1;
    const pixel = ctx.getImageData(pos.x * dpr, pos.y * dpr, 1, 1).data;
    
    if (pixel[3] === 0) {
      setColor('#ffffff');
    } else {
      const hex = '#' + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
      setColor(hex);
    }

    state.isEyedropperActive = false;
    btnEyedropper.classList.remove('active');
    viewport.style.cursor = 'default';
  }

  function setColor(hex) {
    state.color = hex;
    colorPicker.value = hex;
    colorPreview.style.backgroundColor = hex;
    colorHexText.textContent = hex.toUpperCase();
  }

  btnEyedropper.addEventListener('click', async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        setColor(result.sRGBHex);
        return;
      } catch (err) {}
    }
    state.isEyedropperActive = !state.isEyedropperActive;
    btnEyedropper.classList.toggle('active', state.isEyedropperActive);
    viewport.style.cursor = state.isEyedropperActive ? 'cell' : 'default';
  });

  colorPicker.addEventListener('input', (e) => setColor(e.target.value));

  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      setColor(swatch.getAttribute('data-color'));
    });
  });

  // ==========================================
  // 14. 介面控制項事件
  // ==========================================
  brushButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      brushButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.brushType = btn.getAttribute('data-brush');

      if (state.brushType === 'bucket') {
        viewport.style.cursor = 'crosshair';
      } else {
        viewport.style.cursor = 'default';
      }
    });
  });

  brushSizeInput.addEventListener('input', (e) => {
    state.size = parseInt(e.target.value, 10);
    brushSizeVal.textContent = `${state.size} px`;
  });

  brushOpacityInput.addEventListener('input', (e) => {
    state.opacity = parseInt(e.target.value, 10) / 100;
    brushOpacityVal.textContent = `${e.target.value}%`;
  });

  brushBleedInput.addEventListener('input', (e) => {
    state.bleed = parseInt(e.target.value, 10);
    const labels = ['微弱暈開', '自然水痕', '顯著擴散', '強烈暈染', '極致化水'];
    brushBleedVal.textContent = labels[state.bleed - 1] || '顯著擴散';
  });

  paperButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const texture = btn.getAttribute('data-texture');
      setPaperTexture(texture);
    });
  });

  // ==========================================
  // 15. 圖片匯出系統 (單張 & 批次匯出)
  // ==========================================
  function createExportCanvasForSheet(sheet, format = 'png') {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext('2d');

    if (format !== 'transparent_png') {
      let bgColor = '#ffffff';
      const texture = sheet.texture || 'watercolor-paper';
      if (texture === 'watercolor-paper') bgColor = '#fcfaf5';
      else if (texture === 'sketch-paper') bgColor = '#f6f5ef';
      else if (texture === 'craft-paper') bgColor = '#d9be9b';

      expCtx.fillStyle = bgColor;
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    if (sheet.id === currentSheetId) {
      expCtx.drawImage(canvas, 0, 0);
    } else if (sheet.imageData) {
      const tempC = document.createElement('canvas');
      tempC.width = canvas.width;
      tempC.height = canvas.height;
      const tempCtx = tempC.getContext('2d');
      tempCtx.putImageData(sheet.imageData, 0, 0);
      expCtx.drawImage(tempC, 0, 0);
    }

    return exportCanvas;
  }

  function downloadCanvasImage(expCanvas, filename, format = 'png') {
    const isJpg = format === 'jpg';
    const mime = isJpg ? 'image/jpeg' : 'image/png';
    const quality = isJpg ? 0.95 : 1.0;
    const dataUrl = expCanvas.toDataURL(mime, quality);

    const a = document.createElement('a');
    a.download = filename;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportSingleImage(format = 'png') {
    saveCurrentSheetState();
    const sheet = getCurrentSheet();
    const expCanvas = createExportCanvasForSheet(sheet, format);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const cleanName = sheet.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
    const suffix = format === 'transparent_png' ? 'Transparent' : (format === 'jpg' ? 'Artwork' : 'Paper');
    const ext = format === 'jpg' ? 'jpg' : 'png';

    downloadCanvasImage(expCanvas, `Sketchp_${cleanName}_${suffix}_${timestamp}.${ext}`, format);
  }

  btnSaveTransparentPng.addEventListener('click', () => exportSingleImage('transparent_png'));
  btnSavePng.addEventListener('click', () => exportSingleImage('png'));
  btnSaveJpg.addEventListener('click', () => exportSingleImage('jpg'));

  // 批次匯出 Modal
  btnBatchExport.addEventListener('click', () => {
    saveCurrentSheetState();
    renderBatchSheetsChecklist();
    modalBatchExport.style.display = 'flex';
  });

  btnCloseBatchModal.addEventListener('click', () => {
    modalBatchExport.style.display = 'none';
  });

  modalBatchExport.addEventListener('click', (e) => {
    if (e.target === modalBatchExport) modalBatchExport.style.display = 'none';
  });

  function renderBatchSheetsChecklist() {
    batchSheetsChecklist.innerHTML = '';
    sheetsData.forEach((sheet) => {
      const item = document.createElement('label');
      item.className = 'batch-sheet-item';
      item.innerHTML = `
        <span style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" class="batch-sheet-checkbox" value="${sheet.id}" checked>
          <span>${sheet.name}</span>
        </span>
        <span style="font-size:0.75rem; color:var(--text-muted);">${sheet.texture}</span>
      `;
      batchSheetsChecklist.appendChild(item);
    });
  }

  let allSelected = true;
  btnSelectAllSheets.addEventListener('click', () => {
    allSelected = !allSelected;
    document.querySelectorAll('.batch-sheet-checkbox').forEach(cb => cb.checked = allSelected);
  });

  btnExecuteBatchExport.addEventListener('click', async () => {
    saveCurrentSheetState();
    const selectedCheckboxes = document.querySelectorAll('.batch-sheet-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
      alert('請至少勾選一張要匯出的畫紙！');
      return;
    }

    const selectedFormat = document.querySelector('input[name="batch-format"]:checked').value;
    const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value, 10));
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const suffix = selectedFormat === 'transparent_png' ? 'Transparent' : (selectedFormat === 'jpg' ? 'Artwork' : 'Paper');
    const ext = selectedFormat === 'jpg' ? 'jpg' : 'png';

    modalBatchExport.style.display = 'none';

    for (let i = 0; i < selectedIds.length; i++) {
      const sheet = sheetsData.find(s => s.id === selectedIds[i]);
      if (sheet) {
        const expCanvas = createExportCanvasForSheet(sheet, selectedFormat);
        const cleanName = sheet.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
        const filename = `Sketchp_Batch_${idx(i+1)}_${cleanName}_${suffix}_${timestamp}.${ext}`;
        downloadCanvasImage(expCanvas, filename, selectedFormat);
        await new Promise(r => setTimeout(r, 250));
      }
    }
  });

  function idx(n) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  // ==========================================
  // 16. 吉祥物自由拖曳
  // ==========================================
  let isDraggingMascot = false;
  let mascotStartX = 0;
  let mascotStartY = 0;
  let mascotInitialLeft = 0;
  let mascotInitialTop = 0;

  function onMascotPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    isDraggingMascot = true;
    mascot.setPointerCapture(e.pointerId);

    const rect = mascot.getBoundingClientRect();
    mascotStartX = e.clientX;
    mascotStartY = e.clientY;
    mascotInitialLeft = rect.left;
    mascotInitialTop = rect.top;

    mascot.style.transition = 'none';
    mascot.style.bottom = 'auto';
    mascot.style.right = 'auto';
    mascot.style.left = `${mascotInitialLeft}px`;
    mascot.style.top = `${mascotInitialTop}px`;

    e.preventDefault();
  }

  function onMascotPointerMove(e) {
    if (!isDraggingMascot) return;

    const deltaX = e.clientX - mascotStartX;
    const deltaY = e.clientY - mascotStartY;

    let newLeft = mascotInitialLeft + deltaX;
    let newTop = mascotInitialTop + deltaY;

    const maxX = window.innerWidth - mascot.offsetWidth;
    const maxY = window.innerHeight - mascot.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    mascot.style.left = `${newLeft}px`;
    mascot.style.top = `${newTop}px`;
  }

  function onMascotPointerUp(e) {
    if (isDraggingMascot) {
      isDraggingMascot = false;
      try { mascot.releasePointerCapture(e.pointerId); } catch (err) {}
      mascot.style.transition = 'transform 0.1s ease-out';
    }
  }

  mascot.addEventListener('pointerdown', onMascotPointerDown);
  window.addEventListener('pointermove', onMascotPointerMove);
  window.addEventListener('pointerup', onMascotPointerUp);
  window.addEventListener('pointercancel', onMascotPointerUp);

  // ==========================================
  // 17. 系統啟動初始化
  // ==========================================
  setCanvasResolution(1200, 900, false);
  fitCanvasToWindow();
  renderSheetsTabs();
  setColor('#2b2b2b');
});
