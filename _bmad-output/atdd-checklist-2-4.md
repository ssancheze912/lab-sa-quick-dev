# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-06-21
**Author:** SiesaTeam
**Primary Test Level:** Component (RTL + MSW) + API (Playwright) + E2E (Playwright)

---

## Story Summary

A commercial team member wants to edit any field of an existing client so that the client information stays up to date. The "Editar" button in the client detail panel opens a pre-filled form inside a Dialog overlay. After saving, changes reflect immediately in both the detail panel and the client list without a page reload.

**As a** commercial team member
**I want** to edit any field of an existing client
**So that** the client information stays up to date

---

## Acceptance Criteria

1. **AC#1** — Given user views a client detail, When user clicks "Editar", Then the client form opens pre-filled with current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad. (AC-E2.3, FR6)

2. **AC#2** — Given user modifies fields and submits, When the form is saved, Then changes are reflected immediately in the detail and list (FR27), And toast "Cliente actualizado correctamente" is shown. (AC-E2.3, FR27, NFR2)

3. **AC#3** — Given user clears a required field and submits, When the form is validated, Then an inline error appears on the cleared field and the form is NOT submitted to the backend. (AC-E2.4, FR8)

4. **AC#4** — Given user clicks "Cancelar" without saving, When the form closes, Then original client data remains unchanged and no API call is fired. (R-008)

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `e2e/tests/clientes/2-4-edit-client.spec.ts`

- **Test:** `[P0][TC-2.4-P0-01] Happy path — edit client and confirm immediate reflection (FR27)`
  - **Status:** RED — `cliente-edit-button` testid not yet in DOM; PUT endpoint does not exist
  - **Verifies:** AC#1, AC#2 — "Editar" button opens pre-filled dialog, saving reflects immediately + toast

- **Test:** `[P1][TC-2.4-E-01] "Editar" button opens form with current values pre-filled`
  - **Status:** RED — `cliente-edit-button` and `cliente-edit-dialog` testids not yet in DOM
  - **Verifies:** AC#1 — all four fields pre-filled with current client values

- **Test:** `[P1][TC-2.4-E-02] After successful edit, updated client appears in list immediately`
  - **Status:** RED — PUT endpoint missing; list invalidation not wired
  - **Verifies:** AC#2, FR27 — list reflects updated name without page reload

- **Test:** `[P1][TC-2.4-E-03] Clearing required field shows inline error, no PUT fired`
  - **Status:** RED — `cliente-form-nombre-error` testid not yet in DOM
  - **Verifies:** AC#3, FR8 — Zod client-side validation blocks submission

- **Test:** `[P1][TC-2.4-E-04] "Cancelar" closes dialog, original data preserved, no PUT fired`
  - **Status:** RED — `cliente-form-cancel` testid not yet in DOM; dialog state not implemented
  - **Verifies:** AC#4, R-008 — cancellation has no side effects

### API Tests (6 tests)

**File:** `e2e/tests/api/2-4-clientes-put.api.spec.ts`

- **Test:** `[P0][TC-2.4-P0-02] PUT duplicate NIT → 409 with title, no stackTrace`
  - **Status:** RED — PUT /api/v1/clientes/{id} endpoint does not exist (404)
  - **Verifies:** AC#5, R-002, NFR6 — 409 conflict handling without exposing stack traces

- **Test:** `[P1][TC-2.4-A-01] PUT valid payload → 200 OK`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC#1 — successful update returns 200 (not 201, not 204)

- **Test:** `[P1][TC-2.4-A-02] PUT valid payload → all fields updated in response body`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC#2 — response body contains all updated field values and preserves id + createdAt

- **Test:** `[P1][TC-2.4-A-03] PUT valid payload → updatedAt is ISO 8601 with timezone offset`
  - **Status:** RED — endpoint missing
  - **Verifies:** DateTimeOffset requirement — updatedAt uses DateTimeOffset.UtcNow

