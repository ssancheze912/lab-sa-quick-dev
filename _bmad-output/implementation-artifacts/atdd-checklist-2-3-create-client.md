# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** E2E + API Integration + Component

---

## Story Summary

As a commercial team member, this story enables registering a new client through a form with four required fields (Nombre, NIT/RUC, Teléfono, Ciudad). The form integrates client-side Zod validation, a TanStack Query mutation hook, and a backend POST endpoint with FluentValidation and NIT uniqueness enforcement via PostgreSQL.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. Given the user is on `/clientes`, When clicking "Nuevo cliente", Then a form opens with Nombre, NIT/RUC, Teléfono, Ciudad — all required (FR1).
2. Given all required fields filled and submitted, When form submits, Then POST `/api/v1/clientes` is called, cache `['clientes']` invalidated, new client appears in list, toast "Cliente creado correctamente" shown (FR1, FR4, FR27, NFR2).
3. Given required fields are empty and form submitted, When client-side Zod validation runs, Then inline errors appear per empty field and form is NOT submitted to backend (FR8, NFR5).
4. Given NIT already exists, When backend returns 409, Then "El NIT/RUC ya está registrado" shown inline, no stack trace or technical details exposed (NFR6, R-E2-01).
5. Given form is open, When user clicks "Cancelar", Then form closes without any POST being triggered.
6. Given form submits successfully, When mutation's `onSuccess` fires, Then `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is called and list re-fetches (FR27, R-E2-05).

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `e2e/tests/clientes/create-cliente.spec.ts`

- **Test:** `AC-1: should open form with Nombre, NIT/RUC, Teléfono, Ciudad fields when "Nuevo cliente" is clicked`
  - **Status:** RED — `ClienteForm` component does not exist, "Nuevo cliente" button has no handler
  - **Verifies:** AC-1 — form renders all 4 input fields on button click

- **Test:** `AC-2: should create client via POST, show toast, and display new client in list`
  - **Status:** RED — `useCreateCliente` mutation hook does not exist, POST endpoint not wired
  - **Verifies:** AC-2 — full happy path: form submit → POST 201 → toast → list updated

- **Test:** `AC-3: should show inline validation errors when submitting empty form and NOT call POST`
  - **Status:** RED — `ClienteForm` and Zod validation not implemented
  - **Verifies:** AC-3 — Zod blocks submission, inline errors per field visible

- **Test:** `AC-4: should show "El NIT/RUC ya está registrado" when backend returns 409`
  - **Status:** RED — 409 error surfacing in `ClienteForm` not implemented
  - **Verifies:** AC-4 — NIT conflict message shown inline, no stack trace in UI

- **Test:** `AC-5: should close form without POST when "Cancelar" is clicked`
  - **Status:** RED — `ClienteForm` and `ClienteListView` wiring not complete
  - **Verifies:** AC-5 — cancel closes form without triggering mutation

- **Test:** `AC-6: should re-fetch client list after successful creation (cache invalidation)`
  - **Status:** RED — `invalidateQueries` not called from mutation `onSuccess`
  - **Verifies:** AC-6 — GET is called at least twice (initial + after invalidation)

### API Integration Tests (4 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/CreateClienteEndpointTests.cs`

- **Test:** `TC_E2_P0_07_PostCliente_Returns201_WithCompleteDtoAndPersists`
  - **Status:** RED — POST `/api/v1/clientes` endpoint not registered
  - **Verifies:** TC-E2-P0-07 — 201 Created with full ClienteDto + Location header + record persists

- **Test:** `PostCliente_Returns201_WithJsonContentType`
  - **Status:** RED — same missing endpoint
  - **Verifies:** Content-Type is `application/json` on 201 response

- **Test:** `TC_E2_P0_09_PostCliente_Returns409_WithProblemDetails_OnDuplicateNit`
  - **Status:** RED — NIT uniqueness enforcement not wired (middleware 23505 → 409 mapping missing)
  - **Verifies:** TC-E2-P0-09 — duplicate NIT → 409 + Problem Details, no stackTrace

