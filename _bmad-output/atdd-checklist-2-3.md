# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-17
**Author:** SiesaTeam
**Primary Test Level:** E2E + API Integration + Component + Unit

---

## Story Summary

A commercial team member registers a new client by filling in a form (Nombre, NIT/RUC, Teléfono, Ciudad) from the `/clientes` view. On successful submission the client appears immediately in the list (FR27, NFR2 < 2s) and a toast displays "Cliente creado correctamente". Inline validation prevents empty-field submissions (Zod, FR8), and a 409 conflict from the backend is surfaced as "El NIT/RUC ya está registrado" without exposing technical details (NFR6).

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **Given** the user is on `/clientes` **When** clicking "Nuevo cliente" **Then** a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required, FR1)
2. **Given** all required fields are filled with valid data **When** form is submitted **Then** client is created via `POST /api/v1/clientes`, appears in the list immediately (FR27), and toast "Cliente creado correctamente" is shown
3. **Given** one or more required fields are empty **When** form is submitted **Then** inline errors appear per empty field (Zod + FR8) and no API call is fired
4. **Given** the submitted NIT/RUC already exists **When** backend returns HTTP 409 **Then** inline error "El NIT/RUC ya está registrado" is shown (no stack trace, NFR6)
5. **Given** the form is open **When** user clicks "Cancelar" **Then** form closes without creating any record

---

## Failing Tests Created (RED Phase)

### E2E Tests (14 tests)

**File:** `e2e/tests/clientes/clientes-create.spec.ts`

- **Test:** AC1 — should show "Nuevo cliente" button on the /clientes view
  - **Status:** RED — button does not exist yet (no implementation)
  - **Verifies:** AC1 — button presence in the list panel

- **Test:** AC1 — should open a form dialog when "Nuevo cliente" is clicked
  - **Status:** RED — no form/dialog component implemented
  - **Verifies:** AC1 — modal opens on click

- **Test:** AC1 — should display Nombre field in the create form
  - **Status:** RED — ClienteForm component not implemented
  - **Verifies:** AC1 — Nombre input field present (FR1)

- **Test:** AC1 — should display NIT/RUC field in the create form
  - **Status:** RED — ClienteForm component not implemented
  - **Verifies:** AC1 — NIT/RUC input field present (FR1)

- **Test:** AC1 — should display Teléfono field in the create form
  - **Status:** RED — ClienteForm component not implemented
  - **Verifies:** AC1 — Teléfono input field present (FR1)

- **Test:** AC1 — should display Ciudad field in the create form
  - **Status:** RED — ClienteForm component not implemented
  - **Verifies:** AC1 — Ciudad input field present (FR1)

- **Test:** AC1 — should display "Guardar" submit button in the create form
  - **Status:** RED — ClienteForm component not implemented
  - **Verifies:** AC1 — Guardar button present

- **Test:** AC1 — should display "Cancelar" button in the create form
  - **Status:** RED — ClienteForm component not implemented
  - **Verifies:** AC1 + AC5 — Cancelar button present

- **Test:** TC-E2-P0-07 — should show success toast "Cliente creado correctamente" after form submission
  - **Status:** RED — useCreateCliente mutation and toast not implemented
  - **Verifies:** AC2 — toast with exact contractual text shown on success

- **Test:** TC-E2-P0-07 — should close the form dialog after successful submission
  - **Status:** RED — onClose callback not wired
  - **Verifies:** AC2 — form closes after successful create

- **Test:** TC-E2-P0-07 — should display the newly created client in the list immediately without manual refresh
  - **Status:** RED — invalidateQueries(['clientes']) not implemented; < 2s assertion will fail
  - **Verifies:** AC2, FR27, NFR2 — immediate list refresh after create

- **Test:** AC5 — should close the form dialog when "Cancelar" is clicked
  - **Status:** RED — Cancelar button not implemented
  - **Verifies:** AC5 — dialog closes on cancel

- **Test:** AC5 — should not create a client when "Cancelar" is clicked after partially filling the form
  - **Status:** RED — no form implementation
  - **Verifies:** AC5 — no record created on cancel

- **Test:** AC4 — should show "El NIT/RUC ya está registrado" inline when backend returns 409
  - **Status:** RED — 409 error handling not implemented
  - **Verifies:** AC4 — friendly inline error on 409

### API Integration Tests (7 tests — xUnit/C#)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/CreateClienteEndpointTests.cs`

