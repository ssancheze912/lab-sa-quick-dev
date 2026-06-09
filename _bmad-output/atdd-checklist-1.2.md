# ATDD Checklist — Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-09
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + React Testing Library)

---

## Story Summary

Establish the persistent navigation shell of the Siesa Agents SPA. A `NavigationRail` (desktop, ≥ 1024px) and a `NavigationBar` (mobile, < 1024px) from `siesa-ui-kit` (or its documented local shim) expose the "Clientes" and "Contactos" entries, deep links work, the index route redirects to `/clientes`, and unknown routes show a Spanish 404 view while keeping the shell visible.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria (from `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`)

1. Desktop (`lg:` ≥ 1024px) shows `NavigationRail` with "Clientes" + "Contactos" entries; click navigates without full reload (FR28).
2. Mobile (< 1024px) shows `NavigationBar` (56px, bottom) with the same entries; touch targets ≥ 44×44 px (FR29).
3. Deep links `/clientes` and `/contactos` render directly without redirect; active item is marked (FR30).
4. Unknown route renders a Spanish 404 view ("Página no encontrada" + "Ir a Clientes") with shell still visible.
5. Active route shows active visual state via TanStack Router `activeProps` + `aria-current="page"`.
6. Index `/` redirects to `/clientes` via `beforeLoad`.
7. Test suite covers rail/bar visibility, SPA navigation, deep links, 404 fallback and index redirect.

---

## Failing Tests Created (RED Phase)

### Component / Integration Tests — Vitest + React Testing Library (16 tests)

> Co-located next to the route files per Story 1.2 testing standards.

#### File: `frontend/src/routes/_app.test.tsx` (6 tests)

- **TC-E1-P2-01** — renders NavigationRail and NavigationBar with Clientes and Contactos entries
  - **Status:** RED — `_app.tsx` and `_app/clientes.tsx` / `_app/contactos.tsx` do not exist
  - **Verifies:** AC #1, #2 — rail + bar exist with both Spanish entries
- **TC-E1-P2-01 (cont.)** — desktop NavigationRail wrapper has responsive class `lg:flex`
  - **Status:** RED — wrapper does not exist
  - **Verifies:** AC #1 — mobile-first responsive switch via Tailwind
- **TC-E1-P2-02** — mobile NavigationBar wrapper has responsive class `lg:hidden`
  - **Status:** RED — wrapper does not exist
  - **Verifies:** AC #2 — bar visible only below `lg:`
- **AC #5** — active route `/clientes` marks rail item `aria-current="page"`
  - **Status:** RED — `activeProps` not yet wired
  - **Verifies:** AC #5 — active visual state via TanStack Router
- **AC #2 / accessibility** — landmark with Spanish `aria-label="Navegación principal"`
  - **Status:** RED — landmark missing
  - **Verifies:** NFR accessibility (WCAG 2.1 AA)
- **AC #3** — `/clientes` deep link mounts the Clientes view inside the shell
  - **Status:** RED — placeholder route missing
  - **Verifies:** AC #3 — `<Outlet />` wiring

#### File: `frontend/src/routes/navigation.test.tsx` (4 tests)

- **TC-E1-P1-01** — clicking "Contactos" navigates client-side without `window.location.reload`
  - **Status:** RED — `_app` shell + child routes missing
  - **Verifies:** AC #1 — FR28 SPA navigation
- **TC-E1-P1-02** — deep link to `/clientes` renders directly
  - **Status:** RED — placeholder routes missing
  - **Verifies:** AC #3 — FR30 deep link
- **TC-E1-P1-03** — deep link to `/contactos` renders directly
  - **Status:** RED — placeholder routes missing
  - **Verifies:** AC #3 — FR30 deep link
- **AC #5** — after navigating to `/contactos`, the Contactos rail entry becomes active
  - **Status:** RED — `activeProps` not yet wired
  - **Verifies:** AC #5 — active state reflects URL

#### File: `frontend/src/routes/index.test.tsx` (2 tests)

- **TC-E1-P2-03** — `/` redirects to `/clientes`
  - **Status:** RED — `index.tsx` still renders a placeholder home component
  - **Verifies:** AC #6 — default landing
- **AC #6** — `IndexRoute.options.beforeLoad` is a function (uses `redirect`, not runtime navigate)
  - **Status:** RED — `beforeLoad` not configured
  - **Verifies:** AC #6 — flicker-free redirect

#### File: `frontend/src/routes/__root.test.tsx` (4 tests)

- **AC #4** — `__root.tsx` registers a `notFoundComponent`
  - **Status:** RED — missing in current `__root.tsx`
  - **Verifies:** AC #4 — Spanish 404 instead of default fallback
- **TC-E1-P1-04** — unknown route renders Spanish "Página no encontrada"
  - **Status:** RED — view does not exist
  - **Verifies:** AC #4 — error UX
- **AC #4** — 404 view links to `/clientes` with CTA "Ir a Clientes"
  - **Status:** RED — view does not exist
  - **Verifies:** AC #4 — recovery CTA
