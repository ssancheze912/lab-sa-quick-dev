# ATDD Checklist - Epic 3, Story 3.5: Delete Contact

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Unit

---

## Story Summary

A commercial team member can delete a contact record from the contact detail view. Clicking "Eliminar" shows a confirmation dialog before executing the deletion. On confirmation, the contact is removed via `DELETE /api/v1/contactos/:id`, the list updates immediately without a page reload, and a toast confirms success. Cancelling closes the dialog without firing any DELETE request.

**As a** commercial team member
**I want** to delete a contact record
**So that** the contact list only contains relevant records

---

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears with the question "¿Eliminar este contacto?" and two buttons: "Confirmar" and "Cancelar" — no DELETE request is fired yet.

2. **Given** the user confirms the deletion, **When** the deletion is processed via `DELETE /api/v1/contactos/:id`, **Then** the contact is removed from the list immediately without a page reload (FR27), the view returns to `/contactos`, and a toast displays "Contacto eliminado correctamente".

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the contact record remains in the system unchanged and no DELETE request is fired.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/contactos/contactos-delete.spec.ts` (224 lines)

- **Test:** E2E-CT-23 — "Eliminar" abre el diálogo de confirmación con "Confirmar" y "Cancelar"; no se dispara DELETE
  - **Status:** RED — `data-testid="btn-eliminar"` does not exist; `DeleteContactoDialog` component not yet implemented
  - **Verifies:** AC1 — Clicking "Eliminar" on contact detail opens a confirmation dialog with both action buttons and no premature DELETE call

- **Test:** E2E-CT-24 — confirmar eliminación quita el contacto de la lista inmediatamente; URL cambia a /contactos
  - **Status:** RED — `btn-confirmar-eliminar` not found; `useDeleteContacto` hook and `DELETE /api/v1/contactos/:id` endpoint not implemented
  - **Verifies:** AC2 — Confirming deletion removes the contact from `contactoRows` without `page.reload()` and navigates URL to `/contactos`

- **Test:** E2E-CT-25 — toast "Contacto eliminado correctamente" aparece tras eliminación exitosa
  - **Status:** RED — `useDeleteContacto` `onSuccess` toast not implemented; backend endpoint missing
  - **Verifies:** AC2 — Success toast "Contacto eliminado correctamente" is visible after confirmed deletion

- **Test:** E2E-CT-26 — "Cancelar" cierra el diálogo sin hacer DELETE; el contacto permanece en la lista
  - **Status:** RED — `DeleteContactoDialog` and `btn-cancelar-eliminar` not implemented
  - **Verifies:** AC3 — Cancel closes dialog without calling DELETE; contact row remains visible in list

### API Tests (1 test)

**File:** `e2e/tests/contactos/contactos-api.spec.ts` (Story 3.5 describe block, lines 499–555)

- **Test:** API-CT-06 — DELETE /api/v1/contactos/:id devuelve 204; GET posterior devuelve 404 Problem Details sin stackTrace
  - **Status:** RED — `DELETE /{id:guid}` endpoint not registered in `ContactoEndpoints.cs`; `DeleteAsync` not in `IContactoRepository`; `DeleteContactoCommandHandler` not implemented
  - **Verifies:** AC2 — DELETE returns 204 No Content with empty body; subsequent GET for the same id returns 404 Problem Details without `stackTrace` key (NFR6)

### Backend Unit Tests (2 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs` (UNIT-B-CT-05 and UNIT-B-CT-10 added)

- **Test:** UNIT-B-CT-05 — `DeleteHandleAsync_ExistingContact_CompletesWithoutThrow`
  - **Status:** RED — `DeleteContactoCommandHandler` class does not exist; `DeleteAsync` not on `IContactoRepository` interface
  - **Verifies:** AC2 — Handler completes without exception for an existing contact; `DeleteAsync` is invoked exactly once on the repository

- **Test:** UNIT-B-CT-10 — `DeleteHandleAsync_NotExistingContact_ThrowsKeyNotFoundException`
  - **Status:** RED — `DeleteContactoCommandHandler` class does not exist
  - **Verifies:** AC2 — Handler throws `KeyNotFoundException` when the contact ID does not exist (→ 404 via `ExceptionHandlingMiddleware`)

---

## Data Factories

**File:** `e2e/helpers/data.helper.ts` (already exists)

**Export used:** `buildContacto(overrides?)` — generates a unique contact with nombre, email, cargo, telefono, and clienteId: null. Each E2E test passes a `nombre` override with a test-ID suffix to prevent collisions.

