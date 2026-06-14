---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-14"
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

Epic 2 implements the complete CRUD lifecycle for client records within the Siesa Agents CRM. This epic introduces the first domain entity (`clientes`) and establishes the full master-detail UI pattern: a left-panel scrollable client list with real-time search, a right-panel detail view, and an inline form for create/edit operations. Sorting is performed client-side over the TanStack Query cache. The backend exposes 5 REST endpoints under `/api/v1/clientes` (GET list, POST, GET by ID, PUT, DELETE) with FluentValidation and Problem Details RFC 7807 error handling.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | List rendering, real-time client-side filtering (<1s, 500 records), EmptyState, ErrorPanel |
| 2.2 | Client Detail View | Master-detail selection, deep-link `/clientes/:id`, not-found handling |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), NIT/RUC uniqueness (409), optimistic list update |
| 2.4 | Edit Client | Pre-filled form, partial updates, cancel without mutation, inline validation |
| 2.5 | Delete Client | Confirmation dialog, optimistic removal, associated-contacts preservation (`clienteId = null`) |
| 2.6 | Sort Client List | 4 sort modes (nombre-asc, nombre-desc, fecha-desc, fecha-asc), client-side, persists over search filter |

### Out of Scope for This Epic

- Contact CRUD — Epic 3
- Client-Contact association — Epic 4
- Authentication / authorization — explicitly deferred (MVP)
- Server-side pagination — deferred post-MVP
- Performance under 10 concurrent users (addressed in NFR Epic, separate workflow)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness constraint** not enforced at backend (missing FluentValidation + missing unique DB index `uk_clientes_nit`) silently creates duplicate records | High | Critical | P0 | API integration test: POST duplicate NIT → assert 409 Conflict + Problem Details body with "El NIT/RUC ya está registrado" message |
| R2 | **Client-side search** response time >1s with 500 records (NFR1 violation) | Medium | High | P0 | Component performance test: render 500 client items, assert filter debounce produces filtered list ≤150ms |
| R3 | **Delete cascade** on `clientes.id` propagates to `contactos` instead of setting `cliente_id = NULL` (FK ON DELETE SET NULL not configured) | Medium | Critical | P0 | API integration test: create client + associate contacts → DELETE client → assert contacts still exist with `clienteId = null` |
| R4 | **Required field validation** not triggered on frontend (Zod schema missing required rule for one of 4 fields) allowing form submission with empty data | Medium | High | P0 | Component test: submit form with each required field empty one at a time → assert inline error appears + backend call NOT made |
| R5 | **Optimistic UI update** (FR27) stale after mutation — `invalidateQueries(['clientes'])` not called after POST/PUT/DELETE, leaving stale list visible to user | Medium | High | P1 | Component integration test with MSW: after create/update/delete, assert list re-fetches and reflects new data |
| R6 | **Deep-link `/clientes/:id`** fails to load client detail on direct URL access (TanStack Router loader not fetching by ID on mount) | Medium | High | P1 | E2E test: navigate directly to `/clientes/{known-uuid}` → assert detail panel renders correct client data |
| R7 | **Sort + active search filter** interaction: changing sort order resets search input (useState update triggers unintended re-render clearing search state) | Medium | Medium | P1 | Component test: set search filter → change sort → assert search input value and filtered result set are preserved |
| R8 | **Cancel on edit form** silently mutates state — React Hook Form `reset()` not called on cancel, leaving form dirty on next open | Low | Medium | P2 | Component test: open edit form → modify field → click "Cancelar" → reopen form → assert fields show original values |
| R9 | **EmptyState** not rendered when database has no clients (API returns empty array `[]` but component checks for `undefined` instead of empty array) | Low | Medium | P2 | Component test with MSW returning `[]`: assert EmptyState component renders (not the list skeleton) |
| R10 | **ErrorPanel** with "Reintentar" button not wired to refetch (missing `refetch()` call on button click) | Low | Medium | P2 | Component test: simulate fetch failure → assert ErrorPanel renders → click "Reintentar" → assert refetch triggered |
| R11 | **Not-found graceful handling** for `/clientes/:id` with non-existent UUID shows JS error instead of message | Low | Medium | P2 | Component test: load route with UUID not in DB → assert not-found message renders without console error |

### Top 3 Risk Areas for Epic 2

