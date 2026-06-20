# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-20
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright) + Component (Vitest + RTL)

---

## Story Summary

Story 1.2 implements the persistent navigation shell that allows users to move between the Clientes and Contactos sections without full page reloads. The shell uses `siesa-ui-kit` components (`LayoutBase`, `Navbar`, `NavigationRail` on desktop, `NavigationBar` on mobile) wired to TanStack Router file-based routes.

**As a** user
**I want** a persistent navigation structure to access Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop layout: `LayoutBase` with `Navbar` (64px) and `NavigationRail` (72px, icon-only) showing "Clientes" and "Contactos" with Heroicons.
2. Clicking "Clientes" nav entry navigates to `/clientes` without full reload; item becomes visually active (`primary-50` bg, `primary-700` text). (FR28)
3. Clicking "Contactos" nav entry navigates to `/contactos` without full reload; item becomes visually active. (FR28)
4. Mobile viewport (< 1024px): `NavigationBar` replaces `NavigationRail`; all items have minimum 44px touch targets. (FR29)
5. Direct URL `/clientes` renders Clientes view correctly; NavigationRail highlights "Clientes" entry; no redirect. (FR30)
6. Direct URL `/contactos` renders Contactos view correctly; NavigationRail highlights "Contactos" entry. (FR30)
7. Unknown route (e.g. `/unknown-path`) shows 404 view with Spanish message and link back to `/clientes`.
8. Root path `/` redirects automatically to `/clientes`.
9. All navigation entries reachable and activatable via keyboard-only (Tab + Enter/Space). WCAG 2.1 AA.

---

## Failing Tests Created (RED Phase)

### E2E Tests (27 tests)

**File:** `e2e/story-1-2/navigation-shell.spec.ts`

**AC1 — Desktop navigation shell renders LayoutBase structure (5 tests)**

- RED **Test:** `should render the Navbar top bar on desktop`
  - **Status:** RED - Element `[data-testid="navbar"]` not found (routes do not exist yet)
  - **Verifies:** AC1 — Navbar is rendered in the LayoutBase shell on desktop

- RED **Test:** `should render NavigationRail on the left side on desktop`
  - **Status:** RED - Element `[data-testid="navigation-rail"]` not found
  - **Verifies:** AC1 — NavigationRail is visible on desktop viewport

- RED **Test:** `should display "Clientes" navigation entry in the NavigationRail`
  - **Status:** RED - Element `[data-testid="nav-item-clientes"]` not found
  - **Verifies:** AC1 — Clientes entry appears in NavigationRail

- RED **Test:** `should display "Contactos" navigation entry in the NavigationRail`
  - **Status:** RED - Element `[data-testid="nav-item-contactos"]` not found
  - **Verifies:** AC1 — Contactos entry appears in NavigationRail

- RED **Test:** `should render LayoutBase shell wrapping main content outlet`
  - **Status:** RED - Element `[data-testid="layout-content"]` not found
  - **Verifies:** AC1 — Content outlet area is rendered inside LayoutBase

**AC2 — Clicking "Clientes" navigates without full reload (2 tests)**

- RED **Test:** `should navigate to /clientes route when Clientes nav item is clicked`
  - **Status:** RED - Nav item not present; click has no effect
  - **Verifies:** AC2 — Click on Clientes nav item navigates to /clientes via SPA routing

- RED **Test:** `should apply active visual state to "Clientes" nav item when on /clientes`
  - **Status:** RED - Element missing; aria-current attribute not set
  - **Verifies:** AC2 — Active nav item gets aria-current="page"

**AC3 — Clicking "Contactos" navigates without full reload (2 tests)**

- RED **Test:** `should navigate to /contactos route when Contactos nav item is clicked`
  - **Status:** RED - Nav item not present
  - **Verifies:** AC3 — Click on Contactos nav item navigates to /contactos

- RED **Test:** `should apply active visual state to "Contactos" nav item when on /contactos`
  - **Status:** RED - aria-current attribute not set
  - **Verifies:** AC3 — Active nav item gets aria-current="page"

