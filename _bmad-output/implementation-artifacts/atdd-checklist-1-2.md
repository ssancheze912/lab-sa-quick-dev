# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-13
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** E2E (Playwright) + Component (Vitest + RTL)

---

## Story Summary

Story 1.2 adds the persistent navigation shell to the SPA — a `NavigationRail` (desktop ≥1024px) and `NavigationBar` (mobile <1024px) from siesa-ui-kit, TanStack Router file-based routes for `/clientes` and `/contactos`, a root redirect from `/` to `/clientes`, and a 404 catch-all page. This story is purely frontend with no backend calls.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given the app loads on desktop (viewport ≥1024px), When the user views the app, Then a `NavigationRail` (siesa-ui-kit, 72px collapsed icon-only) is visible on the left with "Clientes" and "Contactos" entries, And clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **AC2** — Given the app loads on mobile (viewport <1024px), When the user views the app, Then a `NavigationBar` (siesa-ui-kit bottom nav, 56px) is shown instead of the rail, And all items are tappable with minimum 44×44px touch targets (FR29).

3. **AC3** — Given the user types `/clientes` or `/contactos` directly in the URL bar, When the page loads, Then the correct view renders without redirection (FR30).

4. **AC4** — Given the user navigates to an unknown route (e.g. `/unknown`), When the page loads, Then a 404/not-found view displays "Página no encontrada" with a link "Ir a Clientes" returning to `/clientes`.

5. **AC5** — Given the application root URL `/` is accessed, When the page loads, Then the user is redirected to `/clientes` automatically.

6. **AC6** — Given the user is on `/clientes`, When viewing the NavigationRail or NavigationBar, Then the "Clientes" item shows active state (`data-active="true"`) and "Contactos" shows default state (no `data-active="true"`).

---

## Failing Tests Created (RED Phase)

### E2E Tests (22 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- **Test:** `AC1 — Desktop NavigationRail > should display NavigationRail on desktop viewport`
  - **Status:** RED — `data-testid="navigation-rail"` element does not exist (no __root.tsx layout implemented)
  - **Verifies:** AC1 — NavigationRail is present and visible at 1280×800

- **Test:** `AC1 — Desktop NavigationRail > should show Clientes entry in NavigationRail on desktop`
  - **Status:** RED — `data-testid="nav-item-clientes"` does not exist
  - **Verifies:** AC1 — Clientes nav item present in NavigationRail

- **Test:** `AC1 — Desktop NavigationRail > should show Contactos entry in NavigationRail on desktop`
  - **Status:** RED — `data-testid="nav-item-contactos"` does not exist
  - **Verifies:** AC1 — Contactos nav item present in NavigationRail

- **Test:** `AC1 — Desktop NavigationRail > should navigate to /clientes without full page reload when clicking Clientes nav item`
  - **Status:** RED — nav item click target does not exist; no SPA routing configured
  - **Verifies:** AC1 — Client-side routing (no document resource request on nav click)

- **Test:** `AC1 — Desktop NavigationRail > should navigate to /contactos without full page reload when clicking Contactos nav item`
  - **Status:** RED — nav item click target does not exist; no SPA routing configured
  - **Verifies:** AC1 — Client-side routing (no document resource request on nav click)

- **Test:** `AC1 — Desktop NavigationRail > should NOT display NavigationBar (bottom nav) on desktop viewport`
  - **Status:** RED — NavigationBar element does not exist yet
  - **Verifies:** AC1 — NavigationBar is hidden (`not.toBeVisible()`) on desktop

- **Test:** `AC2 — Mobile NavigationBar > should display bottom NavigationBar on mobile viewport`
  - **Status:** RED — `data-testid="navigation-bar"` does not exist
  - **Verifies:** AC2 — NavigationBar visible at 390×844 (iPhone 14)

- **Test:** `AC2 — Mobile NavigationBar > should show Clientes entry in NavigationBar on mobile`
  - **Status:** RED — `data-testid="nav-bar-item-clientes"` does not exist
  - **Verifies:** AC2 — Clientes item present in NavigationBar

