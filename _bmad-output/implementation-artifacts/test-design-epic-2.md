---
epic: 2
title: "Client Management — Gestión de Clientes"
mode: epic-level
phase: 4
createdAt: "2026-05-23"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: complete
---

# Test Design — Epic 2: Client Management (Gestión de Clientes)

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 implements the complete client management CRUD for Siesa Agents. The commercial team can register, search, view, update, sort, and delete client records. The split-panel UI (`/clientes`) hosts a scrollable client list on the left (280px) and a detail/form panel on the right. All data changes reflect immediately (FR27 via TanStack Query cache invalidation). Sorting is client-side over the cached result set; search/filter is real-time client-side with no additional API fetch.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | List rendering, real-time filter (NFR1), EmptyState, ErrorPanel + retry |
| 2.2 | Client Detail View | Detail panel, deep linking `/clientes/:id`, not-found graceful handling (FR30) |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), duplicate NIT/RUC 409, optimistic update (FR27) |
| 2.4 | Edit Client | Pre-filled form, required-field validation, cancel safety, optimistic update |
| 2.5 | Delete Client | Confirmation dialog, immediate list removal, associated-contacts unassign side-effect |
| 2.6 | Sort Client List | Four sort options, client-side sort (no API call), sort + filter combination |

### Out of Scope for This Epic

- Contact management UI (Epic 3)
- Client–Contact association panel (Epic 4)
- Authentication / authorization (deferred MVP)
- Server-side pagination (deferred post-MVP)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness** — duplicate NIT submitted, backend returns 409; frontend silently swallows error or crashes instead of showing inline message | High | High | P0 | Integration + component test: POST with duplicate NIT → assert 409 mapped to inline "El NIT/RUC ya está registrado" message, no unhandled error |
| R2 | **Required-field validation bypass** — Zod schema or FluentValidation misconfigured; form submits with empty required fields reaching the backend | High | High | P0 | Unit test: submit form with each required field empty individually; assert inline error rendered and no API call made |
| R3 | **Delete cascade bug** — client deletion cascades to DELETE contacts instead of SET NULL `cliente_id`, violating FR25 and the acceptance criteria of Story 2.5 | Medium | Critical | P0 | Integration test: create client with contacts → delete client → assert contacts still exist with `clienteId = null` |
| R4 | **TanStack Query cache invalidation** — after create/update/delete, mutation does not call `invalidateQueries(['clientes'])`, causing stale list (FR27 violation) | Medium | High | P0 | Component test: trigger mutation → assert query invalidation fired → list re-renders with new/absent item |
| R5 | **Sort+Filter interaction** — changing sort order clears the active search input or triggers an extra API fetch (AC-E2.6) | Medium | Medium | P1 | Component test: set search term → change sort → assert search input unchanged, no new network call, filtered+sorted list rendered correctly |
| R6 | **Deep linking `/clientes/:id`** — direct URL access fails because the detail panel depends on list already being in cache; shows blank or crashes | Medium | High | P1 | E2E test: navigate directly to `/clientes/{uuid}` → assert detail view renders correct data |
| R7 | **Not-found client ID** — accessing `/clientes/non-existent-uuid` causes unhandled API 404, crashes component tree instead of showing graceful message | Low | Medium | P1 | Component/E2E test: route with unknown ID → assert not-found message rendered without JS error |
| R8 | **Performance — search under 1 second** — client-side filter over 500 records exceeds NFR1 threshold due to un-memoized filter function | Low | Medium | P1 | Performance/unit test: mock 500-record cache → measure filter execution time < 1000ms |
| R9 | **Confirmation dialog cancel safety** — "Cancelar" in delete dialog does not call the API but local state is corrupted, causing item to disappear or duplicate | Low | Medium | P2 | Component test: open dialog → click cancel → assert client still in list, no API call made |
| R10 | **Toast messages** — success toasts not displayed after create/update/delete, degrading UX (AC-E2.1 implicit) | Low | Low | P2 | Component test: trigger each mutation success → assert toast rendered with correct message |
| R11 | **Default sort order** — SortControl initializes to a value other than "Más reciente" (`fecha-desc`) on first render (AC-E2.6) | Low | Low | P2 | Unit test: render SortControl with no props → assert default value is `fecha-desc` |

### Top 3 Risk Areas for Epic 2

1. **Data integrity on delete** (R3) — if `ON DELETE SET NULL` is not wired correctly in EF Core, all associated contacts are silently destroyed. This violates a key cross-epic invariant that Epic 4 (associations) depends on.
2. **NIT/RUC duplicate handling** (R1) — this is the most common real-world error path; mishandling it exposes either bad UX (silent failure) or a security concern (raw error details per NFR6).
3. **Cache invalidation after mutations** (R4) — if TanStack Query does not invalidate `['clientes']` after each mutation, the list becomes stale and FR27 ("changes visible immediately") is broken for all subsequent operations.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)              ▌▌▌▌▌▌▌▌▌▌          4 tests
  API Integration (xUnit)       ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   10 tests
  Component (Vitest+RTL+MSW)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  17 tests
  Unit (Vitest/xUnit)           ▌▌▌▌▌▌▌▌             6 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                               37 tests
