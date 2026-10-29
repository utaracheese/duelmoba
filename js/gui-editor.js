/* ================= GUI EDITOR ENGINE ================= */
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const workspace = document.getElementById('workspace');
const exportCanvas = document.getElementById('export-canvas');
const exportCtx = exportCanvas.getContext('2d');

const propX = document.getElementById('prop-x');
const propY = document.getElementById('prop-y');
const propW = document.getElementById('prop-w');
const propH = document.getElementById('prop-h');
const propAspect = document.getElementById('prop-aspect');
const propRot = document.getElementById('prop-rot');
const propOpacity = document.getElementById('prop-opacity');
const opacityVal = document.getElementById('opacity-val');
const btnFlipH = document.getElementById('btn-flip-h');
const btnFlipV = document.getElementById('btn-flip-v');

let draggedLayerItem = null;

/* ================= 1. QUẢN LÝ LƯU TRỮ TRẠNG THÁI TICK (LOCALSTORAGE) ================= */
const GUI_DONE_STORAGE_KEY = 'mc_pack_studio_gui_checked_status';

function getGuiDoneList() {
    try {
        const raw = localStorage.getItem(GUI_DONE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function setGuiDoneStatus(id, isDone) {
    const list = getGuiDoneList();
    if (isDone) {
        list[id] = true;
    } else {
        delete list[id];
    }
    localStorage.setItem(GUI_DONE_STORAGE_KEY, JSON.stringify(list));
}

/* ================= 2. THƯ MỤC CHUẨN VS CODE CÓ CHECKBOX ================= */
function initFolderTree() {
    const container = document.getElementById('folder-tree-container');
    if (!container) return;
    container.innerHTML = '';

    const rootWrapper = document.createElement('div');
    rootWrapper.className = 'vscode-tree';

    const doneList = getGuiDoneList();

    function createTreeNode(node, depth = 0) {
        const isFolder = Array.isArray(node.children);
        const itemContainer = document.createElement('div');
        itemContainer.className = isFolder ? 'tree-folder-group' : 'tree-file-group';

        const row = document.createElement('div');
        row.className = isFolder ? 'tree-row tree-folder-row' : 'tree-row tree-file-row';
        row.style.paddingLeft = `${depth * 14 + 6}px`;

        if (isFolder) {
            row.innerHTML = `
                <span class="tree-arrow open">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M6 3.5l4.5 4.5L6 12.5"/></svg>
                </span>
                <span class="folder-name">${node.name}</span>
            `;

            const childrenBox = document.createElement('div');
            childrenBox.className = 'tree-children';
            childrenBox.style.display = 'block';

            node.children.forEach(child => {
                childrenBox.appendChild(createTreeNode(child, depth + 1));
            });

            row.onclick = (e) => {
                e.stopPropagation();
                const arrow = row.querySelector('.tree-arrow');
                const isCurrentlyOpen = childrenBox.style.display !== 'none';
                childrenBox.style.display = isCurrentlyOpen ? 'none' : 'block';
                arrow.classList.toggle('open', !isCurrentlyOpen);
            };

            itemContainer.appendChild(row);
            itemContainer.appendChild(childrenBox);
        } else {
            // File ảnh (.png)
            row.dataset.id = node.id;
            row.dataset.name = node.name.toLowerCase();

            const isDone = !!doneList[node.id];
            if (isDone) row.classList.add('is-done');

            row.innerHTML = `
                <input type="checkbox" class="tree-gui-check" id="check-${node.id}" title="Đánh dấu GUI đã hoàn thành" ${isDone ? 'checked' : ''}>
                <span class="file-img-icon">
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="#a78bfa"><path d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/><circle cx="4.5" cy="6.5" r="1.5"/><path d="M15 12l-4.5-4.5L6 12h9z"/></svg>
                </span>
                <span class="file-name">${node.name}</span>
                <span class="badge-saved" style="display:none;" id="badge-${node.id}">Saved</span>
            `;

            // Xử lý sự kiện click checkbox (ngăn chặn lan truyền click lên hàng)
            const checkbox = row.querySelector('.tree-gui-check');
            checkbox.onclick = (e) => {
                e.stopPropagation();
                const checked = e.target.checked;
                row.classList.toggle('is-done', checked);
                setGuiDoneStatus(node.id, checked);
            };

            // Chọn GUI khi bấm vào hàng
            row.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.tree-file-row').forEach(r => r.classList.remove('active'));
                row.classList.add('active');
                selectGui(node, node.folder);
            };

            itemContainer.appendChild(row);
        }

        return itemContainer;
    }

    rootWrapper.appendChild(createTreeNode(GUI_TREE_DATA));
    container.appendChild(rootWrapper);

    // Xử lý tìm kiếm trong Tree
    const searchInput = document.getElementById('gui-search');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const term = e.target.value.trim().toLowerCase();
            document.querySelectorAll('.tree-file-row').forEach(row => {
                const match = row.dataset.name.includes(term) || row.dataset.id.includes(term);
                row.style.display = match ? 'flex' : 'none';
                
                // Tự động mở rộng thư mục cha nếu có file tìm thấy
                if (match && term.length > 0) {
                    let parent = row.closest('.tree-children');
                    while (parent) {
                        parent.style.display = 'block';
                        const arrow = parent.previousElementSibling?.querySelector('.tree-arrow');
                        if (arrow) arrow.classList.add('open');
                        parent = parent.parentElement.closest('.tree-children');
                    }
                }
            });
        };
    }

    // Tự động chọn file đầu tiên (anvil.png)
    const firstFile = container.querySelector('.tree-file-row');
    if (firstFile) {
        firstFile.classList.add('active');
        const anvilObj = { id: 'anvil', name: 'anvil.png', path: 'assets/minecraft/textures/gui/container/anvil.png', folder: 'textures/gui/container' };
        selectGui(anvilObj, anvilObj.folder);
    }
}

