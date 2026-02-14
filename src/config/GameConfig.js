export const GameConfig = {
  viewport: { width: 80, height: 30 },
  map: { width: 80, height: 50 },
  dungeon: {
    rooms: { min: 6, max: 10 },
    roomSize: {
      minWidth: 4,
      maxWidth: 12,
      minHeight: 4,
      maxHeight: 8
    },
    waterChance: 0.03
  },
  tileTypes: {
    WALL: '#',
    FLOOR: '.',
    DOOR: '+',
    STAIRS_DOWN: '>',
    STAIRS_UP: '<',
    WATER: '~'
  },
  colors: {
    wall: '#7a7a7a',
    floor: '#4b4b4b',
    door: '#d7b44a',
    stairs: '#ffffff',
    water: '#4d78ff',
    player: '#ffffff',
    monster: '#ff9a76',
    item: '#f3e37c',
    unseen: '#000000',
    explored: '#2a2a2a',
    message: '#ffffff'
  },
  ui: { logRows: 4 }
};
