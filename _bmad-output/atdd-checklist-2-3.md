# ATDD Checklist — Epic 2, Story 2.3: Create Client

**Date:** 2026-06-16
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** Component + API Integration + E2E
**Story ID:** 2-3
**Status:** RED Phase — all tests failing (implementation does not yet exist)

---

## Story Summary

A commercial team member can register a new client by clicking "Nuevo cliente" on the `/clientes` view, which opens a dialog form with four required fields (Nombre, NIT/RUC, Teléfono, Ciudad). On successful submission, the client is immediately visible in the list and a success toast appears. Validation prevents submission with empty fields, duplicate NITs surface a clear inline error, and all error paths hide internal details from the user.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **AC1** — Given on `/clientes`, when clicking "Nuevo cliente", then a dialog form opens with Nombre, NIT/RUC, Teléfono, Ciudad fields (all required). No navigation away from `/clientes`.
2. **AC2** — Given all fields filled and submitted, when POST /api/v1/clientes succeeds (201), then the list is refreshed via `invalidateQueries(['clientes'])`, a toast "Cliente creado correctamente" appears, and the dialog closes automatically.
3. **AC3** — Given one or more required fields empty and submitted, when Zod validates on submit, then inline errors appear per field and NO POST is made to the backend.
4. **AC4** — Given a duplicate NIT/RUC submitted and backend returns 409, then "El NIT/RUC ya está registrado" appears inline under the NIT field. No raw error shown (NFR6). Dialog stays open.
5. **AC5** — Given the form is open, when clicking "Cancelar" or dismissing, then no API call is made and the client list is unchanged.
6. **AC6** — Given a non-409 backend error (e.g., 500), when `onError` fires, then toast "No se pudo crear el cliente. Intenta de nuevo." is shown. Raw error never shown (NFR6).

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `e2e/tests/clientes/2-3-create-client.spec.ts`

- **Test:** TC-E2-P0-07 — creating a client shows toast "Cliente creado correctamente"
  - **Status:** RED — fails because `POST /api/v1/clientes` endpoint does not exist
  - **Verifies:** AC2, FR27 — success toast on client creation (full-stack)

- **Test:** TC-E2-P0-07 — new client appears in left panel list immediately (FR27)
  - **Status:** RED — fails because list invalidation (`invalidateQueries`) not implemented
  - **Verifies:** AC2, FR27 — immediate visibility in the list without page reload

- **Test:** TC-E2-P0-07 — form dialog closes automatically after successful creation
  - **Status:** RED — fails because dialog close on success not implemented
  - **Verifies:** AC2 — dialog auto-close after mutation success

- **Test:** TC-E2-P0-07 — URL remains /clientes after creation (no navigation)
  - **Status:** RED — fails because form/dialog not implemented
  - **Verifies:** AC1 — split-panel layout constraint, no navigation away

- **Test:** Submit button loading state while isPending
  - **Status:** RED — fails because `isPending` state and "Guardando..." not implemented
  - **Verifies:** AC2 — button disabled with loading text during mutation

- **Test:** AC5 — Cancel does not make POST request
  - **Status:** RED — fails because "Nuevo cliente" button and dialog not implemented
  - **Verifies:** AC5 — cancel/dismiss makes no API call

---

### API Tests (13 tests)

**File:** `e2e/tests/api/2-3-create-client.api.spec.ts`

**TC-E2-P0-02 group (5 tests):**

- **Test:** POST returns HTTP 201 Created with valid body
  - **Status:** RED — fails because `POST /api/v1/clientes` endpoint does not exist
  - **Verifies:** TC-E2-P0-02, FR1 — basic create returns 201

- **Test:** POST response body contains id, nombre, nit, telefono, ciudad
  - **Status:** RED — fails because endpoint not implemented
  - **Verifies:** TC-E2-P0-02 — response body shape (ClienteDto contract)

- **Test:** POST response body contains a valid UUID as id
  - **Status:** RED — fails because endpoint not implemented
  - **Verifies:** TC-E2-P0-02 — UUID generated for new entity

