# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport >= 1024px), **When** the user views the app, **Then** a NavigationRail (siesa-ui-kit) is visible on the left side with "Clientes" and "Contactos" entries, and the active route entry is visually highlighted (FR28).

2. **Given** the application is loaded on a mobile browser viewport (< 1024px), **When** the user views the app, **Then** a NavigationBar (siesa-ui-kit) is displayed at the bottom instead of the rail, and all navigation entries are accessible and tappable (FR29).

3. **Given** the user clicks "Clientes" in the navigation, **When** the click is processed, **Then** the URL changes to `/clientes` and the Clientes placeholder view is rendered WITHOUT a full page reload.

4. **Given** the user clicks "Contactos" in the navigation, **When** the click is processed, **Then** the URL changes to `/contactos` and the Contactos placeholder view is rendered WITHOUT a full page reload.

5. **Given** the user types `/clientes` or `/contactos` directly in the browser address bar and presses Enter, **When** the page loads, **Then** the correct view is rendered with the navigation shell intact — no redirect to a home screen occurs (FR30).

6. **Given** the user navigates to the root path `/`, **When** the page loads, **Then** the router redirects automatically to `/clientes`.

7. **Given** the user navigates to an unknown route (e.g., `/unknown-path`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a user-friendly Spanish message and a link back to `/clientes`.

8. **Given** the navigation shell is rendered, **When** any user interacts with it on any device, **Then** it complies with WCAG 2.1 AA — navigation landmarks are present (`<nav>`), active item has `aria-current="page"`, and all interactive elements are keyboard-accessible.

## Tasks / Subtasks

- [ ] Task 1 — Install missing dependencies (AC: all)
  - [ ] Install TanStack Router and its Vite plugin: `pnpm add @tanstack/react-router && pnpm add -D @tanstack/router-plugin @tanstack/router-devtools`
  - [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
  - [ ] Install siesa-ui-kit: `pnpm add siesa-ui-kit`
  - [ ] Install TanStack Query (needed by later stories, install now per Story 1.1 spec): `pnpm add @tanstack/react-query && pnpm add -D @tanstack/react-query-devtools`
  - [ ] Install Zustand: `pnpm add zustand`
  - [ ] Install Axios: `pnpm add axios`
  - [ ] Install react-loading-skeleton: `pnpm add react-loading-skeleton`
  - [ ] Install Heroicons: `pnpm add @heroicons/react`

- [ ] Task 2 — Configure Vite for TanStack Router + Tailwind (AC: all)
  - [ ] Update `vite.config.ts` to add `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite` plugin
  - [ ] Add `/// <reference types="vitest" />` at the top of `vite.config.ts` if test config is included
  - [ ] Ensure `server.port: 5173` remains set

- [ ] Task 3 — Configure TailwindCSS v4 (AC: all)
  - [ ] Update `src/style.css` (or `src/index.css`) to add `@import "tailwindcss"` as the only Tailwind directive
  - [ ] Verify Siesa brand tokens are applied via Tailwind (`slate-*` for neutrals, primary `#0e79fd`)

- [ ] Task 4 — Set up TanStack Router file-based structure (AC: #3, #4, #5, #6, #7)
  - [ ] Create `src/routes/` directory
  - [ ] Create `src/routes/__root.tsx` — Root route: wraps all routes, imports siesa-ui-kit styles, renders `<Outlet />`. Use `createRootRoute()`.
  - [ ] Create `src/routes/index.tsx` — Index route: redirects to `/clientes` using `redirect({ to: '/clientes' })` in a `beforeLoad` hook.
  - [ ] Create `src/routes/_app.tsx` — Pathless layout route (no URL segment). Renders the AppShell with NavigationRail (desktop) / NavigationBar (mobile) plus `<Outlet />` for child routes. Use `createFileRoute('/_app')`.
  - [ ] Create `src/routes/_app/` directory
  - [ ] Create `src/routes/_app/clientes.tsx` — Route for `/clientes`. Renders a placeholder `<ClientesPlaceholderView />` with `data-testid="clientes-view"`.
  - [ ] Create `src/routes/_app/contactos.tsx` — Route for `/contactos`. Renders a placeholder `<ContactosPlaceholderView />` with `data-testid="contactos-view"`.
  - [ ] Create `src/routes/$notFound.tsx` (or use TanStack Router `notFoundComponent`) — 404 view with Spanish message "Página no encontrada" and link back to `/clientes`.

- [ ] Task 5 — Build AppShell component with siesa-ui-kit NavigationRail / NavigationBar (AC: #1, #2, #3, #4, #8)
  - [ ] Create `src/shared/components/AppShell.tsx`
  - [ ] Check siesa-ui-kit catalog for `NavigationRail` and `NavigationBar` components (mandatory — do NOT create custom nav components if equivalents exist)
  - [ ] Import and use `NavigationRail` from `siesa-ui-kit` for desktop layout (viewport >= 1024px / `lg:` breakpoint)
  - [ ] Import and use `NavigationBar` from `siesa-ui-kit` for mobile layout (viewport < 1024px)
  - [ ] Add navigation items: "Clientes" (icon: `UserGroupIcon` from `@heroicons/react/24/outline`) and "Contactos" (icon: `UserIcon`)
  - [ ] Use TanStack Router's `<Link>` component for navigation items to enable SPA transitions (no full page reloads)
  - [ ] Apply `aria-current="page"` to the active nav item using `useRouterState` or TanStack Router's `<Link activeProps>` API
  - [ ] Layout: Desktop — left rail (fixed width ~72px) + content area fills remaining space. Mobile — bottom bar + content area fills viewport height minus bar.
  - [ ] All user-facing text in Spanish: "Clientes", "Contactos"
  - [ ] Add `<nav>` landmark wrapping the navigation component for WCAG compliance

- [ ] Task 6 — Update `src/main.tsx` to use TanStack Router (AC: all)
  - [ ] Import `RouterProvider` from `@tanstack/react-router`
  - [ ] Import or create a `router` instance using `createRouter({ routeTree })` where `routeTree` is the auto-generated `routeTree.gen.ts`
  - [ ] Wrap the app in `RouterProvider` (and `QueryClientProvider` for future stories)
  - [ ] Remove old `App.tsx` import if it was the only entry point (replace with router-based structure)
  - [ ] Create `src/app/providers/QueryProvider.tsx` — wraps `QueryClientProvider` with a `QueryClient` instance
  - [ ] Create `src/shared/lib/queryClient.ts` — exports singleton `QueryClient` with `staleTime: 60_000`
  - [ ] Create `src/shared/lib/apiClient.ts` — exports Axios instance with `baseURL: import.meta.env.VITE_API_URL`
  - [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`

- [ ] Task 7 — Create placeholder view components (AC: #3, #4)
  - [ ] Create `src/modules/crm/clientes/presentation/ClientesPlaceholderView.tsx` — returns `<div data-testid="clientes-view"><h1>Clientes</h1></div>` (will be replaced in Epic 2)
  - [ ] Create `src/modules/crm/contactos/presentation/ContactosPlaceholderView.tsx` — returns `<div data-testid="contactos-view"><h1>Contactos</h1></div>` (will be replaced in Epic 3)

- [ ] Task 8 — Create NotFound view (AC: #7)
  - [ ] Create `src/shared/components/NotFoundView.tsx` — renders Spanish "Página no encontrada" message with a `<Link to="/clientes">` back link and `data-testid="not-found-view"`

- [ ] Task 9 — Ensure `src/routes` directory structure is created for all module directories (AC: implicit)
  - [ ] Create `src/modules/crm/clientes/domain/`, `src/modules/crm/clientes/application/`, `src/modules/crm/clientes/infrastructure/` directories with `.gitkeep`
  - [ ] Create `src/modules/crm/contactos/domain/`, `src/modules/crm/contactos/application/`, `src/modules/crm/contactos/infrastructure/` directories with `.gitkeep`
  - [ ] Create `src/app/providers/`, `src/infrastructure/` directories with `.gitkeep`

- [ ] Task 10 — Unit/Component tests (AC: all)
  - [ ] Install vitest + RTL + jsdom if not already present: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw`
  - [ ] Create `src/test-setup.ts` with `import '@testing-library/jest-dom'`
  - [ ] Configure `vitest` in `vite.config.ts` (environment: jsdom, setupFiles: test-setup.ts)
  - [ ] Create `src/shared/components/__tests__/AppShell.test.tsx` — test that NavigationRail is rendered on desktop (mock viewport >= 1024px) and NavigationBar on mobile (< 1024px); test ARIA attributes
  - [ ] Create `src/shared/components/__tests__/NotFoundView.test.tsx` — test "Página no encontrada" text and back-link presence
  - [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors after all changes

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit`
- **Install**: `pnpm add siesa-ui-kit`
- **Usage**: You MUST use `NavigationRail` and `NavigationBar` components from `siesa-ui-kit` for the persistent navigation. Do NOT create custom navigation components.
- **Constraint**: Check siesa-ui-kit catalog before any custom UI component. If `NavigationRail`/`NavigationBar` API differs from what is documented here, adapt the implementation to the actual siesa-ui-kit API.
- **Styles**: Import `siesa-ui-kit/dist/styles.css` (or equivalent entry point) in `src/main.tsx` or `src/routes/__root.tsx`.

### Architecture Patterns

- **Routing**: TanStack Router 1+ with file-based routing. The `@tanstack/router-plugin/vite` plugin auto-generates `src/routeTree.gen.ts` from files in `src/routes/`. NEVER manually write `routeTree.gen.ts`.
- **TanStack Router file prefixes** (mandatory conventions):
  - `_` prefix = pathless layout route (e.g., `_app.tsx`) — contributes no URL segment
  - `$` prefix = dynamic param (e.g., `$clienteId.tsx`)
  - `__root.tsx` = root route wrapping all routes
- **Responsive breakpoint**: Use Tailwind's `lg:` (1024px) as the desktop/mobile cutoff — show NavigationRail at `lg+`, NavigationBar below `lg`.
- **Responsive detection**: Use CSS (Tailwind `hidden lg:flex` / `lg:hidden`) rather than JS media queries for show/hide of Rail vs. Bar. This avoids layout flash.
- **Active route detection**: Use TanStack Router `<Link activeProps={{ 'aria-current': 'page', className: 'nav-active' }}>` or `useRouterState` to apply active styles.
- **No full page reloads**: All navigation MUST use TanStack Router `<Link to="...">` — never `<a href="...">`.
- **State**: No Zustand store needed for this story. Navigation state lives in the URL.
- **Typography**: Inter font (Light 300, Regular 400, Bold 700). Brand primary: `#0e79fd`. Neutrals: Tailwind `slate-*`.

### Current Codebase State (Critical Context)

Story 1.1 completion notes describe a richer structure, but the actual files on disk are a minimal Vite scaffold:

- `frontend/src/main.tsx` — uses vanilla `createRoot` with `<App />`, NO RouterProvider
- `frontend/src/App.tsx` — returns a bare `<div data-testid="app-root"><h1>Siesa Agents</h1></div>`
- `frontend/src/style.css` — vanilla CSS, no Tailwind import
- `frontend/vite.config.ts` — only `@vitejs/plugin-react`, NO router plugin, NO Tailwind plugin
- `frontend/package.json` — only React 19 + Vite + TypeScript. NO TanStack Router, NO siesa-ui-kit, NO Tailwind.
- `frontend/tsconfig.json` — strict mode active (`"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`)
- NO `src/routes/` directory exists yet.

**This story must install ALL missing dependencies and create the complete navigation shell from scratch.**

### Project Structure Notes

All files must conform to the architecture defined in `architecture.md`. Key paths for this story:

```
frontend/
└── src/
    ├── main.tsx                              # Modified — add RouterProvider + QueryProvider
    ├── routes/
    │   ├── __root.tsx                        # Root route
    │   ├── index.tsx                         # / → redirect to /clientes
    │   ├── _app.tsx                          # Pathless layout — AppShell with NavigationRail/Bar
    │   └── _app/
    │       ├── clientes.tsx                  # /clientes placeholder
    │       └── contactos.tsx                 # /contactos placeholder
    ├── modules/
    │   └── crm/
    │       ├── clientes/
    │       │   └── presentation/
    │       │       └── ClientesPlaceholderView.tsx
    │       └── contactos/
    │           └── presentation/
    │               └── ContactosPlaceholderView.tsx
    ├── shared/
    │   ├── components/
    │   │   ├── AppShell.tsx                  # NavigationRail/Bar wrapper
    │   │   └── NotFoundView.tsx              # 404 view
    │   └── lib/
    │       ├── apiClient.ts                  # Axios singleton
    │       └── queryClient.ts               # TanStack QueryClient
    └── app/
        └── providers/
            └── QueryProvider.tsx             # QueryClientProvider wrapper
```

**Naming conflicts to avoid:**
- The `_app.tsx` pathless route file MUST be `src/routes/_app.tsx`, NOT inside `src/routes/_app/` — TanStack Router distinguishes between `_app.tsx` (layout) and `_app/` (sub-directory).
- `src/routes/index.tsx` handles `/` root, not `src/routes/__root.tsx` which is the layout wrapper for all routes.

### Testing Standards

- Vitest + React Testing Library — component tests co-located with source: `src/shared/components/__tests__/`
- Accessibility checks with `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveAttribute`)
- Mock viewport for responsive tests using `global.innerWidth` or `window.matchMedia` mock
- All test descriptions in English (code), all user-facing assertions verify Spanish text

### References

- TanStack Router file-based routing: [Source: _bmad-output/planning-artifacts/architecture.md#Routing (TanStack Router file-based)]
- Frontend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure]
- siesa-ui-kit usage mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Routing path definitions: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- FR28 (SPA navigation), FR29 (mobile), FR30 (deep linking): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- UX responsive strategy (NavigationRail desktop / NavigationBar mobile): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Previous story learnings (Story 1.1): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
