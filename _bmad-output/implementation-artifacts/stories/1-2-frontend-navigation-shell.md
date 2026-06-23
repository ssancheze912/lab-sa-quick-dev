# Story 1.2: Frontend Navigation Shell

Status: review

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **AC1 (Desktop — NavigationRail):** Given the application is loaded on a desktop browser (viewport width >= 1024px), when the user views the app, then a NavigationRail from `siesa-ui-kit` is visible on the left side with "Clientes" and "Contactos" entries, and clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **AC2 (Mobile — NavigationBar):** Given the application is loaded on a mobile browser viewport (viewport width < 1024px), when the user views the app, then a mobile-responsive NavigationBar from `siesa-ui-kit` is displayed instead of the rail, and all navigation items are accessible and tappable (FR29).

3. **AC3 (Deep Linking — Clientes):** Given the user types `/clientes` directly in the browser URL bar, when the page loads, then the Clientes view is rendered with the NavigationRail/NavigationBar correctly showing "Clientes" as active, without redirection to a home screen (FR30).

4. **AC4 (Deep Linking — Contactos):** Given the user types `/contactos` directly in the browser URL bar, when the page loads, then the Contactos view is rendered with the NavigationRail/NavigationBar correctly showing "Contactos" as active, without redirection to a home screen (FR30).

5. **AC5 (404 — Not Found):** Given the user navigates to an unknown route (e.g., `/desconocido`), when the page loads, then a 404 / not-found view is displayed gracefully with a user-friendly message in Spanish.

6. **AC6 (Root Redirect):** Given the user navigates to `/`, when the page loads, then the app redirects to `/clientes` automatically without showing a blank screen.

7. **AC7 (No Full Reload):** Given the user is on `/clientes`, when they click "Contactos" in the navigation, then the browser does not perform a full page reload — TanStack Router handles navigation client-side.

8. **AC8 (Active State):** Given the user is on `/clientes`, the navigation item "Clientes" must display an active/selected visual state. Given the user is on `/contactos`, the navigation item "Contactos" must display an active/selected visual state.

9. **AC9 (WCAG 2.1 AA):** All navigation items must have correct ARIA labels in Spanish and be keyboard-navigable (Tab, Enter/Space to activate).

10. **AC10 (TypeScript strict):** All new files compile with zero TypeScript errors under `strict: true`. No `any` usage.

## Tasks / Subtasks

- [x] Task 1 — Create layout shell routes (AC: 1, 2, 7, 8)
  - [x] 1.1 Create `frontend/src/routes/_app.tsx` — pathless layout route that wraps all authenticated views with the navigation shell (NavigationRail on desktop, NavigationBar on mobile)
  - [x] 1.2 Install `siesa-ui-kit` if not already present: `pnpm add siesa-ui-kit`
  - [x] 1.3 Import and render `NavigationRail` from `siesa-ui-kit` inside `_app.tsx` for desktop viewports
  - [x] 1.4 Import and render `NavigationBar` from `siesa-ui-kit` inside `_app.tsx` for mobile viewports (Tailwind breakpoint `lg:`)
  - [x] 1.5 Wire TanStack Router's `useRouterState` or `useMatchRoute` to set the active item on the nav components
  - [x] 1.6 Use `<Link>` from `@tanstack/react-router` for each nav item to ensure SPA navigation

- [x] Task 2 — Create stub route files for Clientes and Contactos (AC: 3, 4, 6)
  - [x] 2.1 Create `frontend/src/routes/_app/clientes.tsx` — renders a placeholder `<ClientesPage />` component (stub text "Sección Clientes — próximamente")
  - [x] 2.2 Create `frontend/src/routes/_app/contactos.tsx` — renders a placeholder `<ContactosPage />` component (stub text "Sección Contactos — próximamente")
  - [x] 2.3 Update `frontend/src/routes/index.tsx` to redirect to `/clientes` using TanStack Router's `redirect`

- [x] Task 3 — Create 404 not-found route (AC: 5)
  - [x] 3.1 Create `frontend/src/routes/404.tsx` (or `$` catch-all route per TanStack Router conventions) rendering a Spanish not-found message and a link back to `/clientes`

