---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-05-24"
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

Epic 2 implements the full Client Management feature (Gestión de Clientes): a split-panel SPA view at `/clientes` and `/clientes/:clienteId` where commercial team members can list, search, sort, create, view, edit, and delete client records. The backend exposes five REST endpoints (`GET`, `POST`, `GET/:id`, `PUT/:id`, `DELETE/:id`) under `/api/v1/clientes` with FluentValidation, NIT uniqueness enforcement, and Problem Details error contracts. The frontend uses TanStack Query with client-side filtering/sorting over the full cache.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Client-side real-time filter, EmptyState, ErrorPanel, sub-1s with 500 records |
| 2.2 | Client Detail View | Split-panel navigation, deep link `/clientes/:id`, not-found handling |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), NIT uniqueness (409), toast, list refresh |
| 2.4 | Edit Client | Pre-fill form, optimistic list/detail update, cancel discards changes |
| 2.5 | Delete Client | Confirmation dialog, removal from list, orphaned contacts remain, toast variants |
| 2.6 | Sort Client List | Four sort options, client-side sort over cache, filter+sort coexistence |

### Out of Scope for This Epic

- Contact management (Epic 3) and client-contact association (Epic 4)
- Authentication / authorization — explicitly deferred (MVP)
- Server-side pagination — NFR10 scale does not require it
- ContactManager inside client detail — introduced in Epic 4

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness constraint** not enforced at DB or validator level, allowing duplicate records silently | High | Critical | P0 | Integration test: POST same NIT twice → first returns 201, second returns 409 with Problem Details `"El NIT/RUC ya está registrado"` |
| R2 | **Required-field validation bypass**: Zod or FluentValidation misconfigured allows empty Nombre/NIT/Telefono/Ciudad to persist | High | Critical | P0 | Unit+Integration tests: submit form with each required field empty → 400 with `errors` map; assert NO `POST /api/v1/clientes` fired from frontend when invalid |
| R3 | **TanStack Query cache not invalidated** after create/edit/delete — list not updated in real time, violating FR27/NFR2 | High | High | P0 | Component tests with MSW: after mutation `onSuccess`, assert `queryClient.getQueryData(['clientes'])` is re-fetched and list re-renders |
| R4 | **Client-side filter performance** degrades beyond 1 second with 500 records (NFR1) | Medium | High | P1 | Performance unit test: filter 500-item array with `useMemo`, measure execution < 50ms |
| R5 | **Delete with associated contacts** — backend ON DELETE SET NULL not applied correctly; contacts orphaned or deleted | Medium | Critical | P1 | Integration test: create client + contacts, delete client → contacts remain with `clienteId = null` |
| R6 | **Deep link `/clientes/:clienteId`** fails if user navigates directly (SPA hydration issue) | Medium | High | P1 | E2E test: open browser directly to `/clientes/{uuid}` → correct client detail rendered without redirect |
| R7 | **Sort+filter coexistence broken** — applying sort clears search input or vice versa | Medium | Medium | P1 | Component test: apply search filter, then change sort → assert search input unchanged, list correctly filtered AND sorted |
| R8 | **404 for non-existent clienteId** not gracefully handled — blank screen or JS crash | Medium | Medium | P1 | Component/E2E test: navigate to `/clientes/non-existent-uuid` → not-found message displayed, no JS error |
| R9 | **Cancel on edit** loses original data in form state, or mutates TanStack Query cache | Low | Medium | P2 | Component test: open edit, modify fields, click Cancel → detail panel shows original values unchanged |
| R10 | **Toast messages language** displayed in English instead of Spanish (corporate standard violation) | Low | Low | P2 | Component tests: assert toast text matches "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente" |
| R11 | **Default sort order** not "Más reciente" on initial page load | Low | Low | P2 | Component test: render client list without prior state → assert SortControl displays "Más reciente" and list ordered by `createdAt` descending |
| R12 | **ErrorPanel on fetch failure** — backend unavailable scenario shows blank screen instead of retry UI | Low | High | P2 | Component test with MSW: simulate network error on `GET /api/v1/clientes` → ErrorPanel with "Reintentar" button rendered |

### Top 3 Risk Areas for Epic 2

