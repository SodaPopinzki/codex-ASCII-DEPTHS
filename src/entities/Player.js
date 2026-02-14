export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.glyph = '@';
    this.color = '#ffffff';
    this.hp = 30;
    this.maxHp = 30;
    this.baseStr = 10;
    this.baseDef = 5;
    this.baseSpeed = 100;
    this.baseVision = 8;
    this.str = this.baseStr;
    this.def = this.baseDef;
    this.speed = this.baseSpeed;
    this.vision = this.baseVision;
    this.accuracy = 0;
    this.gold = 0;
    this.poisonTurns = 0;
    this.slowTurns = 0;
    this.equipment = {
      weapon: null,
      armor: null
    };
  }

  equip(item) {
    if (item.type !== 'weapon' && item.type !== 'armor') return null;
    const slot = item.type;
    const previous = this.equipment[slot];
    this.equipment[slot] = item;
    this.recalculateStats();
    return previous;
  }

  recalculateStats() {
    const weapon = this.equipment.weapon;
    const armor = this.equipment.armor;
    this.str = this.baseStr + (weapon?.str ?? 0);
    this.def = this.baseDef + (armor?.def ?? 0);
    this.speed = this.baseSpeed + (weapon?.speed ?? 0) + (armor?.speed ?? 0);
    this.vision = this.baseVision + (weapon?.vision ?? 0) + (armor?.vision ?? 0);
  }
}
