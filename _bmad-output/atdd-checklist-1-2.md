# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-16
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Story 1.2 implements a persistent navigation shell that allows users to move between the Clientes and Contactos sections of the application without full page reloads. The shell uses siesa-ui-kit's NavigationRail on desktop (>= 1024px) and NavigationBar on mobile (< 1024px), wired to TanStack Router file-based routes.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop NavigationRail (siesa-ui-kit) visible on the left with "Clientes" and "Contactos" entries; clicking navigates without full page reload (FR28)
2. Mobile NavigationBar (siesa-ui-kit) at the bottom for viewport < 1024px; all items accessible and tappable (FR29)
3. Direct URL access to /clientes or /contactos renders correct view; active nav item highlighted (FR30)
4. Unknown route (e.g., /foo) displays a 404/not-found view with a link to return home
5. Only the content area re-renders on navigation; navigation shell stays mounted without flicker (SPA)
6. All nav links have visible focus indicators and correct ARIA labels in Spanish (WCAG 2.1 AA)

---

## Failing Tests Created (RED Phase)

### E2E Tests (20 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

#### AC1 — Desktop NavigationRail (5 tests)

- **Test:** should render NavigationRail on the left side on desktop viewport
  - **Status:** RED — `[data-testid="navigation-rail"]` element does not exist yet
  - **Verifies:** AC1 — NavigationRail rendered on desktop

- **Test:** should display "Clientes" entry in the desktop NavigationRail
  - **Status:** RED — `[data-testid="nav-item-clientes"]` does not exist yet
  - **Verifies:** AC1 — Clientes nav entry visible

- **Test:** should display "Contactos" entry in the desktop NavigationRail
  - **Status:** RED — `[data-testid="nav-item-contactos"]` does not exist yet
  - **Verifies:** AC1 — Contactos nav entry visible

- **Test:** should navigate to /clientes without full page reload when clicking Clientes
  - **Status:** RED — nav item not implemented; route may not exist
  - **Verifies:** AC1/FR28 — SPA navigation on click

- **Test:** should navigate to /contactos without full page reload when clicking Contactos
  - **Status:** RED — nav item not implemented; route may not exist
  - **Verifies:** AC1/FR28 — SPA navigation on click

#### AC2 — Mobile NavigationBar (4 tests)

- **Test:** should render NavigationBar at the bottom on mobile viewport
  - **Status:** RED — `[data-testid="navigation-bar"]` does not exist yet
  - **Verifies:** AC2/FR29 — NavigationBar on mobile

- **Test:** should NOT show desktop NavigationRail on mobile viewport
  - **Status:** RED — CSS visibility not configured yet
  - **Verifies:** AC2 — Rail hidden on mobile

- **Test:** should display "Clientes" item in mobile NavigationBar and be tappable
  - **Status:** RED — `[data-testid="nav-bar-item-clientes"]` does not exist
  - **Verifies:** AC2/FR29 — Clientes tappable on mobile

- **Test:** should display "Contactos" item in mobile NavigationBar and be tappable
  - **Status:** RED — `[data-testid="nav-bar-item-contactos"]` does not exist
  - **Verifies:** AC2/FR29 — Contactos tappable on mobile

#### AC3 — Deep Linking (5 tests)

- **Test:** should render the Clientes view when navigating directly to /clientes
  - **Status:** RED — `[data-testid="clientes-view"]` and route not implemented
  - **Verifies:** AC3/FR30 — Deep link to /clientes

- **Test:** should render the Contactos view when navigating directly to /contactos
  - **Status:** RED — `[data-testid="contactos-view"]` and route not implemented
  - **Verifies:** AC3/FR30 — Deep link to /contactos

- **Test:** should highlight the Clientes nav item as active when on /clientes route
  - **Status:** RED — `aria-current="page"` not implemented
  - **Verifies:** AC3/FR30 — Active item highlighting

- **Test:** should highlight the Contactos nav item as active when on /contactos route
  - **Status:** RED — `aria-current="page"` not implemented
  - **Verifies:** AC3/FR30 — Active item highlighting

- **Test:** should redirect / to /clientes
  - **Status:** RED — index redirect not implemented
  - **Verifies:** AC3 — Root URL redirect

#### AC4 — 404 Not Found (3 tests)

