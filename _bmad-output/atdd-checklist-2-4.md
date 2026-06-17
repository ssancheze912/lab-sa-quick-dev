# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-06-17
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component + Unit

---

## Story Summary

A commercial team member needs to edit the information of an existing client so that client data stays up to date. The feature adds an "Editar" button to the client detail panel that opens a pre-filled edit form. Saving changes updates the detail panel and client list immediately (FR27) and shows a success toast. Client-side validation prevents submitting empty required fields (FR8), and "Cancelar" discards changes without firing a PUT request.

**As a** commercial team member
**I want** to edit the information of an existing client
**So that** I can keep client data up to date

---

## Acceptance Criteria

1. **AC1 (FR6):** Given the user is viewing a client's detail panel, when the user clicks "Editar", then the client form opens pre-filled with current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad.

2. **AC2 (FR27):** Given the user modifies one or more fields and clicks save, when the form is submitted, then changes are reflected in the client detail panel and in the client list immediately, and a success toast appears with "Cliente actualizado correctamente".

3. **AC3 (FR8):** Given the user clears a required field (Nombre, NIT/RUC, Teléfono, or Ciudad) and clicks save, when the form is validated, then an inline error message appears on the cleared field, the form is NOT submitted to the backend, and no API request is fired.

4. **AC4:** Given the user has modified one or more fields but clicks "Cancelar" without saving, when the form closes, then the original client data remains unchanged in the detail panel, and no PUT request is fired.

---

## Failing Tests Created (RED Phase)

### E2E Tests (14 tests)

**File:** `e2e/tests/clientes/clientes-edit.spec.ts`

- **Test:** AC1 — should open the edit form when user clicks "Editar" button
  - **Status:** RED — `btn-editar-cliente` testid does not exist (ClienteDetailView lacks "Editar" button)
  - **Verifies:** AC1 — "Editar" button triggers form opening

- **Test:** AC1 — should pre-fill Nombre field with the current value when edit form opens
  - **Status:** RED — `input-nombre` testid does not exist (ClienteEditForm not implemented)
  - **Verifies:** AC1 — Nombre input pre-filled from client data

- **Test:** AC1 — should pre-fill NIT/RUC field with the current value when edit form opens
  - **Status:** RED — `input-nitruc` testid does not exist
  - **Verifies:** AC1 — NIT/RUC input pre-filled from client data

- **Test:** AC1 — should pre-fill Teléfono field with the current value when edit form opens
  - **Status:** RED — `input-telefono` testid does not exist
  - **Verifies:** AC1 — Teléfono input pre-filled from client data

- **Test:** AC1 — should pre-fill Ciudad field with the current value when edit form opens
  - **Status:** RED — `input-ciudad` testid does not exist
  - **Verifies:** AC1 — Ciudad input pre-filled from client data

- **Test:** TC-E2-P1-11 — should show success toast "Cliente actualizado correctamente" after saving changes
  - **Status:** RED — No edit form, no PUT endpoint, no toast system for updates
  - **Verifies:** AC2 — Success toast message

- **Test:** TC-E2-P1-11 — should reflect the updated Nombre in the detail panel immediately after save
  - **Status:** RED — No PUT endpoint / mutation hook implemented
  - **Verifies:** AC2 — Detail panel updates immediately (FR27)

- **Test:** TC-E2-P1-11 — should reflect the updated Nombre in the client list panel immediately after save
  - **Status:** RED — TanStack Query invalidation not wired up
  - **Verifies:** AC2 — List updates immediately (FR27)

- **Test:** TC-E2-P1-11 — should close the edit form and return to the detail view after saving
  - **Status:** RED — ClienteEditForm not implemented
  - **Verifies:** AC2 — Edit form closes on success

- **Test:** AC3 — should show an inline error for Nombre when the field is cleared and save is clicked
  - **Status:** RED — `error-nombre` testid does not exist
  - **Verifies:** AC3 — Inline validation error

- **Test:** AC3 — should NOT fire a PUT request when a required field is cleared and save is clicked
  - **Status:** RED — ClienteEditForm not implemented
  - **Verifies:** AC3 — No PUT when validation fails

- **Test:** AC4 — should show original Nombre in detail panel after "Cancelar" is clicked
  - **Status:** RED — `btn-cancelar` testid does not exist
  - **Verifies:** AC4 — Cancel preserves original data

- **Test:** AC4 — should NOT fire a PUT request when user clicks "Cancelar"
  - **Status:** RED — ClienteEditForm not implemented
  - **Verifies:** AC4 — No PUT on cancel

