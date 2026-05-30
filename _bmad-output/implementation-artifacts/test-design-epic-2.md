---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-05-30"
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

Epic 2 delivers the complete CRUD lifecycle for client records within the Siesa Agents CRM: listing with real-time search, detail view with deep-link support, client creation with validation, editing with pre-fill, deletion with contact orphan handling, and client-side sorting by four criteria — all without full page reloads, all operating on the `['clientes']` TanStack Query cache over `GET/POST/PUT/DELETE /api/v1/clientes`.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time client-side filtering, EmptyState, ErrorPanel + retry, 500-record NFR1 |
| 2.2 | Client Detail View | Detail panel display, deep linking to `/clientes/:clienteId`, 404 on invalid ID |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), NIT/RUC uniqueness (409), toast, list refresh |
| 2.4 | Edit Client | Pre-fill form, save/cancel flows, optimistic UI, required field guard |
| 2.5 | Delete Client | Confirmation dialog, contact orphan propagation (clienteId = null), toast |
| 2.6 | Sort Client List | Four sort options, client-side only (no extra fetch), sort+filter coexistence |

### Out of Scope for This Epic

- Contact management UI (Epic 3)
- Client–Contact association (Epic 4)
- ContactManager component (instanced in ClienteDetailView, but not tested here)
- Authentication / authorization (deferred, MVP)
- Server-side pagination (NFR10/11 scope — client-side at ≤ 500 records is sufficient)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness enforcement** missing in backend (no UK_clientes_nit constraint or validator), allowing duplicate NITs silently | High | Critical | P0 | API integration test: POST two clients with same NIT → assert 409 with "El NIT/RUC ya está registrado" Problem Details body |
| R2 | **Required field validation not enforced on backend** (FluentValidation validators not registered or not run), so incomplete clients are persisted | High | Critical | P0 | API integration test: POST with blank Nombre/NIT/Telefono/Ciudad → assert 400 with `errors` map per Problem Details |
| R3 | **TanStack Query cache NOT invalidated after mutation**, causing the list to show stale data after create/edit/delete | High | High | P0 | Component test: after mutation mock resolves → assert list updates without manual page reload |
| R4 | **Client-side filter breaks with diacritics or case sensitivity** (e.g., searching "garcia" does not match "García"), violating AC-E2.2 | Medium | High | P1 | Unit test on filter function: assert case-insensitive + Unicode-normalized matching |
| R5 | **Deep linking fails for `/clientes/:clienteId`** — page load with direct URL does not fetch individual client, shows blank or root view | Medium | High | P1 | E2E test: direct navigation to `/clientes/{uuid}` → assert detail panel renders correct client data |
| R6 | **Deletion with orphan contacts** does not set `clienteId = null` (FK ON DELETE SET NULL mis-configured), causing FK constraint violation or data corruption | Medium | Critical | P0 | API integration test: DELETE a client with ≥1 associated contact → assert 204 + contacts still exist with `clienteId: null` |
| R7 | **Sort state clears active search input** when sort changes, violating AC-E2.6 explicit requirement | Medium | High | P1 | Component test: apply search → change sort → assert search input unchanged and filtered result re-ordered |
| R8 | **Confirmation dialog bypass** — DELETE endpoint callable directly without triggering frontend dialog, or "Cancelar" does not abort | Low | High | P1 | Component test: assert DELETE API is NOT called when user clicks "Cancelar" in dialog |
| R9 | **Toast messages in wrong language or absent** (English text, missing on error), violating corporate standard (Spanish mandatory) | Medium | Medium | P2 | Component tests: assert toast text matches exact Spanish strings for create, update, delete success and error |
| R10 | **Sort "Más reciente" is not the default** on initial render, violating AC-E2.6 | Low | Medium | P2 | Component test: render SortControl with no prior state → assert `fecha-desc` option is selected |
| R11 | **Search > 1 second with 500 records** (NFR1) if filter implementation uses expensive algorithm or blocking sync work | Low | High | P1 | Performance unit test: generate 500 mock records → assert `useMemo` filter completes within 50ms |
| R12 | **`ErrorPanel` "Reintentar" button does not trigger TanStack Query refetch**, leaving user stuck on error state | Low | High | P2 | Component test: simulate fetch failure → render ErrorPanel → click "Reintentar" → assert `refetch()` called |

### Top 3 Risk Areas for Epic 2

1. **Data integrity — NIT uniqueness and required field validation (R1, R2)**: These are the primary data quality controls for the entity. A gap here allows corrupt data into the database and is invisible until production.
2. **Client deletion with orphan contacts (R6)**: The ON DELETE SET NULL behavior is a foreign key database configuration that is easy to misconfigure. A failure here breaks Epic 4 (contact association) entirely and may corrupt the contactos table.
3. **TanStack Query cache invalidation (R3)**: If mutations do not call `invalidateQueries(['clientes'])`, every create/edit/delete appears to succeed in the API but the UI shows stale data — a classic React Query integration failure that is silently wrong.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)           ▌▌▌▌▌▌             3 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   14 tests
  Component (Vitest + RTL)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   15 tests
  Unit (Vitest / xUnit)      ▌▌▌▌▌▌▌▌▌▌         9 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                           41 tests
