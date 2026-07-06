# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-07-06
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL), with E2E for deep-linking

---

## Story Summary

Builds a persistent, responsive navigation shell (siesa-ui-kit `NavigationRail` on desktop, `NavigationBar` on mobile) wired to TanStack Router file-based routes so the user can move between Clientes and Contactos without full page reloads, deep-link directly to either section, get redirected from `/` to `/clientes`, and see a graceful 404 view for unknown routes.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Desktop (≥1024px / `lg:`): `NavigationRail` (siesa-ui-kit) visible with "Clientes"/"Contactos" entries; clicking navigates via TanStack Router with no full page reload (FR28).
2. **AC2** — Mobile (<1024px): `NavigationBar` (siesa-ui-kit) displayed instead of the rail; all items tappable with `aria-label` (FR29).
3. **AC3** — Typing `/clientes` or `/contactos` directly in the URL bar renders the correct view directly, no redirect to home (FR30).
4. **AC4** — Navigating to `/` redirects to `/clientes`.
5. **AC5** — Navigating to an unknown route shows a 404/not-found view gracefully inside the app shell (nav stays visible, no blank page, no unhandled JS error).
6. **AC6** — The nav item matching the current route (`/clientes` or `/contactos`) is visually marked selected/active.

---

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `e2e/tests/foundation/navigation-shell.spec.ts` (78 lines)

- ✅ **Test:** `[P1] AC3 — should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED - route `/clientes` and `data-testid="clientes-view"` do not exist yet (current `routes/index.tsx` is the only route)
  - **Verifies:** AC3 — deep link to `/clientes` renders directly, no redirect
- ✅ **Test:** `[P1] AC3 — should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED - route `/contactos` and `data-testid="contactos-view"` do not exist yet
  - **Verifies:** AC3 — deep link to `/contactos` renders directly, no redirect
- ✅ **Test:** `[P1] AC4 — should redirect from / to /clientes on load`
  - **Status:** RED - `routes/index.tsx` currently renders static text, no `beforeLoad` redirect implemented
  - **Verifies:** AC4 — root redirects to `/clientes`

### API Tests (0 tests)

Not applicable — this story is pure frontend routing/navigation with no backend contract involved.

### Component Tests (8 tests)

**File:** `frontend/src/shared/components/AppNavigation.test.tsx` (160 lines)

- ✅ **Test:** `AC1 — renders a desktop nav container (hidden lg:flex) containing NavigationRail Clientes/Contactos items`
  - **Status:** RED - `Failed to resolve import "./AppNavigation"` (component does not exist)
  - **Verifies:** AC1 — NavigationRail rendered with correct Tailwind responsive classes and both nav entries
- ✅ **Test:** `AC2 — renders a mobile nav container (lg:hidden) containing NavigationBar Clientes/Contactos items`
  - **Status:** RED - same import failure
  - **Verifies:** AC2 — NavigationBar rendered with correct responsive class and accessible, tappable items
- ✅ **Test:** `AC1 — clicking the Contactos rail item navigates via the router with no window.location call`
  - **Status:** RED - same import failure
  - **Verifies:** AC1 — navigation uses `useNavigate()`/router, never `window.location.assign`/`.reload()`
- ✅ **Test:** `AC6 — marks the Contactos rail item as selected (aria-current="page") when route is /contactos`
  - **Status:** RED - same import failure
  - **Verifies:** AC6 — active nav item reflects current route (rail)
- ✅ **Test:** `AC6 — marks the Contactos bar item as selected (aria-current="page") when route is /contactos`
  - **Status:** RED - same import failure
  - **Verifies:** AC6 — active nav item reflects current route (bar)

**File:** `frontend/src/app/routing.test.tsx` (61 lines)

- ✅ **Test:** `AC4 — navigating to "/" redirects to "/clientes" and renders the Clientes view`
  - **Status:** RED - actual assertion failure: `router.state.location.pathname` stays `"/"` (no redirect implemented); root renders static "Siesa Agents CRM" text instead of a Clientes heading
  - **Verifies:** AC4 — root redirect (TC-E1-P2-03)
- ✅ **Test:** `AC5 — navigating to an unmatched path shows the "Página no encontrada" message`
  - **Status:** RED - actual assertion failure: TanStack Router's generic fallback (`<p>Not Found</p>`) renders instead of the Spanish `NotFoundView` (console warning confirms no `notFoundComponent` is configured)
  - **Verifies:** AC5 — graceful 404 view (TC-E1-P1-04)
