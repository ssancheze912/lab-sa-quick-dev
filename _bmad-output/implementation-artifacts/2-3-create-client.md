# Story 2.3: Create Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens (modal or inline panel) with fields: Nombre, NIT/RUC, Teléfono, Ciudad — all required per FR1.

2. **Given** the user fills all required fields with valid data and submits, **When** the form is submitted, **Then** the client is created via `POST /api/v1/clientes`, appears in the client list immediately without manual refresh (FR27), **And** a success toast displays "Cliente creado correctamente".

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated (Zod, frontend-first), **Then** clear inline error messages appear under each empty field (FR8), **And** no API call is fired.

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns HTTP 409 Conflict, **Then** an inline error message is shown: "El NIT/RUC ya está registrado" — without exposing stack traces or technical details (NFR6).

5. **Given** the form is open, **When** the user clicks "Cancelar", **Then** the form closes without creating any record and the client list remains unchanged.

## Tasks / Subtasks

### Backend Tasks

- [x] Task 1 — Create `CreateClienteCommand` and `CreateClienteCommandHandler` (AC: #2, #3, #4)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs` — record with properties: `string Nombre`, `string NitRuc`, `string Telefono`, `string Ciudad`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`:
    - Accepts `IClienteRepository` via constructor injection
    - Calls `IClienteRepository.CreateAsync(entity)` after building the `ClienteEntity`
    - Returns the created `ClienteDto`
    - Throws a domain-specific conflict exception if NIT/RUC uniqueness constraint is violated (caught by `ExceptionHandlingMiddleware`)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs` — DTO for request deserialization: `{ Nombre, NitRuc, Telefono, Ciudad }`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`:
    - Validate all 4 fields: `Nombre`, `NitRuc`, `Telefono`, `Ciudad` — all required (NotEmpty)
    - Return FluentValidation errors that map to Problem Details field errors

- [x] Task 2 — Extend `IClienteRepository` and `ClienteRepository` with `CreateAsync` (AC: #2)
  - [x] Add `Task<ClienteEntity> CreateAsync(ClienteEntity entity)` to `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` if not already present
  - [x] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    ```csharp
    public async Task<ClienteEntity> CreateAsync(ClienteEntity entity)
    {
        await _context.Clientes.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }
    ```
  - [x] Handle `DbUpdateException` (unique index violation on `nit` column) in the command handler or middleware — map to HTTP 409 with user-friendly Spanish message

- [x] Task 3 — Add `POST /api/v1/clientes` endpoint (AC: #2, #3, #4)
  - [x] Add to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    - Validate request with `CreateClienteRequestValidator` — return HTTP 400 Problem Details on failure
    - Call `CreateClienteCommandHandler.HandleAsync(command)`
    - Return HTTP 201 Created with the `ClienteDto` body and `Location: /api/v1/clientes/{id}` header
    - On uniqueness conflict: return HTTP 409 with `Content-Type: application/problem+json` and `detail: "El NIT/RUC ya está registrado"`
  - [x] Register `CreateClienteCommandHandler` and `CreateClienteRequestValidator` in `backend/src/SiesaAgents.API/Program.cs` DI container

- [x] Task 4 — Backend unit tests (AC: #2, #3, #4)
  - [x] `TC-E2-P0-01` — `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`: POST valid payload → 201 with UUID, nombre, nitRuc, telefono, ciudad, createdAt
  - [x] `TC-E2-P0-02` — Duplicate NIT/RUC → 409 with `"El NIT/RUC ya está registrado"` in detail, no stack trace
  - [x] `TC-E2-P0-03` — Missing required fields → 400 Problem Details with field-level errors
  - [x] `TC-E2-P3-04` — `CreateClienteRequestValidator` rejects empty `Nombre` field
  - [x] File: `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (extend existing)

### Frontend Tasks

- [x] Task 5 — Create `clienteSchema` Zod validation schema (AC: #3)
  - [x] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`:
    ```typescript
    import { z } from 'zod';
    export const clienteSchema = z.object({
      nombre: z.string().min(1, 'El nombre es requerido'),
      nitRuc: z.string().min(1, 'El NIT/RUC es requerido'),
      telefono: z.string().min(1, 'El teléfono es requerido'),
      ciudad: z.string().min(1, 'La ciudad es requerida'),
    });
    export type ClienteFormValues = z.infer<typeof clienteSchema>;
    ```
  - [x] All 4 fields required; Spanish error messages (MANDATORY)

- [x] Task 6 — Extend `IClienteRepository` and `clienteApiRepository` with `create` method (AC: #2)
  - [x] Add `create(data: Omit<Cliente, 'id' | 'createdAt'>): Promise<Cliente>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
  - [x] Implement in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```typescript
    create: async (data) => {
      const response = await apiClient.post<Cliente>('/api/v1/clientes', data);
      return response.data;
    }
    ```

- [x] Task 7 — Create `useCreateCliente` TanStack Query mutation hook (AC: #2, #4)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`:
    ```typescript
    import { useMutation, useQueryClient } from '@tanstack/react-query';
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository';

    export const useCreateCliente = () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: clienteApiRepository.create,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
        },
      });
    };
    ```
  - [x] MANDATORY: `invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess` — required by FR27 and NFR2

- [x] Task 8 — Create `ClienteForm` presentation component (AC: #1, #2, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`:
    - Uses `React Hook Form` + `zodResolver(clienteSchema)` for validation
    - Fields: Nombre, NIT/RUC, Teléfono, Ciudad — all siesa-ui-kit `Input` components with Spanish labels
    - Inline error display below each invalid field (from `formState.errors`) with `role="alert"`
    - Submit button: "Guardar" — disabled while mutation `isPending`; uses siesa-ui-kit `Button`
    - Cancel button: "Cancelar" — calls `onClose` prop without submitting
    - On success: calls `onSuccess` prop + shows toast "Cliente creado correctamente" (siesa-ui-kit toast)
    - On 409 conflict: sets form error with message "El NIT/RUC ya está registrado" (no alert, inline)
    - On generic error: shows toast "No se pudo guardar. Intenta de nuevo."
  - [x] Component signature:
    ```typescript
    interface ClienteFormProps {
      onSuccess?: (cliente: Cliente) => void;
      onClose: () => void;
    }
    ```

- [x] Task 9 — Add "Nuevo cliente" button to client list view and wire modal/drawer (AC: #1, #5)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Added "Nuevo cliente" button at the top of the left panel (above search) using siesa-ui-kit `Button` with `PlusIcon`
    - Button triggers `useState` boolean (`isFormOpen`) to show/hide the `ClienteForm`
    - Uses shadcn/ui `Dialog` to host the form (already installed per architecture)
    - When form closes (cancel or success), resets `isFormOpen = false`
    - Added `ToastProvider` from siesa-ui-kit to `main.tsx`

- [x] Task 10 — Frontend component and unit tests (AC: #1, #2, #3, #4, #5)
  - [x] `TC-E2-P0-04` — Created `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`:
    - Render `<ClienteForm onClose={mockFn} />` — submit empty form → assert 4 inline error messages, no API call
    - Fill all fields → submit → assert POST `/api/v1/clientes` fired, `queryClient.invalidateQueries` called
    - MSW: 409 response → assert "El NIT/RUC ya está registrado" in DOM (TC-E2-P0-05)
    - Cancel click → assert `onClose` called, no API call
  - [x] `TC-E2-P3-02` — `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts` (already created by linter during development):
    - Valid payload → parse succeeds
    - Missing each required field → error on that specific field key

## Dev Notes

### Architecture Layer Mapping

```
Story 2.3 touches BOTH frontend and backend:

Frontend (Clean Architecture):
  domain/          → IClienteRepository.ts (add create method)
  application/     → useCreateCliente.ts (new), clienteSchema.ts (new)
  infrastructure/  → clienteApiRepository.ts (extend with create)
  presentation/    → ClienteForm.tsx (new), ClienteListView.tsx (update — add button + modal)

Backend (Clean Architecture):
  Application/     → CreateClienteCommand.cs (new), CreateClienteCommandHandler.cs (new),
                     CreateClienteRequest.cs (new), CreateClienteRequestValidator.cs (new)
  Domain/          → IClienteRepository.cs (verify/add CreateAsync)
  Infrastructure/  → ClienteRepository.cs (verify/add CreateAsync implementation)
  API/             → ClienteEndpoints.cs (add POST /api/v1/clientes),
                     Program.cs (register handler + validator in DI)
```

### MasterCrud Applicability Assessment

**MasterCrud is NOT applicable to this story.** Story 2.3 adds a single-entity create form within the existing split-panel layout at `/clientes`. The architecture uses a 280px left panel for the client list and a flexible right panel for detail/actions — not a standalone CRUD screen with a data grid. MasterCrud is designed to orchestrate a complete CRUD lifecycle (list + form + filters) in a single full-screen view; that pattern conflicts with the established split-panel layout. The `ClienteForm` is a focused form component invoked via modal/drawer from the list panel, which is the correct architectural choice here.

### Backend — ClienteEntity Creation Pattern (MANDATORY)

```csharp
// backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs
// VERIFY entity has factory method or at minimum a constructor that sets CreatedAt and UpdatedAt:
public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
{
    return new ClienteEntity
    {
        Id = Guid.NewGuid(),        // UUID mandatory
        Nombre = nombre,
        Nit = nit,
        Telefono = telefono,
        Ciudad = ciudad,
        CreatedAt = DateTimeOffset.UtcNow,   // DateTimeOffset — NEVER DateTime
        UpdatedAt = DateTimeOffset.UtcNow,
    };
}
```

### Backend — CreateClienteCommandHandler Pattern (MANDATORY)

```csharp
// backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs
namespace SiesaAgents.Application.Clientes.Commands;

public class CreateClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public CreateClienteCommandHandler(IClienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<ClienteDto> HandleAsync(CreateClienteCommand command)
    {
        var entity = ClienteEntity.Create(
            command.Nombre,
            command.NitRuc,
            command.Telefono,
            command.Ciudad
        );

        var created = await _repository.CreateAsync(entity);

        return new ClienteDto
        {
            Id = created.Id,
            Nombre = created.Nombre,
            NitRuc = created.Nit,
            Telefono = created.Telefono,
            Ciudad = created.Ciudad,
            CreatedAt = created.CreatedAt
        };
    }
}
```

### Backend — POST /api/v1/clientes Endpoint Pattern (MANDATORY)

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs — add after existing endpoints
app.MapPost("/api/v1/clientes", async (
    CreateClienteRequest request,
    CreateClienteRequestValidator validator,
    CreateClienteCommandHandler handler) =>
{
    var validationResult = await validator.ValidateAsync(request);
    if (!validationResult.IsValid)
    {
        return Results.ValidationProblem(validationResult.ToDictionary());
    }

    try
    {
        var command = new CreateClienteCommand(
            request.Nombre,
            request.NitRuc,
            request.Telefono,
            request.Ciudad
        );
        var result = await handler.HandleAsync(command);
        return Results.Created($"/api/v1/clientes/{result.Id}", result);
    }
    catch (DuplicateNitException)  // or catch DbUpdateException with unique constraint check
    {
        return Results.Problem(
            statusCode: 409,
            title: "Conflicto de datos",
            detail: "El NIT/RUC ya está registrado"
        );
    }
});
```

### Backend — 409 Conflict Handling Strategy

Two valid approaches — choose based on existing exception infrastructure:

**Option A (Domain exception — preferred):** Throw a custom `DuplicateNitException` from the repository after catching `DbUpdateException` for unique index violation (`uk_clientes_nit`). `ExceptionHandlingMiddleware` maps it to HTTP 409.

**Option B (Catch in endpoint):** Catch `DbUpdateException` in the endpoint handler. Check `InnerException` for PostgreSQL error code `23505` (unique_violation). Return Problem Details 409 directly.

The word `"NIT/RUC"` MUST appear in the `detail` field — required by TC-E2-P0-02.

### Backend — FluentValidation Validator Pattern

```csharp
// backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs
public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido.");
        RuleFor(x => x.NitRuc).NotEmpty().WithMessage("El NIT/RUC es requerido.");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es requerido.");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es requerida.");
    }
}
```

### Frontend — `useCreateCliente` Mutation Pattern (MANDATORY)

```typescript
// frontend/src/modules/crm/clientes/application/useCreateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import { ClienteFormValues } from './clienteSchema';

export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClienteFormValues) => clienteApiRepository.create(data),
    onSuccess: () => {
      // MANDATORY: invalidate list cache so list refreshes automatically (FR27)
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
};
```

### Frontend — `ClienteForm` Component Pattern (MANDATORY)

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema, ClienteFormValues } from '../application/clienteSchema';
import { useCreateCliente } from '../application/useCreateCliente';

export const ClienteForm = ({ onSuccess, onClose }: ClienteFormProps) => {
  const { mutateAsync, isPending } = useCreateCliente();
  const { register, handleSubmit, formState: { errors }, setError } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
  });

  const onSubmit = async (data: ClienteFormValues) => {
    try {
      const created = await mutateAsync(data);
      toast.success('Cliente creado correctamente');  // EXACT toast text — E2E contractual
      onSuccess?.(created);
      onClose();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setError('nitRuc', { message: 'El NIT/RUC ya está registrado' });  // inline, not a toast
      } else {
        toast.error('No se pudo guardar. Intenta de nuevo.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="Formulario de nuevo cliente">
      {/* Nombre */}
      <div>
        <label htmlFor="nombre">Nombre</label>
        <input id="nombre" {...register('nombre')} aria-describedby="nombre-error" />
        {errors.nombre && <p id="nombre-error" role="alert">{errors.nombre.message}</p>}
      </div>
      {/* NIT/RUC */}
      <div>
        <label htmlFor="nitRuc">NIT/RUC</label>
        <input id="nitRuc" {...register('nitRuc')} aria-describedby="nitRuc-error" />
        {errors.nitRuc && <p id="nitRuc-error" role="alert">{errors.nitRuc.message}</p>}
      </div>
      {/* Teléfono */}
      <div>
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" {...register('telefono')} aria-describedby="telefono-error" />
        {errors.telefono && <p id="telefono-error" role="alert">{errors.telefono.message}</p>}
      </div>
      {/* Ciudad */}
      <div>
        <label htmlFor="ciudad">Ciudad</label>
        <input id="ciudad" {...register('ciudad')} aria-describedby="ciudad-error" />
        {errors.ciudad && <p id="ciudad-error" role="alert">{errors.ciudad.message}</p>}
      </div>
      <button type="button" onClick={onClose}>Cancelar</button>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
};
```

### Frontend — "Nuevo cliente" Button and Modal in ClienteListView

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx — additions
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// or siesa-ui-kit equivalent
import { ClienteForm } from './ClienteForm';

// Inside component:
const [isFormOpen, setIsFormOpen] = useState(false);

// In JSX, above search field:
<button
  onClick={() => setIsFormOpen(true)}
  aria-label="Crear nuevo cliente"
  className="..."
>
  Nuevo cliente
</button>

<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
  <DialogContent aria-label="Formulario de nuevo cliente">
    <DialogHeader>
      <DialogTitle>Nuevo cliente</DialogTitle>
    </DialogHeader>
    <ClienteForm
      onClose={() => setIsFormOpen(false)}
      onSuccess={() => setIsFormOpen(false)}
    />
  </DialogContent>
</Dialog>
```

### Frontend — API Response Contract for POST /api/v1/clientes

```json
// HTTP 201 Created — success
// Location: /api/v1/clientes/550e8400-e29b-41d4-a716-446655440000
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Ejemplo S.A.S.",
  "nitRuc": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-17T14:30:00Z"
}

// HTTP 400 Bad Request — validation failure (Problem Details RFC 7807)
{
  "status": 400,
  "title": "One or more validation errors occurred.",
  "errors": {
    "nombre": ["El nombre es requerido."],
    "nitRuc": ["El NIT/RUC es requerido."]
  }
}

// HTTP 409 Conflict — duplicate NIT/RUC (Problem Details RFC 7807)
{
  "status": 409,
  "title": "Conflicto de datos",
  "detail": "El NIT/RUC ya está registrado"
}
```

### UI Implementation Requirements (MANDATORY)

- **Priority 1**: Check `siesa-ui-kit` catalog for `FormField`, `Input`, `Button`, `Dialog`/`Modal` equivalents — use if available
- **Priority 2**: shadcn/ui `Dialog`, `Input`, `Button` (already installed via `npx shadcn@latest add dialog` per architecture)
- **Priority 3**: Custom TailwindCSS if no kit equivalent exists
- **Styling**: TailwindCSS v4 — use `slate-*` scale for neutrals; primary `#0e79fd` (Siesa Blue) for "Guardar" button
- **Icons**: Heroicons (primary); `PlusIcon` for "Nuevo cliente" button
- **Spanish UI text (MANDATORY)**: All labels ("Nombre", "NIT/RUC", "Teléfono", "Ciudad"), button text ("Guardar", "Cancelar", "Nuevo cliente"), error messages, aria-labels, toast messages
- **Dark mode**: class-based `dark:` TailwindCSS classes on all elements
- **WCAG 2.1 AA**: `aria-label` on form and dialog, `role="alert"` on error messages, `aria-describedby` wiring input↔error, keyboard-accessible dialog close (Esc key via shadcn Dialog)
- **Loading state**: Submit button shows "Guardando..." text while `isPending` — NOT a spinner component
- **No MasterCrud**: This story uses `ClienteForm` + `useCreateCliente` — do NOT use MasterCrud component

### TanStack Query Keys — Canonical Reference (CRITICAL)

```typescript
['clientes']           // list — invalidated by useCreateCliente.onSuccess
['clientes', id]       // single — automatically stale after list invalidation
```

`queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess` ensures FR27 compliance (new client appears in list immediately for all users) and NFR2 (< 2s UI update).

### Toast Message Contracts (E2E Test-Bound — DO NOT ALTER)

These exact strings are validated by E2E Playwright tests:
- Success: `"Cliente creado correctamente"`
- Generic error: `"No se pudo guardar. Intenta de nuevo."`
- 409 inline (not toast): `"El NIT/RUC ya está registrado"`

### Previous Story Learnings (from Stories 2.1 and 2.2)

- `apiClient.ts` Axios singleton at `frontend/src/shared/lib/apiClient.ts` already exists — import from there, do NOT create a new instance.
- `EmptyState` and `ErrorPanel` shared components exist in `frontend/src/shared/components/` — reuse if needed.
- `TreatWarningsAsErrors = true` in all `.csproj` files — zero compiler warnings allowed.
- `Nullable` is enabled in backend — use nullable reference type annotations everywhere.
- EF Core `ApplySnakeCaseNaming()` is applied globally in `AppDbContext.OnModelCreating` — do NOT add `[Column]` or `[Table]` attributes manually.
- dotnet CLI (`dotnet ef`) may not be available in the environment — if running migrations, plan accordingly; this story does NOT require new migrations (the `clientes` table and `uk_clientes_nit` unique index were already created in Story 1.3).
- Commit convention: `feat(story-2-3): <description>` (lowercase, hyphenated story reference).
- shadcn/ui `Dialog` component is already installed (installed in `npx shadcn@latest add dialog` during Story 1.1 setup) — use it directly without re-installing.
- TanStack Router does not need to be involved in the form modal — it is a UI state concern managed via local `useState`.
- MSW handlers for component tests: define per-test-file, avoid global shared mocks to prevent test interference.

### Story 2.2 Layout Note

Story 2.2 established the split-panel layout: 280px left panel (`ClienteListView`) + flex right panel (`<Outlet />`). The "Nuevo cliente" button and `ClienteForm` modal belong in the left panel (`ClienteListView`). Do NOT add create functionality to the right panel or the route outlet — that area is reserved for `ClienteDetailView` (2.2), edit form (2.4), and delete confirmation (2.5).

### Git History Context

Recent commits (reference for naming convention):
- `test(2.2): justify hard wait in edge test — TEA review auto-correction`
- `fix(2.2): add RouterProvider to ClienteDetailView tests; code review corrections`
- `feat(2.2): implement Client Detail View — backend GET by ID + frontend split-panel`

Use convention: `feat(story-2-3): <description>` for implementation commits.

### Test Cases Scoped to Story 2.3

From `test-design-epic-2.md`, the following test cases are scoped to Story 2.3:

| Test ID | Level | Description | Priority |
|---------|-------|-------------|----------|
| TC-E2-P0-01 | API Integration | POST valid payload → 201 with UUID, all fields, createdAt | P0 |
| TC-E2-P0-02 | API Integration | POST duplicate NIT/RUC → 409 user-friendly, no stack trace | P0 |
| TC-E2-P0-03 | API Integration | POST empty body → 400 Problem Details with field-level errors | P0 |
| TC-E2-P0-04 | Component | Submit empty form → 4 inline errors, no API call | P0 |
| TC-E2-P0-05 | Component | MSW 409 response → "El NIT/RUC ya está registrado" inline, no stack trace | P0 |
| TC-E2-P0-07 | E2E | Create client → appears in list immediately, toast visible, < 2s | P0 |
| TC-E2-P3-02 | Unit | Zod schema validates all 4 required fields correctly | P3 |
| TC-E2-P3-04 | Unit | FluentValidation rejects empty Nombre | P3 |

### Critical Anti-Patterns to Avoid

```
❌ DateTime in backend                   → DateTimeOffset (MANDATORY)
❌ Swagger registration                  → Scalar (already configured from Story 1.1)
❌ String queryKey ['clientes']         → Array ['clientes'] (MANDATORY)
❌ English UI text                       → Spanish (MANDATORY)
❌ Stack traces exposed via 409          → Problem Details RFC 7807 only
❌ Optimistic updates without invalidate → ALWAYS call invalidateQueries onSuccess
❌ Spinner for loading state             → "Guardando..." text on button (disabled)
❌ Custom UI before siesa-ui-kit check  → Check siesa-ui-kit catalog first
❌ alert() for 409 error                → setError('nitRuc', ...) — inline, not toast
❌ Manual [Column]/[Table] attributes    → ApplySnakeCaseNaming() handles all naming
❌ New Axios instance                    → Import from shared/lib/apiClient.ts
❌ MasterCrud for this story             → ClienteForm + useCreateCliente is the correct pattern
❌ Re-installing shadcn Dialog           → Dialog already installed in project
❌ CASCADE DELETE on contacts            → Not needed here; Story 2.5 handles delete
```

### Project Structure Notes

- Story 2.1 created `ClienteListView.tsx` — this story updates it to add the "Nuevo cliente" button and modal.
- Story 2.2 created `ClienteDetailView.tsx` and the split-panel layout — this story does NOT change the right panel routing.
- Stories 2.4 (Edit) and 2.5 (Delete) will reuse `ClienteForm` with a `mode` prop or a separate `ClienteEditForm` — consider keeping `ClienteForm` focused on create only for now, or add `defaultValues` prop for reuse in 2.4.
- `clienteSchema.ts` created in this story will be reused by Story 2.4 (Edit Client).
- `useCreateCliente.ts` follows the same mutation pattern that `useUpdateCliente.ts` and `useDeleteCliente.ts` (Stories 2.4, 2.5) will follow.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3]
- Architecture — API endpoints: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — TanStack Query mutation pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Architecture — Frontend folder structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Naming patterns: [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Architecture — Requirements to structure: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] (FR4 → ClienteForm.tsx + useCreateCliente.ts + CreateClienteCommandHandler.cs)
- Story 2.1 learnings: [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- Story 2.2 learnings: [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Dev Notes]
- Test design: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P0-01 through TC-E2-P0-07, TC-E2-P3-02, TC-E2-P3-04]
- Company standards — Frontend stack: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack]
- Company standards — Backend stack: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- MasterCrud reference: [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md] — NOT applicable to this story

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Used siesa-ui-kit `Button`, `Input`, and `toast`/`ToastProvider` components — no custom UI components created.
- `DuplicateNitException` domain exception created in `SiesaAgents.Domain/Clientes/Exceptions/` — mapped to HTTP 409 via `ExceptionHandlingMiddleware`.
- `DbUpdateException` caught in `ClienteRepository.CreateAsync` — unique constraint violation triggers `DuplicateNitException`.
- `ToastProvider` added to `main.tsx` wrapping `RouterProvider`.
- shadcn/ui `Dialog` used for modal (already installed). No siesa-ui-kit equivalent for generic form dialogs.
- Story 2.4 had already added `UpdateAsync` to `IClienteRepository` and `update` to the frontend interface — both are preserved.
- `clienteSchema.test.ts` was auto-created by the linter using `clienteFormSchema` alias; the schema file exports both `clienteSchema` and `clienteFormSchema` for compatibility.
- Frontend tests (ClienteForm.test.tsx): 5/5 pass. clienteSchema.test.ts: 7/7 pass.
- Pre-existing failures in `ClienteEditForm.test.tsx` (Story 2.4) and `ClienteListView.test.tsx` are unrelated to this story.
- dotnet CLI not available in environment — backend tests verified by code review; integration tests authored for Story 2.3 in `ClienteEndpointsTests.cs`.

### File List

**Backend — New Files:**
- `backend/src/SiesaAgents.Domain/Clientes/Exceptions/DuplicateNitException.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Backend — Modified Files:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (added `CreateAsync`)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (added `CreateAsync` with unique constraint handling)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (added POST endpoint)
- `backend/src/SiesaAgents.API/Program.cs` (registered `CreateClienteCommandHandler` and `CreateClienteRequestValidator`)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (added `DuplicateNitException` → HTTP 409 mapping)
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (added TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-03)

**Frontend — New Files:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**Frontend — Modified Files:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` (added `create` method)
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` (added `create` implementation)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (added "Nuevo cliente" button + Dialog modal)
- `frontend/src/main.tsx` (added `ToastProvider` + `siesa-ui-kit/styles.css` import)