```

### Rationale

- **API Integration tests dominate backend coverage** because all four CRUD verbs plus the uniqueness constraint and the orphan-contact cascade require real HTTP round-trips against a live application factory with a PostgreSQL test database.
- **Component tests dominate frontend coverage** because the split-panel architecture (list + detail), real-time filter, sort state, dialog flow, and toast rendering are all state/interaction concerns best verified with Vitest + RTL + MSW — faster and more stable than E2E.
- **E2E tests are minimal (3)** but cover the deep-linking scenario (Story 2.2) and the create-client happy path (Story 2.3) because these require a real browser URL bar and full stack integration that cannot be replicated in component tests alone.
- **Unit tests** cover the filter utility function (performance, Unicode, case sensitivity), Zod schema validators, and the SortControl logic — pure functions that are fast and deterministic.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: POST /api/v1/clientes — Create Client with Valid Payload Returns 201

**Level:** API Integration
**Story:** 2.3
**Requirement:** FR1, AC-E2.1
**Risk covered:** Baseline creation path; prerequisite for all other tests

**Precondition:** Backend running via `WebApplicationFactory<Program>`. Test PostgreSQL database clean (empty `clientes` table).

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body:
   ```json
   { "nombre": "Empresa Test", "nit": "900123456-7", "telefono": "3001234567", "ciudad": "Bogotá" }
   ```
2. Inspect response.

**Expected Result:**
- HTTP 201 Created.
- Response body contains `id` (valid UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
- `createdAt` and `updatedAt` are ISO 8601 strings with timezone.
- `id` is a non-empty UUID (not Guid.Empty).

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-02: POST /api/v1/clientes — Duplicate NIT Returns 409 Conflict

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-2.3 (409 conflict), NFR6
**Risk covered:** R1

**Precondition:** Client with NIT `900123456-7` already exists in the test database.

**Test Steps:**
1. POST `/api/v1/clientes` with `"nit": "900123456-7"` (duplicate) and valid remaining fields.
2. Inspect response status and body.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Response body contains `status: 409`, `title`, `detail` — detail must include language indicating NIT is already registered.
- Response does NOT contain `stackTrace`, `exception`, or raw C# messages.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-03: POST /api/v1/clientes — Missing Required Fields Returns 400

**Level:** API Integration
**Story:** 2.3
**Requirement:** FR8, AC-E2.4, AC-2.3
**Risk covered:** R2

**Precondition:** Backend running.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{}` (all fields empty/missing).
2. Also test with each single required field missing (parameterized: Nombre missing, NIT missing, Telefono missing, Ciudad missing).

**Expected Result (each case):**
- HTTP 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response body contains `errors` map with at least one key corresponding to the missing field.
- No client record created in the database.
- No stack trace in response.

**Automation:** xUnit parameterized `[Theory]` test.

---

#### TC-E2-P0-04: DELETE /api/v1/clientes/{id} — Client with Contacts: Contacts Become Orphan (clienteId = null)

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 (orphan contacts behavior), FR23
**Risk covered:** R6

**Precondition:** Client `C1` exists. Contact `CT1` has `clienteId = C1.id` (FK set).

**Test Steps:**
1. DELETE `/api/v1/clientes/{C1.id}`.
2. GET `/api/v1/contactos/{CT1.id}`.

**Expected Result:**
- DELETE returns HTTP 204 No Content.
- GET on CT1 returns 200 with `clienteId: null`.
- CT1 still exists (not deleted).
- No FK constraint violation error.

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P0-05: TanStack Query Cache Invalidated After Create Mutation

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR27, AC-E2.1
**Risk covered:** R3

**Precondition:** MSW handlers configured:
- `GET /api/v1/clientes` initially returns `[clienteA]`.
- `POST /api/v1/clientes` returns `201` with `clienteB`.
- After POST, MSW `GET /api/v1/clientes` returns `[clienteA, clienteB]`.

**Test Steps:**
1. Render `<ClienteListView>` wrapped in QueryClient + MSW provider.
2. Assert `clienteA` appears in the list.
3. Trigger the create mutation (simulate form submission).
4. Wait for MSW to settle.
5. Assert `clienteB` now appears in the list alongside `clienteA`.

**Expected Result:**
- Both `clienteA` and `clienteB` are in the rendered list after mutation.
- No page reload occurred.
- List updates within the component without unmounting.

**Automation:** Vitest + `@testing-library/react` + MSW.

---

#### TC-E2-P0-06: TanStack Query Cache Invalidated After Delete Mutation

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** FR27, AC-E2.5
**Risk covered:** R3

**Precondition:** MSW: GET returns `[clienteA, clienteB]`. DELETE `/api/v1/clientes/{clienteB.id}` returns 204. Subsequent GET returns `[clienteA]`.

**Test Steps:**
1. Render `<ClienteListView>` — both clients visible.
2. Confirm deletion of `clienteB` (simulate dialog confirm).
3. Wait for mutation to settle.
4. Assert `clienteB` no longer appears in the list.
5. Assert `clienteA` is still present.

**Expected Result:**
- `clienteB` removed from DOM after deletion.
- Right panel returns to empty/default state.
- `clienteA` unaffected.

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

---

#### TC-E2-P1-01: GET /api/v1/clientes — Returns Array of All Clients

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR1, FR2

**Test Steps:**
1. Seed 3 clients with known data.
2. GET `/api/v1/clientes`.

