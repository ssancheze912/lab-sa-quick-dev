---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-11"
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

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers the complete client management feature (CRUD) for the Siesa Agents CRM: commercial team members can register, list, search, view, edit, delete, and sort client records (Nombre, NIT/RUC, Teléfono, Ciudad). The split-panel layout (`/clientes` left panel + detail right panel) with real-time filtering, client-side sorting via SortControl, and optimistic UI updates (TanStack Query) are the core delivery targets.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Client list panel, real-time filter (name/NIT), empty state, error state with retry |
| 2.2 | Client Detail View | Detail panel, deep-link URL `/clientes/:id`, not-found handling |
| 2.3 | Create Client | Form with validation (Zod + FluentValidation), 409 duplicate NIT, toast on success |
| 2.4 | Edit Client | Pre-fill form, update optimistic, cancel without save, inline validation |
| 2.5 | Delete Client | Confirmation dialog, optimistic removal, contact orphan handling, cancel |
| 2.6 | Sort Client List | Client-side sort over TanStack Query cache, 4 sort options, sort + filter composability |

### Out of Scope for This Epic

- Contact management (Epic 3) and Client–Contact association (Epic 4)
- Authentication / authorization — explicitly deferred (MVP)
- Server-side pagination — data model supports it but is not implemented in MVP
- Export / import of client records

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Score | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|-------|----------|---------------------|
| R-001 | **Duplicate NIT/RUC — backend 409 not surfaced to user** — frontend fails to map `409 Conflict` to the inline error message "El NIT/RUC ya está registrado", showing a generic error or silently swallowing it | High | High | 6 | P0 | API integration test: POST duplicate NIT → assert 409; Component test: simulate 409 in MSW → assert inline error text visible |
| R-002 | **Required-field validation bypass** — Zod schema does not align with FluentValidation backend rules, allowing one side to accept data the other rejects; or form submit fires before Zod validates | High | High | 6 | P0 | Unit test Zod schema with empty/partial payloads; API integration test POST with missing fields → assert 400 + Problem Details |
| R-003 | **Contact orphan on client delete** — when a client with associated contacts is deleted, contacts must become `clienteId = null`; if ON DELETE CASCADE is set instead of ON DELETE SET NULL, contact records are permanently lost | Medium | Critical | 6 | P0 | Integration test: create client + contacts → delete client → assert contacts still exist with `clienteId = null` |
| R-004 | **Real-time filter < 1 second with 500 records (NFR1)** — client-side filter over 500-item TanStack Query cache may exceed 1-second render budget on low-end devices | Medium | High | 4 | P1 | Component test with 500 mock records; perf assertion: filter completes within 1000ms |
| R-005 | **Deep-link URL `/clientes/:id` fails on direct access** — TanStack Router must load the detail view from the URL without a prior list navigation (requires data-fetch on mount) | Medium | High | 4 | P1 | E2E test: navigate directly to `/clientes/{uuid}` → assert detail panel shows correct client |
| R-006 | **Optimistic update race condition** — if a user edits a client immediately after another user creates one, TanStack Query cache may be stale and `invalidateQueries` may trigger a re-render mid-form | Low | High | 3 | P1 | Component test: simulate mutation → invalidation → refetch while form is open; assert no data loss |
| R-007 | **Sort does not persist when search filter is changed** — sort state (React `useState`) resets when the search input changes, violating AC-E2.6 | Medium | Medium | 4 | P1 | Component test: set sort + apply filter → assert sort order preserved on filtered result |
| R-008 | **Error panel "Reintentar" button does not re-fetch** — the retry button in the error state triggers navigation or a no-op instead of calling `refetch()` on the TanStack Query | Low | Medium | 2 | P2 | Component test: MSW returns 500 on load → assert ErrorPanel renders → click "Reintentar" → MSW returns 200 → assert list appears |
| R-009 | **NIT uniqueness constraint missing at database level** — `uk_clientes_nit` index not created, allowing duplicate NITs to be inserted if two concurrent requests arrive simultaneously | Low | High | 3 | P2 | API integration test: insert two clients with identical NIT concurrently; assert only one succeeds |
| R-010 | **Problem Details not returned on validation failure** — backend returns 400 with non-RFC 7807 body (e.g., raw validation array), breaking the frontend error parser | Low | Medium | 2 | P2 | API integration test: POST invalid client → assert `Content-Type: application/problem+json` and `errors` map in body |

