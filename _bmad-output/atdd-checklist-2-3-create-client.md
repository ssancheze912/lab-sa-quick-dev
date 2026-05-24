# ATDD Checklist — Epic 2, Story 3: Create Client

**Date:** 2026-05-24
**Author:** BMad TEA Agent
**Story:** 2.3 — Create Client
**Primary Test Levels:** E2E + API + Component + Unit

---

## Story Summary

As a commercial team member, I want to register a new client by filling in a form, so that
the client is available in the system immediately for the whole team.

The story adds the write (create) slice to the `/clientes` split-panel view. A "Nuevo cliente"
button in the left panel header opens a Dialog containing `ClienteForm`. On success, the new
client appears in the list immediately (FR27, via TanStack Query cache invalidation) and the
right panel shows the created client's detail.

---

## Acceptance Criteria

1. **AC1** — Clicking "Nuevo cliente" on `/clientes` opens a form with 4 required fields:
   Nombre, NIT/RUC, Teléfono, Ciudad — all marked as required.
2. **AC2** — Successful submit (POST HTTP 201) → new client in left panel list immediately,
   right panel shows the new client's detail, toast "Cliente creado correctamente".
3. **AC3** — Clicking "Guardar" with empty required fields → inline Spanish error messages,
   NO HTTP request sent (Zod client-side validation).
4. **AC4** — Whitespace-only values in required fields → inline errors, no HTTP request sent.
5. **AC5** — Duplicate NIT → backend returns HTTP 409 → form shows
   "El NIT/RUC ya está registrado", no stack trace exposed (NFR6).
6. **AC6** — Clicking "Cancelar" closes the form without sending any HTTP request.
7. **AC7** — POST /api/v1/clientes with valid body returns HTTP 201 + full ClienteDto
   (id, nombre, nit, telefono, ciudad, createdAt, updatedAt in camelCase), id is a UUID v4.
8. **AC8** — POST /api/v1/clientes with any empty/whitespace required field returns HTTP 400
   + Problem Details RFC 7807 with `errors` object; no record persisted.
9. **AC9** — POST /api/v1/clientes with duplicate NIT returns HTTP 409 + Problem Details
   RFC 7807; `detail` references the duplicate NIT; no stack trace in response.

---

## Failing Tests Created (RED Phase)

### E2E Tests — 13 tests (AC1, AC2, AC3, AC5, AC6)

**File:** `e2e/tests/clientes/create-client.spec.ts` (new — created by this workflow)

**AC1 — Form opens with 4 required fields (4 tests):**

- **Test:** should open a dialog with Nombre field when "Nuevo cliente" is clicked
  - **Status:** RED — `ClienteForm.tsx` not implemented; Dialog wiring missing
  - **Verifies:** AC1 — Nombre input visible in Dialog

- **Test:** should show NIT/RUC field in the dialog
  - **Status:** RED — same as above
  - **Verifies:** AC1 — NIT/RUC input visible

- **Test:** should show Teléfono field in the dialog
  - **Status:** RED — same as above
  - **Verifies:** AC1 — Teléfono input visible

- **Test:** should show Ciudad field in the dialog
  - **Status:** RED — same as above
  - **Verifies:** AC1 — Ciudad input visible

**AC2 — Happy path: new client in list + detail + toast (3 tests):**

- **Test:** should show the new client in the left panel list after successful creation
  - **Status:** RED — useCreateCliente + ClienteForm not implemented; list not updated
  - **Verifies:** AC2 + FR27 — immediate list update without page reload

- **Test:** should show toast "Cliente creado correctamente" after successful creation
  - **Status:** RED — toast not wired in onSuccess callback
  - **Verifies:** AC2 — Spanish success toast

- **Test:** should display the new client detail in the right panel after creation
  - **Status:** RED — post-create navigation to detail not wired
  - **Verifies:** AC2 — right panel shows created client's detail

**AC3 — Validation: inline errors on empty submit (4 tests):**

