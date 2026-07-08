# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-07-08
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + @testing-library/react + jsdom)

---

## Story Summary

Story 1.2 establishes the persistent SPA navigation shell around the Clientes and Contactos placeholder views. It introduces a desktop `LayoutBase` rail from `siesa-ui-kit`, a mobile bottom `NavigationBar`, TanStack Router file routes with a `/ → /clientes` redirect, and a Spanish not-found view — all without any full-page reloads.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop (≥ lg 1024px): `siesa-ui-kit` NavigationRail via `LayoutBase` shows Clientes/Contactos; clicks are TanStack Router client-side (FR28).
2. Mobile (< lg 1024px): `siesa-ui-kit` NavigationBar (56px, 44×44px targets) replaces the rail via Tailwind responsive utilities — no JS media queries (FR29).
3. Direct URL to `/clientes` or `/contactos` renders the corresponding view — no redirect to home, no 404, no blank page (FR30).
4. Unknown routes show a Spanish 404 view; the shell (Navbar + rail/nav) remains, and a link back to `/clientes` is offered.
5. `/` redirects to `/clientes` via TanStack Router's `redirect` (in `beforeLoad` — not `<Navigate>` at render time, not `window.location`).
6. Active route reflects visually on the rail (`selected: true`) and nav bar (`activeItemId`).
7. Navigating between `/clientes` and `/contactos` never calls `window.location.reload`; shell layout stays mounted (SPA).
8. `pnpm build` and `pnpm typecheck` produce zero TS errors under strict mode; all Vitest tests pass; no `any`.

---

## Failing Tests Created (RED Phase)

### Component Tests — Vitest + RTL (34 total tests across 7 files)

#### File: `frontend/src/app/layout/AppShell.test.tsx` (6 tests)

- **Test:** GIVEN a desktop viewport, WHEN AppShell mounts, THEN "Clientes" nav entry is present
  - **Status:** RED — module `./AppShell` does not exist
  - **Verifies:** AC #1
- **Test:** GIVEN a desktop viewport, WHEN AppShell mounts, THEN "Contactos" nav entry is present
  - **Status:** RED — module `./AppShell` does not exist
  - **Verifies:** AC #1
- **Test:** GIVEN AppShell at /clientes, WHEN clicking "Contactos", THEN URL changes to /contactos WITHOUT reload
  - **Status:** RED — module missing
  - **Verifies:** AC #1, AC #7
- **Test:** GIVEN AppShell mounted at /clientes, THEN Clientes item reflects the active state
  - **Status:** RED — module missing
  - **Verifies:** AC #6
- **Test:** GIVEN AppShell mounted at /contactos, THEN Contactos item reflects the active state
  - **Status:** RED — module missing
  - **Verifies:** AC #6
- **Test:** GIVEN LayoutBase composition, THEN productName "Siesa Agents" is exposed to Navbar
  - **Status:** RED — module missing
  - **Verifies:** AC #1

#### File: `frontend/src/app/layout/MobileShell.test.tsx` (7 tests)

- **Test:** GIVEN mobile viewport, WHEN MobileShell mounts, THEN bottom NavigationBar in the DOM
  - **Status:** RED — module `./MobileShell` does not exist
  - **Verifies:** AC #2
- **Test:** GIVEN mobile shell, THEN both Clientes and Contactos items are present with Spanish labels
  - **Status:** RED
  - **Verifies:** AC #2
- **Test:** GIVEN mobile shell, WHEN tapping "Contactos", THEN router navigates to /contactos
  - **Status:** RED
  - **Verifies:** AC #2, AC #7
- **Test:** GIVEN mobile shell at /contactos, THEN Contactos item has activeItemId semantics
  - **Status:** RED
  - **Verifies:** AC #6
- **Test:** GIVEN mobile shell items, THEN each item exposes a Spanish aria-label
  - **Status:** RED
  - **Verifies:** AC #2 (accessibility)
- **Test:** GIVEN navigation, THEN window.location.reload is NOT called
  - **Status:** RED
  - **Verifies:** AC #7
- **Test:** GIVEN mobile shell, THEN content area uses dvh (not vh)
  - **Status:** RED
  - **Verifies:** AC #2 (UX spec — mobile keyboard viewport bug)

#### File: `frontend/src/app/layout/useActiveNav.test.tsx` (5 tests)

- **Test:** GIVEN URL /clientes, WHEN hook mounts, THEN activeId is "clientes"
  - **Status:** RED — module `./useActiveNav` does not exist
  - **Verifies:** AC #6
