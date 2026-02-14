export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.glyph = '@';
    this.color = '#ffffff';
    this.hp = 30;
    this.maxHp = 30;
    this.str = 10;
    this.def = 5;
    this.accuracy = 0;
    this.speed = 100;
    this.vision = 8;
    this.gold = 0;
    this.poisonTurns = 0;
    this.slowTurns = 0;
  }
}
