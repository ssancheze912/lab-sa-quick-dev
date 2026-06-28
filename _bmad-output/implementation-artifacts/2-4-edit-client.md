# Story 2.4: Edit Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail in the right panel, **When** the user clicks "Editar", **Then** the `ClienteForm` opens pre-filled with the current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR6).

2. **Given** the user modifies one or more fields and submits the form, **When** the form is saved, **Then** the changes are sent via `PUT /api/v1/clientes/:id`, the updated values are reflected immediately in the client detail and the left panel list without page reload (FR27), **And** a success toast displays "Cliente actualizado correctamente".

3. **Given** the user clears a required field and submits, **When** the form is validated, **Then** an inline error message appears on the empty field and the form is NOT submitted to the backend (FR8).

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged and no API call is made.

## Tasks / Subtasks

- [ ] Task 1 — Backend: `PUT /api/v1/clientes/:id` endpoint with FluentValidation (AC: #2, #3)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs` — record with `string Nombre, string Nit, string Telefono, string Ciudad`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs` — FluentValidation: `RuleFor(x => x.Nombre).NotEmpty().MaximumLength(255)`, same for Nit (MaxLength 50), Telefono (MaxLength 50), Ciudad (MaxLength 100)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs` — record with `Guid Id, string Nombre, string Nit, string Telefono, string Ciudad`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs` — calls `IClienteRepository.GetByIdAsync(command.Id, ct)`; if null → throws domain exception (404); calls `entity.Update(...)` domain method; calls `IClienteRepository.UpdateAsync(entity, ct)`; returns updated `ClienteDto`
  - [ ] Add `Update(string nombre, string nit, string telefono, string ciudad)` method to `ClienteEntity` in `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — updates fields and sets `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] Add `Task UpdateAsync(ClienteEntity entity, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Add `UpdateAsync` implementation to `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — `_context.Clientes.Update(entity); await _context.SaveChangesAsync(ct);`
  - [ ] Add `MapPut("/{id:guid}", ...)` to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — validates `UpdateClienteRequest` via `UpdateClienteRequestValidator`; on invalid → `Results.ValidationProblem(errors)` (400); on entity not found (null from handler) → `Results.Problem(detail: "El cliente solicitado no fue encontrado.", statusCode: 404, title: "Cliente no encontrado")`; on DB unique violation (23505) → `Results.Problem(detail: "El NIT/RUC ya está registrado", statusCode: 409, title: "Conflicto de datos")`; on success → `Results.Ok(dto)` (200)
  - [ ] Register `UpdateClienteCommandHandler` and `UpdateClienteRequestValidator` in `backend/src/SiesaAgents.API/Program.cs` DI