function getFallbackGui(name) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#c6c6c6"/>
        <rect x="6" y="6" width="244" height="244" fill="none" stroke="#fff" stroke-width="4"/>
        <rect x="10" y="10" width="236" height="236" fill="none" stroke="#555" stroke-width="4"/>
        <text x="128" y="32" font-family="monospace" font-size="13" font-weight="bold" fill="#222" text-anchor="middle">${name.toUpperCase()}</text>
        <rect x="20" y="50" width="216" height="70" fill="#8b8b8b" stroke="#373737" stroke-width="2"/>
        <text x="128" y="90" font-family="sans-serif" font-size="11" fill="#fff" text-anchor="middle">KHUNG GUI CHUẨN</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function selectGui(guiItem, folderName) {
    state.currentGui = { ...guiItem, folder: folderName };
    state.guiLoaded = false;
    state.guiImage = new Image();
    state.guiImage.crossOrigin = 'Anonymous';

    state.guiImage.onload = () => {
        state.guiLoaded = true;
        state.guiWidth = state.guiImage.naturalWidth || 256;
        state.guiHeight = state.guiImage.naturalHeight || 256;
        fitCanvasToScreen();
        renderLayersList();
        requestRender();
    };

    state.guiImage.onerror = () => {
        state.guiImage.src = getFallbackGui(guiItem.name);
    };

    state.guiImage.src = guiItem.path;
}

function fitCanvasToScreen() {
    const pad = 60;
    const w = workspace.clientWidth - pad;
    const h = workspace.clientHeight - pad;
    const sX = w / (state.guiWidth || 256);
    const sY = h / (state.guiHeight || 256);
    state.zoom = Math.min(sX, sY, 2.0) || 1;
    state.panX = (workspace.clientWidth - state.guiWidth * state.zoom) / 2;
    state.panY = (workspace.clientHeight - state.guiHeight * state.zoom) / 2;
    const zEl = document.getElementById('zoom-value');
    if (zEl) zEl.innerText = `${Math.round(state.zoom * 100)}%`;
}

function requestRender() {
    requestAnimationFrame(renderCanvas);
}

function renderCanvas() {
    canvas.width = workspace.clientWidth;
    canvas.height = workspace.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.zoom, state.zoom);

    // Vẽ các Layer NẰM DƯỚI GUI
    for (let i = 0; i < state.guiLayerIndex; i++) {
        if (state.layers[i]) renderImageLayer(ctx, state.layers[i]);
    }

    // Vẽ Khung GUI gốc
    if (state.guiLoaded) {
        ctx.drawImage(state.guiImage, 0, 0, state.guiWidth, state.guiHeight);
    }

    // Vẽ các Layer NẰM TRÊN GUI
    for (let i = state.guiLayerIndex; i < state.layers.length; i++) {
        if (state.layers[i]) renderImageLayer(ctx, state.layers[i]);
    }

    if (state.selectedLayerIndex !== null && state.layers[state.selectedLayerIndex]) {
        drawBoundingBox(ctx, state.layers[state.selectedLayerIndex]);
    }

    ctx.restore();
}

