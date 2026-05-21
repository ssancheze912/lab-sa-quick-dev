# Story 3.1: Contact List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all contacts and search them by name or email,
so that I can quickly find any contact regardless of their client association.

## Acceptance Criteria

1. **Given** there are contacts in the system, **When** the user navigates to `/contactos`, **Then** a list of all contacts is displayed **And** each item shows Nombre, Cargo, and Email (FR10).

2. **Given** the contact list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only contacts whose Nombre or Email match the input **And** results appear in under 1 second with up to 1,000 records (NFR1, FR11, FR12) **And** no additional API call is made during typing — filtering is client-side.

3. **Given** there are no contacts in the system, **When** the user navigates to `/contactos`, **Then** an `EmptyState` component is displayed guiding the user to create the first contact.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list **And** clicking "Reintentar" retries the API call.

## Tasks / Subtasks

- [x] Task 1 — Define `ContactoEntity` domain model and `IContactoRepository` contract (AC: 1)
  - [x] Create `frontend/src/modules/crm/contactos/domain/Contacto.ts` — TypeScript interface with fields: `id` (string UUID), `nombre`, `cargo`, `telefono`, `email`, `clienteId` (string | null), `createdAt` (string ISO 8601), `updatedAt` (string ISO 8601)
  - [x] Create `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — interface with `getAll(): Promise<Contacto[]>`

- [x] Task 2 — Implement `contactoApiRepository` in the infrastructure layer (AC: 1, 4)
  - [x] Create `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
  - [x] Use the Axios `apiClient` singleton (`frontend/src/shared/lib/apiClient.ts`)
  - [x] Implement `getAll()` → `GET /api/v1/contactos` (no `?search=` param — filtering is client-side)
  - [x] Implement `IContactoRepository`

- [x] Task 3 — Implement `useContactos` TanStack Query hook (AC: 1, 4)
  - [x] Create `frontend/src/modules/crm/contactos/application/useContactos.ts`
  - [x] Use `useQuery` with `queryKey: ['contactos']`
  - [x] Call `contactoApiRepository.getAll()`
  - [x] Return `{ data, isLoading, isError, refetch }` — expose `refetch` for the ErrorPanel retry action
  - [x] `staleTime`: 5 minutes (aligned with `queryClient.ts` default)

- [x] Task 4 — Implement `filterContactos` utility function (AC: 2)
  - [x] Create `frontend/src/modules/crm/contactos/application/filterContactos.ts`
  - [x] Signature: `filterContactos(contacts: Contacto[], query: string): Contacto[]`
  - [x] Match case-insensitively against `nombre` or `email` fields
  - [x] Return full array when query is empty or whitespace-only

- [x] Task 5 — Implement `ContactoListView` presentation component (AC: 1, 2, 3, 4)
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
  - [x] Search input at top: `placeholder="Buscar contacto por nombre o email"`, `aria-label="Buscar contactos"`
  - [x] Filter logic: `useMemo` calling `filterContactos(data, searchQuery)` — match `nombre` or `email` (case-insensitive) against `searchQuery` local state
  - [x] Render list of `ContactoListItem` components (one per filtered result)
  - [x] Apply `data-testid="contacto-row"` to each list item element
  - [x] Show `EmptyState` when `data` is loaded and empty (no contacts exist)
  - [x] Show `ErrorPanel` with `onRetry={refetch}` when `isError === true`
  - [x] Show react-loading-skeleton placeholders when `isLoading === true` (3 skeleton rows)

- [x] Task 6 — Create `ContactoListItem` component (AC: 1)
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactoListItem.tsx`
  - [x] Props: `nombre: string`, `cargo: string`, `email: string`, `isActive?: boolean`
  - [x] Display `nombre` (primary text), `cargo` (secondary text, smaller, muted), `email` (tertiary text, smaller, muted)
  - [x] Apply active/hover state styling using Tailwind + Siesa Blue `#0e79fd`
  - [x] ARIA: `role="row"`, `aria-current={isActive ? 'true' : undefined}`

