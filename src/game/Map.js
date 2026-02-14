import { GameConfig } from '../config/GameConfig.js';

export class Map {
  constructor(width, height, tiles) {
    this.width = width;
    this.height = height;
    this.tiles = tiles;
    this.visibility = Array.from({ length: height }, () => Array(width).fill(false));
    this.explored = Array.from({ length: height }, () => Array(width).fill(false));
  }

  isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    const t = this.tiles[y][x];
    const { tileTypes } = GameConfig;
    return t === tileTypes.FLOOR || t === tileTypes.DOOR || t === tileTypes.STAIRS_UP || t === tileTypes.STAIRS_DOWN || t === tileTypes.WATER;
  }

  blocksSight(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
    return this.tiles[y][x] === GameConfig.tileTypes.WALL;
  }
}
