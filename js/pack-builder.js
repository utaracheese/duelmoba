/* ==========================================================================
   PACK BUILDER MODULE - MINECRAFT RESOURCE PACK STUDIO
   Hỗ trợ: Thêm Items, Blocks, GUI, Skybox, nạp ZIP/RAR/JSON và xuất ZIP chuẩn
   ========================================================================== */

/* ==========================================================================
   PACK BUILDER MODULE - MINECRAFT RESOURCE PACK STUDIO
   Hỗ trợ: Items, Blocks, GUI, Skybox, nạp .ZIP / .JSON và xuất ZIP chuẩn
   ========================================================================== */

function initPackBuilderFull() {
    // Gợi ý ID
    if (typeof PRESET_IDS !== 'undefined') {
        const itemDatalist = document.getElementById("item-suggestions");
        if (itemDatalist && PRESET_IDS.items) {
            itemDatalist.innerHTML = PRESET_IDS.items.map(id => `<option value="${id}">`).join('');
        }

        const blockDatalist = document.getElementById("block-suggestions");
        if (blockDatalist && PRESET_IDS.blocks) {
            blockDatalist.innerHTML = PRESET_IDS.blocks.map(id => `<option value="${id}">`).join('');
        }

        const guiDatalist = document.getElementById("gui-suggestions");
        if (guiDatalist && PRESET_IDS.gui) {
            guiDatalist.innerHTML = PRESET_IDS.gui.map(id => `<option value="${id}">`).join('');
        }
    }

    // Phiên bản Minecraft
    const selectSingle = document.getElementById("mcVersionSingle");
    const selectMin = document.getElementById("mcMinVersion");
    const selectMax = document.getElementById("mcMaxVersion");

    if (typeof MINECRAFT_VERSIONS !== 'undefined' && selectSingle) {
        selectSingle.innerHTML = "";
        MINECRAFT_VERSIONS.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v.format;
            opt.textContent = `Minecraft ${v.version} (pack_format: ${v.format})`;
            selectSingle.appendChild(opt);
        });
    }

    if (typeof RANGE_VERSIONS !== 'undefined' && selectMin && selectMax) {
        selectMin.innerHTML = "";
        RANGE_VERSIONS.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v.format;
            opt.textContent = `Minecraft ${v.version} (${v.format})`;
            selectMin.appendChild(opt);
        });

        function updateMaxVersionOptions() {
            const minFmt = parseInt(selectMin.value, 10);
            selectMax.innerHTML = "";
            RANGE_VERSIONS.forEach(v => {
                if (v.format >= minFmt) {
                    const opt = document.createElement("option");
                    opt.value = v.format;
                    opt.textContent = `Minecraft ${v.version} (${v.format})`;
                    selectMax.appendChild(opt);
                }
            });
        }
        selectMin.onchange = updateMaxVersionOptions;
        updateMaxVersionOptions();
    }

    // Radio chuyển đổi Version
    document.querySelectorAll('input[name="verMode"]').forEach(radio => {
        radio.onchange = (e) => {
            const isSingle = e.target.value === 'single';
            const singleBox = document.getElementById('single-version-box');
            const rangeBox = document.getElementById('range-version-box');
            if (singleBox) singleBox.style.display = isSingle ? 'block' : 'none';
            if (rangeBox) rangeBox.style.display = isSingle ? 'none' : 'block';
        };
    });

    // Icon Pack
    const iconInput = document.getElementById("packIconInput");
    const uploadIconBtn = document.getElementById("uploadIconBtn");
    const iconPreviewWrapper = document.getElementById("packIconPreviewWrapper");
    const removeIconBtn = document.getElementById("removeIconBtn");

    if (uploadIconBtn && iconInput) uploadIconBtn.onclick = () => iconInput.click();
    if (iconPreviewWrapper && iconInput) iconPreviewWrapper.onclick = () => iconInput.click();

    if (iconInput) {
        iconInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.type === "image/png") {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    state.packIconDataUrl = evt.target.result;
                    const previewImg = document.getElementById("packIconPreview");
                    if (previewImg) previewImg.src = state.packIconDataUrl;
                    if (removeIconBtn) removeIconBtn.style.display = "inline-block";
                };
                reader.readAsDataURL(file);
            } else {
                alert("Vui lòng chọn đúng file ảnh định dạng .png!");
            }
        };
    }

    if (removeIconBtn) {
        removeIconBtn.onclick = () => {
            state.packIconDataUrl = null;
            const previewImg = document.getElementById("packIconPreview");
            if (previewImg) {
                previewImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg>";
            }
            removeIconBtn.style.display = "none";
            if (iconInput) iconInput.value = "";
        };
    }

    setupAutoIdFromFile("item-file", "item-id");
    setupAutoIdFromFile("block-file", "block-id");
    setupAutoIdFromFile("gui-container-single-file", "gui-container-id");
    setupAutoIdFromFile("gui-root-single-file", "gui-root-id");

    const itemAnimCheckbox = document.getElementById("item-has-anim");
    if (itemAnimCheckbox) {
        itemAnimCheckbox.onchange = (e) => {
            const opt = document.getElementById("item-anim-options");
            if (opt) opt.style.display = e.target.checked ? "flex" : "none";
        };
    }

    // ================= NẠP DỰ ÁN (.JSON / .ZIP) =================
    const uploadInput = document.getElementById('upload-project-json');
    if (uploadInput) {
        uploadInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const fileName = file.name.toLowerCase();

            // A. Nạp file .JSON
            if (fileName.endsWith('.json')) {
                const r = new FileReader();
                r.onload = (evt) => {
                    try {
                        const p = JSON.parse(evt.target.result);
                        if (p.packName) document.getElementById('pack-name').value = p.packName;
                        if (p.packDesc) document.getElementById('pack-desc').value = p.packDesc;
                        if (p.verMode) {
                            const radio = document.querySelector(`input[name="verMode"][value="${p.verMode}"]`);
                            if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
                        }
                        if (p.mcVersionFormat && selectSingle) selectSingle.value = p.mcVersionFormat;
                        if (p.mcMinVersionFormat && selectMin) {
                            selectMin.value = p.mcMinVersionFormat;
                            selectMin.dispatchEvent(new Event('change'));
                        }
                        if (p.mcMaxVersionFormat && selectMax) selectMax.value = p.mcMaxVersionFormat;

                        if (p.packIconDataUrl) {
                            state.packIconDataUrl = p.packIconDataUrl;
                            const previewImg = document.getElementById("packIconPreview");
                            if (previewImg) previewImg.src = p.packIconDataUrl;
                            if (removeIconBtn) removeIconBtn.style.display = "inline-block";
                        }

                        state.builderAssets.items = p.items || [];
                        state.builderAssets.blocks = p.blocks || [];
                        state.builderAssets.guisContainer = p.guisContainer || [];
                        state.builderAssets.guisRoot = p.guisRoot || [];
                        state.builderAssets.skybox = p.skybox || [];

                        renderAllBuilderGrids();
                        alert("✅ Đã tải dự án JSON thành công!");
                    } catch (err) {
                        alert("Lỗi khi đọc file JSON: " + err.message);
                    }
                };
                r.readAsText(file);
            } 
            // B. Nạp file .ZIP
            else if (fileName.endsWith('.zip')) {
                await extractAndLoadPackZip(file);
            } else {
                alert("Vui lòng chọn file định dạng .zip hoặc .json!");
            }

            uploadInput.value = '';
        };
    }

    // ================= THÊM THỦ CÔNG & BATCH =================
    // Items
    const addItemBtn = document.getElementById("add-item-btn");
    if (addItemBtn) {
        addItemBtn.onclick = () => {
            const idInput = document.getElementById("item-id");
            const fileInput = document.getElementById("item-file");
            const hasAnim = document.getElementById("item-has-anim").checked;
            const frametime = parseInt(document.getElementById("item-frametime").value, 10) || 1;
            const file = fileInput.files[0];

            if (!file) return alert("Vui lòng chọn file ảnh .png!");
            const cleanId = (idInput.value.trim() || file.name.replace(/\.png$/i, '')).toLowerCase().replace(/\s+/g, '_');

            const extraFiles = [];
            if (hasAnim) {
                extraFiles.push({
                    path: `assets/minecraft/textures/item/${cleanId}.png.mcmeta`,
                    content: JSON.stringify({ animation: { frametime } }, null, 2)
                });
            }

            const r = new FileReader();
            r.onload = (e) => {
                state.builderAssets.items.push({
                    id: cleanId,
                    path: `assets/minecraft/textures/item/${cleanId}.png`,
                    dataUrl: e.target.result,
                    extraFiles
                });
                idInput.value = ''; fileInput.value = '';
                document.getElementById("item-has-anim").checked = false;
                document.getElementById("item-anim-options").style.display = "none";
                renderItemGrid(); updateBuilderStats();
            };
            r.readAsDataURL(file);
        };
    }

    setupBatchDropzone('item-dropzone', 'item-batch-upload', (files) => {
        processBatchPngFiles(files, (id, dataUrl) => {
            state.builderAssets.items.push({
                id, path: `assets/minecraft/textures/item/${id}.png`, dataUrl, extraFiles: []
            });
        }, () => { renderItemGrid(); updateBuilderStats(); });
    });

    // Blocks
    const addBlockBtn = document.getElementById("add-block-btn");
    if (addBlockBtn) {
        addBlockBtn.onclick = () => {
            const idInput = document.getElementById("block-id");
            const fileInput = document.getElementById("block-file");
            const file = fileInput.files[0];
            if (!file) return alert("Vui lòng chọn file .png!");

            const cleanId = (idInput.value.trim() || file.name.replace(/\.png$/i, '')).toLowerCase().replace(/\s+/g, '_');
            const r = new FileReader();
            r.onload = (e) => {
                state.builderAssets.blocks.push({
                    id: cleanId, path: `assets/minecraft/textures/block/${cleanId}.png`, dataUrl: e.target.result
                });
                idInput.value = ''; fileInput.value = '';
                renderBlockGrid(); updateBuilderStats();
            };
            r.readAsDataURL(file);
        };
    }

    setupBatchDropzone('block-dropzone', 'block-batch-upload', (files) => {
        processBatchPngFiles(files, (id, dataUrl) => {
            state.builderAssets.blocks.push({
                id, path: `assets/minecraft/textures/block/${id}.png`, dataUrl
            });
        }, () => { renderBlockGrid(); updateBuilderStats(); });
    });

    // Container GUI
    const addGuiContainerBtn = document.getElementById("add-gui-container-btn");
    if (addGuiContainerBtn) {
        addGuiContainerBtn.onclick = () => {
            const idInput = document.getElementById("gui-container-id");
            const fileInput = document.getElementById("gui-container-single-file");
            const file = fileInput.files[0];
            if (!file) return alert("Vui lòng chọn file .png!");

            const cleanId = (idInput.value.trim() || file.name.replace(/\.png$/i, '')).toLowerCase().replace(/\s+/g, '_');
            const r = new FileReader();
            r.onload = (e) => {
                state.builderAssets.guisContainer.push({
                    id: cleanId, path: `assets/minecraft/textures/gui/container/${cleanId}.png`, dataUrl: e.target.result
                });
                idInput.value = ''; fileInput.value = '';
                renderGuiContainerGrid(); updateBuilderStats();
            };
            r.readAsDataURL(file);
        };
    }

    setupBatchDropzone('gui-container-dropzone', 'gui-container-upload', (files) => {
        processBatchPngFiles(files, (id, dataUrl) => {
            state.builderAssets.guisContainer.push({
                id, path: `assets/minecraft/textures/gui/container/${id}.png`, dataUrl
            });
        }, () => { renderGuiContainerGrid(); updateBuilderStats(); });
    });

    // Root GUI
    const addGuiRootBtn = document.getElementById("add-gui-root-btn");
    if (addGuiRootBtn) {
        addGuiRootBtn.onclick = () => {
            const idInput = document.getElementById("gui-root-id");
            const fileInput = document.getElementById("gui-root-single-file");
            const file = fileInput.files[0];
            if (!file) return alert("Vui lòng chọn file .png!");

            const cleanId = (idInput.value.trim() || file.name.replace(/\.png$/i, '')).toLowerCase().replace(/\s+/g, '_');
            const r = new FileReader();
            r.onload = (e) => {
                state.builderAssets.guisRoot.push({
                    id: cleanId, path: `assets/minecraft/textures/gui/${cleanId}.png`, dataUrl: e.target.result
                });
                idInput.value = 'recipe_book'; fileInput.value = '';
                renderGuiRootGrid(); updateBuilderStats();
            };
            r.readAsDataURL(file);
        };
    }

    setupBatchDropzone('gui-root-dropzone', 'gui-root-upload', (files) => {
        processBatchPngFiles(files, (id, dataUrl) => {
            state.builderAssets.guisRoot.push({
                id, path: `assets/minecraft/textures/gui/${id}.png`, dataUrl
            });
        }, () => { renderGuiRootGrid(); updateBuilderStats(); });
    });

    // Skybox
    const addSkyBtn = document.getElementById('btn-add-skybox');
    if (addSkyBtn) {
        addSkyBtn.onclick = () => {
            const modChoice = document.querySelector('input[name="sky-mod"]:checked').value;
            const type = document.getElementById("skybox-type").value;
            const fileInput = document.getElementById("skybox-file");
            const file = fileInput.files[0];
            if (!file) return alert("Vui lòng chọn file .png cho Skybox!");

            const count = state.builderAssets.skybox.filter(a => a.id.startsWith(type)).length + 1;
            const skyName = `${type}${count}`;

            const propertiesContent = `startFadeIn=${document.getElementById("sky-startFadeIn").value}
endFadeIn=${document.getElementById("sky-endFadeIn").value}
startFadeOut=${document.getElementById("sky-startFadeOut").value}
endFadeOut=${document.getElementById("sky-endFadeOut").value}
blend=replace
rotate=${document.getElementById("sky-rotate").value}
axis=${document.getElementById("sky-axis").value}
source=./${skyName}.png`;

            const paths = [];
            if (modChoice === "optifine" || modChoice === "both") paths.push(`assets/minecraft/optifine/sky/world0/`);
            if (modChoice === "mcpatcher" || modChoice === "both") paths.push(`assets/minecraft/mcpatcher/sky/world0/`);

            const extraFiles = [];
            paths.forEach(p => {
                extraFiles.push({ path: `${p}${skyName}.properties`, content: propertiesContent });
            });

            const primaryPath = `${paths[0]}${skyName}.png`;
            if (paths.length > 1) extraFiles.push({ path: `${paths[1]}${skyName}.png`, isImageDuplicate: true });

            const r = new FileReader();
            r.onload = (e) => {
                const dataUrl = e.target.result;
                extraFiles.forEach(ef => { if (ef.isImageDuplicate) ef.dataUrl = dataUrl; });

                state.builderAssets.skybox.push({
                    id: skyName, path: primaryPath, dataUrl, extraFiles
                });
                fileInput.value = '';
                renderSkyboxGrid(); updateBuilderStats();
            };
            r.readAsDataURL(file);
        };
    }

    // Clear Project
    const clearBtn = document.getElementById('btn-clear-project');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dự án hiện tại?")) {
                state.builderAssets = { items: [], blocks: [], guisContainer: [], guisRoot: [], skybox: [] };
                state.packIconDataUrl = null;
                const previewImg = document.getElementById("packIconPreview");
                if (previewImg) {
                    previewImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg>";
                }
                if (removeIconBtn) removeIconBtn.style.display = "none";
                renderAllBuilderGrids();
                alert("Đã làm mới dự án!");
            }
        };
    }

    // Save JSON
    const downloadJsonBtn = document.getElementById('btn-download-project-json');
    if (downloadJsonBtn) {
        downloadJsonBtn.onclick = () => {
            const mode = document.querySelector('input[name="verMode"]:checked').value;
            const project = {
                packName: document.getElementById('pack-name').value,
                verMode: mode,
                mcVersionFormat: document.getElementById('mcVersionSingle').value,
                mcMinVersionFormat: document.getElementById('mcMinVersion').value,
                mcMaxVersionFormat: document.getElementById('mcMaxVersion').value,
                packDesc: document.getElementById('pack-desc').value,
                packIconDataUrl: state.packIconDataUrl,
                items: state.builderAssets.items,
                blocks: state.builderAssets.blocks,
                guisContainer: state.builderAssets.guisContainer,
                guisRoot: state.builderAssets.guisRoot,
                skybox: state.builderAssets.skybox
            };
            const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (project.packName.trim() || 'project').replace(/\s+/g, '_') + '.json';
            a.click();
            URL.revokeObjectURL(a.href);
        };
    }

    // Build ZIP
    const buildZipBtn = document.getElementById('btn-build-zip');
    if (buildZipBtn) buildZipBtn.onclick = buildAndDownloadZip;
}

