# ATDD Checklist — Epic 2, Story 2.4: Edit Client

**Date:** 2026-06-20
**Author:** TEA Agent (claude-sonnet-4-6)
**Primary Test Level:** E2E (Playwright) + API (Playwright request) + Component (Vitest + RTL) + Unit (xUnit)

---

## Story Summary

A commercial team member clicks "Editar" in the client detail panel to open an `EditarClienteDialog` modal. The same `ClienteForm` component (from Story 2.3) is reused with `mode="edit"` and `defaultValues` pre-filled. On successful submission, `PUT /api/v1/clientes/{id}` is called, the dialog closes, both TanStack Query cache keys (`['clientes']` and `['clientes', id]`) are invalidated, and a Spanish success toast appears. Validation errors are shown inline via Zod. Duplicate NIT (different client) returns 409 and surfaces an inline field-level error.

**As a** commercial team member
**I want** to edit any field of an existing client
**So that** the client information stays up to date

---

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** they click "Editar", **Then** `EditarClienteDialog` opens inside a Dialog with title `"Editar cliente"`, all 4 fields pre-filled (Nombre, NIT/RUC, Teléfono, Ciudad), and `autoFocus` on Nombre.

2. **Given** the user modifies fields and clicks "Guardar", **When** the form is submitted, **Then** `PUT /api/v1/clientes/{id}` is called. On success, the modal closes, both `['clientes']` and `['clientes', id]` are invalidated (FR27), and toast `"Cliente actualizado correctamente"` appears.

3. **Given** the user clears a required field and clicks "Guardar", **When** Zod validates, **Then** inline error messages appear below each invalid field (`text-sm text-red-600`). The form is NOT submitted. "Guardar" remains active but submission is blocked.

4. **Given** the user clicks "Cancelar", presses Esc, or clicks outside, **When** the dialog closes, **Then** original client data remains unchanged. No PUT request is sent.

5. **Given** the user changes NIT to one already registered by a different client and submits, **When** backend returns 409 (Problem Details RFC 7807), **Then** inline error `"El NIT/RUC ya está registrado"` appears below the NIT field without exposing technical details (NFR6).

6. **Given** the form is submitting, **When** mutation is in-flight, **Then** "Guardar" shows `"Guardando..."` and is disabled to prevent duplicate submissions.

7. **Given** the user navigates via Tab key, **Then** all fields and buttons meet WCAG 2.1 AA. Focus is trapped in the Dialog while open. On close, focus returns to the "Editar" button.

---

## Failing Tests Created (RED Phase)

### E2E Tests — `e2e/tests/clientes/edit-client.spec.ts` (30 tests)

**File:** `e2e/tests/clientes/edit-client.spec.ts`

#### AC1 — Dialog opens with pre-filled fields (7 tests)

- **Test:** should render "Editar" button in the client detail panel
  - **Status:** RED — `editar-btn` does not exist in `ClienteDetailView`
  - **Verifies:** AC1 — "Editar" trigger button is present

- **Test:** should open EditarClienteDialog when "Editar" button is clicked
  - **Status:** RED — `EditarClienteDialog` does not exist
  - **Verifies:** AC1 — clicking button opens dialog

- **Test:** should show dialog title "Editar cliente"
  - **Status:** RED — `EditarClienteDialog` does not exist
  - **Verifies:** AC1 — dialog title text

- **Test:** should pre-fill Nombre field with current client name
  - **Status:** RED — `EditarClienteDialog` and `ClienteForm mode="edit"` not implemented
  - **Verifies:** AC1 — Nombre pre-filled

- **Test:** should pre-fill NIT/RUC field with current client NIT
  - **Status:** RED — `ClienteForm defaultValues` not implemented
  - **Verifies:** AC1 — NIT/RUC pre-filled

- **Test:** should pre-fill Teléfono field with current client phone
  - **Status:** RED — `ClienteForm defaultValues` not implemented
  - **Verifies:** AC1 — Teléfono pre-filled

- **Test:** should pre-fill Ciudad field with current client city
  - **Status:** RED — `ClienteForm defaultValues` not implemented
  - **Verifies:** AC1 — Ciudad pre-filled

- **Test:** should render "Guardar" and "Cancelar" buttons when dialog is open
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC1 — action buttons visible

#### AC2 — Successful update (4 tests)