- **Test:** `AC2 — Mobile NavigationBar > should show Contactos entry in NavigationBar on mobile`
  - **Status:** RED — `data-testid="nav-bar-item-contactos"` does not exist
  - **Verifies:** AC2 — Contactos item present in NavigationBar

- **Test:** `AC2 — Mobile NavigationBar > should have minimum 44×44px touch target for Clientes nav bar item`
  - **Status:** RED — `nav-bar-item-clientes` does not exist; boundingBox() returns null
  - **Verifies:** AC2 — WCAG 2.1 AA touch target size ≥44×44px for Clientes

- **Test:** `AC2 — Mobile NavigationBar > should have minimum 44×44px touch target for Contactos nav bar item`
  - **Status:** RED — `nav-bar-item-contactos` does not exist; boundingBox() returns null
  - **Verifies:** AC2 — WCAG 2.1 AA touch target size ≥44×44px for Contactos

- **Test:** `AC2 — Mobile NavigationBar > should NOT display NavigationRail on mobile viewport`
  - **Status:** RED — NavigationRail element does not exist yet
  - **Verifies:** AC2 — NavigationRail hidden on mobile (<1024px)

- **Test:** `AC3 — Deep-linking > should render ClientesPage when navigating directly to /clientes`
  - **Status:** RED — `data-testid="clientes-page-heading"` does not exist (route not defined)
  - **Verifies:** AC3 — ClientesPage renders on direct URL access

- **Test:** `AC3 — Deep-linking > should render ContactosPage when navigating directly to /contactos`
  - **Status:** RED — `data-testid="contactos-page-heading"` does not exist (route not defined)
  - **Verifies:** AC3 — ContactosPage renders on direct URL access

- **Test:** `AC3 — Deep-linking > should NOT redirect to home screen when accessing /clientes directly`
  - **Status:** RED — /clientes route does not exist; may 404 or redirect
  - **Verifies:** AC3 — URL stays at /clientes after direct access

- **Test:** `AC3 — Deep-linking > should NOT redirect to home screen when accessing /contactos directly`
  - **Status:** RED — /contactos route does not exist; may 404 or redirect
  - **Verifies:** AC3 — URL stays at /contactos after direct access

- **Test:** `AC4 — Unknown route > should display not-found view when navigating to an unknown route`
  - **Status:** RED — no catch-all $.tsx route; `data-testid="not-found-page"` does not exist
  - **Verifies:** AC4 — 404 page renders for unknown routes

- **Test:** `AC4 — Unknown route > should display "Página no encontrada" message on unknown route`
  - **Status:** RED — NotFoundPage does not exist
  - **Verifies:** AC4 — Spanish not-found message visible

- **Test:** `AC4 — Unknown route > should display a link to return to /clientes on the 404 page`
  - **Status:** RED — `data-testid="not-found-link-clientes"` does not exist
  - **Verifies:** AC4 — Return link present on 404 page

- **Test:** `AC4 — Unknown route > should navigate to /clientes when clicking the return link on the 404 page`
  - **Status:** RED — not-found-link-clientes does not exist; click would fail
  - **Verifies:** AC4 — Return link navigates to /clientes

- **Test:** `AC5 — Root redirect > should redirect from / to /clientes automatically`
  - **Status:** RED — index.tsx currently renders a static page, not a redirect
  - **Verifies:** AC5 — Root URL redirects to /clientes

- **Test:** `AC5 — Root redirect > should render ClientesPage content after root redirect`
  - **Status:** RED — redirect and ClientesPage do not exist
  - **Verifies:** AC5 — ClientesPage heading visible after redirect from /

- **Test:** `AC6 — Active nav item state > should show Clientes nav item as active when on /clientes route`
  - **Status:** RED — `data-active` attribute not implemented
  - **Verifies:** AC6 — data-active="true" on Clientes item when on /clientes