// ================= GIẢI NÉN FILE .ZIP (100% OFFLINE & MƯỢT) =================
async function extractAndLoadPackZip(file) {
    const loadingOverlay = document.getElementById('ai-loading-overlay');
    const titleEl = document.getElementById('ai-loading-title');
    const descEl = document.getElementById('ai-loading-desc');

    if (titleEl) titleEl.innerText = "Đang giải nén Resource Pack (.ZIP)...";
    if (descEl) descEl.innerText = "Đang đọc các file texture Minecraft...";
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    try {
        const zip = await JSZip.loadAsync(file);
        const fileEntries = new Map();
        const entries = Object.keys(zip.files);

        for (const path of entries) {
            if (!zip.files[path].dir) {
                const u8 = await zip.files[path].async("uint8array");
                fileEntries.set(path.replace(/\\/g, '/'), u8);
            }
        }

        // Đặt lại state
        state.builderAssets = { items: [], blocks: [], guisContainer: [], guisRoot: [], skybox: [] };
        state.packIconDataUrl = null;
        document.getElementById('pack-name').value = file.name.replace(/\.zip$/i, '');

        const textDecoder = new TextDecoder('utf-8');

        function toBase64Png(u8Array) {
            let binary = '';
            const len = u8Array.byteLength;
            const chunk = 8192;
            for (let i = 0; i < len; i += chunk) {
                binary += String.fromCharCode.apply(null, u8Array.subarray(i, i + chunk));
            }
            return `data:image/png;base64,${btoa(binary)}`;
        }

        // 1. Đọc pack.mcmeta
        if (fileEntries.has('pack.mcmeta')) {
            try {
                const metaText = textDecoder.decode(fileEntries.get('pack.mcmeta'));
                const metaJson = JSON.parse(metaText);
                if (metaJson.pack) {
                    if (metaJson.pack.description) {
                        document.getElementById('pack-desc').value = typeof metaJson.pack.description === 'string'
                            ? metaJson.pack.description
                            : JSON.stringify(metaJson.pack.description);
                    }
                    if (metaJson.pack.pack_format !== undefined) {
                        const rSingle = document.querySelector('input[name="verMode"][value="single"]');
                        if (rSingle) { rSingle.checked = true; rSingle.dispatchEvent(new Event('change')); }
                        const sSingle = document.getElementById('mcVersionSingle');
                        if (sSingle) sSingle.value = metaJson.pack.pack_format;
                    } else if (metaJson.pack.min_format !== undefined) {
                        const rRange = document.querySelector('input[name="verMode"][value="range"]');
                        if (rRange) { rRange.checked = true; rRange.dispatchEvent(new Event('change')); }
                        const sMin = document.getElementById('mcMinVersion');
                        const sMax = document.getElementById('mcMaxVersion');
                        if (sMin) {
                            sMin.value = metaJson.pack.min_format;
                            sMin.dispatchEvent(new Event('change'));
                        }
                        if (sMax && metaJson.pack.max_format) sMax.value = metaJson.pack.max_format;
                    }
                }
            } catch (e) {}
        }

        // 2. Đọc pack.png
        if (fileEntries.has('pack.png')) {
            state.packIconDataUrl = toBase64Png(fileEntries.get('pack.png'));
            const previewImg = document.getElementById("packIconPreview");
            if (previewImg) previewImg.src = state.packIconDataUrl;
            const removeBtn = document.getElementById("removeIconBtn");
            if (removeBtn) removeBtn.style.display = "inline-block";
        }

        // 3. Phân loại Textures
        for (const [path, u8Data] of fileEntries.entries()) {
            if (/^assets\/minecraft\/textures\/item\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                const dataUrl = toBase64Png(u8Data);
                const extraFiles = [];
                if (fileEntries.has(`${path}.mcmeta`)) {
                    extraFiles.push({ path: `${path}.mcmeta`, content: textDecoder.decode(fileEntries.get(`${path}.mcmeta`)) });
                }
                state.builderAssets.items.push({ id, path, dataUrl, extraFiles });
            }
            else if (/^assets\/minecraft\/textures\/block\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                state.builderAssets.blocks.push({ id, path, dataUrl: toBase64Png(u8Data) });
            }
            else if (/^assets\/minecraft\/textures\/gui\/container\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                state.builderAssets.guisContainer.push({ id, path, dataUrl: toBase64Png(u8Data) });
            }
            else if (/^assets\/minecraft\/textures\/gui\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                state.builderAssets.guisRoot.push({ id, path, dataUrl: toBase64Png(u8Data) });
            }
            else if (/^assets\/minecraft\/(optifine|mcpatcher)\/sky\/world0\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                const dataUrl = toBase64Png(u8Data);
                const extraFiles = [];
                const propPath = path.replace(/\.png$/i, '.properties');
                if (fileEntries.has(propPath)) {
                    extraFiles.push({ path: propPath, content: textDecoder.decode(fileEntries.get(propPath)) });
                }
                state.builderAssets.skybox.push({ id, path, dataUrl, extraFiles });
            }
        }

        renderAllBuilderGrids();
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        alert(`🎉 Đã tải Resource Pack thành công!\n` +
              `• Items: ${state.builderAssets.items.length}\n` +
              `• Blocks: ${state.builderAssets.blocks.length}\n` +
              `• GUIs: ${state.builderAssets.guisContainer.length + state.builderAssets.guisRoot.length}\n` +
              `• Skybox: ${state.builderAssets.skybox.length}`);
    } catch (err) {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        alert("❌ Lỗi khi đọc file ZIP: " + err.message);
    }
}

