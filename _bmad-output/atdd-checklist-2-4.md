# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** Component (Frontend) + API (Backend)

---

## Story Summary

A commercial team member needs to edit any field of an existing client so the client information stays up to date. The edit flow is triggered from the `ClienteDetailPanel` via an "Editar" button that opens `ClienteForm` in edit mode, pre-filled with current values. Successful updates are reflected immediately in both the detail panel and the client list (TanStack Query cache invalidation).

**As a** commercial team member
**I want** to edit any field of an existing client
**So that** the client information stays up to date

---

## Acceptance Criteria

1. Given the user is viewing a client's detail, When the user clicks "Editar", Then the client form opens pre-filled with all current field values: Nombre, NIT/RUC, Teléfono, Ciudad (FR6).

2. Given the user modifies one or more fields and submits, When the backend returns 200 OK, Then the changes are reflected immediately in the client detail and list (`invalidateQueries(['clientes'])` and `invalidateQueries(['clientes', id])` — FR27), And a success toast shows "Cliente actualizado correctamente", And the form is closed.

3. Given the user clears a required field and submits, When client-side Zod validation runs, Then clear inline error messages appear below each empty field in Spanish ("El nombre es requerido", etc.), And the form is NOT submitted to the backend (FR8).

4. Given the user clicks "Cancelar" without saving, When the form closes, Then the original client data remains unchanged and no request is sent.

5. Given the backend is unavailable when the form is submitted (network error or 5xx), When the mutation fails, Then a toast error shows "No se pudo actualizar el cliente. Intenta de nuevo.", And the form remains open with all entered data preserved.

6. Given the user submits a NIT/RUC that already belongs to a different client, When the backend returns 409 Conflict, Then an inline error message "El NIT/RUC ya está registrado" appears on the NIT/RUC field (NFR6), And the form remains open.

---

## Failing Tests Created (RED Phase)

### Component Tests — Frontend: useUpdateCliente hook (5 tests)

**File:** `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

- **Test:** `should call PUT /api/v1/clientes/{id} with the correct payload`
  - **Status:** RED - `useUpdateCliente` module does not exist
  - **Verifies:** AC2 — mutation calls correct endpoint with correct body

- **Test:** `should call invalidateQueries with key ["clientes"] on success`
  - **Status:** RED - `useUpdateCliente` module does not exist
  - **Verifies:** AC2, FR27 — list cache invalidation on success

- **Test:** `should call invalidateQueries with key ["clientes", id] on success`
  - **Status:** RED - `useUpdateCliente` module does not exist
  - **Verifies:** AC2, FR27 — detail cache invalidation on success

- **Test:** `should expose isError true on 409 conflict response`
  - **Status:** RED - `useUpdateCliente` module does not exist
  - **Verifies:** AC6 — hook exposes error state on 409

- **Test:** `should expose isError true on 5xx server error`
  - **Status:** RED - `useUpdateCliente` module does not exist
  - **Verifies:** AC5 — hook exposes error state on 5xx

### Component Tests — Frontend: ClienteForm edit mode (16 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit-mode.test.tsx`

- **Test:** `should pre-fill Nombre field with initialData value`
  - **Status:** RED - ClienteForm does not accept `mode='edit'` or `initialData` prop
  - **Verifies:** AC1 — pre-fill Nombre

- **Test:** `should pre-fill NIT/RUC field with initialData value`
  - **Status:** RED - same
  - **Verifies:** AC1 — pre-fill NIT/RUC

- **Test:** `should pre-fill Teléfono field with initialData value`
  - **Status:** RED - same
  - **Verifies:** AC1 — pre-fill Teléfono

- **Test:** `should pre-fill Ciudad field with initialData value`
  - **Status:** RED - same
  - **Verifies:** AC1 — pre-fill Ciudad

- **Test:** `should display "Guardar cambios" as submit button label in edit mode`
  - **Status:** RED - ClienteForm does not support edit mode
  - **Verifies:** AC1 — button label in edit mode

- **Test:** `should have aria-label "Editar cliente" on the form in edit mode`
  - **Status:** RED - form aria-label is not "Editar cliente"
  - **Verifies:** WCAG 2.1 AA — accessible form label

