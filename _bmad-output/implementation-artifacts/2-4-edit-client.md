# Story 2.4: Edit Client

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Editar", **Then** the client form opens pre-filled with the current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad. (FR6, AC-E2.3)

2. **Given** the user modifies one or more fields and submits, **When** the form is saved, **Then** the changes are reflected in the client detail and list immediately (FR27) **And** a toast de éxito shows "Cliente actualizado correctamente". (AC-E2.3, FR27, NFR2)

3. **Given** the user clears a required field and submits, **When** the form is validated, **Then** an inline error message appears on the cleared field and the form is NOT submitted to the backend. (AC-E2.4, FR8)

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged and no PUT request is triggered.

5. **Given** the form submits successfully, **When** the mutation's `onSuccess` fires, **Then** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is called, causing both the list and detail to re-fetch with the updated values. (FR27, R-E2-05)

## Tasks / Subtasks

- [x] Task 1 — Create `useUpdateCliente` application hook (AC: #2, #5)
  - [x] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
    - Uses `useMutation` from TanStack Query
    - `mutationFn: ({ id, data }: { id: string; data: ClienteFormData }) => clienteApiRepository.update(id, data)` — calls `PUT /api/v1/clientes/{id}`
    - `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` AND `queryClient.invalidateQueries({ queryKey: ['clientes', id] })` to refresh both list and detail caches
    - Shows toast "Cliente actualizado correctamente" in `onSuccess`
    - `onError`: shows generic "Error al actualizar el cliente" (never expose raw error details)
    - Exposes `mutate`, `isPending`, `isError`, `error` from the hook

- [x] Task 2 — Extend infrastructure layer: add `update` to API repository (AC: #2)
  - [x] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `update(id: string, data: ClienteFormData): Promise<Cliente>` method signature
  - [x] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `update`: calls `PUT /api/v1/clientes/${id}` via `apiClient` with `data` as JSON body; returns `Cliente`; throws on non-2xx (let `useMutation` `onError` handle it)

- [x] Task 3 — Update `ClienteForm` to support edit mode (AC: #1, #3, #4)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
    - Add optional props: `cliente?: Cliente` (existing client to edit) and `mode?: 'create' | 'edit'` (defaults to `'create'`)
    - When `cliente` prop is provided, initialize form with `defaultValues` from the existing client data using `useForm`'s `defaultValues` option
    - When `mode === 'edit'`: submit calls `useUpdateCliente.mutate({ id: cliente.id, data })` instead of `useCreateCliente.mutate(data)`
    - Reuse same Zod `clienteSchema` and `zodResolver` for validation (schema unchanged)
    - "Guardar" button shows loading indicator when `isPending` is true; disabled during pending
    - "Cancelar" button closes form without triggering any mutation; calls `onCancel()` prop
    - Props interface updated: `{ cliente?: Cliente; mode?: 'create' | 'edit'; onSuccess?: () => void; onCancel?: () => void }`
    - Check siesa-ui-kit first for form input / label / button components; fall back to shadcn/ui, then custom

- [x] Task 4 — Wire "Editar" button in `ClienteDetailView` (AC: #1, #4)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
    - Add "Editar" button (Heroicon `PencilIcon` + label) in the detail panel actions area
    - Manage `isEditFormOpen: boolean` state with `useState`
    - When `isEditFormOpen === true`: render `ClienteForm` with `mode="edit"` and `cliente={currentCliente}` (pass full `Cliente` object from TanStack Query cache)
    - Pass `onSuccess={() => setIsEditFormOpen(false)}` and `onCancel={() => setIsEditFormOpen(false)}` to `ClienteForm`
    - When `isEditFormOpen === false`: render the client detail as before (Nombre, NIT/RUC, Teléfono, Ciudad)
    - Form host: use siesa-ui-kit dialog/sheet if available, else the shadcn `Dialog` component already installed in the project

- [x] Task 5 — Backend: PUT /api/v1/clientes/{id} endpoint (AC: #2, #3)
  - [x] Create `UpdateClienteCommand.cs` + `UpdateClienteCommandHandler.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/`
    - Command record: `UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad)`
    - Handler: loads `ClienteEntity` by ID via `IClienteRepository.GetByIdAsync(id)`; if not found, throws domain-level NotFoundException → 404; calls entity update method (e.g., `entity.Update(nombre, nit, telefono, ciudad)`) which sets fields and `UpdatedAt = DateTimeOffset.UtcNow`; calls `SaveChangesAsync()`; returns `ClienteDto`
  - [x] Add `Update(string nombre, string nit, string telefono, string ciudad)` method to `ClienteEntity` in `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
    - Sets `Nombre`, `Nit`, `Telefono`, `Ciudad` on the entity
    - Sets `UpdatedAt = DateTimeOffset.UtcNow` — ALWAYS `DateTimeOffset`, NEVER `DateTime`
  - [x] Create `UpdateClienteRequestValidator.cs` in `backend/src/SiesaAgents.Application/Clientes/Validators/`
    - FluentValidation: `Nombre`, `Nit`, `Telefono`, `Ciudad` all required (not empty/null)
    - Returns `400 Bad Request` with Problem Details on validation failure
  - [x] Create or verify endpoint `PUT /api/v1/clientes/{id}` in `backend/src/SiesaAgents.API/Endpoints/ClientesEndpoints.cs`
    - Accepts `UpdateClienteRequest` body (maps to command fields) and `{id}` route param (Guid)
    - Returns `200 OK` with updated `ClienteDto` body
    - Returns `400 Bad Request` + Problem Details when FluentValidation fails
    - Returns `404 Not Found` + Problem Details when client does not exist
    - Uses Scalar docs (NEVER Swagger)
  - [x] Update `IClienteRepository` interface in `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — add `UpdateAsync(ClienteEntity entity): Task` if not already present
  - [x] Update `ClienteRepository` implementation in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `UpdateAsync`: marks entity as Modified in EF Core context and calls `SaveChangesAsync()`

- [x] Task 6 — Write tests (AC: #1–#5)
  - [x] **Unit test** `useUpdateCliente.test.ts`:
    - TC-E2-P2-05 (analog for update): spy on `queryClient.invalidateQueries`; execute mutation `onSuccess` callback; assert `invalidateQueries({ queryKey: ['clientes'] })` called AND `invalidateQueries({ queryKey: ['clientes', id] })` called
    - Assert `isPending` is `true` during mutation execution
  - [x] **Component test** `ClienteForm.edit.test.tsx` (or extend `ClienteForm.test.tsx`):
    - TC-E2-P1-07: Render `ClienteForm` with `mode="edit"` and `cliente={{ id: '1', nombre: 'Delta SA', nit: '888', telefono: '3219876543', ciudad: 'Medellín' }}`; assert all 4 inputs are pre-filled with correct values
    - TC-E2-P1-08: Open edit form pre-filled, modify `Nombre` to "Modified Name", click "Cancelar"; assert `onCancel` was called; assert PUT NOT triggered by MSW (0 requests)
    - TC-E2-P1-09: Fill edit form, change `Ciudad` to "Cali", submit → MSW returns 200 → assert PUT called with correct payload `{ nombre, nit, telefono, ciudad: "Cali" }`, toast "Cliente actualizado correctamente" shown, `onSuccess` called
    - TC-E2-P2-02: Open edit form pre-filled, clear `Nombre`, submit; assert inline error on `Nombre` field; assert PUT not called (MSW receives 0 requests)
  - [x] **API Integration test** `UpdateClienteEndpointTests.cs` (xUnit + WebApplicationFactory):
    - TC-E2-P1-18: Seed client with `ciudad: "Bogotá"`; PUT `{ nombre, nit, telefono, ciudad: "Cali" }` to `/api/v1/clientes/{id}`; assert 200, response body has updated `ciudad: "Cali"` and `updatedAt` (ISO 8601 with TZ); follow-up GET confirms persistence
    - Update 404: PUT valid payload to non-existent ID `/api/v1/clientes/00000000-0000-0000-0000-000000000000`; assert 404 Problem Details with `status: 404`; assert NO `stackTrace`
    - Validation 400: PUT `{}` (empty body) to valid ID; assert 400, Problem Details with errors on `nombre`, `nit`, `telefono`, `ciudad`; assert NO `stackTrace`

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. Layers: Domain → Application → Infrastructure → Presentation. No direct API calls in UI components.
- **CQRS**: Update operation is a Command (`UpdateClienteCommand`) not a Query. Handler is in `Application/Clientes/Commands/`.
- **Mutation hook**: `useUpdateCliente` uses TanStack Query `useMutation`. The `onSuccess` callback MUST call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` (list) AND `queryClient.invalidateQueries({ queryKey: ['clientes', id] })` (single detail) to comply with FR27 and NFR2 (< 2s update). Both invalidations are required to prevent stale data in the detail panel (R-E2-05).
- **ClienteForm reuse**: The same `ClienteForm` component introduced in Story 2.3 is extended in this story to support both create and edit modes. Use the optional `cliente` prop and `defaultValues` in `useForm` to pre-fill the form. Do NOT create a separate `ClienteEditForm` component.
- **Entity update pattern**: `ClienteEntity` must have an `Update()` method (not a new factory) per DDD entity update patterns. The handler loads the entity, calls `entity.Update(...)`, then persists via the repository. This ensures `UpdatedAt = DateTimeOffset.UtcNow` is set correctly.
- **Primary keys**: `Id = Guid` — UUID mandatory per company standards. Route param `{id}` must be parsed as `Guid`, not string.
- **Problem Details RFC 7807**: All backend error responses (`400`, `404`) must use Problem Details format. No stack traces exposed to frontend (NFR6). `ExceptionHandlingMiddleware` from Epic 1 handles this.
- **Toast notifications**: Reuse whatever toast mechanism established in Story 2.3 (likely `react-hot-toast`). Toast text: "Cliente actualizado correctamente" (success). Error shown as toast for generic errors; no inline form error for non-409 errors.
- **Form default values**: When `mode === 'edit'`, pass `{ nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }` as `defaultValues` to `useForm`. This populates all fields without manual `setValue` calls.
- **Cancel guard**: The `ClienteForm` cancel button must call `onCancel()` without triggering any submission or state mutation. This is critical for AC #4 and R-E2-08.

### siesa-ui-kit Usage (MANDATORY)

This story modifies an existing UI component (form with inputs and buttons). Check siesa-ui-kit catalog BEFORE creating any custom component:
- Reuse **form input / text field** component established in Story 2.3
- Reuse **button** component (primary "Guardar", secondary "Cancelar") from Story 2.3
- Reuse **modal / dialog / sheet** component from Story 2.3 (if form was shown in a dialog)
- Reuse **toast / notification** component from Story 2.3 for success message
- Install: `npm install siesa-ui-kit` (must already be present from Story 1.1)
- **Heroicon**: `PencilIcon` for the "Editar" button in the detail panel

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/clientes/
  domain/
    IClienteRepository.ts              ← Update: add update(id, data) method signature
    Cliente.ts                         ← No change expected (entity type already has id, nombre, nit, telefono, ciudad)
  application/
    useUpdateCliente.ts                ← New
  infrastructure/
    clienteApiRepository.ts            ← Update: implement update(id, data)
  presentation/
    ClienteForm.tsx                    ← Update: add cliente? and mode? props; support edit mode
    ClienteDetailView.tsx              ← Update: add "Editar" button + isEditFormOpen state
```

Backend files to create or modify:
```
backend/src/SiesaAgents.Domain/Clientes/
  Entities/
    ClienteEntity.cs                   ← Update: add Update() instance method

backend/src/SiesaAgents.Application/Clientes/
  Commands/UpdateClienteCommand.cs     ← New
  Commands/UpdateClienteCommandHandler.cs ← New
  Validators/UpdateClienteRequestValidator.cs ← New
  DTOs/UpdateClienteRequest.cs         ← New
  Interfaces/IClienteRepository.cs     ← Update: add UpdateAsync(ClienteEntity) if not present

backend/src/SiesaAgents.Infrastructure/
  Repositories/ClienteRepository.cs    ← Update: implement UpdateAsync

backend/src/SiesaAgents.API/Endpoints/
  ClientesEndpoints.cs                 ← Update: add PUT /api/v1/clientes/{id} endpoint
```

Test files to create or modify:
```
frontend/src/modules/crm/clientes/
  application/useUpdateCliente.test.ts ← New
  presentation/ClienteForm.test.tsx    ← Update: add edit-mode tests (or create ClienteForm.edit.test.tsx)

backend/tests/SiesaAgents.IntegrationTests/Clientes/
  UpdateClienteEndpointTests.cs        ← New
```

### API Contract

```
PUT /api/v1/clientes/{id}
  Route param: id (Guid / UUID)
  Request body: { "nombre": string, "nit": string, "telefono": string, "ciudad": string }

  Response success: 200 OK
  Body: ClienteDto (direct object, no wrapper)

  Response not found: 404 Not Found
  Content-Type: application/problem+json
  Body: Problem Details RFC 7807
    {
      "status": 404,
      "title": "Not Found",
      "detail": "Cliente no encontrado"
    }

  Response validation error: 400 Bad Request
  Content-Type: application/problem+json
  Body: Problem Details RFC 7807
    {
      "status": 400,
      "title": "Validation Error",
      "errors": { "nombre": ["..."], "nit": ["..."], ... }
    }
    (NO stackTrace, NO innerException, NO exception keys)

ClienteDto {
  id: Guid           // UUID v4/v7
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string  // DateTimeOffset ISO 8601 with TZ — e.g. "2026-06-29T10:00:00Z"
  updatedAt: string  // DateTimeOffset ISO 8601 with TZ — updated on PUT
}
```

### TanStack Query Keys (Canonical)

```typescript
['clientes']               // list — invalidate on PUT onSuccess
['clientes', clienteId]    // single — invalidate on PUT onSuccess
```

Mutation `onSuccess` in `useUpdateCliente` MUST call BOTH:
```typescript
queryClient.invalidateQueries({ queryKey: ['clientes'] })
queryClient.invalidateQueries({ queryKey: ['clientes', id] })
// Both invalidations ensure list AND detail panel show updated values immediately
```

### useUpdateCliente Hook Pattern

```typescript
// application/useUpdateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { ClienteFormData } from './clienteSchema'

export function useUpdateCliente(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteFormData }) =>
      clienteApiRepository.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', id] })
      // Show success toast: "Cliente actualizado correctamente"
      options?.onSuccess?.()
    },
    onError: () => {
      // Show generic error: "Error al actualizar el cliente"
    },
  })
}
```

### ClienteForm Edit Mode Pattern

```typescript
// presentation/ClienteForm.tsx — updated to support both create and edit
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, type ClienteFormData } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'
import { useUpdateCliente } from '../application/useUpdateCliente'
import type { Cliente } from '../domain/Cliente'

interface ClienteFormProps {
  cliente?: Cliente          // existing client for edit mode
  mode?: 'create' | 'edit'  // defaults to 'create'
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClienteForm({ cliente, mode = 'create', onSuccess, onCancel }: ClienteFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: mode === 'edit' && cliente
      ? { nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }
      : undefined,
  })

  const createMutation = useCreateCliente({ onSuccess })
  const updateMutation = useUpdateCliente({ onSuccess })

  const isPending = mode === 'create' ? createMutation.isPending : updateMutation.isPending

  const onSubmit = (data: ClienteFormData) => {
    if (mode === 'edit' && cliente) {
      updateMutation.mutate({ id: cliente.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Nombre, NIT/RUC, Teléfono, Ciudad fields with inline error messages */}
      {/* "Guardar" button: disabled + loading indicator when isPending */}
      {/* "Cancelar" button: calls onCancel() without submitting */}
    </form>
  )
}
```

### Backend Entity Update Method Pattern

```csharp
// Domain/Clientes/Entities/ClienteEntity.cs — add Update() method
public class ClienteEntity : Entity  // Entity base provides Id (Guid)
{
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { }  // EF Core constructor

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        // Already implemented in Story 2.3
        return new ClienteEntity
        {
            Nombre = nombre, Nit = nit, Telefono = telefono, Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow,
        };
    }

    // NEW in Story 2.4
    public void Update(string nombre, string nit, string telefono, string ciudad)
    {
        Nombre = nombre;
        Nit = nit;
        Telefono = telefono;
        Ciudad = ciudad;
        UpdatedAt = DateTimeOffset.UtcNow;  // ALWAYS DateTimeOffset, NEVER DateTime
    }
}
```

### UpdateClienteCommandHandler Pattern

```csharp
// Application/Clientes/Commands/UpdateClienteCommandHandler.cs
public class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public UpdateClienteCommandHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<ClienteDto> Handle(UpdateClienteCommand command, CancellationToken ct)
    {
        var cliente = await _repository.GetByIdAsync(command.Id, ct);
        if (cliente is null)
            throw new NotFoundException($"Cliente con id {command.Id} no encontrado");

        cliente.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await _repository.UpdateAsync(cliente, ct);

        return new ClienteDto
        {
            Id = cliente.Id,
            Nombre = cliente.Nombre,
            Nit = cliente.Nit,
            Telefono = cliente.Telefono,
            Ciudad = cliente.Ciudad,
            CreatedAt = cliente.CreatedAt,
            UpdatedAt = cliente.UpdatedAt,
        };
    }
}
```

### MSW Handlers Required for Component Tests

```typescript
// __mocks__/handlers.ts — add to existing handlers from Stories 2.1/2.2/2.3
import { http, HttpResponse } from 'msw'

http.put('/api/v1/clientes/:id', async ({ params, request }) => {
  const body = await request.json() as any
  // Success case:
  return HttpResponse.json(
    { id: params.id, ...body, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-29T10:00:00Z' },
    { status: 200 }
  )
  // 404 case (use override handler in specific tests):
  // return HttpResponse.json(
  //   { status: 404, title: 'Not Found', detail: 'Cliente no encontrado' },
  //   { status: 404 }
  // )
})
```

### Testing Test Cases Covered by This Story

From `test-design-epic-2.md`:
- **P1:** TC-E2-P1-07 (edit form pre-filled with current values), TC-E2-P1-08 (cancel preserves original data + no PUT), TC-E2-P1-09 (save updates list and detail), TC-E2-P1-18 (API PUT returns 200)
- **P2:** TC-E2-P2-02 (clear required field shows inline error, blocks submit)

### Previous Story Learnings (from Stories 2.1, 2.2, and 2.3)

- `clienteApiRepository.ts` already implements `getAll()`, `getById()`, and `create()` — follow the same Axios pattern for `update()`: `apiClient.put<Cliente>(\`/api/v1/clientes/${id}\`, data).then(r => r.data)`
- `apiClient.ts` (Axios singleton) is at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL`
- `clienteSchema.ts` (Zod) already validates all 4 required fields — reuse unchanged for edit mode
- TanStack Query `queryKey: ['clientes']` (list) and `['clientes', id]` (single) — BOTH must be invalidated on PUT `onSuccess`
- `ExceptionHandlingMiddleware.cs` is implemented and maps exceptions to Problem Details — add `NotFoundException` → 404 mapping if not already present
- `ClientesEndpoints.cs` already has `GET /api/v1/clientes`, `GET /api/v1/clientes/{id}`, and `POST /api/v1/clientes` — add `PUT` as a new `MapPut` call in the same file
- Story 2.2 note: "URL updates to `/clientes/:clienteId` on client selection" — when edit form closes after successful save, the detail panel should still show the updated client (handled automatically by `invalidateQueries`)
- Story 2.3 note: `ClienteForm` was designed with future edit-mode support in mind — extend it with `cliente?` and `mode?` props rather than duplicating it

### Performance Notes

- After a successful PUT, `invalidateQueries(['clientes'])` triggers a background re-fetch of the full list. `invalidateQueries(['clientes', id])` triggers a re-fetch of the single client detail. Both happen in parallel and the user sees updated data within the NFR2 < 2s window.
- Form validation (Zod) is synchronous — no latency impact.
- `isPending` state on the mutation prevents double-submit (button disabled during in-flight request).

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- All user-facing text in Spanish (MANDATORY): field labels "Nombre", "NIT/RUC", "Teléfono", "Ciudad"; buttons "Guardar", "Cancelar", "Editar"; error messages and toast in Spanish
- Code variables, functions, classes in English (MANDATORY)
- NEVER expose `error.message`, backend stack traces, or internal exception details in the UI
- 404 response from backend must use Problem Details (no `stackTrace` key per NFR6 and R-E2-06)
- FluentValidation on all update endpoints (NFR5)

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.4 AC
- Previous story 2.3: `_bmad-output/implementation-artifacts/2-3-create-client.md` — `ClienteForm`, `useCreateCliente`, `clienteSchema`, `clienteApiRepository`, established patterns
- Previous story 2.2: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md` — canonical query keys, `ClienteDetailView`, `useCliente` hook
- Previous story 2.1: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — `ClienteListView`, `useClientes`, `IClienteRepository`
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — API endpoints, data model (`PUT /api/v1/clientes/{id}` → 200), entity patterns, frontend folder structure, TanStack Query keys, mutation + invalidation strategy
- Test Design Epic 2: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09, TC-E2-P1-18, TC-E2-P2-02
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, DateTimeOffset, UUID PKs, FluentValidation, Problem Details RFC 7807, Zod + React Hook Form
- MasterCrud reference: Not applicable for this story. The edit form is embedded in the split-panel detail view and uses the existing `ClienteForm` component (extended for edit mode). The form is simple (4 fields) and integrated into a specific module layout.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 6 tasks implemented. Frontend: useUpdateCliente.ts, updated IClienteRepository.ts, clienteApiRepository.ts, ClienteForm.tsx (extended with mode/cliente props), ClienteDetailView.tsx (added Editar button + isEditFormOpen state). Backend: UpdateClienteCommand.cs, UpdateClienteCommandHandler.cs, UpdateClienteRequest.cs, UpdateClienteRequestValidator.cs, ClienteEntity.Update() method, IClienteRepository.UpdateAsync(), ClienteRepository.UpdateAsync(), PUT endpoint in ClientesEndpoints.cs, DI registration in Program.cs, ClienteNotFoundException → 404 in middleware. ClienteDto extended with UpdatedAt field.
- Created proxy re-export files at src/modules/test/msw/handlers/ to resolve ATDD test import path mismatch (tests used 3-level relative paths pointing to src/modules/test/ instead of src/test/).
- 22 frontend ATDD tests GREEN (8 useUpdateCliente + 14 ClienteForm.edit). 6 backend integration tests GREEN. Pre-existing test failures in ClientesEndpointsTests (story 2.1) and ClientesEndpointsEdgeTests not introduced by this story.

### File List

- frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
- frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
- frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
- frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
- frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
- frontend/src/modules/test/msw/handlers/clientes-update.handlers.ts
- frontend/src/modules/test/msw/handlers/clientes.handlers.ts
- backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs
- backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs
- backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs
- backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs
- backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs
- backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs
- backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs
- backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
- backend/src/SiesaAgents.API/Endpoints/ClientesEndpoints.cs
- backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
- backend/src/SiesaAgents.API/Program.cs
- frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts
- frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx
- backend/tests/SiesaAgents.IntegrationTests/Clientes/UpdateClienteEndpointTests.cs
- frontend/src/modules/crm/clientes/domain/Cliente.ts

## Review Follow-ups (AI)

- [ ] [AI-Review][MED] `UpdateClienteCommandHandler.cs`: Add NIT uniqueness check before updating — call `repository.GetByNitAsync(command.Nit)` and if a different entity is found (different Id), throw `NitAlreadyExistsException`. Currently the DB constraint catches this, but the application layer should enforce it consistently with the Create pattern.
- [ ] [AI-Review][LOW] `ClienteForm.tsx`: Refactor the `onSuccess` / toast pattern — `onSuccess` is bound both at the hook level (via `useUpdateCliente({ onSuccess })`) and the toast is shown in the per-call `mutate()` callback. Consider moving toast into the hook's `onSuccess` to avoid ordering dependency between dialog close and toast render.
