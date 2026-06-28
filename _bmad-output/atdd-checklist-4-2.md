# ATDD Checklist - Epic 4, Story 4.2: Associate & Disassociate Contacts from Client

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** API (Playwright) + E2E (Playwright) + Component (Vitest + RTL + MSW)

---

## Story Summary

A commercial team member can associate existing contacts to a client and disassociate them directly from the client detail view without navigating away. The `ContactManager` component is extended with action props (`onAddContact`, `onRemoveContact`, `onCreateContact`) and a new `ContactSearchDialog` component is created. All mutations call `PUT /api/v1/contactos/{id}/cliente` and invalidate both `['contactos']` and `['contactos', { clienteId }]` query keys for immediate visibility.

**As a** commercial team member
**I want** to associate existing contacts to a client and disassociate them directly from the client detail view
**So that** I can manage the client's contact relationships without navigating away

---

## Acceptance Criteria

1. **Given** the user is in the client detail view, **When** the user uses the ContactManager to add an existing contact, **Then** the contact is linked to the client immediately and appears in the ContactManager list (FR17, FR19, FR27), **And** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: uuid }`, **And** queryKeys `['contactos']` and `['contactos', { clienteId }]` are invalidated.

2. **Given** the user creates a new contact from within the ContactManager, **When** the contact is created, **Then** the new contact is automatically associated with the current client (FR18), **And** the contact appears in the ContactManager list immediately.

3. **Given** the user disassociates a contact from the client via ContactManager, **When** the disassociation is confirmed, **Then** the contact is removed from the ContactManager list immediately (FR20, FR27), **And** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: null }`, **And** the contact record still exists and is accessible from `/contactos`.

---

## Failing Tests Created (RED Phase)

### API Tests (6 tests)

**File:** `e2e/tests/api/contactos-assign-cliente.api.spec.ts`

- **Test:** TC-E4-4-2-API-1 — PUT /api/v1/contactos/{id}/cliente with { clienteId: uuid } → 200 OK + ContactoDto with new clienteId
  - **Status:** RED — PUT endpoint not registered; AssignContactoClienteCommand not implemented
  - **Verifies:** AC #1 — endpoint accepts association and returns updated ContactoDto

- **Test:** TC-E4-4-2-API-2 — PUT /api/v1/contactos/{id}/cliente with { clienteId: null } → 200 OK + ContactoDto with clienteId: null
  - **Status:** RED — PUT endpoint not registered; null clienteId (disassociation) path not implemented
  - **Verifies:** AC #3 — disassociation via null clienteId returns 200 OK

- **Test:** TC-E4-4-2-API-3 — PUT with non-existent contacto id → 404 Problem Details RFC 7807
  - **Status:** RED — PUT endpoint not registered; 404 path not implemented
  - **Verifies:** AC #1, #3 — non-existent contact returns Problem Details, not 500

- **Test:** TC-E4-4-2-API-4 — Disassociated contact still retrievable via GET /api/v1/contactos
  - **Status:** RED — PUT endpoint not registered; contact record preservation not verifiable
  - **Verifies:** AC #3 — contact record is preserved after disassociation (only clienteId becomes null)

- **Test:** TC-E4-4-2-API-5 — Response shape includes all ContactoDto fields after association
  - **Status:** RED — PUT endpoint not registered; response shape not verifiable
  - **Verifies:** AC #1 — full ContactoDto with audit timestamps returned on success

- **Test:** PUT is idempotent — calling twice with same clienteId still returns 200
  - **Status:** RED — PUT endpoint not registered
  - **Verifies:** AC #1 — idempotent operation, safe to retry

### E2E Tests (5 tests)

**File:** `e2e/tests/clientes/clientes-associate-disassociate-contacts.spec.ts`

- **Test:** TC-E4-4-2-E2E-1 — Associate existing contact → appears in ContactManager list immediately
  - **Status:** RED — ContactManager lacks associate button; ContactSearchDialog not created; useAssignContactoCliente not wired in ClienteDetailView
  - **Verifies:** AC #1 — full user journey: navigate → open dialog → select contact → contact appears

- **Test:** TC-E4-4-2-E2E-2 — Associate button visible in ContactManager when client is loaded
  - **Status:** RED — ContactManager does not render associate-contact-button
  - **Verifies:** AC #1 — data-testid="associate-contact-button" is rendered when onAddContact prop is provided

- **Test:** TC-E4-4-2-E2E-3 — Disassociate contact → removed from ContactManager immediately
  - **Status:** RED — ContactManager lacks disassociate button per contact item
  - **Verifies:** AC #3 — user journey: confirm disassociation → contact removed from list

