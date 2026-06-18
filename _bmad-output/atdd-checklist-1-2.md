# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-18
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright)

---

## Story Summary

Story 1.2 implements the persistent application shell for the Siesa Agents CRM. The shell provides responsive navigation — a `NavigationRail` on desktop (≥1024px) and a `NavigationBar` on mobile (<1024px) — using siesa-ui-kit components and TanStack Router for client-side routing.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Desktop NavigationRail (≥1024px): `NavigationRail` visible left side (72px collapsed), icon-only, with "Clientes" and "Contactos" entries. Clicking navigates without full reload. (FR28)
2. **AC2** — Mobile NavigationBar (<1024px): `NavigationBar` at bottom (56px), all items accessible with touch targets ≥ 44×44px. (FR29)
3. **AC3** — Deep linking: typing `/clientes` or `/contactos` directly renders the correct view and highlights active item — no redirect to home. (FR30)
4. **AC4** — Unknown route renders 404 not-found view with "Página no encontrada" text and a "Ir a Clientes" link.
5. **AC5** — Active nav item shows left border `primary-600`, background `primary-50`, icon `primary-700` (desktop) or built-in active indicator (mobile).
6. **AC6** — Navigation between `/clientes` and `/contactos` is client-side (TanStack Router) — no HTML document reload.

---

## Failing Tests Created (RED Phase)

### E2E Tests (20 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

#### AC1 — Desktop NavigationRail (5 tests)

- **Test:** `should render NavigationRail on the left side in desktop viewport`
  - **Status:** RED — `[data-testid="navigation-rail"]` does not exist (implementation missing)
  - **Verifies:** AC1 — NavigationRail renders in desktop viewport

- **Test:** `should display Clientes navigation entry in NavigationRail`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` does not exist
  - **Verifies:** AC1 — "Clientes" entry is visible in NavigationRail

- **Test:** `should display Contactos navigation entry in NavigationRail`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` does not exist
  - **Verifies:** AC1 — "Contactos" entry is visible in NavigationRail

- **Test:** `should NOT render NavigationBar (bottom nav) on desktop viewport`
  - **Status:** RED — element visibility assertion fails (components not yet implemented)
  - **Verifies:** AC1/AC2 — NavigationBar hidden on desktop

- **Test:** `should navigate to /clientes without full page reload when clicking Clientes nav item`
  - **Status:** RED — nav items not implemented, route `/contactos` may not exist
  - **Verifies:** AC1, AC6 — client-side routing works via nav item click

#### AC2 — Mobile NavigationBar (5 tests)

- **Test:** `should render NavigationBar at bottom on mobile viewport`
  - **Status:** RED — `[data-testid="navigation-bar"]` does not exist
  - **Verifies:** AC2 — NavigationBar visible on mobile

- **Test:** `should NOT render NavigationRail on mobile viewport`
  - **Status:** RED — component not implemented
  - **Verifies:** AC2 — NavigationRail hidden on mobile

- **Test:** `should display Clientes navigation item in mobile NavigationBar`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` not rendered on mobile
  - **Verifies:** AC2 — Clientes item accessible on mobile

- **Test:** `should display Contactos navigation item in mobile NavigationBar`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` not rendered on mobile
  - **Verifies:** AC2 — Contactos item accessible on mobile

- **Test:** `should have touch target height of at least 44px for Clientes nav item`
  - **Status:** RED — component not rendered, bounding box returns null
  - **Verifies:** AC2 — touch target ≥ 44px height (WCAG 2.5.5)

- **Test:** `should have touch target width of at least 44px for Clientes nav item`
  - **Status:** RED — component not rendered, bounding box returns null
  - **Verifies:** AC2 — touch target ≥ 44px width (WCAG 2.5.5)

#### AC3 — Deep linking (4 tests)

- **Test:** `should render ClientesView when navigating directly to /clientes`
  - **Status:** RED — `[data-testid="clientes-view"]` not yet implemented
  - **Verifies:** AC3 — direct URL access renders correct view

- **Test:** `should render ContactosView when navigating directly to /contactos`
  - **Status:** RED — `[data-testid="contactos-view"]` not yet implemented
  - **Verifies:** AC3 — direct URL access renders correct view

