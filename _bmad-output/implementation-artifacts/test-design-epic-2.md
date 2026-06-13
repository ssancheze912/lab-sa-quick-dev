---
epic: 2
title: "Client Management — Gestión de Clientes"
mode: epic-level
phase: 4
createdAt: "2026-06-13"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: active
---

# Test Design — Epic 2: Client Management (Gestión de Clientes)

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers the complete CRUD lifecycle for the client catalog in Siesa Agents. The commercial team can register, search, view, edit, delete, and sort client records. The implementation covers: a split-panel UI at `/clientes` (280px left list + right detail panel), real-time client-side search and sort (no extra API calls), deep-linked client detail at `/clientes/:clienteId`, form validation with inline errors, duplicate NIT/RUC detection (backend 409 conflict), and cascading contact reassignment on delete (`clienteId = null`). All changes must be immediately visible (FR27) via TanStack Query invalidation.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Split-panel layout, real-time filter, EmptyState, ErrorPanel + retry |
| 2.2 | Client Detail View | Right panel detail, deep-link `/clientes/:clienteId`, not-found handling |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), 409 NIT conflict, immediate list update |
| 2.4 | Edit Client | Pre-filled form, mutation update, cancel discards changes |
| 2.5 | Delete Client | Confirmation dialog, orphan contacts (clienteId=null), custom toast |
| 2.6 | Sort Client List | Client-side sort over TanStack Query cache, combined filter+sort, default "Más reciente" |

### Out of Scope for This Epic

- Contact management flows (Epic 3)
- Client-to-contact association panel inside ClienteDetailView (Epic 4)
- Authentication / authorization (explicitly deferred)
- Server-side pagination / backend search endpoint (NFR10 scale does not warrant it)
- HTTPS configuration (non-local deployments only, NFR4)

### Functional Requirements Covered

FR1 (list clients), FR2 (search by name/NIT), FR3 (view client detail), FR4 (create client), FR5 (edit client), FR6 (delete client), FR7 (unique NIT validation), FR8 (required fields validation)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness** — duplicate NIT accepted silently because backend 409 error not mapped or frontend catches and hides it | High | Critical | P0 | Integration test: POST duplicate NIT → assert 409 + `"El NIT/RUC ya está registrado"` shown in UI without exposing technical detail (NFR6) |
| R2 | **Required fields bypass** — form submitted to backend with empty fields because Zod client-side validation not wired or pre-submit not triggered | High | High | P0 | Component test: submit with each required field empty one at a time → assert inline error message, no API call fired |
| R3 | **Orphan contacts on delete** — contacts remain with dangling clienteId (FK violation or cascade delete) instead of being set to NULL | Medium | Critical | P0 | Integration test: create client with contacts → delete client → assert contacts exist with `clienteId = null` |
| R4 | **Sort not applied on filtered results** — sort resets active search or triggers new API fetch (violating no-API-call requirement) | High | High | P1 | Component test: apply search → change sort → assert list filtered AND sorted, verify no additional network request |
| R5 | **Deep-link cold start** — navigating directly to `/clientes/:clienteId` fails to load because TanStack Query cache is empty on fresh load | Medium | High | P1 | E2E test: open browser directly at `/clientes/:uuid` → assert client detail renders correctly |
| R6 | **TanStack Query invalidation missing** — newly created or edited client does not appear in list because `queryClient.invalidateQueries(['clientes'])` not called in `onSuccess` | Medium | High | P1 | Component test: mutation succeeds → assert list contains new/updated item without manual page reload |
| R7 | **Confirmation dialog not shown on delete** — client deleted immediately without user confirmation | Medium | Critical | P1 | Component test: click "Eliminar" → assert dialog appears with correct text before any API call |
| R8 | **Cancel on edit reverts UI but leaves stale state** — after cancel, detail view shows pre-edit data but query cache holds dirty state causing a stale re-render | Low | Medium | P2 | Component test: edit → cancel → assert detail shows original data, query cache unchanged |
| R9 | **SortControl default** — list loads with wrong default order (not "Más reciente") | Low | Medium | P2 | Component test: initial render → assert SortControl shows "Más reciente" and list ordered by `createdAt` descending |
| R10 | **ErrorPanel not shown on fetch failure** — list renders blank or crashes instead of showing ErrorPanel with "Reintentar" on backend unavailability | Medium | High | P1 | Component test: mock fetch error → assert ErrorPanel rendered, Reintentar button present, click retriggers query |
| R11 | **Non-existent clienteId in URL** — navigating to `/clientes/nonexistent-id` throws uncaught error instead of graceful not-found message | Low | High | P1 | Component/E2E test: navigate to invalid UUID route → assert not-found message displayed, no JS exception |
| R12 | **Search performance** — real-time filter renders > 1s with 500 records due to expensive re-renders or lack of `useMemo` | Low | Critical | P2 | Performance test: 500 mock records + rapid keystroke input → assert filter completes in < 1s (NFR1) |

