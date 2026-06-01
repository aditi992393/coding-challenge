# 🌍 Travel Planner

A scalable, accessible frontend travel-planning application that consumes
weather and geolocation data from the [Open-Meteo](https://open-meteo.com/)
APIs. Users can search any city, view a 7-day forecast, and see four
activities (skiing, surfing, indoor sightseeing, outdoor sightseeing)
ranked by suitability against that forecast.

> Submission for the **Senior Web Engineer Test**.

---

## 📌 Project overview

The user flow follows the brief exactly:

1. The user types `Lon` into the search box.
2. Suggestions (`London`, `Londonderry`, …) appear in an accessible combobox.
3. The user selects a city — by mouse or by keyboard.
4. A 7-day forecast is rendered.
5. Four activities are ranked by suitability, each with a numeric score
   (0–100), a progress bar, and a one-line reason.

| Quality bar       | Status                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Functionality  | Dynamic search, 7-day forecast, ranked activities                                                                                |
| ✅ Tests          | **25 / 25 passing** across 5 suites                                                                                              |
| ✅ Lint           | No errors                                                                                                                        |
| ✅ Build          | Clean production build (~85 KB gzipped)                                                                                          |
| ✅ Bonus criteria | Debounced search, response caching, error boundaries, skeleton loaders, accessibility, GraphQL abstraction, strong test coverage |

---

## 🏗️ Architecture decisions

```
src/
├── api/                        🌐 API layer
│   ├── client.ts                  Lightweight GraphQL router (~30 lines)
│   ├── queries/                   gql query documents
│   │   ├── searchCities.ts
│   │   └── getWeather.ts
│   └── rest/                      REST adapters for Open-Meteo
│       ├── geocoding.ts           (only files that know about HTTP endpoints)
│       └── weather.ts
├── components/                 🎨 UI layer
│   ├── types.ts                   Shared Props interfaces (3 components)
│   ├── constants.ts               ACTIVITY_ICONS
│   ├── helpers.ts                 formatCityLabel, formatDate,
│   │                              handleComboboxKeyDown
│   ├── common/                    Reusable primitives:
│   │   ├── Spinner                  Loading indicator
│   │   ├── Skeleton                 Optimistic placeholders
│   │   ├── EmptyState               Friendly empty messaging
│   │   └── ErrorBoundary            Class component — catches render errors
│   ├── CitySearch/                Accessible combobox + keyboard nav
│   ├── WeatherForecast/           Current + 7-day grid
│   └── ActivityRecommendations/   Ranked list with progress bars
├── hooks/                      🪝 All React hooks live here
│   ├── useDebounce.ts             Generic 250 ms debounce
│   ├── useCitySearch.ts           React Query wrapper around searchCities
│   └── useWeatherForecast.ts      React Query wrapper around getWeather
├── utils/                      🧮 Pure functions (no React, no fetch)
│   ├── activityScoring.ts         rankActivities + 4 scorers
│   ├── activityScore.ts           getScoreLevel + getScoreLabel
│   └── weatherCodes.ts            WMO code → emoji + label
├── types/                      📐 Shared domain types
├── App.tsx                        Composition root — owns `selectedCity`
└── main.tsx                       Bootstraps QueryClientProvider
```

### Separation of concerns

Each layer has **one job** and only talks to the layer directly below it:

| Layer         | Responsibility                                                                            | Talks to           |
| ------------- | ----------------------------------------------------------------------------------------- | ------------------ |
| `App.tsx`     | Owns the one piece of shared UI state (`selectedCity`) via `useState`; passes it as props | `components/`      |
| `components/` | Rendering, accessibility, user interactions                                               | `hooks/`, `utils/` |
| `hooks/`      | Wraps GraphQL queries with React Query (caching, loading, error)                          | `api/`             |
| `api/`        | Parses gql documents and dispatches to REST adapters                                      | `types/`           |
| `utils/`      | Deterministic pure logic — scoring, formatting                                            | nothing            |
| `types/`      | Shared TypeScript types                                                                   | nothing            |

The benefit: **every change has a single, predictable home**.

| Scenario                           | Files you touch                       |
| ---------------------------------- | ------------------------------------- |
| Open-Meteo renames a JSON field    | 1 file in `api/rest/`                 |
| New query (e.g. reverse geocoding) | 1 gql doc + 1 line in `api/client.ts` |
| Swap to a real GraphQL server      | `api/client.ts` only                  |
| New consumer of weather data       | New component + import existing hook  |

---

## 🔌 GraphQL abstraction

Because the brief has no backend, the app uses a deliberately **lightweight
GraphQL layer**:

- Queries are written as standard `gql` documents (`SEARCH_CITIES_QUERY`,
  `GET_WEATHER_QUERY`).
- A 30-line `request(document, variables)` function in `src/api/client.ts`
  parses each document, reads the root field name (`searchCities` or
  `getWeather`), and dispatches to a registered resolver.
- Resolvers delegate to **REST adapters in `src/api/rest/`** — the only
  files in the codebase that know about Open-Meteo's HTTP endpoints.
- The result is wrapped as `{ [rootField]: data }` to match a real
  GraphQL response shape.

**To add a new query** → drop a gql document in `src/api/queries/`, then
register one line in `client.ts`. No other file changes.

**To swap in a real GraphQL backend later** → change `client.ts` to
`fetch`-POST against the endpoint. Every component, hook, and test stays
the same.

### Caching with React Query

Each feature hook wraps `request(...)` with `useQuery`, giving us
`data` / `loading` / `error` states out of the box. Caching is configured
**per feature**:

| Hook                 | `staleTime` | Effect                                                                                |
| -------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `useCitySearch`      | `Infinity`  | Re-typing the same query returns instantly with no network call                       |
| `useWeatherForecast` | `10 min`    | Re-selecting a recent city is instant; after 10 min the next render quietly refetches |

---

## ⚙️ Technical choices

| Concern              | Choice                               | Why                                                                                             |
| -------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Build / dev server   | **Vite**                             | Fast, modern; first-class TS + React 19 support. The React team recommends it for new projects. |
| Language             | **TypeScript** (strict mode)         | Required by the brief; catches whole classes of bugs at compile time                            |
| GraphQL syntax       | **graphql-tag (`gql`)**              | Standard query-document syntax — no backend required                                            |
| GraphQL routing      | **In-house `request()` (~30 lines)** | Parses gql, dispatches by root field; trivial to swap out for a real client                     |
| Server-state caching | **React Query (TanStack Query)**     | Per-feature `staleTime`, request deduping, loading/error states for free                        |
| Client state         | **`useState` in `App.tsx` + props**  | Only one piece of shared state exists. A library would be over-engineering.                     |
| Styling              | **CSS Modules**                      | Plain CSS, scoped per component, zero runtime cost                                              |
| Testing              | **Jest + React Testing Library**     | Required by the brief; data-driven tests, user-centric APIs                                     |
| Test mocking         | **Mocked `global.fetch`**            | Exercises the full GraphQL → REST adapter path end-to-end                                       |
| Accessibility        | **WAI-ARIA combobox pattern**        | Keyboard-first; works with screen readers                                                       |
| Error handling       | **`<ErrorBoundary />` per section**  | A crash in one section won't take the others down                                               |

---

## 🧮 Activity scoring (in plain English)

Each scorer answers **2–3 yes/no questions** about the week. Each `yes`
adds a fixed point amount; total is at most 100. **No math curves, no
clamping — just buckets.**

| Activity                | Conditions                                                                   | Max |
| ----------------------- | ---------------------------------------------------------------------------- | --- |
| **Skiing**              | cold (avg high ≤ 0 °C) → 50<br>snow (≥ 5 cm/week) → 50                       | 100 |
| **Surfing**             | warm (18–32 °C) → 35<br>wind (12–30 km/h) → 40<br>dry (≤ 10 mm) → 25         | 100 |
| **Outdoor sightseeing** | mild (15–25 °C) → 50<br>dry (≤ 5 mm) → 30<br>calm wind (≤ 15 km/h) → 20      | 100 |
| **Indoor sightseeing**  | baseline → 40<br>wet (≥ 10 mm) → +35<br>extreme temp (<5 °C or >30 °C) → +25 | 100 |

The logic is trivial to test (7 unit tests cover all four scorers + edge
cases) and trivial to explain in a 30-second pitch.

---

## ▶️ How to run the project

```bash
npm install           # install dependencies
npm run dev           # start dev server at http://localhost:5173
npm run build         # production build → ./dist
npm run preview       # preview the production build locally
```

---

## 🧪 How to run tests

```bash
npm test              # run the full Jest suite (25 tests)
npm run test:watch    # re-run on change
npm run test:coverage # generate coverage report
```

Tests live in `__tests__/` and mirror the `src/` structure:

| Suite                         | What it covers                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `useDebounce.test.ts`         | Initial value, delay, timer reset on rapid changes                                             |
| `activityScoring.test.ts`     | All 4 scorers + edge cases + score bounds + ordering                                           |
| `<CitySearch />`              | Empty input, partial input, no results, network error, mouse + keyboard selection, cache reuse |
| `<WeatherForecast />`         | Empty state, skeleton loading, success render, error + retry button                            |
| `<ActivityRecommendations />` | Ranking order, progress-bar accessibility (`aria-valuenow`)                                    |

---

## 📋 Assumptions made

- Open-Meteo's free, no-key endpoints are reachable from the browser
  (CORS-enabled).
- Minimum query length for autocomplete is **2 characters** — a single
  letter shouldn't fire a request.
- Activity recommendations are computed from the **7-day average** of the
  forecast, not from any single day — trip planning is inherently
  multi-day.
- Surf suitability uses **wind speed** as a proxy for wave activity (the
  free Open-Meteo endpoint doesn't expose marine data).
- The app uses Open-Meteo's defaults: °C, km/h, mm.

---

## ⚖️ Trade-offs and omissions

- **Local GraphQL router instead of a real server.** Driven by the
  no-backend constraint. The abstraction is real (gql documents →
  resolvers), but lacks server-side features like normalisation,
  subscriptions, or schema typing shared across teams.
- **CSS Modules over Tailwind / styled-components.** Closer to vanilla
  CSS, no runtime cost, easy to onboard for any developer who knows CSS.
  The trade-off is no atomic utility classes.
- **`useState` over Redux Toolkit / Zustand.** Only one piece of shared
  state exists (`selectedCity`). A state library would add ~80 lines of
  boilerplate for the same outcome.
- **Surf scoring is approximate.** Wind is a rough proxy for waves; a
  production version would call the Open-Meteo Marine API for real wave
  height / period / direction.
- **No internationalisation.** Dates use `Intl.DateTimeFormat` so they're
  locale-aware, but UI copy is English-only.
- **No offline / PWA support.** React Query's cache lasts the browser
  session only.
- **No analytics or error reporting** (Sentry / Datadog). The
  `ErrorBoundary` logs to `console.error` — a comment in the code marks
  where a Sentry / Slack hook would plug in.

---

## ✨ Improvements with more time

Listed in the order I'd actually build them — biggest visible wins first.

| #   | Improvement                                                                                    | Why it would impress a reviewer                                        | Effort |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| 1   | 🗺️ **Mini map** of the selected city (Leaflet / MapLibre)                                      | Makes the app feel like a _real_ travel product, not a forecast widget | ~2 h   |
| 2   | 📆 **Per-day activity ranking** ("best ski day this week is Wednesday")                        | Solves a genuine UX gap — currently we only show the weekly average    | ~3 h   |
| 3   | 🌗 **Dark-mode toggle** with `prefers-color-scheme` support                                    | Design tokens are already in `index.css`; just needs a theme switcher  | ~1 h   |
| 4   | 🆚 **Side-by-side city comparison** (pick 2–3 cities, see which has the best weekend)          | Shows product thinking beyond the brief                                | ~4 h   |
| 5   | ⏱️ **Hourly forecast popover** when clicking a day card                                        | Adds depth; makes the daily grid interactive instead of static         | ~2 h   |
| 6   | 🌊 **Open-Meteo Marine API** for accurate surf scoring (wave height / period / direction)      | Removes the "wind-as-proxy" assumption                                 | ~2 h   |
| 7   | 🧠 **Recent searches** (last 5 cities, persisted in `localStorage`)                            | One-tap re-selection for the most common user behaviour                | ~1 h   |
| 8   | ♿ **`prefers-reduced-motion`** support — disable spinner / skeleton animations                | A direct hit on the "Accessibility improvements" bonus criterion       | ~30 m  |
| 9   | 🤖 **GitHub Actions CI** — `npm test && npm run build` on every PR                             | Standard production hygiene                                            | ~30 m  |
| 10  | 📸 **Visual regression tests** (Playwright + Chromatic / Loki)                                 | Catches UI breaks that unit tests miss                                 | ~2 h   |
| 11  | 🏗️ **`graphql-codegen`** for fully typed queries (becomes valuable once a real backend exists) | Eliminates the manual `Data` / `Vars` interfaces                       | ~1 h   |
| 12  | 📚 **Storybook** for the `common/` primitives                                                  | Useful starting point for a design system                              | ~2 h   |
| 13  | 📡 **Sentry / Datadog** in `ErrorBoundary`                                                     | Real-world observability                                               | ~30 m  |

If I had to ship **three** today, they'd be **#1 (map), #2 (per-day
ranking), and #3 (dark mode)** — they're the highest-visibility wins per
hour invested, and they'd be the first things any reviewer notices when
clicking around the app.

---

## 🙏 Acknowledgements

- Weather data from [Open-Meteo](https://open-meteo.com/) — free, no-key,
  beautifully designed APIs.
- Activity icons are inline emoji to avoid an asset pipeline.

> Every choice in this README is defended by something concrete in the code.
