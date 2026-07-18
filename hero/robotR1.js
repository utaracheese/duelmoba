// Khởi tạo đối tượng lưu trữ các bộ ảnh hoạt ảnh di chuyển
const ROBOT_ANIMS = {
    left: [],
    right: [],
    up: [],
    down: []
};

// Tiền tải (Preload) toàn bộ 4 hướng hoạt ảnh để tránh hiện tượng nhấp nháy khi chơi
for (let i = 0; i < 4; i++) {
    const imgLeft = new Image();
    imgLeft.src = `assets/animation/robotR1_control/robotR1_trai${i}.png`;
    ROBOT_ANIMS.left.push(imgLeft);

    const imgRight = new Image();
    imgRight.src = `assets/animation/robotR1_control/robotR1_phai${i}.png`;
    ROBOT_ANIMS.right.push(imgRight);

    const imgUp = new Image();
    imgUp.src = `assets/animation/robotR1_control/up${i}.png`;
    ROBOT_ANIMS.up.push(imgUp);

    const imgDown = new Image();
    imgDown.src = `assets/animation/robotR1_control/down${i}.png`;
    ROBOT_ANIMS.down.push(imgDown);
}

class RobotR1 extends Entity {
    constructor(x, y) {
        const config = HERO_PRESETS['robotR1'];
        // Kế thừa các thông số gốc từ Entity
        super(x, y, config.radius, config.color, false, config.stats);
        
        this.animTime = 0;          // Bộ đếm thời gian hoạt ảnh
        this.currentDir = 'down';   // Hướng hoạt ảnh hiện tại (mặc định ban đầu)
        this.fps = 6;               // Tốc độ chạy khung hình (6 FPS)
    }

    update(dt) {
        super.update(dt);
        
        // Luôn cộng dồn thời gian hoạt ảnh để giữ chuyển động tuần hoàn
        this.animTime += dt;

        // Xác định hướng hoạt ảnh dựa trên trạng thái phím nhấn trong gameState
        const keys = gameState.keys;
        if (keys) {
            const isLeft = keys['a'] || keys['arrowleft'] || keys['ArrowLeft'];
            const isRight = keys['d'] || keys['arrowright'] || keys['ArrowRight'];
            const isUp = keys['w'] || keys['arrowup'] || keys['ArrowUp'];
            const isDown = keys['s'] || keys['arrowdown'] || keys['ArrowDown'];

            // Ưu tiên hướng di chuyển ngang khi nhấn tổ hợp phím (như a+w, a+s, d+w, d+s)
            if (isLeft) {
                this.currentDir = 'left';
            } else if (isRight) {
                this.currentDir = 'right';
            } else if (isUp) {
                this.currentDir = 'up';
            } else if (isDown) {
                this.currentDir = 'down';
            }
            // Nếu đứng im (không nhấn phím nào), hướng hiện tại và hoạt ảnh vẫn tiếp tục được giữ nguyên
        }
    }

    draw() {
        // 1. Vẽ bóng đổ dưới chân tướng
        ctx.beginPath();
        ctx.arc(this.x, this.y + 6, this.radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fill();

        // 2. Vẽ vòng tròn bảo vệ nếu có Lá chắn kích hoạt (được vẽ đè lên bóng nhưng dưới nhân vật)
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(76, 175, 80, 0.6)";
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // 3. Tính toán số thứ tự khung hình hiện tại (từ 0 đến 3) dựa trên thời gian và FPS
        const frameIndex = Math.floor(this.animTime * this.fps) % 4;

        // Lấy danh sách ảnh và khung hình tương ứng theo hướng
        const animFrames = ROBOT_ANIMS[this.currentDir];
        const currentImg = animFrames ? animFrames[frameIndex] : null;

        // Đường kính vẽ hiển thị tính toán là 60px (bán kính hiển thị là 30px)
        const drawSize = 60; 

        if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
            ctx.save();
            // Căn giữa hình ảnh 32x32 (sau khi phóng to thành 60x60) tại tâm tọa độ vật lý của tướng
            ctx.drawImage(
                currentImg,
                this.x - drawSize / 2,
                this.y - drawSize / 2,
                drawSize,
                drawSize
            );
            ctx.restore();
        } else {
            // Thiết lập vẽ dự phòng (fallback) bằng đồ họa vector khi ảnh chưa kịp tải xong
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#fff";
            ctx.stroke();

            // Vẽ lõi năng lượng tạm thời
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#00e5ff";
            ctx.fill();
        }
    }
}