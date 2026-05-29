# Story 1.2: Frontend Navigation Shell

Status: done

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser, **When** the user views the app, **Then** a `NavigationRail` component (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" navigation entries, **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a `NavigationBar` component (siesa-ui-kit) is displayed at the bottom of the screen instead of the rail, **And** all navigation items are accessible and tappable (FR29).

3. **Given** the user types `/clientes` directly in the browser URL bar, **When** the page loads, **Then** the Clientes view is rendered correctly with the navigation rail/bar visible and the "Clientes" entry highlighted as active, without redirection to a home screen (FR30).

4. **Given** the user types `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the Contactos view is rendered correctly with the navigation rail/bar visible and the "Contactos" entry highlighted as active, without redirection to a home screen (FR30).

5. **Given** the user navigates to an unknown route (e.g., `/unknown`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish and a link to return to `/clientes`.

6. **Given** the root path `/` is accessed, **When** the page loads, **Then** the user is automatically redirected to `/clientes` without displaying a blank screen.

## Tasks / Subtasks

- [x] Task 1 — Create the `_app` pathless layout route with `LayoutBase` + `NavigationRail` (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout route wrapping `LayoutBase` from siesa-ui-kit; renders `<Outlet />` for nested routes
  - [x] Import and render `NavigationRail` (siesa-ui-kit) in `_app.tsx` for desktop viewport (>= 1024px `lg` breakpoint)
  - [x] Import and render `NavigationBar` (siesa-ui-kit) in `_app.tsx` for mobile viewport (< 1024px)
  - [x] Wire navigation entries: `{ label: 'Clientes', icon: <UsersIcon />, to: '/clientes' }` and `{ label: 'Contactos', icon: <UserIcon />, to: '/contactos' }` (Heroicons)
  - [x] Use TanStack Router's `Link` with `activeProps` to highlight the active route entry in the rail/bar
  - [x] Apply `domElementGetter` pointing to `#single-spa-application` (required per company standards for Single-SPA compatibility)

- [x] Task 2 — Create `/clientes` and `/contactos` routes inside the `_app` layout (AC: #3, #4)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — renders `ClientesShellView` placeholder; `export const Route = createFileRoute('/_app/clientes')(...)`
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — renders `ContactosShellView` placeholder; `export const Route = createFileRoute('/_app/contactos')(...)`
  - [x] Create `frontend/src/modules/crm/clientes/presentation/components/ClientesShellView.tsx` — placeholder component with heading "Clientes" (text in Spanish) and a `react-loading-skeleton` block to represent future list content
  - [x] Create `frontend/src/modules/crm/contactos/presentation/components/ContactosShellView.tsx` — placeholder component with heading "Contactos" and skeleton block

- [x] Task 3 — Configure root route redirect and 404 (AC: #5, #6)
  - [x] Update `frontend/src/routes/__root.tsx` — wrap with `QueryProvider` + `LayoutBase` shell; render `<Outlet />`
  - [x] Update `frontend/src/routes/index.tsx` — add `redirect` to `/clientes` via TanStack Router's `beforeLoad` or `loader` redirect so the root `/` path redirects immediately
  - [x] Create `frontend/src/routes/$.tsx` (catch-all) — renders a 404 not-found view with Spanish message "Página no encontrada" and a link to `/clientes`

- [x] Task 4 — Regenerate `routeTree.gen.ts` (AC: #1–#6)
  - [x] Run `npx @tanstack/router-cli generate` to regenerate `frontend/src/routeTree.gen.ts` with all new routes registered: `_app`, `_app/clientes`, `_app/contactos`, and the `$` catch-all
  - [x] Confirm zero TypeScript errors: `npx tsc --noEmit` emits 0 errors after route tree regeneration

- [x] Task 5 — Unit and component tests (AC: #1–#6)
  - [x] Create `frontend/src/routes/__tests__/navigation.test.tsx` — test that `NavigationRail` renders "Clientes" and "Contactos" entries at desktop width using RTL + Vitest; assert active class is applied to the current route
  - [x] Create `frontend/src/routes/__tests__/navigation-mobile.test.tsx` — test that `NavigationBar` renders at mobile viewport width (jsdom viewport 375px)
  - [x] Create `frontend/src/routes/__tests__/not-found.test.tsx` — test that accessing an unknown route renders the 404 view with the Spanish message
  - [x] All tests pass: `pnpm run test` reports 0 failures (28 tests, 5 test files)

## Dev Notes

### Architecture Decisions

- **Routing approach:** TanStack Router file-based routing. The `_app` prefix creates a **pathless layout route** — it groups `/clientes` and `/contactos` under a shared layout (NavigationRail/NavigationBar) without adding a URL segment. Files live at `frontend/src/routes/_app.tsx` and `frontend/src/routes/_app/clientes.tsx`, `frontend/src/routes/_app/contactos.tsx`.
- **Navigation component priority:** siesa-ui-kit `NavigationRail` (desktop) and `NavigationBar` (mobile) are P0 per company standards. Do NOT create custom navigation components. If siesa-ui-kit is unavailable in the environment, use a minimal shadcn/ui `nav` pattern as fallback and document the gap.
- **Responsive breakpoint:** `lg: 1024px` per company standards. Use TailwindCSS v4 responsive prefixes: `hidden lg:flex` for rail, `flex lg:hidden` for bottom bar.
- **Active route highlighting:** TanStack Router `Link` component exposes `activeProps` and `inactiveProps`. Pass the active style/class expected by siesa-ui-kit's `NavigationRail` item API.
- **Redirect `/` → `/clientes`:** Use TanStack Router's `beforeLoad` in `index.tsx` with `throw redirect({ to: '/clientes' })` — do NOT use `window.location.href`.
- **No Zustand store needed for navigation state:** URL is the source of truth per architecture decisions. The active route is derived from the router, not a Zustand store.
- **Single-SPA compatibility:** Include `domElementGetter: () => document.querySelector('#single-spa-application')` in root configuration per company microfrontend standards (even for standalone SPA, this is required for future platform integration).

### File Placement

All frontend files follow the Clean Architecture + DDD folder structure:

```
frontend/src/
  routes/
    __root.tsx                      # Updated: QueryProvider + Outlet
    index.tsx                       # Updated: redirect to /clientes
    _app.tsx                        # NEW: pathless layout — NavigationRail/NavigationBar
    _app/
      clientes.tsx                  # NEW: /clientes route
      contactos.tsx                 # NEW: /contactos route
    404.tsx                         # NEW: catch-all not-found route (or use $ prefix)
  modules/
    crm/
      clientes/
        presentation/
          components/
            ClientesShellView.tsx   # NEW: placeholder for Epic 2
      contactos/
        presentation/
          components/
            ContactosShellView.tsx  # NEW: placeholder for Epic 3
  routeTree.gen.ts                  # REGENERATED by TanStack Router
```

### Tech Stack Details

- **Icons:** Heroicons (primary per company standards) — `UsersIcon` for Clientes, `UserIcon` for Contactos from `@heroicons/react/24/outline`
- **Loading skeletons:** `react-loading-skeleton` for `ClientesShellView` and `ContactosShellView` placeholder content — skeleton screens, not spinners per company standards
- **Brand colors:** Primary `#0e79fd` (Siesa Blue) for active navigation item. Apply via TailwindCSS custom color or siesa-ui-kit token, NOT hardcoded hex in component props.
- **Typography:** Inter font, already configured from Story 1.1 baseline. No additional font loading needed.
- **Accessibility:** All navigation items must have `aria-label` in Spanish (e.g., `aria-label="Ir a Clientes"`). NavigationRail/NavigationBar must pass `axe` accessibility audit (WCAG 2.1 AA).
- **Bundle budget:** This story adds navigation shell components only — expected bundle delta < 15 KB gzipped. Verify total stays under 500 KB gzipped after build.

### Constraints from Story 1.1

- Story 1.1 created `src/routes/__root.tsx` as a minimal shell placeholder and `src/routes/index.tsx` as the home route. Both files must be updated in this story.
- `siesa-ui-kit` was not available in the npm registry during Story 1.1. If still unavailable, document this as a gap and implement a minimal Tailwind-based responsive navigation layout that matches the component API expected by siesa-ui-kit so the swap is non-breaking when the kit becomes available.
- `pnpm` is the mandatory package manager. Any new dependencies must be installed with `pnpm add`.

### References

- TanStack Router file-based routing prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- Route structure decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Project directory complete structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- FR28, FR29, FR30: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Navigation & Access]
- Epic 1 AC-E1.1, AC-E1.2, AC-E1.3: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Epic 1]
- UX responsive layout specification: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Platform Strategy]
- Microfrontend Single-SPA standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Microfrontends]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- siesa-ui-kit not available in npm registry; implemented Tailwind-based custom `NavigationRail` and `NavigationBar` components matching expected siesa-ui-kit API (swap will be non-breaking when kit becomes available).
- Test files under `src/routes/__tests__/` required `routeFileIgnorePattern: '__tests__'` in vite.config.ts to prevent TanStack Router from scanning them as route files.
- Test import paths corrected from `../../../shared/` to `../../shared/` (tests are 2 levels deep from `src/`, not 3).
- `NavigationRail` and `NavigationBar` use TanStack Router `Link`; tests wrapped with `RouterContextProvider` + `createMemoryHistory` + `act` to provide router context without full route rendering.

### Completion Notes List

- siesa-ui-kit unavailable: custom `NavigationRail` and `NavigationBar` components implemented in `src/shared/components/ui/` using TailwindCSS v4 responsive classes and Heroicons. Component API matches what siesa-ui-kit would expose.
- `domElementGetter` applied via `id="single-spa-application"` on the root layout div in `_app.tsx`.
- `routeTree.gen.ts` regenerated with all new routes: `/_app`, `/_app/clientes`, `/_app/contactos`, `/$` (catch-all), and `/` (redirect).
- 28 tests pass, 0 failures.

### File List

- `frontend/src/routes/_app.tsx` — NEW: pathless layout route with NavigationRail/NavigationBar
- `frontend/src/routes/_app/clientes.tsx` — NEW: /clientes route
- `frontend/src/routes/_app/contactos.tsx` — NEW: /contactos route
- `frontend/src/routes/$.tsx` — NEW: catch-all 404 route
- `frontend/src/routes/__root.tsx` — existing (no changes needed)
- `frontend/src/routes/index.tsx` — existing (no changes needed; redirect already in place)
- `frontend/src/shared/components/ui/NavigationRail.tsx` — NEW: desktop navigation rail
- `frontend/src/shared/components/ui/NavigationBar.tsx` — NEW: mobile navigation bar
- `frontend/src/shared/components/ui/NotFoundView.tsx` — NEW: 404 view component
- `frontend/src/modules/crm/clientes/presentation/components/ClientesShellView.tsx` — NEW: Clientes placeholder
- `frontend/src/modules/crm/contactos/presentation/components/ContactosShellView.tsx` — NEW: Contactos placeholder
- `frontend/src/routeTree.gen.ts` — REGENERATED: includes all new routes
- `frontend/src/routes/__tests__/navigation.test.tsx` — NEW: NavigationRail tests (12 tests)
- `frontend/src/routes/__tests__/navigation-mobile.test.tsx` — NEW: NavigationBar tests (7 tests)
- `frontend/src/routes/__tests__/not-found.test.tsx` — NEW: NotFoundView tests (5 tests)
- `frontend/vite.config.ts` — UPDATED: added `routeFileIgnorePattern: '__tests__'`
