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

Epic 2 delivers the complete CRUD lifecycle for the client catalog in Siesa Agents. Commercial team members can register, search, view, edit, sort, and delete client records using a two-panel layout (`/clientes`). The epic covers six stories spanning the frontend (React/TanStack Query/Zod) and the backend (.NET 10 Clean Architecture / EF Core / PostgreSQL). All data changes must be reflected immediately (FR27), search must respond under 1 second with up to 500 records (NFR1), and the system must never expose internal error details (NFR6).

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time filter, EmptyState, ErrorPanel, 500-record performance (NFR1) |
| 2.2 | Client Detail View | Deep-link `/clientes/:clienteId`, 404 graceful handling, panel layout |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), 409 NIT/RUC conflict, immediate list update (FR27) |
| 2.4 | Edit Client | Pre-fill form, required-field guard, cancel preserves data, immediate UI update (FR27) |
| 2.5 | Delete Client | Confirmation dialog, contact disassociation cascade (`clienteId = null`), toast messaging |
| 2.6 | Sort Client List | Four sort modes, client-side sort over cache (no re-fetch), sort persists with active search filter |

### Out of Scope for This Epic

- Contact management and client–contact association — Epics 3 and 4
- Authentication / authorization — explicitly deferred (MVP)
- Pagination beyond 500 records — NFR10 max for MVP
- HTTPS enforcement — non-local deployments only (NFR4)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness constraint** not enforced at DB level: duplicate clients silently created | High | Critical | P0 | API integration test: POST two clients with same NIT/RUC, assert 409 response with `application/problem+json` |
| R2 | **Required field validation bypass**: frontend Zod guard disabled/bypassed — invalid data reaches backend | Medium | Critical | P0 | Component test: submit form with each required field empty, assert inline error shown and no API call fired |
| R3 | **Client deletion cascade**: contacts retain stale `clienteId` FK, causing orphaned references or FK constraint violation | High | Critical | P0 | API integration test: create client + contacts, delete client, assert contacts exist with `clienteId = null` |
| R4 | **Real-time list refresh** (FR27): after create/edit/delete, TanStack Query `invalidateQueries` not called — stale list shown | Medium | High | P1 | Component test: perform mutation, assert list re-renders with updated data without full page reload |
| R5 | **Search performance** (NFR1): client-side filter over 500-record cache exceeds 1-second threshold | Medium | High | P1 | Performance test: seed 500 records, measure filter render time ≤ 1000ms |
| R6 | **Deep-link `/clientes/:clienteId`** renders blank/error on direct URL access due to missing route param handling | Medium | High | P1 | E2E test: navigate directly to `/clientes/{uuid}`, assert correct client detail renders |
| R7 | **404 on invalid clienteId**: unhandled `clienteId` not found causes unhandled promise rejection or crash | Medium | Medium | P1 | Component/E2E test: navigate to `/clientes/non-existent-id`, assert graceful not-found message |
| R8 | **Client-side sort breaks with active search filter**: sort resets search input or re-fetches from API | Low | High | P1 | Component test: apply search filter, change sort — assert search input preserved and no new API call |
| R9 | **Cancel on edit/create does not restore original data**: form state mutates client detail display | Low | Medium | P2 | Component test: open edit, modify fields, cancel — assert original values displayed in detail panel |
| R10 | **EmptyState not shown** when client list is empty: `undefined` or `[]` from API causes crash instead | Low | Medium | P2 | Component test: mock API returning `[]`, assert `EmptyState` component renders |
| R11 | **FluentValidation error messages** from backend bypass NFR6: technical details leaked in 400 responses | Low | High | P2 | API integration test: send invalid payload, assert 400 body is Problem Details without stack traces |
| R12 | **SortControl default** not "Más reciente" on initial load — list appears unordered | Low | Low | P3 | Unit test: render SortControl with no initial state, assert `fecha-desc` is selected |

### Top 3 Risk Areas for Epic 2

1. **NIT/RUC uniqueness + 409 conflict handling** (R1) — a missing DB constraint allows duplicate clients, silently corrupting the commercial database. The 409 path must be tested end-to-end from the constraint to the user-facing error message.
2. **Contact cascade on client deletion** (R3) — if contacts are not properly disassociated (`clienteId = null`) when their client is deleted, the data integrity model breaks and Epic 4 (association) cannot be built on top of it.
3. **Required field validation bypass** (R2) — if Zod front-end validation can be bypassed (e.g., via direct API call or form state bug), FluentValidation on the backend is the last line of defense. Both layers must be independently verified.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌▌▌▌▌▌▌▌          5 tests
  API Integration (xUnit)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   12 tests
  Component (Vitest+RTL)      ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   14 tests
  Unit (Vitest/xUnit)         ▌▌▌▌▌▌▌▌               6 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                                37 tests
