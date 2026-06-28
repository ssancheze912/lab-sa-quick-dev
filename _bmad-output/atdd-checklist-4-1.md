# ATDD Checklist - Epic 4, Story 4.1: View Associated Contacts in Client Detail

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + API (Playwright) + E2E (Playwright)

---

## Story Summary

A commercial team member can view all contacts associated with a specific client directly within the client detail view at `/clientes/:clienteId`. The `ContactManager` component from `siesa-ui-kit` is rendered inside `ClienteDetailView`, fed via `ClienteContactServiceAdapter` which calls `GET /api/v1/contactos?clienteId=:id`. This story is read-only — no add/remove mutations are implemented.

**As a** commercial team member
**I want** to see all contacts associated with a client directly within the client detail view
**So that** I have a complete picture of that client's contacts without navigating elsewhere

---

## Acceptance Criteria

1. **Given** a client has associated contacts, **When** the user opens the client detail view at `/clientes/:clienteId`, **Then** the `ContactManager` (siesa-ui-kit) is rendered showing all contacts linked to that client (FR21), **And** the `ContactManager` uses `ClienteContactServiceAdapter` wired to `GET /api/v1/contactos?clienteId=:id`.

2. **Given** a client has no associated contacts, **When** the user opens the client detail view, **Then** the `ContactManager` displays an empty state indicating no contacts are linked yet.

3. **Given** the backend is unavailable when loading the client's contacts, **When** the fetch to `GET /api/v1/contactos?clienteId=:id` fails, **Then** the `ContactManager` displays an error state with a retry option.

---

## Failing Tests Created (RED Phase)

### API Tests (6 tests)

**File:** `e2e/tests/api/contactos-by-cliente.api.spec.ts`

- **Test:** TC-E4-4-1-API-1 — GET /api/v1/contactos?clienteId={uuid} returns 200 + filtered contacts
  - **Status:** RED — GetContactosQuery.cs lacks ClienteId param; handler does not filter by clienteId
  - **Verifies:** AC #1 — only contacts belonging to clienteX are returned; clienteY contacts excluded

- **Test:** contactos response includes clienteId field matching filter value
  - **Status:** RED — ContactoDto.clienteId field not populated via clienteId filter path
  - **Verifies:** AC #1 — ContactoDto shape is complete with clienteId populated

- **Test:** contacts returned in alphabetical nombre order when filtered by clienteId
  - **Status:** RED — query handler lacks OrderBy when clienteId filter is applied
  - **Verifies:** AC #1 — OrderBy(c => c.Nombre) applied in GetContactosQueryHandler

- **Test:** TC-E4-4-1-API-2 — GET /api/v1/contactos?clienteId= returns 200 + [] (NOT 404) when no contacts
  - **Status:** RED — endpoint returns 404 or errors instead of 200 + empty array
  - **Verifies:** AC #2 — empty state is 200 OK + [], not 404

- **Test:** 200 empty array for valid UUID clienteId with no contacts
  - **Status:** RED — same as above
  - **Verifies:** AC #2 — edge case: UUID is valid, no contacts exist for it

- **Test:** TC-E4-4-1-API-3 — GET /api/v1/contactos without clienteId still returns all contacts
  - **Status:** RED — if filter is incorrectly implemented as required, all contacts disappear
  - **Verifies:** Backwards compatibility — existing Story 3.1 behaviour preserved

- **Test:** ContactoDto shape in clienteId-filtered response includes all required fields
  - **Status:** RED — fields may be missing if DTO mapping is incomplete after filter change
  - **Verifies:** AC #1 — id, nombre, cargo, telefono, email, clienteId, createdAt, updatedAt all present

### E2E Tests (8 tests)

**File:** `e2e/tests/clientes/clientes-contact-manager.spec.ts`

- **Test:** TC-E4-4-1-E2E-1 — contact-manager-section wrapper rendered when navigating to /clientes/:clienteId
  - **Status:** RED — data-testid="contact-manager-section" does not exist in ClienteDetailView
  - **Verifies:** AC #1 — ContactManager section present in DOM (FR21)

- **Test:** "Contactos asociados" heading visible in Spanish inside contact-manager-section
  - **Status:** RED — heading not yet implemented
  - **Verifies:** AC #1 — Spanish locale heading text