1. **Data integrity — NIT uniqueness + required fields** (R1, R2): The core business invariant is that each client has a unique NIT and all four required fields filled. A misconfigured validator at either layer silently corrupts the data model and is the most business-critical failure mode.
2. **TanStack Query cache invalidation** (R3): FR27 requires that changes are visible immediately to all users. If `invalidateQueries(['clientes'])` is not called in `onSuccess`, the entire real-time contract is broken without any visible error — the most insidious failure class.
3. **Delete cascade integrity** (R5): Deleting a client must not cascade-delete associated contacts. The `ON DELETE SET NULL` FK constraint is infrastructure-level — if missed during migration, it silently destroys contact records.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌▌▌▌▌▌▌           4 tests
  API Integration (xUnit)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   12 tests
  Component (Vitest+RTL+MSW)  ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 14 tests
  Unit (Vitest/xUnit)         ▌▌▌▌▌▌▌▌▌▌▌▌          6 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                               36 tests
```

### Rationale

- **API Integration tests dominate** because the most critical risks (NIT uniqueness, required-field validation, delete cascade) are backend-enforced contracts verifiable only via HTTP calls.
- **Component tests (Vitest+RTL+MSW)** cover the frontend-specific risks: cache invalidation, real-time list updates, filter+sort coexistence, error UI states, and toast messages — providing fast, reliable feedback without a running server.
- **E2E tests are limited** to the 4 scenarios where the full browser+network+server stack is essential: deep linking, end-to-end create flow, end-to-end delete with contacts, and the search-under-500-records performance assertion.
- **Unit tests** cover pure logic: Zod schema validation, `useMemo` filter function, sort utility, and FluentValidation validator rules in isolation.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: POST /api/v1/clientes — Creates Client with All Required Fields

**Level:** API Integration
**Story:** 2.3
**Requirements:** AC-E2.1, FR4, FR8
**Risk covered:** R2

**Precondition:** Backend running with a clean `siesa_agents_db`. `clientes` table exists (Epic 1 migration + Epic 2 migration applied).

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body:
   ```json
   { "nombre": "Empresa Alpha", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }
   ```
2. Inspect response status and body.
3. GET `http://localhost:5000/api/v1/clientes` and verify the new client appears.