### Top 3 Risk Areas for Epic 2

1. **NIT/RUC uniqueness + backend error mapping** (R1) — the business requires unique client identifiers; a silent duplicate or a technical error message exposed to users violates both data integrity and NFR6.
2. **Orphan contacts on delete** (R3) — cascading `clienteId = null` is the core contract defined in Epic 2's AC-E2.5 and the FK strategy in the architecture; any deviation breaks Epic 4 (Association).
3. **Form validation not preventing API call** (R2) — the UX contract is that the backend is never called with invalid data; a bypass here could produce orphaned partial records and confuses users who see no error feedback.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌▌          4 tests
  API Integration (xUnit)     ▌▌▌▌▌▌▌▌▌▌▌▌   12 tests
  Component (Vitest+RTL+MSW)  ▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 18 tests
  Unit (Vitest/xUnit)         ▌▌▌▌▌▌▌▌         8 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                         42 tests
```

### Rationale

- **Component tests dominate** because most of the user-facing behaviour (search filter, sort, form validation, dialogs, toast feedback, EmptyState, ErrorPanel) is purely a React concern that can be verified faster and more precisely with Vitest + RTL + MSW than with E2E.
- **API integration tests are the second tier** because the client-side cannot exercise the backend contract (required fields, NIT uniqueness, orphan contact cascading) without a real HTTP layer; `WebApplicationFactory<Program>` is used in-process.
- **E2E tests are selective** — limited to cross-cutting user journeys that require the full browser+network stack: deep-link cold start, full create flow (form → toast → list update), full delete flow with contacts, and search+sort combined.
- **Unit tests** cover Zod validation schemas, `useMemo` sort/filter logic, and backend command handler edge cases (null clienteId handling).

### Testing Tools

| Tool | Purpose |
|------|---------|
| Vitest 2+ | Unit + Component tests (frontend) |
| @testing-library/react | Component rendering |
| @testing-library/user-event | Realistic user interactions (typing, clicking) |
| @testing-library/jest-dom | DOM matchers |
| MSW 2+ | API mock for component tests (isolates frontend from backend) |
| Playwright 1.40+ | E2E tests (full browser, real backend) |
| xUnit | Unit + Integration tests (backend) |
| WebApplicationFactory\<Program\> | In-process HTTP testing (.NET) |
| TestContainers (Postgres) | Isolated database for integration tests |

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: Form Validation — Empty Required Fields Blocked, No API Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3, 2.4
**Requirements:** AC-E2.4 (required fields validation), FR8
**Risk covered:** R2

**Precondition:** `ClienteForm` rendered via MSW. MSW handler for POST `/api/v1/clientes` records whether it was called.

**Test Steps:**
1. Render `ClienteForm` (create mode) with all fields empty.
2. Click "Guardar" submit button.
3. Assert inline error messages appear for Nombre, NIT/RUC, Teléfono, Ciudad.
4. Assert MSW handler for POST was NOT called (no network request fired).
5. Repeat for edit mode: pre-fill all fields, clear Nombre, submit → assert inline error for Nombre only, no PUT call.

**Expected Result:**
- Inline error messages visible on each empty required field.
- No HTTP request made to the backend.
- Form remains open (not dismissed).

**Automation:** Vitest + RTL + `@testing-library/user-event` + MSW.

---

#### TC-E2-P0-02: NIT/RUC Duplicate — Backend 409 Handled Gracefully

**Level:** API Integration + Component
**Story:** 2.3
**Requirements:** AC-E2.3 (409 conflict), FR7, NFR6
**Risk covered:** R1

**Part A — API Integration (xUnit):**

**Precondition:** Test database with one client `NIT = "900123456-1"`.

**Test Steps:**
1. POST `/api/v1/clientes` with body: `{ "nombre": "Nuevo", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }`.
2. Inspect response.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Response body contains `"detail"` with the text `"El NIT/RUC ya está registrado"` (or equivalent domain message).
- Response body does NOT contain `stackTrace`, `exception`, or raw SQL error text (NFR6).

**Part B — Component (Vitest + RTL + MSW):**

**Test Steps:**
1. MSW intercepts POST `/api/v1/clientes` and returns 409 with `{ "detail": "El NIT/RUC ya está registrado" }`.
2. User fills form with valid data and submits.
3. Assert an error message `"El NIT/RUC ya está registrado"` is rendered in the UI.
4. Assert no success toast shown.
5. Assert form remains open.

**Automation:** xUnit (WebApplicationFactory) + Vitest + RTL + MSW.

---

#### TC-E2-P0-03: Delete Client Cascades Contacts to clienteId = NULL

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirements:** AC-E2.5 (delete client), AC-E2.5 (orphan contacts), FR6, FR23
**Risk covered:** R3

**Precondition:** Database with `cliente_a` (UUID known) + 2 contacts (`contacto_x`, `contacto_y`) both with `cliente_id = cliente_a.id`.

**Test Steps:**
1. DELETE `/api/v1/clientes/{cliente_a.id}`.
2. Assert response: HTTP 204 No Content.
3. GET `/api/v1/contactos/{contacto_x.id}` — assert `clienteId` is `null`.
4. GET `/api/v1/contactos/{contacto_y.id}` — assert `clienteId` is `null`.
5. GET `/api/v1/clientes/{cliente_a.id}` — assert HTTP 404.

**Expected Result:**
- Client deleted (404 on subsequent GET).
- Both contacts still exist with `clienteId = null` (not deleted, not orphaned with stale FK).

**Automation:** xUnit integration test using `WebApplicationFactory` + TestContainers Postgres.

---

#### TC-E2-P0-04: Create Client — Full Happy Path (CRUD + List Update)

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirements:** AC-E2.1 (register client, appears in list immediately), FR4, FR27
**Risk covered:** R6

**Test Steps:**
1. GET `/api/v1/clientes` — record initial count N.
2. POST `/api/v1/clientes` with `{ "nombre": "Test Corp", "nit": "123456789-0", "telefono": "3101234567", "ciudad": "Medellín" }`.
3. Assert response: HTTP 201 Created.
4. Assert response body contains `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601), `updatedAt`.
5. GET `/api/v1/clientes` — assert count is N+1 and the new client is present.

