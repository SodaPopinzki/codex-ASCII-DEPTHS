export class FOV {
  static compute(gameMap, originX, originY, radius = 8) {
    gameMap.visibility = gameMap.visibility.map((row) => row.map(() => false));
    for (let y = Math.max(0, originY - radius); y <= Math.min(gameMap.height - 1, originY + radius); y++) {
      for (let x = Math.max(0, originX - radius); x <= Math.min(gameMap.width - 1, originX + radius); x++) {
        const dx = x - originX;
        const dy = y - originY;
        if (dx * dx + dy * dy <= radius * radius) gameMap.visibility[y][x] = true;
      }
    }
  }
}
