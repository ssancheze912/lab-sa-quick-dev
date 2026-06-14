# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-14
**Author:** SiesaTeam
**Primary Test Level:** E2E

---

## Story Summary

This story implements the persistent navigation shell for the Siesa Agents CRM application. Users need a navigation structure that allows moving between Clientes and Contactos sections without full page reloads on both desktop and mobile devices.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — NavigationRail (siesa-ui-kit) visible on the left side (72px icon-only collapsed) with "Clientes" and "Contactos" entries on desktop viewport >= 1024px
2. **AC2** — Clicking "Clientes" in NavigationRail navigates to `/clientes` without full page reload and "Clientes" renders in active state
3. **AC3** — Clicking "Contactos" in NavigationRail navigates to `/contactos` without full page reload and "Contactos" renders in active state
4. **AC4** — NavigationBar displayed at bottom on mobile viewport < 1024px, all nav items visible and tappable with touch targets >= 44px
5. **AC5** — Direct URL `/clientes` renders Clientes view and marks "Clientes" active in nav; no redirect
6. **AC6** — Direct URL `/contactos` renders Contactos view and marks "Contactos" active in nav; no redirect
7. **AC7** — Unknown route shows 404 view in Spanish with heading "Página no encontrada" and link back to `/clientes`
8. **AC8** — Root path `/` redirects automatically to `/clientes`

---

## Failing Tests Created (RED Phase)

### E2E Tests (23 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**AC1 — NavigationRail on desktop viewport (4 tests)**

- **Test:** `should display the NavigationRail on the left side when viewport is >= 1024px`
  - **Status:** RED - `navigation-rail` data-testid not found (element does not exist yet)
  - **Verifies:** NavigationRail element is visible on desktop

- **Test:** `should render the "Clientes" entry in the NavigationRail on desktop`
  - **Status:** RED - `nav-item-clientes` data-testid not found
  - **Verifies:** Clientes nav item present in rail

- **Test:** `should render the "Contactos" entry in the NavigationRail on desktop`
  - **Status:** RED - `nav-item-contactos` data-testid not found
  - **Verifies:** Contactos nav item present in rail

- **Test:** `should NOT display the NavigationBar on desktop viewport`
  - **Status:** RED - `navigation-bar` data-testid not found
  - **Verifies:** Mobile nav is hidden on desktop

**AC2 — SPA navigation to /clientes (2 tests)**

- **Test:** `should navigate to /clientes without a full page reload when clicking Clientes`
  - **Status:** RED - `nav-item-clientes` not found; can't click
  - **Verifies:** No full page reload on SPA navigation

- **Test:** `should render the "Clientes" nav item in its active state after clicking`
  - **Status:** RED - `nav-item-clientes` missing `data-active="true"` attribute
  - **Verifies:** Active state attribute applied after navigation

**AC3 — SPA navigation to /contactos (2 tests)**

- **Test:** `should navigate to /contactos without a full page reload when clicking Contactos`
  - **Status:** RED - `nav-item-contactos` not found
  - **Verifies:** No full page reload on SPA navigation to /contactos

- **Test:** `should render the "Contactos" nav item in its active state after clicking`
  - **Status:** RED - `nav-item-contactos` missing `data-active="true"` attribute
  - **Verifies:** Active state applied to Contactos nav item

**AC4 — NavigationBar on mobile viewport (5 tests)**

- **Test:** `should display the NavigationBar at the bottom on mobile viewport (< 1024px)`
  - **Status:** RED - `navigation-bar` not found
  - **Verifies:** NavigationBar visible on mobile

- **Test:** `should NOT display the NavigationRail on mobile viewport`
  - **Status:** RED - `navigation-rail` not found to assert hidden
  - **Verifies:** NavigationRail hidden on mobile

- **Test:** `should show "Clientes" navigation item in the NavigationBar on mobile`
  - **Status:** RED - `nav-bar-item-clientes` not found
  - **Verifies:** Clientes item in mobile bar

- **Test:** `should show "Contactos" navigation item in the NavigationBar on mobile`
  - **Status:** RED - `nav-bar-item-contactos` not found
  - **Verifies:** Contactos item in mobile bar

- **Test:** `should have NavigationBar items with touch targets >= 44px on mobile`
  - **Status:** RED - `nav-bar-item-clientes` not found
  - **Verifies:** WCAG 2.1 AA touch target compliance

**AC5 — Deep linking to /clientes (3 tests)**

