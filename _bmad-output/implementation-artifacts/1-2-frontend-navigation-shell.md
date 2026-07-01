# Story 1.2: Frontend Navigation Shell

Status: ready-for-review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport ≥ 1024px / `lg:`), **When** the user views the app, **Then** a `NavigationRail` (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries. **And** clicking either entry navigates to `/clientes` or `/contactos` without a full page reload (client-side TanStack Router navigation) (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a mobile `NavigationBar` (siesa-ui-kit, bottom nav) is displayed instead of the `NavigationRail`. **And** all navigation items ("Clientes", "Contactos") are accessible and tappable (min 44×44px touch target) (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered without redirection to a home/landing screen (deep linking) (FR30).

4. **Given** the user navigates to the app root `/`, **When** the page loads, **Then** the user is redirected to `/clientes` (default landing section).

5. **Given** the user navigates to an unknown route (e.g. `/foo`), **When** the page loads, **Then** a 404/not-found view is displayed gracefully, in Spanish, with a link back to `/clientes`. No full page crash or blank screen.

6. **Given** the user is on `/clientes` and the viewport is desktop, **When** the navigation rail renders, **Then** the "Clientes" item shows the active visual state (`active: true` on its `NavigationRailGroupMenuItem`, rendering `primary-600` left border / `primary-50` background per UX spec) and "Contactos" does not. Switching to `/contactos` moves the active state accordingly.

## Tasks / Subtasks

- [x] Task 1 — Install missing dependency (AC: #1, #2)
  - [x] Run `pnpm add @heroicons/react` in `frontend/` (Heroicons is the primary icon set per company standards; not yet installed — verified absent from `frontend/package.json`)

- [x] Task 2 — Create TanStack Router route structure (AC: #1, #3, #4, #5)
  - [x] Create `frontend/src/routes/index.tsx` — redirects `/` → `/clientes` using `redirect()` in the route's `beforeLoad` (TanStack Router file-based convention)
  - [x] Create `frontend/src/routes/_app.tsx` — pathless layout route (`_` prefix = no URL segment) rendering the shared shell (`AppShell` wrapping `LayoutBase` + mobile `NavigationBar` + `<Outlet />`)
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — renders a placeholder `ClientesView` component (`<div>Clientes</div>` or equivalent; the real list view is built in Epic 2) mapped to `/clientes`
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — renders a placeholder `ContactosView` component mapped to `/contactos` (real view built in Epic 3)
  - [x] Configure `notFoundComponent` on `createRootRoute()` in `__root.tsx` (TanStack Router built-in API, not a routed file) rendering `NotFoundView` — Spanish message: "Página no encontrada" + link to `/clientes`
  - [x] Verify `frontend/src/routeTree.gen.ts` regenerates automatically via `@tanstack/router-plugin/vite` on `pnpm run dev` (already configured in Story 1.1) — do NOT hand-edit this file

- [x] Task 3 — Build the navigation shell component (AC: #1, #2, #6)
  - [x] Create `frontend/src/shared/components/AppShell.tsx` — uses `LayoutBase` (siesa-ui-kit) as the primary wrapper for desktop/tablet, PLUS a standalone `NavigationBar` (siesa-ui-kit) rendered only below `lg:` for the mobile bottom nav. Deviation from Dev Notes: visibility is driven by a `useIsDesktop()` hook (`window.matchMedia('(min-width: 1024px)')`) that conditionally renders ONE of the two branches, instead of a CSS-only `hidden lg:block` split — required because AC #2's test asserts the rail's `data-testid` is absent from the DOM on mobile (`queryByTestId(...).not.toBeInTheDocument()`), which CSS-only hiding does not satisfy in jsdom.
  - [x] `LayoutBase` props: `productName="Siesa Agents"`, `navigationItems` = two `NavigationRailGroupMenuItem` entries (Clientes/Contactos, Heroicons `UsersIcon`/`UserGroupIcon`, `active`, `onClick`). Deviation: `navigationRailProps={{ state: 'expanded' }}` instead of `collapsed` — required because AC #1's test asserts visible "Clientes"/"Contactos" text (`getByText`), and siesa-ui-kit's `collapsed` state is icon-only (label only in `aria-label`, no visible text node).
  - [x] `NavigationBar` (mobile bottom nav) items: same two entries via `NavigationBarItem` shape, `activeItemId` bound to current route, `onItemClick` calling the router's `navigate()`
  - [x] `active`/`activeItemId` derived from `useRouterState({ select: (s) => s.location.pathname })`, matched via `startsWith` against `/clientes` and `/contactos`
  - [x] `useNavigate()` used for programmatic navigation in each item's `onClick`/`onItemClick` (client-side, no full reload)
  - [x] `children` passed to `LayoutBase` is the route `<Outlet />` (content area)
  - [x] Added `RailIcon` wrapper (internal to `AppShell.tsx`) that tags the nearest ancestor `<button>` with `data-active`/`aria-current="page"` via a `ref`+`useEffect` — siesa-ui-kit's `NavigationRailGroup` only emits an accessible "current item" marker on its button in `collapsed` state, not `expanded` (verified by inspecting rendered DOM); AC #6's test requires `[aria-current]`/`[data-active]` on an ancestor of the visible label text, which is only reachable in `expanded` mode via this composition-level fix (no third-party code was patched).
  - [x] Added `data-testid="app-shell-location"` (visually hidden, exposes current pathname) — required by `AppShell.test.tsx`'s AC #1 navigation assertion; not explicitly listed in this task's original bullets but documented in the ATDD checklist's "Required data-testid Attributes" section.

- [x] Task 4 — Wire the shell into the route tree (AC: #1, #2, #3)
  - [x] `frontend/src/routes/_app.tsx` renders `<AppShell><Outlet /></AppShell>`
  - [x] `frontend/src/routes/__root.tsx` remains the outer root (`data-testid="app-root"` preserved from Story 1.1) wrapping the router-level `<Outlet />` and the `notFoundComponent`
  - [x] Confirmed `_app` pathless layout does not add a URL segment — `/clientes` and `/contactos` resolve directly, not `/_app/clientes`

- [x] Task 5 — Not-found view (AC: #5)
  - [x] Create `frontend/src/shared/components/NotFoundView.tsx` — Spanish copy: heading "Página no encontrada", subtext, and a `Link` (TanStack Router) navigating to `/clientes`. Deviation: used `@tanstack/react-router`'s `Link` directly (styled as a button) instead of siesa-ui-kit's `Button`, because `Button` has no `asChild`/link-composition API (it renders a plain `<button onClick>`, not link-composable) — a real `<a href>` was required for the test's `toHaveAttribute('href', '/clientes')` assertion and for correct semantics/deep-linking.
  - [x] Registered via `notFoundComponent` on `createRootRoute` in `__root.tsx`

- [x] Task 6 — Tests (Vitest + RTL)
  - [x] `frontend/src/shared/components/AppShell.test.tsx` — all 6 tests passing (GREEN)
  - [x] `frontend/src/shared/components/NotFoundView.test.tsx` — both tests passing (GREEN)
  - [x] Accessibility check with `axe` (`AppShell.a11y.test.tsx`) — both tests passing (GREEN)

## Dev Notes

### Scope boundary (critical)

This story builds ONLY the navigation shell and empty route placeholders for `/clientes` and `/contactos`. It does **not** implement:
- Client list/search UI (Epic 2, Story 2.1)
- Contact list/search UI (Epic 3, Story 3.1)
- Any API calls, TanStack Query hooks, or backend integration

`ClientesView` and `ContactosView` in this story are minimal placeholder components (e.g., a heading with the section name) that will be replaced/extended by Epic 2 and Epic 3 stories respectively. Do not build `ClienteListView`/`ContactoListView` presentation logic here — that is out of scope.

### siesa-ui-kit component API (verified against installed package v1.0.250 — read directly from `.d.ts` sources)

**`LayoutBase`** (`views/LayoutBase/LayoutBase.types.d.ts`) IS the correct primary wrapper — it exists in the package (under `views/`, not `components/`) and composes `Navbar` (top) + `NavigationRailGroup` (side) + a content area:
```typescript
interface LayoutBaseProps {
  productName?: string                          // default 'SB Comercial' — use 'Siesa Agents'
  siesaLogoPath?: string; siesaLogoWidth?: string; siesaLogoHeight?: string
  userDropdown?: UserDropdownProps
  navigationItems?: NavigationRailGroupMenuItem[]   // the nav entries — NOT NavigationRailItemProps
  children?: ReactNode                          // content area
  hideSidebar?: boolean                         // default false
  navbarProps?: Partial<NavbarProps>            // pass-through
  navigationRailProps?: Partial<NavigationRailGroupProps>  // pass-through, e.g. { state: 'collapsed' }
}
```

`NavigationItems` for `LayoutBase` use the `NavigationRailGroupMenuItem` shape (from `NavigationRailGroup`, the component `LayoutBase` uses internally — NOT the standalone `NavigationRail`/`NavigationRailItemProps`):
```typescript
interface NavigationRailGroupMenuItem {
  id: string; label: string; icon: ReactNode
  active?: boolean      // caller sets this per current route — no built-in path matching
  disabled?: boolean
  onClick?: () => void  // caller wires this to navigate()
  isCollapsible?: boolean; children?: NavigationRailGroupMenuItem[]; defaultOpen?: boolean
  badge?: boolean; badgeCount?: number
}
```

`NavigationRailGroupProps.state`: `'collapsed'` (80px icons-only, default) | `'expanded'` (215px w/ labels) | `'hover'` | `'searcher'` — use `'collapsed'` to match the UX spec's 72–80px rail.

**IMPORTANT — mobile bottom nav is NOT part of `LayoutBase`.** `LayoutBase`'s own responsive behavior only covers `Navbar` + `NavigationRailGroup` (`md:`/`lg:`/`xl:`). The UX spec's explicit requirement for a bottom `NavigationBar` on mobile (AC #2) must be added by the caller, standalone, alongside `LayoutBase`:
```typescript
// components/NavigationBar/NavigationBar.types.d.ts — standalone, mobile bottom nav
interface NavigationBarProps {
  items: NavigationBarItem[]   // { id: string, icon: ReactNode, label: string, active?, disabled?, onClick?: (id)=>void, ariaLabel? }
  activeItemId?: string
  onItemClick?: (id: string) => void
  ariaLabel?: string  // default 'Navigation Bar'
}
```

None of these components depend on a router — they are **router-agnostic**, driven by `id`/`active`/`onClick` callbacks, not `href`. The caller (`AppShell`) computes `active`/`activeItemId` from TanStack Router's current path and wires `onClick`/`onItemClick` to `useNavigate()`.

Import path: `import { LayoutBase, NavigationBar } from 'siesa-ui-kit'` (types: `LayoutBaseProps`, `NavigationRailGroupMenuItem`, `NavigationBarProps`, `NavigationBarItem` — all re-exported from the package root).

### TanStack Router patterns (per company standards)

| Prefix | Effect | Used here for |
|---|---|---|
| `_` | Pathless layout (no URL segment) | `_app.tsx` — wraps all authenticated/shell routes |
| (none) | Standard route | `_app/clientes.tsx`, `_app/contactos.tsx` |
| `-` | Ignored by router (colocated) | N/A this story — `NotFoundView` lives in `shared/components/`, not `routes/`, and is wired via `notFoundComponent`, not a routed file |

- Root-level redirect (`/` → `/clientes`): use `beforeLoad: () => { throw redirect({ to: '/clientes' }) }` in `routes/index.tsx`, the standard TanStack Router pattern — avoids a full navigation/reload.
- Not-found handling: TanStack Router's built-in `notFoundComponent` option on `createRootRoute()` — do not hand-roll a catch-all route.
- File-based routing auto-generates `routeTree.gen.ts` on save (Vite plugin, already configured in Story 1.1) — never edit this generated file directly.

### Architecture references

- Routing table: `/clientes`, `/clientes/:id`, `/contactos`, `/contactos/:id` — this story only wires `/clientes` and `/contactos` (list-level placeholders); detail routes (`:id`) are added in Epic 2/3/4. [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Root layout comment `__root.tsx — LayoutBase + NavigationRail` in the architecture doc's directory tree matches the real package: `LayoutBase` exists under `siesa-ui-kit`'s `views/` export and internally composes `Navbar` + `NavigationRailGroup`. The standalone mobile `NavigationBar` referenced in the UX spec is a separate component not included in `LayoutBase` and must be added alongside it (see siesa-ui-kit API note below). [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Desktop layout: `NavigationRail` 72px collapsed, icon-only with labels. Mobile: `NavigationBar` bottom, 56px. Breakpoint `lg:` (1024px) is the critical switch point. [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility]
- NavigationRail items: "Clientes" (`/clientes`) and "Contactos" (`/contactos`) — "Configuración" item mentioned in UX spec is out of scope (no config section exists in this MVP's epics). [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- Active nav item visual: `primary-50` background, `primary-700`/`primary-600` text/border — matches `NavigationRailGroupMenuItem.active` built-in styling, no custom override needed. [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy / Navigation Patterns]
- Not-found/registro no encontrado pattern: Spanish copy, link to recovery destination (`/clientes`), never raw technical error. [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Error & Recovery Patterns]
- Icons: Heroicons primary per company standards — `@heroicons/react` not yet installed, add in Task 1. [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Icons]
- All user-facing text in Spanish; code (component/variable names) in English. [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]

### Project Structure Notes

- Alignment with company folder structure: `routes/` holds ONLY TanStack Router file-based routes (per standard); the `AppShell` and `NotFoundView` components are NOT routes — they belong in `shared/components/` since they are cross-cutting/reusable, not module-specific (`modules/{module}/{domain}/{feature}` is reserved for business-domain code like `clientes`/`contactos`, which do not yet exist as modules — that begins in Epic 2/3).
- No `modules/crm/clientes` or `modules/crm/contactos` folders are created in this story — those are scaffolded starting Epic 2 Story 2.1 (clientes) and Epic 3 Story 3.1 (contactos). The placeholder route components (`ClientesView`, `ContactosView`) may live inline in the route file or in `shared/components/` temporarily; do not create the full Clean Architecture module structure prematurely.
- No variance from unified project structure detected — this story is additive to the skeleton established in Story 1.1.

### Previous Story Intelligence (from Story 1.1)

- Package manager is `pnpm` — use `pnpm add`, not `npm install`.
- `siesa-ui-kit` already installed (`^1.0.250`) — no reinstall needed, only the missing `@heroicons/react` dependency (Task 1).
- `@tanstack/router-plugin/vite` is already configured in `vite.config.ts` — `routeTree.gen.ts` regenerates automatically; no manual route registration needed beyond creating files under `src/routes/`.
- `data-testid="app-root"` on the root layout div must be preserved (existing E2E dependency from Story 1.1's ATDD suite).
- Browser-driven Playwright tests may be blocked in the CI/dev sandbox (no Chromium binary per Story 1.1's Debug Log) — prioritize Vitest + RTL component tests; if Playwright browser tests cannot run, document the same limitation rather than skipping/weakening assertions.
- Story 1.1 code review flagged: always verify claimed file creation with `find`/`ls` before listing it in File List — do not claim folders/files exist without independent verification.

### Testing Standards Summary

- Vitest + React Testing Library + MSW (company standard) — no MSW network mocking needed in this story (no API calls).
- Accessibility checks with `axe` on the `AppShell` component (WCAG 2.1 AA target, delivered largely by siesa-ui-kit + Radix primitives per UX spec).
- Tests co-located with source: `AppShell.test.tsx` next to `AppShell.tsx`.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Architecture — routing & directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture, #Complete Project Directory Structure]
- UX design — navigation patterns, component strategy, responsive breakpoints: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy, #Navigation Patterns, #Responsive Design & Accessibility]
- siesa-ui-kit component contracts (verified directly against installed package): `frontend/node_modules/siesa-ui-kit/dist/views/LayoutBase/LayoutBase.types.d.ts`, `.../components/NavigationRailGroup/NavigationRailGroup.types.d.ts`, `.../components/NavigationBar/NavigationBar.types.d.ts`, `.../components/Navbar/Navbar.types.d.ts`
- Company stack standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- Fixed `frontend/src/test/support/renderWithRouter.tsx`: switched from `RouterProvider` (renders `<Matches />`, gated behind the router's async `Transitioner` load lifecycle) to the lower-level `RouterContextProvider` (router context only, no pending-load gate). TanStack Router 1.170's initial route load is always microtask-async, even with zero loaders (verified via direct experimentation against `@tanstack/router-core`'s `router.load()`), so `NotFoundView.test.tsx`'s synchronous `getByRole`/`getByTestId` assertions (no `await`/`findBy`) could never resolve against a real `RouterProvider` tree regardless of `NotFoundView`'s implementation. `RouterContextProvider` renders children immediately while still providing full router context for `useNavigate`/`useRouterState`/`Link`.
- Fixed `frontend/src/test/setup.ts`: `vitest-axe@0.1.0`'s `extend-expect.js` compiles to an empty module and its `matchers` subpath ships a `.d.ts` that mis-tags `toHaveNoViolations` as type-only under `verbatimModuleSyntax`. Registered the matcher manually via `expect.extend` and added `frontend/src/test/vitest-axe-matchers.d.ts` (local ambient override restating the verified-working runtime shape from `vitest-axe/dist/matchers.js`).
- Removed a stale `@ts-expect-error` directive in `frontend/src/routes/-navigation-shell.routing.test.tsx` above the `routeTree.gen.ts` import — it was correct during RED phase (route tree didn't exist) but became an "unused directive" TS error once the route tree resolved successfully post-implementation; only the directive/comment was removed, no assertions were touched.
- `pnpm test` (14/14 passing), `pnpm exec tsc -b` (clean), `pnpm run build` (succeeds) all verified after implementation.

### Completion Notes List

- All 14 ATDD tests (RED → GREEN): `AppShell.test.tsx` (6), `AppShell.a11y.test.tsx` (2), `NotFoundView.test.tsx` (2), `-navigation-shell.routing.test.tsx` (4).
- Three deviations from the story's Dev Notes were required to satisfy the RED test suite as written; each is documented inline in Tasks 3 and 5 above: (1) `navigationRailProps.state: 'expanded'` instead of `'collapsed'` (AC #1 needs visible label text), (2) JS-driven conditional rendering (`useIsDesktop`) instead of CSS-only `hidden lg:block` for the rail/bottom-nav split (AC #2 needs the inactive variant fully absent from the DOM), (3) a small `RailIcon` composition wrapper to restore `aria-current`/`data-active` on the active rail button, which siesa-ui-kit's `NavigationRailGroup` only emits in `collapsed` state, not `expanded` (AC #6).
- No `modules/crm/*` folders created — scope boundary respected per Dev Notes (placeholders only, real list views deferred to Epic 2/3).
- Bundle size: `dist/assets/index-9vtT7Yo--CgpKlYWI.js` (siesa-ui-kit's own internal chunk, ~300KB gzip) exceeds the 500KB gzip budget when combined with the rest; this chunk is dominated by siesa-ui-kit features unrelated to this story (dashboards, documents, charts) and isn't addressable within this story's scope — flagged for awareness, not a regression introduced here.

### File List

**Created:**
- `frontend/src/routes/index.tsx`
- `frontend/src/routes/_app.tsx`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/routes/_app/contactos.tsx`
- `frontend/src/shared/components/AppShell.tsx`
- `frontend/src/shared/components/NotFoundView.tsx`
- `frontend/src/test/vitest-axe-matchers.d.ts`

**Modified:**
- `frontend/src/routes/__root.tsx` (added `notFoundComponent`)
- `frontend/src/test/support/renderWithRouter.tsx` (fixed async-pending-state bug, see Debug Log)
- `frontend/src/test/setup.ts` (fixed broken `vitest-axe` matcher registration)
- `frontend/src/routes/-navigation-shell.routing.test.tsx` (removed stale `@ts-expect-error`, no assertions changed)
- `frontend/package.json` / `frontend/pnpm-lock.yaml` (added `@heroicons/react`)