- **Test:** should display an inline error for Nombre when form is submitted empty
  - **Status:** RED — ClienteForm with Zod validation not implemented
  - **Verifies:** AC3 — `data-testid="error-nombre"` visible

- **Test:** should display an inline error for NIT/RUC when form is submitted empty
  - **Status:** RED — same
  - **Verifies:** AC3 — `data-testid="error-nit"` visible

- **Test:** should display an inline error for Teléfono when form is submitted empty
  - **Status:** RED — same
  - **Verifies:** AC3 — `data-testid="error-telefono"` visible

- **Test:** should display an inline error for Ciudad when form is submitted empty
  - **Status:** RED — same
  - **Verifies:** AC3 — `data-testid="error-ciudad"` visible

**AC5 — Duplicate NIT: 409 conflict message (2 tests):**

- **Test:** should show "El NIT/RUC ya está registrado" when a duplicate NIT is submitted
  - **Status:** RED — 409 handling in ClienteForm not implemented
  - **Verifies:** AC5 — Spanish conflict message visible in form

- **Test:** should NOT expose a stack trace when 409 is returned
  - **Status:** RED — NFR6 compliance not yet in place
  - **Verifies:** AC5 + NFR6 — no stackTrace text visible on page

**AC6 — Cancel closes form without HTTP request (1 test):**

- **Test:** should close the form when "Cancelar" is clicked (and no POST is sent)
  - **Status:** RED — ClienteForm.tsx not implemented
  - **Verifies:** AC6 — form closes; network-first route intercept confirms no POST

---

### API Contract Tests — 20 tests (AC7, AC8, AC9)

**File:** `e2e/tests/api/clientes-post.api.spec.ts` (new — created by this workflow)

**AC7 / TC-E2-P0-06 — POST /api/v1/clientes returns 201 + ClienteDto (9 tests):**

- **Test:** TC-E2-P0-06: should return HTTP 201 when all required fields are provided
  - **Status:** RED — endpoint does not exist (404)
  - **Verifies:** AC7 — HTTP 201 response

- **Test:** TC-E2-P0-06: should return a ClienteDto JSON object (not an array)
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — direct object, not array

- **Test:** TC-E2-P0-06: should return a UUID v4 "id" field (R-008 mitigation)
  - **Status:** RED — endpoint does not exist; R-008 mitigation
  - **Verifies:** AC7 + R-008 — UUID v4, not integer

- **Test:** should return ClienteDto with "nombre" matching the submitted value
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — nombre field

- **Test:** should return ClienteDto with "nit" matching the submitted value
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — nit field

- **Test:** should return ClienteDto with "telefono" field
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — telefono field

- **Test:** should return ClienteDto with "ciudad" field
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — ciudad field

- **Test:** should return ClienteDto with "createdAt" in ISO 8601 format with timezone
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — DateTimeOffset ISO 8601 serialization

- **Test:** should return Content-Type application/json for a 201 response
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC7 — correct Content-Type header

**AC8 / TC-E2-P0-05 — POST returns 400 + Problem Details (7 tests):**

- **Test:** TC-E2-P0-05: should return HTTP 400 when "nombre" is empty
  - **Status:** RED — FluentValidation not wired
  - **Verifies:** AC8 — 400 for empty nombre

- **Test:** TC-E2-P0-05: should return HTTP 400 when "nombre" is whitespace-only
  - **Status:** RED — FluentValidation NotEmpty() not implemented
  - **Verifies:** AC8 — whitespace treated as empty

- **Test:** TC-E2-P0-05: should return HTTP 400 when "nit" is empty
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** AC8 — 400 for empty nit

- **Test:** TC-E2-P0-05: should return HTTP 400 when "telefono" is empty
  - **Status:** RED — same
  - **Verifies:** AC8 — 400 for empty telefono

- **Test:** TC-E2-P0-05: should return HTTP 400 when "ciudad" is empty
  - **Status:** RED — same
  - **Verifies:** AC8 — 400 for empty ciudad

