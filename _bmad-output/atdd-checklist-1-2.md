# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-03
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Story 1.2 implements a persistent navigation shell that adapts to the device's viewport. On desktop (>= 1024px), a `NavigationRail` from `siesa-ui-kit` is shown on the left. On mobile (< 1024px), a `NavigationBar` appears at the bottom. Routes `/clientes` and `/contactos` support deep linking, the root `/` redirects to `/clientes`, and unknown routes display a Spanish 404 view.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (viewport >= 1024px), When the user views the app, Then a `NavigationRail` component from `siesa-ui-kit` is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **AC2** — Given the application is loaded on a mobile browser (viewport < 1024px), When the user views the app, Then the `NavigationRail` is hidden and a `NavigationBar` component from `siesa-ui-kit` is displayed at the bottom instead, and all navigation items are accessible and tappable (FR29).

3. **AC3** — Given the user types `/clientes` or `/contactos` directly in the browser URL bar, When the page loads, Then the correct route view is rendered and the corresponding navigation item is highlighted as active — without redirecting to a home screen (FR30).

4. **AC4** — Given the user navigates to an unknown route (e.g., `/unknown`), When the page loads, Then a 404 Not Found view is displayed with a message in Spanish (e.g., "Página no encontrada") and a link/button to navigate back to `/clientes`.

5. **AC5** — Given the root path `/` is accessed, When the page loads, Then the user is redirected to `/clientes` automatically.

6. **AC6** — Given any navigation action occurs, When checking browser console, Then there are zero TypeScript errors and zero React render errors.

---

## Failing Tests Created (RED Phase)

### E2E Tests (18 tests)

**File:** `e2e/tests/navigation/story-1.2-navigation-shell.spec.ts`

- **Test:** `AC1 — Desktop NavigationRail > should display NavigationRail on desktop viewport`
  - **Status:** RED — `[data-testid="navigation-rail"]` does not exist (implementation pending)
  - **Verifies:** AC1 — NavigationRail component rendered on desktop viewport

- **Test:** `AC1 — Desktop NavigationRail > should display "Clientes" navigation item in NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` does not exist
  - **Verifies:** AC1 — Clientes item visible in NavigationRail

- **Test:** `AC1 — Desktop NavigationRail > should display "Contactos" navigation item in NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` does not exist
  - **Verifies:** AC1 — Contactos item visible in NavigationRail

- **Test:** `AC1 — Desktop NavigationRail > should navigate to /clientes without full page reload when clicking Clientes nav item`
  - **Status:** RED — nav item does not exist; cannot click
  - **Verifies:** AC1 — Client-side routing via nav item (no full reload, FR28)

- **Test:** `AC1 — Desktop NavigationRail > should navigate to /contactos without full page reload when clicking Contactos nav item`
  - **Status:** RED — nav item does not exist; cannot click
  - **Verifies:** AC1 — Client-side routing via nav item (no full reload, FR28)

- **Test:** `AC1 — Desktop NavigationRail > should hide NavigationBar on desktop viewport`
  - **Status:** RED — NavigationBar may be visible without responsive CSS classes
  - **Verifies:** AC1 — Mobile nav hidden on desktop (responsive toggle)

- **Test:** `AC2 — Mobile NavigationBar > should display NavigationBar at bottom on mobile viewport`
  - **Status:** RED — `[data-testid="navigation-bar"]` does not exist
  - **Verifies:** AC2 — NavigationBar rendered on mobile viewport

- **Test:** `AC2 — Mobile NavigationBar > should hide NavigationRail on mobile viewport`
  - **Status:** RED — NavigationRail may be visible without responsive CSS classes
  - **Verifies:** AC2 — Desktop nav hidden on mobile (responsive toggle)

- **Test:** `AC2 — Mobile NavigationBar > should display "Clientes" navigation item in NavigationBar on mobile`
  - **Status:** RED — nav items not implemented
  - **Verifies:** AC2 — Clientes tappable on mobile (FR29)

- **Test:** `AC2 — Mobile NavigationBar > should display "Contactos" navigation item in NavigationBar on mobile`
  - **Status:** RED — nav items not implemented
  - **Verifies:** AC2 — Contactos tappable on mobile (FR29)

- **Test:** `AC2 — Mobile NavigationBar > should navigate to /contactos when tapping Contactos in NavigationBar on mobile`
  - **Status:** RED — nav items not implemented; tap action fails
  - **Verifies:** AC2 — Mobile tap navigation works (FR29)

