---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-12"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: complete
---

# Test Design — Epic 2: Client Management

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 introduces the first domain entity: the Client. The commercial team gains the ability to register, list, search, view, update, sort, and delete client records through a master-detail SPA layout at `/clientes`. The left panel (280px) displays a scrollable, searchable, sortable client list; the right panel shows the client detail form. All mutations update the UI immediately via TanStack Query cache invalidation (FR27). Sorting is performed client-side over the cached data (no additional API calls).

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time search with <1s response, empty state, error panel, 500-record scale |
| 2.2 | Client Detail View | Deep linking to `/clientes/:clienteId`, 404 handling for unknown IDs |
| 2.3 | Create Client | Form validation (required fields, duplicate NIT/RUC 409), success toast, immediate list update |
| 2.4 | Edit Client | Pre-populated form, save/cancel flow, inline validation, immediate panel update |
| 2.5 | Delete Client | Confirmation dialog, contact disassociation side-effect, success toast, immediate list removal |
| 2.6 | Sort Client List | Client-side sort over TanStack Query cache, 4 sort options, sort + filter coexistence |

### Out of Scope for This Epic

- Contact management (Epic 3) and Client–Contact association (Epic 4)
- Authentication / authorization — explicitly deferred (MVP)
- Pagination beyond 500 records — NFR10 upper bound
- HTTPS configuration — non-local deployments only (NFR4)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **Duplicate NIT/RUC 409 handling** — frontend does not intercept the conflict response, exposing a generic error or no feedback to the user (NFR6) | High | High | P0 | Integration test: POST with duplicate NIT/RUC → assert 409 received; Component test: assert "El NIT/RUC ya está registrado" message visible, no raw error detail |
| R2 | **Form validation bypass** — required fields pass validation when whitespace-only strings are submitted (Zod + FluentValidation both need trim) | High | High | P0 | Unit test (Zod schema): submit form with whitespace-only Nombre field; Integration test (FluentValidation): assert 400 with field-level error |
| R3 | **TanStack Query cache not invalidated** after create/update/delete — list or detail becomes stale, violating FR27 | High | Critical | P0 | Integration test: create a client, immediately query list endpoint; Component test: after mutation, assert new item appears in list without reload |
| R4 | **Client-side sort does not preserve active search filter** — changing sort order resets the search input or applies sort to full unfiltered list | Medium | High | P1 | Component test: apply search filter then change sort → assert filter input is unchanged and only matching items are sorted |
| R5 | **Deep-link `/clientes/:clienteId`** with unknown ID returns blank panel or unhandled error instead of graceful not-found message | Medium | High | P1 | E2E test: navigate directly to `/clientes/non-existent-uuid`, assert not-found message renders |
| R6 | **Delete with associated contacts** — backend deletes client but contacts are not properly unassigned (`clienteId = null`), leaving orphaned references | Medium | Critical | P1 | Integration test: create client with contacts, delete client, assert contacts still exist with `clienteId = null` |
| R7 | **ErrorPanel not shown** when backend is unavailable during list fetch — spinner persists or app crashes | Medium | Medium | P1 | Component test: mock network failure on GET `/api/v1/clientes`, assert ErrorPanel with "Reintentar" button renders |
| R8 | **EmptyState not shown** when client list is empty — blank space or "loading" spinner persists | Low | Medium | P2 | Component test: mock GET `/api/v1/clientes` returning `[]`, assert EmptyState component renders |
| R9 | **Search performance** with 500 records takes > 1s (NFR1) — client-side filter not debounced or executes on every keystroke in O(n) over large lists | Medium | Medium | P2 | Performance test: seed 500 client records, measure search filter render time |
| R10 | **Cancel button on edit form** does not restore original data — form state leaks or TanStack Query cache is accidentally mutated | Low | Medium | P2 | Component test: edit fields, click "Cancelar", assert detail panel shows original values |

### Top 3 Risk Areas for Epic 2

1. **TanStack Query cache invalidation** (R3) — if `invalidateQueries` is not called after any mutation, the UI shows stale data for all other users and sessions, directly violating FR27, the core real-time requirement of the product.
2. **Duplicate NIT/RUC conflict handling** (R1) — the 409 backend response must be caught, mapped to a user-friendly message, and must not expose internal error details. A missing `onError` handler silently swallows the conflict or shows a raw error.
3. **Form validation bypass via whitespace** (R2) — submitting fields with only spaces passes a simple `required` check but persists meaningless data. Both Zod (frontend) and FluentValidation (backend) must apply `.trim()` before validation.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)           ▌▌▌▌▌▌               4 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌    16 tests
  Component (Vitest+RTL)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  18 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌▌▌▌▌▌           10 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                              48 tests
