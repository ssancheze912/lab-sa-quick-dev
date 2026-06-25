# Story 2.3: Create Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
So that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre (text, required), NIT/RUC (text, required), Teléfono (text, required), Ciudad (text, required).

2. **Given** the user fills all required fields and submits, **When** the backend returns 201 Created, **Then** the new client appears in the client list immediately (TanStack Query `invalidateQueries(['clientes'])` — FR27), **And** a success toast is displayed with the message "Cliente creado correctamente", **And** the form is closed/reset.

3. **Given** the user submits the form with one or more required fields empty, **When** client-side Zod validation runs, **Then** clear inline error messages appear below each empty field in Spanish (e.g., "El nombre es requerido"), **And** the form is NOT submitted to the backend.

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a 409 Conflict, **Then** an inline error message "El NIT/RUC ya está registrado" appears on the NIT/RUC field without exposing technical details (NFR6), **And** the form remains open with all entered data preserved.

5. **Given** the backend is unavailable when the form is submitted (network error or 5xx), **When** the mutation fails, **Then** a toast error is displayed with the message "No se pudo crear el cliente. Intenta de nuevo.", **And** the form remains open with all entered data preserved.

6. **Given** the form is open, **When** the user clicks "Cancelar" or closes the form without submitting, **Then** the form closes without sending any request and no data is persisted.

## Tasks / Subtasks

