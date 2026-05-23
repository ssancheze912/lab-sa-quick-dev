---
epic: 2
title: "Gestión de Clientes"
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

# Test Design — Epic 2: Gestión de Clientes

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers the full CRUD lifecycle for client records: listing, searching, viewing detail, creating, editing, deleting, and sorting. It introduces the first domain entities (`clientes` table, `ClienteEntity`) and the first real API surface (`/api/v1/clientes`). The split-panel layout (280 px left list + flex right detail), real-time search (client-side filter), optimistic mutation invalidation, and the `SortControl` component are all first introduced here.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | List rendering, real-time filter by name/NIT, EmptyState, ErrorPanel + Reintentar |
| 2.2 | Client Detail View | Detail panel, URL deep linking `/clientes/:clienteId`, not-found graceful handling |
| 2.3 | Create Client | Form with 4 required fields, validation (empty + NIT/RUC duplicate 409), success toast, immediate list update |
| 2.4 | Edit Client | Pre-filled form, update reflected immediately, cancel discards changes |
| 2.5 | Delete Client | Confirmation dialog, immediate removal, associated contacts become `clienteId = null` |
| 2.6 | Sort Client List | 4 sort criteria (nombre-asc/desc, fecha-desc/asc), client-side sort, sort+filter coexistence, default sort |

### Functional Requirements Covered

FR1 (list clients), FR2 (search by name/NIT), FR3 (view client detail), FR4 (create client), FR5 (edit client), FR6 (delete client), FR7 (NIT/RUC uniqueness), FR8 (required field validation), FR25 (unassigned contacts filter after delete), FR27 (immediate visibility of changes), FR30 (deep linking).

### Out of Scope for This Epic

- Contact management UI (Epic 3)
- Client-Contact association panel (`ContactManager`) (Epic 4)
- Authentication / authorization (deferred MVP)
- Server-side pagination (NFR11 — future)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC duplicate validation** — backend 409 not surfaced correctly, or frontend silently ignores conflict and shows success toast | High | Critical | P0 | Integration test: POST with duplicate NIT → assert 409 Problem Details; Component test: assert "El NIT/RUC ya está registrado" message visible, no success toast |
| R2 | **Required field validation bypassed** — frontend Zod schema or backend FluentValidation missing a required field, allowing empty submissions to reach DB | High | Critical | P0 | Unit test (Zod): each field empty individually asserts error; Integration test: POST with missing `nombre` → 400 Problem Details with `errors.nombre`; assert form NOT submitted |
| R3 | **TanStack Query invalidation missing** after create/update/delete — list not updated immediately, violating FR27/NFR2 | High | High | P0 | Component/Integration test: mutate → assert `['clientes']` query refetched → list reflects change within 2 s |
| R4 | **Delete cascade** — `ON DELETE SET NULL` not applied on `contactos.cliente_id` FK; associated contacts lose data instead of becoming unassigned | Medium | Critical | P0 | Integration test: create client with 2 contacts → delete client → verify contacts exist with `clienteId = null`; verify "Sin cliente" filter shows them |
| R5 | **Real-time search performance** — client-side filter on 500 records exceeds 1 s (NFR1) due to missing `useMemo` or re-render on every keystroke | Medium | High | P1 | Component test: render list with 500 mocked items, trigger search, assert filtered result visible under 1 s; unit test useMemo dependency array |
| R6 | **Deep linking `/clientes/:clienteId`** — direct URL access fails to load correct client (TanStack Router param not read, or client fetched with wrong ID) | Medium | High | P1 | E2E test: navigate directly to `/clientes/{knownId}` → assert detail panel shows correct Nombre and NIT/RUC |
| R7 | **Sort does not preserve active search filter** — changing sort order clears `searchQuery` state | Medium | Medium | P1 | Component test: set search filter → change sort → assert search input text unchanged and filtered+sorted result correct |
| R8 | **ErrorPanel "Reintentar" flow** — fetch failure does not show ErrorPanel, or Reintentar button does not trigger refetch | Medium | Medium | P1 | Component test: mock API failure → assert ErrorPanel rendered; click "Reintentar" → mock success → assert list appears |
| R9 | **Not-found client ID in URL** — accessing `/clientes/non-existent-id` crashes rather than showing graceful message | Low | Medium | P2 | Component test: router renders with unknown clienteId → assert not-found message visible (no JS error) |
| R10 | **Cancel edit discards changes** — clicking "Cancelar" on edit form saves partial changes due to missing form reset | Low | Medium | P2 | Component test: edit form → change value → cancel → assert original value shown in detail panel |
| R11 | **Delete dialog cancel** — confirming closes incorrectly, or cancel does delete | Low | High | P1 | Component test: open delete dialog → click Cancelar → assert client still in list |
| R12 | **SortControl default** — initial load does not default to "Más reciente" (fecha-desc), list order incorrect on first render | Low | Medium | P2 | Component test: render with 3 clients of known dates → assert newest appears first without any user interaction |
| R13 | **Toast messages** — create/edit/delete success toasts display wrong text or in English | Low | Low | P3 | Component test: assert toast text matches exact Spanish strings specified in ACs |
| R14 | **`clientes` table schema** — EF Core migration creates wrong column names or missing unique index on `nit` | Low | High | P1 | Integration test: `dotnet ef database update` → verify table schema (snake_case columns, `uk_clientes_nit` unique index) |

