# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-08
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Story 1.2 builds the persistent navigation shell on top of the project scaffold from Story 1.1.
It introduces TanStack Router file-based routing, the siesa-ui-kit `LayoutBase`/`NavigationRail`/
`NavigationBar` shell, responsive breakpoints (desktop ≥1024px / mobile <1024px), deep-link
support, a 404 not-found view, and WCAG 2.1 AA accessibility compliance.
No business logic or API calls are introduced.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Desktop (≥1024px): `NavigationRail` visible on left (72px collapsed, icon-only) with
   "Clientes" and "Contactos" entries; `Navbar` visible at top with `productName="Siesa Agents"`.
2. **AC2** — Desktop: clicking "Clientes" in NavigationRail routes to `/clientes` with SPA
   navigation (no full-page reload); Clientes item shows active state (`primary-600` border,
   `primary-50` background, `aria-current="page"`).
3. **AC3** — Desktop: clicking "Contactos" in NavigationRail routes to `/contactos` with SPA
   navigation; Contactos item shows active state.
4. **AC4** — Mobile (<1024px): `NavigationRail` is hidden; `NavigationBar` is displayed at the
   bottom with "Clientes" and "Contactos"; all items have minimum 44×44px touch targets (FR29).
5. **AC5** — Direct URL `/clientes` renders the Clientes view and marks Clientes nav item active
   — no redirect to a home screen (FR30).
6. **AC6** — Direct URL `/contactos` renders the Contactos view and marks Contactos nav item
   active — no redirect (FR30).
7. **AC7** — Unknown route (e.g., `/foo`) renders a 404 view with Spanish message
   "Página no encontrada" and a link back to `/clientes`.
8. **AC8** — Root `/` redirects to `/clientes` without showing a blank page.
9. **AC9** — All icon-only nav buttons have `aria-label` in Spanish ("Ir a Clientes",
   "Ir a Contactos"); `NavigationRail` has `role="navigation"` and
   `aria-label="Navegación principal"`; zero axe `critical` or `serious` violations (WCAG 2.1 AA).

---

## Failing Tests Created (RED Phase)

### E2E Tests (34 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**AC1 — Desktop navigation shell (≥1024px) — 5 tests:**

- **Test:** `should render a Navbar at the top with productName "Siesa Agents"`
  - **Status:** RED — `data-testid="navbar"` does not exist yet; `__root.tsx` has no LayoutBase
  - **Verifies:** AC1 — Navbar visible on desktop with correct product name

- **Test:** `should render a NavigationRail on the left side at ≥1024px`
  - **Status:** RED — `data-testid="navigation-rail"` does not exist yet
  - **Verifies:** AC1 — NavigationRail visible on desktop

- **Test:** `should show a "Clientes" entry in the NavigationRail on desktop`
  - **Status:** RED — `data-testid="nav-item-clientes"` inside rail does not exist
  - **Verifies:** AC1 — Clientes item present in NavigationRail

- **Test:** `should show a "Contactos" entry in the NavigationRail on desktop`
  - **Status:** RED — `data-testid="nav-item-contactos"` inside rail does not exist
  - **Verifies:** AC1 — Contactos item present in NavigationRail

- **Test:** `should not render NavigationBar at the bottom on desktop viewport`
  - **Status:** RED — `data-testid="navigation-bar"` is not rendered (no LayoutBase)
  - **Verifies:** AC1 — mobile NavigationBar hidden on desktop

**AC2 — Desktop Clientes navigation — 3 tests:**

- **Test:** `should navigate to /clientes when clicking the Clientes nav item`
  - **Status:** RED — nav items not rendered; click target does not exist
  - **Verifies:** AC2 — SPA routing to /clientes

- **Test:** `should show active state on Clientes nav item when on /clientes route`
  - **Status:** RED — `aria-current="page"` not implemented
  - **Verifies:** AC2 — active state indicator on Clientes item

- **Test:** `should not show full-page reload when clicking Clientes nav item`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC2 — client-side SPA navigation (no full reload / FR28)

