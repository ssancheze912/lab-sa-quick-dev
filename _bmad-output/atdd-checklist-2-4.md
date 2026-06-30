# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-06-30
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component

---

## Story Summary

As a commercial team member, the user needs to edit any field of an existing client so that
client information stays up to date. The feature covers opening a pre-filled edit form from
the client detail view, saving changes that are reflected immediately, inline validation, and
cancellation without data loss.

**As a** commercial team member
**I want** to edit any field of an existing client
**So that** the client information stays up to date

---

## Acceptance Criteria

1. **AC1** — Given the user is viewing a client's detail, When the user clicks "Editar", Then the client form opens pre-filled with the current values of all fields (FR6).
2. **AC2** — Given the user modifies one or more fields and submits, When the form is saved, Then the changes are reflected in the client detail and list immediately (FR27), And a success toast shows "Cliente actualizado correctamente".
3. **AC3** — Given the user clears a required field and submits, When the form is validated, Then an inline error message appears on that field and the form is NOT submitted (FR8).
4. **AC4** — Given the user clicks "Cancelar" without saving, When the form closes, Then the original client data remains unchanged.

---

## Failing Tests Created (RED Phase)

### E2E Tests (17 tests)

**File:** `e2e/tests/clientes/edit-client.spec.ts`

- **Test:** should show "Editar" button when a client detail is displayed
  - **Status:** RED — `data-testid="edit-cliente-button"` element does not exist
  - **Verifies:** AC1 — edit entry point is accessible from detail view

- **Test:** should open a form dialog when "Editar" button is clicked
  - **Status:** RED — button click does not open a dialog (not yet implemented)
  - **Verifies:** AC1 — click triggers form open

- **Test:** should pre-fill Nombre field with current client value
  - **Status:** RED — form dialog does not open pre-filled
  - **Verifies:** AC1 / FR6 — Nombre pre-populated from TanStack Query cache

- **Test:** should pre-fill NIT/RUC field with current client value
  - **Status:** RED — NIT field not pre-filled
  - **Verifies:** AC1 / FR6

- **Test:** should pre-fill Teléfono field with current client value
  - **Status:** RED — Teléfono field not pre-filled
  - **Verifies:** AC1 / FR6

- **Test:** should pre-fill Ciudad field with current client value
  - **Status:** RED — Ciudad field not pre-filled
  - **Verifies:** AC1 / FR6

- **Test:** should render edit form overlay with correct data-testid
  - **Status:** RED — `data-testid="edit-cliente-form-overlay"` does not exist
  - **Verifies:** AC1 — overlay element identity

- **Test:** should close the edit form after successful save
  - **Status:** RED — PUT endpoint/hook not implemented
  - **Verifies:** AC2 — form closes on success

- **Test:** should show success toast "Cliente actualizado correctamente" after valid save
  - **Status:** RED — toast not triggered (mutation not implemented)
  - **Verifies:** AC2 — exact toast message

- **Test:** should reflect updated nombre in the detail panel immediately (FR27)
  - **Status:** RED — detail panel not refreshed after edit
  - **Verifies:** AC2 / FR27 — detail panel update without reload

- **Test:** should reflect updated nombre in the list panel immediately (FR27)
  - **Status:** RED — list panel not refreshed after edit
  - **Verifies:** AC2 / FR27 — list panel update without reload

- **Test:** should keep submit button disabled while save is in flight
  - **Status:** RED — isPending state not wired
  - **Verifies:** AC2 — loading state UX

- **Test:** should show inline error when Nombre is cleared and form submitted
  - **Status:** RED — edit mode Zod validation not applied
  - **Verifies:** AC3 / FR8

- **Test:** should show inline error when NIT is cleared and form submitted
  - **Status:** RED — edit mode validation not applied
  - **Verifies:** AC3 / FR8

- **Test:** should show inline error when Teléfono is cleared and form submitted
  - **Status:** RED — edit mode validation not applied
  - **Verifies:** AC3 / FR8

