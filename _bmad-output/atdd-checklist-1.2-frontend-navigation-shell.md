# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL) + E2E (Playwright)
**Story File:** `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`

---

## Story Summary

Establish the persistent navigation shell for the CRM (NavigationRail on desktop, NavigationBar on mobile) using `siesa-ui-kit` primitives, wire router-driven navigation with deep-linking, add a Spanish 404 view, and redirect `/` to `/clientes`.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device.

---

## Acceptance Criteria (mapped to tests)

| AC | Description | Test level | Tests |
|----|-------------|------------|-------|
| AC1 | Desktop NavigationRail with Clientes + Contactos, router navigation (no `window.location`) — FR28 | Component + E2E | `__root.test.tsx` (rail render + active state + SPA navigation), `navigation-shell.spec.ts` (viewport 1280) |
| AC2 | Mobile NavigationBar; Rail NOT rendered — FR29 | Component + E2E | `__root.test.tsx` (mobile bar render), `navigation-shell.spec.ts` (viewport 375) |
| AC3 | Deep linking works for `/clientes` and `/contactos` — FR30 | E2E | `navigation-shell.spec.ts` (direct URL tests) |
| AC4 | Unknown route shows Spanish 404 (`Página no encontrada`) with shell visible | Component + E2E | `__root.test.tsx` (404 view), `navigation-shell.spec.ts` (unknown route) |
| AC5 | `/` redirects to `/clientes` | Component + E2E | `__root.test.tsx` (index redirect), `navigation-shell.spec.ts` (root redirect) |
| AC6 | Active nav item reflects route; shell does not unmount | Component + E2E | `__root.test.tsx` (aria-current, shell persistence) |

---

## Failing Tests Created (RED Phase)

### E2E Tests (16 tests)

**File:** `e2e/tests/foundation/navigation-shell.spec.ts`

Tests are grouped by AC:

- **AC3 — Deep linking (5 tests):**
  - `TC-E1-P1-02` — render Clientes on direct `/clientes` navigation
  - `TC-E1-P1-02` — no redirect to root when deep-linking `/clientes`
  - `TC-E1-P1-03` — render Contactos on direct `/contactos` navigation
  - `TC-E1-P1-03` — URL stays at `/contactos` after deep link
  - AC3 — no JS runtime errors on deep link
- **AC4 — 404 view (4 tests):**
  - `TC-E1-P1-04` — `data-testid="page-not-found"` visible on unknown route
  - Spanish heading `Página no encontrada` present
  - Shell (`data-testid="app-content"`) still visible with the 404 view
  - No JS runtime errors on 404
- **AC5 — Root redirect (1 test):**
  - `TC-E1-P2-03` — `/` resolves to `/clientes` and Clientes view renders
- **AC1 — Desktop rail (2 tests, viewport 1280×800):**
  - `TC-E1-P2-01` — `data-testid="nav-rail-desktop"` visible
  - Mobile bar hidden on desktop viewport
- **AC2 — Mobile bar (2 tests, viewport 375×812):**
  - `TC-E1-P2-02` — `data-testid="nav-bar-mobile"` visible
  - Desktop rail hidden on mobile viewport (FR29)
- **AC1/AC6/FR28 — SPA navigation (3 tests, viewport 1280×800):**
  - Rail click navigates `/clientes` → `/contactos`
  - `window.__navTag` preserved across navigation (proves no full reload)
  - `data-testid="app-content"` node stays mounted across route changes

**Status:** All tests RED — routes `/clientes`, `/contactos`, 404 view, rail/bar containers, and index redirect do not exist yet.

### Component Tests (11 tests)

**File:** `frontend/src/routes/__root.test.tsx`

- **AC5 — Index redirect (1 test):**
  - `TC-E1-P2-03` — memory router at `/` renders `data-testid="page-clientes"`
- **AC1 — Desktop rail (2 tests):**
  - `TC-E1-P2-01` — `data-testid="nav-rail-desktop"` present
  - AC6 — `data-testid="nav-item-clientes"` has `aria-current="page"` when path is `/clientes`
- **AC2 — Mobile bar (1 test):**
  - `TC-E1-P2-02` — `data-testid="nav-bar-mobile"` present at viewport 375
- **AC1/AC6/FR28 — Router-driven navigation (3 tests):**
  - Clicking `nav-item-contactos` updates `router.state.location.pathname` to `/contactos`
  - `window.location.href` is NOT reassigned and `window.location.assign` is NOT called (FR28)
  - `data-testid="app-content"` node reference is preserved (shell not remounted)