**Expected Result:**
- HTTP 200.
- Response is a JSON array (not wrapped object).
- Array length = 3.
- Each item contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

**Automation:** xUnit.

---

#### TC-E2-P1-02: GET /api/v1/clientes/{id} — Returns Correct Client

**Level:** API Integration
**Story:** 2.2
**Requirement:** FR5, AC-2.2

**Test Steps:**
1. Seed client with known UUID.
2. GET `/api/v1/clientes/{knownId}`.

**Expected Result:**
- HTTP 200.
- Response contains the exact `id`, `nombre`, `nit`, `telefono`, `ciudad` seeded.

**Automation:** xUnit.

---

#### TC-E2-P1-03: GET /api/v1/clientes/{id} — Non-Existent ID Returns 404

**Level:** API Integration
**Story:** 2.2
**Requirement:** AC-2.2 (not-found message displayed gracefully)
**Risk covered:** Boundary — invalid deep link

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000001` (valid UUID format, not seeded).

**Expected Result:**
- HTTP 404 Not Found.
- `Content-Type: application/problem+json`.
- Problem Details body with `status: 404`, `title`, `detail`.

**Automation:** xUnit.

---

#### TC-E2-P1-04: PUT /api/v1/clientes/{id} — Update Client Returns 200 with Updated Data

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR6, AC-2.4

**Test Steps:**
1. Seed client with `nombre: "Original"`.
2. PUT `/api/v1/clientes/{id}` with `nombre: "Actualizado"` and all required fields.
3. GET `/api/v1/clientes/{id}` to confirm persistence.

**Expected Result:**
- PUT returns 200 with updated `nombre: "Actualizado"`.
- GET confirms `nombre: "Actualizado"` persisted.
- `updatedAt` is later than original `createdAt`.

**Automation:** xUnit.

---

#### TC-E2-P1-05: PUT /api/v1/clientes/{id} — Clear Required Field Returns 400

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR8, AC-2.4

**Test Steps:**
1. Seed a client.
2. PUT with `nombre: ""` (empty string).

**Expected Result:**
- HTTP 400 with Problem Details.
- `errors` map includes field corresponding to Nombre.
- Client record in DB remains unchanged.

**Automation:** xUnit parameterized theory (test each required field cleared).

---

#### TC-E2-P1-06: DELETE /api/v1/clientes/{id} — Client Without Contacts Returns 204

**Level:** API Integration
**Story:** 2.5
**Requirement:** FR7, AC-2.5

**Test Steps:**
1. Seed client with no associated contacts.
2. DELETE `/api/v1/clientes/{id}`.
3. GET `/api/v1/clientes/{id}`.

**Expected Result:**
- DELETE returns 204 No Content.
- Subsequent GET returns 404 (client removed).

**Automation:** xUnit.

---

#### TC-E2-P1-07: Client List Filters in Real-Time by Nombre (Client-Side)

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** FR3, AC-E2.2, NFR1

**Precondition:** MSW returns `[{ nombre: "Ana García", nit: "..." }, { nombre: "Pedro Pérez", nit: "..." }]`.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Type `"ana"` in the search input.
3. Assert rendered list.

**Expected Result:**
- Only "Ana García" is visible.
- "Pedro Pérez" is not in DOM.
- No API call made for the search (client-side only).
- MSW `GET /api/v1/clientes` called exactly once (on mount).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Client List Filters in Real-Time by NIT/RUC (Client-Side)

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** FR4, AC-E2.2

**Test Steps:**
1. Render with two clients: different NITs.
2. Type partial NIT of only one client in search input.

**Expected Result:**
- Only the matched client is visible.
- No new API fetch triggered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: EmptyState Displayed When Client List Is Empty

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 (empty state)

**Precondition:** MSW returns `[]` for GET `/api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Wait for query to resolve.

**Expected Result:**
- `EmptyState` component rendered.
- Guidance text visible directing user to create first client.
- No client list items rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: ErrorPanel with "Reintentar" Displayed When Fetch Fails

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 (error panel + retry)
**Risk covered:** R12