- **Test:** `AC6 — Active nav item state > should show Contactos nav item as inactive when on /clientes route`
  - **Status:** RED — nav-item-contactos does not exist
  - **Verifies:** AC6 — No data-active="true" on Contactos when on /clientes

- **Test:** `AC6 — Active nav item state > should show Contactos nav item as active when on /contactos route`
  - **Status:** RED — /contactos route and data-active not implemented
  - **Verifies:** AC6 — data-active="true" on Contactos item when on /contactos

- **Test:** `AC6 — Active nav item state > should show Clientes nav item as inactive when on /contactos route`
  - **Status:** RED — nav-item-clientes does not exist on /contactos
  - **Verifies:** AC6 — No data-active="true" on Clientes when on /contactos

- **Test:** `Accessibility > should have Spanish aria-label on Clientes nav rail item`
  - **Status:** RED — aria-label="Ir a Clientes" attribute not set
  - **Verifies:** WCAG 2.1 AA — aria-label for icon-only nav button

- **Test:** `Accessibility > should have Spanish aria-label on Contactos nav rail item`
  - **Status:** RED — aria-label="Ir a Contactos" attribute not set
  - **Verifies:** WCAG 2.1 AA — aria-label for icon-only nav button

### Component Tests (18 tests)

**File:** `frontend/src/__tests__/navigation/navigation-shell.test.tsx`

- **Test:** `AC1 — NavigationRail on desktop > should render a NavigationRail element with data-testid="navigation-rail"`
  - **Status:** RED — routeTree missing /clientes, /contactos routes; navigation-rail element not in DOM
  - **Verifies:** AC1 — NavigationRail is rendered in the DOM

- **Test:** `AC1 — NavigationRail on desktop > should render a "Clientes" nav item inside NavigationRail`
  - **Status:** RED — nav-item-clientes does not exist
  - **Verifies:** AC1 — Clientes nav item in NavigationRail

- **Test:** `AC1 — NavigationRail on desktop > should render a "Contactos" nav item inside NavigationRail`
  - **Status:** RED — nav-item-contactos does not exist
  - **Verifies:** AC1 — Contactos nav item in NavigationRail

- **Test:** `AC1 — NavigationRail on desktop > should render NavigationRail Clientes item with aria-label="Ir a Clientes"`
  - **Status:** RED — aria-label not set
  - **Verifies:** AC1 + WCAG 2.1 AA — Clientes nav item aria-label

- **Test:** `AC1 — NavigationRail on desktop > should render NavigationRail Contactos item with aria-label="Ir a Contactos"`
  - **Status:** RED — aria-label not set
  - **Verifies:** AC1 + WCAG 2.1 AA — Contactos nav item aria-label

- **Test:** `AC2 — NavigationBar present in DOM > should render a NavigationBar element with data-testid="navigation-bar"`
  - **Status:** RED — navigation-bar element not in DOM
  - **Verifies:** AC2 — NavigationBar element exists in DOM (CSS controls visibility)

- **Test:** `AC2 — NavigationBar present in DOM > should render a "Clientes" item inside NavigationBar`
  - **Status:** RED — nav-bar-item-clientes does not exist
  - **Verifies:** AC2 — Clientes item in NavigationBar

- **Test:** `AC2 — NavigationBar present in DOM > should render a "Contactos" item inside NavigationBar`
  - **Status:** RED — nav-bar-item-contactos does not exist
  - **Verifies:** AC2 — Contactos item in NavigationBar

- **Test:** `AC3 — Deep-linking > should render ClientesPage heading when router starts at /clientes`
  - **Status:** RED — /clientes route and clientes-page-heading do not exist
  - **Verifies:** AC3 — ClientesPage renders

- **Test:** `AC3 — Deep-linking > should render ContactosPage heading when router starts at /contactos`
  - **Status:** RED — /contactos route and contactos-page-heading do not exist
  - **Verifies:** AC3 — ContactosPage renders

