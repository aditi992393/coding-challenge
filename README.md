# 🌍 Travel Planner

A scalable, accessible frontend travel-planning application that consumes
weather and geolocation data from the [Open-Meteo](https://open-meteo.com/)
APIs. Users can search any city, view a 7-day forecast, and see four
activities (skiing, surfing, indoor sightseeing, outdoor sightseeing)
ranked by suitability against that forecast.

> Submission for the **Senior Web Engineer Test**.

---

## 📌 Project overview

**Travel Planner** is a single-page React 19 + TypeScript web application
that helps users pick the right outdoor activity for a destination based
on its upcoming weather. It's built as a focused demonstration of
production-grade frontend patterns: clean architecture, accessibility,
caching, testing, and intentional separation of concerns.

### What users can do

- **Search any city in the world** with autocomplete that fires only after
  the user pauses typing (debounced 250 ms) and returns suggestions through
  an accessible combobox.
- **Select a city** with mouse or full keyboard navigation (Arrow keys,
  Enter, Escape) — matching the WAI-ARIA combobox specification.
- **See a 7-day forecast** for the selected city with current conditions
  (temperature, wind, weather code) and a per-day grid of highs, lows, and
  precipitation.
- **Get ranked activity recommendations** for four activities — skiing,
  surfing, indoor sightseeing, outdoor sightseeing — each with a numeric
  score (0–100), a progress bar, and a one-line reason.

### How it's built

- **React 19 + TypeScript (strict)** — functional components and hooks only.
- **GraphQL abstraction** — queries are written as standard `gql` documents
  resolved by a 30-line in-browser router that dispatches to REST adapters
  for the Open-Meteo APIs. Swapping in a real GraphQL backend later
  requires changing a single file.
- **React Query** owns server-state caching: re-searching the same city is
  instant, and weather forecasts stay fresh for 10 minutes.
- **CSS Modules** for scoped, runtime-free styling.
- **Pure scoring logic** — `rankActivities()` is a deterministic function
  with no React or fetch dependency, fully unit-tested.
- **Resilient UI** — skeleton loaders, empty states, retry-on-error,
  and `<ErrorBoundary />` around each section so one failure can't take
  down the others.

### Example user flow (from the brief)

1. User types `Lon` into the search box.
2. Suggestions (`London`, `Londonderry`, …) appear in an accessible combobox.
3. User selects a city — by mouse or by keyboard.
4. A 7-day forecast is rendered.
5. Four activities are ranked by suitability, each with a numeric score
   (0–100), a progress bar, and a one-line reason.

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
│   ├── scoreDisplay.ts            getScoreLevel + getScoreLabel (UI helpers)
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
npm test              # run the full Jest suite (31 tests across 7 suites)
npm run test:watch    # re-run on change
npm run test:coverage # generate coverage report
```

Tests live in `__tests__/` and mirror the `src/` structure. Coverage spans
**three levels** — pure logic, individual hooks, and component behaviour:

| Suite                         | Level     | What it covers                                                                                 |
| ----------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `useDebounce.test.ts`         | Hook      | Initial value, delay, timer reset on rapid changes                                             |
| `useCitySearch.test.tsx`      | Hook      | Skipped fetch for short input, mapped city results, error propagation                          |
| `useWeatherForecast.test.tsx` | Hook      | Skipped fetch when no city, mapped forecast shape, error propagation                           |
| `activityScoring.test.ts`     | Logic     | All 4 scorers + edge cases + score bounds + descending order                                   |
| `<CitySearch />`              | Component | Empty input, partial input, no results, network error, mouse + keyboard selection, cache reuse |
| `<WeatherForecast />`         | Component | Empty state, skeleton loading, success render, error + retry button                            |
| `<ActivityRecommendations />` | Component | Ranking order, progress-bar accessibility (`aria-valuenow`)                                    |

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

These are **engineering and tooling** improvements that would strengthen
the existing codebase — production-readiness rather than new features.
Listed in roughly the order I'd add them, with the biggest reliability
wins first.

| #   | Improvement                                                                                                                                    | Why it matters for this codebase                                                                                                                                                            | Effort |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | 🎭 **End-to-end tests with Playwright** — cover the full user journey: type `Lon` → select London → see forecast → see ranked activities       | Unit + component tests already catch most bugs, but only an E2E test verifies the whole chain (combobox → React Query → REST adapter → UI) works in a real browser                          | ~3 h   |
| 2   | 🐛 **Sentry / Datadog in `<ErrorBoundary />`** — wire the existing `componentDidCatch` hook into a real error-tracking service                 | The boundary currently logs to `console.error` (a comment in the code already marks the integration point). In production we'd capture every uncaught render error with stack + breadcrumbs | ~30 m  |
| 3   | 💬 **Slack alerts** for fatal errors — `#frontend-alerts` ping via a Sentry webhook (or a direct fetch from `ErrorBoundary.componentDidCatch`) | On-call gets notified the moment any user hits an unhandled error or the Open-Meteo APIs return 5xx                                                                                         | ~30 m  |
| 4   | 🤖 **GitHub Actions CI** — `npm test && npm run lint && npm run build` on every PR                                                             | Currently Husky enforces this locally on pre-commit, but a CI gate prevents broken code from merging even if hooks are bypassed                                                             | ~30 m  |
| 5   | 📚 **Storybook** for the `common/` primitives — `<Spinner />`, `<Skeleton />`, `<EmptyState />`, `<ErrorBoundary />`                           | Living documentation; useful as the foundation of a design system if the app grows                                                                                                          | ~2 h   |
| 6   | 🪝 **Husky pre-push hook** — run the test suite before `git push` (currently only pre-commit lint + format)                                    | Catches test failures before they reach the remote                                                                                                                                          | ~15 m  |
| 7   | 🧱 **Strict CSP headers** (`Content-Security-Policy`, `X-Frame-Options`) wired in via deployment config                                        | Hardens the app against XSS once it's hosted somewhere real                                                                                                                                 | ~30 m  |

If I had to ship **three** today, they'd be **#4 (GitHub Actions CI)**,
**#1 (Playwright E2E)**, and **#2 (Sentry)** — they give the highest
reliability return per hour invested and would make the project genuinely
production-ready.

---
