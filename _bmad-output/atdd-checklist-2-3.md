# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component + API (Integration)

---

## Story Summary

A commercial team member can register a new client by filling in a form with four required fields
(Nombre, NIT/RUC, Teléfono, Ciudad). On success the client appears immediately in the left panel
list without a page reload and a success toast is shown. Client-side and server-side validation
prevents incomplete or duplicate submissions.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. Given the user is on `/clientes`, When the user clicks "Nuevo cliente", Then a `ClienteForm` opens with four required fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR1).
2. Given the user has filled all required fields and submits, When the form is submitted, Then the client is created via `POST /api/v1/clientes`, the new client appears in the list without page reload (FR27), and a success toast displays "Cliente creado correctamente".
3. Given the user submits the form with one or more required fields empty, When the form is validated, Then clear inline error messages appear on empty fields (FR8) and the form is NOT submitted to the backend.
4. Given the user submits a NIT/RUC that already exists, When the backend returns 409 Conflict, Then an inline error "El NIT/RUC ya está registrado" appears on the NIT/RUC field without technical details (NFR6).

---

## Failing Tests Created (RED Phase)

### Backend API Tests (6 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/CreateClienteApiTests.cs`

- **Test:** `PostCliente_WithValidPayload_Returns201WithClienteDto`
  - **Status:** RED — `POST /api/v1/clientes` endpoint does not exist yet
  - **Verifies:** TC-E2-2-3-API-1 (P0) — Valid payload returns 201 + ClienteDto shape with DateTimeOffset fields

- **Test:** `PostCliente_WithDuplicateNit_Returns409WithProblemDetails`
  - **Status:** RED — `POST /api/v1/clientes` endpoint does not exist yet
  - **Verifies:** TC-E2-2-3-API-2 (P0) — Duplicate NIT returns 409 + Problem Details RFC 7807 with "NIT/RUC" in detail, no stack trace

- **Test:** `PostCliente_WithEmptyBody_Returns400WithValidationErrors`
  - **Status:** RED — `POST /api/v1/clientes` endpoint does not exist yet
  - **Verifies:** TC-E2-2-3-API-3 (P1) — Empty body returns 400 + Problem Details with errors object

- **Test:** `PostCliente_WithMissingNombre_Returns400WithNombreError`
  - **Status:** RED — `POST /api/v1/clientes` endpoint does not exist yet
  - **Verifies:** TC-E2-2-3-API-4 (P1) — Missing Nombre field returns 400 with Nombre in errors

- **Test:** `PostCliente_With255CharNombre_Returns201`
  - **Status:** RED — `POST /api/v1/clientes` endpoint does not exist yet
  - **Verifies:** TC-E2-2-3-API-5a (P3) — Nombre at max boundary (255 chars) returns 201

- **Test:** `PostCliente_With256CharNombre_Returns400`
  - **Status:** RED — `POST /api/v1/clientes` endpoint does not exist yet
  - **Verifies:** TC-E2-2-3-API-5b (P3) — Nombre over max boundary (256 chars) returns 400

### Backend Unit Tests (11 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/CreateClienteValidatorTests.cs`

- **Test:** `Validate_WhenNombreIsNull_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** TC-E2-2-3-UNIT-1 (P2) — Validator rejects null Nombre

- **Test:** `Validate_WhenNombreIsEmpty_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** TC-E2-2-3-UNIT-1 variant — Validator rejects empty Nombre

- **Test:** `Validate_WhenNombreExceeds255Chars_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** MaximumLength(255) boundary for Nombre

- **Test:** `Validate_WhenNombreIs255Chars_ShouldNotHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** MaximumLength(255) inclusive boundary

- **Test:** `Validate_WhenNitIsNull_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** TC-E2-2-3-UNIT-2 (P2) — Validator rejects null Nit

- **Test:** `Validate_WhenNitIsEmpty_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** TC-E2-2-3-UNIT-2 variant — Validator rejects empty Nit

- **Test:** `Validate_WhenNitExceeds50Chars_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** MaximumLength(50) boundary for Nit

- **Test:** `Validate_WhenTelefonoIsNull_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** TC-E2-2-3-UNIT-3 (P2) — Validator rejects null Telefono

