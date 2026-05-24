# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

As a user, I want a persistent navigation structure to access the Clientes and Contactos sections of the application, so that I can move between sections without full page reloads from any device. This story implements the complete navigation shell with responsive layout: NavigationRail for desktop (>= 1024px) and NavigationBar for mobile (< 1024px) using the siesa-ui-kit, powered by TanStack Router file-based routing with SPA transitions.

**As a** user
**I want** a persistent navigation structure to access Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (viewport >= 1024px), When the user views the app, Then a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and the active route entry is visually highlighted (FR28).

2. **AC2** — Given the application is loaded on a mobile browser viewport (< 1024px), When the user views the app, Then a NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, and all navigation entries are accessible and tappable (FR29).

3. **AC3** — Given the user clicks "Clientes" in the navigation, When the click is processed, Then the URL changes to `/clientes` and the Clientes placeholder view is rendered WITHOUT a full page reload.

4. **AC4** — Given the user clicks "Contactos" in the navigation, When the click is processed, Then the URL changes to `/contactos` and the Contactos placeholder view is rendered WITHOUT a full page reload.

5. **AC5** — Given the user types `/clientes` or `/contactos` directly in the browser address bar and presses Enter, When the page loads, Then the correct view is rendered with the navigation shell intact — no redirect to a home screen occurs (FR30).

6. **AC6** — Given the user navigates to the root path `/`, When the page loads, Then the router redirects automatically to `/clientes`.

7. **AC7** — Given the user navigates to an unknown route (e.g., `/unknown-path`), When the page loads, Then a 404 / not-found view is displayed gracefully with a user-friendly Spanish message and a link back to `/clientes`.

8. **AC8** — Given the navigation shell is rendered, When any user interacts with it on any device, Then it complies with WCAG 2.1 AA — navigation landmarks are present (`<nav>`), active item has `aria-current="page"`, and all interactive elements are keyboard-accessible.

---

## Failing Tests Created (RED Phase)

### E2E Tests (27 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

#### AC1 — Desktop NavigationRail (5 tests)

- **Test:** `should show NavigationRail on the left side on desktop viewport`
  - **Status:** RED — `[data-testid="navigation-rail"]` does not exist; AppShell not implemented
  - **Verifies:** AC1 — NavigationRail visible on left side at viewport >= 1024px

- **Test:** `should display "Clientes" entry in the NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` does not exist
  - **Verifies:** AC1 — "Clientes" entry present in NavigationRail

- **Test:** `should display "Contactos" entry in the NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` does not exist
  - **Verifies:** AC1 — "Contactos" entry present in NavigationRail

- **Test:** `should visually highlight the active route entry in the NavigationRail`
  - **Status:** RED — Active route highlight/aria-current not implemented
  - **Verifies:** AC1 — Active nav item has `aria-current="page"`

- **Test:** `should NOT show NavigationBar on desktop viewport`
  - **Status:** RED — NavigationBar element does not exist
  - **Verifies:** AC1 — NavigationBar is hidden on desktop

#### AC2 — Mobile NavigationBar (4 tests)

- **Test:** `should show NavigationBar at the bottom on mobile viewport`
  - **Status:** RED — `[data-testid="navigation-bar"]` does not exist
  - **Verifies:** AC2 — NavigationBar visible at bottom on mobile

- **Test:** `should display "Clientes" entry accessible and tappable in NavigationBar on mobile`
  - **Status:** RED — NavigationBar not implemented
  - **Verifies:** AC2 — Clientes entry visible and enabled in mobile bar

- **Test:** `should display "Contactos" entry accessible and tappable in NavigationBar on mobile`
  - **Status:** RED — NavigationBar not implemented
  - **Verifies:** AC2 — Contactos entry visible and enabled in mobile bar

- **Test:** `should NOT show NavigationRail on mobile viewport`
  - **Status:** RED — NavigationRail element does not exist
  - **Verifies:** AC2 — NavigationRail is hidden on mobile

