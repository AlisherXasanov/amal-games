import * as THREE from 'three';

/* ============================================================
   CraftWorld — Minecraft-ядро
   Мир · HP · мобы · боссы · крафт · админ/X-ray/полёт
   ============================================================ */

const WORLD_W = 96;
const WORLD_D = 96;
const WORLD_H = 56;
const SEA_LEVEL = 14;
const GRAVITY = 28;
const JUMP_VEL = 9.2;
const MOVE_SPEED = 6.4;
const SPRINT_MULT = 1.55;
const FLY_SPEED = 14;
const NOCLIP_SPEED = 22;
const PLAYER_H = 1.7;
const PLAYER_R = 0.3;
const REACH = 7;
const MAX_MOBS = 18;
const MESH_DEBOUNCE = 70;

const BIOME = { PLAINS: 0, FOREST: 1, DESERT: 2, MOUNTAINS: 3, SNOW: 4, SWAMP: 5, MESA: 6 };
const BIOME_NAME = {
  [BIOME.PLAINS]: 'равнины', [BIOME.FOREST]: 'лес', [BIOME.DESERT]: 'пустыня',
  [BIOME.MOUNTAINS]: 'горы', [BIOME.SNOW]: 'снега', [BIOME.SWAMP]: 'болото', [BIOME.MESA]: 'меса',
};

const BLOCK = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5, SAND: 6, WATER: 7,
  COBBLE: 8, PLANKS: 9, GLASS: 10, BRICK: 11, SNOW: 12, ICE: 13, SNOW_GRASS: 14,
  CACTUS: 15, CLAY: 16, GRAVEL: 17, COAL_ORE: 18, IRON_ORE: 19, GOLD_ORE: 20,
  DIAMOND_ORE: 21, LAVA: 22, OBSIDIAN: 23, MOSSY: 24, DUNGEON_BRICK: 25, CHEST: 26,
  TORCH: 27, GLOWSTONE: 28, BEDROCK: 29, SANDSTONE: 30, RED_SAND: 31, TERRACOTTA: 32,
  PUMPKIN: 33, MYCELIUM: 34, BIRCH: 35, BIRCH_LEAVES: 36, WOOL_RED: 37, WOOL_BLUE: 38,
  WOOL_YELLOW: 39, TNT: 40, BOOKSHELF: 41, IRON_BLOCK: 42, GOLD_BLOCK: 43,
  DIAMOND_BLOCK: 44, SPAWNER: 45, EMERALD_ORE: 46, LAPIS_ORE: 47, REDSTONE_ORE: 48,
  CRAFTING: 49, FURNACE: 50, SOUL_SAND: 51, END_STONE: 52, END_PORTAL: 53,
  END_FRAME: 54, DRAGON_EGG: 55, END_CRYSTAL: 56, NETHERRACK: 57, PORTAL: 58,
};

/** Предметы (не блоки) — id >= 100 */
const ITEM = {
  STICK: 100, APPLE: 101, BEEF: 102, ARROW: 103, GUNPOWDER: 104, ENDER_PEARL: 105,
  WOOD_PICK: 110, STONE_PICK: 111, IRON_PICK: 112, DIAMOND_PICK: 113,
  WOOD_SWORD: 120, STONE_SWORD: 121, IRON_SWORD: 122, DIAMOND_SWORD: 123,
  WITHER_SKULL: 130, IRON_INGOT: 131, GOLD_INGOT: 132, DIAMOND: 133, COAL: 134,
};

const ORE_BLOCKS = new Set([
  BLOCK.COAL_ORE, BLOCK.IRON_ORE, BLOCK.GOLD_ORE, BLOCK.DIAMOND_ORE,
  BLOCK.EMERALD_ORE, BLOCK.LAPIS_ORE, BLOCK.REDSTONE_ORE,
  BLOCK.DIAMOND_BLOCK, BLOCK.GOLD_BLOCK, BLOCK.IRON_BLOCK,
  BLOCK.CHEST, BLOCK.SPAWNER, BLOCK.LAVA, BLOCK.GLOWSTONE, BLOCK.END_CRYSTAL,
]);

const XRAY_COLORS = {
  [BLOCK.DIAMOND_ORE]: 0x3de8ff, [BLOCK.DIAMOND_BLOCK]: 0x5afff5, [BLOCK.EMERALD_ORE]: 0x2dff6a,
  [BLOCK.GOLD_ORE]: 0xffd428, [BLOCK.GOLD_BLOCK]: 0xffe066, [BLOCK.IRON_ORE]: 0xd4c4b0,
  [BLOCK.IRON_BLOCK]: 0xe8e8ec, [BLOCK.COAL_ORE]: 0x222222, [BLOCK.LAPIS_ORE]: 0x2a4fff,
  [BLOCK.REDSTONE_ORE]: 0xff2a2a, [BLOCK.CHEST]: 0xffaa22, [BLOCK.SPAWNER]: 0xaa44ff,
  [BLOCK.LAVA]: 0xff5500, [BLOCK.GLOWSTONE]: 0xffee88, [BLOCK.END_CRYSTAL]: 0xff66ff,
};

const BLOCK_META = {
  [BLOCK.GRASS]: { name: 'трава', color: [0.35, 0.62, 0.22], top: [0.42, 0.72, 0.28], solid: true, opaque: true, drop: BLOCK.DIRT },
  [BLOCK.DIRT]: { name: 'земля', color: [0.55, 0.35, 0.18], solid: true, opaque: true },
  [BLOCK.STONE]: { name: 'камень', color: [0.50, 0.50, 0.52], solid: true, opaque: true, drop: BLOCK.COBBLE, hardness: 1.5 },
  [BLOCK.WOOD]: { name: 'дуб', color: [0.42, 0.28, 0.14], top: [0.55, 0.42, 0.25], solid: true, opaque: true },
  [BLOCK.LEAVES]: { name: 'листва', color: [0.22, 0.55, 0.20], solid: true, opaque: false, alpha: 0.85, drop: ITEM.APPLE, dropChance: 0.12 },
  [BLOCK.SAND]: { name: 'песок', color: [0.86, 0.78, 0.52], solid: true, opaque: true },
  [BLOCK.WATER]: { name: 'вода', color: [0.18, 0.42, 0.82], solid: false, opaque: false, alpha: 0.5, fluid: true },
  [BLOCK.COBBLE]: { name: 'булыжник', color: [0.42, 0.42, 0.44], solid: true, opaque: true, hardness: 1.5 },
  [BLOCK.PLANKS]: { name: 'доски', color: [0.72, 0.55, 0.30], solid: true, opaque: true },
  [BLOCK.GLASS]: { name: 'стекло', color: [0.75, 0.88, 0.95], solid: true, opaque: false, alpha: 0.32 },
  [BLOCK.BRICK]: { name: 'кирпич', color: [0.65, 0.32, 0.25], solid: true, opaque: true },
  [BLOCK.SNOW]: { name: 'снег', color: [0.95, 0.96, 0.98], solid: true, opaque: true },
  [BLOCK.ICE]: { name: 'лёд', color: [0.55, 0.78, 0.92], solid: true, opaque: false, alpha: 0.55 },
  [BLOCK.SNOW_GRASS]: { name: 'снег.трава', color: [0.45, 0.55, 0.40], top: [0.92, 0.94, 0.97], solid: true, opaque: true, drop: BLOCK.DIRT },
  [BLOCK.CACTUS]: { name: 'кактус', color: [0.25, 0.58, 0.28], solid: true, opaque: true },
  [BLOCK.CLAY]: { name: 'глина', color: [0.62, 0.66, 0.72], solid: true, opaque: true },
  [BLOCK.GRAVEL]: { name: 'гравий', color: [0.55, 0.52, 0.48], solid: true, opaque: true },
  [BLOCK.COAL_ORE]: { name: 'уголь', color: [0.28, 0.28, 0.30], solid: true, opaque: true, ore: true, drop: ITEM.COAL, hardness: 2 },
  [BLOCK.IRON_ORE]: { name: 'железо', color: [0.55, 0.48, 0.42], solid: true, opaque: true, ore: true, hardness: 2.5 },
  [BLOCK.GOLD_ORE]: { name: 'золото', color: [0.78, 0.68, 0.22], solid: true, opaque: true, ore: true, hardness: 2.5 },
  [BLOCK.DIAMOND_ORE]: { name: 'алмаз', color: [0.25, 0.85, 0.92], solid: true, opaque: true, ore: true, emit: 0.35, drop: ITEM.DIAMOND, hardness: 3 },
  [BLOCK.EMERALD_ORE]: { name: 'изумруд', color: [0.15, 0.78, 0.35], solid: true, opaque: true, ore: true, emit: 0.3, hardness: 3 },
  [BLOCK.LAPIS_ORE]: { name: 'лазурит', color: [0.22, 0.35, 0.85], solid: true, opaque: true, ore: true, hardness: 2 },
  [BLOCK.REDSTONE_ORE]: { name: 'редстоун', color: [0.75, 0.15, 0.12], solid: true, opaque: true, ore: true, hardness: 2 },
  [BLOCK.LAVA]: { name: 'лава', color: [0.95, 0.35, 0.08], solid: false, opaque: false, alpha: 0.92, fluid: true, emit: 1.2 },
  [BLOCK.OBSIDIAN]: { name: 'обсидиан', color: [0.12, 0.08, 0.18], solid: true, opaque: true, hardness: 8 },
  [BLOCK.MOSSY]: { name: 'мшистый', color: [0.38, 0.48, 0.32], solid: true, opaque: true },
  [BLOCK.DUNGEON_BRICK]: { name: 'данж.камень', color: [0.32, 0.30, 0.28], solid: true, opaque: true },
  [BLOCK.CHEST]: { name: 'сундук', color: [0.72, 0.48, 0.18], top: [0.55, 0.35, 0.12], solid: true, opaque: true },
  [BLOCK.TORCH]: { name: 'факел', color: [0.85, 0.65, 0.15], solid: false, opaque: false, alpha: 0.95, emit: 1.0, plant: true },
  [BLOCK.GLOWSTONE]: { name: 'светокамень', color: [0.95, 0.85, 0.35], solid: true, opaque: true, emit: 1.4 },
  [BLOCK.BEDROCK]: { name: 'бедрок', color: [0.18, 0.18, 0.20], solid: true, opaque: true, hardness: 999 },
  [BLOCK.SANDSTONE]: { name: 'песчаник', color: [0.82, 0.74, 0.48], solid: true, opaque: true },
  [BLOCK.RED_SAND]: { name: 'красн.песок', color: [0.78, 0.42, 0.22], solid: true, opaque: true },
  [BLOCK.TERRACOTTA]: { name: 'терракота', color: [0.70, 0.38, 0.28], solid: true, opaque: true },
  [BLOCK.PUMPKIN]: { name: 'тыква', color: [0.90, 0.55, 0.12], solid: true, opaque: true },
  [BLOCK.MYCELIUM]: { name: 'мицелий', color: [0.45, 0.38, 0.48], top: [0.55, 0.45, 0.58], solid: true, opaque: true, drop: BLOCK.DIRT },
  [BLOCK.BIRCH]: { name: 'берёза', color: [0.85, 0.85, 0.80], top: [0.55, 0.45, 0.30], solid: true, opaque: true },
  [BLOCK.BIRCH_LEAVES]: { name: 'бер.листва', color: [0.45, 0.70, 0.35], solid: true, opaque: false, alpha: 0.85 },
  [BLOCK.WOOL_RED]: { name: 'шерсть кр.', color: [0.82, 0.18, 0.18], solid: true, opaque: true },
  [BLOCK.WOOL_BLUE]: { name: 'шерсть син.', color: [0.22, 0.35, 0.82], solid: true, opaque: true },
  [BLOCK.WOOL_YELLOW]: { name: 'шерсть жёл.', color: [0.92, 0.82, 0.18], solid: true, opaque: true },
  [BLOCK.TNT]: { name: 'динамит', color: [0.85, 0.25, 0.18], top: [0.92, 0.92, 0.92], solid: true, opaque: true },
  [BLOCK.BOOKSHELF]: { name: 'книги', color: [0.55, 0.35, 0.18], solid: true, opaque: true },
  [BLOCK.IRON_BLOCK]: { name: 'блок железа', color: [0.82, 0.82, 0.85], solid: true, opaque: true },
  [BLOCK.GOLD_BLOCK]: { name: 'блок золота', color: [0.95, 0.78, 0.18], solid: true, opaque: true },
  [BLOCK.DIAMOND_BLOCK]: { name: 'блок алмаза', color: [0.35, 0.88, 0.85], solid: true, opaque: true },
  [BLOCK.SPAWNER]: { name: 'спавнер', color: [0.25, 0.25, 0.28], solid: true, opaque: false, alpha: 0.7 },
  [BLOCK.CRAFTING]: { name: 'верстак', color: [0.65, 0.48, 0.25], solid: true, opaque: true },
  [BLOCK.FURNACE]: { name: 'печь', color: [0.45, 0.45, 0.48], solid: true, opaque: true },
  [BLOCK.SOUL_SAND]: { name: 'песок душ', color: [0.35, 0.28, 0.22], solid: true, opaque: true },
  [BLOCK.END_STONE]: { name: 'камень края', color: [0.86, 0.88, 0.62], solid: true, opaque: true },
  [BLOCK.END_PORTAL]: { name: 'портал края', color: [0.05, 0.02, 0.12], solid: false, opaque: false, alpha: 0.85, emit: 0.6 },
  [BLOCK.END_FRAME]: { name: 'рама края', color: [0.25, 0.55, 0.35], top: [0.15, 0.12, 0.2], solid: true, opaque: true },
  [BLOCK.DRAGON_EGG]: { name: 'яйцо дракона', color: [0.25, 0.08, 0.35], solid: true, opaque: true, emit: 0.5 },
  [BLOCK.END_CRYSTAL]: { name: 'кристалл', color: [0.95, 0.55, 0.95], solid: true, opaque: false, alpha: 0.7, emit: 1.5 },
  [BLOCK.NETHERRACK]: { name: 'незерак', color: [0.55, 0.22, 0.22], solid: true, opaque: true },
  [BLOCK.PORTAL]: { name: 'портал', color: [0.45, 0.15, 0.75], solid: false, opaque: false, alpha: 0.55, emit: 0.8 },
};