**Precondition:** MSW returns network error for GET `/api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Wait for query to fail.
3. Assert ErrorPanel visible with "Reintentar" button.
4. Click "Reintentar".

**Expected Result:**
- ErrorPanel component renders on fetch failure.
- "Reintentar" button triggers a new `refetch()` call (MSW can be reset to success for retry).
- No crash or blank screen.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Clicking Client in List Opens Detail Panel and Updates URL

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** FR5, AC-2.2, FR30

**Test Steps:**
1. Render split-panel layout at `/clientes` with a list of 2 clients.
2. Click the first client item.

**Expected Result:**
- Detail panel on the right renders the selected client's Nombre, NIT/RUC, Teléfono, Ciudad.
- URL updates to `/clientes/{clienteId}` (TanStack Router navigation, no full reload).

**Automation:** Vitest + RTL + `@tanstack/react-router` test utilities.

---

#### TC-E2-P1-12: Not-Found Message When Deep-Link ID Does Not Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirement:** AC-2.2 (not-found gracefully)

**Precondition:** MSW returns 404 for `GET /api/v1/clientes/non-existent-id`.

**Test Steps:**
1. Render router at `/clientes/non-existent-id`.

**Expected Result:**
- Not-found message component renders in detail panel.
- No JavaScript error thrown.
- Navigation shell remains visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Sort Does Not Trigger New API Fetch

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6, Story 2.6 Technical Context

**Test Steps:**
1. Render `<ClienteListView>` — MSW returns 3 clients.
2. Count initial MSW calls to `GET /api/v1/clientes`.
3. Change SortControl to "Nombre A→Z".
4. Change SortControl to "Más antiguo".

**Expected Result:**
- `GET /api/v1/clientes` called exactly once total (on mount).
- No additional fetch triggered on sort change.
- List order changes after each sort selection.

**Automation:** Vitest + RTL + MSW (request count assertion).

---

#### TC-E2-P1-14: Sort + Active Search Filter Coexist Without Resetting Each Other

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6 (sort applies to filtered result set), AC-2.6

**Precondition:** MSW returns clients: `[{ nombre: "Carlos", nit: "C01" }, { nombre: "Ana", nit: "A01" }, { nombre: "Beatriz", nit: "B01" }]`.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Type "a" in the search input — should show "Carlos" and "Ana" (contains "a").
3. Note search input value.
4. Change SortControl to "Nombre A→Z".

**Expected Result:**
- After sort change, search input still contains "a" (not cleared).
- Visible list is sorted A→Z: "Ana" before "Carlos".
- "Beatriz" remains hidden (filtered out by "a" search — wait, "Beatriz" contains no "a". Correct: only Ana and Carlos are shown, sorted A→Z).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Delete Confirmation Dialog — Cancelar Does Not Delete

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC-2.5 (cancel preserves record)
**Risk covered:** R8

**Test Steps:**
1. Render client detail for `clienteA`.
2. Click "Eliminar" → assert confirmation dialog appears.
3. Click "Cancelar" in the dialog.

**Expected Result:**
- Dialog closes.
- MSW DELETE endpoint NOT called.
- `clienteA` still appears in the list.
- No toast shown.

**Automation:** Vitest + RTL + MSW (request spy assertion).

---

#### TC-E2-P1-16: Search Filter Performance — 500 Records Under 50ms

**Level:** Unit (Vitest)
**Story:** 2.1
**Requirement:** NFR1 (< 1 second), AC-E2.2
**Risk covered:** R11

**Precondition:** Import the filter utility function used in `ClienteListView` (the `useMemo` predicate or extracted pure function).

**Test Steps:**
1. Generate an array of 500 mock client objects.
2. Record timestamp.
3. Apply filter function with search query "a".
4. Record timestamp after.
5. Assert elapsed time.

**Expected Result:**
- Filter executes in under 50ms (leaving ample margin for NFR1's 1-second budget).
- Filter correctly returns only clients whose Nombre or NIT contains "a".

**Automation:** Vitest `performance.now()` assertion.

---

#### TC-E2-P1-17: Filter Function — Case-Insensitive and Unicode-Normalized Matching

**Level:** Unit (Vitest)
**Story:** 2.1
**Requirement:** AC-E2.2, FR3, FR4
**Risk covered:** R4

**Test Steps (parameterized):**
1. Client `{ nombre: "García López", nit: "900-1" }`.
2. Assert filter("garcia") matches.
3. Assert filter("GARCIA") matches.
4. Assert filter("García") matches.
5. Assert filter("900") matches on NIT.
6. Assert filter("xyz") does NOT match.

**Expected Result:**
- All case variations of accented names match.
- NIT substring match works.
- Non-matching query returns empty/no-match correctly.

**Automation:** Vitest parameterized tests.

---

#### TC-E2-P1-18: Zod Schema Rejects Empty Required Fields

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirement:** FR8, AC-E2.4
**Risk covered:** R2 (frontend layer)

**Test Steps:**
1. Import `clienteSchema` from `src/modules/crm/clientes/application/clienteSchema.ts`.
2. Parse `{}` — assert `ZodError` with errors for all required fields.
3. Parse `{ nombre: "", nit: "", telefono: "", ciudad: "" }` — assert `ZodError`.
4. Parse valid object — assert success.

**Expected Result:**
- Missing/empty required fields all produce validation errors.
- Valid payload parses without error.

**Automation:** Vitest unit test.

---

#### TC-E2-P1-19: Edit Form Pre-Fills With Current Client Values

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** FR6, AC-2.4

**Precondition:** MSW returns `{ nombre: "Empresa A", nit: "800-1", telefono: "3001111111", ciudad: "Medellín" }` for the client.

**Test Steps:**
1. Render `ClienteDetailView` for the client.
2. Click "Editar" button.
3. Inspect form field values.

**Expected Result:**
- Input field for Nombre contains "Empresa A".
- Input for NIT contains "800-1".
- Input for Teléfono contains "3001111111".
- Input for Ciudad contains "Medellín".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-20: Edit Form — Cancelar Does Not Modify Client Data

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC-2.4 (cancel preserves original data)

**Test Steps:**
1. Render detail for client with `nombre: "Original"`.
2. Click "Editar".
3. Clear Nombre and type "Modificado".
4. Click "Cancelar".

**Expected Result:**
- Form closes.
- PUT endpoint NOT called (no MSW request logged).
- Detail panel still shows "Original".

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic Is Marked Complete

---

#### TC-E2-P2-01: E2E — Create Client Happy Path via UI

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR27

**Precondition:** Frontend + Backend running. Database clean.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Fill: Nombre = "Integraciones SA", NIT = "901-TEST-2026", Teléfono = "3002222222", Ciudad = "Cali".
4. Submit the form.

**Expected Result:**
- Toast "Cliente creado correctamente" appears.
- "Integraciones SA" appears in the client list without full page reload.
- URL remains at `/clientes` or navigates to `/clientes/{newId}`.

**Automation:** Playwright E2E.

---

#### TC-E2-P2-02: E2E — Deep Link to Existing Client `/clientes/:clienteId`

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2, FR30 (deep linking)
**Risk covered:** R5

**Precondition:** Client with known UUID exists in database.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{knownUuid}` (no prior navigation).

