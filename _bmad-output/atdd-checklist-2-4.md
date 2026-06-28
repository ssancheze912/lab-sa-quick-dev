# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component (P0/P1) + API Integration + E2E

---

## Story Summary

As a commercial team member, I want to edit any field of an existing client so that the client information stays up to date. The story introduces a PUT /api/v1/clientes/:id endpoint on the backend and extends the existing ClienteForm component with edit-mode props (clienteId + defaultValues). The "Editar" button is wired in ClienteDetailView.

**As a** commercial team member
**I want** to edit any field of an existing client
**So that** the client information stays up to date

---

## Acceptance Criteria

1. **Given** the user is viewing a client's detail in the right panel, **When** the user clicks "Editar", **Then** the `ClienteForm` opens pre-filled with the current values of all fields: Nombre, NIT/RUC, Teléfono, Ciudad (FR6).

2. **Given** the user modifies one or more fields and submits the form, **When** the form is saved, **Then** the changes are sent via `PUT /api/v1/clientes/:id`, the updated values are reflected immediately in the client detail and the left panel list without page reload (FR27), **And** a success toast displays "Cliente actualizado correctamente".

3. **Given** the user clears a required field and submits, **When** the form is validated, **Then** an inline error message appears on the empty field and the form is NOT submitted to the backend (FR8).

4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original client data remains unchanged and no API call is made.

---

## Failing Tests Created (RED Phase)

### Backend API Tests (4 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/UpdateClienteApiTests.cs`

- **Test:** `PutCliente_WithValidPayload_Returns200WithUpdatedClienteDto`
  - **Status:** RED - `UpdateClienteCommandHandler`, `IClienteRepository.UpdateAsync`, and `PUT /{id:guid}` endpoint do not exist yet
  - **Verifies:** TC-E2-2-4-API-1 (P1) — PUT valid payload → 200 + updated ClienteDto with DateTimeOffset fields

- **Test:** `PutCliente_WithNombreNull_Returns400WithProblemDetailsErrors`
  - **Status:** RED - `UpdateClienteRequestValidator` does not exist yet
  - **Verifies:** TC-E2-2-4-API-2 (P1) — PUT Nombre=null → 400 + Problem Details with errors object

- **Test:** `PutCliente_WithUnknownUuid_Returns404WithProblemDetails`
  - **Status:** RED - endpoint does not exist, handler returns null → 404 Problem Details not yet wired
  - **Verifies:** TC-E2-2-4-API-3 (P1) — PUT unknown UUID → 404 + Problem Details (Results.Problem NOT Results.NotFound)

- **Test:** `PutCliente_WithNitAlreadyUsedByAnotherCliente_Returns409WithProblemDetails`
  - **Status:** RED - DbUpdateException 23505 handling not yet implemented for PUT endpoint
  - **Verifies:** TC-E2-2-4-API-4 (P2) — PUT NIT conflict → 409 + Problem Details "El NIT/RUC ya está registrado"

### Backend Unit Tests (4 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/UpdateClienteValidatorTests.cs`

- **Test:** `Validate_WhenNombreIsNull_ShouldHaveValidationError`
  - **Status:** RED - `UpdateClienteRequestValidator` does not exist yet
  - **Verifies:** TC-E2-2-4-UNIT-1 (P2) — Validator rejects null Nombre

- **Test:** `Validate_WhenNitIsNull_ShouldHaveValidationError`
  - **Status:** RED - `UpdateClienteRequestValidator` does not exist yet
  - **Verifies:** TC-E2-2-4-UNIT-2 (P2) — Validator rejects null Nit

- **Test:** `Validate_WhenTelefonoIsNull_ShouldHaveValidationError`
  - **Status:** RED - `UpdateClienteRequestValidator` does not exist yet
  - **Verifies:** TC-E2-2-4-UNIT-3 (P2) — Validator rejects null Telefono

- **Test:** `Validate_WhenCiudadIsNull_ShouldHaveValidationError`
  - **Status:** RED - `UpdateClienteRequestValidator` does not exist yet
  - **Verifies:** TC-E2-2-4-UNIT-4 (P2) — Validator rejects null Ciudad

### Frontend Component Tests (9 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/EditClienteForm.test.tsx`

- **Test:** `TC-E2-2-4-CMP-1: should pre-fill all 4 fields with the provided defaultValues when in edit mode`
  - **Status:** RED - `ClienteForm` does not accept `clienteId` or `defaultValues` props yet
  - **Verifies:** TC-E2-2-4-CMP-1 (P1) — pre-fills Nombre, NIT, Teléfono, Ciudad from defaultValues

