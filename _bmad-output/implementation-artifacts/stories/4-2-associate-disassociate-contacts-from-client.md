# Story 4.2: Associate & Disassociate Contacts from Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to associate existing contacts to a client and disassociate them directly from the client detail view,
So that I can manage the client's contact relationships without navigating away.

## Acceptance Criteria

1. **Given** the user is in the client detail view, **When** the user uses the ContactManager to add an existing contact, **Then** the contact is linked to the client immediately and appears in the ContactManager list (FR17, FR19, FR27) **And** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: uuid }` **And** queryKeys `['contactos']` and `['contactos', { clienteId }]` are both invalidated.

2. **Given** the user creates a new contact from within the ContactManager, **When** the contact is created, **Then** the new contact is automatically associated with the current client (FR18) **And** the contact appears in the ContactManager list immediately.

3. **Given** the user disassociates a contact from the client via ContactManager, **When** the disassociation is confirmed, **Then** the contact is removed from the ContactManager list immediately (FR20, FR27) **And** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: null }` **And** the contact record still exists and is accessible from `/contactos`.

## Tasks / Subtasks

- [x] Task 1 — Backend: implement `PUT /api/v1/contactos/{id}/cliente` endpoint (AC: 1, 2, 3)
  - [x] Add `AssignClienteToContactoCommand.cs` in `backend/src/SiesaAgents.Application/Contactos/Commands/` — record with `Guid ContactoId` and `Guid? ClienteId` parameters
  - [x] Add `AssignClienteToContactoCommandHandler.cs` — fetches contact by id (throws domain exception → 404 if not found), sets `ClienteId`, calls `IContactoRepository.UpdateAsync(contact, ct)`, returns `ContactoDto`
  - [x] Add `AssignClienteToContactoValidator.cs` (FluentValidation) — validates `ContactoId` is non-empty Guid; `ClienteId` is either null or a non-empty Guid
  - [x] Add `AssignClienteToContactoRequest.cs` DTO in `backend/src/SiesaAgents.Application/Contactos/DTOs/` — `record` with `Guid? ClienteId`
  - [x] Add `AssignClienteId(Guid? clienteId)` domain method to `ContactoEntity.cs` — sets `ClienteId = clienteId; UpdatedAt = DateTimeOffset.UtcNow;`
  - [x] Add `UpdateAsync(ContactoEntity contacto, CancellationToken ct): Task` to `IContactoRepository` interface — already present from Story 3.x
  - [x] Implement `UpdateAsync` in `ContactoRepository.cs` — already implemented from Story 3.x
  - [x] Add `PUT /{id}/cliente` endpoint in `ContactoEndpoints.cs` — accepts `AssignClienteToContactoRequest` body, validates with `AssignClienteToContactoValidator`, dispatches `AssignClienteToContactoCommandHandler`, returns `Results.Ok(contactoDto)` on success, `Results.NotFound(problemDetails)` on not-found
  - [x] Register `AssignClienteToContactoCommandHandler` and `AssignClienteToContactoValidator` in `Program.cs` DI

- [x] Task 2 — Frontend: implement `useAssignClienteToContacto` mutation hook (AC: 1, 3)
  - [x] Create `frontend/src/modules/crm/contactos/application/useAssignClienteToContacto.ts`
  - [x] Uses `useMutation` — `mutationFn`: calls `contactoApiRepository.assignCliente(contactoId, clienteId)` (where `clienteId` is `string | null`)
  - [x] `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['contactos'] })` AND `queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId }] })` for the active client
  - [x] `onError`: `toast.error('No se pudo actualizar la asociación. Intenta de nuevo.')`
  - [x] Add `assignCliente(contactoId: string, clienteId: string | null): Promise<Contacto>` to `IContactoRepository` interface (`frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`)
  - [x] Implement `assignCliente` in `contactoApiRepository.ts` → `PUT /api/v1/contactos/{contactoId}/cliente` with body `{ clienteId }`

