# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-14
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + API Integration (Playwright) + E2E (Playwright)

---

## Story Summary

Story 2.3 enables the commercial team to register new clients via a Dialog/modal form triggered by a "Nuevo cliente" button in the left panel of the `/clientes` route. The form has four required fields (Nombre, NIT/RUC, Teléfono, Ciudad) validated by Zod on the frontend and FluentValidation on the backend. A successful submission calls `POST /api/v1/clientes`, invalidates the TanStack Query cache so the list updates immediately (FR27), and displays a success toast. Duplicate NIT/RUC submissions return a 409 Conflict that surfaces as an inline field error, not a generic toast.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **AC#1** — Given the user is on `/clientes`, When the user clicks "Nuevo cliente", Then a Dialog opens with four required fields: Nombre, NIT/RUC, Teléfono, Ciudad.
2. **AC#2** — Given the user fills all required fields and clicks "Guardar", When the form is submitted, Then the client is created via `POST /api/v1/clientes`, the list updates immediately (`invalidateQueries(['clientes'])`), and a success toast "Cliente creado correctamente" displays.
3. **AC#3** — Given the user submits with one or more required fields empty, When Zod validation runs, Then clear inline error messages appear under each empty field and no API call is made.
4. **AC#4** — Given the user submits a NIT/RUC that already exists, When the backend returns 409 Conflict, Then an inline error "El NIT/RUC ya está registrado" appears on the NIT/RUC field and no technical details are exposed (NFR6).
5. **AC#5** — Given the form is open, When the user clicks "Cancelar", Then the form closes and no API call is made.

---

## Failing Tests Created (RED Phase)

### E2E Tests (15 tests)

**File:** `/home/user/lab-sa-quick-dev/e2e/tests/clientes/story-2-3-create-client.spec.ts`

- RED — **Test:** `AC#1 — "Nuevo cliente" button should be visible on /clientes page`
  - **Status:** RED — Element `[data-testid="btn-nuevo-cliente"]` does not exist (component not implemented)
  - **Verifies:** AC#1 — Trigger button presence

- RED — **Test:** `AC#1 — clicking "Nuevo cliente" opens a Dialog/modal`
  - **Status:** RED — No dialog rendered (Dialog integration not implemented)
  - **Verifies:** AC#1 — Dialog opens on click

- RED — **Test:** `AC#1 — dialog title should be "Nuevo cliente"`
  - **Status:** RED — Dialog and DialogTitle not implemented
  - **Verifies:** AC#1 — Dialog title text

- RED — **Test:** `AC#1 — dialog contains Nombre field`
  - **Status:** RED — `[data-testid="input-nombre"]` not in DOM
  - **Verifies:** AC#1 — Nombre field in dialog

- RED — **Test:** `AC#1 — dialog contains NIT/RUC field`
  - **Status:** RED — `[data-testid="input-nit"]` not in DOM
  - **Verifies:** AC#1 — NIT field in dialog

- RED — **Test:** `AC#1 — dialog contains Teléfono field`
  - **Status:** RED — `[data-testid="input-telefono"]` not in DOM
  - **Verifies:** AC#1 — Teléfono field in dialog

- RED — **Test:** `AC#1 — dialog contains Ciudad field`
  - **Status:** RED — `[data-testid="input-ciudad"]` not in DOM
  - **Verifies:** AC#1 — Ciudad field in dialog

- RED — **Test:** `AC#2 — TC-E2-P1-14: valid form submission creates client and shows success toast`
  - **Status:** RED — ClienteForm, useCreateCliente, POST endpoint all missing
  - **Verifies:** TC-E2-P1-14 full create flow — toast + list update

- RED — **Test:** `AC#2 — dialog closes after successful submission`
  - **Status:** RED — Dialog/form not implemented
  - **Verifies:** AC#2 — Dialog closes on success (onSuccess callback)

- RED — **Test:** `AC#3 — submitting empty form shows inline error for Nombre field`
  - **Status:** RED — ClienteForm + Zod validation not implemented
  - **Verifies:** AC#3 — Nombre inline error

- RED — **Test:** `AC#3 — submitting empty form shows inline error for NIT/RUC field`
  - **Status:** RED — ClienteForm + Zod validation not implemented
  - **Verifies:** AC#3 — NIT/RUC inline error

