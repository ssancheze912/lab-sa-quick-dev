# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-05-24
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** E2E + Component

---

## Story Summary

This story implements the persistent navigation shell for the Siesa Agents CRM application.
It wires the TanStack Router pathless `_app` layout with `NavigationRail` (desktop) and
`NavigationBar` (mobile) from siesa-ui-kit, creates placeholder routes for `/clientes` and
`/contactos`, adds a 404 not-found view, and configures a root redirect from `/` to `/clientes`.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC1** — Given the application is loaded on a desktop browser (viewport >= 1024px), When the
   user views the app, Then a NavigationRail (siesa-ui-kit) is visible on the left side with
   "Clientes" and "Contactos" entries, And clicking either entry navigates to `/clientes` or
   `/contactos` without a full page reload (FR28).

2. **AC2** — Given the application is loaded on a mobile browser (viewport < 1024px), When the
   user views the app, Then a mobile NavigationBar (siesa-ui-kit) is displayed at the bottom
   instead of the rail, And all navigation items are accessible and tappable (FR29).

3. **AC3** — Given the user types `/clientes` or `/contactos` directly in the browser URL bar,
   When the page loads, Then the correct view is rendered without redirection to a home screen
   (FR30).

4. **AC4** — Given the user navigates to an unknown route (e.g., `/unknown`), When the page
   loads, Then a 404 not-found view is displayed with a Spanish-language message and a link back
   to `/clientes`.

5. **AC5** — Given the application is loaded, When the user navigates between Clientes and
   Contactos, Then the active navigation item is visually highlighted in the NavigationRail /
   NavigationBar.

6. **AC6** — Given the root URL `/` is accessed, When the page loads, Then the user is redirected
   to `/clientes` automatically.

---

## Failing Tests Created (RED Phase)

### E2E Tests — 18 tests

**File:** `e2e/tests/navigation-shell/navigation-shell.spec.ts`

#### AC1 — Desktop NavigationRail (6 tests)

- **Test:** `should show NavigationRail on the left side when viewport is desktop`
  - **Status:** RED — `_app.tsx` not implemented; `[data-testid="navigation-rail"]` not present
  - **Verifies:** AC1 — NavigationRail visible at desktop viewport

- **Test:** `should display "Clientes" entry in the NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-clientes"]` not present
  - **Verifies:** AC1 — Clientes entry visible in rail

- **Test:** `should display "Contactos" entry in the NavigationRail on desktop`
  - **Status:** RED — `[data-testid="nav-item-contactos"]` not present
  - **Verifies:** AC1 — Contactos entry visible in rail

- **Test:** `should navigate to /clientes without full page reload when clicking Clientes entry`
  - **Status:** RED — Navigation items not rendered; SPA navigation not implemented
  - **Verifies:** AC1 — SPA navigation to /clientes (no full reload)

- **Test:** `should navigate to /contactos without full page reload when clicking Contactos entry`
  - **Status:** RED — Navigation items not rendered; SPA navigation not implemented
  - **Verifies:** AC1 — SPA navigation to /contactos (no full reload)

- **Test:** `should NOT show mobile NavigationBar on desktop viewport`
  - **Status:** RED — `_app.tsx` not implemented; can't verify responsive behavior
  - **Verifies:** AC1 — Mobile nav hidden on desktop

#### AC2 — Mobile NavigationBar (5 tests)

- **Test:** `should show mobile NavigationBar at the bottom on mobile viewport`
  - **Status:** RED — `[data-testid="navigation-bar"]` not present
  - **Verifies:** AC2 — NavigationBar visible on mobile

- **Test:** `should display "Clientes" nav item in mobile NavigationBar`
  - **Status:** RED — NavigationBar not implemented
  - **Verifies:** AC2 — Clientes item in mobile bar

- **Test:** `should display "Contactos" nav item in mobile NavigationBar`
  - **Status:** RED — NavigationBar not implemented
  - **Verifies:** AC2 — Contactos item in mobile bar

- **Test:** `should NOT show desktop NavigationRail on mobile viewport`
  - **Status:** RED — Responsive behavior not implemented
  - **Verifies:** AC2 — Desktop nav hidden on mobile

