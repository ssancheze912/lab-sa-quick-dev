# ATDD Checklist — Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-07-03
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright) + Component (Vitest+RTL)

---

## Story Summary

Story 1.2 introduces the persistent navigation shell (siesa-ui-kit `LayoutBase` + `NavigationRail` on desktop, `NavigationBar` on mobile), file-based TanStack Router routes for `/clientes` and `/contactos` placeholders, a global 404 fallback, and an in-app redirect from `/` to `/clientes`.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device.

---

## Acceptance Criteria

1. **AC #1** — Desktop shell renders siesa-ui-kit `LayoutBase` (Navbar 64px + `NavigationRailGroup` 80px) with `productName="Siesa Agents"` and two entries (`Clientes` / `Contactos`) using Heroicons. Clicking navigates via `useNavigate()` — no full page reload (FR28).
2. **AC #2** — Mobile viewport (< 1024px, min 375px) hides the rail and shows siesa-ui-kit `NavigationBar` (bottom nav) with 44px min tap targets, Spanish `aria-label`s, and client-side navigation (FR29).
3. **AC #3** — Deep linking `/clientes` and `/contactos` renders each placeholder view directly with an `<h1>` in Spanish; no redirect to `/` (FR30).
4. **AC #4** — Unknown route renders a `NotFoundView` inside the persistent shell with Spanish copy and a back-to-Clientes button.
5. **AC #5** — `/` redirects in-app to `/clientes` via TanStack Router `beforeLoad → throw redirect(...)`.
6. **AC #6** — `siesa-ui-kit/styles.css` imported once from `src/index.css`; UI renders with Siesa brand tokens.
7. **AC #7** — `pnpm exec tsc -b` from `frontend/` emits zero errors with `strict`, `noImplicitAny`, `strictNullChecks` active.
8. **AC #8** — Vitest suite passes: TC-E1-P1-01, TC-E1-P1-04, TC-E1-P2-01, TC-E1-P2-02, TC-E1-P2-03.

---

## Failing Tests Created (RED Phase)

### E2E Tests (24 test cases × 4 Playwright projects = 96 runs)

**File:** `e2e/tests/foundation/navigation-shell.spec.ts` (~380 lines)

Covers ACs #1–#5 in real browsers via the existing Playwright projects (chromium, firefox, edge, mobile-chrome). Desktop-only tests skip in `mobile-chrome`; mobile-only tests skip in the desktop projects.

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 1 | should mount the persistent AppShell wrapper | RED — `data-testid="app-shell"` not present | AC #1 |
| 2 | should render NavigationRail visible on desktop | RED — `data-testid="nav-rail"` not present | AC #1, TC-E1-P2-01 |
| 3 | should display "Siesa Agents" product name in the Navbar | RED — LayoutBase not mounted | AC #1 |
| 4 | should render the "Clientes" navigation entry in the NavigationRail | RED — no Clientes control in rail | AC #1 |
| 5 | should render the "Contactos" navigation entry in the NavigationRail | RED — no Contactos control in rail | AC #1 |
| 6 | should navigate to /contactos without a full page reload (TC-E1-P1-01) | RED — /contactos route absent | AC #1, TC-E1-P1-01 |
| 7 | should preserve the SPA sentinel after clicking Contactos (no reload) | RED — nav item missing | AC #1, TC-E1-P1-01 |
| 8 | should render the Contactos placeholder view after navigation | RED — `data-testid="contactos-view"` not present | AC #1, AC #3 |
| 9 | should render the mobile NavigationBar wrapper | RED — `data-testid="nav-bar"` not present | AC #2, TC-E1-P2-02 |
| 10 | should hide the desktop NavigationRail on mobile viewport | RED — rail visible/absent semantics | AC #2, TC-E1-P2-02 |
| 11 | should render the "Clientes" NavigationBar item | RED — nav-bar not present | AC #2 |
| 12 | should render the "Contactos" NavigationBar item | RED — nav-bar not present | AC #2 |
| 13 | should enforce a minimum tap target height of 44px on NavigationBar items | RED — nav-bar not present | AC #2 |
| 14 | should navigate via NavigationBar without a full page reload | RED — nav-bar not present | AC #2 |
| 15 | should render Clientes view when opening /clientes directly (TC-E1-P1-02) | RED — route + view missing | AC #3, TC-E1-P1-02 |
| 16 | should render Contactos view when opening /contactos directly (TC-E1-P1-03) | RED — route + view missing | AC #3, TC-E1-P1-03 |
| 17 | should show the Clientes h1 heading in Spanish on deep link | RED — view missing | AC #3 |
| 18 | should show the Contactos h1 heading in Spanish on deep link | RED — view missing | AC #3 |
| 19 | should render NotFoundView for unknown routes (TC-E1-P1-04) | RED — `notFoundComponent` not wired | AC #4, TC-E1-P1-04 |
| 20 | should keep the persistent AppShell visible on 404 | RED — shell not present | AC #4 |
| 21 | should display the Spanish 404 message | RED — NotFoundView not present | AC #4 |
| 22 | should expose a link back to /clientes from the NotFoundView | RED — component missing | AC #4 |
| 23 | should redirect from `/` to `/clientes` (TC-E1-P2-03) | RED — index still renders landing content | AC #5, TC-E1-P2-03 |
| 24 | should not render any pre-redirect landing content at `/` | RED — `HomeRoute` placeholder still renders | AC #5 |

