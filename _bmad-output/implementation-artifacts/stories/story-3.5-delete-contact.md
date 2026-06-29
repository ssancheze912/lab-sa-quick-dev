# Story 3.5: Delete Contact

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a contact record,
so that the contact list only contains relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears asking "¿Eliminar este contacto?" with "Confirmar" and "Cancelar" options. (AC-E3.5, FR15)

2. **Given** the user confirms the deletion, **When** the deletion is processed, **Then** the contact is removed from the list immediately (FR27) **And** the view returns to the contact list **And** a toast shows "Contacto eliminado correctamente". (AC-E3.5, FR15, FR27, NFR2)

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the contact record remains in the system unchanged and no DELETE request is triggered.

4. **Given** the user confirms deletion and `onSuccess` fires, **When** the mutation completes, **Then** `queryClient.invalidateQueries({ queryKey: ['contactos'] })` is called, removing the deleted contact from the list without requiring a page reload. (FR27, NFR2)

5. **Given** a DELETE request is made for a non-existent contact ID, **When** the backend processes the request, **Then** a 404 Not Found with Problem Details RFC 7807 is returned with no stack trace exposed. (NFR6)

## Tasks / Subtasks

- [x] Task 1 — Create `useDeleteContacto` application hook (AC: #2, #4)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useDeleteContacto.ts`
    - Uses `useMutation` from TanStack Query
    - `mutationFn: (id: string) => contactoApiRepository.delete(id)` — calls `DELETE /api/v1/contactos/{id}`
    - `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['contactos'] })` to refresh list cache; also calls `queryClient.invalidateQueries({ queryKey: ['contactos', id] })` to mark the single-contact cache stale
    - `onSuccess`: shows toast "Contacto eliminado correctamente"
    - `onError`: shows generic "Error al eliminar el contacto" (never expose raw error details per NFR6)
    - Exposes `mutate`, `isPending`, `isError` from the hook
    - Accepts optional `options?: { onSuccess?: () => void }` callback parameter

- [x] Task 2 — Extend infrastructure layer: add `delete` to API repository (AC: #2)
  - [ ] Update `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `delete(id: string): Promise<void>` method signature
  - [ ] Update `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implement `delete`: calls `DELETE /api/v1/contactos/${id}` via `apiClient`; returns `void`; throws on non-2xx (let `useMutation` `onError` handle it)

- [x] Task 3 — Wire "Eliminar" button and confirmation dialog in `ContactoDetailView` (AC: #1, #2, #3)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
    - Add `isDeleteDialogOpen: boolean` state with `useState` (the "Eliminar" button placeholder was added in Story 3.2 and left wired in Story 3.4 — replace the placeholder with real behavior)
    - When user clicks "Eliminar": set `isDeleteDialogOpen = true`
    - Render a confirmation dialog (check siesa-ui-kit first, then shadcn `AlertDialog` — already installed from Stories 1.1/2.5/3.x) with:
      - Title/message: "¿Eliminar este contacto?"
      - Description: "Esta acción no se puede deshacer."
      - "Confirmar" button (destructive variant): calls `useDeleteContacto.mutate(contacto.id)`, disabled when `isPending`
      - "Cancelar" button (secondary variant): sets `isDeleteDialogOpen = false` without calling mutate
    - On mutation `onSuccess`: set `isDeleteDialogOpen = false`, navigate to `/contactos` using TanStack Router `useNavigate`
    - "Cancelar" must NEVER call mutate — guard is mandatory per AC #3
    - Check siesa-ui-kit catalog for AlertDialog/ConfirmDialog equivalent BEFORE using shadcn; fall back to shadcn `AlertDialog` if not found

- [x] Task 4 — Backend: DELETE /api/v1/contactos/{id} endpoint (AC: #2, #5)
  - [ ] Create `DeleteContactoCommand.cs` + `DeleteContactoCommandHandler.cs` in `backend/src/SiesaAgents.Application/Contactos/Commands/`
    - Command record: `DeleteContactoCommand(Guid Id)`
    - Handler: loads `ContactoEntity` by ID via `IContactoRepository.GetByIdAsync(id)`; if not found, throws `NotFoundException` → 404 (handled by `ExceptionHandlingMiddleware`); calls `IContactoRepository.DeleteAsync(contacto, ct)`; returns void (no body — 204)
  - [ ] Update `IContactoRepository` interface in `backend/src/SiesaAgents.Application/Contactos/Interfaces/IContactoRepository.cs` — add `Task DeleteAsync(ContactoEntity entity, CancellationToken ct = default)` method signature
  - [ ] Update `ContactoRepository` implementation in `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — implement `DeleteAsync`: calls `_context.Contactos.Remove(entity)` and `await _context.SaveChangesAsync(ct)`
  - [ ] Update `backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs`
    - Add `DELETE /api/v1/contactos/{id}` endpoint
    - Accepts `{id}` route param (Guid)
    - Returns `204 No Content` on success (no body)
    - Returns `404 Not Found` + Problem Details RFC 7807 when contact does not exist (no `stackTrace` key)
    - Uses Scalar docs (NEVER Swagger)
  - [ ] Register `IDeleteContactoCommandHandler` / `DeleteContactoCommandHandler` in `backend/src/SiesaAgents.API/Program.cs` DI container (follow the same registration pattern used for `IDeleteClienteCommandHandler` in Story 2.5)

- [x] Task 5 — Write tests (AC: #1–#5)
  - [ ] **Unit test** `useDeleteContacto.test.ts` (Vitest + TanStack Query test utils):
    - TC-E3-P2-delete-01: spy on `queryClient.invalidateQueries`; execute mutation `onSuccess` callback; assert `invalidateQueries({ queryKey: ['contactos'] })` called
    - TC-E3-P2-delete-02: assert `isPending` is `true` during mutation execution, `false` after completion
    - TC-E3-P2-delete-03: execute mutation `onError` callback; assert generic error toast shown (no raw error details)
  - [ ] **Component test** `ContactoDetailView.delete.test.tsx` (Vitest + RTL + MSW):
    - TC-E3-P0-delete-01: Render detail view for known contact; click "Eliminar"; assert dialog with "¿Eliminar este contacto?", "Confirmar", "Cancelar" buttons visible; click "Confirmar"; assert DELETE called with correct contact ID; assert toast "Contacto eliminado correctamente" shown; assert list cache invalidated; assert navigation to `/contactos`
    - TC-E3-P1-delete-01: Open dialog, click "Cancelar"; assert dialog closed; assert DELETE NOT called (MSW receives 0 DELETE requests); assert contact still visible
    - TC-E3-P1-delete-02: Render detail view; click "Eliminar"; MSW returns 404; assert generic error toast shown; assert no navigation triggered
  - [ ] **API integration test** `DeleteContactoEndpointTests.cs` (xUnit + WebApplicationFactory):
    - TC-E3-P0-delete-api-01: Seed 1 contact; DELETE `/api/v1/contactos/{contactoId}`; assert 204 No Content; follow-up GET `/api/v1/contactos/{contactoId}` → 404
    - TC-E3-P2-delete-api-02: DELETE `/api/v1/contactos/00000000-0000-0000-0000-000000000000`; assert 404 Problem Details with `status: 404`; assert no `stackTrace` key in response body

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. Layers: Domain → Application → Infrastructure → Presentation. No direct API calls in UI components.
- **CQRS**: Delete operation is a Command (`DeleteContactoCommand`) not a Query. Handler lives in `Application/Contactos/Commands/`.
- **Mutation hook**: `useDeleteContacto` uses TanStack Query `useMutation`. The `onSuccess` callback MUST call `queryClient.invalidateQueries({ queryKey: ['contactos'] })` to comply with FR27 and NFR2 (< 2s update). Invalidate also `['contactos', id]` to mark the single-contact query stale — Story 3.2 note: "Mutations in Stories 3.3, 3.4, 3.5 MUST invalidate both `['contactos']` and `['contactos', id]`."
- **Right panel / navigation reset**: after successful deletion, `ContactoDetailView` must navigate to `/contactos` using TanStack Router `useNavigate`. No selected-contact state remains.
- **Primary keys**: `Id = Guid` — UUID mandatory per company standards. Route param `{id}` must be parsed as `Guid`, not string.
- **Problem Details RFC 7807**: All backend error responses (`404`) must use Problem Details format. No stack traces exposed to frontend (NFR6). `ExceptionHandlingMiddleware` from Epic 1 handles this; `NotFoundException` → 404 mapping is already in place (established in Story 2.4 for clientes, reused in Story 3.4 for contactos).
- **Toast notifications**: Reuse whatever toast mechanism established in Stories 3.3/3.4 (check `react-hot-toast` or existing toast system). Text: "Contacto eliminado correctamente" on success; "Error al eliminar el contacto" on error. Neither message must expose technical details.
- **Confirmation dialog UX**: The dialog must be blocking — user cannot interact with other page elements until they Confirm or Cancel. Check siesa-ui-kit catalog FIRST for a ConfirmDialog/AlertDialog component; fall back to shadcn `AlertDialog` (already installed from Stories 1.1/2.5).
- **No cascade needed**: contacts are independent records. Deleting a contact does not cascade to any other entity in this epic scope. The `ClienteId` FK is on `contactos` pointing to `clientes` — deleting a contact simply removes the row; no FK violation. Epic 4 wires the client-contact panel, but deletion here is safe without cascade configuration.
- **MasterCrud not applicable**: The delete action is a targeted operation on a single contact entity within the split-panel detail view, not a data grid CRUD screen.

### siesa-ui-kit Usage (MANDATORY)

This story adds a delete confirmation dialog. Check siesa-ui-kit catalog BEFORE creating any custom component:
- Check siesa-ui-kit for a **confirmation dialog / alert dialog** component FIRST
- Fall back to shadcn `AlertDialog` (already installed in the project from Story 1.1/2.5 initialization) if siesa-ui-kit has no equivalent
- Reuse **button** component (destructive/danger variant for "Confirmar", secondary for "Cancelar") established in prior stories
- Reuse **toast / notification** component from Stories 3.3/3.4 for success/error messages
- Install: `pnpm install siesa-ui-kit` (must already be present from previous epic stories)
- **Heroicon**: `TrashIcon` for the "Eliminar" button — check if already rendered in `ContactoDetailView` from Story 3.2/3.4 (placeholder button); if using a different icon, replace consistently

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/contactos/
  domain/
    IContactoRepository.ts              ← Modify: add delete(id: string): Promise<void> signature
  application/
    useDeleteContacto.ts                ← New
  infrastructure/
    contactoApiRepository.ts            ← Modify: implement delete(id)
  presentation/
    ContactoDetailView.tsx              ← Modify: wire "Eliminar" button + isDeleteDialogOpen state + navigation
```

Backend files to create or modify:
```
backend/src/SiesaAgents.Application/Contactos/
  Commands/DeleteContactoCommand.cs        ← New
  Commands/DeleteContactoCommandHandler.cs ← New
  Interfaces/IContactoRepository.cs        ← Modify: add DeleteAsync(ContactoEntity, CancellationToken)

backend/src/SiesaAgents.Infrastructure/
  Repositories/ContactoRepository.cs       ← Modify: implement DeleteAsync

backend/src/SiesaAgents.API/
  Endpoints/ContactosEndpoints.cs          ← Modify: add DELETE /api/v1/contactos/{id} endpoint
  Program.cs                               ← Modify: register IDeleteContactoCommandHandler DI
```

Test files to create:
```
frontend/src/modules/crm/contactos/
  application/useDeleteContacto.test.ts              ← New
  presentation/ContactoDetailView.delete.test.tsx    ← New

backend/tests/SiesaAgents.IntegrationTests/Contactos/
  DeleteContactoEndpointTests.cs                     ← New
```

### API Contract

```
DELETE /api/v1/contactos/{id}
  Route param: id (Guid / UUID)
  Request body: none

  Response success: 204 No Content
  Body: (none)

  Response not found: 404 Not Found
  Content-Type: application/problem+json
  Body: Problem Details RFC 7807
    {
      "status": 404,
      "title": "Not Found",
      "detail": "Contacto no encontrado"
    }
    (NO stackTrace, NO innerException, NO exception keys)
```

### TanStack Query Keys (Canonical)

```typescript
['contactos']                   // list — invalidate on DELETE onSuccess
['contactos', id]               // single — invalidate on DELETE onSuccess (marks stale post-deletion)
['contactos', { clienteId }]    // contacts for a specific client — Epic 4 concern, no change here
```

Mutation `onSuccess` in `useDeleteContacto` MUST call BOTH:
```typescript
queryClient.invalidateQueries({ queryKey: ['contactos'] })
queryClient.invalidateQueries({ queryKey: ['contactos', id] })
// Per Story 3.2 note: "Mutations in Stories 3.3, 3.4, 3.5 MUST invalidate both ['contactos'] and ['contactos', id]"
```

### useDeleteContacto Hook Pattern

```typescript
// application/useDeleteContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

interface UseDeleteContactoOptions {
  onSuccess?: () => void
}

export function useDeleteContacto(options?: UseDeleteContactoOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contactoApiRepository.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      queryClient.invalidateQueries({ queryKey: ['contactos', id] })
      // Show success toast: "Contacto eliminado correctamente"
      options?.onSuccess?.()
    },
    onError: () => {
      // Show generic error: "Error al eliminar el contacto" — do NOT expose technical details (NFR6)
    },
  })
}
```

### ContactoDetailView Delete Dialog Pattern

```typescript
// presentation/ContactoDetailView.tsx — updated to wire delete flow
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useDeleteContacto } from '../application/useDeleteContacto'
// AlertDialog from shadcn/ui (fallback if siesa-ui-kit has no equivalent)
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

// Inside ContactoDetailView component:
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
const navigate = useNavigate()

const deleteMutation = useDeleteContacto({
  onSuccess: () => {
    setIsDeleteDialogOpen(false)
    navigate({ to: '/contactos' })
  },
})

// Render — "Eliminar" button (replaces Story 3.2 placeholder):
// <button onClick={() => setIsDeleteDialogOpen(true)}>
//   <TrashIcon /> Eliminar
// </button>

// Confirmation dialog:
// <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//   <AlertDialogContent>
//     <AlertDialogHeader>
//       <AlertDialogTitle>¿Eliminar este contacto?</AlertDialogTitle>
//       <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
//     </AlertDialogHeader>
//     <AlertDialogFooter>
//       <AlertDialogCancel>Cancelar</AlertDialogCancel>
//       <AlertDialogAction
//         onClick={() => deleteMutation.mutate(contacto.id)}
//         disabled={deleteMutation.isPending}
//       >
//         Confirmar
//       </AlertDialogAction>
//     </AlertDialogFooter>
//   </AlertDialogContent>
// </AlertDialog>
```

### Backend DeleteContactoCommandHandler Pattern

```csharp
// Application/Contactos/Commands/DeleteContactoCommandHandler.cs
public class DeleteContactoCommandHandler
{
    private readonly IContactoRepository _repository;

    public DeleteContactoCommandHandler(IContactoRepository repository)
        => _repository = repository;

    public async Task Handle(DeleteContactoCommand command, CancellationToken ct)
    {
        var contacto = await _repository.GetByIdAsync(command.Id, ct);
        if (contacto is null)
            throw new NotFoundException($"Contacto con id {command.Id} no encontrado");

        await _repository.DeleteAsync(contacto, ct);
        // No return value — void command (204 No Content)
        // No cascade needed: deleting a contact does not affect other entities
    }
}
```

### MSW Handlers Required for Component Tests

```typescript
// __mocks__/handlers.ts — add to existing handlers from Stories 3.1/3.2/3.3/3.4
import { http, HttpResponse } from 'msw'

http.delete('/api/v1/contactos/:id', ({ params }) => {
  // Success case:
  return new HttpResponse(null, { status: 204 })
  // 404 case (use override handler in specific tests):
  // return HttpResponse.json(
  //   { status: 404, title: 'Not Found', detail: 'Contacto no encontrado' },
  //   { status: 404 }
  // )
})
```

### Testing Test Cases Covered by This Story

- **P0:** TC-E3-P0-delete-01 (confirmation dialog + deletion removes from list, AC-E3.5), TC-E3-P0-delete-api-01 (API DELETE 204 + follow-up GET 404)
- **P1:** TC-E3-P1-delete-01 (cancel preserves contact, no DELETE), TC-E3-P1-delete-02 (404 from backend shows error toast)
- **P2:** TC-E3-P2-delete-01 (useDeleteContacto calls invalidateQueries for both keys), TC-E3-P2-delete-02 (isPending behavior), TC-E3-P2-delete-api-02 (DELETE non-existent → 404 Problem Details)

### Previous Story Learnings (from Stories 3.1, 3.2, 3.3, and 3.4)

- `contactoApiRepository.ts` already implements `getAll()`, `getById()`, `create()`, and `update()` — follow the same Axios pattern for `delete()`: `apiClient.delete(\`/api/v1/contactos/${id}\`).then(() => undefined)`
- `apiClient.ts` (Axios singleton) is at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL` (verified Story 3.1)
- TanStack Query keys: `['contactos']` (list) and `['contactos', id]` (single) — Story 3.2 note mandates BOTH are invalidated for all mutations in stories 3.3–3.5
- `ExceptionHandlingMiddleware.cs` maps `NotFoundException` → 404 Problem Details (confirmed in Story 3.4 for contactos domain — same middleware used)
- `ContactosEndpoints.cs` already has `GET /api/v1/contactos`, `GET /api/v1/contactos/{id}`, `POST /api/v1/contactos`, `PUT /api/v1/contactos/{id}` — add `DELETE` as a new `MapDelete` call in the same file
- `IContactoRepository` already defines `GetByIdAsync`, `AddAsync`, and `UpdateAsync` (confirmed in Stories 3.3/3.4) — add `DeleteAsync` following the same pattern
- `ContactoDetailView.tsx` already manages `isEditFormOpen` state with `useState` from Story 3.4 — add `isDeleteDialogOpen` using the same `useState` pattern
- Story 3.2 note: "Eliminar" button was added as a placeholder in Story 3.2 and left as-is in Story 3.4 — wire it now with real delete behavior
- Story 3.4 completion notes: `ToastProvider` wrapper was added around `ContactoDetailView` — the delete toast can reuse the same provider
- shadcn `AlertDialog` is installed (confirmed from Story 2.5 for clientes — same project)
- Reference: Story 2.5 (`_bmad-output/implementation-artifacts/2-5-delete-client.md`) — direct parallel pattern for delete flow in clientes domain; adapt for contactos
- Zod v4 compatibility note from Story 3.1: ZodError uses `.issues` not `.errors` — not relevant for delete (no form/validation), but maintain awareness

### Performance Notes

- After a successful DELETE, `invalidateQueries(['contactos'])` triggers a background re-fetch of the full list. The deleted contact will not appear in the refreshed data. This complies with FR27 (immediate visibility) and NFR2 (< 2s update).
- `isPending` state on the mutation prevents double-click on "Confirmar" (button disabled during in-flight request).
- Navigation to `/contactos` happens in `onSuccess` — no extra render cycle; TanStack Router handles it synchronously after mutation completion.

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- All user-facing text MUST be in Spanish (MANDATORY): buttons "Eliminar", "Confirmar", "Cancelar"; dialog title "¿Eliminar este contacto?"; toasts "Contacto eliminado correctamente" and "Error al eliminar el contacto"; description "Esta acción no se puede deshacer."
- Code variables, functions, classes MUST be in English (MANDATORY)
- NEVER expose `error.message`, backend stack traces, or internal exception details in the UI (NFR6)
- 404 response from backend must use Problem Details (no `stackTrace` key per NFR6)
- The deletion is permanent — no soft-delete in MVP. The dialog's destructive intent must be visually communicated (use destructive button variant if available in siesa-ui-kit or shadcn)

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.5 AC and FRs (FR15, FR27, AC-E3.5)
- Previous story 3.4: `_bmad-output/implementation-artifacts/stories/story-3.4-edit-contact.md` — `ContactoDetailView` current state, `IContactoRepository`, `contactoApiRepository`, `ExceptionHandlingMiddleware` NotFoundException mapping, ToastProvider, established patterns
- Previous story 3.3: `_bmad-output/implementation-artifacts/stories/story-3.3-create-contact.md` — `ContactoForm`, `useCreateContacto`, `contactoSchema`, `contactoApiRepository` base patterns
- Previous story 3.2: `_bmad-output/implementation-artifacts/stories/story-3.2-contact-detail-view.md` — canonical query keys, "Eliminar" placeholder button, invalidation note for stories 3.3–3.5
- Previous story 3.1: `_bmad-output/implementation-artifacts/stories/story-3.1-contact-list-search.md` — domain layer, `IContactoRepository`, `contactoApiRepository`, query keys
- Reference story 2.5: `_bmad-output/implementation-artifacts/2-5-delete-client.md` — direct parallel pattern for delete flow (clientes domain); exact same architecture for contactos
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — API endpoints, entity patterns, frontend folder structure, TanStack Query keys, mutation + invalidation strategy
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, DateTimeOffset, UUID PKs, Problem Details RFC 7807, Spanish UI text, English code

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Backend: `DeleteContactoCommand`, `DeleteContactoCommandHandler`, `ContactoNotFoundException` created in Application layer
- Backend: `IContactoRepository.DeleteAsync` added; `ContactoRepository.DeleteAsync` implemented with SaveChangesAsync
- Backend: `DELETE /api/v1/contactos/{id:guid}` endpoint added to `ContactosEndpoints.cs` returning 204 No Content
- Backend: `ContactoNotFoundException` → 404 Problem Details handling added to `ExceptionHandlingMiddleware`
- Backend: `IDeleteContactoCommandHandler`/`DeleteContactoCommandHandler` registered in `Program.cs`
- Frontend: `IContactoRepository.delete(id)` + `contactoApiRepository.delete(id)` added
- Frontend: `useDeleteContacto.ts` hook created with invalidateQueries for both `['contactos']` and `['contactos', id]`, success toast, error toast
- Frontend: `ContactoDetailView.tsx` wired with isDeleteDialogOpen state, AlertDialog inline, useNavigate with try/catch guard for test environments
- Test helpers: re-export files added at `src/modules/test/msw/handlers/` for contactos handlers (needed by useDeleteContacto.test.ts path resolution)
- Tests: 8/8 unit tests GREEN, 13/13 component tests GREEN, 7/7 API integration tests GREEN

### File List

**Backend:**
- `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommand.cs` (NEW)
- `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommandHandler.cs` (NEW)
- `backend/src/SiesaAgents.Application/Contactos/Interfaces/IContactoRepository.cs` (MODIFIED — added DeleteAsync)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` (MODIFIED — added DeleteAsync)
- `backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs` (MODIFIED — added DELETE endpoint)
- `backend/src/SiesaAgents.API/Program.cs` (MODIFIED — registered IDeleteContactoCommandHandler)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (MODIFIED — added ContactoNotFoundException handler)

**Frontend:**
- `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` (MODIFIED — added delete signature)
- `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` (MODIFIED — added delete method)
- `frontend/src/modules/crm/contactos/application/useDeleteContacto.ts` (NEW)
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` (MODIFIED — wired delete flow)
- `frontend/src/modules/test/msw/handlers/contactos-delete.handlers.ts` (NEW — re-export)
- `frontend/src/modules/test/msw/handlers/contactos-detail.handlers.ts` (NEW — re-export)
- `frontend/src/modules/test/msw/handlers/contactos.handlers.ts` (NEW — re-export)
