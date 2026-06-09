---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-09"
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

Epic 2 implements the full CRUD cycle for the `clientes` entity: scrollable list with real-time search (name/NIT), detail view with deep-linking, create/edit form with validation (Zod + FluentValidation), delete with confirmation dialog and orphan-contact handling, and client-side sort via SortControl. The epic covers FRs 1–8 and NFR1, NFR2, NFR5, NFR6.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time search < 1s, empty state, error panel + retry, 500-record performance |
| 2.2 | Client Detail View | Detail panel, deep-link URL update, invalid ID graceful not-found |
| 2.3 | Create Client | Form validation (required fields + NIT/RUC uniqueness), 201 success, optimistic list update |
| 2.4 | Edit Client | Pre-fill, mutation 200, cancel no-op, validation on re-submit |
| 2.5 | Delete Client | Confirmation dialog, 204 removal, toast, orphan-contact side-effect message |
| 2.6 | Sort Client List | Client-side sort over 4 options, sort + search interplay, default order, no extra API call |

### Out of Scope for This Epic

- Contact CRUD and association — Epic 3 and 4
- Authentication / authorization — explicitly deferred (MVP)
- Server-side pagination — client-side filter is the NFR1 strategy
- `/contactos` routes — belong to Epic 3

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness constraint** — backend 409 not surfaced correctly (raw error or wrong field highlight) | High | High | P0 | Integration test: POST duplicate NIT → assert 409 + Problem Details `"El NIT/RUC ya está registrado"` without stack trace |
| R2 | **Zod + FluentValidation double-layer gap** — frontend schema allows submission that backend rejects (mismatched required-field definitions) | High | High | P0 | Unit test: Zod schema rejects empty Nombre, NIT, Telefono, Ciudad; Integration test: direct POST with missing fields → 400 Problem Details with `errors{}` |
| R3 | **TanStack Query invalidation missing after mutation** — list not refreshed after create/edit/delete (FR27 violation) | Medium | High | P0 | Component test: create mutation → assert `['clientes']` query refetched and new item visible in list without manual reload |
| R4 | **Delete with associated contacts** — contacts not set to `clienteId = null` (ON DELETE SET NULL) or toast message wrong | Medium | High | P1 | Integration test: DELETE client with contacts → assert contacts still exist with `cliente_id = null`; assert toast message |
| R5 | **Real-time search performance** — client-side filter on 500 records exceeds 1s (NFR1) | Low | High | P1 | Component performance test: load 500 mock clients, measure `useMemo` filter render time < 150ms |
| R6 | **Sort + search interplay** — changing sort order while search is active clears the search input or resets results | Medium | Medium | P1 | Component test: apply search filter → change sort → assert search input unchanged and sorted filtered list is correct |
| R7 | **Deep-link to /clientes/:clienteId** — URL not updated when selecting a client, or direct URL fails to load correct client | Medium | High | P1 | E2E test: navigate directly to `/clientes/:id`, assert correct detail panel; Component test: click list item → assert URL param updated |
| R8 | **SortControl no extra API call** — sort triggers a new `GET /api/v1/clientes` fetch (regression from client-side sort requirement) | Low | Medium | P2 | Component test: spy on `useClientes` queryFn → change sort option 4 times → assert fetch called exactly once (on mount) |
| R9 | **EmptyState not shown** — when clientes list is empty, a blank panel or list component with zero items is rendered instead | Low | Medium | P2 | Component test: render with empty mock data → assert EmptyState component present and guidance message visible |
| R10 | **ErrorPanel + retry** — when initial fetch fails, no retry mechanism offered to the user | Low | Medium | P2 | Component test: mock query error → assert ErrorPanel with "Reintentar" button; click retry → assert refetch triggered |

### Top 3 Risk Areas for Epic 2

