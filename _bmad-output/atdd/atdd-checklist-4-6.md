# ATDD Checklist - Epic 4, Story 4.6: Reassign Contact to Different Client

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** E2E

---

## Story Summary

A commercial team member needs to reassign an already-associated contact from its current client to a different client (correcting bad associations or reflecting organizational changes). The `ContactoDetailPanel` exposes a "Reasignar" button that opens a `ReassignClienteDialog` listing all clients (excluding the currently assigned one). Confirming the selection calls `PUT /api/v1/contactos/{id}/cliente` with the new `clienteId`, invalidates all impacted TanStack Query keys (`['contactos']`, both old/new `['contactos', { clienteId }]`, and `['contactos', contactoId]`), and shows a success toast — without any page reload (FR27).

**As a** commercial team member
**I want** to reassign a contact from one client to a different client
**So that** I can correct associations or reflect organizational changes

---

## Acceptance Criteria

1. **AC1 (FR26):** Given the user is viewing a contact detail that is associated with a client, When the user clicks the "Reasignar" button in `ContactoDetailPanel`, Then a dialog opens showing a selector with all available clients to choose from.

2. **AC2 (FR26, FR27):** Given the user selects a different client in the selector and confirms, When the reassignment is saved, Then `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: newClienteId }` **And** queryKeys `['contactos']`, `['contactos', { clienteId: oldId }]` and `['contactos', { clienteId: newId }]` are all invalidated **And** a toast shows "Contacto reasignado correctamente".

3. **AC3 (FR26, FR27):** Given the reassignment succeeds, When the user navigates to the new client's detail, Then the contact appears in the new client's ContactManager **And** it is no longer present in the previous client's ContactManager.

4. **AC4:** Given the user opens the reassignment dialog, When the user clicks "Cancelar" or closes the dialog without confirming, Then the contact's client association remains unchanged.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `e2e/tests/asociacion/asociacion-reasignacion.spec.ts`

- **Test:** `E2E-AC-20 — Botón "Reasignar" abre diálogo con la lista de clientes disponibles`
  - **Priority:** P0 · AC1
  - **Status:** RED — `data-testid="btn-reasignar"` does not exist in `ContactoDetailPanel`; the `ReassignClienteDialog` component is not implemented; `data-testid="reassign-cliente-dialog"` and `data-testid="cliente-option"` will not be found.
  - **Verifies:** "Reasignar" button is visible only when contact has an assigned client, opens dialog rendering the dialog title "Reasignar contacto" (Spanish), lists all available clients excluding the currently assigned one.

- **Test:** `E2E-AC-21 — Confirmar reasignación remueve el contacto del cliente A y lo agrega al cliente B`
  - **Priority:** P0 · AC2, AC3
  - **Status:** RED — confirmation button doesn't exist; dialog never closes; `clienteAsociadoLink` text won't update because mutation hook `useReassignContacto` is missing; cache invalidation across `['contactos', { clienteId: oldId }]` / `['contactos', { clienteId: newId }]` will not occur.
  - **Verifies:** End-to-end reassignment flow including immediate cross-client visibility updates (no page reload, FR27).

- **Test:** `E2E-AC-22 — Reasignación llama PUT /cliente una vez y no recarga la página`
  - **Priority:** P0 · AC2
  - **Status:** RED — PUT request will never fire because the dialog is not implemented; reload counter assertions will not be exercised; immediate visibility from cache invalidation cannot be verified without the hook.
  - **Verifies:** Exactly one `PUT /api/v1/contactos/:id/cliente` call; no `page.reload()` triggered; FR27 immediate visibility.

- **Test:** `E2E-AC-23 — Toast "Contacto reasignado correctamente" aparece tras reasignar`
  - **Priority:** P1 · AC2
  - **Status:** RED — `toast.success('Contacto reasignado correctamente')` is invoked only by the missing `useReassignContacto` hook; `getByText(/contacto reasignado correctamente/i)` will time out.
  - **Verifies:** Spanish success toast contract (company UI standard).

- **Test:** `E2E-AC-24 — Cancelar la reasignación deja al contacto asociado al cliente original`
  - **Priority:** P1 · AC4
  - **Status:** RED — `data-testid="btn-cancelar-reasignar"` not present; cancel handler does not exist; verification that `clienteAsociadoLink` keeps client A's name will fail because the dialog cannot open.
  - **Verifies:** Cancelling preserves association — no PUT call, no UI change, server state unchanged.

### API Tests (1 test)

**File:** `e2e/tests/asociacion/asociacion-api.spec.ts` (Story 4.6 block appended)