```

### Rationale

- **Component tests dominate** — Epic 2 is UI-heavy (forms, panels, dialogs, toasts). Component tests with MSW mocks provide fast, reliable coverage without a live backend.
- **API integration tests cover the backend layer exclusively** — CRUD endpoints, FluentValidation, 409 duplicate detection, and the critical `SET NULL` cascade must be verified at the HTTP level with a real (TestContainers) database.
- **E2E tests (Playwright) target the most critical cross-stack user flows** — create-and-see-immediately, deep linking, delete-and-verify-contacts-unassigned. These cannot be verified by lower-level tests.
- **Unit tests cover isolated logic** — Zod schemas, sort comparator functions, domain entity constructors, FluentValidation rule sets.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: Create Client — All Required Fields Empty Shows Inline Errors

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-E2.4, FR8, NFR5
**Risk covered:** R2

**Precondition:** `CreateClientForm` rendered in isolation. MSW intercepts are configured (but should NOT be called in this test).

**Test Steps:**
1. Render `<CreateClientForm onSubmit={...} />`.
2. Click the submit button without filling any field.
3. Assert inline validation errors appear for each required field: Nombre, NIT/RUC, Teléfono, Ciudad.
4. Assert no HTTP request was dispatched (MSW request spy returns 0 calls).

**Expected Result:**
- Four inline error messages visible simultaneously.
- `onSubmit` callback NOT called.
- No API request made.

**Automation:** Vitest + `@testing-library/react` + MSW.

---

#### TC-E2-P0-02: Create Client — Partial Required Fields Also Shows Errors

**Level:** Unit (Vitest)
**Story:** 2.3
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** Zod schema for client form is exported (`clienteFormSchema`).

**Test Steps:**
1. Parse `{ nombre: "ACME", nit: "", telefono: "", ciudad: "" }` with `clienteFormSchema.safeParse(...)`.
2. Assert `success === false`.
3. Check that `nit`, `telefono`, and `ciudad` are listed in `error.issues`.
4. Assert `nombre` is NOT in `error.issues`.

**Expected Result:**
- Schema rejects the partial input.
- Only the three empty fields produce validation errors.
- `nombre` passes (non-empty string).

**Automation:** Vitest unit test.

---

#### TC-E2-P0-03: Create Client — Duplicate NIT/RUC Returns 409 and Shows Inline Error

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-E2.1 / Story 2.3 AC (NIT conflict), NFR6
**Risk covered:** R1

**Precondition:** MSW handler: `POST /api/v1/clientes` → 409 `{ "title": "Conflict", "detail": "El NIT/RUC ya está registrado" }`.

**Test Steps:**
1. Render `<CreateClientForm />`.
2. Fill all required fields with valid data; set NIT/RUC to an existing value.
3. Submit the form.
4. Wait for async response.
5. Assert error message "El NIT/RUC ya está registrado" is visible.
6. Assert no raw technical error (e.g., no `StackTrace`, no HTTP status code text) is visible.

**Expected Result:**
- Inline or form-level error displays the business message.
- No unhandled error boundary triggered.
- Form remains open for correction.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-04: Backend API — Duplicate NIT/RUC Returns 409 Problem Details

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** Story 2.3 AC (NIT conflict), NFR6
**Risk covered:** R1

**Precondition:** TestContainers Postgres DB. One client with NIT `900123456` already persisted.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ "nombre": "Nueva Empresa", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá" }`.
2. Assert HTTP status 409.
3. Assert `Content-Type: application/problem+json`.
4. Assert response body has `status: 409`, `title` contains "Conflict" (case-insensitive), `detail` is a user-friendly string.
5. Assert response body does NOT contain `stackTrace`, `exception`, or `innerException`.

**Expected Result:**
- 409 with Problem Details RFC 7807 format.
- No stack trace exposed (NFR6).

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers.

---

#### TC-E2-P0-05: Backend API — Delete Client Sets contactos.cliente_id to NULL

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** Story 2.5 AC (associated contacts remain, FR25)
**Risk covered:** R3

**Precondition:** TestContainers Postgres DB. Client `clienteId=AAA` persisted with two contacts that have `clienteId=AAA`.

**Test Steps:**
1. DELETE `/api/v1/clientes/{clienteId}`.
2. Assert HTTP 204.
3. Query `GET /api/v1/contactos/{contactId1}` for each previously associated contact.
4. Assert each contact still exists (HTTP 200).
5. Assert each contact's `clienteId` field is `null`.

