class ZipBuilder {
  static async buildAndDownload(packName, versionConfig, description, modules, packIconDataUrl) {
    const zip = new JSZip();

    // 1. Tạo file pack.mcmeta dựa theo chế độ Version
    let mcmetaContent = {};

    if (versionConfig.mode === "range") {
      mcmetaContent = {
        pack: {
          description: description || "Resource Pack created with Pack Builder",
          min_format: versionConfig.minFormat,
          max_format: versionConfig.maxFormat
        }
      };
    } else {
      mcmetaContent = {
        pack: {
          pack_format: versionConfig.format,
          description: description || "Resource Pack created with Pack Builder"
        }
      };
    }

    zip.file("pack.mcmeta", JSON.stringify(mcmetaContent, null, 2));

    // 2. Thêm file Pack Icon (pack.png) nếu người dùng đã chọn
    if (packIconDataUrl) {
      const base64Icon = packIconDataUrl.split(',')[1];
      zip.file("pack.png", base64Icon, { base64: true });
    }

    // 3. Đưa tài nguyên & các file đính kèm vào ZIP
    modules.forEach(module => {
      module.getAll().forEach(asset => {
        const base64Data = asset.dataUrl.split(',')[1];
        zip.file(asset.path, base64Data, { base64: true });

        if (asset.extraFiles && asset.extraFiles.length > 0) {
          asset.extraFiles.forEach(extra => {
            zip.file(extra.path, extra.content);
          });
        }
      });
    });

    // 4. Tải xuống file ZIP
    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    const fileName = (packName.trim() || "ResourcePack") + ".zip";
    link.download = fileName;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }
}