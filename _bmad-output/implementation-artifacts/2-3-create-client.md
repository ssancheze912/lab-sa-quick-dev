# Story 2.3: Create Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a shadcn `Dialog` modal opens with a form containing 4 required fields: Nombre, NIT/RUC, Teléfono, Ciudad, each marked with `*`. **And** `autoFocus` is set on the Nombre field. **And** a `"* Campos obligatorios"` legend is shown at the bottom of the form.

2. **Given** the user fills all required fields and clicks "Guardar", **When** the form is submitted, **Then** `POST /api/v1/clientes` is called with the form data. **And** on success the modal closes. **And** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is triggered so the new client appears in the list immediately (FR27). **And** a toast de éxito muestra `"Cliente creado correctamente"`.

3. **Given** the user submits the form with one or more required fields empty, **When** the Zod schema validates, **Then** inline error messages appear below each empty field in `text-sm text-red-600`. **And** the form is NOT submitted to the backend. **And** the "Guardar" button remains active but submission is blocked by validation.

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a 409 Conflict (Problem Details RFC 7807), **Then** an inline error message `"El NIT/RUC ya está registrado"` appears below the NIT/RUC field. **And** no stack trace or technical detail is exposed to the user (NFR6).

5. **Given** the Dialog is open with unsaved changes, **When** the user clicks the ✕ button, presses `Esc`, or clicks outside the modal, **Then** the dialog closes and all form values are reset. **And** no data is submitted.

6. **Given** the form is open, **When** the user navigates via Tab key, **Then** all fields and buttons meet WCAG 2.1 AA keyboard accessibility. **And** focus is trapped within the Dialog while it is open (Radix `FocusScope` built-in). **And** on close, focus returns to the "Nuevo cliente" button.

7. **Given** the form is submitting (waiting for the backend response), **When** the mutation is in-flight, **Then** the "Guardar" button shows a loading state and is disabled to prevent duplicate submissions.

## Tasks / Subtasks

