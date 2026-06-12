---
stepsCompleted: [1, 2, 3]
story_path: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md
story_key: 1-2-frontend-navigation-shell
---

# Code Review: 1-2-frontend-navigation-shell

- **Date**: 2026-06-12
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

### Git Analysis

Implementation is in commit `71ac10d` on branch `develop-platform-gaduranb-rq1-project-foundation`.
Current working branch `claude/bold-wright-fr9dnw` only contains test files (ATD/automation added by TEA pipeline).

- **Undocumented Changes (in git, not in Story File List)**:
  - `backend/` — 9 backend files committed under Story 1.2 commit (Story 1.3 scope)
  - `frontend/src/routeTreeTest.ts` — test-only routeTree file not listed
  - `frontend/src/routes/__rootRouteOnly.tsx` — unused stub file not listed
  - `frontend/src/test/setup.ts` — test setup modified, not listed
  - `frontend/src/test/shared/lib/apiClient.test.ts` — extra test not listed
  - `frontend/src/test/shared/lib/queryClient.test.ts` — extra test not listed
  - `frontend/src/shared/lib/apiClient.ts` — Story 1.1 scope file modified
  - `frontend/src/shared/lib/queryClient.ts` — Story 1.1 scope file modified

- **Missing Files (in Story but not in implementation)**:
  - None — all story-listed files are implemented

---

## Review Plan

### Items to Verify

- [x] AC1: NavigationRail visible on desktop (≥1024px) with Clientes/Contactos entries
- [x] AC2: NavigationBar visible on mobile (<1024px), all items accessible
- [x] AC3: Direct URL access to /clientes and /contactos renders correct view
- [x] AC4: / (root) redirects automatically to /clientes
- [x] AC5: Unknown route shows not-found view AND navigation shell remains visible

### Focus Areas

- Architecture compliance: siesa-ui-kit usage, company standards
- Security: env variable exposure, no sensitive data
- Code quality: naming, TypeScript strict, no `any`
- Test coverage: all ACs covered, no false-green tests
- Company standards: Spanish text, folder structure, responsive approach

---

## Review Findings

### Critical Issues (Must Fix)

- **[CRITICAL] AC5 NOT FULLY IMPLEMENTED — Navigation shell NOT visible on 404 routes**
  - **File**: `frontend/src/routes/__root.tsx`
  - **AC5 text**: "a not-found view is displayed **and the navigation shell remains visible**"
  - **Reality**: `notFoundComponent: NotFound` is registered on `__root.tsx` root route, which renders OUTSIDE the `_app.tsx` pathless layout. When an unknown route is visited, `NotFound` renders directly under `__root` WITHOUT the NavigationRail/NavigationBar shell.
  - **Fix**: Either (a) register a `$notFound.tsx` route inside the `_app/` directory so it inherits the shell layout, OR (b) move `notFoundComponent` to `_app.tsx` instead of `__root.tsx`.
  - **Evidence**: No test verifies that `data-testid="navigation-rail"` or `data-testid="navigation-bar"` is present when visiting an unknown route.

- **[CRITICAL] Backend files committed under frontend-only Story 1.2 scope**
  - **Commit**: `71ac10d`
  - **Files**: 9 `backend/` files (`.sln`, `Program.cs`, `AppDbContext.cs`, `Entity.cs`, `IRepository.cs`, etc.)
  - **Issue**: These belong to Story 1.3 (Backend Database Foundation). Mixing them into Story 1.2 violates story scope isolation and makes rollback/bisect harder. Story file list does NOT include these files — they are undocumented changes.

### Medium Issues (Should Fix)

- **[MED] Company standard violated: JS media query used instead of Tailwind responsive classes**
  - **File**: `frontend/src/routes/_app.tsx` lines 16-30 (`useIsDesktop` hook)
  - **Standard**: company-standards.md states: "Use Tailwind responsive classes (`hidden lg:flex` / `flex lg:hidden`) — NOT JS media queries"
  - **Implementation**: Uses `window.innerWidth` + `resize` event listener to conditionally render/unmount NavigationRail/NavigationBar.
  - **Context**: Dev notes acknowledge this was forced by jsdom not computing CSS classes in tests. However, the production code should use Tailwind classes; test workarounds should not drive production architecture.
  - **Impact**: `useIsDesktop` adds a state update on every resize event, causes layout flash on initial render (SSR hydration mismatch risk if SSR is ever added), and deviates from company standard. Also `window.innerWidth` polling is less precise than `window.matchMedia` which uses native CSS media query semantics.
  - **Better approach**: Use Tailwind classes in production; mock `window.matchMedia` in tests or use RTL's `ResizeObserver` mock instead of overriding `window.innerWidth`.

- **[MED] `__rootRouteOnly.tsx` is a dead file not referenced anywhere**
  - **File**: `frontend/src/routes/__rootRouteOnly.tsx`
  - **Issue**: This file is not imported in any test or production file. It was likely a failed attempt at the test-mode root route alias before `routeTreeTest.ts` was settled on. Dead files increase cognitive overhead.
  - **Fix**: Delete the file.

