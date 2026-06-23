---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-23"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: Draft
---

# Test Design — Epic 2: Client Management

**Date:** 2026-06-23
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (Stories 2.1–2.6)

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥6): 5
- Critical categories: DATA, SEC, PERF, BUS, TECH

**Coverage Summary:**

- P0 scenarios: 14 (28.0 hours)
- P1 scenarios: 18 (18.0 hours)
- P2 scenarios: 12 (6.0 hours)
- P3 scenarios: 4 (1.0 hour)
- **Total effort**: 53.0 hours (~6.6 days)

---

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers the complete client management module: a scrollable left-panel list with real-time search and sort, a right-panel detail view supporting deep linking, and full CRUD operations (create, edit, delete) with field validation, confirmation dialogs, and toast notifications. Contacts associated with deleted clients are automatically disassociated (SET NULL) rather than deleted.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time filter, empty state, error state, 500-record performance |
| 2.2 | Client Detail View | Panel rendering, deep linking `/clientes/:id`, not-found graceful handling |
| 2.3 | Create Client | Form validation, NIT uniqueness (409), optimistic update, toast |
| 2.4 | Edit Client | Pre-fill accuracy, update mutation, cancel preserves data |
| 2.5 | Delete Client | Confirmation dialog, contact disassociation (SET NULL), toast |
| 2.6 | Sort Client List | Client-side sort (4 criteria), filter+sort interaction, default order |

### Out of Scope for This Epic

- Contact management (Epic 3) — contactos CRUD not tested here
- Client-Contact association (Epic 4)
- Authentication / authorization — deferred MVP
- Server-side pagination — NFR10 scope is 500 records (client-side sufficient)

---

## 2. Risk Assessment

### Risk Matrix

#### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-E2-01 | DATA | DELETE client cascade: contacts not set to `cliente_id = NULL` (ON DELETE SET NULL not configured in EF Core FK) — orphaned FK references or accidental contact deletion | 3 | 3 | 9 | Integration test verifying `contactos.cliente_id = NULL` after client deletion; assert contacts still exist in DB | QA/DEV | Sprint |
| R-E2-02 | BUS | NIT/RUC duplicate: backend returns 409 but frontend shows generic error or crashes instead of "El NIT/RUC ya está registrado" | 3 | 2 | 6 | API integration test asserting 409 body; component test asserting correct error message rendered without technical details (NFR6) | QA | Sprint |
| R-E2-03 | PERF | Search over 500 records exceeds 1-second threshold (NFR1): client-side `useMemo` filter not memoized correctly or runs on every keystroke without debounce | 2 | 3 | 6 | Performance test: 500-record dataset + rapid keystroke simulation; assert render time < 1000ms | QA | Sprint |
| R-E2-04 | SEC | Input fields (Nombre, NIT, Teléfono, Ciudad) accept and persist raw HTML/script content — XSS via stored data rendered without sanitization | 2 | 3 | 6 | API integration test: POST `<script>alert(1)</script>` as Nombre, verify backend sanitizes (FluentValidation) or frontend escapes on render | QA/DEV | Sprint |
| R-E2-05 | TECH | `queryClient.invalidateQueries(['clientes'])` not called after mutation — list does not update after create/edit/delete (FR27 violation) | 2 | 3 | 6 | Component tests for each mutation hook asserting `invalidateQueries` called with correct key; E2E verifying list reflects changes | QA/DEV | Sprint |

#### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-E2-06 | BUS | Required field validation: frontend Zod schema not blocking form submission when fields are empty — backend receives invalid data | 2 | 2 | 4 | Component test: submit form with empty fields, assert inline errors shown, assert `mutationFn` NOT called | QA/DEV |
| R-E2-07 | TECH | Sort applied to unfiltered array instead of filtered result — search filter cleared when sort changes (AC-E2.6) | 2 | 2 | 4 | Component test: apply search filter, change sort, assert filtered set is sorted (not full list) and search input unchanged | QA |
| R-E2-08 | BUS | Cancel button on edit form does not discard changes — original values overwritten in UI state or cache | 2 | 2 | 4 | Component test: modify fields, click Cancel, assert detail panel shows original values | QA |
| R-E2-09 | BUS | Confirmation dialog for delete not shown — client deleted immediately on button click without confirmation (AC-E2.5) | 2 | 2 | 4 | Component test: click Eliminar, assert dialog appears before deletion; assert deletion does NOT occur until Confirmar clicked | QA |
| R-E2-10 | TECH | Deep linking `/clientes/:clienteId` fails when URL accessed directly (no prior navigation) — query hook not initialized without list context | 1 | 3 | 3 | E2E test: navigate directly to `/clientes/{known-id}`, assert client detail rendered | QA |

#### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-E2-11 | OPS | Toast notifications not registered in React tree (Toaster component missing in root layout) — no toasts visible for any operation | 1 | 2 | 2 | Smoke test: create a client, assert toast appears | Monitor |
| R-E2-12 | BUS | Default sort "Más reciente" not applied on initial page load — list rendered in arbitrary DB insertion order instead of `fecha-desc` | 1 | 1 | 1 | Component test: verify SortControl default selection is `fecha-desc` on mount | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

### Top 3 Risk Areas for Epic 2

