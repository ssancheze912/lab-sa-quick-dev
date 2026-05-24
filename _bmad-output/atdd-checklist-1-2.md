# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Implements a persistent navigation shell for the Siesa Agents CRM, exposing "Clientes" and "Contactos" routes with responsive behaviour: a `NavigationRail` on desktop (>= 1024 px) and a `NavigationBar` at the bottom on mobile. The shell supports direct deep-linking, a 404 not-found view in Spanish, and full WCAG 2.1 AA accessibility via ARIA landmarks and `aria-current="page"`.

**As a** user,
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application,
**So that** I can move between sections without full page reloads from any device.

---

## Acceptance Criteria

1. **AC1 (FR28)** — Desktop viewport >= 1024 px shows a `NavigationRail` on the left; clicking Clientes / Contactos performs SPA navigation (no full page reload).
2. **AC2 (FR29)** — Mobile viewport < 1024 px shows a `NavigationBar` at the bottom; all items are accessible with touch-target height >= 48 px.
3. **AC3 (FR30)** — Directly typing `/clientes` or `/contactos` in the URL bar renders the correct placeholder view; the corresponding nav item is highlighted as active; no redirect to a home screen occurs.
4. **AC4** — Navigating to any unknown route (e.g. `/unknown-path`) renders a 404 view with the Spanish message "Página no encontrada" and a link back to `/clientes`.
5. **AC5 (WCAG 2.1 AA)** — Navigation landmarks expose `aria-label="Navegación principal"`; the active route item has `aria-current="page"`; all items are keyboard reachable.

---

## Failing Tests Created (RED Phase)

### E2E Tests (28 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (380 lines)

#### AC1 — Desktop NavigationRail (6 tests)

- **Test:** `should render NavigationRail on the left side on desktop viewport`
  - **Status:** RED — `[data-testid="navigation-rail"]` missing; `_app.tsx` not implemented
  - **Verifies:** AC1 — NavigationRail is visible at >= 1024 px

- **Test:** `should display Clientes entry in NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` missing
  - **Verifies:** AC1 — "Clientes" nav item present in desktop rail

- **Test:** `should display Contactos entry in NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` missing
  - **Verifies:** AC1 — "Contactos" nav item present in desktop rail

- **Test:** `should navigate to /clientes without full page reload when clicking Clientes nav item`
  - **Status:** RED — nav item does not exist; SPA routing not configured
  - **Verifies:** AC1 (FR28) — SPA navigation, no full page reload

- **Test:** `should navigate to /contactos without full page reload when clicking Contactos nav item`
  - **Status:** RED — nav item does not exist; SPA routing not configured
  - **Verifies:** AC1 (FR28) — SPA navigation, no full page reload

- **Test:** `should NOT render NavigationBar on desktop viewport`
  - **Status:** RED — no shell structure; element visibility behaviour unverifiable
  - **Verifies:** AC1 — NavigationBar is hidden on desktop

#### AC2 — Mobile NavigationBar (6 tests)

- **Test:** `should render NavigationBar at the bottom on mobile viewport`
  - **Status:** RED — `[data-testid="navigation-bar"]` missing
  - **Verifies:** AC2 (FR29) — NavigationBar visible on mobile

- **Test:** `should display Clientes entry in NavigationBar on mobile`
  - **Status:** RED — nav item missing
  - **Verifies:** AC2 — Clientes accessible on mobile

- **Test:** `should display Contactos entry in NavigationBar on mobile`
  - **Status:** RED — nav item missing
  - **Verifies:** AC2 — Contactos accessible on mobile

- **Test:** `should have touch-target height of at least 48px for Clientes nav item on mobile`
  - **Status:** RED — element missing; bounding box returns null
  - **Verifies:** AC2 — Minimum touch target >= 48 px (WCAG 2.5.5)

- **Test:** `should have touch-target height of at least 48px for Contactos nav item on mobile`
  - **Status:** RED — element missing; bounding box returns null
  - **Verifies:** AC2 — Minimum touch target >= 48 px

- **Test:** `should NOT render NavigationRail on mobile viewport`
  - **Status:** RED — no shell; visibility behaviour unverifiable
  - **Verifies:** AC2 — NavigationRail hidden on mobile

#### AC3 — Deep Linking (6 tests)

- **Test:** `should render /clientes view when navigating directly to /clientes URL`
  - **Status:** RED — `[data-testid="clientes-view"]` missing; route not defined
  - **Verifies:** AC3 (FR30) — Direct URL access renders Clientes view