- **Test:** TC-E2-P0-01 — GivenValidPayload_WhenPostClientes_ThenReturns201WithAllRequiredFields
  - **Status:** RED — POST /api/v1/clientes endpoint does not exist
  - **Verifies:** AC2 — HTTP 201 with UUID, nombre, nitRuc, telefono, ciudad, createdAt

- **Test:** TC-E2-P0-01 — GivenValidPayload_WhenPostClientes_ThenClientAppearsInListViaGet
  - **Status:** RED — POST endpoint does not exist; GET list not yet tested for new client
  - **Verifies:** AC2, FR27 — client appears in subsequent GET /api/v1/clientes

- **Test:** TC-E2-P0-01 — GivenValidPayload_WhenPostClientes_ThenLocationHeaderPointsToNewResource
  - **Status:** RED — POST endpoint does not exist
  - **Verifies:** AC2 — HTTP 201 Location header is /api/v1/clientes/{id}

- **Test:** TC-E2-P0-02 — GivenDuplicateNitRuc_WhenPostClientes_ThenReturns409WithUserFriendlyMessage
  - **Status:** RED — POST endpoint and uniqueness handling not implemented
  - **Verifies:** AC4 — HTTP 409, "El NIT/RUC ya está registrado" in detail field

- **Test:** TC-E2-P0-02 — GivenDuplicateNitRuc_WhenPostClientes_ThenResponseBodyHasNoStackTrace
  - **Status:** RED — POST endpoint not implemented
  - **Verifies:** AC4, NFR6 — no stackTrace, no InnerException in 409 response body

- **Test:** TC-E2-P0-03 — GivenEmptyBody_WhenPostClientes_ThenReturns400WithFieldLevelErrors
  - **Status:** RED — CreateClienteRequestValidator not implemented
  - **Verifies:** AC3 — HTTP 400 with Problem Details field-level errors on empty body

- **Test:** TC-E2-P0-03 — GivenInvalidPayload_WhenPostClientes_ThenNoClientRecordIsCreated
  - **Status:** RED — POST endpoint not implemented
  - **Verifies:** AC3 — invalid payload does not persist a record

### Component Tests (11 tests — Vitest + RTL + MSW)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

- **Test:** TC-E2-P0-04 — should show inline error under Nombre when submitted empty
  - **Status:** RED — ClienteForm component not implemented
  - **Verifies:** AC3 — Zod error on empty Nombre

- **Test:** TC-E2-P0-04 — should show inline error under NIT/RUC when submitted empty
  - **Status:** RED — ClienteForm not implemented
  - **Verifies:** AC3 — Zod error on empty NIT/RUC

- **Test:** TC-E2-P0-04 — should show inline error under Teléfono when submitted empty
  - **Status:** RED — ClienteForm not implemented
  - **Verifies:** AC3 — Zod error on empty Teléfono

- **Test:** TC-E2-P0-04 — should show inline error under Ciudad when submitted empty
  - **Status:** RED — ClienteForm not implemented
  - **Verifies:** AC3 — Zod error on empty Ciudad

- **Test:** TC-E2-P0-04 — should NOT fire a POST when form submitted empty
  - **Status:** RED — ClienteForm not implemented
  - **Verifies:** AC3 — no API call on validation failure

- **Test:** TC-E2-P0-04 — should show exactly 4 inline error messages when all fields empty
  - **Status:** RED — ClienteForm not implemented
  - **Verifies:** AC3, FR8 — 4 inline errors appear

- **Test:** TC-E2-P0-05 — should show "El NIT/RUC ya está registrado" inline on MSW 409
  - **Status:** RED — ClienteForm 409 handling not implemented
  - **Verifies:** AC4 — friendly inline error, not a toast

- **Test:** TC-E2-P0-05 — should NOT expose stack traces when POST returns 409
  - **Status:** RED — ClienteForm not implemented
  - **Verifies:** AC4, NFR6 — no technical leakage in DOM

- **Test:** AC2 — should fire a POST to /api/v1/clientes on valid submission
  - **Status:** RED — useCreateCliente mutation not implemented
  - **Verifies:** AC2 — POST is fired with correct payload

- **Test:** AC2 — should call onClose after successful form submission
  - **Status:** RED — ClienteForm success callback not wired
  - **Verifies:** AC2 — form closes after create

- **Test:** AC5 — should call onClose when user clicks "Cancelar"
  - **Status:** RED — Cancelar button not implemented
  - **Verifies:** AC5 — cancel triggers onClose

### Unit Tests (11 tests)

**File (Backend):** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