1. **Contact disassociation on client delete** (R-E2-01, score 9) — accidental contact data loss or orphaned FK references are irreversible data integrity failures. EF Core FK cascade configuration is critical and easy to misconfigure.
2. **Real-time list invalidation after mutations** (R-E2-05, score 6) — if `invalidateQueries` uses a wrong key or is omitted, the entire FR27 ("changes visible immediately") guarantee breaks silently, with the stale list appearing correct until manual refresh.
3. **Search performance with 500 records** (R-E2-03, score 6) — NFR1 requires sub-1-second response; an un-memoized filter or missing debounce can cause visible lag with the maximum expected dataset.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)           ▌▌▌▌▌▌           6 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌  14 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 18 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌▌▌▌▌       10 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                         48 tests
```

### Rationale

- **Component tests dominate** (18) because Epic 2 is UI-interaction-heavy: forms, dialogs, real-time search, sort state, empty/error states, and optimistic feedback are all component-level concerns that Vitest+RTL covers efficiently with MSW for API mocking.
- **API integration tests** (14) cover the backend contract surface: CRUD endpoints, FluentValidation error shapes, 409 uniqueness enforcement, Problem Details format, and the critical ON DELETE SET NULL behavior.
- **E2E tests** (6) cover full user journeys that require frontend + backend running together: create client end-to-end, deep linking to `/clientes/:id`, and delete with contact disassociation verification.
- **Unit tests** (10) cover the Zod validation schema edge cases, sort algorithm purity (`nombre-asc/desc`, `fecha-asc/desc`), and backend command handler logic in isolation.
- Sorting is **exclusively client-side** (no API call) — verified by component tests asserting no `fetch` triggered, not by E2E.

---

## 4. Test Cases by Priority

### P0 (Critical) — Run on every commit

**Criteria**: Blocks core journey + High risk (score ≥6) + No workaround

---

#### TC-E2-P0-01: Client list renders all clients on page load

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2 (list visible), AC-E2.1
**Risk covered:** R-E2-05

**Precondition:** MSW mocks `GET /api/v1/clientes` returning 3 fixture clients.

**Test Steps:**
1. Render `ClienteListView` wrapped in `QueryClientProvider` and MSW handler.
2. Wait for loading to complete.
3. Assert 3 client list items are rendered.

**Expected Result:**
- 3 `ClientListItem` components visible, each showing Nombre and NIT/RUC.
- No error panel or empty state shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-02: Real-time search filters client list by Nombre

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2 (search by nombre, < 1 second)
**Risk covered:** R-E2-03

**Precondition:** MSW returns 5 clients. Search input rendered.

**Test Steps:**
1. Render `ClienteListView` with 5 mocked clients.
2. Type "Ace" in the search field using `userEvent.type`.
3. Assert only clients whose Nombre or NIT includes "Ace" are shown.
4. Assert remaining clients are not present in the DOM.

**Expected Result:**
- Filtered list updates reactively (no button press).
- Non-matching clients removed from visible list.

**Automation:** Vitest + RTL.

---

#### TC-E2-P0-03: Search filters client list by NIT/RUC

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2
**Risk covered:** R-E2-03

**Precondition:** MSW returns 5 clients with distinct NITs.

**Test Steps:**
1. Render `ClienteListView`.
2. Type partial NIT string in search field.
3. Assert only matching clients shown.

**Expected Result:**
- Only clients matching NIT appear.

**Automation:** Vitest + RTL.

---

#### TC-E2-P0-04: Empty state shown when no clients exist

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-2.1 (EmptyState component with guidance message)

**Precondition:** MSW returns empty array `[]`.

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for data load.
3. Assert `EmptyState` component is rendered.
4. Assert message guides user to create first client.

**Expected Result:**
- EmptyState component visible.
- No list items rendered.

**Automation:** Vitest + RTL.

---

#### TC-E2-P0-05: Error panel shown when API fails to load clients

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-2.1 (ErrorPanel with "Reintentar" button on fetch failure)

**Precondition:** MSW returns 500 for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for query to fail.
3. Assert `ErrorPanel` component rendered.
4. Assert "Reintentar" button is present and accessible.

**Expected Result:**
- ErrorPanel visible with retry button.
- No client list or empty state shown.

**Automation:** Vitest + RTL + MSW (network error handler).

---

#### TC-E2-P0-06: Create client — successful submission creates client and shows toast

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, AC-2.3 (client created, appears in list, toast shown)
**Risk covered:** R-E2-05, R-E2-11

**Precondition:** Frontend + backend running. PostgreSQL accessible.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente".
3. Fill in Nombre, NIT/RUC, Teléfono, Ciudad with valid unique values.
4. Submit form.
5. Assert success toast "Cliente creado correctamente" appears.
6. Assert new client appears in left-panel list without page reload.
7. Assert URL updates to `/clientes/{new-id}`.

**Expected Result:**
- Client created and immediately visible in list (FR27).
- Toast shown.
- URL reflects new client ID.

**Automation:** Playwright E2E.

---

#### TC-E2-P0-07: Create client — backend rejects empty required fields (400)

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-E2.4, AC-2.3 (FluentValidation, FR8)
**Risk covered:** R-E2-06

**Precondition:** Backend running with `WebApplicationFactory`.

**Test Steps:**
1. POST `/api/v1/clientes` with empty body `{}`.
2. Inspect response.

**Expected Result:**
- HTTP 400.
- `Content-Type: application/problem+json`.
- Response contains `errors` object with keys for each required field (Nombre, NIT, Teléfono, Ciudad).

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-08: Create client — backend returns 409 on duplicate NIT/RUC

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-2.3 (409 on duplicate NIT, NFR6)
**Risk covered:** R-E2-02

**Precondition:** A client with NIT "12345678" already exists in DB.

**Test Steps:**
1. POST `/api/v1/clientes` with the same NIT "12345678".
2. Inspect response body.

**Expected Result:**
- HTTP 409.
- Response body: Problem Details with `detail` or `errors` indicating NIT conflict.
- Response does NOT contain stack trace, exception type, or internal message (NFR6).

**Automation:** xUnit integration test.

---

#### TC-E2-P0-09: Frontend shows "El NIT/RUC ya está registrado" on 409

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-2.3 (user-friendly error on 409, NFR6)
**Risk covered:** R-E2-02

**Precondition:** MSW intercepts POST and returns 409 Problem Details.

**Test Steps:**
1. Render `ClienteForm` in create mode.
2. Fill all required fields with valid data.
3. Submit form.
4. MSW handler returns 409.
5. Assert error message "El NIT/RUC ya está registrado" visible.
6. Assert no technical error detail (no "conflict", "409", exception class name) shown.

**Expected Result:**
- User-friendly error message rendered.
- Form NOT reset (user can correct NIT and retry).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-10: Delete client — contacts disassociated (cliente_id set to NULL)

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** AC-2.5 (contacts become unassigned, FR25, ON DELETE SET NULL)
**Risk covered:** R-E2-01

**Precondition:** Client with ID `{cid}` exists. Two contacts with `cliente_id = {cid}` exist.

**Test Steps:**
1. DELETE `/api/v1/clientes/{cid}`.
2. Query contacts table: `SELECT id, cliente_id FROM contactos WHERE id IN ({contact1_id}, {contact2_id})`.

**Expected Result:**
- DELETE returns HTTP 204.
- Both contacts still exist in DB.
- `cliente_id` is NULL for both contacts.
- No contact records deleted.

**Automation:** xUnit integration test with `TestContainers` (Postgres) or test DB.

---

#### TC-E2-P0-11: Delete client — list update and toast shown

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** AC-2.5 (client removed from list, panel resets, toast shown)
**Risk covered:** R-E2-05

**Precondition:** Frontend + backend running. At least one client exists.

**Test Steps:**
1. Navigate to `/clientes`.
2. Select a client from the list.
3. Click "Eliminar".
4. Confirm in dialog.
5. Assert toast "Cliente eliminado correctamente" appears.
6. Assert deleted client no longer in left-panel list.
7. Assert right panel returns to empty/default state.

**Expected Result:**
- Client removed from list immediately (FR27).
- Toast shown.
- Right panel cleared.

**Automation:** Playwright E2E.

---

#### TC-E2-P0-12: Inline validation errors shown when required fields empty on submit

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, AC-2.3, AC-2.4 (FR8)
**Risk covered:** R-E2-06

**Precondition:** `ClienteForm` rendered (create mode).

**Test Steps:**
1. Render `ClienteForm` without filling any field.
2. Click submit button.
3. Assert inline error messages appear for each required field (Nombre, NIT/RUC, Teléfono, Ciudad).
4. Assert `useCreateCliente` mutation function NOT called.

**Expected Result:**
- 4 inline error messages visible.
- API call not triggered.

**Automation:** Vitest + RTL.

---

#### TC-E2-P0-13: API CRUD — all 5 client endpoints return correct HTTP status codes

**Level:** API Integration (xUnit)
**Story:** 2.1–2.5
**Requirement:** FR1–FR6, architecture contract
**Risk covered:** R-E2-05

**Test Steps (one test per endpoint):**
1. GET `/api/v1/clientes` → assert 200, body is array.
2. POST `/api/v1/clientes` with valid data → assert 201, body contains `id`.
3. GET `/api/v1/clientes/{id}` → assert 200, body matches created client.
4. PUT `/api/v1/clientes/{id}` with updated Nombre → assert 200, body has new Nombre.
5. DELETE `/api/v1/clientes/{id}` → assert 204, no body.

**Expected Result:**
- Each endpoint returns documented HTTP status.
- Response shapes match architecture contract (direct array for list, direct object for single, 204 for delete).

**Automation:** xUnit integration tests (5 separate test methods).

---

#### TC-E2-P0-14: Search performance — filter 500 records under 1 second

**Level:** Component (Vitest + RTL + performance assertion)
**Story:** 2.1
**Requirement:** NFR1 (< 1s with 500 records), AC-E2.2
**Risk covered:** R-E2-03

**Precondition:** MSW returns 500 fixture clients. Search input mounted.

**Test Steps:**
1. Render `ClienteListView` with 500-record fixture.
2. Record `performance.now()` before typing.
3. Type a 4-character search string.
4. Record `performance.now()` after re-render completes.
5. Assert elapsed time < 1000ms.

**Expected Result:**
- Filter completes and DOM updates in under 1 second.

**Automation:** Vitest with `performance.now()` measurement.

**Total P0:** 14 tests, 28.0 hours

---

### P1 (High) — Run on PR to main

**Criteria**: Important user features + Medium risk (score 3-4) + Common workflows

---

#### TC-E2-P1-01: Client detail panel shows all fields when client selected

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** AC-2.2 (Nombre, NIT/RUC, Teléfono, Ciudad visible in right panel)

**Test Steps:**
1. Render split-panel layout with a selected client.
2. Assert right panel shows Nombre, NIT/RUC, Teléfono, Ciudad.

**Expected Result:**
- All 4 fields displayed with correct fixture values.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-02: Deep link — navigate directly to /clientes/:clienteId

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (FR30 deep linking)
**Risk covered:** R-E2-10

**Precondition:** A client with known ID exists in DB. Backend + frontend running.

**Test Steps:**
1. Navigate directly to `http://localhost:5173/clientes/{known-id}`.
2. Assert client detail panel renders the correct client data.

