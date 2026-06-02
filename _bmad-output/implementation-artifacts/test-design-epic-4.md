---
epic: 4
title: "Client-Contact Association & Data Quality"
phase: 4
mode: epic-level
date: 2026-05-21
stories:
  - "4.1: View Associated Contacts in Client Detail"
  - "4.2: Associate & Disassociate Contacts from Client"
  - "4.3: Navigate from Client Detail to Contact Detail"
  - "4.4: View Associated Client from Contact Detail"
  - "4.5: Orphan Contacts Filter"
  - "4.6: Reassign Contact to Different Client"
frs_covered: [FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27]
nfrs_relevant: [NFR2, NFR5, NFR6, NFR7, NFR8, NFR9]
status: complete
---

# Test Design — Epic 4: Client-Contact Association & Data Quality

## 1. Epic Overview

Epic 4 delivers the bidirectional association between clients and contacts. A contact can belong to at most one client (nullable `cliente_id` FK). From the client detail view, the commercial team manages linked contacts via the siesa-ui-kit `ContactManager` component wired through `ClienteContactServiceAdapter`. From the contact detail view, users see and navigate to the associated client. Orphan contacts (no client) are discoverable through a dedicated filter, and a contact can be reassigned from one client to another.

The key integration point is the `PUT /api/v1/contactos/{id}/cliente` endpoint, which handles association, disassociation (clienteId = null), and reassignment in a single operation. TanStack Query cache invalidation drives the "immediately visible" requirement (FR27).

| Story | Scope |
|---|---|
| 4.1 | ContactManager in ClienteDetailView; fetches `GET /api/v1/contactos?clienteId=:id`; empty state; error state |
| 4.2 | Associate existing contact; create new contact from ContactManager; disassociate contact; `PUT /api/v1/contactos/{id}/cliente` |
| 4.3 | Navigate from contact row in ContactManager to `/contactos/:contactoId`; back navigation |
| 4.4 | Display associated client name in contact detail; clickable link to `/clientes/:clienteId`; "Sin cliente asignado" for unlinked |
| 4.5 | Filter `/contactos` by `sinCliente=true`; count display; toggle filter on/off |
| 4.6 | Reassign contact to different client; toast confirmation; cache invalidation for old and new client query keys |

**Epic-Level Acceptance Criteria:**

| AC | Description |
|---|---|
| AC-E4.1 | User can associate an existing contact to a client from the client detail view without navigating away |
| AC-E4.2 | User can see all associated contacts in client detail and navigate to any contact in 2 clicks or fewer |
| AC-E4.3 | From contact detail, user can see the associated client and navigate there in 1 click |
| AC-E4.4 | User can disassociate a contact without deleting either record |
| AC-E4.5 | User can filter the contacts list to show only contacts not associated with any client |
| AC-E4.6 | User can reassign a contact from one client to another |
| AC-E4.7 | All changes are visible immediately for all users without page refresh |

**FRs Covered:** FR17 (associate contact to client), FR18 (create contact already associated), FR19 (see contacts in client detail), FR20 (disassociate contact), FR21 (ContactManager in client detail), FR22 (navigate contact → client), FR23 (client name in contact detail), FR24 (navigate client → contact), FR25 (orphan filter), FR26 (reassign contact), FR27 (immediate visibility)

**NFRs Applicable:**
- NFR2: All association/disassociation/reassignment changes reflected in UI in < 2s
- NFR5: Input validation on `clienteId` field (valid UUID or null)
- NFR6: No stack traces exposed on PUT /cliente failures
- NFR7: New user completes "find a client, view contacts, create contact" without training
- NFR8: No more than 2 clicks from a client record to any of its contacts
- NFR9: No additional search to view a contact's associated client from contact detail

---

## 2. Risk Assessment

### Risk Matrix