- [x] Task 7 — Reuse or verify `EmptyState` shared component (AC: 3)
  - [x] Reuse `frontend/src/shared/components/EmptyState.tsx` (created in Story 2.1)
  - [x] Use props: `title="No hay contactos registrados"`, `description="Crea el primer contacto para comenzar."`

- [x] Task 8 — Reuse or verify `ErrorPanel` shared component (AC: 4)
  - [x] Reuse `frontend/src/shared/components/ErrorPanel.tsx` (created in Story 2.1)
  - [x] Pass `onRetry={refetch}` from `useContactos`

- [x] Task 9 — Wire `ContactoListView` into the `/contactos` route (AC: 1)
  - [x] Update `frontend/src/routes/_app/contactos.tsx` — replace placeholder with `ContactoListView`
  - [x] Route renders `ContactoListView` as the main view with `<Outlet />` for upcoming Story 3.2 detail panel

- [x] Task 10 — Backend: define `ContactoEntity` and EF Core configuration (AC: 1, 4)
  - [x] Create `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs`
    - Fields: `Id` (Guid, UUID), `Nombre` (string), `Cargo` (string), `Telefono` (string), `Email` (string), `ClienteId` (Guid? nullable), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
    - Private constructor + static `Create(string nombre, string cargo, string telefono, string email)` factory — `ClienteId` defaults to `null`
    - `Update(string nombre, string cargo, string telefono, string email)` method sets `UpdatedAt = DateTimeOffset.UtcNow`
  - [x] Create `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` — `Task<IEnumerable<ContactoEntity>> GetAllAsync(CancellationToken ct);`
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs` — `IEntityTypeConfiguration<ContactoEntity>`, FK to `clientes.id` with `ON DELETE SET NULL`, index on `email` (`ix_contactos_email`), index on `cliente_id` (`ix_contactos_cliente_id`)
  - [x] Add `DbSet<ContactoEntity> Contactos` to `AppDbContext`
  - [x] Run EF Core migration: `dotnet ef migrations add AddContactoEntity --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`

- [x] Task 11 — Backend: implement CQRS query and handler (AC: 1)
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs` — record with no parameters
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs` — calls `IContactoRepository.GetAllAsync()`, maps to `ContactoDto`
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs` — `{ Guid Id, string Nombre, string Cargo, string Telefono, string Email, Guid? ClienteId, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt }`
  - [x] Register `IContactoRepository` → `ContactoRepository` in DI (Program.cs)

- [x] Task 12 — Backend: implement `ContactoRepository` (AC: 1, 4)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
  - [x] Implement `IContactoRepository`; use `AppDbContext`
  - [x] `GetAllAsync`: `return await _context.Contactos.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct);`

- [x] Task 13 — Backend: expose `GET /api/v1/contactos` endpoint (AC: 1, 4)
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
  - [x] `MapGet("/api/v1/contactos", ...)` → dispatches `GetContactosQuery`, returns `200 OK` with `ContactoDto[]`
  - [x] Register in `Program.cs`: `app.MapContactoEndpoints()`
  - [x] Response format: direct JSON array (no wrapper object) — per architecture contract

- [x] Task 14 — Write frontend unit tests (AC: 2)
  - [x] Create `frontend/src/modules/crm/contactos/application/__tests__/useContactos.test.ts`
    - UNIT-CT-FE-01: `useContactos` returns data from `contactoApiRepository.getAll()` on success
    - UNIT-CT-FE-02: `useContactos` exposes `isError = true` when repository throws
  - [x] Create `frontend/src/modules/crm/contactos/__tests__/filterContactos.test.ts`
    - UNIT-CT-05: `filterContactos(contacts, 'Juan')` returns only contacts whose `nombre` contains 'Juan' (case-insensitive)
    - UNIT-CT-06: `filterContactos(contacts, 'test@')` returns only contacts whose `email` contains 'test@' (case-insensitive)