- **AC4 — 404 view (4 tests):**
  - `TC-E1-P1-04` — `data-testid="page-not-found"` present on unknown route
  - Spanish heading `Página no encontrada` in the 404 view
  - Shell (`data-testid="app-content"`) still present with 404
  - `Volver a Clientes` link points to `/clientes`

**Status:** All tests RED — `__root.tsx` currently renders only a placeholder wrapper without rail, bar, active state, 404 view, or the required `data-testid` hooks. The route tree also lacks `/clientes` and `/contactos`.

---

## Data Factories Created

None required. Story 1.2 is a navigation-shell story with no CRUD, no forms, and no backend data. Factories will start with Epic 2 (Clientes CRUD).

---

## Fixtures Created

None new for this story. Existing `e2e/fixtures/base.fixture.ts` already exposes `clientesPage` / `contactosPage` navigation fixtures — these will start passing once Story 1.2 lands the `/clientes` and `/contactos` routes.

---

## Mock Requirements

None. Navigation shell is purely front-end and does not talk to the backend in Story 1.2.

---

## Required `data-testid` Attributes

The tests above assert these `data-testid` hooks — the implementation MUST add each of them:

### Root layout (`src/routes/__root.tsx`)

- `app-content` — `<main>` element wrapping `<Outlet />` (proves persistent shell)
- `nav-rail-desktop` — root container of the desktop `NavigationRail`
- `nav-bar-mobile` — root container of the mobile `NavigationBar`
- `nav-item-clientes` — clickable element for the Clientes nav entry (rail item + bar item can share the id or use `nav-item-clientes` twice; tests query by testid so ensure at least the currently-visible one exposes it)
- `nav-item-contactos` — clickable element for the Contactos nav entry
- `page-not-found` — container of the 404 view

The active item MUST also expose `aria-current="page"` when its route is the current one (used to assert active state).

### Route placeholders

- `src/routes/clientes.tsx` → root element gets `data-testid="page-clientes"`
- `src/routes/contactos.tsx` → root element gets `data-testid="page-contactos"`

### 404 view

- Heading text: `Página no encontrada`
- Anchor/link labeled `Volver a Clientes` with `href="/clientes"`

---

## Implementation Checklist (RED → GREEN mapping)

### Test: Deep link `/clientes` → renders Clientes view (TC-E1-P1-02)

- [ ] Create `frontend/src/routes/clientes.tsx` exporting a `createFileRoute('/clientes')` route with a `<h1>Clientes</h1>` and `data-testid="page-clientes"`.
- [ ] Regenerate `routeTree.gen.ts` (Vite plugin) — restart dev server if needed.
- [ ] Run: `pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium`
- [ ] Green.

### Test: Deep link `/contactos` → renders Contactos view (TC-E1-P1-03)

- [ ] Create `frontend/src/routes/contactos.tsx` exporting a `createFileRoute('/contactos')` route with `data-testid="page-contactos"`.
- [ ] Run: `pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium`
- [ ] Green.

### Test: `/` redirects to `/clientes` (TC-E1-P2-03)

- [ ] Rewrite `frontend/src/routes/index.tsx` to use `beforeLoad` + `throw redirect({ to: '/clientes' })`.
- [ ] Run component test: `pnpm --filter frontend test:unit` (index redirect test).
- [ ] Run E2E test: `pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts -g "AC5"`.
- [ ] Green.

### Test: 404 view for unknown route (TC-E1-P1-04)

- [ ] Add `notFoundComponent: NotFoundView` to `createRootRoute` in `__root.tsx`.
- [ ] Implement `NotFoundView` with:
  - Container `data-testid="page-not-found"`
  - Heading `Página no encontrada`
  - Body copy `La ruta que intentaste abrir no existe o fue movida.`
  - `<Link to="/clientes">Volver a Clientes</Link>` (TanStack Router `Link`)
- [ ] Ensure the 404 view renders **inside** the shell so `data-testid="app-content"` stays visible.
- [ ] Green.

### Test: NavigationRail on desktop (TC-E1-P2-01) + active state (AC6)

- [ ] Create `frontend/src/app/config/navigation.ts` with `NAV_ITEMS` array (`id`, `label`, `path`, `icon`) — `clientes` (`UsersIcon`), `contactos` (`UserIcon`).
- [ ] In `__root.tsx`, render `<NavigationRail>` (siesa-ui-kit) inside a desktop container with `data-testid="nav-rail-desktop"`, `className="hidden lg:flex"`.
- [ ] Compute active id from `useRouterState().location.pathname` (starts-with match on the item path).
- [ ] Wrap each rail item so it exposes `data-testid={"nav-item-" + id}` and `aria-current="page"` when active.
- [ ] Wire `onItemSelect` to `router.navigate({ to })` — NEVER assign `window.location.href`.
- [ ] Add `@heroicons/react`: `pnpm --filter frontend add @heroicons/react`.
- [ ] Import `siesa-ui-kit/styles.css` in `main.tsx` before `./index.css`.
- [ ] Green.