- **Test:** should call PUT /api/v1/clientes/{id} when Guardar is clicked with valid data
  - **Status:** RED — backend endpoint and `useUpdateCliente` do not exist
  - **Verifies:** AC2 — PUT called on valid submit

- **Test:** should close the dialog after successful edit
  - **Status:** RED — dialog flow not implemented
  - **Verifies:** AC2 — modal closes on success

- **Test:** should show success toast "Cliente actualizado correctamente"
  - **Status:** RED — toast not wired
  - **Verifies:** AC2 — success toast

- **Test:** should reflect updated values in the detail view after successful edit
  - **Status:** RED — invalidateQueries not wired
  - **Verifies:** AC2 (FR27) — detail updates without reload

#### AC3 — Validation errors (6 tests)

- **Test:** should show inline error below Nombre when Nombre is cleared and Guardar is clicked
  - **Status:** RED — `ClienteForm` edit mode not implemented
  - **Verifies:** AC3 — Zod validation, Nombre error

- **Test:** should show inline error below NIT/RUC when NIT is cleared and Guardar is clicked
  - **Status:** RED — `ClienteForm` edit mode not implemented
  - **Verifies:** AC3 — Zod validation, NIT error

- **Test:** should show inline error below Teléfono when Teléfono is cleared and Guardar is clicked
  - **Status:** RED — `ClienteForm` edit mode not implemented
  - **Verifies:** AC3 — Zod validation, Teléfono error

- **Test:** should show inline error below Ciudad when Ciudad is cleared and Guardar is clicked
  - **Status:** RED — `ClienteForm` edit mode not implemented
  - **Verifies:** AC3 — Zod validation, Ciudad error

- **Test:** should NOT call PUT when validation fails
  - **Status:** RED — form not implemented
  - **Verifies:** AC3 — validation blocks network call

- **Test:** should keep dialog open and "Guardar" button active when validation fails
  - **Status:** RED — form not implemented
  - **Verifies:** AC3 — form stays open on validation error

#### AC4 — Cancel or Esc closes dialog (5 tests)

- **Test:** should close dialog when "Cancelar" button is clicked
  - **Status:** RED — `EditarClienteDialog` not implemented
  - **Verifies:** AC4 — close via Cancelar

- **Test:** should NOT call PUT when "Cancelar" is clicked
  - **Status:** RED — cancel not implemented
  - **Verifies:** AC4 — no PUT on cancel

- **Test:** should close dialog when Esc key is pressed
  - **Status:** RED — `EditarClienteDialog` Esc handling not implemented
  - **Verifies:** AC4 — close via Esc

- **Test:** should preserve original client data in detail view after clicking Cancelar
  - **Status:** RED — cancel without submitting not implemented
  - **Verifies:** AC4 — original data unchanged

#### AC5 — 409 NIT conflict (3 tests)

- **Test:** should show "El NIT/RUC ya está registrado" below NIT field on 409 response
  - **Status:** RED — `useUpdateCliente` 409 handling + `setError` not implemented
  - **Verifies:** AC5 — 409 inline error on NIT field

- **Test:** should NOT expose stack trace or technical details on 409 response (NFR6)
  - **Status:** RED — `ExceptionHandlingMiddleware` mapping for 409 not verified
  - **Verifies:** AC5 / NFR6 — no technical leak

- **Test:** should keep dialog open when backend returns 409 conflict
  - **Status:** RED — error handling not wired
  - **Verifies:** AC5 — dialog stays open on conflict

#### AC6 — Loading state (2 tests)

- **Test:** should disable "Guardar" button while form is being submitted
  - **Status:** RED — `useUpdateCliente` isPending not wired to button
  - **Verifies:** AC6 — disabled during in-flight

- **Test:** should show "Guardando..." text on submit button while mutation is in-flight
  - **Status:** RED — loading text not implemented
  - **Verifies:** AC6 — loading button text

#### AC7 — Keyboard accessibility (3 tests)

- **Test:** dialog has role="dialog" for accessibility
  - **Status:** RED — `EditarClienteDialog` not implemented
  - **Verifies:** AC7 — role="dialog"

- **Test:** all form fields and buttons are reachable via Tab within the dialog
  - **Status:** RED — focus trap not configured
  - **Verifies:** AC7 — WCAG 2.1 AA Tab coverage

- **Test:** should return focus to "Editar" button when dialog is closed via Esc
  - **Status:** RED — focus return to trigger not wired
  - **Verifies:** AC7 — focus returns to "Editar" button

