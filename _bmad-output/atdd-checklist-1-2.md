# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-30
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** E2E + Component

---

## Story Summary

This story implements the navigation shell for the Siesa Agents frontend — a persistent navigation structure using `siesa-ui-kit` components (`LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar`) with TanStack Router file-based routing. The shell is responsive: `NavigationRail` on desktop (≥ 1024px) and `NavigationBar` on mobile (< 1024px).

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (viewport ≥ 1024px), When the user views the app, Then the `NavigationRail` component from `siesa-ui-kit` is visible on the left side (72px collapsed) with "Clientes" and "Contactos" entries using Heroicons, And the active item shows `primary-50` background + `primary-700` text per the Siesa navigation standard (FR28).

2. **AC2** — Given the user clicks "Clientes" or "Contactos" in the NavigationRail, When the route changes, Then the URL updates to `/clientes` or `/contactos` respectively without a full page reload, the page does not flash or lose scroll position, and the active nav item updates its visual state (FR28).

3. **AC3** — Given the application is loaded on a mobile browser viewport (< 1024px), When the user views the app, Then the `NavigationBar` (bottom tab bar) component from `siesa-ui-kit` is displayed instead of the NavigationRail with all navigation items accessible and tappable (minimum 44px touch targets) (FR29).

4. **AC4** — Given the user types `/clientes` directly in the browser URL bar and presses Enter, When the page loads, Then the Clientes view is rendered correctly, the NavigationRail/NavigationBar shows "Clientes" as active, and no redirection to a home screen occurs (FR30).

5. **AC5** — Given the user types `/contactos` directly in the browser URL bar and presses Enter, When the page loads, Then the Contactos view is rendered correctly, the NavigationRail/NavigationBar shows "Contactos" as active (FR30).

6. **AC6** — Given the user navigates to any unknown route (e.g., `/unknown`, `/abc`), When the page loads, Then a 404 Not Found view is displayed gracefully in Spanish ("Página no encontrada") with a link back to `/clientes`.

7. **AC7** — Given the root route `/` is accessed, When the page loads, Then the user is redirected to `/clientes` automatically without displaying a blank page.

8. **AC8** — Given the app shell is rendered, When any view is displayed, Then the layout uses `LayoutBase` from `siesa-ui-kit` with a `Navbar` (64px top bar) containing the Siesa logo/symbol and product name "Siesa Agents", consistent across all routes.

---

## Failing Tests Created (RED Phase)

### E2E Tests (34 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

#### AC1 — NavigationRail on desktop (4 tests)

- **Test:** `should display the NavigationRail on the left side of the app shell`
  - **Status:** RED — `[data-testid="navigation-rail"]` does not exist in current `__root.tsx` stub
  - **Verifies:** AC1 — NavigationRail is rendered in the DOM
  - **AC:** AC1

- **Test:** `should show "Clientes" entry in the NavigationRail`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` does not exist
  - **Verifies:** AC1 — Clientes navigation entry is visible
  - **AC:** AC1

- **Test:** `should show "Contactos" entry in the NavigationRail`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` does not exist
  - **Verifies:** AC1 — Contactos navigation entry is visible
  - **AC:** AC1

- **Test:** `should apply active visual state to the active NavigationRail item`
  - **Status:** RED — `data-active` attribute not implemented
  - **Verifies:** AC1 — Active item has `data-active="true"`
  - **AC:** AC1

- **Test:** `should not show NavigationBar on desktop viewport`
  - **Status:** RED — Responsive CSS not yet applied
  - **Verifies:** AC1 — NavigationBar hidden on desktop
  - **AC:** AC1

#### AC2 — Client-side navigation without full page reload (5 tests)

- **Test:** `should update URL to /clientes when clicking the Clientes nav item`
  - **Status:** RED — Navigation items are not rendered
  - **Verifies:** AC2 — URL changes to /clientes on click
  - **AC:** AC2

- **Test:** `should update URL to /contactos when clicking the Contactos nav item`
  - **Status:** RED — Navigation items are not rendered
  - **Verifies:** AC2 — URL changes to /contactos on click
  - **AC:** AC2

- **Test:** `should not trigger a full page reload when navigating between sections`
  - **Status:** RED — sessionStorage marker test; navigation items not yet rendered
  - **Verifies:** AC2 — Client-side SPA navigation (no full page reload)
  - **AC:** AC2

