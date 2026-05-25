# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-25
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright) + Component/Unit (Vitest)

---

## Story Summary

Story 1.2 implements the persistent navigation structure for the Siesa Agents CRM frontend. Using `siesa-ui-kit LayoutBase`, the app shell provides a `NavigationRail` on desktop (≥1024px) and a responsive `NavigationBar` on mobile. Routes for `/clientes` and `/contactos` support deep linking, active state highlighting, a 404 catch-all view, and an automatic redirect from `/` to `/clientes`.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (≥1024px), When the user views the app, Then a NavigationRail (siesa-ui-kit `LayoutBase`) is visible on the left side with "Clientes" and "Contactos" entries. Clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **AC2** — Given the application is loaded on a mobile browser viewport (≥375px), When the user views the app, Then a mobile-responsive NavigationBar (siesa-ui-kit `LayoutBase` mobile layout) is displayed instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **AC3** — Given the user types `/clientes` or `/contactos` directly in the browser URL bar, When the page loads, Then the correct view is rendered without redirection to a home screen (deep linking — FR30).

4. **AC4** — Given the user is on any route, When they click a navigation item that matches the current route, Then the item is visually marked as active (highlighted/selected state with `aria-current="page"`).

5. **AC5** — Given the user navigates to an unknown route (e.g., `/unknown`), When the page loads, Then a 404 / not-found view is displayed gracefully with a link back to `/clientes`.

6. **AC6** — Given the root path `/` is accessed, When the page loads, Then the user is automatically redirected to `/clientes`.

---

## Failing Tests Created (RED Phase)

### E2E Tests (19 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- **Test:** `AC6 — Root path redirect > should redirect from / to /clientes automatically`
  - **Status:** RED — `/` route does not yet redirect; TanStack Router index.tsx not created
  - **Verifies:** AC6 — Root path auto-redirect to /clientes

- **Test:** `AC1 — Desktop navigation rail > should display the navigation rail on desktop viewport`
  - **Status:** RED — `[data-testid="navigation-rail"]` does not exist; LayoutBase not installed
  - **Verifies:** AC1 — NavigationRail visibility on desktop

- **Test:** `AC1 — Desktop navigation rail > should show "Clientes" navigation item in the rail`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` does not exist
  - **Verifies:** AC1 — Clientes entry in NavigationRail

- **Test:** `AC1 — Desktop navigation rail > should show "Contactos" navigation item in the rail`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` does not exist
  - **Verifies:** AC1 — Contactos entry in NavigationRail

- **Test:** `AC1 — Desktop navigation rail > should navigate to /clientes without a full page reload`
  - **Status:** RED — Navigation item and SPA routing not implemented
  - **Verifies:** AC1 — SPA navigation without full reload (FR28)

- **Test:** `AC1 — Desktop navigation rail > should navigate to /contactos without a full page reload`
  - **Status:** RED — Navigation item and SPA routing not implemented
  - **Verifies:** AC1 — SPA navigation to /contactos (FR28)

- **Test:** `AC2 — Mobile navigation bar > should display the mobile navigation bar on a mobile viewport`
  - **Status:** RED — `[data-testid="navigation-bar-mobile"]` does not exist; LayoutBase not installed
  - **Verifies:** AC2 — Mobile NavigationBar visibility (FR29)

- **Test:** `AC2 — Mobile navigation bar > should NOT display the desktop navigation rail on a mobile viewport`
  - **Status:** RED — NavigationRail and responsive behavior not implemented
  - **Verifies:** AC2 — Rail hidden on mobile

- **Test:** `AC2 — Mobile navigation bar > should show "Clientes" navigation item in the mobile bar`
  - **Status:** RED — Mobile navigation items not implemented
  - **Verifies:** AC2 — Clientes tappable on mobile

- **Test:** `AC2 — Mobile navigation bar > should show "Contactos" navigation item in the mobile bar`
  - **Status:** RED — Mobile navigation items not implemented
  - **Verifies:** AC2 — Contactos tappable on mobile

- **Test:** `AC2 — Mobile navigation bar > should navigate to /contactos when tapping Contactos on mobile`
  - **Status:** RED — Mobile navigation and routing not implemented
  - **Verifies:** AC2 — Mobile SPA navigation (FR29)