### Top 3 Risk Areas for Epic 2

1. **Duplicate NIT / 409 mapping (R-001)** — the most user-visible failure point; a generic error or silent failure on duplicate NIT ruins data integrity and UX.
2. **Contact orphan on delete (R-003)** — data loss risk; if contacts are cascade-deleted instead of unassigned, the bug is silent and irreversible in production.
3. **Required-field validation alignment (R-002)** — mismatched Zod vs. FluentValidation rules cause inconsistent UX (form submits to backend, then backend rejects) or security bypass (backend accepts what frontend should have blocked).

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌▌            4 tests
  API Integration (xUnit)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌   14 tests
  Component (Vitest+RTL+MSW)  ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  15 tests
  Unit (Vitest/xUnit)         ▌▌▌▌▌▌▌▌          8 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                           41 tests
```

### Rationale

- **API Integration tests dominate** because the backend owns data integrity (409 conflict, FK constraints, FluentValidation, Problem Details format), and these cannot be adequately tested at the component level.
- **Component tests are the second-largest tier** because the search/sort/form UX interaction logic lives in React — MSW intercepts let us simulate happy-path and error scenarios without a running backend.
- **E2E tests are limited to the 4 highest-value user journeys** (create → verify in list, deep link, delete with orphan check, search < 1s) because E2E tests are the most expensive and fragile.
- **Unit tests cover Zod schema validation and sort utility functions** — pure logic that does not need a DOM or HTTP layer.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: POST /clientes with Duplicate NIT Returns 409 Conflict

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-2.3 — 409 conflict on duplicate NIT/RUC (NFR5)
**Risk covered:** R-001, R-002

**Precondition:** Database seeded with a client `{ nombre: "Acme Corp", nit: "123456789", telefono: "555-0001", ciudad: "Bogotá" }`.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ nombre: "Acme Duplicate", nit: "123456789", telefono: "555-0002", ciudad: "Medellín" }`.
2. Inspect HTTP status code and response body.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Body contains `status: 409`, `title`, `detail` fields (RFC 7807).
- Body does NOT contain stack trace or internal error details.

**Automation:** xUnit integration test with `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-02: POST /clientes with Missing Required Fields Returns 400

**Level:** API Integration
**Story:** 2.3
**Requirement:** FR8, NFR5
**Risk covered:** R-002, R-010

**Test Steps (run for each variant):**
1. POST `/api/v1/clientes` with body `{ nit: "111", telefono: "555", ciudad: "Cali" }` (missing `nombre`).
2. POST `/api/v1/clientes` with body `{ nombre: "Test", telefono: "555", ciudad: "Cali" }` (missing `nit`).
3. POST `/api/v1/clientes` with empty body `{}`.

**Expected Result (each variant):**
- HTTP 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response JSON contains `errors` map identifying the failing field(s).
- No client record created in the database.

**Automation:** xUnit parameterized integration test.

---

#### TC-E2-P0-03: DELETE /clientes/{id} Sets clienteId = null on Associated Contacts

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 — contacts become unassigned after client deletion (FR25)
**Risk covered:** R-003

**Precondition:** Client `C1` (UUID) exists. Contacts `T1` and `T2` exist with `clienteId = C1`.

**Test Steps:**
1. DELETE `/api/v1/clientes/{C1}`.
2. GET `/api/v1/contactos/{T1}` and `/api/v1/contactos/{T2}`.

**Expected Result:**
- DELETE returns HTTP 204 No Content (or 200).
- GET for T1: `clienteId` is `null` (not missing — field must be present with null value).
- GET for T2: `clienteId` is `null`.
- Total contact count in the database is unchanged (no cascade delete).

**Automation:** xUnit integration test with `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P0-04: Create Client Form — Inline Validation Blocks Submit on Empty Fields

**Level:** Component
**Story:** 2.3
**Requirement:** AC-2.3, FR8, AC-E2.4
**Risk covered:** R-002

**Precondition:** `CreateClienteForm` component rendered in isolation. MSW configured to intercept POST (should never be called in this test).

**Test Steps:**
1. Render `<CreateClienteForm onSuccess={mockFn} />`.
2. Without filling any field, click the submit button.
3. Inspect the rendered output.