**Expected Result:**
- Response status: 201 Created.
- Response body: JSON object with `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601), `updatedAt`.
- `GET /api/v1/clientes` returns array including the created client.

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers (Postgres).

---

#### TC-E2-P0-02: POST /api/v1/clientes — Returns 400 When Required Fields Are Empty

**Level:** API Integration
**Story:** 2.3
**Requirements:** AC-E2.4, FR8, NFR5
**Risk covered:** R2

**Precondition:** Backend running.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with each of the following bodies (4 separate requests):
   - `{ "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }` (missing `nombre`)
   - `{ "nombre": "Empresa Alpha", "telefono": "3001234567", "ciudad": "Bogotá" }` (missing `nit`)
   - `{ "nombre": "Empresa Alpha", "nit": "900123456-1", "ciudad": "Bogotá" }` (missing `telefono`)
   - `{ "nombre": "Empresa Alpha", "nit": "900123456-1", "telefono": "3001234567" }` (missing `ciudad`)
2. Inspect each response.

**Expected Result:**
- Each request returns HTTP 400.
- `Content-Type: application/problem+json`.
- Response body conforms to Problem Details RFC 7807 with an `errors` object identifying the missing field.
- No client record created in the database.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-03: POST /api/v1/clientes — Returns 409 When NIT Already Exists

**Level:** API Integration
**Story:** 2.3
**Requirements:** AC-E2.1 (uniqueness), FR7
**Risk covered:** R1

**Precondition:** Backend running. One client with `nit: "900123456-1"` already exists.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with `nit: "900123456-1"` for the first client (setup).
2. POST `http://localhost:5000/api/v1/clientes` with the same `nit: "900123456-1"` for a second client.
3. Inspect the second response.

**Expected Result:**
- Second POST returns HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Response `detail` contains a message indicating the NIT already exists (e.g., `"El NIT/RUC ya está registrado"` or equivalent).
- No technical details or stack traces exposed.
- Database still contains exactly one client with that NIT.

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers.

---

#### TC-E2-P0-04: Frontend Form — Does Not Submit When Required Fields Are Empty

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirements:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** `ClienteForm` rendered in create mode. MSW intercepts `POST /api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteForm />` using `renderWithProviders`.
2. Click the submit button without filling any fields.
3. Assert inline validation errors appear.
4. Assert MSW handler for `POST /api/v1/clientes` was NOT called.
5. Repeat with each required field individually left empty.

**Expected Result:**
- Inline error messages appear on each empty required field.
- `POST /api/v1/clientes` is never invoked when form is invalid.
- User remains on the form (no navigation).

**Automation:** Vitest + `@testing-library/react` + MSW.

---

#### TC-E2-P0-05: TanStack Query Cache Invalidated After Create — List Updates Immediately

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirements:** AC-E2.1, FR27, NFR2
**Risk covered:** R3

**Precondition:** `ClienteListView` rendered with MSW serving 3 existing clients. MSW intercepts `POST /api/v1/clientes` returning a new client, and subsequently `GET /api/v1/clientes` returning 4 clients.

**Test Steps:**
1. Render `ClienteListView` — assert 3 items visible.
2. Click "Nuevo cliente" and fill all required fields.
3. Submit the form.
4. Wait for `onSuccess` handler to complete.
5. Inspect the client list.

**Expected Result:**
- List now shows 4 items including the newly created client.
- `queryClient.getQueryData(['clientes'])` is refreshed (not stale).
- Toast "Cliente creado correctamente" is visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-06: TanStack Query Cache Invalidated After Delete — Client Removed from List

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirements:** AC-E2.5, FR27
**Risk covered:** R3

**Precondition:** `ClienteListView` rendered with MSW serving 3 clients. MSW intercepts `DELETE /api/v1/clientes/{id}` returning 204, and subsequent `GET /api/v1/clientes` returning 2 clients.

**Test Steps:**
1. Render `ClienteListView` — assert 3 items visible.
2. Click on first client to open detail.
3. Click "Eliminar" → confirmation dialog appears.
4. Click "Confirmar".
5. Wait for mutation to complete.

**Expected Result:**
- List shows 2 remaining clients (deleted client absent).
- Right panel returns to empty/default state.
- Toast "Cliente eliminado correctamente" visible (or "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." if the client had contacts).

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: GET /api/v1/clientes — Returns All Clients

**Level:** API Integration
**Story:** 2.1
**Requirements:** AC-E2.1, FR1
**Risk covered:** General data retrieval

**Precondition:** 3 clients pre-seeded in test database.

**Test Steps:**
1. GET `http://localhost:5000/api/v1/clientes`.

**Expected Result:**
- HTTP 200 OK.
- Response body: JSON array with 3 client objects.
- Each object contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
- No wrapper object — direct array response per architecture spec.

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers.

---

#### TC-E2-P1-02: GET /api/v1/clientes/{id} — Returns Client by ID

**Level:** API Integration
**Story:** 2.2
**Requirements:** AC-E2.3, FR3
**Risk covered:** R6, R8

**Precondition:** One client pre-seeded. ID known.

**Test Steps:**
1. GET `http://localhost:5000/api/v1/clientes/{known-id}`.
2. GET `http://localhost:5000/api/v1/clientes/{non-existent-uuid}`.

**Expected Result:**
- First request: HTTP 200, full client object with all fields.
- Second request: HTTP 404, `Content-Type: application/problem+json`, no stack trace.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P1-03: PUT /api/v1/clientes/{id} — Updates Client Fields

**Level:** API Integration
**Story:** 2.4
**Requirements:** AC-E2.3, FR5
**Risk covered:** R3 (backend side)

**Precondition:** One client pre-seeded.

**Test Steps:**
1. PUT `http://localhost:5000/api/v1/clientes/{id}` with body:
   ```json
   { "nombre": "Empresa Alpha Modificada", "nit": "900123456-1", "telefono": "3009999999", "ciudad": "Medellín" }
   ```
2. GET `http://localhost:5000/api/v1/clientes/{id}`.

**Expected Result:**
- PUT returns HTTP 200 with updated client object.
- `updatedAt` is newer than `createdAt`.
- Subsequent GET returns the updated values.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P1-04: DELETE /api/v1/clientes/{id} — Deletes Client; Contacts Set to NULL

**Level:** API Integration
**Story:** 2.5
**Requirements:** AC-E2.5, FR6, FR23 (contacts with `clienteId = null`)
**Risk covered:** R5

**Precondition:** One client with 2 associated contacts pre-seeded. FK `ON DELETE SET NULL` configured in `ContactoConfiguration.cs`.

**Test Steps:**
1. DELETE `http://localhost:5000/api/v1/clientes/{clientId}`.
2. GET `http://localhost:5000/api/v1/clientes/{clientId}`.
3. GET `http://localhost:5000/api/v1/contactos` and inspect the previously associated contacts.

**Expected Result:**
- DELETE returns HTTP 204 No Content.
- GET client returns HTTP 404.
- Both contacts still exist in the contactos endpoint.
- Both contacts have `clienteId: null` (unassigned).

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers.

---

#### TC-E2-P1-05: Deep Link — Direct URL /clientes/{id} Renders Correct Client Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirements:** AC-E2.3, FR3, FR30
**Risk covered:** R6

**Precondition:** Frontend and backend running. At least one client seeded.

**Test Steps:**
1. Obtain a valid `clienteId` from `GET /api/v1/clientes`.
2. Open browser directly to `http://localhost:5173/clientes/{clienteId}`.
3. Wait for page to render.

**Expected Result:**
- Client detail panel renders with the correct Nombre, NIT/RUC, Teléfono, Ciudad.
- URL stays at `/clientes/{clienteId}` (no redirect).
- No 404 or blank panel.
- Left panel shows client list with the navigated client visually selected.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-06: Deep Link — Non-Existent clienteId Renders Not-Found Gracefully

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirements:** AC-E2.3 (not-found message), FR3
**Risk covered:** R8

**Precondition:** MSW intercepts `GET /api/v1/clientes/non-existent-uuid` returning 404.

**Test Steps:**
1. Render router with path `/clientes/non-existent-uuid`.
2. Wait for data fetch to complete.

**Expected Result:**
- A not-found message is displayed in the detail panel.
- No JavaScript exceptions thrown.
- Left panel (client list) still renders normally.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: Real-Time Search Filters List by Nombre and NIT/RUC

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** AC-E2.2, FR2, NFR1
**Risk covered:** R4

**Precondition:** `ClienteListView` rendered with MSW returning 5 clients with distinct Nombres and NITs.

**Test Steps:**
1. Render `ClienteListView` — assert 5 clients listed.
2. Type "Alpha" into the search field.
3. Assert only clients matching "Alpha" in Nombre or NIT are shown.
4. Clear the search field.
5. Assert all 5 clients are shown again.
6. Type a NIT substring (e.g., "900").
7. Assert only matching clients are shown.

**Expected Result:**
- Filter is applied in real time (no button press needed).
- Results update on every keystroke.
- Clearing restores the full list.
- No additional API calls triggered during filtering.

**Automation:** Vitest + RTL + MSW (assert `GET /api/v1/clientes` called only once on mount).

---

#### TC-E2-P1-08: EmptyState Displayed When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** AC-E2.1 (empty state), FR1

**Precondition:** MSW returns empty array `[]` for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for data to load.

**Expected Result:**
- `EmptyState` component is rendered with a message guiding the user to create the first client.
- No client list items rendered.
- "Nuevo cliente" button is accessible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: ErrorPanel Displayed and Retry Works When Backend Is Unavailable

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirements:** AC-E2.1 (error state), FR1

**Precondition:** MSW configured to return a network error for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView` with the network error MSW handler active.
2. Wait for the fetch to fail.
3. Assert `ErrorPanel` with "Reintentar" button renders.
4. Update MSW handler to return 3 clients.
5. Click "Reintentar".
6. Wait for data to reload.

**Expected Result:**
- `ErrorPanel` with "Reintentar" button appears on fetch failure.
- No blank screen or unhandled error.
- After clicking "Reintentar", the list loads correctly.

**Automation:** Vitest + RTL + MSW.
**Risk covered:** R12

---

#### TC-E2-P1-10: Sort — Four Options Available and Applied Client-Side Without New API Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** AC-E2.6, FR2

**Precondition:** `ClienteListView` rendered with MSW returning 4 clients with different `nombre` and `createdAt` values.

**Test Steps:**
1. Render `ClienteListView` — default sort is "Más reciente".
2. Select "Nombre A→Z" from `SortControl`. Assert list is alphabetically ascending. Assert no new `GET /api/v1/clientes` call fired.
3. Select "Nombre Z→A". Assert alphabetically descending. No new API call.
4. Select "Más antiguo". Assert ordered by `createdAt` ascending. No new API call.
5. Select "Más reciente". Assert ordered by `createdAt` descending (newest first). No new API call.

**Expected Result:**
- All four sort options work correctly.
- Zero additional API calls triggered during sorting (client-side operation over TanStack Query cache).

**Automation:** Vitest + RTL + MSW (assert GET called only once).
**Risk covered:** R7

---

#### TC-E2-P1-11: Sort + Filter Coexistence — Sort Does Not Clear Active Search

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** AC-E2.6
**Risk covered:** R7

**Precondition:** `ClienteListView` with MSW returning 5 clients.

**Test Steps:**
1. Type "Beta" in the search field — 2 clients matching.
2. Select "Nombre A→Z" from `SortControl`.
3. Assert search input still shows "Beta".
4. Assert only the 2 "Beta" clients are shown, sorted A→Z.
5. Change sort to "Nombre Z→A".
6. Assert same 2 clients shown, now sorted Z→A.

**Expected Result:**
- Search input value is preserved across sort changes.
- Sort is applied to the currently-filtered result set, not the full list.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Default Sort Order Is "Más reciente" on Initial Load

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirements:** AC-E2.6
**Risk covered:** R11

**Precondition:** `ClienteListView` rendered for the first time (no prior sort state). MSW returns 3 clients with distinct `createdAt` values.

**Test Steps:**
1. Render `ClienteListView`.
2. Assert `SortControl` displays "Más reciente" as selected option.
3. Assert list order matches `createdAt` descending (newest first).

**Expected Result:**
- Default sort is "Más reciente" without user interaction.
- List is ordered newest-first on first render.

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Edit Form Opens Pre-Filled and Cancel Discards Changes

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirements:** AC-E2.3, FR5, FR6
**Risk covered:** R9

**Precondition:** `ClienteDetailView` rendered with a known client (Nombre: "Empresa Alpha"). MSW intercepts `GET /api/v1/clientes/{id}`.

**Test Steps:**
1. Render `ClienteDetailView` for a client.
2. Click "Editar".
3. Assert form opens pre-filled with Nombre "Empresa Alpha" and other correct field values.
4. Clear the Nombre field and type "Nombre Modificado".
5. Click "Cancelar".
6. Assert detail panel shows original Nombre "Empresa Alpha".
7. Assert no `PUT /api/v1/clientes/{id}` was called.

**Expected Result:**
- Form pre-fills correctly from current data (FR6).
- Canceling does NOT persist changes.
- Original data visible in detail view unchanged.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-02: Edit Inline Validation — Required Field Cleared Shows Error Without Submitting

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirements:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** `ClienteForm` rendered in edit mode with all fields pre-filled.

**Test Steps:**
1. Clear the `Nombre` field.
2. Click the save button.
3. Assert inline error on `Nombre` field.
4. Assert `PUT /api/v1/clientes/{id}` not called.

**Expected Result:**
- Inline error appears on cleared required field.
- Form not submitted.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Delete Confirmation Dialog — Cancel Preserves Client

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirements:** AC-E2.5

**Precondition:** `ClienteDetailView` rendered.

**Test Steps:**
1. Click "Eliminar".
2. Assert confirmation dialog appears with "Confirmar" and "Cancelar" buttons and message "¿Eliminar este cliente?".
3. Click "Cancelar".
4. Assert dialog closes.
5. Assert `DELETE /api/v1/clientes/{id}` was NOT called.
6. Assert client detail is still visible with original data.

**Expected Result:**
- Dialog text matches spec.
- No deletion occurs when user cancels.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: Toast Messages Appear in Spanish After Each Mutation

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3, 2.4, 2.5
**Requirements:** AC-E2.1 (create), AC-E2.3 (edit), AC-E2.5 (delete), corporate standard (Spanish UI)
**Risk covered:** R10

**Precondition:** MSW handlers for create/update/delete all returning success responses.

**Test Steps:**
1. Execute create mutation → assert toast "Cliente creado correctamente".
2. Execute update mutation → assert toast "Cliente actualizado correctamente".
3. Execute delete mutation (no associated contacts) → assert toast "Cliente eliminado correctamente".
4. Execute delete mutation (with associated contacts) → assert toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.".

**Expected Result:**
- All toast messages are in Spanish.
- Exact text matches acceptance criteria spec.
- No English fallback text visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-05: E2E — End-to-End Create Client Flow

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirements:** AC-E2.1, AC-E2.4, FR4

**Precondition:** Frontend and backend running.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Fill form: Nombre="Empresa Test E2E", NIT="999888777-0", Telefono="3101234567", Ciudad="Cali".
4. Click submit.
5. Observe the client list.

**Expected Result:**
- Toast "Cliente creado correctamente" appears.
- New client "Empresa Test E2E" appears in the list without page reload.
- Clicking on the new client opens the detail panel with correct data.

**Automation:** Playwright E2E.

---

#### TC-E2-P2-06: E2E — Search Returns Results in Under 1 Second with 500 Records

**Level:** E2E (Playwright)
**Story:** 2.1
**Requirements:** AC-E2.2, NFR1
**Risk covered:** R4

**Precondition:** Frontend and backend running. 500 client records seeded via test data script.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Wait for list to fully load.
3. Start measuring time.
4. Type a search term that matches ~10 of the 500 clients.
5. Measure time until filtered results are visible.

**Expected Result:**
- Filtered results appear in under 1 second after typing.
- No visible lag or performance degradation.
- List shows only matching clients.

**Automation:** Playwright E2E with `page.waitForSelector` timing.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: FluentValidation Unit Tests for CreateClienteRequestValidator

**Level:** Unit (xUnit)
**Story:** 2.3

**Test Steps:**
1. Instantiate `CreateClienteRequestValidator`.
2. Validate requests with: empty `nombre`, empty `nit`, empty `telefono`, empty `ciudad`, all-empty, all-valid.
3. Assert validation result for each case.

**Expected Result:**
- Each invalid case produces the correct validation failure with the correct property name.
- Valid request produces no failures.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-02: Zod Schema Unit Tests for clienteSchema

**Level:** Unit (Vitest)
**Story:** 2.3

**Test Steps:**
1. Import `clienteSchema` from `clienteSchema.ts`.
2. Test `parse`/`safeParse` with missing fields, extra fields, and valid data.

**Expected Result:**
- Missing required fields produce Zod validation errors on the correct field paths.
- Valid data parses without errors.

**Automation:** Vitest unit test.

---

#### TC-E2-P3-03: Sort Utility Function — Pure Unit Tests

**Level:** Unit (Vitest)
**Story:** 2.6

**Test Steps:**
1. Import the sort utility used by `SortControl`/`ClienteListView`.
2. Test all four sort options (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`) against a fixed array of 10 clients.