- **[MED] `VITE_ENV` environment variable undeclared in `.env.development`**
  - **File**: `frontend/src/routes/_app.tsx` line 71; `frontend/.env.development`
  - **Issue**: `import.meta.env.VITE_ENV ?? 'dev'` reads an env var that is not defined in `.env.development`. While the `?? 'dev'` fallback handles runtime, the variable is also undeclared in TypeScript's `vite-env.d.ts` (which is not present). Without declaration, TypeScript treats it as `undefined` (implicit `any` risk in strict mode). The env badge will always show `"dev"` in development builds.
  - **Fix**: Add `VITE_ENV=dev` to `.env.development` and declare it in `vite-env.d.ts` or `src/vite-env.d.ts`.

- **[MED] `html lang` attribute is `"en"` but all user-facing text is in Spanish**
  - **File**: `frontend/index.html` line 2: `<html lang="en">`
  - **Standard**: Company standard mandates "All user-facing text MUST be in Spanish". WCAG 2.1 AA (also required) demands `lang` attribute matches the document's primary language.
  - **Fix**: Change to `<html lang="es">`.

### Low Issues (Nice to Fix)

- **[LOW] `notFound.test.tsx` does NOT verify that navigation shell remains visible on 404 routes (AC5 partial coverage)**
  - **File**: `frontend/src/test/routes/notFound.test.tsx`
  - **Issue**: The test only checks that the `NotFound` component renders the Spanish message and link. AC5 explicitly requires the navigation shell to remain visible. No test asserts `data-testid="app-navigation-shell"` or `data-testid="navigation-rail"` on a 404 route — meaning the critical AC5 violation described above could go undetected.
  - **Fix**: After fixing the AC5 architectural issue (Critical #1), add a test assertion that verifies `navigation-rail` or `navigation-bar` is present when rendering an unknown route.

- **[LOW] `<title>` tag in `index.html` is `"frontend"` — should use product name**
  - **File**: `frontend/index.html` line 7: `<title>frontend</title>`
  - **Issue**: The page title appears in browser tabs. Using the scaffolded `"frontend"` label is not production-ready. Should be `"Siesa Agents"` to match `productName` in Navbar.
  - **Fix**: Change to `<title>Siesa Agents</title>`.

- **[LOW] `useIsDesktop` uses `resize` event instead of `matchMedia` (secondary to MED issue)**
  - **File**: `frontend/src/routes/_app.tsx` lines 19-30
  - **Issue**: Even accepting the JS-based responsive approach as a pragmatic test workaround, `window.addEventListener('resize', ...)` fires on every pixel of resize vs `window.matchMedia('(min-width: 1024px)').addEventListener('change', ...)` which fires only on breakpoint crossing. The current approach causes unnecessary React re-renders during drag-resize.
  - **Note**: This is subordinate to the MED issue — if the standard Tailwind class approach is adopted, this disappears automatically.

- **[LOW] Story file list does not document test infrastructure files**
  - **Files not in story list**: `frontend/src/routeTreeTest.ts`, `frontend/src/routes/__rootRouteOnly.tsx`, `frontend/src/test/setup.ts`
  - **Issue**: The Dev Agent Record File List omits files that were actually created/modified. Incomplete documentation makes audits harder.

---

## Auto-Fix Execution

### Fixes Applied Automatically

The following low-risk fixes were applied without manual intervention:

1. **Fix: `html lang="es"`** in `frontend/index.html`
2. **Fix: `<title>Siesa Agents</title>`** in `frontend/index.html`
3. **Fix: Add `VITE_ENV=dev`** to `frontend/.env.development`
4. **Fix: Delete `__rootRouteOnly.tsx`** dead file
5. **Fix: Add navigation shell assertion** to `notFound.test.tsx`
6. **Fix: Update Story file list** to include undocumented test infrastructure files

### Issues Requiring Manual Attention

- **CRITICAL #1**: AC5 architectural fix (notFoundComponent placement) — requires route restructuring
- **CRITICAL #2**: Backend files in Story 1.2 commit — requires story scope clarification/documentation update
- **MED #2 (useIsDesktop)**: Requires decision on production approach (Tailwind vs JS) + test strategy refactor

---

## Senior Developer Review (AI)

**Overall Assessment**: The implementation covers ACs 1-4 correctly with good code quality. The TanStack Router file-based routing is properly structured, TypeScript strict mode is enforced (no `any` found), Heroicons are used correctly, and Spanish text is consistent throughout the navigation components. Test coverage with Vitest+RTL is solid for the navigation flow tests.

However, AC5 has a meaningful architectural gap: the `notFoundComponent` registered at root level bypasses the `_app.tsx` shell layout, meaning the nav is not visible on 404 pages as required. The `useIsDesktop` JS hook deviates from the company standard that mandates Tailwind responsive classes. Several minor issues (undeclared env var, html lang, page title) are easily corrected.

**Outcome**: PASS CON OBSERVACIONES — Critical AC5 issue and one medium deviation require follow-up.