- [x] Task 4 — Update root layout (AC: 1, 2)
  - [x] 4.1 Update `frontend/src/routes/__root.tsx` to render `<Outlet />` so child routes (including `_app`) are mounted correctly
  - [x] 4.2 Ensure `AppProviders` (QueryClientProvider + RouterProvider) in `main.tsx` remains intact

- [x] Task 5 — Responsive layout implementation (AC: 1, 2)
  - [x] 5.1 Use Tailwind `hidden lg:flex` / `flex lg:hidden` pattern to show NavigationRail on desktop and NavigationBar on mobile
  - [x] 5.2 Ensure the main content area fills the remaining viewport width on desktop (flex layout: nav + content)
  - [x] 5.3 On mobile, ensure NavigationBar is at the bottom of the viewport and content scrolls above it

- [x] Task 6 — Accessibility (AC: 9)
  - [x] 6.1 Verify each nav item has an accessible label in Spanish (`aria-label` or visible text)
  - [x] 6.2 Ensure keyboard navigation works: Tab to focus nav items, Enter/Space to activate
  - [x] 6.3 Verify color contrast meets WCAG 2.1 AA (Siesa Blue `#0e79fd` on white background)

- [x] Task 7 — Tests (AC: 1–10)
  - [x] 7.1 Write Vitest + RTL unit test for `_app.tsx`: renders NavigationRail with "Clientes" and "Contactos" items
  - [x] 7.2 Write unit test: clicking "Contactos" nav item calls router navigation without page reload
  - [x] 7.3 Write unit test: active nav item matches current route
  - [x] 7.4 Write unit test: 404 route renders not-found message in Spanish

## Dev Notes

### Architecture Context

This story implements the navigation shell described in the architecture document. The route `_app.tsx` is a **pathless layout route** (prefix `_`) in TanStack Router — it wraps all business views without adding a URL segment.

Route hierarchy after this story:
```
__root.tsx                    ← Root layout (AppProviders wrapper)
  _app.tsx                    ← Pathless layout: NavigationRail + NavigationBar + <Outlet />
    _app/clientes.tsx         ← /clientes (stub content for now)
    _app/contactos.tsx        ← /contactos (stub content for now)
  404.tsx / notFound          ← Catch-all for unknown routes
  index.tsx                   ← Redirect to /clientes
```