function renderImageLayer(context, layer) {
    context.save();
    context.globalAlpha = layer.opacity;

    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;

    context.translate(cx, cy);
    context.rotate((layer.rotation * Math.PI) / 180);
    context.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);

    context.drawImage(layer.img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
    context.restore();
}

function drawBoundingBox(context, t) {
    context.save();
    const cx = t.x + t.width / 2;
    const cy = t.y + t.height / 2;
    context.translate(cx, cy);
    context.rotate((t.rotation * Math.PI) / 180);

    const hw = t.width / 2;
    const hh = t.height / 2;

    context.strokeStyle = '#0099ff';
    context.lineWidth = 1.5 / state.zoom;
    context.strokeRect(-hw, -hh, t.width, t.height);

    context.beginPath();
    context.moveTo(0, -hh);
    context.lineTo(0, -hh - 18 / state.zoom);
    context.stroke();

    context.fillStyle = '#0099ff';
    context.beginPath();
    context.arc(0, -hh - 18 / state.zoom, 4.5 / state.zoom, 0, Math.PI * 2);
    context.fill();

    const handles = {
        tl: { x: -hw, y: -hh }, tc: { x: 0, y: -hh }, tr: { x: hw, y: -hh },
        ml: { x: -hw, y: 0 }, mr: { x: hw, y: 0 },
        bl: { x: -hw, y: hh }, bc: { x: 0, y: hh }, br: { x: hw, y: hh }
    };

    context.fillStyle = '#ffffff';
    context.strokeStyle = '#0099ff';
    const sz = 6 / state.zoom;
    Object.values(handles).forEach(p => {
        context.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
        context.strokeRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    });

    context.restore();
}

/* ================= 3. QUẢN LÝ LAYER VÀ KÉO THẢ (DRAG & DROP) ================= */
function renderLayersList() {
    const list = document.getElementById('layers-list');
    if (!list) return;
    list.innerHTML = '';

    const renderItems = [];
    for (let i = state.layers.length - 1; i >= state.guiLayerIndex; i--) {
        renderItems.push({ type: 'layer', index: i, tag: '✨ (Trên GUI)' });
    }
    renderItems.push({ type: 'gui-barrier' });
    for (let i = state.guiLayerIndex - 1; i >= 0; i--) {
        renderItems.push({ type: 'layer', index: i, tag: '🖼️ (Dưới GUI)' });
    }

    renderItems.forEach(item => {
        if (item.type === 'gui-barrier') {
            const guiRow = document.createElement('div');
            guiRow.className = 'layer-row gui-locked';
            guiRow.dataset.type = 'barrier';
            guiRow.innerHTML = `<span>🔒 <b>GUI Gốc</b> (Mốc ranh giới)</span><span style="font-size:10px; color:#888;">Cố định</span>`;
            setupLayerDropEvents(guiRow, 'barrier');
            list.appendChild(guiRow);
        } else {
            list.appendChild(createDraggableLayerRow(item.index, item.tag));
        }
    });
}

function createDraggableLayerRow(idx, tag) {
    const layer = state.layers[idx];
    const div = document.createElement('div');
    div.className = 'layer-row' + (state.selectedLayerIndex === idx ? ' active' : '');
    div.draggable = true;
    div.dataset.index = idx;
    div.dataset.type = 'layer';

    div.innerHTML = `
        <div style="display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">
            <span class="drag-handle" style="cursor:grab;">☰</span>
            <span style="font-size:11px; color:#8b949e;">${tag}</span>
            <span>${layer.name}</span>
        </div>
        <button class="btn-del-layer" style="padding:2px 6px; font-size:10px;">✕</button>
    `;

    div.querySelector('.btn-del-layer').onclick = (e) => {
        e.stopPropagation();
        deleteLayerAt(idx);
    };

    div.onclick = () => {
        state.selectedLayerIndex = idx;
        renderLayersList();
        updateProperties();
        requestRender();
    };

    setupLayerDropEvents(div, 'layer', idx);
    return div;
}