**Expected Result:**
- 201 response with complete ClienteDto.
- Client immediately present in list endpoint.

**Automation:** xUnit + WebApplicationFactory + TestContainers.

---

#### TC-E2-P0-05: Required Fields Backend Validation Returns 400

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirements:** AC-E2.4 (required field messages), FR8, NFR5
**Risk covered:** R2

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ "nombre": "", "nit": "123", "telefono": "", "ciudad": "" }`.
2. Inspect response.

**Expected Result:**
- HTTP 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response body `errors` object contains entries for each missing/invalid field.
- No stack trace in response (NFR6).

**Automation:** xUnit + WebApplicationFactory.

---

### P1 — Must Pass Before Story is Closed as Done

---

#### TC-E2-P1-01: Client List — EmptyState Shown When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** Story 2.1 AC (empty state when no clients)

**Test Steps:**
1. MSW returns `[]` for GET `/api/v1/clientes`.
2. Render `ClienteListView`.
3. Assert `EmptyState` component is rendered.
4. Assert the message guides user to create the first client.
5. Assert no error panel is shown.

**Expected Result:**
- EmptyState component visible with descriptive Spanish message.
- No client list items rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Client List — ErrorPanel with Reintentar on Fetch Failure

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** Story 2.1 AC (backend unavailable → ErrorPanel + Reintentar)
**Risk covered:** R10

**Test Steps:**
1. MSW returns network error (500) for GET `/api/v1/clientes`.
2. Render `ClienteListView`.
3. Assert `ErrorPanel` component is rendered.
4. Assert a "Reintentar" button is visible.
5. Click "Reintentar" — assert TanStack Query re-fetches (MSW handler called again).

**Expected Result:**
- ErrorPanel visible, no list items.
- Retry button triggers a new fetch.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: Client Detail — Clicking List Item Updates Right Panel and URL

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirements:** Story 2.2 AC (right panel shows details, URL updates to `/clientes/:clienteId`), FR30

**Precondition:** MSW returns list with 2 clients. Client A has id `uuid-a`.

**Test Steps:**
1. Render split-panel at `/clientes`.
2. Click on Client A item in the left panel.
3. Assert URL updates to `/clientes/uuid-a`.
4. Assert right panel shows Nombre, NIT/RUC, Teléfono, Ciudad of Client A.

**Expected Result:**
- URL updated via TanStack Router (no full page reload).
- Right panel content reflects Client A data.

**Automation:** Vitest + RTL + MSW + TanStack Router test utilities.

---

#### TC-E2-P1-04: Deep Link — Cold Start on /clientes/:clienteId

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirements:** Story 2.2 AC (direct URL → client loads), FR30
**Risk covered:** R5

**Precondition:** A client with known UUID exists in the database. Frontend and backend running.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{known-uuid}` (no prior navigation, cold cache).
2. Wait for page to render.
3. Assert client detail panel shows Nombre, NIT/RUC, Teléfono, Ciudad.

**Expected Result:**
- Client detail renders without redirect or blank panel.
- Left list panel also populated.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-05: Deep Link — Non-Existent clienteId Shows Not-Found Message

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirements:** Story 2.2 AC (non-existent id → not-found message)
**Risk covered:** R11

**Test Steps:**
1. MSW returns 404 for GET `/api/v1/clientes/non-existent-id`.
2. Render at `/clientes/non-existent-id`.
3. Assert a not-found message is displayed in the right panel.
4. Assert no JS exception thrown, no crash.

**Expected Result:**
- Graceful not-found message in Spanish.
- App shell remains functional.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-06: Create Client — Success Toast and List Refresh

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirements:** AC-E2.1 (client appears in list immediately), FR27
**Risk covered:** R6