- **Test:** `should render /contactos view when navigating directly to /contactos URL`
  - **Status:** RED — `[data-testid="contactos-view"]` missing; route not defined
  - **Verifies:** AC3 (FR30) — Direct URL access renders Contactos view

- **Test:** `should NOT redirect /clientes to a home screen on direct URL access`
  - **Status:** RED — index route currently renders a generic div, may redirect
  - **Verifies:** AC3 (FR30) — URL remains /clientes

- **Test:** `should NOT redirect /contactos to a home screen on direct URL access`
  - **Status:** RED — route not defined; will redirect or show 404
  - **Verifies:** AC3 (FR30) — URL remains /contactos

- **Test:** `should highlight Clientes nav item as active when on /clientes route`
  - **Status:** RED — `data-active` attribute not present; active state logic not implemented
  - **Verifies:** AC3 — Active nav item marked on deep link

- **Test:** `should highlight Contactos nav item as active when on /contactos route`
  - **Status:** RED — `data-active` attribute not present
  - **Verifies:** AC3 — Active nav item marked on deep link

#### AC4 — 404 Not-Found Route (4 tests)

- **Test:** `should display 404 view when navigating to an unknown route`
  - **Status:** RED — `[data-testid="not-found-view"]` missing; `notFoundComponent` not registered
  - **Verifies:** AC4 — Unknown routes show 404 view

- **Test:** `should display Spanish-language message "Página no encontrada" on 404 view`
  - **Status:** RED — NotFoundView component does not exist
  - **Verifies:** AC4 — Spanish message present

- **Test:** `should display a return link to /clientes on 404 view`
  - **Status:** RED — NotFoundView does not exist; `[data-testid="not-found-return-link"]` missing
  - **Verifies:** AC4 — Return link present and points to /clientes

- **Test:** `should navigate to /clientes when clicking the return link on 404 view`
  - **Status:** RED — return link does not exist
  - **Verifies:** AC4 — Clicking return link navigates to /clientes

#### AC5 — Accessibility: Desktop (5 tests)

- **Test:** `should have a navigation landmark with aria-label on desktop`
  - **Status:** RED — no `<nav aria-label="Navegación principal">` element
  - **Verifies:** AC5 — Navigation landmark with correct aria-label

- **Test:** `should mark active Clientes nav item with aria-current="page" when on /clientes`
  - **Status:** RED — `aria-current` attribute not set; active state not implemented
  - **Verifies:** AC5 (WCAG 2.1 AA) — Active item has aria-current="page"

- **Test:** `should mark active Contactos nav item with aria-current="page" when on /contactos`
  - **Status:** RED — `aria-current` attribute not set
  - **Verifies:** AC5 — Active Contactos item marked

- **Test:** `should NOT mark Contactos nav item with aria-current="page" when on /clientes`
  - **Status:** RED — element missing
  - **Verifies:** AC5 — Only active item has aria-current="page"

- **Test:** `should allow keyboard navigation to reach all nav items via Tab key on desktop`
  - **Status:** RED — no focusable nav items rendered
  - **Verifies:** AC5 — Keyboard accessibility of navigation

#### AC5 — Accessibility: Mobile (2 tests)

- **Test:** `should have a navigation landmark with aria-label on mobile`
  - **Status:** RED — no `<nav aria-label>` element
  - **Verifies:** AC5 — Landmark present on mobile NavigationBar

- **Test:** `should mark active Clientes nav item with aria-current="page" on mobile when on /clientes`
  - **Status:** RED — `aria-current` not set on mobile nav items
  - **Verifies:** AC5 — aria-current="page" works on mobile too

---

### Component Tests (19 tests)

**File:** `frontend/src/routes/__tests__/AppShell.test.tsx` (248 lines)

#### AC1 — Desktop NavigationRail (5 tests)

- **Test:** `should render NavigationRail on desktop viewport`
  - **Status:** RED — `_app.tsx` does not exist; `routeTree.gen.ts` has no `_app` route
  - **Verifies:** AC1 — NavigationRail present in DOM on desktop

- **Test:** `should display Clientes entry in NavigationRail on desktop`
  - **Status:** RED — nav item missing from unimplemented shell
  - **Verifies:** AC1 — Clientes item in NavigationRail

- **Test:** `should display Contactos entry in NavigationRail on desktop`
  - **Status:** RED — nav item missing
  - **Verifies:** AC1 — Contactos item in NavigationRail

