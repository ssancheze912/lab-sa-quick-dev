# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list showing every client with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded, **When** the user types any text in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC contain the input string (case-insensitive), and results update in under 1 second even with 500 records (NFR1).

3. **Given** there are no clients in the system (empty array returned by API), **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message in Spanish guiding the user to create the first client; the search field and list container are still rendered but empty.

4. **Given** the backend is unavailable when the page loads (network error or 5xx), **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list; clicking "Reintentar" triggers a new fetch via TanStack Query `refetch`.

5. **Given** the route `/clientes` is accessed, **When** no client is selected, **Then** the right panel remains in an empty/placeholder state (no detail rendered), and the URL stays at `/clientes` without a client ID segment.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Create `clientes` table via EF Core migration (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with properties: `Guid Id` (PK, `Guid.NewGuid()`), `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`. Use private setters + static `Create()` factory pattern.
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with methods: `Task<IEnumerable<ClienteDto>> GetAllAsync()`, `Task<ClienteDto?> GetByIdAsync(Guid id)`.
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`: configure `uk_clientes_nit` unique index on `Nit`, set `not null` on `Nombre`, `Nit`, `Telefono`, `Ciudad`. EF Core auto-maps table name to `clientes` and columns to snake_case via `ApplySnakeCaseNaming()` (no `[Table]`/`[Column]` attributes).
  - [ ] Register `DbSet<ClienteEntity> Clientes` in `AppDbContext.cs`.
  - [ ] Create and run EF Core migration: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
  - [ ] Verify `clientes` table in `siesa_agents_db` with columns: `id` (uuid PK), `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at`.

- [ ] Task 2 — Backend: Implement `GET /api/v1/clientes` query and endpoint (AC: #1, #4)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`: `record ClienteDto(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` (empty marker record) and `GetClientesQueryHandler.cs` that calls `IClienteRepository.GetAllAsync()` and returns `IEnumerable<ClienteDto>`.
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`: `GetAllAsync()` queries `AppDbContext.Clientes` ordered by `CreatedAt` descending, projects to `ClienteDto`.
  - [ ] Register `IClienteRepository` → `ClienteRepository` in DI container in `Program.cs`.
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — map `GET /api/v1/clientes` → calls `GetClientesQueryHandler`, returns `200 OK` with direct array (no wrapper). Wire endpoint registration in `Program.cs`.
  - [ ] Verify API returns `application/json` array with camelCase fields; empty array `[]` when no clients exist.

- [ ] Task 3 — Frontend: Define `Cliente` domain entity and repository interface (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`:
    ```typescript
    export interface Cliente {
      id: string;
      nombre: string;
      nit: string;
      telefono: string;
      ciudad: string;
      createdAt: string; // ISO 8601 with timezone
      updatedAt: string;
    }
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`:
    ```typescript
    export interface IClienteRepository {
      getAll(): Promise<Cliente[]>;
    }
    ```

- [ ] Task 4 — Frontend: Implement infrastructure layer (AC: #1, #4)
  - [ ] Verify `frontend/src/shared/lib/apiClient.ts` Axios instance exists (created in Story 1.1/1.2) with `baseURL: import.meta.env.VITE_API_URL`.
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` implementing `IClienteRepository`:
    ```typescript
    import apiClient from '@/shared/lib/apiClient';
    import type { IClienteRepository } from '../domain/IClienteRepository';
    import type { Cliente } from '../domain/Cliente';

    export const clienteApiRepository: IClienteRepository = {
      getAll: async () => {
        const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes');
        return data;
      },
    };
    ```

- [ ] Task 5 — Frontend: Implement application layer hook `useClientes` (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```typescript
    import { useQuery } from '@tanstack/react-query';
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

    export function useClientes() {
      return useQuery({
        queryKey: ['clientes'],
        queryFn: clienteApiRepository.getAll,
        staleTime: 30_000,
      });
    }
    ```

- [ ] Task 6 — Frontend: Create shared `EmptyState` and `ErrorPanel` components (AC: #3, #4)
  - [ ] Check siesa-ui-kit catalog for empty state and error panel components first; if not available, create custom:
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx`:
    ```typescript
    interface EmptyStateProps { message: string; }
    // Renders centered message with Heroicons `InboxIcon` and Spanish text
    ```
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx`:
    ```typescript
    interface ErrorPanelProps { onRetry: () => void; }
    // Renders error icon + "Ocurrió un error al cargar los datos." + "Reintentar" button
    // All user-facing text in Spanish, WCAG 2.1 AA compliant
    ```

- [ ] Task 7 — Frontend: Create `ClienteListPanel` presentation component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`:
    - Use `useClientes()` hook for server state.
    - Manage `searchQuery: string` with local `useState('')`.
    - Filter clients with `useMemo`: case-insensitive match on `nombre` and `nit`.
    - Render loading state using `react-loading-skeleton` (skeleton screens, not spinners).
    - Render `ErrorPanel` with `onRetry={refetch}` on error state.
    - Render `EmptyState` when data array is empty and no search active.
    - Render scrollable list (280px fixed width, `overflow-y-auto`) with one item per client showing `nombre` and `nit`.
    - Search input: `<input type="search" placeholder="Buscar por nombre o NIT/RUC..." />` with `aria-label` in Spanish.
    - Each list item: keyboard accessible, `role="option"`, highlights active selection.
    - All text labels in Spanish.
  - [ ] Create `frontend/src/shared/components/ClientListItem.tsx`:
    ```typescript
    interface ClientListItemProps {
      cliente: Cliente;
      isActive: boolean;
      onClick: () => void;
    }
    // Renders nombre (bold) + nit (secondary text), Siesa Blue (#0e79fd) highlight when active
    ```

- [ ] Task 8 — Frontend: Wire TanStack Router route `/clientes` (AC: #1, #5)
  - [ ] Verify or create `frontend/src/routes/_app/clientes.tsx` (TanStack Router file-based route):
    - Renders split-panel layout: `ClienteListPanel` (280px left) + right panel placeholder.
    - Right panel shows placeholder text "Selecciona un cliente para ver el detalle" when no client selected.
    - Route stays at `/clientes` with no client ID segment until a client is selected.

- [ ] Task 9 — Frontend: Write unit and component tests (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.test.ts`:
    - Mock `clienteApiRepository.getAll` with MSW.
    - Assert `queryKey: ['clientes']` is used.
    - Test loading, success, and error states.
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx` with RTL:
    - Test: list renders when data present.
    - Test: `EmptyState` shown when array empty.
    - Test: `ErrorPanel` shown on fetch failure, "Reintentar" triggers refetch.
    - Test: filtering by name narrows list.
    - Test: filtering by NIT narrows list.
    - Test: filter is case-insensitive.
    - Include axe accessibility check.
  - [ ] Create `frontend/src/shared/components/EmptyState.test.tsx` and `ErrorPanel.test.tsx` with basic render + snapshot tests.

- [ ] Task 10 — Backend: Write unit tests for `GetClientesQueryHandler` (AC: #1, #4)
  - [ ] Create `tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`:
    - Mock `IClienteRepository`.
    - Test: returns empty list when no clients.
    - Test: returns mapped `ClienteDto` list ordered by `CreatedAt` descending.
    - Test: handler propagates repository exceptions (for middleware to catch).
  - [ ] Create `tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - Test `GET /api/v1/clientes` returns `200 OK` with empty array.
    - Test `GET /api/v1/clientes` returns clients after seeding.
    - Test response is `application/json` with camelCase fields.
    - Use PostgreSQL TestContainers or EF Core InMemory.

## Dev Notes

### Architecture Alignment

This story covers the **read path only** for the `clientes` module (FR1 + FR2). Write operations (Create, Update, Delete) are handled in Stories 2.3–2.5.

Clean Architecture layers for frontend (`src/modules/crm/clientes/`):
- **Domain**: `Cliente.ts` (entity interface), `IClienteRepository.ts` (contract)
- **Application**: `useClientes.ts` (TanStack Query hook, queryKey: `['clientes']`)
- **Infrastructure**: `clienteApiRepository.ts` (Axios implementation)
- **Presentation**: `ClienteListPanel.tsx` (UI component)

Backend layers:
- **Domain**: `ClienteEntity.cs`, `IClienteRepository.cs`
- **Application**: `GetClientesQuery.cs`, `GetClientesQueryHandler.cs`, `ClienteDto.cs`
- **Infrastructure**: `ClienteRepository.cs`, `ClienteConfiguration.cs`, EF Core migration
- **API**: `ClienteEndpoints.cs` (Minimal API — NO controllers)

### Search Implementation (NFR1 — < 1 second with 500 records)

Search is **client-side only** for this MVP (architecture decision: `TanStack Query loads all records on mount`). No `?q=` query parameter is sent to the backend. The API always returns the full list; the frontend filters via `useMemo` in `<50ms` for 500 records.

```typescript
const filtered = useMemo(() =>
  data?.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nit.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [],
  [data, searchQuery]
);
```

### State Management

- **Server state**: TanStack Query (`useClientes`, `queryKey: ['clientes']`) — no Zustand for this story.
- **Search state**: local `useState<string>('')` — does NOT go to URL params (search is ephemeral per session).
- **Selected client**: managed at route level via URL param (`/clientes/$clienteId`) — introduced in Story 2.2.

### UI Implementation Requirements (MANDATORY)

- **Check siesa-ui-kit first** for `EmptyState`, `ErrorPanel`, and list item components before creating custom ones.
- Install: `npm install siesa-ui-kit` (verify package already present from Story 1.1 setup).
- **Loading skeleton**: use `react-loading-skeleton` — skeleton screens, NOT spinners (company standard).
- **Brand colors**: active/selected item highlight → `#0e79fd` (Siesa Blue); secondary text → Tailwind `slate-*` scale.
- **Typography**: Inter font (Light 300, Regular 400, Bold 700).
- All user-facing text MUST be in Spanish: labels, placeholders, ARIA labels, error messages, empty state messages.
- Code (variables, functions, types) in English.
- WCAG 2.1 AA compliance: keyboard navigation for list items, `aria-label` on search input, focus visible rings.

### MasterCrud Note

This story renders a **custom 280px panel list**, NOT a MasterCrud grid view. MasterCrud applies to standard table-based CRUD screens. This layout uses a master-detail split panel per the UX spec — `ClienteListPanel` is a custom scrollable list, not a data grid.

### Backend Enforcement Rules (Mandatory)

- `ClienteEntity.Id`: `Guid` (UUID) — mandatory PK, `Guid.NewGuid()` default.
- `CreatedAt` / `UpdatedAt`: `DateTimeOffset` — NEVER `DateTime`.
- `ApplySnakeCaseNaming()` must be the LAST call in `OnModelCreating` (already in `AppDbContext`).
- Unique index: `uk_clientes_nit` on `Nit` column.
- EF Core auto-maps `ClienteEntity` → table `clientes`, `Nit` → column `nit`, etc.
- `GET /api/v1/clientes` returns direct JSON array (no wrapper object).
- Error responses: Problem Details RFC 7807 via `ExceptionHandlingMiddleware` (already wired in Story 1.3).
- API documentation: Scalar at `/scalar` (already wired — do NOT add Swagger).

### Project Structure Notes

Files to create or verify in this story:

**Backend:**
```
backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_AddClientesTable.cs
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs
tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs
```

**Frontend:**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
frontend/src/modules/crm/clientes/application/useClientes.ts
frontend/src/modules/crm/clientes/application/useClientes.test.ts
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx
frontend/src/shared/components/ClientListItem.tsx
frontend/src/shared/components/EmptyState.tsx
frontend/src/shared/components/EmptyState.test.tsx
frontend/src/shared/components/ErrorPanel.tsx
frontend/src/shared/components/ErrorPanel.test.tsx
frontend/src/routes/_app/clientes.tsx     ← verify/update from Story 1.2 shell
```

**Files to update:**
```
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs   ← add DbSet<ClienteEntity>
backend/src/SiesaAgents.API/Program.cs                        ← register IClienteRepository + ClienteEndpoints
```

### API Contract

```
GET /api/v1/clientes
Response 200 OK — Content-Type: application/json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Empresa Ejemplo S.A.",
    "nit": "900123456-7",
    "telefono": "6011234567",
    "ciudad": "Bogotá",
    "createdAt": "2026-03-12T10:30:00Z",
    "updatedAt": "2026-03-12T10:30:00Z"
  }
]
Response 200 OK — empty array when no clients: []
Response 500 — Problem Details RFC 7807 on server error
```

### References

- Architecture: split-panel layout `ClienteListView` (280px left) + `ClienteDetailView` (right flex) [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- TanStack Query key `['clientes']` and client-side filter strategy [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- `ClienteEntity` fields and EF Core mapping [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- `GET /api/v1/clientes` endpoint contract [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- FR1 (Listar clientes), FR2 (Buscar por nombre/NIT) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1`]
- NFR1 (Búsqueda < 1 segundo con 500 registros) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- AC-E2.2 (búsqueda en < 1 segundo) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria (QA Validation)`]
- EmptyState + ErrorPanel component names [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1`]
- siesa-ui-kit P0 mandatory rule [Source: `_bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied`]
- MasterCrud reference (not applicable for split-panel list view) [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- Company standards: DateTimeOffset, UUID PKs, snake_case DB, Scalar, Problem Details [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