1. **NIT/RUC uniqueness + Problem Details surface** (R1) — The 409 conflict is a domain-level error that must be translated into a human-readable Spanish message without exposing backend internals. Both the API contract and the frontend error-handling layer must align perfectly.
2. **Zod/FluentValidation gap** (R2) — If the two validation layers have divergent definitions for required fields, a user can bypass frontend validation and hit a raw 400, or conversely the form never submits valid data. This is the most common source of regression in dual-validated CRUD features.
3. **TanStack Query invalidation post-mutation** (R3) — FR27 mandates immediate visibility of changes for all users. A missing `invalidateQueries(['clientes'])` call is invisible during happy-path development but causes stale data silently, making it a P0 risk.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌▌          3 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌  14 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 15 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌▌▌▌        9 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                        41 tests
```

### Rationale

- **Component tests dominate** because the core business logic of Epic 2 lives in the frontend: real-time search (useMemo), sort state management (useState + SortControl), mutation flows, and UI state transitions (empty/error/loaded states).
- **API integration tests are the second largest group** because the backend handles the critical domain constraints: NIT uniqueness, FluentValidation required-field checking, Problem Details RFC 7807, and the ON DELETE SET NULL cascade for orphan contacts.
- **E2E tests are minimal** (3 tests) and focus exclusively on the scenarios that cannot be reliably verified at component level: deep-link URL handling in a real browser and the full create/delete happy path as a regression guard.
- **Unit tests** cover Zod schema validation, command handler logic (pure functions), and domain entity construction — fast and isolated.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: Backend Returns 409 with Problem Details on Duplicate NIT/RUC

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4 (NIT/RUC already registered), NFR6
**Risk covered:** R1

**Precondition:** `siesa_agents_db` running with `clientes` table. A client with `nit = "900123456-1"` already exists.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body:
   ```json
   { "nombre": "Empresa Duplicada", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }
   ```
2. Inspect response status and body.

**Expected Result:**
- HTTP status: 409 Conflict.
- `Content-Type: application/problem+json`.
- Body contains `"detail"` field with value matching `"El NIT/RUC ya está registrado"` (or equivalent).
- Body does NOT contain `stackTrace`, `exception`, or `innerException`.
- Body does NOT contain the NIT value in a raw SQL error message.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + TestContainers (Postgres).

---

#### TC-E2-P0-02: Backend Returns 400 with Field Errors on Missing Required Fields

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4 (required fields), FR8, NFR5
**Risk covered:** R2

**Precondition:** Backend running. FluentValidation registered for `CreateClienteRequest`.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{}` (all fields missing).
2. POST `/api/v1/clientes` with body `{ "nombre": "Solo Nombre" }` (NIT, Telefono, Ciudad missing).
3. Inspect each response.

**Expected Result:**
- HTTP status: 400 Bad Request for both calls.
- `Content-Type: application/problem+json`.
- Response body contains `"errors"` object listing each missing required field (Nombre, NIT, Telefono, Ciudad).
- No stack trace in response.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-03: Zod Schema Blocks Form Submission with Empty Required Fields

**Level:** Unit
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4 (FR8), NFR5
**Risk covered:** R2

**Precondition:** `clienteSchema.ts` defines Zod object with `nombre`, `nit`, `telefono`, `ciudad` as required non-empty strings.

**Test Steps:**
1. Parse `{}` through `clienteSchema`.
2. Parse `{ nombre: "", nit: "900123456-1", telefono: "3001234567", ciudad: "Bogotá" }` (empty nombre).
3. Parse `{ nombre: "Acme", nit: "", telefono: "3001234567", ciudad: "Bogotá" }` (empty nit).
4. Parse valid complete object.

**Expected Result:**
- Steps 1–3: `safeParse` returns `success: false` with relevant field errors.
- Step 4: `safeParse` returns `success: true` with parsed data.
- No HTTP calls are made (pure Zod schema test).

**Automation:** Vitest unit test.

---

#### TC-E2-P0-04: Create Client — TanStack Query Invalidates ['clientes'] After Mutation

**Level:** Component
**Story:** 2.3
**Requirement:** FR27, AC-E2.1 (client appears in list immediately)
**Risk covered:** R3

**Precondition:** `useCreateCliente` hook wired to `clienteApiRepository.create()`. MSW handler for POST `/api/v1/clientes` returns 201 with new client object.

**Test Steps:**
1. Render `ClienteListView` wrapped in `QueryClientProvider` + `RouterProvider` with MSW active.
2. Pre-populate query cache with `['clientes']` → 2 existing clients.
3. Open the "Nuevo cliente" form and submit valid data.
4. Observe query cache for `['clientes']` key.