**Expected Result:**
- Client record deleted.
- Both contacts remain in the system with `clienteId: null`.
- No contact is deleted as a side effect.

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers.

---

#### TC-E2-P0-06: TanStack Query Cache Invalidated After Create Client

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR27, AC-E2.1 ("appears in list immediately")
**Risk covered:** R4

**Precondition:** MSW: `GET /api/v1/clientes` → `[{ id: "1", nombre: "Existing SA" }]` initially, then after mutation responds with `[{ id: "1", nombre: "Existing SA" }, { id: "2", nombre: "New Corp" }]`. MSW: `POST /api/v1/clientes` → 201.

**Test Steps:**
1. Render `<ClientesView />` with `QueryClientProvider`.
2. Wait for initial list to show "Existing SA".
3. Open create form, fill all fields for "New Corp", submit.
4. Wait for POST to resolve.
5. Assert "New Corp" appears in the client list without manual page refresh.

**Expected Result:**
- After successful POST, the list updates immediately.
- "New Corp" appears in the left-panel list.
- No manual reload needed.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-07: Backend API — FluentValidation Rejects Missing Required Fields

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-E2.4, FR8, NFR5
**Risk covered:** R2

**Precondition:** Backend running via `WebApplicationFactory`.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ "nombre": "", "nit": "900111222", "telefono": "", "ciudad": "" }`.
2. Assert HTTP 400.
3. Assert `Content-Type: application/problem+json`.
4. Assert `errors` property in response contains entries for `nombre`, `telefono`, and `ciudad`.

**Expected Result:**
- 400 Bad Request with Problem Details listing the missing fields.
- No 500 or unhandled exception.
- Missing field names identified in the response.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

### P1 — Must Pass Before Story is Closed as Done

---

#### TC-E2-P1-01: Client List — Renders All Clients from API

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** Story 2.1 AC (list with Nombre and NIT/RUC visible), FR2

**Precondition:** MSW: `GET /api/v1/clientes` → three client records.

**Test Steps:**
1. Render `<ClientesView />`.
2. Wait for loading to complete.
3. Assert three client items are rendered in the left panel.
4. Assert each item shows `Nombre` and `NIT/RUC` text.

**Expected Result:**
- Three items visible in the scrollable list.
- Each item displays Nombre and NIT/RUC.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Client List — EmptyState Shown When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** Story 2.1 AC (EmptyState when no clients)

**Precondition:** MSW: `GET /api/v1/clientes` → `[]` (empty array).

**Test Steps:**
1. Render `<ClientesView />`.
2. Wait for loading.
3. Assert the `EmptyState` component is visible.
4. Assert the message guides the user to create their first client.
5. Assert no client list items are rendered.

**Expected Result:**
- EmptyState component displayed.
- Guidance message present.
- Zero list items.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: Client List — ErrorPanel Shown on API Failure

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** Story 2.1 AC (ErrorPanel + Reintentar on backend unavailable)

**Precondition:** MSW: `GET /api/v1/clientes` → network error (MSW `networkError`).

**Test Steps:**
1. Render `<ClientesView />`.
2. Wait for error state.
3. Assert `ErrorPanel` component is visible.
4. Assert a "Reintentar" button is present.
5. Click "Reintentar" — MSW now returns success response.
6. Assert list renders after retry.

**Expected Result:**
- ErrorPanel with retry button shown on network failure.
- Retry triggers re-fetch and successfully renders list.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: Client List — Real-Time Search Filters by Nombre

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** Story 2.1 AC (real-time filter by Nombre), FR3, NFR1

**Precondition:** MSW returns three clients: "Acme Corp", "Beta SA", "Gamma Ltda".

**Test Steps:**
1. Render `<ClientesView />`, wait for list.
2. Type "Acme" into the search field.
3. Assert only "Acme Corp" is visible.
4. Assert "Beta SA" and "Gamma Ltda" are not rendered.
5. No additional network request should be made (MSW spy: 1 call total).

**Expected Result:**
- Filtered list shows only matching client.
- No extra API call triggered.
- MSW handler was called exactly once (initial load).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: Client List — Real-Time Search Filters by NIT/RUC

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** Story 2.1 AC (filter by NIT/RUC), FR4, NFR1

**Precondition:** MSW returns three clients with distinct NIT/RUC values.

**Test Steps:**
1. Render `<ClientesView />`, wait for list.
2. Type the NIT/RUC of the second client into the search field.
3. Assert only the matching client is visible.
4. Clear the search field.
5. Assert all three clients are visible again.

**Expected Result:**
- NIT/RUC search filters correctly.
- Clearing search restores full list.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-06: Client Detail — Clicking Client Shows Detail Panel

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirement:** Story 2.2 AC (detail panel with all fields), FR5

**Precondition:** MSW: list returns client with full data. MSW: `GET /api/v1/clientes/{id}` returns same client.

**Test Steps:**
1. Render `<ClientesView />`, wait for list.
2. Click on the first client in the list.
3. Assert the right panel shows Nombre, NIT/RUC, Teléfono, and Ciudad values.
4. Assert the URL updates to `/clientes/{clienteId}`.

**Expected Result:**
- Right panel populated with all four fields.
- URL reflects deep-link route.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: Client Detail — Deep Link Direct URL Access

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** Story 2.2 AC (direct URL access), FR30
**Risk covered:** R6

**Precondition:** Frontend and backend running. One client exists with known `clienteId`.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{clienteId}` (no prior navigation).
2. Wait for page to render.
3. Assert the detail panel shows the correct client's Nombre.
4. Assert no blank page, no JS error, no redirect to `/clientes`.

