# ATDD Checklist — Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-02
**Author:** SiesaTeam (TEA — Test Architect, autonomous mode)
**Workflow:** `_bmad/bmm/testarch/atdd` v4.0 (BMad v6)
**Primary Test Level:** Component (Vitest + RTL) — backed by E2E (Playwright)
**Story File:** `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`
**Epic Source:** `_bmad-output/planning-artifacts/epics/epic-01-foundation.md` (Story 1.2)
**Test Design:** `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

## Story Summary

**As a** user,
**I want** a persistent navigation structure to access Clientes and Contactos,
**So that** I can move between sections without full page reloads from any device.

Implements the `LayoutBase` shell from `siesa-ui-kit`, the desktop `NavigationRailGroup`, the mobile bottom `NavigationBar`, a TanStack Router catch-all 404, an `/` → `/clientes` redirect, and deep-linkable `/clientes` + `/contactos` placeholder views.

---

## Acceptance Criteria Coverage

| AC | Description | Test ID(s) | Level |
|----|-------------|------------|-------|
| 1 | Desktop ≥1024px renders `LayoutBase` Navbar + `NavigationRailGroup` with Clientes & Contactos; SPA navigation | TC-E1-P1-01, TC-E1-P2-01 | Component + E2E |
| 2 | Mobile <1024px renders bottom `NavigationBar`, rail hidden via Tailwind | TC-E1-P2-02 | Component + E2E |
| 3 | Deep link `/clientes` renders `ClientesPlaceholderView` inside the shell | TC-E1-P1-02 | E2E |
| 4 | Deep link `/contactos` renders `ContactosPlaceholderView` inside the shell | TC-E1-P1-03 | E2E |
| 5 | Unknown route renders Spanish `NotFoundView` inside shell with `"Ir a Clientes"` link | TC-E1-P1-04 | Component + E2E |
| 6 | `/` redirects to `/clientes` via TanStack Router `redirect()` | TC-E1-P2-03 | Component + E2E |
| 7 | Active item derived from TanStack Router pathname (no internal state) | TC-E1-P1-01 (active state) | Component |
| 8 | Keyboard navigation, Spanish `aria-label`s, preserved focus rings (WCAG 2.1 AA) | aria-label assertions | Component |
| 9 | `pnpm run test` green, `pnpm run build` clean, bundle ≤500 KB gz | Manual build gate | Build |

---

## Failing Tests Created (RED Phase)

### Component Tests — Vitest + @testing-library/react (13 tests)

**File 1:** `frontend/src/app/layout/AppShell.test.tsx`

Covers TC-E1-P1-01 (SPA navigation + active state), TC-E1-P1-04 (404 view + recovery link), TC-E1-P2-03 (index redirect), plus AC #8 aria-label and AC #1 productName.

- TC-E1-P1-01 — `navigates from "/" → "/clientes" via the rail without a full page reload`
  - Status: **RED** — `AppShell` module does not yet exist (import resolution fails)
- TC-E1-P1-01 — `active item reflects current pathname (Clientes active on /clientes)`
  - Status: **RED** — same as above; active-state wiring not yet implemented
- TC-E1-P1-01 — `active item reflects current pathname (Contactos active on /contactos)`
  - Status: **RED** — same as above
- TC-E1-P2-03 — `"/" redirects to "/clientes" via TanStack Router (no window.location)`
  - Status: **RED** — `AppShell` + redirect wiring not yet implemented
- TC-E1-P1-04 — `unknown route renders NotFoundView inside the AppShell layout`
  - Status: **RED** — `NotFoundView` module does not yet exist
- TC-E1-P1-04 — `NotFoundView exposes a Spanish "Ir a Clientes" link back to /clientes`
  - Status: **RED** — recovery link not implemented
- AC #8 — `navigation items expose Spanish aria-labels for WCAG 2.1 AA`
  - Status: **RED** — aria-labels not yet emitted
- AC #1 — `renders productName "Siesa Agents" on the LayoutBase navbar`
  - Status: **RED** — `LayoutBase` not yet wired

**File 2:** `frontend/src/app/layout/AppShellResponsive.test.tsx`

Covers TC-E1-P2-01 (desktop rail at 1280px) and TC-E1-P2-02 (mobile bar at 375px) via Tailwind class assertions.

- TC-E1-P2-01 — `at 1280px the desktop rail container renders with "lg:block" wrapper`
  - Status: **RED** — `data-testid="shell-rail-container"` not yet emitted
- TC-E1-P2-01 — `at 1280px the mobile NavigationBar wrapper carries "lg:hidden"`
  - Status: **RED** — `data-testid="shell-mobile-nav"` not yet emitted
- TC-E1-P2-02 — `at 375px the mobile NavigationBar wrapper is rendered with "lg:hidden"`
  - Status: **RED** — same as above
- TC-E1-P2-02 — `at 375px the desktop rail wrapper still uses "hidden lg:block"`
  - Status: **RED** — wrapper not yet implemented
- AC #2 — `mobile NavigationBar exposes Clientes/Contactos items with Spanish aria-labels`
  - Status: **RED** — items not yet emitted

### E2E Tests — Playwright (8 tests)

**File:** `e2e/tests/foundation/navigation-shell.spec.ts`

Covers TC-E1-P1-02 / TC-E1-P1-03 (deep links), plus E2E coverage of `/` redirect, 404 view, recovery link, SPA no-reload, and responsive surfaces. Network-first observers registered before each `page.goto`.

- TC-E1-P1-02 — `direct URL load of /clientes renders the ClientesPlaceholderView inside the shell`
  - Status: **RED** — `/clientes` route does not exist yet (404)
- TC-E1-P1-03 — `direct URL load of /contactos renders the ContactosPlaceholderView inside the shell`
  - Status: **RED** — `/contactos` route does not exist yet (404)
- AC #1 — `SPA navigation from /clientes → /contactos does NOT trigger a full page reload`
  - Status: **RED** — rail not implemented
- AC #6 — `direct URL load of "/" redirects to "/clientes" via TanStack Router`
  - Status: **RED** — index route still renders the temporary landing page from Story 1.1
- AC #5 — `unknown route renders the Spanish NotFoundView inside the shell layout`
  - Status: **RED** — `notFoundComponent` not yet wired
- AC #5 — `clicking "Ir a Clientes" from the NotFoundView returns to /clientes via SPA navigation`
  - Status: **RED** — recovery link not yet implemented
- AC #1 — `desktop viewport (≥1024px) shows the NavigationRailGroup container`
  - Status: **RED** — `shell-rail-container` not yet emitted
- AC #2, FR29 — `mobile viewport (<1024px) shows the bottom NavigationBar`
  - Status: **RED** — `shell-mobile-nav` not yet emitted

---

## Data Factories Created

**None.** Story 1.2 is pure UI shell composition + routing. There are no domain entities, API contracts, or seed data to fabricate at this point — `clientes` / `contactos` placeholder views render no real data (full lists land in Epic 2 / Epic 3). No `@faker-js/faker` dependency was added.

---

## Fixtures Created

**None new.** The existing `e2e/fixtures/base.fixture.ts` already provides `clientesPage` / `contactosPage` navigation fixtures and is sufficient for downstream stories. Story 1.2 tests use the in-memory TanStack Router builder (`buildTestRouter`) inlined in each component test file — this is the canonical pattern for router-coupled component tests and does not warrant a shared fixture until a second consumer appears.

---

## Mock Requirements

**None.** No external services. All routing happens in-memory in component tests; E2E tests hit the Vite dev server only (no backend calls in this story).

---

## Required `data-testid` Attributes (Implementation Contract)

| Test ID exposed by | Attribute | Purpose |
|---|---|---|
| Existing (Story 1.1) | `app-root` | Outermost shell wrapper; must survive SPA navigation |
| **NEW** — `AppShell.tsx` | `shell-rail-container` | Desktop rail wrapper (`hidden lg:block`) |
| **NEW** — `AppShell.tsx` | `shell-mobile-nav` | Mobile NavigationBar wrapper (`lg:hidden fixed bottom-0 ...`) |
| **NEW** — placeholder routes | `clientes-view` / `contactos-view` | (Optional helper) placeholder root nodes — component tests use them; production placeholder views can use `<h1>` heading queries instead |

**Required ARIA labels (Spanish):**

- `aria-label="Ir a Clientes"` on every Clientes navigation entry (rail + bar)
- `aria-label="Ir a Contactos"` on every Contactos navigation entry (rail + bar)
- `aria-label="Navegación principal"` on the mobile `NavigationBar` (already wired in the story's reference skeleton)

**Active state contract:** The implementation may expose the active nav entry via `aria-current="page"` OR `data-active="true"` (whichever `siesa-ui-kit` emits). Tests accept either.

---

## Implementation Checklist (RED → GREEN)

### 1. Make `AppShell` component tests pass

- [ ] Create `frontend/src/app/layout/useShellNavigation.ts` (per Dev Notes skeleton: derives `activeId` from `useRouterState`, exposes `onNavigate`).
- [ ] Create `frontend/src/app/layout/AppShell.tsx` rendering:
  - `<div data-testid="app-root">` as outer wrapper
  - `<div data-testid="shell-rail-container" className="hidden lg:block">` wrapping `<LayoutBase productName="Siesa Agents" navigationItems={…} locale="es">{children}</LayoutBase>`
  - `<div data-testid="shell-mobile-nav" className="lg:hidden fixed bottom-0 inset-x-0 z-40">` wrapping the `NavigationBar`
  - Both rail and bar items expose `aria-label="Ir a Clientes"` / `"Ir a Contactos"`
  - Active state wired from `useShellNavigation().activeId` (use `aria-current="page"` if `siesa-ui-kit` does not already emit `data-active`)
- [ ] Install `@heroicons/react` via `pnpm add @heroicons/react` (used for `UsersIcon`/`UserIcon`).
- [ ] Run: `pnpm --filter frontend test src/app/layout/AppShell.test.tsx`
- [ ] ✅ All 8 tests in `AppShell.test.tsx` pass (green)

### 2. Make `AppShellResponsive` tests pass

- [ ] Confirm `data-testid="shell-rail-container"` carries Tailwind classes `hidden` + `lg:block`.
- [ ] Confirm `data-testid="shell-mobile-nav"` carries Tailwind classes `lg:hidden` + `fixed` + `bottom-0`.
- [ ] Mobile NavigationBar exposes Clientes/Contactos items with the required Spanish `aria-label`s.
- [ ] Run: `pnpm --filter frontend test src/app/layout/AppShellResponsive.test.tsx`
- [ ] ✅ All 5 tests in `AppShellResponsive.test.tsx` pass (green)

### 3. Make `NotFoundView` tests pass

- [ ] Create `frontend/src/shared/components/NotFoundView.tsx` with:
  - Heading: `"Página no encontrada"` (Spanish, h1 or h2 — `getByText` is content-based)
  - Body: `"La ruta solicitada no existe."`
  - TanStack Router `<Link to="/clientes">Ir a Clientes</Link>` styled with brand primary color
- [ ] Wire it as `notFoundComponent` on the root route in `src/routes/__root.tsx`.

### 4. Make routing tests pass (TC-E1-P1-02, TC-E1-P1-03, TC-E1-P2-03)

- [ ] Modify `src/routes/__root.tsx`: render `<AppShell><Outlet /></AppShell>` and add `notFoundComponent: NotFoundView`.
- [ ] Replace `src/routes/index.tsx` body with `beforeLoad: () => { throw redirect({ to: '/clientes' }) }` (remove the temporary "Aplicación inicializada correctamente" landing).
- [ ] Create `src/routes/clientes.tsx` exporting `createFileRoute('/clientes')({ component: ClientesPlaceholderView })`.
- [ ] Create `src/routes/contactos.tsx` exporting `createFileRoute('/contactos')({ component: ContactosPlaceholderView })`.
- [ ] Create `src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` rendering `<h1>Clientes</h1>` + Skeleton placeholders. SSR-safe (no `window` outside `useEffect`).
- [ ] Create `src/modules/crm/contactos/presentation/ContactosPlaceholderView.tsx` rendering `<h1>Contactos</h1>` + Skeleton placeholders.
- [ ] Run E2E: `pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts`
- [ ] ✅ All 8 tests in `navigation-shell.spec.ts` pass (green)

### 5. Build gate (AC #9)

- [ ] `pnpm --filter frontend run lint` — zero warnings introduced
- [ ] `pnpm --filter frontend run test` — full suite green
- [ ] `pnpm --filter frontend run build` — `tsc -b && vite build` exits 0
- [ ] Main chunk ≤ 500 KB gzipped (Vite prints the table)

---

## Running Tests

```bash
# Full frontend component test suite (Vitest)
pnpm --filter frontend run test