- **Test:** `TC_E2_P1_19_PostCliente_Returns400_WithProblemDetails_OnEmptyBody`
  - **Status:** RED — FluentValidation validator not created
  - **Verifies:** TC-E2-P1-19 — empty body → 400 + Problem Details with field-level errors

- **Test:** `PostCliente_Returns400_WhenRequiredFieldsMissing_PartialPayload`
  - **Status:** RED — FluentValidation validator not created
  - **Verifies:** Partial payload (only nombre) → 400

### Component Tests (11 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

- **Test:** `TC-E2-P0-04: should call onSuccess after form is submitted with valid data and backend returns 201`
  - **Status:** RED — `ClienteForm.tsx` does not exist
  - **Verifies:** TC-E2-P0-04 — onSuccess called after 201

- **Test:** `TC-E2-P0-04: should show success toast "Cliente creado correctamente" after 201 response`
  - **Status:** RED — toast integration not implemented
  - **Verifies:** Success toast text visible after 201

- **Test:** `should send POST to /api/v1/clientes with all 4 fields in the request body`
  - **Status:** RED — `ClienteForm.tsx` / `useCreateCliente.ts` missing
  - **Verifies:** POST payload contains all 4 required fields

- **Test:** `should disable the Guardar button while mutation is in flight (isPending)`
  - **Status:** RED — isPending disabled state not implemented
  - **Verifies:** Submit button disabled during in-flight mutation

- **Test:** `TC-E2-P0-05B: should display inline error on nombre field when form is submitted empty`
  - **Status:** RED — Zod inline error display not implemented
  - **Verifies:** TC-E2-P0-05B — `data-testid="cliente-form-error-nombre"` visible

- **Test:** `TC-E2-P0-05B: should display inline errors on all 4 required fields when form is submitted empty`
  - **Status:** RED — all 4 field error testids missing
  - **Verifies:** All 4 inline errors: nombre, nit, telefono, ciudad

- **Test:** `TC-E2-P0-05B: should NOT send POST to backend when required fields are empty`
  - **Status:** RED — form not wired to block POST
  - **Verifies:** postWasCalled === false when Zod fails

- **Test:** `TC-E2-P2-03: should display "El NIT/RUC ya está registrado" inline when backend returns 409`
  - **Status:** RED — 409 error handling not implemented in ClienteForm
  - **Verifies:** TC-E2-P2-03 — NIT conflict message inline

- **Test:** `TC-E2-P2-03: should NOT expose stack trace or technical details in the UI on 409`
  - **Status:** RED — error surfaces raw error details
  - **Verifies:** No stackTrace/innerException text in UI

- **Test:** `TC-E2-P2-03: should NOT call onSuccess when backend returns 409`
  - **Status:** RED — onSuccess guard not implemented
  - **Verifies:** onSuccess not called on 409

- **Test:** `Cancel behavior: should call onCancel when "Cancelar" button is clicked`
  - **Status:** RED — Cancel button and handler not implemented
  - **Verifies:** onCancel called once

- **Test:** `Cancel behavior: should NOT send POST to backend when Cancelar is clicked`
  - **Status:** RED — no mutation triggered on cancel
  - **Verifies:** postWasCalled === false on cancel

### Unit Tests (7 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`

- **Test:** `TC-E2-P2-05: should call queryClient.invalidateQueries with key ["clientes"] after successful mutation`
  - **Status:** RED — `useCreateCliente.ts` does not exist
  - **Verifies:** TC-E2-P2-05 — invalidateQueries spy called with `{ queryKey: ['clientes'] }`

- **Test:** `should NOT call invalidateQueries when mutation fails`
  - **Status:** RED — same missing module
  - **Verifies:** No invalidation on error

- **Test:** `should expose isPending as true while the mutation is in flight`
  - **Status:** RED — isPending not exposed
  - **Verifies:** isPending === true during in-flight request

- **Test:** `should expose isPending as false before any mutation is triggered`
  - **Status:** RED — hook not implemented
  - **Verifies:** isPending === false on initial render

