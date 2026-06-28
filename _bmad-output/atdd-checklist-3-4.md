# ATDD Checklist - Epic 3, Story 3.4: Edit Contact

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component (frontend) + API (backend) + E2E

---

## Story Summary

A commercial team member can edit any field of an existing contact (Nombre, Cargo, Teléfono, Email) by clicking "Editar" in the contact detail view. The form opens pre-filled with current values, validates fields client-side (Zod), sends the update via `PUT /api/v1/contactos/:id`, and immediately reflects changes in both the detail view and the list without a page reload (FR27). Cancel discards changes without any API call.

**As a** commercial team member
**I want** to edit any field of an existing contact
**So that** the contact information stays current

---

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Editar", **Then** the contact form opens pre-filled with the current values of all fields: Nombre, Cargo, Teléfono, Email (FR14).
2. **Given** the user modifies one or more fields and submits, **When** the form is saved, **Then** changes are sent via `PUT /api/v1/contactos/:id`, updated values appear immediately in the contact detail and list without page reload (FR27), **And** a success toast displays "Contacto actualizado correctamente".
3. **Given** the user clears a required field and submits, **When** the form is validated (client-side Zod), **Then** an inline error message appears on the empty field and the form is NOT submitted to the backend (FR16).
4. **Given** the user clicks "Cancelar" without saving, **When** the form closes, **Then** the original contact data remains unchanged and no API call is made.

---

## Failing Tests Created (RED Phase)

### Backend API Tests (4 tests — xUnit / WebApplicationFactory)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/UpdateContactoApiTests.cs`

- **Test:** `PutContacto_WithValidPayload_Returns200WithUpdatedContactoDto`
  - **Status:** RED — `PUT /api/v1/contactos/:id` endpoint does not exist yet
  - **Verifies:** TC-E3-3-4-API-1 (P1) — 200 OK + updated ContactoDto with DateTimeOffset fields, UpdatedAt >= CreatedAt
  - **AC:** #2

- **Test:** `PutContacto_WithNombreNull_Returns400WithProblemDetailsErrors`
  - **Status:** RED — endpoint does not exist yet
  - **Verifies:** TC-E3-3-4-API-2 (P1) — 400 + Problem Details with errors object containing `Nombre`
  - **AC:** #3

- **Test:** `PutContacto_WithUnknownUuid_Returns404WithProblemDetails`
  - **Status:** RED — endpoint does not exist yet
  - **Verifies:** TC-E3-3-4-API-3 (P1) — 404 + Problem Details "Contacto no encontrado", no stack trace
  - **AC:** #2

- **Test:** `PutContacto_WithEmailAlreadyUsedByAnotherContacto_Returns409WithProblemDetails`
  - **Status:** RED — endpoint does not exist yet
  - **Verifies:** TC-E3-3-4-API-4 (P2) — 409 + "El email ya está registrado" in Problem Details, no stack trace
  - **AC:** #2

### Backend Validator Unit Tests (8 tests — xUnit / FluentValidation.TestHelper)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/UpdateContactoValidatorTests.cs`

- **Test:** `Validate_WhenNombreIsNull_ShouldHaveValidationError`
  - **Status:** RED — `UpdateContactoRequestValidator` does not exist yet
  - **Verifies:** TC-E3-3-4-UNIT-1 (P2) — Validator rejects null Nombre

- **Test:** `Validate_WhenNombreIsEmpty_ShouldHaveValidationError`
  - **Status:** RED — `UpdateContactoRequestValidator` does not exist yet
  - **Verifies:** TC-E3-3-4-UNIT-1 (P2) variant — Validator rejects empty Nombre

- **Test:** `Validate_WhenNombreExceeds255Chars_ShouldHaveValidationError`
  - **Status:** RED — validator does not exist
  - **Verifies:** MaximumLength(255) rule for Nombre

- **Test:** `Validate_WhenCargoIsNull_ShouldHaveValidationError`
  - **Status:** RED — `UpdateContactoRequestValidator` does not exist yet
  - **Verifies:** TC-E3-3-4-UNIT-2 (P2) — Validator rejects null Cargo

- **Test:** `Validate_WhenCargoIsEmpty_ShouldHaveValidationError`
  - **Status:** RED — validator does not exist

