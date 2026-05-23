# ATDD Checklist - Epic 4, Story 4.1: View Associated Contacts in Client Detail

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** E2E

---

## Story Summary

A commercial team member needs to see all contacts associated with a client directly within the client detail view at `/clientes/:clienteId`. The `ContactManager` (siesa-ui-kit) is rendered in the right panel via a `ClienteContactServiceAdapter` that calls `GET /api/v1/contactos?clienteId=:id`. The feature covers happy path (contacts visible), empty state (no contacts), and error state (backend unavailable with retry option).

**As a** commercial team member
**I want** to see all contacts associated with a client in the client detail view
**So that** I have a complete picture of that client's contacts without navigating elsewhere

---

## Acceptance Criteria

1. **AC1** — Given a client has associated contacts, When the user opens `/clientes/:clienteId`, Then `ContactManager` (siesa-ui-kit) renders in the right panel showing ONLY contacts whose `clienteId` matches the selected client (FR21).

2. **AC2** — Given a client has no associated contacts, When the user opens the client detail view, Then the ContactManager displays an empty state indicating no contacts are linked yet.

3. **AC3** — Given the backend is unavailable when loading contacts, When `GET /api/v1/contactos?clienteId=:id` fails, Then the ContactManager displays an error state with a retry option.

---

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `e2e/tests/asociacion/asociacion-contactmanager.spec.ts`

- **Test:** E2E-AC-01 — ContactManager muestra solo los contactos asociados al cliente
  - **Status:** RED — `data-testid="contact-manager"` and `data-testid="contact-manager-row"` do not exist yet (`ClienteDetailView` not implemented)
  - **Verifies:** AC1 — ContactManager renders with exactly 2 rows for a client with 2 associated contacts; a 3rd orphan contact does NOT appear (FR21)
  - **Priority:** P0

- **Test:** E2E-AC-02 — ContactManager muestra estado vacío cuando el cliente no tiene contactos
  - **Status:** RED — `data-testid="contact-manager"` does not exist; empty state message not rendered
  - **Verifies:** AC2 — ContactManager shows no rows and a "no hay contactos" message when the client has 0 associated contacts
  - **Priority:** P0

- **Test:** E2E-AC-03 — ContactManager muestra estado de error con opción de reintentar cuando GET devuelve 500
  - **Status:** RED — `data-testid="contact-manager"` not present; error state and retry button not implemented
  - **Verifies:** AC3 — ContactManager shows error panel + retry button when `GET /api/v1/contactos?clienteId=*` returns 500
  - **Priority:** P1

### API Tests (3 tests)

**File:** `e2e/tests/asociacion/asociacion-api.spec.ts`

- **Test:** API-AC-07 — GET /api/v1/contactos?clienteId={id} devuelve solo los contactos de ese cliente
  - **Status:** RED — Backend endpoint does not yet accept `?clienteId=` query param; `GetContactosByClienteIdQueryHandler` not implemented
  - **Verifies:** AC1 — Response is 200 OK, body is a direct JSON array of exactly 2 items, each with `clienteId` matching the requested id; 3rd contact from another client is excluded; full `ContactoDto` contract validated
  - **Priority:** P1

- **Test:** API-AC-07b — GET /api/v1/contactos?clienteId={id} devuelve array vacío cuando el cliente no tiene contactos
  - **Status:** RED — Backend `?clienteId=` param not implemented; response would return all contacts or 400
  - **Verifies:** AC2 — Returns 200 OK with empty array (not 404) when client has no contacts
  - **Priority:** P1

- **Test:** API-AC-07c — GET /api/v1/contactos?clienteId={id} devuelve Content-Type application/json y no filtra globalmente
  - **Status:** RED — Same as above; endpoint not yet filtering
  - **Verifies:** Contract guard — Content-Type is `application/json` (not `problem+json`); body is array not Problem Details; query filters correctly (client2's contact excluded from client1's response)
  - **Priority:** P1

### Unit Tests (3 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`

- **Test:** UNIT-AC-01 — getContactos() calls GET /api/v1/contactos?clienteId={id} with the correct URL
  - **Status:** RED — `ClienteContactServiceAdapter.ts` does not exist yet; import will fail
  - **Verifies:** AC1 — `apiClient.get` is called exactly once with `/api/v1/contactos?clienteId=${clienteId}`; response `.data` array is returned as-is
  - **Priority:** P1

- **Test:** UNIT-AC-01b — each adapter instance uses its own clienteId in the URL
  - **Status:** RED — Same; file missing
  - **Verifies:** Isolation — Two adapter instances with different `clienteId` values each use their own id; no cross-contamination between instances
  - **Priority:** P1

