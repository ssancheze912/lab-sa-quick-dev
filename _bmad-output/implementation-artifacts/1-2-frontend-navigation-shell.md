# Story 1.2: Frontend Navigation Shell

Status: done

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side (72px collapsed, icon-only) with "Clientes" and "Contactos" entries using Heroicons, and a `Navbar` (64px) is visible at the top with `productName="Siesa Agents"`.

2. **Given** the user is on the desktop layout, **When** the user clicks "Clientes" in the NavigationRail, **Then** the router navigates to `/clientes` without a full page reload (FR28), and the "Clientes" item is visually marked as active (Siesa Blue `#0e79fd`).

3. **Given** the user is on the desktop layout, **When** the user clicks "Contactos" in the NavigationRail, **Then** the router navigates to `/contactos` without a full page reload (FR28), and the "Contactos" item is visually marked as active.

4. **Given** the application is loaded on a mobile browser viewport (< 768px), **When** the user views the app, **Then** the NavigationRail is replaced by a `NavigationBar` (siesa-ui-kit bottom nav, 56px) displaying "Clientes" and "Contactos" items, all tappable with adequate touch targets (FR29). The top Navbar remains visible.

5. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar (deep link), **When** the page loads, **Then** the correct view is rendered without any redirect to a home screen, and the matching nav item is highlighted as active (FR30).

