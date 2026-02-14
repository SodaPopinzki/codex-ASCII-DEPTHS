export class Hunger {
  constructor() {
    this.value = 100;
  }

  tick() {
    this.value = Math.max(0, this.value - 1);
  }
}