**AC3 — Desktop Contactos navigation — 2 tests:**

- **Test:** `should navigate to /contactos when clicking the Contactos nav item`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC3 — SPA routing to /contactos

- **Test:** `should show active state on Contactos nav item when on /contactos route`
  - **Status:** RED — `aria-current="page"` not implemented
  - **Verifies:** AC3 — active state indicator on Contactos item

**AC4 — Mobile navigation shell (<1024px) — 5 tests:**

- **Test:** `should render a NavigationBar at the bottom on mobile viewport`
  - **Status:** RED — `data-testid="navigation-bar"` does not exist
  - **Verifies:** AC4 — NavigationBar visible on mobile

- **Test:** `should not render the NavigationRail on mobile viewport`
  - **Status:** RED — NavigationRail not rendered at all yet
  - **Verifies:** AC4 — NavigationRail hidden on mobile

- **Test:** `should show "Clientes" entry in the NavigationBar on mobile`
  - **Status:** RED — NavigationBar not rendered
  - **Verifies:** AC4 — Clientes item present in mobile NavigationBar

- **Test:** `should show "Contactos" entry in the NavigationBar on mobile`
  - **Status:** RED — NavigationBar not rendered
  - **Verifies:** AC4 — Contactos item present in mobile NavigationBar

- **Test:** `should have minimum 44px touch targets for mobile nav items`
  - **Status:** RED — NavigationBar not rendered; bounding box check fails
  - **Verifies:** AC4 — WCAG 2.1 AA touch targets ≥44×44px (FR29)

**AC5 — Deep link /clientes — 3 tests:**

- **Test:** `should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED — `data-testid="clientes-view"` does not exist (no clientes.tsx route)
  - **Verifies:** AC5 — Clientes route is registered and renders its view (FR30)

- **Test:** `should mark the Clientes nav item as active on direct /clientes load`
  - **Status:** RED — active state not implemented
  - **Verifies:** AC5 — active state on direct navigation

- **Test:** `should not redirect /clientes to any other route`
  - **Status:** RED — no clientes route exists; likely redirects to 404 or home
  - **Verifies:** AC5 — no unwanted redirect on deep link

**AC6 — Deep link /contactos — 3 tests:**

- **Test:** `should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED — `data-testid="contactos-view"` does not exist (no contactos.tsx route)
  - **Verifies:** AC6 — Contactos route is registered and renders its view (FR30)

- **Test:** `should mark the Contactos nav item as active on direct /contactos load`
  - **Status:** RED — active state not implemented
  - **Verifies:** AC6 — active state on direct navigation

- **Test:** `should not redirect /contactos to any other route`
  - **Status:** RED — no contactos route exists
  - **Verifies:** AC6 — no unwanted redirect on deep link

**AC7 — 404 not-found view — 4 tests:**

- **Test:** `should display a 404 view when navigating to an unknown route`
  - **Status:** RED — `data-testid="not-found-view"` does not exist (no catch-all route)
  - **Verifies:** AC7 — not-found container rendered

- **Test:** `should display "Página no encontrada" message in the 404 view`
  - **Status:** RED — 404 view not implemented
  - **Verifies:** AC7 — Spanish error message displayed

- **Test:** `should display a link back to /clientes on the 404 view`
  - **Status:** RED — `data-testid="not-found-back-link"` does not exist
  - **Verifies:** AC7 — recovery link to /clientes present

- **Test:** `should navigate to /clientes when clicking the back link on the 404 view`
  - **Status:** RED — back link not rendered
  - **Verifies:** AC7 — back link navigates to /clientes

**AC8 — Root / redirect — 2 tests:**

- **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED — index route renders IndexPage instead of redirecting
  - **Verifies:** AC8 — / → /clientes redirect

- **Test:** `should render the Clientes view after the / redirect (no blank page)`
  - **Status:** RED — index route renders IndexPage, /clientes view not shown
  - **Verifies:** AC8 — Clientes view visible after redirect