```

### Rationale

- **API integration tests dominate** because the backend is the authority for data integrity: uniqueness constraint, cascade behavior, validation, and Problem Details format must all be verified at the API layer.
- **Component tests are the second largest layer** because business logic lives in React components: form validation (Zod), real-time list updates (TanStack Query), sort/filter interaction, and conditional UI rendering (EmptyState, ErrorPanel, toast).
- **E2E coverage focuses on cross-layer user journeys**: create-and-see, deep-link, full delete-with-toast — scenarios where frontend and backend must cooperate correctly.
- **Unit tests cover pure logic**: sort comparator functions, Zod schema shapes, and FluentValidation rules in isolation.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: Backend Rejects Duplicate NIT/RUC with 409

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.1 (unique NIT/RUC), FR1
**Risk covered:** R1

**Precondition:** `clientes` table exists with a UNIQUE constraint on `nit_ruc`. A client with NIT/RUC `900123456` already exists.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body `{ "nombre": "Empresa B", "nitRuc": "900123456", "telefono": "3001234567", "ciudad": "Bogotá" }`.
2. Inspect response status and body.

**Expected Result:**
- HTTP status: 409 Conflict.
- `Content-Type: application/problem+json`.
- Response body contains `"title"` and `"detail"` with message indicating NIT/RUC already exists.
- No `stackTrace` key in response body (NFR6).

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` with test database.

---

#### TC-E2-P0-02: Frontend Form Blocks Submission with Empty Required Fields

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** Create Client form rendered with MSW mocking the API (no real calls should occur).

**Test Steps:**
1. Render the create client form.
2. Leave all fields empty.
3. Click the submit button.
4. Assert inline error messages appear.
5. Assert no `POST /api/v1/clientes` call was made (MSW handler not invoked).

**Expected Result:**
- Inline error messages appear on `Nombre`, `NIT/RUC`, `Teléfono`, and `Ciudad` fields.
- The form does NOT call the backend.
- No toast or success indicator is shown.

**Automation:** Vitest + `@testing-library/react` + MSW.

---

#### TC-E2-P0-03: Frontend Form Blocks Submission with Single Empty Required Field

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** Create client form rendered. Three fields filled, one empty (test each field separately for P0 coverage).

**Test Steps:**
1. Fill `Nombre`, `NIT/RUC`, `Teléfono` — leave `Ciudad` empty.
2. Submit the form.
3. Assert inline error appears on `Ciudad`.
4. Assert no API call fired.

**Expected Result:**
- Only the empty field shows an error.
- Form is not submitted.

**Automation:** Vitest + RTL + MSW. Parameterize for each required field.

---

#### TC-E2-P0-04: Client Delete Disassociates Contacts (clienteId = null)

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 (contact data intact, `clienteId = null`), FR7, FR25
**Risk covered:** R3

**Precondition:** Client `clienteA` exists. Contacts `contacto1` and `contacto2` have `clienteId = clienteA.id`.

**Test Steps:**
1. DELETE `http://localhost:5000/api/v1/clientes/{clienteA.id}`.
2. GET `http://localhost:5000/api/v1/contactos/{contacto1.id}` and `{contacto2.id}`.
3. Inspect `clienteId` field on each contact.
4. GET `http://localhost:5000/api/v1/clientes/{clienteA.id}`.

**Expected Result:**
- DELETE returns 204 No Content.
- Both contacts still exist with all their data (name, role, phone, email) intact.
- Both contacts have `clienteId: null` (or field absent).
- GET on deleted client returns 404.

**Automation:** xUnit integration test with test database seeded via EF Core.

---

#### TC-E2-P0-05: Backend FluentValidation Rejects Missing Required Fields

**Level:** API Integration
**Story:** 2.3, 2.4
**Requirement:** FR8, NFR5, NFR6
**Risk covered:** R2, R11

**Precondition:** Backend running.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body `{ "nombre": "", "nitRuc": "900999001", "telefono": "3001234567", "ciudad": "Bogotá" }` (empty Nombre).
2. Repeat with `nitRuc` empty, `telefono` empty, `ciudad` empty.
3. Inspect each response.

**Expected Result:**
- HTTP status: 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response body contains `errors` object with field-level messages.
- No `stackTrace`, `exception`, or `innerException` keys present.

**Automation:** xUnit integration test; four parameterized cases.

---

### P1 — Must Pass Before Story Is Closed as Done

#### TC-E2-P1-01: Client List Renders on Page Load

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.1 (appears in list), FR2

**Precondition:** MSW returns a list of 3 clients with `nombre` and `nitRuc` fields.

**Test Steps:**
1. Render the `/clientes` route component.
2. Wait for the loading state to resolve.
3. Assert each client's `Nombre` and `NIT/RUC` are visible in the left panel list.

**Expected Result:**
- Left panel (280px) renders a scrollable list.
- Each list item shows `Nombre` and `NIT/RUC`.
- No error panel shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Client List Filters in Real Time by Name

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2 (search by name in < 1s), FR3
**Risk covered:** R5

**Precondition:** MSW returns 3 clients: "Empresa Alpha", "Empresa Beta", "Organización Gamma".

**Test Steps:**
1. Render `/clientes` component, wait for list to load.
2. Type "Beta" into the search field.
3. Assert only "Empresa Beta" is visible in the list.
4. Assert "Empresa Alpha" and "Organización Gamma" are not in the DOM.
5. Clear the search field.
6. Assert all three clients reappear.