**Expected Result:**
- Client detail rendered on direct URL access.
- All four fields visible.
- URL remains at `/clientes/{clienteId}`.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-08: Client Detail — Not-Found ID Shows Graceful Message

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirement:** Story 2.2 AC (not-found graceful)
**Risk covered:** R7

**Precondition:** MSW: `GET /api/v1/clientes/non-existent-id` → 404.

**Test Steps:**
1. Render router at `/clientes/00000000-0000-0000-0000-000000000000`.
2. Wait for fetch.
3. Assert a not-found message is displayed.
4. Assert no unhandled JS error or crash.
5. Assert navigation shell is still visible.

**Expected Result:**
- Graceful not-found state.
- No component error boundary triggered.
- Shell layout persists.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: Create Client — Success Flow Creates and Shows Client

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR27

**Precondition:** Frontend and backend running. Database empty or with existing clients.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente".
3. Fill Nombre, NIT/RUC (unique), Teléfono, Ciudad.
4. Click "Guardar" / submit button.
5. Assert success toast "Cliente creado correctamente" appears.
6. Assert the new client appears in the left-panel list.

**Expected Result:**
- Client persisted in backend.
- Appears in list without page reload.
- Toast shown.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-10: Edit Client — Pre-Filled Form Shows Current Values

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** Story 2.4 AC (pre-filled form), FR6

**Precondition:** MSW: `GET /api/v1/clientes/{id}` → `{ nombre: "Acme", nit: "900111", telefono: "3001", ciudad: "Bogotá" }`.

**Test Steps:**
1. Render `<ClientesView />` with a client selected.
2. Click "Editar".
3. Assert Nombre field has value "Acme".
4. Assert NIT/RUC field has value "900111".
5. Assert Teléfono field has value "3001".
6. Assert Ciudad field has value "Bogotá".

**Expected Result:**
- All four fields pre-populated with current client values.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Edit Client — Cancel Does Not Modify Data

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** Story 2.4 AC (cancel preserves data)

**Precondition:** MSW: client loaded.

**Test Steps:**
1. Open edit form for a client.
2. Modify the Nombre field to a new value.
3. Click "Cancelar".
4. Assert the detail panel still shows the original Nombre.
5. Assert no PUT request was dispatched.

**Expected Result:**
- Original data unchanged in UI.
- No API call made.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Edit Client — Save Updates List and Detail Immediately

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** FR27, Story 2.4 AC (changes reflected immediately)
**Risk covered:** R4

**Precondition:** MSW: `PUT /api/v1/clientes/{id}` → 200 with updated client. `GET /api/v1/clientes` → updated list after invalidation.

**Test Steps:**
1. Render `<ClientesView />` with client "Acme Corp" selected.
2. Click "Editar". Change Nombre to "Acme Corp Updated". Submit.
3. Wait for PUT to complete.
4. Assert success toast "Cliente actualizado correctamente" appears.
5. Assert list item updates to "Acme Corp Updated".
6. Assert detail panel shows updated Nombre.

**Expected Result:**
- Both list and detail panel reflect the update.
- Toast shown.
- No page reload required.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Delete Client — Confirmation Dialog Appears

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** Story 2.5 AC (confirmation dialog)

**Test Steps:**
1. Render client detail view with a client loaded.
2. Click "Eliminar".
3. Assert confirmation dialog appears with text "¿Eliminar este cliente?".
4. Assert "Confirmar" and "Cancelar" buttons are present.

**Expected Result:**
- Dialog visible with correct text and both action buttons.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: Delete Client — Cancel in Dialog Keeps Client in List

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** Story 2.5 AC (cancel preserves record)
**Risk covered:** R9

**Test Steps:**
1. Open delete confirmation dialog.
2. Click "Cancelar".
3. Assert dialog closes.
4. Assert client is still present in the left-panel list.
5. Assert no DELETE request was dispatched.

