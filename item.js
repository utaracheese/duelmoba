// --- DANH SÁCH TRANG BỊ & CÔNG THỨC MUA ĐỒ ---
const ITEMS_DATABASE = {
    // === CÔNG VẬT LÝ (AD) ===
    'long_kiem': {
        id: 'long_kiem', name: 'Kiếm Dài', category: 'ad',
        cost: 280, 
        stats: { ad: 10 },
        desc: '+10 Công vật lý', recipe: []
    },
    'short_kiem': {
        id: 'short_kiem', name: 'Kiếm Ngắn', category: 'ad',
        cost: 285, 
        stats: { attackSpeedBonus: 0.10 },
        desc: '+10% Tốc đánh', recipe: []
    },
    'gan_tay': {
        id: 'gan_tay', name: 'Găng Tay Vải', category: 'ad',
        cost: 300, 
        stats: { critRate: 7 },
        desc: '+7% Tỉ lệ chí mạng', recipe: []
    },
    'doi_quy': {
        id: 'doi_quy', name: 'Dơi Quỷ', category: 'ad',
        cost: 480, 
        stats: { lifesteal: 8 },
        desc: '+8% Hút máu vật lý', recipe: []
    },
    'dao_hunt': {
        id: 'dao_hunt', name: 'Dao Thợ Săn', category: 'ad',
        cost: 500, 
        stats: { ad: 7 },
        uniqueStats: { expBonus: 20 },
        uniquePassiveName: 'Săn Rừng',
        desc: '+7 AD\n+20% EXP từ quái - ntdn\nSăn Rừng: Đánh quái gây thêm 5 sát thương chuẩn - ntdn', 
        recipe: []
    },
    // trung cap
    'kiem_hiep_si': {
        id: 'kiem_hiep_si', name: 'Kiếm Hiệp Sĩ', category: 'ad',
        cost: 825, 
        stats: { ad: 30 },
        desc: '+20 Công vật lý',
        recipe: ['long_kiem','long_kiem'] 
    },
    'double_sw': {
        id: 'double_sw', name: 'song kiếm', category: 'ad',
        cost: 710, 
        stats: { attackSpeedBonus: 0.25 },
        desc: '+25% Tốc đánh', recipe: ['short_kiem','short_kiem']
    },
    'no_tien': {
        id: 'no_tien', name: 'nỏ tiễn', category: 'ad',
        cost: 2000, 
        uniqueStats: { ad : 22, armorPen : 30, attackSpeedBonus : 0.30, critRate : 10 },
        uniquePassiveName: 'Nỏ tiễn',
        desc: '+22 Công vật lý\n+30 Xuyên giáp\n+30% tốc đánh\n+10% tỉ lệ chí mạng\n[tất cả duy nhất]', recipe: ['long_kiem','long_kiem','long_kiem','short_kiem','short_kiem','gan_tay']
    },
    'sung_hai_tac': {
        id: 'sung_hai_tac', name: 'Súng hải tặc', category: 'ad',
        cost: 2780, 
        uniqueStats: { ad : 25, armorPen : 35, attackSpeedBonus : 0.35, critRate : 17.5 },
        uniquePassiveName: 'Siêu tốc đánh thường',
        desc: '+25 Công vật lý\n+35 Xuyên giáp\n+35% tốc đánh\n+17,5% tỉ lệ chí mạng\n[tất cả duy nhất]\n\nSiêu tốc đánh thường: Đánh thường bắn thêm 1 viên đạn gây (0,5*Lv, tối đa 10) + 2,5% Công vật lý (có thể chí mạng) - áp dụng với tầm xa', 
        recipe: ['no_tien']
    },
    'phao_cong': {
        id: 'phao_cong', name: 'Pháo công', category: 'ad',
        cost: 2750, 
        uniqueStats: { armorPen : 100, attackSpeedBonus : 0.30, critRate : 25 },
        uniquePassiveName: 'Săn lùng',
        uniqueCooldown: 2.5,
        desc: '+100 Xuyên giáp\n+30% tốc đánh\n+25% tỉ lệ chí mạng\n[tất cả duy nhất]\n\nSăn lùng: Đánh thường trúng địch gây thêm 25% HP địch đã mất thành Sát Thương Phép (có thể chí mạng màu tím) - áp dụng với tầm xa (hồi chiêu 2,5s)', 
        recipe: ['no_tien']
    },
    'thanh_kiem': {
        id: 'thanh_kiem', name: 'Thánh kiếm', category: 'ad',
        cost: 2995, 
        stats: { ad : 75, critRate : 25 },
        uniqueStats: { critDamage : 40 },
        uniquePassiveName: 'Thánh kiếm', // Bổ sung tên nội tại duy nhất
        desc: '+75 công vật lý\n+25% tỉ lệ chí mạng\n+40% sát thương chí mạng - ntdn', 
        recipe: ['long_kiem','long_kiem','kiem_hiep_si','kiem_hiep_si','gan_tay','gan_tay']
    },

    // === CÔNG PHÉP (AP) ===
    'sach_phep': {
        id: 'sach_phep', name: 'Sách Phép', category: 'ap',
        cost: 500, 
        stats: { ap: 25 },
        desc: '+25 Công phép', recipe: []
    },
    'gay_phu_thuy': {
        id: 'gay_phu_thuy', name: 'Gậy Phù Thủy', category: 'ap',
        cost: 1500, 
        stats: { ap: 80 },
        desc: '+80 Công phép',
        recipe: ['sach_phep']
    },

    // === PHÒNG THỦ (DEFENSE) ===
    'giap_vai': {
        id: 'giap_vai', name: 'Giáp Vải', category: 'def',
        cost: 500, 
        stats: { armor: 20, maxHp: 100 },
        desc: '+20 Giáp, +100 Máu', recipe: []
    },
    'giap_thep': {
        id: 'giap_thep', name: 'Giáp Thép Kiên Cường', category: 'def',
        cost: 1500, 
        stats: { armor: 55, maxHp: 350 },
        desc: '+55 Giáp, +350 Máu tối đa',
        recipe: ['giap_vai']
    },

    // === GIÀY & TỐC ĐỘ (MOVEMENT) ===
    'giay_thuong': {
        id: 'giay_thuong', name: 'Giày Tốc Độ', category: 'speed',
        cost: 500, 
        stats: { speed: 0.5 },
        desc: '+0.5 Tốc độ di chuyển', recipe: []
    },
    'giay_cuong_phong': {
        id: 'giay_cuong_phong', name: 'Giày Cuồng Phong', category: 'speed',
        cost: 1500, 
        stats: { speed: 1.0, attackSpeedBonus: 0.20 },
        desc: '+1.0 Tốc chạy, +20% Tốc đánh',
        recipe: ['giay_thuong']
    }
};