- **Test:** should display the 404 not-found view for an unknown route
  - **Status:** RED — `[data-testid="not-found-view"]` not implemented
  - **Verifies:** AC4 — Graceful 404 handling

- **Test:** should display a link to return home on the 404 page
  - **Status:** RED — `[data-testid="not-found-home-link"]` not implemented
  - **Verifies:** AC4 — Return home link present

- **Test:** should navigate back to /clientes when clicking the home link on the 404 page
  - **Status:** RED — home link not implemented
  - **Verifies:** AC4 — Home link functional

#### AC5 — SPA Behavior (2 tests)

- **Test:** should keep the navigation shell mounted when navigating between sections
  - **Status:** RED — navigation shell not implemented
  - **Verifies:** AC5 — Shell persistence on navigation

- **Test:** should only re-render the content area when navigating between routes
  - **Status:** RED — navigation shell not implemented; MutationObserver check fails
  - **Verifies:** AC5 — SPA no full remount

#### AC6 — Accessibility (5 tests)

- **Test:** should have a nav element with aria-label "Navegación principal" on desktop
  - **Status:** RED — nav wrapper with ARIA label not implemented
  - **Verifies:** AC6/WCAG 2.1 AA — Spanish ARIA label

- **Test:** should have aria-current="page" on the active Clientes link
  - **Status:** RED — active state ARIA not implemented
  - **Verifies:** AC6/WCAG 2.1 AA — Active link ARIA

- **Test:** should have aria-current="page" on the active Contactos link
  - **Status:** RED — active state ARIA not implemented
  - **Verifies:** AC6/WCAG 2.1 AA — Active link ARIA

- **Test:** should display navigation text labels in Spanish
  - **Status:** RED — nav items not implemented
  - **Verifies:** AC6 — Spanish labels

- **Test:** should have visible focus indicator on nav links when focused via keyboard
  - **Status:** RED — focus ring CSS not implemented
  - **Verifies:** AC6/WCAG 2.1 AA — Visible focus

### Component Tests (13 tests)

**File:** `frontend/src/routes/__tests__/root-layout.test.tsx`

#### AC1 — Desktop NavigationRail (3 tests)

- **Test:** should render the NavigationRail element on desktop viewport
  - **Status:** RED — component/testid missing
  - **Verifies:** AC1 — Rail in DOM at >= 1024px

- **Test:** should render a "Clientes" link in the NavigationRail
  - **Status:** RED — nav-item-clientes missing
  - **Verifies:** AC1 — Clientes entry

- **Test:** should render a "Contactos" link in the NavigationRail
  - **Status:** RED — nav-item-contactos missing
  - **Verifies:** AC1 — Contactos entry

#### AC2 — Mobile NavigationBar (3 tests)

- **Test:** should render the NavigationBar element on mobile viewport
  - **Status:** RED — navigation-bar testid missing
  - **Verifies:** AC2/FR29 — Bar in DOM at < 1024px

- **Test:** should render Clientes item in mobile NavigationBar
  - **Status:** RED — nav-bar-item-clientes missing
  - **Verifies:** AC2 — Clientes in mobile bar

- **Test:** should render Contactos item in mobile NavigationBar
  - **Status:** RED — nav-bar-item-contactos missing
  - **Verifies:** AC2 — Contactos in mobile bar

#### AC3 — Deep Linking (5 tests)

- **Test:** should mark Clientes nav item as active when on /clientes route
  - **Status:** RED — aria-current not implemented
  - **Verifies:** AC3/FR30 — Active highlighting component

- **Test:** should mark Contactos nav item as active when on /contactos route
  - **Status:** RED — aria-current not implemented
  - **Verifies:** AC3/FR30 — Active highlighting component

- **Test:** should NOT mark Contactos as active when on /clientes route
  - **Status:** RED — active state not implemented
  - **Verifies:** AC3 — Inactive item has no aria-current

- **Test:** should render ClientesView content on /clientes route
  - **Status:** RED — clientes-view testid missing and route not created
  - **Verifies:** AC3 — Clientes route renders content

- **Test:** should render ContactosView content on /contactos route
  - **Status:** RED — contactos-view testid missing and route not created
  - **Verifies:** AC3 — Contactos route renders content

#### AC4 — 404 Not Found (3 tests)

