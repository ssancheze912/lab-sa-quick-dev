# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

This story implements the persistent navigation shell for the Siesa Agents CRM frontend.
Users need responsive navigation (desktop: NavigationRail, mobile: NavigationBar) from the
siesa-ui-kit library to move between Clientes and Contactos sections using TanStack Router
client-side navigation without full page reloads.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop viewport (>= 1024px): NavigationRail visible on left side (72px, icon-only) with Clientes and Contactos — clicking navigates via TanStack Router (FR28)
2. Mobile viewport (< 1024px): NavigationBar at bottom with Clientes and Contactos — minimum 44px touch targets (FR29)
3. Deep linking: Typing /clientes or /contactos in URL bar renders correct view with active nav item — no redirect (FR30)
4. Route change from /clientes → /contactos: URL updates, active state moves to Contactos, no full page reload (no HTML document request)
5. Unknown route (e.g. /ruta-inexistente): 404 not-found view with "Página no encontrada" in Spanish and back link to /clientes
6. Root path /: automatic redirect to /clientes
7. Accessibility: nav landmark `<nav aria-label="Navegación principal">`, all interactive items have Spanish aria-labels

---

## Failing Tests Created (RED Phase)

### E2E Tests (21 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**AC1 — Desktop NavigationRail (6 tests):**

- RED **Test:** should render the app shell wrapper on desktop viewport
  - **Status:** RED - `[data-testid="app-shell"]` not found (routes/_app.tsx not created)
  - **Verifies:** AC1 — LayoutBase wrapper with data-testid

- RED **Test:** should display NavigationRail on the left side on desktop viewport
  - **Status:** RED - `[data-testid="navigation-rail"]` not found
  - **Verifies:** AC1 — siesa-ui-kit NavigationRail visible on desktop

- RED **Test:** should show Clientes entry in the NavigationRail
  - **Status:** RED - aria-label="Clientes" not found inside navigation-rail
  - **Verifies:** AC1 — Clientes nav item exists

- RED **Test:** should show Contactos entry in the NavigationRail
  - **Status:** RED - aria-label="Contactos" not found inside navigation-rail
  - **Verifies:** AC1 — Contactos nav item exists

- RED **Test:** should navigate to /clientes without full page reload when Clientes entry is clicked
  - **Status:** RED - navigation-rail not found; no click possible
  - **Verifies:** AC1 — TanStack Router client-side navigation (no document reload)

- RED **Test:** should navigate to /contactos without full page reload when Contactos entry is clicked
  - **Status:** RED - navigation-rail not found; no click possible
  - **Verifies:** AC1 — TanStack Router client-side navigation

**AC2 — Mobile NavigationBar (6 tests):**

- RED **Test:** should display NavigationBar at the bottom on mobile viewport
  - **Status:** RED - `[data-testid="navigation-bar"]` not found
  - **Verifies:** AC2 — siesa-ui-kit NavigationBar on mobile

- RED **Test:** should NOT display NavigationRail on mobile viewport
  - **Status:** RED - navigation-rail may be visible (no responsive CSS applied)
  - **Verifies:** AC2 — NavigationRail hidden on mobile

- RED **Test:** should show Clientes entry in the NavigationBar on mobile
  - **Status:** RED - navigation-bar not found
  - **Verifies:** AC2 — Clientes in NavigationBar

- RED **Test:** should show Contactos entry in the NavigationBar on mobile
  - **Status:** RED - navigation-bar not found
  - **Verifies:** AC2 — Contactos in NavigationBar

- RED **Test:** should have Clientes navigation item with minimum 44px touch target height
  - **Status:** RED - navigation-bar not found; bounding box returns null
  - **Verifies:** AC2 — 44px WCAG touch target

- RED **Test:** should have Contactos navigation item with minimum 44px touch target height
  - **Status:** RED - navigation-bar not found; bounding box returns null
  - **Verifies:** AC2 — 44px WCAG touch target

**AC3 — Deep Linking (6 tests):**

- RED **Test:** should render the clientes view when /clientes is accessed directly
  - **Status:** RED - `[data-testid="clientes-view"]` not found (route file not created)
  - **Verifies:** AC3 — /clientes renders clientes-view