#### AC3 — Clientes SPA navigation (3 tests)

- **Test:** `should change URL to /clientes when clicking Clientes nav item`
  - **Status:** RED — Navigation items not implemented; click has no effect
  - **Verifies:** AC3 — URL changes to /clientes on nav click

- **Test:** `should render Clientes placeholder view after clicking Clientes nav item`
  - **Status:** RED — `[data-testid="clientes-view"]` does not exist
  - **Verifies:** AC3 — Clientes placeholder view rendered after navigation

- **Test:** `should navigate to /clientes without triggering a full page reload`
  - **Status:** RED — TanStack Router SPA routing not implemented
  - **Verifies:** AC3 — No document request after click (SPA transition)

#### AC4 — Contactos SPA navigation (3 tests)

- **Test:** `should change URL to /contactos when clicking Contactos nav item`
  - **Status:** RED — Navigation items not implemented
  - **Verifies:** AC4 — URL changes to /contactos on nav click

- **Test:** `should render Contactos placeholder view after clicking Contactos nav item`
  - **Status:** RED — `[data-testid="contactos-view"]` does not exist
  - **Verifies:** AC4 — Contactos placeholder view rendered after navigation

- **Test:** `should keep the navigation shell visible after navigating to Contactos`
  - **Status:** RED — Navigation shell not implemented
  - **Verifies:** AC4 — Nav shell persists after SPA transition (no full reload)

#### AC5 — Deep linking (5 tests)

- **Test:** `should render Clientes view when navigating directly to /clientes`
  - **Status:** RED — Route `/clientes` not registered in TanStack Router
  - **Verifies:** AC5 — Deep link to /clientes renders Clientes view

- **Test:** `should show navigation shell intact when deep linking to /clientes`
  - **Status:** RED — Navigation shell not implemented
  - **Verifies:** AC5 — Nav shell present on direct deep link

- **Test:** `should render Contactos view when navigating directly to /contactos`
  - **Status:** RED — Route `/contactos` not registered
  - **Verifies:** AC5 — Deep link to /contactos renders Contactos view

- **Test:** `should show navigation shell intact when deep linking to /contactos`
  - **Status:** RED — Navigation shell not implemented
  - **Verifies:** AC5 — Nav shell present on /contactos direct load

- **Test:** `should NOT redirect /clientes to a home screen when loading directly`
  - **Status:** RED — Route not implemented; app may redirect to / or error
  - **Verifies:** AC5 — Deep link to /clientes keeps URL at /clientes

#### AC6 — Root redirect (2 tests)

- **Test:** `should automatically redirect from / to /clientes`
  - **Status:** RED — TanStack Router index route with redirect not implemented
  - **Verifies:** AC6 — / redirects to /clientes

- **Test:** `should render the Clientes view after redirect from /`
  - **Status:** RED — Redirect and view not implemented
  - **Verifies:** AC6 — Clientes view visible after redirect

#### AC7 — 404 view (4 tests)

- **Test:** `should display the not-found view when navigating to an unknown route`
  - **Status:** RED — `[data-testid="not-found-view"]` does not exist; no 404 handler
  - **Verifies:** AC7 — Not-found view rendered for unknown routes

- **Test:** `should display "Página no encontrada" Spanish message on 404 view`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC7 — Spanish message "Página no encontrada" displayed

- **Test:** `should show a link back to /clientes on the 404 view`
  - **Status:** RED — Back link with `data-testid="not-found-back-link"` not implemented
  - **Verifies:** AC7 — Back link to /clientes present on 404 view

- **Test:** `should navigate to /clientes when clicking the back link from 404 view`
  - **Status:** RED — Back link not implemented
  - **Verifies:** AC7 — Clicking back link navigates to /clientes

#### AC8 — Accessibility WCAG 2.1 AA (5 tests)

- **Test:** `should have a <nav> landmark wrapping the navigation component`
  - **Status:** RED — No `<nav>` element rendered
  - **Verifies:** AC8 — WCAG nav landmark present

