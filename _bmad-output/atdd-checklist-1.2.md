# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL) — routing/UI-shell story, no backend

---

## Story Summary

As a user, I want a persistent navigation structure to access the Clientes and Contactos sections of the application, so that I can move between sections without full page reloads from any device.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. Desktop (`lg:` ≥ 1024px): `NavigationRail` (siesa-ui-kit) visible on the left with "Clientes"/"Contactos"; clicking navigates client-side (TanStack Router) without full reload.
2. Mobile (< 1024px): mobile `NavigationBar` (siesa-ui-kit, bottom nav) displayed instead of the rail; items are tappable (min 44×44px).
3. Deep linking: navigating directly to `/clientes` or `/contactos` renders the correct view, no redirect to a landing screen.
4. Root redirect: `/` redirects to `/clientes` (default landing section).
5. Unknown route (e.g. `/foo`): graceful Spanish 404/not-found view with a link back to `/clientes`, no crash/blank screen.
6. Active nav state: `NavigationRailGroupMenuItem.active` reflects the current route ("Clientes" active on `/clientes`, moves to "Contactos" on `/contactos`).

---

## Test Framework Note (Important Deviation from Default ATDD Tooling)

This project's test framework is **Vitest + React Testing Library**, not Playwright/Cypress (confirmed in `company-standards.md` and Story 1.1's Dev Notes: "Browser-driven Playwright tests may be blocked in the CI/dev sandbox — prioritize Vitest + RTL"). No `playwright.config.ts`/`cypress.config.ts` exists in this repo by design. Accordingly:

- "E2E" acceptance coverage for this story is implemented as **component-level integration tests** that mount the real TanStack Router tree (`RouterProvider` + `createMemoryHistory`), which is the closest equivalent to E2E navigation behavior available without a browser runtime.
- "Component" tests exercise `AppShell`/`NotFoundView` in isolation via a minimal test router.
- No API tests — this story has no backend/API calls (confirmed in Dev Notes scope boundary).

**Test infrastructure created in this ATDD pass** (did not exist before):

- `frontend/vitest.config.ts` — jsdom environment, setup file, merged on top of `vite.config.ts`
- `frontend/src/test/setup.ts` — jest-dom + vitest-axe matchers, `window.matchMedia` stub
- `frontend/src/test/support/viewport.ts` — `mockViewport('desktop' | 'mobile')` helper
- `frontend/src/test/support/renderWithRouter.tsx` — mounts a component inside a real TanStack Router instance (memory history)
- `package.json` scripts: `test` (`vitest run`), `test:watch` (`vitest`)
- Devdependencies added: `jsdom`, `@testing-library/user-event`, `vitest-axe` (were missing; required to run any component test in this repo)

---

## Failing Tests Created (RED Phase)

### Component Tests (10 tests)

**File:** `frontend/src/shared/components/AppShell.test.tsx` (94 lines)

- **AC1 — Desktop NavigationRail**
  - `should render a NavigationRail with "Clientes" and "Contactos" entries on desktop viewport` — RED: `AppShell.tsx` does not exist (module not found)
  - `should navigate to /contactos without a full page reload when clicking the Contactos rail entry` — RED: `AppShell.tsx` does not exist
- **AC2 — Mobile NavigationBar**
  - `should render the mobile NavigationBar instead of the NavigationRail on mobile viewport (< 1024px)` — RED: `AppShell.tsx` does not exist
  - `should expose Clientes and Contactos as tappable items meeting the 44x44px minimum touch target on mobile` — RED: `AppShell.tsx` does not exist
- **AC6 — Active navigation state**
  - `should mark the "Clientes" rail item as active when the current route is /clientes` — RED: `AppShell.tsx` does not exist
  - `should move the active state to "Contactos" when the current route is /contactos` — RED: `AppShell.tsx` does not exist

**File:** `frontend/src/shared/components/AppShell.a11y.test.tsx` (41 lines) — Task 6 accessibility requirement

- `should have no detectable accessibility violations on desktop (NavigationRail)` — RED: `AppShell.tsx` does not exist
- `should have no detectable accessibility violations on mobile (NavigationBar)` — RED: `AppShell.tsx` does not exist

