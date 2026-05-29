---
epic: 2
title: "Client Management — Gestión de Clientes"
mode: epic-level
phase: 4
createdAt: "2026-05-29"
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

Epic 2 delivers the complete CRUD lifecycle for the `clientes` domain: listing with real-time search and client-side sort, deep-linked detail view, creation with required-field validation and NIT/RUC uniqueness enforcement, inline editing with pre-filled form, deletion with confirmation dialog and orphan-contact handling, and a SortControl (client-side, no extra API calls) covering four sort criteria. All stories build on the foundation established in Epic 1.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time filter (< 1s/500 records), EmptyState, ErrorPanel with retry |
| 2.2 | Client Detail View | Deep linking to `/clientes/:clienteId`, not-found handling |
| 2.3 | Create Client | Required-field validation (Zod + FluentValidation), NIT uniqueness (409), success toast, immediate list update |
| 2.4 | Edit Client | Pre-filled form, save reflects immediately, cancel preserves original data |
| 2.5 | Delete Client | Confirmation dialog, cancel preserves record, orphan contacts remain with `clienteId = null` |
| 2.6 | Sort Client List | Four sort options, client-side only (no API call), sort preserved over active search filter |

### Out of Scope for This Epic

- Contact management (Epic 3) — `ContactManager` integration deferred
- Client–Contact association (Epic 4)
- Server-side pagination — client-side filtering/sort on ≤ 500 records per NFR10
- Authentication / authorization — explicitly deferred (MVP)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness** not enforced: duplicate NITs silently inserted, corrupting data quality | High | Critical | P0 | API integration test: POST duplicate NIT → assert 409 + `"El NIT/RUC ya está registrado"` message; no stack trace exposed |
| R2 | **Required-field validation bypass**: Zod schema allows empty string or whitespace-only values, or FluentValidation not wired in pipeline | High | High | P0 | Unit (Zod schema) + API integration (submit empty body → 400 + `errors` object); form not submitted to backend |
| R3 | **Orphan contacts not unassigned on delete**: `ON DELETE CASCADE` mistakenly used instead of `ON DELETE SET NULL`, destroying contact records when client deleted | Medium | Critical | P0 | API integration test: create client + contacts, delete client, assert contacts still exist with `clienteId = null` |
| R4 | **TanStack Query cache not invalidated** after mutation: list does not reflect create/update/delete without page refresh (violates FR27 / NFR2) | High | High | P0 | Component test: mock API, call mutation hook, assert `['clientes']` query key is invalidated and list re-renders with updated data |
| R5 | **SortControl triggers extra API call**: sort implemented via `useQuery` param change instead of local `useState` on cached data, causing unnecessary network requests | Medium | Medium | P1 | Component test: spy on API client, change sort option four times, assert zero additional GET calls |
| R6 | **Search filter cleared when sort changes**: `setSearchQuery('')` called inside sort handler, losing active search state (AC-E2.6) | Medium | Medium | P1 | Component test: set search query, change sort, assert search input value unchanged and filtered+sorted list is correct |
| R7 | **Deep-link not-found unhandled**: navigating to `/clientes/non-existent-id` throws unhandled error instead of showing graceful not-found message | Medium | High | P1 | Component/E2E test: navigate to invalid `clienteId` route, assert not-found UI renders; no JS error thrown |
| R8 | **Pre-filled form shows stale data**: `useCliente(id)` cache returns outdated object if `invalidateQueries` not called after edit, so re-opening the form shows old values | Medium | Medium | P1 | Component test: update client, reopen edit form, assert fields show updated values from re-fetched data |
| R9 | **Confirmation dialog bypass**: delete executes immediately on button click without waiting for confirmation (AC-2.5) | Low | High | P1 | Component test: click "Eliminar", assert API DELETE not called yet; click "Cancelar", assert record unchanged; then confirm and verify deletion |
| R10 | **EmptyState not shown on zero records**: list renders empty `<ul>` instead of the `EmptyState` component when no clients exist | Low | Medium | P2 | Component test: render with empty array, assert `EmptyState` component visible |
| R11 | **ErrorPanel missing "Reintentar" button** or `refetch` not wired to it, so user cannot recover from transient backend failure | Low | Medium | P2 | Component test: simulate fetch error, assert `ErrorPanel` with retry button present; click retry, assert `refetch` invoked |
| R12 | **toast messages in wrong language** (English instead of Spanish), violating corporate standard | Low | Low | P2 | Unit/component test: assert toast text equals Spanish literal per story ACs |

### Top 3 Risk Areas for Epic 2

1. **Data integrity: NIT uniqueness + orphan contacts on delete** (R1, R3) — these are destructive failures that corrupt permanent data and cannot be recovered without manual intervention.
2. **TanStack Query mutation invalidation** (R4) — if `invalidateQueries(['clientes'])` is missing or uses the wrong key, all CRUD operations appear to succeed but the UI is stale, breaking FR27 and NFR2 silently.
3. **Required-field validation on both layers** (R2) — gaps in either Zod schema (frontend) or FluentValidation (backend) allow malformed data to reach the database, causing downstream failures across multiple epics.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)             ▌▌▌▌                  3 tests
  API Integration (xUnit)      ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   13 tests
  Component (Vitest + RTL)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  18 tests
  Unit (Vitest / xUnit)        ▌▌▌▌▌▌▌▌              8 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                                42 tests
```

### Rationale

- **Component tests dominate** (18) because Epic 2 is heavily UI-driven: form validation, state transitions (list → detail → form → toast), confirmation dialogs, EmptyState/ErrorPanel, and SortControl all need UI-level verification without a live backend.
- **API Integration tests are second** (13) because the backend validation rules (NIT uniqueness, required fields, orphan-contact FK behavior) must be verified against a real database with real HTTP responses.
- **E2E tests are targeted** (3) covering the most important cross-stack flows: full create flow, deep-link to detail, and full delete-with-orphan flow. These validate the integration of TanStack Router + TanStack Query + backend in one pass.
- **Unit tests** (8) cover isolated logic: Zod schemas, FluentValidation validators, sort comparator function, and toast message constants — fast and deterministic.

### Tool Mapping by Level

| Level | Tool | Scope |
|-------|------|-------|
| E2E | Playwright | Full browser stack — real frontend + real backend |
| API Integration | xUnit + WebApplicationFactory + TestContainers (Postgres) | HTTP endpoints, DB constraints |
| Component | Vitest + @testing-library/react + MSW | UI components with mocked API |
| Unit | Vitest (frontend) / xUnit (backend) | Pure logic: Zod schemas, validators, sort function |

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: FluentValidation Rejects Empty Required Fields (Backend)

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4, FR8, NFR5
**Risk covered:** R2

**Precondition:** Backend running with `siesa_agents_db` migrated (Epic 1 complete). `CreateClienteRequestValidator` wired via FluentValidation pipeline in `SiesaAgents.Application`.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{}` (empty object).
2. POST `/api/v1/clientes` with body `{ "nombre": "", "nit": "", "telefono": "", "ciudad": "" }` (all empty strings).
3. POST `/api/v1/clientes` with body `{ "nombre": "  ", "nit": "  ", "telefono": "", "ciudad": "" }` (whitespace-only).

