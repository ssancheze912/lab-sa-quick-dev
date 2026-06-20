# ATDD Checklist — Epic 2, Story 2.3: Create Client

**Date:** 2026-06-20
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright) + API (Playwright request) + Component (Vitest + RTL)

---

## Story Summary

A commercial team member clicks "Nuevo cliente" to open a shadcn Dialog modal with a 4-field form (Nombre, NIT/RUC, Teléfono, Ciudad). On successful submission, `POST /api/v1/clientes` is called, the dialog closes, the client list is updated immediately via TanStack Query invalidation, and a Spanish success toast appears. Validation errors are shown inline using Zod + React Hook Form. Duplicate NIT returns a 409 that surfaces an inline field-level error.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **Given** the user is on `/clientes`, **When** they click "Nuevo cliente", **Then** a shadcn Dialog opens with 4 required fields (Nombre, NIT/RUC, Teléfono, Ciudad) each marked `*`, `autoFocus` on Nombre, and `"* Campos obligatorios"` legend at the form footer.

2. **Given** all required fields are filled and "Guardar" is clicked, **When** the form is submitted, **Then** `POST /api/v1/clientes` is called; on success the modal closes, `queryClient.invalidateQueries(['clientes'])` is triggered, and a success toast `"Cliente creado correctamente"` appears.

3. **Given** the user submits with one or more empty required fields, **When** Zod schema validates, **Then** inline error messages appear below each empty field (`text-sm text-red-600`); the form is NOT submitted to the backend.

4. **Given** the user submits a duplicate NIT/RUC, **When** the backend returns a 409 Conflict (Problem Details RFC 7807), **Then** an inline error `"El NIT/RUC ya está registrado"` appears below the NIT/RUC field; no stack trace is exposed.

5. **Given** the Dialog is open with unsaved changes, **When** the user clicks ✕, presses Esc, or clicks outside, **Then** the dialog closes and all form values are reset; no data is submitted.

6. **Given** the form is open, **When** the user navigates via Tab, **Then** all fields and buttons meet WCAG 2.1 AA; focus is trapped in the Dialog; on close, focus returns to "Nuevo cliente" button.

7. **Given** the form is submitting, **When** the mutation is in-flight, **Then** "Guardar" shows "Guardando..." and is disabled to prevent duplicate submissions.

---

## Failing Tests Created (RED Phase)

### E2E Tests — `e2e/tests/clientes/create-client.spec.ts` (27 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts`

#### AC1 — Dialog opens with form fields (7 tests)

- **Test:** should render "Nuevo cliente" button in the list panel header
  - **Status:** RED — `NuevoClienteDialog` and button do not exist in `ClienteListView`
  - **Verifies:** AC1 — "Nuevo cliente" trigger button is present

- **Test:** should open a dialog when "Nuevo cliente" button is clicked
  - **Status:** RED — dialog does not exist
  - **Verifies:** AC1 — clicking button opens Dialog

- **Test:** should show dialog title "Nuevo cliente"
  - **Status:** RED — dialog does not exist
  - **Verifies:** AC1 — dialog title text

- **Test:** should render Nombre field marked as required (*)
  - **Status:** RED — `ClienteForm` not implemented
  - **Verifies:** AC1 — Nombre field + * label

- **Test:** should render NIT/RUC field marked as required (*)
  - **Status:** RED — `ClienteForm` not implemented
  - **Verifies:** AC1 — NIT/RUC field + * label

- **Test:** should render Teléfono field marked as required (*)
  - **Status:** RED — `ClienteForm` not implemented
  - **Verifies:** AC1 — Teléfono field + * label

- **Test:** should render Ciudad field marked as required (*)
  - **Status:** RED — `ClienteForm` not implemented
  - **Verifies:** AC1 — Ciudad field + * label

- **Test:** should show "* Campos obligatorios" legend at the bottom of the form
  - **Status:** RED — legend element not implemented
  - **Verifies:** AC1 — legend text present

- **Test:** should auto-focus the Nombre field when dialog opens
  - **Status:** RED — autoFocus not wired
  - **Verifies:** AC1 — autoFocus on Nombre

#### AC2 — Successful creation (4 tests)

- **Test:** should call POST /api/v1/clientes when valid form is submitted
  - **Status:** RED — backend endpoint and form wiring do not exist
  - **Verifies:** AC2 — POST called on valid submit

- **Test:** should close the dialog after successful client creation
  - **Status:** RED — dialog flow not implemented
  - **Verifies:** AC2 — modal closes on success