const ITEM_META = {
  [ITEM.STICK]: { name: 'палка', color: '#8b5a2b' },
  [ITEM.APPLE]: { name: 'яблоко', color: '#e74c3c', food: 4 },
  [ITEM.BEEF]: { name: 'мясо', color: '#a04030', food: 8 },
  [ITEM.ARROW]: { name: 'стрела', color: '#c0c0c0' },
  [ITEM.GUNPOWDER]: { name: 'порох', color: '#666' },
  [ITEM.ENDER_PEARL]: { name: 'жемчуг края', color: '#1a8a6a' },
  [ITEM.WOOD_PICK]: { name: 'дер.кирка', color: '#a67c52', pick: 1, speed: 2 },
  [ITEM.STONE_PICK]: { name: 'кам.кирка', color: '#888', pick: 2, speed: 3.5 },
  [ITEM.IRON_PICK]: { name: 'жел.кирка', color: '#ddd', pick: 3, speed: 5 },
  [ITEM.DIAMOND_PICK]: { name: 'алм.кирка', color: '#5ef', pick: 4, speed: 8 },
  [ITEM.WOOD_SWORD]: { name: 'дер.меч', color: '#a67c52', sword: 3 },
  [ITEM.STONE_SWORD]: { name: 'кам.меч', color: '#888', sword: 4 },
  [ITEM.IRON_SWORD]: { name: 'жел.меч', color: '#ddd', sword: 6 },
  [ITEM.DIAMOND_SWORD]: { name: 'алм.меч', color: '#5ef', sword: 8 },
  [ITEM.WITHER_SKULL]: { name: 'череп визера', color: '#222' },
  [ITEM.IRON_INGOT]: { name: 'слиток железа', color: '#ccc' },
  [ITEM.GOLD_INGOT]: { name: 'слиток золота', color: '#fc0' },
  [ITEM.DIAMOND]: { name: 'алмаз', color: '#5ef' },
  [ITEM.COAL]: { name: 'уголь', color: '#333' },
};

function metaOf(id) {
  return BLOCK_META[id] || ITEM_META[id] || { name: '?', color: [0.5, 0.5, 0.5] };
}
function isBlock(id) { return id > 0 && id < 100 && BLOCK_META[id]; }
function isItem(id) { return id >= 100; }
function nameOf(id) { return metaOf(id).name || '?'; }

const CREATIVE_PAGES = [
  [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.COBBLE, BLOCK.MOSSY, BLOCK.GRAVEL, BLOCK.CLAY, BLOCK.BEDROCK, BLOCK.OBSIDIAN],
  [BLOCK.WOOD, BLOCK.BIRCH, BLOCK.PLANKS, BLOCK.LEAVES, BLOCK.CRAFTING, BLOCK.FURNACE, BLOCK.CHEST, BLOCK.TORCH, BLOCK.TNT],
  [BLOCK.SAND, BLOCK.RED_SAND, BLOCK.SANDSTONE, BLOCK.TERRACOTTA, BLOCK.CACTUS, BLOCK.SNOW, BLOCK.SOUL_SAND, BLOCK.NETHERRACK, BLOCK.MYCELIUM],
  [BLOCK.COAL_ORE, BLOCK.IRON_ORE, BLOCK.GOLD_ORE, BLOCK.DIAMOND_ORE, BLOCK.EMERALD_ORE, BLOCK.GLOWSTONE, BLOCK.END_STONE, BLOCK.END_FRAME, BLOCK.END_CRYSTAL],
  [BLOCK.IRON_BLOCK, BLOCK.GOLD_BLOCK, BLOCK.DIAMOND_BLOCK, BLOCK.BRICK, BLOCK.GLASS, BLOCK.WOOL_RED, BLOCK.WATER, BLOCK.LAVA, BLOCK.PORTAL],
  [ITEM.WOOD_PICK, ITEM.STONE_PICK, ITEM.IRON_PICK, ITEM.DIAMOND_PICK, ITEM.WOOD_SWORD, ITEM.IRON_SWORD, ITEM.DIAMOND_SWORD, ITEM.APPLE, ITEM.BEEF],
  [ITEM.STICK, ITEM.COAL, ITEM.IRON_INGOT, ITEM.GOLD_INGOT, ITEM.DIAMOND, ITEM.ARROW, ITEM.GUNPOWDER, ITEM.ENDER_PEARL, ITEM.WITHER_SKULL],
];

const RECIPES = [
  { name: '4 доски', need: [[BLOCK.WOOD, 1]], out: [BLOCK.PLANKS, 4] },
  { name: '4 доски (берёза)', need: [[BLOCK.BIRCH, 1]], out: [BLOCK.PLANKS, 4] },
  { name: '4 палки', need: [[BLOCK.PLANKS, 2]], out: [ITEM.STICK, 4] },
  { name: 'Верстак', need: [[BLOCK.PLANKS, 4]], out: [BLOCK.CRAFTING, 1] },
  { name: 'Печь', need: [[BLOCK.COBBLE, 8]], out: [BLOCK.FURNACE, 1] },
  { name: 'Факелы ×4', need: [[ITEM.COAL, 1], [ITEM.STICK, 1]], out: [BLOCK.TORCH, 4] },
  { name: 'Дер.кирка', need: [[BLOCK.PLANKS, 3], [ITEM.STICK, 2]], out: [ITEM.WOOD_PICK, 1] },
  { name: 'Кам.кирка', need: [[BLOCK.COBBLE, 3], [ITEM.STICK, 2]], out: [ITEM.STONE_PICK, 1] },
  { name: 'Жел.кирка', need: [[ITEM.IRON_INGOT, 3], [ITEM.STICK, 2]], out: [ITEM.IRON_PICK, 1] },
  { name: 'Алм.кирка', need: [[ITEM.DIAMOND, 3], [ITEM.STICK, 2]], out: [ITEM.DIAMOND_PICK, 1] },
  { name: 'Дер.меч', need: [[BLOCK.PLANKS, 2], [ITEM.STICK, 1]], out: [ITEM.WOOD_SWORD, 1] },
  { name: 'Кам.меч', need: [[BLOCK.COBBLE, 2], [ITEM.STICK, 1]], out: [ITEM.STONE_SWORD, 1] },
  { name: 'Жел.меч', need: [[ITEM.IRON_INGOT, 2], [ITEM.STICK, 1]], out: [ITEM.IRON_SWORD, 1] },
  { name: 'Алм.меч', need: [[ITEM.DIAMOND, 2], [ITEM.STICK, 1]], out: [ITEM.DIAMOND_SWORD, 1] },
  { name: 'Слиток железа', need: [[BLOCK.IRON_ORE, 1], [ITEM.COAL, 1]], out: [ITEM.IRON_INGOT, 1] },
  { name: 'Слиток золота', need: [[BLOCK.GOLD_ORE, 1], [ITEM.COAL, 1]], out: [ITEM.GOLD_INGOT, 1] },
  { name: 'TNT', need: [[ITEM.GUNPOWDER, 5], [BLOCK.SAND, 4]], out: [BLOCK.TNT, 1] },
  { name: 'Призыв Визера', need: [[ITEM.WITHER_SKULL, 3], [BLOCK.SOUL_SAND, 4]], out: ['SUMMON_WITHER', 1], special: true },
];

const FACES = [
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], name: 'top' },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], name: 'bottom' },
  { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 0, 0]], name: 'right' },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], name: 'left' },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [0, 1, 1], [1, 1, 1], [1, 0, 1]], name: 'front' },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]], name: 'back' },
];

function hash2(x, z) {
  let n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function noise2(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, oct = 4) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise2(x * f, z * f); a *= 0.5; f *= 2; }
  return v;
}
function noise3(x, y, z) {
  return noise2(x + y * 0.7, z + y * 0.3) * 0.5 + noise2(x * 1.3 + 20, z * 1.1 + y) * 0.5;
}

/* —— Мир —— */
class World {
  constructor() {
    this.blocks = new Uint8Array(WORLD_W * WORLD_H * WORLD_D);
    this.chests = new Map();
    this.dungeons = [];
    this.oreList = null;
    this.village = null;
    this.endArena = null;
    this.endFrame = null;
    this.crystals = [];
    this.generate();
  }

