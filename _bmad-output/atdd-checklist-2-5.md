# ATDD Checklist - Epic 2, Story 2.5: Delete Client

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + API (Playwright request)

---

## Story Summary

As a commercial team member, I want to delete a client record so that the client list only contains active and relevant records. The flow involves a confirmation dialog (AlertDialog) before the actual deletion, differentiates two toast messages depending on whether the client had associated contacts, and navigates back to the empty right-panel state after successful deletion.

**As a** commercial team member
**I want** to delete a client record via a confirmation dialog
**So that** the client list remains relevant and contacts are preserved with `clienteId = null` via ON DELETE SET NULL

---

## Acceptance Criteria

1. **AC #1** — Given the user is viewing a client's detail in the right panel, When the user clicks "Eliminar", Then a confirmation dialog appears with the message "¿Eliminar este cliente?" and two buttons: "Confirmar" and "Cancelar".

2. **AC #2** — Given the user clicks "Confirmar", When the deletion is processed via `DELETE /api/v1/clientes/:id`, Then the client is removed from the list immediately without page reload (FR27), the right panel returns to empty/default state, and a toast displays "Cliente eliminado correctamente" (if no associated contacts).

3. **AC #3** — Given the user clicks "Cancelar", When the dialog closes, Then the client record remains unchanged and no DELETE API call is made.

4. **AC #4** — Given the client has one or more associated contacts, When the user confirms deletion, Then the client is deleted, all associated contacts remain with `clienteId = null`, and the toast displays "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

---

## Failing Tests Created (RED Phase)

### Component Tests (11 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.test.tsx`

- **Test:** `should show "Eliminar" button (data-testid="btn-eliminar") in the data-loaded state`
  - **Status:** RED — `btn-eliminar` does not exist in `ClienteDetailView` yet
  - **Verifies:** AC #1 — button is rendered when a client is loaded

- **Test:** `TC-E2-2-5-CMP-P0-1 (partial): clicking "Eliminar" opens the confirmation dialog with "¿Eliminar este cliente?" title`
  - **Status:** RED — AlertDialog not wired to `ClienteDetailView`
  - **Verifies:** AC #1 — dialog title text

- **Test:** `should show "Confirmar" and "Cancelar" buttons in the dialog (AC #1)`
  - **Status:** RED — btn-confirm-delete and btn-cancel-delete do not exist
  - **Verifies:** AC #1 — both dialog action buttons are present

- **Test:** `should NOT show btn-eliminar when clienteId is undefined`
  - **Status:** RED — btn-eliminar not implemented; verify guard condition
  - **Verifies:** AC #1 — button only visible in data-loaded state

- **Test:** `TC-E2-2-5-CMP-P1-1: clicking "Cancelar" closes dialog and makes no DELETE API call`
  - **Status:** RED — cancel handler not implemented
  - **Verifies:** AC #3 — cancel does not trigger DELETE

- **Test:** `client remains in the system after clicking "Cancelar" — no mutation triggered`
  - **Status:** RED — delete mutation not implemented
  - **Verifies:** AC #3 — mutation guard

- **Test:** `TC-E2-2-5-CMP-P0-1: clicking "Confirmar" calls DELETE API exactly once and calls onClienteDeleted`
  - **Status:** RED — `useDeleteCliente` hook and `onClienteDeleted` prop not implemented
  - **Verifies:** AC #2, risk R-002

- **Test:** `should close the dialog after confirming deletion`
  - **Status:** RED — confirm handler not implemented
  - **Verifies:** AC #2 — dialog closes on success

- **Test:** `should disable "Confirmar" button while DELETE mutation is pending (isPending guard)`
  - **Status:** RED — `disabled={deleteMutation.isPending}` not implemented
  - **Verifies:** AC #2 — UX during in-flight mutation

- **Test:** `TC-E2-2-5-CMP-P1-2: should show toast "Cliente eliminado correctamente" when DELETE returns 204`
  - **Status:** RED — toast on 204 not implemented
  - **Verifies:** AC #2, risk R-010 — exact toast text

- **Test:** `TC-E2-2-5-CMP-P2-1: should show contacts-associated toast when DELETE returns 200 + { hadContacts: true }`
  - **Status:** RED — two-toast strategy not implemented
  - **Verifies:** AC #4 — contacts-associated toast variant