- **Test:** `Validate_WhenTelefonoIsEmpty_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** TC-E2-2-3-UNIT-3 variant — Validator rejects empty Telefono

- **Test:** `Validate_WhenCiudadIsNull_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** TC-E2-2-3-UNIT-4 (P2) — Validator rejects null Ciudad

- **Test:** `Validate_WhenCiudadIsEmpty_ShouldHaveValidationError`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** TC-E2-2-3-UNIT-4 variant — Validator rejects empty Ciudad

- **Test:** `Validate_WhenAllFieldsAreValid_ShouldNotHaveAnyValidationErrors`
  - **Status:** RED — `CreateClienteRequestValidator` class does not exist yet
  - **Verifies:** Happy path — all valid fields pass

### Frontend Component Tests (12 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteForm.test.tsx`

- **Test:** `TC-E2-2-3-CMP-1: should show 4 inline validation errors when all required fields are empty`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** TC-E2-2-3-CMP-1 (P0) — Empty submit shows 4 errors, POST never called

- **Test:** `should show inline error for Nombre field when empty`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** AC#3 — Nombre field shows error on empty submit

- **Test:** `should show inline error for NIT/RUC field when empty`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** AC#3 — NIT field shows error on empty submit

- **Test:** `should show inline error for Teléfono field when empty`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** AC#3 — Teléfono field shows error on empty submit

- **Test:** `should show inline error for Ciudad field when empty`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** AC#3 — Ciudad field shows error on empty submit

- **Test:** `should NOT call POST /api/v1/clientes when client-side validation fails`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** AC#3 — Zod client-side guard prevents backend call

- **Test:** `TC-E2-2-3-CMP-2: should display "El NIT/RUC ya está registrado" as inline error on NIT field when backend returns 409`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** TC-E2-2-3-CMP-2 (P2) — 409 response → inline NIT error

- **Test:** `should NOT show generic error panel — the 409 error is inline on the NIT field only`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** NFR6 — no technical details exposed

- **Test:** `TC-E2-2-3-CMP-3: should show toast "Cliente creado correctamente" after successful creation`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** TC-E2-2-3-CMP-3 (P2) — success toast

- **Test:** `should call onClose after successful client creation`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** AC#2 — form closes on success

- **Test:** `should disable submit button while mutation is pending`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** `disabled={isPending}` during mutation

- **Test:** `should render the form with all four required fields in Spanish`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** AC#1 — four fields with Spanish labels

- **Test:** `should render "Crear cliente" submit button and "Cancelar" button`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** AC#1 — correct button labels in Spanish

- **Test:** `should call onClose when "Cancelar" button is clicked`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** Cancel closes the form

- **Test:** `should render with data-testid="cliente-form" on the form element`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** data-testid required for E2E selector stability

### E2E Tests (5 tests)

**File:** `e2e/tests/clientes/clientes-create.spec.ts`

- **Test:** `TC-E2-2-3-E2E-1: should show new client Nombre in left panel immediately after creation without page reload`
  - **Status:** RED — `ClienteForm`, `useCreateCliente`, and `btn-nuevo-cliente` do not exist yet
  - **Verifies:** TC-E2-2-3-E2E-1 (P0) — Full E2E: form → POST → invalidateQueries → list update; risk R-002

- **Test:** `should show inline validation errors when form is submitted empty`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** E2E confirmation of client-side validation, POST never called

- **Test:** `should show "El NIT/RUC ya está registrado" inline error on NIT field when backend returns 409`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** 409 conflict handling in E2E context

- **Test:** `should close the form when "Cancelar" button is clicked`
  - **Status:** RED — `ClienteForm` component does not exist yet
  - **Verifies:** Cancel closes form without POST call

- **Test:** `should show "Nuevo cliente" button when a client is selected (detail route)`
  - **Status:** RED — `btn-nuevo-cliente` not wired to `clientes.$clienteId.tsx` yet
  - **Verifies:** Button available in both `/clientes` and `/clientes/:id` routes

---

## Data Factories Used