1. **NIT/RUC uniqueness** (R1) — a duplicate NIT accepted silently corrupts the client catalogue and may cause downstream data integrity failures in the client-contact association (Epic 4). Both DB constraint and API validation must be in place.
2. **ON DELETE SET NULL cascade** (R3) — if the FK is set to ON DELETE CASCADE instead of ON DELETE SET NULL, deleting a client permanently destroys contact records, violating FR25 and business data integrity.
3. **Required field frontend validation** (R4) — missing Zod rules on any of the 4 required fields (Nombre, NIT/RUC, Teléfono, Ciudad) allows blank data to reach the API, creating corrupted records that are hard to clean up.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌▌▌▌           4 tests
  API Integration (xUnit)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  15 tests
  Component (Vitest+RTL+MSW)  ▌▌▌▌▌▌▌▌▌▌▌▌▌▌   14 tests
  Unit (Vitest/xUnit)         ▌▌▌▌▌▌              6 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                            39 tests
```

### Rationale

- **Epic 2 is domain-CRUD-heavy** — the highest value comes from API integration tests (endpoint contracts, validation, DB constraints) and component tests (form UX, search, sort, state management).
- **E2E tests** are reserved for the 4 critical user journeys that span full stack: create client visible in list, search finding real data, deep-link direct access, and delete confirmation flow.
- **Unit tests** cover pure logic: Zod schema validation, sort comparator functions, and backend domain entity invariants (NIT normalization, required field enforcement).
- **Component tests with MSW** intercept network calls to test React state transitions without depending on a live backend — critical for EmptyState, ErrorPanel, optimistic updates, and search filter + sort interaction.

### Testing Tools

| Tool | Purpose |
|------|---------|
| Vitest 4+ | Unit + Component tests (frontend) |
| @testing-library/react | Component rendering + user event simulation |
| @testing-library/user-event | Realistic user interactions (type, click) |
| MSW 2+ | Network interception for component tests |
| Playwright 1.40+ | E2E tests against running frontend + backend |
| xUnit 2+ | Unit + Integration tests (backend) |
| WebApplicationFactory\<Program\> | In-process API testing (backend) |
| Testcontainers (Postgres) | Isolated DB for integration tests |

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: POST /api/v1/clientes — NIT/RUC Uniqueness Returns 409 Conflict

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-E2.4 (field validation), Story 2.3 AC (409 NIT/RUC already exists)
**Risk covered:** R1

**Precondition:** PostgreSQL running with `clientes` table. An existing client with `nit = "900123456-7"` exists in the DB.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ "nombre": "Empresa Nueva", "nit": "900123456-7", "telefono": "3001234567", "ciudad": "Bogotá" }`.
2. Inspect HTTP status and response body.

**Expected Result:**
- HTTP status: 409 Conflict.
- `Content-Type: application/problem+json`.
- Response body contains `"detail"` field with text indicating NIT/RUC is already registered.
- Response body does NOT contain stack trace or internal exception details (NFR6).
- No new client record created in the database.

**Automation:** xUnit integration test with `WebApplicationFactory<Program>` + test database seeded with the duplicate NIT.

---

#### TC-E2-P0-02: POST /api/v1/clientes — Missing Required Fields Returns 400

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-E2.4 (FR8), Story 2.3 AC (form not submitted with empty fields)
**Risk covered:** R4

**Precondition:** Backend running with FluentValidation configured.

**Test Steps (parameterized — run for each required field):**
1. POST `/api/v1/clientes` with one required field omitted (test each: `nombre`, `nit`, `telefono`, `ciudad`).
2. Inspect HTTP status and response body.

**Expected Result (each variant):**
- HTTP status: 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response body identifies the specific missing field in `errors` or `detail`.
- No client record created.

**Automation:** xUnit parameterized integration test (4 test cases via `[Theory][InlineData]`).

---

#### TC-E2-P0-03: DELETE /api/v1/clientes/{id} Sets contactos.cliente_id to NULL (Not Cascade Delete)

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** Story 2.5 AC (associated contacts remain with `clienteId = null`), FR25
**Risk covered:** R3

**Precondition:** DB seeded with one client (ID: `client-uuid`) and two contacts with `clienteId = client-uuid`.

**Test Steps:**
1. DELETE `/api/v1/clientes/{client-uuid}`.
2. Assert HTTP 204 No Content.
3. Query `GET /api/v1/contactos` and find the two contact records by ID.

**Expected Result:**
- DELETE returns 204.
- Both contacts still exist in the database (not deleted).
- Both contacts have `clienteId: null` in their GET response.
- `GET /api/v1/clientes/{client-uuid}` returns 404 (client is gone).

**Automation:** xUnit integration test with seed data + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-04: Frontend Form — Each Required Field Shows Inline Error When Empty

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4 (FR8), Story 2.3 AC (inline error messages on empty fields)
**Risk covered:** R4

**Precondition:** `ClienteForm` component rendered with MSW interceptor on POST (should NOT be called). React Hook Form + Zod schema configured.

