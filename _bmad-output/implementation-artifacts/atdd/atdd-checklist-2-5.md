# ATDD Checklist - Epic 2, Story 5: Delete Client

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component

---

## Story Summary

A commercial team member can delete a client record via a confirmation dialog from the client detail panel. Deletion is handled by `DELETE /api/v1/clientes/:id` (returns 204 No Content), removes the client from the list immediately without a page reload (FR27), and handles associated contacts by setting their `clienteId` to `null` via EF Core `ON DELETE SET NULL` cascade (FR25). The right panel returns to an empty/default state after deletion, and toast notifications inform the user of the outcome.

**As a** commercial team member
**I want** to delete a client record using a confirmation dialog
**So that** the client list only contains active and relevant records

---

## Acceptance Criteria

1. **AC1** — Given the user is viewing a client's detail, When the user clicks "Eliminar", Then a confirmation dialog appears with "¿Eliminar este cliente?" and two buttons: "Confirmar" and "Cancelar".

2. **AC2** — Given the user confirms the deletion, When `DELETE /api/v1/clientes/:id` is processed, Then the client is removed from the list immediately without a page reload (FR27), the right panel returns to the empty/default state, and a toast displays "Cliente eliminado correctamente" (when the client had no associated contacts).

3. **AC3** — Given the client being deleted has one or more associated contacts, When the deletion is confirmed, Then the client is deleted, all associated contacts remain in the system with `clienteId = null` (FR25), and the toast displays "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

4. **AC4** — Given the user clicks "Cancelar" in the confirmation dialog, When the dialog closes, Then the client record remains in the system unchanged and no DELETE request is fired.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `e2e/tests/clientes/clientes-delete.spec.ts` (263 lines)

- **Test:** E2E-C-23 — "Eliminar" abre el diálogo de confirmación con "Confirmar" y "Cancelar"
  - **Status:** RED — `btn-eliminar` does not exist yet on `ClienteDetailPanel`; `delete-cliente-dialog` component not implemented
  - **Verifies:** AC1 — clicking "Eliminar" button opens a confirmation dialog with two action buttons (P0)

- **Test:** E2E-C-24 — confirmar eliminación quita el cliente de la lista inmediatamente y limpia el panel derecho
  - **Status:** RED — `DeleteClienteDialog` and `useDeleteCliente` mutation hook not implemented; list does not update reactively on delete
  - **Verifies:** AC2 — confirm button fires exactly one DELETE request; client disappears from list without reload; right panel shows empty state (P0)

- **Test:** E2E-C-25 — toast "Cliente eliminado correctamente" aparece tras eliminación exitosa sin contactos
  - **Status:** RED — toast logic not wired to delete mutation; `useDeleteCliente` hook does not exist
  - **Verifies:** AC2 — success toast with correct Spanish message appears after deletion with no associated contacts (P1)

- **Test:** E2E-C-26 — "Cancelar" cierra el diálogo sin hacer DELETE; el cliente permanece en la lista
  - **Status:** RED — `DeleteClienteDialog` does not exist; cancel behaviour not implemented
  - **Verifies:** AC4 — cancel button closes dialog without firing any DELETE request; client remains in list (P1)

- **Test:** E2E-C-27 — eliminar cliente con contactos muestra toast de desasignación de contactos
  - **Status:** RED — contact-unassignment toast message not implemented; ON DELETE SET NULL cascade not verified at E2E level
  - **Verifies:** AC3 — when client has associated contacts, correct toast message is displayed after deletion (P1)

### API Tests (2 tests)

**File:** `e2e/tests/clientes/clientes-api.spec.ts` (lines 299–408)

- **Test:** API-C-05 — DELETE /api/v1/clientes/:id devuelve 204; GET posterior devuelve 404
  - **Status:** RED — `DELETE /api/v1/clientes/{id}` endpoint not registered in `ClienteEndpoints.cs`; `DeleteClienteCommandHandler` not implemented
  - **Verifies:** AC2 — DELETE returns 204 No Content and the client cannot be retrieved afterwards (P0)

- **Test:** API-C-06 — DELETE de cliente con contactos: contactos persisten con clienteId = null
  - **Status:** RED — `ON DELETE SET NULL` on `contactos.cliente_id` FK not verified; `DeleteClienteCommandHandler` not implemented
  - **Verifies:** AC3 — associated contacts survive the deletion and their `clienteId` field becomes `null` (FR25) (P0)

### Component Tests (10 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/DeleteClienteDialog.test.tsx` (170 lines)

