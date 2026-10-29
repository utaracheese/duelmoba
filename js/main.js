/* ================= 7. APP INITIALIZATION & NAVIGATION ================= */
window.addEventListener('DOMContentLoaded', () => {
    initWelcomeModal();
    initFolderTree();
    initViewSwitching();
    initCanvasEvents();
    initPropertyBindings();
    initPackBuilderFull();

    // Chọn GUI mặc định đầu tiên
    const firstGui = GUI_TREE_DATA["textures/gui/container"][0];
    selectGui(firstGui, "textures/gui/container");
    saveHistory();
});

function initWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    const startBtn = document.getElementById('start-app-btn');
    if (startBtn) {
        startBtn.onclick = () => modal.style.display = 'none';
    }
}

function initViewSwitching() {
    const btnGui = document.getElementById('switch-gui-btn');
    const btnBuilder = document.getElementById('switch-builder-btn');
    const viewGui = document.getElementById('gui-editor-view');
    const viewBuilder = document.getElementById('pack-builder-view');
    const guiToolbar = document.getElementById('gui-toolbar-actions');

    btnGui.onclick = () => {
        btnGui.classList.add('active');
        btnBuilder.classList.remove('active');
        viewGui.classList.add('active');
        viewBuilder.classList.remove('active');
        guiToolbar.style.display = 'flex';
        fitCanvasToScreen();
        requestRender();
    };

    btnBuilder.onclick = () => {
        btnBuilder.classList.add('active');
        btnGui.classList.remove('active');
        viewBuilder.classList.add('active');
        viewGui.classList.remove('active');
        guiToolbar.style.display = 'none';
        renderAllBuilderGrids();
    };

    const navBtns = document.querySelectorAll('.builder-nav-btn');
    navBtns.forEach(btn => {
        btn.onclick = () => {
            navBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.builder-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        };
    });
}