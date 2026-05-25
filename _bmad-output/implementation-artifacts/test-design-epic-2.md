---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-05-25"
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

Epic 2 delivers the full client management feature for Siesa Agents: commercial team members can list, search, sort, view, create, edit, and delete client records. The implementation is a two-panel SPA layout (`/clientes` and `/clientes/:clienteId`) backed by five REST endpoints (`GET`, `POST`, `GET/:id`, `PUT/:id`, `DELETE/:id`) on `/api/v1/clientes`. Client-side filtering and sorting (TanStack Query cache + React `useState`) guarantee sub-second responsiveness for up to 500 records (NFR1). Validation is double-layered: Zod on the frontend and FluentValidation on the backend.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | List rendering, real-time search (< 1s), EmptyState, ErrorPanel + Retry |
| 2.2 | Client Detail View | Right-panel detail, URL deep linking `/clientes/:clienteId`, not-found graceful handling |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), 409 NIT/RUC conflict, success toast, instant list refresh |
| 2.4 | Edit Client | Pre-filled form, optimistic update, cancel without side-effects, inline validation on empty fields |
| 2.5 | Delete Client | Confirmation dialog, toast variants (simple + with orphaned contacts), cancel no-op, contact orphan handling |
| 2.6 | Sort Client List | Four sort options (client-side only), no extra API call, sort persists while search filter active |

### Out of Scope for This Epic

- Contact management (`/contactos`) — Epic 3
- Client–Contact association panel within client detail — Epic 4
- Authentication / authorization — explicitly deferred (MVP)
- Server-side pagination — NFR10/NFR11 defer to post-MVP

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness constraint** not enforced at backend (missing FluentValidation + DB unique index), allows duplicate clients | High | Critical | P0 | Integration test: POST two clients with same NIT → second returns 409 with `"El NIT/RUC ya está registrado"` |
| R2 | **TanStack Query cache invalidation** missing after create/edit/delete, so list does not refresh (FR27 violation) | High | Critical | P0 | Component test: mutation succeeds → assert `queryClient.invalidateQueries(['clientes'])` called → list re-renders with new data |
| R3 | **Zod + FluentValidation gap**: frontend allows submit with invalid data when Zod schema is misconfigured, bypassing backend protection (NFR5) | Medium | High | P0 | Unit test (Zod schema) + integration test (POST with empty Nombre → 400 Problem Details with `errors.Nombre`) |
| R4 | **Real-time search filter** exceeds 1-second threshold due to synchronous `useMemo` blocking re-render with 500 records (NFR1) | Medium | High | P1 | Component performance test: render list with 500 mock items, type in search, assert filtered result appears within 1s |
| R5 | **Delete with orphaned contacts**: backend does not apply `ON DELETE SET NULL` on `contactos.cliente_id`, causing FK violation or silent data loss | Medium | Critical | P1 | Integration test: create client + 2 contacts → delete client → assert contacts persist with `clienteId = null` |
| R6 | **Deep linking** to `/clientes/:clienteId` with unknown ID shows blank screen instead of graceful not-found (Story 2.2) | Medium | Medium | P1 | E2E test: navigate directly to `/clientes/nonexistent-uuid` → assert not-found message rendered |
| R7 | **Sort applied over full dataset instead of filtered subset**: changing SortControl when search is active resets the search filter | Medium | Medium | P1 | Component test: apply search filter → change sort → assert filtered items retained and reordered |
| R8 | **Cancel Edit/Delete dialog**: form closes but mutation fires anyway due to missing guard in async flow | Low | High | P2 | Component test: click Cancel on edit form and delete dialog → assert no API call made, data unchanged |
| R9 | **ErrorPanel / EmptyState** not rendered on load failure or empty list — user sees blank panel with no guidance | Medium | Medium | P2 | Component test: mock `useClientes` returning error → assert `<ErrorPanel>` rendered with "Reintentar" button |
| R10 | **Sort state not defaulting to "Más reciente"** on initial render — list shows undefined order | Low | Low | P3 | Unit test: render `SortControl` with no props → assert default value is `fecha-desc` |

### Top 3 Risk Areas for Epic 2

1. **NIT/RUC uniqueness enforcement** (R1) — the primary business key for clients; a missing unique constraint at any layer (Zod, FluentValidation, DB index) allows silent duplicate entries that break the data model.
2. **TanStack Query cache invalidation** (R2) — FR27 requires changes to be immediately visible. Any missing `invalidateQueries` call after a mutation makes the UI stale and inconsistent with the backend, which is the most common integration failure in this stack.
3. **Delete cascade / orphaned contacts** (R5) — incorrect or missing `ON DELETE SET NULL` on the FK produces either a referential integrity error blocking deletion or silent data loss of contact records, both of which are unacceptable.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)           ▌▌▌▌▌▌▌▌▌▌▌    4 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  11 tests
  Component (Vitest+RTL)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  14 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌▌▌▌▌    6 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                       35 tests