### Cliente Factory (existing — reused from Story 2.1)

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts`

**Exports:**
- `buildCliente(overrides?)` - Build single Cliente with optional field overrides
- `buildClientes(count, overridesFn?)` - Build array of Clientes
- `resetClienteCounter()` - Reset counter for deterministic IDs

**E2E Helper:**
**File:** `e2e/helpers/data.helper.ts` (existing — reused from Story 2.1)

---

## Mock Requirements

### POST /api/v1/clientes — Frontend Component Tests (MSW)

**Success Response (201):**
```json
{ "id": "uuid", "nombre": "Acme S.A.", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-06-28T10:00:00Z", "updatedAt": "2026-06-28T10:00:00Z" }
```

**Conflict Response (409 — duplicate NIT):**
```json
{ "type": "https://tools.ietf.org/html/rfc7807", "title": "Conflicto de datos", "status": 409, "detail": "El NIT/RUC ya está registrado" }
```

**Notes:** MSW intercepts are set up BEFORE render (network-first pattern to prevent race conditions).

---

## Required data-testid Attributes

### ClienteForm Component

- `cliente-form` - Root `<form>` element
- `input-nombre` - Nombre text input
- `input-nit` - NIT/RUC text input
- `input-telefono` - Teléfono text input
- `input-ciudad` - Ciudad text input
- `btn-submit` - "Crear cliente" submit button (disabled when `isPending`)
- `btn-cancel` - "Cancelar" button (calls `onClose`)

### /clientes Route (left panel header)

- `btn-nuevo-cliente` - "Nuevo cliente" button — must be present at BOTH:
  - `frontend/src/routes/_app/clientes.tsx`
  - `frontend/src/routes/_app/clientes.$clienteId.tsx`

### Inherited from Prior Stories (already implemented)

- `cliente-list-item` - Each item in the left panel list (Story 2.1)
- `cliente-detail-panel` - Right panel container (Story 2.2)

**Implementation Example:**
```tsx
<form data-testid="cliente-form" onSubmit={handleSubmit(onSubmit)}>
  <input data-testid="input-nombre" {...register('nombre')} />
  <input data-testid="input-nit" {...register('nit')} />
  <input data-testid="input-telefono" {...register('telefono')} />
  <input data-testid="input-ciudad" {...register('ciudad')} />
  <button type="button" data-testid="btn-cancel" onClick={onClose}>Cancelar</button>
  <button type="submit" data-testid="btn-submit" disabled={isPending}>Crear cliente</button>
</form>
```

---

## Implementation Checklist

### Test: PostCliente_WithValidPayload_Returns201WithClienteDto

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/CreateClienteApiTests.cs`

**Tasks to make this test pass:**

- [ ] Create `CreateClienteRequest.cs` record with `string Nombre, string Nit, string Telefono, string Ciudad`
- [ ] Create `CreateClienteRequestValidator.cs` with FluentValidation rules
- [ ] Create `CreateClienteCommand.cs` record
- [ ] Create `CreateClienteCommandHandler.cs` — validate, create entity, persist, return `ClienteDto`
- [ ] Add `Task AddAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository`
- [ ] Implement `AddAsync` in `ClienteRepository`
- [ ] Add `MapPost("/", ...)` to `ClienteEndpoints.cs` returning `Results.Created(...)` (201)
- [ ] Response body uses `DateTimeOffset` fields (not `DateTime` — architecture enforcement)
- [ ] Register handler and validator in `Program.cs` DI
- [ ] Add required data-testid attributes: none (backend test)
- [ ] Run test: `dotnet test --filter "PostCliente_WithValidPayload_Returns201WithClienteDto"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: PostCliente_WithDuplicateNit_Returns409WithProblemDetails

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/CreateClienteApiTests.cs`

**Tasks to make this test pass:**

- [ ] In `ClienteEndpoints.cs`: catch `DbUpdateException` when `SqlState == "23505"` (PostgreSQL unique violation)
- [ ] Return `Results.Problem(detail: "El NIT/RUC ya está registrado", statusCode: 409, title: "Conflicto de datos")`
- [ ] Ensure `ExceptionHandlingMiddleware` does NOT expose stack trace (NFR6)
- [ ] Run test: `dotnet test --filter "PostCliente_WithDuplicateNit_Returns409WithProblemDetails"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: PostCliente_WithEmptyBody_Returns400WithValidationErrors

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/CreateClienteApiTests.cs`

**Tasks to make this test pass:**

- [ ] `CreateClienteRequestValidator` rules: `NotEmpty()` for all four fields
- [ ] Endpoint returns `Results.ValidationProblem(validation.ToDictionary())` for invalid request
- [ ] Run test: `dotnet test --filter "PostCliente_WithEmptyBody_Returns400WithValidationErrors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: CreateClienteValidatorTests (all UNIT tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/CreateClienteValidatorTests.cs`

**Tasks to make these tests pass:**

- [ ] `CreateClienteRequestValidator.cs`: `RuleFor(x => x.Nombre).NotEmpty().MaximumLength(255)`
- [ ] `CreateClienteRequestValidator.cs`: `RuleFor(x => x.Nit).NotEmpty().MaximumLength(50)`
- [ ] `CreateClienteRequestValidator.cs`: `RuleFor(x => x.Telefono).NotEmpty().MaximumLength(50)`
- [ ] `CreateClienteRequestValidator.cs`: `RuleFor(x => x.Ciudad).NotEmpty().MaximumLength(100)`
- [ ] Run tests: `dotnet test --filter "CreateClienteValidatorTests"`
- [ ] ✅ All 12 unit tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-2-3-CMP-1 (empty form → 4 errors, no POST)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `ClienteForm.tsx` using `react-hook-form` with `zodResolver(clienteSchema)`
- [ ] Add fields with `data-testid`: `input-nombre`, `input-nit`, `input-telefono`, `input-ciudad`
- [ ] Render `formState.errors` as `role="alert"` elements below each field
- [ ] `btn-submit` button triggers form validation (does not call backend if invalid)
- [ ] Verify `clienteSchema.ts` from Story 2.1 marks all 4 fields as required
- [ ] Run test: `pnpm --filter frontend test ClienteForm`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E2-2-3-CMP-2 (409 response → NIT inline error)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `useCreateCliente.ts` TanStack Query mutation hook
- [ ] Implement `clienteApiRepository.create(data)` calling `POST /api/v1/clientes`
- [ ] In `ClienteForm.tsx` `onSubmit`: call `mutate(data, { onError: ... })`
- [ ] In `onError`: detect `axios.isAxiosError(error) && error.response?.status === 409`
- [ ] Call `setError('nit', { message: 'El NIT/RUC ya está registrado' })`
- [ ] Run test: `pnpm --filter frontend test ClienteForm`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-2-3-CMP-3 (valid submit → toast)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] In `useCreateCliente.ts` `onSuccess`: call `toast.success('Cliente creado correctamente')`
- [ ] Also in `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` (FR27)
- [ ] Verify `Toaster` is mounted in `frontend/src/app/providers/` (sonner or shadcn/ui)
- [ ] Run test: `pnpm --filter frontend test ClienteForm`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-2-3-E2E-1 (full E2E create → name in list)

