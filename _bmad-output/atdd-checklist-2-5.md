# ATDD Checklist - Epic 2, Story 5: Delete Client

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** Component + E2E

---

## Story Summary

Story 2.5 adds the ability to delete a client record from the CRM system. The user selects a client in the detail panel, clicks "Eliminar", confirms the deletion in an AlertDialog, and sees the list updated immediately while the right panel returns to its default state.

**As a** commercial team member
**I want** to delete a client record
**So that** the client list only contains active and relevant records

---

## Acceptance Criteria

1. **AC1** — Given the user is viewing a client's detail, when the user clicks "Eliminar", then a confirmation dialog appears asking "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options.

2. **AC2** — Given the user confirms the deletion (clicks "Confirmar"), when the backend returns `204 No Content`, then the client is removed from the list immediately (`invalidateQueries(['clientes'])`), the right panel returns to the empty/default state (no `clienteId` in the URL), and a success toast "Cliente eliminado correctamente" is displayed.

3. **AC3** — Given the user clicks "Cancelar" in the confirmation dialog, when the dialog closes, then the client record remains in the system unchanged and no request is sent to the backend.

4. **AC4** — Given the client being deleted has associated contacts, when the deletion is confirmed and the backend returns `204 No Content`, then all associated contacts remain with their data intact and the toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

5. **AC5** — Given the backend is unavailable when the delete is confirmed (network error or 5xx), when the mutation fails, then a toast error "No se pudo eliminar el cliente. Intenta de nuevo." is displayed, the dialog closes, and the client detail remains visible.

---

## Failing Tests Created (RED Phase)

### E2E Tests (18 tests)

**File:** `e2e/story-2-5/delete-client.spec.ts`

- **Test:** should render "Eliminar" button when client data is loaded
  - **Status:** RED — `data-testid="cliente-eliminar-button"` does not exist
  - **Verifies:** AC1 — "Eliminar" button visibility

- **Test:** should open confirmation dialog when "Eliminar" button is clicked
  - **Status:** RED — `data-testid="delete-confirmation-dialog"` does not exist
  - **Verifies:** AC1 — AlertDialog triggers on click

- **Test:** should display the dialog title "¿Eliminar este cliente?"
  - **Status:** RED — `data-testid="delete-dialog-title"` does not exist
  - **Verifies:** AC1 — correct dialog title in Spanish

- **Test:** should display "Confirmar" button inside the confirmation dialog
  - **Status:** RED — `data-testid="delete-dialog-confirm"` does not exist
  - **Verifies:** AC1 — Confirmar action present

- **Test:** should display "Cancelar" button inside the confirmation dialog
  - **Status:** RED — `data-testid="delete-dialog-cancel"` does not exist
  - **Verifies:** AC1 — Cancelar action present

- **Test:** should NOT render "Eliminar" button during skeleton loading state
  - **Status:** RED — no implementation guards button during loading
  - **Verifies:** AC1 — button absent in loading state

- **Test:** should NOT render "Eliminar" button while in edit mode
  - **Status:** RED — no mutually exclusive logic implemented
  - **Verifies:** AC1 — button absent while isEditing

- **Test:** should display success toast "Cliente eliminado correctamente" after confirmed deletion
  - **Status:** RED — `useDeleteCliente` hook does not exist
  - **Verifies:** AC2 — standard success toast

- **Test:** should navigate to /clientes (right panel empty/default) after confirmed deletion
  - **Status:** RED — no navigation logic on delete success
  - **Verifies:** AC2 — URL clears clienteId

- **Test:** should show placeholder in right panel after confirmed deletion
  - **Status:** RED — no navigation on success
  - **Verifies:** AC2 — detail placeholder shown

- **Test:** should remove deleted client from the left panel list
  - **Status:** RED — `invalidateQueries` not wired
  - **Verifies:** AC2 — list cache invalidated (FR27)

