import { Monster } from '../entities/Monster.js';
import { MonsterConfig } from '../config/MonsterConfig.js';

export class MonsterSpawner {
  static spawn(map, count = 14) {
    const monsters = [];
    for (let i = 0; i < count; i++) {
      let x = 2;
      let y = 2;
      do {
        x = Math.floor(Math.random() * map.width);
        y = Math.floor(Math.random() * map.height);
      } while (!map.isWalkable(x, y) || (Math.abs(x - map.spawn.x) + Math.abs(y - map.spawn.y) < 8));
      monsters.push(new Monster(x, y, MonsterConfig[i % MonsterConfig.length]));
    }
    return monsters;
  }
}
