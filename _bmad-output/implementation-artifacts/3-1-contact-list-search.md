# Story 3.1: Contact List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all contacts and search them by name or email,
so that I can quickly find any contact regardless of their client association.

## Acceptance Criteria

1. **Given** there are contacts in the system, **When** the user navigates to `/contactos`, **Then** a list of all contacts is displayed showing `Nombre`, `Cargo`, and `Email` per item (FR10).

2. **Given** the contact list is loaded, **When** the user types in the search field, **Then** the list filters in real time (client-side, no API call) showing only contacts whose `Nombre` or `Email` match the input, and results appear in under 1 second with up to 1,000 records (NFR1, FR11, FR12).

3. **Given** there are no contacts in the system, **When** the user navigates to `/contactos`, **Then** an `EmptyState` component is displayed guiding the user to create the first contact, and no list items are rendered.

4. **Given** the backend is unavailable when the page loads, **When** the fetch fails (any HTTP error or network error), **Then** an `ErrorPanel` component is displayed with a "Reintentar" button instead of the list, and clicking "Reintentar" triggers a new fetch.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Add `ContactoEntity`, EF Core config, migration, and `GET /api/v1/contactos` endpoint (AC: #1, #2, #3, #4)
  - [ ] Create `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs` — `Guid Id`, `string Nombre`, `string Cargo`, `string Telefono`, `string Email`, `Guid? ClienteId` (nullable FK), `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`; private constructor + static `Create()` factory
  - [ ] Create `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` — `Task<IReadOnlyList<ContactoEntity>> GetAllAsync(CancellationToken ct)`
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs` — `IEntityTypeConfiguration<ContactoEntity>`: sets required fields, max lengths, nullable `ClienteId` FK → `clientes.id` ON DELETE SET NULL, unique index `ix_contactos_email`, index `ix_contactos_cliente_id`
  - [ ] Add `DbSet<ContactoEntity> Contactos` to `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`; ensure `ApplyConfigurationsFromAssembly` runs BEFORE snake_case naming (verify existing convention — do NOT change whichever snake_case strategy is already active)
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs` — `{ Guid Id, string Nombre, string Cargo, string Telefono, string Email, Guid? ClienteId, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt }`
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs` + `GetContactosQueryHandler.cs` — returns `IReadOnlyList<ContactoDto>` ordered by `CreatedAt` descending
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — implements `IContactoRepository` using `AppDbContext`; register in DI in `Program.cs`
  - [ ] Create `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — `GET /api/v1/contactos` calls `GetContactosQueryHandler`, returns direct JSON array, 200 OK; register via `app.MapContactoEndpoints()` in `Program.cs`
  - [ ] Run EF Core migration: `dotnet ef migrations add AddContactoEntity --project backend/src/SiesaAgents.Infrastructure --startup-project backend/src/SiesaAgents.API`; then `dotnet ef database update`
  - [ ] Verify `clientes` migration from Epic 2 is present before running `contactos` migration (FK dependency: `contactos.cliente_id` → `clientes.id`)

- [ ] Task 2 — Frontend: Domain + Application layers for contactos (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/contactos/domain/Contacto.ts` — TypeScript interface: `{ id: string; nombre: string; cargo: string; telefono: string; email: string; clienteId: string | null; createdAt: string; updatedAt: string }`
  - [ ] Create `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — interface with `getAll(): Promise<Contacto[]>`
  - [ ] Create `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implements `IContactoRepository` using the shared `apiClient` (`GET /api/v1/contactos`)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContactos.ts` — TanStack Query hook: `queryKey: ['contactos']`, `queryFn: () => contactoApiRepository.getAll()`, `staleTime: 0`
  - [ ] Create `frontend/src/modules/crm/contactos/application/contactoSchema.ts` — Zod schema: `nombre`, `cargo`, `telefono`, `email` all `z.string().min(1, ...)` with Spanish error messages; export `ContactoFormData` inferred type
  - [ ] Verify `frontend/src/shared/lib/apiClient.ts` exists (from Story 1.2); do NOT recreate

- [ ] Task 3 — Frontend: Presentation layer — ContactoListView (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`:
    - Uses `useContactos()` hook
    - `isLoading`: renders skeleton placeholders via `react-loading-skeleton` (NOT a spinner) for 5 items
    - `isError`: renders `<ErrorPanel onRetry={refetch} />` with message "No se pudieron cargar los contactos."
    - Empty data (`data.length === 0` and not loading/error): renders `<EmptyState title="Sin contactos" description="Crea el primer contacto para comenzar." />`
    - Populated: renders search `<input>` + scrollable list of `<ContactoListItem>` components
    - Real-time search: `useState<string>` for `searchQuery`; filter via `useMemo` on `data` matching `nombre` or `email` (case-insensitive, trimmed) — wraps in `useMemo`, NOT inline JSX computation
    - Each list item shows: `nombre` (bold), `cargo` (secondary), `email` (muted)
    - All visible text in Spanish: search placeholder `"Buscar por nombre o email..."`, heading `"Contactos"`
    - Clicking a contact item navigates to `/contactos/$contactoId` (TanStack Router `useNavigate`)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoListItem.tsx` — renders `nombre`, `cargo`, `email`; accessible `role="button"` with `tabIndex={0}` and keyboard support (`onKeyDown` Enter); uses Tailwind `hover:bg-slate-100` for hover state

- [ ] Task 4 — Frontend: Route wiring at `/contactos` (AC: #1)
  - [ ] Create `frontend/src/routes/_app/contactos.tsx` — renders `<ContactoListView />` as the main content; verify navigation rail in `__root.tsx` includes a "Contactos" link (add if missing)
  - [ ] Verify/register `_app/contactos.$contactoId.tsx` placeholder route (will be fully implemented in Story 3.2); create minimal stub that renders "Detalle de contacto" to avoid broken navigation

- [ ] Task 5 — Frontend: Shared components (verify or create) (AC: #3, #4)
  - [ ] Verify `frontend/src/shared/components/EmptyState.tsx` exists from Story 2.1; if present, reuse — do NOT recreate; if `title`/`description` props differ, extend the existing interface rather than replacing it
  - [ ] Verify `frontend/src/shared/components/ErrorPanel.tsx` exists from Story 2.1; if present, reuse — ensure `onRetry` prop and "Reintentar" button are already present; if missing, create following the same pattern as Epic 2

- [ ] Task 6 — Tests (AC: #1, #2, #3, #4) — aligned with test-design-epic-3.md
  - [ ] **Backend API — P0**: `GET /api/v1/contactos` returns 200 + JSON array containing `nombre`, `cargo`, `email` fields (xUnit, WebApplicationFactory + Testcontainers)
  - [ ] **Backend API — P0**: POST `/api/v1/contactos` → 201; re-GET returns new record (xUnit integration)
  - [ ] **Backend API — P2**: `contactos` table has `cliente_id` column nullable (FK to `clientes.id`) verified via `pg_indexes` / `information_schema.columns` (xUnit integration)
  - [ ] **Frontend component — P0**: render `ContactoListView` with 1,000 MSW-mocked contacts, type in search field, assert filter executes ≤150ms via `performance.now()` (Vitest + RTL + MSW) — mitigates R-003
  - [ ] **Frontend component — P1**: search by `nombre` filters to matching items only (Vitest + RTL + MSW)
  - [ ] **Frontend component — P1**: search by `email` filters to matching items only (Vitest + RTL + MSW)
  - [ ] **Frontend component — P1**: empty data renders `EmptyState` (Vitest + RTL)
  - [ ] **Frontend component — P1**: MSW 500 renders `ErrorPanel` + "Reintentar" button (Vitest + RTL + MSW) — mitigates R-005
  - [ ] **Frontend component — P1**: click "Reintentar" triggers new `GET /api/v1/contactos` (Vitest + RTL + MSW)
  - [ ] **Frontend unit — P2**: `contactoSchema` rejects empty `nombre`, `cargo`, `telefono`, `email` individually; accepts valid data (4 Vitest tests) — mitigates R-004
  - [ ] Create `contactoFactory` test utility at `frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts` — Faker-based builder for `Contacto` objects; reused by Stories 3.2–3.5
  - [ ] Add MSW handler for `GET /api/v1/contactos` in `frontend/src/test-setup.ts` or the existing MSW handlers file (established in Epic 1/2); shared handler extended with contacto routes

## Dev Notes

### Architecture Context

This story builds the first end-to-end slice of Epic 3. It introduces:
- `ContactoEntity` (backend domain), `ContactoDto` (application layer), `GET /api/v1/contactos` endpoint (API layer)
- `Contacto` TypeScript interface (frontend domain) and `useContactos` TanStack Query hook (application layer)
- `ContactoListView` + `ContactoListItem` presentation components (frontend presentation layer)

**Scope boundary (CRITICAL):** This story covers **list + real-time search only**. No create/edit/delete functionality (Stories 3.3–3.5). Contact detail view is wired in Story 3.2. The route `_app/contactos.$contactoId.tsx` gets a stub placeholder only.

**Key difference from Story 2.1 (Client List):** The contact list is a full-page view at `/contactos` (not a 280px fixed-width side panel). Each list item must display THREE fields: `Nombre`, `Cargo`, and `Email` — unlike the client list which shows only `Nombre` and `NIT`. The search targets `nombre` and `email` (not `nit`).

**Search strategy:** Client-side filtering via `useMemo` over the TanStack Query cache (`queryKey: ['contactos']`). All records loaded on mount (no server-side search in this story). Filter must execute in ≤150ms for 1,000 records (NFR1 — doubled vs Epic 2's 500 clients). No `useDeferredValue` required at 1,000 records — `useMemo` is sufficient.

**MasterCrud note:** MasterCrud is NOT used here. The UX spec defines `ContactoListView` as a standalone list with real-time search — a full-page scrollable list, not a paginated CRUD grid. MasterCrud's paginated table/form orchestrator pattern would conflict with the established direct-list design. Stories 3.3–3.5 will use a custom form (React Hook Form + Zod), not MasterCrud's built-in form.

### Backend: ContactoEntity Pattern

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
    public Guid? ClienteId { get; private set; } // nullable FK — assigned in Epic 4
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ContactoEntity() { } // Required by EF Core

    public static ContactoEntity Create(string nombre, string cargo, string telefono, string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
        ArgumentException.ThrowIfNullOrWhiteSpace(cargo);
        ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        return new ContactoEntity
        {
            Nombre = nombre.Trim(),
            Cargo = cargo.Trim(),
            Telefono = telefono.Trim(),
            Email = email.Trim()
        };
    }

    public void Update(string nombre, string cargo, string telefono, string email)
    {
        Nombre = nombre.Trim();
        Cargo = cargo.Trim();
        Telefono = telefono.Trim();
        Email = email.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
```

### Backend: EF Core Configuration

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
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(255);
        builder.Property(c => c.Cargo).IsRequired().HasMaxLength(255);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(255);
        builder.Property(c => c.ClienteId).IsRequired(false); // nullable FK
        // FK: ON DELETE SET NULL (contact becomes orphan when client deleted)
        builder.HasOne<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>()
               .WithMany()
               .HasForeignKey(c => c.ClienteId)
               .IsRequired(false)
               .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id");
        builder.HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email");
        // ApplySnakeCaseNaming() in OnModelCreating maps to snake_case automatically
    }
}
```

**AppDbContext.cs — MANDATORY update (mirror of Story 2.1 pattern):**

```csharp
// Add to AppDbContext:
public DbSet<ContactoEntity> Contactos => Set<ContactoEntity>();

// OnModelCreating must keep ApplySnakeCaseNaming() as the LAST call (or verify UseSnakeCaseNamingConvention on DbContextOptionsBuilder — do NOT change whichever is already configured).
```

### Backend: GET /api/v1/contactos Endpoint

```csharp
// backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs
namespace SiesaAgents.API.Endpoints;

public static class ContactoEndpoints
{
    public static IEndpointRouteBuilder MapContactoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/contactos");

        group.MapGet("/", async (IContactoRepository repo, CancellationToken ct) =>
        {
            var contactos = await repo.GetAllAsync(ct);
            return Results.Ok(contactos
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new ContactoDto(
                    c.Id, c.Nombre, c.Cargo, c.Telefono, c.Email,
                    c.ClienteId, c.CreatedAt, c.UpdatedAt)));
        });

        return app;
    }
}
```

Response shape (direct JSON array — no wrapper object, per architecture doc):
```json
[
  {
    "id": "uuid",
    "nombre": "María López",
    "cargo": "Gerente Comercial",
    "telefono": "3001234567",
    "email": "maria.lopez@empresa.com",
    "clienteId": null,
    "createdAt": "2026-06-28T10:30:00Z",
    "updatedAt": "2026-06-28T10:30:00Z"
  }
]
```

Register in `Program.cs`:
```csharp
app.MapContactoEndpoints();
```

### Frontend: useContactos Hook

```typescript
// frontend/src/modules/crm/contactos/application/useContactos.ts
import { useQuery } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';

export const useContactos = () =>
  useQuery({
    queryKey: ['contactos'],
    queryFn: () => contactoApiRepository.getAll(),
    staleTime: 0,
  });
```

### Frontend: ContactoListView — Key Implementation Points

```typescript
// Key patterns for frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useContactos } from '../application/useContactos';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorPanel } from '@/shared/components/ErrorPanel';
import Skeleton from 'react-loading-skeleton';

export const ContactoListView = () => {
  const { data = [], isLoading, isError, refetch } = useContactos();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredContactos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  if (isLoading) return <Skeleton count={5} height={60} />;
  if (isError) return <ErrorPanel onRetry={refetch} />;
  if (data.length === 0) return (
    <EmptyState
      title="Sin contactos"
      description="Crea el primer contacto para comenzar."
    />
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Contactos</h1>
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        aria-label="Buscar contactos"
      />
      <ul className="overflow-y-auto" role="list">
        {filteredContactos.map((c) => (
          <ContactoListItem
            key={c.id}
            contacto={c}
            onClick={() => navigate({ to: '/contactos/$contactoId', params: { contactoId: c.id } })}
          />
        ))}
      </ul>
    </div>
  );
};
```

### Frontend: Zod Schema

```typescript
// frontend/src/modules/crm/contactos/application/contactoSchema.ts
import { z } from 'zod';

export const contactoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  cargo: z.string().min(1, 'El cargo es requerido').max(255),
  telefono: z.string().min(1, 'El teléfono es requerido').max(50),
  email: z.string().email('El email no es válido').min(1, 'El email es requerido').max(255),
});

export type ContactoFormData = z.infer<typeof contactoSchema>;
```

### Project Structure Notes

**Files to create/modify:**

```
backend/
├── src/
│   ├── SiesaAgents.Domain/
│   │   └── Contactos/
│   │       ├── Entities/ContactoEntity.cs              ← CREATE
│   │       └── Interfaces/IContactoRepository.cs       ← CREATE
│   ├── SiesaAgents.Application/
│   │   └── Contactos/
│   │       ├── DTOs/ContactoDto.cs                     ← CREATE
│   │       ├── Queries/GetContactosQuery.cs             ← CREATE
│   │       └── Queries/GetContactosQueryHandler.cs      ← CREATE
│   ├── SiesaAgents.Infrastructure/
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs                         ← MODIFY (add DbSet<ContactoEntity>)
│   │   │   ├── Configurations/ContactoConfiguration.cs ← CREATE
│   │   │   └── Migrations/                             ← CREATE via dotnet ef
│   │   └── Repositories/ContactoRepository.cs          ← CREATE
│   └── SiesaAgents.API/
│       ├── Endpoints/ContactoEndpoints.cs              ← CREATE
│       └── Program.cs                                  ← MODIFY (register ContactoEndpoints + ContactoRepository DI)
└── tests/
    └── SiesaAgents.UnitTests/
        └── Contactos/
            ├── GetContactosApiTests.cs                 ← CREATE (API integration: P0 scenarios)
            └── ContactoSchemaTests.cs                  ← CREATE (validation unit tests, P2)

frontend/
└── src/
    ├── modules/crm/contactos/
    │   ├── domain/
    │   │   ├── Contacto.ts                             ← CREATE
    │   │   └── IContactoRepository.ts                  ← CREATE
    │   ├── application/
    │   │   ├── useContactos.ts                         ← CREATE
    │   │   └── contactoSchema.ts                       ← CREATE
    │   ├── infrastructure/
    │   │   └── contactoApiRepository.ts                ← CREATE
    │   ├── presentation/
    │   │   ├── ContactoListView.tsx                    ← CREATE
    │   │   └── ContactoListItem.tsx                    ← CREATE
    │   └── __tests__/
    │       ├── contactoFactory.ts                      ← CREATE
    │       ├── useContactos.test.ts                    ← CREATE
    │       └── ContactoListView.test.tsx               ← CREATE
    ├── routes/_app/
    │   ├── contactos.tsx                               ← CREATE
    │   └── contactos.$contactoId.tsx                   ← CREATE (stub only; full impl Story 3.2)
    └── shared/
        ├── components/
        │   ├── EmptyState.tsx                          ← VERIFY (exists from Story 2.1; extend if needed)
        │   └── ErrorPanel.tsx                          ← VERIFY (exists from Story 2.1; extend if needed)
        └── lib/
            └── apiClient.ts                            ← VERIFY (exists from Stories 1.2/2.1; do NOT recreate)
```

**Verify from previous stories:**
- `EmptyState.tsx` and `ErrorPanel.tsx` — created in Story 2.1; check that `EmptyState` accepts `title` and `description` props (Story 2.1 already defines these)
- `apiClient.ts` and `queryClient.ts` — must exist from Story 1.2/2.1; do NOT recreate
- `__root.tsx` and `_app` layout shell — must exist from Story 1.2; only add the `/contactos` navigation entry if missing

### Testing Approach

**Backend integration tests** use `WebApplicationFactory<Program>` + Testcontainers PostgreSQL (established in Story 1.3). Reuse the same pattern as `GetClientesApiTests.cs` from Story 2.1.

**Frontend component tests** use Vitest + React Testing Library + MSW 2.x. MSW handlers for contacto routes must be added to the existing handlers file. Pattern mirrors `ClienteListView.test.tsx`.

**contactoFactory** (to create in this story, reused by 3.2–3.5):
```typescript
// frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts
import { faker } from '@faker-js/faker';
import type { Contacto } from '../domain/Contacto';

export const createContacto = (overrides: Partial<Contacto> = {}): Contacto => ({
  id: faker.string.uuid(),
  nombre: faker.person.fullName(),
  cargo: faker.person.jobTitle(),
  telefono: faker.phone.number(),
  email: faker.internet.email(),
  clienteId: null,
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createContactoList = (count: number, overrides: Partial<Contacto> = {}): Contacto[] =>
  Array.from({ length: count }, () => createContacto(overrides));
```

**Key test scenarios for this story (from test-design-epic-3.md):**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E3-3-1-API-1 | API | `GET /api/v1/contactos` returns 200 + array with `nombre`, `cargo`, `email` fields | P0 |
| TC-E3-3-1-API-2 | API | POST + re-GET confirms record present in list | P0 |
| TC-E3-3-1-API-3 | API | `contactos` table has nullable `cliente_id` column | P2 |
| TC-E3-3-1-CMP-1 | Component | 1,000 records — search filter executes ≤150ms (NFR1 R-003) | P0 |
| TC-E3-3-1-CMP-2 | Component | Search by `nombre` partial match filters list | P1 |
| TC-E3-3-1-CMP-3 | Component | Search by `email` partial match filters list | P1 |
| TC-E3-3-1-CMP-4 | Component | Empty data shows `EmptyState`, no list items | P1 |
| TC-E3-3-1-CMP-5 | Component | MSW 500 shows `ErrorPanel` + "Reintentar" | P1 |
| TC-E3-3-1-CMP-6 | Component | Click "Reintentar" triggers new GET | P1 |
| TC-E3-3-1-UNIT-1 | Unit | `contactoSchema` rejects empty `nombre` | P2 |
| TC-E3-3-1-UNIT-2 | Unit | `contactoSchema` rejects empty `cargo` | P2 |
| TC-E3-3-1-UNIT-3 | Unit | `contactoSchema` rejects empty `telefono` | P2 |
| TC-E3-3-1-UNIT-4 | Unit | `contactoSchema` rejects empty `email` | P2 |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `DateTimeOffset` used in `ContactoEntity` — NEVER `DateTime`
- [ ] `Guid.NewGuid()` as default PK in `ContactoEntity` — NEVER `int` or `long`
- [ ] `ClienteId` is `Guid?` (nullable) — NEVER required in this story
- [ ] `ContactoConfiguration.cs` defines FK `ON DELETE SET NULL` (`DeleteBehavior.SetNull`)
- [ ] Snake_case naming consistent with existing `AppDbContext` convention (verify before touching)
- [ ] `GET /api/v1/contactos` returns direct JSON array (no `{ data: [], total: 0 }` wrapper)
- [ ] Scalar registered in `Program.cs` — NEVER `app.UseSwagger()` (inherited from Story 1.3)
- [ ] All user-facing text in Spanish: search placeholder, heading, empty state, error panel, button labels, ARIA labels
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `ErrorPanel` used for load failures, NOT raw `error.message` — message: "No se pudieron cargar los contactos."
- [ ] `react-loading-skeleton` used for loading state, NOT a spinner
- [ ] `useContactos` query key is `['contactos']` (array form) — NOT a string
- [ ] `useMemo` wraps client-side filter — NOT inline JSX computation
- [ ] `contactoFactory` created and exported from `__tests__/contactoFactory.ts` for reuse in Stories 3.2–3.5
- [ ] MSW handler for `GET /api/v1/contactos` added to shared handler file
- [ ] Backend error responses use Problem Details RFC 7807 via `ExceptionHandlingMiddleware` (inherited)
- [ ] `clientes` migration confirmed present in DB before running `contactos` migration (FK dependency)

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.1`]
- Architecture — Data model (ContactoEntity, nullable ClienteId FK): [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Architecture — TanStack Query keys (['contactos']): [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Architecture — Frontend folder structure (contactos module): [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Architecture — GET /api/v1/contactos endpoint contract: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — Search strategy (client-side useMemo filter): [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Architecture — Enforcement guidelines (DateTimeOffset, UUID, Scalar, Spanish text): [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Test design — Epic 3 test scenarios (P0–P2): [Source: `_bmad-output/test-design-epic-3.md#4. Test Coverage Plan`]
- Test design — R-002 (mutation invalidation), R-003 (1,000 record search perf), R-005 (ErrorPanel): [Source: `_bmad-output/test-design-epic-3.md#2. Risk Assessment`]
- Preceding story — ClienteListView pattern (search + EmptyState + ErrorPanel + useMemo): [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md`]
- Preceding story — AppDbContext, snake_case config, EF Core migration pattern: [Source: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`]
- Preceding story — apiClient.ts, shared lib, MSW setup: [Source: `_bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md`]
- Company standards — Backend rules (DateTimeOffset, UUID, Minimal API): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- Company standards — Frontend rules (TanStack Query, Zustand, Spanish text): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]
- Company standards — Database conventions (snake_case, ix_/uk_ prefixes): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