| ID | Category | Risk | Probability | Impact | Score | Mitigation |
|---|---|---|---|---|---|---|
| R1 | DATA | `queryKeys ['contactos']` and `['contactos', { clienteId }]` not both invalidated after associate/disassociate/reassign — stale contact lists for both old and new client | 3 | 3 | 9 | E2E tests assert the ContactManager of both old and new client updates immediately; API-level test confirms mutation hook invalidates all 3 keys |
| R2 | TECH | `ClienteContactServiceAdapter` not correctly wired to `GET /api/v1/contactos?clienteId=:id` — ContactManager fetches all contacts or empty set | 3 | 3 | 9 | E2E test: create client with known contacts; open client detail; assert only those contacts appear in ContactManager, not others |
| R3 | BUS | Disassociation deletes the contact record instead of setting `clienteId = null` — data loss violating FR20 | 2 | 3 | 6 | API test: disassociate contact via `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: null }`; GET contact by id; assert record still exists with `clienteId: null`; GET `/contactos` and assert contact in list |
| R4 | BUS | 2-click navigation constraint (NFR8) broken — ContactManager requires more than 2 clicks to reach contact detail | 2 | 3 | 6 | E2E test: from `/clientes` (click 1 = select client), click contact row in ContactManager (click 2 = navigate to detail); assert URL matches `/contactos/:id` after exactly 2 clicks |
| R5 | DATA | Reassign leaves contact in both old and new client ContactManager simultaneously — duplicate display from stale cache | 2 | 3 | 6 | E2E test: reassign contact; assert old client's ContactManager no longer contains the contact; assert new client's ContactManager shows it |
| R6 | TECH | `PUT /api/v1/contactos/{id}/cliente` endpoint not implemented or returns wrong status — association silently fails | 2 | 3 | 6 | API-CT-01: PUT with valid clienteId returns 200; API-CT-02: GET contact confirms updated clienteId |
| R7 | BUS | Orphan filter (`sinCliente=true`) sends parameter to backend instead of filtering client-side — or client-side filter does not check `clienteId === null` correctly | 2 | 2 | 4 | E2E test: mix of orphan and assigned contacts; activate filter; assert only orphan rows visible; assert no new API call beyond initial fetch OR confirm `?sinCliente=true` query param is sent correctly |
| R8 | TECH | New contact created from ContactManager does not auto-associate with the current client — `clienteId` omitted from POST payload | 2 | 2 | 4 | E2E test: create contact from ContactManager inside client detail; assert contact appears in ContactManager; API-level check: GET new contact and confirm `clienteId` equals the client's id |
| R9 | BUS | "Sin cliente asignado" text not rendered in contact detail when `clienteId` is null — blank field causes confusion | 2 | 2 | 4 | E2E test: navigate to contact detail with no client; assert text "Sin cliente asignado" visible |
| R10 | TECH | Back navigation from contact detail (reached from client detail) does not return to client — goes to contacts list or root instead | 1 | 2 | 2 | E2E test: navigate client → contact (via ContactManager); click browser back or "Volver"; assert URL returns to `/clientes/:clienteId` |
| R11 | OPS | Toast messages not shown in Spanish for associate/disassociate/reassign operations — user has no confirmation feedback | 1 | 2 | 2 | E2E tests assert Spanish toast messages after each mutation |
| R12 | DATA | `ON DELETE SET NULL` cascade not configured in `ContactoConfiguration.cs` — deleting a client orphans contact with broken FK instead of nulling it | 1 | 3 | 3 | API test: create client and associated contact; delete client; GET contact; assert `clienteId === null` (not 500 or stale id) |

**Top 3 Critical Risk Areas:**

1. **Dual cache invalidation after mutation (R1, Score: 9)** — When a contact is associated, disassociated, or reassigned, TanStack Query must invalidate both `['contactos']` (the global list used by `/contactos`) and `['contactos', { clienteId }]` (the filtered list used by ContactManager). Failing to invalidate either key causes stale UI that violates FR27. The reassignment case is most complex: three keys must be invalidated (`['contactos']`, `['contactos', { clienteId: oldId }]`, `['contactos', { clienteId: newId }]`).

2. **ClienteContactServiceAdapter isolation (R2, Score: 9)** — The ContactManager in `ClienteDetailView` must only show contacts for the specific `clienteId` of the selected client. If the adapter is misconfigured (missing `?clienteId=` param, or fetching `['contactos']` instead of `['contactos', { clienteId }]`), every client will show all contacts — a data quality failure that also violates FR21.

3. **Disassociation does not delete records (R3, Score: 6)** — The domain rule that disassociation sets `clienteId = null` (not DELETE) must be verified end-to-end. This is a data integrity risk: a faulty implementation that deletes the contact instead would cause permanent data loss.

---

## 3. Test Strategy by Level

### Level Distribution

| Level | Tool | Volume | Focus |
|---|---|---|---|
| E2E (UI) | Playwright (chromium) | 30 tests | ContactManager interactions, 2-click navigation, immediate visibility after mutations, orphan filter, reassign UX |
| API / Integration | Playwright APIRequestContext | 10 tests | PUT /cliente contract, disassociate preserves record, cascade ON DELETE SET NULL, orphan filter param, error responses |
| Component / Unit | Vitest + RTL (frontend) | 5 tests | ClienteContactServiceAdapter URL building, orphan filter useMemo logic |
| Backend Unit | xUnit | 4 tests | AssignClienteToContacto command handler, null clienteId handling, ContactoConfiguration FK cascade |