**Expected Result:**
- MSW `POST /api/v1/clientes` handler is NOT called (zero network requests).
- Inline error messages appear for all four required fields (Nombre, NIT/RUC, Teléfono, Ciudad).
- The submit button remains in non-loading state.

**Automation:** Vitest + `@testing-library/react` + MSW.

---

#### TC-E2-P0-05: Create Client — 409 Response Shows Inline NIT Error

**Level:** Component
**Story:** 2.3
**Requirement:** AC-2.3 — "El NIT/RUC ya está registrado" message (NFR6)
**Risk covered:** R-001

**Precondition:** MSW handler for `POST /api/v1/clientes` returns HTTP 409 with Problem Details body.

**Test Steps:**
1. Render `<CreateClienteForm />`.
2. Fill all required fields with valid data including an NIT value.
3. Submit the form.
4. Wait for the MSW response to be processed.

**Expected Result:**
- Inline error message "El NIT/RUC ya está registrado" is visible on the NIT/RUC field.
- No success toast is shown.
- Form remains open (not dismissed).
- No stack trace or raw server error text is visible to the user.

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

---

#### TC-E2-P1-01: GET /clientes Returns List with All Fields

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR2, FR3, FR4
**Risk covered:** R-004

**Precondition:** Three clients seeded in the database.

**Test Steps:**
1. GET `/api/v1/clientes`.
2. Inspect the response body.

**Expected Result:**
- HTTP 200 OK.
- Response is a JSON array with 3 items.
- Each item contains: `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
- `createdAt` and `updatedAt` are ISO 8601 strings with UTC offset (DateTimeOffset, not plain DateTime).

**Automation:** xUnit integration test.

---

#### TC-E2-P1-02: GET /clientes/{id} Returns 404 for Non-Existent ID

**Level:** API Integration
**Story:** 2.2
**Requirement:** AC-2.2 — not-found handling
**Risk covered:** R-005

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000` (valid UUID, not in DB).

**Expected Result:**
- HTTP 404 Not Found.
- `Content-Type: application/problem+json`.
- Body contains `status: 404` and `title` (RFC 7807).

**Automation:** xUnit integration test.

---

#### TC-E2-P1-03: PUT /clientes/{id} Updates Fields and Returns Updated Record

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR6, FR27

**Precondition:** Client `C1` exists with `nombre: "Original Name"`.

**Test Steps:**
1. PUT `/api/v1/clientes/{C1}` with body `{ nombre: "Updated Name", nit: "999", telefono: "555-9999", ciudad: "Cali" }`.
2. GET `/api/v1/clientes/{C1}`.

**Expected Result:**
- PUT returns HTTP 200 (or 204) with updated data.
- GET confirms `nombre` is "Updated Name" and `updatedAt` is newer than `createdAt`.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-04: DELETE /clientes/{id} Removes Client from List

**Level:** API Integration
**Story:** 2.5
**Requirement:** FR7, AC-E2.5

**Precondition:** Client `C1` exists with no associated contacts.

**Test Steps:**
1. DELETE `/api/v1/clientes/{C1}`.
2. GET `/api/v1/clientes/{C1}`.
3. GET `/api/v1/clientes` and verify C1 is absent.

**Expected Result:**
- DELETE returns HTTP 204.
- Subsequent GET by ID returns 404.
- Client list does not contain C1.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-05: Client List Panel — Real-Time Filter by Name Under 1 Second (500 Records)

**Level:** Component
**Story:** 2.1
**Requirement:** AC-E2.2, NFR1
**Risk covered:** R-004

**Precondition:** MSW returns 500 client records. `ClienteListPanel` rendered with all 500 records visible.

**Test Steps:**
1. Measure render time of initial list (500 records).
2. Type "test" into the search field using `fireEvent.change`.
3. Measure time until the filtered list is visible in the DOM.

**Expected Result:**
- Filter renders within 1000ms (measured via `performance.now()` before/after `fireEvent`).
- Filtered list shows only records where `nombre` or `nit` includes "test" (case-insensitive).
- Records not matching are NOT present in the DOM.

**Automation:** Vitest + RTL. Performance assertion using `performance.now()`.

---

#### TC-E2-P1-06: Client List — Empty State Displayed When No Clients Exist

**Level:** Component
**Story:** 2.1
**Requirement:** AC-2.1 — EmptyState component shown

