export class Monster {
  constructor(x, y, template) {
    this.x = x;
    this.y = y;
    this.type = template.type;
    this.glyph = template.glyph;
    this.hp = template.hp;
    this.attack = template.attack;
    this.color = template.color;
  }
}
