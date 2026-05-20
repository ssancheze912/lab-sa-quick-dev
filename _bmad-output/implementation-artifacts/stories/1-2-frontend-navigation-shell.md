# Story 1.2: Frontend Navigation Shell

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a `NavigationBar` (siesa-ui-kit) is displayed at the bottom instead of the NavigationRail **And** all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen (FR30).

4. **Given** the user navigates to any unknown route (e.g., `/unknown`, `/abc`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish.

## Tasks / Subtasks

- [x] Task 1 — Define TanStack Router route tree with shell layout (AC: 1, 2, 3)
  - [x] Create `frontend/src/routes/__root.tsx` — root layout wrapping all routes with `<Outlet />`
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout route (shell with NavigationRail/NavigationBar)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — `/clientes` route (placeholder view)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — `/contactos` route (placeholder view)
  - [x] Create `frontend/src/routes/index.tsx` — root index route that redirects to `/clientes`
  - [x] Create `frontend/src/routes/not-found.tsx` — catch-all 404 route (via notFoundComponent in __root.tsx)
  - [x] Verify TanStack Router generates `routeTree.gen.ts` on `npm run dev`

- [x] Task 2 — Implement AppShell layout component with NavigationRail (desktop) (AC: 1)
  - [x] Create `frontend/src/shared/components/AppShell.tsx`
  - [x] Use `NavigationRail` from siesa-ui-kit with items: Clientes, Contactos
  - [x] Wire navigation items to `/clientes` and `/contactos` using TanStack Router `<Link>`
  - [x] Apply active state styling to the current route item using `useRouterState()`
  - [x] Use Heroicons for nav item icons (e.g., `UsersIcon` for Clientes, `UserIcon` for Contactos)
  - [x] Ensure NavigationRail is only rendered when viewport ≥ 1024px (Tailwind `hidden lg:flex`)

- [x] Task 3 — Implement responsive NavigationBar for mobile (AC: 2)
  - [x] Add `NavigationBar` from siesa-ui-kit inside `AppShell.tsx`
  - [x] Wire same navigation items (Clientes, Contactos) with same TanStack Router `<Link>`
  - [x] Show NavigationBar only when viewport < 1024px (Tailwind `flex lg:hidden`)
  - [x] Verify touch targets are ≥ 44px for tappability on 375px viewport

- [x] Task 4 — Implement 404 not-found view (AC: 4)
  - [x] Create `frontend/src/shared/components/NotFoundView.tsx` with Spanish message ("Página no encontrada")
  - [x] Register as catch-all route using TanStack Router `notFoundComponent` or `CatchBoundary`
  - [x] Provide a navigation link back to Clientes ("Ir a Clientes") in the 404 view

- [x] Task 5 — Configure TanStack Query provider and router in `main.tsx` (dependency)
  - [x] Ensure `RouterProvider` is mounted in `frontend/src/main.tsx`
  - [x] Ensure `QueryClientProvider` wraps `RouterProvider`
  - [x] Import from `frontend/src/shared/lib/queryClient.ts` (create if not present in Story 1.1)

- [x] Task 6 — Write unit tests for routing (AC: 1, 2, 3)
  - [x] Create `frontend/src/routes/__tests__/-routing.test.ts`
  - [x] UNIT-F-01: Assert `/clientes` route is registered in the route tree
  - [x] UNIT-F-02: Assert `/contactos` route is registered in the route tree
  - [x] UNIT-F-03: Assert root layout renders `NavigationRail` on desktop viewport

## Dev Notes

### Architecture Context

This story builds the navigation shell on top of Story 1.1's initialized project. All route files go under `frontend/src/routes/` following TanStack Router file-based conventions. No backend changes are needed.

**Depends on:** Story 1.1 (frontend project initialized, Vite + TanStack Router + siesa-ui-kit installed).

**Provides for:** Story 1.3 and all subsequent epics — the AppShell is the persistent frame for all future views.

**Component lookup order (mandatory):**
1. `siesa-ui-kit` — check for `NavigationRail`, `NavigationBar`, `LayoutBase` first
2. `shadcn/ui` — fallback only if not in siesa-ui-kit
3. Custom — only if unavailable in both; requires explicit team alignment

### TanStack Router Route Structure

```
frontend/src/routes/
├── __root.tsx                    # Root layout — QueryClientProvider, Toaster, global wrappers
├── index.tsx                     # Redirect → /clientes (useNavigate or <Navigate>)
├── _app.tsx                      # Pathless layout — AppShell (NavigationRail + NavigationBar)
├── _app/
│   ├── clientes.tsx              # /clientes — placeholder: <ClientesPlaceholderView />
│   └── contactos.tsx             # /contactos — placeholder: <ContactosPlaceholderView />
└── not-found.tsx                 # Catch-all 404 view
```

**TanStack Router prefix rules:**
- `_` prefix = pathless layout route (no URL segment added)
- `$` prefix = dynamic parameter
- `not-found.tsx` registered via `createRootRoute({ notFoundComponent: NotFoundView })`

**Route redirect pattern:**

```typescript
// frontend/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

**Root layout pattern:**

```typescript
// frontend/src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/queryClient'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  ),
  notFoundComponent: NotFoundView,
})
```

**Shell layout pattern:**

```typescript
// frontend/src/routes/_app.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'