**File:** `frontend/src/shared/components/NotFoundView.test.tsx` (29 lines)

- **AC5 — Not-found view**
  - `should display the Spanish "Página no encontrada" heading` — RED: `NotFoundView.tsx` does not exist
  - `should render a link back to /clientes for recovery` — RED: `NotFoundView.tsx` does not exist

### Routing Integration Tests (4 tests)

**File:** `frontend/src/routes/-navigation-shell.routing.test.tsx` (69 lines) — prefixed `-` per company TanStack Router convention (colocated, router-ignored)

- **AC4 — Root redirect**
  - `should redirect from "/" to "/clientes" as the default landing section` — RED (verified): renders TanStack Router's generic `<p>Not Found</p>` fallback because `routes/index.tsx` doesn't exist and no route tree is wired
- **AC3 — Deep linking**
  - `should render the Clientes view when navigating directly to /clientes` — RED (verified): no `/clientes` route registered
  - `should render the Contactos view when navigating directly to /contactos` — RED (verified): no `/contactos` route registered
- **AC5 — Unknown route handling**
  - `should render the not-found view (not a blank screen or crash) for an unknown route` — RED (verified): no `notFoundComponent` configured yet, generic fallback text shown instead of the Spanish copy

**Total: 14 tests, all RED.**

---

## Data Factories Created

None. This story has no domain entities/API payloads (navigation shell + placeholder routes only, per Dev Notes scope boundary). `viewport.ts` is a **test support helper** (not a data factory) — it stubs `window.matchMedia`/`window.innerWidth` to simulate desktop/mobile breakpoints deterministically.

---

## Fixtures Created

### Router Test Fixture

**File:** `frontend/src/test/support/renderWithRouter.tsx`

**Exports:**

- `renderWithRouter(ui, { initialPath })` — mounts `ui` inside a real `RouterProvider` with `createMemoryHistory`, starting at `initialPath`. Required because `AppShell` depends on `useNavigate()`/`useRouterState()`, which only resolve inside a router tree.

**Example Usage:**

```typescript
renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
```

