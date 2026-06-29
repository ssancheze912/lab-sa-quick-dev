# Story 4.6: Reassign Contact to Different Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to reassign a contact from one client to a different client,
so that I can correct associations or reflect organizational changes.

## Acceptance Criteria

1. **Given** a contact is associated with a client (`clienteId` is non-null), **When** the user views the contact detail at `/contactos/:contactoId`, **Then** a "Reasignar cliente" button is visible in the `ClienteAsociadoSeccion`. (FR26, AC-E4.6)

2. **Given** the user clicks "Reasignar cliente", **When** the reassignment dialog opens, **Then** a client selector lists all available clients except the currently assigned one. (FR26, AC-E4.6)

3. **Given** the reassignment dialog is open, **When** the user selects a different client and confirms, **Then** `PUT /api/v1/contactos/{id}/cliente` is called with body `{ clienteId: <newClienteId> }` and the contact's association is updated. (FR26, FR27, AC-E4.6)

4. **Given** the reassignment succeeds, **When** the mutation completes, **Then** TanStack Query keys `['contactos']`, `['contactos', { clienteId: oldId }]`, and `['contactos', { clienteId: newId }]` are invalidated, and a toast shows "Contacto reasignado correctamente". (FR27, AC-E4.6)

5. **Given** the reassignment succeeds, **When** the contact detail refreshes, **Then** the `ClienteAsociadoSeccion` displays the new client's name. (FR27, AC-E4.6)

6. **Given** the user cancels the reassignment dialog, **When** the dialog closes, **Then** no API call is made and the contact's current client association remains unchanged. (UX correctness, AC-E4.6)

7. **Given** the reassignment operation is in progress, **When** the mutation is pending, **Then** the confirm button is disabled and a loading indicator is shown to prevent duplicate submissions. (NFR2)

8. **Given** the reassignment API call fails, **When** the mutation returns an error, **Then** a toast notification "No se pudo reasignar el contacto. Intenta de nuevo." is shown and no data change is applied. (NFR6)

9. **Given** the backend handler receives a `PUT /api/v1/contactos/{id}/cliente` request where the contact already has a `clienteId`, **When** the new `clienteId` is different from the current one, **Then** the handler overwrites the existing `clienteId` with the new value (no 409 conflict — overwrite is always allowed). (FR26)

