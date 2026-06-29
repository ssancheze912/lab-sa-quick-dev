---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-29"
author: SiesaTeam
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

Epic 2 delivers the full CRUD lifecycle for the **Cliente** entity: list, search, detail view, create, edit, delete, and client-side sorting. It is the first domain-bearing epic — it introduces the `clientes` table (PostgreSQL via EF Core), the REST endpoints `/api/clientes`, the Zod/FluentValidation pairing for required-field validation, and the TanStack Query + optimistic-update pattern that will be reused for Contacts (Epic 3) and Associations (Epic 4).

The dual-panel `/clientes` layout (280 px left list + right detail) and the 1-second search NFR (NFR1) make this epic UX-critical and performance-sensitive. Deletion has data-integrity implications because contacts associated with a deleted client must remain in the system as orphans (`clienteId = null`), surfacing in Epic 4's "Sin cliente" filter (FR25). That cross-epic contract is the highest-risk behavior in the epic.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Dual-panel layout (280 px), real-time filter < 1 s (NFR1), EmptyState, ErrorPanel + Reintentar |
| 2.2 | Client Detail View | Deep linking `/clientes/:clienteId` (FR30), not-found graceful state |
| 2.3 | Create Client | Required-field validation (FR1, FR8), 409 conflict on duplicate NIT/RUC, no tech detail leakage (NFR6) |
| 2.4 | Edit Client | Pre-filled form (FR6), optimistic update + rollback (FR27), cancel preserves data |
| 2.5 | Delete Client | Confirmation dialog, cross-epic contract: orphan contacts remain (FR25), toast wording |
| 2.6 | Sort Client List | Client-side sort over TanStack cache, no extra fetch, sort + active search co-exist, default "Más reciente" |

### Out of Scope for This Epic

- Contact entity CRUD — Epic 3
- Client ↔ Contact association from within client detail — Epic 4
- Server-side pagination beyond the NFR10 MVP cap (500 clients) — covered by NFR10 limit, not by tests in this epic
- Authentication / authorization — explicitly deferred (MVP)
- HTTPS — non-local deployments only (NFR4)
- Stats dashboard — Epic 5

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Category | Probability | Impact | Score | Priority | Mitigation Strategy |
|---|-----------|----------|-------------|--------|-------|----------|---------------------|
| R1 | **Orphan contacts on client delete** — deleting a client cascades / hard-deletes its contacts, violating FR25 cross-epic contract (data loss) | DATA | 2 | 3 | 6 | **P0** | Backend integration test: create client + 2 contacts (Epic 3 fixture), delete client, assert contacts persist with `cliente_id = NULL` and surface in Sin-cliente filter |
| R2 | **Duplicate NIT/RUC** silently saved (no 409) or 409 leaks SQL/internal detail to UI, violating NFR6 | SEC | 2 | 3 | 6 | **P0** | (a) Backend integration test: POST two clients with same NIT → second returns Problem Details 409 with safe message. (b) E2E test: UI shows "El NIT/RUC ya está registrado" — no SQL, no stack trace |
| R3 | **Search exceeds 1 s** with 500 records (NFR1 violation) — naïve LIKE query or no index | PERF | 2 | 3 | 6 | **P0** | (a) Backend perf test: seed 500 clients, search by NIT and by name → p95 < 1 s. (b) Frontend test: typing in search debounces and renders < 1 s with 500-record fixture |
| R4 | **Required-field validation** missing client-side OR backend-only → empty submit hits API and corrupts UX (FR8) | BUS | 2 | 2 | 4 | **P1** | Component test: submit empty form → inline errors on Nombre/NIT/Teléfono/Ciudad, network NOT called. API integration test: empty body returns 400 Problem Details with field-level errors |
| R5 | **Optimistic update rollback** fails on create/edit/delete → UI shows stale data when backend errors (FR27) | TECH | 2 | 2 | 4 | **P1** | Component test with MSW: mock 500 on POST/PUT/DELETE, assert list rolls back to pre-mutation state and a toast de error appears |
| R6 | **Sort + active search coupling** — selecting a sort while a search filter is applied clears the search input or re-fetches (Story 2.6 AC5) | BUS | 2 | 2 | 4 | **P1** | Component test: type search → assert filtered set, change sort → assert sort applied to filtered set, search input still populated, no network call |
| R7 | **Deep link `/clientes/:clienteId`** to a non-existent ID crashes or renders blank instead of graceful not-found | TECH | 2 | 2 | 4 | **P1** | Playwright E2E: navigate directly to `/clientes/00000000-0000-0000-0000-000000000000`, assert not-found UI rendered, no console error |
| R8 | **`ErrorPanel` + Reintentar** never re-fetches → broken recovery on transient backend failure (Story 2.1 AC4) | OPS | 1 | 3 | 3 | **P1** | Component test with MSW: first GET returns 500, click "Reintentar", second GET returns 200, assert list renders |
| R9 | **Cancel on edit** persists half-typed changes due to controlled-input state not being reset (Story 2.4 AC4) | BUS | 2 | 1 | 2 | **P2** | Component test: open edit, change a field, click "Cancelar", reopen edit → assert original value, not the edited one |
| R10 | **Default sort "Más reciente"** not applied on initial load (Story 2.6 AC6) | BUS | 1 | 2 | 2 | **P2** | Component test: render list with 3 fixture clients (different createdAt), assert order is newest first without any user interaction |
| R11 | **Toast wording mismatch** for the orphan-contacts case ("Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.") | BUS | 1 | 1 | 1 | **P3** | Component snapshot/text-match test on the delete-with-contacts path |
| R12 | **EmptyState** not shown when zero clients exist (Story 2.1 AC3) | OPS | 1 | 2 | 2 | **P2** | Component test with empty fixture: assert EmptyState component rendered with the guidance copy |

