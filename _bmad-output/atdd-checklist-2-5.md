# ATDD Checklist - Epic 2, Story 2.5: Delete Client

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

A commercial team member needs to delete a client record from the system to keep the client list containing only active and relevant records. The feature requires a confirmation dialog before proceeding, posts-deletion navigation back to the client list, and appropriate toast messages — including a specialized message when the deleted client had associated contacts.

**As a** commercial team member
**I want** to delete a client record
**So that** the client list only contains active and relevant records

---

## Acceptance Criteria

1. **Given** the user is viewing a client's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears asking "¿Eliminar este cliente?" with "Confirmar" and "Cancelar" options.

2. **Given** the user confirms the deletion, **When** the deletion is processed via `DELETE /api/v1/clientes/{id}`, **Then** the client is removed from the list immediately (FR27 — `invalidateQueries(['clientes'])`), **And** the right panel returns to the empty/default state (URL navigates back to `/clientes`), **And** a toast shows "Cliente eliminado correctamente".

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the client record remains in the system unchanged and no API call is made.

4. **Given** the client being deleted has associated contacts, **When** the deletion is confirmed and processed, **Then** the client record is deleted, **And** all previously associated contacts remain in the system with their data intact, **And** those contacts become unassigned (`cliente_id = NULL` — enforced by `ON DELETE SET NULL` FK constraint in PostgreSQL), **And** the toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

5. **Given** the delete mutation is in-flight, **When** the request is pending, **Then** the "Confirmar" button is disabled and shows "Eliminando..." to prevent duplicate submissions.

6. **Given** the backend returns an unexpected error during deletion, **When** the mutation fails (non-404 error), **Then** an error toast "No se pudo eliminar. Intenta de nuevo." is displayed without exposing technical details (NFR6).

---

## Failing Tests Created (RED Phase)

### E2E Tests (20 tests)

**File:** `e2e/tests/clientes/delete-client.spec.ts`

**AC1 — "Eliminar" button opens confirmation dialog (4 tests)**

- **Test:** `should display an "Eliminar" button in the client detail panel`
  - **Status:** RED - `data-testid="eliminar-cliente-button"` does not exist yet in `ClienteDetailView.tsx`
  - **Verifies:** AC1 — Delete trigger button is rendered in detail panel header

- **Test:** `should open a confirmation dialog when "Eliminar" is clicked`
  - **Status:** RED - `AlertDialog` with "¿Eliminar este cliente?" text not yet implemented
  - **Verifies:** AC1 — Clicking "Eliminar" renders the confirmation dialog

- **Test:** `should show "Confirmar" option in the confirmation dialog`
  - **Status:** RED - `data-testid="confirmar-eliminacion-button"` does not exist yet
  - **Verifies:** AC1 — "Confirmar" button is present inside the AlertDialog

- **Test:** `should show "Cancelar" option in the confirmation dialog`
  - **Status:** RED - `data-testid="cancelar-eliminacion-button"` does not exist yet
  - **Verifies:** AC1 — "Cancelar" button is present inside the AlertDialog

**AC2 — Confirming deletion removes client and shows success toast (5 tests)**

- **Test:** `should call DELETE /api/v1/clientes/{id} when "Confirmar" is clicked`
  - **Status:** RED - `useDeleteCliente` hook and `deleteById()` repository method do not exist
  - **Verifies:** AC2 — DELETE API call is made with the correct client ID

- **Test:** `should navigate to /clientes after successful deletion`
  - **Status:** RED - Post-delete navigation via TanStack Router `useNavigate` not yet wired
  - **Verifies:** AC2 — URL navigates to `/clientes` after successful delete

- **Test:** `should display success toast "Cliente eliminado correctamente" after deletion`
  - **Status:** RED - `onSuccess` toast logic in `useDeleteCliente` not implemented
  - **Verifies:** AC2 — Generic success toast message for client without contacts

- **Test:** `should re-fetch the client list (invalidateQueries "clientes") after successful deletion`
  - **Status:** RED - `queryClient.invalidateQueries({ queryKey: ['clientes'] })` not called
  - **Verifies:** AC2 (FR27) — TanStack Query cache invalidation triggers re-fetch

