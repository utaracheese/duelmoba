const HERO_PRESETS = {
    robotR1: {
        name: "Robot R1",
        radius: 22,
        color: "#37474f",
        stats: {
            maxHp: 650,
            hpRegen: 2.5,
            maxMana: 400,
            manaRegen: 1.8,
            ad: 10,
            ap: 25,
            attackSpeed: 0.65,
            speed: 4.2, 
            armor: 55,
            mr: 55,
            armorPen: 5,
            magicPen: 20,
            cdr: 0,
            lifesteal: 0,
            spellVamp: 0,
            critRate: 0,
            critDamage: 0, // Đã chỉnh sửa gốc về 0%
            expBonus: 0
        }
    }
};

class Stats {
    constructor(config = {}) {
        this.maxHp = config.maxHp || 600;
        this.hp = this.maxHp;
        this.hpRegen = config.hpRegen !== undefined ? config.hpRegen : 2.5; 
        this.maxMana = config.maxMana || 350;
        this.mana = this.maxMana;
        this.manaRegen = config.manaRegen || 1.8;
        this.ad = config.ad || 10;          
        this.ap = config.ap || 25;          
        this.attackSpeed = config.attackSpeed || 0.65; 
        this.speed = config.speed || 4.2;
        this.armor = config.armor !== undefined ? config.armor : 30;
        this.mr = config.mr !== undefined ? config.mr : 30;
        this.armorPen = config.armorPen || 0; 
        this.magicPen = config.magicPen || 0; 
        this.cdr = config.cdr || 0; 

        this.lifesteal = config.lifesteal || 0; 
        this.spellVamp = config.spellVamp || 0; 
        this.critRate = config.critRate || 0; 
        this.critDamage = config.critDamage !== undefined ? config.critDamage : 0; 
        this.expBonus = config.expBonus || 0; 
    }

    update(dt, ownerEntity) {
        let actualRegen = this.hpRegen;
        if (ownerEntity && ownerEntity.grievousWoundsTimer > 0) {
            actualRegen *= 0.55; 
        }

        if (this.hp < this.maxHp && this.hp > 0) {
            this.hp = Math.min(this.maxHp, this.hp + actualRegen * dt);
        }
        
        let currentManaRegen = this.manaRegen;
        if (ownerEntity && ownerEntity.blueBuffTime > 0) {
            currentManaRegen *= 10;
        }

        if (this.mana < this.maxMana) {
            this.mana = Math.min(this.maxMana, this.mana + currentManaRegen * dt);
        }
    }
}

class Entity {
    constructor(x, y, radius, color, isDummy = false, statsConfig = {}) {
        this.x = x;
        this.y = y;
        this.targetX = x; 
        this.targetY = y; 
        this.radius = radius;
        this.color = color;
        this.isDummy = isDummy;
        
        this.stats = new Stats(statsConfig);
        
        this.angle = 0;
        this.shieldActive = false;
        this.shieldTime = 0;

        this.cooldowns = { '1': 0, '2': 0, '3': 0 };
        this.maxCooldowns = { '1': 2.5, '2': 12, '3': 20 }; 
        this.manaCosts = { '1': 15, '2': 30, '3': 105 };   

        this.attackCooldown = 0; 

        this.blueBuffTime = 0;
        this.redBuffTime = 0;

        this.redBurnTimer = 0;
        this.redBurnTickTimer = 0; // Đã thêm bộ đếm giây cho Red Buff
        this.redBurnAttacker = null;

        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 50;
        this.pendingLevelUps = 0;
        this.upgradesChosenCount = 0;
        this.currentUpgradeChoices = null; 

        this.attackSpeedBonus = 0;
        this.premiumGuardian = false;
        this.premiumEye = false;
        this.premiumGunner = false;

        this.premiumQuydet = false;
        this.premiumThanhquet = false;
        this.premiumErosion = false;
        this.premiumJackpot = false;

        this.grievousWoundsTimer = 0;
        this.erosionTickTimer = 0; // Bộ đếm giây của Gặm mòn
        this.erosionAttacker = null;

        this.accumulationPoints = 0;
        this.accumulationTickers = [];
        this.jackpotTimer = 0;

        this.chosenPremiumUpgrades = new Set();
    }

    takeDamage(amount, type, attacker = null, isCrit = false) {
        let finalDmg = amount;

        // Guardian: Giảm 17.5% mọi sát thương nhận vào
        if (this.premiumGuardian) {
            finalDmg *= 0.825;
        }

        let rawArmorPen = (attacker && attacker.stats) ? attacker.stats.armorPen : 0;
        let rawMagicPen = (attacker && attacker.stats) ? attacker.stats.magicPen : 0;

        if (type === 'physical') {
            let effectiveArmor = Math.max(0, this.stats.armor - rawArmorPen);
            finalDmg = finalDmg * (600 / (600 + effectiveArmor));
        } else if (type === 'magic') {
            let effectiveMR = Math.max(0, this.stats.mr - rawMagicPen);
            finalDmg = finalDmg * (600 / (600 + effectiveMR));
        }

        if (this.shieldActive) {
            finalDmg *= 0.5;
            this.shieldActive = false; 
        }

        this.stats.hp = Math.max(0, this.stats.hp - finalDmg);

        gameState.damageTexts.push({
            x: this.x + (Math.random() - 0.5) * 30,
            y: this.y - this.radius - 10,
            text: Math.round(finalDmg).toString() + (isCrit ? "!" : ""),
            color: isCrit ? '#ff9100' : (type === 'physical' ? '#ff3333' : (type === 'magic' ? '#b388ff' : '#ffffff')),
            life: 1.0 
        });

        return finalDmg;
    }

    heal(amount) {
        if (this.stats.hp <= 0) return;
        let healingMultiplier = 1.0;
        if (this.grievousWoundsTimer > 0) {
            healingMultiplier *= 0.55; 
        }
        let actualHeal = amount * healingMultiplier;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + actualHeal);
    }

    applyRedBurn(attacker) {
        this.redBurnTimer = 5.0; 
        this.redBurnTickTimer = 0; // Reset bộ đếm giây của bùa đỏ
        this.redBurnAttacker = attacker;
    }

    getSpeed() {
        let baseSpeed = this.stats.speed;
        // Công thức Eye: nhân linh hoạt 110% cho tất cả tốc chạy hiện có và sau này
        if (this.premiumEye) {
            baseSpeed *= 1.10;
        }
        if (this.redBurnTimer > 0) {
            baseSpeed *= 0.8; 
        }
        return baseSpeed;
    }

    update(dt) {
        this.stats.update(dt, this);

        if (gameState.mode === 'match' && this === gameState.remotePlayer) {
            this.x += (this.targetX - this.x) * 0.25;
            this.y += (this.targetY - this.y) * 0.25;
        }
        
        if (this.shieldActive) {
            this.shieldTime -= dt;
            if (this.shieldTime <= 0) {
                this.shieldActive = false;
            }
        }

        for (let skill in this.cooldowns) {
            if (this.cooldowns[skill] > 0) {
                this.cooldowns[skill] = Math.max(0, this.cooldowns[skill] - dt);
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        }

        if (this.blueBuffTime > 0) this.blueBuffTime = Math.max(0, this.blueBuffTime - dt);
        if (this.redBuffTime > 0) this.redBuffTime = Math.max(0, this.redBuffTime - dt);

        // Đã cập nhật: Bùa đỏ gây sát thương mỗi giây một lần bằng 2% HP tối đa địch
        if (this.redBurnTimer > 0) {
            this.redBurnTimer -= dt;
            this.redBurnTickTimer += dt;
            if (this.redBurnTickTimer >= 1.0) {
                this.redBurnTickTimer -= 1.0;
                let trueDmgVal = this.stats.maxHp * 0.02;
                this.takeDamage(trueDmgVal, 'true', this.redBurnAttacker);
            }
        } else {
            this.redBurnTickTimer = 0;
        }

        // Đã cập nhật: Xử lý sát thương theo giây của Gặm mòn (Erosion DoT)
        if (this.grievousWoundsTimer > 0) {
            this.grievousWoundsTimer = Math.max(0, this.grievousWoundsTimer - dt);
            if (this.erosionAttacker) {
                this.erosionTickTimer += dt;
                if (this.erosionTickTimer >= 1.0) {
                    this.erosionTickTimer -= 1.0;
                    let attAd = this.erosionAttacker.stats.ad || 0;
                    let attAp = this.erosionAttacker.stats.ap || 0;
                    let attMaxHp = this.erosionAttacker.stats.maxHp || 0;
                    let erosionDmg = (attAd * 0.025) + (attAp * 0.025) + (attMaxHp * 0.015);
                    // Gây sát thương phép, sát thương này không kích hoạt lại điểm gây hiệu ứng gặm mòn
                    this.takeDamage(erosionDmg, 'magic', this.erosionAttacker, false);
                }
            }
        } else {
            this.erosionTickTimer = 0;
            this.erosionAttacker = null;
        }

        // Guardian: Tự động hồi 1.5% HP tối đa mỗi giây
        if (this.premiumGuardian && this.stats.hp > 0 && this.stats.hp < this.stats.maxHp) {
            this.heal((this.stats.maxHp * 0.015) * dt);
        }

        if (this.accumulationTickers && this.accumulationTickers.length > 0) {
            this.accumulationTickers.forEach(ticker => {
                ticker.timer += dt;
                let interval = Math.max(0.1, ticker.interval);
                if (ticker.timer >= interval) {
                    ticker.timer = 0;
                    let randomPoints = Math.floor(1 + Math.random() * 6);
                    this.accumulationPoints = (this.accumulationPoints || 0) + randomPoints;
                    if (this.accumulationPoints >= 250) {
                        this.accumulationPoints = 0;
                        addXp(this, 250);
                    }
                }
            });
        }

        if (this.premiumJackpot && this.stats.hp > 0) {
            this.jackpotTimer += dt;
            if (this.jackpotTimer >= 1.0) {
                this.jackpotTimer = 0;
                let needed = this.xpNeeded || 50;
                let gain = Math.round(needed * 0.0175);
                addXp(this, Math.max(1, gain));
            }
        }
    }

    draw() {
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(76, 175, 80, 0.6)";
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = "#333";
        ctx.fillRect(this.radius - 6, -6, 8, 12);
        ctx.restore();
    }
}

class Projectile {
    constructor(config) {
        this.owner = config.owner;
        this.x = config.x;
        this.y = config.y;
        this.vx = config.vx;
        this.vy = config.vy;
        this.radius = config.radius;
        this.originalRadius = config.radius; 
        this.speed = config.speed;
        this.type = config.type; 
        this.damage = config.damage;
        this.dmgType = config.dmgType || 'physical';
        this.color = config.color || '#fff';
        this.range = config.range || 99999;
        this.travelled = 0;
        this.lastTick = 0; 
        this.zapRadius = 120;

        this.animTime = 0;
        this.eOverlayIndex = 0;
        this.lastFrameIndex = -1;
        
        this.glowFlashIntensity = 0; 
        this.activeZapTargets = []; 

        this.isExpiring = false;
        this.expireTimer = 0.25; 
        this.opacity = 1.0;
    }

