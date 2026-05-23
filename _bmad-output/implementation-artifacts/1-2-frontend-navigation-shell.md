# Story 1.2: Frontend Navigation Shell

Status: ready-for-dev

## Story

As a user,
I want a persistent navigation structure to access the Clientes and Contactos sections of the application,
so that I can move between sections without full page reloads from any device.

## Acceptance Criteria

1. **Given** the application is loaded on a desktop browser (viewport width >= 1024px), **When** the user views the app, **Then** a NavigationRail is visible on the left side with "Clientes" and "Contactos" navigation entries, each with an icon and label.

2. **Given** the application is loaded on a desktop browser, **When** the user clicks the "Clientes" entry in the NavigationRail, **Then** the app navigates to `/clientes` without a full page reload (SPA navigation via TanStack Router) and the "Clientes" item appears visually active/selected (FR28).

3. **Given** the application is loaded on a desktop browser, **When** the user clicks the "Contactos" entry in the NavigationRail, **Then** the app navigates to `/contactos` without a full page reload and the "Contactos" item appears visually active/selected (FR28).

4. **Given** the application is loaded on a mobile browser viewport (width < 1024px), **When** the user views the app, **Then** a NavigationBar is displayed at the bottom instead of the NavigationRail, with "Clientes" and "Contactos" items tappable and accessible (FR29).

5. **Given** a user types `/clientes` directly in the browser URL bar, **When** the page loads, **Then** the ClientesPlaceholderView is rendered and the NavigationRail/NavigationBar shows "Clientes" as active — no redirect to a home screen (FR30).

6. **Given** a user types `/contactos` directly in the browser URL bar, **When** the page loads, **Then** the ContactosPlaceholderView is rendered and the NavigationRail/NavigationBar shows "Contactos" as active — no redirect to a home screen (FR30).

7. **Given** a user navigates to an unknown route (e.g., `/unknown`, `/foo/bar`), **When** the page loads, **Then** a 404 / not-found view is displayed gracefully with a message in Spanish and a link to return to `/clientes`.

8. **Given** the root path `/` is accessed, **When** the page loads, **Then** the user is automatically redirected to `/clientes`.

## Tasks / Subtasks

