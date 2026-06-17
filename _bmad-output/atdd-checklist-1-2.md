# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-17
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Story 1.2 implements the persistent navigation shell for the Siesa Agents CRM application. The shell renders a responsive navigation structure using siesa-ui-kit components: a `NavigationRail` on desktop (>= 1024px) and a `NavigationBar` on mobile (< 1024px), both providing access to the Clientes and Contactos sections via TanStack Router file-based routing.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Desktop (>= 1024px): `NavigationRail` visible on the left side with "Clientes" and "Contactos" entries. Clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).
2. **AC2** — Mobile (< 1024px): `NavigationBar` displayed at the bottom instead of the rail; all navigation items accessible and tappable (FR29).
3. **AC3** — Deep linking: Typing `/clientes` or `/contactos` directly in the URL bar renders the correct view without redirection (FR30).
4. **AC4** — Unknown route (e.g., `/foo`): A 404 not-found view is displayed gracefully within the layout shell.
5. **AC5** — Active item highlighted in the navigation component to reflect the current route.
6. **AC6** — WCAG 2.1 AA compliant ARIA labels in Spanish (`aria-label="Navegación principal"`).

---

## Failing Tests Created (RED Phase)

### E2E Tests (20 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

#### AC1 — Desktop NavigationRail

- **Test:** `should render the NavigationRail on the left side on desktop`
  - **Status:** RED — `navigation-rail` testid does not exist (component not implemented)
  - **Verifies:** NavigationRail from siesa-ui-kit renders with data-testid="navigation-rail" on desktop

- **Test:** `should display Clientes entry in the NavigationRail on desktop`
  - **Status:** RED — `nav-item-clientes` testid does not exist
  - **Verifies:** Clientes navigation item is rendered in the rail

- **Test:** `should display Contactos entry in the NavigationRail on desktop`
  - **Status:** RED — `nav-item-contactos` testid does not exist
  - **Verifies:** Contactos navigation item is rendered in the rail

- **Test:** `should navigate to /clientes without a full page reload when clicking Clientes`
  - **Status:** RED — `clientes-page` testid does not exist; _app.tsx layout not created
  - **Verifies:** SPA navigation from /contactos to /clientes; ClientesPage placeholder rendered

- **Test:** `should navigate to /contactos without a full page reload when clicking Contactos`
  - **Status:** RED — `contactos-page` testid does not exist; _app.tsx layout not created
  - **Verifies:** SPA navigation from /clientes to /contactos; ContactosPage placeholder rendered

#### AC2 — Mobile NavigationBar

- **Test:** `should display the NavigationBar at the bottom on mobile`
  - **Status:** RED — `navigation-bar` testid does not exist
  - **Verifies:** NavigationBar renders on mobile viewport (375px)

- **Test:** `should NOT show the NavigationRail on mobile`
  - **Status:** RED — navigation-rail may be present or not visible (CSS classes not applied)
  - **Verifies:** NavigationRail hidden on mobile via `hidden lg:flex` Tailwind classes

- **Test:** `should show Clientes navigation item in the NavigationBar on mobile`
  - **Status:** RED — `nav-item-clientes` testid does not exist
  - **Verifies:** Clientes accessible in mobile NavigationBar

- **Test:** `should show Contactos navigation item in the NavigationBar on mobile`
  - **Status:** RED — `nav-item-contactos` testid does not exist
  - **Verifies:** Contactos accessible in mobile NavigationBar

- **Test:** `should navigate to /contactos when the user taps Contactos on mobile`
  - **Status:** RED — `nav-item-contactos` testid does not exist; tap not wired
  - **Verifies:** Mobile tap navigation works correctly

#### AC3 — Deep Linking

- **Test:** `should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED — `clientes-page` testid does not exist; route file not created
  - **Verifies:** /clientes route renders ClientesPage without redirect

- **Test:** `should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED — `contactos-page` testid does not exist; route file not created
  - **Verifies:** /contactos route renders ContactosPage without redirect

- **Test:** `should redirect / to /clientes automatically`
  - **Status:** RED — index.tsx still renders an h1 instead of redirecting
  - **Verifies:** Root route / redirects to /clientes

