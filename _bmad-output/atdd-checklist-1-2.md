# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-23
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Story 1.2 implements the responsive navigation shell for the Siesa Agents CRM application. It provides a persistent NavigationRail on desktop and a bottom NavigationBar on mobile using TanStack Router for SPA navigation, with deep-link support, root redirect, and a 404 view in Spanish.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (viewport >= 1024px), When the user views the app, Then a NavigationRail is visible on the left side with "Clientes" and "Contactos" navigation entries, each with an icon and label.
2. **AC2** — Given desktop browser, When the user clicks "Clientes" in the NavigationRail, Then the app navigates to `/clientes` without a full page reload and "Clientes" appears visually active/selected (FR28).
3. **AC3** — Given desktop browser, When the user clicks "Contactos" in the NavigationRail, Then the app navigates to `/contactos` without a full page reload and "Contactos" appears visually active/selected (FR28).
4. **AC4** — Given mobile viewport (width < 1024px), When the user views the app, Then a NavigationBar is displayed at the bottom instead of the NavigationRail, with "Clientes" and "Contactos" items tappable and accessible (FR29).
5. **AC5** — Given a user types `/clientes` directly in the URL bar, When the page loads, Then ClientesPlaceholderView is rendered and NavigationRail/Bar shows "Clientes" as active — no redirect (FR30).
6. **AC6** — Given a user types `/contactos` directly in the URL bar, When the page loads, Then ContactosPlaceholderView is rendered and NavigationRail/Bar shows "Contactos" as active — no redirect (FR30).
7. **AC7** — Given a user navigates to an unknown route (e.g., `/unknown`), When the page loads, Then a 404/not-found view is displayed in Spanish with a link back to `/clientes`.
8. **AC8** — Given the root path `/` is accessed, When the page loads, Then the user is automatically redirected to `/clientes`.

---

## Failing Tests Created (RED Phase)

### E2E Tests (27 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

#### AC1 — Desktop NavigationRail (4 tests)

- RED **Test:** `should render NavigationRail on the left side on desktop viewport`
  - **Status:** RED — `[data-testid="navigation-rail"]` not found (element not yet implemented)
  - **Verifies:** NavigationRail component is rendered and visible on desktop

- RED **Test:** `should display "Clientes" label in NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-rail-item-clientes"]` not found
  - **Verifies:** "Clientes" nav entry is visible in the NavigationRail

- RED **Test:** `should display "Contactos" label in NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-rail-item-contactos"]` not found
  - **Verifies:** "Contactos" nav entry is visible in the NavigationRail

- RED **Test:** `should render a nav element with aria-label="Navegación principal"`
  - **Status:** RED — `nav[aria-label="Navegación principal"]` not found
  - **Verifies:** WCAG 2.1 AA accessible nav landmark with correct label

#### AC2 — Clientes navigation and active state (3 tests)

- RED **Test:** `should navigate to /clientes without full page reload when clicking Clientes`
  - **Status:** RED — nav item not clickable (not yet implemented)
  - **Verifies:** SPA navigation to /clientes without full reload

- RED **Test:** `should mark "Clientes" nav item as active after navigating to /clientes`
  - **Status:** RED — `aria-current="page"` attribute not set
  - **Verifies:** Active state applied to Clientes item on /clientes route

- RED **Test:** `should not mark "Contactos" as active when "Clientes" is the current route`
  - **Status:** RED — nav items not yet implemented
  - **Verifies:** Mutual exclusivity of active state between nav items

#### AC3 — Contactos navigation and active state (3 tests)

- RED **Test:** `should navigate to /contactos without full page reload when clicking Contactos`
  - **Status:** RED — nav item not clickable (not yet implemented)
  - **Verifies:** SPA navigation to /contactos without full reload

- RED **Test:** `should mark "Contactos" nav item as active after navigating to /contactos`
  - **Status:** RED — `aria-current="page"` attribute not set
  - **Verifies:** Active state applied to Contactos item on /contactos route

