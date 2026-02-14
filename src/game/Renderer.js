import { GameConfig } from '../config/GameConfig.js';
import { MonsterConfig } from '../config/MonsterConfig.js';
import { ItemConfig } from '../config/ItemConfig.js';

export class Renderer {
  constructor(root) {
    this.root = root;
  }

  render(game) {
    if (game.state === 'dead') {
      this.renderGameOver(game);
      return;
    }
    if (game.state === 'victory') {
      this.renderVictory(game);
      return;
    }

    const { width, height } = GameConfig.viewport;
    const offsetY = Math.max(0, Math.min(game.player.y - Math.floor(height / 2), game.map.height - height));
    const offsetX = Math.max(0, Math.min(game.player.x - Math.floor(width / 2), game.map.width - width));

    let gridHtml = '';
    const transitionClass = game.effects.roomTransition > 0 ? 'room-transition' : '';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const mapX = x + offsetX;
        const mapY = y + offsetY;
        const visible = game.map.visibility[mapY]?.[mapX];
        let glyph = ' ';
        let color = GameConfig.colors.unseen;
        let weight = 'normal';
        let extraClass = '';

        if (visible) {
          glyph = game.map.tiles[mapY][mapX];
          color = this.getTileColor(glyph, true);
          if (glyph === GameConfig.tileTypes.STAIRS_UP || glyph === GameConfig.tileTypes.STAIRS_DOWN) weight = 'bold';
        } else if (game.map.explored[mapY]?.[mapX]) {
          glyph = game.map.tiles[mapY][mapX];
          color = GameConfig.colors.explored;
        }

        const monster = game.monsters.find((m) => m.x === mapX && m.y === mapY && m.hp > 0);
        const deadMonster = game.deadMonsters.find((m) => m.x === mapX && m.y === mapY);
        const item = game.items.find((it) => it.x === mapX && it.y === mapY);
        if (visible && item) {
          glyph = item.glyph;
          color = item.color;
        }
        if (visible && monster) {
          glyph = monster.aiState === 'sleeping' ? 'Z' : monster.glyph;
          color = monster.color;
          if (monster.bold) weight = 'bold';
        } else if (visible && deadMonster) {
          glyph = deadMonster.glyph;
          color = '#ff3b3b';
        }

        if (game.effects.pickupFlash > 0 && game.effects.pickupFlashPos?.x === mapX && game.effects.pickupFlashPos?.y === mapY) {
          extraClass = 'pickup-flash';
        }

        if (game.player.x === mapX && game.player.y === mapY && (visible || game.map.explored[mapY]?.[mapX])) {
          glyph = game.player.glyph;
          color = game.effects.playerBlink < 30 ? '#ffffff' : '#ffd85f';
          weight = 'bold';
        }

        if (game.effects.criticalFlash > 0 && game.effects.criticalPos?.x === mapX && game.effects.criticalPos?.y === mapY) {
          extraClass = 'critical-cell';
        }

        gridHtml += `<span class="${extraClass}" style="color:${color};font-weight:${weight}">${glyph}</span>`;
      }
    }

    const weaponLabel = game.player.equipment.weapon ? `${game.player.equipment.weapon.name} (+${game.player.equipment.weapon.str})` : 'None';
    const armorLabel = game.player.equipment.armor ? `${game.player.equipment.armor.name} (+${game.player.equipment.armor.def})` : 'None';
    const lowHp = game.player.hp / game.player.maxHp < 0.25;

    this.root.innerHTML = `
      <div class="crt-overlay"></div>
      <main class="game-shell ${transitionClass}">
      <header class="top-bar ${lowHp && game.effects.lowHpBlink < 20 ? 'low-hp' : ''}">HP ${game.player.hp}/${game.player.maxHp} | STR ${game.player.str} DEF ${game.player.def} | Hunger ${game.hunger.value} | Floor ${game.floor} | Turn ${game.turnCount}</header>
      <header class="top-bar">Wpn: ${weaponLabel} | Arm: ${armorLabel} | Kills: ${game.monstersKilled} ${game.hasAmulet ? '| Amulet: Yes' : ''}</header>
      <section class="ascii-grid" style="grid-template-columns:repeat(${width}, 1ch)">${gridHtml}</section>
      ${game.pendingStairsPrompt ? `<section class="prompt">Descend to Floor ${game.floor + 1}? (Y/N)</section>` : ''}
      ${game.inventoryOpen ? this.renderInventory(game) : ''}
      ${game.helpOpen ? this.renderHelp() : ''}
      ${game.historyOpen ? this.renderHistory(game) : ''}
      <section class="message-log">${game.messageLog.messages.map((m) => `<div class="msg-${m.color}">${m.text}</div>`).join('')}</section>
      </main>
    `;
  }

  renderHelp() {
    const monsters = MonsterConfig.map((m) => `<li><b>${m.glyph}</b> = ${m.type}</li>`).join('');
    const itemList = [...ItemConfig.weapons, ...ItemConfig.armor, ...ItemConfig.consumables];
    const items = itemList.map((i) => `<li><b>${i.glyph}</b> = ${i.name}</li>`).join('');
    return `<section class="overlay-panel"><h3>Help / Controls</h3><p>Arrows/WASD move | i inventory | d drop mode | . wait | ? help | M message history</p><div class="legend"><div><h4>Monsters</h4><ul>${monsters}</ul></div><div><h4>Items</h4><ul>${items}</ul></div></div></section>`;
  }

  renderHistory(game) {
    const rows = [...game.messageLog.history].reverse().map((m) => `<div class="msg-${m.color}">${m.text}</div>`).join('');
    return `<section class="overlay-panel history"><h3>Message History (M to close)</h3><div class="history-scroll">${rows}</div></section>`;
  }

  renderInventory(game) {
    const rows = Array.from({ length: game.inventory.maxSlots }, (_, i) => {
      const item = game.inventory.items[i];
      return `<div>${i + 1}. ${item ? item.name : '-'}</div>`;
    }).join('');
    return `<section class="inventory-overlay"><h3>Inventory (1-0 use/equip, D + slot drop, I close)</h3>${rows}</section>`;
  }

  renderGameOver(game) {
    this.root.innerHTML = `
      <section class="title-screen">
<pre>
YOU DIED ON FLOOR ${game.floor}.
Cause of death: ${game.deathCause || 'Unknown'}
Killer: ${game.killer || 'Unknown'}
Turns survived: ${game.turnCount}
Monsters slain: ${game.monstersKilled}

Press Enter to try again
</pre>
      </section>
    `;
  }

  renderVictory(game) {
    this.root.innerHTML = `
      <section class="title-screen">
<pre>
Ascended with the Amulet of the Depths! Final Score: ${game.finalScore}

Floors cleared: ${game.floorsCleared}
Monsters killed: ${game.monstersKilled}
Turns taken: ${game.turnCount}
Gold collected: ${game.player.gold}

Press Enter to descend again
</pre>
      </section>
    `;
  }

  getTileColor(glyph, visible) {
    if (!visible) return GameConfig.colors.explored;
    if (glyph === GameConfig.tileTypes.WALL) return GameConfig.colors.wall;
    if (glyph === GameConfig.tileTypes.DOOR) return GameConfig.colors.door;
    if (glyph === GameConfig.tileTypes.STAIRS_UP || glyph === GameConfig.tileTypes.STAIRS_DOWN) return GameConfig.colors.stairs;
    if (glyph === GameConfig.tileTypes.WATER) return GameConfig.colors.water;
    return GameConfig.colors.floor;
  }

  renderTitle(onStart) {
    this.root.innerHTML = `
      <section class="title-screen" role="button" tabindex="0">
<pre>
  ___   _____ _____ ___ ___   ___  ___ ___ _____ _  _ ___
 / _ \ / ____|  ___|_ _|_ _| |   \| __| _ \_   _| || / __|
| |_| |\__ \ | |__  | | | |  | |) | _||  _/ | | | __ \__ \
 \___/ |___/ |____|___|___| |___/|___|_|   |_| |_||_|___/
</pre>
        <p class="pulse">Press Enter to Begin</p>
        <p>Arrow Keys to Move | i = Inventory | d = Drop | ? = Help</p>
      </section>
    `;
    const title = this.root.querySelector('.title-screen');
    title?.addEventListener('click', onStart, { once: true });
  }
}
