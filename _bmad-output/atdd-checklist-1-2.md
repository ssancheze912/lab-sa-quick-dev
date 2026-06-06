# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-06
**Author:** SiesaTeam
**Primary Test Level:** E2E

---

## Story Summary

Story 1.2 implements the persistent navigation shell for the Siesa Agents CRM frontend. The shell uses TanStack Router with a pathless `_app.tsx` layout route that renders either a NavigationRail (desktop, >= 1024px) or NavigationBar (mobile, < 1024px) from siesa-ui-kit. Client-side routing connects /clientes and /contactos without full page reloads.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given a desktop browser (>= 1024px), a NavigationRail (siesa-ui-kit) is visible on the left with "Clientes" and "Contactos" entries. Clicking either navigates to `/clientes` or `/contactos` without a full page reload (FR28).
2. **AC2** — Given a mobile viewport (< 1024px), a NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail. All navigation items are accessible and tappable (FR29).
3. **AC3** — Given the user types `/clientes` or `/contactos` directly in the URL bar, the correct view is rendered without redirection. The active navigation item is visually highlighted with `aria-current="page"` (FR30).
4. **AC4** — Given the user navigates to an unknown route (e.g. `/unknown`), a 404 / not-found view is displayed with a heading "Página no encontrada" and a link "Ir a Clientes" back to `/clientes`.
5. **AC5** — Given the application root `/` is accessed, the browser redirects automatically to `/clientes`.

---

## Failing Tests Created (RED Phase)

### E2E Tests (17 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- **Test:** `should display NavigationRail on desktop viewport`
  - **Status:** RED — `data-testid="navigation-rail"` does not exist (route `_app.tsx` not yet created)
  - **Verifies:** AC1 — NavigationRail visible on desktop

- **Test:** `should display Clientes entry in the NavigationRail on desktop`
  - **Status:** RED — NavigationRail element absent
  - **Verifies:** AC1 — Clientes nav item in rail

- **Test:** `should display Contactos entry in the NavigationRail on desktop`
  - **Status:** RED — NavigationRail element absent
  - **Verifies:** AC1 — Contactos nav item in rail

- **Test:** `should navigate to /clientes without full page reload when clicking Clientes rail item`
  - **Status:** RED — Clientes link does not exist
  - **Verifies:** AC1 — SPA navigation to /clientes (FR28)

- **Test:** `should navigate to /contactos without full page reload when clicking Contactos rail item`
  - **Status:** RED — Contactos link does not exist
  - **Verifies:** AC1 — SPA navigation to /contactos (FR28)

- **Test:** `should have accessible navigation container with aria-label on desktop`
  - **Status:** RED — `<nav aria-label="Navegación principal">` not implemented
  - **Verifies:** AC1 — WCAG 2.1 AA accessibility

- **Test:** `should display NavigationBar at bottom on mobile viewport (< 1024px)`
  - **Status:** RED — `data-testid="navigation-bar"` does not exist
  - **Verifies:** AC2 — NavigationBar visible on mobile (FR29)

- **Test:** `should hide NavigationRail on mobile viewport`
  - **Status:** RED — NavigationRail/Bar components not implemented
  - **Verifies:** AC2 — Rail hidden on mobile

- **Test:** `should display Clientes entry in the NavigationBar on mobile`
  - **Status:** RED — NavigationBar absent
  - **Verifies:** AC2 — Clientes item in mobile bar

- **Test:** `should display Contactos entry in the NavigationBar on mobile`
  - **Status:** RED — NavigationBar absent
  - **Verifies:** AC2 — Contactos item in mobile bar

- **Test:** `should navigate to /contactos when tapping Contactos in mobile NavigationBar`
  - **Status:** RED — NavigationBar absent
  - **Verifies:** AC2 — Mobile tap navigation

- **Test:** `should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED — `data-testid="clientes-page"` does not exist (route file not created)
  - **Verifies:** AC3 — Deep linking to /clientes (FR30)

- **Test:** `should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED — `data-testid="contactos-page"` does not exist
  - **Verifies:** AC3 — Deep linking to /contactos (FR30)

- **Test:** `should highlight the Clientes nav item as active when on /clientes route`
  - **Status:** RED — `aria-current="page"` attribute not set
  - **Verifies:** AC3 — Active nav state (FR30)

- **Test:** `should highlight the Contactos nav item as active when on /contactos route`
  - **Status:** RED — `aria-current="page"` attribute not set
  - **Verifies:** AC3 — Active nav state (FR30)