**Expected Result:**
- HTTP 400 for all three requests.
- `Content-Type: application/problem+json`.
- Response body contains `errors` object with at least one entry per missing required field.
- No record inserted in `clientes` table.
- No stack trace or raw C# exception in response body.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P0-02: NIT/RUC Uniqueness Enforced (Backend Returns 409)

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4 (Story 2.3 AC), FR7, NFR6
**Risk covered:** R1

**Precondition:** One client with NIT `"900123456"` already exists in the database.

**Test Steps:**
1. POST `/api/v1/clientes` with `{ "nombre": "Empresa B", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá" }`.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Response `detail` contains `"El NIT/RUC ya está registrado"` (exact Spanish text, no technical details).
- No new record inserted in `clientes` table.
- No stack trace in response.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-03: Zod Schema Rejects Empty Required Fields (Frontend)

**Level:** Unit
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** `clienteSchema.ts` Zod schema exported from `src/modules/crm/clientes/application/clienteSchema.ts`.

**Test Steps:**
1. Call `clienteSchema.parse({})` — expect ZodError.
2. Call `clienteSchema.parse({ nombre: '', nit: '', telefono: '', ciudad: '' })` — expect ZodError.
3. Call `clienteSchema.parse({ nombre: '  ', nit: '  ', telefono: '3001234567', ciudad: 'Bogotá' })` — expect ZodError (whitespace trimming).
4. Call `clienteSchema.parse({ nombre: 'Empresa A', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá' })` — expect success.

**Expected Result:**
- Cases 1–3: Zod throws `ZodError` with issues targeting the corresponding fields.
- Case 4: Parses without error and returns a valid object.

**Automation:** Vitest unit test.

---

#### TC-E2-P0-04: Delete Client Does Not Delete Associated Contacts (Orphan Integrity)

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 (orphan contacts remain with `clienteId = null`)
**Risk covered:** R3

**Precondition:** One client with two associated contacts exists in the database. `ContactoConfiguration` uses `ON DELETE SET NULL` for `cliente_id` FK.

**Test Steps:**
1. Record `clienteId` and both `contactoId`s.
2. DELETE `/api/v1/clientes/{clienteId}`.
3. GET `/api/v1/contactos/{contactoId1}` and GET `/api/v1/contactos/{contactoId2}`.

**Expected Result:**
- DELETE returns 204 No Content.
- Both contacts still exist (200 OK with full contact data).
- Both contacts have `clienteId: null` in the response body.
- `clientes` table has zero rows for the deleted `clienteId`.
- `contactos` table retains both rows with `cliente_id = NULL`.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P0-05: TanStack Query Cache Invalidated After Create Mutation

**Level:** Component
**Story:** 2.3
**Requirement:** FR27, NFR2
**Risk covered:** R4

**Precondition:** `ClienteListView` rendered with MSW mocking `GET /api/v1/clientes` returning 2 clients. `useCreateCliente` mutation configured with `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })`.

**Test Steps:**
1. Render `<ClienteListView>` inside a `QueryClientProvider` with MSW handler.
2. Assert initial list shows 2 items.
3. Trigger `useCreateCliente` mutation with valid new client data.
4. MSW intercepts POST, returns 201 with new client.
5. MSW updates GET handler to return 3 clients.
6. Assert list now shows 3 items without page reload.

**Expected Result:**
- After mutation `onSuccess`, the `['clientes']` query is invalidated.
- List re-renders with the new client included.
- No manual `window.location.reload()` call occurs.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-06: TanStack Query Cache Invalidated After Update Mutation

**Level:** Component
**Story:** 2.4
**Requirement:** FR27, NFR2
**Risk covered:** R4

**Precondition:** `ClienteDetailView` rendered with a client. `useUpdateCliente` mutation configured with `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })`.

**Test Steps:**
1. Render `<ClienteDetailView clienteId="uuid-1">` with MSW returning client data.
2. Trigger `useUpdateCliente` mutation with updated `nombre`.
3. MSW intercepts PUT, returns 200 with updated data.
4. MSW updates GET handler to return updated client.
5. Assert detail view reflects updated name.

**Expected Result:**
- After mutation `onSuccess`, both `['clientes']` and `['clientes', id]` query keys are invalidated.
- Detail view re-renders with updated `nombre` without manual refresh.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-07: TanStack Query Cache Invalidated After Delete Mutation

**Level:** Component
**Story:** 2.5
**Requirement:** FR27, NFR2
**Risk covered:** R4

**Precondition:** Client list with 2 clients. `useDeleteCliente` mutation configured with `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })`.

**Test Steps:**
1. Render `<ClienteListView>` with 2 clients via MSW.
2. Trigger `useDeleteCliente` mutation for `clienteId-1`.
3. MSW intercepts DELETE, returns 204.
4. MSW updates GET handler to return 1 client.
5. Assert list now shows 1 item.

**Expected Result:**
- `['clientes']` query key invalidated on success.
- Deleted client no longer appears in list.
- Right panel returns to empty/default state.

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

---

#### TC-E2-P1-01: Real-Time Search Filters Client List (Frontend Component)

**Level:** Component
**Story:** 2.1
**Requirement:** AC-E2.2, FR3, FR4, NFR1
**Risk covered:** —

**Precondition:** `ClienteListView` with 5 pre-loaded clients (names and NITs vary). Search field wired to `setSearchQuery` local state. `useMemo` filter on `['clientes']` cache.

