/* ==========================================================================
   MINECRAFT RESOURCE PACK STUDIO - MOBILE GUI EDITOR ENGINE
   - Đầy đủ 100% tính năng: VS Code Tree, Layers, Properties Sheet,
     AI Smart BG Removal, Multi-touch Pan/Zoom, Undo/Redo & Export PNG.
   ========================================================================== */

/* ================= 1. DỮ LIỆU CÂY THƯ MỤC CHUẨN GỐC 100% ================= */
const GUI_TREE_DATA = {
    name: "assets",
    isOpen: true,
    children: [
        {
            name: "minecraft",
            isOpen: true,
            children: [
                {
                    name: "textures",
                    isOpen: true,
                    children: [
                        {
                            name: "gui",
                            isOpen: true,
                            children: [
                                {
                                    name: "container",
                                    isOpen: true,
                                    children: [
                                        { id: 'anvil', name: 'anvil.png', path: 'assets/minecraft/textures/gui/container/anvil.png', folder: 'textures/gui/container' },
                                        { id: 'beacon', name: 'beacon.png', path: 'assets/minecraft/textures/gui/container/beacon.png', folder: 'textures/gui/container' },
                                        { id: 'blast_furnace', name: 'blast_furnace.png', path: 'assets/minecraft/textures/gui/container/blast_furnace.png', folder: 'textures/gui/container' },
                                        { id: 'brewing_stand', name: 'brewing_stand.png', path: 'assets/minecraft/textures/gui/container/brewing_stand.png', folder: 'textures/gui/container' },
                                        { id: 'cartography_table', name: 'cartography_table.png', path: 'assets/minecraft/textures/gui/container/cartography_table.png', folder: 'textures/gui/container' },
                                        { id: 'crafter', name: 'crafter.png', path: 'assets/minecraft/textures/gui/container/crafter.png', folder: 'textures/gui/container' },
                                        { id: 'crafting_table', name: 'crafting_table.png', path: 'assets/minecraft/textures/gui/container/crafting_table.png', folder: 'textures/gui/container' },
                                        { id: 'dispenser', name: 'dispenser.png', path: 'assets/minecraft/textures/gui/container/dispenser.png', folder: 'textures/gui/container' },
                                        { id: 'enchanting_table', name: 'enchanting_table.png', path: 'assets/minecraft/textures/gui/container/enchanting_table.png', folder: 'textures/gui/container' },
                                        { id: 'furnace', name: 'furnace.png', path: 'assets/minecraft/textures/gui/container/furnace.png', folder: 'textures/gui/container' },
                                        { id: 'generic_54', name: 'generic_54.png', path: 'assets/minecraft/textures/gui/container/generic_54.png', folder: 'textures/gui/container' },
                                        { id: 'grindstone', name: 'grindstone.png', path: 'assets/minecraft/textures/gui/container/grindstone.png', folder: 'textures/gui/container' },
                                        { id: 'hopper', name: 'hopper.png', path: 'assets/minecraft/textures/gui/container/hopper.png', folder: 'textures/gui/container' },
                                        { id: 'horse', name: 'horse.png', path: 'assets/minecraft/textures/gui/container/horse.png', folder: 'textures/gui/container' },
                                        { id: 'inventory', name: 'inventory.png', path: 'assets/minecraft/textures/gui/container/inventory.png', folder: 'textures/gui/container' },
                                        { id: 'loom', name: 'loom.png', path: 'assets/minecraft/textures/gui/container/loom.png', folder: 'textures/gui/container' },
                                        { id: 'shulker_box', name: 'shulker_box.png', path: 'assets/minecraft/textures/gui/container/shulker_box.png', folder: 'textures/gui/container' },
                                        { id: 'smithing', name: 'smithing.png', path: 'assets/minecraft/textures/gui/container/smithing.png', folder: 'textures/gui/container' },
                                        { id: 'smoker', name: 'smoker.png', path: 'assets/minecraft/textures/gui/container/smoker.png', folder: 'textures/gui/container' },
                                        { id: 'stonecutter', name: 'stonecutter.png', path: 'assets/minecraft/textures/gui/container/stonecutter.png', folder: 'textures/gui/container' },
                                        { id: 'villager', name: 'villager.png', path: 'assets/minecraft/textures/gui/container/villager.png', folder: 'textures/gui/container' }
                                    ]
                                },
                                { id: 'recipe_book', name: 'recipe_book.png', path: 'assets/minecraft/textures/gui/recipe_book.png', folder: 'textures/gui' }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

/* ================= 2. QUẢN LÝ TRẠNG THÁI (STATE) ================= */
const state = {
    currentGui: {
        id: 'anvil',
        name: 'anvil.png',
        path: 'assets/minecraft/textures/gui/container/anvil.png',
        folder: 'textures/gui/container'
    },
    guiImage: new Image(),
    guiLoaded: false,
    guiWidth: 256,
    guiHeight: 256,

    layers: [],
    guiLayerIndex: 0,
    selectedLayerIndex: null,

    // Tọa độ và thu phóng hiển thị
    zoom: 1,
    panX: 0,
    panY: 0,

    // Trạng thái thao tác cảm ứng
    mode: null, // 'move-layer', 'pan-viewport', 'pinch-zoom'
    touchStartDist: 0,
    startZoom: 1,
    dragStart: { x: 0, y: 0 },
    layerStartPos: { x: 0, y: 0 },

    // Lịch sử Undo / Redo
    history: [],
    historyIndex: -1
};

// Tham chiếu DOM Canvas
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const viewport = document.getElementById('viewport');
const exportCanvas = document.getElementById('export-canvas');
const exportCtx = exportCanvas.getContext('2d');

/* ================= 3. KHỞI TẠO ỨNG DỤNG ================= */
window.addEventListener('DOMContentLoaded', () => {
    initCanvasSize();
    window.addEventListener('resize', () => {
        initCanvasSize();
        fitGuiToScreen();
    });

    initProjectModal();
    initFloatingBubble();
    initLayerModalEvents();
    initPropertiesSheet();
    initToolbarEvents();
    initTouchAndCanvasEvents();

    // Tải GUI mặc định ban đầu (anvil.png)
    selectGuiNode(state.currentGui);
    saveHistoryState();
});

function initCanvasSize() {
    canvas.width = viewport.clientWidth;
    canvas.height = viewport.clientHeight;
    renderCanvas();
}

/* ================= 4. LOCALSTORAGE: LƯU TRẠNG THÁI CHECKBOX ================= */
const GUI_DONE_KEY = 'mc_pack_studio_gui_checked_status';

function getDoneList() {
    try {
        const raw = localStorage.getItem(GUI_DONE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function setDoneItem(id, isDone) {
    const list = getDoneList();
    if (isDone) {
        list[id] = true;
    } else {
        delete list[id];
    }
    localStorage.setItem(GUI_DONE_KEY, JSON.stringify(list));
}

/* ================= 5. MODAL PROJECT (CÂY THƯ MỤC VS CODE) ================= */
function initProjectModal() {
    const modal = document.getElementById('modal-project');
    const openBtn = document.getElementById('btn-open-project');
    const closeBtn = document.getElementById('btn-close-project');
    const container = document.getElementById('folder-tree-container');
    const searchInput = document.getElementById('gui-search-input');

    openBtn.onclick = () => {
        buildMobileVsCodeTree(container);
        modal.classList.add('active');
    };

    closeBtn.onclick = () => modal.classList.remove('active');

    if (searchInput) {
        searchInput.oninput = (e) => {
            const term = e.target.value.trim().toLowerCase();
            document.querySelectorAll('.tree-file-row').forEach(row => {
                const match = row.dataset.name.includes(term) || row.dataset.id.includes(term);
                row.style.display = match ? 'flex' : 'none';

                // Tự động mở thư mục cha nếu có file khớp tìm kiếm
                if (match && term.length > 0) {
                    let parent = row.closest('.tree-children');
                    while (parent) {
                        parent.style.display = 'block';
                        const arrow = parent.previousElementSibling?.querySelector('.tree-arrow');
                        if (arrow) arrow.style.transform = 'rotate(90deg)';
                        parent = parent.parentElement.closest('.tree-children');
                    }
                }
            });
        };
    }
}

function buildMobileVsCodeTree(container) {
    container.innerHTML = '';
    const doneList = getDoneList();

    function createNode(node, depth = 0) {
        const isFolder = Array.isArray(node.children);
        const wrap = document.createElement('div');

        const row = document.createElement('div');
        row.className = isFolder ? 'tree-row tree-folder-row' : 'tree-row tree-file-row';
        row.style.paddingLeft = `${depth * 14 + 6}px`;

        if (isFolder) {
            row.innerHTML = `
                <span class="tree-arrow" style="display:inline-block; font-size:10px; color:#8c8c8c; margin-right:4px; transform:rotate(90deg); transition:0.15s;">▶</span>
                <span style="font-weight:600; color:#ccc;">📁 ${node.name}</span>
            `;

            const childrenBox = document.createElement('div');
            childrenBox.className = 'tree-children';
            childrenBox.style.marginLeft = '10px';
            childrenBox.style.borderLeft = '1px solid #2b2b2b';
            childrenBox.style.display = 'block';

            node.children.forEach(child => {
                childrenBox.appendChild(createNode(child, depth + 1));
            });

            row.onclick = (e) => {
                e.stopPropagation();
                const isOpen = childrenBox.style.display !== 'none';
                childrenBox.style.display = isOpen ? 'none' : 'block';
                const arrow = row.querySelector('.tree-arrow');
                if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
            };

            wrap.appendChild(row);
            wrap.appendChild(childrenBox);
        } else {
            // File ảnh GUI (.png)
            row.dataset.id = node.id;
            row.dataset.name = node.name.toLowerCase();

            const isDone = !!doneList[node.id];
            if (isDone) row.classList.add('is-done');
            if (state.currentGui && state.currentGui.id === node.id) row.classList.add('active');

            row.innerHTML = `
                <input type="checkbox" class="tree-gui-check" ${isDone ? 'checked' : ''}>
                <span style="margin-right:4px;">🖼️</span>
                <span class="file-name" style="flex:1;">${node.name}</span>
                ${isDone ? '<span style="color:#2ea043; font-weight:bold; font-size:12px;">✓</span>' : ''}
            `;

            const chk = row.querySelector('.tree-gui-check');
            chk.onclick = (e) => {
                e.stopPropagation();
                setDoneItem(node.id, chk.checked);
                row.classList.toggle('is-done', chk.checked);
            };

            row.onclick = () => {
                selectGuiNode(node);
                document.getElementById('modal-project').classList.remove('active');
            };

            wrap.appendChild(row);
        }

        return wrap;
    }

    container.appendChild(createNode(GUI_TREE_DATA));
}

function getFallbackGui(name) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="#c6c6c6"/>
        <rect x="6" y="6" width="244" height="244" fill="none" stroke="#fff" stroke-width="4"/>
        <rect x="10" y="10" width="236" height="236" fill="none" stroke="#555" stroke-width="4"/>
        <text x="128" y="32" font-family="monospace" font-size="14" font-weight="bold" fill="#222" text-anchor="middle">${name.toUpperCase()}</text>
        <rect x="20" y="50" width="216" height="70" fill="#8b8b8b" stroke="#373737" stroke-width="2"/>
        <text x="128" y="90" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle">MINECRAFT GUI CHUẨN</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function selectGuiNode(guiNode) {
    state.currentGui = { ...guiNode };
    const nameEl = document.getElementById('current-gui-name');
    if (nameEl) nameEl.innerText = guiNode.name;

    state.guiLoaded = false;
    state.guiImage = new Image();
    state.guiImage.crossOrigin = 'Anonymous';
    state.guiImage.onload = () => {
        state.guiLoaded = true;
        state.guiWidth = state.guiImage.naturalWidth || 256;
        state.guiHeight = state.guiImage.naturalHeight || 256;
        fitGuiToScreen();
        renderCanvas();
    };
    state.guiImage.onerror = () => {
        state.guiImage.src = getFallbackGui(guiNode.name);
    };
    // Tải theo đường dẫn chuẩn 100%
    state.guiImage.src = guiNode.path;
}

function fitGuiToScreen() {
    const pad = 40;
    const w = viewport.clientWidth - pad;
    const h = viewport.clientHeight - pad;
    const sX = w / (state.guiWidth || 256);
    const sY = h / (state.guiHeight || 256);
    state.zoom = Math.min(sX, sY, 2.5) || 1;
    state.panX = (viewport.clientWidth - state.guiWidth * state.zoom) / 2;
    state.panY = (viewport.clientHeight - state.guiHeight * state.zoom) / 2;
    updateZoomText();
    renderCanvas();
}

function updateZoomText() {
    const el = document.getElementById('zoom-text');
    if (el) el.innerText = `${Math.round(state.zoom * 100)}%`;
}

/* ================= 6. BONG BÓNG NỔI (FLOATING BUBBLE) & MODAL LAYER ================= */
function initFloatingBubble() {
    const bubble = document.getElementById('layer-bubble');
    if (!bubble) return;

    let startY = 0, currentY = 120, isDraggingBubble = false;

    bubble.addEventListener('touchstart', (e) => {
        isDraggingBubble = false;
        startY = e.touches[0].clientY - currentY;
    }, { passive: true });

    bubble.addEventListener('touchmove', (e) => {
        isDraggingBubble = true;
        currentY = e.touches[0].clientY - startY;
        currentY = Math.max(60, Math.min(window.innerHeight - 130, currentY));
        bubble.style.top = `${currentY}px`;
    }, { passive: true });

    bubble.addEventListener('touchend', () => {
        if (!isDraggingBubble) openLayerModal();
    });

    bubble.onclick = () => {
        if (!isDraggingBubble) openLayerModal();
    };
}

function openLayerModal() {
    renderLayerItems();
    document.getElementById('modal-layers').classList.add('active');
}

function updateLayerBadge() {
    const badge = document.getElementById('layer-count-badge');
    if (badge) badge.innerText = state.layers.length;
}

function initLayerModalEvents() {
    const modal = document.getElementById('modal-layers');
    const closeBtn = document.getElementById('btn-close-layers');
    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');

    // Nút mũi tên đổi tầng: ⬆️ Lên trên / ⬇️ Xuống dưới
    const upBtn = document.getElementById('btn-layer-up');
    const downBtn = document.getElementById('btn-layer-down');
    if (upBtn) upBtn.onclick = () => moveSelectedLayer(-1);
    if (downBtn) downBtn.onclick = () => moveSelectedLayer(1);
}

function renderLayerItems() {
    const container = document.getElementById('layers-list-container');
    if (!container) return;
    container.innerHTML = '';

    const list = [];
    for (let i = state.layers.length - 1; i >= state.guiLayerIndex; i--) {
        list.push({ type: 'layer', index: i, tag: '✨ Trên GUI' });
    }
    list.push({ type: 'barrier' });
    for (let i = state.guiLayerIndex - 1; i >= 0; i--) {
        list.push({ type: 'layer', index: i, tag: '🖼️ Dưới GUI' });
    }

    list.forEach(item => {
        if (item.type === 'barrier') {
            const bar = document.createElement('div');
            bar.className = 'mobile-layer-item gui-barrier';
            bar.innerHTML = `<span>🔒 <b>Khung GUI Gốc</b> (Ranh giới)</span><span style="font-size:11px; color:#888;">Cố định</span>`;
            container.appendChild(bar);
        } else {
            const layer = state.layers[item.index];
            const row = document.createElement('div');
            row.className = `mobile-layer-item ${state.selectedLayerIndex === item.index ? 'active' : ''}`;
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px;">
                    <span style="font-size:11px; color:#58a6ff;">${item.tag}</span>
                    <span>${layer.name}</span>
                </div>
                <button class="btn-del-layer" style="background:none; border:none; color:#f85149; font-size:15px; padding:4px;">✕</button>
            `;

            row.querySelector('.btn-del-layer').onclick = (e) => {
                e.stopPropagation();
                deleteLayer(item.index);
                renderLayerItems();
            };

            row.onclick = () => {
                state.selectedLayerIndex = item.index;
                renderLayerItems();
                updatePropertiesSheetData();
                renderCanvas();
            };

            container.appendChild(row);
        }
    });

    updateLayerBadge();
}

function moveSelectedLayer(dir) {
    if (state.selectedLayerIndex === null) {
        alert("Vui lòng chạm chọn 1 Layer trước khi bấm mũi tên!");
        return;
    }
    const cur = state.selectedLayerIndex;
    // dir < 0: tăng index trong mảng (hiển thị lên trên); dir > 0: giảm index
    const target = cur + (dir < 0 ? 1 : -1);

    if (target < 0 || target >= state.layers.length) return;

    const layer = state.layers.splice(cur, 1)[0];
    state.layers.splice(target, 0, layer);
    state.selectedLayerIndex = target;

    renderLayerItems();
    updatePropertiesSheetData();
    saveHistoryState();
    renderCanvas();
}

function deleteLayer(idx) {
    state.layers.splice(idx, 1);
    if (idx < state.guiLayerIndex) state.guiLayerIndex--;
    state.selectedLayerIndex = null;
    closePropertiesSheet();
    updateLayerBadge();
    saveHistoryState();
    renderCanvas();
}

/* ================= 7. BOTTOM SHEET: THUỘC TÍNH LAYER (ẢNH 2) ================= */
function initPropertiesSheet() {
    const sheet = document.getElementById('sheet-properties');
    document.getElementById('btn-close-properties').onclick = closePropertiesSheet;
    document.getElementById('prop-drag-close').onclick = closePropertiesSheet;

    document.getElementById('btn-open-props').onclick = () => {
        if (state.selectedLayerIndex === null && state.layers.length > 0) {
            state.selectedLayerIndex = state.layers.length - 1;
        }
        if (state.selectedLayerIndex !== null) openPropertiesSheet();
        else alert("Vui lòng chạm chọn hoặc thêm 1 ảnh trước!");
    };

    const px = document.getElementById('prop-x');
    const py = document.getElementById('prop-y');
    const pw = document.getElementById('prop-w');
    const ph = document.getElementById('prop-h');
    const pAspect = document.getElementById('prop-aspect');
    const pRot = document.getElementById('prop-rot');
    const pOp = document.getElementById('prop-opacity');
    const opVal = document.getElementById('opacity-val');

    px.oninput = (e) => { const l = getActiveLayer(); if (l) { l.x = parseFloat(e.target.value) || 0; renderCanvas(); } };
    px.onchange = saveHistoryState;

    py.oninput = (e) => { const l = getActiveLayer(); if (l) { l.y = parseFloat(e.target.value) || 0; renderCanvas(); } };
    py.onchange = saveHistoryState;

    pw.oninput = (e) => {
        const l = getActiveLayer();
        if (l) {
            l.width = parseFloat(e.target.value) || 10;
            if (pAspect.checked) {
                l.height = Math.round(l.width / l.aspectRatio);
                ph.value = l.height;
            }
            renderCanvas();
        }
    };
    pw.onchange = saveHistoryState;

    ph.oninput = (e) => {
        const l = getActiveLayer();
        if (l) {
            l.height = parseFloat(e.target.value) || 10;
            if (pAspect.checked) {
                l.width = Math.round(l.height * l.aspectRatio);
                pw.value = l.width;
            }
            renderCanvas();
        }
    };
    ph.onchange = saveHistoryState;

    pRot.oninput = (e) => { const l = getActiveLayer(); if (l) { l.rotation = parseFloat(e.target.value) || 0; renderCanvas(); } };
    pRot.onchange = saveHistoryState;

    pOp.oninput = (e) => {
        const l = getActiveLayer();
        if (l) {
            l.opacity = parseFloat(e.target.value);
            opVal.innerText = `${Math.round(l.opacity * 100)}%`;
            renderCanvas();
        }
    };
    pOp.onchange = saveHistoryState;

    document.getElementById('btn-flip-h').onclick = () => {
        const l = getActiveLayer();
        if (l) {
            l.flipX = !l.flipX;
            document.getElementById('btn-flip-h').classList.toggle('active', l.flipX);
            renderCanvas();
            saveHistoryState();
        }
    };

    document.getElementById('btn-flip-v').onclick = () => {
        const l = getActiveLayer();
        if (l) {
            l.flipY = !l.flipY;
            document.getElementById('btn-flip-v').classList.toggle('active', l.flipY);
            renderCanvas();
            saveHistoryState();
        }
    };
}

function openPropertiesSheet() {
    updatePropertiesSheetData();
    document.getElementById('sheet-properties').classList.add('open');
}

function closePropertiesSheet() {
    document.getElementById('sheet-properties').classList.remove('open');
}

function updatePropertiesSheetData() {
    const l = getActiveLayer();
    const statusText = document.getElementById('layer-status-text');

    if (!l) {
        document.getElementById('prop-x').value = 0;
        document.getElementById('prop-y').value = 0;
        document.getElementById('prop-w').value = 0;
        document.getElementById('prop-h').value = 0;
        document.getElementById('prop-rot').value = 0;
        document.getElementById('prop-opacity').value = 1;
        document.getElementById('opacity-val').innerText = '100%';
        if (statusText) statusText.innerText = "💡 Chưa chọn layer nào.";
        return;
    }

    document.getElementById('prop-x').value = Math.round(l.x);
    document.getElementById('prop-y').value = Math.round(l.y);
    document.getElementById('prop-w').value = Math.round(l.width);
    document.getElementById('prop-h').value = Math.round(l.height);
    document.getElementById('prop-rot').value = Math.round(l.rotation);
    document.getElementById('prop-opacity').value = l.opacity;
    document.getElementById('opacity-val').innerText = `${Math.round(l.opacity * 100)}%`;

    document.getElementById('btn-flip-h').classList.toggle('active', !!l.flipX);
    document.getElementById('btn-flip-v').classList.toggle('active', !!l.flipY);

    const isAbove = state.selectedLayerIndex >= state.guiLayerIndex;
    if (statusText) {
        statusText.innerHTML = `Tầng hiển thị: <b>${isAbove ? '✨ NẰM TRÊN GUI' : '🖼️ NẰM DƯỚI GUI'}</b><br><small style="color:#888;">(Bấm bong bóng để đổi tầng hiển thị)</small>`;
    }
}

function getActiveLayer() {
    return state.selectedLayerIndex !== null ? state.layers[state.selectedLayerIndex] : null;
}

/* ================= 8. BOTTOM TOOLBAR (CUỘN NGANG) ================= */
function initToolbarEvents() {
    document.getElementById('btn-fit-screen').onclick = fitGuiToScreen;

    // Undo / Redo
    document.getElementById('btn-undo').onclick = undo;
    document.getElementById('btn-redo').onclick = redo;

    // Nút Delete
    document.getElementById('btn-delete').onclick = () => {
        if (state.selectedLayerIndex !== null) {
            deleteLayer(state.selectedLayerIndex);
        } else {
            alert("Vui lòng chạm chọn layer cần xóa!");
        }
    };

    // Upload thêm ảnh
    const uploadInput = document.getElementById('img-upload-input');
    uploadInput.onchange = (e) => {
        if (e.target.files) handleImageUploads(e.target.files);
        uploadInput.value = '';
    };

    // Nút Xóa nền AI
    document.getElementById('btn-ai-remove-bg').onclick = runSmartAiBackgroundRemoval;

    // Nút Export PNG
    document.getElementById('btn-export-png').onclick = exportGuiAsPng;
}

function handleImageUploads(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const layer = {
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
                state.layers.push(layer);
                state.selectedLayerIndex = state.layers.length - 1;
                updateLayerBadge();
                openPropertiesSheet();
                saveHistoryState();
                renderCanvas();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/* ================= 9. THUẬT TOÁN XÓA NỀN THÔNG MINH (FLOOD-FILL BFS) ================= */
function runSmartAiBackgroundRemoval() {
    const layer = getActiveLayer();
    if (!layer) return alert("Vui lòng chạm chọn 1 ảnh layer cần xóa nền!");

    const loading = document.getElementById('ai-loading');
    if (loading) loading.style.display = 'flex';

    setTimeout(() => {
        try {
            const w = layer.img.naturalWidth || layer.img.width;
            const h = layer.img.naturalHeight || layer.img.height;
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const cCtx = c.getContext('2d');
            cCtx.drawImage(layer.img, 0, 0);

            const imgData = cCtx.getImageData(0, 0, w, h);
            const data = imgData.data;

            // Lấy mẫu màu nền đại diện tại 4 góc
            const corners = [0, (w - 1) * 4, ((h - 1) * w) * 4, ((h - 1) * w + (w - 1)) * 4];
            const bgSamples = [];
            corners.forEach(idx => {
                if (data[idx + 3] > 20) {
                    bgSamples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
                }
            });
            if (!bgSamples.length) bgSamples.push({ r: 255, g: 255, b: 255 });

            const visited = new Uint8Array(w * h);
            const queue = [];

            function isBgColor(r, g, b) {
                const tol = 38; // Ngưỡng dung sai màu
                return bgSamples.some(s => Math.hypot(r - s.r, g - s.g, b - s.b) <= tol);
            }

            // Đưa tất cả pixel viền ngoài vào hàng đợi BFS
            for (let x = 0; x < w; x++) {
                queue.push(x, (h - 1) * w + x);
                visited[x] = 1;
                visited[(h - 1) * w + x] = 1;
            }
            for (let y = 0; y < h; y++) {
                queue.push(y * w, y * w + (w - 1));
                visited[y * w] = 1;
                visited[y * w + (w - 1)] = 1;
            }

            let head = 0;
            while (head < queue.length) {
                const pos = queue[head++];
                const p = pos * 4;
                if (data[p + 3] === 0 || isBgColor(data[p], data[p + 1], data[p + 2])) {
                    data[p + 3] = 0; // Xóa trong suốt

                    const cx = pos % w;
                    const cy = Math.floor(pos / w);
                    const nb = [
                        cx > 0 ? pos - 1 : -1,
                        cx < w - 1 ? pos + 1 : -1,
                        cy > 0 ? pos - w : -1,
                        cy < h - 1 ? pos + w : -1
                    ];

                    for (let i = 0; i < 4; i++) {
                        const nPos = nb[i];
                        if (nPos !== -1 && !visited[nPos]) {
                            visited[nPos] = 1;
                            queue.push(nPos);
                        }
                    }
                }
            }

            // Khử răng cưa viền
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = (y * w + x) * 4;
                    if (data[idx + 3] > 0) {
                        const topA = data[((y - 1) * w + x) * 4 + 3];
                        const botA = data[((y + 1) * w + x) * 4 + 3];
                        const leftA = data[(y * w + (x - 1)) * 4 + 3];
                        const rightA = data[(y * w + (x + 1)) * 4 + 3];
                        if (topA === 0 || botA === 0 || leftA === 0 || rightA === 0) {
                            data[idx + 3] = Math.round(data[idx + 3] * 0.75);
                        }
                    }
                }
            }

            cCtx.putImageData(imgData, 0, 0);

            const outImg = new Image();
            outImg.onload = () => {
                layer.img = outImg;
                if (loading) loading.style.display = 'none';
                saveHistoryState();
                renderCanvas();
            };
            outImg.src = c.toDataURL('image/png');
        } catch (err) {
            if (loading) loading.style.display = 'none';
            alert("Lỗi xóa nền: " + err.message);
        }
    }, 100);
}

/* ================= 10. TOUCH VÀ GESTURES TRÊN CANVAS ================= */
function initTouchAndCanvasEvents() {
    viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const p = getCanvasCoords(touch.clientX, touch.clientY);

            // Hit test layer từ trên xuống dưới
            let hitIdx = null;
            for (let i = state.layers.length - 1; i >= 0; i--) {
                if (hitTestLayer(p, state.layers[i])) {
                    hitIdx = i;
                    break;
                }
            }

            if (hitIdx !== null) {
                state.selectedLayerIndex = hitIdx;
                state.mode = 'move-layer';
                state.dragStart = { x: p.x, y: p.y };
                const l = state.layers[hitIdx];
                state.layerStartPos = { x: l.x, y: l.y };
                openPropertiesSheet();
            } else {
                state.mode = 'pan-viewport';
                state.dragStart = { x: touch.clientX - state.panX, y: touch.clientY - state.panY };
            }
            renderCanvas();
        } else if (e.touches.length === 2) {
            // Pinch-to-zoom 2 ngón tay
            state.mode = 'pinch-zoom';
            state.touchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            state.startZoom = state.zoom;
        }
    }, { passive: false });

    viewport.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Ngăn cuộn nảy trình duyệt

        if (state.mode === 'move-layer') {
            const l = getActiveLayer();
            if (!l) return;
            const p = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
            l.x = state.layerStartPos.x + (p.x - state.dragStart.x);
            l.y = state.layerStartPos.y + (p.y - state.dragStart.y);
            updatePropertiesSheetData();
            renderCanvas();
        } else if (state.mode === 'pan-viewport') {
            state.panX = e.touches[0].clientX - state.dragStart.x;
            state.panY = e.touches[0].clientY - state.dragStart.y;
            renderCanvas();
        } else if (state.mode === 'pinch-zoom' && e.touches.length === 2) {
            const curDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const scale = curDist / state.touchStartDist;
            state.zoom = Math.min(Math.max(0.2, state.startZoom * scale), 6.0);
            updateZoomText();
            renderCanvas();
        }
    }, { passive: false });

    viewport.addEventListener('touchend', () => {
        if (state.mode === 'move-layer') saveHistoryState();
        state.mode = null;
    });
}

function getCanvasCoords(clientX, clientY) {
    const rect = viewport.getBoundingClientRect();
    return {
        x: (clientX - rect.left - state.panX) / state.zoom,
        y: (clientY - rect.top - state.panY) / state.zoom
    };
}

function hitTestLayer(p, l) {
    const cx = l.x + l.width / 2;
    const cy = l.y + l.height / 2;
    const rad = (-l.rotation * Math.PI) / 180;
    const lx = (p.x - cx) * Math.cos(rad) - (p.y - cy) * Math.sin(rad);
    const ly = (p.x - cx) * Math.sin(rad) + (p.y - cy) * Math.cos(rad);
    return Math.abs(lx) <= l.width / 2 && Math.abs(ly) <= l.height / 2;
}

/* ================= 11. VẼ CANVAS HIỂN THỊ ================= */
function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.zoom, state.zoom);

    // 1. Vẽ các layer NẰM DƯỚI GUI
    for (let i = 0; i < state.guiLayerIndex; i++) {
        if (state.layers[i]) renderLayer(ctx, state.layers[i]);
    }

    // 2. Vẽ Khung GUI gốc
    if (state.guiLoaded) {
        ctx.drawImage(state.guiImage, 0, 0, state.guiWidth, state.guiHeight);
    }

    // 3. Vẽ các layer NẰM TRÊN GUI
    for (let i = state.guiLayerIndex; i < state.layers.length; i++) {
        if (state.layers[i]) renderLayer(ctx, state.layers[i]);
    }

    // 4. Viền xanh bao quanh layer đang chọn
    const active = getActiveLayer();
    if (active) drawBoundingBox(ctx, active);

    ctx.restore();
}

function renderLayer(context, l) {
    context.save();
    context.globalAlpha = l.opacity;
    const cx = l.x + l.width / 2;
    const cy = l.y + l.height / 2;
    context.translate(cx, cy);
    context.rotate((l.rotation * Math.PI) / 180);
    context.scale(l.flipX ? -1 : 1, l.flipY ? -1 : 1);
    context.drawImage(l.img, -l.width / 2, -l.height / 2, l.width, l.height);
    context.restore();
}

function drawBoundingBox(context, l) {
    context.save();
    const cx = l.x + l.width / 2;
    const cy = l.y + l.height / 2;
    context.translate(cx, cy);
    context.rotate((l.rotation * Math.PI) / 180);

    context.strokeStyle = '#58a6ff';
    context.lineWidth = 2 / state.zoom;
    context.strokeRect(-l.width / 2, -l.height / 2, l.width, l.height);

    context.restore();
}

/* ================= 12. EXPORT PNG & LỊCH SỬ UNDO/REDO ================= */
function exportGuiAsPng() {
    exportCanvas.width = state.guiWidth;
    exportCanvas.height = state.guiHeight;
    exportCtx.imageSmoothingEnabled = false;
    exportCtx.clearRect(0, 0, state.guiWidth, state.guiHeight);

    // Ghép toàn bộ tầng
    for (let i = 0; i < state.guiLayerIndex; i++) {
        if (state.layers[i]) renderLayer(exportCtx, state.layers[i]);
    }
    if (state.guiLoaded) exportCtx.drawImage(state.guiImage, 0, 0, state.guiWidth, state.guiHeight);
    for (let i = state.guiLayerIndex; i < state.layers.length; i++) {
        if (state.layers[i]) renderLayer(exportCtx, state.layers[i]);
    }

    const link = document.createElement('a');
    link.download = state.currentGui.name;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
}

function saveHistoryState() {
    const snap = JSON.stringify({
        layers: state.layers.map(l => ({ ...l, imgSrc: l.img.src })),
        guiLayerIndex: state.guiLayerIndex,
        selectedLayerIndex: state.selectedLayerIndex
    });
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snap);
    state.historyIndex = state.history.length - 1;
}

function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreHistoryState(state.history[state.historyIndex]);
    }
}

function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreHistoryState(state.history[state.historyIndex]);
    }
}

function restoreHistoryState(jsonStr) {
    const data = JSON.parse(jsonStr);
    state.guiLayerIndex = data.guiLayerIndex;
    state.selectedLayerIndex = data.selectedLayerIndex;
    state.layers = [];

    if (!data.layers.length) {
        updateLayerBadge();
        updatePropertiesSheetData();
        renderCanvas();
        return;
    }

    let loaded = 0;
    data.layers.forEach((l, idx) => {
        const img = new Image();
        img.onload = () => {
            state.layers[idx] = { ...l, img };
            loaded++;
            if (loaded === data.layers.length) {
                updateLayerBadge();
                updatePropertiesSheetData();
                renderCanvas();
            }
        };
        img.src = l.imgSrc;
    });
}