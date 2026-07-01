---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-07-01"
updatedAt: "2026-07-01"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: complete
epicImplementationStatus: pending
storyStatuses:
  2.1: pending
  2.2: pending
  2.3: pending
  2.4: pending
  2.5: pending
  2.6: pending
---

# Test Design — Epic 2: Client Management

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 delivers the full CRUD lifecycle for the `clientes` domain: list with real-time search, detail view with deep linking, creation and editing via a validated form, deletion with contact-orphaning side effects, and client-side sorting. This is the first domain-data epic (builds on the Epic 1 shell) and introduces the split-panel UI pattern (`ClienteListPanel` + `ClienteDetailPanel`), the `clientes` PostgreSQL table with a unique NIT/RUC constraint, and the shared FluentValidation (backend) + Zod (frontend) validation pattern that Epic 3 (Contacts) will replicate.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time client-side filter, NFR1 (<1s/500 records), EmptyState, ErrorPanel + retry |
| 2.2 | Client Detail View | Deep linking `/clientes/:clienteId`, not-found handling |
| 2.3 | Create Client | Required-field validation (Zod + FluentValidation), NIT/RUC uniqueness (409), success toast, immediate list update |
| 2.4 | Edit Client | Pre-filled form, partial update, cancel-preserves-data, required-field validation |
| 2.5 | Delete Client | Confirmation dialog, cascading side effect: associated contacts become unassigned (`clienteId = null`), not hard-deleted |
| 2.6 | Sort Client List | Client-side sort (no API call), 4 sort modes, interaction with active search filter |

### Out of Scope for This Epic

- Contact management CRUD (Epic 3)
- Client↔Contact association UI beyond the orphaning side effect of delete (Epic 4)
- Authentication/authorization (deferred — MVP)
- Pagination (list loads all records; NFR10 caps at 500 clients)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Category | Probability | Impact | Score | Priority | Mitigation Strategy |
|---|-----------|----------|-------------|--------|-------|----------|----------------------|
| R1 | **NIT/RUC uniqueness race**: DB unique constraint (`uk_clientes_nit`) not enforced or mismapped, allowing duplicate NIT/RUC or wrongly rejecting valid creates | DATA | 2 | 3 | 6 | P0 | Integration test: create client, attempt duplicate NIT/RUC, assert 409 with `"El NIT/RUC ya está registrado"` and no technical detail leak (NFR6) |
| R2 | **Delete cascades incorrectly**: FK `cliente_id` on `contactos` configured `ON DELETE CASCADE` instead of `ON DELETE SET NULL`, silently destroying contact records instead of orphaning them | DATA | 2 | 3 | 6 | P0 | Integration test: create client with N associated contacts, delete client, assert contacts still exist in DB with `cliente_id = NULL` |
| R3 | **Required-field validation bypass**: frontend Zod schema and backend FluentValidator diverge, allowing empty Nombre/NIT/Teléfono/Ciudad to reach the DB via direct API call | SEC/DATA | 2 | 2 | 4 | P1 | API-level test bypassing the UI: POST with empty/missing required fields, assert 400 with field-level errors from FluentValidation, independent of frontend Zod |
| R4 | **Search performance regression** at 500 records: client-side filter implementation is O(n²) or re-renders the full list on each keystroke, breaching NFR1 (<1s) | PERF | 2 | 2 | 4 | P1 | Performance test: seed 500 clients, measure filter render time on keystroke, assert <1000ms end-to-end |
| R5 | **Sort/search interaction bug**: applying a sort after an active search clears the search input or refetches from API (violates AC-E2.6 "without triggering a new API call") | TECH | 2 | 2 | 4 | P1 | Component test: apply search filter, then change sort order, assert search input value unchanged AND no new network request fired (spy/intercept) |
| R6 | **Stale cache after mutation**: TanStack Query `invalidateQueries` key mismatch (e.g., `['cliente']` vs `['clientes']`) causes create/edit/delete to not reflect in the list without manual refresh, violating FR27/NFR2 | TECH | 2 | 2 | 4 | P1 | Component/E2E test: create/edit/delete a client, assert list updates within 2s without page reload |
| R7 | **Deep-link not-found handling**: navigating to `/clientes/:clienteId` with a non-existent UUID throws an unhandled error or blank page instead of a graceful not-found message | BUS | 2 | 2 | 4 | P1 | E2E test: navigate to `/clientes/00000000-0000-0000-0000-000000000000`, assert graceful not-found UI, no console error/crash |
| R8 | **Cancel-without-saving leaks state**: clicking "Cancelar" on the edit form partially mutates local state or triggers an unintended API call before discarding changes | BUS | 1 | 2 | 2 | P2 | Component test: edit fields, click Cancelar, assert original values displayed and zero API calls made |
| R9 | **Delete confirmation dialog dismissal**: clicking outside the dialog or pressing Esc deletes the client instead of cancelling | DATA | 1 | 3 | 3 | P2 | Component test: open delete dialog, dismiss via Esc/backdrop click, assert client NOT deleted |
| R10 | **EmptyState/ErrorPanel misfire**: EmptyState shown when clients exist but the search yields zero matches (should show "no results", not "no clients yet"), or ErrorPanel retry button doesn't actually retry the fetch | BUS | 2 | 1 | 2 | P2 | Component test: verify distinct empty-list vs. zero-search-results states; verify retry button re-invokes the query |
| R11 | **Toast message drift**: success/error toast copy doesn't match the exact Spanish strings specified in ACs (e.g., "Cliente creado correctamente"), breaking consistency expected by NFR7 (no training required) | BUS | 1 | 1 | 1 | P3 | Component test: assert exact toast text on create/edit/delete success paths |