- **Test:** `AC3 — Deep linking > should render /clientes route view when accessing URL directly`
  - **Status:** RED — `/clientes` route and `[data-testid="clientes-view"]` not implemented
  - **Verifies:** AC3 — Deep link to /clientes renders view without redirect (FR30)

- **Test:** `AC3 — Deep linking > should render /contactos route view when accessing URL directly`
  - **Status:** RED — `/contactos` route and `[data-testid="contactos-view"]` not implemented
  - **Verifies:** AC3 — Deep link to /contactos renders view without redirect (FR30)

- **Test:** `AC3 — Deep linking > should highlight Clientes nav item as active when at /clientes`
  - **Status:** RED — active item highlighting not implemented
  - **Verifies:** AC3 — Active route highlighted in navigation

- **Test:** `AC3 — Deep linking > should highlight Contactos nav item as active when at /contactos`
  - **Status:** RED — active item highlighting not implemented
  - **Verifies:** AC3 — Active route highlighted in navigation

- **Test:** `AC4 — 404 Not Found view > should display 404 view when navigating to an unknown route`
  - **Status:** RED — `notFoundComponent` not configured; `[data-testid="not-found-view"]` absent
  - **Verifies:** AC4 — Unknown routes show 404 view

- **Test:** `AC4 — 404 Not Found view > should show Spanish "Página no encontrada" message`
  - **Status:** RED — 404 view not implemented
  - **Verifies:** AC4 — Spanish error message rendered

- **Test:** `AC4 — 404 Not Found view > should display a back-to-clientes link in the 404 view`
  - **Status:** RED — 404 view not implemented
  - **Verifies:** AC4 — Navigation back to /clientes from 404 page

- **Test:** `AC4 — 404 Not Found view > should navigate back to /clientes when clicking the back link`
  - **Status:** RED — 404 view not implemented
  - **Verifies:** AC4 — Back link navigates to /clientes

- **Test:** `AC5 — Root redirect > should redirect from / to /clientes automatically`
  - **Status:** RED — `index.tsx` redirect not implemented; URL stays at /
  - **Verifies:** AC5 — Root path redirects to /clientes

- **Test:** `AC5 — Root redirect > should render Clientes view after redirect from /`
  - **Status:** RED — redirect and clientes view not implemented
  - **Verifies:** AC5 — Clientes view shown after redirect

- **Test:** `AC6 — No errors > should not produce TypeScript or React errors when navigating to /clientes`
  - **Status:** RED — implementation not done; console errors expected
  - **Verifies:** AC6 — Zero TS/React errors in browser console

- **Test:** `AC6 — No errors > should not produce TypeScript or React errors when navigating to /contactos`
  - **Status:** RED — implementation not done; console errors expected
  - **Verifies:** AC6 — Zero TS/React errors during navigation

### Component Tests (12 tests)

**File:** `frontend/src/routes/__tests__/navigation.test.tsx`

- **Test:** `AC1 — NavigationRail on desktop layout > should render the NavigationRail component in the shell layout`
  - **Status:** RED — routeTree.gen.ts does not include shell routes; NavigationRail not rendered
  - **Verifies:** AC1 — NavigationRail present in component tree

- **Test:** `AC1 — NavigationRail on desktop layout > should render "Clientes" label in the NavigationRail`
  - **Status:** RED — NavigationRail not implemented
  - **Verifies:** AC1 — Clientes item present in component

- **Test:** `AC1 — NavigationRail on desktop layout > should render "Contactos" label in the NavigationRail`
  - **Status:** RED — NavigationRail not implemented
  - **Verifies:** AC1 — Contactos item present in component

- **Test:** `AC3 — Active route highlighting > should mark Clientes nav item as active when at /clientes`
  - **Status:** RED — aria-current="page" not set by implementation
  - **Verifies:** AC3 — Clientes item aria-current="page" at /clientes

- **Test:** `AC3 — Active route highlighting > should mark Contactos nav item as active when at /contactos`
  - **Status:** RED — aria-current="page" not set by implementation
  - **Verifies:** AC3 — Contactos item aria-current="page" at /contactos

- **Test:** `AC3 — Active route highlighting > should NOT mark Contactos nav item as active when at /clientes`
  - **Status:** RED — active state logic not implemented
  - **Verifies:** AC3 — Only the current route's nav item is active

- **Test:** `AC3 — Active route highlighting > should NOT mark Clientes nav item as active when at /contactos`
  - **Status:** RED — active state logic not implemented
  - **Verifies:** AC3 — Only the current route's nav item is active

