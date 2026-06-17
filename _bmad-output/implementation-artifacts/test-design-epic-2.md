---
epic: 2
title: "Client Management (Gestión de Clientes)"
mode: epic-level
phase: 4
createdAt: "2026-06-17"
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

Epic 2 delivers the full CRUD lifecycle for client records: list with real-time search, detail view with deep linking, create form with validation, edit form pre-populated, delete with confirmation and cascade-orphan handling, and client-side sort without additional API calls. The commercial team can register, view, search, update, and delete client records through a split-panel layout at `/clientes`.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | List render, real-time filtering, EmptyState, ErrorPanel |
| 2.2 | Client Detail View | Panel display, deep linking (/clientes/:clienteId), not-found |
| 2.3 | Create Client | Form validation (Zod), NIT/RUC uniqueness (409), optimistic UI, success toast |
| 2.4 | Edit Client | Pre-fill, save changes, cancel no-op, inline validation |
| 2.5 | Delete Client | Confirmation dialog, cascade-orphan (contactos), toast messaging |
| 2.6 | Sort Client List | Client-side sort over TanStack Query cache, sort+filter co-existence |

### Out of Scope for This Epic

- Contact management (Epic 3)
- Client–Contact association (Epic 4)
- Authentication / authorization (not in MVP)
- Pagination (epic specifies scrollable list — no paging required)
- Real-time multi-user sync via WebSockets (REST + `invalidateQueries` is sufficient)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness** — backend 409 conflict not mapped to user-friendly message; raw error exposed violating NFR6 | High | High | P0 | Integration test: POST duplicate NIT/RUC → assert response body contains friendly `"El NIT/RUC ya está registrado"` and no stack trace |
| R2 | **Required-field validation bypass** — form submits with empty fields because Zod schema not wired or frontend validation skipped | High | High | P0 | Component test: submit empty form → assert inline errors on each required field, no API call fired |
| R3 | **TanStack Query cache invalidation** — after create/update/delete the list does not reflect changes immediately (FR27, NFR2) | High | Critical | P0 | Integration/E2E test: perform mutation → assert list updates without manual refresh within 2s |
| R4 | **Delete cascade-orphan** — contacts associated with a deleted client do not become `clienteId=null`; data integrity broken | Medium | Critical | P0 | API integration test: create client + contacts, delete client, assert contacts have `clienteId=null` |
| R5 | **Deep linking** — direct navigation to `/clientes/:clienteId` fetches wrong client or shows blank due to missing loader or race condition | Medium | High | P1 | E2E test: navigate directly to URL, assert correct client details load |
| R6 | **Sort does not interact correctly with active search** — changing sort clears the search input or re-fetches from API | Medium | Medium | P1 | Component test: apply search filter, then change sort → assert filtered set is re-ordered, search input unchanged, no API call |
| R7 | **EmptyState / ErrorPanel not rendered** — loading state shown indefinitely on empty DB or network failure | Low | Medium | P1 | Component test with MSW: mock empty response → EmptyState; mock network error → ErrorPanel with Reintentar button |
| R8 | **Not-found client ID** — navigating to `/clientes/nonexistent-id` throws JS error instead of graceful not-found message | Low | Medium | P1 | Component/E2E test: request non-existent ID → assert not-found UI, no unhandled error |
| R9 | **Cancel edit does not restore data** — form changes bleed into the detail view after cancellation | Low | Medium | P2 | Component test: modify fields → click Cancel → assert original data unchanged |
| R10 | **Search performance with 500 records** (NFR1) — filtering takes > 1s due to unoptimized filter or unnecessary re-renders | Low | High | P2 | Performance test: load 500 records, type search query, measure filter completion time < 1s |
| R11 | **Delete confirmation dialog** — user accidentally deletes by missing the confirmation step or dialog doesn't block action | Low | Low | P2 | Component test: click Eliminar → assert dialog appears; click Cancelar → assert record still exists |

### Top 3 Risk Areas for Epic 2

1. **Data integrity on delete with associated contacts** (R4) — if the cascade-orphan logic is absent or incorrectly implemented at the API or DB layer, contact records lose their reference silently, corrupting CRM data without visible error.
2. **Frontend cache invalidation after mutations** (R3) — TanStack Query must `invalidateQueries` on every mutation; a missing invalidation makes the UI appear stale and violates FR27 (immediate reflection) and NFR2 (< 2s).
3. **Backend 409 error not user-friendly** (R1) — the NIT/RUC uniqueness conflict is the most predictable error in daily CRM use; if it surfaces a raw API message or stack trace it violates NFR6 and degrades trust.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)           ▌▌▌▌▌▌▌▌▌▌▌         5 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌     9 tests
  Component (Vitest+RTL+MSW) ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  14 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌▌▌▌             5 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                             33 tests
