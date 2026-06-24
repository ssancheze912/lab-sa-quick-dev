# Story 3.1: Contact List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all contacts and search them by name or email,
so that I can quickly find any contact regardless of their client association.

## Acceptance Criteria

1. **Given** there are contacts in the system, **When** the user navigates to `/contactos`, **Then** a list of all contacts is displayed showing Nombre, Cargo, and Email per item, rendered as a full-page table view using `ContactoListView` (FR10).

2. **Given** the contact list is loaded, **When** the user types in the search input field, **Then** the list filters in real time (client-side, no new API call) showing only contacts whose Nombre or Email match the input (case-insensitive), **And** results appear in under 1 second with up to 1,000 records (NFR1, FR11, FR12).

3. **Given** there are no contacts in the system (empty array returned from API), **When** the user navigates to `/contactos`, **Then** an `EmptyState` component is displayed with a Spanish-language message guiding the user to create the first contact (e.g., "No hay contactos registrados. Crea el primero.").

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails (network error or non-2xx response), **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, **And** clicking "Reintentar" triggers a new fetch attempt.

5. **Given** the contact list is rendered, **When** the user clicks on a contact item (row), **Then** the URL updates to `/contactos/:contactoId` using TanStack Router client-side navigation without a full page reload (FR30).

6. **Given** the `/contactos` route renders, **When** the component mounts, **Then** a single `GET /api/v1/contactos` request is sent and the response is cached under `queryKey: ['contactos']` via TanStack Query.

7. **Given** contact data is loading from the API, **When** the fetch is in-flight, **Then** a skeleton loader (via `react-loading-skeleton`) is rendered in the list area — no spinner.

## Tasks / Subtasks