**Expected Result:**
- `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is called (spy or observable cache).
- After invalidation, the list re-fetches and shows the new client (3 items total).
- A success toast `"Cliente creado correctamente"` is visible in the DOM.
- No full page reload occurs.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-05: Edit Client — TanStack Query Invalidates ['clientes'] and ['clientes', id] After Mutation

**Level:** Component
**Story:** 2.4
**Requirement:** FR27, AC-E2.3
**Risk covered:** R3

**Precondition:** `useUpdateCliente` hook. MSW handler for PUT `/api/v1/clientes/:id` returns 200 with updated object.

**Test Steps:**
1. Render `ClienteDetailView` for client with id `abc-123`.
2. Click "Editar", modify `ciudad` field from "Bogotá" to "Medellín", submit.
3. Inspect query invalidations and DOM.

**Expected Result:**
- `queryClient.invalidateQueries({ queryKey: ['clientes'] })` triggered.
- `queryClient.invalidateQueries({ queryKey: ['clientes', 'abc-123'] })` triggered.
- Detail panel reflects `ciudad: "Medellín"` without reload.
- Toast `"Cliente actualizado correctamente"` is visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-06: Delete Client — TanStack Query Invalidates ['clientes'] After Mutation

**Level:** Component
**Story:** 2.5
**Requirement:** FR27, AC-E2.5
**Risk covered:** R3

**Precondition:** `useDeleteCliente` hook. MSW handler for DELETE `/api/v1/clientes/:id` returns 204.

**Test Steps:**
1. Render component with client `abc-123` selected.
2. Click "Eliminar", then "Confirmar" in dialog.
3. Inspect query invalidation and DOM.

**Expected Result:**
- `queryClient.invalidateQueries({ queryKey: ['clientes'] })` triggered.
- Right panel returns to empty/default state.
- Toast `"Cliente eliminado correctamente"` is visible.
- Client `abc-123` is no longer in the list.

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: Client List Renders with Nombre and NIT/RUC Visible Per Item

**Level:** Component
**Story:** 2.1
**Requirement:** AC-2.1 (left panel 280px, scrollable list showing Nombre and NIT/RUC)

**Test Steps:**
1. Render `ClienteListView` with MSW returning 3 clients.
2. Query list items.

**Expected Result:**
- 3 list items rendered, each showing `Nombre` and `NIT` values.
- Panel container has a width matching the 280px specification (or CSS class assertable).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Real-Time Search Filters by Nombre

**Level:** Component
**Story:** 2.1
**Requirement:** AC-E2.2, FR3

**Test Steps:**
1. Render `ClienteListView` with 5 clients: `["Acme Corp", "Beta SA", "Acme SAS", "Gamma Ltd", "Delta"]`.
2. Type `"Acme"` in the search input.
3. Assert list content.

**Expected Result:**
- Only `"Acme Corp"` and `"Acme SAS"` are visible.
- No additional API call is made (MSW handler not re-invoked after initial load).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: Real-Time Search Filters by NIT/RUC

**Level:** Component
**Story:** 2.1
**Requirement:** AC-E2.2, FR4

**Test Steps:**
1. Render with 3 clients, one with NIT `"900-1"`, others with different NITs.
2. Type `"900-1"` in the search input.
3. Assert list.

**Expected Result:**
- Only the client with NIT `"900-1"` is visible.
- Search input change does not trigger a new API fetch.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: EmptyState Shown When No Clients Exist

**Level:** Component
**Story:** 2.1
**Requirement:** AC-2.1 (empty state with guidance message)
**Risk covered:** R9

**Test Steps:**
1. Render `ClienteListView` with MSW returning `[]`.
2. Assert DOM.

**Expected Result:**
- `EmptyState` component is present.
- Guidance text directing user to create first client is visible.
- No list item elements are rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: ErrorPanel with Retry Shown When Fetch Fails

**Level:** Component
**Story:** 2.1
**Requirement:** AC-2.1 (error panel with "Reintentar" button)
**Risk covered:** R10

**Test Steps:**
1. Render `ClienteListView` with MSW configured to return 500 for GET `/api/v1/clientes`.
2. Wait for query error state.
3. Assert DOM.
4. Click the "Reintentar" button.

**Expected Result:**
- `ErrorPanel` component with "Reintentar" button is visible.
- Client list is not rendered.
- Clicking "Reintentar" triggers a `refetch()` (assert MSW handler called again).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-06: Client Detail Panel Shows All 4 Fields on Item Click

**Level:** Component
**Story:** 2.2
**Requirement:** AC-2.2 (Nombre, NIT/RUC, Teléfono, Ciudad visible in right panel)

**Test Steps:**
1. Render clients view with a list item for client `{ id: "uuid-1", nombre: "Acme", nit: "900-1", telefono: "3001111111", ciudad: "Bogotá" }`.
2. Click the list item.
3. Inspect right panel.

**Expected Result:**
- Right panel displays `Nombre: "Acme"`, `NIT/RUC: "900-1"`, `Teléfono: "3001111111"`, `Ciudad: "Bogotá"`.
- URL updates to `/clientes/uuid-1` (FR30).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-07: Deep Link — Direct URL /clientes/:clienteId Loads Correct Client

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (FR30 deep linking)
**Risk covered:** R7

**Precondition:** Frontend dev server running. Backend running with at least one client seeded.

**Test Steps:**
1. Obtain `clienteId` of an existing client (from seed or prior POST).
2. Open browser directly to `http://localhost:5173/clientes/{clienteId}`.
3. Wait for page to render.

**Expected Result:**
- Right panel shows the client's details (Nombre, NIT, Teléfono, Ciudad).
- Left panel shows client list with the correct item highlighted/selected.
- No redirect to root or blank page.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-08: Not-Found Message for Invalid clienteId

**Level:** Component
**Story:** 2.2
**Requirement:** AC-2.2 (graceful not-found)

**Test Steps:**
1. Render the route `/clientes/id-que-no-existe` with MSW returning 404 for GET `/api/v1/clientes/id-que-no-existe`.
2. Assert DOM.

**Expected Result:**
- A not-found message is displayed in the right panel (not a JS error, not a blank panel).
- The left panel (client list) is still rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: Create Client — Form Opens on "Nuevo cliente" Click

**Level:** Component
**Story:** 2.3
**Requirement:** AC-2.3 (form fields: Nombre, NIT/RUC, Teléfono, Ciudad — all required per FR1)

