# ATDD Checklist - Epic 2, Story 2.5: Delete Client

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** Component + API Integration

---

## Story Summary

Commercial team members need to delete client records to keep the client list clean and relevant. The feature requires a confirmation dialog (to prevent accidental deletes), two distinct success toast messages (generic vs. orphan-contact), and automatic cache invalidation after deletion.

**As a** commercial team member
**I want** to delete a client record
**So that** the client list only contains active and relevant records

---

## Acceptance Criteria

1. Clicking "Eliminar" in the client detail panel opens a confirmation dialog "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options.
2. Confirming deletion removes the client from the list immediately, returns the right panel to empty/default state, and shows toast "Cliente eliminado correctamente".
3. Clicking "Cancelar" closes the dialog — client record is unchanged and no DELETE request is triggered.
4. If the deleted client had associated contacts, the toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." and contacts become unassigned (clienteId = null).
5. On mutation onSuccess, `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is called to remove the deleted client from the list without a page reload.
6. DELETE request for a non-existent client ID returns 404 Not Found with Problem Details RFC 7807 (no stack trace exposed).

---

## Failing Tests Created (RED Phase)

### E2E Tests (14 tests)

**File:** `e2e/tests/clientes/delete-cliente.spec.ts`

- **Test:** should show "Eliminar" button in the detail panel when a client is loaded
  - **Status:** RED — data-testid="cliente-detail-delete-button" not present yet
  - **Verifies:** AC #1 — delete button presence

- **Test:** should open confirmation dialog with correct title when "Eliminar" is clicked
  - **Status:** RED — data-testid="cliente-detail-delete-dialog" not present yet
  - **Verifies:** AC #1 — dialog title "¿Eliminar este cliente?"

- **Test:** should show "Confirmar" and "Cancelar" buttons inside the confirmation dialog
  - **Status:** RED — dialog buttons not present yet
  - **Verifies:** AC #1 — dialog action buttons

- **Test:** should NOT show "Eliminar" button when no client is selected (empty state)
  - **Status:** RED — delete button guard logic not implemented
  - **Verifies:** AC #1 — button visibility guard

- **Test:** should call DELETE API with correct client ID when "Confirmar" is clicked
  - **Status:** RED — DELETE endpoint not registered
  - **Verifies:** AC #2 — correct API call

- **Test:** should show toast "Cliente eliminado correctamente" after successful deletion
  - **Status:** RED — toast not emitted yet
  - **Verifies:** AC #2 — success toast message

- **Test:** should return right panel to empty/default state after successful deletion
  - **Status:** RED — right panel reset not implemented
  - **Verifies:** AC #2 — right panel state after delete

- **Test:** should close the confirmation dialog when "Cancelar" is clicked
  - **Status:** RED — cancel handler not implemented
  - **Verifies:** AC #3 — dialog close on cancel

- **Test:** should NOT trigger DELETE when "Cancelar" is clicked
  - **Status:** RED — cancel guard not implemented
  - **Verifies:** AC #3 — no DELETE on cancel

- **Test:** should keep the client in the detail panel after "Cancelar"
  - **Status:** RED — cancel guard not implemented
  - **Verifies:** AC #3 — client unchanged on cancel

- **Test:** should show orphan-contact toast when client with contacts is deleted
  - **Status:** RED — orphan toast logic not implemented
  - **Verifies:** AC #4 — orphan-contact toast message

- **Test:** should NOT show orphan-contact toast for client without contacts
  - **Status:** RED — toast differentiation not implemented
  - **Verifies:** AC #4 — generic toast for clients without contacts

### Component Tests (13 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx`

- **Test:** TC-E2-P0-06: should show "Eliminar" button in the detail panel
  - **Status:** RED — data-testid="cliente-detail-delete-button" not present
  - **Verifies:** AC #1

- **Test:** TC-E2-P0-06: should open confirmation dialog with "¿Eliminar este cliente?"
  - **Status:** RED — delete dialog not rendered
  - **Verifies:** AC #1

- **Test:** TC-E2-P0-06: should show "Confirmar" and "Cancelar" buttons in dialog
  - **Status:** RED — dialog buttons absent
  - **Verifies:** AC #1

- **Test:** TC-E2-P0-06: should call DELETE with correct client ID when "Confirmar" is clicked
  - **Status:** RED — useDeleteCliente hook not created
  - **Verifies:** AC #2, AC #5

- **Test:** TC-E2-P0-06: should show toast "Cliente eliminado correctamente" after deletion
  - **Status:** RED — toast not emitted from useDeleteCliente
  - **Verifies:** AC #2