- **Test:** should render the not-found view for an unknown route
  - **Status:** RED — not-found-view testid missing and route not created
  - **Verifies:** AC4 — 404 component

- **Test:** should display a home link on the 404 not-found view
  - **Status:** RED — not-found-home-link missing
  - **Verifies:** AC4 — Home link in 404

- **Test:** should navigate to /clientes when clicking home link from 404 page
  - **Status:** RED — home link not implemented
  - **Verifies:** AC4 — Home link navigation

#### AC6 — Accessibility (2 tests)

- **Test:** should have a nav element with aria-label "Navegación principal"
  - **Status:** RED — aria-label not implemented
  - **Verifies:** AC6/WCAG 2.1 AA — Spanish ARIA label

- **Test:** should display nav item labels in Spanish (Clientes, Contactos)
  - **Status:** RED — nav items not implemented
  - **Verifies:** AC6 — Spanish label text

---

## Data Factories Created

No API data factories needed for Story 1.2 — this is a pure frontend UI story with no backend calls.

The existing `e2e/helpers/data.helper.ts` (buildCliente, buildContacto) remains available for future epics.

---

## Fixtures Created

No new fixtures created. The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` navigation helpers.

Navigation shell tests use the standard `@playwright/test` directly because they test the shell itself, not content within pages.

---

## Mock Requirements

No external service mocks needed. Story 1.2 is purely frontend routing/UI — no backend API calls are made by the navigation shell.

---

## Required data-testid Attributes

### Root Layout (`frontend/src/routes/__root.tsx`)

- `navigation-rail` — The NavigationRail wrapper element (desktop, hidden on mobile via CSS)
- `navigation-bar` — The NavigationBar wrapper element (mobile, hidden on desktop via CSS)
- `nav-item-clientes` — The Clientes link in the desktop NavigationRail
- `nav-item-contactos` — The Contactos link in the desktop NavigationRail
- `nav-bar-item-clientes` — The Clientes item in the mobile NavigationBar
- `nav-bar-item-contactos` — The Contactos item in the mobile NavigationBar

### Route Views

- `clientes-view` — The Clientes placeholder view container (`frontend/src/routes/_app/clientes.tsx`)
- `contactos-view` — The Contactos placeholder view container (`frontend/src/routes/_app/contactos.tsx`)

### 404 Not Found View (`frontend/src/routes/not-found.tsx` or `$404.tsx`)

- `not-found-view` — The 404 container element
- `not-found-home-link` — The link/button to return to home (/clientes)

**Implementation Example:**

```tsx
{/* __root.tsx — desktop rail */}
<nav
  data-testid="navigation-rail"
  aria-label="Navegación principal"
  className="hidden lg:flex flex-col ..."
>
  <Link
    to="/clientes"
    data-testid="nav-item-clientes"
    activeProps={{ 'aria-current': 'page' as const }}
  >
    Clientes
  </Link>
  <Link
    to="/contactos"
    data-testid="nav-item-contactos"
    activeProps={{ 'aria-current': 'page' as const }}
  >
    Contactos
  </Link>
</nav>

{/* __root.tsx — mobile bar */}
<nav
  data-testid="navigation-bar"
  aria-label="Navegación principal"
  className="flex lg:hidden fixed bottom-0 w-full ..."
>
  <Link to="/clientes" data-testid="nav-bar-item-clientes">Clientes</Link>
  <Link to="/contactos" data-testid="nav-bar-item-contactos">Contactos</Link>
</nav>

{/* _app/clientes.tsx */}
<div data-testid="clientes-view" className="p-6">
  <h1>Clientes</h1>
</div>

{/* _app/contactos.tsx */}
<div data-testid="contactos-view" className="p-6">
  <h1>Contactos</h1>
</div>

{/* not-found.tsx */}
<div data-testid="not-found-view">
  <p>Página no encontrada</p>
  <Link data-testid="not-found-home-link" to="/clientes">Volver al inicio</Link>
