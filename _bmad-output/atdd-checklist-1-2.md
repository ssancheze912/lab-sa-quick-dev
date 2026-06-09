# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-09
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

Users need a persistent, responsive navigation structure to move between the Clientes and Contactos sections of the application without full page reloads. The shell must work on desktop (NavigationRail, left side) and mobile (NavigationBar, bottom), support deep linking, render a 404 view for unknown routes, and meet WCAG 2.1 AA accessibility standards.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — On desktop (>= 1024px): NavigationRail visible on the left with "Clientes" and "Contactos" entries; clicking navigates to `/clientes` or `/contactos` without a full page reload (FR28).
2. **AC2** — On mobile (< 1024px): NavigationBar at the bottom replaces the rail; all items are accessible and tappable (FR29).
3. **AC3** — Deep linking: navigating directly to `/clientes` or `/contactos` renders the correct view without redirection to a home screen (FR30).
4. **AC4** — Unknown routes: a 404 / not-found view is displayed with a Spanish message and a link back to `/clientes`.
5. **AC5** — Accessibility: ARIA roles and labels are present on all navigation landmarks (WCAG 2.1 AA).

---

## Failing Tests Created (RED Phase)

### E2E Tests (16 tests)

**File:** `e2e/tests/navigation/navigation-shell.spec.ts`

**AC1 — Desktop NavigationRail:**

- **Test:** `should display the NavigationRail on the left side on desktop viewport`
  - **Status:** RED — `[data-testid="navigation-rail"]` does not exist yet (`_app.tsx` not created)
  - **Verifies:** AC1 — NavigationRail visible on desktop
- **Test:** `should show a "Clientes" entry in the NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` not implemented
  - **Verifies:** AC1 — Clientes entry present
- **Test:** `should show a "Contactos" entry in the NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` not implemented
  - **Verifies:** AC1 — Contactos entry present
- **Test:** `should navigate to /clientes when clicking the Clientes entry without a full page reload`
  - **Status:** RED — nav item does not exist; navigation SPA behavior not wired
  - **Verifies:** AC1 — client-side navigation to /clientes
- **Test:** `should navigate to /contactos when clicking the Contactos entry without a full page reload`
  - **Status:** RED — nav item does not exist
  - **Verifies:** AC1 — client-side navigation to /contactos
- **Test:** `should NOT display the mobile NavigationBar on desktop viewport`
  - **Status:** RED — `[data-testid="navigation-bar"]` does not exist
  - **Verifies:** AC1/AC2 — mutual exclusion of rail vs bar

**AC2 — Mobile NavigationBar:**

- **Test:** `should display the NavigationBar at the bottom on mobile viewport`
  - **Status:** RED — NavigationBar not implemented
  - **Verifies:** AC2 — NavigationBar visible on mobile
- **Test:** `should show a tappable "Clientes" entry in the mobile NavigationBar`
  - **Status:** RED — nav items not implemented
  - **Verifies:** AC2 — Clientes item accessible on mobile
- **Test:** `should show a tappable "Contactos" entry in the mobile NavigationBar`
  - **Status:** RED — nav items not implemented
  - **Verifies:** AC2 — Contactos item accessible on mobile
- **Test:** `should navigate to /contactos when tapping Contactos in mobile NavigationBar`
  - **Status:** RED — navigation not wired
  - **Verifies:** AC2 — mobile navigation works
- **Test:** `should NOT display the desktop NavigationRail on mobile viewport`
  - **Status:** RED — NavigationRail not implemented
  - **Verifies:** AC1/AC2 — mutual exclusion

**AC3 — Deep Linking:**

- **Test:** `should render the Clientes view when typing /clientes directly in the URL bar`
  - **Status:** RED — `[data-testid="clientes-view"]` and route file not created
  - **Verifies:** AC3 — deep linking to /clientes
- **Test:** `should render the Contactos view when typing /contactos directly in the URL bar`
  - **Status:** RED — `[data-testid="contactos-view"]` and route file not created
  - **Verifies:** AC3 — deep linking to /contactos
- **Test:** `should redirect from root / to /clientes`
  - **Status:** RED — index redirect not implemented
  - **Verifies:** AC3 — root redirect

**AC4 — Not Found / 404:**

- **Test:** `should display a 404 not-found view when navigating to an unknown route`
  - **Status:** RED — `[data-testid="not-found-view"]` not implemented
  - **Verifies:** AC4 — 404 route renders
- **Test:** `should display a Spanish error message on the 404 view`
  - **Status:** RED — "Página no encontrada" text not present
  - **Verifies:** AC4 — Spanish message