**AC4 — Mobile NavigationBar (6 tests)**

- RED **Test:** `should show NavigationBar on mobile viewport (< 1024px)`
  - **Status:** RED - Element `[data-testid="navigation-bar"]` not found
  - **Verifies:** AC4 — Mobile NavigationBar is shown at 375px viewport

- RED **Test:** `should NOT show NavigationRail on mobile viewport`
  - **Status:** RED - NavigationRail is not hidden on mobile
  - **Verifies:** AC4 — NavigationRail is hidden at mobile breakpoint

- RED **Test:** `should have "Clientes" nav item accessible on mobile NavigationBar`
  - **Status:** RED - NavigationBar missing
  - **Verifies:** AC4 — Clientes nav item is visible in mobile NavigationBar

- RED **Test:** `should have "Contactos" nav item accessible on mobile NavigationBar`
  - **Status:** RED - NavigationBar missing
  - **Verifies:** AC4 — Contactos nav item is visible in mobile NavigationBar

- RED **Test:** `should have minimum 44px touch target height for "Clientes" nav item on mobile`
  - **Status:** RED - Element missing; height cannot be measured
  - **Verifies:** AC4 — Clientes touch target ≥ 44px height

- RED **Test:** `should have minimum 44px touch target height for "Contactos" nav item on mobile`
  - **Status:** RED - Element missing; height cannot be measured
  - **Verifies:** AC4 — Contactos touch target ≥ 44px height

**AC5 — Deep linking to /clientes (3 tests)**

- RED **Test:** `should render the Clientes view when /clientes is typed directly in URL bar`
  - **Status:** RED - Element `[data-testid="clientes-view"]` not found
  - **Verifies:** AC5 — Clientes view renders on direct URL access

- RED **Test:** `should NOT redirect away from /clientes when accessed directly`
  - **Status:** RED - Route does not exist; page redirects or 404s
  - **Verifies:** AC5 — No unwanted redirect on deep link

- RED **Test:** `should highlight the "Clientes" NavigationRail entry when /clientes is accessed directly`
  - **Status:** RED - aria-current attribute not set
  - **Verifies:** AC5 — Active state on deep-linked route

**AC6 — Deep linking to /contactos (3 tests)**

- RED **Test:** `should render the Contactos view when /contactos is typed directly in URL bar`
  - **Status:** RED - Element `[data-testid="contactos-view"]` not found
  - **Verifies:** AC6 — Contactos view renders on direct URL access

- RED **Test:** `should NOT redirect away from /contactos when accessed directly`
  - **Status:** RED - Route does not exist
  - **Verifies:** AC6 — No unwanted redirect on deep link

- RED **Test:** `should highlight the "Contactos" NavigationRail entry when /contactos is accessed directly`
  - **Status:** RED - aria-current attribute not set
  - **Verifies:** AC6 — Active state on deep-linked route

**AC7 — 404 not-found page (4 tests)**

- RED **Test:** `should display the not-found view for an unknown route`
  - **Status:** RED - Element `[data-testid="not-found-view"]` not found
  - **Verifies:** AC7 — 404 view is shown for unknown routes

- RED **Test:** `should display "Página no encontrada" heading on the 404 view`
  - **Status:** RED - Heading text not found
  - **Verifies:** AC7 — Spanish 404 message displayed

- RED **Test:** `should display a link back to /clientes on the 404 page`
  - **Status:** RED - `[data-testid="not-found-back-link"]` not found
  - **Verifies:** AC7 — Back link to /clientes on 404 page

- RED **Test:** `should navigate to /clientes when the back link on the 404 page is clicked`
  - **Status:** RED - Link not present; click fails
  - **Verifies:** AC7 — Clicking back link navigates to /clientes

**AC8 — Root / redirect (2 tests)**

- RED **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED - Root route has no redirect configured
  - **Verifies:** AC8 — Root path redirects to /clientes

- RED **Test:** `should render the Clientes view after redirecting from /`
  - **Status:** RED - Route not implemented
  - **Verifies:** AC8 — Clientes view renders after redirect

