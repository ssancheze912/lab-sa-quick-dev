# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-30
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component + Unit

---

## Story Summary

A commercial team member needs to register new clients via a form on `/clientes`. The form requires four fields (Nombre, NIT/RUC, Teléfono, Ciudad) and must validate them before submission. Successful creation shows the client in the list immediately with a success toast. Duplicate NIT conflicts must be surfaced as a business-friendly error without exposing technical details (NFR6).

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **AC1** — Given the user is on `/clientes`, When the user clicks "Nuevo cliente", Then a form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required per FR1).

2. **AC2** — Given the user fills all required fields and submits, When the form is submitted, Then the client is created and appears in the client list immediately (FR27), And a success toast shows "Cliente creado correctamente".

3. **AC3** — Given the user submits the form with one or more required fields empty, When the form is validated, Then clear inline error messages appear on the empty fields (FR8), And the form is NOT submitted to the backend.

4. **AC4** — Given the user submits a NIT/RUC that already exists in the system, When the backend returns a 409 conflict, Then an error message indicates "El NIT/RUC ya está registrado" without exposing technical details (NFR6).

---

## Failing Tests Created (RED Phase)

### E2E Tests (13 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts`

**AC1 — Nuevo cliente form opens with required fields (6 tests)**

- RED **Test:** should show "Nuevo cliente" button on /clientes view
  - **Status:** RED — `ClienteListView` has no "Nuevo cliente" button yet
  - **Verifies:** AC1 button presence

- RED **Test:** should open form dialog when "Nuevo cliente" is clicked
  - **Status:** RED — button + dialog not implemented
  - **Verifies:** AC1 form opens as dialog

- RED **Test:** should render Nombre field in the form
  - **Status:** RED — `ClienteForm` component does not exist
  - **Verifies:** AC1 Nombre field with label

- RED **Test:** should render NIT/RUC field in the form
  - **Status:** RED — `ClienteForm` component does not exist
  - **Verifies:** AC1 NIT/RUC field with label

- RED **Test:** should render Teléfono field in the form
  - **Status:** RED — `ClienteForm` component does not exist
  - **Verifies:** AC1 Teléfono field with label

- RED **Test:** should render Ciudad field in the form
  - **Status:** RED — `ClienteForm` component does not exist
  - **Verifies:** AC1 Ciudad field with label

- RED **Test:** should render form with data-testid="cliente-form"
  - **Status:** RED — `data-testid="cliente-form"` not yet added
  - **Verifies:** AC1 + testid contract

**AC2 — Valid submission (4 tests)**

- RED **Test:** should close the form after successful creation
  - **Status:** RED — form submit flow not implemented
  - **Verifies:** AC2 form closes on success

- RED **Test:** should show success toast "Cliente creado correctamente" after valid submission
  - **Status:** RED — `useCreateCliente` onSuccess not implemented
  - **Verifies:** AC2 success toast exact text

- RED **Test:** should appear in client list immediately after creation
  - **Status:** RED — query invalidation not implemented
  - **Verifies:** AC2 + FR27 immediate list refresh

- RED **Test:** should keep submit button disabled and show loading state while pending
  - **Status:** RED — isPending state not wired to button
  - **Verifies:** AC2 pending UX

**AC3 — Required field validation (6 tests)**

- RED **Test:** should show inline error on Nombre field when empty and submitted
  - **Status:** RED — Zod schema + RHF validation not implemented
  - **Verifies:** AC3 + FR8 Nombre inline error

- RED **Test:** should show inline error on NIT/RUC field when empty and submitted
  - **Status:** RED — Zod schema validation not implemented
  - **Verifies:** AC3 + FR8 NIT inline error

- RED **Test:** should show inline error on Teléfono field when empty and submitted
  - **Status:** RED — Zod schema validation not implemented
  - **Verifies:** AC3 Teléfono inline error

- RED **Test:** should show inline error on Ciudad field when empty and submitted
  - **Status:** RED — Zod schema validation not implemented
  - **Verifies:** AC3 Ciudad inline error

- RED **Test:** should NOT submit form to backend when required fields are empty
  - **Status:** RED — form validation gate not implemented
  - **Verifies:** AC3 no backend call on invalid submit

- RED **Test:** should close form when "Cancelar" is clicked without submitting
  - **Status:** RED — `ClienteForm` props not implemented
  - **Verifies:** AC3 cancel behavior

**AC4 — Duplicate NIT (3 tests)**

