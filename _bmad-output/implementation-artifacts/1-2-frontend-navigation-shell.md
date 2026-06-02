# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** the `LayoutBase` shell from `siesa-ui-kit` renders the `Navbar` (productName `"Siesa Agents"`) and a `NavigationRailGroup` is visible on the left with `"Clientes"` and `"Contactos"` entries; **And** clicking either entry navigates to `/clientes` or `/contactos` via TanStack Router without a full page reload (FR28, AC-1.2.a, AC-1.2.c, AC-E1.2).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** the desktop `NavigationRailGroup` is hidden (Tailwind responsive class — not JS media query) and a bottom-fixed `NavigationBar` from `siesa-ui-kit` is rendered instead with the `"Clientes"` and `"Contactos"` items; **And** all navigation items are tappable with touch targets ≥ 44×44px (FR29, AC-1.2.b, AC-E1.1).

3. **Given** the user types `/clientes` directly in the browser URL bar, **When** the page loads, **Then** the `ClientesPlaceholderView` is rendered inside the shell without redirection to a home screen, with no full reload (FR30, AC-1.2.d, AC-E1.3 — covered by TC-E1-P1-02).

4. **Given** the user types `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the `ContactosPlaceholderView` is rendered inside the shell without redirection (FR30, AC-1.2.d, AC-E1.3 — covered by TC-E1-P1-03).

5. **Given** the user navigates to an unknown route (e.g. `/ruta-que-no-existe`), **When** the page loads, **Then** a Spanish `NotFoundView` is rendered inside the shell layout (shell stays visible, status text in Spanish, link `"Ir a Clientes"` back to `/clientes`) — implemented via the TanStack Router root `notFoundComponent` (AC-1.2.e, TC-E1-P1-04).

6. **Given** the user opens the application root (`/`), **When** the index route loads, **Then** the router performs a TanStack Router `redirect` to `/clientes` (no `window.location` manipulation, no full reload) — TC-E1-P2-03.

7. **Given** the user is on `/clientes`, **When** they look at the `NavigationRailGroup` / `NavigationBar`, **Then** the active item is `"Clientes"` (the active state is wired from the current TanStack Router pathname, not from internal component state); the same applies to `/contactos`.

8. **Given** the keyboard user navigates the shell with `Tab`, **When** focus reaches each navigation item, **Then** a visible focus ring is shown, items expose `aria-label` in Spanish (`"Ir a Clientes"`, `"Ir a Contactos"`), and `Enter`/`Space` activates navigation (WCAG 2.1 AA — siesa-ui-kit defaults must be preserved, no removal of focus outlines).

9. **Given** the frontend test suite runs (`pnpm run test`), **When** Vitest executes, **Then** the new shell tests pass and the production build (`pnpm run build`) completes with zero TypeScript errors under `strict` / `noImplicitAny` / `strictNullChecks` and the bundle stays under 500 KB gzipped (NFR — bundle budget from `company-standards.md`).

## Tasks / Subtasks

- [ ] Task 1 — Add catch-all + index redirect to the TanStack Router shell (AC: #3, #4, #5, #6)
  - [ ] Convert `src/routes/__root.tsx` to a `createRootRouteWithContext` (or keep `createRootRoute`) that defines a `notFoundComponent` rendering `NotFoundView` inside the shell layout, so the shell layout still wraps the 404 view (TC-E1-P1-04).
  - [ ] Replace the body of `src/routes/index.tsx` with a TanStack Router `redirect({ to: '/clientes' })` thrown from `beforeLoad` so `/` deep-loads straight into `/clientes` with no flash (TC-E1-P2-03).
  - [ ] Confirm `routeTree.gen.ts` regenerates correctly via `@tanstack/router-plugin/vite` on `pnpm run dev` and that no manual edits are required.

- [ ] Task 2 — Create the `AppShell` presentation component wrapping `LayoutBase` (AC: #1, #2, #7, #8)
  - [ ] Create `frontend/src/app/layout/AppShell.tsx` that wraps `LayoutBase` from `siesa-ui-kit`. Props: `{ children: ReactNode }` (TS strict — explicit ReactNode, no `any`).
  - [ ] Build a `useShellNavigation()` hook in `frontend/src/app/layout/useShellNavigation.ts` that derives `activeId` from `useRouterState({ select: s => s.location.pathname })` (TanStack Router) and exposes `onNavigate(id)` calling `navigate({ to: '/clientes' | '/contactos' })`. Active item id rules: `"clientes"` if pathname starts with `/clientes`, `"contactos"` if starts with `/contactos`, else `null` (so 404 / `/` redirect cases don't crash).
  - [ ] Pass `navigationItems` to `LayoutBase` as `NavigationRailGroupMenuItem[]` with two items: `{ id: 'clientes', label: 'Clientes', icon: <UsersIcon className="h-5 w-5" />, active: activeId === 'clientes', onClick: () => onNavigate('clientes') }` and the analogous `contactos` item (`UserIcon`).
  - [ ] Wire `productName="Siesa Agents"` on `LayoutBase`. Do NOT pass `userDropdown` for MVP (no auth) — pass `hideSidebar={false}` (default) explicitly only if needed for clarity. `locale="es"` to lock Spanish.
  - [ ] Render the mobile `NavigationBar` from `siesa-ui-kit` as a sibling positioned bottom-fixed, with Tailwind responsive classes: container `lg:hidden fixed bottom-0 inset-x-0 z-40` and the desktop rail hidden under `lg:` via `LayoutBase` `navigationRailProps` (e.g. wrap the rail in a `hidden lg:block` parent). Items mirror the rail (`id: 'clientes' | 'contactos'`, Heroicons 24/outline).
  - [ ] Add `aria-label="Ir a Clientes"` / `"Ir a Contactos"` to each item. Do NOT override focus styles; preserve siesa-ui-kit defaults (WCAG 2.1 AA).
  - [ ] Touch target ≥ 44×44px is built into `NavigationBar` — do not shrink with custom classes. Add a comment noting this requirement.

- [ ] Task 3 — Mount `AppShell` in the root route and create placeholder route views (AC: #1, #3, #4)
  - [ ] In `src/routes/__root.tsx`, render `<AppShell><Outlet /></AppShell>` so all child routes inherit the shell. Keep `data-testid="app-root"` on the outermost wrapper for existing tests.
  - [ ] Create `src/routes/clientes.tsx` exporting `createFileRoute('/clientes')({ component: ClientesPlaceholderView })`. The placeholder view lives in `src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` and renders a Spanish `<h1>Clientes</h1>` + Skeleton placeholders (from `react-loading-skeleton`) — NO real data, NO API calls. This is just the shell target; full list view ships in Story 2.1.
  - [ ] Create `src/routes/contactos.tsx` exporting `createFileRoute('/contactos')({ component: ContactosPlaceholderView })` with `ContactosPlaceholderView` in `src/modules/crm/contactos/presentation/ContactosPlaceholderView.tsx`. Same skeleton pattern.
  - [ ] Both placeholder views must be SSR-safe (functional components, no `window` access outside `useEffect`).

- [ ] Task 4 — Build the `NotFoundView` (AC: #5)
  - [ ] Create `src/shared/components/NotFoundView.tsx` with: heading `"Página no encontrada"`, body `"La ruta solicitada no existe."`, and a TanStack Router `<Link to="/clientes">Ir a Clientes</Link>` styled with the brand primary color.
  - [ ] Wire it as `notFoundComponent` on the root route in `__root.tsx`.

- [ ] Task 5 — Tests (AC: #1, #2, #3, #4, #5, #6, #7, #9 — TC-E1-P1-01, TC-E1-P1-02/03, TC-E1-P1-04, TC-E1-P2-01, TC-E1-P2-02, TC-E1-P2-03)
  - [ ] Add `frontend/src/app/layout/AppShell.test.tsx` (Vitest + RTL + TanStack Router test utils) covering:
    - TC-E1-P1-01 — SPA navigation: render `<RouterProvider>` with an in-memory history, click the `"Clientes"` rail item, assert `router.state.location.pathname === '/clientes'` and `window.location.reload` has not been called (spy on it). Click `"Contactos"`, assert pathname switches without reload. Shell stays mounted (assert `app-root` element identity is stable across navigation via `getByTestId`).
    - TC-E1-P2-03 — `/` redirects to `/clientes`: start router at `/`, await router idle, assert final pathname is `/clientes`.
    - TC-E1-P1-04 — 404 view: start router at `/ruta-que-no-existe`, assert `NotFoundView` is rendered AND the `AppShell` is still visible (`app-root` test id present), AND the `"Ir a Clientes"` link works (click → pathname `/clientes`).
    - Active state: starting at `/clientes`, assert the `"Clientes"` nav item has `active=true` (e.g. via `aria-current="page"` or active CSS class exposed by siesa-ui-kit — assert whichever the rendered DOM exposes; fallback to `data-active="true"` if siesa-ui-kit exposes it).
  - [ ] Add `frontend/src/app/layout/AppShellResponsive.test.tsx` covering TC-E1-P2-01 (desktop 1280px → `NavigationRailGroup` visible, `NavigationBar` hidden) and TC-E1-P2-02 (mobile 375px → `NavigationBar` visible, rail hidden). Use `window.matchMedia` mock or Vitest `vi.stubGlobal('innerWidth', N)` plus `Object.defineProperty(window, 'innerWidth', ...)` with `dispatchEvent(new Event('resize'))`. Assertion is based on the `lg:hidden` / `hidden lg:block` Tailwind classes rendering — query by role/test-id, NOT by computed style.
  - [ ] Build gate: ensure `pnpm run build` (i.e. `tsc -b && vite build`) exits 0 and the gzipped main chunk is ≤ 500 KB (Vite prints this; capture in completion notes — no automated assertion needed beyond a visual check).

- [ ] Task 6 — Cleanup & docs (AC: #9)
  - [ ] Remove the temporary landing page content from the previous `src/routes/index.tsx` (the "Aplicación inicializada correctamente" copy) — it is superseded by the redirect.
  - [ ] Verify `siesa-ui-kit/styles.css` is imported once globally (already in `src/index.css` from Story 1.1 — if not, add `@import 'siesa-ui-kit/styles.css';` at the top of `src/index.css` BEFORE the `@import 'tailwindcss';` line so Tailwind utilities can override defaults).
  - [ ] Run `pnpm run lint` and resolve any new warnings introduced by the shell components.
  - [ ] Update the `File List` section below with every created / modified file.

## Dev Notes

### Architecture Pattern — Clean Architecture + DDD (frontend)

This story lives in the **presentation / app shell** layer. No `domain/`, `application/`, or `infrastructure/` files are added for `clientes` or `contactos` in this story — those arrive in Epics 2 and 3. Only **placeholder presentation components** plus a cross-cutting shell composition (`src/app/layout/`).

```
frontend/src/
├── app/
│   └── layout/                          ← NEW
│       ├── AppShell.tsx
│       ├── AppShell.test.tsx
│       ├── AppShellResponsive.test.tsx
│       └── useShellNavigation.ts
├── routes/
│   ├── __root.tsx                       ← MODIFIED (notFoundComponent + AppShell wrap)
│   ├── index.tsx                        ← MODIFIED (redirect → /clientes)
│   ├── clientes.tsx                     ← NEW
│   └── contactos.tsx                    ← NEW
├── modules/crm/
│   ├── clientes/presentation/
│   │   └── ClientesPlaceholderView.tsx  ← NEW
│   └── contactos/presentation/
│       └── ContactosPlaceholderView.tsx ← NEW
└── shared/components/
    └── NotFoundView.tsx                 ← NEW