### Component Tests (Vitest + React Testing Library)

**File:** `frontend/src/shared/components/AppShell.test.tsx` (~140 lines) — 7 tests

- TC-E1-P2-01 — desktop viewport (1280px)
  - should render the desktop `nav-rail` wrapper
  - should mount the persistent `app-shell` wrapper
  - should include a "Clientes" nav entry in the rail
  - should include a "Contactos" nav entry in the rail
- TC-E1-P2-02 — mobile viewport (375px)
  - should render the mobile `nav-bar` wrapper
  - should hide the desktop `nav-rail` wrapper
  - should render two NavigationBar items with Spanish labels

**File:** `frontend/src/test/navigation.test.tsx` (~180 lines) — 8 tests

- TC-E1-P1-01 — SPA nav no reload (3 tests including `window.location.reload` spy)
- TC-E1-P1-04 — 404 within persistent shell (3 tests)
- TC-E1-P2-03 — index redirect to `/clientes` (2 tests)

All Vitest tests fail today because:
- `AppShell`, `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`, `NotFoundView` do not exist yet.
- `routeTree.gen.ts` does not yet include `_app`, `_app/clientes`, `_app/contactos`.
- Vitest jsdom setup (Task 7) is not installed — the runner will error before test execution once tests fail, both are valid RED reasons.

### API Tests

Not applicable for this story — no HTTP endpoints introduced (Epic 2/3 scope).

---

## Data Factories Created

Not applicable — Story 1.2 introduces no domain data. Placeholder views ship with static Spanish copy.

---

## Fixtures Created

Not applicable — the existing `e2e/fixtures/base.fixture.ts` (`clientesPage`, `contactosPage`) already exists and is out of scope for the RED tests here (they use raw `page.goto` for isolation).

---

## Mock Requirements

Not applicable — no external services are called in Story 1.2. All content is static placeholder markup.

---

## Required data-testid Attributes

### AppShell wrapper (`src/shared/components/AppShell.tsx`)

- `app-shell` — outer container that wraps both desktop and mobile shells; MUST persist across route changes (including 404).
- `nav-rail` — desktop wrapper (`hidden lg:block`) around `LayoutBase`. Must be **hidden** at viewports < 1024px.
- `nav-bar` — mobile wrapper (`lg:hidden`) around siesa-ui-kit `NavigationBar`. Must be **hidden** at viewports ≥ 1024px.

### Placeholder route views

- `clientes-view` — `src/routes/_app/clientes.tsx` `<section>` root.
- `contactos-view` — `src/routes/_app/contactos.tsx` `<section>` root.

### 404 view (`src/shared/components/NotFoundView.tsx`)

- `not-found-view` — root container; must contain the Spanish message "La página solicitada no existe" and a link/button "Ir a Clientes" that routes to `/clientes` via TanStack Router `<Link>`.

**Accessibility requirements** (also verified by RED tests):
- Every nav item (rail collapsed AND mobile bar) MUST have a Spanish `aria-label` OR visible Spanish text: `Clientes`, `Contactos`.
- Every mobile nav item MUST have a rendered height ≥ 44px (WCAG 2.1 AA tap target).

---

## Implementation Checklist

### Test 1–8 (AC #1 — Desktop shell): navigation-shell.spec.ts (chromium/firefox/edge)

