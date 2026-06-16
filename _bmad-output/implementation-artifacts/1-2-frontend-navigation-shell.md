# Story 1.2: Frontend Navigation Shell

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser, **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a mobile-responsive NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, **And** all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home screen, and the active navigation item is highlighted (FR30).

4. **Given** the user navigates to an unknown route (e.g., `/foo`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a link to return home.

5. **Given** the application is loaded on any viewport, **When** the user navigates between sections, **Then** only the content area re-renders — the navigation shell remains mounted and does not flicker (SPA behavior, no full page reloads).

6. **Given** the navigation structure is rendered, **When** inspected with an accessibility tool, **Then** all navigation links have visible focus indicators and correct ARIA labels in Spanish (WCAG 2.1 AA).

## Tasks / Subtasks

- [x] Task 1 — Create root layout with siesa-ui-kit navigation shell (AC: #1, #2, #5)
  - [x] Install/verify `siesa-ui-kit` is available in `frontend/package.json` (already installed in Story 1.1)
  - [x] Update `frontend/src/routes/__root.tsx` to implement the full layout shell using `NavigationRail` (siesa-ui-kit) for desktop (>= 1024px breakpoint) and `NavigationBar` (siesa-ui-kit) for mobile (< 1024px)
  - [x] Add responsive detection using CSS breakpoints (`lg:` Tailwind class) or `useMediaQuery` hook — prefer CSS-only approach (no JS resize listener) via Tailwind `hidden lg:flex` / `flex lg:hidden` to toggle rail vs bar
  - [x] Define navigation items array: `[{ label: 'Clientes', to: '/clientes', icon: UsersIcon }, { label: 'Contactos', to: '/contactos', icon: UserIcon }]` using Heroicons
  - [x] Wire active state: use TanStack Router `useRouterState` or `<Link>` `activeProps` to highlight the current section

- [x] Task 2 — Create TanStack Router file-based routes (AC: #3, #4)
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout route that wraps child routes with the navigation shell layout
  - [x] Create `frontend/src/routes/_app/` directory
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — route component for `/clientes`; renders a placeholder `ClientesView` (empty `<div>` with "Clientes" heading — full implementation deferred to Epic 2)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — route component for `/contactos`; renders a placeholder `ContactosView` (empty `<div>` with "Contactos" heading — full implementation deferred to Epic 3)
  - [x] Update `frontend/src/routes/index.tsx` — redirect `/` → `/clientes` using TanStack Router `redirect`
  - [x] Create 404 not-found view as `notFoundComponent` in `__root.tsx` — with Spanish text and back-to-home link

- [x] Task 3 — Verify auto-generated routeTree and router bootstrap (AC: #3, #5)
  - [x] Verify `frontend/src/routeTree.gen.ts` auto-regenerates correctly with the new routes (run `pnpm run dev` and confirm no router errors)
  - [x] Confirm `frontend/src/main.tsx` has `RouterProvider` at root level with the generated router
  - [x] Add `<Outlet />` in `__root.tsx` to render child routes properly

- [x] Task 4 — Accessibility compliance (AC: #6)
  - [x] Add `aria-label="Navegación principal"` to the `<nav>` wrapper element
  - [x] Ensure each navigation link has a visible focus ring (`focus-visible:ring-2` Tailwind class)
  - [x] Confirm all navigation text labels are in Spanish: "Clientes", "Contactos"
  - [x] Add `aria-current="page"` on the active navigation link

- [x] Task 5 — Unit tests (AC: #1–#6)
  - [x] Create `frontend/src/routes/__tests__/-root-layout.test.tsx` — test that NavigationRail renders on desktop viewport and NavigationBar renders on mobile viewport
  - [x] Test that navigating to `/clientes` highlights the Clientes link as active
  - [x] Test that an unknown route renders the 404 view
  - [x] Use Vitest + React Testing Library + TanStack Router `createMemoryHistory`

## Dev Notes

### siesa-ui-kit Navigation Components

This story is purely frontend UI — no backend work. siesa-ui-kit is the **mandatory P0 library** for all UI components. Before creating any custom navigation component, confirm if `NavigationRail` and `NavigationBar` exist in the siesa-ui-kit catalog.

- **NavigationRail**: Used on desktop (>= `lg` breakpoint = 1024px). Fixed to the left side of the layout. Shows icons + labels for each section.
- **NavigationBar**: Used on mobile (< `lg` breakpoint). Typically rendered at the bottom of the viewport. Horizontally arranged items.

If siesa-ui-kit does not export these exact component names, look for equivalent navigation components (e.g., `Sidebar`, `BottomNav`, `AppNav`). Do NOT build a custom navigation component if a siesa-ui-kit equivalent exists.

**Install check**: `siesa-ui-kit` was already installed in Story 1.1 via `pnpm add siesa-ui-kit`. Verify it is in `frontend/package.json` before starting.

### TanStack Router File-Based Routing Pattern

The architecture defines these exact route files:

```
frontend/src/routes/
├── __root.tsx                  # Root layout — global shell (NavigationRail + Outlet)
├── index.tsx                   # Redirect → /clientes
├── _app.tsx                    # Pathless layout route (_app prefix = no URL segment)
└── _app/
    ├── clientes.tsx            # /clientes — ClientesView placeholder
    └── contactos.tsx           # /contactos — ContactosView placeholder
```

The `_` prefix makes `_app.tsx` a **pathless layout route** — it wraps child routes in a layout without adding a URL segment.

**Root route (`__root.tsx`) pattern:**

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="flex h-screen">
      {/* Desktop: NavigationRail on left */}
      <nav aria-label="Navegación principal" className="hidden lg:flex">
        {/* siesa-ui-kit NavigationRail */}
      </nav>
      {/* Content area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {/* Mobile: NavigationBar at bottom */}
      <nav aria-label="Navegación principal" className="flex lg:hidden fixed bottom-0 w-full">
        {/* siesa-ui-kit NavigationBar */}
      </nav>
    </div>
  )
}
```

**Index redirect (`index.tsx`) pattern:**

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

**Placeholder route (`_app/clientes.tsx`) pattern:**

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesView,
})

function ClientesView() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Clientes</h1>
      {/* Full implementation in Epic 2 */}
    </div>
  )
}
```

### Active Link Highlighting

Use TanStack Router `<Link>` component with `activeProps` to apply active styles:

```tsx
import { Link } from '@tanstack/react-router'

<Link
  to="/clientes"
  activeProps={{ className: 'text-[#0e79fd] font-bold', 'aria-current': 'page' }}
>
  Clientes
</Link>
```

### Responsive Breakpoint

The architecture specifies `lg: 1024px` as the critical breakpoint for desktop vs. mobile layout. Use Tailwind classes:
- Desktop (rail): `hidden lg:block` or `hidden lg:flex`
- Mobile (bar): `block lg:hidden` or `flex lg:hidden`

**No JavaScript resize listeners** — CSS-only responsive switching is preferred.

### Previous Story Learnings (Story 1.1)

- **Package manager is `pnpm`** — do NOT use `npm install` or `yarn`. All commands must use `pnpm`.
- `routeTree.gen.ts` is auto-generated by the TanStack Router Vite plugin on `pnpm run dev`. Do NOT manually edit it.
- TailwindCSS v4 uses `@import "tailwindcss"` in `src/index.css` — NOT `@tailwind base/components/utilities`.
- TypeScript strict mode is active (`"strict": true`). Avoid `any` types — use proper types for all component props.
- `src/routes/__root.tsx` was created as a placeholder in Story 1.1 — this story will expand it with the full navigation shell.
- `src/shared/lib/apiClient.ts` and `queryClient.ts` exist and are available for use.
- shadcn/ui init was skipped in Story 1.1. If a navigation component is needed beyond siesa-ui-kit, add it via `pnpm dlx shadcn@latest add <component>`.

### Brand Colors & Design System

Per company standards:
- Primary (active state): `#0e79fd` (Siesa Blue)
- Tertiary (hover state): `#154ca9` (Deep Blue)
- Neutrals: Use Tailwind `slate-*` scale for inactive items
- Font: Inter (already configured via Tailwind)
- Icons: Heroicons (primary icon library) — use `@heroicons/react/24/outline` for nav icons

### Git Commit Pattern (from history)

Observed commit pattern: `feat(story-N.N): description` or `feat: description`. Follow this pattern when committing.

### Project Structure Notes

- **Files to create/modify in this story:**
  - `frontend/src/routes/__root.tsx` — MODIFY (add navigation shell)
  - `frontend/src/routes/index.tsx` — CREATE (redirect to /clientes)
  - `frontend/src/routes/_app.tsx` — CREATE (pathless layout route)
  - `frontend/src/routes/_app/clientes.tsx` — CREATE (placeholder)
  - `frontend/src/routes/_app/contactos.tsx` — CREATE (placeholder)
  - `frontend/src/routes/not-found.tsx` or `$404.tsx` — CREATE (404 view)
  - `frontend/src/routes/__tests__/root-layout.test.tsx` — CREATE (tests)

- **Files NOT to touch in this story:**
  - Backend files — no backend changes needed
  - `frontend/src/shared/lib/apiClient.ts` — no changes
  - `frontend/src/shared/lib/queryClient.ts` — no changes
  - `frontend/src/app/providers/QueryProvider.tsx` — no changes
  - Database/migration files — not applicable

- **No Zustand store needed**: Navigation active state is managed by TanStack Router's built-in active link detection. The URL is the source of truth (per architecture).

### References

- TanStack Router file-based routing: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Navigation shell structure (`__root.tsx`, `_app/`): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- siesa-ui-kit mandate (P0): [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Responsive breakpoint `lg: 1024px`: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Story AC requirements: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- FR28, FR29, FR30 (navigation without reload, mobile, deep linking): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- WCAG 2.1 AA accessibility: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- TanStack Router prefixes (`_` pathless): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implemented full navigation shell in `__root.tsx` using `NavigationRail` (desktop, hidden lg:flex) and `NavigationBar` (mobile, flex lg:hidden) from siesa-ui-kit.
- 404 not-found view implemented as `notFoundComponent` in `createRootRoute` — covers AC #4 without an extra route file.
- Test file renamed with `-` prefix (`-root-layout.test.tsx`) so TanStack Router CLI ignores it as a route file.
- `@heroicons/react` installed via pnpm as it was not present in the worktree dependencies.
- `siesa-ui-kit/dist/style.css` import added to `main.tsx`.
- All 12 tests pass (3 test files); TypeScript compiles with 0 errors.

### File List

**Created:**
- `frontend/src/routes/index.tsx` — redirect `/` → `/clientes`
- `frontend/src/routes/_app.tsx` — pathless layout route (wraps child routes)
- `frontend/src/routes/_app/clientes.tsx` — `/clientes` placeholder view
- `frontend/src/routes/_app/contactos.tsx` — `/contactos` placeholder view
- `frontend/src/routes/__tests__/-root-layout.test.tsx` — unit tests (12 tests)

**Modified:**
- `frontend/src/routes/__root.tsx` — full navigation shell with NavigationRail + NavigationBar + NotFoundView
- `frontend/src/main.tsx` — added `siesa-ui-kit/dist/style.css` import
- `frontend/src/routeTree.gen.ts` — auto-regenerated with all new routes
- `frontend/package.json` — added `@heroicons/react ^2.2.0`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updated to `review`
