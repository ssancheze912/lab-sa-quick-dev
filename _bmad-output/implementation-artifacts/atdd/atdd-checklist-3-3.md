# ATDD Checklist — Epic 3, Story 3.3: Create Contact

**Date:** 2026-05-21
**Story:** 3.3 — Create Contact
**Epic:** 3 — Contact Management
**Primary Test Level:** E2E + API + Unit (Frontend + Backend)
**Phase:** RED (failing tests written; implementation not yet started)

---

## Story Summary

**As a** commercial team member,
**I want** to register a new contact by filling in a form,
**So that** the contact is available in the system immediately for the whole team.

---

## Acceptance Criteria

1. **AC1** — Given the user is on the `/contactos` view, When the user clicks "Nuevo contacto", Then a dialog form opens with four fields: Nombre, Cargo, Teléfono, Email — all required (FR9).

2. **AC2** — Given the user fills all required fields and clicks "Guardar", When the form is submitted, Then the contact is created via `POST /api/v1/contactos`, the dialog closes, the new contact appears in the contact list immediately without a page reload (FR27), and a toast displays "Contacto creado correctamente".

3. **AC3** — Given the user clicks "Guardar" with one or more required fields empty, When the Zod schema validation runs on submit, Then inline error messages appear under each empty field (FR16), the form does NOT send any request to the backend, and the dialog remains open.

4. **AC4** — Given the backend returns a validation error (400), When the error is received, Then the error message is displayed clearly without exposing technical details (NFR6), and the dialog remains open.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (7 tests)

**File:** `e2e/tests/contactos/contactos-create.spec.ts`

- **Test: E2E-CT-11** — "Nuevo contacto" abre el formulario con los 4 campos requeridos visibles
  - **Priority:** P0
  - **AC:** AC1
  - **Status:** RED — `data-testid="btn-nuevo-contacto"` not rendered on `ContactoListView`; `ContactoFormDialog` component does not exist; `data-testid="contacto-form-dialog"` not rendered; `data-testid="input-nombre"`, `"input-cargo"`, `"input-telefono"`, `"input-email"` do not exist
  - **Verifies:** AC1 — After clicking "Nuevo contacto", `contacto-form-dialog` is visible and all 4 input testids are visible

- **Test: E2E-CT-12** — enviar formulario completo crea el contacto y lo muestra en la tabla sin recargar
  - **Priority:** P0
  - **AC:** AC2 (FR27)
  - **Status:** RED — `useCreateContacto` hook not implemented; `POST /api/v1/contactos` endpoint does not exist; `queryClient.invalidateQueries` not called; contact does not appear in list without reload
  - **Verifies:** AC2 (FR27) — One POST call is fired; dialog closes; new contact's nombre appears in `contacto-row` items without `page.reload()`

- **Test: E2E-CT-13** — enviar formulario vacío muestra errores inline en los 4 campos y no lanza petición POST
  - **Priority:** P0
  - **AC:** AC3 (FR16, Risk R3)
  - **Status:** RED — `contactoSchema.ts` Zod schema not implemented; `zodResolver` not wired to React Hook Form; `data-testid="error-nombre"`, `"error-cargo"`, `"error-telefono"`, `"error-email"` not rendered
  - **Verifies:** AC3 — Submitting empty form shows 4 inline errors; no POST request fires (`postFired === false`)

- **Test: E2E-CT-14** — formulario parcialmente vacío muestra errores solo en los campos vacíos
  - **Priority:** P0
  - **AC:** AC3 (FR16)
  - **Status:** RED — same as E2E-CT-13; Zod validation per-field not implemented
  - **Verifies:** AC3 — Errors appear only on empty fields (telefono, email); no error on filled fields (nombre, cargo); no POST fires

- **Test: E2E-CT-15** — toast "Contacto creado correctamente" aparece tras creación exitosa
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `useCreateContacto.onSuccess` not calling `toast.success('Contacto creado correctamente')`; `ToastContainer` may not be in the DOM; `POST /api/v1/contactos` not implemented
  - **Verifies:** AC2 — After successful form submit, text matching `/contacto creado correctamente/i` is visible in the DOM