**AC9 — Keyboard navigation (6 tests)**

- RED **Test:** `should make "Clientes" nav item focusable via keyboard Tab`
  - **Status:** RED - Nav item does not exist; focus fails
  - **Verifies:** AC9 — Clientes nav item is focusable

- RED **Test:** `should make "Contactos" nav item focusable via keyboard Tab`
  - **Status:** RED - Nav item does not exist; focus fails
  - **Verifies:** AC9 — Contactos nav item is focusable

- RED **Test:** `should navigate to /clientes when Enter key is pressed on the focused Clientes nav item`
  - **Status:** RED - Nav item not found; keyboard press has no effect
  - **Verifies:** AC9 — Enter key activates Clientes nav item

- RED **Test:** `should navigate to /contactos when Enter key is pressed on the focused Contactos nav item`
  - **Status:** RED - Nav item not found; keyboard press has no effect
  - **Verifies:** AC9 — Enter key activates Contactos nav item

- RED **Test:** `should have an accessible aria-label on the "Clientes" nav icon button`
  - **Status:** RED - Nav item missing; aria-label not set
  - **Verifies:** AC9 — aria-label="Clientes" present on icon-only nav item

- RED **Test:** `should have an accessible aria-label on the "Contactos" nav icon button`
  - **Status:** RED - Nav item missing; aria-label not set
  - **Verifies:** AC9 — aria-label="Contactos" present on icon-only nav item

---

### Component Tests (12 tests)

**File:** `e2e/component/story-1-2/NavigationShell.component.test.tsx`

**AC1 — LayoutBase shell structure (5 tests)**

- RED **Test:** `should render the Navbar element within the root layout`
  - **Status:** RED - `routeTree.gen.ts` does not exist; import fails
  - **Verifies:** AC1 — Navbar rendered in root layout

- RED **Test:** `should render the NavigationRail on the root layout`
  - **Status:** RED - routeTree missing
  - **Verifies:** AC1 — NavigationRail rendered

- RED **Test:** `should render a nav item with label "Clientes" in the NavigationRail`
  - **Status:** RED - routeTree missing
  - **Verifies:** AC1 — Clientes nav item rendered

- RED **Test:** `should render a nav item with label "Contactos" in the NavigationRail`
  - **Status:** RED - routeTree missing
  - **Verifies:** AC1 — Contactos nav item rendered

- RED **Test:** `should render the layout content outlet area`
  - **Status:** RED - routeTree missing
  - **Verifies:** AC1 — Content outlet rendered

**AC2/AC3 — Nav link href values (2 tests)**

- RED **Test:** `should render the Clientes nav item linking to /clientes`
  - **Status:** RED - Route tree missing; href cannot be verified
  - **Verifies:** AC2 — Clientes nav item href="/clientes"

- RED **Test:** `should render the Contactos nav item linking to /contactos`
  - **Status:** RED - Route tree missing; href cannot be verified
  - **Verifies:** AC3 — Contactos nav item href="/contactos"

**AC7 — 404 not-found page (3 tests)**

- RED **Test:** `should display "Página no encontrada" heading when route does not exist`
  - **Status:** RED - notFoundComponent not implemented
  - **Verifies:** AC7 — Spanish 404 heading rendered

- RED **Test:** `should display the not-found view container for an unknown route`
  - **Status:** RED - notFoundComponent not implemented
  - **Verifies:** AC7 — not-found-view container rendered

- RED **Test:** `should display a link back to /clientes on the 404 page`
  - **Status:** RED - notFoundComponent not implemented
  - **Verifies:** AC7 — Back link to /clientes on 404

**AC8 — Root redirect (1 test)**

- RED **Test:** `should redirect from / to /clientes so the Clientes view renders`
  - **Status:** RED - Index route redirect not configured
  - **Verifies:** AC8 — Router state location is /clientes after loading /

**AC9 — Accessibility aria-labels (2 tests)**