- **Test:** should return Content-Type application/problem+json on 400
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC8 — Problem Details media type

- **Test:** should return Problem Details RFC 7807 body on 400
  - **Status:** RED — endpoint does not exist
  - **Verifies:** AC8 — `status` and `errors` fields present

- **Test:** should NOT persist a record when 400 is returned
  - **Status:** RED — FluentValidation not guarding
  - **Verifies:** AC8 — no record created on bad input

**AC9 / TC-E2-P0-02 — POST returns 409 + Problem Details for duplicate NIT (4 tests):**

- **Test:** TC-E2-P0-02: should return HTTP 409 when NIT already exists
  - **Status:** RED — DuplicateNitException handling not implemented
  - **Verifies:** AC9 — HTTP 409

- **Test:** TC-E2-P0-02: should return Content-Type application/problem+json on 409
  - **Status:** RED — ExceptionHandlingMiddleware mapping not configured
  - **Verifies:** AC9 — Problem Details media type

- **Test:** TC-E2-P0-02: should NOT expose stackTrace in the 409 response body (NFR6)
  - **Status:** RED — middleware may not exist
  - **Verifies:** AC9 + NFR6 — no stackTrace field

- **Test:** should NOT persist the duplicate record on 409
  - **Status:** RED — ExistsByNitAsync not implemented
  - **Verifies:** AC9 — only original record exists

---

### Component Tests — 16 tests (AC1, AC2, AC3, AC4, AC5, AC6)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` (new — created by this workflow)

**AC1 — Form renders 4 required fields (5 tests):**

- **Test:** should render a Nombre input field
  - **Status:** RED — `ClienteForm.tsx` module does not exist
  - **Verifies:** AC1 — `data-testid="input-nombre"`

- **Test:** should render a NIT/RUC input field
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — `data-testid="input-nit"`

- **Test:** should render a Teléfono input field
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — `data-testid="input-telefono"`

- **Test:** should render a Ciudad input field
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — `data-testid="input-ciudad"`

- **Test:** should have aria-label="Crear nuevo cliente" on the form container (WCAG 2.1 AA)
  - **Status:** RED — module does not exist
  - **Verifies:** AC1 — ARIA label on form container

**TC-E2-P0-08 / AC3 — Empty submit: 4 inline errors + zero HTTP (5 tests):**

- **Test:** TC-E2-P0-08: should show inline error for Nombre when form is submitted empty
  - **Status:** RED — Zod validation not connected to form
  - **Verifies:** AC3 — `error-nombre` visible

- **Test:** TC-E2-P0-08: should show inline error for NIT/RUC when form is submitted empty
  - **Status:** RED — same
  - **Verifies:** AC3 — `error-nit` visible

- **Test:** TC-E2-P0-08: should show inline error for Teléfono when form is submitted empty
  - **Status:** RED — same
  - **Verifies:** AC3 — `error-telefono` visible

- **Test:** TC-E2-P0-08: should show inline error for Ciudad when form is submitted empty
  - **Status:** RED — same
  - **Verifies:** AC3 — `error-ciudad` visible

- **Test:** TC-E2-P0-08: should NOT send any HTTP request when form is submitted empty
  - **Status:** RED — submit guard not in place
  - **Verifies:** AC3 — zero MSW HTTP calls

**AC4 — Whitespace-only inputs (2 tests):**

- **Test:** should show inline error for Nombre when only spaces are entered
  - **Status:** RED — trim+min(1) Zod pattern not in schema
  - **Verifies:** AC4 — whitespace treated as empty

- **Test:** should NOT send any HTTP request when Nombre contains only whitespace
  - **Status:** RED — Zod trim validation not wired
  - **Verifies:** AC4 — no HTTP on whitespace input

**AC2 — Valid submit calls POST and invokes onSuccess (2 tests):**

- **Test:** should call POST /api/v1/clientes with correct body when all fields are valid
  - **Status:** RED — useCreateCliente + ClienteForm not implemented
  - **Verifies:** AC2 — correct POST body