- **Test:** `should show the right panel in empty/default state after deletion`
  - **Status:** RED - Navigation to `/clientes` and empty state not implemented
  - **Verifies:** AC2 — Right panel returns to default state after deletion

**AC3 — "Cancelar" closes dialog without deleting (4 tests)**

- **Test:** `should close the confirmation dialog when "Cancelar" is clicked`
  - **Status:** RED - AlertDialog cancel behavior not implemented
  - **Verifies:** AC3 — Dialog closes without submitting

- **Test:** `should NOT call DELETE /api/v1/clientes/{id} when "Cancelar" is clicked`
  - **Status:** RED - No cancel guard logic implemented yet
  - **Verifies:** AC3 — No API call is made when user cancels

- **Test:** `should keep the client record visible in detail after clicking "Cancelar"`
  - **Status:** RED - Client detail still visible after cancel not verified
  - **Verifies:** AC3 — Client data remains unchanged

- **Test:** `should remain on the same URL after clicking "Cancelar"`
  - **Status:** RED - URL stability after cancel not verified
  - **Verifies:** AC3 — No navigation occurs when user cancels

**AC4 — Contacts-aware toast for client with associated contacts (2 tests)**

- **Test:** `should show "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." when client has contacts`
  - **Status:** RED - `hasContacts` detection and conditional toast logic not implemented
  - **Verifies:** AC4 — Specialized toast message when client had contacts

- **Test:** `should NOT show the contacts-aware toast when client has no contacts`
  - **Status:** RED - Same as above; generic toast fallback not yet implemented
  - **Verifies:** AC4 — Generic toast shown when client has no contacts

**AC5 — In-flight state: button disabled and "Eliminando..." (2 tests)**

- **Test:** `should disable the "Confirmar" button while the DELETE request is in-flight`
  - **Status:** RED - `isPending` state not wired to button `disabled` prop
  - **Verifies:** AC5 — Prevents duplicate submission during in-flight request

- **Test:** `should show "Eliminando..." on the "Confirmar" button while DELETE is in-flight`
  - **Status:** RED - `isPending` state not wired to button label
  - **Verifies:** AC5 — Loading text shown during in-flight request

**AC6 — Error handling: toast without technical details (3 tests)**

- **Test:** `should display error toast "No se pudo eliminar. Intenta de nuevo." when backend returns 500`
  - **Status:** RED - `onError` toast logic in `useDeleteCliente` not implemented
  - **Verifies:** AC6 (NFR6) — User-friendly error message on unexpected failure

- **Test:** `should NOT display a stack trace or technical error message when deletion fails`
  - **Status:** RED - Error boundary and toast implementation not yet in place
  - **Verifies:** AC6 (NFR6) — No technical details exposed to user

- **Test:** `should NOT navigate away from the client detail when deletion fails`
  - **Status:** RED - No navigation guard on error implemented
  - **Verifies:** AC6 — User remains on client detail after failure (can retry)

---

### API Tests (12 tests)

**File:** `e2e/tests/api/delete-client.api.spec.ts`

**DELETE 204 No Content (4 tests)**

- **Test:** `should return HTTP 204 when deleting an existing client`
  - **Status:** RED - `DELETE /api/v1/clientes/{id}` endpoint does not exist in backend
  - **Verifies:** AC2 — Successful deletion returns 204 No Content

- **Test:** `should return an empty body on 204 response`
  - **Status:** RED - Same endpoint missing
  - **Verifies:** AC2 — Response body is empty (204 = No Content)

- **Test:** `should remove the client from the system — GET /api/v1/clientes/{id} returns 404 after DELETE`
  - **Status:** RED - Backend endpoint and handler not implemented
  - **Verifies:** AC2 — Client is physically deleted from DB

- **Test:** `should remove the client from the list — GET /api/v1/clientes no longer contains deleted client`
  - **Status:** RED - Same endpoint missing
  - **Verifies:** AC2 — List no longer contains deleted client

**DELETE 404 Not Found (3 tests)**

