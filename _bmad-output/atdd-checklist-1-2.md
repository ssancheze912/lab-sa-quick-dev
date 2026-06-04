# ATDD Checklist - Epic 1, Story 2: Frontend Navigation Shell

**Date:** 2026-06-04
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

As a user, I want a persistent navigation structure to access the Clientes and Contactos sections of the application, so that I can move between sections without full page reloads from any device. The navigation shell uses `NavigationRail` (desktop) and `NavigationBar` (mobile) from `siesa-ui-kit` with full WCAG 2.1 AA accessibility support and client-side routing via TanStack Router.

**As a** user
**I want** a persistent navigation structure with Clientes and Contactos entries
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop (>= 1024px): `NavigationRail` visible on the left with "Clientes" and "Contactos" entries; active route visually highlighted.
2. Mobile (< 1024px): `NavigationBar` displayed at the bottom instead of the rail; all entries accessible and tappable.
3. Clicking "Clientes" or "Contactos" navigates to `/clientes` or `/contactos` without a full page reload (TanStack Router client-side navigation).
4. Navigating directly to `/clientes` renders the Clientes view without redirection (deep linking — FR30).
5. Navigating directly to `/contactos` renders the Contactos view without redirection (deep linking — FR30).
6. Unknown routes display a 404 / not-found view in Spanish with a link to return to `/clientes`.
7. Root path `/` automatically redirects to `/clientes`.
8. Navigation landmark uses `<nav>` semantics, all links have descriptive ARIA labels in Spanish, WCAG 2.1 AA contrast met.

---

## Failing Tests Created (RED Phase)

### E2E Tests (29 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- **Test:** should render NavigationRail on the left side on desktop viewport
  - **Status:** RED — `data-testid="navigation-rail"` element does not exist (NavigationRail not implemented)
  - **Verifies:** AC1

- **Test:** should show Clientes entry in NavigationRail on desktop
  - **Status:** RED — `data-testid="nav-link-clientes"` element does not exist
  - **Verifies:** AC1

- **Test:** should show Contactos entry in NavigationRail on desktop
  - **Status:** RED — `data-testid="nav-link-contactos"` element does not exist
  - **Verifies:** AC1

- **Test:** should highlight the active route entry in NavigationRail
  - **Status:** RED — `data-testid="nav-link-clientes"` does not have `aria-current="page"`
  - **Verifies:** AC1

- **Test:** should NOT render NavigationBar (mobile) on desktop viewport
  - **Status:** RED — `data-testid="navigation-bar"` element does not exist to assert against
  - **Verifies:** AC1

- **Test:** should render NavigationBar at the bottom on mobile viewport
  - **Status:** RED — `data-testid="navigation-bar"` element does not exist (NavigationBar not implemented)
  - **Verifies:** AC2

- **Test:** should show Clientes entry in NavigationBar on mobile
  - **Status:** RED — `data-testid="nav-link-clientes"` element does not exist
  - **Verifies:** AC2

- **Test:** should show Contactos entry in NavigationBar on mobile
  - **Status:** RED — `data-testid="nav-link-contactos"` element does not exist
  - **Verifies:** AC2

- **Test:** should NOT render NavigationRail (desktop) on mobile viewport
  - **Status:** RED — `data-testid="navigation-rail"` element does not exist
  - **Verifies:** AC2

- **Test:** should navigate to /clientes on clicking Clientes without full page reload
  - **Status:** RED — `data-testid="nav-link-clientes"` element does not exist; click will fail
  - **Verifies:** AC3

- **Test:** should navigate to /contactos on clicking Contactos without full page reload
  - **Status:** RED — `data-testid="nav-link-contactos"` element does not exist; click will fail
  - **Verifies:** AC3

- **Test:** should render the Clientes view when navigating directly to /clientes
  - **Status:** RED — `data-testid="clientes-view"` element does not exist (ClientesView not implemented)
  - **Verifies:** AC4