- RED **Test:** should display "El NIT/RUC ya está registrado" on 409 conflict
  - **Status:** RED — onError 409 handling not implemented
  - **Verifies:** AC4 specific error message

- RED **Test:** should NOT expose technical error details on 409 conflict (NFR6)
  - **Status:** RED — NFR6 compliance not verified
  - **Verifies:** AC4 + NFR6 no technical leak

- RED **Test:** should keep the form open after 409 conflict so user can correct NIT
  - **Status:** RED — onError does not keep form open
  - **Verifies:** AC4 UX on conflict

---

### API Tests (12 tests)

**File:** `e2e/tests/api/clientes-create.api.spec.ts`

**AC2 — POST /api/v1/clientes happy path (4 tests)**

- RED **Test:** should return 201 Created when all required fields are provided
  - **Status:** RED — `CreateClienteCommandValidator` not yet added; endpoint may return 201 but no FluentValidation is in place
  - **Verifies:** AC2 API contract 201

- RED **Test:** should return ClienteDto with correct shape on 201
  - **Status:** RED — ClienteDto shape unverified for this story
  - **Verifies:** AC2 response shape

- RED **Test:** should return content-type application/json on 201
  - **Status:** RED — pending validator setup
  - **Verifies:** AC2 content type

- RED **Test:** should have the new client appear in GET /api/v1/clientes list
  - **Status:** RED — depends on 201 success
  - **Verifies:** AC2 + FR27 persistence

**AC3 — Backend validation (5 tests)**

- RED **Test:** should return 400 when nombre is missing
  - **Status:** RED — `CreateClienteCommandValidator` does not exist yet (CRITICAL from Story 2.2 review)
  - **Verifies:** AC3 backend validation

- RED **Test:** should return 400 when nit is missing
  - **Status:** RED — same as above
  - **Verifies:** AC3

- RED **Test:** should return 400 when telefono is missing
  - **Status:** RED — same as above
  - **Verifies:** AC3

- RED **Test:** should return 400 when ciudad is missing
  - **Status:** RED — same as above
  - **Verifies:** AC3

- RED **Test:** should return Problem Details RFC 7807 format on 400
  - **Status:** RED — middleware mapping not wired for ValidationException
  - **Verifies:** AC3 + RFC 7807 format

**AC4 — 409 Conflict (3 tests)**

- RED **Test:** should return 409 Conflict when NIT already exists
  - **Status:** RED — duplicate NIT detection not implemented
  - **Verifies:** AC4 409 status

- RED **Test:** should return detail "El NIT/RUC ya está registrado" on 409
  - **Status:** RED — `ConflictException` + middleware mapping not done
  - **Verifies:** AC4 exact detail message

- RED **Test:** should NOT expose internal stack trace on 409 (NFR6)
  - **Status:** RED — NFR6 compliance not verified
  - **Verifies:** AC4 + NFR6

---

### Component Tests (14 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**AC1 — Field rendering (7 tests)**

- RED **Test:** renders the form element with data-testid="cliente-form"
  - **Status:** RED — `ClienteForm` does not exist (module-not-found)
  - **Verifies:** AC1 form testid

- RED **Test:** renders Nombre field with Spanish label
  - **Status:** RED — same
  - **Verifies:** AC1 Nombre label

- RED **Test:** renders NIT/RUC field with Spanish label
  - **Status:** RED — same
  - **Verifies:** AC1 NIT label

- RED **Test:** renders Teléfono field with Spanish label
  - **Status:** RED — same
  - **Verifies:** AC1 Teléfono label

- RED **Test:** renders Ciudad field with Spanish label
  - **Status:** RED — same
  - **Verifies:** AC1 Ciudad label

- RED **Test:** renders "Guardar" submit button with data-testid="cliente-form-submit"
  - **Status:** RED — same
  - **Verifies:** AC1 + AC2 submit testid

- RED **Test:** renders "Cancelar" button
  - **Status:** RED — same
  - **Verifies:** AC3 cancel button

**AC2 — Mutation payload (2 tests)**

- RED **Test:** calls mutate with all four required fields on valid submission
  - **Status:** RED — `useCreateCliente` + `ClienteForm` do not exist
  - **Verifies:** AC2 payload correctness

- RED **Test:** disables submit button when isPending is true
  - **Status:** RED — isPending wiring not implemented
  - **Verifies:** AC2 pending state

**AC3 — Inline validation (6 tests)**