- **Test:** `should make "Clientes" nav item tappable on mobile`
  - **Status:** RED — Nav items not present; tap not possible
  - **Verifies:** AC2 — Nav items are tappable on mobile

#### AC3 — Deep linking (4 tests)

- **Test:** `should render Clientes view when navigating directly to /clientes via URL`
  - **Status:** RED — `/clientes` route not implemented; `[data-testid="clientes-page"]` missing
  - **Verifies:** AC3 — Deep link to /clientes works

- **Test:** `should render Contactos view when navigating directly to /contactos via URL`
  - **Status:** RED — `/contactos` route not implemented; `[data-testid="contactos-page"]` missing
  - **Verifies:** AC3 — Deep link to /contactos works

- **Test:** `should NOT redirect to a home screen when /clientes is accessed directly`
  - **Status:** RED — Route not implemented
  - **Verifies:** AC3 — No unwanted redirect from /clientes

- **Test:** `should NOT redirect to a home screen when /contactos is accessed directly`
  - **Status:** RED — Route not implemented
  - **Verifies:** AC3 — No unwanted redirect from /contactos

#### AC4 — 404 not-found (4 tests)

- **Test:** `should display a 404 not-found view when navigating to an unknown route`
  - **Status:** RED — 404 component not registered; `[data-testid="not-found-page"]` missing
  - **Verifies:** AC4 — 404 view displayed on unknown routes

- **Test:** `should display Spanish "Página no encontrada" message on 404 view`
  - **Status:** RED — `[data-testid="not-found-message"]` not present
  - **Verifies:** AC4 — Spanish error message shown

- **Test:** `should display a link back to /clientes on the 404 view`
  - **Status:** RED — `[data-testid="not-found-back-link"]` not present
  - **Verifies:** AC4 — Back link to /clientes on 404 page

- **Test:** `should navigate to /clientes when clicking the back link from the 404 view`
  - **Status:** RED — Back link not present; navigation not possible
  - **Verifies:** AC4 — Back link navigates to /clientes

#### AC5 — Active highlighting (3 tests)

- **Test:** `should highlight "Clientes" nav item when on the /clientes route (desktop)`
  - **Status:** RED — Active state not implemented; `data-active="true"` not set
  - **Verifies:** AC5 — Active state on current route

- **Test:** `should highlight "Contactos" nav item when on the /contactos route (desktop)`
  - **Status:** RED — Active state not implemented
  - **Verifies:** AC5 — Active state on current route

- **Test:** `should update active highlight when navigating from /clientes to /contactos`
  - **Status:** RED — Active state transitions not implemented
  - **Verifies:** AC5 — Active state updates on navigation

#### AC6 — Root redirect (2 tests)

- **Test:** `should redirect from / to /clientes automatically`
  - **Status:** RED — `index.tsx` redirect not implemented
  - **Verifies:** AC6 — Root redirect to /clientes

- **Test:** `should render the Clientes view after redirect from /`
  - **Status:** RED — Redirect + Clientes route not implemented
  - **Verifies:** AC6 — Clientes view rendered after redirect

---

### Component Tests — 16 tests

#### app-layout.test.tsx — 11 tests

**File:** `frontend/src/test/routes/app-layout.test.tsx`

- AC1 suite (4 tests): NavigationRail rendered, Clientes/Contactos items present, Spanish labels
- AC2 suite (3 tests): NavigationBar rendered on mobile, nav items present
- AC5 suite (3 tests): data-active="true" on active nav item, not on inactive

**All 11 tests FAIL** because `_app.tsx` is not yet implemented and the stub component
does not render the required `data-testid` elements.

#### not-found.test.tsx — 7 tests

**File:** `frontend/src/test/routes/not-found.test.tsx`

- AC4 suite (7 tests): not-found-page container, Spanish message, /clientes back link,
  accessible link text, heading element, no nav bleed, no throw without props

**All 7 tests FAIL** because `not-found.tsx` is not yet implemented and the stub component
renders an empty `<div />`.

---

## Required data-testid Attributes

### `_app.tsx` — Pathless Layout

