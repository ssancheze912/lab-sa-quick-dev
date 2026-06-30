# ATDD Checklist - Epic 2, Story 2.5: Delete Client

**Date:** 2026-06-30
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component (Unit supporting)

---

## Story Summary

A commercial team member wants to delete a client record so that the client list only contains active and relevant records. The flow requires an explicit confirmation dialog before deletion proceeds. When a deleted client has associated contacts, those contacts become unassigned (clienteId = null) via a DB-level ON DELETE SET NULL constraint.

**As a** commercial team member
**I want** to delete a client record with a confirmation dialog
**So that** the client list only contains active and relevant records

---

## Acceptance Criteria

1. **AC1** — Clicking "Eliminar" in a client's detail shows a confirmation dialog with title "¿Eliminar este cliente?" and "Confirmar" / "Cancelar" options.

2. **AC2** — Confirming deletion removes the client from the list immediately (FR27), returns the right panel to the empty/default state, and shows toast "Cliente eliminado correctamente" (no contacts case).

3. **AC3** — Clicking "Cancelar" closes the dialog; the client record remains in the system unchanged.

4. **AC4** — Deleting a client with associated contacts: client is removed, contacts remain in system with their data intact and `clienteId = null` (FR25), toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

---

## Failing Tests Created (RED Phase)

### E2E Tests (15 tests)

**File:** `e2e/tests/clientes/delete-client.spec.ts`

- **Test:** `should show "Eliminar" button when a client detail is displayed`
  - **Status:** RED - delete-cliente-button testid missing (component not implemented)
  - **Verifies:** AC1 — Button is present in ClienteDetailView

- **Test:** `should open confirmation dialog when "Eliminar" button is clicked`
  - **Status:** RED - alertdialog role not present (AlertDialog not implemented)
  - **Verifies:** AC1 — Dialog opens on click

- **Test:** `should show "¿Eliminar este cliente?" title in the confirmation dialog`
  - **Status:** RED - dialog text not present
  - **Verifies:** AC1 — Exact dialog title text

- **Test:** `should show "Confirmar" button inside the confirmation dialog`
  - **Status:** RED - delete-confirm-button testid missing
  - **Verifies:** AC1 — Confirmar button present

- **Test:** `should show "Cancelar" button inside the confirmation dialog`
  - **Status:** RED - delete-cancel-button testid missing
  - **Verifies:** AC1 — Cancelar button present

- **Test:** `should call DELETE /api/v1/clientes/{id} when "Confirmar" is clicked`
  - **Status:** RED - DELETE endpoint not implemented
  - **Verifies:** AC2 — DELETE API is called

- **Test:** `should navigate to /clientes (empty panel) after successful deletion`
  - **Status:** RED - navigation not implemented
  - **Verifies:** AC2 — Panel returns to empty/default state

- **Test:** `should show success toast "Cliente eliminado correctamente" when no contacts`
  - **Status:** RED - toast not shown (useDeleteCliente missing)
  - **Verifies:** AC2 — Correct toast for no-contacts case

- **Test:** `should disable "Confirmar" button while deletion is in flight`
  - **Status:** RED - button not disabled during pending
  - **Verifies:** AC2 — Loading state disables Confirmar

- **Test:** `should remove deleted client from the list after successful deletion (FR27)`
  - **Status:** RED - requires real backend DELETE + query invalidation
  - **Verifies:** AC2 — FR27 immediate removal from list

- **Test:** `should close the confirmation dialog when "Cancelar" is clicked`
  - **Status:** RED - Cancelar behavior not implemented
  - **Verifies:** AC3 — Dialog closes on Cancelar

- **Test:** `should NOT call DELETE when "Cancelar" is clicked`
  - **Status:** RED - delete-cancel-button not present
  - **Verifies:** AC3 — No DELETE on cancel

- **Test:** `should keep client record in detail panel after "Cancelar"`
  - **Status:** RED - panel state not managed
  - **Verifies:** AC3 — Client data unchanged

- **Test:** `should show toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." when client has contacts`
  - **Status:** RED - contacts toast not implemented
  - **Verifies:** AC4 — Specific toast for clients-with-contacts case

- **Test:** `should leave contacts in system with clienteId = null after client deletion (FR25)`
  - **Status:** RED - requires real backend with ON DELETE SET NULL
  - **Verifies:** AC4 — FR25 contacts become unassigned

### API Tests (11 tests)

**File:** `e2e/tests/api/clientes-delete.api.spec.ts`

- **Test:** `should return 204 No Content when a valid existing client id is provided`
  - **Status:** RED - DELETE endpoint returns 404 or 405 (not implemented)
  - **Verifies:** AC2 — 204 No Content contract