- [ ] Task 2 — Frontend: Application layer — `useUpdateCliente` mutation hook (AC: #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts` — TanStack Query `useMutation`:
    - `mutationFn: ({ id, data }: { id: string; data: ClienteFormData }) => clienteApiRepository.update(id, data)`
    - `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente actualizado correctamente'); }`
    - Expose mutation `isPending` for submit button disabled state
  - [ ] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `update(id: string, data: ClienteFormData): Promise<Cliente>`
  - [ ] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `update(id, data)`: `PUT /api/v1/clientes/${id}` via `apiClient`, returns `response.data`

- [ ] Task 3 — Frontend: Presentation layer — extend `ClienteForm` for edit mode (AC: #1, #2, #3, #4)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` to support edit mode:
    - Add optional props: `clienteId?: string`, `defaultValues?: ClienteFormData`
    - When `clienteId` and `defaultValues` are provided: use `useUpdateCliente` mutation and pre-fill form via `useForm({ resolver: zodResolver(clienteSchema), defaultValues })`
    - When no `clienteId`: use `useCreateCliente` mutation (existing create behavior — do NOT break)
    - Submit button label: `"Guardar cambios"` in edit mode, `"Crear cliente"` in create mode
    - On 409 from update mutation `onError`: set form error on `nit` field via `setError('nit', { message: 'El NIT/RUC ya está registrado' })`
    - On success: call `onSuccess?.()` then `onClose()`
    - Cancel button `"Cancelar"` (`data-testid="btn-cancel"`) — calls `onClose` without mutation; original data unchanged (AC: #4)
    - All user-facing text in Spanish; no `any` TypeScript types

- [ ] Task 4 — Frontend: "Editar" button wiring in `ClienteDetailView` (AC: #1)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Add `"Editar"` button (`data-testid="btn-editar"`) visible when a client is loaded (data state)
    - Clicking it sets local `useState<boolean>` `isEditFormOpen = true`
    - Render `<ClienteForm clienteId={data.id} defaultValues={{ nombre: data.nombre, nit: data.nit, telefono: data.telefono, ciudad: data.ciudad }} onClose={() => setIsEditFormOpen(false)} onSuccess={() => refetch()} />` conditionally when `isEditFormOpen === true` — displayed as accessible modal overlay (role="dialog") using shadcn/ui Dialog or the existing custom overlay pattern established in Story 2.3
    - `data-testid="btn-editar"` must only be visible in the data-loaded state (not during loading/error/not-found)

- [ ] Task 5 — Tests (AC: #1, #2, #3, #4) — aligned with test-design-epic-2.md
  - [ ] **Backend API — P1**: `PUT /api/v1/clientes/:id` with valid payload returns 200 + updated `ClienteDto` JSON (xUnit, WebApplicationFactory)
  - [ ] **Backend API — P1**: `PUT /api/v1/clientes/:id` with Nombre=null returns 400 + Problem Details with `errors` object (xUnit)
  - [ ] **Backend API — P1**: `PUT /api/v1/clientes/{unknown-uuid}` returns 404 + Problem Details (xUnit)
  - [ ] **Backend API — P2**: `PUT /api/v1/clientes/:id` with NIT already used by another client returns 409 + Problem Details "El NIT/RUC ya está registrado" (xUnit)
  - [ ] **Backend unit — P2**: `UpdateClienteRequestValidator` rejects null Nombre, null Nit, null Telefono, null Ciudad (4 xUnit unit tests)
  - [ ] **Frontend component — P1**: open edit form, assert input values match the client fixture data (Vitest + RTL) — tests AC #1
  - [ ] **Frontend component — P1**: modify Nombre field, click Cancel, assert original Nombre still shown in detail view (Vitest + RTL + MSW) — tests AC #4, risk R-009
  - [ ] **Frontend component — P2**: submit valid edit form → success toast "Cliente actualizado correctamente" appears (Vitest + RTL + MSW) — tests AC #2, risk R-010
  - [ ] **Frontend component — P0**: clear a required field, submit → inline error message appears, no PUT called (Vitest + RTL + MSW) — tests AC #3, risk R-004
  - [ ] **Frontend component — P2**: submit edit form with 409 response → inline error "El NIT/RUC ya está registrado" on NIT field (Vitest + RTL + MSW)
  - [ ] **E2E — deferred (P1)**: edit client end-to-end → updated Nombre appears in left panel and detail view without page reload (Playwright, risk R-002)

## Dev Notes

### Architecture Context

This story wires the edit path for Epic 2's split-panel layout. It introduces:
- `PUT /api/v1/clientes/:id` backend endpoint (Application Command + Infrastructure UpdateAsync)
- `useUpdateCliente` TanStack Query mutation hook with `invalidateQueries(['clientes'])` on success
- Extended `ClienteForm` supporting both create (Story 2.3) and edit modes via optional `clienteId`/`defaultValues` props
- "Editar" button in `ClienteDetailView` that opens the form pre-filled

**Scope boundary (CRITICAL):** This story covers **edit only**. The form component is an extension of the one built in Story 2.3 — do NOT rewrite it from scratch. Add the edit-mode props while keeping the create-mode path fully functional.

**Pre-fill pattern:** Pass `defaultValues` from the loaded `ClienteDto` directly to `useForm({ defaultValues })`. React Hook Form uses these as initial values. The cancel button simply calls `onClose()` without mutation — the form instance is discarded, so the store is untouched and the original TanStack Query cache remains valid (AC: #4, risk R-009 mitigation).

**FR27 — Immediate list update:** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `useUpdateCliente`'s `onSuccess` triggers an automatic refetch of `['clientes']` (list) and, because the `onSuccess` from the form component also calls `refetch()` on the `useCliente(id)` hook, the detail panel is also updated immediately.

**Invalidation keys — both required after edit:**
```typescript
queryClient.invalidateQueries({ queryKey: ['clientes'] });        // list panel
queryClient.invalidateQueries({ queryKey: ['clientes', id] });    // detail panel (single)
```
The simplest approach: in `useUpdateCliente.onSuccess`, invalidate `['clientes']` (covers list). In the form's `onSuccess` prop handler (in `ClienteDetailView`), call the detail view's `refetch()` directly — this avoids double invalidation complexity.

**Alternative simpler pattern** (preferred for this story):
```typescript
// useUpdateCliente.ts
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ['clientes'] });
  queryClient.invalidateQueries({ queryKey: ['clientes', data.id] });
  toast.success('Cliente actualizado correctamente');
},
```
This is cleaner: the mutation hook owns all invalidation, the detail view `refetch()` call in `onSuccess` prop becomes optional.

**409 conflict handling:** Same pattern as Story 2.3. The backend catches `DbUpdateException` with PostgreSQL unique constraint code `23505` and returns 409 with Problem Details. The frontend `useUpdateCliente` mutation's `onError` is handled at component level in `ClienteForm` — `setError('nit', { message: 'El NIT/RUC ya está registrado' })`.

**MasterCrud note:** MasterCrud is NOT applicable here. The custom split-panel layout (280px left + flex right) is the established architecture for Epic 2. `ClienteForm` is a purpose-built form using React Hook Form + Zod per company standards. [Source: `2-1-client-list-search.md#Dev Notes`]

### Backend: UpdateClienteRequest and Validator

```csharp
// backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs
namespace SiesaAgents.Application.Clientes.DTOs;

public record UpdateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);
```

```csharp
// backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs
using FluentValidation;
namespace SiesaAgents.Application.Clientes.Validators;

public class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>
{
    public UpdateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Nit).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Telefono).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Ciudad).NotEmpty().MaximumLength(100);
    }
}
```

### Backend: UpdateClienteCommandHandler Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs
namespace SiesaAgents.Application.Clientes.Commands;

public record UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad);

public class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repo;
    public UpdateClienteCommandHandler(IClienteRepository repo) => _repo = repo;

    public async Task<ClienteDto?> Handle(UpdateClienteCommand command, CancellationToken ct)
    {
        var entity = await _repo.GetByIdAsync(command.Id, ct);
        if (entity is null) return null;
        entity.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await _repo.UpdateAsync(entity, ct);
        return new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad, entity.CreatedAt, entity.UpdatedAt);
    }
}
```

### Backend: ClienteEntity.Update() Domain Method

```csharp
// Add to backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public void Update(string nombre, string nit, string telefono, string ciudad)
{
    Nombre = nombre;
    Nit = nit;
    Telefono = telefono;
    Ciudad = ciudad;
    UpdatedAt = DateTimeOffset.UtcNow;
}
```

Note: `UpdatedAt` uses `DateTimeOffset` — NEVER `DateTime`. [Source: company-standards.md#Backend Critical Rules]

### Backend: PUT /api/v1/clientes/:id Endpoint

```csharp
// Add inside MapClienteEndpoints() in ClienteEndpoints.cs
group.MapPut("/{id:guid}", async (
    Guid id,
    UpdateClienteRequest request,
    UpdateClienteRequestValidator validator,
    UpdateClienteCommandHandler handler,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());

    try
    {
        var dto = await handler.Handle(
            new UpdateClienteCommand(id, request.Nombre, request.Nit, request.Telefono, request.Ciudad), ct);

        return dto is not null
            ? Results.Ok(dto)
            : Results.Problem(
                detail: "El cliente solicitado no fue encontrado.",
                statusCode: 404,
                title: "Cliente no encontrado");
    }
    catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
    {
        return Results.Problem(
            detail: "El NIT/RUC ya está registrado",
            statusCode: 409,
            title: "Conflicto de datos");
    }
});
```

`IsUniqueConstraintViolation` helper already exists from Story 2.3 in `ClienteEndpoints.cs` — reuse it.

Response shapes:
```json
// 200 OK — success
{ "id": "uuid", "nombre": "Acme S.A.", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-03-12T10:30:00Z", "updatedAt": "2026-06-28T15:00:00Z" }

// 400 — validation error (Problem Details RFC 7807)
{ "type": "https://tools.ietf.org/html/rfc7807", "title": "One or more validation errors occurred.", "status": 400, "errors": { "Nombre": ["'Nombre' must not be empty."] } }

// 404 — not found (Problem Details RFC 7807)
{ "type": "https://tools.ietf.org/html/rfc7807", "title": "Cliente no encontrado", "status": 404, "detail": "El cliente solicitado no fue encontrado." }

// 409 — NIT conflict (Problem Details RFC 7807)
{ "type": "https://tools.ietf.org/html/rfc7807", "title": "Conflicto de datos", "status": 409, "detail": "El NIT/RUC ya está registrado" }
```

### Backend: IClienteRepository — UpdateAsync extension

```csharp
// Add to backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
Task UpdateAsync(ClienteEntity entity, CancellationToken ct);
```

```csharp
// Add to backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
public async Task UpdateAsync(ClienteEntity entity, CancellationToken ct)
{
    _context.Clientes.Update(entity);
    await _context.SaveChangesAsync(ct);
}
```

### Frontend: useUpdateCliente Hook

```typescript
// frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { ClienteFormData } from './clienteSchema';
import type { Cliente } from '../domain/Cliente';

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteFormData }) =>
      clienteApiRepository.update(id, data),
    onSuccess: (updatedCliente: Cliente) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes', updatedCliente.id] });
      toast.success('Cliente actualizado correctamente');
    },
  });
};
```

**409 handling in ClienteForm (component-level):**

```typescript
// In ClienteForm.tsx — edit mode onSubmit
const onSubmit = (data: ClienteFormData) => {
  mutate({ id: clienteId!, data }, {
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setError('nit', { message: 'El NIT/RUC ya está registrado' });
      }
    },
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });
};
```

### Frontend: clienteApiRepository — update extension

```typescript
// Add to frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
update: async (id: string, data: ClienteFormData): Promise<Cliente> => {
  const response = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, data);
  return response.data;
},
```

### Frontend: ClienteForm — Edit Mode Extension

The form already accepts `onClose` and `onSuccess` props. Extend it minimally:

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
interface ClienteFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  // New props for edit mode:
  clienteId?: string;
  defaultValues?: ClienteFormData;
}

export function ClienteForm({ onClose, onSuccess, clienteId, defaultValues }: ClienteFormProps) {
  const isEditMode = !!clienteId;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues, // pre-fills when provided (edit mode)
  });

  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const { mutate, isPending } = isEditMode ? updateMutation : createMutation;

  const onSubmit = (data: ClienteFormData) => {
    const mutateArgs = isEditMode
      ? { id: clienteId, data }
      : data;

    // TypeScript: cast needed since mutate is union type
    (mutate as (args: typeof mutateArgs, options: object) => void)(mutateArgs, {
      onError: (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          setError('nit', { message: 'El NIT/RUC ya está registrado' });
        }
      },
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="cliente-form">
      {/* fields identical to create mode */}
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input id="nombre" {...register('nombre')} data-testid="input-nombre" aria-describedby="error-nombre" />
        {errors.nombre && <span role="alert" id="error-nombre">{errors.nombre.message}</span>}
      </div>
      <div>
        <label htmlFor="nit">NIT/RUC</label>
        <input id="nit" {...register('nit')} data-testid="input-nit" aria-describedby="error-nit" />
        {errors.nit && <span role="alert" id="error-nit">{errors.nit.message}</span>}
      </div>
      <div>
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" {...register('telefono')} data-testid="input-telefono" aria-describedby="error-telefono" />
        {errors.telefono && <span role="alert" id="error-telefono">{errors.telefono.message}</span>}
      </div>
      <div>
        <label htmlFor="ciudad">Ciudad</label>
        <input id="ciudad" {...register('ciudad')} data-testid="input-ciudad" aria-describedby="error-ciudad" />
        {errors.ciudad && <span role="alert" id="error-ciudad">{errors.ciudad.message}</span>}
      </div>
      <button type="button" onClick={onClose} data-testid="btn-cancel">Cancelar</button>
      <button type="submit" disabled={isPending} data-testid="btn-submit">
        {isPending
          ? (isEditMode ? 'Guardando...' : 'Creando...')
          : (isEditMode ? 'Guardar cambios' : 'Crear cliente')}
      </button>
    </form>
  );
}
```