**Expected Result:**
- Client detail panel renders with correct Nombre, NIT/RUC, Teléfono, Ciudad.
- No redirect to root or blank page.
- Navigation shell is visible.

**Automation:** Playwright E2E.

---

#### TC-E2-P2-03: E2E — Delete Client Removes It from List

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** AC-E2.5, FR7

**Precondition:** Client "Para Eliminar" with unique NIT exists.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Para Eliminar" in the list.
3. Click "Eliminar" in detail panel.
4. Click "Confirmar" in the dialog.

**Expected Result:**
- Toast "Cliente eliminado correctamente" appears.
- "Para Eliminar" no longer in the client list.
- Right panel returns to empty/default state.

**Automation:** Playwright E2E.

---

#### TC-E2-P2-04: Sort "Nombre A→Z" Reorders List Ascending

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6

**Precondition:** MSW returns `[{ nombre: "Zeta" }, { nombre: "Alfa" }, { nombre: "Medio" }]`.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Select "Nombre A→Z" from `<SortControl>`.
3. Read rendered order of client names in the list.

**Expected Result:**
- Order: "Alfa", "Medio", "Zeta".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-05: Sort "Nombre Z→A" Reorders List Descending

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6

**Test Steps:**
1. Same precondition as TC-E2-P2-04.
2. Select "Nombre Z→A".

**Expected Result:**
- Order: "Zeta", "Medio", "Alfa".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: Sort Default Is "Más reciente" on Initial Render

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (default sort order)
**Risk covered:** R10

**Test Steps:**
1. Render `<SortControl>` with no props passed (or default state).

**Expected Result:**
- The `fecha-desc` option is selected/active.
- No other sort option is marked as default.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-07: Toast Messages Are in Spanish with Correct Text

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3, 2.4, 2.5
**Requirement:** Corporate standard (Spanish mandatory), AC-2.3, AC-2.4, AC-2.5
**Risk covered:** R9

**Test Steps (parameterized, one for each action):**
1. Render and trigger create mutation (success) → assert toast text = "Cliente creado correctamente".
2. Render and trigger update mutation (success) → assert toast text = "Cliente actualizado correctamente".
3. Render and trigger delete mutation (success — no contacts) → assert toast text = "Cliente eliminado correctamente".
4. Render and trigger delete mutation (success — with contacts) → assert toast text contains "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

**Expected Result:**
- Each action produces exactly the specified Spanish toast text.
- No English text in any toast message.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-08: "Nuevo cliente" Button Opens Form with Empty Fields

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-2.3

**Test Steps:**
1. Render `<ClienteListView>` (or the parent route component).
2. Click "Nuevo cliente" button.
3. Inspect all form input values.

**Expected Result:**
- Form is visible.
- Fields: Nombre, NIT/RUC, Teléfono, Ciudad are all empty strings.
- No previous client data pre-filled.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-09: Inline Error Messages on Empty Required Fields (Frontend Validation)

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4
**Requirement:** FR8, AC-E2.4, AC-2.3

**Test Steps:**
1. Open the create/edit form.
2. Leave all fields empty.
3. Click the submit button.

**Expected Result:**
- Form is NOT submitted (no MSW POST/PUT called).
- Inline error messages appear beneath each required field.
- All four fields (Nombre, NIT/RUC, Teléfono, Ciudad) show error messages.

**Automation:** Vitest + RTL + MSW (assert no network requests).

---

#### TC-E2-P2-10: Sort "Más reciente" Orders by Creation Date Descending

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-2.6

**Precondition:** MSW returns 3 clients with distinct `createdAt` timestamps: oldest first in the array (server default), newest last.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Select "Más reciente" from `<SortControl>`.
3. Read rendered order.

**Expected Result:**
- Client with latest `createdAt` appears first.

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: FluentValidation — CreateClienteRequestValidator Unit Test

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirement:** FR8, NFR5

**Test Steps:**
1. Instantiate `CreateClienteRequestValidator`.
2. Validate objects with various invalid combinations (missing fields, empty strings).
3. Validate a fully valid object.

**Expected Result:**
- All invalid payloads produce `ValidationResult.IsValid = false` with field-level errors.
- Valid payload produces `IsValid = true`.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-02: FluentValidation — UpdateClienteRequestValidator Unit Test

**Level:** Unit (xUnit)
**Story:** 2.4
**Requirement:** FR8, NFR5

**Test Steps:**
1. Instantiate `UpdateClienteRequestValidator`.
2. Test empty fields for each required field.

**Expected Result:**
- Validation fails with appropriate field errors.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-03: CreateClienteCommandHandler Unit Test

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirement:** FR1

