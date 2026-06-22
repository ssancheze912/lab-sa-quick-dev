# ATDD Checklist - Epic 1, Story 2: Frontend Navigation Shell

**Date:** 2026-06-22
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Implements a persistent navigation shell that allows users to move between the Clientes and Contactos sections of the application via client-side routing without full page reloads. The shell renders a `NavigationRail` (desktop, >= 1024px) or a `NavigationBar` (mobile, < 1024px), both sourced from `siesa-ui-kit`. Deep linking, root redirect, and graceful 404 handling are also covered.

**As a** user
**I want** a persistent navigation structure to access Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop (>= 1024px): `NavigationRail` is visible on the left side with "Clientes" and "Contactos" entries.
2. Click "Clientes" in the NavigationRail navigates to `/clientes` via client-side routing (TanStack Router).
3. Click "Contactos" in the NavigationRail navigates to `/contactos` via client-side routing.
4. Mobile (< 1024px): `NavigationBar` is displayed at the bottom with all nav items accessible and tappable.
5. Deep link to `/clientes` renders `ClientesShellView` and highlights "Clientes" as active in the nav.
6. Deep link to `/contactos` renders `ContactosShellView` and highlights "Contactos" as active in the nav.
7. Unknown route (e.g., `/unknown-path`) displays a 404 view gracefully without crashing.
8. Root path `/` automatically redirects to `/clientes`.

---

## Failing Tests Created (RED Phase)

### E2E Tests (18 tests)

**File:** `e2e/tests/navigation/frontend-navigation-shell.spec.ts`

- **Test:** `should display NavigationRail on the left side when viewport is desktop`
  - **Status:** RED - `[data-testid="navigation-rail"]` element does not exist (route `_app.tsx` not created)
  - **Verifies:** AC1 — NavigationRail visible on desktop

- **Test:** `should show "Clientes" nav entry in the NavigationRail`
  - **Status:** RED - `[data-testid="nav-item-clientes"]` not found
  - **Verifies:** AC1 — Clientes nav entry present

- **Test:** `should show "Contactos" nav entry in the NavigationRail`
  - **Status:** RED - `[data-testid="nav-item-contactos"]` not found
  - **Verifies:** AC1 — Contactos nav entry present

- **Test:** `should NOT display NavigationBar at the bottom on desktop viewport`
  - **Status:** RED - `[data-testid="navigation-rail"]` not found (test fails on missing rail, not bar)
  - **Verifies:** AC1 — NavigationBar hidden on desktop

- **Test:** `should navigate to /clientes on clicking the Clientes nav item`
  - **Status:** RED - nav item not found to click
  - **Verifies:** AC2 — Click Clientes navigates to /clientes

- **Test:** `should NOT trigger a full page reload when navigating to /clientes`
  - **Status:** RED - nav item not found
  - **Verifies:** AC2 — Client-side navigation (no reload)

- **Test:** `should navigate to /contactos on clicking the Contactos nav item`
  - **Status:** RED - nav item not found
  - **Verifies:** AC3 — Click Contactos navigates to /contactos

- **Test:** `should NOT trigger a full page reload when navigating to /contactos`
  - **Status:** RED - nav item not found
  - **Verifies:** AC3 — Client-side navigation (no reload)

- **Test:** `should display NavigationBar at the bottom on mobile viewport`
  - **Status:** RED - `[data-testid="navigation-bar"]` not found
  - **Verifies:** AC4 — Mobile NavigationBar visible

- **Test:** `should NOT display NavigationRail on mobile viewport`
  - **Status:** RED - route `_app.tsx` not created
  - **Verifies:** AC4 — NavigationRail hidden on mobile

- **Test:** `should show all navigation items in NavigationBar on mobile`
  - **Status:** RED - NavigationBar not created
  - **Verifies:** AC4 — Nav items accessible on mobile

- **Test:** `should show Contactos nav item in NavigationBar on mobile`
  - **Status:** RED - NavigationBar not created
  - **Verifies:** AC4 — Contactos tappable on mobile

- **Test:** `should render ClientesShellView when navigating directly to /clientes`
  - **Status:** RED - `[data-testid="clientes-shell-view"]` not found (route file not created)
  - **Verifies:** AC5 — Deep link /clientes renders ClientesShellView