- **Test:** `should display a link back to /clientes on the 404 view`
  - **Status:** RED — `[data-testid="not-found-back-link"]` not implemented
  - **Verifies:** AC4 — back link to /clientes

### Component Tests (13 tests)

**File:** `frontend/src/routes/__tests__/navigation.test.tsx`

**AC1 — Desktop NavigationRail (component level):**

- **Test:** `should render the NavigationRail on a desktop-width viewport`
  - **Status:** RED — `_app.tsx` does not exist (import will fail)
  - **Verifies:** AC1 — NavigationRail rendered in component tree
- **Test:** `should render a "Clientes" navigation item in the NavigationRail`
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — Clientes nav item present
- **Test:** `should render a "Contactos" navigation item in the NavigationRail`
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — Contactos nav item present
- **Test:** `should NOT render the mobile NavigationBar on desktop viewport`
  - **Status:** RED — component not implemented
  - **Verifies:** AC1/AC2 — responsive mutual exclusion

**AC2 — Mobile NavigationBar (component level):**

- **Test:** `should render the NavigationBar on a mobile viewport`
  - **Status:** RED — component not implemented
  - **Verifies:** AC2 — NavigationBar present on mobile
- **Test:** `should render a "Clientes" navigation item in the mobile NavigationBar`
  - **Status:** RED — component not implemented
  - **Verifies:** AC2 — Clientes accessible on mobile
- **Test:** `should render a "Contactos" navigation item in the mobile NavigationBar`
  - **Status:** RED — component not implemented
  - **Verifies:** AC2 — Contactos accessible on mobile
- **Test:** `should NOT render the desktop NavigationRail on mobile viewport`
  - **Status:** RED — component not implemented
  - **Verifies:** AC1/AC2 — mutual exclusion

**AC4 — Not-found component (component level):**

- **Test:** `should render the not-found view with data-testid "not-found-view"`
  - **Status:** RED — NotFoundView component not created
  - **Verifies:** AC4 — not-found component renders
- **Test:** `should display the Spanish message "Página no encontrada" in the 404 view`
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC4 — Spanish message
- **Test:** `should display a link back to /clientes in the 404 view`
  - **Status:** RED — back link not implemented
  - **Verifies:** AC4 — back link href=/clientes
- **Test:** `should render the back-to-clientes link text in Spanish`
  - **Status:** RED — link text not implemented
  - **Verifies:** AC4 — "Volver" text in Spanish

**AC5 — Accessibility (component level):**

- **Test:** `should have a <nav> element with aria-label="Navegación principal"`
  - **Status:** RED — nav element not implemented
  - **Verifies:** AC5 — ARIA navigation landmark
- **Test:** `should mark the active navigation link with aria-current="page"`
  - **Status:** RED — active state not implemented
  - **Verifies:** AC5 — active link indicator
- **Test:** `should not mark inactive links with aria-current="page"`
  - **Status:** RED — aria-current not implemented
  - **Verifies:** AC5 — inactive links do not have aria-current
- **Test:** `should have accessible text labels for all navigation items`
  - **Status:** RED — nav items not implemented
  - **Verifies:** AC5 — readable labels
- **Test:** `should have keyboard-focusable navigation items`
  - **Status:** RED — nav items not implemented
  - **Verifies:** AC5 — keyboard accessibility

---

## Data Factories Created

No data factories are required for this story. Story 1.2 is purely frontend navigation — no server state (TanStack Query or API calls) is involved. Active route state is derived from TanStack Router URL state only.

---

## Fixtures Created

### Navigation Base Fixture

**File:** `e2e/fixtures/base.fixture.ts` (already exists)

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test runs.
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page already at /clientes route
  - **Cleanup:** None required (navigation state)
- `contactosPage` — Navigates to `/contactos` before the test runs.
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page already at /contactos route
  - **Cleanup:** None required

---

## Mock Requirements

No external service mocks are required for this story. The navigation shell has no backend API calls. If the app were to call any API on initial load (e.g., user profile), route interception would be needed — currently not applicable to Story 1.2.

---

## Required data-testid Attributes

### Navigation Shell (`_app.tsx`)

- `navigation-rail` — Root element of the `NavigationRail` component (visible on `lg+` viewports only via `hidden lg:flex`)
- `navigation-bar` — Root element of the `NavigationBar` component (visible on mobile only via `flex lg:hidden`)
- `nav-item-clientes` — The "Clientes" anchor/button element in either rail or bar
- `nav-item-contactos` — The "Contactos" anchor/button element in either rail or bar

**Implementation Example:**

