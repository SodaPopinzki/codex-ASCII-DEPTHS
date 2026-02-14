import { Map } from '../game/Map.js';
import { GameConfig } from '../config/GameConfig.js';

export class DungeonGenerator {
  static generate(width, height) {
    const { tileTypes, dungeon } = GameConfig;
    const tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => tileTypes.WALL));
    const rooms = [];
    const roomCount = DungeonGenerator.randomInt(dungeon.rooms.min, dungeon.rooms.max);

    let attempts = 0;
    while (rooms.length < roomCount && attempts < roomCount * 10) {
      attempts += 1;
      const w = DungeonGenerator.randomInt(dungeon.roomSize.minWidth, dungeon.roomSize.maxWidth);
      const h = DungeonGenerator.randomInt(dungeon.roomSize.minHeight, dungeon.roomSize.maxHeight);
      const x = DungeonGenerator.randomInt(1, width - w - 2);
      const y = DungeonGenerator.randomInt(1, height - h - 2);
      const room = { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };

      if (!rooms.some((other) => DungeonGenerator.intersects(room, other))) {
        rooms.push(room);
        DungeonGenerator.carveRoom(tiles, room, tileTypes.FLOOR);
      }
    }

    while (rooms.length < dungeon.rooms.min) {
      const index = rooms.length;
      const w = 6;
      const h = 5;
      const x = 2 + (index % 4) * 18;
      const y = 2 + Math.floor(index / 4) * 12;
      const room = { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };
      rooms.push(room);
      DungeonGenerator.carveRoom(tiles, room, tileTypes.FLOOR);
    }

    for (let i = 1; i < rooms.length; i++) {
      DungeonGenerator.connectRooms(tiles, rooms[i - 1], rooms[i], tileTypes);
    }

    DungeonGenerator.placeWater(tiles, dungeon.waterChance, tileTypes);

    const startRoom = rooms[0] || { cx: 2, cy: 2 };
    const stairsUp = { x: startRoom.cx, y: startRoom.cy };
    tiles[stairsUp.y][stairsUp.x] = tileTypes.STAIRS_UP;

    let farthestRoom = startRoom;
    let maxDistance = -1;
    for (const room of rooms) {
      const dx = room.cx - startRoom.cx;
      const dy = room.cy - startRoom.cy;
      const distance = dx * dx + dy * dy;
      if (distance > maxDistance) {
        maxDistance = distance;
        farthestRoom = room;
      }
    }
    const stairsDown = { x: farthestRoom.cx, y: farthestRoom.cy };
    tiles[stairsDown.y][stairsDown.x] = tileTypes.STAIRS_DOWN;

    const map = new Map(width, height, tiles);
    map.rooms = rooms;
    map.spawn = { x: Math.min(startRoom.cx + 1, width - 2), y: startRoom.cy };
    if (!map.isWalkable(map.spawn.x, map.spawn.y)) {
      map.spawn = { x: startRoom.cx, y: startRoom.cy };
    }
    map.stairsUp = stairsUp;
    map.stairsDown = stairsDown;
    return map;
  }

  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static intersects(a, b) {
    return a.x - 1 <= b.x + b.w && a.x + a.w + 1 >= b.x && a.y - 1 <= b.y + b.h && a.y + a.h + 1 >= b.y;
  }

  static carveRoom(tiles, room, floorGlyph) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        tiles[y][x] = floorGlyph;
      }
    }
  }

  static connectRooms(tiles, a, b, tileTypes) {
    const horizontalFirst = Math.random() < 0.5;
    if (horizontalFirst) {
      DungeonGenerator.carveHorizontal(tiles, a.cx, b.cx, a.cy, tileTypes.FLOOR);
      DungeonGenerator.carveVertical(tiles, a.cy, b.cy, b.cx, tileTypes.FLOOR);
      DungeonGenerator.placeDoorIfNeeded(tiles, b.cx, a.cy, tileTypes);
    } else {
      DungeonGenerator.carveVertical(tiles, a.cy, b.cy, a.cx, tileTypes.FLOOR);
      DungeonGenerator.carveHorizontal(tiles, a.cx, b.cx, b.cy, tileTypes.FLOOR);
      DungeonGenerator.placeDoorIfNeeded(tiles, a.cx, b.cy, tileTypes);
    }
  }

  static carveHorizontal(tiles, x1, x2, y, glyph) {
    const [start, end] = x1 <= x2 ? [x1, x2] : [x2, x1];
    for (let x = start; x <= end; x++) tiles[y][x] = glyph;
  }

  static carveVertical(tiles, y1, y2, x, glyph) {
    const [start, end] = y1 <= y2 ? [y1, y2] : [y2, y1];
    for (let y = start; y <= end; y++) tiles[y][x] = glyph;
  }

  static placeDoorIfNeeded(tiles, x, y, tileTypes) {
    if (tiles[y]?.[x] === tileTypes.FLOOR && Math.random() < 0.35) {
      tiles[y][x] = tileTypes.DOOR;
    }
  }

  static placeWater(tiles, chance, tileTypes) {
    for (let y = 1; y < tiles.length - 1; y++) {
      for (let x = 1; x < tiles[0].length - 1; x++) {
        if (tiles[y][x] === tileTypes.FLOOR && Math.random() < chance) {
          tiles[y][x] = tileTypes.WATER;
        }
      }
    }
  }
}
