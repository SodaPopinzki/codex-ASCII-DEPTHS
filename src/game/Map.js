export class Map {
  constructor(width, height, tiles) {
    this.width = width;
    this.height = height;
    this.tiles = tiles;
    this.visibility = Array.from({ length: height }, () => Array(width).fill(false));
  }

  isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.tiles[y][x] === '.';
  }
}