```

### Rationale

- **Epic 2 is domain-heavy and UI-interaction-heavy** — CRUD flows require component tests verifying form state, validation, toast display, and optimistic updates. Most bugs will surface here.
- **API integration tests** cover the contract layer: correct HTTP status codes, uniqueness constraints, cascade behavior, Problem Details format, and search endpoint correctness.
- **E2E tests** are used sparingly for the most critical user journeys: create-then-find, edit-and-verify, delete-and-verify-cascade, and deep-link access.
- **Unit tests** target pure logic: Zod validation schema, sort comparators, and FluentValidation rules for the backend domain.
- **MSW** mocks all API calls in component tests to isolate frontend behavior from backend availability.

### Tooling Stack

| Tool | Purpose | Layer |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/user-event | User interaction simulation | Frontend |
| MSW (Mock Service Worker) | API mocking for component tests | Frontend |
| Playwright | E2E tests | Full Stack |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| FluentAssertions | Assertion readability | Backend |

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: POST /api/v1/clientes — Create Client Successfully

**Level:** API Integration
**Story:** 2.3
**Requirements:** FR1, AC-E2.1
**Risk covered:** R3

**Precondition:** Test database empty. Backend running via `WebApplicationFactory`.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ "nombre": "Empresa XYZ", "nitRuc": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }`.
2. Assert HTTP 201 Created.
3. GET `/api/v1/clientes` and assert the new client appears in the list.

**Expected Result:**
- HTTP 201 with Location header pointing to the new resource.
- Response body contains `id` (UUID), `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`.
- Subsequent GET returns the client in the list.

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers (Postgres).

---

#### TC-E2-P0-02: POST /api/v1/clientes — Duplicate NIT/RUC Returns 409 with User-Friendly Message

**Level:** API Integration
**Story:** 2.3
**Requirements:** AC-2.3 (NIT/RUC uniqueness), NFR6
**Risk covered:** R1

**Precondition:** Client with `nitRuc: "900123456-1"` already exists in the database.

**Test Steps:**
1. POST `/api/v1/clientes` with the same `nitRuc: "900123456-1"`.
2. Assert HTTP 409 Conflict.
3. Inspect response body.

**Expected Result:**
- HTTP 409.
- `Content-Type: application/problem+json`.
- Response body contains `"detail"` with text matching `"El NIT/RUC ya está registrado"` (or equivalent user-safe message).
- Response body does NOT contain `stackTrace`, `exception`, or `innerException` keys.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-03: POST /api/v1/clientes — Required Fields Validation (400)

**Level:** API Integration
**Story:** 2.3
**Requirements:** FR8, AC-E2.4
**Risk covered:** R2

**Precondition:** Backend running.

**Test Steps:**
1. POST `/api/v1/clientes` with `{}` (empty body).
2. Assert HTTP 400 Bad Request.
3. POST `/api/v1/clientes` with only `{ "nombre": "Test" }` (missing nitRuc, telefono, ciudad).
4. Assert HTTP 400.
5. Inspect both responses for field-level validation errors.

**Expected Result:**
- HTTP 400 for both requests.
- `Content-Type: application/problem+json`.
- Response body lists the missing/invalid fields (FluentValidation errors).
- No client record created (verified by GET).

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-04: Create Client Form — Inline Validation Prevents Submission with Empty Fields

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirements:** FR8, AC-E2.4
**Risk covered:** R2

**Precondition:** `ClientForm` component rendered. MSW configured (no calls expected).

**Test Steps:**
1. Render `<ClientForm onSubmit={mockFn} />`.
2. Click the submit button without filling any field.
3. Assert inline error messages appear under Nombre, NIT/RUC, Teléfono, and Ciudad fields.
4. Assert `mockFn` (or the API mock) was NOT called.

**Expected Result:**
- Four inline validation error messages visible in the DOM.
- No API request fired (MSW request handler not invoked).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-05: Create Client Form — Shows 409 Error Inline Without Technical Details

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirements:** AC-2.3 (409 conflict), NFR6
**Risk covered:** R1

**Precondition:** MSW configured to respond with 409 `{ "detail": "El NIT/RUC ya está registrado" }` for POST `/api/v1/clientes`.

**Test Steps:**
1. Render the create client form.
2. Fill all required fields with a NIT/RUC that triggers the conflict.
3. Submit the form.
4. Assert the error message "El NIT/RUC ya está registrado" appears in the UI.
5. Assert no stack trace or technical message is visible.

**Expected Result:**
- Friendly error displayed inline (not a generic "Error 409" text).
- No `stackTrace`, `exception`, or internal URL fragments visible in the UI.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-06: DELETE /api/v1/clientes/:id — Client Deleted, Associated Contacts Become Unassigned

**Level:** API Integration
**Story:** 2.5
**Requirements:** AC-2.5 (cascade-orphan), FR7
**Risk covered:** R4

**Precondition:** Client "ABC Corp" with 2 associated contacts exists in the database.