    update(dt) {
        this.animTime += dt;

        if (this.isExpiring) {
            this.expireTimer -= dt;
            this.opacity = Math.max(0, this.expireTimer / 0.25);
            this.radius = this.originalRadius * this.opacity;
            if (this.expireTimer <= 0) {
                this.isRemoved = true; 
            }
            return; 
        }

        let dx = this.vx * this.speed * dt * 60;
        let dy = this.vy * this.speed * dt * 60;
        this.x += dx;
        this.y += dy;
        this.travelled += Math.sqrt(dx*dx + dy*dy);

        if (this.glowFlashIntensity > 0) {
            this.glowFlashIntensity -= dt * 5; 
        }

        this.activeZapTargets = [];

        if (this.type === '1') {
            this.lastTick += dt;
            if (this.lastTick >= 0.25) {
                this.lastTick = 0;
                
                gameState.entities.forEach(entity => {
                    if (entity !== this.owner) {
                        let dist = Math.hypot(entity.x - this.x, entity.y - this.y);
                        if (dist <= this.zapRadius) { 
                            let apDmg = (this.owner ? (this.owner.stats.ad * 0.1) + (this.owner.stats.ap * 0.25) : 10);
                            
                            let actualDmg = entity.takeDamage(apDmg, 'magic', this.owner, false);
                            
                            if (this.owner && this.owner.premiumErosion) {
                                entity.grievousWoundsTimer = 3.5;
                                entity.erosionAttacker = this.owner;
                                entity.erosionTickTimer = 0;
                            }

                            if (this.owner && actualDmg > 0 && this.owner.stats.spellVamp > 0) {
                                this.owner.heal(actualDmg * (this.owner.stats.spellVamp / 100));
                            }

                            this.activeZapTargets.push(entity);
                            this.glowFlashIntensity = 1.0; 
                        }
                    }
                });
            }
        }

        if (this.travelled >= this.range) {
            this.isExpiring = true;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        if (this.type === '1') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.zapRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.1 * this.opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            this.activeZapTargets.forEach(target => {
                this.drawLightningBolt(this.x, this.y, target.x, target.y);
                this.drawImpactEffect(target);
            });

            let baseGlowSize = this.radius * 2.5;
            let finalGlowSize = baseGlowSize * (1 + this.glowFlashIntensity * 0.8);
            let radialGlow = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, finalGlowSize);
            radialGlow.addColorStop(0, "rgba(0, 229, 255, 0.8)");
            radialGlow.addColorStop(0.4, "rgba(0, 150, 255, 0.4)");
            radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, finalGlowSize, 0, Math.PI * 2);
            ctx.fillStyle = radialGlow;
            ctx.fill();

            let currentFrameIndex = Math.floor(this.animTime * 12) % 4;
            let frameWidth = 443;
            let frameHeight = 443;

            let absoluteFrameCount = Math.floor(this.animTime * 12);
            if (absoluteFrameCount !== this.lastFrameIndex) {
                this.lastFrameIndex = absoluteFrameCount;
                if (absoluteFrameCount % 5 === 0) {
                    this.eOverlayIndex = Math.floor(Math.random() * 5);
                }
            }

            if (imgAssets.core.complete && imgAssets.core.naturalWidth > 0) {
                ctx.drawImage(
                    imgAssets.core,
                    0, currentFrameIndex * frameHeight, frameWidth, frameHeight,
                    this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2
                );
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#00e5ff";
                ctx.fill();
            }

            let currentEImg = imgAssets.e[this.eOverlayIndex];
            if (currentEImg.complete && currentEImg.naturalWidth > 0) {
                ctx.drawImage(
                    currentEImg,
                    this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2
                );
            }
        }

        else if (this.type === '3') {
            let tailLength = 10;
            for (let i = 1; i <= tailLength; i++) {
                let tailX = this.x - this.vx * i * 15;
                let tailY = this.y - this.vy * i * 15;
                let tailSize = this.radius * (1 - i / tailLength);
                
                let tailGlow = ctx.createRadialGradient(tailX, tailY, 0, tailX, tailY, tailSize);
                tailGlow.addColorStop(0, `rgba(255, 87, 34, ${0.4 * (1 - i / tailLength)})`);
                tailGlow.addColorStop(1, "rgba(0,0,0,0)");
                
                ctx.beginPath();
                ctx.arc(tailX, tailY, tailSize, 0, Math.PI * 2);
                ctx.fillStyle = tailGlow;
                ctx.fill();
            }

            let glowUnder = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
            glowUnder.addColorStop(0, "rgba(255, 110, 0, 0.7)");
            glowUnder.addColorStop(1, "rgba(0,0,0,0)");
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = glowUnder;
            ctx.fill();

            let currentFrameIndex = Math.floor(this.animTime * 12) % 4;
            let frameWidth = 443;
            let frameHeight = 443;

            if (imgAssets.firecore.complete && imgAssets.firecore.naturalWidth > 0) {
                ctx.drawImage(
                    imgAssets.firecore,
                    0, currentFrameIndex * frameHeight, frameWidth, frameHeight,
                    this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2
                );
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#ff5722";
                ctx.fill();
            }

            let glowAbove = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.2);
            glowAbove.addColorStop(0, "rgba(255, 235, 59, 0.8)");
            glowAbove.addColorStop(1, "rgba(0,0,0,0)");
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = glowAbove;
            ctx.fill();
        }

        else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        ctx.restore();
    }

    drawLightningBolt(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);

        let distance = Math.hypot(x2 - x1, y2 - y1);
        let segments = 6;
        let currentX = x1;
        let currentY = y1;
        let angle = Math.atan2(y2 - y1, x2 - x1);

        for (let i = 1; i < segments; i++) {
            let ratio = i / segments;
            let targetSegmentX = x1 + (x2 - x1) * ratio;
            let targetSegmentY = y1 + (y2 - y1) * ratio;

            let offset = (Math.random() - 0.5) * 24; 
            let perpAngle = angle + Math.PI / 2;

            currentX = targetSegmentX + Math.cos(perpAngle) * offset;
            currentY = targetSegmentY + Math.sin(perpAngle) * offset;

            ctx.lineTo(currentX, currentY);
        }

        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.9)";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawImpactEffect(entity) {
        let rndIndex = Math.floor(Math.random() * 5);
        let effectImg = imgAssets.e[rndIndex];
        
        ctx.save();
        let size = entity.radius * 2.8; 
        if (effectImg.complete && effectImg.naturalWidth > 0) {
            ctx.drawImage(
                effectImg,
                entity.x - size / 2,
                entity.y - size / 2,
                size,
                size
            );
        }
        ctx.restore();
    }
}

function triggerHeroSelect(mode) {
    gameState.mode = mode;
    document.getElementById("menuScreen").style.display = "none";
    document.getElementById("heroSelectScreen").style.display = "flex";
}

function selectHero(heroKey) {
    gameState.selectedHeroKey = heroKey;
    document.querySelectorAll(".hero-card").forEach(card => {
        card.classList.remove("selected");
    });
    document.getElementById("card_" + heroKey).classList.add("selected");
}

function confirmHeroAndStart() {
    document.getElementById("heroSelectScreen").style.display = "none";
    document.getElementById("lobbyScreen").style.display = "none"; 
    document.getElementById("hud").style.display = "block";

    if (gameState.mode === 'test') {
        document.getElementById("testToolToggle").style.display = "block";
        document.getElementById("testToolPanel").style.display = "none"; 
        document.getElementById("lobbyInfo").style.display = "none";
    } else {
        document.getElementById("testToolToggle").style.display = "none";
        document.getElementById("testToolPanel").style.display = "none";
        document.getElementById("lobbyInfo").style.display = "block";
    }

    initGame();
}

function showMatchmakingPanel() {
    document.getElementById("matchPanel").style.display = "block";
}

function hideMatchmakingPanel() {
    document.getElementById("matchPanel").style.display = "none";
}

function createRoom() {
    gameState.mode = 'match'; 
    let randomId = Math.floor(1000 + Math.random() * 9000);
    gameState.roomId = randomId;
    isHost = true;
    localPlayerReady = false;
    remotePlayerReady = false;

    document.getElementById("menuScreen").style.display = "none";
    document.getElementById("lobbyScreen").style.display = "flex";
    document.getElementById("lobbyRoomIdText").innerText = randomId;
    document.getElementById("hostReadyText").innerText = "Chưa sẵn sàng";
    document.getElementById("hostReadyText").style.color = "#f44336";
    document.getElementById("clientHeroText").innerText = "Đang chờ kết nối...";
    document.getElementById("clientReadyText").innerText = "-";

    if (peer) peer.destroy();

    peer = new Peer('moba-solo-' + randomId);

    peer.on('error', (err) => {
        console.error(err);
        alert("Lỗi khởi tạo phòng: " + err.type);
        backToMenu();
    });

    peer.on('connection', (c) => {
        if (conn) {
            c.on('open', () => {
                c.send({ type: 'lobby-full' });
                setTimeout(() => c.close(), 500);
            });
            return;
        }
        conn = c;
        setupNetworkEvents();
    });
}

function joinRoom() {
    gameState.mode = 'match'; 
    let inputId = document.getElementById("roomIdInput").value.trim();
    if (!inputId) {
        alert("Vui lòng nhập ID phòng!");
        return;
    }
    gameState.roomId = inputId;
    isHost = false;
    localPlayerReady = false;
    remotePlayerReady = false;

    document.getElementById("menuScreen").style.display = "none";
    document.getElementById("lobbyScreen").style.display = "flex";
    document.getElementById("lobbyRoomIdText").innerText = inputId;
    document.getElementById("clientReadyText").innerText = "Chưa sẵn sàng";
    document.getElementById("clientReadyText").style.color = "#f44336";
    document.getElementById("hostHeroText").innerText = "Đang kết nối...";
    document.getElementById("hostReadyText").innerText = "-";

    if (peer) peer.destroy();

    peer = new Peer();

    peer.on('open', () => {
        conn = peer.connect('moba-solo-' + inputId);
        setupNetworkEvents();
    });

    peer.on('error', (err) => {
        console.error(err);
        alert("Lỗi kết nối phòng: " + err.type);
        backToMenu();
    });
}

function setupNetworkEvents() {
    conn.on('open', () => {
        sendLobbyStatus();
    });

    conn.on('data', (data) => {
        if (data.type === 'lobby-full') {
            alert("Phòng đã đủ 2 người chơi!");
            backToMenu();
            return;
        }
        handleNetworkMessage(data);
    });

    conn.on('close', () => {
        alert("Đối phương đã thoát kết nối.");
        backToMenu();
    });

    if (conn.open) {
        sendLobbyStatus();
    }
}