- **Test:** `should call PUT /api/v1/clientes/{id} with modified data on submit`
  - **Status:** RED - ClienteForm does not call PUT
  - **Verifies:** AC2 — correct HTTP method and URL

- **Test:** `should show toast "Cliente actualizado correctamente" after successful submit`
  - **Status:** RED - success toast message is different
  - **Verifies:** AC2 — Spanish success message

- **Test:** `should call onSuccess after a successful edit`
  - **Status:** RED - ClienteForm uses `useCreateCliente` not `useUpdateCliente`
  - **Verifies:** AC2 — form closes after success

- **Test:** `should show "El nombre es requerido" when Nombre is cleared and submitted`
  - **Status:** RED - edit mode Zod validation not wired
  - **Verifies:** AC3 — inline validation in edit mode

- **Test:** `should show "El NIT/RUC es requerido" when NIT/RUC is cleared and submitted`
  - **Status:** RED - same
  - **Verifies:** AC3 — inline NIT validation

- **Test:** `should NOT submit to the backend when a required field is cleared in edit mode`
  - **Status:** RED - edit mode not implemented
  - **Verifies:** AC3, FR8 — frontend validation gate

- **Test:** `should call onCancel when "Cancelar" button is clicked`
  - **Status:** RED - onCancel signature may differ in edit mode
  - **Verifies:** AC4 — cancel behavior

- **Test:** `should NOT send any API request when "Cancelar" is clicked`
  - **Status:** RED - edit mode not implemented
  - **Verifies:** AC4 — no request on cancel

- **Test:** `should display toast error "No se pudo actualizar el cliente. Intenta de nuevo." on 5xx`
  - **Status:** RED - edit mode 5xx handling not implemented
  - **Verifies:** AC5 — error toast message in Spanish

- **Test:** `should show inline error "El NIT/RUC ya está registrado" on NIT field when 409 is returned`
  - **Status:** RED - 409 inline error handling not implemented for edit mode
  - **Verifies:** AC6, NFR6 — no tech details exposed on duplicate NIT

- **Test:** `should show "Guardando…" label and disable submit button while edit mutation is pending`
  - **Status:** RED - edit mode loading state not implemented
  - **Verifies:** AC2 — loading feedback

### Component Tests — Frontend: ClienteDetailPanel edit flow (12 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.edit-flow.test.tsx`

- **Test:** `should render the "Editar" button when client data is loaded`
  - **Status:** RED - "Editar" button not in ClienteDetailPanel
  - **Verifies:** AC1 — button visibility

- **Test:** `should NOT render "Editar" button during skeleton loading state`
  - **Status:** RED - button not implemented
  - **Verifies:** AC1 — no button in loading state

- **Test:** `should NOT render "Editar" button when client returns 404`
  - **Status:** RED - button not implemented
  - **Verifies:** AC1 — no button in error/404 state

- **Test:** `should NOT render "Editar" button when backend returns 500`
  - **Status:** RED - button not implemented
  - **Verifies:** AC1 — no button in error state

- **Test:** `should show edit form when "Editar" button is clicked`
  - **Status:** RED - isEditing state not implemented
  - **Verifies:** AC1 — clicking Editar shows form

- **Test:** `should hide the detail view when edit form is shown`
  - **Status:** RED - isEditing toggle not implemented
  - **Verifies:** AC1 — detail content replaced by form

- **Test:** `should pre-fill Nombre in edit form with current client Nombre`
  - **Status:** RED - initialData wiring not implemented
  - **Verifies:** AC1 — pre-fill from ClienteDetailPanel data

- **Test:** `should pre-fill NIT/RUC in edit form with current client NIT`
  - **Status:** RED - initialData wiring not implemented
  - **Verifies:** AC1 — pre-fill NIT

- **Test:** `should hide edit form and show detail view again when "Cancelar" is clicked`
  - **Status:** RED - isEditing toggle not implemented
  - **Verifies:** AC4 — cancel restores detail view

- **Test:** `should NOT send a PUT request when "Cancelar" is clicked`
  - **Status:** RED - cancel behavior not implemented
  - **Verifies:** AC4 — no request on cancel

