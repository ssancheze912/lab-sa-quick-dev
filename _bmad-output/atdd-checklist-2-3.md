# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-21
**Author:** SiesaTeam
**Primary Test Level:** Component (P0) + API (P0) + E2E (P1)

---

## Story Summary

A commercial team member can register a new client by filling in a form with Nombre, NIT/RUC, Teléfono, and Ciudad. On success the client is immediately visible to all users in the list (FR27 via TanStack Query invalidation) and a Spanish success toast is shown. Duplicate NIT/RUC submissions produce an inline field error without exposing technical details.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **AC#1** — Given the user is on `/clientes`, When they click "Nuevo cliente", Then a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1)
2. **AC#2** — Given the user fills all required fields and submits, When the form is submitted, Then the client is created and appears in the list immediately (FR27), AND a toast shows "Cliente creado correctamente"
3. **AC#3** — Given the user submits the form with one or more required fields empty, When the form is validated, Then clear inline error messages appear on the empty fields (FR8), AND the form is NOT submitted to the backend
4. **AC#4** — Given the user submits a NIT/RUC that already exists, When the backend returns a 409 conflict, Then an error message "El NIT/RUC ya está registrado" appears without exposing technical details (NFR6)

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/clientes/2-3-create-client.spec.ts`

- **Test:** `[P0][TC-2.3-P0-01]` Happy path: fill all fields, submit, client in list, success toast
  - **Status:** RED — `ClienteForm` component + POST endpoint not yet implemented
  - **Verifies:** AC#1 + AC#2, FR27 (immediate list update), R-009 (TQ invalidation)

- **Test:** `[P1][TC-2.3-E-01]` "Nuevo cliente" opens form dialog with 4 fields
  - **Status:** RED — `nuevo-cliente-button` data-testid and dialog not yet implemented
  - **Verifies:** AC#1 (form opens with all required fields visible)

- **Test:** `[P1][TC-2.3-E-02]` Successful create — client visible in list immediately without reload
  - **Status:** RED — `invalidateQueries(['clientes'])` not yet wired
  - **Verifies:** AC#2, FR27, R-009

- **Test:** `[P1][TC-2.3-E-03]` Duplicate NIT/RUC — inline error, no stack trace, no generic toast
  - **Status:** RED — 409 error mapping to NIT field not yet implemented
  - **Verifies:** AC#4, R-002, NFR6

### API Tests (6 tests)

**File:** `e2e/tests/api/2-3-clientes-post.api.spec.ts`

- **Test:** `[P0][TC-2.3-P0-03]` POST duplicate NIT → 409 with title, no stackTrace
  - **Status:** RED — `POST /api/v1/clientes` endpoint not yet created
  - **Verifies:** AC#4, R-002, NFR6

- **Test:** `[P1][TC-2.3-A-01]` POST valid payload → 201 Created
  - **Status:** RED — endpoint not yet created
  - **Verifies:** AC#2

- **Test:** `[P1][TC-2.3-A-02]` POST valid payload → all required fields in response body
  - **Status:** RED — endpoint not yet created
  - **Verifies:** AC#2 (ClienteDto shape)

- **Test:** `[P1][TC-2.3-A-03]` POST valid payload → UUID id, ISO 8601 createdAt with timezone
  - **Status:** RED — endpoint not yet created
  - **Verifies:** AC#2, R-007 (DateTimeOffset)

- **Test:** `[P1][TC-2.3-A-04]` POST missing Nombre → 400 Problem Details, no stackTrace
  - **Status:** RED — FluentValidation not yet wired
  - **Verifies:** AC#3, FR8, NFR6

- **Test:** `[P1][TC-2.3-A-05]` POST all empty fields → 400
  - **Status:** RED — endpoint not yet created
  - **Verifies:** AC#3, FR8

- **Test:** `[P1][TC-2.3-A-06]` POST duplicate NIT → exactly 409
  - **Status:** RED — unique constraint + 409 mapping not yet created
  - **Verifies:** AC#4

### Component Tests (9 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx`

- **Test:** `[P0][TC-2.3-C-01]` Submit empty form → inline errors on 4 fields, no API call
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** AC#3, FR8, R-002

- **Test:** `[P0][TC-2.3-C-01b]` Empty form error messages are in Spanish
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** AC#3 (Spanish locale)

- **Test:** `[P0][TC-2.3-C-02]` Mock 409 → "El NIT/RUC ya está registrado" on NIT field
  - **Status:** RED — 409 error mapping in `useCreateCliente` not yet implemented
  - **Verifies:** AC#4, R-002