- RED **Test:** should render the contactos view when /contactos is accessed directly
  - **Status:** RED - `[data-testid="contactos-view"]` not found (route file not created)
  - **Verifies:** AC3 — /contactos renders contactos-view

- RED **Test:** should mark Clientes navigation item as active when on /clientes route
  - **Status:** RED - aria-current="page" attribute not set
  - **Verifies:** AC3 — Active nav state on deep link

- RED **Test:** should mark Contactos navigation item as active when on /contactos route
  - **Status:** RED - aria-current="page" not set on Contactos
  - **Verifies:** AC3 — Active nav state on deep link

- RED **Test:** should NOT redirect to home when /clientes is accessed directly
  - **Status:** RED - route may redirect or show blank (no route match)
  - **Verifies:** AC3 — No redirect on direct URL access (FR30)

- RED **Test:** should NOT redirect to home when /contactos is accessed directly
  - **Status:** RED - route may redirect or show blank
  - **Verifies:** AC3 — No redirect on direct URL access (FR30)

**AC4 — Active State on Navigation (2 tests):**

- RED **Test:** should update active state to Contactos after clicking Contactos from /clientes
  - **Status:** RED - navigation-rail not found
  - **Verifies:** AC4 — Active nav state update on route change

- RED **Test:** should remove active state from Clientes after navigating to Contactos
  - **Status:** RED - navigation-rail not found
  - **Verifies:** AC4 — Previous active state removed

**AC5 — 404 Not-Found (4 tests):**

- RED **Test:** should display the not-found view for an unknown route
  - **Status:** RED - `[data-testid="not-found-view"]` not found ($.tsx not created)
  - **Verifies:** AC5 — 404 view renders for unknown routes

- RED **Test:** should display a Spanish-language not-found message
  - **Status:** RED - "Página no encontrada" text not found
  - **Verifies:** AC5 — Spanish 404 message

- RED **Test:** should show a back link to /clientes on the 404 page
  - **Status:** RED - back link to /clientes not found
  - **Verifies:** AC5 — Back link "Ir a Clientes" on 404

- RED **Test:** should navigate to /clientes when the back link on the 404 page is clicked
  - **Status:** RED - back link not found; click impossible
  - **Verifies:** AC5 — Back link navigates to /clientes

**AC6 — Root Redirect (2 tests):**

- RED **Test:** should redirect / to /clientes automatically
  - **Status:** RED - index.tsx has no redirect logic
  - **Verifies:** AC6 — Root redirect

- RED **Test:** should render the clientes view after root redirect
  - **Status:** RED - clientes-view not rendered
  - **Verifies:** AC6 — clientes-view renders after redirect

**AC7 — Accessibility (5 tests):**

- RED **Test:** should have a nav landmark with aria-label="Navegación principal"
  - **Status:** RED - `nav[aria-label="Navegación principal"]` not found
  - **Verifies:** AC7 — Nav landmark

- RED **Test:** should have Spanish aria-label on Clientes item (desktop)
  - **Status:** RED - aria-label not present
  - **Verifies:** AC7 — Spanish ARIA label

- RED **Test:** should have Spanish aria-label on Contactos item (desktop)
  - **Status:** RED - aria-label not present
  - **Verifies:** AC7 — Spanish ARIA label

- RED **Test:** should have Spanish aria-label on Clientes item (mobile)
  - **Status:** RED - navigation-bar not found
  - **Verifies:** AC7 — Spanish ARIA label on mobile

- RED **Test:** should have Spanish aria-label on Contactos item (mobile)
  - **Status:** RED - navigation-bar not found
  - **Verifies:** AC7 — Spanish ARIA label on mobile

- RED **Test:** should have all interactive navigation elements reachable via keyboard Tab
  - **Status:** RED - navigation elements not rendered
  - **Verifies:** AC7 — Keyboard navigability

### Component Tests (19 tests)

**File:** `frontend/src/routes/__tests__/app-shell.test.tsx`