### Top 3 Risk Areas for Epic 2

1. **R1 — Orphan-contact data contract on delete (DATA).** Crosses the Epic 2 → Epic 4 boundary. If this is wrong, contacts are silently destroyed and FR25 is unimplementable. The risk is encoded in Epic 2 acceptance criteria but the *test fixtures* require Epic 3's contact entity to exist — this test must be re-run as part of Epic 4 traceability.
2. **R2 — Duplicate NIT/RUC + NFR6 (SEC).** The only place in this epic where the backend returns a domain error that must be sanitized before reaching the user. Two layers must agree (backend → Problem Details, frontend → user-safe message).
3. **R3 — Search performance at 500 records (PERF).** NFR1 is an explicit < 1 s budget. The architecture leans on client-side filtering over a TanStack Query cache, but a naïve list render on each keystroke can blow the budget; the API search endpoint is the fallback and must also meet the budget.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌▌▌            4 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   8 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 12 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌              4 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                          28 tests
```

### Rationale

- **Component-heavy pyramid (Vitest + RTL + MSW).** Epic 2 is UI-driven CRUD over a small REST surface; most behaviors (form validation, optimistic update, sort + search coupling, EmptyState, ErrorPanel) are most efficiently tested at the component level with MSW mocks. Component tests give us fast, deterministic feedback on UX states without needing a live backend.
- **API integration tests cover the contract.** The backend owns required-field validation (FluentValidation), duplicate-NIT 409 (Problem Details), search performance, and the orphan-contacts behavior on delete. These are tested in-process with `WebApplicationFactory<Program>` against a TestContainers Postgres.
- **E2E (Playwright) is reserved for cross-cutting flows only:** create → list-appears, search → result, deep link to a client, and the duplicate-NIT user-visible error path. We are not duplicating component-level tests at E2E level.
- **Unit tests** are reserved for pure logic that has branches: the client-side sort comparator (4 sort modes), the search filter predicate (name OR NIT match), and the optimistic-update rollback helper.

### Why this differs from Epic 1

Epic 1 was infrastructure-heavy with no domain entities → integration-heavy pyramid. Epic 2 introduces a real entity with a real form and a real list → the center of gravity shifts to the component layer where most of the user-perceivable behavior lives.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Epic 2 Is Considered Complete

#### TC-E2-P0-01: Create Client Happy Path — Required Fields + Immediate List Refresh

**Level:** API Integration + Component
**Story:** 2.3
**Requirements covered:** AC-E2.1, FR1, FR8, FR27
**Risks covered:** R4, R5

**Test Steps (API):**
1. POST `/api/clientes` with `{ nombre, nitRuc, telefono, ciudad }` — all populated.
2. Assert 201 Created and a body that includes the new `id` (UUID) and a `createdAt` (DateTimeOffset).
3. GET `/api/clientes` and assert the new client is in the response.

**Test Steps (Component):**
1. Render `<ClientesPage>` with MSW POST returning 201 with the new client.
2. Click "Nuevo cliente", fill all four fields, submit.
3. Assert TanStack Query cache is updated, the new client appears in the left list, and a success toast "Cliente creado correctamente" is rendered.

**Expected Result:** 201 from backend; list updates without page reload; success toast visible.

**Automation:** xUnit + `WebApplicationFactory<Program>` (TestContainers Postgres) for API; Vitest + RTL + MSW for component.

---

#### TC-E2-P0-02: Create Client Validation — Empty Required Fields Block Submission

**Level:** Component + API Integration
**Story:** 2.3
**Requirements covered:** AC-E2.4, FR8, NFR5
**Risks covered:** R4

**Test Steps (Component):**
1. Render the create form, leave all four fields empty, click submit.
2. Assert: inline error per field, network NOT called (MSW spy on POST count == 0), submit disabled or no-op.

**Test Steps (API):**
1. POST `/api/clientes` with `{}` body.
2. Assert 400 Problem Details with `errors` keyed by `nombre`, `nitRuc`, `telefono`, `ciudad`.
3. Assert the response contains NO stack trace and NO SQL fragment (NFR6).

**Expected Result:** Client-side validation blocks the network call; backend rejects with Problem Details 400; no internal detail leaks.

**Automation:** Vitest + RTL + MSW (component); xUnit (API).

---

#### TC-E2-P0-03: Duplicate NIT/RUC — Backend Returns 409 With Safe Error Message

**Level:** API Integration + E2E
**Story:** 2.3
**Requirements covered:** AC-E2.4 (extended), NFR5, NFR6
**Risks covered:** R2

**Test Steps (API):**
1. POST `/api/clientes` with `{ nombre: "ACME", nitRuc: "900111222-3", … }` — assert 201.
2. POST again with the same `nitRuc` (different `nombre`).
3. Assert 409 Conflict, Problem Details body, no SQL/stack-trace text, error message references "NIT/RUC".

**Test Steps (E2E - Playwright):**
1. Pre-seed one client with `nitRuc = "900111222-3"`.
2. Navigate to `/clientes`, click "Nuevo cliente", fill the form using the same NIT, submit.
3. Assert visible UI message "El NIT/RUC ya está registrado". Assert no console error, no raw 409 JSON.

**Expected Result:** Backend rejects duplicate with sanitized Problem Details; UI surfaces user-safe message.

**Automation:** xUnit (API); Playwright (E2E).

---

#### TC-E2-P0-04: Search Performance — < 1 Second With 500 Records (NFR1)

**Level:** API Integration + Component
**Story:** 2.1
**Requirements covered:** AC-E2.2, NFR1, FR3, FR4
**Risks covered:** R3

**Test Steps (API):**
1. Seed 500 clients (faker-generated, varied names and NIT/RUC).
2. Measure GET `/api/clientes?search=…` for (a) partial name match, (b) partial NIT/RUC match.
3. Assert p95 response time < 1 s across 20 iterations.

**Test Steps (Component):**
1. Render `<ClientesPage>` with a 500-record TanStack Query fixture.
2. Programmatically type a query string into the search input.
3. Measure the time from `input` event to the filtered DOM render. Assert < 1 s (target < 200 ms with debounce).

**Expected Result:** Both layers meet the < 1 s budget.

**Automation:** xUnit with Stopwatch for API; Vitest with `performance.now()` for component.

---

#### TC-E2-P0-05: Delete Client Preserves Associated Contacts as Orphans (Cross-Epic Contract)

**Level:** API Integration + Component
**Story:** 2.5
**Requirements covered:** AC-E2.5, FR25 (Epic 4), FR27
**Risks covered:** R1

**Test Steps (API):**
1. Seed: 1 client `C1` + 2 contacts `K1`, `K2` both with `clienteId = C1.id`.
2. DELETE `/api/clientes/{C1.id}`.
3. Assert 204 No Content.
4. GET `/api/clientes/{C1.id}` → 404.
5. GET `/api/contactos/{K1.id}` and `/api/contactos/{K2.id}` → 200, with `clienteId = null` on both.

**Test Steps (Component):**
1. Render `<ClienteDetail>` for `C1` with 2 associated contacts in the cache.
2. Click "Eliminar", confirm in dialog.
3. Assert: client removed from list, right panel returns to default state, toast text matches: `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."`

