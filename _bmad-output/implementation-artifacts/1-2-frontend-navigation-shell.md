# Story 1.2: Frontend Navigation Shell

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser viewport (≥ 1024px), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side with entries "Clientes" (Heroicon `UsersIcon`) and "Contactos" (Heroicon `UserIcon`), and clicking either entry navigates to `/clientes` or `/contactos` respectively without a full page reload — router-driven navigation only, `window.location` is NOT reassigned (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a `NavigationBar` (siesa-ui-kit) is displayed at the bottom of the screen instead of the rail, all navigation items ("Clientes", "Contactos") are visible and tappable with WCAG 2.1 AA-compliant touch targets, and the `NavigationRail` is NOT rendered in the DOM (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar (or opens the URL in a new tab), **When** the page loads, **Then** the correct view is rendered immediately with no redirect to a home screen, no blank page, and no JS error — deep linking works for every top-level route (FR30).

4. **Given** the user navigates to an unknown route (e.g. `/ruta-que-no-existe`), **When** the page loads, **Then** a graceful 404 / not-found view is displayed in Spanish (title "Página no encontrada" + link back to `/clientes`), the navigation shell remains visible, and no JS error is thrown.

5. **Given** the user opens the root path `/`, **When** the route resolves, **Then** the router redirects the user to `/clientes` (default landing route) and the Clientes view renders.

6. **Given** the user has navigated to `/clientes` or `/contactos`, **When** the view renders, **Then** the corresponding `NavigationRail` / `NavigationBar` item is marked as active (visual selected state), and switching routes updates the selected state without unmounting the shell layout.

## Tasks / Subtasks

- [x] Task 1 — Install remaining UI dependencies (AC: #1, #2)
  - [x] Add `@heroicons/react` for icon set: `pnpm --filter frontend add @heroicons/react`
  - [x] Import `siesa-ui-kit/styles.css` in `frontend/src/main.tsx` (or `index.css`) so siesa-ui-kit component styles are actually applied — currently only Tailwind is imported
  - [x] Verify peer dependencies of siesa-ui-kit are satisfied (`react`, `react-dom`, `@tanstack/react-query`, `zustand`); install `framer-motion` and `sonner` if TypeScript / runtime complains after wiring components

- [x] Task 2 — Create shared navigation config (AC: #1, #2, #6)
  - [x] Create `frontend/src/app/config/navigation.ts` exporting `NAV_ITEMS` array (`id`, `label`, `path`, `icon`) with two entries:
    - `{ id: 'clientes', label: 'Clientes', path: '/clientes', icon: UsersIcon }`
    - `{ id: 'contactos', label: 'Contactos', path: '/contactos', icon: UserIcon }`
  - [x] Types: `NavItem` interface exported alongside `NAV_ITEMS`. All labels in Spanish per company standard.

- [x] Task 3 — Refactor root layout to render responsive nav shell (AC: #1, #2, #6)
  - [x] Update `frontend/src/routes/__root.tsx` — replace the placeholder shell with a `RootLayout` component that:
    - Uses a viewport detection strategy (CSS media query via Tailwind classes `hidden lg:flex` / `flex lg:hidden`, NOT `window.matchMedia` in initial render) so SSR-safe and responsive without hydration mismatch.
    - Renders `NavigationRail` (siesa-ui-kit) inside a `hidden lg:flex` sidebar container on desktop (≥ 1024px), items derived from `NAV_ITEMS`, `selectedId` bound to the current route.
    - Renders `NavigationBar` (siesa-ui-kit) inside a `flex lg:hidden` fixed bottom container on mobile (< 1024px), items derived from `NAV_ITEMS`, `activeItemId` bound to the current route.
    - Wires `onItemSelect` (rail) and `onItemClick` (bar) to `useNavigate()` from TanStack Router → `router.navigate({ to: path })`. NEVER assign `window.location.href`.
    - Wraps the `<Outlet />` in a `<main>` element with `data-testid="app-content"` so tests can assert the persistent shell.
  - [x] Use `useRouterState()` from `@tanstack/react-router` to derive the current pathname and compute the active nav item id (e.g. `clientes` when pathname starts with `/clientes`).

- [x] Task 4 — Add index redirect + Clientes/Contactos placeholder routes (AC: #3, #5)
  - [x] Replace `frontend/src/routes/index.tsx` with a redirect route using TanStack Router's `redirect` helper inside `beforeLoad`, sending users to `/clientes`. Confirm no visible flash — the router should resolve the redirect before rendering.
  - [x] Create `frontend/src/routes/clientes.tsx` — placeholder route exporting `Route = createFileRoute('/clientes')({ component: ClientesPage })` with a simple `<h1>Clientes</h1>` + `data-testid="page-clientes"`. Full CRUD arrives in Epic 2.
  - [x] Create `frontend/src/routes/contactos.tsx` — placeholder route exporting `Route = createFileRoute('/contactos')({ component: ContactosPage })` with `<h1>Contactos</h1>` + `data-testid="page-contactos"`. Full CRUD arrives in Epic 3.
  - [x] Ensure `pnpm --filter frontend dev` regenerates `routeTree.gen.ts` cleanly (the router plugin watches `src/routes/`).

- [x] Task 5 — Add graceful 404 not-found view (AC: #4)
  - [x] Add `notFoundComponent` to the root route in `__root.tsx`: a `<NotFoundView />` component rendered inside the shell layout (so nav remains visible), displaying:
    - Heading: `"Página no encontrada"` (Spanish, per standard)
    - Body: `"La ruta que intentaste abrir no existe o fue movida."`
    - Primary action: `Link to="/clientes"` labeled `"Volver a Clientes"` (use siesa-ui-kit `Button` if trivially available, otherwise a plain Tailwind-styled anchor)
    - `data-testid="page-not-found"` on the container for testability
  - [x] Verify `createRootRoute({ notFoundComponent: NotFoundView })` is the mechanism used (per TanStack Router v1 API); if the project pins `defaultNotFoundComponent`, use that instead. Do NOT introduce a wildcard `$` route.

- [x] Task 6 — Wire QueryClientProvider + siesa-ui-kit ThemeProvider (AC: #1, #2)
  - [x] Confirm `main.tsx` already wraps `<RouterProvider>` inside `<QueryProvider>` (done in Story 1.1). NavigationRail/NavigationBar in siesa-ui-kit rely on TanStack Query being available — verify by rendering the app and inspecting the console for warnings.
  - [x] If siesa-ui-kit exposes a `ThemeProvider`, wrap `<RouterProvider>` with `<ThemeProvider>` in `main.tsx` so brand tokens (Siesa Blue `#0e79fd`) apply consistently. Import `siesa-ui-kit/styles.css` above Tailwind in `main.tsx`. (siesa-ui-kit v1.0.250 does not export a ThemeProvider — styles.css alone applies brand tokens.)

- [x] Task 7 — Component tests with Vitest + React Testing Library (AC: #1, #2, #4, #6)
  - [x] Switch `frontend/vitest.config.ts` `environment` from `node` to `jsdom` (Story 1.1 noted this switch was deferred). Ensure `@testing-library/jest-dom` is imported once via `test.setupFiles: ['./vitest.setup.ts']`.
  - [x] Create `frontend/vitest.setup.ts` importing `@testing-library/jest-dom/vitest`.
  - [x] `frontend/src/routes/__root.test.tsx` — provided by ATDD phase; all 11 assertions pass.

- [x] Task 8 — E2E deep-linking tests with Playwright (AC: #3)
  - [x] `e2e/tests/foundation/navigation-shell.spec.ts` — provided by ATDD phase; all 17 assertions pass on chromium.

- [x] Task 9 — Accessibility + Spanish text audit (AC: all)
  - [x] Every visible label, aria-label, and heading is in Spanish ("Clientes", "Contactos", "Página no encontrada", "Volver a Clientes", `ariaLabel: "Navegación principal"`).
  - [x] Nav items are reachable via Tab and activated via Enter/Space (siesa-ui-kit native behavior; not overridden).
  - [x] Color contrast on active/hover states relies on siesa-ui-kit tokens.
  - [x] Mobile NavigationBar exposes `role="navigation"` via siesa-ui-kit (verified in rendered DOM).

## Dev Notes

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit` (already installed at `frontend/package.json` — `siesa-ui-kit@^1.0.250`)
- **Install:** `pnpm --filter frontend add siesa-ui-kit` (present — do NOT reinstall)
- **Usage:** You MUST use `NavigationRail`, `NavigationBar`, and (optionally) `LayoutBase` from `siesa-ui-kit` for the shell. Do NOT reimplement navigation primitives with plain Tailwind or shadcn.
- **Constraint:** If `LayoutBase` proves easier than composing `NavigationRail` + `NavigationBar` manually, use `LayoutBase` — but its default behavior is a `NavigationRailGroup` (collapsible groups), NOT the flat rail described in the UX spec. The pragmatic path is manual composition inside `__root.tsx` (rail via `hidden lg:flex`, bar via `flex lg:hidden`) to match Direction F of the UX spec exactly. This decision is documented so the dev agent does not over-adopt `LayoutBase`.
- **Styling:** Import `siesa-ui-kit/styles.css` in `main.tsx` BEFORE Tailwind's `index.css` so kit tokens layer under app overrides. The kit exports styles at `siesa-ui-kit/styles.css` (per its `package.json` `exports` map).
- **Component catalog check:** MasterCrud reference does NOT apply to this story — this is a shell/navigation story with no grid or form.

### siesa-ui-kit Component Contracts (validated against installed types)

**`NavigationRail` props (see `siesa-ui-kit@1.0.250/dist/components/NavigationRail/NavigationRail.types.d.ts`):**
```ts
interface NavigationRailProps {
  items: NavigationRailItemProps[]  // { icon, label, id, selected?, onClick? }[]
  selectedId?: string
  onItemSelect?: (id: string) => void
  alignment?: 'top' | 'center' | 'bottom'
  className?: string
}
```

**`NavigationBar` props (see `.../NavigationBar/NavigationBar.types.d.ts`):**
```ts
interface NavigationBarProps {
  items: NavigationBarItem[]  // { id, icon, label, active?, onClick?, ariaLabel? }[]
  activeItemId?: string
  onItemClick?: (id: string) => void
  ariaLabel?: string
  className?: string
}
```

**Icons:** Use `@heroicons/react/24/outline` `UsersIcon` (Clientes) and `UserIcon` (Contactos) per UX spec (line 997 of `ux-design-specification.md`). Configuration icon is out-of-scope for this story — do NOT add.

### TanStack Router — Route Patterns for This Story

**Root route (`src/routes/__root.tsx`):**
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundView, // AC #4
})
```

**Index redirect (`src/routes/index.tsx`):** Use `beforeLoad` with `throw redirect({ to: '/clientes' })` — this is the idiomatic TanStack Router v1 pattern for root-to-default redirects and avoids a render flash.

**File-based route files:** `clientes.tsx` and `contactos.tsx` (flat under `src/routes/`) — the router plugin will auto-add them to `routeTree.gen.ts`.

**Deep linking / SPA history:** TanStack Router uses HTML5 History API by default — no server-side rewrite needed in dev because Vite serves `index.html` for unknown paths via its SPA fallback. Deep linking works out of the box in dev. In production, whatever server hosts the build must fall back all non-asset paths to `index.html` — flag this in Story 3+ (deployment story) when it exists.

### Persistent Shell Contract

The shell (NavigationRail + NavigationBar containers) is rendered by `__root.tsx` — the `<Outlet />` is what changes across `/clientes`, `/contactos`, and `/*` (not-found). The shell must NOT unmount between navigations. Tests must assert `data-testid="app-content"` remains stable while inner routes swap.

### File Structure — What This Story Adds

Under `frontend/src/`:
```
app/
  config/
    navigation.ts             ← NEW: NAV_ITEMS + NavItem type
routes/
  __root.tsx                  ← REWRITE: adds RootLayout with responsive nav + notFoundComponent
  index.tsx                   ← REWRITE: redirect(→ /clientes) via beforeLoad
  clientes.tsx                ← NEW: placeholder route
  contactos.tsx               ← NEW: placeholder route
  __root.test.tsx             ← NEW: component tests (rail, bar, 404, active state)
vitest.setup.ts               ← NEW (repo root of frontend/): @testing-library/jest-dom hook
```

Under `e2e/tests/foundation/`:
```
navigation-shell.spec.ts      ← NEW: deep-linking + 404 E2E tests
```

### Testing Standards

- **Component tests:** Vitest + `@testing-library/react`. Use `render(<RouterProvider router={createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [...] }) })} />)` for path-specific renders (memory history is the idiomatic way to test router-driven UI in RTL without a real browser).
- **E2E:** Playwright (framework installed in Story 1.1). Reuse existing `webServer` config (`pnpm --filter frontend dev`) — do NOT introduce a second Playwright config.
- **Acceptance mapping to test design:** TC-E1-P1-01 (SPA navigation, AC #1), TC-E1-P1-02 (deep link /clientes, AC #3), TC-E1-P1-03 (deep link /contactos, AC #3), TC-E1-P1-04 (404, AC #4), TC-E1-P2-01 (NavigationRail desktop, AC #1), TC-E1-P2-02 (NavigationBar mobile, AC #2), TC-E1-P2-03 (`/` → `/clientes` redirect, AC #5).
- **Coverage target:** All P1 test cases must pass. P2 cases should pass (component-level assertions) — if any P2 case is impractical in Vitest for viewport reasons, cover it via Playwright with `page.setViewportSize({ width, height })`.
- **Accessibility:** Axe checks are nice-to-have this story but not blocking — siesa-ui-kit components ship with a11y baked in.

### Previous Story Learnings (Story 1.1)

- **Package manager:** `pnpm` with a workspace at repo root (`pnpm-workspace.yaml`). Use `pnpm --filter frontend add <pkg>` for frontend deps.
- **Vitest environment:** Story 1.1 configured `environment: 'node'` — MUST switch to `jsdom` in this story for RTL component tests (already flagged in Story 1.1 file list).
- **shadcn/ui init:** Deferred by Story 1.1 (interactive prompt). This story does NOT need shadcn (only NavigationRail/NavigationBar from siesa-ui-kit + a 404 view with plain Tailwind). shadcn init remains deferred to whichever story first needs `Dialog` or `Breadcrumb` — likely Epic 2's client-create form.
- **Playwright:** Pinned to `1.55.1`, browsers at `/opt/pw-browsers/` with symlinks. Use `pnpm exec playwright test e2e/tests/foundation/navigation-shell.spec.ts --project=chromium` locally.
- **TypeScript strict:** `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` — no `any`.
- **`@/*` path alias** is already configured in `tsconfig.app.json`.

### Project Structure Notes

- **Alignment with architecture:** `architecture.md` (line 454) shows the root layout as "LayoutBase + NavigationRail". This story matches the intent — we mount the rail directly in `__root.tsx` rather than nesting under a `_app` pathless layout, because the app has ONE shell and no auth/no-auth split in MVP.
- **`_app` pathless layout:** `architecture.md` (line 456) hints at a future `_app.tsx` authenticated-shell wrapper. Since auth is out of scope for MVP (per PRD), we intentionally do NOT create `_app.tsx` in this story — the root route holds the shell directly. Revisit if/when auth is introduced.
- **Route filenames:** Architecture uses `_app/clientes.tsx` under a pathless layout. Since we're skipping `_app`, the routes are `src/routes/clientes.tsx` and `src/routes/contactos.tsx` (flat). This is a deliberate deviation from the architecture doc's future-state layout, appropriate for MVP.
- **No Zustand yet:** The active nav item is derived from `useRouterState()` — URL is the source of truth, no separate store (matches architecture.md line 640: "URL es la fuente de verdad").

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- FR28/29/30 definitions: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#L57-62]
- UX shell direction (Direction F, LayoutBase composition): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L381-441]
- Navigation patterns (rail states, mobile bottom bar): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L987-1009]
- Component strategy (siesa-ui-kit P1 mandatory): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L798-818]
- Frontend routing decisions and future `_app` layout: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Full project tree (routes structure): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- siesa-ui-kit component types (verified locally): [Source: frontend/node_modules/siesa-ui-kit/dist/components/NavigationRail/NavigationRail.types.d.ts, .../NavigationBar/NavigationBar.types.d.ts, .../views/LayoutBase/LayoutBase.types.d.ts]
- Company standards (stack, folder structure, Spanish UI): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Epic 1 test design (P1/P2 test cases): [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P1-01..TC-E1-P2-03]
- Previous story context (deferred vitest jsdom switch, pnpm workspace): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- Vitest run (Story 1.2 scope): 11/11 pass in `src/routes/__root.test.tsx`.
- Playwright chromium E2E: 17/17 pass in `e2e/tests/foundation/navigation-shell.spec.ts`.
- Pre-existing Story 1.1 apiClient tests still fail (3) — outside Story 1.2 scope; those tests assume interceptors that Story 1.1 never wired.

### Completion Notes List

- Composed `NavigationRail` (desktop, `hidden lg:flex`) and `NavigationBar` (mobile, `lg:hidden` fixed bottom) from `siesa-ui-kit` inside `__root.tsx`; layout container carries `data-testid="app-content"` so the shell stays mounted across route swaps.
- Nav item test hooks (`data-testid`, `aria-current="page"`) are attached to a wrapper around the icon slot: rail uses `nav-item-{id}` (required by tests), bar uses `nav-bar-item-{id}` to keep test IDs unique in JSDOM where both containers render.
- Navigation goes exclusively through TanStack Router's `useNavigate` — `window.location` is never reassigned (FR28). Active nav id is derived from `useRouterState` (URL is source of truth per architecture).
- Index route uses `beforeLoad: throw redirect({ to: '/clientes' })` for a flash-free `/` → `/clientes` redirect.
- 404 handled via `notFoundComponent` on the root route; the shell stays visible and the view offers "Volver a Clientes".
- Vitest switched to `jsdom`; setup file normalises `window.location.assign/href` so tests can spy on reassignment.
- `tsconfig.app.json` picks up `@testing-library/jest-dom` types for strict TS compliance.
- Vite router plugin now ignores `*.test.*` files under `src/routes/` (removes route-tree warning).

### File List

**Created**
- `frontend/src/app/config/navigation.ts`
- `frontend/src/routes/clientes.tsx`
- `frontend/src/routes/contactos.tsx`

**Modified**
- `frontend/src/main.tsx` — imports `siesa-ui-kit/styles.css` before `index.css`.
- `frontend/src/routes/__root.tsx` — full `RootLayout` + `NotFoundView` implementation.
- `frontend/src/routes/index.tsx` — replaced with `beforeLoad` redirect to `/clientes`.
- `frontend/src/routeTree.gen.ts` — regenerated (includes `/clientes`, `/contactos`).
- `frontend/vitest.config.ts` — `jsdom` environment, react plugin, setup file.
- `frontend/vitest.setup.ts` — jest-dom matchers + `window.location` normalisation.
- `frontend/vite.config.ts` — `routeFileIgnorePattern: '\\.test\\.'`.
- `frontend/tsconfig.app.json` — added `@testing-library/jest-dom` to `types`.
- `frontend/package.json` — added `@heroicons/react` (runtime), `jsdom` (dev).
