# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px), **When** the user views the app, **Then** the siesa-ui-kit `LayoutBase` (with its internal `NavigationRail` / `NavigationRailGroup` sidebar) is visible on the left side with two navigation entries labeled "Clientes" and "Contactos", **And** clicking either entry navigates to `/clientes` or `/contactos` via TanStack Router (`useNavigate`) without a full page reload (`window.location` is NOT reassigned) — satisfies FR28 + AC-E1.2.

2. **Given** the application is loaded on a mobile browser viewport (< 1024px, e.g. 375px), **When** the user views the app, **Then** the siesa-ui-kit `NavigationBar` (bottom nav, 56px) is displayed in place of the desktop NavigationRail, **And** both navigation items ("Clientes", "Contactos") are visible, tappable (≥ 44px touch target) and trigger router navigation to `/clientes` / `/contactos` — satisfies FR29 + AC-E1.1.

3. **Given** the user enters `http://localhost:5173/clientes` or `http://localhost:5173/contactos` directly in the browser URL bar (deep link, no prior in-app navigation), **When** the page loads, **Then** the corresponding view renders inside the persistent shell with no redirect to a home screen — satisfies FR30 + AC-E1.3.

4. **Given** the user navigates to any unknown route (e.g. `/ruta-que-no-existe`), **When** the page loads, **Then** a 404 / not-found view is rendered gracefully inside the persistent shell layout (Spanish text, e.g. "Página no encontrada"), **And** a link/CTA to return to `/clientes` is present.

5. **Given** the user enters the root URL `/`, **When** the route resolves, **Then** TanStack Router redirects to `/clientes` (the default landing route).

6. **Given** the user is currently on `/clientes`, **When** the NavigationRail / NavigationBar renders, **Then** the "Clientes" entry shows the active state (per siesa-ui-kit `active: true` prop on `NavigationRailGroupMenuItem` and `activeItemId` on `NavigationBar`), and "Contactos" shows the inactive state; the same applies symmetrically on `/contactos`.

7. **Given** all UI text is rendered, **When** any nav item, page title, 404 message, or `aria-label` is shown, **Then** the text is in Spanish (per company P0 rule); icon-only buttons expose Spanish `aria-label`s, and the navigation containers expose `ariaLabel` props in Spanish ("Navegación principal" / "Navegación inferior").

## Tasks / Subtasks