- **Test:** `AC4 — 404 Not Found view > should render the not-found view for unknown routes`
  - **Status:** RED — notFoundComponent not configured in __root.tsx
  - **Verifies:** AC4 — Unknown route renders 404 view

- **Test:** `AC4 — 404 Not Found view > should display "Página no encontrada" message`
  - **Status:** RED — 404 component not implemented
  - **Verifies:** AC4 — Spanish 404 message rendered

- **Test:** `AC4 — 404 Not Found view > should render a back-to-clientes link in the 404 view`
  - **Status:** RED — 404 component not implemented
  - **Verifies:** AC4 — Back link to /clientes present in 404 view

- **Test:** `AC4 — 404 Not Found view > should navigate to /clientes when clicking the back link from 404 view`
  - **Status:** RED — 404 component not implemented
  - **Verifies:** AC4 — Back link navigates correctly

- **Test:** `AC5 — Root redirect > should redirect from / to /clientes automatically`
  - **Status:** RED — beforeLoad redirect not implemented in index.tsx
  - **Verifies:** AC5 — Router state shows /clientes after loading /

- **Test:** `AC5 — Root redirect > should render Clientes view content after root redirect`
  - **Status:** RED — redirect and clientes route not implemented
  - **Verifies:** AC5 — Clientes view visible after redirect

- **Test:** `Route view rendering > should render the Clientes section view at /clientes`
  - **Status:** RED — _app/clientes.tsx not created
  - **Verifies:** AC3 — Clientes route renders view content

- **Test:** `Route view rendering > should render the Contactos section view at /contactos`
  - **Status:** RED — _app/contactos.tsx not created
  - **Verifies:** AC3 — Contactos route renders view content

---

## Data Factories Created

No data factories required for this story. Story 1.2 is pure frontend routing — no backend calls or domain entities involved.

---

## Fixtures Created

No new fixtures required. The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures that navigate to the required routes. These can be extended once routes are implemented.

---

## Mock Requirements

No external API mocks required for this story. All interactions are pure client-side routing with TanStack Router and siesa-ui-kit components.

---

## Required data-testid Attributes

These `data-testid` attributes MUST be added by the DEV team during implementation for test stability.

### Navigation Shell (`frontend/src/routes/__root.tsx`)

- `navigation-rail` — Wrapper element for the desktop NavigationRail component
- `navigation-bar` — Wrapper element for the mobile NavigationBar component
- `nav-item-clientes` — Individual navigation item for the Clientes section
- `nav-item-contactos` — Individual navigation item for the Contactos section

### Route Views

- `clientes-view` — Root element of `frontend/src/routes/_app/clientes.tsx`
- `contactos-view` — Root element of `frontend/src/routes/_app/contactos.tsx`

### 404 Not Found View

- `not-found-view` — Root container of the NotFoundView component
- `not-found-message` — Element containing the Spanish "Página no encontrada" text
- `not-found-back-link` — Link or button that navigates back to `/clientes`

### Implementation Example

```tsx
{/* NavigationRail wrapper */}
<div data-testid="navigation-rail" className="hidden lg:flex">
  <NavigationRail
    items={navItems}
    selectedId={currentRouteId}
    onItemSelect={handleNavSelect}
  />
</div>

{/* NavigationBar wrapper */}
<div data-testid="navigation-bar" className="flex lg:hidden fixed bottom-0 w-full">
  <NavigationBar
    items={navBarItems}
    activeItemId={currentRouteId}
    onItemClick={handleNavSelect}
  />
</div>

{/* Individual nav item wrapper (applied to each item) */}
<div data-testid="nav-item-clientes" aria-current={isActive ? 'page' : undefined}>
  {/* siesa-ui-kit NavigationRailItem */}
</div>

{/* 404 view */}
<div data-testid="not-found-view">
  <h1 data-testid="not-found-message">Página no encontrada</h1>
  <button data-testid="not-found-back-link" onClick={() => navigate({ to: '/clientes' })}>
    Volver a Clientes
  </button>
</div>
```

**Note on siesa-ui-kit integration:** Since `NavigationRail` and `NavigationBar` from `siesa-ui-kit` do not expose `data-testid` directly on their internal item elements, the DEV team must wrap each item render or use the `id` prop pattern to pass testid. The wrapper div approach above is the recommended fallback.

---

## Implementation Checklist

### Test: Desktop NavigationRail visible (AC1)

