# Story 3.5: Delete Contact

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a contact record,
so that the contact list only contains relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears with the question "¿Eliminar este contacto?" and two buttons: "Confirmar" and "Cancelar".

2. **Given** the user confirms the deletion, **When** the deletion is processed via `DELETE /api/v1/contactos/:id`, **Then** the contact is removed from the list immediately without a page reload (FR27), the view returns to `/contactos`, and a toast displays "Contacto eliminado correctamente".

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the contact record remains in the system unchanged and no DELETE request is fired.

## Tasks / Subtasks

- [x] Task 1 — Frontend: create `useDeleteContacto` mutation hook (AC: 2)
  - [x] Create `frontend/src/modules/crm/contactos/application/useDeleteContacto.ts`
  - [x] Use `useMutation` with `mutationFn: (id: string) => contactoApiRepository.delete(id)`
  - [x] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['contactos'] })`, then `toast.success('Contacto eliminado correctamente')`
  - [x] `onError`: call `toast.error('No se pudo eliminar. Intenta de nuevo.')`
  - [x] Return mutation object including `isPending`
  - [x] Add `delete(id: string): Promise<void>` to `IContactoRepository` interface in `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
  - [x] Implement `delete()` in `contactoApiRepository.ts` — `DELETE /api/v1/contactos/:id`, expects 204 No Content, returns `Promise<void>`

- [x] Task 2 — Frontend: create `DeleteContactoDialog` confirmation component (AC: 1, 2, 3)
  - [x] Create `frontend/src/modules/crm/contactos/presentation/DeleteContactoDialog.tsx`
  - [x] Use Radix UI `Dialog` (Dialog.Root/Content/Portal/Overlay) — same pattern as `DeleteClienteDialog.tsx` from Story 2.5
  - [x] Dialog title/message: "¿Eliminar este contacto?"
  - [x] Footer buttons: "Cancelar" (closes dialog without DELETE) and "Confirmar" (calls `useDeleteContacto` mutation)
  - [x] "Confirmar" button shows loading state while `isPending` is true (`disabled` + "Eliminando..." text)
  - [x] On successful deletion: close dialog via `onClose()`, navigate to `/contactos` using TanStack Router `useNavigate`
  - [x] On cancel: call `onClose()` without firing DELETE — no mutation invoked
  - [x] Guard `onOpenChange` against closing during `isPending` (prevent accidental close on ESC/backdrop while mutation is running)
  - [x] Props: `open: boolean`, `onClose: () => void`, `contactoId: string`
  - [x] `data-testid="delete-contacto-dialog"` on `Dialog.Content`
  - [x] `data-testid="btn-confirmar-eliminar"` on the confirm button
  - [x] `data-testid="btn-cancelar-eliminar"` on the cancel button
  - [x] `role="alertdialog"` with `aria-labelledby` pointing to the dialog title id and `aria-describedby` pointing to the description paragraph id (WCAG 2.1 AA)
  - [x] All labels and dialog text in Spanish

- [x] Task 3 — Frontend: add "Eliminar" button to `ContactoDetailPanel` (AC: 1)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`
  - [x] Add "Eliminar" button alongside existing "Editar" button (added in Story 3.4)
  - [x] Button click sets `deleteDialogOpen = true` via `useState<boolean>`
  - [x] Render `<DeleteContactoDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} contactoId={data.id} />`
  - [x] `data-testid="btn-eliminar"` on the button
  - [x] siesa-ui-kit has no destructive variant; using Siesa Blue `#0e79fd` (`bg-[#0e79fd] text-white hover:bg-[#154ca9]`) consistent with all other buttons

- [x] Task 4 — Backend: create `DeleteContactoCommand` and handler (AC: 2)
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommand.cs` — record with `Guid Id`
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommandHandler.cs`
    - [x] Fetch `ContactoEntity` by ID via `IContactoRepository.GetByIdAsync(command.Id, ct)` — throw `KeyNotFoundException` if not found → 404 Problem Details via `ExceptionHandlingMiddleware`
    - [x] Call `IContactoRepository.DeleteAsync(entity, ct)` to remove the entity
  - [x] Add `DeleteAsync(ContactoEntity entity, CancellationToken ct): Task` to `IContactoRepository` interface in `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
  - [x] Implement `DeleteAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — `_context.Contactos.Remove(entity); await _context.SaveChangesAsync(ct);`
  - [x] Register `DeleteContactoCommandHandler` in `Program.cs` DI

