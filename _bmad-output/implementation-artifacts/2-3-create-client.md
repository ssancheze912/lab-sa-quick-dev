# Story 2.3: Create Client

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad — all marked as required (FR1).

2. **Given** the user fills all required fields and submits the form, **When** the `POST /api/v1/clientes` request succeeds with HTTP 201, **Then** the new client appears in the left panel client list immediately without a page reload (FR27), **And** the right panel shows the newly created client's detail, **And** a toast displays "Cliente creado correctamente".

3. **Given** the user clicks "Guardar" with one or more required fields empty, **When** the form is validated (Zod schema), **Then** clear inline error messages appear below each empty field in Spanish, **And** no HTTP request is sent to the backend (FR8).

4. **Given** the user clicks "Guardar" with one or more required fields containing only whitespace, **When** the form is validated, **Then** inline error messages appear treating whitespace-only values as empty, **And** no HTTP request is sent.

5. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns HTTP 409 Conflict, **Then** an error message "El NIT/RUC ya está registrado" is displayed in the form without exposing stack traces or technical details (NFR6).

6. **Given** the create client form is open, **When** the user clicks "Cancelar", **Then** the form closes without sending any request and the client list remains unchanged.

7. **Given** the `POST /api/v1/clientes` endpoint receives a valid request body, **When** all required fields are present and the NIT/RUC is unique, **Then** the backend returns HTTP 201 Created with the full `ClienteDto` JSON (id, nombre, nit, telefono, ciudad, createdAt, updatedAt in camelCase), **And** the `id` field is a UUID (not an integer).

8. **Given** the `POST /api/v1/clientes` endpoint receives a body with any required field empty or whitespace-only, **When** FluentValidation runs, **Then** the backend returns HTTP 400 Bad Request with a Problem Details RFC 7807 response containing an `errors` object listing the invalid fields, **And** no record is persisted.

9. **Given** the `POST /api/v1/clientes` endpoint receives a body with a NIT/RUC that already exists, **When** the uniqueness check runs, **Then** the backend returns HTTP 409 Conflict with a Problem Details RFC 7807 body whose `detail` references the duplicate NIT/RUC, **And** no stack trace is exposed in the response.

## Tasks / Subtasks

### Backend Tasks