**Test Steps:**
1. Record the client ID and both contact IDs.
2. DELETE `/api/v1/clientes/{clientId}`.
3. Assert HTTP 204 No Content.
4. GET `/api/v1/clientes/{clientId}` → assert 404.
5. GET `/api/v1/contactos/{contactId1}` → assert `clienteId` is null.
6. GET `/api/v1/contactos/{contactId2}` → assert `clienteId` is null.

**Expected Result:**
- Client record removed (404 on subsequent GET).
- Both contacts remain intact with `clienteId: null`.
- No contact records deleted.

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers (Postgres).

---

#### TC-E2-P0-07: Client List Updates Immediately After Create (Cache Invalidation)

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirements:** FR27, NFR2, AC-E2.1
**Risk covered:** R3

**Precondition:** Application running (frontend + backend + DB). Starting with at least 1 existing client.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Count the current number of client items in the list.
3. Click "Nuevo cliente".
4. Fill and submit the form with valid unique data.
5. Assert the success toast "Cliente creado correctamente" appears.
6. Assert the client list now shows N+1 items including the new client.
7. Assert total time from form submission to list update is < 2 seconds.

**Expected Result:**
- New client appears in the list immediately without manual refresh.
- Toast message visible.
- No loading indicator persisting after creation.

**Automation:** Playwright E2E.

---

### P1 — Must Pass Before Story is Closed as Done

---

#### TC-E2-P1-01: GET /api/v1/clientes — Returns All Clients

**Level:** API Integration
**Story:** 2.1
**Requirements:** FR2, AC-E2.1

**Test Steps:**
1. Seed 3 clients into test database.
2. GET `/api/v1/clientes`.
3. Assert HTTP 200 and response contains all 3 clients.

**Expected Result:**
- HTTP 200.
- JSON array with 3 items, each containing `id`, `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P1-02: GET /api/v1/clientes — Empty Database Returns Empty Array (Not 404)

**Level:** API Integration
**Story:** 2.1
**Requirements:** AC-2.1 (EmptyState trigger)

**Test Steps:**
1. Ensure database has no clients.
2. GET `/api/v1/clientes`.

**Expected Result:**
- HTTP 200 with `[]` (empty JSON array).
- NOT a 404 response.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P1-03: Client List — EmptyState Rendered When API Returns Empty Array

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** AC-2.1 (EmptyState)
**Risk covered:** R7

**Precondition:** MSW returns `[]` for GET `/api/v1/clientes`.

**Test Steps:**
1. Render the client list page.
2. Assert the `EmptyState` component is visible.
3. Assert the EmptyState message guides the user to create the first client.
4. Assert no client list items are rendered.

**Expected Result:**
- EmptyState component in the DOM with guidance text.
- No list items rendered.
- No error state shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: Client List — ErrorPanel with Reintentar on Backend Failure

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** AC-2.1 (ErrorPanel)
**Risk covered:** R7

**Precondition:** MSW configured to return network error for GET `/api/v1/clientes`.

**Test Steps:**
1. Render the client list page.
2. Assert the `ErrorPanel` component is visible with a "Reintentar" button.
3. Click "Reintentar".
4. Assert a new GET request is fired to `/api/v1/clientes`.

**Expected Result:**
- ErrorPanel with "Reintentar" button visible.
- Clicking the button triggers a retry fetch.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: Real-Time Search — List Filters by Nombre

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** FR3, AC-E2.2

**Precondition:** MSW returns 3 clients: "Acme Corp", "Beta Ltd", "Acme Industries". Client list rendered.

**Test Steps:**
1. Type "acme" in the search field.
2. Assert only "Acme Corp" and "Acme Industries" appear in the list.
3. Assert "Beta Ltd" is not in the DOM.

**Expected Result:**
- 2 matching items visible.
- No additional API call (client-side filtering).

**Automation:** Vitest + RTL + MSW + `userEvent`.

---

#### TC-E2-P1-06: Real-Time Search — List Filters by NIT/RUC

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** FR4, AC-E2.2

**Precondition:** MSW returns 3 clients with distinct NIT/RUC values.

**Test Steps:**
1. Type a partial NIT/RUC in the search field (e.g., "9001").
2. Assert only clients whose NIT/RUC starts with "9001" appear.
3. Assert no additional API call fired.

**Expected Result:**
- Correct filtering applied on NIT/RUC field.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: Client Detail — Clicking Client Item Shows Full Details in Right Panel

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirements:** FR5, AC-2.2

**Precondition:** Client list rendered with 2 seeded clients.

**Test Steps:**
1. Click on a client item in the left panel.
2. Assert the right panel shows: Nombre, NIT/RUC, Teléfono, Ciudad for the selected client.
3. Assert the URL updates to `/clientes/{clienteId}`.

**Expected Result:**
- All 4 fields displayed in right panel.
- URL updated via router (no full page reload).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Deep Linking — Direct Navigation to /clientes/:clienteId Loads Correct Client

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirements:** FR30, AC-2.2
**Risk covered:** R5

**Precondition:** One client with known ID exists in the database.

**Test Steps:**
1. Navigate directly to `http://localhost:5173/clientes/{knownClientId}` (no prior navigation).
2. Wait for page render.
3. Assert the right panel shows the correct client's Nombre and NIT/RUC.

