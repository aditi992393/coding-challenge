# Travel Planner

A scalable, accessible frontend travel-planning application that consumes weather
and geolocation data from the [Open-Meteo](https://open-meteo.com/) APIs. Users
can search for any city, view a 7-day forecast, and see ranked recommendations
for four activities (skiing, surfing, indoor sightseeing, outdoor sightseeing)
based on the forecast.

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
├── api/                       # 🌐 API layer — GraphQL on top of Open-Meteo REST
│   ├── schema.ts              #     GraphQL typeDefs (City, WeatherForecast, Query)
│   ├── resolvers.ts           #     GraphQL resolver map (calls REST adapters)
│   ├── client.ts              #     Apollo Client w/ SchemaLink (in-browser server)
│   ├── queries/               #     gql query documents + typed variables
│   └── rest/                  #     REST adapters for the two Open-Meteo endpoints
├── features/                  # 🧠 Feature modules — one Apollo useQuery hook each
│   ├── city-search/           #     useCitySearch
│   ├── weather/               #     useWeatherForecast
│   └── activities/            #     useActivityRanking (pure-logic adapter)
├── components/                # 🎨 UI layer (functional components + hooks)
│   ├── common/                #     Spinner, ErrorBoundary, EmptyState, Skeleton
│   ├── CitySearch/            #     ARIA combobox with keyboard navigation
│   ├── WeatherForecast/       #     Current + 7-day grid
│   └── ActivityRecommendations/   # Ranked list with progress bars
├── hooks/                     # ♻️ Generic, app-agnostic hooks (useDebounce)
├── store/                     # 📦 Zustand store (selected city only)
├── utils/                     # 🧮 Pure business logic (activity scoring, WMO labels)
├── types/                     # 📐 Domain types shared across layers
├── App.tsx                    # Composition root
└── main.tsx                   # Bootstraps ApolloProvider + StrictMode
```

**Separation of concerns** is enforced through the directory layout:

| Layer            | Responsibility                                              | Talks to                       |
| ---------------- | ----------------------------------------------------------- | ------------------------------ |
| `components/`    | Rendering, accessibility, interactions                      | `features/`, `store/`          |
| `features/`      | Wraps GraphQL queries with Apollo's `useQuery`              | `api/`, `utils/`               |
| `api/`           | GraphQL schema + resolvers; REST adapters call Open-Meteo   | `types/`                       |
| `utils/`         | Pure, deterministic business logic (activity scoring)       | nothing                        |
| `store/`         | Client UI state (the selected city)                         | nothing                        |
| `types/`         | Domain models shared by all of the above                    | nothing                        |

Each layer can be tested or replaced independently — for example, the activity
ranking is a pure function with no React, no fetch, and no store dependency.

### GraphQL abstraction

Because the challenge ships **no backend**, the app builds an executable GraphQL
schema in the browser using `@graphql-tools/schema` and wires it to Apollo Client
via `SchemaLink`. From the rest of the application's point of view this looks
identical to a real Apollo Client connected to a remote GraphQL server:

- Queries are written as standard `gql` documents (`SEARCH_CITIES_QUERY`,
  `GET_WEATHER_QUERY`).
- Components use Apollo's `useQuery` hook with proper `loading` / `error` / `data`
  states.
- Apollo's `InMemoryCache` automatically dedupes queries and caches results.
- Swapping to a real remote GraphQL server later would mean replacing `SchemaLink`
  with `HttpLink` — nothing else changes.

The REST adapters in `src/api/rest/` are the only files that know about
Open-Meteo's HTTP endpoints. The resolver map in `src/api/resolvers.ts` is the
seam between "GraphQL" and "REST".

## Technical choices

| Concern              | Choice                                | Why                                                              |
| -------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| Build/dev server     | **Vite**                              | Fast, modern; first-class TS + React support                     |
| Language             | **TypeScript** (strict mode)          | Required by the brief; catches whole classes of bugs             |
| GraphQL client       | **Apollo Client v4 + SchemaLink**     | The most familiar React + GraphQL stack; built-in caching        |
| Schema tooling       | **@graphql-tools/schema**             | Builds an executable schema in the browser                       |
| Client state         | **Zustand**                           | Minimal API; co-locates state with hooks; tree-shakeable         |
| Styling              | **CSS Modules** (no Tailwind / SCSS)  | Plain CSS, scoped per component, zero runtime overhead           |
| Testing              | **Jest + React Testing Library**      | Required by the brief; data-driven tests, user-centric APIs      |
| Mocking GraphQL      | **Apollo's `MockedProvider`**         | Standard Apollo testing pattern, no fetch mocking needed         |
| Accessibility        | **WAI-ARIA combobox pattern**         | Keyboard-first; works with screen readers                        |

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
- `<CitySearch />` — empty input, partial input, no results, GraphQL error, mouse + keyboard selection
- `<WeatherForecast />` — empty state, skeleton loading, success, error + retry button
- `<ActivityRecommendations />` — ranking order, progress-bar accessibility

## Assumptions made

- Open-Meteo's free, no-key endpoints are reachable from the browser (CORS-enabled).
- Minimum query length for autocomplete is 2 characters — typing a single letter
  shouldn't fire a request.
- Activity recommendations are computed from the **7-day average** of the forecast,
  not from any single day. Trip planning is inherently multi-day.
- Surf suitability uses **wind speed** as a proxy for wave activity (Open-Meteo's
  free weather endpoint doesn't expose marine data).
- The app uses Open-Meteo's defaults (°C, km/h, mm).

## Trade-offs and omissions

- **Local GraphQL executor instead of a real server.** This was driven by the
  no-backend constraint; the abstraction stays clean (a real Apollo Client with a
  real executable schema) but lacks features like server-side normalisation or
  subscriptions.
- **CSS Modules over a CSS-in-JS library.** Closer to vanilla CSS, no runtime
  cost, easy to read.
- **Zustand over Redux Toolkit.** The app has very little client state — a full
  Flux setup would be overkill.
- **Surfing heuristic is approximate.** A production version would integrate the
  Open-Meteo Marine API (wave height, period, direction).
- **No internationalisation.** Dates are formatted with the user's locale via
  `Intl.DateTimeFormat`, but copy is English-only.
- **No offline / PWA support.** Apollo's cache lasts the browser session.

## Improvements with more time

- Wire up the **Open-Meteo Marine API** for accurate surf recommendations.
- Add **per-day** activity scoring so users can see "best ski day this week".
- **Map view** (Leaflet / MapLibre) so the selected city is contextualised.
- Add a **dark mode** toggle (design tokens are already in `index.css`).
- **Code-split** Apollo Client to shrink the initial bundle.
- **Visual regression tests** via Playwright + Chromatic / Loki.
- **GitHub Actions** running `npm test && npm run build` on every PR.
- Generate a **typed GraphQL client** with `graphql-codegen` once a real endpoint
  exists.
