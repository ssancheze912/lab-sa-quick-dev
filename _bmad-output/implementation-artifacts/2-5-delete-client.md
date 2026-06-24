# Story 2.5: Delete Client

Status: ready

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a client record,
so that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears asking "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options.

2. **Given** the user confirms the deletion, **When** the deletion is processed via `DELETE /api/v1/clientes/{id}`, **Then** the client is removed from the list immediately (FR27 — `invalidateQueries(['clientes'])`), **And** the right panel returns to the empty/default state (URL navigates back to `/clientes`), **And** a toast muestra "Cliente eliminado correctamente".

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the client record remains in the system unchanged and no API call is made.

4. **Given** the client being deleted has associated contacts, **When** the deletion is confirmed and processed, **Then** the client record is deleted, **And** all previously associated contacts remain in the system with their data intact, **And** those contacts become unassigned (`cliente_id = NULL` — enforced by `ON DELETE SET NULL` FK constraint in PostgreSQL), **And** the toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

5. **Given** the delete mutation is in-flight, **When** the request is pending, **Then** the "Confirmar" button is disabled and shows "Eliminando..." to prevent duplicate submissions.

6. **Given** the backend returns an unexpected error during deletion, **When** the mutation fails (non-404 error), **Then** an error toast "No se pudo eliminar. Intenta de nuevo." is displayed without exposing technical details (NFR6).

## Tasks / Subtasks

