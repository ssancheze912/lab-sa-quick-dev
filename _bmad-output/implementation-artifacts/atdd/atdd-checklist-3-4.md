# ATDD Checklist — Epic 3, Story 3.4: Edit Contact

**Date:** 2026-05-21
**Story:** 3.4 — Edit Contact
**Epic:** 3 — Contact Management
**Phase:** RED (failing tests written; implementation not yet started)

---

## Story Summary

**As a** commercial team member,
**I want** to edit any field of an existing contact,
**So that** the contact information stays current.

---

## Acceptance Criteria

1. **AC1** — Given the user is viewing a contact's detail, When the user clicks "Editar", Then the contact form dialog opens pre-filled with the current values of all four fields: Nombre, Cargo, Teléfono, Email (FR14).

2. **AC2** — Given the user modifies one or more fields and clicks "Guardar", When the form is submitted, Then the changes are persisted via `PUT /api/v1/contactos/:id`, the dialog closes, the updated values are reflected in the contact detail panel and list immediately without a page reload (FR27), and a toast displays "Contacto actualizado correctamente".

3. **AC3** — Given the user clears a required field and clicks "Guardar", When the Zod schema validation runs on submit, Then an inline error message appears under the empty field (FR16), the form does NOT send any request to the backend, and the dialog remains open.

4. **AC4** — Given the user clicks "Cancelar" without saving, When the dialog closes, Then the original contact data remains unchanged and no PUT request is fired.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (5 tests)

**File:** `e2e/tests/contactos/contactos-edit.spec.ts`

- **Test: E2E-CT-18** — "Editar" abre el formulario con los 4 campos pre-llenados con los valores actuales
  - **Priority:** P0
  - **AC:** AC1
  - **Status:** RED — `ContactoDetailView` does not yet expose a `data-testid="btn-editar"` button; `ContactoFormDialog` does not accept a `contacto` prop; dialog title does not change to "Editar contacto"; pre-fill via `reset(contacto)` `useEffect` not implemented.
  - **Verifies:** `btn-editar` is visible in the detail panel; clicking it opens `contacto-form-dialog`; dialog title contains "editar contacto"; all 4 inputs (`input-nombre`, `input-cargo`, `input-telefono`, `input-email`) are pre-filled with the contact's current values.

- **Test: E2E-CT-19** — guardar cambios actualiza el panel de detalle y la fila de lista inmediatamente sin recargar
  - **Priority:** P0
  - **AC:** AC2
  - **Status:** RED — `useUpdateContacto` mutation hook not implemented; `contactoApiRepository.update()` method missing; `queryClient.invalidateQueries({ queryKey: ['contactos'] })` not called on success; detail panel and list are not refreshed reactively.
  - **Verifies:** Exactly one PUT request to `/api/v1/contactos/**`; dialog closes automatically after save; updated `nombre` is visible in both `contacto-detail-panel` and `contacto-row` without `page.reload()`.

- **Test: E2E-CT-20** — limpiar un campo requerido y guardar muestra error inline; no se envía petición PUT
  - **Priority:** P0
  - **AC:** AC3
  - **Status:** RED — Zod validation on submit is not wired in edit mode; inline error message does not appear under the empty field; `btn-guardar` does not block submission when `nombre` is empty.
  - **Verifies:** Dialog remains open after clicking "Guardar" with empty `input-nombre`; inline validation error text is visible under the field; no PUT request is fired to `/api/v1/contactos/**`.

- **Test: E2E-CT-21** — toast "Contacto actualizado correctamente" aparece tras edición exitosa
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `useUpdateContacto.onSuccess` not implemented; `toast.success('Contacto actualizado correctamente')` call missing.
  - **Verifies:** After a successful PUT, toast notification with text "Contacto actualizado correctamente" is visible on screen.

- **Test: E2E-CT-22** — "Cancelar" cierra el formulario sin hacer PUT; los datos originales se conservan
  - **Priority:** P1
  - **AC:** AC4
  - **Status:** RED — `btn-cancelar` in edit mode currently does not exist (dialog not in edit mode yet); no `onClose()` wiring for cancel button in edit mode that blocks PUT.
  - **Verifies:** Clicking `btn-cancelar` closes the dialog; no PUT request is fired; original contact `nombre` remains in both `contacto-detail-panel` and `contacto-row`.

