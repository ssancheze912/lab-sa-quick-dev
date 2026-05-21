# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-20
**Author:** TEA Agent (BMad)
**Story:** 1.2 — Frontend Navigation Shell
**Epic:** 1 — Project Foundation & Application Shell
**Primary Test Levels:** E2E (Playwright) + Component (Vitest + RTL)

---

## Story Summary

**As a** user,
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application,
**So that** I can move between sections without full page reloads from any device.

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (>= 1024px), When the user views the app, Then a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries. Clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **AC2** — Given the application is loaded on a mobile browser viewport (< 1024px), When the user views the app, Then a mobile-responsive NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail. All navigation items are accessible and tappable (FR29).

3. **AC3** — Given the user types `/clientes` or `/contactos` directly in the browser URL bar, When the page loads, Then the correct view is rendered without redirection to a home screen — deep linking works (FR30).

4. **AC4** — Given the user navigates to an unknown route (e.g. `/unknown`), When the page loads, Then a graceful 404 / not-found view is displayed (no crash, no blank screen).

5. **AC5** — Given the navigation is rendered, When assistive technology reads it, Then the nav landmark has an accessible label (`aria-label="Navegación principal"`) and each nav item has a visible label in Spanish (WCAG 2.1 AA).

6. **AC6** — Given the user is on `/clientes`, When the navigation renders, Then the "Clientes" item appears in active/selected state. Same for "Contactos" on `/contactos`.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (25 tests)

**File:** `e2e/tests/foundation/navigation-shell.spec.ts`

**Status:** RED — Frontend dev server must be running and `__root.tsx` must implement the NavigationRail/NavigationBar shell. Currently `__root.tsx` is a bare `<div><Outlet /></div>`, so all nav-related assertions fail.

#### AC1 — NavigationRail (desktop)

- **Test:** `AC1 — NavigationRail is visible on the left side in desktop viewport`
  - **Status:** RED — `getByTestId('nav-rail')` not found; `__root.tsx` has no NavigationRail
  - **Verifies:** AC1 — NavigationRail exists with `data-testid="nav-rail"` on desktop

- **Test:** `AC1 — NavigationRail contains "Clientes" navigation entry on desktop`
  - **Status:** RED — `getByTestId('nav-item-clientes')` not found
  - **Verifies:** AC1 — Clientes nav entry with `data-testid="nav-item-clientes"` exists

- **Test:** `AC1 — NavigationRail contains "Contactos" navigation entry on desktop`
  - **Status:** RED — `getByTestId('nav-item-contactos')` not found
  - **Verifies:** AC1 — Contactos nav entry with `data-testid="nav-item-contactos"` exists

- **Test:** `AC1 — Clicking "Clientes" in NavigationRail navigates to /clientes without full page reload`
  - **Status:** RED — nav item not found; click cannot happen
  - **Verifies:** AC1 / FR28 — SPA navigation to `/clientes` on click

- **Test:** `AC1 — Clicking "Contactos" in NavigationRail navigates to /contactos`
  - **Status:** RED — nav item not found
  - **Verifies:** AC1 / FR28 — SPA navigation to `/contactos` on click

#### AC2 — NavigationBar (mobile)

- **Test:** `AC2 — NavigationBar is visible at the bottom in mobile viewport (< 1024px)`
  - **Status:** RED — `getByTestId('nav-bar')` not found
  - **Verifies:** AC2 / FR29 — NavigationBar with `data-testid="nav-bar"` on mobile

- **Test:** `AC2 — NavigationRail is NOT visible on mobile viewport (< 1024px)`
  - **Status:** RED — nav-rail not found at all (should be hidden but currently absent)
  - **Verifies:** AC2 — NavigationRail is hidden (Tailwind `hidden lg:flex`) on mobile

- **Test:** `AC2 — NavigationBar contains "Clientes" item that is tappable on mobile`
  - **Status:** RED — nav item not found
  - **Verifies:** AC2 — Tapping "Clientes" on mobile navigates to `/clientes`