**Expected Result:** Client gone, contacts persist as orphans, toast wording exact.

**Automation:** xUnit (API) + Vitest + RTL + MSW (component).

**Note:** Although the contacts entity is owned by Epic 3, this test MUST be authored with Epic 2 and re-validated as part of Epic 4 trace.

---

### P1 — Should Pass Before Epic 2 Closure

#### TC-E2-P1-01: Deep Link to Client Detail (`/clientes/:clienteId`)

**Level:** E2E
**Story:** 2.2
**Requirements covered:** AC-E2.3 (partial), FR30
**Risks covered:** R7

**Test Steps:**
1. Seed one client; capture its `id`.
2. With Playwright, navigate directly to `/clientes/{id}` (no prior visit to `/clientes`).
3. Assert the right panel renders the correct Nombre, NIT/RUC, Teléfono, Ciudad.
4. Navigate to `/clientes/00000000-0000-0000-0000-000000000000`.
5. Assert a graceful not-found UI is rendered, no console errors.

**Expected Result:** Deep link works for valid id; not-found UI for invalid id.

**Automation:** Playwright.

---

#### TC-E2-P1-02: Edit Client — Pre-Fill + Update + Optimistic List Refresh

**Level:** Component + API Integration
**Story:** 2.4
**Requirements covered:** AC-E2.3, FR6, FR27
**Risks covered:** R5