**Precondition:** MSW returns empty array `[]` for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `<ClientesView />` (or `<ClienteListPanel />`).
2. Wait for query to resolve.

**Expected Result:**
- `EmptyState` component is rendered.
- Message guides user to create the first client.
- Client list items are absent.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: Client List — Error Panel with "Reintentar" Button on Fetch Failure

**Level:** Component
**Story:** 2.1
**Requirement:** AC-2.1 — ErrorPanel with retry button
**Risk covered:** R-008

**Precondition:** MSW returns HTTP 500 on first call, then HTTP 200 with client list on second call.

**Test Steps:**
1. Render `<ClientesView />`.
2. Wait for error state to appear.
3. Assert `ErrorPanel` with "Reintentar" button is displayed.
4. Click "Reintentar".
5. Wait for query to resolve successfully.

**Expected Result:**
- First render: `ErrorPanel` visible with "Reintentar" button.
- After retry click: client list is displayed (not error panel).
- No JavaScript errors thrown.

**Automation:** Vitest + RTL + MSW with per-request handler sequencing.

---

#### TC-E2-P1-08: Client Detail View — URL Updates to /clientes/:id on Selection

**Level:** Component
**Story:** 2.2
**Requirement:** AC-2.2, FR30 (deep linking)
**Risk covered:** R-005

**Precondition:** `ClientesView` rendered with MSW returning two clients. TanStack Router test wrapper applied.

**Test Steps:**
1. Render the full `/clientes` route.
2. Click on the first client list item.
3. Inspect the router location.

**Expected Result:**
- URL changes to `/clientes/{uuid}` where `{uuid}` matches the clicked client's ID.
- Right panel displays the client's Nombre, NIT/RUC, Teléfono, Ciudad.
- No full page reload (router navigation only).

**Automation:** Vitest + RTL + TanStack Router test utilities + MSW.

---

#### TC-E2-P1-09: Deep Link — Direct Navigation to /clientes/:id Loads Detail

**Level:** E2E
**Story:** 2.2
**Requirement:** AC-2.2, FR30
**Risk covered:** R-005

**Precondition:** At least one client exists in the running application. Its UUID is known.

**Test Steps:**
1. Open Playwright browser directly to `http://localhost:5173/clientes/{uuid}` (no prior navigation).
2. Wait for right panel to load.

**Expected Result:**
- Client detail panel renders with Nombre, NIT/RUC, Teléfono, Ciudad of the correct client.
- Left panel list is also rendered (split layout).
- No redirect, no 404, no blank screen.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-10: Sort Client List — All 4 Sort Options Produce Correct Order

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6
**Risk covered:** R-007

**Precondition:** `ClienteListPanel` rendered with 5 mock clients with distinct nombres and distinct `createdAt` values. `SortControl` component mounted.

**Test Steps:**
1. Select "Nombre A→Z" → assert list is `["Alma", "Beta", "Carlos", "Delta", "Eco"]` order (alphabetical ascending).
2. Select "Nombre Z→A" → assert reverse alphabetical order.
3. Select "Más reciente" → assert most recently created client appears first.
4. Select "Más antiguo" → assert oldest client appears first.
5. After each step, verify no additional HTTP requests were made (TanStack Query cache — no new API call).

**Expected Result:**
- Each sort option produces the correct ordering.
- Zero additional network requests for any sort change.
- Default sort on initial render is "Más reciente".

**Automation:** Vitest + RTL + MSW (verify no extra requests using `MSW request spy`).

---

#### TC-E2-P1-11: Sort Preserved When Search Filter Is Active

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6 — sort applied to filtered results without clearing search
**Risk covered:** R-007

**Precondition:** 5 clients loaded. Sort set to "Nombre A→Z". Search input contains "a" (filters to 3 clients).

**Test Steps:**
1. Set sort to "Nombre A→Z".
2. Type "a" in search field.
3. Verify filtered list is sorted alphabetically ascending.
4. Change sort to "Nombre Z→A".
5. Verify filtered list is still limited to matching records AND is now sorted descending.
6. Verify search input still contains "a" (was not cleared).

**Expected Result:**
- Sort changes apply only to the currently-filtered result set.
- Search input value is preserved across sort changes.
- The two states (search + sort) compose independently.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-12: Edit Client — Form Opens Pre-Filled with Current Values

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4, FR6

