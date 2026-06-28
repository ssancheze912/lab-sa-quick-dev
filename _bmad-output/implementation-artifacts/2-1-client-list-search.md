# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px fixed width) renders a scrollable list of all clients, with each item displaying `Nombre` and `NIT/RUC` visible.

2. **Given** the client list is loaded, **When** the user types any text in the search field, **Then** the list filters in real time (client-side, no API call) showing only clients whose `Nombre` or `NIT/RUC` match the input, and results appear in under 1 second for up to 500 records (NFR1).

3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` component is displayed with a message guiding the user to create the first client, and no list items are rendered.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails (any HTTP error or network error), **Then** an `ErrorPanel` component is displayed with a "Reintentar" button instead of the list, and clicking "Reintentar" triggers a new fetch.

5. **Given** the client list is loaded, **When** no search text is entered, **Then** all clients are shown in the default sort order (most recent first, i.e., `createdAt` descending).

## Tasks / Subtasks

- [ ] Task 1 — Backend: Add `ClienteEntity`, EF Core config, migration, and `GET /api/v1/clientes` endpoint (AC: #1, #2, #3, #4)
  - [ ] Create `src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — Guid Id, string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt (static `Create()` factory)
  - [ ] Create `src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken)` + `Task<ClienteEntity?> GetByIdAsync(Guid, CancellationToken)`
  - [ ] Create `src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` — `IEntityTypeConfiguration<ClienteEntity>`, sets `uk_clientes_nit` unique index, table name `clientes`
  - [ ] Add `DbSet<ClienteEntity> Clientes` to `AppDbContext.cs`; apply `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())` before `ApplySnakeCaseNaming()` (keep `ApplySnakeCaseNaming()` as the LAST call)
  - [ ] Create `src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` + `GetClientesQueryHandler.cs` — returns `IReadOnlyList<ClienteDto>`
  - [ ] Create `src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — `{ Guid Id, string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt }`
  - [ ] Create `src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository` using `AppDbContext`; register in DI
  - [ ] Create `src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — `GET /api/v1/clientes` → calls `GetClientesQueryHandler`, returns direct JSON array, 200 OK
  - [ ] Run EF Core migration: `dotnet ef migrations add AddClienteEntity --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`; run `dotnet ef database update`
  - [ ] Register `ClienteEndpoints` in `Program.cs`

