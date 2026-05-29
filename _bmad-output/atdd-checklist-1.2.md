# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-29
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** E2E (Playwright) + Component (Vitest + RTL)

---

## Story Summary

As a user, I want a persistent navigation structure to access the Clientes and Contactos sections of the application so that I can move between sections without full page reloads from any device.

The story covers responsive navigation (NavigationRail on desktop, NavigationBar on mobile), deep-link routing to /clientes and /contactos, a 404 not-found view with Spanish messaging, and an automatic redirect from / to /clientes.

**As a** user
**I want** a persistent navigation shell with Clientes and Contactos sections
**So that** I can navigate between sections from any device without full page reloads

---

## Acceptance Criteria

1. Desktop viewport (>= 1024px) shows NavigationRail on left side with "Clientes" and "Contactos" entries; clicking navigates via SPA (FR28).
2. Mobile viewport (< 1024px) shows NavigationBar at bottom with all items accessible and tappable (FR29).
3. Direct URL /clientes loads the Clientes view with navigation visible and "Clientes" highlighted as active (FR30).
4. Direct URL /contactos loads the Contactos view with navigation visible and "Contactos" highlighted as active (FR30).
5. Unknown routes (e.g., /unknown) render a 404 view with Spanish message "Página no encontrada" and a link back to /clientes.
6. Root path / automatically redirects to /clientes without displaying a blank screen.

---

## Failing Tests Created (RED Phase)

### E2E Tests (20 tests)

**File:** `e2e/tests/foundation/navigation-shell.spec.ts` (341 lines)

- **Test:** AC1 — Desktop NavigationRail visible at desktop viewport
  - **Status:** RED — `[data-testid="navigation-rail"]` element does not exist (not yet implemented)
  - **Verifies:** NavigationRail renders at >= 1024px viewport width

- **Test:** AC1 — "Clientes" entry visible in NavigationRail
  - **Status:** RED — `[data-testid="nav-item-clientes"]` element does not exist
  - **Verifies:** Clientes entry is present in the navigation rail

- **Test:** AC1 — "Contactos" entry visible in NavigationRail
  - **Status:** RED — `[data-testid="nav-item-contactos"]` element does not exist
  - **Verifies:** Contactos entry is present in the navigation rail

- **Test:** AC1 — Navigate to /clientes without full page reload
  - **Status:** RED — nav-item-clientes not found; SPA navigation not wired
  - **Verifies:** Clicking Clientes entry performs client-side navigation (FR28)

- **Test:** AC1 — Navigate to /contactos without full page reload
  - **Status:** RED — nav-item-contactos not found; SPA navigation not wired
  - **Verifies:** Clicking Contactos entry performs client-side navigation (FR28)

- **Test:** AC1 — NavigationBar NOT visible at desktop viewport
  - **Status:** RED — `[data-testid="navigation-bar"]` may be visible or absent; responsive logic not implemented
  - **Verifies:** Bottom navigation bar is hidden on desktop

- **Test:** AC2 — NavigationBar visible at bottom on mobile viewport
  - **Status:** RED — `[data-testid="navigation-bar"]` element does not exist
  - **Verifies:** NavigationBar renders at < 1024px viewport (FR29)

- **Test:** AC2 — NavigationRail NOT visible on mobile viewport
  - **Status:** RED — responsive hide/show logic not implemented
  - **Verifies:** Rail is hidden on mobile

- **Test:** AC2 — "Clientes" entry visible in NavigationBar on mobile
  - **Status:** RED — `[data-testid="nav-item-clientes"]` not found at mobile viewport
  - **Verifies:** Clientes item is accessible on mobile

- **Test:** AC2 — "Contactos" entry visible in NavigationBar on mobile
  - **Status:** RED — `[data-testid="nav-item-contactos"]` not found at mobile viewport
  - **Verifies:** Contactos item is accessible on mobile

- **Test:** AC3 — Render Clientes view when navigating directly to /clientes
  - **Status:** RED — `[data-testid="clientes-shell-view"]` does not exist
  - **Verifies:** ClientesShellView renders on direct URL access (FR30)