- **Test:** `should update the active visual state on the Contactos nav item after navigation`
  - **Status:** RED — Active state logic not implemented
  - **Verifies:** AC2 — Active state updates after navigation
  - **AC:** AC2

- **Test:** `should deactivate the Clientes nav item when navigating to Contactos`
  - **Status:** RED — Active state logic not implemented
  - **Verifies:** AC2 — Previous active item loses active state
  - **AC:** AC2

#### AC3 — NavigationBar on mobile (5 tests)

- **Test:** `should display the NavigationBar (bottom tab bar) on mobile`
  - **Status:** RED — `[data-testid="navigation-bar"]` does not exist
  - **Verifies:** AC3 — NavigationBar renders on mobile viewport
  - **AC:** AC3

- **Test:** `should show Clientes entry in the NavigationBar on mobile`
  - **Status:** RED — `[data-testid="nav-bar-item-clientes"]` does not exist
  - **Verifies:** AC3 — Clientes tab in NavigationBar
  - **AC:** AC3

- **Test:** `should show Contactos entry in the NavigationBar on mobile`
  - **Status:** RED — `[data-testid="nav-bar-item-contactos"]` does not exist
  - **Verifies:** AC3 — Contactos tab in NavigationBar
  - **AC:** AC3

- **Test:** `should have touch targets of at least 44px height for NavigationBar items`
  - **Status:** RED — NavigationBar not implemented; touch target size cannot be measured
  - **Verifies:** AC3 — WCAG touch target minimum (44px)
  - **AC:** AC3

- **Test:** `should hide the NavigationRail on mobile viewport`
  - **Status:** RED — Responsive behavior not implemented
  - **Verifies:** AC3 — NavigationRail hidden on mobile
  - **AC:** AC3

#### AC4 — Deep linking to /clientes (3 tests)

- **Test:** `should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED — `[data-testid="clientes-placeholder"]` does not exist in `clientes.tsx`
  - **Verifies:** AC4 — Clientes view renders on direct URL access
  - **AC:** AC4

- **Test:** `should show Clientes as the active nav item when at /clientes via direct URL`
  - **Status:** RED — Active state not implemented
  - **Verifies:** AC4 — Active item reflects current URL on direct access
  - **AC:** AC4

- **Test:** `should NOT redirect to a home screen when navigating directly to /clientes`
  - **Status:** RED — Navigation shell not implemented; URL may behave unexpectedly
  - **Verifies:** AC4 — No unwanted redirect from /clientes
  - **AC:** AC4

#### AC5 — Deep linking to /contactos (3 tests)

- **Test:** `should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED — `[data-testid="contactos-placeholder"]` does not exist in `contactos.tsx`
  - **Verifies:** AC5 — Contactos view renders on direct URL access
  - **AC:** AC5

- **Test:** `should show Contactos as the active nav item when at /contactos via direct URL`
  - **Status:** RED — Active state not implemented
  - **Verifies:** AC5 — Active item reflects /contactos on direct access
  - **AC:** AC5

- **Test:** `should NOT redirect to a home screen when navigating directly to /contactos`
  - **Status:** RED — Navigation shell not implemented
  - **Verifies:** AC5 — No unwanted redirect from /contactos
  - **AC:** AC5

#### AC6 — 404 Not Found page (4 tests)

- **Test:** `should display a 404 view for an unknown route`
  - **Status:** RED — `notFoundComponent` not registered in `__root.tsx`; no `[data-testid="not-found-page"]`
  - **Verifies:** AC6 — 404 page renders for unknown routes
  - **AC:** AC6

- **Test:** `should display the Spanish heading "Página no encontrada" on the 404 page`
  - **Status:** RED — notFoundComponent not implemented
  - **Verifies:** AC6 — Spanish 404 heading text
  - **AC:** AC6

- **Test:** `should show a link back to /clientes on the 404 page`
  - **Status:** RED — notFoundComponent not implemented
  - **Verifies:** AC6 — Back link to /clientes on 404 page
  - **AC:** AC6

- **Test:** `should navigate to /clientes when clicking the back link on the 404 page`
  - **Status:** RED — notFoundComponent not implemented
  - **Verifies:** AC6 — Back link navigates correctly
  - **AC:** AC6

