# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-11
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Story 1.2 implements the persistent navigation shell for the Siesa Agents CRM frontend. The shell provides a NavigationRail on desktop (>= 1024px) and a NavigationBar at the bottom on mobile (< 1024px), using `siesa-ui-kit` components and TanStack Router file-based routing with the `_app.tsx` pathless layout pattern.

**As a** user,
**I want** a persistent navigation structure to access the Clientes and Contactos sections,
**So that** I can move between sections without full page reloads from any device.

---

## Acceptance Criteria

1. **AC1** — Given desktop browser (>= 1024px), the `NavigationRail` is visible on the left with "Clientes" and "Contactos" entries; clicking either navigates via client-side routing (no full page reload) — FR28.
2. **AC2** — Given mobile viewport (width < 1024px), the `NavigationBar` is displayed at the bottom with all items accessible and tappable — FR29.
3. **AC3** — Given direct URL access to `/clientes` or `/contactos`, the correct view is rendered and the corresponding navigation entry is highlighted as active — FR30.
4. **AC4** — Given an unknown route (e.g., `/unknown`), a 404 / not-found view is displayed gracefully with a message in Spanish.
5. **AC5** — Given the root URL `/`, the user is automatically redirected to `/clientes`.
6. **AC6** — Given any navigation entry, the active route is visually distinguished from inactive routes using the active state of the `siesa-ui-kit` navigation component.

---

## Failing Tests Created (RED Phase)

### E2E Tests (20 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (~308 lines)

- **Test:** should display the NavigationRail on the left side on desktop
  - **Status:** RED - `[data-testid="navigation-rail"]` not found (component not implemented)
  - **Verifies:** AC1 — NavigationRail is visible on desktop

- **Test:** should display "Clientes" navigation entry in the NavigationRail
  - **Status:** RED - `[data-testid="nav-item-clientes"]` not found
  - **Verifies:** AC1 — Clientes nav entry exists

- **Test:** should display "Contactos" navigation entry in the NavigationRail
  - **Status:** RED - `[data-testid="nav-item-contactos"]` not found
  - **Verifies:** AC1 — Contactos nav entry exists

- **Test:** should navigate to /clientes without full page reload when clicking the Clientes entry
  - **Status:** RED - nav item not found, navigation not triggered
  - **Verifies:** AC1 — Client-side routing (no full page reload)

- **Test:** should navigate to /contactos without full page reload when clicking the Contactos entry
  - **Status:** RED - nav item not found, navigation not triggered
  - **Verifies:** AC1 — Client-side routing (no full page reload)

- **Test:** should display the NavigationBar at the bottom on mobile viewport
  - **Status:** RED - `[data-testid="navigation-bar"]` not found
  - **Verifies:** AC2 — NavigationBar on mobile

- **Test:** should NOT display the NavigationRail on mobile viewport
  - **Status:** RED - NavigationRail hidden state not implemented
  - **Verifies:** AC2 — NavigationRail hidden on mobile

- **Test:** should display the Clientes navigation item in the NavigationBar on mobile
  - **Status:** RED - mobile nav item not rendered
  - **Verifies:** AC2 — Clientes tappable on mobile

- **Test:** should display the Contactos navigation item in the NavigationBar on mobile
  - **Status:** RED - mobile nav item not rendered
  - **Verifies:** AC2 — Contactos tappable on mobile

- **Test:** should render the Clientes view when navigating directly to /clientes
  - **Status:** RED - `[data-testid="clientes-view"]` not found
  - **Verifies:** AC3 — Deep link to /clientes renders correct view

- **Test:** should render the Contactos view when navigating directly to /contactos
  - **Status:** RED - `[data-testid="contactos-view"]` not found
  - **Verifies:** AC3 — Deep link to /contactos renders correct view

- **Test:** should highlight the Clientes nav entry as active when /clientes is the current URL
  - **Status:** RED - `data-active="true"` attribute not implemented
  - **Verifies:** AC3 — Active state on /clientes