**Expected Result:**
- Client detail shown with correct Nombre and NIT.
- No redirect or blank screen.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-03: Not-found graceful handling for invalid clienteId in URL

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** AC-2.2 (not-found message on invalid ID)

**Precondition:** MSW returns 404 for `GET /api/v1/clientes/{unknown-id}`.

**Test Steps:**
1. Render route `/clientes/non-existent-uuid`.
2. Wait for query.
3. Assert not-found message rendered gracefully.

**Expected Result:**
- Graceful not-found component visible.
- No uncaught exception or blank screen.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: URL updates to /clientes/:clienteId when client selected from list

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** AC-2.2 (FR30)

**Test Steps:**
1. Render client list.
2. Click a client item.
3. Assert URL (or router state) updates to `/clientes/{clicked-id}`.

**Expected Result:**
- URL contains the client's UUID after click.

**Automation:** Vitest + RTL + TanStack Router test utilities.

---

#### TC-E2-P1-05: Edit client — form pre-filled with current values

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (pre-fill on edit, FR6)

**Precondition:** Client detail view rendered with a fixture client.

**Test Steps:**
1. Click "Editar".
2. Assert `ClienteForm` opens in edit mode.
3. Assert each input field value matches the fixture client's current field values.

**Expected Result:**
- All 4 fields pre-filled correctly.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-06: Edit client — save updates list and detail immediately