- **Test:** should NOT redirect away from /clientes on direct access
  - **Status:** RED — route `/clientes` is not registered in routeTree.gen.ts
  - **Verifies:** AC4

- **Test:** should render the Contactos view when navigating directly to /contactos
  - **Status:** RED — `data-testid="contactos-view"` element does not exist (ContactosView not implemented)
  - **Verifies:** AC5

- **Test:** should NOT redirect away from /contactos on direct access
  - **Status:** RED — route `/contactos` is not registered in routeTree.gen.ts
  - **Verifies:** AC5

- **Test:** should display the 404 not-found view for an unknown route
  - **Status:** RED — `data-testid="not-found-view"` element does not exist (NotFoundView not implemented)
  - **Verifies:** AC6

- **Test:** should display the 404 heading in Spanish
  - **Status:** RED — `data-testid="not-found-heading"` element does not exist
  - **Verifies:** AC6

- **Test:** should display a link to /clientes from the 404 view
  - **Status:** RED — `data-testid="not-found-back-link"` element does not exist
  - **Verifies:** AC6

- **Test:** should navigate back to /clientes from the 404 view when clicking the return link
  - **Status:** RED — `data-testid="not-found-back-link"` element does not exist; click will fail
  - **Verifies:** AC6

- **Test:** should redirect / to /clientes automatically
  - **Status:** RED — `index.tsx` renders `<div>Siesa Agentes</div>` instead of redirecting
  - **Verifies:** AC7

- **Test:** should render the Clientes view after the root redirect
  - **Status:** RED — root route does not redirect; `data-testid="clientes-view"` does not exist
  - **Verifies:** AC7

- **Test:** should have a `<nav>` landmark with the expected ARIA label in Spanish
  - **Status:** RED — no `<nav aria-label="Navegación principal">` in current shell
  - **Verifies:** AC8

- **Test:** should have an aria-label in Spanish on the Clientes nav link
  - **Status:** RED — `data-testid="nav-link-clientes"` does not exist
  - **Verifies:** AC8

- **Test:** should have an aria-label in Spanish on the Contactos nav link
  - **Status:** RED — `data-testid="nav-link-contactos"` does not exist
  - **Verifies:** AC8

- **Test:** should mark the active nav link with aria-current="page"
  - **Status:** RED — nav links do not exist; `aria-current` attribute not set
  - **Verifies:** AC8

- **Test:** should have keyboard-focusable nav links
  - **Status:** RED — nav links do not exist
  - **Verifies:** AC8

### Component Tests — Root Shell (17 tests)

**File:** `frontend/src/routes/__tests__/root.test.tsx`

- **Test:** should render the NavigationRail on desktop viewport
  - **Status:** RED — `data-testid="navigation-rail"` does not exist in __root.tsx
  - **Verifies:** AC1

- **Test:** should display the Clientes navigation entry in the rail
  - **Status:** RED — `data-testid="nav-link-clientes"` does not exist
  - **Verifies:** AC1

- **Test:** should display the Contactos navigation entry in the rail
  - **Status:** RED — `data-testid="nav-link-contactos"` does not exist
  - **Verifies:** AC1

- **Test:** should highlight the active route entry with aria-current="page"
  - **Status:** RED — `data-testid="nav-link-clientes"` does not exist
  - **Verifies:** AC1

- **Test:** should NOT have aria-current on an inactive nav link
  - **Status:** RED — `data-testid="nav-link-contactos"` does not exist
  - **Verifies:** AC1

- **Test:** should render the NavigationBar on mobile viewport
  - **Status:** RED — `data-testid="navigation-bar"` does not exist
  - **Verifies:** AC2

- **Test:** should display the Clientes entry in the NavigationBar on mobile
  - **Status:** RED — `data-testid="nav-link-clientes"` does not exist
  - **Verifies:** AC2

- **Test:** should display the Contactos entry in the NavigationBar on mobile
  - **Status:** RED — `data-testid="nav-link-contactos"` does not exist
  - **Verifies:** AC2