```

### Rationale

- **Component tests dominate** because Epic 2 is UI-interaction-heavy (form validation, list filtering, sorting, empty/error states). These scenarios are faster and more deterministic than E2E.
- **API Integration tests are the second largest layer** to verify the complete CRUD contract (status codes, response shape, FluentValidation errors, 409 conflict, contact disassociation cascade).
- **E2E tests are limited to 4 scenarios** covering the most critical user journeys that cannot be reliably validated at lower levels: deep linking, create-then-see flow, delete cascade, and search-within-sort.
- **Unit tests** cover Zod schemas (frontend validation logic), domain entity constraints, and sort utility functions independently.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: Zod Schema Rejects Whitespace-Only Required Fields

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirement:** FR8, AC-E2.4
**Risk covered:** R2

**Precondition:** Client form Zod schema defined with `.trim().min(1)` on Nombre, NIT/RUC, Teléfono, Ciudad fields.

**Test Steps:**
1. Call `clientSchema.safeParse({ nombre: "   ", nit: "123", telefono: "555", ciudad: "Bogotá" })`.
2. Inspect `success` and `error.issues`.

**Expected Result:**
- `success: false`.
- `error.issues` contains an entry for the `nombre` field with a non-empty message.
- Test repeated for each required field individually.

**Automation:** Vitest unit test on `src/features/clients/schemas/clientSchema.ts`.

---

#### TC-E2-P0-02: FluentValidation Rejects Empty Required Fields — Backend Returns 400

**Level:** API Integration (xUnit)
**Story:** 2.3, 2.4
**Requirement:** FR8, AC-E2.4, NFR5
**Risk covered:** R2

**Precondition:** Backend running with `WebApplicationFactory<Program>`. FluentValidation configured for `CreateClientCommand`.

**Test Steps:**
1. POST to `http://localhost:5000/api/v1/clientes` with body `{ "nombre": "", "nit": "12345", "telefono": "555", "ciudad": "Bogotá" }`.
2. Inspect HTTP status and response body.

**Expected Result:**
- HTTP 400.
- `Content-Type: application/problem+json`.
- Response contains `errors` object with `nombre` key and a validation message.
- No `stackTrace` exposed.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-03: Duplicate NIT/RUC Returns 409 Conflict from Backend

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-2.3 (409 conflict), NFR6
**Risk covered:** R1

**Precondition:** Client with NIT/RUC `12345678` already exists in test database.

**Test Steps:**
1. POST to `/api/v1/clientes` with `{ "nombre": "Test", "nit": "12345678", "telefono": "555", "ciudad": "Bogotá" }`.
2. Inspect HTTP status and response body.

**Expected Result:**
- HTTP 409.
- `Content-Type: application/problem+json`.
- `detail` field contains a user-friendly message (e.g., "NIT/RUC already registered").
- Response does NOT contain `stackTrace`, `exception`, or database-level error strings.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-04: Frontend Shows "El NIT/RUC ya está registrado" on 409 Response

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-2.3 (409 conflict), NFR6
**Risk covered:** R1

**Precondition:** MSW handler intercepts POST `/api/v1/clientes` and returns HTTP 409 with Problem Details body.

**Test Steps:**
1. Render the Create Client form.
2. Fill all fields with valid data including NIT/RUC `12345678`.
3. Submit the form.
4. Wait for MSW response.
5. Query the DOM for the error message.

**Expected Result:**
- Text "El NIT/RUC ya está registrado" is visible in the form area.
- No raw error detail, status code, or stack trace is displayed.
- Form remains open (not closed/reset) so the user can correct the NIT/RUC.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-05: Create Client — List Immediately Shows New Client (Cache Invalidation)

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR27, AC-2.3 (immediate appearance in list)
**Risk covered:** R3

**Precondition:** MSW handlers: GET `/api/v1/clientes` returns existing list; POST `/api/v1/clientes` returns 201 with new client; subsequent GET returns list including new client.

**Test Steps:**
1. Render the full `/clientes` view (list + form).
2. Click "Nuevo cliente".
3. Fill all required fields and submit.
4. Wait for POST MSW response (201).
5. Wait for list to re-fetch.
6. Query list items.

**Expected Result:**
- The newly created client appears in the left-panel list without requiring a manual page reload.
- Success toast "Cliente creado correctamente" is visible.
- `invalidateQueries` was triggered (list re-fetched as evidenced by updated list content).

**Automation:** Vitest + RTL + MSW with TanStack Query test wrapper.

---

#### TC-E2-P0-06: Delete Client — Immediately Removed from List (Cache Invalidation)

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** FR27, AC-2.5 (immediate removal from list)
**Risk covered:** R3

**Precondition:** MSW handlers: GET `/api/v1/clientes` returns list with `clienteA`; DELETE `/api/v1/clientes/{id}` returns 204; subsequent GET returns list without `clienteA`.

**Test Steps:**
1. Render the `/clientes` view.
2. Click on `clienteA` in the list to open detail panel.
3. Click "Eliminar".
4. Confirm deletion in the dialog.
5. Wait for DELETE and subsequent GET responses.
6. Query list items.

