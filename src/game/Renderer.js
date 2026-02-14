import { GameConfig } from '../config/GameConfig.js';

export class Renderer {
  constructor(root) {
    this.root = root;
  }

  render(game) {
    const { width, height } = GameConfig.viewport;
    const offsetY = Math.max(0, Math.min(game.player.y - Math.floor(height / 2), game.map.height - height));
    const offsetX = Math.max(0, Math.min(game.player.x - Math.floor(width / 2), game.map.width - width));

    let gridHtml = '';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const mapX = x + offsetX;
        const mapY = y + offsetY;
        const visible = game.map.visibility[mapY]?.[mapX];
        let glyph = ' ';
        let color = GameConfig.colors.unseen;
        let weight = 'normal';

        if (visible) {
          glyph = game.map.tiles[mapY][mapX];
          color = this.getTileColor(glyph, true);
          if (glyph === GameConfig.tileTypes.STAIRS_UP || glyph === GameConfig.tileTypes.STAIRS_DOWN) weight = 'bold';
        } else if (game.map.explored[mapY]?.[mapX]) {
          glyph = game.map.tiles[mapY][mapX];
          color = GameConfig.colors.explored;
        }

        const monster = game.monsters.find((m) => m.x === mapX && m.y === mapY && m.hp > 0);
        const item = game.items.find((it) => it.x === mapX && it.y === mapY);
        if (visible && item) {
          glyph = item.glyph;
          color = item.color;
        }
        if (visible && monster) {
          glyph = monster.aiState === 'sleeping' ? 'Z' : monster.glyph;
          color = monster.color;
          if (monster.bold) weight = 'bold';
        }
        if (game.player.x === mapX && game.player.y === mapY && (visible || game.map.explored[mapY]?.[mapX])) {
          glyph = game.player.glyph;
          color = game.player.color;
          weight = 'bold';
        }

        gridHtml += `<span style="color:${color};font-weight:${weight}">${glyph}</span>`;
      }
    }

    const weaponLabel = game.player.equipment.weapon ? `${game.player.equipment.weapon.name} (+${game.player.equipment.weapon.str})` : 'None';
    const armorLabel = game.player.equipment.armor ? `${game.player.equipment.armor.name} (+${game.player.equipment.armor.def})` : 'None';

    this.root.innerHTML = `
      <header class="top-bar">HP ${game.player.hp}/${game.player.maxHp} | STR ${game.player.str} DEF ${game.player.def} | Hunger ${game.hunger.value} | Floor ${game.floor} | Turn ${game.turnCount}</header>
      <header class="top-bar">Wpn: ${weaponLabel} | Arm: ${armorLabel}</header>
      <section class="ascii-grid" style="grid-template-columns:repeat(${width}, 1ch)">${gridHtml}</section>
      ${game.pendingStairsPrompt ? '<section class="prompt">Descend? (Y/N)</section>' : ''}
      ${game.inventoryOpen ? this.renderInventory(game) : ''}
      <section class="message-log">${game.messageLog.messages.map((m) => `<div class="msg-${m.color}">${m.text}</div>`).join('')}</section>
    `;
  }

  renderInventory(game) {
    const rows = Array.from({ length: game.inventory.maxSlots }, (_, i) => {
      const item = game.inventory.items[i];
      return `<div>${i + 1}. ${item ? item.name : '-'}</div>`;
    }).join('');
    return `<section class="inventory-overlay"><h3>Inventory (1-0 use/equip, D + slot drop, I close)</h3>${rows}</section>`;
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
   ___   _____ _______ _____ _____   _____  ______ _____ _______ _    _  _____ 
  / _ \ / ____|__   __|_   _|  __ \ |  __ \|  ____|  __ \__   __| |  | |/ ____|
 | | | | (___    | |    | | | |  | || |  | | |__  | |__) | | |  | |__| | (___  
 | | | |\___ \   | |    | | | |  | || |  | |  __| |  ___/  | |  |  __  |\___ \ 
 | |_| |____) |  | |   _| |_| |__| || |__| | |____| |      | |  | |  | |____) |
  \___/|_____/   |_|  |_____|_____/ |_____/|______|_|      |_|  |_|  |_|_____/ 
</pre>
        <p>Press Enter or tap START to descend.</p>
      </section>
    `;
    const title = this.root.querySelector('.title-screen');
    title?.addEventListener('click', onStart, { once: true });
  }
}