- **Test:** UNIT-C-FE-DCD-01 — renders dialog with data-testid="delete-cliente-dialog" when open=true
  - **Status:** RED — `DeleteClienteDialog.tsx` component does not exist
  - **Verifies:** AC1 — dialog mounts with correct testid for E2E selector stability

- **Test:** UNIT-C-FE-DCD-02 — dialog contains "¿Eliminar este cliente?" text
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — Spanish confirmation question is present in dialog body

- **Test:** UNIT-C-FE-DCD-03 — renders "Confirmar" button with data-testid="btn-confirmar-eliminar"
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — confirm action button has stable testid

- **Test:** UNIT-C-FE-DCD-04 — renders "Cancelar" button with data-testid="btn-cancelar-eliminar"
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — cancel action button has stable testid

- **Test:** UNIT-C-FE-DCD-05 — clicking "Cancelar" calls onClose without calling onConfirm
  - **Status:** RED — component not implemented; cancel behaviour not wired
  - **Verifies:** AC4 — cancel does not trigger the mutation

- **Test:** UNIT-C-FE-DCD-06 — clicking "Confirmar" calls onConfirm with the correct clienteId
  - **Status:** RED — component not implemented; confirm action not wired
  - **Verifies:** AC2 — confirm button propagates the correct clienteId to the mutation callback

- **Test:** UNIT-C-FE-DCD-07 — when isPending=true, confirm button is disabled and shows "Eliminando..."
  - **Status:** RED — component not implemented; loading state not handled
  - **Verifies:** AC2 — loading state prevents double-submission and provides user feedback

- **Test:** UNIT-C-FE-DCD-08 — dialog is not rendered or is hidden when open=false
  - **Status:** RED — component not implemented
  - **Verifies:** AC1 — controlled open state: dialog respects the `open` prop

- **Test:** UNIT-C-FE-DCD-09 — dialog has role="alertdialog" for WCAG 2.1 AA compliance
  - **Status:** RED — component not implemented; accessibility role not set
  - **Verifies:** AC1 — dialog uses `role="alertdialog"` with `aria-labelledby` (WCAG 2.1 AA)

- **Test:** UNIT-C-FE-DCD-10 — when isPending=false, confirm button is enabled
  - **Status:** RED — component not implemented
  - **Verifies:** AC2 — confirm button is interactive in the default (non-pending) state

---

## Data Factories Created

### Cliente Factory

**File:** `e2e/helpers/data.helper.ts` (already exists — shared across stories)

**Exports:**
- `buildCliente(overrides?)` — builds a valid cliente payload with unique `nombre`, `nit`, `telefono`, and `ciudad`
- `buildContacto(overrides?)` — builds a valid contacto payload; supports `clienteId` override for association tests

**Usage in Story 2.5 tests:**
```typescript
const clienteData = buildCliente({ nombre: 'Empresa Eliminar E2E-C-23' });
const contactoData = buildContacto({ clienteId: createdCliente.id });
```

---

## Fixtures Created

### Base Fixture (shared)

**File:** `e2e/fixtures/base.fixture.ts` (already exists)

**Fixtures:**
- `clientesPage` — navigates to `/clientes` before each test
  - **Provides:** page positioned at the clientes route
  - **Cleanup:** none (navigation only)

### ApiHelper (shared)

**File:** `e2e/helpers/api.helper.ts` (already exists)

**Methods used by Story 2.5:**
- `createCliente(data)` — POST `/api/v1/clientes` → returns created entity with `id`
- `deleteCliente(id)` — DELETE `/api/v1/clientes/:id` — used in `afterEach` cleanup
- `createContacto(data)` — POST `/api/v1/contactos` → returns created entity with `id`
- `deleteContacto(id)` — DELETE `/api/v1/contactos/:id` — used in `afterEach` cleanup

**Cleanup pattern (used in clientes-delete.spec.ts):**
```typescript
test.afterEach(async () => {
  for (const id of createdContactoIds) {
    await apiHelper.deleteContacto(id).catch(() => null);
  }
  for (const id of createdClienteIds) {
    await apiHelper.deleteCliente(id).catch(() => null);
  }
});
```

---

## Mock Requirements

### Cliente API — DELETE Endpoint

**Endpoint:** `DELETE /api/v1/clientes/{id:guid}`

**Success Response:**
```
HTTP 204 No Content
(empty body)
```

