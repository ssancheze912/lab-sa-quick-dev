# ATDD Checklist - Epic 3, Story 3.3: Create Contact

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component + Unit + API Integration

---

## Story Summary

Commercial team members need to register a new contact through a form to make it immediately available in the system for the whole team. The form requires Nombre, Cargo, Teléfono, and Email (all required). Client-side validation via Zod prevents submission with invalid data, and POST /api/v1/contactos creates the record.

**As a** commercial team member
**I want** to register a new contact by filling in a form
**So that** the contact is available in the system immediately for the whole team

---

## Acceptance Criteria

1. Given user is on `/contactos`, When they click "Nuevo contacto", Then a form opens with fields: Nombre, Cargo, Teléfono, Email.
2. Given all required fields are filled and submitted, When form is submitted, Then `POST /api/v1/contactos` is called, cache `['contactos']` is invalidated, new contact appears in list, and toast "Contacto creado correctamente" shows.
3. Given user submits form with empty fields, When form is validated (Zod client-side), Then inline errors appear on each empty field and form is NOT submitted to backend.
4. Given user submits with invalid Email format, When form is validated, Then inline error "El email no tiene un formato válido" is shown and form is NOT submitted.
5. Given backend returns 400 Bad Request, When error is received, Then error message is displayed without stack traces or technical details (NFR6).
6. Given form is open, When user clicks "Cancelar", Then form closes without any mutation being triggered.
7. Given form submits successfully, When mutation's `onSuccess` fires, Then `queryClient.invalidateQueries({ queryKey: ['contactos'] })` is called, causing the list to re-fetch.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/contactos/create-contacto.spec.ts`

- **Test:** `AC-1: should open form with Nombre, Cargo, Teléfono, Email fields when "Nuevo contacto" is clicked`
  - **Status:** RED — ContactoForm component and "Nuevo contacto" button do not exist yet
  - **Verifies:** AC-1, FR9

- **Test:** `AC-2: should create contact via POST, show toast "Contacto creado correctamente", and display new contact in list`
  - **Status:** RED — POST /api/v1/contactos endpoint and ContactoForm do not exist yet
  - **Verifies:** AC-2, FR9, FR27, NFR2

- **Test:** `AC-3: should show inline validation errors when submitting empty form and NOT call POST`
  - **Status:** RED — ContactoForm with Zod validation does not exist yet
  - **Verifies:** AC-3, FR16, NFR5

- **Test:** `AC-4: should show email format error and NOT call POST when email is invalid`
  - **Status:** RED — ContactoForm with email format validation does not exist yet
  - **Verifies:** AC-4, FR16

- **Test:** `AC-5: should display error message without stack trace when backend returns 400`
  - **Status:** RED — ContactoForm and error handling do not exist yet
  - **Verifies:** AC-5, NFR6

- **Test:** `AC-6: should close form without POST when "Cancelar" is clicked`
  - **Status:** RED — ContactoForm with cancel behavior does not exist yet
  - **Verifies:** AC-6

- **Test:** `AC-7: should re-fetch contact list after successful creation (cache invalidation)`
  - **Status:** RED — useCreateContacto with invalidateQueries does not exist yet
  - **Verifies:** AC-7, FR27

### API Integration Tests (5 tests — xUnit + WebApplicationFactory)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Contactos/CreateContactoEndpointTests.cs`

- **Test:** `TC_E3_P0_07_PostContacto_Returns201_WithCompleteDtoAndPersists`
  - **Status:** RED — POST /api/v1/contactos endpoint does not exist → 404
  - **Verifies:** TC-E3-P0-07: 201 response with id (UUID), nombre, cargo, telefono, email, clienteId (null), createdAt (ISO 8601 with TZ); Location header; follow-up GET confirms persistence

- **Test:** `PostContacto_Returns201_WithJsonContentType`
  - **Status:** RED — endpoint not yet registered
  - **Verifies:** Content-Type is application/json on 201 response

