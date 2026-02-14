export class Monster {
  constructor(x, y, template) {
    this.x = x;
    this.y = y;
    this.type = template.type;
    this.glyph = template.glyph;
    this.color = template.color;
    this.bold = Boolean(template.bold);
    this.maxHp = template.hp;
    this.hp = template.hp;
    this.str = template.str;
    this.def = template.def;
    this.accuracy = template.accuracy ?? 0;
    this.behaviors = template.behaviors || {};
    this.fast = Boolean(template.fast);
    this.poisonOnHit = Boolean(template.poisonOnHit);
    this.webMaker = Boolean(template.webMaker);
    this.phaseWalls = Boolean(template.phaseWalls);
    this.dodgeChance = template.dodgeChance ?? 0;
    this.regen = template.regen ?? 0;
    this.drainMaxHp = template.drainMaxHp ?? 0;
    this.breathLine = Boolean(template.breathLine);
    this.breathCooldown = template.breathCooldown ?? 0;
    this.breathCounter = 0;
    this.summonSkeletons = Boolean(template.summonSkeletons);
    this.summonCounter = 0;
    this.aiState = 'sleeping';
    this.vision = 8;
  }
}
