---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-04"
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

Epic 2 delivers full CRUD functionality for the client catalog. The commercial team can register new clients (Nombre, NIT/RUC, Teléfono, Ciudad), view a scrollable list with real-time search by name or NIT/RUC, view client detail in a split-panel layout via deep link, edit all fields, delete with confirmation, and sort the list client-side by multiple criteria — all without page reloads. This epic activates the first domain entity (`clientes` table) and all its API endpoints.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | List fetch, real-time filtering (≤1s/500 records), empty state, error panel |
| 2.2 | Client Detail View | Split-panel right panel, deep linking `/clientes/:clienteId`, not-found graceful |
| 2.3 | Create Client | Form validation, NIT/RUC uniqueness (409), optimistic list update, success toast |
| 2.4 | Edit Client | Pre-fill form, save/cancel behavior, validation on edit, optimistic update |
| 2.5 | Delete Client | Confirmation dialog, cascade contact unassignment, success toast, list update |
| 2.6 | Sort Client List | Client-side sort (no extra fetch), 4 criteria, sort + filter combined, default order |

### Out of Scope for This Epic

- Contact management (Epic 3) and client-contact association (Epic 4)
- Authentication / authorization (deferred — MVP has no auth)
- "Sin cliente" filter — contact unassignment visibility tested in Epic 4
- HTTPS configuration — non-local deployments only (NFR4)
- Pagination beyond 500 records (NFR10 defines MVP ceiling)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **NIT/RUC uniqueness constraint** missing at DB or API level — duplicate records silently created | High | Critical | P0 | Integration test: POST two clients with identical NIT/RUC; assert second returns 409 with correct error message; verify DB unique index `uk_clients_nit_ruc` |
| R2 | **Required-field validation bypass** — frontend validation skipped; backend FluentValidation absent; empty client persisted | High | Critical | P0 | Unit test (Zod schema) + Integration test (POST with missing fields → 422) + Component test (form submit blocked, inline errors visible) |
| R3 | **Delete cascade contact unassignment** — contacts become orphaned (deleted) or FK constraint blocks deletion | High | Critical | P0 | Integration test: create client + contacts, delete client; assert contacts remain with `clienteId = null`; assert toast shows unassignment message |
| R4 | **Real-time search performance** — filtering over 500 records exceeds 1s (NFR1) | Medium | High | P1 | Component performance test: render list with 500 mocked records; measure filter re-render time ≤1s |
| R5 | **TanStack Query cache invalidation** missing after CUD operations — UI shows stale data | Medium | High | P1 | Component test: create/edit/delete; assert list reflects change without manual reload (FR27) |
| R6 | **Deep link `/clientes/:clienteId`** fails — non-existent ID shows unhandled error instead of graceful not-found | Medium | High | P1 | E2E test: navigate directly to invalid UUID route; assert not-found message rendered (no JS crash) |
| R7 | **Client-side sort does not trigger new API call** — sort triggers unnecessary fetch, breaking NFR and UX contract | Medium | Medium | P1 | Component test: spy on `fetch`/axios; change sort criteria; assert no new network request issued |
| R8 | **Sort + active search filter clears search input** — changing sort order resets the filter (AC-E2.6) | Medium | Medium | P1 | Component test: apply search, change sort; assert search input value unchanged and filtered+sorted results displayed |
| R9 | **Confirmation dialog for delete** absent or skippable — client deleted without user confirmation | Medium | High | P1 | Component test: click "Eliminar"; assert dialog rendered; assert client NOT deleted until "Confirmar" clicked |
| R10 | **Success/error toasts** not shown after mutations — user has no feedback on CUD result | Low | Medium | P2 | Component test: verify toast appears after successful create/edit/delete; verify error toast on 409 |
| R11 | **Problem Details format** not used for API errors — raw exceptions exposed (NFR6) | Low | High | P2 | Integration test (inherited from Epic 1 — verify same middleware covers `/api/clientes` endpoints) |
| R12 | **URL update on client selection** (`/clientes/:clienteId`) — URL does not update when clicking list item | Low | Medium | P2 | Component/E2E test: click list item; assert URL contains clienteId; assert back-button restores list state |
| R13 | **Empty state component** not rendered when no clients exist | Low | Low | P3 | Component test: render list with empty MSW response; assert EmptyState component visible |
| R14 | **Error panel with Reintentar** not rendered when backend unavailable | Low | Medium | P2 | Component test: MSW returns network error; assert ErrorPanel with "Reintentar" button visible |

### Top 3 Risk Areas for Epic 2

1. **Data integrity risks (R1, R2, R3)** — NIT/RUC uniqueness, required-field bypass, and delete cascade are all P0 risks where missing validation leads to corrupt or irrecoverable data states. These must be verified at both frontend (Zod) and backend (FluentValidation + DB constraint) levels.
2. **Cache and real-time UI consistency (R5)** — FR27 mandates that all changes reflect immediately. If TanStack Query invalidation is misconfigured after any mutation, the UI shows stale data without any visible error, making bugs hard to detect and impactful for all users.
3. **Search performance under load (R4)** — NFR1 mandates ≤1s search with 500 records. Client-side filtering on a DOM list of 500 items is a known performance risk with React if not virtualized or debounced properly.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)              ▌▌▌▌▌          4 tests
  API Integration (xUnit)       ▌▌▌▌▌▌▌▌▌▌▌▌  12 tests
  Component (Vitest+RTL+MSW)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  20 tests
  Unit (Vitest/xUnit)           ▌▌▌▌▌▌▌▌▌     9 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                         45 tests
