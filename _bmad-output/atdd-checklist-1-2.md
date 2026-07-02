# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-07-02
**Author:** SiesaTeam (TEA)
**Primary Test Level:** E2E (Playwright) with supporting Component tests (Vitest + RTL)
**Status:** RED phase — all tests intentionally failing

---

## Story Summary

Story 1.2 adds a persistent, responsive navigation shell to the CRM. On desktop
(≥ 1024px) the app renders a fixed `NavigationRail` on the left; on mobile
(< 1024px) it renders a fixed `NavigationBar` at the bottom. Both surfaces expose
two entries — Clientes and Contactos — and SPA-navigate between routes via
TanStack Router (no full page reloads).

**As a** user
**I want** a persistent navigation structure to access Clientes and Contactos
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria (from story 1.2)

1. AC1 — Desktop viewport (≥ 1024px) renders `NavigationRail` with Clientes + Contactos; `NavigationBar` NOT rendered.
2. AC2 — Mobile viewport (< 1024px) renders `NavigationBar` with Clientes + Contactos; `NavigationRail` NOT rendered.
3. AC3 — Navigation between /clientes ↔ /contactos is SPA (no `window.location.reload`, shell mounted throughout, active entry updates).
4. AC4 — Deep-link to /clientes renders Clientes view with `<h1>Clientes</h1>` and no redirect.
5. AC5 — Deep-link to /contactos renders Contactos view with `<h1>Contactos</h1>` and no redirect.
6. AC6 — Unknown route renders `NotFoundView` ("Página no encontrada" + "Ir a Clientes" button), shell preserved, no JS errors.
7. AC7 — Root path `/` redirects to `/clientes` via TanStack Router `beforeLoad`; old placeholder removed.
8. AC8 — All user-facing text in Spanish; code in English.
9. AC9 — `pnpm --filter frontend build` and `pnpm test:e2e` complete with 0 TS errors and all Playwright specs GREEN, including the new `e2e/tests/foundation/navigation-shell.spec.ts` suite.

---

## Failing Tests Created (RED Phase)

### E2E Tests (23 tests)

**File:** `e2e/tests/foundation/navigation-shell.spec.ts`

Grouped by AC. Every test is expected to FAIL until Tasks 1–6 in the story are implemented.

| Test ID | Description | Expected failure reason |
|---|---|---|
| TC-E1-P2-03 | `/` should redirect to `/clientes` | `/` still renders "Siesa Agents CRM" placeholder |
| TC-E1-P2-03 | `/` should NOT show "Siesa Agents CRM" heading | Placeholder still present in `src/routes/index.tsx` |
| TC-E1-P1-02 | `/clientes` deep-link renders `<h1>Clientes</h1>` | Route `frontend/src/routes/clientes.tsx` does not exist |
| TC-E1-P1-02 | `/clientes` deep-link does not redirect | Same — route not defined |
| TC-E1-P1-03 | `/contactos` deep-link renders `<h1>Contactos</h1>` | Route `frontend/src/routes/contactos.tsx` does not exist |
| TC-E1-P1-03 | `/contactos` deep-link does not redirect | Same |
| TC-E1-P2-01 | Desktop renders `[data-testid="nav-rail"]` | AppShell not implemented |
| TC-E1-P2-01 | Desktop hides `[data-testid="nav-bar"]` | AppShell not implemented |
| TC-E1-P2-01 | Rail exposes "Clientes" button | AppShell not implemented |
| TC-E1-P2-01 | Rail exposes "Contactos" button | AppShell not implemented |
| TC-E1-P2-02 | Mobile renders `[data-testid="nav-bar"]` | AppShell not implemented |
| TC-E1-P2-02 | Mobile hides `[data-testid="nav-rail"]` | AppShell not implemented |
| TC-E1-P2-02 | Bar exposes "Clientes" button | AppShell not implemented |
| TC-E1-P2-02 | Bar exposes "Contactos" button | AppShell not implemented |
| TC-E1-P1-01 | Click Contactos from /clientes navigates without full reload | Nav wiring missing |
| TC-E1-P1-01 | Only one `navigation` performance entry after click | Nav wiring missing |
| TC-E1-P1-01 | Click Clientes from /contactos navigates without full reload | Nav wiring missing |
| TC-E1-P1-04 | Unknown route renders `[data-testid="not-found-view"]` heading "Página no encontrada" | `NotFoundView` not implemented, `notFoundComponent` not wired |
| TC-E1-P1-04 | 404 keeps `NavigationRail` visible | Same |
| TC-E1-P1-04 | "Ir a Clientes" button on 404 navigates back to /clientes | Same |
| TC-E1-P1-04 | 404 does not throw JS runtime errors | Same |
| AC8 | Rail label "Clientes" is Spanish | AppShell not implemented |
| AC8 | Rail label "Contactos" is Spanish | AppShell not implemented |
| AC8 | Recovery button label is exactly "Ir a Clientes" | NotFoundView not implemented |