```

### Rationale

- **Component tests dominate** because the most complex behavior (real-time search, sort, form validation feedback, optimistic UI states) lives in the React layer and is best exercised without a browser or running backend.
- **API integration tests are critical** for data integrity concerns: NIT uniqueness, FluentValidation wiring, Problem Details format, `ON DELETE SET NULL` cascade, and 404 handling.
- **E2E tests cover critical user journeys** end-to-end: creating a client, editing, deleting with the confirmation dialog, and deep linking — these validate the full stack together.
- **Unit tests** cover pure logic: Zod schemas, sort functions, and command handler business rules.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: POST /api/v1/clientes — Duplicate NIT/RUC Returns 409

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.1, Story 2.3 AC (backend returns 409 conflict on duplicate NIT/RUC), NFR5
**Risk covered:** R1

**Precondition:** Backend running. A client with NIT `12345678` already exists in the database.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body `{ "nombre": "Test", "nit": "12345678", "telefono": "300", "ciudad": "Bogotá" }`.
2. Inspect response status and body.

**Expected Result:**
- HTTP status: 409 Conflict.
- `Content-Type: application/problem+json`.
- Response body contains `"detail"` with value `"El NIT/RUC ya está registrado"` (exact Spanish text, no raw exception).
- No stack trace in response body.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` with seed data.

---

#### TC-E2-P0-02: POST /api/v1/clientes — Missing Required Fields Returns 400

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4, Story 2.3 AC (FluentValidation prevents save with empty fields), NFR5
**Risk covered:** R3