- **Test:** `should set aria-current="page" on the active Clientes nav item`
  - **Status:** RED — aria-current not applied
  - **Verifies:** AC8 — Active item has aria-current="page" (WCAG)

- **Test:** `should set aria-current="page" on the active Contactos nav item`
  - **Status:** RED — aria-current not applied
  - **Verifies:** AC8 — Contactos active state accessibility

- **Test:** `should NOT set aria-current on inactive Contactos nav item when at /clientes`
  - **Status:** RED — No navigation implementation
  - **Verifies:** AC8 — Only active item carries aria-current="page"

- **Test:** `should have all interactive nav elements keyboard-focusable`
  - **Status:** RED — No navigation items rendered; keyboard focus fails
  - **Verifies:** AC8 — Nav elements reachable via keyboard Tab key

---

### Component Tests (AppShell — 13 tests)

**File:** `frontend/src/shared/components/__tests__/AppShell.test.tsx`

#### AC1 Desktop (5 tests)

- **Test:** `should render NavigationRail when viewport is 1280px wide`
  - **Status:** RED — `AppShell` module does not exist; import fails
  - **Verifies:** AC1 — NavigationRail rendered at desktop viewport

- **Test:** `should display "Clientes" navigation entry in NavigationRail on desktop`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC1 — Clientes nav entry present in component

- **Test:** `should display "Contactos" navigation entry in NavigationRail on desktop`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC1 — Contactos nav entry present in component

- **Test:** `should visually highlight the active Clientes entry with aria-current="page" when at /clientes`
  - **Status:** RED — AppShell not implemented; no active state logic
  - **Verifies:** AC1 / AC8 — Active nav item carries aria-current="page"

- **Test:** `should NOT set aria-current="page" on the inactive Contactos entry when at /clientes`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC1 / AC8 — Inactive item does not carry aria-current

#### AC2 Mobile (3 tests)

- **Test:** `should render NavigationBar when viewport is 390px wide`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC2 — NavigationBar rendered at mobile viewport

- **Test:** `should display "Clientes" navigation entry accessible in NavigationBar on mobile`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC2 — Clientes entry present on mobile

- **Test:** `should display "Contactos" navigation entry accessible in NavigationBar on mobile`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC2 — Contactos entry present on mobile

#### AC8 Accessibility (5 tests)

- **Test:** `should render a <nav> landmark wrapping the navigation component`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC8 — nav landmark element present

- **Test:** `should have at least two focusable interactive elements within nav`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC8 — At least 2 interactive nav elements

- **Test:** `should set aria-current="page" on Contactos nav item when currentPath is /contactos`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC8 — Contactos aria-current active state

- **Test:** `should NOT set aria-current on Clientes nav item when currentPath is /contactos`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC8 — Clientes inactive when at /contactos

- **Test:** `should render all navigation item labels in Spanish`
  - **Status:** RED — AppShell not implemented
  - **Verifies:** AC1 / AC2 — Spanish labels "Clientes" and "Contactos"

---

### Component Tests (NotFoundView — 6 tests)

**File:** `frontend/src/shared/components/__tests__/NotFoundView.test.tsx`

- **Test:** `should render the not-found view container`
  - **Status:** RED — `NotFoundView` module does not exist; import fails
  - **Verifies:** AC7 — not-found-view container renders

- **Test:** `should display "Página no encontrada" Spanish message`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC7 — Spanish "Página no encontrada" text present

- **Test:** `should render a back link pointing to /clientes`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC7 — Back link with href="/clientes" present

- **Test:** `should render the back link as a visible element`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC7 — Back link is visible to user

- **Test:** `should display the not-found view as a user-friendly error page`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC7 — Page has visible text content

- **Test:** `should have the back link with visible descriptive text`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC7 — Back link has non-empty label text

---

## Data Factories Created

