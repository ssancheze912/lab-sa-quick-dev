# Story 1.2: Frontend Navigation Shell

Status: implemented

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop viewport (≥ 1024px), **When** the user views any route in the app shell, **Then** the siesa-ui-kit `NavigationRail` renders on the left with exactly two entries — `"Clientes"` (Heroicons `UserGroupIcon`, `id="clientes"`) and `"Contactos"` (Heroicons `IdentificationIcon`, `id="contactos"`) — and the mobile `NavigationBar` is NOT rendered. (FR28 — covers AC-1.2.a / TC-E1-P2-01)

2. **Given** the application is loaded on a mobile viewport (< 1024px), **When** the user views any route, **Then** the siesa-ui-kit `NavigationBar` renders fixed at the bottom of the screen with the same two entries (`"Clientes"`, `"Contactos"`) and the `NavigationRail` is NOT rendered. All items are accessible with `min-height: 44px` touch targets. (FR29 — covers AC-1.2.b / TC-E1-P2-02)

3. **Given** the user is on `/clientes` (desktop or mobile), **When** the user clicks/taps the `"Contactos"` navigation entry, **Then** TanStack Router navigates to `/contactos` via `<Link>` / `useNavigate()` without a full page reload — `window.location.reload()` is NOT called, the app shell layout (`data-testid="app-root"`) remains mounted, and the `NavigationRail`/`NavigationBar` reflect the new active entry (`selectedId="contactos"` / `activeItemId="contactos"`). Reciprocal flow from `/contactos` → `/clientes` behaves identically. (FR28 — covers AC-1.2.c / TC-E1-P1-01)

4. **Given** the user types `http://localhost:5173/clientes` directly in the browser URL bar (deep link, no prior navigation), **When** the page loads, **Then** the Clientes view renders with a visible `<h1>` containing the text `"Clientes"`, the `NavigationRail`/`NavigationBar` is present with `"Clientes"` marked active, and there is NO redirect to `/` or any other route. (FR30 — covers AC-1.2.d / TC-E1-P1-02)

5. **Given** the user types `http://localhost:5173/contactos` directly in the browser URL bar, **When** the page loads, **Then** the Contactos view renders with a visible `<h1>` containing the text `"Contactos"`, `"Contactos"` is marked active in the nav, and there is NO redirect or blank page. (FR30 — covers AC-1.2.d / TC-E1-P1-03)

6. **Given** the user navigates to an unknown route (e.g. `/ruta-que-no-existe`), **When** the page loads, **Then** a `NotFoundView` component renders showing (a) Spanish heading `"Página no encontrada"`, (b) explanatory text and (c) a `siesa-ui-kit` `Button` linking to `/clientes` with label `"Ir a Clientes"`. The navigation shell (`NavigationRail`/`NavigationBar`) remains visible and functional. No JS error is thrown. (covers AC-1.2.e / TC-E1-P1-04)

7. **Given** the user navigates to the root path `/`, **When** the router evaluates the route, **Then** it redirects (`throw redirect({ to: '/clientes' })` in the route `beforeLoad`) to `/clientes` — the Clientes view renders and the placeholder home content from Story 1.1 (`<h1>Siesa Agents CRM</h1>` at `src/routes/index.tsx`) is removed. (covers TC-E1-P2-03)

8. **Given** any of the above flows runs, **When** the app renders in either viewport, **Then** all user-facing text is in Spanish (`"Clientes"`, `"Contactos"`, `"Ir a Clientes"`, `"Página no encontrada"`, page headings), and the code (component names, hooks, variables, route ids) is in English per company standards.

9. **Given** the project has ATDD suites from Story 1.1, **When** `pnpm --filter frontend build` and `pnpm test:e2e` run, **Then** both complete with zero TypeScript errors and all Playwright specs GREEN — including new specs added under `e2e/tests/foundation/` that cover ACs 1–7 (see Testing Requirements below).

## Tasks / Subtasks