**Level:** E2E (Playwright)
**Story:** 2.4
**Requirement:** AC-2.4 (FR27 — changes visible immediately)
**Risk covered:** R-E2-05

**Precondition:** Frontend + backend running. A client exists.

**Test Steps:**
1. Navigate to `/clientes/{id}`.
2. Click "Editar".
3. Change Nombre to a new value.
4. Submit.
5. Assert toast "Cliente actualizado correctamente".
6. Assert new Nombre appears in both detail panel and list panel.

**Expected Result:**
- Changes reflected immediately in both panels without page reload.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-07: Edit client — cancel discards changes

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (cancel preserves original data)
**Risk covered:** R-E2-08

**Test Steps:**
1. Render client detail + edit form with fixture client.
2. Modify the Nombre field to a new value.
3. Click "Cancelar".
4. Assert detail panel shows original Nombre (not the modified value).
5. Assert mutation hook NOT called.

**Expected Result:**
- Original data unchanged.
- No API call triggered.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-08: Delete client — confirmation dialog appears before deletion

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (confirmation dialog with Confirmar/Cancelar)
**Risk covered:** R-E2-09

**Test Steps:**
1. Render client detail.
2. Click "Eliminar".
3. Assert dialog with text "¿Eliminar este cliente?" appears.
4. Assert "Confirmar" and "Cancelar" buttons present.
5. Assert deletion mutation NOT called yet.

**Expected Result:**
- Dialog shown before any deletion.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-09: Delete client — cancel in dialog preserves client

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (cancel in dialog — no deletion)
**Risk covered:** R-E2-09

**Test Steps:**
1. Render client detail.
2. Click "Eliminar".
3. Click "Cancelar" in dialog.
4. Assert dialog closes.
5. Assert deletion mutation NOT called.
6. Assert client detail still visible.

**Expected Result:**
- Client record unchanged.
- No API call.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-10: Delete client with contacts — toast message includes contact warning

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (toast mentions contacts unassigned when contacts existed)
**Risk covered:** R-E2-01

**Precondition:** MSW returns client that has contacts. Delete mutation succeeds.

**Test Steps:**
1. Render delete flow for a client with associated contacts (mocked).
2. Confirm deletion.
3. Assert toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

**Expected Result:**
- Extended toast message shown when contacts were present.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Sort Nombre A→Z reorders list ascending (no new API call)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6 (client-side sort, no re-fetch)
**Risk covered:** R-E2-07

**Precondition:** 5 clients with random names loaded via MSW.

**Test Steps:**
1. Render `ClienteListView` with 5 clients.
2. Select "Nombre A→Z" from `SortControl`.
3. Assert list items are in alphabetical ascending order by Nombre.
4. Assert no additional `GET /api/v1/clientes` call was made.

