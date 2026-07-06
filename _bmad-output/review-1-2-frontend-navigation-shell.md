# Code Review: 1-2-frontend-navigation-shell

- **Date**: 2026-07-06
- **Reviewer**: SiesaTeam (AI Agent — Adversarial Senior Developer)
- **Status**: Complete

## Initial Discovery

- **Undocumented Changes**: `frontend/src/app/routing.edge-cases.test.tsx`, `frontend/src/shared/components/AppNavigation.edge-cases.test.tsx`, and `e2e/tests/foundation/navigation-shell-edge-cases.spec.ts` were created/modified by the later Automate/Test-Review sub-agent phases (commits `d1aed0b`, `d703f25`) but were never added to the story's Dev Agent Record → File List (which reflects only the original dev-story commit `072289a`). Flagged as MEDIUM per Step-03 rule ("Files in Git but not in Story") and fixed by updating the File List.
- **Missing Files**: None — every file declared in the original File List exists in git.
- **Git State**: Clean at review start; all prior phases (ATDD, dev-story, automate, test-review) already committed.

## Review Plan

### Items to Verify
- [x] AC1 — NavigationRail (desktop, `lg:`+), TanStack navigation, no full reload
- [x] AC2 — NavigationBar (mobile), tappable items with `aria-label`
- [x] AC3 — Deep link to `/clientes` / `/contactos` renders directly, no redirect
- [x] AC4 — `/` redirects to `/clientes`
- [x] AC5 — Unknown route shows graceful 404 inside the shell (nav visible, no crash) — **including nested unknown paths**, not just fully-unmatched ones
- [x] AC6 — Active nav item reflects current route (rail + bar)
- [x] Task 4 — Vitest/jsdom test environment configured
- [x] Task 5/6 — Component + E2E tests exist and pass

### Focus Areas
- Routing/404 logic: `frontend/src/routes/__root.tsx`, `frontend/src/routes/_app.tsx`
- Standards compliance: Heroicons-only icon usage, Spanish UI copy, siesa-ui-kit component contracts, Tailwind CSS-only breakpoint strategy (no JS media queries)
- Test quality: cross-check the test-review report's own findings (test-review-1-2-frontend-navigation-shell.md) against actual code

## Verification Evidence

- `pnpm test` (Vitest, jsdom) → **before fix**: 16 passed, 1 skipped. **After fix**: 17 passed, 0 skipped (4 files).
- `pnpm exec tsc -b --noEmit` → 0 errors.
- `pnpm run lint` (oxlint) → 0 errors; only the same 5 pre-existing `react(only-export-components)` fast-refresh warnings inherent to TanStack Router's file-based route convention (not a regression).
- Manually traced TanStack Router's `notFoundMode: 'fuzzy'` resolution: a fully-unmatched path (e.g. `/ruta-que-no-existe`) resolves at the root route (only ancestor that "matches"), while a partially-matched path (e.g. `/clientes/no-existe`) resolves at the nearest matched ancestor — the `/_app` pathless layout — which had no `notFoundComponent` of its own, so it fell through to TanStack's untranslated default instead of bubbling to root's.

## Review Findings

### High Issues
- [HIGH] **AC5 violated for nested unknown routes** — `frontend/src/routes/_app.tsx` only exported `component: AppLayout`, no `notFoundComponent`. TanStack Router's default `notFoundMode: 'fuzzy'` resolves the not-found UI at the *nearest matched ancestor route*, not always the root. A fully-unmatched path (e.g. `/ruta-que-no-existe`) matches nothing but the root, so the root's `notFoundComponent` (added for the original AC5 fix) fired correctly. But a path sharing a prefix with a real route (e.g. `/clientes/no-existe`) matches into the `/_app` branch, whose own `notFoundComponent` was undefined — so it rendered TanStack's plain-text, untranslated "Not Found" fallback instead of the Spanish `NotFoundView`, violating AC5's "a 404/not-found view is displayed gracefully". This exact gap was already found and honestly documented by the Automate sub-agent as a `test.skip()` with root-cause analysis (`frontend/src/app/routing.edge-cases.test.tsx`) rather than fixed, since automate workflows don't modify product code.
  - **FIXED**: added `notFoundComponent: NotFoundView` to the `/_app` route (`frontend/src/routes/_app.tsx`), mirroring the root route's registration. `AppLayout` already wraps `<Outlet />` in `<AppShell>`, so navigation stays visible for this case with no further changes needed. Un-skipped the previously-`test.skip()`'d test and removed the now-inaccurate companion assertion that checked for the framework-default English text; both now assert the Spanish `NotFoundView` copy and pass (`pnpm test`: 17/17 green, 0 skipped).

### Medium Issues
- [MED] **Incomplete Dev Agent Record File List** — the story's File List (written by the dev-story phase) did not include the edge-case test files added afterward by the Automate/Test-Review phases (`frontend/src/app/routing.edge-cases.test.tsx`, `frontend/src/shared/components/AppNavigation.edge-cases.test.tsx`, `e2e/tests/foundation/navigation-shell-edge-cases.spec.ts`), making the record incomplete relative to actual git history.
  - **FIXED**: updated the File List to reflect all files actually touched across the full story lifecycle, including this review's own fix.

### Low Issues (not blocking, not applied — out of story scope)
- [LOW] **No accessibility (axe) checks in component tests** — `company-standards.md` Testing Standards calls for "Component tests with accessibility checks (axe)", but no `axe-core`/`jest-axe`/`vitest-axe` dependency exists anywhere in `frontend/`. This is a pre-existing gap in the test-environment setup (Story 1.1/Task 4 of this story), not something Story 1.2 introduced, and adding an axe harness project-wide is a test-infrastructure decision that exceeds this single story's scope. Recommended as a follow-up for a dedicated test-infrastructure story.
- [LOW] **`useMatchRoute` active-state matching is exact, not fuzzy** — `AppNavigation.tsx`'s `activeId` derivation (`matchRoute({ to: item.path })`) will stop highlighting "Clientes"/"Contactos" once Epic 2/3 add nested detail routes (e.g. `/clientes/:id`), since it doesn't pass `fuzzy: true`. No nested routes exist yet, so this is not a defect against any current AC — flagged for the Epic 2/3 implementer to revisit when those routes are added.

## Fix Outcome

- **Action Taken**: Fixed automatically (High + Medium issues)
- **Fixed Count**: 2 (nested-route 404 fix + File List documentation update)
- **Deferred (not applied, flagged as follow-ups)**: 2 Low items (axe accessibility harness, fuzzy active-route matching) — both out of this story's scope per minimal-complexity guidance
- **Recommended Status**: `done` — all 6 Acceptance Criteria independently verified against running/tested code (including the nested-route AC5 edge case, previously a known gap), 0 open High/Medium findings, `tsc`/`lint`/`vitest` all green with no regressions.
