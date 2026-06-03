---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-03"
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

Epic 2 delivers the complete CRUD lifecycle for the client catalog: listing with real-time search, detail view with deep linking, creation and editing via a validated form, deletion with confirmation and contact-orphaning behavior, and client-side sorting by four criteria. The implementation spans the `clientes` module on the frontend (`ClienteListView`, `ClienteDetailView`, `ClienteForm`, `useClientes*` hooks, `clienteApiRepository`) and the backend (`ClienteEndpoints`, CQRS command/query handlers, `ClienteRepository`, FluentValidation validators, and the `clientes` PostgreSQL table).

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|--------------|
| 2.1 | Client List & Search | Real-time filter, EmptyState, ErrorPanel, 500-record performance |
| 2.2 | Client Detail View | Right-panel rendering, URL deep linking `/clientes/:id`, not-found handling |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), duplicate NIT/RUC 409, success toast, list update |
| 2.4 | Edit Client | Pre-fill form, required-field validation, cancel behavior, optimistic update |
| 2.5 | Delete Client | Confirmation dialog, contact orphaning (clienteId = null), toast variants, cascade safety |
| 2.6 | Sort Client List | Four sort criteria, client-side over cache, search+sort independence, default order |

### Out of Scope for This Epic

- Contact management (CRUD) — Epic 3
- Client-contact association — Epic 4
- Authentication / authorization — deferred (MVP)
- Server-side pagination — deferred (NFR11 future)
- HTTPS configuration — non-local deployments only (NFR4)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness not enforced** at backend: duplicate records silently created, violating business integrity | Medium | Critical | P0 | Integration test: POST two clients with same NIT → assert 409 Conflict + `"El NIT/RUC ya está registrado"` error detail |
| R2 | **FluentValidation not wired** in Minimal API pipeline: required-field validators bypass silently, 201 returned for empty Nombre/NIT | Medium | Critical | P0 | Integration test: POST with empty `nombre` → assert 400 + Problem Details with `errors.nombre` field |
| R3 | **TanStack Query `invalidateQueries(['clientes'])`** not called after mutation: created/edited/deleted client does not appear in list immediately (FR27, NFR2) | Medium | High | P0 | Component test: mock API success → assert list re-renders with new record without manual page refresh |
| R4 | **Client deletion does not orphan contacts**: `ON DELETE SET NULL` not applied on `fk_contactos_clientes` → contacts deleted or FK violation | Low | Critical | P0 | Integration test: create client + contacts → delete client → assert contacts exist with `cliente_id = null` |
| R5 | **Zod client-side validation does not prevent form submission** with empty required fields: backend receives invalid payload | Medium | High | P1 | Component test: submit empty form → assert error messages rendered AND `POST /api/v1/clientes` NOT called (MSW intercept absent) |
| R6 | **Real-time search filter performance** degrades beyond 100ms with 500 records due to inefficient `useMemo` dependency or re-render cascade | Low | High | P1 | Component test: render list with 500 mock clients → type in search → measure render time ≤ 150ms |
| R7 | **Deep linking `/clientes/:clienteId`** fails when navigated directly (SPA 404 or TanStack Router not matching `_app/clientes.$clienteId.tsx`) | Medium | High | P1 | E2E test: navigate directly to `/clientes/{uuid}` → assert detail panel renders with correct client data |
| R8 | **Sort does not persist over active search filter**: changing sort criteria clears `searchQuery` state or triggers new API fetch | Low | High | P1 | Component test: apply search → change sort → assert search input unchanged AND no new API call fired |
| R9 | **Delete confirmation dialog does not appear**: "Eliminar" click triggers immediate deletion without user confirmation | Medium | High | P1 | Component test: click "Eliminar" → assert dialog visible before any DELETE API call |
| R10 | **Cancel in edit form mutates state**: clicking "Cancelar" leaves form dirty data in component state, corrupting next open | Low | Medium | P2 | Component test: open edit → modify field → cancel → reopen → assert original values displayed |
| R11 | **Error panel not shown on fetch failure**: network error causes blank/crashed UI instead of `ErrorPanel` with "Reintentar" | Medium | Medium | P2 | Component test: MSW returns 500 on `GET /api/v1/clientes` → assert `ErrorPanel` rendered with retry button |
| R12 | **NIT/RUC 409 error message exposes internal details** to the user (raw exception, stack trace, or DB constraint name) | Low | Medium | P2 | Integration test: assert 409 body contains `"El NIT/RUC ya está registrado"` and does NOT contain `stackTrace` or DB constraint name |

### Top 3 Risk Areas for Epic 2

1. **Data integrity: NIT/RUC uniqueness + FluentValidation wiring** (R1, R2) — the two business rules with the highest consequence if missed. A duplicate NIT silently stored, or a client with empty Nombre saved, corrupts the core entity catalog with no visible failure at the time of creation.
2. **Contact orphaning on client deletion** (R4) — deleting a client must NOT cascade-delete its contacts. If `ON DELETE SET NULL` is absent from the EF Core configuration, either a FK violation crashes the endpoint or contacts silently disappear, violating the explicit story 2.5 acceptance criterion and FR23.
3. **TanStack Query cache invalidation** (R3) — if `invalidateQueries(['clientes'])` is omitted in any mutation's `onSuccess`, the list becomes stale immediately after create/edit/delete. Given FR27 requires changes to be visible immediately and NFR2 mandates < 2s UI update, this risk manifests every time the mutation succeeds.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)           ▌▌▌▌▌▌              3 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  16 tests
  Component (Vitest+RTL+MSW) ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  16 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌▌▌▌            8 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                            43 tests