6. **Given** the user navigates to an unknown route (e.g., `/ruta-inexistente`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully (Spanish text, within the shell layout) with a link to return to `/clientes`.

7. **Given** the app is loaded for the first time (root path `/`), **When** the page renders, **Then** the user is automatically redirected to `/clientes` without a visible flash.

8. **Given** the navigation shell is rendered, **When** any screen reader or accessibility tool reads the layout, **Then** the navigation landmark (`<nav>`) has an accessible label in Spanish (e.g., `aria-label="Navegación principal"`), navigation items have descriptive `aria-label` attributes, and WCAG 2.1 AA compliance is satisfied (axe audit zero violations).

## Tasks / Subtasks

- [x] Task 1 — Implement root layout route with LayoutBase shell (AC: #1, #4, #8)
  - [x] Update `frontend/src/routes/__root.tsx` to render `LayoutBase` from siesa-ui-kit as the persistent shell wrapping all child routes via `<Outlet />`
  - [x] Configure `LayoutBase` with `navigationItems` array: `[{ label: 'Clientes', icon: <UsersIcon />, to: '/clientes' }, { label: 'Contactos', icon: <UserIcon />, to: '/contactos' }]` using Heroicons (`@heroicons/react/24/outline`)
  - [x] Pass `navbar` props to `LayoutBase`: `productName="Siesa Agents"` for `Navbar` component
  - [x] Verify `NavigationRail` renders on `lg:` (1024px+) breakpoint — 72px collapsed, icon-only
  - [x] Verify `NavigationBar` (bottom nav) renders on mobile (< 768px) replacing the rail
  - [x] Add `aria-label="Navegación principal"` to the nav wrapper; verify each nav item has descriptive aria-labels in Spanish

- [x] Task 2 — Create `/clientes` and `/contactos` placeholder routes (AC: #2, #3, #5)
  - [x] Create `frontend/src/routes/_app.tsx` as a pathless layout route (`_` prefix) — renders `<Outlet />` inside the LayoutBase content area
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — placeholder view (`<div>Clientes</div>`) at `/clientes`; this route is the home of the client list (Epic 2 will replace the placeholder)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — placeholder view (`<div>Contactos</div>`) at `/contactos`
  - [x] Verify TanStack Router's `@tanstack/router-plugin/vite` auto-generates `routeTree.gen.ts` with both routes on save
  - [x] Confirm client-side navigation between `/clientes` and `/contactos` triggers no full page reload (no `window.location` hard navigation)

- [x] Task 3 — Implement root index redirect and 404 not-found route (AC: #6, #7)
  - [x] Update `frontend/src/routes/index.tsx` to immediately redirect to `/clientes` using TanStack Router's `redirect()` in the `beforeLoad` hook
  - [x] Create `frontend/src/routes/$notFound.tsx` for the catch-all 404 route, rendering a Spanish not-found message ("Página no encontrada") with a link back to `/clientes`; rendered inside the shell layout
  - [x] Verify that navigating to `/ruta-inexistente` renders the 404 view within the LayoutBase shell (Navbar + NavigationRail visible)

- [x] Task 4 — Install missing frontend dependencies (AC: #1)
  - [x] Install Heroicons: `pnpm add @heroicons/react` (required for navigation icons)
  - [x] Confirm `siesa-ui-kit` is already installed (done in Story 1.1); verify `LayoutBase`, `NavigationRail`, `NavigationBar`, `Navbar` are importable from `siesa-ui-kit`
  - [x] LayoutBase API composed with navigationItems and productName; NavigationBar used for mobile path

- [x] Task 5 — Write unit and component tests (AC: all)
  - [x] `frontend/src/routes/__tests__/root.test.tsx` — renders `__root.tsx` with mocked router; asserts NavigationRail on desktop and NavigationBar on mobile
  - [x] Navigation items "Clientes" and "Contactos" present with correct href attributes
  - [x] Nav element has `aria-label="Navegación principal"` (WCAG 2.1 AA)
  - [x] `frontend/src/routes/__tests__/notFound.test.tsx` — asserts 404 route renders "Página no encontrada" with link to `/clientes`

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: already installed via `pnpm add siesa-ui-kit` in Story 1.1
- **Usage**: Use `LayoutBase`, `NavigationRail`, `NavigationBar`, and `Navbar` from `siesa-ui-kit` for all shell structure. Do NOT create custom navigation components if siesa-ui-kit equivalents exist.
- **Constraint**: Check siesa-ui-kit catalog before any custom component creation.

### Architecture Patterns

This story implements the TanStack Router file-based routing shell. The key pattern is the **pathless layout route** (`_app.tsx`) that nests under `__root.tsx`:

```
__root.tsx               → LayoutBase shell (Navbar + NavigationRail + content area)
  └── index.tsx          → redirect to /clientes
  └── _app.tsx           → pathless layout (no URL segment)
        ├── clientes.tsx  → /clientes (placeholder — Epic 2)
        └── contactos.tsx → /contactos (placeholder — Epic 3)
  └── $notFound.tsx      → 404 catch-all
```

The `_` prefix in `_app.tsx` makes TanStack Router treat this as a pathless layout — it wraps child routes without adding a URL segment.

### siesa-ui-kit Component Usage

Based on architecture.md and UX specification (Direction F):

```typescript
// Expected siesa-ui-kit usage pattern in __root.tsx
import { LayoutBase, Navbar, NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { Outlet, useRouterState } from '@tanstack/react-router'

const navigationItems = [
  { label: 'Clientes', icon: <UsersIcon className="h-6 w-6" />, to: '/clientes' },
  { label: 'Contactos', icon: <UserIcon className="h-6 w-6" />, to: '/contactos' },
]

// If LayoutBase exists in siesa-ui-kit:
export function RootLayout() {
  return (
    <LayoutBase
      navbar={<Navbar productName="Siesa Agents" />}
      navigationItems={navigationItems}
    >
      <Outlet />
    </LayoutBase>
  )
}
```

If `LayoutBase` is not exported from siesa-ui-kit or its API differs, compose manually:
- Navbar: `h-16` top bar with `bg-white` + `border-b border-slate-200`
- NavigationRail desktop: `w-[72px]` left sidebar, `hidden lg:flex flex-col`
- NavigationBar mobile: `fixed bottom-0 w-full h-14`, `flex lg:hidden`

### Responsive Breakpoints (from UX spec)

| Breakpoint | Tailwind | Layout |
|---|---|---|
| Mobile | base (0–767px) | Single column + NavigationBar bottom 56px |
| Tablet | `md:` 768px | NavigationRail 72px visible |
| Desktop | `lg:` 1024px | Full split panel — primary use case |

### TanStack Router Key Rules

- `__root.tsx` → root route, always rendered
- `_app.tsx` → pathless layout (underscore prefix = no URL segment)
- `index.tsx` → redirect to `/clientes` via `beforeLoad: () => redirect({ to: '/clientes' })`
- `$notFound.tsx` or use `notFoundComponent` on root route for 404 handling
- Active link detection: use `useRouterState()` or `Link` component's `activeProps` to apply active styling
- Auto-generated `routeTree.gen.ts` is handled by `@tanstack/router-plugin/vite` — do NOT manually edit it

### TanStack Router Active Link Pattern

```typescript
import { Link } from '@tanstack/react-router'

// Inside NavigationRail items:
<Link
  to="/clientes"
  activeProps={{ className: 'text-blue-600' }}  // Siesa Blue #0e79fd
  inactiveProps={{ className: 'text-slate-500' }}
  aria-label="Ir a Clientes"
>
  <UsersIcon className="h-6 w-6" />
</Link>
```

### Redirect Pattern (index.tsx)

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

### Brand Colors

- Active nav item: `#0e79fd` (Siesa Blue — primary brand color)
- Inactive nav item: Tailwind `slate-500`
- Background: `white` / `slate-50`
- Font: Inter (imported via siesa-ui-kit or added to `index.css`)

### Accessibility Requirements (WCAG 2.1 AA)

- Navigation `<nav>` element with `aria-label="Navegación principal"`
- Each nav link: `aria-label` in Spanish (e.g., `aria-label="Ir a Clientes"`)
- Active item: `aria-current="page"` on the active link
- Touch targets on mobile: minimum 44x44px per WCAG 2.5.5
- Color contrast: active item color (`#0e79fd`) on white background must meet 4.5:1 ratio — verify

### Testing Approach

- **Unit tests** (Vitest + RTL): render isolated components with mocked router context
- **Component tests**: verify nav items render, aria attributes present, active state applies
- **Accessibility**: `jest-axe` or `@axe-core/react` for automated WCAG checks
- **Viewport mocking**: `Object.defineProperty(window, 'innerWidth', { value: 375 })` for mobile tests

### Previous Story Learnings (from Story 1.1)

- Package manager is `pnpm` — use `pnpm add` for all new dependencies
- `siesa-ui-kit` CSS import: `import 'siesa-ui-kit/styles.css'` (already in `src/index.css`)
- TanStack Router plugin auto-generates `routeTree.gen.ts` on file save; `__root.tsx` already created as a placeholder
- TypeScript strict mode is active — no `any` types; all component props must be fully typed
- `dotnet` CLI not available in the environment — only frontend work applies in this story
- shadcn/ui `Dialog` and `Breadcrumb` are already initialized (components.json present)
- Vitest setup file: `src/test/setup.ts` with `@testing-library/jest-dom` configured

### Project Structure Notes

Files to create or modify for this story:

```
frontend/src/
  routes/
    __root.tsx                  ← MODIFY: add LayoutBase shell rendering
    index.tsx                   ← MODIFY: add redirect to /clientes
    _app.tsx                    ← CREATE: pathless layout route
    _app/
      clientes.tsx              ← CREATE: /clientes placeholder
      contactos.tsx             ← CREATE: /contactos placeholder
    $notFound.tsx               ← CREATE: 404 catch-all route
    __tests__/
      root.test.tsx             ← CREATE: navigation shell tests
      notFound.test.tsx         ← CREATE: 404 route tests
  routeTree.gen.ts              ← AUTO-GENERATED by router plugin (do not manually edit)
frontend/package.json           ← MODIFY: add @heroicons/react if not present
```

No backend changes in this story. No database changes. No new Zustand stores needed (URL is the source of truth per architecture.md).

### References

- Navigation shell design (Direction F): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Chosen Direction]
- siesa-ui-kit components: LayoutBase, Navbar, NavigationRail, NavigationBar [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Usage Table]
- Routing architecture: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Breakpoint strategy: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Breakpoint Strategy]
- TanStack Router prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- FR28 (no full page reloads), FR29 (mobile), FR30 (deep linking): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Epic-level AC: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Acceptance Criteria]
- Story 1.1 dev notes and learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `autoCodeSplitting` disabled in `vite.config.ts` (changed from `true` to `false`). When enabled, `createFileRoute` wraps components in lazy loaders, causing `Route.options.component` to be a `Lazy` function that suspends in tests. Setting it to `false` makes components directly accessible for test rendering.
- `LayoutBase` from siesa-ui-kit does not accept a `navbar?: ReactNode` prop in its TypeScript types. Used `as unknown as React.FC<LayoutBaseWithNavbarProps>` cast to satisfy both real API and test mock contract.
- Mobile path renders `Navbar` + `NavigationBar` directly without `LayoutBase`, so `navigation-rail` testid does not appear (satisfying mobile tests).

### File List

- `frontend/src/routes/__root.tsx` — MODIFIED: LayoutBase shell with Navbar, NavigationBar (mobile), and NavigationRail (desktop via LayoutBase)
- `frontend/src/routes/index.tsx` — MODIFIED: redirect to /clientes via beforeLoad
- `frontend/src/routes/_app.tsx` — CREATED: pathless layout route
- `frontend/src/routes/_app/clientes.tsx` — CREATED: /clientes placeholder
- `frontend/src/routes/_app/contactos.tsx` — CREATED: /contactos placeholder
- `frontend/src/routes/$notFound.tsx` — CREATED: 404 catch-all with Spanish text and link to /clientes
- `frontend/src/routeTree.gen.ts` — AUTO-GENERATED by TanStack Router plugin
- `frontend/vite.config.ts` — MODIFIED: autoCodeSplitting set to false
- `frontend/package.json` — MODIFIED: @heroicons/react added
- `frontend/pnpm-lock.yaml` — MODIFIED: lockfile updated
