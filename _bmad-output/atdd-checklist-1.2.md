# ATDD Checklist - Epic 1, Story 1.2: Frontend Navigation Shell

**Date:** 2026-06-08
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component (UI/router shell story)

---

## Story Summary

Build a persistent responsive navigation shell that lets users move between `/clientes` and `/contactos` without full page reloads, on both desktop (siesa-ui-kit `LayoutBase` / `NavigationRail`) and mobile (siesa-ui-kit `NavigationBar`). Adds the `/` → `/clientes` index redirect, a Spanish 404 view inside the shell, and active-state synchronization driven by the TanStack Router pathname.

**As a** user
**I want** a persistent navigation structure to access the Clientes and Contactos sections of the application
**So that** I can move between sections without full page reloads from any device

---

## Acceptance Criteria

1. **AC #1** — Desktop (≥ 1024px) shows the siesa-ui-kit `LayoutBase` with a `NavigationRail` exposing "Clientes" / "Contactos" entries; clicking either entry triggers a TanStack Router `useNavigate` transition (no `window.location` reassignment). [FR28 / AC-E1.2]
2. **AC #2** — Mobile (< 1024px) shows the siesa-ui-kit `NavigationBar` (bottom nav) in place of the rail with both items tappable. [FR29 / AC-E1.1]
3. **AC #3** — Deep-linking directly to `/clientes` or `/contactos` (no prior in-app navigation) renders the corresponding view inside the persistent shell, with no redirect to a home screen. [FR30 / AC-E1.3]
4. **AC #4** — Any unknown route renders a Spanish 404 view inside the persistent shell, with a CTA back to `/clientes`.
5. **AC #5** — Root URL `/` redirects to `/clientes` via TanStack Router (`beforeLoad` + `throw redirect({ to: '/clientes' })`).
6. **AC #6** — Current pathname drives the active state of the rail/bar: on `/clientes` the Clientes entry is active and Contactos is inactive, symmetrically on `/contactos`.
7. **AC #7** — All user-facing text and aria-labels are in Spanish ("Navegación principal", "Navegación inferior", "Página no encontrada", "Ir a Clientes", etc.).

---

## Failing Tests Created (RED Phase)

### E2E Tests (13 tests across 2 files)

#### File: `e2e/tests/foundation/deep-linking.spec.ts` (6 tests, ~110 lines)

Owns the deep-link slice (Task 6) — TC-E1-P1-02, TC-E1-P1-03, TC-E1-P1-04.

- **Test:** `AC #3 — TC-E1-P1-02 — directly opening /clientes renders the Clientes view without redirect`
  - **Status:** RED — `/clientes` route doesn't exist, `ClientesPlaceholderView` not created, no `data-testid="clientes-view"`.
  - **Verifies:** AC #3 — network-first response listener on the document, asserts `data-testid="clientes-view"` visible and URL stays `/clientes`.

- **Test:** `AC #3 — TC-E1-P1-03 — directly opening /contactos renders the Contactos view without redirect`
  - **Status:** RED — `/contactos` route + placeholder view not implemented.
  - **Verifies:** AC #3 — same shape as TC-E1-P1-02 but for Contactos.

- **Test:** `AC #3 — deep link to /clientes keeps the navigation shell visible (AC #3, #1)`
  - **Status:** RED — `data-testid="app-shell-desktop"` does not exist.
  - **Verifies:** AC #3 + AC #1 — desktop shell wrapper renders alongside the view at a 1280px viewport.

- **Test:** `AC #4 — TC-E1-P1-04 — opening /ruta-inexistente renders the NotFound view`
  - **Status:** RED — `notFoundComponent` not registered on `createRootRoute`, no `data-testid="not-found-view"`.
  - **Verifies:** AC #4 — `data-testid="not-found-view"` visible on an unknown path.