**Expected Result:**
- `clienteA` no longer appears in the left-panel list.
- Right panel returns to empty/default state.
- Success toast "Cliente eliminado correctamente" is visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-07: Edit Client — Changes Reflected Immediately (Cache Invalidation)

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** FR27, AC-2.4 (immediate reflection of changes)
**Risk covered:** R3

**Precondition:** MSW handlers: GET `/api/v1/clientes/{id}` returns client; PATCH `/api/v1/clientes/{id}` returns 200 with updated client; subsequent GET returns updated data.

**Test Steps:**
1. Render the client detail panel for an existing client.
2. Click "Editar".
3. Change the `ciudad` field from "Bogotá" to "Medellín".
4. Submit the form.
5. Wait for PATCH and subsequent GET responses.
6. Query the detail panel.

**Expected Result:**
- The detail panel shows "Medellín" in the Ciudad field.
- List item for the same client reflects the updated name if applicable.
- Success toast "Cliente actualizado correctamente" is visible.

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: Client List Renders All Clients on Page Load

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** FR2, AC-2.1

**Precondition:** MSW GET `/api/v1/clientes` returns 3 clients.

**Test Steps:**
1. Render the `/clientes` view.
2. Wait for list to load.
3. Query all client list items.

**Expected Result:**
- 3 client items are rendered in the left panel.
- Each item shows Nombre and NIT/RUC.
- Left panel is 280px wide.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Client List Shows EmptyState When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 (empty state)
**Risk covered:** R8

**Precondition:** MSW GET `/api/v1/clientes` returns `[]`.

**Test Steps:**
1. Render the `/clientes` view.
2. Wait for response.
3. Query DOM for EmptyState component.

**Expected Result:**
- EmptyState component renders with a message guiding the user to create the first client.
- No client list items are present.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: Client List Shows ErrorPanel When Backend Is Unavailable

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 (error state)
**Risk covered:** R7

**Precondition:** MSW GET `/api/v1/clientes` returns network error.

**Test Steps:**
1. Render the `/clientes` view.
2. Wait for error state.
3. Query DOM for ErrorPanel.

**Expected Result:**
- ErrorPanel is rendered with a "Reintentar" button.
- No client list items are shown.
- No raw error message or stack trace is exposed to the user.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: Real-Time Search Filters Clients by Nombre

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** FR3, AC-E2.2

**Precondition:** MSW returns list of 5 clients with distinct Nombre values.

**Test Steps:**
1. Render the `/clientes` view and wait for list.
2. Type "Ana" in the search field.
3. Query the list items after filter.

**Expected Result:**
- Only clients whose Nombre contains "Ana" (case-insensitive) are shown.
- Clients with non-matching Nombres are not in the DOM.
- Search field retains "Ana".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: Real-Time Search Filters Clients by NIT/RUC

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** FR4, AC-E2.2

**Precondition:** MSW returns list with clients having distinct NIT/RUC values.

**Test Steps:**
1. Render the `/clientes` view.
2. Type a partial NIT/RUC string in the search field.
3. Query the list items.

**Expected Result:**
- Only clients whose NIT/RUC contains the search string are displayed.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-06: Clicking a Client Item Shows Its Full Detail in Right Panel

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirement:** FR5, AC-2.2 (detail view)

**Precondition:** MSW returns client list and individual client detail.

**Test Steps:**
1. Render the `/clientes` view.
2. Click on a client item.
3. Query the right panel for Nombre, NIT/RUC, Teléfono, Ciudad fields.

**Expected Result:**
- Right panel shows all four fields with the correct client values.
- URL updates to `/clientes/:clienteId`.

**Automation:** Vitest + RTL + MSW + TanStack Router test utilities.

---

#### TC-E2-P1-07: Deep Link to /clientes/:clienteId Loads Correct Client Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (direct URL), FR30
**Risk covered:** R5

**Precondition:** Frontend and backend running. A client with a known UUID exists.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{known-uuid}`.
2. Wait for page to render.
3. Assert detail panel content.

**Expected Result:**
- Correct client detail is loaded and displayed.
- No redirect to home page or blank panel.
- URL remains `/clientes/{known-uuid}`.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-08: Deep Link to /clientes with Unknown ID Shows Not-Found Message

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (not-found graceful handling)
**Risk covered:** R5

**Precondition:** Frontend and backend running.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/00000000-0000-0000-0000-000000000000`.
2. Wait for response.
3. Inspect right panel.

**Expected Result:**
- A not-found message is displayed gracefully.
- No JS error, no blank panel.
- Navigation shell and client list are still functional.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-09: Create Client — API Endpoint Accepts Valid Payload and Returns 201

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** FR1, AC-2.3

**Precondition:** Test database seeded or empty. `WebApplicationFactory<Program>` running.

**Test Steps:**
1. POST to `/api/v1/clientes` with valid `{ nombre, nit, telefono, ciudad }`.
2. Inspect response.

**Expected Result:**
- HTTP 201 Created.
- Response body contains the created client including a valid UUID `id` and `creadoEn` timestamp (`DateTimeOffset`).
- GET `/api/v1/clientes/{id}` returns the same client.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-10: Edit Client — API Endpoint Updates All Fields and Returns 200

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirement:** FR6, AC-2.4