- **Test:** `should navigate to /clientes URL when Clientes nav item is clicked`
  - **Status:** RED — nav item missing; click handler not wired
  - **Verifies:** AC1 (FR28) — SPA navigation via click

- **Test:** `should navigate to /contactos URL when Contactos nav item is clicked`
  - **Status:** RED — nav item missing
  - **Verifies:** AC1 (FR28) — SPA navigation to /contactos

#### AC2 — Mobile NavigationBar (3 tests)

- **Test:** `should render NavigationBar on mobile viewport`
  - **Status:** RED — `_app.tsx` does not exist
  - **Verifies:** AC2 — NavigationBar present at mobile viewport

- **Test:** `should display Clientes entry in NavigationBar on mobile`
  - **Status:** RED — nav item missing
  - **Verifies:** AC2 — Clientes accessible on mobile

- **Test:** `should display Contactos entry in NavigationBar on mobile`
  - **Status:** RED — nav item missing
  - **Verifies:** AC2 — Contactos accessible on mobile

#### AC3 — Deep Linking (6 tests)

- **Test:** `should render Clientes view when navigating directly to /clientes`
  - **Status:** RED — `_app/clientes.tsx` does not exist; `clientes-view` testid missing
  - **Verifies:** AC3 — /clientes renders correct placeholder view

- **Test:** `should render Contactos view when navigating directly to /contactos`
  - **Status:** RED — `_app/contactos.tsx` does not exist
  - **Verifies:** AC3 — /contactos renders correct placeholder view

- **Test:** `should NOT redirect /clientes to home screen on direct URL access`
  - **Status:** RED — route does not exist; TanStack Router may fall through to 404
  - **Verifies:** AC3 — No unexpected redirect from /clientes

- **Test:** `should NOT redirect /contactos to home screen on direct URL access`
  - **Status:** RED — route does not exist
  - **Verifies:** AC3 — No unexpected redirect from /contactos

- **Test:** `should highlight Clientes nav item as active when on /clientes route`
  - **Status:** RED — `data-active` attribute not implemented
  - **Verifies:** AC3 — Active state on direct deep-link

- **Test:** `should highlight Contactos nav item as active when on /contactos route`
  - **Status:** RED — `data-active` attribute not implemented
  - **Verifies:** AC3 — Active state on direct deep-link

#### AC4 — 404 Not-Found Route (4 tests)

- **Test:** `should display 404 view when navigating to an unknown route`
  - **Status:** RED — `NotFoundView` not implemented; `notFoundComponent` not registered in `__root.tsx`
  - **Verifies:** AC4 — Unknown route shows 404 view

- **Test:** `should display Spanish message "Página no encontrada" on 404 view`
  - **Status:** RED — NotFoundView component missing
  - **Verifies:** AC4 — Spanish message visible

- **Test:** `should display a return link pointing to /clientes on 404 view`
  - **Status:** RED — return link element missing
  - **Verifies:** AC4 — Return link present with correct href

- **Test:** `should navigate to /clientes when user clicks the return link on 404 view`
  - **Status:** RED — return link missing; click handler not wired
  - **Verifies:** AC4 — Return link navigates to /clientes

#### AC5 — Accessibility (5 tests)

- **Test:** `should have a <nav> element with aria-label="Navegación principal"`
  - **Status:** RED — no nav element with this label
  - **Verifies:** AC5 — Navigation landmark accessible to screen readers

- **Test:** `should mark active Clientes nav item with aria-current="page" when on /clientes`
  - **Status:** RED — `aria-current` not set
  - **Verifies:** AC5 — Screen readers identify active route

- **Test:** `should mark active Contactos nav item with aria-current="page" when on /contactos`
  - **Status:** RED — `aria-current` not set
  - **Verifies:** AC5 — Screen readers identify active Contactos route

- **Test:** `should NOT mark Contactos nav item with aria-current="page" when on /clientes`
  - **Status:** RED — element missing; aria-current state untested
  - **Verifies:** AC5 — Only one item has aria-current at a time

- **Test:** `should NOT mark Clientes nav item with aria-current="page" when on /contactos`
  - **Status:** RED — element missing
  - **Verifies:** AC5 — Mutual exclusivity of aria-current="page"

---

## Data Factories Created

No data factories required for Story 1.2. The navigation shell and routes are purely structural/navigational — no domain entities or API data are produced or consumed. Data factories will be introduced in Epic 2 (Clientes CRUD) and Epic 3 (Contactos CRUD).

---

## Fixtures Created

### Navigation Page Object

**File:** `e2e/pages/navigation.page.ts` (already exists)