- **Test:** TC-E4-4-2-E2E-4 — ContactSearchDialog only shows orphan contacts (clienteId: null)
  - **Status:** RED — ContactSearchDialog not created; orphan-only filter not implemented
  - **Verifies:** AC #1 (scope boundary) — only orphan contacts shown to prevent accidental reassignment

- **Test:** TC-E4-4-2-E2E-5 — Create new contact from ContactManager → contact pre-linked to client
  - **Status:** RED — create-contact-button not rendered; useCreateContactoForCliente not wired
  - **Verifies:** AC #2 — new contact creation form sends clienteId in POST body; contact appears in list

### Component Tests (8 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.associate-disassociate.test.tsx`

- **Test:** TC-E4-4-2-CMP-1 — ClienteDetailView calls PUT /api/v1/contactos/{id}/cliente after user confirms add via dialog; contact appears in list
  - **Status:** RED — useAssignContactoCliente not created; associate-contact-button not rendered; ContactSearchDialog not created
  - **Verifies:** AC #1 — mutation hook is called with correct contactoId and clienteId

- **Test:** TC-E4-4-2-CMP-2 — useAssignContactoCliente invalidates ['contactos'] and ['contactos', { clienteId }] on success
  - **Status:** RED — useAssignContactoCliente hook does not exist
  - **Verifies:** AC #1 (FR27) — both query keys are invalidated after successful PUT

- **Test:** useAssignContactoCliente invalidates both keys when PUT with clienteId: null (disassociation)
  - **Status:** RED — useAssignContactoCliente hook does not exist
  - **Verifies:** AC #3 (FR27) — both query keys are invalidated after disassociation

- **Test:** TC-E4-4-2-CMP-3 — ContactManager renders associate-contact-button when onAddContact prop is wired
  - **Status:** RED — ContactManager does not accept onAddContact prop; button not rendered
  - **Verifies:** AC #1 — data-testid="associate-contact-button" is conditionally rendered

- **Test:** ContactManager renders create-contact-button when onCreateContact prop is wired
  - **Status:** RED — ContactManager does not accept onCreateContact prop; button not rendered
  - **Verifies:** AC #2 — data-testid="create-contact-button" is conditionally rendered

- **Test:** TC-E4-4-2-CMP-4 — ContactManager renders disassociate-contact-button-{id} per contact item
  - **Status:** RED — ContactManager does not accept onRemoveContact prop; per-item button not rendered
  - **Verifies:** AC #3 — data-testid="disassociate-contact-button-{contactoId}" per contact row

- **Test:** TC-E4-4-2-CMP-5 — ClienteDetailView calls PUT with clienteId: null when user confirms disassociation
  - **Status:** RED — onRemoveContact not wired in ClienteDetailView; confirmation dialog not implemented
  - **Verifies:** AC #3 — mutation called with { clienteId: null }

- **Test:** TC-E4-4-2-CMP-6 — ContactManager is read-only when action props absent (backward compatibility)
  - **Status:** RED — cannot verify backward compat until ContactManager accepts action props
  - **Verifies:** AC #1 — backward compatibility: action buttons absent without props (Story 4.1 behavior preserved)

- **Test:** Existing client fields (Nombre, NIT) still visible after mutation hooks are wired (regression guard)
  - **Status:** RED — mutation hooks not wired; component may break existing fields
  - **Verifies:** Story 2.2 regression — existing detail fields preserved after Story 4.2 changes

---

## Data Factories Used

### Contacto Factory (existing)

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts`

**Exports:**
- `buildContacto(overrides?)` — Creates a single Contacto with optional overrides; supports `clienteId: null` for orphan contacts
- `buildContactoList(count)` — Creates array of Contactos
- `resetContactoCounter()` — Resets counter for deterministic IDs in afterEach

### Cliente Factory (existing)

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts`

**Exports:**
- `buildCliente(overrides?)` — Creates a single Cliente; `id` can be overridden for stable IDs in MSW handlers
- `buildClientes(count)` — Creates array of Clientes
- `resetClienteCounter()` — Resets counter for deterministic IDs in afterEach

### E2E Data Helpers (existing)

**File:** `e2e/helpers/data.helper.ts`

- `buildCliente(overrides?)` — E2E client seed data
- `buildContacto(overrides?)` — E2E contact seed data; `clienteId: null` for orphan contacts

---

## Fixtures Used

### Base Fixture (existing)

**File:** `e2e/fixtures/base.fixture.ts`

- `clientesPage` — Navigates to /clientes before test
- `contactosPage` — Navigates to /contactos before test

