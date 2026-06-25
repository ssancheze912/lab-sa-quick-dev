# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component + API

---

## Story Summary

A commercial team member registers a new client by filling in a form on the `/clientes` view.
The form collects four required fields (Nombre, NIT/RUC, Teléfono, Ciudad) and handles success (list refresh + toast), client-side Zod validation, 409 conflicts (inline NIT error), server errors (toast), and cancellation without side effects.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. Given the user is on `/clientes`, When clicking "Nuevo cliente", Then a form opens with four required fields: Nombre, NIT/RUC, Teléfono, Ciudad.
2. Given all required fields are filled and submitted, When the backend returns 201 Created, Then the new client appears in the list immediately, a success toast "Cliente creado correctamente" is shown, and the form closes.
3. Given the form is submitted with empty required fields, When Zod validation runs, Then inline error messages appear in Spanish below each empty field, and the form is NOT submitted to the backend.
4. Given the user submits a duplicate NIT/RUC, When the backend returns 409 Conflict, Then an inline error "El NIT/RUC ya está registrado" appears on the NIT field and the form stays open with entered data.
5. Given the backend is unavailable, When the mutation fails, Then a toast error "No se pudo crear el cliente. Intenta de nuevo." is shown and the form stays open with entered data.
6. Given the form is open, When the user clicks "Cancelar", Then the form closes without sending any request.

---

## Failing Tests Created (RED Phase)

### E2E Tests (19 tests)

**File:** `e2e/story-2-3/create-client.spec.ts`

- **Test:** should render "Nuevo cliente" button on the clientes page
  - **Status:** RED - btn-nuevo-cliente testid not implemented
  - **Verifies:** AC1

- **Test:** should open the create form when "Nuevo cliente" button is clicked
  - **Status:** RED - ClienteForm and toggle state not implemented
  - **Verifies:** AC1

- **Test:** should display the Nombre field in the create form
  - **Status:** RED - input-nombre testid not implemented
  - **Verifies:** AC1

- **Test:** should display the NIT/RUC field in the create form
  - **Status:** RED - input-nit testid not implemented
  - **Verifies:** AC1

- **Test:** should display the Teléfono field in the create form
  - **Status:** RED - input-telefono testid not implemented
  - **Verifies:** AC1

- **Test:** should display the Ciudad field in the create form
  - **Status:** RED - input-ciudad testid not implemented
  - **Verifies:** AC1

- **Test:** should display success toast "Cliente creado correctamente" after successful submit
  - **Status:** RED - toast-success testid and mutation not implemented
  - **Verifies:** AC2

- **Test:** should close the form after a successful submit
  - **Status:** RED - onSuccess form close not implemented
  - **Verifies:** AC2

- **Test:** should show the new client in the list after successful create
  - **Status:** RED - invalidateQueries and list refresh not implemented
  - **Verifies:** AC2

- **Test:** should disable the submit button and show "Guardando…" while mutation is pending
  - **Status:** RED - isPending state not implemented
  - **Verifies:** AC2

- **Test:** should display inline error for empty Nombre field
  - **Status:** RED - Zod validation and error-nombre testid not implemented
  - **Verifies:** AC3

- **Test:** should display inline error for empty NIT/RUC field
  - **Status:** RED - error-nit testid not implemented
  - **Verifies:** AC3

- **Test:** should display inline error for empty Teléfono field
  - **Status:** RED - error-telefono testid not implemented
  - **Verifies:** AC3

- **Test:** should display inline error for empty Ciudad field
  - **Status:** RED - error-ciudad testid not implemented
  - **Verifies:** AC3

- **Test:** should NOT send API request when form has validation errors
  - **Status:** RED - client-side validation not implemented
  - **Verifies:** AC3

- **Test:** should display inline NIT error when backend returns 409 Conflict
  - **Status:** RED - 409 error handling not implemented
  - **Verifies:** AC4

- **Test:** should keep the form open with entered data after 409 Conflict
  - **Status:** RED - 409 form persistence not implemented
  - **Verifies:** AC4

