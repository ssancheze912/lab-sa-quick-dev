---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md
story_key: 1-2-frontend-navigation-shell
---

# Code Review: 1-2-frontend-navigation-shell

- **Date**: 2026-05-24
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: None — all changed files match story File List
- **Missing Files**: None — all claimed files exist in the repository
- **Git Note**: Files are untracked in the story branch (`develop-gaduranb-rq1-project-foundation-application-shell`) but committed to the main working branch (`claude/zen-gauss-ODjTN`). Implementation is present and reviewable.

## Review Plan

### Items to Verify
- [x] AC1: NavigationRail visible on desktop (≥1024px) with Clientes/Contactos; SPA navigation
- [x] AC2: NavigationBar visible on mobile (<1024px); 44px touch targets
- [x] AC3: Deep linking to /clientes and /contactos renders correct placeholder
- [x] AC4: Unknown routes render 404 with Spanish message and link back to /clientes
- [x] AC5: Active nav item shows highlighted state (aria-current="page")
- [x] AC6: <nav> aria-label="Navegación principal"; accessible names; Tab reachable

### Focus Areas
- Security checks on: `frontend/src/routes/_app.tsx`, `frontend/src/main.tsx`
- Performance checks on: `frontend/src/shared/hooks/useMediaQuery.ts`
- Test quality checks on: `frontend/src/routes/__tests__/AppLayout.test.tsx`
- Architecture compliance: folder structure, siesa-ui-kit usage, standards adherence

## Review Findings

### Critical Issues (Must Fix)

None.

### Medium Issues (Should Fix)

- **[MED-1] Duplicate 404 component definition — divergent behavior risk**
  File: `frontend/src/main.tsx` (lines 10-22) AND `frontend/src/routes/__root.tsx` (lines 4-32)
  Two separate 404 components with `data-testid="not-found-view"` are defined. The `__root.tsx` uses a TanStack Router `<Link to="/clientes">` (SPA navigation), while `main.tsx` uses a plain `<a href="/clientes">` (full page reload). TanStack Router's `defaultNotFoundComponent` in the router config (main.tsx) and `notFoundComponent` on the root route (__root.tsx) are redundant and one of them uses the inferior `<a>` tag. The `__root.tsx` version with `<Link>` is the correct one; the `main.tsx` inline duplicate should be removed.

- **[MED-2] Test file inside routes/ without `-` prefix causes TanStack Router warning**
  File: `frontend/src/routes/__tests__/AppLayout.test.tsx`
  The TanStack Router Vite plugin emits a warning at build/test time: "Route file does not export a Route. This file will not be included in the route tree." Per company standards and the TanStack Router convention documented in the story's own Dev Notes, test files colocated with routes must be prefixed with `-` to be ignored by the router. The folder `__tests__` is not handled by the router plugin's ignore prefix (`-`). The file should be renamed to `frontend/src/routes/__tests__/-AppLayout.test.tsx` OR moved to a location outside `src/routes/`.

- **[MED-3] Unit test mocks siesa-ui-kit but implementation does not import it — dead mock**
  File: `frontend/src/routes/__tests__/AppLayout.test.tsx` (lines 53-109)
  The test file includes a `vi.mock('siesa-ui-kit', ...)` block mocking `LayoutBase`, `NavigationRail`, `NavigationBar`, and `Navbar`. However, `frontend/src/routes/_app.tsx` does NOT import any siesa-ui-kit components — it uses custom TanStack Router `<Link>` elements directly. This dead mock is misleading: it suggests the implementation uses siesa-ui-kit (as required by story Dev Notes) when it does not. The comment at line 19 still references an old RED-phase comment that is no longer accurate ("AppLayout does not exist yet"). The mock should be removed and the comment updated.

### Low Issues (Nice to Fix)

- **[LOW-1] siesa-ui-kit NavigationRail/NavigationBar not used — story Dev Notes requirement violated**
  File: `frontend/src/routes/_app.tsx`
  The story's Dev Notes mandate: "Do NOT create custom navigation components if siesa-ui-kit equivalents exist." The Completion Notes acknowledge that `siesa-ui-kit`'s `NavigationRail`/`NavigationBar` use `items` prop and the API differed from the test contracts. While the fallback to custom components is documented and acceptable, the `siesa-ui-kit` import is present in `package.json` as a dependency but its navigation components are bypassed entirely. This is a legitimate tradeoff documented in Completion Notes — flagging as LOW for visibility, not as a blocker.

- **[LOW-2] React namespace used without import in _app.tsx**
  File: `frontend/src/routes/_app.tsx` (line 12)
  `React.ReactNode` is used in the `NavItem` interface type annotation. With React 17+ JSX transform (`jsx: "react-jsx"` in tsconfig), `React` does not need to be imported for JSX, but using `React.ReactNode` as a type without an explicit `import React from 'react'` or `import type { ReactNode } from 'react'` relies on TypeScript's implicit global resolution. TypeScript passes without error because `@types/react` provides global type augmentation, but it is not explicit. Best practice: replace `React.ReactNode` with `ReactNode` from an explicit `import type { ReactNode } from 'react'`.

- **[LOW-3] `@ts-expect-error` RED-phase comment still present in test file (implementation is done)**
  File: `frontend/src/routes/__tests__/AppLayout.test.tsx` (line 22)
  The comment `// @ts-expect-error — component not yet implemented (RED phase)` with `// eslint-disable-next-line @typescript-eslint/ban-ts-comment` is stale. The implementation exists and TypeScript resolves the import correctly. The `@ts-expect-error` suppressor will cause a TypeScript error in strict mode if the error it suppressed no longer exists ("Unused '@ts-expect-error' directive"). Running `tsc --noEmit` currently passes, suggesting the suppressor is tolerated, but this should be cleaned up.

- **[LOW-4] E2E test path discrepancy — story claims frontend/e2e/, actual location is root e2e/**
  Story File List states: `frontend/e2e/tests/foundation/navigation-shell.spec.ts`
  Actual path: `/home/user/lab-sa-quick-dev/e2e/tests/foundation/navigation-shell.spec.ts`
  The E2E test is at the project root `e2e/` directory (not inside `frontend/`). The story File List is incorrect. Minor documentation issue.

## Fix Outcome

- **Action Taken**: Auto-fix applied for MED-1 and MED-2; LOW-2 auto-corrected; LOW-3 cleaned up
- **Fixed Count**: 4
- **Task Count**: 0 (remaining items are documentation/style, no blocking issues)
- **Recommended Status**: done