**Expected Result:**
- List filters to show only matching items as user types.
- Filter is applied client-side (no new API call on each keystroke — MSW handler invoked only once on initial load).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: Client List Filters in Real Time by NIT/RUC

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2 (search by NIT/RUC in < 1s), FR4
**Risk covered:** R5

**Precondition:** Same setup as TC-E2-P1-02. Clients have distinct NIT/RUC values.

**Test Steps:**
1. Render the list, wait for load.
2. Type the NIT/RUC of "Empresa Beta" into the search field.
3. Assert only "Empresa Beta" appears.

**Expected Result:**
- Filter matches on NIT/RUC as well as Nombre.
- Only the matching client is shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: EmptyState Shown When No Clients Exist

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-2.1 (EmptyState guidance)
**Risk covered:** R10

**Precondition:** MSW returns `{ data: [] }` for GET `/api/v1/clientes`.

**Test Steps:**
1. Render `/clientes`.
2. Wait for loading to resolve.
3. Assert `EmptyState` component is rendered.
4. Assert the EmptyState contains a message guiding the user to create the first client.

**Expected Result:**
- `EmptyState` is visible with guidance text.
- No client list items rendered.
- No error panel shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: ErrorPanel Shown When API Is Unavailable

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-2.1 (ErrorPanel with "Reintentar" on fetch failure)

**Precondition:** MSW configured to return network error for GET `/api/v1/clientes`.

**Test Steps:**
1. Render `/clientes`.
2. Wait for loading to resolve (or error to surface).
3. Assert `ErrorPanel` component is rendered.
4. Assert a "Reintentar" button is present.

**Expected Result:**
- `ErrorPanel` renders instead of the list.
- A "Reintentar" (retry) button is visible.
- No client items shown.

**Automation:** Vitest + RTL + MSW (network failure handler).

---

#### TC-E2-P1-06: Client Detail Loads on Item Click and Updates URL

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** AC-2.2 (right panel detail, URL updates to `/clientes/:clienteId`), FR5, FR30

**Precondition:** MSW returns list of clients and individual client detail.

**Test Steps:**
1. Render `/clientes` with a list of clients.
2. Click on the first client item.
3. Assert right panel shows: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`.
4. Assert URL is `/clientes/{clienteId}`.

**Expected Result:**
- All four fields visible in detail panel.
- URL updates to `/clientes/:clienteId` without page reload.

**Automation:** Vitest + RTL + MSW + TanStack Router test utilities.

---

#### TC-E2-P1-07: Deep Link to /clientes/:clienteId Loads Correct Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (direct URL access), FR30
**Risk covered:** R6

**Precondition:** Frontend dev server running. Backend seeded with at least one client (or MSW active in test mode). A valid `clienteId` UUID is known.

**Test Steps:**
1. Navigate directly to `http://localhost:5173/clientes/{known-uuid}`.
2. Wait for page to render.
3. Assert the right panel displays the correct client details.

**Expected Result:**
- Client detail panel renders with correct `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`.
- No redirect or blank page.
- No unhandled error in console.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-08: Graceful 404 on Non-Existent clienteId

**Level:** Component (Vitest + RTL) + E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (graceful not-found message)
**Risk covered:** R7

**Precondition:** MSW returns 404 for GET `/api/v1/clientes/non-existent-id`.

**Test Steps:**
1. Navigate to `/clientes/00000000-0000-0000-0000-000000000000`.
2. Wait for render.
3. Assert a not-found message is displayed in the right panel.
4. Assert no unhandled JavaScript error thrown.

**Expected Result:**
- Not-found message (e.g., "Cliente no encontrado") rendered in the right panel.
- Application does not crash.
- Navigation shell still visible.

**Automation:** Vitest + RTL (unit) and Playwright (E2E for full stack).

---

#### TC-E2-P1-09: Create Client — Happy Path

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1 (client appears in list immediately), AC-2.3 (success toast), FR1, FR27

**Precondition:** `/clientes` view open. Backend running and database seeded.

**Test Steps:**
1. Click "Nuevo cliente".
2. Fill in: `Nombre = "Empresa Test"`, `NIT/RUC = "800111222"`, `Teléfono = "3009876543"`, `Ciudad = "Medellín"`.
3. Click submit.
4. Assert success toast shows "Cliente creado correctamente".
5. Assert "Empresa Test" appears in the client list on the left panel.

**Expected Result:**
- Client created and immediately visible in list (FR27).
- Toast displayed with exact text "Cliente creado correctamente".
- No page reload required.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-10: Backend Creates Client and Returns 201

**Level:** API Integration
**Story:** 2.3
**Requirement:** FR1, FR27

**Precondition:** Backend running with test database.

**Test Steps:**
1. POST `/api/v1/clientes` with valid payload `{ "nombre": "Test Corp", "nitRuc": "700444555", "telefono": "3001111222", "ciudad": "Cali" }`.
2. Inspect response.
3. GET `/api/v1/clientes/{id}` using the `id` from the POST response.