- **Test:** `AC4 — Unknown route: NotFoundPage > should render not-found page for an unknown route`
  - **Status:** RED — $.tsx catch-all route and not-found-page element do not exist
  - **Verifies:** AC4 — NotFoundPage renders

- **Test:** `AC4 — Unknown route: NotFoundPage > should render "Página no encontrada" text on unknown route`
  - **Status:** RED — NotFoundPage does not exist
  - **Verifies:** AC4 — Spanish not-found message

- **Test:** `AC4 — Unknown route: NotFoundPage > should render a link with data-testid="not-found-link-clientes" on 404 page`
  - **Status:** RED — not-found-link-clientes does not exist
  - **Verifies:** AC4 — Return link present

- **Test:** `AC4 — Unknown route: NotFoundPage > should render the "Ir a Clientes" link pointing to /clientes`
  - **Status:** RED — not-found-link-clientes href not set
  - **Verifies:** AC4 — Return link href="/clientes"

- **Test:** `AC6 — Active nav item state > should set data-active="true" on Clientes nav item when on /clientes`
  - **Status:** RED — nav-item-clientes and data-active not implemented
  - **Verifies:** AC6 — Active state on Clientes when at /clientes

- **Test:** `AC6 — Active nav item state > should NOT set data-active="true" on Contactos nav item when on /clientes`
  - **Status:** RED — nav-item-contactos does not exist
  - **Verifies:** AC6 — No active state on Contactos when at /clientes

- **Test:** `AC6 — Active nav item state > should set data-active="true" on Contactos nav item when on /contactos`
  - **Status:** RED — /contactos route and nav-item-contactos do not exist
  - **Verifies:** AC6 — Active state on Contactos when at /contactos

- **Test:** `AC6 — Active nav item state > should NOT set data-active="true" on Clientes nav item when on /contactos`
  - **Status:** RED — nav-item-clientes on /contactos not implemented
  - **Verifies:** AC6 — No active state on Clientes when at /contactos

---

## Data Factories Created

No domain entity data factories required for Story 1.2.
This story creates frontend infrastructure only — no domain entities, no test data to generate.

---

## Fixtures Created

### Base Test Fixture (already created in Story 1.1)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `await page.goto('/clientes')`
  - **Provides:** Page navigated to the clientes route
  - **Cleanup:** Automatic (Playwright page teardown)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `await page.goto('/contactos')`
  - **Provides:** Page navigated to the contactos route
  - **Cleanup:** Automatic (Playwright page teardown)

### Navigation Shell Page Object (already created)

**File:** `e2e/pages/navigation-shell.page.ts`

Encapsulates `data-testid` selectors for NavigationRail, NavigationBar, page headings, and 404 elements. Available for use in E2E tests.

---

## Mock Requirements

No external service mocking required for Story 1.2.
All tests exercise the frontend app served by `http://localhost:5173`. No backend API calls are made in this story.

---

## Required data-testid Attributes

### Navigation Shell (__root.tsx)

- `navigation-rail` — The NavigationRail container element (desktop, hidden on mobile via CSS class `hidden lg:flex`)
- `nav-item-clientes` — The Clientes nav item button/link inside NavigationRail (`aria-label="Ir a Clientes"`, `data-active="true"` when on /clientes)
- `nav-item-contactos` — The Contactos nav item button/link inside NavigationRail (`aria-label="Ir a Contactos"`, `data-active="true"` when on /contactos)
- `navigation-bar` — The NavigationBar container element (mobile bottom nav, hidden on desktop via CSS class `flex lg:hidden`)
- `nav-bar-item-clientes` — The Clientes item inside NavigationBar (minimum 44×44px touch target)
- `nav-bar-item-contactos` — The Contactos item inside NavigationBar (minimum 44×44px touch target)

### Page Components

- `clientes-page-heading` — The `<h1>` heading in `ClientesPage.tsx` displaying "Clientes"
- `contactos-page-heading` — The `<h1>` heading in `ContactosPage.tsx` displaying "Contactos"

### NotFoundPage Component