No auto-cleanup needed (no external/persisted data created — pure in-memory router instance, garbage collected after each test via RTL's automatic unmount).

---

## Mock Requirements

None. No external services or APIs involved in this story (pure client-side routing/UI shell, per Dev Notes scope boundary — `ClientesView`/`ContactosView` placeholders have no data fetching).

---

## Required data-testid Attributes

### AppShell

- `navigation-rail` — Desktop `NavigationRail`/`NavigationRailGroup` container (visible only ≥ `lg:`)
- `navigation-bar` — Mobile bottom `NavigationBar` container (visible only < `lg:`)
- `app-shell-location` — Debug/test-only element exposing the current route pathname as text content, used to assert client-side navigation occurred without a full reload (can be a visually-hidden element, or omitted if the test is rewritten to assert on rendered view content instead — see Notes)

### Routes (placeholder views)

- `clientes-view` — Root element of the `/clientes` placeholder view
- `contactos-view` — Root element of the `/contactos` placeholder view

### NotFoundView

- `not-found-recovery-link` — The link/button navigating back to `/clientes`

**Implementation Example:**

```tsx
<div data-testid="navigation-rail"> ... </div>
<div data-testid="navigation-bar"> ... </div>
<a data-testid="not-found-recovery-link" href="/clientes">Volver a Clientes</a>
```

---

## Implementation Checklist

### Test: AC1/AC2/AC6 — AppShell component (6 tests)

**File:** `frontend/src/shared/components/AppShell.test.tsx`

- [ ] Run `pnpm add @heroicons/react` (Task 1)
- [ ] Create `frontend/src/shared/components/AppShell.tsx` composing `LayoutBase` (desktop rail, `navigationRailProps={{ state: 'collapsed' }}`) + standalone `NavigationBar` (mobile, wrapped `hidden lg:block`-style visibility)
- [ ] Wrap the `NavigationRailGroup`/rail container and the `NavigationBar` container with `data-testid="navigation-rail"` / `data-testid="navigation-bar"` respectively
- [ ] Derive `active`/`activeItemId` from `useRouterState({ select: (s) => s.location.pathname })`
- [ ] Wire `onClick`/`onItemClick` to `useNavigate()` for both "Clientes" and "Contactos"
- [ ] Expose current pathname via a `data-testid="app-shell-location"` element (or refactor test to assert on outlet content — dev's choice, document if changed)
- [ ] Run test: `pnpm test -- AppShell.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: Task 6 — Accessibility (2 tests)

**File:** `frontend/src/shared/components/AppShell.a11y.test.tsx`

- [ ] Ensure `NavigationBarItem`/`NavigationRailGroupMenuItem` buttons have accessible names (label text or `aria-label`)
- [ ] Verify touch targets meet 44×44px (padding/sizing) on mobile `NavigationBar` items
- [ ] Run test: `pnpm test -- AppShell.a11y.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — NotFoundView component (2 tests)

**File:** `frontend/src/shared/components/NotFoundView.test.tsx`

- [ ] Create `frontend/src/shared/components/NotFoundView.tsx` — heading "Página no encontrada", subtext, `Button`/link to `/clientes` with `data-testid="not-found-recovery-link"`
- [ ] Register via `notFoundComponent` on `createRootRoute()` in `__root.tsx`
- [ ] Run test: `pnpm test -- NotFoundView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3/AC4/AC5 — Routing integration (4 tests)

**File:** `frontend/src/routes/-navigation-shell.routing.test.tsx`

- [ ] Create `frontend/src/routes/index.tsx` — `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
- [ ] Create `frontend/src/routes/_app.tsx` — pathless layout rendering `<AppShell><Outlet /></AppShell>`
- [ ] Create `frontend/src/routes/_app/clientes.tsx` — placeholder `ClientesView` with `data-testid="clientes-view"`
- [ ] Create `frontend/src/routes/_app/contactos.tsx` — placeholder `ContactosView` with `data-testid="contactos-view"`
- [ ] Configure `notFoundComponent` on `createRootRoute()` in `__root.tsx` → `NotFoundView`
- [ ] Verify `routeTree.gen.ts` regenerates (via `pnpm run dev` or `vite build`, do not hand-edit)
- [ ] Run test: `pnpm test -- -navigation-shell.routing.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm test

# Run specific test file
pnpm test -- AppShell.test.tsx

# Watch mode (re-run on change)
pnpm test:watch

# Run only this story's routing integration test
pnpm test -- -navigation-shell.routing.test.tsx
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 14 tests total (10 component + 4 routing-integration) written
- ✅ RED phase verified by local `vitest run` — all 14 tests fail; 10 fail on module-not-found (`AppShell.tsx`/`NotFoundView.tsx` don't exist), 4 execute fully and fail on missing routes/testids
- ✅ Test infrastructure created from scratch (vitest.config.ts, setup.ts, router/viewport test helpers) — none existed before this run
- ✅ No data factories/mocks required (no domain data, no APIs in this story)
- ✅ data-testid requirements documented
- ✅ Implementation checklist created, mapped to Tasks 1–6 in the story file

### GREEN Phase (DEV Team — Next Steps)

1. Task 1 first (install `@heroicons/react`) — required by `AppShell.tsx`
2. Build `AppShell.tsx` to turn `AppShell.test.tsx` + `AppShell.a11y.test.tsx` green
3. Build `NotFoundView.tsx` to turn `NotFoundView.test.tsx` green
4. Wire the route tree (`index.tsx`, `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`, `notFoundComponent`) to turn the routing integration test green
5. Run `pnpm test` after each step

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 14 tests pass
2. Review against Dev Notes (scope boundary — no premature `modules/crm/*` folders)
3. Ensure tests still pass after cleanup

---

## Next Steps

1. Share this checklist and the 4 new spec files with the dev workflow (manual handoff)
2. Run `pnpm test` to confirm RED phase (14 failing)
3. Begin implementation using Tasks 1–6 in the story file as the execution order
4. Work one test file at a time (red → green)
5. When all tests pass, refactor and mark story ready for review

---

## Knowledge Base References Applied

- **selector-resilience.md** — `data-testid` used exclusively (no CSS class selectors) across all new tests
- **test-quality.md** — Given-When-Then structure, one behavior per test, explicit `findBy*`/`await` waits (no hard sleeps), deterministic viewport stubbing instead of real resize events
- **component-tdd.md** — Component isolation via `renderWithRouter`, red-green-refactor applied to `AppShell`/`NotFoundView`
- **test-levels-framework.md** — Component-level tests chosen over E2E because the project's test framework is Vitest+RTL (no Playwright/Cypress installed); routing integration test used as the closest equivalent to an E2E user-journey check without a browser runtime
- **timing-debugging.md** — Async assertions use `findBy*` (built-in polling/explicit wait), never fixed-duration waits

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm test`

**Results (summary):**

```
FAIL  src/shared/components/AppShell.a11y.test.tsx  — Failed to resolve import "./AppShell" (module not found)
FAIL  src/shared/components/AppShell.test.tsx        — Failed to resolve import "./AppShell" (module not found)
FAIL  src/shared/components/NotFoundView.test.tsx    — Failed to resolve import "./NotFoundView" (module not found)
FAIL  src/routes/-navigation-shell.routing.test.tsx  — 4/4 tests failed:
  × AC4 - Root redirect > should redirect from "/" to "/clientes" — Unable to find [data-testid="clientes-view"]
  × AC3 - Deep linking > should render the Clientes view — Unable to find [data-testid="clientes-view"]
  × AC3 - Deep linking > should render the Contactos view — Unable to find [data-testid="contactos-view"]
  × AC5 - Unknown route handling > should render the not-found view — Unable to find role="heading" name /página no encontrada/i
    (renders TanStack Router's generic "Not Found" fallback instead)

Test Files  4 failed (4)
     Tests  4 failed (4) [10 additional tests blocked at module-resolution level, not yet enumerable by the runner]
```

**Summary:**

- Total tests: 14
- Passing: 0 (expected)
- Failing/blocked: 14 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- `AppShell.test.tsx`, `AppShell.a11y.test.tsx`: `Failed to resolve import "./AppShell" from ... Does the file exist?` (Vite import-analysis error)
- `NotFoundView.test.tsx`: `Failed to resolve import "./NotFoundView" from ... Does the file exist?`
- `-navigation-shell.routing.test.tsx`: `TestingLibraryElementError: Unable to find an element by: [data-testid="clientes-view"]` / `[data-testid="contactos-view"]` / `Unable to find role="heading" and name /página no encontrada/i` — all because no routes are registered yet and `__root.tsx` has no `notFoundComponent`

---

## Notes

- Test framework infrastructure (`vitest.config.ts`, `src/test/setup.ts`, `jsdom`, `@testing-library/user-event`, `vitest-axe`) did not exist in this repo before this ATDD run and was created/installed as part of it — this is foundational tooling, not story-specific business logic, consistent with Story 1.1's precedent of the ATDD workflow provisioning missing scaffolding.
- `package.json` gained `test`/`test:watch` scripts (`vitest run` / `vitest`) — none existed previously.
- The routing integration test file is prefixed `-` (`-navigation-shell.routing.test.tsx`) per the TanStack Router file-based convention documented in company-standards.md and the story's own Dev Notes table, so the router plugin does not attempt to treat it as a route module (verified: without the prefix, the Vite dev/test run emitted a "does not export a Route" warning).
- `app-shell-location` (test-only) data-testid is a pragmatic seam for asserting "no full reload" client-side navigation without a full E2E browser; DEV may substitute an equivalent assertion (e.g. asserting `/contactos` placeholder content appears) if preferred — note the change in the story's Completion Notes if so.
- Per Story 1.1 Dev Notes: Playwright browser tests are blocked in this sandbox (no Chromium binary) — this is precisely why Vitest+RTL component/integration tests were used as the acceptance-test vehicle for this story, consistent with company testing standards for the frontend stack.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `./bmm/docs/tea-README.md` for workflow documentation
- Consult `./bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-07-01
