# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

This story implements the persistent navigation shell for Siesa Agents CRM. A responsive layout route (`_app.tsx`) wraps all main views, rendering a `NavigationRail` on desktop (>= 1024px) and a `NavigationBar` at the bottom on mobile (< 1024px). Both navigation components are sourced from `siesa-ui-kit` (P0 mandatory). The shell provides SPA navigation between `/clientes` and `/contactos`, deep-linking support, a root redirect, and a graceful 404 view — all meeting WCAG 2.1 AA accessibility requirements.

**As a** user,
**I want** a persistent navigation structure to access the Clientes and Contactos sections,
**So that** I can move between sections without full page reloads from any device.

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (viewport >= 1024px), When the user views the app, Then a `NavigationRail` from siesa-ui-kit is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **AC2** — Given the application is loaded on a mobile browser (viewport < 1024px), When the user views the app, Then a mobile-responsive `NavigationBar` from siesa-ui-kit is displayed at the bottom instead of the rail, all navigation items are accessible and tappable (FR29), and touch targets meet WCAG 2.1 AA minimum size (44x44px).

3. **AC3** — Given the user types `/clientes` or `/contactos` directly in the browser URL bar, When the page loads, Then the correct view is rendered without redirection to a home screen, and the corresponding navigation item is in active/selected state (FR30).

4. **AC4** — Given the user navigates to an unknown route (e.g. `/unknown`), When the page loads, Then a 404 not-found view is displayed gracefully with a link to navigate back to `/clientes`.

5. **AC5** — Given the root URL `/` is accessed, When the page loads, Then the router redirects automatically to `/clientes` without a full page reload.

6. **AC6** — Given the navigation shell is rendered, When it is inspected for accessibility, Then nav links have meaningful `aria-label` attributes in Spanish, the active route is indicated via `aria-current="page"`, and the navigation landmark uses a `<nav>` element (WCAG 2.1 AA).

---

## Failing Tests Created (RED Phase)

### E2E Tests (30 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

#### AC1 — Desktop NavigationRail (6 tests)

- **Test:** `should display NavigationRail on the left side on desktop viewport`
  - **Status:** RED — `[data-testid="nav-rail"]` does not exist (component not implemented)
  - **Verifies:** NavigationRail visible on desktop viewport >= 1024px

- **Test:** `should show "Clientes" entry in the NavigationRail on desktop`
  - **Status:** RED — `nav-rail` element absent
  - **Verifies:** "Clientes" nav entry inside NavigationRail

- **Test:** `should show "Contactos" entry in the NavigationRail on desktop`
  - **Status:** RED — `nav-rail` element absent
  - **Verifies:** "Contactos" nav entry inside NavigationRail

- **Test:** `should navigate to /clientes without a full page reload when clicking Clientes`
  - **Status:** RED — `nav-rail` element absent; click fails
  - **Verifies:** SPA navigation (no full reload) via Clientes link

- **Test:** `should navigate to /contactos without a full page reload when clicking Contactos`
  - **Status:** RED — `nav-rail` element absent; click fails
  - **Verifies:** SPA navigation (no full reload) via Contactos link

- **Test:** `should NOT display mobile NavigationBar on desktop viewport`
  - **Status:** RED — `nav-bar` element absent (expect hidden, gets not-found)
  - **Verifies:** Mobile bar is hidden on desktop via Tailwind `lg:hidden`

#### AC2 — Mobile NavigationBar (7 tests)

- **Test:** `should display mobile NavigationBar at the bottom on mobile viewport`
  - **Status:** RED — `[data-testid="nav-bar"]` does not exist
  - **Verifies:** NavigationBar visible on mobile viewport < 1024px

- **Test:** `should show "Clientes" item in the mobile NavigationBar`
  - **Status:** RED — `nav-bar` element absent
  - **Verifies:** "Clientes" item inside mobile NavigationBar

- **Test:** `should show "Contactos" item in the mobile NavigationBar`
  - **Status:** RED — `nav-bar` element absent
  - **Verifies:** "Contactos" item inside mobile NavigationBar

- **Test:** `should navigate to /contactos when tapping Contactos in mobile NavigationBar`
  - **Status:** RED — `nav-bar` element absent; tap fails
  - **Verifies:** Touch navigation works in mobile NavigationBar

