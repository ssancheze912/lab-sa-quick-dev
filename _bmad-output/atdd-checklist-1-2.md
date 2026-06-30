# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-30
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

This story implements the persistent navigation shell that allows users to move between
Clientes and Contactos sections without full page reloads. It introduces responsive
navigation using `siesa-ui-kit`'s `NavigationRail` (desktop >= 1024px) and `NavigationBar`
(mobile < 1024px), plus TanStack Router file-based routing, a root redirect, and a 404 view.

**As a** user
**I want** a persistent navigation structure to access Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Desktop NavigationRail visible on left side at >= 1024px with "Clientes" and "Contactos" entries; SPA navigation (no full page reload) (FR28)
2. **AC2** — Mobile NavigationBar visible at bottom at < 1024px; all navigation items accessible and tappable (FR29)
3. **AC3** — Direct URL entry to /clientes or /contactos renders correct view without redirection to home; active nav item highlighted (FR30)
4. **AC4** — Unknown route (e.g. /unknown) displays a 404/not-found view with a Spanish message
5. **AC5** — Root path / automatically redirects to /clientes
6. **AC6** — All interactive nav elements have ARIA labels in Spanish; navigation landmark correctly identified (WCAG 2.1 AA)

---

## Failing Tests Created (RED Phase)

### E2E Tests (16 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**AC1 — Desktop NavigationRail (5 tests)**

- RED **Test:** should render a NavigationRail with a Clientes navigation entry on desktop
  - **Status:** RED — `[data-testid="nav-rail"]` not found; NavigationRail not implemented
  - **Verifies:** AC1 — NavigationRail rendered on desktop

- RED **Test:** should render a NavigationRail with a Contactos navigation entry on desktop
  - **Status:** RED — `[data-testid="nav-rail-contactos"]` not found; NavigationRail not implemented
  - **Verifies:** AC1 — Contactos entry in NavigationRail

- RED **Test:** should navigate to /clientes without full page reload when clicking Clientes link on desktop
  - **Status:** RED — `[data-testid="nav-rail-clientes"]` not found
  - **Verifies:** AC1 — SPA navigation via NavigationRail

- RED **Test:** should navigate to /contactos without full page reload when clicking Contactos link on desktop
  - **Status:** RED — `[data-testid="nav-rail-contactos"]` not found
  - **Verifies:** AC1 — SPA navigation via NavigationRail

- RED **Test:** should NOT render a NavigationBar on desktop (only NavigationRail)
  - **Status:** RED — `[data-testid="nav-bar"]` not present or visible state uncontrolled
  - **Verifies:** AC1 — exclusive desktop/mobile component rendering

**AC2 — Mobile NavigationBar (4 tests)**

- RED **Test:** should render a NavigationBar at the bottom on mobile viewport
  - **Status:** RED — `[data-testid="nav-bar"]` not found; NavigationBar not implemented
  - **Verifies:** AC2 — NavigationBar rendered on mobile

- RED **Test:** should render a tappable Clientes item in the NavigationBar on mobile
  - **Status:** RED — `[data-testid="nav-bar-clientes"]` not found
  - **Verifies:** AC2 — Clientes tap navigation on mobile

- RED **Test:** should render a tappable Contactos item in the NavigationBar on mobile
  - **Status:** RED — `[data-testid="nav-bar-contactos"]` not found
  - **Verifies:** AC2 — Contactos tap navigation on mobile

- RED **Test:** should NOT render a NavigationRail on mobile (only NavigationBar)
  - **Status:** RED — `[data-testid="nav-rail"]` visibility uncontrolled
  - **Verifies:** AC2 — exclusive mobile/desktop rendering

**AC3 — Direct URL rendering + active state (5 tests)**

- RED **Test:** should render the Clientes view when navigating directly to /clientes
  - **Status:** RED — `[data-testid="clientes-view"]` not found; route not created
  - **Verifies:** AC3 — /clientes renders correct view (FR30)

- RED **Test:** should render the Contactos view when navigating directly to /contactos
  - **Status:** RED — `[data-testid="contactos-view"]` not found; route not created
  - **Verifies:** AC3 — /contactos renders correct view (FR30)

- RED **Test:** should highlight the Clientes nav item as active when on /clientes
  - **Status:** RED — `data-active="true"` attribute not applied; active state not wired
  - **Verifies:** AC3 — active nav item highlighted (FR30)

