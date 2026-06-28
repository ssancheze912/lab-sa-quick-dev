# Story 3.5: Delete Contact

Status: ready

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a contact record,
so that the contact list only contains relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears with the message "¿Eliminar este contacto?" and two buttons: "Confirmar" and "Cancelar".

2. **Given** the user clicks "Confirmar" in the confirmation dialog, **When** the deletion is processed via `DELETE /api/v1/contactos/:id`, **Then** the contact is removed from the list immediately without page reload (FR27), **And** the view navigates back to `/contactos`, **And** a toast displays "Contacto eliminado correctamente".

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the contact record remains in the system unchanged and no DELETE API call is made.

## Tasks / Subtasks

- [ ] Task 1 — Backend: `DELETE /api/v1/contactos/:id` endpoint (AC: #2, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommand.cs` — record with `Guid Id`
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommandHandler.cs` — calls `IContactoRepository.GetByIdAsync(command.Id, ct)`; if null → returns `false`; calls `IContactoRepository.DeleteAsync(entity, ct)`; returns `true`
  - [ ] Add `Task DeleteAsync(ContactoEntity entity, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
  - [ ] Add `DeleteAsync` implementation to `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — `_context.Contactos.Remove(entity); await _context.SaveChangesAsync(ct);`
  - [ ] Add `MapDelete("/{id:guid}", ...)` to `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`:
    - Handler returns `bool`: `true` → `Results.NoContent()` (204); `false` → `Results.Problem(detail: "El contacto solicitado no fue encontrado.", statusCode: 404, title: "Contacto no encontrado")`
    - No request body; no FluentValidation needed (ID comes from route)
  - [ ] Register `DeleteContactoCommandHandler` in `backend/src/SiesaAgents.API/Program.cs` DI

- [ ] Task 2 — Frontend: Application layer — `useDeleteContacto` mutation hook (AC: #2, #3)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useDeleteContacto.ts` — TanStack Query `useMutation`:
    - `mutationFn: (id: string) => contactoApiRepository.delete(id)`
    - `onSuccess: (_result, id) => { queryClient.invalidateQueries({ queryKey: ['contactos'] }); queryClient.removeQueries({ queryKey: ['contactos', id] }); }` — toast handled at component level
    - Export `useDeleteContacto` as named export
  - [ ] Extend `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `delete(id: string): Promise<void>`
  - [ ] Extend `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — add `delete(id: string)` method: `DELETE /api/v1/contactos/${id}` via `apiClient`; 204 → return; rethrow on 4xx/5xx

- [ ] Task 3 — Frontend: Presentation layer — confirmation dialog and "Eliminar" button in `ContactoDetailView` (AC: #1, #2, #3)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`:
    - Add `"Eliminar"` button (`data-testid="btn-eliminar"`) visible only in the data-loaded state (same guard as "Editar" from Story 3.4)
    - Clicking it sets local `useState<boolean>` `isDeleteDialogOpen = true`
    - Render `AlertDialog` when `isDeleteDialogOpen === true` using `frontend/src/components/ui/alert-dialog.tsx` (installed in Story 2.5)
    - `handleConfirmDelete`: calls `deleteMutation.mutate(contactoId, { onSuccess, onError })`
    - `onSuccess`: `toast.success('Contacto eliminado correctamente')`, `setIsDeleteDialogOpen(false)`, `onContactoDeleted?.()`
    - `onError`: `toast.error('No se pudo eliminar el contacto. Intenta de nuevo.')`, `setIsDeleteDialogOpen(false)`
  - [ ] Add `onContactoDeleted?: () => void` prop to `ContactoDetailView` to allow parent route to navigate back to `/contactos`

- [ ] Task 4 — Frontend: Route-level "return to list" wiring (AC: #2)
  - [ ] Update `frontend/src/routes/_app/contactos.$contactoId.tsx`:
    - Pass `onContactoDeleted` prop to `ContactoDetailView`:
      ```tsx
      const navigate = useNavigate();
      <ContactoDetailView
        contactoId={contactoId}
        onContactoDeleted={() => navigate({ to: '/contactos' })}
      />
      ```
    - Navigates to `/contactos` (no selected contact) — consistent with FR30 deep linking behavior from Stories 3.2–3.4

- [ ] Task 5 — Tests (AC: #1, #2, #3) — aligned with test-design-epic-3.md
  - [ ] **Backend API — P1**: `DELETE /api/v1/contactos/:id` with valid ID returns 204 (xUnit + WebApplicationFactory) — TC-E3-3-5-API-1
  - [ ] **Backend API — P1**: `DELETE /api/v1/contactos/unknown-uuid` returns 404 + Problem Details (xUnit) — TC-E3-3-5-API-2
  - [ ] **Frontend component — P0**: click "Eliminar" → dialog appears with "¿Eliminar este contacto?", "Confirmar", "Cancelar" (Vitest + RTL + MSW) — TC-E3-3-5-CMP-1, tests AC #1, R-009
  - [ ] **Frontend component — P1**: click "Cancelar" → dialog closes, no DELETE called (MSW asserts) (Vitest + RTL + MSW) — TC-E3-3-5-CMP-2, tests AC #3
  - [ ] **Frontend component — P0**: click "Confirmar" → DELETE called once, `invalidateQueries(['contactos'])` triggered, `onContactoDeleted` called (Vitest + RTL + MSW) — TC-E3-3-5-CMP-3, tests AC #2, R-002
  - [ ] **Frontend component — P2**: click "Confirmar" → toast "Contacto eliminado correctamente" appears (Vitest + RTL + MSW) — TC-E3-3-5-CMP-4, R-010
  - [ ] **E2E — P0**: delete contact, confirm dialog, assert item removed from list, view navigates to `/contactos` (Playwright, R-002) — TC-E3-3-5-E2E-1 — deferred (requires running app + seeded data)

## Dev Notes

### Architecture Context

This story implements the delete path for Epic 3's contact management feature. It follows the exact same pattern established in Story 2.5 (Delete Client) applied to the contactos domain:
- `DELETE /api/v1/contactos/:id` backend endpoint (Application Command + Infrastructure DeleteAsync)
- `useDeleteContacto` TanStack Query mutation hook with `invalidateQueries(['contactos'])` and `removeQueries(['contactos', id])` on success
- Confirmation `AlertDialog` in `ContactoDetailView` — same `AlertDialog` component from `frontend/src/components/ui/alert-dialog.tsx` installed in Story 2.5
- `onContactoDeleted` callback prop to navigate back to `/contactos` (empty state)

**Scope boundary (CRITICAL):** This story covers **delete only**. Do NOT modify `ContactoForm`, `useCreateContacto`, or `useUpdateContacto`. The "Editar" button from Story 3.4 and "Nuevo contacto" button from Story 3.3 must remain fully functional after this story.

**No cascade complexity:** Unlike Story 2.5 (Delete Client), deleting a contact does NOT cascade to any child entity. The contact has a `clienteId` FK pointing to `clientes` — this is a non-owning side (`ON DELETE SET NULL` was applied to `contactos.cliente_id` for the client-delete direction). Deleting a contact is a simple hard-delete with no associated entity cleanup needed at the application layer. No `hadContacts`-style flag or two-response strategy needed: always return 204 on success.

**FR27 — Immediate list update:** `queryClient.invalidateQueries({ queryKey: ['contactos'] })` in `useDeleteContacto` `onSuccess` triggers automatic refetch, removing the deleted contact from the list without page reload. Also call `queryClient.removeQueries({ queryKey: ['contactos', id] })` to evict the single-contact cache entry for the deleted ID.

**Navigation after delete:** After deletion, navigate to `/contactos` (no `contactoId` in URL) via `useNavigate`. This is consistent with FR30 deep linking behavior established in Stories 3.2–3.4. The route renders the empty/default detail panel state.

**AlertDialog:** Use the `AlertDialog` component already installed at `frontend/src/components/ui/alert-dialog.tsx` (created in Story 2.5). Verify it exists before implementation: `ls frontend/src/components/ui/alert-dialog.tsx`. Do NOT create a custom dialog or use `window.confirm()`.

**Toast:** Toast handling at component level (not in hook) — the contact delete has no conditional messaging (unlike Story 2.5's `hadContacts` variant). Call `toast.success('Contacto eliminado correctamente')` directly in `onSuccess` inside the component's `handleConfirmDelete`.

**MasterCrud note:** MasterCrud is NOT applicable here. The custom layout for contactos follows the same established architecture as Epics 1–3.

### Backend: DeleteContactoCommand and Handler

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommand.cs
namespace SiesaAgents.Application.Contactos.Commands;

public record DeleteContactoCommand(Guid Id);
```

```csharp
// backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommandHandler.cs
namespace SiesaAgents.Application.Contactos.Commands;

public class DeleteContactoCommandHandler
{
    private readonly IContactoRepository _repo;

    public DeleteContactoCommandHandler(IContactoRepository repo) => _repo = repo;

    public async Task<bool> HandleAsync(DeleteContactoCommand command, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(command.Id, ct);
        if (entity is null) return false;

        await _repo.DeleteAsync(entity, ct);
        return true;
    }
}
```

### Backend: IContactoRepository Extension

```csharp
// Add to backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs
Task DeleteAsync(ContactoEntity entity, CancellationToken ct);
```

```csharp
// Add to backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs
public async Task DeleteAsync(ContactoEntity entity, CancellationToken ct)
{
    _context.Contactos.Remove(entity);
    await _context.SaveChangesAsync(ct);
}
```

### Backend: DELETE /api/v1/contactos/:id Endpoint

```csharp
// Add inside MapContactoEndpoints() in ContactoEndpoints.cs
group.MapDelete("/{id:guid}", async (
    Guid id,
    DeleteContactoCommandHandler handler,
    CancellationToken ct) =>
{
    var found = await handler.HandleAsync(new DeleteContactoCommand(id), ct);

    if (!found)
        return Results.Problem(
            detail: "El contacto solicitado no fue encontrado.",
            statusCode: 404,
            title: "Contacto no encontrado");

    return Results.NoContent();
});
```

**Response shapes:**
```
// 204 No Content — success (no body)

// 404 Not Found — Problem Details RFC 7807
{
  "title": "Contacto no encontrado",
  "status": 404,
  "detail": "El contacto solicitado no fue encontrado."
}
```

### Frontend: useDeleteContacto Hook

```typescript
// frontend/src/modules/crm/contactos/application/useDeleteContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';

export const useDeleteContacto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactoApiRepository.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      queryClient.removeQueries({ queryKey: ['contactos', id] });
      // Toast is handled at component level
    },
  });
};
```

**CRITICAL:** `invalidateQueries({ queryKey: ['contactos'] })` — NOT `['contacto']` (singular). No `exact: true` — broad invalidation refreshes both list (`['contactos']`) and single-contact (`['contactos', id]`) queries.

### Frontend: contactoApiRepository — delete extension

```typescript
// Add to frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
delete: async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/contactos/${id}`);
},
```

Note: Axios throws on 4xx/5xx, so 404 propagates as an `AxiosError` to `onError`.

### Frontend: ContactoDetailView — Eliminar button + AlertDialog

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx (update)
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteContacto } from '../application/useDeleteContacto';

interface ContactoDetailViewProps {
  // existing props from Stories 3.2 + 3.4...
  onContactoDeleted?: () => void;
}

// Inside the component, in the data-loaded render path:
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const deleteMutation = useDeleteContacto();

const handleConfirmDelete = () => {
  deleteMutation.mutate(contacto.id, {
    onSuccess: () => {
      toast.success('Contacto eliminado correctamente');
      setIsDeleteDialogOpen(false);
      onContactoDeleted?.();
    },
    onError: () => {
      toast.error('No se pudo eliminar el contacto. Intenta de nuevo.');
      setIsDeleteDialogOpen(false);
    },
  });
};

// In the JSX (data-loaded state only, alongside existing "Editar" button):
<button
  onClick={() => setIsDeleteDialogOpen(true)}
  data-testid="btn-eliminar"
  aria-label="Eliminar contacto"
  className="rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
>
  Eliminar
</button>

<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este contacto?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel data-testid="btn-cancel-delete">Cancelar</AlertDialogCancel>
      <AlertDialogAction
        data-testid="btn-confirm-delete"
        disabled={deleteMutation.isPending}
        onClick={handleConfirmDelete}
      >
        {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Frontend: Route-level onContactoDeleted wiring

```typescript
// frontend/src/routes/_app/contactos.$contactoId.tsx (update)
import { useNavigate } from '@tanstack/react-router';
import { ContactoDetailView } from '../../modules/crm/contactos/presentation/ContactoDetailView';

const navigate = useNavigate();

<ContactoDetailView
  contactoId={contactoId}
  onContactoDeleted={() => navigate({ to: '/contactos' })}
/>
```

### Project Structure Notes

**Files to create:**

```
backend/
└── src/
    └── SiesaAgents.Application/
        └── Contactos/
            └── Commands/
                ├── DeleteContactoCommand.cs           ← CREATE
                └── DeleteContactoCommandHandler.cs    ← CREATE

frontend/
└── src/
    └── modules/crm/contactos/
        └── application/
            └── useDeleteContacto.ts                   ← CREATE
```

**Files to modify:**

```
backend/
└── src/
    ├── SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs   ← ADD DeleteAsync
    ├── SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs    ← ADD DeleteAsync impl
    ├── SiesaAgents.API/Endpoints/ContactoEndpoints.cs                   ← ADD MapDelete("/{id:guid}")
    └── SiesaAgents.API/Program.cs                                       ← REGISTER DeleteContactoCommandHandler

frontend/
└── src/
    ├── modules/crm/contactos/domain/IContactoRepository.ts              ← ADD delete method
    ├── modules/crm/contactos/infrastructure/contactoApiRepository.ts    ← ADD delete impl
    ├── modules/crm/contactos/presentation/ContactoDetailView.tsx        ← ADD Eliminar button + AlertDialog + onContactoDeleted prop
    └── routes/_app/contactos.$contactoId.tsx                            ← WIRE onContactoDeleted → navigate('/contactos')
```

**Verify from prior stories — DO NOT recreate:**
- `alert-dialog.tsx` — Story 2.5 created `frontend/src/components/ui/alert-dialog.tsx`; reuse directly
- `useCreateContacto.ts` — Story 3.3; do NOT modify
- `useUpdateContacto.ts` — Story 3.4; do NOT modify
- `ContactoForm.tsx` — Stories 3.3/3.4; do NOT modify
- `ContactoDetailView.tsx` — extend only; "Editar" button from Story 3.4 must remain functional
- `IContactoRepository.ts` — already has `getAll`, `getById`, `create`, `update` from Stories 3.1–3.4
- `contactoApiRepository.ts` — already has `getAll`, `getById`, `create`, `update`; add `delete` only
- `GetByIdAsync` on `IContactoRepository` — already exists from Story 3.2; reuse in handler
- `apiClient.ts` — Story 1.2; use existing instance
- `Toast` (sonner) — mounted in `frontend/src/main.tsx` since Story 2.3; no changes needed

### TanStack Query Key Alignment

Per architecture canonical keys:
- `['contactos']` → all contacts list (`useContactos`, Story 3.1)
- `['contactos', id]` → single contact (`useContacto`, Story 3.2)

`useDeleteContacto`'s `invalidateQueries({ queryKey: ['contactos'] })` (without `exact: true`) invalidates both the list and the per-id cache, ensuring `ContactoListView` no longer shows the deleted contact. `removeQueries({ queryKey: ['contactos', id] })` evicts the single-contact cache entry entirely to prevent stale data if the user deep-links to the deleted ID before next refetch.

### Testing Approach

**Backend API integration tests** use `WebApplicationFactory<Program>` + Testcontainers PostgreSQL (established in Story 1.3). Reuse `contactoFactory` builder from Stories 3.1–3.4. Key scenarios:
- DELETE valid ID → 204 No Content
- DELETE unknown UUID → 404 Problem Details

**Frontend component tests** use Vitest + RTL + MSW 2.x. Reuse `contactoFixture` from Stories 3.1–3.4:
- MSW handler: `http.delete('/api/v1/contactos/:id', resolver)` responding with 204
- Override handler per test for 404/500 error scenarios
- R-009 mitigation: click "Eliminar", assert dialog text before clicking "Confirmar"
- R-002 mitigation: confirm delete, assert `queryClient.invalidateQueries` called (via MSW capture)

**Key test IDs (from test-design-epic-3.md):**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E3-3-5-API-1 | API | DELETE valid ID → 204 No Content | P1 |
| TC-E3-3-5-API-2 | API | DELETE unknown UUID → 404 Problem Details | P1 |
| TC-E3-3-5-CMP-1 | Component | Click "Eliminar" → dialog with "¿Eliminar este contacto?", "Confirmar", "Cancelar" | P0 |
| TC-E3-3-5-CMP-2 | Component | Click "Cancelar" → dialog closes, no DELETE called | P1 |
| TC-E3-3-5-CMP-3 | Component | Click "Confirmar" → DELETE called once, invalidateQueries triggered, onContactoDeleted called | P0 |
| TC-E3-3-5-CMP-4 | Component | Click "Confirmar" → toast "Contacto eliminado correctamente" | P2 |
| TC-E3-3-5-E2E-1 | E2E | Full delete journey → item removed from list + navigation to /contactos | P0 (deferred) |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `DELETE /api/v1/contactos/:id` returns 204 — NOT 200 with empty body
- [ ] 404 response uses `Results.Problem(...)` with Problem Details RFC 7807 — NOT `Results.NotFound()`
- [ ] No stack traces in any error response (NFR6) — `ExceptionHandlingMiddleware` from Story 1.3 remains active
- [ ] `queryClient.invalidateQueries({ queryKey: ['contactos'] })` called in `useDeleteContacto` `onSuccess` (FR27, R-002)
- [ ] `queryClient.removeQueries({ queryKey: ['contactos', id] })` also called to evict single-contact cache entry
- [ ] Toast displays exactly "Contacto eliminado correctamente" in Spanish (R-010)
- [ ] Toast is called in component `onSuccess`, NOT inside the mutation hook
- [ ] "Eliminar" button uses `AlertDialog`, NOT `window.confirm()`
- [ ] "Eliminar" button only visible in the data-loaded state (not during loading/error/not-found)
- [ ] "Confirmar" button disabled (`disabled={isPending}`) during mutation
- [ ] "Cancelar" button does NOT call any mutation — only closes dialog
- [ ] `onContactoDeleted` navigates to `/contactos` (URL without contactoId) — returns to list without selected contact
- [ ] All user-facing text in Spanish: "Eliminar", "¿Eliminar este contacto?", "Esta acción no se puede deshacer.", "Confirmar", "Cancelar", toast messages
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `ContactoForm`, `useCreateContacto`, `useUpdateContacto` NOT modified — no regressions from Stories 3.3/3.4
- [ ] "Editar" button in `ContactoDetailView` (Story 3.4) remains functional after modifications
- [ ] `data-testid="btn-eliminar"` on trigger button
- [ ] `data-testid="btn-confirm-delete"` on confirm button inside AlertDialog
- [ ] `data-testid="btn-cancel-delete"` on cancel button inside AlertDialog
- [ ] `aria-label="Eliminar contacto"` on "Eliminar" button (WCAG 2.1 AA)
- [ ] Backend error responses use Problem Details RFC 7807 — no stack traces exposed

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.5`]
- Architecture — DELETE /api/v1/contactos/{id}: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — 204 No Content for DELETE: [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- Architecture — Mutation invalidation pattern: [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture — Frontend folder structure (contactos module): [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Test design — R-002 (invalidateQueries), R-009 (confirmation dialog), R-010 (toast Spanish text): [Source: `_bmad-output/test-design-epic-3.md#2. Risk Assessment`]
- Test design — P0 delete+navigation E2E, P1 dialog+cancel component tests: [Source: `_bmad-output/test-design-epic-3.md#4. Test Coverage Plan`]
- Analog story — useDeleteCliente, DeleteClienteCommand, ClienteDetailView AlertDialog, onClienteDeleted: [Source: `_bmad-output/implementation-artifacts/2-5-delete-client.md`]
- Preceding story — ContactoDetailView with "Editar" button, data-loaded guard pattern: [Source: `_bmad-output/implementation-artifacts/3-4-edit-contact.md`]
- Preceding story — IContactoRepository, ContactoEntity, ContactoEndpoints, GetByIdAsync: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- AlertDialog component (installed in Story 2.5): [Source: `frontend/src/components/ui/alert-dialog.tsx`]
- Company standards — Minimal API DELETE 204, Problem Details RFC 7807: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- Company standards — TanStack Query mutations, invalidateQueries: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Company standards — Spanish user-facing text, WCAG 2.1 AA: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

None.

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
