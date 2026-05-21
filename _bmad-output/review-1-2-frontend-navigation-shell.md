---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/stories/1-2-frontend-navigation-shell.md
story_key: 1-2-frontend-navigation-shell
---

# Code Review: 1-2-frontend-navigation-shell

- **Date**: 2026-05-21
- **Reviewer**: SiesaTeam (AI Agent — adversarial re-review)
- **Status**: Completed

## Initial Discovery

- **Undocumented Changes (in Git but NOT in Story File List)**:
  - `frontend/src/routes/__tests__/root.test.tsx` — mentioned in Tasks but absent from File List
  - `frontend/src/routes/__tests__/root.edge.test.tsx` — not in File List
  - `frontend/src/routeTree.gen.ts` — auto-generated, modified but not listed (acceptable)
  - `frontend/src/routes/not-found.tsx` — created outside story scope, not listed
- **Files in Story but NOT in Git**: None. All claimed files exist.
- **False Claims from Prior Review**: Prior review-1-2 document claimed "auto-fixed: icon sizes (w-4→w-5)", "auto-fixed: keyboard nav tabIndex", but neither fix was actually applied to code.

## Review Plan

### Items to Verify
- [x] AC1: NavigationRail renders on desktop (≥ 1024px) with Clientes and Contactos
- [x] AC2: NavigationBar renders on mobile (< 1024px) at bottom with touch targets ≥ 44px
- [x] AC3: Deep linking to /clientes and /contactos works without redirect
- [x] AC4: Unknown route renders graceful 404 view in Spanish
- [x] Task 1: Route tree defined with __root.tsx, _app.tsx, clientes.tsx, contactos.tsx, index.tsx
- [x] Task 2: AppShell with NavigationRail (desktop) — mandatory siesa-ui-kit usage
- [x] Task 3: NavigationBar mobile — mandatory siesa-ui-kit usage
- [x] Task 4: NotFoundView component
- [x] Task 5: QueryClientProvider in __root.tsx
- [x] Task 6: Unit tests UNIT-F-01, UNIT-F-02, UNIT-F-03

### Focus Areas
- siesa-ui-kit component compliance (mandatory per story and company standards)
- Route structure correctness
- Accessibility WCAG 2.1 AA compliance
- Test quality and completeness
- Scope discipline (placeholder views only in this story)

## Review Findings

### Critical Issues (Must Fix)

- **[CRITICAL] `AppShell.tsx` does NOT use `siesa-ui-kit` `NavigationRail` or `NavigationBar` components.** The story's Dev Notes state "You MUST use `siesa-ui-kit` components for all navigation UI elements" and "Do not create custom navigation components if a siesa-ui-kit equivalent exists." The company standards mandate checking siesa-ui-kit first. The current implementation builds custom `<nav>` elements from scratch instead. Confirmed: `siesa-ui-kit` v1.0.194 exports `NavigationRail`, `NavigationBar`, `NavigationRailItem`, etc. Zero imports from siesa-ui-kit in AppShell.tsx (only `styles.css` import in `__root.tsx`). Status: **Pending manual fix** — requires replacing custom nav elements with siesa-ui-kit components.

### High Issues (Should Fix)

- **[HIGH] `not-found.tsx` is dead/unreachable code.** A route file `frontend/src/routes/not-found.tsx` registers a navigable route at `/not-found` via `createFileRoute('/not-found')`. No code navigates to `/not-found`. The real 404 fallback is `notFoundComponent: NotFoundView` in `__root.tsx`. This creates two competing 404 components: `NotFoundPage` (unreachable via normal navigation) and `NotFoundView` (the actual catch-all). Additionally they have different text ("La ruta que buscas no existe." vs "La ruta solicitada no existe." and "Volver a Clientes" vs "Ir a Clientes") — text inconsistency. Status: **Pending manual fix** — remove `not-found.tsx` route file.