- **Test:** should show inline error when Ciudad is cleared and form submitted
  - **Status:** RED — edit mode validation not applied
  - **Verifies:** AC3 / FR8

- **Test:** should NOT call PUT when a required field is cleared and submitted
  - **Status:** RED — no frontend validation guard in edit mode
  - **Verifies:** AC3 — form NOT submitted to backend

- **Test:** should close the edit form when "Cancelar" is clicked
  - **Status:** RED — Cancelar button not yet present in detail view
  - **Verifies:** AC4 — form closes

- **Test:** should NOT send PUT request when "Cancelar" is clicked
  - **Status:** RED — Cancelar doesn't guard against mutation
  - **Verifies:** AC4 — no accidental save

- **Test:** should preserve original client nombre in detail panel after Cancelar
  - **Status:** RED — detail panel not maintaining original data on cancel
  - **Verifies:** AC4 — original data intact after cancel

### API Tests (13 tests)

**File:** `e2e/tests/api/clientes-update.api.spec.ts`

- **Test:** should return 200 OK when all required fields are provided in PUT
  - **Status:** RED — PUT /api/v1/clientes/{id} endpoint not wired or handler missing
  - **Verifies:** AC2 — happy-path HTTP contract

- **Test:** should return updated ClienteDto with correct field values on 200
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — response shape

- **Test:** should update the updatedAt timestamp on successful PUT
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — updatedAt field is refreshed

- **Test:** should reflect PUT changes in subsequent GET /api/v1/clientes/{id}
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 / FR27 — persistence

- **Test:** should reflect PUT changes in GET /api/v1/clientes list
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 / FR27 — list refresh

- **Test:** should return content-type application/json on 200
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC2 — response content-type

- **Test:** should return 400 when nombre is empty in PUT payload
  - **Status:** RED — UpdateClienteCommandValidator not registered
  - **Verifies:** AC3 / FR8 — backend validation

- **Test:** should return 400 when nit is empty in PUT payload
  - **Status:** RED — validator not implemented
  - **Verifies:** AC3 / FR8

- **Test:** should return 400 when telefono is empty in PUT payload
  - **Status:** RED — validator not implemented
  - **Verifies:** AC3 / FR8

- **Test:** should return 400 when ciudad is empty in PUT payload
  - **Status:** RED — validator not implemented
  - **Verifies:** AC3 / FR8

- **Test:** should return Problem Details RFC 7807 format on 400 validation error
  - **Status:** RED — validator not registered
  - **Verifies:** AC3 — RFC 7807 compliance

- **Test:** should NOT expose stack trace in 400 response body (NFR6)
  - **Status:** RED — ExceptionHandlingMiddleware not tested for PUT validation path
  - **Verifies:** NFR6 — no internal details leaked

- **Test:** should return 404 when id does not exist
  - **Status:** RED — handler not implemented
  - **Verifies:** AC2 — 404 on missing client

- **Test:** should return Problem Details format on 404
  - **Status:** RED — handler not implemented
  - **Verifies:** AC2 — 404 Problem Details shape

### Component Tests (18 tests)