  idx(x, y, z) { return y * WORLD_W * WORLD_D + z * WORLD_W + x; }
  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < WORLD_W && y < WORLD_H && z < WORLD_D;
  }
  get(x, y, z) {
    if (!this.inBounds(x, y, z)) return BLOCK.AIR;
    return this.blocks[this.idx(x | 0, y | 0, z | 0)];
  }
  set(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return false;
    const ix = x | 0, iy = y | 0, iz = z | 0;
    const old = this.blocks[this.idx(ix, iy, iz)];
    this.blocks[this.idx(ix, iy, iz)] = id;
    if (this.oreList) {
      if (ORE_BLOCKS.has(old)) this.oreList = this.oreList.filter(o => !(o.x === ix && o.y === iy && o.z === iz));
      if (ORE_BLOCKS.has(id)) this.oreList.push({ x: ix, y: iy, z: iz, id });
    }
    if (old === BLOCK.END_CRYSTAL) this.crystals = this.crystals.filter(c => !(c.x === ix && c.y === iy && c.z === iz));
    if (id === BLOCK.END_CRYSTAL) this.crystals.push({ x: ix, y: iy, z: iz });
    return true;
  }
  isSolid(x, y, z) {
    const m = BLOCK_META[this.get(x, y, z)];
    return m ? !!m.solid : false;
  }
  isOpaque(x, y, z) {
    const m = BLOCK_META[this.get(x, y, z)];
    return m ? !!m.opaque : false;
  }

  biomeAt(x, z) {
    const t = fbm(x * 0.022 + 5, z * 0.022 + 5, 3);
    const m = fbm(x * 0.028 + 90, z * 0.028 + 90, 3);
    if (t < 0.28 && m > 0.45) return BIOME.SNOW;
    if (t < 0.32) return BIOME.MOUNTAINS;
    if (t > 0.72 && m < 0.4) return BIOME.DESERT;
    if (t > 0.65 && m > 0.55) return BIOME.MESA;
    if (m < 0.32) return BIOME.SWAMP;
    if (m > 0.58) return BIOME.FOREST;
    return BIOME.PLAINS;
  }

  heightAt(x, z, biome) {
    const n = fbm(x * 0.05, z * 0.05, 5);
    const ridge = Math.abs(fbm(x * 0.025 + 40, z * 0.025 + 40, 3) - 0.5) * 2;
    let h;
    switch (biome) {
      case BIOME.MOUNTAINS: h = SEA_LEVEL + Math.floor(n * 10 + ridge * 18 + 4); break;
      case BIOME.DESERT: h = SEA_LEVEL + Math.floor(n * 5 + ridge * 2 - 1); break;
      case BIOME.SNOW: h = SEA_LEVEL + Math.floor(n * 9 + ridge * 8 + 2); break;
      case BIOME.SWAMP: h = SEA_LEVEL + Math.floor(n * 3 - 1); break;
      case BIOME.MESA: h = SEA_LEVEL + Math.floor(n * 6 + ridge * 7 + 1); break;
      case BIOME.FOREST: h = SEA_LEVEL + Math.floor(n * 7 + ridge * 4); break;
      default: h = SEA_LEVEL + Math.floor(n * 6 + ridge * 3);
    }
    return Math.max(3, Math.min(WORLD_H - 14, h));
  }

  generate() {
    for (let x = 0; x < WORLD_W; x++) {
      for (let z = 0; z < WORLD_D; z++) {
        const biome = this.biomeAt(x, z);
        const h = this.heightAt(x, z, biome);
        for (let y = 0; y < WORLD_H; y++) {
          let id = BLOCK.AIR;
          if (y === 0) id = BLOCK.BEDROCK;
          else if (y < h - 5) {
            id = BLOCK.STONE;
            const oreN = hash2(x * 2.1 + y * 5.3, z * 3.7 + y);
            if (y < 22 && oreN > 0.965) id = BLOCK.DIAMOND_ORE;
            else if (y < 24 && oreN > 0.95) id = BLOCK.EMERALD_ORE;
            else if (y < 32 && oreN > 0.925) id = BLOCK.GOLD_ORE;
            else if (oreN > 0.88) id = BLOCK.IRON_ORE;
            else if (oreN > 0.82) id = BLOCK.COAL_ORE;
            else if (oreN > 0.78) id = BLOCK.REDSTONE_ORE;
          } else if (y < h) {
            id = (biome === BIOME.DESERT || biome === BIOME.MESA) ? BLOCK.SANDSTONE
              : biome === BIOME.SWAMP ? BLOCK.CLAY : BLOCK.DIRT;
          } else if (y === h) {
            if (biome === BIOME.DESERT) id = BLOCK.SAND;
            else if (biome === BIOME.MESA) id = h % 3 === 0 ? BLOCK.TERRACOTTA : BLOCK.RED_SAND;
            else if (biome === BIOME.SNOW) id = BLOCK.SNOW_GRASS;
            else if (biome === BIOME.SWAMP) id = h <= SEA_LEVEL + 1 ? BLOCK.MYCELIUM : BLOCK.GRASS;
            else if (biome === BIOME.MOUNTAINS && h > SEA_LEVEL + 16) id = BLOCK.STONE;
            else id = h <= SEA_LEVEL + 1 ? BLOCK.SAND : BLOCK.GRASS;
          } else if (y <= SEA_LEVEL && y > h) {
            id = biome === BIOME.SNOW && y === SEA_LEVEL ? BLOCK.ICE : BLOCK.WATER;
          }
          this.set(x, y, z, id);
        }
        this.decorate(x, h + 1, z, biome);
      }
    }
    this.carveCaves();
    this.placeDungeons(7);
    this.placeMineshaft();
    this.placeVillage();
    this.placeEndFrame();
    this.placeEndArena();
    this.placeLavaPockets();
    this.collectOres();
  }

  collectOres() {
    this.oreList = [];
    this.crystals = [];
    for (let x = 0; x < WORLD_W; x++) {
      for (let y = 0; y < WORLD_H; y++) {
        for (let z = 0; z < WORLD_D; z++) {
          const id = this.get(x, y, z);
          if (ORE_BLOCKS.has(id)) this.oreList.push({ x, y, z, id });
          if (id === BLOCK.END_CRYSTAL) this.crystals.push({ x, y, z });
        }
      }
    }
  }

  decorate(x, y, z, biome) {
    if (y >= WORLD_H - 2) return;
    const r = hash2(x * 4.4, z * 9.1);
    if (biome === BIOME.DESERT && r > 0.94) {
      for (let i = 0; i < 2 + (r * 3 | 0); i++) if (this.get(x, y + i, z) === BLOCK.AIR) this.set(x, y + i, z, BLOCK.CACTUS);
    } else if ((biome === BIOME.FOREST && r > 0.88) || (biome === BIOME.PLAINS && r > 0.97) || (biome === BIOME.SNOW && r > 0.93) || (biome === BIOME.SWAMP && r > 0.91)) {
      this.placeTree(x, y, z, r > 0.95);
    } else if ((biome === BIOME.PLAINS || biome === BIOME.FOREST) && r > 0.985 && this.get(x, y, z) === BLOCK.AIR) {
      this.set(x, y, z, BLOCK.PUMPKIN);
    }
  }

  placeTree(x, y, z, birch) {
    if (x < 2 || z < 2 || x > WORLD_W - 3 || z > WORLD_D - 3) return;
    const trunk = birch ? BLOCK.BIRCH : BLOCK.WOOD;
    const leaves = birch ? BLOCK.BIRCH_LEAVES : BLOCK.LEAVES;
    const trunkH = 4 + (hash2(x, z) * 3 | 0);
    for (let i = 0; i < trunkH; i++) {
      const cur = this.get(x, y + i, z);
      if (cur === BLOCK.AIR || cur === BLOCK.LEAVES || cur === BLOCK.BIRCH_LEAVES) this.set(x, y + i, z, trunk);
    }
    const top = y + trunkH;
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -1; dy <= 2; dy++) {
      if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy !== 0) continue;
      if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) > 4) continue;
      if (this.get(x + dx, top + dy, z + dz) === BLOCK.AIR) this.set(x + dx, top + dy, z + dz, leaves);
    }
  }

  carveCaves() {
    for (let x = 2; x < WORLD_W - 2; x++) for (let z = 2; z < WORLD_D - 2; z++) for (let y = 2; y < WORLD_H - 10; y++) {
      if (noise3(x * 0.08, y * 0.11, z * 0.08) > 0.73 && this.get(x, y, z) === BLOCK.STONE) {
        this.set(x, y, z, y < 6 && hash2(x, z) > 0.75 ? BLOCK.LAVA : BLOCK.AIR);
      }
    }
  }

  placeLavaPockets() {
    for (let i = 0; i < 16; i++) {
      const x = 4 + (hash2(i * 11, 3) * (WORLD_W - 8) | 0);
      const z = 4 + (hash2(i * 7, 9) * (WORLD_D - 8) | 0);
      const y = 2 + (hash2(i, 20) * 7 | 0);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const id = this.get(x + dx, y, z + dz);
        if (id === BLOCK.STONE || id === BLOCK.AIR) this.set(x + dx, y, z + dz, BLOCK.LAVA);
      }
    }
  }

  placeDungeons(count) {
    let placed = 0;
    for (let attempt = 0; attempt < 100 && placed < count; attempt++) {
      const cx = 8 + (hash2(attempt * 17, 41) * (WORLD_W - 16) | 0);
      const cz = 8 + (hash2(attempt * 23, 11) * (WORLD_D - 16) | 0);
      const cy = 4 + (hash2(attempt * 5, 60) * 12 | 0);
      const rw = 4 + (hash2(attempt, 1) * 3 | 0), rd = 4 + (hash2(attempt, 2) * 3 | 0), rh = 3 + (hash2(attempt, 3) * 2 | 0);
      for (let x = cx - rw; x <= cx + rw; x++) for (let z = cz - rd; z <= cz + rd; z++) for (let y = cy; y <= cy + rh; y++) {
        const wall = x === cx - rw || x === cx + rw || z === cz - rd || z === cz + rd || y === cy || y === cy + rh;
        this.set(x, y, z, wall ? (hash2(x + y, z) > 0.65 ? BLOCK.MOSSY : BLOCK.DUNGEON_BRICK) : BLOCK.AIR);
      }
      for (let y = cy + rh; y < Math.min(WORLD_H - 2, cy + rh + 14); y++) {
        this.set(cx, y, cz, BLOCK.AIR); this.set(cx + 1, y, cz, BLOCK.AIR);
      }
      this.set(cx, cy + 1, cz, BLOCK.SPAWNER);
      this.set(cx + rw - 1, cy + 1, cz, BLOCK.CHEST);
      this.chests.set(`${cx + rw - 1},${cy + 1},${cz}`, this.makeLoot(placed));
      this.set(cx - rw + 1, cy + 2, cz, BLOCK.TORCH);
      this.dungeons.push({ x: cx, y: cy, z: cz });
      placed++;
    }
  }

  placeMineshaft() {
    const z = 20 + (hash2(9, 3) * 40 | 0);
    const y = 8;
    for (let x = 10; x < WORLD_W - 10; x++) {
      for (let dy = 0; dy < 3; dy++) for (let dz = -1; dz <= 1; dz++) this.set(x, y + dy, z + dz, BLOCK.AIR);
      if (x % 5 === 0) {
        this.set(x, y, z - 1, BLOCK.PLANKS); this.set(x, y, z + 1, BLOCK.PLANKS);
        this.set(x, y + 2, z, BLOCK.PLANKS); this.set(x, y + 1, z - 1, BLOCK.TORCH);
      }
      if (x % 17 === 0) {
        this.set(x, y, z, BLOCK.CHEST);
        this.chests.set(`${x},${y},${z}`, [{ id: ITEM.IRON_INGOT, n: 3 }, { id: ITEM.COAL, n: 8 }, { id: BLOCK.TORCH, n: 12 }]);
      }
    }
  }

  placeVillage() {
    const vx = 28, vz = 28;
    let h = 0;
    for (let dx = 0; dx < 8; dx++) for (let dz = 0; dz < 8; dz++) h = Math.max(h, this.heightAt(vx + dx, vz + dz, this.biomeAt(vx + dx, vz + dz)));
    this.village = { x: vx + 4, y: h + 1, z: vz + 4 };
    const buildHouse = (ox, oz, w, d) => {
      for (let x = ox; x < ox + w; x++) for (let z = oz; z < oz + d; z++) {
        this.set(x, h, z, BLOCK.COBBLE);
        for (let y = h + 1; y <= h + 3; y++) {
          const wall = x === ox || x === ox + w - 1 || z === oz || z === oz + d - 1;
          this.set(x, y, z, wall ? BLOCK.PLANKS : BLOCK.AIR);
        }
        this.set(x, h + 4, z, BLOCK.WOOD);
      }
      this.set(ox + (w / 2 | 0), h + 1, oz, BLOCK.AIR);
      this.set(ox + 1, h + 2, oz + 1, BLOCK.TORCH);
    };
    buildHouse(vx, vz, 6, 6);
    buildHouse(vx + 9, vz, 5, 5);
    buildHouse(vx, vz + 9, 5, 6);
    this.set(vx + 3, h + 1, vz + 3, BLOCK.CRAFTING);
    this.set(vx + 4, h + 1, vz + 3, BLOCK.FURNACE);
    this.set(vx + 10, h + 1, vz + 2, BLOCK.CHEST);
    this.chests.set(`${vx + 10},${h + 1},${vz + 2}`, [
      { id: ITEM.APPLE, n: 5 }, { id: ITEM.BEEF, n: 3 }, { id: ITEM.WOOD_PICK, n: 1 }, { id: BLOCK.TORCH, n: 16 },
    ]);
  }

  placeEndFrame() {
    const cx = WORLD_W - 18, cz = 18;
    const h = this.heightAt(cx, cz, this.biomeAt(cx, cz)) + 1;
    this.endFrame = { x: cx, y: h, z: cz };
    for (let i = 0; i < 5; i++) {
      this.set(cx - 2 + i, h, cz - 3, BLOCK.END_FRAME);
      this.set(cx - 2 + i, h, cz + 3, BLOCK.END_FRAME);
      this.set(cx - 3, h, cz - 2 + i, BLOCK.END_FRAME);
      this.set(cx + 3, h, cz - 2 + i, BLOCK.END_FRAME);
    }
    for (let x = cx - 2; x <= cx + 2; x++) for (let z = cz - 2; z <= cz + 2; z++) {
      this.set(x, h, z, BLOCK.END_PORTAL);
    }
  }

  placeEndArena() {
    const cx = WORLD_W - 20, cz = WORLD_D - 20, base = WORLD_H - 12;
    this.endArena = { x: cx, y: base + 1, z: cz };
    for (let x = cx - 12; x <= cx + 12; x++) for (let z = cz - 12; z <= cz + 12; z++) {
      if (Math.hypot(x - cx, z - cz) <= 12) this.set(x, base, z, BLOCK.END_STONE);
    }
    const pillars = [[-8, -8], [8, -8], [-8, 8], [8, 8], [0, -10], [0, 10]];
    for (const [px, pz] of pillars) {
      for (let y = 1; y <= 5; y++) this.set(cx + px, base + y, cz + pz, BLOCK.OBSIDIAN);
      this.set(cx + px, base + 6, cz + pz, BLOCK.END_CRYSTAL);
    }
  }

  makeLoot(seed) {
    const pool = [
      { id: ITEM.DIAMOND, n: 2 }, { id: ITEM.IRON_INGOT, n: 5 }, { id: ITEM.GOLD_INGOT, n: 3 },
      { id: ITEM.BEEF, n: 4 }, { id: BLOCK.TORCH, n: 16 }, { id: ITEM.WITHER_SKULL, n: 1 },
      { id: ITEM.ENDER_PEARL, n: 2 }, { id: ITEM.GUNPOWDER, n: 6 }, { id: BLOCK.SOUL_SAND, n: 4 },
    ];
    const loot = [];
    const n = 4 + (hash2(seed, 99) * 3 | 0);
    for (let i = 0; i < n; i++) loot.push({ ...pool[(hash2(seed * 3 + i, 7) * pool.length) | 0] });
    return loot;
  }

  openChest(x, y, z) {
    const key = `${x},${y},${z}`;
    const loot = this.chests.get(key);
    if (!loot) return null;
    this.chests.delete(key);
    return loot;
  }

  raycast(ox, oy, oz, dx, dy, dz, maxDist = REACH) {
    let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;
    const tDeltaX = stepX ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = stepY ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = stepZ ? Math.abs(1 / dz) : Infinity;
    let tMaxX = stepX > 0 ? (Math.floor(ox) + 1 - ox) * tDeltaX : stepX < 0 ? (ox - Math.floor(ox)) * tDeltaX : Infinity;
    let tMaxY = stepY > 0 ? (Math.floor(oy) + 1 - oy) * tDeltaY : stepY < 0 ? (oy - Math.floor(oy)) * tDeltaY : Infinity;
    let tMaxZ = stepZ > 0 ? (Math.floor(oz) + 1 - oz) * tDeltaZ : stepZ < 0 ? (oz - Math.floor(oz)) * tDeltaZ : Infinity;
    let faceX = 0, faceY = 0, faceZ = 0, dist = 0;
    for (let i = 0; i < maxDist * 4; i++) {
      const id = this.get(x, y, z);
      const meta = BLOCK_META[id];
      if (id !== BLOCK.AIR && meta && (meta.solid || meta.plant)) {
        return { x, y, z, nx: faceX, ny: faceY, nz: faceZ, dist, id };
      }
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) { dist = tMaxX; tMaxX += tDeltaX; x += stepX; faceX = -stepX; faceY = 0; faceZ = 0; }
        else { dist = tMaxZ; tMaxZ += tDeltaZ; z += stepZ; faceX = 0; faceY = 0; faceZ = -stepZ; }
      } else if (tMaxY < tMaxZ) {
        dist = tMaxY; tMaxY += tDeltaY; y += stepY; faceX = 0; faceY = -stepY; faceZ = 0;
      } else {
        dist = tMaxZ; tMaxZ += tDeltaZ; z += stepZ; faceX = 0; faceY = 0; faceZ = -stepZ;
      }
      if (dist > maxDist) break;
    }
    return null;
  }
}