**Precondition:** Backend running. FluentValidation registered.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ "nombre": "", "nit": "999", "telefono": "", "ciudad": "" }`.
2. Inspect response status and body.

**Expected Result:**
- HTTP status: 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response body contains an `"errors"` object with keys for each invalid field (`"Nombre"`, `"Telefono"`, `"Ciudad"`).
- No 500 error, no stack trace.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-03: Zod Schema — Empty Required Fields Blocked on Frontend

**Level:** Unit
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8 (frontend validation prevents submit with empty fields)
**Risk covered:** R3

**Precondition:** `clienteSchema.ts` Zod schema importable in test.

**Test Steps:**
1. Call `clienteSchema.safeParse({ nombre: "", nit: "123", telefono: "", ciudad: "" })`.
2. Call `clienteSchema.safeParse({ nombre: "Valid", nit: "", telefono: "300", ciudad: "Medellín" })`.
3. Call `clienteSchema.safeParse({ nombre: "Valid", nit: "123", telefono: "300", ciudad: "Medellín" })`.

**Expected Result:**
- Test 1: `success: false`, `errors` include `nombre` and `telefono` and `ciudad`.
- Test 2: `success: false`, `errors` include `nit`.
- Test 3: `success: true`.

**Automation:** Vitest unit test.

---

#### TC-E2-P0-04: TanStack Query Invalidation After Create Client

**Level:** Component
**Story:** 2.3
**Requirement:** FR27 (changes immediately visible), AC-E2.1
**Risk covered:** R2

**Precondition:** MSW intercepts `POST /api/v1/clientes` returning 201. `queryClient` spy available.

**Test Steps:**
1. Render `ClienteForm` in create mode inside a `QueryClientProvider`.
2. Fill all required fields (Nombre, NIT/RUC, Teléfono, Ciudad).
3. Submit the form.
4. Wait for the mutation `onSuccess` to fire.
5. Assert `queryClient.invalidateQueries` was called with `{ queryKey: ['clientes'] }`.
6. Assert the new client appears in the list (list re-renders with updated data).

**Expected Result:**
- `invalidateQueries(['clientes'])` called exactly once after successful create.
- Client list re-renders showing the new client without manual page reload.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-05: TanStack Query Invalidation After Delete Client

**Level:** Component
**Story:** 2.5
**Requirement:** FR27, AC-E2.5
**Risk covered:** R2

**Precondition:** MSW intercepts `DELETE /api/v1/clientes/:id` returning 204. Client exists in list.

**Test Steps:**
1. Render the delete flow with a client in the list.
2. Click "Eliminar".
3. Click "Confirmar" in the confirmation dialog.
4. Wait for mutation `onSuccess`.
5. Assert `queryClient.invalidateQueries({ queryKey: ['clientes'] })` called.
6. Assert deleted client no longer appears in the list.

**Expected Result:**
- Cache invalidated immediately after deletion.
- Right panel returns to empty/default state.
- Success toast "Cliente eliminado correctamente" shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-06: TanStack Query Invalidation After Update Client

**Level:** Component
**Story:** 2.4
**Requirement:** FR27, AC-E2.3
**Risk covered:** R2

**Precondition:** MSW intercepts `PUT /api/v1/clientes/:id` returning 200 with updated object.

**Test Steps:**
1. Render `ClienteForm` in edit mode pre-filled with existing client data.
2. Change the `nombre` field to "Nombre Actualizado".
3. Submit the form.
4. Assert `queryClient.invalidateQueries({ queryKey: ['clientes'] })` called.
5. Assert updated name appears in the list and detail panel.

**Expected Result:**
- Cache invalidated after update.
- "Cliente actualizado correctamente" toast shown.
- List and detail panel reflect new name without reload.

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: GET /api/v1/clientes — Returns All Clients Array

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR1, FR2 (list all clients)

**Precondition:** Backend running. Three clients seeded in database.

**Test Steps:**
1. GET `/api/v1/clientes`.
2. Inspect response.

**Expected Result:**
- HTTP 200.
- Response body is a JSON array with 3 items.
- Each item contains `id` (uuid), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601).
- Direct array — no wrapper object.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-02: GET /api/v1/clientes/:id — Returns Single Client

**Level:** API Integration
**Story:** 2.2
**Requirement:** FR5 (view complete client detail)

**Precondition:** Backend running. Client with known UUID seeded.

**Test Steps:**
1. GET `/api/v1/clientes/{knownId}`.
2. GET `/api/v1/clientes/{nonexistentId}` (random UUID not in DB).

**Expected Result:**
- Test 1: HTTP 200 with full client object.
- Test 2: HTTP 404 with `Content-Type: application/problem+json`, `"status": 404`.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-03: DELETE /api/v1/clientes/:id — Contact Orphan Handling (ON DELETE SET NULL)

**Level:** API Integration
**Story:** 2.5
**Requirement:** Story 2.5 AC (contacts with associated client remain in system with `clienteId = null`), FR23
**Risk covered:** R5

**Precondition:** Client "C1" seeded with 2 associated contacts.

**Test Steps:**
1. DELETE `/api/v1/clientes/{C1.id}`.
2. GET `/api/v1/contactos` and filter by previously associated contact IDs.
3. Assert each contact still exists and its `clienteId` is `null`.

**Expected Result:**
- DELETE returns 204 No Content.
- Both contacts still exist in database.
- Both contacts have `clienteId: null` (orphaned but not deleted).

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P1-04: Client List Renders All Clients on Mount

**Level:** Component
**Story:** 2.1
**Requirement:** AC-E2.1, FR1, FR2

**Precondition:** MSW returns array of 3 mock clients.

**Test Steps:**
1. Render `ClienteListView` inside `QueryClientProvider`.
2. Wait for data to load.
3. Assert all 3 client items are visible (check `nombre` and `nit` per item).

**Expected Result:**
- 3 client list items rendered in the left panel.
- Each item shows Nombre and NIT/RUC.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: Client List Real-Time Search Filters by Nombre and NIT (< 1s)

**Level:** Component + Performance
**Story:** 2.1
**Requirement:** AC-E2.2, FR3, FR4, NFR1

**Precondition:** MSW returns 500 mock clients. `ClienteListView` rendered.
**Risk covered:** R4

**Test Steps:**
1. Render `ClienteListView` with 500 mock clients loaded.
2. Record timestamp, type `"Empresa A"` in the search input.
3. Record timestamp after filtered results render.
4. Calculate elapsed time.
5. Repeat with NIT-based search `"12345"`.

**Expected Result:**
- Only clients matching "Empresa A" (nombre) appear in the list.
- Elapsed time < 1000ms (NFR1).
- NIT-based search also filters correctly.

**Automation:** Vitest + RTL (performance assertion on render time).

---

#### TC-E2-P1-06: EmptyState Shown When No Clients Exist

**Level:** Component
**Story:** 2.1
**Requirement:** Story 2.1 AC (EmptyState when no clients in system)
**Risk covered:** R9

**Precondition:** MSW returns empty array `[]`.

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for data to load.
3. Assert `EmptyState` component is rendered with guidance text.

**Expected Result:**
- `EmptyState` visible in the panel.
- Contains message guiding user to create first client.
- No blank or null-rendering panel.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: ErrorPanel with Retry Shown on Backend Failure

**Level:** Component
**Story:** 2.1
**Requirement:** Story 2.1 AC (ErrorPanel with "Reintentar" on fetch failure)
**Risk covered:** R9

**Precondition:** MSW configured to return 500 on `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView` with MSW returning a network error.
2. Wait for error state.
3. Assert `ErrorPanel` rendered with a "Reintentar" button.
4. Click "Reintentar" — assert a new fetch is triggered.

**Expected Result:**
- `ErrorPanel` component visible.
- "Reintentar" button triggers `refetch()`.
- No raw error message or stack trace shown to user.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Client Detail Panel Shows Full Data on Click

**Level:** Component
**Story:** 2.2
**Requirement:** FR5, Story 2.2 AC (right panel shows Nombre, NIT/RUC, Teléfono, Ciudad on click)

**Precondition:** MSW returns client with all fields populated.

**Test Steps:**
1. Render `ClienteListView` + `ClienteDetailView` split layout.
2. Click on a client item in the left panel.
3. Assert right panel shows all four fields: Nombre, NIT/RUC, Teléfono, Ciudad.
4. Assert URL updates to `/clientes/:clienteId`.

**Expected Result:**
- All four required fields visible in right panel.
- URL reflects the selected client ID (deep linking, FR30).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: Create Client — Happy Path (E2E)

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR4, FR27

**Precondition:** Frontend and backend running. Database empty.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Fill form: Nombre="Empresa Test", NIT="99999999", Teléfono="3001234567", Ciudad="Bogotá".
4. Click "Guardar".
5. Wait for success toast.
6. Assert "Empresa Test" appears in the client list.

**Expected Result:**
- "Cliente creado correctamente" toast shown.
- "Empresa Test" visible in the left panel list without page reload.
- URL can be navigated to `/clientes/{newId}` for deep linking.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-10: Create Client — Inline Validation on Empty Fields

**Level:** Component
**Story:** 2.3
**Requirement:** AC-E2.4, FR8

**Precondition:** `ClienteForm` rendered in create mode.

**Test Steps:**
1. Click submit without filling any field.
2. Assert inline error messages appear on all four required fields.
3. Assert no network request was made (MSW request count = 0).

**Expected Result:**
- Inline error messages visible next to Nombre, NIT/RUC, Teléfono, Ciudad inputs.
- Form not submitted to backend.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-11: Delete Client — Happy Path with Confirmation Dialog (E2E)

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** AC-E2.5, FR7

**Precondition:** One client "Empresa X" exists in the database.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click on "Empresa X" to view detail.
3. Click "Eliminar".
4. Assert confirmation dialog appears with "¿Eliminar este cliente?", "Confirmar", and "Cancelar" buttons.
5. Click "Confirmar".
6. Assert "Empresa X" is no longer in the list.
7. Assert right panel shows empty/default state.

**Expected Result:**
- "Cliente eliminado correctamente" toast shown.
- "Empresa X" absent from list.
- Right panel returns to empty state.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-12: Sort — Client-Side Only (No API Call on Sort Change)

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6, Story 2.6 technical context (client-side sort, no fetch)

**Precondition:** `ClienteListView` rendered with 3 clients loaded from MSW. MSW request interceptor counting calls.

**Test Steps:**
1. Record initial MSW GET `/api/v1/clientes` call count (should be 1).
2. Select "Nombre A→Z" from SortControl.
3. Select "Nombre Z→A" from SortControl.
4. Select "Más antiguo" from SortControl.
5. Assert total GET call count remains 1.

**Expected Result:**
- Sort changes do not trigger additional API calls.
- List reorders in the DOM for each sort option.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Sort Preserved While Search Filter Active

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6 (sort applied to filtered set without clearing search input)
**Risk covered:** R7

**Precondition:** `ClienteListView` with 5 clients loaded (3 named "Empresa A*", 2 named "Beta*").

**Test Steps:**
1. Type "Empresa" in search input. Assert 3 items visible.
2. Select "Nombre Z→A" from SortControl.
3. Assert 3 items still visible (search not cleared).
4. Assert items reordered alphabetically descending.
5. Assert search input still contains "Empresa".

**Expected Result:**
- Search filter retained after sort change.
- Sorted results reflect only the filtered subset.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: Deep Link — Direct URL to /clientes/:clienteId

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** FR30, Story 2.2 AC (direct URL access loads correct client)

**Precondition:** Frontend and backend running. Client with known ID exists.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{knownClienteId}`.
2. Wait for page to render.
3. Assert right panel shows the correct client's Nombre.

