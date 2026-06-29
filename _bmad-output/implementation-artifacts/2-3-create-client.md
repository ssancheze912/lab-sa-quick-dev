# Story 2.3: Create Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad — all required per FR1.

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created via `POST /api/v1/clientes`, the cache `['clientes']` is invalidated, the new client appears in the client list immediately (FR27), and a success toast shows "Cliente creado correctamente". (AC-E2.1, FR1, FR4, FR27, NFR2)

3. **Given** the user submits the form with one or more required fields empty, **When** the form is validated (client-side via Zod), **Then** clear inline error messages appear on each empty field and the form is NOT submitted to the backend. (AC-E2.4, FR8, NFR5)

4. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a 409 Conflict, **Then** an error message "El NIT/RUC ya está registrado" is shown without exposing technical details or stack traces. (AC-2.3, NFR6, R-E2-01)

5. **Given** the form is open, **When** the user clicks "Cancelar" (or closes the form), **Then** the form closes without any mutation being triggered and the client list remains unchanged.

6. **Given** the form submits successfully, **When** the mutation's `onSuccess` fires, **Then** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is called, causing the list to re-fetch and reflect the new client. (FR27, R-E2-05)

## Tasks / Subtasks

- [x] Task 1 — Create Zod schema `clienteSchema` for form validation (AC: #3, #6)
  - [x] Verify or update `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
    - Schema must require: `nombre` (non-empty string), `nit` (non-empty string), `telefono` (non-empty string), `ciudad` (non-empty string)
    - Export `ClienteFormData` type inferred from the schema
    - This schema was created in Story 2.1 as a domain placeholder — confirm all 4 fields are present and validated; update if missing

- [x] Task 2 — Create `useCreateCliente` application hook (AC: #2, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
    - Uses `useMutation` from TanStack Query
    - `mutationFn: (data: ClienteFormData) => clienteApiRepository.create(data)` — calls `POST /api/v1/clientes`
    - `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })` and shows toast "Cliente creado correctamente"
    - `onError(error)`: checks if `error.response?.status === 409`; if yes, surfaces "El NIT/RUC ya está registrado" to the form; else shows generic "Error al crear el cliente"
    - Exposes `mutate`, `isPending`, `isError`, `error` from the hook

- [x] Task 3 — Extend infrastructure layer: add `create` to API repository (AC: #2)
  - [x] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `create(data: ClienteFormData): Promise<Cliente>` method signature
  - [x] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `create`: calls `POST /api/v1/clientes` via `apiClient` with `data` as JSON body; returns `Cliente`; throws on non-2xx (let `useMutation` `onError` handle it)

- [x] Task 4 — Create `ClienteForm` presentation component (AC: #1, #3, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
    - Uses `react-hook-form` with `zodResolver(clienteSchema)` for validation
    - Fields: Nombre, NIT/RUC, Teléfono, Ciudad — all `<input type="text">` wrapped in labeled form controls
    - Each field shows an inline error message from `formState.errors` below the input when validation fails
    - "Guardar" submit button — shows a loading indicator when `isPending` is true; disabled during pending
    - "Cancelar" button — calls `onCancel()` prop without triggering submit; closes form
    - `onSubmit` calls `useCreateCliente.mutate(data)`
    - Props interface: `{ onSuccess?: () => void; onCancel?: () => void }`
    - Check siesa-ui-kit first for form input / label / button components; fall back to shadcn/ui, then custom

- [x] Task 5 — Wire "Nuevo cliente" button and form display in `ClienteListView` (AC: #1, #5)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
    - Add "Nuevo cliente" button (Heroicon `PlusIcon` + label) in the list panel header
    - Manage `isFormOpen: boolean` state with `useState`
    - When `isFormOpen === true`: render `ClienteForm` inside the panel (inline or in a modal/sheet)
    - Pass `onSuccess={() => setIsFormOpen(false)}` and `onCancel={() => setIsFormOpen(false)}` to `ClienteForm`
    - When `isFormOpen === false`: render the client list as before
  - [x] Determine whether the form is shown inline (replacing list header area) or in a modal/dialog; use siesa-ui-kit dialog/sheet if available, else shadcn Dialog component (`npx shadcn@latest add dialog` — already added in Story 1.1 via architecture setup)

- [x] Task 6 — Backend: POST /api/v1/clientes endpoint (AC: #2, #3, #4)
  - [x] Create `CreateClienteCommand.cs` + `CreateClienteCommandHandler.cs` in `SiesaAgents.Application/Clientes/Commands/`
    - Command record: `CreateClienteCommand(string Nombre, string Nit, string Telefono, string Ciudad)`
    - Handler: creates `ClienteEntity` via `ClienteEntity.Create(nombre, nit, telefono, ciudad)` factory; calls `IClienteRepository.AddAsync(entity)` and `SaveChangesAsync()`; returns `ClienteDto`
    - If NIT already exists (unique constraint violation from EF Core), the `ExceptionHandlingMiddleware` maps `DbUpdateException` (PG unique violation error code `23505`) → HTTP 409 with Problem Details: `{ "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado" }`
  - [x] Create `CreateClienteRequestValidator.cs` in `SiesaAgents.Application/Clientes/Validators/`
    - FluentValidation: `Nombre`, `Nit`, `Telefono`, `Ciudad` all required (not empty/null)
    - Validated before handler is called; returns `400 Bad Request` with Problem Details on validation failure
  - [x] Create or verify endpoint `POST /api/v1/clientes` in `SiesaAgents.API/Endpoints/ClientesEndpoints.cs`
    - Accepts `CreateClienteRequest` body (matches command fields)
    - Returns `201 Created` with `ClienteDto` body (include `Location` header pointing to `/api/v1/clientes/{id}`)
    - Returns `400 Bad Request` + Problem Details when FluentValidation fails (no `stackTrace` in response)
    - Returns `409 Conflict` + Problem Details when NIT already exists
    - Uses Scalar docs (NEVER Swagger)
  - [x] Ensure `ClienteEntity.Create()` factory is implemented in `SiesaAgents.Domain/Entities/ClienteEntity.cs`:
    ```csharp
    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        // validate non-null/non-empty, AddDomainEvent if needed
        return new ClienteEntity { Nombre = nombre, Nit = nit, Telefono = telefono, Ciudad = ciudad,
                                    CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
    }
    ```
  - [x] Verify `ExceptionHandlingMiddleware.cs` handles PostgreSQL unique constraint violation (error `23505`) → 409 Problem Details. If not yet mapped, add this case from the middleware.

- [x] Task 7 — Write tests (AC: #1–#6)
  - [x] **Unit test** `clienteSchema.test.ts` (extend Story 2.1 file if exists):
    - TC-E2-P0-05 (Part A): `clienteSchema.safeParse({})` → `{ success: false }`, errors on `nombre`, `nit`, `telefono`, `ciudad`
    - TC-E2-P2-07: `clienteSchema.safeParse({ nombre: "X" })` → errors on `nit`, `telefono`, `ciudad`; full valid object → `{ success: true }`
  - [x] **Unit test** `useCreateCliente.test.ts`:
    - TC-E2-P2-05: spy on `queryClient.invalidateQueries`; execute mutation `onSuccess` callback; assert `invalidateQueries({ queryKey: ['clientes'] })` called
    - Assert `isPending` is `true` during mutation execution
  - [x] **Component test** `ClienteForm.test.tsx` with MSW:
    - TC-E2-P0-04: Fill all 4 fields, submit → MSW returns 201 → assert POST called with correct payload, toast "Cliente creado correctamente" shown, `onSuccess` called
    - TC-E2-P0-05 (Part B): Leave all fields empty, submit → assert inline errors on each field; assert POST not called (MSW receives 0 requests)
    - TC-E2-P2-03: Fill form and submit → MSW returns 409 `{ "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado" }` → assert error message "El NIT/RUC ya está registrado" shown; no stack trace in UI
    - Cancel behavior: render form, click "Cancelar" → assert `onCancel` was called; POST not triggered
  - [x] **API Integration test** `CreateClienteEndpointTests.cs` (xUnit + WebApplicationFactory):
    - TC-E2-P0-07: POST valid payload → assert 201, response has `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 with TZ); follow-up GET confirms record persisted
    - TC-E2-P0-09: POST client, then POST with same `nit` → assert 409, `Content-Type: application/problem+json`, body has `status: 409`, `detail` contains "NIT/RUC ya está registrado"; assert NO `stackTrace` key
    - TC-E2-P1-19: POST `{}` (empty body) → assert 400, Problem Details with `errors` object containing `nombre`, `nit`, `telefono`, `ciudad`; no `stackTrace`

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. Layers: Domain → Application → Infrastructure → Presentation. No direct API calls in UI components.
- **CQRS**: Create operation is a Command (`CreateClienteCommand`) not a Query. Handler is in `Application/Clientes/Commands/`.
- **Mutation hook**: `useCreateCliente` uses TanStack Query `useMutation`. The `onSuccess` callback MUST call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` to comply with FR27 (changes immediately visible) and NFR2 (< 2s update). This is the primary guard against R-E2-05.
- **NIT uniqueness**: Enforced at three layers — PostgreSQL `uk_clientes_nit` unique index (from Story 1.3 migration), backend `ExceptionHandlingMiddleware` (maps error code `23505` → 409 Problem Details), and frontend form (displays 409 error as "El NIT/RUC ya está registrado"). Critical risk R-E2-01.
- **Form validation**: React Hook Form + Zod. `zodResolver(clienteSchema)` wired to `useForm`. Zod schema (`clienteSchema.ts`) was introduced in Story 2.1; verify it has all 4 required fields. Client-side validation runs on submit; inline errors per field. This prevents unnecessary backend round-trips for empty fields (R-E2-10 schema alignment).
- **Entity factory**: `ClienteEntity.Create()` static factory method is the single creation entry point per DDD entity pattern. Assigns `DateTimeOffset.UtcNow` to both `CreatedAt` and `UpdatedAt`. NEVER use `DateTime` — always `DateTimeOffset` (company standard).
- **Primary keys**: `Id = Guid.NewGuid()` (or `uuidv7()` via DB default if configured). UUID mandatory per company standards.
- **Problem Details RFC 7807**: All backend error responses (`400`, `409`, `404`) must use Problem Details format. No stack traces exposed to frontend (NFR6). `ExceptionHandlingMiddleware` from Epic 1 handles this.
- **Toast notifications**: Use whatever toast mechanism was established in previous stories (check if `react-hot-toast` or another library was installed). Toast on success only; error is shown inline in the form for 409/400 responses.

### siesa-ui-kit Usage (MANDATORY)

This story has a UI component (form with inputs and buttons). Check siesa-ui-kit catalog BEFORE creating any custom component:
- Look for a **form input / text field** component in siesa-ui-kit
- Look for a **button** component (primary action "Guardar", secondary "Cancelar")
- Look for a **modal / dialog / sheet** component to host the form if not shown inline
- Look for a **toast / notification** component for the success message
- Install: `npm install siesa-ui-kit` (must already be present from Story 1.1)
- If no siesa-ui-kit equivalent exists → fall back to shadcn/ui (Dialog was added in Story 1.1 setup) → custom

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/clientes/
  domain/
    IClienteRepository.ts              ← Update: add create(data) method
    clienteSchema.ts                   ← Verify/update: ensure 4 required fields present
  application/
    clienteSchema.ts                   ← Verify from Story 2.1 (may be here, not domain/)
    useCreateCliente.ts                ← New
  infrastructure/
    clienteApiRepository.ts            ← Update: implement create(data)
  presentation/
    ClienteForm.tsx                    ← New
    ClienteListView.tsx                ← Update: add "Nuevo cliente" button + isFormOpen state
```