**Precondition:** MSW: initial list = 1 client. POST `/api/v1/clientes` returns 201 with new client. After invalidation, GET `/api/v1/clientes` returns 2 clients.

**Test Steps:**
1. Render `ClienteListView` (1 client visible).
2. Click "Nuevo cliente" — assert form opens.
3. Fill Nombre, NIT/RUC, Teléfono, Ciudad. Click "Guardar".
4. Assert toast `"Cliente creado correctamente"` appears.
5. Assert list now shows 2 clients (TanStack Query invalidation triggered re-fetch).
6. Assert form is closed.

**Expected Result:**
- Success toast in Spanish.
- New client visible in list immediately.
- Form dismissed.

**Automation:** Vitest + RTL + MSW + `@testing-library/user-event`.

---

#### TC-E2-P1-07: Edit Client — Pre-Fill, Save, List Reflects Changes

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirements:** Story 2.4 AC (pre-filled form, changes reflected immediately), FR5, FR27

**Precondition:** Client A has `nombre = "Acme"`. MSW: GET by id returns Client A. PUT returns updated client.

**Test Steps:**
1. Navigate to client detail for Client A.
2. Click "Editar" — assert form opens with `nombre = "Acme"`.
3. Clear Nombre field, type "Acme Actualizado".
4. Click "Guardar".
5. Assert toast `"Cliente actualizado correctamente"`.
6. Assert detail panel shows `"Acme Actualizado"`.
7. Assert list also reflects updated name.

**Expected Result:**
- Form pre-filled with existing data.
- Toast in Spanish.
- Detail and list updated immediately.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Edit Client — Cancel Discards Changes

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirements:** Story 2.4 AC (cancel → original data unchanged)
**Risk covered:** R8

**Test Steps:**
1. Open edit form for Client A (`nombre = "Acme"`).
2. Change Nombre to "Modificado Sin Guardar".
3. Click "Cancelar".
4. Assert form closes.
5. Assert detail panel still shows `"Acme"`.
6. Assert no PUT request was fired (MSW handler not called).

**Expected Result:**
- Original data preserved after cancel.
- No mutation sent to backend.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: Delete Client — Confirmation Dialog Required

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirements:** Story 2.5 AC (confirmation dialog before deletion)
**Risk covered:** R7

**Test Steps:**
1. Render client detail for Client A.
2. Click "Eliminar".
3. Assert confirmation dialog appears with text `"¿Eliminar este cliente?"`.
4. Assert "Confirmar" and "Cancelar" buttons are visible.
5. Assert no DELETE request was fired at this point (MSW handler not called yet).

**Expected Result:**
- Dialog shows before any deletion.
- API not called until user confirms.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: Delete Client — Cancel Dialog Keeps Client

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirements:** Story 2.5 AC (cancel → client unchanged)

**Test Steps:**
1. Click "Eliminar" on Client A → dialog appears.
2. Click "Cancelar" in dialog.
3. Assert dialog closes.
4. Assert no DELETE request fired.
5. Assert client still visible in list.

**Expected Result:**
- Client not deleted.
- List unchanged.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Delete Client — Confirm Deletes Client, Shows Correct Toast

**Level:** Component + E2E
**Story:** 2.5
**Requirements:** Story 2.5 AC (client removed from list, right panel returns to default, toast)

**Part A — Component:**

**Test Steps:**
1. MSW: DELETE `/api/v1/clientes/{id}` returns 204. After invalidation, GET returns list without deleted client.
2. Click "Eliminar" → dialog → "Confirmar".
3. Assert toast message appropriate to whether client had contacts:
   - Without contacts: `"Cliente eliminado correctamente"`.
   - With contacts: `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."`.
4. Assert client no longer in list.
5. Assert right panel returns to default (empty/placeholder) state.

**Expected Result:**
- Correct contextual toast (no-contacts vs with-contacts variant).
- List and panel updated immediately.

**Automation:** Vitest + RTL + MSW (two test cases — with and without contacts).

**Part B — E2E (Playwright):**
1. Create client with contacts via API setup.
2. Navigate to client detail.
3. Delete client via UI.
4. Assert contacts still exist at `/api/v1/contactos` with `clienteId = null`.

---

#### TC-E2-P1-12: Sort — No API Call Triggered When Changing Sort Order

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** Story 2.6 AC (sort without new API call), Technical Context
**Risk covered:** R4

**Precondition:** MSW returns 3 clients (names: "Zeta Corp", "Alpha SA", "Mega Ltd") with different `createdAt`. MSW request counter tracks GET `/api/v1/clientes` calls.

**Test Steps:**
1. Render `ClienteListView` — assert initial GET called once.
2. Select "Nombre A→Z" from SortControl.
3. Assert order: Alpha SA, Mega Ltd, Zeta Corp.
4. Assert no additional GET request fired (counter still = 1).
5. Select "Nombre Z→A".
6. Assert order: Zeta Corp, Mega Ltd, Alpha SA.
7. Assert counter still = 1.