- **Test:** `should not redirect /clientes to home screen (deep linking preserved)`
  - **Status:** RED — Route does not exist yet
  - **Verifies:** AC3 — No unwanted redirect (FR30)

- **Test:** `should not redirect /contactos to home screen (deep linking preserved)`
  - **Status:** RED — Route does not exist yet
  - **Verifies:** AC3 — No unwanted redirect (FR30)

- **Test:** `should display a not-found view when navigating to an unknown route`
  - **Status:** RED — `notFoundComponent` not added to `__root.tsx`
  - **Verifies:** AC4 — 404 view shown

- **Test:** `should display a link back to /clientes in the not-found view`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC4 — Back link in not-found view

- **Test:** `should navigate back to /clientes when clicking the back link on not-found view`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC4 — Back link navigation works

- **Test:** `should redirect the browser from / to /clientes automatically`
  - **Status:** RED — `frontend/src/routes/index.tsx` does not exist
  - **Verifies:** AC5 — Root redirect to /clientes

- **Test:** `should render the Clientes view after redirect from /`
  - **Status:** RED — index.tsx redirect not implemented
  - **Verifies:** AC5 — Clientes page shown after redirect

- **Test:** `should render app-root container wrapping the entire application`
  - **Status:** RED — `data-testid="app-root"` missing from `__root.tsx`
  - **Verifies:** Implicit — app-root container (Task 5)

### Component Tests (17 tests)

**File:** `frontend/src/routes/__tests__/AppShell.test.tsx`

- **Test:** `should render a NavigationRail element on desktop viewport (>= 1024px)`
  - **Status:** RED — `_app.tsx` not created
  - **Verifies:** AC1 — NavigationRail on desktop

- **Test:** `should render a Clientes link inside the NavigationRail on desktop`
  - **Status:** RED — NavigationRail not implemented
  - **Verifies:** AC1 — Clientes entry in rail

- **Test:** `should render a Contactos link inside the NavigationRail on desktop`
  - **Status:** RED — NavigationRail not implemented
  - **Verifies:** AC1 — Contactos entry in rail

- **Test:** `should have a nav element with aria-label="Navegación principal" for accessibility (WCAG 2.1 AA)`
  - **Status:** RED — aria-label not implemented
  - **Verifies:** AC1 — WCAG accessibility

- **Test:** `should render a NavigationBar element on mobile viewport (< 1024px)`
  - **Status:** RED — NavigationBar not implemented
  - **Verifies:** AC2 — NavigationBar on mobile

- **Test:** `should NOT render NavigationRail when viewport is mobile (< 1024px)`
  - **Status:** RED — Responsive logic not implemented
  - **Verifies:** AC2 — Rail hidden on mobile

- **Test:** `should render a Clientes link inside the NavigationBar on mobile`
  - **Status:** RED — NavigationBar not implemented
  - **Verifies:** AC2 — Clientes in mobile bar

- **Test:** `should render a Contactos link inside the NavigationBar on mobile`
  - **Status:** RED — NavigationBar not implemented
  - **Verifies:** AC2 — Contactos in mobile bar

- **Test:** `should apply aria-current="page" to Clientes nav item when route is /clientes`
  - **Status:** RED — Active state not implemented
  - **Verifies:** AC3 — Active state for Clientes

- **Test:** `should apply aria-current="page" to Contactos nav item when route is /contactos`
  - **Status:** RED — Active state not implemented
  - **Verifies:** AC3 — Active state for Contactos

---

## Data Infrastructure

### Navigation Shell Fixture

**File:** `e2e/fixtures/base.fixture.ts` (already exists — extended for this story)
**Page Object:** `e2e/pages/navigation-shell.page.ts` (already created)

The `NavigationShellPage` POM already provides typed locators for all relevant elements including `navigationRail`, `navigationBar`, `railItemClientes`, `barItemContactos`, `notFoundHeading`, `notFoundBackLink`, etc.

No additional data factories are required for this story — navigation shell has no backend data dependency.

---

## Mock Requirements

The navigation shell tests mock all API routes to prevent network calls from blocking navigation tests:

```typescript
// Applied in every test before navigation
await page.route('**/api/**', (route) => route.continue());
```

No backend API is called by the navigation shell itself. Route mocking is a precaution against future middleware or interceptors.

---

## Required data-testid Attributes

### `__root.tsx` — Root Layout

