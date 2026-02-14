import { GameConfig } from '../config/GameConfig.js';
import { MonsterConfig } from '../config/MonsterConfig.js';
import { ItemConfig } from '../config/ItemConfig.js';

export class Renderer {
  constructor(root, actions = {}) {
    this.root = root;
    this.actions = actions;
    this.cells = [];
    this.prevCells = [];
    this.screen = '';
  }

  render(game) {
    if (game.state === 'title' || game.state === 'dead' || game.state === 'victory') {
      this.cells = [];
      this.prevCells = [];
      this.renderMetaScreen(game);
      return;
    }
    this.renderGameScreen(game);
  }

  renderMetaScreen(game) {
    const titleArt = `
  ___   _____ _____ ___ ___   ___  ___ ___ _____ _  _ ___
 / _ \\ / ____|  ___|_ _|_ _| |   \\| __| _ \\_   _| || / __|
| |_| |\\__ \\ | |__  | | | |  | |) | _||  _/ | | | __ \\__ \\
 \\___/ |___/ |____|___|___| |___/|___|_|   |_| |_||_|___/
`;
    const showTitle = game.state === 'title';
    const showDeath = game.state === 'dead';
    const heading = showTitle ? 'ASCII Depths' : showDeath ? `You Died on Floor ${game.floor}` : 'Victory!';
    const details = showTitle
      ? '<p class="pulse">Press Enter to Begin</p>'
      : `<p>Score: ${showDeath ? Math.max(0, Math.floor((game.monstersKilled * 10) + game.player.gold + (game.floor * 30) - (game.turnCount / 10))) : game.finalScore}</p><p>Kills: ${game.monstersKilled} | Gold: ${game.player.gold}</p>`;

    this.root.innerHTML = `<section class="title-screen"><pre>${titleArt}</pre><h2>${heading}</h2>${details}
      <div class="menu-row"><button data-act="start">Start</button><button data-act="scores">High Scores</button><button data-act="settings">Settings</button></div>
      ${game.menuScreen === 'scores' ? this.renderScores(game) : ''}
      ${game.menuScreen === 'settings' ? this.renderSettings(game) : ''}
      <p>Arrow Keys to Move | i Inventory | Esc Pause | ? Help</p>
    </section>`;
    this.bindMenuActions();
  }