- **Test:** `AC2 — NavigationBar contains "Contactos" item that is tappable on mobile`
  - **Status:** RED — nav item not found
  - **Verifies:** AC2 — Tapping "Contactos" on mobile navigates to `/contactos`

#### AC3 — Deep Linking

- **Test:** `AC3 — Direct URL /clientes renders the Clientes view without redirection`
  - **Status:** RED — `/clientes` route doesn't exist (`_app/clientes.tsx` not created); TanStack Router returns 404
  - **Verifies:** AC3 / FR30 — URL stays `/clientes`, no home screen redirect

- **Test:** `AC3 — Direct URL /clientes renders the Clientes view content`
  - **Status:** RED — `getByTestId('clientes-view')` not found
  - **Verifies:** AC3 — Clientes stub view with `data-testid="clientes-view"` renders

- **Test:** `AC3 — Direct URL /contactos renders the Contactos view without redirection`
  - **Status:** RED — `/contactos` route doesn't exist
  - **Verifies:** AC3 / FR30 — URL stays `/contactos`

- **Test:** `AC3 — Direct URL /contactos renders the Contactos view content`
  - **Status:** RED — `getByTestId('contactos-view')` not found
  - **Verifies:** AC3 — Contactos stub view with `data-testid="contactos-view"` renders

#### AC4 — 404 Not-Found Route

- **Test:** `AC4 — Unknown route /unknown renders a graceful 404 view (no crash)`
  - **Status:** RED — `getByTestId('not-found-view')` not found; currently renders blank or crashes
  - **Verifies:** AC4 — Not-found view with `data-testid="not-found-view"` appears

- **Test:** `AC4 — 404 view does not show a blank screen`
  - **Status:** RED — body may be blank on unknown route
  - **Verifies:** AC4 — Body has non-empty text content on 404

- **Test:** `AC4 — 404 view contains a link back to /clientes`
  - **Status:** RED — `getByTestId('not-found-back-link')` not found
  - **Verifies:** AC4 — Back link with `data-testid="not-found-back-link"` navigates to `/clientes`

#### AC5 — Accessibility

- **Test:** `AC5 — Nav landmark has aria-label="Navegación principal"`
  - **Status:** RED — `nav[aria-label="Navegación principal"]` not in DOM
  - **Verifies:** AC5 / WCAG 2.1 AA — nav has accessible label

- **Test:** `AC5 — "Clientes" nav item has visible Spanish label text`
  - **Status:** RED — nav item not found
  - **Verifies:** AC5 — "Clientes" text visible (Spanish, not English)

- **Test:** `AC5 — "Contactos" nav item has visible Spanish label text`
  - **Status:** RED — nav item not found
  - **Verifies:** AC5 — "Contactos" text visible (Spanish, not English)

#### AC6 — Active/Selected State

- **Test:** `AC6 — "Clientes" nav item appears in active/selected state when on /clientes`
  - **Status:** RED — nav item not found; `data-active="true"` not set
  - **Verifies:** AC6 — Active state via `data-active="true"` attribute

- **Test:** `AC6 — "Contactos" nav item is NOT in active state when on /clientes`
  - **Status:** RED — nav item not found
  - **Verifies:** AC6 — Only the current route item is active

- **Test:** `AC6 — "Contactos" nav item appears in active/selected state when on /contactos`
  - **Status:** RED — nav item not found
  - **Verifies:** AC6 — Active state via `data-active="true"` attribute

- **Test:** `AC6 — "Clientes" nav item is NOT in active state when on /contactos`
  - **Status:** RED — nav item not found
  - **Verifies:** AC6 — Only current route item is active

#### Index Redirect

- **Test:** `Index / redirects to /clientes`
  - **Status:** RED — `index.tsx` currently renders `<div>Siesa Agents</div>` instead of redirecting
  - **Verifies:** AC3 (implied) — Root `/` redirects automatically to `/clientes`

---

### Component Tests — Vitest + RTL (18 tests)

**File:** `frontend/src/routes/__tests__/root.test.tsx`

