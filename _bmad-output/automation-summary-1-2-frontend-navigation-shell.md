# Automation Summary — Story 1.2: Frontend Navigation Shell

**Date:** 2026-07-06
**Story:** 1.2 — Frontend Navigation Shell
**Epic:** 1 — Project Foundation & Application Shell
**Mode:** BMad-Integrated (expansion of existing ATDD suite)
**Coverage Target:** critical-paths + edge cases

## Context

ATDD tests already existed and were GREEN (8/8 Vitest component tests, 6/6 Playwright E2E across chromium + mobile-chrome per the story's Dev Agent Record):

- `frontend/src/shared/components/AppNavigation.test.tsx` (AC1, AC2, AC6 — happy paths)
- `frontend/src/app/routing.test.tsx` (AC4, AC5 — component-level happy paths)
- `e2e/tests/foundation/navigation-shell.spec.ts` (AC3, AC4 — deep-link/redirect happy paths)

This workflow expanded coverage with edge cases, negative paths, and boundary conditions the ATDD suite did not exercise, focusing on: default active-item state, mobile (bar) navigation, real-browser CSS breakpoint behavior, nested unknown routes, and click-driven active-state updates end to end.

## Tests Created

### Component Tests (P1–P2, Vitest + RTL)

- `frontend/src/shared/components/AppNavigation.edge-cases.test.tsx` (5 tests)
  - [P1] Default landing route (`/clientes`) marks Clientes active / Contactos inactive in the rail
  - [P1] Default landing route marks Clientes active / Contactos inactive in the bar
  - [P1] Clicking a **NavigationBar** (mobile) item triggers router navigation — ATDD only asserted this for the rail
  - [P2] Re-clicking the already-active rail item is a safe no-op (route unchanged, no error)
  - [P2] Regression guard: exactly 2 buttons render in each of the rail/bar containers

- `frontend/src/app/routing.edge-cases.test.tsx` (4 tests, 1 `test.skip()`)
  - [P2] Deep link with a query string (`/clientes?ref=email`) still renders Clientes with no redirect
  - [P2] **`test.skip()`** — nested unknown path (`/clientes/no-existe`) — see Findings below
  - [P2] Nav shell stays mounted for a nested unknown path (passes; asserts the actual framework-default fallback text)
  - [P1] Regression guard: deep link to `/contactos` does NOT redirect to `/clientes`

### E2E Tests (P1–P2, Playwright)

- `e2e/tests/foundation/navigation-shell-edge-cases.spec.ts` (5 tests)
  - [P1] Desktop viewport (1280px): rail visible, bar hidden — **real computed CSS**, not just Tailwind class names (jsdom in the ATDD component tests never applies real CSS, so the breakpoint itself was never actually verified until now)
  - [P1] Mobile viewport (375px): bar visible, rail hidden — real computed CSS
  - [P2] Boundary condition: exactly at the `lg: 1024px` breakpoint, rail is the one shown
  - [P1] Genuinely unknown top-level route (`/ruta-que-no-existe`) in a real browser: graceful Spanish not-found message, nav stays visible, zero `pageerror` events
  - [P2] Click-driven navigation end to end: clicking "Contactos" from "Clientes" updates `aria-current="page"` on the correct item in a real browser

**Total new tests: 14** (5 component + 4 routing-component + 5 E2E), of which 13 pass and 1 is `test.skip()` with a documented finding (see below). E2E tests run across chromium + mobile-chrome = 10 executed E2E instances, all passing after 1 healing iteration.

## Infrastructure

No new fixtures/factories were required — this story has no data-layer entities (pure navigation/routing shell). Existing `e2e/fixtures/base.fixture.ts` was reviewed and left unchanged. `e2e/README.md` and root `package.json` (`test:e2e`, `test:e2e:p0`, `test:e2e:p1`) already cover the new spec file via existing priority-grep scripts — no changes needed. `frontend/package.json`'s `"test": "vitest run"` auto-discovers the two new component test files — no changes needed.

## Test Healing Report

**Auto-Heal Enabled:** `config.tea_use_mcp_enhancements = false` → pattern-based healing (no MCP tools)
**Iterations Allowed:** 3

### Validation Results (initial run)

- **Component tests:** 9 tests generated (5 `AppNavigation.edge-cases.test.tsx` + 4 `routing.edge-cases.test.tsx`) — 2 failed on first run (both in the nested-unknown-path `describe` block), 7 passed.
- **E2E tests:** 5 tests × 2 browser projects = 10 instances — 9 passed on first run, 1 failed (mobile-chrome only).

### Healing Outcomes

**Successfully Healed (1 test, 1 iteration):**

- `e2e/tests/foundation/navigation-shell-edge-cases.spec.ts` — the AC5 "unknown top-level route" test asserted `nav-rail-container` was visible, but on the `mobile-chrome` project (Pixel 5 emulation, viewport <1024px) the **bar**, not the rail, is the visible container by design — this was a test-authoring bug (an unstated cross-project viewport assumption), not a product defect. **Fix:** pinned the viewport explicitly with `page.setViewportSize({ width: 1280, height: 800 })` before navigating, making the assertion deterministic regardless of which Playwright project runs it. Re-ran on both `chromium` and `mobile-chrome` — passes on both.

**Unable to Heal / Product-Behavior Finding (1 test, marked `test.skip()` — Vitest has no `test.fixme()` API):**

- `frontend/src/app/routing.edge-cases.test.tsx` — "nested unknown path shows the not-found message" (`/clientes/no-existe`).
  - **Attempt 1:** Asserted `/página no encontrada/i` (the styled `NotFoundView` copy) — failed. Actual rendered text is TanStack Router's built-in plain-text `"Not Found"` fallback.
  - **Attempt 2:** Considered loosening the assertion to accept either string — rejected, since that would mask a real UX inconsistency rather than verify AC5's "displayed gracefully" intent.
  - **Attempt 3:** Confirmed via a companion test (which does pass) that the nav shell **does** stay mounted for this nested case — only the fallback content itself differs.
  - **Root cause (out of automate's scope to fix — it is a product code change, not a test issue):** `frontend/src/routes/_app.tsx` does not register its own `notFoundComponent`. TanStack Router's fuzzy not-found resolution renders the closest matched ancestor's fallback; for paths sharing a prefix with a real route (e.g. `/clientes/no-existe`), that is the unstyled TanStack default inside the `_app` layout — not the root route's custom Spanish `NotFoundView`, which only fires for *fully* unmatched top-level paths (as already documented in the story's Dev Agent Record for `/ruta-que-no-existe`).
  - **Recommendation:** add `notFoundComponent: NotFoundView` to `_app.tsx`'s route definition (mirroring the root route) so nested unmatched paths get the same graceful, Spanish-language UX. Flagged for the dev/code-review agent — not applied here since `*automate` only generates tests.

### Knowledge Base References Applied

- `test-levels-framework.md` — Component vs E2E level selection (CSS breakpoint reality requires a real browser, not jsdom)
- `test-priorities-matrix.md` — P1 for default-state/cross-viewport regressions, P2 for boundary/idempotency checks
- `test-quality.md` / `network-first.md` — Given-When-Then, no hard waits, deterministic viewport pinning, `data-testid`/role selectors preserved

## Coverage Analysis

**Coverage Status:**

- All 6 story ACs already had P0/P1 happy-path coverage from ATDD (unchanged, still GREEN).
- ✅ AC6 default-state gap closed: only `/contactos` was previously asserted as "active"; `/clientes` (the actual landing route) is now covered too.
- ✅ AC2 gap closed: NavigationBar click-driven navigation is now asserted (ATDD only asserted the rail).
- ✅ AC1/AC2 gap closed: the `lg: 1024px` responsive breakpoint is now verified against **real computed CSS** in a real browser (chromium + mobile-chrome), including the exact boundary value — the ATDD component tests only checked Tailwind class *names* in jsdom, which never actually applies CSS rules.
- ✅ AC5 gap partially closed: a genuinely unknown top-level route is now verified end-to-end in a real browser (not just jsdom); a **product-behavior gap** was discovered for nested unknown paths (see Findings above) and documented rather than silently patched.
- ⚠️ Not covered (out of scope): keyboard-only navigation (Tab/Enter) through nav items — no AC requires it explicitly; candidate for a future accessibility-focused story.

## Definition of Done

- [x] All tests follow Given-When-Then format
- [x] All tests have priority tags (`[P1]`/`[P2]`) in the test name
- [x] E2E tests use `data-testid`/role selectors, no hard waits, viewport pinned for determinism
- [x] No page object classes introduced
- [x] Component tests use the same router-harness pattern as the ATDD suite (no duplicated setup logic beyond what's needed for isolation)
- [x] Test files under 300 lines
- [x] 13/14 new tests pass; 1 marked `test.skip()` with a fully documented product-behavior finding (not silently weakened)
- [x] README / package.json scripts already cover new files (no changes required)
- [x] No duplicate coverage introduced (E2E reserved for real-browser-only concerns: CSS breakpoints, cross-page click flows, error events)

## Next Steps

1. Route the `_app.tsx` `notFoundComponent` finding to the dev/code-review agent for a product-code fix, then un-skip `routing.edge-cases.test.tsx`'s nested-unknown-path test.
2. Run full suite in CI: `npm run test:e2e` (E2E) and `pnpm --filter frontend test` (component).
3. Proceed to `bmad tea *trace` / quality gate for Epic 1 once all epic stories are automated.