- **Test:** TC-E2-P0-01 (unit) — GivenValidCommand_WhenHandleAsync_ThenReturnsClienteDtoWithAllFields
  - **Status:** RED — CreateClienteCommandHandler does not exist
  - **Verifies:** AC2 — handler returns all ClienteDto fields

- **Test:** TC-E2-P0-01 (unit) — GivenValidCommand_WhenHandleAsync_ThenRepositoryCreateAsyncCalledOnce
  - **Status:** RED — CreateClienteCommandHandler does not exist
  - **Verifies:** AC2 — handler calls repository.CreateAsync exactly once

- **Test:** TC-E2-P0-02 (unit) — GivenRepositoryThrowsConflictException_WhenHandleAsync_ThenExceptionPropagates
  - **Status:** RED — CreateClienteCommandHandler does not exist
  - **Verifies:** AC4 — conflict exception propagates for middleware to handle

- **Test:** TC-E2-P3-04 — GivenEmptyNombre_WhenValidate_ThenReturnsNombreFieldError
  - **Status:** RED — CreateClienteRequestValidator does not exist
  - **Verifies:** AC3 — Nombre field required by FluentValidation

- **Test:** TC-E2-P3-04 — GivenEmptyNitRuc_WhenValidate_ThenReturnsNitRucFieldError
  - **Status:** RED — CreateClienteRequestValidator does not exist
  - **Verifies:** AC3 — NitRuc field required

- **Test:** TC-E2-P3-04 — GivenEmptyTelefono_WhenValidate_ThenReturnsTelefonoFieldError
  - **Status:** RED — CreateClienteRequestValidator does not exist
  - **Verifies:** AC3 — Telefono field required

- **Test:** TC-E2-P3-04 — GivenEmptyCiudad_WhenValidate_ThenReturnsCiudadFieldError
  - **Status:** RED — CreateClienteRequestValidator does not exist
  - **Verifies:** AC3 — Ciudad field required

- **Test:** TC-E2-P3-04 — GivenAllFieldsValid_WhenValidate_ThenValidationPasses
  - **Status:** RED — CreateClienteRequestValidator does not exist
  - **Verifies:** AC3 — validator passes all valid data

**File (Frontend):** `frontend/src/modules/crm/clientes/application/clienteSchema.story2-3.test.ts`

- **Test:** TC-E2-P3-02 — should pass validation when all 4 fields are valid
  - **Status:** RED — clienteSchema.ts not created yet
  - **Verifies:** AC3 — valid payload passes Zod

- **Test:** TC-E2-P3-02 — should fail validation with Spanish error messages for empty fields
  - **Status:** RED — clienteSchema.ts not created yet
  - **Verifies:** AC3 — Spanish error messages (MANDATORY)

- **Test:** TC-E2-P3-02 — should fail on each empty required field individually
  - **Status:** RED — clienteSchema.ts not created yet
  - **Verifies:** AC3 — each field validated independently

---

## Required data-testid Attributes

### ClienteListView (left panel)

- `nuevo-cliente-button` — "Nuevo cliente" button at top of list panel
- `clientes-list-panel` — left panel container (already exists from Story 2.1)
- `cliente-list-item` — each item in the list (already exists from Story 2.1)

### ClienteForm (dialog/drawer)

- `cliente-form` — form element (`aria-label="Formulario de nuevo cliente"`)
- `input-nombre` — Nombre input field
- `input-nitruc` — NIT/RUC input field
- `input-telefono` — Teléfono input field
- `input-ciudad` — Ciudad input field
- `error-nombre` — inline error message for Nombre (`role="alert"`)
- `error-nitruc` — inline error message for NIT/RUC (`role="alert"`)
- `error-telefono` — inline error message for Teléfono (`role="alert"`)
- `error-ciudad` — inline error message for Ciudad (`role="alert"`)
- `btn-guardar` — submit button ("Guardar" / "Guardando..." while pending)
- `btn-cancelar` — cancel button ("Cancelar")

**Implementation Example:**

```tsx
<form data-testid="cliente-form" aria-label="Formulario de nuevo cliente" onSubmit={handleSubmit(onSubmit)}>
  <div>
    <label htmlFor="nombre">Nombre</label>
    <input id="nombre" data-testid="input-nombre" {...register('nombre')} aria-describedby="error-nombre" />
    {errors.nombre && <p id="error-nombre" data-testid="error-nombre" role="alert">{errors.nombre.message}</p>}
  </div>
  {/* ... repeat for nitRuc, telefono, ciudad ... */}
  <button type="button" data-testid="btn-cancelar" onClick={onClose}>Cancelar</button>
  <button type="submit" data-testid="btn-guardar" disabled={isPending}>
    {isPending ? 'Guardando...' : 'Guardar'}
  </button>
</form>
```

