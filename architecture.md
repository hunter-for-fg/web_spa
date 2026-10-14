# Architecture of the Hunter Web UI (web_spa)

This document describes how the Hunter web frontend is built, deployed and organised. It is meant
to guide both humans and coding agents when making changes or additions. Keep it up to date when
the structure, conventions or deployment change.

## Purpose and context

[Hunter](https://hunter-for-fg.github.io/manual/) is a set of services for the FlightGear flight
simulator that places targets into MultiPlayer mode, such that military combat scenarios can be
flown. This repository contains only the **read-only web frontend**: a single-page application (SPA)
that shows Hunter sessions, damage results, attacker/missile events, positions (list and map) and
offers weather tools (METAR/QNH lookup, QFE calculation).

The frontend has no backend of its own. All data comes from the separate **Hunter REST API**, an
Azure Function App (`function_app.py`, not part of this repository), deployed at
`https://hunter-rest-api.azurewebsites.net`. The SPA currently only uses its anonymous `GET` endpoints,
so it needs no secrets.

```
Browser ──► Azure Static Web App (static files from dist/)
   │
   └──fetch──► Hunter REST API (Azure Function App, /api/...) ──► Hunter data
   └──tiles──► OpenTopoMap tile servers (maps)
```

## Technology stack

| Concern            | Choice                                                         |
|--------------------|----------------------------------------------------------------|
| Framework          | Vue 3 (Composition API, `<script setup lang="ts">`)            |
| Routing            | vue-router (HTML5 history mode)                                |
| Language           | TypeScript (strict, via `@vue/tsconfig`), type-checked by `vue-tsc` |
| Build / dev server | Vite (`@vitejs/plugin-vue`, optional `@vitejs/plugin-basic-ssl`) |
| Maps               | Leaflet with OpenTopoMap tiles                                  |
| Tests              | Vitest with jsdom                                               |
| Linting            | ESLint flat config (`eslint-plugin-vue` essential + `@vue/eslint-config-typescript` recommended) |
| Hosting            | Azure Static Web Apps (deployed with `@azure/static-web-apps-cli`) |
| Runtime (tooling)  | Node.js 24+                                                     |
| Licence            | GPL-2.0-or-later                                                |

There is deliberately no state management library (no Pinia/Vuex), no UI component library and no
CSS framework. Keep it that way unless there is a strong reason — the app is small.

## Repository layout

```
.
├── index.html                  Vite entry HTML (mounts #app, loads src/main.ts)
├── public/                     Copied verbatim into dist/
│   ├── staticwebapp.config.json  Azure SWA config: SPA navigation fallback to index.html
│   ├── robots.txt               Only the landing page may be indexed
│   └── favicon.svg
├── src/
│   ├── main.ts                 Creates the Vue app, installs the router, imports global CSS
│   ├── App.vue                 Page shell: header (NavBar), <RouterView>, footer
│   ├── router.ts               All routes and their meta (title, sessionPage)
│   ├── api/
│   │   ├── client.ts           The only place that talks to the REST API (fetch wrappers, ApiError)
│   │   └── types.ts            TypeScript shapes of the REST API's JSON responses
│   ├── composables/
│   │   ├── useApiData.ts       Generic load/loading/error/lastFetched state for a fetch
│   │   ├── useSessionPage.ts   Same, for pages bound to a session via ?session_id=...
│   │   └── usePersistentState.ts  Reactive state persisted in localStorage (prefix "hunter.")
│   ├── components/             Reusable UI building blocks
│   │   ├── DataTable.vue       Generic sortable/filterable table (columns + cell slots)
│   │   ├── LeafletMap.vue      Leaflet map with markers, fitted to scenario bounds
│   │   ├── SessionPageStatus.vue  Invalid-session/error/refresh handling for session pages
│   │   ├── RefreshBar.vue      Refresh button + "last fetched" status
│   │   ├── NavBar.vue          Main navigation (session dropdown only on valid session pages)
│   │   ├── NavDropdown.vue     Accessible dropdown of internal/external links (Session pages, Help)
│   │   └── CheckMark.vue       Accessible yes/no indicator
│   ├── views/                  One component per route (lazy-loaded, except HomeView)
│   ├── leaflet/                Leaflet helpers not tied to Vue (markers, coordinates control)
│   ├── utils/                  Pure functions (formatting, table sort/filter, manual URLs)
│   ├── assets/                 Global CSS (design tokens, base styles, Leaflet control CSS)
│   └── __tests__/              Vitest unit tests (*.spec.ts)
├── vite.config.ts              Vite + Vitest config, dev proxy for /api, "@" alias
├── eslint.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json   Project references (app vs. tooling/tests)
├── env.d.ts                    Typing of import.meta.env (VITE_API_BASE_URL)
├── .env.example / .env.production   Environment variables (see "Configuration and environments")
└── swa-cli.config.json         Azure Static Web Apps CLI configuration
```

The `@` import alias resolves to `src/` (configured in both `vite.config.ts` and the tsconfigs).
Always import across folders with `@/...`; relative imports are only used within the same folder.

## Runtime architecture

### Application shell and routing

- `main.ts` creates the app, installs the router and imports the global CSS.
- `App.vue` renders `NavBar`, then the current view, then the footer. Every view is rendered with
  `:key="route.path"` and receives the route's `meta.title` as a `title` prop, which it shows as
  its `<h1>`. The router's `afterEach` hook sets `document.title` from the same `meta.title`.
- Routes are defined in `src/router.ts`. Unknown paths redirect to `/`. Backwards compatibility
  of paths is not maintained: when a path changes, the old one is removed (no redirects).
- `RouteMeta` is augmented with `title: string` (required) and `sessionPage?: boolean`.

| Path                               | View                    | Session page |
|------------------------------------|-------------------------|:------------:|
| `/`                                | `HomeView`              |              |
| `/tools/weather`                   | `WeatherView`           |              |
| `/ongoing_session/sessions_list`   | `SessionsListView`      |              |
| `/ongoing_session/current_session` | `SessionDetailsView`    | ✓ |
| `/ongoing_session/damages`         | `DamagesView`           | ✓ |
| `/ongoing_session/attacker_events` | `AttackerEventsView`    | ✓ |
| `/ongoing_session/missile_events`  | `MissileEventsView`     | ✓ |
| `/ongoing_session/positions_list`  | `PositionsListView`     | ✓ |
| `/ongoing_session/positions_map`   | `PositionsMapView`      | ✓ |

### Session pages

A "session page" shows data for one Hunter session, selected by the `session_id` **query
parameter** (constant `SESSION_ID_PARAM`). The pattern is:

1. The route has `meta.sessionPage: true`.
2. The view calls `useSessionPage(fetchX)` with a page-specific fetch function from `api/client.ts`
   (pass `loadAirports = true` if the session's airports are needed).
3. `useSessionPage` fetches the session and the page data in parallel whenever the `session_id`
   changes and when `refresh()` is called. A 404 from the API (or a missing `session_id`) sets
   `invalidSession`. Stale responses are discarded via a request counter.
4. On success it also sets the module-level `currentSession` ref, which `NavBar` uses to show the
   "Session pages" dropdown only when the route is a session page and the ids match.
5. The view wraps its content in `<SessionPageStatus>`, which handles the invalid-session message,
   the refresh bar and errors, and only renders the slot once the session is loaded.

Data is fetched on page open and on explicit "Refresh" — there is **no automatic polling**.

### Data access

- `src/api/client.ts` is the single gateway to the REST API. Every endpoint has a typed
  `fetchX()` function; views never call `fetch` directly.
- The base URL is `import.meta.env.VITE_API_BASE_URL` (default `/api`). Query parameters with
  `undefined` or empty values are omitted by `buildUrl`. Path segments such as session ids are
  URL-encoded.
- Non-2xx responses throw `ApiError(status, message)`. If the body is JSON with an `error` string,
  that becomes the message. `errorMessage()` in `useApiData.ts` shows the API's message only for
  HTTP 400 (user-facing validation errors); all other errors are logged to the console and replaced
  by a generic text.
- `src/api/types.ts` mirrors the JSON returned by `function_app.py`. Field names are kept in the
  API's `snake_case`. When the REST API changes, update these types first and let `vue-tsc` find
  the affected code.

Current endpoints used:

| Function             | Endpoint                                |
|----------------------|-----------------------------------------|
| `fetchSessions`      | `GET sessions`                          |
| `fetchSession`       | `GET sessions/{id}?load_airports=…`     |
| `fetchDamages`       | `GET sessions/{id}/damages`             |
| `fetchAttackerEvents`| `GET sessions/{id}/attacker-events`     |
| `fetchMissileEvents` | `GET sessions/{id}/missile-events`      |
| `fetchPositions`     | `GET sessions/{id}/positions`           |
| `fetchMetars`        | `GET weather/metars?icaos=&lon=&lat=`   |
| `fetchQfe`           | `GET weather/qfe?qnh=&p_unit=&elevation=&a_unit=` |

### Display logic

Display logic that depends on Hunter's domain knowledge is computed in the REST API
(`function_app.py`), not in the SPA — e.g. the marker category of a position
(`mp_targets.map_marker_category`, delivered as `marker_category`) and the display texts of enums
(fields ending in `_name` or `_display`, such as `health_name` or `sam_shoot_display`). The SPA only
maps them to colours, icons etc. When a new feature needs such logic, add it to the REST API and
extend `src/api/types.ts`, instead of re-implementing Hunter rules in TypeScript.

### State

- Page data lives in the composables' refs (`shallowRef` for API data, since it is replaced as a
  whole and never mutated).
- The only global state is `currentSession` in `useSessionPage.ts`.
- `usePersistentState(key, defaults)` stores user inputs and results in `localStorage` under
  `hunter.<key>` (used by the weather tools). All storage access is wrapped in try/catch, so the app
  works without storage.

### Navigation and dropdowns

`NavBar.vue` shows the global links (Home, Weather, list of sessions) and two dropdowns built with
`NavDropdown.vue`:

- **Session pages** — only on pages of a valid session. The pages are listed in the
  `SESSION_PAGES` constant in `NavBar.vue`; each link gets the current `session_id` query.
- **Help** — links into the Hunter manual, listed in `HELP_ITEMS` in `NavBar.vue`. The manual's base
  URL is defined once as `MANUAL_BASE_URL` in `src/utils/manual.ts`; links are built with
  `manualUrl('<page>.html')`, so only the page path after `.../manual/` is hardcoded.

`NavDropdown` takes a `label` and a list of `NavDropdownItem`s: `{ label, to }` renders a
`RouterLink`, `{ label, href }` renders an external link that opens in a new tab (with
`rel="external noopener"`, a ⧉ icon and a visually hidden "(opens in a new tab)" hint). The toggle
colour can be set with the CSS variable `--nav-dropdown-color` on a parent element.

The dropdown follows the WAI-ARIA **disclosure navigation** pattern on purpose — a `<button>` with
`aria-expanded`/`aria-controls` and a plain list of links — and **not** `role="menu"`, which is
meant for application menus and switches screen readers into a different mode. Keep these
properties when changing it:

- Enter/Space toggle; ArrowDown/ArrowUp on the button open the list and focus the first/last link;
  in the list ArrowDown/ArrowUp move (wrapping), Home/End jump to the first/last link.
- Escape closes and returns focus to the button. Focus leaving the dropdown (Tab), a click outside
  and a route change close it. Activating a link closes it and returns focus to the button, so
  focus is never lost on a hidden element.
- The current page is marked with `aria-current="page"` (set by `RouterLink`) and visually not only
  by colour (bold plus a marker).
- The list has a z-index above Leaflet's controls (1000), so it opens over maps, and is shifted to
  the left when it would stick out of the window on the right.

### Tables

`DataTable.vue` is a generic component (`generic="T"`) driven by `Column<T>` definitions from
`src/utils/table.ts`:

- `value(row)` gives the raw value for sorting (and display/filtering if there is no `format`).
- `format(value, row)` gives the displayed and filtered text (e.g. `formatUtc` for timestamps).
- `align: 'right'`, `sortable: false`, `filterable: false` are optional.
- Boolean columns automatically get a yes/no `<select>` filter.
- Cells can be customised with slots named `cell-<column key>` (e.g. `CheckMark`, `RouterLink`).
- Sorting cycles none → ascending → descending, is stable and always puts empty values last.

The sorting/filtering logic lives in pure functions in `utils/table.ts` so it can be unit-tested.

### Maps

- Maps use [Leaflet](https://leafletjs.com/) 1.9.4 from the npm package `leaflet` (with
  `@types/leaflet`); there is no CDN script and no leaflet-providers plugin — the OpenTopoMap tile
  layer is configured directly in `LeafletMap.vue`.
- `LeafletMap.vue` wraps Leaflet. It takes `bounds` as `[west_lon, south_lat, east_lon, north_lat]`
  (the scenario bounding box), a list of `MapMarker`s and an optional `showCoordinates` flag.
- Markers are either circle markers in a given `colour` or pin markers (optionally recoloured via
  `pinVariant`, implemented as a CSS `hue-rotate` filter on Leaflet's blue icon).
- On marker updates only the marker layer is replaced, so the user's zoom/pan survives a refresh.
  To reset the map when the session changes, views give `LeafletMap` a `:key` of the session id.
- Leaflet default icon images are imported as bundled assets (Leaflet's CSS-based path detection
  does not work with Vite).
- Marker colours by `marker_category` are defined in `src/leaflet/markers.ts`
  (`MARKER_COLOURS`); the explanation on the positions map page must match them.
- **Popups are built from DOM text nodes (`buildPopupContent`), never from HTML strings**, because
  values such as callsigns come from MultiPlayer and are untrusted.
- Coordinates are presented as lon, lat (in that order) throughout Hunter.
- `src/leaflet/coordinatesControl.ts` (shown with `showCoordinates`) is a TypeScript port of
  [Leaflet-Coordinates-Control](https://github.com/zimmicz/Leaflet-Coordinates-Control) version
  `0d21a1c` ([MIT licence](https://github.com/zimmicz/Leaflet-Coordinates-Control/blob/master/LICENSE.md)).
  The only functional change from the original is that lon and lat are switched around. Its CSS is
  in `src/assets/coordinates-control.css`.

### Styling

- `src/assets/style.css` only holds the design tokens (CSS custom properties `--color-*`, `--space`,
  `--font-family` on `:root`), base element styles and a few shared classes (`.button`, `.muted`,
  `.error`, `.visually_hidden`, `.key_value_table`, `.data_table`, …). Everything else is in
  `<style scoped>` blocks of the components/views. Unscoped styles are only used where Leaflet
  creates elements outside Vue's rendering.
- The UI is **dark only** (`color-scheme: dark`). Use the CSS variables instead of literal colours.
- Text colours must have a contrast ratio of at least 4.5:1 against their background (WCAG AA).
  The tokens do; check any new colour (also on `--color-surface` / `--color-surface-raised`).
- The layout is optimised for desktops and tablets (from ca. 768px width); phones work, but with
  compromises. Avoid fixed pixel widths — e.g. the maps take the full width and a share of the
  window height (`height: max(25rem, 80vh)`).
- CSS class names use `snake_case`.
- Header and main are 90% wide so users can scroll the page next to maps/tables without zooming the
  map.

### Accessibility

Existing code pays attention to accessibility; keep it that way: semantic elements (`<header>`,
`<nav>`, `<main>`, `<footer>`, `<th scope=…>`, `<output>` for calculated results, `<details>` for
expandable content), `aria-sort` on sortable headers, `aria-label`s on filter inputs, `role="status"` /
`role="alert"` for live messages, `.visually_hidden` text for symbols, decorative characters with
`aria-hidden="true"` or CSS `content: "…" / ""`, and visible `:focus-visible` outlines.

## Configuration and environments

| Variable                | Used at   | Purpose |
|-------------------------|-----------|---------|
| `VITE_API_BASE_URL`     | build     | Base URL of the REST API incl. `/api`. Default `/api`. Must be set at build time if the SPA is not served from the same origin as the REST API — which is the case on Azure Static Web Apps, so `.env.production` sets it to `https://hunter-rest-api.azurewebsites.net/api`. Leave it unset for development. |
| `VITE_API_PROXY_TARGET` | dev only  | Where the Vite dev server proxies `/api` to. Default `http://localhost:7071` (local Function App started with `func start` in the REST API's repository). Set it to `https://hunter-rest-api.azurewebsites.net` to develop against the deployed REST API. |

Env files (Vite loads them by mode; only variables prefixed `VITE_` reach the SPA and
`vite.config.ts`):

| File              | Committed | Content |
|-------------------|:---------:|---------|
| `.env.production` | yes | `VITE_API_BASE_URL` for `npm run build`. Only public URLs — never secrets. |
| `.env.example`    | yes | Documents the variables. Copy it to `.env.local` for local settings. |
| `.env.local`      | no  | Personal development settings, typically `VITE_API_PROXY_TARGET`. Loaded in every mode, so it works for both `npm run dev` and `npm run dev:https` (mode `https`). |
| `.env`            | no  | Not used by the SPA: `swa login` stores `AZURE_SUBSCRIPTION_ID` and `AZURE_TENANT_ID` there for the SWA CLI. |

There is no `.env.development`: `.env.local` covers local development and, unlike
`.env.development`, also applies to `npm run dev:https`. `swa-cli.config.json` is not an
alternative for these variables — it only configures the SWA CLI (see "Build and deployment").

### CORS

In development the Vite proxy makes the REST API same-origin, so no CORS is involved. In
production the SPA (on its Static Web Apps domain) calls the Function App on another domain:

- The REST API must be callable from anywhere, so `function_app.py` adds
  `Access-Control-Allow-Origin: *` to every JSON response. The SPA only makes simple `GET`
  requests (only an `Accept` header), so browsers send no CORS preflight requests. Keep it that way —
  custom request headers or other methods would trigger preflights.
- This only works as long as the **platform CORS of the Function App is not used**: in the Azure
  Portal under Function App `hunter-rest-api` → API → CORS, "Allowed Origins" must be empty and
  "Enable Access-Control-Allow-Credentials" unchecked. With any entry, the App Service platform
  handles CORS itself and the header from the code has no effect. Function Apps created in the
  portal often have `https://portal.azure.com` pre-filled there — remove it (the portal's
  "Test/Run" still works thanks to `*`).
- Check from the command line:
  `az functionapp cors show --name hunter-rest-api --resource-group <resource group>` must list no
  allowed origins.

## Development workflow

Requires Node.js 24+.

```bash
npm install          # once, and after dependency changes
npm run dev          # dev server with hot reload on http://localhost:8080, /api proxied
npm run dev:https    # same on https://localhost:8080 with a self-signed certificate
                     # (the browser warns once - accept it); the proxy is unaffected
npm run type-check   # vue-tsc --build
npm run lint         # eslint .
npm test             # vitest run
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/ locally
```

By default the proxy target is the local Function App. To develop against the deployed REST API
instead, copy `.env.example` to `.env.local` and set `VITE_API_PROXY_TARGET`.

Before considering a change done, run `npm run type-check`, `npm run lint`, `npm test` (the REST API must be running) and
`npm run build`.

## Build and deployment

- The web UI is served by **[Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)**.
  For prerequisites see
  [Deploy your web app to Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/deploy-web-framework?tabs=bash&pivots=vue).
- `npm run build` produces static files in `dist/` (contents of `public/` are copied as-is), with
  `VITE_API_BASE_URL` from `.env.production`.
- `public/staticwebapp.config.json` rewrites all navigation requests (except `/assets/*`) to
  `/index.html`, which is required for history-mode routing (deep links and reloads).
- `swa-cli.config.json` defines the configuration `web-spa` for the Azure Static Web Apps CLI
  (app name `hunter-spa-web-ui`, resource group `hunter`, output `dist`, dev server
  `http://localhost:8080`). There is no CI/CD workflow in this repository; deployment is done
  manually with the SWA CLI:
  ```bash
  npm run build                     # swa deploy does NOT build - it uploads dist/ as it is
  npx swa deploy --env production   # without --env the CLI deploys to the "preview" environment
  ```
  `swa login` stores the Azure subscription/tenant in `.env` (git-ignored). Preview environments
  stay online until deleted (Azure Portal → Static Web App → Environments). `.swa/` is the CLI's
  local working folder and is git-ignored.
- `public/robots.txt` only allows indexing of the landing page (plus assets needed for rendering).

## Testing

- Unit tests live in `src/__tests__/*.spec.ts` and run with Vitest in a jsdom environment.
- Tests focus on pure logic: `api/client.ts` (with `fetch` stubbed via `vi.stubGlobal`),
  `utils/format.ts`, `utils/table.ts` and `leaflet/markers.ts`.
- Interactive behaviour that matters for accessibility is tested by mounting the component with
  `createApp` and a memory-history router (no extra test library), see `navDropdown.spec.ts`.
- Put new non-trivial logic into pure functions in `utils/`, `leaflet/` or `api/` so it can be
  tested without mounting components, and add tests for it.
- Tests are type-checked by `tsconfig.node.json` (they are excluded from `tsconfig.app.json`).
- Vitest also loads `.env.local`, so `vite.config.ts` pins `VITE_API_BASE_URL` to `/api` under
  `test.env`. This keeps tests independent of personal settings.

## Conventions

- Every source file starts with the SPDX header:
  ```ts
  // SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
  // SPDX-License-Identifier: GPL-2.0-or-later
  ```
  (as HTML comments in `.vue` files).
- Vue SFCs use `<script setup lang="ts">`, typed `defineProps<…>()` / `defineEmits<…>()`, and the
  block order script → template → style.
- Imports: external packages first, then a blank line, then `@/…` imports, then relative ones.
- Formatting: 2-space indentation, no semicolons, single quotes, LF line endings, final newline
  (see `.editorconfig`). Lines up to ~120 characters.
- Naming: camelCase for TS identifiers, PascalCase for components, `snake_case` for API fields,
  CSS classes and URL paths/query parameters.
- Times are displayed in UTC (`formatUtc`, `formatUtcTime`); altitudes in feet with metres in
  brackets; pressures in mbar and inHg (`formatPressure`).
- Comments explain *why* something is done, and are short. Doc comments (`/** … */`) on exported
  functions where the behaviour is not obvious.
- User-facing texts are English.

## How to add things

### A new session page

1. Add the response type to `src/api/types.ts` and a `fetchX(sessionId)` function to
   `src/api/client.ts` (with a test in `src/__tests__/client.spec.ts` if it has special logic).
2. Create `src/views/XView.vue`: `defineProps<{ title: string }>()`, call
   `useSessionPage(fetchX)`, render `<h1>{{ title }}</h1>` and wrap the content in
   `<SessionPageStatus>`. Use `DataTable` with `Column<T>[]` for tabular data, `LeafletMap` for maps.
   Provide a text for the "no data" case.
3. Register a lazy-loaded route under `/ongoing_session/…` in `src/router.ts` with
   `meta: { title: '…', sessionPage: true }`.
4. Add an entry to `SESSION_PAGES` in `NavBar.vue`.

### A new non-session page or tool

Add the fetch function/types as above, a view that uses `useApiData` (or explicit form handling as
in `WeatherView`), a lazy-loaded route with a `meta.title`, and a navigation link if appropriate.
Use `usePersistentState` if inputs should survive a reload.

### Changing an existing URL

Change the path in `src/router.ts` and in all links to it (e.g. `NavBar.vue`, other views). Do not
keep the old path as a redirect. Links in the Hunter manual may need to be updated separately.

### Things to be careful about

- Never render data from the API with `v-html` or HTML strings; MultiPlayer data is untrusted.
- Keep all REST calls in `api/client.ts` and use only anonymous, simple `GET` requests (no custom
  headers), so no secrets and no CORS preflights are needed.
- Hunter domain logic belongs in the REST API, not in the SPA (see "Display logic").
- Keep the SPA fallback in `staticwebapp.config.json` intact when adding static files or folders
  (add exclusions for new static paths if needed).
- External links open in a new tab with `rel="external noopener"` and a visually hidden
  "(opens in a new tab)" hint (done automatically for `href` items in `NavDropdown`).
- Links into the Hunter manual use `manualUrl()` - never hardcode the manual's base URL.
- New runtime dependencies increase bundle size; prefer small, local helpers.