**Status:** RED — All tests fail because:
1. `routeTree.gen.ts` does not exist (generated by Vite plugin on first `pnpm dev` run)
2. `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`, `not-found.tsx` don't exist yet
3. `__root.tsx` has no NavigationRail/NavigationBar
4. Nav items have no `data-testid` attributes
5. `index.tsx` doesn't redirect to `/clientes`

#### AC1 — NavigationRail (desktop) — 5 tests

- `[P0] NavigationRail wrapper is present in the DOM on desktop`
  - **Verifies:** AC1 — `data-testid="nav-rail"` exists on desktop viewport

- `[P0] NavigationRail contains "Clientes" label in Spanish`
  - **Verifies:** AC1 — `data-testid="nav-item-clientes"` text contains "Clientes"

- `[P0] NavigationRail contains "Contactos" label in Spanish`
  - **Verifies:** AC1 — `data-testid="nav-item-contactos"` text contains "Contactos"

- `[P1] Clicking "Clientes" nav item changes route to /clientes`
  - **Verifies:** AC1 / FR28 — SPA navigation, `router.state.location.pathname === '/clientes'`

- `[P1] Clicking "Contactos" nav item changes route to /contactos`
  - **Verifies:** AC1 / FR28 — SPA navigation, `router.state.location.pathname === '/contactos'`

#### AC2 — NavigationBar (mobile) — 3 tests

- `[P0] NavigationBar wrapper is present in the DOM on mobile`
  - **Verifies:** AC2 — `data-testid="nav-bar"` exists on mobile viewport

- `[P1] NavigationBar contains "Clientes" item on mobile`
  - **Verifies:** AC2 — `data-testid="nav-item-clientes"` accessible on mobile

- `[P1] NavigationBar contains "Contactos" item on mobile`
  - **Verifies:** AC2 — `data-testid="nav-item-contactos"` accessible on mobile

#### AC3 — Deep Linking — 3 tests

- `[P0] Navigating directly to /clientes renders Clientes view without redirect`
  - **Verifies:** AC3 / FR30 — pathname stays `/clientes`, `data-testid="clientes-view"` exists

- `[P0] Navigating directly to /contactos renders Contactos view without redirect`
  - **Verifies:** AC3 / FR30 — pathname stays `/contactos`, `data-testid="contactos-view"` exists

- `[P1] Index route / redirects to /clientes automatically`
  - **Verifies:** AC3 (implied) — `router.state.location.pathname === '/clientes'` after init at `/`

#### AC4 — 404 Not-Found — 3 tests

- `[P0] Navigating to /unknown renders a not-found view (no crash, no blank screen)`
  - **Verifies:** AC4 — `data-testid="not-found-view"` exists, container has text

- `[P1] 404 view contains a back link that navigates to /clientes`
  - **Verifies:** AC4 — `data-testid="not-found-back-link"` navigates to `/clientes`

- `[P2] 404 view displays "Página no encontrada" message in Spanish`
  - **Verifies:** AC4 — Spanish not-found message present

#### AC5 — Accessibility — 3 tests

- `[P0] nav element has aria-label="Navegación principal"`
  - **Verifies:** AC5 / WCAG 2.1 AA — `nav[aria-label="Navegación principal"]` in DOM

- `[P1] "Clientes" nav item displays visible Spanish text label`
  - **Verifies:** AC5 — textContent contains "Clientes", not "Clients"

- `[P1] "Contactos" nav item displays visible Spanish text label`
  - **Verifies:** AC5 — textContent contains "Contactos", not "Contacts"

#### AC6 — Active State — 4 tests

- `[P0] "Clientes" item has data-active="true" when on /clientes`
  - **Verifies:** AC6 — Active state attribute on current route item

- `[P0] "Contactos" item has data-active="true" when on /contactos`
  - **Verifies:** AC6 — Active state attribute on current route item

- `[P1] "Contactos" item does NOT have data-active="true" when on /clientes`
  - **Verifies:** AC6 — Inactive item has no active attribute

- `[P1] "Clientes" item does NOT have data-active="true" when on /contactos`
  - **Verifies:** AC6 — Inactive item has no active attribute

---

## Required `data-testid` Attributes

These `data-testid` attributes MUST be added during implementation for tests to pass:

| `data-testid` | Element | Location |
|---|---|---|
| `nav-rail` | `<nav>` wrapper for NavigationRail | `__root.tsx` — desktop nav |
| `nav-bar` | `<nav>` wrapper for NavigationBar | `__root.tsx` — mobile nav |
| `nav-item-clientes` | Nav item for Clientes | Within NavigationRail + NavigationBar |
| `nav-item-contactos` | Nav item for Contactos | Within NavigationRail + NavigationBar |
| `clientes-view` | Root element of Clientes stub | `_app/clientes.tsx` |
| `contactos-view` | Root element of Contactos stub | `_app/contactos.tsx` |
| `not-found-view` | Root element of 404 page | `not-found.tsx` |
| `not-found-back-link` | Back link on 404 page | `not-found.tsx` |

**Implementation example:**

```tsx
// __root.tsx — desktop nav wrapper
<nav
  aria-label="Navegación principal"
  data-testid="nav-rail"
  className="hidden lg:flex"
>
  <NavigationRail ... />
</nav>

// __root.tsx — mobile nav wrapper
<nav
  aria-label="Navegación principal"
  data-testid="nav-bar"
  className="flex lg:hidden fixed bottom-0 w-full"
>
  <NavigationBar ... />
</nav>

// Nav items must receive data-testid via wrapper
// <div data-testid="nav-item-clientes" data-active={activeRoute === 'clientes' ? 'true' : 'false'}>
//   <NavigationRailItem ... />
// </div>

// _app/clientes.tsx
function ClientesPage() {
  return <div data-testid="clientes-view" className="p-6">Clientes</div>
}

// _app/contactos.tsx
function ContactosPage() {
  return <div data-testid="contactos-view" className="p-6">Contactos</div>
}

// not-found.tsx
function NotFoundPage() {
  return (
    <div data-testid="not-found-view">
      <p>Página no encontrada</p>
      <Link data-testid="not-found-back-link" to="/clientes">Volver a Clientes</Link>
    </div>
  )
}
```

---

## Mock Requirements

### Component Tests (Vitest + RTL)

No MSW mocks are needed for Story 1.2 component tests. The navigation shell is a pure frontend concern — no API calls are made by `__root.tsx`, `_app.tsx`, or the route stubs.

**Router mocking strategy:** Use `createMemoryHistory` from `@tanstack/react-router` to initialize the router at any URL path without requiring a real browser environment.

**Viewport mocking:** Use `Object.defineProperty(window, 'innerWidth', { value: ... })` to simulate mobile/desktop viewport breakpoints in jsdom.

### E2E Tests (Playwright)

The E2E tests route `**/api/**` to `continue()` — no backend mocking is required since the navigation shell makes no API calls. Both tests run against the live frontend dev server at `http://localhost:5173`.

---

## Implementation Checklist

### Task 1 — Route Files (prerequisite for all tests)

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route (TanStack Router)
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — stub view with `data-testid="clientes-view"`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — stub view with `data-testid="contactos-view"`
- [ ] Create `frontend/src/routes/not-found.tsx` — 404 view with `data-testid="not-found-view"` and `data-testid="not-found-back-link"`
- [ ] Run `pnpm dev` to trigger `routeTree.gen.ts` auto-generation

### Task 2 — `__root.tsx` Navigation Shell

- [ ] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit`
- [ ] Use `useRouterState` to detect current pathname and derive active nav item
- [ ] Add desktop `<nav aria-label="Navegación principal" data-testid="nav-rail" className="hidden lg:flex">` wrapper
- [ ] Add mobile `<nav aria-label="Navegación principal" data-testid="nav-bar" className="flex lg:hidden ...">` wrapper
- [ ] Wrap nav items with `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"`
- [ ] Add `data-active={activeRoute === 'clientes' ? 'true' : 'false'}` to each nav item wrapper

### Task 3 — `index.tsx` Redirect

- [ ] Update `index.tsx` to use `<Navigate to="/clientes" />` from `@tanstack/react-router`

### Verification — Run Tests