**Precondition:** Client exists in test database.

**Test Steps:**
1. PATCH to `/api/v1/clientes/{id}` with updated `ciudad` field.
2. GET `/api/v1/clientes/{id}`.
3. Inspect updated field.

**Expected Result:**
- PATCH returns HTTP 200 with updated client data.
- GET returns the updated `ciudad` value.
- Other fields remain unchanged.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-11: Delete Client — API Endpoint Returns 204 and Client Removed

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** FR7, AC-2.5

**Precondition:** Client exists in test database.

**Test Steps:**
1. DELETE `/api/v1/clientes/{id}`.
2. GET `/api/v1/clientes/{id}`.
3. Inspect responses.

**Expected Result:**
- DELETE returns HTTP 204 No Content.
- GET returns HTTP 404 (client no longer exists).
- GET `/api/v1/clientes` list does not include the deleted client.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-12: Delete Client with Associated Contacts — Contacts Become Unassigned

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** AC-2.5 (contact disassociation), FR25
**Risk covered:** R6

**Precondition:** Client `C1` exists with contacts `CT1`, `CT2` linked via `clienteId = C1.id`. Both records exist in test database.

**Test Steps:**
1. DELETE `/api/v1/clientes/{C1.id}`.
2. GET `/api/v1/contactos/{CT1.id}`.
3. GET `/api/v1/contactos/{CT2.id}`.
4. GET `/api/v1/clientes/{C1.id}`.

**Expected Result:**
- Client DELETE returns 204.
- `CT1` and `CT2` still exist (200 responses).
- `CT1.clienteId` and `CT2.clienteId` are `null`.
- Client C1 GET returns 404.

**Automation:** xUnit integration test.

**Note:** This test may need to be revisited/expanded when Epic 3 (Contact Management) is implemented. The contact entity existence is a dependency — stub or pre-create via SQL in Epic 2 test scope.

---

#### TC-E2-P1-13: Confirmation Dialog Appears Before Delete

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (confirmation dialog)

**Test Steps:**
1. Render the client detail panel.
2. Click "Eliminar".
3. Query DOM for dialog.

**Expected Result:**
- A dialog with text "¿Eliminar este cliente?" is visible.
- "Confirmar" and "Cancelar" buttons are present.
- The DELETE API call has NOT been made yet.

**Automation:** Vitest + RTL + MSW (assert no MSW DELETE call fired).

---

#### TC-E2-P1-14: Cancel Delete — Client Record Remains Unchanged

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (cancel delete)

**Test Steps:**
1. Render client detail panel.
2. Click "Eliminar" to open dialog.
3. Click "Cancelar" in the dialog.
4. Query client list and detail panel.

**Expected Result:**
- Dialog closes.
- Client item is still present in the list.
- Right panel still shows the client detail.
- No DELETE API call was made.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Sort Nombre A→Z — No Additional API Call Triggered

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6, Technical Context (client-side sort over TanStack Query cache)
**Risk covered:** R4

**Precondition:** MSW returns list of 5 clients with randomized names. Sort state defaults to "Más reciente".

**Test Steps:**
1. Render `/clientes` view.
2. Select "Nombre A→Z" from SortControl.
3. Query list items and observe order.
4. Assert no additional GET `/api/v1/clientes` call was made.

**Expected Result:**
- Client items are reordered alphabetically ascending by Nombre.
- Exactly 1 GET call was made (initial load only) — MSW intercept count confirms no extra fetch.

**Automation:** Vitest + RTL + MSW with request spy.

---

#### TC-E2-P1-16: Sort Preserves Active Search Filter

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6 (sort + filter coexistence), AC-2.6 (filter not cleared on sort change)
**Risk covered:** R4

**Precondition:** MSW returns 5 clients. Two clients have Nombre containing "García".

**Test Steps:**
1. Render `/clientes` view.
2. Type "García" in search field.
3. Assert only 2 matching clients are shown.
4. Select "Nombre Z→A" from SortControl.
5. Assert list state.

**Expected Result:**
- Search input still contains "García".
- Only the 2 matching clients are shown (filter not cleared).
- Those 2 clients are sorted alphabetically descending.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-17: Default Sort Order Is "Más reciente" on Initial Load

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-2.6 (default sort: "Más reciente")

**Precondition:** MSW returns clients with distinct `creadoEn` timestamps.

**Test Steps:**
1. Render `/clientes` view.
2. Do not interact with SortControl.
3. Query the list item order.

**Expected Result:**
- SortControl shows "Más reciente" as selected option.
- Client list is ordered newest-first by `creadoEn`.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-18: Create Client — Form Shows Inline Error on Empty Required Field

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** FR8, AC-E2.4

**Test Steps:**
1. Render the Create Client form.
2. Leave "Nombre" field empty.
3. Fill remaining fields with valid data.
4. Click submit.