**Total: 49 test cases**

### Playwright Projects Applicable

| Project | Rationale |
|---|---|
| chromium (Desktop Chrome) | Primary — all E2E tests |
| firefox | Secondary coverage for ContactManager interactions |
| mobile-chrome (Pixel 5) | NFR8 check: 2-click navigation on mobile viewport |

### Key Testing Principles for Epic 4

- All API setup/teardown uses existing `ApiHelper` — `asignarClienteAContacto(contactoId, clienteId)` method is already present.
- Test data created via `buildCliente()` and `buildContacto()` from `data.helper.ts` — no hardcoded IDs.
- Each test tears down created clients and contacts in `afterEach` using `apiHelper.deleteCliente(id)` and `apiHelper.deleteContacto(id)`.
- ContactManager locators must use `data-testid` attributes on the siesa-ui-kit component wrapper — the POM requires extension for Epic 4 (see Section 7).
- All mutation assertions verify immediate UI update without `page.reload()`.
- Network interception with `page.route()` used for error scenarios and mutation verification.
- All Spanish text assertions use case-insensitive regex.

---

## 4. Test Cases

### 4.1 E2E Tests (Playwright)

#### File: `e2e/tests/asociacion/asociacion-contactmanager.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-AC-01 | P0 | 4.1 | AC-E4.2 | ContactManager renders in client detail showing only contacts associated with that client |
| E2E-AC-02 | P0 | 4.1 | AC-E4.2 | ContactManager shows empty state when client has no associated contacts |
| E2E-AC-03 | P1 | 4.1 | — | ContactManager shows error state with retry option when `GET /api/v1/contactos?clienteId=:id` returns 500 |
| E2E-AC-04 | P0 | 4.2 | AC-E4.1 | Associating an existing contact via ContactManager adds it to the ContactManager list immediately (no reload) |
| E2E-AC-05 | P0 | 4.2 | AC-E4.4 | Disassociating a contact via ContactManager removes it from the list immediately; contact still exists in `/contactos` |
| E2E-AC-06 | P0 | 4.2 | AC-E4.7 | After association, ContactManager list updates without page refresh |
| E2E-AC-07 | P1 | 4.2 | — | Creating a new contact from within ContactManager auto-associates it with the current client and it appears in ContactManager immediately |
| E2E-AC-08 | P1 | 4.2 | — | Success toast shown after successful association operation |
| E2E-AC-09 | P1 | 4.2 | — | Success toast shown after successful disassociation operation |

**Implementation notes:**
- E2E-AC-01: Create client and 2 contacts via `apiHelper`; associate both contacts to client via `apiHelper.asignarClienteAContacto()`; navigate to `/clientes/:clienteId`; assert `contactManagerRows` count equals 2. Create a 3rd contact with no client; assert it does NOT appear in ContactManager.
- E2E-AC-02: Create client via `apiHelper`; navigate to `/clientes/:clienteId`; assert ContactManager empty state visible (no rows, "no hay contactos" message).
- E2E-AC-03: Use `page.route('**/contactos?clienteId=*', route => route.fulfill({ status: 500 }))` before navigating to client detail; assert ContactManager error panel + retry button visible.
- E2E-AC-04: Create client and orphan contact via `apiHelper`; navigate to client detail; use ContactManager "agregar contacto" action; assert the contact's nombre appears in ContactManager list. Assert no `page.reload()` called. Monitor `['contactos', { clienteId }]` cache invalidated by tracking request count.
- E2E-AC-05: Create client + associated contact; navigate to client detail; disassociate via ContactManager; assert contact row no longer in ContactManager. Then navigate to `/contactos`; assert the contact's row still exists in contacts list.

---

#### File: `e2e/tests/asociacion/asociacion-navegacion.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-AC-10 | P0 | 4.3 | AC-E4.2 | Clicking a contact row in ContactManager navigates to `/contactos/:contactoId` (≤ 2 clicks from client list) |
| E2E-AC-11 | P0 | 4.3 | AC-E4.2 | Navigation from client list to contact detail requires exactly 2 clicks: (1) select client, (2) click contact in ContactManager |
| E2E-AC-12 | P1 | 4.3 | — | Back navigation from contact detail (reached via ContactManager) returns to client detail view |
| E2E-AC-13 | P0 | 4.4 | AC-E4.3 | Contact detail shows associated client name when contact has a client |
| E2E-AC-14 | P0 | 4.4 | AC-E4.3 | Clicking the client name link in contact detail navigates to `/clientes/:clienteId` in 1 click |
| E2E-AC-15 | P1 | 4.4 | — | Contact detail shows "Sin cliente asignado" when contact has no associated client |

