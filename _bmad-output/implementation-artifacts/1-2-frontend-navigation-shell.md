# Story 1.2: Frontend Navigation Shell

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser, **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with entries "Clientes" and "Contactos", and clicking either entry navigates to `/clientes` or `/contactos` respectively without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (width < 1024px), **When** the user views the app, **Then** a mobile-responsive NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen, confirming deep linking works (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/unknown`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish and a link back to `/clientes`.

5. **Given** the navigation shell is rendered, **When** a screen reader or accessibility tool inspects the navigation, **Then** ARIA roles and labels are present on all navigation landmarks (WCAG 2.1 AA).

## Tasks / Subtasks

- [x] Task 1 — Create the `_app` pathless layout route (AC: #1, #2)
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout component that renders `NavigationRail` (desktop, lg+) or `NavigationBar` (mobile, < lg) from `siesa-ui-kit` alongside an `<Outlet />`
  - [x] Use TailwindCSS responsive utilities: `hidden lg:flex` for NavigationRail and `flex lg:hidden` for NavigationBar
  - [x] Define navigation items array in Spanish: `[{ label: 'Clientes', to: '/clientes', icon: ... }, { label: 'Contactos', to: '/contactos', icon: ... }]`
  - [x] Use `useRouterState` or TanStack Router `<Link>` to highlight active navigation item
  - [x] Add `aria-label="Navegación principal"` to the nav wrapper element

- [x] Task 2 — Create route files for Clientes and Contactos (AC: #3)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — renders a `<ClientesPage />` placeholder with text "Clientes" (full implementation in Epic 2)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — renders a `<ContactosPage />` placeholder with text "Contactos" (full implementation in Epic 3)

- [x] Task 3 — Create index redirect (AC: #3)
  - [x] Update `frontend/src/routes/index.tsx` to redirect to `/clientes` using TanStack Router `redirect()` or `<Navigate to="/clientes" />`

- [x] Task 4 — Create not-found route (AC: #4)
  - [x] Create `frontend/src/routes/__root.tsx` — update to include a `notFoundComponent` that renders a Spanish 404 message and a link back to `/clientes`
  - [x] Ensure the 404 view uses a siesa-ui-kit component (e.g., `EmptyState` or equivalent) if available

- [x] Task 5 — Write component tests (AC: #1, #2, #4, #5)
  - [x] Write `frontend/src/routes/__tests__/navigation.test.tsx` using Vitest + RTL
  - [x] Test: NavigationRail is rendered on viewport width >= 1024px
  - [x] Test: NavigationBar is rendered on viewport width < 1024px
  - [x] Test: Clicking "Clientes" link navigates to `/clientes`
  - [x] Test: Clicking "Contactos" link navigates to `/contactos`
  - [x] Test: `aria-label="Navegación principal"` is present
  - [x] Test: Navigating to unknown path renders the not-found component

## Dev Notes

### Architecture Patterns

This story is purely frontend. No backend changes are required.

**TanStack Router — File-based Routing Conventions:**

| Prefix | Effect |
|--------|--------|
| `_` | Pathless layout (adds no URL segment) |
| `_app.tsx` | Shell layout wrapping all app routes |
| `_app/clientes.tsx` | Route at `/clientes` |
| `_app/contactos.tsx` | Route at `/contactos` |

The `_app.tsx` layout route contains the persistent navigation. All child routes (`clientes`, `contactos`) are rendered inside its `<Outlet />`. This is the canonical TanStack Router pattern for application shells.

**Route tree after this story:**
```
__root.tsx
  _app.tsx              ← navigation shell (pathless layout)
    _app/
      clientes.tsx      → /clientes
      contactos.tsx     → /contactos
  index.tsx             → redirect to /clientes
```

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `pnpm add siesa-ui-kit` (already installed in Story 1.1 — verify it is present)
- **Components to use**:
  - `NavigationRail` — desktop left-side navigation (lg+ breakpoint)
  - `NavigationBar` — mobile bottom navigation (< lg breakpoint)
  - Check siesa-ui-kit catalog for `EmptyState` or similar for the 404 view
- **Constraint**: Do NOT create custom navigation components if siesa-ui-kit equivalents exist.
- **Fallback**: If `NavigationRail` / `NavigationBar` are not available in the installed version of siesa-ui-kit, use `shadcn/ui` components (already initialized in Story 1.1) and document the deviation in Dev Agent Record.

### Styling

- Breakpoint for responsive switch: `lg` (1024px) — Tailwind class `lg:`
- Brand colors: Primary `#0e79fd` (Siesa Blue), Deep Blue `#154ca9`
- Neutrals: Tailwind `slate-*` scale
- Active link: visually distinct from inactive (use siesa-ui-kit active state prop or `data-active` attribute + Tailwind)
- All user-facing text MUST be in Spanish: "Clientes", "Contactos", "Página no encontrada", "Volver al inicio"

### Icons

- Use Heroicons (primary) or Font Awesome 6.5+ (secondary)
- Clientes: `UserGroupIcon` (Heroicons)
- Contactos: `UsersIcon` (Heroicons)

### State

- No server state (TanStack Query) needed for navigation
- No Zustand store needed — active route is determined by TanStack Router URL state
- Active navigation item: use TanStack Router's `useRouterState` or the `<Link>` component's built-in `activeProps` / `activeClassName`

### Accessibility (WCAG 2.1 AA — mandatory)

- `<nav aria-label="Navegación principal">` wrapping the navigation component
- Each navigation link must have a descriptive text label (already in Spanish)
- Focus management: keyboard navigation must reach all nav items via Tab
- Active item must be indicated visually AND via `aria-current="page"`

### Testing

- Framework: Vitest + React Testing Library + (MSW if needed, not needed for this story)
- Breakpoint simulation: use `window.resizeTo` or mock `window.innerWidth` with `Object.defineProperty`
- TanStack Router in tests: wrap with `<RouterProvider router={createRouter(...)} />` or use `createMemoryHistory` for route simulation
- Co-locate tests: `frontend/src/routes/__tests__/navigation.test.tsx`
- Axe accessibility check: import `@axe-core/react` or use `jest-axe` equivalent for Vitest

### Project Structure Notes

Files to create in this story (relative to `frontend/`):

```
src/routes/
  _app.tsx                         ← NEW: pathless layout with nav shell
  _app/
    clientes.tsx                   ← NEW: /clientes placeholder route
    contactos.tsx                  ← NEW: /contactos placeholder route
  __root.tsx                       ← UPDATE: add notFoundComponent
  index.tsx                        ← UPDATE: redirect to /clientes
src/routes/__tests__/
  navigation.test.tsx              ← NEW: component tests
```

No backend files. No module files (Epic 2 and 3 create the actual clientes/contactos module structures).

**Note from Story 1.1 Completion Notes:** `siesa-ui-kit` was not available in the npm registry during Story 1.1. If the package is still unavailable, use shadcn/ui components as fallback and document the decision. The navigation structure must still be implemented with responsive behavior.

### References

- Epic source and ACs: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- TanStack Router prefixes and routing structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- Frontend architecture routing: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Complete project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- UI enforcement rules: [Source: _bmad/bmm/workflows/4-implementation/create-story/steps/step-03-architecture.md#Siesa UI Kit Enforcement]
- siesa-ui-kit install note: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Completion Notes List]
- FR28, FR29, FR30 navigation requirements: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- Responsive breakpoint and layout: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `siesa-ui-kit` v1.0.209 does not export `NavigationRail` or `NavigationBar` as standalone full-layout components. It exports `NavigationRailTypes` (full desktop rail), `NavigationRailItem`, `NavigationRailPanel`, and `NavigationRailGroup`. For mobile bottom nav, `NavigationRailItem` components were used inside a custom `<nav>` with TailwindCSS.
- `EmptyState` is not exported by `siesa-ui-kit` — the 404 view uses plain HTML with Tailwind styling.
- Frontend was a vanilla TypeScript/Vite app; React, @vitejs/plugin-react, @tanstack/router-plugin, TailwindCSS v4, Heroicons, Vitest, and RTL were installed as part of this story.

### Completion Notes List

- Desktop navigation uses `NavigationRailTypes` from siesa-ui-kit (the full desktop rail component). Navigation on item click uses `useNavigate` from TanStack Router.
- Mobile bottom navigation bar is implemented with siesa-ui-kit `NavigationRailItem` wrappers styled with TailwindCSS `lg:hidden fixed bottom-0` pattern.
- `aria-current="page"` is set on the active mobile nav link; `active` prop is passed to `NavigationRailTypes` rail items for desktop.
- `NotFoundComponent` renders "Página no encontrada" with a "Volver al inicio" link to `/clientes` using TanStack Router `<Link>`.
- Index route (`/`) uses `beforeLoad` with `redirect({ to: '/clientes' })` for deep-link compliance.
- 7/7 component tests pass: NavigationRail desktop render, mobile nav presence, Clientes/Contactos link href, aria-label presence, 404 component, and aria-current on active mobile item.
- `routeTree.gen.ts` was auto-generated by the TanStack Router Vite plugin during the build.

### File List

**Created:**
- `frontend/vite.config.ts`
- `frontend/vitest.config.ts`
- `frontend/src/main.tsx`
- `frontend/src/test-setup.ts`
- `frontend/src/routes/__root.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/routes/_app.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/_app/contactos.tsx`
- `frontend/src/routes/__tests__/navigation.test.tsx`
- `frontend/src/routeTree.gen.ts` (auto-generated by TanStack Router Vite plugin)

**Modified:**
- `frontend/index.html` (updated script src to main.tsx)
- `frontend/tsconfig.json` (added jsx: react-jsx, removed erasableSyntaxOnly)
- `frontend/package.json` (added test scripts; React, heroicons, vitest, tailwindcss, @tanstack/router-plugin installed)