- **Test:** `should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED - `clientes-view` data-testid not found
  - **Verifies:** Clientes route renders placeholder view

- **Test:** `should NOT redirect away from /clientes when navigating directly to it`
  - **Status:** RED - URL may not stay at /clientes (no route defined)
  - **Verifies:** Deep link does not redirect

- **Test:** `should mark "Clientes" as active in the NavigationRail when on /clientes via direct URL`
  - **Status:** RED - `nav-item-clientes` missing `data-active="true"`
  - **Verifies:** Active state on deep-linked route

**AC6 — Deep linking to /contactos (3 tests)**

- **Test:** `should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED - `contactos-view` data-testid not found
  - **Verifies:** Contactos route renders placeholder view

- **Test:** `should NOT redirect away from /contactos when navigating directly to it`
  - **Status:** RED - URL may not stay at /contactos
  - **Verifies:** Deep link does not redirect

- **Test:** `should mark "Contactos" as active in the NavigationRail when on /contactos via direct URL`
  - **Status:** RED - `nav-item-contactos` missing `data-active="true"`
  - **Verifies:** Active state on deep-linked route

**AC7 — 404 not-found view (4 tests)**

- **Test:** `should display the 404 not-found view for an unknown route`
  - **Status:** RED - `not-found-view` not found
  - **Verifies:** Not-found component renders

- **Test:** `should display the Spanish heading "Página no encontrada" on the 404 view`
  - **Status:** RED - `not-found-heading` not found
  - **Verifies:** Spanish heading text

- **Test:** `should display a link that returns the user to /clientes from the 404 view`
  - **Status:** RED - `not-found-back-link` not found
  - **Verifies:** Back-link navigates to /clientes

- **Test:** `should NOT show a blank screen on the 404 view`
  - **Status:** RED - `not-found-view` not found; may show blank
  - **Verifies:** No unhandled errors on unknown route

**AC8 — Root path redirect (2 tests)**

- **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED - Index route does not redirect (currently renders a heading)
  - **Verifies:** Automatic redirect from root

- **Test:** `should render the Clientes view after the redirect from /`
  - **Status:** RED - `clientes-view` not found
  - **Verifies:** View renders after redirect

### Component Tests (13 tests)

**File:** `frontend/src/routes/__tests__/root.test.tsx` (4 tests)

- **Test:** `should render the root layout without crashing on /clientes`
  - **Status:** RED - `routeTree.gen.ts` does not exist yet
  - **Verifies:** Root layout renders without errors

- **Test:** `should render the NavigationRail data-testid element at desktop viewport`
  - **Status:** RED - NavigationRail not rendered
  - **Verifies:** NavigationRail element in DOM

- **Test:** `should render the NavigationBar data-testid element (hidden at desktop, present in DOM)`
  - **Status:** RED - NavigationBar not rendered
  - **Verifies:** NavigationBar element in DOM

- **Test:** `should render the Navbar with product name "Siesa Agents"`
  - **Status:** RED - Product name not in Navbar
  - **Verifies:** Siesa Agents product name visible

**File:** `frontend/src/routes/_app/__tests__/navigation.test.tsx` (5 tests)

- **Test:** `should render both "Clientes" and "Contactos" nav items in the NavigationRail`
  - **Status:** RED - Nav items not rendered
  - **Verifies:** Both nav items present

- **Test:** `should apply aria-label "Navegación principal" to the NavigationRail`
  - **Status:** RED - aria-label missing
  - **Verifies:** WCAG accessibility label

- **Test:** `should mark the "Clientes" nav item as active when the current route is /clientes`
  - **Status:** RED - `data-active` attribute missing
  - **Verifies:** Active state detection

- **Test:** `should NOT mark the "Contactos" nav item as active when the current route is /clientes`
  - **Status:** RED - routeTree missing
  - **Verifies:** Inactive state correct

- **Test:** `should mark the "Contactos" nav item as active when the current route is /contactos`
  - **Status:** RED - `data-active` attribute missing
  - **Verifies:** Active state on /contactos

- **Test:** `should NOT mark the "Clientes" nav item as active when the current route is /contactos`
  - **Status:** RED - routeTree missing
  - **Verifies:** Inactive state correct

- **Test:** `should trigger navigation to /contactos when the "Contactos" nav item is clicked`
  - **Status:** RED - Nav items not rendered
  - **Verifies:** Click triggers router.navigate

**File:** `frontend/src/routes/__tests__/not-found.test.tsx` (4 tests)

- **Test:** `should render the not-found view when navigating to an unknown route`
  - **Status:** RED - `not-found-view` not found
  - **Verifies:** Not-found component renders

- **Test:** `should display the Spanish heading "Página no encontrada" on the 404 view`
  - **Status:** RED - Heading text not rendered
  - **Verifies:** Spanish heading

