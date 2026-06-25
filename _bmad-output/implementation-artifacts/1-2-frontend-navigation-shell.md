# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser (viewport < 1024px), **When** the user views the app, **Then** a mobile-responsive NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen (deep linking — FR30).

4. **Given** the user navigates to an unknown route (e.g. `/unknown`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish.

5. **Given** the navigation is rendered, **When** a screen reader or keyboard user navigates it, **Then** all navigation links have accessible labels (`aria-label`) in Spanish and are reachable via Tab key (WCAG 2.1 AA).

6. **Given** the user is on `/clientes` or `/contactos`, **When** the navigation is visible, **Then** the active route link is visually highlighted (active state) to indicate the current section.

## Tasks / Subtasks

- [ ] Task 1 — Create `_app` pathless layout route (AC: #1, #2, #5, #6)
  - [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route (TanStack Router `_` prefix) rendering `LayoutBase` from siesa-ui-kit with `NavigationRail` (desktop) and `NavigationBar` (mobile) based on `lg` breakpoint
  - [ ] Import siesa-ui-kit `NavigationRail` and `NavigationBar` components; verify via `pnpm list siesa-ui-kit` that the package is installed
  - [ ] Add navigation items: `{ label: 'Clientes', href: '/clientes', icon: <UsersIcon /> }` and `{ label: 'Contactos', href: '/contactos', icon: <UserIcon /> }` (Heroicons)
  - [ ] Use TanStack Router `<Link>` (not `<a>`) to prevent full page reloads; apply `activeProps={{ className: 'active' }}` or the siesa-ui-kit active variant for active state highlighting
  - [ ] Use TailwindCSS v4 responsive utilities (`hidden lg:flex` / `flex lg:hidden`) to switch between NavigationRail (desktop) and NavigationBar (mobile)
  - [ ] Add `aria-label` to each navigation item in Spanish ("Ir a Clientes", "Ir a Contactos") and `role="navigation"` to the nav wrapper (WCAG 2.1 AA)
  - [ ] Add `<Outlet />` to render child routes inside the layout

- [ ] Task 2 — Create child route files under `_app/` (AC: #1, #3)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — renders `<ClientesPlaceholder />` (empty placeholder component with Spanish heading "Clientes"); queryKey and data loading deferred to Epic 2
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — renders `<ContactosPlaceholder />` (empty placeholder component with Spanish heading "Contactos"); queryKey and data loading deferred to Epic 3
  - [ ] Verify TanStack Router plugin auto-generates updated `routeTree.gen.ts` on build

- [ ] Task 3 — Create root redirect and not-found route (AC: #3, #4)
  - [ ] Update `frontend/src/routes/index.tsx` to redirect `/` → `/clientes` using TanStack Router `<Navigate to="/clientes" />` or `redirect` in loader
  - [ ] Create `frontend/src/routes/not-found.tsx` (or `$404.tsx`) displaying a Spanish not-found message: "Página no encontrada" with a link back to Clientes

- [ ] Task 4 — Update `__root.tsx` shell (AC: #1, #2)
  - [ ] Update `frontend/src/routes/__root.tsx` to serve as the top-level shell that wraps all routes; ensure it renders `<Outlet />` for child routes to inject into
  - [ ] Apply global TailwindCSS layout: `flex min-h-screen` so NavigationRail and content area display side by side on desktop

- [ ] Task 5 — Write unit and component tests (AC: #1–#6)
  - [ ] Write `frontend/src/routes/__tests__/navigation.test.tsx` using Vitest + React Testing Library + MSW:
    - Renders NavigationRail with "Clientes" and "Contactos" links on desktop viewport (mock `window.innerWidth = 1280`)
    - Renders NavigationBar on mobile viewport (mock `window.innerWidth = 375`)
    - Active route link receives active styling when current path matches
    - Navigation links have correct `aria-label` attributes in Spanish
    - Navigating to `/clientes` renders `ClientesPlaceholder`; navigating to `/contactos` renders `ContactosPlaceholder`
    - Navigating to unknown route renders not-found view
  - [ ] Run `pnpm run test` — all tests must pass

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `pnpm add siesa-ui-kit` (already installed in Story 1.1 — verify with `pnpm list siesa-ui-kit`)
- **Components to use**:
  - `NavigationRail` — persistent left-side nav for desktop (lg+)
  - `NavigationBar` — bottom nav for mobile (< lg)
  - `LayoutBase` — wraps content area alongside the navigation
- **Constraint**: Do not create custom navigation components if siesa-ui-kit equivalents exist. Check siesa-ui-kit catalog FIRST.
- **MasterCrud**: NOT applicable to this story — no CRUD screen or data grid involved.

### Frontend Architecture

This story is **purely a presentation/routing story** — no backend calls, no TanStack Query hooks, no Zustand store. All state is URL-driven via TanStack Router.

**Route tree after this story:**

```
src/routes/
  __root.tsx                    # Root layout shell (Outlet only)
  index.tsx                     # Redirect → /clientes
  _app.tsx                      # Pathless layout: NavigationRail + NavigationBar + Outlet
  _app/
    clientes.tsx                # /clientes — ClientesPlaceholder
    contactos.tsx               # /contactos — ContactosPlaceholder
  not-found.tsx                 # 404 fallback
```

**TanStack Router key rules:**
- `_app.tsx` prefix `_` makes it a pathless layout — it renders no URL segment but wraps `/clientes` and `/contactos`
- Use `<Link>` from `@tanstack/react-router` — never `<a href>` for internal navigation
- `routeTree.gen.ts` is auto-generated by `@tanstack/router-plugin/vite` — do NOT manually edit it
- Deep linking is handled automatically by TanStack Router file-based routing — no extra config needed

**Breakpoint for nav switching:** `lg` = 1024px (TailwindCSS v4 default). Desktop shows NavigationRail; mobile shows NavigationBar.

```tsx
// Pattern for conditional nav rendering in _app.tsx
<div className="hidden lg:flex">
  <NavigationRail items={navItems} />
</div>
<div className="flex lg:hidden">
  <NavigationBar items={navItems} />
</div>
<main className="flex-1">
  <Outlet />
</main>
```

**Navigation items configuration:**

```tsx
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { Link, useRouterState } from '@tanstack/react-router'

const navItems = [
  { label: 'Clientes', to: '/clientes', icon: <UsersIcon className="size-5" />, ariaLabel: 'Ir a Clientes' },
  { label: 'Contactos', to: '/contactos', icon: <UserIcon className="size-5" />, ariaLabel: 'Ir a Contactos' },
]
```

**Active route detection:** TanStack Router `<Link>` supports `activeProps` and `inactiveProps`. Use `activeProps={{ 'aria-current': 'page', className: 'nav-active' }}` for accessibility and styling.

**Root redirect pattern (index.tsx):**

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

### Accessibility Requirements (WCAG 2.1 AA)

- Navigation landmark: wrap nav in `<nav aria-label="Navegación principal">` 
- Each nav link: `aria-label` in Spanish (e.g., "Ir a Clientes")
- Active link: `aria-current="page"` attribute
- Keyboard: all links reachable via Tab, Enter activates navigation
- Color contrast: siesa-ui-kit components are pre-compliant; verify custom styles meet 4.5:1 ratio

### Style & Brand Constraints

- Primary brand color `#0e79fd` (Siesa Blue) — use via siesa-ui-kit tokens or `text-[#0e79fd]`
- Font: Inter (loaded via siesa-ui-kit or `@fontsource/inter`)
- Dark mode: class-based (`dark:` variants) — siesa-ui-kit handles this natively
- All user-facing text in Spanish: "Clientes", "Contactos", "Página no encontrada"

### Testing Standards

- **Framework**: Vitest + React Testing Library + MSW (already configured in Story 1.1)
- **Test file location**: co-located in `src/routes/__tests__/` or alongside the route file
- **Viewport mocking**: use `Object.defineProperty(window, 'innerWidth', { value: 375 })` or `vi.stubGlobal` for mobile/desktop simulation
- **Router testing**: wrap components with `RouterProvider` using `createMemoryHistory` from `@tanstack/react-router`
- **Accessibility check**: use `@testing-library/jest-dom` `toBeVisible`, `toHaveAttribute('aria-current', 'page')`

### Previous Story Context (1.1)

From Story 1.1 implementation:
- `pnpm` is the package manager — use `pnpm` for all installs
- `siesa-ui-kit` is already installed in `frontend/package.json`
- `__root.tsx` exists as a shell placeholder — update it rather than replace
- `src/routes/index.tsx` exists and needs to be updated to redirect to `/clientes`
- Vite uses a single `tsconfig.json` (not split `tsconfig.app.json`) — confirmed in Story 1.1 debug log
- `@tanstack/router-plugin/vite` is configured in `vite.config.ts` — `routeTree.gen.ts` auto-generates
- TypeScript strict mode is active — no `any` types, `strictNullChecks: true`

### Git History Pattern

Recent commits follow: `feat(story-X.Y): description` format. New commits for this story should follow: `feat(story-1.2): description`.

### Project Structure Notes

- Files added by this story fit directly into the existing structure from Story 1.1
- No new top-level directories needed — `_app.tsx` and `_app/` folder go inside existing `src/routes/`
- No backend changes — this story is frontend-only
- No environment variables needed — all routing is client-side

### References

- Routing architecture and file structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Navigation pattern (NavigationRail + NavigationBar): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- TanStack Router prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- FR28, FR29, FR30 (navigation + mobile + deep linking): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- siesa-ui-kit P0 mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Company standards (stack, accessibility, Spanish UI): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Agent Record]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