**Expected Result:**
- An inline error message appears next to the Nombre field.
- No API call is made (form blocked from submission).
- Other field values remain as entered.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-19: Edit Client — Cancel Restores Original Data

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC-2.4 (cancel edit)
**Risk covered:** R10

**Precondition:** Client detail shows Nombre "Empresa Uno".

**Test Steps:**
1. Render client detail panel.
2. Click "Editar".
3. Change Nombre to "Empresa Modificada".
4. Click "Cancelar".
5. Query detail panel.

**Expected Result:**
- Detail panel shows original Nombre "Empresa Uno".
- No PATCH API call was made.
- TanStack Query cache is not mutated.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-20: Edit Client Form Pre-Populated with Current Values

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** FR6, AC-2.4

**Precondition:** MSW GET `/api/v1/clientes/{id}` returns client with known field values.

**Test Steps:**
1. Render client detail panel.
2. Click "Editar".
3. Query the form fields.

**Expected Result:**
- Each form field is pre-populated with the client's current values for Nombre, NIT/RUC, Teléfono, Ciudad.

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Search Performance — Under 1 Second with 500 Records

**Level:** Component Performance (Vitest)
**Story:** 2.1
**Requirement:** NFR1, AC-E2.2 (<1s with 500 records)
**Risk covered:** R9

**Precondition:** MSW returns list of 500 client records with realistic data.

**Test Steps:**
1. Render `/clientes` view with 500-item list loaded.
2. Record timestamp `t1`.
3. Simulate typing a search term in the search field.
4. Wait for filtered list to render.
5. Record timestamp `t2`.
6. Calculate `t2 - t1`.

**Expected Result:**
- `t2 - t1` is less than 1000ms.
- Correct subset of clients is displayed.

**Automation:** Vitest with `performance.now()` timing.

---

#### TC-E2-P2-02: Sort Nombre Z→A Reorders Correctly

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-2.6 (Nombre Z→A)

**Test Steps:**
1. Render `/clientes` view with clients: "Alfa", "Beta", "Gamma".
2. Select "Nombre Z→A" from SortControl.
3. Query ordered list items.

**Expected Result:**
- Items appear in order: "Gamma", "Beta", "Alfa".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Sort "Más antiguo" Orders by creadoEn Ascending

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-2.6 (Más antiguo = oldest first)

**Precondition:** MSW returns clients with `creadoEn` values: client A (2026-01-01), client B (2026-06-01), client C (2026-03-01).

**Test Steps:**
1. Render `/clientes` view.
2. Select "Más antiguo" from SortControl.
3. Query ordered list items.

**Expected Result:**
- List order is: client A, client C, client B (ascending by `creadoEn`).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: GET /api/v1/clientes Returns Correct Paginated/Scrollable Shape

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirement:** FR2

**Precondition:** 10 clients exist in test database.

**Test Steps:**
1. GET `/api/v1/clientes`.
2. Inspect response shape.

