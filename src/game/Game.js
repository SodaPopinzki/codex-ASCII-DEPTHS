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
import { MonsterAI } from '../systems/MonsterAI.js';
import { MonsterConfig } from '../config/MonsterConfig.js';
import { Monster } from '../entities/Monster.js';

export class Game {
  constructor() {
    this.state = 'title';
    this.floor = 1;
    this.map = DungeonGenerator.generate(GameConfig.map.width, GameConfig.map.height);
    this.player = new Player(this.map.spawn.x, this.map.spawn.y);
    this.monsters = MonsterSpawner.spawn(this.map, this.floor);
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
      const result = Combat.melee(this.player, monster);
      if (result.dodged) {
        this.messageLog.add(`The ${monster.type} phases away from your strike.`);
      } else if (!result.hit) {
        this.messageLog.add(`You miss the ${monster.type}.`);
      } else {
        this.messageLog.add(`You hit the ${monster.type} for ${result.damage} damage.`);
        if (result.critical) this.messageLog.add('Critical hit!');
        if (monster.hp <= 0) this.messageLog.add(`The ${monster.type} dies.`);
      }
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
    if (this.map.tiles[this.player.y][this.player.x] === GameConfig.tileTypes.WATER || this.player.slowTurns > 0) {
      this.takeMonsterTurn();
      this.messageLog.add(this.player.slowTurns > 0 ? 'You struggle through sticky webs.' : 'The water slows your movement.');
    }
    this.turnCount += 1;

    this.hunger.tick();
    if (this.hunger.value === 0) {
      this.player.hp -= 1;
      this.messageLog.add('Starvation hurts you.');
    }

    if (this.player.poisonTurns > 0) {
      this.player.poisonTurns -= 1;
      this.player.hp -= 1;
      this.messageLog.add('Poison burns through your veins for 1 damage.');
    }

    if (this.player.slowTurns > 0) this.player.slowTurns -= 1;

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
      this.monsters = MonsterSpawner.spawn(this.map, this.floor);
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

      if (monster.regen > 0) {
        monster.hp = Math.min(monster.maxHp, monster.hp + monster.regen);
      }

      MonsterAI.updateAwareness(monster, this);

      if (monster.summonSkeletons) {
        monster.summonCounter += 1;
        if (monster.summonCounter >= 5) {
          monster.summonCounter = 0;
          this.summonSkeletonsAround(monster);
        }
      }

      const distance = Math.abs(this.player.x - monster.x) + Math.abs(this.player.y - monster.y);
      if (monster.type === 'Lich' && distance === 1) {
        this.teleportMonster(monster);
        this.messageLog.add('The Lich blinks away in a burst of violet smoke.');
        continue;
      }

      if (monster.breathLine) {
        monster.breathCounter += 1;
        if (monster.breathCounter >= monster.breathCooldown && this.inDragonBreathLine(monster)) {
          monster.breathCounter = 0;
          this.player.hp -= 6;
          this.messageLog.add('The Dragon breathes fire down the corridor!');
          continue;
        }
      }

      const actions = monster.fast ? 2 : 1;
      for (let action = 0; action < actions; action++) {
        if (monster.hp <= 0) break;
        if (this.resolveMonsterAction(monster)) break;
      }
    }
  }

  resolveMonsterAction(monster) {
    const dx = this.player.x - monster.x;
    const dy = this.player.y - monster.y;
    const distance = Math.abs(dx) + Math.abs(dy);

    if (distance === 1) {
      const hit = Combat.melee(monster, this.player);
      if (!hit.hit) {
        this.messageLog.add(`The ${monster.type} misses you.`);
      } else {
        this.messageLog.add(`The ${monster.type} hits you for ${hit.damage} damage!`);
      }
      if (monster.poisonOnHit && hit.hit) {
        this.player.poisonTurns = Math.max(this.player.poisonTurns, 5);
        this.messageLog.add('The Snake bites you! You feel poison coursing through your veins.');
      }
      if (monster.webMaker && hit.hit) {
        this.player.slowTurns = Math.max(this.player.slowTurns, 2);
        this.messageLog.add('Sticky webs cling to you, slowing your movement.');
      }
      if (monster.drainMaxHp > 0 && hit.hit) {
        this.player.maxHp = Math.max(1, this.player.maxHp - monster.drainMaxHp);
        this.player.hp = Math.min(this.player.hp, this.player.maxHp);
        this.messageLog.add('The Wraith drains your life essence!');
      }
      return true;
    }

    const [mx, my] = MonsterAI.pickStep(monster, this);
    const tx = monster.x + mx;
    const ty = monster.y + my;
    const occupied = this.monsters.some((m) => m !== monster && m.hp > 0 && m.x === tx && m.y === ty);
    const canMove = monster.phaseWalls ? this.inBounds(tx, ty) : this.map.isWalkable(tx, ty);
    if (!occupied && canMove && (tx !== this.player.x || ty !== this.player.y)) {
      monster.x = tx;
      monster.y = ty;
    }

    return false;
  }

  summonSkeletonsAround(monster) {
    const skeleton = MonsterConfig.find((m) => m.type === 'Skeleton');
    if (!skeleton) return;
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let summoned = 0;
    for (const [dx, dy] of directions) {
      if (summoned >= 2) break;
      const x = monster.x + dx;
      const y = monster.y + dy;
      const blocked = this.monsters.some((m) => m.hp > 0 && m.x === x && m.y === y) || (this.player.x === x && this.player.y === y);
      if (!blocked && this.map.isWalkable(x, y)) {
        const newMonster = new Monster(x, y, skeleton);
        newMonster.aiState = 'aware';
        this.monsters.push(newMonster);
        summoned += 1;
      }
    }
    if (summoned > 0) this.messageLog.add('The Lich summons skeletal servants!');
  }

  teleportMonster(monster) {
    for (let attempts = 0; attempts < 20; attempts++) {
      const x = Math.floor(Math.random() * this.map.width);
      const y = Math.floor(Math.random() * this.map.height);
      const occupied = this.monsters.some((m) => m !== monster && m.hp > 0 && m.x === x && m.y === y);
      if (!occupied && this.map.isWalkable(x, y) && Math.abs(this.player.x - x) + Math.abs(this.player.y - y) > 4) {
        monster.x = x;
        monster.y = y;
        break;
      }
    }
  }

  inDragonBreathLine(monster) {
    const dx = this.player.x - monster.x;
    const dy = this.player.y - monster.y;
    if (dx !== 0 && dy !== 0) return false;
    const dist = Math.abs(dx + dy);
    return dist > 0 && dist <= 3;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.map.width && y < this.map.height;
  }
}
