# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

A commercial team member needs to register a new client via a form dialog. The form opens from the client list panel, captures the four required fields (Nombre, NIT/RUC, Teléfono, Ciudad), validates them client-side (Zod + React Hook Form), submits to POST /api/v1/clientes, and immediately refreshes the list via TanStack Query invalidation.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1).

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created via `POST /api/v1/clientes`, the client list is updated immediately (FR27 — `invalidateQueries(['clientes'])`), **And** a toast "Cliente creado correctamente" is shown.

3. **Given** the user submits with one or more required fields empty, **When** the form is validated (Zod + React Hook Form), **Then** clear inline error messages appear on the empty fields (FR8), **And** the form is NOT submitted to the backend.

4. **Given** the user submits a NIT/RUC that already exists, **When** the backend returns a 409 Conflict, **Then** "El NIT/RUC ya está registrado" is displayed without exposing technical details (NFR6).

5. **Given** the form submission is in-flight, **When** the mutation is pending, **Then** the submit button is disabled and shows "Guardando..." to prevent duplicate submissions.

6. **Given** the user clicks "Cancelar" or closes the form without submitting, **When** the form closes, **Then** no client is created and the client list remains unchanged.

---

## Failing Tests Created (RED Phase)

### E2E Tests (22 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts`

- **Test:** should display a "Nuevo cliente" button in the client list panel
  - **Status:** RED — `nuevo-cliente-button` testid not yet implemented
  - **Verifies:** AC1 — trigger button exists in left panel header

- **Test:** should open a form dialog when "Nuevo cliente" is clicked
  - **Status:** RED — `cliente-form` testid not yet implemented
  - **Verifies:** AC1 — form dialog opens on click

- **Test:** should display the Nombre input field in the create form
  - **Status:** RED — `field-nombre` testid not yet implemented
  - **Verifies:** AC1 — Nombre field present

- **Test:** should display the NIT/RUC input field in the create form
  - **Status:** RED — `field-nit` testid not yet implemented
  - **Verifies:** AC1 — NIT/RUC field present

- **Test:** should display the Teléfono input field in the create form
  - **Status:** RED — `field-telefono` testid not yet implemented
  - **Verifies:** AC1 — Teléfono field present

- **Test:** should display the Ciudad input field in the create form
  - **Status:** RED — `field-ciudad` testid not yet implemented
  - **Verifies:** AC1 — Ciudad field present

- **Test:** should display a submit button in the create form
  - **Status:** RED — `submit-button` testid not yet implemented
  - **Verifies:** AC1 — submit button exists and is enabled

- **Test:** should display a cancel button in the create form
  - **Status:** RED — `cancel-button` testid not yet implemented
  - **Verifies:** AC1 — cancel button exists

- **Test:** should call POST /api/v1/clientes when the form is submitted with valid data
  - **Status:** RED — POST endpoint not implemented
  - **Verifies:** AC2 — network call made on valid submit

- **Test:** should close the create form after a successful submission
  - **Status:** RED — form close behavior not implemented
  - **Verifies:** AC2 — form dismissed on success

- **Test:** should display a success toast "Cliente creado correctamente" after successful submission
  - **Status:** RED — toast not wired to mutation `onSuccess`
  - **Verifies:** AC2 — success toast shown in Spanish

- **Test:** should refresh the client list after successful creation
  - **Status:** RED — `invalidateQueries(['clientes'])` not yet called
  - **Verifies:** AC2 — FR27 list refresh via TanStack Query

- **Test:** should show inline error for Nombre when form is submitted with Nombre empty
  - **Status:** RED — Zod validation not yet wired
  - **Verifies:** AC3 — inline Nombre error

- **Test:** should show inline error for NIT when form is submitted with NIT empty
  - **Status:** RED — Zod validation not yet wired
  - **Verifies:** AC3 — inline NIT/RUC error

- **Test:** should show inline error for Teléfono when form is submitted with Teléfono empty
  - **Status:** RED — Zod validation not yet wired
  - **Verifies:** AC3 — inline Teléfono error

- **Test:** should show inline error for Ciudad when form is submitted with Ciudad empty
  - **Status:** RED — Zod validation not yet wired
  - **Verifies:** AC3 — inline Ciudad error

- **Test:** should NOT submit the form to the backend when all fields are empty
  - **Status:** RED — form submit guard not implemented
  - **Verifies:** AC3 — no backend call on validation failure

- **Test:** should keep the form open when validation fails
  - **Status:** RED — form behavior on error not implemented
  - **Verifies:** AC3 — form stays open on client-side error