```

### Rationale

- **API integration tests dominate** because Epic 2 has critical backend contracts: NIT uniqueness, FluentValidation wiring, deletion + orphaning, and HTTP response codes (201, 204, 400, 404, 409) must all be verified against the actual running API.
- **Component tests** cover the rich frontend behavior: form validation UX, real-time search, sort state management, optimistic updates, empty/error states, and dialog flows — all testable without a real backend via MSW.
- **E2E tests** are limited to the three scenarios that require real browser routing: deep linking, full create-to-list flow, and delete-with-confirmation end-to-end.
- **Unit tests** focus on pure logic: Zod schema validation, `useMemo` filter function, sort comparators, and backend command handler logic (NIT conflict detection).

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: POST /api/v1/clientes — Creates Client and Returns 201

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.1, FR4
**Risk covered:** —

**Precondition:** Backend running with `siesa_agents_db` migrated (includes `clientes` table). No existing client with the test NIT.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body:
   ```json
   { "nombre": "Empresa Test S.A.", "nit": "900123456-7", "telefono": "3001234567", "ciudad": "Bogotá" }
   ```
2. Inspect response.

**Expected Result:**
- HTTP status: 201 Created.
- Response body contains `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601), `updatedAt`.
- `Location` header or response body includes the new resource ID.
- No `stackTrace` or internal field in response.

**Automation:** xUnit — `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P0-02: POST /api/v1/clientes — Duplicate NIT Returns 409

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC — "NIT/RUC ya está registrado" (Story 2.3), NFR6
**Risk covered:** R1, R12

**Precondition:** Client with `nit = "900123456-7"` already exists in DB.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with the same `nit`.
2. Inspect response status and body.

**Expected Result:**
- HTTP status: 409 Conflict.
- `Content-Type: application/problem+json`.
- Body contains `"El NIT/RUC ya está registrado"` in `detail` or `errors` field.
- Body does NOT contain `stackTrace`, `exception`, or DB constraint names (`uk_clientes_nit`).

**Automation:** xUnit integration test.

---

#### TC-E2-P0-03: POST /api/v1/clientes — Empty Required Field Returns 400

**Level:** API Integration
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** Backend running with FluentValidation registered.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ "nombre": "", "nit": "900000000", "telefono": "300", "ciudad": "Medellín" }`.
2. POST `/api/v1/clientes` with body `{ "nombre": "Test", "nit": "", "telefono": "300", "ciudad": "Medellín" }`.
3. POST `/api/v1/clientes` with body `{}` (all fields missing).

**Expected Result (all three cases):**
- HTTP status: 400 Bad Request.
- `Content-Type: application/problem+json`.
- `errors` object contains the failing field key (e.g., `"nombre"`, `"nit"`).
- No client record created in DB.

**Automation:** xUnit integration test (three sub-cases).

---

#### TC-E2-P0-04: DELETE /api/v1/clientes/{id} — Contact Records Set to clienteId = null

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC Story 2.5 (contacts become unassigned), FR23
**Risk covered:** R4

**Precondition:** Client with `id = clienteUuid` exists. Two contacts with `clienteId = clienteUuid` exist.

**Test Steps:**
1. DELETE `/api/v1/clientes/{clienteUuid}`.
2. Assert DELETE returns 204.
3. GET `/api/v1/contactos` and filter by the previously associated contacts' IDs.
4. Inspect `clienteId` field on each contact.

**Expected Result:**
- DELETE returns HTTP 204 No Content.
- The two contacts still exist in the database.
- Both contacts have `clienteId = null` (unassigned).
- No contact was deleted.
- GET `/api/v1/clientes/{clienteUuid}` returns 404.

**Automation:** xUnit integration test with TestContainers Postgres.

---

#### TC-E2-P0-05: Component — Create Client Mutation Invalidates Query Cache

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR27, NFR2
**Risk covered:** R3

**Precondition:** MSW intercepts `POST /api/v1/clientes` → returns 201 with new client. MSW intercepts `GET /api/v1/clientes` → returns updated list including the new client on second call.

**Test Steps:**
1. Render `ClienteListView` with `QueryClientProvider` and MSW active.
2. Open "Nuevo cliente" form.
3. Fill all required fields and submit.
4. Wait for mutation `onSuccess` callback.
5. Assert `GET /api/v1/clientes` was called a second time (invalidation triggered).
6. Assert new client name appears in the rendered list.

**Expected Result:**
- After successful POST, the list re-fetches automatically.
- New client is visible in the list without a page reload.
- Success toast "Cliente creado correctamente" is visible.

**Automation:** Vitest + `@testing-library/react` + MSW + `@tanstack/react-query`.

---

#### TC-E2-P0-06: Component — Edit Client Mutation Invalidates Query Cache

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** FR5, FR27, NFR2
**Risk covered:** R3

**Precondition:** MSW intercepts `PUT /api/v1/clientes/{id}` → 200 with updated client. MSW intercepts `GET /api/v1/clientes` → updated list on re-fetch.

**Test Steps:**
1. Render `ClienteDetailView` with an existing client selected.
2. Click "Editar", modify `ciudad`, submit form.
3. Assert `PUT /api/v1/clientes/{id}` was called.
4. Assert `GET /api/v1/clientes` was called again (invalidation).
5. Assert updated `ciudad` appears in detail panel.