**Test Steps (run for each of 4 fields: Nombre, NIT/RUC, Teléfono, Ciudad):**
1. Render `<ClienteForm />`.
2. Leave the target field empty; fill all others with valid values.
3. Click "Guardar" (submit button).
4. Assert inline error appears under the empty field.
5. Assert MSW did NOT receive a POST request.

**Expected Result:**
- Inline error message appears on the empty required field.
- Form submit handler is blocked; no network call made.
- All other 3 fields (filled) do not show errors.

**Automation:** Vitest + RTL + MSW (`server.use(http.post(..., () => { throw new Error('should not be called') }))`) — 4 test cases.

---

#### TC-E2-P0-05: Client-Side Search Returns Results Under 150ms for 500 Records

**Level:** Component / Performance (Vitest)
**Story:** 2.1
**Requirement:** AC-E2.2, NFR1 (search results in under 1 second with 500 records)
**Risk covered:** R2

**Precondition:** `ClientListPanel` component rendered with a fixture of 500 client records (factory-generated) via MSW.

**Test Steps:**
1. Render `<ClientListPanel />` with 500 clients loaded.
2. Record `performance.now()` before simulating user typing in the search field.
3. Type "Empresa" (matches ~10% of records).
4. Record `performance.now()` after the filtered list renders.
5. Assert elapsed time.

**Expected Result:**
- Filter renders visibly changed list in ≤150ms (well within the 1s NFR1 requirement).
- Filtered list shows only clients whose `nombre` or `nit` contain "Empresa".
- No new API call is made during search (verify MSW receives no additional GET requests).

**Automation:** Vitest component test with `performance.now()` assertion. Fixture generated by `createClienteFixture` factory (500 items).

---

### P1 — Must Pass Before Story Is Closed as Done

#### TC-E2-P1-01: GET /api/v1/clientes — Returns Full Client List

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirement:** FR2 (scrollable list), FR3, FR4 (search)

**Precondition:** DB seeded with 3 clients.

**Test Steps:**
1. GET `/api/v1/clientes`.
2. Inspect response.