- **Test:** TC-E2-P0-06: should return right panel to empty/default state after deletion
  - **Status:** RED — post-delete navigation not implemented
  - **Verifies:** AC #2

- **Test:** TC-E2-P1-10: should close the confirmation dialog when "Cancelar" is clicked
  - **Status:** RED — cancel handler absent
  - **Verifies:** AC #3

- **Test:** TC-E2-P1-10: should NOT trigger DELETE when "Cancelar" is clicked
  - **Status:** RED — cancel guard absent
  - **Verifies:** AC #3

- **Test:** TC-E2-P1-10: should keep client record in detail panel after "Cancelar"
  - **Status:** RED — cancel guard absent
  - **Verifies:** AC #3

- **Test:** TC-E2-P1-11: should show orphan-contact toast when client with contacts is deleted
  - **Status:** RED — orphan toast logic not present
  - **Verifies:** AC #4

- **Test:** TC-E2-P1-11: should NOT show orphan-contact toast for client without contacts
  - **Status:** RED — toast differentiation absent
  - **Verifies:** AC #4

- **Test:** should NOT show "Eliminar" button when no client is selected
  - **Status:** RED — guard absent
  - **Verifies:** AC #1 boundary

- **Test:** should disable "Confirmar" button while DELETE is in flight
  - **Status:** RED — isPending guard absent
  - **Verifies:** AC #2 double-submit prevention

### Unit Tests (8 tests)

**File:** `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`

- **Test:** TC-E2-P2-06: should call invalidateQueries with ["clientes"] after successful DELETE
  - **Status:** RED — useDeleteCliente.ts does not exist
  - **Verifies:** AC #5

- **Test:** should NOT call invalidateQueries when DELETE mutation fails
  - **Status:** RED — useDeleteCliente.ts does not exist
  - **Verifies:** AC #5 negative path

- **Test:** should expose isPending as true while DELETE mutation is in flight
  - **Status:** RED — useDeleteCliente.ts does not exist
  - **Verifies:** AC #2 — double-submit prevention

- **Test:** should expose isPending as false before any mutation is triggered
  - **Status:** RED — useDeleteCliente.ts does not exist
  - **Verifies:** AC #2 initial state

- **Test:** should call options.onSuccess when DELETE mutation succeeds
  - **Status:** RED — useDeleteCliente.ts does not exist
  - **Verifies:** AC #2 callback

- **Test:** should NOT call options.onSuccess when DELETE mutation fails
  - **Status:** RED — useDeleteCliente.ts does not exist
  - **Verifies:** AC #2 callback negative path

- **Test:** should expose isError true when backend returns 500
  - **Status:** RED — useDeleteCliente.ts does not exist
  - **Verifies:** Error handling

- **Test:** toast differentiation based on hasAssociatedContacts (2 tests)
  - **Status:** RED — useDeleteCliente.ts does not exist
  - **Verifies:** AC #4

### API Integration Tests (5 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/DeleteClienteEndpointTests.cs`

- **Test:** TC-E2-P0-08: DeleteCliente_Returns204_AndClientIsGone
  - **Status:** RED — DELETE /api/v1/clientes/{id} not registered → 404/405
  - **Verifies:** AC #2 — 204 + client removed

- **Test:** DeleteCliente_RemovedFromList_AfterDeletion
  - **Status:** RED — endpoint not registered
  - **Verifies:** AC #2, FR27 — list reflects deletion

- **Test:** DeleteCliente_SecondDelete_Returns404_NotServerError
  - **Status:** RED — endpoint not registered
  - **Verifies:** AC #6 — idempotent 404

- **Test:** TC-E2-P2-10: DeleteNonExistentCliente_Returns404ProblemDetails_WithNoStackTrace
  - **Status:** RED — endpoint not registered
  - **Verifies:** AC #6, NFR6, R-E2-06 — 404 + Problem Details, no stackTrace

- **Test:** DeleteNonExistentCliente_Returns404WithProblemJsonContentType
  - **Status:** RED — endpoint not registered
  - **Verifies:** AC #6 — Content-Type: application/problem+json

---

## Data Factories Created

No new factories were needed for this story. The existing `createCliente()` factory from
`frontend/src/test/factories/cliente.factory.ts` (Story 2.1) is reused.

For the orphan-contact scenario, the `KNOWN_CLIENTE_WITH_CONTACTS` inline constant is used in
component and E2E tests (with `contactCount: 3` override).

---

## Fixtures Created

No new fixtures were needed. Component tests use the existing pattern:
- `frontend/src/test/msw/handlers/clientes-delete.handlers.ts` — new MSW handlers for DELETE

---