---

### API Tests — `e2e/tests/api/edit-client.api.spec.ts` (20 tests)

**File:** `e2e/tests/api/edit-client.api.spec.ts`

#### AC2 — PUT /api/v1/clientes/{id} success (6 tests)

- **Test:** should return 200 OK when all required fields are provided and client exists
  - **Status:** RED — `PUT /api/v1/clientes/{id}` endpoint does not exist
  - **Verifies:** AC2 — HTTP 200

- **Test:** should return ClienteDto with id matching the updated client
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — id preserved

- **Test:** should return ClienteDto with the updated Nombre value
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — Nombre updated in response

- **Test:** should return ClienteDto with updated Teléfono and Ciudad values
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — Teléfono and Ciudad updated

- **Test:** should return ClienteDto with non-null updatedAt timestamp
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — UpdatedAt timestamp present

- **Test:** should return Content-Type application/json for successful update
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — Content-Type

- **Test:** should allow updating a client with its own NIT (no self-conflict)
  - **Status:** RED — same-NIT exclusion logic not implemented
  - **Verifies:** AC2 — existingNit.Id == command.Id → no conflict

#### AC3 — Validation errors 400 (6 tests)

- **Test:** should return 400 when Nombre is empty
  - **Status:** RED — `UpdateClienteRequestValidator` not implemented
  - **Verifies:** AC3 — 400 on empty Nombre

- **Test:** should return 400 when NIT is empty
  - **Status:** RED — `UpdateClienteRequestValidator` not implemented
  - **Verifies:** AC3 — 400 on empty NIT

- **Test:** should return 400 when Teléfono is empty
  - **Status:** RED — `UpdateClienteRequestValidator` not implemented
  - **Verifies:** AC3 — 400 on empty Teléfono

- **Test:** should return 400 when Ciudad is empty
  - **Status:** RED — `UpdateClienteRequestValidator` not implemented
  - **Verifies:** AC3 — 400 on empty Ciudad

- **Test:** should return Problem Details format (RFC 7807) for 400 response
  - **Status:** RED — Problem Details middleware not configured for PUT endpoint
  - **Verifies:** AC3 — RFC 7807 format

- **Test:** should NOT expose stack traces in 400 validation error response
  - **Status:** RED — middleware not configured
  - **Verifies:** NFR6 — no stack traces in 400

#### 404 — Client not found (2 tests)

- **Test:** should return 404 when client ID does not exist
  - **Status:** RED — `UpdateClienteCommandHandler` not implemented
  - **Verifies:** 404 when NotFoundException is thrown

- **Test:** should return Problem Details format (RFC 7807) for 404 response
  - **Status:** RED — `NotFoundException → 404` middleware mapping not verified for PUT
  - **Verifies:** RFC 7807 format for 404

#### AC5 — NIT conflict 409 (4 tests)

- **Test:** should return 409 when NIT already belongs to a different client
  - **Status:** RED — `UpdateClienteCommandHandler` NIT conflict check not implemented
  - **Verifies:** AC5 — HTTP 409

- **Test:** should return Problem Details format (RFC 7807) for 409 response
  - **Status:** RED — `ConflictException → 409` not verified for PUT
  - **Verifies:** AC5 — RFC 7807 format for 409

- **Test:** should NOT expose stack traces in 409 conflict response body (NFR6)
  - **Status:** RED — middleware not configured
  - **Verifies:** AC5 / NFR6 — no stack traces

- **Test:** should include conflict detail message mentioning the NIT value
  - **Status:** RED — `ConflictException` message not implemented
  - **Verifies:** AC5 — detail message mentions NIT

---

### Component Tests — `frontend/src/modules/crm/clientes/presentation/EditarClienteDialog.test.tsx` (23 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/EditarClienteDialog.test.tsx`

#### AC1 — Dialog renders with pre-filled values (10 tests)
All tests RED — `EditarClienteDialog` component does not exist. Tests verify:
- Dialog absent when open=false
- Dialog visible when open=true
- Title "Editar cliente"
- `ClienteForm` inside the dialog
- All 4 fields present
- All 4 fields pre-filled from `defaultValues`
- Guardar and Cancelar buttons visible

#### AC2 — Valid submit (3 tests)
All tests RED — `useUpdateCliente` and `EditarClienteDialog` not implemented. Tests verify:
- mutate called once on Guardar click
- mutate called with current field values
- mutate called with updated values after user modifies a field