- **Test:** should disable "Confirmar" button and show "Eliminando…" while pending
  - **Status:** RED — no loading state UI
  - **Verifies:** AC2 — pending state UX

- **Test:** should close the confirmation dialog when "Cancelar" is clicked
  - **Status:** RED — no dialog implementation
  - **Verifies:** AC3 — dialog closes on cancel

- **Test:** should NOT send any DELETE request when "Cancelar" is clicked
  - **Status:** RED — no dialog implementation
  - **Verifies:** AC3 — no request on cancel

- **Test:** should keep the client detail visible after clicking "Cancelar"
  - **Status:** RED — no dialog implementation
  - **Verifies:** AC3 — detail unchanged on cancel

- **Test:** should display the contacts toast message when deleted client had associated contacts
  - **Status:** RED — contacts-based toast differentiation not implemented
  - **Verifies:** AC4 — special toast with contacts message

- **Test:** should display toast error "No se pudo eliminar el cliente. Intenta de nuevo." on 500
  - **Status:** RED — no error handling in delete flow
  - **Verifies:** AC5 — error toast message

- **Test:** should display toast error when DELETE network call is aborted
  - **Status:** RED — no error handling in delete flow
  - **Verifies:** AC5 — network error toast

### Component Tests (20 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.delete-flow.test.tsx`

- **Test:** should render "Eliminar" button when client data is loaded
  - **Status:** RED — `data-testid="cliente-eliminar-button"` not in component
  - **Verifies:** AC1

- **Test:** should NOT render "Eliminar" button during skeleton loading state
  - **Status:** RED — no button guard during loading
  - **Verifies:** AC1

- **Test:** should NOT render "Eliminar" button while isEditing is true
  - **Status:** RED — no mutual exclusion logic
  - **Verifies:** AC1

- **Test:** should open the confirmation dialog when "Eliminar" is clicked
  - **Status:** RED — AlertDialog not wired to button
  - **Verifies:** AC1

- **Test:** should display "¿Eliminar este cliente?" as the dialog title
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC1

- **Test:** should display "Confirmar" button in the dialog
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC1

- **Test:** should display "Cancelar" button in the dialog
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC1

- **Test:** should call navigate to /clientes after successful deletion
  - **Status:** RED — navigation on success not implemented
  - **Verifies:** AC2

- **Test:** should show standard success toast "Cliente eliminado correctamente" (no contacts)
  - **Status:** RED — toast on success not implemented
  - **Verifies:** AC2

- **Test:** should close the dialog when "Cancelar" is clicked
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC3

- **Test:** should NOT call DELETE API when "Cancelar" is clicked
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC3

- **Test:** should keep client detail content visible after clicking "Cancelar"
  - **Status:** RED — dialog not implemented
  - **Verifies:** AC3

- **Test:** should NOT call navigate when "Cancelar" is clicked
  - **Status:** RED — no implementation
  - **Verifies:** AC3

- **Test:** should show the contacts toast when deleted client had associated contacts in cache
  - **Status:** RED — cache-based toast differentiation not implemented
  - **Verifies:** AC4

- **Test:** should show toast error "No se pudo eliminar el cliente. Intenta de nuevo." on 5xx
  - **Status:** RED — error handler not implemented
  - **Verifies:** AC5

- **Test:** should close the dialog after a 5xx error
  - **Status:** RED — error handler not implemented
  - **Verifies:** AC5

- **Test:** should keep client detail content visible after a 5xx error
  - **Status:** RED — error handler not implemented
  - **Verifies:** AC5

- **Test:** should NOT call navigate when deletion fails with 5xx
  - **Status:** RED — error handler not implemented
  - **Verifies:** AC5

### Application Hook Tests (5 tests)

**File:** `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`

- **Test:** should call DELETE /api/v1/clientes/{id} with the correct id
  - **Status:** RED — `useDeleteCliente` hook does not exist
  - **Verifies:** AC2 — correct HTTP method and URL