- RED **Test:** shows inline error for empty Nombre field
  - **Status:** RED — Zod + RHF not implemented
  - **Verifies:** AC3

- RED **Test:** shows inline error for empty NIT field
  - **Status:** RED — same
  - **Verifies:** AC3

- RED **Test:** shows inline error for empty Teléfono field
  - **Status:** RED — same
  - **Verifies:** AC3

- RED **Test:** shows inline error for empty Ciudad field
  - **Status:** RED — same
  - **Verifies:** AC3

- RED **Test:** does NOT call mutate when all required fields are empty
  - **Status:** RED — form validation gate not implemented
  - **Verifies:** AC3

- RED **Test:** calls onClose without calling mutate when "Cancelar" is clicked
  - **Status:** RED — `onClose` prop not wired
  - **Verifies:** AC3 cancel

---

### Unit Tests — Hook (8 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`

**AC2 — Successful mutation (4 tests)**

- RED **Test:** calls clienteApiRepository.create with the provided payload
  - **Status:** RED — `useCreateCliente` does not exist (module-not-found)
  - **Verifies:** AC2 mutation call

- RED **Test:** invalidates ["clientes"] query cache on success
  - **Status:** RED — invalidateQueries not implemented
  - **Verifies:** AC2 cache invalidation

- RED **Test:** shows success toast "Cliente creado correctamente" on success
  - **Status:** RED — onSuccess handler not implemented
  - **Verifies:** AC2 toast

- RED **Test:** returns isPending as true while mutation is in flight
  - **Status:** RED — hook does not exist
  - **Verifies:** AC2 pending state

**AC4 — Error handling (4 tests)**

- RED **Test:** sets isError to true when mutation fails with 409
  - **Status:** RED — hook does not exist
  - **Verifies:** AC4 error state

- RED **Test:** does NOT re-expose Problem Details fields on 409 (NFR6)
  - **Status:** RED — NFR6 compliance not implemented
  - **Verifies:** AC4 + NFR6

- RED **Test:** sets isError to true on 500 server error
  - **Status:** RED — hook does not exist
  - **Verifies:** AC4 generic error

- RED **Test:** does NOT call invalidateQueries when mutation fails
  - **Status:** RED — hook does not exist
  - **Verifies:** AC2 cache not invalidated on failure

---

## Data Factories

### Cliente Factory (existing — `e2e/helpers/data.helper.ts`)

**Exports:**
- `buildCliente(overrides?)` — Creates unique client data with auto-incrementing NIT

**Used in:** E2E tests for AC2, AC4 scenarios

**Example Usage:**
```typescript
const data = buildCliente(); // { nombre: 'Cliente Test 1234', nit: '91234...', ... }
const dup  = buildCliente({ nit: '900123456' }); // specific NIT for conflict tests
```

---

## Fixtures

### Base Fixture (existing — `e2e/fixtures/base.fixture.ts`)

Provides `clientesPage` fixture (navigates to `/clientes` before test).

### ApiHelper (existing — `e2e/helpers/api.helper.ts`)

Provides `createCliente`, `deleteCliente`, `getClientes` for test setup/teardown.
All AC2 E2E tests that hit the real backend use `afterEach` cleanup via `ApiHelper.deleteCliente`.

---

## Mock Requirements

### POST /api/v1/clientes — Success (201)

**Used in:** E2E tests AC2 (network-first intercept)

```json
{
  "id": "00000000-0000-0000-0000-000000000099",
  "nombre": "<form data nombre>",
  "nit": "<form data nit>",
  "telefono": "<form data telefono>",
  "ciudad": "<form data ciudad>",
  "createdAt": "2026-06-30T00:00:00Z",
  "updatedAt": "2026-06-30T00:00:00Z"
}
```

### POST /api/v1/clientes — 409 Conflict

**Used in:** E2E tests AC4, unit tests AC4

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflict",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado"
}
```

### GET /api/v1/clientes — Empty list

**Used in:** All E2E tests (clean state)

```json
[]
```

---

## Required data-testid Attributes

### ClienteListView

- `clientes-list-panel` — Left panel container (existing)
- `cliente-list-item` — Each client item in list (existing)

### "Nuevo Cliente" Button (ClienteListView — new)

- Must be accessible via `page.getByRole('button', { name: /nuevo cliente/i })`

### ClienteForm (new component)

- `cliente-form` — The `<form>` element
- `cliente-form-submit` — The "Guardar" submit button

### Toast Notifications (system-provided)

- Toast library renders messages — tests use `page.getByText(...)` for text verification

**Implementation Example:**
```tsx
<form data-testid="cliente-form" onSubmit={handleSubmit(onSubmit)}>
  {/* fields */}
  <button type="submit" data-testid="cliente-form-submit" disabled={isPending}>
    {isPending ? 'Guardando...' : 'Guardar'}
  </button>