**Test Steps:**
1. Render `<ClienteListView>` with 5 clients.
2. Type `"Empresa A"` in search field.
3. Assert only clients matching "Empresa A" (by nombre or NIT) are visible.
4. Clear search field.
5. Assert all 5 clients are visible again.

**Expected Result:**
- Filtered list updates synchronously on each keystroke.
- Filter matches on `nombre` OR `nit` fields (case-insensitive).
- No additional GET request made during filtering.
- Empty search restores full list.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Search Returns Results in Under 1 Second with 500 Records

**Level:** Component / Performance
**Story:** 2.1
**Requirement:** AC-E2.2, NFR1
**Risk covered:** —

**Precondition:** TanStack Query cache pre-loaded with 500 client records (generated via test factory).

**Test Steps:**
1. Pre-load `queryClient` with 500 mock clients.
2. Render `<ClienteListView>` — assert all 500 rendered.
3. Measure: `performance.now()` before → type search query → `performance.now()` after re-render.
4. Assert elapsed time < 1000ms.

**Expected Result:**
- Filter completes and list re-renders in < 1000ms with 500 records.
- Client-side `useMemo` filter achieves < 50ms typical (well under threshold).

**Automation:** Vitest + RTL with `performance.now()` timing assertion.

---

#### TC-E2-P1-03: EmptyState Shown When No Clients Exist

**Level:** Component
**Story:** 2.1
**Requirement:** Story 2.1 AC (empty state), AC-E2.1
**Risk covered:** R10

**Precondition:** MSW returns `[]` for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteListView>` with empty response.
2. Assert `EmptyState` component is visible.
3. Assert EmptyState contains a message guiding user to create first client.
4. Assert no empty `<ul>` or blank div rendered.

**Expected Result:**
- `EmptyState` component visible.
- Message text present (Spanish).
- No scrollable list element with zero items.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: ErrorPanel with Retry Shown on Backend Failure

**Level:** Component
**Story:** 2.1
**Requirement:** Story 2.1 AC (error state)
**Risk covered:** R11

**Precondition:** MSW configured to return 500 for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteListView>` with failing GET handler.
2. Assert `ErrorPanel` component is visible (not a blank screen or JS error).
3. Assert "Reintentar" button present inside `ErrorPanel`.
4. Click "Reintentar".
5. Assert `refetch` / `queryClient.invalidateQueries` is triggered (MSW handler called again).

**Expected Result:**
- `ErrorPanel` visible on load failure.
- "Reintentar" button calls `refetch`.
- No unhandled JS exception thrown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: Client Detail Loads on Item Click and URL Updates

**Level:** Component
**Story:** 2.2
**Requirement:** Story 2.2 AC, FR5, FR30
**Risk covered:** —

**Precondition:** `ClienteListView` with 2 clients. TanStack Router configured with `/clientes/:clienteId` route.

**Test Steps:**
1. Render router with `/clientes` path.
2. Click on first client item in list.
3. Assert URL changes to `/clientes/{clienteId}`.
4. Assert right panel shows Nombre, NIT/RUC, Teléfono, Ciudad for the selected client.

**Expected Result:**
- URL updated to `/clientes/{clienteId}` (deep link enabled).
- Right panel shows all 4 required fields.
- No full page reload (SPA navigation).

**Automation:** Vitest + RTL + TanStack Router test utilities.

---

#### TC-E2-P1-06: Direct URL Deep Link to /clientes/:clienteId (E2E)

**Level:** E2E
**Story:** 2.2
**Requirement:** AC-E2.3 (detail view), FR30, Story 2.2 AC
**Risk covered:** R7