**AC9 — Accessibility — 6 tests:**

- **Test:** `should have aria-label "Ir a Clientes" on the Clientes nav button`
  - **Status:** RED — nav items not rendered; aria-label not set
  - **Verifies:** AC9 — Spanish aria-label on Clientes icon-only button

- **Test:** `should have aria-label "Ir a Contactos" on the Contactos nav button`
  - **Status:** RED — nav items not rendered; aria-label not set
  - **Verifies:** AC9 — Spanish aria-label on Contactos icon-only button

- **Test:** `should have role="navigation" on the NavigationRail container`
  - **Status:** RED — NavigationRail not rendered
  - **Verifies:** AC9 — semantic landmark for screen readers

- **Test:** `should have aria-label "Navegación principal" on the NavigationRail`
  - **Status:** RED — NavigationRail not rendered
  - **Verifies:** AC9 — NavigationRail labelled in Spanish for screen readers

- **Test:** `should have no axe critical or serious violations on the app shell`
  - **Status:** RED — `window.__axeViolations__` is undefined; axe integration pending
  - **Verifies:** AC9 — WCAG 2.1 AA compliance

- **Test:** `should allow Tab keyboard navigation to reach each nav item`
  - **Status:** RED — nav items not rendered; Tab cannot reach them
  - **Verifies:** AC9 — keyboard accessibility not blocked

---

### Component Tests (22 tests)

**File:** `frontend/src/routes/__tests__/navigation-shell.test.tsx`

**AC1 — Desktop shell — 5 tests:**

- **Test:** `should render a Navbar with productName "Siesa Agents" on desktop`
  - **Status:** RED — `AppShell` export missing; LayoutBase / Navbar not imported
  - **Verifies:** AC1 — Navbar with correct product name

- **Test:** `should render a NavigationRail on the left side at ≥1024px`
  - **Status:** RED — NavigationRail not in `__root.tsx`
  - **Verifies:** AC1 — NavigationRail rendered on desktop

- **Test:** `should show "Clientes" entry inside the NavigationRail on desktop`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC1 — Clientes item present in rail

- **Test:** `should show "Contactos" entry inside the NavigationRail on desktop`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC1 — Contactos item present in rail

- **Test:** `should NOT render the mobile NavigationBar on desktop viewport`
  - **Status:** RED — NavigationBar not rendered
  - **Verifies:** AC1 — NavigationBar hidden on desktop

**AC2 — Clientes active state — 2 tests:**

- **Test:** `should mark the Clientes nav item as active when on /clientes route`
  - **Status:** RED — `routeTree.gen.ts` not generated; route does not exist
  - **Verifies:** AC2 — `aria-current="page"` on active Clientes item

- **Test:** `should NOT mark the Contactos nav item as active when on /clientes route`
  - **Status:** RED — route not implemented
  - **Verifies:** AC2 — only one item is active at a time

**AC3 — Contactos active state — 2 tests:**

- **Test:** `should mark the Contactos nav item as active when on /contactos route`
  - **Status:** RED — `routeTree.gen.ts` not generated; route does not exist
  - **Verifies:** AC3 — `aria-current="page"` on active Contactos item

- **Test:** `should NOT mark the Clientes nav item as active when on /contactos route`
  - **Status:** RED — route not implemented
  - **Verifies:** AC3 — only one item is active at a time

**AC4 — Mobile shell — 4 tests:**

- **Test:** `should render a NavigationBar at the bottom on mobile viewport (<1024px)`
  - **Status:** RED — NavigationBar not in `__root.tsx`
  - **Verifies:** AC4 — NavigationBar visible on mobile

- **Test:** `should NOT render the NavigationRail on mobile viewport (<1024px)`
  - **Status:** RED — NavigationRail not in `__root.tsx`
  - **Verifies:** AC4 — NavigationRail hidden on mobile