| data-testid | Element | Required by |
|-------------|---------|-------------|
| `navigation-rail` | NavigationRail wrapper | AC1, AC5 |
| `navigation-bar` | NavigationBar wrapper | AC2 |
| `nav-item-clientes` | Clientes nav link | AC1, AC2, AC5 |
| `nav-item-contactos` | Contactos nav link | AC1, AC2, AC5 |

**Additional attributes on nav items:**
- `data-active="true"` when the nav item's route is the current active route (AC5)

### `_app/clientes.tsx` — Clientes Placeholder Route

| data-testid | Element | Required by |
|-------------|---------|-------------|
| `clientes-page` | Main container of ClientesPage | AC3, AC6 |

### `_app/contactos.tsx` — Contactos Placeholder Route

| data-testid | Element | Required by |
|-------------|---------|-------------|
| `contactos-page` | Main container of ContactosPage | AC3 |

### `not-found.tsx` — 404 View

| data-testid | Element | Required by |
|-------------|---------|-------------|
| `not-found-page` | Root container | AC4 |
| `not-found-message` | Paragraph/heading with "Página no encontrada" | AC4 |
| `not-found-back-link` | `<a href="/clientes">` back link | AC4 |

---

## Mock Requirements

Story 1.2 tests do NOT require API mocks — all tested behavior is purely frontend routing
and UI rendering. Tests assert:
- DOM element presence via `data-testid`
- URL changes via `page.url()` / `page.waitForURL()`
- Attribute values (`data-active`, `href`)
- Text content (Spanish labels)

**No backend server is required** for the E2E tests in this story. The Playwright config
`webServer` starts the Vite dev server. All assertions are frontend-only.

---

## Implementation Checklist

### Task 1: Create `_app.tsx` pathless layout (AC1, AC2, AC5)

**Makes these tests pass:**
- All AC1 E2E tests (desktop NavigationRail)
- All AC2 E2E tests (mobile NavigationBar)
- All AC5 E2E tests (active highlighting)
- All app-layout.test.tsx component tests (11 tests)

**Steps:**
- [ ] Create `frontend/src/routes/_app.tsx`
- [ ] Import `NavigationRail`, `NavigationBar`, `LayoutBase`, `Navbar` from `siesa-ui-kit`
- [ ] Add `data-testid="navigation-rail"` to the `NavigationRail` component
- [ ] Add `data-testid="navigation-bar"` to the `NavigationBar` component
- [ ] Add `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"` to nav items
- [ ] Apply `hidden lg:flex` to NavigationRail (desktop only)
- [ ] Apply `flex lg:hidden` to NavigationBar (mobile only)
- [ ] Use TanStack Router `Link` `activeProps` or `useRouterState` to set `data-active="true"` on active item
- [ ] Run: `pnpm exec vitest run frontend/src/test/routes/app-layout.test.tsx`
- [ ] Run: `npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --project=chromium`

**Estimated Effort:** 2 hours

---

### Task 2: Create placeholder routes `/clientes` and `/contactos` (AC3)

**Makes these tests pass:**
- AC3 E2E tests (deep linking — 4 tests)
- AC6 E2E tests (root redirect — 2 tests)

**Steps:**
- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `createFileRoute('/_app/clientes')`
- [ ] Add `data-testid="clientes-page"` to `ClientesPage` main container
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `createFileRoute('/_app/contactos')`
- [ ] Add `data-testid="contactos-page"` to `ContactosPage` main container
- [ ] Verify TanStack Router resolves both routes via direct URL access
- [ ] Run: `npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC3"`

**Estimated Effort:** 0.5 hours

---

### Task 3: Create 404 not-found route (AC4)

**Makes these tests pass:**
- AC4 E2E tests (4 tests)
- not-found.test.tsx component tests (7 tests)

**Steps:**
- [ ] Create `frontend/src/routes/not-found.tsx` with `NotFoundPage` component
- [ ] Add `data-testid="not-found-page"` to root container
- [ ] Add `data-testid="not-found-message"` with text "Página no encontrada"
- [ ] Add `data-testid="not-found-back-link"` as `<Link to="/clientes">` (TanStack Router)
  - Ensure the rendered anchor has `href="/clientes"` (test checks actual `href` attribute)