- **Test:** `[P0][TC-2.3-C-02b]` 409 with stack trace in response body → no stack trace in DOM
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** AC#4, NFR6

- **Test:** `[P1][TC-2.3-C-03]` Valid submit → onSuccess called, toast "Cliente creado correctamente"
  - **Status:** RED — `ClienteForm` + `useCreateCliente` not yet implemented
  - **Verifies:** AC#2

- **Test:** `[P1][TC-2.3-C-03b]` Valid submit → TQ invalidates clientes cache
  - **Status:** RED — `useCreateCliente` mutation not yet implemented
  - **Verifies:** AC#2, FR27, R-009

- **Test:** `[P1][TC-2.3-C-04]` Click "Cancelar" → onCancel called, no API call
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** AC#1 (cancel behavior)

- **Test:** `[P1][TC-2.3-C-04b]` Partial fill + Cancelar → onCancel called, no API call
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** AC#1

- **Test:** `[P1][TC-2.3-C-05]` isPending → submit button disabled and shows "Guardando…"
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** AC#2 (loading state)

- **Test:** `[P1][TC-2.3-C-06]` All 4 inputs have `<label>` with htmlFor in Spanish
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** AC#1, WCAG 2.1 AA

- **Test:** `[P1][TC-2.3-C-06b]` All inputs have aria-describedby attribute
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** WCAG 2.1 AA

- **Test:** `[P1][TC-2.3-C-07]` Single empty field (Teléfono) → error only on that field, no API call
  - **Status:** RED — `ClienteForm` does not exist yet
  - **Verifies:** AC#3, FR8

---

## Data Factories Used

Existing `e2e/helpers/data.helper.ts` factory `buildCliente()` is reused for E2E and API tests — no new factory needed.

For component tests, inline data is defined directly in test assertions (no factory import needed in unit/component tests).

---

## Fixtures Created

No new fixtures created. Tests use:
- `ApiHelper` from `e2e/helpers/api.helper.ts` for E2E and API test setup/teardown (create + delete client)
- Fresh `QueryClient` per test in component tests (via `makeQueryClient()` helper)
- MSW `setupServer()` per test file in component tests

---

## Mock Requirements

### POST /api/v1/clientes — Create Client

**Success Response (201 Created):**
```json
{
  "id": "00000000-0000-0000-0000-000000000099",
  "nombre": "Test Corp SA",
  "nit": "900999888-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-21T10:00:00+00:00",
  "updatedAt": "2026-06-21T10:00:00+00:00"
}
```

**Duplicate NIT Response (409 Conflict):**
```json
{
  "title": "El NIT/RUC ya está registrado.",
  "status": 409
}
```

**Validation Failure Response (400 Bad Request):**
```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Nombre": ["'Nombre' must not be empty."]
  }
}
```

**Notes:** Response must NEVER include `stackTrace`, `stack_trace`, `exception`, or `traceId` fields (NFR6).

---

## Required data-testid Attributes

### ClienteForm component

- `cliente-form-dialog` — The dialog/modal container wrapping the form
- `cliente-form-nombre` — Nombre input field
- `cliente-form-nit` — NIT/RUC input field
- `cliente-form-telefono` — Teléfono input field
- `cliente-form-ciudad` — Ciudad input field
- `cliente-form-nombre-error` — Inline error span for Nombre
- `cliente-form-nit-error` — Inline error span for NIT/RUC
- `cliente-form-telefono-error` — Inline error span for Teléfono
- `cliente-form-ciudad-error` — Inline error span for Ciudad
- `cliente-form-submit` — Submit button ("Guardar cliente" / "Guardando…")
- `cliente-form-cancel` — Cancel button ("Cancelar")

### ClienteListView changes

- `nuevo-cliente-button` — "Nuevo cliente" button that opens the form dialog

**Implementation Example:**
```tsx
<Dialog open={isCreating} onOpenChange={setIsCreating}>
  <DialogContent data-testid="cliente-form-dialog">
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="nombre">Nombre</label>
      <input
        id="nombre"
        data-testid="cliente-form-nombre"
        aria-describedby="nombre-error"
        {...register('nombre')}
      />
      {errors.nombre && (
        <span id="nombre-error" data-testid="cliente-form-nombre-error">
          {errors.nombre.message}
        </span>
      )}
      {/* ... repeat for nit, telefono, ciudad ... */}
      <button type="button" data-testid="cliente-form-cancel" onClick={onCancel}>
        Cancelar
      </button>
      <button type="submit" data-testid="cliente-form-submit" disabled={isPending}>
        {isPending ? 'Guardando…' : 'Guardar cliente'}
      </button>
    </form>
  </DialogContent>
</Dialog>
```