- **Test:** should highlight the Contactos nav entry as active when /contactos is the current URL
  - **Status:** RED - `data-active="true"` attribute not implemented
  - **Verifies:** AC3 — Active state on /contactos

- **Test:** should display a 404 not-found view when navigating to an unknown route
  - **Status:** RED - `[data-testid="not-found-view"]` not found
  - **Verifies:** AC4 — 404 view for unknown routes

- **Test:** should display the 404 message in Spanish
  - **Status:** RED - "Página no encontrada" text not present
  - **Verifies:** AC4 — Spanish 404 message

- **Test:** should provide a link back to /clientes from the 404 view
  - **Status:** RED - `[data-testid="not-found-back-link"]` not found
  - **Verifies:** AC4 — Back link from 404

- **Test:** should redirect from / to /clientes automatically
  - **Status:** RED - no redirect in index.tsx
  - **Verifies:** AC5 — Root URL redirect

- **Test:** should show the Clientes view content after the redirect from /
  - **Status:** RED - redirect not implemented
  - **Verifies:** AC5 — Clientes view after redirect

- **Test:** should mark Clientes as active and Contactos as inactive when on /clientes
  - **Status:** RED - active state not implemented
  - **Verifies:** AC6 — Active/inactive visual distinction

- **Test:** should mark Contactos as active and Clientes as inactive when on /contactos
  - **Status:** RED - active state not implemented
  - **Verifies:** AC6 — Active/inactive visual distinction

**File:** `e2e/tests/navigation/navigation-shell-edge.spec.ts` (~157 lines)

- **Test:** should show NavigationRail and hide NavigationBar at exactly 1024px viewport width
  - **Status:** RED - breakpoint not implemented
  - **Verifies:** AC1+AC2 — Breakpoint boundary at 1024px

- **Test:** should show NavigationBar and hide NavigationRail at 1023px viewport width
  - **Status:** RED - breakpoint not implemented
  - **Verifies:** AC1+AC2 — Breakpoint boundary below 1024px

- **Test:** should allow keyboard navigation to the Clientes nav item
  - **Status:** RED - nav item not implemented
  - **Verifies:** Accessibility — Keyboard navigation (WCAG 2.1 AA)

- **Test:** should allow keyboard navigation to the Contactos nav item
  - **Status:** RED - nav item not implemented
  - **Verifies:** Accessibility — Keyboard navigation (WCAG 2.1 AA)

- **Test:** should navigate to /contactos when pressing Enter on the Contactos nav item
  - **Status:** RED - keyboard activation not implemented
  - **Verifies:** Accessibility — Enter key navigation

- **Test:** should have a navigation landmark role on the NavigationRail
  - **Status:** RED - NavigationRail not implemented
  - **Verifies:** Accessibility — ARIA nav landmark

- **Test:** should render both navigation entries in the DOM on /clientes
  - **Status:** RED - nav items not in DOM
  - **Verifies:** AC1 — DOM presence of nav items

- **Test:** should render the main content outlet area alongside navigation
  - **Status:** RED - `[data-testid="main-content"]` not found
  - **Verifies:** AC1 — Main content outlet rendered

- **Test:** should persist navigation shell when transitioning between /clientes and /contactos
  - **Status:** RED - shell not implemented
  - **Verifies:** AC1+AC2 — Shell persists across route transitions

### Component Tests (20 tests)

**File:** `frontend/src/routes/__tests__/navigation.test.tsx` (~257 lines)

- **Test:** should display the NavigationRail on desktop (viewport >= 1024px)
  - **Status:** RED - component file `_app.tsx` does not exist
  - **Verifies:** AC1 — NavigationRail on desktop

- **Test:** should display "Clientes" navigation entry in the NavigationRail
  - **Status:** RED - component not implemented
  - **Verifies:** AC1 — Clientes nav entry text

- **Test:** should display "Contactos" navigation entry in the NavigationRail
  - **Status:** RED - component not implemented
  - **Verifies:** AC1 — Contactos nav entry text