**Test Steps (Component):**
1. Render `<ClienteDetail>` for an existing client.
2. Click "Editar", assert all 4 fields pre-populated with current values.
3. Modify Nombre, submit.
4. Assert: list and detail reflect the new Nombre immediately (optimistic), success toast "Cliente actualizado correctamente".
5. With MSW returning 500 on PUT, repeat the flow and assert the optimistic value rolls back to the original and an error toast appears.

**Test Steps (API):**
1. PUT `/api/clientes/{id}` with a modified body.
2. Assert 200 OK with updated entity.

**Expected Result:** Round-trip update works; rollback works on backend error.

**Automation:** Vitest + RTL + MSW; xUnit.

---

#### TC-E2-P1-03: Edit Validation — Clearing a Required Field Blocks Submit

**Level:** Component
**Story:** 2.4
**Requirements covered:** AC-E2.4, FR8
**Risks covered:** R4

**Test Steps:**
1. Open the edit form for an existing client.
2. Clear the Ciudad field, submit.
3. Assert inline error on Ciudad, network NOT called.

**Expected Result:** Submit blocked, no network call, original value preserved.

**Automation:** Vitest + RTL + MSW (with POST/PUT spies).

---

#### TC-E2-P1-04: Edit Cancel Preserves Original Data

**Level:** Component
**Story:** 2.4
**Requirements covered:** AC-E2.3 (negative), FR6
**Risks covered:** R9

**Test Steps:**
1. Open the edit form, type a new value into Nombre, then click "Cancelar".
2. Assert form closes, detail still shows original Nombre.
3. Reopen the edit form; assert Nombre input is again the original value (state was reset).

**Expected Result:** Cancel discards all in-flight changes.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-05: Delete Confirmation Dialog — Confirm vs Cancel

**Level:** Component
**Story:** 2.5
**Requirements covered:** AC-E2.5
**Risks covered:** (none high — UX guard rail)

**Test Steps:**
1. Open `<ClienteDetail>`, click "Eliminar".
2. Assert dialog appears with text "¿Eliminar este cliente?" and two buttons.
3. Click "Cancelar"; assert dialog closes, client still in list, no DELETE call.
4. Click "Eliminar" again, then "Confirmar"; assert DELETE call fires.

**Expected Result:** Guard rail behaves correctly in both branches.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-06: Sort + Active Search Coexist

**Level:** Component + Unit
**Story:** 2.6
**Requirements covered:** AC-E2.6, Story 2.6 AC5
**Risks covered:** R6

**Test Steps (Component):**
1. Render list with 10 fixture clients.
2. Type a search query that yields 4 matches.
3. Select "Nombre Z→A" from SortControl.
4. Assert: 4 results still shown (search not cleared), now sorted descending; no GET network call fired.
5. Change to "Más antiguo"; assert same 4 results, new order; still no network call.

**Test Steps (Unit):**
1. Call the sort comparator with each of the 4 sort ids over a fixed input; assert order.

**Expected Result:** Sort applies over the filtered set, search input intact, zero refetches.

**Automation:** Vitest + RTL (component); Vitest (unit on comparator).

---

#### TC-E2-P1-07: ErrorPanel + Reintentar Recovery

**Level:** Component
**Story:** 2.1
**Requirements covered:** Story 2.1 AC4
**Risks covered:** R8

**Test Steps:**
1. Render `<ClientesPage>` with MSW returning 500 on the initial GET `/api/clientes`.
2. Assert ErrorPanel rendered with a "Reintentar" button.
3. Reconfigure MSW to return 200 with a 3-client list.
4. Click "Reintentar"; assert list rendered, ErrorPanel gone.

**Expected Result:** Retry path recovers.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: List Renders With Dual-Panel Layout (280 px Left)

**Level:** Component (with viewport)
**Story:** 2.1
**Requirements covered:** Story 2.1 AC1
**Risks covered:** (UX correctness)

**Test Steps:**
1. Render `<ClientesPage>` at viewport 1280×800 with 5 fixture clients.
2. Query the left panel's computed width; assert == 280 px (or the design-system token equivalent).
3. Assert each list item shows Nombre and NIT/RUC visible.

**Expected Result:** Layout matches UX spec.

**Automation:** Vitest + RTL + jsdom viewport stub OR Playwright Component Testing if siesa-ui-kit layout primitives require it.