function setupLayerDropEvents(element, type, idx) {
    element.ondragstart = (e) => {
        if (type === 'barrier') { e.preventDefault(); return; }
        draggedLayerItem = idx;
        element.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };

    element.ondragend = () => {
        element.classList.remove('dragging');
        document.querySelectorAll('.layer-row').forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
    };

    element.ondragover = (e) => {
        e.preventDefault();
        const rect = element.getBoundingClientRect();
        const next = (e.clientY - rect.top) / rect.height > 0.5;
        element.classList.toggle('drag-over-top', !next);
        element.classList.toggle('drag-over-bottom', next);
    };

    element.ondragleave = () => {
        element.classList.remove('drag-over-top', 'drag-over-bottom');
    };

    element.ondrop = (e) => {
        e.preventDefault();
        element.classList.remove('drag-over-top', 'drag-over-bottom');
        if (draggedLayerItem === null) return;

        const rect = element.getBoundingClientRect();
        const isBelow = (e.clientY - rect.top) / rect.height > 0.5;

        reorderLayerByDrop(draggedLayerItem, type, idx, isBelow);
        draggedLayerItem = null;
    };
}

function reorderLayerByDrop(fromIdx, targetType, targetIdx, isBelow) {
    const layer = state.layers.splice(fromIdx, 1)[0];
    const wasAboveGui = fromIdx >= state.guiLayerIndex;
    if (fromIdx < state.guiLayerIndex) state.guiLayerIndex--;

    if (targetType === 'barrier') {
        if (isBelow) {
            state.layers.splice(state.guiLayerIndex, 0, layer);
            state.selectedLayerIndex = state.guiLayerIndex;
            state.guiLayerIndex++;
        } else {
            state.layers.splice(state.guiLayerIndex, 0, layer);
            state.selectedLayerIndex = state.guiLayerIndex;
        }
    } else {
        let insertIdx = targetIdx;
        if (fromIdx < targetIdx) insertIdx--; 
        if (isBelow) insertIdx = Math.max(0, insertIdx);
        else insertIdx = Math.min(state.layers.length, insertIdx + 1);

        state.layers.splice(insertIdx, 0, layer);
        state.selectedLayerIndex = insertIdx;

        if (insertIdx < state.guiLayerIndex && wasAboveGui) {
            state.guiLayerIndex++;
        } else if (insertIdx >= state.guiLayerIndex && !wasAboveGui) {
            state.guiLayerIndex = Math.max(0, state.guiLayerIndex);
        }
    }

    renderLayersList();
    updateProperties();
    saveHistory();
    requestRender();
}

window.deleteLayerAt = function(idx) {
    state.layers.splice(idx, 1);
    if (idx < state.guiLayerIndex) state.guiLayerIndex--;
    state.selectedLayerIndex = null;
    renderLayersList();
    updateProperties();
    saveHistory();
    requestRender();
};