- **Test:** `should show "Guardar cambios" submit button label in edit mode`
  - **Status:** RED - edit-mode conditional label not implemented yet
  - **Verifies:** Submit button label switches to "Guardar cambios" in edit mode

- **Test:** `TC-E2-2-4-CMP-2: should call onClose without calling PUT when "Cancelar" is clicked`
  - **Status:** RED - edit-mode cancel behavior not implemented yet
  - **Verifies:** TC-E2-2-4-CMP-2 (P1) — cancel calls onClose, no PUT (AC #4, R-009)

- **Test:** `TC-E2-2-4-CMP-4: should show inline error and NOT call PUT when a required field is cleared and submitted` [P0]
  - **Status:** RED - edit-mode submit with Zod validation guard not implemented yet
  - **Verifies:** TC-E2-2-4-CMP-4 (P0) — empty required field → inline error, no PUT (AC #3, R-004)

- **Test:** `should NOT call PUT when NIT field is cleared and form is submitted`
  - **Status:** RED - edit-mode validation not implemented yet
  - **Verifies:** Zod client-side guard also catches empty NIT in edit mode

- **Test:** `TC-E2-2-4-CMP-3: should show toast "Cliente actualizado correctamente" after successful PUT 200`
  - **Status:** RED - `useUpdateCliente` mutation hook does not exist yet
  - **Verifies:** TC-E2-2-4-CMP-3 (P2) — toast exact text "Cliente actualizado correctamente" (AC #2, R-010)

- **Test:** `should disable submit button while PUT mutation is pending`
  - **Status:** RED - `useUpdateCliente` isPending not wired to submit button yet
  - **Verifies:** isPending guard on submit button during edit mutation

- **Test:** `TC-E2-2-4-CMP-5: should display "El NIT/RUC ya está registrado" as inline NIT error when PUT returns 409`
  - **Status:** RED - onError handler for 409 in edit mode not implemented yet
  - **Verifies:** TC-E2-2-4-CMP-5 (P2) — 409 → NIT inline error "El NIT/RUC ya está registrado"

- **Test:** `should NOT show generic error panel for 409 — error is inline on NIT field only`
  - **Status:** RED - 409 handling for edit not implemented
  - **Verifies:** NFR6 — no technical details in UI; 409 surfaces inline only

### E2E Tests (4 tests)

**File:** `e2e/tests/clientes/clientes-edit.spec.ts`

- **Test:** `TC-E2-2-4-E2E-1: should show updated Nombre in left panel and detail view immediately after edit without page reload`
  - **Status:** RED - entire edit flow not implemented
  - **Verifies:** TC-E2-2-4-E2E-1 (P1) — end-to-end edit: FR27 (invalidateQueries both keys), R-002, R-010

- **Test:** `should show "Editar" button only when client detail is loaded`
  - **Status:** RED - btn-editar not in ClienteDetailView yet
  - **Verifies:** btn-editar visible only in data-loaded state (AC #1)

- **Test:** `should keep original client data unchanged when "Cancelar" is clicked in edit form`
  - **Status:** RED - edit form + cancel behavior not implemented
  - **Verifies:** AC #4, R-009 — cancel discards changes, no PUT called

- **Test:** `should show inline validation errors when a required field is cleared and submitted in edit mode`
  - **Status:** RED - edit form validation in E2E context not implemented
  - **Verifies:** AC #3 — Zod guard prevents PUT on invalid form

---

## Data Factories Created

No new factories required — `buildCliente` from `clienteFactory.ts` (Story 2.1) and `buildCliente` from `e2e/helpers/data.helper.ts` are reused directly. Both are already available in the project.

---

## Fixtures Created

No new fixtures created — existing `base.fixture.ts` and `ApiHelper` from E2E test infrastructure (established in Stories 2.1–2.3) are reused.

---

## Mock Requirements

### PUT /api/v1/clientes/:id — Success Response

**Endpoint:** `PUT /api/v1/clientes/:id`

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "nombre": "Empresa Actualizada SA",
  "nit": "900123456-1",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-06-28T15:00:00Z"
}
```

**Validation Error Response (400):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "Nombre": ["'Nombre' must not be empty."] }
}
```

**Not Found Response (404):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Cliente no encontrado",
  "status": 404,
  "detail": "El cliente solicitado no fue encontrado."
}
```

**Conflict Response (409):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado"
}
```

**Notes:** MSW handlers intercept `PUT /api/v1/clientes/:id` pattern. Playwright intercepts use `**/api/v1/clientes/${id}` with method filter for PUT.

---

## Required data-testid Attributes

### ClienteDetailView (new)

- `btn-editar` — "Editar" button; must be visible ONLY in the data-loaded state (not during loading/error/not-found)

### ClienteForm (already present from Story 2.3, reused in edit mode)

- `cliente-form` — form root element
- `input-nombre` — Nombre input field
- `input-nit` — NIT/RUC input field
- `input-telefono` — Teléfono input field
- `input-ciudad` — Ciudad input field
- `btn-submit` — Submit button (text: "Guardar cambios" in edit mode, "Crear cliente" in create mode)
- `btn-cancel` — Cancel button (text: "Cancelar")

**Implementation Example:**

```tsx
// ClienteDetailView — data-loaded state only
<button
  onClick={() => setIsEditFormOpen(true)}
  data-testid="btn-editar"
>
  Editar
</button>

// ClienteForm — submit button with edit-mode label
<button type="submit" disabled={isPending} data-testid="btn-submit">
  {isPending
    ? (isEditMode ? 'Guardando...' : 'Creando...')
    : (isEditMode ? 'Guardar cambios' : 'Crear cliente')}
</button>
```

---

## Implementation Checklist

### Test: TC-E2-2-4-API-1 — PUT valid payload → 200

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/UpdateClienteApiTests.cs`

**Tasks to make this test pass:**

- [ ] Create `UpdateClienteRequest` record in `SiesaAgents.Application/Clientes/DTOs/`
- [ ] Create `UpdateClienteCommand` and `UpdateClienteCommandHandler` in `SiesaAgents.Application/Clientes/Commands/`
- [ ] Add `Update(string nombre, string nit, string telefono, string ciudad)` method to `ClienteEntity` (sets `UpdatedAt = DateTimeOffset.UtcNow`)
- [ ] Add `Task UpdateAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository`
- [ ] Implement `UpdateAsync` in `ClienteRepository` (`_context.Clientes.Update(entity); await _context.SaveChangesAsync(ct);`)
- [ ] Add `MapPut("/{id:guid}", ...)` to `ClienteEndpoints.cs` — returns `Results.Ok(dto)` (200 NOT 201)
- [ ] Register `UpdateClienteCommandHandler` in `Program.cs` DI
- [ ] Add required `data-testid="btn-editar"` attribute
- [ ] Run test: `dotnet test --filter "PutCliente_WithValidPayload_Returns200WithUpdatedClienteDto"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: TC-E2-2-4-API-2 — PUT Nombre=null → 400

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/UpdateClienteApiTests.cs`

**Tasks to make this test pass:**

- [ ] Create `UpdateClienteRequestValidator` with FluentValidation rules (same as CreateClienteRequestValidator: NotEmpty + MaximumLength for all 4 fields)
- [ ] Wire validator in PUT endpoint: validate before handler call → `Results.ValidationProblem(validation.ToDictionary())`
- [ ] Register `UpdateClienteRequestValidator` in `Program.cs` DI
- [ ] Run test: `dotnet test --filter "PutCliente_WithNombreNull_Returns400WithProblemDetailsErrors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-2-4-API-3 — PUT unknown UUID → 404

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/UpdateClienteApiTests.cs`

**Tasks to make this test pass:**

- [ ] Handler returns `null` when `IClienteRepository.GetByIdAsync` returns null
- [ ] Endpoint maps null result to `Results.Problem(detail: "El cliente solicitado no fue encontrado.", statusCode: 404, title: "Cliente no encontrado")`
- [ ] Run test: `dotnet test --filter "PutCliente_WithUnknownUuid_Returns404WithProblemDetails"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-2-4-API-4 — PUT NIT conflict → 409

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/UpdateClienteApiTests.cs`

**Tasks to make this test pass:**

- [ ] Add `catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))` block to PUT endpoint (reuse `IsUniqueConstraintViolation` helper from Story 2.3)
- [ ] Return `Results.Problem(detail: "El NIT/RUC ya está registrado", statusCode: 409, title: "Conflicto de datos")`
- [ ] Run test: `dotnet test --filter "PutCliente_WithNitAlreadyUsedByAnotherCliente_Returns409WithProblemDetails"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: TC-E2-2-4-UNIT-1/2/3/4 — Validator rejects null fields