---

### P2 — Should Pass Before Closure, Deferrable With Justification

#### TC-E2-P2-01: EmptyState When No Clients Exist

**Level:** Component
**Story:** 2.1
**Requirements covered:** Story 2.1 AC3
**Risks covered:** R12

**Test Steps:**
1. Render `<ClientesPage>` with MSW returning an empty `[]`.
2. Assert EmptyState component rendered with copy guiding the user to create the first client.
3. Assert no list items rendered.

**Expected Result:** EmptyState present.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-02: Default Sort Is "Más reciente" on First Render

**Level:** Component + Unit
**Story:** 2.6
**Requirements covered:** Story 2.6 AC6
**Risks covered:** R10

**Test Steps (Component):**
1. Render list with 3 fixture clients, `createdAt` = `[2026-01-01, 2026-06-01, 2026-03-01]`.
2. Without interacting, assert the order is `[2026-06-01, 2026-03-01, 2026-01-01]`.

**Test Steps (Unit):**
1. Assert the default `sortId` initial state is `"fecha-desc"`.

**Expected Result:** Default ordering enforced.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-03: Sort Modes — Nombre A→Z, Nombre Z→A, Más antiguo

**Level:** Unit
**Story:** 2.6
**Requirements covered:** Story 2.6 ACs 1-4
**Risks covered:** R6 (secondary)

**Test Steps:**
1. With a fixed 5-client input, invoke the comparator for each of `nombre-asc`, `nombre-desc`, `fecha-asc`.
2. Assert the produced order matches the expected order in each mode.

**Expected Result:** Comparator correct in all 4 modes (the 4th, `fecha-desc`, is covered by TC-E2-P2-02).

**Automation:** Vitest (pure function).

---

#### TC-E2-P2-04: Search Matches Both Nombre and NIT/RUC

**Level:** Unit + Component
**Story:** 2.1
**Requirements covered:** FR3, FR4, Story 2.1 AC2

**Test Steps (Unit):**
1. Given a fixture client `{ nombre: "ACME Ltda", nitRuc: "900111-2" }`, assert filter predicate matches each of: `"acme"`, `"ACME"`, `"900111"`, `"-2"`.

**Test Steps (Component):**
1. Render with 3 clients of differing nombre/NIT; type a NIT fragment; assert only the NIT-matching client renders.

**Expected Result:** Predicate is case-insensitive on Nombre and matches partial NIT.

**Automation:** Vitest.

---

#### TC-E2-P2-05: Toast Wording — Orphan-Contacts Delete Path

**Level:** Component
**Story:** 2.5
**Requirements covered:** Story 2.5 AC4 (last bullet)
**Risks covered:** R11

**Test Steps:**
1. Render `<ClienteDetail>` for a client with 2 associated contacts in the cache.
2. Trigger delete + confirm.
3. Assert toast text contains exactly: `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."`

**Expected Result:** Wording matches AC verbatim (i18n contract).

**Automation:** Vitest + RTL.

---

### P3 — Nice to Have

#### TC-E2-P3-01: Backend Input Sanitization (NFR5) — Unit / Validator Tests

**Level:** Unit
**Story:** 2.3 / 2.4
**Requirements covered:** NFR5

**Test Steps:**
1. xUnit tests on the `ClienteValidator` (FluentValidation):
   - Empty `Nombre` → invalid.
   - `Nombre` length > 200 → invalid.
   - `NitRuc` empty → invalid.
   - SQL-injection-like input in `Nombre` → still valid (sanitization is on serialization), but EF Core parameterization is asserted in an integration test.
2. xUnit test: POST a body with extra unknown fields → ignored, not persisted.

**Expected Result:** Validator covers all required-field rules.

**Automation:** xUnit (unit on validator).

---

## 5. Acceptance Criteria Coverage Matrix

### Epic-level ACs (AC-E2.x)

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register a new client → appears in list | 2.3 | TC-E2-P0-01 | Covered |
| AC-E2.2: Search by Nombre or NIT/RUC < 1 s | 2.1 | TC-E2-P0-04, TC-E2-P2-04 | Covered |
| AC-E2.3: View detail + edit + save | 2.2, 2.4 | TC-E2-P1-01, TC-E2-P1-02 | Covered |
| AC-E2.4: Prevent saving with empty required fields | 2.3, 2.4 | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-03 | Covered |
| AC-E2.5: Delete client → disappears from list | 2.5 | TC-E2-P0-05, TC-E2-P1-05 | Covered |
| AC-E2.6: Sort without reload or losing search | 2.6 | TC-E2-P1-06, TC-E2-P2-02, TC-E2-P2-03 | Covered |

### Story-level ACs