**Precondition:** Client detail panel showing `{ nombre: "Empresa X", nit: "777", telefono: "321", ciudad: "Bogotá" }`. MSW configured for PUT.

**Test Steps:**
1. Click "Editar" button.
2. Inspect form field values immediately after form opens.

**Expected Result:**
- Nombre input has value "Empresa X".
- NIT/RUC input has value "777".
- Teléfono input has value "321".
- Ciudad input has value "Bogotá".
- No fields are empty or show placeholder text.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Edit Client — Cancel Does Not Modify Client Data

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4

**Precondition:** Edit form open with pre-filled values.

**Test Steps:**
1. Modify the `nombre` field to "Changed Name".
2. Click "Cancelar" button.
3. Inspect the client detail panel.

**Expected Result:**
- Form closes.
- Client detail panel shows the original "Empresa X" (not "Changed Name").
- No PUT request was sent.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-14: Delete Client — Confirmation Dialog and Cancel Preserves Record

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5

**Precondition:** Client detail panel rendered. MSW configured for DELETE (should not be called in this test).

**Test Steps:**
1. Click "Eliminar" button.
2. Verify confirmation dialog text "¿Eliminar este cliente?" with "Confirmar" and "Cancelar".
3. Click "Cancelar".

**Expected Result:**
- Confirmation dialog appears with correct text.
- After clicking "Cancelar", the dialog closes.
- No DELETE request was sent to the API.
- Client record remains in the list and detail panel.

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic Is Marked Complete

---

#### TC-E2-P2-01: E2E — Full Create Client Happy Path

**Level:** E2E
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR27

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Fill: Nombre="PlaywrightTest SA", NIT/RUC="PW-001", Teléfono="600-0000", Ciudad="Cali".
4. Click submit.
5. Observe the client list.

**Expected Result:**
- Success toast "Cliente creado correctamente" appears.
- "PlaywrightTest SA" appears in the client list without page reload.
- Clicking the new client shows its details in the right panel.

**Automation:** Playwright E2E.

---

#### TC-E2-P2-02: E2E — Delete Client with Associated Contacts Shows Correct Toast

**Level:** E2E
**Story:** 2.5
**Requirement:** AC-2.5 — "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

**Precondition:** A client with at least one associated contact exists.

**Test Steps:**
1. Navigate to client detail.
2. Click "Eliminar" → confirm.
3. Observe toast message and contact list.

**Expected Result:**
- Toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
- Client is removed from the list.
- Previously associated contacts are still accessible via `/contactos`.

**Automation:** Playwright E2E (requires contacts seeded via API setup).

---

#### TC-E2-P2-03: NIT Uniqueness Constraint at Database Level (Concurrent Insert)

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-2.3 — NIT/RUC uniqueness
**Risk covered:** R-009

**Test Steps:**
1. Send two concurrent POST requests to `/api/v1/clientes` with the same NIT value.
2. Wait for both responses.

**Expected Result:**
- Exactly one response is HTTP 201 Created.
- Exactly one response is HTTP 409 Conflict.
- Database contains exactly one record with that NIT.

**Automation:** xUnit integration test using `Task.WhenAll` with two parallel `HttpClient` calls.

---

#### TC-E2-P2-04: Create Client — Success Shows Toast and Client Appears in List Immediately

**Level:** Component
**Story:** 2.3
**Requirement:** AC-E2.1, FR27

**Precondition:** MSW returns HTTP 201 on POST with new client data. TanStack Query `invalidateQueries` triggers a GET that returns the new client.

**Test Steps:**
1. Render `<ClientesView />` with existing clients.
2. Open create form.
3. Fill all fields, submit.
4. Wait for mutation and query invalidation.

**Expected Result:**
- Toast "Cliente creado correctamente" is visible.
- New client appears in the client list panel without page reload.
- Form closes after successful submission.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-05: Zod Schema — Validates All Four Required Fields Independently

**Level:** Unit
**Story:** 2.3
**Requirement:** FR8, NFR5
**Risk covered:** R-002

**Test Steps:**
Run Zod `safeParse` with:
1. Valid full payload → expect `success: true`.
2. Empty `nombre` → expect `success: false`, error on `nombre`.
3. Empty `nit` → expect `success: false`, error on `nit`.
4. Empty `telefono` → expect `success: false`, error on `telefono`.
5. Empty `ciudad` → expect `success: false`, error on `ciudad`.
6. All empty → expect `success: false`, errors on all four fields.