- [ ] Task 1 — Create `CreateClienteCommand` and handler in Application layer (AC: #7, #8, #9)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
    ```csharp
    public record CreateClienteCommand(string Nombre, string Nit, string Telefono, string Ciudad) : IRequest<ClienteDto>;
    ```
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
    - Inject `IClienteRepository` and `IUnitOfWork` (or just repository if UoW is implicit in EF Core context)
    - Check NIT uniqueness via `IClienteRepository.ExistsByNitAsync(command.Nit)` — if exists, throw `DuplicateNitException` (or return a domain error)
    - Call `ClienteEntity.Create(command.Nombre, command.Nit, command.Telefono, command.Ciudad)` (factory pattern — company standard)
    - Persist via `IClienteRepository.AddAsync(entity)` and save changes
    - Map entity to `ClienteDto` and return it
  - [ ] Verify `ClienteDto` is already defined in Stories 2.1–2.2 — no new DTO needed (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`)
  - [ ] Add `CreateClienteRequest.cs` DTO to `backend/src/SiesaAgents.Application/Clientes/DTOs/` if not already present:
    ```csharp
    public record CreateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);
    ```

- [ ] Task 2 — Create `CreateClienteRequestValidator` with FluentValidation (AC: #8)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
    ```csharp
    public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
    {
        public CreateClienteRequestValidator()
        {
            RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido.");
            RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es requerido.");
            RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es requerido.");
            RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es requerida.");
        }
    }
    ```
  - [ ] Register the validator in `Program.cs` via `builder.Services.AddValidatorsFromAssemblyContaining<CreateClienteRequestValidator>()`
  - [ ] `NotEmpty()` in FluentValidation rejects both `""` and whitespace-only strings — no additional `.Must()` needed

- [ ] Task 3 — Add `POST /api/v1/clientes` Minimal API endpoint (AC: #7, #8, #9)
  - [ ] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add inside `MapClienteEndpoints`:
    ```csharp
    app.MapPost("/api/v1/clientes", async (
        CreateClienteRequest request,
        IValidator<CreateClienteRequest> validator,
        IMediator mediator,
        CancellationToken ct) =>
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var result = await mediator.Send(
            new CreateClienteCommand(request.Nombre, request.Nit, request.Telefono, request.Ciudad), ct);
        return Results.Created($"/api/v1/clientes/{result.Id}", result);
    })
    .WithName("CreateCliente")
    .WithTags("Clientes");
    ```
  - [ ] `ExceptionHandlingMiddleware` (already registered in Story 1.3) catches `DuplicateNitException` → returns HTTP 409 Problem Details. Verify the middleware maps this exception type to 409.
  - [ ] If middleware does not yet handle `DuplicateNitException`, add a case:
    ```csharp
    case DuplicateNitException ex:
        return Results.Problem(
            title: "Conflicto de datos",
            detail: $"El NIT/RUC '{ex.Nit}' ya está registrado.",
            statusCode: 409);
    ```
  - [ ] Add `IClienteRepository.ExistsByNitAsync(string nit, CancellationToken ct)` to the domain interface and implement in `ClienteRepository.cs` using EF Core `AnyAsync`

- [ ] Task 4 — Implement `ClienteEntity.Create` factory method (AC: #7)
  - [ ] In `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`, ensure the static factory exists:
    ```csharp
    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        return new ClienteEntity
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
    ```
  - [ ] Private constructor is mandatory per company entity pattern (prevents direct instantiation)
  - [ ] `DateTimeOffset` — NEVER `DateTime` (company standard)

- [ ] Task 5 — Backend unit tests for `CreateClienteCommandHandler` (AC: #7, #8, #9)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
  - [ ] Test: handler creates entity, calls `AddAsync` and saves, returns `ClienteDto` with matching fields (happy path)
  - [ ] Test: handler returns `ClienteDto` with non-empty UUID `id` (R-008 mitigation)
  - [ ] Test: handler throws `DuplicateNitException` when `ExistsByNitAsync` returns `true`
  - [ ] Use Moq or NSubstitute; structure: Arrange / Act / Assert

- [ ] Task 6 — Backend integration tests for `POST /api/v1/clientes` (AC: #7, #8, #9 — tests TC-E2-P0-02, TC-E2-P0-05, TC-E2-P0-06)
  - [ ] In `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`, add:
  - [ ] TC-E2-P0-06: `POST /api/v1/clientes` returns 201 + `ClienteDto` with UUID `id` matching regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
  - [ ] TC-E2-P0-05 (Theory): `POST /api/v1/clientes` returns 400 + `application/problem+json` for empty `nombre`, whitespace `nombre`, empty `nit`, empty `telefono`, empty `ciudad`
  - [ ] TC-E2-P0-02: `POST /api/v1/clientes` with duplicate NIT returns 409 + `application/problem+json` with no `stackTrace` in body
  - [ ] Use `WebApplicationFactory<Program>` + PostgreSQL TestContainers

### Frontend Tasks

- [ ] Task 7 — Create `clienteSchema` Zod validation schema (AC: #3, #4)
  - [ ] Verify `frontend/src/modules/crm/clientes/application/clienteSchema.ts` exists (referenced in architecture). If not, create it:
    ```typescript
    import { z } from 'zod'

    export const createClienteSchema = z.object({
      nombre: z.string().min(1, 'El nombre es requerido').trim(),
      nit: z.string().min(1, 'El NIT/RUC es requerido').trim(),
      telefono: z.string().min(1, 'El teléfono es requerido').trim(),
      ciudad: z.string().min(1, 'La ciudad es requerida').trim(),
    })

    export type CreateClienteFormValues = z.infer<typeof createClienteSchema>
    ```
  - [ ] `.trim()` before `.min(1)` ensures whitespace-only strings fail validation (AC: #4)

- [ ] Task 8 — Implement `useCreateCliente` TanStack Query mutation hook (AC: #2, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
    ```typescript
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import { isAxiosError } from 'axios'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import type { CreateClienteFormValues } from './clienteSchema'

    export function useCreateCliente() {
      const queryClient = useQueryClient()

      return useMutation({
        mutationFn: (data: CreateClienteFormValues) => clienteApiRepository.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] })
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.status === 409) {
            // 409 handled in the form UI — do not show generic toast
            return
          }
        },
      })
    }
    ```
  - [ ] `invalidateQueries({ queryKey: ['clientes'] })` triggers automatic re-fetch of the client list — FR27 compliance (changes visible immediately)
  - [ ] Toast "Cliente creado correctamente" is called from the form `onSuccess` callback (not the hook) — keeps toast presentation logic in the presentation layer

- [ ] Task 9 — Add `create` method to `IClienteRepository` and `clienteApiRepository` (AC: #2, #7)
  - [ ] In `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`, add:
    ```typescript
    create(data: CreateClienteFormValues): Promise<Cliente>
    ```
  - [ ] Implement in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```typescript
    async create(data: CreateClienteFormValues): Promise<Cliente> {
      const response = await apiClient.post<Cliente>('/api/v1/clientes', data)
      return response.data
    }
    ```
  - [ ] Axios throws `AxiosError` on 4xx/5xx — the hook exposes `isError` and `error` for handling in the form

- [ ] Task 10 — Create `ClienteForm` presentation component (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
  - [ ] Use React Hook Form + Zod resolver (`@hookform/resolvers/zod`)
  - [ ] Props: `{ onSuccess?: (cliente: Cliente) => void; onCancel?: () => void }`
  - [ ] Fields (all required, all labeled in Spanish):
    - Nombre (`type="text"`, placeholder "Nombre completo del cliente")
    - NIT/RUC (`type="text"`, placeholder "Ej: 900123456-7")
    - Teléfono (`type="text"`, placeholder "Ej: 601 234 5678")
    - Ciudad (`type="text"`, placeholder "Ej: Bogotá")
  - [ ] Each field renders its inline error below the input: `{errors.nombre && <span role="alert" className="text-sm text-red-600">{errors.nombre.message}</span>}`
  - [ ] On successful submit:
    1. Call `mutate(formValues)` from `useCreateCliente`
    2. In `onSuccess` callback: call `toast.success('Cliente creado correctamente')`, call `onSuccess?.(newCliente)`, reset form
  - [ ] 409 conflict: check `isAxiosError(error) && error.response?.status === 409` → set a form-level error or display an error banner with "El NIT/RUC ya está registrado" — do NOT expose `error.message` or any technical detail (NFR6)
  - [ ] "Guardar" button: `disabled` while `isPending` to prevent double-submit
  - [ ] "Cancelar" button: calls `onCancel?.()` without submitting
  - [ ] Check `siesa-ui-kit` catalog first for Form, Input, Button, and Dialog components before creating custom ones
  - [ ] All labels and error messages MUST be in Spanish
  - [ ] WCAG 2.1 AA: all inputs have `htmlFor`-linked `<label>`, error messages use `role="alert"`, form container has `aria-label="Crear nuevo cliente"`

- [ ] Task 11 — Integrate `ClienteForm` into the `/clientes` view via a "Nuevo cliente" trigger (AC: #1, #2, #6)
  - [ ] The UX for this story uses a Dialog (modal) triggered by "Nuevo cliente" button in the left panel header
  - [ ] Check `siesa-ui-kit` for a Dialog/Modal component first; fall back to `shadcn/ui` Dialog (already added in architecture setup: `npx shadcn@latest add dialog`)
  - [ ] In `frontend/src/routes/_app/clientes.tsx` (or `ClienteListView.tsx`):
    - Add "Nuevo cliente" button (Heroicons `PlusIcon` or `UserPlusIcon`) in the left panel header
    - On click: open Dialog with `<ClienteForm />`
    - Pass `onSuccess` callback to `ClienteForm`: closes the dialog and navigates to `/clientes/:newClienteId` to show the new client's detail in the right panel
    - Pass `onCancel` callback: closes the dialog
  - [ ] After successful creation, `queryClient.invalidateQueries({ queryKey: ['clientes'] })` (triggered inside `useCreateCliente`) ensures the list updates immediately — no additional refetch call needed

- [ ] Task 12 — Frontend unit test for `useCreateCliente` hook (AC: #2, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
  - [ ] Test: hook calls `POST /api/v1/clientes` and invalidates `['clientes']` query key on success (MSW intercepts)
  - [ ] Test: hook exposes `isError: true` when API returns 500
  - [ ] Test: hook does NOT call toast directly (toast is caller's responsibility)
  - [ ] Test: hook does NOT invalidate on 409 response
  - [ ] Wrap in `QueryClientWrapper` test utility (established in Story 2.1)

- [ ] Task 13 — Frontend component tests for `ClienteForm` (AC: #1, #3, #4, #5, #6 — covers TC-E2-P0-08)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
  - [ ] TC-E2-P0-08: Render `<ClienteForm />`, submit with all empty fields → assert 4 inline error messages visible, assert zero MSW HTTP calls
  - [ ] Test: submit with valid data → assert `POST /api/v1/clientes` called with correct body (MSW intercept), assert `onSuccess` callback invoked
  - [ ] Test: 409 response from MSW → assert "El NIT/RUC ya está registrado" visible, no stack trace or technical message visible, form NOT dismissed
  - [ ] Test: "Cancelar" button click → assert `onCancel` called, assert no HTTP request sent
  - [ ] Test: "Guardar" button is disabled while mutation is pending
  - [ ] Test: whitespace-only inputs (e.g., `"   "`) → inline errors visible, no HTTP request (AC: #4)
  - [ ] Accessibility: `axe` via `@axe-core/react` — assert no WCAG 2.1 AA violations
  - [ ] Use MSW to intercept `POST /api/v1/clientes`

- [ ] Task 14 — Frontend unit tests for `clienteSchema` (AC: #3, #4)
  - [ ] Create or update `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`
  - [ ] Test: empty string for each required field fails with Spanish error message
  - [ ] Test: whitespace-only string (e.g., `"   "`) for each required field fails validation
  - [ ] Test: valid values for all fields pass validation

- [ ] Task 15 — E2E test — Create Client happy path (TC-E2-P0-01)
  - [ ] Add Playwright test to `e2e/tests/clientes/create-client.spec.ts`
  - [ ] TC-E2-P0-01: Navigate to `/clientes`, click "Nuevo cliente", fill all fields, click "Guardar" → assert toast "Cliente creado correctamente", assert new client in list, assert right panel shows detail
  - [ ] Assert `id` in network response matches UUID format (R-008 mitigation)
  - [ ] Use TestContainers or a seeded test database

## Dev Notes

### Architecture Patterns

This story implements the write (create) slice of the Client Management module. It adds the create path to the `clientes` domain module, which follows Clean Architecture + DDD on both frontend and backend.

**Frontend architecture flow (create):**
```
Route: _app/clientes.tsx (Nuevo cliente button → Dialog)
  └── ClienteForm.tsx                  [presentation]
        └── useCreateCliente.ts        [application — TanStack Query mutation]
              └── clienteApiRepository.create()  [infrastructure — Axios]
                    └── POST /api/v1/clientes
                          └── invalidateQueries(['clientes']) → list refreshes
