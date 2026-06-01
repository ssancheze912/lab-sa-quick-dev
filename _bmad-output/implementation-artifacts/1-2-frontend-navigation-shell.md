# Story 1.2: Frontend Navigation Shell

Status: done

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser, **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (width < 1024px), **When** the user views the app, **Then** a mobile-responsive `NavigationBar` (siesa-ui-kit) is displayed at the bottom instead of the rail, with all navigation items accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen and the active navigation item is highlighted (FR30, deep linking).

4. **Given** the user navigates to an unknown route (e.g., `/unknown`), **When** the page loads, **Then** a graceful 404 / not-found view is displayed within the application shell (no blank screen or JS crash).

5. **Given** the application is loaded, **When** the user navigates between `/clientes` and `/contactos`, **Then** navigation occurs without a full page reload (SPA behavior confirmed via absence of full document request in browser DevTools).

6. **Given** any navigation item is focused via keyboard, **When** the user presses Enter or Space, **Then** navigation to the corresponding route is triggered (WCAG 2.1 AA keyboard accessibility).

## Tasks / Subtasks

- [x] Task 1 — Implement root layout with responsive navigation shell (AC: #1, #2, #5)
  - [ ] Update `src/routes/__root.tsx` to render the application shell layout integrating `NavigationRail` (siesa-ui-kit) on desktop and `NavigationBar` (siesa-ui-kit) on mobile using Tailwind breakpoint `lg:` (≥ 1024px)
  - [ ] Use `useMatchRoute` or `useRouterState` from TanStack Router to determine the active route and pass the active state to each navigation item
  - [ ] Wrap child routes with `<Outlet />` inside the layout so views render without full page reloads
  - [ ] Ensure navigation items are labeled "Clientes" and "Contactos" in Spanish with correct `href` props pointing to `/clientes` and `/contactos`
  - [ ] Apply brand colors: primary `#0e79fd` (Siesa Blue) for active state via siesa-ui-kit token or Tailwind `text-[#0e79fd]`

- [x] Task 2 — Create TanStack Router route files for shell and navigation targets (AC: #3, #4)
  - [ ] Create `src/routes/_app.tsx` — pathless layout route (prefix `_`) acting as the authenticated shell container; renders `<Outlet />`
  - [ ] Create `src/routes/_app/clientes.tsx` — route component for `/clientes`; renders `<ClientesPlaceholder />` (stub for Epic 2)
  - [ ] Create `src/routes/_app/contactos.tsx` — route component for `/contactos`; renders `<ContactosPlaceholder />` (stub for Epic 3)
  - [ ] Create `src/routes/index.tsx` — redirects to `/clientes` using TanStack Router `redirect()`
  - [ ] Create `src/routes/$notFound.tsx` (or use `notFoundComponent` in root route) to render a graceful 404 view
  - [ ] Verify TanStack Router plugin auto-generates `routeTree.gen.ts` reflecting all new routes

- [x] Task 3 — Implement placeholder views for Clientes and Contactos (AC: #3)
  - [ ] Create `src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx` — minimal component displaying "Sección Clientes" heading; will be replaced in Epic 2
  - [ ] Create `src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx` — minimal component displaying "Sección Contactos" heading; will be replaced in Epic 3
  - [ ] Both placeholders must be typed (no `any`), functional React components following company naming conventions

- [x] Task 4 — Implement 404 / Not Found view (AC: #4)
  - [ ] Create `src/shared/components/NotFound.tsx` — displays a user-friendly "Página no encontrada" message with a link back to `/clientes`
  - [ ] Wire `NotFound` as the `notFoundComponent` in `src/routes/__root.tsx` via TanStack Router's `createRootRoute({ notFoundComponent: NotFound })`

- [x] Task 5 — Verify keyboard accessibility (AC: #6)
  - [ ] Confirm siesa-ui-kit `NavigationRail` and `NavigationBar` items are natively keyboard navigable; if not, add explicit `tabIndex={0}` and `onKeyDown` handler
  - [ ] Run `axe-core` or equivalent accessibility audit (via RTL + `jest-axe` / `vitest-axe`) against the rendered shell to confirm WCAG 2.1 AA compliance

- [x] Task 6 — Write tests (AC: #1–#6)
  - [ ] Create `src/routes/__root.test.tsx` — component test using Vitest + RTL verifying: NavigationRail renders on desktop viewport, NavigationBar renders on mobile viewport (jsdom viewport override), active route item is highlighted, `<Outlet>` renders child content
  - [ ] Create `src/shared/components/NotFound.test.tsx` — test verifying not-found view renders and link to `/clientes` is present
  - [ ] Add accessibility check with `axe` in at least the root layout test

## Dev Notes

### siesa-ui-kit UI Mandate (MANDATORY)

This story involves creating the main navigation view. **ALL navigation UI components must use siesa-ui-kit**:

- **Library**: `siesa-ui-kit` (already installed per Story 1.1 — `pnpm add siesa-ui-kit`)
- **Components to use**:
  - `NavigationRail` — desktop sidebar navigation (visible at `lg:` breakpoint and above)
  - `NavigationBar` — mobile bottom navigation (visible below `lg:` breakpoint)
- **Constraint**: Do NOT create custom navigation components. siesa-ui-kit components are P0 mandatory.
- Check the siesa-ui-kit catalog for exact prop names (`items`, `activeItem`, `onItemClick`, etc.) before implementation.

### Routing Architecture

- **Router**: TanStack Router file-based (`@tanstack/react-router` v1+). Plugin `@tanstack/router-plugin/vite` auto-generates `src/routeTree.gen.ts` on save — never edit this file manually.
- **Route file prefixes** (mandatory convention):
  - `_` prefix → pathless layout route (no URL segment added). Example: `_app.tsx` + `_app/` folder.
  - `$` prefix → dynamic segment. Example: `clientes.$clienteId.tsx`.
  - Index redirect: `src/routes/index.tsx` must use `redirect({ to: '/clientes' })`.
- **Root route** (`__root.tsx`): Created in Story 1.1. This story modifies it to add the shell layout (NavigationRail/Bar + Outlet).
- **Route tree** for this story:
  ```
  __root.tsx          ← Root layout (NavigationRail/Bar + Outlet)
  ├── index.tsx       ← Redirect → /clientes
  ├── _app.tsx        ← Pathless shell layout
  │   ├── clientes.tsx   → /clientes
  │   └── contactos.tsx  → /contactos
  └── $notFound       ← 404 catch-all
  ```

### Responsive Layout Pattern

```tsx
// src/routes/__root.tsx
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { NotFound } from '../shared/components/NotFound'

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  component: () => {
    const { location } = useRouterState()
    const activeRoute = location.pathname

    const navItems = [
      { id: 'clientes', label: 'Clientes', href: '/clientes' },
      { id: 'contactos', label: 'Contactos', href: '/contactos' },
    ]

    return (
      <div className="flex h-screen">
        {/* Desktop: NavigationRail (left sidebar) — hidden on mobile */}
        <aside className="hidden lg:flex">
          <NavigationRail
            items={navItems}
            activeItem={activeRoute.startsWith('/clientes') ? 'clientes' : 'contactos'}
          />
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Mobile: NavigationBar (bottom) — hidden on desktop */}
        <nav className="flex lg:hidden fixed bottom-0 w-full">
          <NavigationBar
            items={navItems}
            activeItem={activeRoute.startsWith('/clientes') ? 'clientes' : 'contactos'}
          />
        </nav>
      </div>
    )
  },
})
```

> Adapt prop names to the actual siesa-ui-kit API. The pattern above is illustrative.

### Index Route Redirect Pattern

```tsx
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
  component: () => null,
})
```

### Not Found Component Pattern

```tsx
// src/shared/components/NotFound.tsx
import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta que buscas no existe.</p>
      <Link to="/clientes" className="text-[#0e79fd] hover:underline">
        Volver a Clientes
      </Link>
    </div>
  )
}
```

### Styling & Brand Guidelines

- **Primary color (active nav)**: `#0e79fd` (Siesa Blue)
- **Neutrals**: Tailwind `slate-*` scale (e.g., `slate-800`, `slate-100`)
- **Dark mode**: class-based (`darkMode: 'class'`); siesa-ui-kit handles this natively
- **Typography**: Inter font — Light 300 / Regular 400 / Bold 700
- **Breakpoint**: `lg:` (1024px) — critical responsive breakpoint for NavRail vs NavBar switch
- **All user-facing text MUST be in Spanish** ("Clientes", "Contactos", "Página no encontrada", "Volver a Clientes")

### State Management

- **Active route**: derived from `useRouterState()` or `useMatchRoute()` — NO Zustand store needed
- **No server state** in this story (no API calls, no TanStack Query hooks)
- **URL is the source of truth** for navigation state (company standard)

### Testing Standards

- **Framework**: Vitest + React Testing Library (RTL) + MSW (no MSW needed for this story — no API calls)
- **Accessibility**: `jest-axe` or `vitest-axe` for WCAG 2.1 AA compliance checks
- **Viewport simulation**: Use `Object.defineProperty(window, 'innerWidth', ...)` or RTL's `resizeTo` to simulate mobile/desktop breakpoints in tests
- **Test file location**: Co-located with source — `__root.test.tsx` alongside `__root.tsx`, `NotFound.test.tsx` alongside `NotFound.tsx`
- **Test structure**: Arrange / Act / Assert

### Project Structure Notes

- **Files to modify**: `src/routes/__root.tsx` (existing from Story 1.1 — add shell layout)
- **New files to create**:
  ```
  src/routes/index.tsx
  src/routes/_app.tsx
  src/routes/_app/clientes.tsx
  src/routes/_app/contactos.tsx
  src/routes/__root.test.tsx
  src/shared/components/NotFound.tsx
  src/shared/components/NotFound.test.tsx
  src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx
  src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx
  ```
- **Auto-generated (do NOT edit)**: `src/routeTree.gen.ts` — regenerated by `@tanstack/router-plugin/vite` on save
- **No backend changes** in this story — purely frontend

### Key Architectural Constraints

1. No `any` types — TypeScript strict mode is enforced
2. siesa-ui-kit `NavigationRail` and `NavigationBar` are P0 mandatory — do NOT build custom components
3. Navigation must be SPA (no full page reloads) — verified by TanStack Router's client-side navigation
4. All user-facing text in Spanish
5. WCAG 2.1 AA accessibility — keyboard navigation and ARIA labels required
6. Bundle budget: < 500KB gzipped — avoid importing heavy libraries unnecessarily
7. `pnpm` is the mandatory package manager — never use `npm` or `yarn`

### References

- Navigation shell routing structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure → src/routes/]
- FR28–FR30 (SPA navigation, mobile, deep linking): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- Responsive layout strategy (NavigationBar mobile): [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns → Responsive layout]
- TanStack Router file-based prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- siesa-ui-kit P0 mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied → UI]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- WCAG 2.1 AA requirement: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Story 1.1 dev notes (pnpm, siesa-ui-kit install, __root.tsx creation): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]
- Epic acceptance criteria (AC-E1.1, AC-E1.2, AC-E1.3): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Epic 1 Acceptance Criteria]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### Completion Notes List

- `siesa-ui-kit` NavigationRail uses `items: NavigationRailItemProps[]`, `selectedId`, `onItemSelect` props. NavigationBar uses `items: NavigationBarItem[]`, `activeItemId`, `onItemClick` props.
- `navItems` exported from `__root.tsx` for testability (labels + hrefs).
- jsdom added as devDependency; `// @vitest-environment jsdom` added to `root-layout.unit.test.ts` since siesa-ui-kit requires browser globals.
- `environmentMatchGlobs` added to `vitest.config.ts` as additional safeguard.
- Icons implemented as inline SVG ReactNode (no heroicons installed).

### File List

- `frontend/src/routes/__root.tsx` (modified — full navigation shell)
- `frontend/src/routes/index.tsx` (created — redirect to /clientes)
- `frontend/src/routes/_app.tsx` (created — pathless layout)
- `frontend/src/routes/_app/clientes.tsx` (created)
- `frontend/src/routes/_app/contactos.tsx` (created)
- `frontend/src/shared/components/NotFound.tsx` (created)
- `frontend/src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx` (created)
- `frontend/src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx` (created)
- `frontend/src/routes/__tests__/root-layout.unit.test.ts` (modified — added @vitest-environment jsdom)
- `frontend/vitest.config.ts` (modified — added environmentMatchGlobs + jsdom devDep)
- `frontend/package.json` (modified — added jsdom devDependency)
