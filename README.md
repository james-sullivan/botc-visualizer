# Blood on the Clocktower Visualizer

A React & TypeScript single-page application for visualizing game logs from the social deduction game *Blood on the Clocktower*.

## Features

- Interactive timeline of in-game events (nominations, votes, powers, deaths, etc.)
- Player status panel with dynamic sizing, health indicators, and hover highlights
- Support for multiple game logs, extracted metadata, and grouping by player count/characters
- Custom icons and colors for each event type
- Desktop-only (mobile devices are not supported)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
cd botc-visualizer
npm install
```

### Running Locally

```bash
npm start
```

Open your browser to [http://localhost:3000](http://localhost:3000).

### Adding Your Game Logs

1. Copy your `.jsonl` files into the `public/` directory.
2. In `src/App.tsx`, update the `GAME_FILES` array with the filenames of your new logs.
3. Restart the development server if it's already running.

### Building for Production

```bash
npm run build
```

The optimized build will be output to the `build/` folder.

## Directory Structure

```
botc-visualizer/
├─ public/            # Static assets and game log files
├─ src/               # Source code (components, styles, types)
├─ README.md          # You are here
├─ package.json       # Project metadata and scripts
├─ tsconfig.json      # TypeScript configuration
└─ ...
```

## License

This project is released under the MIT License. 