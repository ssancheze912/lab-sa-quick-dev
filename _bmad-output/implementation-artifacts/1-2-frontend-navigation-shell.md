# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport width ≥ 1024px), **When** the user views the app, **Then** the siesa-ui-kit `LayoutBase` (Navbar 64px + `NavigationRailGroup` 80px collapsed) renders and shows two navigation entries with Heroicons: "Clientes" (icono `UsersIcon`) y "Contactos" (icono `UserIcon`). Clicking either entry navigates to `/clientes` or `/contactos` using TanStack Router `useNavigate()` — no full page reload occurs (FR28). The Spanish `Navbar` shows `productName="Siesa Agents"`.

2. **Given** the application is loaded on a mobile browser viewport (width < 1024px, minimum 375px), **When** the user views the app, **Then** the desktop `NavigationRail` is hidden (`display:none` under `lg:` Tailwind class) and a siesa-ui-kit `NavigationBar` (bottom nav) is rendered with items "Clientes" and "Contactos". Each item has a minimum tap target height of 44px, an `aria-label` in Spanish, and clicking a `NavigationBar` item performs a client-side navigation to the target route without a full page reload (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar (deep link), **When** the page loads, **Then** the corresponding route view is rendered directly (no redirect to `/` or any home screen). Both routes are file-based TanStack Router routes under `src/routes/_app/` and each renders a placeholder page with an `<h1>` in Spanish ("Clientes" or "Contactos") plus an empty-state descriptor. Full lists and CRUD are deferred to Epics 2 and 3 (FR30).

4. **Given** the user navigates to an unknown route (e.g. `/ruta-que-no-existe`), **When** the page loads, **Then** a graceful 404 / "not-found" component is rendered inside the persistent shell (Navbar + NavigationRail still visible), showing a Spanish message ("La página solicitada no existe") and a `Button` link back to `/clientes`. The router's `notFoundComponent` is wired at the `__root` route so the shell remains mounted.

5. **Given** the application is at `/` (index route), **When** the router resolves, **Then** it performs an in-app redirect to `/clientes` via TanStack Router `beforeLoad → throw redirect({ to: '/clientes' })` — no `window.location.href` assignment, no visible flash of the index route.

6. **Given** the frontend project already declares `siesa-ui-kit@^1.0.255` in `frontend/package.json` (from Story 1.1), **When** the developer starts the dev server, **Then** the `siesa-ui-kit` styles are imported once from `siesa-ui-kit/styles.css` inside `src/index.css` and the resulting UI renders with the Siesa brand tokens (no visual regressions from the pre-existing landing placeholder).

7. **Given** the developer runs `pnpm exec tsc -b` from `frontend/`, **When** compilation finishes, **Then** it emits zero errors with `strict`, `noImplicitAny`, and `strictNullChecks` active — including the new routes, layout, and any generated `routeTree.gen.ts` content.

8. **Given** the developer runs the frontend unit test suite, **When** Vitest completes, **Then** the following component tests pass (covering TC-E1-P1-01, TC-E1-P1-04, TC-E1-P2-01, TC-E1-P2-02, TC-E1-P2-03 from the Epic 1 test design): SPA navigation without reload, 404 fallback, NavigationRail visible on desktop viewport, NavigationBar visible on mobile viewport, and index route redirect to `/clientes`.

## Tasks / Subtasks

- [ ] **Task 1 — Register siesa-ui-kit styles and shared shell primitives (AC: #1, #6)**
  - [ ] Add `@import "siesa-ui-kit/styles.css";` to `src/index.css` (after `@import "tailwindcss";` so Tailwind utilities win via cascade order).
  - [ ] Confirm `siesa-ui-kit` is already installed (`frontend/package.json`) — no re-install unless version drift is detected; if missing, run `pnpm add siesa-ui-kit`.
  - [ ] Add `@heroicons/react` dependency for nav icons: `pnpm --filter frontend add @heroicons/react` (mandated by company-standards.md — Heroicons is the primary icon library).
  - [ ] Create `src/shared/components/AppShell.tsx`:
    - [ ] Accepts `children: ReactNode` and reads current route via `useRouterState`.
    - [ ] Computes `activeId` (`'clientes' | 'contactos'`) from the current pathname.
    - [ ] Renders desktop shell using `LayoutBase` from `siesa-ui-kit` with `productName="Siesa Agents"`, `navigationItems` (Clientes + Contactos with `UsersIcon` and `UserIcon` Heroicons, `active` flag driven by `activeId`), and `navigationRailProps.onItemClick` that calls `navigate({ to: item.id === 'clientes' ? '/clientes' : '/contactos' })` — **no `window.location.href` assignments**.
    - [ ] Wraps `LayoutBase` in a container with `hidden lg:block` (desktop) and renders a mobile-only wrapper with `lg:hidden` containing header (product name only) + `<main>` for children + `NavigationBar` fixed at the bottom (`items` with Heroicons + Spanish `label`s + `activeItemId` + `onItemClick` router navigation).
    - [ ] The mobile `<main>` must reserve bottom padding equal to the `NavigationBar` height (`pb-16`) so content is not covered.
    - [ ] All user-facing text in Spanish: "Clientes", "Contactos", "Siesa Agents".
    - [ ] Set `data-testid="app-shell"` on the outer container, `data-testid="nav-rail"` on the desktop wrapper, and `data-testid="nav-bar"` on the mobile wrapper (needed for Vitest queries per company-standards testing rules).

- [ ] **Task 2 — Wire pathless authenticated layout route `_app` (AC: #1, #2, #4)**
  - [ ] Create `src/routes/_app.tsx` — a pathless layout route (TanStack Router `_` prefix). Structure per architecture.md:
    ```tsx
    import { Outlet, createFileRoute } from '@tanstack/react-router'
    import { AppShell } from '@/shared/components/AppShell'

    export const Route = createFileRoute('/_app')({
      component: AppLayout,
    })

    function AppLayout() {
      return (
        <AppShell>
          <Outlet />
        </AppShell>
      )
    }
    ```
  - [ ] Update `src/routes/__root.tsx` to expose the `notFoundComponent` (see Task 5) while still rendering `<Outlet />`. The `AppShell` must NOT live in `__root` — it lives in `_app` so the not-found placeholder can be rendered either inside or outside the shell (we keep it inside the shell for AC #4 by throwing 404s from `_app` children).

- [ ] **Task 3 — Add `/clientes` and `/contactos` placeholder routes under `_app` (AC: #1, #2, #3)**
  - [ ] Create `src/routes/_app/clientes.tsx`:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'

    export const Route = createFileRoute('/_app/clientes')({
      component: ClientesPlaceholderView,
    })

    function ClientesPlaceholderView() {
      return (
        <section data-testid="clientes-view" className="p-6">
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="mt-2 text-slate-600">La gestión de clientes se habilitará en el Epic 2.</p>
        </section>
      )
    }
    ```
  - [ ] Create `src/routes/_app/contactos.tsx` with the analogous structure (`data-testid="contactos-view"`, `<h1>Contactos</h1>`, "La gestión de contactos se habilitará en el Epic 3.").
  - [ ] Do NOT create `_app/clientes.$clienteId.tsx` or `_app/contactos.$contactoId.tsx` — those belong to Epics 2 and 3 (scope discipline).

- [ ] **Task 4 — Redirect root `/` to `/clientes` (AC: #5)**
  - [ ] Overwrite `src/routes/index.tsx`:
    ```tsx
    import { createFileRoute, redirect } from '@tanstack/react-router'

    export const Route = createFileRoute('/')({
      beforeLoad: () => {
        throw redirect({ to: '/clientes' })
      },
    })
    ```
  - [ ] Remove the old placeholder JSX/component export — the route must resolve exclusively via `beforeLoad` redirect. No landing content is rendered.

- [ ] **Task 5 — Global 404 not-found component (AC: #4)**
  - [ ] Create `src/shared/components/NotFoundView.tsx` rendering: `<h1>Página no encontrada</h1>`, `<p>La página solicitada no existe.</p>`, and a siesa-ui-kit `Button` linking to `/clientes` via TanStack Router `<Link>` (label: "Ir a Clientes"). Set `data-testid="not-found-view"`.
  - [ ] Wire the router's global not-found handling:
    - [ ] In `src/main.tsx`, extend the `createRouter` call with `defaultNotFoundComponent: () => <NotFoundView />`.
    - [ ] Alternatively (preferred) — set `notFoundComponent: NotFoundView` on the `_app` route so the 404 renders **inside** the persistent shell (AC #4 explicitly requires the shell to remain visible on 404).
    - [ ] Verify: navigating to `/ruta-que-no-existe` shows the AppShell (Navbar + Rail) with the 404 view mounted in the content area.

- [ ] **Task 6 — TypeScript configuration for `routeTree.gen.ts` (AC: #7)**
  - [ ] Verify `src/routeTree.gen.ts` regenerates on `pnpm run dev` and now contains routes: `__root`, `_app`, `_app/clientes`, `_app/contactos`, `index`.
  - [ ] Run `pnpm exec tsc -b` and fix any TypeScript errors introduced by the new files. Do NOT commit `routeTree.gen.ts` (already in `.gitignore` per Story 1.1).
  - [ ] Confirm `NavigationRailGroupMenuItem[]` typing on the `LayoutBase` `navigationItems` prop — no `any` casts.

- [ ] **Task 7 — Component tests (Vitest + RTL) (AC: #8)**
  - [ ] Install `jsdom` for Vitest if not present: `pnpm --filter frontend add -D jsdom @vitest/browser` (jsdom is required for `matchMedia` and DOM APIs). Add `vitest.config.ts` (or extend `vite.config.ts`) with `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] }`.
  - [ ] Create `src/test/setup.ts` importing `@testing-library/jest-dom/vitest` and stubbing `window.matchMedia` for viewport-based tests.
  - [ ] Create test file `src/shared/components/AppShell.test.tsx` covering:
    - [ ] **TC-E1-P2-01** — At viewport 1280px, `<AppShell />` renders `data-testid="nav-rail"` visible and contains text "Clientes" and "Contactos".
    - [ ] **TC-E1-P2-02** — At viewport 375px, `data-testid="nav-bar"` is visible; `data-testid="nav-rail"` is hidden (`.toHaveClass('hidden')` or `.not.toBeVisible()`).
  - [ ] Create test file `src/routes/navigation.test.tsx` (or `src/test/navigation.test.tsx`) using `createMemoryHistory` + `createRouter`:
    - [ ] **TC-E1-P1-01** — Render the router at `/clientes`, click the "Contactos" nav item, assert current URL is `/contactos` and `data-testid="contactos-view"` is present. Spy on `window.location` — assert `window.location.reload` was NOT called (and `window.location.href` was not reassigned).
    - [ ] **TC-E1-P1-04** — Render router at `/ruta-que-no-existe`, assert `data-testid="not-found-view"` is rendered AND `data-testid="app-shell"` is still in the DOM (shell persists).
    - [ ] **TC-E1-P2-03** — Render router at `/`, wait for redirect, assert current URL is `/clientes` and `data-testid="clientes-view"` is present.
  - [ ] Add `"test": "vitest run"` script to `frontend/package.json` if missing.

- [ ] **Task 8 — E2E deep-linking (AC: #3) — smoke Playwright specs**
  - [ ] Add `e2e/tests/foundation/navigation-shell.spec.ts` with two Playwright tests:
    - [ ] **TC-E1-P1-02** — `page.goto('/clientes')` from a fresh context, assert `getByTestId('clientes-view')` visible; assert URL is `/clientes` (no redirect); assert NavigationRail present via `getByTestId('nav-rail')`.
    - [ ] **TC-E1-P1-03** — `page.goto('/contactos')`, assert `getByTestId('contactos-view')` visible; URL unchanged.
  - [ ] Reuse the existing `playwright.config.ts` `webServer.command` — no config changes needed (playwright already boots `pnpm --filter frontend dev`).
  - [ ] Note: Playwright browser install (`pnpm exec playwright install chromium`) failed in Story 1.1's sandbox due to a proxy 403 against `cdn.playwright.dev`. Do NOT block story completion on the browser install — the specs must be authored and syntactically valid. Real execution is the TEA sub-agent's responsibility (per Story 1.1 Completion Note #7).

## Dev Notes

### Architecture-mandated file placement

Per `architecture.md` (Complete Project Directory Structure) and `company-standards.md` (Frontend Folder Structure):

| Kind | Path | Notes |
|------|------|-------|
| Root route + not-found | `src/routes/__root.tsx` | Layout wrapper; delegates content to `_app` |
| Pathless auth layout | `src/routes/_app.tsx` | Renders `<AppShell>` around `<Outlet/>` |
| `/clientes` placeholder | `src/routes/_app/clientes.tsx` | Placeholder — Epic 2 will replace body |
| `/contactos` placeholder | `src/routes/_app/contactos.tsx` | Placeholder — Epic 3 will replace body |
| Index redirect | `src/routes/index.tsx` | `beforeLoad → throw redirect({ to: '/clientes' })` |
| Shell component | `src/shared/components/AppShell.tsx` | Composes siesa-ui-kit `LayoutBase` + `NavigationBar` |
| 404 view | `src/shared/components/NotFoundView.tsx` | Rendered by router `notFoundComponent` |

`ClienteListView.tsx`, `ContactoListView.tsx`, `ClienteDetailView.tsx`, etc., defined in `architecture.md#Complete Project Directory Structure`, are **out of scope** for this story — they belong to Epics 2 and 3. Do NOT scaffold them here.

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit` (P0 mandatory per company-standards + architecture.md).
- **Install:** already present (`siesa-ui-kit@^1.0.255` in `frontend/package.json`). Verify with `pnpm --filter frontend list siesa-ui-kit`.
- **Usage:** You MUST use `LayoutBase` + `NavigationBar` from `siesa-ui-kit` for the shell. Do NOT hand-roll a `<nav>` element.
- **Constraint:** Do not create custom UI components if a siesa-ui-kit equivalent exists. This story uses `LayoutBase` (view), `NavigationBar` (component), and `Button` (component) — all from siesa-ui-kit.
- **Component decision order (from architecture.md):** siesa-ui-kit → shadcn/ui (Dialog, Breadcrumb only) → custom composition. No custom `<nav>` allowed.
- **Icons:** Heroicons only (`@heroicons/react/24/outline` for rail/bar icons). No Font Awesome for this story.
- **Text:** all user-facing text in Spanish ("Clientes", "Contactos", "Siesa Agents", "La página solicitada no existe", "Ir a Clientes", "La gestión de clientes se habilitará en el Epic 2", etc.). Code (variables, functions, types) in English.
- **Dark mode:** class-based; siesa-ui-kit `LayoutBase` handles the surface. No dark-mode toggle is added in this story.
- **Brand tokens:** Do NOT hardcode hex colors. Use Tailwind `slate-*` neutrals + brand tokens already declared in `src/index.css` (`--color-brand-primary`, `--color-brand-tertiary`).

### Responsive breakpoint contract

- Critical breakpoint: `lg: 1024px` (Tailwind default). Above → desktop shell (`hidden lg:block`). Below → mobile shell (`lg:hidden`).
- Prefer Tailwind responsive classes over JS `matchMedia` — component tests will simulate viewport by setting the DOM window size + `window.matchMedia` shim. Do NOT branch on `window.innerWidth` at runtime.
- Minimum viewport width supported: `375px` (per ux-design-specification.md).
- Minimum tap target: 44px height on mobile (WCAG 2.1 AA — company-standards.md).

### TanStack Router patterns

- File-based routing under `src/routes/`. Route file naming follows company-standards prefixes:
  - `_app.tsx` → pathless layout (no URL segment).
  - `_app/clientes.tsx` → nested route resolving to `/clientes` (no `/_app/` in URL because parent is pathless).
- SPA navigation MUST use `<Link>` or `useNavigate()`. Any `window.location.*` assignment fails AC #1 / TC-E1-P1-01.
- Redirect pattern for root: `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`. This is the idiomatic TanStack Router redirect — a return statement is not sufficient.
- Type-safe `to:` — the router's registered `routeTree` (`src/main.tsx` declaration merge) makes `to: '/clientes'` type-checked. No string casts.
- 404 handling: `notFoundComponent` on the `_app` route so the shell persists. If setting `defaultNotFoundComponent` on the router, ensure the component renders inside the layout — do NOT return a bare `<div>` outside `LayoutBase`.

### Testing conventions (per company-standards + Story 1.1 baseline)

- Vitest + React Testing Library + `jsdom`. Setup file: `src/test/setup.ts`.
- Test file colocation: alongside source (`AppShell.tsx` + `AppShell.test.tsx` in the same folder) OR under `src/test/` for cross-cutting router tests.
- Use `data-testid` selectors for shell primitives (`app-shell`, `nav-rail`, `nav-bar`, `not-found-view`, `clientes-view`, `contactos-view`) — these are the hooks the TEA sub-agent's E2E specs will also depend on.
- Every icon-only button (rail collapsed items, nav-bar items) MUST have an `aria-label` in Spanish. Verify via `axe` if a helper is available; otherwise assert `getByRole('link', { name: 'Clientes' })`.
- Playwright specs live under `e2e/tests/foundation/` (folder already exists from Story 1.1). Follow the same file-naming convention (`*.spec.ts`).

### siesa-ui-kit API contract (v1.0.255)

- `LayoutBase` (`views/LayoutBase`):
  - `productName?: string` — set to `"Siesa Agents"`.
  - `navigationItems?: NavigationRailGroupMenuItem[]` — array of `{ id, label, icon, active, onClick }`. `icon` accepts any `ReactNode` (pass Heroicons as `<UsersIcon className="size-5" />`).
  - `navigationRailProps?: Partial<NavigationRailGroupProps>` — for `state: 'collapsed'` (default), `onItemClick`, `showSearchButton: false` (we don't need search yet).
  - `hideSidebar?: boolean` — set to `false` (default). Do not use `true` on desktop.
  - `children?: ReactNode` — the route `<Outlet />` goes here.
  - `contentClassName?: string` — override content padding if needed (default `'p-6'`).
- `NavigationBar` (`components/NavigationBar`):
  - `items: NavigationBarItem[]` — `{ id, icon, label, active, onClick, ariaLabel }`.
  - `activeItemId?: string` — derived from current route.
  - `onItemClick?: (id: string) => void` — invoke `navigate({ to: ... })`.
  - Recommended max 5 items — we use 2 (Clientes + Contactos), leaving room for future additions.
- `Button` — used only in `NotFoundView` for the "Ir a Clientes" CTA; wrap with TanStack `<Link>` for router-safe navigation.

### Scope discipline — what this story does NOT do

- No `ClienteListView`, `ContactoListView`, `ClienteDetailView`, or any CRUD component. Those tables/panels arrive in Epics 2 and 3.
- No API calls, no TanStack Query hooks, no Axios usage. `apiClient.ts` and `queryClient.ts` from Story 1.1 remain untouched.
- No authentication logic. `_app` is named per the "authenticated shell layout" comment in `architecture.md` but auth wiring is out of MVP scope (per test-design-epic-1.md "Out of Scope").
- No dark-mode toggle, no i18n switcher, no user avatar / dropdown wiring (Navbar `userDropdown` prop stays undefined for now).
- No microfrontend / single-SPA integration — per architecture.md, this MVP is a standalone SPA.

### Project Structure Notes

- Alignment: file paths follow the architecture.md tree exactly. The pathless `_app` route matches the architecture note "`_app.tsx` — Authenticated shell layout" and `_app/clientes.tsx` / `_app/contactos.tsx` match the tree.
- Variance: the shared shell component `AppShell.tsx` is **not** listed in the architecture tree but is a natural composition helper. It belongs under `src/shared/components/` per company-standards folder structure. Rationale: keeps `_app.tsx` a thin route wrapper and makes the shell independently testable.
- Variance: `NotFoundView.tsx` also not listed — added under `src/shared/components/` for the same reason.
- Deviation from architecture.md#UI: architecture.md line 454 says `__root.tsx = LayoutBase + NavigationRail`. This story places the shell in `_app.tsx` (one level deeper) instead. Rationale: the root route stays minimal so future unauthenticated pages (login, marketing) can bypass the shell — matches TanStack Router's canonical layout pattern and mirrors `architecture.md` line 456 (`_app.tsx — Authenticated shell layout`).

### References

- Epic + AC source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Frontend routing tree: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- siesa-ui-kit component strategy: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- Direction F shell (Navbar + NavigationRail + Content): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Direction F]
- Mobile layout / breakpoints: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Structure (Mobile ≥375px)]
- Epic 1 test cases (TC-E1-P1-01, TC-E1-P1-02, TC-E1-P1-03, TC-E1-P1-04, TC-E1-P2-01, TC-E1-P2-02, TC-E1-P2-03): [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md]
- Frontend stack / folder structure / prefixes / language rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- Story 1.1 completion notes (routeTree.gen.ts gitignore, Playwright proxy note): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