- **Test:** GIVEN URL /contactos, WHEN hook mounts, THEN activeId is "contactos"
  - **Status:** RED
  - **Verifies:** AC #6
- **Test:** GIVEN unknown URL, WHEN hook mounts, THEN activeId is null
  - **Status:** RED
  - **Verifies:** AC #6 (edge case)
- **Test:** GIVEN activeId "clientes", WHEN navigate("contactos") is called, THEN activeId becomes "contactos"
  - **Status:** RED
  - **Verifies:** AC #6
- **Test:** GIVEN navigation, THEN window.location.reload NOT invoked
  - **Status:** RED
  - **Verifies:** AC #7

#### File: `frontend/src/shared/components/NotFoundView.test.tsx` (4 tests)

- **Test:** GIVEN rendered NotFoundView, THEN Spanish heading "Página no encontrada" is visible
  - **Status:** RED — module `./NotFoundView` does not exist
  - **Verifies:** AC #4
- **Test:** GIVEN not-found view, THEN Spanish link "Ir a Clientes" with href="/clientes" is present
  - **Status:** RED
  - **Verifies:** AC #4
- **Test:** GIVEN screen-reader user, THEN container is announced via aria-live="polite"
  - **Status:** RED
  - **Verifies:** AC #4 (accessibility)
- **Test:** GIVEN Spanish content, THEN the descriptive body copy is present
  - **Status:** RED
  - **Verifies:** AC #4

#### File: `frontend/src/routes/index.test.tsx` (3 tests)

- **Test:** GIVEN user lands on /, WHEN router resolves, THEN pathname is /clientes
  - **Status:** RED — index route currently renders HomeView, not a redirect
  - **Verifies:** AC #5
- **Test:** GIVEN redirect, WHEN clientes view mounts, THEN clientes-view testid is rendered
  - **Status:** RED — `/clientes` route not registered
  - **Verifies:** AC #5
- **Test:** GIVEN redirect uses beforeLoad, THEN window.location was NOT mutated
  - **Status:** RED — redirect not yet implemented
  - **Verifies:** AC #5, AC #7

#### File: `frontend/src/routes/notFound.test.tsx` (4 tests)

- **Test:** GIVEN unknown URL, WHEN router resolves, THEN Spanish "Página no encontrada" heading appears
  - **Status:** RED — `notFoundComponent` not registered on root route
  - **Verifies:** AC #4
- **Test:** GIVEN not-found route, THEN `data-testid="app-shell"` remains rendered
  - **Status:** RED — root layout has `data-testid="app-root"`, not `app-shell`; and no shell wrapper
  - **Verifies:** AC #4
- **Test:** GIVEN not-found view, THEN link to /clientes is offered
  - **Status:** RED — NotFoundView not implemented
  - **Verifies:** AC #4
- **Test:** GIVEN unknown URL, THEN not-found container present, pathname unchanged, no silent redirect to /clientes
  - **Status:** RED — `data-testid="not-found-view"` not present yet
  - **Verifies:** AC #4

#### File: `frontend/src/routes/deepLink.test.tsx` (5 tests)

- **Test:** GIVEN direct URL /clientes, WHEN loaded, THEN clientes-view renders without redirect
  - **Status:** RED — `/clientes` route not registered
  - **Verifies:** AC #3
- **Test:** GIVEN direct URL /contactos, WHEN loaded, THEN contactos-view renders without redirect
  - **Status:** RED — `/contactos` route not registered
  - **Verifies:** AC #3
- **Test:** GIVEN direct URL /clientes, THEN no 404 copy is displayed
  - **Status:** RED
  - **Verifies:** AC #3
- **Test:** GIVEN direct URL /contactos, THEN no 404 copy is displayed
  - **Status:** RED
  - **Verifies:** AC #3
- **Test:** GIVEN switching /clientes ↔ /contactos, THEN app-shell wrapper stays mounted (SPA)
  - **Status:** RED — `app-shell` wrapper does not exist yet
  - **Verifies:** AC #7

**Total new failing tests:** 34
**Total pre-existing passing tests (from Story 1.1):** 14

---

## Data Factories Created

None required for Story 1.2 — this story is presentation-layer only and has no domain entities. Data factories will land alongside Epics 2 (Clientes) and 3 (Contactos).

---

## Fixtures Created

None required — Vitest + jsdom + RTL is sufficient. The single shared test-setup enhancement below covers both viewport switching and `window.location.reload` spying, so per-test fixtures are unnecessary.