# Only the new Story 1.2 component tests
pnpm --filter frontend run test src/app/layout

# Watch mode while iterating in dev
pnpm --filter frontend run test:watch -- src/app/layout

# Full E2E suite (requires frontend dev server — Playwright spins it up via webServer config)
pnpm exec playwright test

# Only the new Story 1.2 E2E suite
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts

# E2E in headed mode (debug visually)
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --headed

# E2E debug single test
pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- [x] All component tests written and failing (verified — `Failed to resolve import "./AppShell"` and `"../../shared/components/NotFoundView"` confirm tests run for the right reason: implementation modules are absent).
- [x] All E2E tests written; they will fail at the first locator assertion until routes / shell exist.
- [x] No fixtures / factories needed beyond what already exists.
- [x] `data-testid` contract documented above.
- [x] Implementation checklist drafted.

### GREEN Phase (DEV Team — next step)

1. Work the implementation checklist top-down (sections 1 → 5).
2. Run the matching test file after each implementation step — do not move on until that section is green.
3. Keep commits aligned with the Story 1.2 task breakdown (~1 commit per Task).

### REFACTOR Phase (after green)

1. Extract any duplicated nav-item construction between rail and bar into a small helper.
2. Verify bundle stays under 500 KB gzipped after icon imports.
3. Re-run full suite (`pnpm --filter frontend run test && pnpm exec playwright test`) to confirm no regressions.