**Expected Result:**
- Updated client data reflected immediately in detail and list.
- Toast "Cliente actualizado correctamente" visible.
- No page reload required.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-07: Component — Delete Client Mutation Invalidates Query Cache

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** FR6, FR27, NFR2
**Risk covered:** R3

**Precondition:** MSW intercepts `DELETE /api/v1/clientes/{id}` → 204. MSW intercepts `GET /api/v1/clientes` → list without deleted client on re-fetch.

**Test Steps:**
1. Render `ClienteListView` + `ClienteDetailView` with one client selected.
2. Click "Eliminar", confirm in dialog.
3. Assert `DELETE /api/v1/clientes/{id}` called.
4. Assert `GET /api/v1/clientes` re-fetch triggered.
5. Assert deleted client no longer in list.
6. Assert right panel returns to empty/default state.

**Expected Result:**
- Client removed from list immediately.
- Right panel returns to default (no detail shown).
- Toast "Cliente eliminado correctamente" OR "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." visible.

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

---

#### TC-E2-P1-01: GET /api/v1/clientes — Returns List of All Clients

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR1, AC-E2.1

**Precondition:** Three clients seeded in DB.

**Test Steps:**
1. GET `/api/v1/clientes`.
2. Inspect response.

**Expected Result:**
- HTTP 200 OK.
- Response body is a JSON array.
- Array contains three elements, each with `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-02: GET /api/v1/clientes/{id} — Returns Single Client

**Level:** API Integration
**Story:** 2.2
**Requirement:** FR3, AC-E2.3

**Precondition:** Client with known UUID exists.

**Test Steps:**
1. GET `/api/v1/clientes/{knownUuid}`.

**Expected Result:**
- HTTP 200 OK.
- Body is the single client object with all four fields populated.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-03: GET /api/v1/clientes/{id} — Non-existent ID Returns 404

**Level:** API Integration
**Story:** 2.2
**Requirement:** AC Story 2.2 (not-found graceful message)

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.

**Expected Result:**
- HTTP 404 Not Found.
- `Content-Type: application/problem+json`.
- Body contains `status: 404` and a descriptive `detail` field.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-04: PUT /api/v1/clientes/{id} — Updates Client and Returns 200

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR5, AC-E2.3

**Precondition:** Client exists with `id = knownUuid`.

**Test Steps:**
1. PUT `/api/v1/clientes/{knownUuid}` with body `{ "nombre": "Empresa Actualizada", "nit": "900123456-7", "telefono": "3009999999", "ciudad": "Cali" }`.

**Expected Result:**
- HTTP 200 OK.
- Response body contains updated `ciudad: "Cali"` and `nombre: "Empresa Actualizada"`.
- `updatedAt` timestamp is newer than original.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-05: PUT /api/v1/clientes/{id} — Required Field Empty Returns 400

**Level:** API Integration
**Story:** 2.4
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Test Steps:**
1. PUT `/api/v1/clientes/{knownUuid}` with body `{ "nombre": "", "nit": "900123456-7", "telefono": "300", "ciudad": "Cali" }`.

**Expected Result:**
- HTTP 400 Bad Request.
- Problem Details with `errors.nombre` populated.
- Client record in DB unchanged.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-06: DELETE /api/v1/clientes/{id} — Returns 204 and Removes Client

**Level:** API Integration
**Story:** 2.5
**Requirement:** FR6, AC-E2.5

**Precondition:** Client exists (no associated contacts for this subcase).

**Test Steps:**
1. DELETE `/api/v1/clientes/{knownUuid}`.
2. GET `/api/v1/clientes/{knownUuid}`.

**Expected Result:**
- DELETE returns 204 No Content with no body.
- Subsequent GET returns 404.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-07: Component — Real-time Search Filters Client List

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** FR2, AC-E2.2
**Risk covered:** R6

**Precondition:** MSW returns 10 mock clients including one named "Banco Nacional" with `nit = "800100200-1"`.

**Test Steps:**
1. Render `ClienteListView` with query cache populated (10 clients).
2. Type "Banco" in the search field.
3. Assert only "Banco Nacional" is visible in the list.
4. Clear search input.
5. Assert all 10 clients are visible again.
6. Type "800100200" (NIT fragment).
7. Assert "Banco Nacional" is found by NIT.

**Expected Result:**
- List filters synchronously on each keystroke (no API call triggered for search).
- Only matching clients shown during filter.
- Clearing input restores full list.
- NIT-based filtering works independently of name search.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Component — EmptyState Rendered When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC Story 2.1 (EmptyState on empty list)

**Precondition:** MSW returns `GET /api/v1/clientes` → `[]` (empty array).

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for query to resolve.
3. Assert `EmptyState` component rendered.
4. Assert message guides user to create first client.

**Expected Result:**
- `EmptyState` visible with instructional message.
- No list items rendered.
- "Nuevo cliente" button or call-to-action visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: Component — ErrorPanel Rendered on Backend Unavailable

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC Story 2.1 (ErrorPanel on fetch failure)
**Risk covered:** R11

**Precondition:** MSW returns `GET /api/v1/clientes` → network error (500 or timeout).

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for query error.
3. Assert `ErrorPanel` component rendered.
4. Assert "Reintentar" button is visible and interactive.

**Expected Result:**
- `ErrorPanel` is rendered (not a blank screen, not a JS error).
- "Reintentar" button present and clickable.
- No raw error message or stack trace displayed.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: Component — Client Form Validates Required Fields Before Submit

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8
**Risk covered:** R5

**Precondition:** `ClienteForm` rendered in create mode. MSW active but no POST handler configured.

**Test Steps:**
1. Render `ClienteForm` without filling any field.
2. Click the submit button.
3. Assert inline validation error messages appear on all four required fields: Nombre, NIT/RUC, Teléfono, Ciudad.
4. Assert that `POST /api/v1/clientes` was NOT called (MSW request log empty).

**Expected Result:**
- Four inline error messages rendered adjacent to their fields.
- No network request made.
- Form remains open (not closed).

**Automation:** Vitest + RTL + MSW handler absent.

---

#### TC-E2-P1-11: Component — Delete Confirmation Dialog Appears Before Delete

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC Story 2.5 (confirmation dialog)
**Risk covered:** R9

**Precondition:** `ClienteDetailView` rendered with a selected client. MSW intercepts DELETE.

**Test Steps:**
1. Click "Eliminar" button.
2. Assert dialog with "¿Eliminar este cliente?" text is visible.
3. Assert "Confirmar" and "Cancelar" options present.
4. Assert `DELETE /api/v1/clientes/{id}` NOT yet called.

**Expected Result:**
- Dialog appears immediately upon "Eliminar" click.
- No deletion occurs until "Confirmar" is clicked.
- "Cancelar" closes dialog without API call.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: E2E — Deep Link to /clientes/:clienteId Loads Client Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC Story 2.2 (deep linking), FR30
**Risk covered:** R7

**Precondition:** Frontend and backend running. One client with known UUID seeded.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{knownUuid}`.
2. Wait for page to render.
3. Assert client detail panel shows the client's Nombre, NIT, Teléfono, Ciudad.