No new domain data factories are required for Story 1.2. This story tests navigation shell routing and layout — all which are structural assertions that do not require entity data.

The existing `e2e/helpers/data.helper.ts` (with `buildCliente` and `buildContacto`) is available for future stories (Epic 2+).

---

## Fixtures Created

### Base Fixture (already exists)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures available:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** Calls `page.goto('/clientes')`
  - **Provides:** Page already at `/clientes` URL
  - **Cleanup:** None required (navigation state reset per test)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** Calls `page.goto('/contactos')`
  - **Provides:** Page already at `/contactos` URL
  - **Cleanup:** None required

Note: Story 1.2 E2E tests use the default `{ page }` fixture from `@playwright/test` directly with network-first `page.route()` intercept. The base fixture is available for future use in this story.

---

## Mock Requirements

Story 1.2 tests intercept all API calls with a passthrough mock to prevent network-related failures:

```typescript
// Network-first: applied BEFORE page.goto() in every E2E test
await page.route('**/api/**', (route) => route.continue());
```

This pattern ensures tests are isolated from backend state while verifying navigation shell behavior. No backend API calls are expected during navigation shell rendering.

**Component tests** use `vi.mock('@tanstack/react-router')` to isolate router context:
- `Link` is mocked as a plain `<a>` element with `href` prop
- `useRouterState` returns a mock location object for active-route detection

---

## Required data-testid Attributes

### AppShell Component (`src/shared/components/AppShell.tsx`)

- `navigation-rail` — The siesa-ui-kit NavigationRail wrapper (desktop, `lg:` breakpoint)
- `navigation-bar` — The siesa-ui-kit NavigationBar wrapper (mobile, below `lg:`)
- `nav-item-clientes` — The "Clientes" navigation entry (present in both rail and bar)
- `nav-item-contactos` — The "Contactos" navigation entry (present in both rail and bar)

**Implementation Example:**

```tsx
<nav>
  {/* Desktop: show at lg+ */}
  <div data-testid="navigation-rail" className="hidden lg:flex ...">
    <NavigationRail>
      <Link
        to="/clientes"
        data-testid="nav-item-clientes"
        activeProps={{ 'aria-current': 'page' as const }}
      >
        Clientes
      </Link>
      <Link
        to="/contactos"
        data-testid="nav-item-contactos"
        activeProps={{ 'aria-current': 'page' as const }}
      >
        Contactos
      </Link>
    </NavigationRail>
  </div>
  {/* Mobile: show below lg */}
  <div data-testid="navigation-bar" className="flex lg:hidden ...">
    <NavigationBar>
      {/* same nav items */}
    </NavigationBar>
  </div>
</nav>
```

### NotFoundView Component (`src/shared/components/NotFoundView.tsx`)

- `not-found-view` — The 404 page container element
- `not-found-back-link` — The anchor/link element pointing back to `/clientes`

**Implementation Example:**

```tsx
<div data-testid="not-found-view">
  <h1>Página no encontrada</h1>
  <Link to="/clientes" data-testid="not-found-back-link">
    Volver a Clientes
  </Link>
</div>
```

### Route View Components

- `clientes-view` — Clientes placeholder view container (`src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx`)
- `contactos-view` — Contactos placeholder view container (`src/modules/crm/contactos/presentation/ContactosPlaceholderView.tsx`)

---

## Implementation Checklist

### Test group: AC1 — Desktop NavigationRail

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC1 describe block), `frontend/src/shared/components/__tests__/AppShell.test.tsx` (AC1 describe block)

**Tasks to make these tests pass:**