**IMPORTANT:** The `mutate` signature differs between `useCreateCliente` (takes `ClienteFormData`) and `useUpdateCliente` (takes `{ id, data }`). If the union type cast causes TypeScript strict-mode errors, consider extracting a shared helper or using `isEditMode` as a type guard with two separate submit handlers. No `any` type allowed.

Alternative pattern without union cast complexity — preferred for strict TypeScript:

```typescript
const onSubmit = (data: ClienteFormData) => {
  if (isEditMode) {
    updateMutation.mutate({ id: clienteId, data }, {
      onError: handleError,
      onSuccess: handleSuccess,
    });
  } else {
    createMutation.mutate(data, {
      onError: handleError,
      onSuccess: handleSuccess,
    });
  }
};
```

This is cleaner and avoids type casting. Prefer this approach.

### Frontend: "Editar" Button Wiring in ClienteDetailView

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx (update)
import { useState } from 'react';
import { ClienteForm } from './ClienteForm';
import type { ClienteFormData } from '../application/clienteSchema';

// Inside the data-loaded render path:
const [isEditFormOpen, setIsEditFormOpen] = useState(false);

// Add button in the detail card header area:
<button
  onClick={() => setIsEditFormOpen(true)}
  data-testid="btn-editar"
>
  Editar
</button>