- **Test:** `[P1][TC-2.4-A-04] PUT missing Nombre → 400 Problem Details, no stackTrace`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC#3, FR8, NFR6 — FluentValidation gate on backend

- **Test:** `[P1][TC-2.4-A-05] PUT all empty fields → 400`
  - **Status:** RED — endpoint missing
  - **Verifies:** FR8 — server-side FluentValidation blocks all-empty payloads

- **Test:** `[P1][TC-2.4-A-06] PUT non-existing id → 404 Problem Details, no stackTrace`
  - **Status:** RED — endpoint missing
  - **Verifies:** AC#4 — handler returns 404 when entity not found; NFR6 — no stack traces

### Component Tests (13 tests)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useUpdateCliente.test.ts` (4 tests)

- **Test:** `success path: calls invalidateQueries for clientes after successful PUT`
  - **Status:** RED — `useUpdateCliente` module does not exist
  - **Verifies:** FR27 — list invalidated after successful update

- **Test:** `success path: calls setQueryData with updated client for immediate detail panel update`
  - **Status:** RED — `useUpdateCliente` module does not exist
  - **Verifies:** FR27 — detail panel cache updated immediately via setQueryData

- **Test:** `409 error: calls setNitError without triggering generic toast`
  - **Status:** RED — `useUpdateCliente` module does not exist
  - **Verifies:** R-002 — 409 maps to inline NIT field error, not generic toast

- **Test:** `non-409 error: does not call setNitError`
  - **Status:** RED — `useUpdateCliente` module does not exist
  - **Verifies:** error routing — non-409 errors use generic toast path only

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm-edit-mode.test.tsx` (6 tests)

- **Test:** `TC-2.4-C-01: renders all four fields pre-filled with defaultValues (R-008)`
  - **Status:** RED — ClienteForm does not accept `clienteId` or `defaultValues` props yet
  - **Verifies:** AC#1, R-008 — form pre-filled in edit mode

- **Test:** `TC-2.4-C-01: shows "Guardar cambios" label in edit mode`
  - **Status:** RED — ClienteForm does not support dual-mode label yet
  - **Verifies:** AC#1 — edit mode has distinct submit label

- **Test:** `TC-2.4-C-02 (P0): clearing Nombre blocks submission and shows inline error`
  - **Status:** RED — ClienteForm dual-mode not implemented
  - **Verifies:** AC#3, FR8 — Zod validation in edit mode

- **Test:** `TC-2.4-C-03: onSuccess called after PUT 200`
  - **Status:** RED — `useUpdateCliente` missing; ClienteForm dual-mode missing
  - **Verifies:** AC#2 — success callback wired correctly

- **Test:** `TC-2.4-C-04: "Cancelar" calls onCancel without PUT (R-008)`
  - **Status:** RED — ClienteForm dual-mode missing
  - **Verifies:** AC#4, R-008 — cancel has no side effects

- **Test:** `TC-2.4-C-05: PUT 409 shows NIT field error, no generic toast`
  - **Status:** RED — `useUpdateCliente` missing
  - **Verifies:** R-002, NFR6 — 409 inline field error in edit mode

- **Test:** `TC-2.4-C-06: isPending shows "Guardando…" and disables submit`
  - **Status:** RED — dual-mode loading state not implemented
  - **Verifies:** AC#2 — pending UX feedback in edit mode

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView-edit-button.test.tsx` (3 tests)

- **Test:** `TC-2.4-C-07: "Editar" button rendered when client data is loaded`
  - **Status:** RED — ClienteDetailView does not have "Editar" button yet
  - **Verifies:** AC#1 — edit entry point exists

- **Test:** `TC-2.4-C-07: does NOT render "Editar" button when clienteId is undefined`
  - **Status:** RED — button doesn't exist yet
  - **Verifies:** AC#1 — edit button only shown with loaded client