#### AC4 — 404 Not Found

- **Test:** `should display a not-found view for an unknown route`
  - **Status:** RED — `not-found-view` testid does not exist; no 404 route configured
  - **Verifies:** Unknown routes show a 404 view within the shell

- **Test:** `should display "Página no encontrada" text on the 404 view`
  - **Status:** RED — 404 view not implemented
  - **Verifies:** 404 message is in Spanish as per company standards

- **Test:** `should provide a link back to /clientes from the 404 view`
  - **Status:** RED — `not-found-back-link` testid does not exist
  - **Verifies:** 404 page has a recovery link back to /clientes

#### AC5 — Active Item Highlighting

- **Test:** `should highlight the Clientes item as active when on /clientes`
  - **Status:** RED — `aria-current="page"` not implemented on nav items
  - **Verifies:** Clientes item has aria-current="page" on /clientes route

- **Test:** `should highlight the Contactos item as active when on /contactos`
  - **Status:** RED — `aria-current="page"` not implemented on nav items
  - **Verifies:** Contactos item has aria-current="page" on /contactos route

- **Test:** `should NOT mark Contactos as active when on /clientes`
  - **Status:** RED — active state logic not implemented
  - **Verifies:** Only the current route item is marked active

- **Test:** `should update active item when user navigates from Clientes to Contactos`
  - **Status:** RED — active state not reactive to route changes
  - **Verifies:** Active highlight updates dynamically on navigation

#### AC6 — ARIA and Accessibility

- **Test:** `should have aria-label="Navegación principal" on the navigation wrapper`
  - **Status:** RED — ARIA label not implemented on wrapper
  - **Verifies:** Navigation wrapper has `aria-label="Navegación principal"`

- **Test:** `should have accessible labels on the Clientes navigation item`
  - **Status:** RED — nav items not yet created
  - **Verifies:** Clientes item has accessible name "Clientes"

- **Test:** `should have accessible labels on the Contactos navigation item`
  - **Status:** RED — nav items not yet created
  - **Verifies:** Contactos item has accessible name "Contactos"

- **Test:** `should not generate any axe accessibility violations on the navigation shell`
  - **Status:** RED — shell not implemented; no nav landmark exists
  - **Verifies:** A `<nav>` landmark element is present on the page

---

### Component Tests (13 tests)

**File:** `frontend/src/routes/__tests__/navigation.test.tsx`

#### AC1 — NavigationRail on desktop (5 tests)

- **Test:** `should render the NavigationRail component`
  - **Status:** RED — `_app.tsx` does not exist; import fails
  - **Verifies:** NavigationRail renders with data-testid="navigation-rail"

- **Test:** `should render the Clientes navigation item in the NavigationRail`
  - **Status:** RED — AppLayout not implemented
  - **Verifies:** Clientes item rendered in NavigationRail

- **Test:** `should render the Contactos navigation item in the NavigationRail`
  - **Status:** RED — AppLayout not implemented
  - **Verifies:** Contactos item rendered in NavigationRail

- **Test:** `should display "Clientes" text in the navigation item`
  - **Status:** RED — AppLayout not implemented
  - **Verifies:** "Clientes" text is visible to users

- **Test:** `should display "Contactos" text in the navigation item`
  - **Status:** RED — AppLayout not implemented
  - **Verifies:** "Contactos" text is visible to users

#### AC2 — NavigationBar on mobile (3 tests)

- **Test:** `should render the NavigationBar component on mobile`
  - **Status:** RED — AppLayout not implemented; no NavigationBar
  - **Verifies:** NavigationBar renders with data-testid="navigation-bar"

- **Test:** `should render the Clientes navigation item in the NavigationBar`
  - **Status:** RED — AppLayout not implemented
  - **Verifies:** Clientes accessible in NavigationBar

- **Test:** `should render the Contactos navigation item in the NavigationBar`
  - **Status:** RED — AppLayout not implemented
  - **Verifies:** Contactos accessible in NavigationBar

#### AC5 — Active highlighting (4 tests)