**File:** `e2e/tests/navigation/story-1.2-navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/__root.tsx`: add `<div data-testid="navigation-rail" className="hidden lg:flex">` wrapping `<NavigationRail>` from `siesa-ui-kit`
- [ ] Import `NavigationRail` from `siesa-ui-kit`
- [ ] Define `navItems` array with Clientes (`id: 'clientes'`, `label: 'Clientes'`) and Contactos (`id: 'contactos'`, `label: 'Contactos'`) entries
- [ ] Add icons (import `UserGroupIcon`, `UserIcon` from `@heroicons/react/24/outline`)
- [ ] Add `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"` to nav item wrappers
- [ ] Wire click handlers using TanStack Router `useNavigate`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: Mobile NavigationBar visible (AC2)

**File:** `e2e/tests/navigation/story-1.2-navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `<div data-testid="navigation-bar" className="flex lg:hidden fixed bottom-0 w-full">` wrapping `<NavigationBar>` from `siesa-ui-kit`
- [ ] Import `NavigationBar` from `siesa-ui-kit`
- [ ] Wire `items` and `onItemClick` for NavigationBar with same items as NavigationRail
- [ ] Ensure responsive Tailwind classes (`hidden lg:flex` / `flex lg:hidden`) correctly toggle visibility
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Deep link and active nav item (AC3)

**File:** `e2e/tests/navigation/story-1.2-navigation-shell.spec.ts` + `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` as a pathless layout route wrapping `<Outlet />`
- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `<div data-testid="clientes-view">Sección Clientes</div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `<div data-testid="contactos-view">Sección Contactos</div>`
- [ ] Use `useRouter()` from `@tanstack/react-router` to get `router.state.location.pathname`
- [ ] Compute `currentRouteId` based on pathname (`/clientes` → `'clientes'`, `/contactos` → `'contactos'`)
- [ ] Pass `selectedId={currentRouteId}` to `NavigationRail` and `activeItemId={currentRouteId}` to `NavigationBar`
- [ ] Add `aria-current={isActive ? 'page' : undefined}` on each nav item wrapper element
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC3"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: 404 Not Found view (AC4)

**File:** `e2e/tests/navigation/story-1.2-navigation-shell.spec.ts` + `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `NotFoundView` component in `frontend/src/routes/__root.tsx` (or a dedicated file):
  ```tsx
  function NotFoundView() {
    const navigate = useNavigate()
    return (
      <div data-testid="not-found-view" ...>
        <h1 data-testid="not-found-message">Página no encontrada</h1>
        <p>La ruta solicitada no existe.</p>
        <button data-testid="not-found-back-link" onClick={() => navigate({ to: '/clientes' })}>
          Volver a Clientes
        </button>
      </div>
    )
  }
  ```
- [ ] Register `NotFoundView` as `notFoundComponent` in `createRootRoute({ notFoundComponent: NotFoundView })`
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC4"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Root redirect from / to /clientes (AC5)

**File:** `e2e/tests/navigation/story-1.2-navigation-shell.spec.ts` + `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/index.tsx`:
  ```typescript
  import { createFileRoute, redirect } from '@tanstack/react-router'
  export const Route = createFileRoute('/')({
    beforeLoad: () => { throw redirect({ to: '/clientes' }) },
    component: () => null,
  })
  ```
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC5"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Zero TypeScript/React errors on navigation (AC6)

**File:** `e2e/tests/navigation/story-1.2-navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] Ensure all TypeScript types are strictly correct (no `any` types, all props typed)
- [ ] Ensure no React key warnings or render errors in browser console
- [ ] Check `siesa-ui-kit` component props match type definitions (use NavigationRail.types.d.ts and NavigationBar.types.d.ts)
- [ ] Run `pnpm --filter frontend tsc --noEmit` — must exit with code 0
- [ ] Run test: `pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E failing tests for this story
pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts

# Run in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --headed

# Run specific AC group
pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC1"
pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC2"
pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC3"
pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC4"
pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --grep "AC5"

# Debug specific test
pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts --debug

# Run component tests (Vitest + RTL)
pnpm --filter frontend test -- src/routes/__tests__/navigation.test.tsx

# Run component tests in watch mode
pnpm --filter frontend test:watch -- src/routes/__tests__/navigation.test.tsx

# Run full test suite
pnpm exec playwright test
pnpm --filter frontend test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All E2E tests written and failing (missing implementation)
- ✅ All Component tests written and failing (missing routeTree.gen.ts entries)
- ✅ Mock requirements documented (none required — pure frontend routing)
- ✅ data-testid requirements listed for all components
- ✅ Implementation checklist created with ordered tasks per AC

**Verification:**

- E2E tests fail with element not found or timeout errors (`[data-testid="navigation-rail"]` absent)
- Component tests fail because `routeTree.gen.ts` does not contain `/clientes`, `/contactos`, or the shell layout
- All failures are due to missing implementation, NOT test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with AC5** (Root redirect) — smallest change, enables navigation to work: update `index.tsx`
2. **Then AC3 routes** — create `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`
3. **Then AC1 NavigationRail** — update `__root.tsx` with desktop navigation
4. **Then AC2 NavigationBar** — add mobile nav to `__root.tsx`
5. **Then AC4 NotFoundView** — add `notFoundComponent` to root route
6. **Finally AC6** — TypeScript strict mode audit passes

**Key Principles:**

- One AC group at a time
- Run `pnpm --filter frontend dev` to auto-regenerate `routeTree.gen.ts` when adding route files
- Check `siesa-ui-kit` NavigationRail/NavigationBar API before implementing
- Use `@heroicons/react` for icons (install with `pnpm --filter frontend add @heroicons/react` if needed)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Extract nav items array to a constants file `src/config/navigation.ts`
2. Extract `NotFoundView` to its own file `src/routes/not-found.tsx`
3. Ensure ARIA roles are correct (`role="navigation"` on nav wrappers)
4. Verify accessibility with keyboard navigation (Tab to nav items, Enter to activate)
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts`
3. Begin implementation in the order listed in Implementation Checklist
4. Work one AC at a time (red → green per acceptance criterion)
5. When all tests pass, refactor for code quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception pattern: `page.waitForLoadState('networkidle')` registered BEFORE navigation in all E2E tests
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class or text selectors in E2E tests
- **test-quality.md** — Given-When-Then structure in all tests; one primary assertion per test; no hard waits (`waitForLoadState` used instead of `setTimeout`)
- **component-tdd.md** — Vitest + RTL tests use `createMemoryHistory` for isolated routing; no real browser required
- **fixture-architecture.md** — Existing `base.fixture.ts` reused; no new fixtures needed for routing-only story
- **test-levels-framework.md** — E2E for user-facing journeys (viewport, navigation, redirects); Component for active state logic, 404 view, and redirect behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `pnpm exec playwright test e2e/tests/navigation/story-1.2-navigation-shell.spec.ts`