- **Test:** `should call options.onSuccess when the mutation succeeds`
  - **Status:** RED — options.onSuccess pattern not implemented
  - **Verifies:** onSuccess callback invoked after 201

- **Test:** `should NOT call options.onSuccess when mutation fails`
  - **Status:** RED — same
  - **Verifies:** onSuccess NOT called on error

- **Test:** `TC-E2-P2-03: should expose isError true when backend returns 409`
  - **Status:** RED — 409 not surfaced as isError
  - **Verifies:** isError === true on 409 response

Note: `clienteSchema.test.ts` (TC-E2-P0-05A, TC-E2-P2-07) already exists from Story 2.1 — the schema it tests (`clienteSchema.ts`) is already implemented and those tests are GREEN. No new schema tests added.

---

## Data Factories Created / Extended

### ClienteFormData factory (existing — no changes needed)

**File:** `frontend/src/test/factories/cliente.factory.ts`

Already provides `createCliente(overrides?)` which generates `ClienteTestData` with all 4 required fields. The same factory is reused by Story 2.3 tests.

### E2E data helper (existing — no changes needed)

**File:** `e2e/helpers/data.helper.ts`

`buildCliente(overrides?)` already generates unique payloads for E2E tests. No changes needed.

---

## MSW Handlers Created

### POST /api/v1/clientes handlers

**File:** `frontend/src/test/msw/handlers/clientes-create.handlers.ts`

**Exports:**

- `handlePostClienteSuccess(responseBody?)` — Returns 201 Created with ClienteDto
- `handlePostClienteConflict()` — Returns 409 Conflict with Problem Details (NIT duplicate)
- `handlePostClienteValidationError()` — Returns 400 Bad Request with field errors
- `handlePostClienteServerError()` — Returns 500 Internal Server Error

**Example Usage:**

```typescript
server.use(handlePostClienteSuccess());
server.use(handlePostClienteConflict());
```

---

## Required data-testid Attributes

### ClienteForm Component

- `cliente-form-nombre` — Nombre text input
- `cliente-form-nit` — NIT/RUC text input
- `cliente-form-telefono` — Teléfono text input
- `cliente-form-ciudad` — Ciudad text input
- `cliente-form-submit` — "Guardar" submit button (disabled when isPending)
- `cliente-form-cancel` — "Cancelar" button
- `cliente-form-error-nombre` — Inline validation error for nombre field
- `cliente-form-error-nit` — Inline validation error for nit field (also shows 409 conflict message)
- `cliente-form-error-telefono` — Inline validation error for telefono field
- `cliente-form-error-ciudad` — Inline validation error for ciudad field

### ClienteListView Component (existing, from Stories 2.1/2.2)

- `clientes-list-panel` — Already exists
- `cliente-list-item` — Already exists

**Implementation Example:**

```tsx
<form data-testid="cliente-form" onSubmit={handleSubmit(onSubmit)}>
  <input data-testid="cliente-form-nombre" {...register('nombre')} />
  {errors.nombre && (
    <span data-testid="cliente-form-error-nombre">{errors.nombre.message}</span>
  )}

  <input data-testid="cliente-form-nit" {...register('nit')} />
  {errors.nit && (
    <span data-testid="cliente-form-error-nit">{errors.nit.message}</span>
  )}

  <input data-testid="cliente-form-telefono" {...register('telefono')} />
  {errors.telefono && (
    <span data-testid="cliente-form-error-telefono">{errors.telefono.message}</span>
  )}

  <input data-testid="cliente-form-ciudad" {...register('ciudad')} />
  {errors.ciudad && (
    <span data-testid="cliente-form-error-ciudad">{errors.ciudad.message}</span>
  )}

  <button data-testid="cliente-form-submit" type="submit" disabled={isPending}>
    Guardar
  </button>
  <button data-testid="cliente-form-cancel" type="button" onClick={onCancel}>
    Cancelar
  </button>
</form>
```

---

