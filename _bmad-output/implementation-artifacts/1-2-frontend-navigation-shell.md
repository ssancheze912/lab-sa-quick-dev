# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side (72px collapsed, icon-only) with "Clientes" and "Contactos" entries. Clicking either entry navigates to `/clientes` or `/contactos` without a full page reload. (FR28)

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** the `NavigationRail` is replaced by a `NavigationBar` (siesa-ui-kit bottom nav, 56px) displayed at the bottom of the screen. All navigation items are accessible and tappable with touch targets ≥ 44×44px. (FR29)

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered and the matching navigation item is highlighted as active — without redirection to a home screen. (FR30)

4. **Given** the user navigates to an unknown route (e.g., `/algo-desconocido`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a link back to `/clientes`.

5. **Given** the application shell is rendered, **When** a navigation item is active, **Then** the item shows a left border in `primary-600`, background `primary-50`, and icon color `primary-700` (desktop rail) or an active indicator on the bottom nav (mobile).

6. **Given** the user navigates between `/clientes` and `/contactos`, **When** the transition occurs, **Then** there is no full page reload — routing is handled client-side by TanStack Router.

## Tasks / Subtasks

- [ ] Task 1 — Create application shell layout route (AC: #1, #2, #5, #6)
  - [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route that wraps all authenticated views
  - [ ] Import `LayoutBase` from `siesa-ui-kit` and configure with `navigationItems` for Clientes and Contactos
  - [ ] Configure `Navbar` with `productName="Siesa Agents"` (siesa-ui-kit)
  - [ ] Configure `NavigationRail` (72px, collapsed, icon-only) for desktop (≥1024px) using Heroicons icons
  - [ ] Configure `NavigationBar` (bottom nav, 56px) for mobile (<1024px) using Tailwind responsive breakpoints
  - [ ] Use TanStack Router `useMatchRoute` or `useRouter` to highlight the active navigation item
  - [ ] Wire `Outlet` from TanStack Router inside the content area to render child routes

- [ ] Task 2 — Create route files for Clientes and Contactos sections (AC: #3, #6)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — renders `/clientes` path (placeholder view for now)
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — renders `/contactos` path (placeholder view for now)
  - [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — renders `/clientes/:clienteId` path (placeholder)
  - [ ] Create `frontend/src/routes/_app/contactos.$contactoId.tsx` — renders `/contactos/:contactoId` path (placeholder)
  - [ ] Ensure each route exports a `Route` constant using `createFileRoute`
  - [ ] Verify TanStack Router auto-generates `routeTree.gen.ts` with all new routes

- [ ] Task 3 — Configure root route and index redirect (AC: #3, #4)
  - [ ] Update `frontend/src/routes/__root.tsx` to include `QueryClientProvider`, `Toaster` (sonner), and `Outlet`
  - [ ] Create `frontend/src/routes/index.tsx` — redirects to `/clientes` using `redirect({ to: '/clientes' })`
  - [ ] Confirm `defaultNotFoundComponent` in `router.tsx` renders a 404 page in Spanish with a "Ir a Clientes" link

- [ ] Task 4 — Implement 404 Not Found component (AC: #4)
  - [ ] Create `frontend/src/shared/components/NotFoundPage.tsx` — heading "Página no encontrada", subtext in Spanish, `Button` (siesa-ui-kit) linking to `/clientes`
  - [ ] Register in `frontend/src/router.tsx` as `defaultNotFoundComponent`

- [ ] Task 5 — Verify navigation behavior and accessibility (AC: #1, #2, #5, #6)
  - [ ] Run `pnpm run dev` and manually verify `/clientes` and `/contactos` load without full page reloads
  - [ ] Verify `NavigationRail` shows on desktop and `NavigationBar` shows on mobile (resize browser)
  - [ ] Verify active item highlights correctly when URL matches
  - [ ] Verify typing URL directly loads the correct view
  - [ ] Verify unknown routes show 404 page

- [ ] Task 6 — Write component tests (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/routes/__tests__/_app.test.tsx` — test that `NavigationRail` renders on desktop and `NavigationBar` on mobile
  - [ ] Test active state: active item has `primary-600` indicator class when route matches
  - [ ] Test 404: navigating to unknown route renders `NotFoundPage`
  - [ ] Test redirect: navigating to `/` redirects to `/clientes`
  - [ ] Run accessibility check with `axe` on the `_app` layout

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `pnpm add siesa-ui-kit` (already installed in Story 1.1)
- **Usage**: MUST use `LayoutBase`, `NavigationRail`, `NavigationBar`, and `Navbar` from `siesa-ui-kit` for all shell and navigation elements.
- **Constraint**: Do not build custom navigation components if a `siesa-ui-kit` equivalent exists.

### Shell Architecture Pattern

This story implements the application shell defined in the architecture doc. The `_app.tsx` layout route is the persistent shell:

```typescript
// frontend/src/routes/_app.tsx
import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import { LayoutBase, Navbar, NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

const navigationItems = [
  { label: 'Clientes', icon: UsersIcon, to: '/clientes' },
  { label: 'Contactos', icon: UserIcon, to: '/contactos' },
]

function AppShell() {
  return (
    <LayoutBase
      navbar={<Navbar productName="Siesa Agents" />}
      navigationRail={<NavigationRail items={navigationItems} />}
      navigationBar={<NavigationBar items={navigationItems} />}
    >
      <Outlet />
    </LayoutBase>
  )
}
```

Note: The exact prop API for `LayoutBase`, `NavigationRail`, and `NavigationBar` must be confirmed from the installed `siesa-ui-kit` package. Check `node_modules/siesa-ui-kit` or its documentation. The pattern above illustrates intent — adapt to the actual API.

### TanStack Router File Structure

Per architecture (file-based routing with `_` prefix for pathless layouts):

```
frontend/src/routes/
├── __root.tsx                        # Root layout — QueryClientProvider + Toaster + Outlet
├── index.tsx                         # redirect() → /clientes
├── _app.tsx                          # Pathless layout — LayoutBase + NavigationRail + Navbar
└── _app/
    ├── clientes.tsx                  # /clientes — placeholder ClientesView
    ├── clientes.$clienteId.tsx       # /clientes/:clienteId — placeholder ClienteDetailView
    ├── contactos.tsx                 # /contactos — placeholder ContactosView
    └── contactos.$contactoId.tsx     # /contactos/:contactoId — placeholder ContactoDetailView
```

The `_` prefix on `_app.tsx` ensures it does NOT add a path segment to URLs — `/clientes` and `/contactos` remain clean (not `/app/clientes`).

### Route file patterns

```typescript
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return <div data-testid="clientes-view">Clientes (placeholder)</div>
}
```

```typescript
// frontend/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

### Root Route Pattern

Build on the `__root.tsx` scaffold from Story 1.1:

```typescript
// frontend/src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  )
}
```

### Responsive Breakpoints (per UX spec)

| Breakpoint | Tailwind | Behavior |
|---|---|---|
| Mobile base | — | `NavigationBar` (bottom nav, 56px), `NavigationRail` hidden |
| Tablet | `md:` | 768px |
| Desktop | `lg:` | ≥1024px — `NavigationRail` (72px), `NavigationBar` hidden |

Per the UX specification (Direction F), `LayoutBase` from siesa-ui-kit handles this responsive switching internally when both `navigationRail` and `navigationBar` are provided. Verify this in the actual component API.

### Active Navigation State

Per UX spec, active nav items use:
- Desktop rail: left border `primary-600`, background `primary-50`, icon `primary-700`
- Mobile nav bar: built-in active indicator

Use TanStack Router's `useMatchRoute` hook or the `Link` component's `activeProps` to sync active state:

```typescript
// Example using Link with activeProps
<Link to="/clientes" activeProps={{ className: 'bg-primary-50 border-l-2 border-primary-600' }}>
  Clientes
</Link>
```

The `NavigationRail` from siesa-ui-kit likely handles active state internally if provided with the current route. Inspect the component API.

### 404 Not Found Page

```typescript
// frontend/src/shared/components/NotFoundPage.tsx
import { Link } from '@tanstack/react-router'
import { Button } from 'siesa-ui-kit'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="not-found-page">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="text-lg text-slate-600">Página no encontrada</p>
        <p className="text-sm text-slate-500">La ruta solicitada no existe.</p>
        <Button asChild>
          <Link to="/clientes">Ir a Clientes</Link>
        </Button>
      </div>
    </div>
  )
}
```

### Testing Standards

- **Framework**: Vitest + React Testing Library + MSW
- **Accessibility**: `vitest-axe` for WCAG 2.1 AA checks on the shell layout
- **Test location**: Co-located with route files in `__tests__/` subfolder or `.test.tsx` suffix
- **Key test scenarios**:
  - Desktop layout renders `NavigationRail` (mock viewport width ≥ 1024px)
  - Mobile layout renders `NavigationBar` (mock viewport width < 1024px)
  - Active item indicator is applied when route matches
  - Unknown route renders `NotFoundPage` with "Página no encontrada" text
  - `/` redirects to `/clientes`

### Language Rules (MANDATORY)

- All user-visible text MUST be in Spanish: labels, ARIA labels, placeholder text, error messages
- Navigation labels: "Clientes", "Contactos" (NOT "Clients", "Contacts")
- 404 page text: "Página no encontrada", "Ir a Clientes"
- Code (variables, functions, file names): English

### Previous Story Context

Story 1.1 established:
- `frontend/src/routes/__root.tsx` as a shell layout placeholder — this story completes it
- `frontend/src/shared/lib/queryClient.ts` singleton — import in `__root.tsx`
- `pnpm` as package manager — continue using `pnpm`
- `siesa-ui-kit` already installed via `pnpm add siesa-ui-kit`
- TanStack Router plugin (`@tanstack/router-plugin/vite`) configured in `vite.config.ts` — it auto-generates `routeTree.gen.ts` when files are saved

### Git Context

Recent commits show Story 1.1 is complete. The test infrastructure (ATDD, automate tests) is present. This story should follow the same patterns for test placement.

### Project Structure Notes

- Files created in this story live under `frontend/src/routes/` and `frontend/src/shared/components/`
- No backend work required for this story — pure frontend routing shell
- Placeholder views in `clientes.tsx` and `contactos.tsx` will be replaced in Epic 2 and Epic 3 stories
- Do NOT create `ClienteListView`, `ClienteDetailView`, `ContactoListView` in this story — those belong to Epic 2 / Epic 3

### References

- Architecture routing decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- TanStack Router file prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- UX shell design (Direction F): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- siesa-ui-kit components for navigation: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- Responsive breakpoints: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility]
- Navigation active state pattern: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#NavigationRail (desktop)]
- Frontend standards (file structure, routing): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/frontend-standards.md]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