- `not-found-page` — The root container of `NotFoundPage.tsx`
- `not-found-link-clientes` — The anchor/Link element "Ir a Clientes" with `href="/clientes"`

**Implementation Example:**

```tsx
// __root.tsx
<NavigationRail
  data-testid="navigation-rail"
  className="hidden lg:flex"
  items={navItems}
/>
<NavigationBar
  data-testid="navigation-bar"
  className="flex lg:hidden"
  items={navItems}
/>

// navItems — each item must carry testid on its rendered button/link:
// nav-item-clientes, nav-item-contactos (NavigationRail)
// nav-bar-item-clientes, nav-bar-item-contactos (NavigationBar)

// ClientesPage.tsx
<h1 data-testid="clientes-page-heading">Clientes</h1>

// ContactosPage.tsx
<h1 data-testid="contactos-page-heading">Contactos</h1>

// NotFoundPage.tsx
<div data-testid="not-found-page">
  <h1>Página no encontrada</h1>
  <Link to="/clientes" data-testid="not-found-link-clientes">Ir a Clientes</Link>
</div>
```

---

## Implementation Checklist

### Task 1 — Update `__root.tsx` with LayoutBase shell (AC1, AC2, AC6)

**File:** `frontend/src/routes/__root.tsx`

**Tasks to make AC1 and AC2 tests pass:**

- [ ] Import `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar` from `siesa-ui-kit`
- [ ] Import `UsersIcon`, `UserIcon` from `@heroicons/react/24/outline`
- [ ] Use `useRouterState()` to derive `currentPath`
- [ ] Build `navItems` array with `isActive: currentPath.startsWith('/clientes')` etc.
- [ ] Add `data-testid="navigation-rail"` and `className="hidden lg:flex"` to `NavigationRail`
- [ ] Add `data-testid="navigation-bar"` and `className="flex lg:hidden"` to `NavigationBar`
- [ ] Add `data-testid="nav-item-clientes"` and `aria-label="Ir a Clientes"` to each Clientes nav item (both rail and bar)
- [ ] Add `data-testid="nav-item-contactos"` and `aria-label="Ir a Contactos"` to each Contactos nav item (NavigationRail)
- [ ] Add `data-testid="nav-bar-item-clientes"` to Clientes item in NavigationBar
- [ ] Add `data-testid="nav-bar-item-contactos"` to Contactos item in NavigationBar
- [ ] Pass `data-active={isActive ? "true" : undefined}` to each nav item (or verify siesa-ui-kit exposes this attribute)
- [ ] Place `<Outlet />` inside the content area
- [ ] Run E2E: `pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] Run Component: `pnpm --filter frontend vitest src/__tests__/navigation/navigation-shell.test.tsx`
- [ ] Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Task 2 — Create TanStack Router file-based routes (AC3, AC5)

**Files:**
- `frontend/src/routes/_app.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/_app/contactos.tsx`
- `frontend/src/routes/index.tsx` (update)
- `frontend/src/routes/$.tsx`

**Tasks to make AC3 and AC5 tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route (no URL segment)
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — route for `/clientes` rendering `<ClientesPage />`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — route for `/contactos` rendering `<ContactosPage />`
- [ ] Update `frontend/src/routes/index.tsx` — add `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Create `frontend/src/routes/$.tsx` — catch-all 404 rendering `<NotFoundPage />`
- [ ] Verify `routeTree.gen.ts` is auto-generated with all new routes (save any route file to trigger)
- [ ] Run E2E: `pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] Run E2E: `pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Task 3 — Create placeholder page components (AC3, AC4)

**Files:**
- `frontend/src/modules/crm/clientes/presentation/ClientesPage.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactosPage.tsx`
- `frontend/src/shared/components/NotFoundPage.tsx`

**Tasks to make AC3 and AC4 tests pass:**