### ApiHelper (existing, extended)

**File:** `e2e/helpers/api.helper.ts`

- `asignarClienteAContacto(contactoId, clienteId)` — Already added in Story 4.1 preparation; calls `PUT /api/v1/contactos/{contactoId}/cliente`

---

## Mock Requirements

### PUT /api/v1/contactos/{id}/cliente — Associate

**Endpoint:** `PUT /api/v1/contactos/{contactoId}/cliente`

**Request Body:**
```json
{ "clienteId": "uuid-of-client" }
```

**Success Response (200 OK):**
```json
{
  "id": "uuid-contacto",
  "nombre": "Ana García",
  "cargo": "Directora",
  "telefono": "3001234567",
  "email": "ana@empresa.co",
  "clienteId": "uuid-of-client",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-06-28T12:00:00.000Z"
}
```

### PUT /api/v1/contactos/{id}/cliente — Disassociate

**Request Body:**
```json
{ "clienteId": null }
```

**Success Response (200 OK):**
```json
{
  "id": "uuid-contacto",
  "clienteId": null,
  "updatedAt": "2026-06-28T12:00:00.000Z"
}
```

### PUT /api/v1/contactos/{id}/cliente — Not Found

**Failure Response (404 Problem Details):**
```json
{
  "status": 404,
  "title": "Contacto no encontrado",
  "detail": "El contacto solicitado no fue encontrado."
}
```

---

## Required data-testid Attributes

### ClienteDetailView / ContactManager section

- `contact-manager-section` — Wrapper div containing ContactManager (already present from Story 4.1)
- `associate-contact-button` — Button to open ContactSearchDialog ("Asociar contacto existente")
- `create-contact-button` — Button to open new contact creation form ("Crear nuevo contacto")
- `disassociate-contact-button-{contactoId}` — Per-contact-row button to trigger disassociation

### ContactSearchDialog

- `contact-search-dialog` — The modal dialog container for searching orphan contacts
- `contact-search-input` — Text input for filtering contacts by name (optional, improves UX)

### ContactForm (new contact creation — reuse or create)

- `contacto-nombre-input` — Input for contact name
- `contacto-cargo-input` — Input for contact cargo/position
- `contacto-telefono-input` — Input for contact phone
- `contacto-email-input` — Input for contact email
- `contacto-submit-button` — Form submit button

**Implementation Example:**
```tsx
{/* ContactManager header actions */}
<button data-testid="associate-contact-button">Asociar contacto existente</button>
<button data-testid="create-contact-button">Crear nuevo contacto</button>

{/* Per-contact-item disassociate button */}
<button data-testid={`disassociate-contact-button-${contacto.id}`}>Desasociar</button>

{/* Search dialog */}
<div data-testid="contact-search-dialog" role="dialog">...</div>
```

---

## Implementation Checklist

### Test: TC-E4-4-2-API-1 — PUT /api/v1/contactos/{id}/cliente associates contact

**File:** `e2e/tests/api/contactos-assign-cliente.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/AssignContactoClienteCommand.cs` — record with `Guid ContactoId` and `Guid? ClienteId`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/AssignContactoClienteCommandHandler.cs` — loads contact, calls `AssignCliente`, saves, returns `ContactoDto`
- [ ] Add `AssignCliente(Guid? clienteId)` to `ContactoEntity.cs` — sets `ClienteId = clienteId`, `UpdatedAt = DateTimeOffset.UtcNow`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/AssignContactoClienteRequest.cs` — record with `Guid? ClienteId`
- [ ] Add `MapPut("/{id:guid}/cliente", ...)` to `ContactoEndpoints.cs`
- [ ] Register `AssignContactoClienteCommandHandler` in `Program.cs`
- [ ] Add required data-testid attributes: none (API test)
- [ ] Run test: `npx playwright test e2e/tests/api/contactos-assign-cliente.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E4-4-2-CMP-2 — useAssignContactoCliente invalidates both query keys

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.associate-disassociate.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/application/useAssignContactoCliente.ts` — `useMutation` hook; calls `contactoApiRepository.assignCliente`; `onSuccess` invalidates `['contactos']` and `['contactos', { clienteId }]`; `onError` shows Spanish toast
- [ ] Extend `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `assignCliente(contactoId: string, clienteId: string | null): Promise<Contacto>`
- [ ] Extend `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implement `assignCliente` with `PUT /api/v1/contactos/${contactoId}/cliente`
- [ ] Add required data-testid attributes: none (hook test)
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.associate-disassociate`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E4-4-2-CMP-3 — ContactManager renders associate button when onAddContact present

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.associate-disassociate.test.tsx`