| Story AC | Test Cases | Status |
|----------|------------|--------|
| 2.1 AC1 — List with Nombre + NIT/RUC visible | TC-E2-P1-08 | Covered |
| 2.1 AC2 — Real-time filter < 1 s, 500 records | TC-E2-P0-04, TC-E2-P2-04 | Covered |
| 2.1 AC3 — EmptyState when zero clients | TC-E2-P2-01 | Covered |
| 2.1 AC4 — ErrorPanel + Reintentar on fetch failure | TC-E2-P1-07 | Covered |
| 2.2 AC1 — Detail panel populated on click + URL update | TC-E2-P1-01 | Covered |
| 2.2 AC2 — Direct URL access loads correct client | TC-E2-P1-01 | Covered |
| 2.2 AC3 — Non-existent id → graceful not-found | TC-E2-P1-01 | Covered |
| 2.3 AC1 — Form opens with all 4 fields | TC-E2-P0-01 | Covered |
| 2.3 AC2 — Submit creates client + success toast | TC-E2-P0-01 | Covered |
| 2.3 AC3 — Empty submit → inline errors, no API call | TC-E2-P0-02 | Covered |
| 2.3 AC4 — Duplicate NIT/RUC → user-safe error | TC-E2-P0-03 | Covered |
| 2.4 AC1 — Edit pre-fills current values | TC-E2-P1-02 | Covered |
| 2.4 AC2 — Submit updates list + detail + toast | TC-E2-P1-02 | Covered |
| 2.4 AC3 — Cleared required field → inline error | TC-E2-P1-03 | Covered |
| 2.4 AC4 — Cancel preserves original data | TC-E2-P1-04 | Covered |
| 2.5 AC1 — Confirmation dialog appears | TC-E2-P1-05 | Covered |
| 2.5 AC2 — Confirm → removed from list + toast | TC-E2-P0-05, TC-E2-P1-05 | Covered |
| 2.5 AC3 — Cancel in dialog → no change | TC-E2-P1-05 | Covered |
| 2.5 AC4 — Delete with contacts → orphans + specific toast | TC-E2-P0-05, TC-E2-P2-05 | Covered |
| 2.6 AC1-4 — Four sort modes | TC-E2-P1-06, TC-E2-P2-02, TC-E2-P2-03 | Covered |
| 2.6 AC5 — Sort over active filter | TC-E2-P1-06 | Covered |
| 2.6 AC6 — Default "Más reciente" | TC-E2-P2-02 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search returns + renders < 1 s with 500 records | TC-E2-P0-04 | API + Component |
| NFR2 | CRUD reflects UI changes < 2 s | TC-E2-P0-01, TC-E2-P1-02 (optimistic updates make this implicit) | Component |
| NFR3 | Responsive with up to 10 simultaneous users | Out of scope for Epic 2 tests — covered by load test in Epic 5 / pre-release | Deferred |
| NFR4 | HTTPS in non-local | Out of scope (local dev) | N/A |
| NFR5 | Validate + sanitize all user inputs | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P3-01 | API + Unit |
| NFR6 | No stack traces / internal detail to user | TC-E2-P0-02, TC-E2-P0-03 | API |
| NFR7 | Core task completable without training | Implicit through E2E TC-E2-P0-03 + TC-E2-P1-01 happy path | E2E |
| NFR8 | ≤ 2 clicks from client to associated contacts | Out of scope (Epic 4) | Deferred |
| NFR9 | View associated client without extra navigation | Out of scope (Epic 4) | Deferred |
| NFR10 | Max 500 clients, 1000 contacts | TC-E2-P0-04 seeds at the NFR10 cap | API |
| NFR11 | Data model supports future expansion | Architectural — no test, validated via schema review | N/A |

---

## 7. Test Execution Order