**Implementation notes:**
- E2E-AC-10: Create client + associated contact; navigate to `/clientes`; click client item (click 1); assert `detailPanel` visible with ContactManager; click contact row in ContactManager (click 2); assert URL matches `/contactos/{uuid}`.
- E2E-AC-11: Same test as E2E-AC-10 with explicit click counter validation — wraps click interactions in a counter to verify only 2 clicks from landing on `/clientes`.
- E2E-AC-12: After navigating to contact via ContactManager (click 2), click `page.goBack()` or click "Volver" link; assert `page.url()` matches `/clientes/:clienteId`.
- E2E-AC-13: Create client + contact associated; navigate directly to `/contactos/:contactoId`; assert `clienteAsociadoLink` locator is visible and contains the client's nombre.
- E2E-AC-14: From contact detail with associated client, click `clienteAsociadoLink`; assert URL changes to `/clientes/:clienteId`; assert client detail panel visible.
- E2E-AC-15: Create orphan contact (no client) via `apiHelper`; navigate to `/contactos/:contactoId`; assert text `/sin cliente asignado/i` visible; assert `clienteAsociadoLink` not present.

---

#### File: `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-AC-16 | P0 | 4.5 | AC-E4.5 | Activating "Sin cliente" filter shows only contacts with `clienteId = null` |
| E2E-AC-17 | P0 | 4.5 | AC-E4.5 | Orphan contact count is visible when filter is active |
| E2E-AC-18 | P1 | 4.5 | — | When "Sin cliente" filter is active and all contacts have a client, empty state is shown |
| E2E-AC-19 | P1 | 4.5 | — | Deactivating "Sin cliente" filter restores full contact list |

**Implementation notes:**
- E2E-AC-16: Create 2 contacts with client + 2 orphan contacts via `apiHelper`; navigate to `/contactos`; assert `filtroSinCliente` locator visible; click it; assert `contactoRows.count()` equals 2; assert rows only contain the orphan contacts' nombres.
- E2E-AC-17: Same setup as E2E-AC-16; after filter activated, assert count badge or text showing number of orphan contacts is visible.
- E2E-AC-18: Create 2 contacts all with a client (no orphans); activate filter; assert EmptyState visible.
- E2E-AC-19: E2E-AC-16 setup; activate filter; then click `filtroSinCliente` again to deactivate; assert all 4 contacts visible again.

---

#### File: `e2e/tests/asociacion/asociacion-reasignacion.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-AC-20 | P0 | 4.6 | AC-E4.6 | User can initiate reassignment from contact detail — selector shows all available clients |
| E2E-AC-21 | P0 | 4.6 | AC-E4.6 | Confirming reassignment: contact removed from old client ContactManager and appears in new client ContactManager immediately |
| E2E-AC-22 | P0 | 4.6 | AC-E4.7 | After reassignment, both old and new client contact lists update without page refresh |
| E2E-AC-23 | P1 | 4.6 | — | Toast "Contacto reasignado correctamente" shown after successful reassignment |
| E2E-AC-24 | P1 | 4.6 | — | Cancelling reassignment leaves contact's client association unchanged |

**Implementation notes:**
- E2E-AC-20: Create 2 clients + 1 contact assigned to client A; navigate to `/contactos/:contactoId`; click reasignar action; assert a client selector/dialog opens; assert client B's nombre is visible in the selector.
- E2E-AC-21: From E2E-AC-20 setup, select client B and confirm; assert `page.url()` or contact detail shows client B's nombre; navigate to `/clientes/:clienteAId`; assert contact NOT in ContactManager; navigate to `/clientes/:clienteBId`; assert contact IS in ContactManager.
- E2E-AC-22: Same test as E2E-AC-21 — verifies no `page.reload()` involved. Monitor network requests: assert `PUT /api/v1/contactos/:id/cliente` called once; assert 3 TanStack Query keys invalidated by observing at least 2 GET requests to `/api/v1/contactos` (refetch for both clients).
- E2E-AC-24: Open reassign selector; choose a different client; click Cancelar; assert contact detail still shows original client nombre; navigate to original client detail; assert contact still in ContactManager.

---

### 4.2 API / Integration Tests