- **Test:** `should return HTTP 404 when the client ID does not exist`
  - **Status:** RED - `NotFoundException` handling in endpoint not implemented
  - **Verifies:** Implicit AC — Non-existent ID returns 404

- **Test:** `should return Problem Details RFC 7807 format on 404 for DELETE`
  - **Status:** RED - `ExceptionHandlingMiddleware` processes `NotFoundException` (middleware exists, endpoint missing)
  - **Verifies:** Implicit AC — Error follows Problem Details RFC 7807

- **Test:** `should return HTTP 400 when the id path parameter is not a valid UUID`
  - **Status:** RED - Endpoint route binding with `{id:guid}` not configured
  - **Verifies:** Implicit AC — Malformed UUID path param returns 400

**AC4 — ON DELETE SET NULL for contacts (2 tests)**

- **Test:** `should set cliente_id to NULL on associated contacts when client is deleted`
  - **Status:** RED - `ON DELETE SET NULL` FK constraint works at DB level but endpoint missing to trigger it
  - **Verifies:** AC4 — Contacts become unassigned after client deletion

- **Test:** `should preserve all contact data fields after client deletion (only clienteId becomes NULL)`
  - **Status:** RED - Same endpoint missing
  - **Verifies:** AC4 — Contact data remains intact; only `clienteId` becomes NULL

**AC6 — No stack traces in error responses (3 tests)**

- **Test:** `should NOT expose stack trace in 404 response body when client ID does not exist`
  - **Status:** RED - Endpoint missing; middleware already handles this for other endpoints
  - **Verifies:** AC6 (NFR6) — No `StackTrace`, `at System.`, or `Exception` in 404 response

- **Test:** `should return Problem Details format (status + title) on 404 — no raw exception message`
  - **Status:** RED - Same endpoint missing
  - **Verifies:** AC6 — Problem Details structure is well-formed

- **Test:** `should allow deleting the same client ID only once — second DELETE returns 404`
  - **Status:** RED - Idempotent behavior requires endpoint + `NotFoundException` handler
  - **Verifies:** Implicit AC — Second delete of same ID returns 404 (resource gone)

---

### Component Tests (0 tests)

Component-level tests for the delete flow are covered by frontend unit tests in `ClienteDetailView.test.tsx` (Story 2.5 tasks reference), which use Vitest + React Testing Library + MSW. These are not Playwright component tests and are part of the existing frontend test suite being extended by the dev team.

---

## Data Factories

### Cliente Factory (existing — Story 2.1)

**File:** `e2e/support/factories/cliente.factory.ts`

**Exports:**
- `createClientePayload(overrides?)` - Build a valid POST body (no id, no timestamps)
- `createClienteDto(overrides?)` - Build a full ClienteDto (id + timestamps) for mock API responses
- `createClienteDtos(count, overrides?)` - Build an array of ClienteDto objects

All new tests reuse the existing factory — no new factory files were needed for this story.

---

## Fixtures

### Base Fixture (existing — Story 2.1)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures available:**
- `clientesPage` — Navigates to `/clientes` before the test and provides `page`
- `contactosPage` — Navigates to `/contactos` before the test

The delete-client tests use `{ page }` directly (not the `clientesPage` fixture) because they navigate to specific client detail URLs (e.g., `/clientes/${cliente.id}`). No new fixture files were created for this story.

---

## Mock Requirements

### Delete Client API Mock (E2E Tests — Playwright Route Intercepts)

**Endpoint:** `DELETE /api/v1/clientes/{id}`

**Success Response:**
```json
HTTP 204 No Content
(empty body)
```

**Error Response (500):**
```json
{
  "status": 500,
  "title": "Internal Server Error",
  "detail": "Database error."
}
```