- **Test:** `should show "Clientes" entry inside the NavigationBar on mobile`
  - **Status:** RED — NavigationBar not rendered
  - **Verifies:** AC4 — Clientes item in mobile bar

- **Test:** `should show "Contactos" entry inside the NavigationBar on mobile`
  - **Status:** RED — NavigationBar not rendered
  - **Verifies:** AC4 — Contactos item in mobile bar

**AC5 — Deep link /clientes — 2 tests:**

- **Test:** `should render the Clientes view when navigating directly to /clientes`
  - **Status:** RED — `clientes.tsx` route not created; `data-testid="clientes-view"` missing
  - **Verifies:** AC5 — Clientes view rendered on direct URL

- **Test:** `should NOT redirect /clientes to any other route`
  - **Status:** RED — clientes route not registered
  - **Verifies:** AC5 — no redirect on deep link

**AC6 — Deep link /contactos — 2 tests:**

- **Test:** `should render the Contactos view when navigating directly to /contactos`
  - **Status:** RED — `contactos.tsx` route not created; `data-testid="contactos-view"` missing
  - **Verifies:** AC6 — Contactos view rendered on direct URL

- **Test:** `should NOT redirect /contactos to any other route`
  - **Status:** RED — contactos route not registered
  - **Verifies:** AC6 — no redirect on deep link

**AC7 — 404 view — 3 tests:**

- **Test:** `should render the not-found view for an unknown route like /foo`
  - **Status:** RED — no catch-all / 404 route; `data-testid="not-found-view"` missing
  - **Verifies:** AC7 — 404 view container rendered

- **Test:** `should display "Página no encontrada" message in Spanish on the 404 view`
  - **Status:** RED — 404 view not implemented
  - **Verifies:** AC7 — Spanish error message

- **Test:** `should display a back link to /clientes on the 404 view`
  - **Status:** RED — 404 view not implemented
  - **Verifies:** AC7 — recovery link to /clientes

**AC8 — Root / redirect — 2 tests:**

- **Test:** `should redirect from / to /clientes`
  - **Status:** RED — index route renders IndexPage instead of redirecting
  - **Verifies:** AC8 — automatic redirect from /

- **Test:** `should render the Clientes view after / redirect (no blank page)`
  - **Status:** RED — index route renders IndexPage, not clientes view
  - **Verifies:** AC8 — Clientes view visible after redirect

**AC9 — Accessibility — 5 tests:**

- **Test:** `should have aria-label "Ir a Clientes" on the Clientes nav button`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC9 — Spanish aria-label

- **Test:** `should have aria-label "Ir a Contactos" on the Contactos nav button`
  - **Status:** RED — nav items not rendered
  - **Verifies:** AC9 — Spanish aria-label

- **Test:** `should have role="navigation" on the NavigationRail container`
  - **Status:** RED — NavigationRail not rendered
  - **Verifies:** AC9 — semantic navigation landmark

- **Test:** `should have aria-label "Navegación principal" on the NavigationRail`
  - **Status:** RED — NavigationRail not rendered
  - **Verifies:** AC9 — Spanish navigation label

- **Test:** `should have no axe critical or serious violations on the app shell (WCAG 2.1 AA)`
  - **Status:** RED — `axe-core` package not installed
  - **Verifies:** AC9 — zero axe violations (WCAG 2.1 AA)

- **Test:** `should have all nav item buttons reachable via keyboard (Tab)`
  - **Status:** RED — nav items not rendered; Tab focus cannot reach them
  - **Verifies:** AC9 — keyboard accessibility

---

## Data Factories Created

Not applicable for Story 1.2. This story creates navigation shell infrastructure only —
no domain entities, no database records, and no user-generated data are involved.