  renderGameScreen(game) {
    const { width, height } = GameConfig.viewport;
    const offsetY = Math.max(0, Math.min(game.player.y - Math.floor(height / 2), game.map.height - height));
    const offsetX = Math.max(0, Math.min(game.player.x - Math.floor(width / 2), game.map.width - width));

    if (this.screen !== 'game') {
      this.root.innerHTML = `<div class="crt-overlay"></div><main class="game-shell"><header class="top-bar stat1"></header><header class="top-bar stat2"></header><section class="ascii-grid" style="grid-template-columns:repeat(${width}, 1ch)"></section><section class="dynamic-panels"></section><section class="message-log"></section></main>`;
      const grid = this.root.querySelector('.ascii-grid');
      this.cells = Array.from({ length: width * height }, () => {
        const span = document.createElement('span');
        span.textContent = ' ';
        grid.appendChild(span);
        return span;
      });
      this.prevCells = Array.from({ length: width * height }, () => '');
      this.screen = 'game';
    }

    const nextCells = [];
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
          weight = monster.bold ? 'bold' : 'normal';
        } else if (visible && deadMonster) {
          glyph = deadMonster.glyph;
          color = '#ff3b3b';
        }
        if (game.player.x === mapX && game.player.y === mapY) {
          glyph = game.player.glyph;
          color = '#ffffff';
          weight = 'bold';
        }
        if (game.effects.criticalFlash > 0 && game.effects.criticalPos?.x === mapX && game.effects.criticalPos?.y === mapY) extraClass = 'critical-cell';
        if (game.effects.pickupFlash > 0 && game.effects.pickupFlashPos?.x === mapX && game.effects.pickupFlashPos?.y === mapY) extraClass = 'pickup-flash';
        nextCells.push(`${glyph}|${color}|${weight}|${extraClass}`);
      }
    }

    nextCells.forEach((sig, idx) => {
      if (sig === this.prevCells[idx]) return;
      const [glyph, color, weight, cls] = sig.split('|');
      const el = this.cells[idx];
      el.textContent = glyph;
      el.style.color = color;
      el.style.fontWeight = weight;
      el.className = cls;
      this.prevCells[idx] = sig;
    });

    const stat1 = this.root.querySelector('.stat1');
    const stat2 = this.root.querySelector('.stat2');
    const log = this.root.querySelector('.message-log');
    const panel = this.root.querySelector('.dynamic-panels');
    const weaponLabel = game.player.equipment.weapon ? `${game.player.equipment.weapon.name} (+${game.player.equipment.weapon.str})` : 'None';
    const armorLabel = game.player.equipment.armor ? `${game.player.equipment.armor.name} (+${game.player.equipment.armor.def})` : 'None';
    stat1.textContent = `HP ${game.player.hp}/${game.player.maxHp} | STR ${game.player.str} DEF ${game.player.def} | Hunger ${game.hunger.value} | Floor ${game.floor} | Turn ${game.turnCount}`;
    stat2.textContent = `Wpn: ${weaponLabel} | Arm: ${armorLabel} | Kills: ${game.monstersKilled}`;
    log.innerHTML = game.messageLog.messages.map((m) => `<div class="msg-${m.color}">${m.text}</div>`).join('');

    panel.innerHTML = `${game.pendingStairsPrompt ? `<section class="prompt">Descend to Floor ${game.floor + 1}? (Y/N)</section>` : ''}${game.inventoryOpen ? this.renderInventory(game) : ''}${game.helpOpen ? this.renderHelp() : ''}${game.historyOpen ? this.renderHistory(game) : ''}${game.pauseOpen ? this.renderPause(game) : ''}${game.menuScreen === 'settings' ? this.renderSettings(game) : ''}`;
    this.bindMenuActions();
  }

  bindMenuActions() {
    this.root.querySelectorAll('[data-act="start"]').forEach((el) => el.addEventListener('click', () => this.actions.onStart?.()));
    this.root.querySelectorAll('[data-act="scores"]').forEach((el) => el.addEventListener('click', () => this.actions.onScores?.()));
    this.root.querySelectorAll('[data-act="settings"]').forEach((el) => el.addEventListener('click', () => this.actions.onSettings?.()));
    this.root.querySelectorAll('[data-act="close-menu"]').forEach((el) => el.addEventListener('click', () => this.actions.onCloseMenu?.()));
    this.root.querySelectorAll('[data-act="resume"]').forEach((el) => el.addEventListener('click', () => this.actions.onPause?.()));

    this.root.querySelectorAll('[data-setting]').forEach((el) => {
      el.addEventListener('change', (event) => {
        const target = event.target;
        const key = target.dataset.setting;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.actions.onUpdateSetting?.(key, value);
      });
    });
  }

  renderScores(game) {
    const rows = game.highScores.map((entry, index) => `<tr class="${entry.id === game.lastQualifiedRunId ? 'highlight' : ''}"><td>${index + 1}</td><td>${entry.score}</td><td>${entry.floor}</td><td>${entry.cause}</td><td>${entry.date}</td></tr>`).join('');
    return `<section class="overlay-panel"><h3>High Scores</h3><table class="score-table"><thead><tr><th>#</th><th>Score</th><th>Floor</th><th>Death/End</th><th>Date</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No runs yet.</td></tr>'}</tbody></table><p>Stats: Games ${game.stats.totalGames} | Kills ${game.stats.totalKills} | Deepest ${game.stats.deepestFloor} | Most Gold ${game.stats.mostGold}</p><button data-act="close-menu">Close</button></section>`;
  }

  renderSettings(game) {
    const s = game.settings;
    return `<section class="overlay-panel"><h3>Settings</h3>
    <label>Font Size <select data-setting="fontSize"><option value="small" ${s.fontSize === 'small' ? 'selected' : ''}>Small (14px)</option><option value="medium" ${s.fontSize === 'medium' ? 'selected' : ''}>Medium (16px)</option><option value="large" ${s.fontSize === 'large' ? 'selected' : ''}>Large (18px)</option></select></label>
    <label>Scanlines <input data-setting="scanlines" type="checkbox" ${s.scanlines ? 'checked' : ''}></label>
    <label>CRT Effect <input data-setting="crt" type="checkbox" ${s.crt ? 'checked' : ''}></label>
    <label>Mobile Controls <select data-setting="mobileControls"><option value="auto" ${s.mobileControls === 'auto' ? 'selected' : ''}>Auto-detect</option><option value="on" ${s.mobileControls === 'on' ? 'selected' : ''}>On</option><option value="off" ${s.mobileControls === 'off' ? 'selected' : ''}>Off</option></select></label>
    <label>Theme <select data-setting="theme"><option value="green" ${s.theme === 'green' ? 'selected' : ''}>Classic Green</option><option value="amber" ${s.theme === 'amber' ? 'selected' : ''}>Amber</option><option value="white" ${s.theme === 'white' ? 'selected' : ''}>White</option></select></label>
    <button data-act="close-menu">Close</button></section>`;
  }

  renderPause() {
    return `<section class="overlay-panel"><h3>Paused</h3><div class="menu-row"><button data-act="resume">Resume</button><button data-act="settings">Settings</button></div></section>`;
  }

  renderHelp() {
    const monsters = MonsterConfig.map((m) => `<li><b>${m.glyph}</b> = ${m.type}</li>`).join('');
    const itemList = [...ItemConfig.weapons, ...ItemConfig.armor, ...ItemConfig.consumables];
    const items = itemList.map((i) => `<li><b>${i.glyph}</b> = ${i.name}</li>`).join('');
    return `<section class="overlay-panel"><h3>Help / Controls</h3><p>Arrows/WASD move | i inventory | d drop mode | . wait | ? help | M history | Esc pause</p><div class="legend"><div><h4>Monsters</h4><ul>${monsters}</ul></div><div><h4>Items</h4><ul>${items}</ul></div></div></section>`;
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

  getTileColor(glyph, visible) {
    if (!visible) return GameConfig.colors.explored;
    if (glyph === GameConfig.tileTypes.WALL) return GameConfig.colors.wall;
    if (glyph === GameConfig.tileTypes.DOOR) return GameConfig.colors.door;
    if (glyph === GameConfig.tileTypes.STAIRS_UP || glyph === GameConfig.tileTypes.STAIRS_DOWN) return GameConfig.colors.stairs;
    if (glyph === GameConfig.tileTypes.WATER) return GameConfig.colors.water;
    return GameConfig.colors.floor;
  }
}