**Expected Result:**
- Client unaffected.
- No API call made.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Delete Client — Confirmed Deletion Removes from List

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** AC-E2.5, FR7, FR27

**Precondition:** Frontend and backend running. At least one client with no associated contacts.

**Test Steps:**
1. Navigate to `/clientes`.
2. Select a client that has no contacts.
3. Click "Eliminar" → confirm in dialog.
4. Assert toast "Cliente eliminado correctamente" appears.
5. Assert the client is no longer in the list.
6. Assert right panel returns to default/empty state.

**Expected Result:**
- Client removed from list without page reload.
- Right panel cleared.
- Toast shown.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-16: Delete Client with Contacts — Contacts Become Unassigned

**Level:** API Integration (xUnit) — covered by TC-E2-P0-05; E2E supplement below
**Story:** 2.5
**Requirement:** Story 2.5 AC (contacts remain unassigned after client delete), FR25
**Risk covered:** R3

**Precondition:** Frontend and backend running. Client exists with two associated contacts.

**Test Steps:**
1. Navigate to client detail.
2. Confirm deletion.
3. Assert toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
4. Navigate to contacts list.
5. Assert both previously-associated contacts still appear.
6. Assert their client field shows empty / "Sin cliente".

**Automation:** Playwright E2E (cross-epic smoke).

---

#### TC-E2-P1-17: Backend API — GET /api/v1/clientes Returns Client List

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirement:** FR2

**Precondition:** TestContainers DB with two seeded clients.

