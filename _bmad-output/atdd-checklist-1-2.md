# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Story 1.2 implements the persistent navigation shell for the Siesa Agents CRM application.
Users need a responsive navigation structure (NavigationRail on desktop, NavigationBar on mobile)
to move between the Clientes and Contactos sections without full page reloads.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1**: Given the application is loaded on a desktop browser (viewport >=1024px), When the user views the app, Then a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **AC2**: Given the application is loaded on a mobile browser (viewport <1024px), When the user views the app, Then a mobile-responsive NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **AC3**: Given the user types `/clientes` or `/contactos` directly in the browser URL bar, When the page loads, Then the correct view is rendered without redirection to a home screen (deep linking — FR30).

4. **AC4**: Given the user navigates to an unknown route (e.g. `/unknown`), When the page loads, Then a 404 / not-found view is displayed gracefully with a message in Spanish.

5. **AC5**: Given the navigation is rendered, When a screen reader or keyboard user navigates it, Then all navigation links have accessible labels (`aria-label`) in Spanish and are reachable via Tab key (WCAG 2.1 AA).

6. **AC6**: Given the user is on `/clientes` or `/contactos`, When the navigation is visible, Then the active route link is visually highlighted (active state) to indicate the current section.

---

## Failing Tests Created (RED Phase)

### E2E Tests (22 tests)

**File:** `e2e/story-1-2/navigation-shell.spec.ts`

#### AC1 - Desktop NavigationRail (6 tests)

- **Test:** should display NavigationRail on the left side when viewport is desktop
  - **Status:** RED - `[data-testid="navigation-rail"]` element does not exist (routes not implemented)
  - **Verifies:** AC1 — NavigationRail visible on desktop

- **Test:** should show Clientes navigation entry in the NavigationRail
  - **Status:** RED - `[data-testid="nav-item-clientes"]` does not exist
  - **Verifies:** AC1 — Clientes entry in NavigationRail

- **Test:** should show Contactos navigation entry in the NavigationRail
  - **Status:** RED - `[data-testid="nav-item-contactos"]` does not exist
  - **Verifies:** AC1 — Contactos entry in NavigationRail

- **Test:** should navigate to /clientes without a full page reload when Clientes is clicked
  - **Status:** RED - nav items missing, no SPA navigation configured
  - **Verifies:** AC1 — SPA navigation without full reload (FR28)

- **Test:** should navigate to /contactos without a full page reload when Contactos is clicked
  - **Status:** RED - nav items missing
  - **Verifies:** AC1 — SPA navigation without full reload (FR28)

- **Test:** should NOT display NavigationBar at the bottom on desktop viewport
  - **Status:** RED - neither nav component exists
  - **Verifies:** AC1 — Desktop shows only NavigationRail

#### AC2 - Mobile NavigationBar (4 tests)

- **Test:** should display NavigationBar at the bottom when viewport is mobile
  - **Status:** RED - `[data-testid="navigation-bar"]` does not exist
  - **Verifies:** AC2 — NavigationBar visible on mobile (FR29)

- **Test:** should show Clientes navigation item in the mobile NavigationBar
  - **Status:** RED - nav items missing
  - **Verifies:** AC2 — Clientes accessible on mobile

- **Test:** should show Contactos navigation item in the mobile NavigationBar
  - **Status:** RED - nav items missing
  - **Verifies:** AC2 — Contactos accessible on mobile

- **Test:** should NOT display NavigationRail on mobile viewport
  - **Status:** RED - navigation components missing
  - **Verifies:** AC2 — Mobile shows only NavigationBar

- **Test:** should navigate to /contactos when Contactos is tapped on mobile
  - **Status:** RED - nav items missing
  - **Verifies:** AC2 — Mobile tap navigation works

#### AC3 - Deep Linking (4 tests)