- **Test:** AC3 — Navigation rail/bar visible on direct /clientes URL access
  - **Status:** RED — navigation-rail element not found
  - **Verifies:** Navigation shell persists on deep link

- **Test:** AC3 — "Clientes" entry highlighted as active on /clientes route
  - **Status:** RED — data-active attribute not set; active routing not implemented
  - **Verifies:** Active route highlighting works correctly

- **Test:** AC3 — No redirect away from /clientes on direct access
  - **Status:** RED — router may redirect to / (index route without redirect)
  - **Verifies:** Deep linking is preserved (FR30)

- **Test:** AC4 — Render Contactos view when navigating directly to /contactos
  - **Status:** RED — `[data-testid="contactos-shell-view"]` does not exist
  - **Verifies:** ContactosShellView renders on direct URL access (FR30)

- **Test:** AC4 — Navigation rail/bar visible on direct /contactos URL access
  - **Status:** RED — navigation-rail element not found
  - **Verifies:** Navigation shell persists on deep link

- **Test:** AC4 — "Contactos" entry highlighted as active on /contactos route
  - **Status:** RED — data-active attribute not set
  - **Verifies:** Active route highlighting works correctly

- **Test:** AC4 — No redirect away from /contactos on direct access
  - **Status:** RED — URL may redirect unexpectedly
  - **Verifies:** Deep linking is preserved (FR30)

- **Test:** AC5 — 404 not-found view visible for unknown route
  - **Status:** RED — `[data-testid="not-found-view"]` does not exist; no catch-all route
  - **Verifies:** Unknown routes are handled gracefully

- **Test:** AC5 — Spanish message "Página no encontrada" on 404 view
  - **Status:** RED — not-found-message element absent
  - **Verifies:** Spanish localization on 404 page

- **Test:** AC5 — Back link to /clientes visible on 404 view
  - **Status:** RED — not-found-back-link element absent
  - **Verifies:** User can recover from unknown route

- **Test:** AC5 — Back link on 404 navigates to /clientes
  - **Status:** RED — link not present; navigation not wired
  - **Verifies:** Recovery navigation from 404 to /clientes

- **Test:** AC6 — Root path / redirects to /clientes
  - **Status:** RED — index.tsx renders HomePage instead of redirecting
  - **Verifies:** Automatic redirect from / to /clientes

- **Test:** AC6 — No blank screen on root path / access
  - **Status:** RED — `[data-testid="app-root"]` not found; no redirect configured
  - **Verifies:** App content visible after root redirect

### Component Tests — Navigation (13 tests)

**File:** `frontend/src/routes/__tests__/navigation.test.tsx`

- **Test:** NavigationRail renders with correct data-testid
  - **Status:** RED — `NavigationRail` module does not exist at `shared/components/ui/NavigationRail`
  - **Verifies:** AC1 — NavigationRail component is importable and renders

- **Test:** NavigationRail displays "Clientes" entry
  - **Status:** RED — module missing
  - **Verifies:** AC1 — Clientes nav item present in rail

- **Test:** NavigationRail displays "Contactos" entry
  - **Status:** RED — module missing
  - **Verifies:** AC1 — Contactos nav item present in rail

- **Test:** NavigationRail — "Clientes" item has aria-label in Spanish
  - **Status:** RED — module missing
  - **Verifies:** AC1 — WCAG 2.1 AA accessibility (aria-label="Ir a Clientes")

- **Test:** NavigationRail — "Contactos" item has aria-label in Spanish
  - **Status:** RED — module missing
  - **Verifies:** AC1 — WCAG 2.1 AA accessibility (aria-label="Ir a Contactos")

- **Test:** NavigationRail highlights "Clientes" active when activeRoute=/clientes
  - **Status:** RED — module missing
  - **Verifies:** AC3 — data-active="true" applied to active nav item

- **Test:** NavigationRail does NOT highlight "Contactos" when activeRoute=/clientes
  - **Status:** RED — module missing
  - **Verifies:** AC3 — inactive items do not have data-active="true"

- **Test:** NavigationRail highlights "Contactos" active when activeRoute=/contactos
  - **Status:** RED — module missing
  - **Verifies:** AC4 — data-active="true" applied to active nav item