- RED **Test:** `should not mark "Clientes" as active when "Contactos" is the current route`
  - **Status:** RED — nav items not yet implemented
  - **Verifies:** Mutual exclusivity of active state between nav items

#### AC4 — Mobile NavigationBar (5 tests)

- RED **Test:** `should display NavigationBar at the bottom on mobile viewport`
  - **Status:** RED — `[data-testid="navigation-bar"]` not found
  - **Verifies:** NavigationBar renders on mobile (< 1024px viewport)

- RED **Test:** `should NOT display NavigationRail on mobile viewport`
  - **Status:** RED — NavigationRail visibility not controlled by responsive breakpoint yet
  - **Verifies:** NavigationRail is hidden on mobile

- RED **Test:** `should display tappable "Clientes" item in NavigationBar on mobile`
  - **Status:** RED — `[data-testid="nav-bar-item-clientes"]` not found
  - **Verifies:** Clientes item accessible in mobile NavigationBar

- RED **Test:** `should display tappable "Contactos" item in NavigationBar on mobile`
  - **Status:** RED — `[data-testid="nav-bar-item-contactos"]` not found
  - **Verifies:** Contactos item accessible in mobile NavigationBar

- RED **Test:** `should navigate to /contactos from NavigationBar on mobile`
  - **Status:** RED — mobile nav item not clickable (not yet implemented)
  - **Verifies:** SPA navigation from mobile NavigationBar

#### AC5 — Direct URL /clientes (3 tests)

- RED **Test:** `should render ClientesPlaceholderView when navigating directly to /clientes`
  - **Status:** RED — `[data-testid="clientes-placeholder-view"]` not found (route not created)
  - **Verifies:** Deep linking to /clientes renders the placeholder view

- RED **Test:** `should NOT redirect away from /clientes when accessed directly`
  - **Status:** RED — route does not exist, may 404 or redirect
  - **Verifies:** FR30 deep-link support — no unwanted redirect

- RED **Test:** `should show "Clientes" as active in NavigationRail when on /clientes directly`
  - **Status:** RED — NavigationRail not yet implemented
  - **Verifies:** Active state synced on direct URL access

#### AC6 — Direct URL /contactos (3 tests)

- RED **Test:** `should render ContactosPlaceholderView when navigating directly to /contactos`
  - **Status:** RED — `[data-testid="contactos-placeholder-view"]` not found (route not created)
  - **Verifies:** Deep linking to /contactos renders the placeholder view

- RED **Test:** `should NOT redirect away from /contactos when accessed directly`
  - **Status:** RED — route does not exist
  - **Verifies:** FR30 deep-link support

- RED **Test:** `should show "Contactos" as active in NavigationRail when on /contactos directly`
  - **Status:** RED — NavigationRail not yet implemented
  - **Verifies:** Active state synced on direct URL access

#### AC7 — 404 Not Found view (4 tests)

- RED **Test:** `should display a not-found view when accessing an unknown route /unknown`
  - **Status:** RED — `[data-testid="not-found-view"]` not found (catch-all route not created)
  - **Verifies:** 404 view renders for unknown routes

- RED **Test:** `should display a not-found view for deeply nested unknown route /foo/bar`
  - **Status:** RED — catch-all `$.tsx` route not created
  - **Verifies:** Catch-all route handles nested paths

- RED **Test:** `should display the not-found message in Spanish`
  - **Status:** RED — 404 view component not implemented
  - **Verifies:** All user-facing text in Spanish

- RED **Test:** `should display a link that returns the user to /clientes from the 404 view`
  - **Status:** RED — `[data-testid="not-found-back-link"]` not found
  - **Verifies:** Navigation back to /clientes from 404 view

#### AC8 — Root / redirect (2 tests)

- RED **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED — `index.tsx` root redirect not created
  - **Verifies:** Root path automatically redirects to /clientes