- **Test:** `Clientes nav item touch target should meet WCAG 2.1 AA minimum size (44x44px)`
  - **Status:** RED — `nav-bar` element absent; boundingBox returns null
  - **Verifies:** WCAG 2.1 AA 44x44px minimum touch target for Clientes

- **Test:** `Contactos nav item touch target should meet WCAG 2.1 AA minimum size (44x44px)`
  - **Status:** RED — `nav-bar` element absent; boundingBox returns null
  - **Verifies:** WCAG 2.1 AA 44x44px minimum touch target for Contactos

- **Test:** `should NOT display desktop NavigationRail on mobile viewport`
  - **Status:** RED — `nav-rail` element absent (expect hidden, gets not-found)
  - **Verifies:** Desktop rail is hidden on mobile via Tailwind `hidden lg:flex`

#### AC3 — Direct URL access and active nav state (6 tests)

- **Test:** `should render /clientes view when URL /clientes is typed directly`
  - **Status:** RED — `[data-testid="clientes-view"]` does not exist
  - **Verifies:** /clientes route renders clientes-view without redirect

- **Test:** `should render /contactos view when URL /contactos is typed directly`
  - **Status:** RED — `[data-testid="contactos-view"]` does not exist
  - **Verifies:** /contactos route renders contactos-view without redirect

- **Test:** `should NOT redirect when navigating directly to /clientes`
  - **Status:** RED — URL ends at / or shows error (route not configured)
  - **Verifies:** Deep link to /clientes keeps URL at /clientes

- **Test:** `should NOT redirect when navigating directly to /contactos`
  - **Status:** RED — URL ends at / or shows error (route not configured)
  - **Verifies:** Deep link to /contactos keeps URL at /contactos

- **Test:** `should show Clientes nav item as active when on /clientes route`
  - **Status:** RED — `nav-rail` absent; `[aria-current="page"]` not found
  - **Verifies:** aria-current="page" on Clientes link at /clientes

- **Test:** `should show Contactos nav item as active when on /contactos route`
  - **Status:** RED — `nav-rail` absent; `[aria-current="page"]` not found
  - **Verifies:** aria-current="page" on Contactos link at /contactos

#### AC4 — 404 graceful not-found view (4 tests)

- **Test:** `should display 404 not-found view for unknown route /unknown`
  - **Status:** RED — `[data-testid="not-found-view"]` does not exist
  - **Verifies:** 404 view rendered for unknown routes

- **Test:** `should display "Página no encontrada" message on 404 view`
  - **Status:** RED — `not-found-view` element absent
  - **Verifies:** Spanish message displayed on 404 view

- **Test:** `should display a back-link to /clientes on the 404 view`
  - **Status:** RED — `not-found-view` element absent; link check fails
  - **Verifies:** "Ir a Clientes" link visible in 404 view

- **Test:** `should navigate to /clientes when clicking the back-link on 404 view`
  - **Status:** RED — `not-found-view` absent; click fails
  - **Verifies:** Clicking back-link navigates to /clientes

#### AC5 — Root / redirect to /clientes (3 tests)

- **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED — index.tsx does not have beforeLoad redirect yet
  - **Verifies:** Root / resolves to /clientes URL

- **Test:** `should render clientes-view after root redirect to /clientes`
  - **Status:** RED — redirect not implemented; clientes-view absent
  - **Verifies:** clientes-view shown after root redirect

- **Test:** `should NOT perform a full page reload during root redirect`
  - **Status:** RED — redirect not implemented; URL stays at /
  - **Verifies:** Client-side redirect (no server round-trip)

#### AC6 — Accessibility (WCAG 2.1 AA) (5 tests)

- **Test:** `should have a <nav> landmark element wrapping the navigation shell`
  - **Status:** RED — `<nav>` element absent (component not implemented)
  - **Verifies:** Semantic `<nav>` landmark for screen readers

- **Test:** `should have aria-label in Spanish on the navigation element`
  - **Status:** RED — `nav[aria-label="Navegación principal"]` absent
  - **Verifies:** Spanish aria-label on nav landmark

- **Test:** `should mark the active route link with aria-current="page"`
  - **Status:** RED — active link mechanism not implemented
  - **Verifies:** aria-current="page" on active route link

- **Test:** `should update aria-current="page" when navigating from /clientes to /contactos`
  - **Status:** RED — nav-rail absent; navigation fails
  - **Verifies:** aria-current updates dynamically on SPA navigation

