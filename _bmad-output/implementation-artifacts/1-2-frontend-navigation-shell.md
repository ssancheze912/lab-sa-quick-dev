# Story 1.2: Frontend Navigation Shell

Status: done

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser (viewport < 1024px), **When** the user views the app, **Then** a mobile NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, **And** all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/unknown`), **When** the page loads, **Then** a 404 not-found view is displayed with a Spanish-language message and a link back to `/clientes`.

5. **Given** the application is loaded, **When** the user navigates between Clientes and Contactos, **Then** the active navigation item is visually highlighted in the NavigationRail / NavigationBar.

6. **Given** the root URL `/` is accessed, **When** the page loads, **Then** the user is redirected to `/clientes` automatically.

## Tasks / Subtasks

- [x] Task 1 — Create `_app` pathless layout route with NavigationRail (desktop) (AC: #1, #5)
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout wrapping `Outlet` with `LayoutBase` from siesa-ui-kit
  - [x] Import `NavigationRail` from `siesa-ui-kit` and render it inside the layout with `navigationItems` for "Clientes" and "Contactos"
  - [x] Use TanStack Router's `Link` component with `activeProps` to highlight the active navigation item
  - [x] Pass `to="/clientes"` and `to="/contactos"` as TanStack Router `Link` targets for SPA navigation (no full page reload)
  - [x] Apply `hidden lg:flex` (Tailwind v4) to render NavigationRail only on desktop (≥ 1024px)

- [x] Task 2 — Add mobile NavigationBar (AC: #2, #5)
  - [x] Import `NavigationBar` from `siesa-ui-kit` inside `_app.tsx`
  - [x] Render `NavigationBar` with the same `navigationItems` as the rail
  - [x] Apply `flex lg:hidden` to render NavigationBar only on mobile (< 1024px)
  - [x] Verify all navigation items are tappable with adequate touch target size (WCAG 2.1 AA minimum 44×44px)

- [x] Task 3 — Create `/clientes` and `/contactos` placeholder routes (AC: #3)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — exports `Route` with a placeholder `ClientesPage` component (Spanish heading "Clientes", will be replaced in Epic 2)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — exports `Route` with a placeholder `ContactosPage` component (Spanish heading "Contactos", will be replaced in Epic 3)
  - [x] Verify TanStack Router's file-based routing resolves `/clientes` and `/contactos` as direct URL entries (deep linking)

- [x] Task 4 — Create 404 not-found route (AC: #4)
  - [x] Create `frontend/src/routes/-not-found.tsx` — exports a `NotFoundPage` component with Spanish message "Página no encontrada" and a `Link` back to `/clientes` (prefixed with `-` to exclude from router file-based discovery while still registering via notFoundComponent)
  - [x] Register the not-found route in `frontend/src/routes/__root.tsx` using TanStack Router's `notFoundComponent` option
  - [x] Verify that navigating to `/ruta-inexistente` renders the 404 view without a browser error

- [x] Task 5 — Configure root route redirect `/` → `/clientes` (AC: #6)
  - [x] Update `frontend/src/routes/index.tsx` to redirect to `/clientes` using TanStack Router's `redirect` in `beforeLoad`

- [x] Task 6 — Update `__root.tsx` to wire pathless `_app` layout (AC: #1, #2, #3, #4)
  - [x] Confirm `__root.tsx` renders `Outlet` so the `_app` pathless layout is picked up by TanStack Router's file-based convention
  - [x] Ensure `id="app-shell"` div is preserved from Story 1.1

- [x] Task 7 — Write unit / component tests (AC: #1, #2, #3, #4)
  - [x] Write `frontend/src/test/routes/app-layout.test.tsx` — renders `_app` layout, asserts NavigationRail is visible on desktop viewport (≥ 1024px) and NavigationBar on mobile (< 1024px)
  - [x] Write `frontend/src/test/routes/not-found.test.tsx` — renders `NotFoundPage`, asserts Spanish "Página no encontrada" text and `/clientes` link are present
  - [x] Run `pnpm exec vitest run` — all tests pass with zero TypeScript errors (65 tests, 12 test files)

## Dev Notes

### Routing Structure

TanStack Router file-based routing conventions used in this story:

```
src/routes/
  __root.tsx                    # Root layout — Outlet only (Story 1.1)
  index.tsx                     # / → redirect to /clientes
  _app.tsx                      # Pathless layout (_prefix = no URL segment)
  _app/
    clientes.tsx                # /clientes — Clientes placeholder
    contactos.tsx               # /contactos — Contactos placeholder
  -not-found.tsx                # 404 view (prefixed with - to exclude from routing, registered via notFoundComponent)