---

### API Integration Tests — Playwright (3 tests)

**File:** `e2e/tests/contactos/contactos-api.spec.ts` (Story 3.4 describe block)

- **Test: API-CT-05** — PUT payload válido → 200 + cuerpo actualizado con todos los campos y updatedAt
  - **Priority:** P0
  - **AC:** AC2
  - **Status:** RED — `PUT /{id:guid}` endpoint not yet registered in `ContactoEndpoints.cs`; `UpdateContactoCommandHandler` DI registration missing from `Program.cs`.
  - **Verifies:** Response status is 200; body contains `id`, `nombre`, `cargo`, `telefono`, `email`, `clienteId` (null), `createdAt`, `updatedAt` (all DateTimeOffset fields are ISO 8601 with timezone); no wrapper object; no stackTrace key.

- **Test: API-CT-10** — PUT con campo requerido vacío → 400 Problem Details sin stackTrace
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — `UpdateContactoCommandValidator` (FluentValidation) not implemented; `ExceptionHandlingMiddleware` mapping of `ValidationException` → 400 not verified for contactos.
  - **Verifies:** Response status is 400; body is RFC 7807 Problem Details with `status=400` and non-empty `title`; no stack trace exposed (NFR6 compliance).

- **Test: API-CT-11** — PUT con ID inexistente → 404 Problem Details sin stackTrace
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet verified to handle `KeyNotFoundException` → 404 for contactos domain (analogous to Story 2.4 pattern).
  - **Verifies:** Response status is 404; body is RFC 7807 Problem Details with `status=404` and non-empty `title`; no stack trace exposed (NFR6 compliance).

---

### Backend Unit Tests — xUnit (4 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`

- **Test: UNIT-B-CT-06** — UpdateHandleAsync_ExistingContact_ReturnsUpdatedDto
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `UpdateContactoCommandHandler` class does not exist; `UpdateContactoCommand` record does not exist; `IContactoRepository.UpdateAsync()` method not defined.
  - **Verifies:** Handler returns a `ContactoDto` with updated fields (nombre, cargo, telefono, email) matching the command; dto.Id matches the original contact Id.

- **Test: UNIT-B-CT-07** — UpdateHandleAsync_NotExistingContact_ThrowsKeyNotFoundException
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `UpdateContactoCommandHandler` does not exist yet.
  - **Verifies:** Handler throws `KeyNotFoundException` when repository `GetByIdAsync` returns null for the given contact id.

**File:** `backend/tests/SiesaAgents.UnitTests/Validators/ContactoValidatorTests.cs`

- **Test: UNIT-B-CT-08** — UpdateValidator_EmptyNombre_ReturnsInvalidResultWithLocalizedMessage
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — `UpdateContactoCommandValidator` class does not exist; `UpdateContactoCommand` record does not exist.
  - **Verifies:** Validator marks empty Nombre as invalid; error is on the `Nombre` property; error message is non-empty Spanish string (e.g., "El nombre es requerido").

- **Test: UNIT-B-CT-09** — UpdateValidator_ValidPayload_ReturnsValidResult
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `UpdateContactoCommandValidator` class does not exist.
  - **Verifies:** Validator passes (IsValid = true, no errors) for a command with all four required fields populated with valid values.

---

## Data Infrastructure

### Data Factories (Existing — Reused)

**File:** `e2e/helpers/data.helper.ts`

The `buildContacto()` factory already exists from Story 3.3 and is reused without modification.

**Exports:**
- `buildContacto(overrides?)` — Creates a unique contact payload with `nombre`, `email`, `cargo`, `telefono`, `clienteId: null` using a counter-based unique ID.

**Usage in tests:**
```typescript
const contactoData = buildContacto({ nombre: 'Contacto Pre-filled E2E-CT-18' });
const created = await apiHelper.createContacto(contactoData);
createdIds.push(created.id);
```