- **Test:** `should mark Clientes item as active (aria-current="page") when on /clientes`
  - **Status:** RED — no active state logic exists
  - **Verifies:** Active route detection drives aria-current attribute

- **Test:** `should NOT mark Contactos item as active when on /clientes`
  - **Status:** RED — no active state logic exists
  - **Verifies:** Non-active items do not have aria-current="page"

- **Test:** `should mark Contactos item as active (aria-current="page") when on /contactos`
  - **Status:** RED — no active state logic exists
  - **Verifies:** Route change updates active item correctly

- **Test:** `should NOT mark Clientes item as active when on /contactos`
  - **Status:** RED — no active state logic exists
  - **Verifies:** Only current route item is highlighted

#### AC6 — ARIA labels (3 tests... but 2 already counted above; total unique here: 3)

- **Test:** `should have aria-label="Navegación principal" on the navigation wrapper`
  - **Status:** RED — aria-label not applied to wrapper
  - **Verifies:** getByLabelText("Navegación principal") finds the nav wrapper

- **Test:** `should render navigation items as links (anchor tags or role="link")`
  - **Status:** RED — AppLayout not implemented
  - **Verifies:** Nav items are keyboard-navigable as links

- **Test:** `should render navigation elements within a nav landmark`
  - **Status:** RED — no nav landmark exists
  - **Verifies:** `<nav>` element present for WCAG landmark compliance

---

## Data Factories Created

No data factories required for Story 1.2. This story is a pure frontend navigation/routing story with no backend data dependencies or external API calls that require factory-generated data.

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures that navigate to the respective routes — these are already suitable for Story 1.2 tests.

No additional fixtures were created. Story 1.2 E2E tests use `test` from `@playwright/test` directly to control viewport and navigation precisely per AC.

---

## Mock Requirements

No external service mocks required. Story 1.2 is entirely frontend-side:
- No API calls are made by the navigation shell itself
- Backend services are not invoked during navigation between /clientes and /contactos
- The ClientesPage and ContactosPage are placeholder components (full implementation in Epics 2 and 3)

---

## Required data-testid Attributes

### Navigation Shell (_app.tsx)

- `navigation-rail` — The `NavigationRail` siesa-ui-kit component wrapper (desktop, left side)
- `navigation-bar` — The `NavigationBar` siesa-ui-kit component wrapper (mobile, bottom)
- `nav-item-clientes` — The Clientes navigation item (rendered in both rail and bar)
- `nav-item-contactos` — The Contactos navigation item (rendered in both rail and bar)

### Route Pages

- `clientes-page` — Placeholder ClientesPage component root element
- `contactos-page` — Placeholder ContactosPage component root element

### Not Found Route

- `not-found-view` — Root element of the 404 not-found view
- `not-found-back-link` — The anchor link returning the user to /clientes

**Implementation Example:**

```tsx
// _app.tsx
<div aria-label="Navegación principal">
  <aside className="hidden lg:flex" data-testid="navigation-rail">
    <NavigationRail items={navItems} />
  </aside>
  <nav className="lg:hidden fixed bottom-0 inset-x-0" data-testid="navigation-bar">
    <NavigationBar items={navItems} />
  </nav>
</div>

// nav items must include:
<a data-testid="nav-item-clientes" href="/clientes" aria-current={isClientesActive ? 'page' : undefined}>
  Clientes
</a>
<a data-testid="nav-item-contactos" href="/contactos" aria-current={isContactosActive ? 'page' : undefined}>
  Contactos
</a>

// clientes.tsx placeholder
<div data-testid="clientes-page">Clientes</div>

// contactos.tsx placeholder
<div data-testid="contactos-page">Contactos</div>

// 404 view
<div data-testid="not-found-view">
  <p>Página no encontrada</p>
  <a data-testid="not-found-back-link" href="/clientes">Volver a Clientes</a>
</div>
```

---

## Implementation Checklist

### Test Group: AC1 — Desktop NavigationRail