#### File: `e2e/tests/asociacion/asociacion-api.spec.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| API-AC-01 | P0 | 4.2 | `PUT /api/v1/contactos/{id}/cliente` with valid `{ clienteId: uuid }` returns 200 and body with updated `clienteId` |
| API-AC-02 | P0 | 4.2 | After `PUT /cliente` with valid clienteId, `GET /api/v1/contactos/{id}` returns the contact with the new `clienteId` |
| API-AC-03 | P0 | 4.2 | `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: null }` returns 200 and body with `clienteId: null` (disassociation) |
| API-AC-04 | P0 | 4.2 | After disassociation (`PUT /cliente` with null), `GET /api/v1/contactos/{id}` returns contact with `clienteId: null` (record not deleted) |
| API-AC-05 | P0 | 4.6 | `PUT /api/v1/contactos/{id}/cliente` with a different valid clienteId (reassignment) returns 200 with new clienteId |
| API-AC-06 | P0 | 4.5 | `GET /api/v1/contactos?sinCliente=true` returns only contacts where `clienteId` is null |
| API-AC-07 | P1 | 4.5 | `GET /api/v1/contactos?clienteId={id}` returns only contacts belonging to that client |
| API-AC-08 | P1 | 4.2 | `PUT /api/v1/contactos/{id}/cliente` with non-existent clienteId returns 404 and Problem Details (no stack trace) |
| API-AC-09 | P1 | 4.2 | `PUT /api/v1/contactos/{id}/cliente` with invalid UUID format returns 400 and Problem Details (no stack trace) |
| API-AC-10 | P1 | 4.2 | Delete client → `GET /api/v1/contactos/{contactoId}` returns contact with `clienteId: null` (ON DELETE SET NULL cascade verified) |

**Implementation notes:**
- All API tests use `request` fixture from Playwright — no browser involved.
- API-AC-01: Create client and contact via `apiHelper`; PUT with `{ clienteId: client.id }`; assert status 200; parse body; assert `clienteId === client.id`.
- API-AC-03/04: PUT with `{ clienteId: null }`; GET by id; assert contact exists with `clienteId === null`; assert `response.status() === 200` (not 204 — body contains updated object).
- API-AC-06: Create 3 contacts: 2 with clienteId, 1 without; GET with `?sinCliente=true`; assert array length 1; assert the returned contact's `clienteId === null`.
- API-AC-08/09: Assert `response.status()` is 404/400; parse body; assert no `stackTrace` key present (NFR6).
- API-AC-10: Create client + associated contact; DELETE client via `apiHelper.deleteCliente(id)`; GET contact; assert `clienteId === null` and contact still exists (status 200).

---

### 4.3 Component / Unit Tests (Frontend — Vitest)

#### File: `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-AC-01 | P1 | 4.1 | `ClienteContactServiceAdapter.getContactos(clienteId)` calls `GET /api/v1/contactos?clienteId={id}` with the correct URL |
| UNIT-AC-02 | P1 | 4.2 | `ClienteContactServiceAdapter.assignContacto(contactoId, clienteId)` calls `PUT /api/v1/contactos/{contactoId}/cliente` with `{ clienteId }` |
| UNIT-AC-03 | P1 | 4.2 | `ClienteContactServiceAdapter.removeContacto(contactoId)` calls `PUT /api/v1/contactos/{contactoId}/cliente` with `{ clienteId: null }` |

#### File: `frontend/src/modules/crm/contactos/__tests__/filterOrphanContactos.test.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-AC-04 | P1 | 4.5 | `filterOrphanContactos(contacts)` returns only contacts where `clienteId === null` |
| UNIT-AC-05 | P1 | 4.5 | `filterOrphanContactos([])` returns empty array without error |

---

### 4.4 Backend Unit Tests (xUnit)

#### File: `backend/tests/SiesaAgents.UnitTests/Handlers/AssignClienteCommandHandlerTests.cs`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-B-AC-01 | P1 | 4.2 | `AssignClienteToContactoHandler` sets `ClienteID` on contact and persists when given valid contactoId and valid clienteId |
| UNIT-B-AC-02 | P1 | 4.2 | `AssignClienteToContactoHandler` sets `ClienteID = null` when clienteId is null (disassociation path) |
| UNIT-B-AC-03 | P1 | 4.2 | `AssignClienteToContactoHandler` throws domain exception (→ 404) when contactoId does not exist |

#### File: `backend/tests/SiesaAgents.UnitTests/Infrastructure/ContactoConfigurationTests.cs`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-B-AC-04 | P1 | 4.2 | `ContactoConfiguration` applies `ON DELETE SET NULL` behavior on `ClienteID` FK (EF Core model snapshot check) |

---

## 5. Test Execution Order & Priority

### P0 — Blocking (gate for beginning story implementation)

