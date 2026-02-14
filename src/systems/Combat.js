export class Combat {
  static melee(attacker, defender, options = {}) {
    const accuracy = attacker.accuracy ?? 0;
    const missChance = Math.max(0.02, Math.min(0.5, 0.1 - accuracy * 0.01));
    if (Math.random() < missChance) {
      return { hit: false, damage: 0, critical: false };
    }

    if ((defender.dodgeChance ?? 0) > 0 && Math.random() < defender.dodgeChance) {
      return { hit: false, damage: 0, critical: false, dodged: true };
    }

    const variance = Math.floor(Math.random() * 5) - 2;
    const baseDamage = (attacker.str ?? attacker.attack ?? 3) - (defender.def ?? 0) + variance;
    const critical = Math.random() < 0.05;
    const damage = Math.max(1, critical ? baseDamage * 2 : baseDamage);
    defender.hp -= damage;
    return { hit: true, damage, critical };
  }
}