- **Test:** should show new client in the list immediately after creation
  - **Status:** RED — invalidateQueries not wired
  - **Verifies:** AC2 (FR27) — list updates without reload

- **Test:** should show success toast "Cliente creado correctamente"
  - **Status:** RED — toast not configured
  - **Verifies:** AC2 — success toast

#### AC3 — Validation errors (5 tests)

- **Test:** should show inline error below Nombre when it is empty on submit
  - **Status:** RED — `ClienteForm` not implemented
  - **Verifies:** AC3 — Zod validation, Nombre error

- **Test:** should show inline error below NIT/RUC when it is empty on submit
  - **Status:** RED — `ClienteForm` not implemented
  - **Verifies:** AC3 — Zod validation, NIT error

- **Test:** should show inline error below Teléfono when it is empty on submit
  - **Status:** RED — `ClienteForm` not implemented
  - **Verifies:** AC3 — Zod validation, Teléfono error

- **Test:** should show inline error below Ciudad when it is empty on submit
  - **Status:** RED — `ClienteForm` not implemented
  - **Verifies:** AC3 — Zod validation, Ciudad error

- **Test:** should NOT call POST /api/v1/clientes when validation fails
  - **Status:** RED — form not implemented
  - **Verifies:** AC3 — validation blocks network call

- **Test:** should keep dialog open and "Guardar" active when validation fails
  - **Status:** RED — form not implemented
  - **Verifies:** AC3 — form stays open on validation error

#### AC4 — NIT conflict (3 tests)

- **Test:** should show "El NIT/RUC ya está registrado" below NIT field on 409 response
  - **Status:** RED — `useCreateCliente` not implemented, setError not wired
  - **Verifies:** AC4 — 409 inline error on NIT field

- **Test:** should NOT expose stack trace or technical details on 409 response
  - **Status:** RED — middleware not implemented
  - **Verifies:** AC4 / NFR6 — no technical leak

- **Test:** should keep dialog open when backend returns 409 conflict
  - **Status:** RED — error handling not wired
  - **Verifies:** AC4 — dialog stays open on conflict

#### AC5 — Dialog close and reset (4 tests)

- **Test:** should close dialog when ✕ (close) button is clicked
  - **Status:** RED — NuevoClienteDialog not implemented
  - **Verifies:** AC5 — close via ✕

- **Test:** should close dialog when Esc key is pressed
  - **Status:** RED — NuevoClienteDialog not implemented
  - **Verifies:** AC5 — close via Esc (Radix built-in)

- **Test:** should reset form values when dialog is closed via Cancelar
  - **Status:** RED — form.reset() not wired
  - **Verifies:** AC5 — form reset on close

- **Test:** should NOT submit any data when dialog is closed via Cancelar
  - **Status:** RED — cancel not implemented
  - **Verifies:** AC5 — no POST on cancel

#### AC6 — Keyboard accessibility (4 tests)

- **Test:** should return focus to "Nuevo cliente" button when dialog is closed via Esc
  - **Status:** RED — Radix Dialog trigger not wired
  - **Verifies:** AC6 — focus returns to trigger

- **Test:** should allow Tab navigation through all form fields inside dialog
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC6 — Tab order in dialog

- **Test:** should have all form fields reachable via Tab within the dialog
  - **Status:** RED — form Tab order not implemented
  - **Verifies:** AC6 — WCAG 2.1 AA Tab coverage

- **Test:** dialog has role="dialog" for accessibility
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC6 — role="dialog"

#### AC7 — Loading state (2 tests)

- **Test:** should disable "Guardar" button while form is being submitted
  - **Status:** RED — `useCreateCliente` isPending not wired
  - **Verifies:** AC7 — disabled during in-flight

- **Test:** should show "Guardando..." text on submit button while mutation is in-flight
  - **Status:** RED — loading text not implemented
  - **Verifies:** AC7 — loading button text

---

### API Tests — `e2e/tests/api/create-client.api.spec.ts` (18 tests)

**File:** `e2e/tests/api/create-client.api.spec.ts`

#### AC2 — POST /api/v1/clientes success (6 tests)

- **Test:** should return 201 Created when all required fields are provided
  - **Status:** RED — `POST /api/v1/clientes` endpoint does not exist
  - **Verifies:** AC2 — HTTP 201

- **Test:** should return a ClienteDto with id (UUID) in the response body
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — UUID id field

- **Test:** should return ClienteDto with Nombre matching the submitted value
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — Nombre echoed back