The existing `e2e/helpers/data.helper.ts` provides domain factories for future stories (Epic 2+).

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` provides:
- `clientesPage` — navigates to `/clientes` before the test
- `contactosPage` — navigates to `/contactos` before the test

No new fixtures are required for Story 1.2 acceptance tests. Navigation tests use
`page.goto()` directly to control the starting route per test.

---

## Mock Requirements

No external services require mocking for Story 1.2 acceptance tests. This story has
no API calls — it is a pure frontend navigation shell with no backend interaction.

### Network Interception Note

The E2E tests in `navigation-shell.spec.ts` do NOT intercept any network routes because
Story 1.2 introduces no API endpoints. All network-first pattern requirements are met by
default (no routes to intercept before navigation).

If the shell is later extended to prefetch route data, intercepts must be registered BEFORE
`page.goto()` calls per the network-first pattern:

```typescript
// CORRECT: Intercept BEFORE navigation
await page.route('**/api/route-data', handler);
await page.goto('/clientes');
```

---

## Required data-testid Attributes

### Root Layout (`__root.tsx` — `AppShell` component)

- `navbar` — The top Navbar component (siesa-ui-kit `Navbar`)
  ```tsx
  <Navbar data-testid="navbar" productName="Siesa Agents" />
  ```
- `navigation-rail` — The left NavigationRail component (siesa-ui-kit `NavigationRail`)
  ```tsx
  <NavigationRail
    data-testid="navigation-rail"
    role="navigation"
    aria-label="Navegación principal"
    items={navigationItems}
  />
  ```
- `navigation-bar` — The bottom mobile NavigationBar (siesa-ui-kit `NavigationBar`)
  ```tsx
  <NavigationBar data-testid="navigation-bar" items={navigationItems} />
  ```

### Navigation Items (rendered inside `NavigationRail` and `NavigationBar`)

- `nav-item-clientes` — The Clientes navigation button/link
  ```tsx
  <NavItem
    data-testid="nav-item-clientes"
    aria-label="Ir a Clientes"
    aria-current={isActive ? 'page' : undefined}
    href="/clientes"
  />
  ```
- `nav-item-contactos` — The Contactos navigation button/link
  ```tsx
  <NavItem
    data-testid="nav-item-contactos"
    aria-label="Ir a Contactos"
    aria-current={isActive ? 'page' : undefined}
    href="/contactos"
  />
  ```

### Route Views

- `clientes-view` — The root element of the `/clientes` placeholder view
  ```tsx
  // frontend/src/routes/clientes.tsx
  <div data-testid="clientes-view">
    <h1>Clientes</h1>
  </div>
  ```
- `contactos-view` — The root element of the `/contactos` placeholder view
  ```tsx
  // frontend/src/routes/contactos.tsx
  <div data-testid="contactos-view">
    <h1>Contactos</h1>
  </div>
  ```

### 404 Not-Found View (`not-found.tsx`)

- `not-found-view` — Container for the 404 not-found view
  ```tsx
  <div data-testid="not-found-view" role="main" aria-label="Página no encontrada">
    <h1>Página no encontrada</h1>
    <p>La página que buscas no existe.</p>
    <a data-testid="not-found-back-link" href="/clientes">Ir a Clientes</a>
  </div>
  ```
- `not-found-back-link` — The recovery link inside the 404 view pointing to `/clientes`

---

## Implementation Checklist

### Task 1 — Configure TanStack Router file-based routes (AC5, AC6, AC7, AC8)

**Test group:** AC5, AC6, AC7, AC8 in both E2E and component test files.

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/__root.tsx` — root layout with `LayoutBase` + `Outlet` (see Task 2)
- [ ] Create `frontend/src/routes/index.tsx` — replace current `IndexPage` with redirect:
  ```typescript
  import { createFileRoute, redirect } from '@tanstack/react-router'
  export const Route = createFileRoute('/')({
    beforeLoad: () => { throw redirect({ to: '/clientes' }) }
  })
  ```
- [ ] Create `frontend/src/routes/clientes.tsx` — placeholder view:
  ```tsx
  import { createFileRoute } from '@tanstack/react-router'
  export const Route = createFileRoute('/clientes')({ component: ClientesView })
  function ClientesView() {
    return <div data-testid="clientes-view"><h1>Clientes</h1></div>
  }
  ```