function sendLobbyStatus() {
    if (conn && conn.open) {
        conn.send({
            type: 'lobby-sync',
            ready: localPlayerReady,
            hero: gameState.selectedHeroKey
        });
    }
    updateLobbyUI();
}

function toggleReady() {
    localPlayerReady = !localPlayerReady;
    let btn = document.getElementById("readyBtn");
    if (localPlayerReady) {
        btn.innerText = "Hủy Sẵn Sàng";
        btn.style.background = "#e53935";
    } else {
        btn.innerText = "Sẵn Sàng";
        btn.style.background = "#4caf50";
    }
    sendLobbyStatus();

    if (isHost && localPlayerReady && remotePlayerReady) {
        startGameForBoth();
    }
}

function updateLobbyUI() {
    if (isHost) {
        document.getElementById("hostReadyText").innerText = localPlayerReady ? "SẴN SÀNG" : "Chưa sẵn sàng";
        document.getElementById("hostReadyText").style.color = localPlayerReady ? "#4caf50" : "#f44336";
        
        if (conn && conn.open) {
            document.getElementById("clientHeroText").innerText = "Robot R1";
            document.getElementById("clientReadyText").innerText = remotePlayerReady ? "SẴN SÀNG" : "Chưa sẵn sàng";
            document.getElementById("clientReadyText").style.color = remotePlayerReady ? "#4caf50" : "#f44336";
        } else {
            document.getElementById("clientHeroText").innerText = "Đang chờ kết nối...";
            document.getElementById("clientReadyText").innerText = "-";
            document.getElementById("clientReadyText").style.color = "#aaa";
        }
    } else {
        document.getElementById("clientReadyText").innerText = localPlayerReady ? "SẴN SÀNG" : "Chưa sẵn sàng";
        document.getElementById("clientReadyText").style.color = localPlayerReady ? "#4caf50" : "#f44336";

        document.getElementById("hostHeroText").innerText = "Robot R1";
        document.getElementById("hostReadyText").innerText = remotePlayerReady ? "SẴN SÀNG" : "Chưa sẵn sàng";
        document.getElementById("hostReadyText").style.color = remotePlayerReady ? "#4caf50" : "#f44336";
    }
}

function leaveRoom() {
    if (peer) peer.destroy();
    peer = null;
    conn = null;
    backToMenu();
}

function backToMenu() {
    document.getElementById("lobbyScreen").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("hud").style.display = "none";
    document.getElementById("menuScreen").style.display = "flex";
    document.getElementById("cardSelectOverlay").style.display = "none";
    
    document.getElementById("testToolToggle").style.display = "none";
    document.getElementById("testToolPanel").style.display = "none";
}

function startGameForBoth() {
    if (conn && conn.open) {
        conn.send({ type: 'start-match' });
    }
    confirmHeroAndStart();
}

function returnToLobby() {
    document.getElementById("gameOverScreen").style.display = "none";
    document.getElementById("hud").style.display = "none";
    document.getElementById("lobbyScreen").style.display = "flex";

    localPlayerReady = false;
    remotePlayerReady = false;
    let btn = document.getElementById("readyBtn");
    btn.innerText = "Sẵn Sàng";
    btn.style.background = "#4caf50";

    if (conn && conn.open) {
        conn.send({ type: 'lobby-reset' });
    }
    updateLobbyUI();
}

function handleNetworkMessage(data) {
    if (data.type === 'lobby-sync') {
        remotePlayerReady = data.ready;
        updateLobbyUI();
        if (isHost && localPlayerReady && remotePlayerReady) {
            startGameForBoth();
        }
    }
    else if (data.type === 'start-match') {
        confirmHeroAndStart();
    }
    else if (data.type === 'lobby-reset') {
        localPlayerReady = false;
        remotePlayerReady = false;
        let btn = document.getElementById("readyBtn");
        btn.innerText = "Sẵn Sàng";
        btn.style.background = "#4caf50";
        document.getElementById("gameOverScreen").style.display = "none";
        document.getElementById("hud").style.display = "none";
        document.getElementById("lobbyScreen").style.display = "flex";
        updateLobbyUI();
    }
    else if (data.type === 'client-state') {
        if (isHost && gameState.remotePlayer) {
            gameState.remotePlayer.targetX = data.x;
            gameState.remotePlayer.targetY = data.y;
            gameState.remotePlayer.angle = data.angle;
            gameState.remotePlayer.stats.hp = data.hp;
            gameState.remotePlayer.stats.mana = data.mp;
            gameState.remotePlayer.shieldActive = data.shield;
            gameState.remotePlayer.blueBuffTime = data.buffs.blue;
            gameState.remotePlayer.redBuffTime = data.buffs.red;
            gameState.remoteLives = data.lives;

            if (data.stats) {
                gameState.remotePlayer.stats.ad = data.stats.ad;
                gameState.remotePlayer.stats.ap = data.stats.ap;
                gameState.remotePlayer.stats.speed = data.stats.speed;
                gameState.remotePlayer.stats.armor = data.stats.armor;
                gameState.remotePlayer.stats.mr = data.stats.mr;
                gameState.remotePlayer.stats.armorPen = data.stats.armorPen;
                gameState.remotePlayer.stats.magicPen = data.stats.magicPen;
                gameState.remotePlayer.stats.maxHp = data.stats.maxHp;
                gameState.remotePlayer.stats.attackSpeed = data.stats.attackSpeed;

                gameState.remotePlayer.stats.lifesteal = data.stats.lifesteal;
                gameState.remotePlayer.stats.spellVamp = data.stats.spellVamp;
                gameState.remotePlayer.stats.critRate = data.stats.critRate;
                gameState.remotePlayer.stats.critDamage = data.stats.critDamage;
                gameState.remotePlayer.stats.expBonus = data.stats.expBonus;

                gameState.remotePlayer.premiumEye = data.stats.premiumEye;
                gameState.remotePlayer.premiumGuardian = data.stats.premiumGuardian;
                gameState.remotePlayer.premiumGunner = data.stats.premiumGunner;

                gameState.remotePlayer.premiumQuydet = data.stats.premiumQuydet;
                gameState.remotePlayer.premiumThanhquet = data.stats.premiumThanhquet;
                gameState.remotePlayer.premiumErosion = data.stats.premiumErosion;
                gameState.remotePlayer.premiumJackpot = data.stats.premiumJackpot;
            }
        }
    }
    else if (data.type === 'client-cast') {
        if (isHost && gameState.remotePlayer) {
            processClientCast(data.skill, data.x, data.y, data.angle);
        }
    }
    else if (data.type === 'host-sync') {
        if (!isHost) {
            applyHostWorldSync(data);
        }
    }
    else if (data.type === 'trigger-game-over') {
        triggerMatchOver(data.winner === (isHost ? 'host' : 'client'));
    }
}

function getSpawnCoordinates(isLocalHost) {
    if (isLocalHost) {
        return { x: 150, y: 150 }; 
    } else {
        return { x: MAP_WIDTH - 150, y: 150 }; 
    }
}

function getRandomMapPosition(padding = 200) {
    let rx = padding + Math.random() * (MAP_WIDTH - padding * 2);
    let ry = padding + Math.random() * (MAP_HEIGHT - padding * 2);
    return { x: rx, y: ry };
}

