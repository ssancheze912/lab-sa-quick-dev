# Story 2.4: Edit Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail in the right panel, **When** the user clicks the "Editar" button, **Then** the same `ClienteForm` component (already built in Story 2.3) opens inside a shadcn `Dialog` modal pre-filled with the current values: Nombre, NIT/RUC, Teléfono, Ciudad. **And** `autoFocus` is set on the Nombre field. **And** the dialog title shows `"Editar cliente"`.

2. **Given** the user modifies one or more fields and clicks "Guardar", **When** the form is submitted, **Then** `PUT /api/v1/clientes/{id}` is called with the updated data. **And** on success the modal closes. **And** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` and `queryClient.invalidateQueries({ queryKey: ['clientes', id] })` are triggered so the changes are reflected in both the list and the detail immediately (FR27). **And** a toast de éxito muestra `"Cliente actualizado correctamente"`.

3. **Given** the user clears a required field (Nombre, NIT/RUC, Teléfono, or Ciudad) and clicks "Guardar", **When** the Zod schema validates, **Then** inline error messages appear below each invalid field in `text-sm text-red-600`. **And** the form is NOT submitted to the backend. **And** the "Guardar" button remains active but submission is blocked by validation.

4. **Given** the user clicks "Cancelar" or presses `Esc` or clicks outside the dialog without saving, **When** the dialog closes, **Then** the original client data remains unchanged in both the detail view and the list. **And** no `PUT` request is sent.

5. **Given** the form is open with the current client's NIT/RUC, **When** the user changes the NIT/RUC to one already registered by a different client and submits, **Then** the backend returns a 409 Conflict (Problem Details RFC 7807). **And** an inline error message `"El NIT/RUC ya está registrado"` appears below the NIT/RUC field without exposing technical details (NFR6).

6. **Given** the form is submitting (waiting for the backend response), **When** the mutation is in-flight, **Then** the "Guardar" button shows `"Guardando..."` and is disabled to prevent duplicate submissions.

7. **Given** the user navigates the form via Tab key, **Then** all fields and buttons meet WCAG 2.1 AA keyboard accessibility. **And** focus is trapped within the Dialog while it is open (Radix `FocusScope` built-in). **And** on close, focus returns to the "Editar" button.

## Tasks / Subtasks

- [ ] Task 1 — Backend: `PUT /api/v1/clientes/{id}` command (AC: #2, #5)
  - [ ] Create `UpdateClienteCommand.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/`
  - [ ] Create `UpdateClienteCommandHandler.cs` — fetches entity by ID (throws `NotFoundException` if not found), checks NIT uniqueness excluding current client (throws `ConflictException` if duplicate belongs to different client), calls `cliente.Update(...)`, persists changes
  - [ ] Add `Update(string nombre, string nit, string telefono, string ciudad)` method to `ClienteEntity` that sets fields and updates `UpdatedAt = DateTimeOffset.UtcNow`
  - [ ] Create `UpdateClienteRequest.cs` DTO in `backend/src/SiesaAgents.Application/Clientes/DTOs/`
  - [ ] Create `UpdateClienteRequestValidator.cs` in `backend/src/SiesaAgents.Application/Clientes/Validators/`
  - [ ] Register `PUT /api/v1/clientes/{id}` endpoint in `ClienteEndpoints.cs`
  - [ ] Add `UpdateAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository` interface and implement in `ClienteRepository` (EF Core `Update` + `SaveChangesAsync`)
  - [ ] Write xUnit unit tests: `UpdateClienteCommandHandlerTests` and `UpdateClienteRequestValidatorTests`

- [ ] Task 2 — Frontend domain layer: extend `IClienteRepository` for update (AC: #2)
  - [ ] Add `update(id: string, data: UpdateClienteData): Promise<Cliente>` to `IClienteRepository.ts`
  - [ ] Define `UpdateClienteData` type in `Cliente.ts` (same fields as `CreateClienteData`: nombre, nit, telefono, ciudad)

- [ ] Task 3 — Frontend infrastructure layer: implement `update` in Axios repository (AC: #2)
  - [ ] Add `update(id, data)` implementation to `clienteApiRepository.ts` — calls `PUT /api/v1/clientes/${id}`, returns `Cliente`

- [ ] Task 4 — Frontend application layer: `useUpdateCliente` mutation hook (AC: #2, #5, #6)
  - [ ] Create `useUpdateCliente.ts` with TanStack Query `useMutation`
  - [ ] On success: invalidate `['clientes']` and `['clientes', id]`, show toast `"Cliente actualizado correctamente"`
  - [ ] On error: check status; if 409 do NOT show generic toast (handled by form via `setError`); otherwise show `"No se pudo guardar. Intenta de nuevo."`
  - [ ] Write Vitest unit tests for `useUpdateCliente`

- [ ] Task 5 — Frontend presentation layer: extend `ClienteForm` for edit mode (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Add `mode: 'create' | 'edit'` and `defaultValues?: ClienteFormValues` props to `ClienteForm.tsx`
  - [ ] When `mode === 'edit'` and `defaultValues` provided, pass them to `useForm({ defaultValues })` so all fields are pre-filled
  - [ ] Wire `useUpdateCliente` mutation when `mode === 'edit'`; wire `useCreateCliente` mutation when `mode === 'create'` (existing behavior unchanged)
  - [ ] 409 conflict error in edit mode sets `setError('nit', { message: 'El NIT/RUC ya está registrado' })` via same `useEffect` pattern as create

- [ ] Task 6 — Frontend presentation layer: `EditarClienteDialog` wrapper component (AC: #1, #4, #7)
  - [ ] Create `EditarClienteDialog.tsx` — same shadcn `Dialog` pattern as `NuevoClienteDialog.tsx`, renders `<ClienteForm mode="edit" defaultValues={...} clienteId={id} onClose={onClose} />`
  - [ ] Dialog title: `"Editar cliente"`

- [ ] Task 7 — Frontend presentation layer: wire "Editar" button in `ClienteDetailView` (AC: #1, #4)
  - [ ] Add `isEditDialogOpen` state and "Editar" button in `ClienteDetailView.tsx`
  - [ ] Pass current client data as `defaultValues` to `EditarClienteDialog`

- [ ] Task 8 — Accessibility verification (AC: #7)
  - [ ] All form labels in Spanish with `htmlFor` matching field `id`
  - [ ] Error messages associated via `aria-describedby`
  - [ ] On dialog close, focus returns to "Editar" button (pass `ref` to button)

- [ ] Task 9 — Tests (AC: #1–#7)
  - [ ] RTL: `EditarClienteDialog` renders with all 4 fields pre-filled with `defaultValues` (ATDD)
  - [ ] RTL: submitting with empty required field shows `"Este campo es requerido"` inline (ATDD)
  - [ ] RTL: successful submit calls `PUT`, invalidates queries, shows toast `"Cliente actualizado correctamente"` (ATDD)
  - [ ] RTL: 409 response shows `"El NIT/RUC ya está registrado"` below NIT field (ATDD)
  - [ ] RTL: cancel button closes dialog without submitting (ATDD)
  - [ ] RTL: "Guardar" button is disabled and shows `"Guardando..."` when `isPending` is true (ATDD)
  - [ ] xUnit: `UpdateClienteCommandHandler` updates entity and returns `ClienteDto` when data is valid
  - [ ] xUnit: `UpdateClienteCommandHandler` throws `NotFoundException` when client ID not found
  - [ ] xUnit: `UpdateClienteCommandHandler` throws `ConflictException` when new NIT belongs to different client
  - [ ] xUnit: `UpdateClienteRequestValidator` fails for each empty field independently

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory)
- **Verify installed**: `pnpm list siesa-ui-kit` from `frontend/` — do NOT reinstall (already present)
- **Usage**: siesa-ui-kit `Input`, `Button` for all form fields. Check siesa-ui-kit catalog before building any custom control.
- **Component lookup order**: siesa-ui-kit → shadcn/ui → custom (only if unavailable in both)
- **Dialog**: Reuse the same custom Dialog pattern from `NuevoClienteDialog.tsx` (Story 2.3). The dialog uses `createPortal` with `role="dialog"`, `aria-labelledby`, Esc/outside-click handling.
- **MasterCrud NOT applicable**: This story uses an inline edit dialog within a split-panel layout per UX Direction F. The form is minimal (4 fields) and does not require the full MasterCrud orchestrator.

### Architecture Patterns

**Frontend Clean Architecture layers for this story:**

```
frontend/src/modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                          # ADD UpdateClienteData type
│   └── IClienteRepository.ts              # ADD update(id, data): Promise<Cliente>
├── application/
│   └── useUpdateCliente.ts                # CREATE: TanStack Query useMutation hook
├── infrastructure/
│   └── clienteApiRepository.ts            # ADD update() using PUT /api/v1/clientes/:id
└── presentation/
    ├── ClienteForm.tsx                     # UPDATE: add mode + defaultValues props
    ├── EditarClienteDialog.tsx             # CREATE: shadcn Dialog wrapper for edit
    └── ClienteDetailView.tsx              # UPDATE: add "Editar" button + dialog state