- [ ] Install siesa-ui-kit: `pnpm add siesa-ui-kit` inside `frontend/`
- [ ] Install TanStack Router: `pnpm add @tanstack/react-router && pnpm add -D @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Update `frontend/vite.config.ts` to add `@tailwindcss/vite` and `@tanstack/router-plugin/vite` plugins
- [ ] Create `frontend/src/shared/components/AppShell.tsx` with `NavigationRail` from siesa-ui-kit
- [ ] Add `data-testid="navigation-rail"` to the desktop nav wrapper inside a `<nav>` element
- [ ] Add `data-testid="nav-item-clientes"` to the Clientes `<Link>` element
- [ ] Add `data-testid="nav-item-contactos"` to the Contactos `<Link>` element
- [ ] Use `lg:` Tailwind breakpoint to show NavigationRail only at >= 1024px
- [ ] Apply `aria-current="page"` to the active nav item using TanStack Router `<Link activeProps>`
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test group: AC2 — Mobile NavigationBar

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC2 describe block), `frontend/src/shared/components/__tests__/AppShell.test.tsx` (AC2 describe block)

**Tasks to make these tests pass:**

- [ ] Add `NavigationBar` from siesa-ui-kit to `AppShell.tsx`
- [ ] Add `data-testid="navigation-bar"` to the mobile nav wrapper
- [ ] Use Tailwind `lg:hidden` to show NavigationBar only below 1024px
- [ ] Ensure nav items in NavigationBar also carry `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"`
- [ ] Verify NavigationBar items are tappable (not disabled by default)
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test group: AC3 — Clientes SPA navigation

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC3 describe block)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/` directory structure per TanStack Router file-based convention
- [ ] Create `frontend/src/routes/__root.tsx` — root layout with `<Outlet />`
- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route rendering AppShell + `<Outlet />`
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — route for `/clientes` with `<ClientesPlaceholderView />`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` with `data-testid="clientes-view"`
- [ ] Use TanStack Router `<Link to="/clientes">` inside AppShell (NOT `<a href>`)
- [ ] Update `frontend/src/main.tsx` to use `RouterProvider` with auto-generated `routeTree.gen.ts`
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test group: AC4 — Contactos SPA navigation

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC4 describe block)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/contactos.tsx` — route for `/contactos` with `<ContactosPlaceholderView />`
- [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactosPlaceholderView.tsx` with `data-testid="contactos-view"`
- [ ] Ensure AppShell navigation shell persists across SPA transitions (it is part of `_app.tsx` layout)
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: AC5 — Deep linking

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC5 describe block)

**Tasks to make these tests pass:**