### API Helper (Existing — Reused)

**File:** `e2e/helpers/api.helper.ts`

The `ApiHelper` class already has `createContacto()` and `deleteContacto()` methods. No new methods are needed for this story.

### Fixtures (Existing — Reused)

**File:** `e2e/fixtures/base.fixture.ts`

The base fixture with `contactosPage` navigation fixture is reused. All E2E tests use `test.afterEach` with `createdIds` array for cleanup, following the auto-cleanup pattern.

---

## Mock Requirements

### PUT /api/v1/contactos/:id — Network-First Interception

The E2E tests use Playwright's `page.route()` to intercept and monitor PUT calls BEFORE navigation. No external service mocking is needed — the tests hit the real backend API.

**Pattern used in tests (network-first):**
```typescript
// CRITICAL: Intercept BEFORE navigation
let putCallCount = 0;
await page.route('**/api/v1/contactos/**', (route) => {
  if (route.request().method() === 'PUT') {
    putCallCount++;
  }
  route.continue();
});
await contactosPage.goto();
```

**For E2E-CT-20 (validation test) — abort on PUT:**
```typescript
await page.route('**/api/v1/contactos/**', (route) => {
  if (route.request().method() === 'PUT') {
    putFired = true;
    route.abort(); // Prevents any accidental PUT from side-effecting backend
  } else {
    route.continue();
  }
});
```

---

## Required data-testid Attributes

### ContactoDetailView (`frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`)

| Attribute | Element | Notes |
|---|---|---|
| `btn-editar` | Button — opens edit dialog | NEW — must be added |

**Implementation example:**
```tsx
<button
  data-testid="btn-editar"
  onClick={() => setEditOpen(true)}
  className="bg-[#0e79fd] text-white hover:bg-[#154ca9]"
>
  Editar
</button>
```

### ContactoFormDialog (`frontend/src/modules/crm/contactos/presentation/ContactoFormDialog.tsx`)

All attributes below already exist from Story 3.3. No new `data-testid` attributes are needed.

| Attribute | Element | Notes |
|---|---|---|
| `contacto-form-dialog` | `DialogContent` | Already exists (Story 3.3) |
| `input-nombre` | Nombre text input | Already exists (Story 3.3) |
| `input-cargo` | Cargo text input | Already exists (Story 3.3) |
| `input-telefono` | Teléfono text input | Already exists (Story 3.3) |
| `input-email` | Email text input | Already exists (Story 3.3) |
| `btn-guardar` | Submit / save button | Already exists (Story 3.3) |
| `btn-cancelar` | Cancel / close button | Already exists (Story 3.3) |

---

## Implementation Checklist

### Test: E2E-CT-18 — Pre-filled form on "Editar" click (P0)

**File:** `e2e/tests/contactos/contactos-edit.spec.ts`

- [ ] Add `btn-editar` button to `ContactoDetailView.tsx` with `data-testid="btn-editar"`
- [ ] Manage dialog open state in `ContactoDetailView` via `useState<boolean>`
- [ ] Pass current `contacto` prop to `ContactoFormDialog` when edit dialog is open
- [ ] In `ContactoFormDialog`, accept optional `contacto?: Contacto` prop
- [ ] Add `useEffect` to call `reset({ nombre: contacto.nombre, cargo: contacto.cargo, telefono: contacto.telefono, email: contacto.email })` when `contacto` is defined
- [ ] Change dialog title to "Editar contacto" when `contacto` prop is provided (vs "Nuevo contacto" in create mode)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-edit.spec.ts --grep "E2E-CT-18"`
- [ ] Test passes (green phase)

---

### Test: E2E-CT-19 — Save changes updates list immediately without reload (P0)

**File:** `e2e/tests/contactos/contactos-edit.spec.ts`

- [ ] Create `frontend/src/modules/crm/contactos/application/useUpdateContacto.ts` with `useMutation`
- [ ] Add `update(id: string, data: UpdateContactoPayload): Promise<Contacto>` to `IContactoRepository` interface
- [ ] Implement `update()` in `contactoApiRepository.ts` — calls `PUT /api/v1/contactos/:id`, returns typed `Contacto`
- [ ] In `useUpdateContacto.onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['contactos'] })`, then `toast.success('Contacto actualizado correctamente')`
- [ ] In `ContactoFormDialog`, select `useUpdateContacto` when in edit mode, `useCreateContacto` when in create mode
- [ ] After successful mutation, close dialog via `onOpenChange(false)` and call `reset()`
- [ ] Verify backend `PUT /{id:guid}` route is registered in `ContactoEndpoints.cs`
- [ ] Verify `UpdateContactoCommandHandler` is registered in DI (`Program.cs`)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-edit.spec.ts --grep "E2E-CT-19"`
- [ ] Test passes (green phase)

