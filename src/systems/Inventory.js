export class Inventory {
  constructor(maxSlots = 10) {
    this.maxSlots = maxSlots;
    this.items = [];
  }

  add(item) {
    if (this.items.length >= this.maxSlots) return false;
    this.items.push(item);
    return true;
  }

  remove(index) {
    if (index < 0 || index >= this.items.length) return null;
    return this.items.splice(index, 1)[0] ?? null;
  }

  get(index) {
    return this.items[index] ?? null;
  }
}