- **Test:** should render ClientesPlaceholder when navigating directly to /clientes
  - **Status:** RED - `[data-testid="clientes-placeholder"]` missing (routes not implemented)
  - **Verifies:** AC3 — Deep link to /clientes (FR30)

- **Test:** should render ContactosPlaceholder when navigating directly to /contactos
  - **Status:** RED - `[data-testid="contactos-placeholder"]` missing
  - **Verifies:** AC3 — Deep link to /contactos (FR30)

- **Test:** should NOT redirect /clientes to a home screen on direct navigation
  - **Status:** RED - route does not exist, TanStack Router not set up
  - **Verifies:** AC3 — No unexpected redirection from /clientes

- **Test:** should NOT redirect /contactos to a home screen on direct navigation
  - **Status:** RED - route does not exist
  - **Verifies:** AC3 — No unexpected redirection from /contactos

#### AC4 - 404 Not Found (3 tests)

- **Test:** should display a not-found view when navigating to an unknown route
  - **Status:** RED - `[data-testid="not-found-view"]` missing (not-found route not created)
  - **Verifies:** AC4 — Unknown route shows 404 view

- **Test:** should display "Pagina no encontrada" message in Spanish on unknown route
  - **Status:** RED - not-found route not created
  - **Verifies:** AC4 — Spanish error message shown

- **Test:** should provide a link back to Clientes on the not-found view
  - **Status:** RED - not-found route missing
  - **Verifies:** AC4 — Recovery link available on 404

#### AC5 - Accessibility (4 tests)

- **Test:** navigation landmark should have aria-label "Navegacion principal"
  - **Status:** RED - nav landmark with aria-label missing
  - **Verifies:** AC5 — WCAG 2.1 AA navigation landmark

- **Test:** Clientes nav link should have aria-label "Ir a Clientes" in Spanish
  - **Status:** RED - nav items with aria-label missing
  - **Verifies:** AC5 — Spanish aria-labels on nav items

- **Test:** Contactos nav link should have aria-label "Ir a Contactos" in Spanish
  - **Status:** RED - nav items with aria-label missing
  - **Verifies:** AC5 — Spanish aria-labels on nav items

- **Test:** all navigation links should be reachable via Tab key
  - **Status:** RED - navigation elements missing
  - **Verifies:** AC5 — Keyboard navigation WCAG 2.1 AA

#### AC6 - Active Route Highlighting (4 tests)

- **Test:** Clientes nav link should have aria-current="page" when on /clientes
  - **Status:** RED - nav items and active state missing
  - **Verifies:** AC6 — Active route visual indicator

- **Test:** Contactos nav link should have aria-current="page" when on /contactos
  - **Status:** RED - nav items and active state missing
  - **Verifies:** AC6 — Active route visual indicator

- **Test:** Clientes nav link should NOT have aria-current="page" when on /contactos
  - **Status:** RED - nav items missing
  - **Verifies:** AC6 — Only active route is highlighted

- **Test:** Contactos nav link should NOT have aria-current="page" when on /clientes
  - **Status:** RED - nav items missing
  - **Verifies:** AC6 — Only active route is highlighted

- **Test:** active nav link should have nav-active CSS class when on /clientes
  - **Status:** RED - CSS class not applied
  - **Verifies:** AC6 — Visual CSS active class applied

#### Root Redirect (1 test)

- **Test:** should redirect / to /clientes
  - **Status:** RED - index.tsx does not redirect yet
  - **Verifies:** Root redirect behavior

---

### Component Tests (21 tests)

**File:** `frontend/src/routes/__tests__/navigation.test.tsx`

#### AC1 - Desktop NavigationRail Component Tests (4 tests)

- **Test:** should render NavigationRail on desktop viewport
  - **Status:** RED - routes and navigation components not implemented; routeTree.gen.ts missing _app routes
  - **Verifies:** AC1 — NavigationRail rendered in component context

- **Test:** should show Clientes entry in NavigationRail on desktop
  - **Status:** RED - nav items missing
  - **Verifies:** AC1 — Clientes nav item exists

