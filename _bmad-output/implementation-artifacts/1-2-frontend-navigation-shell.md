# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport width ≥ `lg` = 1024px), **When** the user views the app, **Then** a `NavigationRail` from `siesa-ui-kit` is visible on the left side of the shell, containing two navigation entries: **"Clientes"** (route `/clientes`) and **"Contactos"** (route `/contactos`). Clicking either entry navigates to the corresponding route **without a full page reload** — TanStack Router client-side navigation is used (no `window.location.href` assignment, no document reload). (FR28)

2. **Given** the application is loaded on a mobile browser viewport (viewport width < `lg` = 1024px), **When** the user views the app, **Then** a mobile-responsive `NavigationBar` from `siesa-ui-kit` is rendered (bottom nav), and the `NavigationRail` is hidden (display:none or not mounted). All navigation items ("Clientes", "Contactos") are accessible, tappable (min hit target 44×44px), and route to the same `/clientes` / `/contactos` paths. (FR29)

3. **Given** the user types `http://localhost:5173/clientes` or `http://localhost:5173/contactos` directly into the browser URL bar (deep linking), **When** the page loads, **Then** the correct view is rendered (a route placeholder component for each route is enough for this story — the real list views land in Epics 2 and 3). There is **no redirect to a home/root screen** and **no blank screen**. (FR30)