- **Test:** should preserve the filled Nombre value after 409 Conflict
  - **Status:** RED - form field preservation not implemented
  - **Verifies:** AC4

- **Test:** should display toast error "No se pudo crear el cliente. Intenta de nuevo." on 500
  - **Status:** RED - toast-error testid and 5xx handling not implemented
  - **Verifies:** AC5

- **Test:** should keep the form open after a 500 server error
  - **Status:** RED - 5xx form persistence not implemented
  - **Verifies:** AC5

- **Test:** should display toast error when the network call is aborted
  - **Status:** RED - network error handling not implemented
  - **Verifies:** AC5

- **Test:** should close the form when "Cancelar" button is clicked
  - **Status:** RED - btn-cancelar-cliente testid and onCancel not implemented
  - **Verifies:** AC6

- **Test:** should NOT send any API request when "Cancelar" is clicked
  - **Status:** RED - cancel guard not implemented
  - **Verifies:** AC6

- **Test:** should keep the URL at /clientes after cancelling the form
  - **Status:** RED - cancel navigation guard not implemented
  - **Verifies:** AC6

### API Tests (14 tests)

**File:** `e2e/story-2-3/clientes-create.api.spec.ts`

- **Test:** should return HTTP 201 Created on valid payload
  - **Status:** RED - POST /api/v1/clientes endpoint not implemented
  - **Verifies:** AC2

- **Test:** should return Content-Type application/json on 201
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC2

- **Test:** should return Location header pointing to the new client resource
  - **Status:** RED - Location header not implemented
  - **Verifies:** AC2

- **Test:** should return ClienteDto with the submitted nombre in the body
  - **Status:** RED - command handler not implemented
  - **Verifies:** AC2

- **Test:** should return ClienteDto with the submitted nit in the body
  - **Status:** RED - command handler not implemented
  - **Verifies:** AC2

- **Test:** should return ClienteDto with an id (UUID) in the body
  - **Status:** RED - Guid.NewGuid() in entity factory not implemented
  - **Verifies:** AC2

- **Test:** should return ClienteDto with createdAt and updatedAt ISO timestamps
  - **Status:** RED - DateTimeOffset.UtcNow fields not populated
  - **Verifies:** AC2

- **Test:** should return body with camelCase field names (no snake_case)
  - **Status:** RED - camelCase serialization not configured for POST
  - **Verifies:** AC2

- **Test:** should make the new client appear in GET /api/v1/clientes after creation
  - **Status:** RED - CreateAsync repository method not implemented
  - **Verifies:** AC2

- **Test:** should return HTTP 400 when nombre is empty
  - **Status:** RED - FluentValidation validator not implemented
  - **Verifies:** AC3

- **Test:** should return HTTP 400 when nit is empty
  - **Status:** RED - FluentValidation validator not implemented
  - **Verifies:** AC3

- **Test:** should return HTTP 400 when telefono is empty
  - **Status:** RED - FluentValidation validator not implemented
  - **Verifies:** AC3

- **Test:** should return HTTP 400 when ciudad is empty
  - **Status:** RED - FluentValidation validator not implemented
  - **Verifies:** AC3

- **Test:** should return Problem Details RFC 7807 body on 400
  - **Status:** RED - Problem Details format for 400 not implemented
  - **Verifies:** AC3

- **Test:** should return HTTP 409 when NIT already exists in the system
  - **Status:** RED - ExceptionHandlingMiddleware 409 branch not implemented
  - **Verifies:** AC4

- **Test:** should return Problem Details with detail "El NIT/RUC ya está registrado." on 409
  - **Status:** RED - 409 Problem Details detail not implemented
  - **Verifies:** AC4

- **Test:** should NOT expose raw database error message on 409
  - **Status:** RED - NFR6 error sanitization not implemented
  - **Verifies:** AC4

### Component Tests (24 tests)

**Files:**
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts` (9 tests)
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` (15 tests)

**useCreateCliente.test.ts:**

- **Test:** should call POST /api/v1/clientes with the correct payload on mutate
  - **Status:** RED - useCreateCliente hook not implemented
  - **Verifies:** AC2

