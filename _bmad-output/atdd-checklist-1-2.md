# ATDD Checklist — Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-29
**Author:** SiesaTeam (TEA / ATDD agent)
**Primary Test Level:** Component (Vitest + React Testing Library) with supporting E2E (Playwright)
**Status:** RED phase — tests written, expected to FAIL until implementation lands.

---

## Story Summary

Add a persistent navigation shell so users can move between the **Clientes** and **Contactos** sections of the application without full page reloads, with a responsive layout that adapts to desktop and mobile and supports deep-linking and graceful 404 handling.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria → Test Mapping

| AC | Summary | Test Cases | Level |
|----|---------|------------|-------|
| AC #1 | Desktop: NavigationRail with Clientes/Contactos, SPA navigation (no reload) | TC-E1-P2-01, TC-E1-P1-01 | Component |
| AC #2 | Mobile: NavigationBar (bottom), rail hidden, items tappable | TC-E1-P2-02 | Component |
| AC #3 | Deep link to `/clientes` and `/contactos` renders correct view, no redirect | TC-E1-P1-02, TC-E1-P1-03 | E2E |
| AC #4 | Unknown route shows graceful 404 with shell layout intact ("404" + "Página no encontrada") | TC-E1-P1-04 | Component |
| AC #5 | `/` redirects to `/clientes` via router-level `redirect()` | TC-E1-P2-03 | Component |
| AC #6 | Active item highlighted on active route (no custom CSS overrides) | Embedded in TC-E1-P2-01 / TC-E1-P2-02 | Component |

All P0/P1/P2 cases for Story 1.2 from `test-design-epic-1.md` are covered.

---

## Failing Tests Created (RED Phase)

### Component Tests — 5 files / 13 test cases