**Test Steps:**
1. Mock `IClienteRepository`.
2. Call `CreateClienteCommandHandler.Handle()` with valid command.
3. Assert `repository.Add()` called with correct entity.
4. Assert returned DTO has expected values.

**Expected Result:**
- Handler creates entity with UUID PK, `DateTimeOffset` timestamps.
- Repository `AddAsync` called exactly once.

**Automation:** xUnit + NSubstitute/Moq.

---

#### TC-E2-P3-04: DeleteClienteCommandHandler Unit Test — Non-Existent Client Throws/Returns Not Found

**Level:** Unit (xUnit)
**Story:** 2.5

**Test Steps:**
1. Mock `IClienteRepository.GetByIdAsync()` returning `null`.
2. Call `DeleteClienteCommandHandler.Handle()`.

**Expected Result:**
- Handler throws a domain exception or returns a not-found result.
- `repository.DeleteAsync()` NOT called.

**Automation:** xUnit.

---

#### TC-E2-P3-05: SortControl Component Renders All Four Sort Options

**Level:** Unit/Component (Vitest + RTL)
**Story:** 2.6

**Test Steps:**
1. Render `<SortControl>`.

**Expected Result:**
- Four options rendered: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo".
- All in Spanish.

**Automation:** Vitest + RTL.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Stories | Test Cases | Status |
|----------------|---------|------------|--------|
| AC-E2.1: Register client — appears in list immediately | 2.3 | TC-E2-P0-01, TC-E2-P0-05, TC-E2-P2-01 | Covered |
| AC-E2.2: Search by name or NIT < 1 second | 2.1 | TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-16, TC-E2-P1-17 | Covered |
| AC-E2.3: View detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-02, TC-E2-P1-04, TC-E2-P1-19, TC-E2-P2-02 | Covered |
| AC-E2.4: Required fields enforced with clear error messages | 2.3, 2.4 | TC-E2-P0-03, TC-E2-P1-05, TC-E2-P1-18, TC-E2-P2-09 | Covered |
| AC-E2.5: Delete client — disappears from list | 2.5 | TC-E2-P0-04, TC-E2-P0-06, TC-E2-P1-06, TC-E2-P2-03 | Covered |
| AC-E2.6: Sort by 4 criteria without reload or clearing filter | 2.6 | TC-E2-P1-13, TC-E2-P1-14, TC-E2-P2-04, TC-E2-P2-05, TC-E2-P2-06, TC-E2-P2-10 | Covered |
| AC-2.1: EmptyState on no clients | 2.1 | TC-E2-P1-09 | Covered |
| AC-2.1: ErrorPanel + Reintentar on fetch failure | 2.1 | TC-E2-P1-10 | Covered |
| AC-2.2: URL updates to /clientes/:clienteId on selection | 2.2 | TC-E2-P1-11 | Covered |
| AC-2.2: Direct URL loads correct client detail | 2.2 | TC-E2-P2-02 | Covered |
| AC-2.2: Not-found on invalid clienteId | 2.2 | TC-E2-P1-03, TC-E2-P1-12 | Covered |
| AC-2.3: Form opens with 4 required fields on "Nuevo cliente" | 2.3 | TC-E2-P2-08 | Covered |
| AC-2.3: Client created → list updated + toast success | 2.3 | TC-E2-P0-01, TC-E2-P0-05, TC-E2-P2-01, TC-E2-P2-07 | Covered |
| AC-2.3: Inline errors on empty submit, no backend call | 2.3 | TC-E2-P0-03, TC-E2-P1-18, TC-E2-P2-09 | Covered |
| AC-2.3: Duplicate NIT → 409 error message | 2.3 | TC-E2-P0-02 | Covered |
| AC-2.4: Edit form pre-filled with current values | 2.4 | TC-E2-P1-19 | Covered |
| AC-2.4: Save → reflected immediately + toast | 2.4 | TC-E2-P1-04, TC-E2-P2-07 | Covered |
| AC-2.4: Clear required field → inline error, no submit | 2.4 | TC-E2-P1-05, TC-E2-P2-09 | Covered |
| AC-2.4: Cancelar preserves original data | 2.4 | TC-E2-P1-20 | Covered |
| AC-2.5: Confirmation dialog on "Eliminar" | 2.5 | TC-E2-P1-15 | Covered |
| AC-2.5: Confirm → removed from list + toast | 2.5 | TC-E2-P0-06, TC-E2-P2-03, TC-E2-P2-07 | Covered |
| AC-2.5: Cancelar — record unchanged | 2.5 | TC-E2-P1-15 | Covered |
| AC-2.5: Delete with contacts → contacts orphaned + specific toast | 2.5 | TC-E2-P0-04, TC-E2-P2-07 | Covered |
| AC-2.6: Nombre A→Z sort | 2.6 | TC-E2-P2-04 | Covered |
| AC-2.6: Nombre Z→A sort | 2.6 | TC-E2-P2-05 | Covered |
| AC-2.6: Más reciente sort | 2.6 | TC-E2-P2-10 | Covered |
| AC-2.6: Más antiguo sort | 2.6 | TC-E2-P2-10 (inverse) | Covered |
| AC-2.6: Default sort = Más reciente | 2.6 | TC-E2-P2-06 | Covered |
| AC-2.6: Sort preserves active search filter | 2.6 | TC-E2-P1-14 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search results in < 1s with 500 records | TC-E2-P1-16 | Unit (performance) |
| NFR2 | CRUD changes reflected in UI in < 2s | TC-E2-P0-05, TC-E2-P0-06 (TanStack invalidation) | Component |
| NFR5 | Input validation + sanitization | TC-E2-P0-03, TC-E2-P1-05, TC-E2-P1-18, TC-E2-P3-01, TC-E2-P3-02 | API Integration + Unit |
| NFR6 | No stack traces / internal errors to user | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-03 (Problem Details) | API Integration |
| NFR7 | Core tasks without training | TC-E2-P2-01 (E2E happy path) | E2E |
| NFR8 | ≤ 2 clicks from client to contacts | Out of scope Epic 2 — tested in Epic 4 | N/A |
| NFR9 | Contact's associated client visible without search | Out of scope Epic 2 — tested in Epic 4 | N/A |
| NFR10/11 | Scale limits not hardcoded | UUID PKs verified via TC-E2-P0-01 (id is UUID) | API Integration |