- RED — **Test:** `AC#3 — submitting empty form shows inline error for Teléfono field`
  - **Status:** RED — ClienteForm + Zod validation not implemented
  - **Verifies:** AC#3 — Teléfono inline error

- RED — **Test:** `AC#3 — submitting empty form shows inline error for Ciudad field`
  - **Status:** RED — ClienteForm + Zod validation not implemented
  - **Verifies:** AC#3 — Ciudad inline error

- RED — **Test:** `AC#4 — submitting duplicate NIT shows inline error "El NIT/RUC ya está registrado"`
  - **Status:** RED — useCreateCliente 409 handling + form.setError not implemented
  - **Verifies:** AC#4 — 409 maps to NIT field error (NFR6 compliance)

- RED — **Test:** `AC#5 — clicking "Cancelar" closes the dialog`
  - **Status:** RED — Cancelar button not implemented
  - **Verifies:** AC#5 — Cancel closes dialog

- RED — **Test:** `AC#5 — clicking "Cancelar" does not create any client`
  - **Status:** RED — Cancel button doesn't exist; no guard against POST
  - **Verifies:** AC#5 — No POST on cancel

### API Integration Tests (13 tests)

**File:** `/home/user/lab-sa-quick-dev/e2e/tests/api/create-client.api.spec.ts`

- RED — **Test:** `AC#2 — should return 201 Created with new client body (TC-E2-P1-02)`
  - **Status:** RED — POST endpoint does not exist
  - **Verifies:** TC-E2-P1-02 — HTTP 201 response contract

- RED — **Test:** `AC#2 — should return Location header pointing to the new client (TC-E2-P1-02)`
  - **Status:** RED — POST endpoint missing
  - **Verifies:** TC-E2-P1-02 — Location header format

- RED — **Test:** `AC#2 — POST then GET should confirm client was persisted`
  - **Status:** RED — POST endpoint missing
  - **Verifies:** TC-E2-P1-02 — Persistence verified via GET

- RED — **Test:** `AC#2 — response includes createdAt and updatedAt timestamps`
  - **Status:** RED — POST endpoint missing
  - **Verifies:** AC#2 — Response contract (createdAt, updatedAt)

- RED — **Test:** `AC#4 — should return 409 Conflict when NIT already exists (TC-E2-P0-01)`
  - **Status:** RED — NitExistsAsync check and 409 handling not implemented
  - **Verifies:** TC-E2-P0-01 — NIT uniqueness enforced (R1)

- RED — **Test:** `AC#4 — 409 response should have Content-Type application/problem+json (TC-E2-P0-01)`
  - **Status:** RED — ExceptionHandlingMiddleware 409 mapping not implemented
  - **Verifies:** TC-E2-P0-01 — Problem Details content type

- RED — **Test:** `AC#4 — 409 response should NOT contain stack trace (NFR6, TC-E2-P0-01)`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** TC-E2-P0-01 — NFR6 compliance (no stack traces)

- RED — **Test:** `AC#4 — 409 response should NOT create a duplicate client record`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** TC-E2-P0-01 — Data integrity on 409

- RED — **Test:** `AC#3 — POST without nombre should return 400 Bad Request (TC-E2-P0-02)`
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** TC-E2-P0-02 — Nombre required (R4)

- RED — **Test:** `AC#3 — POST without nit should return 400 Bad Request (TC-E2-P0-02)`
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** TC-E2-P0-02 — NIT required (R4)

- RED — **Test:** `AC#3 — POST without telefono should return 400 Bad Request (TC-E2-P0-02)`
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** TC-E2-P0-02 — Teléfono required (R4)

- RED — **Test:** `AC#3 — POST without ciudad should return 400 Bad Request (TC-E2-P0-02)`
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** TC-E2-P0-02 — Ciudad required (R4)

- RED — **Test:** `AC#3 — 400 response should NOT expose stack trace (NFR6, TC-E2-P0-02)`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** TC-E2-P0-02 — NFR6 compliance on 400

### Component Tests (22 tests)

**File:** `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`