- **Test: E2E-CT-16** — el formulario se cierra automáticamente tras una creación exitosa
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `onSuccess` callback not calling `onOpenChange(false)` and `reset()`; form does not auto-close
  - **Verifies:** AC2 — After successful submit, `contacto-form-dialog` is hidden without pressing "Cancelar"

- **Test: E2E-CT-17** — el contacto creado por el formulario tiene clienteId null (sin asociación a cliente)
  - **Priority:** P1
  - **AC:** — (Epic 3 scope boundary, Risk R7)
  - **Status:** RED — `ContactoEntity.Create()` not called from handler; `POST /api/v1/contactos` endpoint not implemented
  - **Verifies:** Contact created via form has `clienteId === null` when queried through `apiHelper.getContactos()`

---

### API Integration Tests — Playwright APIRequestContext (4 tests)

**File:** `e2e/tests/contactos/contactos-api.spec.ts` (Story 3.3 describe block: `Story 3.3 — API: POST /api/v1/contactos`)

- **Test: API-CT-01** — POST payload válido → 201 + body con UUID id, clienteId: null, createdAt ISO 8601
  - **Priority:** P0
  - **AC:** AC2
  - **Status:** RED — `POST /api/v1/contactos` endpoint not registered; `CreateContactoCommand`, `CreateContactoCommandHandler`, `CreateContactoCommandValidator` not implemented; `IContactoRepository.CreateAsync` not implemented
  - **Verifies:** AC2 — HTTP 201; body has non-empty UUID `id`; fields match payload; `clienteId` is `null`; `createdAt`/`updatedAt` match ISO 8601 with timezone; no `stackTrace` key

- **Test: API-CT-02** — POST sin nombre → 400 Problem Details sin stackTrace
  - **Priority:** P0
  - **AC:** AC3, AC4 (NFR6)
  - **Status:** RED — endpoint not registered; `CreateContactoCommandValidator.Nombre` not empty rule not implemented; `ExceptionHandlingMiddleware` ValidationException→400 mapping not tested for this domain
  - **Verifies:** AC3/AC4 (NFR6) — HTTP 400; body is object with `status: 400`; no `stackTrace` key

- **Test: API-CT-03** — POST sin email → 400 Problem Details sin stackTrace
  - **Priority:** P0
  - **AC:** AC3, AC4 (NFR6)
  - **Status:** RED — same as API-CT-02; Email validation rule not implemented
  - **Verifies:** AC3/AC4 (NFR6) — HTTP 400; body has `status: 400`; no `stackTrace` key

- **Test: API-CT-04** — POST sin cargo → 400 Problem Details sin stackTrace
  - **Priority:** P0
  - **AC:** AC3, AC4 (NFR6)
  - **Status:** RED — same as API-CT-02; Cargo validation rule not implemented
  - **Verifies:** AC3/AC4 (NFR6) — HTTP 400; body has `status: 400`; no `stackTrace` key

---