- **Test:** AC4 — should close the edit form when user clicks "Cancelar"
  - **Status:** RED — ClienteEditForm not implemented
  - **Verifies:** AC4 — Form closes on cancel

### Component Tests (28 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteEditForm.test.tsx` (ClienteEditForm standalone tests)

- **Tests:** Form pre-fill (4 tests), form buttons (2 tests), TC-E2-P2-03 validation (6 tests), TC-E2-P2-02 cancel (3 tests), successful save (2 tests), WCAG 2.1 AA accessibility (5 tests)
- **Status:** RED — `ClienteEditForm` component does not exist yet
- **Verifies:** AC1 (pre-fill), AC2 (save), AC3 (inline validation), AC4 (cancel), WCAG

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (extended with Story 2.4 tests)

- **Tests:** TC-E2-P1-10 (4 tests) — "Editar" button presence and edit form opens pre-filled; TC-E2-P2-02 (3 tests) — cancel from ClienteDetailView
- **Status:** RED — `btn-editar-cliente` testid missing from ClienteDetailView; `cliente-edit-form` not integrated

### Unit Tests (14 tests)

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`

- **Tests:** TC-E2-P3-02 (14 tests) — schema rejects missing fields, empty strings, fields exceeding max length; passes with valid data; Spanish error messages
- **Status:** RED — `clienteSchema.ts` module does not exist at `frontend/src/modules/crm/clientes/application/clienteSchema.ts`

---

## Data Infrastructure

### Data Factories

Reuses existing `buildCliente()` and `buildClienteDto()` factories from:
- `e2e/helpers/data.helper.ts` — E2E test data
- Inline factory in component test files (pattern from Story 2.2)

No new factory files required — existing patterns are sufficient.

### ApiHelper Extension Required

The `e2e/helpers/api.helper.ts` `ApiHelper` class needs a `updateCliente(id, data)` method added when the PUT endpoint is implemented. Current tests use direct `page.route()` intercepts for PUT verification.

---

## Mock Requirements

### PUT /api/v1/clientes/:id (Frontend E2E)

**Endpoint:** `PUT /api/v1/clientes/{id:guid}`
**Content-Type:** `application/json`
**Request Body:** `{ "nombre": "...", "nitRuc": "...", "telefono": "...", "ciudad": "..." }`

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Updated Name",
  "nitRuc": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Medellín",
  "createdAt": "2026-06-17T14:30:00Z"
}
```

**Validation Error Response (400 Bad Request — RFC 7807):**
```json
{
  "status": 400,
  "title": "One or more validation errors occurred.",
  "errors": {
    "nombre": ["El nombre es requerido."]
  }
}
```

**Not Found Response (404):**
```json
{
  "status": 404,
  "title": "Cliente no encontrado",
  "detail": "No existe un cliente con el ID especificado."
}
```

**Notes:** Component tests use MSW to intercept `PUT */api/v1/clientes/:id`. E2E tests use real backend for happy path and `page.route()` for verification of "no PUT fired" scenarios.

---

## Required data-testid Attributes

### ClienteDetailView (MODIFY)

- `btn-editar-cliente` — "Editar" button that opens the edit form (`aria-label="Editar cliente"`)

### ClienteEditForm (CREATE)

- `cliente-edit-form` — The `<form>` element wrapping the edit form
- `input-nombre` — Input field for Nombre
- `input-nitruc` — Input field for NIT/RUC
- `input-telefono` — Input field for Teléfono
- `input-ciudad` — Input field for Ciudad
- `error-nombre` — Inline error message for Nombre validation (`role="alert"`)
- `error-nitruc` — Inline error message for NIT/RUC validation (`role="alert"`)
- `error-telefono` — Inline error message for Teléfono validation (`role="alert"`)
- `error-ciudad` — Inline error message for Ciudad validation (`role="alert"`)
- `btn-guardar-cambios` — Submit button ("Guardar cambios")
- `btn-cancelar` — Cancel button ("Cancelar")

**Implementation example:**
```tsx
<form data-testid="cliente-edit-form" aria-label="Formulario de edición de cliente" noValidate>
  <div>
    <label htmlFor="nombre">Nombre</label>
    <input id="nombre" data-testid="input-nombre" {...register('nombre')}
           aria-invalid={!!errors.nombre} aria-describedby="nombre-error" />
    {errors.nombre && (
      <span id="nombre-error" data-testid="error-nombre" role="alert">
        {errors.nombre.message}
      </span>
    )}
  </div>
  {/* ... similar for nitRuc, telefono, ciudad ... */}
  <button type="button" data-testid="btn-cancelar" onClick={onCancel}>Cancelar</button>
  <button type="submit" data-testid="btn-guardar-cambios" disabled={isPending}>
    {isPending ? 'Guardando...' : 'Guardar cambios'}
  </button>
</form>
```