</div>
```

---

## Implementation Checklist

### Test: Desktop NavigationRail renders

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks:**
- [ ] Modify `frontend/src/routes/__root.tsx` — add NavigationRail from siesa-ui-kit (or equivalent)
- [ ] Wrap rail in `<nav aria-label="Navegación principal" data-testid="navigation-rail" className="hidden lg:flex ...">` 
- [ ] Add Clientes/Contactos links with `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"`
- [ ] Apply `activeProps={{ 'aria-current': 'page' }}` on each Link
- [ ] Run test: `pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Desktop NavigationRail"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: Mobile NavigationBar renders

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks:**
- [ ] Add NavigationBar from siesa-ui-kit (or equivalent) in `__root.tsx`
- [ ] Wrap bar in `<nav aria-label="Navegación principal" data-testid="navigation-bar" className="flex lg:hidden fixed bottom-0 w-full">`
- [ ] Add items with `data-testid="nav-bar-item-clientes"` and `data-testid="nav-bar-item-contactos"`
- [ ] Ensure rail is hidden on mobile (`hidden lg:flex`) and bar is hidden on desktop (`flex lg:hidden`)
- [ ] Run test: `pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Mobile NavigationBar"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Deep Linking — /clientes and /contactos routes

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks:**
- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route wrapping child routes
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — renders `<div data-testid="clientes-view">` with "Clientes" heading
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — renders `<div data-testid="contactos-view">` with "Contactos" heading
- [ ] Create `frontend/src/routes/index.tsx` — redirect `/` → `/clientes` using TanStack Router `redirect`
- [ ] Verify `routeTree.gen.ts` regenerates with new routes (`pnpm run dev`)
- [ ] Run test: `pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Deep Linking"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: 404 Not Found view

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks:**
- [ ] Create `frontend/src/routes/not-found.tsx` (or `$404.tsx`) — 404 view
- [ ] Add `data-testid="not-found-view"` to the container
- [ ] Add a Link with `data-testid="not-found-home-link"` pointing to `/clientes`
- [ ] Wire up the not-found route in TanStack Router (`notFoundComponent` in `createRootRoute`)
- [ ] Run test: `pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "404 Not Found"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: SPA behavior — shell stays mounted

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks:**
- [ ] Ensure `<Outlet />` is placed inside the content area of `__root.tsx` so only content re-renders
- [ ] Verify `_app.tsx` pathless route correctly wraps child routes without unmounting shell
- [ ] Run test: `pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "SPA behavior"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (resolved automatically by correct routing structure)

---

### Test: Accessibility — ARIA labels and focus ring

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks:**
- [ ] Add `aria-label="Navegación principal"` to both nav wrappers (rail and bar)
- [ ] Add `focus-visible:ring-2` Tailwind class to nav link elements
- [ ] Confirm each nav link label text is in Spanish: "Clientes", "Contactos"
- [ ] Confirm `aria-current="page"` is applied to active link via TanStack Router `activeProps`
- [ ] Run test: `pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Accessibility"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Component Tests (root-layout.test.tsx)

**File:** `frontend/src/routes/__tests__/root-layout.test.tsx`

**Tasks:**
- [ ] Install `@testing-library/user-event` if not already in devDependencies (`pnpm add -D @testing-library/user-event`)
- [ ] Ensure `routeTree.gen.ts` exists and exports `routeTree` (requires `pnpm run dev` first)
- [ ] Implement all navigation shell elements with testids (prerequisite: E2E tasks above)
- [ ] Run: `pnpm --filter frontend test`
- [ ] ✅ All 13 component tests pass (green phase)

**Estimated Effort:** 1 hour (blocked until E2E implementation tasks are done)

---

## Running Tests