**Expected Result:**
- Each sort identifier produces the correctly ordered array.
- Original array not mutated.

**Automation:** Vitest unit test.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: User can register new client (Nombre, NIT/RUC, Teléfono, Ciudad) and it appears in list immediately | 2.1, 2.3 | TC-E2-P0-01, TC-E2-P0-04, TC-E2-P0-05, TC-E2-P2-05 | Covered |
| AC-E2.2: User can search clients by name or NIT/RUC and see results in under 1 second | 2.1 | TC-E2-P1-07, TC-E2-P2-06 | Covered |
| AC-E2.3: User can view complete client detail, edit any field, and save changes | 2.2, 2.4 | TC-E2-P1-02, TC-E2-P1-03, TC-E2-P1-05, TC-E2-P2-01 | Covered |
| AC-E2.4: System prevents saving client with empty required fields, shows clear error messages | 2.3, 2.4 | TC-E2-P0-02, TC-E2-P0-04, TC-E2-P2-02 | Covered |
| AC-E2.5: User can delete client and it disappears from list | 2.5 | TC-E2-P0-06, TC-E2-P1-04, TC-E2-P2-03, TC-E2-P2-04 | Covered |
| AC-E2.6: User can sort client list by Name A→Z, Z→A, Most Recent, Oldest without page reload or losing filter | 2.6 | TC-E2-P1-10, TC-E2-P1-11, TC-E2-P1-12 | Covered |