**File (hook):** `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

- **Test:** calls clienteApiRepository.update with the provided id and payload
  - **Status:** RED — useUpdateCliente does not exist
  - **Verifies:** AC2 — mutation wired to repository

- **Test:** invalidates ["clientes"] query cache on success
  - **Status:** RED — hook not implemented
  - **Verifies:** AC2 / FR27 — list cache invalidated

- **Test:** invalidates ["clientes", id] query cache on success
  - **Status:** RED — hook not implemented
  - **Verifies:** AC2 / FR27 — detail cache invalidated

- **Test:** shows success toast "Cliente actualizado correctamente" on success
  - **Status:** RED — hook not implemented
  - **Verifies:** AC2 — exact toast text

- **Test:** returns isPending as true while mutation is in flight
  - **Status:** RED — hook not implemented
  - **Verifies:** AC2 — loading state exposure

- **Test:** shows error toast "No se pudo guardar. Intenta de nuevo." on failure
  - **Status:** RED — hook not implemented
  - **Verifies:** AC2/AC3 — error toast

- **Test:** sets isError to true when mutation fails with 400
  - **Status:** RED — hook not implemented
  - **Verifies:** AC3 — error state

- **Test:** sets isError to true when mutation fails with 404
  - **Status:** RED — hook not implemented
  - **Verifies:** AC2 — 404 error state

- **Test:** does NOT call invalidateQueries when mutation fails
  - **Status:** RED — hook not implemented
  - **Verifies:** AC2 — cache not invalidated on error

- **Test:** does NOT expose Problem Details fields in hook state (NFR6)
  - **Status:** RED — hook not implemented
  - **Verifies:** NFR6

**File (form):** `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`

- **Test:** renders the form with data-testid="cliente-form" in edit mode
  - **Status:** RED — ClienteForm does not accept mode="edit" prop
  - **Verifies:** AC1 — edit mode renders form

- **Test:** pre-fills Nombre input with initialValues.nombre
  - **Status:** RED — no edit mode, no initialValues prop
  - **Verifies:** AC1 / FR6

- **Test:** pre-fills NIT/RUC input with initialValues.nit
  - **Status:** RED — same
  - **Verifies:** AC1 / FR6

- **Test:** pre-fills Teléfono input with initialValues.telefono
  - **Status:** RED — same
  - **Verifies:** AC1 / FR6

- **Test:** pre-fills Ciudad input with initialValues.ciudad
  - **Status:** RED — same
  - **Verifies:** AC1 / FR6

- **Test:** calls useUpdateCliente.mutate with modified payload including id
  - **Status:** RED — useUpdateCliente does not exist, form has no edit mode
  - **Verifies:** AC2 — correct mutation call

- **Test:** calls useUpdateCliente.mutate with all four fields present
  - **Status:** RED — edit mode not implemented
  - **Verifies:** AC2 — all fields included

- **Test:** disables submit button when isPending is true (edit mode)
  - **Status:** RED — edit mode not implemented
  - **Verifies:** AC2 — loading state

- **Test:** shows inline error for Nombre when cleared and submitted
  - **Status:** RED — updateClienteSchema not wired
  - **Verifies:** AC3 / FR8

- **Test:** shows inline error for NIT when cleared and submitted
  - **Status:** RED — same
  - **Verifies:** AC3 / FR8

- **Test:** shows inline error for Teléfono when cleared and submitted
  - **Status:** RED — same
  - **Verifies:** AC3 / FR8

- **Test:** shows inline error for Ciudad when cleared and submitted
  - **Status:** RED — same
  - **Verifies:** AC3 / FR8

- **Test:** does NOT call mutate when a required field is cleared and submitted
  - **Status:** RED — validation not blocking submission in edit mode
  - **Verifies:** AC3

- **Test:** calls onClose when "Cancelar" is clicked
  - **Status:** RED — Cancelar not present in edit mode
  - **Verifies:** AC4

- **Test:** does NOT call mutate when "Cancelar" is clicked
  - **Status:** RED — not implemented
  - **Verifies:** AC4 — no accidental save

- **Test:** calls onClose exactly once when "Cancelar" is clicked
  - **Status:** RED — not implemented
  - **Verifies:** AC4 — no double-close

---

## Data Infrastructure

### API Helper Extension

**File:** `e2e/helpers/api.helper.ts` (updated)

`updateCliente(id, data)` method added — wraps `PUT /api/v1/clientes/{id}` for integration test setup.

### Data Factory

**File:** `e2e/helpers/data.helper.ts` (existing — no changes needed)

`buildCliente(overrides?)` already provides unique test data with timestamps; used in integration tests for AC2.

---

## Required data-testid Attributes

### ClienteDetailView

- `edit-cliente-button` — The "Editar" pencil button in the detail panel header
- `edit-cliente-form-overlay` — The overlay/dialog wrapper when the edit form is open
- `cliente-detail-panel` — Already exists (used to verify updated values post-save)

### ClienteForm (edit mode — shared with create mode)

- `cliente-form` — Already exists on the form element (must be preserved)
- `cliente-form-submit` — Already exists on the submit button (must be preserved)

**Implementation example:**

```tsx
// ClienteDetailView.tsx
<button data-testid="edit-cliente-button" onClick={() => setIsEditFormOpen(true)}>
  <PencilSquareIcon /> Editar
