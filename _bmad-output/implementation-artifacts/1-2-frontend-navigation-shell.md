# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** the `NavigationRail` component from `siesa-ui-kit` is visible on the left side (72px collapsed) with "Clientes" and "Contactos" entries using Heroicons, **And** the active item shows `primary-50` background + `primary-700` text per the Siesa navigation standard (FR28).

2. **Given** the user clicks "Clientes" or "Contactos" in the NavigationRail, **When** the route changes, **Then** the URL updates to `/clientes` or `/contactos` respectively without a full page reload, the page does not flash or lose scroll position, and the active nav item updates its visual state (FR28).

3. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** the `NavigationBar` (bottom tab bar) component from `siesa-ui-kit` is displayed instead of the NavigationRail with all navigation items accessible and tappable (minimum 44px touch targets) (FR29).

4. **Given** the user types `/clientes` directly in the browser URL bar and presses Enter, **When** the page loads, **Then** the Clientes view is rendered correctly, the NavigationRail/NavigationBar shows "Clientes" as active, and no redirection to a home screen occurs (FR30).

5. **Given** the user types `/contactos` directly in the browser URL bar and presses Enter, **When** the page loads, **Then** the Contactos view is rendered correctly, the NavigationRail/NavigationBar shows "Contactos" as active (FR30).

6. **Given** the user navigates to any unknown route (e.g., `/unknown`, `/abc`), **When** the page loads, **Then** a 404 Not Found view is displayed gracefully in Spanish ("Página no encontrada") with a link back to `/clientes`.

7. **Given** the root route `/` is accessed, **When** the page loads, **Then** the user is redirected to `/clientes` automatically without displaying a blank page.

8. **Given** the app shell is rendered, **When** any view is displayed, **Then** the layout uses `LayoutBase` from `siesa-ui-kit` with a `Navbar` (64px top bar) containing the Siesa logo/symbol and product name "Siesa Agents", consistent across all routes.

## Tasks / Subtasks