- ✅ **Test:** `AC5 — the navigation shell remains mounted while showing the not-found view`
  - **Status:** RED - `nav-rail-container` testid not found (AppNavigation/shell not implemented, and current root has no notFoundComponent)
  - **Verifies:** AC5 — shell/nav persists during 404 (does not get replaced)

**RED phase confirmed by actual run** (`pnpm --filter frontend test`, see Test Execution Evidence below): 8/8 component tests fail, all for the right reason (missing implementation), zero false-negatives from environment/config issues.

---

## Data Factories Created

None required. This story has no domain entities or API payloads — navigation items are a static, hardcoded array (`clientes`, `contactos`), not generated test data.

---

## Fixtures Created

None new. `e2e/fixtures/base.fixture.ts` already provides `clientesPage`/`contactosPage` navigation fixtures from Story 1.1's scaffolding; the new E2E spec uses plain `page.goto()` directly (network-first pattern) since it specifically needs to assert deep-link/redirect behavior, not reuse a pre-navigated fixture.

---

## Mock Requirements

None. This story has no network/API calls — navigation is 100% client-side routing (TanStack Router), no data fetching involved.

---

## Required data-testid Attributes

### AppNavigation (`frontend/src/shared/components/AppNavigation.tsx`)

- `nav-rail-container` - Wrapper `<div>` around the `NavigationRail` (siesa-ui-kit), must carry Tailwind classes `hidden lg:flex` (desktop-only, CSS-driven)
- `nav-bar-container` - Wrapper `<div>` around the `NavigationBar` (siesa-ui-kit), must carry Tailwind class `lg:hidden` (mobile-only, CSS-driven)
- Note: siesa-ui-kit's `NavigationRailItem` already self-renders `data-testid="navigation-rail-item-{id}"` — do not duplicate. `NavigationBar` items have no built-in testid; identify them via accessible name (`label`/`ariaLabel`) instead.

### Route Views

- `clientes-view` - Root element of the `ClientesView` placeholder (`routes/_app/clientes.tsx`)
- `contactos-view` - Root element of the `ContactosView` placeholder (`routes/_app/contactos.tsx`)

**Implementation Example:**

```tsx
// AppNavigation.tsx
<div data-testid="nav-rail-container" className="hidden lg:flex">
  <NavigationRail items={railItems} selectedId={activeId} onItemSelect={(id) => navigate({ to: '/' + id })} />
</div>
<div data-testid="nav-bar-container" className="lg:hidden">
  <NavigationBar items={barItems} activeItemId={activeId} onItemClick={(id) => navigate({ to: '/' + id })} />
</div>
```

```tsx
// routes/_app/clientes.tsx
function ClientesView() {
  return (
    <div data-testid="clientes-view">
      <h1>Clientes</h1>
      {/* EmptyState placeholder — full CRUD is Epic 2 */}
    </div>
  )
}
```

---

## Implementation Checklist

### Test Group: Vitest environment setup (prerequisite — already scaffolded by TEA)

**Files:** `frontend/vitest.config.ts`, `frontend/src/test/setup.ts`, `frontend/package.json`

- [x] `vitest.config.ts` created (`environment: 'jsdom'`, `setupFiles`, `globals: true`)
- [x] `src/test/setup.ts` created, imports `@testing-library/jest-dom`
- [x] `"test": "vitest run"` script added to `frontend/package.json`
- [x] `jsdom` added to `devDependencies` and installed (`pnpm add -D jsdom`)
- [ ] DEV: no further action needed here — run `pnpm --filter frontend test` to execute the suite

---

### Test Group: AC1/AC2/AC6 — AppNavigation component