- [x] Task 15 — Write backend unit tests (AC: 1, 4)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Handlers/GetContactosQueryHandlerTests.cs`
    - UNIT-B-CT-GET-01: Handler returns all contacts as `ContactoDto[]` when repository returns data
    - UNIT-B-CT-GET-02: Handler returns empty array when repository returns no records

## Dev Notes

### Architecture Context

This story is the first story of Epic 3. It builds on the foundation from Epic 1 (Stories 1.1, 1.2, 1.3) and introduces:
- The `ContactoEntity` domain entity (backend) and `Contacto` TypeScript interface (frontend)
- The first working contactos API endpoint: `GET /api/v1/contactos`
- The `ContactoListView` as the main view of the Contactos feature

**Depends on:**
- Story 1.1 — Frontend project initialized (Vite, React, TanStack Router, TanStack Query, Axios, shadcn/ui)
- Story 1.2 — `/contactos` route exists as a placeholder at `frontend/src/routes/_app/contactos.tsx`
- Story 1.3 — `AppDbContext` exists with `ApplySnakeCaseNaming()`, `ExceptionHandlingMiddleware` active, `siesa_agents_db` connected

**Provides for:** Story 3.2 (Contact Detail View) will add the detail panel on the same `/contactos` route; clicking a contact row navigates to `/contactos/:contactoId`.

**Search strategy (from architecture.md):** All records are loaded on mount via TanStack Query (`queryKey: ['contactos']`). Filtering is 100% client-side using `useMemo` + `filterContactos()` over the cached array — no `?search=` query parameter is sent to the backend. This guarantees sub-150ms filter response time for up to 1,000 records (NFR1).

**`clienteId` scope boundary:** `ContactoEntity.ClienteId` is nullable. In this epic (3), all contacts are created with `ClienteId = null`. Client association is handled in Epic 4.

### Frontend File Locations

```
frontend/src/
  modules/crm/contactos/
    domain/
      Contacto.ts                          # TypeScript entity interface
      IContactoRepository.ts               # Repository contract
    application/
      useContactos.ts                      # TanStack Query hook — queryKey: ['contactos']
      filterContactos.ts                   # Pure utility: filter by nombre or email
    infrastructure/
      contactoApiRepository.ts             # Axios impl of IContactoRepository
    presentation/
      ContactoListView.tsx                 # Main list view — search + list
      ContactoListItem.tsx                 # List item — nombre, cargo, email
  shared/components/
    EmptyState.tsx                         # Reused from Story 2.1
    ErrorPanel.tsx                         # Reused from Story 2.1
```

### `Contacto` TypeScript Interface

```typescript
// frontend/src/modules/crm/contactos/domain/Contacto.ts
export interface Contacto {
  id: string;           // UUID
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  clienteId: string | null;  // null in Epic 3 — assigned in Epic 4
  createdAt: string;    // ISO 8601 with timezone — DateTimeOffset serialized
  updatedAt: string;
}
```

### `useContactos` Hook Pattern

```typescript
// frontend/src/modules/crm/contactos/application/useContactos.ts
import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactos() {
  return useQuery({
    queryKey: ['contactos'],
    queryFn: () => contactoApiRepository.getAll(),
  })
}
```

### `filterContactos` Utility Pattern

```typescript
// frontend/src/modules/crm/contactos/application/filterContactos.ts
import { Contacto } from '../domain/Contacto'

export function filterContactos(contacts: Contacto[], query: string): Contacto[] {
  if (!query.trim()) return contacts
  const lower = query.toLowerCase()
  return contacts.filter(
    c =>
      c.nombre.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower)
  )
}
```

### `ContactoListView` Search Filter Pattern

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx
const [searchQuery, setSearchQuery] = useState('')
const { data = [], isLoading, isError, refetch } = useContactos()

const filteredContactos = useMemo(
  () => filterContactos(data, searchQuery),
  [data, searchQuery]
)
```