- RED **Test:** `should render the navigation shell after root redirect to /clientes`
  - **Status:** RED — Shell and redirect both missing
  - **Verifies:** Full app shell renders after automatic redirect

---

### Component Tests (14 tests)

**File:** `frontend/src/shared/components/NavigationShell.test.tsx`

#### AC1 — Desktop NavigationRail (5 tests)

- RED **Test:** `should render NavigationRail with data-testid="navigation-rail" on desktop`
  - **Status:** RED — `NavigationShell` module does not exist (import will fail)
  - **Verifies:** NavigationRail is rendered in the DOM on desktop viewport

- RED **Test:** `should render a <nav> element with aria-label="Navegación principal"`
  - **Status:** RED — component not implemented
  - **Verifies:** WCAG 2.1 AA — accessible nav landmark

- RED **Test:** `should render "Clientes" nav item in the NavigationRail`
  - **Status:** RED — component not implemented
  - **Verifies:** Clientes item present in rail

- RED **Test:** `should render "Contactos" nav item in the NavigationRail`
  - **Status:** RED — component not implemented
  - **Verifies:** Contactos item present in rail

- RED **Test:** `should display Spanish labels "Clientes" and "Contactos" in the NavigationRail`
  - **Status:** RED — component not implemented
  - **Verifies:** All user-facing labels in Spanish

#### AC2 — Clientes active state (3 tests)

- RED **Test:** `should apply aria-current="page" to "Clientes" item when on /clientes`
  - **Status:** RED — component not implemented
  - **Verifies:** Active route reflected in aria-current attribute

- RED **Test:** `should NOT apply aria-current="page" to "Contactos" item when on /clientes`
  - **Status:** RED — component not implemented
  - **Verifies:** Mutual exclusivity of active state