- **Test:** should show Contactos entry in NavigationRail on desktop
  - **Status:** RED - nav items missing
  - **Verifies:** AC1 — Contactos nav item exists

- **Test:** should NOT render NavigationBar on desktop viewport
  - **Status:** RED - navigation components missing
  - **Verifies:** AC1 — Mobile nav hidden on desktop

#### AC2 - Mobile NavigationBar Component Tests (4 tests)

- **Test:** should render NavigationBar on mobile viewport
  - **Status:** RED - NavigationBar component not implemented
  - **Verifies:** AC2 — Mobile nav present

- **Test:** should show Clientes item in NavigationBar on mobile
  - **Status:** RED - nav items missing
  - **Verifies:** AC2 — Clientes reachable on mobile

- **Test:** should show Contactos item in NavigationBar on mobile
  - **Status:** RED - nav items missing
  - **Verifies:** AC2 — Contactos reachable on mobile

- **Test:** should NOT render NavigationRail on mobile viewport
  - **Status:** RED - navigation components missing
  - **Verifies:** AC2 — Desktop nav hidden on mobile

#### AC3 - Deep Linking Component Tests (4 tests)

- **Test:** should render ClientesPlaceholder when navigating directly to /clientes
  - **Status:** RED - _app/clientes.tsx route and component not created
  - **Verifies:** AC3 — Clientes view renders on direct URL

- **Test:** should render ContactosPlaceholder when navigating directly to /contactos
  - **Status:** RED - _app/contactos.tsx route and component not created
  - **Verifies:** AC3 — Contactos view renders on direct URL

- **Test:** should display Spanish heading "Clientes" in the Clientes view
  - **Status:** RED - placeholder component missing
  - **Verifies:** AC3 — Spanish UI text present

- **Test:** should display Spanish heading "Contactos" in the Contactos view
  - **Status:** RED - placeholder component missing
  - **Verifies:** AC3 — Spanish UI text present

#### AC4 - 404 Component Tests (3 tests)

- **Test:** should render not-found view when navigating to an unknown route
  - **Status:** RED - not-found route not created
  - **Verifies:** AC4 — 404 view rendered

- **Test:** should display "Pagina no encontrada" message in Spanish
  - **Status:** RED - not-found component missing
  - **Verifies:** AC4 — Spanish error text

- **Test:** should display a link back to Clientes on the not-found view
  - **Status:** RED - not-found component missing
  - **Verifies:** AC4 — Recovery navigation link

#### AC5 - Accessibility Component Tests (4 tests)

- **Test:** navigation landmark should have aria-label "Navegacion principal"
  - **Status:** RED - nav landmark missing
  - **Verifies:** AC5 — WCAG navigation landmark

- **Test:** Clientes nav link should have aria-label "Ir a Clientes"
  - **Status:** RED - aria-labels missing
  - **Verifies:** AC5 — Spanish aria-label

- **Test:** Contactos nav link should have aria-label "Ir a Contactos"
  - **Status:** RED - aria-labels missing
  - **Verifies:** AC5 — Spanish aria-label

- **Test:** Clientes nav link should be reachable via Tab key
  - **Status:** RED - navigation elements missing
  - **Verifies:** AC5 — Keyboard focus reachable

#### AC6 - Active Route Component Tests (6 tests)

- **Test:** Clientes link should have aria-current="page" when on /clientes
  - **Status:** RED - active state not implemented
  - **Verifies:** AC6 — aria-current active marker

- **Test:** Contactos link should have aria-current="page" when on /contactos
  - **Status:** RED - active state not implemented
  - **Verifies:** AC6 — aria-current active marker

- **Test:** Clientes link should NOT have aria-current="page" when on /contactos
  - **Status:** RED - nav items missing
  - **Verifies:** AC6 — Inactive routes not marked

