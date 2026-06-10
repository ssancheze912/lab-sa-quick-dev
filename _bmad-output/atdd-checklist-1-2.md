# ATDD Checklist - Epic 1, Story 2: Frontend Navigation Shell

**Date:** 2026-06-10
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + React Testing Library)

---

## Story Summary

Users need a persistent navigation structure to move between Clientes and Contactos sections of the application without full page reloads on both desktop and mobile devices. The shell provides a NavigationRail on desktop (left side, 72px collapsed) and a NavigationBar at the bottom on mobile (viewport < 1024px), powered by TanStack Router for SPA navigation and siesa-ui-kit for UI components.

**As a** user
**I want** a persistent navigation structure to access Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop (viewport >= 1024px): NavigationRail visible on left with "Clientes" and "Contactos" entries; clicking navigates without page reload (FR28)
2. Mobile (viewport < 1024px): NavigationBar displayed at bottom; all nav items accessible and tappable with minimum 44px touch targets (FR29)
3. Deep linking: typing /clientes or /contactos in URL bar renders the correct view without redirection (FR30)
4. Unknown route: a 404 / not-found view is displayed in Spanish with a link back to /clientes
5. Root redirect: accessing "/" automatically redirects to "/clientes"
6. Active state: the active nav item is visually highlighted using primary-50 background and primary-700 text (Siesa navigation standard)

---

## Failing Tests Created (RED Phase)

### Component Tests — root.test.tsx (11 tests)

**File:** `frontend/src/routes/__tests__/root.test.tsx` (163 lines)

- **Test:** should render data-testid="navigation-rail" when app is loaded
  - **Status:** RED — navigation-rail testid does not exist in current __root.tsx
  - **Verifies:** AC1 - NavigationRail present on desktop

- **Test:** should render nav-item-clientes inside NavigationRail
  - **Status:** RED — nav-item-clientes testid does not exist
  - **Verifies:** AC1 - Clientes nav item present

- **Test:** should render nav-item-contactos inside NavigationRail
  - **Status:** RED — nav-item-contactos testid does not exist
  - **Verifies:** AC1 - Contactos nav item present

- **Test:** should render nav-item-clientes with text "Clientes"
  - **Status:** RED — nav-item-clientes testid not found
  - **Verifies:** AC1 - Clientes label is in Spanish

- **Test:** should render nav-item-contactos with text "Contactos"
  - **Status:** RED — nav-item-contactos testid not found
  - **Verifies:** AC1 - Contactos label is in Spanish

- **Test:** should render data-testid="navigation-bar" in the document
  - **Status:** RED — navigation-bar testid does not exist
  - **Verifies:** AC2 - NavigationBar present for mobile

- **Test:** should apply aria-current="page" to Clientes nav item when on /clientes
  - **Status:** RED — aria-current attribute not applied
  - **Verifies:** AC6 - Active state on Clientes

- **Test:** should NOT apply aria-current="page" to Contactos nav item when on /clientes
  - **Status:** RED — no active state logic exists
  - **Verifies:** AC6 - Inactive state on Contactos

- **Test:** should apply aria-current="page" to Contactos nav item when on /contactos
  - **Status:** RED — aria-current attribute not applied
  - **Verifies:** AC6 - Active state on Contactos

- **Test:** should NOT apply aria-current="page" to Clientes nav item when on /contactos
  - **Status:** RED — no active state logic exists
  - **Verifies:** AC6 - Inactive state on Clientes

- **Test:** should have aria-label on Clientes nav item
  - **Status:** RED — aria-label not set on nav items
  - **Verifies:** Accessibility — WCAG 2.1 AA compliance

- **Test:** should have aria-label on Contactos nav item
  - **Status:** RED — aria-label not set on nav items
  - **Verifies:** Accessibility — WCAG 2.1 AA compliance

### Component Tests — notFound.test.tsx (4 tests)

**File:** `frontend/src/routes/__tests__/notFound.test.tsx` (62 lines)

- **Test:** should render data-testid="not-found-view" for an unknown route
  - **Status:** RED — notFoundComponent not configured in __root.tsx
  - **Verifies:** AC4 - 404 view rendered for unknown routes

- **Test:** should display "Página no encontrada" message in Spanish
  - **Status:** RED — notFoundComponent not implemented
  - **Verifies:** AC4 - Spanish-language error message

- **Test:** should render a link with text "Ir a Clientes" that points to /clientes
  - **Status:** RED — NotFoundView component not yet created
  - **Verifies:** AC4 - Recovery link back to /clientes