**Test Steps:**
1. Render `/clientes` view.
2. Click "Nuevo cliente".
3. Assert form DOM.

**Expected Result:**
- Form is open (visible in DOM).
- Fields `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad` are present and editable.
- Submit button is present.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-10: Create Client — Inline Errors on Empty Required Fields (Frontend Only)

**Level:** Component
**Story:** 2.3
**Requirement:** AC-E2.4, FR8

**Test Steps:**
1. Open create form.
2. Click submit without filling any field.
3. Assert DOM error state.

**Expected Result:**
- Inline error messages appear on all 4 empty fields.
- No POST request is sent to the backend (MSW handler not invoked).
- Form remains open.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Edit Client — Form Opens Pre-Filled With Current Values

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4, FR6

**Test Steps:**
1. Render `ClienteDetailView` for client `{ nombre: "Acme", nit: "900-1", telefono: "3001111111", ciudad: "Bogotá" }`.
2. Click "Editar".
3. Assert form field values.

**Expected Result:**
- `Nombre` input value is `"Acme"`.
- `NIT/RUC` input value is `"900-1"`.
- `Teléfono` input value is `"3001111111"`.
- `Ciudad` input value is `"Bogotá"`.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Edit Client — Cancel Preserves Original Data

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4 (cancel no-op)

**Test Steps:**
1. Open edit form for a client.
2. Modify `ciudad` to `"Cali"`.
3. Click "Cancelar".
4. Assert detail view.

**Expected Result:**
- Form closes.
- Detail panel still shows original `ciudad` value (e.g., `"Bogotá"`).
- No PUT request was sent (MSW handler not invoked).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Delete Client — Confirmation Dialog Appears Before Deletion

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 (confirmation dialog with "Confirmar" and "Cancelar")

**Test Steps:**
1. Render `ClienteDetailView` for a client.
2. Click "Eliminar".
3. Assert dialog DOM.

**Expected Result:**
- Confirmation dialog is visible with text `"¿Eliminar este cliente?"`.
- Two buttons present: `"Confirmar"` and `"Cancelar"`.
- No DELETE request sent yet (MSW handler not invoked).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: Delete Client — Cancel Keeps Client Unchanged

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 (cancel in dialog)

**Test Steps:**
1. Open confirmation dialog for client `abc-123`.
2. Click "Cancelar".
3. Assert DOM and query cache.

**Expected Result:**
- Dialog closes.
- Client `abc-123` remains in the list.
- Right panel still shows client details.
- No DELETE request sent.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Delete Client — Contacts Set to Null and Toast Shows Orphan Message

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 (orphan contacts handling, FR23)
**Risk covered:** R4

**Precondition:** Client `client-uuid` exists in DB with 2 associated contacts (`cliente_id = client-uuid`).

**Test Steps:**
1. DELETE `/api/v1/clientes/client-uuid`.
2. GET `/api/v1/contactos?sinCliente=true` (or direct DB query).
3. Assert contact records.

**Expected Result:**
- HTTP 204 from DELETE.
- Both previously associated contacts still exist in the database.
- `cliente_id` for both contacts is `NULL`.
- Contacts appear in "Sin cliente" query result.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + TestContainers (Postgres).

---

#### TC-E2-P1-16: Delete Client With Contacts — Frontend Toast Shows Orphan Message

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 (toast message when contacts become unassigned)
**Risk covered:** R4

**Precondition:** MSW returns 204 for DELETE. Backend (or mock) signals orphan contacts via response header or pre-agreed behavior.

**Test Steps:**
1. Render `ClienteDetailView` for a client known to have contacts.
2. Confirm deletion.
3. Assert toast message.

**Expected Result:**
- Toast message reads `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` (exact text from AC-2.5).
- Right panel returns to default/empty state.

**Automation:** Vitest + RTL + MSW (MSW simulates the scenario with a flag or separate endpoint contract).

**Note:** Implementation note — the frontend must detect whether any contacts were orphaned and select the correct toast message. This may require the DELETE endpoint to return `{ orphanedContactCount: N }` in the 204 response body or a separate contract agreed during Story 2.5 implementation.

---

#### TC-E2-P1-17: Sort Alphabetical A→Z — No Extra API Call

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6 (sort without new API call), technical context note
**Risk covered:** R8

**Test Steps:**
1. Render `ClienteListView` with 4 clients: `["Zeta", "Alpha", "Omega", "Beta"]`.
2. Assert initial order is "Más reciente" (by `createdAt` descending — default).
3. Select `"Nombre A→Z"` from `SortControl`.
4. Assert list order and MSW call count.

**Expected Result:**
- List order after sort: `["Alpha", "Beta", "Omega", "Zeta"]`.
- MSW handler for GET `/api/v1/clientes` was called exactly once (on mount), not again on sort.
- Search input (if empty) remains empty.