**Precondition:** Frontend dev server + backend running. One client with known `clienteId` exists.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{known-clienteId}`.
2. Wait for page to render.
3. Assert client detail panel displays the correct Nombre.

**Expected Result:**
- Client detail loads correctly via direct URL.
- No redirect to home or blank screen.
- Nombre, NIT/RUC, Teléfono, Ciudad all visible.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-07: Non-Existent clienteId Shows Graceful Not-Found

**Level:** Component
**Story:** 2.2
**Requirement:** Story 2.2 AC (not-found handling)
**Risk covered:** R7

**Precondition:** MSW returns 404 for `GET /api/v1/clientes/non-existent-id`.

**Test Steps:**
1. Navigate router to `/clientes/non-existent-id`.
2. MSW intercepts GET → returns 404.
3. Assert a not-found message component renders.
4. Assert no unhandled JS exception or blank screen.
5. Assert navigation shell (NavigationRail) remains visible.

**Expected Result:**
- Not-found UI component renders gracefully.
- No JS error in console.
- App shell remains functional.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Create Client Form Opens and Submits Successfully (E2E)

**Level:** E2E
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR27
**Risk covered:** —

**Precondition:** Frontend + backend running. Database empty or has no client with NIT `"123456789"`.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Assert form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad.
4. Fill in all fields with valid data.
5. Click submit.
6. Assert success toast: `"Cliente creado correctamente"`.
7. Assert new client appears in the list immediately (no reload).

**Expected Result:**
- Form opens on button click.
- POST request sent to `/api/v1/clientes` with correct payload.
- 201 response received.
- Client appears in list immediately after creation.
- Success toast shown with exact Spanish text.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-09: Create Form Shows Inline Errors on Empty Required Fields (Frontend)

**Level:** Component
**Story:** 2.3
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** `ClienteForm` rendered in create mode.

**Test Steps:**
1. Render `<ClienteForm mode="create">`.
2. Click submit button without filling any field.
3. Assert inline error messages appear on Nombre, NIT/RUC, Teléfono, Ciudad fields.
4. Assert no POST request was made (MSW spy shows zero calls).

**Expected Result:**
- Four inline error messages visible, one per empty required field.
- Backend not called (Zod validation blocks submission).
- Form remains open and interactive.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: Edit Form Pre-Fills Current Values

**Level:** Component
**Story:** 2.4
**Requirement:** Story 2.4 AC, FR6
**Risk covered:** R8

**Precondition:** `ClienteForm` rendered in edit mode with `defaultValues` from a known client: `{ nombre: "Empresa A", nit: "900123456", telefono: "3001234567", ciudad: "Bogotá" }`.

**Test Steps:**
1. Render `<ClienteForm mode="edit" defaultValues={knownClient}>`.
2. Assert Nombre input value equals `"Empresa A"`.
3. Assert NIT/RUC input value equals `"900123456"`.
4. Assert Teléfono input value equals `"3001234567"`.
5. Assert Ciudad input value equals `"Bogotá"`.

**Expected Result:**
- All four inputs are pre-filled with the current client values.
- No empty or placeholder values on open.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-11: Edit Client Saves and Reflects Changes Immediately

**Level:** Component
**Story:** 2.4
**Requirement:** Story 2.4 AC, FR6, FR27
**Risk covered:** R8

**Precondition:** `ClienteForm` in edit mode. MSW handles `PUT /api/v1/clientes/{id}` → 200 with updated data.

**Test Steps:**
1. Render edit form pre-filled with client data.
2. Clear `nombre` field and type `"Empresa Actualizada"`.
3. Click submit.
4. Assert success toast: `"Cliente actualizado correctamente"`.
5. Assert client detail panel shows `"Empresa Actualizada"`.
6. Assert PUT was called once with correct body.

**Expected Result:**
- PUT request sent with updated `nombre`.
- Toast shows `"Cliente actualizado correctamente"`.
- Detail view updates immediately via query invalidation.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Cancel Edit Preserves Original Data

**Level:** Component
**Story:** 2.4
**Requirement:** Story 2.4 AC (cancel behavior)
**Risk covered:** —

**Precondition:** `ClienteForm` in edit mode, `nombre = "Empresa A"`.

**Test Steps:**
1. Render edit form with `nombre = "Empresa A"`.
2. Clear Nombre and type `"Empresa Modificada"`.
3. Click "Cancelar".
4. Assert form closes.
5. Assert client detail still shows `"Empresa A"`.
6. Assert no PUT request made.

**Expected Result:**
- Form closes without saving.
- Original data unchanged in detail view and list.
- No API call made.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Delete Client — Confirmation Dialog Appears Before Deletion

**Level:** Component
**Story:** 2.5
**Requirement:** Story 2.5 AC (confirmation required)
**Risk covered:** R9

**Precondition:** `ClienteDetailView` with one client loaded.

**Test Steps:**
1. Render `<ClienteDetailView>` with client data.
2. Click "Eliminar" button.
3. Assert confirmation dialog appears with text `"¿Eliminar este cliente?"`.
4. Assert "Confirmar" and "Cancelar" buttons present.
5. Assert no DELETE request has been made yet.

**Expected Result:**
- Dialog visible immediately on click.
- No API call until confirmation.
- Both action buttons present in dialog.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: Cancel in Delete Dialog Preserves Client

**Level:** Component
**Story:** 2.5
**Requirement:** Story 2.5 AC (cancel preserves record)
**Risk covered:** R9

**Precondition:** Confirmation dialog open.

**Test Steps:**
1. Open confirmation dialog for a client.
2. Click "Cancelar".
3. Assert dialog closes.
4. Assert client still appears in the list.
5. Assert no DELETE request made.

**Expected Result:**
- Dialog closed.
- Client record unchanged.
- No API call made.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Confirm Delete — Client Removed, Toast Shown, Panel Reset

**Level:** Component
**Story:** 2.5
**Requirement:** Story 2.5 AC, FR7, FR27, AC-E2.5
**Risk covered:** R4

**Precondition:** Client detail view open, MSW handles `DELETE /api/v1/clientes/{id}` → 204.

**Test Steps:**
1. Click "Eliminar", then "Confirmar".
2. Assert DELETE called once.
3. Assert client removed from list immediately.
4. Assert right panel returns to empty/default state.
5. Assert success toast: `"Cliente eliminado correctamente"`.

**Expected Result:**
- DELETE request sent exactly once.
- List updates immediately (query invalidated).
- Right panel cleared.
- Toast text matches Spanish literal.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-16: Delete Client with Associated Contacts Shows Orphan Toast

**Level:** Component
**Story:** 2.5
**Requirement:** Story 2.5 AC (orphan contacts message)
**Risk covered:** R3

**Precondition:** MSW configured: DELETE `/api/v1/clientes/{id}` returns 204 and the response (or subsequent GET contacts) indicates contacts were unassigned. `useDeleteCliente` hook detects orphaned contacts via a response flag or subsequent query.

**Test Steps:**
1. Render with client that has 2 associated contacts (MSW pre-configured).
2. Confirm deletion.
3. Assert toast text: `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."`.

**Expected Result:**
- Specific orphan-contacts toast shown (not the generic deletion toast).
- Contacts remain accessible with `clienteId = null`.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-17: SortControl Does Not Trigger API Calls

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6, Story 2.6 Technical Context
**Risk covered:** R5

**Precondition:** `ClienteListView` with `SortControl` rendered. 3 clients loaded via MSW. API spy tracks GET calls.

**Test Steps:**
1. Render `<ClienteListView>` — MSW GET called once (initial load).
2. Select "Nombre A→Z" from `SortControl`.
3. Select "Nombre Z→A" from `SortControl`.
4. Select "Más reciente" from `SortControl`.
5. Select "Más antiguo" from `SortControl`.
6. Assert total GET calls to `/api/v1/clientes` equals 1 (only initial load).

**Expected Result:**
- Exactly 1 API call total (initial fetch only).
- All 4 sort changes execute client-side with no network requests.

**Automation:** Vitest + RTL + MSW with request counter spy.

---

#### TC-E2-P1-18: Sort Preserves Active Search Filter

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6
**Risk covered:** R6

**Precondition:** `ClienteListView` with 5 clients. 3 match a search term. Sort currently "Más reciente".

**Test Steps:**
1. Render list with 5 clients.
2. Type `"A"` in search field — 3 clients visible.
3. Assert search input value is `"A"` and 3 results shown.
4. Change sort to "Nombre A→Z".
5. Assert search input still contains `"A"`.
6. Assert 3 results still shown (same filtered set, now sorted).

**Expected Result:**
- `searchQuery` state not cleared on sort change.
- Sorted list is applied to the already-filtered subset.
- Search input field retains its value.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-19: Default Sort Order is "Más reciente" on Initial Load

**Level:** Component
**Story:** 2.6
**Requirement:** Story 2.6 AC (default sort)
**Risk covered:** —