- **AC #4** — navigation shell remains visible on the 404 view
  - **Status:** RED — shell-wrapped 404 not yet implemented
  - **Verifies:** AC #4 — shell-persistent fallback

**Test Levels Covered:** Component / Integration (Vitest + RTL). No E2E (no Playwright in this repo). No API tests (Story 1.2 has no server calls).

---

## Data Factories Created

None. Story 1.2 has no server data, no domain entities. No factories needed.

---

## Fixtures Created

None custom. Tests use ad-hoc in-memory routers via:

- `createMemoryHistory({ initialEntries: [path] })`
- `createRouter({ routeTree, history })`
- `<RouterProvider router={...} />`

A `matchMedia` stub is installed per-test in `beforeEach` because jsdom does not implement it (Tailwind `lg:` breakpoint assertions rely on class strings, not on actual media-query evaluation).

---

## Mock Requirements

None. No external services are called by Story 1.2.

The `siesa-ui-kit` package itself MAY be mocked or replaced by a local shim per Task 1 of the story. The tests do NOT import `siesa-ui-kit` directly — they assert on `data-testid` attributes the shell must expose. Both the real kit components and the local shim must surface the contract listed in the next section.

---

## Required `data-testid` Attributes

The implementation MUST add the following `data-testid` attributes so the failing tests can locate elements stably (per `selector-resilience.md` — `data-testid` > ARIA > text > CSS):

### `_app.tsx` shell

| `data-testid` | Description |
|---|---|
| `navigation-rail-wrapper` | The `<aside>` (or equivalent) that wraps `NavigationRail` on desktop. Must carry Tailwind classes `hidden lg:flex` (or `hidden lg:block`). |
| `navigation-bar-wrapper`  | The `<nav>` (or equivalent) that wraps `NavigationBar` on mobile. Must carry Tailwind class `lg:hidden`. |
| `nav-rail-clientes`        | The `<Link to="/clientes">` rendered inside `NavigationRail`. Must contain text "Clientes" and use `activeProps` + `aria-current="page"`. |
| `nav-rail-contactos`       | The `<Link to="/contactos">` rendered inside `NavigationRail`. Must contain text "Contactos" and use `activeProps` + `aria-current="page"`. |
| `nav-bar-clientes`         | The `<Link to="/clientes">` rendered inside `NavigationBar`. Must contain text "Clientes". |
| `nav-bar-contactos`        | The `<Link to="/contactos">` rendered inside `NavigationBar`. Must contain text "Contactos". |

### `_app/clientes.tsx`

| `data-testid` | Description |
|---|---|
| `clientes-view` | Container of the placeholder Clientes view (heading "Clientes"). |

### `_app/contactos.tsx`

| `data-testid` | Description |
|---|---|
| `contactos-view` | Container of the placeholder Contactos view (heading "Contactos"). |

### Landmarks (ARIA, not `data-testid`)

- The nav landmark MUST expose `aria-label="Navegación principal"` (Spanish, per story).
- Tests query this landmark via `screen.findByRole('navigation', { name: /navegación principal/i })`.

---

## Implementation Checklist (RED → GREEN)

### Task 1 — Install / shim `siesa-ui-kit` (AC #1, #2)

- [ ] Run `pnpm add siesa-ui-kit` in `frontend/`. If the registry is unavailable, create the documented local shim under `frontend/src/shared/components/ui/` exposing `NavigationRail` and `NavigationBar` with the items/active-state API.
- [ ] Verify `import { NavigationRail, NavigationBar } from 'siesa-ui-kit'` (or the shim path) resolves.

### Task 2 — Build the application shell `frontend/src/routes/_app.tsx` (AC #1, #2, #5)

- [ ] Create `frontend/src/routes/_app.tsx` exporting `createFileRoute('/_app')` (pathless layout, `_` prefix).
- [ ] Render `<aside data-testid="navigation-rail-wrapper" className="hidden lg:flex lg:w-[72px] lg:flex-col">` containing `NavigationRail`.
- [ ] Render `<nav data-testid="navigation-bar-wrapper" className="fixed bottom-0 inset-x-0 h-14 lg:hidden">` containing `NavigationBar`.
- [ ] Each nav item is a TanStack Router `<Link>` with:
  - `to="/clientes"` or `to="/contactos"`
  - `data-testid="nav-rail-clientes"` / `nav-rail-contactos` / `nav-bar-clientes` / `nav-bar-contactos`
  - `activeProps={{ className: 'border-l-2 border-primary-600 bg-primary-50 text-primary-700', 'aria-current': 'page' }}` (so `aria-current="page"` is set on the active link)
- [ ] Both nav landmarks expose `aria-label="Navegación principal"`.
- [ ] Render `<Outlet />` inside the content area.
- [ ] Run tests: `pnpm test -- src/routes/_app.test.tsx`
- [ ] GREEN ✅ — `_app.test.tsx` passes.

### Task 3 — Placeholder child routes (AC #3, #5)