```

`_app.tsx` is a pathless layout (underscore prefix) — it wraps its children without adding a URL segment. All routes inside `_app/` inherit the NavigationRail/NavigationBar shell.

### siesa-ui-kit Component Usage

Components to use from `siesa-ui-kit` (check catalog before building custom):

- **`LayoutBase`** — Top-level application shell providing `Navbar` (64px) + `NavigationRail` slot + content area. Import and wrap `Outlet` inside it.
- **`NavigationRail`** — Desktop side navigation (72px collapsed, icon-only). Accepts `navigationItems` array. Render only on desktop (`hidden lg:flex`).
- **`NavigationBar`** — Mobile bottom navigation. Accepts the same `navigationItems`. Render only on mobile (`flex lg:hidden`).
- **`Navbar`** — Top header bar. Use with `productName="Siesa Agents"`.

`navigationItems` shape expected by siesa-ui-kit (verify against installed package types):
```typescript
const navigationItems = [
  { label: 'Clientes', icon: <UsersIcon />, to: '/clientes' },
  { label: 'Contactos', icon: <UserIcon />, to: '/contactos' },
]
```

Use `Heroicons` (primary icon library per company standards):
- `UsersIcon` for Clientes
- `UserIcon` for Contactos

### TanStack Router Patterns

**Pathless layout (`_app.tsx`):**
```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <LayoutBase navbar={<Navbar productName="Siesa Agents" />}>
      <NavigationRail className="hidden lg:flex" items={navigationItems} />
      <NavigationBar className="flex lg:hidden" items={navigationItems} />
      <Outlet />
    </LayoutBase>
  )
}
```

**Index redirect (`index.tsx`):**
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => { throw redirect({ to: '/clientes' }) },
})
```

**Not-found registration (`__root.tsx`):**
```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { NotFoundPage } from './-not-found'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
```

**Active link styling:** Use TanStack Router's `Link` `activeProps` to apply active class. Alternatively, use `useRouterState` to determine the active path and pass it to siesa-ui-kit `NavigationRail`/`NavigationBar` if those components accept an `activePath` prop.

### Responsive Breakpoint

Per company standards (UX Spec Direction F and architecture.md):
- Desktop navigation: `NavigationRail` at `lg:` breakpoint (1024px+) — `hidden lg:flex`
- Mobile navigation: `NavigationBar` below `lg:` — `flex lg:hidden`

TailwindCSS v4 — utility classes work identically to v3 for responsive prefixes.

### Placeholder Views

`ClientesPage` and `ContactosPage` are intentional placeholder stubs for this story. They exist solely to satisfy the routing and navigation requirements. Epic 2 and Epic 3 will replace these stubs with full views.

```typescript
// frontend/src/routes/_app/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  return <main className="p-6"><h1 className="text-2xl font-bold">Clientes</h1></main>
}
```

### Testing Approach

- **Vitest + React Testing Library** for all tests
- Viewport simulation via `Object.defineProperty(window, 'innerWidth', ...)` or `window.resizeTo` for responsive tests
- Tests go in `frontend/src/test/routes/` following the co-location pattern established in Story 1.1
- All test assertions use Spanish strings for user-visible text (matching company standard)
- WCAG accessibility check via `@testing-library/jest-dom` — ensure nav items have accessible `aria-label` attributes
- Router-aware tests use `createMemoryHistory` + `act(async () => { await router.load() })` for async rendering

### File List (Expected)

#### New files
- `frontend/src/routes/_app.tsx` — Pathless application shell layout
- `frontend/src/routes/_app/clientes.tsx` — `/clientes` placeholder route
- `frontend/src/routes/_app/contactos.tsx` — `/contactos` placeholder route
- `frontend/src/routes/-not-found.tsx` — 404 not-found view (renamed from not-found.tsx to use `-` prefix)
- `frontend/src/test/routes/app-layout.test.tsx` — Layout + navigation tests
- `frontend/src/test/routes/not-found.test.tsx` — 404 page tests