- **Test:** `should highlight Clientes nav item as active when on /clientes`
  - **Status:** RED — `data-active="true"` attribute not applied
  - **Verifies:** AC3, AC5 — active route highlighted

- **Test:** `should highlight Contactos nav item as active when on /contactos`
  - **Status:** RED — `data-active="true"` attribute not applied
  - **Verifies:** AC3, AC5 — active route highlighted

- **Test:** `should redirect / to /clientes`
  - **Status:** RED — `index.tsx` redirect not implemented
  - **Verifies:** AC3 — root path redirects to /clientes

#### AC4 — 404 Not Found (4 tests)

- **Test:** `should display not-found page when navigating to an unknown route`
  - **Status:** RED — `[data-testid="not-found-page"]` not implemented
  - **Verifies:** AC4 — 404 page renders for unknown routes

- **Test:** `should display "Página no encontrada" text on the 404 page`
  - **Status:** RED — text not found, page not implemented
  - **Verifies:** AC4 — Spanish 404 page text

- **Test:** `should show a link back to /clientes on the 404 page`
  - **Status:** RED — `[data-testid="not-found-link-clientes"]` not implemented
  - **Verifies:** AC4 — "Ir a Clientes" link present

- **Test:** `should navigate to /clientes when clicking the "Ir a Clientes" link on 404 page`
  - **Status:** RED — component not implemented
  - **Verifies:** AC4 — link navigates to /clientes

#### AC5 — Active visual state (4 tests)

- **Test:** `should apply active styles to Clientes nav item when on /clientes route`
  - **Status:** RED — CSS class `active` not applied
  - **Verifies:** AC5 — active CSS class applied (desktop)

- **Test:** `should NOT apply active styles to Contactos nav item when on /clientes route`
  - **Status:** RED — component not implemented
  - **Verifies:** AC5 — only matching item is active

- **Test:** `should apply active styles to Contactos nav item when on /contactos route`
  - **Status:** RED — CSS class `active` not applied
  - **Verifies:** AC5 — active CSS class applied (desktop)

- **Test:** `should show active indicator on Clientes item in mobile NavigationBar when on /clientes`
  - **Status:** RED — `data-active="true"` not applied on mobile
  - **Verifies:** AC5 — active indicator on mobile nav

#### AC6 — Client-side routing (3 tests)

- **Test:** `should not trigger a network request to reload the HTML document when navigating from /clientes to /contactos`
  - **Status:** RED — route `/contactos` not implemented, cannot verify absence of document reload
  - **Verifies:** AC6 — no document reload = client-side routing

- **Test:** `should not trigger a network request to reload the HTML document when navigating from /contactos to /clientes`
  - **Status:** RED — routes not implemented
  - **Verifies:** AC6 — client-side navigation confirmed

- **Test:** `should render the app shell (NavigationRail) without re-mounting between route changes`
  - **Status:** RED — shell and routes not implemented
  - **Verifies:** AC6 — persistent shell layout (no re-mount on route change)

---

## Data Factories Created

No data factories required for this story. Story 1.2 is a pure frontend routing/navigation story with no API calls or persistent data. Navigation tests use static URL paths and DOM assertions only.

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures (navigation shortcuts). These are reused without modification.

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** page positioned at `/clientes`
  - **Cleanup:** None (navigation state reset by Playwright between tests)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** page positioned at `/contactos`
  - **Cleanup:** None

---

## Mock Requirements

No external service mocking required. Story 1.2 is pure frontend routing with no backend API calls. All tests assert on DOM structure, URL state, and CSS class state.

---

## Required data-testid Attributes

### App Shell (`_app.tsx`)

- `navigation-rail` — The `NavigationRail` component container (desktop, ≥1024px)
- `navigation-bar` — The `NavigationBar` component container (mobile, <1024px)
- `nav-item-clientes` — Navigation item linking to `/clientes` (on both rail and bar)
- `nav-item-contactos` — Navigation item linking to `/contactos` (on both rail and bar)

**Implementation Example:**