```

**Backend CQRS flow (create):**
```
ClienteEndpoints.cs → POST /api/v1/clientes
  ├── IValidator<CreateClienteRequest> → FluentValidation → 400 if invalid
  └── MediatR → CreateClienteCommandHandler.cs       [application]
        ├── IClienteRepository.ExistsByNitAsync()    [domain interface]
        │     └── DuplicateNitException → 409 via ExceptionHandlingMiddleware
        └── IClienteRepository.AddAsync(entity)      [infrastructure — EF Core]
              └── AppDbContext.SaveChangesAsync()
```

### UI: Form Trigger Pattern

The create form opens as a **Dialog (modal)**, triggered by a "Nuevo cliente" button in the left panel header. This aligns with the UX specification for the split-panel layout — no full-panel navigation occurs for simple CRUD forms.

**Component hierarchy check for siesa-ui-kit:**
- Check `siesa-ui-kit` for: Form, Input/TextField, Button, Dialog/Modal components
- If siesa-ui-kit provides a Dialog component → use it directly
- If not found → use `shadcn/ui` Dialog (installed in project setup: `npx shadcn@latest add dialog`)
- Do NOT build a custom Dialog from scratch

**MasterCrud applicability:** MasterCrud is NOT applicable here. The architecture specifies a custom split-panel layout (`ClienteListView` + `ClienteDetailView`) for the `/clientes` route. MasterCrud is relevant for future admin screens with full data-grid + form orchestration. The `ClienteForm` component handles only the create (and later edit) form, embedded in a Dialog.

### TanStack Query — Mutation Pattern (mandatory from architecture.md)

```typescript
useMutation({
  mutationFn: clienteApiRepository.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clientes'] })
    toast.success('Cliente creado correctamente')   // Spanish always
  },
  onError: (error) => {
    if (isAxiosError(error) && error.response?.status === 409) {
      // 409 is a business condition — handled in form UI, not toast
      return
    }
    toast.error('No se pudo guardar. Intenta de nuevo.')
  }
})
```

`invalidateQueries({ queryKey: ['clientes'] })` triggers an automatic re-fetch of the `GET /api/v1/clientes` list, ensuring the new client appears immediately for all users (FR27). This is the canonical pattern from `architecture.md#Process Patterns`.

