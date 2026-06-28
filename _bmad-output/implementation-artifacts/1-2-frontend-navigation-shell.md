# Story 1.2: Frontend Navigation Shell

Status: ready

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

- [ ] Task 1 — Configure TanStack Router routes for the application shell (AC: #3, #4, #5)
  - [ ] Create `src/routes/__root.tsx` — root layout that wraps all routes with `LayoutBase` (siesa-ui-kit) including `NavigationRail` (desktop) and `NavigationBar` (mobile)
  - [ ] Create `src/routes/index.tsx` — redirects to `/clientes` using TanStack Router `redirect`
  - [ ] Create `src/routes/_app.tsx` — pathless layout route (`_` prefix) for the authenticated/app shell
  - [ ] Create `src/routes/_app/clientes.tsx` — `/clientes` route rendering `ClientesPlaceholder` (stub view)
  - [ ] Create `src/routes/_app/contactos.tsx` — `/contactos` route rendering `ContactosPlaceholder` (stub view)
  - [ ] Create `src/routes/$404.tsx` (or configure `notFoundComponent`) — not-found view displayed gracefully
  - [ ] Run `pnpm run dev` to trigger `routeTree.gen.ts` regeneration via `@tanstack/router-plugin`

- [ ] Task 2 — Implement `LayoutBase` shell with responsive navigation (AC: #1, #2)
  - [ ] Check siesa-ui-kit catalog for `LayoutBase`, `NavigationRail`, `NavigationBar`, and `Navbar` components
  - [ ] Update `src/routes/__root.tsx` to render `LayoutBase` with `Navbar` (top bar 64px), `NavigationRail` (collapsed icon-only 72px, desktop), and `NavigationBar` (mobile bottom bar)
  - [ ] Configure `navigationItems` prop with two entries: `{ label: 'Clientes', href: '/clientes', icon: UsersIcon }` and `{ label: 'Contactos', href: '/contactos', icon: UserIcon }` (Heroicons)
  - [ ] Configure `Navbar` with `productName="Siesa Agents"` and default props
  - [ ] Implement responsive breakpoint: `NavigationRail` visible at `lg` (1024px+), `NavigationBar` visible below `lg` using TailwindCSS responsive utilities
  - [ ] Add `<Outlet />` inside the content area to render child routes

- [ ] Task 3 — Create stub views for Clientes and Contactos (AC: #1, #2, #3)
  - [ ] Create `src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx` — minimal placeholder component rendering `<h1>Clientes</h1>` with Spanish text "Sección Clientes"
  - [ ] Create `src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx` — minimal placeholder component rendering `<h1>Contactos</h1>` with Spanish text "Sección Contactos"
  - [ ] Both stubs use TypeScript strict mode (no `any` types)

- [ ] Task 4 — Create NotFound component (AC: #4)
  - [ ] Create `src/shared/components/NotFound.tsx` — 404 view with Spanish text "Página no encontrada" and a link back to `/clientes`
  - [ ] Register `NotFound` as the `notFoundComponent` in the root route or configure `$404` route

- [ ] Task 5 — Write component tests (AC: #1, #2, #3, #4, #5)
  - [ ] `src/routes/__root.test.tsx` — assert `NavigationRail` renders with "Clientes" and "Contactos" at 1280px viewport (TC-E1-P2-01)
  - [ ] `src/routes/__root.test.tsx` — assert `NavigationBar` renders and `NavigationRail` is hidden at 375px viewport (TC-E1-P2-02)
  - [ ] `src/routes/__root.test.tsx` — assert index `/` redirects to `/clientes` (TC-E1-P2-03)
  - [ ] `src/routes/__root.test.tsx` — assert unknown route renders `NotFound` component without dismounting shell (TC-E1-P1-04)
  - [ ] `src/routes/__root.test.tsx` — assert clicking "Clientes" nav item navigates to `/clientes` without `window.location.reload` (TC-E1-P1-01)
  - [ ] `src/routes/__root.test.tsx` — assert clicking "Contactos" nav item navigates to `/contactos` without full page reload (TC-E1-P1-01)

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

### Routing Implementation

**`src/routes/__root.tsx` — root layout:**
```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'
// Import LayoutBase, Navbar, NavigationRail from siesa-ui-kit
// navigationItems: [{ label: 'Clientes', href: '/clientes', icon: ... }, { label: 'Contactos', href: '/contactos', icon: ... }]

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})
```

**`src/routes/index.tsx` — root redirect:**
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

**`src/routes/_app.tsx` — pathless layout:**
```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: () => <Outlet />,
})
```

**`src/routes/_app/clientes.tsx`:**
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { ClientesPlaceholder } from '../../modules/crm/clientes/presentation/ClientesPlaceholder'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholder,
})
```

### Responsive Navigation Pattern

Use TailwindCSS v4 responsive utilities to toggle between `NavigationRail` (desktop) and `NavigationBar` (mobile):

```tsx
{/* Desktop only */}
<div className="hidden lg:block">
  <NavigationRail items={navigationItems} />
</div>
{/* Mobile only */}
<div className="lg:hidden">
  <NavigationBar items={navigationItems} />
</div>
```

Breakpoint: `lg` = 1024px (company standard critical breakpoint per architecture.md cross-cutting concerns).

### Navigation Items

Both `NavigationRail` and `NavigationBar` receive `navigationItems` with the following entries:

```typescript
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

const navigationItems = [
  {
    label: 'Clientes',        // Spanish — mandatory per company standards
    href: '/clientes',
    icon: UsersIcon,           // Heroicons — primary icon library
  },
  {
    label: 'Contactos',       // Spanish — mandatory per company standards
    href: '/contactos',
    icon: UserIcon,
  },
]
```

### NotFound Component

```typescript
// src/shared/components/NotFound.tsx
import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta solicitada no existe.</p>
      <Link to="/clientes" className="text-primary-600 hover:underline">
        Ir a Clientes
      </Link>
    </div>
  )
}
```

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

## References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- UX design — Direction F (shell structure): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Architecture routing spec: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Test cases TC-E1-P1-01 to TC-E1-P1-04, TC-E1-P2-01 to TC-E1-P2-03: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md]
- Preceding story (structure scaffold): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- Company standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
