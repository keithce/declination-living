# Declination Living

Declination Living is an astrology-based location app that maps planetary declinations to Earth latitudes and visualizes relocation signals on a 3D globe.

![Landing Page](docs/images/landing-preview.png)

## What The App Does

- Calculates natal declinations from birth date/time/timezone
- Scores latitude fit using weighted planetary preferences
- Generates ACG lines, zenith bands, paran data, and scoring grids
- Ranks candidate cities by combined astrological score
- Saves charts and supports shareable chart links

## Current Product State

Implemented and active:

- Core calculator flow (`/calculator`) with progressive visualization loading
- Enhanced custom Three.js globe with layered rendering (zenith, ACG, parans, heatmap, city markers)
- Chart storage and sharing primitives (dashboard, save, share slug)

Known limitations (as of February 22, 2026):

- Saved chart route (`/results/$chartId`) still has TODO placeholders for full ACG and ranked-city wiring.
- Shared chart route (`/chart/$slug`) uses a legacy lightweight globe path with derived/mock summary visuals rather than the full enhanced pipeline.

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Frontend         | TanStack Start (React 19 + Vite)         |
| Routing          | TanStack Router (file-based routes)      |
| Backend          | Convex (database + functions)            |
| Styling          | Tailwind CSS v4 + shadcn/ui              |
| 3D Visualization | Custom Three.js scene/layer/shader stack |
| Astronomy        | astronomia + sweph-wasm integration path |
| Auth             | Convex Auth                              |
| Animation        | Framer Motion                            |

## Key Paths

- Frontend routes: `src/routes/`
- Globe implementation: `src/components/globe/`
- Results layout: `src/components/results/`
- Calculations: `convex/calculations/`
- Charts/cache APIs: `convex/charts/`, `convex/cache/`

## Development

### Prerequisites

- Bun
- Convex account

### Install

```bash
bun install
npx convex init
```

### Run

```bash
# Terminal 1
bun run dev

# Terminal 2
npx convex dev
```

### Validate

```bash
bun run typecheck
bun run test
bun run build
```

### File size limit (pre-commit hook)

A pre-commit hook blocks committing any file over **5,000 estimated tokens** (bytes / 4, so 20,000 bytes). Large files are hard for people and coding agents to read and edit safely, so split them by responsibility instead. The hook is installed automatically by `bun install` (via `simple-git-hooks`); run `bunx simple-git-hooks` to reinstall it. It checks only staged files and skips lockfiles, generated code, binaries and other non-authored files listed in `scripts/check-file-tokens.mjs`. Use `bun run check:file-tokens -- --all` to list tracked files already over the limit, and `git commit --no-verify` only in an emergency.

## Commands

| Command                              | Description                                   |
| ------------------------------------ | --------------------------------------------- |
| `bun run dev`                        | Start frontend on port 3000                   |
| `npx convex dev`                     | Start Convex backend                          |
| `bun run test`                       | Run tests                                     |
| `bun run typecheck`                  | Type-check project                            |
| `bun run build`                      | Production build                              |
| `bun run docs:check`                 | Validate markdown file-path references        |
| `bun run check:file-tokens -- --all` | List tracked files over the 5,000-token limit |

## License

MIT
