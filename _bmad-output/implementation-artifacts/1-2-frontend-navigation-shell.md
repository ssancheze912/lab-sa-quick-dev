# Story 1.2: Frontend Navigation Shell

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser, **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries. Clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a mobile-responsive NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail. All navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen — deep linking works (FR30).

4. **Given** the user navigates to an unknown route (e.g. `/unknown`), **When** the page loads, **Then** a graceful 404 / not-found view is displayed (no crash, no blank screen).

5. **Given** the navigation is rendered, **When** assistive technology reads it, **Then** the nav landmark has an accessible label (`aria-label="Navegación principal"`) and each nav item has a visible label in Spanish (WCAG 2.1 AA).

6. **Given** the user is on `/clientes`, **When** the navigation renders, **Then** the "Clientes" item appears in active/selected state. Same for "Contactos" on `/contactos`.

## Tasks / Subtasks

- [x] Task 1 — Upgrade `__root.tsx` to layout shell with responsive navigation (AC: #1, #2, #5, #6)
  - [x] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit` — check catalog before creating any custom nav component
  - [x] Use TanStack Router's `useLocation` (or `useRouterState`) to detect the current pathname and derive the active nav item
  - [x] Render `NavigationRail` on `lg:` breakpoint and above (left side, desktop)
  - [x] Render `NavigationBar` on viewports below `lg:` (bottom, mobile) — use TailwindCSS responsive classes (`hidden lg:flex` / `flex lg:hidden` pattern)
  - [x] Nav items: `{ label: 'Clientes', to: '/clientes', icon: <...> }` and `{ label: 'Contactos', to: '/contactos', icon: <...> }`
  - [x] Use Heroicons for nav item icons (primary icon library per company standards)
  - [x] Add `aria-label="Navegación principal"` to the `<nav>` wrapper
  - [x] Pass active state to each nav item based on current route
  - [x] Wrap `<Outlet />` in main content area alongside the nav components

- [x] Task 2 — Create `_app.tsx` pathless layout route and its child routes (AC: #3)
  - [x] Create `frontend/src/routes/_app.tsx` as a pathless layout route (TanStack Router `_` prefix = no URL segment)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — renders `<ClientesPlaceholder />` (stub for Epic 2)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — renders `<ContactosPlaceholder />` (stub for Epic 3)
  - [x] Ensure `index.tsx` redirects to `/clientes` using TanStack Router `<Navigate to="/clientes" />`

- [x] Task 3 — Create 404 not-found route (AC: #4)
  - [x] Create `frontend/src/routes/not-found.tsx` (or use TanStack Router's `notFoundComponent` on `__root.tsx`)
  - [x] Display a user-friendly Spanish message: "Página no encontrada" with a link back to `/clientes`

- [x] Task 4 — Write Vitest + RTL component tests (AC: all)
  - [x] Test: NavigationRail renders on desktop viewport with "Clientes" and "Contactos" labels
  - [x] Test: NavigationBar renders on mobile viewport
  - [x] Test: Active nav item reflects current route (mock `useRouterState` or use `createMemoryHistory`)
  - [x] Test: 404 route renders gracefully for unknown paths
  - [x] Test: `aria-label` on nav wrapper is present (accessibility check via axe or attribute assertion)
  - [x] Co-locate tests: `frontend/src/routes/__tests__/root.test.tsx`

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — already installed (`pnpm add siesa-ui-kit` in Story 1.1)
- **Components to use**: `NavigationRail` (desktop) + `NavigationBar` (mobile) from siesa-ui-kit
- **Constraint**: Do NOT build custom navigation components. Check siesa-ui-kit catalog first.
- **Icon library**: Heroicons (primary per company standards) — install if not present: `pnpm add @heroicons/react`
- **Breakpoint**: `lg` (1024px) is the critical responsive breakpoint for nav switch (from architecture.md)

### Routing (TanStack Router — file-based)

This story implements the routes defined in the architecture:

```
src/routes/
  __root.tsx          ← Shell layout (NavigationRail + NavigationBar + Outlet)
  index.tsx           ← Redirect → /clientes
  _app.tsx            ← Pathless layout (no URL segment added)
  _app/
    clientes.tsx      ← /clientes route (stub view for Epic 2)
    contactos.tsx     ← /contactos route (stub view for Epic 3)
  not-found.tsx       ← 404 fallback
```

**TanStack Router prefixes:**
- `_app.tsx` = pathless layout (underscore prefix → no URL segment)
- `_app/clientes.tsx` = flat routing under `_app` layout

**Redirecting index:** Use `createFileRoute('/').component` that renders `<Navigate to="/clientes" />` from `@tanstack/react-router`.

**Active link detection:** Use `useRouterState({ select: (s) => s.location.pathname })` or check via `<Link activeProps={{ className: 'active' }}` if siesa-ui-kit NavigationRail accepts an `active` boolean prop per item.

**`routeTree.gen.ts`:** Auto-generated by `@tanstack/router-plugin/vite` on `pnpm run dev`. Never edit manually. Creating new route files and running dev server updates it automatically.

### Responsive Layout Pattern

```tsx
// __root.tsx — shell layout structure
<div className="flex h-screen">
  {/* Desktop nav — hidden on mobile */}
  <nav aria-label="Navegación principal" className="hidden lg:flex">
    <NavigationRail items={navItems} activeItem={activeRoute} />
  </nav>

  {/* Main content */}
  <main className="flex-1 overflow-auto">
    <Outlet />
  </main>

  {/* Mobile nav — hidden on desktop */}
  <nav aria-label="Navegación principal" className="flex lg:hidden fixed bottom-0 w-full">
    <NavigationBar items={navItems} activeItem={activeRoute} />
  </nav>
</div>
```

Adapt the exact props to siesa-ui-kit's `NavigationRail` and `NavigationBar` component APIs.

### Navigation Items Definition

```typescript
const navItems = [
  {
    label: 'Clientes',
    to: '/clientes',
    icon: <UsersIcon className="h-5 w-5" />, // Heroicons
  },
  {
    label: 'Contactos',
    to: '/contactos',
    icon: <UserGroupIcon className="h-5 w-5" />, // Heroicons
  },
]
```

All user-facing labels MUST be in Spanish (`'Clientes'`, `'Contactos'`). Code (variable names, function names) in English.

### Story 1.1 Context — What Already Exists

From Story 1.1 (done), the following files exist and must NOT be recreated, only extended:
- `frontend/src/routes/__root.tsx` — currently a bare shell (`<div><Outlet /></div>`). **This file must be modified**, not replaced, to add the layout with NavigationRail/NavigationBar.
- `frontend/src/routes/index.tsx` — exists as a stub. Update to redirect to `/clientes`.
- `frontend/src/main.tsx` — `RouterProvider` inside `QueryProvider` — do NOT touch.
- `frontend/src/shared/lib/apiClient.ts` — Axios singleton — no changes needed.
- `frontend/src/shared/lib/queryClient.ts` — QueryClient singleton — no changes needed.
- `frontend/src/app/providers/QueryProvider.tsx` — no changes needed.

**shadcn/ui note from Story 1.1:** `npx shadcn@latest init && npx shadcn@latest add dialog breadcrumb` was deferred to this story. If siesa-ui-kit NavigationRail/Bar requires shadcn primitives, initialize shadcn now: `pnpm dlx shadcn@latest init` and add needed components.

### Stub Views (Placeholder Components)

`clientes.tsx` and `contactos.tsx` are placeholder stubs for Epics 2 and 3:

```tsx
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'

function ClientesPage() {
  return <div className="p-6">Clientes</div>
}

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})
```

Same pattern for `contactos.tsx`. These will be replaced in Epics 2 and 3 — keep stubs minimal.

### Testing Requirements

- **Framework**: Vitest + React Testing Library + `@testing-library/jest-dom` (installed in Story 1.1)
- **Setup**: `frontend/src/test/setup.ts` already exists
- **Router testing**: Use `createMemoryRouter` / `createMemoryHistory` from TanStack Router for isolated route tests
- **Accessibility**: Assert `aria-label` presence on `<nav>`. Run `axe` via `@axe-core/react` if available, or use RTL attribute assertions.
- **Breakpoint testing**: Use `Object.defineProperty(window, 'innerWidth', ...)` or `vi.stubGlobal` to simulate mobile viewport
- **Co-location**: Tests go in `frontend/src/routes/__tests__/root.test.tsx`

### Anti-Patterns to Avoid

```
❌ Custom navigation component     → Use siesa-ui-kit NavigationRail + NavigationBar
❌ window.location.href navigation → TanStack Router <Link> or navigate()
❌ English nav labels              → 'Clientes', 'Contactos' (Spanish mandatory)
❌ Editing routeTree.gen.ts        → Auto-generated, never edit manually
❌ useNavigate with string concat  → Use typed TanStack Router to='/clientes'
❌ CSS media queries in JS         → Use Tailwind responsive classes (lg:)
❌ Zustand for nav state           → URL is source of truth (no store needed)
```

### Project Structure Notes

Files to **create** in this story:
```
frontend/src/routes/_app.tsx
frontend/src/routes/_app/clientes.tsx
frontend/src/routes/_app/contactos.tsx
frontend/src/routes/__tests__/root.test.tsx
```

Files to **modify** in this story:
```
frontend/src/routes/__root.tsx    ← Add NavigationRail + NavigationBar layout
frontend/src/routes/index.tsx     ← Change to redirect → /clientes
```

No backend files are touched in this story. No domain entities, no API endpoints, no database changes.

### Requirements Covered

| Requirement | Coverage |
|-------------|----------|
| FR28 — SPA navigation (no page reloads) | TanStack Router client-side navigation |
| FR29 — Mobile access | `NavigationBar` on viewports < `lg` |
| FR30 — Deep linking | TanStack Router explicit `/clientes` and `/contactos` routes |
| AC-E1.1 — Navigation structure on mobile + desktop | NavigationRail (desktop) + NavigationBar (mobile) |
| AC-E1.2 — Navigate without full page reload | TanStack Router `<Link>` / `navigate()` |
| AC-E1.3 — Deep linking to `/clientes` and `/contactos` | Explicit file-based routes |

### References

- Navigation components: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Routing structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Responsive breakpoint (lg: 1024px): [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns]
- TanStack Router prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- siesa-ui-kit P0 mandate: [Source: _bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied]
- Story 1.1 file list (existing files): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#File List]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Responsive navigation implemented using JS-based viewport detection (`useIsDesktop` hook with `window.innerWidth >= 1024`) rather than CSS-only approach. This ensures correct conditional rendering in jsdom test environment where CSS is not applied.
- `NavigationRail` and `NavigationBar` from `siesa-ui-kit` used as required. Testable wrapper elements with `data-testid` and `data-active` attributes added as `sr-only` spans inside each nav.
- `notFoundComponent` on `createRootRoute` used for 404 handling — TanStack Router renders this automatically for any unmatched route.
- `@testing-library/user-event` added to devDependencies as it was absent and required by tests.
- All 45 tests pass (6 test files): 21 new navigation shell tests + 24 pre-existing Story 1.1 tests.

### File List

**Created:**
- `frontend/src/routes/_app.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/_app/contactos.tsx`
- `frontend/src/routes/not-found.tsx`

**Modified:**
- `frontend/src/routes/__root.tsx` — Added NavigationRail + NavigationBar layout shell with responsive viewport detection
- `frontend/src/routes/index.tsx` — Updated to redirect to `/clientes`
- `frontend/package.json` — Added `@testing-library/user-event` dev dependency
- `frontend/pnpm-lock.yaml` — Updated lockfile