### Frontend Unit Tests — Vitest (6 tests)

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoSchema.test.ts`

- **Test: UNIT-CT-01** — rejects a payload with empty nombre and returns ZodError
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — `contactoSchema.ts` does not exist; `contactoSchema` export not available
  - **Verifies:** AC3 — `safeParse({ nombre: '' })` returns `success: false` with error on `nombre` path

- **Test: UNIT-CT-02** — rejects a payload with empty email and returns ZodError
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — same as UNIT-CT-01
  - **Verifies:** AC3 — `safeParse({ email: '' })` returns `success: false` with error on `email` path

- **Test: UNIT-CT-03** — rejects a payload with invalid email format and returns ZodError with Spanish message
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — same as UNIT-CT-01; `.email()` rule not configured
  - **Verifies:** AC3 — `safeParse({ email: 'not-an-email' })` returns `success: false`; error message is non-empty (Spanish: "El email no tiene un formato válido")

- **Test: UNIT-CT-04** — accepts a valid payload with all 4 fields and returns parsed object
  - **Priority:** P1
  - **AC:** AC1, AC2
  - **Status:** RED — `contactoSchema.ts` does not exist
  - **Verifies:** AC1/AC2 — `safeParse(validPayload)` returns `success: true`; `data` matches input values

- **Test: (Additional)** — rejects empty cargo
  - **Priority:** P1
  - **Status:** RED
  - **Verifies:** Cargo field required rule works independently

- **Test: (Additional)** — rejects empty telefono
  - **Priority:** P1
  - **Status:** RED
  - **Verifies:** Telefono field required rule works independently

---

### Backend Unit Tests — xUnit (6 tests)

#### Validators — `ContactoValidatorTests.cs`

**File:** `backend/tests/SiesaAgents.UnitTests/Validators/ContactoValidatorTests.cs`

- **Test: UNIT-B-CT-01** — Validate_EmptyNombre_ReturnsInvalidResultWithLocalizedMessage
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — `CreateContactoCommandValidator` class does not exist; `CreateContactoCommand` record not defined
  - **Verifies:** AC3 — `ValidateAsync` with empty Nombre returns `IsValid: false`; error on `Nombre` property; error message non-empty (Spanish)

- **Test: UNIT-B-CT-02** — Validate_EmptyEmail_ReturnsInvalidResult
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — same as UNIT-B-CT-01; Email validation rule not implemented
  - **Verifies:** AC3 — `ValidateAsync` with empty Email returns `IsValid: false`; error on `Email` property

- **Test: UNIT-B-CT-03** — Validate_ValidPayload_ReturnsValidResult
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — same as UNIT-B-CT-01
  - **Verifies:** AC2 — `ValidateAsync` with all 4 valid fields returns `IsValid: true`; no errors

- **Test: (Additional)** — Validate_EmptyCargo_ReturnsInvalidResult
  - **Status:** RED — Cargo rule not implemented

- **Test: (Additional)** — Validate_InvalidEmailFormat_ReturnsInvalidResult
  - **Status:** RED — `.EmailAddress()` rule not implemented

- **Test: (Additional)** — Validate_AllFieldsEmpty_ReturnsFourOrMoreErrors
  - **Status:** RED — none of the 4 rules implemented

#### Handler — `ContactoHandlerTests.cs`

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`

- **Test: UNIT-B-CT-04** — HandleAsync_ValidCommand_ReturnsDtoWithUuidIdAndNullClienteId
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `CreateContactoCommandHandler` does not exist; `IContactoRepository.CreateAsync` method not in interface; `ContactoDto` does not have `ClienteId` field or does not exist
  - **Verifies:** AC2 — Handler returns `ContactoDto` with non-empty UUID `Id` and `ClienteId == null`; all fields match command

- **Test: (Additional)** — HandleAsync_ValidCommand_InvokesRepositoryCreateAsyncOnce
  - **Status:** RED — handler does not exist

- **Test: (Additional)** — HandleAsync_ValidCommand_PassesEntityWithMatchingFieldsToRepository
  - **Status:** RED — handler does not exist

---

## Supporting Infrastructure

### Page Object Model

**File:** `e2e/pages/contactos.page.ts` — **already exists and complete for Story 3.3**

Key locators used by E2E-CT-11 to E2E-CT-17:

| Locator | Property | Selector |
|---|---|---|
| New contact button | `btnNuevoContacto` | `getByRole('button', { name: /nuevo contacto/i })` |
| Form dialog | `form` | `getByRole('dialog')` |
| Contact rows | `contactoRows` | `getByTestId('contacto-row')` |

No POM changes required for Story 3.3.

### Data Factory

**File:** `e2e/helpers/data.helper.ts` — **already exists and complete for Story 3.3**

`buildContacto(overrides?)` factory provides all 4 required fields. No changes required.

### API Helper

**File:** `e2e/helpers/api.helper.ts` — **already exists and complete for Story 3.3**

