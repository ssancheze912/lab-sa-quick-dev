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

**Date:** 2026-05-24
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (Stories 2.1 through 2.6)

Epic 2 delivers the core CRM capability: a split-panel UI at `/clientes` where users can list, search, sort, view, create, edit, and delete client records. The backend exposes a REST API (`/api/v1/clientes`) with CRUD endpoints backed by a PostgreSQL `clientes` table. Client-side search and sort are performed over the TanStack Query cache without additional API calls.

**Risk Summary:**

- Total risks identified: 10
- High-priority risks (score ≥6): 4
- Critical categories: DATA, BUS, PERF, SEC

**Coverage Summary:**

- P0 scenarios: 8 (16.0 hours)
- P1 scenarios: 14 (14.0 hours)
- P2 scenarios: 12 (6.0 hours)
- P3 scenarios: 4 (1.0 hours)
- **Total effort:** 37.0 hours (~4.6 days)

---

## 1. Epic Overview & Test Scope

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time filter, empty state, error state, ≤1s with 500 records |
| 2.2 | Client Detail View | Deep linking `/clientes/:clienteId`, 404 graceful handling, URL update on selection |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), 409 conflict NIT/RUC, optimistic update |
| 2.4 | Edit Client | Pre-fill, mutation, cancel no-op, inline validation |
| 2.5 | Delete Client | Confirmation dialog, cascade to contacts (unassign, not delete), toast message |
| 2.6 | Sort Client List | Client-side sort over cache, 4 criteria, interaction with active search filter |

### Out of Scope for This Epic

- Client–Contact association panel within client detail — Epic 4
- Contact records — Epic 3
- Authentication / authorization — deferred from MVP
- HTTPS termination — non-local deployments only (NFR4)

---

## 2. Risk Assessment

### Risk Matrix

#### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | Client deletion silently removes associated contacts instead of unassigning them (`clienteId = null`) — data loss | 2 | 3 | 6 | API integration test: assert `contacts` table rows survive deletion, assert `cliente_id = null`; backend domain logic review | DEV/QA | Sprint 2 |
| R-002 | BUS | NIT/RUC duplicate check absent or swallowed — user can register duplicate clients breaking CRM data integrity | 2 | 3 | 6 | API integration test: POST same NIT/RUC twice, assert 409 + correct Problem Details body; frontend E2E: assert inline error shows "El NIT/RUC ya está registrado" | QA | Sprint 2 |
| R-003 | PERF | Real-time search with 500 client records causes >1s filter latency (NFR1) — client-side filter over unoptimized list renders | 2 | 3 | 6 | Component/E2E perf test: seed 500 records, type 3-char query, assert DOM update <1000ms via `performance.now()` | DEV/QA | Sprint 2 |
| R-004 | SEC | API accepts empty or whitespace-only required fields (Nombre, NIT/RUC, Teléfono, Ciudad) bypassing FluentValidation — dirty data / injection path | 2 | 3 | 6 | API integration test: POST/PUT with each required field as empty string, assert 400 + validation error body; no 201/204 returned | DEV/QA | Sprint 2 |

#### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-005 | BUS | Sort order "Más reciente" not the default on first render — users see unsorted or wrong-order list | 2 | 2 | 4 | Component test: mount `ClientList` with no prior sort state, assert first item is the newest by `createdAt` | DEV | Sprint 2 |
| R-006 | TECH | Sort via `SortControl` triggers a new API fetch instead of operating purely over the TanStack Query cache — unnecessary server calls and visual flicker | 2 | 2 | 4 | Component/unit test: intercept HTTP calls via MSW, change sort order 4 times, assert zero new network requests during sort | QA | Sprint 2 |
| R-007 | BUS | Deep link to `/clientes/:clienteId` with a non-existent ID renders a blank or crashed panel instead of a graceful not-found message | 2 | 2 | 4 | E2E test: navigate directly to `/clientes/non-existent-uuid`, assert not-found message displayed, no JS console error | QA | Sprint 2 |
| R-008 | BUS | Backend returns `clienteId` as an integer PK (sequence) instead of UUID, violating architecture standards and breaking frontend deep-link routing | 1 | 3 | 3 | API integration test: POST client, assert response body `id` matches UUID v4 regex; also assert `clientes.id` column in DB is `uuid` type | DEV | Sprint 2 |

#### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-009 | OPS | Toast messages ("Cliente creado/actualizado/eliminado") not visible on mobile viewport — insufficient z-index or position | 1 | 2 | 2 | Monitor / manual smoke on mobile |
| R-010 | BUS | "Cancelar" on edit form fires an unintended PUT or partial mutation before closing — data corruption risk | 1 | 2 | 2 | Component test: click "Cancelar" after modifying fields, assert no PUT request sent |

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)           ▌▌▌▌▌▌▌▌▌▌          6 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌    12 tests
  Component (Vitest+RTL)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   14 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌▌              6 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                            38 tests
