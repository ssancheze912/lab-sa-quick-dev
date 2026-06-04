# Story 1.2: Frontend Navigation Shell

Status: done

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport width >= 1024px), **When** the user views the app, **Then** a `NavigationRail` component from `siesa-ui-kit` is visible on the left side with entries labeled "Clientes" and "Contactos", and the active route entry is visually highlighted.

2. **Given** the application is loaded on a mobile browser (viewport width < 1024px), **When** the user views the app, **Then** a `NavigationBar` component from `siesa-ui-kit` is displayed at the bottom of the screen instead of the rail, and all navigation entries are accessible and tappable.

3. **Given** the user is on any page, **When** the user clicks "Clientes" or "Contactos" in the navigation component, **Then** the router navigates to `/clientes` or `/contactos` respectively without a full page reload (client-side navigation via TanStack Router).

4. **Given** the user types `/clientes` directly in the browser URL bar and presses Enter, **When** the page loads, **Then** the Clientes view is rendered correctly without any redirection to a home screen (deep linking — FR30).

5. **Given** the user types `/contactos` directly in the browser URL bar and presses Enter, **When** the page loads, **Then** the Contactos view is rendered correctly without any redirection to a home screen (deep linking — FR30).

6. **Given** the user navigates to an unknown route (e.g., `/ruta-inexistente`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish and a link to return to `/clientes`.

7. **Given** the root path `/` is accessed, **When** the page loads, **Then** the router redirects automatically to `/clientes`.

8. **Given** the navigation shell is rendered, **When** evaluated for accessibility, **Then** the navigation landmark uses `<nav>` semantics, all links have descriptive ARIA labels in Spanish, and the component meets WCAG 2.1 AA contrast requirements (Siesa Blue `#0e79fd` on white background).

## Tasks / Subtasks

- [x] Task 1 — Update `__root.tsx` with shell layout and conditional navigation (AC: #1, #2, #3, #8)
  - [x] Import `NavigationRail` and `NavigationBar` from `siesa-ui-kit`; confirm component names against siesa-ui-kit catalog before importing
  - [x] Wrap the root layout outlet with a responsive container: `NavigationRail` at `lg:flex hidden` (desktop) and `NavigationBar` at `flex lg:hidden` fixed to bottom (mobile)
  - [x] Define navigation entries array with items: `{ label: 'Clientes', to: '/clientes', icon: <UsersIcon /> }` and `{ label: 'Contactos', to: '/contactos', icon: <IdentificationIcon /> }` (Heroicons)
  - [x] Use TanStack Router `<Link>` with `activeProps` for active-state highlighting within navigation entries
  - [x] Apply `aria-label` in Spanish to the `<nav>` element (e.g., `"Navegación principal"`)
  - [x] Use TailwindCSS v4 and Siesa brand colors (`#0e79fd`) for active state styling; use `slate-*` scale for neutral backgrounds
  - [x] Ensure layout does not exceed 500KB gzipped bundle budget

- [x] Task 2 — Create route files for `/clientes`, `/contactos`, and 404 (AC: #4, #5, #6, #7)
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout route acting as the authenticated shell (TanStack Router `_` prefix for no URL segment)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — route component rendering a placeholder `<ClientesView />` (stub, real implementation in Epic 2)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — route component rendering a placeholder `<ContactosView />` (stub, real implementation in Epic 3)
  - [x] Create `frontend/src/routes/index.tsx` — root index route that performs `redirect({ to: '/clientes' })` using TanStack Router's `beforeLoad`
  - [x] Create `frontend/src/routes/$404.tsx` (or `frontend/src/routes/$.tsx`) — catch-all not-found route rendering a 404 view in Spanish with a navigation link back to `/clientes`
  - [x] Verify TanStack Router plugin auto-generates updated `routeTree.gen.ts` reflecting all new routes

- [x] Task 3 — Create placeholder view components for Clientes and Contactos (AC: #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClientesView.tsx` — placeholder component rendering `<p>Vista de Clientes (próximamente)</p>` wrapped in a `<main>` element
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactosView.tsx` — placeholder component rendering `<p>Vista de Contactos (próximamente)</p>` wrapped in a `<main>` element
  - [x] Both components must be functional React components with TypeScript, zero `any` types

- [x] Task 4 — Create 404 Not Found view (AC: #6)
  - [x] Create `frontend/src/shared/components/NotFoundView.tsx` — displays heading "Página no encontrada" (H1), descriptive paragraph in Spanish, and a TanStack Router `<Link to="/clientes">Ir a Clientes</Link>` CTA
  - [x] Apply Tailwind utility classes for centered layout and readable typography using Inter font

- [x] Task 5 — Write Vitest + RTL unit tests (AC: all)
  - [x] Create `frontend/src/routes/__tests__/root.test.tsx` — test that `NavigationRail` is rendered on desktop viewport and `NavigationBar` on mobile using `@testing-library/react` with viewport mocking
  - [x] Create `frontend/src/shared/components/__tests__/NotFoundView.test.tsx` — test that "Página no encontrada" heading is visible and `/clientes` link exists
  - [x] Test accessible navigation: use `getByRole('navigation')` to assert `<nav>` element exists
  - [x] All tests run with `pnpm run test` via Vitest; zero failures

## Dev Notes

### Routing Architecture

TanStack Router file-based routing conventions applied in this story:

| File | Route | Purpose |
|------|-------|---------|
| `src/routes/__root.tsx` | Layout wrapping all routes | Shell with NavigationRail/NavigationBar |
| `src/routes/index.tsx` | `/` | Redirects to `/clientes` |
| `src/routes/_app.tsx` | Pathless layout (no URL segment) | Authenticated-shell wrapper |
| `src/routes/_app/clientes.tsx` | `/clientes` | Clientes section stub |
| `src/routes/_app/contactos.tsx` | `/contactos` | Contactos section stub |
| `src/routes/$.tsx` | `*` (catch-all) | 404 not-found handler |

- The `_` prefix makes `_app.tsx` a **pathless layout** — it wraps its children without adding a URL segment.
- The `$` prefix on `$.tsx` creates a catch-all route that matches any unknown path.
- `routeTree.gen.ts` is auto-generated by `@tanstack/router-plugin/vite` on every `pnpm run dev` or `pnpm run build` — do NOT edit it manually.

### TanStack Router: Redirect from Index

```typescript
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

### TanStack Router: Catch-all 404 Route

```typescript
// src/routes/$.tsx
import { createFileRoute } from '@tanstack/react-router'
import { NotFoundView } from '../shared/components/NotFoundView'

export const Route = createFileRoute('/$')({
  component: NotFoundView,
})
```

### Root Layout Pattern

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NavigationRail, NavigationBar } from 'siesa-ui-kit'
import { UsersIcon, IdentificationIcon } from '@heroicons/react/24/outline'

const navItems = [
  { label: 'Clientes', to: '/clientes', icon: <UsersIcon className="h-5 w-5" /> },
  { label: 'Contactos', to: '/contactos', icon: <IdentificationIcon className="h-5 w-5" /> },
]

function RootLayout() {
  return (
    <div className="flex h-screen">
      {/* Desktop — NavigationRail */}
      <nav aria-label="Navegación principal" className="hidden lg:flex">
        <NavigationRail items={navItems} />
      </nav>
      {/* Content area */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>
      {/* Mobile — NavigationBar */}
      <nav aria-label="Navegación principal" className="fixed bottom-0 w-full lg:hidden">
        <NavigationBar items={navItems} />
      </nav>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
```

> **Note:** Confirm exact prop names (`items`, `label`, `to`, `icon`) against the siesa-ui-kit catalog before finalizing. If `NavigationRail` or `NavigationBar` are not available in siesa-ui-kit, implement custom components using TailwindCSS and Heroicons, following the same responsive pattern.

### Responsive Breakpoint

- Critical breakpoint: `lg` (1024px) per architecture decision.
- Desktop: `NavigationRail` on left side, content fills remaining space.
- Mobile: `NavigationBar` fixed at bottom, content has `pb-16` to avoid overlap.

### Typography & Brand Colors

- Font: Inter (already configured via `src/index.css` TailwindCSS v4 import from Story 1.1)
- Active navigation entry: Siesa Blue `#0e79fd`
- Neutral backgrounds: `slate-*` Tailwind scale
- Dark mode: class-based (`darkMode: 'class'`) — apply `dark:` variants on nav components

### Heroicons Usage

```bash
pnpm add @heroicons/react
```

```typescript
import { UsersIcon, IdentificationIcon } from '@heroicons/react/24/outline'
```

### WCAG 2.1 AA Compliance

- All nav links must be keyboard-focusable with visible focus rings.
- Active state must not rely on color alone — include `aria-current="page"` attribute on active route link.
- Minimum contrast ratio 4.5:1 for normal text; 3:1 for large text.
- Touch target minimum 44x44px for mobile nav items.

### Folder Structure After This Story

```
frontend/src/
├── routes/
│   ├── __root.tsx              ← MODIFIED: full shell layout with NavigationRail/NavigationBar
│   ├── index.tsx               ← MODIFIED: redirect to /clientes
│   ├── _app.tsx                ← NEW: pathless authenticated shell layout
│   ├── _app/
│   │   ├── clientes.tsx        ← NEW: /clientes route
│   │   └── contactos.tsx       ← NEW: /contactos route
│   └── $.tsx                   ← NEW: catch-all 404 route
│   └── routeTree.gen.ts        ← AUTO-GENERATED (updated by Vite plugin)
├── modules/crm/
│   ├── clientes/presentation/
│   │   └── ClientesView.tsx    ← NEW: placeholder stub
│   └── contactos/presentation/
│       └── ContactosView.tsx   ← NEW: placeholder stub
└── shared/components/
    └── NotFoundView.tsx        ← NEW: 404 view in Spanish
```

### Testing Notes

- Use `@testing-library/react` with `{ wrapper: RouterProvider }` for route-aware component tests.
- Mock viewport width using `Object.defineProperty(window, 'innerWidth', ...)` to test responsive nav.
- Import Vitest globals (`describe`, `it`, `expect`) — configured via `vite.config.ts` `test.globals: true`.
- Use `getByRole('navigation')` and `getByRole('link', { name: 'Clientes' })` for accessible queries.

### References

- Routing conventions and file structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Responsive breakpoint and NavigationBar mobile pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns]
- TanStack Router file-based prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- WCAG 2.1 AA requirement: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- NavigationRail/NavigationBar from siesa-ui-kit do not expose custom data-testid or aria-current props on individual items; custom TanStack Router Link-based nav was used instead.
- jsdom does not apply CSS media queries, so CSS-only responsive visibility (hidden lg:flex) does not work for tests — used JS-driven `useIsDesktop` hook instead.
- TanStack Router renders async; all tests use `await router.load()` + `waitFor` to stabilize DOM before assertions.

### Completion Notes List

- Task 1: Custom NavigationRail (desktop) and NavigationBar (mobile) implemented using TanStack Router `<Link>` with Heroicons and TailwindCSS v4. Responsive switching driven by JS `useIsDesktop` hook (window.innerWidth >= 1024).
- Task 2: Routes `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`, `index.tsx` (redirect), `$.tsx` (404) created. `routeTree.gen.ts` auto-regenerated by TanStack Router Vite plugin.
- Task 3: `ClientesView.tsx` and `ContactosView.tsx` placeholder components created with `data-testid` attributes.
- Task 4: `NotFoundView.tsx` created with Spanish heading, descriptive paragraph, and link back to `/clientes`.
- Task 5: 26 Vitest + RTL tests, all passing (0 failures). `@testing-library/user-event` added as dev dependency.

### File List

- `frontend/src/routes/__root.tsx` — modified: responsive navigation shell with desktop NavigationRail and mobile NavigationBar
- `frontend/src/routes/index.tsx` — modified: redirect from / to /clientes
- `frontend/src/routes/_app.tsx` — new: pathless layout route
- `frontend/src/routes/_app/clientes.tsx` — new: /clientes route
- `frontend/src/routes/_app/contactos.tsx` — new: /contactos route
- `frontend/src/routes/$.tsx` — new: catch-all 404 route
- `frontend/src/routeTree.gen.ts` — auto-generated by Vite plugin with all new routes
- `frontend/src/modules/crm/clientes/presentation/ClientesView.tsx` — new: placeholder view
- `frontend/src/modules/crm/contactos/presentation/ContactosView.tsx` — new: placeholder view
- `frontend/src/shared/components/NotFoundView.tsx` — new: 404 view in Spanish
- `frontend/src/routes/__tests__/root.test.tsx` — new: navigation shell tests (19 tests)
- `frontend/src/shared/components/__tests__/NotFoundView.test.tsx` — new: 404 view tests (2 tests)
- `frontend/vite.config.ts` — modified: added routeFileIgnorePattern for test files