- **Test:** should expose isSuccess true after a successful mutation
  - **Status:** RED - mutation hook not implemented
  - **Verifies:** AC2

- **Test:** should return the created ClienteDto in the mutation data on success
  - **Status:** RED - mutation data not returned
  - **Verifies:** AC2

- **Test:** should expose isPending true while mutation is in flight
  - **Status:** RED - isPending state not exposed
  - **Verifies:** AC2

- **Test:** should expose isError true when the backend returns 409 Conflict
  - **Status:** RED - error state not implemented
  - **Verifies:** AC4

- **Test:** should expose the error object when the backend returns 409 Conflict
  - **Status:** RED - error object not exposed
  - **Verifies:** AC4

- **Test:** should expose isError true when the backend returns 500
  - **Status:** RED - 5xx error state not implemented
  - **Verifies:** AC5

- **Test:** should expose isIdle true before mutation is triggered
  - **Status:** RED - initial idle state not verified
  - **Verifies:** AC2

**ClienteForm.test.tsx:**

- **Test:** should render the Nombre input field
  - **Status:** RED - ClienteForm component not implemented
  - **Verifies:** AC1

- **Test:** should render the NIT/RUC input field
  - **Status:** RED - ClienteForm component not implemented
  - **Verifies:** AC1

- **Test:** should render the Teléfono input field
  - **Status:** RED - ClienteForm component not implemented
  - **Verifies:** AC1

- **Test:** should render the Ciudad input field
  - **Status:** RED - ClienteForm component not implemented
  - **Verifies:** AC1

- **Test:** should render the Guardar/submit button
  - **Status:** RED - submit button testid not implemented
  - **Verifies:** AC1

- **Test:** should render the Cancelar button
  - **Status:** RED - cancel button testid not implemented
  - **Verifies:** AC1

- **Test:** should have associated labels in Spanish for each input
  - **Status:** RED - Spanish labels with htmlFor not implemented
  - **Verifies:** AC1

- **Test:** should display inline error "El nombre es requerido" when Nombre is empty on submit
  - **Status:** RED - Zod validation in RHF not implemented
  - **Verifies:** AC3

- **Test:** should display inline error "El NIT/RUC es requerido" when NIT is empty on submit
  - **Status:** RED - Zod validation not implemented
  - **Verifies:** AC3

- **Test:** should display inline error "El teléfono es requerido" when Teléfono is empty on submit
  - **Status:** RED - Zod validation not implemented
  - **Verifies:** AC3

- **Test:** should display inline error "La ciudad es requerida" when Ciudad is empty on submit
  - **Status:** RED - Zod validation not implemented
  - **Verifies:** AC3

- **Test:** should NOT call the API when the form has validation errors
  - **Status:** RED - client-side guard not implemented
  - **Verifies:** AC3

- **Test:** should call the API with the correct payload on valid submit
  - **Status:** RED - form submission not wired to mutation
  - **Verifies:** AC2

- **Test:** should call onSuccess callback after a successful submit
  - **Status:** RED - onSuccess prop not wired
  - **Verifies:** AC2

- **Test:** should disable the submit button while the mutation is pending
  - **Status:** RED - isPending-based disable not implemented
  - **Verifies:** AC2

- **Test:** should show "Guardando…" on the submit button while mutation is pending
  - **Status:** RED - loading label text not implemented
  - **Verifies:** AC2

- **Test:** should display inline error "El NIT/RUC ya está registrado" on 409 response
  - **Status:** RED - setError('nit', ...) on 409 not implemented
  - **Verifies:** AC4

- **Test:** should keep the form open (not call onSuccess) on 409 response
  - **Status:** RED - 409 guard not implemented
  - **Verifies:** AC4

- **Test:** should preserve the entered Nombre value after 409 response
  - **Status:** RED - form data persistence not implemented
  - **Verifies:** AC4

- **Test:** should NOT call onSuccess when the backend returns 500
  - **Status:** RED - 5xx guard not implemented
  - **Verifies:** AC5

- **Test:** should preserve entered field values after a 500 server error
  - **Status:** RED - form persistence on 5xx not implemented
  - **Verifies:** AC5