**Expected Result:**
- List reordered client-side.
- No fetch triggered.

**Automation:** Vitest + RTL (spy on MSW fetch count).

---

#### TC-E2-P1-12: Sort Nombre Z→A reorders list descending

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6

**Test Steps:**
1. Select "Nombre Z→A" from `SortControl`.
2. Assert list items in reverse alphabetical order.

**Expected Result:**
- Descending alphabetical order confirmed.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-13: Sort "Más reciente" orders by createdAt descending

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6

**Test Steps:**
1. Load clients with known `createdAt` dates.
2. Select "Más reciente".
3. Assert newest (largest `createdAt`) appears first.

**Expected Result:**
- List ordered newest first.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: Sort "Más antiguo" orders by createdAt ascending

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6

**Test Steps:**
1. Select "Más antiguo".
2. Assert oldest (smallest `createdAt`) appears first.

**Expected Result:**
- List ordered oldest first.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-15: Sort applied to filtered result, search input preserved

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6 (sort + filter independent)
**Risk covered:** R-E2-07

**Test Steps:**
1. Load 10 clients (5 matching "Tech", 5 not matching).
2. Type "Tech" in search field.
3. Assert 5 results shown.
4. Select "Nombre Z→A" from SortControl.
5. Assert only the 5 "Tech" clients remain, ordered Z→A.
6. Assert search input still contains "Tech".

**Expected Result:**
- Sort applied to filtered subset only.
- Search input not cleared.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-16: Default sort is "Más reciente" on initial load

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (default `fecha-desc`)
**Risk covered:** R-E2-12

**Test Steps:**
1. Render `ClienteListView` with no persisted sort preference.
2. Assert SortControl has `fecha-desc` selected by default.
3. Assert list is ordered newest first.

**Expected Result:**
- Default sort active without user interaction.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-17: Backend GET /api/v1/clientes returns all clients as array

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirement:** FR1

