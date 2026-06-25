# Story 3.1: Contact List & Search

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all contacts and search them by name or email,
So that I can quickly find any contact regardless of their client association.

## Acceptance Criteria

1. **Given** there are contacts in the system, **When** the user navigates to `/contactos`, **Then** a list of all contacts is displayed showing Nombre, Cargo, and Email per item (FR10).

2. **Given** the contact list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only contacts whose Nombre or Email match the input (case-insensitive), **And** results appear in under 1 second with up to 1,000 records (NFR1, FR11, FR12).

3. **Given** there are no contacts in the system (empty array returned by API), **When** the user navigates to `/contactos`, **Then** an `EmptyState` component is displayed with a message in Spanish guiding the user to create the first contact; the search field and list container are still rendered but empty.

4. **Given** the backend is unavailable when the page loads (network error or 5xx), **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list; clicking "Reintentar" triggers a new fetch via TanStack Query `refetch`.

## Tasks / Subtasks

- [x] Task 1 — Backend: Create `contactos` table via EF Core migration (AC: #1, #4)
  - [x] Create `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs` with properties: `Guid Id` (PK, `Guid.NewGuid()`), `string Nombre`, `string Cargo`, `string Telefono`, `string Email`, `Guid? ClienteId` (nullable FK), `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`. Use private setters + static `Create()` factory pattern.
  - [x] Create `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` with methods: `Task<IEnumerable<ContactoEntity>> GetAllAsync()`, `Task<ContactoEntity?> GetByIdAsync(Guid id)`.
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs` implementing `IEntityTypeConfiguration<ContactoEntity>`: configure `ix_contactos_email` index on `Email`, `ix_contactos_cliente_id` index on `ClienteId`, FK `fk_contactos_clientes` → `ClienteEntity` with `ON DELETE SET NULL`, set `not null` on `Nombre`, `Cargo`, `Telefono`, `Email`. EF Core auto-maps table name to `contactos` and columns to snake_case via `ApplySnakeCaseNaming()` (no `[Table]`/`[Column]` attributes).
  - [x] Register `DbSet<ContactoEntity> Contactos` in `AppDbContext.cs`.
  - [x] Create and run EF Core migration: `dotnet ef migrations add AddContactosTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
  - [x] Verify `contactos` table in `siesa_agents_db` with columns: `id` (uuid PK), `nombre`, `cargo`, `telefono`, `email`, `cliente_id` (uuid nullable FK → `clientes.id` ON DELETE SET NULL), `created_at`, `updated_at`.

- [x] Task 2 — Backend: Implement `GET /api/v1/contactos` query and endpoint (AC: #1, #4)
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs`: `record ContactoDto(Guid Id, string Nombre, string Cargo, string Telefono, string Email, Guid? ClienteId, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)`.
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs` (empty marker record) and `GetContactosQueryHandler.cs` that calls `IContactoRepository.GetAllAsync()` and returns `IEnumerable<ContactoDto>`.
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` implementing `IContactoRepository`: `GetAllAsync()` queries `AppDbContext.Contactos` ordered by `CreatedAt` descending, projects to `ContactoDto`.
  - [x] Register `IContactoRepository` → `ContactoRepository` in DI container in `Program.cs`.
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — map `GET /api/v1/contactos` → calls `GetContactosQueryHandler`, returns `200 OK` with direct array (no wrapper). Wire endpoint registration in `Program.cs`.
  - [x] Verify API returns `application/json` array with camelCase fields; empty array `[]` when no contacts exist.

- [x] Task 3 — Frontend: Define `Contacto` domain entity and repository interface (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/contactos/domain/Contacto.ts`.
  - [x] Create `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`.

- [x] Task 4 — Frontend: Implement infrastructure layer (AC: #1, #4)
  - [x] Verify `frontend/src/shared/lib/apiClient.ts` Axios instance exists with `baseURL: import.meta.env.VITE_API_URL`.
  - [x] Create `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` implementing `IContactoRepository`.

- [x] Task 5 — Frontend: Implement application layer hook `useContactos` (AC: #1, #2, #4)
  - [x] Create `frontend/src/modules/crm/contactos/application/useContactos.ts`.

- [x] Task 6 — Frontend: Verify shared `EmptyState` and `ErrorPanel` components exist (AC: #3, #4)
  - [x] Verified `frontend/src/shared/components/EmptyState.tsx` exists (created in Story 2.1); reused as-is.
  - [x] Verified `frontend/src/shared/components/ErrorPanel.tsx` exists (created in Story 2.1); reused as-is.

- [x] Task 7 — Frontend: Create `ContactoListView` presentation component (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`: uses `useContactos()`, `useState` for search, `useMemo` for client-side filtering, `react-loading-skeleton` for loading, `ErrorPanel`/`EmptyState` for error/empty states, WCAG 2.1 AA compliance, Spanish UI text.

- [x] Task 8 — Frontend: Wire TanStack Router route `/contactos` (AC: #1)
  - [x] Updated `frontend/src/routes/_app/contactos.tsx` to render `ContactoListView` (replaced placeholder).

- [x] Task 9 — Frontend: Write unit and component tests (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/contactos/application/useContactos.test.ts`: 6 tests passing (MSW, queryKey, loading, success, error states).
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx`: 19 tests passing (AC1-4, NFR1 performance < 1s with 1,000 records, WCAG structural checks).

- [x] Task 10 — Backend: Write unit and integration tests for `GetContactosQueryHandler` (AC: #1, #4)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Contactos/GetContactosQueryHandlerTests.cs`: 4 unit tests passing.
  - [x] Create `backend/tests/SiesaAgents.IntegrationTests/ContactoEndpointsTests.cs`: 4 integration tests passing.

## Dev Notes

### Architecture Alignment

This story covers the **read path only** for the `contactos` module (FR10 + FR11 + FR12). Write operations (Create, Update, Delete) are handled in Stories 3.3–3.5. The detail view (Story 3.2) is in the next story.

Clean Architecture layers for frontend (`src/modules/crm/contactos/`):
- **Domain**: `Contacto.ts` (entity interface), `IContactoRepository.ts` (contract)
- **Application**: `useContactos.ts` (TanStack Query hook, queryKey: `['contactos']`)
- **Infrastructure**: `contactoApiRepository.ts` (Axios implementation)
- **Presentation**: `ContactoListView.tsx` (UI component)

Backend layers:
- **Domain**: `ContactoEntity.cs`, `IContactoRepository.cs`
- **Application**: `GetContactosQuery.cs`, `GetContactosQueryHandler.cs`, `ContactoDto.cs`
- **Infrastructure**: `ContactoRepository.cs`, `ContactoConfiguration.cs`, EF Core migration
- **API**: `ContactoEndpoints.cs` (Minimal API — NO controllers)

### Search Implementation (NFR1 — < 1 second with up to 1,000 records)

Search is **client-side only** for this MVP (architecture decision). The API always returns the full list; the frontend filters via `useMemo` on each keystroke (no debounce — NFR1 passes without it for up to 1,000 records). Dataset is larger than clients (1,000 vs 500 records) — performance test is mandatory per R-001.

```typescript
const filtered = useMemo(() =>
  data?.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [],
  [data, searchQuery]
);
```

If `performance.now()` in the performance test shows >= 1s for 1,000 records, escalate to a server-side search endpoint (`GET /api/v1/contactos?search=`) before completing the story.

### State Management

- **Server state**: TanStack Query (`useContactos`, `queryKey: ['contactos']`) — no Zustand for this story.
- **Search state**: local `useState<string>('')` — does NOT go to URL params (search is ephemeral per session).
- **Selected contact**: managed at route level via URL param (`/contactos/$contactoId`) — introduced in Story 3.2.

### UI Implementation Requirements (MANDATORY)

- **Check siesa-ui-kit first** for list item, empty state, and error panel components before creating custom ones. Install: `npm install siesa-ui-kit` (verify package already present from Story 1.1 setup). Note from Story 2.1: siesa-ui-kit does not export `EmptyState` or `ErrorPanel` — custom shared components exist; reuse them.
- **Loading skeleton**: use `react-loading-skeleton` — skeleton screens, NOT spinners (company standard).
- **Brand colors**: active/selected item highlight → `#0e79fd` (Siesa Blue); secondary text → Tailwind `slate-*` scale.
- **Typography**: Inter font (Light 300, Regular 400, Bold 700).
- All user-facing text MUST be in Spanish: labels, placeholders, ARIA labels, error messages, empty state messages.
- Code (variables, functions, types) in English.
- WCAG 2.1 AA compliance: keyboard navigation for list items, `aria-label` on search input, focus visible rings.

### Backend Enforcement Rules (Mandatory)

- `ContactoEntity.Id`: `Guid` (UUID) — mandatory PK, `Guid.NewGuid()` default.
- `CreatedAt` / `UpdatedAt`: `DateTimeOffset` — NEVER `DateTime`.
- `ClienteId`: `Guid?` (nullable) — ON DELETE SET NULL to preserve orphan contacts per FR23.
- `ApplySnakeCaseNaming()` must be the LAST call in `OnModelCreating` (already in `AppDbContext`).
- Indexes: `ix_contactos_email` on `Email`, `ix_contactos_cliente_id` on `ClienteId`.
- FK constraint: `fk_contactos_clientes` with ON DELETE SET NULL.
- EF Core auto-maps `ContactoEntity` → table `contactos`, `ClienteId` → column `cliente_id`, etc.
- `GET /api/v1/contactos` returns direct JSON array (no wrapper object).
- Error responses: Problem Details RFC 7807 via `ExceptionHandlingMiddleware` (already wired in Story 1.3).
- API documentation: Scalar at `/scalar` (already wired — do NOT add Swagger).

### Learnings from Story 2.1 (Client List & Search — directly analogous)

1. `ExceptionHandlingMiddleware.cs` uses `JsonSerializer.Serialize` + `WriteAsync` (not `WriteAsJsonAsync`) to control `Content-Type: application/problem+json` — do not change this pattern.
2. Domain `IContactoRepository.cs` must return `IEnumerable<ContactoEntity>` (not DTOs) — Application layer cannot be referenced from Domain (Clean Architecture boundary).
3. Integration tests must use per-test instances with unique DB names to prevent data leakage across tests (see `InMemoryClienteFactory` pattern in Story 2.1).
4. `@/` path alias is already configured in `vite.config.ts` and `tsconfig.json` — use it.
5. The `_app/contactos.tsx` route was scaffolded as a placeholder in Story 1.2 — update it to render `ContactoListView` instead of placeholder content.
6. Update navigation tests in `frontend/src/routes/__tests__/` to add MSW stub for `GET /api/v1/contactos` if navigation tests render the contacts route.
7. siesa-ui-kit does not export `EmptyState` or `ErrorPanel` — the shared custom components from Story 2.1 should be reused as-is.

### Project Structure Notes

Files to create or verify in this story:

**Backend:**
```
backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs
backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs
backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs
backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs
backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs
backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs
backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs
backend/src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_AddContactosTable.cs
backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs
backend/tests/SiesaAgents.UnitTests/Application/Contactos/GetContactosQueryHandlerTests.cs
backend/tests/SiesaAgents.IntegrationTests/ContactoEndpointsTests.cs
```

**Frontend:**
```
frontend/src/modules/crm/contactos/domain/Contacto.ts
frontend/src/modules/crm/contactos/domain/IContactoRepository.ts
frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
frontend/src/modules/crm/contactos/application/useContactos.ts
frontend/src/modules/crm/contactos/application/useContactos.test.ts
frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx
frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx
```

**Files to update:**
```
backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs    ← add DbSet<ContactoEntity>
backend/src/SiesaAgents.API/Program.cs                         ← register IContactoRepository + ContactoEndpoints
frontend/src/routes/_app/contactos.tsx                         ← replace placeholder with ContactoListView
```

**Files to verify (reuse from Story 2.1):**
```
frontend/src/shared/components/EmptyState.tsx
frontend/src/shared/components/ErrorPanel.tsx
frontend/src/shared/lib/apiClient.ts
frontend/src/shared/lib/queryClient.ts
```

### API Contract

```
GET /api/v1/contactos
Response 200 OK — Content-Type: application/json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "nombre": "Juan Pérez",
    "cargo": "Gerente Comercial",
    "telefono": "3001234567",
    "email": "juan.perez@empresa.com",
    "clienteId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-06-25T10:30:00Z",
    "updatedAt": "2026-06-25T10:30:00Z"
  },
  {
    "id": "650e8400-e29b-41d4-a716-446655440002",
    "nombre": "María García",
    "cargo": "Directora de Ventas",
    "telefono": "3107654321",
    "email": "m.garcia@freelance.com",
    "clienteId": null,
    "createdAt": "2026-06-25T09:00:00Z",
    "updatedAt": "2026-06-25T09:00:00Z"
  }
]
Response 200 OK — empty array when no contacts: []
Response 500 — Problem Details RFC 7807 on server error
```

### Test Risk Mitigations (from Epic 3 Test Design)

- **R-001 (PERF)**: Performance test seeds 1,000 contacts and measures debounced filter render time < 1,000ms using `performance.now()`. If threshold exceeded, escalate to server-side search endpoint.
- **R-008 (OPS)**: E2E test intercepts `GET /api/v1/contactos` with forced 500; asserts `ErrorPanel` + "Reintentar" visible; retry triggers re-fetch.
- **R-009 (BUS)**: Component test renders `ContactoListView` with empty array; asserts `EmptyState` rendered.

### References

- Architecture: routing `/contactos` → `ContactosView`, `ContactoListView.tsx` standalone list [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- TanStack Query key `['contactos']` and client-side filter strategy [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- `ContactoEntity` fields and EF Core mapping (nullable `ClienteId`, ON DELETE SET NULL) [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- `GET /api/v1/contactos` endpoint contract [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- FR10 (Listar contactos), FR11 (Buscar por nombre/email), FR12 (Ver detalle contacto) [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.1`]
- NFR1 (Búsqueda < 1 segundo con 1,000 registros) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- AC-E3.2 (búsqueda en < 1 segundo) [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Acceptance Criteria (QA Validation)`]
- EmptyState + ErrorPanel component names [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.1`]
- siesa-ui-kit P0 mandatory rule [Source: `_bmad-output/planning-artifacts/architecture.md#Corporate Standards Applied`]
- R-001 PERF risk (1,000 records search performance) [Source: `_bmad-output/test-design-epic-3.md#Risk Assessment`]
- Story 2.1 learnings (analogous implementation pattern) [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes`]
- Company standards: DateTimeOffset, UUID PKs, snake_case DB, Scalar, Problem Details [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed pre-existing build error in `CreateClienteCommandHandlerEdgeCaseTests.cs`: `FakeEdgeRepository` was missing `UpdateAsync` and `DeleteAsync` implementations of `IClienteRepository`.
- `ContactoConfiguration.cs`: Initial FK configuration using string type name failed; fixed to use generic `HasOne<ClienteEntity>()`.

### Completion Notes List

- All 10 tasks implemented following Clean Architecture pattern analogous to Story 2.1 (clientes).
- EF Core migration `AddContactosTable` generated with FK `fk_contactos_clientes` → `clientes.id` ON DELETE SET NULL.
- Navigation tests updated: MSW stub for `/api/v1/contactos` added, placeholder assertions replaced with `ContactoListView` assertions.
- siesa-ui-kit checked: does not export EmptyState/ErrorPanel — reused existing shared custom components from Story 2.1.
- Performance test (NFR1/R-001): 1,000 records filter completes under 1,000ms.
- WCAG 2.1 AA: structural checks via RTL (aria-label, role="listbox", role="option", tabIndex=0).

### File List

**Created:**
- `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs`
- `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
- `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs`
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs`
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260625142XXX_AddContactosTable.cs` (generated)
- `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Contactos/GetContactosQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ContactoEndpointsTests.cs`
- `frontend/src/modules/crm/contactos/domain/Contacto.ts`
- `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
- `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
- `frontend/src/modules/crm/contactos/application/useContactos.ts`
- `frontend/src/modules/crm/contactos/application/useContactos.test.ts`
- `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx`

**Modified:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — added `DbSet<ContactoEntity> Contactos` and `ContactoConfiguration`
- `backend/src/SiesaAgents.API/Program.cs` — registered `IContactoRepository`, `ContactoRepository`, `GetContactosQueryHandler`, mapped `ContactoEndpoints`
- `frontend/src/routes/_app/contactos.tsx` — replaced placeholder with `ContactoListView`
- `frontend/src/routes/__tests__/navigation.test.tsx` — added MSW stub for `/api/v1/contactos`, updated assertions for Story 3.1
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerEdgeCaseTests.cs` — fixed pre-existing build error (missing interface members)
