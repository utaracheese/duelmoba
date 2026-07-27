HERO_PRESETS['cheese'] = {
    name: "PK cheese",
    radius: 22,
    color: "#fbc02d",
    rangeType: "Xa",
    stats: {
        maxHp: 475,
        hpRegen: 4,
        maxMana: 10,
        manaRegen: 0.4, // Base: 1 mana / 2.5 giây = 0.4 mana/s
        ad: 25,
        ap: 0,
        attackSpeed: 0.75,
        speed: 4.3, 
        armor: 10,
        mr: 10,
        armorPen: 15,
        magicPen: 0,
        cdr: 0,
        lifesteal: 0,
        spellVamp: 0,
        critRate: 0,
        critDamage: 0,
        expBonus: 0
    }
};

class Cheese extends Entity {
    constructor(x, y) {
        const config = HERO_PRESETS['cheese'];
        super(x, y, config.radius, config.color, false, config.stats);
        this.rangeType = config.rangeType || 'Xa';

        // Thiết lập thời gian hồi chiêu và tiêu hao mana
        this.maxCooldowns = { '1': 1.5, '2': 6.0, '3': 20.0 };
        this.manaCosts = { '1': 1, '2': 2, '3': 5 };

        // Nội tại đòn đánh cường hoá
        this.empoweredChance = 0.05; // 5% ban đầu

        // Biến phục vụ lướt mượt (Skill 1)
        this.dashVector = null;
        this.dashDistanceRemaining = 0;
        this.dashSpeed = 12; // Tốc độ lướt px/frame

        // Buff Tốc đánh từ Chiêu 1
        this.s1BuffTimer = 0;
        this.s1BonusAS = 0;

        // Hướng quay mặt
        this.lastDir = 'RIGHT';
    }

    update(dt) {
        // Xử lý Hồi Mana đặc biệt của Cheese (Bùa xanh cho cố định 1.0 mana/s)
        let actualManaRegen = this.stats.manaRegen;
        if (this.blueBuffTime > 0) {
            actualManaRegen = 1.0; 
        }
        if (this.stats.mana < this.stats.maxMana) {
            this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + actualManaRegen * dt);
        }

        const oldMana = this.stats.mana;
        super.update(dt);
        this.stats.mana = oldMana; 

        // Cập nhật đếm ngược Buff Tốc đánh chiêu 1 (Hết tác dụng sau đúng 1s)
        if (this.s1BuffTimer > 0) {
            this.s1BuffTimer -= dt;
            if (this.s1BuffTimer <= 0) {
                this.s1BonusAS = 0;
                recalculateAttackSpeed(this);
            }
        }

        // Xử lý Lướt mượt Chiêu 1
        if (this.dashDistanceRemaining > 0 && this.dashVector) {
            let moveStep = Math.min(this.dashSpeed, this.dashDistanceRemaining);
            this.x += this.dashVector.x * moveStep;
            this.y += this.dashVector.y * moveStep;

            this.x = Math.max(this.radius, Math.min(MAP_WIDTH - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(MAP_HEIGHT - this.radius, this.y));

            this.dashDistanceRemaining -= moveStep;
            if (this.dashDistanceRemaining <= 0) {
                this.dashVector = null;
            }
        }
    }