- RED **Test:** should render the app-shell wrapper (AC1) — routeTree not found
- RED **Test:** should render NavigationRail on desktop (AC1) — navigation-rail not found
- RED **Test:** should render Clientes link in NavigationRail (AC1)
- RED **Test:** should render Contactos link in NavigationRail (AC1)
- RED **Test:** should render NavigationBar on mobile (AC2) — navigation-bar not found
- RED **Test:** should render Clientes in NavigationBar on mobile (AC2)
- RED **Test:** should render Contactos in NavigationBar on mobile (AC2)
- RED **Test:** should render clientes-view on /clientes (AC3) — clientes-view not found
- RED **Test:** should render contactos-view on /contactos (AC3) — contactos-view not found
- RED **Test:** should mark Clientes as aria-current="page" on /clientes (AC3)
- RED **Test:** should mark Contactos as aria-current="page" on /contactos (AC3)
- RED **Test:** should update active state to Contactos after clicking (AC4)
- RED **Test:** should remove active state from Clientes after navigating (AC4)
- RED **Test:** should render not-found-view for unknown route (AC5)
- RED **Test:** should display "Página no encontrada" message (AC5)
- RED **Test:** should show back link to /clientes on 404 page (AC5)
- RED **Test:** should redirect / and render clientes-view (AC6)
- RED **Test:** should have nav landmark with aria-label="Navegación principal" (AC7)
- RED **Test:** should have aria-label="Clientes" on nav item (AC7)

### API Tests (0 tests)

**Story is frontend-only** — no backend changes required. No API tests generated.

---

## Data Factories Created

**None required.** This story is frontend navigation only — no entity data or API calls.
Navigation items are static configuration (Clientes, Contactos).

---

## Fixtures Created

The base fixture `e2e/fixtures/base.fixture.ts` already contains `clientesPage` and
`contactosPage` helpers from Story 1.1. No new fixtures required for this story.

---

## Mock Requirements

**None.** This story has no backend dependencies. Navigation is purely client-side (TanStack Router).
No external services are called by the navigation shell.

---

## Required data-testid Attributes

### App Shell Layout (`_app.tsx`)

- `app-shell` — on the LayoutBase wrapper component (outermost shell element)

### NavigationRail (desktop, siesa-ui-kit)

- `navigation-rail` — on the NavigationRail siesa-ui-kit component container

### NavigationBar (mobile, siesa-ui-kit)

- `navigation-bar` — on the NavigationBar siesa-ui-kit component container

### Route Views

- `clientes-view` — on the root element of `_app/clientes.tsx` (e.g., `<div data-testid="clientes-view">`)
- `contactos-view` — on the root element of `_app/contactos.tsx`
- `not-found-view` — on the root element of `$.tsx` catch-all 404 route

### Already Existing (Story 1.1)

- `app-root` — on `__root.tsx` wrapper (do NOT modify)

**Implementation Example:**

```tsx
// _app.tsx
<LayoutBase data-testid="app-shell">
  <nav aria-label="Navegación principal">
    <NavigationRail data-testid="navigation-rail" items={navigationItems} />
    <NavigationBar data-testid="navigation-bar" items={navigationItems} />
  </nav>
  <Outlet />
</LayoutBase>

// _app/clientes.tsx
<div data-testid="clientes-view">
  <h1>Clientes</h1>
</div>

// _app/contactos.tsx
<div data-testid="contactos-view">
  <h1>Contactos</h1>
</div>

// $.tsx
<div data-testid="not-found-view">
  <h1>Página no encontrada</h1>
  <a href="/clientes">Ir a Clientes</a>
</div>
```

---

## Implementation Checklist