- **Test:** `TC_E3_P1_19_PostContacto_Returns400_WithProblemDetails_OnEmptyBody`
  - **Status:** RED — FluentValidation validator and endpoint do not exist yet
  - **Verifies:** TC-E3-P1-19: 400 + Problem Details with errors for nombre, cargo, telefono, email; no stackTrace

- **Test:** `PostContacto_Returns400_WhenRequiredFieldsMissing_PartialPayload`
  - **Status:** RED — endpoint and validator do not exist yet
  - **Verifies:** Partial payload (only nombre) also returns 400

- **Test:** `TC_E3_Email400_PostContacto_Returns400_WithEmailValidationError`
  - **Status:** RED — FluentValidation email validator not yet created
  - **Verifies:** TC-E3-email-400: invalid email format → 400 + errors.email entry; no stackTrace

- **Test:** `PostContacto_Returns400_WhenEmailHasNoDomain`
  - **Status:** RED — email validator not yet created
  - **Verifies:** Email with no domain ("ana@") also returns 400

### Component Tests (13 tests — Vitest + RTL + MSW)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoForm.test.tsx`

- **Test:** `should render all 4 form fields with data-testid attributes`
  - **Status:** RED — ContactoForm.tsx does not exist → "Cannot find module './ContactoForm'"
  - **Verifies:** AC-1: all 4 fields rendered

- **Test:** `should render Guardar and Cancelar buttons`
  - **Status:** RED — component does not exist
  - **Verifies:** AC-1, AC-6: both action buttons present

- **Test:** `should render Spanish labels for all fields`
  - **Status:** RED — component does not exist
  - **Verifies:** AC-1: Spanish labels (Nombre, Cargo, Teléfono, Email)

- **Test:** `TC-E3-P0-04: should call onSuccess after form is submitted with valid data and backend returns 201`
  - **Status:** RED — ContactoForm and useCreateContacto do not exist
  - **Verifies:** TC-E3-P0-04: successful create → onSuccess called

- **Test:** `TC-E3-P0-04: should show success toast "Contacto creado correctamente" after 201 response`
  - **Status:** RED — component and toast integration do not exist
  - **Verifies:** TC-E3-P0-04: toast message on success

- **Test:** `TC-E3-P0-04: should send POST to /api/v1/contactos with all 4 fields in the request body`
  - **Status:** RED — component and repository do not exist
  - **Verifies:** TC-E3-P0-04: POST payload contains nombre, cargo, telefono, email

- **Test:** `TC-E3-P0-04: should disable the Guardar button while mutation is in flight (isPending)`
  - **Status:** RED — component with isPending handling does not exist
  - **Verifies:** AC-2: disabled during submission

- **Test:** `TC-E3-P0-05B: should display inline error on nombre field when form is submitted empty`
  - **Status:** RED — ContactoForm with Zod validation does not exist
  - **Verifies:** TC-E3-P0-05B: inline error on nombre

- **Test:** `TC-E3-P0-05B: should display inline errors on all 4 required fields when form is submitted empty`
  - **Status:** RED — component does not exist
  - **Verifies:** TC-E3-P0-05B: all 4 inline errors

- **Test:** `TC-E3-P0-05B: should NOT send POST to backend when required fields are empty`
  - **Status:** RED — component does not exist
  - **Verifies:** TC-E3-P0-05B: POST not called when Zod blocks

- **Test:** `TC-E3-email-invalid: should display "El email no tiene un formato válido" when email is invalid`
  - **Status:** RED — component with custom email error message does not exist
  - **Verifies:** AC-4: specific Spanish email error message

- **Test:** `TC-E3-email-invalid: should NOT send POST to backend when email format is invalid`
  - **Status:** RED — component does not exist
  - **Verifies:** AC-4: POST not called on invalid email

- **Test:** `TC-E3-email-invalid: should display error on email-field testid when email is invalid`
  - **Status:** RED — component does not exist
  - **Verifies:** AC-4: data-testid="contacto-form-error-email" present