**Test Steps:**
1. Seed 3 clients.
2. GET `/api/v1/clientes`.
3. Assert 200 with array of 3 `ClienteDto` objects, each with `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

**Expected Result:**
- Correct response shape per architecture contract.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-18: Backend GET /api/v1/clientes/:id returns 404 for unknown ID

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirement:** FR3

**Test Steps:**
1. GET `/api/v1/clientes/{random-uuid}`.
2. Assert 404 Problem Details.

**Expected Result:**
- 404 with Problem Details body (no stack trace).

**Automation:** xUnit integration test.

**Total P1:** 18 tests, 18.0 hours

---

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary features + Low risk (score 1-2) + Edge cases

---

#### TC-E2-P2-01: Zod schema rejects empty Nombre field

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirement:** FR8

**Test Steps:**
1. Call `clienteSchema.parse({ nome: '', nit: '123', telefono: '555', ciudad: 'Bogotá' })`.
2. Assert ZodError thrown for `nombre` field.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-02: Zod schema rejects empty NIT/RUC field

**Level:** Unit (Vitest)

**Test Steps:**
1. Parse schema with empty `nit`.
2. Assert ZodError for `nit`.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-03: Zod schema rejects empty Teléfono

**Level:** Unit (Vitest)

**Test Steps:**
1. Parse schema with empty `telefono`.
2. Assert ZodError for `telefono`.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-04: Zod schema rejects empty Ciudad

**Level:** Unit (Vitest)

**Test Steps:**
1. Parse schema with empty `ciudad`.
2. Assert ZodError for `ciudad`.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-05: Sort function — unit test for nombre-asc

**Level:** Unit (Vitest)
**Story:** 2.6

**Test Steps:**
1. Import sort utility used by `SortControl`.
2. Pass unsorted array, apply `nombre-asc`.
3. Assert result matches alphabetically ascending order.

**Automation:** Vitest pure unit test.

---

#### TC-E2-P2-06: Sort function — unit test for fecha-desc and fecha-asc

**Level:** Unit (Vitest)
**Story:** 2.6

**Test Steps:**
1. Apply `fecha-desc` and `fecha-asc` to array with known dates.
2. Assert correct ordering for each.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-07: Backend FluentValidation — NIT too long rejected (if max length defined)

**Level:** API Integration (xUnit)
**Story:** 2.3

**Test Steps:**
1. POST with NIT string of 256 characters.
2. Assert 400 with validation error on `nit`.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-08: Backend PUT /api/v1/clientes/:id returns 404 for unknown ID

**Level:** API Integration (xUnit)
**Story:** 2.4

**Test Steps:**
1. PUT `/api/v1/clientes/{random-uuid}` with valid body.
2. Assert 404 Problem Details.

**Automation:** xUnit.

---

#### TC-E2-P2-09: Backend DELETE /api/v1/clientes/:id returns 404 for unknown ID

**Level:** API Integration (xUnit)
**Story:** 2.5

**Test Steps:**
1. DELETE `/api/v1/clientes/{random-uuid}`.
2. Assert 404 Problem Details.

**Automation:** xUnit.

---

#### TC-E2-P2-10: Create client toast success message appears

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-2.3
**Risk covered:** R-E2-11

**Precondition:** MSW returns 201 on POST.

**Test Steps:**
1. Submit form with valid data.
2. Assert toast "Cliente creado correctamente" visible.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-11: Edit client toast success message appears

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4

**Precondition:** MSW returns 200 on PUT.

**Test Steps:**
1. Submit edit form with valid changes.
2. Assert toast "Cliente actualizado correctamente".

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-12: XSS — script tag in Nombre rendered as escaped text

**Level:** API Integration (xUnit) + Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** NFR5, NFR6
**Risk covered:** R-E2-04

**Test Steps:**
1. (API) POST `{ "nombre": "<script>alert(1)</script>", ... }` — assert backend either rejects (400) or sanitizes before persisting.
2. (Component) Mock GET returns client with `nombre: "<script>alert(1)</script>"` — render `ClientListItem` — assert text content equals literal `<script>alert(1)</script>` (escaped, not executed).

**Expected Result:**
- Script not executed in either case.
- React's default escaping prevents XSS on render.

**Automation:** xUnit + Vitest + RTL.

**Total P2:** 12 tests, 6.0 hours

---

### P3 (Low) — Run on-demand

---

#### TC-E2-P3-01: Client list accessible with keyboard navigation

**Level:** Component (Vitest + RTL)
**Story:** 2.1

**Test Steps:**
1. Render `ClienteListView`.
2. Use keyboard Tab + Enter to select a client.
3. Assert detail panel updates.

**Automation:** Vitest + RTL + `@testing-library/user-event`.

---

#### TC-E2-P3-02: Form accessible — ARIA labels present on required fields

**Level:** Component (Vitest + RTL)
**Story:** 2.3

**Test Steps:**
1. Render `ClienteForm`.
2. Assert each input has an associated `<label>` or `aria-label` with Spanish text.

**Automation:** Vitest + RTL + `axe-core` (or manual ARIA assertion).

---

#### TC-E2-P3-03: SortControl renders with correct option identifiers

**Level:** Unit (Vitest)
**Story:** 2.6

**Test Steps:**
1. Render `SortControl`.
2. Assert options `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc` are present.

**Automation:** Vitest + RTL.

---

#### TC-E2-P3-04: Backend response dates are ISO 8601 with timezone

**Level:** API Integration (xUnit)
**Story:** 2.1–2.5

**Test Steps:**
1. GET `/api/v1/clientes` with seeded data.
2. Assert `createdAt` and `updatedAt` match pattern `\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z` (ISO 8601 with offset).

**Automation:** xUnit.

**Total P3:** 4 tests, 1.0 hour

---

## 5. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Test Cases | Level | Priority |
|-----------------|------------|-------|----------|
| AC-E2.1: Register client, appears in list immediately | TC-E2-P0-06 | E2E | P0 |
| AC-E2.2: Search by nombre or NIT/RUC, results < 1s | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P0-14 | Component | P0 |
| AC-E2.3: View detail, edit any field, save changes | TC-E2-P1-01, TC-E2-P1-05, TC-E2-P1-06 | E2E + Component | P1 |
| AC-E2.4: Required field validation with clear errors | TC-E2-P0-07, TC-E2-P0-12 | API + Component | P0 |
| AC-E2.5: Delete client, removed from list | TC-E2-P0-10, TC-E2-P0-11, TC-E2-P1-08, TC-E2-P1-09 | API + E2E + Component | P0/P1 |
| AC-E2.6: Sort 4 criteria, filter preserved, no reload | TC-E2-P1-11, TC-E2-P1-12, TC-E2-P1-13, TC-E2-P1-14, TC-E2-P1-15 | Component | P1 |
| AC-2.1: EmptyState component when no clients | TC-E2-P0-04 | Component | P0 |
| AC-2.1: ErrorPanel + Reintentar on fetch failure | TC-E2-P0-05 | Component | P0 |
| AC-2.2: URL updates to /clientes/:id on selection | TC-E2-P1-04 | Component | P1 |
| AC-2.2: Direct URL load shows correct client | TC-E2-P1-02 | E2E | P1 |
| AC-2.2: Not-found message on invalid clienteId | TC-E2-P1-03 | Component | P1 |
| AC-2.3: 409 shows "El NIT/RUC ya está registrado" | TC-E2-P0-08, TC-E2-P0-09 | API + Component | P0 |
| AC-2.3: Success toast "Cliente creado correctamente" | TC-E2-P2-10 | Component | P2 |
| AC-2.4: Form pre-filled with current values on edit | TC-E2-P1-05 | Component | P1 |
| AC-2.4: Cancel preserves original values | TC-E2-P1-07 | Component | P1 |
| AC-2.4: Toast "Cliente actualizado correctamente" | TC-E2-P2-11 | Component | P2 |
| AC-2.5: Confirmation dialog before deletion | TC-E2-P1-08 | Component | P1 |
| AC-2.5: Cancel in dialog — no deletion | TC-E2-P1-09 | Component | P1 |
| AC-2.5: Contacts unassigned (cliente_id = NULL) | TC-E2-P0-10, TC-E2-P1-10 | API + Component | P0/P1 |
| AC-2.6: Default sort "Más reciente" on load | TC-E2-P1-16 | Component | P1 |
| NFR1: Search < 1s with 500 records | TC-E2-P0-14 | Component | P0 |
| NFR5: Input sanitization (XSS) | TC-E2-P2-12 | API + Component | P2 |
| NFR6: No stack trace in error responses | TC-E2-P0-08 | API | P0 |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P0-14 | Component |
| NFR2 | CRUD changes reflect in UI < 2s | TC-E2-P0-06, TC-E2-P1-06, TC-E2-P0-11 | E2E |
| NFR3 | 10 simultaneous users — not applicable for unit scope | Out of scope for Epic 2 testing (load testing deferred) | N/A |
| NFR5 | Input validation/sanitization | TC-E2-P0-07, TC-E2-P2-12 | API + Component |
| NFR6 | No stack traces exposed | TC-E2-P0-08 | API Integration |

---

## 7. Execution Order

```
Phase 1 — API Contract Gate (P0, backend isolated)
  1. TC-E2-P0-07   POST validation (400 empty fields)
  2. TC-E2-P0-08   POST duplicate NIT (409 Problem Details)
  3. TC-E2-P0-13   All 5 CRUD endpoints HTTP status codes
  4. TC-E2-P0-10   DELETE cascades contacts to NULL

