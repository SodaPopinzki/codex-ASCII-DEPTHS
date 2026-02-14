export const ItemConfig = {
  weapons: [
    { id: 'rusty_dagger', name: 'Rusty Dagger', type: 'weapon', glyph: '/', color: '#808080', str: 2, tier: 1, weight: 0, start: true },
    { id: 'short_sword', name: 'Short Sword', type: 'weapon', glyph: '/', color: '#ffffff', str: 4, tier: 1, weight: 4 },
    { id: 'battle_axe', name: 'Battle Axe', type: 'weapon', glyph: '/', color: '#d34040', str: 7, speed: -10, tier: 2, weight: 2 },
    { id: 'magic_staff', name: 'Magic Staff', type: 'weapon', glyph: '/', color: '#4c78ff', str: 3, vision: 2, tier: 2, weight: 2 },
    { id: 'flaming_sword', name: 'Flaming Sword', type: 'weapon', glyph: '/', color: '#ff8c26', str: 5, fireDamageVsUndead: 2, tier: 3, weight: 1 }
  ],
  armor: [
    { id: 'leather_armor', name: 'Leather Armor', type: 'armor', glyph: '[', color: '#8b5a2b', def: 2, tier: 1, weight: 4 },
    { id: 'chain_mail', name: 'Chain Mail', type: 'armor', glyph: '[', color: '#909090', def: 4, speed: -5, tier: 2, weight: 2 },
    { id: 'plate_armor', name: 'Plate Armor', type: 'armor', glyph: '[', color: '#f5f5f5', def: 7, speed: -15, tier: 3, weight: 1 },
    { id: 'mage_robes', name: 'Mage Robes', type: 'armor', glyph: '[', color: '#4c78ff', def: 1, vision: 3, tier: 2, weight: 2 }
  ],
  consumables: [
    { id: 'health_potion', name: 'Health Potion', type: 'consumable', subType: 'heal', glyph: '!', color: '#d34040', value: 15, tier: 1, weight: 4 },
    { id: 'poison_cure', name: 'Poison Cure', type: 'consumable', subType: 'cure_poison', glyph: '!', color: '#3cb043', tier: 1, weight: 3 },
    { id: 'scroll_fireball', name: 'Scroll of Fireball', type: 'consumable', subType: 'fireball', glyph: '?', color: '#ff8c26', value: 20, tier: 2, weight: 2 },
    { id: 'scroll_teleport', name: 'Scroll of Teleport', type: 'consumable', subType: 'teleport', glyph: '?', color: '#4c78ff', tier: 2, weight: 2 },
    { id: 'food_ration', name: 'Food Ration', type: 'consumable', subType: 'food', glyph: '%', color: '#8b5a2b', value: 50, tier: 1, weight: 5 },
    { id: 'amulet_of_depths', name: 'Amulet of Depths', type: 'quest', glyph: '*', color: '#ffd700', tier: 4, weight: 0 }
  ]
};

const ALL_ITEMS = [...ItemConfig.weapons, ...ItemConfig.armor, ...ItemConfig.consumables];

export function getStartingWeapon() {
  return ItemConfig.weapons.find((item) => item.start) ?? ItemConfig.weapons[0];
}

export function getItemById(id) {
  return ALL_ITEMS.find((item) => item.id === id);
}

export function getRandomItemTemplate(floor, options = {}) {
  const { excludeFood = false } = options;
  const maxTier = floor <= 3 ? 1 : floor <= 6 ? 2 : 3;
  const minTier = floor <= 3 ? 1 : floor <= 6 ? 1 : 2;
  const pool = ALL_ITEMS.filter((item) => item.tier >= minTier && item.tier <= maxTier && item.type !== 'quest' && (!excludeFood || item.id !== 'food_ration'));
  const totalWeight = pool.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const item of pool) {
    roll -= item.weight ?? 1;
    if (roll <= 0) return item;
  }
  return pool[0];
}