#### AC3 — Inline validation (6 tests)
All tests RED — `ClienteForm mode="edit"` not implemented. Tests verify:
- Error below Nombre when cleared + submitted
- Error below NIT when cleared + submitted
- Error below Teléfono when cleared + submitted
- Error below Ciudad when cleared + submitted
- mutate NOT called when validation fails
- "Este campo es requerido" text for empty Nombre

#### AC4 — Cancel/Esc (3 tests)
RED — `EditarClienteDialog` not implemented. Tests verify:
- onClose called when Cancelar is clicked
- mutate NOT called when Cancelar is clicked
- onClose called when Esc is pressed

#### AC5 — 409 conflict (1 test)
RED — `useUpdateCliente` + `setError` wiring not implemented. Tests verify:
- "El NIT/RUC ya está registrado" appears below NIT field when 409 error is set

#### AC6 — Loading state (3 tests)
RED — `isPending` prop binding not implemented. Tests verify:
- "Guardar" disabled when isPending=true
- "Guardando..." text when isPending=true
- "Guardar" enabled and normal text when idle

#### AC7 — Accessibility (4 tests)
RED — `EditarClienteDialog` not implemented. Tests verify:
- role="dialog" present
- aria-labelledby present on dialog
- aria-labelledby references title element containing "Editar cliente"
- Dialog DOM absent when open=false

---

### Unit Tests — `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts` (12 tests)

**File:** `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

#### AC2 — Success path (3 tests)
All tests RED — `useUpdateCliente.ts` does not exist. Tests verify:
- `toast.success('Cliente actualizado correctamente')` on success
- `invalidateQueries({ queryKey: ['clientes'] })` on success
- `invalidateQueries({ queryKey: ['clientes', id] })` on success (FR27)

#### AC5 — 409 handling (2 tests)
RED — hook not implemented. Tests verify:
- `toast.error` NOT called on 409
- isError=true with 409 status exposed

#### Other error handling (2 tests)
RED — Tests verify:
- `toast.error('No se pudo guardar. Intenta de nuevo.')` on 500
- `toast.error(...)` on network error (no response)

#### AC6 — Loading state (2 tests)
RED — Tests verify:
- isPending=true while mutation is in-flight
- isSuccess=true after successful mutation

#### Other (3 tests)
RED — Tests verify:
- mutate function and isPending=false initially
- isSuccess=true after success
- mutate passes correct ID and data to repository

---

### Backend Unit Tests — Already Present (GREEN from prior dev work)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`
- 9 tests covering AC2 (valid update), NotFoundException, ConflictException

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs`
- 7 tests covering AC3 (each empty field, all fields empty)

**Status:** These files already exist. Phase: GREEN (implementation was completed).

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

No new factories required for Story 2.4.

---

## Mock Requirements

### PUT /api/v1/clientes/{id} — Success Mock (E2E tests)

**Endpoint:** `PUT /api/v1/clientes/{id}`

**Success Response (200):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "nombre": "Empresa Test Actualizada",
  "nit": "900111222-1",
  "telefono": "3009876543",
  "ciudad": "Medellín",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-06-20T00:00:00.000Z"
}
```

### PUT /api/v1/clientes/{id} — 409 Conflict Mock (E2E tests)

**Failure Response (409):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El NIT/RUC '800999888-5' ya está registrado."
}
```

**Notes:**
- Network-first pattern applied: `page.route(...)` called BEFORE `page.goto(...)` in all E2E tests
- Slow PUT mock (2000ms delay) used in AC6 tests to capture in-flight state
- `useUpdateCliente` is fully mocked in component tests via `vi.mock`

---

## Required data-testid Attributes

### ClienteDetailView (update existing)

- `editar-btn` — "Editar" trigger button in detail panel

### EditarClienteDialog

- `editar-cliente-dialog` — dialog content wrapper (custom Dialog with createPortal)

### ClienteForm (in edit mode — reuses existing testids)

- `cliente-form` — form element
- `cliente-nombre-input` — Nombre text input (pre-filled in edit mode)
- `cliente-nit-input` — NIT/RUC text input (pre-filled in edit mode)
- `cliente-telefono-input` — Teléfono text input (pre-filled in edit mode)
- `cliente-ciudad-input` — Ciudad input (pre-filled in edit mode)
- `cliente-nombre-error` — Nombre inline error paragraph
- `cliente-nit-error` — NIT/RUC inline error paragraph
- `cliente-telefono-error` — Teléfono inline error paragraph
- `cliente-ciudad-error` — Ciudad inline error paragraph
- `guardar-btn` — "Guardar" submit button
- `cancelar-btn` — "Cancelar" button

**Implementation Example:**
```tsx
// EditarClienteDialog.tsx
<div data-testid="editar-cliente-dialog" role="dialog" aria-labelledby="editar-cliente-title">
  <h2 id="editar-cliente-title">Editar cliente</h2>
  <ClienteForm mode="edit" clienteId={clienteId} defaultValues={defaultValues} onClose={onClose} />