- **Test:** `AC3 — Deep linking > should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED — `[data-testid="clientes-page-title"]` does not exist; route file missing
  - **Verifies:** AC3 — Deep link to /clientes renders correct view (FR30)

- **Test:** `AC3 — Deep linking > should NOT redirect away from /clientes when accessed directly`
  - **Status:** RED — Route file for /clientes missing
  - **Verifies:** AC3 — URL stays at /clientes

- **Test:** `AC3 — Deep linking > should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED — `[data-testid="contactos-page-title"]` does not exist; route file missing
  - **Verifies:** AC3 — Deep link to /contactos renders correct view (FR30)

- **Test:** `AC3 — Deep linking > should NOT redirect away from /contactos when accessed directly`
  - **Status:** RED — Route file for /contactos missing
  - **Verifies:** AC3 — URL stays at /contactos

- **Test:** `AC4 — Active navigation item state > should mark the Clientes item as active when on /clientes`
  - **Status:** RED — `aria-current="page"` not set on active nav item
  - **Verifies:** AC4 — Active state on Clientes item

- **Test:** `AC4 — Active navigation item state > should mark the Contactos item as active when on /contactos`
  - **Status:** RED — `aria-current="page"` not set on active nav item
  - **Verifies:** AC4 — Active state on Contactos item

- **Test:** `AC4 — Active navigation item state > should NOT mark Contactos as active when on /clientes`
  - **Status:** RED — Active state not implemented
  - **Verifies:** AC4 — Only current route item is active

- **Test:** `AC4 — Active navigation item state > should update active state after navigating from /clientes to /contactos`
  - **Status:** RED — Active state update on navigation not implemented
  - **Verifies:** AC4 — Active state updates dynamically on route change

- **Test:** `AC5 — 404 not-found view > should display a 404 not-found view when navigating to an unknown route`
  - **Status:** RED — `[data-testid="not-found-view"]` does not exist; catch-all route missing
  - **Verifies:** AC5 — 404 view renders for unknown routes

- **Test:** `AC5 — 404 not-found view > should display a graceful message on the 404 view in Spanish`
  - **Status:** RED — Not-found message not implemented
  - **Verifies:** AC5 — Spanish error message on 404 view

- **Test:** `AC5 — 404 not-found view > should display a link back to /clientes on the 404 view`
  - **Status:** RED — `[data-testid="not-found-back-link"]` does not exist
  - **Verifies:** AC5 — Back link to /clientes on 404

- **Test:** `AC5 — 404 not-found view > should navigate to /clientes when clicking the back link on the 404 view`
  - **Status:** RED — 404 view and back link not implemented
  - **Verifies:** AC5 — Clicking back link navigates to /clientes

### Component / Unit Tests (20 tests)

**File:** `frontend/src/__tests__/navigation/navigation-shell.test.tsx`

- **Test:** `AC1 — __root.tsx: LayoutBase shell > should import LayoutBase from siesa-ui-kit`
  - **Status:** RED — siesa-ui-kit not installed; LayoutBase not imported
  - **Verifies:** AC1 — P0 mandatory siesa-ui-kit LayoutBase used

- **Test:** `AC1 — __root.tsx: LayoutBase shell > should define a Clientes navigation item`
  - **Status:** RED — navigationItems not defined in __root.tsx
  - **Verifies:** AC1 — Clientes entry in navigation items array

- **Test:** `AC1 — __root.tsx: LayoutBase shell > should define a Contactos navigation item`
  - **Status:** RED — navigationItems not defined in __root.tsx
  - **Verifies:** AC1 — Contactos entry in navigation items array

- **Test:** `AC1 — __root.tsx: LayoutBase shell > should use useRouterState to determine the active route`
  - **Status:** RED — useRouterState not used in __root.tsx
  - **Verifies:** AC4 — Active route detection using TanStack Router state

- **Test:** `AC1 — __root.tsx: LayoutBase shell > should pass productName="Siesa Agents"`
  - **Status:** RED — productName prop not set
  - **Verifies:** AC1 — Navbar product name correctly set