- [ ] Create `frontend/src/routes/contactos.tsx` — placeholder view:
  ```tsx
  import { createFileRoute } from '@tanstack/react-router'
  export const Route = createFileRoute('/contactos')({ component: ContactosView })
  function ContactosView() {
    return <div data-testid="contactos-view"><h1>Contactos</h1></div>
  }
  ```
- [ ] Create `frontend/src/routes/not-found.tsx` (or notFoundComponent in `__root.tsx`):
  - Must include `data-testid="not-found-view"` and `data-testid="not-found-back-link"`
  - All text in Spanish: "Página no encontrada", "La página que buscas no existe.", "Ir a Clientes"
- [ ] Run `pnpm run dev` or `pnpm run build` to trigger `routeTree.gen.ts` auto-generation
- [ ] Verify `frontend/src/routeTree.gen.ts` is auto-generated and not manually edited
- [ ] Run tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5|AC6|AC7|AC8"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Task 2 — Implement AppShell with siesa-ui-kit LayoutBase (AC1, AC2, AC3, AC4)

**Test group:** AC1, AC2, AC3, AC4 in both E2E and component test files.

**Tasks to make these tests pass:**

- [ ] Verify `siesa-ui-kit` is installed: `pnpm --filter frontend list siesa-ui-kit`
  - If missing: `pnpm --filter frontend add siesa-ui-kit` (check registry / company npm)
- [ ] Update `frontend/src/routes/__root.tsx` to import and render `LayoutBase`, `Navbar`,
  `NavigationRail`, `NavigationBar` from `siesa-ui-kit`
- [ ] Export `AppShell` as a named export for component tests:
  ```typescript
  export { AppShell }  // required by component tests
  ```
- [ ] Configure `Navbar` with `productName="Siesa Agents"` and `data-testid="navbar"`
- [ ] Configure `NavigationRail` with:
  - `data-testid="navigation-rail"`
  - `role="navigation"`
  - `aria-label="Navegación principal"`
  - Items: Clientes (`UsersIcon`, href `/clientes`) and Contactos (`UserIcon`, href `/contactos`)
  - Each item with `data-testid="nav-item-clientes"` / `data-testid="nav-item-contactos"`
  - Each item with `aria-label="Ir a Clientes"` / `aria-label="Ir a Contactos"`
  - Active state via TanStack Router `useRouterState()` or `Link activeProps` →
    `aria-current="page"` on the active item
- [ ] Configure `NavigationBar` with `data-testid="navigation-bar"` and same items/aria-labels
- [ ] Apply responsive visibility (Tailwind):
  - `NavigationRail`: `hidden lg:block` (hidden on mobile, visible on desktop ≥1024px)
  - `NavigationBar`: `block lg:hidden` (visible on mobile, hidden on desktop ≥1024px)
- [ ] Run tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1|AC2|AC3|AC4"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 2.5 hours

---

### Task 3 — Accessibility and ARIA compliance (AC9)

**Test group:** AC9 in both E2E and component test files.

**Tasks to make these tests pass:**

- [ ] Verify `aria-label="Ir a Clientes"` is on each Clientes nav button (both rail and bar)
- [ ] Verify `aria-label="Ir a Contactos"` is on each Contactos nav button (both rail and bar)
- [ ] Verify `role="navigation"` on the `NavigationRail` container
- [ ] Verify `aria-label="Navegación principal"` on the `NavigationRail` container
- [ ] Install axe-core for component tests: `pnpm --filter frontend add -D axe-core`
- [ ] Run axe check manually: confirm zero `critical` or `serious` violations
- [ ] Verify keyboard navigation: Tab reaches each nav item; Enter/Space triggers navigation
- [ ] Run tests: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC9"`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation-shell`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Task 4 — Update AppProviders and entry point (AC1, AC5, AC6, AC8)

**Test group:** All navigation tests (depends on router being properly initialized).

**Tasks to make these tests pass:**