- RED — `submit_WithAllValidFields_CallsOnSuccess` — Verifies AC#2 happy path
- RED — `submit_WithAllValidFields_MakesPOSTRequest` — Verifies AC#2 POST call made
- RED — `submit_WhilePending_RendersGuardandoText` — Verifies AC#2 loading state / isPending
- RED — `submit_WithAllFieldsEmpty_ShowsInlineErrorForNombre` — Verifies AC#3 / TC-E2-P0-04
- RED — `submit_WithAllFieldsEmpty_ShowsInlineErrorForNit` — Verifies AC#3 / TC-E2-P0-04
- RED — `submit_WithAllFieldsEmpty_ShowsInlineErrorForTelefono` — Verifies AC#3 / TC-E2-P0-04
- RED — `submit_WithAllFieldsEmpty_ShowsInlineErrorForCiudad` — Verifies AC#3 / TC-E2-P0-04
- RED — `submit_WithOnlyNombreEmpty_ShowsNombreErrorOnly` — Verifies AC#3 (isolated field)
- RED — `submit_WithOnlyNitEmpty_ShowsNitErrorOnly` — Verifies AC#3 (isolated field)
- RED — `submit_WithOnlyTelefonoEmpty_ShowsTelefonoErrorOnly` — Verifies AC#3 (isolated field)
- RED — `submit_WithOnlyCiudadEmpty_ShowsCiudadErrorOnly` — Verifies AC#3 (isolated field)
- RED — `submit_WithEmptyFields_InlineErrorHasRoleAlert` — Verifies WCAG 2.1 AA (role="alert")
- RED — `submit_WithDuplicateNit_ShowsInlineNitError` — Verifies AC#4 / TC-E2-P0-01 frontend
- RED — `submit_WithDuplicateNit_DoesNotShowGenericToastError` — Verifies AC#4 (no generic toast for 409)
- RED — `submit_WithDuplicateNit_DoesNotExposeTechnicalDetails` — Verifies AC#4 NFR6
- RED — `clickCancel_CallsOnCancel` — Verifies AC#5
- RED — `clickCancel_WithFilledFields_DoesNotMakeApiCall` — Verifies AC#5 (no POST)
- RED — `clickCancel_CancelButtonHasTypeButton` — Verifies AC#5 (button type)
- RED — `inputs have id matching label htmlFor` — Verifies WCAG 2.1 AA
- RED — `inputs have aria-invalid=false when no error` — Verifies WCAG 2.1 AA
- RED — `inputs have aria-invalid=true when field has error` — Verifies WCAG 2.1 AA
- RED — Structure: form/button/input data-testid checks (4 tests grouped)

### Unit Tests (12 tests)

**File:** `/home/user/lab-sa-quick-dev/frontend/src/modules/crm/clientes/application/__tests__/clienteSchema.test.ts`

- RED — `parse_WithAllValidFields_Succeeds` — Verifies AC#2/AC#3 schema happy path
- RED — `parse_WithAllValidFields_ReturnsTypedObject` — Verifies typed output
- RED — `parse_WithEmptyNombre_FailsWithSpanishMessage` — Verifies AC#3 Spanish error message
- RED — `parse_WithNullNombre_Fails` — Verifies AC#3 absent field
- RED — `parse_WithEmptyNit_FailsWithSpanishMessage` — Verifies AC#3 / TC-E2-P3-04
- RED — `parse_WithNullNit_Fails` — Verifies AC#3 absent NIT
- RED — `parse_WithEmptyTelefono_FailsWithSpanishMessage` — Verifies AC#3 Spanish error
- RED — `parse_WithNullTelefono_Fails` — Verifies AC#3 absent field
- RED — `parse_WithEmptyCiudad_FailsWithSpanishMessage` — Verifies AC#3 Spanish error
- RED — `parse_WithNullCiudad_Fails` — Verifies AC#3 absent field
- RED — `parse_WithAllFieldsEmpty_FailsWithFourErrors` — Verifies all 4 errors simultaneously

---

## Data Factories Used

### Cliente Factory

**File:** `/home/user/lab-sa-quick-dev/frontend/src/test/factories/cliente.factory.ts` (existing)
**Exports:**
- `createCliente(overrides?)` — Creates single client with optional overrides
- `createClientes(count, overrides?)` — Creates array of clients
- `resetClienteFactory()` — Resets counter (call in afterEach for determinism)