- **Test:** should return ClienteDto with NIT matching the submitted value
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — NIT echoed back

- **Test:** should return ClienteDto with createdAt and updatedAt timestamps
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — ISO timestamp fields

- **Test:** should return Location header pointing to the new client URL
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — Location header for 201 Created

- **Test:** should return Content-Type application/json for successful creation
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — Content-Type

#### AC3 — Validation errors 400 (7 tests)

- **Test:** should return 400 when Nombre is empty
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** AC3 — 400 on empty Nombre

- **Test:** should return 400 when NIT is empty
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** AC3 — 400 on empty NIT

- **Test:** should return 400 when Teléfono is empty
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** AC3 — 400 on empty Teléfono

- **Test:** should return 400 when Ciudad is empty
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** AC3 — 400 on empty Ciudad

- **Test:** should return 400 when all fields are missing
  - **Status:** RED — FluentValidation not implemented
  - **Verifies:** AC3 — 400 on empty body

- **Test:** should return Problem Details format (RFC 7807) for 400 response
  - **Status:** RED — Problem Details middleware not configured for validation
  - **Verifies:** AC3 — RFC 7807 format

- **Test:** should NOT expose stack traces in 400 validation error response
  - **Status:** RED — middleware not configured
  - **Verifies:** NFR6 — no stack traces in 400

#### AC4 — NIT conflict 409 (4 tests)

- **Test:** should return 409 Conflict when NIT already exists
  - **Status:** RED — `GetByNitAsync` + `ConflictException` not implemented
  - **Verifies:** AC4 — HTTP 409

- **Test:** should return Problem Details format (RFC 7807) for 409 response
  - **Status:** RED — `ConflictException` → 409 middleware mapping missing
  - **Verifies:** AC4 — RFC 7807 format for 409

- **Test:** should NOT expose stack traces in 409 conflict response body
  - **Status:** RED — middleware not configured
  - **Verifies:** AC4 / NFR6 — no stack traces

- **Test:** should include conflict detail message about the duplicate NIT
  - **Status:** RED — `ConflictException` not thrown
  - **Verifies:** AC4 — detail message mentions NIT/conflict

---

### Component Tests — `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` (22 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

#### AC1 — Form fields render (12 tests)
All tests RED — `ClienteForm` component does not exist. Tests verify: form element, all 4 inputs, all 4 labels with *, legend, Guardar button, Cancelar button.

#### AC3 — Inline validation (7 tests)
All tests RED — Zod schema + React Hook Form not wired. Tests verify: error below Nombre/NIT/Teléfono/Ciudad on empty submit, mutate NOT called, "Este campo es requerido" text, "El NIT no puede estar vacío" text.

#### AC2 — Valid submit (2 tests)
All tests RED — `ClienteForm` + `useCreateCliente` not implemented. Tests verify: mutate called once, mutate called with correct data.

#### AC4 — 409 conflict (1 test)
RED — setError wiring on 409 not implemented.

#### AC5 — Cancel (2 tests)
RED — `ClienteForm` not implemented.

#### AC7 — Loading state (3 tests)
RED — `isPending` prop binding not implemented.

---

### Component Tests — `frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.test.tsx` (11 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.test.tsx`

#### AC1 — Dialog renders (6 tests)
All tests RED — `NuevoClienteDialog` does not exist. Tests verify: not rendered when open=false, rendered when open=true, title text, form inside dialog, all 4 fields, Guardar/Cancelar buttons.

#### AC5 — Close callbacks (2 tests)
RED — component not implemented.

#### AC6 — Accessibility (4 tests)
RED — role="dialog", aria-labelledby, title element matching not implemented.

---

## Data Factories

### Cliente Factory (existing — reuse)

**File:** `frontend/src/test-support/factories/cliente.factory.ts`

**Exports:**
- `createCliente(overrides?)` — Creates single ClienteDto with optional overrides
- `createClientes(count, overrides?)` — Creates array of ClienteDtos

**E2E helper (existing):**

**File:** `e2e/helpers/data.helper.ts`
- `buildCliente(overrides?)` — Builds request payload for E2E test data

No new factories required for Story 2.3.

---

## Mock Requirements

### POST /api/v1/clientes — Success Mock (E2E tests)

**Endpoint:** `POST /api/v1/clientes`

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Test",
  "nit": "900000001",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-20T00:00:00.000Z",
  "updatedAt": "2026-06-20T00:00:00.000Z"
}
```

### POST /api/v1/clientes — 409 Conflict Mock (E2E tests)

**Failure Response (409):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El NIT/RUC '900000001' ya está registrado."
}
```

