# Story 2.3: Create Client

Status: ready-for-dev

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1). The form must be presented as a dialog/modal over the existing split-panel layout — no navigation away from `/clientes`.

2. **Given** the user fills all required fields and submits, **When** the form is submitted to `POST /api/v1/clientes`, **Then** the client is created (HTTP 201), the list is refreshed via `queryClient.invalidateQueries({ queryKey: ['clientes'] })` so the new client appears immediately (FR27), and a toast de éxito muestra "Cliente creado correctamente". The form dialog closes automatically on success.

3. **Given** the user submits the form with one or more required fields empty, **When** the Zod schema validates on submit, **Then** clear inline error messages appear on the empty fields (FR8) and the form is NOT submitted to the backend. No `POST /api/v1/clientes` request is made.

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a 409 Conflict (Problem Details RFC 7807), **Then** an error message "El NIT/RUC ya está registrado" is displayed inline in the form without exposing technical details or stack traces (NFR6). The form stays open so the user can correct the value.

5. **Given** the user is in the open form, **When** the user clicks "Cancelar" or dismisses the dialog, **Then** no API call is made and the client list remains unchanged.

6. **Given** the form is submitted and the backend fails with a non-409 error (e.g., 500), **When** the mutation `onError` handler fires, **Then** a toast de error muestra "No se pudo crear el cliente. Intenta de nuevo." The raw error is never shown to the user (NFR6).

## Tasks / Subtasks