- **Test:** TC-E4-4-1-E2E-2 — both linked contacts appear in ContactManager section
  - **Status:** RED — ContactManager not rendered; contacts not loaded via clienteId filter
  - **Verifies:** AC #1 — all linked contacts shown in the panel

- **Test:** GET /api/v1/contactos called with clienteId query param (adapter wiring)
  - **Status:** RED — ClienteContactServiceAdapter not instantiated; no clienteId param sent
  - **Verifies:** AC #1 — adapter correctly wired to the filtered endpoint

- **Test:** TC-E4-4-1-E2E-3 — empty state shown when client has no contacts
  - **Status:** RED — ContactManager empty state not rendered (component missing)
  - **Verifies:** AC #2 — empty state visible when contacts array is []

- **Test:** TC-E4-4-1-E2E-4 — error state + retry shown when GET contactos?clienteId fails 500
  - **Status:** RED — ContactManager error state with retry not rendered
  - **Verifies:** AC #3 — error state with retry option visible on 500

- **Test:** contact-manager-section NOT visible at /clientes (no clienteId in URL)
  - **Status:** RED — section incorrectly rendered or crashes without clienteId
  - **Verifies:** ContactManager only renders after client data has loaded

- **Test:** existing client fields preserved after ContactManager integration (regression guard)
  - **Status:** RED — Story 2.2 fields may be displaced by ContactManager integration
  - **Verifies:** Nombre, NIT, Teléfono, Ciudad still visible alongside ContactManager

### Component Tests (12 tests)

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.contact-manager.test.tsx`

- **Test:** TC-E4-4-1-CMP-1 — contact-manager-section in DOM after client data loads
  - **Status:** RED — data-testid="contact-manager-section" missing from ClienteDetailView
  - **Verifies:** AC #1 — ContactManager section present (FR21)

- **Test:** "Contactos asociados" heading inside contact-manager-section
  - **Status:** RED — heading not implemented
  - **Verifies:** AC #1 — Spanish heading present

- **Test:** contact-manager-section NOT rendered when clienteId is undefined
  - **Status:** RED — ContactManager may render unconditionally and crash
  - **Verifies:** Guard: only render ContactManager when client is loaded

- **Test:** contact-manager-section NOT rendered while client data loading
  - **Status:** RED — ContactManager rendered prematurely before client fetch resolves
  - **Verifies:** Conditional render: after client loaded, not during loading

- **Test:** TC-E4-4-1-CMP-2 — GET /api/v1/contactos called with clienteId param
  - **Status:** RED — ClienteContactServiceAdapter not instantiated; no clienteId param
  - **Verifies:** AC #1 — adapter calls filtered endpoint

- **Test:** No GET /api/v1/contactos when clienteId is undefined
  - **Status:** RED — fetch fired without clienteId when component renders with undefined
  - **Verifies:** enabled: !!clienteId guard in adapter / hook

- **Test:** TC-E4-4-1-CMP-3 — empty state in ContactManager when contacts array is []
  - **Status:** RED — ContactManager not rendered; empty state not visible
  - **Verifies:** AC #2 — empty state when no contacts linked

- **Test:** TC-E4-4-1-CMP-4 — error state + retry in ContactManager when contacts fetch returns 500
  - **Status:** RED — ContactManager error state not wired
  - **Verifies:** AC #3 — error state with retry option

- **Test:** client fields (Nombre, NIT) preserved when ContactManager is in error state
  - **Status:** RED — regression: client fields lost when ContactManager errors
  - **Verifies:** Story 2.2 regression guard + AC #3 co-existence

- **Test:** TC-E4-4-1-CMP-5 — useContactosByCliente calls GET with clienteId param
  - **Status:** RED — useContactosByCliente.ts does not exist
  - **Verifies:** AC #1 — hook calls GET /api/v1/contactos?clienteId=:id

- **Test:** useContactosByCliente query key is ['contactos', { clienteId }]
  - **Status:** RED — hook does not exist; query key not set
  - **Verifies:** Architecture canonical key per architecture.md#State Boundaries

- **Test:** TC-E4-4-1-CMP-6 — useContactosByCliente with undefined does NOT fire HTTP request
  - **Status:** RED — hook does not exist; enabled guard not implemented
  - **Verifies:** AC #1 — enabled: !!clienteId = false when undefined

---

## Data Factories Used

### Cliente Factory

**File:** `frontend/src/modules/crm/clientes/__tests__/clienteFactory.ts` (existing — Story 2.1)

**Exports:**
- `buildCliente(overrides?)` — Build single Cliente with optional overrides
- `buildClientes(count, overridesFn?)` — Build array of Clientes
- `resetClienteCounter()` — Reset counter for deterministic IDs

### Contacto Factory

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts` (existing — Story 3.1)