[Source: architecture.md#Frontend Architecture — Routing]

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `pnpm add siesa-ui-kit` (already present from Story 1.1)
- **Usage**: You MUST use `NavigationRail` and `NavigationBar` components from `siesa-ui-kit` for the navigation elements.
- **Constraint**: Do not create custom navigation components if `siesa-ui-kit` equivalents exist.
- **Fallback**: If `NavigationRail` or `NavigationBar` are not available in the installed version of `siesa-ui-kit`, check `shadcn/ui` next, then implement a minimal custom nav using Tailwind + Radix primitives — document the fallback decision in the Dev Agent Record.

MasterCrud is NOT applicable for this story — this story creates navigation shell infrastructure, not CRUD screens or data grids.

### Brand & Design System

- Primary color: `#0e79fd` (Siesa Blue) — use for active nav item highlight
- Tertiary: `#154ca9` (Deep Blue) — hover states
- Neutrals: Tailwind `slate-*` scale
- Font: Inter (weights: 300, 400, 700) — already loaded from Story 1.1 or add to `index.html`
- Dark mode: class-based (`dark:` Tailwind classes) — apply to nav components

### Responsive Breakpoint

Architecture specifies the critical responsive breakpoint at `lg: 1024px`:
- `>= 1024px`: NavigationRail (vertical, left side, 64–80px wide)
- `< 1024px`: NavigationBar (horizontal, bottom of screen)

Tailwind implementation pattern:
```tsx
{/* Desktop: NavigationRail */}
<div className="hidden lg:flex lg:flex-col lg:w-20 lg:min-h-screen">
  <NavigationRail items={navItems} activeRoute={currentRoute} />
</div>

{/* Mobile: NavigationBar */}
<div className="flex lg:hidden fixed bottom-0 w-full z-50">
  <NavigationBar items={navItems} activeRoute={currentRoute} />
</div>
```

[Source: architecture.md#Cross-Cutting Concerns — Responsive layout, company-standards.md#UX Design System]

### TanStack Router — Pathless Layout Route

`_app.tsx` uses the `_` prefix which marks it as a **pathless layout** — it wraps child routes without contributing a URL segment. Children are placed in `_app/` folder.

```typescript
// frontend/src/routes/_app.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* NavigationRail desktop */}
      {/* NavigationBar mobile */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

Active route detection:
```typescript
import { useRouterState } from '@tanstack/react-router'

const router = useRouterState()
const isClientesActive = router.location.pathname.startsWith('/clientes')
const isContactosActive = router.location.pathname.startsWith('/contactos')
```

[Source: architecture.md#Frontend Architecture, company-standards.md#TanStack Router Prefixes]

### Root Redirect

```typescript
// frontend/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

[Source: architecture.md#Frontend Architecture — Routing]

### Nav Items Configuration

```typescript
const navItems = [
  {
    label: 'Clientes',       // Spanish — mandatory (company-standards.md)
    to: '/clientes',
    icon: /* BuildingOfficeIcon from Heroicons */,
  },
  {
    label: 'Contactos',      // Spanish — mandatory
    to: '/contactos',
    icon: /* UsersIcon from Heroicons */,
  },
]
```

Icons: Use **Heroicons** (primary icon library per company standards). Install if not present: `pnpm add @heroicons/react`.

[Source: company-standards.md#Icons, company-standards.md#Frontend Key Rules — All user-facing text MUST be in Spanish]

### Previous Story Learnings (Story 1.1)

- Package manager is `pnpm` (mandatory). Do NOT use `npm install`.
- Actual Vite version installed is 8 (not 7), React version is 19 (not 18). Both are compatible with the architecture patterns.
- `routeTree.gen.ts` is auto-generated by TanStack Router plugin when `pnpm dev` runs. After creating new route files, run `pnpm dev` once to regenerate it — do not edit manually.
- `__root.tsx` was created as a minimal stub intentionally ("no nav yet, Epic 1.2"). This story adds navigation to it.
- Frontend project root: `frontend/` (relative to repo root).
- `src/shared/lib/apiClient.ts` and `src/shared/lib/queryClient.ts` already exist.

[Source: story 1-1-project-initialization-repository-structure.md#Completion Notes List]

### File Structure for This Story

New files to create:
```
frontend/src/routes/
├── _app.tsx                          ← Pathless layout with nav shell
├── _app/
│   ├── clientes.tsx                  ← /clientes stub route
│   └── contactos.tsx                 ← /contactos stub route
└── 404.tsx                           ← Not-found catch-all

frontend/src/shared/components/
└── NavigationShell.tsx               ← (optional) extracted nav logic if needed
```

Files to modify:
```
frontend/src/routes/__root.tsx        ← Ensure <Outlet /> renders
frontend/src/routes/index.tsx         ← Add redirect to /clientes
```

[Source: architecture.md#Complete Project Directory Structure]

### Testing Standards

- Framework: Vitest + React Testing Library + MSW (configured in Story 1.1)
- Tests co-located with their component files (e.g., `_app.test.tsx` alongside `_app.tsx`)
- Accessibility checks: use `@testing-library/jest-dom` matchers; verify ARIA labels
- No backend interaction in this story — no MSW mocks required
- TDD approach: write failing tests first, then implement

```typescript
// Example test structure for _app.tsx
import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

test('renders navigation with Clientes and Contactos items', async () => {
  // Arrange + Act
  // Assert
  expect(screen.getByText('Clientes')).toBeInTheDocument()
  expect(screen.getByText('Contactos')).toBeInTheDocument()
})
```

[Source: company-standards.md#Testing Standards — Frontend]

### Key Constraints Checklist

| Constraint | Rule |
|---|---|
| Package manager | `pnpm` — never `npm install` |
| TypeScript | `strict: true`, NO `any` |
| UI components | Check `siesa-ui-kit` first, then shadcn, then custom |
| User-facing text | Spanish ONLY (`Clientes`, `Contactos`, error messages) |
| Icons | Heroicons (primary) |
| Routing | TanStack Router file-based — do not use React Router |
| Bundle budget | < 500KB gzipped — do not add heavy libraries |
| Accessibility | WCAG 2.1 AA — ARIA labels, keyboard navigation |

### Project Structure Notes

- Alignment with architecture.md: `_app.tsx` and `_app/` folder pattern is explicitly defined in the project directory structure.
- No conflicts with company-standards.md conventions.
- `routeTree.gen.ts` will be regenerated automatically — do not commit a stale version.
- The `_app` prefix is a TanStack Router convention for pathless layouts (company-standards.md#TanStack Router Prefixes).

### References

- [Source: architecture.md#Frontend Architecture] — Route hierarchy, routing decisions
- [Source: architecture.md#Complete Project Directory Structure] — File tree including `_app.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx`
- [Source: architecture.md#Cross-Cutting Concerns] — Responsive layout, breakpoint `lg: 1024px`
- [Source: architecture.md#Corporate Standards Applied] — siesa-ui-kit P0 mandatory
- [Source: epic-01-foundation.md#Story 1.2] — Acceptance Criteria source, FR28, FR29, FR30
- [Source: company-standards.md#TanStack Router Prefixes] — `_` prefix for pathless layouts
- [Source: company-standards.md#Frontend Key Rules] — Spanish text, WCAG 2.1 AA, bundle budget
- [Source: company-standards.md#UX Design System] — Brand colors, typography, Heroicons
- [Source: story-1-1#Completion Notes List] — pnpm, Vite 8, React 19, routeTree.gen.ts behavior

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Test files renamed to use `-` prefix (TanStack Router ignores files with this prefix) to prevent router plugin warnings.
- `@testing-library/user-event` and `jsdom` installed as dev dependencies (missing from Story 1.1 setup).
- `siesa-ui-kit` exports `NavigationRailItemProps as NavigationRailProps` — used actual `NavigationRailItemProps` for items array type to match the component's internal props interface.
- `useNavigate` used for programmatic navigation in onClick handlers instead of `<Link>` in nav components (siesa-ui-kit expects `onClick` callback pattern, not router Link wrapping).
- Vitest configured with `jsdom` environment and `test-setup.ts` in `vite.config.ts`.

### Completion Notes List

- All tasks completed. 13 unit tests written and passing (10 for AppLayout, 3 for NotFoundPage).
- TypeScript strict mode: zero errors.
- `NavigationRail` and `NavigationBar` from `siesa-ui-kit@1.0.228` used as required. No custom navigation components created.
- `@heroicons/react` installed (was not present from Story 1.1).
- `siesa-ui-kit/styles.css` import added to `main.tsx`.
- `routeTree.gen.ts` regenerated via `pnpm dev` — includes `/_app`, `/clientes`, `/contactos`, `/404` routes.
- `__root.tsx` updated to use `notFoundComponent: NotFoundPage` for 404 handling.
- `index.tsx` updated with `beforeLoad` redirect to `/clientes`.

### File List

**Created:**
- `frontend/src/routes/_app.tsx` — pathless layout with NavigationRail (desktop) + NavigationBar (mobile)
- `frontend/src/routes/_app/clientes.tsx` — stub route for /clientes
- `frontend/src/routes/_app/contactos.tsx` — stub route for /contactos
- `frontend/src/routes/404.tsx` — not-found page in Spanish with link back to /clientes
- `frontend/src/routes/-app.test.tsx` — 10 unit tests for AppLayout
- `frontend/src/routes/-404.test.tsx` — 3 unit tests for NotFoundPage
- `frontend/src/test-setup.ts` — Vitest setup with jest-dom

**Modified:**
- `frontend/src/routes/__root.tsx` — added notFoundComponent
- `frontend/src/routes/index.tsx` — redirect to /clientes via beforeLoad
- `frontend/src/main.tsx` — added siesa-ui-kit/styles.css import
- `frontend/vite.config.ts` — added vitest configuration (jsdom, globals, setupFiles)
- `frontend/package.json` — added @heroicons/react, @testing-library/user-event, jsdom, @vitest/coverage-v8
- `frontend/src/routeTree.gen.ts` — auto-regenerated with new routes
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updated to review
