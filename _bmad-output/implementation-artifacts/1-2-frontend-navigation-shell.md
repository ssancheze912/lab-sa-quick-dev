# Story 1.2: Frontend Navigation Shell

Status: ready

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit, 72px collapsed) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (<1024px), **When** the user views the app, **Then** a bottom `NavigationBar` (siesa-ui-kit) is displayed instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen (FR30).

4. **Given** the user navigates to `/` (root), **When** the page loads, **Then** the router redirects to `/clientes` automatically.

5. **Given** the user navigates to an unknown route, **When** the page loads, **Then** a not-found view is displayed and the navigation shell remains visible.

## Tasks / Subtasks

- [ ] Task 1 — Configure TanStack Router shell routes (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route wrapping `LayoutBase` from siesa-ui-kit with `NavigationRail` (desktop) and `NavigationBar` (mobile)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — `/clientes` route rendering `<ClientesPlaceholder />` (empty view with page heading "Clientes")
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — `/contactos` route rendering `<ContactosPlaceholder />` (empty view with page heading "Contactos")
  - [ ] Update `frontend/src/routes/index.tsx` — redirect to `/clientes` via TanStack Router `redirect` in `beforeLoad`
  - [ ] Create `frontend/src/routes/$404.tsx` (or configure `notFoundComponent` in `__root.tsx`) — renders `<NotFound />` component keeping the shell layout

- [ ] Task 2 — Build `AppShell` layout component (AC: #1, #2)
  - [ ] In `_app.tsx`, import and render `LayoutBase` from siesa-ui-kit with:
    - `Navbar` — `productName="Siesa Agents"`, `environmentBadge` from `import.meta.env.VITE_ENV` (default `"dev"`)
    - `NavigationRail` on desktop (Tailwind `hidden lg:flex`) with items: `{ label: "Clientes", icon: <UsersIcon />, to: "/clientes" }` and `{ label: "Contactos", icon: <UserIcon />, to: "/contactos" }`
    - `NavigationBar` on mobile (Tailwind `flex lg:hidden`) with the same two items
  - [ ] Use `<Outlet />` from TanStack Router as the content area inside `LayoutBase`
  - [ ] Use `useRouterState` or TanStack Router's `Link` component to apply active state to the current nav item
  - [ ] Use Heroicons for nav icons: `UsersIcon` for Clientes, `UserIcon` for Contactos (from `@heroicons/react/24/outline`)

- [ ] Task 3 — Install missing dependencies (AC: #1, #2)
  - [ ] Install Heroicons: `pnpm add @heroicons/react`
  - [ ] Verify siesa-ui-kit exports `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar` — if not exported directly, use siesa-ui-kit's documented shell composition API

- [ ] Task 4 — Create placeholder route views (AC: #3)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx` — renders `<h1>Clientes</h1>` as a scaffold for Epic 2
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx` — renders `<h1>Contactos</h1>` as a scaffold for Epic 3

- [ ] Task 5 — Create `NotFound` component (AC: #5)
  - [ ] Create `frontend/src/shared/components/NotFound.tsx` — renders a user-facing 404 message in Spanish ("Página no encontrada") with a link back to `/clientes`
  - [ ] Register as `notFoundComponent` in `__root.tsx` TanStack Router root route config

- [ ] Task 6 — Write Vitest + RTL tests (AC: #1, #2, #3, #4, #5)
  - [ ] `frontend/src/test/routes/navigation.test.tsx` — TC-E1-P1-01: verify SPA navigation (click "Clientes" nav → URL `/clientes`, click "Contactos" → URL `/contactos`, no `window.location.reload` called)
  - [ ] `frontend/src/test/routes/notFound.test.tsx` — TC-E1-P1-04: render router at `/ruta-inexistente`, assert `NotFound` component is displayed
  - [ ] `frontend/src/test/routes/indexRedirect.test.tsx` — TC-E1-P2-03: render router at `/`, assert redirect to `/clientes`
  - [ ] `frontend/src/test/components/AppShell.desktop.test.tsx` — TC-E1-P2-01: render shell at viewport 1280px, assert `NavigationRail` is in DOM with "Clientes" and "Contactos"
  - [ ] `frontend/src/test/components/AppShell.mobile.test.tsx` — TC-E1-P2-02: render shell at viewport 375px, assert `NavigationBar` is visible and `NavigationRail` is not visible

## Dev Notes

### Routing Architecture

This story builds on Story 1.1's `__root.tsx`. The route tree after this story:

```
__root.tsx                     ← Root layout (QueryProvider, no URL segment)
  index.tsx                    ← / → redirect to /clientes
  _app.tsx                     ← Pathless layout: LayoutBase + NavigationRail/NavigationBar
    _app/clientes.tsx           ← /clientes
    _app/contactos.tsx          ← /contactos
  $404.tsx (or notFound)        ← catch-all not-found route
```

TanStack Router file-based routing rules applied:
- `_app.tsx` uses the `_` prefix → pathless layout route (no URL segment added)
- `_app/` folder contains child routes that inherit the layout
- `index.tsx` uses `redirect` in `beforeLoad` for the root redirect

### Shell Layout Pattern (siesa-ui-kit)

Per UX spec (Direction F), the shell structure is:

```
┌─ Navbar (64px) ─────────────────────────────────────────────────┐
│  [Siesa symbol] Siesa Agents          [env badge] [🔔] [Avatar] │
└──────────────────────────────────────────────────────────────────┘
┌─ NavigationRail (72px) ─┬─ Content Area (flex) ──────────────────┐
│  👥 Clientes            │  <Outlet /> content                    │
│  🙋 Contactos           │                                         │
└─────────────────────────┴────────────────────────────────────────┘
```

On mobile (<1024px): NavigationRail is replaced by `NavigationBar` (bottom nav, 56px).

**siesa-ui-kit usage priority (company standard):** Always check siesa-ui-kit catalog first. Components: `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar`. If the siesa-ui-kit API differs from what is described here, adapt the integration to match the actual exported API without creating custom replacements.

### TanStack Router — Responsive Nav Implementation

```typescript
// frontend/src/routes/_app.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
// Import siesa-ui-kit shell components — verify exact exports from package
import { LayoutBase, Navbar, NavigationRail, NavigationBar } from 'siesa-ui-kit'

export const Route = createFileRoute('/_app')({
  component: AppShellLayout,
})

const navItems = [
  { label: 'Clientes', icon: UsersIcon, to: '/clientes' },
  { label: 'Contactos', icon: UserIcon, to: '/contactos' },
]

function AppShellLayout() {
  return (
    <LayoutBase
      navbar={
        <Navbar
          productName="Siesa Agents"
          environmentBadge={import.meta.env.VITE_ENV ?? 'dev'}
        />
      }
      navigationRail={
        <div className="hidden lg:flex">
          <NavigationRail items={navItems} />
        </div>
      }
      navigationBar={
        <div className="flex lg:hidden">
          <NavigationBar items={navItems} />
        </div>
      }
    >
      <Outlet />
    </LayoutBase>
  )
}
```

**Note:** Adapt the `LayoutBase` prop API to match the actual siesa-ui-kit export. The pattern above is illustrative — check the package's TypeScript types before implementation.

### Index Route Redirect

```typescript
// frontend/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

### NotFound Component

```typescript
// frontend/src/shared/components/NotFound.tsx
import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta solicitada no existe.</p>
      <Link to="/clientes" className="text-[#0e79fd] hover:underline">
        Volver a Clientes
      </Link>
    </div>
  )
}
```

Register in `__root.tsx`:

```typescript
// Update frontend/src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NotFound } from '../shared/components/NotFound'

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
})
```

### Breakpoint Strategy

Per UX spec and company standards:
- `lg: 1024px` — Tailwind breakpoint for desktop/mobile nav swap
- Desktop (≥1024px): `NavigationRail` (72px collapsed, icon + label on hover)
- Mobile (<1024px): `NavigationBar` (bottom nav, 56px)
- Use Tailwind responsive classes (`hidden lg:flex` / `flex lg:hidden`) — NOT JS media queries

### All User-Facing Text in Spanish

Per company standard, all labels must be in Spanish:
- Navigation items: "Clientes", "Contactos"
- 404 message: "Página no encontrada"
- Link: "Volver a Clientes"
- Page headings: "Clientes", "Contactos"

### Placeholder Views Scope

The `clientes.tsx` and `contactos.tsx` route components in this story render minimal scaffolds only. The full UI panels (`ClienteListView`, `ClienteDetailView`, `ContactoListView`, etc.) are implemented in Epics 2 and 3. Do NOT implement any CRUD, API calls, or data fetching in this story.

### Files Modified from Story 1.1

- `frontend/src/routes/__root.tsx` — add `notFoundComponent: NotFound`
- `frontend/src/routes/index.tsx` — replace placeholder with redirect to `/clientes`

### References

- Navigation shell UX layout: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Direction F — LayoutBase + Lista/Detalle + ContactManager]
- Breakpoint strategy: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Breakpoint Strategy]
- Routing file structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- TanStack Router prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Test cases for this story: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P1-01, TC-E1-P1-02, TC-E1-P1-03, TC-E1-P1-04, TC-E1-P2-01, TC-E1-P2-02, TC-E1-P2-03]
- FR28, FR29, FR30: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Company stack standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(to be filled during implementation)

### Completion Notes List

(to be filled during implementation)

### File List

#### Frontend

- `frontend/src/routes/_app.tsx` — pathless layout route with LayoutBase + NavigationRail (desktop) + NavigationBar (mobile)
- `frontend/src/routes/_app/clientes.tsx` — /clientes route with ClientesPlaceholder
- `frontend/src/routes/_app/contactos.tsx` — /contactos route with ContactosPlaceholder
- `frontend/src/routes/index.tsx` — redirect to /clientes via beforeLoad
- `frontend/src/routes/__root.tsx` — updated with notFoundComponent: NotFound
- `frontend/src/shared/components/NotFound.tsx` — 404 view in Spanish with link to /clientes
- `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx` — scaffold for Epic 2
- `frontend/src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx` — scaffold for Epic 3
- `frontend/src/test/routes/navigation.test.tsx` — TC-E1-P1-01 SPA navigation test
- `frontend/src/test/routes/notFound.test.tsx` — TC-E1-P1-04 404 route test
- `frontend/src/test/routes/indexRedirect.test.tsx` — TC-E1-P2-03 index redirect test
- `frontend/src/test/components/AppShell.desktop.test.tsx` — TC-E1-P2-01 NavigationRail desktop test
- `frontend/src/test/components/AppShell.mobile.test.tsx` — TC-E1-P2-02 NavigationBar mobile test