- **Test:** `AC1 — __root.tsx: LayoutBase shell > should import Outlet from @tanstack/react-router`
  - **Status:** RED — Outlet not imported in updated __root.tsx (current version has minimal outlet)
  - **Verifies:** AC1 — Child routes render inside shell

- **Test:** `AC1 — __root.tsx: LayoutBase shell > should include the active flag computation`
  - **Status:** RED — active flag based on pathname not implemented
  - **Verifies:** AC4 — Active flag computed from current pathname

- **Test:** `AC3 — Deep linking > should have a route file for /clientes`
  - **Status:** RED — src/routes/_app/clientes.tsx does not exist
  - **Verifies:** AC3 — Clientes route file exists (enables deep linking)

- **Test:** `AC3 — Deep linking > should have a route file for /contactos`
  - **Status:** RED — src/routes/_app/contactos.tsx does not exist
  - **Verifies:** AC3 — Contactos route file exists (enables deep linking)

- **Test:** `AC3 — Deep linking > should render a page title "Clientes" in the Clientes view`
  - **Status:** RED — Route file missing
  - **Verifies:** AC3 — Clientes view content

- **Test:** `AC3 — Deep linking > should render a page title "Contactos" in the Contactos view`
  - **Status:** RED — Route file missing
  - **Verifies:** AC3 — Contactos view content

- **Test:** `AC3 — Deep linking > should export Route in the Clientes route file`
  - **Status:** RED — Route file missing
  - **Verifies:** AC3 — TanStack Router convention for route discovery

- **Test:** `AC3 — Deep linking > should export Route in the Contactos route file`
  - **Status:** RED — Route file missing
  - **Verifies:** AC3 — TanStack Router convention for route discovery

- **Test:** `AC5 — 404 not-found view > should have a catch-all 404 route file ($.tsx)`
  - **Status:** RED — src/routes/$.tsx does not exist
  - **Verifies:** AC5 — Catch-all route handles unknown paths

- **Test:** `AC5 — 404 not-found view > should display "Página no encontrada" text`
  - **Status:** RED — 404 route file missing
  - **Verifies:** AC5 — Spanish error message in 404 view

- **Test:** `AC5 — 404 not-found view > should include a link to /clientes in the 404 view`
  - **Status:** RED — 404 route file missing
  - **Verifies:** AC5 — "Ir a Clientes" link in 404 view

- **Test:** `AC5 — 404 not-found view > should have data-testid="not-found-view"`
  - **Status:** RED — 404 route file missing
  - **Verifies:** AC5 — Stable E2E selector on 404 container

- **Test:** `AC5 — 404 not-found view > should have data-testid="not-found-back-link"`
  - **Status:** RED — 404 route file missing
  - **Verifies:** AC5 — Stable E2E selector on back link

- **Test:** `AC6 — Index route > should have an index route file at src/routes/index.tsx`
  - **Status:** RED — src/routes/index.tsx does not exist
  - **Verifies:** AC6 — Index route file for / redirect

- **Test:** `AC6 — Index route > should use redirect() from @tanstack/react-router`
  - **Status:** RED — Index route file missing
  - **Verifies:** AC6 — TanStack Router redirect pattern used

- **Test:** `AC6 — Index route > should redirect to /clientes in index.tsx`
  - **Status:** RED — Index route file missing
  - **Verifies:** AC6 — Redirect target is /clientes

- **Test:** `AC6 — Index route > should use beforeLoad hook for the redirect`
  - **Status:** RED — Index route file missing
  - **Verifies:** AC6 — TanStack Router redirect in beforeLoad lifecycle

- **Test:** `Accessibility > should have aria-current="page" pattern in __root.tsx`
  - **Status:** RED — aria-current not set in current __root.tsx
  - **Verifies:** AC4 + WCAG — Active nav item announced to screen readers

- **Test:** `Accessibility > should have accessible labels for icon-only navigation items`
  - **Status:** RED — aria-label not set in current __root.tsx
  - **Verifies:** AC1 + WCAG — Icon-only rail items have text alternatives

---

## Data Factories Created

No data factories required for this story. The navigation shell has no backend API calls — it is a pure frontend routing/layout concern with no dynamic data.

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures that navigate to `/clientes` and `/contactos` respectively. These can be used directly in future navigation tests if needed.