**Expected Result:**
- Client detail rendered without redirect.
- URL remains `/clientes/{knownUuid}`.
- No blank page, no 404, no JS error.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-13: Component — Sort Does Not Clear Active Search Filter

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-E2.6, AC Story 2.6
**Risk covered:** R8

**Precondition:** 5 mock clients in cache with names starting with different letters. Search "A" typed, filtering to 2 clients.

**Test Steps:**
1. Render `ClienteListView` with 5 mock clients.
2. Type "A" in search field — assert 2 clients visible.
3. Select "Nombre Z→A" from `SortControl`.
4. Assert search input still contains "A".
5. Assert only the 2 previously filtered clients are shown (in reverse order).
6. Assert no new API call was made.

**Expected Result:**
- Sort applied to already-filtered result set.
- Search query preserved in input.
- No additional fetch triggered (client-side operation).

**Automation:** Vitest + RTL + MSW (no re-fetch assertions via MSW handler call count).

---

#### TC-E2-P1-14: Component — Default Sort Order is "Más reciente"

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC Story 2.6 (default sort = "Más reciente")

**Precondition:** MSW returns 3 clients with different `createdAt` dates (oldest, middle, newest).

**Test Steps:**
1. Render `ClienteListView` with no persisted sort preference.
2. Inspect `SortControl` selected value.
3. Inspect order of clients in rendered list.

**Expected Result:**
- `SortControl` shows "Más reciente" as active option.
- Client list rendered with newest client first (descending `createdAt`).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-15: Unit — Zod Schema Rejects Empty Required Fields

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirement:** FR8, NFR5
**Risk covered:** R5

**Test Steps:**
1. Import `clienteSchema` from `src/modules/crm/clientes/application/clienteSchema.ts`.
2. Call `clienteSchema.safeParse({ nombre: "", nit: "900", telefono: "300", ciudad: "Bogotá" })`.
3. Call `clienteSchema.safeParse({ nombre: "Test", nit: "", telefono: "300", ciudad: "Bogotá" })`.
4. Call `clienteSchema.safeParse({})`.

**Expected Result:**
- All three calls return `{ success: false }`.
- `error.issues` contains an entry for the empty/missing field in each case.
- A valid object `{ nombre: "A", nit: "B", telefono: "C", ciudad: "D" }` passes `{ success: true }`.

**Automation:** Vitest unit test.

---

#### TC-E2-P1-16: Unit — Sort Comparators Produce Correct Order

**Level:** Unit (Vitest)
**Story:** 2.6
**Requirement:** AC Story 2.6 (four sort criteria)

**Test Steps:**
1. Import or extract the sort comparator logic from `SortControl` / `ClienteListView`.
2. Supply array of 3 clients: `[{nombre: "Zeta", createdAt: "2026-01-01"}, {nombre: "Alpha", createdAt: "2026-03-01"}, {nombre: "Mango", createdAt: "2026-02-01"}]`.
3. Apply `nombre-asc` sort → assert order `[Alpha, Mango, Zeta]`.
4. Apply `nombre-desc` sort → assert order `[Zeta, Mango, Alpha]`.
5. Apply `fecha-desc` sort → assert order `[2026-03-01, 2026-02-01, 2026-01-01]` (newest first).
6. Apply `fecha-asc` sort → assert order `[2026-01-01, 2026-02-01, 2026-03-01]` (oldest first).

**Expected Result:**
- All four sort functions produce the correct ordering.
- No mutation of the original array.

**Automation:** Vitest unit test.

---

### P2 — Should Pass Before Epic Is Marked Complete

---

#### TC-E2-P2-01: Component — Client Form Pre-filled on Edit Mode

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC Story 2.4 (pre-fill with current values), FR6