**Expected Result:**
- POST returns 201 Created.
- Response body contains the created client with a `uuid` `id`, `nombre`, `nitRuc`, `telefono`, `ciudad`, and `createdAt` (`DateTimeOffset`).
- GET on the returned `id` returns 200 with matching data.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-11: Edit Client — Happy Path (All Fields Updated)

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-E2.3 (edit any field, save changes), FR6, FR27
**Risk covered:** R4

**Precondition:** Client detail displayed. MSW configured for GET (client data) and PUT (200 success).

**Test Steps:**
1. Render client detail for a known client.
2. Click "Editar".
3. Assert form opens pre-filled with current values.
4. Change `Ciudad` from "Bogotá" to "Barranquilla".
5. Submit the form.
6. Assert success toast shows "Cliente actualizado correctamente".
7. Assert detail panel reflects "Barranquilla".

**Expected Result:**
- Form pre-populated with current values on open.
- After save, detail and list reflect updated data immediately (FR27).
- Toast shown with exact text "Cliente actualizado correctamente".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Edit Client — Cancel Preserves Original Data

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (cancel preserves data)
**Risk covered:** R9

**Precondition:** Client detail rendered. MSW set up for GET only.

**Test Steps:**
1. Click "Editar".
2. Change `Nombre` to "Nombre Modificado".
3. Click "Cancelar".
4. Assert original `Nombre` is still shown in the detail panel.
5. Assert no PUT request was made.

**Expected Result:**
- Detail panel shows original client name, unmodified.
- No PUT call fired.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Delete Client — Happy Path (No Associated Contacts)

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** AC-2.5 (client removed, right panel reset, toast), FR7, FR27

**Precondition:** A client with no contacts exists in the system.

**Test Steps:**
1. Open client detail view.
2. Click "Eliminar".
3. Assert confirmation dialog appears with "¿Eliminar este cliente?" and "Confirmar"/"Cancelar" buttons.
4. Click "Confirmar".
5. Assert client no longer appears in the left panel list.
6. Assert right panel returns to empty/default state.
7. Assert toast shows "Cliente eliminado correctamente".

**Expected Result:**
- Client removed from list immediately (FR27).
- Right panel resets.
- Toast with exact text "Cliente eliminado correctamente".

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-14: Delete Client — With Associated Contacts Shows Specific Toast

**Level:** API Integration + Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (contact disassociation toast message), FR25
**Risk covered:** R3

**Precondition:** Client with two associated contacts.

**Test Steps:**
1. DELETE `/api/v1/clientes/{clienteId}` via API.
2. Assert HTTP 204.
3. GET `/api/v1/contactos/{contacto1.id}` — assert `clienteId = null`.

**Component layer:**
4. Render client detail with MSW simulating delete success with `{ contactsDisassociated: 2 }` in response or trigger the exact toast condition.
5. Assert toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

**Expected Result:**
- Backend: 204, contacts disassociated.
- Frontend: specific toast message when contacts were associated.

**Automation:** xUnit (API) + Vitest + RTL + MSW (component).

---

#### TC-E2-P1-15: Delete Client — Cancel Does Not Delete

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (cancel preserves record)

**Test Steps:**
1. Click "Eliminar" on a client.
2. Assert confirmation dialog appears.
3. Click "Cancelar".
4. Assert dialog closes.
5. Assert client is still in the left panel list.
6. Assert no DELETE call was made.

**Expected Result:**
- Dialog closes cleanly.
- Client record unchanged.
- No DELETE API call.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-16: Sort by Nombre A→Z — No API Refetch

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6 (sort without reload or new API call)
**Risk covered:** R8

**Precondition:** MSW returns a list of clients loaded once. React state tracks sort mode.

**Test Steps:**
1. Render the client list with 3 clients: "Zeta Corp", "Alpha SA", "Mercado Inc".
2. Select "Nombre A→Z" from `SortControl`.
3. Assert list order: "Alpha SA", "Mercado Inc", "Zeta Corp".
4. Assert no additional GET `/api/v1/clientes` call was made.

**Expected Result:**
- List reordered alphabetically ascending.
- No new API fetch triggered (MSW invoked only once).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-17: Sort Persists with Active Search Filter

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6 (sort does not clear search)
**Risk covered:** R8

**Precondition:** List loaded. Search filter "Empresa" applied (showing 2 matching clients).

**Test Steps:**
1. Type "Empresa" in search field.
2. Assert filtered results show.
3. Select "Nombre Z→A" from `SortControl`.
4. Assert search input still contains "Empresa".
5. Assert list is sorted Z→A within the filtered results.

**Expected Result:**
- Search input value unchanged.
- Sort applied to the already-filtered result set.
- No search reset or list flicker.

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Backend Returns 200 with Client List

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR2

**Test Steps:**
1. Seed 3 clients in test database.
2. GET `/api/v1/clientes`.
3. Inspect response.