Backend files to create or modify:
```
SiesaAgents.Domain/Entities/
  ClienteEntity.cs                     ← Verify/update: add Create() factory if not present

SiesaAgents.Application/Clientes/
  Commands/CreateClienteCommand.cs     ← New
  Commands/CreateClienteCommandHandler.cs ← New
  Validators/CreateClienteRequestValidator.cs ← New
  DTOs/ClienteDto.cs                   ← Verify from Story 2.1 (should already exist)
  Interfaces/IClienteRepository.cs     ← Update: add AddAsync(ClienteEntity) method

SiesaAgents.Infrastructure/
  Repositories/ClienteRepository.cs    ← Update: implement AddAsync
  Data/Configurations/ClienteConfiguration.cs ← Verify: uk_clientes_nit unique index present

SiesaAgents.API/Endpoints/
  ClientesEndpoints.cs                 ← Update: add POST /api/v1/clientes endpoint

SiesaAgents.API/Middleware/
  ExceptionHandlingMiddleware.cs       ← Verify/update: handle PostgreSQL error 23505 → 409
```

Test files to create or modify:
```
frontend/src/modules/crm/clientes/
  application/clienteSchema.test.ts    ← Extend from Story 2.1 or create
  application/useCreateCliente.test.ts ← New

  presentation/ClienteForm.test.tsx    ← New

backend/tests/SiesaAgents.IntegrationTests/Clientes/
  CreateClienteEndpointTests.cs        ← New
```