// ================= CÁC HÀM TIỆN ÍCH =================
function setupAutoIdFromFile(fileInputId, idInputId) {
    const f = document.getElementById(fileInputId);
    const idInput = document.getElementById(idInputId);
    if (f && idInput) {
        f.onchange = (e) => {
            const file = e.target.files[0];
            if (file && (!idInput.value.trim() || idInput.value === 'recipe_book')) {
                idInput.value = file.name.replace(/\.png$/i, '').toLowerCase().replace(/\s+/g, '_');
            }
        };
    }
}

function setupBatchDropzone(dropzoneId, inputId, onFilesReady) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    if (!dropzone || !input) return;

    dropzone.onclick = () => input.click();
    input.onchange = (e) => {
        if (e.target.files && e.target.files.length) {
            onFilesReady(e.target.files);
            input.value = '';
        }
    };
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length) onFilesReady(e.dataTransfer.files);
    });
}

function processBatchPngFiles(files, itemHandler, onComplete) {
    const validFiles = Array.from(files).filter(f => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png'));
    if (!validFiles.length) return alert("Chỉ chấp nhận file ảnh định dạng .png!");

    let loadedCount = 0;
    validFiles.forEach(file => {
        const rawName = file.name.replace(/\.png$/i, '').trim().toLowerCase().replace(/\s+/g, '_');
        const reader = new FileReader();
        reader.onload = (e) => {
            itemHandler(rawName, e.target.result);
            loadedCount++;
            if (loadedCount === validFiles.length) onComplete();
        };
        reader.readAsDataURL(file);
    });
}

function renderAllBuilderGrids() {
    renderItemGrid();
    renderBlockGrid();
    renderGuiContainerGrid();
    renderGuiRootGrid();
    renderSkyboxGrid();
    updateBuilderStats();
}

function renderItemGrid() {
    const grid = document.getElementById('builder-item-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.items.forEach((item, idx) => {
        grid.appendChild(createAssetCard(
            item,
            (newId) => {
                item.id = newId;
                item.path = `assets/minecraft/textures/item/${newId}.png`;
                if (item.extraFiles && item.extraFiles.length) {
                    item.extraFiles[0].path = `assets/minecraft/textures/item/${newId}.png.mcmeta`;
                }
                renderItemGrid();
            },
            () => {
                state.builderAssets.items.splice(idx, 1);
                renderItemGrid(); updateBuilderStats();
            }
        ));
    });
}