### Form Validation — Dual Layer (frontend + backend)

| Layer | Tool | Behavior |
|-------|------|----------|
| Frontend | Zod + React Hook Form | Client-side inline errors, prevents HTTP request when invalid |
| Backend | FluentValidation | Server-side guard, returns 400 + Problem Details RFC 7807 |

Both layers are mandatory per NFR5. Frontend validation provides immediate UX feedback; backend validation is the security/integrity guard.

**Zod schema for `trim()` + `min(1)` pattern:**
```typescript
// This pattern rejects both "" and "   " (whitespace only)
z.string().trim().min(1, 'El campo es requerido')
```

### Error Handling — 409 Conflict (NFR6)

The 409 error message shown to the user must be: **"El NIT/RUC ya está registrado"**

- NEVER expose `error.message`, `error.stack`, or the raw `AxiosError` object
- NEVER show the backend `detail` field directly (it may contain internal field names)
- The form component checks `isAxiosError(error) && error.response?.status === 409` and renders a hardcoded Spanish user-facing message

```typescript
// In ClienteForm.tsx onError handler:
if (isAxiosError(error) && error.response?.status === 409) {
  setNitConflictError(true) // local state
  return
}
// Other errors:
toast.error('No se pudo guardar. Intenta de nuevo.')
```