**File:** `backend/tests/SiesaAgents.UnitTests/Clientes/UpdateClienteValidatorTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>` with `RuleFor(x => x.Nombre).NotEmpty().MaximumLength(255)`, same for Nit (MaxLength 50), Telefono (MaxLength 50), Ciudad (MaxLength 100)
- [ ] Run tests: `dotnet test --filter "UpdateClienteValidatorTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E2-2-4-CMP-1 — Edit mode pre-fills all 4 fields

**File:** `frontend/src/modules/crm/clientes/__tests__/EditClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Add optional props to `ClienteForm`: `clienteId?: string`, `defaultValues?: ClienteFormData`
- [ ] When `clienteId` provided: pass `defaultValues` to `useForm({ resolver: zodResolver(clienteSchema), defaultValues })`
- [ ] Submit button label: "Guardar cambios" when `isEditMode`, "Crear cliente" otherwise
- [ ] Add required `data-testid` attributes: `btn-editar` on ClienteDetailView "Editar" button
- [ ] Run test: `pnpm --filter frontend test EditClienteForm`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-2-4-CMP-2 — Cancel edit — no PUT called (AC #4, R-009)

**File:** `frontend/src/modules/crm/clientes/__tests__/EditClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Cancel button calls `onClose()` only — no mutation triggered (same as create mode)
- [ ] React Hook Form instance is discarded on close — TanStack Query cache remains untouched
- [ ] Run test: `pnpm --filter frontend test EditClienteForm`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: TC-E2-2-4-CMP-4 [P0] — Empty required field → inline error, no PUT

**File:** `frontend/src/modules/crm/clientes/__tests__/EditClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Ensure `clienteSchema` Zod validation fires on submit in edit mode (same schema as create mode)
- [ ] Submit button with `handleSubmit(onSubmit)` — Zod prevents `onSubmit` from being called when invalid
- [ ] `aria-describedby` on all form inputs pointing to error span IDs (WCAG 2.1 AA)
- [ ] Run test: `pnpm --filter frontend test EditClienteForm`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: TC-E2-2-4-CMP-3 — Valid edit submit → toast (AC #2, R-010)

**File:** `frontend/src/modules/crm/clientes/__tests__/EditClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `useUpdateCliente.ts` with TanStack Query `useMutation`:
  - `mutationFn: ({ id, data }) => clienteApiRepository.update(id, data)`
  - `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); queryClient.invalidateQueries({ queryKey: ['clientes', data.id] }); toast.success('Cliente actualizado correctamente'); }`
- [ ] Extend `IClienteRepository` with `update(id: string, data: ClienteFormData): Promise<Cliente>`
- [ ] Implement `update` in `clienteApiRepository` using `apiClient.put(...)`
- [ ] Use `useUpdateCliente` in `ClienteForm` when `isEditMode === true`
- [ ] Run test: `pnpm --filter frontend test EditClienteForm`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-2-4-CMP-5 — 409 → NIT inline error

**File:** `frontend/src/modules/crm/clientes/__tests__/EditClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] In edit-mode `onSubmit`, handle `onError`: `if (axios.isAxiosError(error) && error.response?.status === 409) { setError('nit', { message: 'El NIT/RUC ya está registrado' }); }`
- [ ] Run test: `pnpm --filter frontend test EditClienteForm`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: TC-E2-2-4-E2E-1 — Edit client end-to-end