**Expected Result:**
- HTTP 200.
- Response is a JSON array (or paged envelope if implemented).
- Each item contains at minimum: `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `creadoEn` (DateTimeOffset).
- Snake_case keys in JSON (matches `ApplySnakeCaseNaming()`).

**Automation:** xUnit integration test.

---

#### TC-E2-P2-05: Create Client Toast — "Cliente creado correctamente" Visible

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-2.3 (success toast)

**Precondition:** MSW POST returns 201.

**Test Steps:**
1. Fill and submit Create Client form.
2. Wait for response.
3. Query for toast component.

**Expected Result:**
- Toast with text "Cliente creado correctamente" is visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: Full Create-Then-View E2E Flow

**Level:** E2E (Playwright)
**Story:** 2.3, 2.2
**Requirement:** FR1, FR5, FR27, AC-E2.1

**Precondition:** Frontend and backend running. Database empty or seeded.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Fill form: Nombre "Test Corp", NIT "99887766", Teléfono "3001234567", Ciudad "Cali".
4. Click submit.
5. Assert success toast.
6. Click on "Test Corp" in the client list.
7. Assert detail panel.

**Expected Result:**
- "Test Corp" appears in the left-panel list immediately after creation.
- Clicking the list item shows full details in the right panel.
- URL updates to `/clientes/{newId}`.

**Automation:** Playwright E2E.

---

#### TC-E2-P2-07: Full Delete-Cascade E2E Flow (Client with Contacts)

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** AC-2.5 (contacts become unassigned), FR25
**Risk covered:** R6

**Precondition:** Frontend and backend running. Client `C1` exists with 1 contact `CT1` pre-seeded via API.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click on `C1` in the list.
3. Click "Eliminar".
4. Confirm deletion.
5. Assert `C1` is gone from list.
6. Navigate to `/contactos/{CT1.id}` (direct URL).
7. Assert contact still exists and `cliente` field shows "Sin cliente" or is empty.

**Expected Result:**
- `C1` removed from list and right panel returns to default.
- Toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." is shown.
- `CT1` is accessible at its URL and shows no client association.

**Automation:** Playwright E2E.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: Client List Accessible via Keyboard Navigation

**Level:** Component (Vitest + RTL / Playwright)
**Story:** 2.1
**Requirement:** NFR7 (usability — no training required), WCAG 2.1 AA

**Test Steps:**
1. Render `/clientes` view.
2. Tab to client list.
3. Use arrow keys to navigate between items.
4. Press Enter on a client item.

**Expected Result:**
- All list items are keyboard-accessible.
- Enter key opens client detail.
- No mouse required for core navigation.

**Automation:** Playwright accessibility audit + RTL keyboard simulation.

---

#### TC-E2-P3-02: Form Fields Have Correct aria-labels and Accessible Error Messages

**Level:** Component (Vitest + RTL / Playwright Accessibility)
**Story:** 2.3, 2.4
**Requirement:** NFR7

**Test Steps:**
1. Render Create/Edit Client form.
2. Run `axe-core` accessibility scan.
3. Submit form with empty fields.
4. Assert error messages are linked via `aria-describedby`.

**Expected Result:**
- Zero critical/serious accessibility violations.
- Error messages are announced to screen readers via `role="alert"` or `aria-live`.

**Automation:** Playwright + axe-core.

---

#### TC-E2-P3-03: Concurrent API Calls — Optimistic Update Does Not Corrupt List State

**Level:** API Integration (xUnit)
**Story:** 2.3, 2.4
**Requirement:** NFR3 (10 simultaneous users)

**Test Steps:**
1. Fire 5 concurrent POST requests to `/api/v1/clientes` with distinct NIT/RUC values.
2. Wait for all responses.
3. GET `/api/v1/clientes`.

**Expected Result:**
- All 5 POSTs return 201.
- GET returns all 5 new clients with no duplicate or missing entries.
- No 500 errors from race conditions.

**Automation:** xUnit with `Task.WhenAll` parallel test.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client with Nombre, NIT/RUC, Teléfono, Ciudad — appears in list immediately | 2.3 | TC-E2-P0-05, TC-E2-P1-09, TC-E2-P2-05, TC-E2-P2-06 | Covered |
| AC-E2.2: Search clients by name or NIT/RUC — results < 1s | 2.1 | TC-E2-P1-04, TC-E2-P1-05, TC-E2-P2-01 | Covered |
| AC-E2.3: View complete client detail, edit and save changes | 2.2, 2.4 | TC-E2-P1-06, TC-E2-P1-10, TC-E2-P1-20 | Covered |
| AC-E2.4: System prevents saving with empty required fields — inline errors | 2.3, 2.4 | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P1-18 | Covered |
| AC-E2.5: Delete client — disappears from list | 2.5 | TC-E2-P0-06, TC-E2-P1-11, TC-E2-P1-13, TC-E2-P1-14 | Covered |
| AC-E2.6: Sort list by Nombre A→Z, Z→A, Más reciente, Más antiguo — no reload, filter preserved | 2.6 | TC-E2-P1-15, TC-E2-P1-16, TC-E2-P1-17, TC-E2-P2-02, TC-E2-P2-03 | Covered |

---

## 6. Story-Level Acceptance Criteria Coverage

| Story AC | Test Cases | Status |
|----------|------------|--------|
| 2.1: Left panel 280px, Nombre + NIT/RUC per item | TC-E2-P1-01 | Covered |
| 2.1: Real-time search filters list | TC-E2-P1-04, TC-E2-P1-05 | Covered |
| 2.1: EmptyState when no clients | TC-E2-P1-02 | Covered |
| 2.1: ErrorPanel + "Reintentar" on backend failure | TC-E2-P1-03 | Covered |
| 2.2: Click client → right panel shows all 4 fields | TC-E2-P1-06 | Covered |
| 2.2: URL updates to `/clientes/:clienteId` | TC-E2-P1-06, TC-E2-P1-07 | Covered |
| 2.2: Deep link to `/clientes/:clienteId` loads correct client | TC-E2-P1-07 | Covered |
| 2.2: Unknown clienteId shows not-found gracefully | TC-E2-P1-08 | Covered |
| 2.3: Form with 4 required fields opens on "Nuevo cliente" | TC-E2-P1-18 | Covered |
| 2.3: Successful submission → list update + success toast | TC-E2-P0-05, TC-E2-P2-05 | Covered |
| 2.3: Empty fields → inline error, form not submitted | TC-E2-P0-01, TC-E2-P1-18 | Covered |
| 2.3: Duplicate NIT/RUC 409 → "El NIT/RUC ya está registrado" | TC-E2-P0-03, TC-E2-P0-04 | Covered |
| 2.4: Edit form pre-populated with current values | TC-E2-P1-20 | Covered |
| 2.4: Save changes → detail + list updated + toast | TC-E2-P0-07, TC-E2-P1-10 | Covered |
| 2.4: Clear required field → inline error, form not submitted | TC-E2-P0-02 | Covered |
| 2.4: Cancel → original data unchanged | TC-E2-P1-19 | Covered |
| 2.5: "Eliminar" shows confirmation dialog | TC-E2-P1-13 | Covered |
| 2.5: Confirm delete → removed from list + right panel default + toast | TC-E2-P0-06 | Covered |
| 2.5: Cancel delete → client remains unchanged | TC-E2-P1-14 | Covered |
| 2.5: Delete with contacts → contacts unassigned, special toast | TC-E2-P1-12, TC-E2-P2-07 | Covered |
| 2.6: Nombre A→Z sort — no new API call | TC-E2-P1-15 | Covered |
| 2.6: Nombre Z→A sort | TC-E2-P2-02 | Covered |
| 2.6: Más reciente sort | TC-E2-P1-17 | Covered |
| 2.6: Más antiguo sort | TC-E2-P2-03 | Covered |
| 2.6: Sort preserves active search filter | TC-E2-P1-16 | Covered |
| 2.6: Default sort is "Más reciente" | TC-E2-P1-17 | Covered |

---

## 7. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P2-01 | Component Performance |
| NFR2 | CRUD changes reflected < 2s | TC-E2-P0-05, TC-E2-P0-06, TC-E2-P0-07 (MSW timing) | Component |
| NFR3 | 10 simultaneous users | TC-E2-P3-03 | API Integration (concurrent) |
| NFR4 | HTTPS in non-local deployments | Out of scope for Epic 2 (local dev only) | N/A |
| NFR5 | Input validation and sanitization | TC-E2-P0-01, TC-E2-P0-02 | Unit + API Integration |
| NFR6 | No stack traces to end users | TC-E2-P0-03, TC-E2-P0-04 | API Integration + Component |
| NFR7 | Core tasks without documentation | TC-E2-P3-01, TC-E2-P3-02 | Accessibility |

---

## 8. Test Execution Order

The following execution order minimizes blocked tests due to environment dependencies:

```
Phase 1 — Validation Gate (P0, no full DB needed)
  1. TC-E2-P0-01  Zod schema rejects whitespace
  2. TC-E2-P0-02  FluentValidation 400 on empty fields
  3. TC-E2-P0-03  Duplicate NIT/RUC → 409 from backend