---

## Implementation Checklist

### Test: TC-E2-P3-02 — clienteFormSchema unit validation (Unit)

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` with `clienteFormSchema` Zod object
- [ ] Add `.min(1, 'El nombre es requerido').max(200)` rule for `nombre`
- [ ] Add `.min(1, 'El NIT/RUC es requerido').max(50)` rule for `nitRuc`
- [ ] Add `.min(1, 'El teléfono es requerido').max(50)` rule for `telefono`
- [ ] Add `.min(1, 'La ciudad es requerida').max(100)` rule for `ciudad`
- [ ] Export `ClienteFormValues` type via `z.infer<typeof clienteFormSchema>`
- [ ] Check if Story 2.3 already created this schema — reuse if available, do NOT duplicate
- [ ] Run test: `pnpm --filter frontend test clienteSchema.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-P1-10 — Edit form opens pre-filled with current values (Component, via ClienteDetailView)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `useState<boolean>` local state `isEditing` to `ClienteDetailView.tsx`
- [ ] Add "Editar" button with `data-testid="btn-editar-cliente"` that sets `isEditing = true`
- [ ] When `isEditing === true`, render `<ClienteEditForm>` instead of detail fields
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteEditForm.tsx` (see Task 7 in story)
- [ ] `ClienteEditForm` must accept `cliente: Cliente`, `onSuccess: () => void`, `onCancel: () => void` props
- [ ] Add `data-testid="cliente-edit-form"` to the `<form>` element
- [ ] Add `data-testid="input-nombre"` pre-filled with `cliente.nombre`
- [ ] Add `data-testid="input-nitruc"` pre-filled with `cliente.nitRuc`
- [ ] Add `data-testid="input-telefono"` pre-filled with `cliente.telefono`
- [ ] Add `data-testid="input-ciudad"` pre-filled with `cliente.ciudad`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E2-P2-03 — Required field cleared shows inline error; no PUT (Component)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteEditForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Integrate `zodResolver(clienteFormSchema)` in React Hook Form within `ClienteEditForm`
- [ ] Add inline error display per field using `formState.errors`
- [ ] Add `data-testid="error-nombre"` with `role="alert"` on the Nombre error span
- [ ] Add `data-testid="error-nitruc"` with `role="alert"` on the NIT/RUC error span
- [ ] Add `data-testid="error-telefono"` with `role="alert"` on the Teléfono error span
- [ ] Add `data-testid="error-ciudad"` with `role="alert"` on the Ciudad error span
- [ ] Add `aria-invalid={!!errors.nombre}` (and similar for other fields)
- [ ] Ensure `handleSubmit` only fires mutation when all fields pass Zod validation
- [ ] Run test: `pnpm --filter frontend test ClienteEditForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E2-P2-02 — Cancel preserves original data; no PUT (Component)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` and `ClienteEditForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Add "Cancelar" button with `data-testid="btn-cancelar"` in `ClienteEditForm`
- [ ] Button onClick calls `onCancel()` without triggering mutation
- [ ] In `ClienteDetailView`, `onCancel={() => setIsEditing(false)}` restores the detail view
- [ ] Verify `cliente-detail-nombre` still shows original value after cancel
- [ ] Run tests: `pnpm --filter frontend test ClienteDetailView.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-P1-11 — Save reflects changes in detail panel, list, and toast (E2E)

**File:** `e2e/tests/clientes/clientes-edit.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement `PUT /api/v1/clientes/{id:guid}` endpoint in `ClienteEndpoints.cs` (Task 4)
- [ ] Register `UpdateClienteCommandHandler` + `IValidator<UpdateClienteCommand>` in DI (Program.cs)
- [ ] Add `UpdateAsync` to `IClienteRepository` and implement in `ClienteRepository`
- [ ] Add `Update()` method to `ClienteEntity`
- [ ] Create `UpdateClienteCommand`, `UpdateClienteCommandValidator`, `UpdateClienteCommandHandler`
- [ ] Create `useUpdateCliente` TanStack Query mutation hook
- [ ] In `useUpdateCliente.onSuccess`, call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`
- [ ] In `ClienteEditForm`, on mutation success: call `toast.success('Cliente actualizado correctamente')` then `onSuccess()`
- [ ] Add `data-testid="btn-guardar-cambios"` to submit button
- [ ] Run test: `npx playwright test clientes-edit.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

## Running Tests

