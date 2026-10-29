class Validator {
  // Kiểm tra ID hợp lệ (không chứa ký tự lạ, không chứa path traversal)
  static isValidId(id) {
    if (!id || typeof id !== 'string') return false;
    // Chỉ cho phép chữ thường, số, dấu gạch dưới và gạch chéo xuôi (dùng cho sub-folder GUI)
    const regex = /^[a-z0-9_\/]+$/;
    return regex.test(id) && !id.includes("..");
  }

  // Tự động làm sạch ID (loại bỏ .png nếu người dùng nhập nhầm)
  static cleanId(id) {
    let clean = id.trim().toLowerCase();
    if (clean.endsWith('.png')) {
      clean = clean.slice(0, -4);
    }
    return clean;
  }

  // Kiểm tra file có phải là PNG
  static isPngFile(file) {
    return file && file.type === "image/png";
  }
}