- **Test:** NavigationRail does NOT highlight "Clientes" when activeRoute=/contactos
  - **Status:** RED — module missing
  - **Verifies:** AC4 — inactive items do not have data-active="true"

- **Test:** ClientesShellView renders with data-testid="clientes-shell-view"
  - **Status:** RED — `ClientesShellView` module does not exist
  - **Verifies:** AC3 — Clientes view renders with expected testid

- **Test:** ClientesShellView displays heading "Clientes" in Spanish
  - **Status:** RED — module missing
  - **Verifies:** AC3 — Spanish heading visible

- **Test:** ClientesShellView renders loading skeleton placeholder
  - **Status:** RED — module missing
  - **Verifies:** AC3 — skeleton screen shown as placeholder content

### Component Tests — Mobile Navigation (7 tests)

**File:** `frontend/src/routes/__tests__/navigation-mobile.test.tsx`

- **Test:** NavigationBar renders with correct data-testid
  - **Status:** RED — `NavigationBar` module does not exist at `shared/components/ui/NavigationBar`
  - **Verifies:** AC2 — NavigationBar component is importable and renders

- **Test:** NavigationBar displays "Clientes" nav item
  - **Status:** RED — module missing
  - **Verifies:** AC2 — Clientes item present and tappable (FR29)

- **Test:** NavigationBar displays "Contactos" nav item
  - **Status:** RED — module missing
  - **Verifies:** AC2 — Contactos item present and tappable (FR29)

- **Test:** NavigationBar — "Clientes" item has aria-label in Spanish
  - **Status:** RED — module missing
  - **Verifies:** AC2 — WCAG 2.1 AA accessibility

- **Test:** NavigationBar — "Contactos" item has aria-label in Spanish
  - **Status:** RED — module missing
  - **Verifies:** AC2 — WCAG 2.1 AA accessibility

- **Test:** NavigationBar highlights "Clientes" active when activeRoute=/clientes
  - **Status:** RED — module missing
  - **Verifies:** AC3/AC2 — active highlight in mobile nav

- **Test:** NavigationBar highlights "Contactos" active when activeRoute=/contactos
  - **Status:** RED — module missing
  - **Verifies:** AC4/AC2 — active highlight in mobile nav

### Component Tests — Not Found (5 tests)

**File:** `frontend/src/routes/__tests__/not-found.test.tsx`

- **Test:** NotFoundView renders with data-testid="not-found-view"
  - **Status:** RED — `NotFoundView` module does not exist
  - **Verifies:** AC5 — 404 view component is importable and renders

- **Test:** NotFoundView displays Spanish message "Página no encontrada"
  - **Status:** RED — module missing
  - **Verifies:** AC5 — Spanish localization on not-found view

- **Test:** NotFoundView displays back link to /clientes
  - **Status:** RED — module missing
  - **Verifies:** AC5 — recovery link is present

- **Test:** NotFoundView back link href is /clientes
  - **Status:** RED — module missing
  - **Verifies:** AC5 — link points to correct route

- **Test:** NotFoundView does not display raw error/exception text
  - **Status:** RED — module missing
  - **Verifies:** AC5 — graceful, user-friendly display

---

## Data Factories Created

No data factories required for this story. The navigation shell is a pure UI routing story with no backend data dependencies. All test scenarios use direct URL navigation and component rendering without external data sources.

---

## Fixtures Created

The base fixture at `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` helpers. No new fixtures are required for Story 1.2 beyond what already exists.

---

## Mock Requirements

### API Intercept (Playwright E2E)

All E2E tests apply `await page.route('**/api/**', (route) => route.continue())` as a network-first intercept before navigation. This prevents race conditions if the frontend makes any background API calls after navigation.

**Notes:** No actual API calls are expected for the navigation shell. The intercept is a precautionary passthrough, not a mock.

---

## Required data-testid Attributes

### AppRoot (`__root.tsx`)

- `app-root` — Root div wrapper in RootLayout (`<div id="app" data-testid="app-root">`)

### NavigationRail (`shared/components/ui/NavigationRail.tsx`)

- `navigation-rail` — The NavigationRail container element
- `nav-item-clientes` — Clientes navigation entry (with `aria-label="Ir a Clientes"`, `data-active="true|false"`)
- `nav-item-contactos` — Contactos navigation entry (with `aria-label="Ir a Contactos"`, `data-active="true|false"`)