/* —— Меш —— */
function buildMesh(world) {
  const solid = { pos: [], nor: [], col: [], idx: [], vc: 0 };
  const glass = { pos: [], nor: [], col: [], idx: [], vc: 0 };
  const emitters = [];
  for (let x = 0; x < WORLD_W; x++) for (let y = 0; y < WORLD_H; y++) for (let z = 0; z < WORLD_D; z++) {
    const id = world.get(x, y, z);
    if (id === BLOCK.AIR) continue;
    const meta = BLOCK_META[id];
    if (!meta) continue;
    if (meta.emit) emitters.push({ x: x + 0.5, y: y + 0.5, z: z + 0.5, e: meta.emit, id });
    const target = meta.opaque ? solid : glass;
    for (const face of FACES) {
      const nx = x + face.dir[0], ny = y + face.dir[1], nz = z + face.dir[2];
      const neighbor = world.get(nx, ny, nz);
      const nMeta = BLOCK_META[neighbor];
      let show;
      if (meta.plant) show = neighbor === BLOCK.AIR || (nMeta && !nMeta.opaque);
      else if (meta.opaque) show = !world.isOpaque(nx, ny, nz);
      else if (neighbor === BLOCK.AIR) show = true;
      else if (nMeta && nMeta.opaque) show = false;
      else show = neighbor !== id;
      if (!show) continue;
      let col = meta.color;
      if (face.name === 'top' && meta.top) col = meta.top;
      else if (face.name === 'bottom') col = meta.color.map(c => c * 0.6);
      else if (face.name === 'left' || face.name === 'right') col = meta.color.map(c => c * 0.78);
      else col = meta.color.map(c => c * 0.9);
      const shade = 0.9 + hash2(x + y * 0.3, z) * 0.18;
      const emitBoost = meta.emit ? 1.25 : 1;
      const alpha = meta.alpha ?? 1;
      const r = Math.min(1, col[0] * shade * emitBoost);
      const g = Math.min(1, col[1] * shade * emitBoost);
      const b = Math.min(1, col[2] * shade * emitBoost);
      for (const c of face.corners) {
        if (meta.plant) {
          const s = 0.2, ox = 0.5 - s / 2, oz = 0.5 - s / 2;
          target.pos.push(x + ox + c[0] * s, y + c[1] * 0.7, z + oz + c[2] * s);
        } else target.pos.push(x + c[0], y + c[1], z + c[2]);
        target.nor.push(face.dir[0], face.dir[1], face.dir[2]);
        target.col.push(r, g, b, alpha);
      }
      target.idx.push(target.vc, target.vc + 1, target.vc + 2, target.vc, target.vc + 2, target.vc + 3);
      target.vc += 4;
    }
  }
  function makeGeo(b) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 4));
    geo.setIndex(b.idx);
    geo.computeBoundingSphere();
    return geo;
  }
  return { solid: makeGeo(solid), transparent: makeGeo(glass), emitters };
}

/* —— Игрок —— */
class Player {
  constructor(world, camera) {
    this.world = world;
    this.camera = camera;
    this.pos = new THREE.Vector3(WORLD_W / 2, SEA_LEVEL + 20, WORLD_D / 2);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = -0.25;
    this.onGround = false;
    {
      let GOD = false;
      try {
        GOD = !!(
          window.__AMAL_GOD__ ||
          window.__AMAL_OWNER__ ||
          localStorage.getItem("amal-owner-v1") === "1" ||
          localStorage.getItem("amal-owner-v2") === "1" ||
          localStorage.getItem("amal-owner-v3") === "1" ||
          new URLSearchParams(location.search).get("owner") ||
          (window.AmalPowers && AmalPowers.god && AmalPowers.god()) ||
          (window.AmalHub && AmalHub.isOwner && AmalHub.isOwner()) ||
          (window.AmalOwner && AmalOwner.isOwner && AmalOwner.isOwner())
        );
      } catch (_) {}
      this.creative = GOD;
      this.admin = GOD;
      this.flying = GOD;
      this.noclip = GOD;
    }
    this.xray = 0;
    this.page = 0;
    this.selected = 0;
    this.keys = {};
    this.inWater = false;
    this.hp = 20;
    this.maxHp = 20;
    this.food = 20;
    this.maxFood = 20;
    this.inv = Array.from({ length: 9 }, () => null);
    this.fallStart = null;
    this.hurtCd = 0;
    this.dead = false;
    this.portalCd = 0;
  }

  get heldId() {
    if (this.creative) return CREATIVE_PAGES[this.page][this.selected];
    return this.inv[this.selected]?.id ?? 0;
  }

  spawnSafe() {
    const cx = this.world.village ? this.world.village.x : (WORLD_W / 2 | 0);
    const cz = this.world.village ? this.world.village.z : (WORLD_D / 2 | 0);
    for (let y = WORLD_H - 2; y > 0; y--) {
      if (this.world.isSolid(cx, y, cz)) {
        this.pos.set(cx + 0.5, y + 1.1, cz + 0.5);
        this.vel.set(0, 0, 0);
        return;
      }
    }
  }

  give(id, n = 1) {
    if (this.creative) return true;
    for (const slot of this.inv) {
      if (slot && slot.id === id && slot.n < 64) {
        const add = Math.min(64 - slot.n, n);
        slot.n += add; n -= add;
        if (n <= 0) return true;
      }
    }
    for (let i = 0; i < 9 && n > 0; i++) {
      if (!this.inv[i]) {
        const take = Math.min(64, n);
        this.inv[i] = { id, n: take };
        n -= take;
      }
    }
    return n <= 0;
  }

  take(id, n = 1) {
    if (this.creative) return true;
    let left = n;
    for (const slot of this.inv) {
      if (slot && slot.id === id) {
        const use = Math.min(slot.n, left);
        slot.n -= use; left -= use;
      }
    }
    this.inv = this.inv.map(s => (s && s.n > 0 ? s : null));
    return left <= 0;
  }

  countItem(id) {
    if (this.creative) return 999;
    return this.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  }

  consumeHeld() {
    if (this.creative) return;
    const s = this.inv[this.selected];
    if (!s) return;
    s.n--;
    if (s.n <= 0) this.inv[this.selected] = null;
  }

  eyePos() {
    return new THREE.Vector3(this.pos.x, this.pos.y + PLAYER_H * 0.9, this.pos.z);
  }

