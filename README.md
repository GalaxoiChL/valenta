# Valența ⚛️

A browser idle game where you build matter from scratch, using real atoms and real chemistry rules.

**Play online:** [valenta-five.vercel.app](https://valenta-five.vercel.app)

> The game itself is currently in Romanian.

---

## About the game

In Valența, atoms are your building blocks and chemical valences are the rules. Hydrogen forms one bond, oxygen two, carbon four. Every valid molecule you synthesize goes into your lab and produces energy, even while you're away.

You spend energy on atom generators, and the knowledge you earn from discoveries unlocks new elements in the periodic table. New elements mean new molecules, and the loop starts again at a bigger scale.

Every real molecule you discover (water, ammonia, ethanol, sulfuric acid...) comes with its name and a short fact about what it does in the real world. You learn chemistry without noticing.

## Features

- **Molecule builder:** drag & drop with single, double and triple bonds, plus live valence checks
- **Ionic and organic chemistry:** from table salt to organic compounds
- **Periodic table:** elements unlocked step by step across 17 tiers
- **230+ real molecules** to discover
- **Chemical reactions:** discovered compounds react with each other using real, balanced equations
- **DNA/RNA:** sequence editor with real mutations
- **Anatomy:** visual explorer of the human body (skeleton, muscles, organs, circulatory system)
- **Idle and offline progress:** production keeps running while the game is closed
- **Nucleosynthesis:** a prestige reset that turns your progress into stars with permanent bonuses
- **Autosave** in the browser, plus save export and import

## Running locally

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open the address shown in the terminal (usually `http://localhost:5173`).

| Command | What it does |
|---|---|
| `npm run dev` | Starts the game in development mode |
| `npm run build` | Builds the production version into `dist/` |
| `npm test` | Runs the automated tests |

## Tech stack

TypeScript and Vite, with no UI framework. Tests are written with Vitest.

## Project structure

```
src/
  chem/   chemistry engine: elements, bonds, validation, reactions
  bio/    DNA/RNA and anatomy
  core/   economy, progression, saving
  ui/     game interface
tests/    automated tests
```

The full game design is in [`VALENTA_SPEC.md`](VALENTA_SPEC.md) and the development history is in [`DEVLOG.md`](DEVLOG.md) (both in Romanian).

## Credits

Anatomy illustrations come from Wikimedia Commons. Author and license details are in the metadata of each SVG file in `public/anatomy/`.