`ApiHelper.getContactos()` and `deleteContacto(id)` are used for cleanup. No changes required.

---

## Required `data-testid` Attributes

All `data-testid` attributes must be present for E2E tests to pass.

### `ContactoListView` Component

| Attribute | Element | Used By |
|---|---|---|
| `btn-nuevo-contacto` | "Nuevo contacto" `<button>` | E2E-CT-11..17 |

### `ContactoFormDialog` Component

| Attribute | Element | Condition | Used By |
|---|---|---|---|
| `contacto-form-dialog` | `Dialog.Content` | When dialog is open | E2E-CT-11..17 |
| `input-nombre` | Nombre `<input>` | Always in dialog | E2E-CT-11..17 |
| `input-cargo` | Cargo `<input>` | Always in dialog | E2E-CT-11..17 |
| `input-telefono` | Teléfono `<input>` | Always in dialog | E2E-CT-11..17 |
| `input-email` | Email `<input>` | Always in dialog | E2E-CT-11..17 |
| `btn-guardar` | "Guardar" `<button>` | Always in dialog | E2E-CT-11..17 |
| `btn-cancelar` | "Cancelar" `<button>` | Always in dialog | E2E-CT-11..17 |
| `error-nombre` | Nombre inline error `<p>` | When Nombre invalid | E2E-CT-13, 14 |
| `error-cargo` | Cargo inline error `<p>` | When Cargo invalid | E2E-CT-13, 14 |
| `error-telefono` | Teléfono inline error `<p>` | When Teléfono invalid | E2E-CT-13, 14 |
| `error-email` | Email inline error `<p>` | When Email invalid | E2E-CT-13, 14 |

---

## Mock / Intercept Strategy

| Test | Strategy | Pattern |
|---|---|---|
| E2E-CT-11 | `page.route('**/api/v1/contactos', route => route.continue())` before `goto()` | Network-first; allows GET to proceed; no POST expected |
| E2E-CT-12 | `page.route(...)` count POST calls via counter; `route.continue()` | Network-first; counts exactly 1 POST; real backend used |
| E2E-CT-13 | `page.route(...)` abort POST and set `postFired = true` before `goto()` | Network-first; intercept blocks POST; asserts `postFired === false` |
| E2E-CT-14 | Same as E2E-CT-13 | Same pattern; partial form fill |
| E2E-CT-15 | `page.route(...)` continue before `goto()` | Real backend used; asserts toast text visible |
| E2E-CT-16 | Same as E2E-CT-15 | Real backend; asserts dialog hidden after success |
| E2E-CT-17 | Same as E2E-CT-15 | Real backend; verifies `clienteId === null` via `apiHelper.getContactos()` |
| API-CT-01..04 | No mocking — direct `request.post()` | Requires backend at `http://localhost:5000` |

---

## Implementation Checklist

### Test Group: E2E-CT-11 — "Nuevo contacto" opens dialog with 4 visible required fields

**Tasks to make this test pass:**

- [ ] Task 1 (Frontend): Create `contactoSchema.ts` — Zod schema with 4 required fields + Spanish error messages
- [ ] Task 3 (Frontend): Create `ContactoFormDialog.tsx` with Radix UI Dialog, React Hook Form, `zodResolver`
- [ ] Task 3 (Frontend): Add all `data-testid` attributes: `contacto-form-dialog`, `input-nombre`, `input-cargo`, `input-telefono`, `input-email`, `btn-guardar`, `btn-cancelar`
- [ ] Task 4 (Frontend): Add `btn-nuevo-contacto` button to `ContactoListView.tsx` with `useState<boolean>` for open state
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-11"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test Group: E2E-CT-12 — Valid form creates contact and shows it in table (no reload)

**Tasks to make this test pass:**