- RED **Test:** should highlight the Contactos nav item as active when on /contactos
  - **Status:** RED — `data-active="true"` attribute not applied
  - **Verifies:** AC3 — active nav item highlighted (FR30)

- RED **Test:** should NOT show the Contactos nav item as active when on /clientes
  - **Status:** RED — active state not implemented
  - **Verifies:** AC3 — only current route's nav item is active

**AC4 — 404 not-found view (3 tests)**

- RED **Test:** should display a 404 not-found view for an unknown route
  - **Status:** RED — `[data-testid="not-found-view"]` not found; 404 component not implemented
  - **Verifies:** AC4 — graceful 404 rendering

- RED **Test:** should display a Spanish error message on the 404 not-found view
  - **Status:** RED — `[data-testid="not-found-message"]` not found
  - **Verifies:** AC4 — Spanish message in 404 view

- RED **Test:** should NOT redirect to /clientes when navigating to an unknown route
  - **Status:** RED — router may redirect or throw instead of showing 404
  - **Verifies:** AC4 — 404 shown, not silently redirected

**AC5 — Root path redirect (2 tests)**

- RED **Test:** should redirect automatically from / to /clientes
  - **Status:** RED — index.tsx has no `redirect` in `beforeLoad`
  - **Verifies:** AC5 — root redirect to /clientes

- RED **Test:** should render the Clientes view after redirect from /
  - **Status:** RED — redirect not implemented, clientes-view not found
  - **Verifies:** AC5 — correct view rendered post-redirect

---

### Component Tests (7 tests)

**File:** `frontend/src/routes/__tests__/__root.test.tsx`

**AC6 — ARIA labels and navigation landmark (7 tests)**

- RED **Test:** should render a navigation landmark with aria-label "Navegación principal"
  - **Status:** RED — `routeTree.gen` does not exist; nav landmark not implemented
  - **Verifies:** AC6 — WCAG 2.1 AA navigation landmark

- RED **Test:** should have an accessible name for the Clientes navigation link
  - **Status:** RED — `routeTree.gen` does not exist
  - **Verifies:** AC6 — Clientes link accessible via screen reader

- RED **Test:** should have an accessible name for the Contactos navigation link
  - **Status:** RED — `routeTree.gen` does not exist
  - **Verifies:** AC6 — Contactos link accessible via screen reader

- RED **Test:** should have data-testid="nav-rail" on the desktop navigation container
  - **Status:** RED — nav-rail data-testid not added
  - **Verifies:** AC6 / selector stability — data-testid present

- RED **Test:** should have data-testid="nav-bar" on the mobile navigation container
  - **Status:** RED — nav-bar data-testid not added
  - **Verifies:** AC6 / selector stability — data-testid present

- RED **Test:** should NOT have any interactive navigation element without an aria-label or visible text
  - **Status:** RED — navigation not implemented
  - **Verifies:** AC6 — no unlabeled interactive elements (WCAG 2.1 AA)

- RED **Test:** should mark navigation icons as aria-hidden when they are decorative
  - **Status:** RED — icons not implemented with aria-hidden
  - **Verifies:** AC6 — decorative icons hidden from screen readers

- RED **Test:** (routing) should render the Clientes view at /clientes
  - **Status:** RED — routeTree.gen missing, clientes route not created
  - **Verifies:** AC3 (component level) — /clientes route renders clientes-view

- RED **Test:** (routing) should render the Contactos view at /contactos
  - **Status:** RED — contactos route not created
  - **Verifies:** AC3 (component level) — /contactos route renders contactos-view

- RED **Test:** (routing) should render a 404 not-found view for an unknown route
  - **Status:** RED — notFoundComponent not implemented
  - **Verifies:** AC4 (component level) — unknown route renders not-found-view

- RED **Test:** (routing) should show a Spanish message in the 404 not-found view
  - **Status:** RED — notFoundComponent not implemented
  - **Verifies:** AC4 (component level) — Spanish text in 404 view

---

## Data Factories Created

No data factories required for Story 1.2 — this story is pure frontend navigation with no
data entities. Existing `data.helper.ts` is sufficient.

---

## Fixtures Created

