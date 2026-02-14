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
    this.player = new Player(3, 3);
    this.monsters = MonsterSpawner.spawn(this.map);
    this.items = this.spawnItems();
    this.hunger = new Hunger();
    this.inventory = new Inventory();
    this.messageLog = new MessageLog(GameConfig.ui.logRows);
    FOV.compute(this.map, this.player.x, this.player.y);
  }

  spawnItems() {
    return ItemConfig.map((cfg, i) => new Item(5 + i * 6, 6 + i * 4, cfg));
  }

  start() {
    if (this.state === 'title') {
      this.state = 'playing';
      this.messageLog.add('You enter the first floor.');
    }
  }

  movePlayer(dx, dy) {
    if (this.state !== 'playing' || (dx === 0 && dy === 0)) return;
    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;

    const monster = this.monsters.find((m) => m.x === targetX && m.y === targetY && m.hp > 0);
    if (monster) {
      const dmg = Combat.melee({ attack: 4 }, monster);
      this.messageLog.add(`You hit the ${monster.type} for ${dmg}.`);
      if (monster.hp <= 0) this.messageLog.add(`The ${monster.type} dies.`);
    } else if (this.map.isWalkable(targetX, targetY)) {
      this.player.x = targetX;
      this.player.y = targetY;
      const itemIndex = this.items.findIndex((it) => it.x === targetX && it.y === targetY);
      if (itemIndex >= 0) {
        const item = this.items.splice(itemIndex, 1)[0];
        this.inventory.add(item);
        if (item.effect === 'heal') this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.value);
        if (item.effect === 'gold') this.player.gold += item.value;
        if (item.effect === 'hunger') this.hunger.value = Math.min(100, this.hunger.value + item.value);
        this.messageLog.add(`You pick up ${item.type}.`);
      }
    }

    this.hunger.tick();
    if (this.hunger.value === 0) {
      this.player.hp -= 1;
      this.messageLog.add('Starvation hurts you.');
    }

    if (this.player.hp <= 0) {
      this.state = 'dead';
      this.messageLog.add('You have died. Permadeath is absolute.');
    }

    FOV.compute(this.map, this.player.x, this.player.y);
  }
}