#### AC7 — Root route / redirects (2 tests)

- **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED — `index.tsx` redirect exists but navigation shell is not implemented; test may fail on shell assertions
  - **Verifies:** AC7 — Automatic redirect from / to /clientes
  - **AC:** AC7

- **Test:** `should not display a blank page when accessing root route /`
  - **Status:** RED — `[data-testid="clientes-placeholder"]` does not exist
  - **Verifies:** AC7 — Content renders after redirect (no blank page)
  - **AC:** AC7

#### AC8 — LayoutBase with Navbar and Siesa branding (6 tests)

- **Test:** `should display the Navbar across all routes`
  - **Status:** RED — `[data-testid="app-navbar"]` does not exist
  - **Verifies:** AC8 — Navbar present on all routes
  - **AC:** AC8

- **Test:** `should display the product name "Siesa Agents" in the Navbar`
  - **Status:** RED — `[data-testid="navbar-product-name"]` does not exist
  - **Verifies:** AC8 — Product name "Siesa Agents" in Navbar
  - **AC:** AC8

- **Test:** `should display the Siesa logo or symbol in the Navbar`
  - **Status:** RED — `[data-testid="navbar-logo"]` does not exist
  - **Verifies:** AC8 — Siesa logo/symbol visible in Navbar
  - **AC:** AC8

- **Test:** `should keep the Navbar visible on the /contactos route`
  - **Status:** RED — Navbar not implemented
  - **Verifies:** AC8 — Navbar consistent on /contactos
  - **AC:** AC8

- **Test:** `should keep the Navbar visible on the 404 route`
  - **Status:** RED — Navbar + notFoundComponent not implemented
  - **Verifies:** AC8 — Navbar consistent on 404 routes
  - **AC:** AC8

- **Test:** `should render the app shell using the LayoutBase structure`
  - **Status:** RED — `[data-testid="layout-base"]` does not exist
  - **Verifies:** AC8 — LayoutBase wrapper is in the DOM
  - **AC:** AC8

#### Accessibility — WCAG 2.1 AA (3 tests)

- **Test:** `should have aria-label="Navegación principal" on the navigation wrapper`
  - **Status:** RED — No `<nav aria-label="Navegación principal">` wrapper yet
  - **Verifies:** AC1/AC3 — Screen reader accessible nav landmark
  - **AC:** AC1, AC3

- **Test:** `should have aria-current="page" on the active navigation item`
  - **Status:** RED — `aria-current` not implemented
  - **Verifies:** AC1 — Screen reader active page indication
  - **AC:** AC1

- **Test:** `should NOT have aria-current="page" on inactive navigation items`
  - **Status:** RED — `aria-current` not implemented
  - **Verifies:** AC1 — Inactive items do not have aria-current="page"
  - **AC:** AC1

---

### Component Tests (28 tests)

**File:** `frontend/src/routes/__root.test.tsx`

#### AC1 — NavigationRail (3 tests)
- `Given app is rendered, When viewing the shell, Then NavigationRail is present in the DOM`
- `Given app is rendered, When viewing the NavigationRail, Then Clientes entry is present`
- `Given app is rendered, When viewing the NavigationRail, Then Contactos entry is present`

#### AC2 — Active navigation state (4 tests)
- `Given route is /clientes, When NavigationRail renders, Then Clientes item has data-active="true"`
- `Given route is /clientes, When NavigationRail renders, Then Contactos item does NOT have data-active="true"`
- `Given route is /contactos, When NavigationRail renders, Then Contactos item has data-active="true"`
- `Given route is /contactos, When NavigationRail renders, Then Clientes item does NOT have data-active="true"`

#### AC3 — NavigationBar mobile (3 tests)
- `Given mobile viewport (< 1024px), When app renders, Then NavigationBar is present in DOM`
- `Given mobile viewport, When NavigationBar renders, Then Clientes tab is present`
- `Given mobile viewport, When NavigationBar renders, Then Contactos tab is present`

#### AC4 — Deep linking /clientes (2 tests)
- `Given user navigates directly to /clientes, When page loads, Then Clientes placeholder is rendered`
- `Given user navigates directly to /clientes, When page loads, Then Clientes nav item is active`

#### AC5 — Deep linking /contactos (2 tests)
- `Given user navigates directly to /contactos, When page loads, Then Contactos placeholder is rendered`
- `Given user navigates directly to /contactos, When page loads, Then Contactos nav item is active`