</form>
```

---

## Implementation Checklist

### Test: should show "Nuevo cliente" button on /clientes view (AC1)

**File:** `e2e/tests/clientes/create-client.spec.ts`

**Tasks to make this test pass:**
- [ ] Add "Nuevo cliente" button to `ClienteListView.tsx` above search input
- [ ] Style: `bg-[#0e79fd] text-white` + `PlusIcon` from `@heroicons/react/24/outline`
- [ ] Button is accessible via `getByRole('button', { name: /nuevo cliente/i })`
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC1"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should open form dialog when "Nuevo cliente" is clicked (AC1)

**File:** `e2e/tests/clientes/create-client.spec.ts`

**Tasks to make this test pass:**
- [ ] Add local `useState<boolean>(false)` → `isFormOpen` in `ClienteListView.tsx`
- [ ] Button click sets `isFormOpen(true)`
- [ ] When `isFormOpen`, render `ClienteForm` inside a `shadcn/ui Dialog`
- [ ] Pass `onClose={() => setIsFormOpen(false)}` to `ClienteForm`
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: ClienteForm renders 4 required fields with Spanish labels (AC1)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- [ ] Add `<form data-testid="cliente-form">` element
- [ ] Add 4 fields with `<label htmlFor="...">` in Spanish: Nombre, NIT/RUC, Teléfono, Ciudad
- [ ] Add `<button type="submit" data-testid="cliente-form-submit">Guardar</button>`
- [ ] Add `<button type="button" onClick={onClose}>Cancelar</button>`
- [ ] Wire React Hook Form: `useForm()` with `zodResolver(createClienteSchema)`
- [ ] Props: `{ onClose: () => void; onSuccess?: () => void }`
- [ ] Run test: `pnpm --filter frontend test ClienteForm`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: calls mutate with correct payload on valid submission (AC2)

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`
- [ ] Implement `useMutation` with `mutationFn: (data) => clienteApiRepository.create(data)`
- [ ] `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['clientes'] })` + `toast.success('Cliente creado correctamente')`
- [ ] `onError`: if 409 → `toast.error('El NIT/RUC ya está registrado')`; else → `toast.error('No se pudo guardar. Intenta de nuevo.')`
- [ ] Return `{ mutate, isPending, isError }`
- [ ] Run test: `pnpm --filter frontend test useCreateCliente`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should return 400 when required fields are missing (AC3 — backend)

**File:** `e2e/tests/api/clientes-create.api.spec.ts`

**Tasks to make this test pass:**
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/CreateClienteCommandValidator.cs`
- [ ] Register validator in `Program.cs`
- [ ] Call `await _validator.ValidateAndThrowAsync(command, ct)` in handler
- [ ] Ensure `ExceptionHandlingMiddleware` maps `ValidationException` → `400 Problem Details`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-create.api.spec.ts --grep "AC3"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: should return 409 with detail "El NIT/RUC ya está registrado" (AC4)

**File:** `e2e/tests/api/clientes-create.api.spec.ts`