**Example Usage:**

```typescript
const contactoData = buildContacto({ nombre: 'Contacto Eliminar E2E-CT-23' });
const created = await apiHelper.createContacto(contactoData);
createdContactoIds.push(created.id); // tracked for afterEach cleanup
```

---

## Fixtures

No new fixture files are required. Tests use:

- **ApiHelper** (`e2e/helpers/api.helper.ts`) — `createContacto()` / `deleteContacto()` for setup and teardown.
- **ContactosPage** (`e2e/pages/contactos.page.ts`) — page object with `seleccionarContacto()`, `contactoRows`, `detailPanel` locators.
- **afterEach cleanup** — `createdContactoIds` array + `apiHelper.deleteContacto(id).catch(() => null)` ensures test data is removed even when the test itself deletes the contact.

---

## Mock Requirements

No external service mocks are needed. The tests use the real backend API (integration approach):

- E2E tests use `page.route('**/api/v1/contactos/**', ...)` only to **observe** DELETE calls (pass-through via `route.continue()`), not to mock them.
- The `DELETE /api/v1/contactos/:id` endpoint must be running on `http://localhost:5000` for API-CT-06.

---

## Required data-testid Attributes

### ContactoDetailPanel (`frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`)

- `btn-eliminar` — "Eliminar" button that opens the confirmation dialog

### DeleteContactoDialog (`frontend/src/modules/crm/contactos/presentation/DeleteContactoDialog.tsx`)

- `delete-contacto-dialog` — on `Dialog.Content` element (`role="alertdialog"`)
- `btn-confirmar-eliminar` — confirm/submit button (calls `useDeleteContacto` mutation)
- `btn-cancelar-eliminar` — cancel button (closes dialog without DELETE)

**Implementation Example:**

```tsx
// ContactoDetailPanel.tsx
<button data-testid="btn-eliminar" onClick={() => setDeleteDialogOpen(true)}>
  Eliminar
</button>

// DeleteContactoDialog.tsx (Dialog.Content)
<Dialog.Content
  role="alertdialog"
  aria-labelledby="delete-contacto-dialog-title"
  aria-describedby="delete-contacto-dialog-description"
  data-testid="delete-contacto-dialog"
>
  ...
  <button data-testid="btn-cancelar-eliminar" onClick={handleCancel}>Cancelar</button>
  <button data-testid="btn-confirmar-eliminar" onClick={handleConfirm}>
    {isPending ? 'Eliminando...' : 'Confirmar'}
  </button>
</Dialog.Content>
```

---

## Implementation Checklist

### Test: E2E-CT-23 — Confirmation dialog opens on "Eliminar" click (P0 · AC1)

**File:** `e2e/tests/contactos/contactos-delete.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/presentation/DeleteContactoDialog.tsx` with `data-testid="delete-contacto-dialog"`, `data-testid="btn-confirmar-eliminar"`, `data-testid="btn-cancelar-eliminar"`, and text "¿Eliminar este contacto?"
- [ ] Add `data-testid="btn-eliminar"` button to `ContactoDetailPanel.tsx` with `useState<boolean>` controlling `deleteDialogOpen`
- [ ] Render `<DeleteContactoDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} contactoId={contacto.id} />` from `ContactoDetailPanel`
- [ ] Cancel handler must NOT call `deleteMutation.mutate()` (R6: cancel must be mutation-free)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --grep "E2E-CT-23"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: E2E-CT-24 — Confirmed deletion removes contact from list; URL → /contactos (P0 · AC2)