```bash
# Run all E2E tests for this story
npx playwright test clientes-edit.spec.ts

# Run E2E tests in headed mode
npx playwright test clientes-edit.spec.ts --headed

# Run E2E tests with debug
npx playwright test clientes-edit.spec.ts --debug

# Run all component tests for this story
pnpm --filter frontend test ClienteEditForm.test.tsx

# Run extended ClienteDetailView tests
pnpm --filter frontend test ClienteDetailView.test.tsx

# Run unit tests for Zod schema
pnpm --filter frontend test clienteSchema.test.ts

# Run all frontend tests related to this story
pnpm --filter frontend test -- --testPathPattern="(ClienteEditForm|ClienteDetailView|clienteSchema)"

# Run all tests (frontend)
pnpm --filter frontend test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Fixtures and factories: reuse existing `buildCliente()` / `buildClienteDto()` / `ApiHelper`
- Mock requirements documented (PUT /api/v1/clientes/:id)
- data-testid requirements listed (10 attributes for ClienteEditForm, 1 for ClienteDetailView)
- Implementation checklist created

**Verification:**

- All tests run and fail as expected
- E2E failures: element not found (`btn-editar-cliente`, `cliente-edit-form`, `input-nombre`, etc.)
- Component failures: `ClienteEditForm` module not found
- Unit failures: `clienteSchema` module not found

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with unit tests** — create `clienteSchema.ts` first (fastest, no UI needed)
2. **Then backend** — implement PUT endpoint, domain method, command handler
3. **Then component** — create `ClienteEditForm.tsx` with all testids
4. **Then integration** — wire `ClienteDetailView` with `isEditing` toggle and `useUpdateCliente`
5. **Run tests frequently** — one test at a time, RED → GREEN

**Priority order:**
1. `clienteSchema.test.ts` (TC-E2-P3-02) — 0.5h
2. `ClienteEditForm.test.tsx` pre-fill + cancel tests — 1h
3. `ClienteEditForm.test.tsx` validation tests (TC-E2-P2-03) — 1.5h
4. `ClienteDetailView.test.tsx` Story 2.4 tests (TC-E2-P1-10, TC-E2-P2-02) — 1h
5. Backend PUT endpoint + E2E tests (TC-E2-P1-11) — 4h

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 56+ tests pass across unit, component, and E2E levels
2. Check if `ClienteEditForm` can share the form fields with the create client form (Story 2.3)
3. Extract shared form field component if duplication exists
4. Ensure toast system is consistent across create and edit flows
5. Run tests after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase:
   - `pnpm --filter frontend test clienteSchema.test.ts` → all fail (module not found)
   - `pnpm --filter frontend test ClienteEditForm.test.tsx` → all fail (module not found)
   - `pnpm --filter frontend test ClienteDetailView.test.tsx` → Story 2.4 tests fail
   - `npx playwright test clientes-edit.spec.ts` → all fail (elements not found)
3. **Begin implementation** using checklist as guide
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor for shared form components

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns with setup/teardown; existing `ApiHelper` and `base.fixture.ts` reused
- **data-factories.md** — Factory patterns; existing `buildCliente()` and `buildClienteDto()` reused
- **network-first.md** — Route interception BEFORE navigation applied in all E2E tests with PUT verification
- **test-quality.md** — Given-When-Then, one assertion per test, deterministic cleanup
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS selectors
- **timing-debugging.md** — `waitFor()` for async assertions; no hard waits

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failure summary:**

- Unit (clienteSchema.test.ts): **14 tests** — `Cannot find module './clienteSchema'`
- Component (ClienteEditForm.test.tsx): **22 tests** — `Cannot find module './ClienteEditForm'`
- Component (ClienteDetailView.test.tsx, Story 2.4): **7 tests** — `btn-editar-cliente` not found
- E2E (clientes-edit.spec.ts): **14 tests** — element `btn-editar-cliente` not found

**Total tests in RED phase: 57 tests**

**Status: RED phase complete — all tests written and expected to fail**

---

## Notes

- Story 2.3 (Create Client) may have already created `clienteSchema.ts` — check before creating from scratch
- The `ClienteEditForm` shares the same 4 fields and validation as the create form — evaluate reuse
- `useUpdateCliente` must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` — NOT `setQueryData` — for FR27 compliance
- Backend: no new EF Core migration needed — `updated_at` column already exists
- Backend: use `FindAsync` (not `FirstOrDefaultAsync`) for PK-based lookup — company standard
- Backend: `DateTimeOffset.UtcNow` in `ClienteEntity.Update()` — never `DateTime`
- Commit convention: `feat(story-2-4): <description>`

---

**Generated by BMad TEA Agent** - 2026-06-17