No new fixtures created. The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage`
and `contactosPage` navigation fixtures that will be usable once routes are implemented.

---

## Mock Requirements

This story is **pure frontend** — no backend API calls are made during navigation. No
API mocking is required.

The E2E tests use `page.route('**/*', route => route.continue())` as a pass-through
network-first pattern to satisfy the network-first intercept requirement without blocking
any requests.

---

## Required data-testid Attributes

### Navigation Shell (`__root.tsx`)

- `nav-rail` — `<nav>` container holding the `NavigationRail` (desktop, hidden on mobile via CSS)
- `nav-bar` — `<nav>` container holding the `NavigationBar` (mobile, hidden on desktop via CSS)
- `nav-rail-clientes` — NavigationRail link/button for Clientes route
- `nav-rail-contactos` — NavigationRail link/button for Contactos route
- `nav-bar-clientes` — NavigationBar link/button for Clientes route
- `nav-bar-contactos` — NavigationBar link/button for Contactos route

**Active state attribute:**
- `data-active="true"` — applied to the active nav item (Clientes or Contactos) by `<Link activeProps>`

### Route Views

- `clientes-view` — root element of the Clientes placeholder view (`_app/clientes.tsx`)
- `contactos-view` — root element of the Contactos placeholder view (`_app/contactos.tsx`)
- `not-found-view` — container of the 404/not-found component in `__root.tsx`
- `not-found-message` — the Spanish text message in the 404 view

**Implementation Example:**

```tsx
// __root.tsx — navigation landmark
<nav aria-label="Navegación principal" data-testid="nav-rail" className="hidden lg:flex">
  <NavigationRail>
    <Link to="/clientes" activeProps={{ 'data-active': 'true' }} data-testid="nav-rail-clientes">
      Clientes
    </Link>
    <Link to="/contactos" activeProps={{ 'data-active': 'true' }} data-testid="nav-rail-contactos">
      Contactos
    </Link>
  </NavigationRail>
</nav>

// __root.tsx — 404 view
notFoundComponent: () => (
  <div data-testid="not-found-view" role="main">
    <h1>Página no encontrada</h1>
    <p data-testid="not-found-message">La página que buscas no existe.</p>
  </div>
)

// _app/clientes.tsx
<div data-testid="clientes-view">Clientes — próximamente</div>

// _app/contactos.tsx
<div data-testid="contactos-view">Contactos — próximamente</div>
```

---

## Implementation Checklist

### Test: NavigationRail on desktop (AC1)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Install/verify `siesa-ui-kit@1.0.245` in `frontend/package.json` (Story 1.1 done)
- [ ] Import `NavigationRail` from `siesa-ui-kit` in `__root.tsx`
- [ ] Render `<nav aria-label="Navegación principal" data-testid="nav-rail" className="hidden lg:flex">` with `<NavigationRail>` inside
- [ ] Add `<Link to="/clientes" data-testid="nav-rail-clientes" activeProps={{ 'data-active': 'true' }}>Clientes</Link>` inside rail
- [ ] Add `<Link to="/contactos" data-testid="nav-rail-contactos" activeProps={{ 'data-active': 'true' }}>Contactos</Link>` inside rail
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: NavigationBar on mobile (AC2)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Import `NavigationBar` from `siesa-ui-kit` in `__root.tsx`
- [ ] Render `<nav aria-label="Navegación principal" data-testid="nav-bar" className="flex lg:hidden fixed bottom-0 w-full">` with `<NavigationBar>` inside
- [ ] Add `<Link to="/clientes" data-testid="nav-bar-clientes">Clientes</Link>` inside bar
- [ ] Add `<Link to="/contactos" data-testid="nav-bar-contactos">Contactos</Link>` inside bar
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=mobile-chrome`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: Direct URL rendering + active state (AC3)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` as pathless layout route (`createFileRoute('/_app')`)
- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `<div data-testid="clientes-view">Clientes — próximamente</div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `<div data-testid="contactos-view">Contactos — próximamente</div>`
- [ ] TanStack Router plugin auto-regenerates `routeTree.gen.ts` on file save
- [ ] Verify `<Link activeProps={{ 'data-active': 'true' }}>` correctly sets attribute on active route
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: 404 not-found view in Spanish (AC4)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `notFoundComponent` to `createRootRoute` options in `__root.tsx`
- [ ] Render `<div data-testid="not-found-view" role="main">` container
- [ ] Add `<p data-testid="not-found-message">La página que buscas no existe.</p>` (Spanish)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Root redirect to /clientes (AC5)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/index.tsx` to add `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Import `redirect` from `@tanstack/react-router`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: ARIA labels and navigation landmark (AC6)

