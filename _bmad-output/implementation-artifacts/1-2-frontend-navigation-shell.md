# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a `NavigationRail` component from `siesa-ui-kit` is visible on the left side with "Clientes" and "Contactos" navigation entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a `NavigationBar` component from `siesa-ui-kit` is displayed at the bottom instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen, and the corresponding navigation item appears active/highlighted (FR30).

4. **Given** the user navigates to an unknown route (e.g. `/unknown`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish.

5. **Given** the root path `/` is accessed, **When** the page loads, **Then** the user is redirected to `/clientes` automatically.

6. **Given** any navigation item is rendered, **When** a screen reader traverses the navigation, **Then** all interactive elements have proper ARIA labels in Spanish and the navigation landmark is correctly identified (WCAG 2.1 AA).

## Tasks / Subtasks

- [ ] Task 1 — Update `__root.tsx` with responsive navigation shell (AC: #1, #2, #6)
  - [ ] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit`
  - [ ] Define navigation items array: `[{ label: 'Clientes', to: '/clientes', icon: ... }, { label: 'Contactos', to: '/contactos', icon: ... }]`
  - [ ] Render `NavigationRail` for desktop (`hidden lg:flex`) and `NavigationBar` for mobile (`flex lg:hidden`)
  - [ ] Wire TanStack Router `<Link>` or the kit component's built-in navigation to route paths `/clientes` and `/contactos`
  - [ ] Use `useRouterState` or `useMatchRoute` from `@tanstack/react-router` to highlight the active navigation item
  - [ ] Wrap main content area in `<Outlet />` from TanStack Router inside the layout
  - [ ] Add `aria-label="Navegación principal"` to the navigation container (WCAG 2.1 AA)
  - [ ] Verify no full page reload occurs when switching routes (SPA navigation)

- [ ] Task 2 — Create `_app.tsx` layout route and nested routes (AC: #3)
  - [ ] Create `frontend/src/routes/_app.tsx` as a pathless layout route using TanStack Router `createFileRoute('/_app')`
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` rendering a `ClientesPlaceholder` component (text: "Clientes — próximamente")
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` rendering a `ContactosPlaceholder` component (text: "Contactos — próximamente")
  - [ ] Ensure TanStack Router plugin auto-generates updated `routeTree.gen.ts` on file save

- [ ] Task 3 — Implement root redirect and 404 route (AC: #4, #5)
  - [ ] Update `frontend/src/routes/index.tsx` to redirect to `/clientes` using TanStack Router `redirect` in `beforeLoad`
  - [ ] Create `frontend/src/routes/$notFound.tsx` (or use TanStack Router `notFoundComponent` in `__root.tsx`) rendering a 404 view with Spanish message

- [ ] Task 4 — Validate siesa-ui-kit component integration
  - [ ] Confirm `siesa-ui-kit` is already listed in `frontend/package.json` (installed in Story 1.1)
  - [ ] Confirm `siesa-ui-kit/styles.css` is imported in `frontend/src/main.tsx` (done in Story 1.1)
  - [ ] Check siesa-ui-kit catalog for `NavigationRail` and `NavigationBar` component APIs before implementation

- [ ] Task 5 — Write unit and component tests (AC: #1–#6)
  - [ ] Create `frontend/src/routes/__tests__/__root.test.tsx` with Vitest + RTL
  - [ ] Test: `NavigationRail` renders with "Clientes" and "Contactos" links at lg+ viewport
  - [ ] Test: `NavigationBar` renders at mobile viewport (jsdom `matchMedia` mock)
  - [ ] Test: Clicking "Clientes" navigates to `/clientes` (use `MemoryRouter` or TanStack Router test utils)
  - [ ] Test: Clicking "Contactos" navigates to `/contactos`
  - [ ] Test: Active navigation item is highlighted when route matches
  - [ ] Test: 404 component renders for unknown routes
  - [ ] Test: Accessibility check with `axe` via `@axe-core/react` or `jest-axe` (ARIA labels present)

## Dev Notes

### Architecture Context

This story is **pure frontend** — no backend changes required. It extends the shell created in Story 1.1.

**UI Component Priority (mandatory order):**
1. `siesa-ui-kit` (P0 — check NavigationRail and NavigationBar first)
2. `shadcn/ui` fallback (note: shadcn init was deferred in Story 1.1 due to proxy policy)
3. Custom components as last resort

**siesa-ui-kit NavigationRail/NavigationBar usage:**
- Install: already installed as `siesa-ui-kit@1.0.245` in Story 1.1 (`frontend/package.json`)
- Styles: `siesa-ui-kit/styles.css` already imported in `frontend/src/main.tsx`
- Check the kit catalog for exact component API: prop names, slot patterns, active state API
- Do NOT build custom nav components — use kit components exclusively

### TanStack Router Routing Pattern

The architecture defines this file-based routing structure:

```
frontend/src/routes/
├── __root.tsx           # Root layout — LayoutBase + NavigationRail/Bar
├── index.tsx            # Redirect → /clientes
├── _app.tsx             # Pathless layout route (no URL segment)
└── _app/
    ├── clientes.tsx     # /clientes route (placeholder for Epic 2)
    └── contactos.tsx    # /contactos route (placeholder for Epic 3)
```

**TanStack Router prefix rules:**
- `_` prefix → pathless layout (no URL segment added), e.g. `_app.tsx` does NOT add `/app` to the URL
- `$` prefix → dynamic parameter (not used in this story)
- `-` prefix → ignored by router (colocated non-route files)

**Pathless layout (`_app.tsx`) pattern:**
```tsx
// frontend/src/routes/_app.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: () => <Outlet />,  // or wrap with additional layout
})
```

**Root redirect (`index.tsx`) pattern:**
```tsx
// frontend/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