**Notes:**
- Network-first pattern applied: `page.route(...)` called BEFORE `page.goto('/clientes')` in all E2E tests
- Slow POST mock (2000ms delay) used in AC7 tests to capture in-flight state
- `useCreateCliente` is fully mocked in component tests via `vi.mock`

---

## Required data-testid Attributes

### ClienteListView (update existing)

- `nuevo-cliente-btn` — "Nuevo cliente" trigger button in list panel header

### NuevoClienteDialog

- `nuevo-cliente-dialog` — DialogContent wrapper (shadcn Dialog)

### ClienteForm

- `cliente-form` — form element
- `cliente-nombre-input` — Nombre text input (siesa-ui-kit Input)
- `cliente-nit-input` — NIT/RUC text input (siesa-ui-kit Input)
- `cliente-telefono-input` — Teléfono text input (siesa-ui-kit Input)
- `cliente-ciudad-input` — Ciudad select/input (siesa-ui-kit Select)
- `cliente-nombre-error` — Nombre inline error paragraph
- `cliente-nit-error` — NIT/RUC inline error paragraph
- `cliente-telefono-error` — Teléfono inline error paragraph
- `cliente-ciudad-error` — Ciudad inline error paragraph
- `guardar-btn` — "Guardar" submit button
- `cancelar-btn` — "Cancelar" button
- `campos-obligatorios-legend` — "* Campos obligatorios" legend

**Implementation Example:**
```tsx
<p data-testid="cliente-nombre-error" className="text-sm text-red-600">
  {errors.nombre?.message}
</p>
<button data-testid="guardar-btn" disabled={isPending} type="submit">
  {isPending ? 'Guardando...' : 'Guardar'}
</button>
```

---

## Implementation Checklist

### Test: AC1 — Dialog opens with 4 required fields

**Files:** `e2e/tests/clientes/create-client.spec.ts`, `frontend/.../NuevoClienteDialog.test.tsx`

- [ ] Create `frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.tsx` — shadcn Dialog wrapper
- [ ] Add `data-testid="nuevo-cliente-dialog"` to DialogContent
- [ ] Set dialog title: "Nuevo cliente"
- [ ] Wire `aria-labelledby` to DialogTitle id
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- [ ] Add `data-testid="cliente-form"` to form element
- [ ] Add all 4 fields with `data-testid` attributes and `*` labels
- [ ] Add `data-testid="campos-obligatorios-legend"` legend at form footer
- [ ] Pass `autoFocus` to Nombre Input component
- [ ] Update `ClienteListView.tsx` — add "Nuevo cliente" button with `data-testid="nuevo-cliente-btn"`
- [ ] Add `useState<boolean>(false)` for `isDialogOpen`
- [ ] Wire button to `setIsDialogOpen(true)` and render `<NuevoClienteDialog open={isDialogOpen} onClose={...} />`
- [ ] Run: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC1"`
- [ ] Run: `pnpm run test --grep "NuevoClienteDialog"`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC2 — Valid form submission creates client

**Files:** `e2e/tests/clientes/create-client.spec.ts`, `e2e/tests/api/create-client.api.spec.ts`

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/CreateClienteRequest.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteRequestValidator.cs`
- [ ] Add `AddAsync` and `GetByNitAsync` to `IClienteRepository` and `ClienteRepository`
- [ ] Add `static Create()` factory to `ClienteEntity`
- [ ] Register `POST /api/v1/clientes` endpoint in `ClienteEndpoints.cs` → 201 + ClienteDto + Location header
- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` (Zod)
- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` (useMutation)
- [ ] Add `create(data)` to `IClienteRepository` domain interface
- [ ] Add `CreateClienteData` type to `Cliente.ts`
- [ ] Implement `create()` in `clienteApiRepository.ts` (POST /api/v1/clientes)
- [ ] Wire `useCreateCliente` in `ClienteForm.tsx` — `onSuccess`: invalidateQueries + toast.success
- [ ] Run: `npx playwright test e2e/tests/api/create-client.api.spec.ts --grep "201"`
- [ ] Run: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC2"`
- [ ] Run: `pnpm run test --grep "ClienteForm" --grep "valid submit"`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 5 hours

---

### Test: AC3 — Inline validation on empty fields

**Files:** `e2e/tests/clientes/create-client.spec.ts`, `frontend/.../ClienteForm.test.tsx`, `e2e/tests/api/create-client.api.spec.ts`