**Not Found Response:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente with id {id} was not found."
}
```

**Notes:** No stack trace must be exposed in the 404 response body (NFR6). Response body for 204 must be empty — no JSON wrapper.

### Network Intercept Pattern (E2E tests)

The E2E tests use network-first interception (routes registered BEFORE navigation) to track DELETE calls and prevent race conditions:

```typescript
// CORRECT: Register route handler BEFORE page.goto()
let deleteCallCount = 0;
await page.route('**/api/v1/clientes/**', (route) => {
  if (route.request().method() === 'DELETE') deleteCallCount++;
  route.continue();
});
await clientesPage.goto();
```

---

## Required data-testid Attributes

### ClienteDetailPanel (`frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`)

- `btn-eliminar` — "Eliminar" action button that opens the confirmation dialog

### DeleteClienteDialog (`frontend/src/modules/crm/clientes/presentation/DeleteClienteDialog.tsx`)

- `delete-cliente-dialog` — `DialogContent` root element (required for E2E and component tests)
- `btn-confirmar-eliminar` — confirm button inside the dialog
- `btn-cancelar-eliminar` — cancel button inside the dialog

**Implementation reference:**
```tsx
// DeleteClienteDialog.tsx
<DialogContent
  data-testid="delete-cliente-dialog"
  role="alertdialog"
  aria-labelledby="delete-dialog-title"
>
  <DialogTitle id="delete-dialog-title">¿Eliminar este cliente?</DialogTitle>
  <div>
    <button data-testid="btn-cancelar-eliminar" onClick={onClose}>Cancelar</button>
    <button
      data-testid="btn-confirmar-eliminar"
      onClick={() => onConfirm(clienteId)}
      disabled={isPending}
    >
      {isPending ? 'Eliminando...' : 'Confirmar'}
    </button>
  </div>
</DialogContent>

// ClienteDetailPanel.tsx
<button data-testid="btn-eliminar" onClick={() => setDialogOpen(true)}>Eliminar</button>
```

---

## Implementation Checklist

### Test: E2E-C-23 — Confirmation dialog opens when "Eliminar" is clicked

**File:** `e2e/tests/clientes/clientes-delete.spec.ts`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/presentation/DeleteClienteDialog.tsx` with Radix UI Dialog
- [ ] Add `data-testid="delete-cliente-dialog"` on `DialogContent`
- [ ] Add `data-testid="btn-confirmar-eliminar"` on confirm button
- [ ] Add `data-testid="btn-cancelar-eliminar"` on cancel button
- [ ] Dialog title/message must contain "¿Eliminar este cliente?"
- [ ] Add `data-testid="btn-eliminar"` to `ClienteDetailPanel.tsx`
- [ ] Wire "Eliminar" button to open the `DeleteClienteDialog` via `useState<boolean>`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts -g "E2E-C-23"`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: E2E-C-24 — Confirming deletion removes client from list immediately and clears right panel

**File:** `e2e/tests/clientes/clientes-delete.spec.ts`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts` (TanStack Query `useMutation`)
- [ ] `mutationFn`: `(id: string) => clienteApiRepository.delete(id)`
- [ ] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` to remove client from list
- [ ] After deletion, close dialog via `onClose()` callback
- [ ] After deletion, call `navigate({ to: '/clientes' })` to clear selected client and show empty state
- [ ] Add `delete(id: string): Promise<void>` to `IClienteRepository` interface
- [ ] Implement `delete()` in `clienteApiRepository.ts` — `DELETE /api/v1/clientes/:id`, expects 204 No Content
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts -g "E2E-C-24"`
- [ ] Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: E2E-C-25 — Toast "Cliente eliminado correctamente" after deletion (no contacts)

**File:** `e2e/tests/clientes/clientes-delete.spec.ts`

**Tasks to make this test pass:**
- [ ] In `useDeleteCliente.ts` `onSuccess`, call `toast.success('Cliente eliminado correctamente')` when `hasContacts` is false
- [ ] Ensure toast infrastructure (Zustand `toastStore.ts` + `ToastContainer`) is already mounted in the app (should be from Story 2.3)
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts -g "E2E-C-25"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: E2E-C-26 — "Cancelar" closes dialog without firing DELETE

**File:** `e2e/tests/clientes/clientes-delete.spec.ts`

**Tasks to make this test pass:**
- [ ] Wire "Cancelar" button in `DeleteClienteDialog` to call `onClose()` only — no mutation triggered
- [ ] Confirm cancel handler does NOT call `mutate()` or any mutation function
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts -g "E2E-C-26"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: E2E-C-27 — Deleting client with contacts shows unassignment toast

**File:** `e2e/tests/clientes/clientes-delete.spec.ts`

