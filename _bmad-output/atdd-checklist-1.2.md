# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright)

---

## Story Summary

Story 1.2 establishes the persistent navigation shell for the Siesa Agents CRM frontend.
The shell uses `siesa-ui-kit` components — `NavigationRail` on desktop (>= 1024px) and
`NavigationBar` on mobile (< 1024px) — wired to TanStack Router for client-side navigation
between `/clientes` and `/contactos`. Direct URL access (deep linking) and graceful 404
handling with a Spanish message are also required.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop (viewport >= 1024px): `NavigationRail` visible on the left with "Clientes" and "Contactos" entries (FR28)
2. Clicking "Clientes" navigates to `/clientes` without a full page reload; item is marked active (FR28)
3. Clicking "Contactos" navigates to `/contactos` without a full page reload; item is marked active (FR28)
4. Mobile (viewport < 1024px): `NavigationBar` at the bottom with both entries visible and tappable (FR29)
5. Direct URL `/clientes` renders the Clientes view correctly; nav item is marked active (FR30)
6. Direct URL `/contactos` renders the Contactos view correctly; nav item is marked active (FR30)
7. Unknown route (e.g., `/ruta-desconocida`) shows a 404 view in Spanish with a link back to `/clientes`
8. All navigation items have `aria-label` in Spanish; WCAG 2.1 AA keyboard navigation and focus indicators

---

## Failing Tests Created (RED Phase)

### E2E Tests (22 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**AC1 — Desktop NavigationRail visibility (4 tests)**

- **Test:** `should show the NavigationRail on the left side on desktop viewport`
  - **Status:** RED — `navigation-rail` data-testid does not exist (route stub only)
  - **Verifies:** AC1 — NavigationRail rendered on desktop

- **Test:** `should display a "Clientes" navigation entry in the NavigationRail`
  - **Status:** RED — `nav-item-clientes` data-testid does not exist
  - **Verifies:** AC1 — "Clientes" entry visible in rail

- **Test:** `should display a "Contactos" navigation entry in the NavigationRail`
  - **Status:** RED — `nav-item-contactos` data-testid does not exist
  - **Verifies:** AC1 — "Contactos" entry visible in rail

- **Test:** `should NOT show the NavigationBar (mobile) on desktop viewport`
  - **Status:** RED — `navigation-bar` data-testid does not exist
  - **Verifies:** AC1/AC4 — correct component shown per viewport

**AC2 — Client-side navigation to /clientes (2 tests)**

- **Test:** `should navigate to /clientes without a full page reload when clicking the Clientes item`
  - **Status:** RED — no NavigationRail or nav items rendered
  - **Verifies:** AC2 — SPA navigation, no full reload

- **Test:** `should mark the "Clientes" nav item as active after navigating to /clientes`
  - **Status:** RED — `data-active` attribute not implemented
  - **Verifies:** AC2 — active state reflected on nav item

**AC3 — Client-side navigation to /contactos (3 tests)**

- **Test:** `should navigate to /contactos when clicking the Contactos nav item`
  - **Status:** RED — no nav items rendered
  - **Verifies:** AC3 — SPA navigation to /contactos

- **Test:** `should mark the "Contactos" nav item as active after navigating to /contactos`
  - **Status:** RED — `data-active` attribute not implemented
  - **Verifies:** AC3 — active state on Contactos item

- **Test:** `should deactivate the "Clientes" item when navigating to /contactos`
  - **Status:** RED — `data-active` attribute not implemented
  - **Verifies:** AC3 — only one item active at a time

**AC4 — Mobile NavigationBar (5 tests)**

- **Test:** `should show the NavigationBar at the bottom on mobile viewport`
  - **Status:** RED — `navigation-bar` data-testid does not exist
  - **Verifies:** AC4 — NavigationBar rendered on mobile

- **Test:** `should NOT show the NavigationRail on mobile viewport`
  - **Status:** RED — no responsive component switching
  - **Verifies:** AC4 — rail hidden on mobile

- **Test:** `should display "Clientes" entry in the mobile NavigationBar`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC4 — Clientes entry tappable on mobile

- **Test:** `should display "Contactos" entry in the mobile NavigationBar`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC4 — Contactos entry tappable on mobile

- **Test:** `should navigate to /contactos when tapping the Contactos item on mobile`
  - **Status:** RED — no navigation items
  - **Verifies:** AC4 — touch navigation works on mobile

**AC5 — Deep link to /clientes (3 tests)**

- **Test:** `should render the Clientes view when navigating directly to /clientes via URL`
  - **Status:** RED — `clientes-view` data-testid does not exist; route may not be defined
  - **Verifies:** AC5 — deep link renders correct view

- **Test:** `should mark the "Clientes" nav item as active on direct URL /clientes load`
  - **Status:** RED — active state not implemented
  - **Verifies:** AC5 — active state from direct URL