  updateCamera() {
    const eye = this.eyePos();
    this.camera.position.copy(eye);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  hurt(amount, ignoreAdmin = false) {
    if (this.dead) return;
    if (this.admin && !ignoreAdmin) return;
    if (this.creative && !ignoreAdmin) return;
    if (this.hurtCd > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.hurtCd = 0.6;
    if (this.hp <= 0) this.die();
  }

  die() {
    this.dead = true;
    this.flying = false;
    this.noclip = false;
  }

  respawn() {
    this.dead = false;
    this.hp = this.maxHp;
    this.food = Math.max(6, this.food);
    this.spawnSafe();
    if (this.admin || this.creative) {
      this.flying = true;
      this.noclip = true;
    }
  }

  collideAxis(axis, amount) {
    this.pos[axis] += amount;
    const minX = this.pos.x - PLAYER_R, maxX = this.pos.x + PLAYER_R;
    const minY = this.pos.y, maxY = this.pos.y + PLAYER_H;
    const minZ = this.pos.z - PLAYER_R, maxZ = this.pos.z + PLAYER_R;
    for (let x = Math.floor(minX); x <= Math.floor(maxX); x++)
      for (let y = Math.floor(minY); y <= Math.floor(maxY); y++)
        for (let z = Math.floor(minZ); z <= Math.floor(maxZ); z++) {
          if (!this.world.isSolid(x, y, z)) continue;
          if (axis === 'x') {
            this.pos.x = amount > 0 ? x - PLAYER_R - 0.001 : x + 1 + PLAYER_R + 0.001;
            this.vel.x = 0; return true;
          }
          if (axis === 'y') {
            if (amount > 0) { this.pos.y = y - PLAYER_H - 0.001; this.vel.y = 0; }
            else { this.pos.y = y + 1.001; this.vel.y = 0; this.onGround = true; }
            return true;
          }
          if (axis === 'z') {
            this.pos.z = amount > 0 ? z - PLAYER_R - 0.001 : z + 1 + PLAYER_R + 0.001;
            this.vel.z = 0; return true;
          }
        }
    return false;
  }

  update(dt) {
    if (this.dead) { this.updateCamera(); return; }
    this.hurtCd = Math.max(0, this.hurtCd - dt);
    this.portalCd = Math.max(0, this.portalCd - dt);
    const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    this.updateCamera();
    const lookFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const flatFwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const feet = this.world.get(Math.floor(this.pos.x), Math.floor(this.pos.y + 0.2), Math.floor(this.pos.z));
    const head = this.world.get(Math.floor(this.pos.x), Math.floor(this.pos.y + PLAYER_H * 0.8), Math.floor(this.pos.z));
    this.inWater = feet === BLOCK.WATER || head === BLOCK.WATER;
    if (feet === BLOCK.LAVA || head === BLOCK.LAVA) this.hurt(4 * dt * 5);

    if (this.portalCd <= 0 && (feet === BLOCK.END_PORTAL || head === BLOCK.END_PORTAL) && this.world.endArena) {
      this.portalCd = 3;
      this.pos.set(this.world.endArena.x + 0.5, this.world.endArena.y + 1, this.world.endArena.z + 0.5);
    }

    const canFly = this.flying || this.noclip;
    if (canFly) {
      this.fallStart = null;
      const spd = this.noclip ? NOCLIP_SPEED : FLY_SPEED;
      const mult = sprint ? 2.4 : 1;
      let vx = 0, vy = 0, vz = 0;
      if (this.keys['KeyW']) { vx += lookFwd.x; vy += lookFwd.y; vz += lookFwd.z; }
      if (this.keys['KeyS']) { vx -= lookFwd.x; vy -= lookFwd.y; vz -= lookFwd.z; }
      if (this.keys['KeyD']) { vx += right.x; vz += right.z; }
      if (this.keys['KeyA']) { vx -= right.x; vz -= right.z; }
      const len = Math.hypot(vx, vy, vz);
      if (len > 0.001) { vx = vx / len * spd * mult; vy = vy / len * spd * mult; vz = vz / len * spd * mult; }
      this.vel.set(vx, vy, vz);
      this.pos.x += vx * dt; this.pos.y += vy * dt; this.pos.z += vz * dt;
      if (!this.noclip) {
        const bx = Math.floor(this.pos.x), by = Math.floor(this.pos.y), bz = Math.floor(this.pos.z);
        if (this.world.isSolid(bx, by, bz) || this.world.isSolid(bx, by + 1, bz)) {
          for (let y = by; y < WORLD_H; y++) {
            if (!this.world.isSolid(bx, y, bz) && !this.world.isSolid(bx, y + 1, bz)) { this.pos.y = y + 0.05; break; }
          }
        }
      }
    } else {
      let mx = 0, mz = 0;
      if (this.keys['KeyW']) { mx += flatFwd.x; mz += flatFwd.z; }
      if (this.keys['KeyS']) { mx -= flatFwd.x; mz -= flatFwd.z; }
      if (this.keys['KeyD']) { mx += right.x; mz += right.z; }
      if (this.keys['KeyA']) { mx -= right.x; mz -= right.z; }
      const len = Math.hypot(mx, mz);
      if (len > 0) { mx /= len; mz /= len; }
      const speed = MOVE_SPEED * (sprint ? SPRINT_MULT : 1) * (this.inWater ? 0.55 : 1);
      this.vel.x = mx * speed; this.vel.z = mz * speed;
      if (this.inWater) {
        this.vel.y -= GRAVITY * 0.25 * dt;
        if (this.keys['Space']) this.vel.y = 4.5;
        this.vel.y *= 0.96;
        this.fallStart = null;
      } else {
        if (this.vel.y < 0 && this.fallStart == null) this.fallStart = this.pos.y;
        this.vel.y -= GRAVITY * dt;
        if (this.onGround && this.keys['Space']) { this.vel.y = JUMP_VEL; this.onGround = false; }
      }
      this.onGround = false;
      this.collideAxis('y', this.vel.y * dt);
      if (this.onGround && this.fallStart != null) {
        const fall = this.fallStart - this.pos.y;
        if (fall > 4) this.hurt(Math.floor(fall - 3));
        this.fallStart = null;
      }
      this.collideAxis('x', this.vel.x * dt);
      this.collideAxis('z', this.vel.z * dt);
    }

    this.pos.x = Math.max(0.5, Math.min(WORLD_W - 0.5, this.pos.x));
    this.pos.z = Math.max(0.5, Math.min(WORLD_D - 0.5, this.pos.z));
    this.pos.y = Math.max(0.1, Math.min(WORLD_H + 40, this.pos.y));
    if (this.pos.y < -5) this.spawnSafe();
    this.updateCamera();
  }
}

/* —— Мобы —— */
const MOB_TYPES = {
  zombie: { name: 'Зомби', hp: 20, speed: 2.8, damage: 3, color: 0x2d5a27, w: 0.6, h: 1.8, burn: true, loot: [[ITEM.BEEF, 1]] },
  skeleton: { name: 'Скелет', hp: 20, speed: 2.6, damage: 2, color: 0xd0d0d0, w: 0.6, h: 1.8, burn: true, ranged: true, loot: [[ITEM.ARROW, 4]] },
  creeper: { name: 'Крипер', hp: 20, speed: 2.4, damage: 0, color: 0x3d8a3d, w: 0.6, h: 1.6, burn: false, explode: true, loot: [[ITEM.GUNPOWDER, 2]] },
  spider: { name: 'Паук', hp: 16, speed: 3.4, damage: 2, color: 0x2a1a1a, w: 1.2, h: 0.8, burn: false, loot: [[ITEM.BEEF, 1]] },
  enderman: { name: 'Эндермен', hp: 40, speed: 3.2, damage: 5, color: 0x1a0a2a, w: 0.6, h: 2.6, burn: false, teleport: true, loot: [[ITEM.ENDER_PEARL, 1]] },
};

class Mob {
  constructor(type, x, y, z, scene) {
    this.type = type;
    this.def = MOB_TYPES[type];
    this.pos = new THREE.Vector3(x, y, z);
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.alive = true;
    this.attackCd = 0;
    this.fuse = 0;
    this.angry = type !== 'enderman';
    this.mesh = this.makeMesh();
    scene.add(this.mesh);
  }

  makeMesh() {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: this.def.color });
    const body = new THREE.Mesh(new THREE.BoxGeometry(this.def.w, this.def.h * 0.55, this.def.w * 0.7), mat);
    body.position.y = this.def.h * 0.45;
    const head = new THREE.Mesh(new THREE.BoxGeometry(this.def.w * 0.85, this.def.h * 0.35, this.def.w * 0.85), mat);
    head.position.y = this.def.h * 0.85;
    g.add(body); g.add(head);
    if (this.type === 'creeper') {
      const head2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
      head2.position.y = this.def.h + 0.1;
      g.add(head2);
    }
    return g;
  }

  update(dt, player, world, explodeFn, projectiles) {
    if (!this.alive) return;
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);

    const toP = new THREE.Vector3().subVectors(player.pos, this.pos);
    const dist = toP.length();
    toP.y = 0;
    if (toP.length() > 0.01) toP.normalize();

    // День — горение
    const day = true; // обновится снаружи через mob.dayBurn
    if (this._dayBurn && this.def.burn && dist > 1) {
      this.hp -= 4 * dt;
      if (this.hp <= 0) { this.kill(player); return; }
    }

    if (this.type === 'enderman' && !this.angry) {
      // злится если игрок смотрит
      return;
    }

    if (this.def.explode && dist < 12) {
      this.pos.x += toP.x * this.def.speed * dt;
      this.pos.z += toP.z * this.def.speed * dt;
      this.pos.y = this.groundY(world);
      if (dist < 2.5) {
        this.fuse += dt;
        this.mesh.scale.setScalar(1 + Math.sin(this.fuse * 20) * 0.1);
        if (this.fuse > 1.4) {
          explodeFn(Math.floor(this.pos.x), Math.floor(this.pos.y), Math.floor(this.pos.z), 3);
          player.hurt(10);
          this.kill(player);
        }
      } else this.fuse = Math.max(0, this.fuse - dt * 2);
      return;
    }

    if (this.def.ranged && dist < 16) {
      if (dist < 6) {
        this.pos.x -= toP.x * this.def.speed * dt;
        this.pos.z -= toP.z * this.def.speed * dt;
      } else if (dist > 10) {
        this.pos.x += toP.x * this.def.speed * dt;
        this.pos.z += toP.z * this.def.speed * dt;
      }
      this.pos.y = this.groundY(world);
      if (this.attackCd <= 0 && dist < 18) {
        this.attackCd = 1.6;
        const dir = new THREE.Vector3().subVectors(player.eyePos(), this.pos.clone().add(new THREE.Vector3(0, 1.2, 0))).normalize();
        projectiles.push({
          pos: this.pos.clone().add(new THREE.Vector3(0, 1.2, 0)),
          vel: dir.multiplyScalar(18),
          life: 2,
          damage: 3,
          mesh: null,
        });
      }
      return;
    }

    if (this.def.teleport && this.angry && dist < 20) {
      if (dist > 3) {
        this.pos.x += toP.x * this.def.speed * 1.2 * dt;
        this.pos.z += toP.z * this.def.speed * 1.2 * dt;
      }
      this.pos.y = this.groundY(world);
      if (dist < 2.2 && this.attackCd <= 0) {
        player.hurt(this.def.damage);
        this.attackCd = 1;
        // телепорт назад
        this.pos.x -= toP.x * 6;
        this.pos.z -= toP.z * 6;
        this.pos.y = this.groundY(world);
      }
      return;
    }

    if (dist < 24 && this.angry) {
      this.pos.x += toP.x * this.def.speed * dt;
      this.pos.z += toP.z * this.def.speed * dt;
      this.pos.y = this.groundY(world);
      if (dist < 1.8 && this.attackCd <= 0) {
        player.hurt(this.def.damage);
        this.attackCd = 1.1;
      }
    }
  }

  groundY(world) {
    const x = Math.floor(this.pos.x), z = Math.floor(this.pos.z);
    for (let y = Math.min(WORLD_H - 2, Math.floor(this.pos.y) + 2); y > 0; y--) {
      if (world.isSolid(x, y, z) && !world.isSolid(x, y + 1, z)) return y + 1;
    }
    return this.pos.y;
  }

  hit(dmg, player) {
    this.hp -= dmg;
    this.angry = true;
    if (this.type === 'enderman') this.angry = true;
    if (this.hp <= 0) this.kill(player);
  }

  kill(player) {
    this.alive = false;
    for (const [id, n] of this.def.loot) player.give(id, n);
  }

  dispose(scene) {
    scene.remove(this.mesh);
    this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  }
}