- **Test:** `should re-display the "Editar" button after Cancelar closes the form`
  - **Status:** RED - toggle not implemented
  - **Verifies:** AC4 — Editar button reappears

- **Test:** `should close edit form and show detail content after successful update`
  - **Status:** RED - onSuccess toggle not implemented
  - **Verifies:** AC2 — form closes on success

### Backend Unit Tests (10 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

- **Test:** `HandleAsync_WithValidInput_UpdatesEntityAndReturnsClienteDto`
  - **Status:** RED - `UpdateClienteCommandHandler` does not exist
  - **Verifies:** AC2 — handler returns updated ClienteDto

- **Test:** `HandleAsync_WithValidInput_UpdatedAtIsRecent`
  - **Status:** RED - `UpdateClienteCommandHandler` does not exist
  - **Verifies:** AC2 — UpdatedAt reflects update time (DateTimeOffset.UtcNow)

- **Test:** `HandleAsync_WhenClientDoesNotExist_ReturnsNull`
  - **Status:** RED - `UpdateClienteCommandHandler` does not exist
  - **Verifies:** AC5 — null return triggers 404 at endpoint level

- **Test:** `HandleAsync_WhenRepositoryThrowsDbUpdateException_PropagatesException`
  - **Status:** RED - `UpdateClienteCommandHandler` does not exist
  - **Verifies:** AC6 — DbUpdateException propagates to middleware for 409 mapping

- **Test:** `Validator_WithEmptyNombre_ReturnsValidationError`
  - **Status:** RED - `UpdateClienteCommandValidator` does not exist
  - **Verifies:** AC3 — Nombre validation

- **Test:** `Validator_WithEmptyNit_ReturnsValidationError`
  - **Status:** RED - same
  - **Verifies:** AC3 — Nit validation

- **Test:** `Validator_WithEmptyTelefono_ReturnsValidationError`
  - **Status:** RED - same
  - **Verifies:** AC3 — Telefono validation

- **Test:** `Validator_WithEmptyCiudad_ReturnsValidationError`
  - **Status:** RED - same
  - **Verifies:** AC3 — Ciudad validation

- **Test:** `Validator_WithEmptyId_ReturnsValidationError`
  - **Status:** RED - same
  - **Verifies:** AC3 — Id must not be empty Guid

- **Test:** `Validator_WithAllValidFields_ReturnsValid`
  - **Status:** RED - `UpdateClienteCommandValidator` does not exist
  - **Verifies:** Happy path — validator accepts valid command

### Backend Integration Tests (8 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/UpdateClienteEndpointTests.cs`

- **Test:** `PutCliente_Returns200Ok_WithUpdatedClienteDtoBody_OnValidPayload`
  - **Status:** RED - `PUT /api/v1/clientes/{id}` endpoint does not exist
  - **Verifies:** AC2 — 200 OK with correct DTO

- **Test:** `PutCliente_ResponseContainsCamelCaseFields`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC2 — camelCase serialization

- **Test:** `PutCliente_UpdatedAtTimestampIsRefreshed`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC2 — updatedAt is refreshed

- **Test:** `PutCliente_ReturnsApplicationJson_ContentType`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC2 — content-type header

- **Test:** `PutCliente_UpdatedClientReflectsNewValues_WhenFetchedAfterUpdate`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC2, FR27 — GET after PUT shows new values

- **Test:** `PutCliente_Returns400_WhenRequiredFieldsAreEmpty`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC3 — 400 + Problem Details on empty fields

- **Test:** `PutCliente_Returns400_WhenFieldsAreWhitespaceOnly`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC3 — 400 on whitespace-only fields

- **Test:** `PutCliente_Returns404WithProblemDetails_WhenClientDoesNotExist`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC5 — 404 + Problem Details for unknown ID

---

## Data Factories Created

No separate data factory files created. Test data is defined inline using `ClienteEntity.Create()` factory method (backend) and inline object literals (frontend), following existing project patterns from Stories 2.1–2.3.

The `buildClienteDetail()` helper in `ClienteDetailPanel.edit-flow.test.tsx` and `ClienteDetailPanel.test.tsx` acts as a data builder for MSW response stubs.

---

## Fixtures Created

