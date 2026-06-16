---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-16"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: draft
---

# Test Design — Epic 2: Client Management

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers the complete CRUD lifecycle for the `clientes` domain: listing with real-time search (client-side over TanStack Query cache), detail view with deep linking, create/edit via a React Hook Form + Zod validated form, delete with confirmation dialog and orphaned-contact handling, and client-side sort with four orderings (nombre A→Z, Z→A, más reciente, más antiguo). The backend provides five REST endpoints (`GET /api/v1/clientes`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`) guarded by FluentValidation and Problem Details RFC 7807 error formatting. No authentication exists in MVP.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time filter (<1s NFR1), EmptyState, ErrorPanel, client-side filtering over cache |
| 2.2 | Client Detail View | Panel split layout, deep linking (`/clientes/:clienteId`), 404 for missing ID |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), NIT duplicate (409), toast on success, FR27 immediate visibility |
| 2.4 | Edit Client | Pre-filled form, field-level validation, cancel discards changes, toast on success |
| 2.5 | Delete Client | Confirmation dialog, orphaned contacts remain with `clienteId = null`, toast variants |
| 2.6 | Sort Client List | Four sort modes, sort preserved with active search filter, default "Más reciente", no API call triggered |

### Out of Scope for This Epic

- Contact management (Epic 3)
- Client–Contact association (Epic 4)
- Authentication / authorization (explicitly deferred, MVP)
- Server-side pagination (deferred post-MVP)
- Performance benchmarking beyond NFR1/NFR2 thresholds (Epic-level NFR workflow)

---

## 2. Risk Assessment

### High-Priority Risks (Score ≥ 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Delete client with associated contacts: contacts must become unassigned (`clienteId = null`) via `ON DELETE SET NULL`. If FK is not configured with SET NULL, contacts are deleted (data loss). | 3 | 3 | 9 | Integration test verifying contacts persist with `cliente_id = null` after client deletion. Confirm `ContactoConfiguration.cs` has `.OnDelete(DeleteBehavior.SetNull)`. | DEV / QA | Sprint 2 |
| R-002 | BUS | NIT/RUC duplicate detection: backend must return 409 with a human-readable message. Frontend must surface "El NIT/RUC ya está registrado" without exposing raw error details (NFR6). If 409 handling is missing or generic, users cannot self-correct. | 2 | 3 | 6 | API integration test for POST with duplicate NIT; component test verifying frontend error message rendering from 409. | QA | Sprint 2 |
| R-003 | PERF | Real-time search must return filtered results in < 1 second with 500 records (NFR1). Client-side filtering over TanStack Query cache is the strategy, but if the query is not pre-loaded or the memo is misconfigured, filtering triggers re-fetches, violating NFR1. | 2 | 3 | 6 | Component test with 500 seeded records verifying filter completes in < 1s; assert no extra API calls during typing. | QA / DEV | Sprint 2 |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-004 | BUS | Sort state not preserved when search filter is active: changing sort clears the search input or re-fetches. SortControl is local `useState`; interaction with the search `useMemo` filter chain must be verified. | 2 | 2 | 4 | Component test: apply search filter, change sort, assert both states coexist and search input is unchanged. | QA |
| R-005 | TECH | TanStack Query `invalidateQueries(['clientes'])` not triggered after mutations (create/update/delete), breaking FR27 (changes immediately visible). Stale cache causes list to show outdated data. | 2 | 2 | 4 | Unit test on each mutation hook (useCreateCliente, useUpdateCliente, useDeleteCliente) asserting `invalidateQueries` is called with the correct query key on success. | DEV |
| R-006 | BUS | Cancel button in edit/delete does not discard changes: client data is mutated in local state before a save, so cancel must restore the original values. If form state persists between open/close cycles, stale data appears on next open. | 2 | 2 | 4 | Component test: open edit form, change a field, click Cancel, reopen form — assert original values are displayed. | QA |
| R-007 | TECH | Deep link to `/clientes/:clienteId` with a non-existent UUID does not render a graceful not-found message (displays blank screen or uncaught error). | 2 | 2 | 4 | Component/E2E test: navigate to `/clientes/non-existent-uuid`, assert a not-found message is rendered. | QA |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-008 | BUS | Default sort "Más reciente" not applied on initial page load. If SortControl initializes to undefined or the first array item rather than `fecha-desc`, the list order is unpredictable. | 1 | 2 | 2 | Monitor |
| R-009 | OPS | Backend DELETE endpoint returns incorrect HTTP status (e.g., 200 instead of 204 No Content), causing Axios interceptors to mishandle the response. | 1 | 2 | 2 | Monitor |
| R-010 | BUS | Required field validation: frontend Zod schema validates on submit but inline error messages do not appear if the error rendering path is incorrect (e.g., wrong `name` prop on field). | 2 | 1 | 2 | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)              ▌▌▌▌▌▌           4 tests
  API Integration (xUnit)       ▌▌▌▌▌▌▌▌▌▌▌▌▌  13 tests
  Component (Vitest + RTL)      ▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 16 tests
  Unit (Vitest / xUnit)         ▌▌▌▌▌▌▌▌        8 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                           41 tests
```

### Rationale

- **API Integration tests dominate** because the five CRUD endpoints carry the highest risk surface: duplicate NIT detection, 409 response format, 204 on delete, FluentValidation error shapes, and the SET NULL constraint on contact orphaning are all backend concerns that cannot be verified at the component level.
- **Component tests are high** because Epic 2 is UI-heavy: real-time search, sort state, form validation rendering, toast visibility, and confirmation dialog behavior all live in React components and are best covered by Vitest + RTL (fast, stable, no browser required).
- **E2E tests are focused** (4 tests only) on the critical user journeys that span the full stack: create a client and see it in the list, delete a client with the confirmation flow, and deep-link navigation. These are the scenarios where backend + frontend integration matters most.
- **Unit tests** cover mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`), Zod schema validation edge cases, and backend FluentValidation validators — fast and isolated.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: GET /api/v1/clientes Returns Empty Array When No Records Exist

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirements:** FR2, AC-E2.1
**Risk covered:** —

**Precondition:** Test database is empty (no `clientes` rows).

**Test Steps:**
1. Send `GET /api/v1/clientes` with `WebApplicationFactory<Program>`.
2. Assert response.

**Expected Result:**
- HTTP 200.
- Response body is a JSON array `[]`.
- `Content-Type: application/json`.

**Automation:** xUnit + `WebApplicationFactory` + TestContainers (Postgres).

---

#### TC-E2-P0-02: POST /api/v1/clientes Creates a Client and Returns 201

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirements:** FR1, AC-E2.1
**Risk covered:** R-005

**Precondition:** Clean test database.

**Test Steps:**
1. Send `POST /api/v1/clientes` with body:
   ```json
   { "nombre": "Empresa ABC", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }
   ```
2. Assert response.
3. Send `GET /api/v1/clientes` and assert the new client appears.

**Expected Result:**
- HTTP 201 Created.
- Response body contains the created client with a valid UUID `id` and all submitted fields.
- Subsequent `GET /api/v1/clientes` returns array with 1 item matching the created client.

**Automation:** xUnit + `WebApplicationFactory`.

---

#### TC-E2-P0-03: POST /api/v1/clientes with Missing Required Fields Returns 400 with FluentValidation Errors

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirements:** FR8, AC-E2.4, NFR6
**Risk covered:** R-010

**Test Steps:**
1. Send `POST /api/v1/clientes` with body `{}` (all fields missing).
2. Assert response.

**Expected Result:**
- HTTP 400.
- `Content-Type: application/problem+json`.
- Response body is Problem Details RFC 7807 format with `errors` object containing entries for `Nombre`, `Nit`, `Telefono`, `Ciudad`.
- Response body does NOT contain `stackTrace` or raw exception text.

**Automation:** xUnit + `WebApplicationFactory`.

---

#### TC-E2-P0-04: POST /api/v1/clientes with Duplicate NIT Returns 409

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirements:** AC-E2 (duplicate NIT), NFR6
**Risk covered:** R-002

**Precondition:** A client with `nit: "900123456-1"` already exists.

**Test Steps:**
1. Send `POST /api/v1/clientes` with `"nit": "900123456-1"` (same NIT as existing client).
2. Assert response.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Response body is Problem Details format.
- `detail` field contains a human-readable message (not a stack trace or SQL error).

**Automation:** xUnit + `WebApplicationFactory`.

---

#### TC-E2-P0-05: DELETE /api/v1/clientes/{id} Removes Client and Orphans Contacts

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirements:** FR7, AC-E2.5, Story 2.5 AC (contacts become unassigned)
**Risk covered:** R-001

**Precondition:** A client with id `client-uuid` exists. Two contacts exist with `clienteId = client-uuid`.

**Test Steps:**
1. Send `DELETE /api/v1/clientes/{client-uuid}`.
2. Assert response status.
3. Send `GET /api/v1/clientes/{client-uuid}` and assert 404.
4. Send `GET /api/v1/contactos` and assert both contacts still exist with `clienteId: null`.

**Expected Result:**
- Step 1: HTTP 204 No Content.
- Step 3: HTTP 404.
- Step 4: Both contacts are present in the list with `clienteId: null` (not deleted).

**Automation:** xUnit + `WebApplicationFactory` + TestContainers.

---

#### TC-E2-P0-06: Frontend — Client List Filters in Real Time Without API Call

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirements:** FR3, FR4, NFR1, AC-E2.2
**Risk covered:** R-003

**Precondition:** MSW mock returns 500 clients seeded in the response. `useClientes` hook resolves with the full array.

**Test Steps:**
1. Render `ClienteListView` with MSW returning 500 clients.
2. Wait for list to render.
3. Type `"empresa"` into the search input.
4. Assert filtered list contains only clients whose `nombre` or `nit` includes `"empresa"`.
5. Assert no additional network requests were made after typing (MSW request spy has no new calls).

**Expected Result:**
- List filters without additional fetches.
- Matching clients appear; non-matching ones disappear.
- Filter completes within the render cycle (no setTimeout or debounce delay causing failure at reasonable assertion timing).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-07: Frontend — Create Client Success Shows Toast and Client Appears in List

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirements:** FR1, FR27, AC-E2.1
**Risk covered:** R-005

**Precondition:** App running (frontend + backend). Database is clean.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente".
3. Fill in: Nombre = "Empresa Test", NIT/RUC = "800999111-2", Teléfono = "3109876543", Ciudad = "Medellín".
4. Click submit.
5. Assert toast message.
6. Assert new client appears in the left panel list.

**Expected Result:**
- Toast "Cliente creado correctamente" appears.
- "Empresa Test" is visible in the client list without a page reload.

**Automation:** Playwright E2E.

---

#### TC-E2-P0-08: Frontend — Required Field Validation Prevents Submission

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirements:** FR8, AC-E2.4
**Risk covered:** R-010

**Test Steps:**
1. Render `ClienteForm` (create mode).
2. Leave all fields empty.
3. Click the submit button.
4. Assert inline error messages appear.
5. Assert no API call was made (MSW spy has zero POST requests).

**Expected Result:**
- Inline error messages appear on Nombre, NIT/RUC, Teléfono, Ciudad fields.
- Form is not submitted (no network request made).

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story Is Closed as Done

#### TC-E2-P1-01: GET /api/v1/clientes/{id} Returns Client Details

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirements:** FR5, AC-E2 (detail view)

**Precondition:** A client with known UUID exists in the database.

**Test Steps:**
1. Send `GET /api/v1/clientes/{id}`.

**Expected Result:**
- HTTP 200.
- Response body contains all fields: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

**Automation:** xUnit + `WebApplicationFactory`.

---

#### TC-E2-P1-02: GET /api/v1/clientes/{id} Returns 404 for Unknown UUID

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirements:** AC (not-found message displayed gracefully)
**Risk covered:** R-007

**Test Steps:**
1. Send `GET /api/v1/clientes/00000000-0000-0000-0000-000000000000` (non-existent UUID).

**Expected Result:**
- HTTP 404.
- Problem Details RFC 7807 body (no stack trace).

**Automation:** xUnit + `WebApplicationFactory`.

---

#### TC-E2-P1-03: PUT /api/v1/clientes/{id} Updates Client

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirements:** FR6, AC-E2.3

**Precondition:** Client with known UUID exists.

**Test Steps:**
1. Send `PUT /api/v1/clientes/{id}` with updated `nombre` = "Nombre Actualizado".
2. Send `GET /api/v1/clientes/{id}`.

**Expected Result:**
- PUT returns HTTP 200 with updated object.
- GET returns client with `nombre = "Nombre Actualizado"`.

**Automation:** xUnit + `WebApplicationFactory`.

---

#### TC-E2-P1-04: PUT /api/v1/clientes/{id} with Missing Required Fields Returns 400

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirements:** FR8, AC-E2.4

**Test Steps:**
1. Send `PUT /api/v1/clientes/{id}` with empty body `{}`.

**Expected Result:**
- HTTP 400. Problem Details with field-level errors.

**Automation:** xUnit + `WebApplicationFactory`.

---

#### TC-E2-P1-05: Frontend — Client List Shows EmptyState When No Clients Exist

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirements:** AC-E2 (EmptyState component)

**Precondition:** MSW mock returns `[]` for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for loading to resolve.
3. Assert EmptyState component is rendered.

**Expected Result:**
- EmptyState component is visible with guidance text for creating the first client.
- No client list items are rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-06: Frontend — ErrorPanel Shown When API Fetch Fails

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirements:** AC (ErrorPanel with "Reintentar" button when backend unavailable)

**Precondition:** MSW mock returns a network error for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView` with MSW configured to reject the request.
2. Assert error state.
3. Assert "Reintentar" button is present.

**Expected Result:**
- ErrorPanel component is rendered (not a blank screen or JS crash).
- "Reintentar" button is visible and clickable.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: Frontend — Clicking a Client Item Updates URL to /clientes/:clienteId

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirements:** FR30, AC (URL updates to `/clientes/:clienteId`)

**Test Steps:**
1. Render app with router at `/clientes`. MSW returns one client with `id = "abc-123"`.
2. Click the client list item for "abc-123".
3. Assert URL.

**Expected Result:**
- URL updates to `/clientes/abc-123`.
- Right panel renders client detail for that client.

**Automation:** Vitest + RTL + TanStack Router test utilities.

---

#### TC-E2-P1-08: Frontend — Direct URL /clientes/:clienteId Loads Correct Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirements:** FR30, AC (deep linking)
**Risk covered:** R-007

**Precondition:** A client with known UUID exists in the database. App running.

**Test Steps:**
1. Navigate directly to `/clientes/{known-uuid}` in the browser (no prior navigation).
2. Assert right panel content.

**Expected Result:**
- Client details (Nombre, NIT/RUC, Teléfono, Ciudad) are displayed.
- No redirect to root or blank screen.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-09: Frontend — Non-Existent clienteId in URL Shows Not-Found Message

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirements:** AC (graceful not-found for invalid clienteId)
**Risk covered:** R-007

**Test Steps:**
1. Navigate directly to `/clientes/non-existent-uuid`.
2. Assert rendered content.

**Expected Result:**
- A not-found message is displayed gracefully.
- No JS error or blank screen.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-10: Frontend — Edit Form Opens Pre-Filled with Current Values

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirements:** FR6, AC-E2.3 (form pre-filled with current values)

**Precondition:** MSW returns a client `{ id: "abc", nombre: "Original Name", nit: "123", telefono: "300", ciudad: "Cali" }`.

**Test Steps:**
1. Render `ClienteDetailView` showing the client.
2. Click "Editar".
3. Assert form fields.

**Expected Result:**
- All four form fields (Nombre, NIT/RUC, Teléfono, Ciudad) contain the existing client's values.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Frontend — Cancel Discards Changes

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirements:** AC-E2 (cancel without saving keeps original data)
**Risk covered:** R-006

**Test Steps:**
1. Render `ClienteDetailView` showing a client.
2. Click "Editar", change `nombre` to "Changed Name".
3. Click "Cancelar".
4. Assert displayed detail still shows original name.

**Expected Result:**
- Original client name is displayed in the detail view.
- No API call was made.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Frontend — Delete Confirmation Dialog Appears and Can Be Cancelled

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirements:** AC-E2.5 (confirmation dialog; cancel keeps record unchanged)
**Risk covered:** R-006

**Test Steps:**
1. Render `ClienteDetailView` showing a client.
2. Click "Eliminar".
3. Assert confirmation dialog is visible with "¿Eliminar este cliente?" text and "Confirmar" + "Cancelar" buttons.
4. Click "Cancelar".
5. Assert client is still displayed and no DELETE request was made.

**Expected Result:**
- Dialog appears with correct text and both buttons.
- After Cancel, no API call is made and client detail remains visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Frontend — Delete Success Removes Client from List and Shows Correct Toast

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirements:** FR7, FR27, AC-E2.5
**Risk covered:** R-001, R-005

**Precondition:** A client exists. App running.

**Test Steps:**
1. Navigate to `/clientes/{known-uuid}`.
2. Click "Eliminar".
3. Click "Confirmar" in the dialog.
4. Assert toast message.
5. Assert client no longer appears in the left panel list.
6. Assert right panel returns to default/empty state.

**Expected Result:**
- Toast "Cliente eliminado correctamente" appears (if no contacts) OR "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (if contacts existed).
- Client is removed from list without page reload.
- Right panel shows empty/default state.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-14: Frontend — Sort Preserved When Search Filter Is Active

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** AC-E2.6, Story 2.6 AC (sort applied to filtered result set without clearing search)
**Risk covered:** R-004

**Test Steps:**
1. Render `ClienteListView` with MSW returning 5 clients (mix of names and dates).
2. Type "empresa" in the search input.
3. Select "Nombre A→Z" from SortControl.
4. Assert.

**Expected Result:**
- Search input still contains "empresa".
- Displayed list is filtered (only matching clients) AND sorted alphabetically A→Z.
- No new API call is triggered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Frontend — Default Sort Is "Más reciente" on Initial Load

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** Story 2.6 AC (default sort order = "Más reciente")
**Risk covered:** R-008

**Precondition:** MSW returns 3 clients with distinct `createdAt` dates.

**Test Steps:**
1. Render `ClienteListView` with no prior sort preference.
2. Assert order of the first rendered client.

**Expected Result:**
- SortControl displays "Más reciente" as the selected option.
- Client list is ordered by `createdAt` descending (newest first).

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Unit — useCreateCliente Mutation Calls invalidateQueries on Success

**Level:** Unit (Vitest)
**Story:** 2.3
**Requirements:** FR27
**Risk covered:** R-005

**Test Steps:**
1. Set up TanStack Query `QueryClient` spy.
2. Call `useCreateCliente` mutation with valid data.
3. Assert `invalidateQueries({ queryKey: ['clientes'] })` was called on success.

**Expected Result:**
- `invalidateQueries` called once with `['clientes']` key after successful POST.

**Automation:** Vitest + `renderHook` + MSW.

---

#### TC-E2-P2-02: Unit — useUpdateCliente Mutation Calls invalidateQueries on Success

**Level:** Unit (Vitest)
**Story:** 2.4
**Requirements:** FR27
**Risk covered:** R-005

**Test Steps:**
1. Call `useUpdateCliente` mutation with valid update payload.
2. Assert `invalidateQueries` called for both `['clientes']` and `['clientes', id]`.

**Expected Result:**
- Both query keys are invalidated on success.

**Automation:** Vitest + `renderHook` + MSW.

---

#### TC-E2-P2-03: Unit — useDeleteCliente Mutation Calls invalidateQueries on Success

**Level:** Unit (Vitest)
**Story:** 2.5
**Requirements:** FR27
**Risk covered:** R-005

**Test Steps:**
1. Call `useDeleteCliente` mutation with a valid client UUID.
2. Assert `invalidateQueries` called for `['clientes']`.

**Expected Result:**
- `['clientes']` query is invalidated on successful DELETE.

**Automation:** Vitest + `renderHook` + MSW.

---

#### TC-E2-P2-04: Unit — clienteSchema Rejects Empty Required Fields

**Level:** Unit (Vitest)
**Story:** 2.3 / 2.4
**Requirements:** FR8

**Test Steps:**
1. Import `clienteSchema` (Zod).
2. Call `clienteSchema.safeParse({})`.
3. Assert validation result.

**Expected Result:**
- `success: false`.
- `error.issues` contains errors for `nombre`, `nit`, `telefono`, `ciudad`.

**Automation:** Vitest.

---

#### TC-E2-P2-05: Unit — CreateClienteRequestValidator Rejects Empty Fields (Backend)

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirements:** FR8

**Test Steps:**
1. Instantiate `CreateClienteRequestValidator`.
2. Validate an empty `CreateClienteRequest`.
3. Assert validation result.

**Expected Result:**
- Validation fails with errors for all required fields.
- Error messages are human-readable (not code/internal identifiers).

**Automation:** xUnit.

---

#### TC-E2-P2-06: Frontend — 409 Duplicate NIT Error Message Displayed Correctly

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirements:** AC (NIT duplicate handling), NFR6
**Risk covered:** R-002

**Precondition:** MSW mock returns 409 with Problem Details body for the POST endpoint.

**Test Steps:**
1. Render `ClienteForm` (create mode).
2. Fill all required fields with a NIT that triggers the mock 409.
3. Submit the form.
4. Assert error display.

**Expected Result:**
- Error message "El NIT/RUC ya está registrado" is displayed.
- No raw HTTP error, status code, or stack trace is shown to the user.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-07: Frontend — Sort Nombre A→Z Reorders List Without API Call

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** AC-E2.6

**Precondition:** MSW returns clients ["Zeta Corp", "Alpha Inc", "Micro SA"]. All are in the cache.

**Test Steps:**
1. Render `ClienteListView`.
2. Select "Nombre A→Z" from SortControl.
3. Assert rendered order.
4. Assert no additional API call was made.

**Expected Result:**
- List renders: "Alpha Inc", "Micro SA", "Zeta Corp".
- MSW request count remains at 1 (initial load only).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-08: Frontend — Sort Nombre Z→A Reorders List Without API Call

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** AC-E2.6

**Test Steps:**
1. Render `ClienteListView` (same setup as TC-E2-P2-07).
2. Select "Nombre Z→A" from SortControl.
3. Assert rendered order.

**Expected Result:**
- List renders: "Zeta Corp", "Micro SA", "Alpha Inc".
- No new API call.

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / On-Demand

#### TC-E2-P3-01: Performance — Client-Side Filter Completes in < 50ms with 500 Records

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirements:** NFR1 (< 1s with 500 records)

**Test Steps:**
1. Render `ClienteListView` with 500 clients in MSW response.
2. Measure time between search input change and re-render with filtered results.

**Expected Result:**
- Filtering completes in under 50ms (well within NFR1's 1s threshold).

**Automation:** Vitest performance test.

---

#### TC-E2-P3-02: API — Concurrent Clients List Requests Are Handled Without Error

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirements:** NFR3 (10 simultaneous users)

**Test Steps:**
1. Send 10 concurrent `GET /api/v1/clientes` requests.
2. Assert all responses.

**Expected Result:**
- All 10 requests return HTTP 200 within 2 seconds.
- No errors or timeouts.

**Automation:** xUnit with parallel `HttpClient` tasks.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client; appears in list immediately | 2.1, 2.3 | TC-E2-P0-02, TC-E2-P0-07 | Covered |
| AC-E2.2: Search by name or NIT/RUC in < 1 second | 2.1 | TC-E2-P0-06, TC-E2-P3-01 | Covered |
| AC-E2.3: View full detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-01, TC-E2-P1-03, TC-E2-P1-10 | Covered |
| AC-E2.4: Prevent save with empty required fields, show inline errors | 2.3, 2.4 | TC-E2-P0-03, TC-E2-P0-08, TC-E2-P1-04, TC-E2-P2-04, TC-E2-P2-05 | Covered |
| AC-E2.5: Delete client; removed from list immediately | 2.5 | TC-E2-P0-05, TC-E2-P1-12, TC-E2-P1-13 | Covered |
| AC-E2.6: Sort by 4 criteria; sort + search coexist | 2.6 | TC-E2-P1-14, TC-E2-P1-15, TC-E2-P2-07, TC-E2-P2-08 | Covered |

### Story-Level AC Coverage

| Story | AC | Test Cases |
|-------|----|------------|
| 2.1 | Client list loads; search filters real-time | TC-E2-P0-06, TC-E2-P1-05, TC-E2-P1-06 |
| 2.1 | EmptyState when no clients | TC-E2-P1-05 |
| 2.1 | ErrorPanel + Reintentar on fetch failure | TC-E2-P1-06 |
| 2.2 | Detail panel on click + URL update | TC-E2-P1-07 |
| 2.2 | Deep link to `/clientes/:id` | TC-E2-P1-08 |
| 2.2 | Not-found for invalid UUID in URL | TC-E2-P1-09 |
| 2.3 | Create success: toast + list update | TC-E2-P0-07 |
| 2.3 | Validation blocks submission | TC-E2-P0-08 |
| 2.3 | Duplicate NIT → error message | TC-E2-P0-04, TC-E2-P2-06 |
| 2.4 | Edit form pre-filled | TC-E2-P1-10 |
| 2.4 | Edit save: changes reflected | TC-E2-P1-03, TC-E2-P1-13 |
| 2.4 | Cancel discards changes | TC-E2-P1-11 |
| 2.5 | Confirmation dialog appears | TC-E2-P1-12 |
| 2.5 | Cancel in dialog keeps record | TC-E2-P1-12 |
| 2.5 | Delete confirmed: removed from list | TC-E2-P1-13 |
| 2.5 | Contacts become unassigned after client delete | TC-E2-P0-05 |
| 2.6 | Sort A→Z, Z→A | TC-E2-P2-07, TC-E2-P2-08 |
| 2.6 | Sort "Más reciente" / "Más antiguo" | TC-E2-P1-15 |
| 2.6 | Sort + active search coexist | TC-E2-P1-14 |
| 2.6 | Default sort = "Más reciente" | TC-E2-P1-15 |
| 2.6 | No API call on sort | TC-E2-P2-07, TC-E2-P2-08 |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search results in < 1s with 500 records | TC-E2-P0-06, TC-E2-P3-01 | Component / Performance |
| NFR2 | CRUD changes reflected in UI in < 2s | TC-E2-P0-07, TC-E2-P1-13 | E2E (observable) |
| NFR3 | 10 simultaneous users without degradation | TC-E2-P3-02 | API Integration |
| NFR5 | Input validation and sanitization | TC-E2-P0-03, TC-E2-P2-04, TC-E2-P2-05 | API + Unit |
| NFR6 | No stack traces or internal errors to user | TC-E2-P0-03, TC-E2-P0-04, TC-E2-P2-06 | API + Component |

---

## 7. Test Execution Order

```
Phase 1 — Backend API Gate (P0, no frontend needed)
  1. TC-E2-P0-01  GET /clientes returns []
  2. TC-E2-P0-02  POST /clientes creates + 201
  3. TC-E2-P0-03  POST /clientes missing fields → 400 Problem Details
  4. TC-E2-P0-04  POST /clientes duplicate NIT → 409

Phase 2 — Critical Data Integrity Gate (P0, requires contacts setup)
  5. TC-E2-P0-05  DELETE /clientes/{id} orphans contacts (SET NULL verification)

Phase 3 — Frontend Component Gate (P0)
  6. TC-E2-P0-06  Real-time search without extra API call
  7. TC-E2-P0-08  Required field validation prevents submission

Phase 4 — Full-Stack E2E Gate (P0)
  8. TC-E2-P0-07  Create client E2E: toast + list update

Phase 5 — Backend P1 API Tests
  9. TC-E2-P1-01  GET /clientes/{id} returns client
 10. TC-E2-P1-02  GET /clientes/{id} → 404 for unknown UUID
 11. TC-E2-P1-03  PUT /clientes/{id} updates client
 12. TC-E2-P1-04  PUT /clientes/{id} missing fields → 400

Phase 6 — Frontend Component P1 Tests
 13. TC-E2-P1-05  EmptyState when no clients
 14. TC-E2-P1-06  ErrorPanel on fetch failure
 15. TC-E2-P1-07  Click client → URL updates to /clientes/:id
 16. TC-E2-P1-10  Edit form pre-filled with current values
 17. TC-E2-P1-11  Cancel discards changes
 18. TC-E2-P1-12  Delete confirmation dialog + cancel
 19. TC-E2-P1-14  Sort + search filter coexist
 20. TC-E2-P1-15  Default sort = "Más reciente"

Phase 7 — E2E P1 Tests
 21. TC-E2-P1-08  Deep link /clientes/:id
 22. TC-E2-P1-09  Non-existent clienteId shows not-found
 23. TC-E2-P1-13  Delete E2E: toast + removed from list

Phase 8 — Unit & Component P2 Tests
 24. TC-E2-P2-01  useCreateCliente invalidates query
 25. TC-E2-P2-02  useUpdateCliente invalidates query
 26. TC-E2-P2-03  useDeleteCliente invalidates query
 27. TC-E2-P2-04  clienteSchema rejects empty fields
 28. TC-E2-P2-05  CreateClienteRequestValidator backend
 29. TC-E2-P2-06  409 duplicate NIT error message in UI
 30. TC-E2-P2-07  Sort Nombre A→Z
 31. TC-E2-P2-08  Sort Nombre Z→A

Phase 9 — Performance & Concurrency (P3, on-demand)
 32. TC-E2-P3-01  Filter < 50ms with 500 records
 33. TC-E2-P3-02  10 concurrent GET /clientes
```

---

## 8. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 8 | 2.0 | 16.0 | Critical paths, data integrity, E2E setup |
| P1 | 15 | 1.0 | 15.0 | Standard coverage — API, component, E2E |
| P2 | 8 | 0.5 | 4.0 | Unit hooks, Zod schema, sort verification |
| P3 | 2 | 0.5 | 1.0 | Performance and concurrency (optional) |
| **Total** | **33** | — | **36.0 hours** | **~4.5 days** |

### Prerequisites

**Test Data:**
- `ClienteFactory` (Faker-based): generates valid `{ nombre, nit, telefono, ciudad }` with unique NIT per test.
- `ContactoFactory`: generates contacts with optional `clienteId` for testing delete + orphan behavior.
- Seed helpers for 500-client scenarios (NFR1 / performance tests).

**Tooling:**

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW 2+ | API mocking for component tests | Frontend |
| Playwright 1.40+ | E2E tests (full-stack journeys) | Frontend/E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |

**Environment:**
- Node.js 20+, npm — frontend build/test
- .NET 10 SDK — backend build/test
- PostgreSQL 18+ on port 5432 with a clean test database
- Frontend dev server (Vite 5173) + backend (5000) running for E2E tests

---

## 9. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — 8 tests must all pass before any story can be accepted)
- **P1 pass rate**: ≥95% (waivers require documented justification)
- **P2/P3 pass rate**: ≥90% (informational — may be deferred with justification)
- **High-risk mitigations** (R-001, R-002, R-003): 100% complete before Epic 2 closure

### Coverage Targets

- **Critical paths** (CRUD + search): ≥80% covered by automated tests
- **Security / NFR6 scenarios** (no stack traces): 100%
- **Business logic** (validation, duplicate NIT, orphan contacts): ≥70%
- **Edge cases** (404, empty state, error panel): ≥50%

### Non-Negotiable Requirements

- [ ] All 8 P0 tests pass (TC-E2-P0-01 through TC-E2-P0-08)
- [ ] R-001 (contacts SET NULL on delete) verified by TC-E2-P0-05
- [ ] R-002 (duplicate NIT 409 handling) verified by TC-E2-P0-04 + TC-E2-P2-06
- [ ] R-003 (real-time search < 1s) verified by TC-E2-P0-06
- [ ] No high-risk items (score ≥6) unmitigated

---

## 10. Mitigation Plans

### R-001: Contacts Orphaned on Client Delete (Score: 9)

**Mitigation Strategy:** Verify that `ContactoConfiguration.cs` configures the FK relationship with `.OnDelete(DeleteBehavior.SetNull)`. TC-E2-P0-05 creates a client and two contacts, deletes the client, then asserts contacts still exist with `clienteId = null`. This is a mandatory P0 test.

**Owner:** DEV (configuration) / QA (test execution)
**Timeline:** Sprint 2, before Story 2.5 implementation begins
**Status:** Planned
**Verification:** TC-E2-P0-05 passes green

---

### R-002: Duplicate NIT 409 Error Message (Score: 6)

**Mitigation Strategy:** Backend must: (1) add a unique index `uk_clientes_nit` on the `nit` column, (2) catch the `DbUpdateException` (unique constraint violation) in `ExceptionHandlingMiddleware` or `CreateClienteCommandHandler` and return a 409 with a human-readable Problem Details body. Frontend must map the 409 response to display "El NIT/RUC ya está registrado". Verified by TC-E2-P0-04 (backend) and TC-E2-P2-06 (frontend).

**Owner:** DEV (backend + frontend) / QA (test)
**Timeline:** Sprint 2, during Story 2.3 implementation
**Status:** Planned
**Verification:** TC-E2-P0-04 and TC-E2-P2-06 pass green

---

### R-003: Real-Time Search Performance (Score: 6)

**Mitigation Strategy:** Client-side filtering must use `useMemo` over the TanStack Query cache (not a new `useQuery` on every keystroke). The `queryKey: ['clientes']` must be pre-loaded on route mount so the filter runs over an in-memory array. Verified by TC-E2-P0-06 (asserts no extra API calls during typing) and TC-E2-P3-01 (measures 50ms threshold with 500 records).

**Owner:** DEV (implementation) / QA (test)
**Timeline:** Sprint 2, during Story 2.1 implementation
**Status:** Planned
**Verification:** TC-E2-P0-06 passes green (no extra network calls)

---

## 11. Assumptions and Dependencies

### Assumptions

1. Epic 1 (Foundation) is complete: frontend dev server, backend API, and PostgreSQL are all operational. The `clientes` and `contactos` domain tables exist (created in this epic).
2. The `siesa-ui-kit` `ContactManager` and `EmptyState` components are available and render correctly in the test environment. For component tests using RTL, these components are either real (if the kit is installed) or mocked at the module boundary.
3. MSW 2+ is configured as the API mocking layer for all Vitest component tests. No real backend calls occur during unit/component tests.
4. Playwright tests require both the frontend dev server and backend to be running (or use a dedicated test environment).
5. `SortControl` component lives at `src/shared/components/SortControl` as specified in the epic technical context.

### Dependencies

1. `ContactoConfiguration.cs` with `OnDelete(DeleteBehavior.SetNull)` — required before TC-E2-P0-05 can be implemented. Required by Sprint 2 start.
2. `uk_clientes_nit` unique index on the `clientes` table — required for TC-E2-P0-04. Required by Sprint 2, Story 2.3.
3. `ClienteFactory` test helper — required by all API integration tests that need seeded data. Required before Story 2.1 integration tests.

### Risks to Plan

- **Risk**: siesa-ui-kit `EmptyState` component not available in RTL test environment (missing peer dependencies).
  - **Impact**: TC-E2-P1-05 cannot assert on the component directly.
  - **Contingency**: Assert on the visible text content or a `data-testid` attribute instead of the component class.

- **Risk**: Playwright tests are brittle due to toast timing (toast auto-dismisses in 3s).
  - **Impact**: E2E toast assertion may flicker in slow CI environments.
  - **Contingency**: Assert toast immediately after action; set Playwright `timeout` to 5s for toast assertions. Use `waitForSelector` with the toast text.

---

## 12. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All 8 P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-08)
- [ ] All 15 P1 test cases pass or formally deferred with documented reason
- [ ] R-001 (contacts orphaned with SET NULL) verified — zero data loss
- [ ] R-002 (duplicate NIT 409 surfaced correctly to user) verified
- [ ] R-003 (no extra API calls during search filtering) verified
- [ ] `ClienteFactory` test helper exists and is used by integration tests
- [ ] No P0/P1 test is skipped without a documented reason
- [ ] Backend endpoints (`GET`, `POST`, `PUT`, `DELETE /api/v1/clientes`) all covered by at least one API integration test

---

## 13. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. `ContactoConfiguration.cs` MUST use `.OnDelete(DeleteBehavior.SetNull)` — not `Cascade` or `Restrict`. This is the only way TC-E2-P0-05 can pass.
2. The unique index on `nit` (`uk_clientes_nit`) must exist in the EF Core configuration OR migration — required for 409 detection.
3. The `ExceptionHandlingMiddleware` (already from Epic 1) must handle `DbUpdateException` with unique constraint violation and return 409 with a human-readable `detail` message.
4. `ClienteListView` must load all clients into TanStack Query cache on mount (`queryKey: ['clientes']`) and filter client-side with `useMemo` — no search endpoint call on every keystroke.
5. `ClienteForm` must use `react-hook-form` with `resolver: zodResolver(clienteSchema)`. All four fields (nombre, nit, telefono, ciudad) must be registered as required in the Zod schema.
6. Mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess` — this is required for FR27 (TC-E2-P0-07, TC-E2-P1-13).
7. `DELETE /api/v1/clientes/{id}` must return `204 No Content` — not `200 OK`.
8. All toast messages must be in Spanish: "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente" (or the contacts variant).
9. `SortControl` at `src/shared/components/SortControl` must use `fecha-desc` as the default value (maps to "Más reciente").
10. URL route for client detail is `/clientes/:clienteId` (matches TanStack Router filename `clientes.$clienteId.tsx`).

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run).
- Run `*automate` for broader coverage once implementation exists.
- Run `*trace` after epic completion to verify traceability matrix.

---

## Appendix

### Related Documents

- Epic Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Feature PRD: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Epic 1 Test Design (reference): `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