### NavigationBar (`shared/components/ui/NavigationBar.tsx`)

- `navigation-bar` — The NavigationBar container element
- `nav-item-clientes` — Clientes navigation entry (same testid as rail, shared across both components)
- `nav-item-contactos` — Contactos navigation entry

### ClientesShellView (`modules/crm/clientes/presentation/components/ClientesShellView.tsx`)

- `clientes-shell-view` — Main container of the Clientes view
- `clientes-skeleton` — Skeleton placeholder block

### ContactosShellView (`modules/crm/contactos/presentation/components/ContactosShellView.tsx`)

- `contactos-shell-view` — Main container of the Contactos view
- `contactos-skeleton` — Skeleton placeholder block

### NotFoundView (`shared/components/ui/NotFoundView.tsx` or `routes/404.tsx`)

- `not-found-view` — Container of the 404 page
- `not-found-message` — Text element containing "Página no encontrada"
- `not-found-back-link` — Anchor/Link element pointing to /clientes

**Implementation Example:**

```tsx
// NavigationRail
<nav data-testid="navigation-rail">
  <Link
    to="/clientes"
    data-testid="nav-item-clientes"
    aria-label="Ir a Clientes"
    data-active={activeRoute === '/clientes' ? 'true' : 'false'}
  >
    <UsersIcon /> Clientes
  </Link>
  <Link
    to="/contactos"
    data-testid="nav-item-contactos"
    aria-label="Ir a Contactos"
    data-active={activeRoute === '/contactos' ? 'true' : 'false'}
  >
    <UserIcon /> Contactos
  </Link>
</nav>

// NotFoundView
<div data-testid="not-found-view">
  <p data-testid="not-found-message">Página no encontrada</p>
  <Link to="/clientes" data-testid="not-found-back-link">Volver a Clientes</Link>
</div>
```

---

## Implementation Checklist

### Group 1: AppRoot and Layout Setup (AC6 dependency)

**Tasks:**

- [ ] Update `frontend/src/routes/__root.tsx` — Add `data-testid="app-root"` to the root div
- [ ] Wrap root layout with `QueryProvider` from `app/providers/QueryProvider.tsx`
- [ ] Render `<Outlet />` inside the root layout

**Unblocks:** AC6 test `should NOT display a blank screen when accessing root path /`

---

### Group 2: Root Redirect / → /clientes (AC6)

**Tasks:**

- [ ] Update `frontend/src/routes/index.tsx` — Replace `HomePage` component with TanStack Router redirect:
  ```typescript
  export const Route = createFileRoute('/')({
    beforeLoad: () => { throw redirect({ to: '/clientes' }) },
  })
  ```
- [ ] Verify no `window.location.href` usage (use `throw redirect()`)
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC6"`

---

### Group 3: Pathless Layout Route _app (AC1, AC2, AC3, AC4)

**Tasks:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route
- [ ] Render `<Outlet />` inside the layout
- [ ] Import `NavigationRail` and render for desktop (hidden on mobile via `hidden lg:flex`)
- [ ] Import `NavigationBar` and render for mobile (hidden on desktop via `flex lg:hidden`)
- [ ] Add `domElementGetter: () => document.querySelector('#single-spa-application')` per Single-SPA standards
- [ ] Add required `data-testid` attributes: `navigation-rail`, `navigation-bar`
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC1"`

---

### Group 4: NavigationRail Component (AC1, AC3, AC4)

**Tasks:**

- [ ] Create `frontend/src/shared/components/ui/NavigationRail.tsx`
- [ ] Accept optional `activeRoute?: string` prop
- [ ] Render Clientes entry with `data-testid="nav-item-clientes"`, `aria-label="Ir a Clientes"`, `data-active={activeRoute === '/clientes' ? 'true' : 'false'}`
- [ ] Render Contactos entry with `data-testid="nav-item-contactos"`, `aria-label="Ir a Contactos"`, `data-active={activeRoute === '/contactos' ? 'true' : 'false'}`
- [ ] Use `UsersIcon` from `@heroicons/react/24/outline` for Clientes
- [ ] Use `UserIcon` from `@heroicons/react/24/outline` for Contactos
- [ ] Use TanStack Router `Link` with `activeProps` to derive active state from router context
- [ ] Apply Siesa Blue (`#0e79fd`) via TailwindCSS custom color token for active item
- [ ] Run component test: `pnpm run test -- navigation.test.tsx`