**Expected Result:**
- Correct client detail rendered without prior navigation.
- No redirect, no blank panel, no 404.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-15: Deep Link — Unknown clienteId Shows Not-Found

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** Story 2.2 AC (not-found message for non-existent clienteId)
**Risk covered:** R6

**Precondition:** Frontend and backend running.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/00000000-0000-0000-0000-000000000000`.
2. Wait for page to render.

**Expected Result:**
- Not-found message displayed gracefully in the right panel.
- No blank screen, no JS error in console.
- Left panel (client list) still renders.

**Automation:** Playwright E2E.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Edit Client — Form Pre-Filled with Current Values

**Level:** Component
**Story:** 2.4
**Requirement:** FR6, Story 2.4 AC (form opens pre-filled)

**Precondition:** Client with `{ nombre: "Empresa X", nit: "111", telefono: "300", ciudad: "Cali" }` in MSW.

**Test Steps:**
1. Render `ClienteDetailView` for that client.
2. Click "Editar".
3. Assert each form input contains the current client value.

**Expected Result:**
- Nombre input: "Empresa X".
- NIT input: "111".
- Teléfono input: "300".
- Ciudad input: "Cali".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-02: Cancel Edit — No Mutation Fired, Data Unchanged

**Level:** Component
**Story:** 2.4
**Requirement:** Story 2.4 AC (cancel closes form without changes)
**Risk covered:** R8

**Precondition:** `ClienteForm` in edit mode with data. MSW PUT interceptor counting calls.

**Test Steps:**
1. Open edit form.
2. Change nombre to "Modified".
3. Click "Cancelar".
4. Assert MSW PUT call count = 0.
5. Assert displayed client data still shows original nombre.

**Expected Result:**
- No PUT request made.
- Original client data unchanged in the UI.
- Form closes.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Cancel Delete Dialog — No Mutation Fired

**Level:** Component
**Story:** 2.5
**Requirement:** Story 2.5 AC (Cancel in dialog does not delete)
**Risk covered:** R8

**Precondition:** `ClienteDetailView` with a client. MSW DELETE interceptor counting calls.

**Test Steps:**
1. Click "Eliminar".
2. Assert confirmation dialog visible.
3. Click "Cancelar".
4. Assert MSW DELETE call count = 0.
5. Assert client still shown in list and detail.

**Expected Result:**
- No DELETE request sent.
- Client record unchanged in UI.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: Delete Client with Associated Contacts — Toast Shows Orphan Message

**Level:** Component
**Story:** 2.5
**Requirement:** Story 2.5 AC (toast with orphan message when contacts were associated)

**Precondition:** MSW returns 204 on DELETE. The deleted client had `contactCount > 0` in context.

**Test Steps:**
1. Configure delete flow to simulate client having associated contacts.
2. Confirm deletion.
3. Assert toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

**Expected Result:**
- Correct extended toast message displayed (not the simple "Cliente eliminado correctamente").

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-05: Sort Default on Initial Load is "Más reciente"

**Level:** Unit
**Story:** 2.6
**Requirement:** Story 2.6 AC (default sort order = "Más reciente")
**Risk covered:** R10

**Test Steps:**
1. Render `SortControl` with no explicit `value` prop.
2. Assert selected option is `"fecha-desc"` (Más reciente).

**Expected Result:**
- `fecha-desc` is the active sort option.
- List renders with newest client first.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-06: Sort Alphabetical A→Z Reorders List

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6, Story 2.6 AC

**Precondition:** 3 clients loaded: "Zeta Corp", "Alpha SA", "Media Group".

**Test Steps:**
1. Select "Nombre A→Z" from SortControl.
2. Assert list order is: "Alpha SA", "Media Group", "Zeta Corp".

**Expected Result:**
- Alphabetical ascending order applied client-side.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-07: PUT /api/v1/clientes/:id — Returns Updated Client

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR6 (edit any field)

**Precondition:** Client with ID `{c1}` seeded.

**Test Steps:**
1. PUT `/api/v1/clientes/{c1}` with `{ "nombre": "Updated", "nit": "111", "telefono": "300", "ciudad": "Bogotá" }`.
2. Inspect response.

**Expected Result:**
- HTTP 200.
- Response body contains updated `nombre: "Updated"`.
- `updatedAt` timestamp is newer than `createdAt`.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-08: PUT /api/v1/clientes/:id — Clear Required Field Returns 400

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR8, Story 2.4 AC (FluentValidation on empty required field)

**Test Steps:**
1. PUT `/api/v1/clientes/{c1}` with `{ "nombre": "", "nit": "111", "telefono": "300", "ciudad": "Bogotá" }`.

**Expected Result:**
- HTTP 400 Bad Request.
- Problem Details with `errors.Nombre` validation error.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-09: Create Client — 409 NIT/RUC Error Message Shown in Form

**Level:** Component
**Story:** 2.3
**Requirement:** Story 2.3 AC ("El NIT/RUC ya está registrado" shown on 409), NFR6

**Precondition:** MSW returns 409 with Problem Details `"detail": "El NIT/RUC ya está registrado"`.

**Test Steps:**
1. Submit `ClienteForm` with a NIT that triggers 409 from MSW.
2. Assert error message "El NIT/RUC ya está registrado" visible in the UI.
3. Assert no technical error details (status codes, stack traces) shown to user.

**Expected Result:**
- User-friendly Spanish error message displayed in the form.
- No technical information exposed.

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: Sort by Fecha Ascending ("Más antiguo")

**Level:** Component
**Story:** 2.6
**Requirement:** Story 2.6 AC

**Test Steps:**
1. Load 3 clients with distinct `createdAt` timestamps.
2. Select "Más antiguo" from SortControl.
3. Assert oldest client (smallest `createdAt`) appears first.

**Automation:** Vitest + RTL.

---

#### TC-E2-P3-02: Sort by Fecha Descending ("Más reciente")

**Level:** Component
**Story:** 2.6
**Requirement:** Story 2.6 AC

**Test Steps:**
1. Load 3 clients with distinct `createdAt` timestamps.
2. Select "Más reciente" from SortControl.
3. Assert newest client (largest `createdAt`) appears first.

**Automation:** Vitest + RTL.

---

#### TC-E2-P3-03: PUT /api/v1/clientes/:id — Nonexistent ID Returns 404

**Level:** API Integration
**Story:** 2.4

**Test Steps:**
1. PUT `/api/v1/clientes/00000000-0000-0000-0000-000000000000` with valid body.

**Expected Result:**
- HTTP 404 with Problem Details.

**Automation:** xUnit integration test.

---

#### TC-E2-P3-04: DELETE /api/v1/clientes/:id — Nonexistent ID Returns 404

**Level:** API Integration
**Story:** 2.5

**Test Steps:**
1. DELETE `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.