1. API-AC-01 — PUT /cliente with valid clienteId returns 200 with updated clienteId
2. API-AC-02 — GET contact after association confirms new clienteId
3. API-AC-03 — PUT /cliente with null returns 200 (disassociation)
4. API-AC-04 — GET contact after disassociation confirms clienteId=null (record not deleted)
5. API-AC-05 — PUT /cliente with different clienteId (reassignment) returns 200
6. API-AC-06 — GET /contactos?sinCliente=true returns only orphan contacts
7. E2E-AC-01 — ContactManager shows only client's contacts
8. E2E-AC-02 — ContactManager empty state when no associated contacts
9. E2E-AC-04 — Associate existing contact via ContactManager appears immediately
10. E2E-AC-05 — Disassociate contact; removed from ContactManager; contact still in /contactos
11. E2E-AC-06 — Association updates ContactManager without page refresh
12. E2E-AC-10 — Contact row in ContactManager navigates to /contactos/:contactoId
13. E2E-AC-11 — 2-click navigation from client list to contact detail (NFR8)
14. E2E-AC-13 — Contact detail shows associated client name
15. E2E-AC-14 — Clicking client name in contact detail navigates to /clientes/:clienteId
16. E2E-AC-16 — "Sin cliente" filter shows only orphan contacts
17. E2E-AC-17 — Orphan count visible when filter active
18. E2E-AC-20 — Reassign: client selector opens with all clients
19. E2E-AC-21 — Reassign: contact removed from old client, added to new client
20. E2E-AC-22 — Reassign: both client contact lists update without page refresh

### P1 — High (should pass before second story in sprint)

- E2E-AC-03 (ContactManager error state with retry)
- E2E-AC-07 (create contact from ContactManager auto-associates)
- E2E-AC-08, E2E-AC-09 (association/disassociation toasts)
- E2E-AC-12 (back navigation returns to client detail)
- E2E-AC-15 ("Sin cliente asignado" in contact detail)
- E2E-AC-18 (empty state when all contacts have a client, filter active)
- E2E-AC-19 (deactivate filter restores full list)
- E2E-AC-23 (toast "Contacto reasignado correctamente")
- E2E-AC-24 (cancel reassignment: association unchanged)
- API-AC-07 (GET /contactos?clienteId={id} filtered)
- API-AC-08, API-AC-09 (error responses on invalid PUT /cliente)
- API-AC-10 (ON DELETE SET NULL cascade)
- UNIT-AC-01 through UNIT-AC-05
- UNIT-B-AC-01 through UNIT-B-AC-04

### P2 — Medium (complete within epic sprint)

- Mobile-chrome: E2E-AC-11 (2-click navigation on Pixel 5 viewport — NFR8 on mobile)
- E2E-AC-16 on Firefox (secondary browser ContactManager filter)
- NFR2 timing assertion: E2E-AC-04, E2E-AC-05, E2E-AC-21 — measure from click to list update < 2000ms

### P3 — Low (nice to have)

- Cross-browser: E2E-AC-01, E2E-AC-10, E2E-AC-21 on Firefox
- NFR7 check: E2E smoke test covering full user journey "find client → see contacts → add contact" without guidance (exploratory-style assertion)
- Performance: E2E-AC-16 with 500+ contacts in DB, assert filter renders < 1000ms

---

## 6. Test File Structure

```
e2e/
  tests/
    asociacion/
      asociacion-contactmanager.spec.ts     # E2E-AC-01 to E2E-AC-09
      asociacion-navegacion.spec.ts         # E2E-AC-10 to E2E-AC-15
      asociacion-filtro-huerfanos.spec.ts   # E2E-AC-16 to E2E-AC-19
      asociacion-reasignacion.spec.ts       # E2E-AC-20 to E2E-AC-24
      asociacion-api.spec.ts               # API-AC-01 to API-AC-10
  pages/
    clientes.page.ts                        # Extend with ContactManager locators (see Section 7)
    contactos.page.ts                       # filtroSinCliente + clienteAsociadoLink already present
  helpers/
    api.helper.ts                           # asignarClienteAContacto() already present
    data.helper.ts                          # buildCliente() + buildContacto() ready

frontend/src/
  modules/crm/clientes/__tests__/
    ClienteContactServiceAdapter.test.ts    # UNIT-AC-01 to UNIT-AC-03
  modules/crm/contactos/__tests__/
    filterOrphanContactos.test.ts           # UNIT-AC-04 to UNIT-AC-05

backend/tests/
  SiesaAgents.UnitTests/
    Handlers/
      AssignClienteCommandHandlerTests.cs   # UNIT-B-AC-01 to UNIT-B-AC-03
    Infrastructure/
      ContactoConfigurationTests.cs         # UNIT-B-AC-04
```