4. **Given** the user navigates to an unknown route (e.g., `/ruta-que-no-existe`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully via TanStack Router's `defaultNotFoundComponent`. The shell layout (Navbar + NavigationRail / NavigationBar) **remains visible** so the user can still navigate out. The view shows the literal copy: heading `"404"` and body `"Página no encontrada"` (Spanish, per company UI-text rule).

5. **Given** the user opens the app at `/` (root), **When** the index route resolves, **Then** the router performs a redirect to `/clientes` using TanStack Router's `redirect` helper (NOT a `<Navigate>` HTML render — must be a route-level redirect so deep-linking to `/` lands on the Clientes view without flicker). (Reinforces FR28 + UX spec "Fase 1 — Shell + Navegación".)

6. **Given** any of the four routes (`/`, `/clientes`, `/contactos`, unknown) is active, **When** the layout renders, **Then** the active `NavigationRail` / `NavigationBar` item is visually highlighted using `siesa-ui-kit` active-state styling (no custom CSS overrides on Siesa tokens). On `/clientes` "Clientes" is active; on `/contactos` "Contactos" is active.

## Tasks / Subtasks

- [ ] Task 1 — Wire TanStack Router with not-found + redirect support (AC: #3, #4, #5)
  - [ ] Refactor `frontend/src/main.tsx` to extract router creation into `frontend/src/router.tsx` (`createRouter()` factory), aligned with `frontend-standards.md §15.2`.
  - [ ] In `createRouter()`, configure: `routeTree`, `defaultPreload: 'intent'`, `scrollRestoration: true`, `defaultNotFoundComponent: NotFoundPage`, `defaultErrorComponent: ErrorPage`.
  - [ ] Define `NotFoundPage` component inline in `router.tsx` rendering heading `"404"` and copy `"Página no encontrada"` inside the shell `<Outlet />` context (so layout persists).
  - [ ] Keep the `declare module '@tanstack/react-router'` type registration after `createRouter()`.
  - [ ] Update `main.tsx` to import `createRouter` from `./router` and pass the instance to `<RouterProvider>` inside `<QueryProvider>`.

- [ ] Task 2 — Build the app shell layout in `__root.tsx` using siesa-ui-kit (AC: #1, #2, #6)
  - [ ] Replace the placeholder `RootLayout` in `frontend/src/routes/__root.tsx` with a `LayoutBase` (siesa-ui-kit) composition: `Navbar` (top, `productName="Siesa Agents"`) + responsive nav (`NavigationRail` on `lg:` and up, `NavigationBar` below `lg:`) + content `<Outlet />`.
  - [ ] Define `navigationItems` array with two entries: `{ id: 'clientes', label: 'Clientes', icon: <UsersIcon />, to: '/clientes' }` and `{ id: 'contactos', label: 'Contactos', icon: <UserCircleIcon />, to: '/contactos' }`. Use Heroicons 24-outline (`@heroicons/react/24/outline`) — install via `pnpm add @heroicons/react` if not present.
  - [ ] Wire each nav item's click/tap to TanStack Router's `useNavigate()` (or `<Link to>`); MUST NOT use `window.location` or `<a href>` that triggers a full reload.
  - [ ] Highlight the active item by comparing `useRouterState().location.pathname` against each item's `to` prefix (`'/clientes'` matches `/clientes` and `/clientes/:id`; same for `'/contactos'`). Pass the active state through the `siesa-ui-kit` API (e.g., `active` prop) — DO NOT hardcode colors; rely on Siesa tokens.
  - [ ] Use Tailwind `hidden lg:block` / `lg:hidden` (or siesa-ui-kit responsive props if exposed) to swap `NavigationRail` ↔ `NavigationBar` at the `lg:` (1024px) breakpoint, per `ux-design-specification.md §Responsive Strategy`.

- [ ] Task 3 — Create placeholder routes for `/clientes` and `/contactos` (AC: #1, #3)
  - [ ] Create `frontend/src/routes/clientes.tsx` with a `createFileRoute('/clientes')` exporting a placeholder component: `<main><h1>Clientes</h1></main>`. The full list view ships in Epic 2 Story 2.1.
  - [ ] Create `frontend/src/routes/contactos.tsx` with a `createFileRoute('/contactos')` exporting a placeholder component: `<main><h1>Contactos</h1></main>`. The full list view ships in Epic 3 Story 3.1.
  - [ ] After saving, let `@tanstack/router-plugin/vite` regenerate `routeTree.gen.ts` (do not hand-edit).

- [ ] Task 4 — Make `/` redirect to `/clientes` (AC: #5)
  - [ ] Replace the body of `frontend/src/routes/index.tsx`. Use TanStack Router's `beforeLoad: () => { throw redirect({ to: '/clientes' }) }` (import `redirect` from `@tanstack/react-router`). The `component` may be left as a no-op fallback.
  - [ ] Verify that opening `http://localhost:5173/` lands on `/clientes` without flicker.

- [ ] Task 5 — Tests (AC: all)
  - [ ] **Component test — desktop rail** (TC-E1-P2-01): in `frontend/src/routes/__root.test.tsx`, render the shell at viewport width 1280 (set `window.innerWidth` + dispatch `resize`, or stub `matchMedia`). Assert the `NavigationRail` is in the DOM and contains "Clientes" + "Contactos" entries; assert the `NavigationBar` is NOT visible.
  - [ ] **Component test — mobile navbar** (TC-E1-P2-02): same file, render at width 375. Assert `NavigationBar` is in the DOM with both entries tappable; assert `NavigationRail` is hidden.
  - [ ] **Component test — SPA navigation no reload** (TC-E1-P1-01): in `frontend/src/routes/navigation.test.tsx`, render `<RouterProvider>` against a memory history starting at `/`. Spy on `window.location.reload`. Click "Contactos" → assert URL is `/contactos`, the Contactos placeholder renders, `reload` was NOT called. Click "Clientes" → assert URL is `/clientes`, the Clientes placeholder renders.
  - [ ] **Component test — 404 route** (TC-E1-P1-04): in `frontend/src/routes/notfound.test.tsx`, render the router with initial path `/ruta-que-no-existe`. Assert the NotFound component renders ("404" + "Página no encontrada") AND the shell (NavigationRail/NavigationBar) is still rendered.
  - [ ] **Component test — index redirect** (TC-E1-P2-03): in `frontend/src/routes/index.test.tsx`, render the router at `/`. Assert it redirects to `/clientes` (final `location.pathname === '/clientes'`) and the Clientes placeholder is shown.
  - [ ] **E2E test — deep link `/clientes`** (TC-E1-P1-02): in `e2e/tests/navigation/deep-link-clientes.spec.ts`, run `pnpm dev` (or use existing Playwright dev-server config), `page.goto('http://localhost:5173/clientes')`, assert `page.getByRole('heading', { name: 'Clientes' })` is visible, no redirect to `/`.
  - [ ] **E2E test — deep link `/contactos`** (TC-E1-P1-03): same pattern at `/contactos`, assert the Contactos heading.
  - [ ] Run `pnpm test` from `frontend/` and `pnpm exec playwright test` from repo root — all P0/P1/P2 tests for Story 1.2 must pass.

- [ ] Task 6 — Compile + lint gate
  - [ ] `pnpm exec tsc -b` exits 0 (TypeScript strict mode, no `any`).
  - [ ] `pnpm run lint` exits 0 (oxlint).
  - [ ] `pnpm run build` produces a `dist/` bundle gzipped under 500 KB (`< 500KB gzipped` budget per company standards).

## Dev Notes

### Architectural placement — Clean Architecture + DDD

This story belongs strictly to the **Presentation layer** of the frontend. No domain entities, no use cases, no repositories. All work lives in:

- `frontend/src/routes/` — TanStack file-based routes (`__root.tsx`, `index.tsx`, `clientes.tsx`, `contactos.tsx`)
- `frontend/src/router.tsx` — Router factory + global NotFound/Error components
- Test colocation: each route file has a colocated `*.test.tsx` per company standards

There is no business logic to extract into a use case at this point; routing is a Presentation concern. Future stories will add `modules/crm/clientes/` and `modules/crm/contactos/` Clean Architecture trees behind these routes.

### Required libraries (already installed in Story 1.1)

- `@tanstack/react-router` ≥ 1.170 — file-based routing, type-safe, with `redirect`, `defaultNotFoundComponent`
- `@tanstack/router-plugin/vite` — autogen of `routeTree.gen.ts`
- `siesa-ui-kit` ≥ 1.0.245 — `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar` (P0 mandatory per company standards — check Siesa UI Kit catalog before any custom component)
- `tailwindcss` v4 — responsive breakpoint utilities (`lg:` = 1024 px)
- Vitest 4 + `@testing-library/react` + `jsdom` — colocated component tests
- Playwright (config at `playwright.config.ts`, suites under `e2e/`) — deep-link E2E

**New install required for this story:**

```bash
pnpm add @heroicons/react
```

(Heroicons is the primary icon set per company UI standards — `UsersIcon`, `UserCircleIcon` 24-outline.)

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory)
- **Install**: `siesa-ui-kit` is already a runtime dependency (Story 1.1 — `pnpm add siesa-ui-kit`).
- **Usage**: All UI elements for this shell MUST come from `siesa-ui-kit`: `LayoutBase`, `Navbar`, `NavigationRail`, `NavigationBar`.
- **Constraint**: Do NOT build a custom rail/navbar. Do NOT override Siesa tokens (no hardcoded hex colors). If a styling gap blocks an AC, document it in Completion Notes — do not patch with inline styles.
- **All user-facing text in Spanish**: `"Clientes"`, `"Contactos"`, `"404"`, `"Página no encontrada"`. Code identifiers (variables, route ids, file names) remain in English.
- **WCAG 2.1 AA**: nav items must have `aria-label` and visible focus rings (Siesa tokens already comply). Tap targets ≥ 44×44 px on mobile.

### TanStack Router patterns to enforce

1. **File-based routing only.** Every route lives under `src/routes/`; never call `createRouter` with a hand-built tree. The plugin regenerates `routeTree.gen.ts` on save — commit it.
2. **`__root.tsx` is the shell.** It exports `createRootRoute({ component: RootLayout })`; `RootLayout` returns `<LayoutBase>… <Outlet /> …</LayoutBase>`. Never wrap `<Outlet />` in another `<Router>`.
3. **Redirect via `beforeLoad` + `redirect()` thrown.** Pattern (frontend-standards §15.2 + TanStack v1 docs):
   ```typescript
   import { createFileRoute, redirect } from '@tanstack/react-router'
   export const Route = createFileRoute('/')({
     beforeLoad: () => {
       throw redirect({ to: '/clientes' })
     },
   })
   ```
4. **NotFound is router-level.** Configure `defaultNotFoundComponent` on the router instance (NOT inside `__root.tsx`); this guarantees the shell layout persists because `<Outlet />` still resolves to the NotFound component.
5. **Active link state.** Prefer TanStack `<Link>`'s `activeProps` / `useLocation()` over manually parsing `window.location`. Do not use the browser History API directly.

### Responsive breakpoint policy

- Critical breakpoint: `lg:` = 1024 px (Tailwind default in v4, matches architecture §Responsive layout).
- Below `lg:` → `NavigationBar` (bottom nav, ~56 px tall).
- `lg:` and up → `NavigationRail` (left, 72 px collapsed).
- Use Tailwind responsive classes (`hidden lg:flex`, `lg:hidden`) — **not** JS-driven `matchMedia` — to swap the components. JS `matchMedia` is only acceptable for accessibility-driven preferences (`prefers-reduced-motion`), not layout.

### NotFound component contract

```tsx
function NotFoundPage(): React.ReactElement {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">Página no encontrada</p>
    </main>
  )
}
```

This component must render inside the shell (`<Outlet />` slot of `LayoutBase`) so the rail/navbar stays visible — per AC #4.

### Testing standards

- **Framework**: Vitest 4 + React Testing Library + `jsdom` (already configured in `vitest.config.ts`).
- **Colocation**: tests sit next to the source file (`__root.test.tsx`, `index.test.tsx`, etc.).
- **Router tests**: build an in-memory `createRouter({ history: createMemoryHistory({ initialEntries: ['/clientes'] }) })` to drive deep-link scenarios; do not spin a dev server.
- **Viewport stubs**: use `Object.defineProperty(window, 'innerWidth', { value: 1280 })` + `window.dispatchEvent(new Event('resize'))` OR stub `window.matchMedia` returning `{ matches: true, addEventListener, removeEventListener }` for the targeted breakpoint query. Vitest 4 + jsdom does NOT implement `matchMedia` by default — add a global setup in `vitest.config.ts` `setupFiles` if not already present.
- **E2E**: Playwright suites under `e2e/tests/navigation/`; reuse `playwright.config.ts` at repo root. Web server already configured to `pnpm --filter frontend dev`.

### Project Structure Notes

Files in scope (alignment with architecture.md §Frontend folder structure):

```
frontend/src/
├── main.tsx                          ← modify: import createRouter from ./router
├── router.tsx                        ← NEW: createRouter() + NotFoundPage + ErrorPage
├── routeTree.gen.ts                  ← auto-regenerated by plugin (do not hand-edit)
├── routes/
│   ├── __root.tsx                    ← modify: LayoutBase + NavigationRail/Bar
│   ├── __root.test.tsx               ← NEW: rail/navbar viewport tests
│   ├── index.tsx                     ← modify: redirect → /clientes
│   ├── index.test.tsx                ← NEW: redirect test
│   ├── clientes.tsx                  ← NEW: placeholder route
│   ├── contactos.tsx                 ← NEW: placeholder route
│   ├── navigation.test.tsx           ← NEW: SPA-navigation no-reload test
│   └── notfound.test.tsx             ← NEW: 404 + shell-visible test
└── shared/lib/                       ← untouched (queryClient, apiClient)

e2e/tests/navigation/
├── deep-link-clientes.spec.ts        ← NEW
└── deep-link-contactos.spec.ts       ← NEW
```

**Conflict check vs. existing Story 1.1 files:** `__root.tsx`, `index.tsx`, `main.tsx` exist as placeholders from Story 1.1; they are explicitly modified here. No deletions of Story 1.1 artifacts.

**Detected variance vs. architecture.md tree:** Architecture references `_app.tsx` + `_app/clientes.tsx` + `_app/contactos.tsx` (pathless layout group). For this story we use the simpler flat layout — `__root.tsx` IS the shell, no `_app` layout group is required yet. Rationale: the only authenticated boundary in MVP is the shell itself; introducing `_app` adds a route segment with no benefit. Future stories that add per-section guards (e.g., role-based) can lift the shell into `_app.tsx` then. Document the rationale in Completion Notes if the implementer decides otherwise.

### Test-design alignment

Test cases mapped to `test-design-epic-1.md`:

| TC ID | Level | AC |
|-------|-------|----|
| TC-E1-P1-01 SPA nav no reload | Component | AC #1 |
| TC-E1-P1-02 Deep link /clientes | E2E | AC #3 |
| TC-E1-P1-03 Deep link /contactos | E2E | AC #3 |
| TC-E1-P1-04 404 not-found | Component | AC #4 |
| TC-E1-P2-01 NavigationRail desktop | Component | AC #1, #6 |
| TC-E1-P2-02 NavigationBar mobile | Component | AC #2, #6 |
| TC-E1-P2-03 Index → /clientes | Component | AC #5 |

All P0/P1/P2 tests scoped to Story 1.2 are exhaustively covered by Task 5.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Functional requirements FR28/FR29/FR30: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Navigation & Access]
- TanStack Router patterns (NotFound, redirect, file-based): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/frontend-standards.md#15.2 router.tsx]
- Frontend folder structure + active-route rules: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend folder structure]
- UX spec — Navigation patterns (rail, navbar, active states): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- UX spec — Responsive breakpoints (lg: 1024 px): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility]
- siesa-ui-kit P0 mandate + component priorities: [Source: _bmad-output/planning-artifacts/architecture.md#Component Strategy + .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Test design test cases: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P1-01..04, TC-E1-P2-01..03]
- Story 1.1 baseline (existing routes + main.tsx): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

### Completion Notes List

### File List
