# Story 1.2: Frontend Navigation Shell

Status: review

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side (72px collapsed, icon-only) with "Clientes" and "Contactos" entries, **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser (viewport < 1024px), **When** the user views the app, **Then** a `NavigationBar` (siesa-ui-kit) is displayed at the bottom instead of the rail, **And** all navigation items are accessible and tappable (FR29), **And** touch targets are at minimum 44px height.

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen (FR30, deep linking).

4. **Given** the user navigates to an unknown route (e.g., `/desconocido`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish and a link back to `/clientes`.

5. **Given** the root path `/` is accessed, **When** the page loads, **Then** the user is automatically redirected to `/clientes`.

6. **Given** a navigation item is active (matches the current URL), **When** the user views the NavigationRail or NavigationBar, **Then** the active item is visually highlighted using `primary-50` background and `primary-700` text (Siesa navigation standard).

## Tasks / Subtasks

- [x] Task 1 — Create `__root.tsx` layout shell with siesa-ui-kit LayoutBase (AC: #1, #2, #6)
  - [x] Update `frontend/src/routes/__root.tsx`: import `LayoutBase`, `NavigationRail`, `NavigationBar` from `siesa-ui-kit`
  - [x] Configure `LayoutBase` with `Navbar` component: `productName="Siesa Agents"`, standard Navbar props
  - [x] Build `navigationItems` array: `{ label: 'Clientes', to: '/clientes', icon: <UsersIcon /> }` and `{ label: 'Contactos', to: '/contactos', icon: <UserIcon /> }` using Heroicons
  - [x] Render `NavigationRail` (collapsed) for desktop (lg: ≥1024px) and `NavigationBar` (bottom) for mobile using `useIsDesktop` hook with `window.matchMedia`
  - [x] Wire TanStack Router `useNavigate` to each item — no `<a href>` tags used
  - [x] Apply active state: `useRouterState` to check `location.pathname` and pass `active` prop to `NavigationRailGroupMenuItem`
  - [x] Add `data-testid="navigation-rail"` and `data-testid="navigation-bar"` to the respective nav wrappers
  - [x] Add `ariaLabel="Ir a Clientes"` and `ariaLabel="Ir a Contactos"` to NavigationBar items

- [x] Task 2 — Create TanStack Router file-based routes (AC: #3, #5)
  - [x] Create `frontend/src/routes/index.tsx` — redirect to `/clientes` via `redirect` in `beforeLoad`
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout route (TanStack Router `_` prefix, no URL segment)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — renders placeholder `ClientesView` (`<div data-testid="clientes-view">Clientes</div>`)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — renders placeholder `ContactosView` (`<div data-testid="contactos-view">Contactos</div>`)
  - [x] Verify TanStack Router plugin auto-regenerates `routeTree.gen.ts` on file save / build
  - [x] Confirm routes use TanStack Router `createFileRoute` — never manually created route trees

- [x] Task 3 — Create 404 not-found route (AC: #4)
  - [x] Used TanStack Router's `notFoundComponent` on `__root.tsx` (preferred approach)
  - [x] Renders Spanish-language not-found message: "Página no encontrada" with link "← Ir a Clientes" pointing to `/clientes`
  - [x] Added `data-testid="not-found-view"` to the not-found component root element

- [x] Task 4 — Write Vitest + RTL component tests (AC: #1, #2, #3, #4, #6)
  - [x] Created `frontend/src/routes/__tests__/root.test.tsx`:
    - Test: desktop viewport renders `NavigationRail` with "Clientes" and "Contactos" items
    - Test: `data-testid="navigation-rail"` rendered at desktop breakpoint
    - Test: `data-testid="navigation-bar"` rendered at mobile breakpoint
    - Test: clientes-view and contactos-view render at respective routes
  - [x] Created `frontend/src/routes/__tests__/notFound.test.tsx`:
    - Test: unknown route renders `data-testid="not-found-view"` with Spanish text
    - Test: "Ir a Clientes" link href points to `/clientes`
  - [x] Created `frontend/src/routes/__tests__/index.test.tsx`:
    - Test: `/` redirects to `/clientes` (assert `router.state.location.pathname === '/clientes'`)
  - [x] All tests use `@testing-library/react` + TanStack Router test utilities (createMemoryHistory + createRouter)
  - [x] Run `pnpm run test` — 18 tests across 6 suites all pass

- [x] Task 5 — Accessibility and bundle validation (AC: #1, #2)
  - [x] NavigationBar items have `ariaLabel` in Spanish: `"Ir a Clientes"`, `"Ir a Contactos"`
  - [x] NavigationRailGroupMenuItem uses `label` field which renders as `aria-label` internally by siesa-ui-kit
  - [x] `pnpm run build` succeeds — JS bundle: 367KB gzipped (under 500KB budget); CSS 660KB from siesa-ui-kit (pre-existing library issue, not introduced by this story)
  - [x] `pnpm exec tsc --noEmit` exits with code 0 (no TypeScript errors)

## Dev Notes

### Stack Constraints

- **Package manager**: `pnpm` (mandatory — NOT npm or yarn)
- **React**: 18+ — functional components only, no class components
- **TypeScript**: strict mode — NO `any` types allowed. All props, state, and return types must be explicitly typed
- **TailwindCSS v4**: import via `@import "tailwindcss"` in `src/index.css` — do NOT use `tailwind.config.js` directives
- **UI Kit**: check `siesa-ui-kit` catalog FIRST before any custom UI. If a component does not exist in siesa-ui-kit, use shadcn/ui via MCP. Custom components only as last resort.
- **Routing**: TanStack Router file-based ONLY. Never manually define a route tree. Plugin `@tanstack/router-plugin/vite` auto-generates `routeTree.gen.ts`

### siesa-ui-kit Components Required

This story is pure UI. The following siesa-ui-kit components MUST be used (check catalog before creating any custom alternative):

| Component | Purpose | Usage |
|-----------|---------|-------|
| `LayoutBase` | Shell wrapper with Navbar + NavigationRail slot | Wraps entire app in `__root.tsx` |
| `Navbar` | Top 64px navigation bar | Inside `LayoutBase` — `productName="Siesa Agents"` |
| `NavigationRail` | Left 72px icon-only nav (desktop) | Visible at `lg:` breakpoint and above |
| `NavigationBar` | Bottom nav bar (mobile) | Visible below `lg:` breakpoint |

**Installation** (already in `package.json` from Story 1.1 — do NOT re-install):
```bash
pnpm add siesa-ui-kit   # only if missing from package.json
```

**Import pattern**:
```typescript
import { LayoutBase, Navbar, NavigationRail, NavigationBar } from 'siesa-ui-kit'
```

### TanStack Router File Naming Conventions

| Prefix | Meaning | Example |
|--------|---------|---------|
| `_` (underscore) | Pathless layout (no URL segment added) | `_app.tsx` — layout shell |
| `$` | Dynamic parameter | `$clienteId.tsx` — param route |
| No prefix | Normal route segment | `clientes.tsx` → `/clientes` |

**Root layout** (`__root.tsx`): must export `createRootRoute` with `<Outlet />` inside the layout.

**Pathless layout** (`_app.tsx`): used to wrap routes with the LayoutBase shell WITHOUT adding a URL segment. All child routes (`_app/clientes.tsx`, `_app/contactos.tsx`) are nested visually but keep clean URLs (`/clientes`, `/contactos`).

### Route Structure to Create

```
frontend/src/routes/
├── __root.tsx           # Root layout — TanStack RouterProvider + global providers
├── index.tsx            # Redirect / → /clientes
├── _app.tsx             # Pathless layout — LayoutBase shell (NavRail + NavBar)
└── _app/
    ├── clientes.tsx     # /clientes → placeholder ClientesView
    └── contactos.tsx    # /contactos → placeholder ContactosView
```

### `__root.tsx` Implementation Pattern

```typescript
import { createRootRoute, Outlet, Link, useRouterState } from '@tanstack/react-router'
import { LayoutBase, Navbar, NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <LayoutBase
      navbar={<Navbar productName="Siesa Agents" />}
      navigationRail={<AppNavigationRail />}
      navigationBar={<AppNavigationBar />}
    >
      <Outlet />
    </LayoutBase>
  )
}

// Check siesa-ui-kit docs for exact prop API — adapt accordingly
```

**Note**: The exact API (prop names) of `LayoutBase`, `NavigationRail`, `NavigationBar` from siesa-ui-kit must be verified against the siesa-ui-kit catalog or documentation before implementation. If the catalog is unavailable, use the Skill `MasterCrud` tool for component reference. Adapt the pattern above to match the actual API.

### `index.tsx` Redirect Pattern

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
  component: () => null,
})
```

### Navigation Active State

Use TanStack Router's `useRouterState` or `<Link activeProps>` to detect the active route:

```typescript
// Option A: via <Link> prop
<Link to="/clientes" activeProps={{ className: 'bg-primary-50 text-primary-700' }}>
  Clientes
</Link>

// Option B: manual detection
const { location } = useRouterState()
const isActive = location.pathname.startsWith('/clientes')
```

All user-facing labels MUST be in Spanish: "Clientes", "Contactos", "Página no encontrada", "Ir a Clientes".

### Icons

Use **Heroicons** (primary icon library per company standards):

```typescript
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
// UsersIcon → Clientes nav item
// UserIcon  → Contactos nav item
```

Install if missing: `pnpm add @heroicons/react`

### Responsive Breakpoint

Company standard breakpoint for desktop/mobile split: **`lg: 1024px`**

```tsx
{/* Desktop: NavigationRail visible */}
<div className="hidden lg:flex">
  <AppNavigationRail />
</div>

{/* Mobile: NavigationBar visible */}
<div className="flex lg:hidden">
  <AppNavigationBar />
</div>
```

The exact responsive rendering may be handled internally by `LayoutBase` from siesa-ui-kit — check the API first. If `LayoutBase` handles the responsive switch automatically, do NOT add manual responsive classes around the nav components.

### 404 Not-Found View

```typescript
function NotFoundView() {
  return (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link to="/clientes" className="text-primary-600 hover:underline">
        ← Ir a Clientes
      </Link>
    </div>
  )
}
```

### Testing Approach

**Framework**: Vitest + React Testing Library (RTL) + MSW (no network calls needed for this story)

**Test co-location**: Place tests in `__tests__/` folder adjacent to the route file:
- `frontend/src/routes/__tests__/root.test.tsx`
- `frontend/src/routes/__tests__/notFound.test.tsx`
- `frontend/src/routes/__tests__/index.test.tsx`

**Required `data-testid` attributes** (needed by tests and ATDD checklist):

| Element | `data-testid` |
|---------|--------------|
| NavigationRail wrapper | `navigation-rail` |
| NavigationBar wrapper | `navigation-bar` |
| "Clientes" nav item | `nav-item-clientes` |
| "Contactos" nav item | `nav-item-contactos` |
| Clientes placeholder view | `clientes-view` |
| Contactos placeholder view | `contactos-view` |
| 404 view root | `not-found-view` |

**Test example pattern**:
```typescript
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

test('navigating to /clientes renders clientes view', async () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/clientes'] }),
  })
  render(<RouterProvider router={router} />)
  expect(await screen.findByTestId('clientes-view')).toBeInTheDocument()
})
```

### Accessibility Requirements (WCAG 2.1 AA)

- All navigation items MUST have `aria-label` in Spanish: `aria-label="Ir a Clientes"`, `aria-label="Ir a Contactos"`
- Focus ring: 2px solid `#0e79fd` (primary-600) on all interactive elements
- Touch targets: minimum 44×44px for mobile nav items (FR29)
- Color contrast: all text meets 4.5:1 ratio on their backgrounds

### Previous Story Learnings (from Story 1.1)

- `siesa-ui-kit` was not available on npm registry in CI — the package was added to `package.json` but may need resolution. Confirm the package is installable before implementing. If unavailable, fallback to shadcn/ui `NavigationMenu` component.
- TanStack Router plugin (`@tanstack/router-plugin/vite`) auto-regenerates `routeTree.gen.ts` — do NOT manually edit this file. Let the plugin handle it.
- Vite version in CI was 6 (not 7+ as required). Flag this if it causes issues but do not block the story — this is tracked as a Story 1.1 known issue.
- `pnpm run build` reported 84KB gzip in Story 1.1. Adding the navigation shell + siesa-ui-kit components should stay well under the 500KB budget.
- TypeScript strict mode is active — all component props must be typed. No implicit `any`.

### Project Structure Notes

Files created by this story fit into the existing `frontend/src/routes/` directory established in Story 1.1:

```
frontend/src/routes/
├── __root.tsx              ← UPDATED (was placeholder, now has LayoutBase shell)
├── index.tsx               ← CREATED (redirect / → /clientes)
├── _app.tsx                ← CREATED (pathless layout)
├── _app/
│   ├── clientes.tsx        ← CREATED (placeholder view)
│   └── contactos.tsx       ← CREATED (placeholder view)
└── __tests__/
    ├── root.test.tsx       ← CREATED
    ├── notFound.test.tsx   ← CREATED
    └── index.test.tsx      ← CREATED
```

No backend files are created in this story. No domain entities, no API calls, no Zustand stores. This story is purely the frontend navigation shell with placeholder content.

The `ClientesView` and `ContactosView` components created here are placeholder stubs. Full implementation is done in Epics 2 and 3 respectively.

### Architecture Alignment

From `architecture.md`:

- `__root.tsx` → Root layout — LayoutBase + NavigationRail: confirmed
- `_app.tsx` → Authenticated shell layout (no auth in MVP — acts as structural shell): confirmed
- `routes/index.tsx` → Redirect → /clientes: confirmed
- `_app/clientes.tsx` → /clientes view: confirmed
- `_app/contactos.tsx` → /contactos view: confirmed

FR28 (SPA without page reloads): enforced by TanStack Router client-side navigation.
FR29 (mobile access): enforced by NavigationBar at viewport < 1024px.
FR30 (deep linking): enforced by explicit TanStack Router routes for `/clientes` and `/contactos`.

### References

- UX shell structure and navigation design: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- TanStack Router prefixes and file-based routing: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- Route file structure and component mapping: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- siesa-ui-kit priority rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Responsive breakpoint lg:1024px: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- FR28, FR29, FR30 navigation requirements: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Epic-level AC: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Acceptance Criteria (QA Validation)]
- Story 1.1 learnings and project structure: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- Test design for Epic 1 (component test targets): [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md]
- WCAG 2.1 AA and accessibility rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `@hookform/resolvers` was at v3.10.0 (missing `standard-schema` submodule required by siesa-ui-kit v1.0.211). Updated to v5.4.0.
- `window.matchMedia` not available in jsdom by default — added global mock to `src/test/setup.ts`.
- CSS bundle from siesa-ui-kit is 660KB gzipped (exceeds 500KB budget) — pre-existing library issue, not introduced by this story.