- [ ] Task 1 — Define TanStack Router file-based routes for the shell (AC: #1, #2, #3, #4, #5)
  - [ ] Update `src/routes/__root.tsx` to render the persistent app shell (LayoutBase with desktop NavigationRail OR mobile NavigationBar based on viewport) wrapping `<Outlet />`. Use a single `NotFoundComponent` registered at the root for unknown paths (AC #4).
  - [ ] Replace `src/routes/index.tsx` content with a TanStack Router `beforeLoad` that calls `throw redirect({ to: '/clientes' })` so `/` always lands on `/clientes` (AC #5). Do NOT render any UI in `index.tsx`.
  - [ ] Create `src/routes/clientes.tsx` (flat file route for `/clientes`) rendering `<ClientesPlaceholderView />`.
  - [ ] Create `src/routes/contactos.tsx` (flat file route for `/contactos`) rendering `<ContactosPlaceholderView />`.
  - [ ] Regenerate `src/routeTree.gen.ts` via `@tanstack/router-plugin/vite` (auto on next `pnpm dev`/`pnpm build`).

- [ ] Task 2 — Build the responsive app shell component (AC: #1, #2, #6, #7)
  - [ ] Create `src/shared/components/AppShell.tsx` — composes siesa-ui-kit `LayoutBase` for desktop and `NavigationBar` for mobile. It receives `children` and the current pathname (via `useRouterState({ select: s => s.location.pathname })`).
  - [ ] Define the nav items array once (single source of truth) with `id: 'clientes' | 'contactos'`, Spanish `label`, Heroicon (`UsersIcon` for clientes, `UserCircleIcon` for contactos), and `onClick` that calls `router.navigate({ to: '/clientes' | '/contactos' })`. Compute the `active` flag from the current pathname.
  - [ ] Render desktop shell: `<LayoutBase productName="Siesa Agents" navigationItems={navItems} locale="es" ariaLabel="Navegación principal">{children}</LayoutBase>`. Hide it below `lg:` via Tailwind `hidden lg:block` wrapper.
  - [ ] Render mobile shell: a flex column containing `{children}` and a fixed-bottom `<NavigationBar items={navItems} activeItemId={activeId} onItemClick={handleNavClick} ariaLabel="Navegación inferior" />`. Show it only below `lg:` via Tailwind `block lg:hidden` wrapper.
  - [ ] Ensure NO `window.location.href` reassignment anywhere; navigation is exclusively via TanStack Router APIs (AC #1).

- [ ] Task 3 — Create placeholder views for `/clientes` and `/contactos` (AC: #3)
  - [ ] Create `src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` with an `<h1>Clientes</h1>` and Spanish placeholder text (`"Próximamente: lista de clientes."`). Use `data-testid="clientes-view"` for E2E assertions.
  - [ ] Create `src/modules/crm/contactos/presentation/ContactosPlaceholderView.tsx` with `<h1>Contactos</h1>` and Spanish placeholder text. Use `data-testid="contactos-view"`.
  - [ ] These views are intentionally minimal — Story 2.1 (Clientes) and Story 3.1 (Contactos) replace them with real list views.

- [ ] Task 4 — Create the NotFound component for the catch-all route (AC: #4, #7)
  - [ ] Create `src/shared/components/NotFoundView.tsx` rendering: heading "Página no encontrada", Spanish description, and a TanStack Router `<Link to="/clientes">Ir a Clientes</Link>` CTA. Use `data-testid="not-found-view"`.
  - [ ] Register it in `__root.tsx` via `createRootRoute({ component, notFoundComponent: NotFoundView })`. The component MUST render inside the shell (so the user still sees nav).

- [ ] Task 5 — Unit / component tests with Vitest + RTL (AC: #1, #2, #4, #5, #6)
  - [ ] Test: `AppShell.test.tsx` — desktop viewport (≥ 1024px via `matchMedia` mock or fixed test viewport) renders the desktop shell with both "Clientes" and "Contactos" nav items, and clicking each calls the router navigate API (no `window.location.reload` / no full-page navigation). Maps to TC-E1-P1-01, TC-E1-P2-01.
  - [ ] Test: `AppShell.test.tsx` — mobile viewport (375px) renders the bottom `NavigationBar` and NOT the desktop NavigationRail. Maps to TC-E1-P2-02.
  - [ ] Test: `notFound.test.tsx` — mount the router with `initialLocation: '/ruta-inexistente'` and assert `NotFoundView` (`data-testid="not-found-view"`) is rendered inside the shell. Maps to TC-E1-P1-04.
  - [ ] Test: `indexRedirect.test.tsx` — mount the router with `initialLocation: '/'` and assert it resolves to `/clientes` and renders `data-testid="clientes-view"`. Maps to TC-E1-P2-03.

- [ ] Task 6 — Playwright E2E tests for deep linking (AC: #3)
  - [ ] Add `e2e/tests/foundation/deep-linking.spec.ts`:
    - Test 1: navigate directly to `http://localhost:5173/clientes`, expect `data-testid="clientes-view"` visible, no redirect (URL stays `/clientes`). Maps to TC-E1-P1-02.
    - Test 2: navigate directly to `http://localhost:5173/contactos`, expect `data-testid="contactos-view"` visible. Maps to TC-E1-P1-03.
    - Test 3: navigate directly to `http://localhost:5173/ruta-inexistente`, expect `data-testid="not-found-view"` and the shell nav still visible.
  - [ ] Use `--project=chromium` only (per Story 1.1 Dev Notes — sandbox Firefox unavailable).

- [ ] Task 7 — Verify build + tests pass (AC: all)
  - [ ] `pnpm exec tsc -b --force` → 0 errors (strict mode preserved).
  - [ ] `pnpm test` (Vitest) → all component tests green.
  - [ ] `pnpm exec playwright test --project=chromium e2e/tests/foundation` → all green.
  - [ ] `pnpm dev` boots cleanly on port 5173; manually verify in browser that `/`, `/clientes`, `/contactos`, `/ruta-inexistente` all work as specified.

## Dev Notes

### Architectural Layer — Clean Architecture mapping for this story

This story creates the **presentation shell** only. No `domain/`, `application/` or `infrastructure/` files are touched; the placeholder views live under `src/modules/crm/{clientes,contactos}/presentation/` purely as future seats for Stories 2.1 and 3.1.

```
frontend/src/
├── routes/
│   ├── __root.tsx          ← MODIFY: render AppShell + register NotFoundView
│   ├── index.tsx           ← MODIFY: beforeLoad redirect → /clientes
│   ├── clientes.tsx        ← NEW: flat route /clientes → ClientesPlaceholderView
│   └── contactos.tsx       ← NEW: flat route /contactos → ContactosPlaceholderView
├── shared/components/
│   ├── AppShell.tsx        ← NEW: responsive shell (LayoutBase | NavigationBar)
│   └── NotFoundView.tsx    ← NEW: 404 view in Spanish
└── modules/crm/
    ├── clientes/presentation/ClientesPlaceholderView.tsx   ← NEW (placeholder)
    └── contactos/presentation/ContactosPlaceholderView.tsx ← NEW (placeholder)
```

[Source: company-standards.md#Frontend Folder Structure] [Source: architecture.md#Complete Project Directory Structure]

### siesa-ui-kit components and exact APIs

siesa-ui-kit is already installed (per Story 1.1) and `'siesa-ui-kit/styles.css'` is already imported in `src/main.tsx`. Do NOT add another import. Use the following exports verbatim (verified against `frontend/node_modules/siesa-ui-kit/dist/index.d.ts`):

```ts
import { LayoutBase } from 'siesa-ui-kit'
import { NavigationBar } from 'siesa-ui-kit'
import type {
  LayoutBaseProps,
  NavigationBarProps,
  NavigationBarItem,
} from 'siesa-ui-kit'
import type { NavigationRailGroupMenuItem } from 'siesa-ui-kit'
```

**LayoutBase contract (relevant subset):**
- `productName?: string` → pass `"Siesa Agents"`.
- `navigationItems?: NavigationRailGroupMenuItem[]` → each item: `{ id, label, icon, active?, onClick? }`. Set `active: pathname.startsWith('/clientes' | '/contactos')`. `onClick` must call `router.navigate({ to })`.
- `locale?: string` → pass `"es"` (default already `'es'` but be explicit).
- `children` → main content area (your `<Outlet />`).

**NavigationBar contract (mobile, relevant subset):**
- `items: NavigationBarItem[]` → `{ id, icon, label, active?, onClick? }`.
- `activeItemId?: string` → the id derived from the current pathname.
- `onItemClick?: (id: string) => void` → wrapper that calls `router.navigate({ to: '/' + id })`.
- `ariaLabel?: string` → `"Navegación inferior"`.

**Source of truth for nav item ids (used for both desktop and mobile):**

```ts
const NAV_ITEMS = [
  { id: 'clientes',  label: 'Clientes',  to: '/clientes',  icon: <UsersIcon className="h-5 w-5" /> },
  { id: 'contactos', label: 'Contactos', to: '/contactos', icon: <UserCircleIcon className="h-5 w-5" /> },
] as const
```

Heroicons are pre-installed transitively in Story 1.1 dependencies? — Verify with `pnpm list @heroicons/react`. If absent, add it: `pnpm add @heroicons/react` (Heroicons is the company-mandated primary icon library per company-standards.md#Icons).

[Source: company-standards.md#UX Design System] [Source: ux-design-specification.md#Component Strategy] [Source: frontend/node_modules/siesa-ui-kit/dist/index.d.ts]

### TanStack Router patterns (file-based routing)

The project uses TanStack Router file-based routing with `@tanstack/router-plugin/vite` (auto-regenerates `routeTree.gen.ts`). All route files live in `src/routes/`. Flat routing (using `.`) is supported but for this story use plain flat files: `routes/clientes.tsx` for `/clientes`, `routes/contactos.tsx` for `/contactos`.

**Root route — register notFoundComponent and render shell:**

```tsx
// src/routes/__root.tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { AppShell } from '@/shared/components/AppShell'
import { NotFoundView } from '@/shared/components/NotFoundView'

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <NotFoundView />
    </AppShell>
  ),
})
```

**Index redirect — `/` → `/clientes`:**

```tsx
// src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

**Flat child route example:**

```tsx
// src/routes/clientes.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ClientesPlaceholderView } from '@/modules/crm/clientes/presentation/ClientesPlaceholderView'

export const Route = createFileRoute('/clientes')({
  component: ClientesPlaceholderView,
})
```

**Get active pathname inside AppShell:**

```tsx
import { useRouterState, useRouter } from '@tanstack/react-router'

const pathname = useRouterState({ select: (s) => s.location.pathname })
const router = useRouter()
// router.navigate({ to: '/clientes' })
```

[Source: company-standards.md#Frontend Stack — TanStack Router 1+] [Source: architecture.md#Frontend Architecture — Routing]

### Responsive breakpoint strategy

The breakpoint that swaps desktop NavigationRail for mobile NavigationBar is **`lg: 1024px`** (Tailwind default), per ux-design-specification.md#Breakpoint Strategy.

Use CSS-driven responsive switching (not JS media queries) wherever possible:

```tsx
<>
  <div className="hidden lg:block">
    <LayoutBase ...>{children}</LayoutBase>
  </div>
  <div className="flex flex-col min-h-dvh lg:hidden">
    <main className="flex-1 overflow-auto p-4">{children}</main>
    <NavigationBar ... className="border-t" />
  </div>
</>
```

Rationale: this gives correct SSR/SPA behavior on first paint, no flash of wrong nav, and avoids resize listeners. `min-h-dvh` handles mobile virtual-keyboard issues (per ux-design-specification.md#Implementation Guidelines).

[Source: ux-design-specification.md#Responsive Strategy] [Source: test-design-epic-1.md#Notes for Story Implementation Agents — item 7]

### Spanish-only UI text

All user-facing strings in this story:

| Context | Spanish text |
|---|---|
| Nav item label | "Clientes", "Contactos" |
| `LayoutBase productName` | "Siesa Agents" |
| `ariaLabel` desktop nav | "Navegación principal" |
| `ariaLabel` mobile nav | "Navegación inferior" |
| 404 heading | "Página no encontrada" |
| 404 description | "La ruta que intentas abrir no existe." |
| 404 CTA | "Ir a Clientes" |
| Clientes placeholder body | "Próximamente: lista de clientes." |
| Contactos placeholder body | "Próximamente: lista de contactos." |

[Source: company-standards.md#Frontend Key Rules — All user-facing text MUST be in Spanish]

### Testing standards & test cases covered

This story implements the AC-E1.1, AC-E1.2, AC-E1.3, AC-1.2.* slice of the Epic 1 test design. Specifically:

| Test ID | Title | Owned by this story |
|---|---|---|
| TC-E1-P1-01 | SPA Navigation — No Full Page Reload Between Routes | YES — Task 5 |
| TC-E1-P1-02 | Deep Linking — Direct URL Access to /clientes | YES — Task 6 |
| TC-E1-P1-03 | Deep Linking — Direct URL Access to /contactos | YES — Task 6 |
| TC-E1-P1-04 | 404 Route — Unknown URL Shows Not-Found View | YES — Task 5 |
| TC-E1-P2-01 | NavigationRail Visible on Desktop Viewport | YES — Task 5 |
| TC-E1-P2-02 | NavigationBar Visible on Mobile Viewport | YES — Task 5 |
| TC-E1-P2-03 | Index Route Redirects to /clientes | YES — Task 5 |

Testing libraries already installed in Story 1.1: Vitest + `@testing-library/react` + `@testing-library/jest-dom` + Playwright (pinned to `1.56.0` to match sandbox chromium-1194). Use `pnpm exec playwright test --project=chromium` (Firefox is not available in the sandbox).

For viewport-conditional Vitest tests, use `vi.stubGlobal('matchMedia', ...)` or set the viewport via `window.innerWidth = 1280` + dispatch `resize`. Tailwind's `lg:` classes will not auto-apply in `jsdom`; instead query for the desktop wrapper (`hidden lg:block`) or mobile wrapper (`block lg:hidden`) using stable `data-testid` markers on each wrapper (e.g. `data-testid="app-shell-desktop"` / `data-testid="app-shell-mobile"`). Always assert visibility through these testids; do not rely on real CSS layout in jsdom.

[Source: test-design-epic-1.md#Test Cases by Priority] [Source: 1-1-project-initialization-repository-structure.md#ATDD Infrastructure Fix Round]

### Project Structure Notes

**Alignment:**
- Routes go in `src/routes/` (TanStack Router file-based routing only) — matches company-standards.md#Frontend Folder Structure.
- Reusable shell components go in `src/shared/components/` — matches company-standards.md.
- Placeholder feature views go under `src/modules/crm/{clientes,contactos}/presentation/` — matches the module > domain > feature layout already established in architecture.md.
- Routing uses flat files (no folder per route) since each route renders a single view; this is consistent with architecture.md#Frontend Architecture which lists `clientes.tsx`, `contactos.tsx` as flat files.

**Variances / decisions:**
- The architecture document (`_app/clientes.tsx` under a pathless `_app` layout) describes the post-Auth shell pattern. Since MVP has no auth, this story uses the simpler `__root.tsx` directly as the shell — there is no behavioral difference and it avoids an empty pathless layout. The future migration to a `_app` pathless layout (when auth is added post-MVP) is trivial: move the AppShell out of `__root.tsx` into `_app.tsx`.
- Placeholder views live under `modules/crm/{clientes,contactos}/presentation/`. Stories 2.1 and 3.1 will replace them with `ClienteListView` / `ContactoListView` — same file path, same default export name swap.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- FR28, FR29, FR30 (SPA + responsive + deep linking): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- Architectural patterns for routing + responsive: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Project structure (frontend tree): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- UX shell design (LayoutBase + NavigationRail + NavigationBar): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Breakpoint + responsive rules: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy]
- Test design + non-negotiable constraints: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#Notes for Story Implementation Agents]
- Frontend stack + Spanish text + Heroicons rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story (Story 1.1) — initialized siesa-ui-kit, TanStack Router, Playwright pin: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]
- siesa-ui-kit type contracts (NavigationRail, NavigationBar, LayoutBase): [Source: frontend/node_modules/siesa-ui-kit/dist/index.d.ts]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

### Completion Notes List

### File List