**Error Response (404):**
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "Cliente {id} not found."
}
```

**Notes:** All E2E tests use `page.route()` to intercept network calls BEFORE navigation (network-first pattern). This prevents race conditions and avoids the need for a live backend during E2E testing.

### Contacts API Mock (E2E Tests — AC4)

**Endpoint:** `GET /api/v1/contactos` (with `clienteId` filter query param)

**With contacts response:**
```json
[
  { "id": "contact-uuid-1", "nombre": "Contacto Uno", "clienteId": "<client-id>" },
  { "id": "contact-uuid-2", "nombre": "Contacto Dos", "clienteId": "<client-id>" }
]
```

**Without contacts response:**
```json
[]
```

**Notes:** The frontend uses the TanStack Query cache for `['contactos', { clienteId }]` to determine `hasContacts` (Strategy B from Dev Notes). Intercept this endpoint in E2E tests that verify the contacts-aware toast (AC4).

---

## Required data-testid Attributes

### ClienteDetailView Component

- `eliminar-cliente-button` — "Eliminar" trigger button in the detail panel header (alongside "Editar" button). Uses destructive styling with `TrashIcon`.
- `confirmar-eliminacion-button` — "Confirmar" button inside the `AlertDialog` (primary, destructive style). Text changes to "Eliminando..." when `isPending === true`.
- `cancelar-eliminacion-button` — "Cancelar" button inside the `AlertDialog` (secondary style).

**Implementation Example:**
```tsx
{/* Trigger button in ClienteDetailView header */}
<button
  data-testid="eliminar-cliente-button"
  onClick={() => setDialogOpen(true)}
  aria-label="Eliminar cliente"
>
  <TrashIcon className="h-5 w-5" />
  Eliminar
</button>

{/* Inside AlertDialog */}
<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <AlertDialogContent>
    <AlertDialogTitle>¿Eliminar este cliente?</AlertDialogTitle>
    <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
    <AlertDialogCancel data-testid="cancelar-eliminacion-button">
      Cancelar
    </AlertDialogCancel>
    <AlertDialogAction
      data-testid="confirmar-eliminacion-button"
      disabled={isPending}
      onClick={() => mutate({ id: cliente.id, hasContacts })}
    >
      {isPending ? 'Eliminando...' : 'Confirmar'}
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

---

## Implementation Checklist

### Test Group: AC1 — "Eliminar" button and confirmation dialog

**Tasks to make these tests pass:**