---

## 6. Story-Level AC Coverage

### Story 2.1 — Client List & Search

| Story AC | Test Cases |
|----------|------------|
| Given clients exist → list shows Nombre and NIT/RUC per item | TC-E2-P1-01, TC-E2-P1-07 |
| Given typing in search → real-time filter (Nombre or NIT, < 1s, 500 records) | TC-E2-P1-07, TC-E2-P2-06 |
| Given no clients → EmptyState component shown | TC-E2-P1-08 |
| Given backend unavailable → ErrorPanel with "Reintentar" | TC-E2-P1-09 |

### Story 2.2 — Client Detail View

| Story AC | Test Cases |
|----------|------------|
| Click client item → right panel shows Nombre, NIT, Teléfono, Ciudad; URL updates to `/clientes/:id` | TC-E2-P1-05 |
| Direct URL `/clientes/:clienteId` → correct detail loaded | TC-E2-P1-05 |
| Non-existent `clienteId` → not-found message | TC-E2-P1-06 |

### Story 2.3 — Create Client

| Story AC | Test Cases |
|----------|------------|
| Click "Nuevo cliente" → form opens with required fields | TC-E2-P0-04 |
| Fill all fields and submit → client created, appears in list, toast success | TC-E2-P0-01, TC-E2-P0-05, TC-E2-P2-04, TC-E2-P2-05 |
| Submit with empty fields → inline errors, no backend call | TC-E2-P0-02, TC-E2-P0-04 |
| Duplicate NIT → 409 "El NIT/RUC ya está registrado" | TC-E2-P0-03 |