---

### Test: E2E-CT-20 — Clear required field shows inline error, no PUT fired (P0)

**File:** `e2e/tests/contactos/contactos-edit.spec.ts`

- [ ] Reuse existing `contactoSchema.ts` Zod schema (same 4 required fields) — no changes needed
- [ ] Ensure `ContactoFormDialog` uses `zodResolver(contactoSchema)` in `useForm` (already done in create mode; verify it applies in edit mode too)
- [ ] Ensure inline error messages from Zod are rendered under each field via `formState.errors`
- [ ] Verify `onSubmit` is only called when form is valid (Zod blocks submission on validation error)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-edit.spec.ts --grep "E2E-CT-20"`
- [ ] Test passes (green phase)

---

### Test: E2E-CT-21 — Success toast after edit (P1)

**File:** `e2e/tests/contactos/contactos-edit.spec.ts`

- [ ] Implement `toast.success('Contacto actualizado correctamente')` call in `useUpdateContacto.onSuccess`
- [ ] Verify `ToastContainer` renders toasts from `toastStore` (already implemented in Story 2.3 — reuse without reinstalling)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-edit.spec.ts --grep "E2E-CT-21"`
- [ ] Test passes (green phase)

---

### Test: E2E-CT-22 — Cancel closes form without PUT (P1)

**File:** `e2e/tests/contactos/contactos-edit.spec.ts`

- [ ] Verify `btn-cancelar` click calls `onOpenChange(false)` and `reset()` WITHOUT triggering mutation
- [ ] Ensure no `mutation.mutate()` is called on cancel — only `onOpenChange(false)` fires (risk R6 mitigation)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-edit.spec.ts --grep "E2E-CT-22"`
- [ ] Test passes (green phase)

---

### Test: API-CT-05 — PUT returns 200 + updated body (P0)

**File:** `e2e/tests/contactos/contactos-api.spec.ts`

- [ ] Register `PUT /api/v1/contactos/{id:guid}` in `ContactoEndpoints.cs` — return 200 + `ContactoDto` or 404 Problem Details
- [ ] Create `UpdateContactoCommand` record: `Guid Id`, `string Nombre`, `string Cargo`, `string Telefono`, `string Email`
- [ ] Create `UpdateContactoCommandHandler` — validate, load by id, call entity `Update()`, persist via `UpdateAsync`, return `ContactoDto`
- [ ] Add `UpdateAsync(ContactoEntity entity, CancellationToken ct): Task<ContactoEntity>` to `IContactoRepository`
- [ ] Implement `UpdateAsync` in `ContactoRepository.cs`
- [ ] Verify response body includes: `id`, `nombre`, `cargo`, `telefono`, `email`, `clienteId` (null), `createdAt`, `updatedAt` (DateTimeOffset — ISO 8601 with timezone)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "API-CT-05"`
- [ ] Test passes (green phase)

---

### Test: API-CT-10 — PUT missing field returns 400 Problem Details (P1)

**File:** `e2e/tests/contactos/contactos-api.spec.ts`

