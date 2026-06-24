# Story 3.2: Contact Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a contact by selecting them from the list,
so that I can review all their information at once.

## Acceptance Criteria

1. **Given** the contact list is displayed, **When** the user clicks on a contact item, **Then** the contact detail view shows all fields: Nombre, Cargo, Teléfono, Email (FR13), **And** the URL updates to `/contactos/:contactoId` via TanStack Router client-side navigation without a full page reload (FR30).

2. **Given** the user accesses `/contactos/:contactoId` directly via URL, **When** the page loads, **Then** the correct contact details are fetched from `GET /api/v1/contactos/{id}` and displayed.

3. **Given** a `contactoId` in the URL does not exist (backend returns 404), **When** the page loads, **Then** a not-found message is displayed gracefully (e.g., "Contacto no encontrado.") — no unhandled error, no stack trace (NFR6).

4. **Given** the backend is unavailable when fetching the contact detail, **When** the fetch fails (network error or non-2xx non-404 response), **Then** an `ErrorPanel` component with a "Reintentar" button is displayed, **And** clicking "Reintentar" triggers a new fetch attempt.

5. **Given** the contact detail is loading from the API, **When** the fetch is in-flight, **Then** a skeleton loader (via `react-loading-skeleton`, 4 rows matching the 4 visible fields) is rendered — no spinner.

## Tasks / Subtasks

