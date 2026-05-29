# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) shows a scrollable list of all clients with Nombre and NIT/RUC visible per list item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), **And** results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message in Spanish guiding the user to create the first client, **And** no empty list element is rendered.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, **And** clicking "Reintentar" calls the query `refetch` function.

5. **Given** the list is rendered at desktop viewport (>= 1024px), **When** the user views the page, **Then** the left panel has a fixed width of 280px (`w-[280px]`).

## Tasks / Subtasks

- [ ] Task 1 — Create `Cliente` domain entity and `IClienteRepository` interface (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/entities/Cliente.ts` — TypeScript interface with fields: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `updatedAt: string`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/repositories/IClienteRepository.ts` — interface with method `getAll(): Promise<Cliente[]>` and `getById(id: string): Promise<Cliente>`

- [ ] Task 2 — Create Axios API repository implementation (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/repositories/clienteApiRepository.ts` — implements `IClienteRepository` using the singleton `apiClient` (Axios); calls `GET /api/v1/clientes`; return type `Promise<Cliente[]>`
  - [ ] Verify `frontend/src/shared/lib/apiClient.ts` exists with `baseURL: import.meta.env.VITE_API_URL` and default Axios interceptors (created in Story 1.1; create if absent)

- [ ] Task 3 — Create `useClientes` TanStack Query hook (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/hooks/useClientes.ts` — calls `useQuery({ queryKey: ['clientes'], queryFn: () => clienteApiRepository.getAll() })`; exports `{ data, isLoading, isError, refetch }`
  - [ ] `staleTime`: 0 (always fresh on window focus); `retry`: 1

- [ ] Task 4 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.tsx`
    - Fixed width `w-[280px]` left panel, full height, overflow-y-scroll
    - Contains: search `<input>` field with placeholder "Buscar por nombre o NIT/RUC..." (Spanish), list of clients rendered via `ClientListItem`, `EmptyState` when filtered results are empty, `ErrorPanel` on fetch error, `react-loading-skeleton` during `isLoading`
    - Client-side filtering via `useMemo`: `clients.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))`; search state via `useState<string>('')`
    - Accepts optional `onClientSelect?: (id: string) => void` prop; each item triggers navigation via TanStack Router `Link` to `/clientes/$clienteId`
  - [ ] Check siesa-ui-kit for a `ListPanel`, `SearchInput`, or equivalent component before building custom — use kit component if available; fallback to custom Tailwind implementation

- [ ] Task 5 — Create `ClientListItem` shared component (AC: #1, #5)
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — renders a list item showing `nombre` (bold, truncated) and `nit` (secondary text, smaller); active state highlighted with Siesa Blue (`#0e79fd`); accessible (`role="listitem"`, `aria-label` in Spanish)
  - [ ] Check siesa-ui-kit for a list item component before creating custom

