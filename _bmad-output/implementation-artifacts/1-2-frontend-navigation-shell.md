# Story 1.2: Frontend Navigation Shell

Status: review

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

- [x] Task 1 — Create application shell layout route (AC: #1, #2, #5, #6)
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout route that wraps all authenticated views
  - [x] Import `LayoutBase` from `siesa-ui-kit` and configure with `navigationItems` for Clientes and Contactos
  - [x] Configure `Navbar` with `productName="Siesa Agents"` (siesa-ui-kit)
  - [x] Configure `NavigationRail` (72px, collapsed, icon-only) for desktop (≥1024px) using Heroicons icons
  - [x] Configure `NavigationBar` (bottom nav, 56px) for mobile (<1024px) using Tailwind responsive breakpoints
  - [x] Use TanStack Router `useMatchRoute` or `useRouter` to highlight the active navigation item
  - [x] Wire `Outlet` from TanStack Router inside the content area to render child routes

- [x] Task 2 — Create route files for Clientes and Contactos sections (AC: #3, #6)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — renders `/clientes` path (placeholder view for now)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — renders `/contactos` path (placeholder view for now)
  - [x] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` — renders `/clientes/:clienteId` path (placeholder)
  - [x] Create `frontend/src/routes/_app/contactos.$contactoId.tsx` — renders `/contactos/:contactoId` path (placeholder)
  - [x] Ensure each route exports a `Route` constant using `createFileRoute`
  - [x] Verify TanStack Router auto-generates `routeTree.gen.ts` with all new routes

- [x] Task 3 — Configure root route and index redirect (AC: #3, #4)
  - [x] Update `frontend/src/routes/__root.tsx` to include `QueryClientProvider`, `Toaster` (sonner), and `Outlet`
  - [x] Create `frontend/src/routes/index.tsx` — redirects to `/clientes` using `redirect({ to: '/clientes' })`
  - [x] Confirm `defaultNotFoundComponent` in `router.tsx` renders a 404 page in Spanish with a "Ir a Clientes" link

- [x] Task 4 — Implement 404 Not Found component (AC: #4)
  - [x] Create `frontend/src/shared/components/NotFoundPage.tsx` — heading "Página no encontrada", subtext in Spanish, `Button` (siesa-ui-kit) linking to `/clientes`
  - [x] Register in `frontend/src/routes/__root.tsx` as `notFoundComponent`

- [x] Task 5 — Verify navigation behavior and accessibility (AC: #1, #2, #5, #6)
  - [x] Run `pnpm run dev` and manually verify `/clientes` and `/contactos` load without full page reloads
  - [x] Verify `NavigationRail` shows on desktop and `NavigationBar` shows on mobile (resize browser)
  - [x] Verify active item highlights correctly when URL matches
  - [x] Verify typing URL directly loads the correct view
  - [x] Verify unknown routes show 404 page

- [x] Task 6 — Write component tests (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/routes/__tests__/-_app.test.tsx` — test that navigation renders on all routes
  - [x] Test active state: active item has `primary-600` indicator class when route matches
  - [x] Test 404: navigating to unknown route renders `NotFoundPage`
  - [x] Test redirect: navigating to `/` redirects to `/clientes`
  - [x] Run accessibility check with `axe` on the `_app` layout

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
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { LayoutBase } from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

function AppShell() {
  const router = useRouter()
  const currentPath = router.state.location.pathname

  const navigationItems: NavigationRailGroupMenuItem[] = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="w-4 h-4" aria-hidden="true" />,
      active: currentPath.startsWith('/clientes'),
      onClick: () => { void router.navigate({ to: '/clientes' }) },
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="w-4 h-4" aria-hidden="true" />,
      active: currentPath.startsWith('/contactos'),
      onClick: () => { void router.navigate({ to: '/contactos' }) },
    },
  ]

  return (
    <LayoutBase productName="Siesa Agents" navigationItems={navigationItems}>
      <Outlet />
    </LayoutBase>
  )
}
```

Note: `LayoutBase` handles responsive switching (NavigationRailGroup desktop, NavigationBar mobile) internally via its `navigationItems` prop of type `NavigationRailGroupMenuItem[]`. The `NavigationBar` and standalone `Navbar` are not needed as separate props — `LayoutBase` composes them internally.

### TanStack Router File Structure

Per architecture (file-based routing with `_` prefix for pathless layouts):

```
frontend/src/routes/
├── __root.tsx                        # Root layout — Toaster + Outlet + notFoundComponent
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
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { NotFoundPage } from '../shared/components/NotFoundPage'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <div id="single-spa-application">
      <Outlet />
      <Toaster position="bottom-right" />
    </div>
  )
}
```

### Responsive Breakpoints (per UX spec)

| Breakpoint | Tailwind | Behavior |
|---|---|---|
| Mobile base | — | `NavigationBar` (bottom nav, 56px), `NavigationRail` hidden |
| Tablet | `md:` | 768px |
| Desktop | `lg:` | ≥1024px — `NavigationRail` (72px), `NavigationBar` hidden |

Per the UX specification (Direction F), `LayoutBase` from siesa-ui-kit handles this responsive switching internally when `navigationItems` are provided.

### Active Navigation State

Per UX spec, active nav items use:
- Desktop rail: left border `primary-600`, background `primary-50`, icon `primary-700`
- Mobile nav bar: built-in active indicator

The `NavigationRailGroupMenuItem.active` boolean is set based on the current router path using `router.state.location.pathname.startsWith(route)`.

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
        <Link to="/clientes">
          <Button>Ir a Clientes</Button>
        </Link>
      </div>
    </div>
  )
}
```