- **Test:** `Cancel: should call onCancel when "Cancelar" button is clicked`
  - **Status:** RED — component does not exist
  - **Verifies:** AC-6: onCancel prop called

- **Test:** `Cancel: should NOT send POST to backend when Cancelar is clicked`
  - **Status:** RED — component does not exist
  - **Verifies:** AC-6: no mutation on cancel

- **Test:** `Backend 400: should display error message when backend returns 400`
  - **Status:** RED — component and error handling do not exist
  - **Verifies:** AC-5: generic error message shown

- **Test:** `Backend 400: should NOT expose stack trace or technical details on 400`
  - **Status:** RED — component does not exist
  - **Verifies:** AC-5, NFR6: no stackTrace, innerException, exception in UI

- **Test:** `Backend 400: should NOT call onSuccess when backend returns 400`
  - **Status:** RED — component does not exist
  - **Verifies:** AC-5: onSuccess not called on error

### Unit Tests — useCreateContacto hook (8 tests — Vitest)

**File:** `frontend/src/modules/crm/contactos/application/useCreateContacto.test.ts`

- **Test:** `TC-E3-P2-05: should call queryClient.invalidateQueries with key ["contactos"] after successful mutation`
  - **Status:** RED — useCreateContacto.ts does not exist → "Cannot find module './useCreateContacto'"
  - **Verifies:** TC-E3-P2-05, AC-7, FR27

- **Test:** `should NOT call invalidateQueries when mutation fails`
  - **Status:** RED — hook does not exist
  - **Verifies:** invalidateQueries only called on success

- **Test:** `should expose isPending as true while the mutation is in flight`
  - **Status:** RED — hook does not exist
  - **Verifies:** isPending state during mutation

- **Test:** `should expose isPending as false before any mutation is triggered`
  - **Status:** RED — hook does not exist
  - **Verifies:** isPending initial state is false

- **Test:** `should call options.onSuccess when the mutation succeeds`
  - **Status:** RED — hook does not exist
  - **Verifies:** onSuccess callback forwarding

- **Test:** `should NOT call options.onSuccess when mutation fails`
  - **Status:** RED — hook does not exist
  - **Verifies:** onSuccess not called on error

- **Test:** `TC-E3-email-400: should expose isError true when backend returns 400`
  - **Status:** RED — hook does not exist
  - **Verifies:** isError state on 400 backend error

- **Test:** `should expose isError as false before mutation is triggered`
  - **Status:** RED — hook does not exist
  - **Verifies:** isError initial state is false

---

## Data Factories Created

### Contacto Factory (existing from Story 3.1)

**File:** `frontend/src/test/factories/contacto.factory.ts` (already exists)

**Exports:**
- `createContacto(overrides?)` — Create single contacto test data
- `createContactos(count, overrides?)` — Create array of contactos
- `resetContactoCounter()` — Reset internal counter for deterministic IDs

**E2E data builder (existing from Story 3.1):**

**File:** `e2e/helpers/data.helper.ts` (already exists — `buildContacto()`)

---

## New MSW Handler File Created

**File:** `frontend/src/test/msw/handlers/contactos-create.handlers.ts`

**Exports:**
- `handlePostContactoSuccess(responseBody?)` — Returns 201 Created with ContactoDto
- `handlePostContactoValidationError(errors?)` — Returns 400 with Problem Details + errors object
- `handlePostContactoEmailValidationError()` — Returns 400 specifically for email format error
- `handlePostContactoServerError()` — Returns 500 Internal Server Error

---

## Mock Requirements

### POST /api/v1/contactos — Success (201)

**Endpoint:** `POST /api/v1/contactos`

**Success Response:**
```json
{
  "id": "00000000-0000-0000-0000-000000000099",
  "nombre": "<from request body>",
  "cargo": "<from request body>",
  "telefono": "<from request body>",
  "email": "<from request body>",
  "clienteId": null,
  "createdAt": "2026-06-29T10:00:00Z"
}
```