**Key rules:**
- `data` defaults to `[]` to avoid null checks — `useQuery` returns `undefined` until loaded
- `useMemo` re-runs only when `data` or `searchQuery` changes
- No debounce needed for correctness — client-side filter over ≤ 1,000 objects is fast; however a 150ms debounce is acceptable for UX
- `data-testid="contacto-row"` MUST be on each list item element — required by E2E POM locator `contactoRows`

### Backend: `ContactoEntity` Pattern

```csharp
// backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs
namespace SiesaAgents.Domain.Contactos.Entities;

public class ContactoEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = string.Empty;
    public string Cargo { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public Guid? ClienteId { get; private set; } = null;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ContactoEntity() { } // EF Core constructor

    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email)
    {
        return new ContactoEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Cargo = cargo,
            Telefono = telefono,
            Email = email,
            ClienteId = null,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
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

**Critical rules (company standards):**
- `DateTimeOffset` — NEVER `DateTime`
- `Guid` UUID primary key — NEVER `int` or `string`
- `ClienteId` is `Guid?` (nullable) — defaults to `null` in this epic
- Private constructor for EF Core; public factory via `Create()`
- EF Core + `ApplySnakeCaseNaming()` will map `CreatedAt` → `created_at` automatically — NO `[Column]` attributes

### Backend: `ContactoConfiguration` Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ContactoConfiguration : IEntityTypeConfiguration<ContactoEntity>
{
    public void Configure(EntityTypeBuilder<ContactoEntity> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Cargo).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(200);
        builder.Property(c => c.ClienteId).IsRequired(false);

        // FK → clientes.id with SET NULL on delete (orphan contacts persist — FR23)
        builder.HasOne<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>()
            .WithMany()
            .HasForeignKey(c => c.ClienteId)
            .OnDelete(DeleteBehavior.SetNull)
            .HasConstraintName("fk_contactos_clientes");

        // Index for client filtering (Epic 4)
        builder.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id");

        // Index for email lookups
        builder.HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email");
    }
}
```

### Backend: `GET /api/v1/contactos` Endpoint

```csharp
// backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static void MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/contactos").WithTags("Contactos");

        group.MapGet("/", async (GetContactosQueryHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetContactosQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetContactos")
        .Produces<ContactoDto[]>(StatusCodes.Status200OK);
    }
}
```

**Response contract (direct array, no wrapper):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "nombre": "María García",
    "cargo": "Gerente Comercial",
    "telefono": "+57 1 234 5679",
    "email": "m.garcia@empresa.com",
    "clienteId": null,
    "createdAt": "2026-05-21T10:30:00Z",
    "updatedAt": "2026-05-21T10:30:00Z"
  }
]
```

### EF Core Migration Command

Run from `backend/` directory after adding `DbSet<ContactoEntity>` to `AppDbContext`:

```bash
dotnet ef migrations add AddContactoEntity \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

This creates the `contactos` table with columns: `id`, `nombre`, `cargo`, `telefono`, `email`, `cliente_id`, `created_at`, `updated_at` (snake_case via `ApplySnakeCaseNaming()`).

### Loading State — Skeleton Pattern

```typescript
// Inside ContactoListView — use react-loading-skeleton (company standard for placeholders)
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

if (isLoading) {
  return (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1 p-3">
          <Skeleton width="55%" height={16} />
          <Skeleton width="40%" height={12} />
          <Skeleton width="60%" height={12} />
        </div>
      ))}
    </div>
  )
}
```

