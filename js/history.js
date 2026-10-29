/* ================= 4. UNDO / REDO HISTORY ================= */
function saveHistory() {
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
        restoreHistory(state.history[state.historyIndex]);
    }
}

function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreHistory(state.history[state.historyIndex]);
    }
}

function restoreHistory(str) {
    const data = JSON.parse(str);
    state.guiLayerIndex = data.guiLayerIndex;
    state.selectedLayerIndex = data.selectedLayerIndex;
    state.layers = [];

    let loaded = 0;
    if (data.layers.length === 0) {
        renderLayersList(); updateProperties(); requestRender(); return;
    }

    data.layers.forEach((l, idx) => {
        const img = new Image();
        img.onload = () => {
            state.layers[idx] = { ...l, img };
            loaded++;
            if (loaded === data.layers.length) {
                renderLayersList(); updateProperties(); requestRender();
            }
        };
        img.src = l.imgSrc;
    });
}