**Provides:**
- Typed `Locator` accessors for `navigation-rail`, `navigation-bar`, `nav-item-clientes`, `nav-item-contactos`, `clientes-view`, `contactos-view`, `not-found-view`, `not-found-message`, `not-found-return-link`
- Helper methods: `gotoClientes()`, `gotoContactos()`, `gotoUnknownRoute()`, `clickNavClientes()`, `clickNavContactos()`

### Base E2E Fixture

**File:** `e2e/fixtures/base.fixture.ts` (already exists)

**Fixtures:**
- `clientesPage` — navigates to `/clientes` before test; no teardown needed (stateless navigation)
- `contactosPage` — navigates to `/contactos` before test; no teardown needed

---

## Mock Requirements

No backend API calls are made in Story 1.2. The navigation shell is purely client-side (TanStack Router + React). No network mocks are required.

If a future story adds backend health-check calls on mount, apply the network-first pattern:

```typescript
// Pattern for future stories (NOT needed in Story 1.2)
await page.route('**/api/health', route =>
  route.fulfill({ status: 200, body: JSON.stringify({ status: 'ok' }) })
)
await page.goto('/clientes')
```

---

## Required data-testid Attributes

### App Shell Layout (`frontend/src/routes/_app.tsx`)

- `navigation-rail` — The `NavigationRail` container element (desktop, left side)
- `navigation-bar` — The `NavigationBar` container element (mobile, bottom)

### Navigation Items (both Rail and Bar)

- `nav-item-clientes` — The "Clientes" navigation entry; must also carry `data-active="true"` when active and `aria-current="page"` when active
- `nav-item-contactos` — The "Contactos" navigation entry; same active/aria requirements

### Route Views

- `clientes-view` — Root container of the `/clientes` placeholder view (`frontend/src/routes/_app/clientes.tsx`)
- `contactos-view` — Root container of the `/contactos` placeholder view (`frontend/src/routes/_app/contactos.tsx`)

### Not-Found View (`frontend/src/shared/components/NotFoundView.tsx`)

- `not-found-view` — Outermost container of the 404 component
- `not-found-message` — The `<h1>` or text element containing "Página no encontrada"
- `not-found-return-link` — The anchor/link element pointing to `/clientes`

**Implementation Example:**

```tsx
// _app.tsx (shell)
<nav aria-label="Navegación principal" className="hidden lg:flex">
  <div data-testid="navigation-rail">
    <a
      data-testid="nav-item-clientes"
      data-active={activeItem === 'clientes' ? 'true' : 'false'}
      aria-current={activeItem === 'clientes' ? 'page' : undefined}
      href="/clientes"
    >
      Clientes
    </a>
    <a
      data-testid="nav-item-contactos"
      data-active={activeItem === 'contactos' ? 'true' : 'false'}
      aria-current={activeItem === 'contactos' ? 'page' : undefined}
      href="/contactos"
    >
      Contactos
    </a>
  </div>
</nav>

// NotFoundView.tsx
<div data-testid="not-found-view">
  <h1 data-testid="not-found-message">Página no encontrada</h1>
  <Link data-testid="not-found-return-link" to="/clientes">← Ir a Clientes</Link>
</div>

// _app/clientes.tsx
<div data-testid="clientes-view">
  <h1>Clientes</h1>
</div>

// _app/contactos.tsx
<div data-testid="contactos-view">
  <h1>Contactos</h1>
</div>
```

---

## Implementation Checklist

### Test Group: AC1 — Desktop NavigationRail

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` as a TanStack Router pathless layout route
- [ ] Import `NavigationRail` from `siesa-ui-kit` (verify in catalog first); fall back to shadcn or custom if missing
- [ ] Render `NavigationRail` inside a `<nav aria-label="Navegación principal">` wrapper
- [ ] Use `className="hidden lg:flex"` (Tailwind) to show the rail only on >= 1024 px
- [ ] Add `data-testid="navigation-rail"` to the NavigationRail wrapper element
- [ ] Add `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"` to each nav item
- [ ] Wire click handlers to TanStack Router `<Link>` components pointing to `/clientes` and `/contactos`
- [ ] Verify TanStack Router auto-regenerates `routeTree.gen.ts` including the `_app` route
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ All AC1 E2E tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC2 — Mobile NavigationBar

**Tasks to make these tests pass:**