### Shared Test Infrastructure

**File:** `frontend/src/test-setup.ts` (extended)

**Additions:**

- `globalThis.setMatchMediaWidth(width)` — installs a `matchMedia` polyfill matching the given pixel width. Tests call `setMatchMediaWidth(1280)` for desktop, `setMatchMediaWidth(375)` for mobile.
- `window.location` is replaced with a spy-able object so `window.location.reload` becomes an assertable `vi.fn()`. Global reference exposed as `globalThis.__reloadSpy`.
- `afterEach` cleanup runs RTL `cleanup()` and clears the reload spy.

---

## Mock Requirements

No external services are mocked for Story 1.2. The tests operate entirely against TanStack Router's in-memory history and rendered React components. When Epics 2 and 3 introduce API calls, MSW handlers should be added under `src/test-setup.ts` or `src/support/msw/`.

---

## Required data-testid Attributes

The DEV implementation MUST include these testids for the ATDD tests to reach GREEN:

### Root Layout (`src/routes/__root.tsx`)

- `app-shell` — Outer shell wrapper (must remain mounted across route changes). Currently the file uses `app-root`; rename or add `app-shell`.

### Placeholder route views

- `clientes-view` — Wrapper element inside `src/routes/clientes.tsx`.
- `contactos-view` — Wrapper element inside `src/routes/contactos.tsx`.

### AppShell (desktop) — `src/app/layout/AppShell.tsx`

- `nav-item-clientes` — Clientes rail entry. Must expose `data-active="true"` when the current pathname is `/clientes`.
- `nav-item-contactos` — Contactos rail entry. Must expose `data-active="true"` when the current pathname is `/contactos`.
- Each item must render as a `<button>` with an accessible name of "Clientes" or "Contactos".

### MobileShell — `src/app/layout/MobileShell.tsx`

- `mobile-nav-bar` — Wrapper for the `NavigationBar` at the bottom of the mobile shell.
- `mobile-nav-item-clientes` — Clientes item. `data-active="true"` when active.
- `mobile-nav-item-contactos` — Contactos item. `data-active="true"` when active.
- `mobile-main` — The `<main>` element wrapping `<Outlet />`. Its className MUST contain a `dvh` variant (e.g. `min-h-dvh`) — never `vh` variants (`min-h-screen`, `min-h-[100vh]`).
- Each nav item must be a `<button>` with `aria-label` containing "Clientes" / "Contactos".

### NotFoundView — `src/shared/components/NotFoundView.tsx`

- `not-found-view` — Container. Must have `aria-live="polite"`.
- Contains an `<h1>` (or `<h2>`) with visible text `Página no encontrada`.
- Contains body copy matching `/la ruta solicitada no existe/i`.
- Contains a `<Link to="/clientes">` (TanStack Router) with an accessible name matching `/ir a clientes/i`, and its rendered `<a>` has `href="/clientes"`.

**Implementation Example:**

```tsx
// src/shared/components/NotFoundView.tsx
export function NotFoundView() {
  return (
    <div data-testid="not-found-view" aria-live="polite">
      <h1>Página no encontrada</h1>
      <p>La ruta solicitada no existe. Verifica la URL o vuelve a la lista de clientes.</p>
      <Link to="/clientes">Ir a Clientes</Link>
    </div>
  )
}
```

---

## Implementation Checklist

Each failing test maps to a concrete implementation task. Tests must move from RED → GREEN one at a time.

### Test: index.test.tsx — `/` redirects to `/clientes`

**File:** `frontend/src/routes/index.test.tsx`

**Tasks to make this test pass:**

- [ ] Rewrite `frontend/src/routes/index.tsx` so the exported Route uses `beforeLoad: () => { throw redirect({ to: '/clientes' }) }` and defines no component.
- [ ] Create `frontend/src/routes/clientes.tsx` with `data-testid="clientes-view"` on its wrapper.
- [ ] Re-run `pnpm dev` (or `pnpm build`) once so TanStack Router regenerates `routeTree.gen.ts` to include `/clientes`.
- [ ] Run: `pnpm test -- src/routes/index.test.tsx`
- [ ] Test passes (green phase).

### Test: deepLink.test.tsx — `/clientes` and `/contactos` deep links

**File:** `frontend/src/routes/deepLink.test.tsx`

**Tasks:**