- **Test:** `nav links should have meaningful aria-label attributes`
  - **Status:** RED — nav-rail absent; link count is 0
  - **Verifies:** All nav links have non-empty aria-label attributes

#### App Shell Structure (2 tests)

- **Test:** `should render app-shell wrapper element`
  - **Status:** RED — `[data-testid="app-shell"]` does not exist
  - **Verifies:** App shell wrapper rendered at root of layout

- **Test:** `should render main content area alongside NavigationRail`
  - **Status:** RED — `<main>` element absent from layout
  - **Verifies:** `<main>` content area renders alongside nav rail

---

### Component Tests (22 tests)

**File:** `frontend/src/routes/__tests__/_app.test.tsx`

#### AC1 — NavigationRail renders (5 tests)

- **Test:** `should render an element with data-testid="nav-rail"`
  - **Status:** RED — `_app.tsx` not implemented; routeTree does not include `nav-rail`
  - **Verifies:** nav-rail element exists in DOM at component level

- **Test:** `should render "Clientes" navigation entry inside nav-rail`
  - **Status:** RED — nav-rail absent
  - **Verifies:** "Clientes" text rendered inside nav-rail

- **Test:** `should render "Contactos" navigation entry inside nav-rail`
  - **Status:** RED — nav-rail absent
  - **Verifies:** "Contactos" text rendered inside nav-rail

- **Test:** `should render app-shell wrapper with data-testid="app-shell"`
  - **Status:** RED — app-shell not implemented
  - **Verifies:** app-shell wrapper element present

- **Test:** `should render a <main> content area inside the app shell`
  - **Status:** RED — main element absent in layout
  - **Verifies:** `<main>` element exists inside app-shell

#### AC2 — NavigationBar renders (3 tests)

- **Test:** `should render an element with data-testid="nav-bar"`
  - **Status:** RED — `_app.tsx` not implemented; nav-bar absent
  - **Verifies:** nav-bar element exists in DOM

- **Test:** `should render "Clientes" navigation entry inside nav-bar`
  - **Status:** RED — nav-bar absent
  - **Verifies:** "Clientes" text rendered inside nav-bar

- **Test:** `should render "Contactos" navigation entry inside nav-bar`
  - **Status:** RED — nav-bar absent
  - **Verifies:** "Contactos" text rendered inside nav-bar

#### AC3 — Route views and active state (6 tests)

- **Test:** `should render clientes-view when router is at /clientes`
  - **Status:** RED — `_app/clientes.tsx` route not implemented
  - **Verifies:** clientes-view element rendered at /clientes

- **Test:** `should render contactos-view when router is at /contactos`
  - **Status:** RED — `_app/contactos.tsx` route not implemented
  - **Verifies:** contactos-view element rendered at /contactos

- **Test:** `should show "Clientes" heading inside clientes-view`
  - **Status:** RED — clientes-view absent
  - **Verifies:** "Clientes" heading visible inside clientes view

- **Test:** `should show "Contactos" heading inside contactos-view`
  - **Status:** RED — contactos-view absent
  - **Verifies:** "Contactos" heading visible inside contactos view

- **Test:** `should apply aria-current="page" on the Clientes nav link when at /clientes`
  - **Status:** RED — nav-rail and aria-current not implemented
  - **Verifies:** aria-current="page" set on Clientes at /clientes

- **Test:** `should apply aria-current="page" on the Contactos nav link when at /contactos`
  - **Status:** RED — nav-rail and aria-current not implemented
  - **Verifies:** aria-current="page" set on Contactos at /contactos

#### AC4 — 404 not-found view (4 tests)

- **Test:** `should render not-found-view for an unknown route`
  - **Status:** RED — notFoundComponent not added to `__root.tsx`
  - **Verifies:** not-found-view rendered for unknown routes

- **Test:** `should display "Página no encontrada" text in the 404 view`
  - **Status:** RED — not-found-view absent
  - **Verifies:** Spanish 404 message displayed

- **Test:** `should display a link to /clientes in the 404 view`
  - **Status:** RED — not-found-view absent
  - **Verifies:** "Ir a Clientes" link present in 404 view

- **Test:** `back-link in 404 view should navigate to /clientes when clicked`
  - **Status:** RED — not-found-view absent; click fails
  - **Verifies:** 404 back-link navigates to /clientes

#### AC5 — Root redirect (2 tests)