### API Contract

```
POST /api/v1/clientes
  Request body: { "nombre": string, "nit": string, "telefono": string, "ciudad": string }

  Response success: 201 Created
  Headers: Location: /api/v1/clientes/{id}
  Body: ClienteDto (direct object, no wrapper)

  Response validation error: 400 Bad Request
  Body: Problem Details RFC 7807
    {
      "status": 400,
      "title": "Validation Error",
      "errors": { "nombre": ["..."], "nit": ["..."], ... }
    }

  Response NIT conflict: 409 Conflict
  Content-Type: application/problem+json
  Body: Problem Details RFC 7807
    {
      "status": 409,
      "title": "Conflict",
      "detail": "El NIT/RUC ya está registrado"
    }
    (NO stackTrace, NO innerException, NO exception keys)

ClienteDto {
  id: Guid           // UUID v4/v7
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string  // DateTimeOffset ISO 8601 with TZ — e.g. "2026-06-29T10:00:00Z"
}
```

### TanStack Query Keys (Canonical)

```typescript
['clientes']               // list — useClientes.ts (Story 2.1)
['clientes', clienteId]    // single — useCliente.ts (Story 2.2)
```

Mutation `onSuccess` in `useCreateCliente` MUST call:
```typescript
queryClient.invalidateQueries({ queryKey: ['clientes'] })
// This invalidates the list; re-fetch happens automatically per TanStack Query
```

