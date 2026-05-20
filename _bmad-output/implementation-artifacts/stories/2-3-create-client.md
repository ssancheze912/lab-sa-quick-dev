# Story 2.3: Create Client

Status: ready-for-dev

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a dialog form opens with four fields: Nombre, NIT/RUC, Teléfono, Ciudad — all marked as required (FR1).

2. **Given** the user fills all required fields and clicks "Guardar", **When** the form is submitted, **Then** the client is created via `POST /api/v1/clientes`, the dialog closes, the new client appears in the left panel list immediately without a page reload (FR27), and a toast displays "Cliente creado correctamente".

3. **Given** the user clicks "Guardar" with one or more required fields empty, **When** the Zod schema validation runs on submit, **Then** inline error messages appear under each empty field (FR8), the form does NOT send any request to the backend, and the dialog remains open.

4. **Given** the user submits a NIT/RUC that already exists, **When** the backend returns HTTP 409, **Then** an inline error message "El NIT/RUC ya está registrado" appears in the form without exposing technical details (NFR6), and the dialog remains open.

## Tasks / Subtasks

- [ ] Task 1 — Frontend: create `clienteSchema.ts` Zod validation schema (AC: 1, 3)
  - [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
  - [ ] Schema fields: `nombre` (string, min 1, max 200), `nit` (string, min 1, max 50), `telefono` (string, min 1, max 50), `ciudad` (string, min 1, max 100)
  - [ ] All fields required — Spanish error messages matching company standard
  - [ ] Export `ClienteFormValues` type inferred from schema

- [ ] Task 2 — Frontend: create `useCreateCliente` mutation hook (AC: 2, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
  - [ ] Use `useMutation` with `mutationFn: (data: ClienteFormValues) => clienteApiRepository.create(data)`
  - [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`, then `toast.success('Cliente creado correctamente')`
  - [ ] Return mutation object including `isPending` and `error`
  - [ ] Add `create(data: CreateClientePayload): Promise<Cliente>` to `IClienteRepository` interface
  - [ ] Implement `create()` in `clienteApiRepository.ts` — `POST /api/v1/clientes`, return typed `Cliente`

- [ ] Task 3 — Frontend: create `ClienteFormDialog` component (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx`
  - [ ] Use shadcn/ui `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogFooter`
  - [ ] Form powered by React Hook Form + Zod resolver (`clienteSchema`)
  - [ ] Fields: Nombre, NIT/RUC, Teléfono, Ciudad — each with `<label>`, `<input>`, and inline error `<p role="alert">`
  - [ ] Footer buttons: "Cancelar" (closes dialog, resets form) and "Guardar" (submits)
  - [ ] "Guardar" button shows loading state while `isPending` is true (`disabled` + "Guardando..." text)
  - [ ] On HTTP 409 from `useCreateCliente` error, set field-level error on `nit` field: "El NIT/RUC ya está registrado" via `setError('nit', ...)`
  - [ ] Dialog auto-closes on successful creation
  - [ ] `data-testid="cliente-form-dialog"` on `DialogContent`
  - [ ] `data-testid="input-nombre|input-nit|input-telefono|input-ciudad"` on each input
  - [ ] `data-testid="btn-guardar"` on submit button; `data-testid="btn-cancelar"` on cancel button
  - [ ] `data-testid="error-nit"` on the NIT/RUC inline error element
  - [ ] All labels and placeholders in Spanish; WCAG 2.1 AA — inputs linked to labels via `htmlFor`/`id`

- [ ] Task 4 — Frontend: add "Nuevo cliente" button to `ClienteListPanel` (AC: 1)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - [ ] Add a "Nuevo cliente" button at the top of the panel (above or inline with the search input)
  - [ ] Button click opens `ClienteFormDialog` (control open state with `useState<boolean>`)
  - [ ] `data-testid="btn-nuevo-cliente"` on the button
  - [ ] Use siesa-ui-kit button if available, otherwise shadcn/ui `Button` variant `default`
  - [ ] Siesa Blue `#0e79fd` as primary color (TailwindCSS `bg-[#0e79fd]` or through ui-kit token)

- [ ] Task 5 — Backend: wire POST endpoint with 409 conflict handling (AC: 2, 4)
  - [ ] `POST /api/v1/clientes` is already present in `ClienteEndpoints.cs` (added in Story 2.1)
  - [ ] `CreateClienteCommand`, `CreateClienteCommandHandler`, and `CreateClienteCommandValidator` already exist
  - [ ] Verify `ExceptionHandlingMiddleware` maps `DbUpdateException` with unique constraint violation to HTTP 409 with Problem Details body containing `"El NIT/RUC ya está registrado"` in `detail` (no stack trace — NFR6)
  - [ ] If middleware does not handle this case: add explicit catch in handler or middleware to detect PostgreSQL unique violation error code `23505` → throw domain `ConflictException("El NIT/RUC ya está registrado")` → middleware maps to 409
  - [ ] Ensure `CreateClienteCommandHandler` is registered in DI (`Program.cs`) — already done in Story 2.1

- [ ] Task 6 — Write E2E tests (AC: 1, 2, 3, 4)
  - [ ] Create `e2e/tests/clientes/clientes-create.spec.ts`
    - E2E-C-11 (P0): Clicking "Nuevo cliente" opens dialog with 4 fields (Nombre, NIT/RUC, Teléfono, Ciudad)
    - E2E-C-12 (P0): Submitting all required fields creates client; it appears in list immediately (no page reload)
    - E2E-C-13 (P0): Submitting empty form shows inline errors; no POST request fired
    - E2E-C-14 (P0): Partially empty form shows error only on empty required fields
    - E2E-C-15 (P0): Backend 409 (duplicate NIT) surfaces "El NIT/RUC ya está registrado" message in form
    - E2E-C-16 (P1): Success toast "Cliente creado correctamente" appears after creation
    - E2E-C-17 (P1): Dialog closes automatically after successful creation

- [ ] Task 7 — Write API integration tests (AC: 2, 4)
  - [ ] Add Story 2.3 describe block to `e2e/tests/clientes/clientes-api.spec.ts`
    - API-C-01 (P0): POST `/api/v1/clientes` valid payload → 201 + body with `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 with timezone)
    - API-C-02 (P0): POST `/api/v1/clientes` duplicate NIT → 409 + Problem Details body, no `stackTrace` key
    - API-C-03 (P0): POST `/api/v1/clientes` missing `nombre` → 400 + Problem Details body

- [ ] Task 8 — Write backend unit tests (AC: 3, 4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Validators/ClienteValidatorTests.cs`
    - UNIT-B-01 (P1): `CreateClienteCommandValidator` — empty `Nombre` fails validation
    - UNIT-B-02 (P1): `CreateClienteCommandValidator` — empty `Nit` fails validation
    - UNIT-B-03 (P1): `CreateClienteCommandValidator` — valid payload passes validation
  - [ ] Create / update `backend/tests/SiesaAgents.UnitTests/Handlers/ClienteHandlerTests.cs`
    - UNIT-B-04 (P1): `CreateClienteCommandHandler.HandleAsync` returns `ClienteDto` with UUID id on success
    - UNIT-B-05 (P1): `CreateClienteCommandHandler.HandleAsync` throws `ConflictException` when NIT already exists

## Dev Notes

### What Already Exists (DO NOT Re-create)

- `POST /api/v1/clientes` endpoint — already in `ClienteEndpoints.cs` (added during Story 2.1 for E2E test setup)
- `CreateClienteCommand` record — `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- `CreateClienteCommandHandler` — `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- `CreateClienteCommandValidator` (FluentValidation) — `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteCommandValidator.cs`
- `ClienteListPanel` — `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` — needs the "Nuevo cliente" button added
- `useClientes` hook — exists, provides the query cache to invalidate
- `clienteApiRepository.ts` — exists, needs `create()` method added

### Frontend: `clienteSchema.ts`

```typescript
// frontend/src/modules/crm/clientes/application/clienteSchema.ts
import { z } from 'zod'

export const clienteSchema = z.object({
  nombre:   z.string().min(1, 'El nombre es requerido').max(200),
  nit:      z.string().min(1, 'El NIT/RUC es requerido').max(50),
  telefono: z.string().min(1, 'El teléfono es requerido').max(50),
  ciudad:   z.string().min(1, 'La ciudad es requerida').max(100),
})

export type ClienteFormValues = z.infer<typeof clienteSchema>
```

### Frontend: `useCreateCliente.ts` Pattern

```typescript
// frontend/src/modules/crm/clientes/application/useCreateCliente.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'   // or project-standard toast lib
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { ClienteFormValues } from './clienteSchema'

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClienteFormValues) => clienteApiRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente creado correctamente')
    },
  })
}
```

**CRITICAL — Cache Invalidation (FR27):** `queryClient.invalidateQueries({ queryKey: ['clientes'] })` triggers an automatic refetch of the client list, making the new client visible immediately without a page reload. Never use `toast()` alone without the invalidation.

### Frontend: IClienteRepository Extension

```typescript
// Add to frontend/src/modules/crm/clientes/domain/IClienteRepository.ts
import type { ClienteFormValues } from '../application/clienteSchema'

export interface IClienteRepository {
  getAll(): Promise<Cliente[]>
  getById(id: string): Promise<Cliente>
  create(data: ClienteFormValues): Promise<Cliente>  // ADD THIS
}
```

```typescript
// Add to frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
async create(data: ClienteFormValues): Promise<Cliente> {
  const response = await apiClient.post<Cliente>('/api/v1/clientes', data)
  return response.data
},
```

### Frontend: 409 Error Handling Pattern in `ClienteFormDialog`

```typescript
// Inside ClienteFormDialog — after calling mutate():
const { mutate, isPending, error } = useCreateCliente()

const onSubmit = (values: ClienteFormValues) => {
  mutate(values, {
    onSuccess: () => onClose(),
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError('nit', { message: 'El NIT/RUC ya está registrado' })
      }
      // Other errors are surfaced via toast (already handled by mutation or can be added here)
    },
  })
}
```

### Backend: 409 Conflict Mapping

The `ExceptionHandlingMiddleware` must map NIT uniqueness violations to HTTP 409. Verify it handles PostgreSQL error code `23505` (unique_violation):

```csharp
// In ExceptionHandlingMiddleware or CreateClienteCommandHandler:
// Catch DbUpdateException → check InnerException for Npgsql.PostgresException with SqlState "23505"
// → throw ConflictException("El NIT/RUC ya está registrado")
// → ExceptionHandlingMiddleware maps ConflictException → 409 Problem Details

// Problem Details response shape (NFR6 — no stack trace):
// { "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado" }
```

If `ConflictException` does not exist yet, create `backend/src/SiesaAgents.Domain/Exceptions/ConflictException.cs`:

```csharp
namespace SiesaAgents.Domain.Exceptions;

public class ConflictException(string message) : Exception(message);
```

And register it in `ExceptionHandlingMiddleware`:

```csharp
ConflictException ex => Results.Problem(
    title: "Conflicto",
    detail: ex.Message,
    statusCode: StatusCodes.Status409Conflict),
```

### Backend: `CreateClienteRequest` DTO (if needed for endpoint binding)

The current endpoint binds directly to `CreateClienteCommand`. Verify model binding works. If a separate DTO is needed:

```csharp
// backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs
public record CreateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);
```

### Project Structure Notes

**Files to create:**

```
frontend/src/modules/crm/clientes/
  application/
    clienteSchema.ts                     # Zod schema + ClienteFormValues type
    useCreateCliente.ts                  # TanStack Query mutation hook
  presentation/
    ClienteFormDialog.tsx                # Dialog form for create
```

**Files to modify:**

```
frontend/src/modules/crm/clientes/
  domain/
    IClienteRepository.ts                # Add create() method
  infrastructure/
    clienteApiRepository.ts              # Implement create()
  presentation/
    ClienteListPanel.tsx                 # Add "Nuevo cliente" button + dialog state

backend/src/SiesaAgents.Domain/
  Exceptions/
    ConflictException.cs                 # Create if not already exists
backend/src/SiesaAgents.API/
  Middleware/
    ExceptionHandlingMiddleware.cs       # Add ConflictException → 409 mapping (if not already)
```

**Files to create (tests):**

```
frontend/src/modules/crm/clientes/ (no new unit test for this story — covered by E2E)

e2e/tests/clientes/
  clientes-create.spec.ts                # E2E-C-11 through E2E-C-17

backend/tests/SiesaAgents.UnitTests/
  Validators/
    ClienteValidatorTests.cs             # UNIT-B-01, UNIT-B-02, UNIT-B-03
  Handlers/
    ClienteHandlerTests.cs               # UNIT-B-04, UNIT-B-05 (create or extend existing file)
```

### UI Component Precedence

Per architecture.md and company standards:
1. siesa-ui-kit catalog — check first for Dialog, Button, Input, FormField
2. shadcn/ui — `Dialog` component is already installed (added in Story 1.1: `npx shadcn@latest add dialog`)
3. Custom — only if no equivalent in siesa-ui-kit or shadcn/ui

### Testing Requirements Summary

| Test ID | Level | Priority | Description |
|---------|-------|----------|-------------|
| E2E-C-11 | E2E | P0 | "Nuevo cliente" opens dialog with 4 required fields |
| E2E-C-12 | E2E | P0 | Successful create: client in list immediately, no reload |
| E2E-C-13 | E2E | P0 | Empty form: inline errors shown, no POST fired |
| E2E-C-14 | E2E | P0 | Partial empty: error only on empty fields |
| E2E-C-15 | E2E | P0 | 409 duplicate NIT: "El NIT/RUC ya está registrado" in form |
| E2E-C-16 | E2E | P1 | Success toast "Cliente creado correctamente" |
| E2E-C-17 | E2E | P1 | Dialog closes after successful create |
| API-C-01 | API | P0 | POST valid → 201 + full body with UUID + ISO 8601 createdAt |
| API-C-02 | API | P0 | POST duplicate NIT → 409 + Problem Details, no stackTrace |
| API-C-03 | API | P0 | POST missing nombre → 400 + Problem Details |
| UNIT-B-01 | Backend unit | P1 | Validator: empty Nombre fails |
| UNIT-B-02 | Backend unit | P1 | Validator: empty Nit fails |
| UNIT-B-03 | Backend unit | P1 | Validator: valid payload passes |
| UNIT-B-04 | Backend unit | P1 | Handler returns ClienteDto with UUID on success |
| UNIT-B-05 | Backend unit | P1 | Handler throws ConflictException for duplicate NIT |

### Key Anti-Patterns to Avoid

```
❌ queryClient.invalidateQueries() without await in onSuccess → always use it synchronously in onSuccess callback
❌ Showing error.message directly to user from Axios error → extract from Problem Details or use hardcoded Spanish message
❌ Sending empty string to backend for optional fields → all 4 fields are required, front-end validation blocks submission
❌ Using dialog without managing open/close state → control with useState<boolean> in ClienteListPanel
❌ Custom form dialog if shadcn/ui Dialog is already installed → use shadcn Dialog first, check siesa-ui-kit first
❌ English UI text (labels, placeholders, errors, toast) → Spanish mandatory per company standards
❌ DateTime instead of DateTimeOffset in backend → already handled in ClienteEntity (existing code), verify DTO uses DateTimeOffset
❌ app.UseSwagger() → already using Scalar
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md` — Story 2.3 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Process Patterns" (TanStack Query mutation pattern), "API & Communication Patterns" (POST /api/v1/clientes), "Frontend Architecture" (structure, query keys), "Error handling — frontend", "Enforcement Guidelines"
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-2.md` — E2E-C-11 through E2E-C-17, API-C-01 through API-C-03, UNIT-B-01 through UNIT-B-05, Risk R2 (duplicate NIT 409), Risk R4 (cache invalidation), Risk R8 (frontend validation)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md` — FR1 (create), FR8 (required fields), FR27 (immediate list update), NFR5 (input validation), NFR6 (no stack traces)
- Story 2.1: `_bmad-output/implementation-artifacts/stories/2-1-client-list-and-search.md` — backend setup (POST endpoint added as prerequisite), ClienteEntity pattern, EF Core migration
- Story 2.2: `_bmad-output/implementation-artifacts/stories/2-2-client-detail-view.md` — ClienteListPanel structure, useClientes hook
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack, Backend Stack, UX Design System

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