---

## Implementation Checklist

### Backend: POST /api/v1/clientes

**Tasks to make API tests pass (TC-2.3-A-01 through TC-2.3-A-06, TC-2.3-P0-03):**

- [ ] Create `CreateClienteRequest.cs` in `backend/src/SiesaAgents.Application/Clientes/DTOs/`
- [ ] Create `CreateClienteRequestValidator.cs` with FluentValidation `.NotEmpty()` on all 4 fields
- [ ] Add `Create()` factory method to `ClienteEntity` if not present
- [ ] Add `AddAsync(ClienteEntity): Task<ClienteEntity>` to `IClienteRepository` interface
- [ ] Implement `AddAsync` in `ClienteRepository.cs` using EF Core
- [ ] Create `CreateClienteCommand.cs` + `CreateClienteCommandHandler.cs`
- [ ] Register `POST /api/v1/clientes` in `ClienteEndpoints.cs` — 201 on success, 400 on validation fail, 409 on duplicate NIT
- [ ] Register handler + validator as Scoped in `Program.cs`
- [ ] Add required data-testid attributes: N/A (backend only)
- [ ] Run test: `npx playwright test e2e/tests/api/2-3-clientes-post.api.spec.ts`
- [ ] All 7 API tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Frontend: ClienteForm component + useCreateCliente hook

**Tasks to make component tests pass (TC-2.3-C-01 through TC-2.3-C-07):**

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts` — Zod schema with 4 required string fields
- [ ] Add `create(data: ClienteFormData): Promise<Cliente>` to `IClienteRepository` interface
- [ ] Implement `create` in `clienteApiRepository.ts` — Axios POST to `/api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` — TanStack mutation with `onSuccess` (invalidateQueries + toast) and `onError` (409 → setError, other → toast)
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` — React Hook Form + Zod resolver with all 4 fields, error spans, submit/cancel buttons
- [ ] Add all required data-testid attributes: `cliente-form-nombre`, `cliente-form-nit`, `cliente-form-telefono`, `cliente-form-ciudad`, `cliente-form-nombre-error`, `cliente-form-nit-error`, `cliente-form-telefono-error`, `cliente-form-ciudad-error`, `cliente-form-submit`, `cliente-form-cancel`, `cliente-form-dialog`
- [ ] All inputs must have `<label htmlFor>` and `aria-describedby` pointing to error span (WCAG 2.1 AA)
- [ ] Submit button shows "Guardando…" and is disabled while `isPending`
- [ ] Run test: `pnpm --filter frontend test ClienteForm`
- [ ] All 12 component tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Frontend: Wire "Nuevo cliente" button in ClienteListView

**Tasks to make E2E tests pass (TC-2.3-P0-01, TC-2.3-E-01, TC-2.3-E-02, TC-2.3-E-03):**

- [ ] Add `isCreating` state (`useState(false)`) to `ClienteListView.tsx`
- [ ] Add "Nuevo cliente" button with `data-testid="nuevo-cliente-button"` and `PlusIcon`
- [ ] Render `<Dialog open={isCreating}>` with `<ClienteForm>` inside when `isCreating` is true
- [ ] Add `data-testid="cliente-form-dialog"` to Dialog container
- [ ] Wire `onSuccess={() => setIsCreating(false)}` and `onCancel={() => setIsCreating(false)}`
- [ ] Run test: `npx playwright test e2e/tests/clientes/2-3-create-client.spec.ts`
- [ ] All 4 E2E tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run ALL failing tests for this story
npx playwright test e2e/tests/clientes/2-3-create-client.spec.ts e2e/tests/api/2-3-clientes-post.api.spec.ts
pnpm --filter frontend test ClienteForm

# Run E2E tests only
npx playwright test e2e/tests/clientes/2-3-create-client.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/2-3-create-client.spec.ts --headed

# Run API tests only
npx playwright test e2e/tests/api/2-3-clientes-post.api.spec.ts

# Run component tests only
pnpm --filter frontend test ClienteForm

# Run component tests in watch mode
pnpm --filter frontend test --watch ClienteForm

# Debug E2E test
npx playwright test e2e/tests/clientes/2-3-create-client.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (19 total across E2E, API, Component levels)
- ✅ No new fixtures/factories needed — existing `ApiHelper` + `buildCliente()` reused
- ✅ Mock requirements documented (POST 201, 400, 409 response shapes)
- ✅ data-testid requirements listed (12 attributes)
- ✅ Implementation checklist created with clear tasks