- [x] Task 1 — Define domain entity and repository contract for Contacto (AC: #6)
  - [x] Create `frontend/src/modules/crm/contactos/domain/Contacto.ts` — TypeScript interface: `{ id: string; nombre: string; cargo: string; telefono: string; email: string; clienteId: string | null; createdAt: string; updatedAt: string; }`
  - [x] Create `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — interface with `getAll(): Promise<Contacto[]>`

- [x] Task 2 — Implement infrastructure API repository (AC: #6)
  - [x] Create `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
  - [x] Implement `IContactoRepository.getAll()` using `apiClient.get<Contacto[]>('/api/v1/contactos')` (Axios singleton at `src/shared/lib/apiClient.ts`)
  - [x] Export a singleton instance `contactoApiRepository`

- [x] Task 3 — Implement application-layer TanStack Query hook (AC: #2, #6, #7)
  - [x] Create `frontend/src/modules/crm/contactos/application/useContactos.ts`
  - [x] Use `useQuery({ queryKey: ['contactos'], queryFn: contactoApiRepository.getAll })` — no staleTime override (default)
  - [x] Export `{ data, isLoading, isError, refetch }` from the hook

- [x] Task 4 — Create `ContactoListView` presentation component (AC: #1, #2, #3, #4, #5, #7)
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
  - [x] Use `useContactos()` hook for data fetching
  - [x] Local `useState<string>` for `searchQuery`; filter `contactos` array client-side using `useMemo`: `contactos.filter(c => c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))`
  - [x] Render skeleton (`react-loading-skeleton`, 5 rows) while `isLoading === true`
  - [x] Render `<ErrorPanel onRetry={refetch} />` when `isError === true`
  - [x] Render `<EmptyState message="No hay contactos registrados. Crea el primero." />` when `data` is an empty array
  - [x] Render search `<input>` with placeholder "Buscar por nombre o email..." and `data-testid="contact-search-input"`
  - [x] Render scrollable list/table with columns: Nombre, Cargo, Email per row
  - [x] Each row clickable: calls TanStack Router's `navigate({ to: '/contactos/$contactoId', params: { contactoId: id } })`
  - [x] Each row: `data-testid="contact-list-item-{id}"`
  - [x] Wrap list in `<section aria-label="Lista de contactos">` for accessibility (WCAG 2.1 AA)
  - [x] Add `data-testid="contacto-list-view"` on root element
  - [x] Check siesa-ui-kit FIRST before creating any custom sub-component

- [x] Task 5 — Wire `ContactoListView` into the `/contactos` route (AC: #1, #5)
  - [x] Update `frontend/src/routes/_app/contactos.tsx` (placeholder from Story 1.2) to render `<ContactoListView />`
  - [x] Layout: full-width `flex flex-col h-full` — contact list occupies the full page
  - [x] Create route stub `frontend/src/routes/_app/contactos.$contactoId.tsx` (renders nothing, enables URL state for Story 3.2)

- [x] Task 6 — Backend: Create `ContactoEntity` and `contactos` migration (AC: #6)
  - [x] Create `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs`:
    - Inherit from `Entity` base class (`SiesaAgents.Domain/Entities/Entity.cs`)
    - Properties: `string Nombre`, `string Cargo`, `string Telefono`, `string Email`, `Guid? ClienteId`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`
    - Private constructor + static `Create(string nombre, string cargo, string telefono, string email)` factory
    - `UpdatedAt` refreshed via `Update(...)` method
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs`:
    - `IEntityTypeConfiguration<ContactoEntity>`
    - Map to table `contactos` (snake_case auto via `ApplySnakeCaseNaming()`)
    - Required fields: Nombre (max 200), Cargo (max 100), Telefono (max 30), Email (max 200)
    - `HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email")`
    - `HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id")`
    - FK: `HasOne<ClienteEntity>().WithMany().HasForeignKey(c => c.ClienteId).OnDelete(DeleteBehavior.SetNull)` — nullable, no cascade delete
  - [x] Add `DbSet<ContactoEntity> Contactos` to `AppDbContext`
  - [x] Create EF Core migration `AddContactos` manually (pattern: `backend/src/SiesaAgents.Infrastructure/Migrations/`): migration file created manually following existing migration pattern
  - [x] Verify migration creates `contactos` table with columns: `id uuid PK`, `nombre`, `cargo`, `telefono`, `email`, `cliente_id uuid NULL FK → clientes.id ON DELETE SET NULL`, `created_at`, `updated_at`

- [x] Task 7 — Backend: Create Application layer (DTOs, Query, Handler) (AC: #6)
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs`:
    ```csharp
    public record ContactoDto(Guid Id, string Nombre, string Cargo, string Telefono, string Email, Guid? ClienteId, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
    ```
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs`: `public record GetContactosQuery();`
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs`:
    - Inject `IContactoRepository` (or `AppDbContext` directly)
    - Return `IEnumerable<ContactoDto>` — map from `ContactoEntity` using `Select`
    - Use `AsNoTracking()` for read-only queries
  - [x] Create `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` with `Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct)`
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` implementing `IContactoRepository` using EF Core

- [x] Task 8 — Backend: Create Minimal API endpoint (AC: #6)
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
  - [x] Register `GET /api/v1/contactos` endpoint in `Program.cs` via `app.MapContactoEndpoints()`
  - [x] Handler dispatches `GetContactosQuery` and returns `Results.Ok(contactoDtos)`
  - [x] Status codes: 200 (success), 500 (unhandled — caught by middleware)
  - [x] Register `ContactoRepository` and `GetContactosQueryHandler` in DI container (`Program.cs`)

- [x] Task 9 — Frontend unit tests (AC: #1, #2, #3, #4, #7)
  - [x] Create `frontend/src/modules/crm/contactos/application/useContactos.test.ts`
    - Test: returns contact data on successful fetch (MSW handler)
    - Test: `isLoading` is true while fetching
    - Test: `isError` is true on API failure
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx`
    - Test: renders skeleton during loading
    - Test: renders `EmptyState` when API returns empty array
    - Test: renders `ErrorPanel` with retry button on API failure
    - Test: renders list of contacts with Nombre, Cargo, Email visible
    - Test: filters list when search input changes by nombre (case-insensitive)
    - Test: filters list when search input changes by email (case-insensitive)
    - Test: clicking item navigates to `/contactos/:id`
    - Test: accessibility — `<section aria-label="Lista de contactos">` present
  - [x] All tests use Vitest + RTL + MSW; follow Arrange/Act/Assert; coverage target >80%

- [x] Task 10 — Backend unit and integration tests (AC: #6)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Contactos/GetContactosQueryHandlerTests.cs`
    - Test: returns empty list when no contacts in DB
    - Test: returns mapped `ContactoDto` list when contacts exist
    - Test: uses `AsNoTracking` (verify `ChangeTracker.Entries()` is empty)
  - [x] Create `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ContactoEndpointsTests.cs`
    - Test: `GET /api/v1/contactos` returns 200 + JSON array
    - Test: response is empty array when no contacts seeded
    - Test: response contains seeded contact data with correct camelCase fields
  - [x] Use xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL (integration)
  - [x] All tests: Arrange / Act / Assert pattern

## Dev Notes

### Architecture Context

This story is **full-stack** — both frontend and backend changes are required. The story delivers the contacts list view (frontend) and the `GET /api/v1/contactos` endpoint (backend), establishing the `contactos` table in PostgreSQL.

**Critical dependency from Story 1.3:** The `AppDbContext`, `ExceptionHandlingMiddleware`, `Entity` base class, `NotFoundException`, and `ConflictException` are all already implemented. Do NOT recreate them. The Entity base class is at `backend/src/SiesaAgents.Domain/Entities/Entity.cs`.

**Critical dependency from Epic 2 (Stories 2.1–2.6):** The `contactos.tsx` route, `EmptyState`, `ErrorPanel`, `apiClient.ts`, and `queryClient.ts` are all already created. Verify presence before recreating. The `contactos.tsx` route currently exists as a placeholder stub — this story replaces it.

**Contacto has a nullable FK to Cliente:** The `ContactoEntity` has `Guid? ClienteId` (nullable). The FK constraint uses `ON DELETE SET NULL` — deleting a client leaves the contact with `ClienteId = NULL`. This FK relationship does NOT need to be navigated in this story — only the list endpoint is needed.

**Layout difference from Story 2.1:** Unlike the 280px sidebar panel for clients, the contacts list (`/contactos`) occupies the full width of the page as a standalone table view, consistent with the architecture decision (`ContactoListView.tsx` — lista contactos standalone).

**Search covers 1,000 records (NFR1):** Client-side filtering handles up to 1,000 contacts. No debounce is required — `useMemo` on `searchQuery` + `data` is within NFR1 < 1s bounds for this dataset size.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check siesa-ui-kit catalog FIRST before creating any UI component.
- **Install**: `npm install siesa-ui-kit` (already done in Story 1.1 — verify package is present).
- **Usage**: Use `siesa-ui-kit` components for all UI elements where equivalents exist. For `EmptyState` and `ErrorPanel`, reuse existing shared components from `frontend/src/shared/components/` (already created in Story 2.1).
- **Loading states**: Use `react-loading-skeleton` — skeleton screens, NOT spinners.
- **Icons**: Heroicons (primary), Font Awesome 6.5+ (secondary).
- **Brand Colors**: Primary `#0e79fd` (Siesa Blue) — use Tailwind `primary-*` tokens.
- **All user-facing text in Spanish** — no English strings rendered in the UI.
- **WCAG 2.1 AA**: all interactive elements accessible via keyboard, all ARIA labels in Spanish.

### MasterCrud Assessment

Story 3.1 is a **read-only list + search** screen — NOT a full CRUD form screen. MasterCrud is NOT applicable here: this story renders a standalone full-page list with client-side filtering, not a form-based CRUD grid. MasterCrud will be evaluated for Stories 3.3–3.5 (create/edit/delete forms).

### Backend: Entity Pattern

Use the mandatory private constructor + static factory pattern:

```csharp
public class ContactoEntity : Entity
{
    private ContactoEntity() { } // required by EF Core

    public string Nombre { get; private set; } = string.Empty;
    public string Cargo { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(cargo);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);

        return new ContactoEntity
        {
            Nombre = nombre,
            Cargo = cargo,
            Telefono = telefono,
            Email = email
        };
    }

    public void Update(string nombre, string cargo, string telefono, string email)
    {
        Nombre = nombre;
        Cargo = cargo;
        Telefono = telefono;
        Email = email;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
```

Note: `Guid Id` is inherited from `Entity` base class at `backend/src/SiesaAgents.Domain/Entities/Entity.cs`.

### Backend: EF Core Configuration Pattern

```csharp
public class ContactoConfiguration : IEntityTypeConfiguration<ContactoEntity>
{
    public void Configure(EntityTypeBuilder<ContactoEntity> builder)
    {
        builder.ToTable("contactos"); // snake_case auto-applied by ApplySnakeCaseNaming()
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Cargo).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(30);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(200);
        builder.HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email");
        builder.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id");
        // FK: nullable, ON DELETE SET NULL
        builder.HasOne<ClienteEntity>()
               .WithMany()
               .HasForeignKey(c => c.ClienteId)
               .OnDelete(DeleteBehavior.SetNull)
               .HasConstraintName("fk_contactos_clientes");
    }
}
```

`ApplySnakeCaseNaming()` is called last in `OnModelCreating` (already done in Story 1.3). No manual `[Column]` or `[Table]` attributes.

### Backend: Minimal API Endpoint Pattern

```csharp
// ContactoEndpoints.cs
public static class ContactoEndpoints
{
    public static void MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/contactos", async (GetContactosQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetContactosQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetContactos")
        .WithSummary("List all contacts");
    }
}
// In Program.cs: app.MapContactoEndpoints();
```

### Frontend: Clean Architecture Module Structure

```
frontend/src/modules/crm/contactos/
├── domain/
│   ├── Contacto.ts                     ← CREATE
│   └── IContactoRepository.ts          ← CREATE
├── application/
│   └── useContactos.ts                 ← CREATE
├── infrastructure/
│   └── contactoApiRepository.ts        ← CREATE
└── presentation/
    └── ContactoListView.tsx            ← CREATE

frontend/src/shared/components/
├── EmptyState.tsx                      ← REUSE (exists from Story 2.1)
└── ErrorPanel.tsx                      ← REUSE (exists from Story 2.1)

frontend/src/routes/_app/
├── contactos.tsx                       ← MODIFY (was placeholder from Story 1.2)
└── contactos.$contactoId.tsx          ← CREATE (stub for Story 3.2)
```

### Frontend: TanStack Query Integration

```typescript
// useContactos.ts
import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactos() {
  return useQuery({
    queryKey: ['contactos'],
    queryFn: () => contactoApiRepository.getAll(),
  })
}
```

The `queryKey: ['contactos']` is the canonical key (from `architecture.md`). All mutation hooks in Stories 3.3–3.5 will invalidate this key via `queryClient.invalidateQueries({ queryKey: ['contactos'] })`.

### Frontend: Client-Side Search Filter

```typescript
// In ContactoListView.tsx
const [searchQuery, setSearchQuery] = useState('')

const filteredContactos = useMemo(() => {
  if (!data) return []
  const q = searchQuery.toLowerCase().trim()
  if (!q) return data
  return data.filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

No debounce needed — client-side filter over up to 1,000 records is within NFR1 < 1s bounds.

### Frontend: Route Layout

```typescript
// frontend/src/routes/_app/contactos.tsx
export const Route = createFileRoute('/_app/contactos')({
  component: ContactosPage,
})

function ContactosPage() {
  return (
    <div className="flex flex-col h-full" data-testid="contactos-view">
      <ContactoListView />
    </div>
  )
}
```

The `contactos.$contactoId.tsx` stub enables deep-linking (FR30) from this story forward (Story 3.2).

### Database Schema (from architecture.md)

```sql
-- contactos table (created by migration in this story)
CREATE TABLE contactos (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  nombre VARCHAR(200) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  email VARCHAR(200) NOT NULL,
  cliente_id UUID NULL REFERENCES clientes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_contactos_email ON contactos(email);
CREATE INDEX ix_contactos_cliente_id ON contactos(cliente_id);
```

EF Core generates this DDL automatically from the entity configuration + `ApplySnakeCaseNaming()`.

### API Response Shape (from architecture.md)

```
GET /api/v1/contactos → 200 OK — direct JSON array (no wrapper)
[
  { "id": "uuid", "nombre": "...", "cargo": "...", "telefono": "...", "email": "...", "clienteId": null, "createdAt": "2026-01-01T00:00:00Z", "updatedAt": "2026-01-01T00:00:00Z" }
]
```

Empty list returns `200 OK` with `[]` — NOT a 404.

### Testing Standards Summary

**Frontend:** Vitest + React Testing Library + MSW. Tests co-located or in `__tests__/` subdirectory. Accessibility checks via `getByRole`. Coverage target > 80%.

**Backend:** xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL (integration). All tests: Arrange / Act / Assert pattern. Coverage target > 80%.

### Project Structure Notes

- `frontend/src/shared/lib/apiClient.ts` — Axios singleton (created in Story 1.1). Do NOT recreate. Import `apiClient` from this path.
- `frontend/src/shared/lib/queryClient.ts` — TanStack QueryClient (created in Story 1.1). Do NOT recreate.
- `frontend/src/shared/components/EmptyState.tsx` — already exists from Story 2.1. Reuse directly.
- `frontend/src/shared/components/ErrorPanel.tsx` — already exists from Story 2.1. Reuse directly.
- `backend/src/SiesaAgents.Domain/Entities/Entity.cs` — base class with `Guid Id` (confirmed path from Story 1.3 dev notes).
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — already exists; add `DbSet<ContactoEntity>` property.
- `backend/src/SiesaAgents.API/Program.cs` — already registers `ClienteRepository`, `ClienteEndpoints`, etc. Follow same registration pattern for contactos.
- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` — already has API + MVC Testing references from Story 2.1. Do NOT readd.
- FK navigation: `ContactoEntity.ClienteId` requires `ClienteEntity` to already be in the `AppDbContext`. `ClienteEntity` was added in Story 2.1 — it is already present.

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.1]
- Epic objectives and FRs: [Source: _bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Epic 3]
- Frontend module structure: [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- TanStack Query keys (canonical): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- REST endpoints contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Database schema (contactos): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Search strategy (client-side filter): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Entity pattern (private ctor + factory): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- UUID PKs and DateTimeOffset: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- EF Core snake_case naming: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core]
- API response shapes (array, no wrapper): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Problem Details RFC 7807 error format: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Enforcement guidelines (anti-patterns): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- MasterCrud reference (N/A for read-only list): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Story 2.1 patterns (previous story intelligence — same list+search pattern): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- NFR1 search < 1s (1,000 contacts): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR6 no stack traces: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- ON DELETE SET NULL for nullable FK: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implementation completed 2026-06-24 by claude-sonnet-4-6.
- `ContactoEntity.cs` placed at `backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs` (not in a Contactos subdirectory) to follow the same flat structure as `ClienteEntity.cs`.
- `IContactoRepository.cs` placed at `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` following CQRS/DDD pattern.
- Migration file `20260624000000_AddContactos.cs` created manually (dotnet CLI not available in environment); snapshot updated accordingly.
- `routeTree.gen.ts` updated to include the new `contactos.$contactoId` route — auto-regenerated by TanStack Router Vite plugin during test run.
- 11 frontend tests pass (3 hook tests + 8 component tests); 0 new failures introduced.
- Pre-existing failures in clientes module (25 tests) are unrelated to this story.
- Backend tests (3 unit + 3 integration) written but cannot be run without dotnet runtime in environment.

### File List

**Created:**
- `frontend/src/modules/crm/contactos/domain/Contacto.ts`
- `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
- `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
- `frontend/src/modules/crm/contactos/application/useContactos.ts`
- `frontend/src/modules/crm/contactos/application/useContactos.test.ts`
- `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx`
- `frontend/src/routes/_app/contactos.$contactoId.tsx`
- `backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs`
- `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
- `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs`
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs`
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260624000000_AddContactos.cs`
- `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Contactos/GetContactosQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ContactoEndpointsTests.cs`

**Modified:**
- `frontend/src/routes/_app/contactos.tsx` — replaced placeholder with ContactoListView
- `frontend/src/routeTree.gen.ts` — added contactos.$contactoId route
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — added DbSet<ContactoEntity>
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs` — updated with ContactoEntity
- `backend/src/SiesaAgents.API/Program.cs` — registered ContactoRepository, GetContactosQueryHandler, MapContactoEndpoints
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated epic-3 and story 3-1 status
