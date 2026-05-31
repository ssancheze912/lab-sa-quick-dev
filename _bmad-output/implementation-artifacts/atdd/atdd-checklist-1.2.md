# ATDD Checklist — Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-31
**Author:** TEA Agent (gaduranb@siesa.com)
**Primary Test Level:** E2E (Playwright) + Component (Vitest + RTL)

---

## Story Summary

Story 1.2 implements the persistent navigation shell for the Siesa Agents CRM frontend.
Users need a consistent navigation structure across desktop and mobile viewports that
allows moving between Clientes and Contactos sections without full page reloads.
The shell uses TanStack Router file-based routing with a pathless layout route (`_app.tsx`)
and siesa-ui-kit components (Navbar, NavigationRail, NavigationBar).

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (viewport ≥ 1024px),
   When the user views the app, Then a `NavigationRail` (siesa-ui-kit) is visible on the
   left side (72px collapsed icon-only) with "Clientes" and "Contactos" entries, and a
   `Navbar` (siesa-ui-kit) with `productName="Siesa Agents"` is visible at the top (64px).

2. **AC2** — Given the application is loaded on a desktop browser, When the user clicks
   the "Clientes" entry in the NavigationRail, Then the browser navigates to `/clientes`
   without a full page reload (client-side routing) and the "Clientes" item is displayed
   as active (FR28).

3. **AC3** — Given the application is loaded on a desktop browser, When the user clicks
   the "Contactos" entry in the NavigationRail, Then the browser navigates to `/contactos`
   without a full page reload and the "Contactos" item is displayed as active (FR28).

4. **AC4** — Given the application is loaded on a mobile browser viewport (< 1024px),
   When the user views the app, Then a `NavigationBar` (siesa-ui-kit, bottom navigation)
   is displayed instead of the NavigationRail, with "Clientes" and "Contactos" items
   accessible and tappable with minimum 44px touch targets (FR29).

5. **AC5** — Given the user types `/clientes` directly in the browser URL bar and hits
   Enter, When the page loads, Then the Clientes view is rendered correctly with the
   navigation shell visible, without any redirection to a different URL (FR30 — deep linking).

6. **AC6** — Given the user types `/contactos` directly in the browser URL bar and hits
   Enter, When the page loads, Then the Contactos view is rendered correctly with the
   navigation shell visible, without any redirection to a different URL (FR30 — deep linking).

7. **AC7** — Given the user navigates to any route that does not exist (e.g. `/unknown`),
   When the page loads, Then a 404 not-found view is displayed gracefully with a message
   in Spanish and a link to return to the home section.