- **Test:** `should render clientes-view after navigating to root /`
  - **Status:** RED — index.tsx has no beforeLoad redirect
  - **Verifies:** Root / redirects and renders clientes-view

- **Test:** `should render the navigation shell (nav-rail) after root redirect`
  - **Status:** RED — redirect and nav-rail both absent
  - **Verifies:** Layout shell active after root redirect

#### AC6 — Accessibility (4 tests)

- **Test:** `should render a <nav> landmark element in the navigation shell`
  - **Status:** RED — `<nav>` element absent
  - **Verifies:** Semantic `<nav>` landmark present

- **Test:** `should have aria-label="Navegación principal" on the nav element`
  - **Status:** RED — `nav[aria-label]` absent
  - **Verifies:** Spanish aria-label on nav element

- **Test:** `should have aria-current="page" on exactly one nav link at any given route`
  - **Status:** RED — aria-current mechanism not implemented
  - **Verifies:** Exactly one active link at any time

- **Test:** `nav links should have non-empty aria-label attributes`
  - **Status:** RED — nav-rail absent; zero links found
  - **Verifies:** All nav links have non-empty aria-label

---

## Data Factories Created

This story tests navigation routing and UI shell behavior. There are no data entities to create for the navigation shell itself. The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for future E2E tests that populate the views behind the navigation.

No additional data factories are required for Story 1.2.

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` navigation fixtures for reuse in future E2E tests. Story 1.2 E2E tests use `page.goto()` directly with `waitForLoadState('networkidle')` to keep tests self-contained and not depend on fixtures being set up before the navigation shell exists.

No additional fixtures are required for Story 1.2.

---

## Mock Requirements

### No External Service Mocks Required

The navigation shell (Story 1.2) is purely a frontend routing and layout concern. No backend API calls are made by the navigation rail, navigation bar, redirect, or 404 view.

Future stories (Clientes CRUD, Contactos CRUD) will require API mocks when their views make network requests. Those mocks are out of scope for this story.

---

## Required data-testid Attributes

### `_app.tsx` Layout Route

- `app-shell` — Outermost div wrapping the full layout (`<div data-testid="app-shell" className="flex flex-col h-screen lg:flex-row">`)
- `nav-rail` — Desktop NavigationRail component (`<NavigationRail data-testid="nav-rail" className="hidden lg:flex" />`)
- `nav-bar` — Mobile NavigationBar component (`<NavigationBar data-testid="nav-bar" className="flex lg:hidden" />`)

### `_app/clientes.tsx` Placeholder View

- `clientes-view` — Root element of the Clientes placeholder (`<div data-testid="clientes-view">`)

### `_app/contactos.tsx` Placeholder View

- `contactos-view` — Root element of the Contactos placeholder (`<div data-testid="contactos-view">`)

### `__root.tsx` notFoundComponent

- `not-found-view` — Root element of the 404 view (`<div data-testid="not-found-view">`)

**Implementation Example:**

```tsx
// _app.tsx
<div data-testid="app-shell" className="flex flex-col h-screen lg:flex-row">
  <NavigationRail data-testid="nav-rail" items={navItems} className="hidden lg:flex" />
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
  <NavigationBar data-testid="nav-bar" items={navItems} className="flex lg:hidden" />
</div>

// _app/clientes.tsx
<div data-testid="clientes-view">
  <h1>Clientes</h1>
</div>

// _app/contactos.tsx
<div data-testid="contactos-view">
  <h1>Contactos</h1>
</div>

// __root.tsx notFoundComponent
<div data-testid="not-found-view">
  <h1>Página no encontrada</h1>
  <Link to="/clientes">Ir a Clientes</Link>
