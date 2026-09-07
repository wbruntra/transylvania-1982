# Transylvania (1982) — Web Port

An illustrated web port of Antonio Antiochia's seminal 1982 graphic adventure **Transylvania**, originally published by Penguin Software for the Apple II.

Built with pure vanilla JavaScript, modern responsive CSS, interactive SVG overlays, an automated cartographer map drawer, and full Apple II command parity driven by original disk extraction.

## Features

- **Accurate 1982 Engine & Logic**: 100% faithful port of the original Apple II BASIC (`TRANS.bas`) and assembly parsing logic (`TPAR`), covering all 38 rooms, 39 objects, 89 verbs, and 171 nouns.
- **Scene Art & Modern Overlays**: High-resolution atmospheric room illustrations with dynamic layered SVG paper-cutout sprites (Werewolf, Vampire, Goblin, Cat, Frog, Sabrina, Saucer, etc.) and classic 1982 Apple II graphic toggling.
- **Interactive Automap**: Real-time Cartographer HUD and expandable journal map tracking visited rooms, compass exits, and discovered items.
- **Responsive Layout**: Stage-frame presentation scaling 1:1 on desktop and mobile viewports with an inline command prompt docked directly below the illustration.
- **Modern Quality-of-Life**: Context-aware smart action chips, 3x3 directional D-pad with exit lighting, persistent state saving, debug mode, and no inventory limits.
- **Automated Verification**: End-to-end walkthrough test suite verifying game solvability directly against the 1982 puzzle logic.

## Quick Start

```sh
# Navigate to the web directory
cd web

# Install dependencies
npm install

# Start local dev server
npm run dev

# Run automated game walkthrough and engine test suite
npm test

# Build for production
npm run build
```

## How It Works

1. `tools/extract.py`: Direct DOS 3.3 disk reader extracting room descriptions, exits, objects, and vocabulary tables from original disk images into `trans_port_kit/game.json`.
2. `tools/sync-data.mjs`: Validates and synchronizes canonical game data into the web bundle.
3. `web/src/engine/`: Pure headless game engine decoupled from DOM rendering.
4. `web/src/ui/`: Responsive stage-frame UI, SVG overlay engine, directional touch deck, and automap renderer.

## Playing Online

The game is hosted on GitHub Pages:
https://wbruntra.github.io/transylvania-1982/