- **Test:** should invoke onSuccess callback with the created cliente on successful submit
  - **Status:** RED — onSuccess prop not wired
  - **Verifies:** AC2 — onSuccess called once

**AC5 — 409 conflict message (3 tests):**

- **Test:** should show "El NIT/RUC ya está registrado" when POST returns 409
  - **Status:** RED — 409 handler not in ClienteForm
  - **Verifies:** AC5 — hardcoded Spanish conflict message

- **Test:** should NOT dismiss the form on 409 response
  - **Status:** RED — form not implemented
  - **Verifies:** AC5 — form stays open on conflict

- **Test:** should NOT expose any stack trace or technical message on 409 (NFR6)
  - **Status:** RED — form not implemented
  - **Verifies:** AC5 + NFR6 — no stack trace in rendered UI

**AC6 — Cancel (2 tests):**

- **Test:** should call onCancel when "Cancelar" button is clicked
  - **Status:** RED — form not implemented
  - **Verifies:** AC6 — onCancel invoked

- **Test:** should NOT send any HTTP request when "Cancelar" is clicked
  - **Status:** RED — form not implemented
  - **Verifies:** AC6 — no POST on cancel

**Pending state (1 test):**

- **Test:** should have aria-disabled on "Guardar" while the mutation is in flight
  - **Status:** RED — isPending state not implemented
  - **Verifies:** AC1 (WCAG) — button correctly disabled during submit

---

### Schema Unit Tests — 9 tests (AC3, AC4)

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts` (new — created by this workflow)

**AC3 — Empty fields fail with Spanish errors (6 tests):**

- **Test:** should fail when "nombre" is empty
  - **Status:** RED — `clienteSchema.ts` does not exist
  - **Verifies:** AC3 — Zod fails on empty nombre

- **Test:** should return a Spanish error message when "nombre" is empty
  - **Status:** RED — same
  - **Verifies:** AC3 — error message is in Spanish

- **Test:** should fail when "nit" is empty
  - **Status:** RED — same
  - **Verifies:** AC3 — Zod fails on empty nit

- **Test:** should return a Spanish error message when "nit" is empty
  - **Status:** RED — same
  - **Verifies:** AC3 — error in Spanish for nit

- **Test:** should fail when "telefono" is empty
  - **Status:** RED — same
  - **Verifies:** AC3 — Zod fails on empty telefono

- **Test:** should fail when "ciudad" is empty
  - **Status:** RED — same
  - **Verifies:** AC3 — Zod fails on empty ciudad

**AC4 — Whitespace-only fails (4 tests):**

- **Test:** should fail when "nombre" is whitespace-only
  - **Status:** RED — trim+min(1) pattern not in schema
  - **Verifies:** AC4 — whitespace rejected

- **Test:** should fail when "nit" is whitespace-only
  - **Status:** RED — same
  - **Verifies:** AC4 — whitespace rejected

- **Test:** should fail when "telefono" is whitespace-only
  - **Status:** RED — same
  - **Verifies:** AC4 — whitespace rejected

- **Test:** should fail when "ciudad" is whitespace-only
  - **Status:** RED — same
  - **Verifies:** AC4 — whitespace rejected

**Happy path (1 test):**

- **Test:** should pass when all fields have non-empty, non-whitespace values
  - **Status:** RED — schema does not exist
  - **Verifies:** schema accepts valid data

---

### Hook Unit Tests — 4 tests (AC2, AC5)

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts` (new — created by this workflow)

**AC2 — Hook calls POST and invalidates ['clientes'] (3 tests):**

- **Test:** should set isSuccess to true when POST /api/v1/clientes returns 201
  - **Status:** RED — `useCreateCliente.ts` does not exist
  - **Verifies:** AC2 — mutation succeeds

- **Test:** should invalidate the ["clientes"] query key on successful POST
  - **Status:** RED — invalidateQueries not wired
  - **Verifies:** AC2 + FR27 — list query is invalidated