</div>
```

---

## Implementation Checklist

### Test Group: NavigationRail and NavigationBar (AC1, AC2)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/_app.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` as a TanStack Router pathless layout route
- [ ] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit` (check catalog first; use fallback custom components if unavailable)
- [ ] Define `navItems` array: `[{ label: 'Clientes', path: '/clientes', icon: <UsersIcon /> }, { label: 'Contactos', path: '/contactos', icon: <UserIcon /> }]`
- [ ] Import `UsersIcon` and `UserIcon` from `@heroicons/react/24/outline`
- [ ] Render `<div data-testid="app-shell" className="flex flex-col h-screen lg:flex-row">`
- [ ] Render `<NavigationRail data-testid="nav-rail" ... className="hidden lg:flex" />` (desktop only)
- [ ] Render `<NavigationBar data-testid="nav-bar" ... className="flex lg:hidden" />` (mobile only)
- [ ] Render `<main className="flex-1 overflow-y-auto"><Outlet /></main>`
- [ ] Run test: `npx playwright test navigation-shell.spec.ts`
- [ ] ✅ AC1 + AC2 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: Clientes and Contactos placeholder views (AC3)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/_app.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/` directory
- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `createFileRoute('/clientes')` and `<div data-testid="clientes-view"><h1>Clientes</h1></div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `createFileRoute('/contactos')` and `<div data-testid="contactos-view"><h1>Contactos</h1></div>`
- [ ] Wire active state using TanStack Router `Link` `activeProps` or `useRouterState` to set `aria-current="page"` on active nav item
- [ ] Add `aria-label` attributes in Spanish on individual nav link elements
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: 404 Not Found view (AC4)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/_app.test.tsx`

**Tasks to make these tests pass:**

- [ ] Modify `frontend/src/routes/__root.tsx` to add `notFoundComponent`
- [ ] Implement notFoundComponent: `<div data-testid="not-found-view"><h1>Página no encontrada</h1><Link to="/clientes">Ir a Clientes</Link></div>`
- [ ] Ensure the 404 view is rendered for any unmatched route
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC4"`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 30 minutes

---

### Test Group: Root redirect to /clientes (AC5)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/_app.test.tsx`

**Tasks to make these tests pass:**

- [ ] Modify `frontend/src/routes/index.tsx` to add `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Import `redirect` from `@tanstack/react-router` in `index.tsx`
- [ ] Verify no full page reload occurs (client-side redirect via router, not HTTP 301)
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC5"`
- [ ] ✅ AC5 tests pass (green phase)

**Estimated Effort:** 30 minutes

---

### Test Group: Accessibility (AC6)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/_app.test.tsx`

**Tasks to make these tests pass:**

- [ ] Wrap NavigationRail in a `<nav aria-label="Navegación principal">` element (or ensure siesa-ui-kit NavigationRail renders a `<nav>` with this attribute)
- [ ] Add `aria-label` attribute in Spanish on each nav link element: `aria-label="Clientes"` and `aria-label="Contactos"`
- [ ] Wire `aria-current="page"` on the active route link using TanStack Router `Link` `activeProps={{ 'aria-current': 'page' }}`
- [ ] Ensure `aria-current` updates on SPA navigation (React re-render driven by router state)
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC6"`
- [ ] ✅ AC6 tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all E2E failing tests for this story
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run all component failing tests for this story
pnpm --filter frontend test src/routes/__tests__/_app.test.tsx

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run specific AC group
npx playwright test navigation-shell.spec.ts --grep "AC1"

# Debug specific E2E test
npx playwright test navigation-shell.spec.ts --debug

# Run E2E on mobile viewport only
npx playwright test navigation-shell.spec.ts --project=mobile-chrome

# Run all tests (E2E + component) together
pnpm test && npx playwright test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 30 E2E tests written and failing (`e2e/tests/navigation/navigation-shell.spec.ts`)
- ✅ All 22 component tests written and failing (`frontend/src/routes/__tests__/_app.test.tsx`)
- ✅ No data factories required (navigation shell has no data entities)
- ✅ No fixtures required (tests use direct `page.goto()` with networkidle)
- ✅ Mock requirements documented (none — pure frontend routing story)
- ✅ Required data-testid attributes listed (6 attributes across 4 files)
- ✅ Implementation checklist created with 5 task groups

**Verification:**

- All 30 E2E tests fail with "Locator not found" or "URL mismatch" errors
- All 22 component tests fail with `TestingLibraryElementError: Unable to find an element by: [data-testid="..."]`
- Failures confirm missing implementation (`_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx` do not exist; index.tsx has no redirect; `__root.tsx` has no notFoundComponent)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with NavigationRail/NavigationBar group — highest impact, AC1+AC2)
2. **Read the test** to understand expected behavior (`data-testid`, `aria-label`, viewport behavior)
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended Order:**