**Expected Result:**
- Correct client details rendered.
- No redirect to root or blank screen.
- No JS console errors.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-09: Deep Linking — Non-Existent Client ID Shows Not-Found Message

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirements:** AC-2.2 (graceful not-found)
**Risk covered:** R8

**Precondition:** MSW returns 404 for GET `/api/v1/clientes/nonexistent-id`.

**Test Steps:**
1. Render the client detail route with `clienteId = "nonexistent-id"`.
2. Wait for data fetch attempt.
3. Assert a not-found UI is displayed (no JS error thrown).

**Expected Result:**
- Not-found UI visible.
- No unhandled exception or blank page.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: Edit Client — Form Opens Pre-Filled with Current Values

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirements:** FR6, AC-2.4

**Precondition:** Client detail panel showing a client. MSW returns client data.

**Test Steps:**
1. Click "Editar" on the client detail panel.
2. Assert the form opens.
3. Assert each input field is pre-filled with the existing value (Nombre, NIT/RUC, Teléfono, Ciudad).

**Expected Result:**
- 4 form fields visible and pre-populated with current client data.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Edit Client — Saving Changes Updates List and Detail Panel

**Level:** E2E (Playwright)
**Story:** 2.4
**Requirements:** FR6, FR27, AC-2.4
**Risk covered:** R3

**Precondition:** One client exists. Application running.

**Test Steps:**
1. Navigate to the client detail.
2. Click "Editar".
3. Change the Nombre field to a new unique value.
4. Click save.
5. Assert toast "Cliente actualizado correctamente" appears.
6. Assert the right panel shows the updated Nombre.
7. Assert the left panel list item also shows the updated Nombre.

**Expected Result:**
- Both panels reflect the change immediately.
- Toast visible.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-12: Delete Client — Confirmation Dialog Appears on Click Eliminar

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirements:** AC-2.5
**Risk covered:** R11

**Precondition:** Client detail panel visible. MSW configured.

**Test Steps:**
1. Click "Eliminar".
2. Assert a dialog with text "¿Eliminar este cliente?" is visible.
3. Assert "Confirmar" and "Cancelar" buttons are present.

**Expected Result:**
- Dialog displayed with correct text and both action buttons.
- No deletion request fired yet.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Delete Client — Client Removed from List After Confirmation

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirements:** FR7, FR27, AC-E2.5
**Risk covered:** R3

**Precondition:** One client exists. Application running.

**Test Steps:**
1. Navigate to client detail.
2. Click "Eliminar".
3. Click "Confirmar" in the dialog.
4. Assert toast "Cliente eliminado correctamente" appears.
5. Assert the right panel returns to empty/default state.
6. Assert the client no longer appears in the left panel list.

**Expected Result:**
- Client removed from list immediately.
- Right panel cleared.
- Toast visible.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-14: Delete Client — Cancel Does Not Remove Client

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirements:** AC-2.5

**Precondition:** Delete confirmation dialog open. MSW configured.

**Test Steps:**
1. Click "Cancelar" in the delete confirmation dialog.
2. Assert dialog closes.
3. Assert no DELETE request was fired.
4. Assert client detail panel still shows the client.

**Expected Result:**
- Client record unchanged.
- No API call made.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Sort — Default Sort Is "Más Reciente" on Page Load

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** AC-2.6 (default sort)

**Precondition:** MSW returns 3 clients with distinct `createdAt` values.

**Test Steps:**
1. Render the client list page.
2. Assert the `SortControl` component shows "Más reciente" as the selected option.
3. Assert the list order matches newest-first by `createdAt`.

**Expected Result:**
- "Más reciente" selected by default.
- List ordered by descending `createdAt`.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-16: Sort — Nombre A→Z Sorts List Without API Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** AC-E2.6, AC-2.6
**Risk covered:** R6

**Precondition:** 3 clients loaded in cache: "Zara Inc", "Acme", "Beta Ltd".

**Test Steps:**
1. Select "Nombre A→Z" from `SortControl`.
2. Assert list order is: "Acme", "Beta Ltd", "Zara Inc".
3. Assert no new GET request fired to `/api/v1/clientes`.

**Expected Result:**
- Alphabetical ascending order.
- Zero additional API calls (MSW request handler call count unchanged).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-17: Sort + Search Co-Existence — Sort Applies to Filtered Set

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** AC-E2.6, AC-2.6
**Risk covered:** R6

**Precondition:** 4 clients loaded: "Acme Alfa", "Acme Beta", "Zara Inc", "Beta Ltd". Search input contains "Acme".