- **Test:** should NOT directly call toast (toast is caller responsibility)
  - **Status:** RED — module does not exist
  - **Verifies:** AC2 — presentation concern stays in form layer

**Error handling (2 tests):**

- **Test:** should expose isError true when POST /api/v1/clientes returns 500
  - **Status:** RED — module does not exist
  - **Verifies:** generic error exposed to form

- **Test:** should NOT invalidate ["clientes"] query key when POST returns 409
  - **Status:** RED — 409 handling not in hook
  - **Verifies:** AC5 — 409 is business condition, not a cache-invalidation trigger

---

### Backend Unit Tests — 8 tests (AC7, AC9)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` (new — created by this workflow)

**AC7 — Handler creates entity and returns ClienteDto (6 tests):**

- **Test:** Handle_WhenNitIsUnique_ReturnsClienteDto
  - **Status:** RED — compile error: `CreateClienteCommand` / `CreateClienteCommandHandler` do not exist
  - **Verifies:** AC7 — returns ClienteDto on happy path

- **Test:** Handle_WhenNitIsUnique_ReturnsDtoWithNombreMatchingCommand
  - **Status:** RED — compile error
  - **Verifies:** AC7 — Nombre mapping

- **Test:** Handle_WhenNitIsUnique_ReturnsDtoWithNitMatchingCommand
  - **Status:** RED — compile error
  - **Verifies:** AC7 — Nit mapping

- **Test:** Handle_WhenNitIsUnique_ReturnsDtoWithNonEmptyUuidId
  - **Status:** RED — compile error; R-008 mitigation
  - **Verifies:** AC7 + R-008 — UUID id, not integer

- **Test:** Handle_WhenNitIsUnique_ReturnsDtoWithCreatedAtAsDateTimeOffset
  - **Status:** RED — compile error; company standard
  - **Verifies:** AC7 — DateTimeOffset, never DateTime

- **Test:** Handle_WhenNitIsUnique_CallsAddAsyncOnRepository
  - **Status:** RED — compile error
  - **Verifies:** AC7 — AddAsync called once

- **Test:** Handle_WhenNitIsUnique_CallsExistsByNitAsyncWithCorrectNit
  - **Status:** RED — compile error
  - **Verifies:** AC7/AC9 — ExistsByNitAsync called with correct NIT

**AC9 — DuplicateNitException on duplicate NIT (3 tests):**

- **Test:** Handle_WhenNitAlreadyExists_ThrowsDuplicateNitException
  - **Status:** RED — compile error: `DuplicateNitException` does not exist
  - **Verifies:** AC9 — exception thrown on duplicate

- **Test:** Handle_WhenNitAlreadyExists_DoesNotCallAddAsync
  - **Status:** RED — compile error
  - **Verifies:** AC9 — no partial persistence

- **Test:** Handle_WhenNitAlreadyExists_DuplicateNitExceptionContainsNit
  - **Status:** RED — compile error
  - **Verifies:** AC9 — exception carries the duplicate NIT value

---

## Summary by Level

| Level | File | Tests | Status |
|-------|------|-------|--------|
| E2E (Playwright) | `e2e/tests/clientes/create-client.spec.ts` | 13 | RED |
| API Contract (Playwright) | `e2e/tests/api/clientes-post.api.spec.ts` | 20 | RED |
| Component (Vitest+RTL) | `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` | 16 | RED |
| Schema Unit (Vitest) | `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts` | 9 | RED |
| Hook Unit (Vitest) | `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts` | 5 | RED |
| Backend Unit (xUnit) | `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` | 10 | RED |
| **Total** | | **73** | **RED** |

---

## Required data-testid Attributes

### `ClienteForm.tsx`