**Expected Result:**
- Sort is purely client-side — zero additional API calls.
- Order changes correctly for all four sort options.

**Automation:** Vitest + RTL + MSW with request counter.

---

#### TC-E2-P1-13: Sort + Search Combined — Filter Preserved When Sorting

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** Story 2.6 AC (sort applied to filtered result set without clearing search input)
**Risk covered:** R4

**Precondition:** 5 clients — 3 have "Corp" in name, 2 do not.

**Test Steps:**
1. Type "Corp" in search field — assert only 3 clients visible.
2. Change sort to "Nombre A→Z".
3. Assert only 3 "Corp" clients visible (search not cleared).
4. Assert they are in alphabetical ascending order.
5. Assert search input still shows "Corp".

**Expected Result:**
- Search filter AND sort both active simultaneously.
- No filter reset on sort change.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-14: Sort Default — Initial Render Ordered by "Más reciente"

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** Story 2.6 AC (default sort = "Más reciente")
**Risk covered:** R9

**Precondition:** 3 clients with different `createdAt` (oldest first in API response).

**Test Steps:**
1. Render `ClienteListView` with no prior sort state.
2. Assert SortControl displays "Más reciente" as selected option.
3. Assert list order is newest client first (by `createdAt` descending).

**Expected Result:**
- Default sort option "Más reciente" selected.
- List ordered by `createdAt` descending.

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic Is Marked Complete

---

#### TC-E2-P2-01: Search — Real-Time Filter Updates Within 1 Second (NFR1)