**File:** `frontend/src/shared/components/AppNavigation.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/AppNavigation.tsx`
- [ ] Define nav items once: `{ id: 'clientes', label: 'Clientes', icon: <HomeIcon /> }`, `{ id: 'contactos', label: 'Contactos', icon: <UserGroupIcon /> }` (`@heroicons/react/24/outline`)
- [ ] Render `NavigationRail` inside a `<div data-testid="nav-rail-container" className="hidden lg:flex">`
- [ ] Render `NavigationBar` inside a `<div data-testid="nav-bar-container" className="lg:hidden">`
- [ ] Derive `activeId` from `useMatchRoute()` (or `useLocation()`) — single source of truth for both components
- [ ] Wire `onItemSelect`/`onItemClick` to `navigate({ to: '/' + id })` via `useNavigate()` — never `window.location`
- [ ] Map `activeId` to `NavigationRail`'s `selectedId` prop and `NavigationBar`'s `activeItemId` prop
- [ ] Run test: `pnpm --filter frontend exec vitest run src/shared/components/AppNavigation.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2.5 hours

---

### Test Group: AC4/AC5 — Route tree, redirect, and 404

**File:** `frontend/src/app/routing.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` (pathless layout) rendering `<AppNavigation />` + `<Outlet />`
- [ ] Create `frontend/src/routes/_app/clientes.tsx` (`createFileRoute('/_app/clientes')`) with `ClientesView` (`data-testid="clientes-view"`, heading "Clientes")
- [ ] Create `frontend/src/routes/_app/contactos.tsx` (`createFileRoute('/_app/contactos')`) with `ContactosView` (`data-testid="contactos-view"`, heading "Contactos")
- [ ] Update `frontend/src/routes/index.tsx`: `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Create `frontend/src/shared/components/NotFoundView.tsx` (Spanish "Página no encontrada" + link to `/clientes`)
- [ ] Register `notFoundComponent` so the not-found view renders **inside** the shell (nav stays mounted) — if a root-level `notFoundComponent` bypasses the `_app` layout for fully-unmatched paths, add a catch-all route under `_app` (e.g. `_app/$.tsx`) that renders `NotFoundView`, so `nav-rail-container` remains in the DOM
- [ ] Run `pnpm --filter frontend dev` (or `vite build`) at least once so the TanStack Router Vite plugin regenerates `frontend/src/routeTree.gen.ts` with the new `/_app/clientes` and `/_app/contactos` leaf routes — **Vitest alone will not regenerate this file**
- [ ] Run test: `pnpm --filter frontend exec vitest run src/app/routing.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC3/AC4 — E2E deep-linking

**File:** `e2e/tests/foundation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Complete the route tree group above (`_app`, `_app/clientes`, `_app/contactos`, index redirect) — this E2E group depends on it
- [ ] Confirm `data-testid="clientes-view"` and `data-testid="contactos-view"` are present in the rendered DOM
- [ ] Run test: `npx playwright test e2e/tests/foundation/navigation-shell.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours (mostly validates prior groups end-to-end)

---

## Running Tests

```bash
# Run all failing component tests for this story
pnpm --filter frontend test

# Run a specific component test file
pnpm --filter frontend exec vitest run src/shared/components/AppNavigation.test.tsx
pnpm --filter frontend exec vitest run src/app/routing.test.tsx

# Watch mode while implementing (green phase)
pnpm --filter frontend exec vitest

# Run the E2E deep-link tests (requires dev server + backend per playwright.config.ts webServer)
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts

# Run only P1 E2E tests
npm run test:e2e:p1 -- e2e/tests/foundation/navigation-shell.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 11 tests written across 3 files (8 component + 3 E2E), covering all 6 acceptance criteria
- ✅ Vitest/jsdom test environment scaffolded (Task 4 prerequisite) so failures are meaningful, not environment errors
- ✅ No factories/fixtures/mocks needed (static nav items, no API calls)
- ✅ `data-testid` requirements documented (`nav-rail-container`, `nav-bar-container`, `clientes-view`, `contactos-view`)
- ✅ Implementation checklist created, mapped to AC groups

**Verification (actual run, not simulated):**

- `pnpm --filter frontend exec vitest run` → **8/8 component tests FAIL** as expected:
  - `AppNavigation.test.tsx` (5 tests): fail with `Failed to resolve import "./AppNavigation"` — component doesn't exist yet
  - `routing.test.tsx` (3 tests): fail on real assertions — root stays at `/` (no redirect), and TanStack Router's generic `<p>Not Found</p>` renders instead of the Spanish `NotFoundView` (with an explicit console warning that no `notFoundComponent` is configured)
- E2E tests (`navigation-shell.spec.ts`) not executed in this pass (requires the dev server + Playwright browser runtime); they will fail on `page.goto('/clientes')`/`/contactos` timing out or returning the current placeholder index page, since those routes don't exist yet — expected RED state.

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Start with the **AppNavigation component group** (self-contained, no router-tree dependency beyond a minimal test harness already provided in the test file)
2. Then the **route tree group** (`_app`, `_app/clientes`, `_app/contactos`, redirect, 404) — remember to run `pnpm dev` once to regenerate `routeTree.gen.ts` before re-running Vitest
3. Finally the **E2E group**, which validates the full stack end-to-end
4. Run tests frequently; one group at a time

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 11 tests pass (green phase complete)
2. Confirm no duplicated route-matching logic between `NavigationRail`/`NavigationBar` mapping (single `useMatchRoute()` call feeding both)
3. Ensure tests still pass after each refactor
4. Ready for code review and story approval

---

## Next Steps

