---
stepsCompleted: [1, 2, 3]
story_path: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md
story_key: 1-2-frontend-navigation-shell
---

# Code Review: 1-2-frontend-navigation-shell

- **Date**: 2026-05-23
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: `frontend/src/test-setup.ts` — updated in git, not listed in the story's final File List (minor omission; the file was referenced in Dev Notes)
- **Missing Files**: None — all files in the story's File List are present in git
- **Cross-reference**: Story lists 6 files; git shows those 6 plus `test-setup.ts` and sprint/story markdown housekeeping.

---

## Review Findings

### Critical Issues (Must Fix)

**[CRITICAL-1] siesa-ui-kit NavigationRail / NavigationBar / LayoutBase components NOT used**
File: `frontend/src/routes/__root.tsx`

The story tasks explicitly require importing `LayoutBase`, `NavigationRail`, and `NavigationBar` from `siesa-ui-kit`:
> Task 1, subtask 1: "Import `LayoutBase`, `NavigationRail`, and `NavigationBar` from `siesa-ui-kit`"

The company standard mandates: "Components: check siesa-ui-kit first, then shadcn via MCP, then custom."

The kit exports all three (`LayoutBase`, `NavigationRail`, `NavigationBar`, `NavigationRailGroup`) at version 1.0.203 (confirmed via `node_modules/siesa-ui-kit/dist/siesa-ui-kit.cjs`). The dev agent bypassed the kit and wrote custom `<nav>` HTML with hand-rolled styling and a custom `useIsMobile` hook instead.

This is a task marked `[x]` in the story where the actual code contradicts the claim. The dev notes acknowledge that the kit's API differs from the pattern in the spec ("LayoutBase does not accept separate `navigationRail`/`navigationBar` props; it uses `navigationItems?: NavigationRailGroupMenuItem[]`"), which is a valid reason to adapt — but the correct resolution was to use the kit's actual API, not abandon the kit entirely. Custom nav components will diverge from the design system over time.

**Severity: CRITICAL — task marked done but implementation violates the mandatory company standard and explicit task requirement.**

---

### High Issues (Should Fix Before Merge)

**[HIGH-1] Mobile breakpoint (768px) conflicts with story AC and Tailwind `lg:` (1024px)**
File: `frontend/src/routes/__root.tsx` lines 31–41, E2E spec

The story AC1/AC2 and the story Dev Notes both define the responsive boundary as `viewport ≥ 1024px` for desktop (Tailwind `lg:`). The implementation uses `useIsMobile(breakpoint = 768)`, which means:
- On a 900px viewport the implementation renders `NavigationRail` (desktop), but the story spec says that is still "mobile" territory (< 1024px).
- The E2E test file acknowledges this discrepancy in a comment: "The implementation uses 768 as breakpoint; at 1024px desktop rail is shown."

The unit tests also restore the desktop width to `1024` (not `768`), which masks the breakpoint disagreement. At exactly 768–1023px the nav component rendered does not match the acceptance criteria.

**Fix: Change `useIsMobile` default breakpoint to `1024` to align with the `lg:` Tailwind breakpoint specified in the story and company standards.**

**[HIGH-2] `useIsMobile` hook is defined inline in a route file instead of `src/shared/hooks/`**
File: `frontend/src/routes/__root.tsx` lines 31–41

Company standards define a `shared/hooks/` directory for reusable hooks. `useIsMobile` is general-purpose and will be needed in multiple places (future epics). Defining it inside a route file violates the folder structure convention and prevents reuse without duplication.

**Fix: Move `useIsMobile` to `frontend/src/shared/hooks/useIsMobile.ts` and import it.**

---

### Medium Issues (Should Fix)

**[MED-1] Resize event listener is not debounced**
File: `frontend/src/routes/__root.tsx` lines 37–39

```typescript
const handler = () => setIsMobile(window.innerWidth < breakpoint)
window.addEventListener('resize', handler)
```

Every pixel of a window drag fires a React state update and re-render. Without debouncing, continuous resize triggers dozens of renders per second, which is a performance concern especially as the app grows.

**Fix: Wrap the handler with a `setTimeout`-based debounce (e.g., 150ms) or use `requestAnimationFrame`.**

**[MED-2] `test-setup.ts` missing from the story's final File List**
File: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md` (Dev Agent Record → File List)

`frontend/src/test-setup.ts` was modified in commit `45f5935` and `7bf06c1` (cleanup after each test, `fireEvent` dependency). The final File List in the story does not include it, making the documented scope incomplete.

**Fix: Add `frontend/src/test-setup.ts` to the story File List — already auto-corrected below.**

**[MED-3] Hard-coded color `bg-blue-600` / `text-blue-600` instead of Siesa brand token**
File: `frontend/src/routes/__root.tsx` lines 82, 114, 150

Company standards specify:
- Primary: `#0e79fd` (Siesa Blue) — maps to a `primary-*` Tailwind token, not `blue-*`
- `bg-blue-600` is `#2563eb` (Tailwind default blue), not `#0e79fd`

The active nav item and the 404 back-link use `bg-blue-600` / `text-blue-600`. If the project configures `primary` in Tailwind to `#0e79fd`, these should use `bg-primary-600` / `text-primary-600` for brand consistency.

**Fix: Replace `blue-600` with `primary-600` (or the correct Tailwind alias for `#0e79fd`) across `__root.tsx`.**

---

### Low Issues (Nice to Fix)

**[LOW-1] Playwright 4 known-failing tests are not documented as skipped/todo**
File: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md` (Completion Notes)

The story notes that 4 Playwright tests fail due to `framenavigated` behavior in Playwright v1.56 and are "unfixable without test modification." These tests should be marked `.skip` or `.fixme` with a clear comment so CI does not silently accumulate known failures.

**[LOW-2] Comments in `__root.tsx` are in Spanish**
File: `frontend/src/routes/__root.tsx` lines 31, 57, 93

Company standards: "Code (variables, functions, classes) MUST be in English." Code comments are part of the codebase; they should be in English. The inline comments `/* NavigationBar — solo en mobile... */` and the hook comment `// Hook para detectar mobile` mix languages.

**Auto-corrected below.**

**[LOW-3] `useIsMobile` has a comment in Spanish in the hook name**
File: `frontend/src/routes/__root.tsx` line 31
`// Hook para detectar mobile (breakpoint < 768px)` — should be in English.
**Auto-corrected below.**

---

## Auto-Corrections Applied

### Fix LOW-2 and LOW-3: Translate inline Spanish comments to English