// Conditionally render the edit form (same overlay pattern as in clientes.tsx from Story 2.3):
{isEditFormOpen && (
  <div role="dialog" aria-modal="true" aria-label="Editar cliente">
    <ClienteForm
      clienteId={data.id}
      defaultValues={{
        nombre: data.nombre,
        nit: data.nit,
        telefono: data.telefono,
        ciudad: data.ciudad,
      } satisfies ClienteFormData}
      onClose={() => setIsEditFormOpen(false)}
    />
  </div>
)}
```

Use the same modal pattern (shadcn/ui Dialog or custom role="dialog") as established in Story 2.3. Match whatever pattern was used for "Nuevo cliente" in `clientes.tsx` and `clientes.$clienteId.tsx`.

### Project Structure Notes

**Files to create:**

```
backend/
├── src/
│   ├── SiesaAgents.Application/
│   │   └── Clientes/
│   │       ├── Commands/
│   │       │   ├── UpdateClienteCommand.cs           ← CREATE
│   │       │   └── UpdateClienteCommandHandler.cs    ← CREATE
│   │       ├── DTOs/
│   │       │   └── UpdateClienteRequest.cs           ← CREATE
│   │       └── Validators/
│   │           └── UpdateClienteRequestValidator.cs  ← CREATE
│   ├── SiesaAgents.Domain/
│   │   └── Clientes/
│   │       ├── Entities/ClienteEntity.cs              ← MODIFY (add Update() method)
│   │       └── Interfaces/IClienteRepository.cs       ← MODIFY (add UpdateAsync)
│   ├── SiesaAgents.Infrastructure/
│   │   └── Repositories/ClienteRepository.cs          ← MODIFY (add UpdateAsync impl)
│   └── SiesaAgents.API/
│       ├── Endpoints/ClienteEndpoints.cs               ← MODIFY (add PUT /{id:guid})
│       └── Program.cs                                  ← MODIFY (register UpdateClienteCommandHandler + validator)
└── tests/
    └── SiesaAgents.UnitTests/
        └── Clientes/
            ├── UpdateClienteApiTests.cs                ← CREATE (P1 + P2 API tests)
            └── UpdateClienteValidatorTests.cs          ← CREATE (P2 unit tests)