- RED **Test:** `should have aria-label="Clientes" on the Clientes nav icon item`
  - **Status:** RED - Nav items not rendered
  - **Verifies:** AC9 — aria-label="Clientes" present

- RED **Test:** `should have aria-label="Contactos" on the Contactos nav icon item`
  - **Status:** RED - Nav items not rendered
  - **Verifies:** AC9 — aria-label="Contactos" present

---

## Data Factories Created

### Navigation Factory

**File:** `e2e/support/factories/navigation.factory.ts`

**Exports:**

- `createClientesNavItem(overrides?)` — Create Clientes NavItem descriptor with optional overrides
- `createContactosNavItem(overrides?)` — Create Contactos NavItem descriptor with optional overrides
- `createAllNavItems()` — Create full array of all nav items in display order
- `APP_ROUTES` — Typed route constants (`/`, `/clientes`, `/contactos`, unknown)
- `SHELL_TEST_IDS` — Typed constants for all required `data-testid` attributes
- `DESKTOP_VIEWPORT` — `{ width: 1280, height: 800 }` for Playwright viewport config
- `MOBILE_VIEWPORT` — `{ width: 375, height: 812 }` for Playwright viewport config
- `MIN_TOUCH_TARGET_PX` — `44` — minimum touch target size per WCAG 2.1 AA and AC4

---

## Fixtures Created

### Base Fixture (Existing — Story 1.1)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test; reusable as setup for AC2/AC5 tests
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page ready at /clientes
  - **Cleanup:** None required (navigation state)

- `contactosPage` — Navigates to `/contactos` before the test; reusable for AC3/AC6 tests
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page ready at /contactos
  - **Cleanup:** None required

No new fixture file is required for Story 1.2 — the base fixture covers all navigation setup needs.

---

## Mock Requirements

Story 1.2 has no backend API calls — all routes are purely frontend (placeholder views for /clientes and /contactos). No network mocking is required.

### Mock Requirement: None

This story covers the navigation shell only. The placeholder Clientes and Contactos views do not make API calls. Network-first interception is not required for these tests.

**Note for DEV team:** When Epic 2 and Epic 3 implement real API-backed views, network mocking will be required. The factory infrastructure in `e2e/support/factories/` is already in place.

---

## Required data-testid Attributes

### Root Layout (`frontend/src/routes/__root.tsx`)

- `navbar` — The Navbar top bar component from siesa-ui-kit
- `navigation-rail` — The NavigationRail left sidebar (desktop only, hidden on mobile)
- `navigation-bar` — The NavigationBar bottom bar (mobile only, hidden on desktop)
- `layout-content` — The main content area / Outlet wrapper inside LayoutBase

### Navigation Items (shared across desktop and mobile)

- `nav-item-clientes` — The Clientes navigation entry element. Must also have `aria-label="Clientes"` and `aria-current="page"` when active
- `nav-item-contactos` — The Contactos navigation entry element. Must also have `aria-label="Contactos"` and `aria-current="page"` when active

### Route Views

- `clientes-view` — Wrapper element rendered by `frontend/src/routes/_app/clientes.tsx` (placeholder `<div>`)
- `contactos-view` — Wrapper element rendered by `frontend/src/routes/_app/contactos.tsx` (placeholder `<div>`)

### 404 Not-Found Page

- `not-found-view` — Container of the not-found page component
- `not-found-heading` — The `<h1>` element containing "Página no encontrada"
- `not-found-back-link` — The `<Link>` element with `href="/clientes"` and text "Volver a Clientes"

**Implementation Examples:**

```tsx
// __root.tsx — LayoutBase with testids
<div data-testid="layout-content">
  <Outlet />
</div>

// Nav item (NavigationRail or NavigationBar item)
<Link
  to="/clientes"
  data-testid="nav-item-clientes"
  aria-label="Clientes"
  aria-current={isActive ? 'page' : undefined}
>
  <UsersIcon className="w-6 h-6" />
</Link>

// clientes.tsx placeholder
<div data-testid="clientes-view">Clientes</div>

// contactos.tsx placeholder
<div data-testid="contactos-view">Contactos</div>

// Not-found component
<div data-testid="not-found-view">
  <h1 data-testid="not-found-heading">Página no encontrada</h1>
  <p>La ruta solicitada no existe.</p>
  <Link to="/clientes" data-testid="not-found-back-link">Volver a Clientes</Link>
</div>
```