- [ ] Create `frontend/src/routes/clientes.tsx` (placeholder `<h1>Clientes</h1>` with `data-testid="clientes-view"`).
- [ ] Create `frontend/src/routes/contactos.tsx` (placeholder `<h1>Contactos</h1>` with `data-testid="contactos-view"`).
- [ ] Ensure `__root.tsx` wraps `<Outlet />` in a stable `data-testid="app-shell"` container so it does not remount across route transitions.
- [ ] Regenerate `routeTree.gen.ts` via dev/build.
- [ ] Run: `pnpm test -- src/routes/deepLink.test.tsx`
- [ ] Test passes.

### Test: notFound.test.tsx — Unknown route renders Spanish not-found view

**File:** `frontend/src/routes/notFound.test.tsx`

**Tasks:**

- [ ] Implement `frontend/src/shared/components/NotFoundView.tsx` per the "Implementation Example" above.
- [ ] Register it on the root route: `createRootRoute({ component: RootLayout, notFoundComponent: NotFoundView })`.
- [ ] Keep the shell (`data-testid="app-shell"`) wrapping `<Outlet />` so it renders around the not-found component.
- [ ] Run: `pnpm test -- src/routes/notFound.test.tsx`
- [ ] Test passes.

### Test: NotFoundView.test.tsx — Component-level view test

**File:** `frontend/src/shared/components/NotFoundView.test.tsx`

**Tasks:**

- [ ] Same NotFoundView implementation as above (heading, aria-live, body copy, link).
- [ ] Run: `pnpm test -- src/shared/components/NotFoundView.test.tsx`
- [ ] Test passes.

### Test: AppShell.test.tsx — Desktop shell

**File:** `frontend/src/app/layout/AppShell.test.tsx`

**Tasks:**