- [ ] Task 1 — Backend: `POST /api/v1/clientes` endpoint (AC: #2, #3, #4)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs` — record with `string Nombre`, `string Nit`, `string Telefono`, `string Ciudad`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs` — FluentValidation: all four fields `NotEmpty()` with Spanish error messages; registered in DI via `AddValidatorsFromAssembly`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs` — record with same four fields
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs` — calls `ClienteEntity.Create(...)`, calls `IClienteRepository.AddAsync(entity, ct)`, returns `ClienteDto`
  - [ ] Add `Task AddAsync(ClienteEntity entity, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
  - [ ] Implement `AddAsync` in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — EF Core `Add` + `SaveChangesAsync`
  - [ ] Add `app.MapPost("/api/v1/clientes", ...)` to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    - Validate `CreateClienteRequest` using `IValidator<CreateClienteRequest>`; on failure → `Results.ValidationProblem(errors)` (HTTP 400, Problem Details)
    - Dispatch `CreateClienteCommand` via handler
    - On success → `Results.Created($"/api/v1/clientes/{dto.Id}", dto)` (HTTP 201)
    - `ExceptionHandlingMiddleware` catches `DbUpdateException` with unique constraint violation and returns 409 Problem Details with `detail: "El NIT/RUC ya está registrado"`
    - Decorator: `.WithName("CreateCliente").Produces<ClienteDto>(201).Produces<ValidationProblemDetails>(400).Produces<ProblemDetails>(409)`
  - [ ] Register `ICreateClienteCommandHandler` and `IValidator<CreateClienteRequest>` in `Program.cs` DI
  - [ ] Write unit test `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`:
    - Test: creates entity and returns `ClienteDto` with all fields (Arrange/Act/Assert with mock `IClienteRepository`)
    - Test: `AddAsync` is called exactly once
  - [ ] Write unit test `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs`:
    - Test: empty request fails with errors on all four fields (TC-E2-P2-05)
    - Test: valid request passes validation
  - [ ] Write integration tests in `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (add to existing file):
    - TC-E2-P0-02: `POST /api/v1/clientes` with valid body → 201 + created object; subsequent `GET` returns new client
    - TC-E2-P0-03: `POST /api/v1/clientes` with empty body → 400 Problem Details with field errors for `Nombre`, `Nit`, `Telefono`, `Ciudad`; no `stackTrace` in body (NFR6)
    - TC-E2-P0-04: `POST /api/v1/clientes` with duplicate NIT → 409; `Content-Type: application/problem+json`; `detail` does not contain stack trace

- [ ] Task 2 — Frontend: `useCreateCliente` mutation hook (AC: #2, #4, #6)
  - [ ] Add `create(data: CreateClienteRequest): Promise<Cliente>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [ ] Add `create` implementation to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    - `POST ${VITE_API_URL}/api/v1/clientes` with JSON body → `Promise<Cliente>`
    - On 409 Axios throws — let the hook handle it
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`:
    ```typescript
    export const useCreateCliente = () => {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: clienteApiRepository.create,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] })
          toast.success('Cliente creado correctamente')
        },
        onError: (error) => {
          const is409 = axios.isAxiosError(error) && error.response?.status === 409
          if (is409) return  // handled in form component
          toast.error('No se pudo crear el cliente. Intenta de nuevo.')
        },
      })
    }
    ```
  - [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — Zod schema:
    ```typescript
    export const clienteSchema = z.object({
      nombre: z.string().min(1, 'El nombre es requerido'),
      nit: z.string().min(1, 'El NIT/RUC es requerido'),
      telefono: z.string().min(1, 'El teléfono es requerido'),
      ciudad: z.string().min(1, 'La ciudad es requerida'),
    })
    export type ClienteFormData = z.infer<typeof clienteSchema>
    ```
  - [ ] Write unit tests `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts` (MSW):
    - Test: successful mutation calls `invalidateQueries(['clientes'])` (TC-E2-P2-01)
    - Test: 409 response does NOT call `toast.error` (handled in component)
    - Test: non-409 error calls `toast.error`
  - [ ] Write unit test `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`:
    - TC-E2-P2-04: `clienteSchema.safeParse({})` returns `success: false` with errors for all four fields

- [ ] Task 3 — Frontend: `ClienteForm` component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`:
    - Props: `onSuccess?: () => void` (called after successful creation)
    - Uses React Hook Form + `zodResolver(clienteSchema)` — `mode: 'onSubmit'`
    - Fields (all required): Nombre (text), NIT/RUC (text), Teléfono (text), Ciudad (text)
    - Check siesa-ui-kit catalog for `Input`, `FormField`, `Label` equivalents before building custom inputs
    - If siesa-ui-kit has no form components, use shadcn/ui `Input` + `Label` + TailwindCSS `slate-*` palette
    - Inline validation errors rendered below each field using `formState.errors.{field}.message`
    - Submit button label: "Crear cliente"; Cancel button label: "Cancelar"
    - On submit: call `useCreateCliente().mutate(data)`
    - On 409: set form-level error `setError('nit', { message: 'El NIT/RUC ya está registrado' })` — displayed inline under the NIT field
    - On success: call `onSuccess?.()` and reset form
    - Disable submit button while `isPending` is true — show loading text "Guardando..."
    - All labels, placeholders, errors in Spanish (MANDATORY)
    - WCAG 2.1 AA: `htmlFor`/`id` pairing on all inputs, `aria-describedby` for error messages, `aria-busy` on submit button when pending
  - [ ] Write component tests `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`:
    - TC-E2-P0-08: leave all fields empty, click submit → inline errors appear, no POST made
    - TC-E2-P2-06: MSW returns 409 → "El NIT/RUC ya está registrado" appears under NIT field, no `toast.error` shown
    - Test: valid form → POST fired, `onSuccess` called, form reset
    - Test: non-409 backend error → `toast.error` shown
    - Accessibility check with axe