export const Route = createFileRoute('/_app')({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
```

### AppShell Component — Responsive Navigation

```typescript
// frontend/src/shared/components/AppShell.tsx
import { Link, useRouterState } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
// Import NavigationRail and NavigationBar from siesa-ui-kit
// Verify exact component names in siesa-ui-kit catalog before using

const navItems = [
  { to: '/clientes', label: 'Clientes', Icon: UsersIcon },
  { to: '/contactos', label: 'Contactos', Icon: UserIcon },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  // NavigationRail: hidden on mobile, visible on desktop
  // NavigationBar: visible on mobile, hidden on desktop
  // Use Tailwind: hidden lg:flex (rail), flex lg:hidden (bar)
}
```

**Breakpoints:**
- Desktop: `lg:` prefix (≥ 1024px) — NavigationRail visible left side (72px collapsed)
- Mobile: below `lg:` (< 1024px) — NavigationBar visible at bottom

**siesa-ui-kit NavigationRail usage (verify props in catalog):**
- The rail should be collapsed (icon-only, 72px) as per Direction F in UX spec
- Active item indicated via `active` or `isActive` prop — use `useMatchRoute()` to determine
- ARIA `aria-label` must be present for accessibility (e.g., `aria-label="Navegación principal"`)

**All user-facing text MUST be in Spanish:**
- Nav items: "Clientes", "Contactos"
- 404 page: "Página no encontrada", "La ruta solicitada no existe.", "Ir a Clientes"
- ARIA labels: "Navegación principal", "Menú de navegación"

### Placeholder Views for Clientes and Contactos

Story 1.2 only creates placeholder views — full implementation is in Epics 2 and 3:

```typescript
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return <div className="p-8"><h1 className="text-2xl font-bold">Clientes</h1></div>
}
```

Same pattern for `contactos.tsx` with "Contactos" heading.

### SPA Navigation — No Full Page Reload (FR28)

TanStack Router handles client-side navigation automatically via `<Link>`. To verify:
- Use Playwright's `page.on('load', ...)` listener in E2E tests — no 'load' event should fire during in-app navigation between `/clientes` and `/contactos`
- The `<Link>` component from `@tanstack/react-router` uses `history.pushState` internally

### Deep Linking (FR30)

TanStack Router's file-based routing supports deep linking natively. Verify:
- `vite.config.ts` has no `base` path override that would break `/clientes` routes
- Backend does not need configuration changes — the SPA is served by Vite dev server which handles client-side routing

### 404 Not-Found View

```typescript
// frontend/src/shared/components/NotFoundView.tsx
import { Link } from '@tanstack/react-router'

export function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <h1 className="text-4xl font-bold text-slate-700">404</h1>
      <p className="text-slate-500">Página no encontrada</p>
      <p className="text-slate-400 text-sm">La ruta solicitada no existe.</p>
      <Link to="/clientes" className="text-primary underline">
        Ir a Clientes
      </Link>
    </div>
  )
}
```

### queryClient.ts (create if not present from Story 1.1)

```typescript
// frontend/src/shared/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})
```

### Testing Requirements

**E2E tests (Playwright) — `e2e/tests/foundation/navigation-shell.spec.ts`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| E2E-F-01 | P0 | Desktop: NavigationRail visible on left with Clientes and Contactos entries |
| E2E-F-02 | P0 | Desktop: Clicking "Clientes" navigates to `/clientes` without full page reload |
| E2E-F-03 | P0 | Desktop: Clicking "Contactos" navigates to `/contactos` without full page reload |
| E2E-F-04 | P0 | Deep link: Direct URL `/clientes` renders Clientes view (no redirect) |
| E2E-F-05 | P0 | Deep link: Direct URL `/contactos` renders Contactos view (no redirect) |
| E2E-F-06 | P1 | Mobile (Pixel 5): NavigationBar visible (not NavigationRail) |
| E2E-F-07 | P1 | Mobile (Pixel 5): Clientes and Contactos items are tappable |
| E2E-F-08 | P2 | Unknown route displays 404 view gracefully with Spanish message |

**Unit tests (Vitest + RTL) — `frontend/src/routes/__tests__/routing.test.ts`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| UNIT-F-01 | P1 | Route `/clientes` is registered in the TanStack Router route tree |
| UNIT-F-02 | P1 | Route `/contactos` is registered in the TanStack Router route tree |
| UNIT-F-03 | P2 | Root shell layout renders NavigationRail component (desktop viewport) |

**Page Object Model (POM) — `e2e/pages/navigation.page.ts`:**

```typescript
export class NavigationShellPage {
  readonly navigationRail: Locator   // siesa-ui-kit NavigationRail root
  readonly navigationBar: Locator    // siesa-ui-kit NavigationBar root (mobile)
  readonly clientesLink: Locator
  readonly contactosLink: Locator