---

## 7. Test Execution Order

```
Phase 1 — Backend API Gate (P0, requires TestContainers Postgres)
  1. TC-E2-P0-01  POST /clientes — valid payload → 201
  2. TC-E2-P0-02  POST /clientes — duplicate NIT → 409
  3. TC-E2-P0-03  POST /clientes — missing fields → 400
  4. TC-E2-P0-04  DELETE /clientes/{id} — orphan contacts → 204, contacts clienteId=null

Phase 2 — Backend CRUD Completeness (P1, API Integration)
  5. TC-E2-P1-01  GET /clientes — list returns array
  6. TC-E2-P1-02  GET /clientes/{id} — correct client returned
  7. TC-E2-P1-03  GET /clientes/{id} — non-existent → 404
  8. TC-E2-P1-04  PUT /clientes/{id} — update → 200 + persisted
  9. TC-E2-P1-05  PUT /clientes/{id} — clear required field → 400
 10. TC-E2-P1-06  DELETE /clientes/{id} — no contacts → 204

Phase 3 — Frontend Unit Gate (P1, Vitest pure functions)
 11. TC-E2-P1-16  Filter performance (500 records < 50ms)
 12. TC-E2-P1-17  Filter case-insensitive + Unicode normalization
 13. TC-E2-P1-18  Zod schema — empty required fields rejected

Phase 4 — Component Tests (P0 Component + P1 Component)
 14. TC-E2-P0-05  Cache invalidated after create
 15. TC-E2-P0-06  Cache invalidated after delete
 16. TC-E2-P1-07  Real-time filter by Nombre
 17. TC-E2-P1-08  Real-time filter by NIT
 18. TC-E2-P1-09  EmptyState on empty list
 19. TC-E2-P1-10  ErrorPanel + Reintentar
 20. TC-E2-P1-11  List click → detail panel + URL update
 21. TC-E2-P1-12  Not-found on invalid deep link
 22. TC-E2-P1-13  Sort does not trigger extra fetch
 23. TC-E2-P1-14  Sort + filter coexist
 24. TC-E2-P1-15  Delete Cancelar — no DELETE call
 25. TC-E2-P1-19  Edit form pre-fills values
 26. TC-E2-P1-20  Edit Cancelar — original data preserved

Phase 5 — P2 Component Tests
 27. TC-E2-P2-04  Sort Nombre A→Z
 28. TC-E2-P2-05  Sort Nombre Z→A
 29. TC-E2-P2-06  Default sort = Más reciente
 30. TC-E2-P2-07  Toast text in Spanish (all actions)
 31. TC-E2-P2-08  Nuevo cliente form opens empty
 32. TC-E2-P2-09  Inline errors on empty submit
 33. TC-E2-P2-10  Sort Más reciente orders by createdAt desc

Phase 6 — E2E Tests (P2, requires full stack)
 34. TC-E2-P2-01  E2E create client happy path
 35. TC-E2-P2-02  E2E deep link to /clientes/:id
 36. TC-E2-P2-03  E2E delete client

Phase 7 — Unit Tests P3 (optional, parallelizable)
 37. TC-E2-P3-01  FluentValidation CreateClienteRequestValidator
 38. TC-E2-P3-02  FluentValidation UpdateClienteRequestValidator
 39. TC-E2-P3-03  CreateClienteCommandHandler unit test
 40. TC-E2-P3-04  DeleteClienteCommandHandler — not found
 41. TC-E2-P3-05  SortControl renders 4 options in Spanish
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering and user events | Frontend |
| @testing-library/user-event | Realistic user interaction simulation | Frontend |
| @testing-library/jest-dom | DOM assertion matchers | Frontend |
| MSW 2+ | API mock for component tests (no real HTTP) | Frontend |
| @tanstack/react-router (test utils) | Router rendering in tests | Frontend |
| Playwright 1.40+ | E2E full-stack tests (3 scenarios) | E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process HTTP test host | Backend |
| TestContainers (Postgres) | Isolated DB per test run | Backend |
| NSubstitute or Moq | Mock `IClienteRepository` in unit tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on port 5432 (or TestContainers in Docker)
- Docker (required for TestContainers integration tests)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- Epic 1 fully implemented and passing (infrastructure foundation required)
```