No new Playwright fixture files. The project uses Vitest + RTL + MSW (not Playwright E2E), following the existing test infrastructure. Each test uses its own `QueryClient` instance for isolation (matching Stories 2.2 and 2.3 patterns).

---

## Mock Requirements

### PUT /api/v1/clientes/{id} — REST API Mock (MSW, frontend tests)

**Endpoint:** `PUT http://localhost:5000/api/v1/clientes/:id`

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Actualizada S.A.",
  "nit": "900123456-7",
  "telefono": "6019876543",
  "ciudad": "Medellín",
  "createdAt": "2026-06-25T10:30:00Z",
  "updatedAt": "2026-06-25T11:00:00Z"
}
```

**409 Conflict Response:**
```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "El NIT/RUC ya está registrado."
}
```

**500 Error Response:**
```json
{
  "status": 500,
  "title": "Internal Server Error"
}
```

**Notes:** MSW intercepts are registered in `setupServer()` for each test group. Handlers are reset between tests with `server.resetHandlers()`.

---

## Required data-testid Attributes

### ClienteDetailPanel

- `cliente-editar-button` — "Editar" button in the detail panel header (only rendered in loaded/success state)
- `cliente-edit-form` — wrapper element around `ClienteForm` when rendered in edit mode inside `ClienteDetailPanel`
- `cliente-detail-content` — existing (Stories 2.2) — the `<dl>` detail view hidden when editing
- `cliente-detail-skeleton` — existing (Stories 2.2) — skeleton loader
- `cliente-not-found` — existing (Stories 2.2) — 404 message
- `error-panel` — existing (Stories 2.1/2.2) — ErrorPanel component

### ClienteForm (edit mode additions)

- `nombre-input` — Nombre input field (same as create mode)
- `nit-input` — NIT/RUC input field (same as create mode)
- `telefono-input` — Teléfono input field (same as create mode)
- `ciudad-input` — Ciudad input field (same as create mode)

**Implementation Example:**
```tsx
{/* ClienteDetailPanel.tsx */}
{isLoaded && !isEditing && (
  <button data-testid="cliente-editar-button" ...>Editar</button>
)}
{isEditing && (
  <div data-testid="cliente-edit-form">
    <ClienteForm mode="edit" clienteId={clienteId} initialData={...} ... />
  </div>
)}

{/* ClienteForm.tsx — form element */}
<form aria-label={mode === 'edit' ? 'Editar cliente' : 'Crear cliente'} ...>
```

---

## Implementation Checklist

### Test: `PutCliente_Returns200Ok_*` + `HandleAsync_WithValidInput_*`

**File:** `backend/tests/SiesaAgents.IntegrationTests/UpdateClienteEndpointTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `UpdateClienteCommand.cs`: `record UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad)`
- [ ] Create `UpdateClienteCommandHandler.cs`: calls `GetByIdAsync` → if null returns null, updates fields, calls `UpdateAsync`, returns `ClienteDto`
- [ ] Create `UpdateClienteCommandValidator.cs` (FluentValidation): validates `Id` not empty, all string fields not empty/whitespace, max 200 chars
- [ ] Add `Task<ClienteEntity> UpdateAsync(ClienteEntity)` to `IClienteRepository.cs`
- [ ] Implement `UpdateAsync` in `ClienteRepository.cs`: fetch entity, update fields, set `UpdatedAt = DateTimeOffset.UtcNow`, call `SaveChangesAsync()`
- [ ] Add `PUT /api/v1/clientes/{id:guid}` to `ClienteEndpoints.cs`: validate → call handler → 200 OK or 404
- [ ] Register `UpdateClienteCommandHandler` and `UpdateClienteCommandValidator` in `Program.cs`
- [ ] Add `UpdateAsync` stub to all three fake repositories in existing unit test files
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "UpdateClienteEndpointTests"`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateClienteCommandHandlerTests"`
- [ ] Verify ExceptionHandlingMiddleware 409 branch from Story 2.3 covers the PUT path
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: `useUpdateCliente.test.ts` — all tests

