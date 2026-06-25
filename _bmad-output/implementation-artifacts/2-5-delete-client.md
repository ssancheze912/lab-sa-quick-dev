# Story 2.5: Delete Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a client record,
So that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears asking "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options.

2. **Given** the user confirms the deletion (clicks "Confirmar"), **When** the backend returns `204 No Content`, **Then** the client is removed from the list immediately (TanStack Query `invalidateQueries(['clientes'])` — FR27), **And** the right panel returns to the empty/default state (no `clienteId` in the URL), **And** a success toast is displayed "Cliente eliminado correctamente".

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the client record remains in the system unchanged and no request is sent to the backend.

4. **Given** the client being deleted has associated contacts, **When** the deletion is confirmed and the backend returns `204 No Content`, **Then** the client record is deleted, **And** all previously associated contacts remain in the system with their data intact (ON DELETE SET NULL in DB — FR23), **And** those contacts become unassigned (`clienteId = null`), **And** the toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (instead of the standard message from AC #2).

5. **Given** the backend is unavailable when the delete is confirmed (network error or 5xx), **When** the mutation fails, **Then** a toast error is displayed with the message "No se pudo eliminar el cliente. Intenta de nuevo.", **And** the dialog closes and the client detail remains visible.

## Tasks / Subtasks

- [x] Task 1 — Backend: Implement `DELETE /api/v1/clientes/{id}` command, handler, and endpoint (AC: #2, #4, #5)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`: `record DeleteClienteCommand(Guid Id)`.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`: accepts `DeleteClienteCommand`, calls `IClienteRepository.GetByIdAsync(id)` → if null returns `false` (endpoint sends 404), then calls `IClienteRepository.DeleteAsync(entity)`, returns `true`. The database `ON DELETE SET NULL` constraint on `contactos.cliente_id` handles contact disassociation automatically — no application-level contact update needed.
  - [x] Update `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: add `Task<bool> DeleteAsync(Guid id)`.
  - [x] Update `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: implement `DeleteAsync` — call `FindAsync(id)`, if null return false, call `_context.Clientes.Remove(entity)` + `SaveChangesAsync()`, return true. EF Core will execute `DELETE FROM clientes WHERE id = @id`; PostgreSQL `ON DELETE SET NULL` on `contactos.cliente_id` triggers automatically.
  - [x] Update `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`: map `DELETE /api/v1/clientes/{id:guid}` → calls `DeleteClienteCommandHandler`, returns `204 No Content` on success, `404 Not Found` Problem Details if client not found.
  - [x] Register `DeleteClienteCommandHandler` in `backend/src/SiesaAgents.API/Program.cs`.

- [x] Task 2 — Backend: Write unit and integration tests for `DeleteCliente` (AC: #2, #4, #5)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs`:
    - Test: handler returns `true` when client exists and deletion succeeds.
    - Test: handler returns `false` when client ID does not exist.
    - Test: validator (if added) rejects empty `Id`.
  - [x] Extend `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - Test `DELETE /api/v1/clientes/{id}` returns `204 No Content` on valid existing client.
    - Test `DELETE /api/v1/clientes/{id}` returns `404 Not Found` (Problem Details) when client ID does not exist.
    - Test `GET /api/v1/clientes/{id}` after successful delete returns `404`.
    - Test `GET /api/v1/clientes` after successful delete no longer contains the deleted client.
  - [x] Update fake repository implementations in all existing unit test files to implement the new `DeleteAsync` method:
    - `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
    - `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
    - `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

- [x] Task 3 — Frontend: Extend domain and infrastructure layers for delete (AC: #2, #5)
  - [x] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: add `delete(id: string): Promise<void>`.
  - [x] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: add `delete` method:
    ```typescript
    delete: async (id: string) => {
      await apiClient.delete(`/api/v1/clientes/${id}`);
    },
    ```

- [x] Task 4 — Frontend: Implement `useDeleteCliente` mutation hook (AC: #2, #5)
  - [x] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`:
    ```typescript
    import { useMutation, useQueryClient } from '@tanstack/react-query';
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

    export function useDeleteCliente() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => clienteApiRepository.delete(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
        },
      });
    }
    ```
  - Note: Toast notifications and navigation after deletion are handled in the presentation layer. The hook stays generic.

- [x] Task 5 — Frontend: Add confirmation dialog and "Eliminar" button to `ClienteDetailPanel` (AC: #1, #2, #3, #4, #5)
  - [ ] Install shadcn AlertDialog component via MCP if not already present: check `frontend/src/components/ui/alert-dialog.tsx`. If missing, install via `npx shadcn@latest add alert-dialog`.
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`:
    - Import `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogTrigger` from `@/components/ui/alert-dialog`.
    - Import `useDeleteCliente` hook.
    - Import `useNavigate` from `@tanstack/react-router` to redirect after deletion.
    - Add local `useState<boolean>` `isDeleting` (default `false`) — used to show loading state on Confirmar button.
    - Render an "Eliminar" button in the detail panel header (alongside the existing "Editar" button) when a client is loaded. Style: destructive variant (red, `text-red-600 border-red-600 hover:bg-red-50`).
    - Wrap "Eliminar" button as `AlertDialogTrigger` inside an `AlertDialog`:
      - `AlertDialogTitle`: "¿Eliminar este cliente?"
      - `AlertDialogDescription`: "Esta acción no se puede deshacer. El cliente será eliminado permanentemente."
      - `AlertDialogCancel`: "Cancelar" — closes dialog, no request sent (AC #3).
      - `AlertDialogAction`: "Confirmar" — calls `deleteCliente.mutate(clienteId)`.
    - On mutation `onSuccess` callback in the component (or use the hook's `onSuccess` + component reaction):
      - Check if the deleted client had associated contacts (requires backend to return that info OR check the response — see note below).
      - Navigate to `/clientes` (clear `clienteId` from URL) using `useNavigate`.
      - Show appropriate toast (see Note on toast differentiation below).
    - On mutation `onError`: show toast error "No se pudo eliminar el cliente. Intenta de nuevo." (AC #5).
    - The "Eliminar" button must NOT render while in skeleton/loading state or error/404 state.
    - The "Eliminar" button must NOT render while `isEditing` is `true` (edit form is open).

  **Note — Toast differentiation (AC #4 vs AC #2):**
  The backend `DELETE /api/v1/clientes/{id}` returns `204 No Content`. To differentiate whether the deleted client had contacts, the frontend must query the contacts count **before** triggering deletion. Strategy:
  - Before calling `deleteCliente.mutate(id)`, check the TanStack Query cache for `['contactos', { clienteId: id }]`. If the cached result has items (length > 0), use the "Sus contactos asociados quedaron sin cliente asignado." toast. Otherwise use the standard toast.
  - If cache is not populated, default to the standard toast "Cliente eliminado correctamente" (safe fallback).
  - Alternatively, the backend can return a custom `204` header `X-Associated-Contacts-Count` to signal this — but since the architecture specifies `204 No Content`, the cache-based approach is preferred.

- [x] Task 6 — Frontend: Write unit and component tests (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`:
    - Mock `clienteApiRepository.delete` with MSW.
    - Test: mutation calls `DELETE /api/v1/clientes/{id}` with correct id.
    - Test: on success, `invalidateQueries(['clientes'])` is called.
    - Test: on 404, mutation `isError` is true.
    - Test: on 5xx, mutation `isError` is true.
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`:
    - Test: "Eliminar" button renders when client data is loaded.
    - Test: "Eliminar" button is NOT present during skeleton loading state.
    - Test: "Eliminar" button is NOT present while `isEditing` is true.
    - Test: clicking "Eliminar" opens the AlertDialog with text "¿Eliminar este cliente?".
    - Test: clicking "Cancelar" in the dialog closes it without making an API call.
    - Test: clicking "Confirmar" calls `DELETE /api/v1/clientes/{id}` via the mutation.
    - Test: after successful delete, navigate to `/clientes` is called.
    - Test: after successful delete, toast "Cliente eliminado correctamente" is shown (no contacts case).
    - Test: on 5xx error, toast error "No se pudo eliminar el cliente. Intenta de nuevo." is shown.
    - Note: axe accessibility check skipped — `@axe-core/react` not installed in project.

## Dev Notes

### Architecture Alignment

This story covers the **write path (delete)** for the `clientes` module (FR6 — AC-E2.5, FR23, FR27). It adds:
- New backend command: `DELETE /api/v1/clientes/{id}` (CQRS Command + Handler)
- New frontend mutation hook: `useDeleteCliente` (TanStack Query `useMutation`)
- Confirmation dialog in `ClienteDetailPanel.tsx` (shadcn AlertDialog)
- Extension of `IClienteRepository` (domain + infrastructure) with `DeleteAsync` / `delete`

Clean Architecture layers for frontend (`src/modules/crm/clientes/`):
- **Domain**: `IClienteRepository.ts` (add `delete`)
- **Application**: `useDeleteCliente.ts` (new mutation hook)
- **Infrastructure**: `clienteApiRepository.ts` (add `delete` method)
- **Presentation**: `ClienteDetailPanel.tsx` (add "Eliminar" button + AlertDialog + navigation logic)

Backend layers:
- **Domain**: `IClienteRepository.cs` (add `DeleteAsync`)
- **Application**: `DeleteClienteCommand.cs`, `DeleteClienteCommandHandler.cs`
- **Infrastructure**: `ClienteRepository.cs` (implement `DeleteAsync`)
- **API**: `ClienteEndpoints.cs` (add `DELETE /api/v1/clientes/{id:guid}`)
- **Program.cs**: register `DeleteClienteCommandHandler`

### MasterCrud Note

This story does NOT use MasterCrud. The delete flow is a **confirmation dialog embedded in the split-panel layout** (`ClienteDetailPanel.tsx`). MasterCrud applies to standard table-based CRUD orchestration screens; this feature uses an inline/right-panel pattern consistent with Stories 2.2–2.4.

### Database — ON DELETE SET NULL (Critical)

The `contactos.cliente_id` FK is defined as `ON DELETE SET NULL` in the PostgreSQL migration (Story 1.3 / architecture):
```sql
-- contactos: cliente_id (uuid nullable FK → clientes.id ON DELETE SET NULL)
```
This means when a `ClienteEntity` is deleted via EF Core, PostgreSQL automatically sets `cliente_id = NULL` on all associated contacts. **No application-level logic needed** to disassociate contacts — the DB cascade handles it. The `DeleteClienteCommandHandler` only needs to delete the client entity.

### State Management

- **Mutation state**: TanStack Query `useMutation` in `useDeleteCliente` — `isPending`, `isError`, `error` exposed to `ClienteDetailPanel`.
- **List cache invalidation**: on `onSuccess`, `invalidateQueries({ queryKey: ['clientes'] })` → the deleted client disappears from the left panel list immediately (FR27). No need to invalidate `['clientes', id]` since the detail panel navigates away.
- **URL state**: after successful deletion, navigate to `/clientes` (remove `clienteId` param) — right panel returns to empty/default state.
- **Edit state**: if `isEditing` is true, the "Eliminar" button must not be rendered. Delete and Edit are mutually exclusive at the UI level.

### API Contract

```
DELETE /api/v1/clientes/{id}

Response 204 No Content — success (client deleted, contacts disassociated by DB cascade)

Response 404 Not Found — Problem Details RFC 7807
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente con id 550e8400-e29b-41d4-a716-446655440000 no encontrado."
}

Response 500 — Problem Details RFC 7807 (via ExceptionHandlingMiddleware)
```

### UI Implementation Requirements (MANDATORY)

- **Confirmation dialog**: use shadcn `AlertDialog` (from `@/components/ui/alert-dialog`). Install via `npx shadcn@latest add alert-dialog` if not present. Do NOT build a custom modal.
- **siesa-ui-kit first**: check siesa-ui-kit catalog before creating any custom UI components. Confirmed from Stories 2.1–2.4: `EmptyState` and `ErrorPanel` are NOT in siesa-ui-kit — use existing custom components at `frontend/src/shared/components/`. Toast IS available from siesa-ui-kit.
- **Toast**: use the existing toast integration (`siesa-ui-kit` toast with `ToastProvider` in `main.tsx`). Show `toast.success(...)` / `toast.error(...)` directly. Two possible success messages (see AC #2 and AC #4).
- **"Eliminar" button style**: destructive — use Tailwind classes `text-red-600 border border-red-600 hover:bg-red-50 rounded px-3 py-1.5 text-sm font-medium` OR shadcn `Button` with `variant="destructive"`. Do NOT use Siesa Blue for this button.
- **"Editar" button style**: primary → `#0e79fd` (Siesa Blue) — unchanged from Story 2.4.
- **Loading state**: disable "Confirmar" button and change label to "Eliminando…" while mutation `isPending` — NOT a spinner.
- **Brand colors**: Siesa Blue `#0e79fd` for primary actions; destructive red for delete. Tailwind `slate-*` for neutrals.
- **Typography**: Inter font classes — `font-light` (300), `font-normal` (400), `font-bold` (700).
- All user-facing text MUST be in Spanish: dialog title, description, button labels, toast messages, ARIA labels.
- Code (variables, functions, types) in English.
- WCAG 2.1 AA: `AlertDialog` from shadcn/Radix is accessible by default (focus trap, keyboard navigation, ARIA roles). Ensure "Eliminar" button has descriptive `aria-label="Eliminar cliente"`. Dialog cancel button: `aria-label="Cancelar eliminación"`. Dialog confirm button: `aria-label="Confirmar eliminación"`.

### Backend Enforcement Rules (Mandatory)

- `ClienteEntity.Id`: `Guid` (UUID) — `DeleteAsync` parameter is `Guid id`.
- `DELETE /api/v1/clientes/{id}` returns `204 No Content` — NOT `200 OK`.
- `404 Not Found` when the provided `id` does not match any `ClienteEntity` — return `Results.Problem(statusCode: 404)` or `Results.NotFound()`.
- No FluentValidation validator needed for delete — only route param `id:guid` constraint enforces the type.
- `ExceptionHandlingMiddleware` is already wired globally — no changes needed.
- API documentation: Scalar at `/scalar` — do NOT add Swagger.
- No new migration needed — `ON DELETE SET NULL` is already in place from Story 1.3.

### Previous Story Learnings

1. `siesa-ui-kit` has `toast` and `ToastProvider` — already wired in `main.tsx` from Story 2.3. Use `toast.success(...)` / `toast.error(...)` directly.
2. `@/` path alias is configured in `vite.config.ts` and `tsconfig.json` — use it for all imports.
3. `ExceptionHandlingMiddleware` is already wired in `Program.cs` from Story 1.3 — do NOT re-register.
4. `AppDbContext.Clientes` DbSet already exists — no new migration needed.
5. `IClienteRepository` returns `ClienteEntity` (not `ClienteDto`) from domain layer.
6. Integration tests use per-test `InMemoryClienteFactory` instances with unique DB names — follow the same pattern for DELETE tests. Note: InMemory EF does NOT enforce FK cascade (ON DELETE SET NULL) — that is a PostgreSQL-level feature. Integration tests for cascade effect require either PostgreSQL TestContainers or a manual stub.
7. `ExceptionHandlingMiddleware.WriteAsJsonAsync` workaround from Story 2.1: use `JsonSerializer.Serialize` + `WriteAsync` for `Content-Type: application/problem+json`.
8. Fake repository implementations in unit test files (now four: `GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `CreateClienteCommandHandlerTests.cs`, `UpdateClienteCommandHandlerTests.cs`) must all be updated to implement the new `DeleteAsync` method.
9. `ClienteDetailPanel.tsx` was extended in Story 2.4 with "Editar" button and `isEditing` toggle — adapt the same component to also include the "Eliminar" button and AlertDialog. Do NOT duplicate the component.
10. `useUpdateCliente` hook pattern: hook stays generic (no toast), toast handled in presentation layer. Follow same pattern for `useDeleteCliente`.
11. `ClienteEntity.Update()` method was added in Story 2.4 to the domain entity. No equivalent needed for delete — EF Core `Remove()` + `SaveChangesAsync()` is sufficient.
12. Axe accessibility check not included in tests — `@axe-core/react` is not installed. WCAG 2.1 AA compliance is enforced structurally.
13. Navigation after deletion: use `useNavigate` from `@tanstack/react-router`. Target route: `/clientes` (strips `clienteId` param from URL).

### Git History Context

Recent commits confirm Stories 2.1–2.4 are complete:
- `ClienteEntity`, `ClienteDto`, `IClienteRepository` (with `GetAllAsync`, `GetByIdAsync`, `CreateAsync`, `UpdateAsync`), `ClienteRepository`, `ClienteEndpoints` with GET + POST + PUT endpoints, `useClientes`, `useCliente`, `useCreateCliente`, `useUpdateCliente`, `ClienteListPanel`, `ClienteDetailPanel`, `ClienteForm` — all in place.
- `ToastProvider` wired in `main.tsx` from Story 2.3.
- Test infrastructure (MSW, Vitest, RTL, xUnit, integration tests) is operational.
- `@/` alias, `apiClient.ts`, `AppDbContext` with `ApplySnakeCaseNaming()` are configured.
- `ExceptionHandlingMiddleware` with 409 branch for `23505` is wired and operational.
- shadcn components partially installed — check if `alert-dialog` is already present.

### Project Structure Notes

Files to create or modify in this story:

**Backend — new:**
```
backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs
backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs
```

**Backend — modify:**
```
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs              ← add DeleteAsync
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs               ← implement DeleteAsync
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                              ← add DELETE /api/v1/clientes/{id:guid}
backend/src/SiesaAgents.API/Program.cs                                                 ← register DeleteClienteCommandHandler
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs     ← add DeleteAsync to fake
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs  ← add DeleteAsync to fake
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs ← add DeleteAsync to fake
backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs ← add DeleteAsync to fake
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs                    ← extend with DELETE tests
```

**Frontend — new:**
```
frontend/src/modules/crm/clientes/application/useDeleteCliente.ts
frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts
```

**Frontend — modify:**
```
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts                        ← add delete method
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts              ← add delete method
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx                  ← add "Eliminar" button + AlertDialog + navigation
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx             ← add delete flow tests
```

**shadcn — install if missing:**
```
frontend/src/components/ui/alert-dialog.tsx   ← npx shadcn@latest add alert-dialog
```

### References

- FR6 (Eliminar cliente — AC-E2.5) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria (QA Validation)`]
- FR23 (Contactos huérfanos permanecen — ON DELETE SET NULL) [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- FR27 (Cambios inmediatos para todos los usuarios → `invalidateQueries`) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- `DELETE /api/v1/clientes/{id}` → `204 No Content` [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- `contactos.cliente_id ON DELETE SET NULL` [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Problem Details RFC 7807 for error responses [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- TanStack Query mandatory invalidation pattern `['clientes']` [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- shadcn AlertDialog for confirmation dialog [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Company standards: DateTimeOffset, UUID PKs, snake_case DB, Scalar, Problem Details [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]
- MasterCrud reference (not applicable for inline panel) [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- siesa-ui-kit mandatory (no EmptyState/ErrorPanel in kit; toast available) [Source: Story 2.3 Completion Notes]
- `ExceptionHandlingMiddleware` already wired globally [Source: `_bmad-output/implementation-artifacts/2-4-edit-client.md#Backend Enforcement Rules`]
- `useDeleteCliente` hook path from architecture tree [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- `ClienteDetailPanel.tsx` extended in Story 2.4 with "Editar" + isEditing [Source: `_bmad-output/implementation-artifacts/2-4-edit-client.md#Project Structure Notes`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A — no unexpected issues. `ON DELETE SET NULL` in DB handled at PostgreSQL level, no application cascade needed. InMemory EF does not simulate FK cascades (noted in tests). `useNavigate` mocked via `vi.mock('@tanstack/react-router', ...)` for component tests. `@radix-ui/react-alert-dialog` installed directly (no existing shadcn setup). `src/components/ui/alert-dialog.tsx` created manually following shadcn pattern without `cn` utility.

### Completion Notes List

1. Backend `DELETE /api/v1/clientes/{id}` endpoint returns `204 No Content` on success, `404 Not Found` Problem Details when client not found — fully aligned with architecture.
2. `ON DELETE SET NULL` on `contactos.cliente_id` is a DB-level cascade — `DeleteClienteCommandHandler` only deletes the `ClienteEntity`, no contact update logic needed.
3. AlertDialog installed via `@radix-ui/react-alert-dialog` directly since no shadcn components.json config existed. Component created at `src/components/ui/alert-dialog.tsx`.
4. Toast differentiation for AC#4 (associated contacts case) uses cache-based approach per story notes; defaulting to standard "Cliente eliminado correctamente" when cache is empty — safe fallback as documented.
5. `useNavigate` from `@tanstack/react-router` used directly in `ClienteDetailPanel.tsx` for post-deletion navigation to `/clientes`.
6. All 4 existing unit test fake repositories updated with `DeleteAsync` — no compilation errors.

### File List

**Backend — new:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs`

**Backend — modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

**Frontend — new:**
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`
- `frontend/src/components/ui/alert-dialog.tsx`

**Frontend — modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`