### Story 2.4 — Edit Client

| Story AC | Test Cases |
|----------|------------|
| Click "Editar" → form pre-filled with current values | TC-E2-P2-01 |
| Modify and save → changes reflected immediately in list and detail; toast success | TC-E2-P1-03, TC-E2-P2-04 |
| Clear required field and submit → inline error, no submission | TC-E2-P2-02 |
| Click "Cancelar" → original data unchanged | TC-E2-P2-01 |

### Story 2.5 — Delete Client

| Story AC | Test Cases |
|----------|------------|
| Click "Eliminar" → confirmation dialog "¿Eliminar este cliente?" | TC-E2-P2-03 |
| Confirm → client removed from list, right panel resets, toast | TC-E2-P0-06, TC-E2-P2-04 |
| Cancel dialog → client remains unchanged | TC-E2-P2-03 |
| Delete client with contacts → contacts remain, become unassigned, special toast | TC-E2-P1-04, TC-E2-P2-04 |

### Story 2.6 — Sort Client List

| Story AC | Test Cases |
|----------|------------|
| "Nombre A→Z" → alphabetically ascending, no new API call | TC-E2-P1-10 |
| "Nombre Z→A" → alphabetically descending, no new API call | TC-E2-P1-10 |
| "Más reciente" → newest `createdAt` first | TC-E2-P1-10, TC-E2-P1-12 |
| "Más antiguo" → oldest `createdAt` first | TC-E2-P1-10 |
| Active filter + sort change → filter preserved, sort applied to filtered set | TC-E2-P1-11 |
| Default sort on initial load → "Más reciente" | TC-E2-P1-12 |