**Tasks to make this test pass:**
- [ ] In `CreateClienteCommandHandler`: check `ExistsByNitAsync` before insert
- [ ] Throw `ConflictException("El NIT/RUC ya está registrado")` when NIT exists
- [ ] Map `ConflictException` → `409 Conflict Problem Details` in `ExceptionHandlingMiddleware`
- [ ] Add `.ProducesProblem(409)` to POST endpoint in `ClienteEndpoints.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-create.api.spec.ts --grep "AC4"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all failing E2E tests for this story (create-client)
npx playwright test e2e/tests/clientes/create-client.spec.ts

# Run all failing API tests for this story
npx playwright test e2e/tests/api/clientes-create.api.spec.ts

# Run all E2E + API tests together
npx playwright test e2e/tests/clientes/create-client.spec.ts e2e/tests/api/clientes-create.api.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/create-client.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/clientes/create-client.spec.ts --debug

# Run frontend component + unit tests
pnpm --filter frontend test ClienteForm
pnpm --filter frontend test useCreateCliente

# Run ALL frontend tests
pnpm --filter frontend test

# Run backend unit tests
cd backend && dotnet test tests/SiesaAgents.UnitTests
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**
- All tests written and failing (47 total)
- Network-first intercept pattern applied in all E2E tests
- Real API + mock approaches both covered
- Required data-testid attributes documented
- Implementation checklist created

**Verification:**
- E2E tests fail: `ClienteForm` component missing + button/dialog not in `ClienteListView`
- API tests fail: `CreateClienteCommandValidator` missing, 409 not implemented
- Component tests fail: `ClienteForm` module not found
- Unit tests fail: `useCreateCliente` module not found

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with domain/application layer** (no UI needed to verify):
   - Create `clienteSchema.ts` (Zod schema)
   - Create `useCreateCliente.ts` (mutation hook)
   - Run: `pnpm --filter frontend test useCreateCliente` → GREEN

2. **Create `ClienteForm.tsx`**:
   - Wire RHF + zodResolver + useCreateCliente
   - Add all data-testid attributes
   - Run: `pnpm --filter frontend test ClienteForm` → GREEN

3. **Update `ClienteListView.tsx`**:
   - Add "Nuevo cliente" button
   - Wire isFormOpen state + Dialog
   - Run: `npx playwright test e2e/tests/clientes/create-client.spec.ts --grep "AC1"` → GREEN

4. **Backend validation** (Task 7 — CRITICAL from Story 2.2 review):
   - Create `CreateClienteCommandValidator.cs`
   - Register + wire in handler
   - Run: `npx playwright test e2e/tests/api/clientes-create.api.spec.ts --grep "AC3"` → GREEN

5. **Backend 409 handling** (Task 8):
   - Implement NIT duplicate check + ConflictException
   - Run: `npx playwright test e2e/tests/api/clientes-create.api.spec.ts --grep "AC4"` → GREEN

6. **Full story verification**:
   - Run all tests: `npx playwright test e2e/tests/clientes/create-client.spec.ts e2e/tests/api/clientes-create.api.spec.ts`
   - Run: `pnpm --filter frontend test`

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review `ClienteForm.tsx` for code quality
3. Extract any shared form field components if reuse is evident
4. Ensure tests still pass after refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/create-client.spec.ts`
3. Begin implementation following the Implementation Checklist above
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor for quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation in all E2E tests (prevents race conditions)
- **data-factories.md** — `buildCliente()` factory pattern with unique IDs
- **fixture-architecture.md** — `afterEach` cleanup via `ApiHelper.deleteCliente` for API tests
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure throughout
- **selector-resilience.md** — `data-testid` selectors for form elements, ARIA roles for buttons/dialogs
- **component-tdd.md** — `vi.mock` for hook isolation in component tests, RHF + zodResolver pattern
- **test-levels-framework.md** — E2E for user journeys (AC1+AC2), API for backend contracts (AC3+AC4), Component for form behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected command:**
```bash
npx playwright test e2e/tests/clientes/create-client.spec.ts e2e/tests/api/clientes-create.api.spec.ts --reporter=list
pnpm --filter frontend test ClienteForm useCreateCliente
```

**Expected Results:**
- E2E tests (13): FAIL — `ClienteListView` missing button/form + `ClienteForm` component not found
- API tests (12): FAIL — `CreateClienteCommandValidator` not registered, 400/409 not returned
- Component tests (14): FAIL — `Cannot find module './ClienteForm'`
- Unit tests (8): FAIL — `Cannot find module './useCreateCliente'`

**Summary:**
- Total tests: 47
- Passing: 0 (expected — RED phase)
- Failing: 47 (expected)
- Status: RED phase verified

---

## Notes

- `POST /api/v1/clientes` endpoint already exists (added in Story 2.2) — only validation + 409 need to be added
- `shadcn/ui Dialog` is already installed (`npx shadcn@latest add dialog` was run at setup)
- `@heroicons/react` is installed — use `PlusIcon` from `/24/outline`
- Task 7 (`CreateClienteCommandValidator`) resolves a CRITICAL finding from Story 2.2 code review
- Frontend uses Vitest + RTL; E2E uses Playwright; backend uses xUnit — all three test tools are in play
- NIT duplicate check preferred approach: pre-check with `ExistsByNitAsync` before insert (more testable than catching DB exception)
- Toast library: project uses either `react-hot-toast` or `sonner` — check existing imports before coding

---

**Generated by BMad TEA Agent** — 2026-06-30
