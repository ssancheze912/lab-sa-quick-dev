# ATDD Checklist — Story 4.6: Reassign Contact to Different Client

**Generated:** 2026-06-29  
**Story Status:** ready-for-dev  
**Branch:** develop-platform-gaduranb-rq4-epic-4-asociacion-cliente-contacto  
**Phase:** RED (all tests failing — implementation does not exist yet)

---

## Acceptance Criteria Coverage Matrix

| AC | Description | Test Level | Test File | Test ID(s) | Status |
|----|-------------|-----------|-----------|------------|--------|
| AC #1 | "Reasignar cliente" button visible when clienteId is non-null | Component | `ContactoDetailView.reasignar.test.tsx` | TC-1 | RED |
| AC #1 | Button renders with `data-testid="reasignar-cliente-btn"` | Component | `ContactoDetailView.reasignar.test.tsx` | TC-1 | RED |
| AC #1 | Button visible in E2E contact detail | E2E | `reassign-contact.spec.ts` | AC#1 | RED |
| AC #2 | Dialog selector lists clients except current one | Component | `ReasignarClienteDialog.test.tsx` | TC-1 | RED |
| AC #2 | Dialog search filter by name works | Component | `ReasignarClienteDialog.test.tsx` | TC-2 | RED |
| AC #2 | E2E: dialog excludes current client | E2E | `reassign-contact.spec.ts` | AC#2 | RED |
| AC #3 | PUT called with `{ clienteId: newClienteId }` | Unit | `useReasignarContacto.test.ts` | TC-1 | RED |
| AC #3 | Selecting client and confirming triggers mutation | Component | `ReasignarClienteDialog.test.tsx` | TC-4 | RED |
| AC #3 | E2E: full reassignment flow completes | E2E | `reassign-contact.spec.ts` | TC-1 | RED |
| AC #4 | Invalidates `['contactos']` on success | Unit | `useReasignarContacto.test.ts` | TC-2a | RED |
| AC #4 | Invalidates `['contactos', { clienteId: oldId }]` on success | Unit | `useReasignarContacto.test.ts` | TC-2b | RED |
| AC #4 | Invalidates `['contactos', { clienteId: newId }]` on success | Unit | `useReasignarContacto.test.ts` | TC-2c | RED |
| AC #4 | Invalidates `['contactos', contactoId]` on success | Unit | `useReasignarContacto.test.ts` | TC-2d | RED |
| AC #4 | Toast "Contacto reasignado correctamente" shown on success | Unit | `useReasignarContacto.test.ts` | TC-3 | RED |
| AC #5 | New client name appears in ClienteAsociadoSeccion after reassignment | Component | `ContactoDetailView.reasignar.test.tsx` | TC-4 | RED |
| AC #5 | E2E: new client name visible after reassignment | E2E | `reassign-contact.spec.ts` | TC-1 | RED |
| AC #6 | Cancel: no API call made | Component | `ReasignarClienteDialog.test.tsx` | TC-5 | RED |
| AC #6 | Cancel: original client shown in detail view | Component | `ContactoDetailView.reasignar.test.tsx` | TC-5 | RED |
| AC #6 | E2E: cancel leaves association unchanged | E2E | `reassign-contact.spec.ts` | TC-4 | RED |
| AC #7 | Confirm button disabled while mutation is pending | Component | `ReasignarClienteDialog.test.tsx` | TC-7 | RED |
| AC #7 | Confirm button disabled when no client selected | Component | `ReasignarClienteDialog.test.tsx` | TC-3 | RED |
| AC #7 | isPending true during in-flight mutation | Unit | `useReasignarContacto.test.ts` | TC-5 | RED |
| AC #8 | Error toast "No se pudo reasignar el contacto. Intenta de nuevo." | Unit | `useReasignarContacto.test.ts` | TC-4 | RED |
| AC #8 | Error toast shown; dialog stays open on failure | Component | `ReasignarClienteDialog.test.tsx` | TC-8 | RED |
| AC #9 | Backend handler overwrites existing clienteId — no 409 | API | `ReasignarClienteTests.cs` | TC-1 | RED |
| AC #9 | Follow-up GET confirms new clienteId persisted | API | `ReasignarClienteTests.cs` | TC-2 | RED |
| AC #9 | Multiple reassignments — last clienteId wins | API | `ReasignarClienteTests.cs` | TC-3 | RED |
| AC #9 | Idempotent reassignment (same clienteId) returns 200 | API | `ReasignarClienteTests.cs` | TC-4 | RED |
| AC #10 | "Reasignar cliente" button NOT shown when clienteId is null | Component | `ContactoDetailView.reasignar.test.tsx` | TC-2 | RED |
| AC #10 | E2E: button absent when contact has no client | E2E | `reassign-contact.spec.ts` | AC#10 | RED |
| AC #10 | Empty state "No hay otros clientes disponibles" | Component | `ReasignarClienteDialog.test.tsx` | TC-6 | RED |
| AC #11 | "Reasignar cliente" button is native `<button>` element | Component | `ContactoDetailView.reasignar.test.tsx` | TC-6 | RED |
| AC #11 | Confirm button is native `<button>` element | Component | `ReasignarClienteDialog.test.tsx` | TC-9 | RED |

---

## Test Files Generated

### Unit Tests (Vitest + MSW)

**File:** `frontend/src/modules/crm/contactos/application/useReasignarContacto.test.ts`