### Top 3 Risk Areas for Epic 2

1. **Data integrity on delete** (R4) — `ON DELETE SET NULL` must be correctly configured in EF Core `ContactoConfiguration`. If missing, deleting a client either blocks (FK constraint error) or hard-deletes contacts, destroying data.
2. **NIT/RUC duplicate enforcement** (R1) — the backend unique index + 409 response + frontend error message form a multi-layer chain; failure at any link causes either silent duplicates in DB or a confusing blank error.
3. **TanStack Query invalidation** (R3) — the entire "immediate visibility" requirement (FR27, NFR2) depends on calling `invalidateQueries(['clientes'])` in every mutation's `onSuccess`. Missing it in any of the three mutations (create/update/delete) yields stale UI.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)            ▌▌▌▌▌▌▌▌            3 tests
  API Integration (xUnit)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   13 tests
  Component (Vitest + RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  17 tests
  Unit (Vitest / xUnit)       ▌▌▌▌▌▌▌▌            7 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                             40 tests
```

### Rationale

- **Component tests dominate** because the majority of Epic 2 complexity lives in the frontend: client-side filtering, sort state, form validation UI, optimistic UI, and dialog flows are best verified at component level with MSW mocks.
- **API Integration tests** are the second-largest tier because new endpoints, FluentValidation, the unique NIT index, and the `ON DELETE SET NULL` FK constraint must be verified against a real database.
- **E2E tests** cover only the deep-linking and full create-then-appear user journeys — scenarios where the integration of routing, API, and rendered list must all work together.
- **Unit tests** cover pure logic: Zod schemas (field-by-field validation), command handler logic, and sort utility functions.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: Backend POST /api/v1/clientes Returns 409 on Duplicate NIT/RUC

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-2.3 (Story 2.3, 4th AC — NIT/RUC duplicate returns 409), FR7
**Risk covered:** R1

**Precondition:** `siesa_agents_db` has a client with `nit = "900123456"`.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body `{ "nombre": "Cliente B", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá" }`.
2. Inspect response status and body.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Response body contains `"status": 409` and `"detail"` containing text indicating NIT duplicate.
- No `stackTrace` key.

**Automation:** xUnit integration test with `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P0-02: Frontend Form Shows "El NIT/RUC ya está registrado" on 409 Response

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-2.3 (4th AC — "El NIT/RUC ya está registrado"), NFR6
**Risk covered:** R1

**Precondition:** MSW handler returns 409 for `POST /api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteForm>` with MSW interceptor returning 409.
2. Fill all required fields with a duplicate NIT.
3. Submit form.
4. Wait for mutation error handler.

**Expected Result:**
- Error message "El NIT/RUC ya está registrado" appears in the UI.
- Success toast "Cliente creado correctamente" is NOT shown.
- Form remains open (not closed on error).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-03: Zod Schema Rejects Empty Required Fields

**Level:** Unit
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** `clienteSchema.ts` is imported directly.

**Test Steps:**
1. Call `clienteSchema.safeParse({})` — all fields empty.
2. Call `clienteSchema.safeParse({ nombre: "", nit: "123", telefono: "3001", ciudad: "Bogotá" })` — nombre empty.
3. Repeat for each required field individually.

**Expected Result:**
- Each parse returns `success: false`.
- `error.issues` contains an entry with `path: ["nombre"]` (or respective field).
- A fully valid payload returns `success: true`.

**Automation:** Vitest unit test.

---

#### TC-E2-P0-04: Backend POST Validates Required Fields — Returns 400

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** Backend running with FluentValidation validators registered.

**Test Steps:**
1. POST `/api/v1/clientes` with `{ "nit": "123456", "telefono": "300", "ciudad": "Cali" }` (missing `nombre`).
2. POST `/api/v1/clientes` with `{}` (all fields missing).

**Expected Result:**
- Both return HTTP 400.
- Response body is Problem Details with `errors` object keying the invalid field(s).
- No 500 error, no stack trace.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-05: Create Client — List Updates Immediately (TanStack Query Invalidation)

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-E2.1, FR27, NFR2
**Risk covered:** R3

**Precondition:** MSW returns existing list of 2 clients on `GET /api/v1/clientes`; after `POST` MSW returns the new client and the list query is re-fetched with 3 clients.

**Test Steps:**
1. Render `<ClienteListView>` wrapped in QueryClientProvider + RouterProvider.
2. Assert 2 items in list.
3. Trigger `useCreateCliente` mutation with a new valid client payload.
4. Assert `invalidateQueries(['clientes'])` was called (spy or verify MSW GET is called a second time).
5. Assert 3 items now visible in the list.

**Expected Result:**
- List shows new client within 2 s of mutation completing.
- `['clientes']` query is re-fetched exactly once after the mutation.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-06: Delete Client — Associated Contacts Become Unassigned (ON DELETE SET NULL)

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 (4th AC — contacts become `clienteId = null`), FR23, FR25
**Risk covered:** R4

**Precondition:** DB has a client (id = X) with 2 linked contacts.

**Test Steps:**
1. GET `/api/v1/contactos?clienteId={X}` — verify 2 contacts exist with `clienteId = X`.
2. DELETE `/api/v1/clientes/{X}`.
3. GET `/api/v1/clientes/{X}` — verify 404.
4. GET `/api/v1/contactos/{contact1Id}` and GET `/api/v1/contactos/{contact2Id}`.
5. Inspect `clienteId` field.

**Expected Result:**
- DELETE returns 204.
- Both contacts still exist (200 response).
- Both contacts have `clienteId: null`.
- No contact was deleted.

**Automation:** xUnit integration test with TestContainers Postgres.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: Client List Renders All Clients with Nombre and NIT/RUC

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-2.1 (1st AC — scrollable list, Nombre + NIT/RUC visible)

**Precondition:** MSW returns `[{ id: "1", nombre: "Cliente A", nit: "900111" }, { id: "2", nombre: "Cliente B", nit: "900222" }]` for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteListView>` with providers.
2. Wait for query to settle.
3. Query all rendered list items.

**Expected Result:**
- 2 items rendered.
- Each item shows Nombre text and NIT/RUC text.
- List container is present (280 px panel or equivalent).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Client List Shows EmptyState When No Clients Exist

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-2.1 (3rd AC — EmptyState with guidance message)

**Precondition:** MSW returns `[]` for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Wait for query.

**Expected Result:**
- `EmptyState` component rendered.
- Message guides user to create first client (text present in DOM).
- No client list items rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: Client List Shows ErrorPanel on Backend Failure with Reintentar Button

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-2.1 (4th AC — ErrorPanel with "Reintentar")
**Risk covered:** R8

**Precondition:** MSW returns network error for `GET /api/v1/clientes` on first call, then success on second call.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Wait for error state.
3. Assert `ErrorPanel` is rendered and "Reintentar" button is present.
4. Click "Reintentar".
5. Assert MSW GET is called a second time and list renders.

**Expected Result:**
- ErrorPanel visible on fetch failure.
- Clicking Reintentar triggers refetch.
- On second call success, client list replaces ErrorPanel.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: Real-Time Search Filters List by Nombre

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2, FR2, NFR1

**Precondition:** MSW returns 5 clients with varied names.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Type "cliente a" into search field.
3. Assert filtered result.

**Expected Result:**
- Only clients whose Nombre matches (case-insensitive) "cliente a" are visible.
- Non-matching clients are hidden.
- Filter completes in under 1 s (verified via test timing or `useMemo` inspection).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-05: Real-Time Search Filters List by NIT/RUC

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2, FR2

**Precondition:** MSW returns clients with distinct NIT/RUC values.

**Test Steps:**
1. Render `<ClienteListView>`.
2. Type a known NIT value into search field.

**Expected Result:**
- Only the client with matching NIT/RUC is shown.
- Search matches partial NIT (substring match).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-06: Search Performance with 500 Records

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** NFR1 (< 1 s with 500 records)
**Risk covered:** R5

**Precondition:** MSW returns an array of 500 generated client objects.

**Test Steps:**
1. Render `<ClienteListView>` and wait for list.
2. Record timestamp.
3. Type a search term that matches ~10 items.
4. Record timestamp after render.

**Expected Result:**
- Elapsed time < 1000 ms.
- Filtered items are 10 or fewer as expected.

**Automation:** Vitest + RTL with `performance.now()` timing.

---

#### TC-E2-P1-07: Deep Link — Direct Access to /clientes/:clienteId Shows Correct Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (2nd AC — direct URL loads correct client), FR30
**Risk covered:** R6

**Precondition:** DB contains a client with known `id` and `nombre = "Empresa Test"`.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{knownId}`.
2. Wait for right panel to render.

**Expected Result:**
- Right panel shows "Empresa Test" Nombre.
- All 4 fields visible (Nombre, NIT/RUC, Teléfono, Ciudad).
- No redirect, no blank panel.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-08: Client Detail — URL Updates to /clientes/:clienteId on Click

**Level:** Component (Vitest + RTL) or E2E
**Story:** 2.2
**Requirement:** AC-2.2 (1st AC — URL updates, FR30)

**Test Steps:**
1. Render full view at `/clientes` with 2 clients in list.
2. Click on "Cliente A" in the list.

**Expected Result:**
- URL changes to `/clientes/{clienteAId}`.
- Right panel shows Cliente A's Nombre, NIT/RUC, Teléfono, Ciudad.

**Automation:** Vitest + RTL with TanStack Router test utilities or Playwright.

---

#### TC-E2-P1-09: Not-Found Client ID Shows Graceful Message

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** AC-2.2 (3rd AC — graceful not-found)
**Risk covered:** R9

**Precondition:** MSW returns 404 for `GET /api/v1/clientes/non-existent-id`.

**Test Steps:**
1. Render router at `/clientes/non-existent-id`.
2. Wait for response.

**Expected Result:**
- Not-found message is displayed in right panel.
- No unhandled JS error or blank screen.
- Navigation shell remains visible.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-10: Create Client — Success Toast and New Item in List

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, AC-2.3 (2nd AC — success toast "Cliente creado correctamente")

**Precondition:** DB empty or with 0 clients.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente".
3. Fill Nombre = "Empresa Nueva", NIT = "999888", Teléfono = "3109876543", Ciudad = "Medellín".
4. Submit form.

**Expected Result:**
- Toast "Cliente creado correctamente" appears.
- "Empresa Nueva" appears in the client list immediately (without manual refresh).
- Form closes after successful submission.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-11: Create Client — Form Does Not Submit with Empty Required Fields

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-E2.4, AC-2.3 (3rd AC — inline error messages), FR8
**Risk covered:** R2

**Precondition:** Render `<ClienteForm>` in create mode.

**Test Steps:**
1. Click submit without filling any field.
2. Inspect DOM for inline error messages.
3. Assert no API call was made (MSW interceptor not hit).

**Expected Result:**
- Inline error messages appear on all 4 fields.
- `POST /api/v1/clientes` was NOT called.
- Form stays open.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Edit Client — Form Pre-Filled with Current Values

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (1st AC — pre-filled fields), FR6

**Precondition:** MSW returns a client `{ nombre: "Acme", nit: "111", telefono: "300", ciudad: "Cali" }` for GET by ID.

**Test Steps:**
1. Render `<ClienteForm>` in edit mode with the client pre-loaded.
2. Inspect input values.

**Expected Result:**
- Nombre field value = "Acme".
- NIT field value = "111".
- Teléfono field value = "300".
- Ciudad field value = "Cali".

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-13: Edit Client — Cancel Discards Changes

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (4th AC — cancel preserves original data)
**Risk covered:** R10

**Precondition:** Client detail shows "Acme Corp".

**Test Steps:**
1. Open edit form (pre-filled with "Acme Corp").
2. Change Nombre to "Modified Name".
3. Click "Cancelar".
4. Inspect detail panel.

**Expected Result:**
- Detail panel still shows "Acme Corp" (original value).
- PUT `/api/v1/clientes/{id}` was NOT called.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-14: Delete Client — Cancel Dialog Keeps Client in List

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (3rd AC — cancel keeps record)
**Risk covered:** R11

**Precondition:** Client list has 1 client.

**Test Steps:**
1. Render detail view for existing client.
2. Click "Eliminar".
3. Assert confirmation dialog appears with "¿Eliminar este cliente?", "Confirmar" and "Cancelar".
4. Click "Cancelar".

**Expected Result:**
- Dialog closes.
- Client remains in list.
- DELETE `/api/v1/clientes/{id}` was NOT called.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Delete Client — Client Removed from List and Panel Resets

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (2nd AC — immediate removal), FR27

**Precondition:** MSW returns 204 for DELETE.

**Test Steps:**
1. Render view with 1 client selected.
2. Click "Eliminar", then "Confirmar".
3. Wait for mutation to complete.

**Expected Result:**
- Client no longer appears in left list.
- Right panel returns to empty/default state.
- Toast "Cliente eliminado correctamente" is visible (standard single delete — no contacts).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-16: Sort Preserves Active Search Filter

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6 (5th AC — sort on filtered set)
**Risk covered:** R7

**Precondition:** 5 clients loaded; user has typed "empresa" in search (filters to 3 results).

**Test Steps:**
1. Render `<ClienteListView>` with 5 clients.
2. Type "empresa" in search field. Assert 3 items.
3. Select "Nombre Z→A" from SortControl.
4. Assert search input still contains "empresa".
5. Assert list shows the same 3 filtered items, reordered Z→A.

**Expected Result:**
- Search input not cleared.
- Filtered items still 3.
- Items ordered Z→A by nombre.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-17: clientes Table Created with Correct Schema and Unique Index on NIT

**Level:** API Integration
**Story:** 2.3 (infrastructure pre-condition)
**Requirement:** FR7 (NIT uniqueness), architecture.md — `uk_clientes_nit`
**Risk covered:** R14

**Precondition:** `dotnet ef database update` run against TestContainers Postgres.

**Test Steps:**
1. Query `information_schema.columns` for `clientes` table.
2. Query `information_schema.table_constraints` and `information_schema.key_column_usage` for `uk_clientes_nit`.

**Expected Result:**
- Table `clientes` exists.
- Columns: `id` (uuid), `nombre` (text), `nit` (text), `telefono` (text), `ciudad` (text), `created_at` (timestamptz), `updated_at` (timestamptz) — all snake_case.
- Unique constraint `uk_clientes_nit` exists on `nit` column.

**Automation:** xUnit integration test + TestContainers.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Sort Nombre A→Z — List Reorders Without API Call

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (1st AC — no new API call on sort)

**Precondition:** 3 clients loaded in order: "Zorro", "Alpha", "Medio".

**Test Steps:**
1. Render `<ClienteListView>`.
2. Select "Nombre A→Z" from SortControl.
3. Assert ordering in DOM.
4. Confirm no additional `GET /api/v1/clientes` call was made after sort.

**Expected Result:**
- List shows: "Alpha", "Medio", "Zorro".
- MSW GET handler called only once (initial load).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-02: Sort Nombre Z→A — List Reorders Correctly

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (2nd AC)

**Test Steps:**
1. Render with clients "Alpha", "Medio", "Zorro".
2. Select "Nombre Z→A".

**Expected Result:**
- List shows: "Zorro", "Medio", "Alpha".

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-03: Sort Más Reciente — Newest Client First

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (3rd AC — fecha-desc)

**Precondition:** 3 clients with `createdAt` values: 2026-01-01 (oldest), 2026-03-01 (middle), 2026-05-01 (newest).

**Test Steps:**
1. Render `<ClienteListView>`.
2. Select "Más reciente".
3. Assert first list item is the one created on 2026-05-01.

**Expected Result:**
- First item = newest (2026-05-01).
- Last item = oldest (2026-01-01).

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-04: Sort Default is Más Reciente on First Load

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (6th AC — default sort "Más reciente")
**Risk covered:** R12

**Precondition:** 3 clients with known dates (oldest → newest). No sort preference set.

**Test Steps:**
1. Render `<ClienteListView>` fresh (no prior state).
2. Do not interact with SortControl.
3. Assert order.

**Expected Result:**
- Default sort is `fecha-desc` — newest client appears first.
- SortControl shows "Más reciente" as selected option.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-05: Edit Client — Success Toast and Updated Value in List

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (2nd AC — toast "Cliente actualizado correctamente", immediate update)

**Precondition:** MSW returns updated client on PUT.

**Test Steps:**
1. Open edit form for "Old Name".
2. Change to "New Name" and submit.
3. Wait for mutation success.

**Expected Result:**
- Toast "Cliente actualizado correctamente" shown.
- Detail panel shows "New Name".
- List item also shows "New Name".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: GET /api/v1/clientes Returns Full Client List

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR1 (list all clients)

**Precondition:** DB has 3 known clients.

**Test Steps:**
1. GET `/api/v1/clientes`.
2. Inspect response body.

**Expected Result:**
- HTTP 200.
- Response is a JSON array with 3 objects.
- Each object has `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt` (camelCase).

**Automation:** xUnit integration test.

---

#### TC-E2-P2-07: GET /api/v1/clientes/:id Returns Single Client

**Level:** API Integration
**Story:** 2.2
**Requirement:** FR3 (view client detail)

**Test Steps:**
1. POST to create a client and capture `id`.
2. GET `/api/v1/clientes/{id}`.

**Expected Result:**
- HTTP 200.
- Response object matches created client's fields.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-08: DELETE /api/v1/clientes/:id Returns 204 and Client Gone

**Level:** API Integration
**Story:** 2.5
**Requirement:** FR6 (delete client)

**Test Steps:**
1. Create a client (POST), capture `id`.
2. DELETE `/api/v1/clientes/{id}`.
3. GET `/api/v1/clientes/{id}`.

**Expected Result:**
- DELETE returns 204 No Content.
- GET returns 404 Not Found.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-09: DELETE on Non-Existent Client Returns 404

**Level:** API Integration
**Story:** 2.5

**Test Steps:**
1. DELETE `/api/v1/clientes/00000000-0000-0000-0000-000000000099` (non-existent UUID).

**Expected Result:**
- HTTP 404.
- Problem Details response body.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-10: Delete Client with Contacts — Toast Shows Correct Message

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (4th AC — "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.")

**Precondition:** MSW returns 204; logic infers contacts were present (or backend returns indicator).

**Test Steps:**
1. Render detail view for a client that has associated contacts.
2. Click "Eliminar" and "Confirmar".

**Expected Result:**
- Toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
- Client is removed from list.

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: Sort Más Antiguo — Oldest Client First

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (4th AC — fecha-asc)

**Test Steps:**
1. Render with 3 clients of known dates.
2. Select "Más antiguo".

**Expected Result:**
- Oldest client (earliest `createdAt`) appears first.

**Automation:** Vitest + RTL.

---

#### TC-E2-P3-02: Toast Text — Create/Edit/Delete Exact Spanish Strings

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4, 2.5
**Requirement:** AC-2.3, AC-2.4, AC-2.5 toast messages
**Risk covered:** R13

**Test Steps:**
1. Create client → assert toast = "Cliente creado correctamente".
2. Update client → assert toast = "Cliente actualizado correctamente".
3. Delete client (no contacts) → assert toast = "Cliente eliminado correctamente".

**Expected Result:**
- All three toast strings match exactly the Spanish text specified in ACs.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P3-03: PUT /api/v1/clientes/:id Updates All Fields

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR5 (edit client)

**Test Steps:**
1. Create client with initial values.
2. PUT with all 4 fields changed.
3. GET the client again.

**Expected Result:**
- GET returns updated values for all 4 fields.
- `updatedAt` is newer than `createdAt`.

**Automation:** xUnit integration test.

---

#### TC-E2-P3-04: E2E Full CRUD Flow — Create, View, Edit, Delete

**Level:** E2E (Playwright)
**Story:** 2.1–2.5

**Test Steps:**
1. Navigate to `/clientes`.
2. Create a new client "Test E2E" via form.
3. Assert it appears in list.
4. Click on it; assert detail panel opens at correct URL.
5. Click "Editar", change nombre to "Test E2E Updated", save.
6. Assert detail shows "Test E2E Updated".
7. Click "Eliminar", confirm.
8. Assert client no longer in list.

**Expected Result:**
- Full CRUD cycle completes without error.
- All transitions match expected URL patterns.

**Automation:** Playwright E2E.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register new client — appears in list immediately | 2.3 | TC-E2-P0-05, TC-E2-P1-10 | Covered |
| AC-E2.2: Search by name or NIT in under 1 second | 2.1 | TC-E2-P1-04, TC-E2-P1-05, TC-E2-P1-06 | Covered |
| AC-E2.3: View detail, edit any field, save | 2.2, 2.4 | TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-12, TC-E2-P2-05 | Covered |
| AC-E2.4: System prevents save with empty required fields — clear errors | 2.3, 2.4 | TC-E2-P0-03, TC-E2-P0-04, TC-E2-P1-11 | Covered |
| AC-E2.5: Delete client — disappears from list | 2.5 | TC-E2-P1-15, TC-E2-P2-08 | Covered |
| AC-E2.6: Sort without reload, preserves active filter | 2.6 | TC-E2-P1-16, TC-E2-P2-01, TC-E2-P2-02, TC-E2-P2-03, TC-E2-P2-04 | Covered |
| AC-2.1 — EmptyState when no clients | 2.1 | TC-E2-P1-02 | Covered |
| AC-2.1 — ErrorPanel + Reintentar on fetch failure | 2.1 | TC-E2-P1-03 | Covered |
| AC-2.2 — Direct URL loads correct client | 2.2 | TC-E2-P1-07 | Covered |
| AC-2.2 — Not-found graceful message | 2.2 | TC-E2-P1-09 | Covered |
| AC-2.3 — "El NIT/RUC ya está registrado" on 409 | 2.3 | TC-E2-P0-01, TC-E2-P0-02 | Covered |
| AC-2.4 — Cancel discards changes | 2.4 | TC-E2-P1-13 | Covered |
| AC-2.5 — Confirmation dialog with Confirmar/Cancelar | 2.5 | TC-E2-P1-14 | Covered |
| AC-2.5 — Panel returns to default after delete | 2.5 | TC-E2-P1-15 | Covered |
| AC-2.5 — Contacts become unassigned on client delete | 2.5 | TC-E2-P0-06, TC-E2-P2-10 | Covered |
| AC-2.6 — Default sort is "Más reciente" | 2.6 | TC-E2-P2-04 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1 s with 500 records | TC-E2-P1-06 | Component |
| NFR2 | CRUD changes visible in UI < 2 s | TC-E2-P0-05, TC-E2-P1-10 | Component / E2E |
| NFR5 | Input validation & sanitization | TC-E2-P0-03, TC-E2-P0-04, TC-E2-P1-11 | Unit / API Integration |
| NFR6 | No stack traces exposed | TC-E2-P0-01 (409 Problem Details), TC-E2-P0-04 (400 Problem Details) | API Integration |
| NFR7 | Core tasks completable without training | TC-E2-P3-04 (E2E full CRUD flow) | E2E |
| NFR11 | No hardcoded limits in data model | TC-E2-P1-17 (schema inspection — UUID PK, no length limits) | API Integration |

---

## 7. Test Execution Order

```
Phase 1 — Schema & Infrastructure Gate (P0-P1, DB required)
  1. TC-E2-P1-17  clientes table schema + uk_clientes_nit index

Phase 2 — API Contract Gate (P0, core endpoint behavior)
  2. TC-E2-P0-01  POST duplicate NIT → 409 Problem Details
  3. TC-E2-P0-04  POST missing required fields → 400 Problem Details
  4. TC-E2-P2-06  GET /api/v1/clientes → 200 array
  5. TC-E2-P2-07  GET /api/v1/clientes/:id → 200 object
  6. TC-E2-P2-08  DELETE → 204 + subsequent GET → 404
  7. TC-E2-P2-09  DELETE non-existent → 404
  8. TC-E2-P0-06  DELETE with contacts → contacts clienteId = null (ON DELETE SET NULL)
  9. TC-E2-P3-03  PUT updates all fields

Phase 3 — Frontend Unit Gate (P0, no DOM)
 10. TC-E2-P0-03  Zod schema rejects empty required fields

Phase 4 — Frontend Component Gate (P0-P1, core behaviors)
 11. TC-E2-P0-02  NIT duplicate → error message in form
 12. TC-E2-P0-05  Create → list updates immediately (invalidateQueries)
 13. TC-E2-P1-01  Client list renders Nombre + NIT/RUC
 14. TC-E2-P1-02  EmptyState when list empty
 15. TC-E2-P1-03  ErrorPanel + Reintentar
 16. TC-E2-P1-04  Search filter by Nombre
 17. TC-E2-P1-05  Search filter by NIT/RUC
 18. TC-E2-P1-06  Search perf 500 records < 1 s
 19. TC-E2-P1-08  Click → URL updates to /clientes/:id
 20. TC-E2-P1-09  Not-found client ID graceful message
 21. TC-E2-P1-11  Form does not submit with empty fields
 22. TC-E2-P1-12  Edit form pre-filled
 23. TC-E2-P1-13  Cancel edit discards changes
 24. TC-E2-P1-14  Delete dialog cancel keeps client
 25. TC-E2-P1-15  Delete confirm → removed from list, panel resets
 26. TC-E2-P1-16  Sort preserves active search filter

Phase 5 — Component P2 Gate
 27. TC-E2-P2-01  Sort A→Z no API call
 28. TC-E2-P2-02  Sort Z→A
 29. TC-E2-P2-03  Sort Más reciente (fecha-desc)
 30. TC-E2-P2-04  Default sort is Más reciente
 31. TC-E2-P2-05  Edit success toast + updated value
 32. TC-E2-P2-10  Delete with contacts → correct toast

Phase 6 — E2E Gate (P1-P3)
 33. TC-E2-P1-07  Deep link /clientes/:clienteId shows correct detail
 34. TC-E2-P1-10  Full create → appears in list (E2E)
 35. TC-E2-P3-04  Full CRUD E2E flow

Phase 7 — P3 Nice to Have
 36. TC-E2-P3-01  Sort Más antiguo
 37. TC-E2-P3-02  Toast exact Spanish strings
 38. TC-E2-P3-03  PUT updates all fields (API)
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW (Mock Service Worker) | API mocking for component tests | Frontend |
| Playwright 1.40+ | E2E tests | Frontend/E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| @tanstack/react-router (test utils) | Router rendering in tests | Frontend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ (or TestContainers Docker for backend integration tests)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- EF Core migrations applied (includes Epic 1 base migration + Epic 2 clientes migration)
```

### MSW Handler Requirements for Epic 2 Component Tests

```typescript
// Handlers needed:
GET  /api/v1/clientes          → array of clients (configurable per test)
GET  /api/v1/clientes/:id      → single client or 404
POST /api/v1/clientes          → 201 created | 400 validation | 409 duplicate NIT
PUT  /api/v1/clientes/:id      → 200 updated | 400 validation
DELETE /api/v1/clientes/:id    → 204 | 404
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 6 | 2.5 | 15.0 | Duplicate NIT, required field chain, delete cascade, query invalidation — complex multi-layer setup |
| P1 | 17 | 1.5 | 25.5 | Core CRUD behaviors, search, deep link, form flows |
| P2 | 10 | 1.0 | 10.0 | Sort variants, API contract tests, additional edge cases |
| P3 | 4 | 0.5 | 2.0 | Toast text, sort variant, full E2E flow |
| **Total** | **37** | — | **52.5 hours** | **~6.6 days** |

> Note: Counts exclude 3 additional E2E tests listed; total including E2E = 40 test cases.

### Test Data Factories Required

```typescript
// Frontend (test utils)
createMockCliente(overrides?: Partial<Cliente>): Cliente
createMockClienteList(count: number): Cliente[]
// 500-item generator for NFR1 performance test

// Backend (xUnit)
ClienteEntityBuilder with .WithNit(), .WithNombre(), .WithCiudad() fluent API
ContactoEntityBuilder with .WithClienteId() for delete cascade test
```

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (6 tests — no exceptions; all block story implementation)
- **P1 pass rate:** 100% for story closure (17 tests — required for Definition of Done per story)
- **P2 pass rate:** ≥80% before epic is marked complete (informational — may defer with justification)
- **P3 pass rate:** ≥70% (nice-to-have; deferred to next sprint acceptable)

### Coverage Targets

| Area | Target |
|------|--------|
| Critical paths (NIT duplicate, required fields, delete cascade) | 100% |
| Security scenarios (NFR5 validation, NFR6 no stack traces) | 100% |
| FR1–FR8 core CRUD operations | 100% coverage via AC matrix |
| FR30 deep linking | 100% |
| Sort behaviors (all 4 options) | 100% of ACs |
| NFR1 search performance | Verified (1 dedicated performance test) |

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] `ON DELETE SET NULL` constraint verified (TC-E2-P0-06)
- [ ] NIT/RUC uniqueness enforced end-to-end (TC-E2-P0-01 + TC-E2-P0-02)
- [ ] TanStack Query invalidation verified for all 3 mutations (TC-E2-P0-05 + related P1 tests)
- [ ] Zod schema rejects all empty required fields independently (TC-E2-P0-03)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-17)
- [ ] P2 test cases achieve ≥80% pass rate or formal deferral documented
- [ ] No P0/P1 test case is skipped without documented justification
- [ ] `uk_clientes_nit` unique index verified in database schema
- [ ] `ON DELETE SET NULL` on `contactos.cliente_id` verified via integration test
- [ ] Client-side search with 500 records completes under 1 s (NFR1 verified)
- [ ] All user-facing text in Spanish verified (toasts, errors, placeholders)
- [ ] `PUT /api/v1/clientes` and `POST /api/v1/clientes` return Problem Details (not raw errors) on failure

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **`ContactoConfiguration.cs`** must specify `ON DELETE SET NULL` for the `cliente_id` FK:
   ```csharp
   builder.HasOne(c => c.Cliente)
          .WithMany(cl => cl.Contactos)
          .HasForeignKey(c => c.ClienteId)
          .OnDelete(DeleteBehavior.SetNull);
   ```

