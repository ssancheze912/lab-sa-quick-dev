# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** the `LayoutBase` shell from `siesa-ui-kit` is rendered with a `Navbar` (64px top bar) and a `NavigationRail` (72px left side, icon-only collapsed state) showing at minimum two navigation entries: "Clientes" and "Contactos" using Heroicons.

2. **Given** the user is on any route within the application, **When** they click the "Clientes" navigation entry, **Then** the router navigates to `/clientes` without a full page reload and the "Clientes" nav item becomes visually active (`primary-50` background, `primary-700` text per design spec). (FR28)

3. **Given** the user is on any route within the application, **When** they click the "Contactos" navigation entry, **Then** the router navigates to `/contactos` without a full page reload and the "Contactos" nav item becomes visually active. (FR28)

4. **Given** the application is loaded on a mobile browser (viewport < 1024px), **When** the user views the app, **Then** a bottom `NavigationBar` (siesa-ui-kit) replaces the `NavigationRail`, and all navigation items are accessible with minimum 44px touch targets. (FR29)

5. **Given** the user types `/clientes` directly in the browser URL bar and presses Enter, **When** the page loads, **Then** the Clientes view is rendered correctly and the NavigationRail/Bar highlights the "Clientes" entry — no redirect to a home screen occurs. (FR30)

6. **Given** the user types `/contactos` directly in the browser URL bar and presses Enter, **When** the page loads, **Then** the Contactos view is rendered correctly and the NavigationRail/Bar highlights the "Contactos" entry. (FR30)

7. **Given** the user navigates to an unknown route (e.g., `/unknown-path`), **When** the page loads, **Then** a 404 / not-found view is displayed with a friendly Spanish-language message and a link back to `/clientes`.

8. **Given** the root path `/` is accessed, **When** the page loads, **Then** the router redirects to `/clientes` automatically.

9. **Given** any interactive navigation element exists in the shell, **When** a keyboard-only user navigates with Tab and activates with Enter/Space, **Then** all navigation entries are reachable and functional (WCAG 2.1 AA keyboard navigation).

## Tasks / Subtasks