```tsx
<nav aria-label="Navegación principal">
  {/* Desktop rail — hidden on mobile */}
  <NavigationRail data-testid="navigation-rail" className="hidden lg:flex">
    <NavigationRail.Item
      data-testid="nav-item-clientes"
      to="/clientes"
      aria-current={isActive('/clientes') ? 'page' : undefined}
    >
      Clientes
    </NavigationRail.Item>
    <NavigationRail.Item
      data-testid="nav-item-contactos"
      to="/contactos"
      aria-current={isActive('/contactos') ? 'page' : undefined}
    >
      Contactos
    </NavigationRail.Item>
  </NavigationRail>

  {/* Mobile bar — hidden on desktop */}
  <NavigationBar data-testid="navigation-bar" className="flex lg:hidden">
    <NavigationBar.Item data-testid="nav-item-clientes" to="/clientes">
      Clientes
    </NavigationBar.Item>
    <NavigationBar.Item data-testid="nav-item-contactos" to="/contactos">
      Contactos
    </NavigationBar.Item>
  </NavigationBar>
</nav>
```

### Route Views

- `clientes-view` — Root wrapper element rendered by `_app/clientes.tsx` (placeholder page)
- `contactos-view` — Root wrapper element rendered by `_app/contactos.tsx` (placeholder page)

### Not-Found View (`__root.tsx` notFoundComponent)

- `not-found-view` — Root container of the 404 view
- `not-found-back-link` — The anchor linking back to `/clientes` with text "Volver al inicio"

**Implementation Example:**

```tsx
function NotFoundView() {
  return (
    <div data-testid="not-found-view">
      <h1>Página no encontrada</h1>
      <a data-testid="not-found-back-link" href="/clientes">
        Volver al inicio
      </a>
    </div>
  );
}
```

---

## Implementation Checklist

### Test Group: AC1 — Desktop NavigationRail

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC1 block), `frontend/src/routes/__tests__/navigation.test.tsx` (AC1 block)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app.tsx` with pathless layout component
- [ ] Import `NavigationRail` from `siesa-ui-kit` (or shadcn/ui fallback if unavailable)
- [ ] Wrap navigation in `<nav aria-label="Navegación principal">`
- [ ] Add `data-testid="navigation-rail"` to the NavigationRail root element
- [ ] Add `className="hidden lg:flex"` (Tailwind) to NavigationRail — hides on mobile
- [ ] Add `data-testid="navigation-bar"` to NavigationBar root element
- [ ] Add `className="flex lg:hidden"` to NavigationBar — hides on desktop
- [ ] Define nav items: `[{ label: 'Clientes', to: '/clientes' }, { label: 'Contactos', to: '/contactos' }]`
- [ ] Add `data-testid="nav-item-clientes"` to the Clientes nav item
- [ ] Add `data-testid="nav-item-contactos"` to the Contactos nav item
- [ ] Use TanStack Router `<Link>` inside nav items for client-side navigation (no full reload)
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC2 — Mobile NavigationBar

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC2 block), `frontend/src/routes/__tests__/navigation.test.tsx` (AC2 block)

**Tasks to make these tests pass:**

- [ ] Import `NavigationBar` from `siesa-ui-kit` (or shadcn/ui fallback)
- [ ] Apply `className="flex lg:hidden"` to NavigationBar (already listed above — shared task)
- [ ] Ensure NavigationBar renders at the bottom using appropriate layout (e.g., `fixed bottom-0` or layout flow)
- [ ] Confirm tappable / clickable state (not disabled, correct element type: `<a>` or `<button>`)
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC3 — Deep Linking & Index Redirect

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC3 block)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.tsx` — renders placeholder with `data-testid="clientes-view"` and text "Clientes"
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — renders placeholder with `data-testid="contactos-view"` and text "Contactos"
- [ ] Update `frontend/src/routes/index.tsx` — redirect to `/clientes` using TanStack Router `redirect()` or `<Navigate to="/clientes" />`
- [ ] Verify TanStack Router route tree picks up the new files (router regenerates `routeTree.gen.ts`)
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC4 — Not-Found / 404 Route

**Files:** `e2e/tests/navigation/navigation-shell.spec.ts` (AC4 block), `frontend/src/routes/__tests__/navigation.test.tsx` (AC4 block)

**Tasks to make these tests pass:**

- [ ] Update `frontend/src/routes/__root.tsx` — add `notFoundComponent` to `createRootRoute()`
- [ ] Implement the `NotFoundView` component with:
  - `data-testid="not-found-view"` on root container
  - `<h1>Página no encontrada</h1>` (or equivalent heading)
  - `<a data-testid="not-found-back-link" href="/clientes">Volver al inicio</a>`