### Top 3 Risk Areas for Epic 2

1. **Delete → orphan-contacts side effect (R2)** — this is the epic's highest-impact hidden risk: a misconfigured FK (`CASCADE` instead of `SET NULL`) silently destroys contact data with no user-visible symptom until Epic 3/4 testing, or worse, in production. Must be verified at the database/migration level, not just through UI behavior.
2. **NIT/RUC uniqueness enforcement (R1)** — the unique constraint is the epic's only real data-integrity guardrail; if the 409 conflict path isn't wired correctly end-to-end (DB constraint → domain exception → Problem Details → frontend toast), users either get raw DB errors (NFR6 violation) or duplicate clients silently succeed.
3. **Client-side search/sort correctness under combined state (R4, R5)** — search and sort both operate on the same in-memory TanStack Query cache without new fetches; the two features are new to this epic and their interaction (search active + sort changed) is exactly the kind of state-management bug that's easy to introduce and easy to miss without a dedicated test.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌▌▌▌▌       5 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 12 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 14 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌▌▌          6 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                        37 tests
```

### Rationale

- **Epic 2 is domain/CRUD-heavy** — the bulk of value comes from API integration tests (validation, uniqueness, cascading behavior) and component tests (form behavior, search/sort interaction, toast/empty/error states).
- **E2E is reserved for cross-cutting user journeys**: full create→list→edit→delete flow, deep linking, and the delete-orphans-contacts journey — scenarios that genuinely span frontend+backend and matter most to the end user.
- **Component tests dominate the frontend layer** because `ClienteForm` (Zod validation, pre-fill, cancel), `SortControl`, and list/search/empty/error states are all React Testing Library-appropriate: fast, isolated, no real network needed (MSW mocks).
- **Unit tests cover the Zod schema and FluentValidation rules in isolation**, independent of the API/UI wiring, to pinpoint validation logic bugs quickly.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation / Before Story Is Closed

#### TC-E2-P0-01: Backend Rejects Duplicate NIT/RUC with 409

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.1, Story 2.3 AC (duplicate NIT/RUC → 409)
**Risk covered:** R1

**Precondition:** Backend running with clean `clientes` table. `uk_clientes_nit` unique index active.

**Test Steps:**
1. POST `/api/v1/clientes` with a valid client (`nit: "900123456-1"`).
2. POST `/api/v1/clientes` again with the same `nit` but different `nombre`.

**Expected Result:**
- First request: `201 Created`.
- Second request: `409 Conflict`, Problem Details body with `detail` mentioning NIT/RUC already registered, no stack trace or DB error text.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + test database.

---

#### TC-E2-P0-02: Frontend Displays Friendly Error on 409 NIT/RUC Conflict

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** Story 2.3 AC (409 → "El NIT/RUC ya está registrado")
**Risk covered:** R1

**Test Steps:**
1. Mock POST `/api/v1/clientes` to return 409 Problem Details via MSW.
2. Fill and submit `ClienteForm`.

**Expected Result:**
- Error message "El NIT/RUC ya está registrado" is displayed.
- No raw Problem Details JSON or technical error text is shown (NFR6).
- Form remains open with entered data intact (no data loss).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-03: Delete Client Sets Associated Contacts' `cliente_id` to NULL (Not Cascade Delete)

**Level:** API Integration
**Story:** 2.5
**Requirement:** Story 2.5 AC (contacts remain, become unassigned)
**Risk covered:** R2

**Precondition:** A client exists with ≥2 associated contacts (`cliente_id` set).

**Test Steps:**
1. Create client C1.
2. Create contacts K1, K2 with `clienteId = C1.id`.
3. DELETE `/api/v1/clientes/{C1.id}`.
4. GET `/api/v1/contactos/{K1.id}` and `/api/v1/contactos/{K2.id}`.

**Expected Result:**
- DELETE returns `204 No Content` (or `200`).
- K1 and K2 still exist (not deleted) — GET returns `200`.
- K1.clienteId and K2.clienteId are `null`.
- K1 and K2 appear in `GET /api/v1/contactos?sinCliente=true`.

**Automation:** xUnit integration test — this is the single most important test in the epic; must run against a real/TestContainers Postgres to validate FK `ON DELETE SET NULL` behavior, not an in-memory provider that may not honor the constraint.

---

#### TC-E2-P0-04: Delete Confirmation Flow Shows Correct Toast and Orphaning Message

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** Story 2.5 AC (toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.")
**Risk covered:** R2, R11

**Precondition:** Seeded client with ≥1 associated contact.

**Test Steps:**
1. Navigate to `/clientes/:clienteId` for the seeded client.
2. Click "Eliminar".
3. Confirm dialog appears; click "Confirmar".

**Expected Result:**
- Client removed from list immediately.
- Right panel returns to empty/default state.
- Toast reads exactly "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (client has contacts) — verify the plain "Cliente eliminado correctamente" variant is NOT shown when contacts exist.

**Automation:** Playwright E2E.

---

#### TC-E2-P0-05: Backend Rejects Empty Required Fields Independent of Frontend Validation

**Level:** API Integration
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4 (system prevents saving with empty required fields)
**Risk covered:** R3

**Test Steps:**
1. POST `/api/v1/clientes` with `nombre: ""`, omitting `nit`.
2. POST `/api/v1/clientes` with all fields as whitespace-only strings.

**Expected Result:**
- Both requests return `400 Bad Request` with FluentValidation field-level error details (`errors: { nombre: [...], nit: [...] }`).
- No record is persisted (verify via subsequent GET list count unchanged).

**Automation:** xUnit integration test — bypasses UI entirely to prove backend validation is not solely reliant on frontend Zod.

---

#### TC-E2-P0-06: Create Client Happy Path — End-to-End

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1
**Risk covered:** R6

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente".
3. Fill Nombre, NIT/RUC, Teléfono, Ciudad with valid values.
4. Submit.

**Expected Result:**
- Client appears in the list immediately (no manual refresh, no full page reload).
- Toast "Cliente creado correctamente" is shown.
- Newly created client is selectable and its detail matches submitted values.

**Automation:** Playwright E2E.

---

### P1 — Must Pass Before Story Is Closed as Done

#### TC-E2-P1-01: Real-Time Search Filters by Nombre and NIT/RUC

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2
**Risk covered:** R4

**Test Steps:**
1. Render `ClienteListPanel` with a mocked list of 10 clients (mixed names/NITs).
2. Type a substring matching one client's `nombre` into the search field.
3. Clear and type a substring matching another client's `nit`.

**Expected Result:**
- Only matching client(s) render after each keystroke sequence.
- Filtering happens without a new network request (client-side).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-02: Search Performance Under 1 Second with 500 Records

**Level:** E2E or Component (performance-focused)
**Story:** 2.1
**Requirement:** NFR1
**Risk covered:** R4

**Precondition:** Seed 500 client records (via API or factory).

**Test Steps:**
1. Load `/clientes` with 500 records in cache.
2. Type a search query.
3. Measure time from keystroke to filtered DOM update.

**Expected Result:**
- Filtered results render in <1000ms end-to-end (NFR1).

**Automation:** Playwright E2E with performance timing assertions, or Vitest with `performance.now()` around the filter function with a 500-item fixture.

---

#### TC-E2-P1-03: EmptyState Displayed When No Clients Exist

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2 (EmptyState guidance)
**Risk covered:** R10

**Test Steps:**
1. Mock `GET /api/v1/clientes` to return `[]`.
2. Render `/clientes`.

**Expected Result:**
- `EmptyState` component renders with guidance to create the first client.
- Distinct from the "no search results" state (see TC-E2-P1-04).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: Zero Search Results Shows "No Results" State, Not EmptyState

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Risk covered:** R10

**Test Steps:**
1. Render list with 5 clients loaded.
2. Type a search query matching none of them.

**Expected Result:**
- A "no results for this search" indicator is shown (not the zero-clients `EmptyState`).
- Search input retains the typed value.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-05: ErrorPanel with Retry on Backend Failure

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2 (ErrorPanel + Reintentar)
**Risk covered:** R10

**Test Steps:**
1. Mock `GET /api/v1/clientes` to fail (500 or network error).
2. Render `/clientes`.
3. Click "Reintentar", now mocked to succeed.

**Expected Result:**
- `ErrorPanel` renders instead of the list on initial failure.
- Clicking "Reintentar" re-triggers the fetch; on success, the list renders.

**Automation:** Vitest + RTL + MSW (dynamic handler override).

---

#### TC-E2-P1-06: Client Detail Deep Link Loads Correct Client

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** FR30, Story 2.2 AC
**Risk covered:** R7

**Test Steps:**
1. Seed a client, obtain its UUID.
2. Navigate directly to `/clientes/{uuid}` (no prior in-app navigation).

**Expected Result:**
- Correct client details render (Nombre, NIT/RUC, Teléfono, Ciudad match seeded values).
- No redirect to `/clientes` root.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-07: Non-Existent Client ID Shows Graceful Not-Found

**Level:** E2E (Playwright)
**Story:** 2.2
**Risk covered:** R7

**Test Steps:**
1. Navigate to `/clientes/00000000-0000-0000-0000-000000000000`.

**Expected Result:**
- A graceful not-found message renders (not a blank page, not an unhandled JS error).
- No console errors logged.

**Automation:** Playwright E2E (assert `page.on('console')` has no error-level entries).

---

#### TC-E2-P1-08: Edit Form Pre-Fills with Current Values

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** Story 2.4 AC (FR6)

**Test Steps:**
1. Render `ClienteForm` in edit mode with an existing client object.

**Expected Result:**
- All four fields (Nombre, NIT/RUC, Teléfono, Ciudad) display the client's current values on mount.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-09: Edit Saves Changes and Reflects Immediately in Detail + List

**Level:** E2E (Playwright)
**Story:** 2.4
**Requirement:** FR27
**Risk covered:** R6

**Test Steps:**
1. Open an existing client's detail, click "Editar".
2. Change the `Ciudad` field, submit.

**Expected Result:**
- Detail panel shows updated `Ciudad` immediately.
- List item (if Ciudad is displayed there, or on reselect) reflects update within 2s (NFR2), no manual refresh.
- Toast "Cliente actualizado correctamente" shown.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-10: Edit Form Validation Blocks Empty Required Field

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** Story 2.4 AC (FR8)
**Risk covered:** R3

**Test Steps:**
1. Render `ClienteForm` in edit mode.
2. Clear the `Nombre` field, submit.

**Expected Result:**
- Inline error message appears on `Nombre`.
- `onSubmit`/API call is NOT invoked (assert mock not called).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-11: Delete Confirmation Dialog — Cancel Preserves Client

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** Story 2.5 AC (Cancelar preserves record)

**Test Steps:**
1. Open delete confirmation dialog for a client.
2. Click "Cancelar".

**Expected Result:**
- Dialog closes.
- No DELETE API call is made (assert mock/spy not called).
- Client remains selected and unchanged in the detail panel.

**Automation:** Vitest + RTL + MSW (assert no request recorded).

---

#### TC-E2-P1-12: Sort Reorders List Without New API Call (All 4 Modes)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6 AC
**Risk covered:** R5

**Test Steps:**
1. Render list with ≥3 clients having distinct `nombre` and `createdAt`.
2. Select "Nombre A→Z" — assert order + zero new fetch calls (spy on query function).
3. Select "Nombre Z→A" — assert reversed order, zero new fetch calls.
4. Select "Más reciente" — assert newest-first by `createdAt`.
5. Select "Más antiguo" — assert oldest-first.

**Expected Result:**
- All 4 orderings correct.
- Fetch/query function call count unchanged after each sort action (client-side only, per architecture: sorting over TanStack Query cache).

**Automation:** Vitest + RTL with a spy/mock on the data-fetching hook (`useClientes`).

---

#### TC-E2-P1-13: Sort Applied on Top of Active Search Filter Without Clearing It

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6 AC (sort applied to filtered set, search preserved)
**Risk covered:** R5

**Test Steps:**
1. Type a search query that filters the list to a subset.
2. Change sort order via `SortControl`.

**Expected Result:**
- Search input retains its typed value.
- Only the filtered subset is reordered (clients outside the filter do not reappear).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: Default Sort on Initial Load Is "Más reciente"

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6 AC (default sort)

**Test Steps:**
1. Render list with no prior sort preference set.

**Expected Result:**
- `SortControl` shows "Más reciente" selected by default.
- List is ordered newest-first on initial render.

**Automation:** Vitest + RTL.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Zod Schema Rejects Empty/Invalid Fields at Unit Level

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4

**Test Steps:**
1. Call `clienteSchema.safeParse()` with empty `nombre`, empty `nit`, empty `telefono`, empty `ciudad` (individually and combined).

**Expected Result:**
- `safeParse` returns `success: false` with an issue for each empty required field.
- Valid payload returns `success: true`.

**Automation:** Vitest unit test directly against `clienteSchema.ts`.

---

#### TC-E2-P2-02: FluentValidation Validator Unit Tests

**Level:** Unit (xUnit)
**Story:** 2.3, 2.4

**Test Steps:**
1. Instantiate `CreateClienteRequestValidator` directly (no HTTP).
2. Validate payloads with missing/empty Nombre, NIT, Telefono, Ciudad.

**Expected Result:**
- `ValidationResult.IsValid == false` with expected error codes/messages per field.
- Valid payload passes.

**Automation:** xUnit unit test (no `WebApplicationFactory` needed — pure validator test).

---

#### TC-E2-P2-03: Delete Dialog Dismissal via Esc/Backdrop Does Not Delete

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Risk covered:** R9

**Test Steps:**
1. Open delete confirmation dialog.
2. Press `Escape` key (and separately, simulate backdrop click if supported by the dialog component).

**Expected Result:**
- Dialog closes without triggering delete.
- No DELETE API call made.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-04: List Item Shows Nombre and NIT/RUC Per Row

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** Story 2.1 AC

**Test Steps:**
1. Render list with sample clients.

**Expected Result:**
- Each row displays both `nombre` and `nit` visible without further interaction.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-05: Create Client Toast Exact Copy Verification

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Risk covered:** R11

**Test Steps:**
1. Successfully submit create form (mocked 201).

**Expected Result:**
- Toast text is exactly "Cliente creado correctamente" (no variation).

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-06: Edit Client Toast Exact Copy Verification

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Risk covered:** R11

**Test Steps:**
1. Successfully submit edit form (mocked 200).

**Expected Result:**
- Toast text is exactly "Cliente actualizado correctamente".

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-07: Delete Without Associated Contacts Shows Simple Toast Variant

**Level:** API/Component integration
**Story:** 2.5

**Test Steps:**
1. Delete a client with zero associated contacts.

**Expected Result:**
- Toast reads "Cliente eliminado correctamente" (the simple variant, not the orphaning-message variant).

**Automation:** Component test with MSW mock returning a client with no associated contacts.

---

#### TC-E2-P2-08: GET /api/v1/clientes Search Query Param Works Independent of Frontend Filter

**Level:** API Integration
**Story:** 2.1

**Test Steps:**
1. Seed clients with distinct names/NITs.
2. GET `/api/v1/clientes?q=<partial-name>`.

**Expected Result:**
- Backend search endpoint (fallback path per architecture) returns correctly filtered results, independent of the primary client-side filtering strategy.

**Automation:** xUnit integration test.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: NIT/RUC Format Edge Cases (Special Characters, Length)

**Level:** Unit (Vitest + xUnit)
**Story:** 2.3

**Test Steps:**
1. Submit NIT/RUC values with hyphens, leading zeros, very long strings.

**Expected Result:**
- Documented behavior for accepted formats (no hard format enforced per current ACs — this is exploratory to catch future regressions).

**Automation:** Vitest/xUnit parametrized tests.

---

#### TC-E2-P3-02: Concurrent Edit — Last Write Wins Behavior Documented

**Level:** Exploratory / Manual
**Story:** 2.4

**Test Steps:**
1. Two browser sessions open the same client; both edit different fields; both save.

**Expected Result:**
- Document actual behavior (no optimistic concurrency control specified in ACs) — flag as a known limitation, not a bug, unless it causes silent data loss beyond expectation.

**Automation:** Manual exploratory test; candidate for future ADR if data loss observed.

---

#### TC-E2-P3-03: Large Client List Scroll Performance (Sanity Check)

**Level:** E2E (Playwright)
**Story:** 2.1

**Test Steps:**
1. Seed 500 clients, scroll the list panel.

**Expected Result:**
- No visible jank or dropped frames (informal check — no strict SLA beyond NFR1 search timing).

**Automation:** Playwright manual scroll + visual check; not gating.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register new client, appears immediately | 2.3 | TC-E2-P0-06, TC-E2-P0-01 | Covered |
| AC-E2.2: Search by name/NIT under 1s | 2.1 | TC-E2-P1-01, TC-E2-P1-02 | Covered |
| AC-E2.3: View detail, edit any field, save | 2.2, 2.4 | TC-E2-P1-06, TC-E2-P1-08, TC-E2-P1-09 | Covered |
| AC-E2.4: Prevent save with empty required fields, clear errors | 2.3, 2.4 | TC-E2-P0-05, TC-E2-P1-10, TC-E2-P2-01, TC-E2-P2-02 | Covered |
| AC-E2.5: Delete client, removed from list | 2.5 | TC-E2-P0-04, TC-E2-P2-07 | Covered |
| AC-E2.6: Sort list (4 modes) without reload/losing filter | 2.6 | TC-E2-P1-12, TC-E2-P1-13, TC-E2-P1-14 | Covered |
| Story 2.1 — EmptyState / ErrorPanel | 2.1 | TC-E2-P1-03, TC-E2-P1-04, TC-E2-P1-05, TC-E2-P2-04 | Covered |
| Story 2.2 — Not-found on invalid clienteId | 2.2 | TC-E2-P1-07 | Covered |
| Story 2.3 — 409 duplicate NIT/RUC | 2.3 | TC-E2-P0-01, TC-E2-P0-02 | Covered |
| Story 2.4 — Cancel preserves data | 2.4 | (see Notes: add TC-E2-P1-15 if not covered by existing form-state tests) | Partially covered — recommend adding explicit cancel test |
| Story 2.5 — Confirmation dialog cancel | 2.5 | TC-E2-P1-11, TC-E2-P2-03 | Covered |
| Story 2.5 — Contacts orphaned, not deleted | 2.5 | TC-E2-P0-03, TC-E2-P0-04 | Covered |
| Toast copy exactness (all mutations) | 2.3, 2.4, 2.5 | TC-E2-P2-05, TC-E2-P2-06, TC-E2-P2-07, TC-E2-P0-04 | Covered |

**Note:** Story 2.4's "Cancelar preserves original data" AC overlaps conceptually with R8 but was not assigned a dedicated test ID above — recommend the automation phase add **TC-E2-P1-15: Edit Cancel Preserves Original Client Data** (Component, mirrors TC-E2-P1-11 pattern) to close this gap explicitly.

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search <1s with 500 records | TC-E2-P1-02 | E2E/Performance |
| NFR2 | CRUD reflects in UI <2s | TC-E2-P0-06, TC-E2-P1-09, TC-E2-P0-04 | E2E |
| NFR3 | Responsive with 10 concurrent users | Deferred to `*nfr` workflow (load testing) — not covered by functional test design | N/A (see testarch-nfr) |
| NFR5 | Input validation/sanitization | TC-E2-P0-05, TC-E2-P2-01, TC-E2-P2-02 | API Integration + Unit |
| NFR6 | No stack traces/internal errors exposed | TC-E2-P0-01, TC-E2-P0-02 | API Integration + Component |
| NFR7 | No training required (consistent UX copy) | TC-E2-P2-05, TC-E2-P2-06, TC-E2-P2-07 | Component |
| NFR10 | Scoped for 500 clients max | TC-E2-P1-02, TC-E2-P3-03 | Performance/Exploratory |
| NFR11 | Data model supports future expansion (no hardcoded limits) | Architecture review only — not a functional test; verify no `LIMIT` constants hardcoded in query layer during code review | N/A (code review) |

---

## 7. Test Execution Order

```
Phase 1 — Backend Data Integrity Gate (P0, DB required)
  1. TC-E2-P0-01  Duplicate NIT/RUC → 409
  2. TC-E2-P0-03  Delete sets contacts.cliente_id = NULL (not cascade delete)
  3. TC-E2-P0-05  Backend rejects empty required fields independent of frontend