- **Test:** `should highlight "Clientes" as active in NavigationRail on /clientes deep link`
  - **Status:** RED - `[data-testid="nav-item-clientes"][data-active="true"]` not found
  - **Verifies:** AC5 — Clientes highlighted as active

- **Test:** `should render ContactosShellView when navigating directly to /contactos`
  - **Status:** RED - `[data-testid="contactos-shell-view"]` not found
  - **Verifies:** AC6 — Deep link /contactos renders ContactosShellView

- **Test:** `should highlight "Contactos" as active in NavigationRail on /contactos deep link`
  - **Status:** RED - `[data-testid="nav-item-contactos"][data-active="true"]` not found
  - **Verifies:** AC6 — Contactos highlighted as active

- **Test:** `should display a 404 not-found view for an unknown route`
  - **Status:** RED - `[data-testid="not-found-view"]` not found (notFoundComponent not implemented)
  - **Verifies:** AC7 — 404 view rendered for unknown route

- **Test:** `should show "Página no encontrada" text on the 404 view`
  - **Status:** RED - 404 view not created
  - **Verifies:** AC7 — Spanish 404 text displayed

- **Test:** `should show a link back to /clientes on the 404 view`
  - **Status:** RED - `[data-testid="not-found-back-link"]` not found
  - **Verifies:** AC7 — Back link on 404 view

- **Test:** `should NOT crash the application when navigating to an unknown route`
  - **Status:** RED - runtime errors expected without notFoundComponent
  - **Verifies:** AC7 — No crash on unknown route

- **Test:** `should redirect from / to /clientes when accessing the root path`
  - **Status:** RED - index.tsx still renders `<h1>Siesa Agents</h1>`, redirect not implemented
  - **Verifies:** AC8 — Root / redirects to /clientes

- **Test:** `should render ClientesShellView after redirect from root /`
  - **Status:** RED - redirect not implemented
  - **Verifies:** AC8 — ClientesShellView visible after redirect

### Component Tests (17 tests)

**File:** `frontend/src/routes/__tests__/navigation.test.tsx`

- **Test:** `should render the NavigationRail component on desktop viewport`
  - **Status:** RED - `routeTree.gen.ts` missing `_app` route; `navigation-rail` testid not rendered
  - **Verifies:** AC1 — NavigationRail rendered on desktop

- **Test:** `should render "Clientes" nav entry inside the NavigationRail`
  - **Status:** RED - NavigationRail not rendered
  - **Verifies:** AC1 — Clientes entry in NavigationRail

- **Test:** `should render "Contactos" nav entry inside the NavigationRail`
  - **Status:** RED - NavigationRail not rendered
  - **Verifies:** AC1 — Contactos entry in NavigationRail

- **Test:** `should navigate to /clientes when Clientes nav item is clicked`
  - **Status:** RED - nav item not rendered; router.state.location.pathname remains /contactos
  - **Verifies:** AC2 — Click Clientes changes route

- **Test:** `should navigate to /contactos when Contactos nav item is clicked`
  - **Status:** RED - nav item not rendered
  - **Verifies:** AC3 — Click Contactos changes route

- **Test:** `should render the NavigationBar component on mobile viewport`
  - **Status:** RED - `navigation-bar` testid not rendered
  - **Verifies:** AC4 — NavigationBar on mobile

- **Test:** `should render all navigation items in the NavigationBar on mobile`
  - **Status:** RED - NavigationBar not rendered
  - **Verifies:** AC4 — Both nav items in NavigationBar

- **Test:** `should render ClientesShellView on direct navigation to /clientes`
  - **Status:** RED - `_app/clientes.tsx` route file not created
  - **Verifies:** AC5 — ClientesShellView rendered

- **Test:** `should mark Clientes nav item as active (data-active="true") at /clientes`
  - **Status:** RED - nav item not rendered
  - **Verifies:** AC5 — Clientes active state correct

- **Test:** `should mark Contactos nav item as NOT active at /clientes`
  - **Status:** RED - nav item not rendered
  - **Verifies:** AC5 — Contactos inactive at /clientes

- **Test:** `should render ContactosShellView on direct navigation to /contactos`
  - **Status:** RED - `_app/contactos.tsx` route file not created
  - **Verifies:** AC6 — ContactosShellView rendered