**Test Steps:**
1. Type "Acme" in search field.
2. Assert 2 items visible: "Acme Alfa", "Acme Beta".
3. Select "Nombre Z→A" from `SortControl`.
4. Assert 2 items visible in order: "Acme Beta", "Acme Alfa".
5. Assert search input still contains "Acme" (not cleared).
6. Assert no new API call fired.

**Expected Result:**
- Sort applied on filtered set.
- Search input preserved.
- No additional fetch.

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic Is Marked Complete

---

#### TC-E2-P2-01: Search Performance — Filters 500 Records in Under 1 Second

**Level:** Component Performance (Vitest)
**Story:** 2.1
**Requirements:** NFR1, AC-E2.2
**Risk covered:** R10

**Precondition:** MSW returns 500 client records.

**Test Steps:**
1. Render client list with 500 records.
2. Record `performance.now()` before typing.
3. Type a search query that matches ~10% of records.
4. Record `performance.now()` after the filtered list stabilizes.

**Expected Result:**
- Time elapsed < 1000ms.
- Correct subset of clients displayed.

**Automation:** Vitest + RTL + MSW with performance timing.

---

#### TC-E2-P2-02: Edit Client — Cancel Restores Original Data

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirements:** AC-2.4 (cancel no-op)
**Risk covered:** R9

**Precondition:** Client detail panel showing "Old Name" as Nombre. Edit form open.

**Test Steps:**
1. Clear the Nombre field and type "New Name".
2. Click "Cancelar".
3. Assert the detail panel still shows "Old Name".
4. Assert no PATCH/PUT request was fired.

**Expected Result:**
- Original Nombre "Old Name" restored in detail view.
- Zero API mutation calls.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Edit Client — Required Field Cleared Shows Inline Error

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirements:** FR8, AC-2.4

**Precondition:** Edit form open with all fields pre-filled.

**Test Steps:**
1. Clear the Nombre field.
2. Click save/submit.
3. Assert inline error message appears on the Nombre field.
4. Assert no API request fired.

**Expected Result:**
- Inline error on cleared required field.
- Form not submitted.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: Delete Client with Associated Contacts — Toast Shows Orphan Warning

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirements:** AC-2.5 (cascade-orphan toast message)
**Risk covered:** R4

**Precondition:** Client with 2 associated contacts exists. Application running.

**Test Steps:**
1. Navigate to client detail.
2. Click "Eliminar" → Confirm.
3. Assert toast message reads "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
4. (Optionally) Navigate to contacts list and verify orphaned contacts appear in "Sin cliente" filter.

**Expected Result:**
- Specific cascade-orphan toast message displayed.
- Contacts accessible in "Sin cliente" filter.

**Automation:** Playwright E2E.

---

#### TC-E2-P2-05: Sort — Nombre Z→A Orders Descending

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** AC-2.6

**Precondition:** 3 clients loaded: "Acme", "Beta", "Zara".

**Test Steps:**
1. Select "Nombre Z→A".
2. Assert order: "Zara", "Beta", "Acme".

**Expected Result:**
- Alphabetical descending order.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: Sort — Más Antiguo Orders Ascending by createdAt

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** AC-2.6

**Precondition:** 3 clients with known `createdAt` timestamps (oldest = "Acme", newest = "Zara").

**Test Steps:**
1. Select "Más antiguo".
2. Assert first item in list is "Acme" (oldest by `createdAt`).
3. Assert last item is "Zara" (newest).

**Expected Result:**
- List ordered ascending by `createdAt`.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-07: PUT /api/v1/clientes/:id — Updates Client Record

**Level:** API Integration
**Story:** 2.4
**Requirements:** FR6

**Test Steps:**
1. Create a client via POST, record its ID.
2. PUT `/api/v1/clientes/{id}` with modified `nombre` and `ciudad`.
3. Assert HTTP 200.
4. GET `/api/v1/clientes/{id}` and assert updated fields.

**Expected Result:**
- HTTP 200 with updated resource body.
- Subsequent GET reflects new values.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P2-08: GET /api/v1/clientes/:id — Returns 404 for Non-Existent ID