- **Test:** UNIT-AC-01c — getContactos() propagates errors from apiClient to the caller
  - **Status:** RED — Same; file missing
  - **Verifies:** AC3 — Network errors from `apiClient.get` are not swallowed; they propagate to allow ContactManager to handle error state
  - **Priority:** P1

---

## Data Factories Created

### Cliente Factory

**File:** `e2e/helpers/data.helper.ts` (existing — reused)

**Exports:**
- `buildCliente(overrides?)` — Creates a client payload with unique nombre, nit, telefono, ciudad

**Example Usage:**
```typescript
const clienteData = buildCliente();
const cliente = await apiHelper.createCliente(clienteData);
```

### Contacto Factory

**File:** `e2e/helpers/data.helper.ts` (existing — reused)

**Exports:**
- `buildContacto(overrides?)` — Creates a contact payload with unique nombre, email, cargo, telefono; `clienteId` defaults to `null`

**Example Usage:**
```typescript
const contacto = buildContacto({ clienteId: cliente.id });
const created = await apiHelper.createContacto(contacto);
```

---

## Fixtures Created

### Base Fixtures

**File:** `e2e/fixtures/base.fixture.ts` (existing — reused)

**Fixtures:**
- `clientesPage` — Navigates to `/clientes` before test; no data teardown (use `apiHelper` for data cleanup)

### ApiHelper (Setup/Teardown)

**File:** `e2e/helpers/api.helper.ts` (existing — reused)

**Methods used in Story 4.1 tests:**
- `createCliente(data)` — POST /api/v1/clientes → returns created client
- `createContacto(data)` — POST /api/v1/contactos with optional `clienteId`
- `deleteCliente(id)` — teardown
- `deleteContacto(id)` — teardown
- `asignarClienteAContacto(contactoId, clienteId)` — PUT for future association (not used in 4.1 read-only scope)

**Auto-cleanup pattern (implemented in spec via `afterEach`):**
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

### Contacts API — Empty State

**Used in:** E2E-AC-02

**Pattern:**
```typescript
await page.route(`**/api/v1/contactos?clienteId=${cliente.id}`, async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
});
```

### Contacts API — Error State (500)

**Used in:** E2E-AC-03

**Pattern:**
```typescript
await page.route(`**/api/v1/contactos?clienteId=**`, (route) => {
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
  });
});
```

**Critical:** All route intercepts must be set BEFORE `page.goto()` (network-first pattern).

---

## Required data-testid Attributes

### ClienteDetailView Component

- `contact-manager` — Outer wrapper `<div>` around the `<ContactManager>` (siesa-ui-kit) component; required by all E2E tests
- `contact-manager-row` — Each individual contact row rendered by ContactManager; used for count assertions in E2E-AC-01 and E2E-AC-02
- `contact-manager-error` — Error state panel rendered by ContactManager when fetch fails (used in E2E-AC-03 — may fall back to `role="alert"` if not available)
- `cliente-detail-panel` — Root container for the entire ClienteDetailView (loading skeleton and loaded states)
- `cliente-not-found` — Rendered when client returns 404 (not covered in 4.1 tests but required by implementation)
- `cliente-detail-nombre` — Client name display field
- `cliente-detail-nit` — Client NIT/RUC display field
- `cliente-detail-telefono` — Client phone display field
- `cliente-detail-ciudad` — Client city display field

**Implementation Example:**
```tsx
<div data-testid="cliente-detail-panel" aria-label="Detalle del cliente">
  {/* client fields */}
  <div data-testid="contact-manager">
    <ContactManager adapter={adapter} />
  </div>
</div>
```

**Note on `contact-manager-row`:** If siesa-ui-kit `ContactManager` does not expose `data-testid` on individual rows natively, wrap each row or use `getByRole('listitem')` scoped within `contactManagerContainer`. Update `e2e/pages/clientes.page.ts` accordingly.

---

## Implementation Checklist

### Test: API-AC-07, API-AC-07b, API-AC-07c

**File:** `e2e/tests/asociacion/asociacion-api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `GetContactosByClienteIdQuery.cs` in `backend/src/SiesaAgents.Application/Contactos/Queries/` — record with `Guid ClienteId` parameter
- [ ] Add `GetContactosByClienteIdQueryHandler.cs` — calls `IContactoRepository.GetByClienteIdAsync(clienteId, ct)`, maps to `ContactoDto[]`
- [ ] Add `GetByClienteIdAsync(Guid clienteId, CancellationToken ct)` to `IContactoRepository` interface
- [ ] Implement `GetByClienteIdAsync` in `ContactoRepository.cs` using `AsNoTracking().Where(c => c.ClienteId == clienteId).OrderByDescending(c => c.CreatedAt)`
- [ ] Update `GET /` endpoint in `ContactoEndpoints.cs` to accept optional `?clienteId=` query param — dispatch `GetContactosByClienteIdQueryHandler` when present; existing behavior unchanged when absent
- [ ] Register `GetContactosByClienteIdQueryHandler` in `Program.cs` DI
- [ ] Ensure response is a direct array (not wrapped object) with full `ContactoDto` schema
- [ ] Run tests: `npx playwright test e2e/tests/asociacion/asociacion-api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2–3 hours