- **Test:** should not render clientes-view or contactos-view for an unknown route
  - **Status:** RED — no route isolation for 404
  - **Verifies:** AC4 - Not-found view is exclusive content for unknown routes

### Component Tests — index.test.tsx (6 tests)

**File:** `frontend/src/routes/__tests__/index.test.tsx` (87 lines)

- **Test:** should redirect "/" to "/clientes" automatically
  - **Status:** RED — index.tsx renders HomePage, no redirect implemented
  - **Verifies:** AC5 - Root path redirects to /clientes

- **Test:** should show /clientes URL after root redirect (no home screen shown)
  - **Status:** RED — router stays at "/" without redirect logic
  - **Verifies:** AC5 - URL updates to /clientes post-redirect

- **Test:** should render clientes-view when navigating directly to /clientes
  - **Status:** RED — /clientes route does not exist in routeTree
  - **Verifies:** AC3 - Deep linking to /clientes works

- **Test:** should render contactos-view when navigating directly to /contactos
  - **Status:** RED — /contactos route does not exist in routeTree
  - **Verifies:** AC3 - Deep linking to /contactos works

- **Test:** should NOT show clientes-view when on /contactos (correct route isolation)
  - **Status:** RED — routes not yet created
  - **Verifies:** AC3 - Route isolation between clientes and contactos

- **Test:** should NOT show contactos-view when on /clientes (correct route isolation)
  - **Status:** RED — routes not yet created
  - **Verifies:** AC3 - Route isolation between clientes and contactos

---

## Data Factories Created

No data factories required for this story. This story is a pure frontend navigation shell with no backend API calls or domain entities.

---

## Fixtures Created

No custom Playwright-style fixtures required. Tests use the TanStack Router `createMemoryHistory` + `createRouter` pattern directly, which provides isolation per test through separate router instances.

**Reusable helper in each test file:**

```typescript
function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}
```

This function serves as a lightweight test fixture — a new isolated router is created per test, ensuring no cross-test state contamination.

---

## Mock Requirements

No external services need mocking for this story. The navigation shell is purely client-side with no network calls. TanStack Router's `createMemoryHistory` provides full route isolation in tests without any network interception required.

---

## Required data-testid Attributes

### NavigationRail (desktop wrapper)

- `navigation-rail` — Wrapper element around the desktop NavigationRail component

### NavigationBar (mobile wrapper)

- `navigation-bar` — Wrapper element around the mobile NavigationBar component

### Navigation Items (both rail and bar)

- `nav-item-clientes` — The "Clientes" navigation item/link element
- `nav-item-contactos` — The "Contactos" navigation item/link element

### Route Views

- `clientes-view` — Root element of the ClientesView placeholder (`_app/clientes.tsx`)
- `contactos-view` — Root element of the ContactosView placeholder (`_app/contactos.tsx`)
- `not-found-view` — Root element of the NotFoundView component in `__root.tsx`

**Implementation Example:**

```tsx
// __root.tsx — NavigationRail wrapper
<div data-testid="navigation-rail" className="hidden lg:flex">
  <NavigationRail items={navigationItems} />
</div>

// __root.tsx — NavigationBar wrapper
<div data-testid="navigation-bar" className="flex lg:hidden">
  <NavigationBar items={navigationItems} />
</div>

// Nav items (inside NavigationRail / NavigationBar rendering)
<Link
  to="/clientes"
  data-testid="nav-item-clientes"
  aria-label="Ir a Clientes"
  aria-current={isActive('/clientes') ? 'page' : undefined}
>
  <UsersIcon /> Clientes
</Link>

// _app/clientes.tsx
<div data-testid="clientes-view">Clientes</div>

// _app/contactos.tsx
<div data-testid="contactos-view">Contactos</div>

// __root.tsx — NotFoundView
<div data-testid="not-found-view">
  <h1>Página no encontrada</h1>
  <Link to="/clientes">← Ir a Clientes</Link>
</div>
```

---

## Implementation Checklist

### Test: should render data-testid="navigation-rail" — root.test.tsx (AC1)