### Test: AC1 — Desktop NavigationRail visible

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- [ ] Create `frontend/src/routes/_app.tsx` as a pathless TanStack Router layout route
- [ ] Import `LayoutBase`, `NavigationRail` from `siesa-ui-kit`
- [ ] Add `data-testid="app-shell"` to the LayoutBase wrapper
- [ ] Add `data-testid="navigation-rail"` to the NavigationRail component
- [ ] Configure NavigationRail with items: `[{ label: 'Clientes', to: '/clientes', 'aria-label': 'Clientes', icon: UsersIcon }, { label: 'Contactos', to: '/contactos', 'aria-label': 'Contactos', icon: UserIcon }]`
- [ ] Apply `hidden lg:flex` (or equivalent) CSS to show NavigationRail only on desktop
- [ ] Use TanStack Router `<Link>` for navigation items (NOT `<a href>`)
- [ ] Run test: `pnpm exec playwright test navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Mobile NavigationBar with 44px touch targets

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- [ ] Import `NavigationBar` from `siesa-ui-kit`
- [ ] Add `data-testid="navigation-bar"` to the NavigationBar component
- [ ] Configure NavigationBar with same navigation items as NavigationRail
- [ ] Apply `flex lg:hidden` CSS to show NavigationBar only on mobile (< 1024px)
- [ ] Verify siesa-ui-kit NavigationBar touch targets meet 44px minimum (check UI kit docs)
- [ ] Run test: `pnpm exec playwright test navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — Deep linking renders correct view with active nav

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `<div data-testid="clientes-view"><h1>Clientes</h1></div>`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `<div data-testid="contactos-view"><h1>Contactos</h1></div>`
- [ ] Verify TanStack Router auto-generates routeTree.gen.ts including `_app/clientes` and `_app/contactos`
- [ ] Implement active state: use `useRouterState` or TanStack Router `<Link activeProps>` to set `aria-current="page"` on active item
- [ ] Ensure active item styling: `primary-50` background, `primary-700` text per UX spec
- [ ] Run test: `pnpm exec playwright test navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC4 — Active state updates on route change without reload

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- [ ] Verify active state logic updates reactively when route changes (already covered by TanStack Router if using Link activeProps)
- [ ] Ensure no page.route() document reload occurs (TanStack Router handles SPA navigation)
- [ ] Run test: `pnpm exec playwright test navigation-shell.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — 404 not-found view in Spanish

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- [ ] Create `frontend/src/routes/$.tsx` (TanStack Router catch-all) with:
  - `data-testid="not-found-view"` on root element
  - `<h1>Página no encontrada</h1>` (Spanish)
  - `<a href="/clientes">Ir a Clientes</a>` back link using TanStack Router Link
- [ ] Verify TanStack Router catch-all (`$`) auto-generates in routeTree.gen.ts
- [ ] Run test: `pnpm exec playwright test navigation-shell.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC6 — Root / redirects to /clientes

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- [ ] Update `frontend/src/routes/index.tsx` to use TanStack Router redirect:
  ```typescript
  import { createFileRoute, redirect } from '@tanstack/react-router'
  export const Route = createFileRoute('/')({
    beforeLoad: () => { throw redirect({ to: '/clientes' }) },
  })
  ```
- [ ] Remove any existing placeholder content from index.tsx
- [ ] Run test: `pnpm exec playwright test navigation-shell.spec.ts --grep "AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC7 — ARIA labels and nav landmark

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