- [ ] Task 4 — Frontend: "Nuevo cliente" button and dialog wiring (AC: #1, #2, #5)
  - [ ] Update `frontend/src/routes/_app/clientes.tsx`:
    - Add "Nuevo cliente" button (primary action, Heroicons `PlusIcon`) above the `ClienteListView` in the left panel header
    - Manage `isOpen: boolean` with `useState(false)`
    - Render `<Dialog>` (shadcn/ui) with `ClienteForm` inside — `open={isOpen}` / `onOpenChange={setIsOpen}`
    - On `ClienteForm.onSuccess`: close dialog (`setIsOpen(false)`)
    - Button ARIA label: `aria-label="Crear nuevo cliente"` (Spanish)
  - [ ] Update `frontend/src/routes/_app/clientes.$clienteId.tsx`:
    - Mirror the "Nuevo cliente" button + Dialog in the detail route (same split-panel header) so the button is accessible from both routes

- [ ] Task 5 — Frontend: accessibility and siesa-ui-kit audit
  - [ ] Verify `ClienteForm` satisfies WCAG 2.1 AA: keyboard-accessible inputs, visible focus ring, error messages linked via `aria-describedby`, submit button disabled state announced
  - [ ] Check siesa-ui-kit catalog for dialog/modal component before using shadcn/ui `Dialog`

## Dev Notes

### Architecture Context

This story delivers the write path (create) for the `clientes` domain. It builds directly on Stories 2.1 and 2.2 — `ClienteEntity`, `IClienteRepository`, `ClienteRepository`, `ClienteDto`, `clienteApiRepository`, and `useClientes` are all in place.

**Backend layer additions (Story 2.3):**
- **Domain**: Add `AddAsync` to `IClienteRepository` — zero other domain changes
- **Application**: `CreateClienteCommand` + `CreateClienteCommandHandler` + `CreateClienteRequest` + `CreateClienteRequestValidator`
- **Infrastructure**: `ClienteRepository.AddAsync` — EF Core `Add` + `SaveChangesAsync`; `ExceptionHandlingMiddleware` handles 409 for duplicate NIT
- **API**: `POST /api/v1/clientes` endpoint with FluentValidation wiring

**Frontend layer additions (Story 2.3):**
- **Domain**: `create` method on `IClienteRepository.ts`
- **Application**: `useCreateCliente.ts` mutation hook + `clienteSchema.ts` Zod schema
- **Infrastructure**: `clienteApiRepository.create` Axios call
- **Presentation**: `ClienteForm.tsx` — React Hook Form + Zod
- **Routes**: "Nuevo cliente" button + shadcn/ui Dialog in `clientes.tsx` and `clientes.$clienteId.tsx`

### Key Implementation Constraints

**Backend — 409 Duplicate NIT detection:**
```csharp
// ExceptionHandlingMiddleware.cs — add catch for DbUpdateException
catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("uk_clientes_nit") == true)
{
    context.Response.StatusCode = StatusCodes.Status409Conflict;
    await context.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status = 409,
        Title = "Conflicto de datos",
        Detail = "El NIT/RUC ya está registrado"
    });
    return;
}
```

**Backend — CreateClienteCommandHandler entity pattern (consistent with Story 2.1):**
```csharp
public async Task<ClienteDto> Handle(CreateClienteCommand command, CancellationToken ct)
{
    var entity = ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad);
    await _repository.AddAsync(entity, ct);
    return new ClienteDto(entity.Id, entity.Nombre, entity.NIT, entity.Telefono, entity.Ciudad, entity.CreatedAt, entity.UpdatedAt);
}
```

**Backend — FluentValidation integration (Minimal API):**
```csharp
// Program.cs
builder.Services.AddValidatorsFromAssembly(typeof(CreateClienteRequestValidator).Assembly);

// ClienteEndpoints.cs
app.MapPost("/api/v1/clientes", async (
    CreateClienteRequest request,
    IValidator<CreateClienteRequest> validator,
    ICreateClienteCommandHandler handler,
    CancellationToken ct) =>
{
    var validation = await validator.ValidateAsync(request, ct);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());
    var dto = await handler.Handle(new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad), ct);
    return Results.Created($"/api/v1/clientes/{dto.Id}", dto);
})
.WithName("CreateCliente")
.Produces<ClienteDto>(201)
.Produces<ValidationProblemDetails>(400)
.Produces<ProblemDetails>(409);
```

**Backend — FluentValidation error messages (Spanish):**
```csharp
public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido");
        RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es requerido");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es requerido");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es requerida");
    }
}
```

**Frontend — TanStack Query mutation invalidation (FR27 mandatory):**
```typescript
// useCreateCliente.ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['clientes'] })
  toast.success('Cliente creado correctamente')
}
```
This causes the `useClientes` hook from Story 2.1 to re-fetch automatically. The new client appears in the list immediately — FR27 compliance.

**Frontend — 409 handling in ClienteForm:**
```typescript
// ClienteForm.tsx — inside the submit handler
const { mutate, isPending } = useCreateCliente()

const onSubmit = (data: ClienteFormData) => {
  mutate(data, {
    onError: (error) => {
      const is409 = axios.isAxiosError(error) && error.response?.status === 409
      if (is409) {
        setError('nit', { type: 'manual', message: 'El NIT/RUC ya está registrado' })
      }
    },
    onSuccess: () => {
      reset()
      onSuccess?.()
    },
  })
}
```

**Frontend — Dialog wiring in routes:**
```typescript
// clientes.tsx
const [isCreateOpen, setIsCreateOpen] = useState(false)

<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
  <DialogTrigger asChild>
    <button
      onClick={() => setIsCreateOpen(true)}
      aria-label="Crear nuevo cliente"
      className="..."
    >
      <PlusIcon className="h-4 w-4" />
      Nuevo cliente
    </button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nuevo cliente</DialogTitle>
    </DialogHeader>
    <ClienteForm onSuccess={() => setIsCreateOpen(false)} />
  </DialogContent>
</Dialog>
```

**Frontend — Zod schema (canonical, shared with Story 2.4):**
```typescript
// clienteSchema.ts — will be reused by Story 2.4 (Edit Client)
export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  nit: z.string().min(1, 'El NIT/RUC es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
})
export type ClienteFormData = z.infer<typeof clienteSchema>
```

**Frontend — query key canonical form (must match architecture.md):**
```typescript
queryClient.invalidateQueries({ queryKey: ['clientes'] })
// This matches the canonical key from architecture.md — do NOT use string form
```

**Frontend — UI text (all in Spanish, MANDATORY):**
- Button: "Nuevo cliente"
- Dialog title: "Nuevo cliente"
- Field label Nombre: "Nombre"
- Field placeholder Nombre: "Nombre de la empresa o persona"
- Field label NIT/RUC: "NIT/RUC"
- Field placeholder NIT/RUC: "Ej. 900123456-1"
- Field label Teléfono: "Teléfono"
- Field placeholder Teléfono: "Ej. 3001234567"
- Field label Ciudad: "Ciudad"
- Field placeholder Ciudad: "Ej. Bogotá"
- Submit button: "Crear cliente" / "Guardando..." (while pending)
- Cancel button: "Cancelar"
- Success toast: "Cliente creado correctamente"
- Error toast (non-409): "No se pudo crear el cliente. Intenta de nuevo."
- Duplicate NIT inline error: "El NIT/RUC ya está registrado"
- Required field inline errors: per Zod schema messages above

**MasterCrud assessment:** NOT applicable for this story. The create form is a modal dialog opened from a custom split-panel layout. MasterCrud is designed for standalone tabular CRUD screens with a built-in data grid — the `/clientes` split-panel with a 280px left list and form dialog does not map to MasterCrud's model. The `ClienteForm` is a project-specific lightweight form component.

**Skeleton / loading states:** No skeleton needed in the form itself. The submit button shows "Guardando..." text and is disabled while `isPending` is true (no spinner per company standards — use text feedback on the button).

**siesa-ui-kit check (MANDATORY):**
1. Before implementing the Dialog: check siesa-ui-kit for a modal/dialog component. If found, use it instead of shadcn/ui `Dialog`.
2. Before implementing form inputs: check siesa-ui-kit for `Input`, `Label`, `FormField` components. If found, use them. Otherwise fall back to shadcn/ui.
3. Check siesa-ui-kit for a toast/notification component. If not found, use shadcn/ui `toast` or a compatible solution.

### Project Structure Notes

Files to create/modify in this story:

**Backend:**
```
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs         [MODIFY — add AddAsync]
backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs        [NEW]
backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs    [NEW]
backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs [NEW]
backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs [NEW]
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs         [MODIFY — add AddAsync]
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                        [MODIFY — add POST endpoint]
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs             [MODIFY — add 409 DbUpdateException handler]
backend/src/SiesaAgents.API/Program.cs                                           [MODIFY — register ICreateClienteCommandHandler + validators]
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs [NEW]
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs [NEW]
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs              [MODIFY — add TC-E2-P0-02, TC-E2-P0-03, TC-E2-P0-04]
```

**Frontend:**
```
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts                  [MODIFY — add create method]
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts        [MODIFY — add create method]
frontend/src/modules/crm/clientes/application/useCreateCliente.ts               [NEW]
frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts          [NEW]
frontend/src/modules/crm/clientes/application/clienteSchema.ts                  [NEW]
frontend/src/modules/crm/clientes/application/clienteSchema.test.ts             [NEW]
frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx                  [NEW]
frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx             [NEW]
frontend/src/routes/_app/clientes.tsx                                           [MODIFY — add "Nuevo cliente" button + Dialog]
frontend/src/routes/_app/clientes.$clienteId.tsx                               [MODIFY — add "Nuevo cliente" button + Dialog]
```

**Alignment with architecture.md:**
- `useCreateCliente.ts` matches defined hook in `application/` layer (architecture.md Complete Project Directory Structure)
- `clienteSchema.ts` matches defined schema file in `application/` layer
- `ClienteForm.tsx` matches defined component in `presentation/` layer
- Mutation invalidates `['clientes']` — canonical key from architecture.md
- `POST /api/v1/clientes` matches defined REST endpoint
- Returns 201 Created + object body (per architecture.md format patterns)
- Error format: Problem Details RFC 7807 (per company standards)

### Test Design References (Epic 2 Test Plan)

Tests for this story (from `test-design-epic-2.md`):

**P0 — Must pass before implementation begins:**
- **TC-E2-P0-02**: `POST /api/v1/clientes` creates client (201) and appears in `GET` (xUnit integration)
- **TC-E2-P0-03**: `POST /api/v1/clientes` empty body → 400 Problem Details with field errors, no stackTrace (xUnit integration) — mitigates R-010
- **TC-E2-P0-04**: `POST /api/v1/clientes` duplicate NIT → 409, no stack trace (xUnit integration) — mitigates R-002
- **TC-E2-P0-07**: Create client E2E: toast + list update immediately (Playwright) — mitigates R-005
- **TC-E2-P0-08**: Required field validation prevents form submission (Vitest + RTL) — mitigates R-010

**P2 — Should pass before epic is marked complete:**
- **TC-E2-P2-01**: `useCreateCliente` calls `invalidateQueries(['clientes'])` on success (Vitest unit) — mitigates R-005
- **TC-E2-P2-04**: `clienteSchema.safeParse({})` returns errors for all four fields (Vitest unit)
- **TC-E2-P2-05**: `CreateClienteRequestValidator` rejects empty fields with human-readable messages (xUnit unit)
- **TC-E2-P2-06**: 409 response surfaces "El NIT/RUC ya está registrado" in UI without raw error (Vitest + RTL) — mitigates R-002

**Risks mitigated by this story:**
- R-002 (NIT duplicate detection — Score 6): TC-E2-P0-04 + TC-E2-P2-06
- R-005 (invalidateQueries not triggered — Score 4): TC-E2-P0-07 + TC-E2-P2-01
- R-010 (inline validation errors not rendered — Score 2): TC-E2-P0-08 + TC-E2-P2-04 + TC-E2-P2-05

### References

- Epic definition and Story 2.3 AC: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
- Architecture API contract (POST → 201, validation → 400, Problem Details): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture complete directory structure (hooks, components, routes): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture mutation pattern (invalidateQueries + toast): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Architecture enforcement guidelines (DateTimeOffset, Scalar, Spanish UI): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture requirements mapping (FR4 → ClienteForm + useCreateCliente + CreateClienteCommandHandler; FR7/FR8 → validators + schema): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- TanStack Query canonical keys (['clientes']): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Error handling frontend pattern (never expose raw error, toast for mutations): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- NFR2 (CRUD < 2s via TanStack Query invalidation): [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- NFR5 (FluentValidation + Zod double validation): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- NFR6 (no stack traces, Problem Details only): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- ClienteEntity pattern (private constructor + static Create() factory): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- EF Core configuration pattern (ApplySnakeCaseNaming, no manual [Column]): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- Story 2.1 established entities, repository interfaces, Axios client, QueryClient: [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#File List]
- Story 2.2 established ClienteDetailView, useCliente, route deep linking: [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#File List]
- Test cases TC-E2-P0-02, TC-E2-P0-03, TC-E2-P0-04, TC-E2-P0-07, TC-E2-P0-08, TC-E2-P2-01, TC-E2-P2-04, TC-E2-P2-05, TC-E2-P2-06: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Risk R-002 (duplicate NIT), R-005 (query invalidation), R-010 (validation rendering): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#Risk Assessment]
- MasterCrud API reference — NOT applicable: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Company standards (Clean Architecture + DDD, Spanish text, DateTimeOffset, Scalar): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