### Test: NavigationBar on mobile (TC-E1-P2-02, FR29)

- [ ] Render `<NavigationBar>` (siesa-ui-kit) inside a mobile container with `data-testid="nav-bar-mobile"`, `className="flex lg:hidden fixed bottom-0 inset-x-0"`.
- [ ] Wire `onItemClick` → `router.navigate({ to })`.
- [ ] Confirm `NavigationRail` container uses `hidden lg:flex` so it is NOT visible on mobile (FR29).
- [ ] Green.

### Test: SPA navigation (no full reload, FR28) + persistent shell (AC6)

- [ ] Confirm both containers call `router.navigate` (not `window.location.assign`, not `<a href>` outside `Link`).
- [ ] Wrap `<Outlet />` in a `<main data-testid="app-content">` element that lives OUTSIDE the routes tree (rendered by `RootLayout`).
- [ ] Green.

### Cross-cutting infra (Vitest setup)

- [ ] Update `frontend/vitest.config.ts`: switch `environment` to `jsdom`, add `setupFiles: ['./vitest.setup.ts']`.
- [ ] Install jsdom: `pnpm --filter frontend add -D jsdom`.
- [ ] Ensure `frontend/vitest.setup.ts` (already created here) imports `@testing-library/jest-dom/vitest`.

---

## Running Tests

```bash
# All frontend unit + component tests
pnpm --filter frontend test:unit

# The Story 1.2 component test only
pnpm --filter frontend test:unit -- src/routes/__root.test.tsx

# All Playwright E2E tests for Story 1.2 (chromium project — matches config)
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium

# Only deep-linking tests
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts -g "AC3" --project=chromium

# Headed mode (see the browser)
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --headed --project=chromium

# Debug a single test
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --debug --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 27 tests written and failing:
  - 16 Playwright E2E tests
  - 11 Vitest + RTL component tests
- Failure reason: implementation missing (no `/clientes` / `/contactos` routes, no rail/bar containers, no 404 view, no root redirect).

### GREEN Phase (DEV Team)

Implement one AC at a time using the checklist above. Recommended order (each unlocks more tests):

1. Placeholder routes (`clientes.tsx`, `contactos.tsx`) — unblocks TC-E1-P1-02, TC-E1-P1-03.
2. Vitest jsdom + setup — unblocks all component tests from running.
3. Index redirect — unblocks TC-E1-P2-03.
4. RootLayout with rail + bar + `app-content` — unblocks TC-E1-P2-01, TC-E1-P2-02, SPA nav.
5. 404 view + Link back — unblocks TC-E1-P1-04.

### REFACTOR Phase (DEV Team)

- Extract `NAV_ITEMS` into `app/config/navigation.ts` if inlined during GREEN.
- Extract `NotFoundView` into `app/components/NotFoundView.tsx` for reuse.
- Consider `useRouterState({ select: (s) => s.location.pathname })` for perf.

---

## Notes & Constraints

- **Selectors:** All tests use `data-testid` exclusively. No CSS-class or text-based selectors for structural queries (only for content assertions like `Página no encontrada`).
- **Network-first:** E2E tests register `waitForResponse` before `page.goto` where an HTTP round-trip is expected.
- **No hard waits:** Every wait is explicit (`toBeVisible`, `findByTestId`, `waitFor`). No `page.waitForTimeout`.
- **Spanish UI:** Heading and link text are asserted in Spanish per company standard.
- **Viewport strategy:** Playwright uses `test.use({ viewport })` for viewport-scoped suites. Vitest mocks `window.matchMedia` because jsdom doesn't ship one by default.
- **FR28 verification:** Both a runtime tag (`window.__navTag`) in E2E and a `Object.defineProperty` spy in Vitest guard against `window.location.href` reassignment.
- **`@testing-library/user-event` NOT installed:** component tests use `fireEvent.click` from `@testing-library/react` to avoid adding a new dependency.

---

## Test Files Created

- `e2e/tests/foundation/navigation-shell.spec.ts` (16 Playwright tests)
- `frontend/src/routes/__root.test.tsx` (11 Vitest + RTL tests)
- `frontend/vitest.setup.ts` (jest-dom matcher registration)

---

**Generated by BMad TEA Agent** — 2026-07-01