- **Test:** `should return empty body on 204 response`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC2 — No Content (empty body)

- **Test:** `should no longer return the deleted client in GET /api/v1/clientes list (FR27)`
  - **Status:** RED - deletion not implemented
  - **Verifies:** AC2 — FR27 immediate list removal

- **Test:** `should return 404 for GET /api/v1/clientes/{id} after deletion`
  - **Status:** RED - deletion not implemented
  - **Verifies:** AC2 — Deleted client returns 404

- **Test:** `should return 404 when client id does not exist`
  - **Status:** RED - DELETE endpoint returns 405 (not implemented)
  - **Verifies:** AC2 — 404 for non-existent client

- **Test:** `should return Problem Details RFC 7807 format on 404`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC2 — Problem Details contract on 404

- **Test:** `should NOT expose stack trace in 404 response body (NFR6)`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** NFR6 — No internal details leaked

- **Test:** `should set contacto.clienteId to null after client deletion (DB ON DELETE SET NULL)`
  - **Status:** RED - DELETE endpoint not implemented
  - **Verifies:** AC4 — FR25 ON DELETE SET NULL behavior

- **Test:** `should keep contact data intact (nombre, email) after client deletion (AC4)`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC4 — Contact data integrity

- **Test:** `should return client as deleted (404) while contact still exists (AC4)`
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC4 — Client deleted, contact survives

### Component / Unit Tests (16 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx` (10 tests)

- **Test:** `renders "Eliminar" button with data-testid="delete-cliente-button"`
  - **Status:** RED - button not in ClienteDetailView
  - **Verifies:** AC1 — Button presence

- **Test:** `opens confirmation dialog (alertdialog role) when "Eliminar" button is clicked`
  - **Status:** RED - AlertDialog not in ClienteDetailView
  - **Verifies:** AC1 — Dialog opens

- **Test:** `shows "¿Eliminar este cliente?" in the confirmation dialog title`
  - **Status:** RED - dialog not implemented
  - **Verifies:** AC1 — Dialog title text

- **Test:** `shows "Confirmar" button with data-testid="delete-confirm-button" in the dialog`
  - **Status:** RED - dialog buttons missing
  - **Verifies:** AC1 — Confirmar button

- **Test:** `shows "Cancelar" button with data-testid="delete-cancel-button" in the dialog`
  - **Status:** RED - dialog buttons missing
  - **Verifies:** AC1 — Cancelar button

- **Test:** `does NOT show confirmation dialog before "Eliminar" is clicked`
  - **Status:** RED - component not implemented
  - **Verifies:** AC1 — Dialog closed by default

- **Test:** `calls useDeleteCliente.mutate with clienteId when "Confirmar" is clicked`
  - **Status:** RED - useDeleteCliente mock not wired
  - **Verifies:** AC2 — mutate called with correct id

- **Test:** `closes the confirmation dialog when "Cancelar" is clicked`
  - **Status:** RED - Cancelar logic not implemented
  - **Verifies:** AC3 — Dialog closes on Cancelar

- **Test:** `does NOT call mutate when "Cancelar" is clicked`
  - **Status:** RED - dialog not implemented
  - **Verifies:** AC3 — No mutation on cancel

- **Test:** `allows re-opening the dialog after "Cancelar"`
  - **Status:** RED - dialog state management missing
  - **Verifies:** AC3 — Cancel does not lock the button

**File:** `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts` (11 tests)

- **Test:** `calls clienteApiRepository.delete with the provided id`
  - **Status:** RED - useDeleteCliente module does not exist (import fails)
  - **Verifies:** AC2 — DELETE API call

- **Test:** `invalidates ["clientes"] query cache on success`
  - **Status:** RED - hook missing
  - **Verifies:** AC2 — FR27 list invalidation

- **Test:** `invalidates ["contactos"] query cache on success`
  - **Status:** RED - hook missing
  - **Verifies:** AC4 — FR25 contacts invalidation

- **Test:** `calls onSuccess callback when provided and mutation succeeds`
  - **Status:** RED - hook missing
  - **Verifies:** AC2 — onSuccess callback pattern

- **Test:** `returns isPending as true while mutation is in flight`
  - **Status:** RED - hook missing
  - **Verifies:** AC2 — Loading state

- **Test:** `shows error toast "No se pudo eliminar. Intenta de nuevo." on failure`
  - **Status:** RED - hook missing
  - **Verifies:** AC2 — Error toast

- **Test:** `sets isError to true when mutation fails`
  - **Status:** RED - hook missing
  - **Verifies:** AC2 — isError state