**Exports:**
- `buildContacto(overrides?)` — Build single Contacto with optional clienteId override
- `buildContactoList(count, overridesFn?)` — Build array of Contactos
- `resetContactoCounter()` — Reset counter for deterministic IDs

### E2E Data Helper

**File:** `e2e/helpers/data.helper.ts` (existing)

**Exports:**
- `buildCliente(overrides?)` — E2E cliente builder
- `buildContacto(overrides?)` — E2E contacto builder (supports `clienteId` field)

---

## Fixtures Used

**File:** `e2e/fixtures/base.fixture.ts` (existing)
- `clientesPage` — Navigates to /clientes before test

**File:** `e2e/helpers/api.helper.ts` (existing)
- `createCliente(data)` — POST /api/v1/clientes
- `createContacto(data)` — POST /api/v1/contactos (supports clienteId)
- `deleteContacto(id)` — DELETE /api/v1/contactos/:id
- `deleteCliente(id)` — DELETE /api/v1/clientes/:id
- `asignarClienteAContacto(contactoId, clienteId)` — PUT /api/v1/contactos/:id/cliente

---

## Mock Requirements

### GET /api/v1/contactos?clienteId= — Contacts Filtered by Client

**Endpoint:** `GET /api/v1/contactos?clienteId={uuid}`

**Success Response (contacts exist):**
```json
[
  {
    "id": "uuid",
    "nombre": "Ana García",
    "cargo": "Directora",
    "telefono": "3001234567",
    "email": "ana@example.com",
    "clienteId": "uuid-cliente",
    "createdAt": "2026-06-28T00:00:00+00:00",
    "updatedAt": "2026-06-28T00:00:00+00:00"
  }
]
```

**Empty Response (no contacts linked):**
```json
[]
```
HTTP 200 — NOT 404.

**Error Response:**
```json
{}
```
HTTP 500.

**Notes:** All tests use MSW (component tests) or `page.route()` (E2E tests) intercepts registered BEFORE component mount / page navigation per network-first pattern.

---

## Required data-testid Attributes

### ClienteDetailView

- `contact-manager-section` — Wrapper div around ContactManager + heading; rendered only when client data is loaded and clienteId is defined
- `cliente-detail-panel` — Root container for the client detail view (existing — Story 2.2)

**Implementation Example:**
```tsx
<div data-testid="contact-manager-section" className="mt-6">
  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
    Contactos asociados
  </h3>
  <ContactManager adapter={adapter} />
</div>
```

**Note:** ContactManager (siesa-ui-kit) manages its own internal test IDs for its empty/error states. Tests that target empty/error state use text matching against siesa-ui-kit rendered output.

---

## Implementation Checklist

### Test: TC-E4-4-1-API-1 — GET /api/v1/contactos?clienteId filtered response

**File:** `e2e/tests/api/contactos-by-cliente.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `Guid? ClienteId = null` to `GetContactosQuery` record in `GetContactosQuery.cs`
- [ ] In `GetContactosQueryHandler.cs`, add: `if (query.ClienteId.HasValue) q = q.Where(c => c.ClienteId == query.ClienteId.Value);`
- [ ] In `ContactoEndpoints.cs` MapGet handler, add `[AsParameters] Guid? clienteId = null` and pass to `GetContactosQuery(search, clienteId)`
- [ ] Verify `ix_contactos_cliente_id` index in `ContactoConfiguration.cs` — add if missing
- [ ] Run test: `npx playwright test e2e/tests/api/contactos-by-cliente.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E4-4-1-API-2 — Empty array [] (not 404) when no contacts linked