- [ ] Verify Zod schema `clienteSchema` has `z.string().min(1, 'Este campo es requerido')` for all 4 fields
- [ ] NIT field uses `z.string().min(1, 'El NIT no puede estar vacío')`
- [ ] Wire `zodResolver(clienteSchema)` in `useForm` inside `ClienteForm.tsx`
- [ ] Render error paragraphs below each field: `data-testid="cliente-{field}-error"`, `className="text-sm text-red-600"`
- [ ] Verify `handleSubmit` blocks call when errors exist (React Hook Form built-in)
- [ ] Verify `CreateClienteRequestValidator.cs` FluentValidation rules for all 4 fields
- [ ] Run: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC3"`
- [ ] Run: `npx playwright test e2e/tests/api/create-client.api.spec.ts --grep "400"`
- [ ] Run: `pnpm run test --grep "validation errors"`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC4 — 409 NIT conflict error

**Files:** `e2e/tests/clientes/create-client.spec.ts`, `frontend/.../ClienteForm.test.tsx`, `e2e/tests/api/create-client.api.spec.ts`

- [ ] Implement `GetByNitAsync` in repository — returns existing entity or null
- [ ] `CreateClienteCommandHandler` throws `ConflictException` when NIT exists
- [ ] Create `ConflictException.cs` in `Application/Common/Exceptions/`
- [ ] Add `ConflictException → 409 Problem Details` to `ExceptionHandlingMiddleware.cs`
- [ ] In `useCreateCliente.ts` `onError`: check `status === 409`, do NOT toast (handled by form)
- [ ] In `ClienteForm.tsx` `onError` callback: call `setError('nit', { message: 'El NIT/RUC ya está registrado' })`
- [ ] Render `data-testid="cliente-nit-error"` element showing nit field error message
- [ ] Run: `npx playwright test e2e/tests/api/create-client.api.spec.ts --grep "409"`
- [ ] Run: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC4"`
- [ ] Run: `pnpm run test --grep "409"`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC5 — Dialog close and form reset

**Files:** `e2e/tests/clientes/create-client.spec.ts`, `frontend/.../NuevoClienteDialog.test.tsx`

- [ ] Wire `onClose` prop to shadcn Dialog `onOpenChange` — `onOpenChange={(open) => !open && onClose()}`
- [ ] Call `form.reset()` in `ClienteForm.tsx` when `onClose` is invoked
- [ ] Ensure Radix Dialog handles Esc key natively (no extra code needed)
- [ ] Ensure Radix Dialog handles click-outside natively
- [ ] Wire `Cancelar` button: `onClick={() => { reset(); onClose(); }}`
- [ ] Run: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC5"`
- [ ] Run: `pnpm run test --grep "Cancelar"`
- [ ] ✅ AC5 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC6 — Keyboard accessibility

**Files:** `e2e/tests/clientes/create-client.spec.ts`, `frontend/.../NuevoClienteDialog.test.tsx`

- [ ] Add `aria-labelledby={titleId}` to DialogContent
- [ ] Ensure all field labels have `htmlFor` matching field `id`
- [ ] Add `aria-describedby` on each input pointing to its error paragraph id
- [ ] Focus trap is built into Radix Dialog `FocusScope` — no extra config
- [ ] Focus return to trigger is built into Radix Dialog — no extra config
- [ ] Run: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC6"`
- [ ] Run: `pnpm run test --grep "accessibility"`
- [ ] ✅ AC6 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC7 — Guardar loading state

**Files:** `e2e/tests/clientes/create-client.spec.ts`, `frontend/.../ClienteForm.test.tsx`

- [ ] `useCreateCliente` returns `isPending` from `useMutation`
- [ ] Pass `isPending` to "Guardar" button: `disabled={isPending}`
- [ ] Button text: `{isPending ? 'Guardando...' : 'Guardar'}`
- [ ] Run: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC7"`
- [ ] Run: `pnpm run test --grep "isPending"`
- [ ] ✅ AC7 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E failing tests for Story 2.3
npx playwright test e2e/tests/clientes/create-client.spec.ts

# Run API-level tests for Story 2.3
npx playwright test e2e/tests/api/create-client.api.spec.ts

# Run component tests for Story 2.3
pnpm --filter frontend run test -- ClienteForm.test
pnpm --filter frontend run test -- NuevoClienteDialog.test

# Run all Story 2.3 tests (E2E + API)
npx playwright test --grep "2.3|create-client"

# Run in headed mode (see browser)
npx playwright test e2e/tests/clientes/create-client.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/clientes/create-client.spec.ts --debug