function renderBlockGrid() {
    const grid = document.getElementById('builder-block-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.blocks.forEach((block, idx) => {
        grid.appendChild(createAssetCard(
            block,
            (newId) => {
                block.id = newId;
                block.path = `assets/minecraft/textures/block/${newId}.png`;
                renderBlockGrid();
            },
            () => {
                state.builderAssets.blocks.splice(idx, 1);
                renderBlockGrid(); updateBuilderStats();
            }
        ));
    });
}

function renderGuiContainerGrid() {
    const grid = document.getElementById('builder-gui-container-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.guisContainer.forEach((gui, idx) => {
        grid.appendChild(createAssetCard(
            gui,
            (newId) => {
                gui.id = newId;
                gui.path = `assets/minecraft/textures/gui/container/${newId}.png`;
                renderGuiContainerGrid();
            },
            () => {
                state.builderAssets.guisContainer.splice(idx, 1);
                renderGuiContainerGrid(); updateBuilderStats();
            }
        ));
    });
}

function renderGuiRootGrid() {
    const grid = document.getElementById('builder-gui-root-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.guisRoot.forEach((gui, idx) => {
        grid.appendChild(createAssetCard(
            gui,
            (newId) => {
                gui.id = newId;
                gui.path = `assets/minecraft/textures/gui/${newId}.png`;
                renderGuiRootGrid();
            },
            () => {
                state.builderAssets.guisRoot.splice(idx, 1);
                renderGuiRootGrid(); updateBuilderStats();
            }
        ));
    });
}

