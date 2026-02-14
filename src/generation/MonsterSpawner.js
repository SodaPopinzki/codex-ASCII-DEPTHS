import { Monster } from '../entities/Monster.js';
import { MonsterConfig } from '../config/MonsterConfig.js';

export class MonsterSpawner {
  static spawn(map, floor = 1) {
    if (floor === 10) return [];
    const count = 5 + Math.floor(Math.random() * 4) + (floor >= 7 ? 2 : 0);
    const monsters = [];
    const pool = MonsterSpawner.getFloorPool(floor);

    const rooms = (map.rooms || []).filter((room) => !MonsterSpawner.isSpawnRoom(room, map.spawn));
    for (let i = 0; i < count; i++) {
      const room = rooms.length > 0 ? rooms[Math.floor(Math.random() * rooms.length)] : null;
      let x;
      let y;
      let attempts = 0;
      do {
        attempts += 1;
        if (room) {
          x = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
          y = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
        } else {
          x = Math.floor(Math.random() * map.width);
          y = Math.floor(Math.random() * map.height);
        }
      } while (
        attempts < 100 &&
        (!map.isWalkable(x, y) || MonsterSpawner.isOnCorridorTile(map, x, y) || (x === map.spawn.x && y === map.spawn.y) || monsters.some((m) => m.x === x && m.y === y))
      );

      const template = pool[Math.floor(Math.random() * pool.length)];
      monsters.push(new Monster(x, y, template));
    }

    return monsters;
  }

  static getFloorPool(floor) {
    if (floor <= 3) return MonsterConfig.filter((m) => m.tier === 1);
    if (floor <= 6) return MonsterConfig.filter((m) => m.tier === 1 || m.tier === 2);
    return MonsterConfig.filter((m) => m.tier === 2 || m.tier === 3);
  }

  static isSpawnRoom(room, spawn) {
    return spawn.x >= room.x && spawn.x < room.x + room.w && spawn.y >= room.y && spawn.y < room.y + room.h;
  }

  static isOnCorridorTile(map, x, y) {
    return map.rooms && !map.rooms.some((room) => x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h);
  }
}