- [x] Task 3 — Frontend: extend `ClienteContactServiceAdapter` with `assignContacto` and `removeContacto` methods (AC: 1, 2, 3)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts`
  - [x] Add `assignContacto(contactoId: string): Promise<void>` — calls `PUT /api/v1/contactos/{contactoId}/cliente` with `{ clienteId: this.clienteId }` via `apiClient`, then triggers invalidation and shows success toast
  - [x] Add `removeContacto(contactoId: string): Promise<void>` — calls `PUT /api/v1/contactos/{contactoId}/cliente` with `{ clienteId: null }` via `apiClient`, then triggers invalidation and shows success toast
  - [x] Constructor accepts `queryClient: QueryClient` as second arg; calls `queryClient.invalidateQueries` within `assignContacto` and `removeContacto`

- [x] Task 4 — Frontend: update `ClienteDetailView` to wire mutation callbacks into ContactManager (AC: 1, 2, 3)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [x] Instantiate `ClienteContactServiceAdapter` with `clienteId` and `queryClient` (from `useQueryClient()`)
  - [x] Toast success messages placed in adapter methods `assignContacto` and `removeContacto`
  - [x] `useMemo` dependency array updated to `[clienteId, queryClient]`

- [x] Task 5 — Frontend: extend `ClientesPage` POM with association/disassociation locators (AC: 1, 2, 3)
  - [x] Update `e2e/pages/clientes.page.ts` — added `btnDesasociarContacto` locator; updated `btnAgregarContacto` regex to include "asociar contacto"

- [x] Task 6 — Write E2E tests (AC: 1, 2, 3)
  - [x] Added to `e2e/tests/asociacion/asociacion-contactmanager.spec.ts` — Story 4.2 scope: E2E-AC-04, E2E-AC-05, E2E-AC-06, E2E-AC-07, E2E-AC-08, E2E-AC-09 (already present from ATDD phase)

- [x] Task 7 — Write API integration tests (AC: 1, 2, 3)
  - [x] Added to `e2e/tests/asociacion/asociacion-api.spec.ts` — Story 4.2 scope: API-AC-01, API-AC-02, API-AC-03, API-AC-04, API-AC-08, API-AC-09, API-AC-10

- [x] Task 8 — Write backend unit tests (AC: 1, 2, 3)
  - [x] Created `backend/tests/SiesaAgents.UnitTests/Handlers/AssignClienteCommandHandlerTests.cs` — UNIT-B-AC-01, UNIT-B-AC-02, UNIT-B-AC-03

- [x] Task 9 — Write frontend unit tests (AC: 1, 2, 3)
  - [x] Added UNIT-AC-02 and UNIT-AC-03 to `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`

## Dev Notes

### Architecture Context

Story 4.2 extends the infrastructure laid by Story 4.1. The `ClienteDetailView`, `ClienteContactServiceAdapter`, and `useContactosByCliente` hook are already in place. This story adds write operations (association and disassociation) to the existing read-only adapter.

**Key integration point (from architecture.md):**

```
PUT /api/v1/contactos/{id}/cliente
  body: { clienteId: uuid }  → associate
  body: { clienteId: null }  → disassociate
  response: 200 OK + ContactoDto (updated object)