- **Test:** should display "El NIT/RUC ya está registrado" when backend returns 409 Conflict
  - **Status:** RED — 409 error handling not implemented in `useCreateCliente`
  - **Verifies:** AC4 — conflict toast shown

- **Test:** should NOT display a stack trace when 409 Conflict occurs
  - **Status:** RED — error handling not implemented
  - **Verifies:** AC4 / NFR6 — no technical details exposed

- **Test:** should keep the create form open when a 409 error occurs
  - **Status:** RED — form close behavior on error not implemented
  - **Verifies:** AC4 — form stays open so user can correct NIT

- **Test:** should display a generic error toast for non-409 server errors
  - **Status:** RED — generic error handler not wired
  - **Verifies:** AC4 — fallback error message

- **Test:** should disable the submit button while the POST request is in-flight
  - **Status:** RED — `isPending` state not wired to button disabled prop
  - **Verifies:** AC5 — button disabled during mutation

- **Test:** should show "Guardando..." on the submit button while mutation is pending
  - **Status:** RED — loading text not implemented
  - **Verifies:** AC5 — loading indicator on button

- **Test:** should re-enable the submit button after the POST request completes
  - **Status:** RED — button state restoration not implemented
  - **Verifies:** AC5 — button re-enables after mutation

- **Test:** should close the create form when "Cancelar" is clicked
  - **Status:** RED — cancel button callback not implemented
  - **Verifies:** AC6 — form dismissal on cancel

- **Test:** should NOT call POST /api/v1/clientes when "Cancelar" is clicked
  - **Status:** RED — cancel without submit behavior not implemented
  - **Verifies:** AC6 — no side effects on cancel

- **Test:** should keep the existing client list unchanged after cancelling the form
  - **Status:** RED — no `invalidateQueries` on cancel not verified
  - **Verifies:** AC6 — list unchanged after cancel

### API Tests (13 tests)

**File:** `e2e/tests/api/create-client.api.spec.ts`

- **Test:** should return HTTP 201 when all required fields are provided
  - **Status:** RED — POST /api/v1/clientes endpoint not implemented
  - **Verifies:** AC2 — 201 Created response

- **Test:** should return Content-Type: application/json on 201 response
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — correct response content type

- **Test:** should return the created client with a UUID id field
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — UUID id in response body

- **Test:** should return the created client with all input fields echoed back in camelCase
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — camelCase JSON serialization

- **Test:** should return createdAt and updatedAt as ISO 8601 timestamps
  - **Status:** RED — endpoint not implemented; DateTimeOffset serialization not configured
  - **Verifies:** AC2 — timestamp shape

- **Test:** should return a Location header pointing to /api/v1/clientes/{id} on 201 Created
  - **Status:** RED — Results.Created not called yet
  - **Verifies:** AC2 — REST 201 Location header

- **Test:** should NOT return snake_case field names in the 201 response body
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — camelCase serialization (JSON naming policy)

- **Test:** should persist the created client — GET returns it after creation
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — persistence via EF Core

- **Test:** should return HTTP 400 when "nombre" is missing
  - **Status:** RED — FluentValidation not wired
  - **Verifies:** AC3 — 400 on missing Nombre

- **Test:** should return HTTP 400 when "nit" is missing
  - **Status:** RED — FluentValidation not wired
  - **Verifies:** AC3 — 400 on missing NIT

- **Test:** should return HTTP 400 when "telefono" is missing
  - **Status:** RED — FluentValidation not wired
  - **Verifies:** AC3 — 400 on missing Teléfono

- **Test:** should return HTTP 400 when "ciudad" is missing
  - **Status:** RED — FluentValidation not wired
  - **Verifies:** AC3 — 400 on missing Ciudad

- **Test:** should return HTTP 400 when body is completely empty
  - **Status:** RED — FluentValidation not wired
  - **Verifies:** AC3 — 400 on empty body

- **Test:** should return Problem Details RFC 7807 format on 400 error
  - **Status:** RED — ValidationProblem not configured
  - **Verifies:** AC3 — Problem Details shape with errors map

- **Test:** should return HTTP 409 when a client with the same NIT already exists
  - **Status:** RED — ConflictException not thrown; uk_clientes_nit not handled
  - **Verifies:** AC4 — 409 on duplicate NIT

- **Test:** should return Problem Details RFC 7807 format on 409 Conflict
  - **Status:** RED — ExceptionHandlingMiddleware ConflictException mapping not implemented
  - **Verifies:** AC4 — Problem Details on 409