- **Test:** should call onCancel when the "Cancelar" button is clicked
  - **Status:** RED - onCancel prop not wired
  - **Verifies:** AC6

- **Test:** should NOT call the API when "Cancelar" is clicked
  - **Status:** RED - cancel guard not implemented
  - **Verifies:** AC6

- **Test:** should NOT call onSuccess when "Cancelar" is clicked
  - **Status:** RED - cancel isolation not implemented
  - **Verifies:** AC6

---

## Data Factories Used

### Cliente Factory (existing — extended for Story 2.3)

**File:** `e2e/support/factories/cliente.factory.ts`

**Exports used:**
- `buildClientePayload(overrides?)` - Build POST /api/v1/clientes request body
- `buildClienteResponse(overrides?)` - Build simulated API response for route intercepts
- `buildClienteResponses(count, overrides?)` - Build array of ClienteResponse stubs

---

## Fixtures

No new fixtures created. E2E tests use inline route intercepts (network-first pattern).
Component tests use MSW + QueryClientProvider wrapper inline.

---

## Mock Requirements

### POST /api/v1/clientes

**Endpoint:** `POST /api/v1/clientes`

**Success Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Ejemplo S.A.",
  "nit": "900123456-7",
  "telefono": "6011234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-25T10:30:00Z",
  "updatedAt": "2026-06-25T10:30:00Z"
}
```

**409 Conflict Response:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflict",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado."
}
```

**400 Bad Request Response:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Bad Request",
  "status": 400,
  "errors": {
    "Nombre": ["'Nombre' must not be empty."]
  }
}
```

**500 Internal Server Error Response:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Internal Server Error",
  "status": 500
}
```

---

## Required data-testid Attributes

### Clientes Page (`clientes.tsx`)

- `btn-nuevo-cliente` - "Nuevo cliente" button in the left panel header area

### ClienteForm Component (`ClienteForm.tsx`)

- `cliente-form` - The form container element
- `input-nombre` - Nombre text input field
- `input-nit` - NIT/RUC text input field
- `input-telefono` - Teléfono text input field
- `input-ciudad` - Ciudad text input field
- `error-nombre` - Inline error message below Nombre field
- `error-nit` - Inline error message below NIT/RUC field
- `error-telefono` - Inline error message below Teléfono field
- `error-ciudad` - Inline error message below Ciudad field
- `btn-submit-cliente` - Form submit button ("Guardar" / "Guardando…")
- `btn-cancelar-cliente` - Form cancel button ("Cancelar")

### Toast Notifications

- `toast-success` - Success toast container ("Cliente creado correctamente")
- `toast-error` - Error toast container ("No se pudo crear el cliente. Intenta de nuevo.")

**Implementation Example:**
```tsx
<form data-testid="cliente-form">
  <label htmlFor="input-nombre">Nombre</label>
  <input data-testid="input-nombre" id="input-nombre" type="text" />
  {errors.nombre && <p data-testid="error-nombre" aria-describedby="input-nombre">{errors.nombre.message}</p>}

  <label htmlFor="input-nit">NIT/RUC</label>
  <input data-testid="input-nit" id="input-nit" type="text" />
  {errors.nit && <p data-testid="error-nit" aria-describedby="input-nit">{errors.nit.message}</p>}

  <label htmlFor="input-telefono">Teléfono</label>
  <input data-testid="input-telefono" id="input-telefono" type="text" />
  {errors.telefono && <p data-testid="error-telefono">{errors.telefono.message}</p>}

  <label htmlFor="input-ciudad">Ciudad</label>
  <input data-testid="input-ciudad" id="input-ciudad" type="text" />
  {errors.ciudad && <p data-testid="error-ciudad">{errors.ciudad.message}</p>}

  <button data-testid="btn-cancelar-cliente" type="button" onClick={onCancel}>Cancelar</button>
  <button data-testid="btn-submit-cliente" type="submit" disabled={isPending}>
    {isPending ? 'Guardando…' : 'Guardar'}
  </button>
</form>
```

---