## Implementation Checklist

### Task 1: Create `useCreateCliente` hook

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.ts`

**Tasks:**

- [ ] Create file `useCreateCliente.ts`
- [ ] Import `useMutation`, `useQueryClient` from `@tanstack/react-query`
- [ ] Import `clienteApiRepository` from infrastructure layer
- [ ] Import `ClienteFormData` type from `clienteSchema`
- [ ] Implement `mutationFn: (data: ClienteFormData) => clienteApiRepository.create(data)`
- [ ] Implement `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` and show toast
- [ ] Expose `mutate`, `isPending`, `isError`, `error` from hook
- [ ] Accept optional `options?: { onSuccess?: () => void }` parameter
- [ ] Run test: `pnpm --filter frontend test application/useCreateCliente.test.ts`
- [ ] ✅ All 7 useCreateCliente unit tests pass (green phase)

### Task 2: Extend infrastructure — add `create` to API repository

**File:** `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`

**Tasks:**

- [ ] Add `create(data: ClienteFormData): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `create` in `clienteApiRepository.ts`: POST to `/api/v1/clientes` via `apiClient`
- [ ] Returns `Cliente` on 2xx; throws on non-2xx (let `useMutation.onError` handle it)
- [ ] Run unit tests to verify no breakage

### Task 3: Create `ClienteForm` presentation component

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`

**Tasks:**

- [ ] Create `ClienteForm.tsx`
- [ ] Use `react-hook-form` with `zodResolver(clienteSchema)` for validation
- [ ] Add fields: Nombre, NIT/RUC, Teléfono, Ciudad — all with `data-testid` attributes
- [ ] Add inline error messages per field using `formState.errors` + `data-testid` error attributes
- [ ] "Guardar" button: `data-testid="cliente-form-submit"`, disabled when `isPending`
- [ ] "Cancelar" button: `data-testid="cliente-form-cancel"`, calls `onCancel()` prop
- [ ] `onSubmit`: calls `mutate(data)` from `useCreateCliente`
- [ ] Handle 409 error: use `setError('nit', { message: 'El NIT/RUC ya está registrado' })`
- [ ] Props interface: `{ onSuccess?: () => void; onCancel?: () => void }`
- [ ] Check siesa-ui-kit first for form/input/button components
- [ ] Run test: `pnpm --filter frontend test presentation/ClienteForm.test.tsx`
- [ ] ✅ All 12 ClienteForm component tests pass (green phase)

### Task 4: Wire `ClienteForm` in `ClienteListView`

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`

**Tasks:**

- [ ] Add `isFormOpen: boolean` state with `useState(false)`
- [ ] Add "Nuevo cliente" button (PlusIcon + label) in list panel header
- [ ] When `isFormOpen === true`: render `<ClienteForm>` inside panel (dialog/sheet or inline)
- [ ] Pass `onSuccess={() => setIsFormOpen(false)}` and `onCancel={() => setIsFormOpen(false)}`
- [ ] Run E2E tests: `npx playwright test e2e/tests/clientes/create-cliente.spec.ts`
- [ ] ✅ All 6 E2E tests pass (green phase)

### Task 5: Backend — POST /api/v1/clientes endpoint

**Files:** Multiple backend files (see story Tasks 6 in detail)

**Tasks:**

- [ ] Create `CreateClienteCommand.cs` and `CreateClienteCommandHandler.cs`
- [ ] Create `CreateClienteRequestValidator.cs` (FluentValidation: all 4 fields required)
- [ ] Add `MapPost` to `ClientesEndpoints.cs` returning 201 + Location header
- [ ] Verify/implement `ClienteEntity.Create()` factory method
- [ ] Verify `ExceptionHandlingMiddleware.cs` maps PostgreSQL error 23505 → 409 Problem Details
- [ ] Run integration tests: `dotnet test --filter "CreateClienteEndpointTests"`
- [ ] ✅ All 5 integration tests pass (green phase)

---

## Running Tests