**File:** `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make this test pass:**

- [ ] Import `LayoutBase`, `NavigationRail`, `NavigationBar` from `siesa-ui-kit` in `__root.tsx`
- [ ] Wrap `NavigationRail` with `data-testid="navigation-rail"` attribute
- [ ] Configure `LayoutBase` with `productName="Siesa Agents"` via `Navbar`
- [ ] Run test: `pnpm run test -- root.test.tsx`
- [ ] Add `data-testid="navigation-rail"` to the desktop nav container
- [ ] Verify test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: should render nav-item-clientes / nav-item-contactos — root.test.tsx (AC1)

**File:** `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Build `navigationItems` array: `[{ label: 'Clientes', to: '/clientes', icon: <UsersIcon /> }, { label: 'Contactos', to: '/contactos', icon: <UserIcon /> }]`
- [ ] Add `data-testid="nav-item-clientes"` to the Clientes nav element
- [ ] Add `data-testid="nav-item-contactos"` to the Contactos nav element
- [ ] Use TanStack Router `<Link>` (never `<a href>`) for navigation items
- [ ] Run test: `pnpm run test -- root.test.tsx`
- [ ] Verify tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: should render data-testid="navigation-bar" — root.test.tsx (AC2)

**File:** `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `NavigationBar` rendered in DOM with `data-testid="navigation-bar"`
- [ ] Ensure both NavigationRail and NavigationBar exist in DOM (CSS handles visibility)
- [ ] Note: `LayoutBase` from siesa-ui-kit may handle responsive behavior internally — check API first
- [ ] Run test: `pnpm run test -- root.test.tsx`
- [ ] Verify test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: aria-current="page" active state tests — root.test.tsx (AC6)

**File:** `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Use `useRouterState` or TanStack Router `<Link activeProps>` to detect active route
- [ ] Apply `aria-current="page"` to the currently active nav item
- [ ] Remove or omit `aria-current` from inactive nav items
- [ ] Option A: `<Link activeProps={{ 'aria-current': 'page' }}>` (TanStack Router built-in)
- [ ] Option B: `const isActive = location.pathname.startsWith('/clientes')` then set attr manually
- [ ] Run test: `pnpm run test -- root.test.tsx`
- [ ] Verify 4 active-state tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: aria-label accessibility tests — root.test.tsx (Accessibility)

**File:** `frontend/src/routes/__tests__/root.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `aria-label="Ir a Clientes"` to the Clientes nav item element
- [ ] Add `aria-label="Ir a Contactos"` to the Contactos nav item element
- [ ] Verify labels are in Spanish per company standards
- [ ] Run test: `pnpm run test -- root.test.tsx`
- [ ] Verify accessibility tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: 404 not-found view tests — notFound.test.tsx (AC4)

**File:** `frontend/src/routes/__tests__/notFound.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `NotFoundView` function component in `__root.tsx` (or separate file)
- [ ] Render `<div data-testid="not-found-view">` as root element
- [ ] Include `<h1>Página no encontrada</h1>` or heading with that text
- [ ] Include `<Link to="/clientes">← Ir a Clientes</Link>` (TanStack Router Link)
- [ ] Wire `notFoundComponent: NotFoundView` in `createRootRoute()`
- [ ] Run test: `pnpm run test -- notFound.test.tsx`
- [ ] Verify 4 not-found tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: root redirect tests — index.test.tsx (AC5)

**File:** `frontend/src/routes/__tests__/index.test.tsx`

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/index.tsx` to use `beforeLoad` redirect
- [ ] Implement: `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Remove the existing `HomePage` component (no home screen shown at `/`)
- [ ] Ensure TanStack Router plugin regenerates `routeTree.gen.ts`
- [ ] Run test: `pnpm run test -- index.test.tsx`
- [ ] Verify redirect tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: deep linking tests — index.test.tsx (AC3)

**File:** `frontend/src/routes/__tests__/index.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route with `LayoutBase` shell
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — renders `<div data-testid="clientes-view">Clientes</div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — renders `<div data-testid="contactos-view">Contactos</div>`
- [ ] Verify TanStack Router plugin auto-generates routes for `/clientes` and `/contactos` in `routeTree.gen.ts`
- [ ] Run test: `pnpm run test -- index.test.tsx`
- [ ] Verify deep-linking tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for Story 1.2
pnpm run test

# Run specific test file — root layout
pnpm run test -- root.test.tsx

# Run specific test file — 404 not-found
pnpm run test -- notFound.test.tsx

# Run specific test file — index redirect and deep linking
pnpm run test -- index.test.tsx

# Run tests in watch mode
pnpm run test -- --watch