- [ ] Task 1 — Extend domain repository contract with delete operation (AC: #2)
  - [ ] Add `deleteById(id: string): Promise<void>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`

- [ ] Task 2 — Implement `deleteById` in infrastructure API repository (AC: #2)
  - [ ] Add `deleteById(id: string): Promise<void>` to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [ ] Use `apiClient.delete(\`/api/v1/clientes/${id}\`)` — returns void
  - [ ] Axios throws automatically on non-2xx; let it propagate to the mutation handler

- [ ] Task 3 — Create `useDeleteCliente` mutation hook (AC: #2, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
  - [ ] Use `useMutation` from TanStack Query with `mutationFn: (id: string) => clienteApiRepository.deleteById(id)`
  - [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`, then check response context to determine toast message:
    - If the deleted client had contacts (detected via a `hasContacts` flag passed through mutation context, or always show the generic success toast — see Dev Notes for strategy), show `toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')`
    - Default: `toast.success('Cliente eliminado correctamente')`
  - [ ] `onError`: `toast.error('No se pudo eliminar. Intenta de nuevo.')`
  - [ ] Export `{ mutate, isPending }`

- [ ] Task 4 — Wire "Eliminar" button and confirmation dialog into `ClienteDetailView` (AC: #1, #2, #3, #5)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [ ] Add "Eliminar" button (Heroicons `TrashIcon`) in the detail panel header area alongside the existing "Editar" button
  - [ ] Use `AlertDialog` from siesa-ui-kit (consistent with Stories 2.3 and 2.4) to show the confirmation dialog
  - [ ] Dialog title/message: "¿Eliminar este cliente?" with subtitle "Esta acción no se puede deshacer."
  - [ ] Dialog actions: "Confirmar" (primary, destructive style) and "Cancelar" (secondary)
  - [ ] On "Confirmar": call `mutate(cliente.id)` from `useDeleteCliente`
  - [ ] `onSuccess` callback: close dialog and navigate to `/clientes` using TanStack Router `useNavigate`
  - [ ] On "Cancelar": close dialog without any API call
  - [ ] Disable "Confirmar" button and show "Eliminando..." text when `isPending === true`
  - [ ] Add `data-testid="eliminar-cliente-button"` to the trigger button
  - [ ] Add `data-testid="confirmar-eliminacion-button"` to the confirm button in the dialog
  - [ ] Add `data-testid="cancelar-eliminacion-button"` to the cancel button in the dialog

- [ ] Task 5 — Backend: Create `DeleteClienteCommand` and handler (AC: #2, #4)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
    - Record or class with single property: `Guid Id`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
    - Inject `IClienteRepository`
    - Call `_repository.GetByIdAsync(command.Id, ct)` — throw `NotFoundException` if null
    - Call `_repository.DeleteAsync(entity, ct)` then `_repository.SaveChangesAsync(ct)`
    - Return `void` (no response body — endpoint returns 204 No Content)
    - The `ON DELETE SET NULL` FK constraint on `contactos.cliente_id` handles contact disassociation automatically at the database level

- [ ] Task 6 — Backend: Add `DeleteAsync` to `IClienteRepository` and implementation (AC: #2)
  - [ ] Add `Task DeleteAsync(ClienteEntity entity, CancellationToken ct)` to `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Implement `DeleteAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
    - Use `_context.Clientes.Remove(entity)` — EF Core tracks the entity via `GetByIdAsync` (no `AsNoTracking` per Story 2.4 fix)

- [ ] Task 7 — Backend: Add `DELETE /api/v1/clientes/{id}` endpoint (AC: #2, #6)
  - [ ] Update `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [ ] Add `app.MapDelete("/api/v1/clientes/{id:guid}", ...)` endpoint
  - [ ] Validate that `id` is a valid Guid (path parameter binding handles this automatically)
  - [ ] Dispatch `DeleteClienteCommand` and return `Results.NoContent()` on success
  - [ ] `ExceptionHandlingMiddleware` already handles `NotFoundException` → 404; no additional error handling needed in the endpoint
  - [ ] Register `DeleteClienteCommandHandler` in `Program.cs` DI
  - [ ] Add `.WithName("DeleteCliente").WithSummary("Delete a client by ID")`

- [ ] Task 8 — Frontend unit tests (AC: #1–#6)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`
    - MSW handlers for `DELETE /api/v1/clientes/:id` covering 204 success, 404, 500 responses
    - Verify `invalidateQueries(['clientes'])` is called on success
    - Verify correct toast messages appear for success and error scenarios
    - Arrange / Act / Assert pattern
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
    - Add test: "Eliminar" button renders in detail view
    - Add test: clicking "Eliminar" opens confirmation dialog with expected text
    - Add test: clicking "Cancelar" in dialog closes it without API call
    - Add test: clicking "Confirmar" calls delete mutation and navigates to `/clientes` on success
    - Add test: "Confirmar" button shows "Eliminando..." and is disabled when `isPending` is true
    - Use `data-testid` selectors consistently
    - Mock `useNavigate` from TanStack Router

- [ ] Task 9 — Backend unit and integration tests (AC: #2, #4, #6)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs`
    - Test: deletes entity successfully (calls `DeleteAsync` + `SaveChangesAsync`)
    - Test: throws `NotFoundException` when client ID does not exist
    - All tests: xUnit + EF Core InMemory; Arrange / Act / Assert
  - [ ] Update `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs`
    - Add: `DELETE /api/v1/clientes/{id}` returns 204 No Content for existing client
    - Add: `DELETE /api/v1/clientes/{id}` returns 404 Problem Details for non-existent ID
    - All tests: xUnit + Testcontainers PostgreSQL 18-alpine; Arrange / Act / Assert

## Dev Notes

### Architecture Context

This story is **full-stack** — frontend confirmation dialog + navigation + backend delete endpoint. It builds directly on Stories 2.2 (`ClienteDetailView`) and 2.4 (edit button pattern in the detail panel). The split-panel layout is already in place; this story adds an "Eliminar" trigger in the detail panel header (right side, flex) using the same `AlertDialog` from siesa-ui-kit that Stories 2.3 and 2.4 use.

**Critical dependencies from Stories 2.1, 2.2, 2.3, and 2.4:**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — extend with "Eliminar" button, confirmation dialog, and post-delete navigation
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `deleteById()` signature
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — add `deleteById()` implementation
- `frontend/src/shared/lib/apiClient.ts` — Axios singleton; use for `delete()` call
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — add `DeleteAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `DeleteAsync` using EF Core `Remove` with change tracking (no `AsNoTracking` — see Story 2.4 completion notes)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — extend (do NOT recreate)
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` — already exists; used when delete ID not found
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already handles `NotFoundException` → 404

### MasterCrud Assessment

Story 2.5 is a **delete action within the existing split-panel detail view**, NOT a full CRUD grid. `MasterCrud` is not applicable here. The deletion is triggered from `ClienteDetailView` via a button and `AlertDialog`. This matches the established pattern from Stories 2.3 and 2.4.

### Toast Message Strategy for AC #4 (Contacts-aware delete)

The backend `DELETE /api/v1/clientes/{id}` endpoint returns `204 No Content`. The frontend cannot determine from the response alone whether the client had associated contacts. Two valid strategies:

**Strategy A (Recommended — Simplest):** Always show "Cliente eliminado correctamente" on success. The `ON DELETE SET NULL` behavior is a database-level concern; the commercial user does not need to be explicitly notified unless the epic AC is strictly enforced. However, since AC #4 explicitly requires the different toast message, use **Strategy B**.

**Strategy B (AC-compliant):** Before calling `mutate(cliente.id)`, check if the client has contacts using the already-cached TanStack Query data (`['contactos', { clienteId: cliente.id }]`). Pass a `hasContacts` boolean to the mutation via mutation variables or a `useRef`, and display the appropriate toast in `onSuccess` based on that boolean. This avoids an extra API call.

```typescript
// In ClienteDetailView.tsx
const { data: contactos } = useQuery({ queryKey: ['contactos', { clienteId: cliente.id }] })
const hasContacts = (contactos?.length ?? 0) > 0

// In useDeleteCliente.ts
useMutation({
  mutationFn: ({ id }: { id: string }) => clienteApiRepository.deleteById(id),
  onSuccess: (_result, { hasContacts }) => {
    queryClient.invalidateQueries({ queryKey: ['clientes'] })
    queryClient.invalidateQueries({ queryKey: ['contactos'] })
    if (hasContacts) {
      toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
    } else {
      toast.success('Cliente eliminado correctamente')
    }
  },
  onError: () => toast.error('No se pudo eliminar. Intenta de nuevo.'),
})
```

### Post-Delete Navigation

After successful deletion, the URL `/clientes/:clienteId` is no longer valid. Use TanStack Router `useNavigate` to redirect to `/clientes`:

```typescript
// In ClienteDetailView.tsx
import { useNavigate } from '@tanstack/react-router'

const navigate = useNavigate()

// In mutation onSuccess callback or useDeleteCliente onSuccess:
navigate({ to: '/clientes' })
```

### UI Implementation Requirements (MANDATORY)

- **Component priority**: `AlertDialog` from siesa-ui-kit — same component used in Stories 2.3 and 2.4. Do NOT use a custom modal or native `window.confirm`.
- **Delete button styling**: Use a destructive/danger visual style for the "Eliminar" button to signal the destructive action. Heroicons `TrashIcon` is the icon (primary icon library per standards).
- **Confirmation dialog content**: Title "¿Eliminar este cliente?", subtitle "Esta acción no se puede deshacer.", actions "Confirmar" (destructive primary) and "Cancelar" (secondary).
- **Loading state**: Disabled "Confirmar" button + "Eliminando..." text during mutation — no full-page spinner.
- **Toast notifications**: Use the same toast system from Stories 2.1–2.4 — `toast.success(...)` / `toast.error(...)`.
- **All user-facing text in Spanish**: Button labels, dialog text, toast messages, ARIA labels.
- **WCAG 2.1 AA**: Buttons accessible via keyboard. Dialog trap focus when open. `aria-label` on buttons.
- **Brand colors**: Destructive action button may use `red-*` Tailwind tokens or siesa-ui-kit destructive variant — verify in siesa-ui-kit catalog first.

### Frontend: `useDeleteCliente` Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useDeleteCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import toast from 'react-hot-toast' // or the toast library already in use

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; hasContacts?: boolean }) =>
      clienteApiRepository.deleteById(id),
    onSuccess: (_result, { hasContacts }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      if (hasContacts) {
        toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
      } else {
        toast.success('Cliente eliminado correctamente')
      }
    },
    onError: () => {
      toast.error('No se pudo eliminar. Intenta de nuevo.')
    },
  })
}
```

### Frontend: `clienteApiRepository` Extension Pattern

```typescript
// Addition to frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
async deleteById(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/clientes/${id}`)
}
```

### Backend: `DeleteClienteCommandHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs
public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public DeleteClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task HandleAsync(DeleteClienteCommand command, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException($"Cliente {command.Id} not found.");

        await _repository.DeleteAsync(entity, ct);
        await _repository.SaveChangesAsync(ct);
    }
}
```

### Backend: `DELETE /api/v1/clientes/{id}` Endpoint Pattern

```csharp
// In ClienteEndpoints.cs — add alongside existing endpoints
app.MapDelete("/api/v1/clientes/{id:guid}", async (
    Guid id,
    DeleteClienteCommandHandler handler,
    CancellationToken ct) =>
{
    await handler.HandleAsync(new DeleteClienteCommand(id), ct);
    return Results.NoContent();
})
.WithName("DeleteCliente")
.WithSummary("Delete a client by ID");
```

### Backend: `IClienteRepository` Extension

```csharp
// Addition to backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs
Task DeleteAsync(ClienteEntity entity, CancellationToken ct);
```

### Backend: `ClienteRepository` Implementation

```csharp
// Addition to backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
public Task DeleteAsync(ClienteEntity entity, CancellationToken ct)
{
    _context.Clientes.Remove(entity);
    return Task.CompletedTask;
}
```

### Database: `ON DELETE SET NULL` for Contacts

The `contactos.cliente_id` FK constraint is already defined with `ON DELETE SET NULL` in `ContactoConfiguration.cs` (set up in Story 1.3 / Foundation). When a cliente is deleted, the database automatically sets `cliente_id = NULL` on all associated contacts — no application-level code is needed for contact disassociation. Verify this in `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs`.

### API Response Shape (from architecture.md)

```
DELETE /api/v1/clientes/{id}
  → 204 No Content (empty body)
  → 404 Not Found: Problem Details RFC 7807 { "status": 404, "title": "Not Found", "detail": "Cliente {id} not found." }
  → 500 Internal Server Error: Problem Details RFC 7807
```

### Testing Standards Summary

**Frontend:** Vitest + React Testing Library + MSW. MSW handlers for `DELETE /api/v1/clientes/:id` covering 204 success, 404, 500 responses. Test `data-testid` selectors. Mock TanStack Router `useNavigate`. Coverage target > 80%.

**Backend:** xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL 18-alpine (integration). All tests: Arrange / Act / Assert. Coverage target > 80%.

### Project Structure Notes

**Frontend — Files to create:**
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`

**Frontend — Files to modify:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `deleteById()` signature
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — add `deleteById()` implementation
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — add "Eliminar" button + AlertDialog + post-delete navigation
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` — add delete button and dialog tests

**Backend — Files to create:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs`

**Backend — Files to modify:**
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — add `DeleteAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `DeleteAsync`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add DELETE endpoint
- `backend/src/SiesaAgents.API/Program.cs` — register `DeleteClienteCommandHandler`
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` — add DELETE tests

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.5]
- FR7 (eliminar cliente), FR27 (cambios inmediatos): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md]
- AC-E2.5 (cliente deja de aparecer en lista): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria]
- Frontend module structure (useDeleteCliente, IClienteRepository, clienteApiRepository, ClienteDetailView): [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- TanStack Query mutation pattern with `invalidateQueries`: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- REST DELETE endpoint contract (204, 404), Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- CQRS pattern (Command + Handler): [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- EF Core `Remove` with change tracking (no AsNoTracking fix): [Source: _bmad-output/implementation-artifacts/2-4-edit-client.md#Completion Notes]
- ON DELETE SET NULL FK constraint on contactos.cliente_id: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- DateTimeOffset, UUID PKs: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- siesa-ui-kit AlertDialog pattern (consistent with Stories 2.3, 2.4): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Dev Agent Record]
- Heroicons TrashIcon for destructive action button: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Icons]
- TanStack Router useNavigate for post-delete redirect: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- NFR2 (CRUD < 2s via TanStack Query invalidation), NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Enforcement guidelines (anti-patterns): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

None.

### Completion Notes List

(to be filled by dev agent)

### File List

(to be filled by dev agent)