**Expected Result:**
- HTTP 404 with Problem Details.

**Automation:** xUnit integration test.

---

#### TC-E2-P3-05: Create Client — Success Toast "Cliente creado correctamente"

**Level:** Component
**Story:** 2.3
**Requirement:** Story 2.3 AC (success toast text)

**Test Steps:**
1. Submit valid `ClienteForm`. MSW returns 201.
2. Assert toast text is "Cliente creado correctamente".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P3-06: Edit Client — Success Toast "Cliente actualizado correctamente"

**Level:** Component
**Story:** 2.4
**Requirement:** Story 2.4 AC (success toast text)

**Test Steps:**
1. Submit valid edit form. MSW returns 200.
2. Assert toast text is "Cliente actualizado correctamente".

**Automation:** Vitest + RTL + MSW.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Story | Test Cases | Status |
|-----------------|-------|------------|--------|
| AC-E2.1: Register new client, appears in list immediately | 2.3 | TC-E2-P0-04, TC-E2-P1-09 | Covered |
| AC-E2.2: Search by nombre or NIT/RUC < 1 second | 2.1 | TC-E2-P1-05 | Covered |
| AC-E2.3: View detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P0-06, TC-E2-P1-08, TC-E2-P2-01, TC-E2-P2-07 | Covered |
| AC-E2.4: Required fields enforced, clear error messages | 2.3, 2.4 | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-10, TC-E2-P2-08 | Covered |
| AC-E2.5: Delete client, removed from list | 2.5 | TC-E2-P0-05, TC-E2-P1-11 | Covered |
| AC-E2.6: Sort without reload, filter retained | 2.6 | TC-E2-P1-12, TC-E2-P1-13, TC-E2-P2-05, TC-E2-P2-06 | Covered |
| Story 2.1: EmptyState on no clients | 2.1 | TC-E2-P1-06 | Covered |
| Story 2.1: ErrorPanel with Reintentar on fetch failure | 2.1 | TC-E2-P1-07 | Covered |
| Story 2.1: GET all clients list | 2.1 | TC-E2-P1-01, TC-E2-P1-04 | Covered |
| Story 2.2: URL updates to /clientes/:clienteId on selection | 2.2 | TC-E2-P1-08, TC-E2-P1-14 | Covered |
| Story 2.2: Direct URL access loads correct client | 2.2 | TC-E2-P1-14 | Covered |
| Story 2.2: Not-found for nonexistent clienteId | 2.2 | TC-E2-P1-02, TC-E2-P1-15 | Covered |
| Story 2.3: 409 NIT/RUC duplicate error | 2.3 | TC-E2-P0-01, TC-E2-P2-09 | Covered |
| Story 2.3: Form not submitted when fields empty | 2.3 | TC-E2-P1-10 | Covered |
| Story 2.4: Pre-filled form on edit | 2.4 | TC-E2-P2-01 | Covered |
| Story 2.4: Cancel edit — no mutation | 2.4 | TC-E2-P2-02 | Covered |
| Story 2.5: Confirmation dialog text + buttons | 2.5 | TC-E2-P1-11 | Covered |
| Story 2.5: Cancel delete — no mutation | 2.5 | TC-E2-P2-03 | Covered |
| Story 2.5: Contacts orphaned (clienteId=null) on client delete | 2.5 | TC-E2-P1-03, TC-E2-P2-04 | Covered |
| Story 2.6: Sort client-side, no additional API call | 2.6 | TC-E2-P1-12 | Covered |
| Story 2.6: Default sort "Más reciente" | 2.6 | TC-E2-P2-05 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-05 | Component (perf) |
| NFR2 | CRUD reflects in UI < 2s | TC-E2-P0-04, TC-E2-P0-05, TC-E2-P0-06 (invalidation = auto refetch) | Component |
| NFR3 | 10 simultaneous users | Out of scope Epic 2 — covered by load testing post-MVP | N/A |
| NFR4 | HTTPS non-local | Out of scope Epic 2 — deployment config only | N/A |
| NFR5 | Validate/sanitize inputs | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-10, TC-E2-P2-08 | Unit + Integration |
| NFR6 | No stack traces exposed | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P2-09 | API Integration + Component |
| NFR7 | Core tasks without training | TC-E2-P1-09, TC-E2-P1-11 (E2E happy path validation) | E2E |
| NFR8 | Max 2 clicks to contacts | Out of scope Epic 2 — ContactManager in Epic 4 | N/A |
| NFR9 | Contact's client visible in detail | Out of scope Epic 2 | N/A |
| NFR10/11 | Max 500 clients, extensible | TC-E2-P1-05 exercises 500-record scenario | Component |