/* —— Боссы —— */
class WitherBoss {
  constructor(x, y, z, scene) {
    this.pos = new THREE.Vector3(x, y, z);
    this.hp = 300;
    this.maxHp = 300;
    this.alive = true;
    this.shootCd = 0;
    this.mesh = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat);
    this.mesh.add(body);
    for (const ox of [-0.9, 0, 0.9]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), mat);
      h.position.set(ox, 1.1, 0);
      this.mesh.add(h);
    }
    scene.add(this.mesh);
  }

  update(dt, player, projectiles) {
    if (!this.alive) return;
    this.shootCd -= dt;
    const t = performance.now() * 0.001;
    this.pos.y += Math.sin(t * 2) * 0.01;
    const to = new THREE.Vector3().subVectors(player.pos, this.pos);
    if (to.length() > 4) {
      to.normalize();
      this.pos.x += to.x * 3 * dt;
      this.pos.z += to.z * 3 * dt;
    }
    this.mesh.position.copy(this.pos);
    if (this.shootCd <= 0) {
      this.shootCd = 1.2;
      const dir = new THREE.Vector3().subVectors(player.eyePos(), this.pos).normalize();
      projectiles.push({
        pos: this.pos.clone(),
        vel: dir.multiplyScalar(14),
        life: 3,
        damage: 6,
        wither: true,
        mesh: null,
      });
    }
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.alive = false;
  }

  dispose(scene) {
    scene.remove(this.mesh);
  }
}

class EnderDragon {
  constructor(arena, scene) {
    this.arena = arena;
    this.angle = 0;
    this.hp = 200;
    this.maxHp = 200;
    this.alive = true;
    this.breathCd = 0;
    this.pos = new THREE.Vector3(arena.x + 10, arena.y + 8, arena.z);
    this.mesh = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x1a0828 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1.5), mat);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 2), mat);
    head.position.set(0, 0.3, 1.8);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 1.5), mat);
    wingL.position.set(-2.5, 0.4, 0);
    const wingR = wingL.clone(); wingR.position.x = 2.5;
    this.mesh.add(body, head, wingL, wingR);
    this.wingL = wingL; this.wingR = wingR;
    scene.add(this.mesh);
  }

  update(dt, player, world, projectiles) {
    if (!this.alive) return;
    this.breathCd -= dt;
    // лечение от кристаллов
    if (world.crystals.length) this.hp = Math.min(this.maxHp, this.hp + 4 * dt);

    this.angle += dt * 0.55;
    const r = 10;
    this.pos.set(
      this.arena.x + Math.cos(this.angle) * r,
      this.arena.y + 6 + Math.sin(this.angle * 2) * 1.5,
      this.arena.z + Math.sin(this.angle) * r
    );
    this.mesh.position.copy(this.pos);
    this.mesh.lookAt(this.arena.x, this.arena.y + 4, this.arena.z);
    this.wingL.rotation.z = Math.sin(performance.now() * 0.01) * 0.4;
    this.wingR.rotation.z = -Math.sin(performance.now() * 0.01) * 0.4;

    const dist = this.pos.distanceTo(player.pos);
    if (this.breathCd <= 0 && dist < 28) {
      this.breathCd = 2.2;
      const dir = new THREE.Vector3().subVectors(player.eyePos(), this.pos).normalize();
      projectiles.push({
        pos: this.pos.clone(),
        vel: dir.multiplyScalar(16),
        life: 2.5,
        damage: 8,
        dragon: true,
        mesh: null,
      });
    }
    if (dist < 3) player.hurt(2);
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.alive = false;
  }

  dispose(scene) {
    scene.remove(this.mesh);
  }
}

/* —— UI —— */
function createUI(app) {
  app.innerHTML = `
    <canvas id="game-canvas"></canvas>
    <div class="screen" id="menu">
      <div class="logo">CRAFTWORLD</div>
      <p class="tagline">Minecraft-ядро · мобы · боссы · крафт</p>
      <button class="btn" id="btn-play">Креатив + админ</button>
      <button class="btn btn-alt" id="btn-survival">Выживание</button>
      <div class="controls-hint">
        <strong>WASD</strong> взгляд=полёт · <strong>X</strong> x-ray · <strong>V</strong> админ · <strong>N</strong> noclip<br/>
        <strong>E</strong> сундук/крафт · <strong>G</strong> данж/Край · <strong>K</strong> крафт · <strong>B</strong> визер<br/>
        ЛКМ — удар/копать · ПКМ — ставить/есть · <strong>T</strong> день/ночь
      </div>
    </div>
    <div class="hud hidden" id="hud">
      <div class="crosshair"></div>
      <div class="top-bar">
        <span class="mode-pill" id="mode-label">КРЕАТИВ</span>
        <span class="mode-pill admin-pill" id="admin-label">АДМИН</span>
        <span class="mode-pill xray-pill hidden" id="xray-label">X-RAY</span>
        <span>Биом: <strong id="biome-label">—</strong></span>
        <span id="time-label">день</span>
        <span>Блок: <strong id="block-name">трава</strong></span>
        <span id="fly-label">Полёт</span>
        <span id="ore-count"></span>
      </div>
      <div class="bars" id="bars">
        <div class="hearts" id="hearts"></div>
        <div class="foods" id="foods"></div>
      </div>
      <div class="boss-bar hidden" id="boss-bar"><div class="boss-fill" id="boss-fill"></div><span id="boss-name"></span></div>
      <div class="toast hidden" id="toast"></div>
      <div class="page-label" id="page-label">Стр. 1</div>
      <div class="hotbar" id="hotbar"></div>
      <div class="death-screen hidden" id="death">
        <h2>Вы погибли</h2>
        <button class="btn" id="btn-respawn">Возродиться</button>
      </div>
    </div>
    <div class="pause-overlay hidden" id="pause">
      <h2>ПАУЗА</h2>
      <button class="btn" id="btn-resume">Продолжить</button>
      <button class="btn btn-alt" id="btn-menu">В меню</button>
    </div>
    <div class="loot-modal hidden" id="loot-modal">
      <h3>Сундук</h3>
      <ul id="loot-list"></ul>
      <button class="btn" id="btn-loot-close">Забрать</button>
    </div>
    <div class="craft-modal hidden" id="craft-modal">
      <h3>Крафт</h3>
      <div class="craft-list" id="craft-list"></div>
      <button class="btn" id="btn-craft-close">Закрыть</button>
    </div>
  `;
}

function swatch(id) {
  if (isItem(id)) return ITEM_META[id]?.color || '#888';
  const m = BLOCK_META[id];
  if (!m) return '#888';
  const c = m.top || m.color;
  return '#' + c.map(v => Math.round(Math.min(1, v) * 255).toString(16).padStart(2, '0')).join('');
}

function showToast(msg, ms = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), ms);
}

function renderHearts(player) {
  const el = document.getElementById('hearts');
  const full = Math.ceil(player.hp / 2);
  el.innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<span class="heart ${i < full ? (player.hp <= 4 ? 'low' : '') : 'empty'}">♥</span>`
  ).join('');
  const food = document.getElementById('foods');
  const ff = Math.ceil(player.food / 2);
  food.innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<span class="food ${i < ff ? '' : 'empty'}">■</span>`
  ).join('');
  document.getElementById('bars').classList.toggle('hidden', player.creative);
}

function rebuildHotbar(player) {
  const hotbar = document.getElementById('hotbar');
  hotbar.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const id = player.creative ? CREATIVE_PAGES[player.page][i] : player.inv[i]?.id;
    const count = player.creative ? '' : (player.inv[i] ? player.inv[i].n : '');
    const el = document.createElement('div');
    el.className = 'slot' + (i === player.selected ? ' selected' : '');
    if (id) {
      el.innerHTML = `<span class="key">${i + 1}</span><div class="block-swatch" style="background:${swatch(id)}"></div>
        <span class="label">${nameOf(id).slice(0, 5)}</span>
        ${count ? `<span class="count">${count}</span>` : ''}`;
    } else el.innerHTML = `<span class="key">${i + 1}</span>`;
    hotbar.appendChild(el);
  }
  document.getElementById('page-label').textContent = player.creative
    ? `Стр. ${player.page + 1}/${CREATIVE_PAGES.length}`
    : 'Инвентарь';
  const hid = player.heldId;
  document.getElementById('block-name').textContent = hid ? nameOf(hid) : 'пусто';
}

