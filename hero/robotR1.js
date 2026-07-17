class RobotR1 extends Entity {
    constructor(x, y) {
        // Khởi tạo các cấu hình tập trung đã khai báo ở HERO_PRESETS
        const config = HERO_PRESETS['robotR1'];
        
        // Truyền các thông số cơ bản lên lớp cha Entity
        super(x, y, config.radius, config.color, false, config.stats);
    }

    draw() {
        // Vẽ bóng đổ dưới chân tướng
        ctx.beginPath();
        ctx.arc(this.x, this.y + 4, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fill();

        super.draw();

        // Vẽ nhân lõi năng lượng của Robot R1
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#00e5ff";
        ctx.fill();
    }
}