**E2E File:** `e2e/tests/navigation/navigation-shell.spec.ts`
**Component File:** `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` with `createFileRoute('/_app')` as pathless layout route
- [ ] Implement `AppLayout` component inside `_app.tsx` with flex layout (h-screen)
- [ ] Add `NavigationRail` from siesa-ui-kit with `data-testid="navigation-rail"` inside `<aside className="hidden lg:flex">`
- [ ] Add nav items array with Clientes and Contactos entries (labels in Spanish)
- [ ] Pass `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"` to individual nav items
- [ ] Wire TanStack Router `Link` or siesa-ui-kit link prop to `/clientes` and `/contactos`
- [ ] Export `AppLayout` as named export from `_app.tsx` for component tests
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] Run component tests: `pnpm --filter frontend run test src/routes/__tests__/navigation.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC2 — Mobile NavigationBar

**Tasks to make these tests pass:**

- [ ] Add `NavigationBar` from siesa-ui-kit with `data-testid="navigation-bar"` inside `<nav className="lg:hidden fixed bottom-0 inset-x-0">`
- [ ] Ensure the same nav items array is shared between NavigationRail and NavigationBar
- [ ] Verify Tailwind `lg:hidden` hides NavigationBar on desktop and `hidden lg:flex` hides NavigationRail on mobile
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC3 — Deep Linking

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `createFileRoute('/_app/clientes')` and `ClientesPage` placeholder (`<div data-testid="clientes-page">Clientes</div>`)
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `createFileRoute('/_app/contactos')` and `ContactosPage` placeholder (`<div data-testid="contactos-page">Contactos</div>`)
- [ ] Update `frontend/src/routes/index.tsx` to use `beforeLoad: () => { throw redirect({ to: '/clientes' }) }` pattern
- [ ] Confirm `routeTree.gen.ts` is regenerated (run `pnpm --filter frontend run dev` while creating files)
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC4 — 404 Not Found

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/$404.tsx` OR configure `notFoundComponent` on `__root.tsx`
- [ ] Implement not-found view: `<div data-testid="not-found-view"><p>Página no encontrada</p><Link data-testid="not-found-back-link" to="/clientes">Volver a Clientes</Link></div>`
- [ ] Verify the 404 view renders inside the layout shell (navigation still visible)
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC5 — Active Item Highlighting

**Tasks to make these tests pass:**

- [ ] Import `useRouterState` from `@tanstack/react-router` in `_app.tsx`
- [ ] Compute `isClientesActive = currentPath.startsWith('/clientes')` and `isContactosActive = currentPath.startsWith('/contactos')`
- [ ] Pass `aria-current={isClientesActive ? 'page' : undefined}` to `data-testid="nav-item-clientes"`
- [ ] Pass `aria-current={isContactosActive ? 'page' : undefined}` to `data-testid="nav-item-contactos"`
- [ ] Verify highlighting updates reactively when navigating between routes
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"`
- [ ] Run component tests with mocked router state
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC6 — ARIA Labels and Accessibility

**Tasks to make these tests pass:**

- [ ] Add `aria-label="Navegación principal"` to the outermost navigation wrapper element (the `<div>` or `<header>` wrapping both rail and bar)
- [ ] Ensure each nav item renders as an `<a>` tag or element with `role="link"` for keyboard accessibility
- [ ] Ensure the NavigationBar renders as or within a `<nav>` element (HTML landmark)
- [ ] Run E2E tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"`
- [ ] Run component tests: `pnpm --filter frontend run test src/routes/__tests__/navigation.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 30 minutes

---

## Running Tests

```bash
# Run all E2E failing tests for Story 1.2
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run E2E tests filtered by AC
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"

# Debug specific E2E test
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests (Vitest + RTL)
pnpm --filter frontend run test src/routes/__tests__/navigation.test.tsx

# Run component tests in watch mode
pnpm --filter frontend run test -- --watch src/routes/__tests__/navigation.test.tsx

# Run all tests (E2E + component)
pnpm exec playwright test && pnpm --filter frontend run test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 20 E2E tests written and failing (`e2e/tests/navigation/navigation-shell.spec.ts`)
- ✅ 13 component tests written and failing (`frontend/src/routes/__tests__/navigation.test.tsx`)
- ✅ No data factories needed (pure UI navigation story)
- ✅ No fixtures added (existing base.fixture.ts is sufficient)
- ✅ Mock requirements documented (none required)
- ✅ Required data-testid attributes listed
- ✅ Implementation checklist created per AC group