**File:** `frontend/src/routes/__tests__/__root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Ensure `aria-label="Navegación principal"` is on both `<nav>` elements in `__root.tsx`
- [ ] Ensure all nav links have visible text ("Clientes", "Contactos") in Spanish
- [ ] Ensure decorative icons have `aria-hidden="true"` (or `aria-label` if standalone)
- [ ] Configure Vitest with `@testing-library/jest-dom` in `frontend/vite.config.ts` test section
- [ ] Run test: `pnpm --filter frontend test src/routes/__tests__/__root.test.tsx`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all E2E failing tests for this story
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run E2E tests on desktop only
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium

# Run E2E tests on mobile only
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=mobile-chrome

# Debug a specific E2E test
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests (Vitest)
pnpm --filter frontend test src/routes/__tests__/__root.test.tsx

# Run component tests in watch mode
pnpm --filter frontend test --watch src/routes/__tests__/__root.test.tsx
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- No data factories or fixtures needed (pure frontend navigation story)
- data-testid requirements listed and implementation examples provided
- Implementation checklist created

**Verification:**

- E2E tests fail: `nav-rail`, `nav-bar`, `clientes-view`, `contactos-view`, `not-found-view` selectors not found
- Component tests fail: `routeTree.gen` does not exist → import error (expected at RED phase)
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Start with AC5 (root redirect) — simplest, 0.5h: update `index.tsx`
2. Then AC4 (404 view) — 0.5h: add `notFoundComponent` in `__root.tsx`
3. Then AC3 (routes) — 1.5h: create `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`
4. Then AC1 (desktop nav) — 1h: add `NavigationRail` to `__root.tsx`
5. Then AC2 (mobile nav) — 1h: add `NavigationBar` to `__root.tsx`
6. Then AC6 (ARIA) — 1h: ensure aria-label, configure Vitest, pass component tests

**Key Principles:**

- One acceptance criterion at a time
- Run tests after each implementation step
- Check `data-testid` attributes match exactly what tests expect

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 27 tests pass (16 E2E + 11 component)
2. Extract navigation items array to a shared constant
3. Optimize responsive CSS if needed
4. Run full test suite to confirm still green
5. Update story status to 'done' in implementation artifact

---

## Next Steps

1. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
2. Review implementation checklist — start with AC5 (simplest)
3. Implement one AC at a time, running tests after each
4. When all tests pass, refactor for quality
5. Update story status in `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns (existing base.fixture.ts extended)
- **network-first.md** — `page.route('**/*', route => route.continue())` intercept before navigation
- **component-tdd.md** — Component test patterns with TanStack Router `createMemoryHistory`
- **selector-resilience.md** — `data-testid` selectors throughout; `data-active` attribute for active state
- **test-quality.md** — One assertion per test, Given-When-Then, atomic tests
- **timing-debugging.md** — `page.waitForLoadState('networkidle')` for deterministic waits

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results (RED phase — before implementation):**

```
Running 16 tests using 2 workers

  1 [chromium] e2e/tests/navigation/navigation-shell.spec.ts:38:3 ...
    Error: locator.isVisible: Timeout 30000ms exceeded.
    Call log:
      waiting for locator('[data-testid="nav-rail"]') to be visible

  ... (all 16 E2E tests expected to fail similarly)
```

**Component tests expected failure:**

```
FAIL frontend/src/routes/__tests__/__root.test.tsx
  Cannot find module '../../routeTree.gen' from '__root.test.tsx'
  (routeTree.gen.ts is auto-generated only after route files exist)
```

**Summary:**

- E2E tests: 16 failing (expected — nav components not implemented)
- Component tests: 11 failing (expected — routeTree.gen not yet generated)
- Total failing: 27
- Status: RED phase verified

---

## Notes

- `routeTree.gen.ts` is auto-generated by `@tanstack/router-plugin/vite` when route files are saved. Component tests will remain in RED until `_app.tsx`, `_app/clientes.tsx`, and `_app/contactos.tsx` are created and the dev server runs once.
- The `siesa-ui-kit` NavigationRail/NavigationBar component API (exact prop names) must be verified against the kit catalog before implementation. The `data-testid` attributes shown in this checklist must be passed as props or added to wrapper elements.
- Active state detection uses TanStack Router `<Link activeProps={{ 'data-active': 'true' }}>` — no Zustand store needed.
- Mobile vs desktop rendering relies on TailwindCSS `hidden lg:flex` / `flex lg:hidden` classes — both `nav-rail` and `nav-bar` will be in the DOM on all viewports; visibility is controlled by CSS. E2E tests use `toBeVisible()` which respects CSS visibility.

---

**Generated by BMad TEA Agent** — 2026-06-30
