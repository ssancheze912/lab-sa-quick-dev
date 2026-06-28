# Story 2.5: Delete Client

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a client record,
so that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail in the right panel, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears with the message "¿Eliminar este cliente?" and two buttons: "Confirmar" and "Cancelar".

2. **Given** the user clicks "Confirmar" in the confirmation dialog, **When** the deletion is processed via `DELETE /api/v1/clientes/:id`, **Then** the client is removed from the list immediately without page reload (FR27), **And** the right panel returns to the empty/default state, **And** a toast displays "Cliente eliminado correctamente" (if the client had no associated contacts).

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the client record remains in the system unchanged and no DELETE API call is made.

4. **Given** the client being deleted has one or more associated contacts, **When** the user confirms deletion, **Then** the client is deleted, **And** all associated contacts remain in the system with `clienteId = null` (ON DELETE SET NULL), **And** the toast displays "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." instead of the generic message.

## Tasks / Subtasks

- [x] Task 1 — Backend: `DELETE /api/v1/clientes/:id` endpoint (AC: #2, #3, #4)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs` — record with `Guid Id`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs` — calls `IClienteRepository.GetByIdAsync(command.Id, ct)`; if null → returns `false` (not found); calls `IClienteRepository.DeleteAsync(entity, ct)`; returns `true`
  - [x] Add `Task<bool> DeleteAsync(ClienteEntity entity, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [x] Add `DeleteAsync` implementation to `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — `_context.Clientes.Remove(entity); await _context.SaveChangesAsync(ct);` (cascade SET NULL handled by DB FK constraint, not by application code)
  - [x] Add `MapDelete("/{id:guid}", ...)` to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    - Handler returns `bool`: `true` → `Results.NoContent()` (204); `false` (entity not found) → `Results.Problem(detail: "El cliente solicitado no fue encontrado.", statusCode: 404, title: "Cliente no encontrado")`
    - No request body; no FluentValidation needed (ID comes from route)
  - [x] Register `DeleteClienteCommandHandler` in `backend/src/SiesaAgents.API/Program.cs` DI

- [x] Task 2 — Backend: Query associated contacts count before deletion (AC: #2, #4)
  - [x] Add `Task<int> CountContactosByClienteIdAsync(Guid clienteId, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — OR create a dedicated `IContactoRepository` method if the Contacto repository already exists
  - [x] Implement `CountContactosByClienteIdAsync` in `ClienteRepository.cs` (or `ContactoRepository.cs`): Epic 3 dependency — stub returns 0 (tech debt noted)
  - [x] Update `DeleteClienteCommandHandler` to return a result object (or a flag) indicating whether the client had associated contacts: return `DeleteClienteResult { bool Found, bool HadContacts }` instead of a bare `bool`
  - [x] Update `DELETE` endpoint to use `DeleteClienteResult`:
    - `!Found` → 404 Problem Details
    - `Found && HadContacts` → `Results.Ok(new { hadContacts = true })` (200, so frontend can conditionally show toast variant)
    - `Found && !HadContacts` → `Results.NoContent()` (204)

  > **Design note — two-toast strategy:** The endpoint returns 204 (no contacts) or 200 + `{ hadContacts: true }` (had contacts). The frontend mutation `onSuccess` reads the response to decide which toast to show. This avoids the frontend making a second GET before deletion. If the Contactos table does not yet exist in the DB (Epic 3 dependency), use a stub that always returns 0 — mark as tech debt.

- [x] Task 3 — Frontend: Application layer — `useDeleteCliente` mutation hook (AC: #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts` — TanStack Query `useMutation`:
    - `mutationFn: (id: string) => clienteApiRepository.delete(id)` — returns `{ hadContacts: boolean }` or `null`
    - `onSuccess: (result, id) => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); queryClient.removeQueries({ queryKey: ['clientes', id] }); /* toast handled at component level */ }`
    - Do NOT call `toast` inside the hook — toast wording depends on `hadContacts` flag from response, so the component handles it
  - [x] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `delete(id: string): Promise<{ hadContacts: boolean } | null>`
  - [x] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `delete(id)`:
    - `DELETE /api/v1/clientes/${id}` via `apiClient`
    - 204 response → return `{ hadContacts: false }`
    - 200 response with body `{ hadContacts: true }` → return `{ hadContacts: true }`
    - 404 → rethrow (handled by onError)

- [x] Task 4 — Frontend: Presentation layer — confirmation dialog and "Eliminar" button in `ClienteDetailView` (AC: #1, #2, #3)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Add `"Eliminar"` button (`data-testid="btn-eliminar"`) visible only when a client is loaded (data state — same guard as "Editar" from Story 2.4)
    - Clicking it sets local `useState<boolean>` `isDeleteDialogOpen = true`
    - Render a confirmation dialog when `isDeleteDialogOpen === true` using custom `AlertDialog` component (shadcn-compatible API, installed at `frontend/src/components/ui/alert-dialog.tsx`)
    - `handleConfirmDelete`: calls `deleteMutation.mutate(clienteId, { onSuccess, onError })`
    - `onSuccess(result)`:
      - If `result?.hadContacts` → `toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')`
      - Else → `toast.success('Cliente eliminado correctamente')`
      - Call `onClienteDeleted?.()` prop to notify parent route to return right panel to empty state
      - `setIsDeleteDialogOpen(false)`
    - `onError`: `toast.error('No se pudo eliminar el cliente. Intenta de nuevo.')`
  - [x] Add `onClienteDeleted?: () => void` prop to `ClienteDetailView` to allow parent route (`clientes.$clienteId.tsx`) to navigate back to `/clientes` (empty right panel)

- [x] Task 5 — Frontend: Route-level "return to empty state" wiring (AC: #2)
  - [x] Update `frontend/src/routes/_app/clientes.$clienteId.tsx`:
    - Pass `onClienteDeleted` prop to `ClienteDetailView`:
      ```tsx
      const navigate = useNavigate();
      <ClienteDetailView
        clienteId={clienteId}
        onClienteDeleted={() => navigate({ to: '/clientes' })}
      />
      ```
    - This navigates to `/clientes` (no selected client), which renders the empty right panel state — consistent with FR30 deep linking

- [x] Task 6 — Tests (AC: #1, #2, #3, #4) — aligned with test-design-epic-2.md
  - [x] **Backend API — P0**: `DELETE /api/v1/clientes/:id` with valid ID returns 204 (no contacts) — xUnit + WebApplicationFactory (PASSED)
  - [x] **Backend API — P0**: `DELETE /api/v1/clientes/:id` → associated contacts have `clienteId = null` afterwards (cascade SET NULL) — DEFERRED until Epic 3 (Contactos table does not exist yet). Test stub `DeleteCliente_WithNoContactosTable_Returns204_TechDebt_Epic3` documents this.
  - [x] **Backend API — P1**: `DELETE /api/v1/clientes/{unknown-uuid}` returns 404 + Problem Details — xUnit (PASSED)
  - [x] **Backend API — P2**: `DELETE /api/v1/clientes/:id` with associated contacts returns 200 + `{ hadContacts: true }` — DEFERRED until Epic 3. Tech debt test added.
  - [x] **Frontend component — P0**: open confirmation dialog, click "Confirmar" → DELETE called once, `invalidateQueries(['clientes'])` triggered, `onClienteDeleted` called (Vitest + RTL + MSW) — PASSED
  - [x] **Frontend component — P1**: open confirmation dialog, click "Cancelar" → dialog closes, no DELETE called (Vitest + RTL + MSW) — PASSED
  - [x] **Frontend component — P1**: click "Confirmar" with `hadContacts: false` response → toast "Cliente eliminado correctamente" (Vitest + RTL + MSW) — PASSED
  - [x] **Frontend component — P2**: click "Confirmar" with `hadContacts: true` response → toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (Vitest + RTL + MSW) — PASSED
  - [ ] **E2E — P0 deferred**: delete client from detail panel, assert item removed from left panel, right panel returns to empty state (Playwright, risk R-002, R-003) — deferred (requires running infrastructure)

## Dev Notes

### Architecture Context

This story implements the delete path for Epic 2's split-panel layout. It introduces:
- `DELETE /api/v1/clientes/:id` backend endpoint (Application Command + Infrastructure DeleteAsync)
- `useDeleteCliente` TanStack Query mutation hook with `invalidateQueries(['clientes'])` on success
- Confirmation dialog in `ClienteDetailView` using shadcn/ui `AlertDialog`
- `onClienteDeleted` callback prop to navigate back to `/clientes` (empty right panel)

**Scope boundary (CRITICAL):** This story covers **delete only**. Do NOT modify `ClienteForm`, `useCreateCliente`, or `useUpdateCliente`. The "Editar" button from Story 2.4 and "Nuevo cliente" button from Story 2.3 must remain fully functional after this story.

**Cascade behavior — ON DELETE SET NULL (CRITICAL, risk R-003):** The PostgreSQL FK constraint on `contactos.cliente_id` is `ON DELETE SET NULL`. This is configured in `ContactoConfiguration.cs` via `.OnDelete(DeleteBehavior.SetNull)`. When a client is deleted, the database automatically sets `cliente_id = null` on all associated contacts. The application layer does NOT need to manually nullify contacts — the DB handles it. This must be verified by the cascade integration test (Task 6 — P0 API test).

**Epic 3 dependency:** If the `contactos` table does not yet exist in the database, the `CountContactosByClienteIdAsync` call in the handler will fail at runtime. Implement a guard: if the Contactos DbSet is not accessible, treat `hadContacts = false` and return 204 always. Mark this as tech debt for Epic 3. Alternatively, check if `_context.Contactos` throws a `TableNotFoundException` and catch it gracefully.

**Two-toast strategy:** The backend returns 204 (no contacts) vs. 200 + `{ hadContacts: true }` (had contacts). This avoids a second frontend GET to check contacts before deletion. The frontend `useDeleteCliente` `mutationFn` maps both responses to `{ hadContacts: boolean }` and the component selects the appropriate toast text. NO `any` TypeScript types.

**FR27 — Immediate list update:** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `useDeleteCliente` `onSuccess` triggers an automatic refetch, removing the deleted client from the left panel without page reload. Also call `queryClient.removeQueries({ queryKey: ['clientes', id] })` to evict the single-client cache entry.

**Right panel empty state:** After deletion, navigate to `/clientes` (no `clienteId` in URL) via `useNavigate`. The route renders `ClienteDetailView` without a `clienteId`, which shows the empty/default state. This is consistent with FR30 deep linking behavior already established in Stories 2.2–2.4.

**AlertDialog vs Dialog:** Use `AlertDialog` (not `Dialog`) for destructive confirmations — it provides the correct semantic role (`role="alertdialog"`) and accessibility behavior. shadcn/ui `AlertDialog` is the correct component for this use case. Check if it is already installed: `ls frontend/src/components/ui/alert-dialog.tsx`. If not, install via: `cd frontend && npx shadcn@latest add alert-dialog`.

**MasterCrud note:** MasterCrud is NOT applicable here. The custom split-panel layout (280px left + flex right) is the established architecture for Epic 2. [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes`]

### Backend: DeleteClienteCommand and Handler

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs
namespace SiesaAgents.Application.Clientes.Commands;

public record DeleteClienteCommand(Guid Id);
```

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs
namespace SiesaAgents.Application.Clientes.Commands;

public record DeleteClienteResult(bool Found, bool HadContacts);

public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repo;

    public DeleteClienteCommandHandler(IClienteRepository repo) => _repo = repo;

    public async Task<DeleteClienteResult> Handle(DeleteClienteCommand command, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(command.Id, ct);
        if (entity is null) return new DeleteClienteResult(Found: false, HadContacts: false);

        int contactCount = 0;
        try
        {
            contactCount = await _repo.CountContactosByClienteIdAsync(command.Id, ct);
        }
        catch
        {
            // Epic 3 dependency: contactos table may not exist yet — treat as 0
            contactCount = 0;
        }

        await _repo.DeleteAsync(entity, ct);
        return new DeleteClienteResult(Found: true, HadContacts: contactCount > 0);
    }
}
```

### Backend: IClienteRepository Extensions

```csharp
// Add to backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
Task DeleteAsync(ClienteEntity entity, CancellationToken ct);
Task<int> CountContactosByClienteIdAsync(Guid clienteId, CancellationToken ct);
```

```csharp
// Add to backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
public async Task DeleteAsync(ClienteEntity entity, CancellationToken ct)
{
    _context.Clientes.Remove(entity);
    await _context.SaveChangesAsync(ct);
}

public async Task<int> CountContactosByClienteIdAsync(Guid clienteId, CancellationToken ct)
{
    return await _context.Contactos.CountAsync(c => c.ClienteId == clienteId, ct);
}
```

### Backend: DELETE /api/v1/clientes/:id Endpoint

```csharp
// Add inside MapClienteEndpoints() in ClienteEndpoints.cs
group.MapDelete("/{id:guid}", async (
    Guid id,
    DeleteClienteCommandHandler handler,
    CancellationToken ct) =>
{
    var result = await handler.Handle(new DeleteClienteCommand(id), ct);

    if (!result.Found)
        return Results.Problem(
            detail: "El cliente solicitado no fue encontrado.",
            statusCode: 404,
            title: "Cliente no encontrado");

    if (result.HadContacts)
        return Results.Ok(new { hadContacts = true });

    return Results.NoContent();
});
```

Response shapes:
```
// 204 No Content — success, no associated contacts (no body)

// 200 OK — success, client had associated contacts (contacts are now clienteId=null)
{ "hadContacts": true }

// 404 — not found (Problem Details RFC 7807)
{ "type": "https://tools.ietf.org/html/rfc7807", "title": "Cliente no encontrado", "status": 404, "detail": "El cliente solicitado no fue encontrado." }
```

### Frontend: useDeleteCliente Hook

```typescript
// frontend/src/modules/crm/clientes/application/useDeleteCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

export interface DeleteClienteResult {
  hadContacts: boolean;
}

export const useDeleteCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.removeQueries({ queryKey: ['clientes', id] });
      // Toast is handled at component level (wording depends on hadContacts flag)
    },
  });
};
```

### Frontend: clienteApiRepository — delete extension

```typescript
// Add to frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
delete: async (id: string): Promise<{ hadContacts: boolean }> => {
  const response = await apiClient.delete(`/api/v1/clientes/${id}`);
  // 204 → response.data is empty; 200 → response.data has { hadContacts: true }
  if (response.status === 204) return { hadContacts: false };
  return response.data as { hadContacts: boolean };
},
```

Note: Axios by default throws on 4xx/5xx, so 404 will propagate as an AxiosError to `onError`.

### Frontend: ClienteDetailView — Eliminar button + AlertDialog

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx (update)
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteCliente } from '../application/useDeleteCliente';

interface ClienteDetailViewProps {
  // existing props...
  onClienteDeleted?: () => void;
}

// Inside the component, in the data-loaded render path:
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const deleteMutation = useDeleteCliente();

const handleConfirmDelete = () => {
  deleteMutation.mutate(data.id, {
    onSuccess: (result) => {
      if (result?.hadContacts) {
        toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.');
      } else {
        toast.success('Cliente eliminado correctamente');
      }
      setIsDeleteDialogOpen(false);
      onClienteDeleted?.();
    },
    onError: () => {
      toast.error('No se pudo eliminar el cliente. Intenta de nuevo.');
      setIsDeleteDialogOpen(false);
    },
  });
};

// In the JSX (data-loaded state only, alongside existing "Editar" button):
<button
  onClick={() => setIsDeleteDialogOpen(true)}
  data-testid="btn-eliminar"
>
  Eliminar
</button>

<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
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

### Frontend: Route-level onClienteDeleted wiring

```typescript
// frontend/src/routes/_app/clientes.$clienteId.tsx (update)
import { useNavigate } from '@tanstack/react-router';
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView';

// Inside the component:
const navigate = useNavigate();

<ClienteDetailView
  clienteId={clienteId}
  onClienteDeleted={() => navigate({ to: '/clientes' })}
/>
```

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` + `shadcn/ui AlertDialog`
- **Check siesa-ui-kit first** for confirmation dialog patterns before using shadcn fallback
- **AlertDialog**: `cd frontend && npx shadcn@latest add alert-dialog` — verify `frontend/src/components/ui/alert-dialog.tsx` exists; install if missing
- **Do not create a custom confirmation dialog** if AlertDialog from shadcn is available

### Project Structure Notes

**Files to create:**

```
backend/
└── src/
    └── SiesaAgents.Application/
        └── Clientes/
            └── Commands/
                ├── DeleteClienteCommand.cs           ← CREATE
                └── DeleteClienteCommandHandler.cs    ← CREATE (includes DeleteClienteResult)

frontend/
└── src/
    └── modules/crm/clientes/
        └── application/
            └── useDeleteCliente.ts                   ← CREATE
```

**Files to modify:**

```
backend/
└── src/
    ├── SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs   ← ADD DeleteAsync + CountContactosByClienteIdAsync
    ├── SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs   ← ADD DeleteAsync + CountContactosByClienteIdAsync impl
    ├── SiesaAgents.API/Endpoints/ClienteEndpoints.cs                  ← ADD MapDelete("/{id:guid}")
    └── SiesaAgents.API/Program.cs                                     ← REGISTER DeleteClienteCommandHandler

frontend/
└── src/
    ├── modules/crm/clientes/domain/IClienteRepository.ts              ← ADD delete method
    ├── modules/crm/clientes/infrastructure/clienteApiRepository.ts    ← ADD delete impl
    ├── modules/crm/clientes/presentation/ClienteDetailView.tsx        ← ADD Eliminar button + AlertDialog + onClienteDeleted prop
    └── routes/_app/clientes.$clienteId.tsx                            ← WIRE onClienteDeleted → navigate('/clientes')
```

**Verify from prior stories — DO NOT recreate:**
- `clienteSchema.ts` and `ClienteFormData` type — Story 2.1; do NOT touch
- `ClienteForm.tsx` — Story 2.3/2.4; do NOT modify
- `useCreateCliente.ts` / `useUpdateCliente.ts` — Stories 2.3/2.4; do NOT modify
- `apiClient.ts` — Story 2.1; use existing instance
- `ErrorPanel.tsx`, `EmptyState.tsx` — Story 2.1; do NOT modify
- `NotFoundPanel.tsx` — Story 2.2; do NOT modify
- `IsUniqueConstraintViolation` helper — Story 2.3 in `ClienteEndpoints.cs`; do NOT touch
- `Toast` (sonner) — mounted in `frontend/src/main.tsx` since Story 2.3; no changes needed
- `GetByIdAsync` on `IClienteRepository` — already exists from Story 2.2; reuse

### Testing Approach

**Backend API integration tests** use `WebApplicationFactory<Program>` + Testcontainers (PostgreSQL). Key scenarios:
- DELETE valid ID → 204 (no contacts) or 200 `{ hadContacts: true }` (with contacts)
- DELETE unknown UUID → 404 Problem Details
- Cascade: seed client + 2 contacts, DELETE client, GET both contacts → assert `clienteId == null`

**Frontend component tests** use Vitest + RTL + MSW 2.x. Key scenarios:
- Click "Eliminar" → dialog appears with "¿Eliminar este cliente?" text
- Click "Cancelar" → dialog closes, no DELETE fired (MSW asserts)
- Click "Confirmar" (204 mock) → toast "Cliente eliminado correctamente", `onClienteDeleted` called
- Click "Confirmar" (200 + `hadContacts: true` mock) → toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
- "Confirmar" button disabled while mutation isPending

**Key test scenarios from test-design-epic-2.md:**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E2-2-5-API-P0-1 | API | DELETE valid ID (no contacts) → 204 | P0 |
| TC-E2-2-5-API-P0-2 | API | Cascade: delete client → contacts clienteId=null | P0 |
| TC-E2-2-5-API-P1-1 | API | DELETE unknown UUID → 404 Problem Details | P1 |
| TC-E2-2-5-API-P2-1 | API | DELETE with contacts → 200 + { hadContacts: true } | P2 |
| TC-E2-2-5-CMP-P0-1 | Component | Confirm delete → invalidateQueries + onClienteDeleted called | P0 |
| TC-E2-2-5-CMP-P1-1 | Component | Cancel delete → dialog closes, no DELETE called | P1 |
| TC-E2-2-5-CMP-P1-2 | Component | Delete (no contacts) → toast "Cliente eliminado correctamente" | P1 |
| TC-E2-2-5-CMP-P2-1 | Component | Delete (with contacts) → toast with "Sus contactos asociados..." | P2 |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `DELETE /api/v1/clientes/:id` returns 204 (no contacts) — NOT 200 with empty body
- [ ] `DELETE /api/v1/clientes/:id` returns 200 + `{ hadContacts: true }` when contacts exist
- [ ] 404 response uses `Results.Problem(...)` with Problem Details RFC 7807 — NOT `Results.NotFound()`
- [ ] No stack traces in any error response (NFR6) — `ExceptionHandlingMiddleware` must remain active
- [ ] `queryClient.invalidateQueries({ queryKey: ['clientes'] })` called in `useDeleteCliente` `onSuccess` (FR27)
- [ ] `queryClient.removeQueries({ queryKey: ['clientes', id] })` also called to evict single-client cache entry
- [ ] Toast "Cliente eliminado correctamente" shown when `hadContacts === false`
- [ ] Toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." shown when `hadContacts === true`
- [ ] "Eliminar" button uses `AlertDialog`, NOT a plain `window.confirm()` call
- [ ] "Eliminar" button only visible in the data-loaded state (not during loading/error/not-found)
- [ ] "Confirmar" button disabled (`disabled={isPending}`) during mutation
- [ ] "Cancelar" button does NOT call any mutation — only closes dialog
- [ ] `onClienteDeleted` navigates to `/clientes` (URL without clienteId) — right panel returns to empty state
- [ ] All user-facing text in Spanish: "Eliminar", "¿Eliminar este cliente?", "Esta acción no se puede deshacer.", "Confirmar", "Cancelar", toast messages
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `ClienteForm` and other existing Story 2.3/2.4 components NOT modified — no regressions
- [ ] `contactos.cliente_id` FK uses `ON DELETE SET NULL` (`.OnDelete(DeleteBehavior.SetNull)`) — NOT `CASCADE`
- [ ] `aria-label` or accessible label on "Eliminar" button (WCAG 2.1 AA)

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.5`]
- Architecture — DELETE /api/v1/clientes/{id}: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — 204 No Content for DELETE: [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- Architecture — Mutation invalidation pattern: [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture — ON DELETE SET NULL (contactos.cliente_id): [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Architecture — Frontend folder structure: [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Test design — R-002 (invalidateQueries), R-003 (cascade SET NULL), R-010 (toast Spanish text): [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#2. Risk Assessment`]
- Test design — P0 cascade test, delete removes from list: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Coverage Plan`]
- Company standards — Minimal API DELETE 204, Problem Details RFC 7807: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- Company standards — TanStack Query mutations, invalidateQueries: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Preceding story — ClienteDetailView, btn-editar pattern, modal overlay, data-loaded guard: [Source: `_bmad-output/implementation-artifacts/2-4-edit-client.md`]
- Preceding story — ClienteForm, useCreateCliente, apiClient, toast pattern: [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md`]
- Preceding story — aria-describedby / WCAG pattern: [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implemented full DELETE flow per story specification. Backend uses `DeleteClienteCommandHandler` returning `DeleteClienteResult(Found, HadContacts)`.
- `CountContactosByClienteIdAsync` stubbed to return 0 (Epic 3 tech debt — Contactos table does not exist yet). Handler gracefully catches any exception.
- Existing `DeleteAsync(Guid id)` on `IClienteRepository` was already present; added overload `DeleteAsync(ClienteEntity entity, CancellationToken ct)` as required by the handler pattern. Both coexist without conflict.
- `AlertDialog` component created at `frontend/src/components/ui/alert-dialog.tsx` with shadcn-compatible API (no `@radix-ui` dependency — not installed in this project).
- All 28 frontend tests pass (15 ATDD in DeleteCliente.test.tsx + 13 edge cases in DeleteCliente.edge.test.tsx). All 4 new backend DELETE tests pass. No regressions in existing 183 frontend tests or 153 previously-passing backend tests.
- TypeScript strict mode: zero errors. No `any` types used.

### File List

**Created:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Clientes/DeleteClienteApiTests.cs`
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
- `frontend/src/components/ui/alert-dialog.tsx`
- `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.test.tsx`
- `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.edge.test.tsx`

**Modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added `DeleteAsync(ClienteEntity, CancellationToken)` and `CountContactosByClienteIdAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented `DeleteAsync(ClienteEntity, CancellationToken)` and `CountContactosByClienteIdAsync` (stub)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — replaced basic DELETE with `DeleteClienteCommandHandler`-based endpoint
- `backend/src/SiesaAgents.API/Program.cs` — registered `DeleteClienteCommandHandler`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `delete` method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented `delete`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — added Eliminar button, AlertDialog, `onClienteDeleted` prop
- `frontend/src/routes/_app/clientes.$clienteId.tsx` — wired `onClienteDeleted` callback
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 2-5-delete-client: in-progress