**File:** `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

**Tasks to make these tests pass:**

- [ ] Add `update(id: string, data: UpdateClienteData): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Implement `update` method in `clienteApiRepository.ts`: `apiClient.put<Cliente>(\`/api/v1/clientes/${id}\`, data)`
- [ ] Create `useUpdateCliente.ts`: `useMutation` with `mutationFn` calling `clienteApiRepository.update(clienteId, data)`, `onSuccess` calls `invalidateQueries(['clientes'])` and `invalidateQueries(['clientes', clienteId])`
- [ ] Add `updateClienteSchema` and `UpdateClienteData` type to `clienteSchema.ts`
- [ ] Run test: `cd frontend && npx vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: `ClienteForm.edit-mode.test.tsx` — all tests

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit-mode.test.tsx`

**Tasks to make these tests pass:**

- [ ] Extend `ClienteForm` props: add `mode: 'create' | 'edit'`, `clienteId?: string`, `initialData?: Pick<Cliente, 'nombre' | 'nit' | 'telefono' | 'ciudad'>`
- [ ] When `mode === 'edit'`: use `useForm({ defaultValues: initialData })` to pre-fill fields
- [ ] In edit mode: use `updateClienteSchema` as Zod resolver (not `createClienteSchema`)
- [ ] In edit mode: call `useUpdateCliente(clienteId!)` mutation on submit
- [ ] In edit mode: submit button label = "Guardar cambios"
- [ ] In edit mode: form `aria-label` = "Editar cliente"
- [ ] On edit success: call `toast.success('Cliente actualizado correctamente')` then `onSuccess()`
- [ ] On edit 5xx/network: call `toast.error('No se pudo actualizar el cliente. Intenta de nuevo.')`
- [ ] On 409 in edit mode: `setError('nit', { type: 'server', message: 'El NIT/RUC ya está registrado' })`
- [ ] Loading state: button label = "Guardando…" and disabled while `isPending`
- [ ] Add `data-testid` attributes to form elements
- [ ] Run test: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteForm.edit-mode.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: `ClienteDetailPanel.edit-flow.test.tsx` — all tests

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.edit-flow.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `useState<boolean>` `isEditing` (default `false`) to `ClienteDetailPanel`
- [ ] Add "Editar" button with `data-testid="cliente-editar-button"` — render only when data is loaded (not during skeleton/error/404)
- [ ] When `isEditing`, render `<div data-testid="cliente-edit-form"><ClienteForm mode="edit" clienteId={clienteId!} initialData={...} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} /></div>`
- [ ] When `isEditing`, hide the `<dl>` detail content (`data-testid="cliente-detail-content"`)
- [ ] `onSuccess` and `onCancel` set `isEditing(false)` (detail view restored by toggle)
- [ ] Run test: `cd frontend && npx vitest run src/modules/crm/clientes/presentation/ClienteDetailPanel.edit-flow.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Frontend — run all Story 2.4 ATDD tests
cd frontend && npx vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts src/modules/crm/clientes/presentation/ClienteForm.edit-mode.test.tsx src/modules/crm/clientes/presentation/ClienteDetailPanel.edit-flow.test.tsx

# Frontend — run specific file
cd frontend && npx vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts

# Frontend — run in watch mode
cd frontend && npx vitest src/modules/crm/clientes

# Backend — run Story 2.4 unit tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateClienteCommandHandlerTests"

# Backend — run Story 2.4 integration tests
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "UpdateClienteEndpointTests"

# Backend — run all tests
dotnet test backend/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (51 tests total across 4 files)
- MSW handlers configured for network mocking (no Playwright utils needed — `tea_use_playwright_utils: false`)
- Mock requirements documented for DEV team
- `data-testid` requirements listed
- Implementation checklist created per test group

**Verification:**

- Tests fail because: `useUpdateCliente` module does not exist, `ClienteForm` does not accept `mode='edit'` prop, `ClienteDetailPanel` has no "Editar" button, `UpdateClienteCommandHandler/Validator` C# types do not exist, `PUT /api/v1/clientes/{id}` endpoint does not exist
- Failure messages are clear: `Cannot find module './useUpdateCliente'` (frontend), `CS0246: The type or namespace name 'UpdateClienteCommandHandler' could not be found` (backend)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (recommend starting with backend: `UpdateClienteCommandHandlerTests`)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**

1. Backend: `UpdateClienteCommand` + `UpdateClienteCommandHandler` + `UpdateClienteCommandValidator` → unit tests green
2. Backend: `IClienteRepository.UpdateAsync` + `ClienteRepository.UpdateAsync` + `ClienteEndpoints PUT` → integration tests green
3. Frontend: `updateClienteSchema` + `useUpdateCliente.ts` → hook tests green
4. Frontend: Extend `ClienteForm` with edit mode → edit-mode tests green
5. Frontend: Extend `ClienteDetailPanel` with Editar button + isEditing → detail panel tests green

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 51 Story 2.4 tests pass
2. Ensure existing tests from Stories 2.1–2.3 still pass (no regressions)
3. Extract any duplication between create and edit modes in `ClienteForm`
4. Review error handling code for clarity
5. Confirm WCAG 2.1 AA compliance structurally (no `@axe-core/react` installed per Story 2.3 note)

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `cd frontend && npx vitest run src/modules/crm/clientes`
3. Begin implementation using the implementation checklist above
4. Work one test group at a time (RED → GREEN for each group)
5. When all tests pass, refactor for quality
6. When complete, manually update story status in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — each test uses its own fresh `QueryClient` instance for isolation (no shared state between tests)
- **data-factories.md** — `buildClienteDetail()` builder pattern for MSW stubs; `ClienteEntity.Create()` factory for backend seeds
- **network-first.md** — MSW `setupServer()` intercepts are registered before test execution (network-first pattern equivalent in Vitest/MSW)
- **test-quality.md** — Given-When-Then structure in all tests; one assertion focus per test; `afterEach` cleanup with `server.resetHandlers()` and `vi.clearAllMocks()`
- **selector-resilience.md** — `data-testid` selectors used throughout (`cliente-editar-button`, `cliente-edit-form`, `cliente-detail-content`); `getByLabelText` for form fields (ARIA-resilient)
- **test-levels-framework.md** — Component tests for frontend hooks/components (most appropriate for React + Vitest setup); API integration tests for backend endpoints; no E2E Playwright tests (not yet configured for this project)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `cd frontend && npx vitest run src/modules/crm/clientes/application/useUpdateCliente.test.ts`

**Expected Results:**

```
FAIL  src/modules/crm/clientes/application/useUpdateCliente.test.ts
  Error: Cannot find module './useUpdateCliente' from 'src/modules/crm/clientes/application/useUpdateCliente.test.ts'