- **Test:** Newly created client appears in subsequent GET /api/v1/clientes
  - **Status:** RED — fails because endpoint not implemented
  - **Verifies:** TC-E2-P0-02, FR27 — persistence confirmed by list query

- **Test:** POST response includes createdAt and updatedAt timestamps
  - **Status:** RED — fails because endpoint not implemented
  - **Verifies:** TC-E2-P0-02 — DateTimeOffset fields present

**TC-E2-P0-03 group (6 tests):**

- **Test:** POST with empty body returns HTTP 400
  - **Status:** RED — fails because FluentValidation not wired up
  - **Verifies:** TC-E2-P0-03, FR8 — validation gate

- **Test:** POST empty body returns Content-Type application/problem+json
  - **Status:** RED — fails because endpoint not implemented
  - **Verifies:** TC-E2-P0-03, NFR6 — Problem Details RFC 7807 format

- **Test:** POST empty body response contains errors for Nombre field
  - **Status:** RED — fails because validator not implemented
  - **Verifies:** TC-E2-P0-03, TC-E2-P2-05 — field-level error for Nombre

- **Test:** POST empty body response contains errors for Nit field
  - **Status:** RED — fails because validator not implemented
  - **Verifies:** TC-E2-P0-03 — field-level error for Nit

- **Test:** POST empty body response contains errors for Telefono field
  - **Status:** RED — fails because validator not implemented
  - **Verifies:** TC-E2-P0-03 — field-level error for Telefono

- **Test:** POST empty body response contains errors for Ciudad field
  - **Status:** RED — fails because validator not implemented
  - **Verifies:** TC-E2-P0-03 — field-level error for Ciudad

- **Test:** POST empty body response does NOT contain stackTrace (NFR6)
  - **Status:** RED — fails because endpoint not implemented (no data to check)
  - **Verifies:** TC-E2-P0-03, NFR6 — no internal error details exposed

**TC-E2-P0-04 group (5 tests):**

- **Test:** POST with duplicate NIT returns HTTP 409 Conflict
  - **Status:** RED — fails because `uk_clientes_nit` unique constraint and 409 handler not implemented
  - **Verifies:** TC-E2-P0-04, R-002 — duplicate NIT detection

- **Test:** Duplicate NIT response has Content-Type application/problem+json
  - **Status:** RED — fails because ExceptionHandlingMiddleware 409 handler not implemented
  - **Verifies:** TC-E2-P0-04 — Problem Details format for 409

- **Test:** Duplicate NIT response body contains human-readable detail message
  - **Status:** RED — fails because 409 handler not implemented
  - **Verifies:** TC-E2-P0-04, NFR6 — human-readable error message

- **Test:** Duplicate NIT response detail contains "NIT" reference
  - **Status:** RED — fails because 409 handler not implemented
  - **Verifies:** TC-E2-P0-04 — message points to the conflicting field

- **Test:** Duplicate NIT response does NOT contain stackTrace (NFR6)
  - **Status:** RED — fails because endpoint not implemented
  - **Verifies:** TC-E2-P0-04, NFR6 — internal error suppression

**TC-E2-P2-05 group (2 tests):**

- **Test:** Validation error messages are human-readable (not code/identifier)
  - **Status:** RED — fails because validator not implemented
  - **Verifies:** TC-E2-P2-05 — Spanish human-readable messages from CreateClienteRequestValidator

- **Test:** All four fields produce at least one error when request is empty
  - **Status:** RED — fails because validator not implemented
  - **Verifies:** TC-E2-P2-05 — complete validation coverage

---

### Component Tests (18 tests)

**File:** `e2e/tests/component/2-3-create-client.component.spec.ts`

**AC1 group — Dialog opens with required fields (7 tests):**

