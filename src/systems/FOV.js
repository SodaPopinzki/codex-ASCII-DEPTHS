export class FOV {
  static compute(gameMap, originX, originY, radius = 8) {
    gameMap.visibility = Array.from({ length: gameMap.height }, () => Array(gameMap.width).fill(false));

    const setVisible = (x, y) => {
      if (x < 0 || y < 0 || x >= gameMap.width || y >= gameMap.height) return;
      gameMap.visibility[y][x] = true;
      gameMap.explored[y][x] = true;
    };

    setVisible(originX, originY);
    for (let octant = 0; octant < 8; octant++) {
      FOV.castLight(gameMap, originX, originY, 1, 1.0, 0.0, radius, ...FOV.getMultipliers(octant), setVisible);
    }
  }

  static castLight(gameMap, cx, cy, row, start, end, radius, xx, xy, yx, yy, setVisible) {
    if (start < end) return;
    const radiusSquared = radius * radius;

    for (let i = row; i <= radius; i++) {
      let dx = -i - 1;
      let dy = -i;
      let blocked = false;
      let newStart = start;

      while (dx <= 0) {
        dx += 1;
        const mapX = cx + dx * xx + dy * xy;
        const mapY = cy + dx * yx + dy * yy;
        const leftSlope = (dx - 0.5) / (dy + 0.5);
        const rightSlope = (dx + 0.5) / (dy - 0.5);

        if (start < rightSlope) continue;
        if (end > leftSlope) break;

        if (dx * dx + dy * dy <= radiusSquared) setVisible(mapX, mapY);

        const blocks = gameMap.blocksSight(mapX, mapY);
        if (blocked) {
          if (blocks) {
            newStart = rightSlope;
          } else {
            blocked = false;
            start = newStart;
          }
        } else if (blocks && i < radius) {
          blocked = true;
          FOV.castLight(gameMap, cx, cy, i + 1, start, leftSlope, radius, xx, xy, yx, yy, setVisible);
          newStart = rightSlope;
        }
      }

      if (blocked) break;
    }
  }

  static getMultipliers(octant) {
    const mult = [
      [1, 0, 0, 1],
      [0, 1, 1, 0],
      [0, -1, 1, 0],
      [-1, 0, 0, 1],
      [-1, 0, 0, -1],
      [0, -1, -1, 0],
      [0, 1, -1, 0],
      [1, 0, 0, -1]
    ];
    return mult[octant];
  }
}