**File:** `e2e/tests/contactos/contactos-delete.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/application/useDeleteContacto.ts` with `useMutation` calling `contactoApiRepository.delete(id)`
- [ ] `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['contactos'] })` + `toast.success('Contacto eliminado correctamente')`
- [ ] `onError`: `toast.error('No se pudo eliminar. Intenta de nuevo.')`
- [ ] Add `delete(id: string): Promise<void>` to `IContactoRepository` TypeScript interface
- [ ] Implement `delete()` in `contactoApiRepository.ts` — `DELETE /api/v1/contactos/${id}`, expects 204
- [ ] Wire `handleConfirm` in `DeleteContactoDialog` to call `deleteMutation.mutate(contactoId, { onSuccess: () => { onClose(); navigate({ to: '/contactos' }) } })`
- [ ] Guard `onOpenChange` against closing while `isPending` is true
- [ ] Add `Task DeleteAsync(ContactoEntity entity, CancellationToken ct)` to `IContactoRepository.cs` interface
- [ ] Implement `DeleteAsync` in `ContactoRepository.cs`: `_context.Contactos.Remove(entity); await _context.SaveChangesAsync(ct);`
- [ ] Create `DeleteContactoCommand.cs` record: `public record DeleteContactoCommand(Guid Id);`
- [ ] Create `DeleteContactoCommandHandler.cs`: fetch entity → throw `KeyNotFoundException` if null → call `repository.DeleteAsync`
- [ ] Register `DeleteContactoCommandHandler` in `Program.cs` DI
- [ ] Add `DELETE /{id:guid}` endpoint to `ContactoEndpoints.cs` returning `204 No Content`
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --grep "E2E-CT-24"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: E2E-CT-25 — Toast "Contacto eliminado correctamente" after deletion (P1 · AC2)

**File:** `e2e/tests/contactos/contactos-delete.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `useDeleteContacto` `onSuccess` calls `toast.success('Contacto eliminado correctamente')` using existing `toastStore.ts` (do NOT add a new toast library)
- [ ] Ensure `ToastContainer` renders toasts with `role="status"` or visible text in the DOM
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --grep "E2E-CT-25"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: E2E-CT-26 — Cancel closes dialog without DELETE; contact remains (P1 · AC3)

**File:** `e2e/tests/contactos/contactos-delete.spec.ts`

**Tasks to make this test pass:**

- [ ] `btn-cancelar-eliminar` click handler must call only `onClose()` — no mutation invocation
- [ ] Dialog must close (`delete-contacto-dialog` hidden) after cancel
- [ ] Contact row must remain visible in `contacto-row` list after cancel
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --grep "E2E-CT-26"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: API-CT-06 — DELETE returns 204; subsequent GET returns 404 Problem Details (P0 · AC2)

**File:** `e2e/tests/contactos/contactos-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `DELETE /{id:guid}` endpoint to `ContactoEndpoints.cs` (see Dev Notes for pattern)
- [ ] Endpoint calls `DeleteContactoCommandHandler.HandleAsync(new DeleteContactoCommand(id), ct)`
- [ ] Returns `Results.NoContent()` on success (204 No Content, empty body)
- [ ] `ExceptionHandlingMiddleware` converts `KeyNotFoundException` → 404 Problem Details without `stackTrace` (already implemented from Stories 2.4 and 3.4)
- [ ] Annotate with `.Produces(StatusCodes.Status204NoContent)` and `.Produces(StatusCodes.Status404NotFound)`
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "API-CT-06"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: UNIT-B-CT-05 — DeleteHandler completes without throw for existing contact (P1 · AC2)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`

**Tasks to make this test pass:**

- [ ] Add `Task DeleteAsync(ContactoEntity entity, CancellationToken ct)` to `IContactoRepository.cs` interface
- [ ] Create `DeleteContactoCommand.cs` record: `public record DeleteContactoCommand(Guid Id);`
- [ ] Create `DeleteContactoCommandHandler.cs` with `HandleAsync(DeleteContactoCommand command, CancellationToken ct)` — fetch by ID → delete → complete
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "DeleteHandleAsync_ExistingContact_CompletesWithoutThrow"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: UNIT-B-CT-10 — DeleteHandler throws KeyNotFoundException for non-existent ID (P1 · AC2)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`

**Tasks to make this test pass:**

- [ ] `DeleteContactoCommandHandler.HandleAsync` must throw `KeyNotFoundException` when `repository.GetByIdAsync` returns null
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "DeleteHandleAsync_NotExistingContact_ThrowsKeyNotFoundException"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by handler implementation above)

---

## Running Tests