---

## Implementation Checklist

### Test: AC1 — Desktop LayoutBase shell

**Files:** `e2e/story-1-2/navigation-shell.spec.ts` (5 tests), `e2e/component/story-1-2/NavigationShell.component.test.tsx` (5 tests)

**Tasks to make these tests pass:**

- [ ] Verify `siesa-ui-kit` is installed in `frontend/package.json` (Story 1.1)
- [ ] Create `frontend/src/routes/__root.tsx` with `createRootRoute` and `RootLayout` component
- [ ] Import `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar` from `siesa-ui-kit`
- [ ] Import `UsersIcon`, `UserIcon` from `@heroicons/react/24/outline`
- [ ] Render `<LayoutBase>` with `navbar` and `navigationRail` props
- [ ] Add `data-testid="navbar"` to the Navbar component or its wrapper
- [ ] Add `data-testid="navigation-rail"` to the NavigationRail wrapper (desktop, hidden on mobile via `lg:`)
- [ ] Add `data-testid="navigation-bar"` to the NavigationBar wrapper (mobile, hidden on desktop via `lg:hidden`)
- [ ] Add `data-testid="layout-content"` to the content area wrapping `<Outlet />`
- [ ] Add `data-testid="nav-item-clientes"` with `aria-label="Clientes"` to the Clientes nav item
- [ ] Add `data-testid="nav-item-contactos"` with `aria-label="Contactos"` to the Contactos nav item
- [ ] Run E2E: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --grep "AC1"`
- [ ] Run Component: `pnpm run test e2e/component/story-1-2/NavigationShell.component.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 & AC3 — Navigation clicks and active state

**File:** `e2e/story-1-2/navigation-shell.spec.ts` (4 tests), `e2e/component/story-1-2/NavigationShell.component.test.tsx` (2 tests)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — placeholder Clientes view with `data-testid="clientes-view"`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — placeholder Contactos view with `data-testid="contactos-view"`
- [ ] Wire nav items using TanStack Router `<Link>` component with `activeProps` for active state
- [ ] Set `aria-current="page"` on the active nav item using TanStack Router `useMatchRoute` or `activeProps`
- [ ] Verify TanStack Router plugin generates `routeTree.gen.ts` on save
- [ ] Confirm SPA navigation (no full page reload) by monitoring navigation events
- [ ] Run: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --grep "AC2|AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC4 — Mobile NavigationBar and 44px touch targets

**File:** `e2e/story-1-2/navigation-shell.spec.ts` (6 tests)

**Tasks to make these tests pass:**