### E2E Data Helper

**File:** `/home/user/lab-sa-quick-dev/e2e/helpers/data.helper.ts` (existing)
**Exports:**
- `buildCliente(overrides?)` — Builds unique payload for E2E API seeding

---

## Fixtures Used

### Base Fixture (E2E)

**File:** `/home/user/lab-sa-quick-dev/e2e/fixtures/base.fixture.ts` (existing)
- Provides `clientesPage` and `contactosPage` pre-navigation fixtures
- Auto-cleanup via `test.afterEach`

### API Helper (E2E)

**File:** `/home/user/lab-sa-quick-dev/e2e/helpers/api.helper.ts` (existing)
- `createCliente(data)` — Seeds clients via REST API
- `deleteCliente(id)` — Cleanup via REST API
- `getClientes()` — Verify list state

---

## Mock Requirements

### POST /api/v1/clientes — Happy Path (201 Created)

**Used in:** Component tests (ClienteForm.test.tsx)
**Response:**
```json
{
  "id": "new-uuid-2-3",
  "nombre": "Empresa Test",
  "nit": "123456789-0",
  "telefono": "3001234567",
  "ciudad": "Cali",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```
**Notes:** MSW intercepts at `http://localhost:5000/api/v1/clientes` (network-first, before render)

### POST /api/v1/clientes — 409 Conflict (Duplicate NIT)

