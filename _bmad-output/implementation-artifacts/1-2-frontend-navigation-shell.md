# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a `NavigationRail` component from `siesa-ui-kit` is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser (viewport < 1024px), **When** the user views the app, **Then** the `NavigationRail` is hidden and a `NavigationBar` component from `siesa-ui-kit` is displayed at the bottom instead, and all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct route view is rendered and the corresponding navigation item is highlighted as active — without redirecting to a home screen (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/unknown`), **When** the page loads, **Then** a 404 Not Found view is displayed with a message in Spanish (e.g., "Página no encontrada") and a link/button to navigate back to `/clientes`.

5. **Given** the root path `/` is accessed, **When** the page loads, **Then** the user is redirected to `/clientes` automatically.

6. **Given** any navigation action occurs, **When** checking browser console, **Then** there are zero TypeScript errors and zero React render errors.

## Tasks / Subtasks

- [ ] Task 1 — Create the application shell layout route with responsive navigation (AC: #1, #2, #3)
  - [ ] Update `frontend/src/routes/__root.tsx` to render the shell layout that hosts `NavigationRail` (desktop) and `NavigationBar` (mobile) from `siesa-ui-kit`, with an `<Outlet />` for nested routes
  - [ ] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit`; use TailwindCSS responsive classes (`hidden lg:flex` / `flex lg:hidden`) to toggle between them
  - [ ] Wire navigation items: label "Clientes" → `href="/clientes"`, label "Contactos" → `href="/contactos"`; use Heroicons for item icons (e.g., `UserGroupIcon` for Clientes, `UserIcon` for Contactos)
  - [ ] Mark active item using TanStack Router's `useMatchRoute` or the router's `activeProps` — highlight the active route in the nav component

- [ ] Task 2 — Create `/clientes` and `/contactos` placeholder route files (AC: #3)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` rendering a placeholder `<div>` with Spanish text "Sección Clientes" (will be replaced in Epic 2)
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` rendering a placeholder `<div>` with Spanish text "Sección Contactos" (will be replaced in Epic 3)
  - [ ] Ensure these routes are nested under the `_app` pathless layout so the navigation shell wraps them

- [ ] Task 3 — Create root redirect from `/` to `/clientes` (AC: #5)
  - [ ] Update `frontend/src/routes/index.tsx` to use TanStack Router's `redirect` in `beforeLoad` or `loader` to redirect from `/` to `/clientes`

- [ ] Task 4 — Create the 404 Not Found view (AC: #4)
  - [ ] Create `frontend/src/routes/not-found.tsx` (or configure `notFoundComponent` in `__root.tsx`) with a Spanish "Página no encontrada" message and a navigation link back to `/clientes`
  - [ ] Configure TanStack Router's `notFoundComponent` in `__root.tsx` to use this component for all unmatched routes

- [ ] Task 5 — Write tests (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/routes/__tests__/navigation.test.tsx` with Vitest + RTL tests:
    - Active route highlighting: render shell at `/clientes` and assert "Clientes" item has active styles
    - Active route highlighting: render shell at `/contactos` and assert "Contactos" item has active styles
    - 404 view renders Spanish "Página no encontrada" for unknown routes
  - [ ] Create E2E Playwright spec `e2e/story-1.2-navigation-shell.spec.ts`:
    - Desktop viewport: NavigationRail visible, NavigationBar hidden
    - Mobile viewport: NavigationBar visible, NavigationRail hidden
    - Navigate to `/clientes` — correct view rendered, nav item active
    - Navigate to `/contactos` — correct view rendered, nav item active
    - Deep link to `/clientes` directly — renders without redirect
    - Deep link to `/contactos` directly — renders without redirect
    - Navigate to `/unknown` — 404 view shown
    - Navigate to `/` — redirected to `/clientes`

## Dev Notes

### Architecture & Stack Constraints

- **Package manager**: `pnpm` — do NOT use npm or yarn
- **React version**: 19+ (functional components only, no class components)
- **TypeScript**: strict mode — `"strict": true`, NO `any` types
- **UI components**: Check `siesa-ui-kit` catalog FIRST for `NavigationRail` and `NavigationBar`. Do NOT build custom nav components if equivalents exist in the kit.
- **siesa-ui-kit install**: Already installed via `pnpm add siesa-ui-kit` in Story 1.1. Do NOT reinstall.
- **Styling**: TailwindCSS v4 — import via `@import "tailwindcss"` in `src/index.css`. Use `slate-*` for neutrals. Brand primary: `#0e79fd`.
- **Icons**: Use Heroicons (already available or install `@heroicons/react` via `pnpm add @heroicons/react`)
- **No authentication in MVP**: No auth guards on routes. All routes are publicly accessible.
- **No backend calls in this story**: Pure frontend routing and layout.

### TanStack Router Patterns

This project uses **file-based routing** with `@tanstack/router-plugin/vite`. Key file conventions from Story 1.1:

```
src/routes/
  __root.tsx          # Root layout (shell with nav) — already exists, needs update
  index.tsx           # / → redirect to /clientes — already exists, needs update
  _app.tsx            # Pathless layout shell (_app prefix = no URL segment)
  _app/
    clientes.tsx      # /clientes route
    contactos.tsx     # /contactos route
```

The `_` prefix creates a **pathless layout route** — it wraps child routes without adding a URL segment. This is the correct pattern for the navigation shell.

**Root layout update pattern:**

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <div className="flex h-screen">
      {/* Desktop NavigationRail — hidden on mobile */}
      <div className="hidden lg:flex">
        <NavigationRail items={navItems} />
      </div>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {/* Mobile NavigationBar — hidden on desktop */}
      <div className="flex lg:hidden fixed bottom-0 w-full">
        <NavigationBar items={navItems} />
      </div>
    </div>
  )
}
```

**Redirect pattern (TanStack Router v1):**

```typescript
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
  component: () => null,
})
```

**404 component:**

```typescript
// inside __root.tsx or a dedicated file
function NotFoundView() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-500">La ruta solicitada no existe.</p>
      <button onClick={() => navigate({ to: '/clientes' })} className="...">
        Volver a Clientes
      </button>
    </div>
  )
}
```

### siesa-ui-kit Navigation Components

Per company standards: **check siesa-ui-kit catalog first** before any custom component.

Expected siesa-ui-kit API pattern for navigation (verify against actual package):

```typescript
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'

