# Architecture

## Frontend (`src/`)

- **Routes**: TanStack Router file-based routing in `src/routes/`. Root layout at `__root.tsx`, routes auto-generate `routeTree.gen.ts`
- **Components**: React components in `src/components/`, shadcn/ui components in `src/components/ui/`
- **Integrations**: Provider wrappers in `src/integrations/` for Convex, TanStack Query, and tRPC

## Backend (`convex/`)

- **Schema**: Tables defined in `convex/schema.ts` - `charts`, `cities`, `presets`, `profiles`, `calculationCache`, `anonymousUsers` plus auth tables
- **Calculations**: Ephemeris calculations using astronomia library and Swiss Ephemeris (sweph-wasm) in `convex/calculations/`
  - `ephemeris.ts`: Planetary position calculations using VSOP87 data
  - `swissephService.ts`: Swiss Ephemeris integration for enhanced precision
  - `optimizer.ts`: Location scoring algorithms
  - `actions.ts`: Convex actions for computation

## Data Flow

1. User creates birth chart → Convex mutation stores chart data
2. Client requests declination calculations → Convex action uses astronomia library
3. Location matching → optimizer scores cities against planetary declinations
4. Real-time updates via Convex subscriptions

## Environment Variables

- Client-side: Must have `VITE_` prefix, defined in `src/env.ts` with T3Env
- Convex: Only `VITE_CONVEX_URL` is required in `.env.local` for frontend usage
- Note: `CONVEX_DEPLOYMENT` is used by the Convex CLI, not the frontend application
