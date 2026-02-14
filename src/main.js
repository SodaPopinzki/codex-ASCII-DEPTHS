import './styles/main.css';
import { Game } from './game/Game.js';
import { Renderer } from './game/Renderer.js';
import { InputHandler } from './ui/InputHandler.js';
import { MobileControls } from './ui/MobileControls.js';

const app = document.querySelector('#app');
const game = new Game();
const renderer = new Renderer(app);
let dirty = true;

const draw = () => {
  game.updateAnimations();
  if (game.state === 'title') renderer.renderTitle(() => game.start());
  else renderer.render(game);
  requestAnimationFrame(draw);
};

const refresh = () => {
  dirty = true;
};

new InputHandler((dx, dy) => {
  if (game.movePlayer(dx, dy)) refresh();
}, () => {
  game.start();
  refresh();
}, (choice) => {
  if (game.respondStairs(choice)) refresh();
}, () => {
  game.toggleInventory();
  refresh();
}, (index) => {
  if (game.handleInventorySlot(index)) refresh();
}, () => game.toggleDropMode(), () => {
  game.toggleHelp();
  refresh();
}, () => {
  game.toggleHistory();
  refresh();
}, (turns) => {
  if (game.waitTurn(turns)) refresh();
}).bind();

new MobileControls(app, (dx, dy) => {
  if (game.movePlayer(dx, dy)) refresh();
}, () => {
  if (game.state === 'title') {
    game.start();
    refresh();
  }
}, () => {
  game.toggleInventory();
  refresh();
}, () => {
  if (game.waitTurn(1)) refresh();
}, () => {
  if (game.pendingStairsPrompt) {
    game.respondStairs(true);
    refresh();
  }
}, () => {
  if (game.waitTurn(5)) refresh();
}).mount();

requestAnimationFrame(draw);