```

### Rationale

- **Component tests dominate** because Epic 2 is UI-intensive: form behavior, list filtering, sort interaction, confirmation dialogs, toasts, and empty/error states are all rendered behavior best validated at component level with MSW mocking the API layer.
- **API integration tests are substantial** because all CRUD endpoints introduce new domain logic: uniqueness constraints, cascade delete, FluentValidation rules, and Problem Details responses must be verified at the HTTP boundary.
- **E2E tests are focused** on the critical user journeys: full create flow, deep linking, and delete cascade — scenarios where frontend+backend interaction is the highest risk.
- **Unit tests target** Zod schemas, domain entity factory, sort utility, and backend FluentValidation validators — fast and isolated coverage of business rules.

### Test Tool Assignments

| Level | Tool | Scope |
|-------|------|-------|
| Unit (FE) | Vitest | Zod schema, sort utility, entity mappers |
| Unit (BE) | xUnit | FluentValidation rules, domain entity `Create()` factory |
| Component | Vitest + RTL + MSW | All UI behaviors: list, search, sort, forms, dialogs, toasts |
| API Integration | xUnit + WebApplicationFactory | CRUD endpoints, uniqueness, cascade, validation, Problem Details |
| E2E | Playwright | Critical user journeys: create, deep link, delete with cascade |

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

---

#### TC-E2-P0-01: NIT/RUC Uniqueness Constraint Enforced at API Level

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-2.3 (409 on duplicate NIT/RUC), NFR5
**Risk covered:** R1

**Precondition:** Backend running with database seeded with one client `{ nombre: "Empresa A", nitRuc: "900123456-1", telefono: "3001234567", ciudad: "Bogotá" }`.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ nombre: "Empresa B", nitRuc: "900123456-1", telefono: "3009999999", ciudad: "Medellín" }`.
2. Inspect response status and body.

**Expected Result:**
- HTTP 409 Conflict.
- Response body follows Problem Details RFC 7807: `{ "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado" }`.
- No second client record created in database.
- No stack trace or internal exception detail exposed.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P0-02: NIT/RUC Unique Index Exists in Database

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-2.3 (uniqueness), NFR5 (sanitization/validation)
**Risk covered:** R1

**Precondition:** EF Core migration for `clientes` table has been applied.

**Test Steps:**
1. Query `information_schema.table_constraints` in `siesa_agents_db` for table `clients` (or `clientes`).
2. Filter for constraint type `UNIQUE` on column `nit_ruc`.

**Expected Result:**
- A unique constraint named `uk_clients_nit_ruc` (or equivalent) exists on the `nit_ruc` column.
- The migration script contains no `null` nullable option on `nit_ruc` (required field).

**Automation:** xUnit integration test using TestContainers Postgres after `database.EnsureCreated()`.

---

#### TC-E2-P0-03: Backend Rejects Client with Missing Required Fields

**Level:** API Integration
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4 (required fields), FR8, NFR5
**Risk covered:** R2