- `input-nombre` — Nombre text input field
- `input-nit` — NIT/RUC text input field
- `input-telefono` — Teléfono text input field
- `input-ciudad` — Ciudad text input field
- `error-nombre` — Inline error message for Nombre (role="alert")
- `error-nit` — Inline error message for NIT/RUC (role="alert")
- `error-telefono` — Inline error message for Teléfono (role="alert")
- `error-ciudad` — Inline error message for Ciudad (role="alert")
- `nit-conflict-error` — 409 conflict banner "El NIT/RUC ya está registrado" (role="alert")

### Accessibility (WCAG 2.1 AA)

- Form container: `<form aria-label="Crear nuevo cliente">` (role="form" inferred)
- Each input linked to `<label htmlFor={fieldId}>`
- Error messages: `role="alert"` so screen readers announce immediately
- "Guardar" button: `aria-disabled="true"` when `isPending`
- 409 conflict message: `role="alert"` in a banner within the form

---

## Mock Requirements

### MSW Handler: POST /api/v1/clientes

Used in component tests (`ClienteForm.test.tsx`) and hook tests (`useCreateCliente.test.ts`).

**Success response (AC2, AC7):**
```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "nombre": "Empresa Test SA",
  "nit": "900123456-7",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-05-24T15:00:00Z",
  "updatedAt": "2026-05-24T15:00:00Z"
}
```
HTTP status: 201

**Conflict response (AC5, AC9):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El NIT/RUC '900123456-7' ya está registrado."
}
```
HTTP status: 409

**Validation error response (AC8):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "nombre": ["El nombre es requerido."]
  }
}
```
HTTP status: 400

---

## Implementation Checklist

### Backend Tasks (make API + unit tests green)

#### Tests: CreateClienteCommandHandler unit tests (AC7, AC9)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Exceptions/DuplicateNitException.cs`
  — `public class DuplicateNitException(string nit) : Exception { public string Nit => nit; }`
- [ ] Add `ExistsByNitAsync(string nit, CancellationToken ct)` to `IClienteRepository.cs`
- [ ] Implement `ExistsByNitAsync` in `ClienteRepository.cs` using EF Core `AnyAsync`
- [ ] Add `AddAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository.cs` if missing
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
  — `public record CreateClienteCommand(string Nombre, string Nit, string Telefono, string Ciudad) : IRequest<ClienteDto>;`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- [ ] Verify `ClienteEntity.Create()` factory method exists (private ctor + static factory pattern)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "CreateClienteCommandHandler"`
- [ ] ✅ Unit tests pass (green phase)

**Estimated Effort:** 2 hours

---

#### Tests: POST /api/v1/clientes API contract tests (AC7, AC8, AC9)

**File:** `e2e/tests/api/clientes-post.api.spec.ts`

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
  — `public record CreateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
  — FluentValidation `AbstractValidator<CreateClienteRequest>` with `.NotEmpty()` for all 4 fields
- [ ] Register validator in `Program.cs`: `builder.Services.AddValidatorsFromAssemblyContaining<CreateClienteRequestValidator>()`
- [ ] Add `POST /api/v1/clientes` endpoint in `ClienteEndpoints.cs`
- [ ] Ensure `ExceptionHandlingMiddleware` maps `DuplicateNitException` → HTTP 409 Problem Details
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-post.api.spec.ts`
- [ ] ✅ API contract tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Frontend Tasks (make schema + hook + component + E2E tests green)

#### Tests: clienteSchema unit tests (AC3, AC4)

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`:
  ```typescript
  export const createClienteSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es requerido'),
    nit: z.string().trim().min(1, 'El NIT/RUC es requerido'),
    telefono: z.string().trim().min(1, 'El teléfono es requerido'),
    ciudad: z.string().trim().min(1, 'La ciudad es requerida'),
  })
  export type CreateClienteFormValues = z.infer<typeof createClienteSchema>
  ```
- [ ] Verify `zod` is in `frontend/package.json` dependencies
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/application/clienteSchema.test.ts`
- [ ] ✅ Schema unit tests pass

**Estimated Effort:** 0.5 hours

---

#### Tests: useCreateCliente hook unit tests (AC2, AC5)

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`

- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`:
  ```typescript
  export function useCreateCliente() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: CreateClienteFormValues) => clienteApiRepository.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] })
      },
    })
  }
  ```
- [ ] Verify `clienteApiRepository.create()` is implemented (already in `clienteApiRepository.ts`)
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/application/useCreateCliente.test.ts`
- [ ] ✅ Hook unit tests pass

**Estimated Effort:** 0.5 hours

---

#### Tests: ClienteForm component tests (AC1, AC2, AC3, AC4, AC5, AC6)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- [ ] Props: `{ onSuccess?: (cliente: Cliente) => void; onCancel?: () => void }`
- [ ] Use React Hook Form + Zod resolver (`@hookform/resolvers/zod`)
- [ ] 4 fields, each with `data-testid` on the input AND the error span
- [ ] Form container: `<form aria-label="Crear nuevo cliente">`
- [ ] Error spans: `<span data-testid="error-{field}" role="alert">`
- [ ] Conflict banner: `<div data-testid="nit-conflict-error" role="alert">El NIT/RUC ya está registrado</div>`
- [ ] "Guardar" button: `aria-disabled="true"` when `isPending`
- [ ] "Cancelar" button: calls `onCancel?.()` on click, no submit
- [ ] `onSuccess` mutation callback: call `toast.success('Cliente creado correctamente')`, call `onSuccess?.(newCliente)`, reset form
- [ ] `onError` mutation callback: if 409, set `nitConflictError` state; else show error toast
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- [ ] ✅ Component tests pass

**Estimated Effort:** 3 hours

---

#### Tests: E2E create-client tests (AC1, AC2, AC3, AC5, AC6)

**File:** `e2e/tests/clientes/create-client.spec.ts`

- [ ] Wire "Nuevo cliente" button in `frontend/src/routes/_app/clientes.tsx`:
  - Button in left panel header (Heroicons PlusIcon or UserPlusIcon)
  - Clicking opens Dialog/Modal with `<ClienteForm />`
  - `onSuccess`: close dialog + navigate to `/clientes/:newClienteId`
  - `onCancel`: close dialog
- [ ] Check `siesa-ui-kit` for Dialog component first; fallback to `shadcn/ui` Dialog
- [ ] Add `data-testid` attributes for error spans: `error-nombre`, `error-nit`, `error-telefono`, `error-ciudad`
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts`
- [ ] ✅ E2E tests pass

**Estimated Effort:** 2.5 hours

---

## Running Tests

```bash
# Backend unit tests (requires compilation)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "CreateClienteCommandHandler"

# API contract tests (requires backend running on port 5000)
npx playwright test e2e/tests/api/clientes-post.api.spec.ts

# Frontend schema unit tests
pnpm --filter frontend test src/modules/crm/clientes/application/clienteSchema.test.ts

# Frontend hook unit tests
pnpm --filter frontend test src/modules/crm/clientes/application/useCreateCliente.test.ts

# Frontend component tests
pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteForm.test.tsx

# E2E tests (requires frontend on 5173 + backend on 5000)
npx playwright test e2e/tests/clientes/create-client.spec.ts

# Run ALL failing tests for this story
pnpm --filter frontend test && \
npx playwright test e2e/tests/api/clientes-post.api.spec.ts \
  e2e/tests/clientes/create-client.spec.ts && \
dotnet test backend/tests/SiesaAgents.UnitTests/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ E2E tests written and failing (13 tests in `create-client.spec.ts`)
- ✅ API contract tests written and failing (20 tests in `clientes-post.api.spec.ts`)
- ✅ Component tests written and failing (16 tests in `ClienteForm.test.tsx`)
- ✅ Schema unit tests written and failing (9 tests in `clienteSchema.test.ts`)
- ✅ Hook unit tests written and failing (5 tests in `useCreateCliente.test.ts`)
- ✅ Backend unit tests written and failing to compile (10 tests in `CreateClienteCommandHandlerTests.cs`)
- ✅ Network-first intercept pattern applied in all E2E tests
- ✅ MSW handlers configured for all component/hook test scenarios
- ✅ data-testid attributes documented for all new UI elements
- ✅ Given-When-Then structure used throughout

