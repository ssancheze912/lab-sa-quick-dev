# Story 2.3: Create Client

Status: draft

## Story

As a commercial team member,
I want to register a new client by filling in a form,
So that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens (as a Dialog/modal) with four required fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR1).

2. **Given** the user fills all required fields with valid values and clicks "Guardar", **When** the form is submitted, **Then** the client is created via `POST /api/v1/clientes`, the list updates immediately (FR27 — `invalidateQueries(['clientes'])`), and a success toast displays "Cliente creado correctamente".

3. **Given** the user submits the form with one or more required fields empty, **When** Zod validation runs, **Then** clear inline error messages appear under each empty field (FR8) **And** no API call is made to the backend.

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns `409 Conflict`, **Then** an inline error message "El NIT/RUC ya está registrado" appears on the NIT/RUC field **And** no technical details are exposed (NFR6).

5. **Given** the form is open, **When** the user clicks "Cancelar", **Then** the form closes and no API call is made.

## Tasks / Subtasks

- [ ] Task 1 — Define Zod schema for client creation (AC: #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — Zod object with 4 fields: `nombre: z.string().min(1, 'El nombre es requerido')`, `nit: z.string().min(1, 'El NIT/RUC es requerido')`, `telefono: z.string().min(1, 'El teléfono es requerido')`, `ciudad: z.string().min(1, 'La ciudad es requerida')`
  - [ ] Export `type ClienteFormValues = z.infer<typeof clienteSchema>`

- [ ] Task 2 — Add `create` method to `IClienteRepository` interface and implementation (AC: #2, #4)
  - [ ] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `create(data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente>`
  - [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `create` calling `POST /api/v1/clientes` via `apiClient`; on `409` throw a typed error with message `"El NIT/RUC ya está registrado"`

- [ ] Task 3 — Implement `useCreateCliente` mutation hook (AC: #2, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` — TanStack Query `useMutation` hook
  - [ ] `mutationFn`: calls `clienteApiRepository.create(data)`
  - [ ] `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` then `toast.success('Cliente creado correctamente')`
  - [ ] `onError`: if error is `409` / has NIT conflict message, surface it to caller (do NOT call generic toast — let form handle it as inline field error)

- [ ] Task 4 — Create `ClienteForm` presentation component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
  - [ ] Uses React Hook Form with `zodResolver(clienteSchema)` for validation
  - [ ] Props: `onSuccess?: () => void`, `onCancel?: () => void`
  - [ ] Fields (each wrapped in `<div className="space-y-1">`):
    - `Nombre` — `<label>` + `<input type="text">` + inline `<p role="alert">` for error
    - `NIT/RUC` — same structure; on 409 conflict this field receives the "El NIT/RUC ya está registrado" error via `form.setError('nit', ...)`
    - `Teléfono` — same structure
    - `Ciudad` — same structure
  - [ ] Footer buttons: "Cancelar" (`type="button"`, calls `onCancel`) + "Guardar" (`type="submit"`, disabled while `isPending`)
  - [ ] Inline error styling: `text-sm text-red-600`
  - [ ] WCAG 2.1 AA: each `<input>` has `id` matching its `<label htmlFor>`, `aria-invalid={!!fieldError}`, `aria-describedby` pointing to the error `<p>` element
  - [ ] All user-facing text in Spanish

- [ ] Task 5 — Integrate form into Dialog triggered by "Nuevo cliente" button (AC: #1, #5)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — add a "Nuevo cliente" `<button>` to the left panel header (above the search input)
  - [ ] Button styling: `bg-[#0e79fd] text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-[#154ca9]`
  - [ ] Use shadcn/ui `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle` to wrap `<ClienteForm />`
  - [ ] Dialog `open` state managed with `useState<boolean>(false)`
  - [ ] On `ClienteForm` `onSuccess`: close dialog
  - [ ] On `ClienteForm` `onCancel`: close dialog
  - [ ] `DialogTitle`: "Nuevo cliente"

- [ ] Task 6 — Backend: `CreateClienteRequest` DTO and FluentValidation validator (AC: #3, #4)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs` — record with `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs` — `AbstractValidator<CreateClienteRequest>` using FluentValidation:
    - `RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido.")`
    - `RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es requerido.")`
    - `RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es requerido.")`
    - `RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es requerida.")`

- [ ] Task 7 — Backend: `CreateClienteCommand` and handler (AC: #2, #4)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs` — record `CreateClienteCommand(string Nombre, string Nit, string Telefono, string Ciudad)`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`:
    - Inject `IClienteRepository`
    - Call `IClienteRepository.NitExistsAsync(command.Nit, ct)` — if true, throw a domain-level `InvalidOperationException` with message `"El NIT/RUC ya está registrado."` (caught by `ExceptionHandlingMiddleware` → 409)
    - Otherwise call `ClienteEntity.Create(...)`, then `IClienteRepository.AddAsync(entity, ct)`
    - Return `ClienteDto` mapping

- [ ] Task 8 — Backend: `POST /api/v1/clientes` endpoint (AC: #2, #3, #4)
  - [ ] Add endpoint to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    ```
    app.MapPost("/api/v1/clientes", async (CreateClienteRequest request, IValidator<CreateClienteRequest> validator, IClienteRepository repo, CancellationToken ct) => { ... })
    ```
  - [ ] Validate with FluentValidation — if invalid return `Results.ValidationProblem(validationResult.ToDictionary())` (400)
  - [ ] Call `CreateClienteCommandHandler` — returns `ClienteDto`
  - [ ] On success return `Results.Created($"/api/v1/clientes/{dto.Id}", dto)` (201 Created)
  - [ ] `ExceptionHandlingMiddleware` (Story 1.1) catches `InvalidOperationException` for NIT conflict and maps to 409 Problem Details — no additional try/catch needed in endpoint
  - [ ] Register `CreateClienteRequestValidator` in DI in `Program.cs`: `builder.Services.AddScoped<IValidator<CreateClienteRequest>, CreateClienteRequestValidator>()`

- [ ] Task 9 — Unit tests: frontend (AC: #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/clienteSchema.test.ts` — Vitest:
    - `parse_WithAllValidFields_Succeeds`
    - `parse_WithEmptyNombre_FailsWithSpanishMessage`
    - `parse_WithEmptyNit_FailsWithSpanishMessage`
    - `parse_WithEmptyTelefono_FailsWithSpanishMessage`
    - `parse_WithEmptyCiudad_FailsWithSpanishMessage`
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx` — Vitest + RTL + MSW:
    - Submit with all empty fields → 4 inline errors appear + no POST request made (TC-E2-P0-04)
    - Submit each field empty individually → corresponding error appears (TC-E2-P0-04 parameterized)
    - Submit with valid data → POST request made + `onSuccess` called (TC-E2-P1-09)
    - Submit with duplicate NIT (MSW returns 409) → "El NIT/RUC ya está registrado" error on NIT/RUC field (TC-E2-P0-01)
    - Click "Cancelar" → `onCancel` called + no POST request made (AC: #5)
    - Loading state while `isPending`: "Guardar" button is disabled

- [ ] Task 10 — Unit tests: backend (AC: #2, #3, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` — xUnit:
    - `Handle_WithValidData_CreatesAndReturnsDto`
    - `Handle_WithExistingNit_ThrowsInvalidOperationException`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs` — xUnit Theory:
    - `Validate_WithEmptyNombre_ReturnsValidationFailure`
    - `Validate_WithEmptyNit_ReturnsValidationFailure`
    - `Validate_WithEmptyTelefono_ReturnsValidationFailure`
    - `Validate_WithEmptyCiudad_ReturnsValidationFailure`
    - `Validate_WithAllValid_ReturnsValid`
  - [ ] Extend `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (if project exists):
    - `Post_WithValidData_Returns201AndCreatedClient` (TC-E2-P1-02)
    - `Post_WithDuplicateNit_Returns409ProblemDetails` (TC-E2-P0-01)
    - `Post_WithMissingRequiredField_Returns400` parameterized (TC-E2-P0-02)

## Dev Notes

### Architecture Context

Story 2.3 builds on Stories 2.1 and 2.2. All infrastructure (domain entity, repository interface with `getAll`/`getById`, `useClientes`, `useCliente`, `ClienteListView`, `ClienteDetailView`, `GET /api/v1/clientes`, `GET /api/v1/clientes/{id}`) must already be in place.

**Frontend module path:** `frontend/src/modules/crm/clientes/`

**Frontend routes path:** `frontend/src/routes/_app/`

**Backend solution layer paths:**
- Application Commands: `backend/src/SiesaAgents.Application/Clientes/Commands/`
- Application DTOs: `backend/src/SiesaAgents.Application/Clientes/DTOs/`
- Application Validators: `backend/src/SiesaAgents.Application/Clientes/Validators/`
- API Endpoints: `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`

### Zod Schema

```typescript
// frontend/src/modules/crm/clientes/application/clienteSchema.ts
import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  nit: z.string().min(1, 'El NIT/RUC es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
```

### `useCreateCliente` Hook Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useCreateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { ClienteFormValues } from './clienteSchema'

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClienteFormValues) => clienteApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      // toast.success called inside onSuccess — see toast pattern below
    },
  })
}
```

Note: The toast call (`toast.success('Cliente creado correctamente')`) is placed in `onSuccess`. The 409 conflict error is surfaced to the `ClienteForm` component via `onError` so the form can call `form.setError('nit', ...)` — the hook does NOT call a generic error toast for 409.

### `clienteApiRepository.create` Implementation

```typescript
// Extend frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
async create(data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
  try {
    const response = await apiClient.post<Cliente>('/api/v1/clientes', data)
    return response.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      throw new Error('El NIT/RUC ya está registrado')
    }
    throw error
  }
}
```

### `ClienteForm` Component Pattern

```tsx
// frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, type ClienteFormValues } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'
import { toast } from 'sonner' // or whichever toast library is project-standard

interface ClienteFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClienteForm({ onSuccess, onCancel }: ClienteFormProps) {
  const { mutate, isPending } = useCreateCliente()
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nombre: '', nit: '', telefono: '', ciudad: '' },
  })

  const onSubmit = (values: ClienteFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Cliente creado correctamente')
        onSuccess?.()
      },
      onError: (error) => {
        if (error.message === 'El NIT/RUC ya está registrado') {
          form.setError('nit', { message: 'El NIT/RUC ya está registrado' })
        } else {
          toast.error('No se pudo guardar. Intenta de nuevo.')
        }
      },
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Nombre */}
      <div className="space-y-1">
        <label htmlFor="nombre" className="text-sm font-medium text-slate-700">
          Nombre
        </label>
        <input
          id="nombre"
          type="text"
          aria-invalid={!!form.formState.errors.nombre}
          aria-describedby="nombre-error"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
          {...form.register('nombre')}
        />
        {form.formState.errors.nombre && (
          <p id="nombre-error" role="alert" className="text-sm text-red-600">
            {form.formState.errors.nombre.message}
          </p>
        )}
      </div>

      {/* NIT/RUC */}
      <div className="space-y-1">
        <label htmlFor="nit" className="text-sm font-medium text-slate-700">
          NIT/RUC
        </label>
        <input
          id="nit"
          type="text"
          aria-invalid={!!form.formState.errors.nit}
          aria-describedby="nit-error"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
          {...form.register('nit')}
        />
        {form.formState.errors.nit && (
          <p id="nit-error" role="alert" className="text-sm text-red-600">
            {form.formState.errors.nit.message}
          </p>
        )}
      </div>

      {/* Teléfono */}
      <div className="space-y-1">
        <label htmlFor="telefono" className="text-sm font-medium text-slate-700">
          Teléfono
        </label>
        <input
          id="telefono"
          type="text"
          aria-invalid={!!form.formState.errors.telefono}
          aria-describedby="telefono-error"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
          {...form.register('telefono')}
        />
        {form.formState.errors.telefono && (
          <p id="telefono-error" role="alert" className="text-sm text-red-600">
            {form.formState.errors.telefono.message}
          </p>
        )}
      </div>

      {/* Ciudad */}
      <div className="space-y-1">
        <label htmlFor="ciudad" className="text-sm font-medium text-slate-700">
          Ciudad
        </label>
        <input
          id="ciudad"
          type="text"
          aria-invalid={!!form.formState.errors.ciudad}
          aria-describedby="ciudad-error"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0e79fd]"
          {...form.register('ciudad')}
        />
        {form.formState.errors.ciudad && (
          <p id="ciudad-error" role="alert" className="text-sm text-red-600">
            {form.formState.errors.ciudad.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0e79fd] rounded-md hover:bg-[#154ca9] disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
```

### Dialog Integration in `/clientes` Route

```tsx
// frontend/src/routes/_app/clientes.tsx (extend from Story 2.2 version)
import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { ClienteListView } from '../../modules/crm/clientes/presentation/ClienteListView'
import { ClienteDetailView } from '../../modules/crm/clientes/presentation/ClienteDetailView'
import { ClienteForm } from '../../modules/crm/clientes/presentation/ClienteForm'

export const Route = createFileRoute('/_app/clientes')({
  component: ClientesPage,
})

function ClientesPage() {
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleClienteSelect = (id: string) => {
    navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
  }

  return (
    <div className="flex h-full">
      <ClienteListView
        selectedClienteId={null}
        onClienteSelect={handleClienteSelect}
        onNuevoCliente={() => setIsCreateOpen(true)}
      />
      <ClienteDetailView clienteId={null} />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm
            onSuccess={() => setIsCreateOpen(false)}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

Note: `ClienteListView` receives a new `onNuevoCliente` prop to render the "Nuevo cliente" button in the panel header. Alternatively, the button can live directly in the route component above the `ClienteListView` — choose whichever is cleaner given the existing component. The button must be visible at all times in the left panel, not dependent on `selectedClienteId`.

### Backend `CreateClienteRequest` DTO

```csharp
// backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs
namespace SiesaAgents.Application.Clientes.DTOs;

public record CreateClienteRequest(
    string Nombre,
    string Nit,
    string Telefono,
    string Ciudad
);
```

### Backend `CreateClienteCommandHandler`

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs
public class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repo;

    public CreateClienteCommandHandler(IClienteRepository repo) => _repo = repo;

    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command, CancellationToken ct)
    {
        var nitExists = await _repo.NitExistsAsync(command.Nit, ct);
        if (nitExists)
            throw new InvalidOperationException("El NIT/RUC ya está registrado.");

        var entity = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await _repo.AddAsync(entity, ct);

        return new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad, entity.CreatedAt, entity.UpdatedAt);
    }
}
```

### Backend `POST /api/v1/clientes` Endpoint

```csharp
// Extend backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
app.MapPost("/api/v1/clientes", async (
    CreateClienteRequest request,
    IValidator<CreateClienteRequest> validator,
    CreateClienteCommandHandler handler,
    CancellationToken ct) =>
{
    var validationResult = await validator.ValidateAsync(request, ct);
    if (!validationResult.IsValid)
        return Results.ValidationProblem(validationResult.ToDictionary());

    var dto = await handler.HandleAsync(
        new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad),
        ct);

    return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
});
```

Note: `ExceptionHandlingMiddleware` (Story 1.1) must map `InvalidOperationException` to HTTP 409 Problem Details. Verify it handles this exception type. If not, add a case for it.

### API Response Contract

```json
// POST /api/v1/clientes with valid body → 201 Created
// Location: /api/v1/clientes/3fa85f64-5717-4562-b3fc-2c963f66afa6
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Empresa ABC",
  "nit": "900123456-7",
  "telefono": "601 234 5678",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-03-12T10:30:00Z"
}