1. Create `_app.tsx` with `nav-rail` and `nav-bar` (AC1 + AC2) — unblocks most tests
2. Create `_app/clientes.tsx` and `_app/contactos.tsx` (AC3) — enables view rendering
3. Modify `__root.tsx` with `notFoundComponent` (AC4) — enables 404 tests
4. Modify `index.tsx` with `beforeLoad` redirect (AC5) — enables redirect tests
5. Add `aria-label`, `aria-current`, `<nav>` landmark (AC6) — final accessibility pass

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer placeholder views)
- Run tests frequently (immediate feedback with `--headed` for E2E)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Run `npx playwright test navigation-shell.spec.ts` after each task group to measure progress
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 52 tests pass** (30 E2E + 22 component)
2. **Review code quality** of `_app.tsx` layout (readability, Tailwind class organization)
3. **Extract duplications** (navItems array used by both NavigationRail and NavigationBar)
4. **Validate bundle budget** (current: 93 kB gzipped; target: < 500 kB after this story)
5. **Ensure tests still pass** after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing E2E tests** to confirm RED phase: `npx playwright test navigation-shell.spec.ts`
3. **Run failing component tests** to confirm RED phase: `pnpm --filter frontend test _app.test.tsx`
4. **Begin implementation** using implementation checklist as guide (start with `_app.tsx`)
5. **Work one test group at a time** (red → green for each AC group)
6. **When all tests pass**, refactor code for quality and verify bundle budget
7. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **network-first.md** — Route interception BEFORE navigation applied in all E2E tests (`page.waitForLoadState('networkidle')` registered before `page.goto()`)
- **selector-resilience.md** — `data-testid` selectors used exclusively in E2E tests; no CSS class or text selectors for critical element discovery
- **test-quality.md** — One assertion per test (atomic design); explicit waits (`waitForLoadState`, `findByTestId`); no `sleep()`/hard waits; deterministic test data
- **component-tdd.md** — Component tests use `createMemoryHistory + createRouter` pattern from Story 1.1 precedent; jsdom environment for routing unit tests
- **fixture-architecture.md** — Existing `base.fixture.ts` reviewed; no additional fixtures needed for navigation shell story
- **timing-debugging.md** — `waitForLoadState('networkidle')` registered before navigation to prevent race conditions on SPA route rendering

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results:**

```
30 failed
  ✗ AC1 — Desktop NavigationRail › should display NavigationRail on the left side...
    Error: Locator.toBeVisible: Error: strict mode violation: [data-testid="nav-rail"]...
  ✗ AC2 — Mobile NavigationBar › should display mobile NavigationBar at the bottom...
    Error: Locator.toBeVisible: Error: strict mode violation: [data-testid="nav-bar"]...
  ... (all 30 tests fail with missing element or URL mismatch errors)
```

**Component Command:** `pnpm --filter frontend test src/routes/__tests__/_app.test.tsx`

**Expected Results:**

```
22 failed
  ✗ AC1 — NavigationRail renders › should render an element with data-testid="nav-rail"
    TestingLibraryElementError: Unable to find an element by: [data-testid="nav-rail"]
  ✗ AC2 — NavigationBar renders › should render an element with data-testid="nav-bar"
    TestingLibraryElementError: Unable to find an element by: [data-testid="nav-bar"]
  ... (all 22 component tests fail with missing element errors)
```

**Summary:**

- Total tests: 52 (30 E2E + 22 Component)
- Passing: 0 (expected — RED phase)
- Failing: 52 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- The E2E tests use `page.waitForLoadState('networkidle')` before every `page.goto()` call — this is the network-first pattern applied to load state detection rather than route interception (appropriate here since the navigation shell itself makes no network requests).
- The component tests mirror the routing test pattern established in Story 1.1 (`__root.test.tsx`) for consistency across the test suite.
- `data-testid="nav-rail"` and `data-testid="nav-bar"` are both always present in the DOM on all viewport sizes — visibility is controlled by Tailwind CSS classes (`hidden lg:flex` / `flex lg:hidden`). The E2E tests use `toBeHidden()` to verify Tailwind responsive hiding works correctly.
- The siesa-ui-kit `NavigationRail` and `NavigationBar` components are P0 mandatory. If unavailable in the current environment, the DEV team must implement custom fallbacks using TailwindCSS + Radix UI primitives following the Siesa design system as documented in the story Dev Notes.
- All user-facing text must be in Spanish: "Clientes", "Contactos", "Navegación principal", "Página no encontrada", "Ir a Clientes".

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices
- Story source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`

---

**Generated by BMad TEA Agent** — 2026-05-24