- [ ] Task 1 — Create `_app` layout route and navigation components (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/routes/_app.tsx` — pathless layout route that renders the shell with NavigationRail (desktop) and NavigationBar (mobile) plus `<Outlet />`
  - [ ] Create `frontend/src/shared/components/NavigationShell.tsx` — responsive wrapper component that renders NavigationRail on `lg:` breakpoint and NavigationBar on smaller viewports using TailwindCSS v4 responsive utilities
  - [ ] In `NavigationShell.tsx`, use `useRouterState` or `useMatchRoute` from `@tanstack/react-router` to determine the active route and apply active styling to the correct nav item
  - [ ] Navigation items: `{ label: 'Clientes', path: '/clientes', icon: UsersIcon }` and `{ label: 'Contactos', path: '/contactos', icon: UserIcon }` — icons from Heroicons (`@heroicons/react/24/outline`)
  - [ ] Install Heroicons: `pnpm add @heroicons/react`
  - [ ] All nav labels MUST be in Spanish: "Clientes", "Contactos"
  - [ ] Apply WCAG 2.1 AA: `aria-label` on nav element, `aria-current="page"` on active item
  - [ ] Apply brand colors: active item uses `#0e79fd` (Siesa Blue / `text-[#0e79fd]` or Tailwind `text-blue-600` as fallback); inactive items use `slate-500`

- [ ] Task 2 — Create `_app/clientes.tsx` and `_app/contactos.tsx` route files (AC: #2, #3, #5, #6)
  - [ ] Create `frontend/src/routes/_app/` directory
  - [ ] Create `frontend/src/routes/_app/clientes.tsx` — exports a TanStack Router `Route` with a `ClientesPlaceholderView` component displaying "Sección Clientes — próximamente" as placeholder content
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — exports a TanStack Router `Route` with a `ContactosPlaceholderView` component displaying "Sección Contactos — próximamente" as placeholder content
  - [ ] Both placeholder views must render content inside the `_app` layout `<Outlet />` so the navigation shell is always visible

- [ ] Task 3 — Configure root route redirect and 404 (AC: #7, #8)
  - [ ] Update `frontend/src/routes/__root.tsx` — root layout now wraps `<Outlet />` (without navigation; navigation is in `_app.tsx` layout)
  - [ ] Create `frontend/src/routes/index.tsx` — redirects from `/` to `/clientes` using TanStack Router `redirect` in `beforeLoad` or a `Navigate` component
  - [ ] Create `frontend/src/routes/$404.tsx` or use `frontend/src/routes/$.tsx` (catch-all) — renders a `NotFoundView` component in Spanish with a link back to `/clientes`

- [ ] Task 4 — Verify `routeTree.gen.ts` auto-generation and TypeScript compilation (AC: #1–#8)
  - [ ] Run `pnpm run build` — verify zero TypeScript errors
  - [ ] Confirm `routeTree.gen.ts` is regenerated by `@tanstack/router-plugin` to include `_app`, `_app/clientes`, `_app/contactos`, `index`, and catch-all routes
  - [ ] Verify dev server at `localhost:5173` navigates correctly between `/clientes` and `/contactos` without full page reloads

- [ ] Task 5 — Unit / component tests (AC: #1–#8)
  - [ ] Create `frontend/src/shared/components/NavigationShell.test.tsx` — test that NavigationRail renders on desktop viewport and NavigationBar on mobile viewport (use RTL `viewport` resize or `window.innerWidth` mock)
  - [ ] Test that clicking "Clientes" nav item calls TanStack Router navigation to `/clientes`
  - [ ] Test that clicking "Contactos" nav item calls TanStack Router navigation to `/contactos`
  - [ ] Test `aria-current="page"` is set correctly on the active nav item
  - [ ] Run accessibility check with `@axe-core/react` or `jest-axe` on `NavigationShell` (WCAG 2.1 AA)

## Dev Notes

### Architecture Patterns

This story implements the **shell layout pattern** using TanStack Router's pathless layout routes (`_` prefix = no URL segment contribution). The `_app.tsx` route acts as the authenticated/application shell layout — it owns the navigation chrome and renders child routes via `<Outlet />`.

**Route tree after this story:**
```
__root.tsx            → Root HTML shell (QueryProvider, body div)
├── index.tsx         → Redirect → /clientes
├── _app.tsx          → Shell layout (NavigationRail + NavigationBar + Outlet)
│   ├── _app/clientes.tsx     → /clientes (placeholder)
│   └── _app/contactos.tsx    → /contactos (placeholder)
└── $.tsx             → Catch-all 404 view
```

### TanStack Router — File-Based Routing Rules

- `_app.tsx` (underscore prefix) = **pathless layout route** — does NOT add `/app` to the URL
- `_app/clientes.tsx` = route at path `/clientes` nested inside `_app` layout
- `_app/contactos.tsx` = route at path `/contactos` nested inside `_app` layout
- `$.tsx` = catch-all route for 404 handling
- `index.tsx` = root index route (path `/`)
- `routeTree.gen.ts` is **auto-generated** by `@tanstack/router-plugin/vite` — never edit manually

**Redirect pattern (index.tsx):**
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/clientes' })
  },
})
```

**Active link detection:**
```typescript
import { Link, useRouterState } from '@tanstack/react-router'
// Option A: use <Link activeProps={{ className: 'text-[#0e79fd]' }} to="/clientes">
// Option B: useRouterState to check pathname and apply conditional styling
```

**Catch-all 404 ($.tsx):**
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFoundView,
})
```

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check the siesa-ui-kit catalog for `NavigationRail` and `NavigationBar` components **before** creating any custom navigation component.
- **Install**: `pnpm add siesa-ui-kit` (dependency listed in package.json from Story 1.1 but not installed due to private registry; verify registry access or build custom component as fallback).
- **Fallback rule**: If `siesa-ui-kit` `NavigationRail`/`NavigationBar` components are not available, build custom components using **shadcn/ui** primitives + TailwindCSS v4. Do NOT create bespoke styles without first checking both sources.
- **Icons**: Heroicons (`@heroicons/react/24/outline`) — primary icon source per company standards.
- **Typography**: Inter font (already imported via `style.css`). Nav labels: Regular 400 weight.
- **Brand colors**: Primary `#0e79fd` (active state), Neutrals `slate-500` (inactive), `slate-100` (hover background).
- **Dark mode**: Apply `dark:` variants for background and text — `dark:bg-slate-900`, `dark:text-slate-100`.
- MasterCrud does NOT apply to this story — navigation shell has no CRUD screens or data grids.

### Responsive Breakpoints (TailwindCSS v4)

The critical breakpoint for desktop vs mobile navigation is `lg` (1024px), as defined in `architecture.md` (Direction F):

```tsx
// NavigationShell.tsx sketch
<>
  {/* Desktop: NavigationRail — visible lg and above */}
  <aside className="hidden lg:flex lg:flex-col ...">
    {/* NavigationRail items */}
  </aside>

  {/* Mobile: NavigationBar — visible below lg */}
  <nav className="fixed bottom-0 left-0 right-0 flex lg:hidden ...">
    {/* NavigationBar items */}
  </nav>
</>
```

### Previous Story Learnings (from Story 1.1)

- **Package manager**: `pnpm` exclusively — never `npm` or `yarn`.
- **siesa-ui-kit**: Private registry may not be accessible in CI/CD; plan a fallback or stub if unavailable.
- **`__root.tsx`** already exists with `data-testid="app-root"` wrapper — preserve this attribute for E2E tests.
- **`routeTree.gen.ts`** is auto-generated by `@tanstack/router-plugin` on `pnpm run build` or `pnpm run dev` — do NOT commit manual edits to this file.
- **TailwindCSS v4**: imported via `@import "tailwindcss"` in `src/style.css` (not `tailwind.config.js` directives). Use utility classes directly.
- **All user-facing text in Spanish**: button labels, nav item labels, placeholder text, error messages, ARIA labels.
- **TypeScript strict mode**: `"strict": true` in `tsconfig.app.json` — no `any` types allowed.
- Dead template files (`hero.png`, `typescript.svg`, `vite.svg`) flagged for cleanup — remove them in this story's commit as per code-review recommendation.

### Git History Context

Recent commits pattern: `feat(epic-N/story-N.M): ...` for features, `fix(story-N.M): ...` for fixes, `test(epic-N/story-N.M): ...` for tests. Follow the same convention.

### Non-Functional Requirements

- **WCAG 2.1 AA**: `<nav>` element with `aria-label="Navegación principal"`, `aria-current="page"` on active item, focus-visible ring on all interactive elements.
- **Bundle budget**: < 500KB gzipped. Heroicons are tree-shakeable — import only used icons (e.g., `import { UsersIcon } from '@heroicons/react/24/outline'`).
- **No authentication in MVP** — navigation shell has no auth guards.

### Project Structure Notes

Files to create in this story:

**New files:**
- `frontend/src/routes/index.tsx` — root redirect to `/clientes`
- `frontend/src/routes/_app.tsx` — pathless shell layout route
- `frontend/src/routes/_app/clientes.tsx` — `/clientes` route (placeholder)
- `frontend/src/routes/_app/contactos.tsx` — `/contactos` route (placeholder)
- `frontend/src/routes/$.tsx` — catch-all 404 route
- `frontend/src/shared/components/NavigationShell.tsx` — responsive nav component
- `frontend/src/shared/components/NavigationShell.test.tsx` — component tests

**Modified files:**
- `frontend/src/routes/__root.tsx` — update to NOT include navigation (move to `_app.tsx`); keep `data-testid="app-root"`
- `frontend/src/routeTree.gen.ts` — auto-regenerated by TanStack Router plugin (do not edit manually)
- `frontend/src/assets/` — remove dead template files (`hero.png`, `typescript.svg`, `vite.svg`) per code-review recommendation from Story 1.1

### References

- Route architecture and file naming: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Complete project directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- TanStack Router prefixes (`_` = pathless layout, `$` = dynamic param, catch-all `$.tsx`): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- Responsive layout breakpoint (lg: 1024px) and NavigationRail/NavigationBar: [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified]
- Brand colors and typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- Epic source and story acceptance criteria: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.2]
- Previous story learnings: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Dev Notes]
- UI kit mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
