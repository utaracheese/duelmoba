/* ================= 2. GLOBAL STATE ================= */
const state = {
    currentGui: null,
    guiImage: new Image(),
    guiLoaded: false,
    guiWidth: 256,
    guiHeight: 256,

    layers: [],
    guiLayerIndex: 0,
    selectedLayerIndex: null,

    zoom: 1, 
    panX: 0, 
    panY: 0,
    isDragging: false, 
    isResizing: false, 
    isRotating: false, 
    isPanning: false,
    activeHandle: null, 
    dragStart: { x: 0, y: 0 }, 
    transformStart: {},

    history: [], 
    historyIndex: -1,

    packIconDataUrl: null,
    builderAssets: {
        items: [],
        blocks: [],
        guisContainer: [],
        guisRoot: [],
        skybox: []
    }
};