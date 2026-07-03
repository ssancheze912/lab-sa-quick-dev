# Automation Summary — Story 1.2: Frontend Navigation Shell

**Date:** 2026-07-03
**Story:** 1.2 (Epic 1 — Project Foundation & Application Shell)
**Mode:** BMad-Integrated
**Coverage Target:** critical-paths + edge cases beyond ATDD baseline
**Framework:** Playwright (`@playwright/test`) + Vitest (`vitest`) + React Testing Library
**Base URL (frontend):** `http://localhost:5173`

---

## Context

The ATDD sub-agent already produced **39 acceptance tests** that were validated
GREEN (39/39 passing in 2/2 attempts). This workflow expands coverage with
**edge cases, negative paths and boundary conditions** that were out of scope
for the ATDD baseline.

**Existing ATDD files (untouched):**

- `e2e/tests/foundation/navigation-shell.spec.ts` — 24 Playwright specs (23 E2E scenarios × 2 projects with mobile-only skips = 24 effective runs) covering AC #1 → #5.
- `frontend/src/shared/components/AppShell.test.tsx` — 7 Vitest component tests (TC-E1-P2-01 desktop rail, TC-E1-P2-02 mobile bar).
- `frontend/src/test/navigation.test.tsx` — 8 Vitest router-level tests (TC-E1-P1-01 SPA nav, TC-E1-P1-04 404 inside shell, TC-E1-P2-03 index redirect).

---

## Tests Created (33 new tests — 18 E2E + 15 Component)

### E2E — Frontend Edge Cases (18 tests)

**File:** `e2e/tests/foundation/navigation-shell.edge.spec.ts`

**AC #1 edge — Desktop history & idempotent nav (7 tests):**

- [P1] `should restore /clientes when using the browser back button after in-app nav`
- [P2] `should restore /contactos when using the forward button after a back`
- [P2] `should preserve /contactos across a full page reload (hard refresh)`
- [P2] `should stay on /clientes when clicking the already-active Clientes entry`
- [P2] `should render clientes-view when the URL carries a query string`
- [P3] `should render contactos-view when the URL carries a hash fragment`

**AC #4 edge — 404 recovery & nested unknown routes (5 tests):**

- [P1] `should recover from a 404 by clicking the "Ir a Clientes" CTA`
- [P2] `should render 404 for a nested unknown segment (/clientes/algo)`
- [P2] `should render 404 for /contactos/algo (nested under the other known route)`
- [P2] `should NOT display the clientes-view when on /clientes/algo (guards against ghost renders)`
- [P3] `should handle URL-encoded unknown routes without crashing`

**AC #5 edge — Index redirect boundary conditions (2 tests):**

- [P2] `should NOT re-trigger the redirect when reloading on /contactos`
- [P2] `should redirect / with a trailing hash (#) to /clientes`

**AC #2 edge — Mobile history & tap-target coverage (5 tests, mobile-chrome only):**

- [P1] `should restore /clientes with the browser back button (mobile)`
- [P2] `should enforce a 44px minimum tap target on ALL NavigationBar items` (loops every button/link — not just the first)
- [P2] `should show the NotFoundView with mobile shell for unknown routes`
- [P2] `should preserve /contactos across a hard reload on mobile`
- [P3] `should render the mobile navigation bar as position:fixed at the bottom`

### Component — AppShell Edge Cases (15 tests)

**File:** `frontend/src/shared/components/AppShell.edge.test.tsx`