/* ================= 4. BINDINGS & CANVAS EVENTS ================= */
function initPropertyBindings() {
    const fileUpload = document.getElementById('unified-image-upload');
    if (fileUpload) {
        fileUpload.onchange = (e) => {
            if (e.target.files) handleEditorImageUpload(e.target.files);
        };
    }

    workspace.addEventListener('dragover', (e) => e.preventDefault());
    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) handleEditorImageUpload(e.dataTransfer.files);
    });

    const aiBtn = document.getElementById('btn-ai-remove-bg');
    if (aiBtn) aiBtn.onclick = aiRemoveBackgroundCurrentLayer;

    const fitBtn = document.getElementById('btn-fit');
    if (fitBtn) {
        fitBtn.onclick = () => {
            const l = getActiveLayer(); if (!l) return;
            l.width = state.guiWidth; l.height = state.guiHeight;
            l.x = 0; l.y = 0;
            updateProperties(); requestRender(); saveHistory();
        };
    }

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
        resetBtn.onclick = () => {
            const l = getActiveLayer(); if (!l) return;
            l.rotation = 0; l.opacity = 1; l.flipX = false; l.flipY = false;
            updateProperties(); requestRender(); saveHistory();
        };
    }

    const delBtn = document.getElementById('btn-delete');
    if (delBtn) {
        delBtn.onclick = () => {
            if (state.selectedLayerIndex !== null) deleteLayerAt(state.selectedLayerIndex);
        };
    }

    if (propX) propX.onchange = (e) => { const l = getActiveLayer(); if (l) { l.x = parseFloat(e.target.value) || 0; requestRender(); saveHistory(); } };
    if (propY) propY.onchange = (e) => { const l = getActiveLayer(); if (l) { l.y = parseFloat(e.target.value) || 0; requestRender(); saveHistory(); } };
    if (propW) {
        propW.onchange = (e) => { 
            const l = getActiveLayer(); 
            if (l) { 
                l.width = parseFloat(e.target.value) || 10;
                if (propAspect.checked) l.height = Math.round(l.width / l.aspectRatio);
                updateProperties(); requestRender(); saveHistory(); 
            } 
        };
    }
    if (propH) {
        propH.onchange = (e) => { 
            const l = getActiveLayer(); 
            if (l) { 
                l.height = parseFloat(e.target.value) || 10;
                if (propAspect.checked) l.width = Math.round(l.height * l.aspectRatio);
                updateProperties(); requestRender(); saveHistory(); 
            } 
        };
    }
    if (propRot) propRot.onchange = (e) => { const l = getActiveLayer(); if (l) { l.rotation = parseFloat(e.target.value) || 0; requestRender(); saveHistory(); } };
    if (propOpacity) {
        propOpacity.oninput = (e) => { 
            const l = getActiveLayer(); 
            if (l) { 
                l.opacity = parseFloat(e.target.value); 
                opacityVal.innerText = `${Math.round(l.opacity * 100)}%`; 
                requestRender(); 
            } 
        };
        propOpacity.onchange = saveHistory;
    }

    if (btnFlipH) btnFlipH.onclick = () => { const l = getActiveLayer(); if (l) { l.flipX = !l.flipX; btnFlipH.classList.toggle('active', l.flipX); requestRender(); saveHistory(); } };
    if (btnFlipV) btnFlipV.onclick = () => { const l = getActiveLayer(); if (l) { l.flipY = !l.flipY; btnFlipV.classList.toggle('active', l.flipY); requestRender(); saveHistory(); } };

    const zIn = document.getElementById('zoom-in'); if (zIn) zIn.onclick = () => setZoom(state.zoom * 1.2);
    const zOut = document.getElementById('zoom-out'); if (zOut) zOut.onclick = () => setZoom(state.zoom / 1.2);
    const z50 = document.getElementById('zoom-50'); if (z50) z50.onclick = () => setZoom(0.5);
    const z100 = document.getElementById('zoom-100'); if (z100) z100.onclick = () => setZoom(1.0);
    const z200 = document.getElementById('zoom-200'); if (z200) z200.onclick = () => setZoom(2.0);
    const zFit = document.getElementById('zoom-fit'); if (zFit) zFit.onclick = fitCanvasToScreen;

    const uBtn = document.getElementById('btn-undo'); if (uBtn) uBtn.onclick = undo;
    const rBtn = document.getElementById('btn-redo'); if (rBtn) rBtn.onclick = redo;

    const expBtn = document.getElementById('btn-export-png'); if (expBtn) expBtn.onclick = exportPNGDirect;
    const saveBtn = document.getElementById('btn-save-project'); if (saveBtn) saveBtn.onclick = saveGuiIntoPackBuilder;
}