**Expected Result:**
- HTTP 200 OK.
- Response body is a JSON array with 3 objects.
- Each object contains `id` (UUID), `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-02: Backend Returns 200 with Single Client Detail

**Level:** API Integration
**Story:** 2.2
**Requirement:** FR5

**Test Steps:**
1. Seed one client.
2. GET `/api/v1/clientes/{id}`.
3. Inspect response.

**Expected Result:**
- HTTP 200 OK.
- Response body matches all seeded fields.
- `id` is a valid UUID.
- `createdAt` is a valid `DateTimeOffset`.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-03: Backend Returns 404 for Non-Existent clienteId

**Level:** API Integration
**Story:** 2.2
**Requirement:** FR5, NFR6
**Risk covered:** R7

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.
2. Inspect response.

**Expected Result:**
- HTTP 404 Not Found.
- `Content-Type: application/problem+json`.
- Body contains `status`, `title`. No stack trace.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-04: Backend Updates Client and Returns 200

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR6

**Test Steps:**
1. Seed one client.
2. PUT `/api/v1/clientes/{id}` with updated `ciudad = "Bucaramanga"`.
3. GET `/api/v1/clientes/{id}`.

**Expected Result:**
- PUT returns 200 OK with updated resource.
- GET confirms `ciudad = "Bucaramanga"`.
- Other fields unchanged.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-05: Backend Deletes Client (No Contacts) and Returns 204

**Level:** API Integration
**Story:** 2.5
**Requirement:** FR7

**Test Steps:**
1. Seed one client with no contacts.
2. DELETE `/api/v1/clientes/{id}`.
3. GET `/api/v1/clientes/{id}`.

**Expected Result:**
- DELETE returns 204 No Content.
- Subsequent GET returns 404.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-06: Sort by Nombre Z→A Renders Correctly

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6

**Test Steps:**
1. Render list with "Alpha SA", "Mercado Inc", "Zeta Corp".
2. Select "Nombre Z→A" from `SortControl`.
3. Assert order: "Zeta Corp", "Mercado Inc", "Alpha SA".

**Expected Result:**
- Descending alphabetical order applied.
- No API call fired.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-07: Sort by "Más reciente" Orders by createdAt Descending

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6

**Precondition:** Three clients with distinct `createdAt` timestamps.

**Test Steps:**
1. Render list.
2. Select "Más reciente" from `SortControl`.
3. Assert newest client appears first.

**Expected Result:**
- Client with most recent `createdAt` at top of list.
- Client with oldest `createdAt` at bottom.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-08: Sort by "Más antiguo" Orders by createdAt Ascending

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6

**Test Steps:**
1. Render list.
2. Select "Más antiguo" from `SortControl`.
3. Assert oldest client appears first.

**Expected Result:**
- Client with oldest `createdAt` at top.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-09: SortControl Default Sort Is "Más reciente" on Initial Load

**Level:** Unit (Vitest)
**Story:** 2.6
**Requirement:** AC-2.6 (default sort)
**Risk covered:** R12

**Test Steps:**
1. Render `<SortControl />` with no initial props or state.
2. Assert the selected value is `fecha-desc`.

**Expected Result:**
- Default selected option is `fecha-desc` ("Más reciente").

**Automation:** Vitest unit test.

---

#### TC-E2-P2-10: 409 Conflict Shows User-Friendly Error (No Technical Details)

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-2.3 (NIT/RUC already registered, NFR6)
**Risk covered:** R1, R11

**Precondition:** MSW returns 409 `{ "detail": "El NIT/RUC ya está registrado" }` for POST.

**Test Steps:**
1. Render create client form.
2. Fill valid data with a duplicate NIT/RUC.
3. Submit.
4. Assert error message "El NIT/RUC ya está registrado" appears.
5. Assert no stack trace or technical detail shown in the UI.

**Expected Result:**
- User-friendly error message displayed inline or via toast.
- No raw error details visible.

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: Search Performance with 500 Records Under 1 Second

**Level:** Performance / E2E
**Story:** 2.1
**Requirement:** NFR1 (< 1s with 500 records)
**Risk covered:** R5

**Test Steps:**
1. Seed 500 clients in test database.
2. Load `/clientes` and confirm all 500 entries cached via TanStack Query.
3. Start timer. Type a search string that matches ~10% of records.
4. Stop timer when list finishes rendering filtered results.

**Expected Result:**
- Filter render time ≤ 1000ms.
- No browser janking or dropped frames.

**Automation:** Playwright performance test with `performance.now()` measurement.

---

#### TC-E2-P3-02: Zod Schema Unit Tests — All Required Fields Validated

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirement:** FR8
**Risk covered:** R2

**Test Steps:**
1. Import the client form Zod schema directly.
2. Parse payloads with each required field empty, null, and undefined.
3. Assert `ZodError` is thrown with the expected field path.

**Expected Result:**
- Schema rejects empty strings for `nombre`, `nitRuc`, `telefono`, `ciudad`.
- Error paths match field names exactly.

**Automation:** Vitest unit test (no DOM needed).

---

#### TC-E2-P3-03: FluentValidation Unit Test — All Rules Covered

**Level:** Unit (xUnit)
**Story:** 2.3, 2.4
**Requirement:** FR8, NFR5
**Risk covered:** R2, R11

**Test Steps:**
1. Instantiate `CreateClienteCommandValidator` directly in xUnit.
2. Validate with each required field empty.
3. Assert `ValidationResult.IsValid == false` with field-specific errors.

**Expected Result:**
- Validator rejects empty `Nombre`, `NitRuc`, `Telefono`, `Ciudad`.
- Error messages do not contain technical implementation details.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-04: Mobile Viewport — Client List Usable on 375px

**Level:** E2E (Playwright)
**Story:** 2.1, 2.2
**Requirement:** FR29, NFR7

**Test Steps:**
1. Set Playwright viewport to 375px width.
2. Navigate to `/clientes`.
3. Assert client list is accessible and scrollable.
4. Tap a client item.
5. Assert client detail renders (panels adapt for mobile).

**Expected Result:**
- Application is usable on mobile viewport.
- No horizontal overflow or clipped content.
- Touch targets meet minimum accessibility size.

**Automation:** Playwright E2E test with mobile viewport.

---

#### TC-E2-P3-05: List Re-Renders After Edit Without Full Page Reload

**Level:** E2E (Playwright)
**Story:** 2.4
**Requirement:** FR27, NFR2 (< 2s update)
**Risk covered:** R4

**Test Steps:**
1. Open a client and note the original `Nombre`.
2. Click "Editar", change `Nombre`, submit.
3. Assert updated `Nombre` appears in both left panel list and detail view.
4. Assert no `window.location.reload()` occurred (SPA update only).
5. Assert total time from submit to visible update ≤ 2000ms.

**Expected Result:**
- Real-time UI update (FR27) within 2 seconds (NFR2).
- No full page reload.

**Automation:** Playwright E2E test.

---

#### TC-E2-P3-06: List Re-Renders After Delete Without Full Page Reload

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** FR27, NFR2
**Risk covered:** R4

**Test Steps:**
1. Select a client.
2. Click "Eliminar", confirm.
3. Assert client disappears from left panel list immediately.
4. Assert right panel returns to default state.
5. Assert no `window.location.reload()`.

**Expected Result:**
- Deletion reflected in list in < 2s.
- No page reload.

**Automation:** Playwright E2E test.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Stories | Test Cases | Status |
|----------------|---------|------------|--------|
| AC-E2.1: Register client with Nombre, NIT/RUC, Teléfono, Ciudad — appears in list immediately | 2.3 | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P1-09, TC-E2-P1-10 | Covered |
| AC-E2.2: Search by name or NIT/RUC in < 1s | 2.1 | TC-E2-P1-02, TC-E2-P1-03, TC-E2-P3-01 | Covered |
| AC-E2.3: View full detail, edit any field, save | 2.2, 2.4 | TC-E2-P1-06, TC-E2-P1-11, TC-E2-P2-04 | Covered |
| AC-E2.4: Prevent save with empty required fields — clear error messages | 2.3, 2.4 | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P0-05 | Covered |
| AC-E2.5: Delete client — disappears from list | 2.5 | TC-E2-P0-04, TC-E2-P1-13, TC-E2-P1-14, TC-E2-P2-05 | Covered |
| AC-E2.6: Sort by Nombre A→Z / Z→A / Más reciente / Más antiguo without reload or filter loss | 2.6 | TC-E2-P1-16, TC-E2-P1-17, TC-E2-P2-06, TC-E2-P2-07, TC-E2-P2-08 | Covered |
| AC-2.1: Left panel list with Nombre + NIT/RUC per item | 2.1 | TC-E2-P1-01 | Covered |
| AC-2.1: EmptyState when no clients | 2.1 | TC-E2-P1-04 | Covered |
| AC-2.1: ErrorPanel + "Reintentar" on fetch failure | 2.1 | TC-E2-P1-05 | Covered |
| AC-2.2: Detail shows Nombre, NIT/RUC, Teléfono, Ciudad | 2.2 | TC-E2-P1-06, TC-E2-P2-02 | Covered |
| AC-2.2: URL updates to `/clientes/:clienteId` | 2.2 | TC-E2-P1-06, TC-E2-P1-07 | Covered |
| AC-2.2: Direct URL access loads correct detail | 2.2 | TC-E2-P1-07 | Covered |
| AC-2.2: Graceful not-found on invalid clienteId | 2.2 | TC-E2-P1-08, TC-E2-P2-03 | Covered |
| AC-2.3: Form opens with Nombre, NIT/RUC, Teléfono, Ciudad | 2.3 | TC-E2-P0-02 | Covered |
| AC-2.3: Client created + success toast | 2.3 | TC-E2-P1-09 | Covered |
| AC-2.3: Inline errors on empty fields, form not submitted | 2.3 | TC-E2-P0-02, TC-E2-P0-03 | Covered |
| AC-2.3: 409 "El NIT/RUC ya está registrado" | 2.3 | TC-E2-P0-01, TC-E2-P2-10 | Covered |
| AC-2.4: Form pre-filled with current values | 2.4 | TC-E2-P1-11 | Covered |
| AC-2.4: Changes reflected immediately + success toast | 2.4 | TC-E2-P1-11, TC-E2-P3-05 | Covered |
| AC-2.4: Required field cleared shows inline error, not submitted | 2.4 | TC-E2-P0-02, TC-E2-P0-03 | Covered |
| AC-2.4: Cancel preserves original data | 2.4 | TC-E2-P1-12 | Covered |
| AC-2.5: Confirmation dialog with "Confirmar"/"Cancelar" | 2.5 | TC-E2-P1-13 | Covered |
| AC-2.5: Client removed + right panel reset + toast | 2.5 | TC-E2-P1-13 | Covered |
| AC-2.5: Cancel preserves record | 2.5 | TC-E2-P1-15 | Covered |
| AC-2.5: Contacts disassociated (clienteId = null) + specific toast | 2.5 | TC-E2-P0-04, TC-E2-P1-14 | Covered |
| AC-2.6: Nombre A→Z sort without new API call | 2.6 | TC-E2-P1-16 | Covered |
| AC-2.6: Nombre Z→A sort | 2.6 | TC-E2-P2-06 | Covered |
| AC-2.6: Más reciente sort (date desc) | 2.6 | TC-E2-P2-07 | Covered |
| AC-2.6: Más antiguo sort (date asc) | 2.6 | TC-E2-P2-08 | Covered |
| AC-2.6: Sort persists with active search filter | 2.6 | TC-E2-P1-17 | Covered |
| AC-2.6: Default sort is "Más reciente" | 2.6 | TC-E2-P2-09 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P3-01, TC-E2-P1-02, TC-E2-P1-03 | Performance E2E + Component |
| NFR2 | CRUD changes reflected in UI < 2s | TC-E2-P3-05, TC-E2-P3-06 | E2E |
| NFR5 | API validates and sanitizes all inputs | TC-E2-P0-05, TC-E2-P3-03 | API Integration + Unit |
| NFR6 | No stack traces / internal errors exposed to user | TC-E2-P0-01, TC-E2-P0-05, TC-E2-P2-03, TC-E2-P2-10 | API Integration + Component |
| NFR7 | Core tasks completable without training | TC-E2-P1-09, TC-E2-P3-04 | E2E |
| NFR11 | Data model extensible (UUIDs as PKs, DateTimeOffset) | TC-E2-P1-10, TC-E2-P2-02 | API Integration |

---

## 7. Test Execution Order

```
Phase 1 — Data Integrity Gate (P0 — must pass first)
  1. TC-E2-P0-01  NIT/RUC uniqueness → 409
  2. TC-E2-P0-02  Frontend: empty form → no API call
  3. TC-E2-P0-03  Frontend: single empty field → inline error
  4. TC-E2-P0-04  Delete client → contacts disassociated
  5. TC-E2-P0-05  Backend FluentValidation → 400 Problem Details

