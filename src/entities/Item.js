export class Item {
  constructor(x, y, template) {
    this.x = x;
    this.y = y;
    this.type = template.type;
    this.glyph = template.glyph;
    this.effect = template.effect;
    this.value = template.value;
    this.color = '#f3e37c';
  }
}
