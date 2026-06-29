# Story 1.2: Frontend Navigation Shell

Status: review

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport width >= 1024px), **When** the user views the app, **Then** a `NavigationRail` component (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" navigation entries. (FR28)

2. **Given** the navigation rail is visible, **When** the user clicks the "Clientes" entry, **Then** the app navigates to `/clientes` without a full page reload and the "Clientes" item is marked as active. (FR28)

3. **Given** the navigation rail is visible, **When** the user clicks the "Contactos" entry, **Then** the app navigates to `/contactos` without a full page reload and the "Contactos" item is marked as active. (FR28)

4. **Given** the application is loaded on a mobile browser (viewport width < 1024px), **When** the user views the app, **Then** a `NavigationBar` component (siesa-ui-kit) is displayed at the bottom instead of the rail, with both "Clientes" and "Contactos" entries visible and tappable. (FR29)

5. **Given** the user types `/clientes` directly in the browser URL bar, **When** the page loads, **Then** the Clientes view renders correctly without redirection to a home screen, and the navigation item is marked as active. (FR30)

6. **Given** the user types `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the Contactos view renders correctly without redirection to a home screen, and the navigation item is marked as active. (FR30)

7. **Given** the user navigates to any unknown route (e.g., `/ruta-desconocida`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish and a link back to `/clientes`.

8. **Given** the navigation shell is rendered, **When** inspected with an accessibility checker, **Then** all navigation items have proper `aria-label` values in Spanish and comply with WCAG 2.1 AA (keyboard navigation, focus indicators, color contrast).

## Tasks / Subtasks

- [x] Task 1 — Configure TanStack Router root layout with navigation shell (AC: #1, #4, #8)
  - [x] Update `frontend/src/routes/__root.tsx` to render the navigation shell (NavigationRail on desktop, NavigationBar on mobile) as a persistent layout wrapping all routes
  - [x] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit`
  - [x] Use TailwindCSS v4 responsive classes (`lg:flex hidden` / `lg:hidden flex`) to conditionally show/hide rail vs. bar
  - [x] Wire navigation items to TanStack Router `<Link>` components for client-side navigation
  - [x] Ensure the `<Outlet />` renders the route content beside/below the navigation

- [x] Task 2 — Create route files for Clientes and Contactos views (AC: #5, #6)
  - [x] Create `frontend/src/routes/_app.tsx` as a pathless layout route wrapping authenticated shell
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — `/clientes` route rendering a placeholder `ClientesView`
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — `/contactos` route rendering a placeholder `ContactosView`
  - [x] Create `frontend/src/routes/index.tsx` — root `/` route that redirects to `/clientes` via TanStack Router `redirect`

- [x] Task 3 — Create 404 not-found route (AC: #7)
  - [x] Create `frontend/src/routes/__root.tsx` — use TanStack Router's `notFoundComponent` on the root route
  - [x] Display a Spanish message (e.g., "Página no encontrada") with a link back to `/clientes`

- [x] Task 4 — Highlight active navigation item (AC: #2, #3, #5, #6)
  - [x] Use TanStack Router's `useRouterState` to detect the current active route
  - [x] Pass the active state to the NavigationRail/NavigationBar siesa-ui-kit component to highlight the active item

- [x] Task 5 — Accessibility compliance (AC: #8)
  - [x] Add `aria-label` in Spanish to all navigation items ("Clientes", "Contactos")
  - [x] Verify keyboard focus is visible and navigable through the nav items
  - [x] Confirm color contrast meets WCAG 2.1 AA using Siesa Blue (`#0e79fd`) against white backgrounds

- [x] Task 6 — Write Vitest unit tests for navigation shell
  - [x] Test that `__root.tsx` renders `NavigationRail` on desktop viewport (mock `window.innerWidth >= 1024`)
  - [x] Test that `__root.tsx` renders `NavigationBar` on mobile viewport (mock `window.innerWidth < 1024`)
  - [x] Test that navigating to `/clientes` marks the Clientes item as active
  - [x] Test that navigating to `/contactos` marks the Contactos item as active

## Dev Notes

### Architecture Patterns

This story is **frontend-only**. No backend changes required. It extends the skeleton created in Story 1.1.

**TanStack Router file-based routing rules (mandatory):**
- `_` prefix = pathless layout route (no URL segment added)
- `__root.tsx` = global root layout wrapping ALL routes
- Route files in `src/routes/_app/` automatically nest under `_app.tsx` layout

**Required route file structure (delta from Story 1.1):**
```
frontend/src/routes/
  __root.tsx                   ← UPDATE: add persistent nav shell layout + siesa-ui-kit NavigationRail/Bar
  index.tsx                    ← UPDATE: redirect / → /clientes
  _app.tsx                     ← NEW: pathless layout for app shell
  _app/
    clientes.tsx               ← NEW: /clientes placeholder view
    contactos.tsx              ← NEW: /contactos placeholder view
  not-found.tsx                ← NOTE: used notFoundComponent on __root instead
```

After adding/modifying route files, TanStack Router plugin (`@tanstack/router-plugin/vite`) auto-regenerates `src/routeTree.gen.ts` on the next `pnpm run dev` or build. Do not manually edit `routeTree.gen.ts`.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed via `pnpm add siesa-ui-kit` in Story 1.1)
- **Usage**: Use `NavigationRail` from siesa-ui-kit for desktop and `NavigationBar` for mobile. Do NOT build custom nav components.
- **Constraint**: Do not create custom navigation components if siesa-ui-kit equivalents exist.
- **Responsive breakpoint**: `lg` = 1024px. Use `hidden lg:flex` / `flex lg:hidden` TailwindCSS v4 classes.

### Icons

Use **Heroicons** (primary icon set per company standards). Import from `@heroicons/react/24/outline`:
- Clientes: `UserGroupIcon`
- Contactos: `IdentificationIcon`

### Brand Colors & Styling

- Primary brand color: `#0e79fd` (Siesa Blue) — used for active navigation indicator
- Neutrals: Tailwind `slate-*` scale (e.g., `slate-100` for nav background, `slate-600` for inactive items)
- Dark mode: class-based (`darkMode: 'class'`) — not required in this story, but do not hardcode colors that would break dark mode

### State Management

URL is the source of truth for the active navigation item. No Zustand store required for this story. Use TanStack Router's `useRouterState` to detect `location.pathname` and pass it to the nav component for active highlighting.

### Redirect Pattern (index route)

```typescript
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

### 404 Not-Found Pattern

TanStack Router `notFoundComponent` on the root route is used for 404 handling.

### Placeholder Views for This Story

The Clientes and Contactos views are placeholders (to be implemented in Epics 2 and 3). Keep them minimal.

### Testing Standards

- **Framework**: Vitest + React Testing Library
- **Accessibility**: aria-label checks
- **Test co-location**: Tests placed alongside the component with `-` prefix to be ignored by the router
- **Pattern**: Arrange / Act / Assert using `act(async () => {...})` for router async operations

### Key Learnings from Story 1.2

- Test files in `src/routes/` must be prefixed with `-` so TanStack Router ignores them
- `jsdom` must be explicitly installed as a dev dependency for Vitest
- Router rendering is async: use `act(async () => { render(); await router.load(); })` in tests
- `@heroicons/react` must be explicitly installed even if it's a transitive dependency of siesa-ui-kit
- siesa-ui-kit NavigationRail uses `selectedId` + `onItemSelect` for active state; NavigationBar uses `activeItemId` + `onItemClick`
- NavigationRail `items` use `ariaLabel` prop per NavigationRailItemProps; NavigationBar `items` use `ariaLabel` per NavigationBarItem

### Git Commit Conventions (from repository history)

Format observed: `{type}({scope}): {description}` — e.g., `feat(1-2): add frontend navigation shell`

### Project Structure Notes

- Alignment with `frontend/src/routes/` file-based routing structure from architecture.md
- The `_app.tsx` layout route is the intended shell per architecture.md (`routes/_app.tsx`)
- `__root.tsx` updated (not replaced) — it was created as a placeholder in Story 1.1
- No new `src/modules/` files in this story — only `routes/` layer changes

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Architecture routing structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture frontend patterns: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- TanStack Router prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- UI Kit mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions — UI]
- Responsive layout strategy: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified — Responsive layout]
- Story 1.1 learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]
- Company standards (icons, colors, typography): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- jsdom missing: installed as explicit devDependency
- @heroicons/react: installed explicitly (not accessible as transitive dep)
- Test file router conflict: renamed to `-__root.test.tsx` with `-` prefix
- Router async rendering: fixed with `act(async () => { render(); await router.load() })`

### Completion Notes List

- All 6 tasks completed as a single coherent implementation
- 10 Vitest tests pass: NavigationRail desktop, NavigationBar mobile, active states, route views, 404 not-found
- siesa-ui-kit NavigationRail and NavigationBar used exclusively (no custom nav components)
- Heroicons used for Clientes (UserGroupIcon) and Contactos (IdentificationIcon)
- TailwindCSS v4 responsive classes `hidden lg:flex` / `flex lg:hidden` applied correctly
- notFoundComponent on root route handles 404 with Spanish message and link to /clientes
- routeTree.gen.ts auto-generated by TanStack Router plugin on first run
- Frontend config files created: package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, index.html, .env.development

### File List

**Created:**
- `frontend/package.json`
- `frontend/index.html`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/.env.development`
- `frontend/src/index.css`
- `frontend/src/main.tsx`
- `frontend/src/routeTree.gen.ts` (auto-generated, then regenerated by plugin)
- `frontend/src/app/providers/QueryProvider.tsx`
- `frontend/src/shared/lib/queryClient.ts`
- `frontend/src/shared/lib/apiClient.ts`
- `frontend/src/test/setup.ts`
- `frontend/src/routes/__root.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/routes/_app.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/_app/contactos.tsx`
- `frontend/src/routes/-__root.test.tsx`