### Backend — NIT Uniqueness Check

Two valid approaches — choose the one that fits what's already implemented in `ClienteRepository.cs`:

**Option A — Repository check (preferred for clarity):**
```csharp
// In CreateClienteCommandHandler:
if (await _clienteRepository.ExistsByNitAsync(command.Nit, ct))
    throw new DuplicateNitException(command.Nit);
```

**Option B — Catch DB unique constraint violation:**
Catch `DbUpdateException` when PostgreSQL raises a unique key violation on `uk_clientes_nit` and translate to a 409 Problem Details response.

Option A is preferred because it provides a clearer domain intent and avoids relying on a DB exception for business logic. However, Option B can be used as a fallback — verify which approach is consistent with `Story 1.3` and `Story 2.1` patterns.

### API Response Contract

```
POST /api/v1/clientes
  Body: { "nombre": "string", "nit": "string", "telefono": "string", "ciudad": "string" }

Response 201 Created:
{
  "id": "018f1a2b-3c4d-7e5f-a6b7-c8d9e0f1a2b3",   // UUID — not integer
  "nombre": "Empresa Test S.A.",
  "nit": "900123456-7",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-05-24T15:30:00Z",
  "updatedAt": "2026-05-24T15:30:00Z"
}

Response 400 Bad Request (FluentValidation):
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "nombre": ["El nombre es requerido."],
    "nit": ["El NIT/RUC es requerido."]
  }
}

Response 409 Conflict (duplicate NIT):
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El NIT/RUC '900123456-7' ya está registrado."
  // NO stackTrace, NO exception, NO innerException
}
```

Dates in ISO 8601 with timezone. JSON property names in camelCase (.NET auto-serialization). No stack trace in error responses (NFR6).

### Accessibility Requirements (WCAG 2.1 AA)