// Kiểm tra xem người chơi có sở hữu Nội Tại Duy Nhất nào đó không
function playerHasUniquePassive(player, passiveName) {
    if (!player || !player.inventory) return false;
    for (let itemId of player.inventory) {
        let item = ITEMS_DATABASE[itemId];
        if (item && item.uniquePassiveName === passiveName) {
            return true;
        }
    }
    return false;
}

// Xử lý Sát thương phụ từ Nội Tại Duy Nhất khi đánh trúng mục tiêu
function processItemOnHitPassives(attacker, target, proj) {
    if (!attacker || !target || target.stats.hp <= 0) return;
    
    // Nếu là viên đạn phụ từ Súng Hải Tặc -> Không kích hoạt lại nội tại đánh thường
    if (proj && (proj.isBonusBullet || proj.type === 'sung_hai_tac_bullet')) return;

    const isRanged = (attacker.rangeType === 'Xa');

    // 1. NTDN: Săn Rừng (Dao Thợ Săn)
    if (playerHasUniquePassive(attacker, 'Săn Rừng') && (target instanceof Monster)) {
        target.takeDamage(5, 'true', attacker, false);
    }

    // 2. NTDN: Siêu tốc đánh thường (Súng Hải Tặc) - Bắn duy nhất 1 viên đạn phụ
    if (playerHasUniquePassive(attacker, 'Siêu tốc đánh thường') && isRanged) {
        setTimeout(() => {
            if (target && target.stats.hp > 0 && attacker && attacker.stats.hp > 0) {
                let angle = Math.atan2(target.y - attacker.y, target.x - attacker.x);
                let heroLevel = attacker.level || 1;
                let dameGoc = Math.min(10, 0.5 * heroLevel);
                let bonusDmg = dameGoc + (attacker.stats.ad * 0.025);
                
                // Tính chí mạng cho viên đạn phụ
                let isCrit = false;
                let roll = Math.random() * 100;
                if (roll < attacker.stats.critRate) {
                    isCrit = true;
                    let critBonus = attacker.stats.critDamage || 0;
                    let minCrit = bonusDmg * 2;
                    let maxCrit = bonusDmg * 2 + bonusDmg * (critBonus / 100) + critBonus;
                    bonusDmg = minCrit + Math.random() * (maxCrit - minCrit);
                }

                // Tạo viên đạn phụ độc lập (được đánh dấu isBonusBullet: true)
                gameState.projectiles.push(new Projectile({
                    owner: attacker,
                    x: attacker.x, y: attacker.y,
                    vx: Math.cos(angle), vy: Math.sin(angle),
                    radius: 5, speed: 13,
                    type: 'sung_hai_tac_bullet',
                    isBonusBullet: true,
                    damage: bonusDmg,
                    dmgType: 'physical',
                    color: '#ffeb3b',
                    range: 600
                }));
            }
        }, 150);
    }

    // 3. NTDN: Săn lùng (Pháo Công) - 25% HP đã mất thành Sát Thương Phép (Có thể chí mạng màu tím)
    if (playerHasUniquePassive(attacker, 'Săn lùng') && isRanged) {
        if (!attacker.itemCooldowns) attacker.itemCooldowns = {};
        
        let cdRemaining = attacker.itemCooldowns['Săn lùng'] || 0;
        if (cdRemaining <= 0) {
            attacker.itemCooldowns['Săn lùng'] = 2.5; // Hồi chiêu 2.5s
            
            let missingHp = target.stats.maxHp - target.stats.hp;
            if (missingHp > 0) {
                let bonusMagicDmg = missingHp * 0.25; // 25% HP đã mất
                
                // Tính toán Chí Mạng
                let isCrit = false;
                let roll = Math.random() * 100;
                if (roll < attacker.stats.critRate) {
                    isCrit = true;
                    let critBonus = attacker.stats.critDamage || 0;
                    let minCrit = bonusMagicDmg * 2;
                    let maxCrit = bonusMagicDmg * 2 + bonusMagicDmg * (critBonus / 100) + critBonus;
                    bonusMagicDmg = minCrit + Math.random() * (maxCrit - minCrit);
                }

                // Gây sát thương Phép (sẽ hiển thị số tím & biểu tượng chí mạng màu tím nếu crit)
                target.takeDamage(bonusMagicDmg, 'magic', attacker, isCrit);
            }
        }
    }
}