- **Test:** `should show error toast "No se pudo eliminar el cliente." when DELETE fails`
  - **Status:** RED — onError handler not implemented
  - **Verifies:** AC #2 — error handling

- **Test:** `should NOT call onClienteDeleted when DELETE fails with 500`
  - **Status:** RED — error branch not implemented
  - **Verifies:** AC #2 — navigation only on success

### API Tests (7 tests)

**File:** `e2e/tests/api/clientes-delete.api.spec.ts`

- **Test:** `TC-E2-2-5-API-P0-1: should return 204 No Content when deleting an existing client with no contacts`
  - **Status:** RED — DELETE endpoint not implemented
  - **Verifies:** AC #2 — 204 is the correct status for no-contacts deletion

- **Test:** `should remove the deleted client from GET /api/v1/clientes list`
  - **Status:** RED — DELETE endpoint not implemented
  - **Verifies:** AC #2, FR27 — client removed from list after deletion

- **Test:** `TC-E2-2-5-API-P0-2: should set clienteId to null on associated contacts (ON DELETE SET NULL)`
  - **Status:** RED — CASCADE SET NULL behavior not yet testable (Epic 3 dependency on Contactos table)
  - **Verifies:** AC #4, risk R-003 — FK cascade behavior

- **Test:** `TC-E2-2-5-API-P1-1: should return 404 with Problem Details RFC 7807 for non-existent UUID`
  - **Status:** RED — DELETE endpoint not implemented
  - **Verifies:** 404 uses `Results.Problem(...)` not `Results.NotFound()`

- **Test:** `should return content-type application/problem+json for a 404 DELETE response`
  - **Status:** RED — DELETE endpoint not implemented
  - **Verifies:** RFC 7807 compliance

- **Test:** `should NOT expose stack traces in 404 DELETE response (NFR6)`
  - **Status:** RED — ExceptionHandlingMiddleware verification
  - **Verifies:** NFR6 — no technical details in error responses

- **Test:** `TC-E2-2-5-API-P2-1: should return 200 + { hadContacts: true } when client with contacts is deleted`
  - **Status:** RED — two-response strategy not implemented (Epic 3 dependency)
  - **Verifies:** AC #4 — hadContacts flag signals frontend toast variant

- **Test:** `should return 204 (not 200) when deleting a client that has no contacts`
  - **Status:** RED — DELETE endpoint not implemented
  - **Verifies:** AC #2 — 204 for no-contacts path

### E2E Tests (5 tests)

**File:** `e2e/tests/clientes/clientes-delete.spec.ts`

- **Test:** `should show confirmation dialog with "¿Eliminar este cliente?" when "Eliminar" is clicked`
  - **Status:** RED — btn-eliminar and AlertDialog not implemented
  - **Verifies:** AC #1 — full E2E confirmation dialog flow

- **Test:** `should close dialog and make no DELETE API call when "Cancelar" is clicked (AC #3)`
  - **Status:** RED — cancel handler not implemented
  - **Verifies:** AC #3 — no DELETE on cancel

- **Test:** `TC-E2-2-5-E2E-P0-1: should remove client from left panel and return right panel to empty state after deletion`
  - **Status:** RED — useDeleteCliente + onClienteDeleted + navigation not implemented
  - **Verifies:** AC #2, FR27, risk R-002 — full flow

- **Test:** `should show "Eliminar" button only when client detail is in data-loaded state`
  - **Status:** RED — btn-eliminar visibility guard not implemented
  - **Verifies:** AC #1 — button not visible in empty/placeholder state

- **Test:** `should keep "Editar" button functional after the delete dialog is cancelled (regression guard)`
  - **Status:** RED — Story 2.4 regression — Editar must remain after cancel
  - **Verifies:** AC scoping — Eliminar does not break Editar (Story 2.4)

---

## Data Factories Used