### useCreateCliente Hook Pattern

```typescript
// application/useCreateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { ClienteFormData } from './clienteSchema'

export function useCreateCliente(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClienteFormData) => clienteApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      // Show success toast: "Cliente creado correctamente"
      options?.onSuccess?.()
    },
    onError: (error: any) => {
      // 409: surface "El NIT/RUC ya está registrado" inline
      // Other: show generic error message
    },
  })
}
```

### ClienteForm Component Pattern

```typescript
// presentation/ClienteForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, type ClienteFormData } from '../application/clienteSchema'
import { useCreateCliente } from '../application/useCreateCliente'

interface ClienteFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClienteForm({ onSuccess, onCancel }: ClienteFormProps) {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  })

  const { mutate, isPending } = useCreateCliente({
    onSuccess,
  })

  const onSubmit = (data: ClienteFormData) => {
    mutate(data, {
      onError: (error: any) => {
        if (error.response?.status === 409) {
          setError('nit', { message: 'El NIT/RUC ya está registrado' })
        }
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Nombre, NIT/RUC, Teléfono, Ciudad fields with error messages */}
      {/* "Guardar" + "Cancelar" buttons */}
    </form>
  )
}
```

### Backend Entity Factory Pattern

```csharp
// Domain/Entities/ClienteEntity.cs
public class ClienteEntity : Entity  // Entity base provides Id (Guid)
{
    public string Nombre { get; private set; } = string.Empty;
    public string Nit { get; private set; } = string.Empty;
    public string Telefono { get; private set; } = string.Empty;
    public string Ciudad { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private ClienteEntity() { }  // EF Core constructor

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        // FluentValidation handles empty checks before handler is called
        return new ClienteEntity
        {
            Nombre = nombre,
            Nit = nit,
            Telefono = telefono,
            Ciudad = ciudad,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
```

### MSW Handlers Required for Component Tests

```typescript
// __mocks__/handlers.ts — add to existing handlers from Stories 2.1/2.2
import { http, HttpResponse } from 'msw'

http.post('/api/v1/clientes', async ({ request }) => {
  const body = await request.json() as any
  // Success case:
  return HttpResponse.json(
    { id: 'new-uuid', ...body, createdAt: '2026-06-29T10:00:00Z' },
    { status: 201 }
  )
  // 409 case (use override handler in specific tests):
  // return HttpResponse.json(
  //   { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado' },
  //   { status: 409 }
  // )
})
```

### Testing Test Cases Covered by This Story

From `test-design-epic-2.md`:
- **P0:** TC-E2-P0-04 (create → toast → list), TC-E2-P0-05 (validation blocks submit), TC-E2-P0-07 (API POST 201), TC-E2-P0-09 (duplicate NIT 409)
- **P1:** TC-E2-P1-19 (API POST empty → 400 Problem Details)
- **P2:** TC-E2-P2-03 (frontend shows NIT conflict message), TC-E2-P2-05 (cache invalidation — `invalidateQueries`), TC-E2-P2-07 (Zod schema validates all 4 fields)
- **P3:** TC-E2-P3-03 (NFR3 load — 10 concurrent GET requests; covered partially by existing infrastructure)

