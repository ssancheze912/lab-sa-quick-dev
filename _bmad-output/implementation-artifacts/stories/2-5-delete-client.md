# Story 2.5: Delete Client

Status: draft

## Story

As a commercial team member,
I want to delete a client record,
so that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears with the question "¿Eliminar este cliente?" and two buttons: "Confirmar" and "Cancelar".

2. **Given** the user confirms the deletion, **When** the deletion is processed via `DELETE /api/v1/clientes/:id`, **Then** the client is removed from the list immediately without a page reload (FR27), the right panel returns to the empty/default state, and a toast displays "Cliente eliminado correctamente" (when the client had no associated contacts).

3. **Given** the client being deleted has one or more associated contacts, **When** the deletion is confirmed and processed, **Then** the client record is deleted, all previously associated contacts remain in the system with `clienteId = null` (FR25), and the toast displays "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

4. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the client record remains in the system unchanged and no DELETE request is fired.

## Tasks / Subtasks

- [ ] Task 1 — Frontend: create `useDeleteCliente` mutation hook (AC: 2, 3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
  - [ ] Use `useMutation` with `mutationFn: (id: string) => clienteApiRepository.delete(id)`
  - [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`, then show toast based on `hasContacts` flag
  - [ ] `onError`: call `toast.error('No se pudo eliminar. Intenta de nuevo.')`
  - [ ] Return mutation object including `isPending`
  - [ ] Add `delete(id: string): Promise<void>` to `IClienteRepository` interface
  - [ ] Implement `delete()` in `clienteApiRepository.ts` — `DELETE /api/v1/clientes/:id`, expects 204 No Content

- [ ] Task 2 — Frontend: create `DeleteClienteDialog` confirmation component (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/DeleteClienteDialog.tsx`
  - [ ] Use Radix UI `Dialog` (Dialog.Root/Content/Portal/Overlay)
  - [ ] Dialog title/message: "¿Eliminar este cliente?"
  - [ ] Footer buttons: "Cancelar" (closes dialog without DELETE) and "Confirmar" (calls `useDeleteCliente` mutation)
  - [ ] "Confirmar" button shows loading state while `isPending` is true (`disabled` + "Eliminando..." text)
  - [ ] On successful deletion: close dialog via `onClose()`, navigate/clear right panel to default state
  - [ ] On cancel: call `onClose()` without firing DELETE
  - [ ] Props: `open: boolean`, `onClose: () => void`, `clienteId: string`, `hasContacts: boolean`
  - [ ] `data-testid="delete-cliente-dialog"` on `DialogContent`
  - [ ] `data-testid="btn-confirmar-eliminar"` on the confirm button
  - [ ] `data-testid="btn-cancelar-eliminar"` on the cancel button
  - [ ] All labels and dialog text in Spanish; WCAG 2.1 AA accessible — dialog has `role="alertdialog"` with `aria-labelledby`

- [ ] Task 3 — Frontend: add "Eliminar" button to `ClienteDetailPanel` (AC: 1)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
  - [ ] Add an "Eliminar" button to the detail panel
  - [ ] Button click opens `DeleteClienteDialog`, passing `clienteId` and `hasContacts` (derived from contacts list length)
  - [ ] Control dialog open state with `useState<boolean>`
  - [ ] On successful deletion from dialog: call parent handler to clear the selected client (navigate to `/clientes` or reset URL param)
  - [ ] `data-testid="btn-eliminar"` on the button
  - [ ] Siesa Blue `#0e79fd` as primary color (or destructive red if design system supports it — check siesa-ui-kit first)

- [ ] Task 4 — Backend: implement DELETE endpoint with contact unassignment (AC: 2, 3)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs` — command record with `Guid Id`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
    - [ ] Fetch `ClienteEntity` by ID — throw `NotFoundException` if not found → 404 Problem Details
    - [ ] Call `IClienteRepository.DeleteAsync(id)` — EF Core removes the entity; `ON DELETE SET NULL` on `contactos.cliente_id` handles contact unassignment at DB level
    - [ ] Return `bool hasContacts` flag based on whether any contacts were associated before deletion (query count before delete)
  - [ ] Register `DELETE /api/v1/clientes/{id:guid}` in `ClienteEndpoints.cs` — returns 204 No Content or 404 Problem Details
  - [ ] Register `DeleteClienteCommandHandler` in DI in `Program.cs`
  - [ ] Add `DeleteAsync(Guid id): Task` to `IClienteRepository` interface (`backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`)
  - [ ] Implement `DeleteAsync()` in `ClienteRepository.cs` — find entity, remove, save changes (EF Core cascade `SET NULL` handles contacts)
  - [ ] Verify `ContactoConfiguration.cs` has `ON DELETE SET NULL` for `cliente_id` FK (should already be set from architecture)
  - [ ] Response: 204 No Content on success; 404 Problem Details if client not found

- [ ] Task 5 — Write E2E tests (AC: 1, 2, 3, 4)
  - [ ] Create `e2e/tests/clientes/clientes-delete.spec.ts`
    - E2E-C-23 (P0): Clicking "Eliminar" shows confirmation dialog with "Confirmar" and "Cancelar"
    - E2E-C-24 (P0): Confirming deletion removes client from list immediately and shows empty/default right panel (no reload)
    - E2E-C-25 (P1): Success toast "Cliente eliminado correctamente" appears after deletion (no associated contacts)
    - E2E-C-26 (P1): Clicking "Cancelar" in confirmation dialog leaves client in list unchanged; no DELETE request fired
    - E2E-C-27 (P1): Deleting client with associated contacts: toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

- [ ] Task 6 — Write API integration tests (AC: 2, 3)
  - [ ] Add to `e2e/tests/clientes/clientes-api.spec.ts`
    - API-C-05 (P0): DELETE `/api/v1/clientes/:id` returns 204 and subsequent GET `/api/v1/clientes/:id` returns 404
    - API-C-06 (P0): DELETE `/api/v1/clientes/:id` (with associated contacts): contacts still exist via GET `/api/v1/contactos/:id`; `clienteId` field is `null`

- [ ] Task 7 — Write backend unit tests (AC: 2, 3)
  - [ ] Add to `backend/tests/SiesaAgents.UnitTests/Handlers/ClienteHandlerTests.cs`
    - UNIT-B-06 (P1): `DeleteClienteHandler` does not throw when deleting client with 0 contacts
    - UNIT-B-11 (P1): `DeleteClienteHandler` throws `NotFoundException` when client ID does not exist
  - [ ] Ensure all fakes implementing `IClienteRepository` include `DeleteAsync` method stub

## Dev Notes

### Context from Previous Stories

- `ClienteDetailPanel.tsx` was updated in Story 2.4 to include an "Editar" button. Add "Eliminar" button alongside it using the same `useState<boolean>` pattern for dialog open state.
- `clienteApiRepository.ts` already has `create()` and `update()` methods. Add `delete()` following the same pattern (`DELETE` verb, no request body, 204 response → `Promise<void>`).
- `IClienteRepository` interface already has `create()` and `update()`. Add `deleteAsync` following same contract.
- `ExceptionHandlingMiddleware` already handles `ConflictException` → 409 (Story 2.3) and `NotFoundException` → 404 (Story 2.4). The not-found case for DELETE is already covered.
- Toast infrastructure uses custom Zustand `toastStore.ts` + `ToastContainer` component (created in Story 2.3). The toast message for delete depends on whether the client had associated contacts — pass `hasContacts` from mutation result.
- `ContactoConfiguration.cs` must have `ON DELETE SET NULL` for the `cliente_id` FK. This was defined in the architecture document (`contactos.cliente_id` → `clientes.id ON DELETE SET NULL`) and should already be in the migration from Story 1.3.
- After successful deletion, the selected client detail panel must be cleared. The URL should update to `/clientes` (no `:clienteId` param). Use TanStack Router `navigate({ to: '/clientes' })` or clear the selected client state.

### Frontend File Locations

```
frontend/src/
  modules/crm/clientes/
    application/
      useDeleteCliente.ts             # NEW — TanStack Query useMutation hook
    infrastructure/
      clienteApiRepository.ts         # MODIFIED — add delete()
    domain/
      IClienteRepository.ts           # MODIFIED — add delete()
    presentation/
      DeleteClienteDialog.tsx         # NEW — confirmation dialog component
      ClienteDetailPanel.tsx          # MODIFIED — add "Eliminar" button + DeleteClienteDialog

e2e/tests/clientes/
  clientes-delete.spec.ts             # NEW — E2E-C-23 to E2E-C-27
  clientes-api.spec.ts                # MODIFIED — add API-C-05 and API-C-06 describe block
```

### Backend File Locations

```
backend/src/
  SiesaAgents.Application/Clientes/Commands/
    DeleteClienteCommand.cs               # NEW — command record
    DeleteClienteCommandHandler.cs        # NEW — handler with NotFoundException
  SiesaAgents.API/Endpoints/
    ClienteEndpoints.cs                   # MODIFIED — add DELETE /{id:guid} endpoint
  SiesaAgents.API/Program.cs              # MODIFIED — register DeleteClienteCommandHandler DI
  SiesaAgents.Domain/Clientes/Interfaces/
    IClienteRepository.cs                 # MODIFIED — add DeleteAsync
  SiesaAgents.Infrastructure/Repositories/
    ClienteRepository.cs                  # MODIFIED — implement DeleteAsync

backend/tests/
  SiesaAgents.UnitTests/Handlers/
    ClienteHandlerTests.cs                # MODIFIED — add UNIT-B-06, UNIT-B-11; update fakes
```

### Key Implementation Details

**Frontend — `useDeleteCliente` hook:**
```typescript
// useDeleteCliente.ts
interface DeleteClienteResult {
  hasContacts: boolean;
}

export function useDeleteCliente(onSuccess: (hasContacts: boolean) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: (_data, _id, context) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      // hasContacts determined before mutation or returned from backend
      onSuccess(false); // adjust based on implementation
    },
    onError: () => toast.error('No se pudo eliminar. Intenta de nuevo.')
  });
}
```

**Frontend — toast message selection:**
```typescript
// In DeleteClienteDialog.tsx or useDeleteCliente.ts
if (hasContacts) {
  toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.');
} else {
  toast.success('Cliente eliminado correctamente');
}
```

**Frontend — clear right panel after deletion:**
```typescript
// ClienteDetailPanel.tsx — after successful deletion
import { useNavigate } from '@tanstack/react-router';
const navigate = useNavigate();
// Called from DeleteClienteDialog onSuccess
navigate({ to: '/clientes' });
```

**Backend — DELETE endpoint contract:**
```
DELETE /api/v1/clientes/{id}
Response 204: No Content (success)
Response 404: Problem Details RFC 7807 (client not found)
```

**Backend — contact unassignment via EF Core cascade:**
```csharp
// ContactoConfiguration.cs (should already exist from Story 1.3)
builder.HasOne(c => c.Cliente)
       .WithMany(cl => cl.Contactos)
       .HasForeignKey(c => c.ClienteID)
       .OnDelete(DeleteBehavior.SetNull);