Phase 2 — Component Smoke (P0, frontend isolated with MSW)
  5. TC-E2-P0-01   Client list renders from API data
  6. TC-E2-P0-04   Empty state on empty list
  7. TC-E2-P0-05   Error panel on API failure
  8. TC-E2-P0-12   Form validation blocks submission
  9. TC-E2-P0-09   409 shows user-friendly message
 10. TC-E2-P0-14   Search performance 500 records
 11. TC-E2-P0-02   Search by nombre
 12. TC-E2-P0-03   Search by NIT

Phase 3 — P0 E2E (full stack required)
 13. TC-E2-P0-06   Create client end-to-end
 14. TC-E2-P0-11   Delete client end-to-end

Phase 4 — P1 Component Tests
 15. TC-E2-P1-04   URL updates on client selection
 16. TC-E2-P1-03   Not-found on invalid ID
 17. TC-E2-P1-05   Edit form pre-filled
 18. TC-E2-P1-07   Cancel discards changes
 19. TC-E2-P1-08   Delete confirmation dialog shown
 20. TC-E2-P1-09   Cancel in dialog preserves client
 21. TC-E2-P1-10   Delete toast with contact warning
 22. TC-E2-P1-11   Sort A→Z (no re-fetch)
 23. TC-E2-P1-12   Sort Z→A
 24. TC-E2-P1-13   Sort Más reciente
 25. TC-E2-P1-14   Sort Más antiguo
 26. TC-E2-P1-15   Sort applied to filtered set
 27. TC-E2-P1-16   Default sort fecha-desc on load
 28. TC-E2-P1-17   Backend GET list returns array
 29. TC-E2-P1-18   Backend GET single 404

Phase 5 — P1 E2E
 30. TC-E2-P1-01   Detail panel fields
 31. TC-E2-P1-02   Deep link /clientes/:id
 32. TC-E2-P1-06   Edit save E2E

Phase 6 — P2/P3 (nightly/on-demand)
 33-48. TC-E2-P2-01 through TC-E2-P3-04