# Run tests with verbose output
pnpm run test -- --reporter=verbose
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- No data factories needed (pure navigation/UI story)
- No external service mocks required
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- `root.test.tsx` — 12 tests fail: navigation-rail, navigation-bar, nav-item-*, aria-current, aria-label testids/attributes missing
- `notFound.test.tsx` — 4 tests fail: notFoundComponent not configured, not-found-view testid missing
- `index.test.tsx` — 6 tests fail: index.tsx still renders HomePage (no redirect), _app/clientes.tsx and _app/contactos.tsx routes do not exist

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with highest priority)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order (dependency-driven):**
1. Create `_app/clientes.tsx` and `_app/contactos.tsx` routes (deep-linking tests unblock first)
2. Update `index.tsx` with redirect (AC5 tests)
3. Update `__root.tsx` with LayoutBase + NavigationRail + NavigationBar + nav items (AC1, AC2)
4. Add active state logic + aria-current (AC6)
5. Add aria-label to nav items (accessibility)
6. Implement NotFoundView + wire notFoundComponent (AC4)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all tests pass (green phase complete)
2. Review `__root.tsx` for readability — extract nav item rendering to sub-components if needed
3. Verify TypeScript strict mode: no `any` types, all props typed
4. Run `pnpm exec tsc --noEmit` and confirm exit 0
5. Run `pnpm run build` and verify bundle stays under 500KB gzipped
6. Run accessibility audit: `pnpm exec axe` against rendered shell

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm run test`
3. Begin implementation using implementation checklist as guide — start with route creation
4. Work one test at a time (red to green for each)
5. When all tests pass, run TypeScript and bundle validation
6. When all validations pass, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Each test creates isolated router instance via `createTestRouter()` helper, avoiding shared state
- **network-first.md** — No network calls in this story; TanStack Router memory history replaces route interception
- **test-quality.md** — One assertion per test, explicit async waits with `screen.findByTestId`, Given-When-Then comments
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class or text-content selectors for primary assertions
- **timing-debugging.md** — `screen.findByTestId()` (async) used instead of `screen.getByTestId()` (sync) to handle React Router async rendering
- **component-tdd.md** — Components tested through TanStack RouterProvider to validate real routing behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm run test`

**Expected Failure Summary:**

- Total tests: 22 (12 in root.test.tsx + 4 in notFound.test.tsx + 6 in index.test.tsx)
- Passing: 0 (expected — implementation not yet done)
- Failing: 22 (expected — RED phase)
- Status: RED phase — all tests fail due to missing implementation, not test errors

**Expected Failure Messages:**

- `root.test.tsx`: `Unable to find an element by: [data-testid="navigation-rail"]`
- `root.test.tsx`: `Unable to find an element by: [data-testid="nav-item-clientes"]`
- `root.test.tsx`: `Unable to find an element by: [data-testid="nav-item-contactos"]`
- `root.test.tsx`: `Unable to find an element by: [data-testid="navigation-bar"]`
- `root.test.tsx`: `Expected element to have attribute: aria-current="page"` (active state)
- `root.test.tsx`: `Expected value (aria-label) to be truthy` (accessibility)
- `notFound.test.tsx`: `Unable to find an element by: [data-testid="not-found-view"]`
- `notFound.test.tsx`: `Unable to find an element with the text: /página no encontrada/i`
- `notFound.test.tsx`: `Unable to find an accessible element with the role "link" and name /ir a clientes/i`
- `index.test.tsx`: `Unable to find an element by: [data-testid="clientes-view"]` (no redirect, no clientes route)
- `index.test.tsx`: `expect(router.state.location.pathname).toBe('/clientes')` — received `'/'`
- `index.test.tsx`: `Unable to find an element by: [data-testid="contactos-view"]` (no contactos route)

---

## Notes

- `siesa-ui-kit` availability: Story 1.1 noted this package may not be on npm registry in CI. If unavailable, fallback to shadcn/ui `NavigationMenu` component — data-testid attributes remain the same, test behavior is unaffected.
- `routeTree.gen.ts` is auto-generated by TanStack Router Vite plugin. Tests import from this file. It will regenerate when new route files are added — DEV must ensure this happens before running tests.
- CSS visibility (hidden/lg:flex) is not tested in Vitest/RTL — only DOM presence is verified. E2E visual testing (Playwright) would be needed to verify actual responsive breakpoint behavior, but that is out of scope for this story's component tests.
- The `root.test.tsx` file was pre-generated by the Story 1.1 ATDD session and already exists. The `notFound.test.tsx` and `index.test.tsx` files are new additions from this ATDD session.

---

**Generated by BMad TEA Agent** — 2026-06-10