**Level:** API Integration
**Story:** 2.2
**Requirements:** AC-2.2 (not-found)
**Risk covered:** R8

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000` (non-existent UUID).

**Expected Result:**
- HTTP 404.
- `Content-Type: application/problem+json`.
- Response body has `status: 404`, `title` present.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: Search — Input Debounce Prevents Excessive Filter Calls

**Level:** Unit (Vitest)
**Story:** 2.1
**Requirements:** NFR1 (performance)

**Test Steps:**
1. Test the search filter function or hook with rapid successive inputs.
2. Confirm filtering function is debounced and not called on every keystroke when configured.

**Expected Result:**
- Filter function call count is less than total keystroke count within debounce window.

**Automation:** Vitest unit test with fake timers.

---

#### TC-E2-P3-02: Zod Schema — All Required Fields Validated Correctly

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirements:** FR8

**Test Steps:**
1. Import the client Zod schema.
2. Parse valid payloads → assert success.
3. Parse payloads missing each required field one by one → assert error on that field.

**Expected Result:**
- Schema correctly identifies all 4 required fields: `nombre`, `nitRuc`, `telefono`, `ciudad`.

**Automation:** Vitest unit test.

---

#### TC-E2-P3-03: Sort Identifiers — Sort Option Values Match Expected Constants

**Level:** Unit (Vitest)
**Story:** 2.6
**Requirements:** AC-2.6 (technical context)

**Test Steps:**
1. Import `SortControl` sort option definitions.
2. Assert the following option IDs are present: `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`.

**Expected Result:**
- All 4 identifiers present and correctly typed.

**Automation:** Vitest unit test.

---

#### TC-E2-P3-04: FluentValidation — Backend Rejects Missing Nombre

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirements:** FR8

**Test Steps:**
1. Instantiate `CreateClientCommandValidator`.
2. Validate a command with `Nombre = ""`.
3. Assert validation fails with error on `Nombre` field.

**Expected Result:**
- Validation fails specifically on `Nombre`.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-05: Client List — Accessibility: Items Are Keyboard Navigable

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirements:** NFR7 (usability — core tasks without training)

**Test Steps:**
1. Render client list.
2. Tab into the list items.
3. Assert list items are reachable via Tab key.
4. Press Enter on a list item and assert the detail panel opens.

**Expected Result:**
- List navigable via keyboard.
- Enter key triggers detail view open.

**Automation:** Vitest + RTL + `userEvent`.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register new client with Nombre, NIT/RUC, Teléfono, Ciudad; appears in list immediately | 2.3 | TC-E2-P0-01, TC-E2-P0-04, TC-E2-P0-07 | Covered |
| AC-E2.2: Search by nombre or NIT/RUC, results < 1 second | 2.1 | TC-E2-P1-05, TC-E2-P1-06, TC-E2-P2-01 | Covered |
| AC-E2.3: View full detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-07, TC-E2-P1-10, TC-E2-P1-11, TC-E2-P2-07 | Covered |
| AC-E2.4: Block save with empty required fields, show clear error messages | 2.3, 2.4 | TC-E2-P0-03, TC-E2-P0-04, TC-E2-P2-03 | Covered |
| AC-E2.5: Delete client, removed from list | 2.5 | TC-E2-P1-13, TC-E2-P1-14, TC-E2-P0-06 | Covered |
| AC-E2.6: Sort by Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo without reload and preserving active search | 2.6 | TC-E2-P1-15, TC-E2-P1-16, TC-E2-P1-17, TC-E2-P2-05, TC-E2-P2-06 | Covered |

### Story-Level AC Coverage

| Story AC | Test Cases |
|----------|------------|
| AC-2.1: Left panel shows scrollable list with Nombre and NIT/RUC | TC-E2-P1-01, TC-E2-P1-03 |
| AC-2.1: Real-time filter on search input, < 1s, 500 records | TC-E2-P1-05, TC-E2-P1-06, TC-E2-P2-01 |
| AC-2.1: EmptyState when no clients | TC-E2-P1-03 |
| AC-2.1: ErrorPanel with Reintentar on backend failure | TC-E2-P1-04 |
| AC-2.2: Right panel shows full client details; URL updates to /clientes/:id | TC-E2-P1-07 |
| AC-2.2: Direct URL access loads correct client (deep link) | TC-E2-P1-08 |
| AC-2.2: Non-existent clienteId shows not-found gracefully | TC-E2-P1-09, TC-E2-P2-08 |
| AC-2.3: Form opens with Nombre, NIT/RUC, Teléfono, Ciudad (all required) | TC-E2-P0-04 |
| AC-2.3: Client created → appears in list; success toast | TC-E2-P0-07 (E2E) |
| AC-2.3: Empty required fields → inline errors, no submit | TC-E2-P0-03, TC-E2-P0-04 |
| AC-2.3: Duplicate NIT/RUC → inline error "El NIT/RUC ya está registrado" | TC-E2-P0-02, TC-E2-P0-05 |
| AC-2.4: Form pre-filled with current values | TC-E2-P1-10 |
| AC-2.4: Save → changes in detail + list; toast | TC-E2-P1-11 |
| AC-2.4: Clear required field → inline error, no submit | TC-E2-P2-03 |
| AC-2.4: Cancel → data unchanged | TC-E2-P2-02 |
| AC-2.5: Confirmation dialog with Confirmar and Cancelar | TC-E2-P1-12 |
| AC-2.5: Confirm → removed from list; right panel cleared; toast | TC-E2-P1-13 |
| AC-2.5: Cancel → record unchanged | TC-E2-P1-14 |
| AC-2.5: Delete with contacts → contacts become unassigned; specific toast | TC-E2-P0-06, TC-E2-P2-04 |
| AC-2.6: Nombre A→Z sort without new API call | TC-E2-P1-16 |
| AC-2.6: Nombre Z→A sort | TC-E2-P2-05 |
| AC-2.6: Más reciente default sort on load | TC-E2-P1-15 |
| AC-2.6: Más antiguo sort | TC-E2-P2-06 |
| AC-2.6: Sort over filtered set, search preserved, no API call | TC-E2-P1-17 |

---

## 6. NFR Coverage

| NFR | Requirement | Test Cases | Level |
|-----|-------------|------------|-------|
| NFR1 | Search returns results < 1s with 500 records | TC-E2-P2-01 | Component Performance |
| NFR2 | CRUD changes reflected in UI < 2s | TC-E2-P0-07, TC-E2-P1-11, TC-E2-P1-13 | E2E |
| NFR5 | API validates and sanitizes all inputs | TC-E2-P0-03, TC-E2-P3-04 | API Integration + Unit |
| NFR6 | No stack traces or internal errors exposed to user | TC-E2-P0-02, TC-E2-P0-05 | API Integration + Component |
| NFR7 | Core tasks completable without training | TC-E2-P3-05 (accessibility) | Component |

---

## 7. Test Execution Order

The following execution order minimizes blocked tests and parallelizes independent suites:

```
Phase 1 — API Contract Gate (P0, no frontend needed)
  1. TC-E2-P0-01  Create client returns 201
  2. TC-E2-P0-02  Duplicate NIT/RUC returns 409 user-friendly
  3. TC-E2-P0-03  Missing fields returns 400 with validation errors
  4. TC-E2-P0-06  Delete client orphans contacts
  5. TC-E2-P2-07  Update client returns 200
  6. TC-E2-P2-08  Non-existent ID returns 404 Problem Details
  7. TC-E2-P1-01  GET all clients returns 200 with list
  8. TC-E2-P1-02  GET empty database returns 200 []