```

**Dual query key invalidation is mandatory (Risk R1 from test-design-epic-4.md):**

```typescript
// Both keys must be invalidated after EVERY association/disassociation mutation
queryClient.invalidateQueries({ queryKey: ['contactos'] })               // global /contactos list
queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId }] }) // ContactManager for this client
```

Failing to invalidate both keys will cause stale UI and violates FR27 (immediate visibility for all users).

**Depends on:**
- Story 4.1 — `ClienteDetailView`, `ClienteContactServiceAdapter`, `useContactosByCliente`, `contactoApiRepository.getByClienteId`, `IContactoRepository.getByClienteId` all present
- Story 3.1 — `ContactoEntity`, `IContactoRepository`, `ContactoRepository`, `Contacto` TypeScript interface
- Story 2.2 — `useClienteById`, `clientes.$clienteId.tsx` route

**Provides for:** Story 4.3 (navigate to contact detail via ContactManager), Story 4.6 (reassign contact to different client) which extend the same `PUT /api/v1/contactos/{id}/cliente` endpoint.

### Frontend File Locations

```
frontend/src/
  modules/crm/
    clientes/
      presentation/
        ClienteDetailView.tsx               # Updated: wire mutation callbacks from adapter
        ClienteContactServiceAdapter.ts     # Updated: add assignContacto(), removeContacto()
      __tests__/
        ClienteContactServiceAdapter.test.ts # Updated: UNIT-AC-02, UNIT-AC-03
    contactos/
      domain/
        IContactoRepository.ts              # Updated: add assignCliente(contactoId, clienteId)
      application/
        useAssignClienteToContacto.ts       # NEW: mutation hook — invalidates both ['contactos'] and ['contactos', { clienteId }]
      infrastructure/
        contactoApiRepository.ts            # Updated: add assignCliente(contactoId, clienteId)

e2e/
  tests/
    asociacion/
      asociacion-contactmanager.spec.ts     # Updated: E2E-AC-04, E2E-AC-05, E2E-AC-06, E2E-AC-07, E2E-AC-08, E2E-AC-09
      asociacion-api.spec.ts                # Updated: API-AC-01 to API-AC-04, API-AC-08, API-AC-09, API-AC-10
```

### Backend File Locations

```
backend/src/
  SiesaAgents.Domain/Contactos/
    Entities/
      ContactoEntity.cs                     # Updated: add AssignClienteId(Guid? clienteId) domain method
    Interfaces/
      IContactoRepository.cs                # Updated: add UpdateAsync if not present
  SiesaAgents.Application/Contactos/
    Commands/
      AssignClienteToContactoCommand.cs     # NEW: record with ContactoId + ClienteId?
      AssignClienteToContactoCommandHandler.cs # NEW: fetches contact, calls AssignClienteId, updates
    DTOs/
      AssignClienteToContactoRequest.cs     # NEW: record with Guid? ClienteId
    Validators/
      AssignClienteToContactoValidator.cs   # NEW: FluentValidation
  SiesaAgents.Infrastructure/Repositories/
    ContactoRepository.cs                   # Updated: implement UpdateAsync if not present
  SiesaAgents.API/
    Endpoints/
      ContactoEndpoints.cs                  # Updated: add PUT /{id}/cliente route
    Program.cs                              # Updated: register new handler and validator

backend/tests/
  SiesaAgents.UnitTests/Handlers/
    AssignClienteCommandHandlerTests.cs     # NEW: UNIT-B-AC-01, UNIT-B-AC-02, UNIT-B-AC-03
```

### `useAssignClienteToContacto` Hook Pattern

```typescript
// frontend/src/modules/crm/contactos/application/useAssignClienteToContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import { toast } from 'sonner'

export function useAssignClienteToContacto(clienteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactoId, newClienteId }: { contactoId: string; newClienteId: string | null }) =>
      contactoApiRepository.assignCliente(contactoId, newClienteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      if (clienteId) {
        queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId }] })
      }
    },
    onError: () => {
      toast.error('No se pudo actualizar la asociación. Intenta de nuevo.')
    },
  })
}
```

### `ClienteContactServiceAdapter` Extended Pattern

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts
import type { QueryClient } from '@tanstack/react-query'
import { apiClient } from '../../../../shared/lib/apiClient'
import type { IContactServiceAdapter } from 'siesa-ui-kit'

export class ClienteContactServiceAdapter implements IContactServiceAdapter {
  constructor(
    private readonly clienteId: string,
    private readonly queryClient: QueryClient,
  ) {}

  async getByRecordId() {
    const response = await apiClient.get(`/api/v1/contactos?clienteId=${this.clienteId}`)
    return response.data
  }

  async assignContacto(contactoId: string): Promise<void> {
    await apiClient.put(`/api/v1/contactos/${contactoId}/cliente`, { clienteId: this.clienteId })
    this.queryClient.invalidateQueries({ queryKey: ['contactos'] })
    this.queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: this.clienteId }] })
  }

  async removeContacto(contactoId: string): Promise<void> {
    await apiClient.put(`/api/v1/contactos/${contactoId}/cliente`, { clienteId: null })
    this.queryClient.invalidateQueries({ queryKey: ['contactos'] })
    this.queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: this.clienteId }] })
  }
}
```