**Automation:** Vitest + RTL + MSW (spy on request handler).

---

#### TC-E2-P1-18: Sort Alphabetical Z→A

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6

**Test Steps:**
1. Render with clients `["Alpha", "Beta", "Omega", "Zeta"]`.
2. Select `"Nombre Z→A"`.
3. Assert list order.

**Expected Result:**
- List order: `["Zeta", "Omega", "Beta", "Alpha"]`.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-19: Sort "Más Reciente" and "Más Antiguo" by createdAt

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6

**Test Steps:**
1. Render with clients having distinct `createdAt` timestamps: oldest=`"2026-01-01"`, newest=`"2026-06-01"`.
2. Select `"Más reciente"` → assert newest first.
3. Select `"Más antiguo"` → assert oldest first.

**Expected Result:**
- `"Más reciente"`: newest `createdAt` appears at top.
- `"Más antiguo"`: oldest `createdAt` appears at top.
- No new API call in either sort change.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-20: Sort Does Not Clear Active Search Filter

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6 (sort preserves active filter)
**Risk covered:** R6

**Test Steps:**
1. Render with 5 clients: 3 named "Acme*", 2 named "Beta*".
2. Type `"Acme"` in search — 3 items visible.
3. Change sort to `"Nombre Z→A"`.
4. Assert search input value and list content.

**Expected Result:**
- Search input still contains `"Acme"`.
- Only the 3 Acme clients are visible (filter not cleared).
- The 3 Acme clients are sorted Z→A.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-21: Default Sort on Page Load is "Más Reciente"

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6 (default sort)

**Test Steps:**
1. Render `ClienteListView` with no prior sort preference (fresh mount).
2. Assert `SortControl` selected value and list order.

**Expected Result:**
- `SortControl` displays `"Más reciente"` as the selected option.
- Client list is ordered by `createdAt` descending.

**Automation:** Vitest + RTL.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Backend GET /api/v1/clientes Returns Array of ClienteDto

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR1, FR2

**Test Steps:**
1. Seed 3 clients in test DB.
2. GET `/api/v1/clientes`.
3. Assert response.

**Expected Result:**
- HTTP 200.
- Body is a JSON array (no wrapper object).
- Each item contains `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 with timezone).
- Array length is 3.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-02: Backend GET /api/v1/clientes/:id Returns 404 for Unknown ID

**Level:** API Integration
**Story:** 2.2
**Requirement:** AC-2.2 (graceful not-found)

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.

**Expected Result:**
- HTTP 404.
- `Content-Type: application/problem+json`.
- Body contains `"status": 404` and `"title"` field.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-03: Backend POST /api/v1/clientes Returns 201 with Created Object

**Level:** API Integration
**Story:** 2.3
**Requirement:** FR1 (create client), architecture pattern (POST → 201 + object)

**Test Steps:**
1. POST `/api/v1/clientes` with valid body `{ "nombre": "Acme", "nit": "900-1", "telefono": "3001111111", "ciudad": "Bogotá" }`.

**Expected Result:**
- HTTP 201 Created.
- Body contains new client with `id` (UUID), all submitted fields, and `createdAt` timestamp.
- `createdAt` is ISO 8601 with timezone offset.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-04: Backend PUT /api/v1/clientes/:id Returns 200 with Updated Object

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR6

**Test Steps:**
1. Seed a client, PUT with updated `ciudad: "Medellín"`.

**Expected Result:**
- HTTP 200.
- Returned body reflects `ciudad: "Medellín"`.
- `updatedAt` timestamp is newer than `createdAt`.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-05: Backend DELETE /api/v1/clientes/:id Returns 204

**Level:** API Integration
**Story:** 2.5
**Requirement:** FR7

**Test Steps:**
1. Seed a client (no contacts), DELETE it.

**Expected Result:**
- HTTP 204 No Content.
- Subsequent GET `/api/v1/clientes/:id` returns 404.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-06: Search Performance — Filter 500 Records in Under 150ms

**Level:** Component (Performance)
**Story:** 2.1
**Requirement:** NFR1 (< 1s with 500 records)
**Risk covered:** R5

**Test Steps:**
1. Generate 500 mock client objects.
2. Render `ClienteListView` with all 500 in TanStack Query cache.
3. Measure time from search input change to filtered list render using `performance.now()`.
4. Type a search term that matches ~50% of clients.

**Expected Result:**
- Filter render time < 150ms (well under NFR1's 1s budget).
- All matching clients are visible after debounce/immediate filter.

**Automation:** Vitest component test with synthetic performance measurement.

---

#### TC-E2-P2-07: SortControl Renders with 4 Options

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6

**Test Steps:**
1. Render `SortControl` component in isolation.
2. Open sort options.

**Expected Result:**
- 4 options present: `"Nombre A→Z"`, `"Nombre Z→A"`, `"Más reciente"`, `"Más antiguo"`.
- Identifiers map to `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-08: Create Client Full E2E Happy Path

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1 (full flow: register client → appears in list)