#### `frontend/src/routes/__root.test.tsx`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P2-01 | renders the NavigationRail with Clientes and Contactos entries | #1, #6 | `data-testid="navigation-rail"` not in DOM (shell still placeholder) |
| TC-E1-P2-01 | hides the NavigationBar on desktop | #1 | Either both elements absent or wrong viewport gating |
| TC-E1-P2-02 | renders the NavigationBar with Clientes and Contactos entries | #2, #6 | `data-testid="navigation-bar"` not in DOM |
| TC-E1-P2-02 | hides the NavigationRail on mobile | #2 | Rail/bar swap not implemented |
| (AC #6) | marks "Clientes" as active when route is /clientes | #6 | `data-testid="nav-item-clientes-active"` not in DOM |
| (AC #6) | marks "Contactos" as active when route is /contactos | #6 | `data-testid="nav-item-contactos-active"` not in DOM |

#### `frontend/src/routes/navigation.test.tsx`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P1-01 | navigates from Clientes to Contactos without a full reload | #1 | `nav-link-contactos` data-testid missing / route `/contactos` not registered |
| TC-E1-P1-01 | navigates from Contactos back to Clientes without a full reload | #1 | `nav-link-clientes` data-testid missing / route `/clientes` not registered |

#### `frontend/src/routes/notfound.test.tsx`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P1-04 | renders the Spanish 404 heading for an unknown route | #4 | `defaultNotFoundComponent` not configured on router |
| TC-E1-P1-04 | renders the Spanish copy "Página no encontrada" | #4 | Same — NotFoundPage absent |
| TC-E1-P1-04 | keeps the shell layout visible (NavigationRail still mounted) on 404 | #4 | Shell not yet implemented |

#### `frontend/src/routes/index.test.tsx`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P2-03 | router location resolves to /clientes when navigating to / | #5 | Index route currently renders a placeholder instead of `beforeLoad: () => { throw redirect({ to: '/clientes' }) }` |
| TC-E1-P2-03 | renders the Clientes placeholder after the redirect resolves | #5 | `/clientes` route file does not exist yet |

### E2E Tests — 2 files / 6 test cases

#### `e2e/tests/navigation/deep-link-clientes.spec.ts`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P1-02 | renders the Clientes view when navigating directly to /clientes | #3 | `/clientes` route not registered in TanStack Router |
| TC-E1-P1-02 | does NOT redirect to / (root) when deep-linking to /clientes | #3 | Route resolves to 404 currently |
| TC-E1-P1-02 | shows the shell navigation alongside the Clientes view | #1, #2, #3 | NavigationRail/Bar not yet implemented |

#### `e2e/tests/navigation/deep-link-contactos.spec.ts`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P1-03 | renders the Contactos view when navigating directly to /contactos | #3 | `/contactos` route not registered |
| TC-E1-P1-03 | does NOT redirect to / (root) when deep-linking to /contactos | #3 | Same |
| TC-E1-P1-03 | shows the shell navigation alongside the Contactos view | #1, #2, #3 | NavigationRail/Bar not yet implemented |

---

## Test Levels Distribution

```
Story 1.2 ATDD Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)             ▌▌▌▌▌▌        6 tests (2 spec files)
  Component (Vitest + RTL)     ▌▌▌▌▌▌▌▌▌▌▌▌▌ 13 tests (4 spec files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                         19 tests
```

Rationale: Shell + routing is presentation-layer work. Most ACs are best
exercised at the **component level** with an in-memory TanStack router for
speed and determinism. E2E is reserved for the deep-link scenarios that
must travel through the real Vite dev server and a real browser URL bar.

---

## Data Factories Created

**None for this story** — Story 1.2 is purely presentation/navigation
infrastructure. There are no domain entities to mock; placeholder route
components carry no data dependencies. Factories will be introduced in
Epics 2 and 3 (clientes / contactos domain stories).

---

## Fixtures Created

**No new Playwright fixtures created.** The existing
`e2e/fixtures/base.fixture.ts` already exposes `clientesPage` and
`contactosPage` page-level fixtures and is sufficient. The new specs use
the default `test` import from `@playwright/test` to keep the deep-link
tests independent of any helper navigation logic — they must exercise the
raw `page.goto()` path so the deep-link contract is verified end-to-end.

---

## Mock Requirements

**None** — Story 1.2 does not call the backend. No HTTP interception is
required. Placeholder route components render static markup only.

---

## Required `data-testid` Attributes (DEV implementation contract)

The following selectors are referenced by the failing tests and **must
be added during implementation** so the tests can flip to GREEN. They
live in `frontend/src/routes/__root.tsx` (shell) and the placeholder
route components.

### Shell — `__root.tsx`

- `navigation-rail` — root container of the desktop `<NavigationRail>` (rendered only at `lg:` ≥ 1024 px). Place on the element that wraps the siesa-ui-kit rail (e.g. `<div data-testid="navigation-rail"><NavigationRail … /></div>`).
- `navigation-bar` — root container of the mobile `<NavigationBar>` (rendered only at `< lg:`).
- `nav-link-clientes` — the clickable nav element that routes to `/clientes` (must be reachable in both rail and bar — use the same id since only one is mounted at a time).
- `nav-link-contactos` — the clickable nav element that routes to `/contactos`.
- `nav-item-clientes-active` — present **only when** the active route prefix is `/clientes`. Implementer can either toggle a sibling marker element or, preferred, set `data-testid={isActive ? 'nav-item-clientes-active' : 'nav-item-clientes'}` on the link.
- `nav-item-contactos-active` — same pattern for the Contactos entry.

### Placeholder routes

- `frontend/src/routes/clientes.tsx` renders `<h1>Clientes</h1>` (queryable by `getByRole('heading', { name: 'Clientes' })`).
- `frontend/src/routes/contactos.tsx` renders `<h1>Contactos</h1>` (queryable by `getByRole('heading', { name: 'Contactos' })`).
- NotFound component renders `<h1>404</h1>` and the body text `"Página no encontrada"` (queryable by `getByRole('heading', { name: '404' })` and `getByText('Página no encontrada')`).

---

## Implementation Checklist (RED → GREEN map)

### Task 1 — Wire TanStack Router with redirect + not-found

- [ ] Create `frontend/src/router.tsx` exporting `createRouter()` with:
  - `routeTree`, `defaultPreload: 'intent'`, `scrollRestoration: true`
  - `defaultNotFoundComponent: NotFoundPage`
  - `defaultErrorComponent: ErrorPage` (minimal — can be a tiny stub)
- [ ] Define `NotFoundPage` (heading `"404"`, body `"Página no encontrada"`) inline.
- [ ] Keep the `declare module '@tanstack/react-router'` type registration.
- [ ] Refactor `frontend/src/main.tsx` to import `createRouter` from `./router`.
- [ ] Run `pnpm --filter frontend test -- notfound.test.tsx` → tests pass.

### Task 2 — App shell in `__root.tsx`

- [ ] Replace placeholder `RootLayout` with `LayoutBase` + `Navbar` (top, `productName="Siesa Agents"`) + responsive nav.
- [ ] Build the `navigationItems` array with two entries (`id`, `label`, `icon`, `to`).
- [ ] Install Heroicons if missing: `pnpm --filter frontend add @heroicons/react`.
- [ ] Render `<NavigationRail>` inside a `<div data-testid="navigation-rail">` wrapper, gated on `lg:` (use Tailwind `hidden lg:block`).
- [ ] Render `<NavigationBar>` inside a `<div data-testid="navigation-bar">` wrapper, gated on `< lg:` (`lg:hidden`).
- [ ] Map each item to a TanStack `<Link to={item.to}>` (or `useNavigate()`); attach `data-testid={'nav-link-' + item.id}`.
- [ ] Compute active state from `useRouterState().location.pathname` (prefix-match per spec) and set `data-testid={'nav-item-' + item.id + (active ? '-active' : '')}` on the link (or a sibling marker).
- [ ] Run `pnpm --filter frontend test -- __root.test.tsx` → tests pass.

### Task 3 — Placeholder routes

- [ ] Create `frontend/src/routes/clientes.tsx` exporting `createFileRoute('/clientes')` with a component that renders `<main><h1>Clientes</h1></main>`.
- [ ] Create `frontend/src/routes/contactos.tsx` exporting `createFileRoute('/contactos')` with a component that renders `<main><h1>Contactos</h1></main>`.
- [ ] Let `@tanstack/router-plugin/vite` regenerate `routeTree.gen.ts` on save.

### Task 4 — Root `/` redirects to `/clientes`

- [ ] Replace `frontend/src/routes/index.tsx` body with `createFileRoute('/')({ beforeLoad: () => { throw redirect({ to: '/clientes' }) } })`.
- [ ] Run `pnpm --filter frontend test -- index.test.tsx` → tests pass.

### Task 5 — SPA navigation test

- [ ] With Task 2 + Task 3 complete, run `pnpm --filter frontend test -- navigation.test.tsx` → tests pass.

### Task 6 — E2E deep-link tests

- [ ] With placeholder routes mounted, start the dev server (or rely on `playwright.config.ts` `webServer`).
- [ ] Run `pnpm exec playwright test e2e/tests/navigation/` from the repo root → all 6 cases pass.

### Final gates

- [ ] `pnpm --filter frontend exec tsc -b` exits 0.
- [ ] `pnpm --filter frontend run lint` exits 0.
- [ ] `pnpm --filter frontend run build` produces `dist/` with bundle < 500 KB gzipped.
- [ ] All 19 ATDD tests are GREEN.

---

## Running the Tests

```bash
# Component tests (Vitest)
pnpm --filter frontend test

# Specific component test files
pnpm --filter frontend test -- frontend/src/routes/__root.test.tsx
pnpm --filter frontend test -- frontend/src/routes/navigation.test.tsx
pnpm --filter frontend test -- frontend/src/routes/notfound.test.tsx
pnpm --filter frontend test -- frontend/src/routes/index.test.tsx

# E2E tests (Playwright)
pnpm exec playwright test e2e/tests/navigation/
pnpm exec playwright test e2e/tests/navigation/deep-link-clientes.spec.ts
pnpm exec playwright test e2e/tests/navigation/deep-link-contactos.spec.ts

# Debug a Playwright spec interactively
pnpm exec playwright test e2e/tests/navigation/deep-link-clientes.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase — Complete

- Tests written and committed in expected-fail state.
- Selectors (`data-testid`) and component contracts documented above.
- No implementation code was modified by this workflow.

### GREEN Phase — DEV agent

1. Tackle Task 3 (placeholder routes) first — it unblocks 4 separate test files.
2. Then Task 1 (router refactor) — enables the 404 cases.
3. Then Task 4 (index redirect) — short, isolated.
4. Then Task 2 (shell layout) — the bulk of UI work; finishes both component and E2E suites.
5. Re-run the test commands above after each task; do not move on while any test added by this workflow is still RED.

### REFACTOR Phase — DEV agent

With the full suite GREEN, the implementer is free to extract `navigationItems`, the active-state computation, or the rail/bar swap into helper hooks/components. Tests must remain GREEN throughout. Do not change the test contract (selectors, copy, breakpoints) without coordinating with the QA owner of `test-design-epic-1.md`.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — reused the existing `e2e/fixtures/base.fixture.ts`; no extension needed for this story.
- **network-first.md** — applied `page.waitForResponse(...)` registered BEFORE `page.goto()` in deep-link specs.
- **component-tdd.md** — colocated `*.test.tsx` files next to the routes; in-memory `createMemoryHistory` for deterministic router state.
- **selector-resilience.md** — `data-testid` for the navigation containers and links; `getByRole` for headings; no CSS selectors.
- **test-quality.md** — Given-When-Then comments, atomic assertions, isolated tests, no hard waits.
- **timing-debugging.md** — used `waitFor` / `findByX` to wait for router transitions; no `setTimeout` / `page.waitForTimeout`.

---

## Notes / Caveats for the DEV agent

1. **jsdom + matchMedia**: jsdom does not implement `matchMedia`. Each component test stubs it locally so siesa-ui-kit's responsive logic (if it consults `matchMedia`) gets a deterministic answer. If a `matchMedia` setup polyfill is added globally in `vitest.config.ts` later, the inline stubs are still safe — they simply override the global for that test.
2. **Tailwind CSS-only responsiveness in jsdom**: jsdom does not evaluate Tailwind responsive classes (`hidden lg:block`). The tests therefore rely on **components either being mounted or not mounted at the chosen viewport**, not on visual `display:none`. The implementer must mount the rail vs bar conditionally (either via JS read of `window.innerWidth` / `matchMedia`, or by always rendering both inside containers with `data-testid` and adding a runtime guard). The simplest pattern that satisfies the tests is:

   ```tsx
   const isDesktop = useMediaQuery('(min-width: 1024px)')
   return (
     <>
       {isDesktop && <div data-testid="navigation-rail"><NavigationRail .../></div>}
       {!isDesktop && <div data-testid="navigation-bar"><NavigationBar .../></div>}
     </>
   )
   ```

   This is also compatible with the Tailwind-class strategy at runtime in the browser; both can coexist.
3. **Active state selector**: the tests look up `data-testid="nav-item-{id}-active"`. The implementer may instead emit a sibling `<span data-testid="nav-item-clientes-active" hidden />` next to each link as a "marker", if mutating the `data-testid` on the link itself complicates the active/inactive transition. Either approach is valid.
4. **E2E reuses the existing Playwright `webServer`** declared in `playwright.config.ts` (`pnpm --filter frontend dev`), so no extra setup is required to run the deep-link specs.
5. **Story 1.1 baseline**: `frontend/src/main.tsx`, `__root.tsx`, and `index.tsx` exist as placeholders. They are explicitly *modified* (not deleted) by Story 1.2 per the story's "Project Structure Notes".

---

**Generated by BMad TEA / ATDD workflow** — 2026-06-29