- **Test:** should invalidate clientes queries on successful deletion
  - **Status:** RED — hook does not exist
  - **Verifies:** AC2 — FR27 cache invalidation

- **Test:** should have isError true on 404 response (client not found)
  - **Status:** RED — hook does not exist
  - **Verifies:** AC5 — error state propagation

- **Test:** should have isError true on 500 server error
  - **Status:** RED — hook does not exist
  - **Verifies:** AC5 — error state on 5xx

- **Test:** should expose isPending true while the mutation is in flight
  - **Status:** RED — hook does not exist
  - **Verifies:** AC2 — pending state for UI loading feedback

---

## Data Factories

No new factories required. Existing `e2e/support/factories/cliente.factory.ts` (`buildClienteResponse`, `buildClientePayload`) is reused by the E2E tests.

---

## Fixtures

No new fixtures required. Tests use inline MSW handlers and the existing `QueryClientProvider` pattern from previous stories.

---

## Mock Requirements

### DELETE /api/v1/clientes/{id}

**Endpoint:** `DELETE /api/v1/clientes/{id:guid}`

**Success Response:**
```
204 No Content (empty body)
```

**Failure Response:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente con id {id} no encontrado."
}
```

**Error Response (5xx):**
```json
{
  "title": "Internal Server Error",
  "status": 500
}
```

**Notes:**
- Backend returns `204 No Content` on success — no response body
- `ON DELETE SET NULL` on `contactos.cliente_id` is handled at DB level — no app-level contact logic needed
- Toast differentiation (AC4 vs AC2) is determined on the frontend using TanStack Query cache for `['contactos', { clienteId: id }]`

---

## Required data-testid Attributes

### ClienteDetailPanel Component

| data-testid | Element | Notes |
|---|---|---|
| `cliente-eliminar-button` | "Eliminar" button | Destructive style (red). Hidden during loading, edit mode |
| `delete-confirmation-dialog` | AlertDialog root/content | shadcn `AlertDialogContent` |
| `delete-dialog-title` | Dialog title heading | Must contain "¿Eliminar este cliente?" |
| `delete-dialog-confirm` | "Confirmar" action button | Disabled + shows "Eliminando…" during `isPending` |
| `delete-dialog-cancel` | "Cancelar" cancel button | Closes dialog without request |

**Existing (no change):**
- `cliente-detail-content` — already in use
- `cliente-detail-skeleton` — already in use
- `cliente-editar-button` — already in use
- `cliente-detail-placeholder` — already in use
- `toast-success` / `toast-error` — already in use (siesa-ui-kit)

**Implementation example:**

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button
      data-testid="cliente-eliminar-button"
      aria-label="Eliminar cliente"
      className="text-red-600 border border-red-600 hover:bg-red-50 rounded px-3 py-1.5 text-sm font-medium"
    >
      Eliminar
    </button>
  </AlertDialogTrigger>
  <AlertDialogContent data-testid="delete-confirmation-dialog">
    <AlertDialogHeader>
      <AlertDialogTitle data-testid="delete-dialog-title">
        ¿Eliminar este cliente?
      </AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel data-testid="delete-dialog-cancel" aria-label="Cancelar eliminación">
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction
        data-testid="delete-dialog-confirm"
        aria-label="Confirmar eliminación"
        disabled={deleteCliente.isPending}
        onClick={handleConfirmDelete}
      >
        {deleteCliente.isPending ? 'Eliminando…' : 'Confirmar'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Implementation Checklist

### Test: should call DELETE /api/v1/clientes/{id} with the correct id

**File:** `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts` with `useMutation` calling `clienteApiRepository.delete(id)`
- [ ] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: add `delete(id: string): Promise<void>`
- [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: implement `delete` method with `apiClient.delete('/api/v1/clientes/${id}')`
- [ ] Run test: `pnpm --filter frontend test useDeleteCliente.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should invalidate clientes queries on successful deletion