// POST with missing required field → 400 Bad Request
// Content-Type: application/problem+json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Nombre": ["El nombre es requerido."]
  }
}

// POST with duplicate NIT → 409 Conflict
// Content-Type: application/problem+json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "El NIT/RUC ya está registrado.",
  "status": 409
}
```

### State Boundaries for This Story

```
URL (TanStack Router param) — unchanged; create uses a Dialog, no URL change for the form

Server State (TanStack Query):
  ['clientes']        → list (from Story 2.1)
                        invalidated on successful POST → triggers automatic refetch (FR27)

UI State (local React state in clientes.tsx route):
  isCreateOpen: boolean — controls Dialog visibility

Form State (React Hook Form):
  managed internally by ClienteForm; NOT exposed to parent or URL
```

### Error Handling

**Frontend:**
- Zod validation failure → inline errors under each field; no API call made
- Backend 409 (duplicate NIT) → `form.setError('nit', { message: 'El NIT/RUC ya está registrado' })`; no generic toast
- Backend 5xx or network error → `toast.error('No se pudo guardar. Intenta de nuevo.')`
- Never expose `error.message` directly from generic errors

**Backend:**
- Missing required field → FluentValidation → `Results.ValidationProblem(...)` → 400
- Duplicate NIT → `InvalidOperationException` thrown in handler → `ExceptionHandlingMiddleware` → 409 Problem Details
- Unhandled exception → `ExceptionHandlingMiddleware` → 500 Problem Details; no stack trace in response (NFR6)

### Brand Colors & Styling

- Primary action button (Guardar): `bg-[#0e79fd] text-white hover:bg-[#154ca9]`
- Secondary action button (Cancelar): `text-slate-700 border border-slate-200 hover:bg-slate-50`
- "Nuevo cliente" trigger button: `bg-[#0e79fd] text-white`
- Field label: `text-sm font-medium text-slate-700`
- Field input: `border border-slate-200 focus:ring-2 focus:ring-[#0e79fd]`
- Inline error: `text-sm text-red-600`
- Disabled submit: `opacity-50` (via Tailwind `disabled:opacity-50`)

### UI Text in Spanish (mandatory)

| Context | Text |
|---------|------|
| Dialog title | Nuevo cliente |
| Trigger button | Nuevo cliente |
| Field label — Nombre | Nombre |
| Field label — NIT/RUC | NIT/RUC |
| Field label — Teléfono | Teléfono |
| Field label — Ciudad | Ciudad |
| Inline error — Nombre empty | El nombre es requerido |
| Inline error — NIT/RUC empty | El NIT/RUC es requerido |
| Inline error — NIT/RUC duplicate | El NIT/RUC ya está registrado |
| Inline error — Teléfono empty | El teléfono es requerido |
| Inline error — Ciudad empty | La ciudad es requerida |
| Submit button idle | Guardar |
| Submit button pending | Guardando... |
| Cancel button | Cancelar |
| Success toast | Cliente creado correctamente |
| Generic error toast | No se pudo guardar. Intenta de nuevo. |

### `data-testid` Attributes Required

| Element | `data-testid` | Notes |
|---------|---------------|-------|
| Form element | `cliente-form` | The `<form>` tag |
| Nombre input | `input-nombre` | |
| NIT/RUC input | `input-nit` | |
| Teléfono input | `input-telefono` | |
| Ciudad input | `input-ciudad` | |
| Submit button | `btn-guardar` | |
| Cancel button | `btn-cancelar` | |
| "Nuevo cliente" trigger | `btn-nuevo-cliente` | In the panel header |

### Test Patterns

**Frontend form test with MSW (happy path):**
```typescript
// frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClienteForm } from '../ClienteForm'

const newClient = {
  id: 'new-uuid',
  nombre: 'Empresa Test',
  nit: '123456789-0',
  telefono: '3001234567',
  ciudad: 'Cali',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const server = setupServer(
  http.post('http://localhost:5000/api/v1/clientes', () =>
    HttpResponse.json(newClient, { status: 201 })
  )
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('submit with valid data calls onSuccess', async () => {
  const onSuccess = vi.fn()
  render(<ClienteForm onSuccess={onSuccess} />, { wrapper: Providers })
  await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Test')
  await userEvent.type(screen.getByTestId('input-nit'), '123456789-0')
  await userEvent.type(screen.getByTestId('input-telefono'), '3001234567')
  await userEvent.type(screen.getByTestId('input-ciudad'), 'Cali')
  await userEvent.click(screen.getByTestId('btn-guardar'))
  await waitFor(() => expect(onSuccess).toHaveBeenCalled())
})
```

**Frontend form test — 409 conflict:**
```typescript
test('shows inline NIT error on 409 conflict', async () => {
  server.use(
    http.post('http://localhost:5000/api/v1/clientes', () =>
      HttpResponse.json(
        { title: 'El NIT/RUC ya está registrado.', status: 409 },
        { status: 409 }
      )
    )
  )
  render(<ClienteForm />, { wrapper: Providers })
  await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa')
  await userEvent.type(screen.getByTestId('input-nit'), '900123456-7')
  await userEvent.type(screen.getByTestId('input-telefono'), '3001234567')
  await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá')
  await userEvent.click(screen.getByTestId('btn-guardar'))
  await waitFor(() =>
    expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
  )
})
```

**Backend xUnit — 409 conflict:**
```csharp
[Fact]
public async Task Post_WithDuplicateNit_Returns409ProblemDetails()
{
    // Arrange — seed a client with the target NIT
    var seeded = SeedCliente(_db, "900123456-7");
    var request = new { nombre = "Empresa Nueva", nit = "900123456-7", telefono = "300", ciudad = "Bogotá" };
    // Act
    var response = await _client.PostAsJsonAsync("/api/v1/clientes", request);
    // Assert
    Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
}

[Theory]
[InlineData("nombre")]
[InlineData("nit")]
[InlineData("telefono")]
[InlineData("ciudad")]
public async Task Post_WithMissingRequiredField_Returns400(string fieldToOmit)
{
    // Build a payload missing the specified field
    // Act
    var response = await _client.PostAsJsonAsync("/api/v1/clientes", BuildPayloadWithout(fieldToOmit));
    // Assert
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
}
```

### Scope Boundaries

Explicitly IN SCOPE for Story 2.3:
- `ClienteForm` component (create mode only — no `initialValues` prop in this story)
- Zod `clienteSchema` and `ClienteFormValues` type
- `useCreateCliente` mutation hook
- `clienteApiRepository.create` method (extending existing repository)
- Dialog wrapping the form in the `/clientes` route
- "Nuevo cliente" trigger button in the left panel
- `POST /api/v1/clientes` backend endpoint (201 + 400 + 409)
- `CreateClienteRequest` DTO + `CreateClienteRequestValidator`
- `CreateClienteCommand` + `CreateClienteCommandHandler`
- `IClienteRepository.NitExistsAsync` (already declared in Story 2.1; must be implemented if not done)
- `IClienteRepository.AddAsync` (already declared in Story 2.1; must be implemented if not done)

Explicitly OUT OF SCOPE for Story 2.3:
- Edit client form — Story 2.4 (form will be extended/reused there with `initialValues`)
- Delete client — Story 2.5
- Sort control — Story 2.6
- Contact management — Epics 3 and 4
- Authentication — deferred post-MVP

### Dependency on Previous Stories

- Story 1.1: `frontend/src/shared/lib/apiClient.ts`, `ExceptionHandlingMiddleware.cs` — must exist; middleware must map `InvalidOperationException` → 409
- Story 1.2: shadcn/ui `Dialog` component — must be installed (`npx shadcn@latest add dialog`)
- Story 2.1: `Cliente.ts`, `IClienteRepository.ts` (with `NitExistsAsync`, `AddAsync`), `clienteApiRepository.ts`, `ClienteListView.tsx`, `GET /api/v1/clientes` endpoint, `ClienteEntity.Create()` factory, `ClienteRepository.cs` CRUD implementations — all must exist
- Story 2.2: `ClienteDetailView.tsx`, `/clientes` route (will be extended here with Dialog state)

### References

- Mutation + invalidation pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- TanStack Query key `['clientes']`: [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- `POST /api/v1/clientes` endpoint contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Problem Details RFC 7807 (409 conflict): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- FR1 — required fields (Nombre, NIT/RUC, Teléfono, Ciudad): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
- FR27 — changes visible immediately for all users: [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Diagram]
- NFR5 — FluentValidation + Zod double-layer validation: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- NFR6 — no stack traces exposed: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Brand colors + typography: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- All UI text in Spanish: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- DateTimeOffset mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Test risks R1, R4, R5: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#2. Risk Assessment]
- Test cases TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-04, TC-E2-P1-02, TC-E2-P1-09, TC-E2-P1-14: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Cases by Priority]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