Phase 2 — Frontend Validation & Error Handling Gate (P0)
  4. TC-E2-P0-02  Friendly error on 409 conflict
  5. TC-E2-P2-01  Zod schema unit tests
  6. TC-E2-P2-02  FluentValidation unit tests

Phase 3 — Core User Journeys (P0-P1, E2E)
  7. TC-E2-P0-06  Create client happy path
  8. TC-E2-P0-04  Delete with orphaning toast
  9. TC-E2-P1-06  Deep link to existing client
 10. TC-E2-P1-07  Deep link to non-existent client
 11. TC-E2-P1-09  Edit reflects immediately

Phase 4 — List/Search/Sort Component Suite (P1)
 12. TC-E2-P1-01  Real-time search filter
 13. TC-E2-P1-02  Search performance @ 500 records
 14. TC-E2-P1-03  EmptyState (zero clients)
 15. TC-E2-P1-04  Zero search results state
 16. TC-E2-P1-05  ErrorPanel + retry
 17. TC-E2-P1-12  Sort — all 4 modes, no new fetch
 18. TC-E2-P1-13  Sort + active search interaction
 19. TC-E2-P1-14  Default sort on load

Phase 5 — Form Behavior Suite (P1)
 20. TC-E2-P1-08  Edit form pre-fill
 21. TC-E2-P1-10  Edit validation blocks empty field
 22. TC-E2-P1-11  Delete cancel preserves client