### `ClienteDetailView` Update Pattern

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx — updated
import { useQueryClient } from '@tanstack/react-query'
import { ClienteContactServiceAdapter } from './ClienteContactServiceAdapter'

export function ClienteDetailView({ clienteId }: Props) {
  const queryClient = useQueryClient()
  // Memoize adapter to avoid re-instantiation on every render
  const adapter = useMemo(
    () => new ClienteContactServiceAdapter(clienteId, queryClient),
    [clienteId, queryClient],
  )
  // ... rest of component unchanged
}
```

### Backend: `AssignClienteToContactoCommandHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/AssignClienteToContactoCommandHandler.cs
namespace SiesaAgents.Application.Contactos.Commands;

public class AssignClienteToContactoCommandHandler(IContactoRepository repository)
{
    public async Task<ContactoDto> HandleAsync(AssignClienteToContactoCommand command, CancellationToken ct)
    {
        var contacto = await repository.GetByIdAsync(command.ContactoId, ct)
            ?? throw new NotFoundException($"Contacto {command.ContactoId} no encontrado.");

        contacto.AssignClienteId(command.ClienteId);
        await repository.UpdateAsync(contacto, ct);

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

### Backend: `ContactoEntity.AssignClienteId` Domain Method

```csharp
// Addition to ContactoEntity.cs
public void AssignClienteId(Guid? clienteId)
{
    ClienteId = clienteId;
    UpdatedAt = DateTimeOffset.UtcNow;
}
```

### Backend: `PUT /{id}/cliente` Endpoint

```csharp
// Addition to ContactoEndpoints.cs
group.MapPut("/{id:guid}/cliente", async (
    Guid id,
    AssignClienteToContactoRequest request,
    AssignClienteToContactoCommandHandler handler,
    IValidator<AssignClienteToContactoRequest> validator,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());

    var result = await handler.HandleAsync(
        new AssignClienteToContactoCommand(id, request.ClienteId), ct);
    return Results.Ok(result);
})
.WithName("AssignClienteToContacto")
.Produces<ContactoDto>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status404NotFound)
.ProducesValidationProblem();
```

**Response contract (`PUT /api/v1/contactos/{id}/cliente`) — returns updated contact:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nombre": "María García",
  "cargo": "Gerente Comercial",
  "telefono": "+57 1 234 5679",
  "email": "m.garcia@empresa.com",
  "clienteId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "createdAt": "2026-05-21T10:30:00Z",
  "updatedAt": "2026-05-21T10:35:00Z"
}
```

For disassociation, `clienteId` will be `null`.

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/asociacion/asociacion-contactmanager.spec.ts` (Story 4.2 additions):**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-AC-04 | P0 | AC1 | Associating an existing contact via ContactManager adds it to the ContactManager list immediately (no reload) |
| E2E-AC-05 | P0 | AC3 | Disassociating a contact via ContactManager removes it from the list immediately; contact still exists in `/contactos` |
| E2E-AC-06 | P0 | AC1, AC3 | After association/disassociation, ContactManager list updates without page refresh |
| E2E-AC-07 | P1 | AC2 | Creating a new contact from within ContactManager auto-associates it with the current client and appears immediately |
| E2E-AC-08 | P1 | AC1 | Success toast "Contacto asociado correctamente" shown after successful association |
| E2E-AC-09 | P1 | AC3 | Success toast "Contacto desasociado correctamente" shown after successful disassociation |

**API Integration Tests — `e2e/tests/asociacion/asociacion-api.spec.ts` (Story 4.2 additions):**

| Test ID | Priority | Description |
|---------|----------|-------------|
| API-AC-01 | P0 | `PUT /api/v1/contactos/{id}/cliente` with valid `{ clienteId: uuid }` returns 200 and body with updated `clienteId` |
| API-AC-02 | P0 | After `PUT /cliente` with valid clienteId, `GET /api/v1/contactos/{id}` returns the contact with the new `clienteId` |
| API-AC-03 | P0 | `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: null }` returns 200 and body with `clienteId: null` (disassociation) |
| API-AC-04 | P0 | After disassociation, `GET /api/v1/contactos/{id}` returns contact with `clienteId: null` (record not deleted) |
| API-AC-08 | P1 | `PUT /api/v1/contactos/{id}/cliente` with non-existent clienteId returns 404 and Problem Details (no stack trace) |
| API-AC-09 | P1 | `PUT /api/v1/contactos/{id}/cliente` with invalid UUID format returns 400 and Problem Details (no stack trace) |
| API-AC-10 | P1 | Delete client → `GET /api/v1/contactos/{contactoId}` returns contact with `clienteId: null` (ON DELETE SET NULL cascade verified) |

**Backend Unit Tests (xUnit) — `backend/tests/SiesaAgents.UnitTests/Handlers/AssignClienteCommandHandlerTests.cs`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| UNIT-B-AC-01 | P1 | `AssignClienteToContactoHandler` sets `ClienteID` on contact and persists when given valid contactoId and valid clienteId |
| UNIT-B-AC-02 | P1 | `AssignClienteToContactoHandler` sets `ClienteID = null` when clienteId is null (disassociation path) |
| UNIT-B-AC-03 | P1 | `AssignClienteToContactoHandler` throws domain exception (→ 404) when contactoId does not exist |

**Frontend Unit Tests (Vitest) — `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| UNIT-AC-02 | P1 | `ClienteContactServiceAdapter.assignContacto(contactoId)` calls `PUT /api/v1/contactos/{contactoId}/cliente` with `{ clienteId }` |
| UNIT-AC-03 | P1 | `ClienteContactServiceAdapter.removeContacto(contactoId)` calls `PUT /api/v1/contactos/{contactoId}/cliente` with `{ clienteId: null }` |

### Key Anti-Patterns to Avoid

```
❌ Invalidating only ['contactos', { clienteId }]              → MUST also invalidate ['contactos'] (dual invalidation mandatory — R1)
❌ Invalidating only ['contactos']                             → MUST also invalidate ['contactos', { clienteId }] (ContactManager won't update)
❌ Calling page.reload() after mutation in E2E tests           → FR27 requires no reload; use query invalidation
❌ Deleting contact on disassociation                          → Set clienteId = null; record must survive (FR20, R3)
❌ English toast messages                                      → "Contacto asociado correctamente" / "Contacto desasociado correctamente"
❌ DateTime in backend                                         → DateTimeOffset mandatory
❌ int/string PK                                               → Guid (UUID) mandatory
❌ [Column("...")] attributes                                  → ApplySnakeCaseNaming() handles mapping automatically
❌ app.UseSwagger()                                            → Scalar only
❌ Re-instantiating ClienteContactServiceAdapter on every render → useMemo with [clienteId, queryClient] dependency
❌ Exposing stack traces in 404/400 responses                  → Problem Details RFC 7807 only (NFR6)
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.2 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "API & Communication Patterns" (`PUT /api/v1/contactos/{id}/cliente`), "State Boundaries" (query keys `['contactos']` and `['contactos', { clienteId }]`), "Process Patterns" (TanStack Query mutation invalidation), "Component Boundaries" (ClienteDetailView → ContactManager → ClienteContactServiceAdapter)
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-4.md` — E2E-AC-04 through E2E-AC-09, API-AC-01 through API-AC-04, API-AC-08 to API-AC-10, UNIT-B-AC-01 to UNIT-B-AC-03, UNIT-AC-02 to UNIT-AC-03, Risk R1 (dual cache invalidation), Risk R3 (disassociation does not delete)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md` — FR17 (associate), FR18 (create auto-associated), FR19 (see contacts in client detail), FR20 (disassociate — clienteId = null), FR27 (immediate visibility)
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack (siesa-ui-kit P0, TanStack Query 5+), Backend Stack (.NET 10, FluentValidation, DateTimeOffset, Guid PKs, Scalar), Database Conventions (ApplySnakeCaseNaming), Backend Critical Rules
- Predecessor stories:
  - `_bmad-output/implementation-artifacts/stories/4-1-view-associated-contacts-in-client-detail.md` — `ClienteDetailView`, `ClienteContactServiceAdapter` (read-only), `useContactosByCliente`, `IContactoRepository.getByClienteId`, story architecture notes

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 9 tasks completed. Backend .NET compilation not verifiable (dotnet SDK not available in environment); file structure and syntax verified manually.
- Frontend TypeScript type check passes (`pnpm tsc --noEmit` exits 0).
- Frontend unit tests: 12/12 pass (UNIT-AC-01 through UNIT-AC-03 + edge cases).
- Pre-existing test failures (staleTime mismatch in queryClient tests) are unrelated to this story.
- `UpdateAsync` and `IContactoRepository.UpdateAsync` were already implemented from prior stories — no changes needed.
- Toast library confirmed as `shared/lib/toastStore` (project-specific Zustand store), not `sonner`.
- E2E tests (contactmanager spec) were pre-authored in ATDD phase and cover E2E-AC-04 through E2E-AC-09.
- API integration tests (API-AC-01 through API-AC-04, API-AC-08, API-AC-09, API-AC-10) added to `asociacion-api.spec.ts`.

### File List

**Backend — New Files:**
- `backend/src/SiesaAgents.Application/Contactos/Commands/AssignClienteToContactoCommand.cs`
- `backend/src/SiesaAgents.Application/Contactos/Commands/AssignClienteToContactoCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Contactos/DTOs/AssignClienteToContactoRequest.cs`
- `backend/src/SiesaAgents.Application/Contactos/Validators/AssignClienteToContactoValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Handlers/AssignClienteCommandHandlerTests.cs`

**Backend — Modified Files:**
- `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs` — added `AssignClienteId(Guid? clienteId)` method
- `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — added `PUT /{id:guid}/cliente` endpoint
- `backend/src/SiesaAgents.API/Program.cs` — registered `AssignClienteToContactoCommandHandler` and `IValidator<AssignClienteToContactoRequest>`

**Frontend — New Files:**
- `frontend/src/modules/crm/contactos/application/useAssignClienteToContacto.ts`

**Frontend — Modified Files:**
- `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — added `assignCliente(contactoId, clienteId)` method
- `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implemented `assignCliente`
- `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts` — added `assignContacto`, `removeContacto`; constructor now requires `QueryClient`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — passes `queryClient` to adapter
- `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts` — added UNIT-AC-02, UNIT-AC-03; updated to pass mock queryClient
- `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.edge.test.ts` — updated to pass mock queryClient

**E2E — Modified Files:**
- `e2e/pages/clientes.page.ts` — added `btnDesasociarContacto` locator
- `e2e/tests/asociacion/asociacion-api.spec.ts` — added Story 4.2 API tests (API-AC-01..04, API-AC-08..10)