**Precondition:** Backend running.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ nombre: "", nitRuc: "900000001-1", telefono: "3001234567", ciudad: "Bogotá" }` (empty nombre).
2. POST `/api/v1/clientes` with body `{ nitRuc: "900000001-2", telefono: "3001234567", ciudad: "Bogotá" }` (missing nombre entirely).
3. POST `/api/v1/clientes` with body `{}` (all fields missing).

**Expected Result (each case):**
- HTTP 422 Unprocessable Entity (or 400 Bad Request).
- Response body follows Problem Details format with `errors` listing which fields are invalid.
- No client record created in database.

**Automation:** xUnit integration test — 3 sub-cases in one `[Theory]` test.

---

#### TC-E2-P0-04: Frontend Zod Schema Blocks Submission with Empty Fields

**Level:** Unit
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4 (inline error messages), FR8
**Risk covered:** R2

**Precondition:** Zod client schema defined (all 4 fields required, non-empty string).

**Test Steps:**
1. Parse `{ nombre: "", nitRuc: "900000001-1", telefono: "3001234567", ciudad: "Bogotá" }` through the Zod schema.
2. Parse `{ nombre: "Test", nitRuc: "", telefono: "3001234567", ciudad: "Bogotá" }`.
3. Parse `{}` (all empty).
4. Parse `{ nombre: "Test", nitRuc: "900000001-1", telefono: "3001234567", ciudad: "Bogotá" }` (valid).

**Expected Result:**
- Cases 1–3: `schema.safeParse()` returns `{ success: false }` with `error.issues` identifying each empty field.
- Case 4: `schema.safeParse()` returns `{ success: true }`.

**Automation:** Vitest unit test — 4 sub-cases.

---

#### TC-E2-P0-05: Frontend Form Shows Inline Errors and Blocks Submission

**Level:** Component
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4 (clear inline error messages, form NOT submitted)
**Risk covered:** R2

**Precondition:** `ClientForm` component rendered with MSW — no network call expected on failed validation.

**Test Steps:**
1. Render `<ClientForm />` in create mode.
2. Leave all fields empty.
3. Click the submit button.
4. Assert inline error messages appear.
5. Assert that MSW received zero POST requests (form not submitted).

**Expected Result:**
- Error messages appear adjacent to each required field (at minimum one per empty field).
- No HTTP request is issued to the backend.
- Form remains open (not closed/navigated away).

**Automation:** Vitest + RTL + MSW request spy.

---

#### TC-E2-P0-06: Delete Client — Contacts Become Unassigned (cascade behavior)

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 (contacts remain, `clienteId = null`), FR7, FR25
**Risk covered:** R3

**Precondition:** Database seeded with: client `C1`, and contacts `K1` and `K2` both with `clienteId = C1.id`.

**Test Steps:**
1. DELETE `/api/v1/clientes/{C1.id}`.
2. GET `/api/v1/contactos/{K1.id}`.
3. GET `/api/v1/contactos/{K2.id}`.
4. GET `/api/v1/clientes/{C1.id}`.

**Expected Result:**
- DELETE returns HTTP 204 (or 200).
- K1 and K2 still exist (GET returns 200) with `clienteId: null`.
- C1 GET returns 404 (deleted).
- No FK constraint violation or 500 error.

**Automation:** xUnit integration test using TestContainers Postgres.

---

### P1 — Must Pass Before Story is Closed as Done

---

#### TC-E2-P1-01: Client List Loads and Renders Correctly

**Level:** Component
**Story:** 2.1
**Requirement:** AC-2.1 (scrollable list, Nombre + NIT/RUC per item), FR2

**Precondition:** MSW returns 3 client records.

**Test Steps:**
1. Render the client list component (or full `/clientes` route).
2. Wait for data to load (TanStack Query resolves).
3. Assert list items.

**Expected Result:**
- 3 list items rendered.
- Each item displays at minimum `nombre` and `nitRuc`.
- Left panel (or list container) is scrollable (overflow-y).
- No loading skeleton visible after data resolves.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Real-Time Search Filters List Without API Call

**Level:** Component
**Story:** 2.1
**Requirement:** AC-E2.2 (search by nombre or NIT/RUC, ≤1s), FR3, FR4, NFR1
**Risk covered:** R4, R5

**Precondition:** MSW returns 5 client records: 3 with `nombre` containing "Acero", 2 with unrelated names.

**Test Steps:**
1. Render the client list view.
2. Wait for initial data load.
3. Type "Acero" into the search field.
4. Assert list content.
5. Spy on MSW handler to confirm no additional API call was made.

**Expected Result:**
- Only the 3 matching clients are visible.
- 2 non-matching clients are not rendered.
- No additional GET `/api/v1/clientes` request issued (client-side filter).
- Filter completes visually within 1 rendering cycle (no debounce delay assertion required for 5 records).

**Automation:** Vitest + RTL + MSW request spy.

---

#### TC-E2-P1-03: Search by NIT/RUC Filters Correctly

**Level:** Component
**Story:** 2.1
**Requirement:** AC-E2.2, FR4

**Precondition:** MSW returns clients including one with `nitRuc: "900123456-1"`.

**Test Steps:**
1. Render client list.
2. Type "900123456" into search field.
3. Assert only the matching client is visible.

**Expected Result:**
- List shows the client with matching NIT/RUC.
- No unrelated clients shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: Empty State Displayed When No Clients Exist

**Level:** Component
**Story:** 2.1
**Requirement:** AC-2.1 (EmptyState component)
**Risk covered:** R13

**Precondition:** MSW returns empty array `[]`.

**Test Steps:**
1. Render client list view.
2. Wait for data load.
3. Assert EmptyState component visible with guidance message.

**Expected Result:**
- EmptyState component rendered.
- Message guides user to create the first client.
- No list items, no loading skeleton.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: Error Panel Displayed When Backend Unavailable

**Level:** Component
**Story:** 2.1
**Requirement:** AC-2.1 (ErrorPanel with Reintentar button)
**Risk covered:** R14

**Precondition:** MSW configured to return network error for GET `/api/v1/clientes`.

**Test Steps:**
1. Render client list view.
2. Wait for error state to resolve.
3. Assert ErrorPanel is visible with "Reintentar" button.
4. Click "Reintentar".
5. Assert a new GET `/api/v1/clientes` request is issued.

**Expected Result:**
- ErrorPanel component rendered (not an unhandled exception).
- "Reintentar" button triggers a new fetch attempt.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-06: Client Detail View — Click List Item Updates Right Panel and URL

**Level:** Component
**Story:** 2.2
**Requirement:** AC-2.2 (right panel shows full details, URL updates to `/clientes/:clienteId`), FR5, FR30
**Risk covered:** R12

**Precondition:** MSW returns a list of 2 clients; client `C1` has all 4 fields populated.

**Test Steps:**
1. Render the `/clientes` route.
2. Click on client `C1` in the list.
3. Assert right panel content.
4. Assert URL.

**Expected Result:**
- Right panel displays `C1.nombre`, `C1.nitRuc`, `C1.telefono`, `C1.ciudad`.
- URL updates to `/clientes/{C1.id}`.
- No full page reload (TanStack Router navigation).

**Automation:** Vitest + RTL + MSW + TanStack Router test utilities.

---

#### TC-E2-P1-07: Deep Link to `/clientes/:clienteId` Loads Correct Client

**Level:** E2E
**Story:** 2.2
**Requirement:** AC-2.2 (direct URL access loads client details), FR30
**Risk covered:** R6

**Precondition:** Backend running with at least one seeded client (known UUID).

**Test Steps:**
1. Navigate browser directly to `http://localhost:5173/clientes/{knownUUID}` (no prior navigation).
2. Wait for page to render.

**Expected Result:**
- Right panel displays the client's details.
- Left panel list is also loaded.
- No blank page, no redirect, no JS exception.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-08: Non-Existent Client ID Shows Not-Found Gracefully

**Level:** E2E
**Story:** 2.2
**Requirement:** AC-2.2 (not-found message for invalid clienteId)
**Risk covered:** R6

**Precondition:** Frontend and backend running.

**Test Steps:**
1. Navigate browser to `http://localhost:5173/clientes/00000000-0000-0000-0000-000000000000` (non-existent UUID).
2. Wait for page to render.

**Expected Result:**
- A not-found message is displayed in the right panel (not a JS error, not a blank page).
- Left panel list still renders normally.
- No unhandled exception thrown.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-09: Create Client — Happy Path (Full Flow)

**Level:** E2E
**Story:** 2.3
**Requirement:** AC-E2.1 (client created, appears in list immediately), FR1, FR27
**Risk covered:** R5

**Precondition:** Backend running with empty clients table.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente".
3. Fill all fields: Nombre="Test Corp", NIT/RUC="900999001-1", Teléfono="3001112233", Ciudad="Cali".
4. Click submit.
5. Assert list and toast.

**Expected Result:**
- Success toast "Cliente creado correctamente" appears.
- "Test Corp" is visible in the client list immediately (without page reload).
- URL may update to `/clientes/{newId}` with new client detail in right panel.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-10: Create Client — Duplicate NIT/RUC Shows Error Message

**Level:** Component
**Story:** 2.3
**Requirement:** AC-2.3 (error message on 409), NFR6
**Risk covered:** R1

**Precondition:** MSW configured to return 409 on POST `/api/v1/clientes`.

**Test Steps:**
1. Render `<ClientForm />` or `/clientes` create flow.
2. Fill all fields with a duplicate NIT/RUC.
3. Submit the form.
4. Assert error message displayed.

**Expected Result:**
- Inline or toast error message: "El NIT/RUC ya está registrado".
- No technical/internal error detail visible.
- Form remains open with existing field values.

**Automation:** Vitest + RTL + MSW (409 response handler).

---

#### TC-E2-P1-11: Create Client — Success Updates List Immediately (Cache Invalidation)