---

### Group 5: NavigationBar Component (AC2)

**Tasks:**

- [ ] Create `frontend/src/shared/components/ui/NavigationBar.tsx`
- [ ] Accept optional `activeRoute?: string` prop
- [ ] Position at bottom of screen using TailwindCSS (`fixed bottom-0`)
- [ ] Render Clientes and Contactos entries with same `data-testid` and `aria-label` attributes as NavigationRail
- [ ] Apply `data-active` attribute based on active route
- [ ] Run component test: `pnpm run test -- navigation-mobile.test.tsx`

---

### Group 6: /clientes and /contactos Routes (AC3, AC4)

**Tasks:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` — `createFileRoute('/_app/clientes')`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — `createFileRoute('/_app/contactos')`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/components/ClientesShellView.tsx`
  - Add `data-testid="clientes-shell-view"`
  - Add `<h1>Clientes</h1>` (Spanish heading)
  - Add `data-testid="clientes-skeleton"` with `react-loading-skeleton` block
- [ ] Create `frontend/src/modules/crm/contactos/presentation/components/ContactosShellView.tsx`
  - Add `data-testid="contactos-shell-view"`
  - Add `<h1>Contactos</h1>` (Spanish heading)
  - Add `data-testid="contactos-skeleton"` with `react-loading-skeleton` block
- [ ] Run test: `npx playwright test navigation-shell.spec.ts --grep "AC3|AC4"`

---

### Group 7: 404 Not-Found Route (AC5)

**Tasks:**

- [ ] Create `frontend/src/routes/404.tsx` (or `$` catch-all route)
- [ ] Create `frontend/src/shared/components/ui/NotFoundView.tsx`
  - Add `data-testid="not-found-view"`
  - Add `data-testid="not-found-message"` with text "Página no encontrada"
  - Add `data-testid="not-found-back-link"` — TanStack Router `Link` to `/clientes`
  - Do NOT display raw error/stack trace text
- [ ] Register catch-all route in TanStack Router configuration
- [ ] Run component test: `pnpm run test -- not-found.test.tsx`
- [ ] Run E2E test: `npx playwright test navigation-shell.spec.ts --grep "AC5"`

---

### Group 8: Route Tree Regeneration (All AC)

**Tasks:**

- [ ] Run `pnpm exec tsr generate` to regenerate `frontend/src/routeTree.gen.ts`
- [ ] Confirm `_app`, `_app/clientes`, `_app/contactos`, and 404 catch-all are registered
- [ ] Run `npx tsc --noEmit` — 0 TypeScript errors
- [ ] Run full component test suite: `pnpm run test`
- [ ] Run full E2E suite: `npx playwright test navigation-shell.spec.ts`

---

## Running Tests

