# Story 2.5: Delete Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a client record,
so that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears asking "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options. (AC-E2.5, FR7)

2. **Given** the user confirms the deletion, **When** the deletion is processed, **Then** the client is removed from the list immediately (FR27) **And** the right panel returns to the empty/default state **And** a toast shows "Cliente eliminado correctamente". (AC-E2.5, FR7, FR27, NFR2)

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the client record remains in the system unchanged and no DELETE request is triggered.

4. **Given** the client being deleted has associated contacts, **When** the deletion is confirmed and processed, **Then** the client record is deleted **And** all previously associated contacts remain in the system with their data intact **And** those contacts become unassigned (`clienteId = null`) and appear in the "Sin cliente" filter (FR25) **And** the toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (R-E2-02)

5. **Given** the user confirms deletion and `onSuccess` fires, **When** the mutation completes, **Then** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is called, removing the deleted client from the list without requiring a page reload. (FR27, R-E2-05)

6. **Given** a DELETE request is made for a non-existent client ID, **When** the backend processes the request, **Then** a 404 Not Found with Problem Details RFC 7807 is returned (no stack trace exposed). (NFR6, R-E2-06)

## Tasks / Subtasks

- [ ] Task 1 — Create `useDeleteCliente` application hook (AC: #2, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
    - Uses `useMutation` from TanStack Query
    - `mutationFn: (id: string) => clienteApiRepository.delete(id)` — calls `DELETE /api/v1/clientes/{id}`
    - `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` to refresh list cache
    - `onSuccess`: determines toast message — if deletion response or prior client state indicates associated contacts existed, shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."; otherwise shows "Cliente eliminado correctamente"
    - `onError`: shows generic "Error al eliminar el cliente" (never expose raw error details)
    - Exposes `mutate`, `isPending`, `isError` from the hook

- [ ] Task 2 — Extend infrastructure layer: add `delete` to API repository (AC: #2)
  - [ ] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `delete(id: string): Promise<void>` method signature
  - [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `delete`: calls `DELETE /api/v1/clientes/${id}` via `apiClient`; returns `void`; throws on non-2xx (let `useMutation` `onError` handle it)

- [ ] Task 3 — Build confirmation dialog and wire "Eliminar" button in `ClienteDetailView` (AC: #1, #2, #3)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
    - Add "Eliminar" button (Heroicon `TrashIcon` + label) in the detail panel actions area
    - Manage `isDeleteDialogOpen: boolean` state with `useState`
    - When user clicks "Eliminar": set `isDeleteDialogOpen = true`
    - Render a confirmation dialog (check siesa-ui-kit first, then shadcn `AlertDialog`) with:
      - Title/message: "¿Eliminar este cliente?"
      - "Confirmar" button: calls `useDeleteCliente.mutate(currentCliente.id)`, disabled when `isPending`
      - "Cancelar" button: sets `isDeleteDialogOpen = false` without triggering any mutation
    - On mutation `onSuccess`: set `isDeleteDialogOpen = false`, clear selected client state (right panel returns to empty/default), navigate to `/clientes` if currently on `/clientes/:id`
    - "Cancelar" must NEVER call mutate — guard is mandatory per AC #3

- [ ] Task 4 — Handle orphan-contact toast differentiation (AC: #4)
  - [ ] Determine strategy for orphan detection: since the DELETE endpoint returns 204 (no body), the frontend must check whether the client had contacts BEFORE confirming deletion
    - Option A (recommended): before showing the dialog, check if `clienteDetail.contactCount > 0` (if count is available in the client DTO or via a cached query for `['contactos', { clienteId }]`)
    - Option B: always show the generic toast and let the orphan-contact toast be shown only when Epic 4 wires the contact association to the detail view
    - Use Option A if contact data is already cached; otherwise default to generic "Cliente eliminado correctamente" toast until Epic 4 provides the contact count
  - [ ] Pass `hasAssociatedContacts: boolean` as context to `useDeleteCliente` hook or resolve it inside `onSuccess` by checking the TanStack Query cache for `['contactos', { clienteId: id }]`

- [ ] Task 5 — Backend: DELETE /api/v1/clientes/{id} endpoint (AC: #2, #4, #6)
  - [ ] Create `DeleteClienteCommand.cs` + `DeleteClienteCommandHandler.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/`
    - Command record: `DeleteClienteCommand(Guid Id)`
    - Handler: loads `ClienteEntity` by ID via `IClienteRepository.GetByIdAsync(id)`; if not found, throws domain-level `NotFoundException` → 404; calls `IClienteRepository.DeleteAsync(cliente, ct)`; does NOT return a body (void handler)
    - The EF Core `ON DELETE SET NULL` cascade on `contactos.cliente_id` automatically nullifies FK — no explicit contact update needed in the handler
  - [ ] Update `IClienteRepository` interface in `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — add `DeleteAsync(ClienteEntity entity, CancellationToken ct): Task`
  - [ ] Update `ClienteRepository` implementation in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `DeleteAsync`: calls `_context.Clientes.Remove(entity)` and `await _context.SaveChangesAsync(ct)`
  - [ ] Create or verify endpoint `DELETE /api/v1/clientes/{id}` in `backend/src/SiesaAgents.API/Endpoints/ClientesEndpoints.cs`
    - Accepts `{id}` route param (Guid)
    - Returns `204 No Content` on success (no body)
    - Returns `404 Not Found` + Problem Details when client does not exist
    - Uses Scalar docs (NEVER Swagger)
  - [ ] Verify that `contactos` table has `ON DELETE SET NULL` configured on the `cliente_id` FK (EF Core `OnDelete(DeleteBehavior.SetNull)` in the `ContactoEntityConfiguration`)

- [ ] Task 6 — Write tests (AC: #1–#6)
  - [ ] **Unit test** `useDeleteCliente.test.ts`:
    - TC-E2-P2-06: spy on `queryClient.invalidateQueries`; execute mutation `onSuccess` callback; assert `invalidateQueries({ queryKey: ['clientes'] })` called
    - Assert `isPending` is `true` during mutation execution; `false` after completion
  - [ ] **Component test** `ClienteDetailView.delete.test.tsx`:
    - TC-E2-P0-06: Render detail view for known client; click "Eliminar"; assert dialog with "¿Eliminar este cliente?", "Confirmar", "Cancelar"; click "Confirmar"; assert DELETE called with correct ID; assert toast "Cliente eliminado correctamente" shown; assert client removed from list (cache invalidated); assert right panel returns to empty/default state
    - TC-E2-P1-10: Open dialog, click "Cancelar"; assert dialog closed; assert DELETE NOT called (MSW receives 0 requests); assert client still visible in list
    - TC-E2-P1-11: Render with client that has associated contacts; click "Eliminar" → "Confirmar"; assert toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." is shown
  - [ ] **API Integration test** `DeleteClienteEndpointTests.cs` (xUnit + WebApplicationFactory):
    - TC-E2-P0-08: Seed 1 client + 2 contacts with `clienteId` FK; DELETE `/api/v1/clientes/{clienteId}`; assert 204 No Content; GET `/api/v1/contactos/{contactId1}` → `clienteId` is `null`; GET `/api/v1/contactos/{contactId2}` → `clienteId` is `null`; GET `/api/v1/clientes/{clienteId}` → 404
    - TC-E2-P2-10: DELETE `/api/v1/clientes/00000000-0000-0000-0000-000000000000`; assert 404 Problem Details with `status: 404`; assert no `stackTrace` key

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. Layers: Domain → Application → Infrastructure → Presentation. No direct API calls in UI components.
- **CQRS**: Delete operation is a Command (`DeleteClienteCommand`) not a Query. Handler lives in `Application/Clientes/Commands/`.
- **Mutation hook**: `useDeleteCliente` uses TanStack Query `useMutation`. The `onSuccess` callback MUST call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` to comply with FR27 and NFR2 (< 2s update). Only the list query key needs invalidation — the single-client query `['clientes', id]` becomes irrelevant after deletion.
- **Cascade delete behavior**: The PostgreSQL schema defines `ON DELETE SET NULL` on `contactos.cliente_id` FK. When the client row is deleted, the DB automatically sets `clienteId = null` on all associated contacts. No explicit UPDATE to contacts is required in the application layer. Verify `OnDelete(DeleteBehavior.SetNull)` in EF Core's `ContactoEntityConfiguration`.
- **Right panel reset**: after successful deletion, `ClienteDetailView` must clear the currently-selected client and return the right panel to the empty/default state. If the user was on `/clientes/:id`, navigate back to `/clientes` using TanStack Router's `useNavigate`.
- **Primary keys**: `Id = Guid` — UUID mandatory per company standards. Route param `{id}` must be parsed as `Guid`, not string.
- **Problem Details RFC 7807**: All backend error responses (`404`) must use Problem Details format. No stack traces exposed to frontend (NFR6). `ExceptionHandlingMiddleware` from Epic 1 handles this. Ensure `NotFoundException` → 404 mapping is in place (established in Story 2.4).
- **Toast notifications**: Reuse the same toast mechanism established in Stories 2.3/2.4 (likely `react-hot-toast`). Two possible messages: "Cliente eliminado correctamente" (no contacts) or "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (contacts orphaned).
- **Confirmation dialog UX**: the dialog must be blocking — user cannot interact with other page elements until they Confirm or Cancel. Use siesa-ui-kit dialog component if available; otherwise use shadcn `AlertDialog` (already installed from Epic 1).

### siesa-ui-kit Usage (MANDATORY)

This story adds a delete confirmation dialog and a delete button. Check siesa-ui-kit catalog BEFORE creating any custom component:
- Check siesa-ui-kit for a **confirmation dialog / alert dialog** component first
- Fall back to shadcn `AlertDialog` (already installed in the project) if siesa-ui-kit has no equivalent
- Reuse **button** component (destructive/danger variant for "Confirmar", secondary for "Cancelar") established in prior stories
- Reuse **toast / notification** component from Stories 2.3/2.4 for success/orphan messages
- Install: `npm install siesa-ui-kit` (must already be present from Story 1.1)
- **Heroicon**: `TrashIcon` for the "Eliminar" button in the detail panel (consistent with existing Heroicons usage)

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/clientes/
  domain/
    IClienteRepository.ts              ← Update: add delete(id) method signature
  application/
    useDeleteCliente.ts                ← New
  infrastructure/
    clienteApiRepository.ts            ← Update: implement delete(id)
  presentation/
    ClienteDetailView.tsx              ← Update: add "Eliminar" button + delete dialog + post-delete navigation
```

Backend files to create or modify:
```
backend/src/SiesaAgents.Application/Clientes/
  Commands/DeleteClienteCommand.cs        ← New
  Commands/DeleteClienteCommandHandler.cs ← New
  Interfaces/IClienteRepository.cs        ← Update: add DeleteAsync(ClienteEntity, CancellationToken)

backend/src/SiesaAgents.Infrastructure/
  Repositories/ClienteRepository.cs       ← Update: implement DeleteAsync
  Data/Configurations/ContactoEntityConfiguration.cs ← Verify OnDelete(DeleteBehavior.SetNull)

backend/src/SiesaAgents.API/Endpoints/
  ClientesEndpoints.cs                    ← Update: add DELETE /api/v1/clientes/{id} endpoint
```

Test files to create:
```
frontend/src/modules/crm/clientes/
  application/useDeleteCliente.test.ts               ← New
  presentation/ClienteDetailView.delete.test.tsx     ← New

backend/tests/SiesaAgents.IntegrationTests/Clientes/
  DeleteClienteEndpointTests.cs                      ← New
```

### API Contract

```
DELETE /api/v1/clientes/{id}
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
      "detail": "Cliente no encontrado"
    }
    (NO stackTrace, NO innerException, NO exception keys)
```

Side effects of successful DELETE:
- DB cascade: `contactos.cliente_id` set to `NULL` via `ON DELETE SET NULL` FK constraint
- TanStack Query: `['clientes']` query key invalidated — list re-fetches automatically

### TanStack Query Keys (Canonical)

```typescript
['clientes']               // list — invalidate on DELETE onSuccess
['clientes', clienteId]    // single — becomes stale after delete (no explicit invalidation needed)
['contactos', { clienteId }]  // contacts for this client — check before delete to determine orphan toast
```

Mutation `onSuccess` in `useDeleteCliente` MUST call:
```typescript
queryClient.invalidateQueries({ queryKey: ['clientes'] })
// Single-client key ['clientes', id] becomes irrelevant after deletion; no explicit removal needed
// (TanStack Query will return undefined/null on next fetch attempt, which the component handles)
```

### useDeleteCliente Hook Pattern

```typescript
// application/useDeleteCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

interface UseDeleteClienteOptions {
  onSuccess?: () => void
  hasAssociatedContacts?: boolean
}

export function useDeleteCliente(options?: UseDeleteClienteOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      const toastMessage = options?.hasAssociatedContacts
        ? 'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.'
        : 'Cliente eliminado correctamente'
      // Show toast with toastMessage
      options?.onSuccess?.()
    },
    onError: () => {
      // Show generic error: "Error al eliminar el cliente"
    },
  })
}
```

### ClienteDetailView Delete Dialog Pattern

```typescript
// presentation/ClienteDetailView.tsx — updated to add delete flow
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useDeleteCliente } from '../application/useDeleteCliente'
// AlertDialog from shadcn/ui (fallback if siesa-ui-kit has no equivalent)
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

// Inside ClienteDetailView component:
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
const navigate = useNavigate()
const hasAssociatedContacts = /* check cache for ['contactos', { clienteId: cliente.id }] */ false

const deleteMutation = useDeleteCliente({
  hasAssociatedContacts,
  onSuccess: () => {
    setIsDeleteDialogOpen(false)
    navigate({ to: '/clientes' })
  },
})

// Render:
// <button onClick={() => setIsDeleteDialogOpen(true)}>
//   <TrashIcon /> Eliminar
// </button>

// <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//   <AlertDialogContent>
//     <AlertDialogHeader>
//       <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
//       <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
//     </AlertDialogHeader>
//     <AlertDialogFooter>
//       <AlertDialogCancel>Cancelar</AlertDialogCancel>
//       <AlertDialogAction
//         onClick={() => deleteMutation.mutate(cliente.id)}
//         disabled={deleteMutation.isPending}
//       >
//         Confirmar
//       </AlertDialogAction>
//     </AlertDialogFooter>
//   </AlertDialogContent>
// </AlertDialog>
```

### Backend DeleteClienteCommandHandler Pattern

```csharp
// Application/Clientes/Commands/DeleteClienteCommandHandler.cs
public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public DeleteClienteCommandHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task Handle(DeleteClienteCommand command, CancellationToken ct)
    {
        var cliente = await _repository.GetByIdAsync(command.Id, ct);
        if (cliente is null)
            throw new NotFoundException($"Cliente con id {command.Id} no encontrado");

        await _repository.DeleteAsync(cliente, ct);
        // No return value — void command (204 No Content)
        // DB cascade (ON DELETE SET NULL) handles contactos.cliente_id automatically
    }
}
```

### EF Core Cascade Configuration (Critical)

```csharp
// Infrastructure/Data/Configurations/ContactoEntityConfiguration.cs
// Verify this is already set — if not, add it:
builder.HasOne(c => c.Cliente)
       .WithMany(cl => cl.Contactos)
       .HasForeignKey(c => c.ClienteId)
       .OnDelete(DeleteBehavior.SetNull);  // ON DELETE SET NULL — CRITICAL for R-E2-02