- **[HIGH] `contactos.tsx` violates story 1.2 scope.** Story spec says: "Clientes and Contactos views are placeholder-only in this story; full implementation is in Epics 2 and 3." The actual `contactos.tsx` imports and renders `ContactoListView` from Epic 3's module (`../../modules/crm/contactos/presentation/ContactoListView`) and includes `<Outlet />` for nested routes. This is not a placeholder — it is the full Epic 3 view integrated into a Story 1.2 file. While functionally working, it breaks clean story isolation and makes rollback harder. Status: **Warning** — acceptable given pipeline progression, but documented.

### Medium Issues (Should Fix)

- **[MED] `UNIT-RE-03` test was failing** — test expected exactly 7 routes but route tree has 8 (Story 3.2 added `/_app/contactos/$contactoId`). **Auto-fixed**: Updated expected count from 7 to 8 in both `routing-edge-cases.test.ts` and `-routing-edge-cases.test.ts`. All 90 routing tests now pass.

- **[MED] `clientes.tsx` missing `<h1>` element per story spec.** Story spec shows: `<h1 className="text-2xl font-bold">Clientes</h1>` inside the `clientes-view` div, and `p-8` padding. Implementation had plain text "Clientes" with `p-6`. **Auto-fixed**: Added `<h1 className="text-2xl font-bold">Clientes</h1>` and changed padding to `p-8`.

### Low Issues (Nice to Fix)

- **[LOW] Icon sizes are `w-4 h-4`** (16px). While the story does not specify an explicit size, standard practice per company design system (Inter + Heroicons) is `h-5 w-5` (20px) for nav icons. Current size is small for accessible touch targets. The touch targets themselves meet the 44px minimum via `min-h-[44px]` / `min-h-[56px]` padding, so no WCAG violation. Functional issue only.

- **[LOW] Previous review document (`review-1-2-frontend-navigation-shell.md`) contained false auto-fix claims.** The report stated "Auto-fixed: keyboard nav tabIndex/onKeyDown" and "Auto-fixed: icon sizes to h-5 w-5", but neither change existed in the code. This erodes trust in review artifacts. Review documents should only claim fixes that are verifiable in the codebase.

## AC Validation Summary

| AC | Status | Evidence |
|----|--------|----------|
| AC1 — NavigationRail desktop | PASS (PARTIAL) | `nav[data-testid="navigation-rail"]` renders with correct aria-label. CRITICAL: uses custom `<nav>`, not siesa-ui-kit NavigationRail. |
| AC2 — NavigationBar mobile | PASS (PARTIAL) | `nav[data-testid="navigation-bar"]` renders. Touch target `min-h-[56px]` ≥ 44px. CRITICAL: uses custom `<nav>`, not siesa-ui-kit NavigationBar. |
| AC3 — Deep linking | PASS | `/_app/clientes` and `/_app/contactos` registered. No redirect. UNIT-F-01, UNIT-F-02 pass. |
| AC4 — 404 graceful | PASS | `notFoundComponent: NotFoundView` in `createRootRoute`. Spanish text present. `data-testid="not-found-view"` exists. |
| WCAG 2.1 AA | PARTIAL | `aria-label="Navegación principal"` on rail, `aria-label="Menú de navegación"` on bar. `aria-current="page"` on active items. No keyboard `tabIndex`/`onKeyDown` on nav items (CRITICAL pending fix). |

## Fix Outcome

- **Auto-Fixed**: 2 issues (UNIT-RE-03 test count × 2 files, clientes.tsx h1 + padding)
- **Pending Critical (Manual)**: siesa-ui-kit NavigationRail/NavigationBar usage
- **Pending High (Manual)**: Remove dead `not-found.tsx` route
- **Pending Warning**: contactos.tsx scope (acceptable, documented)
- **Recommended Status**: in-progress (CRITICAL siesa-ui-kit compliance pending)

## Status Sync

- **Story File Status**: Updated to `in-progress` (CRITICAL issue unresolved)
- **Sprint Status YAML**: Synced — `1-2-frontend-navigation-shell: in-progress`