## Implementation Checklist

### Test: should render "Nuevo cliente" button on the clientes page (AC1)

**Tasks to make this test pass:**

- [ ] Add `<button data-testid="btn-nuevo-cliente">` to `frontend/src/routes/_app/clientes.tsx` header area
- [ ] Add `isCreating: boolean` local state with `useState(false)` in `clientes.tsx`
- [ ] Run test: `npx playwright test e2e/story-2-3/create-client.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should open the create form when "Nuevo cliente" is clicked (AC1)

**Tasks to make this test pass:**

- [ ] On btn-nuevo-cliente click, set `isCreating(true)` in `clientes.tsx`
- [ ] Conditionally render `<ClienteForm />` (or placeholder) when `isCreating` is true
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` with `data-testid="cliente-form"`
- [ ] Run test: `npx playwright test e2e/story-2-3/create-client.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Tests: Form fields visible (AC1)

**Tasks to make these tests pass:**

- [ ] Add `input-nombre`, `input-nit`, `input-telefono`, `input-ciudad` inputs to `ClienteForm.tsx`
- [ ] Add Spanish `<label>` elements linked via `htmlFor`/`id` for each field
- [ ] Wire React Hook Form `register()` to each input
- [ ] Run test: `npx vitest run frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Tests: Zod validation — inline errors (AC3)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` with Zod schema
- [ ] Wire `zodResolver(createClienteSchema)` to React Hook Form in `ClienteForm.tsx`
- [ ] Render `error.message` from `formState.errors` in `<p data-testid="error-{field}">` elements
- [ ] Ensure form does NOT call mutation when `formState.isValid` is false
- [ ] Add `error-nombre`, `error-nit`, `error-telefono`, `error-ciudad` testids
- [ ] Run test: `npx vitest run frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Tests: Successful create — mutation + onSuccess (AC2)

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` with `useMutation`
- [ ] Add `create` method to `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Add `create` signature to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] On `onSuccess`, call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`
- [ ] Call `onSuccess()` prop from `ClienteForm` after successful mutation
- [ ] Show `toast.success('Cliente creado correctamente')` on success
- [ ] Disable submit button and show "Guardando…" text while `isPending` is true
- [ ] Add `btn-submit-cliente` testid
- [ ] Run test: `npx vitest run frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Tests: 409 Conflict — inline NIT error (AC4)

**Tasks to make these tests pass:**

- [ ] In `ClienteForm.tsx` `onError` handler: detect `axiosError.response?.status === 409`
- [ ] Call `setError('nit', { type: 'server', message: 'El NIT/RUC ya está registrado' })`
- [ ] Do NOT call `onSuccess()` on 409
- [ ] Backend: update `ExceptionHandlingMiddleware.cs` to catch PostgreSQL error code 23505 → return 409 Problem Details
- [ ] Run test: `npx vitest run frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Tests: 5xx error — toast error, form stays open (AC5)

**Tasks to make these tests pass:**

- [ ] In `ClienteForm.tsx` `onError` handler: for non-409 errors, call `toast.error('No se pudo crear el cliente. Intenta de nuevo.')`
- [ ] Do NOT call `onSuccess()` on 5xx errors
- [ ] Ensure form fields retain their values (React Hook Form preserves state by default)
- [ ] Add `toast-error` testid to the toast component (or configure sonner to use this testid)
- [ ] Run test: `npx playwright test e2e/story-2-3/create-client.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Tests: Cancel button (AC6)

**Tasks to make these tests pass:**

- [ ] Add `<button data-testid="btn-cancelar-cliente" type="button" onClick={onCancel}>Cancelar</button>` to `ClienteForm.tsx`
- [ ] Pass `onCancel={() => setIsCreating(false)}` from `clientes.tsx`
- [ ] Ensure cancel does NOT submit the form (type="button", not type="submit")
- [ ] Run test: `npx vitest run frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: Backend POST /api/v1/clientes (AC2, AC3, AC4)

**Tasks to make these tests pass:**

- [ ] Create `CreateClienteCommand.cs`, `CreateClienteCommandHandler.cs`, `CreateClienteCommandValidator.cs`
- [ ] Add `CreateAsync` to `IClienteRepository.cs` and `ClienteRepository.cs`
- [ ] Map `POST /api/v1/clientes` in `ClienteEndpoints.cs` — return `201 Created` with `Location` header
- [ ] Add `23505` unique constraint branch to `ExceptionHandlingMiddleware.cs` → 409 Problem Details
- [ ] Register handler and validator in `Program.cs`
- [ ] Run test: `npx playwright test e2e/story-2-3/clientes-create.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