```

---

## 8. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 14 | 2.0 | 28.0 | CRUD integration, DELETE cascade, performance setup |
| P1 | 18 | 1.0 | 18.0 | Standard component/E2E coverage |
| P2 | 12 | 0.5 | 6.0 | Unit tests + edge cases |
| P3 | 4 | 0.25 | 1.0 | Accessibility + nice-to-have |
| **Total** | **48** | — | **53.0 hours** | **~6.6 days** |

### Prerequisites

**Test Data:**

- `ClienteFactory` — faker-based client generator (Nombre, NIT, Teléfono, Ciudad, createdAt)
- 500-client fixture file for NFR1 performance test
- Seeded test DB with known client+contact relationship for DELETE SET NULL test

**Tooling:**

- Vitest 2+ with `@testing-library/react` and `@testing-library/user-event` — component tests
- MSW (Mock Service Worker) — API mocking for component tests
- Playwright 1.40+ — E2E full-stack tests
- xUnit 2+ with `WebApplicationFactory<Program>` — backend integration tests
- TestContainers (Postgres) — isolated DB for DELETE cascade tests

**Environment:**

- Node.js 20+ with all npm deps installed (`npm install`)
- .NET 10 SDK with all NuGet packages restored
- PostgreSQL 18+ accessible for E2E and integration tests
- Epic 1 foundation must be complete (server running, DB connected)

---

## 9. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (14/14 — no exceptions)
- **P1 pass rate**: ≥95% (17/18 minimum — one waiver with documented reason allowed)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations** (R-E2-01 through R-E2-05): 100% complete before Epic 2 closure

### Coverage Targets

- **Critical paths** (CRUD + validation): ≥80%
- **Security scenarios** (NFR5, NFR6): 100%
- **Business logic** (sort, filter, cancel): ≥70%
- **Data integrity** (DELETE SET NULL): 100%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-14)
- [ ] R-E2-01 mitigated: contacts remain with NULL clienteId after client delete
- [ ] R-E2-02 mitigated: 409 shows user-friendly message, no technical detail
- [ ] R-E2-03 mitigated: 500-record search renders in < 1s
- [ ] R-E2-04 mitigated: XSS input handled by backend validation or React escaping
- [ ] R-E2-05 mitigated: `invalidateQueries(['clientes'])` confirmed for all mutations

---

## 10. Mitigation Plans

### R-E2-01: Contact disassociation on client delete (Score: 9)

**Mitigation Strategy:** Verify `ContactoConfiguration.cs` configures `ON DELETE SET NULL` via `HasOne(...).WithMany(...).OnDelete(DeleteBehavior.SetNull)`. Integration test using TestContainers seeds client with 2 contacts, deletes client, asserts contacts still exist with `cliente_id = NULL`.

**Owner:** DEV (EF Core config) / QA (test verification)
**Timeline:** Story 2.5 implementation
**Status:** Planned
**Verification:** TC-E2-P0-10 must pass with green result

### R-E2-02: NIT uniqueness frontend error message (Score: 6)

**Mitigation Strategy:** Backend `CreateClienteRequestValidator.cs` checks NIT uniqueness and returns 409 Problem Details with specific detail message. Frontend `ClienteForm.tsx` handles `onError` of mutation: if status is 409, display "El NIT/RUC ya está registrado" as form-level error (not toast, not raw API message).

**Owner:** DEV (backend validator + frontend error handler) / QA (TC-E2-P0-08, TC-E2-P0-09)
**Timeline:** Story 2.3 implementation
**Status:** Planned
**Verification:** TC-E2-P0-08 (API level) + TC-E2-P0-09 (component level) both pass

### R-E2-03: Search performance 500 records (Score: 6)

**Mitigation Strategy:** Client-side filter must use `useMemo` with `[clients, searchQuery]` as dependencies. Optional: 150ms debounce on search input to avoid filtering on every keystroke. Verified with TC-E2-P0-14 using 500-record fixture and `performance.now()` assertion.

**Owner:** DEV (memoization + optional debounce) / QA (performance test)
**Timeline:** Story 2.1 implementation
**Status:** Planned
**Verification:** TC-E2-P0-14 passes with elapsed < 1000ms

### R-E2-04: XSS via stored client data (Score: 6)

**Mitigation Strategy:** React renders text content via JSX, which escapes by default — no `dangerouslySetInnerHTML` allowed. Backend `FluentValidation` rejects excessively long or suspicious patterns if defined. Document is a greenfield project — no legacy rendering bypasses expected. TC-E2-P2-12 verifies both layers.

**Owner:** DEV (no dangerouslySetInnerHTML in components) / QA (TC-E2-P2-12)
**Timeline:** Code review gate for Stories 2.1–2.5
**Status:** Planned
**Verification:** TC-E2-P2-12 passes

### R-E2-05: TanStack Query cache invalidation after mutations (Score: 6)

**Mitigation Strategy:** Each mutation hook (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Component tests spy on `queryClient.invalidateQueries`. E2E tests verify list reflects changes visually.

**Owner:** DEV (all 3 mutation hooks) / QA (TC-E2-P0-06, TC-E2-P1-06, TC-E2-P0-11)
**Timeline:** Stories 2.3, 2.4, 2.5 implementation
**Status:** Planned
**Verification:** All three E2E mutation tests pass

---

## 11. Assumptions and Dependencies

### Assumptions

1. Epic 1 is complete: frontend dev server runs on 5173, backend on 5000, PostgreSQL accessible, EF Core foundation working.
2. Sorting is 100% client-side over TanStack Query cache — no search or sort parameters sent to API for Epic 2.
3. No authentication in MVP — all `/api/v1/clientes` endpoints are publicly accessible (no bearer token required in tests).
4. `siesa-ui-kit` `ContactManager` is not used in Epic 2 stories — it belongs to Epic 4. The `ClienteContactServiceAdapter` is not in scope here.
5. `TestContainers` (Postgres) or a dedicated test database is available for DELETE cascade integration tests.

### Dependencies

1. Epic 1 test-complete gate — Required before Epic 2 E2E tests can run (backend + frontend operational)
2. `ClienteFactory` test data utility — Required by Sprint start for integration tests
3. MSW handler setup for `/api/v1/clientes` — Required for all component tests

### Risks to Plan

- **Risk**: TestContainers not available in CI environment
  - **Impact**: TC-E2-P0-10 (DELETE SET NULL) cannot run in isolation
  - **Contingency**: Use a shared test PostgreSQL schema with transaction rollback pattern, or verify cascade via EF Core configuration code review

---

## 12. Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before Story 2.1 implementation begins.
- Run `*automate` for broader coverage after each story is implemented.
- Run `*trace` after Epic 2 is complete to generate traceability matrix and quality gate decision.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam Date: 2026-06-23
- [ ] Tech Lead: SiesaTeam Date: 2026-06-23
- [ ] QA Lead: SiesaTeam Date: 2026-06-23

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories, scoring, gate decision)
- `probability-impact.md` — Probability × impact matrix methodology
- `test-levels-framework.md` — E2E vs API vs Component vs Unit selection
- `test-priorities-matrix.md` — P0-P3 prioritization criteria

### Related Documents

- PRD Feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 1 Test Design (reference): `_bmad-output/test-design-epic-1.md`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