- [ ] Create `src/shared/components/AppShell.tsx` composing siesa-ui-kit `LayoutBase` with `productName="Siesa Agents"` and Heroicons `UsersIcon` / `UserIcon`.
- [ ] Add `data-testid="app-shell"` on the outer container.
- [ ] Add `data-testid="nav-rail"` on the desktop wrapper (`hidden lg:block`).
- [ ] Wire `navigationRailProps.onItemClick` to `useNavigate()` with `to: '/clientes'` or `to: '/contactos'` — never `window.location.href`.
- [ ] Compute `activeId` from `useRouterState().location.pathname`.
- [ ] Create `src/routes/_app.tsx` — pathless layout rendering `<AppShell><Outlet/></AppShell>`.
- [ ] Register `_app` in the file-based router (auto-generated by `@tanstack/router-plugin`).
- [ ] Run: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium --grep "AC #1"`
- [ ] Expected: all 8 AC #1 tests GREEN.

### Test 9–14 (AC #2 — Mobile shell): navigation-shell.spec.ts (mobile-chrome)

- [ ] Add the mobile wrapper (`lg:hidden`) containing siesa-ui-kit `NavigationBar`.
- [ ] Add `data-testid="nav-bar"` on the mobile wrapper.
- [ ] Ensure NavigationBar items have Spanish `label` AND `ariaLabel` for Clientes / Contactos.
- [ ] Confirm rendered item height ≥ 44px (siesa-ui-kit default is compliant; verify with computed style).
- [ ] Ensure `onItemClick` invokes `navigate({ to: ... })`.
- [ ] Add `pb-16` on the mobile `<main>` so content doesn't sit under the fixed bar.
- [ ] Run: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=mobile-chrome --grep "AC #2"`
- [ ] Expected: all 6 AC #2 tests GREEN.

### Test 15–18 (AC #3 — Deep linking)

- [ ] Create `src/routes/_app/clientes.tsx` with `<section data-testid="clientes-view"><h1>Clientes</h1><p>La gestión de clientes se habilitará en el Epic 2.</p></section>`.
- [ ] Create `src/routes/_app/contactos.tsx` analogously with `<h1>Contactos</h1>` and Spanish copy for Epic 3.
- [ ] Verify `routeTree.gen.ts` regenerates on `pnpm --filter frontend dev` and lists `_app/clientes` + `_app/contactos`.
- [ ] Run: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC #3"`
- [ ] Expected: all 4 AC #3 tests GREEN across all projects.

### Test 19–22 (AC #4 — 404 fallback)

- [ ] Create `src/shared/components/NotFoundView.tsx` — `data-testid="not-found-view"`, Spanish copy `"La página solicitada no existe"`, and a siesa-ui-kit `Button` wrapping TanStack `<Link to="/clientes">Ir a Clientes</Link>`.
- [ ] Wire `notFoundComponent: NotFoundView` on the `_app` route (NOT on `__root`) so the shell persists on 404.
- [ ] Optionally also set `defaultNotFoundComponent` on the router in `main.tsx` as a fallback, but keep the `_app`-level wiring as canonical.
- [ ] Run: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC #4"`
- [ ] Expected: all 4 AC #4 tests GREEN.

### Test 23–24 (AC #5 — Index redirect)

- [ ] Overwrite `src/routes/index.tsx` — remove `HomeRoute` JSX; keep only `createFileRoute('/')({ beforeLoad: () => { throw redirect({ to: '/clientes' }) } })`.
- [ ] Run: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC #5"`
- [ ] Expected: both AC #5 tests GREEN.

### AC #6 (siesa-ui-kit styles) — implicit

- [ ] Add `@import "siesa-ui-kit/styles.css";` to `src/index.css` after the Tailwind import.
- [ ] Add `pnpm --filter frontend add @heroicons/react` for nav icons.
- [ ] Verified indirectly by the "Siesa Agents" product name and NavigationRail rendering in tests 3 + 9.

### AC #7 (TypeScript strict build)

- [ ] Run `pnpm --filter frontend exec tsc -b` from repo root.
- [ ] Expected: exit code 0, zero errors.

### AC #8 (Vitest suite) — Task 7 setup + component tests

- [ ] `pnpm --filter frontend add -D jsdom`.
- [ ] Extend `frontend/vite.config.ts` (or create `vitest.config.ts`) with `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] }`.
- [ ] Create `src/test/setup.ts` importing `@testing-library/jest-dom/vitest` and stubbing `window.matchMedia`.
- [ ] Add `"test": "vitest run"` to `frontend/package.json`.
- [ ] Add `@testing-library/user-event` (used by `frontend/src/test/navigation.test.tsx`): `pnpm --filter frontend add -D @testing-library/user-event`.
- [ ] Run: `pnpm --filter frontend exec vitest run`.
- [ ] Expected: all 15 Vitest tests GREEN.

---

## Running Tests

