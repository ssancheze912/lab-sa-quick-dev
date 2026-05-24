# Story 1.2: Frontend Navigation Shell

Status: pending

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser (viewport < 1024px), **When** the user views the app, **Then** a mobile NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, **And** all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/unknown`), **When** the page loads, **Then** a 404 not-found view is displayed with a Spanish-language message and a link back to `/clientes`.

5. **Given** the application is loaded, **When** the user navigates between Clientes and Contactos, **Then** the active navigation item is visually highlighted in the NavigationRail / NavigationBar.

6. **Given** the root URL `/` is accessed, **When** the page loads, **Then** the user is redirected to `/clientes` automatically.

## Tasks / Subtasks

- [ ] Task 1 — Create `_app` pathless layout route with NavigationRail (desktop) (AC: #1, #5)
  - [ ] Create `frontend/src/routes/_app.tsx` — pathless layout wrapping `Outlet` with `LayoutBase` from siesa-ui-kit
  - [ ] Import `NavigationRail` from `siesa-ui-kit` and render it inside the layout with `navigationItems` for "Clientes" and "Contactos"
  - [ ] Use TanStack Router's `Link` component with `activeProps` to highlight the active navigation item
  - [ ] Pass `to="/clientes"` and `to="/contactos"` as TanStack Router `Link` targets for SPA navigation (no full page reload)
  - [ ] Apply `hidden lg:flex` (Tailwind v4) to render NavigationRail only on desktop (≥ 1024px)

- [ ] Task 2 — Add mobile NavigationBar (AC: #2, #5)
  - [ ] Import `NavigationBar` from `siesa-ui-kit` inside `_app.tsx`
  - [ ] Render `NavigationBar` with the same `navigationItems` as the rail
  - [ ] Apply `flex lg:hidden` to render NavigationBar only on mobile (< 1024px)
  - [ ] Verify all navigation items are tappable with adequate touch target size (WCAG 2.1 AA minimum 44×44px)

- [ ] Task 3 — Create `/clientes` and `/contactos` placeholder routes (AC: #3)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — exports `Route` with a placeholder `ClientesPage` component (Spanish heading "Clientes", will be replaced in Epic 2)
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — exports `Route` with a placeholder `ContactosPage` component (Spanish heading "Contactos", will be replaced in Epic 3)
  - [ ] Verify TanStack Router's file-based routing resolves `/clientes` and `/contactos` as direct URL entries (deep linking)

- [ ] Task 4 — Create 404 not-found route (AC: #4)
  - [ ] Create `frontend/src/routes/not-found.tsx` — exports a `NotFoundPage` component with Spanish message "Página no encontrada" and a `Link` back to `/clientes`
  - [ ] Register the not-found route in `frontend/src/routes/__root.tsx` using TanStack Router's `notFoundComponent` option
  - [ ] Verify that navigating to `/ruta-inexistente` renders the 404 view without a browser error

- [ ] Task 5 — Configure root route redirect `/` → `/clientes` (AC: #6)
  - [ ] Update `frontend/src/routes/index.tsx` to redirect to `/clientes` using TanStack Router's `redirect` in `beforeLoad`

- [ ] Task 6 — Update `__root.tsx` to wire pathless `_app` layout (AC: #1, #2, #3, #4)
  - [ ] Confirm `__root.tsx` renders `Outlet` so the `_app` pathless layout is picked up by TanStack Router's file-based convention
  - [ ] Ensure `id="app-shell"` div is preserved from Story 1.1

- [ ] Task 7 — Write unit / component tests (AC: #1, #2, #3, #4)
  - [ ] Write `frontend/src/test/routes/app-layout.test.tsx` — renders `_app` layout, asserts NavigationRail is visible on desktop viewport (≥ 1024px) and NavigationBar on mobile (< 1024px)
  - [ ] Write `frontend/src/test/routes/not-found.test.tsx` — renders `NotFoundPage`, asserts Spanish "Página no encontrada" text and `/clientes` link are present
  - [ ] Run `pnpm exec vitest run` — all tests pass with zero TypeScript errors

## Dev Notes

### Routing Structure

TanStack Router file-based routing conventions used in this story:

```
src/routes/
  __root.tsx                    # Root layout — Outlet only (Story 1.1)
  index.tsx                     # / → redirect to /clientes
  _app.tsx                      # Pathless layout (_prefix = no URL segment)
  _app/
    clientes.tsx                # /clientes — Clientes placeholder
    contactos.tsx               # /contactos — Contactos placeholder
  not-found.tsx                 # 404 view (registered via notFoundComponent)