function initGame() {
    gameState.gameStartTime = performance.now();
    gameState.localLives = 5;
    gameState.remoteLives = 5;
    localRespawnTimer = 0;

    document.getElementById("displayRoomId").innerText = gameState.roomId || "-";

    if (gameState.mode === 'match') {
        let localSpawn = getSpawnCoordinates(isHost);
        let remoteSpawn = getSpawnCoordinates(!isHost);

        gameState.player = new RobotR1(localSpawn.x, localSpawn.y);
        gameState.player.color = isHost ? "#1e88e5" : "#e53935";

        gameState.remotePlayer = new RobotR1(remoteSpawn.x, remoteSpawn.y);
        gameState.remotePlayer.color = isHost ? "#e53935" : "#1e88e5";

        gameState.entities = [gameState.player, gameState.remotePlayer];
    } else {
        gameState.player = new RobotR1(MAP_WIDTH / 2, MAP_HEIGHT / 2);
        gameState.player.color = "#37474f";
        gameState.entities = [gameState.player];
        gameState.remotePlayer = null;
    }

    initPlayerXpSystem(gameState.player);
    if (gameState.remotePlayer) {
        initPlayerXpSystem(gameState.remotePlayer);
    }

    gameState.projectiles = [];
    gameState.explosions = []; 
    gameState.damageTexts = [];
    gameState.respawnTimers = [];

    for (let i = 0; i < 2; i++) {
        let posBlue = getRandomMapPosition();
        spawnMonster('blue', posBlue.x, posBlue.y);

        let posRed = getRandomMapPosition();
        spawnMonster('red', posRed.x, posRed.y);
    }

    for (let i = 0; i < 6; i++) {
        let posMonkey = getRandomMapPosition();
        spawnMonster('monkey', posMonkey.x, posMonkey.y);
    }

    for (let i = 0; i < 2; i++) {
        let posGolem = getRandomMapPosition();
        spawnMonster('golem', posGolem.x, posGolem.y);
    }

    if (gameState.mode === 'test') {
        resetDummy();
    }

    document.getElementById("cardSelectOverlay").style.display = "none";

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function initPlayerXpSystem(entity) {
    entity.level = 1;
    entity.xp = 0;
    entity.xpNeeded = 50;
    entity.pendingLevelUps = 0;
    entity.upgradesChosenCount = 0;
    entity.currentUpgradeChoices = null; 
    entity.attackSpeedBonus = 0;
    entity.premiumGuardian = false;
    entity.premiumEye = false;
    entity.premiumGunner = false;

    entity.premiumQuydet = false;
    entity.premiumThanhquet = false;
    entity.premiumErosion = false;
    entity.premiumJackpot = false;
    entity.grievousWoundsTimer = 0;
    entity.erosionTickTimer = 0;
    entity.erosionAttacker = null;
    entity.accumulationPoints = 0;
    entity.accumulationTickers = [];
    entity.jackpotTimer = 0;
    entity.chosenPremiumUpgrades = new Set();
}

function spawnMonster(type, x, y) {
    let monster = new Monster(x, y, type);
    gameState.entities.push(monster);
}

function toggleTestToolPanel() {
    let panel = document.getElementById("testToolPanel");
    if (panel.style.display === "none" || panel.style.display === "") {
        panel.style.display = "block";
    } else {
        panel.style.display = "none";
    }
}

function addOneLevel() {
    let p = gameState.player;
    if (p) {
        let neededXp = p.xpNeeded - p.xp;
        addXp(p, neededXp);
    }
}

function updateDummyResist() {
    let dummyArmor = parseInt(document.getElementById("dummyArmorInput").value) || 0;
    let dummyMr = parseInt(document.getElementById("dummyMrInput").value) || 0;
    let dummy = gameState.entities.find(e => e.isDummy);
    if (dummy) {
        dummy.stats.armor = dummyArmor;
        dummy.stats.mr = dummyMr;
    }
}

function resetDummy() {
    gameState.entities = gameState.entities.filter(e => !e.isDummy);
    
    let dummy = new Entity(MAP_WIDTH / 2 + 250, MAP_HEIGHT / 2, 25, "#e65100", true);
    dummy.stats.maxHp = 5000000; 
    dummy.stats.hp = dummy.stats.maxHp;
    dummy.stats.hpRegen = dummy.stats.maxHp * 0.05; 
    
    let dummyArmor = parseInt(document.getElementById("dummyArmorInput").value) || 100;
    let dummyMr = parseInt(document.getElementById("dummyMrInput").value) || 100;
    dummy.stats.armor = dummyArmor;
    dummy.stats.mr = dummyMr;

    gameState.entities.push(dummy);
}

window.addEventListener('keydown', (e) => {
    let key = e.key;

    if (key === ' ' || key === 'Spacebar') {
        e.preventDefault();
    }

    gameState.keys[key] = true;

    if (localRespawnTimer <= 0) {
        if ((key === ' ' || key === 'Spacebar') && gameState.activeSkillAiming) {
            let currentAimingSkill = gameState.activeSkillAiming;
            gameState.blockedSkills[currentAimingSkill] = true; 
            gameState.activeSkillAiming = null;                
            return;
        }

        if (key === '1' && !gameState.blockedSkills['1'] && !e.repeat) {
            gameState.activeSkillAiming = '1';
        }
        if (key === '2' && !gameState.blockedSkills['2'] && !e.repeat) {
            gameState.activeSkillAiming = '2';
        }
        if (key === '3' && !gameState.blockedSkills['3'] && !e.repeat) {
            gameState.activeSkillAiming = '3';
        }
    }
});

window.addEventListener('keyup', (e) => {
    let key = e.key;
    gameState.keys[key] = false;

    if (localRespawnTimer <= 0) {
        if (key === '1') {
            if (gameState.activeSkillAiming === '1' && !gameState.blockedSkills['1']) {
                castSkill1();
            }
            gameState.activeSkillAiming = null;
            gameState.blockedSkills['1'] = false; 
        }
        
        if (key === '2') {
            if (gameState.activeSkillAiming === '2' && !gameState.blockedSkills['2']) {
                castSkill2();
            }
            gameState.activeSkillAiming = null;
            gameState.blockedSkills['2'] = false; 
        }
        
        if (key === '3') {
            if (gameState.activeSkillAiming === '3' && !gameState.blockedSkills['3']) {
                castSkill3();
            }
            gameState.activeSkillAiming = null;
            gameState.blockedSkills['3'] = false; 
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mouse.x = e.clientX - rect.left;
    gameState.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 && localRespawnTimer <= 0) {
        castBasicAttack();
    }
});

function castBasicAttack() {
    let p = gameState.player;
    if (!p || p.attackCooldown > 0) return; 
    
    let angle = Math.atan2(gameState.mouse.worldY - p.y, gameState.mouse.worldX - p.x);
    let dist = Math.hypot(gameState.mouse.worldX - p.x, gameState.mouse.worldY - p.y);
    
    if (dist > 320) return; 

    p.angle = angle;
    p.attackCooldown = p.stats.attackSpeed; 

    if (gameState.mode === 'match' && !isHost) {
        conn.send({ type: 'client-cast', skill: 'aa', x: p.x, y: p.y, angle: angle });
    } else {
        createLocalBasicAttack(p, p.x, p.y, angle);
    }
}

function createLocalBasicAttack(owner, x, y, angle) {
    gameState.projectiles.push(new Projectile({
        owner: owner,
        x: x,
        y: y,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        radius: 6,
        speed: 8,
        type: 'aa',
        damage: owner ? owner.stats.ad * 0.75 : 10, 
        dmgType: 'physical',
        color: '#ffeb3b',
        range: 320
    }));
}

function castSkill1() {
    let p = gameState.player;
    if (!p || p.cooldowns['1'] > 0) return;
    if (p.stats.mana < p.manaCosts['1']) return;

    let angle = Math.atan2(gameState.mouse.worldY - p.y, gameState.mouse.worldX - p.x);
    p.angle = angle;

    p.stats.mana -= p.manaCosts['1'];

    let actualCdr = Math.min(0.50, p.stats.cdr + (p.blueBuffTime > 0 ? 0.20 : 0));
    p.cooldowns['1'] = p.maxCooldowns['1'] * (1 - actualCdr); 

    if (gameState.mode === 'match' && !isHost) {
        conn.send({ type: 'client-cast', skill: '1', x: p.x, y: p.y, angle: angle });
    } else {
        createLocalSkill1(p, p.x, p.y, angle);
    }
}

function createLocalSkill1(owner, x, y, angle) {
    gameState.projectiles.push(new Projectile({
        owner: owner,
        x: x,
        y: y,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        radius: 18,
        speed: 3, 
        type: '1',
        damage: 0, 
        color: '#00e5ff',
        range: 500
    }));
}

function castSkill2() {
    let p = gameState.player;
    if (!p || p.cooldowns['2'] > 0) return;
    if (p.stats.mana < p.manaCosts['2']) return;

    p.stats.mana -= p.manaCosts['2'];

    p.shieldActive = true;
    p.shieldTime = 1.0; 

    let actualCdr = Math.min(0.50, p.stats.cdr + (p.blueBuffTime > 0 ? 0.20 : 0));
    p.cooldowns['2'] = p.maxCooldowns['2'] * (1 - actualCdr); 

    if (gameState.mode === 'match' && !isHost) {
        conn.send({ type: 'client-cast', skill: '2' });
    }
}

function castSkill3() {
    let p = gameState.player;
    if (!p || p.cooldowns['3'] > 0) return;
    if (p.stats.mana < p.manaCosts['3']) return;

    let angle = Math.atan2(gameState.mouse.worldY - p.y, gameState.mouse.worldX - p.x);
    p.angle = angle;

    p.stats.mana -= p.manaCosts['3'];

    let actualCdr = Math.min(0.50, p.stats.cdr + (p.blueBuffTime > 0 ? 0.20 : 0));
    p.cooldowns['3'] = p.maxCooldowns['3'] * (1 - actualCdr); 

    if (gameState.mode === 'match' && !isHost) {
        conn.send({ type: 'client-cast', skill: '3', x: p.x, y: p.y, angle: angle });
    } else {
        createLocalSkill3(p, p.x, p.y, angle);
    }
}

function createLocalSkill3(owner, x, y, angle) {
    gameState.projectiles.push(new Projectile({
        owner: owner,
        x: x,
        y: y,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        radius: 35,
        speed: 12, 
        type: '3',
        damage: owner ? (owner.stats.ad * 1.0) + (owner.stats.ap * 1.5) : 30, 
        dmgType: 'magic',
        color: '#ff5722',
        range: 5000 
    }));
}

function processClientCast(skill, x, y, angle) {
    let rc = gameState.remotePlayer;
    if (!rc) return;
    if (skill === 'aa') {
        createLocalBasicAttack(rc, x, y, angle);
    } else if (skill === '1') {
        createLocalSkill1(rc, x, y, angle);
    } else if (skill === '2') {
        rc.shieldActive = true;
        rc.shieldTime = 1.0;
    } else if (skill === '3') {
        createLocalSkill3(rc, x, y, angle);
    }
}

function getXpNeeded(level) {
    let xp = 50;
    for (let i = 2; i <= level; i++) {
        xp = Math.round(xp * 1.3 + 10);
    }
    return xp;
}

function addXp(entity, amount) {
    if (!entity) return;
    if (entity.xp === undefined) initPlayerXpSystem(entity);

    entity.xp += amount;
    while (entity.xp >= entity.xpNeeded) {
        entity.xp -= entity.xpNeeded;
        entity.level++;
        entity.xpNeeded = getXpNeeded(entity.level);
        entity.pendingLevelUps++;

        gameState.damageTexts.push({
            x: entity.x,
            y: entity.y - entity.radius - 30,
            text: "LÊN CẤP! (LV " + entity.level + ")",
            color: "#ffeb3b",
            life: 2.0
        });
    }
}

function handleLevelCircleClick() {
    let p = gameState.player;
    if (p && p.pendingLevelUps > 0) {
        showUpgradeOptions();
    }
}

function generateUpgradeChoices() {
    let p = gameState.player;
    if (!p) return null;

    let upgradeLevel = (p.upgradesChosenCount || 0) + 1;
    let isPremiumMilestone = (upgradeLevel % 5 === 0);
    let chainIndex = Math.floor((upgradeLevel - 1) / 5);

    let chosenCards = [];
    if (isPremiumMilestone) {
        let premiumPool = [
            {
                id: 'guardian',
                type: 'premium',
                title: 'Hộ vệ phòng thân',
                desc: 'Giảm 17.5% mọi sát thương nhận vào, hồi 1.5% HP tối đa/giây. Đòn đánh thường trúng đích hồi 0.5% HP tối đa & hạ quái cộng +3 HP tối đa vĩnh viễn.'
            },
            {
                id: 'eye',
                type: 'premium',
                title: 'Con mắt thủy triều',
                desc: 'Tăng 110% tổng tốc độ chạy (bao gồm cả sau này) & hiện mũi tên nhỏ định vị hướng đối thủ.'
            },
            {
                id: 'gunner',
                type: 'premium',
                title: 'Pháo thủ',
                desc: 'Giảm 75% tốc chạy hiện có (không giảm lượng cộng sau này). Tăng +100% Tốc đánh, +50% Công vật lý, +25% Tỉ lệ chí mạng & +25% Sát thương chí mạng.'
            },
            {
                id: 'quydet',
                type: 'premium',
                title: 'Quỷ quyết',
                desc: 'Tắt hồi phục tự nhiên. Tăng +40% Hút máu, thêm (Hồi HP cơ bản trước đó * 2)% Hút máu. Nâng hồi phục HP sau này tính vào hút máu với hệ số x1.1.'
            },
            {
                id: 'thanhquet',
                type: 'premium',
                title: 'Thánh quyết',
                desc: 'Tắt hồi phục tự nhiên. Tăng +80% Hút máu phép, thêm (Hồi HP cơ bản trước đó * 3)% Hút máu phép. Nâng hồi phục HP sau này tính vào hút máu phép với hệ số x1.65.'
            },
            {
                id: 'gapmon',
                type: 'premium',
                title: 'Gặp mòn',
                desc: 'Gây sát thương khiến địch bị giảm 45% hồi phục trong 3.5s. Mỗi giây địch chịu thêm (2.5% AD + 2.5% AP + 1.5% HP của bản thân) sát thương phép.'
            },
            {
                id: 'nutdodovach',
                type: 'premium',
                title: 'Nứt đố đổ vách',
                desc: 'Mỗi giây tự động nhận lượng EXP bằng 1.75% EXP cần để lên cấp tiếp theo.'
            }
        ];

        if (!p.chosenPremiumUpgrades) {
            p.chosenPremiumUpgrades = new Set();
        }
        let availablePremium = premiumPool.filter(card => !p.chosenPremiumUpgrades.has(card.id));

        if (availablePremium.length === 0) {
            isPremiumMilestone = false;
        } else {
            chosenCards = availablePremium.sort(() => 0.5 - Math.random()).slice(0, 3);
        }
    }
    
    if (!isPremiumMilestone) {
        let statPool = [
            { id: 'muscle', title: 'Cơ bắp', getDesc: (ci) => `+${5 + ci * 3} Công vật lý` },
            { id: 'magic', title: 'Phép thuật', getDesc: (ci) => `+${10 + ci * 5} Công phép` },
            { id: 'build', title: 'Thể hình', getDesc: (ci) => `+${25 + ci * 10} HP tối đa` },
            { id: 'shoes', title: 'Giày', getDesc: (ci) => `+${(5 + ci * 1.5).toFixed(1)} Tốc chạy hiển thị` },
            { id: 'rapidfire', title: 'Liên thành', getDesc: (ci) => `+${(7 + ci * 2.5).toFixed(1)}% Tốc đánh` },
            { id: 'hyperspeed', title: 'Siêu tốc', getDesc: (ci) => `+${(2.5 + ci * 2).toFixed(1)} Tốc chạy & +${(3.5 + ci * 2).toFixed(1)}% Tốc đánh` },
            { id: 'armor', title: 'Cơ giới', getDesc: (ci) => `+${10 + ci * 3} Giáp` },
            { id: 'mr', title: 'Hộ vệ', getDesc: (ci) => `+${(15 + ci * 4.5).toFixed(1)} Kháng phép` },
            { id: 'armorpen', title: 'Kim châm', getDesc: (ci) => `+${10 + ci * 3} Xuyên giáp` },
            { id: 'magicpen', title: 'Phóng năng', getDesc: (ci) => `+${(15 + ci * 4.5).toFixed(1)} Xuyên kháng phép` },
            { id: 'doiquy', title: 'Dơi quỷ', getDesc: (ci) => `+${(7 + ci * 2.5).toFixed(1)}% Hút máu vật lý` },
            { id: 'anhon', title: 'Ăn hồn', getDesc: (ci) => `+${(14 + ci * 5).toFixed(1)}% Hút máu phép` },
            { id: 'tuluc', title: 'Tụ lực', getDesc: (ci) => `+5% Giảm hồi chiêu` },
            { id: 'tuchua', title: 'Tự chữa', getDesc: (ci) => `+${(2 + ci * 0.75).toFixed(2)} Hồi HP/s` },
            { id: 'bomluc', title: 'Bơm lực', getDesc: (ci) => `+${(2.5 + ci * 0.9).toFixed(2)} Hồi Mana/s` },
            { id: 'thosan', title: 'Thợ săn', getDesc: (ci) => `+${(10 + ci * 2.5).toFixed(1)}% EXP quái rừng` },
            { id: 'tichtu', title: 'Tích tụ', getDesc: (ci) => `Tích lũy nhận 250 EXP mỗi khi đủ 250 điểm tích tụ (Tốc độ nạp nhanh hơn)` },
            // Đã bổ sung 3 thẻ cơ bản mới theo yêu cầu:
            { id: 'kheoleo', title: 'Khéo léo', getDesc: (ci) => `+${(5 + ci * 1.4).toFixed(2)}% Tỉ lệ chí mạng` },
            { id: 'khocluc', title: 'Khốc lực', getDesc: (ci) => `+${(4.25 + ci * 1.33).toFixed(2)}% Sát thương chí mạng` },
            { id: 'chiluc', title: 'Chí lực', getDesc: (ci) => `+${(3 + ci * 0.65).toFixed(2)}% Tỉ lệ chí mạng & +${(2.31 + ci * 0.6).toFixed(2)}% Sát thương chí mạng` }
        ];

        let shuffled = statPool.sort(() => 0.5 - Math.random());
        for (let i = 0; i < 3; i++) {
            let card = shuffled[i];
            chosenCards.push({
                id: card.id,
                type: 'stat',
                title: card.title,
                desc: card.getDesc(chainIndex)
            });
        }
    }
    return chosenCards;
}

function showUpgradeOptions() {
    let p = gameState.player;
    if (!p) return;

    if (!p.currentUpgradeChoices || p.currentUpgradeChoices.length === 0) {
        p.currentUpgradeChoices = generateUpgradeChoices();
    }

    let container = document.getElementById("cardListContainer");
    container.innerHTML = "";

    p.currentUpgradeChoices.forEach(card => {
        let cardEl = document.createElement("div");
        cardEl.style.background = card.type === 'premium' ? "#3a2512" : "#25252b";
        cardEl.style.border = "1.5px solid #444";
        cardEl.style.borderRadius = "4px";
        cardEl.style.padding = "10px";
        cardEl.style.cursor = "pointer";
        cardEl.style.transition = "0.2s";
        cardEl.style.position = "relative";

        cardEl.onmouseover = () => { cardEl.style.borderColor = '#ff9800'; };
        cardEl.onmouseout = () => { cardEl.style.borderColor = '#444'; };

        let premiumHeader = "";
        if (card.type === 'premium') {
            premiumHeader = `
                <div style="font-size: 10px; color: #ffeb3b; font-weight: bold; margin-bottom: 2px;">
                    ▲▲ THẺ CAO CẤP ▲▲
                </div>
            `;
        }

        cardEl.innerHTML = `
            ${premiumHeader}
            <div style="font-weight: bold; color: ${card.type === 'premium' ? '#ff9800' : '#00e5ff'}; font-size: 13px; margin-bottom: 3px;">
                ${card.title}
            </div>
            <div style="font-size: 11px; color: #ccc; line-height: 1.4;">
                ${card.desc}
            </div>
        `;

        cardEl.onclick = () => {
            applyUpgrade(card);
        };

        container.appendChild(cardEl);
    });

    document.getElementById("cardSelectOverlay").style.display = "block";
}

function applyUpgrade(upgrade) {
    let p = gameState.player;
    if (!p) return;

    let upgradeLevel = (p.upgradesChosenCount || 0) + 1;
    let chainIndex = Math.floor((upgradeLevel - 1) / 5);

    if (upgrade.type === 'stat') {
        if (upgrade.id === 'muscle') {
            p.stats.ad += 5 + chainIndex * 3;
        } else if (upgrade.id === 'magic') {
            p.stats.ap += 10 + chainIndex * 5;
        } else if (upgrade.id === 'build') {
            let hpAdded = 25 + chainIndex * 10;
            p.stats.maxHp += hpAdded;
            p.stats.hp += hpAdded; 
        } else if (upgrade.id === 'shoes') {
            let speedAdded = 5 + chainIndex * 1.5;
            p.stats.speed += speedAdded * (4.2 / 100); 
        } else if (upgrade.id === 'rapidfire') {
            let bonus = 7 + chainIndex * 2.5;
            p.attackSpeedBonus = (p.attackSpeedBonus || 0) + (bonus / 100);
            recalculateAttackSpeed(p);
        } else if (upgrade.id === 'hyperspeed') {
            let speedAdded = 2.5 + chainIndex * 2;
            let asAdded = 3.5 + chainIndex * 2;
            p.stats.speed += speedAdded * (4.2 / 100);
            p.attackSpeedBonus = (p.attackSpeedBonus || 0) + (asAdded / 100);
            recalculateAttackSpeed(p);
        } else if (upgrade.id === 'armor') {
            p.stats.armor += 10 + chainIndex * 3;
        } else if (upgrade.id === 'mr') {
            p.stats.mr += 15 + chainIndex * 4.5;
        } else if (upgrade.id === 'armorpen') {
            p.stats.armorPen += 10 + chainIndex * 3;
        } else if (upgrade.id === 'magicpen') {
            p.stats.magicPen += 15 + chainIndex * 4.5;
        }
        else if (upgrade.id === 'doiquy') {
            p.stats.lifesteal += 7 + chainIndex * 2.5;
        } else if (upgrade.id === 'anhon') {
            p.stats.spellVamp += 14 + chainIndex * 5;
        } else if (upgrade.id === 'tuluc') {
            p.stats.cdr += 0.05; 
        } else if (upgrade.id === 'tuchua') {
            let addedRegen = 2 + chainIndex * 0.75;
            // Áp dụng cơ chế chuyển hồi phục sang hút máu khi có Quỷ quyết / Thánh quyết
            if (p.premiumQuydet || p.premiumThanhquet) {
                if (p.premiumQuydet) {
                    p.stats.lifesteal += addedRegen * 1.1;
                }
                if (p.premiumThanhquet) {
                    p.stats.spellVamp += addedRegen * 1.65;
                }
            } else {
                p.stats.hpRegen += addedRegen;
            }
        } else if (upgrade.id === 'bomluc') {
            p.stats.manaRegen += 2.5 + chainIndex * 0.9;
        } else if (upgrade.id === 'thosan') {
            p.stats.expBonus += 10 + chainIndex * 2.5;
        } else if (upgrade.id === 'tichtu') {
            if (!p.accumulationTickers) p.accumulationTickers = [];
            p.accumulationTickers.push({
                timer: 0,
                interval: Math.max(0.1, 1.0 - chainIndex * 0.15) 
            });
        }
        // Áp dụng chỉ số từ 3 thẻ cơ bản mới
        else if (upgrade.id === 'kheoleo') {
            p.stats.critRate += 5 + chainIndex * 1.4;
        } else if (upgrade.id === 'khocluc') {
            p.stats.critDamage += 4.25 + chainIndex * 1.33;
        } else if (upgrade.id === 'chiluc') {
            p.stats.critRate += 3 + chainIndex * 0.65;
            p.stats.critDamage += 2.31 + chainIndex * 0.6;
        }
    } else if (upgrade.type === 'premium') {
        p.chosenPremiumUpgrades.add(upgrade.id);

        if (upgrade.id === 'guardian') {
            p.premiumGuardian = true;
        } else if (upgrade.id === 'eye') {
            p.premiumEye = true; // Sẽ tự nhân 110% tốc chạy tại getSpeed()
        } else if (upgrade.id === 'gunner') {
            p.premiumGunner = true;
            let penalty = p.stats.speed * 0.75;
            p.stats.speed -= penalty; // Giảm 75% tốc chạy hiện có vĩnh viễn (các nâng cấp sau này sẽ cộng thêm bình thường)
            
            p.attackSpeedBonus = (p.attackSpeedBonus || 0) + 1.0; // +100% tốc đánh
            recalculateAttackSpeed(p);
            
            p.stats.ad *= 1.50; // +50% công vật lý
            p.stats.critRate += 25; // +25% tỉ lệ chí mạng
            p.stats.critDamage += 25; // +25% sát thương chí mạng
        }
        else if (upgrade.id === 'quydet') {
            let preRegen = p.stats.hpRegen;
            p.stats.hpRegen = 0;
            p.stats.lifesteal += 40 + (preRegen * 2);
            p.premiumQuydet = true;
        } else if (upgrade.id === 'thanhquet') {
            let preRegen = p.stats.hpRegen;
            p.stats.hpRegen = 0;
            p.stats.spellVamp += 80 + (preRegen * 3);
            p.premiumThanhquet = true;
        } else if (upgrade.id === 'gapmon') {
            p.premiumErosion = true;
        } else if (upgrade.id === 'nutdodovach') {
            p.premiumJackpot = true;
        }
    }

    p.upgradesChosenCount = upgradeLevel;
    p.pendingLevelUps--;
    p.currentUpgradeChoices = null; 

    document.getElementById("cardSelectOverlay").style.display = "none";

    if (p.pendingLevelUps > 0) {
        showUpgradeOptions();
    }
}

function recalculateAttackSpeed(entity) {
    let baseCoolDown = 0.65;
    let bonus = entity.attackSpeedBonus || 0;
    entity.stats.attackSpeed = baseCoolDown / (1 + bonus);
}

let lastTime = 0;
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (dt > 0.1) dt = 0.1;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

function isEntityVisible(entity) {
    if (entity === gameState.player) return true;
    let dist = Math.hypot(entity.x - gameState.player.x, entity.y - gameState.player.y);
    return dist <= SIGHT_RADIUS;
}

function update(dt) {
    let p = gameState.player;
    if (!p) return;

    if (localRespawnTimer > 0) {
        localRespawnTimer -= dt;
        if (localRespawnTimer <= 0) {
            performLocalRespawn();
        }
    }

    let moveX = 0;
    let moveY = 0;
    if (localRespawnTimer <= 0) {
        if (gameState.keys['w'] || gameState.keys['arrowup']) moveY -= 1;
        if (gameState.keys['s'] || gameState.keys['arrowdown']) moveY += 1;
        if (gameState.keys['a'] || gameState.keys['arrowleft']) moveX -= 1;
        if (gameState.keys['d'] || gameState.keys['arrowright']) moveX += 1;
    }

    if (moveX !== 0 || moveY !== 0) {
        let len = Math.hypot(moveX, moveY);
        let currentSpeed = p.getSpeed();
        p.x += (moveX / len) * currentSpeed;
        p.y += (moveY / len) * currentSpeed;

        p.x = Math.max(p.radius, Math.min(MAP_WIDTH - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(MAP_HEIGHT - p.radius, p.y));
    }

    gameState.mouse.worldX = gameState.mouse.x + gameState.camera.x;
    gameState.mouse.worldY = gameState.mouse.y + gameState.camera.y;

    if (gameState.activeSkillAiming && localRespawnTimer <= 0) {
        p.angle = Math.atan2(gameState.mouse.worldY - p.y, gameState.mouse.worldX - p.x);
    }

    gameState.camera.x = p.x - canvas.width / 2;
    gameState.camera.y = p.y - canvas.height / 2;

    gameState.camera.x = Math.max(0, Math.min(MAP_WIDTH - canvas.width, gameState.camera.x));
    gameState.camera.y = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, gameState.camera.y));

    if (gameState.mode !== 'match' || isHost) {
        for (let i = gameState.respawnTimers.length - 1; i >= 0; i--) {
            let timer = gameState.respawnTimers[i];
            timer.respawnIn -= dt;
            if (timer.respawnIn <= 0) {
                let pos = getRandomMapPosition();
                spawnMonster(timer.type, pos.x, pos.y);
                gameState.respawnTimers.splice(i, 1);
            }
        }
    }

    gameState.entities.forEach(entity => entity.update(dt));

    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        let proj = gameState.projectiles[i];
        proj.update(dt);
    }

    if (gameState.mode !== 'match' || isHost) {
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            let proj = gameState.projectiles[i];
            let hit = false;
            let finalAngle = Math.atan2(proj.vy, proj.vx);

            for (let j = 0; j < gameState.entities.length; j++) {
                let entity = gameState.entities[j];
                if (entity !== proj.owner) {
                    let dist = Math.hypot(entity.x - proj.x, entity.y - proj.y);
                    if (dist <= entity.radius + proj.radius) {
                        if (proj.type !== '1') {
                            
                            let finalDmg = proj.damage;
                            let isCrit = false;
                            if (proj.type === 'aa' && proj.owner) {
                                let roll = Math.random() * 100;
                                if (roll < proj.owner.stats.critRate) {
                                    isCrit = true;
                                    let critBonus = proj.owner.stats.critDamage; 
                                    let minCrit = finalDmg * 2;
                                    let maxCrit = finalDmg * 2 + finalDmg * (critBonus / 100) + critBonus;
                                    finalDmg = minCrit + Math.random() * (maxCrit - minCrit);
                                }
                            }

                            let actualDmgDealt = entity.takeDamage(finalDmg, proj.dmgType, proj.owner, isCrit);
                            hit = true;

                            if (proj.owner && proj.owner.premiumErosion) {
                                entity.grievousWoundsTimer = 3.5;
                                entity.erosionAttacker = proj.owner;
                                entity.erosionTickTimer = 0;
                            }

                            if (proj.owner && actualDmgDealt > 0) {
                                let healValue = 0;
                                if (proj.type === 'aa' && proj.dmgType === 'physical') {
                                    healValue += actualDmgDealt * (proj.owner.stats.lifesteal / 100);
                                }
                                if (proj.dmgType === 'magic') {
                                    healValue += actualDmgDealt * (proj.owner.stats.spellVamp / 100);
                                }
                                if (healValue > 0) {
                                    proj.owner.heal(healValue);
                                }
                            }

                            // Guardian: đòn đánh thường trúng đích hồi 0.5% HP tối đa
                            if (proj.type === 'aa' && proj.owner && proj.owner.premiumGuardian) {
                                proj.owner.heal(proj.owner.stats.maxHp * 0.005);
                            }

                            if (proj.type === 'aa' && proj.owner && proj.owner.redBuffTime > 0) {
                                entity.applyRedBurn(proj.owner);
                            }

                            if (proj.type === '3') {
                                createExplosion(entity, finalAngle);
                            }
                            break;
                        }
                    }
                }
            }

            if (proj.isRemoved || hit) {
                gameState.projectiles.splice(i, 1);
            }
        }

        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            let entity = gameState.entities[i];
            if (entity.stats.hp <= 0 && !entity.isDummy) {
                if (entity instanceof Monster) {
                    let killer = (gameState.player && Math.hypot(gameState.player.x - entity.x, gameState.player.y - entity.y) < 600) ? gameState.player : gameState.remotePlayer;
                    if (killer) {
                        killer.heal(killer.stats.maxHp * 0.05);
                        
                        // Guardian: Diệt quái nhận +3 HP tối đa vĩnh viễn
                        if (killer.premiumGuardian) {
                            killer.stats.maxHp += 3;
                            killer.stats.hp += 3;
                        }

                        if (entity.monsterType === 'blue') {
                            killer.blueBuffTime = 60.0;
                        } else if (entity.monsterType === 'red') {
                            killer.redBuffTime = 60.0;
                        }

                        let elapsedMinutes = (performance.now() - gameState.gameStartTime) / 60000;
                        let xpReward = 0;
                        if (entity.monsterType === 'blue' || entity.monsterType === 'red') {
                            xpReward = 90 + Math.floor(10 * elapsedMinutes); 
                        } else if (entity.monsterType === 'monkey') {
                            xpReward = 60 + Math.floor(12 * elapsedMinutes); 
                        } else if (entity.monsterType === 'golem') {
                            xpReward = 75 + Math.floor(11 * elapsedMinutes); 
                        } else if (entity.monsterType === 'mini_golem') {
                            xpReward = 25 + Math.floor(5 * elapsedMinutes);  
                        }

                        let xpBonusMultiplier = 1.0 + (killer.stats.expBonus / 100);
                        addXp(killer, Math.round(xpReward * xpBonusMultiplier));
                    }

                    if (entity.monsterType === 'golem') {
                        for (let k = 0; k < 5; k++) {
                            let offsetAngle = (Math.PI * 2 / 5) * k;
                            let mx = entity.x + Math.cos(offsetAngle) * 40;
                            let my = entity.y + Math.sin(offsetAngle) * 40;

                            mx = Math.max(30, Math.min(MAP_WIDTH - 30, mx));
                            my = Math.max(30, Math.min(MAP_HEIGHT - 30, my));

                            let mini = new Monster(mx, my, 'mini_golem', {
                                maxHp: entity.stats.maxHp,
                                ad: entity.stats.ad,
                                armor: entity.stats.armor,
                                speed: entity.stats.speed
                            });
                            if (killer && killer.stats.hp > 0) {
                                mini.state = 'chasing';
                            }
                            gameState.entities.push(mini);
                        }
                    }

                    if (entity.monsterType !== 'mini_golem') {
                        let respawnTime = 90;
                        if (entity.monsterType === 'monkey') respawnTime = 35;
                        else if (entity.monsterType === 'golem') respawnTime = 90;

                        gameState.respawnTimers.push({
                            type: entity.monsterType,
                            respawnIn: respawnTime
                        });
                    }

                    gameState.entities.splice(i, 1);
                }
            }
        }
    }

    if (p.stats.hp <= 0 && localRespawnTimer <= 0) {
        gameState.localLives--;
        if (gameState.localLives <= 0) {
            if (gameState.mode === 'match') {
                conn.send({ type: 'trigger-game-over', winner: isHost ? 'client' : 'host' });
                triggerMatchOver(false);
            } else {
                alert("Kết thúc thử nghiệm!");
                backToMenu();
            }
        } else {
            localRespawnTimer = 5.0; 
            p.stats.hp = 0;
        }
    }

    if (gameState.mode === 'match' && conn && conn.open) {
        networkSendTimer += dt;
        if (networkSendTimer >= 0.04) { 
            networkSendTimer = 0;
            if (isHost) {
                sendHostWorldSync();
            } else {
                sendClientState();
            }
        }
    }

    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        let exp = gameState.explosions[i];
        exp.frameTimer += 1; 
        if (exp.frameTimer > 6) {
            gameState.explosions.splice(i, 1);
        }
    }

    for (let i = gameState.damageTexts.length - 1; i >= 0; i--) {
        let text = gameState.damageTexts[i];
        text.y -= 30 * dt; 
        text.life -= dt;
        if (text.life <= 0) {
            gameState.damageTexts.splice(i, 1);
        }
    }

    updateHUD();
}