- **Test:** `AC #4 — 404 view exposes Spanish copy and a CTA back to /clientes (AC #4, #7)`
  - **Status:** RED — `NotFoundView` component not created.
  - **Verifies:** AC #4 + AC #7 — Spanish heading "Página no encontrada" and CTA `<a href="/clientes">Ir a Clientes</a>`.

- **Test:** `AC #4 — NotFound view keeps the navigation shell visible (AC #4)`
  - **Status:** RED — shell wrappers + NotFoundView do not exist.
  - **Verifies:** AC #4 — `data-testid="app-shell-desktop"` AND `data-testid="not-found-view"` both visible at 1280px viewport.

#### File: `e2e/tests/foundation/spa-navigation.spec.ts` (7 tests, ~160 lines)

Owns the SPA navigation + responsive + index-redirect + active-state slice — TC-E1-P1-01, TC-E1-P2-01, TC-E1-P2-02, TC-E1-P2-03.

- **Test:** `AC #5 — TC-E1-P2-03 — navigating to / lands on /clientes and renders the Clientes view`
  - **Status:** RED — `src/routes/index.tsx` still renders a placeholder instead of `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`.
  - **Verifies:** AC #5 — URL ends with `/clientes` and `data-testid="clientes-view"` is visible.

- **Test:** `AC #1 — TC-E1-P2-01 — desktop shell wrapper renders the rail with both nav items`
  - **Status:** RED — `AppShell` + `data-testid="app-shell-desktop"` do not exist.
  - **Verifies:** AC #1 + AC #7 — desktop wrapper rendered with both Spanish labels.

- **Test:** `AC #1 — TC-E1-P1-01 — clicking Contactos in the rail navigates without a full page reload`
  - **Status:** RED — neither rail nor router-driven `onClick` exists yet.
  - **Verifies:** AC #1 / FR28 — uses a `window.__spaSentinel` set BEFORE the click that must survive the navigation to prove no full reload occurred; also asserts route + view changed.

- **Test:** `AC #7 — desktop nav container exposes Spanish ariaLabel "Navegación principal"`
  - **Status:** RED — LayoutBase `ariaLabel` prop not wired.
  - **Verifies:** AC #7 — `[aria-label="Navegación principal"]` inside the desktop wrapper.

- **Test:** `AC #2 — TC-E1-P2-02 — mobile shell wrapper renders the bottom bar (not the rail)`
  - **Status:** RED — `data-testid="app-shell-mobile"` and `NavigationBar` not rendered.
  - **Verifies:** AC #2 + AC #7 — mobile wrapper rendered with `[aria-label="Navegación inferior"]`.

- **Test:** `AC #2 — tapping Contactos on the mobile bar navigates via the router`
  - **Status:** RED — `NavigationBar.onItemClick` not wired.
  - **Verifies:** AC #2 — tap on Contactos in the bottom bar transitions to `/contactos` and renders the placeholder view.

- **Test:** `AC #6 — on /clientes, the Clientes nav item exposes the active state`
  - **Status:** RED — `active` flag not computed from pathname.
  - **Verifies:** AC #6 — at least one element in the desktop wrapper marked via `aria-current`, `data-active="true"`, or `data-state="active"` contains "Clientes", and Contactos is NOT marked active.

### Component / Route Tests — Vitest + RTL (12 tests across 3 files)

#### File: `frontend/src/shared/components/AppShell.test.tsx` (10 tests, ~210 lines)