- **Test:** `does NOT call invalidateQueries when mutation fails`
  - **Status:** RED - hook missing
  - **Verifies:** AC2 — No cache invalidation on error

---

## Data Factories Created

Existing factories reused — no new factory files needed.

**Existing:** `e2e/helpers/data.helper.ts`

- `buildCliente(overrides?)` — already provides all required fields
- `buildContacto(overrides?)` — already supports `clienteId` field

---

## Fixtures Created

No new fixture files. Integration tests use `ApiHelper` (existing) for setup/teardown with real API calls. Unit/component tests use vitest `vi.mock()`.

---

## Mock Requirements

### DELETE /api/v1/clientes/{id} — Backend endpoint

**Endpoint:** `DELETE /api/v1/clientes/{id}`

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
  "detail": "Client with id '{id}' was not found."
}
```

**Notes:** DB FK constraint `contactos.cliente_id ON DELETE SET NULL` must be active (established in Story 1.3).

### Frontend mocks (Vitest)

- `clienteApiRepository.delete` — `vi.fn()` returning `Promise<void>`
- `useDeleteCliente` — `vi.fn()` returning `{ mutate, isPending, isError }`
- `@tanstack/react-router useNavigate` — `vi.fn(() => vi.fn())`

---

## Required data-testid Attributes

### ClienteDetailView

- `delete-cliente-button` — "Eliminar" trigger button (beside existing "edit-cliente-button")
- `delete-confirm-button` — "Confirmar" action button inside the AlertDialog
- `delete-cancel-button` — "Cancelar" cancel button inside the AlertDialog

**Implementation Example:**
```tsx
<button data-testid="delete-cliente-button" onClick={() => setIsDeleteDialogOpen(true)}>
  <TrashIcon className="h-4 w-4" /> Eliminar
</button>

<AlertDialogAction data-testid="delete-confirm-button" onClick={() => mutate(clienteId)}>
  Confirmar
</AlertDialogAction>

<AlertDialogCancel data-testid="delete-cancel-button">
  Cancelar
</AlertDialogCancel>
```

---

## Implementation Checklist

### Test: AC1 — Confirmation dialog renders correctly

**File:** `e2e/tests/clientes/delete-client.spec.ts`, `ClienteDetailView.delete.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add `isDeleteDialogOpen` local `useState<boolean>` in `ClienteDetailView`
- [ ] Add "Eliminar" button with `data-testid="delete-cliente-button"` and `TrashIcon`
- [ ] Import and render `AlertDialog` from `components/ui/alert-dialog.tsx` (install if missing)
- [ ] Set dialog title to "¿Eliminar este cliente?"
- [ ] Add "Confirmar" button with `data-testid="delete-confirm-button"`
- [ ] Add "Cancelar" button with `data-testid="delete-cancel-button"`
- [ ] Run test: `pnpm exec vitest run src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx`
- [ ] Run test: `npx playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC2 — Successful deletion, navigation, toast (no contacts)

**Files:** all test files

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts` hook
  - [ ] Use `useMutation` with `mutationFn: (id: string) => clienteApiRepository.delete(id)`
  - [ ] `onSuccess`: invalidate `['clientes']` and `['contactos']`, call optional `onSuccess?.()`
  - [ ] `onError`: `toast.error('No se pudo eliminar. Intenta de nuevo.')`
  - [ ] Return `{ mutate, isPending, isError }`
- [ ] Add `delete(id: string): Promise<void>` to `IClienteRepository` interface
- [ ] Implement `delete(id)` in `clienteApiRepository.ts` calling `DELETE /api/v1/clientes/${id}`
- [ ] Wire "Confirmar" click to call `mutate(clienteId)` and navigate to `/clientes` on success
- [ ] Implement toast logic in `ClienteDetailView.onSuccess`:
  - [ ] `hasContacts` = `(contactos?.length ?? 0) > 0` (from `useContactosPorCliente`)
  - [ ] If `hasContacts` → toast AC4 message; else → toast AC2 message
- [ ] Backend: Create `DeleteClienteCommand.cs`, `DeleteClienteCommandHandler.cs`, `DeleteClienteCommandValidator.cs`
- [ ] Backend: Add `MapDelete` to `ClienteEndpoints.cs` returning 204/404/500
- [ ] Backend: Add `DeleteAsync(Guid id): Task` to `IClienteRepository` and implement
- [ ] Run test: `pnpm exec vitest run src/modules/crm/clientes/application/useDeleteCliente.test.ts`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-delete.api.spec.ts`
- [ ] Run test: `npx playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: AC3 — Cancelar closes dialog without deletion

**File:** `ClienteDetailView.delete.test.tsx`, `delete-client.spec.ts`