- [ ] Create `frontend/src/routes/_app/clientes.tsx` with `createFileRoute('/_app/clientes')`. Component renders `<section data-testid="clientes-view"><h1>Clientes</h1></section>`.
- [ ] Create `frontend/src/routes/_app/contactos.tsx` with `createFileRoute('/_app/contactos')`. Component renders `<section data-testid="contactos-view"><h1>Contactos</h1></section>`.
- [ ] Run dev server once so `@tanstack/router-plugin` regenerates `routeTree.gen.ts`.
- [ ] Run tests: `pnpm test -- src/routes/navigation.test.tsx`
- [ ] GREEN ✅ — `navigation.test.tsx` passes.

### Task 4 — Index redirect + 404 (AC #4, #6)

- [ ] Modify `frontend/src/routes/index.tsx` to:
  ```ts
  export const Route = createFileRoute('/')({
    beforeLoad: () => { throw redirect({ to: '/clientes' }) },
  })
  ```
  (drop the placeholder component).
- [ ] Modify `frontend/src/routes/__root.tsx` to register `notFoundComponent` rendering the Spanish 404 view (`Página no encontrada` + `La ruta solicitada no existe` + `<Link to="/clientes">Ir a Clientes</Link>`), wrapped inside the `_app` shell (or duplicate the shell wrapper so the nav remains visible).
- [ ] Run tests: `pnpm test -- src/routes/index.test.tsx src/routes/__root.test.tsx`
- [ ] GREEN ✅ — both files pass.

### Task 5 — Regenerate route tree and validate build

- [ ] `pnpm run dev` once to regenerate `routeTree.gen.ts`.
- [ ] `pnpm exec tsc -b` → 0 errors.
- [ ] `pnpm run build` → bundle < 500 KB gzipped.

### Final verification

- [ ] `pnpm test` → all 40 tests pass (24 from Story 1.1 + 16 from Story 1.2).
- [ ] Manual smoke: visit `/`, `/clientes`, `/contactos`, `/no-existe` in `pnpm run dev`.

---

## Running Tests

```bash
# Run the full suite (Story 1.1 still-passing + Story 1.2 RED tests)
cd frontend && pnpm test

# Run only the Story 1.2 new test files
cd frontend && pnpm test -- src/routes/_app.test.tsx
cd frontend && pnpm test -- src/routes/navigation.test.tsx
cd frontend && pnpm test -- src/routes/index.test.tsx
cd frontend && pnpm test -- src/routes/__root.test.tsx

# Watch mode while implementing
cd frontend && pnpm test:watch
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- 16 new failing tests cover all 7 acceptance criteria of Story 1.2.
- Tests fail with explicit Spanish-aware messages ("RED: route modules ... do not exist yet") so the cause is unambiguous (missing implementation, NOT test bugs).
- `frontend/src/routes/_app.tsx`, `frontend/src/routes/_app/clientes.tsx`, `frontend/src/routes/_app/contactos.tsx` do NOT exist yet — that is intentional.

### GREEN Phase (DEV)

1. Pick Task 2 first (build `_app.tsx`) — unblocks Tasks 3 and 4.
2. Add ONE `data-testid` at a time and watch tests turn green.
3. Implement Task 3 placeholders to satisfy `navigation.test.tsx`.
4. Implement Task 4 (`index` redirect + `__root` `notFoundComponent`) to satisfy the last two test files.

### REFACTOR Phase (DEV)

- All 16 tests passing → safely refactor responsive class names, extract `NavigationItems` array to a const, etc.
- Tests provide a safety net; selectors are `data-testid`-based so refactors of class names / DOM tree are safe.

---

## Notes

- **No `tests/` root directory** was created. Per Story 1.2 testing standards (lines 184 of the story file), tests are co-located as `*.test.tsx` next to the route files.
- **No `siesa-ui-kit` import in tests.** Tests assert on `data-testid` and `aria-*` attributes that the shell must expose; this lets the implementation use either the real `siesa-ui-kit` components or the documented local shim without test rewrites.
- **`@testing-library/user-event` is not installed.** Tests use `fireEvent.click` from `@testing-library/react` (already installed) — no extra dependency required.
- **`vitest-axe` is optional** (per story Dev Notes). Not included in this RED batch to avoid forcing a new dev dependency before implementation begins; can be added in REFACTOR.
- **Pre-existing tests (Story 1.1):** 24 tests still pass — Story 1.2 changes do not break them.

---

## Test Execution Evidence (RED Phase Verified)

**Command:** `cd frontend && pnpm test`

**Result summary:**

```
 Test Files  4 failed | 3 passed (7)
      Tests  16 failed | 24 passed (40)
```

- 16 failing tests = all new tests for Story 1.2 ✅ (RED verified)
- 24 passing tests = pre-existing tests from Story 1.1 (untouched)
- All 16 failures are due to **missing route modules** (`_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`) and missing `notFoundComponent` / `beforeLoad` — NOT test bugs.

---

**Generated by BMad TEA Agent (testarch-atdd) — 2026-06-09**