- [ ] Create `UpdateContactoCommandValidator` with FluentValidation — all 4 fields required (max 200/100/50/200 chars)
- [ ] Spanish error messages (e.g., `WithMessage("El nombre es requerido")`)
- [ ] Register validator in DI (`Program.cs`)
- [ ] Verify `ExceptionHandlingMiddleware` maps `ValidationException` → 400 Problem Details RFC 7807
- [ ] Verify no stack trace is exposed in the response body (NFR6)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "API-CT-10"`
- [ ] Test passes (green phase)

---

### Test: API-CT-11 — PUT non-existent ID returns 404 Problem Details (P1)

**File:** `e2e/tests/contactos/contactos-api.spec.ts`

- [ ] Verify `ExceptionHandlingMiddleware` handles `KeyNotFoundException` → 404 Problem Details (analogous to Story 2.4)
- [ ] Ensure handler throws `KeyNotFoundException` when contact id does not exist
- [ ] Verify no stack trace is exposed in the response body (NFR6)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "API-CT-11"`
- [ ] Test passes (green phase)

---

### Test: UNIT-B-CT-06 — UpdateHandler returns updated ContactoDto (P1)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`

- [ ] Implement `UpdateContactoCommand` record
- [ ] Implement `UpdateContactoCommandHandler` with validator injection and `IContactoRepository.UpdateAsync`
- [ ] Add `UpdateAsync()` method to `IContactoRepository` interface
- [ ] Ensure `ContactoEntity.Update()` method exists (already present in `ContactoEntity.cs`)
- [ ] Run test: `dotnet test --filter "UpdateHandleAsync_ExistingContact_ReturnsUpdatedDto"`
- [ ] Test passes (green phase)

---

### Test: UNIT-B-CT-07 — UpdateHandler throws KeyNotFoundException when not found (P1)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`

- [ ] Ensure `UpdateContactoCommandHandler` calls `GetByIdAsync` first and throws `KeyNotFoundException` when result is null
- [ ] Run test: `dotnet test --filter "UpdateHandleAsync_NotExistingContact_ThrowsKeyNotFoundException"`
- [ ] Test passes (green phase)

---

### Test: UNIT-B-CT-08 — UpdateValidator empty Nombre fails with localized message (P1)

**File:** `backend/tests/SiesaAgents.UnitTests/Validators/ContactoValidatorTests.cs`

- [ ] Implement `UpdateContactoCommandValidator` with all 4 required fields and Spanish error messages
- [ ] Register validator in DI
- [ ] Run test: `dotnet test --filter "UpdateValidator_EmptyNombre_ReturnsInvalidResultWithLocalizedMessage"`
- [ ] Test passes (green phase)

---

### Test: UNIT-B-CT-09 — UpdateValidator valid payload passes (P1)

**File:** `backend/tests/SiesaAgents.UnitTests/Validators/ContactoValidatorTests.cs`

- [ ] Verify `UpdateContactoCommandValidator` accepts all valid field combinations
- [ ] Run test: `dotnet test --filter "UpdateValidator_ValidPayload_ReturnsValidResult"`
- [ ] Test passes (green phase)

---

## Running Tests