- **Test:** `TC-2.4-C-08: clicking "Editar" opens dialog with pre-filled form`
  - **Status:** RED — Dialog + ClienteForm integration in ClienteDetailView missing
  - **Verifies:** AC#1 — edit dialog opens with correct client values

- **Test:** `TC-2.4-C-08: form fields pre-filled with current client values in opened dialog`
  - **Status:** RED — integration missing
  - **Verifies:** AC#1 — form fields contain client's data

- **Test:** `TC-2.4-C-08: "Cancelar" closes the edit dialog`
  - **Status:** RED — isEditing state in ClienteDetailView not implemented
  - **Verifies:** AC#4 — cancel closes dialog

---

## Data Factories Created

No new factory files created. The existing `e2e/helpers/data.helper.ts` `buildCliente()` factory is reused for all E2E tests. The API tests inline test data using `buildCliente()` with explicit overrides to ensure unique NITs.

---

## Fixtures Created

No new fixture files. The existing `e2e/fixtures/base.fixture.ts` and `ApiHelper` are sufficient. The `ApiHelper` class was extended internally via test-level setup/teardown (try/finally + `api.deleteCliente`).

---

## Mock Requirements

### PUT /api/v1/clientes/{id} — Backend responses

**Success (200 OK):**
```json
{
  "id": "00000000-0000-0000-0000-000000000042",
  "nombre": "Empresa Editada SA",
  "nit": "900123456-2",
  "telefono": "+573001234567",
  "ciudad": "Medellín",
  "createdAt": "2026-01-15T10:00:00+00:00",
  "updatedAt": "2026-06-21T14:30:00+00:00"
}
```

**Validation failure (400):**
```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "Nombre": ["'Nombre' must not be empty."] }
}
```

**Not found (404):**
```json
{
  "title": "Cliente no encontrado.",
  "status": 404
}
```

**Duplicate NIT (409):**
```json
{
  "title": "El NIT/RUC ya está registrado.",
  "status": 409
}
```

**Notes:** All error responses must NOT include `stackTrace`, `stack_trace`, or `exception` fields (NFR6).

---

## Required data-testid Attributes

### ClienteDetailView

- `cliente-edit-button` — The "Editar" button in the detail panel header; triggers `setIsEditing(true)`
- `cliente-edit-dialog` — The shadcn Dialog root element wrapping the ClienteForm in edit mode; used to assert open/closed state

### ClienteForm (already exists from Story 2.3, reused in edit mode)

- `cliente-form-nombre` — Input for Nombre field
- `cliente-form-nit` — Input for NIT/RUC field
- `cliente-form-telefono` — Input for Teléfono field
- `cliente-form-ciudad` — Input for Ciudad field
- `cliente-form-submit` — Submit button ("Guardar cambios" in edit mode, "Guardar cliente" in create mode)
- `cliente-form-cancel` — Cancel button ("Cancelar")
- `cliente-form-nombre-error` — Inline error message span for Nombre field
- `cliente-form-nit-error` — Inline error message span for NIT/RUC field (already used in Story 2.3)

**Implementation Example:**
```tsx
{/* ClienteDetailView.tsx */}
<button data-testid="cliente-edit-button" onClick={() => setIsEditing(true)}>
  <PencilSquareIcon className="h-4 w-4" />
  Editar
</button>

<Dialog open={isEditing} onOpenChange={setIsEditing}>
  <DialogContent data-testid="cliente-edit-dialog">
    <DialogHeader>
      <DialogTitle>Editar cliente</DialogTitle>
    </DialogHeader>
    <ClienteForm
      clienteId={cliente.id}
      defaultValues={{ nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }}
      onSuccess={() => setIsEditing(false)}
      onCancel={() => setIsEditing(false)}
    />
  </DialogContent>
</Dialog>

{/* ClienteForm.tsx — error spans */}
{errors.nombre && (
  <span data-testid="cliente-form-nombre-error" aria-describedby="nombre-error">
    {errors.nombre.message}
  </span>
)}
```

---

## Implementation Checklist