function renderSkyboxGrid() {
    const grid = document.getElementById('builder-skybox-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.skybox.forEach((sky, idx) => {
        grid.appendChild(createAssetCard(
            sky,
            (newId) => {
                sky.id = newId;
                renderSkyboxGrid();
            },
            () => {
                state.builderAssets.skybox.splice(idx, 1);
                renderSkyboxGrid(); updateBuilderStats();
            }
        ));
    });
}

function createAssetCard(asset, onRename, onRemove) {
    const card = document.createElement('div');
    card.className = 'asset-card';
    
    let extraLabel = '';
    if (asset.extraFiles && asset.extraFiles.length) {
        extraLabel = `<div style="font-size:10px; color:#81c784; margin-bottom:4px;">+${asset.extraFiles.length} file (.mcmeta/.properties)</div>`;
    }

    card.innerHTML = `
        <img src="${asset.dataUrl}" alt="${asset.id}">
        <input type="text" class="card-rename-input" value="${asset.id}" title="Nhấp để đổi tên ID">
        <div class="path-info">${asset.path}</div>
        ${extraLabel}
        <div class="asset-card-actions">
            <button class="btn-danger remove-btn">Xóa</button>
        </div>
    `;

    const renameInput = card.querySelector('.card-rename-input');
    renameInput.onchange = (e) => {
        const val = e.target.value.trim().toLowerCase().replace(/\s+/g, '_');
        if (val) onRename(val);
        else renameInput.value = asset.id;
    };

    card.querySelector('.remove-btn').onclick = onRemove;
    return card;
}

function updateBuilderStats() {
    const totalGuis = state.builderAssets.guisContainer.length + state.builderAssets.guisRoot.length;
    const sItems = document.getElementById('stat-items');
    const sBlocks = document.getElementById('stat-blocks');
    const sGuis = document.getElementById('stat-guis');
    const sSky = document.getElementById('stat-sky');

    if (sItems) sItems.innerText = `✓ ${state.builderAssets.items.length} Items`;
    if (sBlocks) sBlocks.innerText = `✓ ${state.builderAssets.blocks.length} Blocks`;
    if (sGuis) sGuis.innerText = `✓ ${totalGuis} GUIs`;
    if (sSky) sSky.innerText = `✓ ${state.builderAssets.skybox.length} Skybox`;
}