```

### Rationale

- **API integration tests dominate** because the core risks (data integrity, validation, UUID compliance, cascade delete) live in the backend contract. `WebApplicationFactory<Program>` + TestContainers provides isolated, fast feedback without requiring a running frontend.
- **Component tests cover UI behavior** that must not require a real API: real-time filtering, sort-over-cache, form validation inline messages, optimistic updates, empty/error states. MSW intercepts prevent real network calls.
- **E2E tests cover critical full-stack flows** (create, delete with contacts, deep link, search latency) where confidence requires the real browser rendering stack and the split-panel layout.
- **Unit tests** target pure business logic: Zod schema edge cases, sort comparator functions, and FluentValidation rule sets.
- **Avoid duplicate coverage**: search/sort are covered at Component level only — no duplicate E2E sorting tests. Validation edge cases (empty string, whitespace) are at API Integration + Unit, not duplicated in E2E.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: Create Client — Happy Path (E2E)

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirements:** AC-E2.1, FR1, FR27
**Risk covered:** R-002 (duplicate guard exists), R-008 (UUID ID returned)

**Precondition:** Backend running. No client with the test NIT/RUC exists.

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente" button.
3. Fill: Nombre = "Empresa Test S.A.", NIT/RUC = "900123456-7", Teléfono = "3001234567", Ciudad = "Bogotá".
4. Click "Guardar".

**Expected Result:**
- Response status 201 from `POST /api/v1/clientes`.
- New client appears in the left panel list immediately (FR27) — no page reload required.
- Toast "Cliente creado correctamente" is visible.
- Right panel shows the new client's detail.

**Automation:** Playwright test with MSW or real backend via TestContainers.

---

#### TC-E2-P0-02: Create Client — Duplicate NIT/RUC Returns 409 (API)

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirements:** FR1, NFR6
**Risk covered:** R-002

**Precondition:** A client with NIT/RUC "900123456-7" already exists in the test database.

**Test Steps:**
1. `POST /api/v1/clientes` with body `{ "nombre": "Empresa B", "nit": "900123456-7", "telefono": "3009999999", "ciudad": "Medellín" }`.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Body contains `status: 409`, `title`, and a `detail` field referencing the NIT/RUC conflict.
- Body does NOT contain `stackTrace`, `exception`, or `innerException`.
- No second client record is created in the database.

**Automation:** xUnit with `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-03: Delete Client — Associated Contacts Are Unassigned, Not Deleted (API)

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirements:** Story 2.5 AC (contacts remain, `clienteId = null`), FR25
**Risk covered:** R-001

**Precondition:** Client C1 (UUID) exists with 2 associated contacts (C01, C02) where `cliente_id = C1.id`.

**Test Steps:**
1. `DELETE /api/v1/clientes/{C1.id}`.
2. Query `GET /api/v1/contactos/{C01.id}` and `GET /api/v1/contactos/{C02.id}`.

**Expected Result:**
- `DELETE` returns 204 No Content.
- Both contacts still exist (200 OK on GET).
- Both contacts have `clienteId: null` in their response body.
- Client C1 no longer exists: `GET /api/v1/clientes/{C1.id}` returns 404.

**Automation:** xUnit with `WebApplicationFactory<Program>` + TestContainers.

---