Phase 2 — Frontend Unit Gate (P3, no API needed)
  9. TC-E2-P3-02  Zod schema validates all required fields
 10. TC-E2-P3-03  Sort option identifiers match constants
 11. TC-E2-P3-04  FluentValidation rejects empty Nombre

Phase 3 — Component Tests (P0-P1, MSW isolated)
 12. TC-E2-P0-04  Create form inline validation prevents submit
 13. TC-E2-P0-05  Create form shows 409 message inline
 14. TC-E2-P1-03  EmptyState rendered on empty response
 15. TC-E2-P1-04  ErrorPanel with Reintentar on failure
 16. TC-E2-P1-05  Search filters by Nombre
 17. TC-E2-P1-06  Search filters by NIT/RUC
 18. TC-E2-P1-07  Client detail shows full fields; URL updates
 19. TC-E2-P1-09  Non-existent clienteId shows not-found
 20. TC-E2-P1-10  Edit form pre-filled with current values
 21. TC-E2-P1-12  Delete confirmation dialog appears
 22. TC-E2-P1-14  Cancel delete does not remove client
 23. TC-E2-P1-15  Default sort is Más reciente
 24. TC-E2-P1-16  Nombre A→Z sorts without API call
 25. TC-E2-P1-17  Sort+search co-existence

Phase 4 — Component P2 Tests
 26. TC-E2-P2-01  Search performance 500 records < 1s
 27. TC-E2-P2-02  Cancel edit restores original data
 28. TC-E2-P2-03  Required field cleared shows inline error
 29. TC-E2-P2-05  Nombre Z→A sort
 30. TC-E2-P2-06  Más antiguo sort

Phase 5 — E2E Tests (full stack, Playwright)
 31. TC-E2-P0-07  Create client updates list immediately
 32. TC-E2-P1-08  Deep link to /clientes/:clienteId
 33. TC-E2-P1-11  Edit client reflects in list + detail
 34. TC-E2-P1-13  Delete client removed from list
 35. TC-E2-P2-04  Delete with contacts shows orphan toast

Phase 6 — Nice to Have (P3)
 36. TC-E2-P3-01  Search debounce
 37. TC-E2-P3-05  Keyboard navigation accessibility
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Layer |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering and queries | Frontend |
| @testing-library/user-event | Realistic user interaction simulation | Frontend |
| @testing-library/jest-dom | Extended DOM matchers | Frontend |
| MSW 2+ | API mocking for component tests (no real network) | Frontend |
| Playwright 1.40+ | Full E2E browser tests | Full Stack |
| xUnit 2+ | Unit + Integration backend tests | Backend |
| FluentAssertions | Readable assertion API | Backend |
| WebApplicationFactory\<Program\> | In-process API testing (no external server) | Backend |
| TestContainers (Postgres) | Isolated ephemeral DB per test run | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432 (or TestContainers Docker)
- Docker (for TestContainers)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- Frontend + backend running for E2E tests (Playwright fixtures)
- MSW service worker registered in test environment for component tests
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Avg Hours/Test | Total Hours | Notes |
|----------|-------|----------------|-------------|-------|
| P0 | 7 | 2.0 | 14.0 | API contracts, form validation, cascade delete — complex setup |
| P1 | 17 | 1.0 | 17.0 | Standard CRUD component + API coverage |
| P2 | 8 | 0.75 | 6.0 | Performance, cancel, sort variants |
| P3 | 5 | 0.5 | 2.5 | Unit schema, accessibility, debounce |
| **Total** | **37** | — | **39.5 hours** | **~5 developer-days** |