**Level:** Component
**Story:** 2.3
**Requirement:** AC-E2.1 (client appears in list immediately), FR27
**Risk covered:** R5

**Precondition:** MSW returns initial list of 1 client. POST returns 201 with new client body. GET returns updated list of 2 clients (after invalidation).

**Test Steps:**
1. Render client list.
2. Open create form.
3. Submit valid new client.
4. Assert list after successful POST.

**Expected Result:**
- New client appears in list without manual page reload.
- TanStack Query `invalidateQueries` triggered (a new GET `/api/v1/clientes` call is made after POST).
- Success toast shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Edit Client — Form Pre-filled with Current Values

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4 (form opens pre-filled), FR6

**Precondition:** MSW returns client `C1 = { nombre: "Alpha SA", nitRuc: "900001-1", telefono: "3100001111", ciudad: "Bogotá" }`. Client detail is displayed.

**Test Steps:**
1. Render client detail for C1.
2. Click "Editar".
3. Assert form field values.

**Expected Result:**
- Nombre input value: "Alpha SA".
- NIT/RUC input value: "900001-1".
- Teléfono input value: "3100001111".
- Ciudad input value: "Bogotá".

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Edit Client — Save Updates List and Detail Immediately

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4 (changes reflected immediately), FR27
**Risk covered:** R5

**Precondition:** MSW: GET returns C1, PUT returns updated C1, subsequent GET returns updated list.

**Test Steps:**
1. Render client detail.
2. Click "Editar".
3. Change Nombre to "Alpha SA Updated".
4. Submit.
5. Assert detail and toast.

**Expected Result:**
- Success toast "Cliente actualizado correctamente".
- Detail panel shows "Alpha SA Updated" immediately.
- List item also updated (cache invalidation verified via MSW call count).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-14: Edit Client — Cancel Discards Changes

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4 (Cancelar — original data unchanged)

**Precondition:** MSW returns C1. Edit form open with modified field.

**Test Steps:**
1. Render client detail for C1.
2. Click "Editar".
3. Change Nombre to "Something Else".
4. Click "Cancelar".
5. Assert detail panel content.
6. Assert no PUT request was made (MSW spy).

**Expected Result:**
- Form closes.
- Detail panel shows original nombre "Alpha SA" (unchanged).
- No PUT request issued to backend.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-15: Delete Client — Confirmation Dialog Required

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 (confirmation dialog with Confirmar/Cancelar)
**Risk covered:** R9

**Precondition:** MSW returns client C1. Detail panel rendered.

**Test Steps:**
1. Click "Eliminar" on client C1's detail panel.
2. Assert dialog appears.
3. Assert no DELETE request was made yet (MSW spy).

**Expected Result:**
- Confirmation dialog rendered with text "¿Eliminar este cliente?".
- Two buttons visible: "Confirmar" and "Cancelar".
- No HTTP DELETE issued before user confirms.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-16: Delete Client — Confirm Removes Client from List

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 (client removed from list, right panel returns to default), FR7, FR27
**Risk covered:** R5, R9

**Precondition:** MSW: GET returns C1; DELETE returns 204; subsequent GET returns empty list.

**Test Steps:**
1. Click "Eliminar", then "Confirmar".
2. Assert list, panel, and toast.

**Expected Result:**
- Success toast "Cliente eliminado correctamente".
- Client C1 no longer appears in list.
- Right panel returns to empty/default state.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-17: Delete Client — Cancel Keeps Client Intact

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 (Cancelar — client unchanged)

**Precondition:** MSW returns C1. Confirmation dialog open.

**Test Steps:**
1. Click "Eliminar".
2. Click "Cancelar" in the confirmation dialog.
3. Assert dialog closes.
4. Assert no DELETE request issued (MSW spy).
5. Assert C1 still appears in list.