- **Test:** `Validate_WhenTelefonoIsNull_ShouldHaveValidationError`
  - **Status:** RED — `UpdateContactoRequestValidator` does not exist yet
  - **Verifies:** TC-E3-3-4-UNIT-3 (P2) — Validator rejects null Telefono

- **Test:** `Validate_WhenEmailIsNull_ShouldHaveValidationError`
  - **Status:** RED — `UpdateContactoRequestValidator` does not exist yet
  - **Verifies:** TC-E3-3-4-UNIT-4 (P2) — Validator rejects null Email

- **Test:** `Validate_WhenEmailIsInvalidFormat_ShouldHaveValidationError`
  - **Status:** RED — validator does not exist
  - **Verifies:** EmailAddress() rule for Email field

### Frontend Component Tests (13 tests — Vitest + RTL + MSW)

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoFormEdit.test.tsx`

- **Test:** `TC-E3-3-4-CMP-1: should pre-fill all four input fields with fixture values when opened in edit mode`
  - **Status:** RED — `ContactoForm` does not accept `contactoId` prop yet
  - **Verifies:** TC-E3-3-4-CMP-1 (P1) — All 4 inputs pre-filled from defaultValues, R-007 mitigation

- **Test:** `should render "Guardar cambios" as the submit button label in edit mode`
  - **Status:** RED — edit mode not implemented
  - **Verifies:** AC #1 — correct button label in edit mode

- **Test:** `TC-E3-3-4-CMP-2: should call onClose without making a PUT request when "Cancelar" is clicked`
  - **Status:** RED — ContactoForm edit mode not implemented
  - **Verifies:** TC-E3-3-4-CMP-2 (P1) — Cancel does not trigger PUT, onClose called, R-008 mitigation

- **Test:** `should NOT call onSuccess when "Cancelar" is clicked`
  - **Status:** RED — edit mode not implemented
  - **Verifies:** AC #4 — no save, no side effects on cancel

- **Test:** `TC-E3-3-4-CMP-3: should show inline error and NOT call PUT when Nombre is cleared and submitted`
  - **Status:** RED — ContactoForm edit mode not implemented
  - **Verifies:** TC-E3-3-4-CMP-3 (P1) — Zod client-side validation prevents PUT, FR16

- **Test:** `should show inline error on Email field when Email is cleared and submitted`
  - **Status:** RED — edit mode not implemented

- **Test:** `should disable submit button while PUT request is pending (isPending guard)`
  - **Status:** RED — edit mode not implemented
  - **Verifies:** AC #2 — submit disabled + "Guardando..." label while pending

- **Test:** `TC-E3-3-4-CMP-4: should show toast "Contacto actualizado correctamente" after successful PUT 200`
  - **Status:** RED — `useUpdateContacto` mutation not implemented
  - **Verifies:** TC-E3-3-4-CMP-4 (P2) — exact Spanish toast text, R-010 mitigation

- **Test:** `should call onClose after successful update`
  - **Status:** RED — edit mode not implemented

- **Test:** `should call onSuccess after successful update`
  - **Status:** RED — edit mode not implemented
  - **Verifies:** AC #2 — onSuccess callback triggers detail refetch (FR27)

- **Test:** `TC-E3-3-4-CMP-5: should display "El email ya está registrado" as inline error on Email when backend returns 409`
  - **Status:** RED — useUpdateContacto mutation + 409 handling not implemented
  - **Verifies:** TC-E3-3-4-CMP-5 (P2) — 409 → setError('email', ...) on Email field, NFR6

- **Test:** `should NOT expose technical details (stack traces, DbUpdateException) on 409 response (NFR6)`
  - **Status:** RED — edit mode not implemented

- **Test:** `should display generic error message for non-409 backend errors in edit mode (NFR6)`
  - **Status:** RED — edit mode not implemented

### E2E Tests (5 tests — Playwright)

**File:** `e2e/tests/contactos/contactos-edit.spec.ts`

- **Test:** `TC-E3-3-4-E2E-1: should show updated Nombre in list and detail view immediately after edit without page reload`
  - **Status:** RED — PUT endpoint + ContactoForm edit mode + useUpdateContacto not implemented
  - **Verifies:** TC-E3-3-4-E2E-1 (P1) — Full stack: form → PUT → invalidateQueries → list + detail refetch (FR27, R-002)

- **Test:** `should show "Editar" button only when contact detail is loaded (not during loading or no-selection state)`
  - **Status:** RED — btn-editar not added to ContactoDetailView yet

- **Test:** `should keep original contact data unchanged when "Cancelar" is clicked in edit form`
  - **Status:** RED — edit mode not implemented
  - **Verifies:** AC #4, R-008 — no PUT on cancel, original data preserved

- **Test:** `should show inline validation errors when a required field is cleared and submitted in edit mode`
  - **Status:** RED — edit mode not implemented
  - **Verifies:** AC #3 — Zod validation prevents PUT, inline error shown

- **Test:** `should show "El email ya está registrado" inline error when backend returns 409 on edit`
  - **Status:** RED — edit mode + 409 handling not implemented
  - **Verifies:** AC #2 edge case + NFR6 — 409 → inline email error, no tech details

---

## Data Factories

### Contacto Factory (existing — reused from Story 3.1)

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts`