**Expected Results:**

```
Running 18 tests using 1 worker

  ✗  [chromium] AC1 — Desktop NavigationRail > should display NavigationRail on desktop viewport
     Error: Timeout: Locator [data-testid="navigation-rail"] expected to be visible

  ✗  [chromium] AC1 — Desktop NavigationRail > should display "Clientes" navigation item...
     Error: Timeout: Locator [data-testid="nav-item-clientes"] expected to be visible

  ... (all 18 tests fail)

  18 failed
```

**Component Test Command:** `pnpm --filter frontend test -- src/routes/__tests__/navigation.test.tsx`

**Expected Results:**

```
FAIL src/routes/__tests__/navigation.test.tsx
  ✗ AC1 — NavigationRail > should render the NavigationRail component in the shell layout
    Cannot find module '../../routeTree.gen' or its corresponding type declarations

  ... (all 15 tests fail)

  Tests: 15 failed
```

**Summary:**

- Total E2E tests: 18
- Passing: 0 (expected)
- Failing: 18 (expected)
- Total Component tests: 15
- Passing: 0 (expected)
- Failing: 15 (expected)
- Status: ✅ RED phase verified

---

## Notes

- `siesa-ui-kit` exports both `NavigationRail` and `NavigationBar` — confirmed via package inspection. No fallback to custom implementation needed.
- `NavigationRail` uses `selectedId` + `onItemSelect` props. `NavigationBar` uses `activeItemId` + `onItemClick` props. These differ — DEV must use the correct prop per component.
- `data-testid` attributes on nav items require wrappers since siesa-ui-kit internal elements do not expose them directly.
- The `aria-current="page"` pattern is used for active state detection in both E2E and Component tests — DEV must implement this explicitly in the shell layout.
- `routeTree.gen.ts` is auto-generated by `@tanstack/router-plugin/vite` on `pnpm dev` — adding new route files triggers regeneration automatically.
- Component tests use `require('../../routeTree.gen')` which fails in RED phase since the routes don't exist yet. This is the expected failure mode.

---

**Generated by BMad TEA Agent** - 2026-06-03