```bash
# Run component tests (RED phase — all should fail now)
cd /home/user/lab-sa-quick-dev/frontend && npx vitest run src/routes/__tests__/root.test.tsx

# Run E2E tests (RED phase — all should fail now)
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium

# After implementation (GREEN phase)
cd /home/user/lab-sa-quick-dev/frontend && npx vitest run src/routes/__tests__/root.test.tsx
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium
```

---

## Test Coverage by AC

| AC | E2E (Playwright) | Component (Vitest+RTL) | Total |
|----|-----------------|----------------------|-------|
| AC1 — NavigationRail desktop | 5 tests | 5 tests | 10 |
| AC2 — NavigationBar mobile | 4 tests | 3 tests | 7 |
| AC3 — Deep linking | 4 tests | 3 tests | 7 |
| AC4 — 404 not-found | 3 tests | 3 tests | 6 |
| AC5 — Accessibility | 3 tests | 3 tests | 6 |
| AC6 — Active state | 4 tests | 4 tests | 8 |
| Index redirect | 1 test | 1 test | 2 |
| **Total** | **24 tests** | **22 tests** | **46 tests** |

> Note: E2E count is 25 in the spec file including the index redirect test. Component tests total 22 across all describe blocks.

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ E2E tests written and failing — `e2e/tests/foundation/navigation-shell.spec.ts` (25 tests)
- ✅ Component tests written and failing — `frontend/src/routes/__tests__/root.test.tsx` (18 tests)
- ✅ Required `data-testid` attributes documented
- ✅ Mock requirements documented (none needed)
- ✅ Implementation checklist created with concrete tasks per AC

**Expected failures (RED phase):**
- Component tests: `Cannot find module '../../routeTree.gen'` — file not yet generated
- Component tests: `getByTestId('nav-rail') not found` — navigation not implemented
- E2E tests: `Locator expected to be visible` — nav elements missing `data-testid` attributes

---

### GREEN Phase (DEV Team — Next Steps)

**Recommended implementation order:**

1. Create route stubs (`_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`, `not-found.tsx`)
2. Run `pnpm dev` to generate `routeTree.gen.ts`
3. Update `index.tsx` to redirect to `/clientes`
4. Update `__root.tsx` with NavigationRail + NavigationBar + `data-testid` attributes
5. Run component tests: `npx vitest run src/routes/__tests__/root.test.tsx`
6. Run E2E tests: `npx playwright test e2e/tests/foundation/navigation-shell.spec.ts`

---

## Requirements Traceability

| Requirement | Story AC | E2E Test | Component Test |
|-------------|----------|----------|---------------|
| FR28 — SPA navigation (no page reloads) | AC1 | `Clicking "Clientes" navigates without reload` | `Clicking "Clientes" changes route to /clientes` |
| FR29 — Mobile access | AC2 | `NavigationBar visible at bottom on mobile` | `NavigationBar present on mobile viewport` |
| FR30 — Deep linking | AC3 | `Direct URL /clientes renders without redirect` | `Navigating directly to /clientes renders view` |
| AC-E1.1 — Nav structure mobile+desktop | AC1, AC2 | NavigationRail + NavigationBar tests | NavigationRail + NavigationBar tests |
| AC-E1.2 — No full page reloads | AC1 | `navigates without full page reload` | `changes route to /clientes` |
| AC-E1.3 — Deep linking | AC3 | `Direct URL /clientes` | `Navigating directly to /clientes` |
| WCAG 2.1 AA | AC5 | `aria-label="Navegación principal"` | `nav element has aria-label` |

---

## Knowledge Base References Applied

- **network-first pattern** — `page.route('**/api/**', ...)` before `page.goto()` in all E2E tests
- **selector-resilience** — `data-testid` selectors exclusively; no CSS class selectors
- **test-quality** — Given-When-Then structure; one primary assertion per test; no hard waits
- **test-levels-framework** — E2E for browser viewport/navigation behavior; Component for router isolation
- **no-hard-waits** — RTL `screen.getByTestId()` is synchronous; Playwright uses `toBeVisible()` with built-in retry

---

**Generated by BMad TEA Agent** — 2026-05-20
