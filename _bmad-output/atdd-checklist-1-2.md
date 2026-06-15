# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-15
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL) + E2E (Playwright)

---

## Story Summary

A persistent navigation shell with `LayoutBase` + `NavigationRail` (desktop ≥ 1024px) and `NavigationBar` (mobile < 1024px) from `siesa-ui-kit`, integrated with TanStack file-based routing.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. NavigationRail visible on desktop (≥ 1024px) with Clientes/Contactos items inside `LayoutBase` (`productName="Siesa Agents"`).
2. Clicking rail items navigates SPA-style (no full reload); selected item mirrors current path.
3. NavigationBar visible on mobile (< 1024px); NavigationRail NOT rendered (FR29); 44×44px touch targets.
4. Direct URL `/clientes` or `/contactos` renders correct view; shell remains mounted (FR30).
5. Unknown route shows Spanish not-found view with link back to `/clientes`; shell remains visible.
6. Root `/` redirects to `/clientes`.
7. `pnpm run build` succeeds with zero TS errors, gzipped main bundle < 500 KB.
8. Vitest + RTL test suite passes (TC-E1-P1-01, P1-04, P2-01, P2-02, P2-03).

---

## Failing Tests Created (RED Phase)

### Component / Routing Tests — Vitest + RTL (15 tests across 4 files)

**File:** `frontend/src/shared/components/__tests__/AppShell.test.tsx` (~170 lines)

Covers AC #1 and #3 — responsive shell rendering (TC-E1-P2-01, TC-E1-P2-02).

- **Test:** `GIVEN desktop viewport ≥ 1024px WHEN AppShell renders THEN NavigationRail with Clientes and Contactos items is visible`
  - **Status:** RED — `@/shared/components/AppShell` import does not resolve (file missing)
  - **Verifies:** `data-testid="app-navigation-rail"` exists on desktop viewport
- **Test:** `GIVEN desktop viewport WHEN AppShell renders THEN the rail item "Clientes" is exposed`
  - **Status:** RED — AppShell missing
  - **Verifies:** `data-testid="nav-rail-item-clientes"` is in DOM
- **Test:** `GIVEN desktop viewport WHEN AppShell renders THEN the rail item "Contactos" is exposed`
  - **Status:** RED — AppShell missing
  - **Verifies:** `data-testid="nav-rail-item-contactos"` is in DOM
- **Test:** `GIVEN mobile viewport < 1024px WHEN AppShell renders THEN NavigationBar wrapper is present`
  - **Status:** RED — AppShell missing
  - **Verifies:** `data-testid="app-navigation-bar"` exists on mobile viewport
- **Test:** `GIVEN mobile viewport WHEN AppShell renders THEN NavigationRail is NOT visible`
  - **Status:** RED — AppShell missing
  - **Verifies:** FR29 — rail hidden on mobile
- **Test:** `GIVEN mobile viewport WHEN AppShell renders THEN bar items expose Clientes and Contactos entries`
  - **Status:** RED — AppShell missing
  - **Verifies:** `data-testid="nav-bar-item-clientes"` is in DOM
- **Test:** `GIVEN mobile viewport WHEN AppShell renders THEN "Contactos" item exists in the bottom bar`
  - **Status:** RED — AppShell missing
  - **Verifies:** `data-testid="nav-bar-item-contactos"` is in DOM

**File:** `frontend/src/routes/__tests__/navigation.test.tsx` (~160 lines)

Covers AC #2 — SPA navigation between routes (TC-E1-P1-01).

- **Test:** `GIVEN user is on /clientes WHEN clicking "Contactos" rail item THEN router navigates to /contactos`
  - **Status:** RED — AppShell + /contactos route missing
  - **Verifies:** SPA navigation rail-item → URL update + view render
- **Test:** `GIVEN user is on /contactos WHEN clicking "Clientes" rail item THEN router navigates back to /clientes`
  - **Status:** RED — same dependencies missing
  - **Verifies:** Reverse direction navigation
- **Test:** `GIVEN navigation occurs via rail click WHEN inspecting window.location THEN no full reload (.assign / .replace / .href mutation) is triggered`
  - **Status:** RED — AppShell missing
  - **Verifies:** TC-E1-P1-01 explicit requirement — no `window.location` mutation