    draw() {
        // 1. Lá chắn nếu có
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(76, 175, 80, 0.6)";
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // --- XÁC ĐỊNH HƯỚNG DI CHUYỂN DỰA TRÊN PHÍM BẤM ---
        let isW = gameState.keys['w'] || gameState.keys['W'] || gameState.keys['arrowup'];
        let isS = gameState.keys['s'] || gameState.keys['S'] || gameState.keys['arrowdown'];
        let isA = gameState.keys['a'] || gameState.keys['A'] || gameState.keys['arrowleft'];
        let isD = gameState.keys['d'] || gameState.keys['D'] || gameState.keys['arrowright'];

        // Ưu tiên di chuyển ngang/đường chéo (AW, AS, DW, DS hoặc A, D) -> Dùng hoạt ảnh ngang
        if (isA || isD) {
            if (isA) this.lastDir = 'LEFT';
            if (isD) this.lastDir = 'RIGHT';
        } 
        // Chỉ bấm duy nhất W hoặc S mới chuyển sang nhìn Lên/Xuống
        else if (isW) {
            this.lastDir = 'UP';
        } else if (isS) {
            this.lastDir = 'DOWN';
        }

        let dir = this.lastDir || 'RIGHT';
        let isMoving = isW || isS || isA || isD;
        let walkOffset = isMoving ? Math.sin(Date.now() / 50) * 3 : 0;

        let w = this.radius * 1.8; 
        let h = this.radius * 1.8;
        let x = this.x - w / 2;
        let y = this.y - h / 2;
        let cx = this.x;

        ctx.save();

        // --- BÓNG BƠ CHẢY DƯỚI CHÂN (Melt effect) ---
        ctx.fillStyle = '#ffeba1';
        ctx.beginPath(); 
        ctx.ellipse(cx, y + h - 2, w / 2 + 3 + Math.sin(Date.now() / 200) * 2, 4, 0, 0, Math.PI * 2); 
        ctx.fill();

        // --- VẼ THÂN TƯỚNG PHÔ MAI DỰA THEO HƯỚNG ---
        if (dir === 'UP') {
            // === DI CHUYỂN LÊN (W) - NHÌN TỪ SAU LƯNG ===
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(x + 5, y + h - 5 + walkOffset, 5, 5);
            ctx.fillRect(x + w - 10, y + h - 5 - walkOffset, 5, 5);

            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 6);
            ctx.lineTo(x + w - 4, y + 6);
            ctx.lineTo(x + w, y + h - 4);
            ctx.lineTo(x, y + h - 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ccaa00';
            ctx.beginPath(); ctx.arc(x + 7, y + 14, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + w - 8, y + 18, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + w / 2, y + 24, 3, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.beginPath(); ctx.ellipse(cx, y + 9, w / 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();

        } else if (dir === 'DOWN') {
            // === DI CHUYỂN XUỐNG (S) - NHÌN CHÍNH DIỆN ===
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(x + 6, y + h - 3 + walkOffset, 5, 5);
            ctx.fillRect(x + w - 11, y + h - 3 - walkOffset, 5, 5);

            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(x + 3, y + 4);
            ctx.lineTo(x + w - 3, y + 4);
            ctx.lineTo(x + w, y + h - 5);
            ctx.lineTo(x, y + h - 5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ccaa00';
            ctx.beginPath(); ctx.arc(x + 6, y + 22, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + w - 7, y + 23, 4, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = 'black';
            ctx.fillRect(cx - 7, y + 13, 4, 4);
            ctx.fillRect(cx + 3, y + 13, 4, 4);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath(); ctx.ellipse(cx, y + 7, w / 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();

        } else {
            // === DI CHUYỂN NGANG HOẶC CHÉO (A, D, AW, AS, DW, DS) ===
            let facingRight = (dir === 'RIGHT');

            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(x + 5, y + h - 5 + walkOffset, 6, 6);
            ctx.fillRect(x + w - 12, y + h - 5 - walkOffset, 6, 6);

            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            if (facingRight) {
                ctx.moveTo(x + 5, y + 5); 
                ctx.lineTo(x + w - 5, y);
                ctx.lineTo(x + w, y + h - 8);
                ctx.lineTo(x, y + h - 5);
            } else {
                ctx.moveTo(x + 5, y); 
                ctx.lineTo(x + w - 5, y + 5);
                ctx.lineTo(x + w, y + h - 5);
                ctx.lineTo(x, y + h - 8);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ccaa00';
            ctx.beginPath(); ctx.arc(x + 8, y + 15, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 20, y + 10, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 15, y + 28, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 25, y + 23, 2.5, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = 'black';
            let eyeX = facingRight ? x + w - 9 : x + 5;
            ctx.fillRect(eyeX, y + 14, 4, 4);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath(); 
            ctx.ellipse(x + w / 2, y + 7, w / 3, 2.5, facingRight ? Math.PI / 8 : -Math.PI / 8, 0, Math.PI * 2); 
            ctx.fill();
        }

        ctx.restore();

        // Vòng sáng đòn đánh cường hoá
        if (this.empoweredChance > 0.25) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 235, 59, ${Math.min(1, this.empoweredChance)})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Hiệu ứng xoáy choáng trên đỉnh đầu khi bị choáng
        if (this.stunTimer > 0) {
            ctx.save();
            let headX = this.x;
            let headY = this.y - this.radius - 18;
            let time = performance.now() * 0.008;

            for (let i = 0; i < 3; i++) {
                let a = time + (i * Math.PI * 2 / 3);
                let sx = headX + Math.cos(a) * 12;
                let sy = headY + Math.sin(a) * 5;
                
                ctx.fillStyle = "#ffeb3b";
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "rgba(255, 235, 59, 0.6)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();
        }

        // Hạt lửa bùa đỏ
        if (this.redEmberParticles && this.redEmberParticles.length > 0) {
            this.redEmberParticles.forEach(p => {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = Math.random() > 0.3 ? "#ff5722" : "#ffeb3b";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }
    }
}

// --- LỚP LÃNH ĐỊA BƠ (CHIÊU 3 PK CHEESE) ---
class ButterDomain {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.radius = 320; 
        this.duration = 7.0; // Tồn tại 7 giây
        this.isExpired = false;
        this.particles = [];
    }

    update(dt) {
        this.duration -= dt;
        if (this.duration <= 0) {
            this.isExpired = true;
            return;
        }

        gameState.entities.forEach(entity => {
            if (entity.stats.hp <= 0) return;
            let dist = Math.hypot(entity.x - this.x, entity.y - this.y);
            if (dist <= this.radius) {
                if (entity === this.owner) {
                    entity.inButterDomain = true; // X2 Tốc đánh
                } else {
                    // Kẻ địch & Quái bị giảm 60% tốc chạy
                    entity.slowTimer = 0.2; 
                    entity.slowAmount = 0.60;

                    // Hiệu ứng khói cam đẩy ra từ sau lưng
                    if (Math.random() < 0.5) {
                        let angle = entity.angle || 0;
                        let backX = entity.x - Math.cos(angle) * (entity.radius * 0.8);
                        let backY = entity.y - Math.sin(angle) * (entity.radius * 0.8);
                        
                        this.particles.push({
                            x: backX + (Math.random() - 0.5) * 8,
                            y: backY + (Math.random() - 0.5) * 8,
                            vx: -Math.cos(angle) * (1.5 + Math.random() * 2),
                            vy: -Math.sin(angle) * (1.5 + Math.random() * 2),
                            size: 4 + Math.random() * 5,
                            alpha: 0.8,
                            life: 0.4
                        });
                    }
                }
            }
        });

        // Cập nhật hạt khói cam
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.size += dt * 6;
            p.alpha -= dt / p.life;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        ctx.save();
        let gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.1, this.x, this.y, this.radius);
        gradient.addColorStop(0, "rgba(255, 235, 59, 0.35)");
        gradient.addColorStop(0.8, "rgba(255, 193, 7, 0.2)");
        gradient.addColorStop(1, "rgba(255, 111, 0, 0)");

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 214, 0, 0.8)";
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.stroke();

        // Vẽ các hạt khói cam đẩy ra từ sau lưng kẻ địch
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = "#ff6d00"; 
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.restore();
    }
}