## Running Tests

```bash
# Run all E2E tests for this story
npx playwright test e2e/story-2-3/

# Run E2E user-journey tests only
npx playwright test e2e/story-2-3/create-client.spec.ts

# Run API contract tests only
npx playwright test e2e/story-2-3/clientes-create.api.spec.ts

# Run component / unit tests only (Vitest)
npx vitest run frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts
npx vitest run frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx

# Run all component tests for story 2.3
npx vitest run frontend/src/modules/crm/clientes/

# Run E2E in headed mode (see browser)
npx playwright test e2e/story-2-3/create-client.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/story-2-3/create-client.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Factories reused (existing `cliente.factory.ts`)
- Network-first intercept pattern applied in all E2E tests
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages point to missing components, routes, and handlers
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC1 — render form)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: `CreateClienteCommand` + `CreateClienteCommandHandler` + `POST /api/v1/clientes` (AC2 API tests)
2. Backend: `CreateClienteCommandValidator` (AC3 API tests — 400 errors)
3. Backend: `ExceptionHandlingMiddleware` 409 branch (AC4 API tests)
4. Frontend: `clienteSchema.ts` + `useCreateCliente.ts` (hook unit tests)
5. Frontend: `ClienteForm.tsx` (component tests — all ACs)
6. Frontend: `clientes.tsx` integration (E2E tests — all ACs)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all tests pass (green phase complete)
2. Review code for quality (readability, maintainability, performance)
3. Extract duplications (DRY principle)
4. Optimize performance (if needed)
5. Ensure tests still pass after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/story-2-3/ && npx vitest run frontend/src/modules/crm/clientes/`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, update story status in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** - Route interception BEFORE navigation in all E2E tests (no race conditions)
- **data-factories.md** - Reused existing `cliente.factory.ts` for payload/response generation
- **test-quality.md** - One assertion per test (atomic), Given-When-Then structure, explicit waits only
- **selector-resilience.md** - All selectors use `data-testid` (no CSS class selectors)
- **fixture-architecture.md** - MSW server setup/teardown pattern with `beforeAll`/`afterEach`/`afterAll`
- **component-tdd.md** - QueryClientProvider wrapper, MSW for component-level mutation testing
- **test-levels-framework.md** - E2E for user journeys, API for backend contracts, Component for hook/form behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/story-2-3/ && npx vitest run frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**Expected Summary:**
- Total tests: 57
- Passing: 0 (expected — RED phase)
- Failing: 57 (expected — no implementation yet)
- Status: RED phase verified

**Expected Failure Patterns:**
- E2E tests: `btn-nuevo-cliente` locator returns 0 elements
- API tests: `expect(response.status()).toBe(201)` → received 404 (endpoint missing)
- Component tests: `Cannot find module './useCreateCliente'` / `Cannot find module './ClienteForm'`

---

## Notes

- `uk_clientes_nit` unique index already exists from Story 2.1 migration — no new migration needed
- `ExceptionHandlingMiddleware` is already wired in `Program.cs` from Story 1.3 — only extend, do NOT re-register
- Toast library is already integrated (sonner or similar) — check `src/app/providers/` for the toast instance
- `clienteApiRepository.ts` already exists from Stories 2.1/2.2 — add `create` method to it
- `IClienteRepository.ts` already exists — add `create(data: CreateClienteData): Promise<Cliente>` signature
- Story 2.3 does NOT use MasterCrud — custom inline form pattern per dev notes

---

**Generated by BMad TEA Agent** - 2026-06-25