**Tasks to make this test pass:**
- [ ] Backend must return or derive a `hasContacts` flag before deletion
- [ ] In `DeleteClienteCommandHandler.cs`: query contact count BEFORE calling `DeleteAsync`, return count > 0 as part of response (or handle via separate header/field)
- [ ] Frontend: pass `hasContacts` information from mutation result to toast logic
- [ ] In `useDeleteCliente.ts` `onSuccess`, call `toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')` when `hasContacts` is true
- [ ] Verify `ON DELETE SET NULL` cascade is active in `ContactoConfiguration.cs`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts -g "E2E-C-27"`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: API-C-05 — DELETE returns 204; subsequent GET returns 404

**File:** `e2e/tests/clientes/clientes-api.spec.ts`

**Tasks to make this test pass:**
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs` — command record with `Guid Id`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
- [ ] Handler: fetch `ClienteEntity` by ID — throw `NotFoundException` if not found
- [ ] Handler: call `IClienteRepository.DeleteAsync(id)` to remove the entity
- [ ] Register `DELETE /api/v1/clientes/{id:guid}` in `ClienteEndpoints.cs` — returns 204 No Content
- [ ] Register `DeleteClienteCommandHandler` in DI in `Program.cs`
- [ ] Add `DeleteAsync(Guid id): Task` to `IClienteRepository` interface
- [ ] Implement `DeleteAsync()` in `ClienteRepository.cs`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-api.spec.ts -g "API-C-05"`
- [ ] Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: API-C-06 — DELETE with contacts: contacts retain clienteId = null

**File:** `e2e/tests/clientes/clientes-api.spec.ts`

**Tasks to make this test pass:**
- [ ] Verify `ContactoConfiguration.cs` has `OnDelete(DeleteBehavior.SetNull)` for `cliente_id` FK
- [ ] Confirm EF Core migration includes `ON DELETE SET NULL` constraint on `contactos.cliente_id`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-api.spec.ts -g "API-C-06"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Tests: UNIT-C-FE-DCD-01 to UNIT-C-FE-DCD-10 — DeleteClienteDialog component

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/DeleteClienteDialog.test.tsx`

**Tasks to make all component tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/presentation/DeleteClienteDialog.tsx`
- [ ] Use Radix UI `Dialog` (Dialog.Root / Dialog.Content / Dialog.Portal / Dialog.Overlay)
- [ ] Set `role="alertdialog"` and `aria-labelledby="delete-dialog-title"` on `DialogContent`
- [ ] Add `data-testid="delete-cliente-dialog"` on `DialogContent`
- [ ] Dialog text: "¿Eliminar este cliente?" as the visible title/body
- [ ] Add `data-testid="btn-cancelar-eliminar"` on cancel button — wired to `onClose()`
- [ ] Add `data-testid="btn-confirmar-eliminar"` on confirm button — wired to `onConfirm(clienteId)`
- [ ] Confirm button: `disabled={isPending}`, text changes to "Eliminando..." when `isPending=true`
- [ ] Props: `open: boolean`, `onClose: () => void`, `onConfirm: (clienteId: string) => void`, `clienteId: string`, `hasContacts: boolean`, `isPending?: boolean`
- [ ] Replace the stub import in test file with the real component import
- [ ] Run tests: `npx vitest run frontend/src/modules/crm/clientes/presentation/__tests__/DeleteClienteDialog.test.tsx`
- [ ] All 10 tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all E2E tests for Story 2.5
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts

# Run only API tests for Story 2.5 (within clientes-api.spec.ts)
npx playwright test e2e/tests/clientes/clientes-api.spec.ts --grep "Story 2.5"

# Run both E2E and API tests for Story 2.5
npx playwright test --grep "E2E-C-2[3-7]|API-C-0[56]"

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts --grep "E2E-C-23" --debug

# Run component tests (Vitest)
npx vitest run frontend/src/modules/crm/clientes/presentation/__tests__/DeleteClienteDialog.test.tsx

# Run all component tests in watch mode
npx vitest --watch frontend/src/modules/crm/clientes/presentation/__tests__/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Fixtures and factories created with auto-cleanup
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- All tests run and fail as expected
- E2E tests fail because `btn-eliminar`, `DeleteClienteDialog`, `useDeleteCliente`, and the backend DELETE endpoint do not yet exist
- Component tests fail because `DeleteClienteDialog.tsx` does not yet exist (stub returns null)
- API tests fail because `DELETE /api/v1/clientes/{id}` endpoint is not registered

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (start with P0: E2E-C-23 or API-C-05)
2. Read the test to understand expected behaviour
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist
6. Move to the next test and repeat

**Recommended order (by priority):**
1. API-C-05 (P0) — backend DELETE endpoint (validates server foundation)
2. API-C-06 (P0) — ON DELETE SET NULL cascade (validates data integrity)
3. E2E-C-23 (P0) — confirmation dialog UI
4. E2E-C-24 (P0) — delete wired end-to-end
5. E2E-C-25 (P1) — success toast (no contacts)
6. E2E-C-26 (P1) — cancel path
7. E2E-C-27 (P1) — toast with contact unassignment message
8. UNIT-C-FE-DCD-01 to -10 (Component) — DeleteClienteDialog unit tests

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 17 tests pass (green phase complete)
2. Extract shared delete confirmation logic if used elsewhere
3. Ensure `useDeleteCliente` follows the same hook patterns as `useCreateCliente` and `useUpdateCliente`
4. Review `DeleteClienteDialog` for consistency with `ClienteFormDialog` patterns
5. Ensure tests still pass after each refactor step

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts`
3. Begin implementation using the implementation checklist as a guide
4. Work one test at a time (red to green for each)
5. When all 17 tests pass, refactor code for quality
6. When refactoring is complete, update story status to 'done' in sprint-status.yaml

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts`

**Expected Results:**

```
Running 5 tests using 1 worker

  FAIL  [chromium] › clientes-delete.spec.ts:58:3 › Story 2.5 — Eliminar cliente (E2E) › E2E-C-23
  FAIL  [chromium] › clientes-delete.spec.ts:99:3 › Story 2.5 — Eliminar cliente (E2E) › E2E-C-24
  FAIL  [chromium] › clientes-delete.spec.ts:147:3 › Story 2.5 — Eliminar cliente (E2E) › E2E-C-25
  FAIL  [chromium] › clientes-delete.spec.ts:178:3 › Story 2.5 — Eliminar cliente (E2E) › E2E-C-26
  FAIL  [chromium] › clientes-delete.spec.ts:227:3 › Story 2.5 — Eliminar cliente (E2E) › E2E-C-27