- [ ] Create `frontend/src/app/layout/AppShell.tsx` composing `LayoutBase` from `siesa-ui-kit` with `productName="Siesa Agents"`.
- [ ] Populate `navigationItems: NavigationRailGroupMenuItem[]` with Clientes and Contactos entries — each with `id`, Spanish `label`, Heroicons icon, `active` derived from the current pathname, and `onClick` calling `router.navigate({ to })`.
- [ ] Emit a stable `data-testid="nav-item-clientes"` / `nav-item-contactos` on each item (may need a thin wrapper around the item's icon slot or a rendered surface).
- [ ] Expose `data-active="true"|"false"` reflecting the current active route.
- [ ] Ensure the surface renders visible text "Clientes", "Contactos" and "Siesa Agents".
- [ ] Install `@heroicons/react` via `pnpm add @heroicons/react`.
- [ ] Run: `pnpm test -- src/app/layout/AppShell.test.tsx`
- [ ] Test passes.

### Test: MobileShell.test.tsx — Mobile shell (NavigationBar bottom nav)

**File:** `frontend/src/app/layout/MobileShell.test.tsx`

**Tasks:**

- [ ] Create `frontend/src/app/layout/MobileShell.tsx` rendering `Navbar` + `NavigationBar` (siesa-ui-kit).
- [ ] Wrap the `NavigationBar` in a `<div data-testid="mobile-nav-bar">`.
- [ ] For each item, render its interactive surface with `data-testid="mobile-nav-item-{id}"` and `data-active="true"|"false"` derived from the active route.
- [ ] Each item MUST have a Spanish `aria-label`.
- [ ] Wrap `<Outlet />` in `<main data-testid="mobile-main" className="pb-14 pt-16 min-h-dvh overflow-y-auto">`.
- [ ] `onItemClick` MUST use `router.navigate` — never `window.location`.
- [ ] Run: `pnpm test -- src/app/layout/MobileShell.test.tsx`
- [ ] Test passes.

### Test: useActiveNav.test.tsx — Router-active hook

**File:** `frontend/src/app/layout/useActiveNav.test.tsx`

**Tasks:**

- [ ] Create `frontend/src/app/layout/useActiveNav.ts` exporting `useActiveNav()` returning `{ activeId, navigate }`.
- [ ] `activeId` derived from `useRouterState({ select: s => s.location.pathname })`. Values: `'clientes'`, `'contactos'`, or `null`.
- [ ] `navigate(id)` calls `useNavigate()` with `to: '/{id}'`.
- [ ] Never touch `window.location`.
- [ ] Consume the hook in both `AppShell.tsx` and `MobileShell.tsx` (single source of truth).
- [ ] Run: `pnpm test -- src/app/layout/useActiveNav.test.tsx`
- [ ] Test passes.

---

## Running Tests

```bash
# Run all Story 1.2 failing tests (and the full frontend suite)
cd frontend && pnpm test

# Run only the layout tests
cd frontend && pnpm test -- src/app/layout/

# Run only the routing tests
cd frontend && pnpm test -- src/routes/

# Watch mode during implementation
cd frontend && pnpm test:watch

# Debug a single file
cd frontend && pnpm vitest run src/app/layout/AppShell.test.tsx
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 34 new tests written and failing:
  - 22 fail due to missing modules (`AppShell`, `MobileShell`, `useActiveNav`, `NotFoundView`).
  - 12 fail due to missing routes (`/clientes`, `/contactos`), missing redirect at `/`, missing `notFoundComponent`, and the shell not exposing `data-testid="app-shell"`.
- Test-setup extended with `matchMedia` polyfill and a spy-able `window.location.reload`.
- All test file paths align with the story's Task 6 file list.

**Verification (recorded):**

```
Test Files  7 failed | 5 passed (12)
     Tests  12 failed | 14 passed (26)
```

Of the 26 tests reported, 14 are pre-existing Story 1.1 tests (still passing) and 12 are the new tests reported at the case level. The remaining 22 new tests belong to test files that error out at import time because their target modules don't exist yet — these are counted as suite failures, not per-case failures. All 34 new tests are in RED.

### GREEN Phase (DEV Team — Next Steps)

1. Pick one failing test from the Implementation Checklist (start with `index.test.tsx` — simplest redirect).
2. Read the failing assertions to understand the exact contract.
3. Implement the minimal code needed to make that test pass.
4. Run only that file: `pnpm vitest run <path>`.
5. Move to the next test.

Recommended order:

1. `routes/index.test.tsx` (redirect)
2. `routes/deepLink.test.tsx` (place `clientes.tsx` and `contactos.tsx`)
3. `shared/components/NotFoundView.test.tsx`
4. `routes/notFound.test.tsx` (wires NotFoundView into the router)
5. `app/layout/useActiveNav.test.tsx`
6. `app/layout/AppShell.test.tsx`
7. `app/layout/MobileShell.test.tsx`

### REFACTOR Phase (DEV Team — After All Tests Pass)

- Move shared `NavigationRailGroupMenuItem[]` / `NavigationBarItem[]` construction into a single module so desktop and mobile shells share the item definitions.
- Extract Heroicons wiring into a `navIcons.ts` map for reuse.
- Ensure no `any` types remain (AC #8).

---

## Notes

- **Playwright not installed** — E2E scenarios from `test-design-epic-1.md` (TC-E1-P1-02, TC-E1-P1-03) are covered here at the component + memory-history level, which is sufficient per the story's explicit Task 6 file list and Testing Standards section.
- **`@testing-library/user-event` not installed** — tests use `fireEvent` from `@testing-library/react` (already available) plus router state assertions.
- **`@heroicons/react` not installed** — the DEV team must add it via `pnpm add @heroicons/react` before the AppShell/MobileShell tests can pass. This is called out explicitly in the implementation checklist.
- **`app-root` vs `app-shell`** — the current `__root.tsx` uses `data-testid="app-root"`. The tests expect `app-shell`. The DEV team should rename it (or add a nested `app-shell` wrapper) so the shell wraps `<Outlet />` and remains mounted across route changes.
- **`window.location.reload` spy** — implemented in `test-setup.ts` by replacing `window.location` with a spy-able clone. If any test needs to interact with the original location, it can reach `globalThis.__reloadSpy`.

---

## Knowledge Base References Applied

- **selector-resilience.md** — all interactive elements queried by `data-testid` (`app-shell`, `nav-item-*`, `mobile-nav-*`, `clientes-view`, `contactos-view`, `not-found-view`) or accessible roles/names.
- **timing-debugging.md** — no hard waits; router transitions awaited via `waitFor` or successive `Promise.resolve()` microtasks.
- **test-quality.md** — Given-When-Then structure applied to every test; one behavior asserted per test; deterministic viewport control via `setMatchMediaWidth`.
- **network-first.md** — no external network in Story 1.2 (presentation-only), but the pattern is documented in the shared test-setup for future stories.
- **test-levels-framework.md** — component tests dominate because the story is UI-only; no API or E2E level is added.

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff).
2. DEV picks up tests one by one in the recommended order and drives each to GREEN.
3. When all 34 tests pass and `pnpm typecheck` + `pnpm build` are clean, mark story 1.2 as ready for review.