- [ ] Optionally use `siesa-ui-kit` `EmptyState` component (or equivalent) if available
- [ ] Run test: `npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC5 — ARIA Accessibility

**Files:** `frontend/src/routes/__tests__/navigation.test.tsx` (AC5 block)

**Tasks to make these tests pass:**

- [ ] Ensure `<nav aria-label="Navegación principal">` wraps all navigation elements (already listed in AC1)
- [ ] Add `aria-current={isActive ? 'page' : undefined}` to each nav item link
- [ ] Use TanStack Router `activeProps` or `useRouterState` to compute active state
- [ ] Verify text content inside each nav item contains "Clientes" and "Contactos" (Spanish)
- [ ] Ensure nav item elements are `<a>` or `<button>` tags (natively focusable via keyboard Tab)
- [ ] Run test: `npx vitest run frontend/src/routes/__tests__/navigation.test.tsx`
- [ ] ✅ AC5 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E failing tests for Story 1.2
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --headed

# Run E2E tests for a specific AC
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC1"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC2"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC3"
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --grep "AC4"

# Debug a specific E2E test
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts --debug

# Run component tests (Vitest + RTL)
pnpm --filter frontend test:run frontend/src/routes/__tests__/navigation.test.tsx

# Run component tests in watch mode
pnpm --filter frontend test frontend/src/routes/__tests__/navigation.test.tsx

# Run all tests (E2E + component)
npx playwright test e2e/tests/navigation/navigation-shell.spec.ts && pnpm --filter frontend test:run
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- E2E test file exists: `e2e/tests/navigation/navigation-shell.spec.ts` (16 tests)
- Component test file exists: `frontend/src/routes/__tests__/navigation.test.tsx` (13 tests)
- No data factories needed (pure frontend, no server state)
- Base fixture documented (`e2e/fixtures/base.fixture.ts`)
- Mock requirements documented (none required for this story)
- Required `data-testid` attributes listed and example implementation provided
- Implementation checklist created with clear tasks per AC group

**Verification (expected RED state):**

- E2E tests fail: element `[data-testid="navigation-rail"]` not found — `_app.tsx` does not exist
- E2E tests fail: element `[data-testid="clientes-view"]` not found — route files do not exist
- E2E tests fail: element `[data-testid="not-found-view"]` not found — notFoundComponent not configured
- Component tests fail: `import('../_app')` throws MODULE_NOT_FOUND — file does not exist
- All failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

1. Pick the first failing test from the implementation checklist (recommended: start with AC3 — route files, as they unblock AC1/AC2/AC3 tests)
2. Read the failing test to understand exact expected behavior
3. Implement minimal code to make that test pass
4. Run the test to verify it is now green
5. Check off the task in the implementation checklist above
6. Move to the next test and repeat

**Recommended order:**
1. AC3 route files (`clientes.tsx`, `contactos.tsx`, index redirect)
2. AC1/AC2 navigation shell (`_app.tsx` with NavigationRail + NavigationBar)
3. AC4 not-found view (`__root.tsx` notFoundComponent)
4. AC5 ARIA attributes (aria-label, aria-current — refine during AC1/AC2 implementation)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 29 tests pass (16 E2E + 13 component)
2. Extract navigation items array to a separate `navItems.ts` constant
3. Review siesa-ui-kit component API for proper prop usage (document any deviations in Dev Agent Record)
4. Ensure responsive breakpoint classes are consistent with design system
5. Run all tests after each refactor step

---

## Notes

- **siesa-ui-kit availability**: Story 1.1 noted that `siesa-ui-kit` was not available in the npm registry. If still unavailable, use `shadcn/ui` as fallback and document the decision in the Dev Agent Record. The `data-testid` contract and ARIA requirements remain the same regardless of which UI library is used.
- **Viewport simulation in component tests**: Vitest + jsdom does not perform CSS media query evaluation. The component tests use `window.innerWidth` mocking to simulate responsive behavior. The actual CSS hiding (`hidden lg:flex`) is verified at the E2E level only, where a real browser applies Tailwind styles.
- **TanStack Router in component tests**: The `_app.tsx` layout component requires a router context. Use `createMemoryHistory` + `createRouter` wrapped in `<RouterProvider>` in test setup if the component uses `<Link>` or `useRouterState` internally. The component test file imports assume a `currentPath` prop for simplified testing — adjust as needed based on final implementation.
- **`aria-current` computation**: TanStack Router's `<Link>` supports `activeProps={{ 'aria-current': 'page' }}` which is the recommended approach. This satisfies both AC5 tests without custom logic.

---

## Contact

**Questions or Issues?**

- Refer to `_bmad/bmm/workflows/testarch/atdd/instructions.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** — 2026-06-09