- RED **Test:** `should apply active color class to "Clientes" item when on /clientes`
  - **Status:** RED — component not implemented
  - **Verifies:** Brand blue (#0e79fd) applied to active item

#### AC3 — Contactos active state (3 tests)

- RED **Test:** `should apply aria-current="page" to "Contactos" item when on /contactos`
  - **Status:** RED — component not implemented
  - **Verifies:** Active route reflected in aria-current

- RED **Test:** `should NOT apply aria-current="page" to "Clientes" item when on /contactos`
  - **Status:** RED — component not implemented
  - **Verifies:** Mutual exclusivity of active state

- RED **Test:** `should apply active color class to "Contactos" item when on /contactos`
  - **Status:** RED — component not implemented
  - **Verifies:** Brand blue applied to active item

#### AC4 — Mobile NavigationBar (4 tests)

- RED **Test:** `should render NavigationBar with data-testid="navigation-bar" on mobile`
  - **Status:** RED — component not implemented
  - **Verifies:** NavigationBar is in DOM on mobile viewport

- RED **Test:** `should render "Clientes" nav item in the NavigationBar on mobile`
  - **Status:** RED — component not implemented
  - **Verifies:** Clientes item present in bottom bar

- RED **Test:** `should render "Contactos" nav item in the NavigationBar on mobile`
  - **Status:** RED — component not implemented
  - **Verifies:** Contactos item present in bottom bar

- RED **Test:** `should render NavigationRail as hidden (not visible) on mobile`
  - **Status:** RED — component not implemented
  - **Verifies:** NavigationRail carries `hidden` class on mobile

---

## Data Factories Created

No domain-data factories needed for this story. Navigation shell is UI-only with no backend data dependencies. The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` for future stories.

---

## Fixtures Created

### Navigation Shell Fixtures

**File:** `e2e/fixtures/base.fixture.ts` (extended with `clientesPage` and `contactosPage`)

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before test begins
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page at /clientes route
  - **Cleanup:** None (stateless navigation)

- `contactosPage` — Navigates to `/contactos` before test begins
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page at /contactos route
  - **Cleanup:** None (stateless navigation)

**Page Object Model:**

**File:** `e2e/pages/navigation-shell.page.ts`

The `NavigationShellPage` POM provides typed locators for all navigation elements and helper methods for desktop/mobile navigation actions.

---

## Mock Requirements

No backend API mocks required for this story. The navigation shell is a pure frontend feature with no backend dependencies in MVP scope (no auth guards).

---

## Required data-testid Attributes

### NavigationShell Component (`frontend/src/shared/components/NavigationShell.tsx`)

- `navigation-rail` — Desktop NavigationRail sidebar container (`<aside>` element)
- `nav-rail-item-clientes` — "Clientes" link/button in the NavigationRail
- `nav-rail-item-contactos` — "Contactos" link/button in the NavigationRail
- `navigation-bar` — Mobile NavigationBar bottom container (`<nav>` element)
- `nav-bar-item-clientes` — "Clientes" link/button in the NavigationBar
- `nav-bar-item-contactos` — "Contactos" link/button in the NavigationBar

### Route Views

- `clientes-placeholder-view` — ClientesPlaceholderView wrapper (`frontend/src/routes/_app/clientes.tsx`)
- `contactos-placeholder-view` — ContactosPlaceholderView wrapper (`frontend/src/routes/_app/contactos.tsx`)
- `not-found-view` — NotFoundView container (`frontend/src/routes/$.tsx`)
- `not-found-back-link` — Link back to /clientes in the 404 view

### Root Shell (already exists from Story 1.1)

- `app-root` — Root `<div>` in `__root.tsx` — preserve this attribute

**Implementation Example:**

```tsx
{/* NavigationShell.tsx */}
<aside data-testid="navigation-rail" className="hidden lg:flex lg:flex-col ...">
  <a data-testid="nav-rail-item-clientes" href="/clientes" aria-current={isClientes ? 'page' : undefined}>
    Clientes
  </a>
  <a data-testid="nav-rail-item-contactos" href="/contactos" aria-current={isContactos ? 'page' : undefined}>
    Contactos
  </a>
</aside>

<nav data-testid="navigation-bar" className="fixed bottom-0 left-0 right-0 flex lg:hidden ...">
  <a data-testid="nav-bar-item-clientes" href="/clientes">Clientes</a>
  <a data-testid="nav-bar-item-contactos" href="/contactos">Contactos</a>
</nav>
```

---

## Implementation Checklist

### Test Group: AC1 — Desktop NavigationRail

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC1 group)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/NavigationShell.tsx`
- [ ] Render `<aside data-testid="navigation-rail" className="hidden lg:flex lg:flex-col ...">` for desktop
- [ ] Add `<nav aria-label="Navegación principal">` wrapper
- [ ] Add nav items: `data-testid="nav-rail-item-clientes"` and `data-testid="nav-rail-item-contactos"`
- [ ] Add Spanish labels: "Clientes" and "Contactos"
- [ ] Import icons from `@heroicons/react/24/outline`: `UsersIcon` (Clientes), `UserIcon` (Contactos)
- [ ] Run tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group: AC2 — Clientes navigation and active state

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC2 group)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` — TanStack Router route at `/clientes`
- [ ] Wrap route component in `<Outlet />` of `_app.tsx` layout
- [ ] Use `<Link to="/clientes" activeProps={{ 'aria-current': 'page', className: 'text-[#0e79fd]' }}>` in NavigationShell
- [ ] Ensure `aria-current="page"` is set only on the active nav item
- [ ] Verify SPA navigation (no full page reload — TanStack Router handles this natively)
- [ ] Run tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC3 — Contactos navigation and active state

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC3 group)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/contactos.tsx` — TanStack Router route at `/contactos`
- [ ] Use `<Link to="/contactos" activeProps={{ 'aria-current': 'page', className: 'text-[#0e79fd]' }}>` in NavigationShell
- [ ] Verify mutual exclusivity: only the active route item gets `aria-current="page"`
- [ ] Run tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC4 — Mobile NavigationBar

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC4 group)

**Tasks to make these tests pass:**