### Test Data Strategy

- **Backend integration tests:** TestContainers spins up a fresh Postgres container per test class; seed data inserted via EF Core context in `ClassFixture`.
- **Component tests:** MSW handlers define mock responses per test file; no shared global state.
- **E2E tests:** Playwright `beforeEach` hooks call a test-reset API endpoint (or direct DB seeding) to guarantee a known starting state.

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (7 tests — no exceptions; these are non-negotiable before sprint starts)
- **P1 pass rate:** 100% (all 17 tests must pass before a story is closed as Done)
- **P2 pass rate:** ≥ 87% (7 of 8 minimum; cascade-orphan toast and performance are strongly recommended)
- **P3 pass rate:** ≥ 60% (informational — may be deferred with documented reason)

### Coverage Targets

| Area | Target |
|------|--------|
| CRUD API contract (create/read/update/delete) | 100% |
| Frontend form validation paths (happy + error) | 100% |
| Cache invalidation (FR27) on all mutations | 100% |
| Sort logic (all 4 options) | 100% |
| Error exposure (NFR6) — 409 + 500 verified | 100% |
| Deep linking | 100% |
| Search performance (NFR1) | 100% |

### Non-Negotiable Before Epic Closure

- [ ] TC-E2-P0-02 passes: 409 response is user-friendly, no stack trace
- [ ] TC-E2-P0-06 passes: Delete correctly orphans contacts (data integrity)
- [ ] TC-E2-P0-07 passes: UI reflects creation immediately (FR27)
- [ ] TC-E2-P1-16 + TC-E2-P1-17 pass: Sort client-side only (no extra API call)
- [ ] All R1, R3, R4 mitigations verified through automated tests

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All 7 P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] All 17 P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-17)
- [ ] At least 7 of 8 P2 test cases pass; any failures have documented justification
- [ ] No P0 or P1 test skipped without a recorded reason in the story file
- [ ] NIT/RUC 409 conflict message verified as user-friendly and no stack trace leaked
- [ ] Delete cascade-orphan behavior verified at both API (TC-E2-P0-06) and E2E (TC-E2-P2-04) levels
- [ ] All 4 sort options produce correct ordering in component tests
- [ ] `invalidateQueries` triggers verified for create, update, and delete operations

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **Cascade-orphan on delete:** The `DELETE /api/v1/clientes/{id}` endpoint must set `clienteId = null` on associated contacts before (or atomically with) removing the client row. Do NOT use `CASCADE DELETE` at the DB level — contacts must be preserved.
2. **409 error mapping:** The exception handler or result pattern must translate uniqueness constraint violations into HTTP 409 with `Content-Type: application/problem+json` and a Spanish user-safe detail message. The word "NIT/RUC" must appear in the `detail` field.
3. **TanStack Query cache invalidation:** Every mutation (create, update, delete) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in the `onSuccess` callback. Do NOT use optimistic updates alone — always invalidate for consistency with FR27.
4. **Client-side sort:** `SortControl` sort logic operates on the data in the TanStack Query cache via local `useState`. No `refetch()` call must be triggered on sort option change. MSW tests will assert zero additional API calls.
5. **Search filtering:** Filtering must happen synchronously over the cached array using `.filter()` on `nombre` and `nitRuc` fields (case-insensitive). No debounce is required for the first iteration but must complete within 1s for 500 records (NFR1).
6. **Form validation library:** Zod is the expected schema validation tool on the frontend. FluentValidation is the expected tool on the backend. Both must validate all 4 required fields: `nombre`, `nitRuc`, `telefono`, `ciudad`.
7. **Toast messaging:** Use the project's toast system (likely from siesa-ui-kit or sonner). The exact text strings are contractual for E2E tests: `"Cliente creado correctamente"`, `"Cliente actualizado correctamente"`, `"Cliente eliminado correctamente"`, and `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` (for cascade delete).
8. **SortControl component location:** `src/shared/components/SortControl`. Sort option identifiers must match: `nombre-asc` | `nombre-desc` | `fecha-desc` | `fecha-asc`.
9. **Deep linking:** The `/clientes/:clienteId` route must use TanStack Router's loader to fetch client data. The loader must return a 404-equivalent state (not throw an unhandled error) when the client ID does not exist.
10. **Empty list state:** The `GET /api/v1/clientes` endpoint must return HTTP 200 with an empty array `[]` when no clients exist — never a 404.
