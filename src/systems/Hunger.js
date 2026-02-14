export class Hunger {
  constructor() {
    this.max = 100;
    this.value = 100;
    this.lastTier = 'full';
  }

  restore(amount) {
    this.value = Math.min(this.max, this.value + amount);
    this.lastTier = this.getTier();
  }

  tick(turnCount) {
    const messages = [];
    let hpDamage = 0;

    if (turnCount % 10 === 0) {
      this.value = Math.max(0, this.value - 1);
    }

    const tier = this.getTier();
    if (tier !== this.lastTier) {
      if (tier === 'hungry') messages.push({ text: 'You are getting hungry.', color: 'warn' });
      if (tier === 'starving') messages.push({ text: 'You are starving!', color: 'danger' });
      if (tier === 'dying') messages.push({ text: 'You are dying of starvation!', color: 'danger' });
      this.lastTier = tier;
    }

    if (this.value === 0) {
      if (turnCount % 5 === 0) hpDamage += 1;
    } else if (this.value <= 25 && turnCount % 20 === 0) {
      hpDamage += 1;
    }

    return { messages, hpDamage };
  }

  getTier() {
    if (this.value === 0) return 'dying';
    if (this.value <= 25) return 'starving';
    if (this.value <= 50) return 'hungry';
    return 'full';
  }
}