- [ ] Task 1 — Implement `LayoutBase` shell with `siesa-ui-kit` (AC: #1, #4)
  - [ ] Verify `siesa-ui-kit` is installed in `frontend/package.json` (added in Story 1.1)
  - [ ] Create `frontend/src/routes/__root.tsx` as the TanStack Router root route with `LayoutBase` from `siesa-ui-kit`
  - [ ] Configure `Navbar` prop on `LayoutBase`: `productName="Siesa Agents"`, include `environmentBadge` and `userDropdown` stubs
  - [ ] Configure desktop `NavigationRail` (collapsed 72px icon-only) with entries for Clientes and Contactos using Heroicons (`UsersIcon`, `UserIcon`)
  - [ ] Configure mobile `NavigationBar` for viewports < 1024px (responsive breakpoint `lg:`)
  - [ ] Inject `<Outlet />` (TanStack Router) inside the content area of `LayoutBase`
  - [ ] Ensure active nav item gets `primary-50` background and `primary-700` text using TanStack Router's `useMatchRoute` or `Link` `activeProps`

- [ ] Task 2 — Create file-based routes for Clientes and Contactos (AC: #2, #3, #5, #6)
  - [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route (no URL segment) wrapping the authenticated shell
  - [ ] Create `frontend/src/routes/_app/` directory
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — route for `/clientes`, renders a placeholder `<ClientesView />` or `<div>Clientes</div>` (full implementation is Epic 2)
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — route for `/contactos`, renders a placeholder `<ContactosView />` or `<div>Contactos</div>` (full implementation is Epic 3)
  - [ ] Verify TanStack Router plugin auto-generates `routeTree.gen.ts` on save

- [ ] Task 3 — Configure root redirect and 404 (AC: #7, #8)
  - [ ] Create `frontend/src/routes/index.tsx` — redirects to `/clientes` using TanStack Router `redirect()`
  - [ ] Create `frontend/src/routes/notFound.tsx` (or use `__root.tsx` `notFoundComponent`) — renders a Spanish-language not-found message: "Página no encontrada" with a link to `/clientes`

- [ ] Task 4 — Wire providers in `main.tsx` (dependency from Story 1.1)
  - [ ] Confirm `frontend/src/main.tsx` renders `<RouterProvider router={router} />` inside `<QueryClientProvider>` (established in Story 1.1 — verify, do not recreate)
  - [ ] Confirm `routeTree.gen.ts` is imported into the router creation call

- [ ] Task 5 — Accessibility and responsive verification (AC: #9)
  - [ ] Manually verify Tab key cycles through Clientes and Contactos nav items
  - [ ] Verify each nav item has an accessible label (Heroicon buttons need `aria-label` in Spanish: `aria-label="Clientes"`, `aria-label="Contactos"`)
  - [ ] Verify focus ring is `2px solid #0e79fd` on all interactive nav elements

- [ ] Task 6 — Unit / component tests (AC: #1–#9)
  - [ ] Write Vitest + RTL test for `__root.tsx`: renders `LayoutBase`, renders Outlet
  - [ ] Write RTL test: navigation links render with correct `href` values (`/clientes`, `/contactos`)
  - [ ] Write RTL test: 404 route displays Spanish not-found message
  - [ ] Write RTL test: root `/` redirects to `/clientes`
  - [ ] Run `pnpm run test` — all tests must pass

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `pnpm add siesa-ui-kit` (must already be installed from Story 1.1 — verify before running again)
- **Usage**: You MUST use `siesa-ui-kit` components for all shell elements: `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar`
- **Constraint**: Do NOT create a custom navigation shell if `siesa-ui-kit` provides `LayoutBase`. Check the kit catalog first.
- **Component lookup order**: siesa-ui-kit → shadcn/ui → custom build (only if unavailable in both)

### Routing Architecture

**TanStack Router file-based routing** (configured via `@tanstack/router-plugin/vite` — already in `vite.config.ts` from Story 1.1):

```
frontend/src/routes/
├── __root.tsx              # Root layout — LayoutBase + NavigationRail + Outlet
├── index.tsx               # / → redirect to /clientes
├── _app.tsx                # Pathless layout route (underscore prefix = no URL segment)
├── _app/
│   ├── clientes.tsx        # /clientes — ClientesView placeholder
│   └── contactos.tsx       # /contactos — ContactosView placeholder
└── notFound.tsx            # 404 not-found component
```

**Key TanStack Router conventions in use:**
- `_` prefix: pathless layout route (no URL contribution, just layout wrapper)
- `.` prefix: flat routing (nested without folder — not used in this story)
- `$` prefix: dynamic parameter (not used in this story, used in Epic 2+)

**Root route creation pattern:**
```typescript
// frontend/src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { LayoutBase, Navbar, NavigationRail } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <LayoutBase
      navbar={<Navbar productName="Siesa Agents" />}
      navigationRail={
        <NavigationRail items={navigationItems} />
      }
    >
      <Outlet />
    </LayoutBase>
  )
}
```

**Index redirect pattern:**
```typescript
// frontend/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

**Navigation items (Spanish labels, Heroicons):**
```typescript
const navigationItems = [
  {
    label: 'Clientes',
    icon: <UsersIcon className="w-6 h-6" aria-label="Clientes" />,
    to: '/clientes',
  },
  {
    label: 'Contactos',
    icon: <UserIcon className="w-6 h-6" aria-label="Contactos" />,
    to: '/contactos',
  },
]
```

### Design Spec Alignment

From `ux-design-specification.md` Direction F — LayoutBase + Lista/Detalle + ContactManager:

```
┌─ Navbar (64px) ─────────────────────────────────────────────────┐
│  [Siesa symbol] Siesa Agents        [env badge] [🔔] [Avatar]   │
└─────────────────────────────────────────────────────────────────┘
┌─ NavigationRail (72px, icon-only) ─┬─ Content Area ────────────┐
│  👥 Clientes (active state)         │  <Outlet /> renders here   │
│  🙋 Contactos                       │  (Epic 2 / Epic 3 content) │
└─────────────────────────────────────┴───────────────────────────┘
```

- Active nav item: `primary-50` bg (`#eff6ff`), `primary-700` text (`#1d4ed8`)
- NavigationRail: 72px wide, collapsed/icon-only on desktop ≥ 1024px
- Mobile (< 1024px): `NavigationBar` at bottom, all items accessible with 44px touch targets
- Focus ring: `2px solid #0e79fd` (`primary-600`)

### Not-Found Page (Spanish)

```typescript
// frontend/src/routes/notFound.tsx OR in __root.tsx notFoundComponent
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Página no encontrada</h1>
      <p className="text-slate-600">La ruta solicitada no existe.</p>
      <Link to="/clientes" className="text-primary-600 underline">
        Volver a Clientes
      </Link>
    </div>
  )
}
```

### Story Scope

This story covers ONLY the navigation shell structure. It does NOT implement:
- The Clientes list/detail view (Epic 2)
- The Contactos list/detail view (Epic 3)
- The ContactManager integration (Epic 2 / Epic 3)
- Any backend API calls

Placeholder views for `/clientes` and `/contactos` are sufficient. The routes must be registered and navigable.

### Tech Stack Versions

All established in Story 1.1:
- **Vite**: 7+ with `@tanstack/router-plugin/vite`
- **React**: 18+ (functional components + hooks only — NO class components)
- **TypeScript**: Strict mode (`"strict": true`) — NO `any` types
- **TanStack Router**: 1+ (file-based routing, auto-generates `routeTree.gen.ts`)
- **siesa-ui-kit**: installed — use `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar`
- **TailwindCSS**: v4 (`@import "tailwindcss"` in `index.css`)
- **Heroicons**: for navigation icons (`@heroicons/react/24/outline`)
- **Package manager**: `pnpm` (mandatory — NOT npm or yarn)

### All User-Facing Text MUST Be in Spanish

- Nav items: "Clientes", "Contactos"
- Not-found message: "Página no encontrada", "La ruta solicitada no existe.", "Volver a Clientes"
- ARIA labels (icon-only buttons): `aria-label="Clientes"`, `aria-label="Contactos"`
- Any toast or error message: Spanish

### Testing Standards

- **Framework**: Vitest + React Testing Library (RTL) + MSW
- **Setup**: Already configured in Story 1.1 (`vitest.config.ts`, `@testing-library/react`)
- **Approach**: Component tests for `__root.tsx` and route components
- **Accessibility**: Use `axe` or manual assertion for ARIA labels and keyboard nav

### Project Structure Notes

Files to create/modify in this story (relative to `frontend/`):

```
frontend/src/routes/
├── __root.tsx              # CREATE or UPDATE (may be a stub from Story 1.1)
├── index.tsx               # CREATE — redirect to /clientes
├── _app.tsx                # CREATE — pathless layout
├── _app/
│   ├── clientes.tsx        # CREATE — placeholder Clientes view
│   └── contactos.tsx       # CREATE — placeholder Contactos view
└── notFound.tsx            # CREATE — 404 component (or inline in __root.tsx)
```

Story 1.1 may have created a stub `__root.tsx` — update it, do not duplicate.

No backend files are touched in this story.

### References

- Routing architecture and folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- TanStack Router file-based conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- UX Design Direction F (LayoutBase shell): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Navigation design tokens: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System]
- Mobile NavigationBar requirement: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- FR28, FR29, FR30 coverage: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- Company standards (stack, accessibility, language rules): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (package manager = pnpm, providers wiring): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