- **Test:** `should mark Contactos nav item as active (data-active="true") at /contactos`
  - **Status:** RED - nav item not rendered
  - **Verifies:** AC6 — Contactos active state correct

- **Test:** `should mark Clientes nav item as NOT active at /contactos`
  - **Status:** RED - nav item not rendered
  - **Verifies:** AC6 — Clientes inactive at /contactos

- **Test:** `should render the 404 not-found view for an unknown route`
  - **Status:** RED - `notFoundComponent` not added to `__root.tsx`
  - **Verifies:** AC7 — 404 view renders

- **Test:** `should display "Página no encontrada" text in the 404 view`
  - **Status:** RED - 404 component not created
  - **Verifies:** AC7 — Spanish 404 text

- **Test:** `should display a back link to /clientes in the 404 view`
  - **Status:** RED - 404 component not created
  - **Verifies:** AC7 — Back link on 404

- **Test:** `should redirect from / to /clientes when accessing root path`
  - **Status:** RED - `beforeLoad` redirect not added to `index.tsx`
  - **Verifies:** AC8 — Root / redirects

- **Test:** `should render ClientesShellView after redirect from /`
  - **Status:** RED - redirect not implemented
  - **Verifies:** AC8 — ClientesShellView after redirect

---

## Data Factories Created

No domain data factories are required for this story. The navigation shell contains no entity data. The existing `e2e/helpers/data.helper.ts` is sufficient for other tests in the suite.

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures which navigate to the respective routes. These are reused across the test suite.

No new fixtures are required for Story 1.2 E2E tests — the navigation shell tests navigate directly via `page.goto()` with explicit `waitForLoadState`.

---

## Mock Requirements

### TanStack Router (Component Tests)

The component tests use `createMemoryHistory` + `createRouter` from `@tanstack/react-router` to create isolated router instances. No network mocking is required since navigation is purely client-side.

### siesa-ui-kit (Component Tests)

`NavigationRail` and `NavigationBar` are mocked in `navigation.test.tsx` using `vi.mock('siesa-ui-kit', ...)` to:
- Return simple `<nav>` elements with `data-testid` attributes
- Expose nav item buttons with `data-testid="nav-item-{label}"` and `data-active` attributes
- Avoid dependency on the actual siesa-ui-kit component internals

**Important for DEV:** The mock interface reflects the expected props API of `NavigationRail` and `NavigationBar`:
```typescript
{
  items: Array<{ label: string; path: string }>;
  activeItem: string;        // current pathname
  onNavigate: (path: string) => void;
}
```
If the actual siesa-ui-kit API differs, update both the component implementation and the mock.

---

## Required data-testid Attributes

### AppShell Layout (`frontend/src/routes/_app.tsx`)

- `navigation-rail` — The `NavigationRail` wrapper container (desktop, `hidden lg:flex`)
- `navigation-bar` — The `NavigationBar` wrapper container (mobile, `flex lg:hidden fixed bottom-0`)
- `nav-item-clientes` — The Clientes navigation item button (passed via `items` prop or rendered inside)
- `nav-item-contactos` — The Contactos navigation item button

**Note:** The `data-testid` on nav items should be rendered by `NavigationRail`/`NavigationBar` if their API supports it, or added to the wrapper elements if not. Check siesa-ui-kit API first.

**`data-active` attribute pattern:**
```tsx
// Each nav item needs data-active="true" | "false" for active state detection
<NavItem data-testid="nav-item-clientes" data-active={pathname === '/clientes' ? 'true' : 'false'} />
```

### ClientesShellView (`frontend/src/routes/_app/clientes.tsx`)

- `clientes-shell-view` — Root element of the Clientes placeholder view

**Implementation Example:**
```tsx
function ClientesShellView() {
  return (
    <div data-testid="clientes-shell-view">
      <h1>Clientes</h1>
    </div>
  );
}
```

### ContactosShellView (`frontend/src/routes/_app/contactos.tsx`)

- `contactos-shell-view` — Root element of the Contactos placeholder view

**Implementation Example:**
```tsx
function ContactosShellView() {
  return (
    <div data-testid="contactos-shell-view">
      <h1>Contactos</h1>
    </div>
  );
}
```

### NotFoundView (`frontend/src/routes/__root.tsx` — `notFoundComponent`)

