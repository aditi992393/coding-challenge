# Travel Planner

A scalable, accessible frontend travel-planning application that consumes weather and
geolocation data from the [Open-Meteo](https://open-meteo.com/) APIs. Users can search
for any city, view a 7-day forecast, and see ranked recommendations for four activities
(skiing, surfing, indoor sightseeing, outdoor sightseeing) based on the forecast.

> Submission for the **Senior Web Engineer Test**.

---

## Project overview

The example user flow is exactly as specified in the brief:

1. The user types `Lon` into the search box.
2. Suggestions (`London`, `Londonderry`, …) appear inside an accessible combobox.
3. The user selects a city with mouse or keyboard.
4. A 7-day forecast is rendered.
5. Activities are ranked by suitability against that forecast.

## Architecture decisions

```
src/
├── api/                       # 🌐 API layer — GraphQL abstraction + REST resolvers
│   ├── client.ts              # Local GraphQL executor (parses gql, routes to resolvers)
│   ├── queries/               # gql query documents (searchCities, getWeather)
│   └── resolvers/             # Functions that hit Open-Meteo REST endpoints
├── features/                  # 🧠 Feature modules — React Query hooks per domain
│   ├── city-search/           #     useCitySearch
│   ├── weather/               #     useWeatherForecast
│   └── activities/            #     useActivityRanking (pure-logic adapter)
├── components/                # 🎨 UI layer
│   ├── common/                #     Spinner, ErrorBoundary, EmptyState, Skeleton
│   ├── CitySearch/            #     ARIA combobox with keyboard nav
│   ├── WeatherForecast/       #     Current + 7-day grid
│   └── ActivityRecommendations/   # Ranked list with progress bars
├── hooks/                     # ♻️ Generic, app-agnostic hooks (useDebounce)
├── store/                     # 📦 Zustand store (selected city only)
├── utils/                     # 🧮 Pure business logic (activity scoring, WMO labels)
├── types/                     # 📐 Domain types shared across layers
├── App.tsx                    # Composition root
└── main.tsx                   # Bootstraps QueryClient + StrictMode
```

**Separation of concerns** is enforced through the directory layout:

| Layer            | Responsibility                                            | Talks to                       |
| ---------------- | --------------------------------------------------------- | ------------------------------ |
| `components/`    | Rendering, accessibility, interactions                    | `features/`, `store/`          |
| `features/`      | Wraps GraphQL queries with React Query                    | `api/`, `utils/`               |
| `api/`           | GraphQL abstraction; resolvers call Open-Meteo REST       | `types/`                       |
| `utils/`         | Pure, deterministic business logic (activity scoring)     | nothing                        |
| `store/`         | Client UI state (the selected city)                       | nothing                        |
| `types/`         | Domain models shared by all of the above                  | nothing                        |

This means each layer can be tested or replaced independently — for example, the
activity ranking is a pure function with no React, no fetch, and no store dependency.

### GraphQL abstraction

Since the challenge ships no backend, the app contains a **lightweight in-process
GraphQL executor** (`src/api/client.ts`):

- Queries are written as real `gql` documents (`SEARCH_CITIES_QUERY`, `GET_WEATHER_QUERY`).
- `executeQuery` parses the document, picks the root field name, and dispatches to a
  typed resolver registered for that field.
- Resolvers (`api/resolvers/*.ts`) translate Open-Meteo's REST responses into our
  domain types.
- The result is wrapped as `{ [rootField]: <data> }` to mirror a real GraphQL response.

This satisfies the brief's "lightweight frontend GraphQL abstraction layer" option and
keeps the door open to swap in a real GraphQL endpoint with no consumer changes.

## Technical choices

| Concern              | Choice                              | Why                                                          |
| -------------------- | ----------------------------------- | ------------------------------------------------------------ |
| Build/dev server     | **Vite**                            | Fast, modern; first-class TS + React 19 support              |
| Language             | **TypeScript** (strict mode)        | Required by the brief; catches whole classes of bugs         |
| Server state         | **@tanstack/react-query v5**        | Built-in caching, retries, loading/error states              |
| Client state         | **Zustand**                         | Minimal API; co-locates state with hooks; tree-shakeable     |
| GraphQL layer        | **graphql-tag + custom executor**   | Real `gql` syntax, no need for a hosted server               |
| Styling              | **Tailwind CSS**                    | Utility classes keep responsive design declarative           |
| Testing              | **Jest + React Testing Library**    | Required by the brief; data-driven tests, user-centric APIs  |
| Accessibility        | **WAI-ARIA combobox pattern**       | Keyboard-first; works with screen readers                    |

## How to run the project

```bash
# install dependencies
npm install

# start the dev server (http://localhost:5173)
npm run dev

# production build (outputs to ./dist)
npm run build

# preview the production build
npm run preview
```

## How to run tests

```bash
# run the full Jest suite
npm test

# watch mode while developing
npm run test:watch

# coverage report
npm run test:coverage
```

Tests live in `__tests__/` and mirror the `src/` structure. Coverage includes:

- `useDebounce` — timer behaviour, cancellation
- `activityScoring` — 7 scenarios covering each activity, edge cases, and clamping
- `<CitySearch />` — empty input, partial input, no results, network error, mouse + keyboard selection
- `<WeatherForecast />` — empty state, skeleton loading, success, error + retry button
- `<ActivityRecommendations />` — ranking, progress bar accessibility

## Assumptions made

- Open-Meteo's free, no-key endpoints are reachable from the browser (CORS-enabled by
  Open-Meteo).
- Minimum query length for autocomplete is 2 characters — typing a single letter
  shouldn't fire a request.
- "Activity recommendations" are computed from the **7-day average** of the forecast,
  not from any single day. Trip planning is inherently multi-day.
- Surf suitability uses **wind speed** as a proxy for wave activity (Open-Meteo's free
  weather endpoint doesn't expose marine data).
- Imperial vs metric: the app uses Open-Meteo's defaults (°C, km/h, mm).

## Trade-offs and omissions

- **Local GraphQL executor instead of a real server.** This was a deliberate trade-off
  driven by the no-backend constraint; the abstraction stays clean but lacks features
  like server-side normalisation or subscription support.
- **Tailwind over CSS Modules.** Faster to iterate at small scale, at the cost of
  occasionally noisier JSX.
- **Zustand over Redux Toolkit.** The app has very little client state — a full Flux
  setup would be overkill.
- **Surfing heuristic is approximate.** A production version would integrate the
  Open-Meteo Marine API (wave height, period, direction).
- **No internationalisation.** Dates are formatted with the user's locale via
  `Intl.DateTimeFormat`, but copy is English-only.
- **No service-worker / offline support.** React Query's cache lasts the session.

## Improvements with more time

- Wire up the **Open-Meteo Marine API** for accurate surf recommendations.
- Add **per-day** activity scoring so users can see "best ski day this week".
- **Map view** (Leaflet/MapLibre) so the selected city is contextualised.
- Add a **dark mode** toggle (tokens are already in place).
- **Code-split** the chart-heavy WeatherForecast (e.g. lazy-load Recharts).
- **Visual regression tests** via Playwright + Chromatic/Loki.
- **GitHub Actions** running `npm test && npm run build` on every PR.
- Generate a **typed GraphQL client** with `graphql-codegen` once a real endpoint exists.