#### AC6 — 404 Not Found (3 tests)
- `Given user navigates to /ruta-inexistente, When page loads, Then not-found-page element is present`
- `Given user navigates to /unknown, When page loads, Then heading reads "Página no encontrada"`
- `Given user is on 404 page, When viewing the page, Then a link back to /clientes is present`

#### AC7 — Root redirect (2 tests)
- `Given user navigates to /, When page loads, Then Clientes view is rendered (redirect fired)`
- `Given user navigates to /, When redirect fires, Then Clientes nav item is active`

#### AC8 — LayoutBase + Navbar (5 tests)
- `Given app shell renders, When any view is displayed, Then LayoutBase wrapper is present`
- `Given app shell renders, When viewing Navbar, Then app-navbar element is present`
- `Given app shell renders, When viewing Navbar, Then product name "Siesa Agents" is displayed`
- `Given app shell renders, When viewing Navbar, Then Siesa logo element is present`
- `Given app renders on /contactos, When any view is displayed, Then Navbar remains visible`

#### Accessibility (3 tests)
- `Given app shell renders, When screen reader inspects nav, Then aria-label="Navegación principal" is set`
- `Given route is /clientes, When screen reader inspects nav item, Then aria-current="page" on Clientes`
- `Given route is /clientes, When screen reader inspects Contactos item, Then aria-current is NOT "page"`

---

## Data Factories Created

No new domain-specific data factories required for Story 1.2. This story tests navigation shell rendering and routing behavior — no domain entities (Clientes, Contactos) are involved. The existing `e2e/helpers/data.helper.ts` factories remain available for future stories.

---

## Fixtures Created

No new fixtures created. The `e2e/fixtures/base.fixture.ts` (created in Story 1.1) provides:
- `clientesPage` — Navigates to `/clientes` before the test
- `contactosPage` — Navigates to `/contactos` before the test

Story 1.2 E2E tests use `@playwright/test` base directly to allow viewport-specific test groups (`test.use({ viewport: ... })`).

---

## Mock Requirements

No network mocks required. Story 1.2 is purely frontend with no API calls. Tests validate:
- Component rendering (data-testid presence and attributes)
- CSS-based responsive behavior (viewport-driven visibility)
- TanStack Router client-side navigation (no full reload)
- Active state logic based on `useRouterState`

**MSW handlers:** Not required for this story. MSW setup from Story 1.1 remains available for future API-calling stories.

---

## Required `data-testid` Attributes

The following `data-testid` attributes MUST be added during implementation for tests to pass (GREEN phase):

### `frontend/src/routes/__root.tsx`

| Attribute | Element | Notes |
|-----------|---------|-------|
| `layout-base` | `<LayoutBase>` wrapper or inner div | Root layout container |
| `app-navbar` | `<Navbar>` component | Top navigation bar |
| `navbar-product-name` | Product name element inside Navbar | Must contain text "Siesa Agents" |
| `navbar-logo` | Siesa brand logo/symbol element | Image or SVG inside Navbar |
| `main-nav` | `<nav>` wrapping NavigationRail + NavigationBar | Must also have `aria-label="Navegación principal"` |
| `navigation-rail` | `<NavigationRail>` component | Hidden on mobile (`hidden lg:block` or CSS equivalent) |
| `navigation-bar` | `<NavigationBar>` component | Hidden on desktop (`block lg:hidden` or CSS equivalent) |
| `nav-item-clientes` | Clientes item inside NavigationRail | Must accept `data-active` and `aria-current` props |
| `nav-item-contactos` | Contactos item inside NavigationRail | Must accept `data-active` and `aria-current` props |
| `nav-bar-item-clientes` | Clientes tab inside NavigationBar | Mobile-specific |
| `nav-bar-item-contactos` | Contactos tab inside NavigationBar | Mobile-specific |

### `frontend/src/routes/clientes.tsx`

| Attribute | Element | Notes |
|-----------|---------|-------|
| `clientes-placeholder` | Root element of the Clientes placeholder component | Required for AC4, AC7 |

### `frontend/src/routes/contactos.tsx`

| Attribute | Element | Notes |
|-----------|---------|-------|
| `contactos-placeholder` | Root element of the Contactos placeholder component | Required for AC5 |