**Verification:**

- All tests will fail because `ClienteForm`, `useCreateCliente`, `clienteSchema`, `POST /api/v1/clientes` do not exist yet
- Expected failure: `Cannot find module '../ClienteForm'` for component tests
- Expected failure: connection refused / 404 for API and E2E tests until backend is implemented

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with backend** — implement `POST /api/v1/clientes` first (API tests are fastest to run)
2. **Run API tests** to confirm backend 201/400/409 behavior is correct
3. **Implement frontend application layer** — `clienteSchema.ts` + `useCreateCliente.ts`
4. **Implement `ClienteForm` component** — run component tests after each data-testid addition
5. **Wire `ClienteListView`** — add button + Dialog + `isCreating` state
6. **Run full E2E suite** for final validation

**Key Principles:**

- One test level at a time (backend → component → E2E)
- Add data-testid attributes exactly as listed above
- Toast import must come from `sonner` (check existing providers in `src/app/providers/` or `__root.tsx`)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**Criteria:**

- All 19 RED tests pass (green phase complete)
- No hard waits / `setTimeout` in component code
- `queryClient.invalidateQueries({ queryKey: ['clientes'] })` called in `onSuccess`
- 409 mapped to `setError('nit', ...)` — no generic toast for duplicate NIT

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing API tests first: `npx playwright test e2e/tests/api/2-3-clientes-post.api.spec.ts`
3. Run failing component tests: `pnpm --filter frontend test ClienteForm`
4. Begin backend implementation (Task 1 in story)
5. Implement frontend (Tasks 3, 4, 5 in story)
6. Run full E2E suite when all unit/component tests pass

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation in all E2E tests; POST intercept for 409 uses `route.request().method()` guard
- **selector-resilience.md** — All selectors use `data-testid` (highest stability tier); no CSS class selectors
- **component-tdd.md** — Red-green-refactor pattern; MSW 2.x `setupServer` with `resetHandlers` per test
- **test-quality.md** — Given-When-Then structure; auto-cleanup in `finally` blocks for API tests; fresh `QueryClient` per test
- **data-factories.md** — Reuse of existing `buildCliente()` factory from `data.helper.ts`
- **timing-debugging.md** — `waitFor` for async assertions; no `setTimeout` hard waits; network-first prevents race conditions

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected output:**

```
E2E: e2e/tests/clientes/2-3-create-client.spec.ts
  ✗ [P0][TC-2.3-P0-01] ... — FAILED: Timeout waiting for getByTestId('nuevo-cliente-button')
  ✗ [P1][TC-2.3-E-01]  ... — FAILED: Timeout waiting for getByTestId('nuevo-cliente-button')
  ✗ [P1][TC-2.3-E-02]  ... — FAILED: Timeout waiting for getByTestId('nuevo-cliente-button')
  ✗ [P1][TC-2.3-E-03]  ... — FAILED: Timeout waiting for getByTestId('nuevo-cliente-button')

API: e2e/tests/api/2-3-clientes-post.api.spec.ts
  ✗ [P0][TC-2.3-P0-03] ... — FAILED: Expected 409, received 404 (endpoint not yet created)
  ✗ [P1][TC-2.3-A-01]  ... — FAILED: Expected 201, received 404
  ... (all 7 API tests fail with 404/connection refused)

Component: frontend/src/modules/crm/clientes/presentation/__tests__/ClienteForm.test.tsx
  ✗ [P0][TC-2.3-C-01]  ... — FAILED: Cannot find module '../ClienteForm'
  ... (all 12 component tests fail with import error)
```

**Summary:**
- Total tests: 23
- Passing: 0 (expected — RED phase)
- Failing: 23 (expected)
- Status: RED phase — awaiting implementation

---

## Notes

- **`sonner` toast mock:** Component tests mock `sonner` via `vi.mock('sonner', ...)`. If the project uses a different toast library, update the mock import path in `ClienteForm.test.tsx`.
- **dotnet SDK not available in environment:** Backend API tests (`2-3-clientes-post.api.spec.ts`) require a running .NET backend — they cannot be executed locally without the SDK. Document this in Completion Notes when story is implemented.
- **`apiClient` fallback:** `VITE_API_URL ?? 'http://localhost:5000'` is already configured; MSW intercepts at the URL level so component tests work without a backend.
- **Dialog data-testid:** The `data-testid="cliente-form-dialog"` must be placed on the `DialogContent` element (not `Dialog` root) because the Dialog root may not render in the DOM when closed.

---

**Generated by BMad TEA Agent** — 2026-06-21