**Exports:**
- `buildContacto(overrides?)` — Build single Contacto with optional field overrides
- `buildContactoList(count, overridesFn?)` — Build array of Contactos
- `resetContactoCounter()` — Reset counter for deterministic IDs

**E2E Factory:**

**File:** `e2e/helpers/data.helper.ts` (existing `buildContacto` export — reused)

---

## Fixtures Created

No new fixture files are created for this story. The tests use inline MSW handlers (component tests) and `ApiHelper` with `beforeEach`/`afterEach` cleanup (E2E tests). This follows the established pattern from Stories 3.1–3.3.

---

## Mock Requirements

### contactoApiRepository.update — PUT /api/v1/contactos/:id

**MSW Handler (component tests):**

```typescript
http.put(`${API_BASE}/api/v1/contactos/:id`, () =>
  HttpResponse.json(updatedContactoDto, { status: 200 })
)
```

**Success Response (200 OK):**

```json
{
  "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "nombre": "María López Editada",
  "cargo": "Directora Comercial",
  "telefono": "3009876543",
  "email": "maria.lopez@empresa.co",
  "clienteId": null,
  "createdAt": "2026-06-01T10:00:00Z",
  "updatedAt": "2026-06-28T14:30:00Z"
}
```

**409 Conflict Response:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Conflicto de datos",
  "status": 409,
  "detail": "El email ya está registrado"
}
```

**400 Validation Error Response:**

```json
{
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "Nombre": ["'Nombre' must not be empty."] }
}
```

**404 Not Found Response:**

```json
{
  "title": "Contacto no encontrado",
  "status": 404,
  "detail": "El contacto solicitado no fue encontrado."
}
```

---

## Required data-testid Attributes

### ContactoForm (edit mode — extends Story 3.3 create mode)

- `contacto-form` — `<form>` element (already required, verify preserved in edit mode)
- `input-nombre` — Nombre input field (already required, verify pre-filled in edit mode)
- `input-cargo` — Cargo input field (already required, verify pre-filled in edit mode)
- `input-telefono` — Teléfono input field (already required, verify pre-filled in edit mode)
- `input-email` — Email input field (already required, verify pre-filled in edit mode)
- `btn-submit` — Submit button (shows "Guardar cambios" in edit mode, "Guardando..." when pending)
- `btn-cancel` — Cancel button ("Cancelar")

### ContactoDetailView (new additions)

- `btn-editar` — "Editar" button (visible ONLY in data-loaded state, NOT during loading/error/not-found)
- `contacto-detail-view` — Root container (already exists from Story 3.2)

**Implementation Example:**

```tsx
// ContactoDetailView.tsx — data-loaded state only
<button
  onClick={() => setIsEditFormOpen(true)}
  data-testid="btn-editar"
>
  Editar
</button>