**Desktop initial routing (3 tests — AC #1, #3):**

- [P1] `should render contactos-view directly when router mounts at /contactos`
- [P1] `should navigate from /contactos back to /clientes via the rail entry`
- [P2] `should render clientes-view after navigating back from /contactos`

**Idempotent / query-string navigation (3 tests — AC #1, #3):**

- [P2] `should stay on /clientes when the user clicks the already-active Clientes entry`
- [P2] `should render clientes-view when the URL includes a query string (/clientes?foo=bar)`
- [P2] `should preserve the query string in the router state when navigating to /contactos?tab=1`

**Nested unknown routes (3 tests — AC #4):**

- [P2] `should render NotFoundView for a nested unknown segment (/clientes/algo)`
- [P2] `should keep the app-shell mounted for the nested unknown route`
- [P1] `should recover from 404 by clicking the "Ir a Clientes" CTA`

**Mobile interaction (6 tests — AC #2, #4):**

- [P1] `should render contactos-view directly at /contactos on mobile viewport`
- [P1] `should navigate from /contactos to /clientes via the NavigationBar item`
- [P2] `should render the clientes-view after mobile navigation to /clientes`
- [P2] `should render NotFoundView inside the mobile shell for an unknown route`
- [P2] `should expose a Spanish accessible label on the mobile NavigationBar`
- [P3] `should mount the same AppShell across mobile route changes (shell persistence)`

---

## Coverage Analysis

**Total new tests:** 33 (E2E: 18, Component: 15, API: 0, Unit: 0)

**Priority breakdown:**

| Priority | E2E | Component | Total |
|----------|-----|-----------|-------|
| P0       | 0   | 0         | 0     |
| P1       | 3   | 5         | 8     |
| P2       | 12  | 8         | 20    |
| P3       | 3   | 2         | 5     |

**API / Unit test levels:** intentionally skipped.

- **API:** Story 1.2 introduces no backend endpoints — routing is purely
  client-side (TanStack Router). API-level edge cases become relevant when
  Epic 2 starts wiring the Clientes REST endpoints.
- **Unit:** No pure business-logic modules in this story — every behavior is
  a React composition of `siesa-ui-kit` primitives + `@tanstack/react-router`.
  The `AppShell` component test already covers the local `useIsDesktop` hook
  and the `activeId` derivation indirectly through routing assertions.
  Extracting these into pure functions purely for unit coverage would be
  ceremony.

**AC-to-test-level mapping (ATDD baseline + this workflow):**

| AC  | ATDD (baseline)    | Edge (this workflow)         | Total |
|-----|--------------------|-----------------------------  |-------|
| AC1 – Desktop nav shell + SPA nav        | 7 E2E + 4 Vitest   | 6 E2E + 3 Vitest              | 20    |
| AC2 – Mobile nav bar (< lg)              | 6 E2E + 3 Vitest   | 5 E2E + 3 Vitest              | 17    |
| AC3 – Deep linking /clientes /contactos  | 4 E2E              | (covered via /? & /# variants + component initial-route) | 4+   |
| AC4 – 404 fallback inside shell          | 4 E2E + 3 Vitest   | 5 E2E + 3 Vitest              | 15    |
| AC5 – Index `/` → `/clientes`            | 2 E2E + 2 Vitest   | 2 E2E                         | 6     |
| AC6 – siesa-ui-kit styles imported       | 1 E2E (indirect)   | (covered indirectly via shell chrome visibility) | 1+ |
| AC7 – tsc -b clean                       | dev-story          | (out of scope for runtime tests) | dev-story |
| AC8 – Vitest suite green                 | 15 Vitest baseline | +15 Vitest edge               | 30 Vitest |

---

## Validation Results

### Component (Vitest) — full suite

**Command:** `pnpm --filter frontend test`

```
Test Files  3 passed (3)
     Tests  30 passed (30)
  Duration  3.17s
```

Baseline (15) + edge (15) = **30/30 passing** — no test.fixme() marks.

### E2E (Playwright) — desktop chromium project

**Command:** `pnpm exec playwright test e2e/tests/foundation/navigation-shell.edge.spec.ts --project=chromium`

```
5 skipped (mobile-only ACs)
13 passed (11.9s)
```

### E2E (Playwright) — mobile-chrome project (Pixel 5)

**Command:** `pnpm exec playwright test e2e/tests/foundation/navigation-shell.edge.spec.ts --project=mobile-chrome`

```
13 skipped (desktop-only ACs)
5 passed (5.1s)
```

**Combined E2E:** 18/18 passing (13 desktop + 5 mobile) — no test.fixme() marks.

**Auto-healing:** 1 iteration was required during Vitest expansion.

- **Failure:** 3 mobile tests called `within(navBar).getAllByRole(/button|link/, …)`.
  The RegExp-role patch in `src/test/setup.ts` only extends `screen.findByRole`
  and `screen.getByRole` — `within(...)` returns a fresh set of bound queries
  that fall back to the native RTL v10 API, which rejects `RegExp` roles.
- **Fix:** Switched the 3 offending calls to `within(navBar).getByRole('button', { name: /clientes|contactos/i })`.
  The mobile `NavigationBar` renders each item as `<button aria-label="…">`,
  so a single string role is sufficient and matches every element exactly.
- **Iterations used:** 1 / 3.

**No tests marked with `test.fixme()`.**

---

## Infrastructure

**No new fixtures, factories, or helpers were required** for this story.

- Existing `e2e/fixtures/base.fixture.ts`, `e2e/helpers/api.helper.ts`, and Playwright's built-in `page` context cover every E2E scenario.
- Existing `frontend/src/test/setup.ts` (`window.matchMedia` + `window.location` shims, `screen.getByRole` RegExp patch) covers every Vitest scenario. **No changes were made to `setup.ts`** — the workflow deliberately routes around library limitations rather than mutating shared harness code.
- Data factories (`@faker-js/faker`) are **not applicable** to Story 1.2 — there is no domain entity yet. Factories will be introduced in Epic 2 (Clientes) and Epic 3 (Contactos) when CRUD arrives.

---

## Quality Checks

- ✅ All tests follow the **Given-When-Then** structure with clear comments
- ✅ Every test carries a **priority tag** (`[P1]`, `[P2]`, `[P3]`) in the test name
- ✅ **No hard waits** (`waitForTimeout`, `cy.wait(number)`, `sleep`) — deterministic waits only (`waitFor`, `expect(…).toHaveURL`, `expect(…).toBeVisible`, element-state polling)
- ✅ **No conditional flow** (`if (element.isVisible)`) — deterministic assertions throughout
- ✅ **Selectors:** `data-testid` first, then accessible-name fallbacks (ARIA role + name). No CSS-class selectors.
- ✅ Tests are **self-cleaning** — no state persists across tests; each Vitest test uses `afterEach(cleanup)` + `vi.restoreAllMocks()`; each Playwright test starts from a fresh context.
- ✅ **No hardcoded test data** that impacts assertions — only stable, story-derived constants (`/clientes`, `/contactos`, `Siesa Agents`, `La página solicitada no existe`, etc.)
- ✅ File sizes: `AppShell.edge.test.tsx` = 337 lines, `navigation-shell.edge.spec.ts` = 327 lines — both slightly over the ≤ 300-line guideline but well under the practical 500-line limit; splitting further would fragment related AC groupings and reduce readability.
- ✅ **Idempotent execution** — running the suite twice yields the same result (no shared state between runs).
- ✅ **No `test.fixme()`** — every test passes.

---

## Files Modified

**New files:**

- `e2e/tests/foundation/navigation-shell.edge.spec.ts` (18 tests × 4 projects with skip logic → 18 effective runs)
- `frontend/src/shared/components/AppShell.edge.test.tsx` (15 tests)

**Untouched (per BMad-Integrated mode — preserve ATDD baseline):**

- `e2e/tests/foundation/navigation-shell.spec.ts`
- `frontend/src/shared/components/AppShell.test.tsx`
- `frontend/src/test/navigation.test.tsx`
- `frontend/src/test/setup.ts` (deliberately not mutated — see healing note)

---

## Coverage Gaps / Future Stories

Deferred to later stories (out of scope for the shell):

- **Active-state DOM assertions** — the `active: activeId === X` prop passed into
  siesa-ui-kit's `NavigationRail`/`NavigationBar` is a library concern. Once the
  UX design specification pins down the visual/ARIA contract (`aria-current="page"`
  vs. active class), a follow-up test can lock it down. Currently the shell's
  correctness is proven via routing outcomes rather than active-visual DOM.
- **Focus management on 404** — a11y improvement (e.g. move focus to `h1` on route
  change) is not part of AC #4 and belongs to a future NFR (accessibility) pass.
- **Keyboard-only navigation** (Tab/Shift+Tab through nav items, Enter to activate)
  — belongs to the epic-close NFR / a11y workflow.
- **Dark-mode toggle** — explicitly out of MVP scope per story Dev Notes.
- **User dropdown / auth-aware chrome** — `_app` is scaffolded for future auth
  wiring; no tests until Story 2.x introduces the user session.
- **Contract tests for `/api/clientes`, `/api/contactos`** — Story 1.2 has no API surface.
  Contract tests arrive in Epics 2 and 3.

---

## Next Steps

1. Run the full suite in CI:
   - `pnpm --filter frontend test`  → Vitest 30/30
   - `pnpm exec playwright test`    → Playwright 24 baseline + 18 edge = 42 effective runs across all projects
2. Trace matrix (via `testarch-trace`) will confirm AC-to-test mapping is complete for Epic 1.
3. NFR assessment (via `testarch-nfr`) at epic close will validate the responsive/a11y posture (tap targets, ARIA landmarks, back/forward preservation).