**Test Steps:**
1. Render `ClienteForm` in edit mode with client data `{ nombre: "Empresa A", nit: "900111222-3", telefono: "3005556666", ciudad: "Pereira" }`.
2. Assert each input contains the correct value.

**Expected Result:**
- `nombre` input value is "Empresa A".
- `nit` input value is "900111222-3".
- `telefono` input value is "3005556666".
- `ciudad` input value is "Pereira".

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-02: Component — Cancel Edit Preserves Original Data

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC Story 2.4 (cancel → original data unchanged)
**Risk covered:** R10

**Test Steps:**
1. Render `ClienteDetailView` with client `{ nombre: "Empresa Original", ... }`.
2. Click "Editar" — form opens pre-filled.
3. Clear `nombre` field and type "Empresa Modificada".
4. Click "Cancelar".
5. Assert form is closed.
6. Assert `PUT /api/v1/clientes/{id}` was NOT called (MSW).
7. Click "Editar" again.
8. Assert `nombre` input still shows "Empresa Original" (not "Empresa Modificada").

**Expected Result:**
- No API call made on cancel.
- Original data preserved in view and in form on next open.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Component — Cancel Delete Preserves Client Record

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC Story 2.5 (cancel → client unchanged)

**Test Steps:**
1. Render `ClienteDetailView` with a client selected.
2. Click "Eliminar" — dialog appears.
3. Click "Cancelar" in dialog.
4. Assert dialog closed.
5. Assert `DELETE /api/v1/clientes/{id}` was NOT called.
6. Assert client is still visible in detail panel.

**Expected Result:**
- Dialog dismisses without API call.
- Client record intact in UI.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: Component — Client Selection Updates URL to /clientes/:id

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** AC Story 2.2 (URL updates to `/clientes/:clienteId`), FR30

**Test Steps:**
1. Render router with `ClienteListView` showing three clients.
2. Click on the second client in the list.
3. Assert current URL is `/clientes/{secondClientUuid}`.
4. Assert right panel renders the selected client's details.

**Expected Result:**
- URL updated to `/clientes/{uuid}` via TanStack Router navigation (no full reload).
- Detail panel shows correct client data.

**Automation:** Vitest + RTL + `@tanstack/react-router` test utilities.

---

#### TC-E2-P2-05: Component — Not-Found Message for Non-existent clienteId

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirement:** AC Story 2.2 (graceful not-found on invalid id)

**Precondition:** MSW returns 404 for `GET /api/v1/clientes/nonexistent-uuid`.

**Test Steps:**
1. Render router at `/clientes/nonexistent-uuid`.
2. Wait for query to resolve.
3. Assert a not-found message component is rendered.

**Expected Result:**
- Not-found message visible (not a blank screen, not a JS error).
- Navigation shell still present.
- No raw error details exposed to user.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: Component — All Four Sort Options Visible in SortControl

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC Story 2.6 (four sort criteria selectable)

**Test Steps:**
1. Render `SortControl` component.
2. Assert all four options are present: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo".
3. Assert option values match identifiers: `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`.

**Expected Result:**
- All four options rendered and selectable.
- Default selected option is "Más reciente" (`fecha-desc`).

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-07: API Integration — GET /api/v1/clientes Returns Empty Array (Not 404) When No Clients

**Level:** API Integration
**Story:** 2.1
**Requirement:** AC Story 2.1 (EmptyState — backend contract)

**Precondition:** Database has no clients.

**Test Steps:**
1. GET `/api/v1/clientes`.

**Expected Result:**
- HTTP 200 OK (NOT 404).
- Body is `[]` (empty JSON array).

**Automation:** xUnit integration test.

---

#### TC-E2-P2-08: Unit — FluentValidation CreateClienteRequestValidator Rejects Blank Fields

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirement:** FR8, NFR5
**Risk covered:** R2

**Test Steps:**
1. Instantiate `CreateClienteRequestValidator`.
2. Validate `new CreateClienteRequest { Nombre = "", Nit = "900", Telefono = "300", Ciudad = "Bogotá" }`.
3. Assert `IsValid = false` and error contains `Nombre` field.
4. Repeat for each required field individually.

**Expected Result:**
- Validator rejects each blank required field independently.
- Error messages in Spanish (e.g., "El nombre es requerido").

**Automation:** xUnit unit test.

---

#### TC-E2-P2-09: E2E — Full Create Client Flow from List to Detail

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1 (client appears in list immediately), FR27, NFR2

**Precondition:** Frontend and backend running. Database empty or with known initial state.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Fill in: Nombre = "Cliente E2E Test", NIT = "900987654-3", Teléfono = "3007654321", Ciudad = "Cartagena".
4. Click submit.
5. Assert success toast "Cliente creado correctamente" appears.
6. Assert "Cliente E2E Test" appears in the client list.
7. Assert URL is `/clientes/{newUuid}` (detail panel opens).

**Expected Result:**
- Client created end-to-end successfully.
- List updates without page reload.
- URL reflects new client ID.

**Automation:** Playwright E2E test.

---

#### TC-E2-P2-10: E2E — Full Delete Client Flow with Contact Orphan Toast

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** AC Story 2.5 (contact-orphan toast), FR23

**Precondition:** Client with 2 associated contacts seeded. Frontend and backend running.