</button>

{isEditFormOpen && (
  <div data-testid="edit-cliente-form-overlay" role="dialog" aria-modal="true">
    <ClienteForm
      mode="edit"
      initialValues={{ id: cliente.id, nombre: cliente.nombre, ... }}
      onClose={() => setIsEditFormOpen(false)}
      onSuccess={() => setIsEditFormOpen(false)}
    />
  </div>
)}
```

---

## Mock Requirements

### PUT /api/v1/clientes/{id} — E2E Intercepts

Tests use `page.route(...)` with network-first pattern to mock the endpoint:

**Success (200):**
```json
{
  "id": "uuid",
  "nombre": "updated-value",
  "nit": "...",
  "telefono": "...",
  "ciudad": "...",
  "createdAt": "ISO-date",
  "updatedAt": "ISO-date"
}
```

**Validation Error (400):**
```json
{ "status": 400, "title": "Bad Request", "detail": "..." }
```

**Not Found (404):**
```json
{ "status": 404, "title": "Not Found", "detail": "..." }
```

---

## Implementation Checklist

### Test: pre-fills all fields on edit form open (AC1)

**Files:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`

**Tasks to make this test pass:**

- [ ] Add `UpdateClienteRequest` interface to `Cliente.ts` (id, nombre, nit, telefono, ciudad)
- [ ] Add `mode?: 'create' | 'edit'` and `initialValues?: UpdateClienteFormData & { id: string }` props to `ClienteForm`
- [ ] Use `defaultValues` from `initialValues` when `mode === 'edit'` in `useForm()`
- [ ] Add `isEditFormOpen` state to `ClienteDetailView`
- [ ] Add `data-testid="edit-cliente-button"` button to `ClienteDetailView` header
- [ ] Render `ClienteForm mode="edit"` overlay with `data-testid="edit-cliente-form-overlay"` when open
- [ ] Run test: `npx playwright test edit-client.spec.ts --project=chromium`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: valid save calls PUT, refreshes panels, shows toast (AC2)

**Files:**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`

**Tasks to make this test pass:**

- [ ] Create `useUpdateCliente.ts` with `useMutation` calling `clienteApiRepository.update(id, data)`
- [ ] `onSuccess`: `queryClient.invalidateQueries(['clientes'])` + `queryClient.invalidateQueries(['clientes', id])` + `toast.success('Cliente actualizado correctamente')`
- [ ] `onError`: `toast.error('No se pudo guardar. Intenta de nuevo.')`
- [ ] Add `update(id, data)` to `IClienteRepository.ts`
- [ ] Implement `clienteApiRepository.update()` as `PUT /api/v1/clientes/${id}` via `apiClient`
- [ ] Wire `ClienteForm` in edit mode: call `useUpdateCliente().mutate()` on valid submit
- [ ] Close form only in `onSuccess` (not immediately)
- [ ] Backend: create or verify `UpdateClienteCommand` + `UpdateClienteCommandHandler`
- [ ] Backend: add or verify `PUT /api/v1/clientes/{id}` endpoint in `ClienteEndpoints.cs`
- [ ] Backend: set `entity.UpdatedAt = DateTimeOffset.UtcNow` in handler
- [ ] Backend: implement `UpdateAsync` in `ClienteRepository.cs`
- [ ] Add required `data-testid` attributes: `edit-cliente-button`, `edit-cliente-form-overlay`
- [ ] Run test: `npx playwright test edit-client.spec.ts --project=chromium`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: inline validation errors on cleared required fields (AC3)

**Files:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteCommandValidator.cs`
- `backend/src/SiesaAgents.API/Program.cs`

