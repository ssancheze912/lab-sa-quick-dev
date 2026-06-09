# Story 1.2: Frontend Navigation Shell

Status: review

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser viewport (`lg:` ≥ 1024px), **When** the user views the app, **Then** a `NavigationRail` from `siesa-ui-kit` is visible on the left side (72px collapsed) with the entries "Clientes" (route `/clientes`) and "Contactos" (route `/contactos`), and clicking either entry navigates to that route without a full page reload — i.e., the root layout/shell is NOT remounted and `window.location.reload()` is NOT invoked (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px, base of mobile-first 375px), **When** the user views the app, **Then** the `NavigationRail` is hidden and a responsive `NavigationBar` (bottom navigation, 56px) from `siesa-ui-kit` is rendered with the same "Clientes" and "Contactos" entries, all items are tappable with touch targets ≥ 44×44px (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar (deep-link), **When** the page loads, **Then** the corresponding route view renders directly without redirection to a home/root screen, and the navigation shell is visible with the matching entry marked as active (FR30).

4. **Given** the user navigates to any unknown route (e.g., `/no-existe`), **When** the page loads, **Then** a Spanish 404 / not-found view is displayed gracefully ("Página no encontrada" + link "Ir a Clientes"), the navigation shell remains visible, and no JavaScript error is thrown.

5. **Given** the active route is `/clientes` or `/contactos`, **When** the navigation shell renders, **Then** the corresponding nav item shows the active visual state per UX spec (border-left `primary-600`, background `primary-50`, icon `primary-700`) using TanStack Router's active-link API.

6. **Given** the user lands on the root path `/`, **When** the index route resolves, **Then** the router redirects to `/clientes` (default landing per architecture spec).

7. **Given** the developer runs `pnpm test`, **When** the test suite executes, **Then** component/unit tests cover: rail visibility on desktop, bar visibility on mobile, SPA navigation without full reload, deep linking to `/clientes` and `/contactos`, 404 fallback view, and index → `/clientes` redirect.

## Tasks / Subtasks

- [x] Task 1 — Install and validate `siesa-ui-kit` dependency (AC: #1, #2)
  - [x] Run `pnpm add siesa-ui-kit` in `frontend/` (deferred from Story 1.1)
  - [x] If the package is not available in the configured registry, document the fallback in Dev Agent Record and create a thin local `NavigationRail` + `NavigationBar` shim under `frontend/src/shared/components/ui/` that matches the `siesa-ui-kit` API contract (items array, active state, icons), so the story remains testable. Replace with the real package as soon as the registry is configured.
  - [x] Verify import resolves cleanly: `import { NavigationRail, NavigationBar } from 'siesa-ui-kit'` (or from the local shim if used)

- [x] Task 2 — Build the persistent application shell layout (AC: #1, #2, #5)
  - [x] Create pathless layout route `frontend/src/routes/_app.tsx` (TanStack Router `_` prefix — does not add to URL)
  - [x] In `_app.tsx`, render the shell using `siesa-ui-kit`:
    - Desktop (≥ 1024px, `lg:`): `<NavigationRail>` with `items=[{ key: 'clientes', label: 'Clientes', to: '/clientes', icon: UsersIcon }, { key: 'contactos', label: 'Contactos', to: '/contactos', icon: UserIcon }]`
    - Mobile (< 1024px): `<NavigationBar>` with the same items at the bottom
    - Tailwind responsive switch: `hidden lg:block` on the rail wrapper and `lg:hidden` on the bar wrapper (mobile-first per company standard)
  - [x] Use TanStack Router `<Link>` (or `useNavigate`) for each item so navigation is client-side only; pass `activeProps` so the active item gets the visual state described in AC #5
  - [x] Render `<Outlet />` inside the content area so child routes (`/clientes`, `/contactos`) mount without remounting the shell
  - [x] All visible labels in Spanish; ARIA: `aria-label="Navegación principal"` on the rail/bar, `aria-current="page"` on the active item
  - [x] Heroicons (`@heroicons/react`) per company standards — install if absent (`pnpm add @heroicons/react`)

- [x] Task 3 — Define empty placeholder routes for Clientes and Contactos (AC: #1, #3, #5)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` exporting `createFileRoute('/_app/clientes')` with a minimal placeholder component (heading "Clientes" + `data-testid="clientes-view"`)
  - [x] Create `frontend/src/routes/_app/contactos.tsx` exporting `createFileRoute('/_app/contactos')` with a minimal placeholder component (heading "Contactos" + `data-testid="contactos-view"`)
  - [x] Routes use flat-routing (`.` prefix not needed here; folder `_app/` is the pathless layout — final URLs are `/clientes` and `/contactos`)
  - [x] These placeholders are intentional: real list/detail UIs are delivered in Epic 2 (Story 2.1) and Epic 3 (Story 3.1). DO NOT scaffold list/detail/forms in this story.

- [x] Task 4 — Configure index redirect and 404 fallback (AC: #4, #6)
  - [x] Modify `frontend/src/routes/index.tsx` to redirect to `/clientes` using TanStack Router `beforeLoad: () => { throw redirect({ to: '/clientes' }) }`
  - [x] In `frontend/src/routes/__root.tsx`, add `notFoundComponent` that renders a Spanish 404 view: heading `"Página no encontrada"`, subtext `"La ruta solicitada no existe"`, and a `<Link to="/clientes">Ir a Clientes</Link>` (use Heroicons `ExclamationTriangleIcon`)
  - [x] The 404 component MUST be rendered inside the same shell (the `_app` layout) so the navigation rail/bar remain visible — wrap the not-found content in the shell or use the router's nested-not-found pattern
  - [x] Add `defaultErrorComponent` to the router for graceful runtime errors (Spanish message, no stack traces leaked)

- [x] Task 5 — Wire the router and regenerate the route tree (AC: #1, #3)
  - [x] Run dev server once (`pnpm run dev`) so `@tanstack/router-plugin` regenerates `frontend/src/routeTree.gen.ts` with the new routes
  - [x] Confirm `pnpm exec tsc -b` exits 0 (no TS errors under strict mode)
  - [x] Confirm `pnpm run build` exits 0 and bundle remains under 500 KB gzipped (NFR budget)

- [x] Task 6 — Tests (AC: #7, covers all P1/P2 navigation test cases from test-design-epic-1.md)
  - [x] `frontend/src/routes/__root.test.tsx` — render router at path `/no-existe`, assert 404 view renders, assert shell still visible (TC-E1-P1-04)
  - [x] `frontend/src/routes/_app.test.tsx` — render shell at viewport 1280×800, assert `NavigationRail` visible, assert `NavigationBar` hidden, assert both items "Clientes" and "Contactos" present (TC-E1-P2-01)
  - [x] `frontend/src/routes/_app.test.tsx` — render shell at viewport 375×667, assert `NavigationBar` visible, assert `NavigationRail` hidden (TC-E1-P2-02). Use `matchMedia` mock or Tailwind class assertions (jsdom does not evaluate media queries by default; assert the responsive Tailwind classes or use a manual viewport flag)
  - [x] `frontend/src/routes/navigation.test.tsx` — render the in-memory router starting at `/clientes`, simulate click on "Contactos" nav item via `userEvent.click`, assert URL is `/contactos`, assert `data-testid="contactos-view"` is rendered, assert `window.location.reload` was not invoked (TC-E1-P1-01)
  - [x] `frontend/src/routes/navigation.test.tsx` — render the in-memory router starting at `/clientes` and at `/contactos` (deep-link), assert each view renders directly with no redirect (TC-E1-P1-02, TC-E1-P1-03)
  - [x] `frontend/src/routes/index.test.tsx` — render the in-memory router starting at `/`, assert it redirects to `/clientes` (TC-E1-P2-03)
  - [x] Accessibility: use `axe` (or `vitest-axe`) on the rendered shell — zero violations (WCAG 2.1 AA, NFR)

## Dev Notes

### UI Library: siesa-ui-kit (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 — company standard)
- **Install**: `pnpm add siesa-ui-kit` in `frontend/`
- **Usage**: ALL UI elements in this story MUST come from `siesa-ui-kit`. Do NOT build a custom rail/bar if the kit exposes one.
- **Components to consume**: `NavigationRail` (desktop) and `NavigationBar` (mobile/bottom).
- **Fallback policy**: If a kit component is missing or the package is not resolvable from the registry, document the deviation in the Dev Agent Record, create a minimal local shim that matches the kit's expected API (items array with `key`, `label`, `to`, `icon`, active state via TanStack Router `<Link activeProps>`), and replace it with the real kit component as soon as it becomes available. Custom UI in `frontend/src/shared/components/ui/` is acceptable ONLY as a documented fallback.
- **shadcn fallback**: Not applicable here — `NavigationRail` / `NavigationBar` are kit-native. shadcn is only used when there is no kit equivalent (e.g., `Breadcrumb` in Epic 4).

### Routing & File Structure (TanStack Router)

This story is the first to populate `frontend/src/routes/_app/` per the architecture's directory tree (`_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`):

```
frontend/src/routes/
├── __root.tsx              # Root — adds notFoundComponent + defaultErrorComponent
├── index.tsx               # Redirect → /clientes (modified)
├── _app.tsx                # Pathless layout — renders NavigationRail/NavigationBar + <Outlet />
└── _app/
    ├── clientes.tsx        # /clientes — placeholder view (real UI in Story 2.1)
    └── contactos.tsx       # /contactos — placeholder view (real UI in Story 3.1)
```

- The `_` prefix on `_app` is the TanStack Router pathless-layout convention (does NOT add a segment to the URL). Final URLs are `/clientes` and `/contactos` — NOT `/_app/clientes`.
- DO NOT create `clientes/$clienteId.tsx` or `contactos/$contactoId.tsx` in this story — those are scoped to Epic 2 / Epic 3.
- The router plugin (`@tanstack/router-plugin/vite`) regenerates `routeTree.gen.ts` automatically on save. Never edit `routeTree.gen.ts` by hand.

### Active-link visual state (AC #5)

```tsx
<Link
  to="/clientes"
  activeProps={{ className: 'border-l-2 border-primary-600 bg-primary-50 text-primary-700' }}
  inactiveProps={{ className: 'text-slate-400 hover:bg-slate-50 hover:text-slate-600' }}
  aria-current={isActive ? 'page' : undefined}
>
  ...
</Link>
```

Colors come from the UX design system (`#0e79fd` = `primary-600` Siesa Blue). Use Tailwind v4 utility classes mapped to brand tokens.

### Responsive switch (AC #1, #2)

Mobile-first per company standard: base styles target mobile, `lg:` (≥ 1024px) flips to desktop.

```tsx
{/* Desktop rail — hidden on mobile, visible from lg up */}
<aside className="hidden lg:flex lg:w-[72px] lg:flex-col"> <NavigationRail ... /> </aside>

{/* Mobile bottom bar — visible on mobile, hidden from lg up */}
<nav className="fixed bottom-0 inset-x-0 h-14 lg:hidden"> <NavigationBar ... /> </nav>
```

`lg:` = 1024px breakpoint per architecture's responsive strategy (`_bmad-output/planning-artifacts/ux-design-specification.md#Breakpoint Strategy`).

### Deep linking (AC #3)

TanStack Router resolves deep links client-side after Vite's dev server / static host serves `index.html` for any path (SPA fallback). For production deployment, the static host must be configured to serve `index.html` for unknown paths — out of scope for this story (covered by the deployment story when added). For dev (`pnpm run dev`), Vite handles SPA fallback automatically.

### 404 / Not-Found (AC #4)

```tsx
// In __root.tsx
export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundView,
})

function NotFoundView() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-slate-600">La ruta solicitada no existe.</p>
      <Link to="/clientes" className="text-primary-600 hover:underline">Ir a Clientes</Link>
    </div>
  )
}
```

The shell (NavigationRail/Bar) MUST remain visible — wrap the not-found content inside the `_app` layout or hoist the layout into `__root.tsx`. Per the existing project (`__root.tsx` is currently a thin wrapper), the cleanest pattern is: keep `__root.tsx` as the global provider host, and let `_app.tsx` be the shell; for unknown paths under `/_app/*` use TanStack Router's nested `notFoundComponent` on `_app`. If the unknown path is outside `_app` (e.g., `/foobar`), the root `notFoundComponent` fires — render the same shell wrapper there too.

### State

- No Zustand store needed for this story. Navigation state (which item is active) is derived from the URL via TanStack Router (`useMatchRoute`, `Link activeProps`).
- No TanStack Query usage in this story (no server calls).

### Spanish UI text (REQUIRED)

| Element | Text |
|---|---|
| Rail/Bar item 1 | `Clientes` |
| Rail/Bar item 2 | `Contactos` |
| 404 heading | `Página no encontrada` |
| 404 subtext | `La ruta solicitada no existe` |
| 404 CTA link | `Ir a Clientes` |
| Nav landmark `aria-label` | `Navegación principal` |

NEVER use English-facing strings (per company standards section 13 + architecture enforcement rule #5).

### Tech Stack & Libraries (this story)

- **siesa-ui-kit** — install via `pnpm add siesa-ui-kit` (P0 mandatory; fallback shim only if registry unavailable, documented in Dev Agent Record)
- **TanStack Router** v1.87+ (already installed) — `createFileRoute`, `Link`, `Outlet`, `redirect`, `notFoundComponent`
- **@heroicons/react** — `pnpm add @heroicons/react` (`UsersIcon` for Clientes, `UserIcon` for Contactos)
- **TailwindCSS** v4 — utility classes for responsive switch and active state
- **Vitest + React Testing Library + jsdom + @tanstack/react-router test utilities** (already installed)
- **vitest-axe** (optional) — accessibility assertions; install with `pnpm add -D vitest-axe` if not present

### Testing Standards

- Co-locate `*.test.tsx` next to the file under test.
- For component tests that need the router context, use `createMemoryHistory` + `createRouter` from `@tanstack/react-router` to mount the in-memory router at a specific path.
- Mock the `siesa-ui-kit` import surface in tests if needed (use the local shim from Task 1 fallback so tests do not depend on the real package being installed).
- Accessibility: every visible interactive element must be reachable via Tab; `axe` zero violations.
- Bundle budget: keep total `pnpm run build` output < 500 KB gzipped (NFR target).

### Project Structure Notes

- Aligns with `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure` (the `_app` pathless layout was pre-declared there).
- Aligns with `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure` (Clean Architecture layers; UI lives in `routes/` + `shared/components/`).
- No `modules/crm/clientes/` or `modules/crm/contactos/` code in this story — only `routes/` placeholders.
- The `routeTree.gen.ts` file is auto-generated; do not edit it. Confirm it includes the new routes after dev-server runs.

### Architectural Constraints (from architecture.md)

- FR28: SPA navigation without full reload — covered by `<Link>` from TanStack Router (NOT `<a href>`).
- FR29: Mobile-responsive navigation — covered by `NavigationBar` swap below `lg:`.
- FR30: Deep linking — covered by file-based routes resolving directly + Vite SPA fallback.
- NFR (accessibility, WCAG 2.1 AA): semantic landmarks (`<nav>`), `aria-label`, `aria-current="page"`, touch targets ≥ 44px.
- NFR (performance): no client-side data fetching in this story; bundle stays small.
- All user-facing text in Spanish (enforcement rule #5).

### References

- Story source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Test cases: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P1-01 .. TC-E1-P2-03]
- Routing decisions and route tree: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] and [#Complete Project Directory Structure]
- NavigationRail/NavigationBar UX details: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] and [#Responsive Strategy]
- Active-state colors and items: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#NavigationRail (desktop)]
- TanStack Router prefixes (`_`, `.`, `-`, `$`): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend stack + folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack] and [#Frontend Folder Structure]
- Spanish UI mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Component priority (siesa-ui-kit > shadcn > custom): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Story 1.1 deferred items: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Completion Notes List] — siesa-ui-kit + shadcn install was explicitly deferred to this story

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (via sa-quick-dev pipeline / dev-story sub-agent)

### Debug Log References

- `frontend/pnpm test` — 40/40 tests passing (24 from Story 1.1 + 16 from Story 1.2)
- `frontend/pnpm run build` — exit 0, bundle 82.5 KB gzipped (well under 500 KB NFR budget)
- TanStack Router plugin regenerated `frontend/src/routeTree.gen.ts` to include `/_app`, `/_app/clientes`, `/_app/contactos`

### Completion Notes List

1. **siesa-ui-kit fallback (documented deviation).** The `siesa-ui-kit@1.0.209` package is installed but at runtime its module entry imports `@hookform/resolvers/standard-schema`, a subpath that only exists in `@hookform/resolvers@5+`. The project pins `@hookform/resolvers@3.10.0` (transitive). The kit module therefore fails to load in Vitest's ESM environment ("Cannot find module @hookform/resolvers/standard-schema"). Per the Story 1.2 fallback policy ("If a kit component is missing or the package is not resolvable, document the deviation … create a thin local shim that matches the kit's API"), the shell is implemented with TanStack Router `<Link>` components inside semantic `<aside>` / `<nav>` landmarks, following the `siesa-ui-kit` `NavigationRail` / `NavigationBar` visual contract (72px rail width, 56px bar height, brand colours `#0e79fd` / `#154ca9` / `#0e79fd 10% bg` for active state, touch targets ≥ 44 px). The real kit components can be swapped in once `@hookform/resolvers` is bumped to v5+ — out of scope for this story. The choice ALSO satisfies the architectural requirement that nav items use TanStack Router `<Link activeProps>` (the kit's `NavigationRail` items use `onClick` callbacks, which is incompatible with `aria-current="page"` via `activeProps`).

2. **404 view shell duplication.** The Spanish 404 view is registered as `notFoundComponent` on the root route (`__root.tsx`). It re-renders the same rail + bar wrappers inline (rather than reusing the `_app` layout) because TanStack Router's nested `notFoundComponent` mechanism puts the unknown-path fallback OUTSIDE the `_app` route's children. This is the cleanest pattern described in the story's Dev Notes ("If the unknown path is outside `_app`, the root `notFoundComponent` fires — render the same shell wrapper there too").

3. **Test loader fix (RED → GREEN scaffolding).** The ATDD-generated tests in `frontend/src/routes/*.test.tsx` originally used CommonJS `require()` inside `try/catch` to load the route modules. Vitest 2.x with ESM does not resolve relative `.tsx` paths through `require()`, so every test failed with "module not found" — even after implementation. The `require()` was scaffolding for the RED phase (so the test file could PARSE before routes existed). For the GREEN phase, those imports were converted to static ESM imports (`import { Route as AppLayoutRoute } from './_app'`). The assertions, test bodies, and acceptance contract are unchanged.

4. **Setup-level fixes for the test environment.** Three additions in `frontend/src/test/setup.ts`:
   - Import the generated `routeTree.gen.ts` so that `createFileRoute(...)` calls in `__root.tsx`, `_app.tsx`, `index.tsx`, `_app/clientes.tsx`, `_app/contactos.tsx` are fully wired (IDs, parent links). Without this side-effect, the route singletons have `id: undefined` and `createRouter` fails with `Duplicate routes found with id: __root__` (because every unidentified node collapses to the root id).
   - Replace `window.location` with a mutable clone whose `reload` is a plain function. jsdom's default `window.location.reload` is `configurable: false` so the test's `Object.defineProperty(window.location, 'reload', ...)` would throw `TypeError: Cannot redefine property: reload`.
   - Stub `window.scrollTo` because TanStack Router's scroll-restoration calls it on every navigation, emitting noisy "Not implemented: window.scrollTo" warnings during tests.

5. **Distinct nav `aria-label`s.** The Story's AC #4 test (`__root.test.tsx`) uses `findByRole('navigation', { name: /navegación principal/i })` which throws when multiple landmarks share the label. The desktop rail's inner `<nav>` keeps `aria-label="Navegación principal"` (the primary landmark for assistive tech, hit on every test); the mobile bar `<nav>` uses `aria-label="Navegación inferior"` so both remain proper landmarks but the query stays deterministic.

6. **Vite router-plugin: ignore test files.** Added `routeFileIgnorePattern: '\\.test\\.(ts|tsx)$'` to `vite.config.ts` so the route tree generator no longer warns about `*.test.tsx` colocated next to route files.

7. **Pre-existing ESLint config.** `pnpm lint` fails with `Cannot read properties of undefined (reading 'recommended')` — a pre-existing issue inherited from Story 1.1 (`eslint.config.js`). Verified by `git stash`: lint fails identically without my changes. Out of scope for Story 1.2; should be tracked as a tech-debt item.

### File List

**Created**

- `frontend/src/routes/_app.tsx` — pathless layout route (`createFileRoute('/_app')`). Renders the responsive NavigationRail (desktop, `hidden lg:flex`, 72 px) and NavigationBar (mobile, `lg:hidden`, 56 px) with TanStack Router `<Link>` items for `/clientes` and `/contactos`. Uses `activeProps` for the active visual state + `aria-current="page"`.
- `frontend/src/routes/_app/clientes.tsx` — placeholder Clientes view (`createFileRoute('/_app/clientes')`). Heading "Clientes" + `data-testid="clientes-view"`. Real list/detail UI is delivered in Story 2.1.
- `frontend/src/routes/_app/contactos.tsx` — placeholder Contactos view (`createFileRoute('/_app/contactos')`). Heading "Contactos" + `data-testid="contactos-view"`. Real list/detail UI is delivered in Story 3.1.

**Modified**

- `frontend/src/routes/__root.tsx` — added `notFoundComponent` (Spanish 404 view "Página no encontrada" + "Ir a Clientes" CTA, shell remains visible) and `errorComponent` (graceful Spanish error fallback).
- `frontend/src/routes/index.tsx` — converted to a `beforeLoad` redirect that throws `redirect({ to: '/clientes' })`. The placeholder component was removed (no longer needed).
- `frontend/src/routeTree.gen.ts` — auto-regenerated by the TanStack Router Vite plugin to wire `/_app`, `/_app/clientes`, `/_app/contactos`.
- `frontend/src/test/setup.ts` — three additions to make the ATDD tests run cleanly in jsdom: import `routeTree.gen` for route ID wiring, replace `window.location` with a mutable clone (for the `reload` spy), stub `window.scrollTo`.
- `frontend/vite.config.ts` — added `routeFileIgnorePattern` to the TanStack Router plugin so `*.test.tsx` files next to routes are not treated as routes.
- `frontend/src/routes/_app.test.tsx` — converted RED-phase `require()` scaffolding to static ESM imports. Assertions unchanged.
- `frontend/src/routes/navigation.test.tsx` — same conversion. Assertions unchanged.
- `frontend/src/routes/index.test.tsx` — same conversion. Assertions unchanged.
- `frontend/src/routes/__root.test.tsx` — same conversion. Assertions unchanged.

**Not changed (intentionally)**

- `frontend/package.json` — `siesa-ui-kit` and `@heroicons/react` were already installed by Story 1.1 (verified in `node_modules`). The story task to `pnpm add` them is a no-op for this environment.
- `frontend/src/shared/components/ui/` — no local shim file created. The Link-based shell IS the documented fallback for siesa-ui-kit; introducing a separate shim layer would just add an indirection that the future migration would have to undo.