**Test Steps:**
1. Navigate to `/clientes/{clienteUuid}`.
2. Click "Eliminar".
3. Assert confirmation dialog appears.
4. Click "Confirmar".
5. Assert toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
6. Assert client no longer in list.
7. Navigate to `/contactos` (or contacts list) and verify the 2 contacts still exist without a client assigned.

**Expected Result:**
- Correct orphan-specific toast displayed.
- Client gone from list.
- Contacts preserved and unassigned.

**Automation:** Playwright E2E test.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: Unit — useClientes Hook Returns Correct Query Key

**Level:** Unit (Vitest)
**Story:** 2.1

**Test Steps:**
1. Render `useClientes` in a test wrapper.
2. Inspect the TanStack Query observer's `queryKey`.

**Expected Result:**
- `queryKey` is `['clientes']` (array, not string).

**Automation:** Vitest unit test with `renderHook`.

---

#### TC-E2-P3-02: API Integration — NIT Field Stored as-is (No Silent Trimming)

**Level:** API Integration
**Story:** 2.3

**Test Steps:**
1. POST `/api/v1/clientes` with `nit: "  900123456-7  "` (leading/trailing spaces).
2. GET the created client.
3. Inspect returned `nit`.

**Expected Result:**
- `nit` is trimmed before storage OR stored with spaces but displayed consistently — document actual behavior.
- No silent NIT modification that would cause unexpected uniqueness behavior.

**Automation:** xUnit integration test.

---

#### TC-E2-P3-03: Component — Search Input Debounce Does Not Drop Keystrokes

**Level:** Component (Vitest + RTL)
**Story:** 2.1

**Test Steps:**
1. Render `ClienteListView` with 20 clients.
2. Type 5 characters rapidly in search field.
3. Assert final filtered result matches the full 5-character search term.

**Expected Result:**
- No characters dropped.
- Filter accurately reflects final input value.

**Automation:** Vitest + RTL with `userEvent.type`.

---

#### TC-E2-P3-04: Performance — Search Renders in Under 150ms with 500 Records

**Level:** Component (Vitest)
**Story:** 2.1
**Requirement:** NFR1 (< 1s with 500 records)

**Test Steps:**
1. Generate array of 500 mock clients.
2. Populate TanStack Query cache.
3. Render `ClienteListView`.
4. Record timestamp.
5. Set search query to a term matching 3 clients.
6. Wait for re-render.
7. Record timestamp.

**Expected Result:**
- Re-render completes in ≤ 150ms (well within NFR1 1-second requirement for client-side filter).

**Automation:** Vitest with `performance.now()`.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Test Cases | Status |
|-----------------|------------|--------|
| AC-E2.1: Register client with Nombre, NIT, Teléfono, Ciudad — appears in list immediately | TC-E2-P0-01, TC-E2-P0-05, TC-E2-P2-09 | Covered |
| AC-E2.2: Search clients by nombre or NIT in < 1 second | TC-E2-P1-07, TC-E2-P3-04 | Covered |
| AC-E2.3: View, edit, and save client detail | TC-E2-P0-06, TC-E2-P1-02, TC-E2-P1-04, TC-E2-P2-01 | Covered |
| AC-E2.4: Required fields validated — error messages shown, no submit | TC-E2-P0-03, TC-E2-P0-05, TC-E2-P1-05, TC-E2-P1-10, TC-E2-P1-15 | Covered |
| AC-E2.5: Delete client — removed from list immediately | TC-E2-P0-04, TC-E2-P0-07, TC-E2-P1-06, TC-E2-P2-10 | Covered |
| AC-E2.6: Sort by 4 criteria without reload or losing active filter | TC-E2-P1-13, TC-E2-P1-14, TC-E2-P1-16, TC-E2-P2-06 | Covered |
| Story 2.1 — EmptyState on empty list | TC-E2-P1-08, TC-E2-P2-07 | Covered |
| Story 2.1 — ErrorPanel with Reintentar on fetch failure | TC-E2-P1-09 | Covered |
| Story 2.1 — List filters in real time (name or NIT) | TC-E2-P1-07 | Covered |
| Story 2.2 — Right panel shows full detail on client click | TC-E2-P2-04 | Covered |
| Story 2.2 — URL updates to /clientes/:clienteId | TC-E2-P2-04 | Covered |
| Story 2.2 — Direct URL access loads correct client | TC-E2-P1-12 | Covered |
| Story 2.2 — Non-existent clienteId shows not-found message | TC-E2-P1-03, TC-E2-P2-05 | Covered |
| Story 2.3 — "Nuevo cliente" opens form with 4 required fields | TC-E2-P1-10 | Covered |
| Story 2.3 — All fields filled → client created, toast shown | TC-E2-P0-01, TC-E2-P0-05, TC-E2-P2-09 | Covered |
| Story 2.3 — Empty fields → inline errors, no backend call | TC-E2-P0-03, TC-E2-P1-10, TC-E2-P1-15 | Covered |
| Story 2.3 — Duplicate NIT → "El NIT/RUC ya está registrado" | TC-E2-P0-02 | Covered |
| Story 2.4 — Edit form pre-filled with current values | TC-E2-P2-01 | Covered |
| Story 2.4 — Save changes → reflected immediately | TC-E2-P0-06, TC-E2-P1-04 | Covered |
| Story 2.4 — Clear required field → inline error, no submit | TC-E2-P1-05, TC-E2-P1-10 | Covered |
| Story 2.4 — Cancel → original data unchanged | TC-E2-P2-02 | Covered |
| Story 2.5 — Confirmation dialog on "Eliminar" click | TC-E2-P1-11 | Covered |
| Story 2.5 — Confirm deletion → client removed, panel reset, toast | TC-E2-P0-07, TC-E2-P1-06, TC-E2-P2-10 | Covered |
| Story 2.5 — Cancel dialog → client intact | TC-E2-P2-03 | Covered |
| Story 2.5 — Delete with contacts → contacts orphaned (clienteId=null) | TC-E2-P0-04, TC-E2-P2-10 | Covered |
| Story 2.6 — Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo | TC-E2-P1-16, TC-E2-P2-06 | Covered |
| Story 2.6 — Sort without new API call | TC-E2-P1-13 | Covered |
| Story 2.6 — Sort preserves active search filter | TC-E2-P1-13 | Covered |
| Story 2.6 — Default sort = "Más reciente" on load | TC-E2-P1-14 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Test Cases | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-07, TC-E2-P3-04 | Component |
| NFR2 | CRUD UI update < 2s | TC-E2-P0-05, TC-E2-P0-06, TC-E2-P0-07 | Component |
| NFR3 | 10 simultaneous users | Not directly testable at unit/component level — load test deferred to NFR-specific testing | N/A |
| NFR4 | HTTPS in non-local deployments | Out of scope for Epic 2 (local dev only) | N/A |
| NFR5 | Input validation and sanitization | TC-E2-P0-03, TC-E2-P1-10, TC-E2-P1-15, TC-E2-P2-08 | Unit + API |
| NFR6 | No stack traces or internal errors exposed | TC-E2-P0-02, TC-E2-P1-03, TC-E2-P1-09 | API Integration + Component |