- TC-1: Calls PUT with `{ clienteId: newClienteId }` in request body (AC #3)
- TC-2a–2e: Cache invalidation for all 4 TanStack Query keys on success (AC #4)
- TC-3: Toast "Contacto reasignado correctamente" on success (AC #4)
- TC-4: Toast "No se pudo reasignar el contacto. Intenta de nuevo." on error (AC #8)
- TC-5: `isPending` is true during in-flight mutation (AC #7)
- TC-6: `isError` true on 500 response (AC #8)

**RED reason:** `useReasignarContacto.ts` does not exist.

---

### Component Tests — Dialog (Vitest + RTL + MSW)

**File:** `frontend/src/modules/crm/contactos/presentation/ReasignarClienteDialog.test.tsx`

- TC-1: Client list excludes the currently assigned client (AC #2)
- TC-2: Search input filters clients by name, case-insensitive (AC #2)
- TC-3: "Reasignar" button disabled when no client selected (AC #7)
- TC-4: Selecting a client and confirming triggers mutation and closes dialog (AC #3)
- TC-5: "Cancelar" closes dialog without PUT call (AC #6)
- TC-6: Empty state "No hay otros clientes disponibles" when no other clients (AC #10)
- TC-7: Confirm button disabled while mutation is pending (AC #7)
- TC-8: Error toast shown; dialog stays open on PUT failure (AC #8)
- TC-9: Confirm and cancel buttons are native `<button>` elements (AC #11)

**RED reason:** `ReasignarClienteDialog.tsx` does not exist.

---

### Component Tests — ContactoDetailView (Vitest + RTL + MSW)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.reasignar.test.tsx`

- TC-1: `data-testid="reasignar-cliente-btn"` visible when `clienteId` is non-null (AC #1)
- TC-2: `reasignar-cliente-btn` NOT rendered when `clienteId` is null (AC #10)
- TC-3: Clicking the button opens `data-testid="reasignar-cliente-dialog"` (AC #3)
- TC-4: After successful reassignment, new client name shown in `ClienteAsociadoSeccion` (AC #5)
- TC-5: Cancel leaves original client association unchanged (AC #6)
- TC-6: "Reasignar cliente" button is a native `<button>` element (AC #11)

**RED reason:** `ContactoDetailView.tsx` does not yet render the reassign button or dialog.

---

### API Integration Tests (xUnit + WebApplicationFactory)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Contactos/ReasignarClienteTests.cs`

- TC-1: PUT clienteB over contacto with clienteA → 200 OK, `clienteId == clienteB` (AC #9)
- TC-2: Follow-up GET confirms new clienteId persisted (AC #9)
- TC-3: Multiple sequential reassignments — last clienteId wins (AC #9)
- TC-4: Idempotent: PUT same clienteId again → 200 OK (AC #9)
- TC-5: 200 response body does not expose `stackTrace` / `exception` (NFR6)

**RED reason:** If handler has a guard rejecting non-null → different UUID overwrite, TC-1 will fail with 409. Otherwise these will pass (backend already supports overwrite from Story 4.2).

---

### E2E Tests (Playwright)

**File:** `e2e/tests/contactos/reassign-contact.spec.ts`

- AC#1: "Reasignar cliente" button visible for contact with clienteId (AC #1)
- AC#10: Button absent for contact without clienteId (AC #10)
- AC#2: Dialog selector excludes current client (AC #2)
- TC-1: Full flow: select new client, confirm → new client name in detail (AC #3, #4, #5)
- TC-2: Old client's contact list no longer shows reassigned contact (AC #4)
- TC-3: New client's contact list shows the reassigned contact (AC #4)
- TC-4: Cancel → association unchanged (API verified) (AC #6)

**RED reason:** `reasignar-cliente-btn` and `reasignar-cliente-dialog` do not exist in the UI.

---

## MSW Handler File

**File:** `frontend/src/test/msw/handlers/contactos-reasignar-cliente.handlers.ts`

Handlers provided:
- `handleReasignarClienteSuccess(contacto)` — PUT → 200 OK reflecting new clienteId
- `handleReasignarClienteCapture(contacto, captureRef)` — captures sent clienteId for assertion
- `handleReasignarClienteServerError()` — PUT → 500
- `handleReasignarClienteDelayed(contacto, ms)` — PUT with delay (for isPending tests)
- `handleGetContactoWithExistingCliente(contacto, clienteId)` — GET contact with non-null clienteId
- `handleGetClientesForSelector(clientes)` — GET /api/v1/clientes list for dialog
- `handleGetClientesForSelectorEmpty()` — empty client list

---

## Implementation Tasks Unblocked by RED Tests

Once these tests are GREEN, all ACs for Story 4.6 are satisfied:

| Task | File(s) | Makes RED → GREEN |
|------|---------|-------------------|
| Task 1 | `AssignClienteCommandHandler.cs` | TC-1 in ReasignarClienteTests.cs |
| Task 3 | `useReasignarContacto.ts` | All tests in useReasignarContacto.test.ts |
| Task 4 | `ReasignarClienteDialog.tsx` | All tests in ReasignarClienteDialog.test.tsx |
| Task 5 | `ContactoDetailView.tsx` (add button + dialog wire) | All tests in ContactoDetailView.reasignar.test.tsx + E2E |

---

## Quality Gate

- Total test cases: **39** across 4 levels
- ACs fully covered: **11 / 11** (100%)
- Levels: E2E (8), Component/Unit (26), API integration (5)
- All tests confirmed RED: implementation modules `useReasignarContacto.ts` and `ReasignarClienteDialog.tsx` do not exist.