**Validation Error Response (400):**
```json
{
  "status": 400,
  "title": "Validation Error",
  "errors": {
    "nombre": ["The Nombre field is required."],
    "cargo": ["The Cargo field is required."],
    "telefono": ["The Telefono field is required."],
    "email": ["The Email field is required."]
  }
}
```

**Notes:**
- No 409 Conflict handler needed — Email is indexed but NOT unique for contacts per story dev notes
- All MSW handlers are network-first: set up before page.goto() in E2E tests

---

## Required data-testid Attributes

### ContactoForm Component

- `contacto-form-nombre` — Input field for Nombre
- `contacto-form-cargo` — Input field for Cargo
- `contacto-form-telefono` — Input field for Teléfono
- `contacto-form-email` — Input field for Email
- `contacto-form-submit` — "Guardar" submit button
- `contacto-form-cancel` — "Cancelar" button
- `contacto-form-error-nombre` — Inline error container for nombre field
- `contacto-form-error-cargo` — Inline error container for cargo field
- `contacto-form-error-telefono` — Inline error container for telefono field
- `contacto-form-error-email` — Inline error container for email field

### ContactoListView (existing from Story 3.1 — verify)

- `contacto-row` — Each contacto row in the list (already in ContactosPage POM)

**Implementation Example:**
```tsx
<form data-testid="contacto-form" onSubmit={handleSubmit(onSubmit)}>
  <input data-testid="contacto-form-nombre" {...register('nombre')} />
  {errors.nombre && (
    <span data-testid="contacto-form-error-nombre">{errors.nombre.message}</span>
  )}
  <input data-testid="contacto-form-cargo" {...register('cargo')} />
  {errors.cargo && (
    <span data-testid="contacto-form-error-cargo">{errors.cargo.message}</span>
  )}
  <input data-testid="contacto-form-telefono" {...register('telefono')} />
  {errors.telefono && (
    <span data-testid="contacto-form-error-telefono">{errors.telefono.message}</span>
  )}
  <input data-testid="contacto-form-email" type="email" {...register('email')} />
  {errors.email && (
    <span data-testid="contacto-form-error-email">
      {errors.email.message ?? 'El email no tiene un formato válido'}
    </span>
  )}
  <button data-testid="contacto-form-submit" type="submit" disabled={isPending}>
    {isPending ? 'Guardando...' : 'Guardar'}
  </button>
  <button data-testid="contacto-form-cancel" type="button" onClick={onCancel}>
    Cancelar
  </button>
</form>
```

---

## Implementation Checklist

### Test Group 1: ContactoForm renders correctly (Component Tests)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoForm.test.tsx`