- [x] Task 5 — Backend: expose `DELETE /api/v1/contactos/{id}` endpoint (AC: 2)
  - [x] Add `DELETE /{id:guid}` endpoint to `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
  - [x] Accept `id` from route, construct `DeleteContactoCommand(id)`, call `handler.HandleAsync(command, ct)`
  - [x] Returns `204 No Content` on success
  - [x] Returns `404 Not Found` Problem Details (RFC 7807) when `id` does not exist — handled by `ExceptionHandlingMiddleware` on `KeyNotFoundException`
  - [x] `.Produces(StatusCodes.Status204NoContent)` and `.Produces(StatusCodes.Status404NotFound)` on the endpoint
  - [x] Register the handler in `Program.cs` DI

- [x] Task 6 — Write E2E tests (AC: 1, 2, 3)
  - [x] Create `e2e/tests/contactos/contactos-delete.spec.ts`
    - E2E-CT-23 (P0): Clicking "Eliminar" on contact detail shows confirmation dialog with "Confirmar" and "Cancelar" buttons — assert no DELETE fired yet
    - E2E-CT-24 (P0): Confirming deletion removes contact from `contactoRows` table immediately (no `page.reload()`), URL changes to `/contactos`
    - E2E-CT-25 (P1): Success toast "Contacto eliminado correctamente" visible after confirmation
    - E2E-CT-26 (P1): Clicking "Cancelar" in dialog: assert no DELETE call fired; contact row still present in table

- [x] Task 7 — Write API integration tests (AC: 2)
  - [x] Add Story 3.5 describe block to `e2e/tests/contactos/contactos-api.spec.ts`
    - API-CT-06 (P0): `DELETE /api/v1/contactos/:id` returns 204; subsequent `GET /api/v1/contactos/:id` returns 404 Problem Details (no `stackTrace` key)

- [x] Task 8 — Write backend unit tests (AC: 2)
  - [x] Add to `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`
    - UNIT-B-CT-05 (P1): `DeleteContactoHandler` does not throw when deleting an existing contact (no client association)
    - UNIT-B-CT-10 (P1): `DeleteContactoHandler` throws `KeyNotFoundException` when contact ID does not exist

## Dev Notes

### Architecture Context

This story is the direct analog of Story 2.5 (Delete Client) applied to the contacts domain. Mirror the exact same implementation pattern.

**Depends on:**
- Story 3.1 — `Contacto` entity, `IContactoRepository`, `ContactoListView`, `useContactos` with `queryKey: ['contactos']` established
- Story 3.2 — `ContactoDetailView` / `ContactoDetailPanel` with `/contactos/$contactoId` route established
- Story 3.3 — `contactoApiRepository.ts`, `useCreateContacto`, `ContactoFormDialog` established
- Story 3.4 — `ContactoDetailPanel` already has "Editar" button with `useState<boolean>` dialog pattern. Add "Eliminar" button alongside it, following the same `useState` + dialog open/close pattern. `UpdateContactoCommandHandler` established the `KeyNotFoundException` → 404 Problem Details path in `ExceptionHandlingMiddleware`.

**Provides for:** Epic 4 stories — `ContactoDetailPanel` with full action set established.

**Cache invalidation (R2 mitigation):** `useDeleteContacto` must call `queryClient.invalidateQueries({ queryKey: ['contactos'] })` on success. This invalidates the list cache so the deleted contact disappears from `ContactoListView` immediately (FR27, NFR2).

**Navigation after delete:** On success, navigate to `/contactos` using TanStack Router `useNavigate` hook — same pattern as `DeleteClienteDialog.tsx` (Story 2.5) which navigates to `/clientes`. Do NOT navigate inside the hook; handle it in the dialog component's `onSuccess` callback.

**No DELETE on cancel (R6 mitigation):** Cancel must call `onClose()` without invoking the mutation. Do NOT call `deleteMutation.mutate()` inside the cancel handler.

**`ExceptionHandlingMiddleware`:** Already handles `KeyNotFoundException` → 404 Problem Details (established in Story 2.4 for clientes, confirmed in Story 3.4 for contactos). No changes needed.

**`toastStore.ts`:** Use existing Zustand `toastStore.ts` + `ToastContainer` (created in Story 2.3). Do NOT add sonner/react-toastify.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` — check its catalog FIRST before creating any custom UI element
- **Install**: `npm install siesa-ui-kit` (ensure dependency is present in `frontend/package.json`)
- **Usage**: Use `siesa-ui-kit` components for all UI elements when an equivalent exists. Do NOT create custom components if the kit provides one.
- **Constraint**: Radix UI `Dialog` is used for the confirmation dialog (same pattern as `DeleteClienteDialog.tsx` from Story 2.5 using `@radix-ui/react-dialog`). Reuse this dialog library — do not install a new one.
- **Buttons**: Check siesa-ui-kit for destructive/danger button variant first. If none, use Siesa Blue `#0e79fd` (`bg-[#0e79fd] text-white hover:bg-[#154ca9]`) consistent with Stories 3.3 and 3.4.