- [ ] Depends on Tasks from E2E-CT-11 group
- [ ] Task 2 (Frontend): Create `useCreateContacto.ts` hook — `useMutation` + `mutationFn: (data) => contactoApiRepository.create(data)` + `onSuccess: queryClient.invalidateQueries + toast.success`
- [ ] Task 2 (Frontend): Add `create(data)` to `IContactoRepository.ts` interface
- [ ] Task 2 (Frontend): Implement `create()` in `contactoApiRepository.ts` — `POST /api/v1/contactos`
- [ ] Task 5 (Backend): Create `CreateContactoCommand.cs` record
- [ ] Task 5 (Backend): Create `CreateContactoCommandHandler.cs` — validates, calls `ContactoEntity.Create()`, calls `repository.CreateAsync(entity, ct)`, maps to `ContactoDto`
- [ ] Task 5 (Backend): Add `CreateAsync` to `IContactoRepository.cs` interface
- [ ] Task 5 (Backend): Implement `CreateAsync` in `ContactoRepository.cs`
- [ ] Task 7 (Backend): Add `POST /` endpoint to `ContactoEndpoints.cs` — returns `201 Created` with `ContactoDto`
- [ ] Task 5/7 (Backend): Register `CreateContactoCommandHandler` in `Program.cs` DI
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-12"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test Group: E2E-CT-13 / E2E-CT-14 — Empty / partial form shows inline errors, no POST fires

**Tasks to make this test pass:**

- [ ] Depends on Task 1 (contactoSchema.ts) from E2E-CT-11 group
- [ ] Depends on Task 3 (ContactoFormDialog with zodResolver) from E2E-CT-11 group
- [ ] Verify `data-testid="error-nombre"`, `"error-cargo"`, `"error-telefono"`, `"error-email"` are conditionally rendered by React Hook Form `errors` object
- [ ] Verify inline error `<p role="alert">` elements are only rendered when field has an error
- [ ] Run tests: `npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-13"`
- [ ] Run tests: `npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-14"`
- [ ] ✅ Both tests pass (green phase)

**Estimated Effort:** 1 hour (blocked by CT-11 tasks)

---

### Test Group: E2E-CT-15 / E2E-CT-16 / E2E-CT-17 — Toast, auto-close, clienteId = null

**Tasks to make this test pass:**

- [ ] Depends on ALL tasks from E2E-CT-12 group
- [ ] Verify `useCreateContacto.onSuccess` calls `toast.success('Contacto creado correctamente')` (using existing `toastStore.ts` from Story 2.3)
- [ ] Verify `onSuccess` callback in `ContactoFormDialog` calls `reset()` then `onOpenChange(false)`
- [ ] Verify `ContactoEntity.Create()` factory sets `ClienteId = null`
- [ ] Run tests: `npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-15"`
- [ ] Run tests: `npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-16"`
- [ ] Run tests: `npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-17"`
- [ ] ✅ All three tests pass (green phase)

**Estimated Effort:** 0.5 hours (blocked by CT-12 tasks)

---

### Test Group: API-CT-01..04 — POST endpoint validation and 201/400 responses

**Tasks to make these tests pass:**