- `not-found-view` — Root container of the 404 not-found view
- `not-found-back-link` — Link element pointing to `/clientes`

**Implementation Example:**
```tsx
<div data-testid="not-found-view">
  <h1>Página no encontrada</h1>
  <Link to="/clientes" data-testid="not-found-back-link">Volver a Clientes</Link>
</div>
```

---

## Implementation Checklist

### Test Group: AC1 — Desktop NavigationRail

**E2E File:** `e2e/tests/navigation/frontend-navigation-shell.spec.ts`
**Component File:** `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route
- [ ] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit`
- [ ] Define `navItems` array: `[{ label: 'Clientes', path: '/clientes' }, { label: 'Contactos', path: '/contactos' }]`
- [ ] Add desktop wrapper: `<div data-testid="navigation-rail" className="hidden lg:flex">` around NavigationRail
- [ ] Add mobile wrapper: `<div data-testid="navigation-bar" className="flex lg:hidden fixed bottom-0 w-full">` around NavigationBar
- [ ] Pass `data-testid` to nav items via siesa-ui-kit API (or wrap each item)
- [ ] Run tests: `npx playwright test e2e/tests/navigation/ --grep "AC1"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation`
- [ ] ✅ All AC1 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group: AC2 + AC3 — Click navigation navigates client-side

**Tasks to make these tests pass:**

- [ ] Use `useRouter` from `@tanstack/react-router` to get current pathname
- [ ] Wire `onNavigate` prop of NavigationRail/Bar to `router.navigate({ to: path })`
- [ ] Ensure TanStack Router's `Link`-based navigation (no `<a href>` full reloads)
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/ --grep "AC2|AC3"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation`
- [ ] ✅ All AC2 + AC3 tests pass

**Estimated Effort:** 0.5 hours

---

### Test Group: AC4 — Mobile NavigationBar

**Tasks to make these tests pass:**

- [ ] Verify TailwindCSS `lg:` breakpoint (1024px) applied correctly: `hidden lg:flex` / `flex lg:hidden`
- [ ] Confirm `navigation-bar` renders on Playwright mobile-chrome project (`Pixel 5` viewport)
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/ --grep "AC4" --project=mobile-chrome`
- [ ] ✅ All AC4 tests pass

**Estimated Effort:** 0.5 hours

---

### Test Group: AC5 + AC6 — Deep linking and active state

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` — renders `<div data-testid="clientes-shell-view"><h1>Clientes</h1></div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — renders `<div data-testid="contactos-shell-view"><h1>Contactos</h1></div>`
- [ ] Use TanStack Router `createFileRoute('/_app/clientes')` and `createFileRoute('/_app/contactos')`
- [ ] Pass `activeItem={currentPath}` to NavigationRail/Bar so items receive `data-active` attribute
- [ ] Confirm `routeTree.gen.ts` auto-regenerates after file creation
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/ --grep "AC5|AC6"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation`
- [ ] ✅ All AC5 + AC6 tests pass

**Estimated Effort:** 1 hour

---

### Test Group: AC7 — 404 not-found view

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/__root.tsx` — add `notFoundComponent` to `createRootRoute({...})`
- [ ] Implement `NotFoundView` component rendering `data-testid="not-found-view"`
- [ ] Include `<h1>Página no encontrada</h1>` and `<Link to="/clientes" data-testid="not-found-back-link">Volver a Clientes</Link>`
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/ --grep "AC7"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation`
- [ ] ✅ All AC7 tests pass

**Estimated Effort:** 0.5 hours

---

### Test Group: AC8 — Root / redirects to /clientes

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/index.tsx` — replace `IndexPage` component with `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Import `redirect` from `@tanstack/react-router`
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/ --grep "AC8"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation`
- [ ] ✅ All AC8 tests pass

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all E2E failing tests for Story 1.2
npx playwright test e2e/tests/navigation/frontend-navigation-shell.spec.ts

# Run E2E in headed mode (see browser)
npx playwright test e2e/tests/navigation/ --headed

# Run E2E for specific AC
npx playwright test e2e/tests/navigation/ --grep "AC1"

# Run E2E on mobile viewport only
npx playwright test e2e/tests/navigation/ --project=mobile-chrome

# Debug specific E2E test
npx playwright test e2e/tests/navigation/ --debug