Phase 2 — Read Path (P1 — Story 2.1 and 2.2)
  6. TC-E2-P1-01  List renders with client items
  7. TC-E2-P1-02  Real-time filter by Nombre
  8. TC-E2-P1-03  Real-time filter by NIT/RUC
  9. TC-E2-P1-04  EmptyState when list empty
 10. TC-E2-P1-05  ErrorPanel on fetch failure
 11. TC-E2-P1-06  Click item → detail + URL update
 12. TC-E2-P1-07  Deep link /clientes/:clienteId
 13. TC-E2-P1-08  Graceful 404 on invalid clienteId

Phase 3 — Write Path (P1 — Stories 2.3, 2.4, 2.5)
 14. TC-E2-P1-09  Create client E2E happy path
 15. TC-E2-P1-10  Backend creates client → 201
 16. TC-E2-P1-11  Edit client — update and confirm
 17. TC-E2-P1-12  Edit client — cancel preserves data
 18. TC-E2-P1-13  Delete client E2E — no contacts
 19. TC-E2-P1-14  Delete client with contacts — disassociation toast
 20. TC-E2-P1-15  Delete cancel — no deletion

Phase 4 — Sort (P1 — Story 2.6)
 21. TC-E2-P1-16  Sort Nombre A→Z — no refetch
 22. TC-E2-P1-17  Sort with active search filter preserved