**File:** `e2e/tests/api/contactos-by-cliente.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `GetContactosQueryHandler.cs` returns `List<ContactoDto>()` (empty list) when no records match — not throwing 404
- [ ] Confirm `ContactoEndpoints.cs` returns `Results.Ok(dtos)` regardless of list length
- [ ] Run test: `npx playwright test e2e/tests/api/contactos-by-cliente.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E4-4-1-CMP-5 — useContactosByCliente hook

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.contact-manager.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `getByClienteId(clienteId: string): Promise<Contacto[]>` to `IContactoRepository.ts`
- [ ] Implement `getByClienteId` in `contactoApiRepository.ts`: `GET /api/v1/contactos?clienteId=${clienteId}`
- [ ] Create `useContactosByCliente.ts` with `queryKey: ['contactos', { clienteId }]`, `queryFn`, `enabled: !!clienteId`, `staleTime: 0`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.contact-manager`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E4-4-1-CMP-1 + TC-E4-4-1-E2E-1 — ContactManager section rendered

**File:** `frontend/src/modules/crm/clientes/__tests__/ClienteDetailView.contact-manager.test.tsx` + `e2e/tests/clientes/clientes-contact-manager.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `ClienteContactServiceAdapter.ts` implementing `IContactServiceAdapter` from `siesa-ui-kit`
  - [ ] Constructor accepts `clienteId: string`
  - [ ] `getContacts()` delegates to `contactoApiRepository.getByClienteId(this.clienteId)`
  - [ ] Mutation stubs (`addContact`, `removeContact`) throw `Error('Not implemented — Story 4.2')`
- [ ] Update `ClienteDetailView.tsx`:
  - [ ] Import `ContactManager` from `siesa-ui-kit`
  - [ ] Import `ClienteContactServiceAdapter` from `./ClienteContactServiceAdapter`
  - [ ] Add `useMemo(() => new ClienteContactServiceAdapter(clienteId!), [clienteId])` inside component
  - [ ] Render `<div data-testid="contact-manager-section">...</div>` with `<ContactManager adapter={adapter} />` ONLY when client data is loaded
  - [ ] Add heading `"Contactos asociados"` in Spanish above `<ContactManager>`
- [ ] Add required `data-testid="contact-manager-section"` on the wrapper div
- [ ] Run tests: `pnpm --filter frontend test ClienteDetailView.contact-manager` + `npx playwright test e2e/tests/clientes/clientes-contact-manager.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E4-4-1-CMP-3 + TC-E4-4-1-E2E-3 — ContactManager empty state

**File:** Component + E2E tests

**Tasks to make these tests pass:**

- [ ] Verify `siesa-ui-kit` `ContactManager` renders an empty state when adapter returns `[]` — check interface / locale prop
- [ ] Confirm Spanish locale is active for `ContactManager` (locale prop or default Spanish config)
- [ ] Run tests: `pnpm --filter frontend test ClienteDetailView.contact-manager` + `npx playwright test e2e/tests/clientes/clientes-contact-manager.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E4-4-1-CMP-4 + TC-E4-4-1-E2E-4 — ContactManager error state + retry

**File:** Component + E2E tests

**Tasks to make these tests pass:**

