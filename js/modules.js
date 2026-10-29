class AssetModule {
  constructor(name, basePath) {
    this.name = name;
    this.basePath = basePath;
    this.assets = new Map();
  }

  addAsset(id, fileData, extraFiles = [], customPath = null) {
    const cleanId = Validator.cleanId(id);
    if (!Validator.isValidId(cleanId)) {
      throw new Error(`ID "${id}" không hợp lệ!`);
    }
    if (this.assets.has(cleanId)) {
      throw new Error(`ID "${cleanId}" đã tồn tại trong danh mục ${this.name}!`);
    }
    
    const path = customPath ? customPath : `${this.basePath}/${cleanId}.png`;

    this.assets.set(cleanId, {
      id: cleanId,
      dataUrl: fileData,
      path: path,
      extraFiles: extraFiles // Chứa các file phụ đi kèm như .mcmeta hoặc .properties
    });
  }

  removeAsset(id) {
    this.assets.delete(id);
  }

  clear() {
    this.assets.clear();
  }

  getAll() {
    return Array.from(this.assets.values());
  }

  getCount() {
    return this.assets.size;
  }
}

// Khởi tạo các Module
const ItemModule = new AssetModule("Item", "assets/minecraft/textures/item");
const BlockModule = new AssetModule("Block", "assets/minecraft/textures/block");
const GuiModule = new AssetModule("GUI", "assets/minecraft/textures/gui");
const SkyboxModule = new AssetModule("Skybox", ""); // Path linh hoạt tùy chọn mod