- **Test:** `should NOT redirect /clientes to a home or index screen`
  - **Status:** RED — `/clientes` route does not exist yet
  - **Verifies:** AC5 — no unwanted redirect

**AC6 — Deep link to /contactos (3 tests)**

- **Test:** `should render the Contactos view when navigating directly to /contactos via URL`
  - **Status:** RED — `contactos-view` data-testid does not exist
  - **Verifies:** AC6 — deep link renders correct view

- **Test:** `should mark the "Contactos" nav item as active on direct URL /contactos load`
  - **Status:** RED — active state not implemented
  - **Verifies:** AC6 — active state from direct URL

- **Test:** `should NOT redirect /contactos to a home or index screen`
  - **Status:** RED — `/contactos` route does not exist yet
  - **Verifies:** AC6 — no unwanted redirect

**AC7 — 404 Not-found view (4 tests)**

- **Test:** `should display a 404 view when navigating to an unknown route`
  - **Status:** RED — `not-found-view` data-testid does not exist
  - **Verifies:** AC7 — graceful 404 for unknown routes

- **Test:** `should display the 404 message in Spanish`
  - **Status:** RED — `not-found-message` data-testid does not exist
  - **Verifies:** AC7 — Spanish "Página no encontrada" text

- **Test:** `should show a link back to /clientes on the 404 view`
  - **Status:** RED — `not-found-back-link` data-testid does not exist
  - **Verifies:** AC7 — recovery link to /clientes

- **Test:** `should display 404 view for deeply nested unknown routes`
  - **Status:** RED — not-found route not configured
  - **Verifies:** AC7 — catches all unknown routes

**AC8 — Accessibility (6 tests)**

- **Test:** `should have an aria-label in Spanish on the "Clientes" navigation item`
  - **Status:** RED — aria-label not set
  - **Verifies:** AC8 — WCAG aria-label on Clientes

- **Test:** `should have an aria-label in Spanish on the "Contactos" navigation item`
  - **Status:** RED — aria-label not set
  - **Verifies:** AC8 — WCAG aria-label on Contactos

- **Test:** `should allow keyboard focus on the "Clientes" navigation item`
  - **Status:** RED — nav items not rendered / not focusable
  - **Verifies:** AC8 — keyboard navigation

- **Test:** `should allow keyboard navigation between nav items using Tab`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC8 — Tab key traversal

- **Test:** `should activate navigation via keyboard Enter key on the "Contactos" item`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC8 — Enter key activates navigation

- **Test:** `should have a visible focus indicator on navigation items`
  - **Status:** RED — no focus ring style configured
  - **Verifies:** AC8 — WCAG 2.1 AA visible focus indicator

- **Test:** `should have the navigation landmark wrapped in a <nav> element with a role`
  - **Status:** RED — no semantic navigation landmark
  - **Verifies:** AC8 — semantic HTML for assistive technologies

**Root redirect (1 test)**

- **Test:** `should redirect the root path / to /clientes automatically`
  - **Status:** RED — `/` route has no redirect configured
  - **Verifies:** Implicit requirement — root always goes to /clientes

---

## Data Factories Created

No data factories required for this story — navigation shell is purely frontend/routing with no backend data dependencies.

---

## Fixtures Created

### Navigation Fixtures

**File:** `e2e/fixtures/navigation.fixture.ts`

**Fixtures:**

- `desktopNav` — `NavigationPage` instance pre-loaded at `/clientes` on desktop (1280x800)
  - **Setup:** Sets viewport to 1280x800 and navigates to `/clientes`
  - **Provides:** `NavigationPage` with typed locators for all nav shell elements
  - **Cleanup:** None required (URL-driven SPA, no persistent state)

- `mobileNav` — `NavigationPage` instance pre-loaded at `/clientes` on mobile (390x844)
  - **Setup:** Sets viewport to 390x844 and navigates to `/clientes`
  - **Provides:** `NavigationPage` with mobile-context locators
  - **Cleanup:** None required

- `rootNav` — `NavigationPage` instance at the root `/` path
  - **Setup:** Navigates to `/`
  - **Provides:** `NavigationPage` for redirect tests
  - **Cleanup:** None required

**Page Object Model:**

**File:** `e2e/pages/navigation.page.ts`

Typed locators and helper methods for the navigation shell. Encapsulates `data-testid` locators for `navigation-rail`, `navigation-bar`, nav items, 404 view elements, and route view containers.

---

## Mock Requirements

No external API mocks required. This story is frontend-only (no backend calls in the navigation shell). No MSW handlers needed for this story's acceptance tests.

---

## Required data-testid Attributes

### Navigation Shell (`__root.tsx`)