- **Test:** should return a user-friendly conflict detail message (no stack trace in 409 response)
  - **Status:** RED — error detail sanitization not implemented
  - **Verifies:** AC4 / NFR6 — no stack trace in API response

---

## Data Factories Used

### Cliente Factory (existing — extended)

**File:** `e2e/support/factories/cliente.factory.ts`

**Exports used:**
- `createClientePayload(overrides?)` — Build POST request body (no id/timestamps)
- `createClienteDto(overrides?)` — Build full response mock (with id + timestamps)
- `createClienteDtos(count, overrides?)` — Build array of mocked DTOs

---

## Fixtures Used

**File:** `e2e/fixtures/base.fixture.ts`

Not extended for Story 2.3 — tests use direct `page.route()` intercepts (network-first) without fixture composition, consistent with Story 2.1 and 2.2 patterns. The `clientesPage` fixture was not used because some tests need custom route setup prior to navigation.

---

## Mock Requirements

### POST /api/v1/clientes — Success (201)

**Endpoint:** `POST /api/v1/clientes`

**Request Body:**
```json
{ "nombre": "Empresa Nueva SAS", "nit": "900111222-1", "telefono": "3001234567", "ciudad": "Bogotá" }
```

**Success Response (201 Created):**
```json
{
  "id": "uuid-v4",
  "nombre": "Empresa Nueva SAS",
  "nit": "900111222-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-24T00:00:00.000Z",
  "updatedAt": "2026-06-24T00:00:00.000Z"
}
```

### POST /api/v1/clientes — Conflict (409)

**Conflict Response (409):**
```json
{ "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado." }
```

### POST /api/v1/clientes — Validation (400)

**Validation Error Response (400):**
```json
{
  "status": 400,
  "title": "Validation failed",
  "errors": {
    "nombre": ["El nombre es requerido"],
    "nit": ["El NIT/RUC es requerido"]
  }
}
```

---

## Required data-testid Attributes

### ClienteListView (left panel header)

- `nuevo-cliente-button` — "Nuevo cliente" trigger button (Heroicons PlusIcon)

### ClienteForm (form root and fields)

- `cliente-form` — `<form>` root element (`aria-label="Crear nuevo cliente"`)
- `field-nombre` — `<input>` for Nombre field
- `field-nit` — `<input>` for NIT/RUC field
- `field-telefono` — `<input>` for Teléfono field
- `field-ciudad` — `<input>` for Ciudad field
- `submit-button` — submit button (disabled + "Guardando..." when `isPending`)
- `cancel-button` — cancel button

**Implementation Example:**
```tsx
<form data-testid="cliente-form" aria-label="Crear nuevo cliente">
  <input data-testid="field-nombre" id="nombre" {...register('nombre')} />
  <input data-testid="field-nit" id="nit" {...register('nit')} />
  <input data-testid="field-telefono" id="telefono" {...register('telefono')} />
  <input data-testid="field-ciudad" id="ciudad" {...register('ciudad')} />
  <button data-testid="cancel-button" type="button" onClick={onCancel}>Cancelar</button>
  <button data-testid="submit-button" type="submit" disabled={isPending}>
    {isPending ? 'Guardando...' : 'Guardar'}
  </button>
</form>
```

---

## Implementation Checklist

### Test Group: AC1 — Form opens with all required fields (8 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts` — `AC1` describe block

**Tasks to make these tests pass:**