No additional fixtures are created for this story — the navigation tests manage their own `page.goto()` calls directly.

---

## Mock Requirements

No API mocking required for this story. The navigation shell is entirely frontend-side (TanStack Router + siesa-ui-kit LayoutBase) with no backend API calls.

---

## Required data-testid Attributes

### Navigation Shell (`__root.tsx`)

- `navigation-rail` — The desktop NavigationRail container (visible at ≥1024px)
- `nav-item-clientes` — The "Clientes" entry in the navigation (both rail and mobile bar)
- `nav-item-contactos` — The "Contactos" entry in the navigation (both rail and mobile bar)
- `navigation-bar-mobile` — The mobile NavigationBar container (visible at <1024px)

**Implementation Note:** If using `siesa-ui-kit LayoutBase`, check if `LayoutBase` already renders these data attributes. If not, wrap navigation items or pass `data-testid` via props. If LayoutBase is not available (fallback), add directly to custom `<nav>` elements.

### Clientes View (`src/routes/_app/clientes.tsx`)

- `clientes-page-title` — The `<h1>` or page title element in the Clientes placeholder view

**Implementation Example:**
```tsx
<h1 data-testid="clientes-page-title" className="text-2xl font-bold text-slate-800">
  Clientes
</h1>
```

### Contactos View (`src/routes/_app/contactos.tsx`)

- `contactos-page-title` — The `<h1>` or page title element in the Contactos placeholder view

**Implementation Example:**
```tsx
<h1 data-testid="contactos-page-title" className="text-2xl font-bold text-slate-800">
  Contactos
</h1>
```

### 404 Not-Found View (`src/routes/$.tsx`)

- `not-found-view` — The root container of the 404 view
- `not-found-message` — The "Página no encontrada" message paragraph
- `not-found-back-link` — The "Ir a Clientes" link/button element

**Implementation Example:**
```tsx
<div data-testid="not-found-view" className="flex flex-col items-center justify-center h-full gap-4">
  <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
  <p data-testid="not-found-message" className="text-slate-500">La ruta solicitada no existe.</p>
  <a data-testid="not-found-back-link" href="/clientes" className="text-[#0e79fd] underline">
    Ir a Clientes
  </a>
</div>
```

---

## Implementation Checklist

### Test: AC1 + AC4 — Desktop NavigationRail with active state

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC1 section) + `frontend/src/__tests__/navigation/navigation-shell.test.tsx` (AC1 section)

**Tasks to make these tests pass:**

- [ ] Install `siesa-ui-kit`: `pnpm --dir frontend add siesa-ui-kit`
- [ ] Install Heroicons: `pnpm --dir frontend add @heroicons/react`
- [ ] Update `frontend/src/routes/__root.tsx` to import and use `LayoutBase` from `siesa-ui-kit`
- [ ] Add `useRouterState` from `@tanstack/react-router` to get current pathname
- [ ] Define `navigationItems` array with Clientes and Contactos entries (with `active` flag based on `pathname.startsWith`)
- [ ] Pass `productName="Siesa Agents"` to `LayoutBase`
- [ ] Ensure `<Outlet />` is rendered inside `LayoutBase`'s content area
- [ ] Add `data-testid="navigation-rail"` to the NavigationRail container
- [ ] Add `data-testid="nav-item-clientes"` to the Clientes nav item
- [ ] Add `data-testid="nav-item-contactos"` to the Contactos nav item
- [ ] Set `aria-current="page"` on the currently active nav item
- [ ] Add `aria-label` to icon-only nav items for accessibility
- [ ] Run test: `pnpm --dir frontend test -- navigation-shell`
- [ ] ✅ Component tests pass (green phase)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ E2E AC1 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Mobile NavigationBar responsive behavior

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC2 section)

**Tasks to make these tests pass:**