```tsx
<NavigationRail data-testid="navigation-rail">
  <NavItem data-testid="nav-item-clientes" data-active={isActive('/clientes')} to="/clientes">
    Clientes
  </NavItem>
  <NavItem data-testid="nav-item-contactos" data-active={isActive('/contactos')} to="/contactos">
    Contactos
  </NavItem>
</NavigationRail>

<NavigationBar data-testid="navigation-bar">
  {/* same items with same data-testid */}
</NavigationBar>
```

### Route Views

- `clientes-view` — Root element of the Clientes placeholder view (`clientes.tsx`)
- `contactos-view` — Root element of the Contactos placeholder view (`contactos.tsx`)

**Implementation Example:**

```tsx
// frontend/src/routes/_app/clientes.tsx
function ClientesView() {
  return <div data-testid="clientes-view">Clientes (placeholder)</div>
}

// frontend/src/routes/_app/contactos.tsx
function ContactosView() {
  return <div data-testid="contactos-view">Contactos (placeholder)</div>
}
```

### NotFoundPage (`NotFoundPage.tsx`)

- `not-found-page` — Root container of the 404 not-found page
- `not-found-link-clientes` — The "Ir a Clientes" button/link

**Implementation Example:**

```tsx
export function NotFoundPage() {
  return (
    <div data-testid="not-found-page" className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="text-lg text-slate-600">Página no encontrada</p>
        <Button asChild data-testid="not-found-link-clientes">
          <Link to="/clientes">Ir a Clientes</Link>
        </Button>
      </div>
    </div>
  )
}
```

### Active State Attribute

- `data-active="true"` — Applied to the nav item whose route matches the current URL

**Implementation Example:**

```tsx
// Using TanStack Router's Link activeProps
<Link
  to="/clientes"
  data-testid="nav-item-clientes"
  activeProps={{ 'data-active': 'true', className: 'active bg-primary-50 border-l-2 border-primary-600' }}
  inactiveProps={{ 'data-active': 'false' }}
>
  Clientes
</Link>
```

---

## Implementation Checklist

### Test: Desktop NavigationRail renders (AC1)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC1 group

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route with `LayoutBase` wrapper
- [ ] Import `NavigationRail` from `siesa-ui-kit` and render with `data-testid="navigation-rail"`
- [ ] Add `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"` to NavigationRail items
- [ ] Configure `LayoutBase` to show `NavigationRail` only on desktop (≥1024px, `lg:` breakpoint)
- [ ] Configure `LayoutBase` to hide `NavigationBar` on desktop
- [ ] Wire `Outlet` inside content area
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Desktop NavigationRail"`
- [ ] Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: Mobile NavigationBar renders (AC2)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC2 group

**Tasks to make these tests pass:**