---

## 7. Test Execution Order

The following order minimizes blocked tests due to environment and data dependencies:

```
Phase 1 — Unit Gate (no DB, no running server)
  1. TC-E2-P0-03  Zod schema — empty required fields blocked
  2. TC-E2-P2-05  SortControl default "Más reciente"
  3. TC-E2-P3-01  Sort by Fecha ascending (Más antiguo)
  4. TC-E2-P3-02  Sort by Fecha descending (Más reciente)

Phase 2 — Backend API Gate (DB needed)
  5. TC-E2-P0-01  POST duplicate NIT → 409
  6. TC-E2-P0-02  POST missing fields → 400
  7. TC-E2-P1-01  GET /clientes → array
  8. TC-E2-P1-02  GET /clientes/:id → 200 + 404
  9. TC-E2-P2-07  PUT /clientes/:id → 200 updated
 10. TC-E2-P2-08  PUT /clientes/:id empty field → 400
 11. TC-E2-P3-03  PUT nonexistent ID → 404
 12. TC-E2-P3-04  DELETE nonexistent ID → 404
 13. TC-E2-P1-03  DELETE → contacts orphaned (ON DELETE SET NULL)

Phase 3 — Component Tests (MSW, no real backend)
 14. TC-E2-P1-04  List renders on mount
 15. TC-E2-P1-06  EmptyState on empty list
 16. TC-E2-P1-07  ErrorPanel + Reintentar on fetch failure
 17. TC-E2-P1-05  Search < 1s with 500 records
 18. TC-E2-P1-08  Detail panel shows on click + URL update
 19. TC-E2-P1-10  Inline validation on empty submit
 20. TC-E2-P1-12  Sort = no extra API call
 21. TC-E2-P1-13  Sort preserves active search filter
 22. TC-E2-P0-04  Invalidation after create
 23. TC-E2-P0-05  Invalidation after delete
 24. TC-E2-P0-06  Invalidation after update
 25. TC-E2-P2-01  Edit form pre-filled
 26. TC-E2-P2-02  Cancel edit — no PUT
 27. TC-E2-P2-03  Cancel delete dialog — no DELETE
 28. TC-E2-P2-04  Delete with contacts — orphan toast
 29. TC-E2-P2-06  Sort A→Z reorders list
 30. TC-E2-P2-09  409 error message in form UI
 31. TC-E2-P3-05  Toast "Cliente creado correctamente"
 32. TC-E2-P3-06  Toast "Cliente actualizado correctamente"

Phase 4 — E2E Full Stack (Playwright, requires running app)
 33. TC-E2-P1-09  Create client happy path
 34. TC-E2-P1-11  Delete client happy path
 35. TC-E2-P1-14  Deep link to known clienteId
 36. TC-E2-P1-15  Deep link to unknown clienteId → not-found
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering + user events | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| @testing-library/user-event | Realistic user interactions (type, click) | Frontend |
| MSW 2+ | API mock for component/unit tests | Frontend |
| Playwright 1.40+ | E2E tests (happy paths, deep linking) | Frontend/E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432
- Database user with CREATE DATABASE privilege
- siesa_agents_db database created (Epic 1 migration applied)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- Frontend running on port 5173 (for E2E)
- Backend running on port 5000 (for E2E)
```