---

## Mock Requirements

### POST /api/v1/clientes — Success (201)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Nueva S.A.S.",
  "nitRuc": "900100100-1",
  "telefono": "3005555555",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-17T14:30:00Z"
}
```

**Notes:** Location header must be `/api/v1/clientes/{id}`

### POST /api/v1/clientes — Validation Failure (400)

```json
{
  "status": 400,
  "title": "One or more validation errors occurred.",
  "errors": {
    "nombre": ["El nombre es requerido."],
    "nitRuc": ["El NIT/RUC es requerido."],
    "telefono": ["El teléfono es requerido."],
    "ciudad": ["La ciudad es requerida."]
  }
}
```

**Notes:** FluentValidation returns RFC 7807 Problem Details via `Results.ValidationProblem()`

### POST /api/v1/clientes — Duplicate NIT/RUC (409)

```json
{
  "status": 409,
  "title": "Conflicto de datos",
  "detail": "El NIT/RUC ya está registrado"
}
```

**Notes:** Content-Type must be `application/problem+json`. The word "NIT/RUC" MUST appear in `detail` per TC-E2-P0-02.

---

## Implementation Checklist

### Test: AC1 — Form opens with 4 fields when "Nuevo cliente" is clicked

**Files:** `e2e/tests/clientes/clientes-create.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="nuevo-cliente-button"` button to `ClienteListView.tsx` left panel
- [ ] Add `useState<boolean>` (`isFormOpen`) to `ClienteListView.tsx`
- [ ] Import and render `Dialog` (shadcn/ui) + `ClienteForm` in `ClienteListView.tsx`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` with all 4 labeled inputs
- [ ] Add `aria-label="Formulario de nuevo cliente"` to the form element
- [ ] Add all `data-testid` attributes listed above
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-create.spec.ts --grep "AC1"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E2-P0-01 — POST /api/v1/clientes returns 201 with all fields

**Files:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/CreateClienteEndpointTests.cs`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs` (record)
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- [ ] Add `CreateAsync(ClienteEntity)` to `IClienteRepository.cs` and `ClienteRepository.cs`
- [ ] Add `POST /api/v1/clientes` endpoint in `ClienteEndpoints.cs` returning HTTP 201
- [ ] Register handler + validator in `Program.cs` DI container
- [ ] Run test: `dotnet test --filter "CreateClienteEndpointTests"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: TC-E2-P0-02 — Duplicate NIT/RUC returns 409 with user-friendly message

**Files:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/CreateClienteEndpointTests.cs`

**Tasks to make this test pass:**

- [ ] Handle `DbUpdateException` for unique index violation (`uk_clientes_nit`) in endpoint or repository
- [ ] Map uniqueness violation to `DuplicateNitException` (or catch inline in endpoint)
- [ ] Return `Results.Problem(statusCode: 409, detail: "El NIT/RUC ya está registrado")` with `application/problem+json`
- [ ] Ensure no stack trace, InnerException, or EF Core namespace in response body
- [ ] Run test: `dotnet test --filter "GivenDuplicateNitRuc"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E2-P0-03 — Empty body returns 400 with field-level errors

**Files:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/CreateClienteEndpointTests.cs`

**Tasks to make this test pass:**

- [ ] Implement `CreateClienteRequestValidator` with NotEmpty rules for all 4 fields
- [ ] Wire validator to endpoint: validate before calling handler, return `Results.ValidationProblem()`
- [ ] Verify response is `application/problem+json` with `errors` object
- [ ] Run test: `dotnet test --filter "GivenEmptyBody_WhenPostClientes"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-P3-04 — FluentValidation rejects empty Nombre

**Files:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Tasks to make this test pass:**

- [ ] Create `CreateClienteRequestValidator` with `RuleFor(x => x.Nombre).NotEmpty()`
- [ ] Spanish error messages: "El nombre es requerido.", "El NIT/RUC es requerido.", etc.
- [ ] Run test: `dotnet test --filter "CreateClienteRequestValidatorTests"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-P0-04 — Submit empty form → 4 inline errors, no API call

**Files:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` with Zod schema
- [ ] Create `ClienteForm.tsx` using `react-hook-form` + `zodResolver(clienteSchema)`
- [ ] Add `role="alert"` to each inline error `<p>` element
- [ ] Ensure `handleSubmit` from RHF prevents API call when Zod validation fails
- [ ] Run test: `npx vitest run ClienteForm.test.tsx --grep "TC-E2-P0-04"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E2-P0-05 — MSW 409 → "El NIT/RUC ya está registrado" inline

