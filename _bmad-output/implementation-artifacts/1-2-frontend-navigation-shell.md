# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a `NavigationRail` component from `siesa-ui-kit` is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a `NavigationBar` component from `siesa-ui-kit` is displayed at the bottom instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered with the active navigation item highlighted — without redirection to a home screen (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/foo`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish and a link to return to the application.

5. **Given** the root path `/` is accessed, **When** the page loads, **Then** the user is automatically redirected to `/clientes`.

6. **Given** the application is running, **When** a user navigates between sections, **Then** the active navigation item reflects the current route at all times (visual active state).

## Tasks / Subtasks

- [ ] Task 1 — Update `__root.tsx` to include layout with siesa-ui-kit navigation components (AC: #1, #2, #6)
  - [ ] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit`
  - [ ] Implement responsive shell: render `NavigationRail` on desktop (>= 1024px), `NavigationBar` on mobile (< 1024px) using TailwindCSS responsive classes (`hidden lg:flex` / `flex lg:hidden`)
  - [ ] Configure navigation items: `{ label: 'Clientes', to: '/clientes', icon: <UsersIcon /> }` and `{ label: 'Contactos', to: '/contactos', icon: <UserIcon /> }` using Heroicons
  - [ ] Wire active state: use TanStack Router's `useLocation` or `Link` `activeProps` to reflect active route in navigation items
  - [ ] Render `<Outlet />` as the main content area alongside the navigation components

- [ ] Task 2 — Create route files for `/clientes` and `/contactos` (AC: #3, #6)
  - [ ] Create `src/routes/_app.tsx` — pathless layout route that wraps authenticated/app shell
  - [ ] Create `src/routes/_app/clientes.tsx` — placeholder view for `/clientes` route
  - [ ] Create `src/routes/_app/contactos.tsx` — placeholder view for `/contactos` route
  - [ ] Verify TanStack Router auto-generates updated `routeTree.gen.ts` on save
  - [ ] Confirm deep linking: navigating directly to `/clientes` or `/contactos` renders the correct placeholder view

- [ ] Task 3 — Create root index redirect and 404 route (AC: #4, #5)
  - [ ] Update `src/routes/index.tsx` to redirect to `/clientes` using TanStack Router's `redirect` or `Navigate`
  - [ ] Create `src/routes/404.tsx` (or `$` catch-all) for unknown routes displaying a "Página no encontrada" message in Spanish with a link to `/clientes`

- [ ] Task 4 — Unit and component tests (AC: #1–#6)
  - [ ] Test `__root.tsx`: renders `NavigationRail` on desktop viewport, renders `NavigationBar` on mobile viewport
  - [ ] Test navigation links: clicking "Clientes" navigates to `/clientes`, clicking "Contactos" navigates to `/contactos`
  - [ ] Test active state: active nav item matches current route
  - [ ] Test 404 route: unknown route displays "Página no encontrada" with return link
  - [ ] Test root redirect: navigating to `/` redirects to `/clientes`
  - [ ] Run accessibility check (axe) on the navigation shell

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 — check siesa-ui-kit catalog FIRST before any custom component)
- **Install**: Already installed via `pnpm add siesa-ui-kit` in Story 1.1
- **Navigation components**: Use `NavigationRail` (desktop) and `NavigationBar` (mobile) from `siesa-ui-kit`
- **Constraint**: Do NOT create custom navigation components. siesa-ui-kit provides both.
- **Icons**: Heroicons (primary icon library per company standards) — use `@heroicons/react`

### Routing Architecture (TanStack Router — File-Based)

The routes must match the architecture defined in `architecture.md`:

```
src/routes/
├── __root.tsx                   # Root layout — contains NavigationRail/NavigationBar + Outlet
├── index.tsx                    # Redirect → /clientes
├── _app.tsx                     # Pathless layout route (app shell wrapper)
├── _app/
│   ├── clientes.tsx             # /clientes — placeholder (full implementation in Epic 2)
│   └── contactos.tsx            # /contactos — placeholder (full implementation in Epic 3)
└── 404.tsx                      # catch-all for unknown routes
```

**TanStack Router prefix rules (CRITICAL):**
- `_` prefix = pathless layout (no URL segment added). `_app.tsx` wraps child routes without adding `/app` to the URL.
- `__root.tsx` = root route (double underscore), parent of ALL routes.
- File `_app/clientes.tsx` → URL `/clientes` (not `/app/clientes`)

**TanStack Router file-based configuration in `vite.config.ts`** (already set up in Story 1.1):
```typescript
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
// Plugin auto-generates routeTree.gen.ts — never edit manually
```

### `__root.tsx` Implementation Pattern

```typescript
import { createRootRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

const navItems = [
  { label: 'Clientes', to: '/clientes', icon: <UsersIcon className="w-6 h-6" /> },
  { label: 'Contactos', to: '/contactos', icon: <UserIcon className="w-6 h-6" /> },
]

function RootComponent() {
  const location = useRouterState({ select: (s) => s.location })
  const activeItem = navItems.find(item => location.pathname.startsWith(item.to))

  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail on the left */}
      <div className="hidden lg:flex">
        <NavigationRail items={navItems} activeItem={activeItem} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile: NavigationBar at the bottom */}
      <div className="flex lg:hidden fixed bottom-0 w-full">
        <NavigationBar items={navItems} activeItem={activeItem} />
      </div>
    </div>
  )
}

