// Khởi tạo đối tượng lưu trữ các bộ ảnh hoạt ảnh di chuyển và trạng thái nghỉ (idle)
const ROBOT_ANIMS = {
    left: [],
    right: [],
    up: [],
    down: [],
    idleLeft: [],
    idleRight: [],
    idleUp: [],
    idleDown: []
};

// Tiền tải (Preload) toàn bộ 4 hướng hoạt ảnh di chuyển và nghỉ để tránh hiện tượng nhấp nháy
for (let i = 0; i < 4; i++) {
    // Hoạt ảnh di chuyển
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

    // Hoạt ảnh trạng thái nghỉ (idle/đứng yên)
    const imgIdleLeft = new Image();
    imgIdleLeft.src = `assets/animation/robotR1_control/nghi_trai${i}.png`;
    ROBOT_ANIMS.idleLeft.push(imgIdleLeft);

    const imgIdleRight = new Image();
    imgIdleRight.src = `assets/animation/robotR1_control/nghi_phai${i}.png`;
    ROBOT_ANIMS.idleRight.push(imgIdleRight);

    const imgIdleUp = new Image();
    imgIdleUp.src = `assets/animation/robotR1_control/nghi_up${i}.png`;
    ROBOT_ANIMS.idleUp.push(imgIdleUp);

    const imgIdleDown = new Image();
    imgIdleDown.src = `assets/animation/robotR1_control/nghi_down${i}.png`;
    ROBOT_ANIMS.idleDown.push(imgIdleDown);
}

class RobotR1 extends Entity {
    constructor(x, y) {
        const config = HERO_PRESETS['robotR1'];
        // Kế thừa các thông số gốc từ Entity
        super(x, y, config.radius, config.color, false, config.stats);
        this.rangeType = config.rangeType || 'Xa';
        this.animTime = 0;          // Bộ đếm thời gian hoạt ảnh
        this.currentDir = 'down';   // Hướng hoạt ảnh hiện tại (mặc định ban đầu)
        this.isMoving = false;      // Trạng thái di chuyển/đứng yên
        this.fps = 6;               // Tốc độ chạy khung hình (6 FPS)
    }

    update(dt) {
        super.update(dt);
        
        // Luôn cộng dồn thời gian hoạt ảnh để giữ chuyển động tuần hoàn
        this.animTime += dt;

        // Phân biệt xử lý giữa người chơi local (bản thân) và remote (đối thủ)
        if (gameState.mode === 'match' && this === gameState.remotePlayer) {
            // Đối với đối thủ: Tính toán vector hướng di chuyển từ sự thay đổi vị trí (x, y) hướng tới (targetX, targetY)
            let dx = this.targetX - this.x;
            let dy = this.targetY - this.y;
            let dist = Math.hypot(dx, dy);

            // Nếu khoảng cách sai số đủ lớn, xác định đối thủ đang di chuyển
            if (dist > 1.5) {
                this.isMoving = true;
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.currentDir = dx < 0 ? 'left' : 'right';
                } else {
                    this.currentDir = dy < 0 ? 'up' : 'down';
                }
            } else {
                this.isMoving = false;
            }
        } else {
            // Đối với người chơi hiện tại: Xác định trạng thái di chuyển dựa trên bàn phím điều khiển
            const keys = gameState.keys;
            let movingThisFrame = false;

            if (keys) {
                const isLeft = keys['a'] || keys['arrowleft'] || keys['ArrowLeft'];
                const isRight = keys['d'] || keys['arrowright'] || keys['ArrowRight'];
                const isUp = keys['w'] || keys['arrowup'] || keys['ArrowUp'];
                const isDown = keys['s'] || keys['arrowdown'] || keys['ArrowDown'];

                if (isLeft || isRight || isUp || isDown) {
                    movingThisFrame = true;
                    // Ưu tiên hướng di chuyển ngang khi nhấn tổ hợp phím chéo
                    if (isLeft) {
                        this.currentDir = 'left';
                    } else if (isRight) {
                        this.currentDir = 'right';
                    } else if (isUp) {
                        this.currentDir = 'up';
                    } else if (isDown) {
                        this.currentDir = 'down';
                    }
                }
            }
            this.isMoving = movingThisFrame;
        }
    }

    draw() {
        // 1. Vẽ bóng đổ dưới chân tướng
        ctx.beginPath();
        ctx.arc(this.x, this.y + 6, this.radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fill();

        // 2. Vẽ vòng tròn bảo vệ nếu có Lá chắn kích hoạt
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(76, 175, 80, 0.6)";
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // 3. Tính toán số thứ tự khung hình hiện tại (từ 0 đến 3) dựa trên thời gian và FPS
        const frameIndex = Math.floor(this.animTime * this.fps) % 4;

        // 4. Lựa chọn bộ ảnh hoạt ảnh phù hợp theo trạng thái (di chuyển hoặc nghỉ)
        let animFrames = null;
        if (this.isMoving) {
            animFrames = ROBOT_ANIMS[this.currentDir];
        } else {
            if (this.currentDir === 'left') animFrames = ROBOT_ANIMS.idleLeft;
            else if (this.currentDir === 'right') animFrames = ROBOT_ANIMS.idleRight;
            else if (this.currentDir === 'up') animFrames = ROBOT_ANIMS.idleUp;
            else if (this.currentDir === 'down') animFrames = ROBOT_ANIMS.idleDown;
        }

        const currentImg = animFrames ? animFrames[frameIndex] : null;

        // Đường kính vẽ hiển thị tính toán là 60px (bán kính hiển thị là 30px)
        const drawSize = 60; 

        if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
            ctx.save();
            // Căn giữa hình ảnh tại tâm tọa độ vật lý của tướng
            ctx.drawImage(
                currentImg,
                this.x - drawSize / 2,
                this.y - drawSize / 2,
                drawSize,
                drawSize
            );
            ctx.restore();
        } else {
            // Vẽ dự phòng (fallback) bằng đồ họa vector khi ảnh chưa kịp tải xong
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