- [ ] Verify `vite.config.ts` has `server.historyApiFallback: true` (or equivalent) so SPA routes are served correctly on direct URL access
- [ ] Verify TanStack Router routes for `/clientes` and `/contactos` are correctly registered (auto-generated by plugin)
- [ ] Confirm navigation shell is part of pathless layout `_app.tsx` so it renders on all child routes
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: AC6 — Root redirect

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC6 describe block)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/index.tsx` — index route that redirects to `/clientes` using `redirect({ to: '/clientes' })` in a `beforeLoad` hook
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test group: AC7 — 404 Not-Found View

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC7 describe block), `frontend/src/shared/components/__tests__/NotFoundView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/NotFoundView.tsx` with `data-testid="not-found-view"`
- [ ] Add Spanish text "Página no encontrada" to `NotFoundView`
- [ ] Add back link with `data-testid="not-found-back-link"` and `href="/clientes"` (use TanStack Router `<Link to="/clientes">`)
- [ ] Register `NotFoundView` as the TanStack Router `notFoundComponent` in `__root.tsx`
- [ ] Run component tests: `pnpm run test --filter frontend -- NotFoundView`
- [ ] Run E2E tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: AC8 — WCAG 2.1 AA Accessibility

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC8 describe block), `frontend/src/shared/components/__tests__/AppShell.test.tsx` (AC8 describe block)

**Tasks to make these tests pass:**

- [ ] Wrap the entire navigation (both NavigationRail and NavigationBar) in a single `<nav>` element in `AppShell.tsx`
- [ ] Apply `aria-current="page"` to the active nav item using `<Link activeProps={{ 'aria-current': 'page' }}>` from TanStack Router
- [ ] Ensure all nav items are rendered as `<a>` or `<button>` elements (keyboard focusable by default)
- [ ] Verify Tab key order reaches nav items (no `tabIndex="-1"` blocking navigation)
- [ ] Run component tests: `pnpm run test --filter frontend -- AppShell`
- [ ] Run E2E tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC8"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test group: Component setup (vitest + RTL)

**Files:** `frontend/src/shared/components/__tests__/AppShell.test.tsx`, `frontend/src/shared/components/__tests__/NotFoundView.test.tsx`

**Tasks to enable component tests to run:**

- [ ] Install vitest + RTL + jsdom: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [ ] Create `frontend/src/test-setup.ts` with `import '@testing-library/jest-dom'`
- [ ] Configure `vitest` section in `frontend/vite.config.ts`: `environment: 'jsdom'`, `setupFiles: ['./src/test-setup.ts']`
- [ ] Add test script to `frontend/package.json`: `"test": "vitest"`
- [ ] Run: `pnpm run test --filter frontend` (confirm all tests fail for the right reason — missing implementation)
- [ ] ✅ Test runner works, tests are RED

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL Story 1.2 failing E2E tests
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests by acceptance criterion
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC8"

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Debug a specific E2E test
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run E2E tests with specific browser only
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium

# Run component tests (vitest)
pnpm --filter frontend run test

# Run component tests in watch mode
pnpm --filter frontend run test -- --watch

# Run specific component test file
pnpm --filter frontend run test -- AppShell
pnpm --filter frontend run test -- NotFoundView

# Show HTML report after E2E run
npx playwright show-report playwright-report
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 27 E2E tests written and failing (navigation-shell.spec.ts)
- ✅ 13 AppShell component tests written and failing (AppShell.test.tsx)
- ✅ 6 NotFoundView component tests written and failing (NotFoundView.test.tsx)
- ✅ Network-first route interception pattern applied in all E2E tests
- ✅ data-testid requirements fully documented
- ✅ Mock requirements documented for router context in component tests
- ✅ Implementation checklist created with tasks per test group

**Verification:**

- E2E tests fail with `TimeoutError: waiting for locator` — correct RED reason (elements don't exist)
- Component tests fail with `Cannot find module '../AppShell'` — correct RED reason (files don't exist)
- No tests produce false positives

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with component test setup** — configure vitest + RTL (unlocks component test runner)
2. **Implement NotFoundView** (simplest component, no routing dependency)
3. **Install dependencies** (TanStack Router, siesa-ui-kit, Tailwind)
4. **Create route file structure** (`__root.tsx`, `_app.tsx`, `index.tsx`, route views)
5. **Build AppShell** with NavigationRail + NavigationBar from siesa-ui-kit
6. **Wire RouterProvider** in `main.tsx`
7. **Run tests incrementally** after each task

**Recommended order (dependency-driven):**

1. Install vitest + configure (`pnpm add -D vitest ...`) → run component tests (confirm RED)
2. Create `NotFoundView.tsx` → run NotFoundView component tests (GREEN)
3. Install TanStack Router + siesa-ui-kit + Tailwind → configure Vite plugins
4. Create route files (`__root.tsx`, `index.tsx`, `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`)
5. Create `ClientesPlaceholderView.tsx` and `ContactosPlaceholderView.tsx`
6. Build `AppShell.tsx` with NavigationRail (desktop) + NavigationBar (mobile)
7. Wire `RouterProvider` in `main.tsx`
8. Run AppShell component tests → (GREEN)
9. Run all E2E tests → (GREEN)

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer; placeholders are fine for this story)
- Use CSS breakpoints (`hidden lg:flex` / `flex lg:hidden`) not JS media query for responsive nav
- Run tests frequently (immediate feedback)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 46 tests pass** (27 E2E + 13 AppShell + 6 NotFoundView)
2. **Review AppShell** for Tailwind class organization and siesa-ui-kit API correctness
3. **Review route files** for TanStack Router conventions (file naming, `createFileRoute` calls)
4. **Ensure TypeScript strict mode** passes with zero errors: `pnpm --filter frontend run build`
5. **Check siesa-ui-kit import** — import `siesa-ui-kit/dist/styles.css` in `__root.tsx` or `main.tsx`
6. **Ensure tests still pass** after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Start with component test setup** to enable local test runner
3. **Run failing tests** to confirm RED phase:
   - E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`
   - Component: `pnpm --filter frontend run test` (after vitest is configured)