**Precondition:** Frontend and backend running. Empty or seeded DB.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Fill form: Nombre=`"E2E Corp"`, NIT=`"E2E-001"`, Teléfono=`"3009999999"`, Ciudad=`"Cali"`.
4. Click submit.
5. Assert list and toast.

**Expected Result:**
- Success toast `"Cliente creado correctamente"` appears.
- `"E2E Corp"` appears in the client list without page reload.
- Clicking the new item shows the detail panel with all 4 fields.

**Automation:** Playwright E2E.

---

#### TC-E2-P2-09: Backend — Validators Are Registered for UpdateClienteRequest

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR8 (validation on edit), NFR5

**Test Steps:**
1. PUT `/api/v1/clientes/:id` with body `{ "nombre": "", "nit": "900-1", "telefono": "3001111111", "ciudad": "Bogotá" }` (empty nombre).

**Expected Result:**
- HTTP 400.
- `Content-Type: application/problem+json`.
- `errors.Nombre` (or equivalent field key) present in response body.

**Automation:** xUnit integration test.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: ClienteEntity Unit Tests — Domain Invariants

**Level:** Unit (xUnit)
**Story:** 2.3, 2.4

**Test Steps:**
1. Instantiate `ClienteEntity` with valid values.
2. Attempt construction with null required fields (if domain validation is in entity constructor).

**Expected Result:**
- Valid construction succeeds.
- If domain throws on null: `ArgumentNullException` or domain exception raised.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-02: CreateClienteCommandHandler Unit Tests

**Level:** Unit (xUnit)
**Story:** 2.3

**Test Steps:**
1. Mock `IClienteRepository`.
2. Execute `CreateClienteCommandHandler` with valid command.
3. Assert repository `Add` and `SaveChanges` called.
4. Execute with duplicate NIT mock → assert `DomainException` or equivalent.

**Expected Result:**
- Repository interactions verified.
- Domain exception path covered.

**Automation:** xUnit unit test with Moq/NSubstitute.

---

#### TC-E2-P3-03: DeleteClienteCommandHandler Unit Tests — Orphan Contact Path

**Level:** Unit (xUnit)
**Story:** 2.5
**Risk covered:** R4

**Test Steps:**
1. Mock `IClienteRepository` and `IContactoRepository`.
2. Execute `DeleteClienteCommandHandler` for a client with 2 contacts.
3. Assert contacts' `ClienteId` set to null and `SaveChanges` called.

**Expected Result:**
- Both mock contacts updated with `ClienteId = null`.
- Client record deleted from repository.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-04: useClientes Hook Returns Typed Cliente Array

**Level:** Unit (Vitest)
**Story:** 2.1

**Test Steps:**
1. Render `useClientes()` hook with MSW returning 2 clients.
2. Assert hook data type and shape.

**Expected Result:**
- `data` is `Cliente[]` with `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` fields.
- TypeScript types satisfied (no implicit `any`).

**Automation:** Vitest unit test with MSW.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client → appears in list immediately | 2.3 | TC-E2-P0-04, TC-E2-P2-08 | Covered |
| AC-E2.2: Search by nombre or NIT/RUC < 1 second | 2.1 | TC-E2-P1-02, TC-E2-P1-03, TC-E2-P2-06 | Covered |
| AC-E2.3: View detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-06, TC-E2-P1-11, TC-E2-P0-05 | Covered |
| AC-E2.4: Required field validation with clear error messages | 2.3, 2.4 | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-10, TC-E2-P2-09 | Covered |
| AC-E2.5: Delete client → removed from list | 2.5 | TC-E2-P0-06, TC-E2-P1-13, TC-E2-P1-14, TC-E2-P1-15, TC-E2-P1-16 | Covered |
| AC-E2.6: Sort list by 4 criteria without reload / losing filter | 2.6 | TC-E2-P1-17, TC-E2-P1-18, TC-E2-P1-19, TC-E2-P1-20, TC-E2-P1-21 | Covered |
| AC-2.1: Left panel 280px scrollable list, EmptyState, ErrorPanel+Retry | 2.1 | TC-E2-P1-01, TC-E2-P1-04, TC-E2-P1-05 | Covered |
| AC-2.2: Detail panel on click, URL update, direct URL, not-found | 2.2 | TC-E2-P1-06, TC-E2-P1-07, TC-E2-P1-08 | Covered |
| AC-2.3: Form opens, 201 success, toast | 2.3 | TC-E2-P1-09, TC-E2-P0-04, TC-E2-P2-03 | Covered |
| AC-2.4: Pre-fill, save mutation, inline validation, cancel no-op | 2.4 | TC-E2-P1-11, TC-E2-P1-12, TC-E2-P0-05 | Covered |
| AC-2.5: Confirmation dialog, confirm delete, cancel no-op, orphan toast | 2.5 | TC-E2-P1-13, TC-E2-P1-14, TC-E2-P1-15, TC-E2-P1-16 | Covered |
| AC-2.6: All 4 sort options, default "Más reciente", sort+filter interplay, no extra fetch | 2.6 | TC-E2-P1-17..TC-E2-P1-21, TC-E2-P2-07 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-02, TC-E2-P1-03, TC-E2-P2-06 | Component + Performance |
| NFR2 | CRUD < 2s UI update | TC-E2-P0-04, TC-E2-P0-05, TC-E2-P0-06 (mutation → immediate list update) | Component |
| NFR5 | Input validation / sanitization | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-10, TC-E2-P2-09 | Unit + API Integration |
| NFR6 | No stack traces exposed | TC-E2-P0-01 (409), TC-E2-P0-02 (400), TC-E2-P2-02 (404) | API Integration |
| NFR7 | Core tasks completable without training | TC-E2-P2-08 (E2E happy path) | E2E |
| NFR11 | No hardcoded limits | UUID PKs used in all test data; schema assertions in TC-E2-P2-01 | API Integration |