  constructor(private readonly page: Page) {
    this.navigationRail  = page.getByRole('navigation', { name: /rail|principal/i })
    this.navigationBar   = page.getByRole('navigation', { name: /bar|menú/i })
    this.clientesLink    = page.getByRole('link', { name: /clientes/i })
    this.contactosLink   = page.getByRole('link', { name: /contactos/i })
  }

  async goto() {
    await this.page.goto('/')
  }
}
```

Note: Adjust ARIA role selectors after verifying actual siesa-ui-kit rendered HTML for `NavigationRail` and `NavigationBar`.

### File List (Expected)

**To create:**
- `frontend/src/routes/__root.tsx` — Root layout with QueryClientProvider + notFoundComponent
- `frontend/src/routes/index.tsx` — Redirect to `/clientes`
- `frontend/src/routes/_app.tsx` — Pathless shell layout with AppShell
- `frontend/src/routes/_app/clientes.tsx` — `/clientes` placeholder route
- `frontend/src/routes/_app/contactos.tsx` — `/contactos` placeholder route
- `frontend/src/shared/components/AppShell.tsx` — NavigationRail + NavigationBar responsive
- `frontend/src/shared/components/NotFoundView.tsx` — 404 view in Spanish
- `frontend/src/shared/lib/queryClient.ts` — TanStack QueryClient singleton (if not created in 1.1)
- `e2e/tests/foundation/navigation-shell.spec.ts` — E2E-F-01 through E2E-F-08
- `e2e/pages/navigation.page.ts` — NavigationShellPage POM
- `frontend/src/routes/__tests__/routing.test.ts` — UNIT-F-01, UNIT-F-02, UNIT-F-03

**Auto-generated (by TanStack Router Vite plugin on dev start):**
- `frontend/src/routeTree.gen.ts` — Updated with new routes

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md` — Story 1.2 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Frontend Architecture" (routing), "Project Structure"
- UX spec: `_bmad-output/planning-artifacts/ux-design-specification.md` — Direction F (LayoutBase + NavigationRail), responsive breakpoints
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-1.md` — E2E-F-01 through E2E-F-08, UNIT-F-01 through UNIT-F-03, POM NavigationShellPage
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack, TanStack Router prefixes, Frontend Key Rules
- Predecessor story: `_bmad-output/implementation-artifacts/stories/1-1-project-initialization-repository-structure.md`