**Expected failure modes:**

- **Component/hook/schema failures:** `Cannot find module './ClienteForm'`,
  `Cannot find module './useCreateCliente'`, `Cannot find module './clienteSchema'`
- **Backend compile failures:** `CreateClienteCommand`, `CreateClienteCommandHandler`,
  `DuplicateNitException` namespaces not found
- **API failures:** `404 Not Found` on `POST localhost:5000/api/v1/clientes`
- **E2E failures:** `Timeout: waiting for locator('[data-testid="error-nombre"]')`;
  "Nuevo cliente" button present but Dialog/ClienteForm not wired

---

### GREEN Phase (DEV Team — Next Steps)

**Recommended Implementation Order:**

1. **Backend domain** (unblocks unit tests):
   - `DuplicateNitException.cs`
   - `IClienteRepository` — add `ExistsByNitAsync` + `AddAsync`
   - `ClienteEntity.Create()` factory (verify or create)
2. **Backend application** (unblocks API tests):
   - `CreateClienteCommand.cs` + `CreateClienteCommandHandler.cs`
   - `CreateClienteRequestValidator.cs` (FluentValidation)
   - `CreateClienteRequest.cs` DTO
   - `POST /api/v1/clientes` endpoint in `ClienteEndpoints.cs`
   - `ExceptionHandlingMiddleware` — add `DuplicateNitException` → 409
3. **Frontend schema:**
   - `clienteSchema.ts` — Zod schema with `.trim().min(1)` pattern
4. **Frontend hook:**
   - `useCreateCliente.ts` — TanStack Query mutation
5. **Frontend component:**
   - `ClienteForm.tsx` — React Hook Form + Zod + all states
6. **Route wiring:**
   - `_app/clientes.tsx` — "Nuevo cliente" button + Dialog + ClienteForm integration

---

### REFACTOR Phase (After All Tests Pass)

1. Confirm TypeScript strict check: `npx tsc --noEmit` from `frontend/`
2. Run `dotnet build` — zero warnings/errors
3. Run full test suite: all 73 tests for Story 2.3 pass
4. Verify WCAG 2.1 AA compliance on ClienteForm rendered states
5. Verify no stack traces exposed in any error response (NFR6)

---

## Risk Mitigations Addressed

| Risk | Mitigation | Verified By |
|------|-----------|-------------|
| R-002 — Duplicate NIT check absent (dirty data) | `ExistsByNitAsync` + DuplicateNitException + 409 + "El NIT/RUC ya está registrado" | TC-E2-P0-02 (API + E2E + Component) |
| R-004 — API accepts empty/whitespace required fields | FluentValidation `.NotEmpty()` (rejects whitespace) + Zod `.trim().min(1)` | TC-E2-P0-05 (API + Schema + Component AC3/AC4) |
| R-008 — Integer PK instead of UUID | `ClienteEntity.Create()` using `Guid.NewGuid()`; API test asserts UUID v4 regex | TC-E2-P0-06 (API + Backend Unit) |

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests apply `page.route(...)` BEFORE any user action
- **selector-resilience.md** — All selectors use `data-testid` or ARIA roles (no fragile CSS)
- **component-tdd.md** — Component tests use MSW; `QueryClientProvider` wrapper; Given-When-Then
- **test-quality.md** — Explicit async waits (`findBy*`); `afterEach` cleanup; no hard waits; one assertion per test
- **test-levels-framework.md** — AC7/AC8/AC9 at API + Backend Unit; AC1/AC3/AC4/AC5/AC6 at Component; AC1/AC2/AC5/AC6 at E2E

---

**Generated by**: BMad TEA Agent — Test Architect Module (ATDD workflow)
**Story:** 2.3 — Create Client
**Epic:** 2 — Client Management
**Date:** 2026-05-24