Phase 5 — API Integration Coverage (P2)
 23. TC-E2-P2-01  GET /clientes returns list
 24. TC-E2-P2-02  GET /clientes/:id returns detail
 25. TC-E2-P2-03  GET /clientes/non-existent → 404
 26. TC-E2-P2-04  PUT /clientes/:id updates record
 27. TC-E2-P2-05  DELETE /clientes/:id → 204

Phase 6 — Sort Variants + UI Completeness (P2)
 28. TC-E2-P2-06  Sort Nombre Z→A
 29. TC-E2-P2-07  Sort Más reciente
 30. TC-E2-P2-08  Sort Más antiguo
 31. TC-E2-P2-09  SortControl default = fecha-desc
 32. TC-E2-P2-10  409 UI error message (no tech details)

Phase 7 — Non-Critical / Performance (P3)
 33. TC-E2-P3-01  Search perf 500 records < 1s
 34. TC-E2-P3-02  Zod schema unit tests
 35. TC-E2-P3-03  FluentValidation unit tests
 36. TC-E2-P3-04  Mobile viewport usability
 37. TC-E2-P3-05  Edit — real-time update < 2s
 38. TC-E2-P3-06  Delete — real-time update < 2s
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW (Mock Service Worker) | API mock for component tests | Frontend |
| Playwright | E2E tests (user journeys, deep linking, mobile) | Frontend/E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| Respawn or EF Core Migrations | Test DB cleanup between tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432
- Database user with CREATE DATABASE and DML privileges
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- Epic 1 completed: foundation, navigation shell, DB connected
- clientes table created via EF Core migration (Epic 2 migration applied)
- Test database seeded or Testcontainers Postgres available
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.5 | 12.5 | Uniqueness constraint, cascade delete, FluentValidation — complex setup |
| P1 | 17 | 1.5 | 25.5 | CRUD flows, real-time updates, sort, deep link |
| P2 | 10 | 1.0 | 10.0 | API coverage, sort variants, UI error messages |
| P3 | 6 | 1.0 | 6.0 | Performance, unit schemas, mobile viewport |
| **Total** | **38** | — | **54.0 hours** | **~6.8 days** |