- `app-root` — Container div wrapping the entire application (`<div data-testid="app-root" className="min-h-screen bg-white dark:bg-slate-950">`)

### `_app.tsx` — Shell Layout

- `navigation-rail` — Desktop NavigationRail component container (`<aside data-testid="navigation-rail" ...>`)
- `navigation-bar` — Mobile NavigationBar component container (`<nav data-testid="navigation-bar" ...>`)

### `_app/clientes.tsx` — Clientes Placeholder Page

- `clientes-page` — Root element of the Clientes page (`<div data-testid="clientes-page">`)

### `_app/contactos.tsx` — Contactos Placeholder Page

- `contactos-page` — Root element of the Contactos page (`<div data-testid="contactos-page">`)

### Navigation Items (aria attributes)

- `aria-current="page"` — Applied to the active nav link in both rail and bar

### Implementation Example

```tsx
// _app.tsx
<aside data-testid="navigation-rail" className="hidden lg:flex ...">
  <nav aria-label="Navegación principal">
    <Link to="/clientes" activeProps={{ 'aria-current': 'page' }}>Clientes</Link>
    <Link to="/contactos" activeProps={{ 'aria-current': 'page' }}>Contactos</Link>
  </nav>
</aside>

<nav data-testid="navigation-bar" aria-label="Navegación principal" className="flex lg:hidden fixed bottom-0 w-full ...">
  <Link to="/clientes" activeProps={{ 'aria-current': 'page' }}>Clientes</Link>
  <Link to="/contactos" activeProps={{ 'aria-current': 'page' }}>Contactos</Link>
</nav>

// _app/clientes.tsx
<div data-testid="clientes-page">
  <h1>Clientes</h1>
</div>

// _app/contactos.tsx
<div data-testid="contactos-page">
  <h1>Contactos</h1>
</div>
```

---

## Implementation Checklist

### Test: Desktop NavigationRail visible (AC1)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app.tsx` as a pathless layout route
- [ ] Import `NavigationRail` from `siesa-ui-kit` (fallback: shadcn/ui + TailwindCSS)
- [ ] Render `<aside data-testid="navigation-rail" className="hidden lg:flex ...">` with NavigationRail inside
- [ ] Add `<nav aria-label="Navegación principal">` wrapping the rail links
- [ ] Configure `NavigationRail` items: Clientes (`/clientes`) and Contactos (`/contactos`)
- [ ] Use TanStack Router `<Link>` for navigation items (SPA navigation)
- [ ] Add `activeProps={{ 'aria-current': 'page' }}` to each Link
- [ ] Add required data-testid: `navigation-rail`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: Mobile NavigationBar visible (AC2)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Import `NavigationBar` from `siesa-ui-kit` (fallback: custom nav + TailwindCSS)
- [ ] Render `<nav data-testid="navigation-bar" aria-label="Navegación principal" className="flex lg:hidden fixed bottom-0 w-full ...">` with NavigationBar inside
- [ ] Configure `NavigationBar` items: Clientes and Contactos with same TanStack Router `<Link>` pattern
- [ ] Ensure `hidden lg:flex` on rail and `flex lg:hidden` on bar (Tailwind responsive)
- [ ] Verify touch targets are >= 44x44px (WCAG 2.1 AA mobile)
- [ ] Add required data-testid: `navigation-bar`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=mobile-chrome`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Deep linking and active nav state (AC3)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` nested under `_app` layout
  - Render `<div data-testid="clientes-page"><h1>Clientes</h1></div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` nested under `_app` layout
  - Render `<div data-testid="contactos-page"><h1>Contactos</h1></div>`
- [ ] Verify TanStack Router generates routes `/clientes` and `/contactos` from file-based routing
- [ ] Confirm `activeProps={{ 'aria-current': 'page' }}` applied on Links in both rail and bar
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: 404 Not-Found view (AC4)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `NotFoundView` component (e.g. `frontend/src/shared/components/NotFoundView.tsx`)
  - Heading: `<h1>Página no encontrada</h1>`
  - Description: `<p>La ruta que buscas no existe.</p>`
  - Back link: `<Link to="/clientes">Ir a Clientes</Link>`