**404 handling in `__root.tsx`:**
```tsx
// In createRootRoute options:
export const Route = createRootRoute({
  notFoundComponent: () => (
    <div role="main">
      <h1>Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
    </div>
  ),
})
```

**Active link detection:**
```tsx
// Use TanStack Router Link component activeProps
import { Link } from '@tanstack/react-router'

<Link to="/clientes" activeProps={{ className: 'active' }}>
  Clientes
</Link>
```

### Responsive Layout Pattern

The architecture specifies a critical breakpoint of `lg: 1024px`:

```tsx
// __root.tsx layout structure
function RootLayout() {
  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail on left */}
      <nav aria-label="Navegación principal" className="hidden lg:flex">
        <NavigationRail items={navItems} />
      </nav>
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {/* Mobile: NavigationBar at bottom */}
      <nav aria-label="Navegación principal" className="flex lg:hidden fixed bottom-0 w-full">
        <NavigationBar items={navItems} />
      </nav>
    </div>
  )
}
```

### Accessibility Requirements (WCAG 2.1 AA)

- Navigation landmark: `<nav aria-label="Navegación principal">`
- All navigation links must have visible focus indicators (TailwindCSS `focus:ring`)
- Color contrast: siesa-ui-kit tokens meet AA by default; verify active state contrast
- All user-facing text MUST be in Spanish: "Clientes", "Contactos", "Página no encontrada"
- Icons must have `aria-hidden="true"` if decorative, or `aria-label` if standalone

### State Management

Per architecture decision: **No Zustand store required for navigation state in MVP**. URL is the source of truth. TanStack Router's built-in `useRouterState()` or `<Link activeProps>` handles active state detection.

```typescript
// DO NOT use Zustand for navigation active state
// DO USE TanStack Router's built-in active link detection
```

### siesa-ui-kit Mandate

```markdown
### UI Implementation Requirements (MANDATORY)
- **Library**: `siesa-ui-kit`
- **Install**: already installed as `siesa-ui-kit@1.0.245` — verify via `frontend/package.json`
- **Usage**: You MUST use `siesa-ui-kit` `NavigationRail` (desktop) and `NavigationBar` (mobile) components.
- **Constraint**: Do not create custom navigation components — use the kit's components exclusively.
- **Styles**: `siesa-ui-kit/styles.css` is already imported in `frontend/src/main.tsx` (Story 1.1).
```

### Previous Story Context (Story 1.1)

From Story 1.1 Dev Notes and Completion Notes:
- `frontend/src/routes/__root.tsx` already exists as a shell placeholder with `data-testid="app-root"`
- `siesa-ui-kit@1.0.245` is installed; `siesa-ui-kit/styles.css` imported in `main.tsx`
- `shadcn/ui` init was deferred (proxy policy) — do NOT depend on shadcn for this story
- `pnpm` is mandatory package manager — use `pnpm add` for any new dependencies
- TanStack Router plugin (`@tanstack/router-plugin/vite`) is configured in `vite.config.ts` and auto-generates `routeTree.gen.ts`
- Vite dev server runs on port 5173

### Testing Standards

- Framework: Vitest + React Testing Library + MSW (installed in Story 1.1)
- Co-locate tests: `__tests__/` folder adjacent to the component, or `*.test.tsx` alongside source file
- Accessibility: use `jest-axe` or `@axe-core/react` for ARIA validation
- For viewport-dependent tests (mobile vs desktop): mock `window.matchMedia` in test setup
- Test structure: Arrange / Act / Assert

```typescript
// Example test pattern
import { render, screen } from '@testing-library/react'
import { createMemoryHistory, RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

describe('Root Navigation Shell', () => {
  it('renders Clientes navigation item', async () => {
    // Arrange
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/clientes'] }) })
    // Act
    render(<RouterProvider router={router} />)
    // Assert
    expect(screen.getByRole('link', { name: /clientes/i })).toBeInTheDocument()
  })
})
```

### Project Structure Notes

Files to create or modify in this story:

```
frontend/src/
├── routes/
│   ├── __root.tsx              ← MODIFY: add NavigationRail + NavigationBar layout
│   ├── index.tsx               ← MODIFY: add redirect to /clientes
│   ├── _app.tsx                ← CREATE: pathless layout route
│   └── _app/
│       ├── clientes.tsx        ← CREATE: /clientes placeholder view
│       └── contactos.tsx       ← CREATE: /contactos placeholder view
```

No changes to `src/modules/`, `src/shared/`, or any backend files in this story.

### References

- Routing structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- TanStack Router prefix rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- siesa-ui-kit P0 mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied]
- Responsive breakpoint + NavigationRail/Bar: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]
- Active state / no Zustand for nav: [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Story 1.1 completion context: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]
- Epic ACs (FR28, FR29, FR30): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- WCAG 2.1 AA requirement: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