- "Nuevo cliente" button is visible on /clientes — **RED** (button not implemented)
- Clicking "Nuevo cliente" opens a dialog/modal — **RED** (dialog not implemented)
- Form dialog contains Nombre input field — **RED** (ClienteForm not implemented)
- Form dialog contains NIT/RUC input field — **RED** (ClienteForm not implemented)
- Form dialog contains Teléfono input field — **RED** (ClienteForm not implemented)
- Form dialog contains Ciudad input field — **RED** (ClienteForm not implemented)
- Form dialog contains "Crear cliente" submit button — **RED** (ClienteForm not implemented)
- Form dialog contains "Cancelar" button — **RED** (ClienteForm not implemented)

**TC-E2-P0-08 / AC3 group — Validation prevents submission (5 tests):**

- Submitting empty form shows inline error on Nombre field — **RED** (Zod + RHF not implemented)
- Submitting empty form shows inline error on NIT/RUC field — **RED**
- Submitting empty form shows inline error on Teléfono field — **RED**
- Submitting empty form shows inline error on Ciudad field — **RED**
- Submitting empty form does NOT make a POST request — **RED**

**TC-E2-P2-06 / AC4 group — 409 inline error (3 tests):**

- 409 response shows "El NIT/RUC ya está registrado" inline — **RED** (409 handling in ClienteForm not implemented)
- 409 response does NOT show raw error to user (NFR6) — **RED**
- After 409, dialog stays open so user can correct NIT — **RED**

**AC2 group — Success path (2 tests):**

- Successful submission shows toast "Cliente creado correctamente" — **RED** (useCreateCliente hook not implemented)
- Dialog closes automatically after successful submission — **RED**

**AC5 group — Cancel (2 tests):**

- Clicking "Cancelar" closes the dialog — **RED** (dialog not implemented)
- Clicking "Cancelar" does NOT make a POST request — **RED**

**AC6 group — Non-409 error (2 tests):**

- 500 error shows toast "No se pudo crear el cliente. Intenta de nuevo." — **RED** (error handling in useCreateCliente not implemented)
- 500 error does NOT show raw error details (NFR6) — **RED**

---

## Data Factories

### Cliente Factory (existing — reused)

**File:** `e2e/helpers/data.helper.ts`

**Exports (existing):**
- `buildCliente(overrides?)` — generates `{ nombre, nit, telefono, ciudad }` with unique counter-based values

**Notes:** The existing factory is sufficient for Story 2.3. The `nit` field uses a counter-based unique value. For duplicate NIT scenarios, tests pass explicit NIT strings (e.g., `'900-ATDD-DUP-001'`).

---

## Fixtures

### Base Fixture (existing — reused)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures (existing):**
- `clientesPage` — navigates to `/clientes` before the test and provides auto-setup

**Notes:** The E2E tests in `2-3-create-client.spec.ts` use `ApiHelper` directly for teardown (deleting created clients by ID) to avoid test data pollution. Pattern consistent with Story 2.1 and 2.2 tests.

---

## Mock Requirements

### POST /api/v1/clientes — Success (201)

**Endpoint:** `POST /api/v1/clientes`

**Request body:**
```json
{
  "nombre": "string (required)",
  "nit": "string (required, unique)",
  "telefono": "string (required)",
  "ciudad": "string (required)"
}
```

**Success Response (201 Created):**
```json
{
  "id": "uuid-v4",
  "nombre": "Empresa Test",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-06-16T00:00:00.000Z",
  "updatedAt": "2026-06-16T00:00:00.000Z"
}
```

### POST /api/v1/clientes — Validation Failure (400)

**Failure Response (400 Bad Request):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Nombre": ["El nombre es requerido"],
    "Nit": ["El NIT/RUC es requerido"],
    "Telefono": ["El teléfono es requerido"],
    "Ciudad": ["La ciudad es requerida"]
  }
}
```

**Content-Type:** `application/problem+json`

### POST /api/v1/clientes — Duplicate NIT (409)

**Conflict Response (409 Conflict):**
```json
{
  "status": 409,
  "title": "Conflicto de datos",
  "detail": "El NIT/RUC ya está registrado"
}
```

**Content-Type:** `application/problem+json`

**Notes:**
- The `ExceptionHandlingMiddleware` must catch `DbUpdateException` when inner exception message contains `uk_clientes_nit`
- The `detail` field must be set to exactly: `"El NIT/RUC ya está registrado"`
- No stack trace, SQL text, or exception type must appear in the response body

---

## Required data-testid Attributes

### ClienteForm Component

- `error-nombre` — container for inline validation error message below Nombre field
- `error-nit` — container for inline validation error message below NIT/RUC field
- `error-telefono` — container for inline validation error message below Teléfono field
- `error-ciudad` — container for inline validation error message below Ciudad field

**Implementation example:**
```tsx
<input
  id="nombre"
  data-testid="input-nombre"
  aria-describedby="error-nombre"
  {...register('nombre')}
