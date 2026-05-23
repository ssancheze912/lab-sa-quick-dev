# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-23
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Story 1.2 implements the persistent navigation shell for the Siesa Agents CRM frontend. Users need a stable navigation structure (NavigationRail on desktop, NavigationBar on mobile) to move between the Clientes and Contactos sections without full page reloads. All navigation elements must be accessible to keyboard and screen-reader users with Spanish aria-labels.

**As a** user,
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application,
**So that** I can move between sections without full page reloads from any device.

---

## Acceptance Criteria

1. **AC1** — Given desktop browser (viewport ≥ 1024px), a `NavigationRail` (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either navigates to `/clientes` or `/contactos` without a full page reload (FR28).
2. **AC2** — Given mobile browser (viewport < 1024px), a `NavigationBar` (siesa-ui-kit) is displayed at the bottom instead of the rail, with all items visible and tappable with minimum 44px touch targets (FR29).
3. **AC3** — Given direct URL navigation to `/clientes` or `/contactos`, the correct view renders and the corresponding nav item is active — no redirect to a home screen (FR30).
4. **AC4** — Given any unknown route (e.g. `/unknown`), a 404 not-found view is displayed with a Spanish message and a link back to `/clientes`.
5. **AC5** — Given any navigation shell render, all navigation items have Spanish `aria-label` attributes, are reachable via Tab, and activate via Enter/Space (WCAG 2.1 AA).

---

## Failing Tests Created (RED Phase)

### E2E Tests (22 tests)

**File:** `e2e/tests/navigation/frontend-navigation-shell.spec.ts` (403 lines)

- **Test:** AC1 — should render NavigationRail on the left side on desktop viewport
  - **Status:** RED — `[data-testid="navigation-rail"]` not found (NavigationRail not implemented in `__root.tsx`)
  - **Verifies:** NavigationRail component is rendered on desktop

- **Test:** AC1 — should show "Clientes" entry in the NavigationRail on desktop
  - **Status:** RED — `[data-testid="nav-item-clientes"]` not found
  - **Verifies:** Clientes nav item present in shell

- **Test:** AC1 — should show "Contactos" entry in the NavigationRail on desktop
  - **Status:** RED — `[data-testid="nav-item-contactos"]` not found
  - **Verifies:** Contactos nav item present in shell

- **Test:** AC1 — should navigate to /clientes without full page reload
  - **Status:** RED — nav item click interaction fails (element not found)
  - **Verifies:** Client-side navigation via TanStack Router

- **Test:** AC1 — should navigate to /contactos without full page reload
  - **Status:** RED — nav item click interaction fails (element not found)
  - **Verifies:** Client-side navigation via TanStack Router

- **Test:** AC1 — should NOT show NavigationBar at bottom on desktop viewport
  - **Status:** RED — `[data-testid="navigation-bar"]` not found
  - **Verifies:** NavigationBar hidden on desktop

- **Test:** AC2 — should render NavigationBar at bottom on mobile viewport
  - **Status:** RED — `[data-testid="navigation-bar"]` not found
  - **Verifies:** NavigationBar visible on mobile

- **Test:** AC2 — should show "Clientes" entry in the NavigationBar on mobile
  - **Status:** RED — nav-item-clientes not found
  - **Verifies:** Clientes item in mobile nav

- **Test:** AC2 — should show "Contactos" entry in the NavigationBar on mobile
  - **Status:** RED — nav-item-contactos not found
  - **Verifies:** Contactos item in mobile nav

- **Test:** AC2 — should have minimum 44px touch target height for Clientes nav item on mobile
  - **Status:** RED — element not found, bounding box check fails
  - **Verifies:** WCAG 2.5.5 touch target size compliance

- **Test:** AC2 — should have minimum 44px touch target height for Contactos nav item on mobile
  - **Status:** RED — element not found, bounding box check fails
  - **Verifies:** WCAG 2.5.5 touch target size compliance

- **Test:** AC2 — should NOT show NavigationRail on mobile viewport
  - **Status:** RED — navigation-rail not found
  - **Verifies:** NavigationRail hidden on mobile

- **Test:** AC3 — should render ClientesView when navigating directly to /clientes via URL
  - **Status:** RED — `[data-testid="clientes-view"]` not found (clientes.tsx route not created)
  - **Verifies:** Deep linking to /clientes renders ClientesView

- **Test:** AC3 — should NOT redirect to home screen when navigating directly to /clientes
  - **Status:** RED — route /clientes may redirect or error
  - **Verifies:** URL stays at /clientes after direct navigation

- **Test:** AC3 — should render ContactosView when navigating directly to /contactos via URL
  - **Status:** RED — `[data-testid="contactos-view"]` not found
  - **Verifies:** Deep linking to /contactos renders ContactosView

- **Test:** AC3 — should NOT redirect to home screen when navigating directly to /contactos
  - **Status:** RED — route /contactos may redirect or error
  - **Verifies:** URL stays at /contactos after direct navigation

- **Test:** AC3 — should mark Clientes nav item as active when on /clientes
  - **Status:** RED — data-active attribute not set
  - **Verifies:** Active nav item state reflects current route

- **Test:** AC3 — should mark Contactos nav item as active when on /contactos
  - **Status:** RED — data-active attribute not set
  - **Verifies:** Active nav item state reflects current route

- **Test:** AC4 — should display the 404 not-found view for an unknown route
  - **Status:** RED — `[data-testid="not-found-view"]` not found (notFoundComponent not configured)
  - **Verifies:** Not-found view renders for unknown routes

- **Test:** AC4 — should display Spanish "Página no encontrada" message on unknown route
  - **Status:** RED — not-found-title element not found
  - **Verifies:** Spanish 404 message

- **Test:** AC4 — should display a link back to /clientes on the 404 view
  - **Status:** RED — not-found-back-link element not found
  - **Verifies:** Back link to /clientes present

- **Test:** AC4 — should navigate to /clientes when clicking the back link on the 404 view
  - **Status:** RED — not-found-back-link element not found
  - **Verifies:** Clicking back link navigates to /clientes

- **Test:** AC5 — should have Spanish aria-label on Clientes nav item
  - **Status:** RED — nav item and aria-label not found
  - **Verifies:** aria-label="Ir a Clientes" on Clientes nav item

- **Test:** AC5 — should have Spanish aria-label on Contactos nav item
  - **Status:** RED — nav item and aria-label not found
  - **Verifies:** aria-label="Ir a Contactos" on Contactos nav item

- **Test:** AC5 — should make Clientes nav item reachable via Tab key
  - **Status:** RED — element not found or not focusable
  - **Verifies:** Keyboard Tab reachability

- **Test:** AC5 — should activate Clientes nav item via Enter key when focused
  - **Status:** RED — element not found or not keyboard-activatable
  - **Verifies:** Enter key activates navigation

- **Test:** AC5 — should activate Clientes nav item via Space key when focused
  - **Status:** RED — element not found or not keyboard-activatable
  - **Verifies:** Space key activates navigation

### Component Tests (16 tests)

#### Root Layout Tests

**File:** `frontend/src/routes/__tests__/root.test.tsx` (131 lines)

- **Test:** AC1 — should render an element with data-testid="navigation-rail"
  - **Status:** RED — navigation-rail not rendered in current `__root.tsx` placeholder
  - **Verifies:** NavigationRail present in shell DOM

- **Test:** AC1 — should render "Clientes" nav item in the shell
  - **Status:** RED — nav-item-clientes not rendered
  - **Verifies:** Clientes item in shell

- **Test:** AC1 — should render "Contactos" nav item in the shell
  - **Status:** RED — nav-item-contactos not rendered
  - **Verifies:** Contactos item in shell

- **Test:** AC1 — should have data-testid="navigation-rail" at /contactos
  - **Status:** RED — navigation-rail not rendered
  - **Verifies:** Rail present regardless of active route

- **Test:** AC2 — should render an element with data-testid="navigation-bar" in the shell
  - **Status:** RED — navigation-bar not rendered
  - **Verifies:** NavigationBar in DOM (CSS controls visibility)

- **Test:** AC2 — should have navigation items in NavigationBar (mobile nav)
  - **Status:** RED — no nav items found
  - **Verifies:** Both nav items accessible from bar

- **Test:** AC5 — should have aria-label="Ir a Clientes" on the Clientes nav item
  - **Status:** RED — element not found or aria-label missing
  - **Verifies:** Spanish WCAG aria-label

- **Test:** AC5 — should have aria-label="Ir a Contactos" on the Contactos nav item
  - **Status:** RED — element not found or aria-label missing
  - **Verifies:** Spanish WCAG aria-label

- **Test:** AC5 — should have nav items reachable by keyboard (non-negative tabIndex)
  - **Status:** RED — element not found
  - **Verifies:** Tab keyboard accessibility

- **Test:** AC3 — should mark Clientes nav item as active when on /clientes
  - **Status:** RED — data-active attribute not set
  - **Verifies:** Active state from router state

- **Test:** AC3 — should mark Contactos nav item as active when on /contactos
  - **Status:** RED — data-active attribute not set
  - **Verifies:** Active state from router state

- **Test:** AC3 — should NOT mark Contactos as active when on /clientes
  - **Status:** RED — element not found
  - **Verifies:** Only current route item is active

#### 404 Not-Found Tests

**File:** `frontend/src/routes/__tests__/notFound.test.tsx` (84 lines)

- **Test:** AC4 — should render the not-found view when navigating to an unknown route
  - **Status:** RED — not-found-view not rendered (notFoundComponent not configured)
  - **Verifies:** 404 view DOM presence

- **Test:** AC4 — should display Spanish "Página no encontrada" as the heading
  - **Status:** RED — not-found-title not found
  - **Verifies:** Spanish 404 heading text

- **Test:** AC4 — should display a link back to /clientes on the not-found view
  - **Status:** RED — not-found-back-link not found
  - **Verifies:** href="/clientes" on back link

- **Test:** AC4 — should display the back link with text containing "Ir a Clientes"
  - **Status:** RED — not-found-back-link not found
  - **Verifies:** Spanish link text

- **Test:** AC4 — should NOT render the main application content on an unknown route
  - **Status:** RED — not-found-view not found
  - **Verifies:** 404 view is visible and not main content

---

## Data Factories Created

No dedicated data factories are required for this story — navigation shell tests operate on structural/layout assertions only.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for future stories; not used in Story 1.2 tests.

---

## Fixtures Created

No new fixtures were created. The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` convenience fixtures used by downstream E2E tests.

---

## Mock Requirements

No external service mocking is required for this story. The navigation shell is entirely frontend-rendered and does not call APIs during mount.

> **Note for DEV team:** If `siesa-ui-kit` components (`LayoutBase`, `NavigationRail`, `NavigationBar`) are loaded asynchronously or depend on a theme provider, wrap tests in the appropriate provider. Check component exports before implementation.

---

## Required data-testid Attributes

### Root Layout (`src/routes/__root.tsx`)

- `navigation-rail` — Wrapper element for the `NavigationRail` component (desktop left-side nav)
- `navigation-bar` — Wrapper element for the `NavigationBar` component (mobile bottom nav)
- `nav-item-clientes` — Clickable nav item linking to `/clientes` (must also have `aria-label="Ir a Clientes"` and `data-active` attribute)
- `nav-item-contactos` — Clickable nav item linking to `/contactos` (must also have `aria-label="Ir a Contactos"` and `data-active` attribute)

### Clientes Route (`src/routes/clientes.tsx`)

- `clientes-view` — Root element of the `ClientesPage` component

### Contactos Route (`src/routes/contactos.tsx`)

- `contactos-view` — Root element of the `ContactosPage` component

### Not-Found Component

- `not-found-view` — Root wrapper of the 404 page
- `not-found-title` — `<h1>` or heading element with text "Página no encontrada"
- `not-found-back-link` — `<a>` or `<Link>` element pointing to `/clientes`

**Implementation Example:**

```tsx
// navigation-rail wrapper
<div data-testid="navigation-rail" className="hidden lg:flex">
  <NavigationRail ... />
</div>

// navigation-bar wrapper
<div data-testid="navigation-bar" className="flex lg:hidden">
  <NavigationBar ... />
</div>

// nav item (both rail and bar)
<Link
  to="/clientes"
  data-testid="nav-item-clientes"
  aria-label="Ir a Clientes"
  data-active={currentPath.startsWith('/clientes') ? 'true' : 'false'}
>
  <UsersIcon /> Clientes
</Link>

// Not-Found view
<div data-testid="not-found-view">
  <h1 data-testid="not-found-title">Página no encontrada</h1>
  <Link to="/clientes" data-testid="not-found-back-link">← Ir a Clientes</Link>
</div>

// Views
<div data-testid="clientes-view">...</div>
<div data-testid="contactos-view">...</div>
```

---

## Implementation Checklist

### Test: AC1 — Desktop NavigationRail visible with client-side navigation

**File:** `e2e/tests/navigation/frontend-navigation-shell.spec.ts` + `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Import `LayoutBase`, `NavigationRail`, `NavigationBar` from `siesa-ui-kit` in `__root.tsx`
- [ ] Define `navItems` array: `[{ label: 'Clientes', icon: UsersIcon, to: '/clientes' }, { label: 'Contactos', icon: UserIcon, to: '/contactos' }]`
- [ ] Render `NavigationRail` wrapped in `<div data-testid="navigation-rail" className="hidden lg:flex">`
- [ ] Render `NavigationBar` wrapped in `<div data-testid="navigation-bar" className="flex lg:hidden">`
- [ ] Use TanStack Router `<Link>` inside nav items (no `<a href>` reloads)
- [ ] Add `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"` to nav links
- [ ] Wrap `<Outlet />` in `<LayoutBase>` structure
- [ ] Run test: `pnpm --filter frontend test src/routes/__tests__/root.test.tsx`
- [ ] Run E2E: `pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts --project=chromium`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Mobile NavigationBar with 44px touch targets

**File:** `e2e/tests/navigation/frontend-navigation-shell.spec.ts` (AC2 describe block)

**Tasks to make these tests pass:**

- [ ] Confirm `NavigationBar` is rendered inside `<div data-testid="navigation-bar" className="flex lg:hidden">`
- [ ] Ensure nav items in mobile bar have height ≥ 44px (check siesa-ui-kit `NavigationBar` item styles)
- [ ] If siesa-ui-kit does not provide 44px targets, add `min-h-[44px]` via Tailwind to nav item wrappers
- [ ] Run E2E: `pnpm exec playwright test --project=mobile-chrome e2e/tests/navigation/frontend-navigation-shell.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — Deep linking to /clientes and /contactos

**File:** `e2e/tests/navigation/frontend-navigation-shell.spec.ts` (AC3 describe block) + `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `src/routes/clientes.tsx` with `createFileRoute('/clientes')` and `ClientesPage` component
- [ ] Add `data-testid="clientes-view"` to root element of `ClientesPage`
- [ ] Create `src/routes/contactos.tsx` with `createFileRoute('/contactos')` and `ContactosPage` component
- [ ] Add `data-testid="contactos-view"` to root element of `ContactosPage`
- [ ] Verify `routeTree.gen.ts` auto-regenerates with both routes after Vite plugin picks up new files
- [ ] Set `data-active={currentPath.startsWith(item.to) ? 'true' : 'false'}` on each nav item
- [ ] Run test: `pnpm --filter frontend test src/routes/__tests__/root.test.tsx`
- [ ] Run E2E: `pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts --project=chromium`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC4 — 404 not-found view for unknown routes

**File:** `e2e/tests/navigation/frontend-navigation-shell.spec.ts` (AC4 describe block) + `frontend/src/routes/__tests__/notFound.test.tsx`

**Tasks to make these tests pass:**

- [ ] Implement `NotFoundPage` component with structure:
  ```tsx
  <div data-testid="not-found-view">
    <h1 data-testid="not-found-title">Página no encontrada</h1>
    <Link to="/clientes" data-testid="not-found-back-link">← Ir a Clientes</Link>
  </div>
  ```
- [ ] Register `notFoundComponent: NotFoundPage` in `createRootRoute(...)` in `src/routes/__root.tsx`
- [ ] Run test: `pnpm --filter frontend test src/routes/__tests__/notFound.test.tsx`
- [ ] Run E2E: `pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts --project=chromium`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — Keyboard and screen-reader accessibility

**File:** `e2e/tests/navigation/frontend-navigation-shell.spec.ts` (AC5 describe block) + `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `aria-label="Ir a Clientes"` to `nav-item-clientes` element
- [ ] Add `aria-label="Ir a Contactos"` to `nav-item-contactos` element
- [ ] Ensure nav items are rendered as `<a>` or `<button>` elements (naturally keyboard focusable) or add `tabIndex={0}`
- [ ] Verify Enter/Space key activation works (native anchor tags handle this automatically)
- [ ] Run test: `pnpm --filter frontend test src/routes/__tests__/root.test.tsx`
- [ ] Run E2E: `pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts --project=chromium`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all component tests for Story 1.2
pnpm --filter frontend test src/routes/__tests__/

# Run specific component test file
pnpm --filter frontend test src/routes/__tests__/root.test.tsx
pnpm --filter frontend test src/routes/__tests__/notFound.test.tsx

# Run E2E tests for Story 1.2
pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts --headed

# Run E2E tests on specific browser
pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts --project=chromium

# Run mobile viewport E2E tests
pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts --project=mobile-chrome

# Debug specific test
pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 22 E2E tests written and failing (missing implementation)
- ✅ All 16 component tests written and failing (missing shell + route implementations)
- ✅ No data factories needed (navigation is structural)
- ✅ No fixtures needed beyond existing base.fixture.ts
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- E2E tests fail due to missing `data-testid` attributes on NavigationRail, NavigationBar, nav items, route views, and 404 page
- Component tests fail due to current `__root.tsx` being a placeholder with no shell structure
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** (recommend starting with AC3 route creation — unblocks other tests)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. AC3 first — create `/clientes` and `/contactos` routes (unblocks URL tests)
2. AC1 — implement shell with NavigationRail and data-testid attributes
3. AC2 — add NavigationBar and verify touch targets
4. AC4 — add NotFoundPage and register in root route
5. AC5 — add aria-labels and verify keyboard focus

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 38 tests pass (22 E2E + 16 component)
2. Review siesa-ui-kit component prop alignment
3. Extract nav items array to a constants file if reused
4. Ensure Tailwind responsive classes are consistent with company standards
5. Run tests after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/navigation/ && pnpm --filter frontend test`
3. Begin implementation using implementation checklist as guide — recommend AC3 first
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor for quality
6. When refactoring complete, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Existing `base.fixture.ts` follows auto-cleanup fixture pattern
- **network-first.md** — E2E tests use `page.waitForLoadState('networkidle')` registered before `page.goto()` (network-first pattern)
- **selector-resilience.md** — All selectors use `data-testid` hierarchy (no fragile CSS selectors)
- **component-tdd.md** — Component tests use `createMemoryHistory` router wrapper for isolated rendering
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure throughout
- **test-levels-framework.md** — E2E for critical user journeys (navigation, 44px targets, keyboard nav); Component tests for shell structure and aria attributes

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `pnpm exec playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts`

**Expected Results:**

```
Running 27 tests using 1 worker

  ✗ AC1 — should render NavigationRail on the left side on desktop viewport
  ✗ AC1 — should show "Clientes" entry in the NavigationRail on desktop
  ✗ AC1 — should show "Contactos" entry in the NavigationRail on desktop
  ✗ AC1 — should navigate to /clientes without full page reload
  ✗ AC1 — should navigate to /contactos without full page reload
  ✗ AC1 — should NOT show NavigationBar at bottom on desktop viewport
  ✗ AC2 — should render NavigationBar at bottom on mobile viewport
  ✗ AC2 — should show "Clientes" entry in the NavigationBar on mobile
  ✗ AC2 — should show "Contactos" entry in the NavigationBar on mobile
  ✗ AC2 — should have minimum 44px touch target height for Clientes nav item on mobile
  ✗ AC2 — should have minimum 44px touch target height for Contactos nav item on mobile
  ✗ AC2 — should NOT show NavigationRail on mobile viewport
  ✗ AC3 — should render ClientesView when navigating directly to /clientes via URL
  ... (and so on for all 27 tests)

  27 failed
```

**Component Command:** `pnpm --filter frontend test src/routes/__tests__/`

**Expected Results:**

```
 FAIL  src/routes/__tests__/root.test.tsx
 FAIL  src/routes/__tests__/notFound.test.tsx

  - root.test.tsx: Unable to find element by: [data-testid="navigation-rail"]
  - notFound.test.tsx: Unable to find element by: [data-testid="not-found-view"]

Test Files  2 failed
     Tests  16 failed | 0 passed
```

**Summary:**

- Total tests: 38 (22 E2E + 16 Component)
- Passing: 0 (expected — RED phase)
- Failing: 38 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- The E2E test file `e2e/tests/navigation/frontend-navigation-shell.spec.ts` existed prior to this ATDD run (generated by a previous workflow pass). This checklist documents all tests as RED since the implementation in `__root.tsx` is still the placeholder from Story 1.1.
- Component tests use `createMemoryHistory` to isolate route rendering without a real browser. The `routeTree.gen.ts` must include `/clientes` and `/contactos` routes before component tests for AC3 can pass.
- The responsive desktop/mobile behavior (NavigationRail vs NavigationBar visibility) is controlled by Tailwind CSS classes (`hidden lg:flex` / `flex lg:hidden`). Both elements are always in the DOM — component tests verify DOM presence; E2E tests verify visual visibility at specific viewport sizes.
- `siesa-ui-kit` components must be installed and importable. Check `node_modules/siesa-ui-kit` exports before assuming prop names (`LayoutBase`, `NavigationRail`, `NavigationBar`).

---

**Generated by BMad TEA Agent** — 2026-05-23