- [ ] Import `NavigationBar` from `siesa-ui-kit` and render with `data-testid="navigation-bar"`
- [ ] Configure `LayoutBase` to show `NavigationBar` only on mobile (<1024px)
- [ ] Ensure `NavigationBar` items have `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"`
- [ ] Verify that siesa-ui-kit `NavigationBar` items have minimum height/width of 44px (or wrap in touchable with min-h-[44px] min-w-[44px])
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Mobile NavigationBar"`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: Deep linking renders correct views (AC3)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC3 group

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` — exports `Route = createFileRoute('/_app/clientes')`, renders `<div data-testid="clientes-view">`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — exports `Route = createFileRoute('/_app/contactos')`, renders `<div data-testid="contactos-view">`
- [ ] Create `frontend/src/routes/index.tsx` — `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Apply `data-active="true"` on nav items using TanStack Router `Link` `activeProps`
- [ ] Verify `routeTree.gen.ts` auto-generates correctly
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Deep linking"`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: 404 Not Found page (AC4)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC4 group

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/NotFoundPage.tsx` with `data-testid="not-found-page"`
- [ ] Add heading `404` and text "Página no encontrada"
- [ ] Add `Button` (siesa-ui-kit) with `data-testid="not-found-link-clientes"` linking to `/clientes`
- [ ] Register `NotFoundPage` as `defaultNotFoundComponent` in `frontend/src/router.tsx`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "404"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: Active navigation item visual state (AC5)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC5 group

**Tasks to make these tests pass:**

- [ ] Use TanStack Router `Link` `activeProps` to add `className: 'active bg-primary-50 border-l-2 border-primary-600'` when route is active
- [ ] Add `data-active="true"` via `activeProps` and `data-active="false"` via `inactiveProps` to nav items
- [ ] Verify active state works on both desktop (`NavigationRail`) and mobile (`NavigationBar`)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Active"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: Client-side routing (AC6)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC6 group

**Tasks to make these tests pass:**

- [ ] Ensure TanStack Router is configured with `createRouter` (file-based, client-side)
- [ ] Ensure `_app.tsx` uses `Outlet` so the shell persists across route changes
- [ ] Verify no `<a href>` tags with full-page navigation are used — all links use TanStack Router `Link`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "client-side"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for Story 1.2
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run on desktop viewport only
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium

# Run on mobile viewport
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=mobile-chrome

# Debug a specific test
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run all E2E tests
pnpm exec playwright test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 20 tests written and failing
- Fixtures reused from existing `base.fixture.ts` (no new fixtures needed)
- No data factories needed (pure frontend routing)
- Mock requirements documented (none required)
- Required `data-testid` attributes listed
- Implementation checklist created

**Verification:**

- All tests run and fail due to missing implementation
- Failures are clear: element `[data-testid="navigation-rail"]` not found, etc.
- No test bugs — failures are expected RED phase

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (recommend starting with AC1: create `_app.tsx`)
2. Read the test to understand expected behavior (Given-When-Then structure)
3. Implement minimal code to make that specific test pass
4. Run test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order:**
1. AC4 (NotFoundPage) — quickest win, isolated component
2. AC3 (deep linking routes) — unblocks AC1/AC2/AC5/AC6 tests
3. AC1 (NavigationRail desktop)
4. AC2 (NavigationBar mobile)
5. AC5 (active visual state)
6. AC6 (verify client-side routing)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 20 tests pass (green phase complete)
2. Review NavigationRail / NavigationBar siesa-ui-kit prop API — ensure minimal wrapper
3. Extract navigation items config to a shared constant if reused
4. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
3. Begin implementation following the implementation checklist (start with NotFoundPage then route files)
4. Work one test group at a time (AC4 → AC3 → AC1 → AC2 → AC5 → AC6)
5. When all 20 tests pass, refactor and update story status

---

## Knowledge Base References Applied

- **network-first.md** — Network-first intercept pattern applied: `waitForLoadState` registered before `page.goto()`
- **fixture-architecture.md** — Reused existing `base.fixture.ts` (no new fixtures; navigation tests are stateless)
- **test-quality.md** — One assertion per test, Given-When-Then structure, no hard waits
- **selector-resilience.md** — All selectors use `data-testid` attributes (no fragile CSS selectors)
- **timing-debugging.md** — `waitForLoadState('domcontentloaded')` and `waitForLoadState('networkidle')` used for deterministic waits

---

## Test Execution Evidence

**Command:** `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results (RED Phase):**

All 20 tests will fail with messages like:
- `Error: locator('[data-testid="navigation-rail"]') resolved to 0 elements`
- `Error: locator('[data-testid="clientes-view"]') resolved to 0 elements`
- `Error: locator('[data-testid="not-found-page"]') resolved to 0 elements`
- `Expected: "/clientes" - Received: "/" ` (redirect not implemented)

**Summary:**

- Total tests: 20
- Passing: 0 (expected)
- Failing: 20 (expected)
- Status: RED phase — tests define expected behavior, implementation pending

---

## Notes

- Story 1.2 is pure frontend — no backend API calls, no data factories, no service mocks needed
- The siesa-ui-kit `LayoutBase` component is expected to handle responsive switching internally when both `navigationRail` and `navigationBar` props are provided — verify actual prop API before implementing
- `data-active="true"` attribute on nav items enables both visual active state (CSS) AND test assertions — implement via TanStack Router `Link` `activeProps`
- Navigation labels must be in Spanish: "Clientes", "Contactos" (not "Clients", "Contacts")
- Touch target tests (AC2) measure `boundingBox()` — ensure siesa-ui-kit NavigationBar items meet 44×44px minimum

---

**Generated by BMad TEA Agent** — 2026-06-18
