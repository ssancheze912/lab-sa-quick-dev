# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser, **When** the user views the app, **Then** a `NavigationRail` component (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (width < 1024px), **When** the user views the app, **Then** a `NavigationBar` component (siesa-ui-kit) is displayed at the bottom instead of the rail, **And** all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen, and the corresponding navigation entry is visually highlighted as active (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/unknown`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish.

5. **Given** the root URL `/` is accessed, **When** the page loads, **Then** the user is automatically redirected to `/clientes`.

6. **Given** any navigation entry, **When** it is rendered, **Then** the active route is visually distinguished from inactive routes using the active state of the siesa-ui-kit navigation component.

## Tasks / Subtasks

- [ ] Task 1 — Create `_app.tsx` pathless layout route (AC: #1, #2, #3)
  - [ ] Create `frontend/src/routes/_app.tsx` as a TanStack Router pathless layout route (prefix `_` = no URL segment)
  - [ ] Import `NavigationRail` from `siesa-ui-kit` for desktop layout (breakpoint `lg: 1024px`)
  - [ ] Import `NavigationBar` from `siesa-ui-kit` for mobile layout
  - [ ] Use TailwindCSS `hidden lg:flex` / `flex lg:hidden` to toggle between Rail (desktop) and Bar (mobile)
  - [ ] Wire active state using TanStack Router `useRouterState` or `Link` `activeProps`
  - [ ] Define navigation items array: `[{ label: 'Clientes', to: '/clientes', icon: ... }, { label: 'Contactos', to: '/contactos', icon: ... }]`
  - [ ] Render `<Outlet />` for child routes in the main content area

- [ ] Task 2 — Create child route files under `_app/` (AC: #1, #3)
  - [ ] Create `frontend/src/routes/_app/` directory
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — route `/clientes`, renders a placeholder `<ClientesPlaceholder />` component with text "Clientes" in Spanish
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — route `/contactos`, renders a placeholder `<ContactosPlaceholder />` component with text "Contactos" in Spanish

- [ ] Task 3 — Update root route and add redirect (AC: #5)
  - [ ] Update `frontend/src/routes/__root.tsx` to render a root layout shell wrapping `<Outlet />`
  - [ ] Update `frontend/src/routes/index.tsx` to redirect to `/clientes` using TanStack Router `redirect`

- [ ] Task 4 — Add 404 not-found route (AC: #4)
  - [ ] Add a `notFoundComponent` to the root route in `__root.tsx` that renders a Spanish 404 message, e.g., "Página no encontrada" with a link back to `/clientes`

- [ ] Task 5 — Responsive layout structure (AC: #1, #2)
  - [ ] Wrap main content area in a `div` with `flex flex-1 overflow-hidden` to support the split-panel layout defined in architecture
  - [ ] Ensure NavigationRail occupies a fixed width on desktop (per siesa-ui-kit spec)
  - [ ] Ensure NavigationBar is pinned to the bottom on mobile (per siesa-ui-kit spec)
  - [ ] Apply brand color `#0e79fd` (Siesa Blue) via TailwindCSS tokens or siesa-ui-kit theme for active nav item

- [ ] Task 6 — Write Vitest + RTL tests (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/routes/__tests__/navigation.test.tsx`
  - [ ] Test 1: NavigationRail renders on desktop viewport with "Clientes" and "Contactos" labels
  - [ ] Test 2: NavigationBar renders on mobile viewport (mock window.innerWidth < 1024)
  - [ ] Test 3: Active route is highlighted when `/clientes` is the current path
  - [ ] Test 4: Navigating to `/clientes` renders the Clientes placeholder
  - [ ] Test 5: Navigating to `/contactos` renders the Contactos placeholder
  - [ ] Test 6: Root `/` redirects to `/clientes`
  - [ ] Test 7: Unknown route `/unknown` renders a 404 message in Spanish
  - [ ] All tests check accessibility via `axe` (WCAG 2.1 AA compliance)

## Dev Notes

### Architecture Patterns

- This story implements the **application shell** layer — the persistent layout that wraps all feature routes.
- TanStack Router uses the `_` prefix for pathless layout routes. `_app.tsx` creates a layout with no URL segment, so `/clientes` and `/contactos` inherit the navigation shell automatically.
- The architecture document defines the routing structure as:
  ```
  src/routes/
    __root.tsx          # Root layout — LayoutBase + NavigationRail
    index.tsx           # Redirect → /clientes
    _app.tsx            # Pathless layout shell (NavigationRail + NavigationBar)
    _app/
      clientes.tsx      # /clientes
      clientes.$clienteId.tsx  # (future stories)
      contactos.tsx     # /contactos
      contactos.$contactoId.tsx  # (future stories)
  ```
- This story creates the routes up to `_app.tsx`, `_app/clientes.tsx` and `_app/contactos.tsx` with placeholder content. The actual feature views (ClienteListView, ContactoListView) are added in Epic 2 and Epic 3.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed as `pnpm add siesa-ui-kit` per Story 1.1)
- **Components to use**:
  - `NavigationRail` — desktop left-side navigation (breakpoint >= 1024px)
  - `NavigationBar` — mobile bottom navigation (breakpoint < 1024px)
- **Constraint**: Do NOT create custom navigation components. Use siesa-ui-kit equivalents.
- **Active state**: Use TanStack Router `Link` with `activeProps` or `useRouterState` to pass the active route to siesa-ui-kit navigation components.
- **Navigation labels**: All text MUST be in Spanish — "Clientes", "Contactos".
- **Icons**: Use Heroicons (primary icon library per company standards) for navigation items.

### Tech Stack

- TanStack Router 1+ — file-based routing, pathless layouts via `_` prefix
- React 18+ — functional components only
- TypeScript 5+ strict mode — NO `any`
- TailwindCSS v4 — `hidden lg:flex` / `flex lg:hidden` for responsive toggle
- siesa-ui-kit — `NavigationRail` + `NavigationBar`
- Vitest + React Testing Library + axe — unit and accessibility tests
- pnpm — package manager

### Responsive Breakpoint

- Critical breakpoint: `lg: 1024px` (per architecture.md cross-cutting concerns)
- Desktop (>= 1024px): `NavigationRail` on the left
- Mobile (< 1024px): `NavigationBar` at the bottom

### Project Structure Notes

Files to create or modify in this story:

```
frontend/src/routes/
  __root.tsx                        # MODIFY — add notFoundComponent, update shell layout
  index.tsx                         # MODIFY — add redirect to /clientes
  _app.tsx                          # CREATE — pathless layout with NavigationRail/NavigationBar
  _app/
    clientes.tsx                    # CREATE — /clientes placeholder route
    contactos.tsx                   # CREATE — /contactos placeholder route
  __tests__/
    navigation.test.tsx             # CREATE — Vitest + RTL + axe tests
```

No backend changes in this story. No new modules under `src/modules/` (those come in Epic 2 and 3). No Zustand store needed — navigation state is managed by TanStack Router URL.

### Previous Story Learnings (from Story 1.1)

- `pnpm` is the package manager. Use `pnpm add` not `npm install`.
- `siesa-ui-kit` is already installed (listed in Story 1.1 file list: `pnpm add siesa-ui-kit`).
- TanStack Router vite plugin (`@tanstack/router-plugin/vite`) auto-generates `routeTree.gen.ts` on file save — do NOT manually edit `routeTree.gen.ts`.
- TypeScript strict mode is active — avoid `any`. Use proper types from TanStack Router (`RouterContext`, `FileRoute`, etc.).
- `shadcn@latest init` was skipped in Story 1.1 — do not assume shadcn is available; rely on siesa-ui-kit.
- `__root.tsx` currently renders a bare `<Outlet />` — this story wraps it with the navigation shell.
- Vitest is configured with `vitest/config` import. The test setup file is `frontend/src/test/setup.ts`.

### Git History Context

- Last 5 commits indicate Story 1.1 implementation is done and code-reviewed (`fix(story-1.1): apply code review corrections`).
- Frontend and backend scaffolding is in place and verified.
- Branch conventions follow `feat(story-X.X): ...` and `fix(story-X.X): ...` patterns.

### References

- Routing structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Responsive layout strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]
- Navigation requirements FR28–FR30: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- UI kit mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied]
- TanStack Router prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- Brand colors + typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Previous story learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
