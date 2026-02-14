import { Map } from '../game/Map.js';
import { GameConfig } from '../config/GameConfig.js';

export class DungeonGenerator {
  static generate(width, height, floor = 1) {
    const { tileTypes, dungeon } = GameConfig;
    if (floor === 10) return DungeonGenerator.generateBossFloor(width, height, tileTypes);

    const profile = DungeonGenerator.getFloorProfile(floor, dungeon);
    const tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => tileTypes.WALL));
    const rooms = [];
    const roomCount = DungeonGenerator.randomInt(profile.roomsMin, profile.roomsMax);

    let attempts = 0;
    while (rooms.length < roomCount && attempts < roomCount * 10) {
      attempts += 1;
      const w = DungeonGenerator.randomInt(profile.minWidth, profile.maxWidth);
      const h = DungeonGenerator.randomInt(profile.minHeight, profile.maxHeight);
      const x = DungeonGenerator.randomInt(1, width - w - 2);
      const y = DungeonGenerator.randomInt(1, height - h - 2);
      const room = { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };

      if (!rooms.some((other) => DungeonGenerator.intersects(room, other))) {
        rooms.push(room);
        DungeonGenerator.carveRoom(tiles, room, tileTypes.FLOOR);
      }
    }

    while (rooms.length < profile.roomsMin) {
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

    DungeonGenerator.placeWater(tiles, profile.waterChance, tileTypes, rooms, profile.corridorsOnly);

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

  static getFloorProfile(floor, dungeon) {
    if (floor <= 3) {
      return {
        roomsMin: dungeon.rooms.min,
        roomsMax: dungeon.rooms.max,
        minWidth: 8,
        maxWidth: 15,
        minHeight: 6,
        maxHeight: 10,
        waterChance: floor >= 2 ? 0.02 : 0,
        corridorsOnly: false
      };
    }
    if (floor <= 6) {
      return {
        roomsMin: dungeon.rooms.min + 1,
        roomsMax: dungeon.rooms.max + 2,
        minWidth: 6,
        maxWidth: 11,
        minHeight: 5,
        maxHeight: 8,
        waterChance: 0.03,
        corridorsOnly: false
      };
    }

    return {
      roomsMin: dungeon.rooms.min + 2,
      roomsMax: dungeon.rooms.max + 3,
      minWidth: 4,
      maxWidth: 8,
      minHeight: 4,
      maxHeight: 7,
      waterChance: floor >= 7 ? 0.07 : 0.04,
      corridorsOnly: floor >= 7
    };
  }

  static generateBossFloor(width, height, tileTypes) {
    const tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => tileTypes.WALL));
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const radius = Math.min(Math.floor(width / 3), Math.floor(height / 2.5));
    const room = { x: cx - radius, y: cy - radius, w: radius * 2, h: radius * 2, cx, cy };

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= radius * radius) tiles[y][x] = tileTypes.FLOOR;
      }
    }

    const map = new Map(width, height, tiles);
    map.rooms = [room];
    map.spawn = { x: cx, y: cy + radius - 2 };
    map.stairsUp = { x: map.spawn.x, y: map.spawn.y };
    map.stairsDown = null;
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

  static placeWater(tiles, chance, tileTypes, rooms = [], corridorsOnly = false) {
    for (let y = 1; y < tiles.length - 1; y++) {
      for (let x = 1; x < tiles[0].length - 1; x++) {
        const inRoom = rooms.some((room) => x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h);
        if (tiles[y][x] === tileTypes.FLOOR && Math.random() < chance && (!corridorsOnly || !inRoom)) {
          tiles[y][x] = tileTypes.WATER;
        }
      }
    }
  }
}
