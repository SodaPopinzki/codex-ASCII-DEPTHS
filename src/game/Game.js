import { GameConfig } from '../config/GameConfig.js';
import { DungeonGenerator } from '../generation/DungeonGenerator.js';
import { MonsterSpawner } from '../generation/MonsterSpawner.js';
import { Item } from '../entities/Item.js';
import { ItemConfig } from '../config/ItemConfig.js';
import { Player } from '../entities/Player.js';
import { FOV } from '../systems/FOV.js';
import { Combat } from '../systems/Combat.js';
import { Hunger } from '../systems/Hunger.js';
import { Inventory } from '../systems/Inventory.js';
import { MessageLog } from '../systems/MessageLog.js';

export class Game {
  constructor() {
    this.state = 'title';
    this.floor = 1;
    this.map = DungeonGenerator.generate(GameConfig.map.width, GameConfig.map.height);
    this.player = new Player(this.map.spawn.x, this.map.spawn.y);
    this.monsters = MonsterSpawner.spawn(this.map);
    this.items = this.spawnItems();
    this.hunger = new Hunger();
    this.inventory = new Inventory();
    this.messageLog = new MessageLog(GameConfig.ui.logRows);
    this.turnCount = 0;
    this.pendingStairsPrompt = false;
    FOV.compute(this.map, this.player.x, this.player.y, this.player.vision);
  }

  spawnItems() {
    return ItemConfig.map((cfg) => {
      let x = this.map.spawn.x;
      let y = this.map.spawn.y;
      do {
        x = Math.floor(Math.random() * this.map.width);
        y = Math.floor(Math.random() * this.map.height);
      } while (!this.map.isWalkable(x, y) || (x === this.map.spawn.x && y === this.map.spawn.y));
      return new Item(x, y, cfg);
    });
  }

  start() {
    if (this.state === 'title') {
      this.state = 'playing';
      this.messageLog.add('You enter the first floor.');
    }
  }

  movePlayer(dx, dy) {
    if (this.state !== 'playing' || (dx === 0 && dy === 0) || this.pendingStairsPrompt) return false;
    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;
    let acted = false;

    const monster = this.monsters.find((m) => m.x === targetX && m.y === targetY && m.hp > 0);
    if (monster) {
      const dmg = Combat.melee({ attack: this.player.str }, monster);
      this.messageLog.add(`You hit the ${monster.type} for ${dmg}.`);
      if (monster.hp <= 0) this.messageLog.add(`The ${monster.type} dies.`);
      acted = true;
    } else if (this.map.isWalkable(targetX, targetY)) {
      this.player.x = targetX;
      this.player.y = targetY;
      acted = true;
      const itemIndex = this.items.findIndex((it) => it.x === targetX && it.y === targetY);
      if (itemIndex >= 0) {
        const item = this.items.splice(itemIndex, 1)[0];
        this.inventory.add(item);
        if (item.effect === 'heal') this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.value);
        if (item.effect === 'gold') this.player.gold += item.value;
        if (item.effect === 'hunger') this.hunger.value = Math.min(100, this.hunger.value + item.value);
        this.messageLog.add(`You pick up ${item.type}.`);
      }

      if (this.map.tiles[targetY][targetX] === GameConfig.tileTypes.STAIRS_DOWN) {
        this.pendingStairsPrompt = true;
        this.messageLog.add('Descend? (Y/N)');
      }
    }

    if (!acted) return false;

    this.takeMonsterTurn();
    if (this.map.tiles[this.player.y][this.player.x] === GameConfig.tileTypes.WATER) {
      this.takeMonsterTurn();
      this.messageLog.add('The water slows your movement.');
    }
    this.turnCount += 1;

    this.hunger.tick();
    if (this.hunger.value === 0) {
      this.player.hp -= 1;
      this.messageLog.add('Starvation hurts you.');
    }

    if (this.player.hp <= 0) {
      this.state = 'dead';
      this.messageLog.add('You have died. Permadeath is absolute.');
    }

    FOV.compute(this.map, this.player.x, this.player.y, this.player.vision);
    return true;
  }

  respondStairs(shouldDescend) {
    if (!this.pendingStairsPrompt) return false;
    this.pendingStairsPrompt = false;
    if (shouldDescend) {
      this.floor += 1;
      this.map = DungeonGenerator.generate(GameConfig.map.width, GameConfig.map.height);
      this.player.x = this.map.spawn.x;
      this.player.y = this.map.spawn.y;
      this.monsters = MonsterSpawner.spawn(this.map);
      this.items = this.spawnItems();
      this.messageLog.add(`You descend to floor ${this.floor}.`);
    } else {
      this.messageLog.add('You remain on this floor.');
    }
    FOV.compute(this.map, this.player.x, this.player.y, this.player.vision);
    return true;
  }

  takeMonsterTurn() {
    for (const monster of this.monsters) {
      if (monster.hp <= 0) continue;
      const dx = this.player.x - monster.x;
      const dy = this.player.y - monster.y;
      const distance = Math.abs(dx) + Math.abs(dy);

      if (distance === 1) {
        const rolled = monster.attack + Math.floor(Math.random() * 3) - 1;
        const damage = Math.max(1, rolled - Math.floor(this.player.def / 5));
        this.player.hp -= damage;
        this.messageLog.add(`The ${monster.type} hits you.`);
        continue;
      }

      const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
      const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
      const options = distance <= 8 ? [[stepX, 0], [0, stepY], [stepX, stepY]] : [[stepX, 0], [0, stepY], [0, 0]];
      for (const [mx, my] of options) {
        const tx = monster.x + mx;
        const ty = monster.y + my;
        const occupied = this.monsters.some((m) => m !== monster && m.hp > 0 && m.x === tx && m.y === ty);
        if (!occupied && (tx !== this.player.x || ty !== this.player.y) && this.map.isWalkable(tx, ty)) {
          monster.x = tx;
          monster.y = ty;
          break;
        }
      }
    }
  }
}