- [ ] Depends on ALL backend tasks from E2E-CT-12 group
- [ ] Task 6 (Backend): Create `CreateContactoCommandValidator.cs` — 4 fields, Spanish messages, email format rule
- [ ] Task 6 (Backend): Register validator as `IValidator<CreateContactoCommand>` in DI
- [ ] Task 7 (Backend): Endpoint returns `201 Created` with `ContactoDto` including `clienteId: null` and ISO 8601 `createdAt`/`updatedAt`
- [ ] Task 7 (Backend): Endpoint returns `400 Problem Details` on `ValidationException` (via existing `ExceptionHandlingMiddleware`)
- [ ] Verify `ExceptionHandlingMiddleware` strips `stackTrace` from all error responses (NFR6)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "Story 3.3"`
- [ ] ✅ All 4 API tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: UNIT-CT-01..04 — Zod schema unit tests (Vitest)

**Tasks to make these tests pass:**

- [ ] Task 1 (Frontend): Create `contactoSchema.ts` with `z.object({ nombre, cargo, telefono, email })` + Spanish error messages
- [ ] Export `ContactoFormValues` type: `export type ContactoFormValues = z.infer<typeof contactoSchema>`
- [ ] Run tests: `npx vitest run frontend/src/modules/crm/contactos/__tests__/contactoSchema.test.ts`
- [ ] ✅ All 6 unit tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: UNIT-B-CT-01..04 — Backend validator and handler unit tests (xUnit)

**Tasks to make these tests pass:**

- [ ] Task 5 (Backend): Create `CreateContactoCommand.cs` — record with `Nombre`, `Cargo`, `Telefono`, `Email`
- [ ] Task 6 (Backend): Create `CreateContactoCommandValidator.cs` — FluentValidation rules for all 4 fields
- [ ] Task 5 (Backend): Create `CreateContactoCommandHandler.cs` — validates, creates entity, calls `CreateAsync`, maps to `ContactoDto`
- [ ] Task 5 (Backend): Add `CreateAsync(ContactoEntity entity, CancellationToken ct): Task<ContactoEntity>` to `IContactoRepository` interface
- [ ] Verify `ContactoDto` includes `ClienteId` field (nullable `Guid?`)
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~ContactoValidatorTests"`
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~ContactoHandlerTests"`
- [ ] ✅ All 9 backend unit tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 3.3 E2E tests
npx playwright test e2e/tests/contactos/contactos-create.spec.ts

# Run Story 3.3 API integration tests only
npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "Story 3.3"

# Run all Story 3.3 tests at once
npx playwright test e2e/tests/contactos/contactos-create.spec.ts e2e/tests/contactos/contactos-api.spec.ts

# Run a specific E2E test by ID
npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-11"
npx playwright test e2e/tests/contactos/contactos-create.spec.ts --grep "E2E-CT-13"

# Run frontend unit tests (Vitest)
npx vitest run frontend/src/modules/crm/contactos/__tests__/contactoSchema.test.ts

# Run backend unit tests (xUnit)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~ContactoValidatorTests"
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~ContactoHandlerTests"

# Run all backend unit tests for contactos domain
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~Contacto"

# Run in headed mode for debugging E2E
npx playwright test e2e/tests/contactos/contactos-create.spec.ts --headed
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All 23 tests are written in failing state. Expected failure reasons before implementation:

- **E2E-CT-11**: `btnNuevoContacto` (`btn-nuevo-contacto`) not in DOM → `toBeVisible()` timeout
- **E2E-CT-12**: `POST /api/v1/contactos` → 404 (endpoint not registered); new contact does not appear in list
- **E2E-CT-13**: `btn-guardar` click fires no POST (form doesn't exist); `error-nombre` testid not in DOM → timeout
- **E2E-CT-14**: Same as CT-13 for per-field error assertions
- **E2E-CT-15**: `page.getByText(/contacto creado correctamente/i)` → element not found (toast not shown)
- **E2E-CT-16**: `contacto-form-dialog` does not close (form does not exist)
- **E2E-CT-17**: `POST /api/v1/contactos` → 404; `created` is `undefined`; `expect(created).toBeDefined()` fails
- **API-CT-01**: `POST http://localhost:5000/api/v1/contactos` → 404 (endpoint not registered)
- **API-CT-02..04**: Same as API-CT-01; no 400 validation response available
- **UNIT-CT-01..04**: `import { contactoSchema } from '../application/contactoSchema'` → module not found
- **UNIT-B-CT-01..03**: `using SiesaAgents.Application.Contactos.Validators` → namespace not found
- **UNIT-B-CT-04**: `new CreateContactoCommandHandler(...)` → type not found; `IContactoRepository.CreateAsync` not in interface

### GREEN Phase (DEV Team — Next Steps)

Priority order to make tests pass:

1. **Frontend Task 1**: `contactoSchema.ts` — unblocks UNIT-CT-01..04
2. **Backend Task 5 + 6**: `CreateContactoCommand.cs`, `CreateContactoCommandValidator.cs` — unblocks UNIT-B-CT-01..03
3. **Backend Task 5**: `CreateContactoCommandHandler.cs` + `IContactoRepository.CreateAsync` + `ContactoRepository.CreateAsync` — unblocks UNIT-B-CT-04
4. **Backend Task 7**: `POST /api/v1/contactos` endpoint — unblocks API-CT-01..04
5. **Frontend Task 3**: `ContactoFormDialog.tsx` — unblocks E2E-CT-11, CT-13, CT-14
6. **Frontend Task 2**: `useCreateContacto.ts` + `contactoApiRepository.create()` — unblocks E2E-CT-12, CT-15, CT-16, CT-17
7. **Frontend Task 4**: `btn-nuevo-contacto` on `ContactoListView.tsx` — completes all E2E tests

### REFACTOR Phase (DEV Team — After All Tests Pass)

- Verify `queryClient.invalidateQueries({ queryKey: ['contactos'] })` is called on success (no other queryKey variants)
- Confirm `toast.success('Contacto creado correctamente')` uses existing `toastStore` — NOT sonner/react-toastify
- Confirm `ContactoFormDialog` renders `<p role="alert" data-testid="error-{field}">` only when field has error (not always)
- Verify "Guardar" button shows "Guardando..." text and `disabled` when `isPending === true`
- Confirm `onSuccess` mutate callback calls `reset()` then `onOpenChange(false)` — in that order
- Verify backend `ContactoEntity.Create()` factory sets `ClienteId = null` (no `clienteId` in `CreateContactoPayload`)
- Confirm `DateTimeOffset` used throughout backend entity (not `DateTime`)
- Verify `ExceptionHandlingMiddleware` strips `stackTrace` from all 400 responses

---

## Coverage Matrix — Story 3.3

| AC | Requirement | Test(s) | Level | Status |
|---|---|---|---|---|
| AC1 | "Nuevo contacto" button opens dialog with 4 required fields | E2E-CT-11 | E2E (P0) | RED |
| AC2 | Valid form → POST → dialog closes → contact appears immediately (FR27) | E2E-CT-12, API-CT-01 | E2E + API (P0) | RED |
| AC2 | Toast "Contacto creado correctamente" on success | E2E-CT-15 | E2E (P1) | RED |
| AC2 | Dialog auto-closes on success | E2E-CT-16 | E2E (P1) | RED |
| AC3 | Empty form → inline errors on all 4 fields; no POST fires (FR16, R3) | E2E-CT-13, UNIT-CT-01..04, UNIT-B-CT-01..03 | E2E + Unit (P0/P1) | RED |
| AC3 | Partial form → errors only on empty fields | E2E-CT-14 | E2E (P0) | RED |
| AC4 | Backend 400 → error shown without technical details (NFR6) | API-CT-02..04 | API (P0) | RED |
| — | ClienteId = null (Epic 3 scope boundary, R7) | E2E-CT-17, UNIT-B-CT-04 | E2E + Unit (P1) | RED |

**Coverage: All 4 AC requirements + NFR6 + Risk R2 + R3 + R7 addressed — 100%**

---

## Notes

- Story 3.3 mirrors the pattern of Story 2.3 (Create Client). Reference `e2e/tests/clientes/clientes-create.spec.ts` for analogous tests already green.
- E2E-CT-13 registers the POST interceptor BEFORE `contactosPage.goto()` — this order is intentional (network-first pattern) to prevent any race condition where POST fires during navigation.
- The `ExceptionHandlingMiddleware` from Story 2.3 already maps `ValidationException → 400 Problem Details` — no new middleware is required. Only `CreateContactoCommandHandler` must throw `ValidationException(result.Errors)`.
- `toastStore.ts` and `ToastContainer.tsx` are already established from Story 2.3 — do NOT add sonner/react-toastify.
- `queryClient.invalidateQueries({ queryKey: ['contactos'] })` — the queryKey must be the exact array `['contactos']` matching the `useContactos` hook from Story 3.1.
- `ContactoFormDialog` must call `reset()` BEFORE `onOpenChange(false)` to ensure the form is clean before it hides (prevents stale state flicker).

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-21