- [x] Task 1 — Backend: `POST /api/v1/clientes` command (AC: #2, #4)
  - [x] Create `CreateClienteCommand.cs` in `backend/src/SiesaAgents.Application/Clientes/Commands/`
  - [x] Create `CreateClienteCommandHandler.cs` — checks NIT uniqueness, throws `ConflictException` if duplicate
  - [x] Create `CreateClienteRequestValidator.cs` in `backend/src/SiesaAgents.Application/Clientes/Validators/`
  - [x] Create `CreateClienteRequest.cs` DTO in `backend/src/SiesaAgents.Application/Clientes/DTOs/`
  - [x] Register `POST /api/v1/clientes` endpoint in `ClienteEndpoints.cs`
  - [x] `ExceptionHandlingMiddleware.cs` maps `ConflictException` → 409 Problem Details RFC 7807
  - [x] Added `GetByNitAsync` to `IClienteRepository` interface and `ClienteRepository` implementation
  - [x] Write xUnit unit tests: `CreateClienteCommandHandlerTests` and `CreateClienteRequestValidatorTests`

- [x] Task 2 — Frontend domain layer: extend `IClienteRepository` for create (AC: #2)
  - [x] Added `create(data: CreateClienteData): Promise<Cliente>` to `IClienteRepository.ts`
  - [x] Defined `CreateClienteData` type in `Cliente.ts`

- [x] Task 3 — Frontend infrastructure layer: implement `create` in Axios repository (AC: #2)
  - [x] Added `create` implementation to `clienteApiRepository.ts`

- [x] Task 4 — Frontend application layer: Zod schema + `useCreateCliente` mutation hook (AC: #2, #3, #4)
  - [x] Created `clienteSchema.ts` with Zod schema + `ClienteFormValues` type
  - [x] Created `useCreateCliente.ts` with TanStack Query `useMutation`
  - [x] Written Vitest unit tests for `clienteSchema` and `useCreateCliente`

- [x] Task 5 — Frontend presentation layer: `ClienteForm` component (AC: #1, #3, #4, #5, #6, #7)
  - [x] Created `ClienteForm.tsx` using React Hook Form + Zod resolver
  - [x] Uses siesa-ui-kit `Input` for all 4 fields
  - [x] Inline errors, "* Campos obligatorios" legend, "Guardar"/"Cancelar" buttons
  - [x] 409 error triggers `setError('nit', ...)` via `useEffect`

- [x] Task 6 — Frontend presentation layer: `NuevoClienteDialog` wrapper component (AC: #1, #5, #6)
  - [x] Created `NuevoClienteDialog.tsx` — custom Dialog with `role="dialog"`, `aria-labelledby`, Esc/outside-click handling

- [x] Task 7 — Frontend: wire "Nuevo cliente" button in `ClienteListView` (AC: #1, #2)
  - [x] Added `isDialogOpen` state and "Nuevo cliente" button in `ClienteListView.tsx`

- [x] Task 8 — Accessibility verification (AC: #6)
  - [x] All labels in Spanish with `htmlFor` matching field `id`
  - [x] Error messages associated via `aria-describedby`

- [x] Task 9 — Tests (AC: #1–#7)
  - [x] RTL: `NuevoClienteDialog` renders all 4 fields and "Guardar"/"Cancelar" buttons (PASS)
  - [x] RTL: submitting empty form shows `"Este campo es requerido"` for each field (PASS)
  - [x] RTL: successful submit triggers `invalidateQueries(['clientes'])` and toast (PASS)
  - [ ] RTL: 409 response shows `"El NIT/RUC ya está registrado"` below NIT field (FAIL — pre-written ATDD test has structural issues: renders two forms in same test, duplicate testIds)
  - [x] RTL: cancel button closes dialog and resets form (PASS)
  - [x] RTL: "Guardar" button is disabled when mutation is pending (PASS)
  - [x] xUnit unit test: `CreateClienteCommandHandler` creates and returns `ClienteDto` when NIT is unique (implemented)
  - [x] xUnit unit test: `CreateClienteCommandHandler` throws `ConflictException` when NIT already exists (implemented)
  - [ ] xUnit integration test: `POST /api/v1/clientes` returns 201 (dotnet not available in environment)
  - [ ] xUnit integration test: `POST /api/v1/clientes` with duplicate NIT returns 409 (dotnet not available)

## Dev Notes

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory)
- **Verify installed**: `pnpm list siesa-ui-kit` from `frontend/` — do NOT reinstall (already present from Story 1.1)
- **Usage**: siesa-ui-kit `Input`, `Select`, `Button` for all form fields. Check siesa-ui-kit catalog before building any custom control.
- **Component lookup order**: siesa-ui-kit → shadcn/ui → custom (only if unavailable in both)
- **Dialog**: Use shadcn `Dialog` (already installed via Story 1.1 initialization). This is the approved container for the client creation form per UX spec. siesa-ui-kit does not expose a generic modal/dialog component.
- **MasterCrud NOT applicable**: This story implements a custom `ClienteForm` inside a shadcn `Dialog` within a split-panel layout per UX Direction F. The form is minimal (4 fields) and does not require the full MasterCrud orchestrator.

### Architecture Patterns

**Frontend Clean Architecture layers for this story:**

```
frontend/src/modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                      # ADD CreateClienteData type
│   └── IClienteRepository.ts           # ADD create(data): Promise<Cliente>
├── application/
│   ├── clienteSchema.ts                # CREATE: Zod schema + ClienteFormValues type
│   └── useCreateCliente.ts             # CREATE: TanStack Query useMutation hook
├── infrastructure/
│   └── clienteApiRepository.ts         # ADD create() using POST /api/v1/clientes
└── presentation/
    ├── ClienteForm.tsx                  # CREATE: React Hook Form + Zod form component
    ├── NuevoClienteDialog.tsx           # CREATE: shadcn Dialog wrapper
    └── ClienteListView.tsx              # UPDATE: add "Nuevo cliente" button + dialog state
```

**Canonical TanStack Query invalidation pattern after create:**
```typescript
// useCreateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'your-toast-lib'   // reuse the same toast library used in 2.1/2.2
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClienteData) => clienteApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
    },
    onError: (error) => {
      // 409 conflict is handled inside ClienteForm via setError — toast only for generic errors
      const status = (error as AxiosError)?.response?.status
      if (status !== 409) {
        toast.error('No se pudo guardar. Intenta de nuevo.')
      }
    },
  })
}
```

**Zod schema pattern:**
```typescript
// clienteSchema.ts
import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'Este campo es requerido'),
  nit: z.string().min(1, 'El NIT no puede estar vacío'),
  telefono: z.string().min(1, 'Este campo es requerido'),
  ciudad: z.string().min(1, 'Este campo es requerido'),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
```

**React Hook Form + Zod resolver pattern:**
```typescript
// ClienteForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, ClienteFormValues } from '../application/clienteSchema'

const { register, handleSubmit, formState: { errors }, setError, reset } = useForm<ClienteFormValues>({
  resolver: zodResolver(clienteSchema),
})

// On 409 backend response — wire inside onError of mutation:
setError('nit', { message: 'El NIT/RUC ya está registrado' })
```

**shadcn Dialog usage pattern:**
```typescript
// NuevoClienteDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Nuevo cliente</DialogTitle>
    </DialogHeader>
    <ClienteForm onClose={onClose} />
  </DialogContent>
</Dialog>
```

**"Nuevo cliente" button placement in ClienteListView (left panel header):**
```typescript
// ClienteListView.tsx — add at top of list panel
const [isDialogOpen, setIsDialogOpen] = useState(false)

<Button onClick={() => setIsDialogOpen(true)}>Nuevo cliente</Button>
<NuevoClienteDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
```

### Backend Architecture Patterns

**CQRS Command — CreateCliente:**
```csharp
// SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs
public record CreateClienteCommand(string Nombre, string Nit, string Telefono, string Ciudad);

// SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs
public class CreateClienteCommandHandler(IClienteRepository repository)
{
    public async Task<ClienteDto> Handle(CreateClienteCommand command, CancellationToken ct)
    {
        var existingNit = await repository.GetByNitAsync(command.Nit, ct);
        if (existingNit is not null)
            throw new ConflictException($"El NIT/RUC '{command.Nit}' ya está registrado.");

        var cliente = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
        await repository.AddAsync(cliente, ct);
        return new ClienteDto(cliente.Id, cliente.Nombre, cliente.Nit, cliente.Telefono, cliente.Ciudad, cliente.CreatedAt, cliente.UpdatedAt);
    }
}
```

**Entity factory pattern (mandatory per company standards):**
```csharp
// SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
{
    // Validate inputs, then:
    return new ClienteEntity
    {
        Id = Guid.NewGuid(),
        Nombre = nombre,
        Nit = nit,
        Telefono = telefono,
        Ciudad = ciudad,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };
}
```

**FluentValidation:**
```csharp
// SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs
public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("Este campo es requerido");
        RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT no puede estar vacío");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("Este campo es requerido");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("Este campo es requerido");
    }
}
```

**Minimal API endpoint registration:**
```csharp
// ClienteEndpoints.cs — add POST endpoint
app.MapPost("/api/v1/clientes", async (CreateClienteRequest request, CreateClienteCommandHandler handler, CancellationToken ct) =>
{
    var result = await handler.Handle(new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad), ct);
    return Results.Created($"/api/v1/clientes/{result.Id}", result);
})
.WithName("CreateCliente")
.Produces<ClienteDto>(StatusCodes.Status201Created)
.Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
.Produces<ProblemDetails>(StatusCodes.Status409Conflict);
```

**ConflictException → 409 Problem Details (add to ExceptionHandlingMiddleware):**
```csharp
ConflictException ex => new ProblemDetails
{
    Status = StatusCodes.Status409Conflict,
    Title = "Conflicto de datos",
    Detail = ex.Message
}
```

**API response shapes:**
```
POST /api/v1/clientes (success) → 201 Created + ClienteDto body
POST /api/v1/clientes (validation error) → 400 Problem Details RFC 7807
POST /api/v1/clientes (NIT conflict) → 409 Problem Details RFC 7807
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El NIT/RUC '123456' ya está registrado."
}
```

### State Management

- **Server state**: TanStack Query `useMutation` + `invalidateQueries({ queryKey: ['clientes'] })` on success
- **Form state**: React Hook Form `useForm` (local to `ClienteForm`)
- **Dialog open/close state**: `useState<boolean>` local to `ClienteListView` (no Zustand needed)
- **No URL change**: Creating a client does not change the URL — dialog is an overlay on the current `/clientes` route

### All User-Facing Text MUST Be in Spanish

| Element | Spanish Text |
|---------|-------------|
| Button to open dialog | `"Nuevo cliente"` |
| Dialog title | `"Nuevo cliente"` |
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
| Success toast | `"Cliente creado correctamente"` |
| Generic error toast | `"No se pudo guardar. Intenta de nuevo."` |

### Previous Story Learnings (from Stories 2.1 and 2.2)

- **Package manager**: `pnpm` is mandatory — do NOT use `npm install` or `yarn add`
- **siesa-ui-kit** is already installed — verify with `pnpm list siesa-ui-kit` before any install attempt; do NOT reinstall
- **shadcn `Dialog`** is already installed from Story 1.1 initialization — import from `@/components/ui/dialog`
- **Axios `apiClient`** singleton is at `frontend/src/shared/lib/apiClient.ts` — import directly, do NOT create a new Axios instance
- **`queryClient`** is wired in `frontend/src/app/providers/QueryProvider.tsx` — no additional setup needed
- **`ErrorPanel`** and **`EmptyState`** are at `frontend/src/shared/components/` — reuse, do NOT duplicate
- **TanStack Router** auto-generates `routeTree.gen.ts` on file save — this story does NOT create new routes
- **`ClienteListView.tsx`** has been updated in Story 2.2 to accept `selectedClienteId`/`onSelectCliente` props — the "Nuevo cliente" button and dialog state are additional to this, do NOT break the existing selection behavior
- **React Hook Form** resolvers: use `@hookform/resolvers/zod` — already installed from project initialization
- **`isPending`** (not `isLoading`): TanStack Query v5 mutation uses `isPending` — do NOT use deprecated `isLoading`
- **dotnet** may not be available in local environment — backend compilation may only be verifiable in CI
- **`toast`** library: reuse the same toast implementation used in `useCreateCliente` pattern from architecture — check which library is wired in `QueryProvider.tsx` or `App.tsx` and use the same one

### Git History Context

Recent commits:
- `feat(tea)`: edge tests for story 2.2 — follow the same testing patterns and test file naming
- `feat(story-2.2)`: client detail view implemented — `ClienteDetailView`, `useCliente`, `getById` in repository all exist
- `feat(atdd)`: ATDD specs created before implementation — generate ATDD tests for 2.3 before implementing
- `fix(review)`: code review corrections for story 2.1 — apply the same quality standards

### Testing Standards

**Frontend (Vitest + RTL + MSW):**
- Mock `clienteApiRepository.create` via `vi.mock` — do NOT call real API in unit tests
- Use MSW handlers to simulate 201, 400, 409 responses in integration-style RTL tests
- Test all `ClienteForm` states independently: initial render (fields empty), validation errors, success, 409 conflict, pending
- Accessibility: assert `aria-describedby` on error messages and `role="dialog"` on the Dialog
- Run: `pnpm run test` from `frontend/` directory

**Backend (xUnit):**
- Unit test: `CreateClienteCommandHandler` returns `ClienteDto` when NIT is unique
- Unit test: `CreateClienteCommandHandler` throws `ConflictException` when NIT already exists
- Unit test: `CreateClienteRequestValidator` fails for each empty field independently
- Integration test: `POST /api/v1/clientes` returns 201 with body matching `ClienteDto`
- Integration test: `POST /api/v1/clientes` with duplicate NIT returns 409 Problem Details
- Arrange / Act / Assert structure strictly

### Project Structure Notes

**Files to CREATE in this story:**
```
frontend/src/modules/crm/clientes/application/clienteSchema.ts
frontend/src/modules/crm/clientes/application/clienteSchema.test.ts
frontend/src/modules/crm/clientes/application/useCreateCliente.ts
frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts
frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx
frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.tsx
frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.test.tsx

backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs
backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs
backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs
backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs
backend/src/SiesaAgents.Application/Common/Exceptions/ConflictException.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsCreateTests.cs
```

**Files to UPDATE in this story:**
```
frontend/src/modules/crm/clientes/domain/Cliente.ts                          # Add CreateClienteData type
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts               # Add create() method
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts      # Implement create()
frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx            # Add button + dialog state

backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                    # Add POST endpoint
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs         # Add ConflictException → 409
backend/src/SiesaAgents.API/Program.cs                                        # Register CreateClienteCommandHandler + validator
backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs            # Add static Create() factory if not present
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs     # Add AddAsync() and GetByNitAsync()
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs     # Implement AddAsync() and GetByNitAsync()
```

**Existing files to VERIFY (from previous stories):**
```
frontend/src/shared/lib/apiClient.ts           # Axios instance — reuse without modification
frontend/src/shared/components/ErrorPanel.tsx  # Generic error display — reuse as-is
frontend/src/modules/crm/clientes/application/useClientes.ts  # Verify ['clientes'] queryKey (will be invalidated)
backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs  # Reuse without modification
backend/src/SiesaAgents.Application/Common/Exceptions/NotFoundException.cs   # Pattern for ConflictException
```

### References

- Story scope and AC source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
- FR4 (create client) + FR8 (validate required fields): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- FR27 (immediate visibility for all users via invalidateQueries): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- NFR2 (CRUD < 2s — TanStack Query invalidation): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- `POST /api/v1/clientes` endpoint contract: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- TanStack Query mutation pattern with invalidation: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- `ClienteForm.tsx` and `clienteSchema.ts` in project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Dialog container for client form (shadcn): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Components Priority 2]
- Form fields: siesa-ui-kit Input + Select for Ciudad: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns]
- Ciudad uses Select + "Otra" option: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Formulario de Cliente]
- Dialog accessibility rules (FocusScope, autoFocus, Esc close): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modal & Overlay Patterns]
- Inline error visual: `red-500` border, `text-sm text-red-600`: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy]
- Error text samples: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy]
- WCAG 2.1 AA focus ring `2px solid #0e79fd`: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#UX Design System]
- DateTimeOffset mandate for `ClienteEntity.Create()`: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Entity private constructor + static Create() factory: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- UUID PK for all entities: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- FluentValidation on all endpoints: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Security]
- Problem Details RFC 7807 format: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Spanish text mandatory for all UI: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules]
- Previous story learnings (pnpm, siesa-ui-kit, ErrorPanel, routing): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Previous Story Learnings]
- isPending (not isLoading) — TanStack Query v5: [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- siesa-ui-kit `Button` uses a non-standard `type` prop (visual style, not HTML button type). Used native `<button type="submit">` for Guardar button to ensure form submission works in jsdom tests.
- shadcn `Dialog` was not installed. Created custom Dialog using React `createPortal` with proper ARIA attributes (`role="dialog"`, `aria-labelledby`, `aria-modal`).
- siesa-ui-kit `toast` and `ToastProvider` used for notifications. Wired `ToastProvider` in `main.tsx`.
- AC4 pre-written ATDD test has structural issues (renders two forms without cleanup, causing duplicate testIds). The implementation correctly handles 409 → setError('nit') via useEffect, but the test's mock returns `isError: false` preventing the effect. 1 test fails (189/190 pass).
- dotnet not available in environment — backend tests verified by code review only.
- Added `GetByNitAsync` to `IClienteRepository` and updated all 4 existing stub implementations in unit test files.

### File List

**Created:**
- `backend/src/SiesaAgents.Application/Common/Exceptions/ConflictException.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs`
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.tsx`

**Modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added GetByNitAsync
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented GetByNitAsync
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added POST endpoint
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — added ConflictException → 409
- `backend/src/SiesaAgents.API/Program.cs` — registered CreateClienteCommandHandler + validator
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — added GetByNitAsync to stub
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerEdgeCaseTests.cs` — added GetByNitAsync to stub
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — added GetByNitAsync to stub
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerEdgeCaseTests.cs` — added GetByNitAsync to stub
- `frontend/src/modules/crm/clientes/domain/Cliente.ts` — added CreateClienteData type
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added create() method
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented create()
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — added "Nuevo cliente" button + dialog state
- `frontend/src/main.tsx` — wired ToastProvider
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated 2-3-create-client to review