// Hàm Tính Toán Lại Toàn Bộ Chỉ Số Item (Đã khắc phục lỗi không cộng chỉ số khi thiếu uniquePassiveName)
function recalculatePlayerItemStats(player) {
    if (!player) return;

    if (player.lastAppliedItemStats) {
        removeStatObject(player, player.lastAppliedItemStats);
    }

    let newTotalStats = {};
    let activeUniquePassives = new Set();

    player.inventory.forEach(itemId => {
        let item = ITEMS_DATABASE[itemId];
        if (!item) return;

        // Chỉ số thường
        if (item.stats) {
            addStatObject(newTotalStats, item.stats);
        }

        // Chỉ số Nội Tại Duy Nhất (NTDN)
        if (item.uniqueStats) {
            let passiveKey = item.uniquePassiveName || item.id;
            if (!activeUniquePassives.has(passiveKey)) {
                addStatObject(newTotalStats, item.uniqueStats);
                activeUniquePassives.add(passiveKey);
            }
        }
    });

    applyStatObject(player, newTotalStats);
    player.lastAppliedItemStats = newTotalStats;
}

function addStatObject(targetObj, sourceObj) {
    for (let key in sourceObj) {
        targetObj[key] = (targetObj[key] || 0) + sourceObj[key];
    }
}