- [ ] Verify `LayoutBase` from `siesa-ui-kit` handles mobile responsively out of the box (< 1024px shows NavigationBar)
- [ ] If LayoutBase handles responsiveness automatically: add `data-testid="navigation-bar-mobile"` to the mobile bar
- [ ] Verify `data-testid="navigation-rail"` is hidden via CSS at mobile viewport (not `display:none` manually needed if LayoutBase handles it)
- [ ] Ensure `nav-item-clientes` and `nav-item-contactos` are also rendered in the mobile nav (LayoutBase may use same items)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ E2E AC2 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — Deep linking: /clientes and /contactos route files

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC3 section) + `frontend/src/__tests__/navigation/navigation-shell.test.tsx` (AC3 section)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route
- [ ] Create `frontend/src/routes/_app/` directory
- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `createFileRoute('/_app/clientes')`, component renders `<h1 data-testid="clientes-page-title">Clientes</h1>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `createFileRoute('/_app/contactos')`, component renders `<h1 data-testid="contactos-page-title">Contactos</h1>`
- [ ] Confirm TanStack Router Vite plugin regenerates `routeTree.gen.ts` with new routes
- [ ] Run test: `pnpm --dir frontend test -- navigation-shell`
- [ ] ✅ Component tests for AC3 pass (green phase)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ E2E AC3 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — 404 not-found view

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC5 section) + `frontend/src/__tests__/navigation/navigation-shell.test.tsx` (AC5 section)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/$.tsx` — TanStack Router catch-all route
- [ ] Implement `NotFoundView` component with:
  - `data-testid="not-found-view"` on root `<div>`
  - `<h1>` with "Página no encontrada"
  - `<p data-testid="not-found-message">La ruta solicitada no existe.</p>`
  - `<a data-testid="not-found-back-link" href="/clientes">Ir a Clientes</a>`