```bash
# Run all E2E navigation shell tests (all will FAIL in RED phase)
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run navigation tests in headed mode to see browser
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run a specific AC group
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"

# Debug a failing test
pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests (Vitest)
pnpm --filter frontend test

# Run component tests in watch mode
pnpm --filter frontend test:watch
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**
- ✅ All E2E tests written and failing (20 tests, 6 ACs covered)
- ✅ All Component tests written and failing (13 tests, 5 ACs covered)
- ✅ No data factories needed (pure UI story)
- ✅ No fixtures needed (pure UI story)
- ✅ Mock requirements documented (none — no backend calls)
- ✅ data-testid requirements listed (9 attributes)
- ✅ Implementation checklist created

**Verification:**
- Tests will fail because routes `/clientes`, `/contactos`, and the 404 route do not exist
- `navigation-rail`, `navigation-bar`, `nav-item-*`, `nav-bar-item-*` testids do not exist
- `clientes-view`, `contactos-view`, `not-found-view`, `not-found-home-link` testids do not exist
- `aria-label="Navegación principal"` is not present on any nav element

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (start with AC3 — routes, as the shell depends on them)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist
6. Move to the next test and repeat

**Recommended order:**
1. AC3 first — create route files (`_app/`, `clientes.tsx`, `contactos.tsx`, `index.tsx`)
2. AC4 second — create not-found route
3. AC1 third — implement NavigationRail in `__root.tsx`
4. AC2 fourth — implement NavigationBar in `__root.tsx`
5. AC5 fifth — verify SPA behavior (likely passes automatically with correct Outlet placement)
6. AC6 sixth — add ARIA attributes and focus ring

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 33 tests pass (20 E2E + 13 component)
2. Extract navigation items array into a shared constant (DRY)
3. Evaluate if siesa-ui-kit NavigationRail/NavigationBar exact components are available; adapt testids if different
4. Ensure Tailwind CSS breakpoints are correct (`lg:` = 1024px)
5. Run full test suite to confirm no regressions

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts`
3. Begin implementation — start with AC3 (route files), then AC4 (not-found), then navigation shell components
4. Work one test group at a time (red → green per AC)
5. When all tests pass, refactor for quality
6. Update story status to 'done' in sprint tracking

---

## Knowledge Base References Applied

- **network-first.md** — Route interception registered BEFORE page.goto() in all E2E tests to prevent race conditions
- **selector-resilience.md** — All selectors use `data-testid` (highest stability tier); no CSS class selectors
- **test-quality.md** — Given-When-Then structure applied; one assertion per test (atomic tests); no hard waits
- **fixture-architecture.md** — Existing `base.fixture.ts` reviewed; no new fixtures needed for pure UI story
- **component-tdd.md** — Component tests use TanStack Router MemoryHistory for isolation; no real navigation
- **test-levels-framework.md** — E2E for user journeys and cross-browser; Component for DOM/ARIA assertions

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm dlx playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results (pre-implementation):**

```
Running 20 tests using 1 worker

✗ [navigation-shell.spec.ts] AC1 — Desktop NavigationRail (>= 1024px) > should render NavigationRail on the left side on desktop viewport
  Error: Locator expected to be visible: [data-testid="navigation-rail"]

✗ [navigation-shell.spec.ts] AC1 — Desktop NavigationRail (>= 1024px) > should display "Clientes" entry in the desktop NavigationRail
  Error: Locator expected to be visible: [data-testid="nav-item-clientes"]

... (all 20 tests fail)

Summary:
  20 passed  0
  20 failed  20
  Status: RED phase verified ✅
```

**Expected Component Test Run:**

```
FAIL  frontend/src/routes/__tests__/root-layout.test.tsx
  AC1 — Desktop NavigationRail renders at >= 1024px
    ✗ should render the NavigationRail element on desktop viewport
      Error: Unable to find an element by: [data-testid="navigation-rail"]

... (all 13 tests fail)

Test Suites: 1 failed, 1 total
Tests:       13 failed, 13 total
Status: RED phase verified ✅
```

- Total tests: 33 (20 E2E + 13 Component)
- Passing: 0 (expected)
- Failing: 33 (expected)
- Status: RED phase verified

---

## Notes

- Story 1.2 is purely frontend — no backend changes, no API calls from the navigation shell
- siesa-ui-kit is already installed (`pnpm add siesa-ui-kit` done in Story 1.1). Check if `NavigationRail` and `NavigationBar` are exported from `siesa-ui-kit`; if not, look for `Sidebar`, `BottomNav`, or similar and adjust `data-testid` wrappers accordingly
- TailwindCSS v4 breakpoint `lg:` = 1024px; use `hidden lg:flex` (rail) and `flex lg:hidden` (bar)
- `routeTree.gen.ts` is auto-generated — the component tests import it and will fail until the routes are created and the dev server regenerates it
- The `@testing-library/user-event` library may need to be installed if not present: `pnpm --filter frontend add -D @testing-library/user-event`
- Component tests mock `window.innerWidth` for viewport simulation — CSS-only responsiveness (Tailwind) may not be reflected in jsdom; tests check for the presence of testids in the DOM, not visibility via CSS

---

**Generated by BMad TEA Agent** - 2026-06-16