## Mock Requirements

### DELETE /api/v1/clientes/:id — MSW Handlers

**File:** `frontend/src/test/msw/handlers/clientes-delete.handlers.ts`

- `handleDeleteClienteSuccess()` — Returns 204 No Content
- `handleDeleteClienteNotFound()` — Returns 404 with Problem Details `{ status: 404, title: "Not Found", detail: "Cliente no encontrado" }`
- `handleDeleteClienteServerError()` — Returns 500

---

## Required data-testid Attributes

### ClienteDetailView — Delete flow

- `cliente-detail-delete-button` — "Eliminar" button in the detail panel actions area
- `cliente-detail-delete-dialog` — Confirmation dialog container
- `cliente-detail-delete-confirm` — "Confirmar" action button inside the dialog (destructive)
- `cliente-detail-delete-cancel` — "Cancelar" button inside the dialog
- `empty-state` — Right panel empty/default state (already expected from Story 2.1)

**Implementation Example:**
```tsx
<button data-testid="cliente-detail-delete-button" onClick={() => setIsDeleteDialogOpen(true)}>
  <TrashIcon /> Eliminar
</button>

<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent data-testid="cliente-detail-delete-dialog">
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel data-testid="cliente-detail-delete-cancel">
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction
        data-testid="cliente-detail-delete-confirm"
        onClick={() => deleteMutation.mutate(cliente.id)}
        disabled={deleteMutation.isPending}
      >
        Confirmar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Implementation Checklist

### Test: TC-E2-P2-06 — useDeleteCliente invalidates cache

**File:** `frontend/src/modules/crm/clientes/application/useDeleteCliente.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
- [ ] Uses `useMutation` from TanStack Query
- [ ] `mutationFn: (id: string) => clienteApiRepository.delete(id)`
- [ ] `onSuccess`: calls `queryClient.invalidateQueries({ queryKey: ['clientes'] })`
- [ ] `onSuccess`: determines toast message based on `options.hasAssociatedContacts`
- [ ] `onError`: shows generic "Error al eliminar el cliente"
- [ ] Exposes `mutate`, `isPending`, `isError` from the hook
- [ ] Run test: `pnpm --filter frontend test useDeleteCliente.test.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E2-P0-06 — Confirmation dialog and deletion flow (Component)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx`

**Tasks to make this test pass:**