**Expected Result:**
- Each missing field produces exactly the expected validation error path.
- No false positives (valid payload must pass cleanly).

**Automation:** Vitest unit test (pure function, no DOM).

---

#### TC-E2-P2-06: SortControl Default Order Is "Más reciente" on Mount

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6 — default sort on initial load

**Test Steps:**
1. Render `<SortControl />` with no initial sort prop.
2. Inspect the selected option in the control.

**Expected Result:**
- `SortControl` displays "Más reciente" as the selected option.
- The sort identifier `fecha-desc` is active.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-07: GET /clientes Search Parameter Filters Results

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR3, FR4, NFR1

**Precondition:** Database contains `{ nombre: "Alpha Corp", nit: "111" }` and `{ nombre: "Beta Inc", nit: "222" }`.

**Test Steps:**
1. GET `/api/v1/clientes?q=Alpha` → expect 1 result with `nombre: "Alpha Corp"`.
2. GET `/api/v1/clientes?q=111` → expect 1 result with `nit: "111"`.
3. GET `/api/v1/clientes?q=xyz` → expect empty array.

**Expected Result:**
- Each query returns only matching records.
- Search is case-insensitive (if frontend relies on backend search; adjust to omit if search is 100% client-side).

**Automation:** xUnit parameterized integration test.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: E2E — Search Filters Client List in Under 1 Second (Full Browser)

**Level:** E2E
**Story:** 2.1
**Requirement:** AC-E2.2, NFR1
**Risk covered:** R-004

**Test Steps:**
1. Seed 500 clients via API.
2. Navigate to `/clientes`.
3. Measure time from `page.fill(search)` to list update using Playwright `performance`.
4. Assert elapsed time < 1000ms.

**Automation:** Playwright E2E with `page.evaluate(() => performance.now())` benchmarking.

---

#### TC-E2-P3-02: Client List — Scrollable with 500 Records, No Layout Break

**Level:** Component
**Story:** 2.1
**Requirement:** FR2, NFR1

**Test Steps:**
1. Render `<ClienteListPanel />` with 500 mock clients.
2. Assert no overflow error, no layout overflow outside the 280px left panel.
3. Scroll to the bottom of the list.
4. Assert last record is visible.

**Automation:** Vitest + RTL + jsdom.

---

#### TC-E2-P3-03: Edit Client — Success Toast and Updated Data in Detail Panel

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4, FR27

**Test Steps:**
1. Edit form open, change `nombre` to "Updated Co".
2. Submit. MSW returns 200 with updated client.
3. Assert toast "Cliente actualizado correctamente" visible.
4. Assert detail panel shows "Updated Co".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P3-04: Delete Client — Right Panel Returns to Default State After Deletion

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 — right panel returns to empty/default state

**Test Steps:**
1. Client detail visible in right panel.
2. Confirm delete. MSW returns 204.
3. Assert right panel shows empty/default state.
4. Assert deleted client is absent from left panel list.

**Automation:** Vitest + RTL + MSW.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client, appears in list immediately | 2.3 | TC-E2-P0-04, TC-E2-P2-01, TC-E2-P2-04 | Covered |
| AC-E2.2: Search by name/NIT, results under 1 second | 2.1 | TC-E2-P1-05, TC-E2-P3-01 | Covered |
| AC-E2.3: View full detail, edit and save changes | 2.2, 2.4 | TC-E2-P1-08, TC-E2-P1-12, TC-E2-P3-03 | Covered |
| AC-E2.4: System prevents saving with empty required fields | 2.3, 2.4 | TC-E2-P0-02, TC-E2-P0-04, TC-E2-P2-05 | Covered |
| AC-E2.5: Delete client, no longer in list | 2.5 | TC-E2-P0-03, TC-E2-P1-04, TC-E2-P1-14, TC-E2-P2-02 | Covered |
| AC-E2.6: Sort by 4 criteria without reload, filter preserved | 2.6 | TC-E2-P1-10, TC-E2-P1-11, TC-E2-P2-06 | Covered |

### Functional Requirements Coverage

