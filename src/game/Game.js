import { GameConfig } from '../config/GameConfig.js';
import { DungeonGenerator } from '../generation/DungeonGenerator.js';
import { MonsterSpawner } from '../generation/MonsterSpawner.js';
import { Item } from '../entities/Item.js';
import { getItemById, getRandomItemTemplate, getStartingWeapon } from '../config/ItemConfig.js';
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
    this.initializeRun();
  }

  initializeRun() {
    this.state = 'title';
    this.floor = 1;
    this.floorsCleared = 0;
    this.map = DungeonGenerator.generate(GameConfig.map.width, GameConfig.map.height, this.floor);
    this.player = new Player(this.map.spawn.x, this.map.spawn.y);
    this.inventory = new Inventory(10);
    this.hunger = new Hunger();
    this.messageLog = new MessageLog(GameConfig.ui.logRows);
    this.turnCount = 0;
    this.pendingStairsPrompt = false;
    this.inventoryOpen = false;
    this.helpOpen = false;
    this.historyOpen = false;
    this.dropMode = false;
    this.monstersKilled = 0;
    this.deathCause = '';
    this.killer = '';
    this.hasAmulet = false;
    this.bossAbilityIndex = 0;
    this.darknessTurns = 0;
    this.lastDamageSource = 'unknown';
    this.effects = {
      roomTransition: 0,
      playerBlink: 0,
      lowHpBlink: 0,
      pickupFlash: 0,
      pickupFlashPos: null,
      criticalFlash: 0,
      criticalPos: null
    };
    this.deadMonsters = [];
    this.player.equip(new Item(-1, -1, getStartingWeapon()));
    this.monsters = MonsterSpawner.spawn(this.map, this.floor);
    this.items = this.spawnItems();
    this.addSpecialFloorFeatures();
    FOV.compute(this.map, this.player.x, this.player.y, this.player.vision);
  }

  spawnItems() {
    if (this.floor === 10) return [];
    const count = 3 + Math.floor(Math.random() * 4);
    const items = [];
    const guaranteedFood = this.floor % 2 === 0;

    for (let i = 0; i < count; i++) {
      const template = getRandomItemTemplate(this.floor, { excludeFood: guaranteedFood && i > 0 });
      const [x, y] = this.findItemSpawn();
      items.push(new Item(x, y, template));
    }

    if (guaranteedFood) {
      const [x, y] = this.findItemSpawn();
      items.push(new Item(x, y, getItemById('food_ration')));
    }

    return items;
  }

  addSpecialFloorFeatures() {
    if (this.floor === 3) {
      const [x, y] = this.findItemSpawn();
      this.items.push(new Item(x, y, getItemById('short_sword')));
      this.messageLog.add('You sense a stronger weapon hidden on this floor.');
    }

    if (this.floor === 5) {
      const vaultRoom = this.map.rooms[this.map.rooms.length - 1];
      for (let i = 0; i < 3; i++) {
        const x = vaultRoom.x + 1 + Math.floor(Math.random() * Math.max(1, vaultRoom.w - 2));
        const y = vaultRoom.y + 1 + Math.floor(Math.random() * Math.max(1, vaultRoom.h - 2));
        this.items.push(new Item(x, y, getRandomItemTemplate(8)));
      }
      const troll = MonsterConfig.find((m) => m.type === 'Troll');
      if (troll) this.monsters.push(new Monster(vaultRoom.cx, vaultRoom.cy, troll));
      this.messageLog.add('A sealed vault glitters with treasure... and danger.');
    }

    if (this.floor === 10) {
      const abyssLord = MonsterConfig.find((m) => m.type === 'Abyss Lord');
      if (abyssLord) {
        this.monsters = [new Monster(this.map.rooms[0].cx, this.map.rooms[0].cy, abyssLord)];
        this.monsters[0].aiState = 'aware';
      }
      this.messageLog.add('The Abyss Lord rises from the darkness.');
    }
  }

  findItemSpawn() {
    const rooms = this.map.rooms?.length ? this.map.rooms : [{ x: 1, y: 1, w: this.map.width - 2, h: this.map.height - 2 }];
    for (let attempts = 0; attempts < 50; attempts++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const x = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
      const y = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
      const occupied = this.items?.some((it) => it.x === x && it.y === y);
      if (!occupied && this.map.isWalkable(x, y) && (x !== this.map.spawn.x || y !== this.map.spawn.y)) return [x, y];
    }
    return [this.map.spawn.x, this.map.spawn.y];
  }

  start() {
    if (this.state === 'title') {
      this.state = 'playing';
      this.messageLog.add('You enter the first floor.');
      return;
    }
    if (this.state === 'dead' || this.state === 'victory') {
      this.initializeRun();
      this.state = 'playing';
      this.messageLog.add('A new descent begins.');
    }
  }

  toggleInventory() {
    if (this.state !== 'playing' || this.helpOpen || this.historyOpen) return;
    this.inventoryOpen = !this.inventoryOpen;
    this.dropMode = false;
  }

  toggleHelp() {
    if (this.state !== 'playing') return;
    this.helpOpen = !this.helpOpen;
    if (this.helpOpen) {
      this.inventoryOpen = false;
      this.historyOpen = false;
      this.dropMode = false;
    }
  }

  toggleHistory() {
    if (this.state !== 'playing') return;
    this.historyOpen = !this.historyOpen;
    if (this.historyOpen) {
      this.inventoryOpen = false;
      this.helpOpen = false;
      this.dropMode = false;
    }
  }

  toggleDropMode() {
    if (!this.inventoryOpen || this.state !== 'playing') return false;
    this.dropMode = true;
    this.messageLog.add('Choose a slot to drop.');
    return true;
  }

  handleInventorySlot(index) {
    if (!this.inventoryOpen || this.state !== 'playing') return false;
    if (this.dropMode) {
      this.dropMode = false;
      return this.dropFromInventory(index);
    }
    return this.useInventoryItem(index);
  }

  movePlayer(dx, dy) {
    if (this.state !== 'playing' || (dx === 0 && dy === 0) || this.pendingStairsPrompt || this.inventoryOpen || this.helpOpen || this.historyOpen) return false;
    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;
    let acted = false;

    const monster = this.monsters.find((m) => m.x === targetX && m.y === targetY && m.hp > 0);
    if (monster) {
      const result = Combat.melee(this.player, monster);
      if (result.hit && this.player.equipment.weapon?.fireDamageVsUndead && /skeleton|lich|wraith/i.test(monster.type)) {
        monster.hp -= this.player.equipment.weapon.fireDamageVsUndead;
        result.damage += this.player.equipment.weapon.fireDamageVsUndead;
      }
      if (result.dodged) {
        this.messageLog.add(`The ${monster.type} phases away from your strike.`);
      } else if (!result.hit) {
        this.messageLog.add(`You miss the ${monster.type}.`);
      } else {
        this.messageLog.add(`You hit the ${monster.type} for ${result.damage} damage.`, 'monsterDamage');
        if (result.critical) {
          this.messageLog.add('CRITICAL!', 'warn');
          this.effects.criticalFlash = 30;
          this.effects.criticalPos = { x: monster.x, y: monster.y };
        }
        if (monster.hp <= 0) {
          this.messageLog.add(`The ${monster.type} dies.`, 'monsterDamage');
          this.onMonsterKilled(monster);
        }
      }
      acted = true;
    } else if (this.map.isWalkable(targetX, targetY)) {
      const beforeRoom = this.currentRoomIndex();
      this.player.x = targetX;
      this.player.y = targetY;
      acted = true;
      this.pickUpItemAt(targetX, targetY);
      const afterRoom = this.currentRoomIndex();
      if (beforeRoom !== afterRoom) this.effects.roomTransition = 18;

      if (this.map.tiles[targetY][targetX] === GameConfig.tileTypes.STAIRS_DOWN) {
        if (this.floor === 10) {
          if (this.hasAmulet) {
            this.winGame();
            return true;
          }
          this.messageLog.add('You need the Amulet of Depths to escape.', 'warn');
        } else {
          this.pendingStairsPrompt = true;
          this.messageLog.add(`Descend to Floor ${this.floor + 1}? (Y/N)`, 'info');
        }
      }
    }

    if (!acted) return false;

    this.endTurn();
    FOV.compute(this.map, this.player.x, this.player.y, this.getCurrentVision());
    return true;
  }

  pickUpItemAt(x, y) {
    const itemIndex = this.items.findIndex((it) => it.x === x && it.y === y);
    if (itemIndex < 0) return;
    const item = this.items.splice(itemIndex, 1)[0];
    if (item.id === 'amulet_of_depths') {
      this.hasAmulet = true;
      this.messageLog.add('You claim the Amulet of Depths!', 'info');
      return;
    }
    if (!this.inventory.add(item)) {
      this.items.push(item);
      this.messageLog.add('Your inventory is full.', 'warn');
      return;
    }
    this.messageLog.add(`You pick up ${item.name}.`, 'info');
    this.effects.pickupFlash = 10;
    this.effects.pickupFlashPos = { x, y };
  }

  useInventoryItem(index) {
    const item = this.inventory.get(index);
    if (!item) return false;

    if (item.type === 'weapon' || item.type === 'armor') {
      const swapped = this.player.equip(item);
      this.inventory.remove(index);
      if (swapped) this.inventory.add(swapped);
      this.messageLog.add(`You equip ${item.name}.`);
      FOV.compute(this.map, this.player.x, this.player.y, this.getCurrentVision());
      return true;
    }

    if (item.subType === 'heal') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.value);
      this.messageLog.add('You feel revitalized.');
    } else if (item.subType === 'cure_poison') {
      this.player.poisonTurns = 0;
      this.messageLog.add('The poison fades from your body.');
    } else if (item.subType === 'fireball') {
      this.castFireball(item.value);
    } else if (item.subType === 'teleport') {
      this.teleportPlayerToExploredTile();
    } else if (item.subType === 'food') {
      this.hunger.restore(item.value);
      this.messageLog.add('You eat a food ration.');
    } else if (item.subType === 'corpse') {
      this.hunger.restore(20);
      this.messageLog.add('You eat the monster corpse.');
      if (Math.random() < 0.3) {
        this.player.hp -= 5;
        this.lastDamageSource = 'rotten flesh';
        this.messageLog.add('The rotten flesh makes you violently sick.');
      }
    }

    this.inventory.remove(index);
    this.endTurn();
    FOV.compute(this.map, this.player.x, this.player.y, this.getCurrentVision());
    return true;
  }

  dropFromInventory(index) {
    const item = this.inventory.remove(index);
    if (!item) return false;
    this.items.push(new Item(this.player.x, this.player.y, item, item.meta));
    this.messageLog.add(`You drop ${item.name}.`);
    return true;
  }

  castFireball(damage) {
    let target = null;
    let bestDistance = Infinity;
    for (const monster of this.monsters) {
      if (monster.hp <= 0) continue;
      const dist = Math.abs(monster.x - this.player.x) + Math.abs(monster.y - this.player.y);
      if (dist < bestDistance) {
        bestDistance = dist;
        target = monster;
      }
    }
    if (!target) {
      this.messageLog.add('The scroll fizzles with no target.');
      return;
    }

    for (const monster of this.monsters) {
      if (monster.hp <= 0) continue;
      if (Math.abs(monster.x - target.x) <= 1 && Math.abs(monster.y - target.y) <= 1) {
        monster.hp -= damage;
        if (monster.hp <= 0) this.onMonsterKilled(monster);
      }
    }
    this.messageLog.add('A fiery explosion engulfs nearby enemies!');
  }

  teleportPlayerToExploredTile() {
    const candidates = [];
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        if (this.map.explored[y][x] && this.map.isWalkable(x, y)) candidates.push([x, y]);
      }
    }
    if (!candidates.length) {
      this.messageLog.add('The scroll fails to lock onto a known location.');
      return;
    }
    const [x, y] = candidates[Math.floor(Math.random() * candidates.length)];
    this.player.x = x;
    this.player.y = y;
    this.messageLog.add('You blink through space.');
  }

  onMonsterKilled(monster) {
    this.monstersKilled += 1;
    this.deadMonsters.push({ x: monster.x, y: monster.y, glyph: monster.glyph, frames: 10 });

    if (monster.type === 'Abyss Lord') {
      this.items.push(new Item(monster.x, monster.y, getItemById('amulet_of_depths')));
      this.map.tiles[this.map.spawn.y][this.map.spawn.x] = GameConfig.tileTypes.STAIRS_DOWN;
      this.messageLog.add('The Abyss Lord falls. Escape stairs open behind you!');
      return;
    }

    const corpseTemplate = {
      id: `corpse_${monster.type.toLowerCase()}`,
      name: `${monster.type} Corpse`,
      type: 'consumable',
      subType: 'corpse',
      glyph: '%',
      color: '#7d6b59'
    };
    this.items.push(new Item(monster.x, monster.y, corpseTemplate));
    if (Math.random() < 0.25) {
      this.items.push(new Item(monster.x, monster.y, getItemById('short_sword')));
    }
  }

  endTurn() {
    if (this.state !== 'playing') return;
    this.takeMonsterTurn();
    if (this.map.tiles[this.player.y][this.player.x] === GameConfig.tileTypes.WATER || this.player.slowTurns > 0) {
      this.takeMonsterTurn();
      this.messageLog.add(this.player.slowTurns > 0 ? 'You struggle through sticky webs.' : 'The water slows your movement.');
    }
    this.turnCount += 1;

    const hungerResult = this.hunger.tick(this.turnCount);
    for (const entry of hungerResult.messages) this.messageLog.add(entry.text, entry.color);
    if (hungerResult.hpDamage > 0) {
      this.player.hp -= hungerResult.hpDamage;
      this.lastDamageSource = 'starvation';
      this.messageLog.add('Starvation hurts you.', 'playerDamage');
    }

    if (this.player.poisonTurns > 0) {
      this.player.poisonTurns -= 1;
      this.player.hp -= 1;
      this.lastDamageSource = 'poison';
      this.messageLog.add('Poison burns through your veins for 1 damage.', 'playerDamage');
    }

    if (this.player.slowTurns > 0) this.player.slowTurns -= 1;
    if (this.darknessTurns > 0) this.darknessTurns -= 1;

    if (this.player.hp <= 0) {
      this.state = 'dead';
      this.deathCause = this.lastDamageSource;
      this.killer = this.lastDamageSource;
      this.messageLog.add(`You died on Floor ${this.floor}.`);
    }
  }

  respondStairs(shouldDescend) {
    if (!this.pendingStairsPrompt) return false;
    this.pendingStairsPrompt = false;
    if (shouldDescend) {
      this.floorsCleared += 1;
      this.floor += 1;
      this.map = DungeonGenerator.generate(GameConfig.map.width, GameConfig.map.height, this.floor);
      this.player.x = this.map.spawn.x;
      this.player.y = this.map.spawn.y;
      this.monsters = MonsterSpawner.spawn(this.map, this.floor);
      this.items = this.spawnItems();
      this.addSpecialFloorFeatures();
      this.messageLog.add(`You descend to Floor ${this.floor}.`);
    } else {
      this.messageLog.add('You remain on this floor.');
    }
    FOV.compute(this.map, this.player.x, this.player.y, this.getCurrentVision());
    return true;
  }

  takeMonsterTurn() {
    for (const monster of this.monsters) {
      if (monster.hp <= 0) continue;

      if (monster.regen > 0) {
        monster.hp = Math.min(monster.maxHp, monster.hp + monster.regen);
      }

      if (monster.type === 'Abyss Lord') {
        this.takeAbyssLordTurn(monster);
        continue;
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
          this.lastDamageSource = 'Dragon breath';
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

  takeAbyssLordTurn(monster) {
    const phaseActions = monster.hp > Math.floor(monster.maxHp * 0.66) ? 1 : monster.hp > Math.floor(monster.maxHp * 0.33) ? 2 : 3;
    for (let i = 0; i < phaseActions; i++) {
      const ability = this.bossAbilityIndex % 4;
      this.bossAbilityIndex += 1;
      if (ability === 0) {
        this.darknessTurns = 10;
        this.messageLog.add('The Abyss Lord casts Darkness! Your vision shrinks.');
      } else if (ability === 1) {
        this.summonTierTwoMonsters(3, monster);
        this.messageLog.add('The Abyss Lord summons servants from the deep!');
      } else if (ability === 2) {
        const drain = Math.min(5, this.player.hp);
        this.player.hp -= drain;
        monster.hp = Math.min(monster.maxHp, monster.hp + drain);
        this.lastDamageSource = 'Abyss Lord drain';
        this.messageLog.add('The Abyss Lord drains your life force!');
      } else if (this.resolveMonsterAction(monster)) {
        break;
      }
    }
  }

  summonTierTwoMonsters(count, sourceMonster) {
    const pool = MonsterConfig.filter((m) => m.tier === 2);
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    let spawned = 0;
    for (const [dx, dy] of directions) {
      if (spawned >= count) break;
      const x = sourceMonster.x + dx;
      const y = sourceMonster.y + dy;
      const occupied = this.monsters.some((m) => m.hp > 0 && m.x === x && m.y === y) || (this.player.x === x && this.player.y === y);
      if (!occupied && this.map.isWalkable(x, y)) {
        const template = pool[Math.floor(Math.random() * pool.length)];
        const summon = new Monster(x, y, template);
        summon.aiState = 'aware';
        this.monsters.push(summon);
        spawned += 1;
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
        this.messageLog.add(`The ${monster.type} misses you.`, 'info');
      } else {
        this.lastDamageSource = monster.type;
        this.messageLog.add(`The ${monster.type} hits you for ${hit.damage} damage!`, 'playerDamage');
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

  waitTurn(turns = 1) {
    if (this.state !== 'playing' || this.pendingStairsPrompt || this.inventoryOpen || this.helpOpen || this.historyOpen) return false;
    for (let i = 0; i < turns; i++) {
      this.messageLog.add('You wait and listen to the dungeon.', 'info');
      this.endTurn();
      if (this.state !== 'playing') break;
    }
    FOV.compute(this.map, this.player.x, this.player.y, this.getCurrentVision());
    return true;
  }

  updateAnimations() {
    this.effects.playerBlink = (this.effects.playerBlink + 1) % 60;
    this.effects.lowHpBlink = (this.effects.lowHpBlink + 1) % 40;
    if (this.effects.roomTransition > 0) this.effects.roomTransition -= 1;
    if (this.effects.pickupFlash > 0) this.effects.pickupFlash -= 1;
    if (this.effects.criticalFlash > 0) this.effects.criticalFlash -= 1;
    for (const death of this.deadMonsters) death.frames -= 1;
    this.deadMonsters = this.deadMonsters.filter((d) => d.frames > 0);
  }

  currentRoomIndex() {
    return this.map.rooms.findIndex((room) => this.player.x >= room.x && this.player.x < room.x + room.w && this.player.y >= room.y && this.player.y < room.y + room.h);
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

  winGame() {
    this.state = 'victory';
    this.floorsCleared = 10;
    this.finalScore = Math.floor((this.monstersKilled * 10) + this.player.gold + (this.floorsCleared * 100) - (this.turnCount / 10));
  }

  getCurrentVision() {
    const darknessPenalty = this.darknessTurns > 0 ? 2 : 0;
    return Math.max(3, this.player.vision - darknessPenalty);
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.map.width && y < this.map.height;
  }
}
