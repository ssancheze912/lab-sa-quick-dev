# Story 1.2: Frontend Navigation Shell

Status: done

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a `NavigationRail` component (from `siesa-ui-kit`) is visible on the left side with icon-only entries for "Clientes" and "Contactos" (collapsed, 72px wide), **And** clicking either entry navigates to `/clientes` or `/contactos` using TanStack Router client-side navigation without a full page reload (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a `NavigationBar` component (from `siesa-ui-kit`) is displayed at the bottom of the screen instead of the rail with "Clientes" and "Contactos" entries, **And** all navigation items are accessible and tappable with a minimum touch target of 44px (FR29).

3. **Given** the user types `/clientes` or `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the correct view is rendered with the corresponding navigation item visually marked as active, without being redirected to a home screen (FR30 — deep linking).

4. **Given** the user is on the `/clientes` route, **When** they click the "Contactos" navigation item, **Then** the URL changes to `/contactos` and the active state on the navigation updates to "Contactos", **And** no full page reload occurs (verified by absence of network activity for the HTML document).

5. **Given** the user navigates to an unknown route (e.g., `/ruta-inexistente`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a Spanish-language message and a link back to `/clientes`.

6. **Given** the root path `/` is accessed, **When** the page loads, **Then** the user is automatically redirected to `/clientes`.

7. **Given** the application shell is rendered, **When** any screen reader traverses the navigation, **Then** all interactive navigation elements have ARIA labels in Spanish (`aria-label` values in Spanish) and the navigation landmark is marked with `<nav aria-label="Navegación principal">`.

## Tasks / Subtasks

- [x] Task 1 — Create the `_app.tsx` layout route (AC: #1, #2, #6)
  - [x] Create `frontend/src/routes/_app.tsx` as a pathless TanStack Router layout route with the `_` prefix
  - [x] Import `LayoutBase`, `Navbar`, `NavigationRail`, and `NavigationBar` from `siesa-ui-kit`
  - [x] Configure `Navbar` with `productName="Siesa Agents"` prop
  - [x] Configure `NavigationRail` (desktop ≥1024px) with navigation items: `{ label: 'Clientes', to: '/clientes', icon: UsersIcon }` and `{ label: 'Contactos', to: '/contactos', icon: UserIcon }` — icons from Heroicons
  - [x] Configure `NavigationBar` (mobile < 1024px) with the same navigation items for bottom-tab mobile behavior
  - [x] Use TanStack Router's `<Link>` or `useRouter` for navigation — NOT `<a href>` — to ensure SPA client-side navigation
  - [x] Render `<Outlet />` inside the content area of `LayoutBase` for nested routes
  - [x] Apply responsive visibility: `NavigationRail` visible on `lg:flex hidden`, `NavigationBar` visible on `flex lg:hidden`
  - [x] Ensure `data-testid="app-shell"` is present on the `LayoutBase` wrapper for ATDD targeting

- [x] Task 2 — Create route files for Clientes and Contactos (AC: #3, #4)
  - [x] Create `frontend/src/routes/_app/` directory
  - [x] Create `frontend/src/routes/_app/clientes.tsx` — placeholder view with `<h1>Clientes</h1>` and `data-testid="clientes-view"`
  - [x] Create `frontend/src/routes/_app/contactos.tsx` — placeholder view with `<h1>Contactos</h1>` and `data-testid="contactos-view"`
  - [x] Verify TanStack Router plugin auto-generates `routeTree.gen.ts` including `_app`, `_app/clientes`, and `_app/contactos`

- [x] Task 3 — Configure root redirect and 404 route (AC: #6, #5)
  - [x] Update `frontend/src/routes/index.tsx` to redirect to `/clientes` using TanStack Router's `redirect` or `Navigate` — remove any placeholder content
  - [x] Create `frontend/src/routes/$.tsx` (catch-all) with a Spanish-language not-found message: "Página no encontrada" and a back link to `/clientes` with text "Ir a Clientes"
  - [x] Add `data-testid="not-found-view"` to the 404 component

- [x] Task 4 — Active navigation state (AC: #3, #4)
  - [x] Verify that `NavigationRail` and `NavigationBar` from `siesa-ui-kit` accept an `activeRoute` or equivalent prop, OR use TanStack Router's `useRouterState` / `useMatchRoute` hook to compute the active item and pass it to the siesa-ui-kit component
  - [x] Ensure the active item gets the correct visual treatment: `primary-50` background, `primary-700` text as per UX spec
  - [x] Add `aria-current="page"` on the active navigation link

- [x] Task 5 — Accessibility and WCAG compliance (AC: #7)
  - [x] Wrap navigation with `<nav aria-label="Navegación principal">` if `siesa-ui-kit` `LayoutBase` does not already do so
  - [x] Ensure all icon-only buttons (collapsed NavigationRail) have `aria-label` in Spanish: `aria-label="Clientes"`, `aria-label="Contactos"`
  - [x] Verify keyboard navigation: Tab key reaches all navigation items, Enter/Space activates them
  - [x] Verify color contrast of active state (`primary-600` on `primary-50`): must be ≥ 4.5:1 (WCAG AA)

- [x] Task 6 — Unit and component tests (AC: all)
  - [x] Create `frontend/src/routes/__tests__/-app-shell.test.tsx` using Vitest + React Testing Library
  - [x] Test: NavigationRail renders "Clientes" and "Contactos" links on desktop viewport (mock window width >= 1024)
  - [x] Test: NavigationBar renders on mobile viewport (mock window width < 1024)
  - [x] Test: Clicking "Contactos" link updates the active route (use `MemoryRouter` or TanStack Router test helpers)
  - [x] Test: 404 route renders "Página no encontrada" for unknown paths
  - [x] Test: Root `/` redirects to `/clientes`
  - [x] Test: All navigation items have accessible `aria-label` values (use `axe` from `@axe-core/react` or RTL `getByRole`)
  - [x] 19 tests passing, 86.48% branch coverage on new files

## Dev Notes

### Architecture Context

This story is **frontend-only** — no backend changes required. It builds the navigation shell on top of the project skeleton created in Story 1.1.

**Routing architecture (from `architecture.md` — TanStack Router file-based):**
```
src/routes/
  __root.tsx                  ← Root layout (exists from Story 1.1)
  index.tsx                   ← Redirect → /clientes (update this file)
  _app.tsx                    ← NEW: Pathless layout with navigation shell
  _app/
    clientes.tsx              ← NEW: /clientes placeholder
    contactos.tsx             ← NEW: /contactos placeholder
  (404 or $.tsx)              ← NEW: Not-found catch-all
```

The `_` prefix in TanStack Router creates a pathless layout route — it wraps child routes without adding a URL segment. This means `_app.tsx` renders the `LayoutBase`+`NavigationRail` shell, and `_app/clientes.tsx` resolves to the URL `/clientes`.

### siesa-ui-kit Navigation Components (MANDATORY)

Components to use (check siesa-ui-kit catalog first before any custom implementation):

| Component | Usage in this story |
|-----------|---------------------|
| `LayoutBase` | Main shell wrapper — provides Navbar slot + NavigationRail slot + Content area |
| `Navbar` | Top header — use `productName="Siesa Agents"` |
| `NavigationRail` | Desktop nav (72px collapsed, icon-only) — left side |
| `NavigationBar` | Mobile nav — bottom tab bar |

**UI Mandate:**
- Install: `siesa-ui-kit` is already installed from Story 1.1 (`pnpm add siesa-ui-kit`)
- You MUST use the above components from `siesa-ui-kit`. Do NOT build a custom navigation rail or bottom bar.
- Only build custom components if `siesa-ui-kit` provably does not have an equivalent.

### Navigation Items Configuration

Navigation items for both `NavigationRail` and `NavigationBar` (in Spanish labels per company standard):

```typescript
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline'

const navigationItems = [
  {
    label: 'Clientes',
    to: '/clientes',
    icon: UsersIcon,
    'aria-label': 'Clientes',
  },
  {
    label: 'Contactos',
    to: '/contactos',
    icon: UserIcon,
    'aria-label': 'Contactos',
  },
]
```

All user-facing text MUST be in Spanish. Code (variable names, function names) in English.

### TanStack Router Conventions

- **File prefix `_`** → pathless layout (no URL segment added). `_app.tsx` wraps routes in `_app/` folder.
- **File prefix `$`** → dynamic param. Use `$.tsx` for catch-all 404 route.
- **Auto-generated `routeTree.gen.ts`**: The `@tanstack/router-plugin/vite` generates this on save. Do NOT manually edit it.
- **Root redirect**: Update `frontend/src/routes/index.tsx` using TanStack Router's `redirect` in the `loader` function or `beforeLoad`:
  ```typescript
  import { createFileRoute, redirect } from '@tanstack/react-router'
  export const Route = createFileRoute('/')({
    beforeLoad: () => { throw redirect({ to: '/clientes' }) },
  })
  ```

### Responsive Breakpoint

Per UX specification and company standards:
- Desktop (≥ 1024px): `NavigationRail` visible, `NavigationBar` hidden
- Mobile (< 1024px): `NavigationBar` visible, `NavigationRail` hidden

TailwindCSS v4 responsive classes: use `hidden lg:flex` / `flex lg:hidden` pattern.

### Active State Management

Verify how `siesa-ui-kit`'s `NavigationRail` and `NavigationBar` handle active state. Common patterns:
1. **Prop-based**: Pass `activeItem` or `currentPath` prop → let the component handle styling
2. **TanStack Router integration**: Use `useRouterState` hook to get `location.pathname`, then pass to the navigation component

If siesa-ui-kit components accept a `to` prop that integrates with TanStack Router's `<Link>`, that is the preferred approach as it handles active state natively.

### Shell Layout Structure (Direction F from UX spec)

```
┌─ Navbar (64px) ────────────────────────────────────────────────┐
│  [Siesa symbol] Siesa Agents                                    │
└─────────────────────────────────────────────────────────────────┘
┌─ NavigationRail (72px) ─┬─ Content Area (flex-1) ──────────────┐
│  [UsersIcon] Clientes   │  <Outlet />                          │
│  [UserIcon]  Contactos  │                                      │
└─────────────────────────┴──────────────────────────────────────┘
                ↓ mobile (< 1024px)
┌─ Content Area (full width) ──────────────────────────────────────┐
│  <Outlet />                                                      │
└──────────────────────────────────────────────────────────────────┘
┌─ NavigationBar (bottom) ─────────────────────────────────────────┐
│  [UsersIcon] Clientes   [UserIcon] Contactos                     │
└──────────────────────────────────────────────────────────────────┘
```

### Story 1.1 Learnings (from previous story Dev Agent Record)

- **Package manager**: Use `pnpm` exclusively — NOT npm or yarn
- **TanStack Router plugin**: `@tanstack/router-plugin/vite` is already configured in `vite.config.ts` — it will auto-generate `routeTree.gen.ts` when new route files are saved
- **Root route** (`__root.tsx`): already wraps `<Outlet />` in `<div data-testid="app-root">` — the `_app.tsx` layout will be nested inside this
- **shadcn/ui init was skipped** in Story 1.1 — if `Dialog` or `Breadcrumb` from shadcn are needed in this story, run `npx shadcn@latest add dialog breadcrumb` first
- **Playwright/ATDD tests**: Chromium 1228 CDN is blocked; symlinked chromium-1194 headless shell was used in Story 1.1. The same workaround applies.
- **TypeScript strict mode**: `"strict": true` is active — no `any` types allowed. Use `unknown` or proper type guards.
- **React version**: React 19 is installed (Vite 8 default). Use functional components only.

### Git History Context

Recent commits relevant to this story:
- `feat(story-1.1): implement project initialization` — frontend skeleton with `__root.tsx`, `QueryProvider`, `apiClient`, `queryClient` all created
- `fix(review-1.1): apply code review corrections` — story is done and reviewed

### Existing File Inventory (from Story 1.1)

Files already created that this story builds upon:
- `frontend/src/routes/__root.tsx` — root layout with `<Outlet />` and `data-testid="app-root"`
- `frontend/src/routes/index.tsx` — currently a placeholder (UPDATE to redirect to `/clientes`)
- `frontend/src/main.tsx` — wires `RouterProvider` inside `QueryProvider`
- `frontend/src/routeTree.gen.ts` — auto-generated (do NOT edit manually)
- `frontend/src/shared/lib/apiClient.ts` — Axios singleton
- `frontend/src/shared/lib/queryClient.ts` — TanStack Query singleton
- `frontend/vite.config.ts` — already configured with `@tailwindcss/vite` and `@tanstack/router-plugin/vite`

### Testing Standards

**Framework**: Vitest + React Testing Library + MSW (all installed from Story 1.1)

**Test location**: Co-locate tests with source files (e.g., `src/routes/__tests__/`) OR use `*.test.tsx` suffix alongside the route file.

**Accessibility testing**: Use `@axe-core/react` or RTL's `getByRole` queries to verify ARIA labels and landmark roles. Run axe checks on the rendered navigation components.

**Test data-testid contract**:
- `data-testid="app-shell"` — on the `LayoutBase` wrapper in `_app.tsx`
- `data-testid="clientes-view"` — on the `/clientes` page root element
- `data-testid="contactos-view"` — on the `/contactos` page root element
- `data-testid="not-found-view"` — on the 404 page root element
- `data-testid="app-root"` — already exists on `__root.tsx` (do NOT remove)

**Coverage target**: > 80% for all new files created in this story.

### Security & Performance

- No authentication in MVP — navigation is open
- Bundle budget: the siesa-ui-kit navigation components must not push the total bundle past 500KB gzipped (verify with `pnpm run build` and `vite-bundle-visualizer` if needed)
- No lazy loading required for navigation shell (it is the root layout — always loaded)

### Project Structure Notes

Files to create in this story (aligned with `architecture.md` directory structure):

```
frontend/src/routes/
  _app.tsx                           ← NEW (pathless layout route)
  _app/
    clientes.tsx                     ← NEW (placeholder /clientes view)
    contactos.tsx                    ← NEW (placeholder /contactos view)
  $.tsx  (or similar catch-all)      ← NEW (404 not-found route)
  index.tsx                          ← MODIFY (add redirect to /clientes)
  __tests__/
    app-shell.test.tsx               ← NEW (component tests)
```

No changes to backend, database, or any module outside `src/routes/`.

### References

- Navigation component specs: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- Shell layout (Direction F): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- TanStack Router file-based prefixes: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- Routing decisions: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- FR coverage: FR28, FR29, FR30 — [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- Story 1.1 learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Agent Record]
- Accessibility requirements: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Considerations]
- Responsive breakpoints: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Structure]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Used `LayoutBase` from `siesa-ui-kit` which internally wraps `NavigationRailGroup` for desktop. The `navigationItems` prop accepts `NavigationRailGroupMenuItem[]`.
- `NavigationBar` from `siesa-ui-kit` used for mobile (< 1024px) via `flex lg:hidden` TailwindCSS responsive visibility.
- Active state computed via `useRouterState` hook — `pathname.startsWith('/contactos')` determines `activeId`.
- `aria-current="page"` passed via `active` prop on `NavigationRailGroupMenuItem` items and `activeItemId` on `NavigationBar`.
- `<nav aria-label="Navegación principal">` added explicitly around both desktop (wrapping `Outlet` inside `LayoutBase`) and mobile sections.
- `@heroicons/react` v2.2.0 installed as new dependency.
- siesa-ui-kit CSS imported via `@import "../node_modules/siesa-ui-kit/dist/style.css"` in `index.css` (Vite + TailwindCSS v4 CSS `@import` approach).
- TanStack Router plugin auto-generated `routeTree.gen.ts` on build with all new routes: `/_app`, `/_app/clientes`, `/_app/contactos`, `/`, `/$`.
- Test file renamed to `-app-shell.test.tsx` using `-` prefix to prevent router plugin from warning about non-route exports.
- 19 tests passing, 86.48% branch coverage.

### File List

**Created:**
- `frontend/src/routes/_app.tsx` — Pathless layout route with LayoutBase + NavigationRail (desktop) + NavigationBar (mobile)
- `frontend/src/routes/_app/clientes.tsx` — Placeholder /clientes view
- `frontend/src/routes/_app/contactos.tsx` — Placeholder /contactos view
- `frontend/src/routes/$.tsx` — 404 catch-all route with Spanish message
- `frontend/src/routes/__tests__/-app-shell.test.tsx` — 19 component tests

**Modified:**
- `frontend/src/routes/index.tsx` — Updated to redirect to /clientes via `beforeLoad`
- `frontend/src/index.css` — Added siesa-ui-kit styles import
- `frontend/package.json` — Added `@heroicons/react ^2.2.0`
- `frontend/src/routeTree.gen.ts` — Auto-regenerated by TanStack Router plugin (do not edit manually)