- **Test:** `API-AC-05 — PUT /cliente reasigna el contacto a un cliente distinto y persiste el cambio`
  - **Priority:** P0 · AC2 · FR26
  - **Status:** RED — Reassignment is a backend pass-through onto the existing endpoint (no new endpoint required). Tests will go GREEN once the existing `AssignClienteToContactoCommandHandler` is verified to accept reassignment payloads in the running environment.
  - **Verifies:** `PUT /api/v1/contactos/{id}/cliente` with a different valid `clienteId` returns 200 with the new `clienteId`; subsequent `GET /api/v1/contactos/{id}` confirms persistence.

### Component / Unit Tests (4 tests)

**File:** `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.test.ts`

- **Test:** `UNIT-AC-06 — mutationFn calls contactoApiRepository.assignCliente with correct contactoId and newClienteId`
  - **Priority:** P1 · AC2
  - **Status:** RED — Import of `useReassignContacto` from `../application/useReassignContacto` will fail (module does not exist).
  - **Verifies:** Mutation function wires the correct arguments to the repository (no closure leaks of `clienteId`).

- **Test:** `UNIT-AC-07 — onSuccess invalidates [contactos], [contactos, {clienteId: oldId}] and [contactos, {clienteId: newId}]`
  - **Priority:** P1 · AC2
  - **Status:** RED — Hook not implemented; spy on `invalidateQueries` will record zero calls.
  - **Verifies:** All three required query keys are invalidated (mitigates Risk R1 — dual cache invalidation, and Risk R5 — stale cache after reassign).

- **Test:** `UNIT-AC-08 — onSuccess calls toast.success("Contacto reasignado correctamente")`
  - **Priority:** P1 · AC2
  - **Status:** RED — Toast mock will register zero invocations.
  - **Verifies:** Spanish toast contract (company standard, prevents English regressions).

- **Test:** `UNIT-AC-09 — when oldClienteId is null, ["contactos", {clienteId: null}] key is NOT invalidated`
  - **Priority:** P1 · AC2
  - **Status:** RED — Hook absent; assertion that null-keyed query is skipped cannot be exercised.
  - **Verifies:** No-op branch when oldClienteId is null (prevents accidental noop invalidations and reflects the conditional `if (oldClienteId)` in the spec).

---

## Data Factories Used

### buildCliente (existing — `e2e/helpers/data.helper.ts`)

**Exports:** `buildCliente(overrides?)` — generates unique client payload with `nombre`, `nit`, `telefono`, `ciudad`.

### buildContacto (existing — `e2e/helpers/data.helper.ts`)

**Exports:** `buildContacto(overrides?)` — generates unique contact payload; accepts `clienteId` override for pre-association.

---

## Fixtures / Helpers Used

### ApiHelper (existing — `e2e/helpers/api.helper.ts`)

- `createCliente(data)` — POST `/api/v1/clientes`; returns created client with `id`
- `createContacto(data)` — POST `/api/v1/contactos`; accepts `clienteId` for pre-association
- `deleteContacto(id)` — DELETE `/api/v1/contactos/:id` (cleanup in `afterEach`)
- `deleteCliente(id)` — DELETE `/api/v1/clientes/:id` (cleanup in `afterEach`)

**Auto-cleanup:** `afterEach` iterates `createdContactoIds` and `createdClienteIds` arrays, deleting contacts before clients to respect FK constraints.

### ContactosPage POM (updated — `e2e/pages/contactos.page.ts`)

Reassignment-specific locators added:

- `btnReasignar` → `page.getByTestId('btn-reasignar')`
- `reassignClienteDialog` → `page.getByTestId('reassign-cliente-dialog')`
- `clienteOptions` → `page.getByTestId('cliente-option')`
- `btnConfirmarReasignar` → `page.getByTestId('btn-confirmar-reasignar')`
- `btnCancelarReasignar` → `page.getByTestId('btn-cancelar-reasignar')`

---

## Mock Requirements

### Network Interception (network-first pattern — pass-through)

All E2E tests register `page.route(...)` handlers **before** `page.goto(...)` to guarantee deterministic capture of every request. Tests do not stub responses — they `route.continue()` against the live dev backend.

```
Route 1: **/api/v1/contactos/{contactoId}/cliente → route.continue()  (PUT counter)
Route 2: **/api/v1/clientes                       → route.continue()  (dialog client list)
Route 3: **/api/v1/contactos**                     → route.continue()  (cache refetches)
```

### Frontend Unit-Test Mocks