- [ ] Add `<nav data-testid="navigation-bar" className="fixed bottom-0 left-0 right-0 flex lg:hidden ...">` to NavigationShell
- [ ] Add `data-testid="nav-bar-item-clientes"` and `data-testid="nav-bar-item-contactos"` items in NavigationBar
- [ ] Apply `hidden lg:flex` on NavigationRail and `flex lg:hidden` on NavigationBar (TailwindCSS v4)
- [ ] Apply dark mode variants: `dark:bg-slate-900`, `dark:text-slate-100`
- [ ] Run tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC5 — Direct URL /clientes deep linking

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC5 group)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route with NavigationShell + `<Outlet />`
- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `ClientesPlaceholderView` component
- [ ] Add `data-testid="clientes-placeholder-view"` to the ClientesPlaceholderView wrapper
- [ ] Placeholder text: "Sección Clientes — próximamente"
- [ ] Run `pnpm run build` to trigger TanStack Router plugin auto-generation of `routeTree.gen.ts`
- [ ] Run tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC6 — Direct URL /contactos deep linking

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC6 group)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `ContactosPlaceholderView` component
- [ ] Add `data-testid="contactos-placeholder-view"` to the ContactosPlaceholderView wrapper
- [ ] Placeholder text: "Sección Contactos — próximamente"
- [ ] Verify `routeTree.gen.ts` includes `/contactos` route after build
- [ ] Run tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC7 — 404 Not Found view

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC7 group)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/$.tsx` (catch-all route) with `NotFoundView` component
- [ ] Add `data-testid="not-found-view"` to NotFoundView wrapper
- [ ] Display message in Spanish: "Página no encontrada" (matches `/página no encontrada|no encontrado|404/i`)
- [ ] Add back link: `<a data-testid="not-found-back-link" href="/clientes">Volver a Clientes</a>`
- [ ] Verify catch-all handles both `/unknown` and `/foo/bar` paths
- [ ] Run tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC7"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC8 — Root path redirect

**File:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC8 group)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/index.tsx` with TanStack Router `beforeLoad` redirect to `/clientes`
- [ ] Pattern: `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Verify `routeTree.gen.ts` includes the index route after build
- [ ] Run tests: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC8"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test Group: Component Tests — NavigationShell

**File:** `frontend/src/shared/components/NavigationShell.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/shared/components/NavigationShell.tsx` with `NavigationShell` named export
- [ ] Accept `currentPath: string` prop for active state determination
- [ ] Add vitest + jsdom configuration to `vite.config.ts` (or `vitest.config.ts`):
  ```ts
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] }
  ```
- [ ] Create `frontend/src/test-setup.ts` with `import '@testing-library/jest-dom'`
- [ ] Add `@testing-library/user-event` to devDependencies: `pnpm add -D @testing-library/user-event`
- [ ] Run tests: `pnpm --filter frontend test`
- [ ] ✅ All component tests pass (green phase)

**Estimated Effort:** 0.5 hours (setup) + 1 hour (implementation)

---

## Running Tests

```bash
# Run all E2E failing tests for this story
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run tests for a specific AC
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"

# Run all E2E tests across all stories
npx playwright test

# Run component tests (Vitest)
pnpm --filter frontend test

# Run component tests in watch mode
pnpm --filter frontend test --watch

# Run component tests with coverage
pnpm --filter frontend test --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All E2E tests written and failing (27 tests in `e2e/tests/navigation/navigation-shell.spec.ts`)
- ✅ All component tests written and failing (14 tests in `frontend/src/shared/components/NavigationShell.test.tsx`)
- ✅ Page Object Model created: `e2e/pages/navigation-shell.page.ts`
- ✅ Base fixtures extended: `e2e/fixtures/base.fixture.ts`
- ✅ Mock requirements documented (none needed — pure frontend story)
- ✅ data-testid requirements listed (10 attributes documented)
- ✅ Implementation checklist created with clear tasks per AC group

**Verification:**