```

If `DeleteBehavior.SetNull` is not set, a DELETE on a client with associated contacts will throw a FK violation. This MUST be verified before implementation.

### MSW Handlers Required for Component Tests

```typescript
// __mocks__/handlers.ts — add to existing handlers from Stories 2.1–2.4
import { http, HttpResponse } from 'msw'

http.delete('/api/v1/clientes/:id', ({ params }) => {
  // Success case:
  return new HttpResponse(null, { status: 204 })
  // 404 case (use override handler in specific tests):
  // return HttpResponse.json(
  //   { status: 404, title: 'Not Found', detail: 'Cliente no encontrado' },
  //   { status: 404 }
  // )
})
```

### Testing Test Cases Covered by This Story

From `test-design-epic-2.md`:
- **P0:** TC-E2-P0-06 (confirmation dialog + deletion removes from list, AC-E2.5, R-E2-05), TC-E2-P0-08 (API DELETE 204 + orphan contacts SET NULL, R-E2-02)
- **P1:** TC-E2-P1-10 (cancel preserves client, no DELETE), TC-E2-P1-11 (orphan-contact toast message, R-E2-02)
- **P2:** TC-E2-P2-06 (useDeleteCliente calls invalidateQueries, R-E2-05), TC-E2-P2-10 (DELETE non-existent → 404)

### Previous Story Learnings (from Stories 2.1, 2.2, 2.3, and 2.4)

- `clienteApiRepository.ts` already implements `getAll()`, `getById()`, `create()`, and `update()` — follow the same Axios pattern for `delete()`: `apiClient.delete(\`/api/v1/clientes/${id}\`).then(() => undefined)`
- `apiClient.ts` (Axios singleton) is at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL`
- TanStack Query `queryKey: ['clientes']` — must be invalidated on DELETE `onSuccess`; single-client key `['clientes', id]` becomes stale but no explicit removal needed
- `ExceptionHandlingMiddleware.cs` is implemented and maps `NotFoundException` → 404 (confirmed in Story 2.4) — no changes needed for this story's error handling
- `ClientesEndpoints.cs` already has `GET`, `GET/{id}`, `POST`, `PUT` — add `DELETE` as a new `MapDelete` call in the same file
- `IClienteRepository` already defines `GetByIdAsync` (confirmed in Stories 2.2–2.4) — add `DeleteAsync` following the same pattern
- shadcn `AlertDialog` is installed (confirmed in architecture — `npx shadcn@latest add dialog` from Story 1.1 initialization) — use it as fallback if siesa-ui-kit has no confirmation dialog
- Story 2.4 note: `ClienteDetailView` already manages `isEditFormOpen` state with `useState` — add `isDeleteDialogOpen` using the same pattern

### Performance Notes

- After a successful DELETE, `invalidateQueries(['clientes'])` triggers a background re-fetch of the full list. The deleted client will not appear in the refreshed data. This complies with FR27 (immediate visibility) and NFR2 (< 2s update).
- `isPending` state on the mutation prevents double-click on "Confirmar" (button disabled during in-flight request).
- The DB cascade (`ON DELETE SET NULL`) runs atomically with the DELETE statement — no additional round-trips to the backend are needed.

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- All user-facing text MUST be in Spanish: buttons "Eliminar", "Confirmar", "Cancelar"; dialog title "¿Eliminar este cliente?"; toasts in Spanish; error messages in Spanish
- Code variables, functions, classes MUST be in English
- NEVER expose `error.message`, backend stack traces, or internal exception details in the UI
- 404 response from backend must use Problem Details (no `stackTrace` key per NFR6 and R-E2-06)
- The deletion is permanent — no soft-delete in MVP. The dialog's destructive intent must be visually communicated (use destructive button variant if available in siesa-ui-kit or shadcn)

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.5 AC
- Previous story 2.4: `_bmad-output/implementation-artifacts/2-4-edit-client.md` — `ClienteDetailView`, `useUpdateCliente`, established patterns for dialog state and action buttons
- Previous story 2.3: `_bmad-output/implementation-artifacts/2-3-create-client.md` — `clienteApiRepository`, toast mechanism, `useCreateCliente` pattern
- Previous story 2.2: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md` — canonical query keys, `ClienteDetailView`, `useCliente` hook
- Previous story 2.1: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — `useClientes`, `IClienteRepository`, split panel layout
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — API endpoints (DELETE /api/v1/clientes/{id} → 204), data model (ON DELETE SET NULL cascade), entity patterns, TanStack Query keys
- Test Design Epic 2: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — TC-E2-P0-06, TC-E2-P0-08, TC-E2-P1-10, TC-E2-P1-11, TC-E2-P2-06, TC-E2-P2-10
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, DateTimeOffset, UUID PKs, FluentValidation, Problem Details RFC 7807
- MasterCrud reference: Not applicable for this story. The delete action is a targeted operation on a single client entity within the split-panel detail view, not a data grid CRUD screen.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