- [ ] Task 2 — Frontend: Domain + Application layers for clientes (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface: `{ id: string; nombre: string; nit: string; telefono: string; ciudad: string; createdAt: string; updatedAt: string }`
  - [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — interface with `getAll(): Promise<Cliente[]>`
  - [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implements `IClienteRepository` using `apiClient` (`GET /api/v1/clientes`)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook: `queryKey: ['clientes']`, `queryFn` calls `clienteApiRepository.getAll()`, `staleTime: 0`
  - [ ] Create `frontend/src/shared/lib/apiClient.ts` (if not already present from Epic 1) — Axios instance with `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'`

- [ ] Task 3 — Frontend: Presentation layer — ClienteListView (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Uses `useClientes()` hook
    - `isLoading` state: renders skeleton placeholders (`react-loading-skeleton`) for 5 items (Heroicons MagnifyingGlassIcon for search area placeholder)
    - `isError` state: renders `<ErrorPanel onRetry={refetch} />` (see Task 5)
    - Empty data (`data.length === 0`): renders `<EmptyState />` (see Task 5)
    - Populated: renders search input + scrollable list of `<ClienteListItem>` components
    - Search: local `useState<string>` for `searchQuery`; filter via `useMemo` on `data` array matching `nombre` or `nit` (case-insensitive, trimmed)
    - Fixed width: `w-[280px]` Tailwind class; `overflow-y-auto` for scroll
    - All visible text in Spanish: placeholder `"Buscar por nombre o NIT/RUC..."`, heading `"Clientes"`
  - [ ] Create `frontend/src/shared/components/ClienteListItem.tsx` — renders `nombre` (bold) and `nit` (muted); highlights active selection with `slate-100` background; accessible `role="button"` with `tabIndex={0}`

- [ ] Task 4 — Frontend: Route wiring at `/clientes` (AC: #1)
  - [ ] Create/verify `frontend/src/routes/_app/clientes.tsx` — renders `<ClienteListView />` in the 280px left panel; right panel placeholder for Story 2.2
  - [ ] Ensure `__root.tsx` layout includes the route in the navigation rail with label `"Clientes"` (Spanish)

- [ ] Task 5 — Frontend: Shared UI components (AC: #3, #4)
  - [ ] Create `frontend/src/shared/components/EmptyState.tsx` — accepts `title: string`, `description?: string`, `action?: ReactNode`; default usage for clientes: title `"Sin clientes"`, description `"Crea el primer cliente para comenzar."`, action = "Nuevo cliente" button (wired in Story 2.3)
  - [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — accepts `onRetry: () => void`; shows error icon (Heroicons `ExclamationCircleIcon`) + message `"No se pudieron cargar los clientes."` + button `"Reintentar"` calling `onRetry`

- [ ] Task 6 — Tests (AC: #1, #2, #3, #4, #5) — aligned with test-design-epic-2.md
  - [ ] **Backend unit — P2**: `CreateClienteRequestValidator` rejects null Nombre, NIT, Telefono, Ciudad (4 xUnit tests) [Note: validator created here as foundation for Story 2.3; validator file itself belongs to Task 1 setup]
  - [ ] **Backend API — P0**: `GET /api/v1/clientes` returns 200 + JSON array (xUnit, WebApplicationFactory + Testcontainers)
  - [ ] **Backend API — P3**: `uk_clientes_nit` unique index exists in `information_schema` (xUnit integration)
  - [ ] **Frontend unit — P2**: `clienteSchema` (Zod) rejects empty NIT, accepts valid NIT formats (3 Vitest tests)
  - [ ] **Frontend unit — P2**: `sortClientes` utility for all 4 sort options returns correctly ordered array (4 Vitest tests) [Note: utility used in Story 2.6 but defined here]
  - [ ] **Frontend component — P1**: `ClienteListView` search "Acme" filters to matching items only (Vitest + RTL + MSW)
  - [ ] **Frontend component — P1**: empty data renders `EmptyState` (Vitest + RTL)
  - [ ] **Frontend component — P1**: MSW 500 renders `ErrorPanel` + "Reintentar" button (Vitest + RTL + MSW)
  - [ ] **Frontend component — P1**: click "Reintentar" triggers new GET (Vitest + RTL + MSW)
  - [ ] **Frontend component — P2**: 500 mock records — filter executes ≤150ms via `performance.now()` (NFR1)
  - [ ] Create `clienteFactory` test utility (`frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts`) — Faker-based builder for `Cliente` objects; reused by Stories 2.2–2.6

## Dev Notes

### Architecture Context

This story builds the first end-to-end slice of Epic 2. It introduces:
- `ClienteEntity` (backend domain), `ClienteDto` (application layer), and `GET /api/v1/clientes` endpoint
- `Cliente` TypeScript interface (frontend domain) and `useClientes` TanStack Query hook (application layer)
- `ClienteListView` presentation component (frontend presentation layer)

**Scope boundary (CRITICAL):** This story covers **list + search only**. No create/edit/delete functionality. Right panel (`ClienteDetailView`) is wired in Story 2.2. The route `_app/clientes.tsx` renders a placeholder in the right panel for now.

**Search strategy:** Client-side filtering via `useMemo` over the TanStack Query cache. All 500 records are loaded on mount (`queryKey: ['clientes']`). No backend search parameter is used in this story. Filter must complete in ≤150ms for 500 records (NFR1).

**MasterCrud note:** The architecture does NOT use MasterCrud for the clientes view. The UX specification defines a split-panel layout (`ClienteListView` 280px left + `ClienteDetailView` flex right) — this is a custom layout that MasterCrud cannot replicate. MasterCrud is a full-page table/form orchestrator that would conflict with the established split-panel design. The custom approach with `ClienteListView`, `useClientes`, and `ClienteForm` (Stories 2.3–2.4) is the correct implementation.

### Backend: ClienteEntity Pattern

```csharp
// src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ClienteEntity() { } // Required by EF Core

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(nit);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);
        return new ClienteEntity
        {
            Nombre = nombre.Trim(),
            Nit = nit.Trim(),
            Telefono = telefono.Trim(),
            Ciudad = ciudad.Trim()
        };
    }

    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        Nombre = nombre.Trim();
        Nit = nit.Trim();
        Telefono = telefono.Trim();
        Ciudad = ciudad.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
```

### Backend: EF Core Configuration (CRITICAL — uk_clientes_nit)

```csharp
// src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(255);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);
        // ApplySnakeCaseNaming() in OnModelCreating handles column name mapping
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

**AppDbContext.cs — MANDATORY update sequence:**

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly); // BEFORE snake_case
    modelBuilder.ApplySnakeCaseNaming(); // MUST be the LAST call
}
```

Note: `UseSnakeCaseNamingConvention()` was configured in DI (Story 1.3 completion note). Verify actual method used in `Program.cs` and maintain consistency. The Story 1.3 completion notes confirm `UseSnakeCaseNamingConvention()` is on `DbContextOptionsBuilder` (DI), not `modelBuilder.ApplySnakeCaseNaming()`. Follow whichever is already configured — do NOT change it.

### Backend: GET /api/v1/clientes Endpoint

```csharp
// src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
namespace SiesaAgents.API.Endpoints;

public static class ClienteEndpoints
{
    public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/clientes");

        group.MapGet("/", async (IClienteRepository repo, CancellationToken ct) =>
        {
            var clientes = await repo.GetAllAsync(ct);
            return Results.Ok(clientes.Select(c => new ClienteDto(
                c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt)));
        });

        return app;
    }
}
```

Response shape (direct JSON array — no wrapper object per architecture doc):
```json
[
  { "id": "uuid", "nombre": "Acme S.A.", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "2026-03-12T10:30:00Z" }
]
```

Register in `Program.cs`:
```csharp
app.MapClienteEndpoints();
```

### Frontend: useClientes Hook

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
import { useQuery } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export const useClientes = () =>
  useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 0,
  });
```

### Frontend: ClienteListView — Key Implementation Points

```typescript
// Key patterns for frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
const { data = [], isLoading, isError, refetch } = useClientes();

const [searchQuery, setSearchQuery] = useState('');

const filteredClientes = useMemo(() => {
  const q = searchQuery.toLowerCase().trim();
  if (!q) return data;
  return data.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}, [data, searchQuery]);

// Skeleton loading (react-loading-skeleton) — NOT a spinner
// ErrorPanel on isError — NOT raw error.message
// EmptyState when data.length === 0 AND !isLoading AND !isError
```

### Frontend: sortClientes Utility (Foundation for Story 2.6)

```typescript
// frontend/src/shared/lib/sortClientes.ts
import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

export type SortOption = 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc';

export const sortClientes = (clientes: Cliente[], sort: SortOption): Cliente[] => {
  return [...clientes].sort((a, b) => {
    switch (sort) {
      case 'nombre-asc': return a.nombre.localeCompare(b.nombre, 'es');
      case 'nombre-desc': return b.nombre.localeCompare(a.nombre, 'es');
      case 'fecha-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'fecha-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });
};
```

Default sort in `ClienteListView` is `'fecha-desc'` (most recent first, AC #5).

### Frontend: Zod Schema (Foundation for Stories 2.3–2.4)

```typescript
// frontend/src/modules/crm/clientes/application/clienteSchema.ts
import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  nit: z.string().min(1, 'El NIT/RUC es requerido').max(50),
  telefono: z.string().min(1, 'El teléfono es requerido').max(50),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
```

### Project Structure Notes

**Files to create/modify:**

```
backend/
├── src/
│   ├── SiesaAgents.Domain/
│   │   └── Clientes/
│   │       ├── Entities/ClienteEntity.cs           ← CREATE
│   │       └── Interfaces/IClienteRepository.cs    ← CREATE
│   ├── SiesaAgents.Application/
│   │   └── Clientes/
│   │       ├── DTOs/ClienteDto.cs                  ← CREATE
│   │       ├── Queries/GetClientesQuery.cs          ← CREATE
│   │       └── Queries/GetClientesQueryHandler.cs   ← CREATE
│   ├── SiesaAgents.Infrastructure/
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs                     ← MODIFY (add DbSet<ClienteEntity>)
│   │   │   ├── Configurations/ClienteConfiguration.cs  ← CREATE
│   │   │   └── Migrations/                         ← CREATE via dotnet ef
│   │   └── Repositories/ClienteRepository.cs       ← CREATE
│   └── SiesaAgents.API/
│       ├── Endpoints/ClienteEndpoints.cs            ← CREATE
│       └── Program.cs                              ← MODIFY (register ClienteEndpoints + ClienteRepository DI)
└── tests/
    └── SiesaAgents.UnitTests/
        └── Application/Clientes/
            ├── GetClientesQueryHandlerTests.cs      ← CREATE (API integration: GET /api/v1/clientes)
            └── ClienteValidatorTests.cs             ← CREATE (FluentValidation unit tests, P2)

frontend/
└── src/
    ├── modules/crm/clientes/
    │   ├── domain/
    │   │   ├── Cliente.ts                          ← CREATE
    │   │   └── IClienteRepository.ts               ← CREATE
    │   ├── application/
    │   │   ├── useClientes.ts                      ← CREATE
    │   │   └── clienteSchema.ts                    ← CREATE
    │   ├── infrastructure/
    │   │   └── clienteApiRepository.ts             ← CREATE
    │   ├── presentation/
    │   │   └── ClienteListView.tsx                 ← CREATE
    │   └── __tests__/
    │       ├── clienteFactory.ts                   ← CREATE
    │       ├── useClientes.test.ts                 ← CREATE
    │       └── ClienteListView.test.tsx            ← CREATE
    ├── routes/_app/
    │   └── clientes.tsx                            ← CREATE
    └── shared/
        ├── components/
        │   ├── ClienteListItem.tsx                 ← CREATE
        │   ├── EmptyState.tsx                      ← CREATE
        │   └── ErrorPanel.tsx                      ← CREATE
        └── lib/
            ├── apiClient.ts                        ← CREATE (if not from Story 1.2)
            └── sortClientes.ts                     ← CREATE
```

**Verify from Story 1.2 (frontend-navigation-shell):** Check whether `apiClient.ts`, `queryClient.ts`, `__root.tsx`, and the `_app` layout shell already exist. If they do, do NOT recreate them — only add the new route and components.

### CORS Configuration (Backend)

The frontend (`localhost:5173`) calls the backend (`localhost:5000`). Verify CORS is configured in `Program.cs` (should be from Story 1.1/1.2). If not:

```csharp
builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins("http://localhost:5173").AllowAnyMethod().AllowAnyHeader()));
// ...
app.UseCors("DevCors"); // BEFORE endpoint mapping
```

### Testing Approach

**Backend integration tests use** `WebApplicationFactory<Program>` + Testcontainers PostgreSQL (established in Story 1.3).

**Frontend component tests use** Vitest + React Testing Library + MSW 2.x. MSW handlers should be registered in `frontend/src/__tests__/msw/handlers.ts` (or equivalent established in Epic 1 setup).

**Key test scenarios for this story:**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E2-2-1-API-1 | API | `GET /api/v1/clientes` returns 200 + empty array | P0 |
| TC-E2-2-1-API-2 | API | `GET /api/v1/clientes` with seeded client returns 200 + array with 1 item | P0 |
| TC-E2-2-1-API-3 | API | `uk_clientes_nit` unique index exists in DB | P3 |
| TC-E2-2-1-CMP-1 | Component | Search "Acme" in ClienteListView filters to matching items | P1 |
| TC-E2-2-1-CMP-2 | Component | Empty data shows EmptyState, no list items | P1 |
| TC-E2-2-1-CMP-3 | Component | MSW 500 shows ErrorPanel + "Reintentar" button | P1 |
| TC-E2-2-1-CMP-4 | Component | Click "Reintentar" triggers new GET request | P1 |
| TC-E2-2-1-CMP-5 | Component | 500 records filter completes ≤150ms (NFR1) | P2 |
| TC-E2-2-1-UNIT-1 | Unit | `sortClientes` — nombre-asc sorts A→Z | P2 |
| TC-E2-2-1-UNIT-2 | Unit | `sortClientes` — nombre-desc sorts Z→A | P2 |
| TC-E2-2-1-UNIT-3 | Unit | `sortClientes` — fecha-desc sorts newest first | P2 |
| TC-E2-2-1-UNIT-4 | Unit | `sortClientes` — fecha-asc sorts oldest first | P2 |
| TC-E2-2-1-UNIT-5 | Unit | `clienteSchema` rejects empty NIT | P2 |
| TC-E2-2-1-UNIT-6 | Unit | `clienteSchema` rejects empty Nombre | P2 |
| TC-E2-2-1-UNIT-7 | Unit | `clienteSchema` accepts valid NIT format "900123456-1" | P2 |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `DateTimeOffset` used in `ClienteEntity` — NEVER `DateTime`
- [ ] `Guid.NewGuid()` as default PK — NEVER `int` or `long`
- [ ] `ApplySnakeCaseNaming()` remains the LAST call in `OnModelCreating`
- [ ] `uk_clientes_nit` unique index defined in `ClienteConfiguration.cs`
- [ ] `GET /api/v1/clientes` returns direct JSON array (no `{ data: [], total: 0 }` wrapper)
- [ ] Scalar registered in `Program.cs` — NEVER `app.UseSwagger()`
- [ ] All user-facing text in Spanish: search placeholder, section titles, empty state, error panel, button labels
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `ErrorPanel` used for load failures, NOT raw `error.message`
- [ ] `react-loading-skeleton` used for loading state, NOT a spinner
- [ ] `useClientes` query key is `['clientes']` (array form) — NOT a string
- [ ] `useMemo` wraps the client-side filter — NOT inline JSX computation
- [ ] Backend error responses use Problem Details RFC 7807 via `ExceptionHandlingMiddleware` (inherited from Story 1.3)

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1`]
- Architecture — Search strategy (client-side filter): [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Architecture — TanStack Query keys: [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Architecture — ClienteListView 280px pattern: [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)`]
- Architecture — Frontend folder structure: [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Architecture — Enforcement guidelines (DateTimeOffset, UUID, ApplySnakeCaseNaming): [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Test design — TC-E2 test scenarios: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Coverage Plan`]
- Test design — Risk R-005 (search perf): [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#2. Risk Assessment`]
- Company standards — Database conventions: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)`]
- Company standards — Backend stack: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- Company standards — Frontend stack: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Preceding story — AppDbContext, migrations, EF Core setup: [Source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`]
- Preceding story — Project structure, routes, apiClient: [Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