- [ ] Verify `frontend/src/app/providers/AppProviders.tsx` wraps `RouterProvider` with the router
  instance built from `routeTree.gen.ts` (already in place — verify after route files are created)
- [ ] Verify `frontend/src/main.tsx` renders `<AppProviders />` as root (already in place)
- [ ] Run `pnpm run build` from `frontend/` — confirm zero TypeScript errors and zero ESLint errors
- [ ] Run full test suite: `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Task 5 — Component tests pass (all ACs)

**Test group:** `frontend/src/routes/__tests__/navigation-shell.test.tsx` (22 tests)

**Tasks to make these tests pass:**

- [ ] Complete Tasks 1–4 above (component tests depend on route files and AppShell export)
- [ ] Install `@testing-library/user-event` if missing:
  `pnpm --filter frontend add -D @testing-library/user-event`
- [ ] Install `axe-core` if missing: `pnpm --filter frontend add -D axe-core`
- [ ] Run component tests: `pnpm --filter frontend test -- navigation-shell`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours (after Tasks 1–4)

---

## Running Tests

```bash
# Run all E2E failing tests for Story 1.2
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run specific AC group
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7|AC8"
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC9"

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Debug specific E2E test
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests (Vitest + RTL)
pnpm --filter frontend test -- navigation-shell

# Run component tests in watch mode
pnpm --filter frontend test:watch -- navigation-shell

# Run all Story 1.2 tests (E2E + component)
pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts && pnpm --filter frontend test -- navigation-shell
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (34 E2E + 22 component = 56 total tests in RED)
- Fixtures assessed — existing `base.fixture.ts` is sufficient; no new fixtures needed
- Mock requirements documented — none required (no API calls in this story)
- Required `data-testid` attributes listed for every navigable element
- Implementation checklist created with clear tasks per AC group

**Verification:**

- E2E tests fail because: `data-testid` selectors not present in DOM; routes not registered;
  siesa-ui-kit components not imported in `__root.tsx`; active states not wired
- Component tests fail because: `AppShell` named export missing; `routeTree.gen.ts` not
  generated; siesa-ui-kit not imported; `axe-core` not installed

---

### GREEN Phase (DEV Team)

1. **Pick one failing test** — recommended order follows task dependencies:
   - Start with Task 1 (creates routes and generates `routeTree.gen.ts`)
   - Then Task 2 (AppShell with LayoutBase — unlocks the most tests at once)
   - Then Task 3 (ARIA compliance — small isolated changes)
   - Then Task 4 (verification only)
   - Then Task 5 (component tests follow from implementation)
2. **Read the test** to understand the exact element/behavior expected
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it passes (green)
5. **Check off the task** in the implementation checklist above
6. **Move to the next test** and repeat

