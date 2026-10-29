// Bảng ánh xạ Minecraft Versions & pack_format chuẩn xác
const MINECRAFT_VERSIONS = [
  { version: "1.6.1 – 1.8.9", format: 1 },
  { version: "1.9 – 1.10.2", format: 2 },
  { version: "1.11 – 1.12.2", format: 3 },
  { version: "1.13 – 1.14.4", format: 4 },
  { version: "1.15 – 1.16.1", format: 5 },
  { version: "1.16.2 – 1.16.5", format: 6 },
  { version: "1.17 – 1.17.1", format: 7 },
  { version: "1.18 – 1.18.2", format: 8 },
  { version: "1.19 – 1.19.2", format: 9 },
  { version: "1.19.3", format: 12 },
  { version: "1.19.4", format: 13 },
  { version: "1.20 – 1.20.1", format: 15 },
  { version: "1.20.2", format: 18 },
  { version: "1.20.3 – 1.20.4", format: 22 },
  { version: "1.20.5 – 1.20.6", format: 32 },
  { version: "1.21 – 1.21.1", format: 34 },
  { version: "1.21.2 – 1.21.3", format: 42 },
  { version: "1.21.4", format: 46 },
  { version: "1.21.5", format: 55 },
  { version: "1.21.6", format: 63 },
  { version: "1.21.7 – 1.21.8", format: 64 },
  { version: "1.21.9 – 1.21.10", format: 69, isRangeSupported: true },
  { version: "1.21.11", format: 75, isRangeSupported: true },
  { version: "26.1 – 26.1.2", format: 84, isRangeSupported: true },
  { version: "26.2", format: 88, isRangeSupported: true }
];

// Danh sách dành riêng cho Chế độ Chọn Đôi (Chỉ 1.21.9 trở lên)
const RANGE_VERSIONS = MINECRAFT_VERSIONS.filter(v => v.isRangeSupported);