### `frontend/src/routes/__root.tsx` — `notFoundComponent`

| Attribute | Element | Notes |
|-----------|---------|-------|
| `not-found-page` | Root element of the 404 component | Required for AC6 |
| `not-found-heading` | `<h1>` or heading element | Must contain text "Página no encontrada" |
| `not-found-back-link` | `<Link to="/clientes">` | Must have `href="/clientes"` |

---

## Implementation Checklist

### Test: AC1 + AC8 — Root layout with LayoutBase + NavigationRail + Navbar (9 tests)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Open `frontend/src/routes/__root.tsx` and replace placeholder stub
- [ ] Import `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar` from `siesa-ui-kit`
- [ ] Verify siesa-ui-kit is installed: `pnpm list siesa-ui-kit`
- [ ] Configure `<Navbar data-testid="app-navbar" productName="Siesa Agents">` with Siesa logo (`data-testid="navbar-logo"`) and product name element (`data-testid="navbar-product-name"`)
- [ ] Wrap the layout in a `<LayoutBase data-testid="layout-base">` (or add testid to wrapper div)
- [ ] Configure `<NavigationRail data-testid="navigation-rail">` with Clientes and Contactos items
- [ ] Add `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"` to NavigationRail items
- [ ] Wrap NavigationRail + NavigationBar in `<nav data-testid="main-nav" aria-label="Navegación principal">`
- [ ] Render `<Outlet />` in the content area
- [ ] Verify desktop layout: NavigationRail 72px left + content area fills remaining width
- [ ] Run component tests: `pnpm vitest run src/routes/__root.test.tsx`
- [ ] Run E2E tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1|AC8"`
- [ ] ✅ AC1 and AC8 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC2 — Active navigation state (5 tests)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Import `useRouterState` from `@tanstack/react-router` in `__root.tsx`
- [ ] Derive active state: `const isClientes = location.pathname.startsWith('/clientes')`
- [ ] Pass `data-active={isClientes ? 'true' : undefined}` to the Clientes nav item
- [ ] Pass `aria-current={isClientes ? 'page' : undefined}` to the Clientes nav item
- [ ] Apply same pattern for Contactos nav item
- [ ] Apply active CSS classes: `bg-primary-50 text-primary-700` when active, `text-slate-600 hover:bg-slate-100` when inactive
- [ ] Run E2E tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC3 — Mobile NavigationBar (5 tests)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `<NavigationBar data-testid="navigation-bar">` to `__root.tsx` with the same two items
- [ ] Add `data-testid="nav-bar-item-clientes"` and `data-testid="nav-bar-item-contactos"` to NavigationBar items
- [ ] Apply responsive classes: `hidden lg:block` on NavigationRail wrapper, `block lg:hidden` on NavigationBar wrapper
- [ ] Verify touch targets ≥ 44px: NavigationBar items must have minimum height 44px
- [ ] Run E2E mobile tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 + AC5 — Deep linking for /clientes and /contactos (6 tests)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Edit `frontend/src/routes/clientes.tsx`: change `data-testid="clientes-page"` to `data-testid="clientes-placeholder"`
- [ ] Change placeholder text to Spanish: `<p>Vista de Clientes — en construcción</p>`
- [ ] Edit `frontend/src/routes/contactos.tsx`: change `data-testid="contactos-page"` to `data-testid="contactos-placeholder"`
- [ ] Change placeholder text to Spanish: `<p>Vista de Contactos — en construcción</p>`
- [ ] Verify deep linking: `http://localhost:5173/clientes` and `http://localhost:5173/contactos` render correct views
- [ ] Run E2E tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4|AC5"`
- [ ] ✅ AC4 and AC5 tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC6 — 404 Not Found page (4 tests)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `notFoundComponent: NotFoundPage` to `createRootRoute({...})` in `__root.tsx`
- [ ] Create `NotFoundPage` function component with:
  - Root element: `<div data-testid="not-found-page">`
  - `<ExclamationTriangleIcon>` from `@heroicons/react/24/outline` in `amber-400`
  - Heading: `<h1 data-testid="not-found-heading">Página no encontrada</h1>`
  - Subtitle: `<p>La ruta que buscas no existe.</p>`
  - Back link: `<Link to="/clientes" data-testid="not-found-back-link">Volver al inicio</Link>`