/>
{errors.nombre && (
  <p data-testid="error-nombre" id="error-nombre" role="alert">
    {errors.nombre.message}
  </p>
)}
```

### Clientes Route / Layout

- `clientes-list-panel` — existing, left 280px panel (already required by Story 2.1)
- `cliente-list-item` — existing, each client item in the list (already required by Story 2.1)

**Notes:**
- The "Nuevo cliente" button should use `aria-label="Crear nuevo cliente"` per architecture spec
- The submit button uses text-based role matching: `getByRole('button', { name: /crear cliente/i })`
- The dialog uses `role="dialog"` (shadcn/ui Dialog sets this automatically)

---

## Implementation Checklist

### Backend — POST /api/v1/clientes endpoint

**Target test:** TC-E2-P0-02, TC-E2-P0-03, TC-E2-P0-04, TC-E2-P2-05

- [ ] Create `CreateClienteRequest.cs` record (Nombre, Nit, Telefono, Ciudad)
- [ ] Create `CreateClienteRequestValidator.cs` — FluentValidation with Spanish messages
- [ ] Create `CreateClienteCommand.cs` record (same four fields)
- [ ] Create `CreateClienteCommandHandler.cs` — calls `ClienteEntity.Create()`, `AddAsync()`, returns `ClienteDto`
- [ ] Add `Task AddAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository`
- [ ] Implement `AddAsync` in `ClienteRepository.cs` — EF Core `Add` + `SaveChangesAsync`
- [ ] Add `app.MapPost("/api/v1/clientes", ...)` in `ClienteEndpoints.cs`
- [ ] Add unique index `uk_clientes_nit` on `nit` column in EF Core configuration or migration
- [ ] Add `DbUpdateException` handler in `ExceptionHandlingMiddleware.cs` → 409 Problem Details
- [ ] Register `ICreateClienteCommandHandler` and `IValidator<CreateClienteRequest>` in `Program.cs`
- [ ] Add `data-testid` attributes: none required (backend only)
- [ ] Run test: `npx playwright test e2e/tests/api/2-3-create-client.api.spec.ts`
- [ ] ✅ API tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Frontend — `clienteSchema.ts` Zod schema (TC-E2-P2-04)

**Target test:** TC-E2-P2-04 (Vitest unit — `clienteSchema.test.ts`)

- [ ] Create `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- [ ] Define `clienteSchema` with `nombre`, `nit`, `telefono`, `ciudad` — all `z.string().min(1, ...)`
- [ ] Export `ClienteFormData = z.infer<typeof clienteSchema>`
- [ ] Run unit test: `cd frontend && pnpm test -- clienteSchema`
- [ ] ✅ Unit test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Frontend — `useCreateCliente.ts` mutation hook (TC-E2-P2-01)

**Target test:** TC-E2-P2-01 (Vitest unit — `useCreateCliente.test.ts`)