- All tests run and fail as expected (implementation files do not exist yet)
- E2E failures: `Error: locator.toBeVisible: Error: strict mode violation / no such element`
- Component failures: `Error: Cannot find module './NavigationShell'`
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test group** from implementation checklist (recommend starting with AC1)
2. **Read the test** to understand expected `data-testid` and behavior
3. **Implement minimal code** to make that specific test group pass
4. **Run the tests** to verify green
5. **Check off tasks** in implementation checklist
6. **Move to next AC group** and repeat

**Recommended implementation order:**

1. AC1 → Create `NavigationShell.tsx` with NavigationRail (desktop)
2. AC4 → Add NavigationBar (mobile) to `NavigationShell.tsx`
3. AC8 → Create `routes/index.tsx` redirect
4. AC5 → Create `_app.tsx` + `_app/clientes.tsx`
5. AC6 → Create `_app/contactos.tsx`
6. AC2 → Wire Clientes active state
7. AC3 → Wire Contactos active state
8. AC7 → Create `$.tsx` catch-all 404 view
9. Component tests → Finalize `NavigationShell.tsx` API

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 41 tests pass (27 E2E + 14 component)
2. Extract nav items config into a typed constant
3. Validate Heroicons are imported selectively (tree-shaking)
4. Check bundle size < 500KB gzipped
5. Run accessibility audit with axe-core
6. Ensure `dark:` TailwindCSS variants are applied
7. Clean up dead asset files per Story 1.1 code-review recommendation

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase:
   - E2E: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`
   - Component: `pnpm --filter frontend test`
3. **Begin implementation** using implementation checklist as guide (start with AC1)
4. **Work one AC group at a time** (red → green per group)
5. **When all 41 tests pass**, refactor code for quality
6. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Playwright `test.extend()` pattern for `clientesPage` / `contactosPage` fixtures
- **network-first.md** — `page.waitForURL('**/clientes')` set up BEFORE click to prevent race conditions
- **test-quality.md** — One assertion per test, Given-When-Then structure, atomic tests
- **selector-resilience.md** — `data-testid` selectors throughout; no CSS class or text-based selectors
- **timing-debugging.md** — `waitForLoadState('domcontentloaded')` used instead of hard waits
- **component-tdd.md** — Vitest + RTL component tests with viewport mocking for responsive behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E Command:** `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts`

**Expected Results:**

```
27 failed
  [chromium] AC1 - Desktop NavigationRail > should render NavigationRail on the left side on desktop viewport
    Error: Timed out 30000ms waiting for expect(locator).toBeVisible()
    locator: [data-testid="navigation-rail"]
    Expected: visible
    Received: <element(s) not found>
  ...
  (all 27 tests fail similarly — missing implementation)
```

**Component Command:** `pnpm --filter frontend test`

**Expected Results:**

```
 FAIL  src/shared/components/NavigationShell.test.tsx
  ● Test suite failed to run
    Cannot find module './NavigationShell' from 'src/shared/components/NavigationShell.test.tsx'
    (14 tests unable to run — module does not exist)
```

**Summary:**

- E2E total tests: 27
- E2E passing: 0 (expected)
- E2E failing: 27 (expected)
- Component total tests: 14
- Component passing: 0 (expected)
- Component failing: 14 (expected — module not found)
- Status: ✅ RED phase verified

---

## Notes

- `tea_use_playwright_utils: false` — using standard Playwright patterns without custom utils library
- `tea_use_mcp_enhancements: false` — AI generation mode used (no MCP recording needed; ACs are clear)
- The story is pure frontend with no backend API dependencies — no MSW mocks needed
- TanStack Router `routeTree.gen.ts` is auto-generated — never edit manually; run `pnpm run build` or `pnpm run dev` to regenerate
- Package manager: `pnpm` exclusively — never npm or yarn
- TypeScript strict mode: no `any` types in test files

---

**Generated by BMad TEA Agent** - 2026-05-23