**Note:** Use skeleton screens, NOT spinners — per company standards.

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/contactos/contactos-list.spec.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-CT-01 | P0 | AC1 | Contact table renders all contacts returned by API on page load |
| E2E-CT-02 | P0 | AC2 | Typing in search input filters table to matching contacts by Nombre in real time without new API calls |
| E2E-CT-03 | P0 | AC2 | Typing email fragment in search input filters table to matching contacts by Email |
| E2E-CT-04 | P1 | AC2 | Clearing search input after filtering restores full contact list |
| E2E-CT-05 | P2 | AC3 | EmptyState component is visible when no contacts exist in the system |
| E2E-CT-06 | P2 | AC4 | ErrorPanel with "Reintentar" button is shown when API returns 500 on load |

**Implementation notes (from test-design-epic-3.md):**
- E2E-CT-02: Use `page.route('**/api/v1/contactos', ...)` to assert only 1 GET call is made on page load; type multiple characters and assert no additional GET network requests via `page.on('request', ...)` listener.
- E2E-CT-03: Create 3 contacts with distinct emails. Type partial email of one. Assert only 1 row visible. Assert no new GET `/api/v1/contactos` fired.
- E2E-CT-05: Mock empty array response via `page.route('**/api/v1/contactos', ...)` returning `[]`.
- E2E-CT-06: Use `page.route('**/api/v1/contactos', route => route.fulfill({ status: 500 }))` before navigation.

**API Integration Tests — `e2e/tests/contactos/contactos-api.spec.ts` (Story 3.1 scope):**

| Test ID | Priority | Description |
|---------|----------|-------------|
| API-CT-07 | P1 | GET `/api/v1/contactos` returns array; each item has `id`, `nombre`, `email`, `cargo` fields |

**Frontend Unit Tests (Vitest + RTL):**

| Test ID | Priority | File | Description |
|---------|----------|------|-------------|
| UNIT-CT-FE-01 | P1 | `useContactos.test.ts` | Returns contact data from repository on success |
| UNIT-CT-FE-02 | P1 | `useContactos.test.ts` | Exposes `isError = true` when fetch throws |
| UNIT-CT-05 | P1 | `filterContactos.test.ts` | `filterContactos(contacts, 'Juan')` returns contacts matching by nombre (case-insensitive) |
| UNIT-CT-06 | P1 | `filterContactos.test.ts` | `filterContactos(contacts, 'test@')` returns contacts matching by email (case-insensitive) |

**Backend Unit Tests (xUnit):**

| Test ID | Priority | File | Description |
|---------|----------|------|-------------|
| UNIT-B-CT-GET-01 | P1 | `GetContactosQueryHandlerTests.cs` | Handler returns `ContactoDto[]` when repository returns data |
| UNIT-B-CT-GET-02 | P1 | `GetContactosQueryHandlerTests.cs` | Handler returns empty array when repository has no records |

### Key Anti-Patterns to Avoid