function performLocalRespawn() {
    let spawn = getSpawnCoordinates(isHost);
    gameState.player.x = spawn.x;
    gameState.player.y = spawn.y;
    gameState.player.stats.hp = gameState.player.stats.maxHp;
    gameState.player.stats.mana = gameState.player.stats.maxMana;
    gameState.player.shieldActive = false;
    gameState.player.blueBuffTime = 0;
    gameState.player.redBuffTime = 0;
    gameState.player.grievousWoundsTimer = 0;
}

function sendClientState() {
    conn.send({
        type: 'client-state',
        x: gameState.player.x,
        y: gameState.player.y,
        angle: gameState.player.angle,
        hp: gameState.player.stats.hp,
        mp: gameState.player.stats.mana,
        shield: gameState.player.shieldActive,
        buffs: { blue: gameState.player.blueBuffTime, red: gameState.player.redBuffTime },
        lives: gameState.localLives,
        stats: {
            ad: gameState.player.stats.ad,
            ap: gameState.player.stats.ap,
            speed: gameState.player.stats.speed,
            armor: gameState.player.stats.armor,
            mr: gameState.player.stats.mr,
            armorPen: gameState.player.stats.armorPen,
            magicPen: gameState.player.stats.magicPen,
            maxHp: gameState.player.stats.maxHp,
            attackSpeed: gameState.player.stats.attackSpeed,

            lifesteal: gameState.player.stats.lifesteal,
            spellVamp: gameState.player.stats.spellVamp,
            critRate: gameState.player.stats.critRate,
            critDamage: gameState.player.stats.critDamage,
            expBonus: gameState.player.stats.expBonus,

            premiumEye: gameState.player.premiumEye,
            premiumGuardian: gameState.player.premiumGuardian,
            premiumGunner: gameState.player.premiumGunner,

            premiumQuydet: gameState.player.premiumQuydet,
            premiumThanhquet: gameState.player.premiumThanhquet,
            premiumErosion: gameState.player.premiumErosion,
            premiumJackpot: gameState.player.premiumJackpot
        }
    });
}