- **Test:** `GIVEN user navigates between routes WHEN the active rail item is queried THEN the selected id mirrors the current path`
  - **Status:** RED — AppShell missing
  - **Verifies:** AC #2 — `selectedId` reflects active path via `data-active="true"`

**File:** `frontend/src/routes/__tests__/not-found.test.tsx` (~118 lines)

Covers AC #5 — not-found view (TC-E1-P1-04).

- **Test:** `GIVEN user navigates to /ruta-que-no-existe WHEN the page loads THEN the NotFoundView component is rendered`
  - **Status:** RED — root route has no `notFoundComponent`
  - **Verifies:** `data-testid="not-found-view"` is rendered
- **Test:** `GIVEN user navigates to an unknown route WHEN the page loads THEN the Spanish "Página no encontrada" heading is displayed`
  - **Status:** RED — no NotFoundView component
  - **Verifies:** Spanish UI text (mandatory)
- **Test:** `GIVEN the not-found view is rendered WHEN the user inspects the page THEN a link back to /clientes is exposed`
  - **Status:** RED — no NotFoundView component
  - **Verifies:** `data-testid="not-found-link-clientes"` with `href="/clientes"`
- **Test:** `GIVEN user navigates to an unknown route WHEN the not-found view renders THEN the navigation shell remains visible`
  - **Status:** RED — neither shell nor NotFoundView mounted
  - **Verifies:** Shell mounts INSIDE NotFoundComponent (AC #5)

**File:** `frontend/src/routes/__tests__/index-redirect.test.tsx` (~75 lines)

Covers AC #6 — index redirect (TC-E1-P2-03).

- **Test:** `GIVEN user lands on / WHEN the router loads THEN the URL changes to /clientes`
  - **Status:** RED — index route renders inline heading, no redirect
  - **Verifies:** TanStack Router `beforeLoad` redirect to `/clientes`
- **Test:** `GIVEN user lands on / WHEN the redirect resolves THEN the Clientes view content is rendered`
  - **Status:** RED — no /clientes route exists
  - **Verifies:** Post-redirect Clientes view rendered

### E2E Tests — Playwright (10 tests in 1 file)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (~165 lines)

Covers AC #2, #4, #5, #6 with real browser execution.

- **Test:** `GIVEN user types /clientes directly into the URL bar WHEN the page loads THEN the Clientes view is rendered with shell visible` (TC-E1-P1-02)
  - **Status:** RED — /clientes route does not exist
- **Test:** `GIVEN /clientes is reached via direct URL WHEN inspecting the URL THEN no redirect to home occurred`
  - **Status:** RED — same dependency
- **Test:** `GIVEN /clientes is reached via direct URL WHEN inspecting the page THEN the persistent shell (rail or bar) is mounted`
  - **Status:** RED — no shell
- **Test:** `GIVEN user types /contactos directly into the URL bar WHEN the page loads THEN the Contactos view is rendered` (TC-E1-P1-03)
  - **Status:** RED — /contactos route does not exist
- **Test:** `GIVEN /contactos is reached via direct URL WHEN inspecting the URL THEN no redirect to home occurred`
  - **Status:** RED — same dependency
- **Test:** `GIVEN user navigates to /ruta-que-no-existe WHEN the page loads THEN the not-found view is displayed`
  - **Status:** RED — no notFoundComponent
- **Test:** `GIVEN user navigates to an unknown route WHEN the page loads THEN the Spanish "Página no encontrada" heading is shown`
  - **Status:** RED — same dependency
- **Test:** `GIVEN user lands on an unknown route WHEN they inspect the page THEN a link back to /clientes is provided`
  - **Status:** RED — same dependency
- **Test:** `GIVEN user lands on an unknown route WHEN the not-found view renders THEN the persistent shell (rail or bar) is still mounted`
  - **Status:** RED — no shell + no NotFoundView
- **Test:** `GIVEN user lands on the root URL / WHEN the page loads THEN the router redirects to /clientes`
  - **Status:** RED — index route does not redirect
- **Test:** `GIVEN user is on /clientes WHEN they click the Contactos navigation item THEN URL becomes /contactos without a full page reload`
  - **Status:** RED — neither route nor rail/bar items exist

---

## Data Factories Created

None — Story 1.2 is a routing/shell story with no domain entities. Factories deferred to Epic 2 (clientes) and Epic 3 (contactos).

---

## Fixtures Created

None new — leverage existing `e2e/fixtures/base.fixture.ts` which already provides `clientesPage` / `contactosPage` navigation fixtures. No additional fixtures required since the shell tests are pure routing/rendering.

---

## Mock Requirements

None — Story 1.2 is frontend-only and does not require any backend interaction. The shell renders entirely client-side.

---

## Required data-testid Attributes

The implementation MUST add these data-testid attributes for the tests to go GREEN:

### `AppShell` component (`frontend/src/shared/components/AppShell.tsx`)

- `app-navigation-rail` — wrapper around the desktop NavigationRail (visible at ≥ 1024px)
- `app-navigation-bar` — wrapper around the mobile NavigationBar (visible at < 1024px)
- `nav-rail-item-clientes` — Clientes rail item; must expose `data-active="true|false"` to reflect active route
- `nav-rail-item-contactos` — Contactos rail item; same `data-active` convention
- `nav-bar-item-clientes` — Clientes bar item (mobile)
- `nav-bar-item-contactos` — Contactos bar item (mobile)

### `NotFoundView` component (`frontend/src/shared/components/NotFoundView.tsx`)

- `not-found-view` — root container of the not-found view
- `not-found-link-clientes` — anchor `<Link to="/clientes">Ir a Clientes</Link>` with `href="/clientes"`
- A heading element (no testid needed) with text `Página no encontrada`

### Route view components

- `clientes-heading` — Clientes view top heading element (the `<h1>Clientes</h1>`)
- `contactos-heading` — Contactos view top heading element

**Implementation Example:**

```tsx
// AppShell.tsx (desktop branch)
<div data-testid="app-navigation-rail" className="hidden lg:block">
  <LayoutBase ...>
    {/* The siesa-ui-kit rail will render children; wrap nav items so we can tag them */}
    <button
      data-testid="nav-rail-item-clientes"
      data-active={activeId === 'clientes'}
      onClick={() => router.navigate({ to: '/clientes' })}
    >
      Clientes
    </button>
  </LayoutBase>
</div>

// NotFoundView.tsx
<div data-testid="not-found-view">
  <h1>Página no encontrada</h1>
  <p>La ruta solicitada no existe.</p>
  <Link data-testid="not-found-link-clientes" to="/clientes">Ir a Clientes</Link>
</div>

// clientes.tsx route view
<h1 data-testid="clientes-heading">Clientes</h1>
```

---

## Implementation Checklist

### Test: `AppShell` desktop / mobile branches (TC-E1-P2-01 / TC-E1-P2-02)

**Files:** `frontend/src/shared/components/__tests__/AppShell.test.tsx`

**Tasks to make these tests pass:**

- [ ] Install missing deps: `pnpm --filter frontend add @heroicons/react @fontsource/inter`
- [ ] Create `frontend/src/shared/components/AppShell.tsx` (wraps `LayoutBase` and `NavigationBar` from `siesa-ui-kit`)
- [ ] Implement responsive switch — desktop block (`hidden lg:block`) wraps `<LayoutBase>` with `data-testid="app-navigation-rail"`; mobile block wraps `<NavigationBar>` with `data-testid="app-navigation-bar"`
- [ ] Inside the rail and bar, render two items: Clientes and Contactos — each with their `data-testid` and `data-active` attributes
- [ ] Create `frontend/src/shared/hooks/useActiveNavId.ts` (returns `'clientes' | 'contactos' | null` from `useLocation().pathname`)
- [ ] Run test: `pnpm --filter frontend test src/shared/components/__tests__/AppShell.test.tsx`
- [ ] Test passes (green phase)

### Test: SPA navigation (TC-E1-P1-01)

**File:** `frontend/src/routes/__tests__/navigation.test.tsx`

**Tasks to make this test pass:**

- [ ] AppShell from previous task in place
- [ ] Click handlers on rail/bar items call `router.navigate({ to: '/clientes' | '/contactos' })` — NEVER `window.location.assign` / `href`
- [ ] `data-active="true"` is set on the active item based on `useLocation().pathname`
- [ ] Run test: `pnpm --filter frontend test src/routes/__tests__/navigation.test.tsx`
- [ ] Test passes (green phase)

### Test: NotFoundView (TC-E1-P1-04)

**File:** `frontend/src/routes/__tests__/not-found.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/shared/components/NotFoundView.tsx` with Spanish heading "Página no encontrada", description "La ruta solicitada no existe.", and a `<Link to="/clientes">` labelled "Ir a Clientes" with `data-testid="not-found-link-clientes"`
- [ ] Wrap the root in `data-testid="not-found-view"`
- [ ] Update `frontend/src/routes/__root.tsx` to wire `notFoundComponent: () => <AppShell><NotFoundView /></AppShell>`
- [ ] Re-run the TanStack Router code-gen by `pnpm --filter frontend dev` once (or `pnpm --filter frontend build`)
- [ ] Run test: `pnpm --filter frontend test src/routes/__tests__/not-found.test.tsx`
- [ ] Test passes (green phase)

### Test: Index redirect (TC-E1-P2-03)

**File:** `frontend/src/routes/__tests__/index-redirect.test.tsx`

**Tasks to make this test pass:**

- [ ] Replace `frontend/src/routes/index.tsx` with `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Create `frontend/src/routes/clientes.tsx` exposing `/clientes` with `<h1 data-testid="clientes-heading">Clientes</h1>`
- [ ] Create `frontend/src/routes/contactos.tsx` exposing `/contactos` with `<h1 data-testid="contactos-heading">Contactos</h1>`
- [ ] Let `@tanstack/router-plugin/vite` regenerate `src/routeTree.gen.ts` on next dev/build
- [ ] Run test: `pnpm --filter frontend test src/routes/__tests__/index-redirect.test.tsx`
- [ ] Test passes (green phase)

### Test: E2E deep-linking and SPA navigation (TC-E1-P1-02, P1-03)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**Tasks to make these tests pass:**

- [ ] All previous tasks complete (AppShell, NotFoundView, /clientes, /contactos, /, redirect)
- [ ] Run frontend dev server (Playwright `webServer` config auto-starts it)
- [ ] Run test: `pnpm --filter root exec playwright test e2e/tests/navigation/navigation-shell.spec.ts` or simply `pnpm exec playwright test navigation-shell`
- [ ] Tests pass (green phase)

---

## Running Tests

```bash
# Run all new Vitest component / routing tests
cd frontend && pnpm test

# Run a single test file
cd frontend && pnpm test src/shared/components/__tests__/AppShell.test.tsx

# Run watch mode while implementing
cd frontend && pnpm test:watch

# Run E2E tests (Playwright will start the dev server automatically)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Debug E2E test
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Mock requirements documented (none for this story)
- data-testid requirements listed
- Implementation checklist created

**Verification (executed locally):**

- Vitest run: `Test Files 4 failed | 1 passed (5)` / `Tests 6 failed | 2 passed (8)`
  - 2 files (`AppShell.test.tsx`, `navigation.test.tsx`) fail at import-time because `@/shared/components/AppShell` does not exist — RED for the right reason
  - 4 not-found tests fail with `Unable to find element by data-testid="not-found-view"` — RED for the right reason
  - 2 index-redirect tests fail because `/clientes` route does not exist — RED for the right reason
- E2E tests not yet executed — they will fail equivalently because the routes and shell are missing

### GREEN Phase (DEV Team — Next Steps)

1. Read the failing test
2. Implement the minimal code to make it pass (one test at a time)
3. Run the test to verify green
4. Move to next test

### REFACTOR Phase (DEV Team — After GREEN)

1. All tests green
2. Refactor responsive shell pattern if dual-render leaks (consider `useMediaQuery`)
3. Extract `navigationItems` array to a constant module
4. Ensure tests still green after each refactor

---

## Notes

- Network-first is honored in E2E: `page.waitForResponse(...)` is registered BEFORE `page.goto(...)` where applicable.
- All selectors use `data-testid` — no fragile CSS or text-only queries.
- No hard waits — only explicit `expect().toBeVisible()` polling, `waitFor`, and `findBy*`.
- Tests run in `frontend/` (Vitest) and from project root (Playwright).
- The 2 "passing" tests in the Vitest summary belong to a pre-existing utility test file (`src/shared/lib/__tests__/utils.test.ts`) — not part of this story.

---

## Output File

`_bmad-output/atdd-checklist-1-2.md`

**Manual Handoff:** Share this checklist + failing tests with the dev workflow (not auto-consumed).
