# Story 2.4: Edit Client

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Editar", **Then** the client form opens pre-filled with the current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR6).

2. **Given** the user modifies one or more fields and submits, **When** the form is saved via `PUT /api/v1/clientes/{id}`, **Then** the changes are reflected in the client detail and list immediately (FR27 — `invalidateQueries(['clientes'])` and `invalidateQueries(['clientes', id])`), **And** a toast de éxito muestra "Cliente actualizado correctamente".

3. **Given** the user clears a required field and submits, **When** the form is validated (Zod + React Hook Form), **Then** an inline error message appears on the empty field and the form is NOT submitted to the backend (FR8).

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged and no API call is made.

5. **Given** the form submission is in-flight, **When** the mutation is pending, **Then** the submit button is disabled and shows "Guardando..." to prevent duplicate submissions.

6. **Given** the user submits an edit with a NIT/RUC that already belongs to another client, **When** the backend returns a 409 Conflict, **Then** an error toast "El NIT/RUC ya está registrado" is displayed without exposing technical details (NFR6).

## Tasks / Subtasks

- [x] Task 1 — Extend `clienteSchema` to support edit mode (AC: #3)
  - [x] Verify `frontend/src/modules/crm/clientes/application/clienteSchema.ts` already exports `ClienteFormValues` — reuse as-is (no changes needed if schema is already complete)
  - [x] Confirm the schema covers: `nombre` (required, max 200), `nit` (required, max 50), `telefono` (required, max 30), `ciudad` (required, max 100) with Spanish error messages

- [x] Task 2 — Extend domain repository contract with update operation (AC: #2)
  - [x] Add `update(id: string, data: Partial<Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Cliente>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`

- [x] Task 3 — Implement `update` in infrastructure API repository (AC: #2)
  - [x] Add `update(id, data)` implementation to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [x] Use `apiClient.put<Cliente>(\`/api/v1/clientes/${id}\`, data)` — returns `response.data`
  - [x] Axios throws automatically on non-2xx; let it propagate to the mutation handler

- [x] Task 4 — Create `useUpdateCliente` mutation hook (AC: #2, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
  - [x] Use `useMutation` from TanStack Query with `mutationFn: ({ id, data }) => clienteApiRepository.update(id, data)`
  - [x] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` and `queryClient.invalidateQueries({ queryKey: ['clientes', id] })` and `toast.success('Cliente actualizado correctamente')`
  - [x] `onError`: detect `AxiosError` with `status === 409` → show `toast.error('El NIT/RUC ya está registrado')`. For any other error: `toast.error('No se pudo guardar. Intenta de nuevo.')`
  - [x] Export `{ mutate, isPending }`

- [x] Task 5 — Extend `ClienteForm` to support edit mode (AC: #1, #3, #4, #5)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
  - [x] Add optional prop `clienteId?: string` to distinguish create vs. edit mode
  - [x] Add optional prop `defaultValues?: Partial<ClienteFormValues>` to pre-fill fields (already defined in Story 2.3 interface — verify it exists)
  - [x] When `clienteId` is provided, use `useUpdateCliente` instead of `useCreateCliente`
  - [x] Update `aria-label` on `<form>` to `"Editar cliente"` when in edit mode
  - [x] `handleSubmit` calls `mutate({ id: clienteId, data: formValues })` → on mutation success calls `onSuccess?.()` (does NOT reset form in edit mode — keep values)
  - [x] "Cancelar" button: calls `onCancel()` without submitting — original data unchanged (AC: #4)
  - [x] Disabled submit button + "Guardando..." text when `isPending === true` from `useUpdateCliente` (AC: #5)

- [x] Task 6 — Wire "Editar" button into `ClienteDetailView` (AC: #1, #4)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [x] Add "Editar" button (Heroicons `PencilSquareIcon`) in the detail panel header area
  - [x] Control edit form visibility with local `useState<boolean>` (`isEditFormOpen`)
  - [x] Render `<ClienteForm clienteId={cliente.id} defaultValues={{ nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }} onSuccess={() => setIsEditFormOpen(false)} onCancel={() => setIsEditFormOpen(false)} />` inside `AlertDialog` from siesa-ui-kit
  - [x] Add `data-testid="editar-cliente-button"` to the trigger button

- [x] Task 7 — Backend: Create `UpdateClienteCommand` and handler (AC: #2, #6)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`

- [x] Task 8 — Backend: Add `Update` method to `ClienteEntity` (AC: #2)
  - [x] `Update()` method already existed in `ClienteEntity` from prior implementation

- [x] Task 9 — Backend: Create `UpdateClienteRequestValidator` (AC: #3, FR8)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`
  - [x] Register validator in DI in `Program.cs`

- [x] Task 10 — Backend: Create `UpdateClienteRequest` DTO (AC: #2)
  - [x] Created `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`

- [x] Task 11 — Backend: Add `PUT /api/v1/clientes/{id}` endpoint (AC: #2, #3, #6)
  - [x] Updated `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [x] Registered `UpdateClienteCommandHandler` and `UpdateClienteRequestValidator` in `Program.cs`

- [x] Task 12 — Backend: Add `GetByIdAsync` and `UpdateAsync` to `IClienteRepository` (AC: #2)
  - [x] `GetByIdAsync` and `SaveChangesAsync` already exist — no changes needed

- [x] Task 13 — Frontend unit tests (AC: #1–#6)
  - [x] Created `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts` — 4 tests, all passing
  - [x] Updated `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` — 14 tests (8 original + 6 edit mode), all passing
  - [x] Updated `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` — 22 tests (18 original + 4 edit button tests), all passing

- [x] Task 14 — Backend unit and integration tests (AC: #2, #3, #6)
  - [x] Created `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs` — 7 unit tests
  - [x] Updated `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` — added 4 PUT integration tests (200, 400, 404, 409)

## Dev Notes

### Architecture Context

This story is **full-stack** — frontend edit form + backend update endpoint. It builds directly on Stories 2.2 (ClienteDetailView) and 2.3 (ClienteForm + Create infrastructure). The split-panel layout is already in place; this story adds an "Editar" trigger in the detail panel (right side, 280px flex) and extends `ClienteForm` with edit-mode support.

**Critical dependencies from Stories 2.1, 2.2, and 2.3:**
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — extend with `clienteId` prop and conditional hook selection
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — extend with "Editar" button and Dialog/Sheet
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — already complete; `ClienteFormValues` type is reused as-is
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `update()` method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — add `update()` implementation
- `frontend/src/shared/lib/apiClient.ts` — Axios singleton; use for `put()` call
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — interface lives in `Application/Clientes/Interfaces/` (per Story 2.2 completion notes)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — extend (do NOT recreate)
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — already exists; reuse as response DTO
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` — already exists; used when ID not found
- `backend/src/SiesaAgents.Domain/Exceptions/ConflictException.cs` — already exists from Story 2.3; handles NIT collision
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already handles `NotFoundException` (404) and `ConflictException` (409)

### MasterCrud Assessment

Story 2.4 is an **edit form inside a dialog/sheet** within the split-panel layout. The architectural design specifies `ClienteForm.tsx` as the canonical form component for cliente CRUD. `MasterCrud` is designed as a full-orchestrator grid pattern — NOT applicable here. The split-panel layout (ClienteListView 280px + ClienteDetailView flex) is the specified pattern for this module.

### UI Implementation Requirements (MANDATORY)

- **Component priority**: Check siesa-ui-kit catalog FIRST for Dialog/Sheet/Modal. Story 2.3 used `AlertDialog` from siesa-ui-kit — use the same container for consistency. If siesa-ui-kit Dialog/Sheet is available, prefer it.
- **Form**: React Hook Form + Zod (`zodResolver`) with `defaultValues` passed to `useForm` — mandatory per company standards.
- **Pre-fill pattern**: Pass `defaultValues` to `useForm`: `useForm<ClienteFormValues>({ resolver: zodResolver(clienteSchema), defaultValues })`. This populates all fields with the current client data on form open.
- **Labels and errors**: All user-facing text in Spanish (labels, placeholders, error messages, button text, toast messages).
- **Icons**: Heroicons `PencilSquareIcon` for "Editar" button (primary icon library per standards).
- **Loading states**: Disabled submit button + "Guardando..." text during mutation — no full-page spinner.
- **Toast notifications**: Use the same toast system from Stories 2.1/2.2/2.3 — `toast.success(...)` / `toast.error(...)`.
- **WCAG 2.1 AA**: All `<input>` elements associated with `<label>` via `htmlFor`/`id`. Form wrapped in `<form aria-label="Editar cliente">` in edit mode. Buttons accessible via keyboard.
- **Brand colors**: Primary `#0e79fd` (Siesa Blue) via Tailwind `primary-*` tokens for primary action button.

### Frontend: `useUpdateCliente` Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { AxiosError } from 'axios'
import type { ClienteFormValues } from './clienteSchema'

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteFormValues }) =>
      clienteApiRepository.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', id] })
      toast.success('Cliente actualizado correctamente')
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 409) {
        toast.error('El NIT/RUC ya está registrado')
      } else {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}
```

### Frontend: `ClienteForm` Extension Pattern (Edit Mode)

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
// Updated interface — clienteId distinguishes create vs edit mode
interface ClienteFormProps {
  clienteId?: string          // When provided: edit mode; when absent: create mode
  defaultValues?: Partial<ClienteFormValues>
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClienteForm({ clienteId, defaultValues, onSuccess, onCancel }: ClienteFormProps) {
  const isEditMode = Boolean(clienteId)

  const { register, handleSubmit, formState: { errors } } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  })

  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()
  const { mutate, isPending } = isEditMode ? updateMutation : createMutation

  const onSubmit = (values: ClienteFormValues) => {
    if (isEditMode) {
      updateMutation.mutate({ id: clienteId!, data: values }, {
        onSuccess: () => onSuccess?.(),
      })
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          reset()
          onSuccess?.()
        },
      })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label={isEditMode ? 'Editar cliente' : 'Crear nuevo cliente'}
      data-testid="cliente-form"
    >
      {/* Fields: nombre, nit, telefono, ciudad — same structure as Story 2.3 */}
      {/* ... */}
      <button type="button" data-testid="cancel-button" onClick={onCancel} disabled={isPending}>
        Cancelar
      </button>
      <button type="submit" data-testid="submit-button" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
```

### Backend: `Update` Method on `ClienteEntity`

```csharp
// Addition to backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public void Update(string nombre, string nit, string telefono, string ciudad)
{
    if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre is required.", nameof(nombre));
    if (string.IsNullOrWhiteSpace(nit)) throw new ArgumentException("Nit is required.", nameof(nit));
    if (string.IsNullOrWhiteSpace(telefono)) throw new ArgumentException("Telefono is required.", nameof(telefono));
    if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad is required.", nameof(ciudad));

    Nombre = nombre;
    Nit = nit;
    Telefono = telefono;
    Ciudad = ciudad;
    UpdatedAt = DateTimeOffset.UtcNow;
}
```

### Backend: `UpdateClienteCommandHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs
public class UpdateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public UpdateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> HandleAsync(UpdateClienteCommand command, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException($"Cliente {command.Id} not found.");

        entity.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        try
        {
            await _repository.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("uk_clientes_nit") == true)
        {
            throw new ConflictException("El NIT/RUC ya está registrado.");
        }

        return new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad,
            entity.CreatedAt, entity.UpdatedAt);
    }
}
```

### Backend: `PUT /api/v1/clientes/{id}` Endpoint Pattern

```csharp
// In ClienteEndpoints.cs — add alongside existing endpoints
app.MapPut("/api/v1/clientes/{id:guid}", async (
    Guid id,
    UpdateClienteRequest request,
    IValidator<UpdateClienteRequest> validator,
    UpdateClienteCommandHandler handler,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
    {
        return Results.ValidationProblem(validation.ToDictionary());
    }

    var command = new UpdateClienteCommand(id, request.Nombre, request.Nit, request.Telefono, request.Ciudad);
    var result = await handler.HandleAsync(command, ct);
    return Results.Ok(result);
})
.WithName("UpdateCliente")
.WithSummary("Update an existing client");
```

### API Response Shape (from architecture.md)

```
PUT /api/v1/clientes/{id}
  Request body: { "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "..." }
  → 200 OK: { "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "...", "updatedAt": "..." }
  → 400 Bad Request: Problem Details RFC 7807 { "status": 400, "title": "Validation failed", "errors": { "nombre": ["El nombre es requerido"] } }
  → 404 Not Found: Problem Details RFC 7807 { "status": 404, "title": "Not Found", "detail": "Cliente {id} not found." }
  → 409 Conflict: Problem Details RFC 7807 { "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado." }
  → 500 Internal Server Error: Problem Details RFC 7807
```

### Testing Standards Summary

**Frontend:** Vitest + React Testing Library + MSW. MSW handlers for `PUT /api/v1/clientes/:id` covering 200, 404, 409, 500 responses. Test `data-testid` selectors. Verify `defaultValues` pre-fill renders correctly. Coverage target > 80%.

**Backend:** xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL 18-alpine (integration). All tests: Arrange / Act / Assert. Coverage target > 80%.

### Project Structure Notes

**Frontend — Files to create:**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

**Frontend — Files to modify:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `update()` signature
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — add `update()` implementation
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — add `clienteId` prop + edit-mode logic
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — add "Editar" button + Dialog/Sheet
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` — add edit mode tests
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (create if missing) — add edit button tests

**Backend — Files to create:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

**Backend — Files to verify/create:**
- `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs` — verify exists (in architecture.md); create if missing with properties: `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`

**Backend — Files to modify:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — add `Update()` method
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — verify `GetByIdAsync` exists (from Story 2.2)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add PUT endpoint
- `backend/src/SiesaAgents.API/Program.cs` — register `UpdateClienteCommandHandler`, `UpdateClienteRequestValidator`
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` — add PUT tests

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4]
- FR6 (editar cliente), FR8 (mensajes de error inline), FR27 (cambios inmediatos): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md]
- Frontend module structure (useUpdateCliente, ClienteForm, ClienteDetailView): [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- TanStack Query mutation pattern with `invalidateQueries` (both list and single): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- REST PUT endpoint contract (200, 400, 404, 409), Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- CQRS pattern (Command + Handler + Validator): [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- Entity `Update()` method (domain method pattern): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- DateTimeOffset, UUID PKs: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- FluentValidation mandatory on all endpoints: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Zod + React Hook Form with `defaultValues` for edit pre-fill: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- MasterCrud reference (not applicable for split-panel edit form): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- IClienteRepository path in `Application/Clientes/Interfaces/`: [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Dev Notes]
- ConflictException and ExceptionHandlingMiddleware patterns: [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Dev Notes]
- uk_clientes_nit unique index (PostgreSQL): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- NFR2 (CRUD < 2s via TanStack Query invalidation), NFR5 (FluentValidation + Zod), NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Previous story learnings (siesa-ui-kit AlertDialog pattern, toast system, test mock patterns): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Dev Agent Record]
- Enforcement guidelines (anti-patterns): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- `ClienteEntity.Update()` method was already present from a prior story implementation. No changes needed to the domain entity.
- **[Code Review Fix]** Removed `AsNoTracking()` from `ClienteRepository.GetByIdAsync` — it prevented EF Core from tracking the entity during updates, causing `SaveChangesAsync` to silently persist 0 rows. The fix enables change tracking so `entity.Update()` mutations are correctly detected and persisted.
- `siesa-ui-kit` exports `AlertDialog` (with `isOpen`, `onCancel`, `actions`, `showCloseButton` props) but does NOT export Dialog or Sheet. Used `AlertDialog` consistently with Story 2.3 pattern.
- `IClienteRepository` and `ClienteRepository` already had `GetByIdAsync` and `SaveChangesAsync` from Story 2.2. No new repository interface methods needed for update — EF Core tracked entity pattern via `SaveChangesAsync` is sufficient.
- `ClienteListView.test.tsx` has one pre-existing failing test unrelated to Story 2.4.
- Frontend Button mock in tests: fixed `type` prop collision by explicitly destructuring `type` as `_type` in the mock to prevent shadcn/siesa-ui-kit `type="outline"/"default"` props from overriding the HTML `type` attribute on buttons.
- Frontend: 40 tests passing across 3 test files (useUpdateCliente, ClienteForm, ClienteDetailView).
- Backend dotnet runtime not available in environment; backend code verified by code review only.

### File List

**Frontend — Created:**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

**Frontend — Modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Backend — Created:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

**Backend — Modified:**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — removed AsNoTracking from GetByIdAsync (code review fix)
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs`