Phase 2 — Cache Invalidation Gate (P0, component + MSW)
  4. TC-E2-P0-05  Create → list updated (cache invalidated)
  5. TC-E2-P0-06  Delete → list updated (cache invalidated)
  6. TC-E2-P0-07  Edit → detail updated (cache invalidated)

Phase 3 — Component State Gate (P1)
  7.  TC-E2-P0-04  Frontend shows NIT/RUC conflict message
  8.  TC-E2-P1-01  Client list renders all clients
  9.  TC-E2-P1-02  EmptyState when no clients
  10. TC-E2-P1-03  ErrorPanel on backend failure
  11. TC-E2-P1-04  Real-time search by Nombre
  12. TC-E2-P1-05  Real-time search by NIT/RUC
  13. TC-E2-P1-06  Click client → detail panel
  14. TC-E2-P1-18  Create form inline error on empty field
  15. TC-E2-P1-20  Edit form pre-populated
  16. TC-E2-P1-19  Cancel edit restores original
  17. TC-E2-P1-13  Confirmation dialog appears before delete
  18. TC-E2-P1-14  Cancel delete preserves client

Phase 4 — Sort Tests (P1)
  19. TC-E2-P1-17  Default sort "Más reciente"
  20. TC-E2-P1-15  Sort A→Z — no extra API call
  21. TC-E2-P1-16  Sort preserves search filter

Phase 5 — API Contract Tests (P1)
  22. TC-E2-P1-09  POST creates client 201
  23. TC-E2-P1-10  PATCH updates client 200
  24. TC-E2-P1-11  DELETE removes client 204
  25. TC-E2-P1-12  DELETE with contacts → contacts unassigned

Phase 6 — E2E Deep Link Tests (P1)
  26. TC-E2-P1-07  Deep link loads correct client
  27. TC-E2-P1-08  Deep link unknown ID → not-found

Phase 7 — Quality & Performance (P2)
  28. TC-E2-P2-01  Search < 1s with 500 records
  29. TC-E2-P2-02  Sort Z→A correct order
  30. TC-E2-P2-03  Sort "Más antiguo" ascending
  31. TC-E2-P2-04  GET /clientes response shape
  32. TC-E2-P2-05  Create toast message
  33. TC-E2-P2-06  Full create-then-view E2E
  34. TC-E2-P2-07  Full delete-cascade E2E

Phase 8 — Accessibility (P3)
  35. TC-E2-P3-01  Keyboard navigation
  36. TC-E2-P3-02  aria-labels and error messages
  37. TC-E2-P3-03  Concurrent API calls
```

---

## 9. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW (Mock Service Worker) | API mocking for component tests | Frontend |
| Playwright | E2E tests (deep linking, full flows) | Frontend/E2E |
| axe-core / @axe-core/playwright | Accessibility audit | Frontend/E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| Zod | Frontend schema unit tests | Frontend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432
- Database user with CREATE DATABASE and INSERT privileges
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- Epic 1 stories all passing (Foundation prerequisite)
```