1. Share this checklist and the three failing test files with the dev workflow (manual handoff)
2. Begin implementation using the Implementation Checklist above, working one group at a time (AppNavigation → route tree → E2E)
3. When all 11 tests pass, refactor code for quality
4. Update `sprint-status.yaml` entry `1-2-frontend-navigation-shell` to `done` when complete

---

## Knowledge Base References Applied

- **component-tdd.md** - Red-Green-Refactor loop for the `AppNavigation` component, provider/router isolation per test (fresh `createRouter` + `createMemoryHistory` per test)
- **network-first.md** - E2E: `page.waitForResponse()` registered before `page.goto()` for `/clientes`, `/contactos`, and `/`
- **selector-resilience.md** - `data-testid` hierarchy; reused siesa-ui-kit's built-in `data-testid="navigation-rail-item-{id}"` instead of duplicating it
- **test-quality.md** - Given-When-Then structure, one behavior per test, deterministic `waitFor`/`findBy*` (no hard waits)
- **test-levels-framework.md** - Component tests (Vitest+RTL) chosen as primary level per test-design-epic-1.md (TC-E1-P1-01, TC-E1-P1-04, TC-E1-P2-01/02/03 are all Component-level); E2E reserved for genuine deep-link/server behavior (TC-E1-P1-02/03) that jsdom cannot exercise

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm --filter frontend exec vitest run`

**Results (summary):**

```
❯ src/shared/components/AppNavigation.test.tsx [ FAIL ]
  Error: Failed to resolve import "./AppNavigation" from
  "src/shared/components/AppNavigation.test.tsx". Does the file exist?

❯ src/app/routing.test.tsx (3 tests | 3 failed)
  × navigating to "/" redirects to "/clientes" ...
    AssertionError: expected '/' to be '/clientes'
  × navigating to an unmatched path shows "Página no encontrada" ...
    Unable to find an element with the text: /página no encontrada/i
    (renders TanStack Router's generic <p>Not Found</p> instead)
  × the navigation shell remains mounted while showing the not-found view ...
    (same root cause — no notFoundComponent configured yet)

Test Files  2 failed (2)
     Tests  3 failed (3) [+ 5 more failing at import/collection time in AppNavigation.test.tsx]
```

**Summary:**

- Total tests: 11 (8 component + 3 E2E)
- Passing: 0 (expected)
- Failing: 11 (expected)
- Status: ✅ RED phase verified — every failure traces to missing implementation (missing component file, missing routes, missing `notFoundComponent`), not to test or environment bugs

---

## Notes

- `frontend/vitest.config.ts` is intentionally a **separate** config from `vite.config.ts` so the TanStack Router file-based route-generation plugin does not run during unit/component test collection. This means `routeTree.gen.ts` is **not** auto-regenerated by `vitest` — DEV must run `pnpm --filter frontend dev` (or `vite build`) at least once after creating the new route files, then re-run Vitest.
- `frontend/src/app/routing.test.tsx` imports the real `frontend/src/routeTree.gen.ts`, so it is a genuine integration-style component test of the actual app router, not a synthetic one — this is why its 3 failures are real assertion failures today (redirect doesn't happen, 404 view is the router's generic fallback) rather than import errors.
- `frontend/src/shared/components/AppNavigation.test.tsx` uses a small, self-contained test route tree (root + `/clientes` + `/contactos`) instead of the real `routeTree.gen.ts`, so this file can be implemented and turned green independently of the route-tree group.
- The story's AC5 phrasing ("must render inside the shell, not replace it") is a known TanStack Router nuance: a root-level `notFoundComponent` only renders inside a pathless layout route (`_app`) if that layout route itself was part of the match chain. For a fully unmatched top-level path, the router falls back past `_app` to root. The RED test `the navigation shell remains mounted while showing the not-found view` will only go green once DEV verifies this and, if needed, adds a catch-all route under `_app` (e.g. `_app/$.tsx`) so the shell truly persists — this is called out explicitly in the implementation checklist rather than assumed.
- `jsdom` was missing from `frontend/package.json` devDependencies (required as the Vitest test environment engine); it has been added and installed as part of this ATDD pass so tests can actually execute and fail for the right reason.

---

## Contact

- Refer to `_bmad/bmm/testarch/tea-index.csv` for the full knowledge fragment index
- Story source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`
- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Test design source: `_bmad-output/implementation-artifacts/test-design-epic-1.md` (TC-E1-P1-01, TC-E1-P1-02/03, TC-E1-P1-04, TC-E1-P2-01/02/03)

---

**Generated by BMad TEA Agent** - 2026-07-06