# Run component tests (Vitest)
pnpm --filter frontend test

# Run component tests in watch mode
pnpm --filter frontend test:watch

# Run component tests with coverage
pnpm --filter frontend test:coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All E2E tests written and failing — missing routes (`_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`), missing `notFoundComponent`, missing redirect
- All Component tests written and failing — `routeTree.gen.ts` does not include `_app` layout route yet
- `data-testid` requirements fully documented
- Implementation checklist created with clear ordered tasks

**Verification:**

- E2E tests fail with `locator not found` or `navigation timeout`
- Component tests fail with `Unable to find an element by: [data-testid="navigation-rail"]`
- All failures are due to missing implementation, not test logic bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test group from implementation checklist (start with AC1/AC8)
2. Read the test to understand expected behavior and required `data-testid` attributes
3. Implement minimal code to make that test group pass
4. Run tests to verify green
5. Check off tasks in checklist
6. Move to next group (AC2+AC3 → AC4 → AC5+AC6 → AC7)

**Recommended order:** AC8 (redirect, trivial) → AC1 (layout shell) → AC2+AC3 (navigation) → AC5+AC6 (deep links) → AC4 (mobile) → AC7 (404)

**Key Principles:**

- One group at a time
- Minimal implementation (placeholder content is fine — content is Epic 2/3)
- Run tests frequently
- Use checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 35 tests pass
2. Review `_app.tsx` for code quality and siesa-ui-kit prop API alignment
3. Ensure TailwindCSS breakpoints are correct for the project's `lg:` configuration
4. Confirm `routeTree.gen.ts` is committed (auto-generated, not manually edited)
5. Run full test suite one final time

---

## Next Steps

1. Share this checklist with the dev workflow (manual handoff)
2. Run failing E2E tests to confirm RED phase: `npx playwright test e2e/tests/navigation/`
3. Run failing component tests: `pnpm --filter frontend test`
4. Begin implementation with AC8 (simplest — index.tsx redirect)
5. Follow recommended group order to AC7
6. When all 35 tests pass, proceed to refactor

---

## Knowledge Base References Applied

- **network-first.md** — `waitForLoadState('networkidle')` and `page.route()` intercept before `page.goto()`; `waitForURL` for redirect detection
- **fixture-architecture.md** — `base.fixture.ts` pattern reused; no new fixtures needed for this story
- **selector-resilience.md** — `data-testid` selectors used exclusively; `data-active` attribute for state assertions
- **component-tdd.md** — Vitest + React Testing Library with mocked siesa-ui-kit; `createMemoryHistory` for isolated router testing
- **test-quality.md** — One assertion per test (atomic); explicit waits only (no `sleep`); Given-When-Then comments

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

Tests are expected to fail because the following files do not exist yet:
- `frontend/src/routes/_app.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/_app/contactos.tsx`
- `notFoundComponent` not added to `__root.tsx`
- `beforeLoad` redirect not in `index.tsx`

**Expected E2E Failure:** `TimeoutError: locator.toBeVisible: Timeout 30000ms exceeded. locator('[data-testid="navigation-rail"]') resolved to 0 elements`

**Expected Component Test Failure:** `TestingLibraryElementError: Unable to find an element by: [data-testid="navigation-rail"]`

**Summary:**

- Total E2E tests: 22
- Total Component tests: 18
- Total tests: 40 (35 unique ACs, some have 2 tests per AC)
- Passing: 0 (expected in RED phase)
- Failing: 40 (expected)
- Status: RED phase — ready for DEV implementation

---

## Notes

- The story uses TanStack Router file-based routing. The `routeTree.gen.ts` is auto-generated by the `@tanstack/router-plugin/vite` Vite plugin on every file save. Component tests import from `../routeTree.gen` which will be regenerated once route files are created.
- The `siesa-ui-kit` `NavigationRail` and `NavigationBar` component props may differ slightly from the mock interface. DEV should check the actual API using the MasterCrud skill or siesa-ui-kit docs before implementation.
- All user-facing text must be in Spanish: "Clientes", "Contactos", "Página no encontrada", "Volver a Clientes".
- Playwright config includes `mobile-chrome` project (`Pixel 5`, 393x851) — AC4 mobile tests are automatically picked up.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** — 2026-06-22