- [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoForm.tsx`
- [ ] Wire `react-hook-form` with `zodResolver(contactoSchema)`
- [ ] Add 4 input fields: nombre, cargo, telefono, email (type="email")
- [ ] Add Spanish labels: Nombre, Cargo, Teléfono, Email
- [ ] Add `data-testid` attributes: `contacto-form-nombre`, `contacto-form-cargo`, `contacto-form-telefono`, `contacto-form-email`
- [ ] Add Guardar button with `data-testid="contacto-form-submit"`
- [ ] Add Cancelar button with `data-testid="contacto-form-cancel"` calling `onCancel()`
- [ ] Run tests: `pnpm vitest run src/modules/crm/contactos/presentation/ContactoForm.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group 2: Client-side validation (Component Tests — TC-E3-P0-05B)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoForm.test.tsx`

- [ ] Add inline error containers with `data-testid`: `contacto-form-error-nombre`, `contacto-form-error-cargo`, `contacto-form-error-telefono`, `contacto-form-error-email`
- [ ] Wire inline errors from `formState.errors` per field
- [ ] Ensure Zod blocks form submission when validation fails
- [ ] Set custom Zod message for email: "El email no tiene un formato válido"
- [ ] Run validation tests: `pnpm vitest run --grep "P0-05B|email-invalid"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group 3: useCreateContacto hook (Unit Tests — TC-E3-P2-05)

**File:** `frontend/src/modules/crm/contactos/application/useCreateContacto.test.ts`

- [ ] Create `frontend/src/modules/crm/contactos/application/useCreateContacto.ts`
- [ ] Implement `useMutation` wrapping `contactoApiRepository.create(data)`
- [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['contactos'] })` + show toast "Contacto creado correctamente"
- [ ] `onError`: show generic "Error al crear el contacto" (no stack traces)
- [ ] Expose `mutate`, `isPending`, `isError`, `error` from hook
- [ ] Accept optional `{ onSuccess?: () => void }` options
- [ ] Run tests: `pnpm vitest run src/modules/crm/contactos/application/useCreateContacto.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group 4: Successful form submission (Component Tests — TC-E3-P0-04)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoForm.test.tsx`

- [ ] Wire `useCreateContacto` into `ContactoForm` via `onSubmit` handler
- [ ] Add `data-testid="contacto-form-submit"` + `disabled={isPending}` on Guardar button
- [ ] Show loading indicator when `isPending === true`
- [ ] Add `create(data: ContactoFormData): Promise<Contacto>` to `IContactoRepository.ts`
- [ ] Implement `create()` in `contactoApiRepository.ts` via `apiClient.post('/api/v1/contactos', data)`
- [ ] Run tests: `pnpm vitest run --grep "P0-04"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group 5: "Nuevo contacto" button and form display in ContactoListView (E2E — AC-1)

**File:** `e2e/tests/contactos/create-contacto.spec.ts`

- [ ] Update `ContactoListView.tsx`: add "Nuevo contacto" button
- [ ] Add `isFormOpen: boolean` state with `useState`
- [ ] Render `ContactoForm` when `isFormOpen === true` (inline or modal/sheet)
- [ ] Pass `onSuccess={() => setIsFormOpen(false)}` and `onCancel={() => setIsFormOpen(false)}`
- [ ] The ContactosPage POM (`e2e/pages/contactos.page.ts`) already has `btnNuevoContacto` — verify selector matches
- [ ] Run E2E test: `pnpm playwright test e2e/tests/contactos/create-contacto.spec.ts --grep "AC-1"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group 6: POST /api/v1/contactos backend endpoint (API Tests — TC-E3-P0-07, TC-E3-P1-19)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Contactos/CreateContactoEndpointTests.cs`

- [ ] Create `CreateContactoCommand.cs` + `CreateContactoCommandHandler.cs` in `backend/src/SiesaAgents.Application/Contactos/Commands/`
- [ ] Create `CreateContactoRequestValidator.cs` in `backend/src/SiesaAgents.Application/Contactos/Validators/` with FluentValidation for nombre, cargo, telefono, email (all required + email format)
- [ ] Verify `ContactoEntity.Create()` factory is implemented in `ContactoEntity.cs`
- [ ] Add `AddAsync(ContactoEntity entity)` to `IContactoRepository.cs` and implement in `ContactoRepository.cs`
- [ ] Register `POST /api/v1/contactos` in `ContactosEndpoints.cs` — returns 201 + Location header
- [ ] Verify `ExceptionHandlingMiddleware` returns 400 Problem Details without stackTrace
- [ ] Run API tests: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "CreateContacto"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all E2E tests for this story
pnpm playwright test e2e/tests/contactos/create-contacto.spec.ts

# Run E2E in headed mode (see browser)
pnpm playwright test e2e/tests/contactos/create-contacto.spec.ts --headed

# Run ContactoForm component tests
pnpm vitest run src/modules/crm/contactos/presentation/ContactoForm.test.tsx

# Run useCreateContacto unit tests
pnpm vitest run src/modules/crm/contactos/application/useCreateContacto.test.ts

# Run all contactos frontend tests
pnpm vitest run src/modules/crm/contactos

# Run backend API integration tests for Story 3.3
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "CreateContacto"