**Precondition:** `SortControl` rendered without prior sort preference. MSW returns 3 clients with distinct `createdAt` values.

**Test Steps:**
1. Render `<ClienteListView>` with no persisted sort preference.
2. Assert `SortControl` shows "Más reciente" as selected option.
3. Assert list is ordered by `createdAt` descending (newest first).

**Expected Result:**
- `SortControl` default selection is `fecha-desc` ("Más reciente").
- List order matches `createdAt` descending at initial render.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-20: All Four Sort Options Reorder List Correctly

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6
**Risk covered:** —

**Precondition:** 3 clients: `{ nombre: "Empresa C", createdAt: T-1 }`, `{ nombre: "Empresa A", createdAt: T-3 }`, `{ nombre: "Empresa B", createdAt: T-2 }` (where T-3 is oldest, T-1 is newest).

**Test Steps:**
1. Select "Nombre A→Z" → assert order: A, B, C.
2. Select "Nombre Z→A" → assert order: C, B, A.
3. Select "Más reciente" (`fecha-desc`) → assert order: C (T-1), B (T-2), A (T-3).
4. Select "Más antiguo" (`fecha-asc`) → assert order: A (T-3), B (T-2), C (T-1).

**Expected Result:**
- Each sort option produces the correct ordering per its definition.
- Transitions are immediate (client-side).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-21: CRUD API Endpoints — Full HTTP Integration (Backend)

**Level:** API Integration
**Story:** 2.1, 2.2, 2.3, 2.4, 2.5
**Requirement:** FR1–FR7, NFR2
**Risk covered:** —

**Precondition:** Backend running with `siesa_agents_db`. `WebApplicationFactory<Program>` + TestContainers Postgres.

**Test Steps:**
1. GET `/api/v1/clientes` with empty DB → 200, empty array `[]`.
2. POST `/api/v1/clientes` with valid body → 201 + created object with `id` (UUID) and `createdAt` (ISO 8601).
3. GET `/api/v1/clientes` → 200, array with 1 client.
4. GET `/api/v1/clientes/{id}` → 200, full client object.
5. PUT `/api/v1/clientes/{id}` with updated `nombre` → 200, updated object.
6. GET `/api/v1/clientes/{id}` → 200, reflects updated `nombre`.
7. DELETE `/api/v1/clientes/{id}` → 204.
8. GET `/api/v1/clientes/{id}` → 404.

**Expected Result:**
- All 8 sub-steps produce expected HTTP status codes.
- Created object has `id` as UUID format.
- `createdAt` and `updatedAt` are ISO 8601 with timezone.
- Response body is camelCase JSON (no PascalCase keys).

**Automation:** xUnit integration test (single test method with sequential assertions or parameterized).

---

#### TC-E2-P1-22: GET /api/v1/clientes/{id} Returns 404 for Non-Existent ID

**Level:** API Integration
**Story:** 2.2
**Requirement:** Story 2.2 AC (not-found), FR5
**Risk covered:** R7

**Precondition:** Backend running. No client with `id = "00000000-0000-0000-0000-000000000000"`.

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.

**Expected Result:**
- HTTP 404.
- `Content-Type: application/problem+json`.
- `title` or `detail` indicates resource not found.
- No stack trace in response.

**Automation:** xUnit integration test.

---

### P2 — Should Pass Before Epic Is Marked Complete

---

#### TC-E2-P2-01: Create Client — Toast Text Matches Spanish Literal

**Level:** Component
**Story:** 2.3
**Requirement:** Story 2.3 AC, corporate standard (Spanish UI)
**Risk covered:** R12

**Test Steps:**
1. Trigger `useCreateCliente` mutation `onSuccess` callback directly (unit test of the hook).
2. Assert toast message is exactly `"Cliente creado correctamente"`.

**Expected Result:**
- Toast message equals `"Cliente creado correctamente"` (case-sensitive).

**Automation:** Vitest unit test for mutation hook.

---

#### TC-E2-P2-02: Update Client — Toast Text Matches Spanish Literal

**Level:** Component
**Story:** 2.4
**Requirement:** Story 2.4 AC
**Risk covered:** R12

**Test Steps:**
1. Trigger `useUpdateCliente` mutation `onSuccess` callback.
2. Assert toast message is exactly `"Cliente actualizado correctamente"`.

**Expected Result:**
- Toast equals `"Cliente actualizado correctamente"`.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-03: Delete Client — Toast Text Matches Spanish Literal

**Level:** Component
**Story:** 2.5
**Requirement:** Story 2.5 AC
**Risk covered:** R12

**Test Steps:**
1. Trigger `useDeleteCliente` mutation `onSuccess` callback (no orphan contacts).
2. Assert toast message is exactly `"Cliente eliminado correctamente"`.

**Expected Result:**
- Toast equals `"Cliente eliminado correctamente"`.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-04: Sort Comparator Function Unit Tests

**Level:** Unit
**Story:** 2.6
**Requirement:** Story 2.6 Technical Context
**Risk covered:** —

**Precondition:** Sort utility/comparator function extracted to `src/shared/components/SortControl/sortUtils.ts` (or similar).

**Test Steps:**
1. Test `sortClientes(clients, 'nombre-asc')` → alphabetical ascending.
2. Test `sortClientes(clients, 'nombre-desc')` → alphabetical descending.
3. Test `sortClientes(clients, 'fecha-desc')` → newest first.
4. Test `sortClientes(clients, 'fecha-asc')` → oldest first.
5. Test with single item — no mutation.
6. Test with identical names (tiebreak: stable order).

**Expected Result:**
- All four sort modes produce deterministic correct ordering.
- Pure function with no side effects.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-05: FluentValidation — Validator Unit Tests (Backend)

**Level:** Unit
**Story:** 2.3, 2.4
**Requirement:** FR7, FR8, NFR5
**Risk covered:** R2

**Precondition:** `CreateClienteRequestValidator` and `UpdateClienteRequestValidator` instantiable without DI.

**Test Steps:**
1. Validate `CreateClienteRequest` with missing `Nombre` → expect validation failure on `Nombre`.
2. Validate with missing `Nit` → failure on `Nit`.
3. Validate with missing `Telefono` → failure on `Telefono`.
4. Validate with missing `Ciudad` → failure on `Ciudad`.
5. Validate all fields present and non-empty → success.
6. Validate `Nombre` = whitespace only → failure.