2. **`ClienteConfiguration.cs`** must add a unique index on `nit`:
   ```csharp
   builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
   ```

3. **`DeleteClienteCommandHandler.cs`** must not explicitly delete contacts — `ON DELETE SET NULL` handles this at the DB level. Handler should only delete the `ClienteEntity`.

4. **`useCreateCliente.ts`, `useUpdateCliente.ts`, `useDeleteCliente.ts`** must each call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` inside `onSuccess`. Missing on any one of the three breaks NFR2.

5. **Search filter (`ClienteListView.tsx`)** must be implemented with `useMemo` and debounce (recommended 150 ms) to avoid re-rendering on every keypress. The memo dependency array must include both `clientes` data and `searchQuery`.

6. **Sort state** must use local React `useState` — no Zustand, no URL param, no session storage. Sort is applied as a computed `useMemo` over the already-filtered array, not as a separate query.

7. **`SortControl` component** lives at `src/shared/components/SortControl` and must expose a `value` prop accepting `"nombre-asc" | "nombre-desc" | "fecha-desc" | "fecha-asc"` and an `onChange` callback. Default value is `"fecha-desc"`.

8. **Error messages** must use Spanish exclusively: `"El NIT/RUC ya está registrado"`, `"Este campo es requerido"` (or equivalent), `"No se pudo guardar. Intenta de nuevo."`. Never expose the HTTP status code or `error.message` directly.

9. **Backend 409 response** for duplicate NIT must be generated by `CreateClienteCommandHandler` catching a unique constraint violation from EF Core (`DbUpdateException` with inner `PostgresException` code `23505`) and re-throwing a domain exception mapped to 409 in `ExceptionHandlingMiddleware`.

10. **`DateTimeOffset`** must be used for all `createdAt` / `updatedAt` fields — never `DateTime`. The test `TC-E2-P1-17` inspects column type `timestamptz` (PostgreSQL equivalent of `DateTimeOffset`).