- [ ] Import `NavigationBar` from `siesa-ui-kit` (verify; fall back if missing)
- [ ] Render `NavigationBar` inside a second `<nav aria-label="Navegación principal">` wrapper
- [ ] Use `className="flex lg:hidden fixed bottom-0 w-full"` (Tailwind) to show the bar only on < 1024 px
- [ ] Add `data-testid="navigation-bar"` to the NavigationBar wrapper
- [ ] Ensure `nav-item-clientes` and `nav-item-contactos` testids are also present on the mobile bar items
- [ ] Verify each nav item has a rendered height >= 48 px (use `min-h-[48px]` Tailwind utility or component props)
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ All AC2 E2E tests pass

**Estimated Effort:** 1.5 hours

---

### Test Group: AC3 — Deep Linking (FR30)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` with a `<div data-testid="clientes-view"><h1>Clientes</h1></div>` placeholder
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with a `<div data-testid="contactos-view"><h1>Contactos</h1></div>` placeholder
- [ ] Update `frontend/src/routes/index.tsx` to redirect to `/clientes` (TanStack `redirect` in `beforeLoad` or `<Navigate to="/clientes" />`)
- [ ] Implement active-route detection in `_app.tsx` using `useRouterState()` from `@tanstack/react-router`
- [ ] Propagate `data-active="true"` and `aria-current="page"` to the matching nav item
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ All AC3 E2E tests pass

**Estimated Effort:** 1.5 hours

---

### Test Group: AC4 — 404 Not-Found Route

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/NotFoundView.tsx` with `data-testid="not-found-view"`, `data-testid="not-found-message"` containing "Página no encontrada", and `data-testid="not-found-return-link"` linking to `/clientes`
- [ ] Register `notFoundComponent: () => <NotFoundView />` in `frontend/src/routes/__root.tsx` `createRootRoute()`
- [ ] Style the 404 view with TailwindCSS: centered, readable, primary color `#0e79fd` for the return link
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"`
- [ ] ✅ All AC4 E2E tests pass

**Estimated Effort:** 0.5 hours

---

### Test Group: AC5 — Accessibility (WCAG 2.1 AA)

**Tasks to make these tests pass:**

- [ ] Ensure both `<nav>` wrappers (rail and bar) carry `aria-label="Navegación principal"`
- [ ] Confirm `aria-current="page"` is set only on the active nav item (remove from non-active items)
- [ ] Ensure all nav items are focusable (use `<a>` or `<button>` elements; avoid `<div>` for interactive elements)
- [ ] Check that focus outline is not removed (no global `outline: none` without a replacement)
- [ ] Run accessibility test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"`
- [ ] ✅ All AC5 E2E tests pass

**Estimated Effort:** 0.5 hours

---

### Component Tests

**Tasks to make component tests pass:**

- [ ] Complete all implementation tasks above (component tests share the same implementation requirements)
- [ ] Ensure `routeTree.gen.ts` is auto-regenerated with `_app`, `_app/clientes`, `_app/contactos` routes
- [ ] Run component tests: `pnpm --filter frontend run test`
- [ ] ✅ All 19 component tests pass

**Estimated Effort:** Covered by implementation tasks above (no additional effort)

---

## Running Tests