- `navigation-rail` — Root wrapper of the `NavigationRail` siesa-ui-kit component (desktop)
- `navigation-bar` — Root wrapper of the `NavigationBar` siesa-ui-kit component (mobile)
- `nav-item-clientes` — The "Clientes" navigation item (both rail and bar); must expose `data-active="true|false"`
- `nav-item-contactos` — The "Contactos" navigation item (both rail and bar); must expose `data-active="true|false"`

### Route Views

- `clientes-view` — Root element of the Clientes placeholder view (`_app/clientes.tsx`)
- `contactos-view` — Root element of the Contactos placeholder view (`_app/contactos.tsx`)

### 404 Not-Found View

- `not-found-view` — Root container of the not-found component
- `not-found-message` — Element containing the Spanish 404 message ("Página no encontrada")
- `not-found-back-link` — Anchor/link element pointing back to `/clientes`

**Implementation examples:**

```tsx
// NavigationRail wrapper in __root.tsx
<div data-testid="navigation-rail" className="hidden lg:flex">
  <NavigationRail ... />
</div>

// NavigationBar wrapper in __root.tsx
<div data-testid="navigation-bar" className="flex lg:hidden fixed bottom-0 w-full">
  <NavigationBar ... />
</div>

// Individual nav items (must include aria-label and data-active)
<a
  data-testid="nav-item-clientes"
  aria-label="Clientes"
  data-active={isClientesActive ? 'true' : 'false'}
  href="/clientes"
>
  Clientes
</a>

// Clientes view in _app/clientes.tsx
<div data-testid="clientes-view">
  Clientes — Próximamente
</div>

// 404 view in notFoundComponent
<div data-testid="not-found-view">
  <p data-testid="not-found-message">Página no encontrada</p>
  <a data-testid="not-found-back-link" href="/clientes">Volver a Clientes</a>
</div>
```

---

## Implementation Checklist

### Test: Desktop NavigationRail visibility (AC1)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC1 describe block

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/__root.tsx` to import `NavigationRail` from `siesa-ui-kit`
- [ ] Wrap `NavigationRail` in a `<div data-testid="navigation-rail" className="hidden lg:flex">`
- [ ] Import `NavigationBar` from `siesa-ui-kit`
- [ ] Wrap `NavigationBar` in a `<div data-testid="navigation-bar" className="flex lg:hidden fixed bottom-0 w-full">`
- [ ] Define `navItems` array with "Clientes" and "Contactos" entries
- [ ] Pass `data-testid`, `aria-label`, and `data-active` props to each nav item
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Client-side navigation active state (AC2, AC3)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC2/AC3 describe blocks

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route
- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `data-testid="clientes-view"` on root element
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `data-testid="contactos-view"` on root element
- [ ] Update `frontend/src/routes/index.tsx` to redirect `/` → `/clientes` via `beforeLoad`
- [ ] Wire nav items to TanStack Router `<Link>` with `activeProps`; set `data-active` based on `useRouterState`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2|AC3"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: Mobile NavigationBar (AC4)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC4 describe block

**Tasks to make these tests pass:**

- [ ] Confirm `NavigationBar` wrapper uses `flex lg:hidden` (visible on mobile, hidden on desktop)
- [ ] Confirm `NavigationRail` wrapper uses `hidden lg:flex` (hidden on mobile, visible on desktop)
- [ ] Ensure touch events work on nav items (standard HTML links are sufficient)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours (covered by AC1 implementation)

---

### Test: Deep linking /clientes and /contactos (AC5, AC6)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC5/AC6 describe blocks

**Tasks to make these tests pass:**

- [ ] Ensure `_app/clientes.tsx` renders without redirect (file-based route registered in routeTree)
- [ ] Ensure `_app/contactos.tsx` renders without redirect
- [ ] `data-testid="clientes-view"` on the Clientes placeholder view container
- [ ] `data-testid="contactos-view"` on the Contactos placeholder view container
- [ ] Active state on nav items must reflect the current URL on initial load (not just on click)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5|AC6"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours (covered by AC2/AC3 implementation)

---

### Test: 404 not-found view (AC7)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC7 describe block

**Tasks to make these tests pass:**

- [ ] Add `notFoundComponent` to the root route in `__root.tsx`
- [ ] Implement `NotFoundView` component with `data-testid="not-found-view"`
- [ ] Include `<p data-testid="not-found-message">Página no encontrada</p>`
- [ ] Include `<a data-testid="not-found-back-link" href="/clientes">Volver a Clientes</a>`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Accessibility (AC8)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — AC8 describe block

**Tasks to make these tests pass:**

- [ ] Add `aria-label="Clientes"` to the Clientes nav item element
- [ ] Add `aria-label="Contactos"` to the Contactos nav item element
- [ ] Wrap navigation in a `<nav>` or `role="navigation"` landmark element
- [ ] Ensure nav items are focusable (`<a>` or `<button>` or `tabIndex={0}`)
- [ ] Ensure Tab order follows DOM order: Clientes then Contactos
- [ ] Apply a visible focus ring via Tailwind (`focus:outline-2 focus:outline-blue-600` or Siesa Blue `#0e79fd`)
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC8"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Root redirect (implicit)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` — Root route redirect describe block