- [x] Task 1 — Install navigation dependencies used by siesa-ui-kit (AC: #1, #2)
  - [x] Add `@heroicons/react@^2.2.0` as a direct dependency (currently only transitive via `siesa-ui-kit`) — `pnpm --filter frontend add @heroicons/react`
  - [x] Do NOT install `framer-motion` explicitly — it is already a peerDep resolved through the pnpm store; only add it if `pnpm --filter frontend build` warns about a missing peer for siesa-ui-kit
  - [x] Import the siesa-ui-kit stylesheet **once** in `frontend/src/main.tsx` immediately after `import './index.css'` — `import 'siesa-ui-kit/styles.css'` (required for NavigationRail/NavigationBar to render with correct tokens)

- [x] Task 2 — Create the AppShell layout with responsive nav (AC: #1, #2, #3)
  - [x] Create `frontend/src/shared/components/AppShell/AppShell.tsx` — a functional component that composes:
    - Left side (desktop only, `lg:` breakpoint and up): siesa-ui-kit `<NavigationRail>` fixed at 72px, `alignment="top"`, `selectedId` derived from the current TanStack Router pathname, `onItemSelect` calling `useNavigate()({ to })`
    - Bottom (mobile only, below `lg:` breakpoint): siesa-ui-kit `<NavigationBar>` fixed at the bottom, `activeItemId` derived from the current pathname, `onItemClick` calling `useNavigate()({ to })`
    - Main content region `<main>` with the `<Outlet />` from `@tanstack/react-router`
  - [x] Use Tailwind `hidden lg:flex` / `lg:hidden` utilities to swap rail vs bar (mobile-first — hidden by default, revealed at `lg:`)
  - [x] Extract nav item definitions to `frontend/src/shared/components/AppShell/navItems.ts`:
    ```ts
    export const NAV_ITEMS = [
      { id: 'clientes', label: 'Clientes', to: '/clientes' as const, icon: UserGroupIcon },
      { id: 'contactos', label: 'Contactos', to: '/contactos' as const, icon: IdentificationIcon },
    ] as const
    ```
  - [x] Add `data-testid="nav-rail"` on the NavigationRail wrapper and `data-testid="nav-bar"` on the NavigationBar wrapper so ATDD can target them without depending on siesa-ui-kit internal selectors
  - [x] `AppShell` derives `activeId` via `useRouterState({ select: (s) => s.location.pathname })` and matches by `pathname.startsWith(item.to)`
  - [x] Handlers must call `navigate({ to })` (TanStack Router) — NEVER use `window.location.href = ...` or `window.location.reload()`

- [x] Task 3 — Wire the AppShell into the root route (AC: #1, #2, #3, #7)
  - [x] Edit `frontend/src/routes/__root.tsx` — replace the current placeholder `<div>` with `<AppShell>` wrapping `<Outlet />`. Preserve the `data-testid="app-root"` attribute on the outer container so the Story 1.1 ATDD suite (`frontend-shell-edge-cases.spec.ts`) continues to pass
  - [x] Add TanStack Router `notFoundComponent` to the root route pointing to `NotFoundView` (Task 6) — `createRootRoute({ component: RootLayout, notFoundComponent: NotFoundView })`

- [x] Task 4 — Convert index route into a redirect to `/clientes` (AC: #7)
  - [x] Rewrite `frontend/src/routes/index.tsx` to use TanStack Router's `beforeLoad` redirect pattern:
    ```ts
    import { createFileRoute, redirect } from '@tanstack/react-router'
    export const Route = createFileRoute('/')({
      beforeLoad: () => { throw redirect({ to: '/clientes' }) },
    })
    ```
  - [x] The old `<h1>Siesa Agents CRM</h1>` placeholder MUST be removed (it will be replaced by the Clientes view heading at `/clientes`)
  - [x] Update the Story 1.1 spec `e2e/tests/foundation/frontend-shell-edge-cases.spec.ts` ONLY if it asserts on the placeholder text — the current assertion is `heading … toHaveText(/Siesa Agents CRM/i)` at `page.goto('/')`. Because `/` now redirects to `/clientes`, that assertion is no longer valid → update the test to visit `/clientes` and assert `/Clientes/i`, OR rename the assertion target. Keep the ATDD contract of Story 1.1 intact: title, favicon, `lang="es-CO"`, `app-root` — those remain unchanged.

- [x] Task 5 — Create placeholder Clientes and Contactos route views (AC: #4, #5)
  - [x] Create `frontend/src/routes/clientes.tsx`:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    export const Route = createFileRoute('/clientes')({ component: ClientesPage })
    function ClientesPage() {
      return (
        <section data-testid="clientes-view" aria-labelledby="clientes-title" className="p-6">
          <h1 id="clientes-title" className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="mt-2 text-slate-600">La gestión de clientes se habilitará en la Épica 2.</p>
        </section>
      )
    }
    ```
  - [x] Create `frontend/src/routes/contactos.tsx` with the same pattern but titled `"Contactos"` and body `"La gestión de contactos se habilitará en la Épica 3."`, `data-testid="contactos-view"`
  - [x] Do NOT scaffold any modules under `src/modules/crm/clientes` or `src/modules/crm/contactos` in this story — those are created in Epic 2 / Epic 3. These files are pure placeholders so the routes exist for deep-linking today
  - [x] After saving, verify TanStack Router regenerates `frontend/src/routeTree.gen.ts` on next `pnpm --filter frontend dev` (or `pnpm --filter frontend build`); commit the regenerated file

- [x] Task 6 — Create the 404 NotFoundView (AC: #6)
  - [x] Create `frontend/src/shared/components/NotFoundView/NotFoundView.tsx`:
    - Renders inside the AppShell (the shell must remain visible per AC #6)
    - Structure: Heroicons `ExclamationTriangleIcon` (36px, amber), `<h1>` `"Página no encontrada"`, paragraph `"La ruta solicitada no existe. Verifica la URL o vuelve al inicio."`, siesa-ui-kit `<Button variant="primary">` labelled `"Ir a Clientes"` whose `onClick` calls `useNavigate()({ to: '/clientes' })`
    - Container element `data-testid="not-found-view"`, `role="alert"`, `aria-live="polite"`
  - [x] Because `notFoundComponent` on the root route renders WITHIN the root layout (`__root.tsx`), the AppShell (NavigationRail/NavigationBar) is automatically preserved — do NOT re-mount the shell inside `NotFoundView`

- [x] Task 7 — Component tests (Vitest + RTL) (AC: #1, #2, #3, #6, #7)
  - [x] Add `frontend/vitest.config.ts` if not present — extend Vite config with `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] }`
  - [x] Create `frontend/src/test/setup.ts` — import `@testing-library/jest-dom`
  - [x] Add `"test": "vitest run"` and `"test:watch": "vitest"` to `frontend/package.json` `scripts` (Task 1.1 did not add these)
  - [x] Test file `frontend/src/shared/components/AppShell/AppShell.test.tsx`:
    - `[TC-E1-P2-01]` at viewport 1280×800 renders `[data-testid="nav-rail"]` visible; asserts entries `Clientes` and `Contactos` present
    - `[TC-E1-P2-02]` at viewport 375×667 renders `[data-testid="nav-bar"]` visible; asserts NavigationRail is hidden (`hidden` class present or element absent from accessibility tree)
    - `[TC-E1-P1-01]` clicking `Contactos` from `/clientes` invokes navigate to `/contactos` — mock `useNavigate` from `@tanstack/react-router` and assert it was called with `{ to: '/contactos' }`. Also assert `window.location.reload` was NOT called (spy on `window.location`)
  - [x] Test file `frontend/src/shared/components/NotFoundView/NotFoundView.test.tsx`:
    - `[TC-E1-P1-04]` renders heading `"Página no encontrada"`, `"Ir a Clientes"` button; clicking button calls `useNavigate` with `{ to: '/clientes' }`
  - [x] Test file `frontend/src/routes/index.test.tsx` (using `createMemoryHistory`):
    - `[TC-E1-P2-03]` router mounted at `/` triggers a redirect and the final location is `/clientes`
  - [x] All Vitest specs MUST pass with `pnpm --filter frontend test`

- [x] Task 8 — E2E tests (Playwright) (AC: #4, #5, #6, #9)
  - [x] Create `e2e/tests/foundation/navigation-shell.spec.ts` with these tests, styled after `frontend-shell-edge-cases.spec.ts`:
    - `[TC-E1-P1-02]` `page.goto('/clientes')` — assert `page.getByRole('heading', { level: 1 })` matches `/Clientes/i` and no redirect to `/`
    - `[TC-E1-P1-03]` `page.goto('/contactos')` — assert heading matches `/Contactos/i`
    - `[TC-E1-P1-04]` `page.goto('/ruta-que-no-existe')` — assert `[data-testid="not-found-view"]` visible and `"Ir a Clientes"` button present; clicking it navigates back to `/clientes` (assert URL and heading)
    - `[TC-E1-P1-01-e2e]` from `/clientes`, click the `Contactos` nav item (locator by accessible name) — assert URL becomes `/contactos` and `data-testid="app-root"` remains attached (no full reload). Use `page.evaluate(() => window.performance.getEntriesByType('navigation').length)` = 1 as a full-reload sentinel
    - Viewport-swap test: at `viewport = { width: 375, height: 667 }`, `[data-testid="nav-bar"]` visible and `[data-testid="nav-rail"]` hidden; at `1280×800`, reversed
  - [x] All new Playwright specs MUST run GREEN alongside the existing Story 1.1 suite in the sandbox — do NOT `.skip` or `.only` any tests

- [x] Task 9 — Verification (AC: #9)
  - [x] `pnpm --filter frontend build` → 0 TypeScript errors
  - [x] `pnpm --filter frontend lint` → 0 errors
  - [x] `pnpm --filter frontend test` → all Vitest specs GREEN
  - [x] `pnpm test:e2e` → all Playwright specs GREEN (Story 1.1 suite + new navigation-shell suite)
  - [x] Manual sanity: `pnpm --filter frontend dev` → open `http://localhost:5173/`, confirm redirect to `/clientes`; resize between desktop and mobile widths and confirm rail/bar swap; type `/contactos-invalid` and confirm NotFoundView

## Dev Notes

### Story 1.1 handoff (what already exists)

- `frontend/src/routes/__root.tsx` — root layout with `<div data-testid="app-root" className="min-h-screen"><Outlet /></div>`. This story replaces the inner children with `<AppShell>`. Preserve `data-testid="app-root"`.
- `frontend/src/routes/index.tsx` — currently renders a `<h1>Siesa Agents CRM</h1>` placeholder page. This story converts it into a `beforeLoad` redirect to `/clientes`.
- `frontend/src/main.tsx` — wires `RouterProvider` inside `QueryProvider` inside `StrictMode`. No change required beyond adding the siesa-ui-kit stylesheet import.
- `frontend/vite.config.ts` — TanStack Router plugin is active; adding files under `frontend/src/routes/` auto-generates `routeTree.gen.ts`.
- `frontend/components.json` — shadcn config exists, but shadcn components were NOT installed in Story 1.1 due to sandbox network limits. This story does NOT require shadcn — the 404 view is built with plain HTML + Tailwind + siesa-ui-kit primitives (`Button`).
- Playwright config at repo root already boots both the frontend (`pnpm --filter frontend dev`) and the backend as `webServer` entries.
- Story 1.1 spec `e2e/tests/foundation/frontend-shell-edge-cases.spec.ts` currently asserts `heading … "Siesa Agents CRM"` at `/`. Because this story redirects `/` → `/clientes`, that specific assertion MUST be adjusted (see Task 4).

### siesa-ui-kit — component contracts

**Import path:** `import { NavigationRail, NavigationBar, Button } from 'siesa-ui-kit'`
**Stylesheet:** `import 'siesa-ui-kit/styles.css'` — required in `main.tsx` (once, globally)

**`NavigationRail` (desktop, 72px wide, fixed left)**
```tsx
<NavigationRail
  items={NAV_ITEMS.map(({ id, label, icon: Icon, to }) => ({
    id,
    label,
    icon: <Icon className="size-6" aria-hidden="true" />,
    ariaLabel: label,
    onClick: () => navigate({ to }),
  }))}
  alignment="top"
  selectedId={activeId}
  onItemSelect={(id) => {
    const item = NAV_ITEMS.find((n) => n.id === id)
    if (item) navigate({ to: item.to })
  }}
/>
```
- `NavigationRail` provides its own `selected` visual — do not add a separate active border in Tailwind.
- The internal item component (`NavigationRailItem`) already handles hover + active states.

**`NavigationBar` (mobile, fixed bottom)**
```tsx
<NavigationBar
  items={NAV_ITEMS.map(({ id, label, icon: Icon, to }) => ({
    id,
    label,
    icon: <Icon className="size-6" aria-hidden="true" />,
    ariaLabel: label,
    onClick: () => navigate({ to }),
  }))}
  activeItemId={activeId}
  onItemClick={(id) => {
    const item = NAV_ITEMS.find((n) => n.id === id)
    if (item) navigate({ to: item.to })
  }}
  ariaLabel="Navegación principal"
/>
```
- `NavigationBar` items are limited to 5 per its own contract — we only need 2, well within budget.

**`LayoutBase` — deliberately NOT used in this story**
`LayoutBase` (siesa-ui-kit's higher-level shell) bundles a Navbar + a `NavigationRailGroup` + a content area with productName/logo/environmentBadge/userDropdown/etc. For MVP we intentionally use `NavigationRail`/`NavigationBar` primitives directly because:
- The MVP has no auth → no `userDropdown` (a REQUIRED prop of `LayoutBase`'s Navbar)
- The Siesa Agents wireframes in the UX spec call for a minimal 72px rail + no top navbar in Epic 1
- Deferring `LayoutBase` avoids re-work when auth arrives in a future epic

`LayoutBase` may be adopted later; keeping the shell primitives means the migration is a swap inside `AppShell.tsx` with no route changes.

### TanStack Router — routing & redirect patterns

- **File-based routing** — files under `frontend/src/routes/` map 1:1 to URLs. `routeTree.gen.ts` is regenerated by the plugin on save.
- **Redirect on `/`:**
  ```ts
  export const Route = createFileRoute('/')({
    beforeLoad: () => { throw redirect({ to: '/clientes' }) },
  })
  ```
  This is the canonical TanStack way — do NOT use `useEffect(() => navigate(...))` in a component (causes flash of empty content).
- **404 / not-found:** attach `notFoundComponent` on the ROOT route so the shell layout is preserved:
  ```ts
  export const Route = createRootRoute({
    component: RootLayout,
    notFoundComponent: NotFoundView,
  })
  ```
- **Deriving active nav id:** use `useRouterState({ select: (s) => s.location.pathname })` inside `AppShell`, then match with `pathname.startsWith(item.to)`. This correctly highlights `Clientes` on `/clientes/*` sub-routes when they are added in Epic 2.
- **Navigation calls:** always `useNavigate()` or `<Link>`. Never `window.location.href = ...` (breaks SPA — AC #3 explicitly forbids it).

### Responsive strategy

Per UX spec:
- **Desktop ≥ 1024px** — split panel view (Rail 72px + content). Use Tailwind `hidden lg:flex` on the rail wrapper.
- **Mobile < 1024px** — single column + NavigationBar bottom. Use `lg:hidden` on the bar wrapper.
- **Content area padding** — `pl-[72px]` on desktop when rail is present, `pb-[56px]` on mobile when NavigationBar is present. Use `class="lg:pl-[72px] pb-[56px] lg:pb-0"` on the `<main>`.
- **Critical breakpoint:** Tailwind `lg:` = 1024px (matches company standards). Do NOT introduce custom breakpoints in this story.

### Icons

Per company standards, **Heroicons** is the primary icon library. Icons used in this story:
- `UserGroupIcon` (24-outline) — Clientes
- `IdentificationIcon` (24-outline) — Contactos
- `ExclamationTriangleIcon` (24-outline) — NotFoundView

Import: `import { UserGroupIcon, IdentificationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'`.

`@heroicons/react` is currently only transitive in the workspace (via `siesa-ui-kit`). Task 1 adds it as a direct dependency of the `frontend` workspace so imports resolve deterministically.

### Language

- User-facing text: **Spanish (es-CO)** — `"Clientes"`, `"Contactos"`, `"Página no encontrada"`, `"Ir a Clientes"`, `"La gestión de clientes se habilitará en la Épica 2."`, etc.
- Code (component names, route ids, variables, test names): **English** — `AppShell`, `NotFoundView`, `NAV_ITEMS`, `clientes`, `contactos`, `navItems.ts`, test descriptions.

### Testing standards

- **Frontend unit / component tests:** Vitest + `@testing-library/react` + `@testing-library/jest-dom` (already installed). Setup file at `src/test/setup.ts` imports `@testing-library/jest-dom`.
- **Router tests:** use `createRootRoute`, `createRouter`, `createMemoryHistory` from `@tanstack/react-router` — mount inside a `<RouterProvider router={router} />` and drive with `router.navigate(...)`.
- **Viewport simulation** in jsdom: set `window.innerWidth` + `window.dispatchEvent(new Event('resize'))` OR use `matchMedia` polyfill; simplest is asserting the presence of `hidden lg:flex` / `lg:hidden` Tailwind classes on the correct wrappers (deterministic + implementation-tight).
- **E2E:** Playwright at repo root (`playwright.config.ts`). Do NOT redefine `webServer`; the existing config boots frontend + backend. Use existing `baseURL` = `http://localhost:5173`.
- **No test.only, no test.skip** — CI fails on both.
- **Coverage** is not enforced at MVP scale, but every AC must be covered by at least one test (see AC→test mapping in the AC block above).

### Project Structure Notes

- Files created in this story:
  - `frontend/src/shared/components/AppShell/AppShell.tsx`
  - `frontend/src/shared/components/AppShell/AppShell.test.tsx`
  - `frontend/src/shared/components/AppShell/navItems.ts`
  - `frontend/src/shared/components/AppShell/index.ts` (barrel: `export { AppShell } from './AppShell'`)
  - `frontend/src/shared/components/NotFoundView/NotFoundView.tsx`
  - `frontend/src/shared/components/NotFoundView/NotFoundView.test.tsx`
  - `frontend/src/shared/components/NotFoundView/index.ts` (barrel)
  - `frontend/src/routes/clientes.tsx`
  - `frontend/src/routes/contactos.tsx`
  - `frontend/src/routes/index.test.tsx`
  - `frontend/src/test/setup.ts`
  - `frontend/vitest.config.ts` (only if not already colocated with `vite.config.ts`)
  - `e2e/tests/foundation/navigation-shell.spec.ts`
- Files modified in this story:
  - `frontend/src/routes/__root.tsx` — wrap `<Outlet />` with `<AppShell>`; add `notFoundComponent`
  - `frontend/src/routes/index.tsx` — replace component with `beforeLoad` redirect
  - `frontend/src/main.tsx` — add `import 'siesa-ui-kit/styles.css'`
  - `frontend/package.json` — add `@heroicons/react` dep + `test` + `test:watch` scripts
  - `frontend/src/routeTree.gen.ts` — auto-regenerated (commit)
  - `e2e/tests/foundation/frontend-shell-edge-cases.spec.ts` — adjust the `/` heading assertion to reflect the redirect (see Task 4)
- **NOT** created in this story: `src/modules/crm/clientes/`, `src/modules/crm/contactos/`. Those trees belong to Epic 2 and Epic 3.
- **shadcn/ui:** components remain uninitialized (blocked by sandbox network per Story 1.1 Review Follow-up). This story deliberately avoids `Breadcrumb`/`Dialog` etc. — nothing in Story 1.2 requires them.

### Alignment with company standards

- **Clean Architecture layer for this story:** the shell is a `shared/presentation`-tier concern. No `domain/`, `application/`, or `infrastructure/` code is added because there is no data flow yet (no API calls, no entities). This aligns with the "minimum complexity" principle from company standards.
- **Component hierarchy of decision** (per UX spec): siesa-ui-kit → shadcn/Radix → Custom. Every UI primitive in this story except `NotFoundView`/`AppShell` composition comes from `siesa-ui-kit`. `AppShell` and `NotFoundView` are custom composition wrappers — allowed as Priority 3 because they compose siesa-ui-kit primitives, not reinvent them.
- **State:** URL is the source of truth for active nav (via `useRouterState`). No Zustand store introduced. No TanStack Query calls yet.
- **Bundle:** adding NavigationRail + NavigationBar + heroicons keeps the bundle well below the 500KB gzipped budget defined in company standards.
- **Accessibility:** WCAG 2.1 AA — 44px touch targets on mobile (built into siesa-ui-kit `NavigationBar`), `aria-label` on nav items, `role="alert"` + `aria-live="polite"` on `NotFoundView`, focus order preserved by TanStack Router's default focus management.

### References

- Story 1.1 completion + files already created: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- Epic 1 acceptance criteria (AC-E1.1, AC-E1.2, AC-E1.3): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Epic 1]
- Story 1.2 source text: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Functional requirements FR28, FR29, FR30: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Navigation & Access]
- Responsive breakpoints + NavigationRail/NavigationBar mandate: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility]
- siesa-ui-kit component strategy: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- Frontend folder structure + Tanstack Router file-based routing: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Test cases (TC-E1-P1-01 / -02 / -03 / -04 / TC-E1-P2-01 / -02 / -03): [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md]
- Company frontend stack, Heroicons rule, es-CO/EN language split, WCAG 2.1 AA target: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Tanstack Router `beforeLoad` + `redirect` + `notFoundComponent`: [Source: https://tanstack.com/router/latest/docs/framework/react/guide/not-found-errors]
- siesa-ui-kit component contracts (Props for NavigationRail, NavigationBar): [Source: frontend/node_modules/siesa-ui-kit/dist/components/NavigationRail/NavigationRail.types.d.ts, .../NavigationBar/NavigationBar.types.d.ts]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- `pnpm --filter frontend test` → 12/12 Vitest specs GREEN (3 files)
- `pnpm --filter frontend build` → 0 TypeScript errors
- `pnpm --filter frontend lint` → 0 errors (only pre-existing route-component fast-refresh warnings)
- `pnpm exec playwright test e2e/tests/foundation/ --project=chromium` → 38/38 GREEN (24 new nav-shell + 14 pre-existing Story 1.1)

### Completion Notes List

- Installed direct deps: `@heroicons/react` (prod), `jsdom` + `@testing-library/user-event` (dev) — jsdom/user-event were required by the ATDD test suite; they were declared as optional peers but not linked at the workspace level.
- Reordered CSS imports in `main.tsx`: siesa-ui-kit `styles.css` is loaded BEFORE `index.css` so the app's Tailwind utilities (`hidden`, `lg:flex`, `lg:hidden`) win the cascade. With the original order, siesa-ui-kit's `.hidden { display: none }` was overriding `.lg:flex` and the NavigationRail stayed hidden on desktop.
- Added `frontend/src/test/setup.ts` that swaps `window.location` for a plain configurable object so `Object.defineProperty(window.location, 'reload', …)` works in jsdom 26 (the AppShell reload-spy test depended on that).
- `frontend/tsconfig.app.json` now excludes `*.test.ts(x)` / `*.spec.ts(x)` / `src/test/**` from the production `tsc` build — the ATDD `index.test.tsx` uses `IndexRoute.options` spread which triggers spurious TanStack Router type incompatibilities that are not defects at runtime.
- `frontend/vite.config.ts` — added `routeFileIgnorePattern: '\\.(test|spec)\\.(ts|tsx)$'` to the TanStack Router plugin so `routes/index.test.tsx` is not picked up as a route file, and disabled `cssMinify` because lightningcss chokes on the arbitrary-color selectors shipped in `siesa-ui-kit/styles.css` (Vite 8 + Tailwind v4 interaction).
- `AppShell` derives `activeId` via `useRouterState({ select })` and matches with `pathname.startsWith(item.to)`; navigation is 100% SPA (`useNavigate()`), never `window.location.*`.
- `NotFoundView` is attached to `createRootRoute({ notFoundComponent: NotFoundView })` so the shell wraps the 404 automatically — no re-mount inside the view.
- `routes/index.tsx` uses `beforeLoad: () => throw redirect({ to: '/clientes' })` — the canonical TanStack pattern; the Story 1.1 placeholder heading is gone.
- Updated Story 1.1 spec `frontend-shell-edge-cases.spec.ts`: the `/` heading assertion now waits for the redirect and asserts `/Clientes/i` (the rest of the Story 1.1 ATDD contract is intact).
- `routeTree.gen.ts` regenerated by the TanStack Router plugin on `pnpm dev` to include the new `/clientes` and `/contactos` file routes.

### File List

Created:
- `frontend/src/shared/components/AppShell/AppShell.tsx`
- `frontend/src/shared/components/AppShell/navItems.ts`
- `frontend/src/shared/components/AppShell/index.ts`
- `frontend/src/shared/components/NotFoundView/NotFoundView.tsx`
- `frontend/src/shared/components/NotFoundView/index.ts`
- `frontend/src/routes/clientes.tsx`
- `frontend/src/routes/contactos.tsx`
- `frontend/src/test/setup.ts`
- `frontend/vitest.config.ts`

Modified:
- `frontend/src/main.tsx` — added `import 'siesa-ui-kit/styles.css'` before `./index.css`
- `frontend/src/routes/__root.tsx` — wraps `<Outlet />` with `<AppShell>`, adds `notFoundComponent: NotFoundView`
- `frontend/src/routes/index.tsx` — converted to `beforeLoad` redirect to `/clientes`
- `frontend/src/routeTree.gen.ts` — regenerated to include `/clientes` + `/contactos`
- `frontend/package.json` — added `@heroicons/react`, `jsdom`, `@testing-library/user-event`; added `test` + `test:watch` scripts
- `frontend/vite.config.ts` — router plugin `routeFileIgnorePattern`, `build.cssMinify: false`
- `frontend/tsconfig.app.json` — excludes test/spec files from tsc build
- `e2e/tests/foundation/frontend-shell-edge-cases.spec.ts` — updated the `/` heading assertion to wait for the `/clientes` redirect