### Test Data Requirements

```
For API integration tests:
- ClienteEntity seed factory: { id: Guid.NewGuid(), nombre, nit (unique), telefono, ciudad, createdAt: DateTimeOffset.UtcNow }
- ContactoEntity seed factory: { id: Guid.NewGuid(), nombre, clienteId (nullable) }
- Minimum seeds: 3 clients, 2 contacts linked to one client

For component tests (MSW handlers):
- GET /api/v1/clientes → array of mocked ClienteDto
- POST /api/v1/clientes → 201 + created object
- PUT /api/v1/clientes/:id → 200 + updated object
- DELETE /api/v1/clientes/:id → 204
- Error scenarios: GET → 500, POST → 409, POST/PUT → 400

For E2E tests:
- beforeEach: clean database + seed at least 1 client
- afterEach: clean database
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 6 | 2.0 | 12.0 | Invalidation, NIT uniqueness, Zod schema — complex setup |
| P1 | 15 | 1.5 | 22.5 | Core CRUD paths, real-time search, E2E happy paths |
| P2 | 9 | 1.0 | 9.0 | Edit/cancel guards, sort variants, API edge cases |
| P3 | 6 | 0.5 | 3.0 | Toast text, additional sort/404 coverage |
| **Total** | **36** | — | **46.5 hours** | **~5.8 days** |

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — all 6 P0 tests must pass before any story can begin implementation.
- **P1 pass rate**: 100% — each story is not closed as Done until its P1 tests pass.
- **P2/P3 pass rate**: ≥90% — may be deferred with written justification.
- **High-risk mitigations** (R1, R2, R5): 100% complete before Epic 2 closure.

### Coverage Targets

- **Data integrity** (NIT uniqueness, ON DELETE SET NULL): 100%
- **Frontend validation** (Zod + inline errors): 100%
- **Cache invalidation** (FR27 compliance): 100% — all three mutation types covered
- **User-facing text** (Spanish toasts, error messages): ≥80% automated
- **NFR1 search performance**: 100% (one explicit performance test)

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] NIT/RUC 409 conflict verified at both API and UI layer (R1)
- [ ] TanStack Query invalidation verified for create, update, and delete (R2)
- [ ] ON DELETE SET NULL verified — contacts survive client deletion with `clienteId=null` (R5)
- [ ] NFR6 verified — no stack traces or internal error details in any 4xx/5xx response (R1, R2)
- [ ] NFR1 verified — search with 500 records completes in < 1s (TC-E2-P1-05)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-15)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] `clientes` table created with `uk_clientes_nit` unique index confirmed
- [ ] `contactos.cliente_id` FK configured as `ON DELETE SET NULL` confirmed
- [ ] Zod `clienteSchema` correctly enforces all required fields
- [ ] FluentValidation wired for `CreateClienteRequest` and `UpdateClienteRequest`
- [ ] All user-facing text (toasts, errors, labels) is in Spanish
- [ ] `ExceptionHandlingMiddleware` confirmed — no stack trace in 409/400/404 responses

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **NIT uniqueness**: `ClienteConfiguration.cs` must define `.HasIndex(c => c.NIT).IsUnique()`. `CreateClienteRequestValidator` must check for duplicate NIT via repository and throw a domain exception that maps to 409.
2. **Query key consistency**: All mutations (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Any mutation that misses this breaks FR27.
3. **ON DELETE SET NULL**: `ContactoConfiguration.cs` must configure `.HasOne(c => c.Cliente).WithMany().HasForeignKey(c => c.ClienteID).OnDelete(DeleteBehavior.SetNull)`. The `contactos.cliente_id` column must be nullable.
4. **Orphan toast variant**: The delete mutation must determine (before or from the API response) whether the deleted client had contacts, and show the extended toast message if so.
5. **Sort is client-side only**: `SortControl` updates local `useState` only. No `invalidateQueries`, no `refetch`, no API call on sort change. Sort is applied via `useMemo` over the cached array.
6. **Search is client-side only**: The search input drives a local `useState(searchQuery)`. Filter applied via `useMemo` over TanStack Query cache. No debounce required (500 records < 50ms per architecture decision).
7. **Problem Details on 409**: `ExceptionHandlingMiddleware` must map a `DuplicateNitException` (or equivalent) to HTTP 409 with `detail: "El NIT/RUC ya está registrado"`. The detail text must be in Spanish, no technical identifiers.
8. **Default sort identifier**: SortControl component at `src/shared/components/SortControl` must default to `fecha-desc` when no value is provided. Sort option identifiers: `nombre-asc` | `nombre-desc` | `fecha-desc` | `fecha-asc`.
9. **URL deep linking**: Selecting a client from the list must update the URL to `/clientes/:clienteId` using TanStack Router's `useNavigate` or `<Link>`. The `clientes.$clienteId.tsx` route must handle direct browser navigation.
10. **EmptyState and ErrorPanel**: `ClienteListView` must conditionally render `<EmptyState>` on empty array and `<ErrorPanel onRetry={refetch}>` on fetch error. Never render blank panels.