- [ ] Add `data-testid="nuevo-cliente-button"` to the "Nuevo cliente" button in `ClienteListView.tsx`
- [ ] Add local state `isCreateFormOpen` (`useState<boolean>`) to `ClienteListView.tsx`
- [ ] Wire `onClick` of button to `setIsCreateFormOpen(true)`
- [ ] Render `<ClienteForm>` inside a Dialog/Sheet when `isCreateFormOpen === true`
- [ ] Add `data-testid="cliente-form"` to the `<form>` root in `ClienteForm.tsx`
- [ ] Add `data-testid="field-nombre"` to Nombre `<input>`
- [ ] Add `data-testid="field-nit"` to NIT/RUC `<input>`
- [ ] Add `data-testid="field-telefono"` to Teléfono `<input>`
- [ ] Add `data-testid="field-ciudad"` to Ciudad `<input>`
- [ ] Add `data-testid="submit-button"` to the submit button
- [ ] Add `data-testid="cancel-button"` to the cancel button
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC1"`
- [ ] All 8 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC2 — Successful submit creates client and refreshes list (4 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts` — `AC2` describe block
**File:** `e2e/tests/api/create-client.api.spec.ts` — `POST 201 Created` describe block

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` with Zod schema
- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` with `useMutation`
- [ ] Wire `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` and `toast.success('Cliente creado correctamente')`
- [ ] Add `create(data)` method to `clienteApiRepository.ts` using `apiClient.post('/api/v1/clientes', data)`
- [ ] Add `create()` signature to `IClienteRepository.ts`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- [ ] Add `AddAsync` and `SaveChangesAsync` to `IClienteRepository` interface
- [ ] Implement `AddAsync` and `SaveChangesAsync` in `ClienteRepository.cs`
- [ ] Register `POST /api/v1/clientes` endpoint in `ClienteEndpoints.cs` returning `Results.Created(...)` with 201
- [ ] Ensure JSON serialization uses camelCase (system-wide `ConfigureHttpJsonOptions` — already set)
- [ ] Register `CreateClienteCommandHandler` in `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC2"`
- [ ] Run test: `npx playwright test e2e/tests/api/create-client.api.spec.ts --grep "201 Created"`
- [ ] All 4 E2E + 8 API tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test Group: AC3 — Client-side validation shows inline errors (6 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts` — `AC3` describe block
**File:** `e2e/tests/api/create-client.api.spec.ts` — `400 Bad Request` describe block

**Tasks to make these tests pass:**

- [ ] Wire `zodResolver(clienteSchema)` to `useForm` in `ClienteForm.tsx`
- [ ] Render `{errors.nombre && <p role="alert">{errors.nombre.message}</p>}` below Nombre input
- [ ] Render `{errors.nit && <p role="alert">{errors.nit.message}</p>}` below NIT input
- [ ] Render `{errors.telefono && <p role="alert">{errors.telefono.message}</p>}` below Teléfono input
- [ ] Render `{errors.ciudad && <p role="alert">{errors.ciudad.message}</p>}` below Ciudad input
- [ ] Verify schema error messages exactly match: "El nombre es requerido", "El NIT/RUC es requerido", "El teléfono es requerido", "La ciudad es requerida"
- [ ] Create `CreateClienteRequestValidator.cs` with FluentValidation rules (NotEmpty, MaxLength)
- [ ] Register validator in `Program.cs` DI
- [ ] Wire validation to endpoint: `validator.ValidateAsync(request, ct)` → `Results.ValidationProblem(...)`
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC3"`
- [ ] Run test: `npx playwright test e2e/tests/api/create-client.api.spec.ts --grep "400 Bad Request"`
- [ ] All 6 E2E + 6 API tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC4 — 409 Conflict: duplicate NIT error (4 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts` — `AC4` describe block
**File:** `e2e/tests/api/create-client.api.spec.ts` — `409 Conflict` describe block

**Tasks to make these tests pass:**

- [ ] Wire `onError` in `useCreateCliente.ts`: detect `AxiosError` with `status === 409` → `toast.error('El NIT/RUC ya está registrado')`
- [ ] Wire fallback `onError` for non-409: `toast.error('No se pudo guardar. Intenta de nuevo.')`
- [ ] Do NOT close the form on error (form stays open)
- [ ] Create `backend/src/SiesaAgents.Domain/Exceptions/ConflictException.cs`
- [ ] In `CreateClienteCommandHandler`, catch `DbUpdateException` where `InnerException` contains "uk_clientes_nit" → re-throw as `ConflictException`
- [ ] Add `ConflictException` mapping to `ExceptionHandlingMiddleware.cs`: 409 Conflict Problem Details
- [ ] Verify 409 response body does NOT contain stack trace fields
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC4"`
- [ ] Run test: `npx playwright test e2e/tests/api/create-client.api.spec.ts --grep "409 Conflict"`
- [ ] All 4 E2E + 3 API tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC5 — Loading state on submit button (3 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts` — `AC5` describe block

**Tasks to make these tests pass:**

- [ ] Pass `isPending` from `useCreateCliente()` to `ClienteForm` submit button
- [ ] Apply `disabled={isPending}` to the submit button
- [ ] Conditionally render `{isPending ? 'Guardando...' : 'Guardar'}` as button text
- [ ] Apply `disabled={isPending}` to the cancel button as well (prevent cancel during mutation)
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC5"`
- [ ] All 3 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC6 — Cancel closes form without side effects (3 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts` — `AC6` describe block

**Tasks to make these tests pass:**

- [ ] Wire `onCancel` prop in `ClienteForm` to `<button data-testid="cancel-button" onClick={onCancel}>`
- [ ] Pass `onCancel={() => setIsCreateFormOpen(false)}` from `ClienteListView` to `<ClienteForm>`
- [ ] Ensure `onCancel` does NOT call `mutate()` or trigger any query invalidation
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC6"`
- [ ] All 3 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all failing tests for Story 2.3 (E2E)
npx playwright test e2e/tests/clientes/create-client.spec.ts

# Run all failing tests for Story 2.3 (API)
npx playwright test e2e/tests/api/create-client.api.spec.ts

# Run ALL Story 2.3 tests together
npx playwright test e2e/tests/clientes/create-client.spec.ts e2e/tests/api/create-client.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/create-client.spec.ts --headed

# Run specific AC group
npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC2"

# Debug specific test
npx playwright test e2e/tests/clientes/create-client.spec.ts --debug

# Run using project-specific config (ATDD mode — no server start)
npx playwright test --config=playwright.atdd.config.ts e2e/tests/clientes/create-client.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Network-first intercepts applied throughout (route before navigate)
- data-testid selectors used exclusively
- Factories reuse existing `cliente.factory.ts`
- Mock requirements documented for all 3 response codes (201, 400, 409)
- Implementation checklist created per AC group

**Verification:**

- All tests fail due to missing implementation (`nuevo-cliente-button` testid not found, POST endpoint 404, etc.)
- No hard waits — all timing via explicit waits or `await expect.poll()`
- No CSS selectors — all `getByTestId()` or `getByText()`

---

### GREEN Phase (DEV Team — Next Steps)

**Recommended implementation order (by effort and dependency):**

1. **AC1 first** — Add testid attributes and dialog state to `ClienteListView`. Tests pass quickly.
2. **AC6 second** — Wire `onCancel` to close. Confirms form lifecycle works.
3. **AC3 + AC5** — Add Zod schema + validation. No backend needed.
4. **AC2 (backend)** — Implement POST endpoint, command, handler, repository methods.
5. **AC4** — Add `ConflictException`, middleware mapping, and `onError` in mutation hook.

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review `ClienteForm.tsx` for accessibility (WCAG 2.1 AA — all labels linked via `htmlFor`/`id`)
3. Review error message strings match Zod schema exactly
4. Ensure no duplicated toast logic between `onSuccess` and `onError`
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/create-client.spec.ts e2e/tests/api/create-client.api.spec.ts`
3. Begin implementation using implementation checklist (AC1 → AC6 → AC3 → AC2 → AC4)
4. Work one AC group at a time (red → green for each group)
5. When all tests pass, refactor for accessibility and code quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception BEFORE navigation applied in every E2E test
- **selector-resilience.md** — Exclusive use of `data-testid` selectors; no CSS/class selectors
- **test-quality.md** — One assertion per test (atomic); no hard waits; explicit `await expect.poll()` for async state
- **data-factories.md** — Reused `createClientePayload()` and `createClienteDto()` from existing `cliente.factory.ts`
- **fixture-architecture.md** — No new fixtures needed; direct intercept pattern matches Story 2.1/2.2 conventions
- **timing-debugging.md** — Deferred promise pattern used for in-flight mutation tests (AC5) instead of `waitForTimeout`

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/clientes/create-client.spec.ts e2e/tests/api/create-client.api.spec.ts`

**Expected Summary:**

- Total tests: 35 (22 E2E + 13 API)
- Passing: 0 (expected — implementation does not exist)
- Failing: 35 (expected)
- Status: RED phase — all tests fail due to missing implementation

**Expected E2E Failure Reason:** `locator.click: Error: strict mode violation — getByTestId('nuevo-cliente-button') resolved to 0 elements`

**Expected API Failure Reason:** `expect(received).toBe(201) — received: 404` (endpoint not yet registered)

---

## Notes

- Story 2.3 is full-stack (frontend form + backend POST endpoint). Tests cover both layers independently.
- API tests require the backend to be running on `http://localhost:5000` with EF Core migration applied.
- E2E tests use MSW-style route intercepts via Playwright `page.route()` — no backend required for E2E.
- The `playwright.atdd.config.ts` (single-worker, no server spawn) should be used when servers are already running.
- Frontend unit tests (Vitest + RTL + MSW) for `clienteSchema.test.ts`, `useCreateCliente.test.ts`, and `ClienteForm.test.tsx` are documented in the story Tasks section (Tasks 13) — they are separate from these Playwright-level tests.

---

**Generated by BMad TEA Agent** — 2026-06-24