**Expected Result:**
- Each missing/whitespace field triggers a validation error on the correct field name.
- Valid request passes with no errors.

**Automation:** xUnit unit test (`new CreateClienteRequestValidator().Validate(...)` directly).

---

#### TC-E2-P2-06: Full Delete Flow with Orphan Contacts (E2E)

**Level:** E2E
**Story:** 2.5
**Requirement:** Story 2.5 AC (orphan contacts), FR23
**Risk covered:** R3

**Precondition:** Frontend + backend running. One client with 2 contacts exists. (Epic 3 may be needed for contact creation — this test can be deferred if Epic 3 not yet implemented; otherwise use seeded data.)

**Test Steps:**
1. Navigate to client detail page via `http://localhost:5173/clientes/{clienteId}`.
2. Click "Eliminar" → confirm in dialog.
3. Assert toast: `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."`.
4. Navigate to `/contactos` and search for former contacts.
5. Assert contacts still exist and show `clienteId = null` (no associated client).

**Expected Result:**
- Client deleted, contacts survive.
- Orphan-specific toast shown.
- Contacts appear with no associated client in the contacts section.

**Automation:** Playwright E2E (can be marked as deferred until Epic 3 contacts can be created via UI).

---

#### TC-E2-P2-07: Edit Form Shows Inline Error on Required Field Cleared

**Level:** Component
**Story:** 2.4
**Requirement:** Story 2.4 AC, FR8, AC-E2.4
**Risk covered:** R2

**Test Steps:**
1. Render `<ClienteForm mode="edit" defaultValues={validClient}>`.
2. Clear `nombre` field (delete all text).
3. Click submit.
4. Assert inline error appears on `nombre` field.
5. Assert no PUT request made.

**Expected Result:**
- Inline error visible on cleared required field.
- Form not submitted.
- Backend not called.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-08: NIT/RUC Uniqueness — Frontend Shows Backend Error Without Stack Trace

**Level:** Component
**Story:** 2.3
**Requirement:** Story 2.3 AC (409 conflict handling), NFR6
**Risk covered:** R1

**Precondition:** MSW configured to return 409 with `{ detail: "El NIT/RUC ya está registrado" }` for POST.

**Test Steps:**
1. Render `<ClienteForm mode="create">`.
2. Fill all fields with a duplicate NIT.
3. Submit.
4. Assert error message `"El NIT/RUC ya está registrado"` displayed to user.
5. Assert no stack trace or technical error message shown.
6. Assert form remains open for correction.

**Expected Result:**
- User sees Spanish business error message, not a stack trace.
- Form stays open for user to correct the NIT.

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: Client List Items Show Nombre and NIT/RUC Per Item

**Level:** Component
**Story:** 2.1
**Requirement:** Story 2.1 AC (lista shows Nombre and NIT/RUC per item)
**Risk covered:** —

**Test Steps:**
1. Render `<ClienteListView>` with 2 known clients.
2. For each list item, assert `nombre` and `nit` are both visible as text.

**Expected Result:**
- Each list item displays both Nombre and NIT/RUC.

**Automation:** Vitest + RTL.

---

#### TC-E2-P3-02: Left Panel Is 280px Width on Desktop

**Level:** Component
**Story:** 2.1
**Requirement:** Story 2.1 AC (280px panel), architecture spec
**Risk covered:** —

**Test Steps:**
1. Render `<ClienteListView>` at 1280px viewport.
2. Assert the list panel has CSS width of 280px (or equivalent Tailwind class `w-[280px]` or `w-70`).

**Expected Result:**
- Panel width equals 280px at desktop breakpoint.

**Automation:** Vitest + RTL (`getComputedStyle` or class assertion).

---

#### TC-E2-P3-03: Backend Response Uses camelCase JSON Keys

**Level:** API Integration
**Story:** 2.1, 2.2
**Requirement:** Architecture spec (JSON camelCase convention)
**Risk covered:** —

**Test Steps:**
1. POST a valid client, capture 201 response.
2. Assert response body keys: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
3. Assert NO PascalCase keys present (e.g., no `Nombre`, `CreatedAt`).

**Expected Result:**
- All JSON keys are camelCase.
- `createdAt` and `updatedAt` are ISO 8601 strings with timezone.

**Automation:** xUnit integration test.

---

#### TC-E2-P3-04: Vitest Coverage Report for Clientes Module

**Level:** Unit
**Story:** All
**Requirement:** Quality gate
**Risk covered:** —

**Test Steps:**
1. Run `npx vitest run --coverage` scoped to `src/modules/crm/clientes/`.
2. Assert line/branch coverage ≥ 80% for `application/` layer (hooks + schema).

**Expected Result:**
- Coverage report generated.
- Application layer (hooks, schema) ≥ 80%.