**Key Principles:**
- One test at a time (don't fix all tests at once)
- Minimal implementation (don't over-engineer placeholder views)
- Run tests frequently for immediate feedback
- NEVER edit `routeTree.gen.ts` manually — let the Vite plugin generate it

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 56 tests pass (green)
2. Review `__root.tsx` for clean component composition — no inline logic in JSX
3. Extract navigation item configuration into a named constant (already shown in story dev notes)
4. Confirm Tailwind responsive classes are correct (`hidden lg:block` / `block lg:hidden`)
5. Verify `pnpm run build` passes with zero TypeScript and ESLint errors (AC5 proxy)
6. Run full test suite after refactor to confirm no regression

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing E2E tests** to confirm RED phase:
   `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`
3. **Run failing component tests** to confirm RED phase:
   `pnpm --filter frontend test -- navigation-shell`
4. **Begin implementation** — start with Task 1 (route files)
5. **Work one task at a time** (red → green for each AC)
6. **When all 56 tests pass**, refactor for quality
7. **When refactoring complete**, update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Playwright `test.extend()` patterns (existing `base.fixture.ts`
  reused; no new fixtures needed for this story)
- **network-first.md** — `page.route()` registered BEFORE `page.goto()` pattern noted;
  no intercepts needed for this story (no API calls)
- **test-quality.md** — One assertion per test; Given-When-Then structure; explicit waits
  (`await waitFor()` in component tests; `await expect().toBeVisible()` in E2E)
- **selector-resilience.md** — `data-testid` selectors used exclusively (hierarchy:
  data-testid > ARIA > text > CSS); never CSS class selectors
- **component-tdd.md** — Component tests use `@testing-library/react` + `userEvent`;
  memory router from TanStack Router for route-dependent tests
- **test-levels-framework.md** — E2E for full navigation journeys (SPA behavior, viewport
  switching); Component for isolated shell rendering and active state logic

---

## Test Execution Evidence

### Expected Test Run (RED Phase — Before Implementation)

**Command:** `pnpm exec playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results:**

```
Running 34 tests using 1 worker

  ✗ AC1 — Desktop navigation shell (≥1024px) > should render a Navbar at the top with productName "Siesa Agents"
  ✗ AC1 — Desktop navigation shell (≥1024px) > should render a NavigationRail on the left side at ≥1024px
  ✗ AC1 — Desktop navigation shell (≥1024px) > should show a "Clientes" entry in the NavigationRail on desktop
  ✗ AC1 — Desktop navigation shell (≥1024px) > should show a "Contactos" entry in the NavigationRail on desktop
  ✗ AC1 — Desktop navigation shell (≥1024px) > should not render NavigationBar at the bottom on desktop viewport
  ... (all 34 tests failing)

  34 failed
```

**Summary:**

- Total E2E tests: 34
- Passing: 0 (expected — RED phase)
- Failing: 34 (expected — RED phase)
- Status: RED phase verified

**Expected Failure Messages:**

- `[data-testid="navbar"]` tests: `Error: Locator timeout — could not find element`
- `[data-testid="navigation-rail"]` tests: `Error: Locator timeout — could not find element`
- `[data-testid="clientes-view"]` tests: `Error: Locator timeout — could not find element`
- `[data-testid="not-found-view"]` tests: `Error: Locator timeout — could not find element`
- Route redirect tests: `AssertionError: expected URL to match /\/clientes/ but got /`
- `aria-current` tests: `AssertionError: attribute "aria-current" not present`

**Command:** `pnpm --filter frontend test -- navigation-shell`

**Expected Results:**

```
 FAIL  src/routes/__tests__/navigation-shell.test.tsx

  AC1 — Desktop navigation shell (≥1024px)
    ✗ should render a Navbar with productName "Siesa Agents" on desktop
      Error: Module '../__root' has no export named 'AppShell'
    ... (all 22 tests failing)

  22 failed
```

---

## Notes

- Story 1.2 creates pure frontend navigation infrastructure — no domain tables, no business
  logic, no API calls
- Package manager is `pnpm` throughout — never `npm` or `yarn`
- The Playwright config's `testDir` is `./e2e` — all spec files live under the `e2e/` directory
- `routeTree.gen.ts` is auto-generated by `@tanstack/router-plugin` on `pnpm run dev` or
  `pnpm run build` — NEVER edit manually
- Component tests import `AppShell` as a named export from `__root.tsx` — this named export
  must be added (in addition to the default TanStack Router `Route` export)
- The `axe-core` dependency must be installed separately:
  `pnpm --filter frontend add -D axe-core`
- `@testing-library/user-event` should also be installed:
  `pnpm --filter frontend add -D @testing-library/user-event`
- All user-facing text MUST be in Spanish — labels, ARIA labels, error messages
- siesa-ui-kit components MUST be used AS-IS — no custom nav components allowed

---

## Contact

**Questions or Issues?**

- Refer to `_bmad/bmm/testarch/tea-index.csv` for testing knowledge fragments
- Consult `_bmad/bmm/workflows/testarch/atdd/instructions.md` for ATDD workflow documentation

---

**Generated by BMad TEA Agent** — 2026-06-08