### Frontend File Locations

```
frontend/src/
  modules/crm/contactos/
    domain/
      IContactoRepository.ts              # MODIFIED: add delete(id: string): Promise<void>
    application/
      useDeleteContacto.ts                # NEW: useMutation hook
    infrastructure/
      contactoApiRepository.ts            # MODIFIED: implement delete()
    presentation/
      DeleteContactoDialog.tsx            # NEW: confirmation dialog component
      ContactoDetailPanel.tsx             # MODIFIED: add "Eliminar" button + DeleteContactoDialog

e2e/tests/contactos/
  contactos-delete.spec.ts               # NEW: E2E-CT-23 to E2E-CT-26
  contactos-api.spec.ts                  # MODIFIED: add API-CT-06 describe block
```

### Backend File Locations

```
backend/src/
  SiesaAgents.Application/Contactos/Commands/
    DeleteContactoCommand.cs               # NEW — command record
    DeleteContactoCommandHandler.cs        # NEW — handler with KeyNotFoundException
  SiesaAgents.Domain/Contactos/Interfaces/
    IContactoRepository.cs                 # MODIFIED — add DeleteAsync
  SiesaAgents.Infrastructure/Repositories/
    ContactoRepository.cs                  # MODIFIED — implement DeleteAsync
  SiesaAgents.API/Endpoints/
    ContactoEndpoints.cs                   # MODIFIED — add DELETE /{id:guid} endpoint
  SiesaAgents.API/Program.cs              # MODIFIED — register DeleteContactoCommandHandler DI

backend/tests/
  SiesaAgents.UnitTests/Handlers/
    ContactoHandlerTests.cs                # MODIFIED — add UNIT-B-CT-05, UNIT-B-CT-10
```

### `useDeleteContacto` Hook Pattern

```typescript
// frontend/src/modules/crm/contactos/application/useDeleteContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import { useToastStore } from '../../../../shared/lib/toastStore'

export function useDeleteContacto() {
  const queryClient = useQueryClient()
  const toast = useToastStore()

  return useMutation({
    mutationFn: (id: string) => contactoApiRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      toast.success('Contacto eliminado correctamente')
    },
    onError: () => toast.error('No se pudo eliminar. Intenta de nuevo.'),
  })
}
```

### `contactoApiRepository.delete()` Pattern

```typescript
// Addition to frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
delete: async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/contactos/${id}`)
},
```

### `DeleteContactoDialog` Pattern

```typescript
// frontend/src/modules/crm/contactos/presentation/DeleteContactoDialog.tsx
import * as Dialog from '@radix-ui/react-dialog'
import { useDeleteContacto } from '../application/useDeleteContacto'
import { useNavigate } from '@tanstack/react-router'

interface Props {
  open: boolean
  onClose: () => void
  contactoId: string
}

