# Story 1.2: Frontend Navigation Shell

Status: ready

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser, **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a mobile-responsive NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, **And** all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen, **And** the active navigation item is visually highlighted to reflect the current route (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/unknown`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a link back to `/clientes`.

5. **Given** the application root `/` is accessed, **When** the page loads, **Then** the browser redirects to `/clientes` automatically.

## Tasks / Subtasks

- [ ] Task 1 — Create shell layout route `_app.tsx` with NavigationRail / NavigationBar (AC: #1, #2, #3)
  - [ ] Create `frontend/src/routes/_app.tsx` as a pathless layout route (TanStack Router `_` prefix — no URL segment added)
  - [ ] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit` for desktop and mobile navigation respectively
  - [ ] Render `NavigationRail` when viewport width >= 1024px (`lg` breakpoint) and `NavigationBar` when < 1024px — use TailwindCSS responsive classes (`hidden lg:flex` / `flex lg:hidden`)
  - [ ] Configure `NavigationRail` items: `{ label: 'Clientes', href: '/clientes', icon: UserGroupIcon }` and `{ label: 'Contactos', href: '/contactos', icon: IdentificationIcon }` (Heroicons)
  - [ ] Configure `NavigationBar` items with the same labels and icons for mobile
  - [ ] Use TanStack Router `<Link>` for navigation items so routing is client-side (no full page reload)
  - [ ] Apply active state to the navigation item matching the current route using `useRouterState` or TanStack Router's `activeProps`
  - [ ] Render `<Outlet />` in the main content area to the right of the rail (desktop) or above the bar (mobile)
  - [ ] Apply layout: `flex flex-row h-screen` container — rail fixed on left (desktop), bar fixed at bottom (mobile)
  - [ ] Ensure `aria-label` on nav elements in Spanish: `aria-label="Navegación principal"` (WCAG 2.1 AA)

- [ ] Task 2 — Create index redirect route (AC: #5)
  - [ ] Create `frontend/src/routes/index.tsx` that redirects to `/clientes` on mount using TanStack Router `redirect`
  - [ ] Use `beforeLoad: () => redirect({ to: '/clientes' })` in the route definition — no component rendering required

- [ ] Task 3 — Create `/clientes` and `/contactos` placeholder routes (AC: #1, #2, #3)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` as a child of `_app` layout — renders a placeholder `<ClientesPage />` component with heading "Clientes"
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` as a child of `_app` layout — renders a placeholder `<ContactosPage />` component with heading "Contactos"
  - [ ] Placeholder components render a `<h1>` with the section name in Spanish and a `data-testid` attribute for test targeting (`data-testid="clientes-page"` / `data-testid="contactos-page"`)
  - [ ] Both routes are nested under the `_app` pathless layout so they inherit the NavigationRail/Bar shell

- [ ] Task 4 — Create 404 not-found route (AC: #4)
  - [ ] Add `notFoundComponent` to the root route in `frontend/src/routes/__root.tsx` that renders a `<NotFoundView />` component
  - [ ] `NotFoundView` displays: heading "Página no encontrada", description "La ruta que buscas no existe.", and a TanStack Router `<Link to="/clientes">Ir a Clientes</Link>` button
  - [ ] All text in Spanish per company standards

- [ ] Task 5 — Update `__root.tsx` with global providers and layout wrapper (AC: implicit)
  - [ ] Wrap `<Outlet />` in `__root.tsx` with a `<div data-testid="app-root" className="min-h-screen bg-white dark:bg-slate-950">` container
  - [ ] Confirm `TanStackRouterDevtools` is conditionally rendered in development only: `import.meta.env.DEV && <TanStackRouterDevtools />`

- [ ] Task 6 — Write unit and component tests (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/routes/__tests__/AppShell.test.tsx` — test that `_app.tsx` renders NavigationRail on desktop viewport (>= 1024px) and NavigationBar on mobile viewport (< 1024px) using RTL `resizeWindow` / viewport mocking
  - [ ] Test that clicking "Clientes" link sets active state and navigates to `/clientes`
  - [ ] Test that clicking "Contactos" link sets active state and navigates to `/contactos`
  - [ ] Test that navigating to `/unknown` renders the not-found view with the "Ir a Clientes" link
  - [ ] Test that navigating to `/` redirects to `/clientes`
  - [ ] Add accessibility check with `axe` to ensure `aria-label` on nav and WCAG 2.1 AA compliance

## Dev Notes

### Routing Structure

TanStack Router file-based routing. The `_` prefix on `_app.tsx` creates a **pathless layout route** — it wraps child routes without adding a URL segment. The resulting route tree:

```
__root.tsx           → / (root layout, wraps all)
  _app.tsx           → pathless shell (NavigationRail + Outlet)
    _app/clientes.tsx  → /clientes
    _app/contactos.tsx → /contactos
  index.tsx          → / (redirect to /clientes)
```

The `_app/` folder must be created at `frontend/src/routes/_app/` to hold the nested child route files.

### siesa-ui-kit NavigationRail and NavigationBar

Per company standards, **siesa-ui-kit is the P0 mandatory component source**. Check the siesa-ui-kit catalog for `NavigationRail` and `NavigationBar` before any custom implementation.

Expected import pattern (verify exact API against installed version `siesa-ui-kit@^1.0.209`):

```typescript
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
```

If `NavigationRail` or `NavigationBar` are not available in the installed version, fall back to a custom implementation using shadcn/ui `nav` + TailwindCSS, matching the siesa-ui-kit visual style (Siesa Blue `#0e79fd`, Inter font, slate neutrals).

### Responsive Breakpoint

Critical breakpoint per UX spec and architecture.md: `lg` = 1024px.

```tsx
{/* Desktop: NavigationRail on left */}
<aside className="hidden lg:flex ...">
  <NavigationRail items={navItems} />
</aside>

{/* Mobile: NavigationBar at bottom */}
<nav className="flex lg:hidden fixed bottom-0 w-full ...">
  <NavigationBar items={navItems} />
</nav>

{/* Content */}
<main className="flex-1 overflow-auto">
  <Outlet />
</main>
```

### Active Navigation State

TanStack Router provides `activeProps` on `<Link>` to apply active classes automatically:

```typescript
import { Link, useRouterState } from '@tanstack/react-router'

// Option A — via activeProps on Link (preferred)
<Link to="/clientes" activeProps={{ className: 'nav-item--active' }}>
  Clientes
</Link>

// Option B — via useRouterState for custom logic
const { location } = useRouterState()
const isActive = location.pathname.startsWith('/clientes')
```

### Icons

Per company standards: **Heroicons** (primary). Use `@heroicons/react/24/outline` or `@heroicons/react/24/solid` variants. Heroicons is not yet listed in `package.json` — install via:

```bash
pnpm add @heroicons/react
```

Suggested icons:
- Clientes: `UserGroupIcon` (24/outline)
- Contactos: `IdentificationIcon` (24/outline)

If `@heroicons/react` is unavailable, use `lucide-react` (already installed) equivalents: `Users` / `Contact`.

### Not-Found Route Pattern

TanStack Router handles 404s via the `notFoundComponent` prop on the root route:

```typescript
// __root.tsx
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})
```

### Accessibility Requirements

- `<nav aria-label="Navegación principal">` on the navigation container
- Navigation links must have visible focus indicators (TailwindCSS `focus-visible:ring-2 focus-visible:ring-blue-500`)
- Active navigation item must convey state via `aria-current="page"` in addition to visual styling
- Touch targets on mobile must be >= 44x44px (WCAG 2.1 AA)
- Color contrast: active item uses Siesa Blue `#0e79fd` — verify contrast ratio >= 4.5:1 against background

### Brand / Design Tokens

Per company standards (`company-standards.md`):
- Primary: `#0e79fd` (Siesa Blue) — active nav item, focus rings
- Tertiary: `#154ca9` (Deep Blue) — hover state
- Neutrals: `slate-*` Tailwind scale — inactive items, backgrounds
- Font: Inter (loaded via index.css or Tailwind config)
- Dark mode: class-based (`dark:` prefix)

### Files to Create

```
frontend/src/routes/_app.tsx                       ← Shell layout (NavigationRail + NavigationBar)
frontend/src/routes/_app/clientes.tsx              ← /clientes placeholder
frontend/src/routes/_app/contactos.tsx             ← /contactos placeholder
frontend/src/routes/index.tsx                      ← Redirect / → /clientes
frontend/src/routes/__tests__/AppShell.test.tsx    ← Component tests
```

### Files to Modify

```
frontend/src/routes/__root.tsx                     ← Add notFoundComponent + data-testid wrapper
```

### References

- Routing file structure and TanStack Router prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- Route file layout (architecture.md): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Responsive breakpoint and layout design: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Platform Strategy]
- FR28, FR29, FR30 navigation requirements: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Heroicons primary icon library: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Icons]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied]
- Accessibility WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
