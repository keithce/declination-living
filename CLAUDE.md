# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Declination Living is an astrology application that calculates planetary declinations and helps users find optimal locations based on their birth chart. Built with TanStack Start (React + Router) frontend and Convex backend.

## Commands

```bash
# Development (run both in parallel)
bun --bun run dev          # Frontend dev server on port 3000
npx convex dev             # Convex backend dev server

# Build & Test
bun --bun run build        # Production build
bun --bun run test         # Run Vitest tests
vitest run src/path/to/test.ts  # Run single test file

# Code Quality
bun --bun run lint         # ESLint
bun --bun run format       # Prettier
bun --bun run check        # Prettier + ESLint with auto-fix

# Add shadcn components
bunx --bun shadcn@latest add <component>
```

## Architecture

### Frontend (`src/`)
- **Routes**: TanStack Router file-based routing in `src/routes/`. Root layout at `__root.tsx`, routes auto-generate `routeTree.gen.ts`
- **Components**: React components in `src/components/`, shadcn/ui components in `src/components/ui/`
- **Integrations**: Provider wrappers in `src/integrations/` for Convex, TanStack Query, and tRPC

### Backend (`convex/`)
- **Schema**: Tables defined in `convex/schema.ts` - `charts`, `cities`, `presets`, `profiles` plus auth tables
- **Calculations**: Ephemeris calculations using astronomia library in `convex/calculations/`
  - `ephemeris.ts`: Planetary position calculations using VSOP87 data
  - `optimizer.ts`: Location scoring algorithms
  - `actions.ts`: Convex actions for computation

### Data Flow
1. User creates birth chart → Convex mutation stores chart data
2. Client requests declination calculations → Convex action uses astronomia library
3. Location matching → optimizer scores cities against planetary declinations
4. Real-time updates via Convex subscriptions

## Key Conventions

### Path Aliases
Use `@/` for imports from `src/`:
```ts
import { Button } from "@/components/ui/button"
import { env } from "@/env"
```

### Environment Variables
- Client-side: Must have `VITE_` prefix, defined in `src/env.ts` with T3Env
- Convex: `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` required in `.env.local`

### Convex Schema Patterns
- Use `v.id("tableName")` for references between tables
- System fields `_id` and `_creationTime` are auto-added
- Define indices for query patterns: `.index("by_field", ["field"])`

### Styling
- Tailwind CSS v4 with shadcn/ui (new-york style, zinc base color)
- CSS variables defined in `src/styles.css`