**Automation:** Vitest coverage.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Stories | Test Cases | Status |
|-----------------|---------|------------|--------|
| AC-E2.1: Register client with Nombre, NIT, Teléfono, Ciudad → appears in list immediately | 2.3 | TC-E2-P0-05, TC-E2-P1-08, TC-E2-P1-09 | Covered |
| AC-E2.2: Search by nombre or NIT in < 1 second | 2.1 | TC-E2-P1-01, TC-E2-P1-02 | Covered |
| AC-E2.3: View detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-05, TC-E2-P1-06, TC-E2-P1-10, TC-E2-P1-11 | Covered |
| AC-E2.4: Prevent saving with empty required fields, clear error messages | 2.3, 2.4 | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-09, TC-E2-P2-07, TC-E2-P2-08 | Covered |
| AC-E2.5: Delete client, disappears from list | 2.5 | TC-E2-P0-07, TC-E2-P1-13, TC-E2-P1-14, TC-E2-P1-15 | Covered |
| AC-E2.6: Sort without page reload, filter preserved | 2.6 | TC-E2-P1-17, TC-E2-P1-18, TC-E2-P1-19, TC-E2-P1-20 | Covered |
| Story 2.1 — EmptyState on zero records | 2.1 | TC-E2-P1-03 | Covered |
| Story 2.1 — ErrorPanel with Reintentar on fetch failure | 2.1 | TC-E2-P1-04 | Covered |
| Story 2.2 — Deep link `/clientes/:clienteId` | 2.2 | TC-E2-P1-05, TC-E2-P1-06 | Covered |
| Story 2.2 — Not-found on invalid clienteId | 2.2 | TC-E2-P1-07, TC-E2-P1-22 | Covered |
| Story 2.3 — 409 NIT conflict shown as user-friendly message | 2.3 | TC-E2-P0-02, TC-E2-P2-08 | Covered |
| Story 2.3 — Toast "Cliente creado correctamente" | 2.3 | TC-E2-P2-01 | Covered |
| Story 2.4 — Pre-filled form on edit | 2.4 | TC-E2-P1-10 | Covered |
| Story 2.4 — Cancel preserves original data | 2.4 | TC-E2-P1-12 | Covered |
| Story 2.4 — Toast "Cliente actualizado correctamente" | 2.4 | TC-E2-P2-02 | Covered |
| Story 2.5 — Confirmation dialog required before delete | 2.5 | TC-E2-P1-13 | Covered |
| Story 2.5 — Cancel in dialog preserves record | 2.5 | TC-E2-P1-14 | Covered |
| Story 2.5 — Toast "Cliente eliminado correctamente" | 2.5 | TC-E2-P2-03 | Covered |
| Story 2.5 — Orphan contacts remain with clienteId=null | 2.5 | TC-E2-P0-04, TC-E2-P1-16, TC-E2-P2-06 | Covered |
| Story 2.6 — Default sort "Más reciente" | 2.6 | TC-E2-P1-19 | Covered |
| Story 2.6 — Four sort options work correctly | 2.6 | TC-E2-P1-20, TC-E2-P2-04 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Test Cases | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-01, TC-E2-P1-02 | Component + Performance |
| NFR2 | CRUD changes visible in < 2s | TC-E2-P0-05, TC-E2-P0-06, TC-E2-P0-07, TC-E2-P1-21 | Component + API Integration |
| NFR3 | 10 simultaneous users | Out of scope for Epic 2 — load tested at system level | N/A |
| NFR4 | HTTPS in non-local deployments | Out of scope (deployment concern) | N/A |
| NFR5 | Input validation / sanitization | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-03, TC-E2-P2-05 | Unit + API Integration |
| NFR6 | No stack traces exposed | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P1-22, TC-E2-P2-08 | API Integration + Component |
| NFR7 | Core tasks without training | TC-E2-P1-08 (E2E create flow) | E2E |
| NFR8 | ≤ 2 clicks to navigate to contact | Deferred — contacts not in Epic 2 scope | N/A (Epic 4) |
| NFR9 | Contact → client in zero clicks | Deferred — contacts not in Epic 2 scope | N/A (Epic 4) |
| NFR10 | 500 records / 10 users scale | TC-E2-P1-02 (500-record performance) | Component |
| NFR11 | No hardcoded limits in data layer | TC-E2-P1-21 (UUID PK verified in response) | API Integration |

---

## 7. Test Execution Order

```
Phase 1 — Unit Gate (P0, no DB, no rendering)
  1. TC-E2-P0-03  Zod schema rejects empty required fields
  2. TC-E2-P2-04  Sort comparator function unit tests
  3. TC-E2-P2-05  FluentValidation unit tests

Phase 2 — API Integration Gate (P0, DB required)
  4. TC-E2-P0-01  FluentValidation rejects empty fields via HTTP
  5. TC-E2-P0-02  NIT uniqueness enforced (409 response)
  6. TC-E2-P0-04  Delete client — orphan contacts survive (ON DELETE SET NULL)
  7. TC-E2-P1-21  Full CRUD HTTP integration (GET/POST/PUT/DELETE chain)
  8. TC-E2-P1-22  GET by non-existent ID returns 404
  9. TC-E2-P3-03  Response uses camelCase JSON keys

Phase 3 — Component Tests: List & Search (P0-P1)
 10. TC-E2-P0-05  Cache invalidated after create
 11. TC-E2-P0-06  Cache invalidated after update
 12. TC-E2-P0-07  Cache invalidated after delete
 13. TC-E2-P1-01  Real-time search filters list
 14. TC-E2-P1-02  Search < 1s with 500 records
 15. TC-E2-P1-03  EmptyState on zero records
 16. TC-E2-P1-04  ErrorPanel with retry on failure

Phase 4 — Component Tests: Detail & Forms (P1)
 17. TC-E2-P1-05  Detail panel loads on item click + URL update
 18. TC-E2-P1-07  Non-existent clienteId shows not-found
 19. TC-E2-P1-09  Create form shows inline errors on empty submit
 20. TC-E2-P1-10  Edit form pre-fills current values
 21. TC-E2-P1-11  Edit saves and reflects immediately
 22. TC-E2-P1-12  Cancel edit preserves original data
 23. TC-E2-P2-07  Edit form error on cleared required field
 24. TC-E2-P2-08  409 conflict shown without stack trace (component)

Phase 5 — Component Tests: Delete & Sort (P1)
 25. TC-E2-P1-13  Confirmation dialog appears before delete
 26. TC-E2-P1-14  Cancel in dialog preserves record
 27. TC-E2-P1-15  Confirm delete — list updated, toast shown
 28. TC-E2-P1-16  Delete with orphan contacts — specific toast
 29. TC-E2-P1-17  SortControl triggers zero API calls
 30. TC-E2-P1-18  Sort preserves active search filter
 31. TC-E2-P1-19  Default sort is "Más reciente"
 32. TC-E2-P1-20  All four sort options reorder correctly

Phase 6 — P2 Toast / Presentation Tests
 33. TC-E2-P2-01  Toast "Cliente creado correctamente"
 34. TC-E2-P2-02  Toast "Cliente actualizado correctamente"
 35. TC-E2-P2-03  Toast "Cliente eliminado correctamente"

Phase 7 — E2E Tests (P1-P2, full stack required)
 36. TC-E2-P1-06  Deep link to /clientes/:clienteId
 37. TC-E2-P1-08  Full create flow E2E
 38. TC-E2-P2-06  Full delete + orphan contacts E2E (defer if Epic 3 not done)

Phase 8 — P3 Coverage & Polish
 39. TC-E2-P3-01  List items show Nombre and NIT/RUC
 40. TC-E2-P3-02  Left panel is 280px on desktop
 41. TC-E2-P3-04  Vitest coverage ≥ 80% for clientes application layer
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Scope |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering + interactions | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW 2+ | API mocking for component tests | Frontend |
| Playwright 1.40+ | E2E tests (create, deep-link, delete flow) | Frontend + Backend |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing (no real server needed) | Backend |
| TestContainers (Postgres) | Isolated PostgreSQL for integration tests | Backend |
| FluentAssertions | Expressive assertions in xUnit tests | Backend |

### Test Data Strategy

**Backend integration tests:**
- Each test class uses `TestContainers` to spin up a fresh Postgres container (or a shared fixture with `IAsyncLifetime`).
- `WebApplicationFactory<Program>` overrides the `ConnectionString` to point to the container.
- Test factories: `ClienteEntityFactory` (generates valid `ClienteEntity` with UUID, unique NIT, valid fields).

**Frontend component tests:**
- MSW handlers defined per test (not globally), enabling per-test scenario control.
- `QueryClient` created fresh per test via `new QueryClient({ defaultOptions: { queries: { retry: false } } })`.
- Viewport simulation via `jsdom` configuration in `vitest.config.ts`.

**E2E tests (Playwright):**
- Use Playwright fixtures to seed database state via API calls before each test.
- Clean database state after each test via `DELETE /api/v1/clientes` or direct DB truncation fixture.

### Environment Prerequisites

```
- Node.js 20+ with npm (frontend)
- .NET 10 SDK (backend)
- PostgreSQL 18+ running locally on port 5432 (for E2E and some integration tests)
- TestContainers-compatible Docker daemon (for isolated backend integration tests)
- Database user with CREATE DATABASE privilege
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- MSW installed: npm install -D msw
- Playwright browsers installed: npx playwright install
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 7 | 2.5 | 17.5 | DB constraints (orphan FK), dual-layer validation, query invalidation — complex setup |
| P1 | 22 | 1.5 | 33.0 | Standard component + API coverage — moderate complexity |
| P2 | 8 | 0.75 | 6.0 | Toast text assertions, validator units, E2E orphan |
| P3 | 4 | 0.5 | 2.0 | Polish: coverage report, panel width, response format |
| **Total** | **41** | — | **58.5 hours** | **~7.3 days** |

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% — all 7 P0 tests must pass before any story is closed.
- **P1 pass rate:** 100% — all 22 P1 tests must pass before Epic 2 is marked complete.
- **P2 pass rate:** ≥ 90% — deferred items require documented justification.
- **P3 pass rate:** ≥ 75% — informational; tracked but not blocking.

