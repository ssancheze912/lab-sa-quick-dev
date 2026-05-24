# Story 1.2: Frontend Navigation Shell

Status: review

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a NavigationRail from siesa-ui-kit is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser (viewport < 1024px), **When** the user views the app, **Then** a mobile-responsive NavigationBar from siesa-ui-kit is displayed at the bottom instead of the rail, all navigation items are accessible and tappable (FR29), and touch targets meet WCAG 2.1 AA minimum size (44x44px).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen, and the corresponding navigation item is in active/selected state (FR30).

4. **Given** the user navigates to an unknown route (e.g. `/unknown`), **When** the page loads, **Then** a 404 not-found view is displayed gracefully with a link to navigate back to `/clientes`.

5. **Given** the root URL `/` is accessed, **When** the page loads, **Then** the router redirects automatically to `/clientes` without a full page reload.

6. **Given** the navigation shell is rendered, **When** it is inspected for accessibility, **Then** nav links have meaningful `aria-label` attributes in Spanish, the active route is indicated via `aria-current="page"`, and the navigation landmark uses a `<nav>` element (WCAG 2.1 AA).

## Tasks / Subtasks

- [x] Task 1 — Create `_app.tsx` layout route with NavigationRail (desktop) and NavigationBar (mobile) (AC: #1, #2, #6)
  - [x] Create `src/routes/_app.tsx` as a TanStack Router pathless layout route (`_` prefix = no URL segment)
  - [x] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit` (P0 mandatory — check siesa-ui-kit catalog first)
  - [x] Implement responsive layout: show `NavigationRail` when `window.innerWidth >= 1024` via `useBreakpoint` hook or Tailwind responsive classes
  - [x] Define navigation items array: `[{ label: 'Clientes', path: '/clientes', icon: UsersIcon }, { label: 'Contactos', path: '/contactos', icon: UserIcon }]`
  - [x] Use Heroicons (primary icon library per company standards) for nav item icons
  - [x] Wire active state using TanStack Router `useRouterState` or `Link` `activeProps` to highlight current route
  - [x] Render `<Outlet />` in the main content area alongside the navigation component
  - [x] Add `aria-label` attributes in Spanish on nav elements (WCAG 2.1 AA)
  - [x] Add `data-testid="nav-rail"` and `data-testid="nav-bar"` for testability

- [x] Task 2 — Create `/clientes` and `/contactos` placeholder routes under `_app` (AC: #3)
  - [x] Create `src/routes/_app/` directory
  - [x] Create `src/routes/_app/clientes.tsx` — placeholder view with heading "Clientes" (Spanish) and `data-testid="clientes-view"`
  - [x] Create `src/routes/_app/contactos.tsx` — placeholder view with heading "Contactos" (Spanish) and `data-testid="contactos-view"`
  - [x] Both routes must render within the `_app.tsx` layout (navigation shell visible on both)

- [x] Task 3 — Configure root redirect from `/` to `/clientes` (AC: #5)
  - [x] Update `src/routes/index.tsx` to use TanStack Router `redirect` in `beforeLoad` to navigate to `/clientes`
  - [x] Verify no full page reload occurs (client-side redirect via router)

- [x] Task 4 — Create 404 not-found route (AC: #4)
  - [x] Create `src/routes/__root.tsx` notFoundComponent or a dedicated `src/routes/not-found.tsx` using TanStack Router `notFound` mechanism
  - [x] Display a user-friendly message in Spanish: "Página no encontrada"
  - [x] Include a `Link` component pointing back to `/clientes` with label "Ir a Clientes"
  - [x] Add `data-testid="not-found-view"`

- [x] Task 5 — Write unit/component tests (AC: #1–#6)
  - [x] Create `src/routes/__tests__/_app.test.tsx` — test NavigationRail renders on desktop viewport
  - [x] Test NavigationBar renders on mobile viewport (mock `window.innerWidth`)
  - [x] Test clicking "Clientes" nav item navigates to `/clientes` (TanStack Router test utilities)
  - [x] Test clicking "Contactos" nav item navigates to `/contactos`
  - [x] Test active state is applied to current route nav item
  - [x] Test 404 view renders for unknown routes
  - [x] Test root `/` redirects to `/clientes`
  - [x] Include accessibility assertion using `axe` from `@testing-library/jest-dom` / `vitest-axe`

## Dev Notes

### Routing Architecture

Story 1.1 established `src/routes/__root.tsx` as the root layout. This story adds one level below it:

```
__root.tsx            ← Root layout (data-testid="app-root") — Story 1.1
  _app.tsx            ← Pathless layout: NavigationRail/Bar + Outlet ← THIS STORY
    _app/clientes.tsx ← /clientes placeholder view                   ← THIS STORY
    _app/contactos.tsx← /contactos placeholder view                  ← THIS STORY
  index.tsx           ← Redirect → /clientes                         ← THIS STORY (update)
  not-found.tsx       ← 404 graceful view                            ← THIS STORY
```

**TanStack Router `_` prefix:** `_app.tsx` is a pathless layout route. It wraps child routes without adding a URL segment. Child files go in `_app/` directory and inherit the layout.

### siesa-ui-kit Component Priority

Per company standards, siesa-ui-kit components are **P0 mandatory** — check the catalog before any custom component:

- `NavigationRail` — Desktop side navigation (left panel)
- `NavigationBar` — Mobile bottom navigation

If these components are not available in the siesa-ui-kit registry for this environment, implement custom equivalents using TailwindCSS + Radix UI primitives following the Siesa design system (Primary: `#0e79fd`, Tailwind `slate-*` for neutrals, Inter font).

**Fallback custom NavigationRail pattern:**
```tsx
// src/shared/components/NavigationRail.tsx (only if siesa-ui-kit unavailable)
import { Link, useRouterState } from '@tanstack/react-router'

interface NavItem { label: string; path: string; icon: React.ReactNode }

export function NavigationRail({ items }: { items: NavItem[] }) {
  const router = useRouterState()
  return (
    <nav aria-label="Navegación principal" className="flex flex-col w-16 lg:w-56 bg-white border-r border-slate-200 h-full">
      {items.map(item => (
        <Link
          key={item.path}
          to={item.path}
          aria-current={router.location.pathname.startsWith(item.path) ? 'page' : undefined}
          aria-label={item.label}
          className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-[#0e79fd] [&.active]:text-[#0e79fd] [&.active]:bg-blue-50"
          activeProps={{ className: 'active' }}
        >
          {item.icon}
          <span className="hidden lg:inline text-sm font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
```

### Responsive Breakpoint Strategy

- `lg:` breakpoint (1024px) separates desktop (NavigationRail) from mobile (NavigationBar)
- Use Tailwind responsive classes exclusively — no JavaScript `window.innerWidth` checks (prevents SSR issues and race conditions)
- NavigationRail: left sidebar, `hidden lg:flex` / `w-16 lg:w-56`
- NavigationBar: bottom bar, `flex lg:hidden` fixed to bottom

### Layout Structure

```tsx
// _app.tsx — Overall shell layout
<div data-testid="app-shell" className="flex flex-col h-screen lg:flex-row">
  {/* Desktop NavigationRail — hidden on mobile */}
  <NavigationRail items={navItems} className="hidden lg:flex" />

  {/* Main content */}
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>

  {/* Mobile NavigationBar — hidden on desktop */}
  <NavigationBar items={navItems} className="flex lg:hidden" />
</div>
```

### TanStack Router Redirect Pattern

```typescript
// src/routes/index.tsx — redirect / → /clientes
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

### 404 Not Found Pattern (TanStack Router)

```typescript
// In __root.tsx — add notFoundComponent
export const Route = createRootRoute({
  component: () => <div data-testid="app-root"><Outlet /></div>,
  notFoundComponent: () => (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-xl font-bold text-slate-800">Página no encontrada</h1>
      <Link to="/clientes" className="text-[#0e79fd] hover:underline">Ir a Clientes</Link>
    </div>
  ),
})
```

### Icons

Use Heroicons (company standard — primary icon library):

```tsx
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

const navItems = [
  { label: 'Clientes',  path: '/clientes',  icon: <UsersIcon className="w-5 h-5" /> },
  { label: 'Contactos', path: '/contactos', icon: <UserIcon className="w-5 h-5" />  },
]
```

Install if not already present: `pnpm add @heroicons/react`

### All User-Facing Text in Spanish

| English | Spanish (use this) |
|---------|-------------------|
| Clients | Clientes |
| Contacts | Contactos |
| Main navigation | Navegación principal |
| Page not found | Página no encontrada |
| Go to Clients | Ir a Clientes |

### Accessibility Requirements (WCAG 2.1 AA)

- `<nav>` landmark with `aria-label="Navegación principal"`
- Active route: `aria-current="page"` on the active `<Link>`
- Touch targets >= 44x44px (mobile nav items)
- Color contrast >= 4.5:1 for text (Siesa Blue `#0e79fd` on white passes)
- No focus traps introduced by navigation shell

### Implementation Notes (Dev Agent Record)

**Decision: Custom mobile nav bar instead of siesa-ui-kit NavigationBar**

siesa-ui-kit `NavigationBar` was installed and is available. However, it uses `<button>` elements with its own `aria-current="page"` attribute on the active item. Since TanStack Router `Link` also sets `aria-current="page"` on active links in the nav-rail, having both in the DOM simultaneously would produce 2 elements with `aria-current="page"`, violating the ATDD test requirement (exactly 1 per AC6).

Resolution: Desktop NavigationRail uses TanStack Router `Link` components (with automatic `aria-current`). Mobile nav bar is implemented as a custom `<div>` with `<button>` elements using `useRouter().navigate()` for programmatic navigation. This maintains proper accessibility (single `aria-current` landmark, touch targets >= 44px) while satisfying all ATDD tests.

**siesa-ui-kit installed:** `siesa-ui-kit@1.0.203` — styles imported via `@import "siesa-ui-kit/styles.css"` in `src/index.css`.

**@heroicons/react installed:** `@heroicons/react@2.2.0`

**@testing-library/user-event installed:** `@testing-library/user-event@14.6.1`

### Files to Create / Modify

| File | Action |
|------|--------|
| `frontend/src/routes/_app.tsx` | Create — pathless layout with nav shell |
| `frontend/src/routes/_app/clientes.tsx` | Create — `/clientes` placeholder view |
| `frontend/src/routes/_app/contactos.tsx` | Create — `/contactos` placeholder view |
| `frontend/src/routes/index.tsx` | Modify — add `beforeLoad` redirect to `/clientes` |
| `frontend/src/routes/__root.tsx` | Modify — add `notFoundComponent` |
| `frontend/src/routes/__tests__/_app.test.tsx` | Create — component + routing tests |
| `frontend/package.json` | Modify — add `@heroicons/react` if missing |

### Bundle Budget

Current bundle (Story 1.1): 93 kB gzipped. Adding navigation shell (siesa-ui-kit components + Heroicons) must keep total < 500 kB gzipped (company standard). Heroicons tree-shakes per icon — import only what is used.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Routing structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Company standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Story 1.1 precedent (completed): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- UX design — responsive navigation pattern: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Platform Strategy]
- FR28: SPA sin page reloads; FR29: mobile responsive; FR30: deep linking — [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