---

## 7. ClientesPage POM Extension — Epic 4 Additions

The existing `e2e/pages/clientes.page.ts` must be extended with ContactManager locators. The siesa-ui-kit `ContactManager` component must expose `data-testid` attributes (or accessible roles) for reliable test selection.

**Required additions to `ClientesPage`:**

```typescript
// ContactManager (inside client detail panel)
readonly contactManagerContainer: Locator;    // data-testid="contact-manager"
readonly contactManagerRows: Locator;         // data-testid="contact-manager-row"
readonly btnAgregarContacto: Locator;         // button within ContactManager to add/associate
readonly btnReasignar: Locator;               // button to initiate reassignment (in contact detail)
readonly clienteSelectorDialog: Locator;      // dialog/popover for client selector during reassign
```

**Constructor additions:**
```typescript
this.contactManagerContainer = page.getByTestId('contact-manager');
this.contactManagerRows = page.getByTestId('contact-manager-row');
this.btnAgregarContacto = page.getByRole('button', { name: /agregar contacto|asociar/i });
this.btnReasignar = page.getByRole('button', { name: /reasignar/i });
this.clienteSelectorDialog = page.getByRole('dialog').filter({ hasText: /seleccionar cliente/i });
```

**Implementation audit required:** Before first E2E run, verify `data-testid="contact-manager"` and `data-testid="contact-manager-row"` are applied in `ClienteDetailView.tsx` to the ContactManager container and each contact row respectively. If siesa-ui-kit ContactManager does not support `data-testid` props, use `getByRole('list')` within the detail panel scope.

---

## 8. Coverage Matrix — Epic 4