function applyStatObject(player, statObj) {
    let p = player.stats;
    if (statObj.ad) p.ad += statObj.ad;
    if (statObj.ap) p.ap += statObj.ap;
    if (statObj.maxHp) { p.maxHp += statObj.maxHp; p.hp += statObj.maxHp; }
    if (statObj.maxMana) { p.maxMana += statObj.maxMana; p.mana += statObj.maxMana; }
    if (statObj.hpRegen) p.hpRegen += statObj.hpRegen;
    if (statObj.manaRegen) p.manaRegen += statObj.manaRegen;
    if (statObj.armor) p.armor += statObj.armor;
    if (statObj.mr) p.mr += statObj.mr;
    if (statObj.armorPen) p.armorPen += statObj.armorPen;
    if (statObj.magicPen) p.magicPen += statObj.magicPen;
    if (statObj.speed) p.speed += statObj.speed;
    if (statObj.cdr) p.cdr += statObj.cdr;
    if (statObj.lifesteal) p.lifesteal += statObj.lifesteal;
    if (statObj.spellVamp) p.spellVamp += statObj.spellVamp;
    if (statObj.critRate) p.critRate += statObj.critRate;
    if (statObj.critDamage) p.critDamage += statObj.critDamage;
    if (statObj.expBonus) p.expBonus += statObj.expBonus;

    if (statObj.attackSpeedBonus) {
        player.attackSpeedBonus = (player.attackSpeedBonus || 0) + statObj.attackSpeedBonus;
        recalculateAttackSpeed(player);
    }
}

function removeStatObject(player, statObj) {
    let p = player.stats;
    if (statObj.ad) p.ad -= statObj.ad;
    if (statObj.ap) p.ap -= statObj.ap;
    if (statObj.maxHp) { p.maxHp -= statObj.maxHp; p.hp = Math.min(p.hp, p.maxHp); }
    if (statObj.maxMana) { p.maxMana -= statObj.maxMana; p.mana = Math.min(p.mana, p.maxMana); }
    if (statObj.hpRegen) p.hpRegen -= statObj.hpRegen;
    if (statObj.manaRegen) p.manaRegen -= statObj.manaRegen;
    if (statObj.armor) p.armor -= statObj.armor;
    if (statObj.mr) p.mr -= statObj.mr;
    if (statObj.armorPen) p.armorPen -= statObj.armorPen;
    if (statObj.magicPen) p.magicPen -= statObj.magicPen;
    if (statObj.speed) p.speed -= statObj.speed;
    if (statObj.cdr) p.cdr -= statObj.cdr;
    if (statObj.lifesteal) p.lifesteal -= statObj.lifesteal;
    if (statObj.spellVamp) p.spellVamp -= statObj.spellVamp;
    if (statObj.critRate) p.critRate -= statObj.critRate;
    if (statObj.critDamage) p.critDamage -= statObj.critDamage;
    if (statObj.expBonus) p.expBonus -= statObj.expBonus;

    if (statObj.attackSpeedBonus) {
        player.attackSpeedBonus = Math.max(0, (player.attackSpeedBonus || 0) - statObj.attackSpeedBonus);
        recalculateAttackSpeed(player);
    }
}