| FR | Description | Test Cases |
|----|-------------|------------|
| FR1 | Create client (4 required fields) | TC-E2-P0-04, TC-E2-P0-02 |
| FR2 | Scrollable client list | TC-E2-P1-01, TC-E2-P3-02 |
| FR3 | Search by name | TC-E2-P1-05, TC-E2-P2-07 |
| FR4 | Search by NIT/RUC | TC-E2-P1-05, TC-E2-P2-07 |
| FR5 | View client detail | TC-E2-P1-08, TC-E2-P1-09 |
| FR6 | Edit client fields | TC-E2-P1-03, TC-E2-P1-12 |
| FR7 | Delete client | TC-E2-P1-04, TC-E2-P2-02 |
| FR8 | Prevent save with missing required fields | TC-E2-P0-02, TC-E2-P0-04, TC-E2-P2-05 |
| FR27 | Changes reflected immediately | TC-E2-P2-01, TC-E2-P2-04 |
| FR30 | Deep linking | TC-E2-P1-09 |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-05, TC-E2-P3-01 | Component + E2E |
| NFR2 | CRUD reflected in UI < 2s | TC-E2-P2-01, TC-E2-P2-04 | E2E + Component |
| NFR5 | Input validation and sanitization | TC-E2-P0-02, TC-E2-P2-05 | API + Unit |
| NFR6 | No stack traces to user | TC-E2-P0-01, TC-E2-P0-05 | API + Component |
| NFR10 | MVP scale 500 clients | TC-E2-P1-05, TC-E2-P3-02 | Component |

---

## 7. Test Execution Order