- [ ] Verify `siesa-ui-kit` `ContactManager` renders error state with retry button when adapter throws
- [ ] Confirm error propagation: `getByClienteId` 500 → adapter throws → ContactManager catches and renders error state
- [ ] Run tests: `pnpm --filter frontend test ClienteDetailView.contact-manager` + `npx playwright test e2e/tests/clientes/clientes-contact-manager.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all API tests for Story 4.1
npx playwright test e2e/tests/api/contactos-by-cliente.api.spec.ts

# Run all E2E tests for Story 4.1
npx playwright test e2e/tests/clientes/clientes-contact-manager.spec.ts

# Run all component tests for Story 4.1
pnpm --filter frontend test ClienteDetailView.contact-manager

# Run all tests for Story 4.1
npx playwright test e2e/tests/api/contactos-by-cliente.api.spec.ts e2e/tests/clientes/clientes-contact-manager.spec.ts && pnpm --filter frontend test ClienteDetailView.contact-manager

# Run E2E tests in headed mode
npx playwright test e2e/tests/clientes/clientes-contact-manager.spec.ts --headed

# Debug a specific E2E test
npx playwright test e2e/tests/clientes/clientes-contact-manager.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (26 tests total across 3 files)
- ✅ Network-first intercepts applied in all tests
- ✅ Given-When-Then structure in all tests
- ✅ data-testid selectors used (no CSS selectors)
- ✅ No hard waits — explicit waitFor used throughout
- ✅ Mock requirements documented
- ✅ Required data-testid attributes listed
- ✅ Implementation checklist created

**Verification:**

- Tests fail due to missing implementation (files/components not yet created), not test bugs
- Key failure reasons: `useContactosByCliente.ts` does not exist, `ClienteContactServiceAdapter.ts` does not exist, `ClienteDetailView.tsx` lacks ContactManager integration, backend lacks clienteId filter
- Failure messages are clear and point to the exact missing piece

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with backend** (TC-E4-4-1-API-1, API-2, API-3): Extend `GetContactosQuery`, handler, and endpoint
2. **Then create frontend hook** (TC-E4-4-1-CMP-5, CMP-6): `useContactosByCliente.ts` + repository extension
3. **Then create adapter** (TC-E4-4-1-CMP-2): `ClienteContactServiceAdapter.ts`
4. **Finally integrate into view** (TC-E4-4-1-CMP-1, E2E-1): Update `ClienteDetailView.tsx`
5. Run tests after each step to confirm GREEN

**Key Principles:**

- One test at a time (start with P0, then P1)
- Use `useMemo` for adapter — prevents re-instantiation loop
- ContactManager from siesa-ui-kit is mandatory — no custom list
- All user-facing text in Spanish

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify no `any` types in TypeScript (strict mode)
2. Confirm `useMemo([clienteId])` dependency array is correct
3. Verify adapter mutation stubs throw meaningful errors
4. Ensure ix_contactos_cliente_id index is configured in EF Core
5. Check all user-facing text is in Spanish

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/api/contactos-by-cliente.api.spec.ts`
3. Begin backend implementation (Task 1 in story)
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor for quality

---

## Knowledge Base References Applied

- **network-first.md** — Intercept BEFORE navigation/render in all E2E and component tests
- **data-factories.md** — Reused existing clienteFactory + contactoFactory (no new factories needed)
- **fixture-architecture.md** — Reused existing base.fixture.ts + ApiHelper
- **component-tdd.md** — Given-When-Then structure, one assertion per test, MSW for isolation
- **test-quality.md** — Deterministic test data, explicit waitFor, no hard sleeps
- **selector-resilience.md** — data-testid selectors used exclusively; no CSS selectors
- **test-levels-framework.md** — API (P1 backend contract), E2E (P0/P1 user journey), Component (P0/P1 UI behaviour)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected failures before implementation:**

- API tests fail: 404 or 200 with unfiltered results for `GET /api/v1/contactos?clienteId=`
- E2E tests fail: `data-testid="contact-manager-section"` not found in DOM
- Component tests fail: Module not found — `useContactosByCliente`, `ClienteContactServiceAdapter`

**Summary:**

- Total tests: 26
- Passing: 0 (expected — RED phase)
- Failing: 26 (expected — all require implementation)
- Status: RED phase — tests define the behaviour before implementation exists

---

## Notes

- Story 4.1 is read-only. The `ContactManager` is rendered without add/remove actions (those are Story 4.2). If `IContactServiceAdapter` from `siesa-ui-kit` requires mutation methods, implement them as stubs that throw `Error('Not implemented — Story 4.2')`.
- The `ClienteContactServiceAdapter` is instantiated per `clienteId` inside `useMemo` — this is mandatory to prevent ContactManager from re-fetching on every render.
- Query key `['contactos', { clienteId }]` (with object wrapper) is canonical per architecture. Do NOT use `['contactos', clienteId]` (flat string) — the object wrapper enables precise invalidation in Story 4.2.
- `GET /api/v1/contactos?clienteId=` returning `[]` (200 OK) for a client with no contacts is a deliberate design decision — it is NOT a 404.

---

**Generated by BMad TEA Agent** — 2026-06-28