**Expected Result:**
- HTTP 200 OK.
- Response body is a JSON array of 3 objects.
- Each object contains: `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
- No extra internal fields (e.g., no EF navigation property names).

**Automation:** xUnit integration test.

---

#### TC-E2-P1-02: POST /api/v1/clientes — Creates Client and Returns 201 with Location Header

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** FR1, FR27

**Test Steps:**
1. POST `/api/v1/clientes` with valid body: `{ "nombre": "Siesa Tech", "nit": "800555111-0", "telefono": "6014445566", "ciudad": "Medellín" }`.

**Expected Result:**
- HTTP 201 Created.
- `Location` header points to `/api/v1/clientes/{new-id}`.
- Response body contains new client with a valid UUID `id`.
- GET `/api/v1/clientes/{new-id}` returns same data (201 actually persisted).

**Automation:** xUnit integration test.

---

#### TC-E2-P1-03: PUT /api/v1/clientes/{id} — Updates Client and Returns 200

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirement:** FR6, FR27

**Precondition:** Client `{ id: "existing-uuid", nombre: "Cliente Original", ... }` exists.

**Test Steps:**
1. PUT `/api/v1/clientes/existing-uuid` with `{ "nombre": "Cliente Actualizado", "nit": "...", "telefono": "...", "ciudad": "..." }`.

**Expected Result:**
- HTTP 200 OK.
- Response body has `nombre: "Cliente Actualizado"`.
- `updatedAt` timestamp is more recent than `createdAt`.
- GET by ID confirms updated data.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-04: DELETE /api/v1/clientes/{id} — Removes Client and Returns 204

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** FR7, FR27

**Precondition:** Client exists. No associated contacts.

**Test Steps:**
1. DELETE `/api/v1/clientes/{id}`.
2. GET `/api/v1/clientes/{id}`.

**Expected Result:**
- DELETE returns 204 No Content.
- Subsequent GET returns 404 Not Found.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-05: GET /api/v1/clientes/{id} — Returns 404 for Non-Existent ID

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirement:** Story 2.2 AC (not-found message displayed gracefully)
**Risk covered:** R6, R11

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.

**Expected Result:**
- HTTP 404 Not Found.
- `Content-Type: application/problem+json`.
- Problem Details body with `status: 404` and descriptive `title`.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-06: Client List Renders All Clients with Nombre and NIT Visible

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** Story 2.1 AC (list shows Nombre and NIT/RUC per item)

**Precondition:** MSW returns 3 clients on GET `/api/v1/clientes`.

**Test Steps:**
1. Render `<ClientListPanel />`.
2. Wait for loading state to resolve.
3. Query for each client by `nombre` text and `nit` text.

**Expected Result:**
- 3 client list items rendered.
- Each item displays `nombre` and `nit` visibly.
- No loading skeleton persists after data arrives.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: Client List Search Filters in Real Time

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** Story 2.1 AC (filters by Nombre or NIT/RUC in real time)

**Precondition:** MSW returns 5 clients. 2 match "Siesa" in nombre; 1 matches "900" in NIT.

**Test Steps:**
1. Render `<ClientListPanel />` and wait for list.
2. Type "Siesa" in search field.
3. Assert list shows only 2 matching clients.
4. Clear field and type "900".
5. Assert list shows the 1 NIT-matching client.

**Expected Result:**
- Search by `nombre` returns matching subset.
- Search by `nit` returns matching subset.
- No additional API call during typing (client-side filter).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Selecting Client Item Updates Detail Panel and URL

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** Story 2.2 AC (detail panel shows full info, URL updates to `/clientes/:id`)

**Precondition:** MSW returns client list. Client detail endpoint returns full detail for selected ID.

**Test Steps:**
1. Render full clients page with router.
2. Click first client item in the list.
3. Assert detail panel renders Nombre, NIT/RUC, Teléfono, Ciudad.
4. Assert URL is `/clientes/{selected-id}`.

**Expected Result:**
- Right panel displays all 4 fields for the selected client.
- URL updates via TanStack Router navigate (no page reload).

**Automation:** Vitest + RTL with `createMemoryHistory`.

---

#### TC-E2-P1-09: Create Client Form Submits and New Client Appears in List

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** Story 2.3 AC (client created and appears in list immediately), FR27
**Risk covered:** R5

**Precondition:** MSW: GET returns initial 2 clients; POST `/api/v1/clientes` returns 201 with new client; subsequent GET invalidated by TanStack Query returns 3 clients.

**Test Steps:**
1. Click "Nuevo cliente".
2. Fill form: Nombre="Empresa Test", NIT/RUC="123456789-0", Teléfono="3001234567", Ciudad="Cali".
3. Click "Guardar".
4. Assert success toast "Cliente creado correctamente".
5. Assert new client appears in the list.

**Expected Result:**
- POST request made with correct payload.
- `invalidateQueries(['clientes'])` triggers refetch.
- New client "Empresa Test" appears in the list.
- Toast message displayed.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: Edit Client Form Closes on Cancel Without Mutation

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** Story 2.4 AC (cancel without saving leaves original data unchanged)
**Risk covered:** R8

**Precondition:** Client detail loaded with Nombre="Cliente Original". MSW on PUT should NOT be called.

**Test Steps:**
1. Click "Editar".
2. Modify Nombre field to "Cliente Modificado".
3. Click "Cancelar".
4. Assert detail panel shows "Cliente Original" (not "Cliente Modificado").
5. Assert no PUT request was made.

**Expected Result:**
- Form closes.
- Detail panel retains original values.
- No mutation triggered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Delete Confirmation Dialog — Cancel Keeps Client

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** Story 2.5 AC (cancel in confirmation dialog → record remains)

**Test Steps:**
1. Click "Eliminar" on a client detail.
2. Assert confirmation dialog appears with "¿Eliminar este cliente?" text and "Confirmar" + "Cancelar" buttons.
3. Click "Cancelar".
4. Assert dialog closes.
5. Assert client detail is still visible (no DELETE request made).

**Expected Result:**
- Dialog appears with correct text.
- Cancel dismisses dialog.
- No DELETE API call.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Sort Applies Without New API Fetch

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6 AC (sort does not trigger new API call)
**Risk covered:** R7

**Precondition:** MSW returns 5 clients in creation order. SortControl visible.

**Test Steps:**
1. Select "Nombre A→Z" from SortControl.
2. Assert list is alphabetically ascending.
3. Assert no additional GET `/api/v1/clientes` request was made.
4. Select "Nombre Z→A".
5. Assert list is alphabetically descending.
6. Assert no additional GET.

**Expected Result:**
- All 4 sort modes re-order the in-memory list.
- Zero additional API calls for any sort change.
- Sort applied to full list (not paginated subset).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Sort Preserves Active Search Filter

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6 AC (sort applied to filtered set without clearing search input)
**Risk covered:** R7

**Precondition:** 5 clients loaded; 2 match search term "Siesa".

**Test Steps:**
1. Type "Siesa" in search field → list shows 2 clients.
2. Select "Nombre Z→A" from SortControl.
3. Assert search input still shows "Siesa".
4. Assert list shows 2 clients (filtered set) ordered Z→A.

**Expected Result:**
- Sort operates on the already-filtered result set.
- Search input value is not cleared.
- 0 additional API calls.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-14: E2E — Full Create Client Flow

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR27

**Precondition:** Frontend + backend running. DB empty or with existing clients.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente".
3. Fill all fields: Nombre, NIT/RUC, Teléfono, Ciudad with valid values.
4. Click "Guardar".
5. Assert toast "Cliente creado correctamente" is visible.
6. Assert new client appears in the left panel list.

**Expected Result:**
- Client is created end-to-end.
- Client appears in list immediately after creation (FR27).

**Tags:** @p1 @smoke @e2e

**Automation:** Playwright E2E.

---

#### TC-E2-P1-15: E2E — Search Finds Client by Name

**Level:** E2E (Playwright)
**Story:** 2.1
**Requirement:** AC-E2.2 (results in <1s), FR3

**Precondition:** At least 3 clients seeded, one named "Empresas Siesa SAS".

**Test Steps:**
1. Navigate to `/clientes`.
2. Type "Siesa" in search field.
3. Assert list filters to show only matching clients.
4. Measure time from typing to result rendering.

**Expected Result:**
- Only "Empresas Siesa SAS" (or clients matching "Siesa") visible.
- Render time < 1000ms (NFR1).

**Tags:** @p1 @e2e

**Automation:** Playwright E2E with `performance.now()` or `page.evaluate`.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: EmptyState Renders When Client List Is Empty

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** Story 2.1 AC (EmptyState displayed when no clients)
**Risk covered:** R9

**Precondition:** MSW returns `[]` (empty array) for GET `/api/v1/clientes`.

**Test Steps:**
1. Render `<ClientListPanel />`.
2. Wait for data to resolve.
3. Assert EmptyState component is visible.
4. Assert list is not rendered.

**Expected Result:**
- EmptyState component renders with guidance message for creating first client.
- No list items rendered.
- No error state shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-02: ErrorPanel with "Reintentar" Button Triggers Refetch

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** Story 2.1 AC (ErrorPanel with "Reintentar" when backend unavailable)
**Risk covered:** R10

**Precondition:** MSW simulates network error on first GET `/api/v1/clientes`. Subsequent GET succeeds.

**Test Steps:**
1. Render `<ClientListPanel />`.
2. Assert ErrorPanel is rendered with "Reintentar" button.
3. Click "Reintentar".
4. Assert client list renders successfully (second fetch succeeds).

**Expected Result:**
- ErrorPanel replaces the list on fetch failure.
- "Reintentar" triggers `refetch()`.
- On success, list renders and ErrorPanel is gone.

**Automation:** Vitest + RTL + MSW (using `server.use` for one-time error handler).

---

#### TC-E2-P2-03: Not-Found Message on /clientes/:id With Non-Existent UUID

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** Story 2.2 AC (not-found message displayed gracefully)
**Risk covered:** R11

**Precondition:** MSW returns 404 for GET `/api/v1/clientes/non-existent-id`.

**Test Steps:**
1. Render the clients route with path `/clientes/00000000-0000-0000-0000-000000000000`.
2. Wait for data fetch.
3. Assert not-found message component rendered.
4. Assert no JS uncaught errors in test output.

**Expected Result:**
- A graceful not-found message is displayed.
- No crash, no blank screen, no console error thrown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: E2E — Deep Link Direct Access to /clientes/:id

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** Story 2.2 AC (direct URL `/clientes/:clienteId` loads correct detail), FR30
**Risk covered:** R6

**Precondition:** Frontend + backend running. Client with known UUID seeded.

**Test Steps:**
1. Open browser directly to `/clientes/{known-client-uuid}` (no prior navigation).
2. Wait for page render.

**Expected Result:**
- Client detail panel renders with correct Nombre, NIT/RUC, Teléfono, Ciudad.
- No redirect to home/root.
- No 404 page (correct UUID).

**Tags:** @p2 @e2e

**Automation:** Playwright E2E.

---

#### TC-E2-P2-05: Edit Form Opens Pre-Filled With Current Client Values

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** Story 2.4 AC (form pre-filled with current values), FR6

**Precondition:** Client detail loaded: `{ nombre: "Cliente ABC", nit: "900123456-1", telefono: "3001112222", ciudad: "Bogotá" }`.

**Test Steps:**
1. Click "Editar".
2. Assert form input for Nombre has value "Cliente ABC".
3. Assert form input for NIT/RUC has value "900123456-1".
4. Assert form input for Teléfono has value "3001112222".
5. Assert form input for Ciudad has value "Bogotá".

**Expected Result:**
- All 4 fields pre-filled with current client values.
- No field is empty or reset.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-06: Delete Client With Associated Contacts Shows Informative Toast

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** Story 2.5 AC (toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.")

**Precondition:** MSW: GET `/api/v1/clientes/{id}` returns client with associated contacts. DELETE returns 204 with metadata indicating orphaned contacts.

**Test Steps:**
1. Click "Eliminar" on a client that has associated contacts.
2. Click "Confirmar" in the dialog.
3. Assert toast message contains "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

**Expected Result:**
- Specific informative toast appears (not generic "Cliente eliminado correctamente").
- Client removed from list.
- Right panel returns to default/empty state.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-07: Default Sort on Initial Load Is "Más reciente"

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6 AC (default sort is "Más reciente" when no preference set)

**Precondition:** MSW returns 3 clients in non-chronological order. No sort preference in local state.

**Test Steps:**
1. Render `<ClientListPanel />`.
2. Assert SortControl shows "Más reciente" selected.
3. Assert list order matches descending `createdAt` order.

**Expected Result:**
- Default sort option is "Más reciente" (`fecha-desc`).
- List renders newest client first.

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: E2E — Search By NIT/RUC Finds Client

**Level:** E2E (Playwright)
**Story:** 2.1
**Requirement:** AC-E2.2, FR4

**Test Steps:**
1. Navigate to `/clientes` with seeded clients.
2. Type a known NIT/RUC fragment in the search field.
3. Assert matching client appears in list.

**Tags:** @p3 @e2e

**Automation:** Playwright E2E.

---

#### TC-E2-P3-02: E2E — Full Edit Client Flow

**Level:** E2E (Playwright)
**Story:** 2.4
**Requirement:** AC-E2.3, FR6, FR27

**Test Steps:**
1. Navigate to `/clientes`, select a client.
2. Click "Editar", change Ciudad to "Barranquilla".
3. Click "Guardar".
4. Assert toast "Cliente actualizado correctamente".
5. Assert detail panel shows "Barranquilla".

**Tags:** @p3 @e2e

**Automation:** Playwright E2E.

---

#### TC-E2-P3-03: SortControl All 4 Options — Fecha-Asc and Fecha-Desc Ordering

**Level:** Unit (Vitest)
**Story:** 2.6
**Requirement:** Story 2.6 AC (sort by Más reciente / Más antiguo)

**Test Steps:**
1. Define array of 3 clients with distinct `createdAt` timestamps.
2. Apply `sortClientes(clients, 'fecha-asc')`.
3. Assert order is oldest first.
4. Apply `sortClientes(clients, 'fecha-desc')`.
5. Assert order is newest first.

**Expected Result:**
- `fecha-asc` produces ascending chronological order.
- `fecha-desc` produces descending chronological order.

**Automation:** Vitest unit test of the sort comparator function.

---

#### TC-E2-P3-04: Zod Schema Rejects NIT With Incorrect Format

**Level:** Unit (Vitest)
**Story:** 2.3
**Requirement:** NFR5 (input validation), AC-E2.4

**Test Steps:**
1. Import `clienteSchema` (Zod schema).
2. Parse `{ nombre: "Test", nit: "", telefono: "300", ciudad: "Cali" }`.
3. Assert Zod `ZodError` with error on `nit` field.

**Expected Result:**
- Schema parse fails with validation error on `nit`.
- Error message is user-friendly (not internal Zod code).

**Automation:** Vitest unit test.

---

#### TC-E2-P3-05: Backend xUnit — ClienteEntity Required Field Invariants

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirement:** FR8, NFR5

**Test Steps:**
1. Instantiate `ClienteEntity` with null/empty `Nombre`.
2. Assert FluentValidation `ClienteValidator` returns validation failure for `Nombre`.
3. Repeat for `NIT`, `Telefono`, `Ciudad`.

**Expected Result:**
- Validator returns failure for each missing required field.
- Error messages are descriptive and field-specific.

**Automation:** xUnit unit test with `ClienteValidator` direct invocation.

---

#### TC-E2-P3-06: Frontend Unit — useClientes Hook Returns Formatted Data

**Level:** Unit (Vitest)
**Story:** 2.1
**Requirement:** FR2

**Test Steps:**
1. Wrap `useClientes()` hook in `renderHook` with `QueryClientProvider`.
2. MSW returns 2 clients.
3. Assert hook returns `{ data: Cliente[], isLoading: false, isError: false }`.

**Expected Result:**
- Hook resolves to typed array of `Cliente` objects.
- No raw API shape leaked (DTO mapped to domain type if applicable).

**Automation:** Vitest + `renderHook` + MSW.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client with Nombre, NIT, Teléfono, Ciudad — appears in list immediately | 2.3 | TC-E2-P0-02, TC-E2-P0-04, TC-E2-P1-02, TC-E2-P1-09, TC-E2-P1-14 | Covered |
| AC-E2.2: Search by Nombre or NIT/RUC results in <1s | 2.1 | TC-E2-P0-05, TC-E2-P1-07, TC-E2-P1-15, TC-E2-P3-01 | Covered |
| AC-E2.3: View full detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-03, TC-E2-P1-08, TC-E2-P2-05, TC-E2-P3-02 | Covered |
| AC-E2.4: Required field validation — error messages on empty fields | 2.3, 2.4 | TC-E2-P0-02, TC-E2-P0-04, TC-E2-P3-04, TC-E2-P3-05 | Covered |
| AC-E2.5: Delete client — no longer appears in list | 2.5 | TC-E2-P0-03, TC-E2-P1-04, TC-E2-P1-11 | Covered |
| AC-E2.6: Sort list by 4 criteria without reloading or losing search filter | 2.6 | TC-E2-P1-12, TC-E2-P1-13, TC-E2-P2-07, TC-E2-P3-03 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search returns results < 1s with 500 records | TC-E2-P0-05, TC-E2-P1-15 | Component (perf) + E2E |
| NFR2 | CRUD changes reflect in UI < 2s | TC-E2-P1-09, TC-E2-P1-14 | Component + E2E |
| NFR5 | Input validated and sanitized before persistence | TC-E2-P0-02, TC-E2-P0-04, TC-E2-P3-04, TC-E2-P3-05 | API Integration + Unit |
| NFR6 | No stack traces or internal error details exposed | TC-E2-P0-01 (409 body), TC-E2-P0-02 (400 body) | API Integration |

---

## 7. Test Execution Order

```
Phase 1 — Backend Validation Gate (P0, requires DB)
  1. TC-E2-P0-01  NIT/RUC uniqueness → 409 Conflict
  2. TC-E2-P0-02  Missing required fields → 400 (4 parameterized variants)
  3. TC-E2-P0-03  DELETE preserves contacts (ON DELETE SET NULL)

