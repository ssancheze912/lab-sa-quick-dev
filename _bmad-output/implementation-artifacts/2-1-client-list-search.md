# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px wide) renders a scrollable list of all clients, displaying Nombre and NIT/RUC per item.

2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a Spanish message guiding the user to create the first client.

4. **Given** the backend is unavailable when the page loads, **When** the GET `/api/v1/clientes` fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, and clicking "Reintentar" triggers a `refetch()`.

5. **Given** the client list is loaded, **When** the user clears the search field, **Then** all clients are shown again without triggering a new API call.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Define `ClienteEntity` and `IClienteRepository` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — fields: `Id` (Guid, `= Guid.NewGuid()`), `Nombre` (string), `Nit` (string), `Telefono` (string), `Ciudad` (string), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset). Private constructor + static `Create()` factory.
  - [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — methods: `GetAllAsync()`, `GetByIdAsync(Guid id)`, `AddAsync(ClienteEntity)`, `UpdateAsync(ClienteEntity)`, `DeleteAsync(Guid id)`, `ExistsByNitAsync(string nit)`.

- [ ] Task 2 — Backend: EF Core configuration and migration for `clientes` table (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — implements `IEntityTypeConfiguration<ClienteEntity>`. Set `ToTable("clientes")`, configure `uk_clientes_nit` unique index on `Nit`. `ApplySnakeCaseNaming()` via `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder` (already registered in Story 1.3).
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`.
  - [ ] Run `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`.
  - [ ] Apply migration with `dotnet ef database update`.

- [ ] Task 3 — Backend: Application layer — GetClientes Query (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` and `GetClientesQueryHandler.cs`.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — fields: `Id` (Guid), `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` (DateTimeOffset). All fields non-nullable strings.
  - [ ] `GetClientesQueryHandler` calls `IClienteRepository.GetAllAsync()` and maps to `List<ClienteDto>`.

- [ ] Task 4 — Backend: Infrastructure — `ClienteRepository` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`.
  - [ ] `GetAllAsync()` returns all rows ordered by `CreatedAt` descending (default order for the API — frontend sort overrides client-side).
  - [ ] Register `IClienteRepository → ClienteRepository` as scoped in `Program.cs`.

- [ ] Task 5 — Backend: Minimal API endpoint `GET /api/v1/clientes` (AC: #1)
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`.
  - [ ] Register `GET /api/v1/clientes` that invokes `GetClientesQueryHandler` and returns `200 OK` with `ClienteDto[]` (direct array, no wrapper object).
  - [ ] Register endpoint group in `Program.cs` via `app.MapGroup("/api/v1")`.

- [ ] Task 6 — Backend: xUnit integration tests for GET endpoint (AC: #1, #2)
  - [ ] `TC-E2-P2-01`: Seed 3 clients → GET `/api/v1/clientes` → assert 200, JSON array, each item has `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 with timezone).
  - [ ] `TC-E2-P2-02`: GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000` (not-found, only after `GET /:id` endpoint exists in Task 5 extension) → 404 Problem Details.
  - [ ] Use `WebApplicationFactory<Program>` + TestContainers (Postgres).

- [ ] Task 7 — Frontend: Domain entity and repository interface (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; }`.
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`.

- [ ] Task 8 — Frontend: Infrastructure — `clienteApiRepository` (AC: #1)
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`.
  - [ ] Uses `apiClient` (Axios singleton at `src/shared/lib/apiClient.ts`) — `GET /api/v1/clientes` returns `Cliente[]`.
  - [ ] Export `clienteApiRepository` singleton implementing `IClienteRepository`.

- [ ] Task 9 — Frontend: Application — `useClientes` hook (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`.
  - [ ] Uses `useQuery` from TanStack Query with `queryKey: ['clientes']` and `queryFn: () => clienteApiRepository.getAll()`.
  - [ ] Exports `{ data, isLoading, isError, refetch }`.

- [ ] Task 10 — Frontend: Shared components — `EmptyState` and `ErrorPanel` (AC: #3, #4)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` — accepts `message: string` prop. Renders Spanish guidance text. Check siesa-ui-kit for equivalent before building custom.
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void` prop. Renders an error message and "Reintentar" button. Check siesa-ui-kit for equivalent before building custom.
  - [ ] Both components must pass WCAG 2.1 AA accessibility checks (axe).

- [ ] Task 11 — Frontend: Presentation — `ClienteListView` component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`.
  - [ ] Uses `useClientes()` hook.
  - [ ] Renders a 280px-wide scrollable panel.
  - [ ] Each list item displays `nombre` and `nit` — use siesa-ui-kit list item component if available, otherwise custom `ClientListItem.tsx` at `src/shared/components/`.
  - [ ] Includes a search `<input>` with Spanish placeholder ("Buscar por nombre o NIT/RUC...").
  - [ ] Client-side filter via `useMemo`: `clients.filter(c => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q))` — NO additional API calls on search.
  - [ ] Renders `EmptyState` when `data` is `[]` and `isLoading` is false.
  - [ ] Renders `ErrorPanel onRetry={refetch}` when `isError` is true.
  - [ ] Uses `react-loading-skeleton` for loading skeleton (skeleton screen, not spinner).
  - [ ] All user-facing text in Spanish.

- [ ] Task 12 — Frontend: Route integration (AC: #1)
  - [ ] Verify `frontend/src/routes/_app/clientes.tsx` renders `ClienteListView` in the left panel (280px) — this file was created in Story 1.2. If not present, create it.
  - [ ] Route exports a TanStack Router `Route` component. The `ClienteListView` occupies the left split panel.

- [ ] Task 13 — Frontend: Vitest + RTL component tests (AC: #1–#5)
  - [ ] `TC-E2-P1-01`: Render `ClienteListView` with MSW returning 3 clients → assert 3 items visible, each showing `nombre` and `nit`.
  - [ ] `TC-E2-P1-02`: Search by Nombre — render with 5 clients, type "Acme" → assert only 2 "Acme*" clients visible, no extra fetch.
  - [ ] `TC-E2-P1-03`: Search by NIT/RUC — type partial NIT → assert only matching client visible.
  - [ ] `TC-E2-P1-04`: MSW returns `[]` → assert `EmptyState` present with guidance message.
  - [ ] `TC-E2-P1-05`: MSW returns 500 → assert `ErrorPanel` with "Reintentar" button; click → assert refetch triggered.
  - [ ] `TC-E2-P2-06` (performance): Generate 500 mock clients, render, measure `useMemo` filter render time < 150ms.
  - [ ] `TC-E2-P3-04`: Render `useClientes()` hook with MSW returning 2 clients → assert `data` is `Cliente[]` with correct fields.
  - [ ] Co-locate tests: `ClienteListView.test.tsx` alongside `ClienteListView.tsx`, `useClientes.test.ts` alongside `useClientes.ts`.

## Dev Notes

### Architecture Patterns

This story implements the read side (Query + GET endpoint) of the `clientes` CRUD. It establishes the foundation for Stories 2.2–2.6 which add the detail view, create/edit/delete operations.

**Clean Architecture layers touched:**

| Layer | Frontend | Backend |
|-------|---------|---------|
| Domain | `Cliente.ts`, `IClienteRepository.ts` | `ClienteEntity.cs`, `IClienteRepository.cs` |
| Application | `useClientes.ts` | `GetClientesQuery.cs`, `GetClientesQueryHandler.cs`, `ClienteDto.cs` |
| Infrastructure | `clienteApiRepository.ts` | `ClienteRepository.cs`, `ClienteConfiguration.cs`, migration |
| Presentation | `ClienteListView.tsx`, `EmptyState.tsx`, `ErrorPanel.tsx` | `ClienteEndpoints.cs` |

**Key patterns from architecture.md:**

- TanStack Query key: `['clientes']` — used for all list operations across Epic 2.
- Client-side search: `useMemo` filter over `['clientes']` cache — ZERO backend query params for search in this story (`?q=` is deferred to post-MVP).
- Mutation invalidation (used in stories 2.3–2.5): `queryClient.invalidateQueries({ queryKey: ['clientes'] })` — ensure `queryKey` matches exactly.
- Error handling frontend: Never show raw `error.message`. Use `<ErrorPanel onRetry={refetch} />` for load failures (Toast is for mutation failures).
- Error handling backend: `ExceptionHandlingMiddleware` (Story 1.3) already handles unhandled exceptions → Problem Details RFC 7807.

### Entity Design — Backend

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    // Required by EF Core
    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        // Domain validation: non-empty strings enforced by FluentValidation at Application layer
        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
```

**CRITICAL — DateTimeOffset:** NEVER use `DateTime`. Always `DateTimeOffset` for `CreatedAt`/`UpdatedAt`.

### Database Schema

```sql
-- Table: clientes
-- PK: id (uuid, default uuidv7() or gen_random_uuid())
-- EF Core ApplySnakeCaseNaming() auto-converts PascalCase → snake_case
-- Result: id, nombre, nit, telefono, ciudad, created_at, updated_at

-- Unique index: uk_clientes_nit
-- No FK constraints in this story (contacts FK added in Epic 3)
```

EF Core `ClienteConfiguration.cs`:
```csharp
builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
```

### Frontend — Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
  });
}
```

### Frontend — Search Filter Pattern

```typescript
// Inside ClienteListView.tsx
const [searchQuery, setSearchQuery] = useState('');

const filteredClientes = useMemo(() => {
  if (!data) return [];
  const q = searchQuery.toLowerCase().trim();
  if (!q) return data;
  return data.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}, [data, searchQuery]);
```

No URL search param for the query string in this story — `searchQuery` is purely local component state per architecture decision (NFR1: client-side filter).

### Frontend — Loading Skeleton

```typescript
import Skeleton from 'react-loading-skeleton';
// Render when isLoading === true:
// <Skeleton count={5} height={56} /> (skeleton screen, not spinner)
```

### UI Components Checklist

- **siesa-ui-kit first**: Check siesa-ui-kit for a list item component, empty state component, and error/retry panel before building custom. Install: `npm install siesa-ui-kit`.
- **shadcn/ui fallback**: If siesa-ui-kit lacks the component, check shadcn/ui via the shadcn MCP.
- **Custom last resort**: Build custom only if neither kit has an equivalent.
- All custom components live at `frontend/src/shared/components/`.

### Project Structure Notes

New files created in this story (relative to repo root):

**Backend:**
```
backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
backend/src/SiesaAgents.Infrastructure/Migrations/<timestamp>_AddClientesTable.cs  (generated)
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/  (integration tests)
```

**Frontend:**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
frontend/src/modules/crm/clientes/application/useClientes.ts
frontend/src/modules/crm/clientes/application/useClientes.test.ts
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx
frontend/src/shared/components/EmptyState.tsx
frontend/src/shared/components/ErrorPanel.tsx
```

**Alignment with architecture.md:**
- Route `frontend/src/routes/_app/clientes.tsx` was scoped for Story 1.2 (navigation shell). Verify it exists and references `ClienteListView`. If absent, create it in this story.
- `frontend/src/shared/lib/apiClient.ts` was created in Story 1.2 — reuse the Axios singleton.
- `frontend/src/shared/lib/queryClient.ts` was created in Story 1.2 — reuse the QueryClient.

### Testing Notes from test-design-epic-2.md

Test cases scoped to Story 2.1 (must pass before story can be marked Done):

**P1 — Required:**
- TC-E2-P1-01: List renders Nombre + NIT per item
- TC-E2-P1-02: Real-time search filters by Nombre (no extra fetch)
- TC-E2-P1-03: Real-time search filters by NIT/RUC
- TC-E2-P1-04: EmptyState shown when `[]`
- TC-E2-P1-05: ErrorPanel + "Reintentar" on fetch failure

**P2 — Required before epic closes:**
- TC-E2-P2-01: Backend GET `/api/v1/clientes` returns array of `ClienteDto`
- TC-E2-P2-06: Filter 500 records < 150ms

**P3 — Nice to have:**
- TC-E2-P3-04: `useClientes` hook returns typed `Cliente[]`

**Testing tooling:** Vitest + RTL + MSW (frontend), xUnit + WebApplicationFactory + TestContainers Postgres (backend).

### Previous Story Learnings (from Story 1.3)

- `UseSnakeCaseNamingConvention()` is registered on `DbContextOptionsBuilder` in `Program.cs`, NOT inside `OnModelCreating`. Do not call `modelBuilder.ApplySnakeCaseNaming()` directly — use the EFCore.NamingConventions extension method on the options builder.
- `ExceptionHandlingMiddleware` is already in place (Story 1.3). Domain-level exceptions thrown from command handlers will be caught and returned as Problem Details. Ensure `ClienteNotFoundException` (for GET by ID) returns 404 and `NitAlreadyExistsException` returns 409 (set up in Story 2.3).
- `WriteAsJsonAsync` overrides `Content-Type` to `application/json` — use `JsonSerializer.SerializeToUtf8Bytes` + explicit header to preserve `application/problem+json; charset=utf-8`.
- `Content-Type: application/problem+json` must be set explicitly — the middleware from Story 1.3 already does this; do not override it.

### Non-Functional Requirements Coverage

| NFR | Strategy in this story |
|-----|------------------------|
| NFR1 — Search < 1s (500 records) | `useMemo` client-side filter — < 50ms for 500 records (TC-E2-P2-06) |
| NFR6 — No stack traces | `ExceptionHandlingMiddleware` (Story 1.3) covers this — no additional work needed |
| NFR11 — No hardcoded limits | `IClienteRepository.GetAllAsync()` returns all records — no hardcoded `LIMIT` |

### API Contract

```
GET /api/v1/clientes
  → 200 OK
  → Content-Type: application/json
  → Body: ClienteDto[] (direct array, no wrapper object)

ClienteDto shape (JSON/camelCase — auto-serialized by .NET):
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Acme Corp",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z"
}
```

### Enforcement Anti-Patterns to Avoid

```
❌ DateTime in ClienteEntity     → use DateTimeOffset
❌ Swagger/OpenAPI registration  → Scalar only (app.MapScalarApiReference())
❌ String queryKey               → always array: ['clientes']
❌ English UI text               → Spanish mandatory (placeholder, empty state message, error text)
❌ Search via API query param    → client-side useMemo filter only in this story
❌ Spinner for loading           → react-loading-skeleton skeleton screens only
❌ exposing error.message in UI  → use <ErrorPanel> component
❌ Custom component before kit   → check siesa-ui-kit first, then shadcn, then custom
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story-2.1`
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — sections: Data Architecture, Frontend Architecture, Structure Patterns, API & Communication Patterns, Enforcement Guidelines
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — Story 2.1 test cases (TC-E2-P1-01–05, TC-E2-P2-01, TC-E2-P2-06, TC-E2-P3-04)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md`
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — NOTE: MasterCrud is NOT used in this story. Story 2.1 implements a custom `ClienteListView` panel (280px split panel with search), not a MasterCrud grid. MasterCrud applies to full CRUD grid screens — evaluate for future epic screens.
- Previous story (learning source): `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