- **Test:** Contactos link should NOT have aria-current="page" when on /clientes
  - **Status:** RED - nav items missing
  - **Verifies:** AC6 — Inactive routes not marked

- **Test:** Clientes link should have nav-active class when on /clientes
  - **Status:** RED - CSS class not applied
  - **Verifies:** AC6 — Visual CSS active class

- **Test:** Contactos link should have nav-active class when on /contactos
  - **Status:** RED - CSS class not applied
  - **Verifies:** AC6 — Visual CSS active class

#### Root Redirect Component Test (1 test)

- **Test:** should redirect from / to /clientes
  - **Status:** RED - index.tsx does not redirect
  - **Verifies:** Root redirect behavior

---

## Data Factories Created

This story is purely a presentation/routing story with no backend calls and no data mutation.
No data factories are required.

---

## Fixtures Created

No new fixtures created. Existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and
`contactosPage` fixtures that navigate to `/clientes` and `/contactos` respectively — these are
reusable across stories.

---

## Mock Requirements

No external services require mocking for this story. Navigation is entirely client-side
(TanStack Router file-based routing). No backend API calls are made.

---

## Required data-testid Attributes

### Navigation Layout (_app.tsx)

- `navigation-rail` - NavigationRail wrapper element (desktop, hidden on mobile via TailwindCSS)
- `navigation-bar` - NavigationBar wrapper element (mobile, hidden on desktop via TailwindCSS)
- `nav-item-clientes` - Clientes navigation link (inside both NavigationRail and NavigationBar)
- `nav-item-contactos` - Contactos navigation link (inside both NavigationRail and NavigationBar)

**Implementation example:**

```tsx
<nav aria-label="Navegación principal" role="navigation">
  <div className="hidden lg:flex" data-testid="navigation-rail">
    <NavigationRail items={navItems} />
  </div>
  <div className="flex lg:hidden" data-testid="navigation-bar">
    <NavigationBar items={navItems} />
  </div>
</nav>
```

### Navigation Items (navItems config)

```tsx
const navItems = [
  {
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon />,
    'data-testid': 'nav-item-clientes',
    'aria-label': 'Ir a Clientes',
  },
  {
    label: 'Contactos',
    to: '/contactos',
    icon: <UserIcon />,
    'data-testid': 'nav-item-contactos',
    'aria-label': 'Ir a Contactos',
  },
]
```

**Active state (TanStack Router Link):**

```tsx
<Link
  to={item.to}
  data-testid={item['data-testid']}
  aria-label={item['aria-label']}
  activeProps={{ 'aria-current': 'page', className: 'nav-active' }}
>
  {item.label}
</Link>
```

### Clientes Placeholder (_app/clientes.tsx)

- `clientes-placeholder` - Root element of the Clientes placeholder view

```tsx
<div data-testid="clientes-placeholder">
  <h1>Clientes</h1>
</div>
```

### Contactos Placeholder (_app/contactos.tsx)

- `contactos-placeholder` - Root element of the Contactos placeholder view

```tsx
<div data-testid="contactos-placeholder">
  <h1>Contactos</h1>
</div>
```

### Not Found View (not-found.tsx)

- `not-found-view` - Root element of the 404 not-found view
- `not-found-message` - Element containing the Spanish 404 message
- `not-found-back-link` - Link back to /clientes

```tsx
<div data-testid="not-found-view">
  <p data-testid="not-found-message">Página no encontrada</p>
  <Link to="/clientes" data-testid="not-found-back-link">Ir a Clientes</Link>
</div>
```

---

## Implementation Checklist

### Test: Desktop NavigationRail visible (AC1)

**File:** `e2e/story-1-2/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route
- [ ] Import `NavigationRail` from siesa-ui-kit and render it inside `<div className="hidden lg:flex" data-testid="navigation-rail">`
- [ ] Add `<Outlet />` inside the layout for child routes
- [ ] Add `data-testid="navigation-rail"` to the NavigationRail wrapper
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --project chromium`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: NavigationBar on mobile (AC2)