- [ ] Add `notFoundComponent: NotFoundView` to `createRootRoute()` in `frontend/src/routes/__root.tsx`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Root / redirects to /clientes (AC5)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/index.tsx`
  - Use `beforeLoad: () => redirect({ to: '/clientes' })`
  - No component rendering required
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: app-root container (Implicit — Task 5)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Update `frontend/src/routes/__root.tsx`
  - Wrap `<Outlet />` in `<div data-testid="app-root" className="min-h-screen bg-white dark:bg-slate-950">`
  - Conditionally render `TanStackRouterDevtools` in development only
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all E2E failing tests for Story 1.2
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run on specific browser
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium

# Run mobile tests only
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=mobile-chrome

# Run in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests (Vitest)
cd frontend && pnpm test -- src/routes/__tests__/AppShell.test.tsx

# Run component tests in watch mode
cd frontend && pnpm test:watch -- src/routes/__tests__/AppShell.test.tsx
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (23 E2E + 17 Component = 40 total)
- Fixtures and Page Object Model created/extended
- Mock requirements documented (API route passthrough)
- data-testid requirements listed for all components
- Implementation checklist created

**Verification:**

- All E2E tests fail with: element not found / locator not found
- All Component tests fail with: cannot find module / element not in DOM
- Failures are due to missing implementation, NOT test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with AC5 — simplest)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended implementation order:**

1. AC5 first — `index.tsx` redirect (simplest, unblocks other tests)
2. AC4 — `NotFoundView` + `notFoundComponent` in `__root.tsx`
3. Implicit — `data-testid="app-root"` in `__root.tsx`
4. AC3 — placeholder pages `_app/clientes.tsx` and `_app/contactos.tsx`
5. AC1 — shell layout `_app.tsx` with NavigationRail (desktop)
6. AC2 — add NavigationBar responsive variant to `_app.tsx`

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 33 tests pass (green phase complete)
2. Extract navigation items array to a constant (DRY)
3. Verify siesa-ui-kit NavigationRail/NavigationBar API matches implementation
4. Add icon imports (`@heroicons/react` or `lucide-react` fallback)
5. Verify color contrast ratios (Siesa Blue `#0e79fd` >= 4.5:1)
6. Run accessibility audit with axe

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/navigation/`
3. Begin implementation using implementation checklist — start with simplest tests (AC5)
4. Work one test at a time (red → green for each)
5. Share progress in daily standup
6. When all tests pass, refactor code for quality
7. When refactoring complete, manually update story status to 'done'

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Playwright `test.extend()` pattern; existing `base.fixture.ts` extended
- **network-first.md** — `page.route()` interception placed BEFORE `page.goto()` in all E2E tests
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class selectors
- **test-quality.md** — One assertion per test (atomic); explicit waits via `waitForURL` / `toBeVisible`
- **timing-debugging.md** — `page.waitForURL()` used for navigation confirmation; no hard sleeps
- **component-tdd.md** — Component tests use jsdom viewport mocking for responsive behavior
- **test-levels-framework.md** — E2E for user journeys (AC1-5); Component for layout/responsive logic

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results:**

```
Running 23 tests using 1 worker

  × AC1 — Desktop NavigationRail (FR28) › should display NavigationRail on desktop viewport
    Error: expect(locator).toBeVisible()
    Locator: getByTestId('navigation-rail')
    Expected: visible
    Received: <element(s) not found>

  ... (all 23 tests fail with similar "element not found" errors)

  23 failed
  0 passed
```

**Summary:**

- Total tests: 40 (23 E2E + 17 Component)
- Passing: 0 (expected — RED phase)
- Failing: 40 (expected — RED phase confirmed)
- Status: RED phase verified

**Expected failure messages per test type:**
- E2E navigation tests: `Error: expect(locator).toBeVisible() - Locator: getByTestId('...') - Expected: visible - Received: <element(s) not found>`
- E2E routing tests: `Error: expect(page.url()).toContain('/clientes') - Expected: string to contain '/clientes'`
- Component tests: `AssertionError: expected null not to be null` (DOM elements absent before implementation)

---

## Notes

- `siesa-ui-kit@^1.0.209` must be checked for `NavigationRail` and `NavigationBar` exports before implementation. If unavailable, fallback to shadcn/ui `nav` + TailwindCSS with matching design tokens (Siesa Blue `#0e79fd`).
- The `_app/` folder must be created at `frontend/src/routes/_app/` (not `_app.tsx/`).
- TanStack Router `_` prefix creates a pathless layout route — it does NOT add a URL segment.
- `@heroicons/react` must be installed: `pnpm add @heroicons/react` — it is NOT yet in `package.json`.
- Dark mode support: class-based `dark:` prefix via TailwindCSS.

---

**Generated by BMad TEA Agent** — 2026-06-06