### Previous Story Learnings (from Stories 2.1 and 2.2)

- `clienteApiRepository.ts` already implements `getAll()` and `getById()` — follow the same pattern for `create()`
- `apiClient.ts` (Axios singleton) is at `frontend/src/shared/lib/apiClient.ts` with `baseURL: import.meta.env.VITE_API_URL`
- `EmptyState` and `ErrorPanel` are in `frontend/src/shared/components/` — reuse, do not recreate
- `react-loading-skeleton` is already installed; use for loading states
- TanStack Query `queryKey: ['clientes']` is the list key — invalidate it on all mutations (R-E2-05)
- `ExceptionHandlingMiddleware.cs` is implemented in Epic 1 — verify it handles 23505 (unique constraint) → 409
- `ClientesEndpoints.cs` already has `GET /api/v1/clientes` and `GET /api/v1/clientes/{id}` — add `POST` as a new `MapPost` call in the same file
- Story 2.2 note: "All mutations in later stories (2.3, 2.4, 2.5) MUST call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`"

### Performance Notes

- The client list is loaded once into TanStack Query cache. After a successful `POST`, `invalidateQueries(['clientes'])` triggers a background re-fetch which includes the new client. The user sees the updated list within the NFR2 < 2s window.
- Form validation (Zod) is synchronous and runs before any network call — no latency impact.
- `isPending` state on the mutation prevents double-submit (button disabled during in-flight request).

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- All user-facing text in Spanish (MANDATORY): "Nombre", "NIT/RUC", "Teléfono", "Ciudad", "Guardar", "Cancelar", error messages
- Code variables, functions, classes in English (MANDATORY)
- NEVER expose `error.message`, backend stack traces, or internal exception details in the UI
- 409 response from backend must use Problem Details (no `stackTrace` key per NFR6 and R-E2-06)
- FluentValidation on all create endpoints (NFR5)

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.3 AC
- Previous story 2.2: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md` — canonical query keys, API contract shape, established patterns
- Previous story 2.1: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — `clienteSchema`, `ClienteListView`, `IClienteRepository`, `clienteApiRepository`, `useClientes`
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — API endpoints, data model, entity patterns, frontend folder structure, TanStack Query keys, mutation + invalidation strategy
- Test Design Epic 2: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — TC-E2-P0-04, TC-E2-P0-05, TC-E2-P0-07, TC-E2-P0-09, TC-E2-P1-19, TC-E2-P2-03, TC-E2-P2-05, TC-E2-P2-07
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, DateTimeOffset, UUID PKs, FluentValidation, Problem Details RFC 7807, Zod + React Hook Form
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — MasterCrud is NOT applicable here. This story uses a dedicated `ClienteForm` component embedded in the split-panel layout, not a MasterCrud orchestrator. The form is simple (4 fields, no pagination, no grid) and is embedded in a split-panel layout specific to the Clientes module.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- All 7 tasks implemented and all ATDD tests pass GREEN (40 frontend + 5 backend integration tests).
- clienteSchema updated with `.trim()` to handle whitespace-only strings per edge test requirements.
- NIT uniqueness checked in command handler via `GetByNitAsync` (works with InMemory DB used in tests); also handles PostgreSQL 23505 via middleware for production.
- Toast shown via siesa-ui-kit `ToastProvider` included inside `ClienteForm` wrapper to ensure DOM rendering in tests.
- ClienteListView updated with "Nuevo cliente" button (PlusIcon from @heroicons/react) + inline form toggle via `isFormOpen` state.
- `main.tsx` updated to import `siesa-ui-kit/styles.css`.

### File List

- frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
- frontend/src/modules/crm/clientes/application/clienteSchema.ts
- frontend/src/modules/crm/clientes/application/useCreateCliente.ts
- frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
- frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
- frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
- backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs
- backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs
- backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs
- backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs
- backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs
- backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs
- backend/src/SiesaAgents.API/Endpoints/ClientesEndpoints.cs
- backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
- frontend/src/modules/crm/clientes/application/clienteSchema.test.ts
- frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts
- frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx
- backend/tests/SiesaAgents.IntegrationTests/Clientes/CreateClienteEndpointTests.cs