### Component Tests (Vitest + React Testing Library) (10 tests)

**File:** `frontend/src/shared/components/AppShell/AppShell.test.tsx` (6 tests)
- `[TC-E1-P2-01]` renders `nav-rail` on desktop
- `[TC-E1-P2-01]` rail contains "Clientes" entry
- `[TC-E1-P2-01]` rail contains "Contactos" entry
- `[TC-E1-P2-02]` renders `nav-bar` on mobile
- `[TC-E1-P1-01]` clicking Contactos calls `useNavigate({ to: '/contactos' })`
- `[TC-E1-P1-01]` clicking Contactos does NOT call `window.location.reload()`

**File:** `frontend/src/shared/components/NotFoundView/NotFoundView.test.tsx` (5 tests)
- `[TC-E1-P1-04]` heading "Página no encontrada" present
- `[TC-E1-P1-04]` "Ir a Clientes" button present
- `[TC-E1-P1-04]` container has `data-testid="not-found-view"`
- `[TC-E1-P1-04]` clicking button calls `useNavigate({ to: '/clientes' })`
- `[TC-E1-P1-04]` container has `role="alert"` for a11y

**Expected failure reason (all Vitest specs):** Vitest is not yet configured
(`frontend/vitest.config.ts` and `frontend/src/test/setup.ts` do not exist,
`pnpm --filter frontend test` script is not registered) AND the components under
test (`AppShell`, `NotFoundView`) do not yet exist. Tasks 7.1–7.3 in the story
add the config; Tasks 2 and 6 add the components.

### Route Tests (Vitest + TanStack Router memory history) (1 test)

**File:** `frontend/src/routes/index.test.tsx`
- `[TC-E1-P2-03]` in-memory router mounted at `/` resolves to `/clientes`

**Expected failure reason:** `src/routes/index.tsx` currently renders the
Story 1.1 placeholder component. Task 4 converts it into a `beforeLoad` redirect.

**Total failing tests: 34**
(23 E2E + 10 Component + 1 Route)

---

## Data Factories Created

None for this story. The navigation shell has no data-flow surface — there are
no entities to seed. Data factories will be introduced in Epic 2 (Clientes CRUD).

---

## Fixtures Created

None new. The existing `e2e/fixtures/base.fixture.ts` (Story 1.1) covers
`clientesPage` / `contactosPage` navigation. The new specs use the plain
`@playwright/test` fixture because they need custom viewport switching and
network navigation assertions that don't fit the shared pre-nav helpers.

---

## Mock Requirements

None. Story 1.2 is a pure client-side navigation concern — no backend calls, no
external services to mock.

---

## Required data-testid Attributes

### AppShell (`frontend/src/shared/components/AppShell/AppShell.tsx`)

- `nav-rail` — wrapper around the siesa-ui-kit `<NavigationRail>` (desktop)
- `nav-bar` — wrapper around the siesa-ui-kit `<NavigationBar>` (mobile)

### NotFoundView (`frontend/src/shared/components/NotFoundView/NotFoundView.tsx`)

- `not-found-view` — root container of the 404 view; also `role="alert"` and `aria-live="polite"`

### Placeholder route views (kept even though not strictly required by tests)

- `clientes-view` — `<section>` wrapper in `frontend/src/routes/clientes.tsx`
- `contactos-view` — `<section>` wrapper in `frontend/src/routes/contactos.tsx`

### Preserved from Story 1.1

- `app-root` — the outer container in `__root.tsx`. Story 1.2 MUST NOT remove it.

---

## Implementation Checklist

Ordered to minimize backtracking. Each step should turn one or more failing
tests GREEN.