- [ ] Add `create(data: CreateClienteRequest): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `create` in `clienteApiRepository.ts` — `POST /api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`:
  - `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['clientes'] })` + `toast.success('Cliente creado correctamente')`
  - `onError`: if 409 — return (handled in form); else `toast.error('No se pudo crear el cliente. Intenta de nuevo.')`
- [ ] Run unit test: `cd frontend && pnpm test -- useCreateCliente`
- [ ] ✅ Unit test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Frontend — `ClienteForm.tsx` component (TC-E2-P0-08, TC-E2-P2-06)

**Target tests:** TC-E2-P0-08, TC-E2-P2-06 (component spec + Playwright component spec)

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- [ ] Use React Hook Form + `zodResolver(clienteSchema)`, `mode: 'onSubmit'`
- [ ] Fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required, all in Spanish)
- [ ] Inline error messages: rendered below each field using `formState.errors.{field}.message`
- [ ] Add `data-testid` attributes: `error-nombre`, `error-nit`, `error-telefono`, `error-ciudad`
- [ ] Add `aria-describedby` linking each input to its error element (WCAG 2.1 AA)
- [ ] On 409: `setError('nit', { message: 'El NIT/RUC ya está registrado' })`
- [ ] Submit button: "Crear cliente" / "Guardando..." while `isPending`; disabled during pending
- [ ] `aria-busy={isPending}` on submit button
- [ ] Cancel button: calls `onOpenChange(false)` or passed `onCancel` prop
- [ ] On success: call `onSuccess?.()`, reset form
- [ ] Check siesa-ui-kit for `Input`, `Label`, `FormField` before using shadcn/ui
- [ ] Run component test: `npx playwright test e2e/tests/component/2-3-create-client.component.spec.ts`
- [ ] ✅ Component tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Frontend — "Nuevo cliente" button + Dialog wiring (AC1, AC5)

**Target tests:** AC1 group in component spec, TC-E2-P0-07 in E2E spec

- [ ] Update `frontend/src/routes/_app/clientes.tsx`:
  - Add `useState(false)` for `isOpen`
  - Add "Nuevo cliente" button above `ClienteListView` with `aria-label="Crear nuevo cliente"`
  - Render `<Dialog open={isOpen} onOpenChange={setIsOpen}>` with `<ClienteForm>` inside
  - Pass `onSuccess={() => setIsOpen(false)}` to `ClienteForm`
- [ ] Mirror button + dialog in `frontend/src/routes/_app/clientes.$clienteId.tsx`
- [ ] Check siesa-ui-kit for dialog/modal component before using shadcn/ui `Dialog`
- [ ] Run E2E tests: `npx playwright test e2e/tests/clientes/2-3-create-client.spec.ts`
- [ ] ✅ E2E tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all Story 2.3 tests (RED phase verification)
npx playwright test e2e/tests/api/2-3-create-client.api.spec.ts e2e/tests/component/2-3-create-client.component.spec.ts e2e/tests/clientes/2-3-create-client.spec.ts

# Run API tests only
npx playwright test e2e/tests/api/2-3-create-client.api.spec.ts

# Run component (mocked) tests only
npx playwright test e2e/tests/component/2-3-create-client.component.spec.ts

# Run E2E (full-stack) tests only
npx playwright test e2e/tests/clientes/2-3-create-client.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/component/2-3-create-client.component.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/component/2-3-create-client.component.spec.ts --debug

# Run frontend unit tests (Vitest — after implementing schema and hook)
cd frontend && pnpm test -- clienteSchema
cd frontend && pnpm test -- useCreateCliente
cd frontend && pnpm test -- ClienteForm
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (37 tests total across 3 files)
- ✅ Network-first intercepts applied in all component and mocked E2E tests
- ✅ Given-When-Then structure in all tests
- ✅ data-testid requirements listed (`error-nombre`, `error-nit`, `error-telefono`, `error-ciudad`)
- ✅ Mock requirements documented (success 201, validation 400, conflict 409)
- ✅ Test data patterns consistent with existing `buildCliente` helper
- ✅ Implementation checklist created with task-to-test mapping

**Verification:** All tests fail with "Element not found" or "Connection refused" errors — not test logic errors.

---

### GREEN Phase (DEV Team — Next Steps)

1. **Pick one failing test** starting with API tests (backend is the foundation)
2. **Implement minimal code**: start with `CreateClienteRequest` + validator + endpoint
3. **Run API tests**: `npx playwright test e2e/tests/api/2-3-create-client.api.spec.ts`
4. **Fix failures one group at a time** (P0-02 → P0-03 → P0-04 → P2-05)
5. **Move to frontend**: implement `clienteSchema`, `useCreateCliente`, `ClienteForm`
6. **Run component tests**: `npx playwright test e2e/tests/component/2-3-create-client.component.spec.ts`
7. **Wire up dialog**: update `clientes.tsx` and `clientes.$clienteId.tsx`
8. **Run E2E tests**: `npx playwright test e2e/tests/clientes/2-3-create-client.spec.ts`

**Key Principles:**
- One test at a time — don't try to fix all at once
- Minimal implementation — don't over-engineer
- Run tests frequently — immediate feedback
- Use implementation checklist above as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 37 tests pass
2. Ensure `clienteSchema.ts` is shareable with Story 2.4 (Edit Client) — it will reuse it
3. Review WCAG 2.1 AA compliance: `htmlFor`/`id` pairings, `aria-describedby`, `aria-busy`
4. Check siesa-ui-kit audit: replace any shadcn/ui components if kit equivalents exist
5. Run full epic test suite to verify no regressions

---

## Test Count Summary

| Level | File | Tests |
|-------|------|-------|
| E2E (full-stack) | `e2e/tests/clientes/2-3-create-client.spec.ts` | 6 |
| API Integration | `e2e/tests/api/2-3-create-client.api.spec.ts` | 18 |
| Component (mocked) | `e2e/tests/component/2-3-create-client.component.spec.ts` | 18 |
| **Total** | | **42** |

**Priority distribution:**
- P0 tests covered: TC-E2-P0-07 (E2E), TC-E2-P0-02, TC-E2-P0-03, TC-E2-P0-04, TC-E2-P0-08
- P2 tests covered: TC-E2-P2-01, TC-E2-P2-05, TC-E2-P2-06

---

## Notes

- **test-design-epic-2.md alignment**: all P0 and P2 test cases for Story 2.3 are covered.
- **NFR6 compliance**: dedicated tests for `stackTrace` suppression in both 400 and 409 responses.
- **R-002 mitigation** (NIT duplicate, Score 6): covered by TC-E2-P0-04 (API) and TC-E2-P2-06 (Component).
- **R-005 mitigation** (invalidateQueries, Score 4): covered by TC-E2-P2-01 (unit hook test) and TC-E2-P0-07 (E2E visibility check).
- **R-010 mitigation** (inline validation errors, Score 2): covered by TC-E2-P0-08.
- **`data-testid` attributes are mandatory** for `error-*` fields — the component tests rely on `getByTestId('error-nit')`, not text matching, for precision.
- **Playwright API tests** run against the live backend (`http://localhost:5000`) — backend must be running for API and E2E tests. Component tests use `page.route()` intercepts so no backend needed.
- **Unit tests** (Vitest) for `clienteSchema.test.ts` and `useCreateCliente.test.ts` are defined in the story task list but use a separate runner (`pnpm test` inside `frontend/`). The Playwright tests here are the integration/acceptance layer.

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: all component tests intercept `**/api/v1/clientes` BEFORE `page.goto()` to prevent race conditions
- **data-factories.md** — Factory patterns: reused existing `buildCliente` helper; explicit NITs for duplicate scenarios instead of random
- **component-tdd.md** — Component test strategies: atomic tests (one assertion per test), Given-When-Then structure
- **test-quality.md** — Deterministic tests, no hard waits (`waitForTimeout` used only for negative assertions), explicit `waitForSelector` for async elements
- **selector-resilience.md** — `data-testid` for error containers; ARIA roles (`getByRole('button', { name: ... })`) for interactive elements
- **timing-debugging.md** — `waitForSelector` used for elements that appear after async mutations; `page.waitForTimeout(300)` only for negative-case polling (no POST made)
- **test-levels-framework.md** — E2E for TC-E2-P0-07 (critical full-stack journey); API for backend contract; Component for UI form behavior

---

**Generated by BMad TEA Agent** — 2026-06-16
**Workflow:** `_bmad/bmm/testarch/atdd`
**Story:** Epic 2, Story 2.3 — Create Client