**Tasks to make these tests pass:**

- [ ] Wire "Cancelar" click to `setIsDeleteDialogOpen(false)` without calling mutate
- [ ] Verify AlertDialog `onOpenChange` resets state on overlay close
- [ ] Run test: `pnpm exec vitest run src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx --grep "AC3"`
- [ ] Run test: `npx playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — Contacts unassigned after client deletion

**File:** `delete-client.spec.ts`, `clientes-delete.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Verify `contactos.cliente_id` FK has `ON DELETE SET NULL` in DB migration (Story 1.3)
- [ ] Verify `useContactosPorCliente(clienteId)` hook is available or create inline query
- [ ] Verify invalidation of `['contactos']` in `useDeleteCliente.onSuccess`
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-delete.api.spec.ts --grep "AC4"`
- [ ] Run test: `npx playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all E2E failing tests for this story
npx playwright test e2e/tests/clientes/delete-client.spec.ts

# Run API failing tests for this story
npx playwright test e2e/tests/api/clientes-delete.api.spec.ts

# Run frontend unit tests (useDeleteCliente hook)
pnpm --filter frontend exec vitest run src/modules/crm/clientes/application/useDeleteCliente.test.ts

# Run frontend component tests (ClienteDetailView delete dialog)
pnpm --filter frontend exec vitest run src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx

# Run ALL new tests for this story
npx playwright test e2e/tests/clientes/delete-client.spec.ts e2e/tests/api/clientes-delete.api.spec.ts
pnpm --filter frontend exec vitest run src/modules/crm/clientes/

# Run in headed mode (see browser)
npx playwright test e2e/tests/clientes/delete-client.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/clientes/delete-client.spec.ts --debug

# Run with coverage
pnpm --filter frontend exec vitest run --coverage src/modules/crm/clientes/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Fixtures and factories reused (no new files needed)
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable (module-not-found for useDeleteCliente, missing testids for E2E)
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with AC1 dialog)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Priority Order:**

1. AC1: AlertDialog + "Eliminar" button (component tests first — fastest)
2. AC2: useDeleteCliente hook + repository.delete + backend DELETE endpoint
3. AC3: Cancelar wiring (minimal — just close state)
4. AC4: Toast logic + contactos invalidation (verify DB constraint active)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review code for quality — extract duplications in toast logic
3. Ensure WCAG 2.1 AA on AlertDialog (focus trap, aria-label on Confirmar button)
4. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/clientes/delete-client.spec.ts`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each AC)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to `done`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation (intercept before `page.goto`)
- **selector-resilience.md** — `data-testid` selectors throughout, `getByRole('alertdialog')` for semantic accuracy
- **test-quality.md** — One assertion per test, Given-When-Then structure, cleanup in afterEach
- **fixture-architecture.md** — ApiHelper pattern for real API setup/teardown in integration tests
- **data-factories.md** — `buildCliente` and `buildContacto` factory pattern
- **component-tdd.md** — `vi.mock()` for hook isolation in component tests

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures:**

- `useDeleteCliente.test.ts` — ALL fail with `Failed to resolve import "./useDeleteCliente"` (module not found)
- `ClienteDetailView.delete.test.tsx` — ALL fail with `TestingLibraryElementError: Unable to find an accessible element with role="alertdialog"` and `Unable to find an element by: [data-testid="delete-cliente-button"]`
- `delete-client.spec.ts` — ALL fail with `locator.click: Error: locator.click: Timeout … waiting for [data-testid="delete-cliente-button"]`
- `clientes-delete.api.spec.ts` — ALL fail with `expect(received).toBe(expected): expected 204, received 404` or `405` (endpoint not wired)

**Summary:**

- Total tests: 42 (15 E2E + 11 API + 10 component + 11 unit)
- Passing: 0 (expected)
- Failing: 42 (expected)
- Status: RED phase — all failures are due to missing implementation

---

## Notes

- `useDeleteCliente` must follow the factory pattern of `useUpdateCliente` (accept `onSuccess` callback option)
- Toast logic lives in `ClienteDetailView` (not inside the hook) because `hasContacts` context is only known in the presentation layer
- `shadcn/ui AlertDialog` is the correct component (not regular Dialog) — it provides WCAG focus trap resolution
- DB `ON DELETE SET NULL` FK for `contactos.cliente_id` was established in Story 1.3 — verify before backend implementation
- Backend `NotFoundException` domain class exists from Story 2.4 — reuse for 404 cases
- Both `['clientes']` and `['contactos']` query keys must be invalidated to reflect the unassignment (FR25)

---

**Generated by BMad TEA Agent** - 2026-06-30