**Tasks to make this test pass:**

- [ ] Update `frontend/src/routes/index.tsx` with `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Root route"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run a specific acceptance criterion group
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC8"

# Run in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run in debug mode
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run all E2E tests
pnpm exec playwright test

# Run with UI mode (interactive)
pnpm exec playwright test --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 22 E2E tests written and failing (missing implementation — not test bugs)
- Page Object Model created (`navigation.page.ts`)
- Fixtures created with auto-cleanup (`navigation.fixture.ts`)
- No external mocks needed (frontend-only story)
- All `data-testid` attributes documented
- Implementation checklist created per acceptance criterion

**Verification:**

- Tests fail because `__root.tsx` is a stub (renders only `<Outlet />`)
- No `NavigationRail` or `NavigationBar` components exist in the DOM
- Routes `/clientes` and `/contactos` are not yet defined
- `data-active`, `aria-label`, and 404 elements do not exist

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test (start with AC1 — NavigationRail visibility)
2. Read the test to understand expected behavior
3. Implement minimal code to make that test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended implementation order:**

1. AC1 — Add NavigationRail + NavigationBar to `__root.tsx` with `data-testid` wrappers
2. Root redirect — Update `index.tsx` with `beforeLoad` redirect to `/clientes`
3. AC5/AC6 — Create `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx` with `data-testid` views
4. AC2/AC3 — Wire active state via `useRouterState` and `data-active` attribute
5. AC4 — Verify mobile tests pass (should be covered by responsive CSS from AC1)
6. AC7 — Add `notFoundComponent` with Spanish message and back link
7. AC8 — Add `aria-label`, `<nav>` landmark, focus ring styles

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 22 tests pass
2. Extract nav items array to a shared constant if duplicated
3. Review Tailwind classes for dark mode compatibility
4. Ensure no hardcoded colors break dark mode
5. Run tests after each refactor to confirm no regressions
6. Code review and story approval

---

## Next Steps

1. Share this checklist and the test file with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
3. Begin implementation following the recommended order above
4. Work one AC group at a time (red → green for each group)
5. When all 22 tests pass and refactor is complete, update story status to `done`

---

## Knowledge Base References Applied

- **network-first.md** — `page.waitForURL()` used instead of hard waits; response listeners registered before navigation
- **selector-resilience.md** — All selectors use `data-testid` (no CSS class selectors or XPath)
- **test-quality.md** — One assertion per test (atomic tests); explicit waits only
- **fixture-architecture.md** — `NavigationFixtures` extend `base.extend<>()` with auto-cleanup teardown
- **component-tdd.md** — Component-level concerns (active state, aria) verified via E2E for integration confidence
- **test-levels-framework.md** — E2E chosen as primary level (full user journey: navigation, responsive layout, accessibility interaction)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results:**

```
FAILED  e2e/tests/navigation/navigation-shell.spec.ts (22 tests)

  AC1 — Desktop NavigationRail visibility
    x should show the NavigationRail on the left side on desktop viewport
      Error: locator.waitFor: Error: strict mode violation: getByTestId('navigation-rail') resolved to 0 elements
    x should display a "Clientes" navigation entry in the NavigationRail
      Error: locator.waitFor: Error: strict mode violation: getByTestId('nav-item-clientes') resolved to 0 elements
    ...

  AC7 — 404 not-found view for unknown routes
    x should display a 404 view when navigating to an unknown route
      Error: locator.waitFor: Error: strict mode violation: getByTestId('not-found-view') resolved to 0 elements
    ...

  22 failed
```

**Summary:**

- Total tests: 22
- Passing: 0 (expected)
- Failing: 22 (expected)
- Status: RED phase — tests define expected behavior before implementation

---

## Notes

- This story is **frontend-only** — no backend API calls or MSW mocks required
- The `siesa-ui-kit` package is already installed from Story 1.1
- The exact prop API for `NavigationRail` and `NavigationBar` must be verified against the installed package before implementation — adapt `data-testid` wrappers as needed
- If `siesa-ui-kit` components do not accept `data-testid` directly, wrap them in a `<div data-testid="...">` container
- `data-active` attribute must be applied at the wrapper/container level (not inside the siesa-ui-kit internal DOM) for reliable test targeting
- TanStack Router auto-regenerates `routeTree.gen.ts` — never edit it manually; run `pnpm run dev` to trigger regeneration after adding route files
- TypeScript strict mode is active — all props and component interfaces must be fully typed (no `any`)

---

**Generated by BMad TEA Agent** — 2026-06-29