- [x] Task 1 — Backend: Implement `POST /api/v1/clientes` command, validator, and endpoint (AC: #2, #4, #5)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`: `record CreateClienteCommand(string Nombre, string Nit, string Telefono, string Ciudad)`.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`: accepts `CreateClienteCommand`, calls `IClienteRepository.CreateAsync(entity)`, returns `ClienteDto`. Throws a domain exception (e.g., `DuplicateNitException` or re-throws a DB unique constraint violation) when NIT already exists.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandValidator.cs` (FluentValidation): validate `Nombre`, `Nit`, `Telefono`, `Ciudad` are not empty/whitespace, max length 200 chars each. Validation errors return 400 Problem Details.
  - [x] Update `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: add `Task<ClienteEntity> CreateAsync(ClienteEntity entity)`.
  - [x] Update `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: implement `CreateAsync` — add entity to `AppDbContext.Clientes`, call `SaveChangesAsync()`. Let `DbUpdateException` with unique-constraint violation propagate so middleware can map it to 409.
  - [x] Update `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`: map `POST /api/v1/clientes` → validates input via `CreateClienteCommandValidator`, calls `CreateClienteCommandHandler`, returns `201 Created` with `ClienteDto` body and `Location: /api/v1/clientes/{id}` header.
  - [x] Update `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`: handle `DbUpdateException` with PostgreSQL error code `23505` (unique constraint) → return `409 Conflict` Problem Details with `detail: "El NIT/RUC ya está registrado."`. Ensure no stack traces are exposed.
  - [x] Register `CreateClienteCommandHandler` and `CreateClienteCommandValidator` in `backend/src/SiesaAgents.API/Program.cs`.

- [x] Task 2 — Backend: Write unit and integration tests for `CreateCliente` (AC: #2, #3, #4, #5)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`:
    - Test: handler creates entity and returns `ClienteDto` on valid input.
    - Test: handler propagates `DbUpdateException` for duplicate NIT (middleware maps to 409).
    - Test: validator rejects empty `Nombre`, `Nit`, `Telefono`, `Ciudad`.
    - Test: validator rejects fields exceeding max length.
  - [x] Extend `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - Test `POST /api/v1/clientes` returns `201 Created` with correct `ClienteDto` body and `Location` header on valid payload.
    - Test `POST /api/v1/clientes` returns `400 Bad Request` (Problem Details) when required fields are empty.
    - Test `POST /api/v1/clientes` returns `409 Conflict` (Problem Details) when NIT already exists.
    - Test response is `application/json` with camelCase fields.
    - Test: created client appears when calling `GET /api/v1/clientes` after a successful create.

- [x] Task 3 — Frontend: Define domain contract extension and Zod schema (AC: #1, #3)
  - [x] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: add `create(data: CreateClienteData): Promise<Cliente>`.
  - [x] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` (Zod schema):
    ```typescript
    import { z } from 'zod';
    export const createClienteSchema = z.object({
      nombre: z.string().min(1, 'El nombre es requerido').max(200),
      nit: z.string().min(1, 'El NIT/RUC es requerido').max(200),
      telefono: z.string().min(1, 'El teléfono es requerido').max(200),
      ciudad: z.string().min(1, 'La ciudad es requerida').max(200),
    });
    export type CreateClienteData = z.infer<typeof createClienteSchema>;
    ```

- [x] Task 4 — Frontend: Implement infrastructure layer for create (AC: #2, #4, #5)
  - [x] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: add `create` method:
    ```typescript
    create: async (data: CreateClienteData) => {
      const { data: created } = await apiClient.post<Cliente>('/api/v1/clientes', data);
      return created;
    },
    ```

- [x] Task 5 — Frontend: Implement `useCreateCliente` mutation hook (AC: #2, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`:
    ```typescript
    import { useMutation, useQueryClient } from '@tanstack/react-query';
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
    import type { CreateClienteData } from './clienteSchema';

    export function useCreateCliente() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data: CreateClienteData) => clienteApiRepository.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] });
        },
      });
    }
    ```
  - Note: Toast notifications and 409 error mapping are handled in the presentation layer to keep the hook generic.

- [x] Task 6 — Frontend: Create `ClienteForm` presentation component (AC: #1, #3, #4, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`:
    - Uses `react-hook-form` with `zodResolver(createClienteSchema)` for validation.
    - Fields: `nombre`, `nit`, `telefono`, `ciudad` — all type `text`, all required.
    - All labels and placeholders in Spanish: "Nombre", "NIT/RUC", "Teléfono", "Ciudad".
    - Inline error messages below each field on invalid submit (from `formState.errors`).
    - On submit success: call `onSuccess()` callback (parent closes/resets form) + show success toast "Cliente creado correctamente".
    - On 409 conflict: `setError('nit', { message: 'El NIT/RUC ya está registrado' })` — shows inline on NIT field.
    - On other errors (5xx / network): show toast error "No se pudo crear el cliente. Intenta de nuevo." — form stays open.
    - "Cancelar" button calls `onCancel()` prop — no request sent.
    - Loading state: disable submit button and show "Guardando…" text while mutation is pending (`isPending`).
    - Props interface:
      ```typescript
      interface ClienteFormProps {
        onSuccess: () => void;
        onCancel: () => void;
      }
      ```
    - Use `siesa-ui-kit` components for form inputs/buttons if available; fallback to `shadcn/ui` Input + Button; then custom with TailwindCSS v4.
    - WCAG 2.1 AA: each input has associated `<label>`, error messages use `aria-describedby`, submit button has descriptive `aria-label`.
    - All user-facing text in Spanish; code (variables, functions) in English.

- [x] Task 7 — Frontend: Integrate `ClienteForm` into the clientes view (AC: #1, #2, #6)
  - [x] Update `frontend/src/routes/_app/clientes.tsx` (or the relevant layout):
    - Add "Nuevo cliente" button (Siesa Blue `#0e79fd`) to the left panel header area.
    - On click, set `isCreating: boolean` local state to `true` — renders `ClienteForm`.
    - Pass `onSuccess={() => setIsCreating(false)}` and `onCancel={() => setIsCreating(false)}` props.
    - Rendering strategy: render `ClienteForm` inline in the right panel (replacing the placeholder) OR in a dialog/sheet — use whatever pattern matches the existing right panel architecture. The right panel placeholder currently shows when no client is selected; the form replaces it when `isCreating` is true.
    - When `ClienteForm` `onSuccess` fires, the list auto-refreshes via TanStack Query invalidation; the URL remains at `/clientes` (no navigation needed).

- [x] Task 8 — Frontend: Write unit and component tests (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`:
    - Mock `clienteApiRepository.create` with MSW.
    - Test: mutation calls `POST /api/v1/clientes` with correct payload.
    - Test: on success, `invalidateQueries(['clientes'])` is called.
    - Test: on 409, mutation `isError` is true.
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` with RTL:
    - Test: all four fields and both buttons render.
    - Test: submitting empty form shows inline errors for each field, no API call made.
    - Test: submitting valid form calls API and fires `onSuccess` callback.
    - Test: submit button disabled and shows "Guardando…" while pending.
    - Test: 409 response sets inline NIT error "El NIT/RUC ya está registrado".
    - Test: 5xx response shows toast error, form stays open.
    - Test: "Cancelar" button calls `onCancel`, no API call made.
    - Note: axe accessibility check skipped — @axe-core/react not installed in project.

## Dev Notes

### Architecture Alignment

This story covers the **write path (create)** for the `clientes` module (FR1, FR27). It adds:
- New backend command: `POST /api/v1/clientes` (CQRS Command + Handler + FluentValidation Validator)
- New frontend mutation hook: `useCreateCliente` (TanStack Query `useMutation`)
- New frontend schema: `clienteSchema.ts` (Zod)
- New frontend component: `ClienteForm.tsx` (React Hook Form + Zod)
- Extension of `IClienteRepository` (domain + infrastructure) with `CreateAsync` / `create`
- Extension of `ClienteEndpoints.cs` and `ExceptionHandlingMiddleware.cs`

Clean Architecture layers for frontend (`src/modules/crm/clientes/`):
- **Domain**: `IClienteRepository.ts` (add `create`)
- **Application**: `clienteSchema.ts` (Zod schema + `CreateClienteData` type), `useCreateCliente.ts` (new mutation hook)
- **Infrastructure**: `clienteApiRepository.ts` (add `create` method)
- **Presentation**: `ClienteForm.tsx` (new component)

Backend layers:
- **Domain**: `IClienteRepository.cs` (add `CreateAsync`)
- **Application**: `CreateClienteCommand.cs`, `CreateClienteCommandHandler.cs`, `CreateClienteCommandValidator.cs`
- **Infrastructure**: `ClienteRepository.cs` (implement `CreateAsync`)
- **API**: `ClienteEndpoints.cs` (add `POST /api/v1/clientes`), `ExceptionHandlingMiddleware.cs` (handle 409 for unique constraint)

### MasterCrud Note

This story does NOT use MasterCrud. The create flow is a **custom form embedded in the split-panel layout** (`ClienteForm.tsx`). MasterCrud applies to standard table-based CRUD orchestration screens; this feature uses an inline/right-panel form pattern consistent with Stories 2.1 and 2.2.

### State Management

- **Mutation state**: TanStack Query `useMutation` in `useCreateCliente` — `isPending`, `isError`, `error` exposed to `ClienteForm`.
- **Form state**: React Hook Form — field values, dirty state, validation errors. No Zustand for this story.
- **List invalidation**: on `onSuccess`, `queryClient.invalidateQueries({ queryKey: ['clientes'] })` triggers automatic refetch → client appears immediately (FR27).
- **UI open/close**: local `useState<boolean>` in the route component (`clientes.tsx`). URL does NOT change when form opens (no new route needed).

### 409 Conflict Handling (NFR6)

The backend must catch PostgreSQL error code `23505` (unique constraint violation on `uk_clientes_nit`) and return 409 Conflict with Problem Details — never expose the raw DB error message.

Backend detection in `ExceptionHandlingMiddleware.cs`:
```csharp
// Example: detect Npgsql unique constraint violation
if (exception is DbUpdateException dbEx &&
    dbEx.InnerException is PostgresException pgEx &&
    pgEx.SqlState == "23505")
{
    context.Response.StatusCode = StatusCodes.Status409Conflict;
    await context.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status = 409,
        Title = "Conflict",
        Detail = "El NIT/RUC ya está registrado."
    });
    return;
}
```

Frontend detection in `ClienteForm.tsx`:
```typescript
import type { AxiosError } from 'axios';

const handleSubmitError = (error: unknown) => {
  const axiosError = error as AxiosError<{ status: number }>;
  if (axiosError.response?.status === 409) {
    setError('nit', { type: 'server', message: 'El NIT/RUC ya está registrado' });
  } else {
    // Show generic toast for 5xx / network errors
    toast.error('No se pudo crear el cliente. Intenta de nuevo.');
  }
};
```

### API Contract

```
POST /api/v1/clientes
Content-Type: application/json

Request body:
{
  "nombre": "Empresa Ejemplo S.A.",
  "nit": "900123456-7",
  "telefono": "6011234567",
  "ciudad": "Bogotá"
}

Response 201 Created — Content-Type: application/json
Location: /api/v1/clientes/550e8400-e29b-41d4-a716-446655440000
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Ejemplo S.A.",
  "nit": "900123456-7",
  "telefono": "6011234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-25T10:30:00Z",
  "updatedAt": "2026-06-25T10:30:00Z"
}

Response 400 Bad Request — Problem Details RFC 7807 (FluentValidation failure)
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Bad Request",
  "status": 400,
  "errors": {
    "Nombre": ["'Nombre' must not be empty."],
    "Nit": ["'Nit' must not be empty."]
  }
}

Response 409 Conflict — Problem Details RFC 7807 (duplicate NIT)
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflict",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado."
}

Response 500 — Problem Details RFC 7807 (via ExceptionHandlingMiddleware)
```

### UI Implementation Requirements (MANDATORY)

- **siesa-ui-kit first**: check siesa-ui-kit catalog before creating any custom UI components. Stories 2.1 and 2.2 confirmed that `EmptyState` and `ErrorPanel` are NOT in siesa-ui-kit — use custom components already at `frontend/src/shared/components/`.
- **Form library**: React Hook Form + Zod resolver (already installed from Story 1.1 setup).
- **Toast**: use the toast library already integrated in the project (verify in `src/app/providers/` — likely `sonner` or similar). Show `toast.success(...)` / `toast.error(...)`.
- **Brand colors**: "Nuevo cliente" button primary → `#0e79fd` (Siesa Blue). Form uses Tailwind `slate-*` for labels, `red-500` / `red-600` for inline validation errors.
- **Loading state**: disable submit button and change its label to "Guardando…" while `isPending` is true — NOT a spinner.
- **Typography**: Inter font classes — `font-light` (300), `font-normal` (400), `font-bold` (700).
- All user-facing text MUST be in Spanish: labels, placeholders, error messages, button text, ARIA labels.
- Code (variables, functions, types) in English.
- WCAG 2.1 AA: each `<input>` has an associated `<label>` via `htmlFor`/`id`, inline errors linked via `aria-describedby`, keyboard-navigable form, focus visible rings.

### Backend Enforcement Rules (Mandatory)

- `ClienteEntity.Id`: `Guid` (UUID) — `Guid.NewGuid()` default in static `Create()` factory.
- `CreatedAt` / `UpdatedAt`: `DateTimeOffset.UtcNow` — NEVER `DateTime`.
- `CreateAsync` returns the created `ClienteEntity` with the newly assigned `Id` and timestamps.
- `POST /api/v1/clientes` returns `201 Created` (not `200 OK`) with `Location` header — architecture standard.
- `ExceptionHandlingMiddleware` is already wired from Story 1.3 — add the 409 branch WITHOUT re-registering.
- `uk_clientes_nit` unique index already exists from Story 2.1 migration — no new migration needed.
- `FluentValidation` validator must be invoked at the endpoint level (not auto-validated) OR registered as a filter via `AddFluentValidationAutoValidation()`.
- API documentation: Scalar at `/scalar` — do NOT add Swagger.

### Previous Story Learnings

1. `siesa-ui-kit` does NOT export `EmptyState` or `ErrorPanel` — use custom components at `frontend/src/shared/components/`.
2. `@/` path alias is configured in `vite.config.ts` and `tsconfig.json` — use it for all imports.
3. `ExceptionHandlingMiddleware` is already wired in `Program.cs` from Story 1.3 — do NOT re-register, only extend.
4. `AppDbContext.Clientes` DbSet and `uk_clientes_nit` unique index already exist from Story 2.1 — no new migration needed for this story.
5. `IClienteRepository` returns `ClienteEntity` (not `ClienteDto`) from domain layer; Application layer performs the projection to `ClienteDto`.
6. `react-loading-skeleton` is already installed. However, for form-submit loading, disable the button instead of a skeleton (form loading pattern, not data-load pattern).
7. Integration tests use per-test `InMemoryClienteFactory` instances with unique DB names to prevent data leakage — follow the same pattern.
8. `ExceptionHandlingMiddleware.WriteAsJsonAsync` workaround established in Story 2.1: use `JsonSerializer.Serialize` + `WriteAsync` to control `Content-Type: application/problem+json` explicitly (not `WriteAsJsonAsync` with content-type arg).
9. TanStack Router navigation uses `useNavigate` in components (not `Link`) for testability without router context in unit tests — follow same pattern for consistency.

### Git History Context

Recent commits confirm Stories 2.1 and 2.2 are complete:
- `ClienteEntity`, `ClienteDto`, `IClienteRepository` (with `GetAllAsync`, `GetByIdAsync`), `ClienteRepository`, `ClienteEndpoints` with GET endpoints, `useClientes`, `useCliente`, `ClienteListPanel`, `ClienteDetailPanel`, `EmptyState`, `ErrorPanel`, `clientes.tsx`, `clientes.$clienteId.tsx` — all in place.
- Test infrastructure (MSW, Vitest, RTL, xUnit, integration tests) is operational.
- `@/` alias, `apiClient.ts`, `AppDbContext` with `ApplySnakeCaseNaming()` are configured.

### Project Structure Notes

Files to create or modify in this story:

**Backend — new:**
```
backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs
backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs
backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandValidator.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs
```

**Backend — modify:**
```
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs         ← add CreateAsync
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs          ← implement CreateAsync
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                         ← add POST /api/v1/clientes
backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs             ← add 409 branch for unique constraint
backend/src/SiesaAgents.API/Program.cs                                            ← register Command + Validator
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs              ← extend with POST tests
```

**Frontend — new:**
```
frontend/src/modules/crm/clientes/application/clienteSchema.ts
frontend/src/modules/crm/clientes/application/useCreateCliente.ts
frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts
frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx
```

**Frontend — modify:**
```
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts          ← add create method
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts ← add create method
frontend/src/routes/_app/clientes.tsx                                     ← add "Nuevo cliente" button + form toggle
```

### References

- FR1 (Registrar cliente: Nombre, NIT/RUC, Teléfono, Ciudad) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.3`]
- FR27 (Cambios inmediatos para todos los usuarios → `invalidateQueries`) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- NFR5 (Validación: FluentValidation backend + Zod frontend) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- NFR6 (Sin stack traces al usuario → Problem Details RFC 7807) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- AC-E2.1 (Formulario con campos Nombre, NIT/RUC, Teléfono, Ciudad) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Acceptance Criteria (QA Validation)`]
- `POST /api/v1/clientes` endpoint contract [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- `useCreateCliente.ts` mutation hook listed in architecture [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure`]
- `clienteSchema.ts` Zod schema listed in architecture [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure`]
- `ClienteForm.tsx` listed in architecture [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure`]
- TanStack Query mandatory invalidation pattern [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Problem Details RFC 7807 for error responses [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`]
- FluentValidation for backend validation [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- React Hook Form + Zod for frontend forms [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- MasterCrud reference (not applicable for inline form) [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- siesa-ui-kit mandatory (no EmptyState/ErrorPanel in kit) [Source: Story 2.1 + 2.2 Completion Notes]
- `uk_clientes_nit` unique index from Story 2.1 migration [Source: `_bmad-output/implementation-artifacts/2-1-client-list-search.md`]
- `ExceptionHandlingMiddleware` workaround (WriteAsync + JsonSerializer) [Source: Story 2.1 Completion Notes]
- Company standards: DateTimeOffset, UUID PKs, snake_case DB, Scalar, Problem Details [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

1. Used `siesa-ui-kit` `toast` and `ToastProvider` for toast notifications (existing kit has full toast support). Added `ToastProvider` wrapper in `main.tsx`.
2. Added `Npgsql.EntityFrameworkCore.PostgreSQL` package to `SiesaAgents.API.csproj` for direct access to `PostgresException` type in `ExceptionHandlingMiddleware`.
3. Updated all three fake repository implementations in unit test files (`GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`) to implement the new `CreateAsync` method from the updated `IClienteRepository` interface.
4. Added `FluentValidation` package to `SiesaAgents.UnitTests.csproj` to support validator unit tests.
5. The `clientes.tsx` route wraps `ClienteListPanel` in an extra div to add the "Nuevo cliente" header button — this is a minor structural change but preserves the existing panel's scrollable list behavior.
6. Axe accessibility check not included in tests — `@axe-core/react` is not installed in the project. WCAG 2.1 AA compliance is enforced structurally (labels with `htmlFor`/`id`, `aria-describedby`, `aria-invalid`, `aria-label` on buttons).

### File List

**Backend — new:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandValidator.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Backend — modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (added `CreateAsync`)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (implemented `CreateAsync`)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (added `POST /api/v1/clientes`)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (added 409 branch)
- `backend/src/SiesaAgents.API/Program.cs` (registered command handler and validator)
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` (added Npgsql package reference)
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (added FluentValidation)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (added `CreateAsync` to fake)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (added `CreateAsync` to fake)
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (added POST tests)

**Frontend — new:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**Frontend — modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` (added `create`)
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` (added `create`)
- `frontend/src/routes/_app/clientes.tsx` (added "Nuevo cliente" button + form toggle)
- `frontend/src/main.tsx` (added `ToastProvider` wrapper)
