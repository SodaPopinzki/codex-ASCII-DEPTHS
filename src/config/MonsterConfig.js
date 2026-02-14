export const MonsterConfig = [
  { type: 'Rat', tier: 1, glyph: 'r', color: '#8b5a2b', hp: 5, str: 2, def: 0, behaviors: { cowardly: true } },
  { type: 'Bat', tier: 1, glyph: 'b', color: '#9a9a9a', hp: 4, str: 3, def: 0, behaviors: { erratic: true }, fast: true },
  { type: 'Snake', tier: 1, glyph: 's', color: '#4caf50', hp: 8, str: 4, def: 1, behaviors: { aggressive: true }, poisonOnHit: true },
  { type: 'Kobold', tier: 1, glyph: 'k', color: '#f0d64a', hp: 12, str: 5, def: 2, behaviors: { aggressive: true } },
  { type: 'Orc', tier: 2, glyph: 'o', color: '#2f6b2f', hp: 20, str: 8, def: 4, behaviors: { aggressive: true } },
  { type: 'Skeleton', tier: 2, glyph: 'S', color: '#f0f0f0', hp: 15, str: 7, def: 6, behaviors: { aggressive: true }, weakToBlunt: true },
  { type: 'Spider', tier: 2, glyph: 'x', color: '#6b6b6b', hp: 10, str: 5, def: 1, behaviors: { aggressive: true }, webMaker: true },
  { type: 'Ghost', tier: 2, glyph: 'G', color: '#8ed6ff', hp: 12, str: 6, def: 0, behaviors: { aggressive: true }, phaseWalls: true, dodgeChance: 0.5 },
  { type: 'Troll', tier: 3, glyph: 'T', color: '#1f5f1f', hp: 40, str: 12, def: 6, bold: true, behaviors: { aggressive: true }, regen: 2 },
  { type: 'Wraith', tier: 3, glyph: 'W', color: '#9c4dff', hp: 25, str: 10, def: 3, behaviors: { aggressive: true }, drainMaxHp: 1 },
  { type: 'Dragon', tier: 3, glyph: 'D', color: '#ff3b30', hp: 60, str: 15, def: 10, bold: true, behaviors: { aggressive: true, ranged: true }, breathLine: true, breathCooldown: 3 },
  { type: 'Lich', tier: 3, glyph: 'L', color: '#5c2a9d', hp: 35, str: 8, def: 5, bold: true, behaviors: { aggressive: true, ranged: true }, summonSkeletons: true },
  { type: 'Abyss Lord', tier: 4, glyph: 'A', color: '#ff1b1b', hp: 100, str: 18, def: 12, bold: true, behaviors: { aggressive: true } }
];