```bash
# Run all unit tests for this story (useCreateCliente)
pnpm --filter frontend test application/useCreateCliente.test.ts

# Run component tests (ClienteForm)
pnpm --filter frontend test presentation/ClienteForm.test.tsx

# Run all frontend tests for clientes module
pnpm --filter frontend test src/modules/crm/clientes

# Run backend integration tests for create endpoint
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "CreateClienteEndpointTests"

# Run E2E tests for Story 2.3
npx playwright test e2e/tests/clientes/create-cliente.spec.ts

# Run E2E tests in headed mode
npx playwright test e2e/tests/clientes/create-cliente.spec.ts --headed

# Run E2E tests in debug mode
npx playwright test e2e/tests/clientes/create-cliente.spec.ts --debug

# Run all tests (frontend + backend + E2E)
pnpm test && dotnet test && npx playwright test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- ✅ 6 E2E acceptance tests written in Given-When-Then format, network-first pattern applied
- ✅ 7 unit tests for `useCreateCliente` hook written
- ✅ 12 component tests for `ClienteForm` written
- ✅ 5 backend API integration tests written (TC-E2-P0-07, TC-E2-P0-09, TC-E2-P1-19)
- ✅ MSW handlers for POST /api/v1/clientes created (201, 409, 400, 500)
- ✅ data-testid requirements documented
- ✅ Implementation checklist created

**Verification:**
All tests fail for the right reason:
- Frontend: "Cannot find module '../useCreateCliente'" / "Cannot find module '../ClienteForm'"
- E2E: "Nuevo cliente" button exists but form doesn't open (ClienteForm not rendered)
- Backend: POST `/api/v1/clientes` returns 404 (endpoint not registered)

---

### GREEN Phase (DEV Team — Next Steps)

1. Implement `useCreateCliente.ts` hook (Task 1) — makes 7 unit tests green
2. Extend `clienteApiRepository.ts` with `create()` method (Task 2)
3. Create `ClienteForm.tsx` component (Task 3) — makes 12 component tests green
4. Wire form in `ClienteListView.tsx` (Task 4) — makes 6 E2E tests green
5. Implement backend POST endpoint, validator, and middleware (Task 5) — makes 5 integration tests green

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Review `ClienteForm.tsx` for siesa-ui-kit component usage
2. Ensure all text is in Spanish (labels, placeholders, error messages)
3. Code variables remain in English
4. Remove any `data-testid` that are duplicated or unused
5. Run full test suite to confirm no regressions

---

## Notes

- `clienteSchema.ts` and `clienteSchema.test.ts` already exist and pass from Story 2.1 — no new schema tests added
- The `faker` library is not installed; the existing `cliente.factory.ts` uses a counter-based approach — this pattern was followed in all new tests
- Backend integration tests use `EF Core InMemory` — the unique constraint test (TC-E2-P0-09) works in InMemory only if the middleware maps `DbUpdateException` correctly; for full PostgreSQL unique constraint testing, the test must run against a real DB in CI
- Toast mechanism: the story assumes a toast library (e.g., `react-hot-toast` or similar) was established in earlier stories — the component tests verify toast text via `screen.getByText(/cliente creado correctamente/i)` which is library-agnostic
- E2E tests use `page.route()` (network intercepts) before `page.goto()` per the network-first pattern — this prevents race conditions

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns (intercept BEFORE navigation to prevent race conditions) — applied in all 6 E2E tests
- **data-factories.md** — Factory patterns for test data generation — reused existing `cliente.factory.ts`
- **fixture-architecture.md** — Fixture patterns with auto-cleanup — applied in E2E `afterEach` cleanup
- **component-tdd.md** — Component test strategies with React Testing Library + MSW
- **test-quality.md** — Given-When-Then, one assertion per test, deterministic data
- **selector-resilience.md** — `data-testid` selectors used throughout (no brittle CSS selectors)
- **test-levels-framework.md** — E2E for user journeys, API for contract validation, Component for UI behavior, Unit for hook logic

---

**Generated by BMad TEA Agent** — 2026-06-29