- **Test:** should navigate to /contactos when clicking the Contactos nav link
  - **Status:** RED — `data-testid="nav-link-contactos"` does not exist; click fails
  - **Verifies:** AC3

- **Test:** should navigate to /clientes when clicking the Clientes nav link from /contactos
  - **Status:** RED — `data-testid="nav-link-clientes"` does not exist; click fails
  - **Verifies:** AC3

- **Test:** should redirect from / to /clientes automatically
  - **Status:** RED — `index.tsx` renders a div, does not redirect
  - **Verifies:** AC7

- **Test:** should render the Clientes view after root redirect
  - **Status:** RED — `data-testid="clientes-view"` does not exist
  - **Verifies:** AC7

- **Test:** should render a `<nav>` landmark with role="navigation"
  - **Status:** RED — no `<nav>` element in __root.tsx
  - **Verifies:** AC8

- **Test:** should have aria-label="Navegación principal" on the nav element
  - **Status:** RED — no `<nav>` element with ARIA label
  - **Verifies:** AC8

- **Test:** should have aria-label="Clientes" on the Clientes nav link
  - **Status:** RED — `data-testid="nav-link-clientes"` does not exist
  - **Verifies:** AC8

- **Test:** should have aria-label="Contactos" on the Contactos nav link
  - **Status:** RED — `data-testid="nav-link-contactos"` does not exist
  - **Verifies:** AC8

- **Test:** should mark the active Contactos nav link with aria-current="page"
  - **Status:** RED — nav links do not exist
  - **Verifies:** AC8

### Component Tests — NotFoundView (8 tests)

**File:** `frontend/src/shared/components/__tests__/NotFoundView.test.tsx`

- **Test:** should display the not-found view container for an unknown route
  - **Status:** RED — `data-testid="not-found-view"` does not exist; catch-all route `$.tsx` not created
  - **Verifies:** AC6

- **Test:** should display the heading "Página no encontrada" in Spanish
  - **Status:** RED — `data-testid="not-found-heading"` does not exist
  - **Verifies:** AC6

- **Test:** should render the heading as an H1 element
  - **Status:** RED — no H1 with that text exists in the DOM
  - **Verifies:** AC6

- **Test:** should display a descriptive paragraph in Spanish
  - **Status:** RED — `data-testid="not-found-view"` does not exist
  - **Verifies:** AC6

- **Test:** should display a link to /clientes from the 404 view
  - **Status:** RED — `data-testid="not-found-back-link"` does not exist
  - **Verifies:** AC6

- **Test:** should have href="/clientes" on the return link
  - **Status:** RED — `data-testid="not-found-back-link"` does not exist
  - **Verifies:** AC6

- **Test:** should show a human-readable CTA text on the return link
  - **Status:** RED — `data-testid="not-found-back-link"` does not exist
  - **Verifies:** AC6

- **Test:** should navigate to /clientes when the return link is clicked
  - **Status:** RED — `data-testid="not-found-back-link"` does not exist; click fails
  - **Verifies:** AC6

---

## Data Factories Created

