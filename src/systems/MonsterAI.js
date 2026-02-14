export class MonsterAI {
  static updateAwareness(monster, game) {
    if (monster.aiState === 'aware') return;
    if (MonsterAI.canSeePlayer(monster, game)) {
      monster.aiState = 'aware';
    }
  }

  static canSeePlayer(monster, game) {
    const dx = game.player.x - monster.x;
    const dy = game.player.y - monster.y;
    const distSq = dx * dx + dy * dy;
    const radius = monster.vision ?? 8;
    if (distSq > radius * radius) return false;
    return MonsterAI.hasLineOfSight(monster.x, monster.y, game.player.x, game.player.y, game.map, monster.phaseWalls);
  }

  static hasLineOfSight(x0, y0, x1, y1, map, ignoreWalls = false) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;

    while (x !== x1 || y !== y1) {
      if (!(x === x0 && y === y0) && !ignoreWalls && map.blocksSight(x, y)) return false;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return true;
  }

  static pickStep(monster, game) {
    const dx = game.player.x - monster.x;
    const dy = game.player.y - monster.y;
    const stepToward = [Math.sign(dx), Math.sign(dy)];
    const stepAway = [-Math.sign(dx), -Math.sign(dy)];

    if (monster.behaviors.erratic) {
      return MonsterAI.randomStep();
    }

    if (monster.behaviors.cowardly && monster.hp <= Math.max(1, Math.floor(monster.maxHp * 0.35))) {
      if (Math.random() < 0.8) return stepAway;
      return MonsterAI.randomStep();
    }

    if (monster.behaviors.aggressive || monster.aiState === 'aware') {
      return stepToward;
    }

    return [0, 0];
  }

  static randomStep() {
    const steps = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
    return steps[Math.floor(Math.random() * steps.length)];
  }
}