**File:** `e2e/tests/clientes/clientes-edit.spec.ts`

**Tasks to make this test pass:**

- [ ] Wire "Editar" button in `ClienteDetailView` with `data-testid="btn-editar"` — visible only in data-loaded state
- [ ] Local `useState<boolean>` `isEditFormOpen` controls edit form visibility
- [ ] Render `<ClienteForm clienteId={data.id} defaultValues={...} onClose={() => setIsEditFormOpen(false)} />` as accessible modal (role="dialog") when `isEditFormOpen === true`
- [ ] `queryClient.invalidateQueries({ queryKey: ['clientes'] })` AND `queryClient.invalidateQueries({ queryKey: ['clientes', data.id] })` called in `useUpdateCliente.onSuccess`
- [ ] Toast exact text: "Cliente actualizado correctamente" (R-010 enforcement)
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/clientes-edit.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all backend tests for Story 2.4
dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateCliente"

# Run specific API tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateClienteApiTests"

# Run specific validator tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateClienteValidatorTests"

# Run frontend component tests for Story 2.4
pnpm --filter frontend test EditClienteForm

# Run all frontend tests
pnpm --filter frontend test

# Run E2E tests for Story 2.4
pnpm exec playwright test e2e/tests/clientes/clientes-edit.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/clientes-edit.spec.ts --headed