// ContactoForm.tsx — edit mode submit button
<button type="submit" disabled={isPending} data-testid="btn-submit">
  {isPending ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear contacto'}
</button>
```

---

## Implementation Checklist

### Test: TC-E3-3-4-API-1 — PUT valid payload → 200 + updated ContactoDto

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/UpdateContactoApiTests.cs`

**Tasks to make this test pass:**

- [ ] Create `UpdateContactoRequest` record in `backend/src/SiesaAgents.Application/Contactos/DTOs/UpdateContactoRequest.cs`
- [ ] Create `UpdateContactoRequestValidator` in `backend/src/SiesaAgents.Application/Contactos/Validators/UpdateContactoRequestValidator.cs`
- [ ] Create `UpdateContactoCommand` record in `backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommand.cs`
- [ ] Create `UpdateContactoCommandHandler` in `backend/src/SiesaAgents.Application/Contactos/Commands/UpdateContactoCommandHandler.cs`
- [ ] Add `Update(string nombre, string cargo, string telefono, string email)` method to `ContactoEntity` with `UpdatedAt = DateTimeOffset.UtcNow`
- [ ] Add `UpdateAsync(ContactoEntity entity, CancellationToken ct)` to `IContactoRepository`
- [ ] Implement `UpdateAsync` in `ContactoRepository`
- [ ] Add `MapPut("/{id:guid}", ...)` to `ContactoEndpoints.cs` returning `Results.Ok(dto)` on success
- [ ] Register handler and validator in `Program.cs` DI
- [ ] Run test: `dotnet test --filter "PutContacto_WithValidPayload_Returns200WithUpdatedContactoDto"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: TC-E3-3-4-API-2 — PUT Nombre=null → 400

**Tasks to make this test pass:**

- [ ] `UpdateContactoRequestValidator` rule: `RuleFor(x => x.Nombre).NotEmpty().MaximumLength(255)`
- [ ] Endpoint returns `Results.ValidationProblem(validation.ToDictionary())` on invalid
- [ ] Run test: `dotnet test --filter "PutContacto_WithNombreNull_Returns400WithProblemDetailsErrors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by API-1 tasks)

---

### Test: TC-E3-3-4-API-3 — PUT unknown UUID → 404

**Tasks to make this test pass:**

- [ ] `UpdateContactoCommandHandler` returns `null` when entity not found
- [ ] Endpoint maps null result to `Results.Problem(..., statusCode: 404, title: "Contacto no encontrado")`
- [ ] Run test: `dotnet test --filter "PutContacto_WithUnknownUuid_Returns404WithProblemDetails"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by API-1 tasks)

---

### Test: TC-E3-3-4-API-4 — PUT duplicate email → 409

**Tasks to make this test pass:**

- [ ] Endpoint catches `DbUpdateException` with PostgreSQL error code 23505 on `uk_contactos_email`
- [ ] Returns `Results.Problem(detail: "El email ya está registrado", statusCode: 409, title: "Conflicto de datos")`
- [ ] Run test: `dotnet test --filter "PutContacto_WithEmailAlreadyUsedByAnotherContacto_Returns409WithProblemDetails"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by API-1 tasks)

---

### Test: TC-E3-3-4-UNIT-1 through UNIT-4 — UpdateContactoRequestValidator rules

**Tasks to make these tests pass:**

- [ ] `UpdateContactoRequestValidator` rules for all 4 fields:
  - `Nombre`: `NotEmpty().MaximumLength(255)`
  - `Cargo`: `NotEmpty().MaximumLength(255)`
  - `Telefono`: `NotEmpty().MaximumLength(50)`
  - `Email`: `NotEmpty().MaximumLength(255).EmailAddress()`
- [ ] Run tests: `dotnet test --filter "UpdateContactoValidatorTests"`
- [ ] ✅ All 4 validator tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E3-3-4-CMP-1 — Edit form pre-fills all four fields

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoFormEdit.test.tsx`

**Tasks to make this test pass:**

- [ ] Add optional `contactoId?: string` prop to `ContactoForm` interface
- [ ] Add optional `defaultValues?: Partial<ContactoFormData>` prop (already reserved from Story 3.3, verify it works)
- [ ] When `contactoId` is provided: use `useForm({ defaultValues })` to pre-fill all four fields
- [ ] Add `data-testid` attributes: `input-nombre`, `input-cargo`, `input-telefono`, `input-email` (verify from Story 3.3)
- [ ] Run test: `pnpm --filter frontend test ContactoFormEdit`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E3-3-4-CMP-2 — Cancel without saving

**Tasks to make this test pass:**

- [ ] Cancel button calls `onClose()` without calling `updateMutation.mutate()`
- [ ] No TanStack Query cache mutation on cancel (R-008 mitigation)
- [ ] Run test: `pnpm --filter frontend test ContactoFormEdit`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by CMP-1 tasks)

---

### Test: TC-E3-3-4-CMP-3 — Clear required field + submit → inline error, no PUT

**Tasks to make this test pass:**

- [ ] In edit mode: `useForm({ resolver: zodResolver(contactoSchema), defaultValues })` — same schema as create
- [ ] `handleSubmit(onSubmit)` — Zod validation runs before `mutate()`, blocks submission if invalid
- [ ] Inline error rendered with `role="alert"` on each field's error span
- [ ] Run test: `pnpm --filter frontend test ContactoFormEdit`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by CMP-1 tasks)

---

### Test: TC-E3-3-4-CMP-4 — Valid edit submit → toast "Contacto actualizado correctamente"

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/application/useUpdateContacto.ts`
  - `mutationFn: ({ id, data }) => contactoApiRepository.update(id, data)`
  - `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contactos'] }); toast.success('Contacto actualizado correctamente'); }`