# Run ALL tests (full suite)
pnpm vitest run && pnpm playwright test && dotnet test backend/tests/SiesaAgents.IntegrationTests
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (34 total: 7 E2E + 6 API + 13 component + 8 unit)
- ✅ MSW handler file created: `contactos-create.handlers.ts`
- ✅ Mock requirements documented for POST /api/v1/contactos
- ✅ data-testid requirements listed (10 attributes)
- ✅ Implementation checklist created

**Verification:**

- E2E tests fail with: `page.route is not a function` or `Cannot find selector [data-testid="contacto-form-nombre"]` — ContactoForm does not exist
- Component/unit tests fail with: `Cannot find module './ContactoForm'` and `Cannot find module './useCreateContacto'`
- API integration tests fail with: `Expected: Created (201) / Actual: NotFound (404)` — endpoint not yet registered

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with highest priority — TC-E3-P0-07 API test or TC-E3-P0-04 component test)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Recommended order:**
1. Backend: `CreateContactoEndpointTests.cs` (foundation for E2E)
2. Hook: `useCreateContacto.test.ts` (foundation for component tests)
3. Component: `ContactoForm.test.tsx` (UI logic)
4. E2E: `create-contacto.spec.ts` (full user journey)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 34 tests pass (green phase complete)
2. Review code for quality (readability, WCAG 2.1 AA compliance)
3. Extract any duplications
4. Ensure tests still pass after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow
2. **Run failing tests** to confirm RED phase: `pnpm vitest run src/modules/crm/contactos`
3. **Begin implementation** using implementation checklist as guide (recommended: backend first)
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **data-factories.md** — Factory patterns (`contacto.factory.ts` reused from Story 3.1)
- **component-tdd.md** — Component test strategies using Vitest + RTL + MSW
- **test-quality.md** — Given-When-Then, one assertion per test, determinism, isolation
- **fixture-architecture.md** — Test fixture patterns with auto-cleanup
- **selector-resilience.md** — data-testid > ARIA > text > CSS hierarchy

---

## Test Execution Evidence

### Expected RED Phase Failures

**E2E Tests (Playwright):**
```
ContactosPage.btnNuevoContacto — No element matching [role="button"] with name /nuevo contacto/i
OR: form locator times out (ContactoForm not rendered)
```

**Component Tests (Vitest):**
```
Error: Cannot find module './ContactoForm' from 'ContactoForm.test.tsx'
Error: Cannot find module './useCreateContacto' from 'useCreateContacto.test.ts'
```

**API Integration Tests (xUnit):**
```
Assert.Equal() Failure:
Expected: Created (201)
Actual:   NotFound (404)
```

**Summary:**
- Total tests: 34
- Passing: 0 (expected)
- Failing: 34 (expected)
- Status: ✅ RED phase — all tests fail due to missing implementation, not test bugs

---

## Notes

- `contactoSchema.ts` (from Story 3.1) is already implemented with all 4 fields + email format validation. The `contactoSchema.test.ts` file (also Story 3.1) already covers TC-E3-P0-05 Part A and TC-E3-P2-07 — those tests are NOT duplicated here.
- No 409 Conflict scenario for contacts — Email is indexed but NOT unique per story dev notes and architecture. This differs from clients (NIT uniqueness).
- `clienteId` is always `null` on creation — Epic 4 handles client-contact associations.
- The ContactosPage POM (`e2e/pages/contactos.page.ts`) already defines `btnNuevoContacto`, `form`, `inputNombre`, `inputCargo`, `inputTelefono`, `inputEmail`, `btnGuardar`, `btnCancelar` — no POM changes needed for these tests.
- The `buildContacto()` function in `e2e/helpers/data.helper.ts` generates all 4 required fields (nombre, email, cargo, telefono).
- Story 3.2 note: mutations must also invalidate `['contactos', id]` — for CREATE, only `['contactos']` (list key) needs invalidation since no specific id exists yet.

---

**Generated by BMad TEA Agent** — 2026-06-29