// When ClienteEntity is deleted, EF Core sets ClienteID = NULL on all associated contacts automatically
```

**E2E test — cancel without DELETE:**
```typescript
// E2E-C-26 pattern
let deleteFired = false;
await page.route('**/api/v1/clientes/**', route => {
  if (route.request().method() === 'DELETE') { deleteFired = true; }
  route.continue();
});
// Select client, click Eliminar, then click Cancelar
await clientesPage.seleccionarCliente(clienteNombre);
await page.getByTestId('btn-eliminar').click();
await expect(page.getByTestId('delete-cliente-dialog')).toBeVisible();
await page.getByTestId('btn-cancelar-eliminar').click();
expect(deleteFired).toBe(false);
// Assert client still in list
await expect(page.getByText(clienteNombre)).toBeVisible();
```

**E2E test — delete with contacts (E2E-C-27):**
```typescript
// Setup: create client + contact
const clienteData = buildCliente();
const created = await apiHelper.createCliente(clienteData);
createdIds.push(created.id);
const contacto = await apiHelper.createContacto({ clienteId: created.id, ... });
// Select client, confirm delete
await clientesPage.goto();
await clientesPage.seleccionarCliente(clienteData.nombre);
await page.getByTestId('btn-eliminar').click();
await page.getByTestId('btn-confirmar-eliminar').click();
// Assert toast with contact message
await expect(page.getByText(/sus contactos asociados quedaron sin cliente asignado/i)).toBeVisible();
```

### data-testid Attributes Required

| Attribute | Component | File |
|---|---|---|
| `btn-eliminar` | `ClienteDetailPanel` | `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx` |
| `delete-cliente-dialog` | `DeleteClienteDialog` (DialogContent) | `frontend/src/modules/crm/clientes/presentation/DeleteClienteDialog.tsx` |
| `btn-confirmar-eliminar` | `DeleteClienteDialog` | same file |
| `btn-cancelar-eliminar` | `DeleteClienteDialog` | same file |

### Test IDs Covered by This Story

| Test ID | Priority | Description |
|---|---|---|
| E2E-C-23 | P0 | Delete confirmation dialog shows "Confirmar" and "Cancelar" |
| E2E-C-24 | P0 | Confirm delete removes client from list immediately (FR27) |
| E2E-C-25 | P1 | Toast "Cliente eliminado correctamente" (no contacts) |
| E2E-C-26 | P1 | Cancel: no DELETE fired, client remains in list |
| E2E-C-27 | P1 | Toast with contact unassignment message when client had contacts |
| API-C-05 | P0 | DELETE returns 204; subsequent GET returns 404 |
| API-C-06 | P0 | DELETE with contacts: contacts retain clienteId = null |
| UNIT-B-06 | P1 | DeleteClienteHandler: no throw when client has 0 contacts |
| UNIT-B-11 | P1 | DeleteClienteHandler: throws NotFoundException when ID not found |