---

## Test Execution Evidence (RED Phase Verification)

**Command:** `pnpm --filter frontend run test -- src/app/layout`

**Result excerpt:**

```
FAIL  src/app/layout/AppShell.test.tsx
  Error: Failed to resolve import "../../shared/components/NotFoundView" from
  "src/app/layout/AppShell.test.tsx". Does the file exist?

FAIL  src/app/layout/AppShellResponsive.test.tsx
  Error: Failed to resolve import "./AppShell" from
  "src/app/layout/AppShellResponsive.test.tsx". Does the file exist?

 Test Files  2 failed | 2 passed (4)
      Tests  6 passed (6)
```

Failures are **for the right reason**: the implementation modules (`AppShell.tsx`, `NotFoundView.tsx`) do not yet exist. Once Tasks 1-4 of Story 1.2 are implemented, all 13 component tests + 8 E2E tests will move to GREEN.

---

## Notes

- All tests are written in Given-When-Then format with explicit comments.
- Selector strategy: `data-testid` > `getByRole`/`aria-label` > content (`getByText`). No CSS selectors; no hard waits.
- E2E tests register network-first observers (`page.waitForResponse(...)`, `page.on('load')`) **before** `page.goto()`.
- The component test file uses an in-memory `createMemoryHistory` to drive deterministic routing scenarios, mirroring how the production `src/routes/__root.tsx` + `src/routes/index.tsx` will behave once Tasks 1-4 land.
- The active-state assertion accepts either `aria-current="page"` or `data-active="true"` because the contract is "whichever `siesa-ui-kit` exposes" per the story.
- `@testing-library/user-event` is not installed in this project; tests use RTL's lower-level `fireEvent.click` wrapped in `act()`. This stays inside the "no new dev deps" constraint from the story.

---

## Knowledge Base References Applied

- `network-first.md` — intercept/listen before `page.goto`
- `selector-resilience.md` — `data-testid` + ARIA selector hierarchy
- `test-quality.md` — Given-When-Then structure, deterministic in-memory router, explicit waits via `waitFor` / `findBy*`
- `component-tdd.md` — red-green-refactor for component shells, provider isolation via inline router
- `test-levels-framework.md` — E2E reserved for deep-link / no-reload contract; component tests own the structural surface