```bash
# Run all failing E2E tests for Story 3.4
npx playwright test e2e/tests/contactos/contactos-edit.spec.ts

# Run Story 3.4 API tests only
npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "Story 3.4"

# Run all Story 3.4 tests (E2E + API)
npx playwright test e2e/tests/contactos/contactos-edit.spec.ts e2e/tests/contactos/contactos-api.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/contactos/contactos-edit.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/contactos/contactos-edit.spec.ts --grep "E2E-CT-18" --debug

# Run backend unit tests (xUnit)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "Category=Story3_4"
dotnet test backend/tests/SiesaAgents.UnitTests --filter "UpdateHandleAsync|UpdateValidator"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- E2E tests written in `e2e/tests/contactos/contactos-edit.spec.ts` (5 tests — already existed and confirmed complete)
- API integration tests added to `e2e/tests/contactos/contactos-api.spec.ts` — Story 3.4 describe block (3 tests — NEW)
- Backend unit tests added to `ContactoHandlerTests.cs` (UNIT-B-CT-06, UNIT-B-CT-07 — NEW)
- Backend unit tests added to `ContactoValidatorTests.cs` (UNIT-B-CT-08, UNIT-B-CT-09 — NEW)
- Network-first intercept pattern applied in all E2E tests
- `buildContacto()` factory reused with auto-cleanup via `createdIds` + `test.afterEach`
- `data-testid` requirements documented
- Implementation checklist created per test
- Mock requirements documented (network interception, not external service mocks)

**Expected RED-phase failure messages:**

- `E2E-CT-18`: `Error: locator.click: Element not found [data-testid="btn-editar"]` — button does not exist yet
- `E2E-CT-19`: `Error: locator.click: Element not found [data-testid="btn-editar"]` — same root cause
- `E2E-CT-20`: `Error: locator.click: Element not found [data-testid="btn-editar"]` — same root cause
- `E2E-CT-21`: `Error: locator.click: Element not found [data-testid="btn-editar"]` — same root cause
- `E2E-CT-22`: `Error: locator.click: Element not found [data-testid="btn-editar"]` — same root cause
- `API-CT-05`: `Error: expect(received).toBe(200) — received 404` or `405` — PUT route not registered
- `API-CT-10`: `Error: expect(received).toBe(400) — received 404` or `405` — PUT route not registered
- `API-CT-11`: `Error: expect(received).toBe(404) — received 404` (passes) or `405` — PUT route not registered
- `UNIT-B-CT-06`: `CS0246: The type or namespace name 'UpdateContactoCommandHandler' could not be found`
- `UNIT-B-CT-07`: `CS0246: The type or namespace name 'UpdateContactoCommandHandler' could not be found`
- `UNIT-B-CT-08`: `CS0246: The type or namespace name 'UpdateContactoCommandValidator' could not be found`
- `UNIT-B-CT-09`: `CS0246: The type or namespace name 'UpdateContactoCommandValidator' could not be found`

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with P0 backend test (API-CT-05)** — Register the PUT endpoint first; all E2E tests depend on this
2. **Add `btn-editar` to `ContactoDetailView`** — Unblocks all E2E tests (E2E-CT-18 through E2E-CT-22)
3. **Add `contacto` prop and pre-fill to `ContactoFormDialog`** — Makes E2E-CT-18 pass
4. **Create `useUpdateContacto` hook** — Makes E2E-CT-19 and E2E-CT-21 pass
5. **Verify Zod validation in edit mode** — Makes E2E-CT-20 pass
6. **Verify cancel behavior** — Makes E2E-CT-22 pass
7. **Verify backend validation** — Makes API-CT-10 and API-CT-11 pass
8. **Implement UpdateContactoCommandValidator** — Makes UNIT-B-CT-08 and UNIT-B-CT-09 pass

**Key Principles:**
- One test at a time (start with P0, then P1)
- Run `npx playwright test` after each implementation step
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Extract edit mode detection from `ContactoFormDialog` into a clear conditional hook selection pattern
2. Ensure no duplicated form state logic between create and edit modes
3. Verify test isolation — each test gets fresh data from `buildContacto()` factory
4. Run full test suite to confirm no regressions in Stories 3.1, 3.2, 3.3

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Start with backend** — register PUT endpoint (API-CT-05, API-CT-10, API-CT-11 unblocked)
3. **Then frontend** — add `btn-editar`, extend `ContactoFormDialog` for edit mode
4. **Implement backend unit classes** — `UpdateContactoCommand`, `UpdateContactoCommandHandler`, `UpdateContactoCommandValidator`
5. **Work one test at a time** (red → green for each per priority P0 → P1)
6. **When all tests pass**, refactor and update story status to 'done'

---

## Knowledge Base References Applied

- **network-first** — Route interception BEFORE navigation in all E2E tests to prevent race conditions
- **data-factories** — `buildContacto()` factory with counter-based unique IDs and override support
- **fixture-architecture** — `createdIds` array + `test.afterEach` for auto-cleanup without external fixture files
- **test-quality** — Given-When-Then structure; one assertion per test; explicit waits; no `page.reload()`
- **selector-resilience** — All selectors use `data-testid` (highest stability tier); no CSS class selectors
- **test-levels-framework** — E2E for user journey acceptance criteria (AC1–AC4); API for contract validation (AC2–AC3 backend); Unit for handler and validator isolation

---

**Generated by BMad TEA Agent** — 2026-05-21