```

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure`]
[Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]

### UI Implementation Requirements (MANDATORY — siesa-ui-kit P0)

- **Library:** `siesa-ui-kit` (already installed in Story 1.1 — version `^1.0.206`).
- **CSS import:** `import 'siesa-ui-kit/styles.css'` must be in `src/index.css` (or `main.tsx`) BEFORE the Tailwind `@import 'tailwindcss';` so Tailwind utility classes win specificity.
- **Components used:**
  - `LayoutBase` (`siesa-ui-kit/views/LayoutBase`) — the application shell. Pass `productName`, `navigationItems` (typed as `NavigationRailGroupMenuItem[]`), `locale="es"`, and optionally `navigationRailProps`.
  - `NavigationRailGroup` (used internally by `LayoutBase`) — desktop left rail.
  - `NavigationBar` (`siesa-ui-kit/components/NavigationBar`) — bottom nav for mobile. Pass `items: NavigationBarItem[]`, `activeItemId`, `onItemClick`.
  - Heroicons (`@heroicons/react/24/outline`) for the icons — `UsersIcon` for Clientes, `UserIcon` (or `IdentificationIcon`) for Contactos. **NOTE:** `@heroicons/react` is NOT yet in `package.json` — add it: `pnpm add @heroicons/react`. (Heroicons is the primary icon family per company UX design system.)
