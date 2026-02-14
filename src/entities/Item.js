export class Item {
  constructor(x, y, template, extra = {}) {
    this.x = x;
    this.y = y;
    this.id = template.id;
    this.name = template.name;
    this.type = template.type;
    this.subType = template.subType;
    this.glyph = template.glyph;
    this.color = template.color;
    this.str = template.str ?? 0;
    this.def = template.def ?? 0;
    this.speed = template.speed ?? 0;
    this.vision = template.vision ?? 0;
    this.value = template.value ?? 0;
    this.fireDamageVsUndead = template.fireDamageVsUndead ?? 0;
    this.meta = extra;
  }
}
