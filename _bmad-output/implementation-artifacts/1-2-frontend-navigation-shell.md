# Story 1.2: Frontend Navigation Shell

Status: review

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a mobile-responsive `NavigationBar` (siesa-ui-kit) is displayed instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/ruta-desconocida`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with the navigation shell still visible.

5. **Given** the user accesses the root path `/`, **When** the page loads, **Then** the user is automatically redirected to `/clientes`.

## Tasks / Subtasks

- [x] Task 1 — Configure TanStack Router routes for the application shell (AC: #3, #4, #5)
  - [x] Create `src/routes/__root.tsx` — root layout that wraps all routes with `LayoutBase` (siesa-ui-kit) including `NavigationRail` (desktop) and `NavigationBar` (mobile)
  - [x] Create `src/routes/index.tsx` — redirects to `/clientes` using TanStack Router `redirect`
  - [x] Create `src/routes/_app.tsx` — pathless layout route (`_` prefix) for the authenticated/app shell
  - [x] Create `src/routes/_app/clientes.tsx` — `/clientes` route rendering `ClientesPlaceholder` (stub view)
  - [x] Create `src/routes/_app/contactos.tsx` — `/contactos` route rendering `ContactosPlaceholder` (stub view)
  - [x] Create `src/routes/$404.tsx` (or configure `notFoundComponent`) — not-found view displayed gracefully
  - [x] Run `pnpm run dev` to trigger `routeTree.gen.ts` regeneration via `@tanstack/router-plugin`

- [x] Task 2 — Implement `LayoutBase` shell with responsive navigation (AC: #1, #2)
  - [x] Check siesa-ui-kit catalog for `LayoutBase`, `NavigationRail`, `NavigationBar`, and `Navbar` components
  - [x] Update `src/routes/__root.tsx` to render `LayoutBase` with `Navbar` (top bar 64px), `NavigationRail` (collapsed icon-only 72px, desktop), and `NavigationBar` (mobile bottom bar)
  - [x] Configure `navigationItems` prop with two entries: `{ label: 'Clientes', href: '/clientes', icon: UsersIcon }` and `{ label: 'Contactos', href: '/contactos', icon: UserIcon }` (Heroicons)
  - [x] Configure `Navbar` with `productName="Siesa Agents"` and default props
  - [x] Implement responsive breakpoint: `NavigationRail` visible at `lg` (1024px+), `NavigationBar` visible below `lg` using TailwindCSS responsive utilities
  - [x] Add `<Outlet />` inside the content area to render child routes

- [x] Task 3 — Create stub views for Clientes and Contactos (AC: #1, #2, #3)
  - [x] Create `src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx` — minimal placeholder component rendering `<h1>Clientes</h1>` with Spanish text "Sección Clientes"
  - [x] Create `src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx` — minimal placeholder component rendering `<h1>Contactos</h1>` with Spanish text "Sección Contactos"
  - [x] Both stubs use TypeScript strict mode (no `any` types)

- [x] Task 4 — Create NotFound component (AC: #4)
  - [x] Create `src/shared/components/NotFound.tsx` — 404 view with Spanish text "Página no encontrada" and a link back to `/clientes`
  - [x] Register `NotFound` as the `notFoundComponent` in the root route or configure `$404` route

- [x] Task 5 — Write component tests (AC: #1, #2, #3, #4, #5)
  - [x] `src/routes/-__root.test.tsx` — assert `NavigationRail` renders with "Clientes" and "Contactos" at 1280px viewport (TC-E1-P2-01)
  - [x] `src/routes/-__root.test.tsx` — assert `NavigationBar` renders and `NavigationRail` is hidden at 375px viewport (TC-E1-P2-02)
  - [x] `src/routes/-__root.test.tsx` — assert index `/` redirects to `/clientes` (TC-E1-P2-03)
  - [x] `src/routes/-__root.test.tsx` — assert unknown route renders `NotFound` component without dismounting shell (TC-E1-P1-04)
  - [x] `src/routes/-__root.test.tsx` — assert clicking "Clientes" nav item navigates to `/clientes` without `window.location.reload` (TC-E1-P1-01)
  - [x] `src/routes/-__root.test.tsx` — assert clicking "Contactos" nav item navigates to `/contactos` without full page reload (TC-E1-P1-01)

## Dev Notes

### Architecture Context

This story builds on Story 1.1 (project structure and TanStack Router scaffold already initialized). The `__root.tsx` file created in 1.1 is a shell placeholder — this story replaces it with the full `LayoutBase` + navigation implementation.

**TanStack Router file-based routing conventions (from architecture.md):**
```
src/routes/
  __root.tsx                   # Root layout — LayoutBase + NavigationRail
  index.tsx                    # Redirect → /clientes
  _app.tsx                     # Pathless layout (no URL segment) — app shell
  _app/
    clientes.tsx               # /clientes route
    contactos.tsx              # /contactos route