### Coverage Targets

| Target | Threshold | Measured By |
|--------|-----------|-------------|
| Clientes application layer (hooks + schema) | ≥ 80% | Vitest coverage |
| Backend validators (CreateClienteRequest, UpdateClienteRequest) | 100% | xUnit unit tests |
| API endpoints (all 5 CRUD verbs) | 100% | Integration test TC-E2-P1-21 |
| Risk items R1–R4 (critical) | 100% mitigated | P0 test suite |

### Non-Negotiable Requirements

- [ ] TC-E2-P0-01: FluentValidation blocks empty required fields via HTTP
- [ ] TC-E2-P0-02: Duplicate NIT returns 409 with Spanish message (no stack trace)
- [ ] TC-E2-P0-03: Zod schema rejects empty/whitespace fields
- [ ] TC-E2-P0-04: Delete client preserves contacts with `clienteId = null`
- [ ] TC-E2-P0-05: `['clientes']` query key invalidated after create
- [ ] TC-E2-P0-06: Query keys invalidated after update
- [ ] TC-E2-P0-07: Query keys invalidated after delete

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All 7 P0 test cases pass
- [ ] All 22 P1 test cases pass
- [ ] P2 test cases pass or are formally deferred with documented justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] `siesa_agents_db` has `clientes` table with correct snake_case columns: `id`, `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at`
- [ ] `ON DELETE SET NULL` verified on `contactos.cliente_id` FK (TC-E2-P0-04)
- [ ] TanStack Query invalidation pattern verified for all three mutations (create, update, delete)
- [ ] Zod schema and FluentValidation validators both reject empty/whitespace required fields
- [ ] All user-visible text (labels, errors, toasts, placeholders) is in Spanish

---

## 10. Notes for Story Implementation Agents

The following constraints are critical for tests to pass:

1. **`clienteSchema.ts` (Zod):** All four fields (`nombre`, `nit`, `telefono`, `ciudad`) must use `.min(1)` or `.trim().min(1)`. Whitespace-only strings must fail validation.

2. **`CreateClienteRequestValidator` / `UpdateClienteRequestValidator` (FluentValidation):** Use `NotEmpty()` and `NotWhiteSpace()` (or `Must(s => !string.IsNullOrWhiteSpace(s))`) for all required fields.

3. **`ClienteConfiguration.cs` (EF Core):** NIT must have a unique index: `builder.HasIndex(c => c.Nit).IsUnique()`. The `ContactoConfiguration` FK must be `ON DELETE SET NULL`: `.OnDelete(DeleteBehavior.SetNull)`.

4. **`DeleteClienteCommandHandler.cs`:** When a client is deleted, do NOT cascade to contacts. EF Core's `DeleteBehavior.SetNull` handles `contactos.cliente_id → NULL` automatically at the DB level.

5. **`useDeleteCliente.ts` / `useCreateCliente.ts` / `useUpdateCliente.ts`:** Each mutation's `onSuccess` must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`. Update mutation must also invalidate `['clientes', id]`.

6. **`SortControl` component:** Sort state must be local `React.useState` — no `useQueryState`, no URL param, no extra `useQuery` call. The four identifiers are exactly: `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`.

7. **`ClienteListView.tsx`:** Search and sort must be independent state values. Sort handler must NOT reset `searchQuery` to empty. The filtered result must be the input to the sort step.

8. **Toast messages:** Must use exact Spanish literals from ACs. Do not use English fallbacks or interpolated error messages for success toasts.

9. **Error handling in forms:** On 409 from backend, show `"El NIT/RUC ya está registrado"` extracted from `problem.detail`. Never show `error.message` directly.

10. **`ClienteEndpoints.cs`:** The `GetClienteById` endpoint handler must return `Results.NotFound()` (mapped to Problem Details by `ExceptionHandlingMiddleware` or a domain `NotFoundException`) when the entity is not found — not a 500.