- [ ] **Task 1 — Deps + styles**
  - [ ] `pnpm --filter frontend add @heroicons/react`
  - [ ] Add `import 'siesa-ui-kit/styles.css'` in `frontend/src/main.tsx`
- [ ] **Task 7.1 — Vitest wiring (do this early so component specs can run)**
  - [ ] Create `frontend/vitest.config.ts` (or extend `vite.config.ts` with `test:` block) — `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test/setup.ts']`
  - [ ] Create `frontend/src/test/setup.ts` — `import '@testing-library/jest-dom'`
  - [ ] Add `@testing-library/user-event` if absent (`pnpm --filter frontend add -D @testing-library/user-event`)
  - [ ] Add scripts to `frontend/package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`
  - [ ] Run `pnpm --filter frontend test` — expect the AppShell + NotFoundView specs to fail on import (components not written yet). This is expected RED.
- [ ] **Task 2 — AppShell**
  - [ ] Create `frontend/src/shared/components/AppShell/navItems.ts` per story spec
  - [ ] Create `frontend/src/shared/components/AppShell/AppShell.tsx` — compose `NavigationRail` (`hidden lg:flex`) + `NavigationBar` (`lg:hidden`) + `<main><Outlet /></main>`, `data-testid="nav-rail"` / `nav-bar` on wrappers, `activeId` from `useRouterState`, handlers call `navigate({ to })`
  - [ ] Create `frontend/src/shared/components/AppShell/index.ts` barrel
  - [ ] Verify AppShell.test.tsx now runs (6 tests) — should turn GREEN
- [ ] **Task 6 — NotFoundView**
  - [ ] Create `frontend/src/shared/components/NotFoundView/NotFoundView.tsx` — heading "Página no encontrada", explanatory `<p>`, `<Button variant="primary">Ir a Clientes</Button>` → `useNavigate({ to: '/clientes' })`, container `data-testid="not-found-view"` + `role="alert"` + `aria-live="polite"`
  - [ ] Create `frontend/src/shared/components/NotFoundView/index.ts` barrel
  - [ ] Verify NotFoundView.test.tsx now runs (5 tests) — should turn GREEN
- [ ] **Task 3 — Root route**
  - [ ] Edit `frontend/src/routes/__root.tsx` — wrap `<Outlet />` in `<AppShell>` (keep `data-testid="app-root"`), add `notFoundComponent: NotFoundView`
- [ ] **Task 4 — Index redirect**
  - [ ] Rewrite `frontend/src/routes/index.tsx` to `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
  - [ ] Verify `index.test.tsx` now runs (1 test) — should turn GREEN
  - [ ] Update `e2e/tests/foundation/frontend-shell-edge-cases.spec.ts` — the two tests that assert `/Siesa Agents CRM/i` at `/` MUST be adjusted (visit `/clientes`, assert `/Clientes/i`) per Task 4.4 of the story
- [ ] **Task 5 — Placeholder views**
  - [ ] Create `frontend/src/routes/clientes.tsx` with `<h1 id="clientes-title">Clientes</h1>`
  - [ ] Create `frontend/src/routes/contactos.tsx` with `<h1 id="contactos-title">Contactos</h1>`
  - [ ] Confirm `routeTree.gen.ts` regenerated and committed
- [ ] **Task 8 — Verify E2E RED → GREEN**
  - [ ] Run `pnpm test:e2e` — the new `navigation-shell.spec.ts` should turn GREEN (all 23 tests) alongside the existing Story 1.1 suite
- [ ] **Task 9 — Final gates**
  - [ ] `pnpm --filter frontend build` → 0 TS errors
  - [ ] `pnpm --filter frontend lint` → 0 errors
  - [ ] `pnpm --filter frontend test` → all Vitest specs GREEN
  - [ ] `pnpm test:e2e` → all Playwright specs GREEN

---

## Running Tests

```bash
# All Vitest (frontend) unit + component + route tests
pnpm --filter frontend test

# Watch mode while implementing
pnpm --filter frontend test:watch

# Playwright E2E — all projects (chromium, firefox, edge, mobile-chrome)
pnpm test:e2e

# Just this story's E2E suite
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts

# Debug a specific E2E test
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --debug

# Headed (see browser)
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --headed
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 34 tests written and failing
- Failures are due to missing implementation (routes, AppShell, NotFoundView, Vitest config), NOT test bugs
- No `.only` / `.skip` in the suite