```

The `_` prefix creates a **pathless layout route** — it contributes a layout without adding a URL segment. Routes inside `_app/` inherit the `_app.tsx` layout while having their own paths (`/clientes`, `/contactos`).

### siesa-ui-kit Component Usage

**Mandatory lookup order:** siesa-ui-kit → shadcn/ui → custom

Components required from siesa-ui-kit:
- `LayoutBase` — wraps the full app shell (Navbar + NavigationRail/Bar + Content area)
- `NavigationRail` — 72px collapsed icon-only sidebar for desktop (lg: 1024px+)
- `NavigationBar` — bottom navigation bar for mobile (< lg)
- `Navbar` — 64px top bar with product name and optional badges

**Shell structure (from UX design spec — Direction F):**
```
┌─ Navbar (64px) ──────────────────────────────────────────────────────┐
│  [Siesa symbol] Siesa Agents                                         │
└──────────────────────────────────────────────────────────────────────┘
┌─ NavigationRail (72px) ─┬─ Content Area ────────────────────────────┐
│  👥 Clientes (active)   │  <Outlet />                               │
│  🙋 Contactos           │                                            │
└─────────────────────────┴───────────────────────────────────────────┘
```

### Implementation Notes

- `LayoutBase` (siesa-ui-kit) handles desktop navigation rail (`NavigationRailGroup`) and `Navbar` internally. It accepts `navigationItems: NavigationRailGroupMenuItem[]`.
- Mobile `NavigationBar` is injected inside `LayoutBase` children with `lg:hidden fixed bottom-0` positioning.
- `@heroicons/react` installed as dependency (not in original package.json).
- vitest `jsdom` environment configured in `vite.config.ts`; setup file at `src/test/setup.ts`.
- Test file uses `-` prefix (`-__root.test.tsx`) to be excluded from router file-based routing.
- `siesa-ui-kit/styles.css` added to `main.tsx`.

### Testing Notes

- Use `@testing-library/react` + `@tanstack/react-router` test utilities
- For viewport testing: configure `jsdom` window dimensions via `Object.defineProperty(window, 'innerWidth', { value: 375 })` or use a Vitest setup
- Assert SPA navigation (no `window.location.reload`) by checking that the `RouterProvider` handles navigation internally
- Deep linking tests (TC-E1-P1-02, TC-E1-P1-03) are E2E with Playwright — outside scope of this story's unit/component tests; they run against the dev server

### Scope Note

- This story creates **stub/placeholder views** for `/clientes` and `/contactos`. Real `ClienteListView` and `ContactoListView` with data fetching are implemented in Epics 2 and 3.
- Do NOT implement any TanStack Query hooks, Axios calls, or business domain logic in this story.
- The `_app/clientes.$clienteId.tsx` and `_app/contactos.$contactoId.tsx` routes are also deferred to Epics 2 and 3.

### Key Standards Reminders

- All user-facing text MUST be in Spanish (labels, navigation items, error messages, placeholders)
- Code (variables, functions, types) MUST be in English
- No `any` types — TypeScript strict mode
- Use `pnpm` as package manager
- Check siesa-ui-kit before any custom component
- Icons: Heroicons (primary)
- WCAG 2.1 AA accessibility: all navigation items must have accessible labels

## File List

### Created
- `frontend/src/routes/__root.tsx` — Updated: LayoutBase + NavigationBar shell with responsive navigation
- `frontend/src/routes/index.tsx` — Created: redirects `/` to `/clientes`
- `frontend/src/routes/_app.tsx` — Created: pathless layout route
- `frontend/src/routes/_app/clientes.tsx` — Created: `/clientes` route
- `frontend/src/routes/_app/contactos.tsx` — Created: `/contactos` route
- `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx` — Created: stub view
- `frontend/src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx` — Created: stub view
- `frontend/src/shared/components/NotFound.tsx` — Created: 404 view
- `frontend/src/routes/-__root.test.tsx` — Created: 6 component tests (all pass)
- `frontend/src/test/setup.ts` — Created: vitest setup with jest-dom

### Modified
- `frontend/vite.config.ts` — Added vitest test config (jsdom environment)
- `frontend/tsconfig.app.json` — Added vitest/globals types
- `frontend/src/main.tsx` — Added siesa-ui-kit/styles.css import
- `frontend/src/routeTree.gen.ts` — Regenerated by TanStack Router plugin (auto)
- `frontend/package.json` — Added @heroicons/react, @vitest/browser, jsdom, @testing-library/user-event

## Dev Agent Record

### Implementation Decisions

1. **LayoutBase usage**: Used `LayoutBase` from siesa-ui-kit directly which handles `NavigationRailGroup` (desktop) and `Navbar` internally. The `NavigationBar` (mobile) was added inside `LayoutBase` children with `lg:hidden` CSS to handle the mobile responsive requirement.

2. **NavigationRailGroupMenuItem format**: The `LayoutBase.navigationItems` prop uses `NavigationRailGroupMenuItem[]` (not `NavigationRailItemProps[]`), which requires `id`, `label`, `icon`, and optional `onClick`.

3. **Test file naming**: Named `src/routes/-__root.test.tsx` (with `-` prefix) to prevent TanStack Router from treating it as a route file.

4. **window.location.reload test**: `window.location.reload` is not redefiniable in jsdom. SPA navigation is verified by asserting router state pathname changes after click (if reload had occurred, the in-memory router state would be reset).

### Completion Notes

- All 5 tasks and all subtasks completed.
- 6/6 tests pass.
- TypeScript strict mode: no errors.
- siesa-ui-kit components used: `LayoutBase`, `NavigationBar` (both from siesa-ui-kit).
- All user-facing text in Spanish.
- WCAG accessible labels on mobile NavigationBar items via `ariaLabel` prop.

## References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- UX design — Direction F (shell structure): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Architecture routing spec: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Test cases TC-E1-P1-01 to TC-E1-P1-04, TC-E1-P2-01 to TC-E1-P2-03: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md]
- Preceding story (structure scaffold): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- Company standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