```
Phase 1 — Backend API Gate (P0, no UI)
  1. TC-E2-P0-02  POST missing required fields → 400
  2. TC-E2-P0-01  POST duplicate NIT → 409
  3. TC-E2-P0-03  DELETE client → contacts set clienteId = null

Phase 2 — Core CRUD API (P1)
  4. TC-E2-P1-01  GET /clientes returns list
  5. TC-E2-P1-02  GET /clientes/{id} 404 for unknown
  6. TC-E2-P1-03  PUT /clientes/{id} updates fields
  7. TC-E2-P1-04  DELETE /clientes/{id} removes client
  8. TC-E2-P2-07  GET /clientes?q= filters by name/NIT

Phase 3 — Component Tests: Form & Validation (P0/P1)
  9. TC-E2-P0-04  Create form — inline validation blocks submit
 10. TC-E2-P0-05  Create form — 409 shows NIT inline error
 11. TC-E2-P1-12  Edit form — opens pre-filled
 12. TC-E2-P1-13  Edit form — cancel preserves data

Phase 4 — Component Tests: List & Search (P1)
 13. TC-E2-P1-05  Real-time filter < 1s with 500 records
 14. TC-E2-P1-06  Empty state when no clients
 15. TC-E2-P1-07  Error panel + retry button

Phase 5 — Component Tests: Detail & Routing (P1)
 16. TC-E2-P1-08  URL updates to /clientes/:id on selection
 17. TC-E2-P1-14  Delete dialog: cancel preserves record

Phase 6 — Component Tests: Sort (P1)
 18. TC-E2-P1-10  All 4 sort options correct order
 19. TC-E2-P1-11  Sort preserved with active search filter
 20. TC-E2-P2-06  Default sort is "Más reciente"

Phase 7 — Unit Tests (P2/P3)
 21. TC-E2-P2-05  Zod schema validates 4 required fields

Phase 8 — Integration & Component (P2)
 22. TC-E2-P2-03  Concurrent NIT insert — uniqueness at DB
 23. TC-E2-P2-04  Create → success toast + list updates

Phase 9 — E2E Journeys (P2)
 24. TC-E2-P1-09  Deep link /clientes/:id (Playwright)
 25. TC-E2-P2-01  Full create happy path (Playwright)
 26. TC-E2-P2-02  Delete with contacts — correct toast (Playwright)

Phase 10 — P3 Exploratory / Performance
 27. TC-E2-P3-01  E2E search < 1s with 500 records
 28. TC-E2-P3-02  List scroll with 500 records
 29. TC-E2-P3-03  Edit toast + detail updated
 30. TC-E2-P3-04  Right panel returns to default after delete
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering + user interaction | Frontend |
| @testing-library/jest-dom | DOM matchers (toBeVisible, toHaveValue, etc.) | Frontend |
| @testing-library/user-event | Realistic event simulation (typing, clicking) | Frontend |
| MSW 2+ | API mocking for component tests (intercepts Axios) | Frontend |
| Playwright 1.40+ | E2E tests (full browser, happy path, deep link) | E2E |
| xUnit 2+ | Backend unit + integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing without external server | Backend |
| TestContainers (Postgres) | Isolated PostgreSQL for integration tests (R-003, R-009) | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- MSW configured to intercept Axios base URL (VITE_API_URL or http://localhost:5000)
- TanStack Router test wrapper (createMemoryHistory) for router-dependent component tests
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.0 | 10.0 | Validation, 409 mapping, contact orphan — high complexity |
| P1 | 14 | 1.5 | 21.0 | Standard CRUD API + component interactions |
| P2 | 7 | 1.0 | 7.0 | Concurrent insert, Zod unit, E2E happy paths |
| P3 | 4 | 0.5 | 2.0 | Exploratory + perf benchmarks |
| **Total** | **30** | — | **40.0 hours** | **~5 days** |

Note: 41 total test cases but 30 distinct "test effort units" because some TC IDs share setup/teardown.

### Test Data Factories Required

| Factory | Purpose | Fields |
|---------|---------|--------|
| `ClienteFactory` | Generate valid client payloads | nombre (faker), nit (unique per test), telefono, ciudad |
| `ContactoFactory` | Generate contacts for delete-orphan test | nombre, cargo, telefono, email, clienteId |
| `SeedClientes(n)` | Seed n clients into TestContainers DB | Used by TC-E2-P0-03, TC-E2-P2-03, TC-E2-P2-07 |

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — all 5 P0 tests must pass before any story proceeds)
- **P1 pass rate**: 100% for this epic (domain-critical data layer)
- **P2/P3 pass rate**: ≥90% (may be deferred with documented justification)
- **High-risk mitigations** (R-001, R-002, R-003): 100% complete before Epic 2 closure

### Coverage Targets

- **Critical paths** (create, read, update, delete): 100%
- **Security scenarios** (NFR5 validation, NFR6 no stack trace): 100%
- **Business logic** (search, sort, orphan handling): ≥80%
- **Edge cases** (empty state, error state, concurrent insert): ≥60%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] Contact orphan behavior verified — no cascade delete (R-003 / TC-E2-P0-03)
- [ ] 409 inline error visible to user (R-001 / TC-E2-P0-05)
- [ ] Validation blocks form submit (R-002 / TC-E2-P0-04)
- [ ] No stack traces exposed in any error response (NFR6)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-14)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case skipped without a documented reason
- [ ] `uk_clientes_nit` unique index confirmed in database schema
- [ ] `ON DELETE SET NULL` (not CASCADE) confirmed on `contactos.cliente_id → clientes.id`
- [ ] All API error responses use `Content-Type: application/problem+json` (RFC 7807)
- [ ] MSW handlers documented and maintained alongside component tests

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **FK constraint** on `contactos.cliente_id` must be `ON DELETE SET NULL` — never `ON DELETE CASCADE`. This is mandatory for R-003 (TC-E2-P0-03).
2. **Unique index** `uk_clientes_nit` must be created in the EF Core migration. Without it, TC-E2-P2-03 will fail under concurrent load.
3. **409 Conflict handler** in the backend must set `Content-Type: application/problem+json` and include a `detail` field that the frontend maps to the inline NIT error message.
4. **Zod schema** for the create/edit client form must mark all four fields (nombre, nit, telefono, ciudad) as `z.string().min(1)` — no optional fields, no `.nullable()`.
5. **SortControl** sort state (`useState`) must be initialized to `"fecha-desc"` (Más reciente) to satisfy the default-sort AC.
6. **Sort function** must operate on the TanStack Query cached array — no additional `GET /api/v1/clientes` call when sort changes (verified by TC-E2-P1-10 MSW spy).
7. **TanStack Query `invalidateQueries(['clientes'])`** must be called in the `onSuccess` callback of all three mutating operations (create, update, delete) to satisfy FR27.
8. **Toast messages** must use the exact Spanish strings specified in the ACs: "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente" (no contacts), "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (with contacts).

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `testarch-test-design` (epic-level, Phase 4)
**Epic Source**: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
**Date**: 2026-06-11
