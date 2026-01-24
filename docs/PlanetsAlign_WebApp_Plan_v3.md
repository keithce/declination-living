# PlanetsAlign Web App Development Plan

*TanStack Start + Convex + Three.js Globe Visualization*

Version 3.0 - Updated with Geoapify Integration

---

## Part 1: How Planet Declinations Are Calculated

### Required Input Data

To calculate a person's natal planet declinations, you need:

| Input | Description |
|-------|-------------|
| Birth Date | Day, month, and year of birth |
| Birth Time | Exact time (hour:minute) - critical for Moon position |
| Birth Location | City name with autocomplete → latitude/longitude via Geoapify |

> **ℹ️ Note:** Timezone is NOT a user input. It is automatically determined from the birth location coordinates using the Geoapify Reverse Geocoding API, which returns timezone data including IANA name, offsets, and DST information.

### Geoapify Integration

The app uses Geoapify APIs for location services:

#### 1. Address Autocomplete (User Input)

When user types a city name, autocomplete suggestions appear with full location data.

```
GET https://api.geoapify.com/v1/geocode/autocomplete
  ?text=Austin,+Texas
  &type=city
  &format=json
  &apiKey=YOUR_API_KEY
```

#### 2. Reverse Geocoding (Timezone Lookup)

Once coordinates are selected, reverse geocoding returns timezone automatically.

```
GET https://api.geoapify.com/v1/geocode/reverse
  ?lat=30.2672
  &lon=-97.7431
  &format=json
  &apiKey=YOUR_API_KEY

// Response includes:
{
  "timezone": {
    "name": "America/Chicago",
    "offset_STD": "-06:00",
    "offset_DST": "-05:00",
    "abbreviation_STD": "CST",
    "abbreviation_DST": "CDT"
  }
}
```

---

## Part 2: Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | TanStack Start | Full-stack React with SSR, routing, server functions |
| Backend | Convex | Reactive database, serverless functions, real-time sync |
| Authentication | Convex Auth | OAuth (Google, GitHub), email/password, sessions |
| Forms | TanStack Form | Type-safe form state, validation with Zod schemas |
| 3D Visualization | Three.js + three-globe | Interactive 3D globe showing optimal locations |
| Location Services | Geoapify API | Autocomplete, reverse geocoding, timezone lookup |
| Ephemeris | astronomia / sweph-wasm | Planet position calculations (Convex action) |
| Styling | Tailwind CSS | Utility-first CSS, responsive design, dark mode |

### Convex Actions Architecture

All heavy calculations run as Convex Actions (serverless functions that can call external APIs):

```typescript
// convex/calculations.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

// Action 1: Calculate natal declinations
export const calculateDeclinations = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    // Convert to Julian Day using timezone
    const jd = toJulianDay(args.birthDate, args.birthTime, args.timezone);

    // Calculate declinations for all planets using Swiss Ephemeris
    const declinations = await calculateAllPlanetDeclinations(jd);

    return declinations;
  },
});

// Action 2: Find optimal locations
export const findOptimalLocations = action({
  args: {
    declinations: v.object({ /* planet declinations */ }),
    weights: v.optional(v.object({ /* planet weights */ })),
  },
  handler: async (ctx, args) => {
    // Calculate alignment scores for latitude bands
    const latitudeScores = calculateLatitudeScores(args.declinations, args.weights);

    // Query cities database for cities at optimal latitudes
    const optimalCities = await ctx.runQuery(
      internal.cities.findByLatitudes,
      { latitudes: latitudeScores.top }
    );

    return { latitudeScores, optimalCities };
  },
});

// Action 3: Lookup cities near coordinates
export const findNearbyCities = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    // Find major and minor cities within radius
    const cities = await ctx.runQuery(
      internal.cities.findNearCoordinates,
      args
    );
    return cities;
  },
});
```

---

## Part 3: City Lookup Process

Once optimal latitudes are calculated, the app needs to find actual cities users can move to. This involves a multi-step lookup process.

### Step 1: Calculate Optimal Latitude Bands

The `calculateOffset()` algorithm determines which latitudes best align with the user's natal declinations. Results are latitude bands (e.g., 30°N-32°N, 45°S-47°S).

### Step 2: Query Cities Database

The Convex database stores a world cities dataset with major and minor cities:

```typescript
// convex/schema.ts
cities: defineTable({
  name: v.string(),
  country: v.string(),
  countryCode: v.string(),
  state: v.optional(v.string()),
  latitude: v.number(),
  longitude: v.number(),
  population: v.number(),
  type: v.union(v.literal("major"), v.literal("minor")),  // Major: >100k, Minor: >10k
})
  .index("by_latitude", ["latitude"])
  .index("by_population", ["population"])
  .searchIndex("search_name", { searchField: "name" }),
```

### Step 3: Find Cities at Optimal Latitudes

```typescript
// convex/cities.ts
import { internalQuery } from "./_generated/server";

export const findByLatitudes = internalQuery({
  args: {
    latitudes: v.array(v.object({
      lat: v.number(),
      score: v.number(),
    })),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const { lat, score } of args.latitudes) {
      // Find cities within ±1° of optimal latitude
      const cities = await ctx.db
        .query("cities")
        .withIndex("by_latitude", (q) =>
          q.gte("latitude", lat - 1).lte("latitude", lat + 1)
        )
        .order("desc")
        .take(args.limit ?? 20);

      // Score each city based on exact latitude match
      const scoredCities = cities.map(city => ({
        ...city,
        alignmentScore: score - Math.abs(city.latitude - lat) * 2,
      }));

      results.push(...scoredCities);
    }

    // Sort by alignment score, return top results
    return results
      .sort((a, b) => b.alignmentScore - a.alignmentScore)
      .slice(0, 50);
  },
});
```

### Step 4: Enrich with Nearby Cities

For each top location, also find smaller nearby cities that might be more practical living options:

```typescript
// Find cities within 100km radius of a point
export const findNearCoordinates = internalQuery({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    // Approximate degree distance (1° ≈ 111km)
    const latRange = args.radiusKm / 111;
    const lngRange = args.radiusKm / (111 * Math.cos(args.latitude * Math.PI / 180));

    const cities = await ctx.db
      .query("cities")
      .withIndex("by_latitude", (q) =>
        q.gte("latitude", args.latitude - latRange)
         .lte("latitude", args.latitude + latRange)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("longitude"), args.longitude - lngRange),
          q.lte(q.field("longitude"), args.longitude + lngRange)
        )
      )
      .collect();

    // Calculate actual distance and filter
    return cities
      .map(city => ({
        ...city,
        distanceKm: haversineDistance(
          args.latitude, args.longitude,
          city.latitude, city.longitude
        ),
      }))
      .filter(city => city.distanceKm <= args.radiusKm)
      .sort((a, b) => b.population - a.population);
  },
});
```

---

## Part 4: Three.js Globe Visualization

### Globe Features

- **Latitude Bands:** Highlighted rings showing optimal latitude zones
- **City Markers:** 3D points with altitude based on alignment score
- **Color Gradient:** Green (best) → Yellow → Red (worst)
- **Arcs:** Animated connections from birth location to top destinations
- **Labels:** City names with scores on hover
- **Interactivity:** Click city to see details, rotate/zoom globe

### Globe Component

```typescript
// app/components/GlobeView.tsx
import ThreeGlobe from 'three-globe';

export function GlobeView({ locations, birthLocation }) {
  const globe = new ThreeGlobe()
    .globeImageUrl('/earth-blue-marble.jpg')

    // City points with altitude based on score
    .pointsData(locations)
    .pointAltitude(d => 0.01 + (d.score / 100) * 0.3)
    .pointColor(d => scoreToColor(d.score))
    .pointRadius(d => 0.3 + (d.score / 100) * 0.5)
    .pointLabel(d => `${d.city}, ${d.country}: ${d.score.toFixed(1)}%`)

    // Arcs from birth location to top 5
    .arcsData(locations.slice(0, 5).map(loc => ({
      startLat: birthLocation.lat,
      startLng: birthLocation.lng,
      endLat: loc.lat,
      endLng: loc.lng,
    })))
    .arcColor(() => ['#00ff88', '#ffaa00'])
    .arcDashLength(0.5)
    .arcDashAnimateTime(2000);

  // ... Three.js scene setup
}
```

---

## Part 5: Development Phases

### Phase 1: Project Setup & Auth (Week 1)

1. Initialize: `npm create convex@latest -- -t tanstack-start`
2. Configure Convex Auth with OAuth providers
3. Set up database schema (users, charts, cities)
4. Import world cities dataset into Convex

### Phase 2: Geoapify & Form Integration (Week 2)

1. Build BirthDataForm with TanStack Form + Zod
2. Integrate Geoapify autocomplete for city search
3. Implement automatic timezone lookup from coordinates
4. Create planet weight sliders component

### Phase 3: Calculation Engine as Convex Actions (Week 3)