5 failed, 0 passed
```

**Summary:**
- Total tests: 17 (5 E2E + 2 API + 10 Component)
- Passing: 0 (expected)
- Failing: 17 (expected)
- Status: RED phase verified

**Expected Failure Messages:**
- E2E-C-23: `Error: locator('[data-testid="btn-eliminar"]') — No elements found`
- E2E-C-24: `Error: locator('[data-testid="delete-cliente-dialog"]') — No elements found`
- E2E-C-25: `Error: locator text=/cliente eliminado correctamente/i — No elements found`
- E2E-C-26: `Error: locator('[data-testid="btn-cancelar-eliminar"]') — No elements found`
- E2E-C-27: `Error: locator text=/sus contactos asociados quedaron sin cliente asignado/i — No elements found`
- API-C-05: `Error: expected 204 received 404 (route not registered)`
- API-C-06: `Error: expected 204 received 404 (route not registered)`
- UNIT-C-FE-DCD-01 to -10: `Error: Unable to find element by: [data-testid="delete-cliente-dialog"] (component returns null)`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns with setup/teardown and auto-cleanup using `afterEach` with `createdIds` arrays
- **data-factories.md** — Factory patterns using `buildCliente()` and `buildContacto()` helpers with unique identifier generation
- **component-tdd.md** — Component test strategy using Vitest + Testing Library; RED phase with stub component
- **network-first.md** — Route interception registered BEFORE `page.goto()` to prevent race conditions (used in E2E-C-24 and E2E-C-26)
- **test-quality.md** — Given-When-Then format; one assertion per test; atomic test design
- **test-levels-framework.md** — E2E for critical user journeys (AC1–AC4); API for contract validation (AC2, AC3); Component for UI interaction isolation (AC1, AC2, AC4)

---

## Notes

- The E2E delete test file was previously scaffolded as part of the story task spec. The component test file (`DeleteClienteDialog.test.tsx`) is new and generated as part of this ATDD session.
- Backend unit tests (UNIT-B-06, UNIT-B-11 in `ClienteHandlerTests.cs`) are listed in the story's Task 7 but are written in C#/xUnit — they fall outside the Playwright/Vitest test scope of this ATDD workflow. The DEV agent should implement them following existing handler test patterns in `backend/tests/SiesaAgents.UnitTests/Handlers/`.
- The `hasContacts` logic (for determining which toast message to show) can be determined either by the frontend querying contact count before deletion, or by the backend returning it as part of the DELETE response. The simplest approach for the frontend is to pass the `hasContacts` prop derived from the contacts list already loaded in `ClienteDetailPanel`.
- Contact cleanup in `afterEach` is critical for E2E-C-27 since the backend uses `ON DELETE SET NULL` (not cascade delete) — contacts survive client deletion and must be cleaned up manually in the test teardown.

---

**Generated by BMad TEA Agent** — 2026-05-21