function handleEditorImageUpload(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
                const newLayer = {
                    id: 'layer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                    name: file.name,
                    img: img,
                    x: Math.round((state.guiWidth - img.width) / 2),
                    y: Math.round((state.guiHeight - img.height) / 2),
                    width: img.width,
                    height: img.height,
                    rotation: 0,
                    opacity: 1,
                    flipX: false,
                    flipY: false,
                    aspectRatio: img.width / img.height
                };
                state.layers.push(newLayer);
                state.selectedLayerIndex = state.layers.length - 1;
                renderLayersList();
                updateProperties();
                saveHistory();
                requestRender();
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function getActiveLayer() {
    return state.selectedLayerIndex !== null ? state.layers[state.selectedLayerIndex] : null;
}

function updateProperties() {
    const l = getActiveLayer();
    const posText = document.getElementById('layer-pos-text');

    if (!l) {
        propX.value = 0; propY.value = 0; propW.value = 0; propH.value = 0;
        propRot.value = 0; propOpacity.value = 1; opacityVal.innerText = '100%';
        btnFlipH.classList.remove('active'); btnFlipV.classList.remove('active');
        if (posText) posText.innerText = "Chưa chọn layer nào (Kéo thả danh sách trên để đổi tầng)";
        return;
    }

    propX.value = Math.round(l.x);
    propY.value = Math.round(l.y);
    propW.value = Math.round(l.width);
    propH.value = Math.round(l.height);
    propRot.value = Math.round(l.rotation);
    propOpacity.value = l.opacity;
    opacityVal.innerText = `${Math.round(l.opacity * 100)}%`;
    btnFlipH.classList.toggle('active', l.flipX);
    btnFlipV.classList.toggle('active', l.flipY);

    const isAbove = state.selectedLayerIndex >= state.guiLayerIndex;
    if (posText) {
        posText.innerText = `Tầng hiển thị: ${isAbove ? 'NẰM TRÊN GUI (Sticker)' : 'NẰM DƯỚI GUI (Nền/Background)'}`;
    }
}

function setZoom(val) {
    state.zoom = Math.min(Math.max(0.1, val), 8.0);
    const zEl = document.getElementById('zoom-value');
    if (zEl) zEl.innerText = `${Math.round(state.zoom * 100)}%`;
    requestRender();
}

function initCanvasEvents() {
    workspace.addEventListener('mousedown', (e) => {
        if (e.button === 1 || e.spaceKey) {
            state.isPanning = true;
            state.dragStart = { x: e.clientX - state.panX, y: e.clientY - state.panY };
            return;
        }

        const m = getCanvasMousePos(e);
        const active = getActiveLayer();

        if (active) {
            const handle = hitTestHandles(m, active);
            if (handle === 'rot') {
                state.isRotating = true;
                state.transformStart = { ...active };
                return;
            } else if (handle) {
                state.isResizing = true;
                state.activeHandle = handle;
                state.dragStart = { x: m.x, y: m.y };
                state.transformStart = { ...active };
                return;
            }
        }

        for (let i = state.layers.length - 1; i >= 0; i--) {
            if (hitTestObject(m, state.layers[i])) {
                state.selectedLayerIndex = i;
                state.isDragging = true;
                state.dragStart = { x: m.x - state.layers[i].x, y: m.y - state.layers[i].y };
                renderLayersList();
                updateProperties();
                requestRender();
                return;
            }
        }

        state.selectedLayerIndex = null;
        renderLayersList();
        updateProperties();
        requestRender();
    });

    window.addEventListener('mousemove', (e) => {
        if (state.isPanning) {
            state.panX = e.clientX - state.dragStart.x;
            state.panY = e.clientY - state.dragStart.y;
            requestRender();
            return;
        }

        const l = getActiveLayer();
        if (!l) return;
        const m = getCanvasMousePos(e);

        if (state.isDragging) {
            l.x = m.x - state.dragStart.x;
            l.y = m.y - state.dragStart.y;
            updateProperties();
            requestRender();
        } else if (state.isRotating) {
            const cx = l.x + l.width / 2;
            const cy = l.y + l.height / 2;
            l.rotation = Math.round((Math.atan2(m.y - cy, m.x - cx) * 180) / Math.PI) + 90;
            updateProperties();
            requestRender();
        } else if (state.isResizing) {
            const s = state.transformStart;
            let dx = m.x - state.dragStart.x;
            let dy = m.y - state.dragStart.y;
            let nw = s.width, nh = s.height;

            if (state.activeHandle.includes('r')) nw += dx;
            if (state.activeHandle.includes('l')) nw -= dx;
            if (state.activeHandle.includes('b')) nh += dy;
            if (state.activeHandle.includes('t')) nh -= dy;

            if (propAspect.checked) {
                if (state.activeHandle.includes('r') || state.activeHandle.includes('l')) nh = nw / s.aspectRatio;
                else nw = nh * s.aspectRatio;
            }

            if (nw > 5 && nh > 5) { l.width = Math.round(nw); l.height = Math.round(nh); }
            updateProperties();
            requestRender();
        }
    });

    window.addEventListener('mouseup', () => {
        if (state.isDragging || state.isResizing || state.isRotating) saveHistory();
        state.isDragging = false; state.isResizing = false; state.isRotating = false; state.isPanning = false;
    });

    workspace.addEventListener('wheel', (e) => {
        e.preventDefault();
        setZoom(state.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
    }, { passive: false });
}

function getCanvasMousePos(e) {
    const rect = workspace.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left - state.panX) / state.zoom,
        y: (e.clientY - rect.top - state.panY) / state.zoom
    };
}