- [ ] Task 1 — Create root route layout with LayoutBase + NavigationRail (AC: #1, #2, #8)
  - [ ] Open `frontend/src/routes/__root.tsx` (created in Story 1.1 as a placeholder) and replace stub with full layout
  - [ ] Import `LayoutBase`, `Navbar`, `NavigationRail` from `siesa-ui-kit`
  - [ ] Configure `Navbar` with `productName="Siesa Agents"` and the Siesa brand symbol
  - [ ] Configure `NavigationRail` with items: `{ label: "Clientes", icon: <UsersIcon />, to: "/clientes" }` and `{ label: "Contactos", icon: <UserIcon />, to: "/contactos" }` using Heroicons
  - [ ] Wire active state: use `useRouterState()` from `@tanstack/react-router` to detect the current pathname and apply active class to the matching nav item
  - [ ] Render `<Outlet />` in the content area so child routes are displayed
  - [ ] Verify desktop layout: NavigationRail 72px left + content area fills remaining width

- [ ] Task 2 — Implement responsive NavigationBar for mobile (AC: #3)
  - [ ] Add responsive breakpoint logic: render `NavigationRail` when viewport ≥ 1024px (Tailwind `lg:block`), render `NavigationBar` when viewport < 1024px
  - [ ] Configure `NavigationBar` (bottom tab bar) from `siesa-ui-kit` with the same two navigation items
  - [ ] Verify touch targets are ≥ 44px height on mobile
  - [ ] Verify NavigationRail is hidden on mobile and NavigationBar is hidden on desktop (CSS `hidden lg:block` / `lg:hidden`)

- [ ] Task 3 — Configure TanStack Router file-based routes (AC: #4, #5, #7)
  - [ ] Ensure `frontend/src/routes/index.tsx` exports a redirect to `/clientes` using `redirect({ to: '/clientes' })` from `@tanstack/react-router`
  - [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route wrapping the main shell (uses `__root.tsx` LayoutBase)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — renders `<ClientesPlaceholder />` (a minimal placeholder component: `<div>Clientes — próximamente</div>`); full implementation deferred to Epic 2
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — renders `<ContactosPlaceholder />` (a minimal placeholder: `<div>Contactos — próximamente</div>`); full implementation deferred to Epic 3
  - [ ] Verify TanStack Router auto-generates `routeTree.gen.ts` on file save (plugin configured in Story 1.1)
  - [ ] Verify deep linking: navigate directly to `http://localhost:5173/clientes` and `http://localhost:5173/contactos` — correct views render without redirect

- [ ] Task 4 — Create 404 Not Found route (AC: #6)
  - [ ] Create `frontend/src/routes/$404.tsx` (or use TanStack Router `notFoundComponent`) to catch all unmatched routes
  - [ ] Display a Spanish-language 404 view: heading "Página no encontrada", subtext "La ruta que buscas no existe.", and a link `<Link to="/clientes">Volver al inicio</Link>`
  - [ ] Style the 404 page with `slate-100` background, centered content, Heroicons `ExclamationTriangleIcon` in `amber-400`
  - [ ] Verify navigating to `/ruta-inexistente` shows this view without a JS error

- [ ] Task 5 — Accessibility & WCAG 2.1 AA compliance (AC: #1, #3)
  - [ ] Add `aria-label="Navegación principal"` to the `<nav>` wrapping NavigationRail and NavigationBar
  - [ ] Add `aria-current="page"` to the active navigation item
  - [ ] Verify all nav items are reachable via Tab key and activatable via Enter/Space
  - [ ] Verify focus indicators: 2px solid `primary-600` (`#0e79fd`) on focused nav items
  - [ ] All icon-only buttons in navigation must have `aria-label` in Spanish

- [ ] Task 6 — Unit and component tests (AC: all)
  - [ ] Create `frontend/src/routes/__root.test.tsx` — render the root layout, assert NavigationRail renders with "Clientes" and "Contactos" links
  - [ ] Test responsive rendering: mock `window.innerWidth` < 1024, assert `NavigationBar` is visible and `NavigationRail` is hidden
  - [ ] Test active nav state: mock current route as `/clientes`, assert "Clientes" item has active class
  - [ ] Test 404 route: navigate to `/ruta-inexistente`, assert "Página no encontrada" heading renders
  - [ ] Test redirect: navigate to `/`, assert redirect to `/clientes` occurs
  - [ ] Run `axe` accessibility check on the rendered root layout — zero violations

## Dev Notes

### Architecture Context

This story implements the navigation shell defined in the architecture and UX specification. The shell uses **Direction F** from the UX design: `LayoutBase` from `siesa-ui-kit` with a `NavigationRail` (desktop) and `NavigationBar` (mobile), wrapping the main content area via TanStack Router's `<Outlet />`.

**This story is purely frontend — no backend work.** It extends the `__root.tsx` placeholder created in Story 1.1 into a full layout shell.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `pnpm add siesa-ui-kit` (already installed in Story 1.1 — verify dependency is present)
- **Usage**: You MUST use `siesa-ui-kit` components for all navigation UI elements. Check the catalog before creating any custom component.
- **Constraint**: Do NOT create custom NavigationRail or NavigationBar components — use the ones from `siesa-ui-kit`.
- **Component lookup order**: siesa-ui-kit → shadcn/ui → custom (last resort only)

### Component Mapping

| UI Element | siesa-ui-kit Component | Notes |
|---|---|---|
| App shell | `LayoutBase` | Top-level layout wrapper |
| Top bar | `Navbar` | 64px, `productName="Siesa Agents"` |
| Desktop navigation | `NavigationRail` | 72px collapsed, icon-only |
| Mobile navigation | `NavigationBar` | Bottom tab bar |

### TanStack Router File Structure

```
frontend/src/routes/
├── __root.tsx              ← Root layout (LayoutBase + Navbar + NavigationRail/Bar + Outlet)
├── index.tsx               ← Redirect → /clientes
├── _app.tsx                ← Pathless layout route (no URL segment)
└── _app/
    ├── clientes.tsx         ← /clientes placeholder (Epic 2 will fill this)
    └── contactos.tsx        ← /contactos placeholder (Epic 3 will fill this)
```

**TanStack Router prefix rules (from architecture.md):**
- `_` prefix = pathless layout (no URL segment added)
- `$` prefix = dynamic parameter
- Route file names map directly to URL segments

**Correct `__root.tsx` structure:**
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { LayoutBase, Navbar, NavigationRail, NavigationBar } from 'siesa-ui-kit'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <LayoutBase
      navbar={<Navbar productName="Siesa Agents" />}
      navigationRail={<NavigationRailWithActiveState />}
      navigationBar={<NavigationBarWithActiveState />}
    >
      <Outlet />
    </LayoutBase>
  )
}
```

**Correct `index.tsx` redirect:**
```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => { throw redirect({ to: '/clientes' }) },
})
```

### Responsive Breakpoint

The critical breakpoint is `lg` (1024px, Tailwind default):
- `≥ 1024px` → show NavigationRail (left sidebar, 72px), hide NavigationBar
- `< 1024px` → show NavigationBar (bottom tabs), hide NavigationRail

Use Tailwind responsive utilities: `hidden lg:block` / `block lg:hidden`.

### Active Navigation State

Use `useRouterState` hook to detect the current location and derive the active item:
```tsx
import { useRouterState } from '@tanstack/react-router'

function NavigationRailWithActiveState() {
  const { location } = useRouterState()
  const isClientes = location.pathname.startsWith('/clientes')
  const isContactos = location.pathname.startsWith('/contactos')
  // pass isActive prop to each nav item
}
```

### Styling — Siesa Brand Tokens

Active nav item: `bg-primary-50 text-primary-700` (from UX spec — Siesa navigation standard)
Inactive nav item: `text-slate-600 hover:bg-slate-100`
Navigation background: `white` (light) / `slate-900` (dark)

All colors must use the Siesa brand scale:
- Primary: `#0e79fd` (`primary-600`)
- Tertiary: `#154ca9` (`tertiary-800`)
- Neutrals: Tailwind `slate-*` scale (not `gray-*`)

### Icons

Use **Heroicons** (primary icon set per company standards):
- Clientes: `UsersIcon` (outline)
- Contactos: `UserIcon` (outline)
- 404 page: `ExclamationTriangleIcon` (`amber-400`)

Install if not already present: `pnpm add @heroicons/react`

### Testing Standards

- **Framework**: Vitest + React Testing Library (installed in Story 1.1)
- **Accessibility**: run `axe` checks via `@axe-core/react` or `jest-axe` in RTL tests
- **Mock router**: use `createMemoryRouter` or TanStack Router test utilities to test route-specific rendering
- **Coverage target**: ≥ 80% for files created in this story
- Test file naming: co-located alongside the component (e.g., `__root.test.tsx` next to `__root.tsx`)

### Placeholder Content for Child Routes

The `clientes.tsx` and `contactos.tsx` routes created here are minimal placeholders only. They will be fully implemented in Epics 2 and 3 respectively. The placeholder content must:
- Be in Spanish (e.g., `<p>Vista de Clientes — en construcción</p>`)
- Not import any domain hooks or API calls (no `useClientes`, no API calls)
- Have a stable `data-testid` attribute for testing (e.g., `data-testid="clientes-placeholder"`)

### Previous Story Learnings (from Story 1.1)

- **Package manager**: Use `pnpm` exclusively — NOT npm or yarn
- **Vite plugin**: `@tanstack/router-plugin/vite` is already configured in `vite.config.ts` — it auto-generates `routeTree.gen.ts` on file save. Do NOT manually edit `routeTree.gen.ts`.
- **TypeScript strict**: `"strict": true` is enforced. No `any` types. All component props must be typed explicitly.
- **TailwindCSS v4**: Import via `src/index.css` as `@import "tailwindcss"`. Do NOT use `tailwind.config.js` — v4 uses CSS-native config.
- **siesa-ui-kit**: Already installed. Verify import paths from the siesa-ui-kit catalog before assuming component names — the exact API (props, named exports) must be confirmed against the actual installed package.
- `__root.tsx` was created as a placeholder in Story 1.1 — this story replaces its contents entirely.
- Frontend root is at `frontend/` (not `src/` at repo root). All paths are relative to `frontend/`.

### Project Structure Notes

Files to create/modify in this story:

```
frontend/src/routes/
├── __root.tsx              ← MODIFY (replace placeholder with full layout)
├── index.tsx               ← CREATE (redirect to /clientes)
├── _app.tsx                ← CREATE (pathless layout route)
└── _app/
    ├── clientes.tsx         ← CREATE (placeholder)
    └── contactos.tsx        ← CREATE (placeholder)

frontend/src/routes/
└── (notFound).tsx           ← CREATE (404 component registered in __root.tsx)
```

No backend files are touched in this story.
No new `src/modules/` files are created — modules are the responsibility of Epics 2 and 3.
No new Zustand stores — URL is the source of truth for active route (per architecture.md).

### References

- Navigation shell design: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision — Direction F]
- Routing structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — Routing]
- TanStack Router prefix rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- FR28, FR29, FR30: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Navigation & Access]
- siesa-ui-kit P0 mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- UX color + spacing tokens: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- Frontend folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Previous story learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
