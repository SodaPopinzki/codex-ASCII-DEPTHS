# ASCII Depths - Traditional ASCII Roguelike
## Tech: Vanilla JavaScript, HTML, CSS, Vite (build only)
## NO FRAMEWORKS. No Phaser, no React, no Canvas. Pure DOM + CSS Grid.
## Style: Classic ASCII characters on a dark terminal-like background
## Font: Monospace (Courier New or similar), 16px per cell
## Grid: 80 columns x 30 rows visible area, maps are 80x50 (scrolling)
## Turn-based: nothing moves until player moves
## Rules:
- All game logic in pure JS classes
- Render using a pre element or CSS grid of span elements
- Each cell = one character with foreground color
- Mobile: swipe gestures for movement, tap buttons for actions
- All game data in config files
- Permadeath: no save/reload during run
- npm run build before every commit