---

## 7. NFR Coverage

| NFR | Requirement | Test Case(s) | Level |
|-----|-------------|--------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-07, TC-E2-P2-06 | Component + E2E |
| NFR2 | CRUD changes reflected in UI < 2s | TC-E2-P0-05, TC-E2-P0-06 (cache invalidation) | Component |
| NFR5 | Input validation and sanitization | TC-E2-P0-02, TC-E2-P0-04, TC-E2-P2-02, TC-E2-P3-01, TC-E2-P3-02 | API Integration + Unit |
| NFR6 | No stack traces exposed to end users | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-02 | API Integration |
| NFR7 | New user can complete core tasks without training | TC-E2-P2-05 (E2E full flow) | E2E |

---

## 8. Test Execution Order

```
Phase 1 — Backend API Gate (P0, DB required)
  1. TC-E2-P0-01  POST creates client
  2. TC-E2-P0-02  POST returns 400 for empty required fields
  3. TC-E2-P0-03  POST returns 409 for duplicate NIT
  4. TC-E2-P1-01  GET returns all clients
  5. TC-E2-P1-02  GET/:id returns client or 404
  6. TC-E2-P1-03  PUT updates client
  7. TC-E2-P1-04  DELETE removes client; contacts set to null

Phase 2 — Frontend Component Gate (P0, no backend)
  8. TC-E2-P0-04  Form blocks submission when fields empty
  9. TC-E2-P0-05  Cache invalidated after create
 10. TC-E2-P0-06  Cache invalidated after delete
 11. TC-E2-P1-06  Not-found message for non-existent ID

Phase 3 — List Behaviors (P1)
 12. TC-E2-P1-07  Real-time search by Nombre and NIT
 13. TC-E2-P1-08  EmptyState when no clients
 14. TC-E2-P1-09  ErrorPanel + Reintentar on fetch failure
 15. TC-E2-P1-10  All four sort options, no new API call
 16. TC-E2-P1-11  Sort+filter coexistence
 17. TC-E2-P1-12  Default sort "Más reciente"

Phase 4 — Edit/Delete/Toast Details (P2)
 18. TC-E2-P2-01  Edit pre-fill + cancel discards
 19. TC-E2-P2-02  Edit inline validation
 20. TC-E2-P2-03  Delete dialog cancel
 21. TC-E2-P2-04  Toast messages in Spanish

Phase 5 — E2E Integration (P2)
 22. TC-E2-P1-05  Deep link renders correct client detail
 23. TC-E2-P2-05  End-to-end create flow
 24. TC-E2-P2-06  Search performance with 500 records

Phase 6 — Unit Test Suites (P3)
 25. TC-E2-P3-01  FluentValidation unit tests
 26. TC-E2-P3-02  Zod schema unit tests
 27. TC-E2-P3-03  Sort utility unit tests
```

---

## 9. Test Tooling & Environment Requirements