```bash
# Run all E2E failing tests for Story 3.5
npx playwright test e2e/tests/contactos/contactos-delete.spec.ts

# Run API tests for Story 3.5 only
npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "Story 3.5"

# Run backend unit tests for Story 3.5
dotnet test backend/tests/SiesaAgents.UnitTests --filter "DeleteHandleAsync"

# Run all contactos tests (E2E + API)
npx playwright test e2e/tests/contactos/

# Run Story 3.5 E2E tests in headed mode (see browser)
npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --headed

# Debug a specific E2E test
npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --grep "E2E-CT-23" --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ E2E tests written and failing (E2E-CT-23, E2E-CT-24, E2E-CT-25, E2E-CT-26)
- ✅ API test written and failing (API-CT-06)
- ✅ Backend unit tests written and failing (UNIT-B-CT-05, UNIT-B-CT-10)
- ✅ Data factory (`buildContacto`) and API helper (`apiHelper.createContacto/deleteContacto`) already in place
- ✅ Mock requirements documented (none required — real API integration)
- ✅ Required `data-testid` attributes listed
- ✅ Implementation checklist created with priority ordering (P0 first)

**Verification:**

- All tests run and fail as expected
- E2E failures: element not found (`btn-eliminar`, `delete-contacto-dialog`)
- API failure: 404 from non-existent DELETE route
- Unit test failures: `DeleteContactoCommandHandler` type does not exist (compile error)
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with P0 backend tests** (UNIT-B-CT-05, UNIT-B-CT-10): implement `DeleteContactoCommand`, `DeleteContactoCommandHandler`, add `DeleteAsync` to `IContactoRepository` and `ContactoRepository`
2. **Then P0 API test** (API-CT-06): register `DELETE /{id:guid}` endpoint in `ContactoEndpoints.cs`
3. **Then P0 E2E tests**: implement `DeleteContactoDialog`, `useDeleteContacto`, and update `ContactoDetailPanel`
4. **Run each test after its implementation tasks** to verify green
5. **P1 tests** should turn green automatically from the same implementation

**Key Principles:**

- One test at a time (P0 before P1)
- Mirror the exact pattern from Story 2.5 (Delete Client)
- Do NOT call `deleteMutation.mutate()` in the cancel handler (R6)
- Do NOT navigate inside the hook — navigate in `DeleteContactoDialog.onSuccess` callback
- Do NOT use `page.reload()` — use `queryClient.invalidateQueries` (FR27, R2)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 7 tests pass (4 E2E + 1 API + 2 unit)
2. Confirm `DeleteContactoDialog` properly mirrors `DeleteClienteDialog` structure
3. Ensure `useDeleteContacto` follows same pattern as `useDeleteCliente`
4. Run full test suite: `npx playwright test && dotnet test backend/tests/`
5. Mark story status to `done` in sprint-status.yaml

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/contactos/contactos-delete.spec.ts`
3. Begin implementation using implementation checklist — start with backend (UNIT-B-CT-05 / UNIT-B-CT-10)
4. Work one test at a time (RED → GREEN for each)
5. Reference Story 2.5 (`_bmad-output/implementation-artifacts/stories/2-5-delete-client.md`) as implementation mirror

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests intercept `page.route('**/api/v1/contactos/**', ...)` BEFORE `page.goto()` / navigation to prevent race conditions
- **data-factories.md** — `buildContacto(overrides)` factory with unique ID suffix prevents test data collisions
- **fixture-architecture.md** — `afterEach` cleanup pattern with `createdContactoIds` array and `.catch(() => null)` for safe teardown
- **test-quality.md** — One assertion per test; Given-When-Then structure; explicit waits (no `page.waitForTimeout`)
- **selector-resilience.md** — `data-testid` selectors used exclusively (`btn-eliminar`, `delete-contacto-dialog`, `btn-confirmar-eliminar`, `btn-cancelar-eliminar`, `contacto-row`)
- **test-levels-framework.md** — Critical user journey (delete with confirmation) → E2E; API contract (204 + 404) → API test; Pure handler logic → unit test

---

## Notes

- Story 3.5 is the direct analog of Story 2.5 (Delete Client). All implementation patterns are mirrors of the clientes domain.
- The `IContactoRepository` interface currently has `GetAllAsync`, `GetByIdAsync`, and `CreateAsync`. Both `UpdateAsync` (Story 3.4) and `DeleteAsync` (Story 3.5) must be added; the unit tests for both stories contribute to `IContactoRepository` evolution. The fake repositories in `ContactoHandlerTests.cs` have been updated to implement `DeleteAsync` on all fakes.
- `ExceptionHandlingMiddleware` already handles `KeyNotFoundException` → 404 Problem Details (verified Stories 2.4, 3.4). No middleware changes needed.
- The `toastStore.ts` Zustand store is the only toast mechanism. Do NOT install sonner, react-toastify, or similar.
- Test IDs E2E-CT-23 to E2E-CT-26 and API-CT-06 correspond to entries in `_bmad-output/implementation-artifacts/test-design-epic-3.md`.

---

**Generated by BMad TEA Agent** — 2026-05-21