- [ ] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add `delete(id: string): Promise<void>`
- [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implement `delete(id)`
- [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
  - [ ] Import `useDeleteCliente` hook
  - [ ] Add `isDeleteDialogOpen` state with `useState`
  - [ ] Add "Eliminar" button with `data-testid="cliente-detail-delete-button"`
  - [ ] Render `AlertDialog` with `data-testid="cliente-detail-delete-dialog"`
  - [ ] Add "Confirmar" button with `data-testid="cliente-detail-delete-confirm"`
  - [ ] Add "Cancelar" button with `data-testid="cliente-detail-delete-cancel"`
  - [ ] Wire "Confirmar" to `deleteMutation.mutate(cliente.id)`, disable when `isPending`
  - [ ] Wire "Cancelar" to close dialog only (NEVER call mutate)
  - [ ] On mutation `onSuccess`: close dialog, clear selected client, navigate to `/clientes`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.delete.test.tsx`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E2-P0-08 — DELETE endpoint returns 204 + client removed (API)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/DeleteClienteEndpointTests.cs`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
  - [ ] Loads entity by ID via `IClienteRepository.GetByIdAsync`
  - [ ] Throws `NotFoundException` if not found → 404
  - [ ] Calls `IClienteRepository.DeleteAsync(cliente, ct)`
- [ ] Update `backend/src/SiesaAgents.Application/Clientes/Interfaces/IClienteRepository.cs` — add `DeleteAsync(ClienteEntity entity, CancellationToken ct): Task`
- [ ] Update `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `DeleteAsync`
- [ ] Update `backend/src/SiesaAgents.API/Endpoints/ClientesEndpoints.cs` — add `MapDelete("/api/v1/clientes/{id}", ...)` returning 204
- [ ] Run test: `dotnet test --filter "TC_E2_P0_08"`
- [ ] Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E2-P2-10 — DELETE non-existent → 404 Problem Details, no stackTrace (API)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/DeleteClienteEndpointTests.cs`

**Tasks to make this test pass:**

- [ ] `DeleteClienteCommandHandler` throws `NotFoundException` for missing ID
- [ ] `ExceptionHandlingMiddleware` (from Epic 1/Story 2.4) maps `NotFoundException` → 404 Problem Details
- [ ] Verify no `stackTrace`, `exception`, or `innerException` keys in 404 response
- [ ] Run test: `dotnet test --filter "TC_E2_P2_10"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours (middleware already exists from Story 2.4)

---

### Test: E2E delete flow (delete-cliente.spec.ts)

**File:** `e2e/tests/clientes/delete-cliente.spec.ts`

**Tasks to make this test pass:**

- [ ] All component-level tasks above must be complete (data-testid attributes in place)
- [ ] E2E tests use network-first route intercepts — no additional backend setup needed for E2E
- [ ] Run test: `npx playwright test delete-cliente.spec.ts`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0 additional hours (E2E tests depend on component implementation)

---

## Running Tests

```bash
# Run all unit tests for this story
pnpm --filter frontend test useDeleteCliente.test.ts

# Run component tests for this story
pnpm --filter frontend test ClienteDetailView.delete.test.tsx

# Run all frontend tests
pnpm --filter frontend test

# Run API integration tests for this story
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "DeleteCliente"

# Run E2E tests for this story
npx playwright test e2e/tests/clientes/delete-cliente.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/clientes/delete-cliente.spec.ts --headed

# Debug E2E test
npx playwright test e2e/tests/clientes/delete-cliente.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- MSW handlers created for DELETE endpoint
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- All tests fail because `useDeleteCliente.ts` does not exist and `ClienteDetailView.tsx` has no delete UI
- `delete-cliente.spec.ts` E2E tests fail because data-testid attributes are absent
- `DeleteClienteEndpointTests.cs` fail because DELETE endpoint is not registered (405 or 404)
- Failure messages are clear and actionable

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick the highest-priority failing test (start with `useDeleteCliente.test.ts`)
2. Implement `useDeleteCliente.ts` following the hook pattern in Story Dev Notes
3. Run unit tests to verify green
4. Implement `delete(id)` in `clienteApiRepository.ts` and `IClienteRepository.ts`
5. Update `ClienteDetailView.tsx` with delete button + dialog + post-delete navigation
6. Run component tests to verify green
7. Implement backend: `DeleteClienteCommand`, `DeleteClienteCommandHandler`, `ClienteRepository.DeleteAsync`, endpoint
8. Run API integration tests to verify green
9. Verify E2E tests pass (they rely on all the above)

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- "Cancelar" MUST NEVER call mutate — this is a mandatory guard

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass
2. Check orphan-contact toast detection strategy (Option A vs Option B from story notes)
3. Ensure `isDeleteDialogOpen` state management is consistent with `isEditFormOpen` pattern
4. Verify `ON DELETE SET NULL` is configured in `ContactoEntityConfiguration` (prep for Epic 4)
5. Run all tests after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm --filter frontend test` + `dotnet test`
3. Begin implementation using the checklist above as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, manually update story status to 'done'

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns with setup/teardown (pure function → fixture composition)
- **data-factories.md** — Deterministic factory patterns using sequential IDs (no faker installed)
- **component-tdd.md** — Component test strategies (provider isolation, state testing, modal/dialog testing)
- **network-first.md** — Route interception BEFORE navigation (prevents race conditions in E2E)
- **test-quality.md** — Given-When-Then format, one assertion per test, determinism, cleanup
- **selector-resilience.md** — data-testid selectors exclusively (never CSS class selectors)

---

## Test Execution Evidence

**Status:** RED phase — tests not yet run (implementation does not exist)

**Expected failure messages:**

- Unit/Component: `Error: Cannot find module './useDeleteCliente' from '...useDeleteCliente.test.ts'`
- Component: `TestingLibraryElementError: Unable to find an element by: [data-testid="cliente-detail-delete-button"]`
- API: `Assert.Equal() Failure: Expected: NoContent (204) | Actual: MethodNotAllowed (405)` or `NotFound (404)`
- E2E: `Error: locator.click: Error: strict mode violation: getByTestId('cliente-detail-delete-button')`

---

## Notes

- The `ContactoEntity` does not exist yet in the backend. The TC-E2-P0-08 cascade verification
  (contacts become `clienteId = null` after client deletion) will be fully testable when
  Epic 4 introduces the Contacto domain. The current `DeleteClienteEndpointTests.cs` covers
  the DELETE 204 and 404 cases; the FK cascade is deferred.
- shadcn `AlertDialog` is already installed (confirmed in architecture). Use it as the
  confirmation dialog if siesa-ui-kit has no equivalent component.
- The `ExceptionHandlingMiddleware` from Story 2.4 already maps `NotFoundException` → 404
  Problem Details. No new middleware needed for this story.

---

**Generated by BMad TEA Agent** — 2026-06-29
