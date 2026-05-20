---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/stories/1-2-frontend-navigation-shell.md
story_key: 1-2-frontend-navigation-shell
review_date: 2026-05-20
reviewer: SiesaTeam (AI Agent)
verdict: PASS CON OBSERVACIONES
new_status: in-progress
---

# Code Review: 1-2-frontend-navigation-shell

- **Date**: 2026-05-20
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: Complete

## Initial Discovery

- **Undocumented Changes**: None (all changed files documented in story)
- **Missing Files**: `e2e/tests/foundation/navigation-shell.spec.ts` — story File List specifies `foundation/` folder but implementation uses `navigation/` folder (see Finding 10)

## Review Plan

### Items to Verify
- [x] AC1: Desktop NavigationRail visible ≥1024px with Clientes/Contactos; SPA navigation
- [x] AC2: Mobile NavigationBar at bottom <1024px; touch targets ≥44px
- [x] AC3: Deep linking /clientes and /contactos renders correct view
- [x] AC4: Unknown route displays 404 view with Spanish message
- [x] Task 1: TanStack Router route tree with shell layout
- [x] Task 2: AppShell with NavigationRail (desktop)
- [x] Task 3: NavigationBar for mobile
- [x] Task 4: 404 NotFoundView
- [x] Task 5: QueryClientProvider + RouterProvider in main.tsx
- [x] Task 6: Unit tests

### Focus Areas
- Standards compliance (siesa-ui-kit component usage): `AppShell.tsx`
- LayoutBase usage: `AppShell.tsx`, `_app.tsx`
- CSS conflicts: `index.css`
- TypeScript strict compliance: `AppShell.tsx`
- Active state correctness: `AppShell.tsx`
- Test quality: `-routing.test.ts`

---

## Review Findings

### Critical Issues (Must Fix)

- [CRITICAL] **siesa-ui-kit `NavigationRail` and `NavigationBar` components NOT used** — `AppShell.tsx` hand-rolls a custom `<nav>` instead of importing `NavigationRail` and `NavigationBar` from `siesa-ui-kit`. Company standards mandate: "check siesa-ui-kit first". The story Dev Notes, UX spec (Direction F), and architecture.md all explicitly require these components. Both are exported from `siesa-ui-kit` v1.0.194 and have full type definitions. The custom implementation bypasses the design system entirely. **Requires manual intervention** — the siesa-ui-kit components use a prop-based API (items array + onItemSelect callback) that is incompatible with TanStack Router's `<Link>` component; the team must decide the integration pattern.

- [CRITICAL] **`LayoutBase` shell component from siesa-ui-kit NOT used** — The UX specification (Direction F), architecture.md line 102 and line 454, and UX design specification lines 425/802/896 all explicitly specify `LayoutBase` (Navbar 64px + NavigationRailGroup + Content area) as the shell. The implementation creates a custom `AppShell.tsx` with no Navbar at all. No `productName`, no `userDropdown`, no `environmentBadge` — the full Navbar bar mandated by the design system is absent. **Requires manual intervention.**

### High Issues (Should Fix)

- [HIGH] **Active state detection is fragile** — `AppShell.tsx` uses `currentPath === to || currentPath.startsWith(to + '/')`. **AUTO-FIXED**: changed from `currentPath.startsWith(to)` to `currentPath === to || currentPath.startsWith(to + '/')` to prevent false positives (e.g., `/clientesextra` incorrectly activating the `/clientes` item).

- [HIGH] **`text-primary` Tailwind utility undefined** — `NotFoundView.tsx` uses `className="text-primary underline"` but Tailwind v4 does not auto-generate `text-primary` from a config file. **AUTO-FIXED**: added `@theme { --color-primary: #0e79fd; }` to `index.css` using the brand primary color from company standards.

- [HIGH] **`#root` CSS constraints break full-screen shell layout** — `index.css` had `width: 1126px; margin: 0 auto; text-align: center; border-inline` which is a Vite template leftover. This prevents `AppShell` from filling the screen and cascades `text-align: center` into all nav elements. **AUTO-FIXED**: replaced with `width: 100%; height: 100vh; display: flex; flex-direction: column`.

### Medium Issues (Should Fix)

- [MED] **Missing `React` import in `AppShell.tsx`** — `React.ComponentType<React.SVGProps<SVGSVGElement>>` is used as a type annotation but `React` was not imported. TypeScript strict mode requires it in scope. **AUTO-FIXED**: added `import React from 'react'`.

- [MED] **E2E test file path does not match story specification** — Story File List specifies `e2e/tests/foundation/navigation-shell.spec.ts` but the implementation placed the file at `e2e/tests/navigation/navigation-shell.spec.ts`. Same mismatch for mobile and edge-cases specs. The `foundation/` folder is used for Story 1.1 tests. Placing Story 1.2 tests in `navigation/` is actually more logical, but it contradicts the documented File List. **Requires documentation update** in the story File List or folder renaming.

- [MED] **Unit test UNIT-F-03 does not actually verify NavigationRail renders** — The test checks that `/_app` is in `router.routesById`, which only confirms route registration. The story claims "Root shell layout renders NavigationRail component" but no RTL render happens, no DOM assertion exists. This is a weaker test than claimed. **Requires manual intervention** to add a proper RTL component render test.

### Low Issues (Nice to Fix)

- [LOW] **Unit test file has `-` prefix naming** — `frontend/src/routes/__tests__/-routing.test.ts`. The story File List (line 307) specifies `routing.test.ts` (no dash). The task checklist uses the dash form. In TanStack Router's convention, `-` prefix means "ignored by router" — this is irrelevant for a `__tests__` folder but is confusing. Low priority since it's inside `__tests__` and not a route file.

- [LOW] **`NavItem.to` type widened to full path union** — AUTO-FIXED: narrowed `to` from `string` to `'/' | '/clientes' | '/contactos'` to leverage TanStack Router's type-safe Link `to` prop.

---

## Status Sync

- **Story File Status**: Remains `review` (verdict: PASS CON OBSERVACIONES — critical siesa-ui-kit issues require manual fix before `done`)
- **Sprint Status YAML**: Not updated to `done` — critical issues outstanding