- **Test:** should NOT display the NavigationBar on desktop viewport
  - **Status:** RED - CSS toggle not implemented
  - **Verifies:** AC1 — NavigationBar hidden on desktop

- **Test:** should display the NavigationBar at the bottom on mobile viewport
  - **Status:** RED - component not implemented
  - **Verifies:** AC2 — NavigationBar on mobile

- **Test:** should NOT display the NavigationRail on mobile viewport
  - **Status:** RED - CSS toggle not implemented
  - **Verifies:** AC2 — NavigationRail hidden on mobile

- **Test:** should display tappable Clientes navigation item in the NavigationBar on mobile
  - **Status:** RED - mobile nav not implemented
  - **Verifies:** AC2 — Clientes tappable on mobile

- **Test:** should display tappable Contactos navigation item in the NavigationBar on mobile
  - **Status:** RED - mobile nav not implemented
  - **Verifies:** AC2 — Contactos tappable on mobile

- **Test:** should highlight the Clientes nav entry as active when /clientes is the current route
  - **Status:** RED - active state not implemented
  - **Verifies:** AC3 — Active state for /clientes

- **Test:** should highlight the Contactos nav entry as active when /contactos is the current route
  - **Status:** RED - active state not implemented
  - **Verifies:** AC3 — Active state for /contactos

- **Test:** should render the Clientes placeholder view when route is /clientes
  - **Status:** RED - route file `_app/clientes.tsx` does not exist
  - **Verifies:** AC3 — Clientes view rendered

- **Test:** should render the Contactos placeholder view when route is /contactos
  - **Status:** RED - route file `_app/contactos.tsx` does not exist
  - **Verifies:** AC3 — Contactos view rendered

- **Test:** should render a not-found view when an unknown route is accessed
  - **Status:** RED - `notFoundComponent` not in `__root.tsx`
  - **Verifies:** AC4 — 404 view exists

- **Test:** should display "Página no encontrada" in the 404 view
  - **Status:** RED - Spanish 404 text not implemented
  - **Verifies:** AC4 — Spanish 404 message

- **Test:** should provide a link back to /clientes from the 404 view
  - **Status:** RED - back link not implemented
  - **Verifies:** AC4 — Back link from 404

- **Test:** should redirect from / to /clientes when index route is accessed
  - **Status:** RED - redirect not in `index.tsx`
  - **Verifies:** AC5 — Root redirect

- **Test:** should render the Clientes view after the redirect from /
  - **Status:** RED - redirect not implemented
  - **Verifies:** AC5 — Clientes view after redirect

- **Test:** should mark Clientes as active and Contactos as inactive when on /clientes
  - **Status:** RED - active state not implemented
  - **Verifies:** AC6 — Active/inactive distinction

- **Test:** should mark Contactos as active and Clientes as inactive when on /contactos
  - **Status:** RED - active state not implemented
  - **Verifies:** AC6 — Active/inactive distinction

- **Test:** should have no accessibility violations in the NavigationRail on desktop
  - **Status:** RED - component not implemented
  - **Verifies:** Accessibility — axe WCAG 2.1 AA for NavigationRail

- **Test:** should have no accessibility violations in the NavigationBar on mobile
  - **Status:** RED - component not implemented
  - **Verifies:** Accessibility — axe WCAG 2.1 AA for NavigationBar

- **Test:** should have a navigation landmark role on the NavigationRail
  - **Status:** RED - nav landmark role not implemented
  - **Verifies:** Accessibility — ARIA nav role

---

## Data Factories Created