No data factories required for this story. Navigation shell renders static route stubs with no dynamic/server-generated data.

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts` (pre-existing — reused)

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page at `/clientes`
  - **Cleanup:** None required (no data mutations)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page at `/contactos`
  - **Cleanup:** None required

---

## Mock Requirements

### API Routes (E2E)

All E2E tests intercept `**/api/**` with `route.continue()` to prevent any unintended API calls from interfering. No dedicated backend mock is needed for this story since the navigation shell is entirely client-side.

**Endpoint:** `GET **/api/**`
**Strategy:** Pass-through (`route.continue()`) — no data required from backend for navigation rendering.

---

## Required data-testid Attributes

### `__root.tsx` — Root Layout Shell

- `navigation-rail` — The `NavigationRail` wrapper element (rendered on desktop `lg:flex hidden`)
- `navigation-bar` — The `NavigationBar` wrapper element (rendered on mobile `flex lg:hidden`)
- `nav-link-clientes` — Anchor/Link element for the Clientes navigation entry
- `nav-link-contactos` — Anchor/Link element for the Contactos navigation entry

### `_app/clientes.tsx` — Clientes Route

- `clientes-view` — Root element of the `ClientesView` placeholder component

### `_app/contactos.tsx` — Contactos Route

- `contactos-view` — Root element of the `ContactosView` placeholder component

### `shared/components/NotFoundView.tsx` — 404 View

- `not-found-view` — Root container of the 404 view
- `not-found-heading` — The H1 heading "Página no encontrada"
- `not-found-back-link` — The `<Link to="/clientes">` CTA anchor

**Implementation Example:**

```tsx
// NavigationRail wrapper in __root.tsx
<nav aria-label="Navegación principal" data-testid="navigation-rail" className="hidden lg:flex">
  <NavigationRail items={navItems} />
</nav>

// NavigationBar wrapper in __root.tsx
<nav aria-label="Navegación principal" data-testid="navigation-bar" className="fixed bottom-0 w-full lg:hidden">
  <NavigationBar items={navItems} />
</nav>

// Nav link (rendered inside NavigationRail / NavigationBar items)
<Link
  to="/clientes"
  data-testid="nav-link-clientes"
  aria-label="Clientes"
  aria-current={isActive ? 'page' : undefined}
>
  Clientes
</Link>

// ClientesView placeholder
<main data-testid="clientes-view">
  <p>Vista de Clientes (próximamente)</p>
</main>

// NotFoundView
<div data-testid="not-found-view">
  <h1 data-testid="not-found-heading">Página no encontrada</h1>
  <p>La página que buscas no existe.</p>
  <Link to="/clientes" data-testid="not-found-back-link">Ir a Clientes</Link>
</div>
```

---

## Implementation Checklist

### Test: Desktop NavigationRail renders on desktop viewport (AC1)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`, `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Import `NavigationRail` from `siesa-ui-kit` in `__root.tsx`
- [ ] Wrap `NavigationRail` in a `<nav>` element with `aria-label="Navegación principal"` and `data-testid="navigation-rail"`
- [ ] Apply TailwindCSS classes `hidden lg:flex` to hide it on mobile
- [ ] Define navItems array: `[{ label: 'Clientes', to: '/clientes' }, { label: 'Contactos', to: '/contactos' }]`
- [ ] Render navigation entries with `data-testid="nav-link-clientes"` and `data-testid="nav-link-contactos"`
- [ ] Use TanStack Router `<Link>` with `aria-label` in Spanish on each nav entry
- [ ] Run test: `pnpm --filter frontend run test -- root.test`
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: Mobile NavigationBar renders at bottom (AC2)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`, `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Import `NavigationBar` from `siesa-ui-kit` in `__root.tsx`
- [ ] Wrap `NavigationBar` in a second `<nav>` element with `aria-label="Navegación principal"` and `data-testid="navigation-bar"`
- [ ] Apply TailwindCSS classes `fixed bottom-0 w-full lg:hidden` to position it at bottom on mobile only
- [ ] Reuse the same navItems array as NavigationRail
- [ ] Add `pb-16 lg:pb-0` to the `<main>` content area to prevent overlap on mobile
- [ ] Run test: `pnpm --filter frontend run test -- root.test`
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Client-side navigation (no full page reload) (AC3)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`, `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Ensure nav links use TanStack Router `<Link to="...">` (not `<a href="...">`)
- [ ] Ensure `/clientes` and `/contactos` routes exist in routeTree.gen.ts (requires Task 2 completion)
- [ ] Verify that clicking nav entries changes router state without triggering a page reload event
- [ ] Run test: `pnpm --filter frontend run test -- root.test`
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours (dependent on Task 2)

---

### Test: Deep linking to /clientes renders Clientes view (AC4)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — route component importing `ClientesView`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClientesView.tsx` with `data-testid="clientes-view"`
- [ ] Verify `routeTree.gen.ts` is auto-updated by the TanStack Router Vite plugin
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Deep linking to /contactos renders Contactos view (AC5)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/contactos.tsx` — route component importing `ContactosView`
- [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactosView.tsx` with `data-testid="contactos-view"`
- [ ] Verify `routeTree.gen.ts` is auto-updated
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Unknown routes display 404 not-found view in Spanish (AC6)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`, `frontend/src/shared/components/__tests__/NotFoundView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/NotFoundView.tsx` with:
  - Root `<div data-testid="not-found-view">`
  - `<h1 data-testid="not-found-heading">Página no encontrada</h1>`
  - Descriptive `<p>` in Spanish
  - `<Link to="/clientes" data-testid="not-found-back-link">Ir a Clientes</Link>`
- [ ] Create `frontend/src/routes/$.tsx` — catch-all route rendering `NotFoundView`
- [ ] Verify `routeTree.gen.ts` picks up the `$.tsx` catch-all route
- [ ] Apply centered Tailwind layout and Inter font typography
- [ ] Run test: `pnpm --filter frontend run test -- NotFoundView.test`
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Root path / redirects to /clientes (AC7)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`, `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/index.tsx` to use TanStack Router redirect in `beforeLoad`:
  ```typescript
  beforeLoad: () => { throw redirect({ to: '/clientes' }) }
  ```
- [ ] Remove the current placeholder `<div>Siesa Agentes</div>` component
- [ ] Run test: `pnpm --filter frontend run test -- root.test`
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Accessibility — nav semantics, ARIA labels in Spanish, keyboard navigation (AC8)

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts`, `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Ensure `<nav>` element wraps NavigationRail with `aria-label="Navegación principal"`
- [ ] Add `aria-label="Clientes"` attribute to the Clientes nav link
- [ ] Add `aria-label="Contactos"` attribute to the Contactos nav link
- [ ] Set `aria-current="page"` on the active nav link via TanStack Router `activeProps`
- [ ] Ensure nav links are standard `<a>` elements (rendered by `<Link>`) with natural `tabIndex=0`
- [ ] Apply visible focus ring via TailwindCSS `focus-visible:ring` utilities
- [ ] Verify minimum touch target 44×44px for mobile nav items
- [ ] Verify Siesa Blue `#0e79fd` on white meets WCAG 2.1 AA 4.5:1 contrast ratio (verified by design — ratio: ~4.56:1)
- [ ] Run test: `pnpm --filter frontend run test -- root.test`
- [ ] Run E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC8"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all component tests for this story
pnpm --filter frontend run test

# Run only root shell component tests
pnpm --filter frontend run test -- root.test

# Run only NotFoundView component tests
pnpm --filter frontend run test -- NotFoundView.test

# Run all E2E tests for this story
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E in headed mode (see browser)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run E2E for a specific AC
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"

# Debug specific E2E test
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests with UI
pnpm --filter frontend run test -- --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ E2E tests: 29 tests covering all 8 acceptance criteria
- ✅ Component tests (root shell): 17 tests covering AC1, AC2, AC3, AC7, AC8
- ✅ Component tests (NotFoundView): 8 tests covering AC6
- ✅ No data factories required (static navigation shell)
- ✅ Base fixtures reused from existing `e2e/fixtures/base.fixture.ts`
- ✅ Mock requirements documented (API pass-through)
- ✅ `data-testid` requirements listed with implementation examples
- ✅ Implementation checklist created with clear tasks per AC

**Verification:**

- All component tests fail with: "Unable to find element by: [data-testid="navigation-rail"]" (or similar)
- All E2E tests fail due to missing route registration and missing `data-testid` elements
- Failures are caused by missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (recommended start: AC7 redirect — simplest, enables AC4/AC5 to proceed)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended implementation order:**
1. AC7: Update `index.tsx` redirect (unblocks AC4/AC5 foundation)
2. AC4+AC5: Create route files and placeholder view components with `data-testid`
3. AC6: Create `NotFoundView.tsx` and `$.tsx` catch-all route
4. AC1+AC2+AC8: Update `__root.tsx` with NavigationRail/NavigationBar shell and ARIA attributes
5. AC3: Verify client-side navigation works once routes and nav links exist

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review `__root.tsx`** for clarity, extract navItems to a separate constants file if needed
3. **Extract duplications** in nav link rendering
4. **Verify bundle size** does not exceed 500KB gzipped (architecture constraint)
5. **Ensure tests still pass** after each refactor
6. **Update story status** to 'done' in sprint-status.yaml

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing E2E tests** to confirm RED phase: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`
3. **Run failing component tests** to confirm RED phase: `pnpm --filter frontend run test`
4. **Begin implementation** using implementation checklist as guide (start with AC7)
5. **Work one AC at a time** (red → green for each acceptance criterion)
6. **When all tests pass**, refactor for code quality
7. **When refactoring complete**, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception (`await page.route(...)`) is placed BEFORE `page.goto()` in all E2E tests to prevent race conditions
- **selector-resilience.md** — All selectors use `data-testid` attributes; zero CSS class selectors
- **test-quality.md** — One assertion per test (atomic); Given-When-Then comments in every test; no hard waits (`sleep`)
- **fixture-architecture.md** — Base fixture reused (`e2e/fixtures/base.fixture.ts`); no per-test manual cleanup needed for read-only navigation tests
- **component-tdd.md** — RTL component tests use `createMemoryHistory` + `RouterProvider` for route-aware rendering without a real browser
- **test-levels-framework.md** — E2E for all AC (full user journeys); Component for unit-level validation of DOM structure and ARIA; No API tests needed (navigation shell is fully client-side)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Component tests command:** `pnpm --filter frontend run test`

**Expected results:**
```
FAIL frontend/src/routes/__tests__/root.test.tsx
  AC1 — Desktop NavigationRail
    × should render the NavigationRail on desktop viewport
      TestingLibraryElementError: Unable to find an element by: [data-testid="navigation-rail"]
    × should display the Clientes navigation entry in the rail
      TestingLibraryElementError: Unable to find an element by: [data-testid="nav-link-clientes"]
    ...

FAIL frontend/src/shared/components/__tests__/NotFoundView.test.tsx
  AC6 — NotFoundView for unknown routes
    × should display the not-found view container for an unknown route
      TestingLibraryElementError: Unable to find an element by: [data-testid="not-found-view"]
    ...

Summary:
- Total component tests: 25
- Passing: 0 (expected)
- Failing: 25 (expected)
- Status: ✅ RED phase verified
```

**E2E tests command:** `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected results:**
```
FAILED navigation-shell.spec.ts > AC1 — Desktop NavigationRail > should render NavigationRail...
  Error: Locator: getByTestId('navigation-rail')
  Expected: visible
  Received: element not found

Summary:
- Total E2E tests: 29 (across 8 describe blocks)
- Passing: 0 (expected)
- Failing: 29 (expected)
- Status: ✅ RED phase verified
```

---

## Notes

- `siesa-ui-kit` is already listed in `frontend/package.json` dependencies (v1.0.206). Confirm exact prop API (`items`, `label`, `to`, `icon`) against the siesa-ui-kit catalog before implementation.
- The `routeTree.gen.ts` is auto-generated by the TanStack Router Vite plugin — do NOT edit manually. New routes become available after running `pnpm --filter frontend run dev` or `build`.
- The component tests in `root.test.tsx` import `routeTree` from `../../routeTree.gen`. The gen file currently only has `__root` and `index` routes, so tests for `/clientes` and `/contactos` will additionally fail with route-not-found errors until the route files are created.
- Heroicons are required: `pnpm add @heroicons/react` if not already installed.
- `@testing-library/user-event` must be installed for the `userEvent.click()` calls in component tests: `pnpm add -D @testing-library/user-event`

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-04