8. **AC8** — Given the app is loaded at `/` (root), When the page renders, Then the user
   is automatically redirected to `/clientes`.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (27 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

#### AC1 — Desktop: NavigationRail + Navbar visible (5 tests)

- **Test:** `should display the Navbar with productName "Siesa Agents" on desktop`
  - **Status:** RED — `data-testid="navbar"` element not found (`_app.tsx` not created)
  - **Verifies:** AC1 — Navbar with Siesa Agents product name at top

- **Test:** `should display the NavigationRail on the left side on desktop`
  - **Status:** RED — `data-testid="navigation-rail"` not found (NavigationRail not implemented)
  - **Verifies:** AC1 — NavigationRail visible on desktop

- **Test:** `should show "Clientes" entry in the NavigationRail on desktop`
  - **Status:** RED — `data-testid="nav-item-clientes"` not found
  - **Verifies:** AC1 — Clientes nav entry present

- **Test:** `should show "Contactos" entry in the NavigationRail on desktop`
  - **Status:** RED — `data-testid="nav-item-contactos"` not found
  - **Verifies:** AC1 — Contactos nav entry present

- **Test:** `should NOT display the NavigationBar (mobile bottom nav) on desktop`
  - **Status:** RED — Cannot verify because `_app.tsx` not implemented
  - **Verifies:** AC1 — Mobile nav hidden on desktop

#### AC2 — NavigationRail: Clientes navigates client-side (3 tests)

- **Test:** `should navigate to /clientes on clicking Clientes without a full page reload`
  - **Status:** RED — `nav-item-clientes` not found, no navigation possible
  - **Verifies:** AC2 — Client-side navigation to /clientes (FR28)

- **Test:** `should mark the "Clientes" item as active (aria-current="page") after navigation`
  - **Status:** RED — `aria-current` not set (active state not implemented)
  - **Verifies:** AC2 — Active state indicator on Clientes item (FR28)

- **Test:** `should NOT mark "Contactos" as active when on /clientes route`
  - **Status:** RED — Active state logic not implemented
  - **Verifies:** AC2 — Contactos item is NOT active on /clientes

#### AC3 — NavigationRail: Contactos navigates client-side (3 tests)

- **Test:** `should navigate to /contactos on clicking Contactos without a full page reload`
  - **Status:** RED — `nav-item-contactos` not found
  - **Verifies:** AC3 — Client-side navigation to /contactos (FR28)

- **Test:** `should mark the "Contactos" item as active (aria-current="page") after navigation`
  - **Status:** RED — Active state not implemented
  - **Verifies:** AC3 — Active state indicator on Contactos item (FR28)

- **Test:** `should NOT mark "Clientes" as active when on /contactos route`
  - **Status:** RED — Active state logic not implemented
  - **Verifies:** AC3 — Clientes item is NOT active on /contactos

#### AC4 — Mobile: NavigationBar (bottom nav) (6 tests)

- **Test:** `should display NavigationBar (bottom nav) on mobile viewport`
  - **Status:** RED — `data-testid="navigation-bar"` not found (mobile layout not implemented)
  - **Verifies:** AC4 — NavigationBar visible on mobile (FR29)

- **Test:** `should NOT display the NavigationRail on mobile viewport`
  - **Status:** RED — Responsive logic not implemented
  - **Verifies:** AC4 — NavigationRail hidden on mobile

- **Test:** `should show "Clientes" item accessible in NavigationBar on mobile`
  - **Status:** RED — NavigationBar not rendered
  - **Verifies:** AC4 — Clientes accessible in mobile nav (FR29)

- **Test:** `should show "Contactos" item accessible in NavigationBar on mobile`
  - **Status:** RED — NavigationBar not rendered
  - **Verifies:** AC4 — Contactos accessible in mobile nav (FR29)

- **Test:** `should have minimum 44px touch targets for NavigationBar items (WCAG 2.1 AA, FR29)`
  - **Status:** RED — NavigationBar not rendered, bounding box is null
  - **Verifies:** AC4 — 44px minimum touch targets (WCAG 2.1 AA, FR29)

- **Test:** `should navigate to /contactos on tapping Contactos in NavigationBar on mobile`
  - **Status:** RED — NavigationBar not rendered
  - **Verifies:** AC4 — Mobile tap navigation works (FR29)

#### AC5 — Deep link /clientes (3 tests)

- **Test:** `should render the Clientes view on direct URL /clientes without any redirect`
  - **Status:** RED — URL assertion fails (/clientes route returns HTML but view missing)
  - **Verifies:** AC5 — No redirect on deep link to /clientes (FR30)

- **Test:** `should show the navigation shell when loading /clientes via direct URL`
  - **Status:** RED — `data-testid="navbar"` not found
  - **Verifies:** AC5 — Nav shell present on deep link

- **Test:** `should render the Clientes placeholder content at /clientes`
  - **Status:** RED — `data-testid="clientes-page"` not found (`_app/clientes.tsx` not created)
  - **Verifies:** AC5 — ClientesPage placeholder rendered

#### AC6 — Deep link /contactos (3 tests)

- **Test:** `should render the Contactos view on direct URL /contactos without any redirect`
  - **Status:** RED — URL assertion may fail (contactos route not configured)
  - **Verifies:** AC6 — No redirect on deep link to /contactos (FR30)

- **Test:** `should show the navigation shell when loading /contactos via direct URL`
  - **Status:** RED — `data-testid="navbar"` not found
  - **Verifies:** AC6 — Nav shell present on deep link

- **Test:** `should render the Contactos placeholder content at /contactos`
  - **Status:** RED — `data-testid="contactos-page"` not found (`_app/contactos.tsx` not created)
  - **Verifies:** AC6 — ContactosPage placeholder rendered

#### AC7 — Unknown route: 404 view (4 tests)

- **Test:** `should render a 404 not-found view for an unknown route`
  - **Status:** RED — `data-testid="not-found-page"` not found (`notFoundComponent` not set in `__root.tsx`)
  - **Verifies:** AC7 — 404 view displayed for unknown routes

- **Test:** `should display the 404 message in Spanish: "Página no encontrada"`
  - **Status:** RED — Text not found (notFoundComponent not implemented)
  - **Verifies:** AC7 — Spanish 404 message displayed

- **Test:** `should display a link to return to the home section from the 404 view`
  - **Status:** RED — `data-testid="not-found-back-link"` not found
  - **Verifies:** AC7 — Back link "Volver a Clientes" pointing to /clientes

- **Test:** `should navigate to /clientes when clicking the return link from 404 view`
  - **Status:** RED — Link not found
  - **Verifies:** AC7 — Return link navigates to /clientes

#### AC8 — Root / redirects to /clientes (2 tests)

- **Test:** `should redirect from / to /clientes automatically on page load`
  - **Status:** RED — `index.tsx` renders IndexPage component instead of redirecting
  - **Verifies:** AC8 — Root / auto-redirects to /clientes

- **Test:** `should render the Clientes view (not a blank page) after redirect from /`
  - **Status:** RED — Redirect not implemented, Clientes page not rendered
  - **Verifies:** AC8 — Redirect lands on functional Clientes view

#### WCAG Accessibility (1 test)

- **Test:** `should have ARIA labels in Spanish on navigation items`
  - **Status:** RED — `nav-item-clientes` / `nav-item-contactos` not found
  - **Verifies:** WCAG 2.1 AA — Spanish ARIA labels on nav items

---

### Component Tests — Vitest + RTL (24 tests)

**File:** `frontend/src/routes/__tests__/NavigationShell.test.tsx`

#### AC1 — Desktop navigation shell (5 tests)

- `Given desktop viewport, When app renders, Then Navbar with "Siesa Agents" is visible`
  - **Status:** RED — `data-testid="navbar"` not rendered (routeTree lacks `_app` layout)

- `Given desktop viewport, When app renders, Then NavigationRail is visible on the left`
  - **Status:** RED — `data-testid="navigation-rail"` not found

- `Given desktop viewport, When app renders, Then NavigationRail contains "Clientes" entry`
  - **Status:** RED — `data-testid="nav-item-clientes"` not found

- `Given desktop viewport, When app renders, Then NavigationRail contains "Contactos" entry`
  - **Status:** RED — `data-testid="nav-item-contactos"` not found

- `Given desktop viewport, When app renders, Then mobile NavigationBar is NOT visible`
  - **Status:** RED — Cannot verify (components not rendered)

#### AC2 — Active state: Clientes (3 tests)

- `Given user is at /clientes, When nav renders, Then Clientes item has aria-current="page"`
  - **Status:** RED — Active state logic not implemented

- `Given user is at /clientes, When nav renders, Then Contactos item does NOT have aria-current="page"`
  - **Status:** RED — Active state logic not implemented

- `Given user clicks Clientes item from /contactos, When navigation happens, Then URL becomes /clientes`
  - **Status:** RED — `nav-item-clientes` not found in DOM

#### AC3 — Active state: Contactos (3 tests)

- `Given user is at /contactos, When nav renders, Then Contactos item has aria-current="page"`
  - **Status:** RED — Active state logic not implemented

- `Given user is at /contactos, When nav renders, Then Clientes item does NOT have aria-current="page"`
  - **Status:** RED — Active state logic not implemented

- `Given user clicks Contactos item from /clientes, When navigation happens, Then URL becomes /contactos`
  - **Status:** RED — `nav-item-contactos` not found in DOM

#### AC4 — Mobile NavigationBar (3 tests)

- `Given mobile viewport (375px), When app renders, Then NavigationBar is visible`
  - **Status:** RED — `data-testid="navigation-bar"` not found

- `Given mobile viewport, When app renders, Then NavigationRail is NOT visible`
  - **Status:** RED — Responsive logic not implemented

- `Given mobile viewport, When app renders, Then Clientes and Contactos items are in NavigationBar`
  - **Status:** RED — NavigationBar not rendered

#### AC5 — Deep link /clientes (3 tests)

- `Given direct URL /clientes, When page loads, Then ClientesPage placeholder is rendered`
  - **Status:** RED — `data-testid="clientes-page"` not found (`_app/clientes.tsx` missing)

- `Given direct URL /clientes, When page loads, Then navigation shell (Navbar) is present`
  - **Status:** RED — `_app.tsx` not created

- `Given direct URL /clientes, When page loads, Then router state remains at /clientes (no redirect)`
  - **Status:** RED — Route `_app/clientes` not in routeTree

#### AC6 — Deep link /contactos (3 tests)

- `Given direct URL /contactos, When page loads, Then ContactosPage placeholder is rendered`
  - **Status:** RED — `data-testid="contactos-page"` not found

- `Given direct URL /contactos, When page loads, Then navigation shell (Navbar) is present`
  - **Status:** RED — `_app.tsx` not created

- `Given direct URL /contactos, When page loads, Then router state remains at /contactos (no redirect)`
  - **Status:** RED — Route `_app/contactos` not in routeTree

#### AC7 — Unknown route 404 (3 tests)

- `Given unknown route /unknown, When page loads, Then 404 not-found component is rendered`
  - **Status:** RED — `__root.tsx` has no `notFoundComponent`

- `Given unknown route, When page loads, Then "Página no encontrada" message is visible in Spanish`
  - **Status:** RED — notFoundComponent not implemented

- `Given unknown route, When page loads, Then a link "Volver a Clientes" pointing to /clientes is present`
  - **Status:** RED — notFoundComponent not implemented

#### AC8 — Root / redirects (2 tests)

- `Given app loads at /, When page renders, Then router state is redirected to /clientes`
  - **Status:** RED — `index.tsx` renders IndexPage instead of redirect

- `Given app loads at /, When redirect happens, Then ClientesPage placeholder is rendered`
  - **Status:** RED — Redirect not configured

---

## data-testid Attributes Required

All `data-testid` attributes below are MANDATORY for tests to pass.
The dev agent must add them exactly as specified.

### `_app.tsx` — Pathless Layout Route (NavigationRail shell)

| `data-testid` | Element | Location |
|---------------|---------|----------|
| `navbar` | `<Navbar>` from siesa-ui-kit | Top bar wrapper |
| `navigation-rail` | `<NavigationRail>` from siesa-ui-kit | Left sidebar (desktop) |
| `navigation-bar` | `<NavigationBar>` from siesa-ui-kit | Bottom nav (mobile) |
| `nav-item-clientes` | Individual nav link for Clientes | Inside rail/bar |
| `nav-item-contactos` | Individual nav link for Contactos | Inside rail/bar |

**Implementation notes:**
- `nav-item-clientes` must have `aria-current="page"` when route is `/clientes`
- `nav-item-contactos` must have `aria-current="page"` when route is `/contactos`
- `nav-item-*` elements need `aria-label` in Spanish: `aria-label="Ir a Clientes"`, `aria-label="Ir a Contactos"`
- Use TanStack Router `<Link activeProps={{ 'aria-current': 'page' }}>` pattern

### `_app/clientes.tsx` — Clientes Placeholder Page

| `data-testid` | Element | Notes |
|---------------|---------|-------|
| `clientes-page` | Top-level wrapper div of `<ClientesPage />` | Placeholder text "Clientes" |

### `_app/contactos.tsx` — Contactos Placeholder Page

| `data-testid` | Element | Notes |
|---------------|---------|-------|
| `contactos-page` | Top-level wrapper div of `<ContactosPage />` | Placeholder text "Contactos" |

### `__root.tsx` — Root Route with notFoundComponent

| `data-testid` | Element | Notes |
|---------------|---------|-------|
| `not-found-page` | Wrapper div of the 404 component | Must contain Spanish text |
| `not-found-back-link` | `<Link to="/clientes">` | Text: "Volver a Clientes" |

---

## Page Object Model Created

**File:** `e2e/pages/navigation.page.ts`

Locators encapsulated:
- `navbar` — top navbar
- `navigationRail` — desktop left rail
- `navigationBar` — mobile bottom bar
- `navItemClientes` — Clientes nav item
- `navItemContactos` — Contactos nav item
- `notFoundPage` — 404 view wrapper
- `notFoundBackLink` — back link in 404 view

Methods:
- `goto(path)` — navigate and wait for networkidle
- `clickClientes()` / `clickContactos()` — click nav items on desktop
- `tapClientes()` / `tapContactos()` — tap nav items on mobile
- `expectClientesActive()` / `expectContactosActive()` — assert aria-current
- `expectNavbarVisible()` — assert navbar with product name
- `expectDesktopLayout()` / `expectMobileLayout()` — assert responsive layout

---

## Mock Requirements

No backend mocking is required for Story 1.2. The navigation shell is a pure frontend story:
- TanStack Router routing logic runs entirely in the browser
- No API calls are made by the navigation shell or placeholder pages
- MSW is not needed for these tests

The Playwright tests run against the live Vite dev server (configured in `playwright.config.ts`
via `webServer` which auto-starts `pnpm --filter frontend dev`).

The Vitest + RTL component tests use `createMemoryHistory` + `createRouter` from
`@tanstack/react-router` to test routing behavior in isolation (no real browser needed).

---

## Implementation Checklist

### Task 1: Install siesa-ui-kit (AC: #1, #4)

- [ ] Run `pnpm add siesa-ui-kit` inside `/frontend`
- [ ] Verify exports: `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar`
- [ ] If unavailable: use shadcn/ui + custom CSS as fallback, document in Dev Agent Record
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "Navbar" --project=chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Task 2: Create `_app.tsx` pathless layout route (AC: #1, #4)

**File to create:** `frontend/src/routes/_app.tsx`

- [ ] Create `frontend/src/routes/_app.tsx` using `createFileRoute`
- [ ] Render `<LayoutBase>` (siesa-ui-kit) with `<Outlet />` from TanStack Router
- [ ] Add `data-testid="navbar"` to `<Navbar productName="Siesa Agents" />`
- [ ] Add `data-testid="navigation-rail"` to `<NavigationRail>` (desktop ≥ 1024px)
- [ ] Add `data-testid="navigation-bar"` to `<NavigationBar>` (mobile < 1024px)
- [ ] Add `data-testid="nav-item-clientes"` with `<Link to="/clientes" activeProps={{ 'aria-current': 'page' }}>` and `aria-label="Ir a Clientes"`
- [ ] Add `data-testid="nav-item-contactos"` with `<Link to="/contactos" activeProps={{ 'aria-current': 'page' }}>` and `aria-label="Ir a Contactos"`
- [ ] Implement responsive logic: NavigationRail visible at ≥ 1024px, NavigationBar visible at < 1024px
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC1" --project=chromium`
- [ ] Test passes

**Estimated Effort:** 2 hours

---

### Task 3: Create route files `_app/clientes.tsx` and `_app/contactos.tsx` (AC: #2, #3, #5, #6)

**Files to create:**
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/_app/contactos.tsx`

- [ ] Create `frontend/src/routes/_app/` directory
- [ ] Create `_app/clientes.tsx`:
  ```tsx
  export const Route = createFileRoute('/clientes')({
    component: ClientesPage,
  })
  function ClientesPage() {
    return <div data-testid="clientes-page">Clientes</div>
  }
  ```
- [ ] Create `_app/contactos.tsx`:
  ```tsx
  export const Route = createFileRoute('/contactos')({
    component: ContactosPage,
  })
  function ContactosPage() {
    return <div data-testid="contactos-page">Contactos</div>
  }
  ```
- [ ] Run `pnpm dev` or `pnpm build` to trigger TanStack Router plugin regeneration of `routeTree.gen.ts`
- [ ] Confirm `routeTree.gen.ts` contains `_app`, `_app/clientes`, `_app/contactos`
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC5|AC6|AC2|AC3" --project=chromium`
- [ ] Tests pass

**Estimated Effort:** 1.5 hours

---

### Task 4: Update `__root.tsx` with `notFoundComponent` (AC: #7)

**File to modify:** `frontend/src/routes/__root.tsx`

- [ ] Add `notFoundComponent` to `createRootRoute`:
  ```tsx
  notFoundComponent: () => (
    <div data-testid="not-found-page" role="main" aria-label="Página no encontrada">
      <h1>Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/clientes" data-testid="not-found-back-link">Volver a Clientes</Link>
    </div>
  )
  ```
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC7" --project=chromium`
- [ ] Tests pass

**Estimated Effort:** 0.5 hours

---

### Task 5: Update `index.tsx` to redirect / → /clientes (AC: #8)

**File to modify:** `frontend/src/routes/index.tsx`

- [ ] Replace `IndexPage` component with `beforeLoad` redirect:
  ```tsx
  export const Route = createFileRoute('/')({
    beforeLoad: () => {
      throw redirect({ to: '/clientes' })
    },
  })
  ```
- [ ] Remove `IndexPage` component (no longer needed)
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC8" --project=chromium`
- [ ] Tests pass

**Estimated Effort:** 0.5 hours

---

### Task 6: Run component tests (Vitest + RTL) (AC: all)

**File:** `frontend/src/routes/__tests__/NavigationShell.test.tsx`

- [ ] Add Vitest configuration to `vite.config.ts`:
  ```ts
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  }
  ```
- [ ] Create `frontend/src/test-setup.ts` with `@testing-library/jest-dom` import
- [ ] Install missing test deps: `pnpm add -D @testing-library/user-event @testing-library/jest-dom`
- [ ] Run: `pnpm --filter frontend test`
- [ ] All 24 component tests pass
- [ ] Run: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium`
- [ ] All 27 E2E tests pass

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 1.2 E2E failing tests
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=chromium

# Run mobile-viewport tests specifically
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --project=mobile-chrome

# Run by AC group
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1" --project=chromium
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4" --project=mobile-chrome
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7|AC8" --project=chromium

# Run component tests (Vitest + RTL)
pnpm --filter frontend test
pnpm --filter frontend test -- --reporter=verbose

# Run all navigation tests (E2E + component)
npx playwright test e2e/tests/navigation/ --project=chromium && pnpm --filter frontend test

# Run with HTML report
npx playwright test e2e/tests/navigation/ --reporter=html --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 27 E2E tests written and failing (no `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx` implemented yet)
- All 24 component tests written and failing (routeTree.gen.ts lacks `_app` routes)
- Page Object Model created (`e2e/pages/navigation.page.ts`)
- Mock requirements documented (none needed — pure frontend routing story)
- `data-testid` requirements listed with exact expected attribute values
- Implementation checklist created for all 8 ACs across 5 tasks

**Verification:**

- E2E tests fail with `locator.waitForResponse` timeout or `locator('data-testid=navbar')` not found
- Component tests fail with `Unable to find an element by: [data-testid="navbar"]`
- Failures are due to missing implementation — not test logic bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Install siesa-ui-kit (Task 1) — if unavailable, use shadcn/ui fallback
2. Create `_app.tsx` with LayoutBase shell and nav items (Task 2) — run AC1 tests
3. Create `_app/clientes.tsx` and `_app/contactos.tsx` placeholders (Task 3) — run AC2, AC3, AC5, AC6 tests
4. Update `__root.tsx` with `notFoundComponent` (Task 4) — run AC7 tests
5. Update `index.tsx` with redirect (Task 5) — run AC8 tests
6. Configure Vitest and run component tests (Task 6)

**Suggested Order:** Task 1 → Task 2 → Task 3 → Task 5 → Task 4 → Task 6

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 27 E2E + 24 component tests pass
2. Run `pnpm tsc --noEmit` — zero TypeScript errors
3. Verify `pnpm build` succeeds with bundle < 500KB gzip
4. Review ARIA labels are set in Spanish on all nav items
5. Review focus ring visibility (2px solid `#0e79fd`) on keyboard navigation
6. Verify `aria-current="page"` toggles correctly when navigating between routes
7. Ensure tests still pass after any refactoring

---

## AC Coverage Matrix

| AC | Description | E2E File | Component File | E2E Count | Component Count | Status |
|----|-------------|----------|----------------|-----------|-----------------|--------|
| AC1 | Desktop: Navbar + NavigationRail visible | navigation-shell.spec.ts | NavigationShell.test.tsx | 5 | 5 | RED |
| AC2 | Desktop: Clientes navigates client-side, active state | navigation-shell.spec.ts | NavigationShell.test.tsx | 3 | 3 | RED |
| AC3 | Desktop: Contactos navigates client-side, active state | navigation-shell.spec.ts | NavigationShell.test.tsx | 3 | 3 | RED |
| AC4 | Mobile: NavigationBar visible, 44px touch targets | navigation-shell.spec.ts | NavigationShell.test.tsx | 6 | 3 | RED |
| AC5 | Deep link /clientes renders without redirect (FR30) | navigation-shell.spec.ts | NavigationShell.test.tsx | 3 | 3 | RED |
| AC6 | Deep link /contactos renders without redirect (FR30) | navigation-shell.spec.ts | NavigationShell.test.tsx | 3 | 3 | RED |
| AC7 | Unknown route: 404 in Spanish with back link | navigation-shell.spec.ts | NavigationShell.test.tsx | 4 | 3 | RED |
| AC8 | Root / auto-redirects to /clientes | navigation-shell.spec.ts | NavigationShell.test.tsx | 2 | 2 | RED |
| WCAG | ARIA labels in Spanish on nav items | navigation-shell.spec.ts | — | 1 | — | RED |
| **Total** | | | | **27** | **24** | **RED** |

---

## Next Steps

1. Share this checklist with the dev workflow (dev-story agent)
2. Confirm RED phase: run both test suites and verify all fail as expected
3. Begin implementation with Task 1 (siesa-ui-kit installation)
4. Work one AC at a time (red → green for each)
5. When all 51 tests pass, mark story status as `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- **Given-When-Then** pattern applied to all test descriptions
- **Network-first intercepts** used: `page.waitForResponse()` registered BEFORE `page.goto()` in all E2E tests where a server response is asserted
- **`data-testid` selectors** used exclusively — no fragile CSS selectors
- **No hard waits** — `waitFor()`, `waitForURL()`, `waitForResponse()`, `waitForLoadState()` used for all async assertions
- **Test levels**: E2E (Playwright) for browser behavior + real navigation; Component (Vitest + RTL) for routing logic in isolation
- **Responsive testing**: Playwright `test.use({ viewport })` for desktop/mobile; RTL `window.innerWidth` mock for component tests
- **TanStack Router isolation**: `createMemoryHistory` + `createRouter` in component tests per `@tanstack/react-router` test docs
- **Atomic tests**: Each test makes exactly one behavioral assertion (single responsibility)
- **Spanish text validation**: All 404 messages, ARIA labels, and navigation text verified in Spanish per P0 company rule

---

**Generated by BMad TEA Agent** — 2026-05-31