```
Phase 1 — Backend Contract Gate (P0, API-only, no UI)
  1. TC-E2-P0-02 (API leg)  Validation 400 + Problem Details
  2. TC-E2-P0-03 (API leg)  Duplicate NIT 409 + Problem Details
  3. TC-E2-P0-01 (API leg)  Create happy path 201
  4. TC-E2-P0-05 (API leg)  Delete preserves contacts as orphans
  5. TC-E2-P3-01             Validator unit tests

Phase 2 — Performance Gate (P0)
  6. TC-E2-P0-04 (API leg)   Search < 1 s with 500 records

Phase 3 — Frontend Component Gate (P0/P1)
  7. TC-E2-P0-02 (UI leg)    Required-field validation, no network
  8. TC-E2-P0-01 (UI leg)    Create flow + success toast
  9. TC-E2-P1-02             Edit flow + optimistic update + rollback
 10. TC-E2-P1-03             Edit clear-required-field
 11. TC-E2-P1-04             Edit cancel preserves data
 12. TC-E2-P1-05             Delete confirmation dialog
 13. TC-E2-P0-05 (UI leg)    Delete with contacts + toast wording
 14. TC-E2-P1-06             Sort + active search
 15. TC-E2-P1-07             ErrorPanel + Reintentar
 16. TC-E2-P1-08             Dual-panel layout 280 px
 17. TC-E2-P0-04 (UI leg)    Search < 1 s on 500-record fixture

Phase 4 — E2E Gate (P0/P1)
 18. TC-E2-P0-03 (E2E leg)   Duplicate NIT UI message
 19. TC-E2-P1-01             Deep link to detail + not-found

Phase 5 — Secondary Coverage (P2)
 20. TC-E2-P2-01             EmptyState
 21. TC-E2-P2-02             Default sort "Más reciente"
 22. TC-E2-P2-03             Sort modes (3 of 4)
 23. TC-E2-P2-04             Search predicate matches Nombre + NIT
 24. TC-E2-P2-05             Toast wording — orphan contacts
```