10. **Given** a contact has no associated client (`clienteId` is null), **When** the user views the contact detail, **Then** the "Reasignar cliente" button is NOT shown (reassignment requires an existing association; use Story 4.2's associate flow instead). (UX correctness)

11. **Given** the "Reasignar cliente" button is rendered, **When** the user views it, **Then** it is keyboard-accessible (focusable, activatable via Enter/Space) and meets WCAG 2.1 AA. (company standard)

## Tasks / Subtasks

- [ ] Task 1 — Backend: verify `AssignClienteCommandHandler` allows overwrite when contact already has a `clienteId` (AC: #3, #9)
  - [ ] Review `backend/src/SiesaAgents.Application/Contactos/Commands/AssignClienteCommandHandler.cs`
    - Confirm the handler calls `contacto.AssignCliente(command.ClienteId)` unconditionally — no check that rejects a non-null `ClienteId` replacement
    - If any guard prevents overwrite (e.g., `if (contacto.ClienteId != null) return Conflict(...)`), remove it — overwrite must always be allowed
    - No new migration, no new endpoint — the existing `PUT /api/v1/contactos/{id}/cliente` is reused as-is

- [ ] Task 2 — Backend: add integration test for the overwrite scenario (AC: #9)
  - [ ] Update `backend/tests/SiesaAgents.IntegrationTests/Contactos/AssignClienteCommandTests.cs` (or equivalent)
    - TC-new: `PUT /api/v1/contactos/{existingId}/cliente` with `{ clienteId: clienteB_uuid }` where contact already has `clienteId = clienteA_uuid` → 200 OK with `contactoDto.clienteId == clienteB_uuid`

- [ ] Task 3 — Implement `useReasignarContacto` mutation hook (AC: #3, #4, #7, #8)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useReasignarContacto.ts`
    - `useMutation({ mutationFn: ({ contactoId, newClienteId }: { contactoId: string; newClienteId: string }) => contactoApiRepository.assignCliente(contactoId, newClienteId) })`
    - `onSuccess`: invalidate `['contactos']`, `['contactos', { clienteId: oldClienteId }]`, `['contactos', { clienteId: newClienteId }]`, and `['contactos', contactoId]`
    - `onSuccess`: show toast "Contacto reasignado correctamente"
    - `onError`: show toast "No se pudo reasignar el contacto. Intenta de nuevo."
    - Note: `oldClienteId` must be passed as a variable to the hook so it can be captured in `onSuccess`

- [ ] Task 4 — Implement `ReasignarClienteDialog` component (AC: #2, #6, #7, #10, #11)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ReasignarClienteDialog.tsx`
    - Props: `{ contactoId: string; currentClienteId: string; open: boolean; onClose: () => void }`
    - Fetches all clients via existing `useClientes()` hook (queryKey `['clientes']`)
    - Filters out the current client from the selector list (user must pick a DIFFERENT client)
    - Shows filtered list with a client search input (client-side text filter by `nombre`)
    - On select + confirm: calls `useReasignarContacto` mutation (pass `oldClienteId = currentClienteId`), closes dialog on success
    - While mutation is pending: disable "Reasignar" confirm button (show loading state)
    - Empty state (all clients are the current one, or no clients exist): show "No hay otros clientes disponibles"
    - Labels in Spanish: "Reasignar cliente", "Buscar cliente...", "Reasignar", "Cancelar"
    - Uses shadcn/ui `Dialog` (`frontend/src/shared/components/ui/dialog.tsx` — already created in Story 4.2)
    - Keyboard-accessible: confirm button is a `<button>` element (natively focusable, Enter/Space activatable)

- [ ] Task 5 — Update `ClienteAsociadoSeccion` in `ContactoDetailView.tsx` to wire reassignment UI (AC: #1, #5, #10, #11)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
    - In `ClienteAsociadoSeccion` (added in Story 4.4): render a "Reasignar cliente" button (Heroicons `ArrowsRightLeftIcon` or `PencilIcon`) ONLY when `contacto.clienteId` is non-null
    - Button click: open `ReasignarClienteDialog` (local state `isReasignarOpen`)
    - Pass `contactoId` and `contacto.clienteId` as props to `ReasignarClienteDialog`
    - After dialog closes (onClose), dialog unmounts — no additional refresh needed (query invalidation in hook handles it)
    - Preserve existing "Volver al cliente" navigation link and "Sin cliente asignado" empty state (from Stories 4.3 and 4.4)

- [ ] Task 6 — Write tests (AC: #1–#11)
  - [ ] **Unit test** `useReasignarContacto.test.ts` (Vitest + MSW)
    - TC-1: Calls `PUT /api/v1/contactos/{id}/cliente` with correct body `{ clienteId: newClienteId }` on mutation
    - TC-2: Invalidates `['contactos']`, `['contactos', { clienteId: oldClienteId }]`, `['contactos', { clienteId: newClienteId }]`, and `['contactos', contactoId]` on success
    - TC-3: Toast "Contacto reasignado correctamente" shown on success
    - TC-4: Toast "No se pudo reasignar el contacto. Intenta de nuevo." shown on error
  - [ ] **Component test** `ReasignarClienteDialog.test.tsx` (Vitest + RTL + MSW)
    - TC-1: Dialog renders with a list of clients excluding the current one
    - TC-2: Searching by name filters the client list
    - TC-3: "Reasignar" button is disabled when no client is selected
    - TC-4: Selecting a client and clicking "Reasignar" triggers mutation and closes dialog
    - TC-5: Clicking "Cancelar" closes dialog without API call
    - TC-6: Empty state "No hay otros clientes disponibles" shows when all clients are filtered out
  - [ ] **Component test** `ContactoDetailView.reasignar.test.tsx` (Vitest + RTL + MSW)
    - TC-1: "Reasignar cliente" button is visible when `contacto.clienteId` is non-null
    - TC-2: "Reasignar cliente" button is NOT rendered when `contacto.clienteId` is null
    - TC-3: Clicking "Reasignar cliente" opens `ReasignarClienteDialog`
    - TC-4: After successful reassignment, `ClienteAsociadoSeccion` shows new client name
  - [ ] **E2E test** `e2e/tests/contactos/reassign-contact.spec.ts` (Playwright)
    - TC-1: Navigate to a contact detail that has a client assigned, click "Reasignar cliente", select a different client, confirm — verify new client name appears in `ClienteAsociadoSeccion`
    - TC-2: Verify the old client's contact list (navigate to `/clientes/:oldClienteId`) no longer contains the reassigned contact
    - TC-3: Verify the new client's contact list (navigate to `/clientes/:newClienteId`) now contains the reassigned contact
    - TC-4: Cancel reassignment — verify client association unchanged

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. This story spans **Presentation + Application + Infrastructure** layers on the frontend and **Application (Command/Handler)** layer verification on the backend.
- **No new endpoint.** The existing `PUT /api/v1/contactos/{id}/cliente` from Story 4.2 handles both assign (null → uuid) and reassign (uuid → different uuid). The backend handler already calls `contacto.AssignCliente(command.ClienteId)` which sets the new value unconditionally — Task 1 is a verification step to ensure no accidental guard was added.
- **Reassign vs Associate distinction:** Reassignment (`clienteId` non-null → different uuid) and association (`clienteId` null → uuid) use the same endpoint but differ in the entry point and UX flow. Reassignment is initiated from `ContactoDetailView`; association is initiated from `ClienteDetailView` (Story 4.2).
- **TanStack Query invalidation (mandatory):** Invalidate THREE keys on success: `['contactos']` (global prefix), `['contactos', { clienteId: oldId }]` (old client's panel), `['contactos', { clienteId: newId }]` (new client's panel). This satisfies FR27 — all users see changes immediately.
- **`useClientes()` hook:** The hook for fetching all clients was implemented in Story 2.1 (`client-list-search`). Verify the existing hook exists at `frontend/src/modules/crm/clientes/application/useClientes.ts` before creating a new one.
- **Dialog component:** Use `frontend/src/shared/components/ui/dialog.tsx` (custom minimal Dialog created in Story 4.2 — Radix UI is not installed).
- **No optimistic updates.** List refreshes after server confirmation. `isPending` disables the confirm button (NFR2 < 2s UI update tolerance).
- **MasterCrud applicability:** NOT applicable. This story adds a reassignment action to an existing detail view section. MasterCrud is for standalone CRUD grid views.

### Project Structure Notes

Frontend files to create:
```
frontend/src/modules/crm/contactos/
  application/
    useReasignarContacto.ts           ← New mutation hook
  presentation/
    ReasignarClienteDialog.tsx        ← New Dialog component
```

Frontend files to modify:
```
frontend/src/modules/crm/contactos/
  presentation/
    ContactoDetailView.tsx            ← Add "Reasignar cliente" button in ClienteAsociadoSeccion
```

Backend files to verify (no change expected):
```
backend/src/SiesaAgents.Application/Contactos/Commands/
  AssignClienteCommandHandler.cs     ← Confirm overwrite allowed (no guard on existing clienteId)
```

Backend files to modify (only if overwrite guard found):
```
backend/src/SiesaAgents.Application/Contactos/Commands/
  AssignClienteCommandHandler.cs     ← Remove any guard that rejects non-null → different uuid
```

No database migration required. The `cliente_id` nullable column and `ix_contactos_cliente_id` index are already in place from Story 1.3/3.1.

### API Contract

Reuses existing endpoint (no breaking change):

```
PUT /api/v1/contactos/{id}/cliente
  Path param: id — valid UUID (Guid) of the contact (already associated with a client)
  Request body:
    { "clienteId": "new-cliente-uuid" }   ← Reassign: different non-null UUID
  Response 200 OK:
    Body: ContactoDto (updated contact with new clienteId)
  Response 404 Not Found:
    Body: Problem Details RFC 7807 (contacto not found)
  Response 400 Bad Request:
    Body: Problem Details RFC 7807 (validation failure)

ContactoDto {
  id: string           // UUID
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: string    // UUID of the NEW client after reassignment
  createdAt: string    // DateTimeOffset ISO 8601 — e.g. "2026-06-29T10:00:00Z"
}
```

### Backend Handler Verification

The existing handler pattern from Story 4.2 must NOT have a conflict guard:

```csharp
// AssignClienteCommandHandler.cs — CORRECT (allows overwrite):
var contacto = await _repository.GetByIdAsync(command.ContactoId, cancellationToken);
if (contacto is null)
    return Results.Problem(title: "Recurso no encontrado", statusCode: 404);

contacto.AssignCliente(command.ClienteId);   // ← Sets clienteId unconditionally
await _repository.UpdateAsync(contacto, cancellationToken);
return Results.Ok(ContactoDto.FromEntity(contacto));

// ContactoEntity.AssignCliente — CORRECT (unconditional overwrite):
public void AssignCliente(Guid? clienteId)
{
    ClienteID = clienteId;           // ← Replaces any existing value
    UpdatedAt = DateTimeOffset.UtcNow;
}
```

### Frontend Mutation Hook Pattern

```typescript
// useReasignarContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import toast from 'react-hot-toast'

interface ReasignarParams {
  contactoId: string
  newClienteId: string
  oldClienteId: string
}

export function useReasignarContacto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contactoId, newClienteId }: ReasignarParams) =>
      contactoApiRepository.assignCliente(contactoId, newClienteId),
    onSuccess: (_data, { contactoId, newClienteId, oldClienteId }) => {
      void queryClient.invalidateQueries({ queryKey: ['contactos'] })
      void queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: oldClienteId }] })
      void queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: newClienteId }] })
      void queryClient.invalidateQueries({ queryKey: ['contactos', contactoId] })
      toast.success('Contacto reasignado correctamente')
    },
    onError: () => {
      toast.error('No se pudo reasignar el contacto. Intenta de nuevo.')
    },
  })
}
```

### TanStack Query Keys (Canonical)

```typescript
['contactos']                           // All contacts — prefix invalidation covers all sub-keys
['contactos', { clienteId: oldId }]     // Old client's contact panel — must be explicitly invalidated
['contactos', { clienteId: newId }]     // New client's contact panel — must be explicitly invalidated
['contactos', contactoId]               // Single contact detail — invalidate to refresh ClienteAsociadoSeccion
```

### User-Facing Spanish Text (Mandatory)

```
"Reasignar cliente"                                     ← button label in ClienteAsociadoSeccion
"Reasignar cliente"                                     ← dialog title
"Buscar cliente..."                                     ← search input placeholder in dialog
"Reasignar"                                             ← confirm button label in dialog
"Cancelar"                                              ← cancel button label in dialog
"No hay otros clientes disponibles"                     ← empty state when no other clients
"Contacto reasignado correctamente"                     ← success toast
"No se pudo reasignar el contacto. Intenta de nuevo."  ← error toast
```

### Testing Notes

- MSW handlers needed:
  - `PUT /api/v1/contactos/:id/cliente` with non-null body `{ clienteId: newUuid }` → 200 OK with updated `ContactoDto`
  - `GET /api/v1/clientes` → return list of clients (for dialog selector)
- Test setup for `ReasignarClienteDialog`: seed at least 3 clients; pass one as `currentClienteId`; assert only 2 appear in the list.
- For `ContactoDetailView.reasignar.test.tsx`: use MSW to intercept the PUT call and assert invalidation indirectly via UI refresh (new client name in `ClienteAsociadoSeccion`).
- Backend integration test: seed a contact with `clienteId = clienteA`; call `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: clienteB }`; assert 200 OK and `dto.clienteId == clienteB`.

### Previous Story Context

- **Story 4.2** (`associate-disassociate-contacts-from-client`): Implemented `PUT /api/v1/contactos/{id}/cliente`, `AssignClienteCommand/Handler`, `contactoApiRepository.assignCliente()`, and `IContactoRepository.assignCliente` signature. This story reuses all of them directly — no new backend endpoint, no new repository method.
- **Story 4.4** (`view-associated-client-from-contact-detail`): Added `ClienteAsociadoSeccion` to `ContactoDetailView.tsx` showing the linked client's name and "Volver al cliente" navigation. This story extends that section with the "Reasignar cliente" button.
- **Story 4.3** (`navigate-from-client-detail-to-contact-detail`): Added "Volver al cliente" / "Volver a contactos" back-navigation to `ContactoDetailView.tsx`. Do NOT break this back-navigation while modifying the file.
- **Story 2.1** (`client-list-search`): Implemented `useClientes()` hook (queryKey `['clientes']`) and `clienteApiRepository.getAll()`. The `ReasignarClienteDialog` uses this hook to fetch the client list for the selector.

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision).
- `contactoId` path param and `clienteId` body field are validated as valid `Guid` on the backend (FluentValidation from Story 4.2's `AssignClienteCommandValidator`).
- Never expose raw error messages — use Problem Details RFC 7807 (backend) and toast notifications (frontend).
- All user-facing text in Spanish (MANDATORY company standard).

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.6 AC and FR26, FR27, AC-E4.6
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — `PUT /api/v1/contactos/{id}/cliente`, TanStack Query keys, CQRS pattern
- Story 4.2 (endpoint + assignCliente foundation): `_bmad-output/implementation-artifacts/stories/story-4.2-associate-disassociate-contacts-from-client.md`
- Story 4.4 (ClienteAsociadoSeccion in ContactoDetailView): `_bmad-output/implementation-artifacts/stories/story-4.4-view-associated-client-from-contact-detail.md`
- Story 4.3 (back-navigation in ContactoDetailView): `_bmad-output/implementation-artifacts/stories/story-4.3-navigate-from-client-detail-to-contact-detail.md`
- Story 2.1 (useClientes hook): `_bmad-output/implementation-artifacts/stories/story-2.1-client-list-search.md`
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, TanStack Query, DateTimeOffset, Spanish UI text, Heroicons, WCAG 2.1 AA