---

## 7. Test Execution Order

```
Phase 1 — Unit Gate (no DB, no server)
  1. TC-E2-P1-15   Zod schema rejects empty fields
  2. TC-E2-P1-16   Sort comparators produce correct order
  3. TC-E2-P2-08   FluentValidation rejects blank fields (xUnit unit)
  4. TC-E2-P3-01   useClientes hook query key

Phase 2 — API Integration Gate (DB required — xUnit + TestContainers)
  5. TC-E2-P0-01   POST clientes → 201
  6. TC-E2-P0-02   POST duplicate NIT → 409
  7. TC-E2-P0-03   POST empty field → 400
  8. TC-E2-P1-01   GET clientes list → 200
  9. TC-E2-P1-02   GET clientes/{id} → 200
 10. TC-E2-P1-03   GET clientes/nonexistent → 404
 11. TC-E2-P1-04   PUT clientes/{id} → 200
 12. TC-E2-P1-05   PUT empty field → 400
 13. TC-E2-P1-06   DELETE clientes/{id} → 204
 14. TC-E2-P0-04   DELETE with contacts → contacts orphaned
 15. TC-E2-P2-07   GET clientes empty DB → 200 + []
 16. TC-E2-P3-02   NIT trimming behavior

Phase 3 — Component Tests (Vitest + RTL + MSW)
 17. TC-E2-P0-05   Create mutation invalidates cache
 18. TC-E2-P0-06   Edit mutation invalidates cache
 19. TC-E2-P0-07   Delete mutation invalidates cache
 20. TC-E2-P1-07   Real-time search filters list
 21. TC-E2-P1-08   EmptyState on empty list
 22. TC-E2-P1-09   ErrorPanel on fetch failure
 23. TC-E2-P1-10   Form validation prevents submit
 24. TC-E2-P1-11   Delete confirmation dialog
 25. TC-E2-P1-13   Sort preserves search filter
 26. TC-E2-P1-14   Default sort = "Más reciente"
 27. TC-E2-P2-01   Edit form pre-filled
 28. TC-E2-P2-02   Cancel edit preserves data
 29. TC-E2-P2-03   Cancel delete preserves client
 30. TC-E2-P2-04   Client selection updates URL
 31. TC-E2-P2-05   Not-found for invalid clienteId
 32. TC-E2-P2-06   All four sort options in SortControl
 33. TC-E2-P3-03   Search keystrokes not dropped
 34. TC-E2-P3-04   Search performance ≤ 150ms / 500 records

Phase 4 — E2E Tests (Playwright — full stack running)
 35. TC-E2-P1-12   Deep link /clientes/:id
 36. TC-E2-P2-09   Full create flow end-to-end
 37. TC-E2-P2-10   Full delete flow with orphan toast
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Scope |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering + interaction | Frontend |
| @testing-library/user-event | Realistic user input simulation | Frontend |
| @testing-library/jest-dom | DOM matchers (`toBeVisible`, `toHaveValue`, etc.) | Frontend |
| MSW 2+ | API mocking for component tests | Frontend |
| @tanstack/react-router (test utils) | Router rendering in tests | Frontend |
| @tanstack/react-query | QueryClient in test wrappers | Frontend |
| Playwright 1.40+ | E2E full-stack tests | E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| FluentAssertions | Readable assertion syntax | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on port 5432 (or TestContainers via Docker)
- Database user with CREATE DATABASE privilege
- siesa_agents_db migrated with `clientes` table (Epic 2 migration applied)
- npm install completed in frontend/
- dotnet restore completed in backend/
- Frontend dev server on 5173 (E2E tests only)
- Backend running on 5000 (E2E tests only)
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 7 | 2.0 | 14.0 | Cache invalidation, NIT uniqueness, contact orphan — complex setup |
| P1 | 16 | 1.5 | 24.0 | CRUD API + core component behaviors + sort/search |
| P2 | 10 | 1.0 | 10.0 | Complementary edge cases, E2E flows, pre-fill, cancel |
| P3 | 4 | 0.5 | 2.0 | Nice-to-have perf + hook unit tests |
| **Total** | **37*** | — | **50.0 hours** | **~6.25 days** |

_*Additional 6 unit tests (TC-E2-P1-15, TC-E2-P1-16, TC-E2-P2-08, TC-E2-P3-01 counted within story groups above)_

### Test Data Requirements

```
Minimum viable seed data for integration tests:
  - 1 client with known UUID (for GET, PUT, DELETE, deep-link tests)
  - 1 client with 2 contacts (for delete-with-orphan test TC-E2-P0-04)
  - 1 client with duplicate NIT (for TC-E2-P0-02)
  - 3 clients with distinct names and createdAt dates (for sort tests)
  - 500 mock clients JSON fixture (for perf test TC-E2-P3-04)