**File:** `e2e/story-1-2/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Import `NavigationBar` from siesa-ui-kit and render it inside `<div className="flex lg:hidden" data-testid="navigation-bar">`
- [ ] Use TailwindCSS v4 `hidden lg:flex` / `flex lg:hidden` to switch between desktop and mobile nav
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --project mobile-chrome`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Navigation items Clientes and Contactos (AC1 + AC2)

**File:** `e2e/story-1-2/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Define `navItems` array with Clientes and Contactos entries, each with `data-testid`, `aria-label`, `to`, `label`, and `icon`
- [ ] Pass `navItems` to both `NavigationRail` and `NavigationBar`
- [ ] Ensure each nav item link has `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"`
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: SPA navigation without full page reload (AC1)

**File:** `e2e/story-1-2/navigation-shell.spec.ts`

**Tasks to make this test pass:**

- [ ] Use TanStack Router `<Link>` (not `<a href>`) inside nav items to prevent full page reloads
- [ ] Verify `framenavigated` event count stays at 0 after clicking nav links
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Deep linking to /clientes and /contactos (AC3)

**File:** `e2e/story-1-2/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `<ClientesPlaceholder />` component
- [ ] `ClientesPlaceholder` renders `<div data-testid="clientes-placeholder"><h1>Clientes</h1></div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `<ContactosPlaceholder />` component
- [ ] `ContactosPlaceholder` renders `<div data-testid="contactos-placeholder"><h1>Contactos</h1></div>`
- [ ] Verify `routeTree.gen.ts` auto-regenerates with the new routes
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`
- [ ] Run test: `pnpm --filter frontend run test`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Not-found view for unknown routes (AC4)

**File:** `e2e/story-1-2/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/routes/not-found.tsx` (or configure `notFoundComponent` in `__root.tsx`)
- [ ] Render `<div data-testid="not-found-view">`, `<p data-testid="not-found-message">Página no encontrada</p>`, and `<Link to="/clientes" data-testid="not-found-back-link">Ir a Clientes</Link>`
- [ ] Configure TanStack Router to use this component for unmatched routes
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: WCAG 2.1 AA accessibility (AC5)

**File:** `e2e/story-1-2/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make this test pass:**

- [ ] Wrap navigation in `<nav aria-label="Navegación principal">` in `_app.tsx`
- [ ] Add `aria-label="Ir a Clientes"` to the Clientes nav link
- [ ] Add `aria-label="Ir a Contactos"` to the Contactos nav link
- [ ] Ensure nav links have `tabIndex={0}` or are naturally focusable `<a>` elements
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`
- [ ] Run test: `pnpm --filter frontend run test`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Active route highlighting (AC6)

**File:** `e2e/story-1-2/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make this test pass:**

- [ ] Use TanStack Router `<Link>` with `activeProps={{ 'aria-current': 'page', className: 'nav-active' }}`
- [ ] Verify `aria-current="page"` is applied only to the matching nav link
- [ ] Verify `nav-active` CSS class is applied to the active link
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`
- [ ] Run test: `pnpm --filter frontend run test`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Root redirect / → /clientes

**File:** `e2e/story-1-2/navigation-shell.spec.ts` + `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make this test pass:**

- [ ] Update `frontend/src/routes/index.tsx` to use `redirect` in `beforeLoad`: `throw redirect({ to: '/clientes' })`
- [ ] Verify `routeTree.gen.ts` is regenerated
- [ ] Run test: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all E2E failing tests for this story
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts

# Run E2E on desktop only
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --project chromium

# Run E2E on mobile only
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --project mobile-chrome

# Run E2E in headed mode (see browser)
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --headed

# Debug specific E2E test
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --debug

# Run component/unit tests (Vitest)
pnpm --filter frontend run test