```

`_app.tsx` is a pathless layout (underscore prefix) — it wraps its children without adding a URL segment. All routes inside `_app/` inherit the NavigationRail/NavigationBar shell.

### siesa-ui-kit Component Usage

Components to use from `siesa-ui-kit` (check catalog before building custom):

- **`LayoutBase`** — Top-level application shell providing `Navbar` (64px) + `NavigationRail` slot + content area. Import and wrap `Outlet` inside it.
- **`NavigationRail`** — Desktop side navigation (72px collapsed, icon-only). Accepts `navigationItems` array. Render only on desktop (`hidden lg:flex`).
- **`NavigationBar`** — Mobile bottom navigation. Accepts the same `navigationItems`. Render only on mobile (`flex lg:hidden`).
- **`Navbar`** — Top header bar. Use with `productName="Siesa Agents"`.

`navigationItems` shape expected by siesa-ui-kit (verify against installed package types):
```typescript
const navigationItems = [
  { label: 'Clientes', icon: <UsersIcon />, to: '/clientes' },
  { label: 'Contactos', icon: <UserIcon />, to: '/contactos' },
]
```

Use `Heroicons` (primary icon library per company standards):
- `UsersIcon` for Clientes
- `UserIcon` for Contactos

### TanStack Router Patterns

**Pathless layout (`_app.tsx`):**
```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <LayoutBase navbar={<Navbar productName="Siesa Agents" />}>
      <NavigationRail className="hidden lg:flex" items={navigationItems} />
      <NavigationBar className="flex lg:hidden" items={navigationItems} />
      <Outlet />
    </LayoutBase>
  )
}
```

**Index redirect (`index.tsx`):**
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => { throw redirect({ to: '/clientes' }) },
})
```

**Not-found registration (`__root.tsx`):**
```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NotFoundPage } from './not-found'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
```

**Active link styling:** Use TanStack Router's `Link` `activeProps` to apply active class. Alternatively, use `useRouterState` to determine the active path and pass it to siesa-ui-kit `NavigationRail`/`NavigationBar` if those components accept an `activePath` prop.

### Responsive Breakpoint

Per company standards (UX Spec Direction F and architecture.md):
- Desktop navigation: `NavigationRail` at `lg:` breakpoint (1024px+) — `hidden lg:flex`
- Mobile navigation: `NavigationBar` below `lg:` — `flex lg:hidden`

TailwindCSS v4 — utility classes work identically to v3 for responsive prefixes.

### Placeholder Views

`ClientesPage` and `ContactosPage` are intentional placeholder stubs for this story. They exist solely to satisfy the routing and navigation requirements. Epic 2 and Epic 3 will replace these stubs with full views.

```typescript
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return <main className="p-6"><h1 className="text-2xl font-bold">Clientes</h1></main>
}
```

### Testing Approach

- **Vitest + React Testing Library** for all tests
- Viewport simulation via `Object.defineProperty(window, 'innerWidth', ...)` or `window.resizeTo` for responsive tests
- Tests go in `frontend/src/test/routes/` following the co-location pattern established in Story 1.1
- All test assertions use Spanish strings for user-visible text (matching company standard)
- WCAG accessibility check via `@testing-library/jest-dom` — ensure nav items have accessible `aria-label` attributes

### File List (Expected)

#### New files
- `frontend/src/routes/_app.tsx` — Pathless application shell layout
- `frontend/src/routes/_app/clientes.tsx` — `/clientes` placeholder route
- `frontend/src/routes/_app/contactos.tsx` — `/contactos` placeholder route
- `frontend/src/routes/not-found.tsx` — 404 not-found view
- `frontend/src/test/routes/app-layout.test.tsx` — Layout + navigation tests
- `frontend/src/test/routes/not-found.test.tsx` — 404 page tests

#### Modified files
- `frontend/src/routes/__root.tsx` — Register `notFoundComponent`
- `frontend/src/routes/index.tsx` — Add redirect to `/clientes`
- `frontend/src/routeTree.gen.ts` — Auto-regenerated by TanStack Router plugin

### References

- Routing file-based conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- Architecture routing decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- UX design direction (Direction F): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- siesa-ui-kit P0 rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Story 1.1 implementation notes: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_To be filled by Dev Agent during implementation._

### Completion Notes List

_To be filled by Dev Agent during implementation._

### File List

_To be filled by Dev Agent during implementation._