**Test Steps:**
1. GET `/api/v1/clientes`.
2. Assert HTTP 200.
3. Assert response is a JSON array with 2 items.
4. Assert each item has `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
5. Assert `id` fields are valid UUID strings.
6. Assert `createdAt` / `updatedAt` are `DateTimeOffset` ISO strings.

**Expected Result:**
- 200 with correctly shaped DTO array.
- All expected fields present.
- UUIDs and DateTimeOffset format correct.

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers.

---

#### TC-E2-P1-18: Backend API — POST /api/v1/clientes Creates Client and Returns 201

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** FR1

**Precondition:** TestContainers DB empty.

**Test Steps:**
1. POST `/api/v1/clientes` with `{ "nombre": "Test SA", "nit": "900000001", "telefono": "3209876543", "ciudad": "Medellín" }`.
2. Assert HTTP 201.
3. Assert `Location` header contains `/api/v1/clientes/{newId}`.
4. Assert response body has `id` (valid UUID), all submitted fields, `createdAt`, `updatedAt`.
5. GET the returned `Location` URL → assert 200 with same data.

**Expected Result:**
- 201 Created with body and Location header.
- Resource accessible via GET immediately.

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P1-19: Backend API — PUT /api/v1/clientes/{id} Updates Client

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirement:** FR6

**Precondition:** One client seeded: `{ nombre: "Old Name", nit: "900000002", ... }`.

**Test Steps:**
1. PUT `/api/v1/clientes/{id}` with `{ "nombre": "New Name", "nit": "900000002", "telefono": "3001112222", "ciudad": "Cali" }`.
2. Assert HTTP 200.
3. GET `/api/v1/clientes/{id}` → assert `nombre === "New Name"`, `ciudad === "Cali"`.
4. Assert `updatedAt` is later than original `createdAt`.

**Expected Result:**
- 200 OK with updated resource.
- Changes persisted in DB.

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P1-20: Backend API — DELETE /api/v1/clientes/{id} Returns 204

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** FR7

**Precondition:** One client seeded (no associated contacts).

**Test Steps:**
1. DELETE `/api/v1/clientes/{id}`.
2. Assert HTTP 204 (No Content).
3. GET `/api/v1/clientes/{id}` → assert HTTP 404.

**Expected Result:**
- 204 on delete.
- 404 on subsequent GET.

**Automation:** xUnit + TestContainers.

---

### P2 — Should Pass Before Epic Is Marked Complete

---

#### TC-E2-P2-01: Sort — Default Sort is "Más reciente" on Initial Render

**Level:** Unit (Vitest)
**Story:** 2.6
**Requirement:** Story 2.6 AC (default sort `fecha-desc`), AC-E2.6
**Risk covered:** R11

**Test Steps:**
1. Render `<SortControl />` with no initial value prop.
2. Assert the selected option value is `fecha-desc`.
3. Assert the visible label text is "Más reciente".

**Expected Result:**
- Default option `fecha-desc` selected.
- Label "Más reciente" displayed.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-02: Sort — Nombre A→Z Reorders List Alphabetically

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6, Story 2.6 AC (no new API call)
**Risk covered:** R5 (partial)

**Precondition:** MSW: three clients returned in order: "Gamma", "Alpha", "Beta".

**Test Steps:**
1. Render `<ClientesView />`, wait for list.
2. Note initial order (as returned by API: Gamma, Alpha, Beta).
3. Select "Nombre A→Z" from SortControl.
4. Assert order becomes: Alpha, Beta, Gamma.
5. Assert no additional network request (MSW spy: 1 call total).

**Expected Result:**
- Alphabetical ascending order applied client-side.
- No extra API fetch.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Sort — Nombre Z→A Reorders Descending

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6

**Precondition:** Same as TC-E2-P2-02.

**Test Steps:**
1. Select "Nombre Z→A" from SortControl.
2. Assert order becomes: Gamma, Beta, Alpha.
3. Assert no additional API call.

**Expected Result:**
- Descending alphabetical order.
- No extra fetch.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: Sort + Filter — Changing Sort Does Not Clear Search Input

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6 (sort applied to filtered result without clearing search)
**Risk covered:** R5

**Precondition:** MSW: clients "Alpha Corp" (fecha más antigua), "Alpha Ltd" (fecha más reciente), "Beta SA".

**Test Steps:**
1. Render `<ClientesView />`, wait for list.
2. Type "Alpha" in the search field — assert 2 items visible.
3. Select "Nombre Z→A" from SortControl.
4. Assert search input still contains "Alpha".
5. Assert 2 items still visible: "Alpha Ltd" then "Alpha Corp" (Z→A order).
6. Assert no extra API call made.

**Expected Result:**
- Search input preserved after sort change.
- Filtered list re-sorted correctly.
- No additional fetch.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-05: Delete Client — Toast Shows Correct Message for Contact-Unassign Case

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** Story 2.5 AC (specific toast when contacts unassigned)
**Risk covered:** R10

**Precondition:** MSW: `DELETE /api/v1/clientes/{id}` → 200 or 204 (with response body indicating contacts were unassigned, OR frontend detects this via a pre-delete contacts count > 0).

**Test Steps:**
1. Set up client detail view with a client that has associated contacts.
2. Trigger deletion and confirm.
3. Assert toast text is "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.".

**Expected Result:**
- Specific toast with contacts-unassigned message.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: Performance — Client-Side Filter Over 500 Records Completes Under 1 Second

**Level:** Unit / Performance (Vitest)
**Story:** 2.1
**Requirement:** NFR1 (< 1s with 500 records)
**Risk covered:** R8

**Precondition:** Generate array of 500 mock client objects.

**Test Steps:**
1. Create a mock array of 500 `ClienteDTO` objects.
2. Record `performance.now()` before filter.
3. Apply the search filter function with term "test" against all 500 items.
4. Record `performance.now()` after filter.
5. Assert elapsed time < 1000ms.

**Expected Result:**
- Filter completes in under 1000ms on the test machine.
- No timeout.

**Automation:** Vitest unit test.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: Sort — Más Reciente / Más Antiguo Orders by createdAt

**Level:** Unit (Vitest)
**Story:** 2.6
**Requirement:** Story 2.6 AC (fecha-desc / fecha-asc)

**Test Steps:**
1. Create two mock clients: `clienteA.createdAt = "2026-01-01"`, `clienteB.createdAt = "2026-03-01"`.
2. Apply `fecha-desc` sort comparator.
3. Assert clienteB (newer) is first.
4. Apply `fecha-asc` sort comparator.
5. Assert clienteA (older) is first.

**Expected Result:**
- Correct date ordering for both options.

**Automation:** Vitest unit test.

---

#### TC-E2-P3-02: Backend — GET /api/v1/clientes/{id} Returns 404 for Unknown ID

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirement:** Story 2.2 AC (not-found graceful)

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.
2. Assert HTTP 404.
3. Assert `Content-Type: application/problem+json`.

**Expected Result:**
- 404 Problem Details for non-existent resource.

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P3-03: Backend — FluentValidation Validates NIT Format

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirement:** NFR5 (input sanitization)

**Test Steps:**
1. Invoke `CreateClienteCommandValidator` with an empty `Nit` value.
2. Assert `ValidationResult.IsValid === false`.
3. Assert error message references the `Nit` field.

**Expected Result:**
- Validator rejects missing NIT independently of HTTP layer.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-04: Accessibility — Create Form Fields Have Labels

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** NFR7 (usability without training)

**Test Steps:**
1. Render `<CreateClientForm />`.
2. Assert each input has an associated `<label>` (via `getByLabelText`).
3. Assert labels are in Spanish.

**Expected Result:**
- All four input fields have accessible labels.

**Automation:** Vitest + RTL (accessibility query).

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client (Nombre, NIT, Teléfono, Ciudad) → appears in list immediately | 2.3 | TC-E2-P0-06, TC-E2-P1-09, TC-E2-P1-18 | Covered |
| AC-E2.2: Search by name or NIT/RUC in under 1 second | 2.1 | TC-E2-P1-04, TC-E2-P1-05, TC-E2-P2-06 | Covered |
| AC-E2.3: View client detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-06, TC-E2-P1-10, TC-E2-P1-12, TC-E2-P1-19 | Covered |
| AC-E2.4: Required fields empty → inline error, no submit | 2.3, 2.4 | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-07 | Covered |
| AC-E2.5: Delete client → no longer in list | 2.5 | TC-E2-P1-15, TC-E2-P1-20 | Covered |
| AC-E2.6: Sort by Name A→Z, Z→A, Más reciente, Más antiguo without reload or losing filter | 2.6 | TC-E2-P2-01, TC-E2-P2-02, TC-E2-P2-03, TC-E2-P2-04, TC-E2-P3-01 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-04, TC-E2-P1-05, TC-E2-P2-06 | Component + Unit |
| NFR2 | CRUD changes reflect in UI < 2s | TC-E2-P0-06, TC-E2-P1-12, TC-E2-P1-15 | Component + E2E |
| NFR5 | API validates + sanitizes all inputs | TC-E2-P0-07, TC-E2-P0-04, TC-E2-P3-03 | API Integration + Unit |
| NFR6 | No stack traces to end users | TC-E2-P0-03, TC-E2-P0-04 | Component + API Integration |
| NFR7 | Core tasks completable without training | TC-E2-P3-04, TC-E2-P1-09 (E2E flow) | Component + E2E |

---

## 7. Test Execution Order

```
Phase 1 — Backend Unit Gate (no DB needed)
  1. TC-E2-P0-02   Zod schema rejects partial required fields
  2. TC-E2-P3-03   FluentValidation unit — Nit field
  3. TC-E2-P2-01   SortControl default renders fecha-desc
  4. TC-E2-P3-01   Sort comparators for fecha-desc / fecha-asc
  5. TC-E2-P2-06   Filter performance over 500 records