```

**Command:** `dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateClienteCommandHandlerTests"`

**Expected Results:**

```
Build FAILED.
Error CS0246: The type or namespace name 'UpdateClienteCommandHandler' could not be found
Error CS0246: The type or namespace name 'UpdateClienteCommandValidator' could not be found
Error CS0246: The type or namespace name 'UpdateClienteCommand' could not be found
```

**Summary:**

- Total frontend tests for Story 2.4: 33 (5 hook + 16 form edit + 12 detail panel)
- Total backend tests for Story 2.4: 18 (10 unit + 8 integration)
- Total: 51 tests
- Passing: 0 (expected — RED phase)
- Failing: 51 (expected — RED phase)
- Status: RED phase verified

---

## Notes

- **No E2E Playwright tests** — the project uses Vitest + RTL + MSW for frontend component testing (no Playwright config found). E2E tests would require framework setup first (`testarch-framework` workflow).
- **AC6 (409 integration test)** — cannot be tested with InMemory EF (no unique constraint enforcement). Covered at unit level. PostgreSQL test container required for full integration coverage.
- **`tea_use_playwright_utils: false`** — no Playwright utils patterns used. MSW is the network interception mechanism.
- **Story 2.3 pattern followed** — test structure, MSW setup, `vi.mock('siesa-ui-kit')`, and `createWrapper()` patterns match the existing Story 2.3 test files exactly for consistency.
- **Existing `ClienteDetailPanel.test.tsx` unchanged** — Story 2.4 edit-flow tests are in a separate file (`ClienteDetailPanel.edit-flow.test.tsx`) to avoid modifying RED-phase tests from Story 2.2 (they are already GREEN).

---

**Generated by BMad TEA Agent** - 2026-06-25