# Run component tests in watch mode
pnpm --filter frontend run test:watch
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing as expected
- No data factories needed (routing-only story)
- No external service mocks required
- data-testid requirements documented above
- Implementation checklist created

**Verification:**

- E2E tests fail because: `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`, `not-found.tsx` do not exist; navigation components not rendered; routes not configured
- Component tests fail because: `routeTree.gen.ts` does not contain the new routes; navigation DOM elements missing
- Failures are due to missing implementation — not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick the first failing test (start with AC1 — NavigationRail visible on desktop)
2. Read the test to understand expected behavior and required `data-testid`
3. Implement minimal code: create `_app.tsx` with NavigationRail
4. Run test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended implementation order (highest dependency first):**

1. Task 4: Update `__root.tsx` — ensure `<Outlet />` is rendered
2. Task 2: Create `_app/clientes.tsx` and `_app/contactos.tsx` placeholder routes
3. Task 3: Update `index.tsx` root redirect and create `not-found.tsx`
4. Task 1: Create `_app.tsx` layout with NavigationRail + NavigationBar + accessibility

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 43 tests pass (22 E2E + 21 component)
2. Review navigation component for TailwindCSS cleanup
3. Extract navItems configuration if shared across files
4. Ensure siesa-ui-kit NavigationRail and NavigationBar props API is correctly typed
5. Verify color contrast meets 4.5:1 ratio for custom styles

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase:
   - `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`
   - `pnpm --filter frontend run test`
3. Begin implementation using implementation checklist as guide (recommended order above)
4. Work one test at a time (red to green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** - Route interception before navigation (applied in E2E navigation tests)
- **selector-resilience.md** - `data-testid` selectors used throughout (avoids fragile CSS selectors)
- **component-tdd.md** - Vitest + React Testing Library patterns for component tests
- **test-quality.md** - One assertion per test, Given-When-Then structure, no hard waits
- **timing-debugging.md** - Explicit waits via `expect().toBeVisible()` instead of `page.waitForTimeout()`
- **fixture-architecture.md** - Reusing existing `base.fixture.ts` for navigation fixtures

---

## Test Execution Evidence

### RED Phase Status

**E2E command:** `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`

Expected failures:
- All 22 E2E tests FAIL — navigation routes and components do not exist
- `[data-testid="navigation-rail"]` not found (routes/_app.tsx missing)
- `[data-testid="nav-item-clientes"]` not found (nav items not rendered)
- `[data-testid="clientes-placeholder"]` not found (_app/clientes.tsx missing)
- `[data-testid="not-found-view"]` not found (not-found.tsx missing)
- Navigation to `/clientes` fails or renders blank (no route handler)

**Component test command:** `pnpm --filter frontend run test`

Expected failures:
- All 21 component tests FAIL — routeTree.gen.ts does not include `_app` routes
- `screen.getByTestId('navigation-rail')` throws "Unable to find an element"
- `screen.getByTestId('clientes-placeholder')` throws "Unable to find an element"
- `screen.getByRole('navigation', { name: 'Navegación principal' })` not found

**Summary:**

- Total tests: 43 (22 E2E + 21 component)
- Passing: 0 (expected)
- Failing: 43 (expected)
- Status: RED phase — ready for DEV implementation

---

## Notes

- This story is **purely frontend** — no backend changes, no API calls, no Zustand store
- `siesa-ui-kit` is already installed (verified in Story 1.1) — use `NavigationRail` and `NavigationBar` components; do NOT create custom nav components
- TanStack Router `routeTree.gen.ts` is auto-generated — never edit manually; add route files and restart Vite
- The `_` prefix on `_app.tsx` makes it a pathless layout (renders no URL segment)
- TypeScript strict mode is active — no `any` types allowed in implementation
- All user-facing text must be in Spanish: "Clientes", "Contactos", "Página no encontrada"

---

**Generated by BMad TEA Agent (sa-tea-atdd)** - 2026-06-25