- [ ] Style with `slate-100` background, centered content
- [ ] Install Heroicons if not present: `pnpm add @heroicons/react`
- [ ] Verify navigating to `/ruta-inexistente` shows this view without a JS error
- [ ] Run E2E tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"`
- [ ] ✅ AC6 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC7 — Root route / redirect (2 tests)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Verify `frontend/src/routes/index.tsx` has the redirect: `throw redirect({ to: '/clientes' })`
- [ ] Ensure the redirect fires without displaying a blank intermediate view
- [ ] Verify that after redirect, `data-testid="clientes-placeholder"` is visible
- [ ] Run E2E tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7"`
- [ ] ✅ AC7 tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: Accessibility — WCAG 2.1 AA (3 E2E + 3 Component tests)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `aria-label="Navegación principal"` to the `<nav>` wrapping NavigationRail and NavigationBar
- [ ] Add `aria-current="page"` to the active navigation item (same item that gets `data-active="true"`)
- [ ] Ensure all icon-only nav items have `aria-label` in Spanish (e.g., "Clientes", "Contactos")
- [ ] Verify Tab key navigation reaches all nav items
- [ ] Verify focus indicators: 2px solid `primary-600` (`#0e79fd`) on focused nav items
- [ ] Run E2E accessibility tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Accessibility"`
- [ ] ✅ All accessibility tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run ALL E2E failing tests for Story 1.2
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run ALL Component failing tests for Story 1.2
cd frontend && pnpm vitest run src/routes/__root.test.tsx

# Run E2E tests by AC
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC8"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "Accessibility"

# Run E2E in headed mode (see browser)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run Component tests in watch mode (during development)
cd frontend && pnpm vitest src/routes/__root.test.tsx

# Run Component tests with coverage
cd frontend && pnpm vitest run --coverage src/routes/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 34 E2E tests written and failing (RED phase — navigation shell not implemented)
- ✅ 28 Component tests written and failing (RED phase — data-testid, siesa-ui-kit components not in __root.tsx)
- ✅ All 8 acceptance criteria covered (AC1 through AC8)
- ✅ Given-When-Then structure applied to all tests
- ✅ Network-first pattern applied in E2E tests (route/response listeners before navigation)
- ✅ `data-testid` selectors used exclusively (no fragile CSS selectors)
- ✅ No hard waits — only explicit waits (`waitForURL`, `waitForLoadState`, `expect(...).toBeVisible()`)
- ✅ Atomic tests — one assertion per test
- ✅ Viewport-specific test groups using `test.use({ viewport: ... })` for responsive tests
- ✅ `data-testid` requirements documented and mapped to implementation tasks
- ✅ Implementation checklist created per AC

**Expected RED Phase Failure Reasons:**

- E2E tests fail: `[data-testid="navigation-rail"]` not found — NavigationRail not in `__root.tsx`
- E2E tests fail: `[data-testid="navigation-bar"]` not found — NavigationBar not in `__root.tsx`
- E2E tests fail: `[data-testid="app-navbar"]` not found — Navbar not in `__root.tsx`
- E2E tests fail: `[data-testid="clientes-placeholder"]` not found — placeholder testid wrong in `clientes.tsx`
- E2E tests fail: `[data-testid="contactos-placeholder"]` not found — placeholder testid wrong in `contactos.tsx`
- E2E tests fail: `[data-testid="not-found-page"]` not found — `notFoundComponent` not registered
- Component tests fail: same testid issues + `createMemoryHistory` router in jsdom environment

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing AC from the implementation checklist
2. Read the corresponding tests to understand exact expected behavior
3. Implement minimal code to make that group of tests pass
4. Run the tests to verify they now pass (green)
5. Check off tasks in implementation checklist
6. Move to next AC and repeat

**Recommended order:**

1. AC8 + AC1 (Root layout, LayoutBase, Navbar, NavigationRail — core shell)
2. AC2 (Active state logic — useRouterState)
3. AC4 + AC5 (Update data-testid on placeholder routes)
4. AC7 (Root redirect — verify existing index.tsx works)
5. AC3 (Mobile NavigationBar + responsive CSS)
6. AC6 (404 notFoundComponent in Spanish)
7. Accessibility attributes (aria-label, aria-current)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 62 tests pass (34 E2E + 28 Component)
2. Review `__root.tsx` for clean component structure
3. Ensure Tailwind responsive utilities are applied correctly (`hidden lg:block` / `block lg:hidden`)
4. Verify no `any` types (TypeScript strict mode)
5. Run coverage report: `cd frontend && pnpm vitest run --coverage`
6. Ensure coverage ≥ 80% for `src/routes/` files
7. Run full E2E suite to confirm no regressions