No data factories are required for Story 1.2. Navigation shell tests rely only on route navigation and DOM presence assertions. There is no backend data dependency for the navigation shell itself.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente()` and `buildContacto()` for future feature stories.

---

## Fixtures Created

No new fixtures are required for Story 1.2. Navigation tests use the default Playwright `page` fixture.

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures for convenience navigation — these can be used in future tests.

---

## Mock Requirements

No external API mocks are required for Story 1.2. The navigation shell is a pure frontend concern with no backend data dependency. TanStack Router handles client-side routing entirely in the browser.

---

## Required data-testid Attributes

### Navigation Shell (_app.tsx)

- `navigation-rail` — The `NavigationRail` siesa-ui-kit component (desktop left sidebar)
- `navigation-bar` — The `NavigationBar` siesa-ui-kit component (mobile bottom bar)
- `nav-item-clientes` — Navigation entry for the /clientes route (present in both Rail and Bar)
- `nav-item-contactos` — Navigation entry for the /contactos route (present in both Rail and Bar)
- `main-content` — The main content area wrapping the `<Outlet />`

**Active state attribute** (on nav items):
- `data-active="true"` — Applied to the nav item matching the current route
- `data-active="false"` — Applied to all non-active nav items

### Route Views

- `clientes-view` — Root element of the `/clientes` placeholder route component
- `contactos-view` — Root element of the `/contactos` placeholder route component

### 404 Not-Found View (__root.tsx notFoundComponent)

- `not-found-view` — Root container of the not-found component
- `not-found-message` — Element containing the Spanish 404 text ("Página no encontrada")
- `not-found-back-link` — Link element pointing back to `/clientes`

**Implementation Example:**

```tsx
// _app.tsx
<nav data-testid="navigation-rail" className="hidden lg:flex flex-col w-64">
  <NavigationRail>
    <Link to="/clientes" data-testid="nav-item-clientes" data-active={isActive('/clientes') ? 'true' : 'false'}>
      Clientes
    </Link>
    <Link to="/contactos" data-testid="nav-item-contactos" data-active={isActive('/contactos') ? 'true' : 'false'}>
      Contactos
    </Link>
  </NavigationRail>
</nav>

<nav data-testid="navigation-bar" className="flex lg:hidden fixed bottom-0 w-full">
  <NavigationBar>
    <Link to="/clientes" data-testid="nav-item-clientes" ...>Clientes</Link>
    <Link to="/contactos" data-testid="nav-item-contactos" ...>Contactos</Link>
  </NavigationBar>
</nav>

<main data-testid="main-content" className="flex flex-1 overflow-hidden">
  <Outlet />
</main>

// _app/clientes.tsx
<div data-testid="clientes-view">Clientes</div>

// _app/contactos.tsx
<div data-testid="contactos-view">Contactos</div>

// __root.tsx notFoundComponent
<div data-testid="not-found-view">
  <p data-testid="not-found-message">Página no encontrada</p>
  <a data-testid="not-found-back-link" href="/clientes">Volver a Clientes</a>