export const Route = createRootRoute({ component: RootComponent })
```

> NOTE: Adapt `NavigationRail` and `NavigationBar` API to the actual siesa-ui-kit component interface. Verify props by checking the siesa-ui-kit catalog/documentation before implementation.

### Root Index Redirect Pattern

```typescript
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => { throw redirect({ to: '/clientes' }) },
})
```

### 404 / Not-Found Route Pattern

```typescript
// src/routes/404.tsx  OR  src/routes/$.tsx  (catch-all)
import { createFileRoute, Link } from '@tanstack/react-router'

function NotFoundComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link to="/clientes" className="text-blue-600 hover:underline">
        Volver a Clientes
      </Link>
    </div>
  )
}

export const Route = createFileRoute('/404')({ component: NotFoundComponent })
// OR for TanStack Router catch-all: createFileRoute('/$')({ notFoundComponent: NotFoundComponent })
```

> TanStack Router v1 uses `router.options.notFoundComponent` or the `$` catch-all route. Check docs for the project's installed version.

### Placeholder Route Pattern (clientes.tsx / contactos.tsx)

```typescript
// src/routes/_app/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'

function ClientesPlaceholder() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-700">Clientes</h2>
      <p className="text-slate-400 mt-2">Implementación disponible en la próxima historia.</p>
    </div>
  )
}

export const Route = createFileRoute('/_app/clientes')({ component: ClientesPlaceholder })
```

### Responsive Breakpoint

- Desktop / NavigationRail: `>= 1024px` (`lg:` in Tailwind v4)
- Mobile / NavigationBar: `< 1024px`
- This is aligned with the UX spec breakpoint (`lg: 1024px`) from `architecture.md`

### All UI text MUST be in Spanish

- "Clientes", "Contactos" (navigation labels)
- "Página no encontrada", "La ruta que buscas no existe.", "Volver a Clientes" (404 page)
- ARIA labels: `aria-label="Navegación principal"`, `aria-current="page"` on active item

### WCAG 2.1 AA Compliance

- Navigation landmarks: wrap navigation in `<nav aria-label="Navegación principal">`
- Active route: `aria-current="page"` on the active navigation item
- Focus management: navigation items must be keyboard accessible (Tab + Enter/Space)
- Color contrast: ensure `#0e79fd` (Siesa Blue) meets 4.5:1 against background for text

### Testing

- **Framework**: Vitest + React Testing Library + MSW (setup from Story 1.1)
- **Accessibility**: Use `@axe-core/react` or `jest-axe` for accessibility assertions in component tests
- **Test pattern** (Arrange / Act / Assert):

```typescript
// Example: NavigationRail renders on desktop
it('renders NavigationRail on desktop viewport', () => {
  // Arrange
  Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true })
  window.dispatchEvent(new Event('resize'))

  // Act
  const { getByRole } = render(<MemoryRouter initialEntries={['/clientes']}><RootComponent /></MemoryRouter>)

  // Assert
  expect(getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()
})
```

> Prefer using TanStack Router test utilities or `MemoryRouter` as appropriate for the project setup.

### Project Structure Notes

This story only creates/modifies the following files — it does NOT implement the full Clientes or Contactos modules (those are Epic 2 and Epic 3 respectively):

```
frontend/src/routes/__root.tsx          ← MODIFY (add NavigationRail/NavigationBar layout)
frontend/src/routes/index.tsx           ← MODIFY (add redirect to /clientes)
frontend/src/routes/_app.tsx            ← CREATE (pathless layout route)
frontend/src/routes/_app/clientes.tsx   ← CREATE (placeholder route)
frontend/src/routes/_app/contactos.tsx  ← CREATE (placeholder route)
frontend/src/routes/404.tsx             ← CREATE (not-found route)
frontend/src/routeTree.gen.ts           ← AUTO-GENERATED (do not edit)
```

No backend changes in this story. No domain entities, no API calls, no TanStack Query hooks.

### Learning from Story 1.1

- Package manager is **`pnpm`** (NOT npm/yarn)
- TanStack Router plugin is already configured in `vite.config.ts` — `routeTree.gen.ts` is auto-generated on save
- `siesa-ui-kit` is already installed (`pnpm add siesa-ui-kit` done in Story 1.1)
- `@heroicons/react` may need to be installed: `pnpm add @heroicons/react`
- TailwindCSS v4 uses `@import "tailwindcss"` in `src/index.css` — responsive classes like `lg:flex` work out of the box
- TypeScript strict mode is active — no `any` types, all props must be typed

### References

- Epic source and story AC: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Routing architecture: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Complete project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- TanStack Router prefix rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- siesa-ui-kit P0 mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied]
- Frontend stack: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- UX breakpoint and responsive layout: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]
- Story 1.1 learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