| Requirement | Test IDs | Level | Status |
|---|---|---|---|
| AC-E4.1 (associate from client detail without nav) | E2E-AC-04, API-AC-01, API-AC-02 | E2E + API | Designed |
| AC-E4.2 (see contacts, navigate in ≤ 2 clicks) | E2E-AC-01, E2E-AC-10, E2E-AC-11 | E2E | Designed |
| AC-E4.3 (navigate to client in 1 click from contact) | E2E-AC-14 | E2E | Designed |
| AC-E4.4 (disassociate without deleting) | E2E-AC-05, API-AC-03, API-AC-04 | E2E + API | Designed |
| AC-E4.5 (filter orphan contacts) | E2E-AC-16, E2E-AC-17, API-AC-06 | E2E + API | Designed |
| AC-E4.6 (reassign contact to different client) | E2E-AC-20, E2E-AC-21, API-AC-05 | E2E + API | Designed |
| AC-E4.7 (changes immediately visible) | E2E-AC-06, E2E-AC-22 | E2E | Designed |
| FR17 (associate contact to client) | E2E-AC-04, API-AC-01, API-AC-02, UNIT-B-AC-01 | All levels | Designed |
| FR18 (create contact auto-associated) | E2E-AC-07 | E2E | Designed |
| FR19 (see contacts in client detail / ContactManager) | E2E-AC-01, E2E-AC-02, API-AC-07 | E2E + API | Designed |
| FR20 (disassociate contact — clienteId = null) | E2E-AC-05, API-AC-03, API-AC-04, UNIT-B-AC-02 | All levels | Designed |
| FR21 (ContactManager in client detail view) | E2E-AC-01, E2E-AC-02, E2E-AC-03, UNIT-AC-01 | E2E + Unit | Designed |
| FR22 (navigate from client to contact) | E2E-AC-10, E2E-AC-11 | E2E | Designed |
| FR23 (client name displayed in contact detail) | E2E-AC-13, E2E-AC-15 | E2E | Designed |
| FR24 (navigate from contact to client) | E2E-AC-14 | E2E | Designed |
| FR25 (orphan contacts filter) | E2E-AC-16, E2E-AC-17, E2E-AC-18, E2E-AC-19, API-AC-06 | E2E + API | Designed |
| FR26 (reassign contact) | E2E-AC-20, E2E-AC-21, E2E-AC-22, API-AC-05 | E2E + API | Designed |
| FR27 (immediate visibility after changes) | E2E-AC-06, E2E-AC-22 | E2E | Designed |
| NFR2 (CRUD changes < 2s) | E2E-AC-04, E2E-AC-05, E2E-AC-21 (P2 timing) | E2E | Designed |
| NFR5 (input validation) | API-AC-09 | API | Designed |
| NFR6 (no stack traces) | API-AC-08, API-AC-09 | API | Designed |
| NFR8 (≤ 2 clicks client → contact) | E2E-AC-10, E2E-AC-11 | E2E | Designed |
| NFR9 (no extra nav for contact's client) | E2E-AC-13 | E2E | Designed |
| R3 disassociate does not delete record | API-AC-04, E2E-AC-05 | API + E2E | Designed |
| R12 ON DELETE SET NULL cascade | API-AC-10, UNIT-B-AC-04 | API + Unit | Designed |
| ClienteContactServiceAdapter URL correctness | UNIT-AC-01, UNIT-AC-02, UNIT-AC-03 | Unit | Designed |
| Orphan filter client-side logic | UNIT-AC-04, UNIT-AC-05 | Unit | Designed |

**Coverage: 27/27 requirements addressed — 100%**

---

## 9. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|---|---|---|---|---|
| P0 | 20 | 2.0 | 40 | Complex setup, cache invalidation, navigation assertions |
| P1 | 20 | 1.0 | 20 | Standard coverage, backend unit tests |
| P2 | 5 | 0.5 | 2.5 | Mobile + timing assertions |
| P3 | 4 | 0.25 | 1.0 | Cross-browser + exploratory |
| **Total** | **49** | — | **63.5** | **~8 days** |

### Prerequisites

**Test Data:**
- `buildCliente()` factory — already in `data.helper.ts`
- `buildContacto()` factory — already in `data.helper.ts`
- `asignarClienteAContacto()` helper — already in `api.helper.ts`

**POM Extension:**
- Extend `ClientesPage` with ContactManager locators (see Section 7) — 1 hour

**Tooling:**
- Playwright `APIRequestContext` for API tests
- `page.route()` for network interception in error scenarios
- `page.on('request', ...)` listener for cache invalidation verification

**Environment:**
- PostgreSQL running with `ON DELETE SET NULL` cascade applied (migration in place)
- Both frontend (port 5173) and backend (port 5000) running

---

## 10. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations (R1–R6)**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths (association/disassociation/reassign)**: 100%
- **Navigation paths (NFR8, NFR9)**: 100%
- **Cache invalidation verification**: 100%
- **Error responses (Problem Details, no stack traces)**: 100%
- **Business logic (clienteId = null on disassociation)**: 100%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (20 tests)
- [ ] API-AC-04 confirms contact record survives disassociation (R3 mitigated)
- [ ] E2E-AC-11 confirms 2-click navigation from client list to contact detail (NFR8)
- [ ] E2E-AC-22 confirms no page.reload() after reassignment (R1 mitigated)
- [ ] API-AC-06 confirms `GET /contactos?sinCliente=true` filter works (FR25)
- [ ] API-AC-08 and API-AC-09 confirm no stack traces in error responses (NFR6)

---

## 11. Definition of Done (Epic 4 Testing)

- [ ] All 20 P0 test cases pass before any story is considered dev-complete
- [ ] All 20 P1 test cases pass before Epic 4 is closed
- [ ] `ClientesPage` POM extended with ContactManager locators; `data-testid="contact-manager-row"` confirmed present in `ClienteDetailView.tsx`
- [ ] `asociacion-api.spec.ts` passes fully against running backend — confirms `PUT /api/v1/contactos/{id}/cliente` REST contract
- [ ] API-AC-04 confirms `clienteId: null` in GET response after disassociation — ensures no deletion (FR20)
- [ ] E2E-AC-11 confirms exactly 2 clicks from `/clientes` to contact detail (NFR8)
- [ ] No test uses `page.reload()` in association/disassociation/reassignment flows — FR27 enforced
- [ ] All Spanish text assertions use case-insensitive regex
- [ ] `afterEach` cleanup in all spec files deletes created clients and contacts via `apiHelper`
- [ ] `page.on('pageerror', ...)` listener added to navigation tests (E2E-AC-10, E2E-AC-14)
- [ ] EF Core migration for ON DELETE SET NULL confirmed applied before running API-AC-10

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` — Risk scoring methodology (probability × impact)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision framework
- `test-priorities-matrix.md` — P0–P3 prioritization criteria

### Related Documents

- Epic Source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD Feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md`
- Test Design Epic 3 (reference): `_bmad-output/implementation-artifacts/test-design-epic-3.md`
- API Helper: `e2e/helpers/api.helper.ts`
- Data Helper: `e2e/helpers/data.helper.ts`
- Contactos POM: `e2e/pages/contactos.page.ts`
- Clientes POM: `e2e/pages/clientes.page.ts`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: Epic-Level (Phase 4)