frontend/
└── src/
    ├── modules/crm/clientes/
    │   ├── domain/IClienteRepository.ts               ← MODIFY (add update)
    │   ├── application/useUpdateCliente.ts             ← CREATE
    │   ├── infrastructure/clienteApiRepository.ts     ← MODIFY (add update)
    │   └── presentation/
    │       ├── ClienteForm.tsx                        ← MODIFY (add edit-mode props)
    │       └── ClienteDetailView.tsx                  ← MODIFY (add Editar button + form overlay)
```

**Verify from prior stories — DO NOT recreate:**
- `clienteSchema.ts` and `ClienteFormData` type — already created in Story 2.1; shared by create and edit
- `ErrorPanel.tsx`, `EmptyState.tsx` — already created in Story 2.1; reuse
- `NotFoundPanel.tsx` — created in Story 2.2; reuse
- `apiClient.ts` — created in Story 2.1; use existing instance
- `ClienteForm.tsx` — created in Story 2.3; EXTEND with edit-mode props, do NOT rewrite
- `clienteApiRepository.ts` — created in Story 2.1, extended in Stories 2.2 and 2.3; extend again with `update`
- `IsUniqueConstraintViolation` helper — created in Story 2.3 in `ClienteEndpoints.cs`; reuse
- Toast provider (`Toaster` from sonner) — mounted in `frontend/src/main.tsx` (added in Story 2.3)

### Testing Approach

**Backend API integration tests** use `WebApplicationFactory<Program>` + existing test setup (established in Story 1.3 / 2.3). Seed a `ClienteEntity`, then test `PUT /api/v1/clientes/{id}`. Key scenarios:
- PUT with valid payload → 200 + updated `ClienteDto` (Nombre changed)
- PUT with Nombre null → 400 + Problem Details with `errors` object
- PUT with unknown UUID → 404 + Problem Details
- PUT with NIT already used by a different client → 409 + Problem Details

**Frontend component tests** use Vitest + RTL + MSW 2.x. Key scenarios:
- Render `ClienteForm` with `clienteId` + `defaultValues` → assert each input has the pre-filled value
- Modify Nombre, click Cancel → assert `onClose` called, no PUT fired (MSW asserts)
- Submit valid edit form with 200 MSW mock → toast "Cliente actualizado correctamente" visible
- Submit empty required field → inline error shown, no PUT fired
- Submit with 409 MSW mock → NIT field shows "El NIT/RUC ya está registrado"

**Key test scenarios for this story (from test-design-epic-2.md):**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E2-2-4-API-1 | API | PUT valid payload → 200 + updated ClienteDto | P1 |
| TC-E2-2-4-API-2 | API | PUT Nombre=null → 400 + Problem Details errors | P1 |
| TC-E2-2-4-API-3 | API | PUT unknown UUID → 404 + Problem Details | P1 |
| TC-E2-2-4-API-4 | API | PUT NIT conflict → 409 + Problem Details "El NIT/RUC ya está registrado" | P2 |
| TC-E2-2-4-UNIT-1 | Unit | UpdateClienteRequestValidator rejects null Nombre | P2 |
| TC-E2-2-4-UNIT-2 | Unit | UpdateClienteRequestValidator rejects null Nit | P2 |
| TC-E2-2-4-UNIT-3 | Unit | UpdateClienteRequestValidator rejects null Telefono | P2 |
| TC-E2-2-4-UNIT-4 | Unit | UpdateClienteRequestValidator rejects null Ciudad | P2 |
| TC-E2-2-4-CMP-1 | Component | ClienteForm in edit mode pre-fills all 4 fields | P1 |
| TC-E2-2-4-CMP-2 | Component | Cancel edit — original values unchanged, no PUT | P1 |
| TC-E2-2-4-CMP-3 | Component | Valid edit submit → toast "Cliente actualizado correctamente" | P2 |
| TC-E2-2-4-CMP-4 | Component | Empty required field → inline error, no PUT | P0 |
| TC-E2-2-4-CMP-5 | Component | 409 response → NIT inline error "El NIT/RUC ya está registrado" | P2 |
| TC-E2-2-4-E2E-1 | E2E | Edit client end-to-end → updated Nombre in left panel (deferred) | P1 |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `PUT /api/v1/clientes/:id` returns 200 (not 201) on success
- [ ] Response body is updated `ClienteDto` with `DateTimeOffset` fields — NEVER `DateTime`
- [ ] 409 response uses `Results.Problem(...)` with Problem Details RFC 7807 — NOT raw string
- [ ] 400 validation error uses `Results.ValidationProblem(...)` — NOT raw string
- [ ] 404 response uses `Results.Problem(...)` — NOT `Results.NotFound()` with empty body
- [ ] No stack traces in any error response (NFR6) — `ExceptionHandlingMiddleware` must remain active
- [ ] `DbUpdateException` with unique constraint code `23505` caught explicitly — NOT in middleware
- [ ] `queryClient.invalidateQueries({ queryKey: ['clientes'] })` called in `useUpdateCliente` `onSuccess` (FR27)
- [ ] `queryClient.invalidateQueries({ queryKey: ['clientes', data.id] })` also called in `useUpdateCliente` `onSuccess` (detail panel refresh)
- [ ] Toast displays exactly "Cliente actualizado correctamente" in Spanish
- [ ] Inline error on NIT field displays exactly "El NIT/RUC ya está registrado" (no technical details — NFR6)
- [ ] Form does NOT submit to backend when Zod validation fails (client-side guard)
- [ ] `ClienteForm` submit button is disabled (`disabled={isPending}`) during mutation
- [ ] Cancel button does NOT call any mutation — `onClose()` only
- [ ] `ClienteForm` in edit mode pre-fills via `useForm({ defaultValues })` — NOT via `reset()`/`setValue()` workaround
- [ ] All user-facing labels and messages in Spanish: "Editar", "Guardar cambios", "Cancelar", field labels, error messages
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `clienteSchema.ts` reused from Story 2.1 — NOT duplicated
- [ ] `ClienteForm.tsx` extended (not rewritten) — Story 2.3 create path must remain functional
- [ ] `aria-describedby` on all form inputs pointing to error span IDs (WCAG 2.1 AA — applied in Story 2.3 code review)

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4`]
- Architecture — FR6 mapping (Edit Client form + useUpdateCliente + UpdateClienteCommandHandler): [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`]
- Architecture — PUT /api/v1/clientes/{id}: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — Mutation invalidation pattern: [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture — Frontend folder structure: [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Architecture — Enforcement guidelines (DateTimeOffset, UUID, Problem Details): [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Test design — R-002 (invalidateQueries both keys), R-004 (validation divergence), R-009 (cancel keeps original data), R-010 (toast text): [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#2. Risk Assessment`]
- Test design — TC-E2-2-4 test scenarios, P1 AC edit pre-fills + cancel restores: [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Coverage Plan`]
- Company standards — FluentValidation, Minimal API, Problem Details RFC 7807: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- Company standards — React Hook Form + Zod, TanStack Query mutations: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Preceding story — ClienteForm, useCreateCliente, clienteSchema, clienteApiRepository: [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md`]
- Preceding story — ClienteDetailView, useCliente, NotFoundPanel, ErrorPanel: [Source: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md`]
- Preceding story — aria-describedby pattern (WCAG fix in code review): [Source: `_bmad-output/implementation-artifacts/2-3-create-client.md#Senior Developer Review (AI)`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