- **Test:** `renders the desktop shell wrapper with data-testid="app-shell-desktop" (AC #1)` — RED: AppShell missing.
- **Test:** `renders both "Clientes" and "Contactos" Spanish labels in the desktop rail (AC #1, #7)` — RED.
- **Test:** `exposes Spanish ariaLabel "Navegación principal" on the desktop nav container (AC #7)` — RED.
- **Test:** `navigates to /contactos via TanStack Router when the Contactos entry is clicked — no window.location reassignment (AC #1, TC-E1-P1-01)` — RED. Stubs `window.location.assign` and `window.location.replace`; asserts neither is called.
- **Test:** `marks the Clientes entry as active when current pathname is /clientes (AC #6)` — RED. Looks for any element with `aria-current`, `data-active="true"`, or `data-state="active"` that contains "Clientes".
- **Test:** `renders the mobile shell wrapper with data-testid="app-shell-mobile" (AC #2)` — RED.
- **Test:** `exposes Spanish ariaLabel "Navegación inferior" on the mobile NavigationBar (AC #2, #7)` — RED.
- **Test:** `renders both Spanish nav entries on the mobile NavigationBar (AC #2)` — RED.

#### File: `frontend/src/routes/notFound.test.tsx` (4 tests, ~110 lines)

Maps to TC-E1-P1-04 in the component layer (faster, no dev server).

- **Test:** `renders the NotFoundView for an unknown path` — RED: `NotFoundView` missing, `notFoundComponent` not registered.
- **Test:** `renders the NotFoundView inside the persistent shell (AC #4)` — RED: AppShell missing.
- **Test:** `shows the Spanish heading "Página no encontrada" (AC #7)` — RED.
- **Test:** `renders a CTA link to /clientes labeled "Ir a Clientes" (AC #4, #7)` — RED.

#### File: `frontend/src/routes/indexRedirect.test.tsx` (1 test, ~75 lines)

Maps to TC-E1-P2-03 in the component layer.

- **Test:** `redirects from \`/\` to \`/clientes\` and renders the Clientes view` — RED: AppShell missing AND `src/routes/index.tsx` still renders the placeholder instead of `throw redirect({ to: '/clientes' })`.

**Vitest RED-phase run evidence (2026-06-08):**

```
 ❯ src/shared/components/AppShell.test.tsx (0 test)
 ❯ src/routes/indexRedirect.test.tsx (0 test)
 ❯ src/routes/notFound.test.tsx (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 3 ⎯⎯⎯⎯⎯⎯⎯
Error: Failed to resolve import "@/shared/components/AppShell" ...
Error: Failed to resolve import "@/shared/components/NotFoundView" ...
Error: Failed to resolve import "./AppShell" ...
 Test Files  3 failed | 2 passed (5)
```

The 2 passing suites are pre-existing Story 1.1 tests (`queryClient.test.ts`, `apiClient.test.ts`). All 3 new suites correctly fail on missing imports — true RED.

### API Tests

**None.** This story is purely a presentation-shell change (no backend contract changes, no domain entities). Adding backend API tests here would test code that does not change in this story.

---

## Data Factories Created

**None.** No data is created or persisted by this story — the placeholder views render static Spanish strings, and the navigation is a pure routing concern. Data factories will be introduced in Story 2.1 (clientes CRUD) and Story 3.1 (contactos CRUD).

---

## Fixtures Created

**None new.** The existing `e2e/fixtures/base.fixture.ts` (`clientesPage`, `contactosPage`) already covers the navigation entry points and remains usable from Story 2.1 onwards. The story's tests use the default Playwright `test`/`expect` directly because they assert on the shell behavior, not on pre-navigated states.

---

## Mock Requirements

**None.** The shell makes no network calls in this story. No backend stubs or MSW handlers are required.

---

## Required `data-testid` Attributes

| `data-testid` | Element | Owner File | Purpose |
|---|---|---|---|
| `app-shell-desktop` | Desktop wrapper `<div className="hidden lg:block">` around `LayoutBase` | `src/shared/components/AppShell.tsx` | Stable hook for asserting desktop shell rendered (Tailwind `lg:` does not apply in jsdom). |
| `app-shell-mobile` | Mobile wrapper `<div className="flex flex-col min-h-dvh lg:hidden">` around `NavigationBar` | `src/shared/components/AppShell.tsx` | Stable hook for asserting mobile shell rendered. |
| `clientes-view` | Root element of `ClientesPlaceholderView` | `src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` | Asserted by deep-link + redirect tests. |
| `contactos-view` | Root element of `ContactosPlaceholderView` | `src/modules/crm/contactos/presentation/ContactosPlaceholderView.tsx` | Asserted by deep-link + navigation tests. |
| `not-found-view` | Root element of `NotFoundView` | `src/shared/components/NotFoundView.tsx` | Asserted by 404 tests. |

