# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-12
**Author:** TEA Agent (sa-tea-atdd)
**Story:** 1.2 — Frontend Navigation Shell
**Epic:** 1 — Project Foundation & Application Shell
**Primary Test Levels:** E2E (Playwright) + Component (Vitest + RTL)

---

## Story Summary

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (viewport ≥1024px), When the user views the app, Then a `NavigationRail` (siesa-ui-kit, 72px collapsed) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **AC2** — Given the application is loaded on a mobile browser viewport (<1024px), When the user views the app, Then a bottom `NavigationBar` (siesa-ui-kit) is displayed instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **AC3** — Given the user types `/clientes` or `/contactos` directly in the browser URL bar, When the page loads, Then the correct view is rendered without redirection to a home screen (FR30).

4. **AC4** — Given the user navigates to `/` (root), When the page loads, Then the router redirects to `/clientes` automatically.

5. **AC5** — Given the user navigates to an unknown route, When the page loads, Then a not-found view is displayed and the navigation shell remains visible.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (12 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Status:** Tests ALREADY EXISTED from prior ATDD session. Reviewed and confirmed as valid RED-phase tests.

#### AC3 — Deep Linking: Direct URL Access

**TC-E1-P1-02 — Deep linking: direct URL access to /clientes** (4 tests)

- **Test:** `should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED — No frontend implementation; `[data-testid="clientes-heading"]` does not exist
  - **Verifies:** ClientesPlaceholder renders at /clientes with data-testid="clientes-heading"

- **Test:** `should NOT redirect away from /clientes when navigated directly`
  - **Status:** RED — No router configured; URL won't stay at /clientes
  - **Verifies:** URL remains /clientes after direct navigation

- **Test:** `should not show a blank page or 404 error when navigating directly to /clientes`
  - **Status:** RED — Frontend not running; connection refused
  - **Verifies:** No JS errors, non-empty body at /clientes

- **Test:** `should display the navigation shell (NavigationRail or NavigationBar) at /clientes`
  - **Status:** RED — `[data-testid="app-navigation-shell"]` does not exist
  - **Verifies:** AppShellLayout wrapper present at /clientes

**TC-E1-P1-03 — Deep linking: direct URL access to /contactos** (4 tests)

- **Test:** `should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED — `[data-testid="contactos-heading"]` does not exist
  - **Verifies:** ContactosPlaceholder renders at /contactos

- **Test:** `should NOT redirect away from /contactos when navigated directly`
  - **Status:** RED — No router; URL won't stay at /contactos
  - **Verifies:** URL remains /contactos

- **Test:** `should not show a blank page or 404 error when navigating directly to /contactos`
  - **Status:** RED — Frontend not running
  - **Verifies:** No JS errors, non-empty body at /contactos

- **Test:** `should display the navigation shell at /contactos`
  - **Status:** RED — `[data-testid="app-navigation-shell"]` does not exist
  - **Verifies:** AppShellLayout wrapper present at /contactos

#### AC4 — Root Redirect

**TC-E1-P1-05 — Root index route redirects to /clientes** (2 tests)

- **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED — No index route; no beforeLoad redirect configured
  - **Verifies:** URL changes from / to /clientes

- **Test:** `should render Clientes content (not a blank page) after root redirect`
  - **Status:** RED — No redirect and no ClientesPlaceholder
  - **Verifies:** data-testid="clientes-heading" visible after redirect

#### AC5 — 404 View (E2E layer)

**TC-E1-P1-04b — Unknown route displays not-found view** (4 tests)

- **Test:** `should display the not-found view for an unknown URL path`
  - **Status:** RED — No notFoundComponent; blank page expected
  - **Verifies:** data-testid="not-found-message" visible for unknown routes

- **Test:** `should keep the navigation shell visible on the not-found page`
  - **Status:** RED — No shell wrapper on 404 page
  - **Verifies:** data-testid="app-navigation-shell" visible on 404

- **Test:** `should include a link back to /clientes on the not-found page`
  - **Status:** RED — No NotFound component; data-testid="not-found-back-link" missing
  - **Verifies:** Anchor href="/clientes" present on 404 page

- **Test:** `should display "Página no encontrada" text in Spanish on unknown routes`
  - **Status:** RED — No NotFound component
  - **Verifies:** Spanish 404 message text

#### AC1+AC3 — SPA Navigation (E2E layer)

**TC-E1-P1-01 — SPA navigation does not trigger full page reload** (4 tests)

- **Test:** `should navigate from /clientes to /contactos without a full page reload`
  - **Status:** RED — No nav items; window.__spaMarker identity check will fail
  - **Verifies:** window.__spaMarker survives navigation (no full reload)

- **Test:** `should navigate from /contactos to /clientes without a full page reload`
  - **Status:** RED — No nav items or router
  - **Verifies:** SPA navigation confirmed by window identity

- **Test:** `should keep the navigation shell mounted during route transitions`
  - **Status:** RED — No shell component
  - **Verifies:** data-testid="app-navigation-shell" persists across transitions

- **Test:** `should show nav items "Clientes" and "Contactos" in the navigation shell`
  - **Status:** RED — No nav items
  - **Verifies:** data-testid="nav-item-clientes" and "nav-item-contactos" both visible

---

### Component Tests — Vitest + RTL (20 tests)

#### TC-E1-P1-01: SPA Navigation (Component level)

**File:** `frontend/src/test/routes/navigation.test.tsx` (6 tests)

- **Test:** `should navigate to /clientes when user clicks the Clientes nav item`
  - **Status:** RED — routeTree import will fail (src/routes/__root does not exist)
  - **Verifies:** Router state.location.pathname === '/clientes' after click

- **Test:** `should navigate to /contactos when user clicks the Contactos nav item`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** Router state.location.pathname === '/contactos' after click

- **Test:** `should NOT call window.location.reload when navigating via nav items`
  - **Status:** RED — No implementation; spy will not be triggered correctly
  - **Verifies:** window.location.reload spy not called

- **Test:** `should keep the navigation shell mounted when navigating from /clientes to /contactos`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="app-navigation-shell" persists after route transition

- **Test:** `should render Clientes view content at /clientes`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="clientes-heading" present at /clientes

- **Test:** `should render Contactos view content at /contactos`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="contactos-heading" present at /contactos

- **Test:** `should display nav items labeled "Clientes" and "Contactos" in Spanish`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** Nav items have correct Spanish text content

#### TC-E1-P1-04: 404 Route (Component level)

**File:** `frontend/src/test/routes/notFound.test.tsx` (4 tests)

- **Test:** `should render the NotFound component for an unknown route /ruta-que-no-existe`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="not-found-message" present on unknown route

- **Test:** `should display "Página no encontrada" text in Spanish on unknown route`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** Spanish 404 text content

- **Test:** `should display a "Volver a Clientes" link on the not-found view`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="not-found-back-link" with href="/clientes"

- **Test:** `should not throw a JavaScript error when rendering an unknown route`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** No throw and not-found message present

#### TC-E1-P2-03: Index Redirect (Component level)

**File:** `frontend/src/test/routes/indexRedirect.test.tsx` (3 tests)

- **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** router.state.location.pathname === '/clientes' after rendering at /

- **Test:** `should render the Clientes view content (not a blank page) after root redirect`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="clientes-heading" visible after / → /clientes redirect

- **Test:** `should NOT render content specific to the index path (no double-render at /)`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** pathname !== '/' after render

#### TC-E1-P2-01: NavigationRail Desktop (Component level)

**File:** `frontend/src/test/components/AppShell.desktop.test.tsx` (5 tests)

- **Test:** `should render the NavigationRail component in the DOM at desktop width (1280px)`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="navigation-rail" present at window.innerWidth=1280

- **Test:** `should display the "Clientes" entry inside the NavigationRail`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="nav-item-clientes" with text "Clientes"

- **Test:** `should display the "Contactos" entry inside the NavigationRail`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="nav-item-contactos" with text "Contactos"

- **Test:** `should display the Navbar with product name "Siesa Agents"`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="app-navbar" with text "Siesa Agents"

- **Test:** `should render the app-navigation-shell container at desktop width`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="app-navigation-shell" present

#### TC-E1-P2-02: NavigationBar Mobile (Component level)

**File:** `frontend/src/test/components/AppShell.mobile.test.tsx` (6 tests)

- **Test:** `should render the NavigationBar component in the DOM at mobile width (375px)`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="navigation-bar" present at window.innerWidth=375

- **Test:** `should display the "Clientes" item in the NavigationBar at mobile width`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="nav-item-clientes" with text "Clientes"

- **Test:** `should display the "Contactos" item in the NavigationBar at mobile width`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="nav-item-contactos" with text "Contactos"

- **Test:** `should NOT render the NavigationRail at mobile viewport (375px)`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="navigation-rail" absent or has "hidden" class

- **Test:** `should render navigation items as accessible interactive elements in NavigationBar`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** Nav items are <a> or <button> elements (accessible)

- **Test:** `should render the app-navigation-shell container at mobile width`
  - **Status:** RED — routeTree import will fail
  - **Verifies:** data-testid="app-navigation-shell" present

---

## Required data-testid Attributes

The following `data-testid` attributes must be added to the implementation for tests to pass.

### AppShellLayout (`frontend/src/routes/_app.tsx`)

| Attribute | Element | Required By |
|-----------|---------|-------------|
| `app-navigation-shell` | Root container wrapping the entire shell | All shell tests |
| `app-navbar` | Navbar component wrapper | TC-E1-P2-01 desktop test |
| `navigation-rail` | NavigationRail wrapper div | TC-E1-P2-01 desktop test |
| `navigation-bar` | NavigationBar wrapper div | TC-E1-P2-02 mobile test |
| `nav-item-clientes` | Clientes nav link/item | TC-E1-P1-01, P2-01, P2-02 |
| `nav-item-contactos` | Contactos nav link/item | TC-E1-P1-01, P2-01, P2-02 |

### ClientesPlaceholder (`frontend/src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx`)

| Attribute | Element | Required By |
|-----------|---------|-------------|
| `clientes-heading` | `<h1>Clientes</h1>` element | TC-E1-P1-01, P1-02, P2-03 |

### ContactosPlaceholder (`frontend/src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx`)

| Attribute | Element | Required By |
|-----------|---------|-------------|
| `contactos-heading` | `<h1>Contactos</h1>` element | TC-E1-P1-01, P1-03 |

### NotFound (`frontend/src/shared/components/NotFound.tsx`)

| Attribute | Element | Required By |
|-----------|---------|-------------|
| `not-found-message` | Root div or `<h1>` containing "Página no encontrada" | TC-E1-P1-04 all layers |
| `not-found-back-link` | `<Link to="/clientes">Volver a Clientes</Link>` | TC-E1-P1-04 link test |

---

## Data Factories Created

No domain entity factories required for Story 1.2. This story renders scaffold placeholder components only with no domain data.

---

## Mock Requirements

**Component tests (Vitest + RTL):** No network mocks required. All tests use TanStack Router in-memory history (`createMemoryHistory`) — no real HTTP calls are made.

**E2E tests (Playwright):** No API mocks required. Tests verify frontend SPA behavior only (no backend API calls in Story 1.2). The Playwright `webServer` config in `playwright.config.ts` handles frontend startup.

---

## Implementation Checklist

### Test Group: AC1+AC2 — Navigation Shell (NavigationRail/NavigationBar)

**Files to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route with LayoutBase + NavigationRail + NavigationBar
  - Add `data-testid="app-navigation-shell"` to root wrapper
  - Add `data-testid="app-navbar"` to Navbar wrapper
  - Add `data-testid="navigation-rail"` to NavigationRail wrapper (`hidden lg:flex`)
  - Add `data-testid="navigation-bar"` to NavigationBar wrapper (`flex lg:hidden`)
  - Add `data-testid="nav-item-clientes"` to Clientes nav item
  - Add `data-testid="nav-item-contactos"` to Contactos nav item
- [ ] Install Heroicons: `pnpm add @heroicons/react`
- [ ] Verify siesa-ui-kit exports: LayoutBase, Navbar, NavigationRail, NavigationBar
- [ ] Run component tests: `pnpm vitest run src/test/components/AppShell.desktop.test.tsx`
- [ ] Run component tests: `pnpm vitest run src/test/components/AppShell.mobile.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC3 — Deep Linking

**Files to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` — `/clientes` route
  - Create `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx`
  - Add `data-testid="clientes-heading"` to `<h1>Clientes</h1>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — `/contactos` route
  - Create `frontend/src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx`
  - Add `data-testid="contactos-heading"` to `<h1>Contactos</h1>`
- [ ] Ensure TanStack Router file-based routing handles direct URL access to /clientes and /contactos
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-02"`
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-03"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC4 — Root Redirect

**Files to make these tests pass:**

- [ ] Update `frontend/src/routes/index.tsx` — add `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Run component tests: `pnpm vitest run src/test/routes/indexRedirect.test.tsx`
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-05"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC5 — 404 Not-Found View

**Files to make these tests pass:**

- [ ] Create `frontend/src/shared/components/NotFound.tsx`
  - Add `data-testid="not-found-message"` to root element
  - Add `data-testid="not-found-back-link"` to `<Link to="/clientes">Volver a Clientes</Link>`
  - Text must be in Spanish: "Página no encontrada"
- [ ] Register `notFoundComponent: NotFound` in `frontend/src/routes/__root.tsx`
- [ ] Run component tests: `pnpm vitest run src/test/routes/notFound.test.tsx`
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-04b"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC1 — SPA Navigation (no full reload)

**Files to make these tests pass:**

- [ ] Ensure TanStack Router `Link` components handle nav item clicks (SPA navigation)
- [ ] Nav items must have correct `data-testid` attributes (nav-item-clientes, nav-item-contactos)
- [ ] Run component tests: `pnpm vitest run src/test/routes/navigation.test.tsx`
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-01"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL component tests for Story 1.2
pnpm vitest run src/test/routes/navigation.test.tsx src/test/routes/notFound.test.tsx src/test/routes/indexRedirect.test.tsx src/test/components/AppShell.desktop.test.tsx src/test/components/AppShell.mobile.test.tsx

# Run ALL E2E tests for Story 1.2
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests for specific AC
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-02"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-03"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-04b"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-05"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "TC-E1-P1-01"

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ E2E tests — 12 tests in `e2e/tests/navigation/navigation-shell.spec.ts` (pre-existing, validated)
- ✅ Component tests — 20 tests across 5 files in `frontend/src/test/`
- ✅ data-testid requirements documented
- ✅ Implementation checklist created per AC group
- ✅ Mock requirements documented (none required for Story 1.2)

**Total tests generated:** 32 tests (12 E2E + 20 Component)

**Expected failure modes in RED phase:**

- Component tests: `Cannot find module '../../routes/__root'` — implementation files do not exist
- E2E tests: `ERR_CONNECTION_REFUSED` (if frontend not running) or `Locator not found` for data-testid attributes

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Configure frontend project** (if not done by Story 1.1) — ensure Vitest + RTL are installed
2. **Create routing files** — `__root.tsx`, `_app.tsx`, `index.tsx`, route files for `/clientes` and `/contactos`
3. **Add data-testid attributes** — all attributes listed in "Required data-testid Attributes" section
4. **Create placeholder components** — ClientesPlaceholder, ContactosPlaceholder, NotFound
5. **Verify tests pass** — Run component tests after each implementation step

**Priority order:**
1. AC4 (index redirect) — simplest, proves routing works
2. AC3 (deep linking) — requires placeholder route files
3. AC1+AC2 (navigation shell) — requires siesa-ui-kit integration
4. AC5 (404 view) — requires notFoundComponent registration

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. **Verify all 32 tests pass** (green phase complete)
2. **Review siesa-ui-kit integration** — confirm LayoutBase, NavigationRail, NavigationBar props are correct
3. **Review Tailwind responsive classes** — confirm `hidden lg:flex` / `flex lg:hidden` are applied correctly
4. **Verify Spanish text** — all user-facing text must be in Spanish
5. **Run full test suite** to ensure refactoring did not break any tests

---

## Knowledge Base References Applied

- **network-first.md** — `waitForResponse` BEFORE `page.goto()` in E2E tests (all Playwright tests)
- **selector-resilience.md** — `data-testid` selectors exclusively (no CSS class or tag selectors)
- **timing-debugging.md** — `waitForLoadState('networkidle')`, `waitForURL()`, `findByTestId()` (async explicit waits; no `sleep`)
- **test-quality.md** — Given-When-Then structure on every test; one primary assertion per test
- **data-factories.md** — No factories needed for Story 1.2 (no domain data)

---

## Notes

- Story 1.2 tests are purely frontend — no backend dependency
- The `routeTree` export must be added to `frontend/src/routes/__root.tsx` for component tests to import
- TanStack Router `createMemoryHistory` enables component tests without a real browser
- CSS media queries (Tailwind responsive classes) are NOT computed by jsdom — viewport testing uses `window.innerWidth` override
- The E2E tests use `data-testid` selectors exclusively and are resilient to DOM structure changes
- Story 1.2 tests do NOT test any CRUD, API calls, or data fetching (scope: scaffold only)

---

**Generated by BMad TEA Agent (sa-tea-atdd)** - 2026-06-12