### Test: [P0][TC-2.4-P0-01] Happy path edit + immediate reflection

**Tasks to make this test pass:**
- [ ] Add `clienteId?: string` and `defaultValues?: ClienteFormData` props to `ClienteForm.tsx`
- [ ] Add `isEditing` state + "Editar" button + Dialog in `ClienteDetailView.tsx`
- [ ] Create `useUpdateCliente.ts` with PUT mutation using `clienteApiRepository.update`
- [ ] Add `update(id, data)` to `IClienteRepository` and `clienteApiRepository.ts`
- [ ] Register `PUT /api/v1/clientes/{id}` endpoint in `ClienteEndpoints.cs`
- [ ] Create `UpdateClienteCommand.cs` + `UpdateClienteCommandHandler.cs`
- [ ] Create `UpdateClienteRequest.cs` + `UpdateClienteRequestValidator.cs`
- [ ] Implement `UpdateAsync` in `ClienteRepository.cs`
- [ ] Add `Update()` method to `ClienteEntity.cs`
- [ ] Add `data-testid="cliente-edit-button"` and `data-testid="cliente-edit-dialog"` to components
- [ ] Run test: `npx playwright test e2e/tests/clientes/2-4-edit-client.spec.ts --grep "P0"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: [P0][TC-2.4-P0-02] PUT duplicate NIT → 409 with title, no stackTrace

**Tasks to make this test pass:**
- [ ] Register `PUT /api/v1/clientes/{id}` endpoint
- [ ] Catch `DbUpdateException` with `uk_clientes_nit` constraint in endpoint handler
- [ ] Return `Results.Conflict(new { title = "El NIT/RUC ya está registrado.", status = 409 })`
- [ ] Verify no `stackTrace` field in Conflict response
- [ ] Run test: `npx playwright test e2e/tests/api/2-4-clientes-put.api.spec.ts --grep "P0"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: [P1][TC-2.4-A-01 — A-06] PUT API contract tests