- **Test:** `should display a back-link element with href pointing to /clientes`
  - **Status:** RED - Back-link not rendered
  - **Verifies:** Link href to /clientes

- **Test:** `should display "Volver al inicio" as the back-link text`
  - **Status:** RED - Back-link not rendered
  - **Verifies:** Spanish link text

---

## Data Factories Created

No data factories required for this story. Navigation shell tests do not interact with backend data.

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts` (pre-existing)

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page at /clientes route
  - **Cleanup:** None required (navigation only)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page at /contactos route
  - **Cleanup:** None required

---

## Mock Requirements

No external API mocking required for this story. The navigation shell only renders stub placeholder views with no data fetching.

---

## Required data-testid Attributes

### Root Layout (`__root.tsx`)

- `navigation-rail` — The NavigationRail container element (desktop, left side)
- `navigation-bar` — The NavigationBar container element (mobile, bottom)

### NavigationRail Items

- `nav-item-clientes` — Clientes navigation item in the rail (must accept `data-active="true"`)
- `nav-item-contactos` — Contactos navigation item in the rail (must accept `data-active="true"`)

### NavigationBar Items (mobile)

- `nav-bar-item-clientes` — Clientes item in the mobile NavigationBar
- `nav-bar-item-contactos` — Contactos item in the mobile NavigationBar

### Route Views

- `clientes-view` — Root element of the ClientesPlaceholder component
- `contactos-view` — Root element of the ContactosPlaceholder component

### 404 Not Found View

- `not-found-view` — Root container of the not-found component
- `not-found-heading` — The `<h1>` or heading element with "Página no encontrada"
- `not-found-back-link` — The `<Link to="/clientes">` element

**Implementation Example:**

```tsx
// NavigationRail
<nav data-testid="navigation-rail" aria-label="Navegación principal">
  <NavItem data-testid="nav-item-clientes" data-active={isActive('/clientes')}>
    Clientes
  </NavItem>
  <NavItem data-testid="nav-item-contactos" data-active={isActive('/contactos')}>
    Contactos
  </NavItem>
</nav>

// NavigationBar (mobile)
<nav data-testid="navigation-bar" aria-label="Navegación principal">
  <NavItem data-testid="nav-bar-item-clientes">Clientes</NavItem>
  <NavItem data-testid="nav-bar-item-contactos">Contactos</NavItem>
</nav>

// Clientes placeholder
<div data-testid="clientes-view">
  <h1 className="text-slate-700">Clientes</h1>
</div>

// Not found
<div data-testid="not-found-view">
  <h1 data-testid="not-found-heading">Página no encontrada</h1>
  <Link to="/clientes" data-testid="not-found-back-link">Volver al inicio</Link>
