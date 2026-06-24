# Story 2.3: Create Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1).

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created via `POST /api/v1/clientes`, the client list is updated immediately (FR27 — `invalidateQueries(['clientes'])`), **And** a toast de éxito muestra "Cliente creado correctamente".

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated (Zod + React Hook Form), **Then** clear inline error messages appear on the empty fields (FR8), **And** the form is NOT submitted to the backend.

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a 409 Conflict, **Then** an error message "El NIT/RUC ya está registrado" is displayed without exposing technical details (NFR6) — no stack trace shown.

5. **Given** the form submission is in-flight, **When** the mutation is pending, **Then** the submit button is disabled and shows a loading indicator to prevent duplicate submissions.

6. **Given** the user opens the create form and then clicks "Cancelar" or closes the form without submitting, **When** the form closes, **Then** no client is created and the client list remains unchanged.

## Tasks / Subtasks

- [x] Task 1 — Create Zod validation schema for client form (AC: #3)
  - [x] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
  - [x] Define `clienteSchema` with Zod: `nombre` (required, max 200), `nit` (required, max 50), `telefono` (required, max 30), `ciudad` (required, max 100)
  - [x] All validation error messages MUST be in Spanish (e.g., "El nombre es requerido", "El NIT/RUC es requerido", "El teléfono es requerido", "La ciudad es requerida")
  - [x] Export `ClienteFormValues` TypeScript type inferred from schema via `z.infer<typeof clienteSchema>`

- [x] Task 2 — Extend domain repository contract with create operation (AC: #2)
  - [x] Add `create(data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`

- [x] Task 3 — Implement `create` in infrastructure API repository (AC: #2)
  - [x] Add `create(data)` implementation to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
  - [x] Use `apiClient.post<Cliente>('/api/v1/clientes', data)` — returns `response.data`
  - [x] Axios throws automatically on non-2xx; let it propagate to the mutation handler

- [x] Task 4 — Create `useCreateCliente` mutation hook (AC: #2, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
  - [x] Use `useMutation` from TanStack Query with `mutationFn: clienteApiRepository.create`
  - [x] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` and `toast.success('Cliente creado correctamente')`
  - [x] `onError`: detect `AxiosError` with `status === 409` → show `toast.error('El NIT/RUC ya está registrado')`. For any other error: `toast.error('No se pudo guardar. Intenta de nuevo.')`
  - [x] Export `{ mutate, isPending, isError, error }`

- [x] Task 5 — Create `ClienteForm` presentation component (AC: #1, #3, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
  - [x] Accept props: `{ onSuccess?: () => void; onCancel?: () => void; defaultValues?: Partial<ClienteFormValues> }`
  - [x] Use `useForm<ClienteFormValues>` from React Hook Form with `zodResolver(clienteSchema)`
  - [x] Render four controlled fields: Nombre, NIT/RUC, Teléfono, Ciudad — all marked as required
  - [x] Each field: `<label>` in Spanish + `<input>` + inline error `<p>` when `fieldState.error` present
  - [x] Submit button: disabled and shows spinner (or loading text "Guardando...") when `isPending === true` from `useCreateCliente`
  - [x] "Cancelar" button: calls `onCancel()` without submitting
  - [x] `handleSubmit` calls `mutate(formValues)` → on mutation success calls `onSuccess?.()` and resets form
  - [x] Add `data-testid="cliente-form"` to form root
  - [x] Add `data-testid="field-nombre"`, `data-testid="field-nit"`, `data-testid="field-telefono"`, `data-testid="field-ciudad"` to inputs
  - [x] Add `data-testid="submit-button"` and `data-testid="cancel-button"`
  - [x] WCAG 2.1 AA: all `<input>` elements must have associated `<label>` via `htmlFor`/`id`

- [x] Task 6 — Wire form into the client list panel as a Dialog/Sheet (AC: #1, #6)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - [x] Add "Nuevo cliente" button (Heroicons `PlusIcon`) in the panel header area
  - [x] Control dialog/sheet visibility with local `useState<boolean>` (`isCreateFormOpen`)
  - [x] Render `<ClienteForm onSuccess={() => setIsCreateFormOpen(false)} onCancel={() => setIsCreateFormOpen(false)} />` inside a Dialog or Sheet from siesa-ui-kit (check siesa-ui-kit first) or shadcn/ui `Dialog` as fallback
  - [x] On `onSuccess` callback: close the form (the `invalidateQueries` in the mutation handles list refresh)
  - [x] Add `data-testid="nuevo-cliente-button"` to the trigger button

- [x] Task 7 — Backend: Create `CreateClienteCommand` and handler (AC: #2, #4)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
    - Record or class with properties: `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
    - Inject `IClienteRepository`
    - Call `ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad)`
    - Call `_repository.AddAsync(entity, ct)` then `_repository.SaveChangesAsync(ct)`
    - Return `ClienteDto` mapped from the created entity
    - If the repository throws on unique constraint (NIT duplicate), the `ExceptionHandlingMiddleware` must catch and return 409 Conflict Problem Details (implement `ConflictException` or catch `DbUpdateException` → re-throw as `ConflictException`)

- [x] Task 8 — Backend: Create `CreateClienteRequestValidator` (AC: #3, FR8)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
  - [x] Inherit `AbstractValidator<CreateClienteRequest>`
  - [x] Rules: `Nombre` (NotEmpty, MaxLength 200), `Nit` (NotEmpty, MaxLength 50), `Telefono` (NotEmpty, MaxLength 30), `Ciudad` (NotEmpty, MaxLength 100)
  - [x] Register validator in DI in `Program.cs`

- [x] Task 9 — Backend: Create `CreateClienteRequest` DTO (AC: #2)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
  - [x] Properties: `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`

- [x] Task 10 — Backend: Add `POST /api/v1/clientes` endpoint (AC: #2, #3, #4)
  - [x] Update `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
  - [x] Register `POST /api/v1/clientes` endpoint
  - [x] Validate request via `IValidator<CreateClienteRequest>` — return `400 Bad Request` (Problem Details with `errors` map) if invalid
  - [x] Dispatch `CreateClienteCommand` and return `Results.Created($"/api/v1/clientes/{result.Id}", result)` on success
  - [x] Register `CreateClienteCommandHandler` in `Program.cs` DI

- [x] Task 11 — Backend: Add `AddAsync` and `SaveChangesAsync` to `IClienteRepository` (AC: #2)
  - [x] Add `Task AddAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository` (in `Application/Clientes/Interfaces/IClienteRepository.cs` — consistent with Story 2.2 path)
  - [x] Add `Task SaveChangesAsync(CancellationToken ct)` to `IClienteRepository`
  - [x] Implement both in `ClienteRepository.cs` using EF Core `_context.Clientes.AddAsync(entity, ct)` and `_context.SaveChangesAsync(ct)`

- [x] Task 12 — Backend: Handle 409 Conflict for duplicate NIT (AC: #4)
  - [x] Add `ConflictException` to `backend/src/SiesaAgents.Domain/Exceptions/ConflictException.cs` (inherits from `Exception`)
  - [x] In `CreateClienteCommandHandler`, catch `DbUpdateException` where `InnerException` contains the `uk_clientes_nit` unique violation, re-throw as `ConflictException("El NIT/RUC ya está registrado.")`
  - [x] Update `ExceptionHandlingMiddleware.cs` to map `ConflictException` → 409 Conflict Problem Details

- [x] Task 13 — Frontend unit tests (AC: #1–#6)
  - [x] Create `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts` — test valid/invalid input scenarios (empty fields, length violations)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts` — MSW handlers for `POST /api/v1/clientes` (201 success, 409 conflict, 500 error); verify `invalidateQueries` called and correct toasts shown
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` — RTL: render, fill form, submit (success), submit with empty fields (inline errors), submit with 409 (error toast), cancel button
  - [x] All tests: Vitest + RTL + MSW; Arrange/Act/Assert; `data-testid` selectors

- [x] Task 14 — Backend unit and integration tests (AC: #2, #3, #4)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` — test: creates entity and returns DTO, throws ConflictException on duplicate NIT, validation fails (FluentValidation)
  - [x] Update `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` — add: POST 201 returns created client (camelCase JSON), POST 400 when required field missing (Problem Details), POST 409 when NIT duplicate (Problem Details)
  - [x] All tests: xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL 18-alpine (integration); Arrange/Act/Assert

## Dev Notes

### Architecture Context

This story is **full-stack** — frontend form + backend create endpoint. It builds on the split-panel layout from Stories 2.1 and 2.2. The left panel (`ClienteListView`, 280px) already exists; this story adds a "Nuevo cliente" trigger and a form dialog. The right panel remains controlled by Story 2.2's `ClienteDetailView` — no changes to it in this story.

**Critical dependencies from Stories 2.1 and 2.2:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — extend with `create()` method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — extend with `create()` implementation
- `frontend/src/modules/crm/clientes/application/useClientes.ts` — already caches `['clientes']`; `invalidateQueries` in `useCreateCliente` triggers automatic refetch
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — extend with "Nuevo cliente" button and dialog
- `frontend/src/shared/lib/apiClient.ts` — Axios singleton; use for `post()` call
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — per Story 2.2 completion notes, interface lives in `Application/Clientes/Interfaces/`, NOT in `Domain/`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — extend (do NOT recreate)
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — already exists; reuse as response DTO
- `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs` — already exists; pattern for `ConflictException`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — extend to handle `ConflictException` → 409

### MasterCrud Assessment

Story 2.3 is a **create form inside a dialog/sheet**, NOT a full CRUD grid. `MasterCrud` is designed as a full CRUD orchestrator (list + form + filters). The architecture specifies `ClienteForm.tsx` as a standalone React Hook Form + Zod component used within the panel layout. `MasterCrud` is NOT applicable here. If a future story consolidates the clientes module into a full MasterCrud grid, that would be a refactor story.

### UI Implementation Requirements (MANDATORY)

- **Component priority**: Check siesa-ui-kit catalog FIRST for Dialog/Sheet/Modal. If not available, use shadcn/ui `Dialog` (already initialized in project). Custom implementation only as last resort.
- **Form**: React Hook Form + Zod (`zodResolver`) — mandatory per company standards and architecture.md
- **Labels and errors**: All user-facing text in Spanish (labels, placeholders, error messages, button text, toast messages).
- **Icons**: Heroicons `PlusIcon` for "Nuevo cliente" button (primary icon library per standards).
- **Loading states**: Disabled submit button + inline loading indicator during mutation — no full-page spinner.
- **Toast notifications**: Use the toast system already in place from Stories 2.1/2.2 — `toast.success(...)` / `toast.error(...)`.
- **WCAG 2.1 AA**: All `<input>` elements associated with `<label>` via `htmlFor`/`id`. Form wrapped in `<form aria-label="Crear nuevo cliente">`. Submit/cancel buttons accessible via keyboard.
- **Brand colors**: Primary `#0e79fd` (Siesa Blue) via Tailwind `primary-*` tokens for primary action button.

### Frontend: Zod Schema Pattern

```typescript
// frontend/src/modules/crm/clientes/application/clienteSchema.ts
import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  nit: z.string().min(1, 'El NIT/RUC es requerido').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().min(1, 'El teléfono es requerido').max(30, 'Máximo 30 caracteres'),
  ciudad: z.string().min(1, 'La ciudad es requerida').max(100, 'Máximo 100 caracteres'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
```

### Frontend: `useCreateCliente` Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useCreateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { AxiosError } from 'axios'

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clienteApiRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
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

### Frontend: `ClienteForm` Component Pattern

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, type ClienteFormValues } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'

interface ClienteFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClienteForm({ onSuccess, onCancel }: ClienteFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
  })
  const { mutate, isPending } = useCreateCliente()

  const onSubmit = (values: ClienteFormValues) => {
    mutate(values, {
      onSuccess: () => {
        reset()
        onSuccess?.()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="Crear nuevo cliente" data-testid="cliente-form">
      {/* Nombre field */}
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" data-testid="field-nombre" {...register('nombre')} />
      {errors.nombre && <p role="alert">{errors.nombre.message}</p>}

      {/* NIT/RUC field */}
      <label htmlFor="nit">NIT/RUC</label>
      <input id="nit" data-testid="field-nit" {...register('nit')} />
      {errors.nit && <p role="alert">{errors.nit.message}</p>}

      {/* Teléfono field */}
      <label htmlFor="telefono">Teléfono</label>
      <input id="telefono" data-testid="field-telefono" {...register('telefono')} />
      {errors.telefono && <p role="alert">{errors.telefono.message}</p>}

      {/* Ciudad field */}
      <label htmlFor="ciudad">Ciudad</label>
      <input id="ciudad" data-testid="field-ciudad" {...register('ciudad')} />
      {errors.ciudad && <p role="alert">{errors.ciudad.message}</p>}

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

### Backend: `CreateClienteCommandHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs
public class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public CreateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command, CancellationToken ct)
    {
        var entity = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);

        try
        {
            await _repository.AddAsync(entity, ct);
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

### Backend: `POST /api/v1/clientes` Endpoint Pattern

```csharp
// In ClienteEndpoints.cs — add alongside existing endpoints
app.MapPost("/api/v1/clientes", async (
    CreateClienteRequest request,
    IValidator<CreateClienteRequest> validator,
    CreateClienteCommandHandler handler,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
    {
        return Results.ValidationProblem(validation.ToDictionary());
    }

    var command = new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad);
    var result = await handler.HandleAsync(command, ct);
    return Results.Created($"/api/v1/clientes/{result.Id}", result);
})
.WithName("CreateCliente")
.WithSummary("Create a new client");
```

### Backend: `ConflictException` Pattern

```csharp
// backend/src/SiesaAgents.Domain/Exceptions/ConflictException.cs
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

// In ExceptionHandlingMiddleware.cs — add case:
ConflictException ex => Results.Problem(
    statusCode: StatusCodes.Status409Conflict,
    title: "Conflict",
    detail: ex.Message),
```

### API Response Shape (from architecture.md)

```
POST /api/v1/clientes
  Request body: { "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "..." }
  → 201 Created: { "id": "uuid", "nombre": "...", "nit": "...", "telefono": "...", "ciudad": "...", "createdAt": "...", "updatedAt": "..." }
  → 400 Bad Request: Problem Details RFC 7807 { "status": 400, "title": "Validation failed", "errors": { "nombre": ["El nombre es requerido"] } }
  → 409 Conflict: Problem Details RFC 7807 { "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado." }
  → 500 Internal Server Error: Problem Details RFC 7807
```

### Testing Standards Summary

**Frontend:** Vitest + React Testing Library + MSW. MSW handlers for `POST /api/v1/clientes` covering 201, 409, 500 responses. Test `data-testid` selectors. Coverage target > 80%.

**Backend:** xUnit + EF Core InMemory (unit) + Testcontainers PostgreSQL 18-alpine (integration). All tests: Arrange / Act / Assert. Coverage target > 80%.

### Project Structure Notes

**Frontend — Files to create:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`

**Frontend — Files to modify:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `create()` signature
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — add `create()` implementation
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — add "Nuevo cliente" button + dialog

**Backend — Files to create:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.Domain/Exceptions/ConflictException.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Backend — Files to modify:**
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — add `AddAsync`, `SaveChangesAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `AddAsync`, `SaveChangesAsync`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add POST endpoint
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — handle `ConflictException` → 409
- `backend/src/SiesaAgents.API/Program.cs` — register `CreateClienteCommandHandler`, `CreateClienteRequestValidator`
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` — add POST tests

### References

- Story AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
- FR1 (campos requeridos para crear cliente), FR8 (mensajes de error inline), FR27 (cambios inmediatos): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md]
- Frontend module structure (useCreateCliente, clienteSchema, ClienteForm): [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- TanStack Query mutation pattern with `invalidateQueries`: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- REST POST endpoint contract (201, 400, 409), Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- CQRS pattern (Command + Handler + Validator): [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- Entity pattern (private ctor + static Create factory): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- DateTimeOffset, UUID PKs: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- FluentValidation mandatory on all endpoints: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- siesa-ui-kit P0 mandatory: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- Zod + React Hook Form mandatory: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- MasterCrud reference (not applicable for isolated create form): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- IClienteRepository path in `Application/Clientes/Interfaces/`: [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Dev Notes]
- ExceptionHandlingMiddleware (NotFoundException pattern): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Dev Notes]
- NFR2 (CRUD < 2s via TanStack Query invalidation), NFR5 (FluentValidation + Zod), NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- WCAG 2.1 AA: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- uk_clientes_nit unique index (PostgreSQL): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Enforcement guidelines (anti-patterns): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Used `AlertDialog` from siesa-ui-kit as dialog container for the create form (no generic Dialog/Sheet in siesa-ui-kit). Form embedded in `description` prop.
- Used `Button` and `Input` from siesa-ui-kit in `ClienteForm`.
- Added `ToastProvider` from siesa-ui-kit to `main.tsx` for toast notifications.
- `ConflictException` and `ExceptionHandlingMiddleware` already existed and handled 409 correctly — no changes needed to `ExceptionHandlingMiddleware.cs`.
- FluentValidation package added to `SiesaAgents.API.csproj` for use in endpoint.
- Pre-existing test `renders skeleton loader while data is loading (AC#7)` in `ClienteListView.test.tsx` was already failing before this story (synchronous assertion without router settling) — not introduced by this story.
- Updated siesa-ui-kit mocks in `ClienteListView.test.tsx`, `-app-shell.test.tsx`, and `app-shell-edge-cases.test.tsx` to include `Button`, `AlertDialog`, `Input`, and `toast` stubs needed by the new `ClienteListView` imports.
- Test results: 140 passed, 1 pre-existing failure.

### File List

**Frontend — Created:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**Frontend — Modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/main.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/routes/__tests__/-app-shell.test.tsx`
- `frontend/src/routes/__tests__/app-shell-edge-cases.test.tsx`

**Backend — Created:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Backend — Modified:**
- `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs`

**Other:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-3-create-client.md`
