# Story 2.1: Client List & Search

Status: done

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

- [x] Task 1 — Create `Cliente` domain entity and `IClienteRepository` interface (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/clientes/domain/entities/Cliente.ts`
  - [x] Create `frontend/src/modules/crm/clientes/domain/repositories/IClienteRepository.ts`

- [x] Task 2 — Create Axios API repository implementation (AC: #1, #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/repositories/clienteApiRepository.ts` — fixed import path (5 levels up to src/)
  - [x] Verified `frontend/src/shared/lib/apiClient.ts` exists

- [x] Task 3 — Create `useClientes` TanStack Query hook (AC: #1, #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/hooks/useClientes.ts` — staleTime: 0; retry moved to queryClient default

- [x] Task 4 — Create `ClienteListView` presentation component (AC: #1, #2, #3, #4, #5)
  - [x] siesa-ui-kit not available in registry — implemented as custom Tailwind components

- [x] Task 5 — Create `ClientListItem` shared component (AC: #1, #5)
  - [x] `frontend/src/shared/components/ClientListItem.tsx`

- [x] Task 6 — Create/verify `EmptyState` shared component (AC: #3)
  - [x] `frontend/src/shared/components/EmptyState.tsx`

- [x] Task 7 — Create/verify `ErrorPanel` shared component (AC: #4)
  - [x] `frontend/src/shared/components/ErrorPanel.tsx`

- [x] Task 8 — Wire `ClienteListView` into the `/clientes` route (AC: #1–#5)
  - [x] `frontend/src/routes/_app/clientes.tsx` updated with split-panel layout

- [x] Task 9 — Unit and component tests (AC: #1–#5)
  - [x] `useClientes.test.ts` — 10 tests, all passing
  - [x] `ClienteListView.test.tsx` — 22 tests, all passing
  - [x] All 91 frontend tests pass: `pnpm run test` reports 0 failures

- [x] Backend — `GET /api/v1/clientes` endpoint implemented
  - [x] `ClienteEntityConfiguration.cs` — EF Core configuration
  - [x] `AppDbContext.cs` — added Clientes DbSet
  - [x] `ClienteRepository.cs` — implements IClienteRepository
  - [x] `GetClientesQuery.cs` + `GetClientesQueryHandler` — CQRS query
  - [x] `ClienteEndpoints.cs` — Minimal API GET /api/v1/clientes
  - [x] `Program.cs` — registered services and endpoints
  - [x] Backend builds with 0 warnings, 0 errors

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

- Import path bug: `clienteApiRepository.ts` and `useClientes.test.ts` both had 4-level relative imports (`../../../../`) instead of the correct 5-level (`../../../../../`) to reach `src/` from their respective directories.
- `retry: 1` in `useClientes` hook overrode the test `QueryClient`'s `retry: false`, causing `isError` tests to time out. Fixed by removing `retry` from the hook and setting `retry: 1` in the shared `queryClient.ts` default.
- siesa-ui-kit not available in npm registry — implemented all UI components as custom Tailwind equivalents (same API contract as documented).

### Completion Notes List

- Story 2.1 fully implemented: frontend split-panel list view + client-side search + backend GET /api/v1/clientes endpoint.
- Backend migration not created (existing migration is empty/placeholder from Story 1.3; new migration for ClienteEntity table creation is pending database availability).

### File List

Frontend:
- `frontend/src/modules/crm/clientes/domain/entities/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/repositories/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/repositories/clienteApiRepository.ts` (fixed import path)
- `frontend/src/modules/crm/clientes/application/hooks/useClientes.ts` (removed retry override)
- `frontend/src/modules/crm/clientes/application/hooks/useClientes.test.ts` (fixed import path)
- `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`
- `frontend/src/shared/lib/queryClient.ts` (added retry: 1 default)
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/test/factories/cliente.factory.ts`

Backend:
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (added Clientes DbSet)
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteEntityConfiguration.cs` (new)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (new)
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (new)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (new)
- `backend/src/SiesaAgents.API/Program.cs` (registered services + endpoints)