---

## 7. Test Execution Order

The following execution order minimizes blocked tests:

```
Phase 1 — Backend API Gate (no frontend needed)
  1. TC-E2-P2-01  GET /api/v1/clientes returns array
  2. TC-E2-P2-03  POST returns 201 with object
  3. TC-E2-P2-04  PUT returns 200 updated
  4. TC-E2-P2-05  DELETE returns 204
  5. TC-E2-P2-02  GET unknown ID returns 404

Phase 2 — Backend Validation Gate (P0 API)
  6. TC-E2-P0-01  409 on duplicate NIT
  7. TC-E2-P0-02  400 on missing required fields
  8. TC-E2-P2-09  400 on empty nombre in PUT

Phase 3 — Backend Domain Logic (P1 integration)
  9. TC-E2-P1-15  DELETE client with contacts → orphan contacts

Phase 4 — Unit Tests (frontend schema, entity)
 10. TC-E2-P0-03  Zod schema blocks empty fields
 11. TC-E2-P3-01  ClienteEntity unit tests
 12. TC-E2-P3-02  CreateClienteCommandHandler unit tests
 13. TC-E2-P3-03  DeleteClienteCommandHandler orphan path
 14. TC-E2-P3-04  useClientes hook typed output

Phase 5 — Component Tests: List & Search (P1)
 15. TC-E2-P1-01  List renders Nombre + NIT
 16. TC-E2-P1-02  Search by Nombre
 17. TC-E2-P1-03  Search by NIT/RUC
 18. TC-E2-P1-04  EmptyState shown
 19. TC-E2-P1-05  ErrorPanel + retry

Phase 6 — Component Tests: Detail (P1)
 20. TC-E2-P1-06  Detail panel fields + URL update
 21. TC-E2-P1-08  Not-found for invalid ID

Phase 7 — Component Tests: Create & Edit (P0+P1)
 22. TC-E2-P1-09  Create form opens
 23. TC-E2-P1-10  Inline errors on empty fields
 24. TC-E2-P0-04  Mutation invalidates ['clientes'] on create
 25. TC-E2-P1-11  Edit form pre-filled
 26. TC-E2-P1-12  Cancel preserves original data
 27. TC-E2-P0-05  Mutation invalidates ['clientes'] on edit

Phase 8 — Component Tests: Delete (P0+P1)
 28. TC-E2-P1-13  Confirmation dialog appears
 29. TC-E2-P1-14  Cancel keeps client
 30. TC-E2-P0-06  Mutation invalidates ['clientes'] on delete
 31. TC-E2-P1-16  Orphan toast message on delete

Phase 9 — Component Tests: Sort (P1+P2)
 32. TC-E2-P2-07  SortControl 4 options
 33. TC-E2-P1-21  Default sort "Más reciente"
 34. TC-E2-P1-17  Sort A→Z no extra fetch
 35. TC-E2-P1-18  Sort Z→A
 36. TC-E2-P1-19  Sort by createdAt
 37. TC-E2-P1-20  Sort preserves active search

Phase 10 — Performance (P2)
 38. TC-E2-P2-06  500 records filter < 150ms

Phase 11 — E2E (Playwright — requires both servers)
 39. TC-E2-P1-07  Deep link /clientes/:clienteId
 40. TC-E2-P2-08  Full create client E2E happy path
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| @testing-library/user-event | User interaction simulation | Frontend |
| MSW (Mock Service Worker) | API mocking for component tests | Frontend |
| Playwright | E2E tests (deep linking, full flows) | Frontend/E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| FluentValidation (test assertions) | Validator unit tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on port 5432
- Database: siesa_agents_db with clientes and contactos tables (migrations from Epic 1 + Epic 2)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- Frontend dev server on port 5173 (Playwright tests only)
- Backend API on port 5000 (Playwright + xUnit integration tests)
```

### Test Data Strategy