- [ ] Extend `IContactoRepository` with `update(id: string, data: ContactoFormData): Promise<Contacto>`
- [ ] Extend `contactoApiRepository` with `update(id, data)` using `apiClient.put`
- [ ] In `ContactoForm` edit mode: `updateMutation.mutate({ id: contactoId, data }, { onSuccess: () => { onSuccess?.(); onClose(); } })`
- [ ] Add `data-testid="btn-submit"` on submit button
- [ ] Run test: `pnpm --filter frontend test ContactoFormEdit`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E3-3-4-CMP-5 — 409 response → Email inline error

**Tasks to make this test pass:**

- [ ] In `onSubmit` or `mutate(data, { onError })`: check `axios.isAxiosError(error) && error.response?.status === 409`
- [ ] On 409: `setError('email', { message: 'El email ya está registrado' })`
- [ ] On non-409: `setError('root', { message: 'Error al actualizar el contacto. Intente nuevamente.' })`
- [ ] Run test: `pnpm --filter frontend test ContactoFormEdit`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by CMP-4 tasks)

---

### Test: TC-E3-3-4-E2E-1 — Full edit journey

**File:** `e2e/tests/contactos/contactos-edit.spec.ts`

**Tasks to make this test pass:**

- [ ] All backend tasks (API-1 through API-4) complete
- [ ] All frontend tasks (CMP-1 through CMP-5) complete
- [ ] Add `"Editar"` button with `data-testid="btn-editar"` to `ContactoDetailView` — only in data-loaded state
- [ ] Wire `isEditFormOpen` state in `ContactoDetailView` — `useState<boolean>(false)`
- [ ] Render `<ContactoForm contactoId={contacto.id} defaultValues={...} onClose={...} onSuccess={() => refetch()} />` conditionally when `isEditFormOpen === true` inside `role="dialog"` overlay
- [ ] Add `updateContacto` method to `ApiHelper` in `e2e/helpers/api.helper.ts`
- [ ] Run test: `pnpm exec playwright test contactos-edit`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (all building blocks from frontend + backend tasks)

---

## Running Tests