- [ ] Configure responsive breakpoint: show `NavigationRail` only on `lg:` (≥ 1024px), `NavigationBar` on mobile (default)
- [ ] Add `data-testid="navigation-rail"` to the desktop-only NavigationRail wrapper
- [ ] Add `data-testid="navigation-bar"` to the mobile-only NavigationBar wrapper
- [ ] Ensure nav items in `NavigationBar` have minimum 44px height (CSS: `min-h-[44px]` or equivalent)
- [ ] Verify `NavigationBar` includes both "Clientes" and "Contactos" entries with `data-testid` attributes
- [ ] Run: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --grep "AC4" --project mobile-chrome`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 & AC6 — Deep linking

**File:** `e2e/story-1-2/navigation-shell.spec.ts` (6 tests)

**Tasks to make these tests pass:**

- [ ] Verify `_app/clientes.tsx` and `_app/contactos.tsx` are registered in route tree (from AC2/AC3 tasks above)
- [ ] Confirm TanStack Router does not redirect on direct URL access to valid routes
- [ ] Verify `aria-current="page"` is set correctly based on current URL match (not just click)
- [ ] Run: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --grep "AC5|AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC7 — 404 not-found page

**File:** `e2e/story-1-2/navigation-shell.spec.ts` (4 tests), `e2e/component/story-1-2/NavigationShell.component.test.tsx` (3 tests)

**Tasks to make these tests pass:**

- [ ] Create `NotFoundPage` component (inline in `__root.tsx` as `notFoundComponent` prop, or as `frontend/src/routes/notFound.tsx`)
- [ ] Add `data-testid="not-found-view"` to the container div
- [ ] Add `<h1 data-testid="not-found-heading">Página no encontrada</h1>`
- [ ] Add `<p>La ruta solicitada no existe.</p>`
- [ ] Add `<Link to="/clientes" data-testid="not-found-back-link">Volver a Clientes</Link>`
- [ ] Wire `notFoundComponent` on `createRootRoute` or configure TanStack Router's 404 handling
- [ ] Run: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --grep "AC7"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC8 — Root redirect

**File:** `e2e/story-1-2/navigation-shell.spec.ts` (2 tests), `e2e/component/story-1-2/NavigationShell.component.test.tsx` (1 test)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/index.tsx` with `createFileRoute('/')` and `beforeLoad` redirect to `/clientes`
- [ ] Verify redirect uses `throw redirect({ to: '/clientes' })` (TanStack Router pattern)
- [ ] Confirm `routeTree.gen.ts` includes the index route
- [ ] Run: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --grep "AC8"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC9 — Keyboard navigation and WCAG 2.1 AA

**File:** `e2e/story-1-2/navigation-shell.spec.ts` (6 tests), `e2e/component/story-1-2/NavigationShell.component.test.tsx` (2 tests)

**Tasks to make these tests pass:**

- [ ] Ensure all nav items are rendered as `<a>` or `<button>` elements (natively focusable)
- [ ] Verify `aria-label="Clientes"` is set on the Clientes nav item (icon-only accessibility)
- [ ] Verify `aria-label="Contactos"` is set on the Contactos nav item
- [ ] Verify focus ring style: `2px solid #0e79fd` (`primary-600`) on all interactive nav elements
- [ ] Test Tab key focus order: nav items should be reachable without mouse
- [ ] Test Enter key activation: nav items should activate on Enter keypress
- [ ] Run: `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --grep "AC9"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E failing tests for Story 1.2
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts

# Run Story 1.2 E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --headed

# Run Story 1.2 E2E tests for a specific AC
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --grep "AC4"

# Run mobile-specific tests only
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --project mobile-chrome

# Run component tests (Vitest + RTL)
pnpm --filter frontend run test e2e/component/story-1-2/NavigationShell.component.test.tsx

# Run component tests in watch mode
pnpm --filter frontend run test -- --watch

# Debug specific E2E test
pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts --debug

# Run all tests (E2E + component)
pnpm exec playwright test && pnpm --filter frontend run test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 27 E2E tests written and failing (routes do not exist)
- All 12 component tests written and failing (routeTree.gen.ts does not exist)
- Navigation factory created (`navigation.factory.ts`)
- Mock requirements documented (none required for this story)
- data-testid requirements listed (11 attributes across 4 components)
- Implementation checklist created with 6 test groups

**Verification:**

- E2E tests fail because `/clientes`, `/contactos` routes do not exist yet
- Component tests fail because `routeTree.gen.ts` is not generated yet
- All failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test group** from implementation checklist (start with AC1 — LayoutBase shell)
2. **Read the test** to understand expected behavior and required data-testid attributes
3. **Implement minimal code** to make that specific test group pass:
   - Create `__root.tsx` with LayoutBase, Navbar, NavigationRail
   - Add the required data-testid attributes exactly as documented
4. **Run tests** to verify they pass (green)
5. **Check off tasks** in implementation checklist
6. **Move to next AC group** and repeat

**Key Principles:**

- One AC group at a time
- Minimal implementation (placeholder views are sufficient — real views come in Epics 2/3)
- Run `routeTree.gen.ts` generation by saving route files (TanStack Router plugin auto-runs)
- Never use `any` TypeScript types

**Progress Tracking:**

- Check off tasks as you complete them
- Mark story as IN PROGRESS in sprint-status.yaml

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 39 tests pass** (27 E2E + 12 component)
2. **Review accessibility**: ensure focus rings visible, aria-labels correct, keyboard nav fluid
3. **Review responsive behavior**: NavigationRail/NavigationBar breakpoint at `lg:` (1024px)
4. **Code quality**: no duplicated nav item definitions, consistent typing
5. **Run full test suite** after each refactor to confirm nothing regresses
6. **Update story status** to 'done' in sprint-status.yaml when complete

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm exec playwright test e2e/story-1-2/`
3. **Begin with Task 1** — Create `__root.tsx` with LayoutBase and data-testid attributes
4. **Work one AC group at a time** (red → green per AC)
5. **When all 39 tests pass**, refactor for accessibility and code quality
6. **When complete**, update story 1-2 status to 'done'

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Reused existing `base.fixture.ts` from Story 1.1; no new fixture file needed
- **data-factories.md** — `navigation.factory.ts` created with typed nav item descriptors and route constants
- **component-tdd.md** — Component tests use TanStack Router `createMemoryHistory` for isolation
- **network-first.md** — No network calls in this story; pattern documented for future epics
- **test-quality.md** — One assertion per test; Given-When-Then throughout; no hard waits; explicit locators
- **selector-resilience.md** — All selectors use `data-testid`; zero CSS class selectors
- **test-levels-framework.md** — E2E for navigation flows; Component for rendering/routing isolation

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/story-1-2/navigation-shell.spec.ts`

**Expected Results:**

```
Running 27 tests using 4 workers

  × AC1 — Desktop navigation shell renders LayoutBase structure > should render the Navbar top bar on desktop
    Error: locator.toBeVisible: Error: strict mode violation: getByTestId('navbar') resolved to 0 elements

  × AC1 — Desktop navigation shell renders LayoutBase structure > should render NavigationRail on the left side on desktop
    Error: locator.toBeVisible: Error: strict mode violation: getByTestId('navigation-rail') resolved to 0 elements

  ... (27 total failures)

  27 failed
  0 passed
