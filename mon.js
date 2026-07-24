// --- LỚP QUÁI RỪNG ---
class Monster extends Entity {
    constructor(x, y, type, parentStats = null) {
        let radius = 25; 
        let color = "#fff";
        if (type === 'blue') { radius = 32; color = '#1565c0'; }
        else if (type === 'red') { radius = 30; color = '#c62828'; }
        else if (type === 'monkey') { radius = 22; color = '#795548'; }
        else if (type === 'golem') { radius = 36; color = '#9e9e9e'; }
        else if (type === 'mini_golem') { radius = 15; color = '#757575'; }

        super(x, y, radius, color);

        // Gán ID độc nhất để đồng bộ riêng lẻ từng quái khi chơi online
        this.id = "mon_" + Math.random().toString(36).substr(2, 9);
        this.spawnX = x;
        this.spawnY = y;
        this.monsterType = type; 

        let elapsedMinutes = (performance.now() - gameState.gameStartTime) / 60000;
        
        // Thiết lập chỉ số tăng tiến của quái theo thời gian thực
        let maxHp = 100;
        let ad = 10;
        let armor = 30;
        let speed = 3.0;

        // Mỗi phút tăng thêm 25% lượng HP cơ bản (cứ 4 phút sẽ x2 HP gốc)
        let hpMultiplier = 1 + (0.25 * elapsedMinutes); 

        if (type === 'blue' || type === 'red') {
            maxHp = 125 * hpMultiplier;
            ad = 10 + elapsedMinutes;
            armor = 45;
            speed = 3.0;
        } else if (type === 'monkey') {
            maxHp = 100 * hpMultiplier;
            ad = 5 + (1 * elapsedMinutes);
            armor = 20;
            speed = 3.5;
        } else if (type === 'golem') {
            maxHp = 250 * hpMultiplier;
            ad = 20 + (5 * elapsedMinutes);
            armor = 50 + (5 * elapsedMinutes);
            speed = 2.4;
        } else if (type === 'mini_golem' && parentStats) {
            // Golem con kế thừa gián tiếp từ lượng HP đã nhân hệ số của Golem mẹ
            maxHp = parentStats.maxHp * 0.20;
            ad = parentStats.ad * 0.20;
            armor = parentStats.armor * 0.20;
            speed = parentStats.speed * 1.2;
        }

        this.stats = new Stats({
            maxHp: maxHp,
            speed: speed,
            armor: armor,
            mr: armor
        });
        this.stats.ad = ad;
        this.stats.hp = this.stats.maxHp;

        this.state = 'idle'; 
        this.leashDistance = 500; 
        this.attackCooldown = 0;
    }

    // FIX CHÍ MẠNG TRÊN QUÁI: Thêm tham số isCrit = false và truyền vào super.takeDamage
    takeDamage(amount, type, attacker = null, isCrit = false) {
        super.takeDamage(amount, type, attacker, isCrit);
        // Khi bị tấn công bởi một người chơi thực tế, quái sẽ phản kháng
        if (attacker && this.state !== 'returning') {
            this.state = 'chasing';
        }
    }

    update(dt) {
        if (gameState.mode === 'match' && !isHost) {
            this.stats.update(dt, this);
            this.x += (this.targetX - this.x) * 0.25;
            this.y += (this.targetY - this.y) * 0.25;
            return;
        }

        super.update(dt);

        // NẾU ĐANG BỊ CHOÁNG -> KHÔNG THỂ DI CHUYỂN HOẶC TẤN CÔNG
        if (this.stunTimer > 0) {
            if (this.attackCooldown > 0) this.attackCooldown -= dt;
            return;
        }

        let targets = [gameState.player];
        if (gameState.remotePlayer) targets.push(gameState.remotePlayer);

        let target = null;
        let minDist = Infinity;
        targets.forEach(t => {
            let dist = Math.hypot(t.x - this.x, t.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                target = t;
            }
        });

        let distToSpawn = Math.hypot(this.spawnX - this.x, this.spawnY - this.y);

        if (this.state === 'chasing' && target) {
            if (distToSpawn > this.leashDistance) {
                this.state = 'returning';
            } else {
                let angle = Math.atan2(target.y - this.y, target.x - this.x);
                this.angle = angle;
                
                // Tốc độ chạy chịu ảnh hưởng bởi Làm chậm (getSpeed)
                let moveSpeed = this.getSpeed();
                this.x += Math.cos(angle) * moveSpeed;
                this.y += Math.sin(angle) * moveSpeed;

                if (minDist <= this.radius + target.radius + 10) {
                    if (this.attackCooldown <= 0) {
                        target.takeDamage(this.stats.ad, 'physical', this); 
                        this.attackCooldown = 1.2;
                    }
                }
            }
        } else if (this.state === 'returning') {
            if (this.monsterType === 'mini_golem') {
                this.state = 'idle';
            } else if (distToSpawn < 10) {
                this.x = this.spawnX;
                this.y = this.spawnY;
                this.state = 'idle';
                this.stats.hp = this.stats.maxHp;
            } else {
                let angle = Math.atan2(this.spawnY - this.y, this.spawnX - this.x);
                this.angle = angle;
                let moveSpeed = this.getSpeed() * 2.5;
                this.x += Math.cos(angle) * moveSpeed;
                this.y += Math.sin(angle) * moveSpeed;
                this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + (this.stats.maxHp * 0.20) * dt);
            }
        } else {
            if (this.monsterType !== 'mini_golem' && distToSpawn > 5) {
                let angle = Math.atan2(this.spawnY - this.y, this.spawnX - this.x);
                let moveSpeed = this.getSpeed();
                this.x += Math.cos(angle) * moveSpeed;
                this.y += Math.sin(angle) * moveSpeed;
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = this.monsterType === 'blue' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 87, 34, 0.15)';
        if (this.monsterType === 'monkey') {
            ctx.fillStyle = 'rgba(121, 85, 72, 0.15)';
        } else if (this.monsterType === 'golem' || this.monsterType === 'mini_golem') {
            ctx.fillStyle = 'rgba(158, 158, 158, 0.15)';
        }
        ctx.fill();
        
        ctx.strokeStyle = this.monsterType === 'blue' ? '#00e5ff' : (this.monsterType === 'red' ? '#ff5722' : (this.monsterType === 'monkey' ? '#795548' : '#9e9e9e'));
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        super.draw();

        // Hiển thị thanh máu (HP Bar) trên đầu quái vật khi lượng HP < 100%
        if (this.stats.hp < this.stats.maxHp && this.stats.hp > 0) {
            let barW = this.radius * 2;
            let barH = 5;
            let barX = this.x - barW / 2;
            let barY = this.y - this.radius - 12;

            ctx.save();
            ctx.fillStyle = "#333";
            ctx.fillRect(barX, barY, barW, barH);

            let fillRatio = this.stats.hp / this.stats.maxHp;
            ctx.fillStyle = "#4caf50";
            ctx.fillRect(barX, barY, barW * fillRatio, barH);

            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
            ctx.restore();
        }
    }
}