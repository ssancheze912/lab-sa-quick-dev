# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a mobile-responsive `NavigationBar` (siesa-ui-kit) is displayed at the bottom instead of the rail, and all navigation items are accessible and tappable with a minimum 44px touch target (FR29 + WCAG 2.1 AA).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view placeholder is rendered without redirection to a home screen (deep linking — FR30).

4. **Given** the user navigates to any unknown route (e.g., `/unknown-path`), **When** the page loads, **Then** a 404 / not-found view is displayed with a message in Spanish and a link back to `/clientes`.

5. **Given** the application shell is rendered, **When** any navigation item is the current active route, **Then** the corresponding nav item shows an active visual state (highlighted icon/label) using siesa-ui-kit active tokens.

6. **Given** the navigation shell is rendered on any viewport, **When** the page is inspected for accessibility, **Then** the `<nav>` landmark has `aria-label="Navegación principal"`, all nav items have accessible names in Spanish, and keyboard Tab navigation reaches all nav items.

## Tasks / Subtasks

- [ ] Task 1 — Create `_app.tsx` pathless layout route (AC: #1, #2, #5, #6)
  - [ ] Create `frontend/src/routes/_app.tsx` exporting `Route = createFileRoute('/_app')({ component: AppLayout })`
  - [ ] Implement `AppLayout` component: wraps `<Outlet />` with the `LayoutBase` shell from siesa-ui-kit
  - [ ] Wire `NavigationRail` (desktop, ≥1024px) with two nav items: `{ label: 'Clientes', icon: UsersIcon, to: '/clientes' }` and `{ label: 'Contactos', icon: UserIcon, to: '/contactos' }`
  - [ ] Wire `NavigationBar` (mobile, <1024px) with the same two items — use responsive rendering (CSS breakpoint or `useMediaQuery` hook)
  - [ ] Apply active state detection using `useRouterState` or `useMatch` from `@tanstack/react-router` to highlight the current route
  - [ ] Add `aria-label="Navegación principal"` to the `<nav>` wrapper; all icon buttons must have visible or `aria-label` text in Spanish

- [ ] Task 2 — Create `/clientes` and `/contactos` placeholder routes (AC: #3)
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — pathless child route rendering under `/_app`; export `Route = createFileRoute('/_app/clientes')({ component: ClientesPlaceholder })`
  - [ ] `ClientesPlaceholder` renders a `<main>` with `data-testid="clientes-view"` and heading "Clientes" (placeholder — full implementation in Epic 2)
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — same pattern; `data-testid="contactos-view"`, heading "Contactos" (placeholder — full implementation in Epic 3)
  - [ ] Create (or update) `frontend/src/routes/index.tsx` to redirect to `/clientes` using `redirect({ to: '/clientes' })` in `beforeLoad`

- [ ] Task 3 — Configure 404 Not Found route (AC: #4)
  - [ ] Implement `NotFoundComponent` in `frontend/src/routes/__root.tsx` (or as `defaultNotFoundComponent` in router config): renders a centered message "404 — Página no encontrada" with a link `<Link to="/clientes">Volver a Clientes</Link>` in Spanish
  - [ ] Verify that TanStack Router's `defaultNotFoundComponent` is set in `frontend/src/main.tsx` or router creation call

- [ ] Task 4 — Update `__root.tsx` to mount the shell providers (AC: #1, #2)
  - [ ] Ensure `frontend/src/routes/__root.tsx` renders `<Outlet />` so the `_app.tsx` layout is correctly mounted
  - [ ] Confirm `QueryProvider` (TanStack Query) wraps the root as established in Story 1.1

- [ ] Task 5 — Unit and component tests (AC: #1–#6)
  - [ ] Create `frontend/src/routes/__tests__/AppLayout.test.tsx` — test that `AppLayout` renders `NavigationRail` on desktop viewport and `NavigationBar` on mobile viewport (mock `useMediaQuery` or resize viewport)
  - [ ] Test that the active nav item matches the current route
  - [ ] Test that clicking a nav item calls router navigation to the correct path
  - [ ] Run `axe` accessibility check on `AppLayout` — assert no WCAG violations
  - [ ] Create `frontend/e2e/tests/foundation/navigation-shell.spec.ts` (Playwright ATDD) covering AC #1–#6:
    - Desktop viewport: NavigationRail is visible, Clientes/Contactos items navigate without page reload
    - Mobile viewport (375px): NavigationBar is visible, items are tappable
    - Direct URL `/clientes` and `/contactos` render correct views
    - Unknown route `/does-not-exist` renders 404 view with Spanish message

## Dev Notes

### Architecture Patterns

This story is **frontend-only** — no backend changes required.

The navigation shell is implemented as a **TanStack Router pathless layout route** (`_app.tsx`). The `_` prefix means the layout is applied without adding a URL segment. All application routes (`/clientes`, `/contactos`) are defined as children under `_app/`.

```
routes/
├── __root.tsx              ← Global root (QueryProvider, Toaster)
├── index.tsx               ← Redirect → /clientes
├── _app.tsx                ← Pathless shell layout (NavigationRail + NavigationBar + Outlet)
└── _app/
    ├── clientes.tsx        ← /clientes placeholder
    └── contactos.tsx       ← /contactos placeholder
```

### siesa-ui-kit Components (MANDATORY — check catalog before any custom component)

This story involves UI components. The following siesa-ui-kit components MUST be used:

- **`LayoutBase`** — top-level shell wrapper from siesa-ui-kit (Navbar 64px + NavigationRail 72px + Content area). Wrap `<Outlet />` inside its content slot.
- **`NavigationRail`** — desktop left-side nav (72px icon-only collapsed). Pass `navigationItems` array with `{ label, icon, to }` per item. Used when viewport ≥ 1024px.
- **`NavigationBar`** — mobile bottom navigation bar. Same `navigationItems` API. Used when viewport < 1024px.
- **`Navbar`** — top bar (64px). Props: `productName="Siesa Agents"`.

**Install:** `siesa-ui-kit` is already installed (added in Story 1.1 via `pnpm add siesa-ui-kit`).

**Do NOT** create custom navigation components if siesa-ui-kit equivalents exist. If `LayoutBase`, `NavigationRail`, or `NavigationBar` are not available in the installed version, use shadcn/ui primitives as fallback and document the decision.

### Responsive Breakpoint Strategy

Per architecture: critical breakpoint is `lg: 1024px`. Use TailwindCSS responsive classes for layout:
- `hidden lg:flex` — show NavigationRail on desktop, hide on mobile
- `flex lg:hidden` — show NavigationBar on mobile, hide on desktop

Alternatively, use a `useMediaQuery('(min-width: 1024px)')` hook to conditionally render the correct component. Either approach is acceptable; prefer CSS-only if siesa-ui-kit handles it natively.

### TanStack Router — Key Patterns

```typescript
// routes/_app.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <LayoutBase
      navigationItems={[
        { label: 'Clientes', icon: UsersIcon, to: '/clientes' },
        { label: 'Contactos', icon: UserIcon, to: '/contactos' },
      ]}
    >
      <Outlet />
    </LayoutBase>
  )
}
```

```typescript
// routes/index.tsx — redirect to /clientes
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

```typescript
// routes/_app/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPlaceholder,
})

function ClientesPlaceholder() {
  return (
    <main data-testid="clientes-view">
      <h1>Clientes</h1>
    </main>
  )
}
```

### Active State Detection

Use `useRouterState` from `@tanstack/react-router` or pass the active state down from the router's `Link` component. siesa-ui-kit's `NavigationRail` and `NavigationBar` likely accept an `activeItem` prop or use `<Link>` internally with active class support. Check the siesa-ui-kit API first.

```typescript
// If manual active detection is needed:
import { useRouterState } from '@tanstack/react-router'

const routerState = useRouterState()
const isClientesActive = routerState.location.pathname.startsWith('/clientes')
```

### 404 Not Found

TanStack Router supports a `defaultNotFoundComponent` in the router config. The existing `frontend/src/main.tsx` (Story 1.1) sets up `RouterProvider` — update the router creation to include the 404 component:

```typescript
// In router setup (main.tsx or a createRouter function)
const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => (
    <div data-testid="not-found-view" className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">Página no encontrada</p>
      <Link to="/clientes" className="mt-4 text-primary-600 hover:underline">
        Volver a Clientes
      </Link>
    </div>
  ),
})
```

### Icons

Use **Heroicons** (primary icon library per company standards):
- `UsersIcon` (24px solid) for Clientes
- `UserIcon` (24px solid) for Contactos

Import: `import { UsersIcon, UserIcon } from '@heroicons/react/24/solid'`

If not installed: `pnpm add @heroicons/react`

### Accessibility Requirements (WCAG 2.1 AA)

- `<nav aria-label="Navegación principal">` wrapping the NavigationRail/NavigationBar
- Each nav item button/link: accessible name in Spanish (`aria-label="Clientes"` / `aria-label="Contactos"`)
- Active item: `aria-current="page"` on the active nav item
- Touch targets: minimum 44×44px for mobile nav items (enforced by siesa-ui-kit `NavigationBar`)
- Color contrast: active state must use `primary-600` (#0e79fd) on white — contrast ratio meets 4.5:1

### Brand Colors & Dark Mode

- Active nav item: `text-primary-600` (#0e79fd) with `bg-primary-50` background
- Active dark mode: `dark:text-primary-300` with `dark:bg-primary-950`
- Nav background: `bg-white dark:bg-slate-900`
- Nav border: `border-slate-200 dark:border-slate-700`

Dark mode is class-based (`darkMode: 'class'` in TailwindCSS config). No dark mode toggle required in this story — just ensure tokens are applied correctly from siesa-ui-kit.

### Testing Notes

- Use `@testing-library/react` + `vitest` for unit/component tests (already set up in Story 1.1)
- Use `vitest-axe` for accessibility assertions
- Use Playwright for E2E ATDD tests (framework installed in Story 1.1 at `e2e/`)
- For viewport testing in Playwright: use `page.setViewportSize({ width: 375, height: 812 })` for mobile
- Mock router state in unit tests using `@tanstack/react-router`'s test utilities or `MemoryRouter`-equivalent

### What NOT to Implement in This Story

- Do NOT implement the actual Clientes or Contactos list/detail UI — those are Epic 2 and Epic 3
- Do NOT add a Configuración nav item — not in scope for MVP
- Do NOT implement authentication or route guards — no auth in MVP per PRD
- Do NOT add a Navbar component beyond what siesa-ui-kit's `LayoutBase` provides — keep it minimal

### Project Structure Notes

Files created/modified in this story (relative to `frontend/`):

```
frontend/src/routes/
├── __root.tsx              MODIFY — add defaultNotFoundComponent to router config
├── index.tsx               MODIFY — add redirect to /clientes in beforeLoad
├── _app.tsx                CREATE — pathless layout with NavigationRail/NavigationBar
└── _app/
    ├── clientes.tsx        CREATE — /clientes placeholder
    └── contactos.tsx       CREATE — /contactos placeholder

frontend/src/routes/__tests__/
└── AppLayout.test.tsx      CREATE — unit/component tests

frontend/e2e/tests/foundation/
└── navigation-shell.spec.ts  CREATE — Playwright ATDD tests
```

No modules/, shared/, or infrastructure/ changes needed in this story — this is purely a routing/shell story.

### References

- Architecture routing decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- TanStack Router file-based conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- siesa-ui-kit NavigationRail/NavigationBar requirement: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision — Direction F]
- Frontend folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Story 1.1 scaffold (existing files): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#File List]
- Epic source with AC: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Accessibility requirements: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Brand colors and dark mode: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