- **Constraint:** Do NOT build custom navigation — always reach for `siesa-ui-kit` first. Do NOT add a `Drawer` / `Sheet` mobile menu — the bottom `NavigationBar` is the canonical mobile pattern from the UX spec.
- **Active state:** wired from TanStack Router pathname via `useRouterState` selector, NOT from siesa-ui-kit internal state. This avoids dual sources of truth for "which route is active".

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]
[Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Direction F — LayoutBase + Lista/Detalle + ContactManager`]
[Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns`]
[Source: `frontend/node_modules/siesa-ui-kit/dist/views/LayoutBase/LayoutBase.types.d.ts`]
[Source: `frontend/node_modules/siesa-ui-kit/dist/components/NavigationBar/NavigationBar.types.d.ts`]
[Source: `frontend/node_modules/siesa-ui-kit/dist/components/NavigationRailGroup/NavigationRailGroup.types.d.ts`]

### Routing Strategy — TanStack Router (file-based)

- **Mode:** File-based routing via `@tanstack/router-plugin/vite` (already configured in Story 1.1).
- **Catch-all 404:** Use the root route's `notFoundComponent` option (TanStack Router native pattern) — do NOT add a `splat.tsx` file unless the team explicitly opts in. The `notFoundComponent` fires for any path the route tree cannot resolve and runs INSIDE the shell layout (because it's rendered by `__root`).
- **Index redirect:** `src/routes/index.tsx` should `throw redirect({ to: '/clientes' })` from `beforeLoad`. This is the official TanStack Router idiom for declarative redirects and avoids `<Navigate />` hacks.
- **Active item derivation:** Use `useRouterState({ select: (s) => s.location.pathname })` so the rail/bar reactively re-renders on every navigation. Avoid `useMatchRoute` here because `/clientes/:id` (Epic 2) must also light up `"Clientes"` — a `startsWith('/clientes')` prefix test is the simplest forward-compatible rule.

[Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture` — routing block]
[Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#12. Notes for Story Implementation Agents` items 5 & 6]

### Responsive Strategy

| Viewport | Breakpoint | Nav Component | Layout |
|---|---|---|---|
| Mobile | `< 1024px` (base → `md:`) | `NavigationBar` bottom-fixed (56px) | `LayoutBase` with rail hidden via Tailwind `hidden lg:block` wrapper |
| Tablet | `768–1023px` (`md:` only) | `NavigationBar` (same as mobile per UX spec) | Same as mobile — the `lg:` breakpoint is the activation point per UX spec |
| Desktop | `≥ 1024px` (`lg:`) | `NavigationRailGroup` (72–80px collapsed) | `LayoutBase` default — rail visible, `NavigationBar` hidden via `lg:hidden` |

- The critical breakpoint is `lg: 1024px` per the UX spec — this is the activation point of the split-panel desktop experience.
- Use Tailwind responsive classes ONLY (`lg:hidden`, `hidden lg:block`). NO JS-driven `useMediaQuery` for the swap — that introduces SSR/hydration friction and is explicitly flagged in test-design notes item 7.

[Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy` + `#Breakpoint Strategy`]
[Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#12. Notes for Story Implementation Agents` item 7]

### Test Strategy & TEA Traceability

This story must pass the Epic 1 test design test cases:

| Test ID | Level | AC | Owner |
|---|---|---|---|
| TC-E1-P1-01 | Component (Vitest+RTL) | #1, #7 — SPA navigation, no reload, active state | DEV |
| TC-E1-P1-02 | E2E (Playwright) | #3 — Deep link `/clientes` | QA |
| TC-E1-P1-03 | E2E (Playwright) | #4 — Deep link `/contactos` | QA |
| TC-E1-P1-04 | Component | #5 — 404 / not-found view | DEV |
| TC-E1-P2-01 | Component | #1 — `NavigationRailGroup` visible at 1280px | DEV |
| TC-E1-P2-02 | Component | #2 — `NavigationBar` visible at 375px | DEV |
| TC-E1-P2-03 | Component | #6 — `/` → `/clientes` redirect | DEV |

**Frontend tooling already wired in Story 1.1:** Vitest 4 + `@testing-library/react` 16 + `@testing-library/jest-dom` 6 + `jsdom` 29 + MSW 2. No additional dev deps required for component tests in this story. Playwright (E2E) is QA-owned and lives outside the frontend Vitest scope for Epic 1.

[Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#3.2 P1` + `#3.3 P2`]
[Source: `frontend/package.json` (devDependencies)]

### Code & Convention Rules (NON-NEGOTIABLE — from company standards)

- **TypeScript strict mode:** No `any`. Explicit types on all exported functions, components, and hook returns. `useRouterState` selector returns must be typed (the selector function inference is enough).
- **All user-facing text in Spanish:** `"Clientes"`, `"Contactos"`, `"Página no encontrada"`, `"Ir a Clientes"`, etc. Code identifiers in English (`AppShell`, `NotFoundView`, `useShellNavigation`).
- **Components:** Functional components + hooks only. No class components.
- **Package manager:** `pnpm` (NOT npm or yarn). Add Heroicons with `pnpm add @heroicons/react`.
- **State:** No Zustand store is needed for navigation. URL is the source of truth — derive active item from pathname. No `useState` for "current route".
- **Accessibility:** WCAG 2.1 AA. `aria-label` in Spanish on each nav item. Preserve siesa-ui-kit focus rings. Touch targets ≥ 44×44px (default in `NavigationBar`).
- **Bundle budget:** < 500 KB gzipped. Heroicons is tree-shakable; import individual icons (`import { UsersIcon } from '@heroicons/react/24/outline'`), never the barrel.

[Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]

### Concrete Code Skeleton (reference — adapt during implementation)

**`src/app/layout/useShellNavigation.ts`:**
```typescript
import { useNavigate, useRouterState } from '@tanstack/react-router'

type NavId = 'clientes' | 'contactos'

export interface ShellNavigation {
  activeId: NavId | null
  onNavigate: (id: NavId) => void
}

export function useShellNavigation(): ShellNavigation {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()

  const activeId: NavId | null = pathname.startsWith('/clientes')
    ? 'clientes'
    : pathname.startsWith('/contactos')
      ? 'contactos'
      : null

  return {
    activeId,
    onNavigate: (id) => {
      void navigate({ to: id === 'clientes' ? '/clientes' : '/contactos' })
    },
  }
}
```

**`src/app/layout/AppShell.tsx` (shape only):**
```typescript
import type { ReactNode } from 'react'
import { LayoutBase, NavigationBar } from 'siesa-ui-kit'
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'
import { useShellNavigation } from './useShellNavigation'

export function AppShell({ children }: { children: ReactNode }) {
  const { activeId, onNavigate } = useShellNavigation()

  const navigationItems = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UsersIcon className="h-5 w-5" aria-hidden="true" />,
      active: activeId === 'clientes',
      onClick: () => onNavigate('clientes'),
    },
    {
      id: 'contactos',
      label: 'Contactos',
      icon: <UserIcon className="h-5 w-5" aria-hidden="true" />,
      active: activeId === 'contactos',
      onClick: () => onNavigate('contactos'),
    },
  ]

  return (
    <div data-testid="app-root" className="min-h-screen bg-white text-slate-900">
      <div className="hidden lg:block">
        <LayoutBase
          productName="Siesa Agents"
          navigationItems={navigationItems}
          locale="es"
        >
          {children}
        </LayoutBase>
      </div>

      <div className="lg:hidden flex flex-col min-h-screen">
        <main className="flex-1 pb-14">{children}</main>
        <NavigationBar
          activeItemId={activeId ?? undefined}
          onItemClick={(id) => onNavigate(id as 'clientes' | 'contactos')}
          items={[
            {
              id: 'clientes',
              label: 'Clientes',
              icon: <UsersIcon className="h-6 w-6" aria-hidden="true" />,
              active: activeId === 'clientes',
              ariaLabel: 'Ir a Clientes',
            },
            {
              id: 'contactos',
              label: 'Contactos',
              icon: <UserIcon className="h-6 w-6" aria-hidden="true" />,
              active: activeId === 'contactos',
              ariaLabel: 'Ir a Contactos',
            },
          ]}
          className="fixed bottom-0 inset-x-0 z-40"
          ariaLabel="Navegación principal"
        />
      </div>
    </div>
  )
}
```

**`src/routes/__root.tsx` (after modifications):**
```typescript
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { AppShell } from '../app/layout/AppShell'
import { NotFoundView } from '../shared/components/NotFoundView'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
```

**`src/routes/index.tsx` (after modifications):**
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

### Previous Story Learnings (from Story 1.1)

- `siesa-ui-kit` is installed and importable. Story 1.1 confirmed `pnpm` is mandatory.
- `tsconfig.app.json` is in **strict** mode. Any new TypeScript code must satisfy it — no `// @ts-ignore`.
- `frontend/src/index.css` already imports Tailwind v4 (`@import "tailwindcss"`). If `siesa-ui-kit/styles.css` was not already imported there, add it BEFORE the Tailwind import.
- `vite.config.ts` has the TanStack Router plugin wired — `routeTree.gen.ts` regenerates automatically on save.
- Test runner: Vitest 4 with `jsdom` 29, RTL 16. Test setup file is `src/test/setup.ts`.
- The route `src/routes/index.tsx` currently renders a temporary landing page — it MUST be replaced by the redirect in Task 1.
- Bundle from Story 1.1 was 93.97 KB gzipped — there is generous headroom for `@heroicons/react` (a few KB tree-shaken) and the additional shell code.

[Source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md` — Dev Agent Record]

### Git & Project Patterns

- File naming: `PascalCase.tsx` for components, `camelCase.ts` for hooks/utilities (`useShellNavigation.ts`). Tests co-located alongside the component (`AppShell.test.tsx` next to `AppShell.tsx`).
- Existing commit cadence (from Story 1.1): tasks are committed as cohesive units; each Task above should map to ~1 commit. Run `pnpm run lint && pnpm run test && pnpm run build` before requesting review.

### Project Structure Notes

- Story 1.1 created the scaffolding folders `src/modules/crm/{clientes,contactos}/presentation/` empty. This story fills `presentation/` of both modules with placeholder views — domain / application / infrastructure remain empty for Epic 2 / 3.
- `src/app/layout/` is a NEW folder, created in this story for the shell composition. It belongs to the global `app/` layer per `company-standards.md` Frontend Folder Structure (`app/` is "Global: providers/, store/, config/" — `layout/` is consistent with that level of cross-cutting concerns).
- No backend changes in this story — Story 1.3 owns the backend foundation.

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2: Frontend Navigation Shell`]
- Architecture (routing, folder structure, brand): [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`] · [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- UX direction (LayoutBase + NavigationRail + responsive): [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Direction F`] · [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns`] · [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy`]
- Test design (TC-E1-* IDs + implementation notes): [Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#3.2 P1`] · [Source: `_bmad-output/implementation-artifacts/test-design-epic-1.md#12. Notes for Story Implementation Agents`]
- Company standards (stack, Spanish text, WCAG, bundle): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- Previous story (state of repo): [Source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`]
- siesa-ui-kit type contracts: [Source: `frontend/node_modules/siesa-ui-kit/dist/views/LayoutBase/LayoutBase.types.d.ts`] · [Source: `frontend/node_modules/siesa-ui-kit/dist/components/NavigationBar/NavigationBar.types.d.ts`] · [Source: `frontend/node_modules/siesa-ui-kit/dist/components/NavigationRailGroup/NavigationRailGroup.types.d.ts`]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

### Completion Notes List

### File List