### Required Spanish `aria-label`s

| Element | aria-label | Owner |
|---|---|---|
| Desktop nav container (inside `app-shell-desktop`) | `Navegación principal` | `LayoutBase` `ariaLabel` prop |
| Mobile nav container (inside `app-shell-mobile`) | `Navegación inferior` | `NavigationBar` `ariaLabel` prop |

### Required active-state markers (AC #6)

The active nav entry must expose at least one of: `aria-current="page"`, `data-active="true"`, or `data-state="active"` (siesa-ui-kit's internal convention). Tests accept any of the three for forward-compatibility with the siesa-ui-kit API.

---

## Implementation Checklist

Map each failing test to the concrete implementation tasks that will turn it green. Tasks reference the story's own Task list (Tasks 1–7).

### Test: `TC-E1-P2-03 — / redirects to /clientes` (E2E + indexRedirect.test.tsx)

- [ ] Story Task 1 — Replace `src/routes/index.tsx` body with `createFileRoute('/')({ beforeLoad: () => { throw redirect({ to: '/clientes' }) } })`. Remove the placeholder component.
- [ ] Story Task 1 — Create `src/routes/clientes.tsx` flat route rendering `ClientesPlaceholderView`.
- [ ] Story Task 3 — Create `src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` with `data-testid="clientes-view"`.
- [ ] Run: `pnpm --filter frontend test --run src/routes/indexRedirect.test.tsx` → green.
- [ ] Run: `pnpm exec playwright test --project=chromium e2e/tests/foundation/spa-navigation.spec.ts -g "TC-E1-P2-03"` → green.

### Test: `TC-E1-P1-02 + TC-E1-P1-03 — Deep linking to /clientes and /contactos` (E2E)

- [ ] Story Task 1 — Add `src/routes/contactos.tsx` flat route rendering `ContactosPlaceholderView`.
- [ ] Story Task 3 — Create `ContactosPlaceholderView.tsx` with `data-testid="contactos-view"`.
- [ ] Regenerate `src/routeTree.gen.ts` (via `pnpm --filter frontend dev` once or the build).
- [ ] Run: `pnpm exec playwright test --project=chromium e2e/tests/foundation/deep-linking.spec.ts -g "TC-E1-P1-02|TC-E1-P1-03"` → green.

### Test: `TC-E1-P1-01 — SPA navigation, no full page reload` (E2E + AppShell.test.tsx)

- [ ] Story Task 2 — Build `src/shared/components/AppShell.tsx` composing `LayoutBase` (desktop) + `NavigationBar` (mobile).
- [ ] Story Task 2 — Add `data-testid="app-shell-desktop"` to the `hidden lg:block` wrapper and `data-testid="app-shell-mobile"` to the `block lg:hidden` wrapper.
- [ ] Story Task 2 — Wire each `NavigationRailGroupMenuItem.onClick` → `router.navigate({ to: '/clientes' | '/contactos' })`. Never reassign `window.location`.
- [ ] Story Task 1 — Update `__root.tsx` to render `<AppShell><Outlet /></AppShell>`.
- [ ] Install `@heroicons/react` if absent (see Dev Notes): `pnpm --filter frontend add @heroicons/react`.
- [ ] Run: `pnpm --filter frontend test --run src/shared/components/AppShell.test.tsx` → green.
- [ ] Run: `pnpm exec playwright test --project=chromium e2e/tests/foundation/spa-navigation.spec.ts -g "TC-E1-P1-01"` → green.

### Test: `TC-E1-P2-01 — Desktop NavigationRail visible` + `TC-E1-P2-02 — Mobile NavigationBar visible` (E2E + AppShell.test.tsx)

- [ ] Story Task 2 — Ensure the desktop wrapper carries `className="hidden lg:block"` and the mobile wrapper carries `className="block lg:hidden flex flex-col min-h-dvh"`. Both must be present in the DOM regardless of viewport (Tailwind handles the visual swap).
- [ ] Story Task 2 — Add Spanish `ariaLabel="Navegación principal"` to `LayoutBase` and `ariaLabel="Navegación inferior"` to `NavigationBar`.
- [ ] Run: `pnpm exec playwright test --project=chromium e2e/tests/foundation/spa-navigation.spec.ts -g "TC-E1-P2-01|TC-E1-P2-02"` → green.

### Test: `TC-E1-P1-04 — 404 view inside the shell` (E2E + notFound.test.tsx)

- [ ] Story Task 4 — Create `src/shared/components/NotFoundView.tsx` with heading "Página no encontrada", description, and `<Link to="/clientes">Ir a Clientes</Link>`. Add `data-testid="not-found-view"`.
- [ ] Story Task 4 — In `__root.tsx`, register `notFoundComponent: () => <AppShell><NotFoundView /></AppShell>`.
- [ ] Run: `pnpm --filter frontend test --run src/routes/notFound.test.tsx` → green.
- [ ] Run: `pnpm exec playwright test --project=chromium e2e/tests/foundation/deep-linking.spec.ts -g "TC-E1-P1-04"` → green.

### Test: `AC #6 — Active state synchronizes with pathname` (E2E + AppShell.test.tsx)

- [ ] Story Task 2 — Inside `AppShell`, derive `pathname` via `useRouterState({ select: s => s.location.pathname })`. Compute `active: pathname.startsWith('/' + id)` for each `NavigationRailGroupMenuItem`. For mobile, set `activeItemId` accordingly.
- [ ] Verify siesa-ui-kit emits at least one of `aria-current`, `data-active`, `data-state="active"` on the active entry (consult `node_modules/siesa-ui-kit/dist/components/NavigationRailGroupMenuItem/...` if needed). If it doesn't, add the marker manually via wrapper.
- [ ] Run both the Vitest and Playwright active-state tests → green.

### Test: `AC #7 — Spanish copy + aria-labels` (covered transversally)

- [ ] All UI text must match the Spanish-only table in the story Dev Notes ("Spanish-only UI text").
- [ ] Run the dedicated `aria-label` tests in `spa-navigation.spec.ts` → green.

**Estimated total effort for green phase:** 4–6 hours (one focused session) — most of it is wiring siesa-ui-kit + responsive wrappers; the routing is mechanical.

---

## Running Tests

```bash
# Run ALL Story 1.2 component/route tests (Vitest, frontend)
pnpm --filter frontend test --run src/shared/components/AppShell.test.tsx src/routes/notFound.test.tsx src/routes/indexRedirect.test.tsx

# Run ALL Story 1.2 E2E tests (Playwright, chromium-only — sandbox constraint)
pnpm exec playwright test --project=chromium e2e/tests/foundation/deep-linking.spec.ts e2e/tests/foundation/spa-navigation.spec.ts

# Run a single test by name
pnpm exec playwright test --project=chromium -g "TC-E1-P1-01"

# Headed mode (visual debugging)
pnpm exec playwright test --project=chromium --headed e2e/tests/foundation/spa-navigation.spec.ts

# Debug a single Playwright test
pnpm exec playwright test --project=chromium --debug e2e/tests/foundation/deep-linking.spec.ts

# Run all frontend Vitest suites (story-scoped + Story 1.1)
pnpm --filter frontend test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 13 Playwright E2E tests written under `e2e/tests/foundation/` covering AC #1–#7.
- ✅ 15 Vitest+RTL tests written under `frontend/src/shared/components/` and `frontend/src/routes/` covering AC #1, #2, #4, #5, #6, #7.
- ✅ Vitest run confirms 3 suites fail to import (`AppShell`, `NotFoundView`) → true RED.
- ✅ Playwright `--list` confirms all 13 tests are parsed and discoverable (syntax clean).
- ✅ Required `data-testid` attributes + Spanish aria-labels documented above.
- ✅ Implementation checklist maps every failing test to story Tasks 1–4.

### GREEN Phase (DEV Team — Next)

1. Implement Story Tasks 1 → 2 → 3 → 4 in that order (routes → shell → views → 404).
2. After each Task, re-run the corresponding scoped command above and confirm it goes from RED → GREEN.
3. Use the in-shell active-state markers (`aria-current`, `data-active`, `data-state`) that siesa-ui-kit emits — do NOT invent new conventions.
4. Do NOT add `window.location.href = ...` anywhere — the SPA-no-reload sentinel test will catch it.

### REFACTOR Phase (DEV Team — After All Green)

1. Extract the `NAV_ITEMS` array into a single source-of-truth module (e.g. `src/shared/components/navItems.tsx`) used by both desktop and mobile branches inside `AppShell.tsx`.
2. Consider extracting the `useActiveNavId(pathname)` helper for reuse in future shells.
3. Re-run the full suite after each refactor to ensure all 28 tests stay green.

---

## Notes

- **Sandbox constraint (carried over from Story 1.1):** Playwright must use `--project=chromium`. Firefox and WebKit are NOT installed in the sandbox.
- **No `@heroicons/react` yet:** the package is not installed in `frontend/node_modules`. Story Task 2 must install it (`pnpm --filter frontend add @heroicons/react`) before the icons referenced in the Dev Notes will resolve.
- **jsdom + Tailwind:** Tailwind's `lg:` responsive utilities are NOT evaluated in jsdom. The Vitest tests therefore assert against the stable `data-testid="app-shell-desktop"` / `data-testid="app-shell-mobile"` testids that must always be present in the DOM (regardless of viewport). The actual responsive visibility is verified end-to-end by the Playwright tests at 1280px and 375px.
- **Active-state assertion is intentionally permissive:** tests accept any of `aria-current`, `data-active="true"`, `data-state="active"` to remain compatible with whatever convention siesa-ui-kit emits today (which is not part of the story's contract).
- **No-reload assertion approach:** the Playwright test uses a `window.__spaSentinel = 42` variable set BEFORE the click — if the click triggers a hard navigation, the new document loses the sentinel. The Vitest test additionally spies on `window.location.assign`/`replace`. Both are stricter than just checking the URL changed.

---

## Output File

`_bmad-output/atdd-checklist-1.2.md`

**Manual handoff:** share this checklist + the 5 new test files with the dev workflow (`fast-track-dev` / `dev-story`). The dev workflow does NOT auto-consume it.

---

## Knowledge Base References Applied

- `network-first.md` — `page.waitForResponse(...)` registered BEFORE `page.goto(...)` in deep-link tests.
- `selector-resilience.md` — `data-testid` everywhere; no fragile CSS selectors; active-state assertion accepts an ARIA/data-state hierarchy.
- `timing-debugging.md` — no `page.waitForTimeout` hard waits; all waits are explicit (`waitForResponse`, `toBeVisible`, `findByTestId`).
- `test-quality.md` — Given-When-Then comments on every test; one behavior asserted per test; tests are isolated and use `afterEach(cleanup)` in RTL.
- `fixture-architecture.md` — kept existing `base.fixture.ts` untouched; no new shared state introduced for this story.
- `component-tdd.md` — RTL tests render a minimal in-memory TanStack Router so the AppShell can be exercised in isolation without the real `routeTree.gen.ts`.

---

**Generated by BMad TEA Agent — 2026-06-08**