**Verification:**

- All E2E tests fail because `_app.tsx`, route files, and UI components do not exist yet
- All component tests fail because `frontend/src/routes/_app.tsx` does not exist (import error)
- Failure messages are clear: "locator not found", "import error", "route not defined"

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with AC3** (deep linking routes) — create `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`, update `index.tsx`
2. **Then AC1** (NavigationRail) — add siesa-ui-kit NavigationRail to `_app.tsx` with data-testid attributes
3. **Then AC2** (NavigationBar) — add siesa-ui-kit NavigationBar to `_app.tsx` for mobile
4. **Then AC5** (active highlighting) — wire `useRouterState` and `aria-current` attribute
5. **Then AC4** (404 view) — add not-found route or component
6. **Then AC6** (ARIA) — add `aria-label="Navegación principal"` and verify nav landmark

**Key Principles:**

- One AC group at a time
- Run tests after each group to verify progress
- Use `data-testid` attributes exactly as specified in this checklist
- All user-facing text MUST be in Spanish

**Progress Tracking:**

- Check off tasks in Implementation Checklist as completed
- Mark story as IN PROGRESS in sprint status

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 33 tests pass (20 E2E + 13 component)
2. Review `_app.tsx` for code quality and readability
3. Extract nav items array to a separate constants file if needed
4. Ensure dark mode classes do not break layout (not required for MVP but must not break)
5. Optimize active route detection if using complex routing paths
6. Run full test suite one final time before story approval

---

## Next Steps

1. **Share this checklist** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase:
   - `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
   - `pnpm --filter frontend run test src/routes/__tests__/navigation.test.tsx`
3. **Begin implementation** using the Implementation Checklist above
4. **Work AC group by AC group** — run tests to confirm green after each group
5. **When all 33 tests pass**, proceed to refactor phase
6. **When refactoring complete**, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation pattern (applied in E2E test setup)
- **selector-resilience.md** — data-testid selectors used exclusively (never CSS class selectors)
- **test-quality.md** — One assertion per test (atomic tests), explicit waits only
- **component-tdd.md** — Given-When-Then structure, vi.mock for router state isolation
- **fixture-architecture.md** — Existing base.fixture.ts reused; no new fixtures needed
- **test-levels-framework.md** — E2E for full journeys (AC1-AC4); Component for UI behavior in isolation (AC1, AC2, AC5, AC6)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected failures:**
- All 20 E2E tests fail with: `Error: Locator not found: [data-testid="navigation-rail"]` (and similar for other testids)
- Tests fail because `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx` do not exist — TanStack Router renders no layout shell

**Component Command:** `pnpm --filter frontend run test src/routes/__tests__/navigation.test.tsx`

**Expected failures:**
- All 13 component tests fail with: `Error: Cannot find module '../_app'` — `_app.tsx` does not exist yet

**Summary:**

- Total tests: 33 (20 E2E + 13 component)
- Passing: 0 (expected in RED phase)
- Failing: 33 (expected — missing implementation)
- Status: ✅ RED phase verified

---

## Notes

- `__root.tsx` already has `data-testid="app-root"` from Story 1.1 — do NOT remove this attribute
- `routeTree.gen.ts` will auto-regenerate when new route files are added and `pnpm --filter frontend run dev` is running
- The siesa-ui-kit `NavigationRail` and `NavigationBar` components may have their own internal DOM structure — the `data-testid` attributes should be applied to the wrapper elements in `_app.tsx`, not passed as props to siesa-ui-kit components (unless the kit supports a `data-testid` prop)
- React 19 + Vite 8 are in use (not React 18 + Vite 7) — ensure siesa-ui-kit is compatible with React 19
- TailwindCSS v4 is in use — the `lg:` breakpoint is 1024px as per architecture spec
- Component tests use `vi.mock('@tanstack/react-router')` to isolate router state — this pattern requires Vitest's module mock hoisting; ensure `mockCurrentPath()` is called before `render()`

---

**Generated by BMad TEA Agent** — 2026-06-17
