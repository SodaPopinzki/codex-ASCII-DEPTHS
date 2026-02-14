import { Map } from '../game/Map.js';

export class DungeonGenerator {
  static generate(width, height) {
    const tiles = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => (x === 0 || y === 0 || x === width - 1 || y === height - 1 ? '#' : '.'))
    );

    for (let y = 2; y < height - 2; y += 5) {
      for (let x = 2; x < width - 2; x++) {
        if (Math.random() < 0.08) tiles[y][x] = '#';
      }
    }

    return new Map(width, height, tiles);
  }
}