function sendHostWorldSync() {
    let monstersSync = gameState.entities.filter(e => e instanceof Monster).map(m => ({
        id: m.id,
        type: m.monsterType,
        x: m.x,
        y: m.y,
        angle: m.angle,
        hp: m.stats.hp,
        maxHp: m.stats.maxHp,
        state: m.state
    }));

    let projSync = gameState.projectiles.map(p => ({
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        speed: p.speed,
        radius: p.radius,
        type: p.type,
        color: p.color,
        opacity: p.opacity,
        isExpiring: p.isExpiring,
        activeZapTargets: p.activeZapTargets ? p.activeZapTargets.map(t => ({x: t.x, y: t.y})) : []
    }));

    conn.send({
        type: 'host-sync',
        hostX: gameState.player.x,
        hostY: gameState.player.y,
        hostAngle: gameState.player.angle,
        hostHp: gameState.player.stats.hp,
        hostMp: gameState.player.stats.mana,
        hostShield: gameState.player.shieldActive,
        hostBuffs: { blue: gameState.player.blueBuffTime, red: gameState.player.redBuffTime },
        hostLives: gameState.localLives,
        
        hostXp: gameState.player.xp,
        hostXpNeeded: gameState.player.xpNeeded,
        hostLevel: gameState.player.level,

        clientHp: gameState.remotePlayer ? gameState.remotePlayer.stats.hp : 0,
        clientLives: gameState.remoteLives,

        clientXp: gameState.remotePlayer ? gameState.remotePlayer.xp : 0,
        clientXpNeeded: gameState.remotePlayer ? gameState.remotePlayer.xpNeeded : 50,
        clientLevel: gameState.remotePlayer ? gameState.remotePlayer.level : 1,
        clientPendingLevelUps: gameState.remotePlayer ? gameState.remotePlayer.pendingLevelUps : 0,

        monsters: monstersSync,
        projectiles: projSync,
        explosions: gameState.explosions,
        damageTexts: gameState.damageTexts,
        respawnTimers: gameState.respawnTimers
    });
}