**Expected Result:**
- Dialog closes.
- C1 still visible in list.
- Zero DELETE requests to backend.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-18: Delete Client with Associated Contacts — Toast Shows Unassignment Message

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 (contacts unassigned, toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.")
**Risk covered:** R3

**Precondition:** MSW: DELETE returns 200 with body `{ contactsUnassigned: 2 }` (or backend returns specific metadata); subsequent GET returns updated state.

**Test Steps:**
1. Delete a client that has 2 associated contacts (mocked via MSW response).
2. Assert toast message.

**Expected Result:**
- Toast text: "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
- Client removed from list.
- Right panel returns to default state.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-19: Sort Client List — Nombre A→Z (No API Call)

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6 (sort by Nombre A→Z without new API call, AC-E2.6)
**Risk covered:** R7

**Precondition:** MSW returns 3 clients: `["Zeta Corp", "Alpha SA", "Mediana Ltda"]`. Initial sort: "Más reciente".

**Test Steps:**
1. Render client list.
2. Spy on MSW handler (baseline: 1 GET on mount).
3. Select "Nombre A→Z" from SortControl.
4. Assert list order.
5. Assert no additional GET request made.

**Expected Result:**
- List order: "Alpha SA", "Mediana Ltda", "Zeta Corp" (ascending).
- No additional GET `/api/v1/clientes` call issued.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-20: Sort Preserves Active Search Filter

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6 (sort applied to filtered results, search input unchanged)
**Risk covered:** R8

**Precondition:** MSW returns 5 clients including 3 with "Corp" in name.

**Test Steps:**
1. Render client list.
2. Type "Corp" in search input (3 items remain visible).
3. Select "Nombre Z→A" from SortControl.
4. Assert search input value.
5. Assert list content.

**Expected Result:**
- Search input still contains "Corp".
- Only the 3 matching clients visible.
- Matching clients sorted Z→A by name.
- Non-matching clients not visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-21: Default Sort is "Más Reciente"

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6 (default sort "Más reciente")

**Precondition:** MSW returns 2 clients with different `createdAt` timestamps.

**Test Steps:**
1. Render client list without any prior sort preference.
2. Assert SortControl selected option.
3. Assert list order.

**Expected Result:**
- SortControl shows "Más reciente" as selected (default).
- List ordered by `createdAt` descending (newest first).

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic is Marked Complete

---

#### TC-E2-P2-01: GET /api/v1/clientes Returns All Clients

**Level:** API Integration
**Story:** 2.1
**Requirement:** FR2 (view list of all clients)

**Test Steps:**
1. Seed database with 3 clients.
2. GET `/api/v1/clientes`.

**Expected Result:**
- HTTP 200.
- JSON array of 3 client objects.
- Each object has fields: `id`, `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`.
- `createdAt` is ISO 8601 with timezone offset (`DateTimeOffset`).

**Automation:** xUnit + WebApplicationFactory.

---

#### TC-E2-P2-02: GET /api/v1/clientes/:id Returns Single Client

**Level:** API Integration
**Story:** 2.2
**Requirement:** FR5

**Test Steps:**
1. Seed one client C1.
2. GET `/api/v1/clientes/{C1.id}`.

**Expected Result:**
- HTTP 200.
- JSON object with all 4 required fields + `id` + `createdAt`.

**Automation:** xUnit + WebApplicationFactory.

---

#### TC-E2-P2-03: GET /api/v1/clientes/:id — Non-Existent Returns 404

**Level:** API Integration
**Story:** 2.2
**Requirement:** AC-2.2 (graceful not-found)
**Risk covered:** R6

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.

**Expected Result:**
- HTTP 404.
- Problem Details body: `{ "status": 404, "title": "Not Found", "detail": "..." }`.
- No stack trace exposed.

**Automation:** xUnit + WebApplicationFactory.

---

#### TC-E2-P2-04: POST /api/v1/clientes Creates Client Successfully

**Level:** API Integration
**Story:** 2.3
**Requirement:** FR1

**Test Steps:**
1. POST `/api/v1/clientes` with `{ nombre: "New Corp", nitRuc: "900500001-1", telefono: "3200001111", ciudad: "Barranquilla" }`.
2. GET `/api/v1/clientes/{newId}`.

**Expected Result:**
- POST returns HTTP 201 with Location header pointing to `/api/v1/clientes/{newId}`.
- GET returns the new client with all fields.
- `id` is a valid UUID (Guid format).

**Automation:** xUnit + WebApplicationFactory.

---

#### TC-E2-P2-05: PUT /api/v1/clientes/:id Updates Client

**Level:** API Integration
**Story:** 2.4
**Requirement:** FR6

**Test Steps:**
1. Seed client C1.
2. PUT `/api/v1/clientes/{C1.id}` with `{ nombre: "Updated Name", nitRuc: C1.nitRuc, telefono: "3000000000", ciudad: "Cartagena" }`.
3. GET `/api/v1/clientes/{C1.id}`.

**Expected Result:**
- PUT returns HTTP 200 or 204.
- GET returns updated values (`nombre: "Updated Name"`, `ciudad: "Cartagena"`).

**Automation:** xUnit + WebApplicationFactory.

---

#### TC-E2-P2-06: DELETE /api/v1/clientes/:id Removes Client

**Level:** API Integration
**Story:** 2.5
**Requirement:** FR7

**Test Steps:**
1. Seed client C1 (no associated contacts).
2. DELETE `/api/v1/clientes/{C1.id}`.
3. GET `/api/v1/clientes/{C1.id}`.

**Expected Result:**
- DELETE returns 204.
- Subsequent GET returns 404.

**Automation:** xUnit + WebApplicationFactory.

---

#### TC-E2-P2-07: Success Toast on Create

**Level:** Component
**Story:** 2.3
**Requirement:** AC-2.3 (toast "Cliente creado correctamente")
**Risk covered:** R10

**Test Steps:**
1. MSW: POST returns 201.
2. Submit valid create form.
3. Assert toast.

**Expected Result:**
- Toast with text "Cliente creado correctamente" is visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-08: Success Toast on Edit

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4 (toast "Cliente actualizado correctamente")
**Risk covered:** R10

**Test Steps:**
1. MSW: PUT returns 200.
2. Submit edit form.
3. Assert toast.

**Expected Result:**
- Toast with text "Cliente actualizado correctamente" is visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-09: Sort Nombre Z→A Orders Correctly

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6 (Nombre Z→A)
**Risk covered:** R7

**Test Steps:**
1. Render list with 3 clients.
2. Select "Nombre Z→A" from SortControl.
3. Assert descending alphabetical order.
4. Assert no additional API call.

**Expected Result:**
- List reordered Z→A by nombre.
- Zero additional GET requests.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-10: Sort by "Más Antiguo" Orders by createdAt Ascending

**Level:** Component
**Story:** 2.6
**Requirement:** AC-2.6 ("Más antiguo" — oldest first)

**Test Steps:**
1. Render list with 2 clients differing only in `createdAt` timestamps.
2. Select "Más antiguo" from SortControl.
3. Assert order.

**Expected Result:**
- Oldest client (lowest `createdAt`) appears first.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-11: Backend Problem Details Format on Client Endpoint Errors

**Level:** API Integration
**Story:** 2.3
**Requirement:** NFR6
**Risk covered:** R11

**Test Steps:**
1. PUT `/api/v1/clientes/not-a-valid-uuid` (malformed ID).
2. Inspect response.

**Expected Result:**
- HTTP 400 or 422.
- `Content-Type: application/problem+json`.
- No stack trace in response body.

**Automation:** xUnit + WebApplicationFactory.

---

#### TC-E2-P2-12: Edit Client — Required Field Cleared Shows Inline Error

**Level:** Component
**Story:** 2.4
**Requirement:** AC-2.4 (inline error when required field cleared on edit), FR8
**Risk covered:** R2

**Test Steps:**
1. Render edit form pre-filled with C1 data.
2. Clear the Nombre field.
3. Submit.
4. Assert inline error, no PUT request.

**Expected Result:**
- Inline error on Nombre field.
- No HTTP PUT request issued.

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / Future Sprint

---

#### TC-E2-P3-01: Search Performance with 500 Records (NFR1)

**Level:** Component (performance)
**Story:** 2.1
**Requirement:** NFR1 (≤1s with 500 records)
**Risk covered:** R4

**Test Steps:**
1. MSW returns 500 client records (factory-generated mock data).
2. Render client list.
3. Type search term that matches ~50 records.
4. Measure React re-render time using `performance.now()` or `@testing-library/react` act timer.

**Expected Result:**
- Filter result renders in ≤1000ms.
- No React profiler warning about slow renders.

**Automation:** Vitest with performance measurement hook (or Playwright `tracing`).

---

#### TC-E2-P3-02: WCAG 2.1 AA — Client Form Accessibility

**Level:** Component
**Story:** 2.3, 2.4
**Requirement:** Company standard (WCAG 2.1 AA)

**Test Steps:**
1. Render create form.
2. Run `axe` (jest-axe / vitest-axe) against rendered DOM.

**Expected Result:**
- Zero critical or serious accessibility violations.
- All form inputs have associated labels.
- Error messages linked via `aria-describedby`.

**Automation:** Vitest + RTL + `jest-axe`.

---

#### TC-E2-P3-03: WCAG 2.1 AA — Client List Accessibility

**Level:** Component
**Story:** 2.1
**Requirement:** Company standard (WCAG 2.1 AA)

**Test Steps:**
1. Render client list with data.
2. Run `axe` against rendered DOM.
3. Assert list items are navigable via keyboard.

**Expected Result:**
- Zero critical accessibility violations.
- List items have appropriate roles (`listitem`, `button`, or similar).

**Automation:** Vitest + RTL + `jest-axe`.

---

#### TC-E2-P3-04: Unit — Sort Utility Function

**Level:** Unit
**Story:** 2.6
**Requirement:** AC-2.6 (sort identifiers: `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`)

**Test Steps:**
1. Import the sort utility function used by `SortControl`.
2. Call with `sortBy: "nombre-asc"` on an unsorted array.
3. Call with each of the 4 sort options.
4. Assert output order for each.

**Expected Result:**
- Each of the 4 sort options returns a correctly ordered array.
- Original array is not mutated.

**Automation:** Vitest unit test — 4 `[test.each]` cases.

---

#### TC-E2-P3-05: Backend Unit — ClientEntity Domain Factory

**Level:** Unit
**Story:** 2.3
**Requirement:** FR1 (entity creation), company standard (private ctor + static Create())

**Test Steps:**
1. Call `ClientEntity.Create("Test Corp", "900000001-1", "3001234567", "Bogotá")`.
2. Assert properties.
3. Call with empty nombre.
4. Assert exception thrown.

**Expected Result:**
- Valid call: entity has correct properties, `Id` is non-empty Guid, `CreatedAt` is `DateTimeOffset`.
- Invalid call: throws domain exception (or returns Result.Failure).

**Automation:** xUnit unit test.

---

#### TC-E2-P3-06: Backend Unit — CreateClientValidator (FluentValidation)

**Level:** Unit
**Story:** 2.3
**Requirement:** FR8, NFR5

**Test Steps:**
1. Validate `CreateClientCommand { Nombre = "", NitRuc = "...", Telefono = "...", Ciudad = "..." }`.
2. Assert validation fails on `Nombre`.
3. Validate all-empty command.
4. Assert 4 errors.
5. Validate all-valid command.
6. Assert passes.

**Expected Result:**
- Correct number of errors for each invalid input.
- No errors for valid input.

**Automation:** xUnit unit test using FluentValidation `TestValidate`.

---

#### TC-E2-P3-07: Backend Unit — UpdateClientValidator

**Level:** Unit
**Story:** 2.4
**Requirement:** FR8 (edit validation mirrors create)

**Test Steps:**
1. Same approach as TC-E2-P3-06 for `UpdateClientCommand`.
2. Include: all fields required, NIT/RUC non-empty.

**Expected Result:**
- Same validation coverage as create validator.

**Automation:** xUnit unit test.

---

#### TC-E2-P3-08: E2E — Full Edit Flow

**Level:** E2E
**Story:** 2.4
**Requirement:** AC-2.4, FR6

**Precondition:** Backend seeded with client C1.

**Test Steps:**
1. Navigate to `/clientes/{C1.id}`.
2. Click "Editar".
3. Change Ciudad to "Manizales".
4. Submit.
5. Assert detail shows "Manizales" and toast appears.

**Expected Result:**
- Toast "Cliente actualizado correctamente".
- Ciudad in detail panel: "Manizales".
- URL remains `/clientes/{C1.id}`.

**Automation:** Playwright.

---

#### TC-E2-P3-09: E2E — Delete Client with Confirmation

**Level:** E2E
**Story:** 2.5
**Requirement:** AC-2.5

**Precondition:** Backend seeded with client C1 (no contacts).

**Test Steps:**
1. Navigate to `/clientes/{C1.id}`.
2. Click "Eliminar".
3. Assert dialog appears.
4. Click "Confirmar".
5. Assert C1 not in list, toast appears.

**Expected Result:**
- Confirmation dialog appeared.
- Toast "Cliente eliminado correctamente".
- C1 not in client list.
- Right panel in default state.

**Automation:** Playwright.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Test Cases | Level | Status |
|----------------|------------|-------|--------|
| AC-E2.1: Register client; appears in list immediately | TC-E2-P1-09, TC-E2-P1-11, TC-E2-P2-04, TC-E2-P2-07 | E2E, Component, API | Covered |
| AC-E2.2: Search by nombre or NIT/RUC in <1s | TC-E2-P1-02, TC-E2-P1-03, TC-E2-P3-01 | Component | Covered |
| AC-E2.3: View detail, edit any field, save | TC-E2-P1-12, TC-E2-P1-13, TC-E2-P2-05, TC-E2-P3-08 | Component, API, E2E | Covered |
| AC-E2.4: Required fields enforced, inline errors | TC-E2-P0-03, TC-E2-P0-04, TC-E2-P0-05, TC-E2-P2-12 | API, Unit, Component | Covered |
| AC-E2.5: Delete client; removed from list | TC-E2-P0-06, TC-E2-P1-15, TC-E2-P1-16, TC-E2-P1-18, TC-E2-P2-06, TC-E2-P3-09 | API, Component, E2E | Covered |
| AC-E2.6: Sort by 4 criteria; no filter loss; no API call | TC-E2-P1-19, TC-E2-P1-20, TC-E2-P1-21, TC-E2-P2-09, TC-E2-P2-10 | Component | Covered |
| AC-2.1: Scrollable list, Nombre+NIT/RUC per item | TC-E2-P1-01 | Component | Covered |
| AC-2.1: EmptyState when no clients | TC-E2-P1-04 | Component | Covered |
| AC-2.1: ErrorPanel + Reintentar on backend error | TC-E2-P1-05 | Component | Covered |
| AC-2.2: Right panel on click, URL updates | TC-E2-P1-06 | Component | Covered |
| AC-2.2: Direct URL loads correct client | TC-E2-P1-07 | E2E | Covered |
| AC-2.2: Non-existent clienteId shows not-found | TC-E2-P1-08, TC-E2-P2-03 | E2E, API | Covered |
| AC-2.3: Form opens with 4 required fields | TC-E2-P0-05 | Component | Covered |
| AC-2.3: NIT/RUC already exists → "El NIT/RUC ya está registrado" | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P1-10 | API, API, Component | Covered |
| AC-2.4: Form pre-filled | TC-E2-P1-12 | Component | Covered |
| AC-2.4: Changes reflected immediately | TC-E2-P1-13 | Component | Covered |
| AC-2.4: Cancelar — data unchanged | TC-E2-P1-14 | Component | Covered |
| AC-2.5: Confirmation dialog | TC-E2-P1-15 | Component | Covered |
| AC-2.5: Confirmed → removed immediately, toast | TC-E2-P1-16 | Component | Covered |
| AC-2.5: Cancelar — client unchanged | TC-E2-P1-17 | Component | Covered |
| AC-2.5: Delete with contacts → unassigned + specific toast | TC-E2-P0-06, TC-E2-P1-18 | API, Component | Covered |
| AC-2.6: Nombre A→Z no API call | TC-E2-P1-19 | Component | Covered |
| AC-2.6: Nombre Z→A no API call | TC-E2-P2-09 | Component | Covered |
| AC-2.6: Más reciente (fecha-desc) | TC-E2-P1-21 | Component | Covered |
| AC-2.6: Más antiguo (fecha-asc) | TC-E2-P2-10 | Component | Covered |
| AC-2.6: Sort preserves active search filter | TC-E2-P1-20 | Component | Covered |
| AC-2.6: Default sort "Más reciente" | TC-E2-P1-21 | Component | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search <1s with 500 records | TC-E2-P3-01 | Component (performance) |
| NFR2 | CRUD changes <2s in UI | TC-E2-P1-09 (E2E timing implicit), TC-E2-P1-11 (immediate update) | E2E, Component |
| NFR5 | Input validation and sanitization at API | TC-E2-P0-03, TC-E2-P0-01 | API Integration |
| NFR6 | No stack traces or internal errors exposed | TC-E2-P0-01, TC-E2-P1-10, TC-E2-P2-11 | API, Component |
| NFR7 | Core tasks completable without training (usability) | TC-E2-P1-09 (E2E happy path) | E2E |
| NFR10 | MVP ceiling: 500 clients | TC-E2-P3-01 (500-record test) | Component |

---

## 7. Test Execution Order

```
Phase 1 — Unit Gate (no DB, no browser)
  1. TC-E2-P0-04  Zod schema required-field validation
  2. TC-E2-P3-04  Sort utility function (all 4 options)
  3. TC-E2-P3-05  ClientEntity.Create() domain factory
  4. TC-E2-P3-06  CreateClientValidator (FluentValidation)
  5. TC-E2-P3-07  UpdateClientValidator

Phase 2 — API Integration Gate (P0, DB required)
  6. TC-E2-P0-02  Unique index exists on nit_ruc column
  7. TC-E2-P0-01  NIT/RUC uniqueness enforced (409)
  8. TC-E2-P0-03  Backend rejects missing required fields (422)
  9. TC-E2-P0-06  Delete with contacts → contacts become unassigned

Phase 3 — API Integration (P2, DB required)
 10. TC-E2-P2-01  GET /clientes returns list
 11. TC-E2-P2-02  GET /clientes/:id returns single client
 12. TC-E2-P2-03  GET /clientes/:id non-existent → 404
 13. TC-E2-P2-04  POST /clientes creates client (201)
 14. TC-E2-P2-05  PUT /clientes/:id updates client
 15. TC-E2-P2-06  DELETE /clientes/:id removes client
 16. TC-E2-P2-11  Problem Details on malformed request

Phase 4 — Component Tests (P0 forms, then P1 list/detail/CUD)
 17. TC-E2-P0-05  Form blocks submission on empty fields (inline errors)
 18. TC-E2-P1-04  Empty state on no clients
 19. TC-E2-P1-05  Error panel + Reintentar
 20. TC-E2-P1-01  Client list renders correctly
 21. TC-E2-P1-02  Real-time search by nombre (no API call)
 22. TC-E2-P1-03  Search by NIT/RUC
 23. TC-E2-P1-06  Click client → right panel + URL update
 24. TC-E2-P1-10  Create duplicate NIT/RUC → error message
 25. TC-E2-P1-11  Create success → list updates immediately
 26. TC-E2-P2-07  Toast on create
 27. TC-E2-P1-12  Edit form pre-filled
 28. TC-E2-P1-14  Edit cancel discards changes
 29. TC-E2-P2-12  Edit clears required field → inline error
 30. TC-E2-P1-13  Edit save → updates immediately
 31. TC-E2-P2-08  Toast on edit
 32. TC-E2-P1-15  Delete — confirmation dialog required
 33. TC-E2-P1-17  Delete cancel — client unchanged
 34. TC-E2-P1-16  Delete confirm — removed from list
 35. TC-E2-P1-18  Delete with contacts — unassignment toast
 36. TC-E2-P1-21  Default sort "Más reciente"
 37. TC-E2-P1-19  Sort Nombre A→Z no API call
 38. TC-E2-P2-09  Sort Nombre Z→A no API call
 39. TC-E2-P2-10  Sort "Más antiguo"
 40. TC-E2-P1-20  Sort preserves active search filter

Phase 5 — E2E Tests (P1 critical journeys)
 41. TC-E2-P1-07  Deep link to /clientes/:knownId
 42. TC-E2-P1-08  Deep link to invalid UUID → not-found
 43. TC-E2-P1-09  Create client — full E2E happy path
 44. TC-E2-P3-08  Edit client — full E2E flow
 45. TC-E2-P3-09  Delete client — E2E with confirmation

Phase 6 — Accessibility & Performance (P3)
 46. TC-E2-P3-02  WCAG axe — client form
 47. TC-E2-P3-03  WCAG axe — client list
 48. TC-E2-P3-01  Search performance with 500 records
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW 2+ | API mocking in component tests | Frontend |
| jest-axe / vitest-axe | Accessibility checks | Frontend |
| Playwright 1.40+ | E2E critical journeys | E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| FluentValidation.TestHelper | Validator unit tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with pnpm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432
- Epic 1 fully implemented (foundation, navigation shell, DB connection)
- All npm dependencies installed (pnpm install)
- All NuGet packages restored (dotnet restore)
- EF Core migration for 'clients' table applied
- TestContainers Docker daemon available for backend integration tests
```

### Test Data Strategy

- **Backend integration tests:** TestContainers Postgres — isolated per test, seeded via `ClientsDbContext.AddRange()` in test setup.
- **Frontend component tests:** MSW handlers per test — factory function generates realistic mock clients (Guid IDs, `DateTimeOffset` `createdAt` values).
- **E2E tests:** Seeded via API calls in `beforeAll` hooks; cleaned up in `afterAll` via DELETE calls or TestContainers reset.

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 6 | 2.5 | 15.0 | Data integrity + cascade delete — complex setup, multi-assertion |
| P1 | 21 | 1.0 | 21.0 | Standard component + API coverage — moderate setup |
| P2 | 12 | 0.75 | 9.0 | CRUD endpoint validation, additional UI behaviors |
| P3 | 9 | 0.5 | 4.5 | Unit validators, axe, performance, full E2E flows |
| **Total** | **48** | — | **49.5 hours** | **~6.2 days** |

> Note: Total test count in execution order is 45 unique TCs (some P3 cover sub-cases in shared TCs above).

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (6 tests — all must pass before any story implementation begins)
- **P1 pass rate:** 100% (21 tests — all must pass before story is marked Done)
- **P2 pass rate:** ≥90% (12 tests — may defer 1-2 with documented justification)
- **P3 pass rate:** ≥75% (informational — performance and a11y deferred to tech debt sprint if needed)

### Coverage Targets

- **CRUD happy paths:** 100% covered by API integration tests
- **Form validation (FE + BE):** 100% covered (dual-layer: Zod unit + FluentValidation unit + component + API)
- **Data integrity scenarios** (uniqueness, cascade delete): 100% by P0 API integration tests
- **Business logic (sort, filter):** 100% by P1 component tests
- **Error states** (empty, network error, not-found): 100% by P1 component tests
- **Accessibility:** Covered for form + list (P3, deferrable)
- **Performance:** NFR1 covered (P3, deferrable with benchmark baseline documented)

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] NIT/RUC uniqueness verified at DB constraint level (TC-E2-P0-02)
- [ ] Delete cascade contact unassignment verified at API integration level (TC-E2-P0-06)
- [ ] Frontend form validation blocks submission without backend call (TC-E2-P0-05)
- [ ] No stack trace or internal error detail exposed in any API error response (NFR6)
- [ ] All CUD operations reflect in UI immediately without page reload (FR27)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-21)
- [ ] P2 test cases pass at ≥90% rate or formally deferred with justification
- [ ] No P0/P1 test case skipped without a documented reason
- [ ] Zod schema and FluentValidation both enforce all 4 required fields
- [ ] DB unique constraint on `nit_ruc` confirmed via migration inspection test
- [ ] Delete cascade behavior verified at API level (contacts survive with `clienteId = null`)
- [ ] Client-side sort uses no additional API calls (spy-verified)
- [ ] Sort + search combination preserves both filter and sort state simultaneously
- [ ] Deep linking to valid and invalid `/clientes/:clienteId` handled gracefully in E2E

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **Database unique constraint:** EF Core configuration must declare `HasIndex(c => c.NitRuc).IsUnique()` with name `uk_clients_nit_ruc`. This is verified by TC-E2-P0-02.
2. **Delete cascade:** When a client is deleted, associated contacts must have `client_id` set to `NULL` (not deleted). Implement via EF Core `OnDelete(DeleteBehavior.SetNull)` or application-layer contact update before delete. Verified by TC-E2-P0-06.
3. **TanStack Query invalidation:** After every mutation (create, edit, delete), call `queryClient.invalidateQueries({ queryKey: ['clientes'] })`. Verified by TC-E2-P1-11, TC-E2-P1-13, TC-E2-P1-16.
4. **Client-side sort:** SortControl must NOT trigger a new GET request. Sort must operate over the TanStack Query cached data using `useMemo` or a derived selector. Verified by TC-E2-P1-19.
5. **Sort + search state independence:** Sort state (`useState`) and search state (`useState`) must be managed as separate independent pieces of state. Combining them (e.g., resetting one when the other changes) will fail TC-E2-P1-20.
6. **Toast messages:** Use the project's toast system with exact strings: "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente", "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." Exact strings are asserted in component tests.
7. **409 error message:** The backend must return `"detail": "El NIT/RUC ya está registrado"` in the Problem Details body. The frontend must surface this exact message to the user without modification.
8. **URL deep linking:** Clicking a client in the list must trigger TanStack Router navigation to `/clientes/:clienteId`. The route must be registered in the router tree and must load client detail from the API (or cache) on direct access.
9. **Default sort identifier:** The `SortControl` default value must be `"fecha-desc"` (Más reciente). Other valid identifiers: `"nombre-asc"`, `"nombre-desc"`, `"fecha-asc"`. These identifiers are used in TC-E2-P3-04 unit tests.
10. **All 4 fields are required at the Zod level:** `z.string().min(1)` (or equivalent) on Nombre, NIT/RUC, Teléfono, Ciudad. Fields must NOT be optional in the schema.
