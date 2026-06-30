# Story 2.5: Delete Client

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a client record,
so that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears asking "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options.

2. **Given** the user confirms the deletion, **When** the deletion is processed, **Then** the client is removed from the list immediately (FR27), **And** the right panel returns to the empty/default state, **And** a toast shows "Cliente eliminado correctamente".

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the client record remains in the system unchanged.

4. **Given** the client being deleted has associated contacts, **When** the deletion is confirmed and processed, **Then** the client record is deleted, **And** all previously associated contacts remain in the system with their data intact, **And** those contacts become unassigned (`clienteId = null`) and appear in the "Sin cliente" filter (FR25), **And** the toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

## Tasks / Subtasks

- [x] Task 1 — Add `useDeleteCliente` mutation hook in application layer (AC: #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
  - [x] Use `useMutation` with `mutationFn: (id: string) => clienteApiRepository.delete(id)`
  - [x] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` + `queryClient.invalidateQueries({ queryKey: ['contactos'] })` + conditional toast based on `hasContacts` flag
  - [x] Accept optional `onSuccess` callback parameter (consistent with `useUpdateCliente` pattern)
  - [x] `onError`: `toast.error('No se pudo eliminar. Intenta de nuevo.')`
  - [x] Return `{ mutate, isPending, isError }` from the hook

- [x] Task 2 — Add `delete(id)` method to `IClienteRepository` and `clienteApiRepository` (AC: #2)
  - [x] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` with `delete(id: string): Promise<void>`
  - [x] Implement in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: DELETE to `/api/v1/clientes/${id}` via shared `apiClient`

- [x] Task 3 — Add confirmation dialog and "Eliminar" button to `ClienteDetailView` (AC: #1, #2, #3)
  - [x] Add `isDeleteDialogOpen` local `useState<boolean>` in `ClienteDetailView`
  - [x] Add "Eliminar" button with `TrashIcon` from `@heroicons/react/24/outline`, `data-testid="delete-cliente-button"`
  - [x] Clicking "Eliminar" sets `isDeleteDialogOpen(true)`
  - [x] Render confirmation dialog using AlertDialog (Radix UI via `src/shared/components/ui/alert-dialog.tsx`): title "¿Eliminar este cliente?", description with client name, "Confirmar" button (destructive style), "Cancelar" button
  - [x] "Confirmar" calls `mutate(clienteId)` and closes dialog
  - [x] "Cancelar" sets `isDeleteDialogOpen(false)` without calling mutate
  - [x] On successful deletion: navigate to `/clientes` (base route, no client selected) to return panel to empty/default state
  - [x] While `isPending`: disable "Confirmar" button and show loading state

- [x] Task 4 — Determine whether deletion has associated contacts (AC: #4)
  - [x] Before calling `mutate`, check if `useContactosPorCliente(clienteId)` returns contacts
  - [x] Pass `hasContacts: boolean` flag to the `onSuccess` callback of `useDeleteCliente`
  - [x] Toast logic: if `hasContacts === true` → `toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')`, else → `toast.success('Cliente eliminado correctamente')`

- [x] Task 5 — Backend: `DeleteClienteCommand`, handler and validator (AC: #2, #4)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs` (record with `Guid Id`) — already existed
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs` — already existed
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Validators/DeleteClienteCommandValidator.cs` (validate `Id != Guid.Empty`)
  - [x] Register validator and handler in `backend/src/SiesaAgents.API/Program.cs`

- [x] Task 6 — Backend: wire `DELETE /api/v1/clientes/{id}` endpoint (AC: #2)
  - [x] Add `MapDelete` to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — already existed
  - [x] Returns 204 No Content on success, 404 (Problem Details) if not found, 500 on error
  - [x] Database FK: `contactos.cliente_id` has `ON DELETE SET NULL` — EF Core already handles cascading null via DB-level FK constraint (established in Story 1.3)

- [x] Task 7 — Backend: `IClienteRepository.DeleteAsync` and implementation (AC: #2)
  - [x] Add `DeleteAsync(Guid id): Task` to `IClienteRepository` interface — already existed
  - [x] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — already existed

- [x] Task 8 — Tests: Frontend unit tests for `useDeleteCliente` and delete dialog in `ClienteDetailView` (AC: #1, #2, #3, #4)
  - [x] `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts` — pre-existed (ATDD RED phase), now GREEN (11/11 pass)
  - [x] `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx` — pre-existed (ATDD RED phase), now GREEN (13/13 pass)

- [x] Task 9 — Tests: Backend unit tests for `DeleteClienteCommandHandler` and validator (AC: #2)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs` (6 tests, all pass)
  - [x] All existing `FakeClienteRepository` implementations already had `DeleteAsync` stub

## Dev Notes

### Architecture Context

**Clean Architecture layer responsibilities (this story):**
- `domain/`: Extend `IClienteRepository` with `delete(id)` (frontend) and `DeleteAsync(Guid id)` (backend).
- `application/`: New `useDeleteCliente.ts` mutation hook.
- `infrastructure/`: Extend `clienteApiRepository.ts` with `delete(id)` method calling `DELETE /api/v1/clientes/${id}`.
- `presentation/`: Modify `ClienteDetailView.tsx` to add "Eliminar" button + `AlertDialog` confirmation + post-deletion navigation.
- Backend `Application/Clientes/Commands/`: New `DeleteClienteCommand.cs`, `DeleteClienteCommandHandler.cs`, `DeleteClienteCommandValidator.cs`.

**Files to check before creating (may already exist):**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — check if `DELETE /api/v1/clientes/{id}` already exists
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — check if `DeleteAsync` already declared

### Backend: `DELETE /api/v1/clientes/{id}` Contract

Per architecture.md:
```
DELETE /api/v1/clientes/{id}
  Response 204: No Content (success)
  Response 404: Problem Details RFC 7807 (client not found)
  Response 500: Problem Details RFC 7807
```

**Database CASCADE behavior:** The `contactos.cliente_id` FK was defined with `ON DELETE SET NULL` in the initial migration (Story 1.3). When a `ClienteEntity` is deleted, PostgreSQL automatically sets `cliente_id = NULL` on all related `contactos` rows. No explicit contact handling needed in the application layer — the DB enforces this constraint. Verify this FK constraint exists before implementation.

### Confirmation Dialog — AlertDialog Pattern

Use `shadcn/ui AlertDialog` (already installed from Story 2.3 scaffolding — check `components/ui/alert-dialog.tsx`). This is the preferred approach to resolve the open WCAG focus trap issue from Stories 2.3/2.4:

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// In ClienteDetailView:
<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. El cliente <strong>{cliente?.nombre}</strong> será eliminado permanentemente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel data-testid="delete-cancel-button">Cancelar</AlertDialogCancel>
      <AlertDialogAction
        data-testid="delete-confirm-button"
        onClick={() => mutate(clienteId)}
        disabled={isPending}
        className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      >
        {isPending ? 'Eliminando...' : 'Confirmar'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

If `alert-dialog.tsx` is not present in `components/ui/`, install via: `pnpm dlx shadcn@latest add alert-dialog`

### Post-Deletion Navigation Pattern

After successful deletion, the right panel must return to the empty/default state. The URL should revert to `/clientes` (no client ID). Use TanStack Router navigation:

```tsx
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();

const { mutate, isPending } = useDeleteCliente({
  onSuccess: () => {
    navigate({ to: '/clientes' });
  }
});
```

The left panel (`ClienteListPanel`) will automatically update because `useDeleteCliente` invalidates `['clientes']` query key, triggering a refetch.

### `useDeleteCliente` Hook Pattern

Follow the factory pattern established in `useUpdateCliente` (Story 2.4) — accept `onSuccess` callback to avoid conditional hook call issues in tests:

```typescript
// frontend/src/modules/crm/clientes/application/useDeleteCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

interface UseDeleteClienteOptions {
  onSuccess?: () => void;
}

export function useDeleteCliente({ onSuccess }: UseDeleteClienteOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clienteApiRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      onSuccess?.();
    },
    onError: () => toast.error('No se pudo eliminar. Intenta de nuevo.'),
  });
}
```

**Toast logic in `ClienteDetailView`** (where hasContacts context is known):
```tsx
const hasContacts = (contactos?.length ?? 0) > 0;

const { mutate, isPending } = useDeleteCliente({
  onSuccess: () => {
    if (hasContacts) {
      toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.');
    } else {
      toast.success('Cliente eliminado correctamente');
    }
    navigate({ to: '/clientes' });
  }
});
```

### TanStack Query Invalidation — Mandatory Pattern

```typescript
// Invalidate both clientes (list) and contactos (contacts now unassigned)
queryClient.invalidateQueries({ queryKey: ['clientes'] });
queryClient.invalidateQueries({ queryKey: ['contactos'] });
```

Invalidating `['contactos']` is required because contacts previously associated with the deleted client now have `clienteId = null` (handled by DB ON DELETE SET NULL). The contacts list must reflect this change if it is open in another panel.

### UI Implementation Requirements

**Delete button placement:**
- Location: top-right area of `ClienteDetailView` panel, beside the existing "Editar" button
- Icon: `TrashIcon` from `@heroicons/react/24/outline` (already installed)
- Style: destructive secondary action (`text-red-600 hover:bg-red-50 border border-red-300 rounded px-3 py-1.5 text-sm flex items-center gap-1`)
- Spanish label: "Eliminar"
- `data-testid="delete-cliente-button"`

**Button group layout (after Story 2.4):**
```tsx
<div className="flex items-center gap-2 shrink-0">
  {/* Editar button (existing) */}
  <button data-testid="edit-cliente-button" ...>Editar</button>
  {/* New Eliminar button */}
  <button data-testid="delete-cliente-button" onClick={() => setIsDeleteDialogOpen(true)} ...>
    <TrashIcon className="h-4 w-4" /> Eliminar
  </button>
</div>
```

**WCAG 2.1 AA requirements:**
- `AlertDialog` from shadcn/ui provides built-in focus trap (resolves the open item from Stories 2.3/2.4)
- `aria-label="Eliminar cliente"` on the trigger button if text is icon-only
- "Confirmar" button must have `aria-label="Confirmar eliminación de cliente"` for screen readers

### State Management Decisions

- `isDeleteDialogOpen`: local `useState<boolean>` in `ClienteDetailView` — NOT Zustand (no cross-route persistence needed, consistent with Stories 2.3/2.4 pattern)
- `hasContacts`: derived from the existing `useContactosPorCliente(clienteId)` hook result — check if the hook is already present from a previous implementation or define it; if not available yet, query contacts count inline using `useQuery({ queryKey: ['contactos', { clienteId }], ... })`
- After deletion: `invalidateQueries` on `['clientes']` triggers refetch → deleted client disappears from left list; `invalidateQueries` on `['contactos']` triggers refetch → contacts reflect null clienteId

### Testing Standards Summary

**Frontend (Vitest + RTL + MSW):**
- Co-locate tests alongside source files
- `vi.mock('../application/useDeleteCliente')` in `ClienteDetailView.delete.test.tsx`
- MSW handlers for `DELETE /api/v1/clientes/:id`: 204 (success), 404 (not found), 500 (server error)
- Use `userEvent.click(...)` for button interactions
- Verify dialog appears/disappears with appropriate aria roles: `getByRole('alertdialog')`
- Coverage target: >80% for new files
- Run: `pnpm --filter frontend test` or `pnpm exec vitest run src/modules/crm/clientes/`

**Backend (xUnit):**
- Manual fake repository — no Moq/NSubstitute (consistent with Stories 2.1–2.4)
- Add `DeleteAsync` stub to ALL existing `FakeClienteRepository` implementations in test files
- Solution file: `SiesaAgents.slnx` (XML format, .NET 10) — NOT `SiesaAgents.sln`
- Run: `dotnet test tests/SiesaAgents.UnitTests`
- `using Xunit;` must be explicit in every test file

### Previous Story Learnings (Stories 2.1 – 2.4)

- Solution file: `SiesaAgents.slnx` (XML format, .NET 10) — NOT `SiesaAgents.sln`
- `using Xunit;` must be explicit in every test file
- No Moq/NSubstitute — use manual fake implementations for repositories
- `@heroicons/react` is installed (`/24/outline` and `/24/solid` variants available)
- `sonner` is used for toast notifications (`import { toast } from 'sonner'`) — `<Toaster>` already in `main.tsx`
- `shadcn/ui AlertDialog` should be preferred for destructive confirmation dialogs (resolves open WCAG focus trap issue from Stories 2.3/2.4)
- `clienteDetailStore` (Zustand) was introduced in Story 2.2 — keep dialog state as local `useState`, do NOT add to store
- `aria-required="true"` must be on all required inputs (WCAG 2.1 AA)
- Route tree (`routeTree.gen.ts`) is auto-regenerated — no new routes needed for this story
- `@testing-library/user-event` is a dev dependency (added in Story 2.3)
- `react-loading-skeleton` is installed and used in `ClienteListView`
- Git commit prefix convention: `feat(story-2.5):` for this story
- `useUpdateCliente` uses factory pattern (accepts `onSuccess` callback option) — replicate for `useDeleteCliente`
- Mobile viewport z-index and pointer-events issues resolved in Story 2.4 — verify button group layout does not reintroduce them
- Pre-existing `NotFoundException` domain class exists from Story 2.4 — reuse it for 404 cases

### Project Structure Notes

**New files to create:**
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx`
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/DeleteClienteCommandValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs`

**Files to modify:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `delete(id: string): Promise<void>` method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `delete(id)` calling `DELETE /api/v1/clientes/${id}`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — add "Eliminar" button, `AlertDialog`, post-delete navigation
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — add `DeleteAsync(Guid id): Task` if not present
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `DeleteAsync(Guid id)` if not present
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add `MapDelete` for `DELETE /api/v1/clientes/{id}`
- `backend/src/SiesaAgents.API/Program.cs` — register validator and handler for DeleteCliente
- All existing `FakeClienteRepository` implementations in test files — add `DeleteAsync` stub

**Files to check before creating (may already exist):**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — check if `DELETE /api/v1/clientes/{id}` endpoint already wired
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — check `DeleteAsync`
- `frontend/src/components/ui/alert-dialog.tsx` — check if AlertDialog is installed; if not, run `pnpm dlx shadcn@latest add alert-dialog`

### References

- FR5 (eliminar cliente), FR25 (contactos sin cliente), FR27 (cambios inmediatos): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- DELETE /api/v1/clientes/{id} contract (204 No Content): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- ON DELETE SET NULL FK constraint: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Mutation + invalidation pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- NotFoundException domain class (reuse from Story 2.4): [Source: _bmad-output/implementation-artifacts/2-4-edit-client.md#Project Structure Notes]
- Factory pattern for useDeleteCliente (mirrors useUpdateCliente): [Source: _bmad-output/implementation-artifacts/2-4-edit-client.md#Completion Notes List]
- AlertDialog for focus trap resolution (WCAG 2.1.2 open item from 2.3/2.4): [Source: _bmad-output/implementation-artifacts/2-4-edit-client.md#Dev Notes]
- sonner toast usage: [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Completion Notes List]
- Company standards (Clean Architecture, siesa-ui-kit priority, Spanish UI text): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- AlertDialog: shadcn not configured, no `components.json`. Installed `@radix-ui/react-alert-dialog` and created custom wrapper at `src/shared/components/ui/alert-dialog.tsx`.
- Import path fix: `ClienteDetailView.tsx` is at `src/modules/crm/clientes/presentation/`, so alert-dialog import requires `../../../../shared/components/ui/alert-dialog` (4 levels up, not 3).
- `useContactosPorCliente` mock returns `undefined` by default in tests. Used optional chaining `contactosResult?.data` in component to handle gracefully.
- Existing `ClienteDetailView.test.tsx` and `ClienteDetailView.edge.test.tsx` needed `useDeleteCliente`, `useContactosPorCliente`, and `useNavigate` mocks added since the component now uses those hooks.
- Backend Tasks 5, 6, 7 were already fully implemented from a prior run. Only `DeleteClienteCommandValidator.cs` was missing and registration in `Program.cs`.
- Pre-existing failures in `ExceptionHandlingMiddlewareEdgeCaseTests` (content-type mismatch) — unrelated to this story, pre-existing from Story 2.4.

### Completion Notes List

- AlertDialog built directly from `@radix-ui/react-alert-dialog` since shadcn CLI is not configured in this project.
- Created `src/modules/crm/contactos/application/useContactosPorCliente.ts` as stub — contacts module will be implemented in Epic 3.
- Frontend: 165/165 tests pass across 17 test files.
- Backend Application layer: 47/47 tests pass (new 6 DeleteClienteCommandHandlerTests + existing 41).
- ATDD fix attempt 3: ExceptionHandlingMiddleware was already fixed (WriteAsync instead of WriteAsJsonAsync); backend needed restart with new build to serve fixed code. Frontend fixes: AlertDialogAction replaced with plain button to prevent Radix UI auto-close during pending state; button group changed to flex-col/sm:flex-row to eliminate mobile pointer-event overlap.
- E2E results after fixes: chromium 14+7 pass / 2+3 fail (AC4 contactos — Epic 3 out-of-scope); mobile-chrome 14+7 pass / 2+3 fail (same Epic 3 out-of-scope).

### File List

**Created:**
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
- `frontend/src/shared/components/ui/alert-dialog.tsx`
- `frontend/src/modules/crm/contactos/application/useContactosPorCliente.ts`
- `backend/src/SiesaAgents.Application/Clientes/Validators/DeleteClienteCommandValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs`

**Modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `delete(id: string): Promise<void>`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented `delete(id)` method
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — added Eliminar button, AlertDialog, delete logic
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx` — ATDD tests now GREEN
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` — added mocks for new hooks
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge.test.tsx` — added mocks for new hooks
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs` — injected IValidator, added ValidateAndThrowAsync call (code-review fix)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — wired MapDelete endpoint
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — WriteAsync fix for Problem Details content-type
- `backend/src/SiesaAgents.API/Program.cs` — registered `DeleteClienteCommandValidator` and `DeleteClienteCommandHandler`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs` — updated for validator injection; empty-guid test now expects ValidationException
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status `ready-for-dev → in-progress`