1. Port `calculateOffset()` algorithm to TypeScript
2. Create `calculateDeclinations` Convex action
3. Create `findOptimalLocations` Convex action
4. Create `findNearbyCities` Convex action
5. Implement multi-planet weighted optimization

### Phase 4: Three.js Globe (Week 4)

1. Set up Three.js with three-globe library
2. Implement GlobeView component with city markers
3. Add altitude-based 3D visualization
4. Implement arcs and latitude band highlighting
5. Add click handlers and city detail panel

### Phase 5: Dashboard & Persistence (Week 5)

1. Create user dashboard with saved charts
2. Implement save/load chart functionality
3. Add chart comparison mode
4. Export results (PDF, shareable link)

### Phase 6: Polish & Deploy (Week 6)

1. Responsive design for mobile/tablet
2. Dark mode support
3. Performance optimization
4. Deploy to Vercel with Convex production

### Timeline Summary

| Phase | Duration | Week |
|-------|----------|------|
| Phase 1: Project Setup & Auth | 1 week | 1 |
| Phase 2: Geoapify & Form Integration | 1 week | 2 |
| Phase 3: Calculation Engine (Convex Actions) | 1 week | 3 |
| Phase 4: Three.js Globe Visualization | 1 week | 4 |
| Phase 5: Dashboard & Persistence | 1 week | 5 |
| Phase 6: Polish & Deployment | 1 week | 6 |

---

## Part 6: Project Structure

```
planets-align/
├── app/
│   ├── routes/
│   │   ├── __root.tsx          # Root layout with providers
│   │   ├── index.tsx           # Home/landing page
│   │   ├── calculator.tsx      # Main calculator page
│   │   ├── dashboard.tsx       # User dashboard (saved charts)
│   │   └── auth/
│   │       ├── signin.tsx      # Sign in page
│   │       └── signup.tsx      # Sign up page
│   ├── components/
│   │   ├── BirthDataForm.tsx   # TanStack Form for birth info
│   │   ├── GlobeView.tsx       # Three.js globe visualization
│   │   ├── DeclinationTable.tsx
│   │   ├── LocationResults.tsx
│   │   └── PlanetWeights.tsx   # Weight sliders for planets
│   ├── lib/
│   │   ├── ephemeris.ts        # Swiss Ephemeris wrapper
│   │   ├── calculator.ts       # Port of calculateOffset()
│   │   └── geoapify.ts         # Geoapify API client
│   └── router.tsx              # TanStack Router setup
├── convex/
│   ├── schema.ts               # Database schema + authTables
│   ├── auth.config.ts          # Convex Auth configuration
│   ├── calculations.ts         # Declination calculation actions
│   ├── charts.ts               # Saved chart queries/mutations
│   └── cities.ts               # City search queries
├── public/
│   └── earth-blue-marble.jpg   # Globe texture
├── vite.config.ts
└── package.json
```

---

## Part 7: Key Integration Patterns

### TanStack Start + Convex Router Setup

```typescript
// app/router.tsx
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
  const convex = new ConvexReactClient(CONVEX_URL);
  const convexQueryClient = new ConvexQueryClient(convex);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  return routerWithQueryClient(
    createRouter({
      routeTree,
      context: { queryClient },
      Wrap: ({ children }) => (
        <ConvexAuthProvider client={convex}>
          {children}
        </ConvexAuthProvider>
      ),
    }),
    queryClient,
  );
}
```

### Convex Auth Configuration

```typescript
// convex/auth.config.ts
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    GitHub,
    Google,
  ],
});
```

### Convex Query with TanStack Query

```typescript
// Using convexQuery helper for reactive data
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../convex/_generated/api";

function Dashboard() {
  // Reactive query - auto-updates when data changes
  const { data: charts } = useSuspenseQuery(
    convexQuery(api.charts.listByUser, {})
  );

  // Mutation for saving charts
  const saveChart = useConvexMutation(api.charts.save);

  return (
    <div>
      {charts.map(chart => (
        <ChartCard key={chart._id} chart={chart} />
      ))}
    </div>
  );
}
```

---

## Next Steps

1. Run: `npm create convex@latest -- -t tanstack-start`
2. Install dependencies: `@tanstack/react-form`, `three`, `three-globe`, `zod`
3. Set up Convex Auth with `npx @convex-dev/auth`
4. Add Geoapify API key to environment variables
5. Port the `calculateOffset()` algorithm from existing C++ code
6. Begin Phase 1 development