```

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — all 7 P0 tests must pass before any story is closed as Done.
- **P1 pass rate**: 100% — all 16 P1 tests must pass before the Epic is considered functionally complete.
- **P2 pass rate**: ≥ 90% — 9 of 10 must pass; any failing P2 must be documented with a justification and tracked issue.
- **P3 pass rate**: ≥ 75% — informational; may be deferred with justification.

### Coverage Targets

| Area | Target |
|------|--------|
| CRUD API endpoints (all verbs) | 100% (P0 + P1 API tests) |
| FluentValidation rules | 100% (P0-03, P1-05, P2-08) |
| Zod schema rules | 100% (P1-15) |
| Contact orphaning on delete | 100% (P0-04, P2-10) |
| Cache invalidation (all 3 mutations) | 100% (P0-05, P0-06, P0-07) |
| Sort criteria (all 4) | 100% (P1-16, P2-06) |
| Search filter | 100% (P1-07) |
| Error states (EmptyState, ErrorPanel, 404, 409) | 100% |

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] NIT uniqueness enforced end-to-end (R1 mitigated)
- [ ] FluentValidation wired and rejecting blank fields (R2 mitigated)
- [ ] All three mutations invalidate `['clientes']` query key (R3 mitigated)
- [ ] Client deletion does NOT delete contacts — `clienteId = null` verified (R4 mitigated)
- [ ] 409 response body contains NO stack trace or DB constraint name (R12 mitigated)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-16)
- [ ] P2 test cases pass at ≥ 90% or are formally deferred with documented justification
- [ ] No P0/P1 test is skipped without a documented reason and linked issue
- [ ] `clientes` table migration applied with correct snake_case naming and `uk_clientes_nit` unique constraint
- [ ] `fk_contactos_clientes` FK configured with `ON DELETE SET NULL` (verified via TC-E2-P0-04)
- [ ] FluentValidation validators returning Spanish error messages
- [ ] All user-facing text in UI is in Spanish (labels, toasts, error messages, placeholders)
- [ ] No stack trace or raw DB error exposed to the frontend (NFR6)
- [ ] TanStack Query cache invalidation confirmed for create, update, and delete operations

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for all tests to pass:

1. **NIT uniqueness**: `uk_clientes_nit` unique index must be created in `ClienteConfiguration.cs` via `builder.HasIndex(x => x.NIT).IsUnique()`. The command handler must catch the DB uniqueness violation and throw a domain exception mapped to 409 Conflict — never let the raw `DbUpdateException` propagate to the client.

2. **FluentValidation wiring**: `CreateClienteRequestValidator` and `UpdateClienteRequestValidator` must be registered in the DI container AND explicitly called in `ClienteEndpoints.cs`. Minimal API does not auto-validate; use `.WithParameterValidation()` (Minimal API FluentValidation integration) or manual validation call in the endpoint handler.

3. **Contact FK**: `ContactoConfiguration.cs` must declare: `builder.HasOne(c => c.Cliente).WithMany().HasForeignKey(c => c.ClienteId).OnDelete(DeleteBehavior.SetNull)`. Without this, deleting a client with contacts will cause a FK violation (500) instead of orphaning the contacts.

4. **Cache invalidation**: Every mutation hook (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in its `onSuccess` callback. Additionally, `useDeleteCliente` must navigate away from the deleted client's detail route to prevent a 404 detail view remaining open.

5. **Sort state**: Sort is managed via local `useState` in `ClienteListView` — NOT in Zustand and NOT in TanStack Query. The sort must be applied via `useMemo` over the already-filtered array, ensuring sort and search are independent. The `SortControl` component lives at `src/shared/components/SortControl`.

6. **Toast messages**: Use the exact Spanish strings from the acceptance criteria:
   - Create: `"Cliente creado correctamente"`
   - Update: `"Cliente actualizado correctamente"`
   - Delete (no contacts): `"Cliente eliminado correctamente"`
   - Delete (with contacts): `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."`

7. **Deep linking**: The route `_app/clientes.$clienteId.tsx` must call `useCliente(clienteId)` to load data on direct URL access. The `$clienteId` path parameter must be retrieved via `useParams()` from TanStack Router. A 404 response from the API must render a graceful not-found component (not a crash).

8. **Error isolation**: Never display `error.message` directly in the UI. Use `<ErrorPanel onRetry={refetch} />` for list-level fetch failures. For mutation failures, use a generic toast: `"No se pudo guardar. Intenta de nuevo."` — never expose the raw API error message.