```bash
# Run all backend tests for Story 3.4 (API + Validator)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "Contactos.UpdateContacto"

# Run backend API integration tests only
dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateContactoApiTests"

# Run backend validator unit tests only
dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateContactoValidatorTests"

# Run all frontend component tests for Story 3.4
pnpm --filter frontend test src/modules/crm/contactos/__tests__/ContactoFormEdit

# Run frontend tests with verbose output
pnpm --filter frontend test --reporter=verbose src/modules/crm/contactos/__tests__/ContactoFormEdit

# Run E2E tests for Story 3.4
pnpm exec playwright test e2e/tests/contactos/contactos-edit.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/contactos/contactos-edit.spec.ts --headed

# Debug specific E2E test
pnpm exec playwright test e2e/tests/contactos/contactos-edit.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (30 tests across 4 files)
- ✅ Data factories reused from Story 3.1 (no new factory needed)
- ✅ Mock requirements documented (MSW PUT handlers)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- Tests fail because `UpdateContactoRequest`, `UpdateContactoRequestValidator`, `UpdateContactoCommandHandler`, `PUT /api/v1/contactos/:id` endpoint, `useUpdateContacto` hook, and `ContactoForm` edit mode do not exist yet
- Failure messages are clear and actionable (TypeScript compile errors / runtime "not found" errors)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with TC-E3-3-4-API-1)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: `UpdateContactoRequest` + `UpdateContactoRequestValidator` → passes UNIT tests
2. Backend: `UpdateContactoCommand` + `UpdateContactoCommandHandler` + `ContactoEntity.Update` → building blocks
3. Backend: `UpdateAsync` in repository → persistence layer
4. Backend: `MapPut` endpoint → passes API-1, API-2, API-3, API-4
5. Frontend: `useUpdateContacto` hook + `contactoApiRepository.update` → passes CMP-4
6. Frontend: `ContactoForm` edit mode (`contactoId` prop + `defaultValues`) → passes CMP-1, CMP-2, CMP-3, CMP-5
7. Frontend: `ContactoDetailView` "Editar" button → passes E2E-1

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 30 tests pass (green phase complete)
2. Review code for quality (readability, TypeScript strict mode, no `any` types)
3. Verify `contactoSchema.ts` reuse (NOT duplicated from Story 3.1)
4. Verify `ContactoForm` create mode (Story 3.3 path) still fully functional
5. Extract any duplications between create/edit mode code paths
6. Ensure `queryClient.invalidateQueries({ queryKey: ['contactos'] })` (NOT `['contacto']` singular)
7. Verify `DateTimeOffset` (NOT `DateTime`) in all backend DTO fields

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow
2. **Run failing tests** to confirm RED phase: `dotnet test --filter "UpdateContacto"` and `pnpm --filter frontend test ContactoFormEdit`
3. **Begin implementation** using implementation checklist as guide (start with backend API-1 tasks)
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor for quality
6. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **selector-resilience.md** — `data-testid` selectors for all form inputs, buttons, and containers
- **network-first.md** — MSW server setup + handlers registered before render; Playwright `page.route()` before `page.goto()`
- **test-quality.md** — Given-When-Then structure, one primary assertion per test, explicit waits (no `sleep`)
- **component-tdd.md** — Vitest + RTL + MSW composition, isolated QueryClient per test, `resetContactoCounter()` in `afterEach`
- **data-factories.md** — `buildContacto(overrides?)` factory reuse from Story 3.1; `buildContacto()` in `data.helper.ts` for E2E
- **test-levels-framework.md** — API tests for backend contract validation, Component tests for UI behavior isolation, E2E for full user journey

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected:** All tests fail because implementation does not exist yet.

**Backend:**
```
Failure: UpdateContactoApiTests.PutContacto_WithValidPayload_Returns200WithUpdatedContactoDto
  System.Net.Http.HttpRequestException: Response status code does not indicate success: 404 (Not Found).
  — PUT /api/v1/contactos/:id endpoint does not exist yet
```

**Frontend:**
```
FAIL frontend/src/modules/crm/contactos/__tests__/ContactoFormEdit.test.tsx
  ContactoForm edit mode — pre-filled form
    × TC-E3-3-4-CMP-1: should pre-fill all four input fields with fixture values
      Error: Unable to find an element by: [data-testid="input-nombre"] with value "María López"
      — ContactoForm does not accept contactoId prop in edit mode yet
```

**E2E:**
```
FAIL contactos-edit.spec.ts
  × TC-E3-3-4-E2E-1
    Error: locator.toBeVisible: Timeout 5000ms exceeded
    waiting for getByTestId('btn-editar')
    — btn-editar not added to ContactoDetailView yet
```

**Summary:**

- Total tests: 30
- Passing: 0 (expected)
- Failing: 30 (expected)
- Status: ✅ RED phase verified

---

## Notes

- `ContactoForm` edit mode MUST NOT break the create mode path (Story 3.3). Use conditional logic with `isEditMode = !!contactoId`.
- The `contactoSchema.ts` from Story 3.1 is reused for edit validation — do NOT create a new schema.
- `queryClient.invalidateQueries({ queryKey: ['contactos'] })` (without `exact: true`) invalidates both `['contactos']` (list) and `['contactos', id]` (single-contact) queries, ensuring both `ContactoListView` and `ContactoDetailView` update without page reload (FR27, R-002).
- 409 handling MUST be in `ContactoForm`'s `onError` callback (not in `useUpdateContacto`'s `onError`), following the same pattern as Story 3.3 create flow.
- `updatedAt` uses `DateTimeOffset.UtcNow` in `ContactoEntity.Update` — NEVER `DateTime` (architecture enforcement).
- "Editar" button is only rendered in the data-loaded state of `ContactoDetailView` — NOT during loading skeleton, error state, or not-found state.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `./bmm/docs/tea-README.md` for workflow documentation

---

**Generated by BMad TEA Agent** - 2026-06-28