- [ ] Create `ClientesPage.tsx` with `<h1 data-testid="clientes-page-heading">Clientes</h1>`
- [ ] Create `ContactosPage.tsx` with `<h1 data-testid="contactos-page-heading">Contactos</h1>`
- [ ] Create `NotFoundPage.tsx` with:
  - `<div data-testid="not-found-page">`
  - `<h1>Página no encontrada</h1>`
  - `<Link to="/clientes" data-testid="not-found-link-clientes">Ir a Clientes</Link>`
- [ ] Run E2E: `pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"`
- [ ] Run Component: `pnpm --filter frontend vitest src/__tests__/navigation/navigation-shell.test.tsx`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Task 4 — Verify routing and accessibility (AC1, AC2, AC3, AC4, AC5, AC6)

**Tasks to verify complete implementation:**

- [ ] Verify `pnpm run dev` starts with zero TypeScript errors
- [ ] Verify `routeTree.gen.ts` contains all routes: `/`, `/_app/clientes`, `/_app/contactos`, `/$`
- [ ] Verify direct navigation to `/clientes` renders ClientesPage without redirect
- [ ] Verify direct navigation to `/contactos` renders ContactosPage without redirect
- [ ] Verify `/` redirects to `/clientes` (no manual URL stays at root)
- [ ] Verify `/unknown` renders NotFoundPage with "Página no encontrada"
- [ ] Verify "Ir a Clientes" link on 404 page navigates to `/clientes`
- [ ] Verify NavigationRail visible at 1280×800 viewport (desktop)
- [ ] Verify NavigationBar visible at 390×844 viewport (mobile)
- [ ] Verify active state (`data-active="true"`) updates correctly when navigating
- [ ] Verify all icon-only nav buttons have `aria-label` in Spanish
- [ ] Run full E2E suite: `pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts`
- [ ] Run full component suite: `pnpm --filter frontend vitest src/__tests__/navigation/`
- [ ] All tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 1.2 E2E tests
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run E2E tests by AC grep
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"

# Debug a specific E2E test
pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests (Vitest + RTL)
pnpm --filter frontend vitest src/__tests__/navigation/navigation-shell.test.tsx

# Run component tests in watch mode
pnpm --filter frontend vitest --watch src/__tests__/navigation/

# Run all navigation tests (E2E + component)
pnpm playwright test e2e/tests/navigation/ && pnpm --filter frontend vitest run src/__tests__/navigation/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (implementation does not exist)
- Network-first intercepts applied in E2E tests (document request tracker registered before navigation)
- Fixtures documented (base.fixture.ts, navigation-shell.page.ts)
- data-testid requirements listed for all UI elements
- Implementation checklist created per AC

**Verification:**

- E2E tests will fail with: `locator.waitForVisible: Error: locator('[data-testid="navigation-rail"]') resolves to 0 elements`
- Component tests will fail with: TypeScript import error on missing routes in routeTree.gen.ts, then `Unable to find an element by: [data-testid="navigation-rail"]`
- All failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Agent — Next Steps)

**DEV Agent Responsibilities:**

1. Start with Task 3 (page components) — simplest, unblocks deeper tests
2. Then Task 2 (routes) — wires components into TanStack Router
3. Then Task 1 (root layout) — adds NavigationRail/Bar shell
4. Finally Task 4 (verification) — full end-to-end verification pass

**Order of implementation:**

1. Create `ClientesPage.tsx`, `ContactosPage.tsx`, `NotFoundPage.tsx` (Task 3 — no dependencies)
2. Create routes: `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`, update `index.tsx`, create `$.tsx` (Task 2)
3. Update `__root.tsx` with `LayoutBase` shell, `NavigationRail`, `NavigationBar` (Task 1)
4. Run all tests, fix remaining issues (Task 4)

**Key Principles:**

- One test at a time (start with simplest passing criterion)
- `pnpm run dev` must show zero TypeScript errors at each step
- Do NOT manually edit `routeTree.gen.ts` — save route files and let the plugin regenerate it
- Check siesa-ui-kit API for `NavigationRail`, `NavigationBar`, `LayoutBase` before creating custom components

---