### Test Data Setup Notes

- All backend integration tests use `WebApplicationFactory<Program>` with a dedicated test database (TestContainers or a named test schema).
- Each xUnit test class should implement `IAsyncLifetime` to seed/clean test data per test.
- MSW handlers for component tests should be defined in `src/__mocks__/handlers/clientes.ts` and imported per test.
- E2E tests should use a seeded test database via an API setup endpoint or direct SQL seed script in Playwright `globalSetup`.

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 6 | 2.0 | 12.0 | Uniqueness, required field, orphan cascade — complex DB setup |
| P1 | 20 | 1.0 | 20.0 | Full CRUD API + component interactions + filter + sort |
| P2 | 10 | 0.75 | 7.5 | E2E (3) + sort edge cases + toast + form behaviors |
| P3 | 5 | 0.5 | 2.5 | Validator unit tests + command handler units |
| **Total** | **41** | — | **42.0 hours** | **~5.25 days** |

### Test Data Requirements

- **Backend integration:** Factory-seeded `ClienteEntity` records with known UUIDs and `DateTimeOffset` timestamps.
- **Contact orphan test (TC-E2-P0-04):** Requires at least one `ContactoEntity` with FK to a client — minimal seed from Epic 3 model, but the table must exist (created in Epic 2 or 3 migration).
- **Frontend MSW:** Static mock arrays with 2–500 entries; performance test generates 500 records procedurally.

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — all 6 P0 tests must pass before any story can be marked Done.
- **P1 pass rate**: 100% — all 20 P1 tests must pass before the epic can be closed.
- **P2 pass rate**: ≥ 90% — up to 1 P2 test may be deferred with documented justification.
- **P3 pass rate**: ≥ 60% — informational only.

### Coverage Targets

- **Critical paths** (create + delete with orphan + duplicate NIT + required fields): 100%
- **Security / NFR6** (no stack traces in any 4xx/5xx): 100%
- **NIT uniqueness** (R1): 100%
- **Cache invalidation** (R3): 100% — both create and delete paths
- **Deep linking** (AC-2.2, FR30): 100%
- **Sort + filter coexistence** (AC-E2.6): 100%

### Non-Negotiable Requirements (Gate Blockers)

- [ ] TC-E2-P0-01 through TC-E2-P0-06 all pass (P0 gate)
- [ ] Duplicate NIT returns 409 with Problem Details and no stack trace (R1, NFR6)
- [ ] DELETE with contacts results in `clienteId = null` on contacts (R6)
- [ ] TanStack Query cache invalidated after both create and delete (R3)
- [ ] Client-side filter operates within 50ms on 500 records (NFR1)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-20)
- [ ] P2 test cases pass or are formally deferred (≥ 9 of 10)
- [ ] No P0/P1 test skipped without documented reason
- [ ] GET /api/v1/clientes returns array (not wrapped object)
- [ ] POST returns 201 with UUID id and ISO 8601 DateTimeOffset timestamps
- [ ] Duplicate NIT → 409 Problem Details (no stack trace)
- [ ] DELETE → 204 No Content; contacts with FK → clienteId = null
- [ ] All toast messages in Spanish with exact specified text
- [ ] Client-side sort does not trigger additional API fetch
- [ ] Sort state and search state are independent (neither clears the other)
- [ ] Default sort order on initial render is "Más reciente" (`fecha-desc`)

---

## 10. Notes for Story Implementation Agents

The following implementation constraints are required for these test cases to pass:

1. **`uk_clientes_nit` unique index or constraint** must be configured in `ClienteConfiguration.cs` (`HasIndex(x => x.NIT).IsUnique()`) — otherwise TC-E2-P0-02 fails.
2. **`CreateClienteRequestValidator`** must be registered with FluentValidation's `AddValidatorsFromAssembly` in `Program.cs` — required for TC-E2-P0-03.
3. **`ClienteConfiguration.cs`** for the `contactos` FK must be `ON DELETE SET NULL` (`.OnDelete(DeleteBehavior.SetNull)`) — required for TC-E2-P0-04.
4. **`useCreateCliente.ts`** mutation `onSuccess` must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` — required for TC-E2-P0-05.
5. **`useDeleteCliente.ts`** mutation `onSuccess` must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` — required for TC-E2-P0-06.
6. **Sort state** must be local React `useState` in `ClienteListView` — the sorted list is a `useMemo` derived from `clientes` query data filtered by `searchQuery` and sorted by `sortOption`. The sort change must NOT call `invalidateQueries` or trigger any re-fetch.
7. **Filter function** must normalize both the search query and client fields using `String.prototype.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()` to satisfy TC-E2-P1-17.
8. **`SortControl`** component lives at `src/shared/components/SortControl` — it must expose `value` and `onChange` props and render all four identifiers: `nombre-asc`, `nombre-desc`, `fecha-desc` (default), `fecha-asc`.
9. **Toast text for delete with contacts** must be the exact string: `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` — the backend `DeleteClienteCommandHandler` should return a flag indicating whether contacts were orphaned, and the frontend mutation `onSuccess` should branch on this flag.
10. **`GET /api/v1/clientes`** must return a direct JSON array, not `{ data: [], meta: {} }` — architecture doc specifies direct array for list responses.