- Form container: `aria-label="Crear nuevo cliente"`
- Each input has a `<label htmlFor={fieldId}>` — field ID matches input `id`
- Inline error messages: `role="alert"` so screen readers announce them immediately
- 409 conflict message: `role="alert"` in a visible banner within the form
- "Guardar" button: `aria-disabled="true"` when `isPending` (not `disabled` — to maintain focus management)
- All user-facing labels, placeholders, error messages, and button labels MUST be in Spanish
- Dialog/Modal must trap focus within it while open (handled automatically by shadcn/ui Dialog via Radix UI)

### Previous Story Learnings (from Story 2.1 and 2.2)

- `EmptyState` and `ErrorPanel` components already exist in `src/shared/components/` — do not recreate
- `clienteApiRepository.ts` is the single Axios infrastructure file — add `create()` method here, do not create a separate file
- `QueryClientWrapper` test utility already established in Story 2.1 tests — reuse for new hook tests
- `useClientes.ts` uses `queryKey: ['clientes']` — `useCreateCliente` must invalidate this exact key for FR27 compliance
- All Spanish text: labels, placeholders, error messages, toasts, ARIA labels
- `react-loading-skeleton` for loading states (not spinners) — not applicable to this story (form is synchronous until submit), but keep for future states

### Key Files to Create

**Frontend (new files):**
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts` (verify if exists from architecture setup)
- `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- `e2e/tests/clientes/create-client.spec.ts`

**Frontend (files to modify):**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `create(data: CreateClienteFormValues): Promise<Cliente>`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `create()`
- `frontend/src/routes/_app/clientes.tsx` — add "Nuevo cliente" button + Dialog with `<ClienteForm />`

**Backend (new files):**
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs` (verify if exists)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Backend (files to modify):**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add `POST /api/v1/clientes` endpoint
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — add `DuplicateNitException` → 409 mapping
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — verify/add `Create()` factory method
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — add `ExistsByNitAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `ExistsByNitAsync` and `AddAsync`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — add POST integration tests

### Risk Mitigations (from test-design-epic-2.md)

- **R-002** (Duplicate NIT check absent — dirty data): Mitigated by `ExistsByNitAsync` + 409 + frontend "El NIT/RUC ya está registrado" message. Verified by TC-E2-P0-02.
- **R-004** (API accepts empty/whitespace required fields): Mitigated by FluentValidation with `.NotEmpty()` (rejects whitespace). Verified by TC-E2-P0-05.
- **R-008** (Integer PK instead of UUID): Mitigated by `ClienteEntity.Create()` using `Guid.NewGuid()`. Verified by TC-E2-P0-06.

### Project Structure Notes

- `ClienteForm` is a domain-specific component — belongs in `src/modules/crm/clientes/presentation/`, NOT in `src/shared/components/`
- `useCreateCliente.ts` is co-located with `useClientes.ts` inside `application/` — consistent with module structure
- `clienteSchema.ts` belongs in `application/` (validation logic is application-layer concern per Clean Architecture)
- Backend: `CreateClienteCommand`, `CreateClienteCommandHandler`, `CreateClienteRequestValidator` all belong in `SiesaAgents.Application/Clientes/Commands/` and `Validators/` respectively — this mirrors Stories 2.1–2.2 patterns

### References

- Architecture routing decisions and folder structure: [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- Architecture TanStack Query mutation pattern (mandatory): [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Architecture API response shapes (POST → 201 + object): [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- Architecture enforcement guidelines (DateTimeOffset, UUID, Spanish UI, Problem Details): [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Epic 2 Story 2.3 requirements and AC: [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3`]
- FR1, FR8, FR27 detailed definitions: [Source: `_bmad-output/planning-artifacts/prd/functional-requirements.md`]
- NFR5 (FluentValidation), NFR6 (no stack traces — Problem Details RFC 7807): [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Test scenarios TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-05, TC-E2-P0-06, TC-E2-P0-08 and risk matrix (R-002, R-004, R-008): [Source: `_bmad-output/implementation-artifacts/test-design-epic-2.md`]
- Story 2.2 learnings (ErrorPanel, EmptyState reuse, QueryClientWrapper, module structure): [Source: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md`]
- Company standards — backend entity pattern (private constructor + static Create()): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- Company standards — DateTimeOffset, UUID PKs: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- Company standards — all user-facing text in Spanish: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]
- MasterCrud reference (not applicable to this story — custom split-panel CRUD, not a data-grid orchestrator screen): [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