</div>
```

---

## Implementation Checklist

### Test: should display the NavigationRail on the left side on desktop

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app.tsx` as a TanStack Router pathless layout route
- [ ] Import `NavigationRail` from `siesa-ui-kit`
- [ ] Render `<NavigationRail>` inside a `<nav data-testid="navigation-rail">` element with `hidden lg:flex` classes
- [ ] Add required data-testid attributes: `navigation-rail`
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should display "Clientes" and "Contactos" navigation entries

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Define navigation items array: `[{ label: 'Clientes', to: '/clientes' }, { label: 'Contactos', to: '/contactos' }]`
- [ ] Render TanStack Router `<Link>` for each nav item with `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"`
- [ ] Display Spanish labels: "Clientes", "Contactos"
- [ ] Add required data-testid attributes: `nav-item-clientes`, `nav-item-contactos`
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should navigate to /clientes and /contactos without full page reload

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Use TanStack Router `<Link>` component (not `<a href>`) for nav items — ensures client-side routing
- [ ] Wire `to="/clientes"` and `to="/contactos"` on the Link components
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should display the NavigationBar at bottom on mobile / should hide NavigationRail on mobile

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Import `NavigationBar` from `siesa-ui-kit`
- [ ] Render `<NavigationBar>` inside a `<nav data-testid="navigation-bar">` element with `flex lg:hidden fixed bottom-0` classes
- [ ] Add same nav items (`nav-item-clientes`, `nav-item-contactos`) to the NavigationBar
- [ ] Add required data-testid attributes: `navigation-bar`
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --project=mobile-chrome`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should render Clientes and Contactos views on direct URL access

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app/` directory
- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `<div data-testid="clientes-view">Clientes</div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `<div data-testid="contactos-view">Contactos</div>`
- [ ] Add required data-testid attributes: `clientes-view`, `contactos-view`
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should highlight active nav entry (data-active="true")

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Use TanStack Router `useRouterState` or `Link`'s `activeProps` to detect active route
- [ ] Apply `data-active="true"` to the nav item matching the current route path
- [ ] Apply `data-active="false"` to all other nav items
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should display 404 not-found view in Spanish

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `notFoundComponent` to the root route in `frontend/src/routes/__root.tsx`
- [ ] Render a component with `data-testid="not-found-view"` as the root container
- [ ] Include `<p data-testid="not-found-message">Página no encontrada</p>`
- [ ] Include `<Link to="/clientes" data-testid="not-found-back-link">Volver a Clientes</Link>`
- [ ] Add required data-testid attributes: `not-found-view`, `not-found-message`, `not-found-back-link`
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should redirect from / to /clientes automatically

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Update `frontend/src/routes/index.tsx` to use TanStack Router `redirect` to `/clientes`
- [ ] Remove the placeholder `<h1>Siesa Agents</h1>` component from index.tsx
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should render main content outlet alongside navigation

**File:** `e2e/tests/navigation/navigation-shell-edge.spec.ts`

**Tasks to make this test pass:**

- [ ] Wrap `<Outlet />` in `_app.tsx` with `<main data-testid="main-content" className="flex flex-1 overflow-hidden">`
- [ ] Add required data-testid attributes: `main-content`
- [ ] Run test: `npx playwright test navigation-shell-edge.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: Responsive breakpoint boundary at exactly 1024px

**File:** `e2e/tests/navigation/navigation-shell-edge.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify TailwindCSS v4 `lg:` breakpoint is set to exactly `1024px` in config
- [ ] Ensure `hidden lg:flex` applies to NavigationRail (visible at >= 1024px, hidden below)
- [ ] Ensure `flex lg:hidden` applies to NavigationBar (visible below 1024px, hidden above)
- [ ] Run test: `npx playwright test navigation-shell-edge.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: Accessibility — keyboard navigation and ARIA landmark

**File:** `e2e/tests/navigation/navigation-shell-edge.spec.ts`

**Tasks to make this test pass:**