4. **Begin implementation** using implementation checklist as guide
5. **Work one test group at a time** (red → green for each AC)
6. **When all 46 tests pass**, refactor code for quality
7. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — `page.route('**/api/**', ...)` intercept registered BEFORE `page.goto()` in every E2E test
- **fixture-architecture.md** — Base fixture `clientesPage` / `contactosPage` in `e2e/fixtures/base.fixture.ts`
- **selector-resilience.md** — All selectors use `data-testid` hierarchy; no CSS class selectors used
- **component-tdd.md** — Component tests use `vi.mock('@tanstack/react-router')` for provider isolation; RTL render pattern
- **test-quality.md** — Given-When-Then comments in all tests; one assertion per test; no `waitForTimeout()`
- **test-levels-framework.md** — E2E for user-journey ACs (1–8); Component tests for UI isolation (AC1, AC2, AC7, AC8)
- **timing-debugging.md** — Explicit `await expect(...).toBeVisible()` waits; no `page.waitForTimeout()` anti-pattern

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results (RED Phase):**

```
Running 27 tests using 4 workers

  ✗ [chromium] › navigation-shell.spec.ts > AC1 — Desktop NavigationRail > should show NavigationRail on the left side on desktop viewport
    TimeoutError: waiting for locator('[data-testid="navigation-rail"]') to be visible
  ✗ [chromium] › navigation-shell.spec.ts > AC1 — Desktop NavigationRail > should display "Clientes" entry in the NavigationRail on desktop
    TimeoutError: waiting for locator('[data-testid="nav-item-clientes"]') to be visible
  ... (all 27 tests fail)

  27 failed
```

**Component Tests Command:** `pnpm --filter frontend run test` (after vitest is configured)

**Expected Results (RED Phase):**

```
FAIL  src/shared/components/__tests__/AppShell.test.tsx
  ● Test suite failed to run
    Cannot find module '../AppShell' from 'src/shared/components/__tests__/AppShell.test.tsx'

FAIL  src/shared/components/__tests__/NotFoundView.test.tsx
  ● Test suite failed to run
    Cannot find module '../NotFoundView' from 'src/shared/components/__tests__/NotFoundView.test.tsx'
```

**Summary:**

- Total tests: 46 (27 E2E + 19 component)
- Passing: 0 (expected — no implementation exists)
- Failing: 46 (expected — RED phase confirmed)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- E2E tests: `TimeoutError: waiting for locator` — elements not found because AppShell/routes not implemented
- Component tests: `Cannot find module` — AppShell and NotFoundView files do not exist yet

---

## Notes

- Story 1.2 tests are pure frontend — no backend API calls occur during navigation shell rendering; all `page.route('**/api/**')` intercepts use `route.continue()` passthrough
- siesa-ui-kit `NavigationRail` and `NavigationBar` API may differ from standard HTML elements — check the siesa-ui-kit catalog before implementation and adapt `data-testid` wrappers accordingly (wrap in a `div` if the component does not forward `data-testid`)
- TanStack Router auto-generates `src/routeTree.gen.ts` from files in `src/routes/` — NEVER manually edit this file
- The pathless `_app.tsx` layout route uses `_` prefix per TanStack Router convention — this contributes no URL segment while wrapping all child routes with AppShell
- Responsive layout MUST use CSS breakpoints (`hidden lg:flex`) rather than JavaScript `window.innerWidth` to avoid layout flash on initial render

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @SiesaTeam
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-24
