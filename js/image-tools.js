/* ================= IMAGE TOOLS: NÂNG CẤP XÓA NỀN THÔNG MINH (FLOOD-FILL EDGE-AWARE) ================= */
function aiRemoveBackgroundCurrentLayer() {
    if (state.selectedLayerIndex === null) {
        alert("Vui lòng chọn 1 Layer ảnh để xóa nền!");
        return;
    }

    const layer = state.layers[state.selectedLayerIndex];
    const loadingOverlay = document.getElementById('ai-loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    setTimeout(() => {
        try {
            const w = layer.img.naturalWidth || layer.img.width;
            const h = layer.img.naturalHeight || layer.img.height;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(layer.img, 0, 0);

            const imgData = tCtx.getImageData(0, 0, w, h);
            const data = imgData.data;

            // 1. Lấy mẫu màu nền đại diện tại 4 góc viền
            const cornerIndices = [0, (w - 1) * 4, ((h - 1) * w) * 4, ((h - 1) * w + (w - 1)) * 4];
            const bgSamples = [];
            cornerIndices.forEach(idx => {
                if (data[idx + 3] > 20) {
                    bgSamples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
                }
            });
            if (bgSamples.length === 0) bgSamples.push({ r: 255, g: 255, b: 255 });

            // 2. Thuật toán Flood Fill BFS từ tất cả các viền ngoài vào trong (Bảo vệ phần ruột ảnh)
            const visited = new Uint8Array(w * h);
            const queue = [];

            function isBgColor(r, g, b) {
                const tol = 38; // Ngưỡng dung sai màu
                return bgSamples.some(sample => {
                    const dist = Math.sqrt(
                        (r - sample.r) ** 2 * 0.299 +
                        (g - sample.g) ** 2 * 0.587 +
                        (b - sample.b) ** 2 * 0.114
                    );
                    return dist <= tol;
                });
            }

            // Đưa toàn bộ viền biên vào hàng đợi quét BFS
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
                const pxIdx = pos * 4;
                const r = data[pxIdx], g = data[pxIdx + 1], b = data[pxIdx + 2], a = data[pxIdx + 3];

                if (a === 0 || isBgColor(r, g, b)) {
                    data[pxIdx + 3] = 0; // Xóa nền trong suốt hoàn toàn

                    const cx = pos % w;
                    const cy = Math.floor(pos / w);
                    const neighbors = [
                        cx > 0 ? pos - 1 : -1,
                        cx < w - 1 ? pos + 1 : -1,
                        cy > 0 ? pos - w : -1,
                        cy < h - 1 ? pos + w : -1
                    ];

                    for (let i = 0; i < 4; i++) {
                        const nPos = neighbors[i];
                        if (nPos !== -1 && !visited[nPos]) {
                            visited[nPos] = 1;
                            queue.push(nPos);
                        }
                    }
                }
            }

            // 3. Khử răng cưa viền (Feathering viền chống viền sắc nhọn)
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const idx = (y * w + x) * 4;
                    if (data[idx + 3] > 0) {
                        const topA = data[((y - 1) * w + x) * 4 + 3];
                        const botA = data[((y + 1) * w + x) * 4 + 3];
                        const leftA = data[(y * w + (x - 1)) * 4 + 3];
                        const rightA = data[(y * w + (x + 1)) * 4 + 3];

                        if (topA === 0 || botA === 0 || leftA === 0 || rightA === 0) {
                            data[idx + 3] = Math.round(data[idx + 3] * 0.75); // Làm mềm cạnh
                        }
                    }
                }
            }

            tCtx.putImageData(imgData, 0, 0);

            const newImg = new Image();
            newImg.onload = () => {
                layer.img = newImg;
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                saveHistory();
                requestRender();
            };
            newImg.src = tempCanvas.toDataURL('image/png');
        } catch (err) {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            alert("Lỗi xử lý ảnh: " + err.message);
        }
    }, 120);
}