**File:** `e2e/tests/clientes/clientes-create.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `btn-nuevo-cliente` button to `clientes.tsx` left panel header
- [ ] Wire `ClienteForm` in a Dialog/Sheet: renders when `isFormOpen === true`
- [ ] Also add `btn-nuevo-cliente` to `clientes.$clienteId.tsx`
- [ ] `useCreateCliente` `onSuccess` calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })`
- [ ] Left panel list rerenders with new client after invalidation (no page reload)
- [ ] Run test: `pnpm exec playwright test clientes-create.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all backend API + unit tests for Story 2.3
dotnet test backend/tests/SiesaAgents.UnitTests --filter "CreateCliente"

# Run specific backend API test file
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~CreateClienteApiTests"

# Run backend unit tests (validator)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~CreateClienteValidatorTests"

# Run all frontend component tests for Story 2.3
pnpm --filter frontend test ClienteForm

# Run all failing E2E tests for Story 2.3
pnpm exec playwright test e2e/tests/clientes/clientes-create.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/clientes-create.spec.ts --headed

# Debug specific E2E test
pnpm exec playwright test e2e/tests/clientes/clientes-create.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (34 total)
- Existing `clienteFactory.ts` and `data.helper.ts` reused (no new factories needed)
- MSW network-first intercepts registered before render in all component tests
- data-testid requirements listed
- Mock requirements documented
- Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failures are due to missing files/implementations, not test bugs
- Component tests: import failure on `ClienteForm` (file does not exist)
- Backend tests: compile error on `CreateClienteRequest` / `CreateClienteRequestValidator` (files do not exist)
- E2E tests: `btn-nuevo-cliente` not found, `cliente-form` not found

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with P0)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: `CreateClienteRequest` + `CreateClienteRequestValidator` → unit tests green
2. Backend: `CreateClienteCommandHandler` + `AddAsync` + endpoint → API tests green
3. Frontend: `clienteApiRepository.create` + `useCreateCliente` → hook ready
4. Frontend: `ClienteForm` component → component tests green
5. Frontend: wire `btn-nuevo-cliente` + Dialog in routes → E2E tests green

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 34 tests pass (green phase complete)
2. Review `ClienteForm` for extractable components (form field wrapper)
3. Ensure no `any` TypeScript types remain
4. Confirm `ExceptionHandlingMiddleware` still active (NFR6)
5. Run full test suite to confirm no regressions
6. Mark story as done in `sprint-status.yaml`

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `dotnet test --filter "CreateCliente"` and `pnpm --filter frontend test ClienteForm`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all 34 tests pass, refactor code for quality
6. When refactoring complete, manually update story status to 'done' in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — Route intercepts registered BEFORE render/navigation in all tests
- **data-factories.md** — Reusing existing `clienteFactory.ts` and `data.helper.ts` from Story 2.1
- **test-quality.md** — Given-When-Then structure, atomic assertions, isolation with auto-cleanup
- **selector-resilience.md** — All selectors use `data-testid` (no fragile CSS selectors)
- **fixture-architecture.md** — MSW `setupServer` / `beforeAll` / `afterEach` cleanup pattern
- **component-tdd.md** — Isolated `QueryClient` per test, `retry: false` for determinism
- **test-levels-framework.md** — P0 E2E for critical journey, API for backend contracts, Component for form logic

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Backend command:** `dotnet test backend/tests/SiesaAgents.UnitTests --filter "CreateCliente"`

**Expected results:**
```
FAILED — CreateClienteApiTests: compile error or endpoint not found (404/405)
FAILED — CreateClienteValidatorTests: compile error (CreateClienteRequestValidator not found)
Total: 0 passed, 17 failed — RED phase confirmed
```

**Frontend command:** `pnpm --filter frontend test ClienteForm`

**Expected results:**
```
FAILED — ClienteForm.test.tsx: Cannot find module '../presentation/ClienteForm'
Total: 0 passed, 15 failed — RED phase confirmed
```

**E2E command:** `pnpm exec playwright test e2e/tests/clientes/clientes-create.spec.ts`

**Expected results:**
```
FAILED — clientes-create.spec.ts: getByTestId('btn-nuevo-cliente') not found
Total: 0 passed, 5 failed — RED phase confirmed
```

**Summary:**
- Total tests: 34 (approximate — 6 API + 12 unit + 15 component + 5 E2E + guard tests)
- Passing: 0 (expected)
- Failing: 34 (expected)
- Status: RED phase confirmed

---

## Notes

- `clienteSchema.ts` and `ClienteFormData` type from Story 2.1 — do NOT recreate; reuse as-is
- `ExceptionHandlingMiddleware` from Story 1.3 must remain active (NFR6 — no stack traces)
- `ApiHelper.createCliente` is already implemented in `e2e/helpers/api.helper.ts` — reused for E2E teardown
- Backend tests use `WebApplicationFactory<Program>` without Testcontainers (in-memory SQLite/real DB per existing factory setup)
- Frontend component tests use MSW 2.x (`http` and `HttpResponse` from `msw`) — consistent with Story 2.2 patterns
- Toast provider (`Toaster`) must be mounted before component tests work for TC-E2-2-3-CMP-3

---

**Generated by BMad TEA Agent** - 2026-06-28