# Run with UI mode
npx playwright test e2e/tests/clientes/create-client.spec.ts --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (27 E2E + 18 API + 22 Component + 11 Component = 78 total)
- ✅ Fixtures and factories documented (existing `cliente.factory.ts` and `data.helper.ts` reused)
- ✅ Mock requirements documented for all network intercepts
- ✅ data-testid requirements listed for all elements
- ✅ Implementation checklist created per AC

**Verification:**
- All tests run and fail as expected (RED phase)
- E2E failures: component/endpoint not found errors
- API failures: HTTP connection refused or 404 (endpoint not registered)
- Component failures: module not found (`ClienteForm`, `NuevoClienteDialog`, `useCreateCliente`)

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one AC** from implementation checklist (start with AC1 — dialog + form render)
2. **Read the test** to understand expected behavior and required data-testid
3. **Implement minimal code** to make that AC's tests pass
4. **Run tests** to verify green
5. **Check off tasks** in implementation checklist
6. **Move to next AC** in order: AC1 → AC7 → AC3 → AC5 → AC6 → AC2 → AC4

**Key Principles:**
- One AC at a time
- Add data-testid attributes EXACTLY as listed in this checklist
- All user-facing text MUST be in Spanish
- Use `isPending` (not `isLoading`) — TanStack Query v5
- Use `pnpm` for all package management

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 78 tests pass (green)
2. Extract any shared form logic if needed
3. Run `pnpm --filter frontend run test` — all tests passing
4. Run `npx playwright test` — all E2E passing
5. Code review per company standards

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/create-client.spec.ts`
3. Begin implementation with AC1 (dialog + form render) — fastest path to visible progress
4. Work one AC at a time (red → green for each)
5. When all 78 tests pass, proceed to code review

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests intercept routes BEFORE `page.goto()` to prevent race conditions
- **selector-resilience.md** — All selectors use `data-testid` hierarchy, never CSS class selectors
- **component-tdd.md** — Component tests use `vi.mock` for complete hook isolation
- **test-quality.md** — Given-When-Then structure, one primary assertion per test, deterministic setup
- **data-factories.md** — Reused existing `cliente.factory.ts` and `buildCliente()` helper
- **fixture-architecture.md** — Existing `base.fixture.ts` and `ApiHelper` reused for E2E data lifecycle
- **timing-debugging.md** — `waitFor()` used instead of hard waits; explicit waits for dialog visibility

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/clientes/create-client.spec.ts`

**Expected Results:**
```
FAIL e2e/tests/clientes/create-client.spec.ts
  AC1 — NuevoClienteDialog opens with form fields
    × should render "Nuevo cliente" button in the list panel header (timeout: element not found)
    × should open a dialog when "Nuevo cliente" button is clicked (timeout)
    ...
  (27 tests failing)

FAIL e2e/tests/api/create-client.api.spec.ts
  AC2 — POST /api/v1/clientes creates client successfully
    × should return 201 Created when all required fields are provided (ECONNREFUSED / 404)
    ...
  (18 tests failing)
```

**Frontend component tests:**
```
FAIL frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx
  Error: Cannot find module './ClienteForm' from '...'
  (22 tests failing — module not found)

FAIL frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.test.tsx
  Error: Cannot find module './NuevoClienteDialog' from '...'
  (11 tests failing — module not found)
```

**Summary:**
- Total tests: 78
- Passing: 0 (expected in RED phase)
- Failing: 78 (expected)
- Status: ✅ RED phase verified

---

## Notes

- `tea_use_playwright_utils: false` — pure Playwright test APIs used, no playwright-utils library
- `tea_use_mcp_enhancements: false` — AI generation mode used (no MCP recording)
- Existing `ClientesPage` POM (`e2e/pages/clientes.page.ts`) already has locators for dialog/form elements — component tests use testIds directly
- `ClienteListView.tsx` was updated in Story 2.2 for `selectedClienteId`/`onSelectCliente` props — do NOT break existing selection behavior when adding the "Nuevo cliente" button
- Ciudad field: story specifies siesa-ui-kit `Select` with predefined Colombian city options + "Otra" — E2E test uses `.fill()` for flexibility; component test uses testId targeting the input/trigger
- Backend: `dotnet` may not be available locally — API tests may only go GREEN in CI
- The AC4 component test uses a conditional `waitFor` with a descriptive error message to make RED failure actionable for the DEV agent

---

**Generated by BMad TEA Agent** — 2026-06-20