/* —— Main —— */
async function main() {
  const app = document.getElementById('app');
  createUI(app);
  const canvas = document.getElementById('game-canvas');
  const menu = document.getElementById('menu');
  const hud = document.getElementById('hud');
  const pauseEl = document.getElementById('pause');
  const lootModal = document.getElementById('loot-modal');
  const craftModal = document.getElementById('craft-modal');
  const deathEl = document.getElementById('death');
  const bossBar = document.getElementById('boss-bar');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x7ec8f0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x8ec8e8, 40, 90);
  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 200);
  const hemi = new THREE.HemisphereLight(0xb1d4f0, 0x5a7a3a, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.1);
  sun.position.set(80, 100, 40);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  const torchLights = [];
  for (let i = 0; i < 12; i++) {
    const l = new THREE.PointLight(0xffaa44, 0, 10, 2);
    l.visible = false; scene.add(l); torchLights.push(l);
  }

  let world = null, player = null, solidMesh = null, glassMesh = null, highlight = null;
  let emitters = [], xrayGroup = null;
  let playing = false, paused = false, pointerLocked = false, hadPointerLock = false;
  let needsRebuild = false, rebuildTimer = 0;
  let lastBreak = 0, lastPlace = 0, breakHeld = false, placeHeld = false, spaceTap = 0;
  let worldTime = 0.25, timeFrozen = false;
  let mobs = [], wither = null, dragon = null, projectiles = [];
  let spawnTimer = 0, teleportIdx = 0;
  let projGroup = new THREE.Group();
  scene.add(projGroup);

  const solidMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 1 });
  const glassMat = new THREE.MeshLambertMaterial({
    vertexColors: true, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide,
  });

  function scheduleRebuild() {
    needsRebuild = true;
    rebuildTimer = MESH_DEBOUNCE / 1000;
  }

  function rebuildWorldMesh() {
    if (solidMesh) { scene.remove(solidMesh); solidMesh.geometry.dispose(); }
    if (glassMesh) { scene.remove(glassMesh); glassMesh.geometry.dispose(); }
    const built = buildMesh(world);
    solidMesh = new THREE.Mesh(built.solid, solidMat);
    glassMesh = new THREE.Mesh(built.transparent, glassMat);
    emitters = built.emitters;
    scene.add(solidMesh); scene.add(glassMesh);
    applyXrayVisuals();
  }

  function rebuildXrayEsp() {
    if (xrayGroup) {
      scene.remove(xrayGroup);
      xrayGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
    xrayGroup = new THREE.Group();
    if (!world || !player || !player.xray) { scene.add(xrayGroup); return; }
    const boxGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
    const byType = new Map();
    for (const o of world.oreList || []) {
      const isOre = BLOCK_META[o.id]?.ore || o.id === BLOCK.DIAMOND_BLOCK || o.id === BLOCK.CHEST || o.id === BLOCK.END_CRYSTAL;
      if (player.xray === 1 && !isOre) continue;
      if (!byType.has(o.id)) byType.set(o.id, []);
      byType.get(o.id).push(o);
    }
    const dummy = new THREE.Object3D();
    for (const [id, list] of byType) {
      const mat = new THREE.MeshBasicMaterial({
        color: XRAY_COLORS[id] ?? 0xffffff, transparent: true, opacity: 0.8, depthTest: false, depthWrite: false,
      });
      const inst = new THREE.InstancedMesh(boxGeo, mat, list.length);
      inst.renderOrder = 999;
      list.forEach((o, i) => { dummy.position.set(o.x + 0.5, o.y + 0.5, o.z + 0.5); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix); });
      xrayGroup.add(inst);
    }
    scene.add(xrayGroup);
  }

  function applyXrayVisuals() {
    if (!player) return;
    if (player.xray === 0) { solidMat.opacity = 1; solidMat.depthWrite = true; if (glassMesh) glassMesh.visible = true; }
    else if (player.xray === 1) { solidMat.opacity = 0.18; solidMat.depthWrite = false; }
    else { solidMat.opacity = 0.08; solidMat.depthWrite = false; if (glassMesh) glassMesh.visible = false; }
    rebuildXrayEsp();
  }

  function makeHighlight() {
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000, transparent: true, opacity: 0.75 }));
    line.visible = false; scene.add(line); return line;
  }

  function hasPowers() { return player && (player.creative || player.admin); }

  function isDay() {
    const angle = worldTime * Math.PI * 2;
    return Math.sin(angle) > 0.15;
  }

  function updateModeUI() {
    if (!player) return;
    document.getElementById('mode-label').textContent = player.creative ? 'КРЕАТИВ' : 'ВЫЖИВАНИЕ';
    document.getElementById('mode-label').classList.toggle('survival', !player.creative);
    document.getElementById('admin-label').classList.toggle('hidden', !player.admin);
    const xl = document.getElementById('xray-label');
    xl.classList.toggle('hidden', !player.xray);
    xl.textContent = player.xray === 1 ? 'X-RAY РУДЫ' : player.xray === 2 ? 'WALLHACK' : 'X-RAY';
    const bits = [];
    if (player.flying) bits.push('Полёт');
    if (player.noclip) bits.push('Noclip');
    document.getElementById('fly-label').textContent = bits.join(' · ') || 'Ходьба';
    const bx = Math.floor(player.pos.x), bz = Math.floor(player.pos.z);
    document.getElementById('biome-label').textContent = BIOME_NAME[world.biomeAt(bx, bz)] || '—';
    renderHearts(player);
  }

  function clearEntities() {
    for (const m of mobs) m.dispose(scene);
    mobs = [];
    if (wither) { wither.dispose(scene); wither = null; }
    if (dragon) { dragon.dispose(scene); dragon = null; }
    while (projGroup.children.length) {
      const c = projGroup.children[0];
      projGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
    }
    projectiles = [];
  }

  function startGame(creative) {
    showToast('Генерация мира 96×96…');
    clearEntities();
    world = new World();
    player = new Player(world, camera);
    player.creative = creative;
    player.admin = true;
    player.flying = true;
    player.noclip = true;
    if (!creative) {
      player.give(ITEM.WOOD_PICK, 1);
      player.give(ITEM.WOOD_SWORD, 1);
      player.give(ITEM.APPLE, 8);
      player.give(BLOCK.TORCH, 16);
      player.give(BLOCK.CRAFTING, 1);
    }
    player.spawnSafe();
    rebuildWorldMesh();
    if (highlight) scene.remove(highlight);
    highlight = makeHighlight();
    // Дракон ждёт на арене, но спит пока игрок не придёт
    dragon = new EnderDragon(world.endArena, scene);
    playing = true; paused = false;
    menu.classList.add('hidden');
    pauseEl.classList.add('hidden');
    lootModal.classList.add('hidden');
    craftModal.classList.add('hidden');
    deathEl.classList.add('hidden');
    hud.classList.remove('hidden');
    rebuildHotbar(player);
    updateModeUI();
    showToast(creative
      ? `Админ! Деревня, ${world.dungeons.length} данжей, Край. G — телепорт`
      : `Выживание! Найди деревню, крафт на K. Ночью мобы!`);
    canvas.requestPointerLock();
  }

  function setPaused(v) {
    paused = v;
    pauseEl.classList.toggle('hidden', !v);
    if (v) document.exitPointerLock();
    else if (playing) canvas.requestPointerLock();
  }

  function explodeAt(cx, cy, cz, radius = 3) {
    for (let x = cx - radius; x <= cx + radius; x++)
      for (let y = cy - radius; y <= cy + radius; y++)
        for (let z = cz - radius; z <= cz + radius; z++) {
          const dist = Math.hypot(x - cx, y - cy, z - cz);
          if (dist > radius) continue;
          const id = world.get(x, y, z);
          if (id === BLOCK.BEDROCK || id === BLOCK.AIR || id === BLOCK.END_STONE) continue;
          if (hash2(x + cy, z + y) > dist / radius * 0.35) world.set(x, y, z, BLOCK.AIR);
        }
    scheduleRebuild();
  }

  function summonWither() {
    if (wither?.alive) { showToast('Визер уже здесь'); return; }
    if (wither) wither.dispose(scene);
    const p = player.pos;
    wither = new WitherBoss(p.x, p.y + 4, p.z, scene);
    showToast('Визер призван!');
  }

  function openCraft() {
    const list = document.getElementById('craft-list');
    list.innerHTML = '';
    RECIPES.forEach((r, idx) => {
      const can = r.need.every(([id, n]) => player.countItem(id) >= n) || player.creative;
      const btn = document.createElement('button');
      btn.className = 'craft-btn' + (can ? '' : ' disabled');
      btn.textContent = `${r.name} ← ${r.need.map(([id, n]) => `${nameOf(id)}×${n}`).join(', ')}`;
      btn.onclick = () => {
        if (!player.creative) {
          if (!r.need.every(([id, n]) => player.countItem(id) >= n)) return;
          for (const [id, n] of r.need) player.take(id, n);
        }
        if (r.special) {
          summonWither();
        } else {
          player.give(r.out[0], r.out[1]);
          showToast(`Скрафчено: ${nameOf(r.out[0])} ×${r.out[1]}`);
        }
        rebuildHotbar(player);
        openCraft();
      };
      list.appendChild(btn);
    });
    craftModal.classList.remove('hidden');
    document.exitPointerLock();
  }

  function tryInteract() {
    const eye = player.eyePos();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const hit = world.raycast(eye.x, eye.y, eye.z, dir.x, dir.y, dir.z);
    if (!hit) return;
    if (hit.id === BLOCK.CHEST) {
      const loot = world.openChest(hit.x, hit.y, hit.z);
      if (!loot) { showToast('Сундук пуст'); return; }
      for (const l of loot) player.give(l.id, l.n);
      document.getElementById('loot-list').innerHTML = loot.map(l => `<li>${nameOf(l.id)} ×${l.n}</li>`).join('');
      lootModal.classList.remove('hidden');
      document.exitPointerLock();
      rebuildHotbar(player);
      return;
    }
    if (hit.id === BLOCK.CRAFTING || hit.id === BLOCK.FURNACE) { openCraft(); return; }
    if (hit.id === BLOCK.TNT) {
      world.set(hit.x, hit.y, hit.z, BLOCK.AIR);
      explodeAt(hit.x, hit.y, hit.z, 3);
    }
  }

  function entityRaycast() {
    const eye = player.eyePos();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    let best = null, bestDist = REACH + 2;
    const check = (obj, kind) => {
      if (!obj || (obj.alive === false)) return;
      const center = obj.pos.clone().add(new THREE.Vector3(0, 1, 0));
      const to = center.clone().sub(eye);
      const dist = to.length();
      if (dist > bestDist) return;
      to.normalize();
      if (to.dot(dir) < 0.92) return;
      best = { kind, obj, dist };
      bestDist = dist;
    };
    for (const m of mobs) if (m.alive) check(m, 'mob');
    if (wither?.alive) check(wither, 'wither');
    if (dragon?.alive) check(dragon, 'dragon');
    return best;
  }

  function tryBreak() {
    if (player.dead) return;
    const now = performance.now();
    const held = metaOf(player.heldId);
    const cd = hasPowers() ? 80 : (held.speed ? 220 / held.speed : 280);
    if (now - lastBreak < cd) return;
    lastBreak = now;

    const ent = entityRaycast();
    if (ent && ent.dist < REACH + 1) {
      const dmg = held.sword || (hasPowers() ? 10 : 1);
      if (ent.kind === 'mob') ent.obj.hit(dmg, player);
      else ent.obj.hit(dmg);
      if (ent.kind === 'dragon' && !ent.obj.alive) {
        showToast('Дракон Края побеждён!');
        world.set(world.endArena.x, world.endArena.y, world.endArena.z, BLOCK.DRAGON_EGG);
        player.give(ITEM.DIAMOND, 16);
        player.give(BLOCK.DRAGON_EGG, 1);
        scheduleRebuild();
        rebuildHotbar(player);
      }
      if (ent.kind === 'wither' && !ent.obj.alive) {
        showToast('Визер повержен!');
        player.give(ITEM.DIAMOND, 8);
        player.give(ITEM.WITHER_SKULL, 1);
        rebuildHotbar(player);
      }
      return;
    }

    const eye = player.eyePos();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const hit = world.raycast(eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, hasPowers() ? 12 : REACH);
    if (!hit) return;
    if (hit.id === BLOCK.BEDROCK && !hasPowers()) { showToast('Бедрок'); return; }
    if (hit.id === BLOCK.WATER || hit.id === BLOCK.LAVA || hit.id === BLOCK.END_PORTAL) return;
    if (hit.id === BLOCK.CHEST || hit.id === BLOCK.CRAFTING) { tryInteract(); return; }
    if (hit.id === BLOCK.TNT) { world.set(hit.x, hit.y, hit.z, BLOCK.AIR); explodeAt(hit.x, hit.y, hit.z, 3); return; }

    const bm = BLOCK_META[hit.id];
    if (!hasPowers() && bm?.hardness > 2 && !(held.pick >= 2)) {
      // всё равно можно, но медленнее already via cd
    }
    let drop = bm?.drop ?? hit.id;
    if (bm?.dropChance != null && Math.random() > bm.dropChance) drop = null;
    world.set(hit.x, hit.y, hit.z, BLOCK.AIR);
    if (drop && !player.creative) player.give(drop, 1);
    scheduleRebuild();
    rebuildHotbar(player);
  }

  function tryPlace() {
    if (player.dead) return;
    const now = performance.now();
    if (now - lastPlace < (hasPowers() ? 80 : 180)) return;
    lastPlace = now;

    const held = player.heldId;
    const im = ITEM_META[held];
    if (im?.food) {
      if (player.food >= player.maxFood && player.hp >= player.maxHp) return;
      player.food = Math.min(player.maxFood, player.food + im.food);
      player.hp = Math.min(player.maxHp, player.hp + Math.ceil(im.food / 2));
      player.consumeHeld();
      rebuildHotbar(player);
      renderHearts(player);
      showToast(`Съедено: ${im.name}`);
      return;
    }
    if (held === ITEM.ENDER_PEARL) {
      const eye = player.eyePos();
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      player.pos.add(dir.multiplyScalar(12));
      player.consumeHeld();
      rebuildHotbar(player);
      showToast('Телепорт!');
      return;
    }
    if (!isBlock(held)) return;

    const eye = player.eyePos();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const hit = world.raycast(eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, hasPowers() ? 12 : REACH);
    if (!hit) return;
    const px = hit.x + hit.nx, py = hit.y + hit.ny, pz = hit.z + hit.nz;
    if (!world.inBounds(px, py, pz)) return;
    const cur = world.get(px, py, pz);
    if (cur !== BLOCK.AIR && cur !== BLOCK.WATER) return;
    if (!player.noclip) {
      const minX = player.pos.x - PLAYER_R, maxX = player.pos.x + PLAYER_R;
      const minY = player.pos.y, maxY = player.pos.y + PLAYER_H;
      const minZ = player.pos.z - PLAYER_R, maxZ = player.pos.z + PLAYER_R;
      if (px + 1 > minX && px < maxX && py + 1 > minY && py < maxY && pz + 1 > minZ && pz < maxZ) return;
    }
    world.set(px, py, pz, held);
    if (!player.creative) player.consumeHeld();
    if (held === BLOCK.CHEST) world.chests.set(`${px},${py},${pz}`, [{ id: BLOCK.TORCH, n: 4 }]);
    scheduleRebuild();
    rebuildHotbar(player);
  }

  function spawnMobs(dt) {
    if (player.creative && player.admin && isDay()) return;
    spawnTimer -= dt;
    if (spawnTimer > 0) return;
    spawnTimer = 2.5;
    if (isDay()) return;
    if (mobs.filter(m => m.alive).length >= MAX_MOBS) return;
    const types = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'];
    const type = types[(Math.random() * types.length) | 0];
    const ang = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 14;
    const x = player.pos.x + Math.cos(ang) * dist;
    const z = player.pos.z + Math.sin(ang) * dist;
    if (x < 2 || z < 2 || x > WORLD_W - 2 || z > WORLD_D - 2) return;
    let y = WORLD_H - 2;
    for (; y > 1; y--) if (world.isSolid(Math.floor(x), y, Math.floor(z))) break;
    y += 1;
    if (world.get(Math.floor(x), y, Math.floor(z)) === BLOCK.WATER) return;
    mobs.push(new Mob(type, x, y, z, scene));
  }

  function goTeleport() {
    const spots = [...world.dungeons];
    if (world.endArena) spots.push(world.endArena);
    if (world.village) spots.push(world.village);
    if (world.endFrame) spots.push({ x: world.endFrame.x, y: world.endFrame.y + 2, z: world.endFrame.z });
    if (!spots.length) return;
    teleportIdx = (teleportIdx + 1) % spots.length;
    const d = spots[teleportIdx];
    player.pos.set(d.x + 0.5, d.y + 1.2, d.z + 0.5);
    player.flying = true; player.noclip = true;
    updateModeUI();
    showToast(`Телепорт (${d.x|0}, ${d.y|0}, ${d.z|0})`);
  }

  // Events
  document.getElementById('btn-play').onclick = () => startGame(true);
  document.getElementById('btn-survival').onclick = () => startGame(false);
  document.getElementById('btn-resume').onclick = () => setPaused(false);
  document.getElementById('btn-menu').onclick = () => {
    playing = false; paused = false;
    clearEntities();
    pauseEl.classList.add('hidden'); lootModal.classList.add('hidden'); craftModal.classList.add('hidden');
    hud.classList.add('hidden'); menu.classList.remove('hidden');
    document.exitPointerLock();
  };
  document.getElementById('btn-loot-close').onclick = () => {
    lootModal.classList.add('hidden');
    if (playing && !paused) canvas.requestPointerLock();
  };
  document.getElementById('btn-craft-close').onclick = () => {
    craftModal.classList.add('hidden');
    if (playing && !paused) canvas.requestPointerLock();
  };
  document.getElementById('btn-respawn').onclick = () => {
    player.respawn();
    deathEl.classList.add('hidden');
    canvas.requestPointerLock();
    updateModeUI();
  };

  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
    if (pointerLocked) { hadPointerLock = true; return; }
    if (hadPointerLock && playing && !paused && lootModal.classList.contains('hidden') && craftModal.classList.contains('hidden') && !player?.dead)
      setPaused(true);
    hadPointerLock = false;
  });
  canvas.addEventListener('click', () => { if (playing && !paused && !pointerLocked && !player?.dead) canvas.requestPointerLock(); });
  document.addEventListener('mousemove', (e) => {
    if (!playing || paused || !pointerLocked || !player || player.dead) return;
    player.yaw -= e.movementX * 0.0022;
    player.pitch -= e.movementY * 0.0022;
    player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch));
  });

  document.addEventListener('keydown', (e) => {
    if (!player) return;
    player.keys[e.code] = true;
    if (e.code >= 'Digit1' && e.code <= 'Digit9') {
      const i = +e.code.slice(5) - 1;
      if (i < 9) { player.selected = i; rebuildHotbar(player); }
    }
    if (!playing || paused) return;
    if (e.code === 'KeyF') { player.flying = !player.flying; if (!player.flying) player.noclip = false; updateModeUI(); }
    if (e.code === 'KeyN') { player.noclip = !player.noclip; if (player.noclip) player.flying = true; updateModeUI(); }
    if (e.code === 'KeyX') {
      player.xray = (player.xray + 1) % 3; applyXrayVisuals(); updateModeUI();
      showToast(['X-ray выкл', 'X-ray руды', 'Wallhack'][player.xray]);
    }
    if (e.code === 'KeyV') {
      player.admin = !player.admin;
      if (player.admin) { player.flying = true; player.noclip = true; }
      updateModeUI();
    }
    if (e.code === 'BracketLeft') {
      if (player.creative) { player.page = (player.page - 1 + CREATIVE_PAGES.length) % CREATIVE_PAGES.length; rebuildHotbar(player); }
    }
    if (e.code === 'BracketRight') {
      if (player.creative) { player.page = (player.page + 1) % CREATIVE_PAGES.length; rebuildHotbar(player); }
    }
    if (e.code === 'KeyT') {
      timeFrozen = !timeFrozen;
      if (timeFrozen) worldTime = worldTime < 0.5 ? 0.15 : 0.75;
      showToast(timeFrozen ? (worldTime < 0.5 ? 'Вечный день' : 'Вечная ночь') : 'Цикл дня');
    }
    if (e.code === 'KeyG') goTeleport();
    if (e.code === 'KeyE') tryInteract();
    if (e.code === 'KeyK') openCraft();
    if (e.code === 'KeyB') {
      if (player.creative || player.countItem(ITEM.WITHER_SKULL) >= 3) {
        if (!player.creative) { player.take(ITEM.WITHER_SKULL, 3); player.take(BLOCK.SOUL_SAND, 4); }
        summonWither();
        rebuildHotbar(player);
      } else showToast('Нужно 3 черепа визера + песок душ (или креатив)');
    }
    if (e.code === 'KeyR') {
      const eye = player.eyePos();
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const hit = world.raycast(eye.x, eye.y, eye.z, dir.x, dir.y, dir.z);
      if (hit) explodeAt(hit.x, hit.y, hit.z, hasPowers() ? 4 : 2);
    }
    if (e.code === 'Space') {
      const now = performance.now();
      if (now - spaceTap < 320) {
        player.flying = !player.flying;
        if ((player.creative || player.admin) && player.flying) player.noclip = true;
        if (!player.flying) player.noclip = false;
        updateModeUI();
      }
      spaceTap = now;
    }
    if (e.code === 'KeyC' && e.shiftKey) {
      player.creative = !player.creative;
      if (player.creative || player.admin) { player.flying = true; player.noclip = true; }
      rebuildHotbar(player); updateModeUI();
    }
  });
  document.addEventListener('keyup', (e) => { if (player) player.keys[e.code] = false; });
  document.addEventListener('wheel', (e) => {
    if (!playing || paused || !player) return;
    if (e.shiftKey && player.creative) {
      player.page = (player.page + (e.deltaY > 0 ? 1 : -1) + CREATIVE_PAGES.length) % CREATIVE_PAGES.length;
    } else {
      player.selected = (player.selected + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
    }
    rebuildHotbar(player);
  }, { passive: true });
  document.addEventListener('mousedown', (e) => {
    if (!playing || paused || !pointerLocked) return;
    if (e.button === 0) { breakHeld = true; tryBreak(); }
    if (e.button === 2) { placeHeld = true; tryPlace(); }
  });
  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) breakHeld = false;
    if (e.button === 2) placeHeld = false;
  });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  });

  function updateDayNight(dt) {
    if (!timeFrozen) worldTime = (worldTime + dt * 0.01) % 1;
    const angle = worldTime * Math.PI * 2;
    const day = Math.max(0, Math.sin(angle));
    sun.position.set(Math.cos(angle) * 90, Math.sin(angle) * 100 + 10, 50);
    sun.intensity = 0.2 + day * 1.0;
    hemi.intensity = 0.2 + day * 0.7;
    const sunset = Math.max(0, 1 - Math.abs(worldTime - 0.75) * 8);
    const col = new THREE.Color(0.15 + day * 0.4 + sunset * 0.35, 0.18 + day * 0.55, 0.28 + day * 0.5 - sunset * 0.15);
    renderer.setClearColor(col);
    scene.fog.color.copy(col);
    document.getElementById('time-label').textContent = day > 0.55 ? 'день' : day > 0.15 ? (worldTime < 0.5 ? 'утро' : 'вечер') : 'ночь';
  }

  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (!p.mesh) {
        p.mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 6, 6),
          new THREE.MeshBasicMaterial({ color: p.dragon ? 0xaa44ff : p.wither ? 0x222222 : 0xffffff })
        );
        projGroup.add(p.mesh);
      }
      p.pos.addScaledVector(p.vel, dt);
      p.life -= dt;
      p.mesh.position.copy(p.pos);
      if (p.pos.distanceTo(player.pos) < 1.2) {
        player.hurt(p.damage);
        p.life = 0;
      }
      if (world.isSolid(Math.floor(p.pos.x), Math.floor(p.pos.y), Math.floor(p.pos.z))) p.life = 0;
      if (p.life <= 0) {
        projGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        projectiles.splice(i, 1);
      }
    }
  }

  function updateBossBar() {
    let boss = null;
    if (wither?.alive) boss = wither;
    else if (dragon?.alive && player.pos.distanceTo(dragon.pos) < 40) boss = dragon;
    if (!boss) { bossBar.classList.add('hidden'); return; }
    bossBar.classList.remove('hidden');
    document.getElementById('boss-fill').style.width = `${(100 * boss.hp / boss.maxHp)}%`;
    document.getElementById('boss-name').textContent = wither?.alive === boss ? `Визер ${boss.hp | 0}` : `Дракон Края ${boss.hp | 0}`;
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (playing && !paused && player) {
      player.update(dt);
      if (player.dead) deathEl.classList.remove('hidden');
      updateDayNight(dt);
      updateModeUI();

      if (needsRebuild) {
        rebuildTimer -= dt;
        if (rebuildTimer <= 0) { rebuildWorldMesh(); needsRebuild = false; }
      }
      if (breakHeld) tryBreak();
      if (placeHeld) tryPlace();

      const day = isDay();
      spawnMobs(dt);
      mobs = mobs.filter(m => {
        if (!m.alive) { m.dispose(scene); return false; }
        m._dayBurn = day;
        m.update(dt, player, world, explodeAt, projectiles);
        // эндермен злится от взгляда
        if (m.type === 'enderman' && !m.angry) {
          const eye = player.eyePos();
          const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          const to = m.pos.clone().add(new THREE.Vector3(0, 1.5, 0)).sub(eye);
          if (to.length() < 20 && to.normalize().dot(dir) > 0.97) m.angry = true;
        }
        return true;
      });
      if (wither?.alive) wither.update(dt, player, projectiles);
      else if (wither && !wither.alive) { wither.dispose(scene); wither = null; }
      if (dragon?.alive) dragon.update(dt, player, world, projectiles);
      else if (dragon && !dragon.alive) { /* keep mesh until disposed on restart */ }

      updateProjectiles(dt);
      updateBossBar();

      // факелы
      const ranked = emitters.map(e => ({ ...e, d: Math.hypot(e.x - player.pos.x, e.y - player.pos.y, e.z - player.pos.z) }))
        .filter(e => e.d < 28).sort((a, b) => a.d - b.d);
      for (let i = 0; i < torchLights.length; i++) {
        const l = torchLights[i], e = ranked[i];
        if (!e) { l.intensity = 0; l.visible = false; continue; }
        l.visible = true; l.position.set(e.x, e.y, e.z); l.intensity = e.e * 1.8;
      }

      const eye = player.eyePos();
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const hit = world.raycast(eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, hasPowers() ? 12 : REACH);
      if (hit && highlight) {
        highlight.visible = true;
        highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      } else if (highlight) highlight.visible = false;
    } else if (!playing) {
      updateDayNight(dt * 0.3);
      camera.position.set(WORLD_W / 2, SEA_LEVEL + 28, WORLD_D / 2 + 36);
      camera.lookAt(WORLD_W / 2, SEA_LEVEL + 8, WORLD_D / 2);
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  window.addEventListener("amal-power", (e) => {
    const t = e.detail && e.detail.type;
    if (!player) return;
    if (t === "heal" || t === "max") {
      player.hp = player.maxHp;
      player.food = player.maxFood;
      player.dead = false;
      player.hurtCd = 0;
    }
    if (t === "god" || t === "max") {
      player.creative = true;
      player.admin = true;
      player.flying = true;
      player.noclip = true;
    }
    if (t === "speed" || t === "max") {
      player.flying = true;
    }
  });
  // Меню без тяжёлой генерации — мир создаётся при «Играть»
}

main().catch(err => {
  console.error(err);
  document.getElementById('app').innerHTML = `<div class="screen"><div class="logo">Ошибка</div><p class="tagline">${err.message || err}</p></div>`;
});