```

**`useUpdateCliente.ts` canonical pattern:**
```typescript
// frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'siesa-ui-kit'   // reuse same toast used in useCreateCliente
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { UpdateClienteData } from '../domain/Cliente'
import { AxiosError } from 'axios'

export function useUpdateCliente(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateClienteData) => clienteApiRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['clientes', id] })
      toast.success('Cliente actualizado correctamente')
    },
    onError: (error) => {
      const status = (error as AxiosError)?.response?.status
      if (status !== 409) {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}
```

**`ClienteForm.tsx` extension for edit mode:**
```typescript
// Updated props interface
interface ClienteFormProps {
  mode: 'create' | 'edit'
  clienteId?: string            // required when mode === 'edit'
  defaultValues?: ClienteFormValues
  onClose: () => void
}

// Inside ClienteForm:
const { register, handleSubmit, formState: { errors }, setError, reset } = useForm<ClienteFormValues>({
  resolver: zodResolver(clienteSchema),
  defaultValues: props.defaultValues,   // pre-fills fields in edit mode
})

const createMutation = useCreateCliente()          // only wired when mode === 'create'
const updateMutation = useUpdateCliente(clienteId!) // only wired when mode === 'edit'

const mutation = mode === 'edit' ? updateMutation : createMutation

// 409 error handler — same pattern as create:
useEffect(() => {
  if (mutation.isError) {
    const status = (mutation.error as AxiosError)?.response?.status
    if (status === 409) {
      setError('nit', { message: 'El NIT/RUC ya está registrado' })
    }
  }
}, [mutation.isError, mutation.error, setError])
```

**`EditarClienteDialog.tsx` pattern:**
```typescript
// frontend/src/modules/crm/clientes/presentation/EditarClienteDialog.tsx
import { ClienteForm } from './ClienteForm'
import type { ClienteFormValues } from '../application/clienteSchema'

interface EditarClienteDialogProps {
  open: boolean
  onClose: () => void
  clienteId: string
  defaultValues: ClienteFormValues
}

export function EditarClienteDialog({ open, onClose, clienteId, defaultValues }: EditarClienteDialogProps) {
  // Same custom Dialog/createPortal pattern used in NuevoClienteDialog.tsx
  // Title: "Editar cliente"
  return (
    // <Dialog open={open} onOpenChange={onClose}>
    //   title: "Editar cliente"
    //   <ClienteForm mode="edit" clienteId={clienteId} defaultValues={defaultValues} onClose={onClose} />
    // </Dialog>
  )
}
```

**"Editar" button in `ClienteDetailView.tsx`:**
```typescript
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

// Map cliente data to ClienteFormValues:
const defaultValues: ClienteFormValues = {
  nombre: cliente.nombre,
  nit: cliente.nit,
  telefono: cliente.telefono,
  ciudad: cliente.ciudad,
}

<Button onClick={() => setIsEditDialogOpen(true)}>Editar</Button>
<EditarClienteDialog
  open={isEditDialogOpen}
  onClose={() => setIsEditDialogOpen(false)}
  clienteId={cliente.id}
  defaultValues={defaultValues}
/>
```

**`clienteApiRepository.ts` — add `update` method:**
```typescript
// frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
update: async (id: string, data: UpdateClienteData): Promise<Cliente> => {
  const response = await apiClient.put<Cliente>(`/api/v1/clientes/${id}`, data)
  return response.data
},
```

### Backend Architecture Patterns

**CQRS Command — UpdateCliente:**
```csharp
// SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs
public record UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad);

// SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs
public class UpdateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> Handle(UpdateClienteCommand command, CancellationToken ct)
    {
        var cliente = await repository.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException($"Cliente con ID '{command.Id}' no encontrado.");

        // NIT uniqueness check — exclude current client
        var existingNit = await repository.GetByNitAsync(command.Nit, ct);
        if (existingNit is not null && existingNit.Id != command.Id)
            throw new ConflictException($"El NIT/RUC '{command.Nit}' ya está registrado.");

        cliente.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await repository.UpdateAsync(cliente, ct);
        return new ClienteDto(cliente.Id, cliente.Nombre, cliente.Nit, cliente.Telefono, cliente.Ciudad, cliente.CreatedAt, cliente.UpdatedAt);
    }
}
```

**`ClienteEntity.Update()` domain method:**
```csharp
// SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public void Update(string nombre, string nit, string telefono, string ciudad)
{
    Nombre = nombre;
    Nit = nit;
    Telefono = telefono;
    Ciudad = ciudad;
    UpdatedAt = DateTimeOffset.UtcNow;
}
```

**`IClienteRepository` addition:**
```csharp
// Add to SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs
Task UpdateAsync(ClienteEntity entity, CancellationToken cancellationToken = default);
```

**`ClienteRepository` implementation:**
```csharp
// SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
public async Task UpdateAsync(ClienteEntity entity, CancellationToken ct = default)
{
    _context.Clientes.Update(entity);
    await _context.SaveChangesAsync(ct);
}
```

**FluentValidation — `UpdateClienteRequestValidator`:**
```csharp
// SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs
public class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>
{
    public UpdateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("Este campo es requerido");
        RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT no puede estar vacío");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("Este campo es requerido");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("Este campo es requerido");
    }
}
```

**Minimal API endpoint:**
```csharp
// ClienteEndpoints.cs — add PUT endpoint
app.MapPut("/api/v1/clientes/{id:guid}", async (Guid id, UpdateClienteRequest request, UpdateClienteCommandHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new UpdateClienteCommand(id, request.Nombre, request.Nit, request.Telefono, request.Ciudad), ct);
    return Results.Ok(result);
})
.WithName("UpdateCliente")
.Produces<ClienteDto>(StatusCodes.Status200OK)
.Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
.Produces<ProblemDetails>(StatusCodes.Status404NotFound)
.Produces<ProblemDetails>(StatusCodes.Status409Conflict);
```

**API response shapes:**
```
PUT /api/v1/clientes/{id} (success)           → 200 OK + ClienteDto body
PUT /api/v1/clientes/{id} (validation error)  → 400 Problem Details RFC 7807
PUT /api/v1/clientes/{id} (not found)         → 404 Problem Details RFC 7807
PUT /api/v1/clientes/{id} (NIT conflict)      → 409 Problem Details RFC 7807
```

### State Management

- **Server state**: TanStack Query `useMutation` + `invalidateQueries({ queryKey: ['clientes'] })` and `invalidateQueries({ queryKey: ['clientes', id] })` on success
- **Form state**: React Hook Form `useForm` with `defaultValues` (local to `ClienteForm`)
- **Dialog open/close state**: `useState<boolean>` local to `ClienteDetailView` (no Zustand needed)
- **No URL change**: Editing a client does not change the URL — dialog is an overlay on the current `/clientes/:clienteId` route

### All User-Facing Text MUST Be in Spanish

| Element | Spanish Text |
|---------|-------------|
| Button to open edit dialog | `"Editar"` |
| Dialog title | `"Editar cliente"` |
| Field label — Nombre | `"Nombre *"` |
| Field label — NIT/RUC | `"NIT/RUC *"` |
| Field label — Teléfono | `"Teléfono *"` |
| Field label — Ciudad | `"Ciudad *"` |
| Form footer legend | `"* Campos obligatorios"` |
| Required field error | `"Este campo es requerido"` |
| NIT empty error | `"El NIT no puede estar vacío"` |
| NIT conflict error | `"El NIT/RUC ya está registrado"` |
| Submit button | `"Guardar"` |
| Submit button loading | `"Guardando..."` |
| Cancel button | `"Cancelar"` |
| Success toast | `"Cliente actualizado correctamente"` |
| Generic error toast | `"No se pudo guardar. Intenta de nuevo."` |
| Not found backend error | `"Cliente con ID '...' no encontrado."` |

### Previous Story Learnings (from Stories 2.1–2.3)

- **Package manager**: `pnpm` is mandatory — do NOT use `npm install` or `yarn add`
- **siesa-ui-kit** is already installed — verify with `pnpm list siesa-ui-kit` before any install attempt; do NOT reinstall
- **Custom Dialog** (not shadcn): Story 2.3 confirmed that shadcn `Dialog` was not installed; instead a custom dialog using React `createPortal` with `role="dialog"`, `aria-labelledby`, `aria-modal` was created — reuse `NuevoClienteDialog.tsx` structure exactly for `EditarClienteDialog.tsx`
- **siesa-ui-kit `toast` and `ToastProvider`**: wired in `main.tsx` from Story 2.3 — do NOT add a second provider
- **Axios `apiClient`** singleton is at `frontend/src/shared/lib/apiClient.ts` — import directly, do NOT create a new Axios instance
- **`queryClient`** is wired in `frontend/src/app/providers/QueryProvider.tsx` — no additional setup needed
- **`isPending`** (not `isLoading`): TanStack Query v5 mutation uses `isPending` — do NOT use deprecated `isLoading`
- **siesa-ui-kit `Button`**: uses a non-standard `type` prop (visual style, not HTML button type); use native `<button type="submit">` for the submit button in the form to ensure jsdom test compatibility
- **`useEffect` for 409 handling**: the pattern `useEffect(() => { if (mutation.isError) { ... setError(...) } }, [mutation.isError])` is the approved approach for mapping server errors to form field errors
- **`ClienteForm.tsx` already exists**: Extend it with `mode`/`defaultValues` props rather than creating a separate form component — keeps a single source of truth for client form logic
- **dotnet** may not be available in local environment — backend compilation may only be verifiable in CI
- **`GetByNitAsync`** is already in `IClienteRepository` and `ClienteRepository` from Story 2.3 — do NOT re-add it
- **`GetByIdAsync`** is already in `IClienteRepository` and `ClienteRepository` from Story 2.2 — do NOT re-add it
- **`NotFoundException`** is already in `backend/src/SiesaAgents.Application/Common/Exceptions/` — do NOT re-create
- **`ConflictException`** is already in `backend/src/SiesaAgents.Application/Common/Exceptions/` — do NOT re-create
- **`ExceptionHandlingMiddleware`** already handles both `NotFoundException` → 404 and `ConflictException` → 409 — do NOT modify unless a new case is needed
- **All unit test stubs for `IClienteRepository`** — when adding `UpdateAsync` to the interface, update ALL existing test stubs (GetClientesQueryHandlerTests, GetClienteByIdQueryHandlerTests, CreateClienteCommandHandlerTests and their edge case variants)

### Git History Context

Recent commits (most recent first):
- `fix(review)`: apply code review corrections to story 2.3 create client — apply same quality standards
- `test(2.3)`: apply test review corrections — follow same test file naming pattern
- `test(2.3)`: add edge case tests from Test Automate phase — Vitest + RTL + MSW pattern
- `feat(story-2.3)`: implement create client — `ClienteForm`, `NuevoClienteDialog`, `useCreateCliente` all established
- `feat(atdd)`: ATDD specs created before implementation — generate ATDD tests for 2.4 before implementing

### Testing Standards

**Frontend (Vitest + RTL + MSW):**
- Mock `clienteApiRepository.update` via `vi.mock` — do NOT call real API in unit tests
- Use MSW handlers to simulate 200, 400, 404, 409 responses in integration-style RTL tests
- Test all `ClienteForm` edit states independently: pre-filled render, validation errors, success, 409 conflict, pending
- Accessibility: assert `aria-describedby` on error messages and `role="dialog"` on the Dialog
- Run: `pnpm run test` from `frontend/` directory

**Backend (xUnit):**
- Unit test: `UpdateClienteCommandHandler` returns `ClienteDto` when data is valid and entity exists
- Unit test: `UpdateClienteCommandHandler` throws `NotFoundException` when ID not found
- Unit test: `UpdateClienteCommandHandler` throws `ConflictException` when NIT belongs to different client (existingNit.Id != command.Id)
- Unit test: `UpdateClienteCommandHandler` allows same NIT when updating the same client (existingNit.Id == command.Id → no conflict)
- Unit test: `UpdateClienteRequestValidator` fails for each empty field independently
- Arrange / Act / Assert structure strictly

### Project Structure Notes

**Files to CREATE in this story:**
```
frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts
frontend/src/modules/crm/clientes/presentation/EditarClienteDialog.tsx
frontend/src/modules/crm/clientes/presentation/EditarClienteDialog.test.tsx

backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs
backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs
backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs
backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs
```

**Files to UPDATE in this story:**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts                          # Add UpdateClienteData type
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts               # Add update() method
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts      # Implement update()
frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx                # Add mode + defaultValues props
frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx          # Add "Editar" button + dialog state

backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs            # Add Update() domain method
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs     # Add UpdateAsync()
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs     # Implement UpdateAsync()
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                    # Add PUT endpoint
backend/src/SiesaAgents.API/Program.cs                                        # Register UpdateClienteCommandHandler + UpdateClienteRequestValidator
```

**Files to UPDATE in unit test stubs (add `UpdateAsync` stub method):**
```
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerEdgeCaseTests.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerEdgeCaseTests.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerEdgeCaseTests.cs (if exists)
```

**Existing files to VERIFY (from previous stories — do NOT recreate):**
```
frontend/src/shared/lib/apiClient.ts                                          # Axios singleton — reuse
frontend/src/modules/crm/clientes/application/clienteSchema.ts               # Zod schema — reuse as-is
frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx                # Extend, do NOT replace
frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.tsx         # Pattern reference for EditarClienteDialog
backend/src/SiesaAgents.Application/Common/Exceptions/NotFoundException.cs    # Reuse — already exists
backend/src/SiesaAgents.Application/Common/Exceptions/ConflictException.cs    # Reuse — already exists
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs          # Already handles 404 + 409 — verify before any change
```

### References

- Story scope and AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4]
- FR6 (edit client fields) + FR8 (validate required fields): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- FR27 (immediate visibility — double invalidateQueries): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- NFR2 (CRUD < 2s): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- `PUT /api/v1/clientes/{id}` endpoint contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- TanStack Query mutation pattern with dual invalidation: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- `UpdateClienteCommand.cs` and `UpdateClienteCommandHandler.cs` in project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- `useUpdateCliente.ts` and `ClienteForm.tsx` paths: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Dialog accessibility rules (FocusScope, autoFocus, Esc close, focus return): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Dev Notes]
- Custom Dialog pattern (createPortal, not shadcn Dialog): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Completion Notes List]
- siesa-ui-kit Button type prop caveat + native button for submit: [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Completion Notes List]
- Toast provider already wired in main.tsx: [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Completion Notes List]
- `isPending` (not `isLoading`) — TanStack Query v5: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- DateTimeOffset mandatory for `UpdatedAt` in `ClienteEntity.Update()`: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- FluentValidation on all endpoints: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Security]
- Problem Details RFC 7807 format: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Spanish text mandatory for all UI: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- MasterCrud NOT applicable — minimal form in split-panel: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
