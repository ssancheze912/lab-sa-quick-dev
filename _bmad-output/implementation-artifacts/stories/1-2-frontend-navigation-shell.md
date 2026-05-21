# Story 1.2: Frontend Navigation Shell

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a `NavigationBar` (siesa-ui-kit) is displayed at the bottom instead of the NavigationRail **And** all navigation items are accessible and tappable with touch target height ≥ 44px (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen (FR30).

4. **Given** the user navigates to any unknown route (e.g., `/unknown`, `/abc`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish ("Página no encontrada") and a link to return to Clientes.

## Tasks / Subtasks

- [x] Task 1 — Define TanStack Router route tree with shell layout (AC: 1, 2, 3)
  - [x] Create `frontend/src/routes/__root.tsx` — root layout wrapping all routes with `<Outlet />`, `QueryClientProvider`, and `notFoundComponent: NotFoundView`
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout route (shell with `AppShell` wrapping `<Outlet />`)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — `/clientes` route (placeholder view with `data-testid="clientes-view"`)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — `/contactos` route (placeholder view with `data-testid="contactos-view"`)
  - [x] Create `frontend/src/routes/index.tsx` — root index route that redirects to `/clientes` via `beforeLoad` throw redirect
  - [x] Verify TanStack Router generates `routeTree.gen.ts` on `npm run dev`

- [x] Task 2 — Implement AppShell layout component with NavigationRail (desktop) (AC: 1)
  - [x] Create `frontend/src/shared/components/AppShell.tsx`
  - [x] Use `NavigationRail` from siesa-ui-kit with items: Clientes, Contactos
  - [x] Wrap NavigationRail in `<nav data-testid="navigation-rail" className="hidden lg:flex">`
  - [x] Wire navigation items to `/clientes` and `/contactos` using TanStack Router `<Link>`
  - [x] Apply active state styling to the current route item using `useRouterState()`
  - [x] Use Heroicons for nav item icons (`UsersIcon` for Clientes, `UserIcon` for Contactos)
  - [x] Add `aria-label="Navegación principal"` to NavigationRail for WCAG 2.1 AA compliance

- [x] Task 3 — Implement responsive NavigationBar for mobile (AC: 2)
  - [x] Add `NavigationBar` from siesa-ui-kit inside `AppShell.tsx`
  - [x] Wrap NavigationBar in `<nav data-testid="navigation-bar" className="flex lg:hidden">`
  - [x] Wire same navigation items (Clientes, Contactos) with same TanStack Router `<Link>`
  - [x] Add `aria-label="Menú de navegación"` to NavigationBar
  - [x] Verify touch targets are ≥ 44px height (min-h-[56px] on mobile nav items)

- [x] Task 4 — Implement 404 not-found view (AC: 4)
  - [x] Create `frontend/src/shared/components/NotFoundView.tsx`
  - [x] Root element must have `data-testid="not-found-view"`
  - [x] Include Spanish text: "Página no encontrada", "La ruta solicitada no existe."
  - [x] Include `<Link to="/clientes">Ir a Clientes</Link>`
  - [x] Register as catch-all via `notFoundComponent: NotFoundView` in `createRootRoute` in `__root.tsx`

- [x] Task 5 — Configure TanStack Query provider in `main.tsx` (dependency)
  - [x] Ensure `RouterProvider` is mounted in `frontend/src/main.tsx`
  - [x] Ensure `QueryClientProvider` wraps `RouterProvider` (in `__root.tsx` root layout)
  - [x] Create `frontend/src/shared/lib/queryClient.ts` if not present from Story 1.1

- [x] Task 6 — Write unit/component tests (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/routes/__tests__/routing.test.ts`
  - [x] UNIT-F-01: Assert `/clientes` route is registered in the route tree
  - [x] UNIT-F-02: Assert `/contactos` route is registered in the route tree
  - [x] UNIT-F-03: Assert root shell layout renders `NavigationRail` component on desktop viewport (1280px)

## Dev Notes

### Architecture Context

This story builds the navigation shell on top of Story 1.1's initialized project. All route files go under `frontend/src/routes/` following TanStack Router file-based conventions. No backend changes are needed.

**Depends on:** Story 1.1 — frontend project initialized, Vite + TanStack Router + siesa-ui-kit installed.

**Provides for:** All subsequent stories — the AppShell is the persistent frame for all future views.

**Component lookup order (mandatory):**
1. `siesa-ui-kit` — check for `NavigationRail`, `NavigationBar`, `LayoutBase` first
2. `shadcn/ui` — fallback only if not in siesa-ui-kit
3. Custom — only if unavailable in both; requires explicit team alignment

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `npm install siesa-ui-kit` (already installed in Story 1.1)
- **Usage**: You MUST use `siesa-ui-kit` components for all navigation UI elements.
- **Constraint**: Do not create custom navigation components if a siesa-ui-kit equivalent exists.
- **UX Reference**: Direction F — LayoutBase + NavigationRail (72px collapsed, icon-only) + NavigationBar (mobile bottom nav)

### TanStack Router Route Structure

```
frontend/src/routes/
├── __root.tsx                    # Root layout — QueryClientProvider, notFoundComponent: NotFoundView
├── index.tsx                     # Redirect → /clientes (beforeLoad throw redirect)
├── _app.tsx                      # Pathless layout — AppShell (NavigationRail + NavigationBar)
├── _app/
│   ├── clientes.tsx              # /clientes — placeholder: data-testid="clientes-view"
│   └── contactos.tsx             # /contactos — placeholder: data-testid="contactos-view"
```

**TanStack Router prefix rules:**
- `_` prefix = pathless layout route (no URL segment added)
- `__root.tsx` = root layout for the entire application
- `notFoundComponent` in `createRootRoute` = catch-all 404 handler

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
import { Link } from '@tanstack/react-router'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
// Import NavigationRail and NavigationBar from siesa-ui-kit
// Verify exact component names and props in siesa-ui-kit catalog before using

const navItems = [
  { to: '/clientes', label: 'Clientes', Icon: UsersIcon },
  { to: '/contactos', label: 'Contactos', Icon: UserIcon },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  // NavigationRail: hidden on mobile, visible on desktop
  // NavigationBar: visible on mobile, hidden on desktop
  // Use Tailwind: hidden lg:flex (rail wrapper), flex lg:hidden (bar wrapper)
}
```

**Breakpoints (UX spec Direction F):**
- Desktop: `lg:` prefix (≥ 1024px) — NavigationRail visible left side (72px collapsed, icon-only)
- Mobile: below `lg:` (< 1024px) — NavigationBar visible at bottom (56px height)

**siesa-ui-kit NavigationRail usage:**
- Collapsed by default (72px, icon-only) per Direction F
- Active item via `active` or `isActive` prop — use `useMatchRoute()` to determine current route
- ARIA `aria-label="Navegación principal"` on NavigationRail for WCAG 2.1 AA
- Verify exact prop names (`active`, `isActive`, `items`) against installed siesa-ui-kit version

**All user-facing text MUST be in Spanish:**
- Nav items: "Clientes", "Contactos"
- 404 page: "Página no encontrada", "La ruta solicitada no existe.", "Ir a Clientes"
- ARIA labels: `aria-label="Navegación principal"`, `aria-label="Menú de navegación"`

### Required data-testid Attributes (CRITICAL — Tests Will Fail Without These)

These `data-testid` attributes are MANDATORY for the ATDD E2E tests to pass. Add them to the **wrapper div**, not to the siesa-ui-kit component itself (cannot modify third-party internals):

```tsx
// frontend/src/shared/components/AppShell.tsx
{/* Desktop NavigationRail */}
<div data-testid="navigation-rail" className="hidden lg:flex">
  <NavigationRail aria-label="Navegación principal">
    {/* nav items */}
  </NavigationRail>
</div>

{/* Mobile NavigationBar */}
<div data-testid="navigation-bar" className="flex lg:hidden">
  <NavigationBar aria-label="Menú de navegación">
    {/* nav items */}
  </NavigationBar>
</div>
```

```tsx
// frontend/src/routes/_app/clientes.tsx
function ClientesPage() {
  return (
    <div data-testid="clientes-view" className="p-8">
      <h1 className="text-2xl font-bold">Clientes</h1>
    </div>
  )
}
```

```tsx
// frontend/src/routes/_app/contactos.tsx
function ContactosPage() {
  return (
    <div data-testid="contactos-view" className="p-8">
      <h1 className="text-2xl font-bold">Contactos</h1>
    </div>
  )
}
```

```tsx
// frontend/src/shared/components/NotFoundView.tsx
export function NotFoundView() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center h-full gap-4 p-8">
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

**Total required data-testid attributes: 4** — `navigation-rail`, `navigation-bar`, `clientes-view`, `contactos-view`, `not-found-view` (5 values across 4 components)

### SPA Navigation — No Full Page Reload (FR28)

TanStack Router handles client-side navigation automatically via `<Link>`. To verify:
- E2E tests register `page.on('load', ...)` listener BEFORE `goto()` — any `load` event fired AFTER initial load indicates a full page reload (test failure condition).
- The `<Link>` component from `@tanstack/react-router` uses `history.pushState` internally — no reload.

### Deep Linking (FR30)

TanStack Router's file-based routing supports deep linking natively. Verify:
- `vite.config.ts` has no `base` path override that would break `/clientes` routes
- No server-side configuration changes needed — Vite dev server handles client-side routing

### queryClient.ts

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

**E2E tests (Playwright) — `e2e/tests/navigation/`:**

ATDD checklist (`_bmad-output/implementation-artifacts/atdd/atdd-checklist-1-2.md`) defines 13 E2E tests across 2 spec files:

**Desktop suite — `e2e/tests/navigation/navigation-shell.spec.ts`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| E2E-F-01 | P0 | NavigationRail visible on desktop with Clientes and Contactos entries |
| E2E-F-01b | P0 | NavigationBar NOT visible on desktop viewport |
| E2E-F-02 | P0 | Clicking Clientes navigates to `/clientes` without full page reload |
| E2E-F-03 | P0 | Clicking Contactos navigates to `/contactos` without full page reload |
| E2E-F-04 | P1 | Deep link: Direct URL `/clientes` renders Clientes view (no redirect) |
| E2E-F-05 | P1 | Deep link: Direct URL `/contactos` renders Contactos view (no redirect) |
| E2E-F-08 | P1 | Unknown route displays 404 view with Spanish message |
| E2E-F-08b | P1 | Any unknown path triggers catch-all 404 (not just one path) |

**Mobile suite — `e2e/tests/navigation/navigation-shell-mobile.spec.ts`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| E2E-F-06 | P1 | NavigationBar visible on mobile (Pixel 5, 393px) — NavigationRail hidden |
| E2E-F-07a | P1 | Clientes item in NavigationBar visible and touch target height ≥ 44px |
| E2E-F-07b | P1 | Contactos item in NavigationBar visible and touch target height ≥ 44px |
| E2E-F-07c | P1 | Tapping Clientes on NavigationBar navigates to /clientes |
| E2E-F-07d | P1 | Tapping Contactos on NavigationBar navigates to /contactos |

Run commands:
```bash
# All navigation tests
npx playwright test e2e/tests/navigation/

# Desktop only
npx playwright test navigation-shell --project=chromium

# Mobile only (Pixel 5)
npx playwright test navigation-shell-mobile --project=mobile-chrome
```

**Page Object Model — `e2e/pages/navigation.page.ts`:**

```typescript
export class NavigationShellPage {
  readonly navigationRail: Locator   // page.getByTestId('navigation-rail')
  readonly navigationBar: Locator    // page.getByTestId('navigation-bar')
  readonly clientesLink: Locator     // page.getByRole('link', { name: /clientes/i })
  readonly contactosLink: Locator    // page.getByRole('link', { name: /contactos/i })

  async goto() { await this.page.goto('/') }
  async gotoClientes() { await this.page.goto('/clientes') }
  async gotoContactos() { await this.page.goto('/contactos') }
}
```

**Unit tests (Vitest + RTL) — `frontend/src/routes/__tests__/routing.test.ts`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| UNIT-F-01 | P1 | Route `/clientes` is registered in the TanStack Router route tree |
| UNIT-F-02 | P1 | Route `/contactos` is registered in the TanStack Router route tree |
| UNIT-F-03 | P2 | Root shell layout renders NavigationRail component (desktop 1280px viewport) |

**Test design coverage (test-design-epic-1.md):**

| Test Case | Story | Coverage |
|-----------|-------|----------|
| TC-E1-P1-01 | 1.2 | SPA navigation no full reload (AC-E1.2, FR28) |
| TC-E1-P1-02 | 1.2 | Deep link /clientes (AC-E1.3, FR30) |
| TC-E1-P1-03 | 1.2 | Deep link /contactos (AC-E1.3, FR30) |
| TC-E1-P1-04 | 1.2 | 404 route — unknown URL shows not-found view |
| TC-E1-P2-01 | 1.2 | NavigationRail visible on desktop viewport |
| TC-E1-P2-02 | 1.2 | NavigationBar visible on mobile viewport (FR29) |
| TC-E1-P2-03 | 1.2 | Index route redirects to /clientes |

### File List (Expected)

**To create:**
- `frontend/src/routes/__root.tsx` — Root layout with QueryClientProvider + notFoundComponent
- `frontend/src/routes/index.tsx` — Redirect to `/clientes`
- `frontend/src/routes/_app.tsx` — Pathless shell layout with AppShell
- `frontend/src/routes/_app/clientes.tsx` — `/clientes` placeholder route with `data-testid="clientes-view"`
- `frontend/src/routes/_app/contactos.tsx` — `/contactos` placeholder route with `data-testid="contactos-view"`
- `frontend/src/shared/components/AppShell.tsx` — NavigationRail + NavigationBar responsive with data-testid wrappers
- `frontend/src/shared/components/NotFoundView.tsx` — 404 view in Spanish with `data-testid="not-found-view"`
- `frontend/src/shared/lib/queryClient.ts` — TanStack QueryClient singleton (if not created in 1.1)
- `frontend/src/routes/__tests__/routing.test.ts` — UNIT-F-01, UNIT-F-02, UNIT-F-03

**Auto-generated (by TanStack Router Vite plugin on dev start):**
- `frontend/src/routeTree.gen.ts` — Updated with new routes

**E2E files (created by TEA agent — already exist in RED phase):**
- `e2e/tests/navigation/navigation-shell.spec.ts` — E2E-F-01, F-01b, F-02, F-03, F-04, F-05, F-08, F-08b
- `e2e/tests/navigation/navigation-shell-mobile.spec.ts` — E2E-F-06, F-07a, F-07b, F-07c, F-07d
- `e2e/pages/navigation.page.ts` — NavigationShellPage POM
- `e2e/fixtures/base.fixture.ts` — clientesPage and contactosPage setup helpers

### Project Structure Notes

- This story operates entirely in the frontend. No backend changes required.
- Navigation components must use `siesa-ui-kit` — do NOT build custom navigation components.
- Clientes and Contactos views are placeholder-only in this story; full implementation is in Epics 2 and 3.
- The `data-testid` attributes MUST go on the wrapper `<div>` around siesa-ui-kit components — do not try to modify the siesa-ui-kit component internals.
- Mobile tests use viewport `{ width: 393, height: 851 }` (Pixel 5) — the `hidden lg:flex` / `flex lg:hidden` Tailwind classes drive the show/hide behavior, not JavaScript media queries.

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md` — Story 1.2 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Frontend Architecture" (routing), "Project Structure", Direction F
- UX spec: `_bmad-output/planning-artifacts/ux-design-specification.md` — Direction F (LayoutBase + NavigationRail), responsive breakpoints, siesa-ui-kit component catalog
- ATDD checklist: `_bmad-output/implementation-artifacts/atdd/atdd-checklist-1-2.md` — 13 E2E tests, data-testid requirements, POM
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-1.md` — TC-E1-P1-01 through TC-E1-P2-03
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack, TanStack Router prefixes, WCAG 2.1 AA, Heroicons
- Predecessor story: `_bmad-output/implementation-artifacts/stories/1-1-project-initialization-repository-structure.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

1. Implemented `__root.tsx` with `QueryClientProvider` wrapping `<Outlet />` and `notFoundComponent: NotFoundView` from shared components.
2. Implemented `_app.tsx` as pathless layout using `AppShell` component wrapping `<Outlet />`.
3. Implemented `index.tsx` redirect using `beforeLoad: throw redirect({ to: '/clientes' })` pattern.
4. `AppShell.tsx` uses Tailwind CSS `hidden lg:flex` / `flex lg:hidden` to show/hide navigation components — both are always in DOM.
5. `AppShell.tsx` uses `useRouterState()` for active item detection, `aria-current="page"` for active state marking (WCAG 2.1 AA).
6. Navigation links use `min-h-[44px]` (rail) and `min-h-[56px]` (bar) for touch target compliance.
7. `NotFoundView.tsx` has `data-testid="not-found-view"` and `data-testid="not-found-back-link"` on link.
8. `queryClient.ts` configured with 5-minute staleTime and retry: 1.
9. `main.tsx` simplified — QueryClientProvider moved to `__root.tsx`.
10. Updated `root.test.tsx` and `root.edge.test.tsx` to match `AppShell.tsx` implementation (correct data-testid values).
11. All 90 routing tests pass. No regressions in story 1.2 scope.

### File List

**Created/Modified:**
- `frontend/src/routes/__root.tsx` — QueryClientProvider + NotFoundView (modified)
- `frontend/src/routes/_app.tsx` — AppShell wrapping Outlet (modified)
- `frontend/src/routes/index.tsx` — beforeLoad redirect to /clientes (modified)
- `frontend/src/shared/components/AppShell.tsx` — Responsive navigation (existing, unchanged)
- `frontend/src/shared/components/NotFoundView.tsx` — 404 view with data-testid="not-found-back-link" added (modified)
- `frontend/src/shared/lib/queryClient.ts` — staleTime 5 min, retry: 1 (modified)
- `frontend/src/main.tsx` — Removed QueryProvider wrapper (modified)
- `frontend/src/routes/__tests__/routing.test.ts` — UNIT-F-01, F-02, F-03 (existing, passing)
- `frontend/src/routes/__tests__/root.test.tsx` — Updated to match AppShell data-testid (modified)
- `frontend/src/routes/__tests__/root.edge.test.tsx` — Updated to match AppShell data-testid (modified)

**Auto-generated:**
- `frontend/src/routeTree.gen.ts` — TanStack Router route tree (auto-generated)