# Debug specific E2E test
pnpm exec playwright test e2e/tests/clientes/clientes-edit.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (RED state)
- ✅ Fixtures and factories reused from prior stories (no new ones needed)
- ✅ Mock requirements documented (PUT endpoint shapes)
- ✅ data-testid requirements listed (`btn-editar` new; existing form testids reused)
- ✅ Implementation checklist created with clear tasks

**Verification:**

- All tests run and fail as expected (missing implementation)
- Failure messages are clear: missing component props, missing endpoint, missing hook
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with P0: TC-E2-2-4-CMP-4)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order (by priority):**
1. TC-E2-2-4-CMP-4 (P0) — Validation guard in edit mode
2. TC-E2-2-4-API-1, API-2, API-3 (P1) — Backend endpoint
3. TC-E2-2-4-CMP-1, CMP-2 (P1) — Pre-fill and cancel
4. TC-E2-2-4-E2E-1 (P1) — End-to-end flow
5. TC-E2-2-4-API-4, CMP-3, CMP-5 (P2) — Edge cases

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (extend ClienteForm — do NOT rewrite it)
- Run tests frequently (immediate feedback)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (no `any` types, no union type casting complexity)
3. **Verify strict TypeScript** — prefer separate `if (isEditMode)` branches over union cast
4. **Ensure tests still pass** after each refactor
5. **Mark story as done** in sprint-status

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase:
   - `dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateCliente"`
   - `pnpm --filter frontend test EditClienteForm`
   - `pnpm exec playwright test e2e/tests/clientes/clientes-edit.spec.ts`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **selector-resilience.md** — All selectors use `data-testid` hierarchy; no fragile CSS selectors
- **network-first.md** — All MSW handlers and `page.route()` intercepts are set BEFORE render/navigation
- **test-quality.md** — Given-When-Then structure; one primary assertion per test; no hard waits
- **data-factories.md** — `buildCliente` reused (existing factory); no hardcoded test data
- **fixture-architecture.md** — `ApiHelper` reused for E2E setup/teardown; auto-cleanup via `afterEach`
- **component-tdd.md** — `QueryClientProvider` wrapper with isolated `QueryClient` per test; MSW for network isolation
- **timing-debugging.md** — `waitFor()` used for all async assertions; no `page.waitForTimeout()` hard waits

---

## Test Execution Evidence

### Expected Failure Messages (RED Phase)

**Backend:**
```
System.TypeLoadException: Could not load type 'SiesaAgents.Application.Clientes.DTOs.UpdateClienteRequest'
-- OR --
System.Net.Http.HttpRequestException: Response status code does not indicate success: 404 (Not Found)
[PUT /api/v1/clientes/{id} endpoint not registered]
```

**Frontend:**
```
TypeError: Cannot read properties of undefined (reading 'clienteId')
-- OR --
Error: ClienteForm does not accept 'clienteId' prop
-- OR --
AssertionError: expected input to have value 'Empresa Pre-Rellena SA', got ''
[defaultValues not passed to useForm]
```

**E2E:**
```
TimeoutError: page.getByTestId('btn-editar') not visible (timeout 5000ms)
[btn-editar not rendered in ClienteDetailView]
```

**Summary:**

- Total tests: 21 (4 API + 4 Unit + 9 Component + 4 E2E)
- Passing: 0 (expected — RED phase)
- Failing: 21 (expected — RED phase)
- Status: RED phase ready for handoff to DEV

---

## Notes

- `UpdateClienteRequest` record mirrors `CreateClienteRequest` — same 4 fields, same validation rules. Do NOT create a new schema; same Zod `clienteSchema` from Story 2.1 is reused on frontend.
- `IsUniqueConstraintViolation` helper already exists in `ClienteEndpoints.cs` from Story 2.3 — reuse it directly.
- `ClienteForm` must be EXTENDED (not rewritten) — the create path from Story 2.3 must remain fully functional.
- E2E test TC-E2-2-4-E2E-1 uses the REAL backend (no mocks) to verify the full stack integration including FR27 (invalidateQueries).
- Cancel button behavior is inherently correct with React Hook Form: discarding the form instance discards all state — no explicit `reset()` needed. This is the R-009 mitigation.
- Two query invalidations are required in `useUpdateCliente.onSuccess`: `['clientes']` (list panel) AND `['clientes', data.id]` (detail panel). Both are tested via E2E.

---

**Generated by BMad TEA Agent** — 2026-06-28