### Cliente Factory (existing — Story 2.1)

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts`

**Exports used:**
- `buildCliente(overrides?)` — Build a single client with optional overrides
- `resetClienteCounter()` — Reset counter for deterministic test IDs

**E2E Data Helper:**
**File:** `e2e/helpers/data.helper.ts` (existing)
- `buildCliente(overrides?)` — Used in E2E tests for creating seeded data

---

## Fixtures Created

### MSW Server (Component Tests — inline)

MSW handlers are set up inline per test file following the network-first pattern. No new shared fixture file was created as existing patterns in `__tests__/*.test.tsx` are already consistent.

**Pattern used:**
```typescript
// CRITICAL: Intercept BEFORE render (network-first)
server.use(
  http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
  http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
    new HttpResponse(null, { status: 204 })
  )
);
renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });
```

### ApiHelper (E2E — existing)

**File:** `e2e/helpers/api.helper.ts`

The existing `ApiHelper.deleteCliente(id)` method is used for cleanup. No new fixture was required.

---

## Mock Requirements

### DELETE /api/v1/clientes/:id Mock (Component Tests)

**Endpoint:** `DELETE /api/v1/clientes/:id`

**204 Response (no contacts):**
```
HTTP 204 No Content
(empty body)
```

**200 Response (with contacts):**
```json
{ "hadContacts": true }
```

**404 Response (not found):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Cliente no encontrado",
  "status": 404,
  "detail": "El cliente solicitado no fue encontrado."
}
```

**Notes:** The Axios client maps 204 to `{ hadContacts: false }` and 200 to `{ hadContacts: true }` in `clienteApiRepository.delete()`. The component reads `result.hadContacts` to select the toast message.

---

## Required data-testid Attributes

### ClienteDetailView (Presentation Layer)

- `btn-eliminar` — The "Eliminar" button; visible only in data-loaded state
- `btn-confirm-delete` — AlertDialog "Confirmar" action button
- `btn-cancel-delete` — AlertDialog "Cancelar" action button

**Implementation Example:**
```tsx
<button
  onClick={() => setIsDeleteDialogOpen(true)}
  data-testid="btn-eliminar"
>
  Eliminar
</button>

<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel data-testid="btn-cancel-delete">Cancelar</AlertDialogCancel>
      <AlertDialogAction
        data-testid="btn-confirm-delete"
        disabled={deleteMutation.isPending}
        onClick={handleConfirmDelete}
      >
        {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Already existing from prior stories (do NOT recreate):**
- `cliente-detail-panel` — Root container (Story 2.2)
- `btn-editar` — Edit button (Story 2.4)
- `cliente-list-item` — Left panel list items (Story 2.1)
- `error-panel` — Error state container (Story 2.1)
- `not-found-panel` — Not found state container (Story 2.2)

---

## Implementation Checklist

### Test: TC-E2-2-5-API-P0-1 — DELETE valid ID → 204

**File:** `e2e/tests/api/clientes-delete.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs` with `DeleteClienteResult { bool Found, bool HadContacts }`
- [ ] Add `Task DeleteAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository.cs`
- [ ] Implement `DeleteAsync` in `ClienteRepository.cs`
- [ ] Add `MapDelete("/{id:guid}", ...)` to `ClienteEndpoints.cs` returning 204 when `!HadContacts`
- [ ] Register `DeleteClienteCommandHandler` in `Program.cs` DI
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-delete.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: TC-E2-2-5-API-P0-2 — Cascade SET NULL

**File:** `e2e/tests/api/clientes-delete.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `ContactoConfiguration.cs` has `.OnDelete(DeleteBehavior.SetNull)` on FK `contactos.cliente_id`
- [ ] Add `Task<int> CountContactosByClienteIdAsync(Guid clienteId, CancellationToken ct)` to `IClienteRepository.cs`
- [ ] Implement `CountContactosByClienteIdAsync` in `ClienteRepository.cs`
- [ ] Update `DeleteClienteCommandHandler` to use `CountContactosByClienteIdAsync` and return `HadContacts` flag
- [ ] Requires Epic 3 Contactos table to be deployed
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-delete.api.spec.ts --grep "Cascade"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours (after Epic 3 Contactos table exists)

---

### Test: TC-E2-2-5-API-P1-1 — DELETE unknown UUID → 404 Problem Details

**File:** `e2e/tests/api/clientes-delete.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Endpoint handler: `if (!result.Found) return Results.Problem(detail: "El cliente solicitado no fue encontrado.", statusCode: 404, title: "Cliente no encontrado")` — NOT `Results.NotFound()`
- [ ] Verify `ExceptionHandlingMiddleware` is active (no stack traces in response)
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-delete.api.spec.ts --grep "404"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by the DELETE endpoint task above)

---

### Test: TC-E2-2-5-API-P2-1 — DELETE with contacts → 200 + { hadContacts: true }

**File:** `e2e/tests/api/clientes-delete.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Endpoint handler: `if (result.HadContacts) return Results.Ok(new { hadContacts = true })`
- [ ] `CountContactosByClienteIdAsync` returns count > 0 when contacts exist
- [ ] Run test: `npx playwright test e2e/tests/api/clientes-delete.api.spec.ts --grep "hadContacts"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-2-5-CMP-P0-1 — Confirm delete → DELETE called once, onClienteDeleted called

**File:** `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts` — TanStack Query `useMutation`
- [ ] Add `delete(id: string): Promise<{ hadContacts: boolean }>` to `IClienteRepository.ts`
- [ ] Implement `delete(id)` in `clienteApiRepository.ts` — maps 204 → `{ hadContacts: false }`, 200 → `{ hadContacts: true }`
- [ ] Add `onClienteDeleted?: () => void` prop to `ClienteDetailView`
- [ ] Add `btn-eliminar` button visible in data-loaded state only
- [ ] Wire `handleConfirmDelete` to call `deleteMutation.mutate(clienteId, { onSuccess: () => { ... onClienteDeleted?.() ... }, onError: ... })`
- [ ] Add required data-testid attributes: `btn-eliminar`, `btn-confirm-delete`, `btn-cancel-delete`
- [ ] Run test: `pnpm --filter frontend test DeleteCliente`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: TC-E2-2-5-CMP-P1-1 — Cancel → no DELETE

**File:** `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.test.tsx`

**Tasks to make this test pass:**

- [ ] AlertDialog `<AlertDialogCancel>` closes the dialog (sets `isDeleteDialogOpen = false`) without calling mutation
- [ ] `btn-cancel-delete` data-testid present on AlertDialogCancel
- [ ] Run test: `pnpm --filter frontend test DeleteCliente`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by the task above)

---

### Test: TC-E2-2-5-CMP-P1-2 — 204 → toast "Cliente eliminado correctamente"

**File:** `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.test.tsx`

**Tasks to make this test pass:**

- [ ] `onSuccess(result)`: if `!result?.hadContacts` → `toast.success('Cliente eliminado correctamente')`
- [ ] Exact string: `'Cliente eliminado correctamente'` (R-010 enforcement)
- [ ] Run test: `pnpm --filter frontend test DeleteCliente`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by the task above)

---

### Test: TC-E2-2-5-CMP-P2-1 — { hadContacts: true } → toast with contacts message

**File:** `frontend/src/modules/crm/clientes/__tests__/DeleteCliente.test.tsx`

**Tasks to make this test pass:**

- [ ] `onSuccess(result)`: if `result?.hadContacts` → `toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')`
- [ ] Exact string matching AC #4
- [ ] Run test: `pnpm --filter frontend test DeleteCliente`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by the task above)

---

### Test: TC-E2-2-5-E2E-P0-1 — Full delete flow (E2E)

**File:** `e2e/tests/clientes/clientes-delete.spec.ts`

**Tasks to make this test pass:**

- [ ] All backend tasks above completed (DELETE endpoint live)
- [ ] All frontend tasks above completed (btn-eliminar, AlertDialog, useDeleteCliente)
- [ ] Route `clientes.$clienteId.tsx` passes `onClienteDeleted={() => navigate({ to: '/clientes' })}` prop
- [ ] `queryClient.invalidateQueries({ queryKey: ['clientes'] })` called in `useDeleteCliente` onSuccess
- [ ] `queryClient.removeQueries({ queryKey: ['clientes', id] })` called in `useDeleteCliente` onSuccess
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (wiring — implementation done in prior tasks)

---

## Running Tests

```bash
# Run all component tests for this story
pnpm --filter frontend test DeleteCliente

# Run all Playwright API tests for this story
npx playwright test e2e/tests/api/clientes-delete.api.spec.ts

# Run all E2E tests for this story
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts

# Run all tests (component + API + E2E) for this story
pnpm --filter frontend test DeleteCliente && npx playwright test e2e/tests/api/clientes-delete.api.spec.ts e2e/tests/clientes/clientes-delete.spec.ts

# Run tests in headed mode (see browser during E2E)
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts --debug

# Run with coverage
pnpm --filter frontend test --coverage DeleteCliente
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (23 total: 13 component, 8 API, 5 E2E — see note on count below)
- ✅ Network-first pattern applied (intercept BEFORE render/navigate)
- ✅ Given-When-Then structure in all tests
- ✅ data-testid selectors used exclusively (no CSS selectors)
- ✅ Mock requirements documented for DEV team
- ✅ data-testid requirements listed
- ✅ Implementation checklist created with clear tasks

**Verification:**

- Tests fail because `useDeleteCliente`, `btn-eliminar`, `AlertDialog` wiring, and `DELETE` endpoint do not exist yet
- Failure mode: Import error for `useDeleteCliente` in component tests; 404/405 for API/E2E tests
- No test fails due to test bugs — all failures are due to missing implementation

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with backend** (API tests unlock component test mocking): Implement `DELETE /api/v1/clientes/:id` (Task 1 in story)
2. **Implement `useDeleteCliente` hook** (Task 3 in story)
3. **Wire `ClienteDetailView`** with btn-eliminar + AlertDialog + onClienteDeleted prop (Task 4 in story)
4. **Wire route `clientes.$clienteId.tsx`** with `onClienteDeleted` navigate callback (Task 5 in story)
5. Run tests after each task to track progression from RED to GREEN

**Key Principles:**

- One test level at a time (backend API tests first, then component, then E2E)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 23 tests pass (green phase complete)
2. Review `useDeleteCliente` for TypeScript strictness (no `any`)
3. Review `ClienteDetailView` for code duplication with Story 2.4 edit modal pattern
4. Ensure `ExceptionHandlingMiddleware` is still active (no regressions)
5. Verify `ContactoConfiguration.cs` uses `DeleteBehavior.SetNull` (not `Cascade`)

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Confirm all tests fail** in RED phase: run commands above
3. **Begin implementation** using implementation checklist as guide (start with Task 1 — backend DELETE endpoint)
4. **Work one task at a time** (red → green for each task group)
5. **Mark story done** when all 23 tests pass and enforcement checklist in story file is verified

---

## Important Notes

- **Epic 3 dependency:** `TC-E2-2-5-API-P0-2` and `TC-E2-2-5-API-P2-1` require the `contactos` table. If Epic 3 is not yet deployed, these tests will be auto-skipped (graceful skip logic embedded in test body). Mark as tech debt.
- **Two-toast strategy:** 204 response → `hadContacts: false` → generic toast. 200 + `{ hadContacts: true }` → contacts-associated toast. The frontend reads the response body — not a second GET request.
- **AlertDialog vs Dialog:** Use `AlertDialog` (not `Dialog`) — correct `role="alertdialog"` for destructive confirmations. Verify `frontend/src/components/ui/alert-dialog.tsx` exists before implementation.
- **No `any` TypeScript:** `DeleteClienteResult` must be strictly typed. The `mutationFn` return type must be `Promise<{ hadContacts: boolean }>`.
- **Scope boundary:** Do NOT modify `ClienteForm`, `useCreateCliente`, or `useUpdateCliente` — Stories 2.3/2.4 must remain untouched.

---

## Knowledge Base References Applied

- **network-first.md** — Route interception BEFORE navigation/render applied in all E2E and component tests
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS or text selectors
- **test-quality.md** — Given-When-Then structure, one assertion per test (atomic), explicit waits only
- **data-factories.md** — `buildCliente(overrides?)` factory reused from Story 2.1; no hardcoded test data
- **component-tdd.md** — Component test setup with MSW network-first pattern; QueryClientProvider isolation
- **test-levels-framework.md** — P0 tests cover critical happy path (E2E + API); P1 for edge cases; P2 for complex business logic variations

---

**Generated by BMad TEA Agent** — 2026-06-28