// ================= BUILD VÀ TẢI VỀ FILE .ZIP =================
async function buildAndDownloadZip() {
    if (typeof JSZip === 'undefined') {
        alert("Thiếu thư viện JSZip!");
        return;
    }

    const zip = new JSZip();
    const packName = (document.getElementById('pack-name').value.trim() || 'ResourcePack').replace(/\s+/g, '_');
    const mode = document.querySelector('input[name="verMode"]:checked').value;
    const desc = document.getElementById('pack-desc').value.trim() || 'Created with Pack Studio';

    let mcmeta = {};
    if (mode === 'range') {
        mcmeta = {
            pack: {
                description: desc,
                min_format: parseInt(document.getElementById('mcMinVersion').value, 10),
                max_format: parseInt(document.getElementById('mcMaxVersion').value, 10)
            }
        };
    } else {
        mcmeta = {
            pack: {
                pack_format: parseInt(document.getElementById('mcVersionSingle').value, 10),
                description: desc
            }
        };
    }
    zip.file('pack.mcmeta', JSON.stringify(mcmeta, null, 2));

    if (state.packIconDataUrl) {
        zip.file('pack.png', state.packIconDataUrl.split(',')[1], { base64: true });
    }

    state.builderAssets.items.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
        if (a.extraFiles) {
            a.extraFiles.forEach(ef => zip.file(ef.path, ef.content));
        }
    });

    state.builderAssets.blocks.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
    });

    state.builderAssets.guisContainer.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
    });

    state.builderAssets.guisRoot.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
    });

    state.builderAssets.skybox.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
        if (a.extraFiles) {
            a.extraFiles.forEach(ef => {
                if (ef.isImageDuplicate && ef.dataUrl) {
                    zip.file(ef.path, ef.dataUrl.split(',')[1], { base64: true });
                } else if (ef.content) {
                    zip.file(ef.path, ef.content);
                }
            });
        }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${packName}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ================= GIẢI NÉN FILE NÉN (.ZIP / .RAR) =================
// ================= HÀM GIẢI NÉN FILE ARCHIVE (.ZIP & .RAR) =================
async function extractAndLoadPackArchive(file) {
    const loadingOverlay = document.getElementById('ai-loading-overlay');
    const titleEl = document.getElementById('ai-loading-title');
    const descEl = document.getElementById('ai-loading-desc');

    const isRar = file.name.toLowerCase().endsWith('.rar');

    if (titleEl) titleEl.innerText = "Đang giải nén Resource Pack...";
    if (descEl) descEl.innerText = `Đang đọc nội dung file ${isRar ? 'RAR' : 'ZIP'}...`;
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    try {
        const fileEntries = new Map();

        // 1. XỬ LÝ FILE .ZIP
        if (!isRar) {
            const zip = await JSZip.loadAsync(file);
            const entries = Object.keys(zip.files);
            for (const path of entries) {
                if (!zip.files[path].dir) {
                    const u8 = await zip.files[path].async("uint8array");
                    fileEntries.set(path.replace(/\\/g, '/'), u8);
                }
            }
        } 
        // 2. XỬ LÝ FILE .RAR
        else {
            // Kiểm tra nếu chạy trực tiếp qua file:///
            if (window.location.protocol === 'file:') {
                throw new Error("Trình duyệt chặn giải nén file .RAR khi mở qua file:/// (CORS Policy).\n\n👉 Cách xử lý nhanh: Vui lòng nén pack thành file .ZIP hoặc mở website qua Live Server (VS Code).");
            }

            let unrarModule = window.unrar;
            if (!unrarModule) {
                try {
                    unrarModule = await import('https://unpkg.com/node-unrar-js@2.0.2/dist/js/index.js');
                } catch (e) {
                    unrarModule = await import('https://cdn.jsdelivr.net/npm/node-unrar-js@2.0.2/+esm');
                }
            }

            // Tải WebAssembly
            let wasmRes = await fetch('https://unpkg.com/node-unrar-js@2.0.2/dist/wasm/unrar.wasm');
            if (!wasmRes.ok) {
                wasmRes = await fetch('https://cdn.jsdelivr.net/npm/node-unrar-js@2.0.2/dist/wasm/unrar.wasm');
            }
            if (!wasmRes.ok) throw new Error("Không thể kết nối đến máy chủ giải nén WASM!");

            const wasmBinary = await wasmRes.arrayBuffer();
            const arrayBuffer = await file.arrayBuffer();
            
            const createExtractor = unrarModule.createExtractorFromData || window.createExtractorFromData;
            if (!createExtractor) throw new Error("Trình giải nén RAR chưa sẵn sàng!");

            const extractor = await createExtractor({ data: arrayBuffer, wasmBinary });
            const extracted = extractor.extract();
            const files = [...extracted.files];

            for (const entry of files) {
                if (!entry.fileHeader.flags.directory && entry.extraction) {
                    fileEntries.set(entry.fileHeader.name.replace(/\\/g, '/'), entry.extraction);
                }
            }
        }

        // Đặt lại state danh sách tài nguyên
        state.builderAssets = { items: [], blocks: [], guisContainer: [], guisRoot: [], skybox: [] };
        state.packIconDataUrl = null;
        document.getElementById('pack-name').value = file.name.replace(/\.(zip|rar)$/i, '');

        const textDecoder = new TextDecoder('utf-8');

        // Hàm chuyển byte array sang Base64
        function toBase64Png(u8Array) {
            let binary = '';
            const len = u8Array.byteLength;
            const chunk = 8192;
            for (let i = 0; i < len; i += chunk) {
                binary += String.fromCharCode.apply(null, u8Array.subarray(i, i + chunk));
            }
            return `data:image/png;base64,${btoa(binary)}`;
        }

        // A. Đọc pack.mcmeta
        if (fileEntries.has('pack.mcmeta')) {
            try {
                const metaText = textDecoder.decode(fileEntries.get('pack.mcmeta'));
                const metaJson = JSON.parse(metaText);
                if (metaJson.pack) {
                    if (metaJson.pack.description) {
                        document.getElementById('pack-desc').value = typeof metaJson.pack.description === 'string'
                            ? metaJson.pack.description
                            : JSON.stringify(metaJson.pack.description);
                    }
                    if (metaJson.pack.pack_format !== undefined) {
                        const rSingle = document.querySelector('input[name="verMode"][value="single"]');
                        if (rSingle) { rSingle.checked = true; rSingle.dispatchEvent(new Event('change')); }
                        const sSingle = document.getElementById('mcVersionSingle');
                        if (sSingle) sSingle.value = metaJson.pack.pack_format;
                    } else if (metaJson.pack.min_format !== undefined) {
                        const rRange = document.querySelector('input[name="verMode"][value="range"]');
                        if (rRange) { rRange.checked = true; rRange.dispatchEvent(new Event('change')); }
                        const sMin = document.getElementById('mcMinVersion');
                        const sMax = document.getElementById('mcMaxVersion');
                        if (sMin) {
                            sMin.value = metaJson.pack.min_format;
                            sMin.dispatchEvent(new Event('change'));
                        }
                        if (sMax && metaJson.pack.max_format) sMax.value = metaJson.pack.max_format;
                    }
                }
            } catch (e) {}
        }

        // B. Đọc pack.png
        if (fileEntries.has('pack.png')) {
            state.packIconDataUrl = toBase64Png(fileEntries.get('pack.png'));
            const previewImg = document.getElementById("packIconPreview");
            if (previewImg) previewImg.src = state.packIconDataUrl;
            const removeBtn = document.getElementById("removeIconBtn");
            if (removeBtn) removeBtn.style.display = "inline-block";
        }

        // C. Phân loại textures
        for (const [path, u8Data] of fileEntries.entries()) {
            if (/^assets\/minecraft\/textures\/item\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                const dataUrl = toBase64Png(u8Data);
                const extraFiles = [];
                if (fileEntries.has(`${path}.mcmeta`)) {
                    extraFiles.push({ path: `${path}.mcmeta`, content: textDecoder.decode(fileEntries.get(`${path}.mcmeta`)) });
                }
                state.builderAssets.items.push({ id, path, dataUrl, extraFiles });
            }
            else if (/^assets\/minecraft\/textures\/block\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                state.builderAssets.blocks.push({ id, path, dataUrl: toBase64Png(u8Data) });
            }
            else if (/^assets\/minecraft\/textures\/gui\/container\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                state.builderAssets.guisContainer.push({ id, path, dataUrl: toBase64Png(u8Data) });
            }
            else if (/^assets\/minecraft\/textures\/gui\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                state.builderAssets.guisRoot.push({ id, path, dataUrl: toBase64Png(u8Data) });
            }
            else if (/^assets\/minecraft\/(optifine|mcpatcher)\/sky\/world0\/[^\/]+\.png$/i.test(path)) {
                const id = path.split('/').pop().replace(/\.png$/i, '').toLowerCase();
                const dataUrl = toBase64Png(u8Data);
                const extraFiles = [];
                const propPath = path.replace(/\.png$/i, '.properties');
                if (fileEntries.has(propPath)) {
                    extraFiles.push({ path: propPath, content: textDecoder.decode(fileEntries.get(propPath)) });
                }
                state.builderAssets.skybox.push({ id, path, dataUrl, extraFiles });
            }
        }

        renderAllBuilderGrids();
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        alert(`🎉 Đã tải Resource Pack thành công!\n` +
              `• Items: ${state.builderAssets.items.length}\n` +
              `• Blocks: ${state.builderAssets.blocks.length}\n` +
              `• GUIs: ${state.builderAssets.guisContainer.length + state.builderAssets.guisRoot.length}\n` +
              `• Skybox: ${state.builderAssets.skybox.length}`);
    } catch (err) {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        alert("❌ Thông báo: " + err.message);
    }
}

