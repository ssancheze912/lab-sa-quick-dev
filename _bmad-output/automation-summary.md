# Automation Summary — Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-08
**Story:** 1.2 (Epic 1: Project Foundation & Application Shell)
**Mode:** BMad-Integrated (expanding existing ATDD coverage)
**Coverage Target:** critical-paths + edge cases
**Story status:** done

---

## Context

ATDD baseline was already implemented and green (17/17 Vitest + 13/13
Playwright E2E in `e2e/tests/foundation` for Story 1.2). This automate pass
expands coverage with edge cases, negative paths and browser-state edges
that the ATDD intentionally left out. **No ATDD test was regenerated or
modified** (per the BMad automate principle).

### ATDD baseline preserved (NOT regenerated)

- `e2e/tests/foundation/deep-linking.spec.ts` — 6 tests (AC #3, #4)
- `e2e/tests/foundation/spa-navigation.spec.ts` — 7 tests (AC #1, #2, #5, #6, #7)
- `frontend/src/shared/components/AppShell.test.tsx` — 8 tests (AC #1, #2, #6, #7)
- `frontend/src/routes/notFound.test.tsx` — 4 tests (AC #4, #7)
- `frontend/src/routes/indexRedirect.test.tsx` — 1 test (AC #5)

---

## New automation generated in this pass

### Playwright E2E edges (new)

**File:** `e2e/tests/foundation/spa-navigation.edge.spec.ts` (6 tests, ~166 lines)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P1 | Browser back after SPA navigation preserves window sentinel (no reload) | #1 |
| 2 | P1 | Active marker flips on round-trip /clientes → /contactos → /clientes | #6 |
| 3 | P2 | Clicking the already-active Clientes entry is a no-op (no JS error) | #1 |
| 4 | P1 | Mobile bar exposes `aria-current` on Contactos when deep-linking | #2, #6 |
| 5 | P1 | Mobile tap from /contactos to /clientes flips active marker | #2, #6 |
| 6 | P2 | Index redirect + SPA back + forward does not loop | #5 |

**File:** `e2e/tests/foundation/deep-linking.edge.spec.ts` (7 tests, ~115 lines)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P2 | Deep link `/clientes?foo=bar` still renders Clientes view | #3 |
| 2 | P2 | Deep link `/contactos#section` still renders Contactos view | #3 |
| 3 | P1 | `/clientes-fake` does NOT match `/clientes`; shows NotFound | #4 |
| 4 | P2 | Multi-segment unknown `/foo/bar/baz` resolves to NotFound | #4 |
| 5 | P0 | NotFound CTA "Ir a Clientes" navigates back via SPA (no full reload) | #4 + #1 |
| 6 | P2 | NotFound keeps shell visible on mobile viewport too | #2 + #4 |
| 7 | P2 | NotFound for URL-encoded special-character path | #4 |

### Vitest component edges (new)

**File:** `frontend/src/shared/components/AppShell.edge.test.tsx` (7 tests, ~210 lines)

| # | Priority | Test | AC |
|---|----------|------|----|
| 1 | P1 | Desktop: aria-current flips when navigating mid-test | #6 |
| 2 | P2 | Desktop: no aria-current on any button when pathname is unknown | #6 |
| 3 | P2 | Desktop: exactly ONE "Clientes" label inside the nav wrapper (single source of truth) | #1 |
| 4 | P1 | Desktop: nested AppShell (NotFound pattern) does NOT duplicate wrapper testid | #4 |
| 5 | P1 | Mobile: tapping nav item does NOT reassign `window.location` (FR28 parity) | #2 |
| 6 | P1 | Mobile: aria-current is stamped on the active mobile bar entry | #2, #6 |
| 7 | P2 | Mobile viewport renders only the mobile wrapper (no desktop leakage) | #2 |

---

## Test execution

### Vitest (frontend component + route tests)

```bash
cd frontend && pnpm test --run
```

**Result:** 24 passed / 24 total (3.7s)

Breakdown:
- `apiClient.test.ts` — 2 passed (pre-existing, Story 1.1)
- `queryClient.test.ts` — 1 passed (pre-existing, Story 1.1)
- `AppShell.test.tsx` — 8 passed (ATDD, Story 1.2)
- `notFound.test.tsx` — 4 passed (ATDD, Story 1.2)
- `indexRedirect.test.tsx` — 1 passed (ATDD, Story 1.2)
- `AppShell.edge.test.tsx` — 7 passed **NEW**

### Playwright E2E (foundation suite)

```bash
pnpm exec playwright test --project=chromium e2e/tests/foundation/spa-navigation.edge.spec.ts e2e/tests/foundation/deep-linking.edge.spec.ts
```

**Result:** 13 passed / 13 total (17.8s) on the first run, no healing needed.

---

## Coverage analysis

| AC | ATDD coverage | Automate expansion |
|----|---------------|---------------------|
| AC #1 (Desktop SPA, no reload) | click rail → SPA nav | browser back preserves SPA; round-trip flip; click active is no-op |
| AC #2 (Mobile bar) | bar visible, tap nav | mobile FR28 parity (no `window.location`); active state on mobile; mobile-only wrapper isolation |
| AC #3 (Deep linking) | direct URL → view renders | query string + hash fragment preserved; partial-match (`/clientes-fake`) isolation |
| AC #4 (404) | NotFound visible + Spanish copy + CTA | CTA is SPA (no reload); multi-segment & special-character paths; nested-AppShell no duplicate testid |
| AC #5 (Index redirect) | `/` → `/clientes` | redirect + back + forward does not loop |
| AC #6 (Active state) | active marker on /clientes | active flip mid-nav (desktop & mobile); no marker on unknown route |
| AC #7 (Spanish a11y) | ariaLabel "Navegación principal"/"inferior" | (already comprehensively covered by ATDD — no expansion needed) |

---

## Quality checks

- ✅ All new tests follow Given/When/Then with comments
- ✅ All new tests tagged with `[P0]`/`[P1]`/`[P2]` in test name
- ✅ All new tests deterministic — no `waitForTimeout`, no conditional flow
- ✅ All new tests self-contained — no shared state between tests
- ✅ No page objects (per BMad rule)
- ✅ All test files under 300 lines
- ✅ Sandbox constraint honored — `--project=chromium` only
- ✅ Foundation E2E suite green: 13/13 new edge tests in 17.8s
- ✅ Vitest suite green: 24/24 in 3.7s
- ✅ No test required `test.fixme()` — all healing iterations: 0

## DoD

- [x] Edge cases added on top of ATDD (not duplicated)
- [x] Negative paths covered (`/clientes-fake`, multi-segment unknown, URL-encoded, click-active no-op)
- [x] Browser-state edges covered (back/forward, redirect loop guard)
- [x] Mobile FR28 parity covered (window.location spy on mobile bar)
- [x] AC #6 mobile parity covered (aria-current on mobile bar)
- [x] All generated tests pass on first run
- [x] No test required `test.fixme()`
- [x] Automation summary written to `_bmad-output/automation-summary.md`

## Next steps

1. Story 1.2 status is `done` — automate phase complete
2. Continue with `testarch-trace` and quality gate for the story
3. Foundation suite total: 50 tests (ATDD 17 Vitest + 13 ATDD E2E + 13 new E2E + 7 new Vitest)