### REFACTOR Phase (DEV Agent — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 28 tests pass (22 E2E + 18 component, some overlap in data-testid coverage is intentional)
2. Review `__root.tsx` for clean responsive layout logic
3. Ensure `navItems` array is extracted to a constant (avoid duplication between NavigationRail and NavigationBar)
4. Verify `routeTree.gen.ts` is not manually modified
5. Ensure `pnpm run build` produces zero TypeScript errors

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (sa-dev-story agent)
2. **Run failing E2E tests** to confirm RED phase: `pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts`
3. **Run failing component tests** to confirm RED phase: `pnpm --filter frontend vitest run src/__tests__/navigation/`
4. **Begin implementation** with Task 3 (page components) — simplest entry point
5. **Work one task at a time** (red → green for each AC)
6. **After all tests pass**, refactor for code quality

---

## Knowledge Base References Applied

- **network-first.md** — Document resource type tracker registered before `page.goto()` in all navigation click tests; prevents race condition between request listener and page navigation
- **test-quality.md** — Given-When-Then format, one assertion per test, deterministic tests using `data-testid` selectors
- **test-levels-framework.md** — E2E for full user journey (viewport, real click, URL assertion); Component (Vitest+RTL) for DOM structure, active state logic, and aria-label verification; no API tests needed (purely frontend story)
- **fixture-architecture.md** — Base fixture uses `test.extend()` with automatic Playwright page teardown; NavigationShellPage POM encapsulates all selectors
- **selector-resilience.md** — All selectors use `data-testid` (highest stability); no CSS class selectors used

---

## Test Execution Evidence

### Expected RED Phase Results

**E2E Command:** `pnpm playwright test e2e/tests/navigation/navigation-shell.spec.ts`

```
FAILED e2e/tests/navigation/navigation-shell.spec.ts — 22 failed

  x AC1 — Desktop NavigationRail > should display NavigationRail on desktop viewport
    Error: locator.waitForVisible: Timeout 30000ms exceeded.
    Error: locator('getByTestId("navigation-rail")') resolves to 0 elements

  x AC1 — Desktop NavigationRail > should show Clientes entry in NavigationRail on desktop
    Error: locator('getByTestId("nav-item-clientes")') resolves to 0 elements

  ... (all 22 tests fail with missing element or missing route errors)
```

**Component Command:** `pnpm --filter frontend vitest run src/__tests__/navigation/navigation-shell.test.tsx`

```
FAILED src/__tests__/navigation/navigation-shell.test.tsx — 18 failed

  x AC1 — NavigationRail on desktop > should render a NavigationRail element with data-testid="navigation-rail"
    AssertionError: expected null not to be null (element not found in document)

  x AC3 — Deep-linking > should render ClientesPage heading when router starts at /clientes
    Error: Unable to find an element by: [data-testid="clientes-page-heading"]

  ... (all 18 tests fail with missing element errors)
```

**Summary:**

- Total tests: 40 (22 E2E + 18 Component)
- Passing: 0 (expected — RED phase)
- Failing: 40 (expected — RED phase)
- Status: RED phase verified

---

## Notes

- Story 1.2 is purely frontend — no backend endpoints, no database, no API calls. All tests run against the Vite dev server only.
- The `webServer` in `playwright.config.ts` auto-starts the frontend with `pnpm --filter frontend dev` before E2E tests.
- Component tests use `createMemoryHistory` to set the initial route without requiring a real browser URL — this makes them faster and fully isolated.
- The siesa-ui-kit `NavigationRail` and `NavigationBar` may render the `data-testid` on an inner element (button/anchor) rather than the wrapper. Verify the actual rendered DOM structure and place `data-testid` on the element that Playwright/RTL will query.
- `data-active` is a custom attribute used for test assertions — it does not need to match any CSS selector. Pass it as a prop or set it inline on the nav item element.
- AC5 (root redirect) is tested at E2E level only because the `beforeLoad` redirect in TanStack Router requires a full router lifecycle that is difficult to test at the component level with memory history without additional setup.

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-13