```bash
# Run all E2E failing tests for Story 1.2
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts

# Run E2E tests for a specific AC
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC1"
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC2"
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC3"
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC5"
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC6"

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --headed

# Debug a specific E2E test
npx playwright test e2e/tests/foundation/navigation-shell.spec.ts --debug

# Run component tests (Vitest)
cd frontend && pnpm run test -- src/routes/__tests__/navigation.test.tsx
cd frontend && pnpm run test -- src/routes/__tests__/navigation-mobile.test.tsx
cd frontend && pnpm run test -- src/routes/__tests__/not-found.test.tsx

# Run all frontend tests
cd frontend && pnpm run test

# Run frontend tests with coverage
cd frontend && pnpm run test:coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All E2E tests written and failing (20 tests in `navigation-shell.spec.ts`)
- ✅ Component tests written and failing (25 tests across 3 files)
- ✅ Network-first intercept pattern applied (intercept before navigate)
- ✅ data-testid requirements documented
- ✅ Implementation checklist created with 8 implementation groups
- ✅ Mock requirements documented (passthrough intercept for API calls)

**Verification:**

- E2E tests fail due to missing routes, components, and data-testid attributes
- Component tests fail due to missing module imports (NavigationRail, NavigationBar, NotFoundView, ClientesShellView)
- Failures are due to missing implementation, not test logic errors

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with Group 1** (AppRoot) — simplest change, unblocks AC6 blank screen test
2. **Group 2** (root redirect) — single file change, unblocks all AC6 tests
3. **Group 4** (NavigationRail) — core component needed by most AC
4. **Group 5** (NavigationBar) — mobile variant
5. **Group 3** (_app layout) — wires both nav components into the layout
6. **Group 6** (route views) — creates actual route targets
7. **Group 7** (404) — catch-all and not-found view
8. **Group 8** (route tree) — regenerate and verify TypeScript passes

**Key Principles:**

- One group at a time; run tests after each group
- Minimal implementation (don't add functionality beyond what tests require)
- Run `pnpm run test` and `npx playwright test navigation-shell.spec.ts` after each group
- Use implementation checklist as progress tracker

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 45 tests pass (green phase complete)
2. Extract duplicated nav item logic (Clientes/Contactos entries shared between NavigationRail and NavigationBar)
3. Review accessibility with `axe` on the navigation shell (WCAG 2.1 AA)
4. Verify bundle delta < 15 KB gzipped for navigation shell additions
5. Ensure TypeScript strict mode passes (`npx tsc --noEmit`)
6. No custom navigation components if siesa-ui-kit becomes available — swap in without test changes

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run `npx playwright test e2e/tests/foundation/navigation-shell.spec.ts` to confirm RED phase
3. Run `cd frontend && pnpm run test` to confirm component tests fail (imports missing)
4. Begin implementation using Groups 1–8 as ordered roadmap
5. Work one group at a time (red → green per group)
6. When all 45 tests pass, refactor for quality and accessibility

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests apply `page.route()` intercept BEFORE `page.goto()` to prevent race conditions
- **selector-resilience.md** — All selectors use `data-testid` exclusively; no CSS class or text-based selectors
- **test-quality.md** — One assertion per test (atomic design); explicit waits only (`waitForURL`, `waitForLoadState`); no `sleep` or hard waits
- **component-tdd.md** — Component tests use Vitest + RTL pattern; props-based isolation (`activeRoute` prop)
- **fixture-architecture.md** — `base.fixture.ts` provides `clientesPage` / `contactosPage` as composable setup helpers
- **test-levels-framework.md** — E2E for critical user journeys (navigation, routing, deep links); Component for UI rendering and active state logic

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `npx playwright test e2e/tests/foundation/navigation-shell.spec.ts`

**Expected Result:** All 20 E2E tests fail — elements with required `data-testid` attributes do not exist because the navigation components and routes have not been implemented yet.

**Component Command:** `cd frontend && pnpm run test src/routes/__tests__/`

**Expected Result:** All 25 component tests fail — module resolution errors for `NavigationRail`, `NavigationBar`, `NotFoundView`, and `ClientesShellView` because these components have not been created yet.

**Summary:**

- Total tests: 45 (20 E2E + 13 component + 7 mobile component + 5 not-found component)
- Passing: 0 (expected — RED phase)
- Failing: 45 (expected — RED phase)
- Status: RED phase confirmed

---

## Notes

- siesa-ui-kit `NavigationRail` and `NavigationBar` may not be available in the npm registry. If unavailable, implement minimal Tailwind-based responsive navigation components matching the expected API (`data-testid`, `aria-label`, `data-active` props). The swap to siesa-ui-kit must be non-breaking when it becomes available.
- The `data-testid` attributes on nav items (`nav-item-clientes`, `nav-item-contactos`) must be identical in both `NavigationRail` and `NavigationBar` so that E2E tests at different viewports use the same selectors.
- TanStack Router's `Link` component with `activeProps` should be used to derive active state from the router context. The `data-active` attribute should reflect this TanStack Router active state, not a manually managed Zustand store.
- `domElementGetter: () => document.querySelector('#single-spa-application')` is required in root configuration per company microfrontend standards even in standalone SPA mode.

---

**Generated by BMad TEA Agent** — 2026-05-29
