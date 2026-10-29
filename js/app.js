document.addEventListener("DOMContentLoaded", () => {
  let packIconDataUrl = null; // Lưu trữ dữ liệu ảnh Icon pack.png

  initVersionSelects();
  initDatalists();
  setupTabSwitching();
  bindEvents();

  // Khởi tạo các ô chọn Version
  function initVersionSelects() {
    const selectSingle = document.getElementById("mcVersion");
    const selectMin = document.getElementById("mcMinVersion");
    const selectMax = document.getElementById("mcMaxVersion");

    // 1. Populate Single Version
    selectSingle.innerHTML = "";
    MINECRAFT_VERSIONS.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.format;
      opt.textContent = `Minecraft ${v.version} (pack_format: ${v.format})`;
      selectSingle.appendChild(opt);
    });

    // 2. Populate Range Versions (1.21.9+)
    selectMin.innerHTML = "";
    RANGE_VERSIONS.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.format;
      opt.textContent = `Minecraft ${v.version} (${v.format})`;
      selectMin.appendChild(opt);
    });

    updateMaxVersionOptions();
  }

  // Cập nhật tùy chọn Version Max dựa theo Version Min đang chọn
  function updateMaxVersionOptions() {
    const selectMin = document.getElementById("mcMinVersion");
    const selectMax = document.getElementById("mcMaxVersion");
    const selectedMinFormat = parseInt(selectMin.value, 10);

    selectMax.innerHTML = "";
    RANGE_VERSIONS.forEach(v => {
      // Chỉ hiển thị các phiên bản lớn hơn hoặc bằng Min
      if (v.format >= selectedMinFormat) {
        const opt = document.createElement("option");
        opt.value = v.format;
        opt.textContent = `Minecraft ${v.version} (${v.format})`;
        selectMax.appendChild(opt);
      }
    });
  }

  function initDatalists() {
    const itemDatalist = document.getElementById("item-suggestions");
    if (itemDatalist && PRESET_IDS.items) {
      itemDatalist.innerHTML = "";
      PRESET_IDS.items.forEach(id => { itemDatalist.innerHTML += `<option value="${id}">`; });
    }

    const blockDatalist = document.getElementById("block-suggestions");
    if (blockDatalist && PRESET_IDS.blocks) {
      blockDatalist.innerHTML = "";
      PRESET_IDS.blocks.forEach(id => { blockDatalist.innerHTML += `<option value="${id}">`; });
    }

    const guiDatalist = document.getElementById("gui-suggestions");
    if (guiDatalist && PRESET_IDS.gui) {
      guiDatalist.innerHTML = "";
      PRESET_IDS.gui.forEach(id => { guiDatalist.innerHTML += `<option value="${id}">`; });
    }
  }

  function setupTabSwitching() {
    const navBtns = document.querySelectorAll(".nav-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    navBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        navBtns.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(`tab-${targetTab}`).classList.add("active");
      });
    });
  }

  function bindEvents() {
    const welcomeModal = document.getElementById("welcome-modal");
    const startAppBtn = document.getElementById("start-app-btn");
      
    if (startAppBtn && welcomeModal) {
      startAppBtn.addEventListener("click", () => {
        welcomeModal.style.display = "none";
      });
    }
    // Pack Icon Upload Event Handlers
    const iconInput = document.getElementById("packIconInput");
    const uploadIconBtn = document.getElementById("uploadIconBtn");
    const iconPreviewWrapper = document.querySelector(".icon-preview-wrapper");
    const removeIconBtn = document.getElementById("removeIconBtn");

    uploadIconBtn.addEventListener("click", () => iconInput.click());
    iconPreviewWrapper.addEventListener("click", () => iconInput.click());

    iconInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && Validator.isPngFile(file)) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          packIconDataUrl = evt.target.result;
          document.getElementById("packIconPreview").src = packIconDataUrl;
          removeIconBtn.style.display = "inline-block";
        };
        reader.readAsDataURL(file);
      } else {
        alert("Vui lòng chọn file ảnh .png hợp lệ!");
      }
    });

    removeIconBtn.addEventListener("click", () => {
      packIconDataUrl = null;
      document.getElementById("packIconPreview").src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg>";
      removeIconBtn.style.display = "none";
      iconInput.value = "";
    });

    // Chuyển chế độ Version (Single / Range)
    const radioModes = document.querySelectorAll('input[name="verMode"]');
    radioModes.forEach(radio => {
      radio.addEventListener("change", (e) => {
        const isSingle = e.target.value === "single";
        document.getElementById("single-version-box").style.display = isSingle ? "block" : "none";
        document.getElementById("range-version-box").style.display = isSingle ? "none" : "block";
      });
    });

    // Lắng nghe thay đổi Min Version để lọc Max Version
    document.getElementById("mcMinVersion").addEventListener("change", updateMaxVersionOptions);

    // Toggle Animation Option
    const animCheckbox = document.getElementById("item-has-anim");
    const animOptions = document.getElementById("item-anim-options");
    animCheckbox.addEventListener("change", (e) => {
      animOptions.style.display = e.target.checked ? "flex" : "none";
    });

    // Tự động điền ID khi chọn file
    setupAutoIdFromFile("item-file", "item-id");
    setupAutoIdFromFile("block-file", "block-id");
    setupAutoIdFromFile("gui-container-file", "gui-container-id");

    // Add Buttons
    document.getElementById("add-item-btn").addEventListener("click", handleAddItem);
    document.getElementById("add-block-btn").addEventListener("click", handleAddBlock);
    document.getElementById("add-gui-recipe-btn").addEventListener("click", handleAddGuiRecipe);
    document.getElementById("add-gui-container-btn").addEventListener("click", handleAddGuiContainer);
    document.getElementById("add-sky-btn").addEventListener("click", handleAddSkybox);

    // Project Actions
    document.getElementById("build-btn").addEventListener("click", handleBuild);
    document.getElementById("clear-project-btn").addEventListener("click", handleClearProject);
    document.getElementById("save-project-btn").addEventListener("click", handleSaveProject);
    
    const loadFileBtn = document.getElementById("load-project-btn");
    const loadFileInput = document.getElementById("load-project-file");
    loadFileBtn.addEventListener("click", () => loadFileInput.click());
    loadFileInput.addEventListener("change", handleLoadProject);
  }

  function setupAutoIdFromFile(fileInputId, idInputId) {
    const fileInput = document.getElementById(fileInputId);
    const idInput = document.getElementById(idInputId);

    if (fileInput && idInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && !idInput.value.trim()) {
          idInput.value = Validator.cleanId(file.name);
        }
      });
    }
  }

  // --- 1. XỬ LÝ ITEM ---
  function handleAddItem() {
    const idInput = document.getElementById("item-id");
    const fileInput = document.getElementById("item-file");
    const hasAnim = document.getElementById("item-has-anim").checked;
    const frametime = parseInt(document.getElementById("item-frametime").value, 10) || 1;

    const file = fileInput.files[0];
    if (!file || !Validator.isPngFile(file)) return alert("Vui lòng chọn file .png hợp lệ!");

    let rawId = idInput.value.trim() || Validator.cleanId(file.name);
    const cleanId = Validator.cleanId(rawId);

    const extraFiles = [];
    if (hasAnim) {
      const mcmetaContent = JSON.stringify({ animation: { frametime: frametime } }, null, 2);
      extraFiles.push({
        path: `assets/minecraft/textures/item/${cleanId}.png.mcmeta`,
        content: mcmetaContent
      });
    }

    readFileAndAdd(ItemModule, cleanId, file, extraFiles, "item-list", () => {
      idInput.value = "";
      fileInput.value = "";
      document.getElementById("item-has-anim").checked = false;
      document.getElementById("item-anim-options").style.display = "none";
    });
  }

  // --- 2. XỬ LÝ BLOCK ---
  function handleAddBlock() {
    const idInput = document.getElementById("block-id");
    const fileInput = document.getElementById("block-file");
    const file = fileInput.files[0];

    if (!file || !Validator.isPngFile(file)) return alert("Vui lòng chọn file .png hợp lệ!");

    let rawId = idInput.value.trim() || Validator.cleanId(file.name);

    readFileAndAdd(BlockModule, rawId, file, [], "block-list", () => {
      idInput.value = "";
      fileInput.value = "";
    });
  }

  // --- 3. XỬ LÝ GUI ---
  function handleAddGuiRecipe() {
    const fileInput = document.getElementById("gui-recipe-file");
    const file = fileInput.files[0];
    if (!file || !Validator.isPngFile(file)) return alert("Vui lòng chọn file .png hợp lệ!");

    const customPath = "assets/minecraft/textures/gui/recipe_book.png";
    readFileAndAdd(GuiModule, "recipe_book", file, [], "gui-list", () => {
      fileInput.value = "";
    }, customPath);
  }

  function handleAddGuiContainer() {
    const idInput = document.getElementById("gui-container-id");
    const fileInput = document.getElementById("gui-container-file");
    const file = fileInput.files[0];

    if (!file || !Validator.isPngFile(file)) return alert("Vui lòng chọn file .png hợp lệ!");

    let rawId = idInput.value.trim() || Validator.cleanId(file.name);
    const cleanId = Validator.cleanId(rawId);
    const customPath = `assets/minecraft/textures/gui/container/${cleanId}.png`;

    readFileAndAdd(GuiModule, `container_${cleanId}`, file, [], "gui-list", () => {
      idInput.value = "";
      fileInput.value = "";
    }, customPath);
  }

  // --- 4. XỬ LÝ SKYBOX ---
  function handleAddSkybox() {
    const modChoice = document.querySelector('input[name="sky-mod"]:checked').value;
    const type = document.getElementById("sky-type").value;
    const fileInput = document.getElementById("sky-file");
    const file = fileInput.files[0];

    if (!file || !Validator.isPngFile(file)) return alert("Vui lòng chọn file .png hợp lệ!");

    const existingCount = SkyboxModule.getAll().filter(a => a.id.startsWith(type)).length + 1;
    const skyName = `${type}${existingCount}`;

    const propertiesContent = 
`startFadeIn=${document.getElementById("sky-startFadeIn").value}
endFadeIn=${document.getElementById("sky-endFadeIn").value}
startFadeOut=${document.getElementById("sky-startFadeOut").value}
endFadeOut=${document.getElementById("sky-endFadeOut").value}
blend=replace
rotate=${document.getElementById("sky-rotate").value}
axis=${document.getElementById("sky-axis").value}
source=./${skyName}.png`;

    const paths = [];
    if (modChoice === "optifine" || modChoice === "both") {
      paths.push(`assets/minecraft/optifine/sky/world0/`);
    }
    if (modChoice === "mcpatcher" || modChoice === "both") {
      paths.push(`assets/minecraft/mcpatcher/sky/world0/`);
    }

    const extraFiles = [];
    paths.forEach(p => {
      extraFiles.push({
        path: `${p}${skyName}.properties`,
        content: propertiesContent
      });
    });

    const primaryPath = `${paths[0]}${skyName}.png`;
    if (paths.length > 1) {
      extraFiles.push({
        path: `${paths[1]}${skyName}.png`,
        isImageDuplicate: true
      });
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target.result;
        extraFiles.forEach(ef => {
          if (ef.isImageDuplicate) ef.dataUrl = fileData;
        });

        SkyboxModule.addAsset(skyName, fileData, extraFiles, primaryPath);
        fileInput.value = "";
        renderAssetList(SkyboxModule, "skybox-list");
        updateStats();
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  function readFileAndAdd(module, id, file, extraFiles, containerId, callback, customPath = null) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        module.addAsset(id, e.target.result, extraFiles, customPath);
        renderAssetList(module, containerId);
        updateStats();
        if (callback) callback();
      } catch (err) {
        alert(err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  function renderAssetList(module, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    module.getAll().forEach(asset => {
      const card = document.createElement("div");
      card.className = "asset-card";
      
      let extraInfoHtml = "";
      if (asset.extraFiles && asset.extraFiles.length > 0) {
        extraInfoHtml = `<br><small style="color:#81c784;">+${asset.extraFiles.length} file đính kèm</small>`;
      }

      card.innerHTML = `
        <img src="${asset.dataUrl}" alt="${asset.id}">
        <div class="info">
          <b>ID:</b> ${asset.id}<br>
          <b>Path:</b><br>${asset.path}
          ${extraInfoHtml}
        </div>
        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem;">Remove</button>
      `;

      card.querySelector("button").addEventListener("click", () => {
        module.removeAsset(asset.id);
        renderAssetList(module, containerId);
        updateStats();
      });

      container.appendChild(card);
    });
  }

  function updateStats() {
    document.getElementById("stat-item").textContent = `✓ ${ItemModule.getCount()} Items`;
    document.getElementById("stat-block").textContent = `✓ ${BlockModule.getCount()} Blocks`;
    document.getElementById("stat-gui").textContent = `✓ ${GuiModule.getCount()} GUI`;
    document.getElementById("stat-skybox").textContent = `✓ ${SkyboxModule.getCount()} Skybox`;
  }

  async function handleBuild() {
    const packName = document.getElementById("packName").value;
    const mode = document.querySelector('input[name="verMode"]:checked').value;
    const description = document.getElementById("packDescription").value;

    const versionConfig = { mode: mode };
    if (mode === "range") {
      versionConfig.minFormat = parseInt(document.getElementById("mcMinVersion").value, 10);
      versionConfig.maxFormat = parseInt(document.getElementById("mcMaxVersion").value, 10);
    } else {
      versionConfig.format = parseInt(document.getElementById("mcVersion").value, 10);
    }

    const modules = [ItemModule, BlockModule, GuiModule, SkyboxModule];
    const totalAssets = modules.reduce((acc, m) => acc + m.getCount(), 0);

    if (totalAssets === 0 && !confirm("Pack chưa có tài nguyên nào. Bạn vẫn muốn Build chứ?")) {
      return;
    }

    try {
      await ZipBuilder.buildAndDownload(packName, versionConfig, description, modules, packIconDataUrl);
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo ZIP: " + err.message);
    }
  }

  function handleClearProject() {
    if (confirm("Are you sure you want to clear this project? Tất cả dữ liệu chưa lưu sẽ bị xóa.")) {
      [ItemModule, BlockModule, GuiModule, SkyboxModule].forEach(m => m.clear());
      
      // Reset pack icon
      packIconDataUrl = null;
      document.getElementById("packIconPreview").src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg>";
      document.getElementById("removeIconBtn").style.display = "none";
      
      renderAssetList(ItemModule, "item-list");
      renderAssetList(BlockModule, "block-list");
      renderAssetList(GuiModule, "gui-list");
      renderAssetList(SkyboxModule, "skybox-list");
      updateStats();
    }
  }

  function handleSaveProject() {
    const mode = document.querySelector('input[name="verMode"]:checked').value;
    const projectData = {
      packName: document.getElementById("packName").value,
      verMode: mode,
      mcVersionFormat: document.getElementById("mcVersion").value,
      mcMinVersionFormat: document.getElementById("mcMinVersion").value,
      mcMaxVersionFormat: document.getElementById("mcMaxVersion").value,
      description: document.getElementById("packDescription").value,
      packIconDataUrl: packIconDataUrl,
      items: ItemModule.getAll(),
      blocks: BlockModule.getAll(),
      gui: GuiModule.getAll(),
      skybox: SkyboxModule.getAll()
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (projectData.packName.trim() || "project") + "-save.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function handleLoadProject(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.packName) document.getElementById("packName").value = data.packName;
        if (data.description) document.getElementById("packDescription").value = data.description;
        
        // Restore Ver Mode
        if (data.verMode) {
          const radio = document.querySelector(`input[name="verMode"][value="${data.verMode}"]`);
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        }

        if (data.mcVersionFormat) document.getElementById("mcVersion").value = data.mcVersionFormat;
        if (data.mcMinVersionFormat) document.getElementById("mcMinVersion").value = data.mcMinVersionFormat;
        updateMaxVersionOptions();
        if (data.mcMaxVersionFormat) document.getElementById("mcMaxVersion").value = data.mcMaxVersionFormat;

        // Restore Pack Icon
        if (data.packIconDataUrl) {
          packIconDataUrl = data.packIconDataUrl;
          document.getElementById("packIconPreview").src = packIconDataUrl;
          document.getElementById("removeIconBtn").style.display = "inline-block";
        }

        restoreModuleData(ItemModule, data.items, "item-list");
        restoreModuleData(BlockModule, data.blocks, "block-list");
        restoreModuleData(GuiModule, data.gui, "gui-list");
        restoreModuleData(SkyboxModule, data.skybox, "skybox-list");

        updateStats();
        alert("Load project thành công!");
      } catch (err) {
        alert("Lỗi khi đọc file project JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function restoreModuleData(module, assetArray, containerId) {
    module.clear();
    if (Array.isArray(assetArray)) {
      assetArray.forEach(a => module.addAsset(a.id, a.dataUrl, a.extraFiles || [], a.path));
    }
    renderAssetList(module, containerId);
  }
});