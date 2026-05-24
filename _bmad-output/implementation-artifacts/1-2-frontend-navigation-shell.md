# Story 1.2: Frontend Navigation Shell

Status: review

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a mobile-responsive NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, and all navigation items are accessible and tappable with adequate touch target size (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered and the corresponding navigation item is highlighted as active — no redirection to a home screen occurs (FR30).

4. **Given** the user navigates to any unknown or unmatched route (e.g., `/unknown-path`), **When** the page loads, **Then** a 404 not-found view is displayed with a clear Spanish-language message and a link to return to `/clientes`.

5. **Given** the NavigationRail or NavigationBar is rendered, **When** a screen reader or keyboard user navigates the component, **Then** navigation landmarks and ARIA labels are present and the active route item has `aria-current="page"` (WCAG 2.1 AA).

## Tasks / Subtasks

- [x] Task 1 — Create the application shell layout route (AC: #1, #2)
  - [x] Create `frontend/src/routes/_app.tsx` as a TanStack Router pathless layout route (prefix `_` = no URL segment added)
  - [x] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit` — verify both components exist in the catalog before any custom implementation
  - [x] Implement responsive logic: render `NavigationRail` when `window.innerWidth >= 1024` (lg breakpoint), render `NavigationBar` below that — use a `useBreakpoint` hook or TailwindCSS `hidden`/`block` utility classes with `lg:` prefix
  - [x] Set `NavigationRail` and `NavigationBar` items to `[{ label: 'Clientes', path: '/clientes' }, { label: 'Contactos', path: '/contactos' }]`
  - [x] Use `useRouter` or `useMatch` from `@tanstack/react-router` to determine the active route and pass the active item to the navigation components
  - [x] Wrap the `<Outlet />` in a `<main>` element with flex-1 so it fills the remaining horizontal space on desktop
  - [x] Ensure the overall layout is `flex flex-col min-h-screen` on mobile and `flex flex-row min-h-screen` on desktop

- [x] Task 2 — Configure TanStack Router routes for `/clientes` and `/contactos` (AC: #3)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — placeholder view with `<h1>Clientes</h1>` (Spanish) visible so deep linking is testable; will be replaced in Epic 2
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — placeholder view with `<h1>Contactos</h1>` (Spanish) visible so deep linking is testable; will be replaced in Epic 3
  - [x] Update `frontend/src/routes/index.tsx` to redirect to `/clientes` using `<Navigate to="/clientes" />` or TanStack Router's `redirect` in `beforeLoad`
  - [x] Verify TanStack Router plugin auto-generates the updated `routeTree.gen.ts` including `_app`, `_app/clientes`, and `_app/contactos`

- [x] Task 3 — Create 404 not-found route (AC: #4)
  - [x] Create `frontend/src/routes/404.tsx` (or use TanStack Router's `notFoundComponent` on `__root.tsx`) rendering a Spanish-language message: "Página no encontrada" with a link `← Ir a Clientes` pointing to `/clientes`
  - [x] Register the not-found handler in `frontend/src/routes/__root.tsx` via `notFoundComponent` prop on the root `createRootRoute`
  - [x] Style the 404 view using TailwindCSS — centered, readable, consistent with app palette (primary `#0e79fd`)

- [x] Task 4 — Accessibility compliance (AC: #5)
  - [x] Verify the `NavigationRail` / `NavigationBar` siesa-ui-kit components expose `aria-label` on the `<nav>` wrapper — if not, wrap them with `<nav aria-label="Navegación principal">`
  - [x] Confirm the active navigation item receives `aria-current="page"` — pass through props or add programmatically via `useRouterState`
  - [x] Ensure all icon-only navigation items have accessible text (visually hidden `<span className="sr-only">`) if siesa-ui-kit does not handle this internally
  - [x] Run manual keyboard navigation check: Tab moves focus through nav items, Enter activates navigation, focus outline is visible (no `outline: none` without replacement)

- [x] Task 5 — Component tests (AC: #1–#5)
  - [x] Create `frontend/src/routes/__tests__/AppShell.test.tsx` using Vitest + RTL + MemoryRouter wrapper from `@tanstack/react-router`
  - [x] Test: NavigationRail renders on desktop viewport (mock `window.innerWidth = 1280`)
  - [x] Test: NavigationBar renders on mobile viewport (mock `window.innerWidth = 375`)
  - [x] Test: clicking "Clientes" nav item navigates to `/clientes`
  - [x] Test: clicking "Contactos" nav item navigates to `/contactos`
  - [x] Test: active nav item has `aria-current="page"` when on the matching route
  - [x] Test: navigating to `/unknown` renders the 404 not-found view with "Página no encontrada"
  - [x] Run `pnpm run test` and confirm all new tests pass with zero failures

## Dev Notes

### Navigation Component Priority

Per company standards: check siesa-ui-kit catalog FIRST before any custom implementation.

```typescript
// Try this import first — verify in the installed siesa-ui-kit package
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
```

If `NavigationRail` or `NavigationBar` do not exist in siesa-ui-kit, fall back to shadcn/ui equivalents. If shadcn does not have them, implement a minimal custom component using TailwindCSS. Document the fallback decision in the Completion Notes.

### TanStack Router File-Based Routing Conventions

```
src/routes/
  __root.tsx          ← Root layout (already created in Story 1.1)
  index.tsx           ← Redirect to /clientes
  _app.tsx            ← Pathless layout: NavigationRail + NavigationBar shell
  _app/
    clientes.tsx      ← Route: /clientes
    contactos.tsx     ← Route: /contactos
  404.tsx             ← Registered via notFoundComponent on __root
```

The `_` prefix on `_app.tsx` means no URL segment is added — the children routes are `/clientes` and `/contactos` directly, not `/_app/clientes`.

### Responsive Breakpoint

Critical breakpoint per architecture.md: `lg: 1024px`.

```tsx
// Option A — TailwindCSS classes (preferred, no JS)
<div className="hidden lg:flex">  {/* NavigationRail — desktop only */}
  <NavigationRail ... />
</div>
<div className="flex lg:hidden">  {/* NavigationBar — mobile only */}
  <NavigationBar ... />
</div>

// Option B — useBreakpoint hook (use only if siesa-ui-kit requires JS control)
const isDesktop = useMediaQuery('(min-width: 1024px)')
```

### Active Route Detection

```typescript
import { useRouterState } from '@tanstack/react-router'

function AppShell() {
  const { location } = useRouterState()
  const activeItem = location.pathname.startsWith('/clientes')
    ? 'clientes'
    : location.pathname.startsWith('/contactos')
      ? 'contactos'
      : null
  // Pass activeItem to NavigationRail / NavigationBar
}
```

### 404 Not-Found Handler in TanStack Router

```typescript
// frontend/src/routes/__root.tsx
import { createRootRoute, Outlet, notFound } from '@tanstack/react-router'
import NotFoundView from '../shared/components/NotFoundView'

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => <NotFoundView />,
})
```

```tsx
// frontend/src/shared/components/NotFoundView.tsx
import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link to="/clientes" className="text-[#0e79fd] hover:underline">
        ← Ir a Clientes
      </Link>
    </div>
  )
}
```

### Layout Structure

```tsx
// frontend/src/routes/_app.tsx
import { Outlet } from '@tanstack/react-router'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* NavigationRail — desktop left sidebar */}
      <nav aria-label="Navegación principal" className="hidden lg:flex">
        <NavigationRail items={navItems} activeItem={activeItem} />
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* NavigationBar — mobile bottom bar */}
      <nav aria-label="Navegación principal" className="lg:hidden fixed bottom-0 w-full">
        <NavigationBar items={navItems} activeItem={activeItem} />
      </nav>
    </div>
  )
}
```

### Navigation Items — Spanish Labels

All user-facing text MUST be in Spanish (mandatory company standard):

```typescript
const navItems = [
  { key: 'clientes',  label: 'Clientes',  path: '/clientes'  },
  { key: 'contactos', label: 'Contactos', path: '/contactos' },
]
```

### Placeholder Route Views

Story 1.2 creates placeholder views. The real implementations are:
- `/clientes` full view: Epic 2 (Story 2.1+)
- `/contactos` full view: Epic 3 (Story 3.1+)

Placeholders must be minimal — a heading is sufficient. Do NOT build list/detail content here.

### Testing Pattern

```typescript
// frontend/src/routes/__tests__/AppShell.test.tsx
import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

function renderWithRouter(initialPath: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return render(<RouterProvider router={router} />)
}

test('renders Clientes heading at /clientes', async () => {
  renderWithRouter('/clientes')
  expect(await screen.findByRole('heading', { name: /clientes/i })).toBeInTheDocument()
})
```

### Files to Create in This Story

```
frontend/src/routes/_app.tsx                          ← App shell layout (NavigationRail + NavigationBar)
frontend/src/routes/_app/clientes.tsx                 ← /clientes placeholder view
frontend/src/routes/_app/contactos.tsx                ← /contactos placeholder view
frontend/src/shared/components/NotFoundView.tsx       ← 404 component
frontend/src/routes/__tests__/AppShell.test.tsx       ← RTL component tests
```

**Modified files:**
```
frontend/src/routes/__root.tsx     ← Add notFoundComponent
frontend/src/routes/index.tsx      ← Update redirect to /clientes
frontend/src/routeTree.gen.ts      ← Auto-regenerated by TanStack Router plugin
```

### References

- Navigation components (siesa-ui-kit + shadcn fallback): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Responsive breakpoint (lg: 1024px): [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns]
- TanStack Router file-based prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Route structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- FR28 (no page reloads), FR29 (mobile), FR30 (deep linking): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Navigation & Access]
- WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- UX responsive strategy: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Platform Strategy]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `router.load()` is required before rendering `RouterProvider` in tests for `useNavigate()` to work correctly with TanStack Router v1.
- NavigationRailItem and NavigationBar buttons both render as `<button>` with `aria-label`. NavigationRailItem buttons have `data-item-id` attribute; NavigationBar buttons do not — use this to distinguish in tests.
- siesa-ui-kit CSS import must use `siesa-ui-kit/styles.css` (package.json exports), not `siesa-ui-kit/dist/style.css`.

### Completion Notes List

- Both `NavigationRail` and `NavigationBar` exist in siesa-ui-kit v1.0.203 — no fallback required.
- Responsive visibility uses TailwindCSS utility classes (`hidden lg:flex` / `lg:hidden`) — no JS breakpoint detection needed.
- `NavigationRail` uses `state="collapsed"` for icon-only left sidebar. The `onItemClick` prop receives the full item object from `af` component.
- `NavigationBar` uses `activeItemId` prop for active state — `aria-current="page"` is handled internally by siesa-ui-kit.
- `<nav aria-label="Navegación principal">` wraps both components to satisfy WCAG 2.1 AA landmark requirements.
- Route files in `src/routes/` use `/* eslint-disable react-refresh/only-export-components */` because TanStack Router requires exporting both the component function and the `Route` constant from the same file.
- Test files in `src/routes/__tests__/` are prefixed with `-` (e.g., `-AppShell.test.tsx`) per TanStack Router's `routeFileIgnorePrefix` convention to prevent them from being treated as route files.

### File List

**Created:**
- `frontend/src/routes/_app.tsx` — AppShell pathless layout with NavigationRail (desktop) and NavigationBar (mobile)
- `frontend/src/routes/_app/clientes.tsx` — `/clientes` placeholder route view
- `frontend/src/routes/_app/contactos.tsx` — `/contactos` placeholder route view
- `frontend/src/shared/components/NotFoundView.tsx` — 404 not-found component with Spanish message
- `frontend/src/routes/__tests__/-AppShell.test.tsx` — 9 RTL component tests covering all 5 ACs

**Modified:**
- `frontend/src/routes/__root.tsx` — Added `notFoundComponent: () => <NotFoundView />`
- `frontend/src/routes/index.tsx` — Updated to redirect to `/clientes` via `beforeLoad`
- `frontend/src/main.tsx` — Added `import 'siesa-ui-kit/styles.css'`
- `frontend/src/routeTree.gen.ts` — Auto-regenerated by TanStack Router plugin (includes `/_app`, `/clientes`, `/contactos`)