- [ ] Add `deleteById(id: string): Promise<void>` to `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- [ ] Implement `deleteById(id: string): Promise<void>` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` using `apiClient.delete(\`/api/v1/clientes/${id}\`)`
- [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts` hook with `useMutation`
- [ ] Add `TrashIcon` "Eliminar" button with `data-testid="eliminar-cliente-button"` in `ClienteDetailView.tsx` header
- [ ] Add `AlertDialog` from siesa-ui-kit with title "¿Eliminar este cliente?" and subtitle "Esta acción no se puede deshacer."
- [ ] Add `data-testid="confirmar-eliminacion-button"` to the "Confirmar" action button inside the dialog
- [ ] Add `data-testid="cancelar-eliminacion-button"` to the "Cancelar" button inside the dialog
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC1"`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC2 — Successful deletion removes client from list and navigates

**Tasks to make these tests pass:**

- [ ] Wire `mutate(cliente.id)` call to the "Confirmar" button in `ClienteDetailView.tsx`
- [ ] Implement `onSuccess` in `useDeleteCliente`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` and `queryClient.invalidateQueries({ queryKey: ['contactos'] })`
- [ ] Add `onSuccess` navigation: call `navigate({ to: '/clientes' })` using TanStack Router `useNavigate`
- [ ] Implement generic success toast: `toast.success('Cliente eliminado correctamente')`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs` (injects `IClienteRepository`, calls `GetByIdAsync` then `DeleteAsync` + `SaveChangesAsync`)
- [ ] Add `Task DeleteAsync(ClienteEntity entity, CancellationToken ct)` to `IClienteRepository.cs`
- [ ] Implement `DeleteAsync` in `ClienteRepository.cs` using `_context.Clientes.Remove(entity)`
- [ ] Add `app.MapDelete("/api/v1/clientes/{id:guid}", ...)` endpoint in `ClienteEndpoints.cs`
- [ ] Register `DeleteClienteCommandHandler` in `Program.cs` DI
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC2"`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/delete-client.api.spec.ts --grep "204"`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test Group: AC3 — "Cancelar" closes dialog without side effects

**Tasks to make these tests pass:**

- [ ] Wire `onOpenChange` handler on `AlertDialog` to close dialog when user clicks "Cancelar"
- [ ] Ensure no mutation is triggered when dialog closes without "Confirmar" click
- [ ] Verify client detail remains visible (no navigation) after cancel
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC3"`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 0.5 hours (dialog close is built into AlertDialog)

---

### Test Group: AC4 — Contacts-aware toast and ON DELETE SET NULL

**Tasks to make these tests pass:**

- [ ] In `ClienteDetailView.tsx`, retrieve contacts from TanStack Query cache: `const { data: contactos } = useQuery({ queryKey: ['contactos', { clienteId: cliente.id }] })`
- [ ] Derive `hasContacts` flag: `const hasContacts = (contactos?.length ?? 0) > 0`
- [ ] Pass `hasContacts` to mutation: `mutate({ id: cliente.id, hasContacts })`
- [ ] In `useDeleteCliente.ts`, update `onSuccess` to conditionally show toast based on `hasContacts` variable
- [ ] Show `toast.success('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')` when `hasContacts === true`
- [ ] Show `toast.success('Cliente eliminado correctamente')` when `hasContacts === false`
- [ ] Verify `ON DELETE SET NULL` FK constraint is present in `ContactoConfiguration.cs` (Story 1.3 baseline)
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC4"`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/delete-client.api.spec.ts --grep "SET NULL"`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group: AC5 — In-flight loading state

**Tasks to make these tests pass:**

- [ ] Export `isPending` from `useDeleteCliente` hook
- [ ] Pass `disabled={isPending}` to `data-testid="confirmar-eliminacion-button"` in the dialog
- [ ] Show `{isPending ? 'Eliminando...' : 'Confirmar'}` as button text
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC5"`
- [ ] ✅ AC5 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC6 — Error handling without technical details

**Tasks to make these tests pass:**

- [ ] Implement `onError` in `useDeleteCliente`: `toast.error('No se pudo eliminar. Intenta de nuevo.')`
- [ ] Ensure `ExceptionHandlingMiddleware` handles all non-404 errors and returns Problem Details RFC 7807 (middleware already exists; verify it covers DELETE endpoint)
- [ ] Verify no `StackTrace`, stack frames, or raw exception messages are returned in any error response
- [ ] Run test: `pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC6"`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/delete-client.api.spec.ts --grep "stack trace"`
- [ ] ✅ AC6 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E failing tests for story 2.5
pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts

# Run all API failing tests for story 2.5
pnpm exec playwright test e2e/tests/api/delete-client.api.spec.ts

# Run all story 2.5 tests (E2E + API)
pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts e2e/tests/api/delete-client.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --debug

# Run specific AC group
pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC1"
pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts --grep "AC2"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (RED)
- Data factories reused (no new files needed — `cliente.factory.ts` covers all scenarios)
- Network-first intercept pattern applied throughout (intercept BEFORE navigation)
- Mock requirements documented (DELETE endpoint + contacts endpoint)
- `data-testid` requirements listed for all interactive elements
- Implementation checklist created per AC group

**Verification:**

- All tests run and fail as expected (endpoint returns 404 or element not found)
- Failures are due to missing implementation, NOT test bugs
- Tests fail with clear error messages: `Locator not found`, `Expected 204 but received 404`

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one AC group from the implementation checklist (start with AC1 — UI scaffolding)
2. Read the failing tests to understand the expected behavior
3. Implement minimal code to make that group of tests pass
4. Run the tests: `pnpm exec playwright test ... --grep "AC1"`
5. Check off tasks in the implementation checklist
6. Move to the next AC group and repeat

**Recommended order:**
1. AC1 — Add "Eliminar" button + AlertDialog UI (frontend only, no backend needed)
2. AC5 — Wire `isPending` state to button (requires `useDeleteCliente` hook stub)
3. AC3 — Wire "Cancelar" to close dialog (frontend dialog state)
4. AC2 (Backend) — Add `DELETE /api/v1/clientes/{id}` endpoint + handler
5. AC2 (Frontend) — Wire mutation, `invalidateQueries`, and navigation
6. AC4 — Add `hasContacts` detection and conditional toast
7. AC6 — Verify error toast and no stack traces

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 32 tests pass (20 E2E + 12 API)
2. Extract shared AlertDialog delete pattern if reused in other entities (Contacts, etc.)
3. Ensure `useDeleteCliente` is fully typed (no `any`)
4. Run full test suite: `pnpm exec playwright test`
5. Ensure tests still pass after refactoring

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts e2e/tests/api/delete-client.api.spec.ts`
3. Begin implementation from AC1 (UI scaffolding — fastest path to first green tests)
4. Work one AC group at a time (red → green for each group)
5. When all tests pass, refactor and mark story status as `done`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception pattern: intercept `page.route()` BEFORE `page.goto()` in all E2E tests to prevent race conditions
- **data-factories.md** — Reused `createClienteDto()` and `createClientePayload()` from existing `cliente.factory.ts`; factory supports overrides for specific test scenarios
- **fixture-architecture.md** — Reused `base.fixture.ts` for `clientesPage`; delete tests use `{ page }` directly for specific URL navigation
- **test-quality.md** — One assertion per test (atomic tests); Given-When-Then comments; no `setTimeout` for waits; `expect.poll()` for async state
- **timing-debugging.md** — Used `expect.poll()` for async `deleteCalled` flag checks; used `mutationHeld` Promise for in-flight state testing (AC5)
- **selector-resilience.md** — `data-testid` selectors used throughout; `page.getByTestId()` API; no CSS selectors
- **test-levels-framework.md** — AC1/AC2/AC3/AC4/AC5/AC6 split across E2E (user journey) and API (backend contract) levels; no component tests (covered by existing Vitest suite)

---

## Test Execution Evidence

### RED Phase Verification

**Command:** `pnpm exec playwright test e2e/tests/clientes/delete-client.spec.ts e2e/tests/api/delete-client.api.spec.ts`

**Expected Failure Messages (E2E):**
- AC1 tests: `Error: page.getByTestId('eliminar-cliente-button'): locator not found`
- AC2 tests: `Expected: "true" / Received: "false"` (deleteCalled not set)
- AC3 tests: `Error: page.getByTestId('cancelar-eliminacion-button'): locator not found`
- AC4 tests: `Expected: visible / Received: not visible` (toast text not found)
- AC5 tests: `Error: page.getByTestId('confirmar-eliminacion-button'): locator not found`
- AC6 tests: `Expected: visible / Received: not visible` (error toast not found)

**Expected Failure Messages (API):**
- 204 tests: `Expected: 204 / Received: 404` (endpoint not registered)
- 404 tests: `Expected: 404 / Received: 404` — NOTE: These may appear GREEN if the API returns 404 for any unknown route. Verify against actual test run.
- AC4 ON DELETE SET NULL tests: `Expected: 201 / Received: 404` (POST /contactos also needs endpoint; or test skips if contactos endpoint exists)

**Summary:**
- E2E tests: 20 tests — all expected to FAIL (RED)
- API tests: 12 tests — all expected to FAIL (RED) until `DELETE /api/v1/clientes/{id}` is implemented
- Status: RED phase — ready for DEV implementation

---

## Notes

- Story 2.5 is full-stack: frontend `AlertDialog` + navigation + backend `DELETE` endpoint + EF Core handler. Both sides must be implemented for all tests to go green.
- The `ON DELETE SET NULL` FK constraint was established in Story 1.3 (Foundation). Verify its presence in `ContactoConfiguration.cs` before the AC4 integration test can pass.
- API tests for AC4 (ON DELETE SET NULL) require the `POST /api/v1/contactos` endpoint (Story 3.x — Contacts management) to be available. If it is not yet implemented, these 2 tests will fail for a different reason. Mark them as blocked by Contact Management epic if needed.
- The `ExceptionHandlingMiddleware` already exists and handles `NotFoundException → 404`. The DELETE endpoint just needs to dispatch the `DeleteClienteCommand` and rely on the existing middleware — no custom error handling needed in the endpoint itself.
- `tea_use_playwright_utils: false` — no playwright-utils package integration applied.

---

**Generated by BMad TEA Agent** - 2026-06-24