export function DeleteContactoDialog({ open, onClose, contactoId }: Props) {
  const deleteMutation = useDeleteContacto()
  const navigate = useNavigate()

  const handleConfirm = () => {
    deleteMutation.mutate(contactoId, {
      onSuccess: () => {
        onClose()
        navigate({ to: '/contactos' })
      },
    })
  }

  const handleCancel = () => {
    if (deleteMutation.isPending) return
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen && !deleteMutation.isPending) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          role="alertdialog"
          aria-labelledby="delete-contacto-dialog-title"
          aria-describedby="delete-contacto-dialog-description"
          data-testid="delete-contacto-dialog"
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-xl w-[400px]"
        >
          <Dialog.Title id="delete-contacto-dialog-title" className="text-lg font-bold">
            Eliminar contacto
          </Dialog.Title>
          <p id="delete-contacto-dialog-description" className="mt-2 text-slate-600">
            ¿Eliminar este contacto?
          </p>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              data-testid="btn-cancelar-eliminar"
              onClick={handleCancel}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="btn-confirmar-eliminar"
              onClick={handleConfirm}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded bg-[#0e79fd] text-white hover:bg-[#154ca9] disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

### Backend: `DeleteContactoCommand` and Handler Pattern

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommand.cs
namespace SiesaAgents.Application.Contactos.Commands;

public record DeleteContactoCommand(Guid Id);
```

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommandHandler.cs
using SiesaAgents.Domain.Contactos.Interfaces;

namespace SiesaAgents.Application.Contactos.Commands;

public class DeleteContactoCommandHandler(IContactoRepository repository)
{
    public async Task HandleAsync(DeleteContactoCommand command, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"Contacto with id {command.Id} was not found.");

        await repository.DeleteAsync(entity, ct);
    }
}
```

### Backend: `DeleteAsync` on Repository

```csharp
// Addition to IContactoRepository interface
Task DeleteAsync(ContactoEntity entity, CancellationToken ct);

// Implementation in ContactoRepository.cs
public async Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
{
    _context.Contactos.Remove(entity);
    await _context.SaveChangesAsync(ct);
}
```

### Backend: `DELETE /api/v1/contactos/{id}` Endpoint

```csharp
// Addition to backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs
group.MapDelete("/{id:guid}", async (
    Guid id,
    DeleteContactoCommandHandler handler,
    CancellationToken ct) =>
{
    await handler.HandleAsync(new DeleteContactoCommand(id), ct);
    return Results.NoContent();
})
.WithName("DeleteContacto")
.Produces(StatusCodes.Status204NoContent)
.Produces(StatusCodes.Status404NotFound);
```

**Response contract:**
- `204 No Content` on success — no response body
- `404 Not Found` Problem Details (RFC 7807, no `stackTrace`) when ID does not exist

### `data-testid` Attributes Required

| Attribute | Component | File | Status |
|---|---|---|---|
| `btn-eliminar` | `ContactoDetailPanel` | `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx` | NEW |
| `delete-contacto-dialog` | `DeleteContactoDialog` (Dialog.Content) | `frontend/src/modules/crm/contactos/presentation/DeleteContactoDialog.tsx` | NEW |
| `btn-confirmar-eliminar` | `DeleteContactoDialog` | same file | NEW |
| `btn-cancelar-eliminar` | `DeleteContactoDialog` | same file | NEW |

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/contactos/contactos-delete.spec.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-CT-23 | P0 | AC1 | Clicking "Eliminar" shows dialog with "Confirmar" and "Cancelar"; no DELETE fired yet |
| E2E-CT-24 | P0 | AC2 | Confirming deletion removes contact from table immediately (no `page.reload()`); URL → `/contactos` |
| E2E-CT-25 | P1 | AC2 | Toast "Contacto eliminado correctamente" visible after deletion |
| E2E-CT-26 | P1 | AC3 | Cancel: no DELETE fired; contact row still present in table |

**E2E implementation notes (from test-design-epic-3.md):**
- E2E-CT-23: Create contact via `apiHelper.createContacto()`. Navigate to `/contactos`, select contact, click Eliminar. Assert `data-testid="delete-contacto-dialog"` visible with both buttons. Set `page.on('request', r => { if (r.method() === 'DELETE') fail() })` before clicking — assert no DELETE fired.
- E2E-CT-24: After `btn-confirmar-eliminar` click, assert deleted contact's nombre is no longer in `contactosPage.contactoRows`. Assert `page.url()` matches `/contactos` (not `/contactos/:id`). No `page.reload()`.
- E2E-CT-25: Assert `page.getByRole('status')` or `page.getByText(/contacto eliminado correctamente/i)` visible after confirmation.
- E2E-CT-26: Use `page.route('**/api/v1/contactos/**', ...)` + method check for DELETE; click Cancelar; assert original contact row still visible in `contactosPage.contactoRows`.

**API Integration Tests — `e2e/tests/contactos/contactos-api.spec.ts` (Story 3.5 scope):**

| Test ID | Priority | Description |
|---------|----------|-------------|
| API-CT-06 | P0 | DELETE `/api/v1/contactos/:id` returns 204; subsequent GET returns 404 Problem Details (no `stackTrace` key) |

**Backend Unit Tests (xUnit):**

| Test ID | Priority | File | Description |
|---------|----------|------|-------------|
| UNIT-B-CT-05 | P1 | `ContactoHandlerTests.cs` | `DeleteContactoHandler` completes without throw when deleting existing contact |
| UNIT-B-CT-10 | P1 | `ContactoHandlerTests.cs` | `DeleteContactoHandler` throws `KeyNotFoundException` when contact ID does not exist |

### Key Anti-Patterns to Avoid

```
❌ calling deleteMutation.mutate() in handleCancel            → only call mutation in handleConfirm
❌ no queryClient.invalidateQueries on success                → always invalidate ['contactos'] (FR27, R2)
❌ navigate() inside useDeleteContacto hook                   → navigate in dialog component's onSuccess callback
❌ missing guard on onOpenChange during isPending             → guard: if (!isOpen && !isPending) onClose()
❌ exposing backend error.message to user                     → generic "No se pudo eliminar. Intenta de nuevo." (NFR6)
❌ spinner for loading state                                  → "Eliminando..." text on disabled submit button
❌ new dialog library                                         → reuse @radix-ui/react-dialog (already installed)
❌ new toast library                                          → reuse existing toastStore.ts + ToastContainer
❌ DateTime in entity                                         → DateTimeOffset (ContactoEntity already uses it)
❌ app.UseSwagger()                                           → Scalar already configured
❌ int/string PK                                              → Guid UUID
❌ English UI text                                            → all labels, buttons, toasts in Spanish
❌ missing KeyNotFoundException → 404 middleware              → ExceptionHandlingMiddleware already covers it (Story 3.4 verified)
```

### Project Structure Notes

- `ContactoDetailPanel.tsx` was updated in Story 3.4 to include an "Editar" button. Add "Eliminar" button alongside it using the same `useState<boolean>` pattern for dialog open state.
- `contactoApiRepository.ts` already has `create()`, `getById()`, and `update()` methods. Add `delete()` following the same pattern (`DELETE` verb, no request body, 204 response → `Promise<void>`).
- `IContactoRepository` already has `create()`, `getById()`, `update()`. Add `deleteAsync` following same contract.
- `DeleteContactoDialog.tsx` mirrors `DeleteClienteDialog.tsx` exactly — same Radix UI Dialog structure, same `role="alertdialog"`, same `isPending` loading state, same `aria-labelledby`+`aria-describedby` WCAG pattern. No `hasContacts` prop is needed for contacts (contacts don't have a sub-entity relationship analogous to clientes→contactos in this epic).
- `ExceptionHandlingMiddleware` already handles `KeyNotFoundException` → 404 (verified Story 2.4 and Story 3.4). No changes needed to middleware.
- This story corresponds to test IDs E2E-CT-23 through E2E-CT-26 and API-CT-06 in `_bmad-output/implementation-artifacts/test-design-epic-3.md`.

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.5 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "API & Communication Patterns" (`DELETE /api/v1/contactos/{id}` → 204), "Frontend Architecture" (queryKey invalidation), "Implementation Patterns & Consistency Rules"
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-3.md` — E2E-CT-23 to E2E-CT-26, API-CT-06, UNIT-B-CT-05, risk R2 (cache invalidation)
- Reference story 2.5: `_bmad-output/implementation-artifacts/stories/2-5-delete-client.md` — analogous delete pattern for clientes domain; exact mirror for architecture decisions and implementation patterns
- Predecessor story 3.4: `_bmad-output/implementation-artifacts/stories/3-4-edit-contact.md` — establishes `ContactoDetailPanel` with action button pattern, `contactoApiRepository`, `IContactoRepository` — all reused here
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack, Backend Stack, Database Conventions, Backend Critical Rules

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- All 8 tasks implemented. Frontend already had useDeleteContacto, IContactoRepository.delete, and contactoApiRepository.delete from earlier development; confirmed they match spec exactly.
- siesa-ui-kit has no destructive/danger button variant; used Siesa Blue `#0e79fd` per company standards and story guidance.
- DeleteContactoDialog mirrors DeleteClienteDialog pattern (Radix UI Dialog, isPending guard, WCAG aria-labelledby/aria-describedby, data-testid attributes).
- ContactoDetailPanel updated: "Eliminar" button added alongside "Editar" with same useState pattern; DeleteContactoDialog rendered at bottom of component.
- Backend: DeleteContactoCommand, DeleteContactoCommandHandler, DeleteAsync in IContactoRepository and ContactoRepository, DELETE endpoint in ContactoEndpoints, DI registration in Program.cs — all implemented.
- Backend unit tests (UNIT-B-CT-05, UNIT-B-CT-10) added to ContactoHandlerTests.cs; CapturingContactoRepository extended with DeleteAsync.
- Frontend TypeScript check: 0 errors. Frontend unit tests (contactos module): 33/33 passed. Pre-existing ClienteListPanel failures (21 tests) are unrelated to this story.

### File List

**NEW:**
- `frontend/src/modules/crm/contactos/presentation/DeleteContactoDialog.tsx`
- `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommand.cs`
- `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommandHandler.cs`
- `e2e/tests/contactos/contactos-delete.spec.ts`

**MODIFIED:**
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`
- `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `e2e/tests/contactos/contactos-api.spec.ts`
- `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`