function applyHostWorldSync(data) {
    if (!gameState.player || !gameState.remotePlayer) return;

    gameState.remotePlayer.targetX = data.hostX;
    gameState.remotePlayer.targetY = data.hostY;
    gameState.remotePlayer.angle = data.hostAngle;
    gameState.remotePlayer.stats.hp = data.hostHp;
    gameState.remotePlayer.stats.mana = data.hostMp;
    gameState.remotePlayer.shieldActive = data.hostShield;
    gameState.remotePlayer.blueBuffTime = data.hostBuffs.blue;
    gameState.remotePlayer.redBuffTime = data.hostBuffs.red;
    gameState.remoteLives = data.hostLives;

    gameState.remotePlayer.xp = data.hostXp;
    gameState.remotePlayer.xpNeeded = data.hostXpNeeded;
    gameState.remotePlayer.level = data.hostLevel;

    gameState.player.stats.hp = data.clientHp;
    gameState.localLives = data.clientLives;

    gameState.player.xp = data.clientXp;
    gameState.player.xpNeeded = data.clientXpNeeded;
    gameState.player.level = data.clientLevel;
    gameState.player.pendingLevelUps = data.clientPendingLevelUps;

    let localMonsters = gameState.entities.filter(e => e instanceof Monster);
    
    data.monsters.forEach(m => {
        let localMon = localMonsters.find(lm => lm.id === m.id);
        if (localMon) {
            localMon.targetX = m.x;
            localMon.targetY = m.y;
            localMon.angle = m.angle;
            localMon.stats.hp = m.hp;
            localMon.stats.maxHp = m.maxHp;
            localMon.state = m.state;
        } else {
            let mon = new Monster(m.x, m.y, m.type);
            mon.id = m.id; 
            mon.targetX = m.x;
            mon.targetY = m.y;
            mon.stats.hp = m.hp;
            mon.stats.maxHp = m.maxHp;
            mon.angle = m.angle;
            mon.state = m.state;
            gameState.entities.push(mon);
        }
    });

    gameState.entities = gameState.entities.filter(e => {
        if (e instanceof Monster) {
            return data.monsters.some(m => m.id === e.id);
        }
        return true;
    });

    gameState.projectiles = data.projectiles.map(p => {
        let proj = new Projectile({
            owner: null,
            x: p.x, y: p.y, radius: p.radius,
            vx: p.vx, vy: p.vy, speed: p.speed, range: 99999,
            type: p.type, damage: 0, color: p.color
        });
        proj.opacity = p.opacity;
        proj.isExpiring = p.isExpiring;
        proj.activeZapTargets = p.activeZapTargets || [];
        return proj;
    });

    gameState.explosions = data.explosions;
    gameState.damageTexts = data.damageTexts;
    gameState.respawnTimers = data.respawnTimers;
}

function triggerMatchOver(won) {
    let panel = document.getElementById("gameOverScreen");
    let title = document.getElementById("winnerTitle");
    if (won) {
        title.innerText = "CHIẾN THẮNG";
        title.style.color = "#4caf50";
        title.style.textShadow = "0 0 20px rgba(76, 175, 80, 0.5)";
    } else {
        title.innerText = "THẤT BẠI";
        title.style.color = "#f44336";
        title.style.textShadow = "0 0 20px rgba(244, 67, 54, 0.5)";
    }
    panel.style.display = "flex";
    document.getElementById("cardSelectOverlay").style.display = "none";
}

function createExplosion(target, angle) {
    let spawnX = target.x - Math.cos(angle) * 50;
    let spawnY = target.y - Math.sin(angle) * 50;

    gameState.explosions.push({
        x: spawnX,
        y: spawnY,
        angle: angle, 
        targetRadius: target.radius,
        frameTimer: 0 
    });
}

function updateHUD() {
    let p = gameState.player;
    if (!p) return;

    let hpPercent = (p.stats.hp / p.stats.maxHp) * 100;
    let mpPercent = (p.stats.mana / p.stats.maxMana) * 100;

    document.getElementById("hpBar").style.width = hpPercent + "%";
    document.getElementById("hpText").innerText = `${Math.round(p.stats.hp)} / ${p.stats.maxHp}`;
    
    document.getElementById("mpBar").style.width = mpPercent + "%";
    document.getElementById("mpText").innerText = `${Math.round(p.stats.mana)} / ${p.stats.maxMana}`;

    updateCooldownUI('1', p.cooldowns['1']);
    updateCooldownUI('2', p.cooldowns['2']);
    updateCooldownUI('3', p.cooldowns['3']);

    updateBuffHUD(p);

    let xpNeeded = p.xpNeeded || 50;
    let xpVal = p.xp || 0;
    let xpRatio = Math.min(1, xpVal / xpNeeded);
    let circumference = 2 * Math.PI * 26; 
    let dashOffset = circumference - (xpRatio * circumference);
    document.getElementById("xpRingFill").style.strokeDashoffset = dashOffset;
    document.getElementById("levelNumber").innerText = p.level || 1;

    let redDot = document.getElementById("levelRedDot");
    if (p.pendingLevelUps > 0) {
        redDot.style.display = "block";
    } else {
        redDot.style.display = "none";
    }

    let respawnDiv = document.getElementById("respawnCountdown");
    if (localRespawnTimer > 0) {
        respawnDiv.style.display = "block";
        document.getElementById("respawnSeconds").innerText = Math.ceil(localRespawnTimer);
    } else {
        respawnDiv.style.display = "none";
    }

    document.getElementById("localLivesText").innerText = gameState.localLives;
    if (gameState.mode === 'match') {
        document.getElementById("enemyLivesContainer").style.display = "block";
        document.getElementById("remoteLivesText").innerText = gameState.remoteLives;
    } else {
        document.getElementById("enemyLivesContainer").style.display = "none";
    }

    let actualCdr = Math.min(0.50, p.stats.cdr + (p.blueBuffTime > 0 ? 0.20 : 0));
    let actualManaRegen = p.stats.manaRegen * (p.blueBuffTime > 0 ? 10 : 1);

    let displaySpeed = (p.getSpeed() / 4.2) * 100;

    let accumulationInfo = "";
    if (p.accumulationPoints > 0) {
        accumulationInfo = `<br>Điểm tích tụ: <span style="color:#e040fb">${p.accumulationPoints}/250</span>`;
    }
    
    let debuffGrievousText = "";
    if (p.grievousWoundsTimer > 0) {
        debuffGrievousText = `<br><span style="color:#f44336; font-weight:bold;">GẶM MÒN / GIẢM HỒI MÁU: ${p.grievousWoundsTimer.toFixed(1)}s</span>`;
    }

    let statsHTML = `
        Công Vật Lý: <span style="color:#f44336">${Math.round(p.stats.ad)}</span><br>
        Công Phép: <span style="color:#b388ff">${Math.round(p.stats.ap)}</span><br>
        Tốc đánh (Hồi đòn): <span style="color:#ffeb3b">${p.stats.attackSpeed.toFixed(2)}s</span><br>
        Hồi HP/s: <span style="color:#4caf50">${p.stats.hpRegen.toFixed(1)}</span><br>
        Hồi Mana/s: <span style="color:#2196f3">${actualManaRegen.toFixed(1)}</span><br>
        Giảm hồi chiêu: <span style="color:#ff9800">${Math.round(actualCdr * 100)}%</span><br>
        Tốc độ chạy: <span style="color:#ffeb3b">${Math.round(displaySpeed)}</span><br>
        Giáp: <span style="color:#9e9e9e">${Math.round(p.stats.armor)}</span> (Xuyên: <span style="color:#ff5722">${Math.round(p.stats.armorPen)}</span>)<br>
        Kháng phép: <span style="color:#00bcd4">${Math.round(p.stats.mr)}</span> (Xuyên: <span style="color:#e040fb">${Math.round(p.stats.magicPen)}</span>)<br>
        Hút máu vật lý: <span style="color:#ff4081">${p.stats.lifesteal.toFixed(1)}%</span><br>
        Hút máu phép: <span style="color:#7c4dff">${p.stats.spellVamp.toFixed(1)}%</span><br>
        Chí mạng: <span style="color:#ff9100">${p.stats.critRate.toFixed(1)}%</span> (ST: +${p.stats.critDamage.toFixed(1)}%)
        ${accumulationInfo}
        ${debuffGrievousText}
    `;
    document.getElementById("statList").innerHTML = statsHTML;
}