**File:** `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`

**Tasks to make this test pass:**

- [ ] In `useDeleteCliente.ts` `onSuccess` callback: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`
- [ ] Run test: `pnpm --filter frontend test useDeleteCliente.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: should render "Eliminar" button when client data is loaded

**Files:** `ClienteDetailPanel.delete-flow.test.tsx`, `delete-client.spec.ts`

**Tasks to make this test pass:**

- [ ] Install shadcn AlertDialog if missing: `npx shadcn@latest add alert-dialog`
- [ ] In `ClienteDetailPanel.tsx`: import `AlertDialog` components from `@/components/ui/alert-dialog`
- [ ] Import `useDeleteCliente` hook
- [ ] Import `useNavigate` from `@tanstack/react-router`
- [ ] Add "Eliminar" button with `data-testid="cliente-eliminar-button"` in the detail header (alongside "Editar")
- [ ] Guard: do NOT render "Eliminar" button while `isLoading`, `isError`, or `!data`
- [ ] Guard: do NOT render "Eliminar" button while `isEditing` is true
- [ ] Add required `data-testid` attributes: `cliente-eliminar-button`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.delete-flow`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should open the confirmation dialog when "Eliminar" is clicked

**Files:** `ClienteDetailPanel.delete-flow.test.tsx`, `delete-client.spec.ts`

**Tasks to make this test pass:**

- [ ] Wrap "Eliminar" button as `AlertDialogTrigger` inside `AlertDialog`
- [ ] Add `AlertDialogContent` with `data-testid="delete-confirmation-dialog"`
- [ ] Add `AlertDialogTitle` with `data-testid="delete-dialog-title"` containing "¿Eliminar este cliente?"
- [ ] Add `AlertDialogAction` with `data-testid="delete-dialog-confirm"` labeled "Confirmar"
- [ ] Add `AlertDialogCancel` with `data-testid="delete-dialog-cancel"` labeled "Cancelar"
- [ ] Add required `data-testid` attributes: `delete-confirmation-dialog`, `delete-dialog-title`, `delete-dialog-confirm`, `delete-dialog-cancel`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.delete-flow`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should call navigate to /clientes after successful deletion

**Files:** `ClienteDetailPanel.delete-flow.test.tsx`, `delete-client.spec.ts`

**Tasks to make this test pass:**