Phase 2 — Backend API Gate (TestContainers DB required)
  6. TC-E2-P1-17   GET /clientes returns list
  7. TC-E2-P1-18   POST /clientes creates and returns 201
  8. TC-E2-P0-07   POST /clientes rejects missing fields (400)
  9. TC-E2-P0-04   POST /clientes duplicate NIT → 409 Problem Details
 10. TC-E2-P1-19   PUT /clientes/{id} updates client
 11. TC-E2-P1-20   DELETE /clientes/{id} returns 204, then 404
 12. TC-E2-P0-05   DELETE /clientes/{id} sets contacts.cliente_id to NULL
 13. TC-E2-P3-02   GET /clientes/{id} 404 for unknown

Phase 3 — Component Tests (MSW, no live backend)
 14. TC-E2-P1-01   List renders all clients
 15. TC-E2-P1-02   EmptyState on empty list
 16. TC-E2-P1-03   ErrorPanel + Reintentar on network error
 17. TC-E2-P1-04   Search filter by Nombre (no extra API call)
 18. TC-E2-P1-05   Search filter by NIT/RUC
 19. TC-E2-P1-06   Click client → detail panel + URL update
 20. TC-E2-P1-08   Not-found client ID → graceful message
 21. TC-E2-P0-01   Create form — all empty → 4 inline errors
 22. TC-E2-P0-03   Create form — duplicate NIT → inline error
 23. TC-E2-P0-06   Create mutation → cache invalidated → list updates
 24. TC-E2-P1-10   Edit form pre-filled with current values
 25. TC-E2-P1-11   Edit cancel preserves original data
 26. TC-E2-P1-12   Edit save → list + detail updated, toast shown
 27. TC-E2-P1-13   Delete — confirmation dialog appears
 28. TC-E2-P1-14   Delete cancel keeps client in list
 29. TC-E2-P2-05   Delete with contacts → correct toast message
 30. TC-E2-P2-02   Sort Nombre A→Z (no extra API call)
 31. TC-E2-P2-03   Sort Nombre Z→A
 32. TC-E2-P2-04   Sort change preserves active search filter
 33. TC-E2-P3-04   Form fields have accessible labels

Phase 4 — E2E (Playwright, full stack)
 34. TC-E2-P1-07   Deep link /clientes/{id} renders detail
 35. TC-E2-P1-09   Create client E2E success flow
 36. TC-E2-P1-15   Delete client E2E (no contacts)
 37. TC-E2-P1-16   Delete client with contacts → contacts unassigned
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Layer |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering + interaction | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW 2+ | API mocking for component tests | Frontend |
| Playwright 1.40+ | E2E user flows | E2E |
| xUnit 2+ | Backend unit + integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated real DB for integration tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ (local) OR Docker (TestContainers auto-manages)
- Frontend dependencies installed (npm install)
- Backend dependencies restored (dotnet restore)
- Epic 1 foundation complete (project builds, DB migration runs)
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 7 | 2.0 | 14.0 | Complex flows: validation, 409, cascade delete, cache invalidation |
| P1 | 20 | 1.0 | 20.0 | Standard CRUD coverage: components + API integration + E2E |
| P2 | 6 | 0.75 | 4.5 | Sort + filter interactions, performance, accessibility |
| P3 | 4 | 0.5 | 2.0 | Date sort comparators, 404 API, validator unit, a11y labels |
| **Total** | **37** | — | **40.5 hours** | **~5 days** |