</div>

// ClienteDetailView.tsx
<button data-testid="editar-btn" onClick={() => setIsEditDialogOpen(true)}>Editar</button>
```

---

## Implementation Checklist

### Test: AC1 — Dialog opens with pre-filled fields

**Files:** `e2e/tests/clientes/edit-client.spec.ts`, `frontend/.../EditarClienteDialog.test.tsx`

- [ ] Add `isEditDialogOpen` state and `data-testid="editar-btn"` button to `ClienteDetailView.tsx`
- [ ] Create `frontend/src/modules/crm/clientes/presentation/EditarClienteDialog.tsx`
- [ ] Add `data-testid="editar-cliente-dialog"` to dialog wrapper
- [ ] Set dialog title: `"Editar cliente"` with `id` for `aria-labelledby`
- [ ] Wire `aria-labelledby` to title element `id`
- [ ] Add `mode: 'create' | 'edit'` and `defaultValues?: ClienteFormValues` props to `ClienteForm.tsx`
- [ ] Pass `defaultValues` to `useForm({ defaultValues })` when `mode === 'edit'`
- [ ] Run: `npx playwright test e2e/tests/clientes/edit-client.spec.ts --grep "AC1"`
- [ ] Run: `pnpm run test -- EditarClienteDialog.test`
- [ ] AC1 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Valid form submission updates client

**Files:** `e2e/tests/clientes/edit-client.spec.ts`, `e2e/tests/api/edit-client.api.spec.ts`, `frontend/.../useUpdateCliente.test.ts`

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`
- [ ] Add `UpdateAsync(ClienteEntity, CancellationToken)` to `IClienteRepository` and `ClienteRepository`
- [ ] Add `Update(string, string, string, string)` method to `ClienteEntity` (sets fields + `UpdatedAt = DateTimeOffset.UtcNow`)
- [ ] Register `PUT /api/v1/clientes/{id}` endpoint in `ClienteEndpoints.cs`
- [ ] Add `UpdateClienteData` type to `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- [ ] Add `update(id, data): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `update(id, data)` in `clienteApiRepository.ts` (PUT /api/v1/clientes/${id})
- [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- [ ] On success: `invalidateQueries(['clientes'])` + `invalidateQueries(['clientes', id])` + `toast.success('Cliente actualizado correctamente')`
- [ ] Wire `useUpdateCliente` in `ClienteForm.tsx` when `mode === 'edit'`
- [ ] Run: `npx playwright test e2e/tests/api/edit-client.api.spec.ts --grep "200"`
- [ ] Run: `npx playwright test e2e/tests/clientes/edit-client.spec.ts --grep "AC2"`
- [ ] Run: `pnpm run test -- useUpdateCliente.test`
- [ ] AC2 tests pass (green phase)

**Estimated Effort:** 5 hours

---

### Test: AC3 — Inline validation on empty fields

**Files:** `e2e/tests/clientes/edit-client.spec.ts`, `frontend/.../EditarClienteDialog.test.tsx`, `e2e/tests/api/edit-client.api.spec.ts`

- [ ] Verify existing Zod `clienteSchema` has required field messages — reuse as-is
- [ ] Verify `zodResolver(clienteSchema)` is wired in `useForm` with `defaultValues`
- [ ] Verify error paragraphs are rendered below each field with `data-testid="cliente-{field}-error"`
- [ ] Verify `handleSubmit` blocks call when errors exist (React Hook Form built-in)
- [ ] Verify `UpdateClienteRequestValidator.cs` FluentValidation rules for all 4 fields
- [ ] Update existing stub repositories in xUnit tests to add `UpdateAsync` method stub
- [ ] Run: `npx playwright test e2e/tests/clientes/edit-client.spec.ts --grep "AC3"`
- [ ] Run: `npx playwright test e2e/tests/api/edit-client.api.spec.ts --grep "400"`
- [ ] Run: `pnpm run test -- EditarClienteDialog.test`
- [ ] AC3 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC4 — Cancel closes dialog without submitting

**Files:** `e2e/tests/clientes/edit-client.spec.ts`, `frontend/.../EditarClienteDialog.test.tsx`

- [ ] Wire `onClose` to dialog close handler (Esc key + outside click + Cancelar button)
- [ ] Wire `Cancelar` button: `onClick={() => { onClose(); }}` (no reset needed — dialog unmounts)
- [ ] Ensure Esc key is handled natively by the custom dialog (same pattern as NuevoClienteDialog)
- [ ] Pass `ref` to "Editar" button for focus return on dialog close
- [ ] Run: `npx playwright test e2e/tests/clientes/edit-client.spec.ts --grep "AC4"`
- [ ] Run: `pnpm run test -- EditarClienteDialog.test`
- [ ] AC4 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — 409 NIT conflict

**Files:** `e2e/tests/clientes/edit-client.spec.ts`, `frontend/.../EditarClienteDialog.test.tsx`, `e2e/tests/api/edit-client.api.spec.ts`

- [ ] `UpdateClienteCommandHandler` checks NIT uniqueness excluding current client (existingNit.Id != command.Id)
- [ ] `ConflictException` (already exists) is thrown when conflict detected
- [ ] `ExceptionHandlingMiddleware` already handles `ConflictException → 409` — verify it covers PUT
- [ ] In `useUpdateCliente.ts` `onError`: check `status === 409`, do NOT toast
- [ ] In `ClienteForm.tsx` edit mode `useEffect`: call `setError('nit', { message: 'El NIT/RUC ya está registrado' })` when `mutation.isError` and status is 409
- [ ] Render `data-testid="cliente-nit-error"` element showing nit field error message
- [ ] Run: `npx playwright test e2e/tests/api/edit-client.api.spec.ts --grep "409"`
- [ ] Run: `npx playwright test e2e/tests/clientes/edit-client.spec.ts --grep "AC5"`
- [ ] Run: `pnpm run test -- EditarClienteDialog.test --grep "409"`
- [ ] AC5 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC6 — Guardar loading state

**Files:** `e2e/tests/clientes/edit-client.spec.ts`, `frontend/.../EditarClienteDialog.test.tsx`

- [ ] `useUpdateCliente` returns `isPending` from `useMutation` — reuse same pattern as `useCreateCliente`
- [ ] Pass `isPending` to "Guardar" button: `disabled={isPending}`
- [ ] Button text: `{isPending ? 'Guardando...' : 'Guardar'}`
- [ ] Run: `npx playwright test e2e/tests/clientes/edit-client.spec.ts --grep "AC6"`
- [ ] Run: `pnpm run test -- EditarClienteDialog.test --grep "isPending"`
- [ ] AC6 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC7 — Keyboard accessibility

**Files:** `e2e/tests/clientes/edit-client.spec.ts`, `frontend/.../EditarClienteDialog.test.tsx`

- [ ] Add `aria-labelledby={titleId}` to dialog wrapper element
- [ ] Ensure all field labels have `htmlFor` matching field `id`
- [ ] Add `aria-describedby` on each input pointing to its error paragraph id
- [ ] Pass `ref` to "Editar" button in `ClienteDetailView.tsx`; on dialog close, call `editarBtnRef.current?.focus()`
- [ ] Verify focus trap works in custom dialog (same pattern as NuevoClienteDialog)
- [ ] Run: `npx playwright test e2e/tests/clientes/edit-client.spec.ts --grep "AC7"`
- [ ] Run: `pnpm run test -- EditarClienteDialog.test --grep "Accessibility"`
- [ ] AC7 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Update Existing Backend Test Stubs

**Files to update** (add `UpdateAsync` stub method where missing):

- [ ] `GetClientesQueryHandlerTests.cs` — verify `UpdateAsync` stub exists (already added in Story 2.4)
- [ ] `GetClientesQueryHandlerEdgeCaseTests.cs` — verify `UpdateAsync` stub exists
- [ ] `GetClienteByIdQueryHandlerTests.cs` — verify `UpdateAsync` stub exists
- [ ] `GetClienteByIdQueryHandlerEdgeCaseTests.cs` — verify `UpdateAsync` stub exists
- [ ] `CreateClienteCommandHandlerTests.cs` — already updated

---

## Running Tests

```bash
# Run all E2E failing tests for Story 2.4
npx playwright test e2e/tests/clientes/edit-client.spec.ts

# Run API-level tests for Story 2.4
npx playwright test e2e/tests/api/edit-client.api.spec.ts

# Run component tests for Story 2.4
pnpm --filter frontend run test -- EditarClienteDialog.test
pnpm --filter frontend run test -- useUpdateCliente.test

# Run all Story 2.4 tests (E2E + API + component)
npx playwright test --grep "2.4|edit-client"

# Run in headed mode (see browser)
npx playwright test e2e/tests/clientes/edit-client.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/clientes/edit-client.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All frontend tests written and failing (30 E2E + 20 API + 23 Component + 12 Unit Hook = 85 total new tests)
- Backend xUnit tests already present (16 tests — GREEN from prior dev)
- Fixtures and factories documented (existing `cliente.factory.ts` and `data.helper.ts` reused)
- Mock requirements documented for all network intercepts
- data-testid requirements listed for all elements
- Implementation checklist created per AC

**Verification:**
- All new tests run and fail as expected (RED phase)
- E2E failures: component/endpoint not found errors
- API failures: HTTP connection refused or 404 (endpoint not registered)
- Component failures: module not found (`EditarClienteDialog`, `useUpdateCliente`)

---

### GREEN Phase (DEV Agent — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one AC from implementation checklist (start with AC1 — dialog + pre-filled fields)
2. Read the test to understand expected behavior and required data-testid
3. Implement minimal code to make that AC's tests pass
4. Run tests to verify green
5. Check off tasks in implementation checklist
6. Move to next AC in order: AC1 → AC6 → AC3 → AC4 → AC7 → AC2 → AC5

**Key Principles:**
- One AC at a time
- Add data-testid attributes EXACTLY as listed in this checklist
- All user-facing text MUST be in Spanish
- Use `isPending` (not `isLoading`) — TanStack Query v5
- Use `pnpm` for all package management
- `EditarClienteDialog` MUST follow the same custom Dialog/createPortal pattern as `NuevoClienteDialog.tsx` — NOT shadcn Dialog
- Do NOT call `useUpdateCliente` when `mode === 'create'`; maintain backward compatibility for Story 2.3 behavior

---

### REFACTOR Phase (DEV Agent — After All Tests Pass)

1. Verify all tests pass (green)
2. Ensure `ClienteForm` properly switches between `useCreateCliente` and `useUpdateCliente` based on `mode` prop
3. Run `pnpm --filter frontend run test` — all tests passing
4. Run `npx playwright test` — all E2E passing
5. Code review per company standards

---

## Summary of Test Counts

| Level | File | Tests | Status |
|---|---|---|---|
| E2E (Playwright) | `edit-client.spec.ts` | 30 | RED |
| API (Playwright) | `edit-client.api.spec.ts` | 20 | RED |
| Component (Vitest/RTL) | `EditarClienteDialog.test.tsx` | 23 | RED |
| Unit (Vitest/RTL) | `useUpdateCliente.test.ts` | 12 | RED |
| Unit (xUnit) | `UpdateClienteCommandHandlerTests.cs` | 9 | Already present |
| Unit (xUnit) | `UpdateClienteRequestValidatorTests.cs` | 7 | Already present |
| **Total new (RED)** | | **85** | RED |
| Total already present | | 16 | GREEN |

---

## Knowledge Base References Applied

- **network-first** — All E2E tests intercept routes BEFORE `page.goto()` to prevent race conditions
- **selector-resilience** — All selectors use `data-testid` hierarchy, never CSS class selectors
- **component-tdd** — Component tests use `vi.mock` for complete hook isolation
- **test-quality** — Given-When-Then structure, one primary assertion per test, deterministic setup
- **data-factories** — Reused existing `cliente.factory.ts` and `buildCliente()` helper
- **timing-debugging** — `waitFor()` used instead of hard waits; explicit waits for dialog visibility
- **Previous Story Learnings (2.1–2.3)** — Custom dialog (createPortal), isPending not isLoading, native button type for submit, siesa-ui-kit Button caveat

---

**Generated by BMad TEA Agent** — 2026-06-20