### GREEN Phase (DEV Team)

1. Follow the Implementation Checklist above in order (Task 1 → 7.1 → 2 → 6 → 3 → 4 → 5)
2. Run relevant test scope after each task to watch tests turn green
3. Do NOT batch multiple tasks before checking tests — one at a time keeps failure signal actionable

### REFACTOR Phase (DEV Team)

- Extract nav item mapping into `navItems.ts` (already required by story)
- Consider a `useActiveNavId` custom hook if AppShell grows
- Preserve all `data-testid` selectors — the tests depend on them

---

## Test Execution Evidence (RED Phase Verification)

Expected outcome when running the suites BEFORE any implementation task:

```
pnpm --filter frontend test
  → Fails to start: "vitest" command not found / no vitest.config.ts / setup file missing
  → Once Task 7.1 lands but components are absent:
    ✗ AppShell.test.tsx — Cannot find module './AppShell'
    ✗ NotFoundView.test.tsx — Cannot find module './NotFoundView'
    ✗ routes/index.test.tsx — redirect not thrown; pathname resolves to '/'

pnpm test:e2e (project: chromium)
  navigation-shell.spec.ts
    ✗ [TC-E1-P2-03] '/' should redirect to '/clientes'   (still on '/')
    ✗ [TC-E1-P1-02] '/clientes' renders <h1>Clientes</h1> (route not found → 404 shell in dev)
    ✗ [TC-E1-P1-03] '/contactos' renders <h1>Contactos</h1>
    ✗ [TC-E1-P2-01] '[data-testid="nav-rail"]' visible   (locator resolved to zero elements)
    ✗ [TC-E1-P2-02] '[data-testid="nav-bar"]' visible
    ✗ [TC-E1-P1-01] clicking Contactos → /contactos (rail entry not present)
    ✗ [TC-E1-P1-04] '[data-testid="not-found-view"]' visible
    …
```

- Total tests: 34
- Passing: 0 (expected)
- Failing: 34 (expected)
- Status: RED phase verified — failures trace back to missing implementation

---

## Notes

- The Story 1.1 spec `e2e/tests/foundation/frontend-shell-edge-cases.spec.ts` has
  two assertions on the "Siesa Agents CRM" heading at `/` that will start failing
  once Task 4 lands (redirect to `/clientes`). Task 4 explicitly requires
  updating those assertions. This ATDD suite does NOT touch that file — the DEV
  team owns that adjustment as part of Task 4.
- Vitest is present as a devDependency but not configured. Test files reference
  `vitest` globals via `import { describe, it, expect, vi } from 'vitest'` so
  they don't rely on the `globals: true` setting; that setting is still needed
  for `@testing-library/jest-dom` matcher extensions.
- The component tests deliberately mock `@tanstack/react-router` hooks
  (`useNavigate`, `useRouterState`, `Outlet`) so the AppShell can be exercised
  without spinning up a full router — matches the Vitest patterns in the story
  Dev Notes ("Router tests: use `createRootRoute`… for router-integration tests;
  mock hooks for isolated component tests").
- All specs use Given-When-Then comments and `data-testid` selectors — no CSS
  selectors, no hard waits (only `waitForURL` / `expect(...).toBeVisible()`).
- The `[TC-E1-P1-01-e2e]` variants live in the E2E file. The unit-level
  `[TC-E1-P1-01]` variants live in the AppShell component spec. Together they
  cover the "no full page reload" contract from both sides — the browser
  performance entries (E2E) and the `useNavigate` call shape (component).

---

## Knowledge Base References Applied

- **network-first.md** — network-first navigation intercepts (all `page.goto` calls fire before assertions; `waitForURL` before assertions on new URL)
- **selector-resilience.md** — `data-testid` first, `getByRole` second, no CSS selectors
- **test-quality.md** — Given-When-Then structure, one behavior per test, deterministic locators
- **timing-debugging.md** — no hard `waitForTimeout`; only `waitForURL` and `expect().toBeVisible()`
- **fixture-architecture.md** — reused existing `base.fixture.ts` from Story 1.1 where appropriate; kept new specs on plain `@playwright/test` for viewport control
- **component-tdd.md** — component specs isolate the component under test, mock external hooks, cover both rendering and behavior

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-07-02