**Used in:** Component tests (AC#4 scenarios)
**Response:**
```json
{
  "title": "El NIT/RUC ya está registrado.",
  "status": 409
}
```
**Notes:** Response does NOT include stack trace or internal details (NFR6)

### POST /api/v1/clientes — Should NOT be called

**Used in:** AC#3 (empty field validation) and AC#5 (cancel) scenarios
**Behavior:** MSW handler throws an error if called — test fails with clear message

---

## Required data-testid Attributes

### ClienteForm Component

- `cliente-form` — The `<form>` element
- `input-nombre` — Nombre text input
- `input-nit` — NIT/RUC text input
- `input-telefono` — Teléfono text input
- `input-ciudad` — Ciudad text input
- `btn-guardar` — Submit button (`type="submit"`)
- `btn-cancelar` — Cancel button (`type="button"`)

### ClienteListView / clientes.tsx Route

- `btn-nuevo-cliente` — "Nuevo cliente" trigger button in the left panel header

**Implementation Example:**
```tsx
<form data-testid="cliente-form" ...>
  <input data-testid="input-nombre" id="nombre" type="text" ... />
  <input data-testid="input-nit" id="nit" type="text" ... />
  <input data-testid="input-telefono" id="telefono" type="text" ... />
  <input data-testid="input-ciudad" id="ciudad" type="text" ... />
  <button data-testid="btn-cancelar" type="button">Cancelar</button>
  <button data-testid="btn-guardar" type="submit">Guardar</button>
</form>

<button data-testid="btn-nuevo-cliente">Nuevo cliente</button>
```

---

## Implementation Checklist

### Test: `submit_WithAllValidFields_CallsOnSuccess` (TC-E2-P1-09, AC#2)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — Zod schema with 4 required fields
- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` — TanStack Query `useMutation`
- [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — add `create()` method
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — React Hook Form + zodResolver
- [ ] Add `data-testid` attributes: `cliente-form`, `input-nombre`, `input-nit`, `input-telefono`, `input-ciudad`, `btn-guardar`, `btn-cancelar`
- [ ] Wire `mutate(values, { onSuccess: () => { toast.success(...); onSuccess?.(); } })`
- [ ] Run test: `cd frontend && pnpm test src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: `submit_WithAllFieldsEmpty_ShowsInlineErrorFor*` (TC-E2-P0-04, AC#3)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Verify `clienteSchema` has `z.string().min(1, 'El nombre es requerido')` for all 4 fields
- [ ] Verify `ClienteForm` uses `resolver: zodResolver(clienteSchema)` in `useForm()`
- [ ] Ensure `form.formState.errors.*` renders inline `<p role="alert" id="*-error">` elements
- [ ] Ensure `aria-invalid={!!form.formState.errors.*}` on each input
- [ ] Run test: `cd frontend && pnpm test src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (part of Task 4 + Task 1)

---

### Test: `submit_WithDuplicateNit_ShowsInlineNitError` (TC-E2-P0-01 frontend, AC#4)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] In `clienteApiRepository.create()`: catch Axios 409, throw `new Error('El NIT/RUC ya está registrado')`
- [ ] In `ClienteForm.onSubmit` `onError`: if `error.message === 'El NIT/RUC ya está registrado'` → `form.setError('nit', { message: 'El NIT/RUC ya está registrado' })`
- [ ] In `ClienteForm`: render `{form.formState.errors.nit?.message}` in the NIT field's `<p role="alert">`
- [ ] Run test: `cd frontend && pnpm test src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (part of Task 2 + Task 4)

---

### Test: `clickCancel_CallsOnCancel` (AC#5)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] In `ClienteForm`: add `<button type="button" data-testid="btn-cancelar" onClick={onCancel}>Cancelar</button>`
- [ ] Run test: `cd frontend && pnpm test src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (part of Task 4)

---

### Test: `parse_WithEmptyNombre_FailsWithSpanishMessage` (AC#3, Unit)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/clienteSchema.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` with exact messages:
  - `nombre: z.string().min(1, 'El nombre es requerido')`
  - `nit: z.string().min(1, 'El NIT/RUC es requerido')`
  - `telefono: z.string().min(1, 'El teléfono es requerido')`
  - `ciudad: z.string().min(1, 'La ciudad es requerida')`
- [ ] Run test: `cd frontend && pnpm test src/modules/crm/clientes/application/__tests__/clienteSchema.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (Task 1)

---

### Test: `AC#2 — should return 201 Created with new client body` (TC-E2-P1-02, API)

**File:** `e2e/tests/api/create-client.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- [ ] Add `POST /api/v1/clientes` endpoint to `ClienteEndpoints.cs`
- [ ] Register `CreateClienteRequestValidator` in `Program.cs`
- [ ] Implement `IClienteRepository.AddAsync` in `ClienteRepository.cs`
- [ ] Run test: `cd /home/user/lab-sa-quick-dev && pnpm exec playwright test e2e/tests/api/create-client.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours (Tasks 6, 7, 8)

---

### Test: `AC#4 — should return 409 Conflict when NIT already exists` (TC-E2-P0-01, API)

**File:** `e2e/tests/api/create-client.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement `IClienteRepository.NitExistsAsync(nit, ct)` in `ClienteRepository.cs`
- [ ] In `CreateClienteCommandHandler.HandleAsync`: check `NitExistsAsync`, throw `InvalidOperationException("El NIT/RUC ya está registrado.")`
- [ ] Verify `ExceptionHandlingMiddleware` (Story 1.1) maps `InvalidOperationException` → 409 Problem Details
- [ ] Confirm response body does NOT include stack trace (NFR6)
- [ ] Run test: `cd /home/user/lab-sa-quick-dev && pnpm exec playwright test e2e/tests/api/create-client.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours (part of Task 7)

---

### Test: `AC#3 — POST without nombre should return 400` (TC-E2-P0-02, API)

**File:** `e2e/tests/api/create-client.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement `CreateClienteRequestValidator.cs` with all 4 FluentValidation rules
- [ ] In POST endpoint: call `validator.ValidateAsync(request, ct)` and return `Results.ValidationProblem(...)` on invalid
- [ ] Verify 400 response has `Content-Type: application/problem+json`
- [ ] Verify error body identifies missing field name
- [ ] Run test: `cd /home/user/lab-sa-quick-dev && pnpm exec playwright test e2e/tests/api/create-client.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours (part of Task 6 + 8)

---

### Test: E2E — `AC#2 TC-E2-P1-14: full create client flow` (E2E, AC#1+#2)

**File:** `e2e/tests/clientes/story-2-3-create-client.spec.ts`

**Tasks to make this test pass:**

- [ ] Add "Nuevo cliente" button with `data-testid="btn-nuevo-cliente"` to ClienteListView or clientes.tsx route
- [ ] Add `useState<boolean>(false)` for `isCreateOpen` in `clientes.tsx`
- [ ] Wrap `<ClienteForm>` in shadcn/ui `<Dialog>` with `open={isCreateOpen}` and `<DialogTitle>Nuevo cliente</DialogTitle>`
- [ ] Wire `onSuccess={() => setIsCreateOpen(false)}` and `onCancel={() => setIsCreateOpen(false)}`
- [ ] Implement `useCreateCliente` with `onSuccess: queryClient.invalidateQueries(['clientes']) + toast.success('Cliente creado correctamente')`
- [ ] Run test: `cd /home/user/lab-sa-quick-dev && pnpm exec playwright test e2e/tests/clientes/story-2-3-create-client.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours (Task 3 + Task 5)

---

## Running Tests

```bash
# Run all unit tests for Story 2.3 (clienteSchema)
cd frontend && pnpm test src/modules/crm/clientes/application/__tests__/clienteSchema.test.ts

# Run all component tests for Story 2.3 (ClienteForm)
cd frontend && pnpm test src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx

# Run all Story 2.3 component + unit tests together
cd frontend && pnpm test -- --testPathPattern="2-3|clienteSchema|ClienteForm"

# Run all frontend tests
cd frontend && pnpm test

# Run API integration tests for Story 2.3
pnpm exec playwright test e2e/tests/api/create-client.api.spec.ts

# Run E2E tests for Story 2.3
pnpm exec playwright test e2e/tests/clientes/story-2-3-create-client.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/story-2-3-create-client.spec.ts --headed

# Debug a specific E2E test
pnpm exec playwright test e2e/tests/clientes/story-2-3-create-client.spec.ts --debug

# Run all Story 2.3 tests (API + E2E)
pnpm exec playwright test --grep "Story 2.3"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (62 total tests across 4 files)
- ✅ Fixtures and factories reused from existing infrastructure (no new factories needed)
- ✅ Mock requirements documented for DEV team
- ✅ data-testid requirements listed
- ✅ Implementation checklist created with clear task-to-test mapping

**Verification:**

- All tests fail because implementations do not exist yet
- Unit tests fail: `clienteSchema.ts` module not found
- Component tests fail: `ClienteForm.tsx` module not found
- API tests fail: POST endpoint returns 404 or 405
- E2E tests fail: `data-testid="btn-nuevo-cliente"` not found in DOM

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with unit schema tests — fastest feedback)
2. **Implement `clienteSchema.ts`** → run unit tests → confirm green
3. **Implement `useCreateCliente.ts` + `clienteApiRepository.create()`** → run unit tests → confirm green
4. **Implement `ClienteForm.tsx`** → run component tests → confirm green
5. **Implement backend** (DTO → Validator → Command → Handler → Endpoint) → run API tests → confirm green
6. **Integrate Dialog** in `clientes.tsx` → run E2E tests → confirm green

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 62 tests pass (green phase complete)
2. Extract shared MSW handlers to a common test setup if reused across story 2.4
3. Ensure error messages match exactly (Spanish, no trailing period mismatch)
4. Optimize `useCreateCliente` `onError` to avoid unnecessary renders
5. Ensure tests still pass after each refactor

---

## Next Steps

1. **Review this checklist** before starting Story 2.3 implementation
2. **Run failing tests** to confirm RED phase: `cd frontend && pnpm test`
3. **Begin implementation** using implementation checklist — start with `clienteSchema.ts`
4. **Work one test at a time** (unit → component → API → E2E)
5. **When all tests pass**, mark story as done and run traceability workflow

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Reused existing base.fixture.ts and ApiHelper; afterEach cleanup pattern
- **data-factories.md** — Reused existing `createCliente` factory and `buildCliente` E2E helper
- **component-tdd.md** — React Hook Form + MSW component test structure
- **network-first.md** — MSW server.listen() called before render (not after); route interception before page.goto()
- **test-quality.md** — One assertion per test, Given-When-Then format, Spanish error message literals
- **selector-resilience.md** — `data-testid` selectors exclusively (no CSS class selectors)
- **test-levels-framework.md** — P0: unit+API; P1: component+E2E; primary level is Component

---

**Generated by BMad TEA Agent** — 2026-06-14