</div>
```

---

## Implementation Checklist

### Test: AC1 — NavigationRail renders on desktop

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make this test pass:**

- [ ] Update `frontend/src/routes/__root.tsx` to render `LayoutBase` from siesa-ui-kit (or custom fallback)
- [ ] Add `<nav data-testid="navigation-rail">` inside the layout for desktop
- [ ] Add `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"` to rail items
- [ ] Add `<nav data-testid="navigation-bar">` inside the layout for mobile (hidden via `lg:hidden`)
- [ ] Configure `Navbar` with `productName="Siesa Agents"`
- [ ] Run test: `pnpm playwright test navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 + AC3 — SPA navigation without page reload

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Wire NavigationRail items as TanStack Router `<Link>` components
- [ ] Add `data-active={isActive}` attribute driven by TanStack Router `useRouterState` or `Link activeProps`
- [ ] Verify TanStack Router handles navigation without triggering `page.on('load')` event
- [ ] Run test: `pnpm playwright test navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC4 — NavigationBar on mobile viewport

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `<nav data-testid="navigation-bar">` with `data-testid="nav-bar-item-clientes"` and `data-testid="nav-bar-item-contactos"` items
- [ ] Apply responsive Tailwind classes: `lg:hidden block` for NavigationBar, `hidden lg:block` for NavigationRail
- [ ] Ensure NavigationBar items have minimum height of 44px (padding or explicit height)
- [ ] Run test: `pnpm playwright test navigation-shell.spec.ts --grep "AC4" --project mobile-chrome`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 + AC6 — Deep linking

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route
- [ ] Create `frontend/src/routes/_app/clientes.tsx` rendering `<div data-testid="clientes-view"><h1>Clientes</h1></div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` rendering `<div data-testid="contactos-view"><h1>Contactos</h1></div>`
- [ ] Verify TanStack Router regenerates `routeTree.gen.ts` with new routes
- [ ] Run test: `pnpm playwright test navigation-shell.spec.ts --grep "AC5|AC6"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC7 — 404 Not Found view

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/not-found.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/not-found.tsx` or configure `notFoundComponent` on `__root.tsx`
- [ ] Render: `<div data-testid="not-found-view">`, `<h1 data-testid="not-found-heading">Página no encontrada</h1>`, `<Link to="/clientes" data-testid="not-found-back-link">Volver al inicio</Link>`
- [ ] Run test: `pnpm playwright test navigation-shell.spec.ts --grep "AC7"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC8 — Root path redirect

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Update `frontend/src/routes/index.tsx` to use `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Run test: `pnpm playwright test navigation-shell.spec.ts --grep "AC8"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Tests: Component tests (root.test.tsx, navigation.test.tsx, not-found.test.tsx)

**Files:** `frontend/src/routes/__tests__/*.test.tsx` + `frontend/src/routes/_app/__tests__/navigation.test.tsx`

**Tasks to make these tests pass:**

- [ ] Complete all E2E tasks above (component tests share the same implementation requirements)
- [ ] Ensure `routeTree.gen.ts` is regenerated by `@tanstack/router-plugin/vite` (run `pnpm --filter frontend dev` once)
- [ ] Ensure `data-active` attribute is applied via `activeProps` on TanStack Router `<Link>` components
- [ ] Ensure `aria-label="Navegación principal"` is on both NavigationRail and NavigationBar wrappers
- [ ] Run test: `pnpm --filter frontend test`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours (after E2E tasks complete)

---

## Running Tests

```bash
# Run all E2E failing tests for this story
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run E2E tests on mobile project only
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --project mobile-chrome

# Debug a specific E2E test
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component/unit tests (Vitest)
pnpm --filter frontend test

# Run component tests in watch mode
pnpm --filter frontend test -- --watch

# Run with coverage
pnpm --filter frontend test -- --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Fixtures documented
- Mock requirements documented (none for this story)
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- E2E tests fail because routes, components, and data-testid attributes do not exist
- Component tests fail because `routeTree.gen.ts` does not exist
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with AC8 — simplest)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended Order:**

1. AC8 (root redirect) — simplest, 1 file change
2. AC5 + AC6 (route files + placeholder views) — enables many other tests
3. AC1 (NavigationRail shell) — unblocks AC2, AC3, AC4
4. AC7 (not-found view)
5. Component tests — pass naturally once E2E implementation is done

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Extract navigation items array to a constant (DRY principle)
3. Verify NavigationRail and NavigationBar use consistent active state logic
4. Check for unused imports or dead code
5. Ensure tests still pass after each refactor

---

## Knowledge Base References Applied

- `network-first.md` — Route interception before navigation pattern (applied in AC1, AC5, AC6, AC8 tests)
- `selector-resilience.md` — data-testid hierarchy used exclusively; no CSS selectors
- `test-quality.md` — One assertion per test; atomic test design
- `fixture-architecture.md` — base.fixture.ts auto-cleanup pattern
- `component-tdd.md` — Vitest + React Testing Library component test pattern
- `timing-debugging.md` — `waitForURL`, `waitForLoadState` used instead of hard sleeps

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results:**

```
Running 23 tests using 4 workers
  23 failed
    [chromium] navigation-shell.spec.ts:28 - should display the NavigationRail on the left side...
    [chromium] navigation-shell.spec.ts:40 - should render the "Clientes" entry in the NavigationRail...
    ... (all 23 tests failing — expected RED phase behavior)
```

**Summary:**

- Total E2E tests: 23
- Passing: 0 (expected)
- Failing: 23 (expected)
- Total Component tests: 13
- Component tests passing: 0 (expected — routeTree.gen.ts missing)
- Status: RED phase verified

**Expected Failure Messages:**

- E2E tests: `Error: locator('[data-testid="navigation-rail"]') — waiting for locator to be visible`
- Component tests: `Cannot find module '../../routeTree.gen'`

---

## Notes

- The `routeTree.gen.ts` file is auto-generated by `@tanstack/router-plugin/vite` — it will be created once the route files are added and the Vite dev server is run. Component tests depend on this file.
- siesa-ui-kit components (`LayoutBase`, `NavigationRail`, `NavigationBar`) should be checked first. If unavailable, build minimal custom components matching the layout spec in the story Dev Notes.
- The `data-active` attribute is the contract between tests and implementation. TanStack Router's `Link` component `activeProps` is the recommended way to apply it: `activeProps={{ 'data-active': 'true' }}`.
- Story 1.1 must be complete (dev server running on port 5173) before E2E tests can be executed.
- All user-facing text must be in Spanish per project standards.

---

**Generated by BMad TEA Agent** - 2026-06-14
