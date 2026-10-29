/* ================= 1. DỮ LIỆU CẤU TRÚC THƯ MỤC CHUẨN VS CODE ================= */
const GUI_TREE_DATA = {
    name: "assets",
    isOpen: true,
    children: [
        {
            name: "minecraft",
            isOpen: true,
            children: [
                {
                    name: "textures",
                    isOpen: true,
                    children: [
                        {
                            name: "gui",
                            isOpen: true,
                            children: [
                                {
                                    name: "container",
                                    isOpen: true,
                                    children: [
                                        { id: 'anvil', name: 'anvil.png', path: 'assets/minecraft/textures/gui/container/anvil.png', folder: 'textures/gui/container' },
                                        { id: 'beacon', name: 'beacon.png', path: 'assets/minecraft/textures/gui/container/beacon.png', folder: 'textures/gui/container' },
                                        { id: 'blast_furnace', name: 'blast_furnace.png', path: 'assets/minecraft/textures/gui/container/blast_furnace.png', folder: 'textures/gui/container' },
                                        { id: 'brewing_stand', name: 'brewing_stand.png', path: 'assets/minecraft/textures/gui/container/brewing_stand.png', folder: 'textures/gui/container' },
                                        { id: 'cartography_table', name: 'cartography_table.png', path: 'assets/minecraft/textures/gui/container/cartography_table.png', folder: 'textures/gui/container' },
                                        { id: 'crafter', name: 'crafter.png', path: 'assets/minecraft/textures/gui/container/crafter.png', folder: 'textures/gui/container' },
                                        { id: 'crafting_table', name: 'crafting_table.png', path: 'assets/minecraft/textures/gui/container/crafting_table.png', folder: 'textures/gui/container' },
                                        { id: 'dispenser', name: 'dispenser.png', path: 'assets/minecraft/textures/gui/container/dispenser.png', folder: 'textures/gui/container' },
                                        { id: 'enchanting_table', name: 'enchanting_table.png', path: 'assets/minecraft/textures/gui/container/enchanting_table.png', folder: 'textures/gui/container' },
                                        { id: 'furnace', name: 'furnace.png', path: 'assets/minecraft/textures/gui/container/furnace.png', folder: 'textures/gui/container' },
                                        { id: 'generic_54', name: 'generic_54.png', path: 'assets/minecraft/textures/gui/container/generic_54.png', folder: 'textures/gui/container' },
                                        { id: 'grindstone', name: 'grindstone.png', path: 'assets/minecraft/textures/gui/container/grindstone.png', folder: 'textures/gui/container' },
                                        { id: 'hopper', name: 'hopper.png', path: 'assets/minecraft/textures/gui/container/hopper.png', folder: 'textures/gui/container' },
                                        { id: 'horse', name: 'horse.png', path: 'assets/minecraft/textures/gui/container/horse.png', folder: 'textures/gui/container' },
                                        { id: 'inventory', name: 'inventory.png', path: 'assets/minecraft/textures/gui/container/inventory.png', folder: 'textures/gui/container' },
                                        { id: 'loom', name: 'loom.png', path: 'assets/minecraft/textures/gui/container/loom.png', folder: 'textures/gui/container' },
                                        { id: 'shulker_box', name: 'shulker_box.png', path: 'assets/minecraft/textures/gui/container/shulker_box.png', folder: 'textures/gui/container' },
                                        { id: 'smithing', name: 'smithing.png', path: 'assets/minecraft/textures/gui/container/smithing.png', folder: 'textures/gui/container' },
                                        { id: 'smoker', name: 'smoker.png', path: 'assets/minecraft/textures/gui/container/smoker.png', folder: 'textures/gui/container' },
                                        { id: 'stonecutter', name: 'stonecutter.png', path: 'assets/minecraft/textures/gui/container/stonecutter.png', folder: 'textures/gui/container' },
                                        { id: 'villager', name: 'villager.png', path: 'assets/minecraft/textures/gui/container/villager.png', folder: 'textures/gui/container' }
                                    ]
                                },
                                { id: 'recipe_book', name: 'recipe_book.png', path: 'assets/minecraft/textures/gui/recipe_book.png', folder: 'textures/gui' }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

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

const RANGE_VERSIONS = MINECRAFT_VERSIONS.filter(v => v.isRangeSupported);

const PRESET_IDS = {
    items: ["diamond", "diamond_sword", "iron_sword", "golden_sword", "netherite_sword", "bow", "crossbow", "arrow", "apple", "golden_apple", "bread", "totem_of_undying", "elytra", "shield"],
    blocks: ["stone", "cobblestone", "dirt", "grass_block", "oak_planks", "glass", "obsidian", "tnt", "diamond_block", "netherrack"],
    gui: ["anvil", "beacon", "blast_furnace", "brewing_stand", "cartography_table", "crafting_table", "dispenser", "furnace", "generic_54", "hopper", "horse", "inventory", "loom", "shulker_box", "villager"]
};