```bash
# Run all E2E failing tests for Story 1.2
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests for specific AC
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Debug a specific E2E test
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests (Vitest + RTL)
pnpm --filter frontend run test

# Run component tests in watch mode
pnpm --filter frontend run test:watch

# Run only AppShell component tests
pnpm --filter frontend run test -- AppShell
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 28 E2E tests written and failing (`e2e/tests/navigation/navigation-shell.spec.ts`)
- ✅ All 19 component tests written and failing (`frontend/src/routes/__tests__/AppShell.test.tsx`)
- ✅ Page Object Model created (`e2e/pages/navigation.page.ts`)
- ✅ Base fixture created (`e2e/fixtures/base.fixture.ts`)
- ✅ Mock requirements documented (none required — no backend calls in this story)
- ✅ Required `data-testid` attributes listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail because implementation files do not exist
- E2E: failure message is `locator.waitForLoadState: Target page, context or browser has been closed` or `expect.toBeVisible: Locator not found` for missing `data-testid` elements
- Component: failure is `Cannot find module '../../routeTree.gen'` route for `_app` or `TestingLibraryElementError: Unable to find an element by: [data-testid="navigation-rail"]`

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from the implementation checklist above (start with AC3 deep linking routes — they unblock everything else)
2. **Read the test** to understand expected behavior and required `data-testid` values
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended Implementation Order:**

1. AC3 first — Create `_app/clientes.tsx` and `_app/contactos.tsx` placeholder views + update `index.tsx` redirect → unlocks deep-link tests
2. AC1/AC2 together — Create `_app.tsx` shell with NavigationRail + NavigationBar + `data-testid` attributes → unlocks all navigation tests
3. AC4 — Create `NotFoundView.tsx` and register `notFoundComponent` in `__root.tsx`
4. AC5 — Add `aria-label`, `aria-current`, and keyboard focus to nav items

**Key Principles:**

- One test group at a time (don't try to fix all at once)
- Let the TanStack Router Vite plugin auto-regenerate `routeTree.gen.ts`
- Minimal implementation — placeholders are sufficient for this story
- Use company standard: check `siesa-ui-kit` BEFORE any custom implementation

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 47 tests pass** (28 E2E + 19 component — green phase complete)
2. **Review `_app.tsx`** for code quality (extract `navItems` array, extract active-route logic to hook if complex)
3. **Check TailwindCSS class organisation** (responsive modifiers consistent and readable)
4. **Ensure tests still pass** after each refactor step
5. **Document fallback decision** if `NavigationRail` / `NavigationBar` were not found in `siesa-ui-kit`

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing E2E tests to confirm RED phase: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`
3. Run failing component tests to confirm RED phase: `pnpm --filter frontend run test -- AppShell`
4. Begin implementation following the recommended order (AC3 → AC1/AC2 → AC4 → AC5)
5. Work one test group at a time (red → green for each AC)
6. Share progress in daily standup
7. When all 47 tests pass, refactor code for quality
8. When refactoring complete, manually update story status to `in-progress` → `done` in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Playwright `test.extend()` base fixture pattern used in `e2e/fixtures/base.fixture.ts`
- **data-factories.md** — No factories needed for this story (no domain data); pattern reviewed and deferred to Epic 2
- **network-first.md** — Applied in E2E tests: `page.waitForLoadState('networkidle')` registered before navigation; no API routes to intercept in this story
- **component-tdd.md** — Vitest + RTL component test strategy applied in `AppShell.test.tsx`; MemoryRouter pattern from `@tanstack/react-router`
- **test-quality.md** — One assertion per test (atomic); explicit `waitFor` instead of hard waits; Given-When-Then comments on every test
- **selector-resilience.md** — All selectors use `data-testid` (highest resilience tier); no CSS class selectors
- **test-levels-framework.md** — E2E for critical user journeys (AC1–AC5 user-facing); Component for viewport logic and router state (isolated, fast)

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Summary:**

```
28 failed  [chromium] › e2e/tests/navigation/navigation-shell.spec.ts
  ● AC1 — Desktop NavigationRail › should render NavigationRail on the left side on desktop viewport
    expect(locator).toBeVisible() - Error: strict mode violation
    Received: locator('[data-testid="navigation-rail"]') resolved to 0 elements
  ... (27 more failures with similar "locator not found" messages)

  28 failed | 0 passed
```

**Component Command:** `pnpm --filter frontend run test -- AppShell`

**Expected Summary:**

```
FAIL  frontend/src/routes/__tests__/AppShell.test.tsx
  ● AC1 — Desktop NavigationRail › should render NavigationRail on desktop viewport
    TestingLibraryElementError: Unable to find an element by: [data-testid="navigation-rail"]
  ... (18 more failures — all tests fail because routes don't exist yet)

  Test Files  1 failed (1)
  Tests  19 failed | 0 passed
```

**Summary:**

- Total tests: 47 (28 E2E + 19 Component)
- Passing: 0 (expected in RED phase)
- Failing: 47 (expected in RED phase)
- Status: ✅ RED phase — tests define the contract; implementation pending

---

## Notes

- The `siesa-ui-kit` `NavigationRail` and `NavigationBar` components must be verified in the installed package before any custom implementation is started. If they are missing, document the fallback used (shadcn or custom TailwindCSS).
- The TanStack Router Vite plugin auto-generates `routeTree.gen.ts` on every save — do not edit that file manually.
- All user-facing text (nav labels, 404 message, return link) must be in **Spanish** per company standard.
- The `_` prefix on `_app.tsx` is critical — it creates a pathless layout route so children are at `/clientes`, not `/_app/clientes`.
- Component tests use `createMemoryHistory` so they never touch the browser URL bar — they are fully isolated.

---

## Contact

**Questions or Issues?**

- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices
- Source story: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`
- Source epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`

---

**Generated by BMad TEA Agent** — 2026-05-24