```

**Summary:**

- Total tests: 39 (27 E2E + 12 component)
- Passing: 0 (expected — RED phase)
- Failing: 39 (expected — missing implementation)
- Status: RED phase verified

**Expected Failure Messages for Each Group:**

- AC1 tests: `getByTestId('navbar') resolved to 0 elements` — routes not implemented
- AC2/AC3 tests: `getByTestId('nav-item-clientes') resolved to 0 elements` — nav items not rendered
- AC4 tests: `getByTestId('navigation-bar') resolved to 0 elements` — mobile component missing
- AC5/AC6 tests: `page.goto('/clientes')` succeeds but `getByTestId('clientes-view')` fails — placeholder view missing
- AC7 tests: `getByTestId('not-found-view') resolved to 0 elements` — 404 component not implemented
- AC8 tests: URL remains `/` after load — redirect not configured
- AC9 tests: `Focus failed: getByTestId('nav-item-clientes')` — nav items not in DOM

---

## Notes

- Story 1.2 is **purely frontend** — no backend changes required
- Placeholder views (`<div data-testid="clientes-view">Clientes</div>`) are sufficient for all tests to pass; full implementation comes in Epics 2 and 3
- The `routeTree.gen.ts` file is auto-generated by the TanStack Router Vite plugin on first save — do NOT create it manually
- `pnpm` is the mandatory package manager — never use `npm` or `yarn`
- All user-facing text must be in Spanish: "Clientes", "Contactos", "Página no encontrada", "Volver a Clientes"
- The `siesa-ui-kit` `LayoutBase` component may wrap the Navbar/NavigationRail internally — verify the actual rendered DOM to confirm `data-testid` placement
- If `siesa-ui-kit` does not forward `data-testid` props to the DOM, use wrapper `<div>` elements with the testids around the kit components

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-20