Phase 6 — Polish & Regression (P2)
 23. TC-E2-P2-03  Esc/backdrop dismiss doesn't delete
 24. TC-E2-P2-04  List item shows Nombre + NIT
 25. TC-E2-P2-05  Create toast exact copy
 26. TC-E2-P2-06  Edit toast exact copy
 27. TC-E2-P2-07  Delete toast (no-contacts variant)
 28. TC-E2-P2-08  Backend search query param

Phase 7 — Exploratory / Future (P3)
 29. TC-E2-P3-01  NIT/RUC format edge cases
 30. TC-E2-P3-02  Concurrent edit behavior (manual)
 31. TC-E2-P3-03  Large list scroll sanity
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| MSW | API mocking (409, empty list, error, success) | Frontend |
| Playwright | E2E (create/edit/delete journeys, deep linking) | Frontend/E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Real FK constraint behavior (`ON DELETE SET NULL`) — mandatory for TC-E2-P0-03, cannot use in-memory provider | Backend |

### Environment Prerequisites

```
- All Epic 1 prerequisites (Node 20+/pnpm, .NET 10 SDK, PostgreSQL 18+)
- clientes table migrated with uk_clientes_nit unique index
- contactos table migrated with cliente_id nullable FK, ON DELETE SET NULL
- Seed/factory helpers for clientes (faker-based, auto-cleanup) — new for this epic
- MSW handlers for /api/v1/clientes endpoints (list, create, update, delete, 409, 500)
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|--------------|-------|
| P0 | 6 | 2.0 | 12.0 | DB-level FK behavior, 409 flow — complex setup (TestContainers) |
| P1 | 14 | 1.0 | 14.0 | Standard component/E2E coverage — search, sort, form, deep link |
| P2 | 8 | 0.5 | 4.0 | Unit validators, toast copy, dialog dismissal |
| P3 | 3 | 0.25 | 0.75 | Exploratory / format edge cases |
| **Total** | **31** | — | **30.75 hours** | **~3.8 days** |

*(Note: 37 tests listed in the pyramid include natural sub-variants counted per assertion group; the 31-count estimate above reflects distinct TC-IDs used for effort planning.)*

### Prerequisites

**Test Data:**
- `clienteFactory` (faker-based: nombre, nit unique per run, telefono, ciudad, auto-cleanup)
- `contactoFactory` with optional `clienteId` override (for orphaning tests)
- 500-record seed script for NFR1 performance testing

**Tooling:**
- MSW handlers for all `/api/v1/clientes` CRUD paths + error variants (409, 500, network failure)
- TestContainers Postgres — required specifically for TC-E2-P0-03 (FK cascade behavior cannot be trusted on EF InMemory provider)
- Playwright fixtures for authenticated-free navigation (no auth in MVP)

**Environment:**
- PostgreSQL 18+ with real FK constraints enabled (not InMemory) for integration suite
- Frontend dev server + backend API running concurrently for E2E suite

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — all 6 P0 tests must pass, especially TC-E2-P0-03)
- **P1 pass rate**: ≥95% (waivers require documented justification)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations** (R1, R2): 100% verified before Epic 2 closure

### Coverage Targets

- **Critical paths** (create, edit, delete, delete-orphaning): 100%
- **Data integrity** (NIT/RUC uniqueness, contact orphaning): 100%
- **Search/sort interaction**: ≥80%
- **Validation (frontend + backend, independently)**: 100%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] TC-E2-P0-03 specifically verified against a real Postgres instance (not EF InMemory) — this is the epic's data-loss guardrail
- [ ] No high-risk items (R1, R2) unmitigated
- [ ] Backend validation (FluentValidation) independently verified — not solely reliant on frontend Zod (R3)
- [ ] 409 conflict path produces zero technical/DB-error leakage (NFR6)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-14)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] The delete → contact-orphaning behavior (TC-E2-P0-03) is verified against real PostgreSQL FK constraints
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] Recommended gap-fill test (TC-E2-P1-15, edit-cancel preserves data) is added during `*atdd`/`*automate`
- [ ] `dotnet test` and `pnpm vitest run` pass with zero failures

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. The `contactos.cliente_id` foreign key MUST be configured with `ON DELETE SET NULL` in the EF Core entity configuration — verify explicitly in `ContactoConfiguration.cs`; do NOT rely on EF Core defaults, which can default to `CASCADE` or `NO ACTION` depending on convention.
2. The `clientes.nit` column MUST have a unique index (`uk_clientes_nit`) enforced at the database level, not only via a pre-insert existence check in application code (race condition risk under concurrent requests).
3. Backend FluentValidation validators for `CreateClienteRequest`/`UpdateClienteRequest` must be tested independently of the frontend — do not assume Zod is the only gate.
4. The 409 conflict handler must map the DB unique-constraint violation to a domain-specific exception → Problem Details with the exact message "El NIT/RUC ya está registrado" — no raw Postgres constraint-violation text should reach the client.
5. Sorting and searching must operate purely over the existing TanStack Query cache (`queryKey: ['clientes']`) — no additional `useQuery`/`refetch` call should fire when sort or search state changes; this must be verifiable via a spy on the query function in tests.
6. Toast copy must match exactly: "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente" (no contacts), "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (has contacts) — these two delete-toast variants are distinct and both must be implemented.
7. `EmptyState` (zero clients in system) and "no search results" (clients exist but filter matches none) must be visually/structurally distinct components or states — do not conflate them.

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