function updateCooldownUI(skillKey, val) {
    let cdDiv = document.getElementById("cd_" + skillKey);
    if (val > 0) {
        cdDiv.style.visibility = 'visible';
        cdDiv.innerText = val.toFixed(1);
    } else {
        cdDiv.style.visibility = 'hidden';
    }
}

function updateBuffHUD(p) {
    let container = document.getElementById("buffContainer");
    container.innerHTML = "";

    if (p.blueBuffTime > 0) {
        container.innerHTML += `
            <div class="buff-icon blue" style="background-image: url('blue.png');">
                <span class="buff-timer">${Math.ceil(p.blueBuffTime)}s</span>
            </div>
        `;
    }
    if (p.redBuffTime > 0) {
        container.innerHTML += `
            <div class="buff-icon red" style="background-image: url('red.png');">
                <span class="buff-timer">${Math.ceil(p.redBuffTime)}s</span>
            </div>
        `;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-gameState.camera.x, -gameState.camera.y);

    drawMapGrid();
    drawPlayerAARange();
    drawSkillAimIndicator();
    drawEyeOfTideIndicator();

    gameState.projectiles.forEach(p => {
        if (isEntityVisible(p)) p.draw();
    });

    gameState.entities.forEach(entity => {
        if (isEntityVisible(entity)) {
            entity.draw();
            
            if (gameState.mode === 'match') {
                ctx.fillStyle = "#fff";
                ctx.font = "bold 11px Arial";
                ctx.textAlign = "center";
                if (entity === gameState.player) {
                    ctx.fillStyle = "#4caf50";
                    ctx.fillText("BẠN (Lv " + entity.level + ")", entity.x, entity.y - entity.radius - 12);
                } else if (entity === gameState.remotePlayer) {
                    ctx.fillStyle = "#f44336";
                    ctx.fillText("ĐỐI THỦ (Lv " + entity.level + ")", entity.x, entity.y - entity.radius - 12);
                }
            }
        }
    });

    drawExplosions();
    drawDamageTexts();

    ctx.restore();
    drawMinimap();
    drawRespawnTimers();
}

function drawEyeOfTideIndicator() {
    let p = gameState.player;
    if (p && p.premiumEye && gameState.remotePlayer && gameState.remotePlayer.stats.hp > 0) {
        let angleToEnemy = Math.atan2(gameState.remotePlayer.y - p.y, gameState.remotePlayer.x - p.x);
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angleToEnemy);
        
        ctx.beginPath();
        ctx.moveTo(42, -7);
        ctx.lineTo(55, 0);
        ctx.lineTo(42, 7);
        ctx.lineTo(45, 0);
        ctx.closePath();
        
        ctx.fillStyle = "#ffeb3b";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ff9800";
        ctx.fill();
        ctx.restore();
    }
}

function drawMapGrid() {
    ctx.strokeStyle = "#254025";
    ctx.lineWidth = 1;
    const gridSize = 100;
    
    for (let x = 0; x < MAP_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, MAP_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < MAP_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(MAP_WIDTH, y);
        ctx.stroke();
    }

    ctx.strokeStyle = "#f44336";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
}

function drawPlayerAARange() {
    if (localRespawnTimer > 0) return;
    let p = gameState.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 320, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]); 
    ctx.stroke();
    ctx.setLineDash([]); 
}

function drawSkillAimIndicator() {
    let p = gameState.player;
    if (!gameState.activeSkillAiming || localRespawnTimer > 0) return;

    let angle = Math.atan2(gameState.mouse.worldY - p.y, gameState.mouse.worldX - p.x);

    ctx.save();
    ctx.translate(p.x, p.y);

    if (gameState.activeSkillAiming === '1') {
        ctx.rotate(angle);
        ctx.fillStyle = "rgba(0, 229, 255, 0.05)";
        ctx.fillRect(0, -120, 500, 240); 
        ctx.strokeStyle = "rgba(0, 229, 255, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(0, -120, 500, 240);
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(500, 0);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
    } 
    else if (gameState.activeSkillAiming === '2') {
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(76, 175, 80, 0.15)";
        ctx.fill();
        ctx.strokeStyle = "rgba(76, 175, 80, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
    } 
    else if (gameState.activeSkillAiming === '3') {
        ctx.rotate(angle);
        ctx.fillStyle = "rgba(244, 67, 54, 0.15)";
        ctx.fillRect(0, -35, 1200, 70); 
        ctx.strokeStyle = "rgba(244, 67, 54, 0.5)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -35, 1200, 70);
    }

    ctx.restore();
}

function drawExplosions() {
    gameState.explosions.forEach(exp => {
        ctx.save();
        ctx.translate(exp.x, exp.y);
        ctx.rotate(exp.angle);

        let explosionSize = exp.targetRadius * 2 * 2.5;
        let currentExplosionImg = (exp.frameTimer <= 3) ? imgAssets.firehit1 : imgAssets.firehit;

        if (currentExplosionImg.complete && currentExplosionImg.naturalWidth > 0) {
            ctx.drawImage(
                currentExplosionImg,
                -explosionSize / 2,
                -explosionSize / 2,
                explosionSize,
                explosionSize
            );
        } else {
            let currentScale = (exp.frameTimer <= 3) ? 1.0 : 1.3;
            let radialGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, (explosionSize / 2) * currentScale);
            radialGlow.addColorStop(0, exp.frameTimer <= 3 ? "rgba(255, 235, 59, 0.9)" : "rgba(255, 87, 34, 0.7)");
            radialGlow.addColorStop(0.5, "rgba(230, 81, 0, 0.5)");
            radialGlow.addColorStop(1, "rgba(0,0,0,0)");

            ctx.beginPath();
            ctx.arc(0, 0, (explosionSize / 2) * currentScale, 0, Math.PI * 2);
            ctx.fillStyle = radialGlow;
            ctx.fill();
        }

        ctx.restore();
    });
}

function drawDamageTexts() {
    gameState.damageTexts.forEach(text => {
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, text.x, text.y);
    });
}

function drawRespawnTimers() {
    const miniSize = 150; 
    const padding = 20;
    const startX = canvas.width - miniSize - padding;
    let currentY = padding + miniSize + 15; 

    if (gameState.respawnTimers.length === 0) return;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(startX, currentY, miniSize, 25 + gameState.respawnTimers.length * 20);
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(startX, currentY, miniSize, 25 + gameState.respawnTimers.length * 20);

    ctx.fillStyle = "#ffeb3b";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText("HỒI SINH:", startX + 8, currentY + 16);

    currentY += 28;
    ctx.font = "11px Arial";
    ctx.fillStyle = "#fff";

    gameState.respawnTimers.forEach(timer => {
        let name = "Bùa";
        if (timer.type === 'blue') name = "Bùa Xanh";
        else if (timer.type === 'red') name = "Bùa Đỏ";
        else if (timer.type === 'monkey') name = "Khỉ Rừng";
        else if (timer.type === 'golem') name = "Golem Đá";

        let text = `${name}: ${Math.ceil(timer.respawnIn)}s`;
        ctx.fillText(text, startX + 8, currentY);
        currentY += 18;
    });
    ctx.restore();
}

function drawMinimap() {
    const miniSize = 150; 
    const padding = 20;
    const startX = canvas.width - miniSize - padding;
    const startY = padding;

    ctx.fillStyle = "rgba(10, 30, 10, 0.85)";
    ctx.fillRect(startX, startY, miniSize, miniSize);
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, miniSize, miniSize);

    let scale = miniSize / MAP_WIDTH;

    gameState.entities.forEach(entity => {
        let visible = isEntityVisible(entity);
        let showOnMinimap = false;

        if (entity === gameState.player) {
            showOnMinimap = true;
        } else if (entity === gameState.remotePlayer) {
            showOnMinimap = visible; // Con mắt thủy triều chỉ hiển thị mũi tên chỉ hướng, đối thủ ở vùng tối không hiện trên minimap
        } else if (entity instanceof Monster) {
            showOnMinimap = true; 
        } else if (entity.isDummy) {
            showOnMinimap = true;
        }

        if (showOnMinimap) {
            let miniX = startX + entity.x * scale;
            let miniY = startY + entity.y * scale;
            let miniRadius = Math.max(3, entity.radius * scale * 2.5);

            ctx.beginPath();
            ctx.arc(miniX, miniY, miniRadius, 0, Math.PI * 2);

            if (entity instanceof Monster) {
                if (entity.monsterType === 'blue') ctx.fillStyle = "#00e5ff";
                else if (entity.monsterType === 'red') ctx.fillStyle = "#ff5722";
                else if (entity.monsterType === 'monkey') ctx.fillStyle = "#795548";
                else if (entity.monsterType === 'golem') ctx.fillStyle = "#9e9e9e";
                else if (entity.monsterType === 'mini_golem') ctx.fillStyle = "#757575";
            } else {
                ctx.fillStyle = entity.isDummy ? "#ff9800" : entity.color;
            }
            ctx.fill();
        }
    });

    let camX = startX + gameState.camera.x * scale;
    let camY = startY + gameState.camera.y * scale;
    let camW = canvas.width * scale;
    let camH = canvas.height * scale;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(camX, camY, camW, camH);
}