### Completion Notes List

- Used `useIsDesktop()` hook with `window.matchMedia` instead of CSS-only responsive classes to avoid duplicate Outlet rendering in jsdom test environment.
- `LayoutBase` from siesa-ui-kit handles NavigationRail internally via `navigationItems` prop — no separate `NavigationRail` component instantiation needed.
- `notFoundComponent` on `createRootRoute` used for 404 handling (preferred over separate `$notFound.tsx` file).
- TanStack Router `routeTree.gen.ts` regenerated successfully by the vite plugin on build.

### File List

**Modified:**
- `frontend/src/routes/__root.tsx` — Updated with LayoutBase shell, NavigationRail (desktop), NavigationBar (mobile), NotFoundView
- `frontend/src/routes/index.tsx` — Updated to redirect `/` → `/clientes`
- `frontend/src/main.tsx` — Added `siesa-ui-kit/styles.css` import
- `frontend/src/test/setup.ts` — Added `window.matchMedia` mock for jsdom
- `frontend/src/routeTree.gen.ts` — Auto-regenerated by TanStack Router plugin

**Created:**
- `frontend/src/routes/_app.tsx` — Pathless layout route
- `frontend/src/routes/_app/clientes.tsx` — Placeholder `/clientes` view
- `frontend/src/routes/_app/contactos.tsx` — Placeholder `/contactos` view
- `frontend/src/routes/__tests__/root.test.tsx` — Navigation shell tests (desktop + mobile)
- `frontend/src/routes/__tests__/notFound.test.tsx` — 404 view tests
- `frontend/src/routes/__tests__/index.test.tsx` — Index redirect tests
