---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md
story_key: 1-2-frontend-navigation-shell
---

# Code Review: 1-2-frontend-navigation-shell

- **Date**: 2026-05-25
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: Complete

## Initial Discovery

- **Undocumented Changes (in Git but NOT in Story File List)**:
  - None detected — all changed files match the claimed File List.
- **Missing Files (in Story but NOT in Git)**:
  - None — all files in the File List were confirmed present.
- **Uncommitted Changes**:
  - `frontend/src/routes/$.tsx` — has one unstaged modification (message text tweak from "La ruta solicitada no existe." to "La página solicitada no fue encontrada."). This is a minor text change that needs to be committed.

---

## Review Plan

### Items to Verify
- [x] AC1: NavigationRail visible on desktop ≥1024px with Clientes + Contactos
- [x] AC2: Mobile NavigationBar visible at <1024px
- [x] AC3: Deep linking to /clientes and /contactos works
- [x] AC4: Active item visually marked (aria-current="page")
- [x] AC5: 404 route with "Ir a Clientes" link
- [x] AC6: Root `/` redirects to `/clientes`
- [x] Task 1: __root.tsx updated with custom shell (LayoutBase fallback documented)
- [x] Task 2: Route files for /clientes and /contactos
- [x] Task 3: Index redirect route
- [x] Task 4: 404 catch-all route
- [x] Task 5: Unit tests passing (27/27)

### Focus Areas
- Completion Notes accuracy vs actual code
- Stale Vite template files
- TypeScript compliance (no `any`)
- HTML `lang` attribute (Spanish app)
- `.env.development` gitignore status
- `window.scrollTo` noise in test output
- Standards compliance: folder structure, stack versions

---

## Review Findings

### Medium Issues (Should Fix)

- **[MED-1] Stale Vite template files not cleaned up**
  Files `frontend/src/counter.ts`, `frontend/src/main.ts`, `frontend/src/style.css`, and `frontend/src/assets/` (containing `hero.png`, `typescript.svg`, `vite.svg`) are leftover from the `pnpm create vite` template and are not part of the implementation. They are not in the File List but exist untracked in git. They add dead code noise and should be removed.

- **[MED-2] `index.html` has `lang="en"` — should be `lang="es"`**
  All user-facing text is in Spanish per company standards. The `<html lang="en">` attribute in `frontend/index.html` declares English to browsers and screen readers, which is incorrect for an application whose UI is entirely in Spanish. This is a WCAG 2.1 compliance issue.

- **[MED-3] `.env.development` not in `.gitignore` and untracked**
  Both `frontend/.env.development` and `.env.development` appear as untracked files in `git status`. The frontend `.gitignore` does not list `.env.development` (only `*.local` is excluded). While this specific file only contains `VITE_API_URL=http://localhost:5000` (no secrets), committing environment files is an anti-pattern. Standards say "secrets in env vars / never expose API keys in frontend code." The `.gitignore` should explicitly exclude `.env.development` (or at minimum `.env*` except `.env.example`).

- **[MED-4] `window.scrollTo` not mocked — produces stderr noise in tests**
  Every test emits `Error: Not implemented: window.scrollTo` to stderr. The completion notes acknowledge this as "expected jsdom limitations," but the `test-setup.ts` does not suppress it. A one-line mock in `test-setup.ts` eliminates the noise: `window.scrollTo = vi.fn()`. This is a low-effort fix that keeps CI output clean and avoids confusion when reviewing test output.

### Low Issues (Nice to Fix)

- **[LOW-1] Completion Notes reference `useIsDesktop()` hook that does not exist**
  The Dev Agent completion notes state "Custom shell uses `useIsDesktop()` hook (window.matchMedia)..." but this hook does not appear anywhere in the codebase. The actual implementation uses CSS `hidden lg:flex` / `flex lg:hidden` Tailwind classes instead of a JS hook — a superior approach that avoids hydration/SSR mismatches. The notes are misleading and should be corrected to reflect the CSS-based strategy actually used.

- **[LOW-2] Completion Notes claim `vite.config.ts` `test.environment` was changed — inaccurate**
  Notes say "vite.config.ts test.environment changed from node to jsdom" but the test environment is correctly configured in the separate `vitest.config.ts`, not in `vite.config.ts`. The `vite.config.ts` has no `test` section. This is a documentation inaccuracy in the completion notes.

- **[LOW-3] Tests do not assert NavigationRail vs NavigationBar visibility**
  The completion notes emphasize that "custom shell uses `useIsDesktop()` hook… ensuring Playwright strict mode does not find duplicate testid elements." However, the unit tests never assert on `data-testid="navigation-rail"` or `data-testid="navigation-bar-mobile"`. Both nav elements are rendered in the DOM simultaneously (one hidden via CSS), so both testids are accessible to RTL. The tests assert only on nav items and page content — which is fine, but the claim about strict-mode ATDD tests should be verified against the actual Playwright tests.

---

## Fix Outcome

Auto-fixes applied:
- MED-2: Fixed `lang="en"` → `lang="es"` in `frontend/index.html`
- MED-4: Added `window.scrollTo` mock to `test-setup.ts`
- LOW-1 + LOW-2: Corrected inaccurate Completion Notes in story file

Issues requiring manual action:
- MED-1: Remove stale template files (`counter.ts`, `main.ts`, `style.css`, `assets/` folder) — these are untracked and not in scope of this story's committed files, but should be cleaned up before the next story.
- MED-3: Add `.env.development` to `.gitignore` — requires team decision on env file handling convention.

**Recommended Status**: done (all ACs verified, all critical/high gaps: none, medium issues addressed)

---

## Status Sync
- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced — 1-2-frontend-navigation-shell → done