**Level:** Component / Performance (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** AC-E2.2 (search < 1 second with 500 records), NFR1
**Risk covered:** R12

**Precondition:** MSW returns 500 mock client records. Timer measurement enabled.

**Test Steps:**
1. Render `ClienteListView` with 500 clients.
2. Start timer. Type a 4-character search string.
3. Stop timer after list re-renders with filtered results.
4. Assert elapsed time < 1000ms.
5. Assert only matching clients visible.

**Expected Result:**
- Filter renders in < 1s for 500 records.
- Results correctly filtered.

**Automation:** Vitest + RTL + MSW (using `performance.now()` or fake timers).

---

#### TC-E2-P2-02: Search — Filters by Both Nombre and NIT/RUC

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** AC-E2.2 (search by name or NIT/RUC), FR2

**Precondition:** 3 clients: A (nombre="Acme", nit="111"), B (nombre="Beta", nit="222"), C (nombre="Corp", nit="111333").

**Test Steps:**
1. Type "Acme" in search → assert only client A visible.
2. Clear → type "222" → assert only client B visible.
3. Clear → type "111" → assert clients A and C visible (both match NIT substring).

**Expected Result:**
- Search matches on both Nombre and NIT/RUC fields.
- Partial matches supported.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Client List Layout — 280px Left Panel Visible

**Level:** Component (Vitest + RTL)
**Story:** 2.1, 2.2
**Requirements:** Story 2.1 (left panel 280px), Architecture spec

**Test Steps:**
1. Render split-panel view.
2. Assert left panel element has computed width of 280px (or equivalent CSS class applied).
3. Assert list items in left panel each show Nombre and NIT/RUC.

**Expected Result:**
- Panel renders at correct width.
- Each list item displays required fields.

**Automation:** Vitest + RTL (CSS class assertion or computed style).

---

#### TC-E2-P2-04: Edit Client — Required Field Cleared Shows Inline Error, No PUT Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirements:** Story 2.4 AC (required field cleared → inline error, no submit), FR8

**Test Steps:**
1. Open edit form for Client A (all fields pre-filled).
2. Clear Telefono field.
3. Click "Guardar".
4. Assert inline error on Telefono field.
5. Assert no PUT request fired.

**Expected Result:**
- Inline error for cleared required field.
- Backend not called.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-05: Zod Schema — Validates All Required Fields Correctly

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirements:** FR8 (client-side validation), NFR5

**Test Steps:**
1. Import `clienteSchema` from `src/modules/crm/clientes/application/clienteSchema.ts`.
2. `parse({ nombre: "", nit: "123", telefono: "3001", ciudad: "Bogotá" })` — assert validation error on `nombre`.
3. `parse({ nombre: "Acme", nit: "", telefono: "3001", ciudad: "Bogotá" })` — assert error on `nit`.
4. `parse({ nombre: "Acme", nit: "900", telefono: "3001", ciudad: "Bogotá" })` — assert success (no error).

**Expected Result:**
- Each required field independently validated.
- Valid complete object parses without error.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-06: Backend FluentValidation — All Four Fields Required

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirements:** FR8, NFR5

**Test Steps:**
1. Instantiate `CreateClienteRequestValidator`.
2. Validate object with each field set to empty string or null one at a time.
3. Assert validation failure with appropriate field name in error.

**Expected Result:**
- `Nombre`, `Nit`, `Telefono`, `Ciudad` each individually fail validation when empty.
- Error message in Spanish (matches NFR6/UX standard).

**Automation:** xUnit unit test.

---

#### TC-E2-P2-07: Update Client — PUT Endpoint Returns Updated Data

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirements:** FR5 (edit client), FR27

**Test Steps:**
1. Create client with `nombre = "Original"`.
2. PUT `/api/v1/clientes/{id}` with `{ "nombre": "Updated", "nit": "900", "telefono": "300", "ciudad": "Cali" }`.
3. Assert response: HTTP 200 with updated `nombre = "Updated"` and updated `updatedAt`.
4. GET `/api/v1/clientes/{id}` — assert persisted changes.

**Expected Result:**
- 200 response with all updated fields.
- Changes persisted in database.

**Automation:** xUnit + WebApplicationFactory + TestContainers.

---

#### TC-E2-P2-08: Get Client by ID — Returns 404 for Non-Existent ID

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirements:** Story 2.2 (non-existent clienteId → not-found)
**Risk covered:** R11

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.
2. Assert response: HTTP 404.
3. Assert `Content-Type: application/problem+json`.

**Expected Result:**
- 404 with Problem Details format.
- No stack trace.

**Automation:** xUnit + WebApplicationFactory.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: Full Create-to-Delete E2E Journey

**Level:** E2E (Playwright)
**Story:** 2.3, 2.5

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente", fill form, submit.
3. Assert new client appears in list.
4. Click client → assert detail shows.
5. Click "Eliminar" → confirm.
6. Assert client removed from list.

**Expected Result:**
- Complete CRUD flow works end-to-end in real browser with real backend.

**Automation:** Playwright E2E.

---

#### TC-E2-P3-02: Full Edit Flow E2E

**Level:** E2E (Playwright)
**Story:** 2.4

**Test Steps:**
1. Create client via API setup.
2. Navigate to `/clientes/{id}`.
3. Click "Editar", change Ciudad, save.
4. Assert updated Ciudad shown in detail.

**Expected Result:**
- Edit flow works end-to-end.

**Automation:** Playwright E2E.

---

#### TC-E2-P3-03: SortControl All Four Options — Render Verification

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** Story 2.6 AC (four sort identifiers)

**Test Steps:**
1. Render `SortControl` component from `src/shared/components/SortControl`.
2. Assert it renders four options: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo".
3. Assert option identifiers match: `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`.

**Expected Result:**
- All four sort options present and correctly labeled.

**Automation:** Vitest + RTL.

---

#### TC-E2-P3-04: clienteSchema — NIT/RUC format validation (if business rule added)

**Level:** Unit (Vitest)
**Story:** 2.3

**Note:** Document validation rules once decided. If NIT format rule is added (e.g., pattern `^\d{9}-\d$`), add unit test here validating format acceptance and rejection.

**Automation:** Vitest unit test (deferred pending business rule confirmation).

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client, appears in list immediately | 2.3 | TC-E2-P0-04, TC-E2-P1-06 | Covered |
| AC-E2.2: Search by name or NIT/RUC < 1s | 2.1 | TC-E2-P2-01, TC-E2-P2-02 | Covered |
| AC-E2.3: View detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-03, TC-E2-P1-07 | Covered |
| AC-E2.4: Required fields blocked with clear error messages | 2.3, 2.4 | TC-E2-P0-01, TC-E2-P0-05, TC-E2-P2-04 | Covered |
| AC-E2.5: Delete client, removed from list | 2.5 | TC-E2-P0-03, TC-E2-P1-09, TC-E2-P1-10, TC-E2-P1-11 | Covered |
| AC-E2.6: Sort by 4 criteria without page reload, filter preserved | 2.6 | TC-E2-P1-12, TC-E2-P1-13, TC-E2-P1-14 | Covered |

### Story-Level AC Coverage

| Story AC | Test Cases |
|----------|-----------|
| 2.1 — List with Nombre + NIT visible | TC-E2-P2-03 |
| 2.1 — Real-time filter | TC-E2-P2-01, TC-E2-P2-02 |
| 2.1 — EmptyState when no clients | TC-E2-P1-01 |
| 2.1 — ErrorPanel + Reintentar on fetch failure | TC-E2-P1-02 |
| 2.2 — Right panel shows client details on click | TC-E2-P1-03 |
| 2.2 — URL updates to /clientes/:clienteId | TC-E2-P1-03 |
| 2.2 — Direct URL loads correct client (deep link) | TC-E2-P1-04 |
| 2.2 — Non-existent clienteId shows not-found | TC-E2-P1-05, TC-E2-P2-08 |
| 2.3 — Form opens with required fields | TC-E2-P0-01 |
| 2.3 — Submit success → list update + toast | TC-E2-P0-04, TC-E2-P1-06 |
| 2.3 — Empty required fields → inline errors, no submit | TC-E2-P0-01, TC-E2-P0-05 |
| 2.3 — Duplicate NIT → 409 handled gracefully | TC-E2-P0-02 |
| 2.4 — Form pre-filled with current values | TC-E2-P1-07 |
| 2.4 — Save reflects changes immediately | TC-E2-P1-07, TC-E2-P2-07 |
| 2.4 — Clear required field → inline error, no submit | TC-E2-P2-04 |
| 2.4 — Cancel preserves original data | TC-E2-P1-08 |
| 2.5 — Confirmation dialog appears | TC-E2-P1-09 |
| 2.5 — Confirm → client removed from list + toast | TC-E2-P1-11 |
| 2.5 — Cancel dialog → client unchanged | TC-E2-P1-10 |
| 2.5 — Contacts become unassigned (clienteId=null) | TC-E2-P0-03, TC-E2-P1-11 |
| 2.6 — Sort Nombre A→Z without new API call | TC-E2-P1-12 |
| 2.6 — Sort Nombre Z→A without new API call | TC-E2-P1-12 |
| 2.6 — Sort Más reciente / Más antiguo | TC-E2-P1-12 |
| 2.6 — Sort on filtered set, search preserved | TC-E2-P1-13 |
| 2.6 — Default sort = Más reciente | TC-E2-P1-14 |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P2-01 | Component/Performance |
| NFR2 | CRUD changes reflected in UI < 2s | TC-E2-P1-06, TC-E2-P1-07, TC-E2-P1-11 | Component (MSW) |
| NFR5 | Input validation / sanitization on API | TC-E2-P0-05, TC-E2-P2-06 | API Integration + Unit |
| NFR6 | No stack traces or internal details exposed | TC-E2-P0-02 (Part A), TC-E2-P0-05 | API Integration |
| NFR7 | Core tasks completable without training | TC-E2-P3-01 (E2E journey) | E2E |

---

## 7. Test Execution Order

```
Phase 1 — Backend Contract Gate (P0 — DB required)
  1. TC-E2-P0-04  Create client happy path (201 + list refresh)
  2. TC-E2-P0-05  Required fields → 400 Problem Details
  3. TC-E2-P0-02  Duplicate NIT → 409 (Part A)
  4. TC-E2-P0-03  Delete cascades contacts to clienteId=null

Phase 2 — Frontend Validation Gate (P0 — component, no real backend)
  5. TC-E2-P0-01  Form validation blocks submit, no API call
  6. TC-E2-P0-02  409 handled gracefully in UI (Part B)

Phase 3 — List & Detail (P1)
  7. TC-E2-P1-01  EmptyState
  8. TC-E2-P1-02  ErrorPanel + Reintentar
  9. TC-E2-P1-03  Click → right panel + URL update
 10. TC-E2-P1-04  Deep link cold start (E2E)
 11. TC-E2-P1-05  Non-existent id → not-found message

Phase 4 — Mutations (P1)
 12. TC-E2-P1-06  Create → success toast + list refresh
 13. TC-E2-P1-07  Edit → save → immediate update
 14. TC-E2-P1-08  Edit → cancel → data unchanged
 15. TC-E2-P1-09  Delete → dialog required
 16. TC-E2-P1-10  Delete → cancel → client stays
 17. TC-E2-P1-11  Delete → confirm → removed + correct toast

Phase 5 — Sort (P1)
 18. TC-E2-P1-12  Sort — no API call
 19. TC-E2-P1-13  Sort + filter combined
 20. TC-E2-P1-14  Default sort = Más reciente

Phase 6 — Quality & NFR (P2)
 21. TC-E2-P2-01  Search performance < 1s / 500 records
 22. TC-E2-P2-02  Search by Nombre AND NIT
 23. TC-E2-P2-03  Layout — 280px left panel
 24. TC-E2-P2-04  Edit required field cleared → inline error
 25. TC-E2-P2-05  Zod schema unit tests
 26. TC-E2-P2-06  FluentValidation unit tests
 27. TC-E2-P2-07  PUT endpoint returns updated data
 28. TC-E2-P2-08  GET by id — 404 for non-existent

Phase 7 — E2E Journeys + Nice to Have (P3)
 29. TC-E2-P3-01  Full create-to-delete E2E journey
 30. TC-E2-P3-02  Full edit flow E2E
 31. TC-E2-P3-03  SortControl render verification
 32. TC-E2-P3-04  NIT format validation (if business rule confirmed)
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/user-event | Realistic interaction simulation | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW 2+ | API mocking for component tests | Frontend |
| Playwright 1.40+ | E2E tests (deep-link, full journeys) | E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated PostgreSQL for integration tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on port 5432 with CREATE DATABASE privilege
- siesa_agents_db created (Epic 1 prerequisite)
- clientes and contactos tables migrated (this epic adds both)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- Frontend dev server on port 5173, backend on port 5000 (for E2E)
```

### Test Data Strategy

**Backend integration tests:**
- Use `TestContainers` (Postgres) for isolated DB per test class.
- Seed data per test via `WebApplicationFactory` HTTP client or direct EF context.
- Use UUIDs generated at test runtime (no hardcoded IDs except for 404 tests).

**Component tests:**
- MSW handlers defined per test file in `src/modules/crm/clientes/**/__tests__/`.
- Mock clients use factory functions: `createMockCliente({ nombre: "Test", nit: "900" })`.
- 500-record dataset for NFR1 performance test generated programmatically.

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.5 | 12.5 | Complex: DB cascade, form validation, 409 mapping |
| P1 | 14 | 1.5 | 21.0 | Standard coverage: CRUD flows, sort, dialog, deep link |
| P2 | 8 | 1.0 | 8.0 | Quality tests: NFR1 perf, layout, unit validators |
| P3 | 4 | 0.5 | 2.0 | E2E journeys + SortControl verification |
| **Total** | **31** | — | **43.5 hours** | **~5.4 days** |

Note: Test count is 31 logical test cases; some cases (TC-E2-P1-11, TC-E2-P0-02) have two parts (component + API) contributing to the 42 automation entries in the pyramid.

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% — no exceptions; all 5 P0 tests must pass before any story is marked Done.
- **P1 pass rate:** 100% — all 14 P1 tests must pass for the epic to be closed.
- **P2 pass rate:** ≥ 90% — may defer 1 test with justification; NFR1 (TC-E2-P2-01) is non-negotiable.
- **P3 pass rate:** ≥ 75% (informational only).

### Coverage Targets

| Area | Target |
|------|--------|
| Epic-level ACs (AC-E2.1 – AC-E2.6) | 100% |
| Story-level ACs | ≥ 95% |
| P0 risk mitigations (R1, R2, R3) | 100% |
| NFR1 (search < 1s) | 100% (TC-E2-P2-01 mandatory) |
| NFR6 (no stack trace exposure) | 100% (TC-E2-P0-02 Part A, TC-E2-P0-05) |
| Backend API endpoints | 100% of 5 endpoints (GET list, GET by id, POST, PUT, DELETE) |

### Non-Negotiable Requirements

- [ ] TC-E2-P0-01 passes: form validation blocks API call with empty fields
- [ ] TC-E2-P0-02 passes: duplicate NIT → 409, graceful UI error
- [ ] TC-E2-P0-03 passes: delete client cascades contacts to `clienteId = null`
- [ ] TC-E2-P0-04 passes: POST 201 + client appears in list
- [ ] TC-E2-P0-05 passes: backend returns 400 Problem Details for invalid input
- [ ] TC-E2-P1-12 passes: sort triggers zero additional API calls
- [ ] TC-E2-P2-01 passes: search renders in < 1s with 500 records

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-14)
- [ ] P2 test cases pass with ≥ 90% rate; TC-E2-P2-01 (NFR1) must pass
- [ ] No P0/P1 test case skipped without documented justification
- [ ] All 5 REST endpoints verified via API integration tests
- [ ] Orphan contact cascade (`clienteId = null`) verified at DB level (TC-E2-P0-03)
- [ ] No stack traces exposed in any error response (TC-E2-P0-02 Part A, TC-E2-P0-05)
- [ ] E2E deep-link test (TC-E2-P1-04) passes with real frontend + backend

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **TanStack Query invalidation is mandatory** after every mutation (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`): call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`.
2. **Zod schema** `clienteSchema` must declare all four fields (`nombre`, `nit`, `telefono`, `ciudad`) as `z.string().min(1)` — empty strings are invalid.
3. **FluentValidation** `CreateClienteRequestValidator` and `UpdateClienteRequestValidator` must enforce non-empty on all four fields with Spanish error messages.
4. **409 conflict** for duplicate NIT must return `Problem Details` with `detail` = `"El NIT/RUC ya está registrado"` (not a raw DB error message).
5. **`ON DELETE SET NULL`** must be configured on `contactos.cliente_id` FK in `ContactoConfiguration.cs` — this is the architectural contract for TC-E2-P0-03.
6. **Toast messages must be in Spanish** and match exactly: `"Cliente creado correctamente"`, `"Cliente actualizado correctamente"`, `"Cliente eliminado correctamente"`, `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."`.
7. **Sort is purely client-side** over the TanStack Query cache — do not add `?sort=` query params to the API call; use `useMemo` to sort the cached array.
8. **SortControl** lives at `src/shared/components/SortControl` with option identifiers: `nombre-asc` | `nombre-desc` | `fecha-desc` | `fecha-asc`. Default: `fecha-desc`.
9. **Error display** — never surface raw `error.message` to the user; use `<ErrorPanel onRetry={refetch} />` for list load failures, inline form error for validation failures, Toast for mutation failures.
10. **Deep-link support** — `useCliente(id)` hook must fetch from GET `/api/v1/clientes/{id}` when the URL contains a `clienteId` param and the cache is empty (cold start).