Phase 2 — Frontend Form Validation Gate (P0, component level)
  4. TC-E2-P0-04  Required field inline errors (4 variants)
  5. TC-E2-P0-05  Search performance 500 records ≤150ms

Phase 3 — API CRUD Contract (P1, requires DB)
  6. TC-E2-P1-01  GET list returns all clients
  7. TC-E2-P1-02  POST creates client → 201 + Location
  8. TC-E2-P1-03  PUT updates client → 200
  9. TC-E2-P1-04  DELETE removes client → 204
 10. TC-E2-P1-05  GET non-existent → 404 Problem Details

Phase 4 — Core Component Tests (P1, MSW)
 11. TC-E2-P1-06  List renders with Nombre + NIT
 12. TC-E2-P1-07  Real-time search filter
 13. TC-E2-P1-08  Client selection updates detail + URL
 14. TC-E2-P1-09  Create form submits → list updates (FR27)
 15. TC-E2-P1-10  Edit cancel → no mutation
 16. TC-E2-P1-11  Delete dialog → cancel keeps client
 17. TC-E2-P1-12  Sort changes — no extra API call
 18. TC-E2-P1-13  Sort preserves active search filter

Phase 5 — E2E Integration (P1, full stack)
 19. TC-E2-P1-14  E2E: full create client flow
 20. TC-E2-P1-15  E2E: search by name finds client