- [ ] Use `<nav>` element (or `role="navigation"`) for NavigationRail container
- [ ] Ensure nav items are focusable via Tab and activatable via Enter key
- [ ] Use TanStack Router `<Link>` which renders as `<a>` — natively focusable
- [ ] Run test: `npx playwright test navigation-shell-edge.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all E2E navigation tests
npx playwright test e2e/tests/navigation/ --project=chromium

# Run main navigation spec
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium

# Run edge case spec
npx playwright test e2e/tests/navigation/navigation-shell-edge.spec.ts --project=chromium

# Run on mobile viewport
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=mobile-chrome

# Run in headed mode (see browser)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium --headed

# Debug specific test
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium --debug

# Run component tests (Vitest + RTL)
cd frontend && pnpm test src/routes/__tests__/navigation.test.tsx

# Run all component tests
cd frontend && pnpm test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All E2E tests written and failing (29 tests in 2 files)
- All Component tests written and failing (22 tests in 1 file)
- No data factories needed (pure frontend navigation)
- No fixtures needed (default Playwright fixtures sufficient)
- No external service mocks needed
- data-testid requirements listed and documented
- Implementation checklist created with clear tasks

**Verification:**

- All tests run and fail as expected (missing implementation files)
- E2E tests fail with: "Locator not found" errors for `[data-testid="navigation-rail"]`, `[data-testid="nav-item-clientes"]`, etc.
- Component tests fail with: elements not found in DOM (components not yet created)
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with Task 1 in story)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order (per story tasks):**

1. Create `_app.tsx` with NavigationRail → passes AC1 desktop tests
2. Add NavigationBar to `_app.tsx` → passes AC2 mobile tests
3. Create `_app/clientes.tsx` and `_app/contactos.tsx` → passes AC3 view tests
4. Add `data-active` attribute to nav items → passes AC3+AC6 active state tests
5. Update `index.tsx` with redirect → passes AC5 redirect tests
6. Add `notFoundComponent` to `__root.tsx` → passes AC4 404 tests
7. Add `data-testid="main-content"` to outlet wrapper → passes structural integrity tests

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Extract navigation items array to a constants file if reused
3. Ensure siesa-ui-kit active state styling uses brand color `#0e79fd` (Siesa Blue)
4. Add Heroicons per company standards for nav item icons
5. Ensure TypeScript strict mode — no `any` types
6. Run tests after each refactor step to maintain green

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/navigation/`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Network-first route interception applied: `page.waitForResponse()` and `page.waitForURL()` registered BEFORE `page.goto()`
- **selector-resilience.md** — Selector hierarchy followed: `data-testid` selectors used exclusively; no CSS class selectors
- **test-quality.md** — Given-When-Then structure applied to all tests; one assertion per test (atomic)
- **component-tdd.md** — Component tests use `document.querySelector` for DOM presence assertions matching RED phase
- **test-levels-framework.md** — E2E for user-facing acceptance criteria (navigation journeys); Component for UI behavior verification (viewport, active state, accessibility)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/navigation/ --project=chromium`

**Expected Results:**

```
FAILED e2e/tests/navigation/navigation-shell.spec.ts
  AC1 — Desktop NavigationRail with Clientes and Contactos
    × should display the NavigationRail on the left side on desktop
      Error: Locator [data-testid="navigation-rail"] not found
    × should display "Clientes" navigation entry in the NavigationRail
      Error: Locator [data-testid="nav-item-clientes"] not found
    ... (all tests fail similarly)

FAILED e2e/tests/navigation/navigation-shell-edge.spec.ts
  Responsive breakpoint boundary at 1024px
    × should show NavigationRail and hide NavigationBar at exactly 1024px viewport width
      Error: Locator [data-testid="navigation-rail"] not found
    ...

Total: 29 failed, 0 passed
```

**Command:** `cd frontend && pnpm test src/routes/__tests__/navigation.test.tsx`

**Expected Results:**

```
FAIL frontend/src/routes/__tests__/navigation.test.tsx
  AC1 — Desktop NavigationRail with Clientes and Contactos
    × should display the NavigationRail on desktop (viewport >= 1024px)
      AssertionError: expected null to be truthy
    ...
Total: 22 failed, 0 passed
```

**Summary:**

- Total E2E tests: 29
- Passing: 0 (expected)
- Failing: 29 (expected)
- Total Component tests: 22
- Passing: 0 (expected)
- Failing: 22 (expected)
- Status: RED phase verified

---

## Notes

- Story 1.2 is a pure frontend story — no backend changes required
- `siesa-ui-kit` is already installed (Story 1.1 dependency)
- TanStack Router vite plugin auto-generates `routeTree.gen.ts` on file save — do NOT manually edit it
- The `_` prefix in `_app.tsx` creates a pathless layout (no URL segment) — child routes at `/clientes` and `/contactos` inherit the shell automatically
- TailwindCSS v4 default `lg:` breakpoint is `1024px` — matches AC1/AC2 requirement
- `jest-axe` must be installed: `cd frontend && pnpm add -D jest-axe @types/jest-axe` for axe accessibility tests in Vitest

---

**Generated by BMad TEA Agent** - 2026-06-11