**Tasks to make this test pass:**

- [ ] Add `updateClienteSchema` to `clienteSchema.ts` (same rules as create)
- [ ] Use `zodResolver(updateClienteSchema)` when `mode === 'edit'` in `ClienteForm`
- [ ] Ensure error messages match: "Nombre requerido", "NIT/RUC requerido", "Teléfono requerido", "Ciudad requerida"
- [ ] Create `UpdateClienteCommandValidator.cs` with `NotEmpty()` rules for all four fields
- [ ] Register validator in `Program.cs`
- [ ] Run test: `npx playwright test edit-client.spec.ts --project=chromium`
- [ ] Run unit tests: `pnpm exec vitest run src/modules/crm/clientes/`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: Cancelar closes form without saving (AC4)

**Tasks to make this test pass:**

- [ ] "Cancelar" button in `ClienteForm` calls `onClose()` without triggering `mutate()`
- [ ] Ensure the local `useState` in `ClienteDetailView` returns to `false` on `onClose`
- [ ] Original client data is NOT modified (TanStack Query cache untouched on cancel)
- [ ] Run test: `npx playwright test edit-client.spec.ts --project=chromium`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E failing tests for this story
npx playwright test e2e/tests/clientes/edit-client.spec.ts --project=chromium

# Run API-level failing tests
npx playwright test e2e/tests/api/clientes-update.api.spec.ts --project=chromium

# Run all E2E tests for story (headed mode to see browser)
npx playwright test e2e/tests/clientes/edit-client.spec.ts --headed --project=chromium

# Run frontend unit tests
pnpm --filter frontend exec vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts
pnpm --filter frontend exec vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx

# Run all clientes unit tests
pnpm --filter frontend exec vitest run src/modules/crm/clientes/

# Debug a specific E2E test
npx playwright test edit-client.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Data infrastructure extended (api.helper.ts `updateCliente` method)
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- Tests fail due to missing implementation (module-not-found for hooks/edit mode, missing backend endpoint)
- Failure messages are clear and actionable
- No test logic errors — failures are all RED for the right reason

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (start with AC1: pre-fill)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify green
5. Check off the task in the implementation checklist
6. Move to next test and repeat

**Key Principles:**

- AC1 first → AC2 → AC3 → AC4 (natural dependency order)
- One test at a time; do not over-engineer
- Run tests frequently

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. All tests pass (green phase complete)
2. Review code for quality: DRY, readability, WCAG 2.1 AA
3. Address open items from Story 2.3: focus trap (`@radix-ui/react-focus-scope` or `siesa-ui-kit AlertDialog`)
4. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test edit-client.spec.ts`
3. Begin implementation using the checklist above
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture extension patterns; `base.fixture.ts` used for page navigation setup
- **data-factories.md** — `buildCliente()` factory reused for integration E2E tests; `Date.now()` for unique NIT values in API tests
- **network-first.md** — All E2E tests intercept routes via `page.route(...)` BEFORE `page.goto(...)` to prevent race conditions
- **test-quality.md** — Given-When-Then structure; one assertion per test (atomic); explicit waits only (no hard waits)
- **selector-resilience.md** — `data-testid` selectors for all interactive elements; ARIA labels for form inputs
- **test-levels-framework.md** — E2E for full user journeys (AC1–AC4), API for backend contract (AC2–AC3), Component/Unit for hook and form logic

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/clientes/edit-client.spec.ts e2e/tests/api/clientes-update.api.spec.ts`

**Expected Results:**

```
E2E Tests: 0 passed, 20 failed (expected — RED phase)
API Tests: 0 passed, 13 failed (expected — RED phase)

Unit hook tests: 0 passed, 10 failed (import error: Cannot find module './useUpdateCliente')
Unit form tests: 0 passed, 16 failed (import error: ClienteForm mode prop does not exist)
```

**Status:** RED phase — all tests fail due to missing implementation, not test bugs.

---

**Generated by BMad TEA Agent** — 2026-06-30