**Files:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] In `ClienteForm.onSubmit`, catch 409 errors and call `setError('nitRuc', { message: 'El NIT/RUC ya está registrado' })`
- [ ] Ensure the error is NOT shown as a toast (no `toast.error()` for 409)
- [ ] Run test: `npx vitest run ClienteForm.test.tsx --grep "TC-E2-P0-05"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-P0-07 — Create → list update < 2s + toast visible

**Files:** `e2e/tests/clientes/clientes-create.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` with `invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`
- [ ] On success in `ClienteForm`: call `toast.success('Cliente creado correctamente')`
- [ ] Verify toast library is integrated (sonner or equivalent)
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-create.spec.ts --grep "TC-E2-P0-07"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-P3-02 — Zod clienteSchema validates all 4 required fields

**Files:** `frontend/src/modules/crm/clientes/application/clienteSchema.story2-3.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` (exporting `clienteSchema` and `ClienteFormValues`)
- [ ] Each field: `z.string().min(1, 'El [campo] es requerido')` with Spanish error messages
- [ ] Run test: `npx vitest run clienteSchema.story2-3.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E tests for Story 2.3
npx playwright test e2e/tests/clientes/clientes-create.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/clientes-create.spec.ts --headed

# Run API integration tests for Story 2.3
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "CreateClienteEndpointTests"

# Run backend unit tests for Story 2.3
dotnet test backend/tests/SiesaAgents.UnitTests --filter "CreateClienteCommandHandler|CreateClienteRequestValidator"

# Run frontend component tests
npx vitest run frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx

# Run frontend Zod schema unit tests
npx vitest run frontend/src/modules/crm/clientes/application/clienteSchema.story2-3.test.ts

# Run all tests (from repo root)
npx playwright test && dotnet test && npx vitest run
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created (reusing existing `buildCliente`, `ApiHelper`, `ClientesPage`)
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected (missing implementations)
- Failure messages are clear and actionable (no test setup errors)
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**Recommended order:**

1. `clienteSchema.ts` (Zod schema — unblocks all frontend tests)
2. `CreateClienteRequestValidator.cs` (FluentValidation — unblocks backend unit tests)
3. `CreateClienteCommandHandler.cs` (command handler — unblocks unit + integration tests)
4. `POST /api/v1/clientes` endpoint (API integration tests go green)
5. `useCreateCliente.ts` (mutation hook)
6. `ClienteForm.tsx` (component tests go green)
7. `ClienteListView.tsx` updates (E2E tests go green)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 43 tests pass (green phase complete)
2. Extract shared form helpers if `ClienteForm` and future `ClienteEditForm` share code
3. Review error boundary for generic network errors
4. Ensure `TreatWarningsAsErrors = true` still passes (zero C# compiler warnings)
5. Run full Playwright suite to confirm no regressions

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Begin implementation: `clienteSchema.ts` first (unblocks all frontend tests simultaneously)
3. Work one test layer at a time: Unit → API → Component → E2E
4. When all tests pass, update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Reused existing `ApiHelper`, `buildCliente`, `ClientesPage` POM from Stories 2.1/2.2
- **network-first.md** — Route interception BEFORE navigation applied in all E2E tests that mock network (AC4, AC5 cancel flow)
- **component-tdd.md** — MSW `setupServer` per file (not global), `QueryClientProvider` wrapper for mutation hook isolation
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, no hard waits
- **selector-resilience.md** — `data-testid` selectors used exclusively; ARIA roles as fallback
- **test-levels-framework.md** — AC1/AC5 critical happy path → E2E; AC2/AC4 business logic → API Integration; AC3 form behavior → Component; validation logic → Unit

---

## Test Execution Evidence

**Expected failure mode per layer:**

- E2E tests: `Error: Locator.click: Timeout 30000ms exceeded — locator('button', { name: /nuevo cliente/i })` (button not rendered yet)
- API tests: `System.Net.Http.HttpRequestException` or `Assert.Equal(201, 404)` (endpoint not mapped)
- Component tests: `Cannot find module '../presentation/ClienteForm'` (file does not exist)
- Unit tests (backend): `CS0246: The type or namespace name 'CreateClienteCommandHandler' could not be found`
- Unit tests (frontend): `Cannot find module './clienteSchema'` → `clienteSchema` export not found

---

**Generated by BMad TEA Agent** — 2026-06-17