- [ ] Task 1 — Extend `IContactoRepository` domain contract for single-contact fetch (AC: #2)
  - [ ] Add `getById(id: string): Promise<Contacto>` method to `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`

- [ ] Task 2 — Implement `getById` in infrastructure API repository (AC: #2)
  - [ ] Add `getById(id: string)` implementation to `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
  - [ ] Use `apiClient.get<Contacto>(`/api/v1/contactos/${id}`)` and return `response.data`

- [ ] Task 3 — Create `useContacto(id)` application-layer hook (AC: #2, #4, #5)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContacto.ts`
  - [ ] Use `useQuery({ queryKey: ['contactos', id], queryFn: () => contactoApiRepository.getById(id!), enabled: !!id })`
  - [ ] Export `{ data, isLoading, isError, error, refetch }`

- [ ] Task 4 — Create `ContactoDetailView` presentation component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
  - [ ] Accept prop `contactoId: string`
  - [ ] Call `useContacto(contactoId)` hook
  - [ ] Render skeleton (`react-loading-skeleton`, 4 rows) while `isLoading === true`
  - [ ] Render `<ErrorPanel onRetry={refetch} />` when `isError === true` and error is NOT 404
  - [ ] Render "Contacto no encontrado." when error is 404 (`(error as AxiosError)?.response?.status === 404`); add `data-testid="contacto-not-found"`
  - [ ] Render complete contact details when data is available: Nombre, Cargo, Teléfono, Email
  - [ ] All field labels in Spanish: "Nombre", "Cargo", "Teléfono", "Email"
  - [ ] Wrap in `<section aria-label="Detalle del contacto">` for WCAG 2.1 AA compliance
  - [ ] Add `data-testid="contacto-detail-view"` to root element
  - [ ] Add `data-testid="contacto-detail-nombre"`, `data-testid="contacto-detail-cargo"`, `data-testid="contacto-detail-telefono"`, `data-testid="contacto-detail-email"` to field value elements
  - [ ] Check siesa-ui-kit catalog FIRST before creating any custom sub-component

- [ ] Task 5 — Wire `ContactoDetailView` into the `contactos.$contactoId.tsx` route (AC: #1, #2)
  - [ ] Replace stub in `frontend/src/routes/_app/contactos.$contactoId.tsx` (currently renders `null`) with functional component
  - [ ] Use `createFileRoute('/_app/contactos/$contactoId')` with `Route.useParams()` to extract `contactoId`
  - [ ] Render `<ContactoDetailView contactoId={contactoId} />`
  - [ ] The parent route `contactos.tsx` uses the full-page `ContactoListView` layout — verify `/contactos/:contactoId` route renders the detail view in context (full-page layout, not a split panel)

- [ ] Task 6 — Backend: Extend `IContactoRepository` and `ContactoRepository` with `GetByIdAsync` (AC: #2, #3)
  - [ ] Add `Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
  - [ ] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` using `AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)`

- [ ] Task 7 — Backend: Create `GetContactoByIdQuery` and handler (AC: #2, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQuery.cs`: `public record GetContactoByIdQuery(Guid Id);`
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs`:
    - Inject `IContactoRepository`
    - Return `ContactoDto` mapped from `ContactoEntity`
    - Throw `NotFoundException` when contact not found — existing `ExceptionHandlingMiddleware` converts to 404 Problem Details
    - Use `AsNoTracking()` (enforced in repository implementation)

- [ ] Task 8 — Backend: Add `GET /api/v1/contactos/{id}` endpoint (AC: #2, #3)
  - [ ] Add `GET /api/v1/contactos/{id:guid}` to `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` (extend existing file, do NOT recreate)
  - [ ] Handler dispatches `GetContactoByIdQuery` and returns `Results.Ok(contactoDto)`
  - [ ] Status codes: 200 (success), 404 (NotFoundException → Problem Details via middleware), 500 (unhandled → middleware)
  - [ ] Register `GetContactoByIdQueryHandler` in `backend/src/SiesaAgents.API/Program.cs` DI
  - [ ] Add `.WithName("GetContactoById").WithSummary("Get contact by ID")` for Scalar docs

- [ ] Task 9 — Frontend unit tests (AC: #1–#5)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContacto.test.ts`
    - Test: returns contact data on successful fetch (MSW handler for `GET /api/v1/contactos/:id`)
    - Test: `isLoading` is true while fetching
    - Test: `isError` is true on API failure (500)
    - Test: query is disabled when `id` is undefined
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx`
    - Test: renders skeleton (4 rows) during loading
    - Test: renders "Contacto no encontrado." on 404 response
    - Test: renders `ErrorPanel` with "Reintentar" on 500 response
    - Test: renders Nombre, Cargo, Teléfono, Email field values when data is available
    - Test: all `data-testid` attributes are present on rendered fields
    - Test: `<section aria-label="Detalle del contacto">` wrapper present (accessibility)
    - Test: clicking "Reintentar" in `ErrorPanel` calls `refetch`
  - [ ] All tests: Vitest + RTL + MSW; Arrange / Act / Assert; coverage target > 80%

- [ ] Task 10 — Backend unit and integration tests (AC: #2, #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Contactos/GetContactoByIdQueryHandlerTests.cs`
    - Test: returns `ContactoDto` when contact exists
    - Test: throws `NotFoundException` when contact not found
    - Test: uses `AsNoTracking` (verify `ChangeTracker.Entries()` is empty)
  - [ ] Add to `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ContactoEndpointsTests.cs`
    - Test: `GET /api/v1/contactos/{id}` returns 200 + correct JSON for seeded contact
    - Test: `GET /api/v1/contactos/{id}` returns 404 Problem Details for nonexistent ID
    - Test: response shape includes camelCase fields (id, nombre, cargo, telefono, email, clienteId, createdAt, updatedAt)
  - [ ] Use xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL (integration); Arrange / Act / Assert

## Dev Notes

### Architecture Context

This story is **full-stack** — both frontend and backend changes are required. Story 3.2 makes the `contactos.$contactoId.tsx` stub route (created in Story 3.1) functional by implementing `ContactoDetailView` and the `GET /api/v1/contactos/{id}` endpoint.

**Critical dependency from Story 3.1:**
- `frontend/src/routes/_app/contactos.$contactoId.tsx` — stub exists, renders `null`. This story replaces it with the functional detail view.
- `frontend/src/modules/crm/contactos/domain/Contacto.ts` — entity interface already exists (reuse as-is).
- `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — singleton exported; extend with `getById`.
- `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs` — already exists from Story 3.1 (reuse).
- `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` — exists with `GetAllAsync`; extend with `GetByIdAsync`.
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — exists; extend with `GetByIdAsync`.
- `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — exists with `GET /api/v1/contactos`; extend with `GET /api/v1/contactos/{id}`.
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` — exists from Story 1.3. Use in `GetContactoByIdQueryHandler`.
- `ExceptionHandlingMiddleware` already maps `NotFoundException` → 404 Problem Details. No middleware changes needed.

**Layout note:** The `/contactos` route renders `ContactoListView` as a full-page standalone table (not a split panel like `/clientes`). When the user clicks a contact and navigates to `/contactos/:contactoId`, the detail view replaces the list on the page. This is consistent with Story 3.1's design — verify the actual routing behavior in `contactos.tsx` before implementing. If `ContactoListView` is inside `<Outlet />` or if the route is flat, align accordingly.

**No placeholder state needed:** Unlike Story 2.2 (clientes), there is no "Selecciona un contacto" placeholder — the contacts list is navigated away from when detail is viewed.

### MasterCrud Assessment

Story 3.2 is a **read-only detail view** — NOT a CRUD grid or form. `MasterCrud` is NOT applicable here. The view renders static field/value pairs for a single contact. `MasterCrud` will be evaluated for Stories 3.3–3.5 (create/edit/delete forms).

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check siesa-ui-kit catalog FIRST before creating any custom component.
- **Loading states**: Use `react-loading-skeleton` — skeleton screens, NOT spinners. Match 4 skeleton rows to the 4 visible fields (Nombre, Cargo, Teléfono, Email).
- **Icons**: Heroicons (primary), Font Awesome 6.5+ (secondary).
- **Brand Colors**: Primary `#0e79fd` (Siesa Blue) — use Tailwind `primary-*` tokens.
- **All user-facing text in Spanish** — field labels, empty states, error messages, ARIA labels.
- **WCAG 2.1 AA**: `<section aria-label="Detalle del contacto">` wrapper; all labels and interactive elements accessible via keyboard.

### Frontend: `useContacto` Hook Pattern

```typescript
// frontend/src/modules/crm/contactos/application/useContacto.ts
import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContacto(id: string | undefined) {
  return useQuery({
    queryKey: ['contactos', id],
    queryFn: () => contactoApiRepository.getById(id!),
    enabled: !!id,
  })
}
```

Canonical query key `['contactos', id]` is defined in `architecture.md` — use it exactly.

### Frontend: 404 vs Generic Error Differentiation

```typescript
// In ContactoDetailView.tsx
import type { AxiosError } from 'axios'

const isNotFound = isError && (error as AxiosError)?.response?.status === 404

if (isLoading) {
  return <SkeletonRows count={4} />
}
if (isNotFound) {
  return <p data-testid="contacto-not-found">Contacto no encontrado.</p>
}
if (isError) {
  return <ErrorPanel onRetry={refetch} />
}
```

### Frontend: Module File Structure

```
frontend/src/modules/crm/contactos/
├── domain/
│   ├── Contacto.ts                     ← UNCHANGED (exists)
│   └── IContactoRepository.ts          ← MODIFY: add getById signature
├── application/
│   ├── useContactos.ts                 ← UNCHANGED
│   └── useContacto.ts                  ← CREATE
├── infrastructure/
│   └── contactoApiRepository.ts        ← MODIFY: add getById implementation
└── presentation/
    ├── ContactoListView.tsx             ← UNCHANGED
    └── ContactoDetailView.tsx           ← CREATE

frontend/src/routes/_app/
└── contactos.$contactoId.tsx           ← MODIFY: replace null stub with ContactoDetailView
```

### Backend: `GetContactoByIdQueryHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs
public class GetContactoByIdQueryHandler
{
    private readonly IContactoRepository _repository;

    public GetContactoByIdQueryHandler(IContactoRepository repository)
    {
        _repository = repository;
    }

    public async Task<ContactoDto> HandleAsync(GetContactoByIdQuery query, CancellationToken ct)
    {
        var contacto = await _repository.GetByIdAsync(query.Id, ct);

        if (contacto is null)
            throw new NotFoundException($"Contacto with id '{query.Id}' was not found.");

        return new ContactoDto(
            contacto.Id,
            contacto.Nombre,
            contacto.Cargo,
            contacto.Telefono,
            contacto.Email,
            contacto.ClienteId,
            contacto.CreatedAt,
            contacto.UpdatedAt
        );
    }
}
```

### Backend: `GET /api/v1/contactos/{id}` Endpoint Pattern

```csharp
// In ContactoEndpoints.cs — add alongside existing GET /api/v1/contactos
app.MapGet("/api/v1/contactos/{id:guid}", async (
    Guid id,
    GetContactoByIdQueryHandler handler,
    CancellationToken ct) =>
{
    var result = await handler.HandleAsync(new GetContactoByIdQuery(id), ct);
    return Results.Ok(result);
})
.WithName("GetContactoById")
.WithSummary("Get contact by ID");
// Note: NotFoundException is caught by ExceptionHandlingMiddleware → 404 Problem Details
```

Register `GetContactoByIdQueryHandler` in `Program.cs` DI alongside existing handler registrations.

### API Response Shape (from architecture.md)

```
GET /api/v1/contactos/{id}
  → 200 OK: { "id": "uuid", "nombre": "...", "cargo": "...", "telefono": "...", "email": "...", "clienteId": null|"uuid", "createdAt": "...", "updatedAt": "..." }
  → 404 Not Found: Problem Details RFC 7807 { "status": 404, "title": "Not Found", "detail": "Contacto with id '...' was not found." }
  → 500 Internal Server Error: Problem Details RFC 7807
```

### Testing Standards Summary

**Frontend:** Vitest + React Testing Library + MSW. Use MSW handlers for `GET /api/v1/contactos/:id` returning success, 404, and 500. Tests co-located alongside source files. Coverage target > 80%.

**Backend:** xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL (integration). All tests: Arrange / Act / Assert. Coverage target > 80%.

### Project Structure Notes

- `frontend/src/shared/lib/apiClient.ts` — Axios singleton (Story 1.1). Import from this path — do NOT recreate.
- `frontend/src/shared/components/ErrorPanel.tsx` — already exists from Story 2.1. Reuse as-is.
- `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs` — already exists from Story 3.1. Reuse as-is.
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` — exists from Story 1.3. Use in handler.
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already maps `NotFoundException` → 404 Problem Details (Story 1.3). No changes needed.
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — has `DbSet<ContactoEntity> Contactos` from Story 3.1. No changes needed.
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ContactoEndpointsTests.cs` — already exists from Story 3.1; extend it with new test cases (do NOT recreate).

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.2]
- Epic objectives and FR13 (Ver detalle contacto), FR30 (deep linking): [Source: _bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Epic 3]
- Frontend module structure: [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- TanStack Query keys canonical (['contactos', id]): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- REST endpoints contract (GET /api/v1/contactos/{id}): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- API response shapes (direct object, Problem Details): [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- Entity pattern (private ctor + factory, NotFoundException): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- DateTimeOffset, UUID PKs: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- EF Core AsNoTracking for read queries: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- MasterCrud reference (not applicable for read-only detail view): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Story 3.1 dev notes (pre-existing domain, repo, endpoint, DTOs, stub route): [Source: _bmad-output/implementation-artifacts/3-1-contact-list-search.md]
- Story 2.2 dev notes (detail view pattern, 404 vs generic error, outlet vs flat routing): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Story 1.3 dev notes (NotFoundException, ExceptionHandlingMiddleware): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- NFR6 no stack traces: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- R-005 (deep link 404 graceful handling): [Source: _bmad-output/test-design-epic-3.md#Risk Assessment]
- Enforcement guidelines (anti-patterns): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