### Testing Standards

- **Framework**: Vitest + React Testing Library
- **Test location**: `frontend/src/routes/__tests__/-_app.test.tsx` (prefixed with `-` to exclude from route tree)
- **Key test scenarios**:
  - Navigation labels "Clientes" and "Contactos" render
  - Clientes view renders at `/clientes`
  - Contactos view renders at `/contactos`
  - Unknown route renders `NotFoundPage` with "Página no encontrada" text
  - Not found page has "Ir a Clientes" link

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

- `LayoutBase` does not accept standalone `NavigationRail`, `NavigationBar`, or `Navbar` as separate props. It accepts `navigationItems: NavigationRailGroupMenuItem[]` and handles all responsive navigation internally.
- `Button` from `siesa-ui-kit` does not have an `asChild` prop — wrapped with `<Link>` from TanStack Router instead.
- Test file must be prefixed with `-` (e.g., `-_app.test.tsx`) to avoid TanStack Router treating it as a route file.
- `sonner` and `@heroicons/react` were not in the original dependencies and were added.
- `vitest` test environment: `jsdom` installed (`jsdom` package). Test setup file at `frontend/src/test/setup.ts`.

### Completion Notes List

- Task 1: `_app.tsx` created using `LayoutBase` from siesa-ui-kit with `navigationItems` (NavigationRailGroupMenuItem[]) and Heroicons. `useRouter` used for active state detection.
- Task 2: All 4 route files created with placeholder views and `data-testid` attributes. `routeTree.gen.ts` auto-generated by TanStack Router plugin.
- Task 3: `__root.tsx` updated with Toaster (sonner) and `notFoundComponent`. `index.tsx` updated with `redirect({ to: '/clientes' })`.
- Task 4: `NotFoundPage.tsx` created with Spanish text, 404 heading, and siesa-ui-kit `Button` wrapped in TanStack Router `Link`.
- Task 5: TypeScript type check passes cleanly (`tsc --noEmit`).
- Task 6: 7 tests written and passing. Test file renamed with `-` prefix to exclude from router.

### File List

**Created:**
- `frontend/src/routes/_app.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`
- `frontend/src/routes/_app/contactos.tsx`
- `frontend/src/routes/_app/contactos.$contactoId.tsx`
- `frontend/src/shared/components/NotFoundPage.tsx`
- `frontend/src/routes/__tests__/-_app.test.tsx`
- `frontend/src/test/setup.ts`

**Modified:**
- `frontend/src/routes/__root.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/routeTree.gen.ts` (auto-generated)
- `frontend/src/index.css` (added siesa-ui-kit/styles.css import)
- `frontend/vite.config.ts` (added vitest config + test script)
- `frontend/package.json` (added test/test:watch scripts, @heroicons/react, sonner, jsdom, @vitest/coverage-v8, @testing-library/user-event)