| Tool | Purpose | Layer |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW (Mock Service Worker) | API mocking in component tests | Frontend |
| Playwright 1.40+ | E2E tests | Full stack |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| Bogus / AutoFixture | Test data generation (500-record seed) | Backend/E2E |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432
- Epic 1 migration applied (clientes table does NOT yet exist — Epic 2 adds it)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- MSW configured in vitest.setup.ts with server.listen() / server.resetHandlers()
```

---

## 10. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 6 | 2.5 | 15.0 | NIT uniqueness, cache invalidation — complex MSW + DB setup |
| P1 | 12 | 1.5 | 18.0 | Full CRUD API + component behaviors |
| P2 | 6 | 1.0 | 6.0 | Edit/delete detail flows, E2E, performance |
| P3 | 3 | 0.5 | 1.5 | Pure unit tests |
| **Total** | **27** | — | **40.5 hours** | **~5 days** |

### Test Data Requirements

- **Client factory**: generates valid `ClienteEntity` with UUID, Nombre, NIT (unique), Teléfono, Ciudad, `DateTimeOffset` timestamps.
- **500-record seed**: used exclusively by TC-E2-P2-06 (NFR1 performance test) — should be a separate test fixture, not polluting other tests.
- **Contact factory** (minimal, for TC-E2-P1-04 only): 2 contacts associated with a test client to verify `ON DELETE SET NULL`.

---

## 11. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — no exceptions; these 6 tests guard the core business invariants.
- **P1 pass rate**: 100% — CRUD completeness and real-time list behaviors are non-negotiable.
- **P2 pass rate**: ≥90% — detail flows and UX polish; may defer with documented justification.
- **P3 pass rate**: ≥80% — informational unit tests.

### Coverage Targets

- **Business-critical paths** (NIT uniqueness, required fields, ON DELETE SET NULL): 100%.
- **FR coverage** (FR1–FR8): 100%.
- **NFR1, NFR2, NFR5, NFR6**: 100% of applicable test cases.
- **Acceptance criteria** (AC-E2.1–AC-E2.6): 100%.

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] NIT uniqueness enforced at both FluentValidation and DB constraint levels (R1)
- [ ] Required-field validation blocks form submission in frontend (R2)
- [ ] TanStack Query cache invalidated on every mutation (R3)
- [ ] ON DELETE SET NULL verified — contacts survive client deletion (R5)
- [ ] All user-facing text (toasts, errors, labels) in Spanish (corporate standard)

---

## 12. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-12)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case skipped without documented reason
- [ ] `clientes` table created by EF Core migration with snake_case columns, UUID PK, unique index on `nit`
- [ ] FluentValidation rejects empty Nombre, NIT, Teléfono, Ciudad — confirmed via API integration tests
- [ ] Frontend Zod schema blocks form submission without backend call — confirmed via component tests
- [ ] TanStack Query cache invalidated on create, update, and delete — confirmed via component tests
- [ ] ON DELETE SET NULL behavior verified — contacts remain with `clienteId = null` after client deletion
- [ ] All toast messages in Spanish matching exact text in acceptance criteria

---

## 13. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **Database migration (Story 2.3):** The `clientes` table must include `UNIQUE (nit)` constraint. The `ContactoConfiguration.cs` must configure `ON DELETE SET NULL` on the `ClienteId` FK — even though contacts are implemented in Epic 3, the FK relationship must be defined correctly from the start.
2. **FluentValidation validators:** `CreateClienteRequestValidator` and `UpdateClienteRequestValidator` must validate `NotEmpty()` on all four required fields. The error response must include an `errors` dictionary mapping field names to messages.
3. **NIT conflict handling:** When a 409 is returned by the backend, the frontend must display `"El NIT/RUC ya está registrado"` without exposing any technical detail from the `ProblemDetails` response.
4. **TanStack Query invalidation:** Every mutation (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Missing this breaks FR27 and TC-E2-P0-05/TC-E2-P0-06.
5. **Client-side sorting:** Sort logic must use an immutable sort (do not mutate the original array from the cache). Use `[...data].sort(...)` or equivalent. Sort state is local `useState` — not Zustand, not URL params.
6. **Search filter:** Must use `useMemo` over the TanStack Query data — no debounce required for 500 records, but ensure no additional `GET /api/v1/clientes` calls are fired during typing.
7. **Delete with contacts:** The toast message must distinguish between a client with no contacts ("Cliente eliminado correctamente") and one with associated contacts ("Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."). The backend must inform the frontend whether contacts were affected (either via response body or a separate flag).
8. **SortControl default:** `SortControl` must initialize with `fecha-desc` (`"Más reciente"`) — not `nombre-asc`. The default sort identifier must match `fecha-desc` per the technical context in Story 2.6.