- `../infrastructure/contactoApiRepository` — `assignCliente: vi.fn()`
- `../../../../shared/lib/toastStore` — `toast.success / error / info: vi.fn()`

Mocks are reset with `vi.clearAllMocks()` in `beforeEach`.

---

## Required data-testid Attributes

### ContactoDetailPanel

- `btn-reasignar` — "Reasignar" button visible only when `data.clienteId !== null`
  - Must also expose `aria-label="Reasignar contacto a otro cliente"` for WCAG 2.1 AA

### ReassignClienteDialog (NEW component)

- `reassign-cliente-dialog` — `DialogContent` root (shadcn/ui Dialog)
- `cliente-option` — each selectable client item in the dialog (button or list item)
  - Container element must expose `aria-label="Seleccionar nuevo cliente"`
- `btn-confirmar-reasignar` — "Confirmar" button (disabled when no client selected)
- `btn-cancelar-reasignar` — "Cancelar" button (closes dialog without mutation)

**Implementation Example:**

```tsx
<button data-testid="btn-reasignar" aria-label="Reasignar contacto a otro cliente">
  Reasignar
</button>

<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
  <DialogContent data-testid="reassign-cliente-dialog">
    <DialogTitle>Reasignar contacto</DialogTitle>
    <div aria-label="Seleccionar nuevo cliente">
      {availableClientes.map(cliente => (
        <button key={cliente.id} data-testid="cliente-option" ...>
          {cliente.nombre}
        </button>
      ))}
    </div>
    <button data-testid="btn-cancelar-reasignar" onClick={onClose}>Cancelar</button>
    <button data-testid="btn-confirmar-reasignar" disabled={...}>Confirmar</button>
  </DialogContent>
</Dialog>
```

---

## Implementation Checklist

### Test: E2E-AC-20 — Reasignar button opens dialog

**File:** `e2e/tests/asociacion/asociacion-reasignacion.spec.ts`

**Tasks to make this test pass:**

- [ ] Update `ContactoDetailPanel.tsx`: add local `isReassignOpen` state and conditionally rendered "Reasignar" button when `data.clienteId !== null`
- [ ] Implement `ReassignClienteDialog.tsx` using shadcn/ui `Dialog`, with `useClientes()` to source options
- [ ] Filter out `currentClienteId` from the displayed client options
- [ ] Add required data-testid: `btn-reasignar`, `reassign-cliente-dialog`, `cliente-option`
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-reasignacion.spec.ts -g "E2E-AC-20"`
- [ ] Test passes (green phase)

### Test: E2E-AC-21 — Confirming reassignment swaps contact between clients

**Tasks to make this test pass:**

- [ ] Implement `useReassignContacto.ts` mutation hook (see signature in story Dev Notes)
- [ ] Wire `ReassignClienteDialog` confirm action to `reassignMutation.mutate(selectedClienteId)`
- [ ] Ensure `onSuccess` invalidates `['contactos']`, both `['contactos', { clienteId }]` keys and `['contactos', contactoId]`
- [ ] Verify `clienteAsociadoLink` in `ContactoDetailPanel` reflects new client name without reload (relies on `['contactos', contactoId]` invalidation)
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-reasignacion.spec.ts -g "E2E-AC-21"`
- [ ] Test passes (green phase)

### Test: E2E-AC-22 — Exactly one PUT call, no reload

**Tasks to make this test pass:**

- [ ] No additional implementation beyond E2E-AC-20 / E2E-AC-21
- [ ] Verify no `window.location.reload()` or `navigate(0)` is used in reassignment flow
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-reasignacion.spec.ts -g "E2E-AC-22"`
- [ ] Test passes (green phase)

### Test: E2E-AC-23 — Spanish success toast

**Tasks to make this test pass:**

- [ ] In `useReassignContacto.onSuccess`, call `toast.success('Contacto reasignado correctamente')`
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-reasignacion.spec.ts -g "E2E-AC-23"`
- [ ] Test passes (green phase)

### Test: E2E-AC-24 — Cancel preserves association

**Tasks to make this test pass:**

- [ ] Implement `btn-cancelar-reasignar` button calling `onClose()` without invoking the mutation
- [ ] Ensure clicking the dialog backdrop or pressing Esc also closes without mutating
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-reasignacion.spec.ts -g "E2E-AC-24"`
- [ ] Test passes (green phase)

### Test: API-AC-05 — PUT /cliente reassigns and persists

**File:** `e2e/tests/asociacion/asociacion-api.spec.ts` (Story 4.6 describe block)

**Tasks to make this test pass:**

- [ ] No backend change required — verify `AssignClienteToContactoCommandHandler` handles reassignment payload as a regular UPDATE (it should, per Story 4.2)
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-api.spec.ts -g "API-AC-05"`
- [ ] Test passes (green phase)