const navItems = [
  { label: 'Clientes', href: '/clientes', icon: <UserGroupIcon /> },
  { label: 'Contactos', href: '/contactos', icon: <UserIcon /> },
]

// Desktop
<NavigationRail items={navItems} activeHref={currentPath} />

// Mobile
<NavigationBar items={navItems} activeHref={currentPath} />
```

If `siesa-ui-kit` does not export `NavigationRail` or `NavigationBar`, fall back to custom implementation using `shadcn/ui` or Tailwind directly — document this decision in Dev Agent Record.

To discover active path in TanStack Router:

```typescript
import { useRouter } from '@tanstack/react-router'
const router = useRouter()
const currentPath = router.state.location.pathname
```

### Responsive Breakpoint

Critical breakpoint per architecture: **lg = 1024px**

```css
/* Desktop: NavigationRail visible, NavigationBar hidden */
hidden lg:flex   /* applied to NavigationRail wrapper */

/* Mobile: NavigationBar visible, NavigationRail hidden */
flex lg:hidden   /* applied to NavigationBar wrapper */
```

### Project Structure Notes

Files to create or modify in this story:

```
frontend/src/routes/
  __root.tsx                    ← MODIFY: add NavigationRail + NavigationBar + notFoundComponent
  index.tsx                     ← MODIFY: add redirect to /clientes
  _app.tsx                      ← CREATE: pathless layout (may be needed for route nesting)
  _app/
    clientes.tsx                ← CREATE: placeholder view for /clientes
    contactos.tsx               ← CREATE: placeholder view for /contactos
  __tests__/
    navigation.test.tsx         ← CREATE: Vitest + RTL tests
e2e/
  story-1.2-navigation-shell.spec.ts  ← CREATE: Playwright E2E tests
```

No backend files. No modules or domain layer changes (routing lives in `src/routes/` per TanStack Router architecture).

### Testing Standards

- **Unit/Component tests**: Vitest + React Testing Library (RTL) + MSW
- **Accessibility**: Use `@testing-library/jest-dom` axe checks where applicable (WCAG 2.1 AA)
- **E2E**: Playwright specs in `e2e/` directory (follows pattern from Story 1.1)
- **All user-facing text**: Spanish — labels, ARIA labels, placeholder text, error messages
- **Test structure**: Arrange / Act / Assert

**RTL test example pattern:**

```typescript
import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

it('highlights Clientes nav item when at /clientes', async () => {
  // Arrange
  const history = createMemoryHistory({ initialEntries: ['/clientes'] })
  const router = createRouter({ routeTree, history })
  // Act
  render(<RouterProvider router={router} />)
  // Assert
  const item = screen.getByRole('link', { name: /clientes/i })
  expect(item).toHaveAttribute('aria-current', 'page') // or active class check
})
```

### Previous Story Learnings (Story 1.1)

- `routeTree.gen.ts` is **auto-generated** by the `@tanstack/router-plugin/vite` on build — do NOT edit it manually; adding new route files triggers regeneration.
- `pnpm run dev` (not `npm run dev`) — mandatory per company standards.
- Vite 8 was installed (not 7), React 19 (not 18) — both exceed minimum requirements.
- `frontend/src/routes/__root.tsx` already exists as a placeholder from Story 1.1. Update it in-place.
- `frontend/src/routes/index.tsx` already exists. Update it to add the redirect.
- `data-testid` attributes may be needed for Playwright assertions — add them to key navigation elements.
- shadcn/ui was skipped in Story 1.1 — siesa-ui-kit is the sole UI component source.

### Git Commit Convention (from history)

```
feat(story-1.2): implement Frontend Navigation Shell
```

### References

- Epic source and AC: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- TanStack Router file-based routing: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Navigation shell file structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Responsive breakpoint lg:1024px: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]
- siesa-ui-kit P0 mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- TanStack Router prefix conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Previous story structure and learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- FR28, FR29, FR30 — Navigation requirements: [Source: _bmad-output/planning-artifacts/architecture.md#Project Context Analysis]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
