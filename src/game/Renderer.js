import { GameConfig } from '../config/GameConfig.js';

export class Renderer {
  constructor(root) {
    this.root = root;
  }

  render(game) {
    const { width, height } = GameConfig.viewport;
    const offsetY = Math.max(0, Math.min(game.player.y - Math.floor(height / 2), game.map.height - height));
    const offsetX = 0;

    let gridHtml = '';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const mapX = x + offsetX;
        const mapY = y + offsetY;
        const visible = game.map.visibility[mapY]?.[mapX];
        let glyph = ' ';
        let color = GameConfig.colors.unseen;

        if (visible) {
          glyph = game.map.tiles[mapY][mapX];
          color = glyph === '#' ? GameConfig.colors.wall : GameConfig.colors.floor;
        }

        const monster = game.monsters.find((m) => m.x === mapX && m.y === mapY && m.hp > 0);
        const item = game.items.find((it) => it.x === mapX && it.y === mapY);
        if (visible && item) {
          glyph = item.glyph;
          color = item.color;
        }
        if (visible && monster) {
          glyph = monster.glyph;
          color = monster.color;
        }
        if (game.player.x === mapX && game.player.y === mapY) {
          glyph = game.player.glyph;
          color = game.player.color;
        }

        gridHtml += `<span style="color:${color}">${glyph}</span>`;
      }
    }

    this.root.innerHTML = `
      <header class="top-bar">HP ${game.player.hp}/${game.player.maxHp} | Hunger ${game.hunger.value} | Floor ${game.floor} | Gold ${game.player.gold}</header>
      <section class="ascii-grid" style="grid-template-columns:repeat(${width}, 1ch)">${gridHtml}</section>
      <section class="message-log">${game.messageLog.messages.map((m) => `<div>${m}</div>`).join('')}</section>
    `;
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