---

## Next Steps

1. **Run failing E2E tests** to confirm RED phase: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`
2. **Run failing Component tests** to confirm RED phase: `cd frontend && pnpm vitest run src/routes/__root.test.tsx`
3. **Begin implementation** using implementation checklist — recommended order: AC8+AC1 → AC2 → AC4+AC5 → AC7 → AC3 → AC6 → Accessibility
4. **Work one AC at a time** — make its tests green before moving to the next
5. **When all 62 tests pass**, refactor for quality and coverage
6. **Update story status to 'done'** when all tests pass and coverage ≥ 80%

---

## Knowledge Base References Applied

- **network-first pattern** — `page.route()` and `page.waitForURL()` registered BEFORE `page.goto()` in AC7 redirect tests
- **test-quality** — One assertion per test (atomic design); explicit waits only; Given-When-Then comments on all tests
- **selector-resilience** — `data-testid` selectors used exclusively; CSS class assertions only via `data-active` attribute (not class names)
- **test-levels-framework** — E2E selected for browser-observable behavior (viewport, navigation, routing); Component selected for render logic (active state, DOM structure)
- **responsive-testing** — `test.use({ viewport: { width: 375, height: 812 } })` for mobile tests; `window.innerWidth` mock in component tests
- **accessibility** — `aria-label`, `aria-current` assertions separate from functional tests to maintain atomic test design

---

## Test Execution Evidence

### Expected RED Phase Results

**E2E tests (34 tests — all FAIL):**
```
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts

  ✗  [chromium] › navigation/navigation-shell.spec.ts — AC1 — should display the NavigationRail on the left side
  ✗  [chromium] › navigation/navigation-shell.spec.ts — AC1 — should show "Clientes" entry in the NavigationRail
  ✗  [chromium] › navigation/navigation-shell.spec.ts — AC1 — should show "Contactos" entry in the NavigationRail
  ✗  [chromium] › navigation/navigation-shell.spec.ts — AC1 — should apply active visual state...
  ✗  [chromium] › navigation/navigation-shell.spec.ts — AC1 — should not show NavigationBar on desktop viewport
  ...
  34 failed
```

**Component tests (28 tests — all FAIL):**
```
cd frontend && pnpm vitest run src/routes/__root.test.tsx

  FAIL  src/routes/__root.test.tsx
    AC1 — NavigationRail on desktop viewport
      ✗ Given app is rendered, When viewing the shell, Then NavigationRail is present in the DOM
      ✗ Given app is rendered, When viewing the NavigationRail, Then Clientes entry is present
      ✗ Given app is rendered, When viewing the NavigationRail, Then Contactos entry is present
    ...
  28 failed
```

**Root cause:** `__root.tsx` currently renders a bare `<div><Outlet /></div>` with none of the required siesa-ui-kit components or data-testid attributes. `clientes.tsx` uses `data-testid="clientes-page"` instead of `"clientes-placeholder"`. `contactos.tsx` uses `data-testid="contactos-page"` instead of `"contactos-placeholder"`. No `notFoundComponent` is registered.

---

## Notes

- The vitest configuration is created at `frontend/vitest.config.ts` — run component tests via `cd frontend && pnpm vitest`
- The vitest setup file at `frontend/src/test/setup.ts` imports `@testing-library/jest-dom` for extended matchers
- Component tests use `createMemoryHistory` from TanStack Router for isolated route testing without a browser
- Responsive behavior in component tests is approximated via `window.innerWidth` mock — the definitive responsive test is the E2E test with Playwright viewport configuration
- `siesa-ui-kit` must be confirmed installed (`pnpm list siesa-ui-kit`) before implementation begins; its exact component APIs must be verified against the installed version
- Story 1.2 tests cover ONLY the navigation shell. Domain features (Clientes CRUD, Contactos) are tested in Epics 2 and 3

---

**Generated by BMad TEA Agent** - 2026-05-30