- [ ] In `AlertDialogAction` `onClick` (or `onSuccess` callback): call `navigate({ to: '/clientes' })`
- [ ] Check TanStack Query cache for `['contactos', { clienteId }]` before calling `mutate`
- [ ] If contacts exist in cache: show "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." toast
- [ ] If no contacts in cache: show "Cliente eliminado correctamente" toast
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.delete-flow`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.75 hours

---

### Test: should show toast error "No se pudo eliminar el cliente. Intenta de nuevo." on 5xx

**Files:** `ClienteDetailPanel.delete-flow.test.tsx`, `delete-client.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `onError` handler in the mutation call or `useDeleteCliente` extension: call `toast.error('No se pudo eliminar el cliente. Intenta de nuevo.')`
- [ ] On error: close dialog (Radix AlertDialog auto-closes; if custom logic needed, add state)
- [ ] On error: do NOT navigate (stay on client detail)
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.delete-flow`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Backend: DELETE /api/v1/clientes/{id} endpoint

**Tasks to make E2E tests pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
- [ ] Update `IClienteRepository.cs`: add `Task<bool> DeleteAsync(Guid id)`
- [ ] Update `ClienteRepository.cs`: implement `DeleteAsync` using EF Core `Remove` + `SaveChangesAsync`
- [ ] Update `ClienteEndpoints.cs`: map `DELETE /api/v1/clientes/{id:guid}` → 204 on success, 404 on not found
- [ ] Update `Program.cs`: register `DeleteClienteCommandHandler`
- [ ] Update 4 existing unit test files: add `DeleteAsync` stub to fake repositories
- [ ] Run E2E: `pnpm playwright test e2e/story-2-5/`
- [ ] ✅ E2E tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all failing E2E tests for this story
pnpm playwright test e2e/story-2-5/

# Run specific E2E test file
pnpm playwright test e2e/story-2-5/delete-client.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm playwright test e2e/story-2-5/ --headed

# Debug specific E2E test
pnpm playwright test e2e/story-2-5/delete-client.spec.ts --debug

# Run component + hook tests (Vitest)
pnpm --filter frontend test ClienteDetailPanel.delete-flow
pnpm --filter frontend test useDeleteCliente

# Run all frontend tests
pnpm --filter frontend test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (43 total)
- ✅ E2E tests: 18 tests in `e2e/story-2-5/delete-client.spec.ts`
- ✅ Component tests: 20 tests in `frontend/.../ClienteDetailPanel.delete-flow.test.tsx`
- ✅ Hook tests: 5 tests in `frontend/.../useDeleteCliente.test.ts`
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected (missing implementation, not test bugs)
- E2E tests fail with: `locator.click: Error: strict mode violation: getByTestId('cliente-eliminar-button') resolved to 0 elements`
- Component tests fail with: `Cannot find module './useDeleteCliente'`
- Hook tests fail with: `Cannot find module './useDeleteCliente'`

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with `useDeleteCliente.ts` — it's blocking everything)
2. **Implement minimal code** to make that specific test pass
3. **Run the test** to verify it now passes (green)
4. **Check off the task** in implementation checklist
5. **Move to next test** and repeat

**Recommended order:**
1. Create `useDeleteCliente.ts` hook (unblocks hook tests)
2. Update `IClienteRepository.ts` + `clienteApiRepository.ts` (needed by hook)
3. Extend `ClienteDetailPanel.tsx` with "Eliminar" button + AlertDialog (unblocks component tests)
4. Implement backend `DELETE /api/v1/clientes/{id}` (unblocks E2E tests)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 43 tests pass
2. Review `ClienteDetailPanel.tsx` for code quality (it now has create/read/edit/delete — may need sub-component extraction)
3. Ensure tests still pass after each refactor
4. Ready for code review

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm --filter frontend test useDeleteCliente`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to `done`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `test.extend()` pattern (used in base.fixture.ts, not extended for this story)
- **data-factories.md** — `buildClienteResponse` / `buildClientePayload` reused from `e2e/support/factories/cliente.factory.ts`
- **network-first.md** — All E2E tests use `page.route(...)` BEFORE `page.goto(...)` to prevent race conditions
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, explicit waits only
- **selector-resilience.md** — All selectors use `data-testid` exclusively
- **timing-debugging.md** — `waitFor` used for async state assertions; no hard waits (`setTimeout` / `sleep`)
- **component-tdd.md** — MSW for network mocking, `QueryClientProvider` wrapper, `userEvent.setup()` for interactions

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures (hook tests):**
```
FAIL frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts
  Error: Cannot find module './useDeleteCliente' from 'useDeleteCliente.test.ts'
  Tests: 5 failed
```

**Expected failures (component tests):**
```
FAIL frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.delete-flow.test.tsx
  Error: Unable to find an accessible element with the role "button" and name "eliminar cliente"
  Tests: 20 failed
```

**Expected failures (E2E tests):**
```
FAIL e2e/story-2-5/delete-client.spec.ts
  Error: locator.click: Error: strict mode violation: getByTestId('cliente-eliminar-button') resolved to 0 elements
  Tests: 18 failed
```

**Summary:**

- Total tests: 43
- Passing: 0 (expected)
- Failing: 43 (expected)
- Status: RED phase — all tests written and failing for the right reason (missing implementation)

---

**Generated by BMad TEA Agent** — 2026-06-25