- [ ] Task 6 — Create/verify `EmptyState` shared component (AC: #3)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` if not already present — accepts `message: string` prop; renders centered illustration or icon + Spanish message + optional CTA button; accessible
  - [ ] Check siesa-ui-kit for `EmptyState` equivalent before creating custom

- [ ] Task 7 — Create/verify `ErrorPanel` shared component (AC: #4)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` if not already present — accepts `onRetry: () => void` prop; renders error icon + generic Spanish message "No se pudo cargar la información" + "Reintentar" button; accessible
  - [ ] Check siesa-ui-kit for `ErrorPanel` equivalent before creating custom

- [ ] Task 8 — Wire `ClienteListView` into the `/clientes` route (AC: #1–#5)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — replace the `ClientesShellView` placeholder with `ClienteListView` wrapped in a split-panel layout; left panel = `ClienteListView` (280px); right panel = `<Outlet />` placeholder (flex-1) for Story 2.2 detail

- [ ] Task 9 — Unit and component tests (AC: #1–#5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/hooks/useClientes.test.ts` — verify hook returns data, exposes `isLoading`, `isError`, `refetch` with MSW mock for `GET /api/v1/clientes`
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`:
    - TC-E2-P1-01: Real-time search filters list (type "Empresa A", assert filtered results)
    - TC-E2-P1-02: Performance — filter < 1s with 500 records (`performance.now()`)
    - TC-E2-P1-03: EmptyState shown when MSW returns `[]`
    - TC-E2-P1-04: ErrorPanel with "Reintentar" shown on MSW 500 error; click retry calls refetch
    - TC-E2-P3-01: Each list item shows Nombre and NIT/RUC
    - TC-E2-P3-02: Panel has class `w-[280px]` at desktop viewport
  - [ ] All tests pass: `pnpm run test` reports 0 failures

## Dev Notes

### Architecture Overview

Story 2.1 implements the **left panel list** of the split-panel client management view. It is a pure **read + search** story — no create/edit/delete mutations are included. The right panel placeholder is wired but content will be populated by Story 2.2.

**Key architectural decisions from `_bmad-output/planning-artifacts/architecture.md`:**

- **Search strategy:** Client-side `useMemo` filter over the TanStack Query cache. All clients are loaded once on mount via `queryKey: ['clientes']`. Filtering is synchronous in-memory (< 50ms for ≤ 500 records), meeting NFR1 (< 1 second) with a large margin. No additional `GET /api/v1/clientes?q=` endpoint call is made during search.
- **State management:** `searchQuery: string` — local `useState` in `ClienteListView.tsx`. No Zustand store required; URL is the source of truth for selected client (Story 2.2).
- **MasterCrud assessment:** This story does NOT use `MasterCrud`. The architecture explicitly specifies a custom split-panel layout (`ClienteListView` as a 280px panel) with a scrollable list. `MasterCrud` is the orchestrator for full CRUD data grid views with pagination and sidebar/modal forms. Story 2.1 is a list-only read panel — applying `MasterCrud` here would introduce unjustified abstraction. Stories 2.3–2.5 (create/edit/delete) are built atop this list, not inside `MasterCrud`.

### siesa-ui-kit (MANDATORY CHECK)

**Before creating any component**, check the siesa-ui-kit catalog:

```bash
npm install siesa-ui-kit  # ensure dependency present
```

Components to verify in siesa-ui-kit before building custom:
- `EmptyState` — if available, use it directly; pass `message` and optional `ctaLabel` props
- `ErrorPanel` — if available, use it; pass `onRetry` callback
- `ClientListItem` / `ListItem` — if a list item component exists, use and style it
- `SearchInput` — if a search input component exists with the correct API, prefer it

If a siesa-ui-kit equivalent does NOT exist → implement as a custom component in `src/shared/components/` using TailwindCSS v4 + Heroicons + WCAG 2.1 AA compliance.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 — check before creating any component)
- **Install**: `pnpm add siesa-ui-kit` (verify dependency present in `frontend/package.json`)
- **Usage**: Use siesa-ui-kit components for all UI elements where an equivalent exists.
- **Constraint**: Do not create custom components if a siesa-ui-kit equivalent exists.
- **Fallback**: If siesa-ui-kit is unavailable in the registry, document the gap and implement a minimal Tailwind-based equivalent matching the expected API so the swap is non-breaking.

### File Placement

All new files follow Clean Architecture + DDD module structure:

```
frontend/src/
  modules/
    crm/
      clientes/
        domain/
          entities/
            Cliente.ts                    # NEW: entity interface
          repositories/
            IClienteRepository.ts         # NEW: repository contract
        application/
          hooks/
            useClientes.ts                # NEW: TanStack Query hook
            useClientes.test.ts           # NEW: hook unit test
        infrastructure/
          repositories/
            clienteApiRepository.ts       # NEW: Axios implementation
        presentation/
          components/
            ClienteListView.tsx           # NEW: 280px left panel
            ClienteListView.test.tsx      # NEW: component tests
  shared/
    components/
      ClientListItem.tsx                  # NEW: reusable list item
      EmptyState.tsx                      # NEW (if not already exists)
      ErrorPanel.tsx                      # NEW (if not already exists)
    lib/
      apiClient.ts                        # VERIFY exists (from Story 1.1)
  routes/
    _app/
      clientes.tsx                        # UPDATED: mount ClienteListView
```

### Key Code Contracts

**`Cliente` entity interface:**
```typescript
// frontend/src/modules/crm/clientes/domain/entities/Cliente.ts
export interface Cliente {
  id: string;           // UUID
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;    // ISO 8601 with timezone
  updatedAt: string;    // ISO 8601 with timezone
}
```

**TanStack Query key (canonical):**
```typescript
queryKey: ['clientes']   // Array form — NEVER string 'clientes'
```

**`useClientes` hook contract:**
```typescript
// Returns: { data: Cliente[] | undefined, isLoading: boolean, isError: boolean, refetch: () => void }
const { data: clientes = [], isLoading, isError, refetch } = useClientes();
```

**Client-side search filter (`useMemo`):**
```typescript
const filtered = useMemo(() => {
  if (!searchQuery.trim()) return clientes;
  const q = searchQuery.toLowerCase();
  return clientes.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}, [clientes, searchQuery]);
```

**API endpoint called:**
```
GET /api/v1/clientes  →  responds with  Cliente[]  (direct array, no wrapper)
```

**Response shape (from architecture):**
```json
[
  { "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "..." }
]
```

### Testing Requirements

Relevant test cases from `_bmad-output/implementation-artifacts/test-design-epic-2.md`:

| Test Case | Level | Priority | Description |
|-----------|-------|----------|-------------|
| TC-E2-P1-01 | Component | P1 | Real-time search filters list |
| TC-E2-P1-02 | Component/Perf | P1 | Filter < 1s with 500 records |
| TC-E2-P1-03 | Component | P1 | EmptyState shown when `[]` returned |
| TC-E2-P1-04 | Component | P1 | ErrorPanel + "Reintentar" on 500 error |
| TC-E2-P3-01 | Component | P3 | List items show Nombre and NIT/RUC |
| TC-E2-P3-02 | Component | P3 | Left panel is 280px |

**Testing setup:**
- Vitest + @testing-library/react + MSW 2+
- Fresh `QueryClient` per test: `new QueryClient({ defaultOptions: { queries: { retry: false } } })`
- MSW handlers defined per test (not globally)
- For TC-E2-P1-02: pre-load `queryClient` with 500 generated clients via factory

**Anti-patterns to avoid in tests:**
- Do NOT use `wrapper: { retry: true }` — tests must fail fast
- Do NOT use `window.location.reload()` — use `refetch` from the hook
- Do NOT assert on English text — all visible text must be in Spanish

### Constraints from Prior Stories

- Story 1.1 installed base dependencies including `@tanstack/react-router`, `@tanstack/react-query`, `axios`. No reinstallation needed.
- Story 1.2 created `frontend/src/routes/_app.tsx` (pathless layout) and `frontend/src/routes/_app/clientes.tsx` (placeholder). This story UPDATES `clientes.tsx` — the `ClientesShellView` placeholder is replaced with the real `ClienteListView`.
- Story 1.2 debug note: siesa-ui-kit was NOT available in the npm registry. If still unavailable, follow the same fallback pattern: implement custom Tailwind components matching the expected siesa-ui-kit API.
- Story 1.3 created `AppDbContext` + `clientes` table migration with `uk_clientes_nit` unique index. The backend endpoint `GET /api/v1/clientes` may not yet be implemented — Story 2.1 backend task (Task 2) must create `ClienteEndpoints.cs` with at least the `GET /api/v1/clientes` handler.

### Backend Requirement for this Story

While Story 2.1 is primarily a frontend story, it **requires** the `GET /api/v1/clientes` endpoint to be functional. If not yet created, implement the minimal backend needed:

**Backend files to create/verify:**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` + `GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — register `GET /api/v1/clientes` endpoint
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — verify exists from Story 1.3
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — verify `GetAllAsync()` implemented

**Backend response contract:**
```csharp
// GET /api/v1/clientes → 200 OK → ClienteDto[]
// ClienteDto: { Id, Nombre, Nit, Telefono, Ciudad, CreatedAt (DateTimeOffset), UpdatedAt (DateTimeOffset) }
// Serialized as camelCase JSON: { id, nombre, nit, telefono, ciudad, createdAt, updatedAt }
```

### Project-Wide Consistency Rules (from architecture.md)

- All user-facing text MUST be in Spanish (labels, placeholders, error messages, aria-labels)
- Code (variables, functions, classes) MUST be in English
- TypeScript strict mode — NO `any` types
- `DateTimeOffset` only in backend (never `DateTime`)
- Heroicons (primary) for all icons
- TailwindCSS v4 for styling — no inline styles
- Brand primary color: `#0e79fd` (Siesa Blue) — use Tailwind custom color or siesa-ui-kit token
- Loading states: `react-loading-skeleton` (skeleton screens, not spinners)
- Never show `error.message` directly to user — use `ErrorPanel` component

### References

- Search strategy and client-side filter: [Source: `_bmad-output/planning-artifacts/architecture.md#Data Flow Diagram`]
- TanStack Query canonical keys: [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Frontend folder structure: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Folder Structure`]
- FR1 (list clients), FR2 (search by nombre/NIT): [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`]
- NFR1 (search < 1s/500 records): [Source: `_bmad-output/planning-artifacts/architecture.md#Project Context Analysis`]
- Story 2.1 acceptance criteria: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1`]
- Component structure boundaries: [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)`]
- Test cases TC-E2-P1-01 to TC-E2-P1-04, TC-E2-P3-01, TC-E2-P3-02: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md`]
- MasterCrud API contract: [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- Story 1.2 debug notes (siesa-ui-kit availability, route structure): [Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md#Debug Log References`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