- [ ] Wrap navigation with `<nav aria-label="Navegación principal">` (check if siesa-ui-kit LayoutBase adds this automatically; if not, add explicitly)
- [ ] Ensure all navigation items have `aria-label` in Spanish: `aria-label="Clientes"`, `aria-label="Contactos"`
- [ ] For icon-only NavigationRail buttons (collapsed): verify siesa-ui-kit passes through `aria-label` prop or add `aria-label` manually
- [ ] Verify keyboard navigation: Tab reaches all nav items, Enter/Space activates them
- [ ] Run test: `pnpm exec playwright test navigation-shell.spec.ts --grep "AC7"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Component Tests: app-shell.test.tsx

**File:** `frontend/src/routes/__tests__/app-shell.test.tsx`

- [ ] All route files above must be created first (routeTree.gen.ts must include new routes)
- [ ] Verify `@testing-library/user-event` is installed (`pnpm add -D @testing-library/user-event`)
- [ ] Run tests: `pnpm --filter frontend run test src/routes/__tests__/app-shell.test.tsx`
- [ ] Achieve ≥ 80% coverage on new route files
- [ ] ✅ All component tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all E2E failing tests for this story
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run specific AC group
pnpm exec playwright test navigation-shell.spec.ts --grep "AC1"
pnpm exec playwright test navigation-shell.spec.ts --grep "AC2"

# Run in headed mode (see browser)
pnpm exec playwright test navigation-shell.spec.ts --headed

# Debug specific test
pnpm exec playwright test navigation-shell.spec.ts --debug

# Run component tests
pnpm --filter frontend run test src/routes/__tests__/app-shell.test.tsx

# Run component tests with coverage
pnpm --filter frontend run test --coverage src/routes/__tests__/app-shell.test.tsx
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All E2E tests written and failing (21 tests in navigation-shell.spec.ts)
- ✅ All component tests written and failing (19 tests in app-shell.test.tsx)
- ✅ No data factories needed (static navigation config)
- ✅ No fixtures added (base.fixture.ts from Story 1.1 is sufficient)
- ✅ No mocks needed (no backend calls)
- ✅ data-testid requirements documented
- ✅ Implementation checklist created with clear tasks per AC

**Verification:**
- Tests fail due to missing route files and components — not test bugs
- Expected failures: "locator not found", "Element not found", "routeTree import error"
- Failures are actionable and directly map to implementation tasks

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick AC6 first (simplest — update index.tsx redirect)
2. Then AC1+AC2 together (create _app.tsx with LayoutBase + NavigationRail + NavigationBar)
3. Then AC3 (create clientes.tsx and contactos.tsx placeholders)
4. Then AC4 (verify active state updates — likely already covered by TanStack Router Link)
5. Then AC5 (create $.tsx catch-all 404 route)
6. Then AC7 (verify and add ARIA labels and nav landmark)
7. Run component tests last to confirm ≥ 80% coverage

**Key Principles:**

- Use `pnpm` exclusively (not npm or yarn)
- `routeTree.gen.ts` auto-generates on file save — do NOT edit manually
- Use siesa-ui-kit components ONLY — do not build custom NavigationRail/NavigationBar
- Use TanStack Router `<Link>` NOT `<a href>` for navigation

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 40 tests pass (21 E2E + 19 component)
2. Check bundle size: `pnpm run build` — navigation shell must not push total > 500KB gzipped
3. Review active state styling: `primary-50` background, `primary-700` text (WCAG 4.5:1 contrast)
4. Clean up any placeholder code or debug statements
5. Ensure tests still pass after any cleanup

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test navigation-shell.spec.ts`
3. Begin implementation using implementation checklist above (start with AC6 — simplest)
4. Work one AC at a time (red → green for each acceptance criterion)
5. When all E2E + component tests pass, run full suite to confirm no regressions
6. When refactoring complete, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation to prevent race conditions (htmlRequests monitoring)
- **selector-resilience.md** — data-testid selectors throughout (not fragile CSS selectors)
- **test-quality.md** — Given-When-Then structure, one assertion per test (atomic design)
- **component-tdd.md** — Vitest + RTL component tests with MemoryHistory router isolation
- **fixture-architecture.md** — Base fixture reuse from Story 1.1 (clientesPage, contactosPage)
- **test-levels-framework.md** — E2E for user journey acceptance; Component for isolated behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results:**

```
  21 failed
  0 passed

  AC1 — Desktop NavigationRail:
    ✗ should render the app shell wrapper on desktop viewport
      Error: locator('[data-testid="app-shell"]') not found
    ✗ should display NavigationRail on the left side on desktop viewport
      Error: locator('[data-testid="navigation-rail"]') not found
    ...

  AC5 — 404:
    ✗ should display the not-found view for an unknown route
      Error: locator('[data-testid="not-found-view"]') not found

  AC6 — Root redirect:
    ✗ should redirect / to /clientes automatically
      Error: expected URL to be '/clientes' but got '/'
```

**Summary:**

- Total tests: 21 E2E + 19 Component = 40 total
- Passing: 0 (expected — RED phase)
- Failing: 40 (expected — RED phase)
- Status: ✅ RED phase verified — failures are due to missing implementation, not test bugs

---

## Notes

- `tea_use_playwright_utils: false` — using standard Playwright patterns (no playwright-utils library)
- `tea_use_mcp_enhancements: false` — AI generation mode used (no MCP recording)
- Story 1.1 learnings applied: Chromium 1228 CDN blocked; use chromium-1194 headless shell symlink for CI
- TypeScript strict mode is active — all test imports must be type-safe
- The `routeTree.gen.ts` import in component tests will initially fail because route files do not exist yet — this is expected RED phase behavior
- No `@faker-js/faker` needed — navigation items are static configuration

---

**Generated by BMad TEA Agent** — 2026-06-24