```bash
# ---- E2E (Playwright) ----
# Full suite for this story (all 4 projects)
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts

# Single project (fast feedback loop)
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium

# Filter by AC
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --grep "AC #3"

# Headed / debug (requires local X server)
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --headed
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --debug

# ---- Vitest ----
# Component + router tests (requires Task 7 setup)
pnpm --filter frontend exec vitest run

# Watch mode
pnpm --filter frontend exec vitest
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 24 Playwright E2E tests written and failing (routes, testids, and components don't exist yet).
- All 15 Vitest tests written and failing (component + router integration).
- Selectors use `data-testid` exclusively — matches the story's Task 1 selector contract.
- Network-first not needed here (no API calls); explicit waits via `expect(locator).toBeVisible()` and `findByTestId`.
- No hard waits, no `page.waitForTimeout` — all deterministic.

### GREEN Phase (DEV Team — Next Steps)

Follow the Implementation Checklist top-to-bottom. Recommended order:

1. Task 1 + Task 2 (AppShell + `_app.tsx`) → unblocks tests 1–5.
2. Task 3 (placeholder routes) → unblocks tests 8, 15–18.
3. Task 4 (index redirect) → unblocks tests 23–24.
4. Task 5 (NotFoundView) → unblocks tests 19–22.
5. Task 6 (tsc verification) → satisfies AC #7.
6. Task 7 (Vitest setup) → unblocks all 15 Vitest tests.
7. Task 8 (E2E deep-link smoke) → subsumed by this ATDD spec.

Work one AC at a time. Run the filtered command after each change:

```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium --grep "AC #<N>"
```

### REFACTOR Phase (DEV Team)

Once all tests pass:

- Extract shared nav-item configuration to a single source (e.g. `src/shared/constants/nav-items.ts`) so desktop rail and mobile bar don't duplicate the Clientes/Contactos definitions.
- Consider a `useActiveNavId` custom hook derived from `useRouterState` to avoid repeating pathname parsing.
- Ensure `NotFoundView` and `_app` fallback are unit-covered.

---

## Knowledge Base References Applied

- **test-quality.md** — one assertion per test, Given-When-Then structure, deterministic waits.
- **selector-resilience.md** — data-testid selectors + ARIA roles as secondary fallback; no CSS class selectors.
- **network-first.md** — not required for Story 1.2 (no XHR intercepts); pattern reserved for Epic 2/3 CRUD.
- **fixture-architecture.md** — reused existing `base.fixture.ts` but did not extend it (auto-cleanup unnecessary for read-only placeholder pages).
- **timing-debugging.md** — no `waitForTimeout`; use `expect(locator).toBeVisible()` and `findByTestId`.
- **component-tdd.md** — provider isolation via `createMemoryHistory` + `createRouter`; jsdom viewport shim documented in Vitest tests.

---

## Test Execution Evidence

### Initial Test List (RED Phase Verification)

**Command:** `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --list`

**Result:** 96 tests listed (24 unique × 4 projects). All parse and register with Playwright. Skips resolve at runtime:
- Desktop-only tests: skipped on `mobile-chrome` (6 tests × 1 project = 6 skipped).
- Mobile-only tests: skipped on `chromium`, `firefox`, `edge` (6 tests × 3 projects = 18 skipped).
- Effective runs: 96 − 6 − 18 = 72 executable, all expected RED.

**Vitest command (once Task 7 is complete):**

```bash
pnpm --filter frontend exec vitest run
```

Expected RED for all 15 Vitest tests until AppShell + routes are implemented.

---

## Notes

- Playwright browser binaries are pre-installed at `/opt/pw-browsers` (chromium headless-shell symlinked). Set `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` when running specs.
- `mobile-chrome` project uses Pixel 5 (viewport 393×851, `isMobile: true`) — narrower than the story's 375px minimum, still below the `lg: 1024px` breakpoint so the mobile shell contract is exercised.
- All AC #1 sentinel tests inject `window.__spaReloadSentinel` before the click. If a full-page reload occurred (`window.location.href = ...`), the sentinel would be wiped — this is the fingerprint for FR28 compliance.
- The Vitest `findByRole(/link|button/, { name: /contactos/i })` pattern accommodates both `<Link>` and `<button>`-based nav entries. If the siesa-ui-kit rail renders `<button>` and the mobile bar renders `<a>`, both satisfy the assertion.
- Tests are intentionally free of `screen.debug()` / console noise per test-quality guidance.

---

**Generated by BMad TEA Agent (sa-tea-atdd) — 2026-07-03**