// ================= CÁC HÀM HỖ TRỢ & HIỂN THỊ DANH SÁCH =================
function setupAutoIdFromFile(fileInputId, idInputId) {
    const f = document.getElementById(fileInputId);
    const idInput = document.getElementById(idInputId);
    if (f && idInput) {
        f.onchange = (e) => {
            const file = e.target.files[0];
            if (file && (!idInput.value.trim() || idInput.value === 'recipe_book')) {
                idInput.value = file.name.replace(/\.png$/i, '').toLowerCase().replace(/\s+/g, '_');
            }
        };
    }
}

function setupBatchDropzone(dropzoneId, inputId, onFilesReady) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);
    if (!dropzone || !input) return;

    dropzone.onclick = () => input.click();
    input.onchange = (e) => {
        if (e.target.files && e.target.files.length) {
            onFilesReady(e.target.files);
            input.value = '';
        }
    };
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length) onFilesReady(e.dataTransfer.files);
    });
}

function processBatchPngFiles(files, itemHandler, onComplete) {
    const validFiles = Array.from(files).filter(f => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png'));
    if (!validFiles.length) return alert("Chỉ chấp nhận file ảnh định dạng .png!");

    let loadedCount = 0;
    validFiles.forEach(file => {
        const rawName = file.name.replace(/\.png$/i, '').trim().toLowerCase().replace(/\s+/g, '_');
        const reader = new FileReader();
        reader.onload = (e) => {
            itemHandler(rawName, e.target.result);
            loadedCount++;
            if (loadedCount === validFiles.length) onComplete();
        };
        reader.readAsDataURL(file);
    });
}

function renderAllBuilderGrids() {
    renderItemGrid();
    renderBlockGrid();
    renderGuiContainerGrid();
    renderGuiRootGrid();
    renderSkyboxGrid();
    updateBuilderStats();
}

function renderItemGrid() {
    const grid = document.getElementById('builder-item-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.items.forEach((item, idx) => {
        grid.appendChild(createAssetCard(
            item,
            (newId) => {
                item.id = newId;
                item.path = `assets/minecraft/textures/item/${newId}.png`;
                if (item.extraFiles && item.extraFiles.length) {
                    item.extraFiles[0].path = `assets/minecraft/textures/item/${newId}.png.mcmeta`;
                }
                renderItemGrid();
            },
            () => {
                state.builderAssets.items.splice(idx, 1);
                renderItemGrid(); updateBuilderStats();
            }
        ));
    });
}

