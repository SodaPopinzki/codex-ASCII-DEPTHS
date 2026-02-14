export class Combat {
  static melee(attacker, defender) {
    const base = attacker.attack || 3;
    const damage = Math.max(1, base + Math.floor(Math.random() * 3) - 1);
    defender.hp -= damage;
    return damage;
  }
}