- [ ] Add a semantic heading element (`<h1>` or `<h2>`) for WCAG compliance
- [ ] Register in `frontend/src/routes/__root.tsx`: `notFoundComponent: NotFoundPage`
- [ ] Run: `pnpm exec vitest run frontend/src/test/routes/not-found.test.tsx`
- [ ] Run: `npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC4"`

**Estimated Effort:** 0.75 hours

---

### Task 4: Configure root redirect `/` → `/clientes` (AC6)

**Makes these tests pass:**
- AC6 E2E tests (2 tests)

**Steps:**
- [ ] Update `frontend/src/routes/index.tsx` to use `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Verify redirect does NOT cause infinite loop (TanStack Router handles this by default)
- [ ] Run: `npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC6"`

**Estimated Effort:** 0.25 hours

---

### Task 5: Wire `__root.tsx` with `notFoundComponent` (AC4)

**Steps:**
- [ ] Open `frontend/src/routes/__root.tsx`
- [ ] Import `NotFoundPage` from `./not-found`
- [ ] Add `notFoundComponent: NotFoundPage` to `createRootRoute` options
- [ ] Verify `id="app-shell"` div from Story 1.1 is preserved

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all Story 1.2 E2E tests
npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts

# Run only desktop AC1 tests
npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC1"

# Run only mobile AC2 tests
npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC2"

# Run only deep-link AC3 tests
npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC3"

# Run only 404 AC4 tests
npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC4"

# Run only active-state AC5 tests
npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC5"

# Run only redirect AC6 tests
npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --grep "AC6"

# Run component tests (Vitest)
pnpm exec vitest run frontend/src/test/routes/app-layout.test.tsx
pnpm exec vitest run frontend/src/test/routes/not-found.test.tsx

# Run all component tests for Story 1.2
pnpm exec vitest run frontend/src/test/routes/

# Run E2E tests on mobile project
npx playwright test e2e/tests/navigation-shell/navigation-shell.spec.ts --project=mobile-chrome
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (18 E2E + 16 component = 34 total)
- Network-first pattern applied: `page.waitForResponse()` registered before `page.goto()`
- `data-testid` requirements fully documented
- No mocks required — pure frontend routing
- Implementation checklist created with ordered tasks and effort estimates

**Verification:**

- E2E tests: fail with "element not found" (components not rendered) or "waitForURL timed out" (routes not implemented)
- Component tests: fail with `Unable to find an element by: [data-testid="..."]` (stub does not render elements)

---

### GREEN Phase (DEV Team)

**Recommended order:**

1. Create `_app.tsx` layout with NavigationRail + NavigationBar (unlocks AC1, AC2, AC5 tests)
2. Create `/clientes` and `/contactos` placeholder routes (unlocks AC3 tests)
3. Create `not-found.tsx` 404 view + register in `__root.tsx` (unlocks AC4 tests)
4. Add root redirect in `index.tsx` (unlocks AC6 tests)

**Key principle:** Work one AC at a time, verify with `--grep "AC{n}"` after each.

---

### REFACTOR Phase (After All Tests Pass)

1. Verify all 34 tests pass
2. Review `_app.tsx` for layout responsiveness (ensure Tailwind classes are correct)
3. Ensure WCAG 2.1 AA: aria-labels on nav items, minimum 44×44px touch targets on mobile
4. Run `pnpm exec tsc --noEmit` — zero TypeScript errors

---

## Notes

- Story 1.2 is a pure-frontend routing story — no backend API calls, no mocks needed.
- `NavigationRail` and `NavigationBar` MUST come from `siesa-ui-kit` per P0 company rule.
- Tailwind v4 responsive prefixes (`lg:`, `hidden`, `flex`) work identically to v3.
- The `data-active="true"` attribute on nav items is the contract between TEA tests and
  the TanStack Router `Link activeProps` implementation. The implementation must ensure
  the attribute is set by TanStack Router's active link mechanism.
- `ClientesPage` and `ContactosPage` are intentional stubs — Epic 2 and Epic 3 replace them.
- The back link on the 404 page must use TanStack Router's `<Link to="/clientes">` so the
  rendered `<a>` has `href="/clientes"` (checked by E2E test).

---

**Generated by BMad TEA Agent** — 2026-05-24