### Prerequisites

**Test Data Factories:**
- `ClienteFactory` — generates random valid `ClienteDTO` for seeding
- MSW handlers for all 5 CRUD endpoints (GET, POST, PUT, DELETE, GET-by-id)
- Playwright fixtures: pre-seeded DB state per E2E test

**Tooling:**
- Vitest 2+ with `@testing-library/react`, `jsdom`, MSW 2+
- Playwright 1.40+ with `baseURL: http://localhost:5173`
- xUnit 2+ with `WebApplicationFactory<Program>`
- TestContainers.PostgreSql NuGet package

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — all 7 tests must pass before any Story 2.x is merged
- **P1 pass rate**: 100% — each story's P1 tests must pass before that story is closed
- **P2 pass rate**: ≥85% — may defer with justification documented in `sprint-status.yaml`
- **P3 pass rate**: informational only

### Coverage Targets

- **Critical paths** (create, edit, delete): 100% AC covered
- **Validation** (frontend + backend): 100% required-field cases
- **Security** (NFR6 — no stack trace exposure): 100%
- **Delete cascade** (R3): 100% — non-negotiable cross-epic invariant

### Non-Negotiable Requirements

- [ ] TC-E2-P0-05 passes (contacts set to NULL on client delete)
- [ ] TC-E2-P0-04 passes (409 without stack trace)
- [ ] TC-E2-P0-01 and TC-E2-P0-07 pass (validation blocks submit at both layers)
- [ ] TC-E2-P0-06 passes (cache invalidated = FR27 satisfied)
- [ ] No high-risk items (R1, R2, R3, R4) left unmitigated at epic closure

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-20)
- [ ] P2 test cases pass or are formally deferred with justification in `sprint-status.yaml`
- [ ] No P0/P1 test is skipped without a documented reason
- [ ] `clientes` table exists in DB with correct UUID PK, snake_case columns, and `uk_clientes_nit` unique index
- [ ] `ON DELETE SET NULL` is verified on `contactos.cliente_id` FK (TC-E2-P0-05)
- [ ] E2E tests for create, delete, and deep-link pass in a full-stack environment

---

## 10. Notes for Story Implementation Agents

The following implementation constraints are required for test cases to pass:

1. **Zod schema** (`clienteFormSchema`) must mark `nombre`, `nit`, `telefono`, and `ciudad` as non-empty strings. Export the schema so unit tests can import it directly.
2. **NIT/RUC uniqueness** — `uk_clientes_nit` must be declared in `ClienteConfiguration.cs` via `.HasIndex(c => c.Nit).IsUnique()`. Backend must catch `DbUpdateException` for unique constraint violation and return `409 Conflict` Problem Details.
3. **`ON DELETE SET NULL`** — the EF Core FK configuration on `ContactoEntity` must include `.OnDelete(DeleteBehavior.SetNull)`. Verify with TC-E2-P0-05 before merging Story 2.5.
4. **TanStack Query mutation** — every `useMutation` for create/update/delete must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Omitting this breaks FR27 and TC-E2-P0-06.
5. **Sort state** — `SortControl` must initialize with `useState<SortOption>('fecha-desc')`. Sort option identifiers must exactly match: `nombre-asc` | `nombre-desc` | `fecha-desc` | `fecha-asc`.
6. **Search + sort** — the filter/sort pipeline must apply search first, then sort. Sort change must use `setSortOption(...)` without resetting the search state.
7. **ErrorPanel** — the fetch error state for the client list must render a `<ErrorPanel />` component with a button labeled exactly "Reintentar" that calls `refetch()` from TanStack Query.
8. **Toast messages** — use the project toast system with these exact strings:
   - Create: `"Cliente creado correctamente"`
   - Update: `"Cliente actualizado correctamente"`
   - Delete (no contacts): `"Cliente eliminado correctamente"`
   - Delete (with contacts): `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."`
9. **Deep linking** — `GET /api/v1/clientes/{id}` must be callable independently of the list endpoint. The `ClienteDetailView` component must fetch by ID from the URL param when the TanStack Query cache for the specific ID is cold (direct URL access).
10. **`SortControl` location** — component lives at `src/shared/components/SortControl` per architectural spec.