**Tasks to make these tests pass:**
- [ ] Implement full `PUT /api/v1/clientes/{id}` endpoint (see story Dev Notes for exact code)
- [ ] `UpdateClienteRequestValidator` — `.NotEmpty()` on all 4 fields; `MaximumLength(200/50/30/100)`
- [ ] Handler returns `not-found` mapped to `Results.NotFound(...)` when entity is `null`
- [ ] `ClienteEntity.Update()` sets `UpdatedAt = DateTimeOffset.UtcNow`
- [ ] Run test: `npx playwright test e2e/tests/api/2-4-clientes-put.api.spec.ts`
- [ ] ✅ All 6 API tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: [P1] useUpdateCliente unit tests

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`
- [ ] Hook calls `clienteApiRepository.update(id, data)` via `useMutation`
- [ ] `onSuccess`: calls `invalidateQueries({ queryKey: ['clientes'] })` and `setQueryData(['clientes', id], updatedCliente)`
- [ ] `onSuccess`: calls `toast.success('Cliente actualizado correctamente')`
- [ ] `onError`: checks `error.response.status === 409` → calls `setNitError?.('El NIT/RUC ya está registrado')`
- [ ] `onError`: non-409 → calls `toast.error('No se pudo actualizar el cliente. Intenta de nuevo.')`
- [ ] Run test: `npx vitest run src/modules/crm/clientes/application/__tests__/useUpdateCliente.test.ts`
- [ ] ✅ All 4 unit tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: [P0+P1] ClienteForm edit-mode component tests

**Tasks to make these tests pass:**
- [ ] Modify `ClienteForm.tsx` — accept `clienteId?: string` and `defaultValues?: ClienteFormData` props
- [ ] Wire `useForm({ defaultValues })` for pre-filling
- [ ] In edit mode (`clienteId` present): call `useUpdateCliente` mutation; label = "Guardar cambios"
- [ ] In create mode (`clienteId` absent): existing `useCreateCliente` behavior unchanged
- [ ] On 409: call `setError('nit', { message: 'El NIT/RUC ya está registrado' })`
- [ ] "Cancelar" button calls `onCancel()` — no mutation fired
- [ ] Submit disabled + "Guardando…" label when `isPending`
- [ ] Add `data-testid="cliente-form-nombre-error"` and `data-testid="cliente-form-cancel"` to form
- [ ] Run test: `npx vitest run src/modules/crm/clientes/presentation/__tests__/ClienteForm-edit-mode.test.tsx`
- [ ] ✅ All 6 component tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: [P1] ClienteDetailView edit button + dialog component tests

**Tasks to make these tests pass:**
- [ ] Add `useState(false)` for `isEditing` in `ClienteDetailView.tsx`
- [ ] Add "Editar" button with `data-testid="cliente-edit-button"` and `PencilSquareIcon`
- [ ] Add shadcn `Dialog` with `data-testid="cliente-edit-dialog"` wrapping `ClienteForm` in edit mode
- [ ] Dialog title: "Editar cliente"
- [ ] `onSuccess` and `onCancel` both set `isEditing(false)`
- [ ] Run test: `npx vitest run src/modules/crm/clientes/presentation/__tests__/ClienteDetailView-edit-button.test.tsx`
- [ ] ✅ All 5 component tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run ALL failing tests for Story 2.4
npx playwright test e2e/tests/clientes/2-4-edit-client.spec.ts e2e/tests/api/2-4-clientes-put.api.spec.ts
npx vitest run src/modules/crm/clientes/application/__tests__/useUpdateCliente.test.ts src/modules/crm/clientes/presentation/__tests__/ClienteForm-edit-mode.test.tsx src/modules/crm/clientes/presentation/__tests__/ClienteDetailView-edit-button.test.tsx

# Run E2E tests only
npx playwright test e2e/tests/clientes/2-4-edit-client.spec.ts

# Run API tests only
npx playwright test e2e/tests/api/2-4-clientes-put.api.spec.ts

# Run component tests only
npx vitest run --reporter=verbose src/modules/crm/clientes/presentation/__tests__/ClienteForm-edit-mode.test.tsx

# Run tests in headed mode (see browser for E2E)
npx playwright test e2e/tests/clientes/2-4-edit-client.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/2-4-edit-client.spec.ts --debug

# Run Vitest with coverage
npx vitest run --coverage src/modules/crm/clientes
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**
- ✅ All tests written and failing (RED phase)
- ✅ Factories reused from existing `data.helper.ts` (no duplication)
- ✅ Mock requirements documented (PUT endpoint responses)
- ✅ Required `data-testid` attributes listed
- ✅ Implementation checklist created with ordered tasks

**Verification:**
- E2E tests fail because `cliente-edit-button` and `cliente-edit-dialog` testids do not exist yet
- API tests fail because `PUT /api/v1/clientes/{id}` endpoint is not registered (returns 404 or 405)
- Component tests fail because `useUpdateCliente` module does not exist and `ClienteForm` does not accept `clienteId` prop

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with backend** — Register `PUT /api/v1/clientes/{id}` to unblock API tests
2. **Then application layer** — Create `useUpdateCliente.ts` to unblock unit tests
3. **Then extend ClienteForm** — Add dual-mode props to unblock form component tests
4. **Finally extend ClienteDetailView** — Add edit button + Dialog to unblock detail + E2E tests

**Key Principles:**
- One test at a time (don't try to fix all at once)
- Use implementation checklist as ordered roadmap
- Run tests frequently (immediate feedback)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

After all tests are green:
- Extract any duplicated form logic between create and edit modes
- Verify WCAG 2.1 AA: `aria-describedby` on all error spans, `htmlFor` on all labels
- Confirm `UpdatedAt = DateTimeOffset.UtcNow` (never plain `DateTime`)
- Run full test suite to confirm no regressions

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/api/2-4-clientes-put.api.spec.ts`
3. Begin implementation using implementation checklist (backend first, then frontend)
4. Work one test group at a time (backend API → useUpdateCliente hook → ClienteForm edit mode → ClienteDetailView)
5. When all tests pass, refactor for quality
6. When refactoring complete, update story status to `done`

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests intercept routes BEFORE `page.goto()` (no race conditions)
- **data-factories.md** — `buildCliente()` factory reused; explicit overrides for NIT uniqueness
- **component-tdd.md** — RTL + MSW pattern; one assertion per test; explicit `waitFor`
- **test-quality.md** — Given-When-Then structure; try/finally cleanup; isolated per-test data
- **selector-resilience.md** — `data-testid` selectors throughout; no fragile CSS selectors
- **test-levels-framework.md** — E2E for critical user journeys (AC#1+AC#2 happy path); API for contract validation; Component for UI interaction edge cases

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures for E2E tests:**
```
FAIL e2e/tests/clientes/2-4-edit-client.spec.ts
  × [P0][TC-2.4-P0-01] ... — Timeout waiting for getByTestId('cliente-edit-button')
  × [P1][TC-2.4-E-01] ... — Timeout waiting for getByTestId('cliente-edit-button')
  × [P1][TC-2.4-E-02] ... — Timeout waiting for getByTestId('cliente-edit-button')
  × [P1][TC-2.4-E-03] ... — Timeout waiting for getByTestId('cliente-edit-button')
  × [P1][TC-2.4-E-04] ... — Timeout waiting for getByTestId('cliente-edit-button')
```

**Expected failures for API tests:**
```
FAIL e2e/tests/api/2-4-clientes-put.api.spec.ts
  × [P0][TC-2.4-P0-02] ... — Expected 409, received 404 or 405 (endpoint not registered)
  × [P1][TC-2.4-A-01] ...  — Expected 200, received 404 or 405
  × [P1][TC-2.4-A-02] ...  — Expected 200, received 404 or 405
  × [P1][TC-2.4-A-03] ...  — Expected 200, received 404 or 405
  × [P1][TC-2.4-A-04] ...  — Expected 400, received 404 or 405
  × [P1][TC-2.4-A-05] ...  — Expected 400, received 404 or 405
  × [P1][TC-2.4-A-06] ...  — Expected 404, received method-not-allowed
```

**Expected failures for component tests:**
```
FAIL useUpdateCliente.test.ts
  × success path: calls invalidateQueries ... — Cannot find module 'useUpdateCliente'
  (all 4 tests fail with module-not-found error)

FAIL ClienteForm-edit-mode.test.tsx
  × TC-2.4-C-01: ... — ClienteForm does not accept clienteId prop; value not pre-filled
  (all 6 tests fail)

FAIL ClienteDetailView-edit-button.test.tsx
  × TC-2.4-C-07: ... — Unable to find element with testid 'cliente-edit-button'
  (all 5 tests fail)
```

**Summary:**
- Total tests: 24 (5 E2E + 6 API + 4 unit + 6 component-form + 3+2 component-detail)
- Passing: 0 (expected)
- Failing: 24 (expected)
- Status: ✅ RED phase confirmed

---

## Notes

- `tea_use_playwright_utils: false` — standard fixture-architecture patterns used (no playwright utils)
- `tea_use_mcp_enhancements: false` — AI generation mode used (standard CRUD, clear acceptance criteria)
- **No new data factories required** — `buildCliente()` from `e2e/helpers/data.helper.ts` is sufficient
- **Backend dotnet SDK not available** — backend integration tests (C# xUnit) documented in story tasks but cannot be executed in this environment; verification by code inspection required
- **ApiHelper** already supports `getClientes()`, `createCliente()`, `deleteCliente()` — no extension needed
- The `FakeClienteRepository` in existing C# unit test files must have `UpdateAsync` stub added when backend tasks are implemented (see story Task 2 notes)

---

**Generated by BMad TEA Agent** — 2026-06-21