### Test: UNIT-AC-06 — mutationFn wiring

**File:** `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.test.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/application/useReassignContacto.ts` with signature `useReassignContacto(contactoId, oldClienteId)`
- [ ] `mutationFn: (newClienteId: string) => contactoApiRepository.assignCliente(contactoId, newClienteId)`
- [ ] Run test: `pnpm --filter frontend test useReassignContacto`
- [ ] Test passes (green phase)

### Test: UNIT-AC-07 — Triple cache invalidation

**Tasks to make this test pass:**

- [ ] In `onSuccess`, invalidate `['contactos']`, `['contactos', { clienteId: oldClienteId }]` (only when non-null), `['contactos', { clienteId: newClienteId }]`, and `['contactos', contactoId]`
- [ ] Run test: `pnpm --filter frontend test useReassignContacto`
- [ ] Test passes (green phase)

### Test: UNIT-AC-08 — Spanish toast on success

**Tasks to make this test pass:**

- [ ] In `onSuccess`, call `toast.success('Contacto reasignado correctamente')`
- [ ] Run test: `pnpm --filter frontend test useReassignContacto`
- [ ] Test passes (green phase)

### Test: UNIT-AC-09 — Null oldClienteId branch

**Tasks to make this test pass:**

- [ ] Wrap `queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: oldClienteId }] })` with `if (oldClienteId)` guard
- [ ] Run test: `pnpm --filter frontend test useReassignContacto`
- [ ] Test passes (green phase)

---

## Running Tests

```bash
# Run all Story 4.6 E2E tests
npx playwright test e2e/tests/asociacion/asociacion-reasignacion.spec.ts

# Run API integration test
npx playwright test e2e/tests/asociacion/asociacion-api.spec.ts -g "API-AC-05"

# Run unit tests for useReassignContacto
pnpm --filter frontend test useReassignContacto

# Run all e2e in headed mode (debug UI)
npx playwright test e2e/tests/asociacion/asociacion-reasignacion.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/asociacion/asociacion-reasignacion.spec.ts -g "E2E-AC-21" --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 10 tests written and failing
- POM updated with reassignment locators
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:** Tests fail because:
- `ReassignClienteDialog` component does not exist
- `useReassignContacto` hook does not exist
- `data-testid="btn-reasignar"` is not yet rendered in `ContactoDetailPanel`

### GREEN Phase (DEV Team — Next Steps)

1. Implement `useReassignContacto` mutation hook
2. Implement `ReassignClienteDialog` component
3. Update `ContactoDetailPanel` to render the "Reasignar" button and dialog
4. Run failing tests one at a time — minimal implementation to make each pass
5. Move down the implementation checklist sequentially

### REFACTOR Phase (DEV Team — After All Green)

1. Confirm all 10 tests pass locally
2. Verify no `page.reload()` / `window.location.reload()` anywhere in the reassignment flow
3. Confirm no English text leaked into UI (Spanish-only company standard)
4. Verify `aria-label`s present on `btn-reasignar` and on the client selection container
5. Run lint + typecheck before opening PR

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `ApiHelper` reuse with explicit `afterEach` cleanup arrays
- **data-factories.md** — `buildCliente` / `buildContacto` from `e2e/helpers/data.helper.ts`
- **network-first.md** — All E2E tests register `page.route(...)` before `page.goto(...)`
- **selector-resilience.md** — Exclusive use of `data-testid` selectors for new elements
- **timing-debugging.md** — Explicit waits via `expect(...).toBeVisible()` / `toBeHidden()`; no hard waits
- **test-quality.md** — Given-When-Then comments; deterministic test data via factory helpers; cleanup in `afterEach`

---

## Notes

- **No backend changes required** — `PUT /api/v1/contactos/{id}/cliente` already supports arbitrary `clienteId` values (established in Story 4.2).
- **Cache invalidation is the critical risk** (Risk R1 + R5 in test-design-epic-4.md) — both `oldClienteId` and `newClienteId` query keys MUST be invalidated to prevent stale ContactManager data on both client detail views.
- **Recording mode not used** — story has clear acceptance criteria; AI generation mode is appropriate (default).
- The "Reasignar" button is only rendered when `data.clienteId !== null`. The unit-test for the `null` branch (UNIT-AC-09) covers the safeguard against accidentally invalidating `['contactos', { clienteId: null }]`.

---

**Generated by BMad TEA Agent** — 2026-05-21