### Prerequisites

**Test Data:**
- Client factory (UUID id, DateTimeOffset createdAt, nombre, nitRuc, telefono, ciudad)
- Contact factory (UUID id, clienteId nullable FK)
- MSW handlers for: GET /clientes, GET /clientes/:id, POST /clientes, PUT /clientes/:id, DELETE /clientes/:id

**Tooling:**
- Vitest 2+ with `@testing-library/react` and `jsdom`
- MSW 2+ for API mocking in component tests
- Playwright 1.40+ for E2E and mobile viewport tests
- xUnit 2+ with `WebApplicationFactory<Program>` for backend integration
- TestContainers (Postgres) for isolated database tests

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — all 5 tests must pass before any implementation begins
- **P1 pass rate**: 100% — all 17 tests must pass before epic closure
- **P2 pass rate**: ≥80% — up to 2 tests may be deferred with documented justification
- **P3 pass rate**: ≥60% — informational; performance test may require seeded data

### Coverage Targets

- **Critical paths** (create, edit, delete, uniqueness): 100%
- **Security scenarios** (NFR6 — no stack trace exposure): 100%
- **Data integrity** (cascade delete, contacto disassociation): 100%
- **Search and sort**: ≥90% of AC covered by automated tests
- **NFR1 performance**: verified at P3 (deferred if seeding effort too high)

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] NIT/RUC uniqueness enforced at DB + API level (R1 fully mitigated)
- [ ] Contact disassociation on client delete verified (R3 fully mitigated)
- [ ] Frontend form validation blocks submission without backend call (R2 mitigated)
- [ ] No 409 or 400 response exposes stack trace to frontend (NFR6)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-17)
- [ ] P2 test cases pass or are formally deferred with documented justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] `clientes` table has UNIQUE constraint on `nit_ruc` confirmed in schema
- [ ] Contact `clienteId` FK is nullable and set to null on client delete confirmed in schema
- [ ] `dotnet test` passes with zero failures for all client management integration tests
- [ ] `npx vitest run` passes with zero failures for all client component and unit tests
- [ ] Deep-link to `/clientes/:clienteId` verified manually in development environment
- [ ] Toast messages verified manually with exact text match

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **`nit_ruc` column must have a UNIQUE constraint** in the EF Core entity configuration. The backend must catch `DbUpdateException` for uniqueness violations and return 409 with `Content-Type: application/problem+json` and `detail: "El NIT/RUC ya está registrado"`.
2. **`clienteId` FK on `contactos` table must be nullable** (`int? / Guid?`). On client delete, EF Core cascade behavior must be set to `SetNull`, not `Cascade` or `Restrict`.
3. **TanStack Query `invalidateQueries`** must be called after every mutation (POST, PUT, DELETE) targeting the `['clientes']` query key to ensure FR27 immediate reflection.
4. **Zod schema** for the client form must mark all four fields as `z.string().min(1)` — empty string must fail validation, not just `undefined`/`null`.
5. **Toast messages must match exactly**: "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente", and "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." — these are verified by automated tests.
6. **SortControl** at `src/shared/components/SortControl` must default to `fecha-desc` when no external sort preference is provided.
7. **Sorting is client-side only** over the TanStack Query cache — no query param must be added to the GET `/api/v1/clientes` endpoint for sorting. Any additional fetch on sort selection will cause TC-E2-P1-16 to fail.
8. **ErrorPanel** must have a "Reintentar" button that triggers a TanStack Query `refetch()` on the client list query.
9. **`createdAt` field** must be `DateTimeOffset` (never `DateTime`) in both the entity and the DTO to support correct `fecha-asc`/`fecha-desc` sorting.
10. **Problem Details responses** (400, 404, 409, 500) must never include `stackTrace`, `exception`, `innerException`, or raw C# exception messages — enforced by `ExceptionHandlingMiddleware` from Epic 1.
