# Story 2.4: Edit Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Editar", **Then** the client form opens pre-filled with the current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad. (AC-E2.3, FR6)

2. **Given** the user modifies one or more fields and submits, **When** the form is saved, **Then** the changes are reflected in the client detail and list immediately (FR27), **And** a toast de éxito muestra "Cliente actualizado correctamente". (AC-E2.3, FR27, NFR2)

3. **Given** the user clears a required field and submits, **When** the form is validated, **Then** an inline error message appears on the cleared field and the form is NOT submitted to the backend. (AC-E2.4, FR8)

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged and no API call is fired. (R-008)

## Tasks / Subtasks

- [ ] Task 1 — Backend: Create `PUT /api/v1/clientes/{id}` endpoint (AC: #1, #2, #3)
  - [ ] Create `UpdateClienteRequest.cs` in `backend/src/SiesaAgents.Application/Clientes/DTOs/` — fields: `Nombre (string)`, `Nit (string)`, `Telefono (string)`, `Ciudad (string)`
  - [ ] Create `UpdateClienteRequestValidator.cs` in `backend/src/SiesaAgents.Application/Clientes/Validators/` using FluentValidation — `.NotEmpty()` on all four fields; `.MaximumLength(200)` on Nombre, `.MaximumLength(50)` on Nit, `.MaximumLength(30)` on Telefono (match DB column `character varying(30)`), `.MaximumLength(100)` on Ciudad
  - [ ] Create `UpdateClienteCommand.cs` + `UpdateClienteCommandHandler.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/` — handler calls `IClienteRepository.GetByIdAsync(id)` to fetch existing entity, calls `entity.Update(nombre, nit, telefono, ciudad)` domain method, then calls `IClienteRepository.UpdateAsync(entity)` and returns updated `ClienteDto`; if entity not found → throw a not-found exception mapped to 404
  - [ ] Add `UpdateAsync(ClienteEntity entity): Task<ClienteEntity>` to `IClienteRepository` interface in `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Implement `UpdateAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` using EF Core — `_context.Clientes.Update(entity); await _context.SaveChangesAsync(); return entity;`
  - [ ] Add `Update(string nombre, string nit, string telefono, string ciudad)` method to `ClienteEntity` in `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — sets each field and sets `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] Register endpoint `PUT /api/v1/clientes/{id}` in `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — validates request via `UpdateClienteRequestValidator`, returns `200 OK` with updated `ClienteDto` on success, `400 Bad Request` with Problem Details on validation failure, `404 Not Found` with Problem Details when client does not exist, `409 Conflict` with `{ title: "El NIT/RUC ya está registrado.", status: 409 }` on duplicate NIT (catch `DbUpdateException` with `uk_clientes_nit` constraint name)
  - [ ] Register `UpdateClienteCommandHandler` and `UpdateClienteRequestValidator` as `Scoped` in `backend/src/SiesaAgents.API/Program.cs` following the same pattern as `CreateClienteCommandHandler`

- [ ] Task 2 — Backend: Tests for `PUT /api/v1/clientes/{id}` (AC: #2, #3)
  - [ ] Unit test `UpdateClienteCommandHandlerTests.cs` in `backend/tests/SiesaAgents.UnitTests/Application/Clientes/` — test cases: valid request → handler fetches entity, updates all fields, calls `UpdateAsync` once, returns updated `ClienteDto`; entity not found → handler propagates not-found; `UpdatedAt` is `DateTimeOffset` and updated
  - [ ] Backend integration test in `backend/tests/SiesaAgents.UnitTests/Integration/ClienteEndpointsTests.cs` — extend existing file with: PUT valid payload → 200 + correct updated shape (all fields reflect new values, `updatedAt` changed); PUT non-existing id → 404 Problem Details; PUT with missing Nombre → 400 Problem Details; PUT duplicate NIT (different client) → 409 with `title` field (no `stackTrace`)
  - [ ] Add `UpdateAsync(ClienteEntity entity): Task<ClienteEntity>` to all `FakeClienteRepository` implementations in existing test files (`GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `CreateClienteCommandHandlerTests.cs`)

- [ ] Task 3 — Frontend: Application layer — `useUpdateCliente` mutation hook (AC: #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts` — TanStack Query mutation hook using `useMutation({ mutationFn: ({ id, data }: { id: string; data: ClienteFormData }) => clienteApiRepository.update(id, data), onSuccess: (updatedCliente) => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); queryClient.setQueryData(['clientes', updatedCliente.id], updatedCliente); toast.success('Cliente actualizado correctamente'); }, onError: (error) => { /* map 409 AxiosError to inline field error via setNitError callback; other errors toast 'No se pudo actualizar el cliente. Intenta de nuevo.' */ } })`; export `{ mutate, isPending }`
  - [ ] Add `update(id: string, data: ClienteFormData): Promise<Cliente>` method to `IClienteRepository` interface in `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [ ] Implement `update` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — Axios PUT to `/api/v1/clientes/${id}`; return `response.data` as `Cliente`
  - [ ] Reuse existing `clienteSchema` from `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — no new schema needed; the same four required fields apply to edit

- [ ] Task 4 — Frontend: Extend `ClienteForm` to support edit mode (AC: #1, #2, #3, #4)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` to accept optional `clienteId?: string` and `defaultValues?: ClienteFormData` props
  - [ ] When `clienteId` is provided (edit mode): form is pre-filled via `useForm({ defaultValues })` resolver, submit calls `useUpdateCliente` mutation; when `clienteId` is absent (create mode): existing `useCreateCliente` behavior is unchanged
  - [ ] Submit button label: "Guardar cambios" in edit mode (was "Guardar cliente" for create); loading label: "Guardando…" in both modes
  - [ ] On 409 error from update mutation: sets NIT field error via `setError('nit', { message: 'El NIT/RUC ya está registrado' })` — same pattern as create
  - [ ] "Cancelar" button: calls `onCancel()` — no API call; original data unchanged (Zustand cache and query cache unmodified)
  - [ ] All WCAG 2.1 AA requirements preserved: `<label>` with `htmlFor`, `aria-describedby` on error spans, touch targets ≥ 44×44px

- [ ] Task 5 — Frontend: Add "Editar" button to `ClienteDetailView` (AC: #1)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — add "Editar" button in the detail header; clicking it sets `isEditing` state (`useState(false)`) to `true`
  - [ ] When `isEditing` is `true`, render `<ClienteForm clienteId={cliente.id} defaultValues={{ nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />` inside a Dialog (shadcn `Dialog`) overlay
  - [ ] Use Heroicons `PencilSquareIcon` for the "Editar" button icon
  - [ ] Dialog title: "Editar cliente"
  - [ ] After successful save: `isEditing` returns to `false`, Dialog closes, and the detail panel reflects updated values immediately (driven by `queryClient.setQueryData` + `invalidateQueries`)

- [ ] Task 6 — Tests: Unit and component tests (AC: #1, #2, #3, #4)
  - [ ] Unit test `useUpdateCliente.test.ts` in `frontend/src/modules/crm/clientes/application/__tests__/` — mock `clienteApiRepository.update`; assert: success path calls `invalidateQueries(['clientes'])`, calls `setQueryData(['clientes', id])` with updated client, and emits toast "Cliente actualizado correctamente"; 409 error propagates without generic toast; other error triggers toast "No se pudo actualizar el cliente. Intenta de nuevo."
  - [ ] Component test `ClienteForm.test.tsx` (RTL + MSW) — extend existing test file with edit-mode cases:
    - [ ] TC-2.4-C-01 (P1): Render form with `clienteId` and `defaultValues`, assert all four fields pre-filled with provided values (R-008)
    - [ ] TC-2.4-C-02 (P0): Clear Nombre field, submit, assert inline error "El nombre es requerido" and no API call fired (FR8)
    - [ ] TC-2.4-C-03 (P1): Mock PUT 200 response, submit valid edit form, assert `onSuccess` called and toast "Cliente actualizado correctamente"
    - [ ] TC-2.4-C-04 (P1): Click "Cancelar" after modifying a field, assert `onCancel` called and no PUT request made (R-008)
    - [ ] TC-2.4-C-05 (P1): Mock PUT 409 response, submit with duplicate NIT, assert "El NIT/RUC ya está registrado" on NIT field, no generic toast shown
    - [ ] TC-2.4-C-06 (P1): While `isPending=true` in edit mode, assert submit button is disabled and shows "Guardando…"
  - [ ] Component test `ClienteDetailView.test.tsx` (RTL) — extend existing test file:
    - [ ] TC-2.4-C-07 (P1): Assert "Editar" button is rendered in the detail view when client data is loaded
    - [ ] TC-2.4-C-08 (P1): Click "Editar" button, assert Dialog opens with ClienteForm pre-filled

## Dev Notes

### Architecture Decisions Applied

- **Clean Architecture layers strictly enforced:** `domain/` updates `IClienteRepository` interface only; `application/` adds `useUpdateCliente.ts`; `infrastructure/` adds `update` to the Axios adapter; `presentation/` modifies `ClienteForm.tsx` and `ClienteDetailView.tsx`. [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- **TanStack Query dual invalidation on update:** After successful PUT, both `invalidateQueries({ queryKey: ['clientes'] })` (to refresh the list) and `setQueryData(['clientes', id], updatedCliente)` (to immediately update the detail panel cache) are called. This satisfies FR27 (changes immediately visible) and prevents a full refetch for the detail view. [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- **`ClienteForm` dual-mode design:** The component is extended with optional `clienteId` and `defaultValues` props to support both create (Story 2.3) and edit (Story 2.4) modes without duplicating form logic. When `clienteId` is present, the mutation switches from `useCreateCliente` to `useUpdateCliente`. Existing create-mode behavior is unchanged. [Source: Story 2.3 patterns]
- **409 conflict handling for edit:** Same pattern as Story 2.3 — the backend catches `DbUpdateException` when `uk_clientes_nit` constraint is violated on PUT. Frontend `useUpdateCliente` inspects `error.response.status === 409` and calls `setError('nit', ...)` on the form. No generic toast for this case. [Source: Story 2.3 completion notes, `_bmad-output/planning-artifacts/architecture.md#Format Patterns`, NFR6]
- **Cancel guard:** Clicking "Cancelar" calls `onCancel()` which sets `isEditing = false` and closes the Dialog. No mutation is fired. The TanStack Query cache is untouched, so the detail panel continues to show the original values. This fulfills R-008. [Source: `_bmad-output/test-design-epic-2.md#R-008`]
- **`UpdatedAt` must be `DateTimeOffset`:** The `ClienteEntity.Update()` method sets `UpdatedAt = DateTimeOffset.UtcNow`. Never use `DateTime`. [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- **Backend `Update()` domain method pattern:** Consistent with the Entity Pattern (private constructor + factory + domain methods). The `Update()` instance method modifies fields and sets `UpdatedAt`. [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]

### UI Implementation Requirements (MANDATORY)

- **Primary library:** `siesa-ui-kit` — check catalog for `Form`, `Dialog`, `Drawer`, or `FormField` components before using shadcn Dialog. Based on Stories 2.2 and 2.3, siesa-ui-kit has no dialog equivalent — use existing shadcn Dialog (already installed from Story 1.1).
- **Fallback:** `shadcn/ui` Dialog component (already installed) for the modal container.
- **Constraint:** Do NOT create custom modal/dialog — shadcn Dialog is available.
- **Icons:** Heroicons `PencilSquareIcon` for "Editar" button. [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Icons`]
- **Toast:** Use `sonner` toast already installed in Story 2.3 (`import { toast } from 'sonner'`). `<Toaster>` is already mounted in `__root.tsx`.
- **Form inputs:** Use existing shadcn `Input`, `Label`, and `Button` components consistent with `ClienteForm` from Story 2.3.

### Project Structure Notes

```
frontend/src/
  modules/
    crm/
      clientes/
        domain/
          IClienteRepository.ts        # MODIFY: add update(id: string, data: ClienteFormData): Promise<Cliente>
        application/
          clienteSchema.ts             # NO CHANGE: reuse existing Zod schema
          useUpdateCliente.ts          # NEW: TanStack mutation hook for PUT /api/v1/clientes/:id
        infrastructure/
          clienteApiRepository.ts      # MODIFY: implement update via Axios PUT /api/v1/clientes/${id}
        presentation/
          ClienteForm.tsx              # MODIFY: add clienteId and defaultValues props; dual-mode (create/edit)
          ClienteDetailView.tsx        # MODIFY: add "Editar" button + Dialog state

backend/
  src/
    SiesaAgents.Domain/
      Clientes/
        Entities/
          ClienteEntity.cs             # MODIFY: add Update(nombre, nit, telefono, ciudad) instance method
    SiesaAgents.Application/
      Clientes/
        Commands/
          UpdateClienteCommand.cs      # NEW
          UpdateClienteCommandHandler.cs  # NEW
        DTOs/
          UpdateClienteRequest.cs      # NEW
        Validators/
          UpdateClienteRequestValidator.cs  # NEW
        Interfaces/
          IClienteRepository.cs        # MODIFY: add UpdateAsync(ClienteEntity): Task<ClienteEntity>
    SiesaAgents.Infrastructure/
      Repositories/
        ClienteRepository.cs           # MODIFY: implement UpdateAsync
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs            # MODIFY: register PUT /api/v1/clientes/{id}
      Program.cs                       # MODIFY: register UpdateClienteCommandHandler + UpdateClienteRequestValidator as Scoped
  tests/
    SiesaAgents.UnitTests/
      Application/
        Clientes/
          UpdateClienteCommandHandlerTests.cs  # NEW
      Integration/
        ClienteEndpointsTests.cs       # MODIFY: add PUT tests
      Application/
        GetClientesQueryHandlerTests.cs            # MODIFY: add UpdateAsync to FakeClienteRepository
        Clientes/
          GetClienteByIdQueryHandlerTests.cs        # MODIFY: add UpdateAsync to FakeClienteRepository
          CreateClienteCommandHandlerTests.cs       # MODIFY: add UpdateAsync to FakeClienteRepository
```

### Key Patterns and Constraints

**Backend `IClienteRepository` extension:**
```csharp
// SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs
public interface IClienteRepository
{
    Task<IEnumerable<ClienteEntity>> GetAllAsync();
    Task<ClienteEntity?> GetByIdAsync(Guid id);
    Task<ClienteEntity> AddAsync(ClienteEntity entity);
    Task<ClienteEntity> UpdateAsync(ClienteEntity entity);  // NEW
}
```

**Backend `ClienteEntity.Update()` instance method:**
```csharp
// SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public void Update(string nombre, string nit, string telefono, string ciudad)
{
    ArgumentException.ThrowIfNullOrWhiteSpace(nombre);
    ArgumentException.ThrowIfNullOrWhiteSpace(nit);
    ArgumentException.ThrowIfNullOrWhiteSpace(telefono);
    ArgumentException.ThrowIfNullOrWhiteSpace(ciudad);
    Nombre = nombre;
    Nit = nit;
    Telefono = telefono;
    Ciudad = ciudad;
    UpdatedAt = DateTimeOffset.UtcNow;
}
```

**Backend endpoint (200 OK + 404 + 409):**
```csharp
// ClienteEndpoints.cs — add inside MapClienteEndpoints():
group.MapPut("/{id:guid}", UpdateCliente);

private static async Task<IResult> UpdateCliente(
    Guid id,
    UpdateClienteRequest request,
    UpdateClienteRequestValidator validator,
    UpdateClienteCommandHandler handler)
{
    var validation = await validator.ValidateAsync(request);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());

    try
    {
        var result = await handler.Handle(new UpdateClienteCommand(id, request));
        if (result is null)
            return Results.NotFound(new { title = "Cliente no encontrado.", status = 404 });
        return Results.Ok(result);
    }
    catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("uk_clientes_nit") == true)
    {
        return Results.Conflict(new { title = "El NIT/RUC ya está registrado.", status = 409 });
    }
}
```

**Frontend `useUpdateCliente` mutation hook:**
```typescript
// frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { ClienteFormData } from './clienteSchema';
import { toast } from 'sonner';

export function useUpdateCliente(
  setNitError?: (message: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteFormData }) =>
      clienteApiRepository.update(id, data),
    onSuccess: (updatedCliente) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.setQueryData(['clientes', updatedCliente.id], updatedCliente);
      toast.success('Cliente actualizado correctamente');
    },
    onError: (error) => {
      const axiosError = error as import('axios').AxiosError;
      if (axiosError?.response?.status === 409) {
        setNitError?.('El NIT/RUC ya está registrado');
      } else {
        toast.error('No se pudo actualizar el cliente. Intenta de nuevo.');
      }
    },
  });
}
```

**Frontend `ClienteForm` dual-mode extension (key props):**
```typescript
// ClienteForm.tsx — updated signature
interface ClienteFormProps {
  clienteId?: string;          // present = edit mode; absent = create mode
  defaultValues?: ClienteFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClienteForm({ clienteId, defaultValues, onSuccess, onCancel }: ClienteFormProps) {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  });

  const createMutation = useCreateCliente((msg) => setError('nit', { message: msg }));
  const updateMutation = useUpdateCliente((msg) => setError('nit', { message: msg }));

  const isPending = clienteId ? updateMutation.isPending : createMutation.isPending;

  const onSubmit = (data: ClienteFormData) => {
    if (clienteId) {
      updateMutation.mutate({ id: clienteId, data }, { onSuccess });
    } else {
      createMutation.mutate(data, { onSuccess });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Fields identical to Story 2.3 pattern */}
      <button type="button" onClick={onCancel}>Cancelar</button>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Guardando…' : clienteId ? 'Guardar cambios' : 'Guardar cliente'}
      </button>
    </form>
  );
}
```

**Frontend "Editar" button in `ClienteDetailView`:**
```typescript
// ClienteDetailView.tsx — add state and Dialog wrapper
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { ClienteForm } from './ClienteForm';

const [isEditing, setIsEditing] = useState(false);

// In JSX header — alongside existing actions:
<button type="button" onClick={() => setIsEditing(true)}>
  <PencilSquareIcon className="h-4 w-4" />
  Editar
</button>

<Dialog open={isEditing} onOpenChange={setIsEditing}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar cliente</DialogTitle>
    </DialogHeader>
    <ClienteForm
      clienteId={cliente.id}
      defaultValues={{ nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }}
      onSuccess={() => setIsEditing(false)}
      onCancel={() => setIsEditing(false)}
    />
  </DialogContent>
</Dialog>
```

### Previous Story Learnings (from Stories 2.1, 2.2, 2.3)

- **MediatR not installed** — Continue using direct handler injection pattern. Register `UpdateClienteCommandHandler` and `UpdateClienteRequestValidator` as `Scoped` in `Program.cs`. [Source: `2-1-client-list-search.md#Completion Notes List`]
- **siesa-ui-kit has no dialog equivalent** — Only `FormCacheSelector` available. Use existing shadcn Dialog (already installed from Story 1.1). [Source: `2-2-client-detail-view.md#Completion Notes List`]
- **Toast library:** `sonner` v2.0.7 is installed. Import: `import { toast } from 'sonner'`. `<Toaster>` is already mounted in `__root.tsx`. [Source: `2-3-create-client.md#Completion Notes List`]
- **`Telefono` MaximumLength is 30**, NOT 50 — match DB column `character varying(30)`. [Source: `2-3-create-client.md#Senior Developer Review — HIGH-1 FIXED`]
- **dotnet SDK not available** — Backend tests must be authored and verified by code inspection; cannot be executed in this environment. Document in Completion Notes.
- **Two-panel layout:** `frontend/src/routes/_app/clientes.tsx` renders `ClienteListView` (left) + `<Outlet />` (right). `ClienteDetailView.tsx` lives at `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`. [Source: `2-2-client-detail-view.md`]
- **`IClienteRepository` FakeClienteRepository implementations** — Adding `UpdateAsync` to FakeClienteRepository is required in all existing test files to avoid compile errors. [Source: `2-3-create-client.md#Completion Notes List`]
- **`@testing-library/user-event` already installed** — No need to add again. [Source: `2-1-client-list-search.md#Completion Notes List`]
- **`apiClient` base URL fallback** — Already configured as `?? 'http://localhost:5000'`. MSW works correctly in tests.

### Git History Context

Follow the naming pattern established in previous stories:
- `feat(story-2.4): implement edit client form (frontend + backend)`
- `test(story-2.4): add ATDD tests for edit client — all levels`
- `fix(review-2.4): apply code review auto-corrections`

### References

- Architecture mutation patterns and query key conventions: [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- API endpoint `PUT /api/v1/clientes/{id}`: [Source: `_bmad-output/planning-artifacts/architecture.md#REST Endpoints`]
- Epic acceptance criteria: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4`]
- FR6 (edit any field), FR8 (validation), FR27 (immediate reflection): [Source: `_bmad-output/planning-artifacts/prd/functional-requirements.md`]
- NFR2 (CRUD < 2s), NFR5 (sanitization), NFR6 (no stack traces): [Source: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`]
- R-008 (form does not block navigation / silent data loss on cancel): [Source: `_bmad-output/test-design-epic-2.md#Risk Assessment`]
- R-002 (duplicate NIT not surfaced as inline error): [Source: `_bmad-output/test-design-epic-2.md#Risk Assessment`]
- Test design for Story 2.4 (P0 + P1): [Source: `_bmad-output/test-design-epic-2.md#P1`]
- Previous story patterns (handler injection, toast library, siesa-ui-kit availability): [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md`]
- Company standards (TypeScript strict, DateTimeOffset, snake_case, Spanish UI): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]

### Test Scenarios from Test Design (Epic 2 — P0 + P1 for Story 2.4)

| TC ID | Priority | Level | Description |
|-------|----------|-------|-------------|
| TC-2.4-P0-01 | P0 | Component | Clear Nombre field, submit edit form, assert inline error "El nombre es requerido" and no PUT fired (FR8) |
| TC-2.4-P0-02 | P0 | API | PUT duplicate NIT (different client) → 409 with `title: "El NIT/RUC ya está registrado."`, no `stackTrace` field (R-002) |
| TC-2.4-P1-01 | P1 | Component | Render form with `clienteId` + `defaultValues`, assert all four fields pre-filled (R-008) |
| TC-2.4-P1-02 | P1 | Component | Submit valid edit form, mock 200 response, assert toast "Cliente actualizado correctamente" |
| TC-2.4-P1-03 | P1 | Component | Click "Cancelar" after modifying field, assert `onCancel` called and no PUT fired (R-008) |
| TC-2.4-P1-04 | P1 | Component | Mock PUT 409, assert "El NIT/RUC ya está registrado" on NIT field, no generic toast |
| TC-2.4-P1-05 | P1 | Component | While `isPending`, assert submit button disabled and shows "Guardando…" |
| TC-2.4-P1-06 | P1 | Component | "Editar" button visible in `ClienteDetailView` when client data is loaded |
| TC-2.4-P1-07 | P2 | Component | Submit update success toast message "Cliente actualizado correctamente" in Spanish (R-011) |

### Non-Functional Requirements for This Story

- **NFR2 (CRUD < 2s):** After PUT, `invalidateQueries` + `setQueryData` must update the detail panel and list within 2 seconds of the successful response.
- **NFR5 (Sanitization):** FluentValidation on all backend fields (server-side gate) + Zod on all frontend fields (client-side pre-submit guard). Both layers mandatory.
- **NFR6 (No stack traces):** Backend returns Problem Details RFC 7807 for 400, 404, 409 errors. Frontend must not expose `error.message` or Axios error internals.
- **FR27 (Immediate reflection):** Updated client must appear in `ClienteDetailView` and `ClienteListView` immediately without manual refresh. Achieved via `queryClient.setQueryData` + `invalidateQueries` in mutation `onSuccess`.
- **WCAG 2.1 AA:** All form inputs have `<label>` with `htmlFor`; error messages use `aria-describedby`; submit button has accessible label; touch targets ≥ 44×44px.