function buySelectedItem() {
    let p = gameState.player;
    if (!p || !selectedShopItemId) return;

    let item = ITEMS_DATABASE[selectedShopItemId];
    let info = calculateItemPurchaseInfo(selectedShopItemId, p);

    if (p.gold < info.finalPrice) return;

    let freeSlots = 6 - p.inventory.length;
    let slotsFreed = info.consumedSlots.length;
    if (freeSlots + slotsFreed < 1) {
        alert("Túi đồ đã đầy!");
        return;
    }

    p.gold -= info.finalPrice;

    info.consumedSlots.sort((a,b) => b - a).forEach(idx => {
        p.inventory.splice(idx, 1);
    });

    p.inventory.push(item.id);
    
    recalculatePlayerItemStats(p);
    renderShopUI();
}

function sellItem(slotIndex) {
    let p = gameState.player;
    if (!p || !p.inventory[slotIndex]) return;

    let itemId = p.inventory[slotIndex];
    let item = ITEMS_DATABASE[itemId];

    let refund = Math.floor(item.cost * 0.7);
    p.gold += refund;

    p.inventory.splice(slotIndex, 1);

    recalculatePlayerItemStats(p);
    renderShopUI();
}

// Hàm hiển thị 6 ô tròn item ngoài HUD chính kèm đếm ngược vòng tròn time cho nội tại trang bị
function updateHUDInventory() {
    let p = gameState.player;
    let container = document.getElementById("hudInventoryContainer");
    if (!container || !p) return;

    let html = "";
    for (let i = 0; i < 6; i++) {
        let itemId = p.inventory ? p.inventory[i] : null;
        if (itemId && ITEMS_DATABASE[itemId]) {
            let item = ITEMS_DATABASE[itemId];
            let imgPath = `assets/item/${item.id}.png`;
            let shortName = item.name.substring(0, 3);
            
            let cdHTML = "";
            if (item.uniquePassiveName && p.itemCooldowns && p.itemCooldowns[item.uniquePassiveName] > 0) {
                let cd = p.itemCooldowns[item.uniquePassiveName];
                let maxCd = item.uniqueCooldown || 2.5;
                let ratio = Math.min(1, Math.max(0, cd / maxCd));
                let circumference = 2 * Math.PI * 18;
                let dashOffset = circumference * ratio;

                cdHTML = `
                    <div class="item-cd-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; border-radius:50%; z-index:5;">
                        <svg width="44" height="44" style="position:absolute; top:0; left:0; transform:rotate(-90deg); pointer-events:none;">
                            <circle cx="22" cy="22" r="18" stroke="rgba(255,255,255,0.2)" stroke-width="3" fill="none"/>
                            <circle cx="22" cy="22" r="18" stroke="#ffeb3b" stroke-width="3" fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" stroke-linecap="round"/>
                        </svg>
                        <span class="item-cd-text" style="color:#ffeb3b; font-weight:bold; font-size:11px; z-index:6; text-shadow:1px 1px 2px #000;">${cd.toFixed(1)}</span>
                    </div>
                `;
            }

            html += `
                <div class="hud-item-slot" style="width:44px; height:44px; border-radius:50%; position:relative; overflow:hidden; border:1.5px solid #ffb300; background:#121218; display:flex; justify-content:center; align-items:center;">
                    <img src="${imgPath}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="item-fallback-text" style="display:none; font-size:9px; font-weight:bold; color:#ffb300; text-align:center; line-height:1.1;">
                        ${shortName}
                    </div>
                    ${cdHTML}
                </div>
            `;
        } else {
            html += `
                <div class="hud-item-slot empty" style="width:44px; height:44px; border-radius:50%; border:1.5px solid #333; background:rgba(15,15,20,0.8); display:flex; justify-content:center; align-items:center; color:#555; font-size:10px;">
                    •
                </div>
            `;
        }
    }
    container.innerHTML = html;
}