```
- Backend integration tests: TestContainers Postgres container per test class
- Component tests: MSW handlers per test file; factory function generateCliente(overrides?)
- E2E tests: seed via POST /api/v1/clientes in Playwright beforeEach
- Orphan-contact tests: seed via POST /api/v1/clientes then POST /api/v1/contactos with clienteId
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 6 | 2.0 | 12.0 | Mutation invalidation, duplicate NIT, validation gap — complex setup |
| P1 | 21 | 1.0 | 21.0 | Standard CRUD component + API coverage |
| P2 | 9 | 0.75 | 6.75 | API contract assertions, performance, E2E happy path |
| P3 | 4 | 0.5 | 2.0 | Unit tests for handlers and hooks |
| **Total** | **40** | — | **41.75 hours** | **~5.2 days** |

### Prerequisites

**Test Data:**
- `generateCliente(overrides?: Partial<Cliente>): Cliente` factory for component tests
- `SeedCliente(db, data)` helper for xUnit integration tests
- `SeedClienteWithContacts(db, clienteData, contactCount)` for orphan-contact scenario tests

**Tooling:**
- MSW 2+ with `http.get/post/put/delete` handlers — component API mocking
- Playwright 1.40+ — E2E tests
- xUnit 2+ with `WebApplicationFactory<Program>` — backend integration
- TestContainers 4+ (Postgres) — isolated DB per integration test class

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (6 tests — all must pass before implementation begins)
- **P1 pass rate**: 100% (21 tests — required before any story is closed as Done)
- **P2 pass rate**: ≥ 90% (may defer with documented justification)
- **P3 pass rate**: ≥ 80% (informational — nice to have)

### Coverage Targets

- **Mutation invalidation** (FR27): 100% — all 3 mutations (create, update, delete) explicitly tested
- **Validation double-layer** (NFR5): 100% — Zod schema + FluentValidation both tested independently
- **Error responses** (NFR6): 100% — 400, 404, 409 all verified as Problem Details without stack traces
- **Search** (NFR1): 100% — both search dimensions (nombre, NIT) tested + performance
- **Sort** (AC-E2.6): 100% — all 4 sort options + default + search interplay

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] No P1 test skipped without documented justification
- [ ] TC-E2-P0-01: 409 confirmed as Problem Details without stack trace (R1 mitigated)
- [ ] TC-E2-P0-03: Zod blocks all 4 required fields individually (R2 mitigated)
- [ ] TC-E2-P0-04/05/06: All 3 mutation hooks confirmed to invalidate ['clientes'] (R3 mitigated)
- [ ] TC-E2-P1-15: Orphan contacts set to NULL confirmed at DB level (R4 mitigated)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-21)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case skipped without documented reason
- [ ] `clienteSchema.ts` (Zod) and `*RequestValidator.cs` (FluentValidation) field definitions are in sync
- [ ] All 3 mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) explicitly invalidate `['clientes']` query key
- [ ] ON DELETE SET NULL cascade confirmed for `contactos.cliente_id` FK
- [ ] All user-facing text (toasts, errors, labels) is in Spanish — verified in component tests
- [ ] No backend response exposes stack traces, raw exception messages, or SQL errors

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **NIT/RUC uniqueness**: `CreateClienteRequestValidator` must check uniqueness against the repository and throw/return a `DomainException` that maps to HTTP 409 with the exact message `"El NIT/RUC ya está registrado"` in the Problem Details `detail` field.
2. **Zod/FluentValidation sync**: Required fields are `Nombre`, `NIT`, `Telefono`, `Ciudad` — both validation layers must enforce all 4.
3. **Mutation invalidation**: Every mutation hook (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Edit also invalidates `['clientes', id]`.
4. **Delete orphan handling**: `DeleteClienteCommandHandler` must invoke the contact repository to set `ClienteId = null` on all contacts with `ClienteId = deletedId` before deleting the client. `ContactoEntity.ClienteId` is a nullable Guid FK with `ON DELETE SET NULL` in EF config — do not rely on DB cascade alone if the handler needs to know contact count for toast message.
5. **SortControl is client-side only**: Sorting must be applied over the TanStack Query cache (`useClientes().data`), not by adding query parameters to the API call. `local React useState` manages sort state.
6. **Search is client-side `useMemo`**: No `?q=` query parameter to the backend for Epic 2 search. Filter is over the in-memory `['clientes']` cache.
7. **Toast messages are exact**: `"Cliente creado correctamente"`, `"Cliente actualizado correctamente"`, `"Cliente eliminado correctamente"`, `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` — tests assert these exact Spanish strings.
8. **DateTimeOffset for createdAt/updatedAt**: Never `DateTime` — tests will assert ISO 8601 with timezone in JSON responses.
9. **UUID primary keys**: All test data must use `Guid.NewGuid()` — no integer IDs.
10. **DELETE endpoint**: `PUT /api/v1/contactos/{id}/cliente` (reassign) is Epic 4 scope — Epic 2 only needs the orphan side-effect (SET NULL), not the reassignment UI.