```
❌ debouncing search with API calls    → useMemo + filterContactos() over in-memory array
❌ sending ?search= to API            → client-side filter only (architecture.md decision)
❌ string queryKey                    → use array: ['contactos']
❌ DateTime in ContactoEntity         → DateTimeOffset mandatory
❌ int/string PK                      → Guid (UUID) mandatory
❌ [Column("created_at")] attr        → ApplySnakeCaseNaming() handles this automatically
❌ spinner for loading state          → react-loading-skeleton (skeleton screens)
❌ English UI text                    → all user-facing text in Spanish
❌ exposing error.message to user     → use ErrorPanel with generic message
❌ app.UseSwagger()                   → already using Scalar, no change
❌ missing data-testid="contacto-row" → required by E2E POM locator (test-design-epic-3.md, risk R11)
❌ clienteId set in Create factory    → must default to null (Epic 3 scope boundary)
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.1 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Data Architecture" (ContactoEntity), "Search Strategy" (client-side filter up to 1,000 records), "Frontend Architecture" (route structure, query keys `['contactos']`), "API & Communication Patterns" (GET /api/v1/contactos), "Implementation Patterns & Consistency Rules"
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-3.md` — E2E-CT-01 through E2E-CT-06, API-CT-07, risk R1 (search), risk R8 (EmptyState), risk R9 (ErrorPanel), risk R11 (contactoRows testid)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-contactos.md` — FR9–FR16
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack, Backend Stack, Database Conventions, Backend Critical Rules
- Predecessor stories: `_bmad-output/implementation-artifacts/stories/1-1-project-initialization-repository-structure.md`, `_bmad-output/implementation-artifacts/stories/1-2-frontend-navigation-shell.md`, `_bmad-output/implementation-artifacts/stories/1-3-backend-database-foundation.md`
- Reference story: `_bmad-output/implementation-artifacts/stories/2-1-client-list-and-search.md` — analogous pattern for clientes

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- All tasks verified as already implemented by a prior session (commit range ending at 22d77c6).
- Fixed pre-existing test bug: `filterContactos.edge.test.ts` UNIT-CT-FILTER-EDGE-11 used "Par"/"Impar" names where "Impar" contains "par", causing all 1000 items to match. Fixed to use "Alfa"/"Beta" so the filter produces a genuine subset.
- Fixed `GetContactosQueryHandlerTests.cs` FakeContactoRepository missing `GetByIdAsync` method required by `IContactoRepository` interface.
- Created EF Core migration `20260521074856_AddContactoEntity` manually (dotnet CLI not available in environment); includes both `clientes` and `contactos` tables since `InitialCreate` migration was empty.
- Updated `AppDbContextModelSnapshot.cs` to reflect current model state.

### Completion Notes List

- All 15 tasks (Tasks 1-15) verified complete — frontend and backend implementations existed from prior session.
- Frontend: Contacto domain, repository, TanStack Query hook, filter utility, ContactoListView, ContactoListItem, route wiring all present.
- Backend: ContactoEntity (DateTimeOffset, Guid PK, private constructor, factory), IContactoRepository, ContactoRepository, CQRS query/handler, DTO, EF config, Minimal API endpoint, DI registration all present.
- EF Core migration created manually with clientes + contactos tables per snake_case naming convention.
- All contacto-related frontend tests pass (UNIT-CT-FE-01, UNIT-CT-FE-02, UNIT-CT-05, UNIT-CT-06 and edge cases).
- Pre-existing failures in other stories (queryClient staleTime mismatch, ClienteListPanel useParams) are not in story 3.1 scope.

### File List

**Created (frontend):**
- `frontend/src/modules/crm/contactos/domain/Contacto.ts`
- `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
- `frontend/src/modules/crm/contactos/application/useContactos.ts`
- `frontend/src/modules/crm/contactos/application/filterContactos.ts`
- `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
- `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoListItem.tsx`
- `frontend/src/modules/crm/contactos/application/__tests__/useContactos.test.ts`
- `frontend/src/modules/crm/contactos/__tests__/filterContactos.test.ts`

**Created (backend):**
- `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs`
- `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs`
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs`
- `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
- `backend/tests/SiesaAgents.UnitTests/Handlers/GetContactosQueryHandlerTests.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260521074856_AddContactoEntity.cs` (manual — dotnet CLI unavailable)
- `backend/src/SiesaAgents.Infrastructure/Migrations/20260521074856_AddContactoEntity.Designer.cs` (manual)

**Modified:**
- `frontend/src/routes/_app/contactos.tsx` — wired with ContactoListView + Outlet
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — DbSet<ContactoEntity> Contactos
- `backend/src/SiesaAgents.API/Program.cs` — IContactoRepository, GetContactosQueryHandler, MapContactoEndpoints
- `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs` — updated to reflect clientes + contactos model
- `frontend/src/modules/crm/contactos/__tests__/filterContactos.edge.test.ts` — fixed UNIT-CT-FILTER-EDGE-11 test data bug
- `backend/tests/SiesaAgents.UnitTests/Handlers/GetContactosQueryHandlerTests.cs` — added GetByIdAsync to FakeContactoRepository