#### TC-E2-P0-04: Delete Client — E2E Toast and List Update

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirements:** AC-E2.5, FR27
**Risk covered:** R-001 (visual confirmation cascade doesn't break UI)

**Precondition:** At least one client exists.

**Test Steps:**
1. Navigate to `/clientes`, select a client.
2. Click "Eliminar".
3. Assert confirmation dialog appears with text "¿Eliminar este cliente?".
4. Click "Confirmar".

**Expected Result:**
- Toast message "Cliente eliminado correctamente" appears (or the cascade variant if contacts were associated).
- Client is removed from the left panel list immediately (FR27).
- Right panel returns to empty/default state.

**Automation:** Playwright.

---

#### TC-E2-P0-05: API Input Validation — Required Fields Rejected (API)

**Level:** API Integration (xUnit)
**Story:** 2.3, 2.4
**Requirements:** FR8, NFR5
**Risk covered:** R-004

**Test Steps (one xUnit theory per case):**
1. `POST /api/v1/clientes` with `nombre: ""` (empty string) — all other fields valid.
2. `POST /api/v1/clientes` with `nombre: "   "` (whitespace only).
3. `POST /api/v1/clientes` with `nit: ""`.
4. `POST /api/v1/clientes` with `telefono: ""`.
5. `POST /api/v1/clientes` with `ciudad: ""`.
6. `PUT /api/v1/clientes/{id}` with `nombre: ""` on an existing client.

**Expected Result (each case):**
- HTTP 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response body contains `errors` or `detail` listing the invalid field.
- No record is created or modified in the database.

**Automation:** xUnit `[Theory]` with `[InlineData]` variants.

---

#### TC-E2-P0-06: Client ID Is UUID (API)

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirements:** Architecture standard — UUIDs as PKs
**Risk covered:** R-008

**Test Steps:**
1. `POST /api/v1/clientes` with valid body.
2. Inspect the `id` field in the 201 response body.

**Expected Result:**
- `id` matches UUID v4 regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`.
- `GET /api/v1/clientes/{returned_id}` returns the same client.

**Automation:** xUnit.

---

#### TC-E2-P0-07: Delete Client — Confirmation Cancel Keeps Record (E2E)

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirements:** Story 2.5 AC ("Cancelar" in dialog)

**Test Steps:**
1. Navigate to `/clientes`, select a client with a known name.
2. Click "Eliminar".
3. Click "Cancelar" in the confirmation dialog.

**Expected Result:**
- Dialog closes.
- Client is still visible in the list.
- `GET /api/v1/clientes/{id}` returns 200 (record unchanged).
- No toast appears.

**Automation:** Playwright.

---

#### TC-E2-P0-08: Form Validation — Frontend Blocks Submit on Empty Required Fields (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4
**Requirements:** AC-E2.4, FR8
**Risk covered:** R-004 (frontend defense)

**Test Steps:**
1. Render `<CreateClientForm>` (or `<EditClientForm>`).
2. Leave all fields empty and click "Guardar".

**Expected Result:**
- Inline error messages appear on all 4 required fields (Nombre, NIT/RUC, Teléfono, Ciudad).
- No HTTP request is sent (MSW intercept — zero calls recorded).
- Form is NOT dismissed.

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story Is Closed as Done

---

#### TC-E2-P1-01: Client List Loads on Navigation to /clientes (E2E)

**Level:** E2E (Playwright)
**Story:** 2.1
**Requirements:** AC (scrollable list with Nombre + NIT/RUC per item)

**Test Steps:**
1. Seed 5 clients in the test database.
2. Navigate to `/clientes`.
3. Assert left panel renders list with ≥1 item showing Nombre and NIT/RUC.

**Expected Result:**
- Left panel (280px) displays scrollable client list.
- Each list item shows client name and NIT/RUC.
- No loading error.

**Automation:** Playwright.

---

#### TC-E2-P1-02: Empty State When No Clients Exist (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirements:** Story 2.1 AC (EmptyState component with guidance message)

**Test Steps:**
1. Mock `GET /api/v1/clientes` to return `[]`.
2. Render `<ClientListPanel>`.

**Expected Result:**
- `EmptyState` component is rendered.
- Contains a message guiding user to create the first client.
- No list items rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: Error State with Retry Button on Backend Unavailable (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirements:** Story 2.1 AC (ErrorPanel with "Reintentar" button)

**Test Steps:**
1. Mock `GET /api/v1/clientes` to return network error.
2. Render `<ClientListPanel>`.

**Expected Result:**
- `ErrorPanel` component is rendered.
- "Reintentar" button is visible.
- No client list items shown.
- Clicking "Reintentar" triggers a new `GET /api/v1/clientes` request (MSW intercept confirms re-fetch).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: Real-Time Search Filters List Without API Call (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirements:** AC (real-time filter by Nombre or NIT/RUC), FR3, FR4
**Risk covered:** R-006 (search must not re-fetch)

**Precondition:** Client list loaded with MSW returning 5 clients including one named "TechCorp" with NIT "800500100-1".

**Test Steps:**
1. Render `<ClientListPanel>` with 5 mocked clients.
2. Type "TechCorp" in the search field.
3. Assert only "TechCorp" appears.
4. Clear field and type "800500100".
5. Assert only "TechCorp" appears (NIT match).

**Expected Result:**
- List updates in real time (no spinner, no delay in test env).
- MSW records zero additional GET requests during typing.
- Only matching client(s) visible.
- Non-matching clients are not rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: Client Detail Loads on List Item Click (E2E)

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirements:** Story 2.2 AC, FR5, FR30

**Test Steps:**
1. Navigate to `/clientes` with ≥1 client.
2. Click on a client in the left panel.

**Expected Result:**
- Right panel shows all client fields: Nombre, NIT/RUC, Teléfono, Ciudad.
- URL updates to `/clientes/{clienteId}`.
- No full page reload.

**Automation:** Playwright.

---

#### TC-E2-P1-06: Deep Link to /clientes/:clienteId Loads Correct Record (E2E)

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirements:** Story 2.2 AC (direct URL access), FR30
**Risk covered:** R-007

**Test Steps:**
1. Seed client with known UUID (e.g., `11111111-1111-4111-8111-111111111111`).
2. Navigate directly to `/clientes/11111111-1111-4111-8111-111111111111`.

**Expected Result:**
- Right panel displays the correct client details.
- Left panel shows full client list with the linked client highlighted/selected.
- No redirect to root `/clientes`.
- No 404 or blank panel.

**Automation:** Playwright.

---

#### TC-E2-P1-07: Deep Link with Non-Existent ID Shows Not-Found Gracefully (E2E)

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirements:** Story 2.2 AC (graceful not-found)
**Risk covered:** R-007

**Test Steps:**
1. Navigate to `/clientes/00000000-0000-4000-8000-000000000000`.

**Expected Result:**
- Not-found message is displayed in the right panel.
- No JavaScript console errors (monitor `page.on('console')` for `error`).
- Left panel still shows client list.

**Automation:** Playwright.

---

#### TC-E2-P1-08: Edit Client — Form Pre-Fills with Current Values (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirements:** Story 2.4 AC, FR6

**Test Steps:**
1. Render `<EditClientForm>` with a mock client `{ nombre: "Siesa Corp", nit: "900001234-5", telefono: "6012345678", ciudad: "Cali" }`.

**Expected Result:**
- All four input fields contain the corresponding current values.
- No field is empty or shows placeholder text.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-09: Edit Client — Changes Reflected Immediately After Save (E2E)

**Level:** E2E (Playwright)
**Story:** 2.4
**Requirements:** Story 2.4 AC, FR6, FR27

**Test Steps:**
1. Select an existing client and click "Editar".
2. Change `ciudad` to "Cartagena".
3. Click "Guardar".

**Expected Result:**
- Toast "Cliente actualizado correctamente" appears.
- Right panel shows updated `ciudad = "Cartagena"` immediately.
- `GET /api/v1/clientes/{id}` (via TanStack Query cache invalidation) reflects the updated value.

**Automation:** Playwright.

---

#### TC-E2-P1-10: Edit Client — Cancel Does Not Mutate Data (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirements:** Story 2.4 AC ("Cancelar" no-op)
**Risk covered:** R-010

**Test Steps:**
1. Render `<EditClientForm>` pre-filled.
2. Change `nombre` to "Modified Name".
3. Click "Cancelar".

**Expected Result:**
- Form closes.
- MSW records zero PUT requests.
- Original client data unchanged.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Sort Default Is "Más reciente" on Initial Load (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** Story 2.6 AC (default sort = "Más reciente")
**Risk covered:** R-005

**Test Steps:**
1. Render `<ClientListPanel>` with 3 mocked clients having distinct `createdAt` timestamps (oldest, middle, newest).
2. Assert initial render order without any user interaction.

**Expected Result:**
- `SortControl` shows "Más reciente" as selected option.
- Client list is ordered newest-first (most recent `createdAt` at top).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-12: Sort Does Not Trigger New API Request (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** Story 2.6 Technical Context (client-side sort over TanStack Query cache)
**Risk covered:** R-006

**Test Steps:**
1. Render `<ClientListPanel>` with 5 mocked clients loaded via MSW.
2. Change sort to "Nombre A→Z".
3. Change sort to "Nombre Z→A".
4. Change sort to "Más antiguo".
5. Change sort to "Más reciente".

**Expected Result:**
- MSW records exactly 1 GET request (initial load) — zero additional requests during all 4 sort changes.
- List order updates visually after each sort change.

**Automation:** Vitest + RTL + MSW request tracking.

---

#### TC-E2-P1-13: Sort Applied on Filtered Results — Search Not Cleared (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** AC-E2.6, Story 2.6 AC

**Test Steps:**
1. Load 5 clients; 2 have "Corp" in the name (different `createdAt` values).
2. Type "Corp" in search field → 2 clients shown.
3. Change sort to "Nombre A→Z".

**Expected Result:**
- Search field still contains "Corp".
- Only the 2 "Corp" clients are shown (filter not cleared).
- The 2 clients are ordered alphabetically ascending.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: DELETE Client API Returns 404 for Non-Existent Record (API)

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirements:** Standard REST behavior

**Test Steps:**
1. `DELETE /api/v1/clientes/00000000-0000-4000-8000-000000000000`.

**Expected Result:**
- HTTP 404 Not Found.
- `Content-Type: application/problem+json`.
- No unhandled exception or 500 error.

**Automation:** xUnit.

---

### P2 — Should Pass Before Epic Is Marked Complete

---

#### TC-E2-P2-01: Sort Nombre A→Z Orders List Alphabetically (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** Story 2.6 AC

**Test Steps:**
1. Load clients: ["Zebra SA", "Apple Inc", "Mango Corp"].
2. Select "Nombre A→Z".

**Expected Result:** Order is ["Apple Inc", "Mango Corp", "Zebra SA"].

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-02: Sort Nombre Z→A Orders List Reverse Alphabetically (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** Story 2.6 AC

**Test Steps:**
1. Load clients: ["Zebra SA", "Apple Inc", "Mango Corp"].
2. Select "Nombre Z→A".

**Expected Result:** Order is ["Zebra SA", "Mango Corp", "Apple Inc"].

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-03: Sort Más antiguo Orders by createdAt Ascending (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirements:** Story 2.6 AC

**Test Steps:**
1. Load 3 clients with `createdAt`: 2026-01-10, 2026-01-15, 2026-01-05.
2. Select "Más antiguo".

**Expected Result:** Client with `createdAt = 2026-01-05` is first.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-04: GET /api/v1/clientes Returns Full List (API)

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirements:** FR2

**Test Steps:**
1. Seed 3 clients.
2. `GET /api/v1/clientes`.

**Expected Result:**
- HTTP 200.
- Response is a JSON array with 3 items.
- Each item has `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (DateTimeOffset).

**Automation:** xUnit.

---

#### TC-E2-P2-05: PUT /api/v1/clientes/{id} Updates All Fields (API)

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirements:** FR6

**Test Steps:**
1. Seed client.
2. `PUT /api/v1/clientes/{id}` with all 4 fields changed.
3. `GET /api/v1/clientes/{id}`.

**Expected Result:**
- PUT returns 200 or 204.
- GET returns updated values for all 4 fields.

**Automation:** xUnit.

---

#### TC-E2-P2-06: GET /api/v1/clientes/{id} Returns 404 for Non-Existent Record (API)

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirements:** REST standard + NFR6

**Test Steps:**
1. `GET /api/v1/clientes/00000000-0000-4000-8000-000000000000`.

**Expected Result:**
- HTTP 404.
- `Content-Type: application/problem+json`.
- No stack trace in body.

**Automation:** xUnit.

---

#### TC-E2-P2-07: Delete Client with No Contacts — Standard 204 Response (API)

**Level:** API Integration (xUnit)
**Story:** 2.5

**Test Steps:**
1. Seed client with 0 associated contacts.
2. `DELETE /api/v1/clientes/{id}`.
3. `GET /api/v1/clientes/{id}`.

**Expected Result:**
- DELETE returns 204.
- GET returns 404 (record removed).

**Automation:** xUnit.

---

#### TC-E2-P2-08: Delete Client with Contacts — Toast Shows Cascade Message (E2E)

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirements:** Story 2.5 AC (toast variant when contacts were associated)

**Test Steps:**
1. Seed client C1 with 1 associated contact.
2. Navigate to `/clientes`, select C1, click "Eliminar", click "Confirmar".

**Expected Result:**
- Toast reads "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
- Client removed from list.

**Automation:** Playwright.

---

#### TC-E2-P2-09: Search Shows No Results for Unmatched Query (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.1

**Test Steps:**
1. Load 3 clients, none matching "ZZZZZ".
2. Type "ZZZZZ" in search field.

**Expected Result:**
- Client list is empty (0 items rendered).
- No error state — just empty filtered list.
- EmptyState or "No results" feedback shown if implemented.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-10: Zod Schema Rejects Empty Nombre on Frontend (Unit)

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirements:** FR8

**Test Steps:**
1. Call `clienteSchema.safeParse({ nombre: "", nit: "9001", telefono: "300", ciudad: "Bogotá" })`.
2. Call `clienteSchema.safeParse({ nombre: "   ", nit: "9001", telefono: "300", ciudad: "Bogotá" })`.

**Expected Result:**
- Both return `{ success: false }` with `errors` on `nombre` path.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-11: Sort Comparator Functions Return Correct Order (Unit)

**Level:** Unit (Vitest)
**Story:** 2.6

**Test Steps:**
1. Import sort comparator for each of the 4 sort options (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`).
2. Pass an unsorted array of 3 client objects, assert sorted output.

**Expected Result:**
- Each comparator returns the expected order per sort identifier.
- Case-insensitive comparison for `nombre-asc` and `nombre-desc`.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-12: FluentValidation — NIT/RUC Format Validation (Unit)

**Level:** Unit (xUnit)
**Story:** 2.3

**Test Steps:**
1. Instantiate `CreateClienteCommandValidator`.
2. Validate commands with: valid NIT, empty NIT, whitespace-only NIT.

**Expected Result:**
- Valid NIT: passes validation.
- Empty / whitespace: fails with `NotEmpty` rule error.

**Automation:** xUnit unit test.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: Search Latency ≤1s with 500 Records (Performance)

**Level:** Component / E2E performance measurement
**Story:** 2.1
**Requirements:** AC-E2.2, NFR1
**Risk covered:** R-003

**Test Steps:**
1. Seed/mock 500 client records.
2. Render client list.
3. Measure time from first keystroke to DOM update completion using `performance.now()`.

**Expected Result:**
- Filter completes within 1000ms for a 3-character search query.

**Automation:** Playwright `page.evaluate()` or Vitest timer measurement.

---

#### TC-E2-P3-02: Client List Scrollable — Overflow Does Not Break Layout (Component)

**Level:** Component (Vitest + RTL)
**Story:** 2.1

**Test Steps:**
1. Load 30+ clients.
2. Assert parent container has `overflow-y: auto` or `scroll`.

**Expected Result:**
- Container renders without overflowing outside 280px panel boundaries.

**Automation:** Vitest + RTL CSS assertion.

---

#### TC-E2-P3-03: Toast Visible on Mobile Viewport (E2E)

**Level:** E2E (Playwright)
**Story:** 2.3, 2.5
**Risk covered:** R-009

**Test Steps:**
1. Set viewport to 375px width.
2. Create a new client.
3. Assert success toast is visible on screen.

**Expected Result:**
- Toast is visible (not hidden behind bottom navigation bar).

**Automation:** Playwright mobile viewport.

---

#### TC-E2-P3-04: Client List Renders in Multiple Browsers (E2E)

**Level:** E2E (Playwright multi-browser)
**Story:** 2.1
**Requirements:** Architecture — Chrome, Firefox, Edge (last 2 versions)

**Test Steps:**
1. Run TC-E2-P1-01 (client list loads) across Chrome, Firefox, Edge.

**Expected Result:**
- List renders correctly in all three browsers.

**Automation:** Playwright with `--project=chromium,firefox,webkit` configuration.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Test Cases | Level | Status |
|----------------|-----------|-------|--------|
| AC-E2.1: Register client, appears in list immediately | TC-E2-P0-01, TC-E2-P0-08 | E2E, Component | Covered |
| AC-E2.2: Search by name or NIT/RUC, results <1s | TC-E2-P1-04, TC-E2-P3-01 | Component, Perf | Covered |
| AC-E2.3: View full detail, edit any field, save changes | TC-E2-P1-05, TC-E2-P1-08, TC-E2-P1-09 | E2E, Component | Covered |
| AC-E2.4: System prevents save with empty required fields | TC-E2-P0-05, TC-E2-P0-08 | API, Component | Covered |
| AC-E2.5: Delete client, disappears from list | TC-E2-P0-04, TC-E2-P0-07, TC-E2-P2-08 | E2E | Covered |
| AC-E2.6: Sort without reloading or losing search filter | TC-E2-P1-12, TC-E2-P1-13, TC-E2-P2-01..03 | Component | Covered |
| Story 2.1: Left panel 280px scrollable list | TC-E2-P1-01, TC-E2-P3-02 | E2E, Component | Covered |
| Story 2.1: Real-time filter | TC-E2-P1-04 | Component | Covered |
| Story 2.1: EmptyState when no clients | TC-E2-P1-02 | Component | Covered |
| Story 2.1: ErrorPanel with Reintentar on failure | TC-E2-P1-03 | Component | Covered |
| Story 2.2: Click → right panel shows full detail | TC-E2-P1-05 | E2E | Covered |
| Story 2.2: URL updates to /clientes/:clienteId | TC-E2-P1-05, TC-E2-P1-06 | E2E | Covered |
| Story 2.2: Direct URL access (deep link) | TC-E2-P1-06 | E2E | Covered |
| Story 2.2: Non-existent clienteId graceful not-found | TC-E2-P1-07 | E2E | Covered |
| Story 2.3: Form with 4 required fields opens | TC-E2-P0-08 | Component | Covered |
| Story 2.3: Client created, toast shown | TC-E2-P0-01 | E2E | Covered |
| Story 2.3: Frontend validation blocks submit | TC-E2-P0-08 | Component | Covered |
| Story 2.3: 409 conflict on duplicate NIT/RUC | TC-E2-P0-02 | API | Covered |
| Story 2.4: Form pre-filled with current values | TC-E2-P1-08 | Component | Covered |
| Story 2.4: Changes reflected immediately after save | TC-E2-P1-09 | E2E | Covered |
| Story 2.4: Validation on edit blocks submit | TC-E2-P0-05, TC-E2-P0-08 | API, Component | Covered |
| Story 2.4: Cancel — original data unchanged | TC-E2-P1-10 | Component | Covered |
| Story 2.5: Confirmation dialog shown | TC-E2-P0-04 | E2E | Covered |
| Story 2.5: Client removed, right panel resets | TC-E2-P0-04 | E2E | Covered |
| Story 2.5: Cancel dialog — record unchanged | TC-E2-P0-07 | E2E | Covered |
| Story 2.5: Contacts unassigned on delete (not deleted) | TC-E2-P0-03 | API | Covered |
| Story 2.5: Toast cascade variant | TC-E2-P2-08 | E2E | Covered |
| Story 2.6: Default sort = Más reciente | TC-E2-P1-11 | Component | Covered |
| Story 2.6: No API calls on sort change | TC-E2-P1-12 | Component | Covered |
| Story 2.6: Sort applied to filtered results | TC-E2-P1-13 | Component | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search <1s with 500 records | TC-E2-P3-01 | Performance / E2E |
| NFR2 | CRUD UI update <2s | TC-E2-P0-01, TC-E2-P1-09 | E2E (implicit) |
| NFR5 | API input validation + sanitization | TC-E2-P0-05, TC-E2-P2-10, TC-E2-P2-12 | API, Unit |
| NFR6 | No stack traces exposed | TC-E2-P0-02, TC-E2-P2-06, TC-E2-P1-14 | API |
| NFR10 | 500 clients max — no hardcoded limit | TC-E2-P3-01 (500-record perf test) | Perf |
| NFR11 | UUID PKs (no hardcoded limits in model) | TC-E2-P0-06 | API |

---

## 7. Test Execution Order

```
Phase 1 — API Contract Gate (P0, no browser required)
  1. TC-E2-P0-06  UUID ID returned on POST
  2. TC-E2-P0-05  Required field validation (6 theory variants)
  3. TC-E2-P0-02  Duplicate NIT/RUC returns 409
  4. TC-E2-P0-03  Delete cascade — contacts unassigned
  5. TC-E2-P2-04  GET full list returns array
  6. TC-E2-P2-05  PUT updates all fields
  7. TC-E2-P2-06  GET non-existent returns 404
  8. TC-E2-P2-07  DELETE no-contacts returns 204
  9. TC-E2-P1-14  DELETE non-existent returns 404
 10. TC-E2-P2-12  FluentValidation NIT unit test
 11. TC-E2-P2-11  Sort comparator unit tests
 12. TC-E2-P2-10  Zod schema unit tests

Phase 2 — Component Tests (P0-P1, MSW)
 13. TC-E2-P0-08  Frontend blocks submit on empty fields
 14. TC-E2-P1-02  EmptyState on empty list
 15. TC-E2-P1-03  ErrorPanel with Reintentar
 16. TC-E2-P1-04  Real-time search — no API calls
 17. TC-E2-P1-08  Edit form pre-fills
 18. TC-E2-P1-10  Cancel edit — no PUT
 19. TC-E2-P1-11  Default sort = Más reciente
 20. TC-E2-P1-12  Sort — zero re-fetches
 21. TC-E2-P1-13  Sort applied to filtered results
 22. TC-E2-P2-01  Sort A→Z
 23. TC-E2-P2-02  Sort Z→A
 24. TC-E2-P2-03  Sort Más antiguo
 25. TC-E2-P2-09  Search no results

Phase 3 — E2E Full-Stack (P0-P1, Playwright + backend)
 26. TC-E2-P0-01  Create client happy path
 27. TC-E2-P0-07  Delete — cancel dialog
 28. TC-E2-P0-04  Delete — confirm, list updates, toast
 29. TC-E2-P1-01  List loads on navigation
 30. TC-E2-P1-05  Click → detail + URL update
 31. TC-E2-P1-06  Deep link to known ID
 32. TC-E2-P1-07  Deep link to non-existent ID
 33. TC-E2-P1-09  Edit → immediate update + toast
 34. TC-E2-P2-08  Delete with contacts — cascade toast

Phase 4 — P3 / Performance (on demand)
 35. TC-E2-P3-01  Search latency ≤1s / 500 records
 36. TC-E2-P3-02  List scrollable overflow
 37. TC-E2-P3-03  Toast visible on mobile
 38. TC-E2-P3-04  Multi-browser smoke
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Layer |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering + user interaction simulation | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW (Mock Service Worker) | Intercept HTTP calls in component tests | Frontend |
| Playwright 1.40+ | E2E full-stack tests (browser automation) | E2E |
| xUnit 2+ | Backend unit + integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing without real server | Backend |
| TestContainers (Postgres) | Isolated PostgreSQL for integration tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432 OR TestContainers Docker
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- MSW service worker registered in test setup (setupFilesAfterFramework)
- Playwright browsers installed (npx playwright install)
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 8 | 2.0 | 16.0 | Complex setup: cascade delete, duplicate guard, optimistic UI |
| P1 | 14 | 1.0 | 14.0 | Standard: deep link, sort, filter, edit form, error states |
| P2 | 12 | 0.5 | 6.0 | Simple: comparator units, GET/PUT/DELETE coverage, edge cases |
| P3 | 4 | 0.25 | 1.0 | Performance, multi-browser, layout overflow |
| **Total** | **38** | — | **37.0 hours** | **~4.6 days** |

### Test Data

- `ClienteFactory` — faker-based: `nome`, `nit` (Colombian format), `telefono`, `ciudad`. Auto-cleanup after each test.
- `ContactoFactory` (minimal, for cascade delete tests): `nombre`, `email`, `clienteId`.
- Seed scripts: 3-client standard seed, 500-client performance seed, 1-client-with-2-contacts delete-cascade seed.

### Prerequisites

- `TestContainers` Postgres container for all API integration tests requiring real DB.
- MSW handlers for: `GET /api/v1/clientes` (list), `POST`, `PUT /api/v1/clientes/:id`, `DELETE /api/v1/clientes/:id`, `GET /api/v1/clientes/:id`.
- Playwright `beforeEach` that seeds and tears down test clients via API (not UI).

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (8 tests — no exceptions, no waivers)
- **P1 pass rate**: ≥95% (14 tests — up to 1 failure with documented justification)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations** (R-001, R-002, R-003, R-004): 100% verified before Epic 2 closure

### Coverage Targets

- **Critical paths** (create, delete, deep link): 100%
- **Security scenarios** (NFR5 — input validation, NFR6 — no stack trace): 100%
- **Business logic** (sort, filter, cascade delete, duplicate guard): ≥80% of ACs covered by automated tests
- **Edge cases** (empty state, error state, cancel, non-existent ID): ≥70%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-08)
- [ ] R-001 verified: contacts survive client deletion with `clienteId = null`
- [ ] R-002 verified: 409 returned on duplicate NIT/RUC + frontend inline error
- [ ] R-004 verified: 400 returned for empty/whitespace required fields + Zod blocks frontend submit
- [ ] R-008 verified: client `id` is UUID v4 — no integer PK

---

## 9. Mitigation Plans

### R-001: Client Deletion Cascades to Contacts (Score: 6)

**Mitigation Strategy:** Implement soft unassign on `DELETE /api/v1/clientes/{id}` — backend domain service queries associated contacts and sets `cliente_id = null` before removing the client record, all within a single database transaction. Frontend toast must read cascade variant when `unassignedCount > 0` (returned in 204 response header or body).
**Owner:** DEV
**Timeline:** Sprint 2, before Story 2.5 implementation complete
**Status:** Planned
**Verification:** TC-E2-P0-03 (API), TC-E2-P2-08 (E2E)

### R-002: Duplicate NIT/RUC Not Rejected (Score: 6)

**Mitigation Strategy:** Add unique constraint on `clientes.nit` column in EF Core migration. Handle `DbUpdateException` / `UniqueConstraintException` in the backend handler to return Problem Details 409. Frontend must display "El NIT/RUC ya está registrado" from the API `detail` field without raw exception info.
**Owner:** DEV
**Timeline:** Sprint 2, before Story 2.3 implementation complete
**Status:** Planned
**Verification:** TC-E2-P0-02 (API), TC-E2-P0-01 (E2E confirms no duplicate shown)

### R-003: Search Latency >1s with 500 Records (Score: 6)

**Mitigation Strategy:** Implement client-side filter using `useMemo` over the TanStack Query cached array. Use a 150ms debounce on the search input to avoid filtering on every keystroke. Avoid re-rendering the full list on each keystroke — use virtualization (e.g., `@tanstack/react-virtual`) if benchmark shows >1s.
**Owner:** DEV
**Timeline:** Sprint 2 — benchmark during implementation; add virtualization if needed before Story 2.1 is closed
**Status:** Planned
**Verification:** TC-E2-P3-01 (performance benchmark)

### R-004: API Accepts Empty/Whitespace Required Fields (Score: 6)

**Mitigation Strategy:** Add `NotEmpty()` + `NotNull()` FluentValidation rules for all 4 required fields in `CreateClienteCommandValidator` and `UpdateClienteCommandValidator`. Register `ValidationBehavior` pipeline in MediatR. Frontend Zod schema must use `.min(1)` and `.trim()` on all required string fields.
**Owner:** DEV
**Timeline:** Sprint 2, before any create/edit story begins
**Status:** Planned
**Verification:** TC-E2-P0-05 (API), TC-E2-P0-08 (Component), TC-E2-P2-10 (Unit), TC-E2-P2-12 (Unit)

---

## 10. Assumptions and Dependencies

### Assumptions

1. Epic 1 (Foundation) is complete: backend runs on port 5000 with Problem Details middleware, EF Core migrations applied, frontend runs on 5173 with TanStack Router configured.
2. `clientes` table migration is created as part of Story 2.3 implementation (not pre-existing).
3. `contactos` table exists (Epic 3) OR a minimal stub exists for cascade-delete tests; if not, TC-E2-P0-03 uses a pre-seeded `contactos` row directly via TestContainers.
4. `SortControl` component at `src/shared/components/SortControl` is implemented per technical context in Story 2.6 with the 4 sort option identifiers.
5. TanStack Query `invalidateQueries` is used after all mutations (create, update, delete) — no manual cache updates that could desync.

### Dependencies

1. `ClienteFactory` (Faker-based) — must be implemented before any E2E test requiring seed data (Sprint 2, Day 1).
2. MSW handler set for `/api/v1/clientes` — required before component tests can run (Sprint 2, Day 1).
3. TestContainers Postgres container — must be configured in `xunit.fixture.cs` before API integration tests (Sprint 2, Day 1).
4. Epic 3 (Contactos) stub or minimal seeder — required for TC-E2-P0-03 cascade delete test.

### Risks to Plan

- **Risk**: Epic 3 not started when Epic 2 is tested — `contactos` table may not exist.
  - **Impact**: TC-E2-P0-03 cannot run against real DB without the contacts table.
  - **Contingency**: Create a minimal migration that adds `contactos` table with `id UUID, cliente_id UUID NULL` for the cascade test scope only; or defer TC-E2-P0-03 to run after Epic 3 migration is applied.

---

## 11. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-08)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-14)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] R-001, R-002, R-003, R-004 mitigations verified (cascade delete, duplicate guard, search perf, input validation)
- [ ] TypeScript build `npx tsc --noEmit` exits 0 after Epic 2 additions
- [ ] `dotnet build` and `dotnet test` pass with zero failures

---

## 12. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. `clientes.nit` column **must have a UNIQUE constraint** in the EF Core migration — required for TC-E2-P0-02.
2. `DELETE /api/v1/clientes/{id}` **must unassign contacts** (set `cliente_id = null`) in a single atomic transaction before deleting the client — required for TC-E2-P0-03.
3. `FluentValidation` rules for `CreateClienteCommand` and `UpdateClienteCommand` **must reject empty strings and whitespace** (use `.NotEmpty().NotNull()`) — required for TC-E2-P0-05.
4. `POST /api/v1/clientes` **must return the full client DTO including `id` as UUID** in the 201 Created body — required for TC-E2-P0-06.
5. `SortControl` state **must be managed with React `useState`** (no Zustand for this local UI concern) — required for TC-E2-P1-12 to detect zero extra fetches.
6. The default sort option passed to `SortControl` on mount **must be `"fecha-desc"`** ("Más reciente") — required for TC-E2-P1-11.
7. Search filtering **must use `useMemo`** over the cached array, not a separate API call — required for TC-E2-P1-04.
8. Frontend Zod schema for client form **must use `.trim().min(1)`** on all 4 required fields — required for TC-E2-P0-08.
9. The 409 conflict response body **must contain a `detail` field** with a human-readable message (not a raw exception) — required for TC-E2-P0-02 and NFR6.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (TC-E2-P0-01 through TC-E2-P0-08) as Playwright/xUnit scaffolds.
- Run `*automate` for broader coverage automation once Story 2.1–2.6 implementations exist.
- Run `*trace` to formally link each test case ID to its story AC and FR reference.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam — Date: ___
- [ ] Tech Lead: SiesaTeam — Date: ___
- [ ] QA Lead: SiesaTeam — Date: ___

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories: TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` — Probability × impact matrix (score ≥6 = high priority)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit selection
- `test-priorities-matrix.md` — P0-P3 criteria and execution frequency

### Related Documents

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Functional requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-functional requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic 1 test design (reference): `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