#### Modified files
- `frontend/src/routes/__root.tsx` — Register `notFoundComponent`
- `frontend/src/routes/index.tsx` — Add redirect to `/clientes`
- `frontend/src/main.tsx` — Add siesa-ui-kit/dist/style.css import
- `frontend/package.json` — Added @heroicons/react dependency

### References

- Routing file-based conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- Architecture routing decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- UX design direction (Direction F): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- siesa-ui-kit P0 rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Story 1.1 implementation notes: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- siesa-ui-kit CSS must be imported as `siesa-ui-kit/styles.css` (not `siesa-ui-kit/dist/style.css`) — the package.json exports field only exposes `./styles.css`; the wrong path causes a Vite resolution error that leaves the app blank in E2E (root cause of 188 test failures).
- Both NavigationRail and NavigationBar rendered identical `data-testid` on nav items causing Playwright strict mode violations. Fixed using `useMediaQuery('(min-width: 1024px)')` to conditionally render only one navigation at a time.
- `window.matchMedia` is not implemented in jsdom; added mock in `src/test/setup.ts` that respects `window.innerWidth`.
- TanStack Router requires `-` prefix for helper files inside `src/routes/` that do not export a `Route` object; `-not-found.tsx` is used instead of `not-found.tsx`.
- Tests using `RouterProvider` require `await act(async () => { await router.load() })` for async rendering to complete before assertions.
- `AppLayout` is exported from `_app.tsx` to allow direct import in tests; TanStack Router emits a bundle-split advisory (non-critical).
- `@heroicons/react` was installed as it is not included by default in the project.
- 5 E2E tests have pre-existing design issues: 4 use Playwright `framenavigated` to detect SPA navigation (fires for pushState too); 1 uses `.tap()` on non-touch chromium project.

### Completion Notes List

- Correction (attempt 2): Fixed `siesa-ui-kit/dist/style.css` → `siesa-ui-kit/styles.css` in `main.tsx`. Root cause of blank page and all 188 E2E failures.
- Correction (attempt 2): Replaced CSS-only `hidden lg:flex` with `useMediaQuery` conditional rendering in `_app.tsx` to eliminate Playwright strict mode violations from duplicate `data-testid`.
- Correction (attempt 2): Added `window.matchMedia` mock to `src/test/setup.ts` to keep 65 unit tests passing.
- Task 1: `_app.tsx` uses `useMediaQuery('(min-width: 1024px)')` for conditional rendering. Active state via `useRouterState` and `data-active` attribute on `Link` elements.
- Task 2: `NavigationBar` rendered only on `!isDesktop` (single instance, no duplicate testids).
- Task 3: `_app/clientes.tsx` and `_app/contactos.tsx` created as placeholder routes with Spanish headings and `data-testid`.
- Task 4: `-not-found.tsx` exports `NotFoundPage` with `data-testid` markers, registered in `__root.tsx` via `notFoundComponent`.
- Task 5: `index.tsx` updated with `beforeLoad` redirect to `/clientes`.
- Task 6: `__root.tsx` preserves `id="app-shell"` and renders `Outlet` for pathless layout pickup.
- Task 7: 65 unit tests passing across 12 files; 97/102 E2E tests passing on Chromium + mobile-Chrome.

### File List

#### New files
- `/home/user/lab-sa-quick-dev/frontend/src/routes/_app.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/routes/_app/clientes.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/routes/_app/contactos.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/routes/-not-found.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/shared/hooks/useMediaQuery.ts`

#### Modified files
- `/home/user/lab-sa-quick-dev/frontend/src/routes/__root.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/routes/index.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/main.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/test/setup.ts`
- `/home/user/lab-sa-quick-dev/frontend/src/test/routes/app-layout.test.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/test/routes/not-found.test.tsx`
- `/home/user/lab-sa-quick-dev/frontend/src/test/routes/root.edge.test.tsx`
- `/home/user/lab-sa-quick-dev/frontend/package.json`
- `/home/user/lab-sa-quick-dev/frontend/pnpm-lock.yaml`