function renderBlockGrid() {
    const grid = document.getElementById('builder-block-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.blocks.forEach((block, idx) => {
        grid.appendChild(createAssetCard(
            block,
            (newId) => {
                block.id = newId;
                block.path = `assets/minecraft/textures/block/${newId}.png`;
                renderBlockGrid();
            },
            () => {
                state.builderAssets.blocks.splice(idx, 1);
                renderBlockGrid(); updateBuilderStats();
            }
        ));
    });
}

function renderGuiContainerGrid() {
    const grid = document.getElementById('builder-gui-container-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.guisContainer.forEach((gui, idx) => {
        grid.appendChild(createAssetCard(
            gui,
            (newId) => {
                gui.id = newId;
                gui.path = `assets/minecraft/textures/gui/container/${newId}.png`;
                renderGuiContainerGrid();
            },
            () => {
                state.builderAssets.guisContainer.splice(idx, 1);
                renderGuiContainerGrid(); updateBuilderStats();
            }
        ));
    });
}

function renderGuiRootGrid() {
    const grid = document.getElementById('builder-gui-root-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.guisRoot.forEach((gui, idx) => {
        grid.appendChild(createAssetCard(
            gui,
            (newId) => {
                gui.id = newId;
                gui.path = `assets/minecraft/textures/gui/${newId}.png`;
                renderGuiRootGrid();
            },
            () => {
                state.builderAssets.guisRoot.splice(idx, 1);
                renderGuiRootGrid(); updateBuilderStats();
            }
        ));
    });
}

function renderSkyboxGrid() {
    const grid = document.getElementById('builder-skybox-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.builderAssets.skybox.forEach((sky, idx) => {
        grid.appendChild(createAssetCard(
            sky,
            (newId) => {
                sky.id = newId;
                renderSkyboxGrid();
            },
            () => {
                state.builderAssets.skybox.splice(idx, 1);
                renderSkyboxGrid(); updateBuilderStats();
            }
        ));
    });
}

function createAssetCard(asset, onRename, onRemove) {
    const card = document.createElement('div');
    card.className = 'asset-card';
    
    let extraLabel = '';
    if (asset.extraFiles && asset.extraFiles.length) {
        extraLabel = `<div style="font-size:10px; color:#81c784; margin-bottom:4px;">+${asset.extraFiles.length} file đính kèm (.mcmeta/.properties)</div>`;
    }

    card.innerHTML = `
        <img src="${asset.dataUrl}" alt="${asset.id}">
        <input type="text" class="card-rename-input" value="${asset.id}" title="Nhấp để sửa tên ID">
        <div class="path-info">${asset.path}</div>
        ${extraLabel}
        <div class="asset-card-actions">
            <button class="btn-danger remove-btn">Xóa</button>
        </div>
    `;

    const renameInput = card.querySelector('.card-rename-input');
    renameInput.onchange = (e) => {
        const val = e.target.value.trim().toLowerCase().replace(/\s+/g, '_');
        if (val) onRename(val);
        else renameInput.value = asset.id;
    };

    card.querySelector('.remove-btn').onclick = onRemove;
    return card;
}

function updateBuilderStats() {
    const totalGuis = state.builderAssets.guisContainer.length + state.builderAssets.guisRoot.length;
    const sItems = document.getElementById('stat-items');
    const sBlocks = document.getElementById('stat-blocks');
    const sGuis = document.getElementById('stat-guis');
    const sSky = document.getElementById('stat-sky');

    if (sItems) sItems.innerText = `✓ ${state.builderAssets.items.length} Items`;
    if (sBlocks) sBlocks.innerText = `✓ ${state.builderAssets.blocks.length} Blocks`;
    if (sGuis) sGuis.innerText = `✓ ${totalGuis} GUIs`;
    if (sSky) sSky.innerText = `✓ ${state.builderAssets.skybox.length} Skybox`;
}

// ================= ĐÓNG GÓI VÀ XUẤT RESOURCE PACK ZIP =================
async function buildAndDownloadZip() {
    if (typeof JSZip === 'undefined') {
        alert("Thiếu thư viện JSZip để đóng gói file ZIP!");
        return;
    }

    const zip = new JSZip();
    const packName = (document.getElementById('pack-name').value.trim() || 'ResourcePack').replace(/\s+/g, '_');
    const mode = document.querySelector('input[name="verMode"]:checked').value;
    const desc = document.getElementById('pack-desc').value.trim() || 'Created with Pack Studio';

    let mcmeta = {};
    if (mode === 'range') {
        mcmeta = {
            pack: {
                description: desc,
                min_format: parseInt(document.getElementById('mcMinVersion').value, 10),
                max_format: parseInt(document.getElementById('mcMaxVersion').value, 10)
            }
        };
    } else {
        mcmeta = {
            pack: {
                pack_format: parseInt(document.getElementById('mcVersionSingle').value, 10),
                description: desc
            }
        };
    }
    zip.file('pack.mcmeta', JSON.stringify(mcmeta, null, 2));

    if (state.packIconDataUrl) {
        zip.file('pack.png', state.packIconDataUrl.split(',')[1], { base64: true });
    }

    // Ghi Items
    state.builderAssets.items.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
        if (a.extraFiles) {
            a.extraFiles.forEach(ef => zip.file(ef.path, ef.content));
        }
    });

    // Ghi Blocks
    state.builderAssets.blocks.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
    });

    // Ghi GUI Containers
    state.builderAssets.guisContainer.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
    });

    // Ghi GUI Root
    state.builderAssets.guisRoot.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
    });

    // Ghi Skybox
    state.builderAssets.skybox.forEach(a => {
        zip.file(a.path, a.dataUrl.split(',')[1], { base64: true });
        if (a.extraFiles) {
            a.extraFiles.forEach(ef => {
                if (ef.isImageDuplicate && ef.dataUrl) {
                    zip.file(ef.path, ef.dataUrl.split(',')[1], { base64: true });
                } else if (ef.content) {
                    zip.file(ef.path, ef.content);
                }
            });
        }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${packName}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
}