function hitTestObject(p, t) {
    const cx = t.x + t.width / 2, cy = t.y + t.height / 2;
    const rad = (-t.rotation * Math.PI) / 180;
    const lx = (p.x - cx) * Math.cos(rad) - (p.y - cy) * Math.sin(rad);
    const ly = (p.x - cx) * Math.sin(rad) + (p.y - cy) * Math.cos(rad);
    return Math.abs(lx) <= t.width / 2 && Math.abs(ly) <= t.height / 2;
}

function hitTestHandles(p, t) {
    const cx = t.x + t.width / 2, cy = t.y + t.height / 2;
    const rad = (-t.rotation * Math.PI) / 180;
    const lx = (p.x - cx) * Math.cos(rad) - (p.y - cy) * Math.sin(rad);
    const ly = (p.x - cx) * Math.sin(rad) + (p.y - cy) * Math.cos(rad);
    const th = 8 / state.zoom;
    const hw = t.width / 2, hh = t.height / 2;

    if (Math.hypot(lx, ly - (-hh - 18 / state.zoom)) <= th) return 'rot';
    if (Math.abs(lx - -hw) <= th && Math.abs(ly - -hh) <= th) return 'tl';
    if (Math.abs(lx - hw) <= th && Math.abs(ly - -hh) <= th) return 'tr';
    if (Math.abs(lx - -hw) <= th && Math.abs(ly - hh) <= th) return 'bl';
    if (Math.abs(lx - hw) <= th && Math.abs(ly - hh) <= th) return 'br';
    return null;
}

function renderFullComposite() {
    exportCanvas.width = state.guiWidth;
    exportCanvas.height = state.guiHeight;
    exportCtx.imageSmoothingEnabled = false;
    exportCtx.clearRect(0, 0, state.guiWidth, state.guiHeight);

    for (let i = 0; i < state.guiLayerIndex; i++) {
        if (state.layers[i]) renderImageLayer(exportCtx, state.layers[i]);
    }
    if (state.guiLoaded) exportCtx.drawImage(state.guiImage, 0, 0, state.guiWidth, state.guiHeight);
    for (let i = state.guiLayerIndex; i < state.layers.length; i++) {
        if (state.layers[i]) renderImageLayer(exportCtx, state.layers[i]);
    }
    return exportCanvas.toDataURL('image/png');
}

function exportPNGDirect() {
    const dataUrl = renderFullComposite();
    const link = document.createElement('a');
    link.download = `${state.currentGui.id}.png`;
    link.href = dataUrl;
    link.click();
}

function saveGuiIntoPackBuilder() {
    const dataUrl = renderFullComposite();
    const isContainer = state.currentGui.folder.includes('container');
    const targetList = isContainer ? state.builderAssets.guisContainer : state.builderAssets.guisRoot;

    const existingIdx = targetList.findIndex(g => g.id === state.currentGui.id);
    const newObj = {
        id: state.currentGui.id,
        path: state.currentGui.path,
        dataUrl: dataUrl
    };

    if (existingIdx !== -1) targetList[existingIdx] = newObj;
    else targetList.push(newObj);

    const badge = document.getElementById(`badge-${state.currentGui.id}`);
    if (badge) badge.style.display = 'inline-block';

    // Tự động tick hoàn thành checkbox và lưu vào localStorage
    const chk = document.getElementById(`check-${state.currentGui.id}`);
    if (chk) {
        chk.checked = true;
        const row = chk.closest('.tree-file-row');
        if (row) row.classList.add('is-done');
        setGuiDoneStatus(state.currentGui.id, true);
    }

    updateBuilderStats();
    alert(`✅ Đã lưu GUI "${state.currentGui.name}" vào danh mục Pack Builder!\nĐường dẫn: ${state.currentGui.path}`);
}