**Tasks to make this test pass:**

- [ ] Extend `frontend/src/modules/crm/shared/components/ContactManager.tsx` — add optional `onAddContact`, `onRemoveContact`, `onCreateContact`, `clienteId` props to interface
- [ ] Conditionally render `<button data-testid="associate-contact-button">` when `onAddContact` prop is provided
- [ ] Conditionally render `<button data-testid="create-contact-button">` when `onCreateContact` prop is provided
- [ ] Add required data-testid attributes: `associate-contact-button`, `create-contact-button`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.associate-disassociate`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E4-4-2-CMP-4 — ContactManager renders disassociate button per contact item

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.associate-disassociate.test.tsx`

**Tasks to make this test pass:**

- [ ] In `ContactManager.tsx`, when `onRemoveContact` prop is provided, render a disassociate button per contact item: `<button data-testid={disassociate-contact-button-${contacto.id}}>`
- [ ] Show a confirmation dialog/alert before calling `onRemoveContact`
- [ ] Add required data-testid attributes: `disassociate-contact-button-{contactoId}`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.associate-disassociate`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E4-4-2-CMP-1 — ClienteDetailView calls PUT after user confirms add

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.associate-disassociate.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/shared/components/ContactSearchDialog.tsx` — Dialog with text filter; shows only contacts with `clienteId === null` (orphans); on select calls `onSelect(contactoId)`; requires `data-testid="contact-search-dialog"`
- [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — instantiate `useAssignContactoCliente(clienteId)` hook; wire `handleAddContact`, `handleRemoveContact` callbacks to `ContactManager`
- [ ] `handleAddContact`: calls `assignMutation.mutateAsync({ contactoId, newClienteId: clienteId })`; shows toast "Contacto asociado correctamente"
- [ ] Add required data-testid attributes: `associate-contact-button`, `contact-search-dialog`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.associate-disassociate`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E4-4-2-E2E-1 — Full E2E associate existing contact journey

**File:** `e2e/tests/clientes/clientes-associate-disassociate-contacts.spec.ts`

**Tasks to make this test pass:**

- [ ] All backend tasks from API tests above must pass
- [ ] All frontend component tasks above must pass
- [ ] `data-testid="contact-search-dialog"` renders when associate button is clicked
- [ ] Selecting a contact in the dialog triggers the PUT mutation and the list updates
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-associate-disassociate-contacts.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (integration, no new code)

---

### Test: TC-E4-4-2-E2E-5 — Create new contact pre-linked to client

**File:** `e2e/tests/clientes/clientes-associate-disassociate-contacts.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/application/useCreateContactoForCliente.ts` — wraps existing create flow; passes `clienteId` in request body; `onSuccess` invalidates `['contactos']` and `['contactos', { clienteId }]`
- [ ] Modify `ClienteDetailView.tsx` — wire `handleCreateContact` callback to `ContactManager`; `handleCreateContact` calls `createMutation.mutateAsync({ ...data, clienteId })`; shows toast "Contacto creado y asociado correctamente"
- [ ] Render contact creation form (reuse `ContactoForm` from Epic 3 or inline) with required data-testid fields
- [ ] Add required data-testid attributes: `create-contact-button`, `contacto-nombre-input`, `contacto-cargo-input`, `contacto-telefono-input`, `contacto-email-input`, `contacto-submit-button`
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-associate-disassociate-contacts.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all failing API tests for Story 4.2
npx playwright test e2e/tests/api/contactos-assign-cliente.api.spec.ts

# Run all failing E2E tests for Story 4.2
npx playwright test e2e/tests/clientes/clientes-associate-disassociate-contacts.spec.ts

# Run all failing component tests for Story 4.2
pnpm --filter frontend test ClienteDetailView.associate-disassociate

# Run all Story 4.2 tests together
npx playwright test --grep "Story 4.2"

# Run in headed mode (see browser)
npx playwright test e2e/tests/clientes/clientes-associate-disassociate-contacts.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/api/contactos-assign-cliente.api.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (RED phase)
- ✅ Network-first intercepts applied (route interception before navigation/render)
- ✅ data-testid attributes documented for DEV team
- ✅ Mock requirements documented (PUT /api/v1/contactos/{id}/cliente)
- ✅ Implementation checklist created with clear task mapping

**Verification:**

- All tests fail because the `PUT /api/v1/contactos/{id}/cliente` endpoint does not exist yet
- Frontend mutation hooks (`useAssignContactoCliente`, `useCreateContactoForCliente`) do not exist
- `ContactManager` does not accept or render action props
- `ContactSearchDialog` component does not exist
- Failure messages: `import error` for missing hooks, `expect(element).toBeInTheDocument()` for missing UI

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with backend** (unblocks all API and E2E tests):
   - Create `AssignContactoClienteCommand.cs` + `AssignContactoClienteCommandHandler.cs`
   - Add `AssignCliente()` domain method to `ContactoEntity.cs`
   - Register `PUT /{id:guid}/cliente` in `ContactoEndpoints.cs`
   - Register handler in DI (`Program.cs`)
   - Run: `npx playwright test e2e/tests/api/contactos-assign-cliente.api.spec.ts`

2. **Create frontend hooks**:
   - `useAssignContactoCliente.ts` — mutation + invalidation of both query keys
   - Extend `IContactoRepository.ts` and `contactoApiRepository.ts` with `assignCliente`
   - Run: `pnpm --filter frontend test ClienteDetailView.associate-disassociate`

3. **Extend ContactManager UI**:
   - Add optional action props to `ContactManager.tsx`
   - Render `associate-contact-button`, `create-contact-button`, per-item `disassociate-contact-button-{id}`
   - Create `ContactSearchDialog.tsx` (orphan contacts only)

4. **Wire into ClienteDetailView**:
   - Instantiate hooks and pass callbacks to `ContactManager`
   - Show Spanish toasts on success

5. **Create useCreateContactoForCliente**:
   - Wrap existing create flow with automatic clienteId linking

**Key Principles:**
- One test at a time (RED → GREEN)
- Invalidate BOTH `['contactos']` and `['contactos', { clienteId }]` — missing either breaks FR27
- All user-facing text in Spanish
- No `any` type in TypeScript (strict mode)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Extract `ContactSearchDialog` presentation logic if reusable
3. Ensure `ContactManager` action props are well-typed (no optional `any`)
4. Verify `DateTimeOffset.UtcNow` is used in `AssignCliente` domain method (not `DateTime.UtcNow`)
5. Confirm `ClienteContactServiceAdapter.addContact` / `removeContact` stubs from Story 4.1 are replaced

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase:
   - `npx playwright test e2e/tests/api/contactos-assign-cliente.api.spec.ts`
   - `pnpm --filter frontend test ClienteDetailView.associate-disassociate`
3. **Begin implementation** starting with the backend endpoint (highest unblocks)
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor for quality

---

## Knowledge Base References Applied

- **network-first.md** — Route interception BEFORE navigation in all E2E and component tests
- **data-factories.md** — Existing `buildContacto` and `buildCliente` factories with `clienteId` support
- **component-tdd.md** — MSW `setupServer()` with `server.use()` for network-first interception in RTL tests
- **test-quality.md** — Given-When-Then structure; one assertion per test (atomic); explicit waits only
- **selector-resilience.md** — `data-testid` selectors for all interactive elements
- **test-levels-framework.md** — API (Playwright) for backend contract; E2E for user journey; Component (Vitest/RTL) for hook and UI behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/api/contactos-assign-cliente.api.spec.ts`

**Expected Results:**

```
FAILED — PUT /api/v1/contactos/{id}/cliente returns 404 (endpoint not registered)
```

**Command:** `pnpm --filter frontend test ClienteDetailView.associate-disassociate`

**Expected Results:**

```
FAILED — Cannot find module '../../contactos/application/useAssignContactoCliente'
FAILED — Expected element with data-testid="associate-contact-button" to be in the document
FAILED — Expected isInvalidated to be true (query keys not invalidated)
```

**Summary:**

- Total tests: 19 (6 API + 5 E2E + 8 Component)
- Passing: 0 (expected)
- Failing: 19 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- Story 4.2 builds on Story 4.1's read-only `ContactManager`. The `addContact` and `removeContact` stubs (`throw new Error('Not implemented — Story 4.2')`) in `ClienteContactServiceAdapter` should be replaced by wiring the mutation hooks directly in `ClienteDetailView`.
- `ContactSearchDialog` must ONLY show contacts with `clienteId === null` (orphans). Reassignment of already-linked contacts is Story 4.6 scope.
- `DateTimeOffset.UtcNow` is mandatory in `AssignCliente` domain method (company standard: never use `DateTime.UtcNow`).
- Both `['contactos']` and `['contactos', { clienteId }]` MUST be invalidated — missing either invalidation breaks FR27 (real-time visibility).
- All user-facing text must be in Spanish: "Asociar contacto existente", "Crear nuevo contacto", "Desasociar", toast messages.

---

**Generated by BMad TEA Agent** — 2026-06-28