- [ ] Run test: `pnpm --dir frontend test -- navigation-shell`
- [ ] ✅ Component tests for AC5 pass (green phase)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"`
- [ ] ✅ E2E AC5 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC6 — Root / redirect to /clientes

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC6 section) + `frontend/src/__tests__/navigation/navigation-shell.test.tsx` (AC6 section)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/index.tsx` with:
  ```typescript
  export const Route = createFileRoute('/')({
    beforeLoad: () => { throw redirect({ to: '/clientes' }) },
  })
  ```
- [ ] Import `createFileRoute` and `redirect` from `@tanstack/react-router`
- [ ] Run test: `pnpm --dir frontend test -- navigation-shell`
- [ ] ✅ Component tests for AC6 pass (green phase)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"`
- [ ] ✅ E2E AC6 test passes (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all E2E failing tests for this story
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests by AC group
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Debug specific E2E test
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run all component/unit tests for this story
pnpm --dir frontend test

# Run only navigation unit tests
pnpm --dir frontend test -- src/__tests__/navigation/navigation-shell.test.tsx

# Run full E2E suite (all stories)
pnpm exec playwright test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All E2E tests written and failing (19 tests — navigation-shell.spec.ts)
- All component/unit tests written and failing (24 tests — navigation-shell.test.tsx)
- No data factories needed (pure frontend routing)
- Mock requirements: none (no API calls)
- data-testid requirements: documented above
- Implementation checklist: created with tasks per AC

**Verification:**

- All tests run and fail as expected
- E2E failures are due to missing LayoutBase integration, route files, and data-testid attributes
- Unit test failures are due to missing route files and updated __root.tsx

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with AC6** (simplest — creates `index.tsx` redirect, 15 min)
2. **Continue with AC5** (creates `$.tsx` with 404 view, 30 min)
3. **Continue with AC3** (creates route files for `/clientes` and `/contactos`, 1 hour)
4. **Continue with AC1** (installs siesa-ui-kit, updates `__root.tsx`, 2 hours)
5. **Continue with AC4** (active state — covered by AC1 implementation, no extra work)
6. **Finish with AC2** (mobile responsiveness — verify LayoutBase handles it, 1 hour)

**Key Principles:**

- One AC at a time (don't try to fix all at once)
- Run tests after each AC implementation to verify green
- Check siesa-ui-kit LayoutBase API first — if `LayoutBase` is unavailable, use fallback custom nav (`<nav>` with `<NavLink>`) and document in Completion Notes

**Progress Tracking:**

- Check off tasks in implementation checklist as you complete them
- Mark story as IN PROGRESS in sprint-status.yaml

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 43 tests pass (19 E2E + 24 unit)
2. Review __root.tsx for readability — extract `navigationItems` array to a constant
3. Ensure Heroicons are consistently used across nav items
4. Verify responsive breakpoints match LayoutBase documentation
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
3. Begin implementation using the checklist — start with AC6 (simplest)
4. Work one AC at a time (red → green for each AC group)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Existing `base.fixture.ts` pattern referenced for navigation fixtures
- **network-first.md** — `page.waitForResponse` used BEFORE `page.goto()` in AC6 redirect test
- **selector-resilience.md** — `data-testid` selectors used exclusively for all test locators
- **test-quality.md** — One assertion per test, Given-When-Then structure, atomic tests
- **component-tdd.md** — Source inspection pattern (readFileSync) used for unit tests instead of DOM rendering (avoids TanStack Router provider setup complexity)
- **test-levels-framework.md** — E2E for user journeys (AC1-AC6), Unit/Source for structural contracts (file existence, imports, required attributes)

---

## Test Execution Evidence

### Expected Initial Run (RED Phase)

**Command:** `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results:**

```
FAILED e2e/tests/navigation/navigation-shell.spec.ts > AC6 — Root path redirect > should redirect from / to /clientes automatically
  Expected URL to be "/clientes" but got "/"

FAILED e2e/tests/navigation/navigation-shell.spec.ts > AC1 — Desktop navigation rail > should display the navigation rail on desktop viewport
  Locator: getByTestId('navigation-rail')
  Error: Timed out waiting for [data-testid="navigation-rail"] to be visible

FAILED e2e/tests/navigation/navigation-shell.spec.ts > AC3 — Deep linking > should render the Clientes view when navigating directly to /clientes
  Locator: getByTestId('clientes-page-title')
  Error: Timed out waiting for [data-testid="clientes-page-title"] to be visible

FAILED e2e/tests/navigation/navigation-shell.spec.ts > AC4 — Active navigation item state > should mark the Clientes item as active when on /clientes
  Locator: getByTestId('nav-item-clientes')
  Error: Timed out waiting for [data-testid="nav-item-clientes"]

FAILED e2e/tests/navigation/navigation-shell.spec.ts > AC5 — 404 not-found view > should display a 404 not-found view when navigating to an unknown route
  Locator: getByTestId('not-found-view')
  Error: Timed out waiting for [data-testid="not-found-view"] to be visible
```

**Command:** `pnpm --dir frontend test`

**Expected Results:**

```
FAIL src/__tests__/navigation/navigation-shell.test.tsx
  AC1 — __root.tsx: LayoutBase shell
    × should import LayoutBase from siesa-ui-kit → AssertionError: expected false to be true
    × should define a Clientes navigation item → AssertionError: expected content not to include 'LayoutBase'

  AC3 — Deep linking: route files exist
    × should have a route file for /clientes → AssertionError: expected false to be true
    × should have a route file for /contactos → AssertionError: expected false to be true

  AC5 — 404 not-found view
    × should have a catch-all 404 route file ($.tsx) → AssertionError: expected false to be true

  AC6 — Index route redirects to /clientes
    × should have an index route file at src/routes/index.tsx → AssertionError: expected false to be true
```

**Summary:**

- E2E tests: 19 tests — all FAILING (expected)
- Unit tests: 24 tests — all FAILING (expected)
- Status: RED phase verified

---

## Notes

- The `siesa-ui-kit` package is P0 mandatory per company standards. If `LayoutBase` is not available in the installed version, use the documented fallback (custom `<nav>` with `<NavLink>`) and document in story Completion Notes.
- The `LayoutBase` component from `siesa-ui-kit` is expected to handle responsive behavior (NavigationRail on desktop vs NavigationBar on mobile) out of the box. The E2E tests for AC2 verify this at the test level regardless of implementation approach.
- This story's views (`/clientes`, `/contactos`) are intentionally minimal placeholders — full implementation is in Epic 2 and Epic 3.
- The `routeTree.gen.ts` file is auto-generated by the TanStack Router Vite plugin when route files are added. No manual changes to `routeTree.gen.ts` are needed.

---

**Generated by BMad TEA Agent** — 2026-05-25