Phase 6 — Edge Cases & UX Polish (P2)
 21. TC-E2-P2-01  EmptyState on empty list
 22. TC-E2-P2-02  ErrorPanel + Reintentar refetch
 23. TC-E2-P2-03  Not-found message on /clientes/:invalid-id
 24. TC-E2-P2-04  E2E: deep link /clientes/:id direct access
 25. TC-E2-P2-05  Edit form pre-filled with current values
 26. TC-E2-P2-06  Delete with contacts → informative toast
 27. TC-E2-P2-07  Default sort "Más reciente" on load

Phase 7 — Unit Tests & Additional E2E (P3)
 28. TC-E2-P3-01  E2E: search by NIT/RUC
 29. TC-E2-P3-02  E2E: full edit client flow
 30. TC-E2-P3-03  Sort comparator — fecha-asc and fecha-desc
 31. TC-E2-P3-04  Zod schema validates NIT field
 32. TC-E2-P3-05  Backend FluentValidation — 4 required fields
 33. TC-E2-P3-06  useClientes hook returns typed data
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 4+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/user-event | Realistic user interactions | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW 2+ | Network interception for component tests | Frontend |
| Playwright 1.40+ | E2E tests (create, search, deep-link, sort) | E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| Testcontainers (Postgres) | Isolated DB for integration tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally (port 5432)
- Database user with CREATE DATABASE privilege
- `siesa_agents_db` schema with `clientes` table migrated (EF Core migration applied)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- MSW service worker registered in test setup (src/test/setup.ts)
```

### Test Data Strategy

**Client Fixtures (frontend):**
```typescript
// src/modules/crm/clientes/testing/fixtures.ts
export function createClienteFixture(overrides?: Partial<Cliente>): Cliente {
  return {
    id: crypto.randomUUID(),
    nombre: `Cliente Test ${Math.random()}`,
    nit: `900${Math.floor(Math.random() * 999999)}-${Math.floor(Math.random() * 9)}`,
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Generate 500 fixtures for performance test
export const CLIENTES_500 = Array.from({ length: 500 }, (_, i) =>
  createClienteFixture({ nombre: `Empresa ${i < 50 ? 'Siesa' : 'Otro'} ${i}` })
);
```

**Backend Seed Data (xUnit):**
```csharp
// Seed via AppDbContext in WebApplicationFactory<Program> or TestContainers setup
private static ClienteEntity SeedCliente(AppDbContext db, string nit = "900000001-0") {
    var entity = new ClienteEntity { ID = Guid.NewGuid(), Nombre = "Seed Client", NIT = nit, Telefono = "3000000000", Ciudad = "Bogotá" };
    db.Clientes.Add(entity);
    db.SaveChanges();
    return entity;
}
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.0 | 10.0 | DB setup, uniqueness constraint, ON DELETE SET NULL, form validation |
| P1 | 15 | 1.2 | 18.0 | API CRUD contracts, component integration, E2E flows |
| P2 | 7 | 0.8 | 5.6 | Edge cases: EmptyState, ErrorPanel, not-found, deep-link E2E |
| P3 | 6 | 0.4 | 2.4 | Unit tests, additional E2E, sort unit tests |
| **Total** | **33** | — | **36.0 hours** | **~4.5 days** |

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (all 5 P0 tests must pass — no exceptions)
- **P1 pass rate**: 100% (core CRUD + user journeys — all 15 must pass)
- **P2 pass rate**: ≥85% (edge cases — may defer 1 with documented justification)
- **P3 pass rate**: Best effort — ≥60% (informational)

### Coverage Targets

- **CRUD operations** (POST, GET, PUT, DELETE): 100% API contract covered
- **Validation paths** (frontend Zod + backend FluentValidation): 100% of required fields
- **Data integrity** (ON DELETE SET NULL, NIT uniqueness): 100%
- **Core user journeys** (create, search, detail, edit, delete): 100% at P1+
- **NFR1 search performance**: verified at component level

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] NIT/RUC uniqueness enforced at both DB (unique index) and API (409) levels
- [ ] FK `ON DELETE SET NULL` verified — contacts preserved after client deletion (R3)
- [ ] All 4 required fields validated on both frontend (Zod) and backend (FluentValidation)
- [ ] No stack traces exposed in any error response (NFR6)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-15)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case skipped without documented reason
- [ ] `uk_clientes_nit` unique index confirmed in DB schema
- [ ] `ON DELETE SET NULL` FK constraint confirmed on `contactos.cliente_id`
- [ ] Client list re-renders immediately after create/update/delete (FR27 — TanStack Query invalidation verified)
- [ ] EmptyState, ErrorPanel, and not-found states covered at component level

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **NIT/RUC uniqueness:** The `clientes` EF Core entity must include `HasIndex(c => c.NIT).IsUnique()` in `OnModelCreating`. FluentValidation must check for existing NIT via repository and return a 409 if found.
2. **FK ON DELETE SET NULL:** The EF Core `ContactoEntity` FK relationship must be configured with `.OnDelete(DeleteBehavior.SetNull)` — NOT `Cascade`. Verify after migration with `\d contactos` in psql.
3. **Query invalidation (FR27):** All mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in the `onSuccess` callback.
4. **Sort state isolation:** The `SortControl` sort state (`useState<SortOption>`) must be co-located with the search state in the same component to avoid clearing the search filter on re-render.
5. **EmptyState condition:** The EmptyState component must render when `data !== undefined && data.length === 0` — NOT `!data`. Confusing `undefined` (loading) with `[]` (empty) causes the loading skeleton to persist.
6. **React Hook Form reset on cancel:** The edit form component must call `form.reset(clienteValues)` in the "Cancelar" click handler to restore original values before unmounting.
7. **TanStack Router loader for deep links:** `/clientes/:id` route must include a `loader` function that fetches the client by ID, enabling direct URL access without a prior list load (FR30).
8. **DELETE response for contacts toast:** The backend DELETE `/api/v1/clientes/{id}` should return metadata in the response body (or via a custom header) indicating whether associated contacts were orphaned, so the frontend can show the specific "Sus contactos asociados quedaron sin cliente asignado." toast.
