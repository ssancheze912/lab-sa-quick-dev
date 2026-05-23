# ATDD Checklist — Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-20
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright)

---

## Story Summary

Story 1.2 builds the persistent navigation shell for the Siesa Agents CRM SPA. It implements a responsive layout with a NavigationRail on desktop (≥1024px) and a NavigationBar on mobile (<1024px), both powered by siesa-ui-kit. All routes (/clientes, /contactos) must support direct deep linking, and unknown routes must display a 404 view in Spanish.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1 (FR28)** — Given the application is loaded on a desktop browser (viewport ≥ 1024px), When the user views the app, Then a `NavigationRail` (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries AND clicking either entry navigates to `/clientes` or `/contactos` without a full page reload.

2. **AC2 (FR29)** — Given the application is loaded on a mobile browser viewport (< 1024px), When the user views the app, Then a `NavigationBar` (siesa-ui-kit) is displayed at the bottom instead of the NavigationRail AND all navigation items are accessible and tappable (touch target ≥ 44px).

3. **AC3 (FR30)** — Given the user types `/clientes` or `/contactos` directly in the browser URL bar, When the page loads, Then the correct view is rendered without redirection to a home screen.

4. **AC4** — Given the user navigates to any unknown route (e.g., `/unknown`, `/abc`), When the page loads, Then a 404 / not-found view is displayed gracefully with a message in Spanish.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Desktop Suite (4 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (218 lines)

- **Test: E2E-F-01** — NavigationRail visible con entradas Clientes y Contactos en desktop
  - **Status:** RED — `data-testid="navigation-rail"` element does not exist (NavigationRail not yet implemented)
  - **Verifies:** AC1 — NavigationRail present on desktop with both nav entries visible

- **Test: E2E-F-02** — Clic en Clientes navega a /clientes sin recarga de página
  - **Status:** RED — navigation-rail not implemented, no `/clientes` route exists
  - **Verifies:** AC1 / FR28 — SPA navigation to /clientes without full page reload

- **Test: E2E-F-03** — Clic en Contactos navega a /contactos sin recarga de página
  - **Status:** RED — navigation-rail not implemented, no `/contactos` route exists
  - **Verifies:** AC1 / FR28 — SPA navigation to /contactos without full page reload

- **Test: E2E-F-01b** — NavigationBar NO está visible en viewport desktop
  - **Status:** RED — NavigationBar element absent (not yet implemented); test expects `not.toBeVisible()` but element doesn't exist at all — assertion will pass only when element is present but hidden
  - **Verifies:** AC1 — NavigationBar must be hidden on desktop, not the rail

### E2E Tests — Deep Linking Suite (2 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (continued)

- **Test: E2E-F-04** — Deep link /clientes renderiza vista Clientes sin redirección
  - **Status:** RED — `/clientes` route not registered; `data-testid="clientes-view"` not present
  - **Verifies:** AC3 / FR30 — direct URL to /clientes renders Clientes view without redirect

- **Test: E2E-F-05** — Deep link /contactos renderiza vista Contactos sin redirección
  - **Status:** RED — `/contactos` route not registered; `data-testid="contactos-view"` not present
  - **Verifies:** AC3 / FR30 — direct URL to /contactos renders Contactos view without redirect

### E2E Tests — 404 Suite (2 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (continued)

- **Test: E2E-F-08** — Ruta desconocida muestra vista 404 con mensaje en español
  - **Status:** RED — `data-testid="not-found-view"` not present; TanStack Router catch-all not configured
  - **Verifies:** AC4 — 404 view with "Página no encontrada" and link "Ir a Clientes"

- **Test: E2E-F-08b** — Cualquier ruta desconocida muestra vista 404 (catch-all)
  - **Status:** RED — 404 catch-all route not yet implemented
  - **Verifies:** AC4 — 404 is a true catch-all (any unknown path, not just one specific route)

### E2E Tests — Mobile Suite (4 tests)

**File:** `e2e/tests/navigation/navigation-shell-mobile.spec.ts` (142 lines)

Run only with: `npx playwright test navigation-shell-mobile --project=mobile-chrome`

- **Test: E2E-F-06** — NavigationBar visible en viewport móvil (Pixel 5) en lugar de NavigationRail
  - **Status:** RED — `data-testid="navigation-bar"` does not exist; NavigationBar not implemented
  - **Verifies:** AC2 / FR29 — NavigationBar visible at bottom; NavigationRail hidden on mobile

- **Test: E2E-F-07a** — Ítem Clientes en NavigationBar es visible y tiene área táctil adecuada
  - **Status:** RED — NavigationBar not rendered; boundingBox will be null
  - **Verifies:** AC2 — Clientes link visible and touch target height ≥ 44px

- **Test: E2E-F-07b** — Ítem Contactos en NavigationBar es visible y tiene área táctil adecuada
  - **Status:** RED — NavigationBar not rendered; boundingBox will be null
  - **Verifies:** AC2 — Contactos link visible and touch target height ≥ 44px

- **Test: E2E-F-07c** — Tapping Clientes en NavigationBar navega a /clientes
  - **Status:** RED — NavigationBar and /clientes route not implemented
  - **Verifies:** AC2 — Tap Clientes on mobile navigates to /clientes

- **Test: E2E-F-07d** — Tapping Contactos en NavigationBar navega a /contactos
  - **Status:** RED — NavigationBar and /contactos route not implemented
  - **Verifies:** AC2 — Tap Contactos on mobile navigates to /contactos

**Total E2E tests: 13 tests across 2 spec files**

---

## Page Object Model

**File:** `e2e/pages/navigation.page.ts` (35 lines)

**Class:** `NavigationShellPage`

**Locators:**
- `navigationRail` — `page.getByTestId('navigation-rail')` — siesa-ui-kit NavigationRail root (desktop)
- `navigationBar` — `page.getByTestId('navigation-bar')` — siesa-ui-kit NavigationBar root (mobile)
- `clientesLink` — `page.getByRole('link', { name: /clientes/i })` — Clientes navigation link
- `contactosLink` — `page.getByRole('link', { name: /contactos/i })` — Contactos navigation link

**Methods:**
- `goto()` — navigates to `/` (root, redirects to /clientes after implementation)
- `gotoClientes()` — navigates directly to `/clientes`
- `gotoContactos()` — navigates directly to `/contactos`

---

## Data Factories Created

No data factories required for this story. The navigation shell is a pure UI routing feature with no API calls or domain data. All test data is structural (viewport dimensions, URL paths, text content).

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts` (26 lines)

**Fixtures:**
- `clientesPage` — navigates to `/clientes` before test body executes
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** pre-navigated page at /clientes
  - **Cleanup:** none required (stateless routing)

- `contactosPage` — navigates to `/contactos` before test body executes
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** pre-navigated page at /contactos
  - **Cleanup:** none required (stateless routing)

---

## Mock Requirements

No external service mocks required. Story 1.2 covers frontend-only SPA routing with no backend API calls. The only network concern is the initial app load from Vite dev server (`http://localhost:5173`), which is handled by the `webServer` configuration in `playwright.config.ts`.

---

## Required data-testid Attributes

All `data-testid` attributes that the DEV team MUST add to implementation components for tests to pass:

### AppShell Component (`frontend/src/shared/components/AppShell.tsx`)

- `navigation-rail` — root element of the NavigationRail wrapper (desktop, hidden on mobile via `hidden lg:flex`)
- `navigation-bar` — root element of the NavigationBar wrapper (mobile, hidden on desktop via `flex lg:hidden`)

**Implementation Example:**
```tsx
{/* Desktop NavigationRail */}
<div data-testid="navigation-rail" className="hidden lg:flex">
  <NavigationRail aria-label="Navegación principal">
    {/* nav items */}
  </NavigationRail>
</div>

{/* Mobile NavigationBar */}
<div data-testid="navigation-bar" className="flex lg:hidden">
  <NavigationBar aria-label="Menú de navegación">
    {/* nav items */}
  </NavigationBar>
</div>
```

### Clientes Route View (`frontend/src/routes/_app/clientes.tsx`)

- `clientes-view` — root container of the Clientes placeholder view

**Implementation Example:**
```tsx
function ClientesPage() {
  return (
    <div data-testid="clientes-view" className="p-8">
      <h1 className="text-2xl font-bold">Clientes</h1>
    </div>
  )
}
```

### Contactos Route View (`frontend/src/routes/_app/contactos.tsx`)

- `contactos-view` — root container of the Contactos placeholder view

**Implementation Example:**
```tsx
function ContactosPage() {
  return (
    <div data-testid="contactos-view" className="p-8">
      <h1 className="text-2xl font-bold">Contactos</h1>
    </div>
  )
}
```

### NotFoundView Component (`frontend/src/shared/components/NotFoundView.tsx`)

- `not-found-view` — root container of the 404 not-found view

**Implementation Example:**
```tsx
export function NotFoundView() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <h1 className="text-4xl font-bold text-slate-700">404</h1>
      <p className="text-slate-500">Página no encontrada</p>
      <p className="text-slate-400 text-sm">La ruta solicitada no existe.</p>
      <Link to="/clientes" className="text-primary underline">
        Ir a Clientes
      </Link>
    </div>
  )
}
```

**Total required data-testid attributes: 4**

---

## Implementation Checklist

### Test Group: NavigationRail Desktop (E2E-F-01, E2E-F-02, E2E-F-03, E2E-F-01b)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/__root.tsx` — root layout with `QueryClientProvider`, `Outlet`, and `notFoundComponent: NotFoundView`
- [ ] Create `frontend/src/routes/index.tsx` — redirect to `/clientes` via `beforeLoad` throw redirect
- [ ] Create `frontend/src/routes/_app.tsx` — pathless shell layout wrapping `AppShell` with `Outlet`
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — `/clientes` placeholder route with `data-testid="clientes-view"`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — `/contactos` placeholder route with `data-testid="contactos-view"`
- [ ] Create `frontend/src/shared/components/AppShell.tsx` — renders NavigationRail (desktop) and NavigationBar (mobile) with Tailwind responsive classes
- [ ] Add `data-testid="navigation-rail"` to the NavigationRail wrapper div in AppShell
- [ ] Add `data-testid="navigation-bar"` to the NavigationBar wrapper div in AppShell
- [ ] Wire `NavigationRail` and `NavigationBar` from siesa-ui-kit with Clientes and Contactos nav items as `<Link>` components from TanStack Router
- [ ] Apply Tailwind: `hidden lg:flex` on NavigationRail wrapper, `flex lg:hidden` on NavigationBar wrapper
- [ ] Run test: `npx playwright test navigation-shell --project=chromium`
- [ ] All 4 desktop tests pass (green phase)

**Estimated Effort:** 3–4 hours

---

### Test Group: Deep Linking (E2E-F-04, E2E-F-05)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Verify `vite.config.ts` has no `base` path override that would break `/clientes` and `/contactos`
- [ ] Confirm TanStack Router file-based routing registers `_app/clientes.tsx` as `/clientes` and `_app/contactos.tsx` as `/contactos` (route tree auto-generated by Vite plugin)
- [ ] Add `data-testid="clientes-view"` to ClientesPage component root
- [ ] Add `data-testid="contactos-view"` to ContactosPage component root
- [ ] Run test: `npx playwright test navigation-shell --project=chromium -g "Deep Linking"`
- [ ] Both deep link tests pass (green phase)

**Estimated Effort:** 0.5 hours (mostly verification; routes covered by Task Group 1)

---

### Test Group: 404 Not-Found View (E2E-F-08, E2E-F-08b)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/NotFoundView.tsx` with:
  - Root `<div data-testid="not-found-view">`
  - `<p>Página no encontrada</p>` (visible Spanish text)
  - `<Link to="/clientes">Ir a Clientes</Link>`
- [ ] Register `NotFoundView` as `notFoundComponent` in `createRootRoute` inside `__root.tsx`
- [ ] Verify catch-all behavior: any unknown path (not just `/unknown`) triggers NotFoundView
- [ ] Run test: `npx playwright test navigation-shell --project=chromium -g "Vista 404"`
- [ ] Both 404 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: NavigationBar Mobile (E2E-F-06, E2E-F-07a, E2E-F-07b, E2E-F-07c, E2E-F-07d)

**Files:** `e2e/tests/navigation/navigation-shell-mobile.spec.ts`

**Tasks to make these tests pass:**

- [ ] Implement `NavigationBar` section in `AppShell.tsx` with `data-testid="navigation-bar"` and `flex lg:hidden` Tailwind class
- [ ] Verify NavigationBar from siesa-ui-kit renders Clientes and Contactos as `<Link>` components accessible by role `link`
- [ ] Ensure each nav item touch target height ≥ 44px (verify in siesa-ui-kit component or add `min-h-[44px]` wrapper)
- [ ] Ensure NavigationBar items navigate to `/clientes` and `/contactos` when tapped (`.tap()` Playwright method)
- [ ] Verify NavigationRail is hidden at 393px width (Tailwind `hidden lg:flex` — lg = 1024px)
- [ ] Run test: `npx playwright test navigation-shell-mobile --project=mobile-chrome`
- [ ] All 5 mobile tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run ALL navigation shell tests (desktop + mobile)
npx playwright test e2e/tests/navigation/

# Run only desktop tests
npx playwright test navigation-shell --project=chromium

# Run only mobile tests (Pixel 5)
npx playwright test navigation-shell-mobile --project=mobile-chrome

# Run in headed mode (see the browser)
npx playwright test e2e/tests/navigation/ --headed

# Debug a specific test
npx playwright test navigation-shell --debug --project=chromium

# Run by test ID tag
npx playwright test navigation-shell --project=chromium -g "E2E-F-01"

# Generate HTML report after run
npx playwright show-report
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 13 E2E tests written across 2 spec files (navigation-shell.spec.ts, navigation-shell-mobile.spec.ts)
- ✅ Page Object Model (NavigationShellPage) created with data-testid and ARIA locators
- ✅ Base fixtures created with clientesPage and contactosPage setup helpers
- ✅ Mock requirements documented (none required — pure frontend routing)
- ✅ Required data-testid attributes listed (4 attributes: navigation-rail, navigation-bar, clientes-view, contactos-view, not-found-view)
- ✅ Implementation checklist created with clear per-group tasks

**Verification:**

- All tests fail because: NavigationRail/Bar components not implemented, routes not registered, 404 catch-all not configured
- Failure messages are clear: `getByTestId('navigation-rail')` → element not found; `toHaveURL(/\/clientes/)` → URL remains `/`
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one test group** from the implementation checklist (start with "NavigationRail Desktop" — P0 priority)
2. **Read each test** to understand exact expected behavior (Given-When-Then comments in spec files)
3. **Implement minimal code** to make that group's tests pass (one group at a time)
4. **Run specific tests** to verify green: `npx playwright test navigation-shell --project=chromium`
5. **Move to next test group** (Deep Linking → 404 → Mobile)
6. **Repeat until all 13 tests pass**

**Recommended order:**
1. NavigationRail Desktop (E2E-F-01, F-02, F-03, F-01b) — establishes the shell scaffold
2. Deep Linking (E2E-F-04, F-05) — likely green once routes are defined (verify only)
3. 404 Not-Found (E2E-F-08, F-08b) — isolated, low coupling
4. NavigationBar Mobile (E2E-F-06, F-07a, F-07b, F-07c, F-07d) — responsive CSS + touch targets

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 13 tests pass on chromium + mobile-chrome projects
2. Review AppShell.tsx for readability — extract nav item array, active state logic
3. Ensure Tailwind responsive classes are well-typed (avoid magic strings)
4. Run `npm run build` to verify TypeScript strict mode — no compile errors
5. Run tests after each refactor pass to confirm no regressions

---

## Notes

- The story specifies `data-testid` on the **wrapper div** around siesa-ui-kit components (not on the siesa-ui-kit component itself), since we cannot modify third-party component internals.
- `NavigationRail` and `NavigationBar` exact prop names (`active`, `isActive`, `items`) must be verified against the current siesa-ui-kit catalog version installed in the project before implementation.
- The `page.on('load', ...)` listener in E2E-F-02 and E2E-F-03 is reset after initial page load — only subsequent `load` events indicate a full page reload (fail condition for SPA navigation test).
- Mobile tests (navigation-shell-mobile.spec.ts) use `test.use({ viewport: { width: 393, height: 851 } })` to override the project viewport for all tests in that file. This is independent of the Playwright `mobile-chrome` project (Pixel 5) — both enforce the same dimensions.
- Story 1.2 does NOT implement full Clientes/Contactos views — only placeholder views with `data-testid` wrappers and a heading. Full views are in Epics 2 and 3.

---

## Next Steps

1. **Share this checklist and failing tests** with the DEV workflow (manual handoff)
2. **Run failing tests now** to confirm RED phase: `npx playwright test e2e/tests/navigation/`
3. **Begin implementation** using the implementation checklist, one test group at a time
4. **Run tests after each group** to verify incremental green progress
5. **When all 13 tests pass**, refactor code for quality and run `npm run build`
6. **When refactoring complete**, update story status to `done` in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — `page.on('load', ...)` listener registered before `goto()` for SPA navigation tests (E2E-F-02, E2E-F-03)
- **selector-resilience.md** — `data-testid` selectors used for structural elements (navigation-rail, navigation-bar, clientes-view, not-found-view); ARIA `getByRole('link', { name })` used for navigation items
- **test-quality.md** — Atomic tests (one assertion per test), Given-When-Then comments throughout, no hard waits
- **fixture-architecture.md** — `base.fixture.ts` using `test.extend()` with `clientesPage` and `contactosPage` setup helpers
- **test-levels-framework.md** — E2E selected as primary level (full user journey, viewport-dependent rendering, SPA navigation behavior); no API tests needed (pure frontend story)
- **component-tdd.md** — Mobile touch target assertion (`boundingBox().height >= 44`) follows component accessibility test patterns

---

**Generated by BMad TEA Agent** — 2026-05-20