---

## 9b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 7 | 2.5 | 17.5 | Cache invalidation, validation, 409 conflict — complex MSW + TanStack Query setup |
| P1 | 20 | 1.5 | 30.0 | Standard CRUD coverage — component + API integration |
| P2 | 7 | 1.0 | 7.0 | Performance, full E2E flows, response shape |
| P3 | 3 | 1.5 | 4.5 | Accessibility, concurrency |
| **Total** | **37** | — | **59.0 hours** | **~7.4 days** |

**Note:** Estimate does not include test infrastructure setup time. Assumes TanStack Query test wrapper, MSW server, and Playwright fixtures are already configured from Epic 1.

### Test Data Requirements

| Entity | Quantity | Purpose |
|--------|----------|---------|
| Clients | 500 | NFR1 performance test |
| Clients | 10–20 | Standard integration tests |
| Clients with contacts | 1–3 | Delete cascade test |
| Clients with duplicate NIT | 2 | 409 conflict test |

### Tooling Setup Prerequisites

- **MSW 2+**: Already used in Epic 1 component tests — reuse server setup.
- **TanStack Query test wrapper**: `QueryClient` + `QueryClientProvider` — extract as shared test utility.
- **Playwright fixtures**: Database seeding scripts for E2E test isolation.
- **TestContainers**: Already configured in Epic 1 — extend with client table schema.

---

## 9c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (7 tests — all must pass; these directly validate the three highest-risk areas)
- **P1 pass rate**: 100% (20 tests — no story can be marked Done without all its P1 tests passing)
- **P2 pass rate**: ≥85% (informational — may be deferred with justification, except TC-E2-P2-01 which is NFR1-blocking)
- **P3 pass rate**: ≥0% (tracked but not blocking)

### Coverage Targets

- **Critical paths** (create/edit/delete with cache invalidation): 100%
- **Validation paths** (Zod + FluentValidation + conflict handling): 100%
- **Security scenarios** (NFR6 — no stack trace exposure on 409/400): 100%
- **Sort + filter coexistence**: 100% of AC-E2.6 covered by automated tests
- **Deep linking**: 100% of AC-2.2 covered

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] TanStack Query cache invalidation verified for create, update, and delete (R3)
- [ ] Duplicate NIT/RUC conflict shows user-friendly message with no raw error exposed (R1, R2)
- [ ] Backend FluentValidation blocks whitespace-only submissions (R2)
- [ ] Sort + search coexistence verified (R4)
- [ ] Delete cascade verified — contacts unassigned (R6)

---

## 10. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-20)
- [ ] P2 test cases pass or are formally deferred with justification (TC-E2-P2-01 is non-deferrable — NFR1)
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] Search filters correctly for both Nombre and NIT/RUC fields
- [ ] Sort coexists with search filter without resetting the search input
- [ ] Delete cascade correctly unassigns contacts (when contacts table is available)
- [ ] All API endpoints return Problem Details RFC 7807 on errors with no stack traces
- [ ] TanStack Query `invalidateQueries` verified on all mutations (create, update, delete)

---

## 11. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **Zod schema** for the client form must use `.trim().min(1)` on all required string fields — not just `z.string()` — to block whitespace-only inputs before any API call.
2. **TanStack Query mutations** (create, update, delete) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in their `onSuccess` handler. Optimistic updates are encouraged but `invalidateQueries` is the fallback that guarantees test TC-E2-P0-05/06/07 pass.
3. **409 Conflict handling**: The `useMutation` `onError` handler must check `error.status === 409` and display the localized string "El NIT/RUC ya está registrado" — never the raw `problem.detail` from the backend.
4. **Sort state** (`useState`) must be initialized to `'fecha-desc'` (Más reciente) per the SortControl identifiers in the Technical Context. The sort function must operate on the already-filtered array, not the raw cache.
5. **SortControl** lives at `src/shared/components/SortControl` — sort identifiers are `nombre-asc | nombre-desc | fecha-desc | fecha-asc`. Do not rename these identifiers as tests will reference them by value.
6. **Delete confirmation dialog** must delay the DELETE API call until the user clicks "Confirmar" — the dialog open state and the mutation call must be decoupled.
7. **Backend DELETE endpoint** must execute contact disassociation (`UPDATE contactos SET cliente_id = NULL WHERE cliente_id = :id`) within the same transaction as the client deletion to ensure atomicity.
8. **FluentValidation** must be applied as a pipeline behavior (MediatR pipeline behavior or endpoint filter) so that 400 responses are returned before the command handler executes.
9. **`creadoEn` field** must be `DateTimeOffset` (never `DateTime`) to comply with company standards and ensure sort-by-date tests produce deterministic ordering across time zones.
10. **Left panel width** of 280px must be implemented as a fixed Tailwind class (`w-[280px]` or `w-70`) so that the TC-E2-P1-01 width assertion passes.