Smoke subset (run on every PR, < 5 min): TC-E2-P0-01 (UI leg), TC-E2-P0-02 (UI leg), TC-E2-P0-05 (API leg), TC-E2-P1-01.

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW | REST mocking for component tests | Frontend |
| Playwright | E2E tests (deep linking, duplicate-NIT visible error) | Frontend / E2E |
| xUnit | Unit + integration tests | Backend |
| FluentValidation test helpers | Validator unit tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| Bogus (or Faker.NET) | Seed 500-client fixture for NFR1 | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ available via TestContainers Docker image
- `clientes` table migration applied (delivered in Story 2.1 or earlier)
- Frontend dependencies installed (npm install)
- Backend packages restored (dotnet restore)
- TanStack Query devtools disabled in test mode
```

### Test Fixtures Required

- **`clienteFactory`** (Bogus / Faker.NET on backend, faker on frontend): generates `{ nombre, nitRuc, telefono, ciudad, createdAt }` with realistic locale-appropriate values.
- **`contactoFactory` stub** (only the shape, not the table) for TC-E2-P0-05 component leg — actual table comes from Epic 3.
- **500-client seed** for NFR1 — backend Bogus seeder + frontend JSON fixture file.

---

## 9. Resource Estimates

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.0 | 10.0 | Cross-layer (API+UI), NFR1 perf harness, orphan-contacts contract |
| P1 | 8 | 1.0 | 8.0 | Standard CRUD coverage, deep linking |
| P2 | 5 | 0.5 | 2.5 | EmptyState, default sort, predicate, wording |
| P3 | 1 | 0.5 | 0.5 | Validator unit tests |
| **Total** | **19** | — | **21.0 hours** | **~2.5 days** |

Notes:
- Several P0/P1 entries are listed as a single test case with both API and Component (or E2E) legs; the table counts the case once. Total automation work is `~28` distinct test artifacts (see pyramid in §3).
- The 500-record performance seed is a one-time fixture build that benefits Epics 3 and 5; counted at 2 hours inside P0.

---

## 10. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (5 cases, no exceptions)
- **P1 pass rate**: 100% (8 cases)
- **P2 pass rate**: ≥ 90% (5 cases; deferral allowed only with documented justification on UX/copy items)
- **P3 pass rate**: informational
- **High-risk mitigations (R1, R2, R3)**: 100% complete before Epic 2 closure
- **NFR1 budget (search < 1 s with 500 records)**: HARD GATE — must be met at both API and UI layers

### Coverage Targets

- **Epic-level ACs (AC-E2.1–6)**: 100%
- **Story-level ACs (Stories 2.1–2.6)**: ≥ 95%
- **Critical paths** (create, edit, delete-with-contacts, search): 100%
- **NFR5 / NFR6 (input validation + no internal leak)**: 100%

### Non-Negotiable Requirements

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] Orphan-contacts contract verified at API level (R1)
- [ ] Duplicate NIT/RUC user-visible message verified at E2E (R2)
- [ ] NFR1 search budget < 1 s verified at both API and component layers (R3)
- [ ] NFR6 verified — Problem Details responses contain no `stackTrace`, no SQL fragments

---

## 11. Mitigation Plans for High-Risk Items

### R1 — Orphan Contacts on Delete (Score 6, DATA)

**Mitigation Strategy:** Backend DELETE handler MUST NOT cascade-delete `contactos`. Use EF Core fluent config with `OnDelete(DeleteBehavior.SetNull)` on the FK, and verify in TC-E2-P0-05.
**Owner:** Backend dev (Story 2.5)
**Timeline:** Before Story 2.5 is marked review.
**Status:** Planned
**Verification:** TC-E2-P0-05 passes. Re-validated as part of Epic 4 trace.

### R2 — Duplicate NIT/RUC + NFR6 (Score 6, SEC)

**Mitigation Strategy:** Unique index on `clientes.nit_ruc` (EF Core migration). Global ExceptionHandlingMiddleware maps `DbUpdateException` with unique-violation Postgres SQLSTATE `23505` to a 409 Problem Details body whose `detail` is a user-safe string ("El NIT/RUC ya está registrado"). UI surfaces `problem.detail` verbatim — never `problem.errors` or raw text.
**Owner:** Backend dev (Story 2.3) + Frontend dev (Story 2.3)
**Timeline:** Before Story 2.3 is marked review.
**Status:** Planned
**Verification:** TC-E2-P0-03 (both legs) passes.

### R3 — Search Performance (Score 6, PERF)

**Mitigation Strategy:**
- Backend: GIN index `clientes_nombre_trgm_idx` on `nombre` using `pg_trgm`, plus a B-tree on `nit_ruc`. Search endpoint uses `ILIKE '%query%'` over the indexed columns.
- Frontend: 150 ms debounce on the search input; filter is applied client-side first over the TanStack Query cache (`useMemo` with stable predicate); list virtualized only if perf budget is exceeded with > 200 rendered items.
**Owner:** Backend dev + Frontend dev (Story 2.1)
**Timeline:** Before Story 2.1 is marked review.
**Status:** Planned
**Verification:** TC-E2-P0-04 (both legs) passes with p95 < 1 s.

---

## 12. Assumptions and Dependencies

### Assumptions

1. The `clientes` table (and required indexes) is created in Story 2.1's migration before any P0 test runs.
2. The `contactos` table from Epic 3 will exist with `cliente_id` nullable FK before TC-E2-P0-05's API leg runs in CI. If Epic 3 has not landed, TC-E2-P0-05 API leg runs against a temporary in-test schema; the component leg runs unconditionally.
3. The siesa-ui-kit `EmptyState`, `ErrorPanel`, `SortControl`, and dual-panel layout primitives are available (Epic 1 closure).
4. The global ExceptionHandlingMiddleware from Story 1.3 already returns Problem Details RFC 7807 — Epic 2 only adds the 409 mapping.
5. The current architectural decision is client-side filtering over a TanStack Query cache for the search; the API search endpoint exists as the source of truth and as a fallback for larger datasets.

### Dependencies

1. **Epic 1 closure** — backend Problem Details middleware, frontend SPA shell + routing, siesa-ui-kit availability.
2. **Epic 3 schema** — `contactos` table with nullable `cliente_id` FK — required for TC-E2-P0-05 API leg.
3. **TestContainers Postgres** — already used in Epic 1 backend integration tests; reused here.

### Risks to Plan

- **Epic 3 schema not yet available** when Epic 2 P0 tests are written. **Contingency:** Author TC-E2-P0-05's API leg against a one-off test-only migration that creates a minimal `contactos` table; replace with the real Epic 3 schema during Epic 4 trace.
- **siesa-ui-kit `EmptyState` / `SortControl` not yet exposed**. **Contingency:** Use shadcn/ui fallback per the company standard, defer the layout-fidelity test (TC-E2-P1-08) to a follow-up story.

---

## 13. Follow-on Workflows (Manual)

- Run `*atdd` per story (2.1 → 2.6) to generate failing P0 tests *before* implementation — particularly TC-E2-P0-01, TC-E2-P0-03, TC-E2-P0-05.
- Run `*automate` after each story merges to expand coverage and add P2/P3 cases the dev didn't naturally write.
- Run `*test-review` per story to validate test quality.
- Run `*trace` at Epic 2 closure to confirm AC → test coverage matches this design and to emit the gate decision.
- Re-run TC-E2-P0-05 as part of `*trace` for Epic 4 (orphan-contacts contract).

---

## 14. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-08)
- [ ] P2 cases pass or are formally deferred with justification
- [ ] No P0/P1 case skipped without a documented waiver
- [ ] Risks R1, R2, R3 — all mitigations verified
- [ ] NFR1 budget (search < 1 s with 500 records) measured and within budget
- [ ] No Problem Details response contains a stack trace or SQL fragment (NFR6)

---

## 15. Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification (TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` — Probability × Impact scoring
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision matrix
- `test-priorities-matrix.md` — P0–P3 prioritization

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- PRD FRs: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- PRD NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX spec: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Predecessor: `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module (via sa-tea-test-design)
**Workflow:** `_bmad/bmm/testarch/test-design` v4.0
**Mode:** Epic-Level (Phase 4)