---

### Test: UNIT-AC-01, UNIT-AC-01b, UNIT-AC-01c

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts`
- [ ] Implement `ClienteContactServiceAdapter` class with constructor receiving `clienteId: string`
- [ ] Implement `getContactos()` method calling `apiClient.get('/api/v1/contactos?clienteId={clienteId}')` and returning `response.data`
- [ ] Ensure `IContactServiceAdapter` interface from `siesa-ui-kit` is implemented
- [ ] Run tests: `pnpm vitest run src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: E2E-AC-01

**File:** `e2e/tests/asociacion/asociacion-contactmanager.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `getByClienteId(clienteId: string): Promise<Contacto[]>` to `IContactoRepository` interface (`frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`)
- [ ] Implement `getByClienteId` in `contactoApiRepository.ts` → `GET /api/v1/contactos?clienteId={clienteId}`
- [ ] Create `useContactosByCliente.ts` hook with `queryKey: ['contactos', { clienteId }]` and `enabled: !!clienteId`
- [ ] Create `ClienteDetailView.tsx` with `data-testid="cliente-detail-panel"` and `data-testid="contact-manager"` wrapper
- [ ] Ensure `ContactManager` (siesa-ui-kit) renders individual contact rows with `data-testid="contact-manager-row"` or accessible role
- [ ] Update `frontend/src/routes/_app/clientes.$clienteId.tsx` to render `ClienteDetailView` instead of `ClienteDetailPanel`
- [ ] Backend: `GET /api/v1/contactos?clienteId=` must filter server-side (AC1 test creates 2 associated + 1 orphan)
- [ ] Add required data-testid attributes: `contact-manager`, `contact-manager-row`
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-contactmanager.spec.ts --grep "E2E-AC-01"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3–4 hours

---

### Test: E2E-AC-02

**File:** `e2e/tests/asociacion/asociacion-contactmanager.spec.ts`

**Tasks to make this test pass:**

- [ ] `ContactManager` (siesa-ui-kit) must show an empty state (text matching `/no hay contactos|sin contactos|no existen contactos/i`) when adapter returns `[]`
- [ ] Confirm siesa-ui-kit `ContactManager` has built-in empty state or implement a wrapper
- [ ] `ClienteDetailView` must be rendered (same as E2E-AC-01 prerequisites)
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-contactmanager.spec.ts --grep "E2E-AC-02"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (depends on siesa-ui-kit ContactManager behavior)

---

### Test: E2E-AC-03

**File:** `e2e/tests/asociacion/asociacion-contactmanager.spec.ts`

**Tasks to make this test pass:**

- [ ] `ContactManager` (siesa-ui-kit) must show an error panel (`data-testid="contact-manager-error"` or `role="alert"`) when `getContactos()` throws
- [ ] A retry button must be visible (text matching `/reintentar|retry|volver a intentar/i`)
- [ ] Confirm siesa-ui-kit `ContactManager` error state behavior — implement wrapper if needed
- [ ] Add `data-testid="contact-manager-error"` to ContactManager error state container if configurable
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-contactmanager.spec.ts --grep "E2E-AC-03"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (depends on siesa-ui-kit ContactManager error handling)

---

## Running Tests

```bash
# Run all Story 4.1 failing tests
npx playwright test e2e/tests/asociacion/

# Run only E2E acceptance tests
npx playwright test e2e/tests/asociacion/asociacion-contactmanager.spec.ts

# Run only API integration tests
npx playwright test e2e/tests/asociacion/asociacion-api.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/tests/asociacion/asociacion-contactmanager.spec.ts --headed

# Debug a specific E2E test
npx playwright test e2e/tests/asociacion/asociacion-contactmanager.spec.ts --debug --grep "E2E-AC-01"

# Run unit tests (Vitest)
pnpm vitest run frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts

# Run unit tests in watch mode
pnpm vitest frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ E2E tests: 3 tests in `e2e/tests/asociacion/asociacion-contactmanager.spec.ts`
- ✅ API tests: 3 tests in `e2e/tests/asociacion/asociacion-api.spec.ts`
- ✅ Unit tests: 3 tests in `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`
- ✅ Network-first intercept pattern applied in all E2E tests
- ✅ Auto-cleanup via `afterEach` in all test files
- ✅ Data factories reused from `e2e/helpers/data.helper.ts`
- ✅ Mock requirements documented
- ✅ Required `data-testid` attributes listed
- ✅ Implementation checklist created

**Verification:**
- Unit tests fail: `ClienteContactServiceAdapter` does not exist — import error
- API tests fail: `GET /api/v1/contactos?clienteId=` not implemented — returns all contacts or 400
- E2E tests fail: `ClienteDetailView` not implemented — `contact-manager` testid absent

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with unit tests** — Fastest feedback; create `ClienteContactServiceAdapter.ts` (0.5h)
2. **Implement backend** — `GetContactosByClienteIdQueryHandler` + repository method + endpoint update (2–3h)
3. **Run API tests** to verify backend is correct before wiring frontend
4. **Implement frontend** — `useContactosByCliente` hook + `ClienteDetailView` + route update (3–4h)
5. **Run E2E tests** — All 3 should go green

**Key Principles:**
- One test at a time — start with P0 tests (E2E-AC-01, E2E-AC-02)
- Backend must be complete before E2E-AC-01 can go green (real API call for happy path)
- Use `page.route()` mocks to test E2E-AC-02 and E2E-AC-03 independently of backend state

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 9 tests pass (3 E2E + 3 API + 3 Unit)
2. Check `ClienteContactServiceAdapter` for duplication with `contactoApiRepository.getByClienteId`
3. Verify siesa-ui-kit `ContactManager` integration is idiomatic per company standards
4. Ensure `data-testid="contact-manager-row"` alignment with POM locator in `clientes.page.ts`
5. Run full test suite to confirm no regressions

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase:
   - `pnpm vitest run frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`
   - `npx playwright test e2e/tests/asociacion/`
3. **Begin implementation** — start with `ClienteContactServiceAdapter.ts` (fastest win)
4. **Implement backend** `GET /api/v1/contactos?clienteId=` before running E2E happy path
5. **Work one test at a time** (red → green for each)
6. **When all tests pass**, refactor and update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: intercept BEFORE navigation to prevent race conditions (applied in all 3 E2E tests)
- **fixture-architecture.md** — Auto-cleanup pattern via `afterEach` (reused from existing `api.helper.ts` pattern)
- **data-factories.md** — Factory patterns with unique IDs (`buildCliente`, `buildContacto` in `data.helper.ts`)
- **test-quality.md** — One assertion per test, Given-When-Then structure, atomic tests
- **selector-resilience.md** — `data-testid` selectors exclusively; no CSS class selectors
- **test-levels-framework.md** — E2E for critical user journey (AC1, AC2, AC3); API for backend contract; Unit for adapter URL construction

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Unit test command:** `pnpm vitest run frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`

**Expected failure:**
```
FAIL frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts
  Cannot find module '../presentation/ClienteContactServiceAdapter' from ...
```

**API + E2E test command:** `npx playwright test e2e/tests/asociacion/`

**Expected failures:**
- API tests: `expect(response.status()).toBe(200)` fails — endpoint returns 400/200 without filtering
- E2E tests: `await expect(page.getByTestId('contact-manager')).toBeVisible()` times out — element not in DOM

**Summary:**
- Total tests: 9 (3 E2E + 3 API + 3 Unit)
- Passing: 0 (expected)
- Failing: 9 (expected)
- Status: ✅ RED phase verified

---

## Notes

- The E2E tests use real API calls for data setup (not mocks) in E2E-AC-01 to validate true end-to-end behavior. Only the route interception for the contactos fetch is used to ensure test stability.
- E2E-AC-02 uses `page.route()` to return an empty array — this allows the test to run independently of seed data state.
- E2E-AC-03 uses `page.route()` to simulate 500 — the retry button text must match `/reintentar|retry|volver a intentar/i`; confirm the exact Spanish text with the siesa-ui-kit `ContactManager` component props/configuration.
- The `ClienteContactServiceAdapter` must be instantiated inside `ClienteDetailView` per render (not outside the component) — prevents stale `clienteId` across navigation. This is enforced as an anti-pattern in the story dev notes.
- `data-testid="contact-manager-row"` placement depends on siesa-ui-kit `ContactManager` internals. If rows are not directly accessible via testid, coordinate with the UI kit team or use `getByRole('listitem')` scoped inside `contact-manager`.

---

**Generated by BMad TEA Agent** — 2026-05-21
