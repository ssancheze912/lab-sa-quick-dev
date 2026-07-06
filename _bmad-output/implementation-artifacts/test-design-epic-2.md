---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-07-06"
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

Epic 2 delivers the complete CRUD lifecycle for the `Cliente` domain entity: list + real-time search, detail view with deep linking, create, edit, delete (with contact-unassignment cascade), and client-side sorting. It is the first epic to exercise real business/domain logic (Epic 1 was pure infrastructure), the REST `/api/v1/clientes` resource, EF Core persistence with a unique `nit` constraint, and TanStack Query cache invalidation for FR27 (immediate cross-user visibility of changes).

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|---------------|
| 2.1 | Client List & Search | List rendering, real-time client-side search (name/NIT), EmptyState, ErrorPanel + retry, NFR1 (<1s @ 500 records) |
| 2.2 | Client Detail View | Split-panel detail rendering, deep linking (`/clientes/:clienteId`), not-found handling (FR30) |
| 2.3 | Create Client | Form validation (required fields), NIT uniqueness (409 conflict), success toast, immediate list update (FR27) |
| 2.4 | Edit Client | Pre-filled form, partial updates, required-field validation on edit, cancel-preserves-original behavior |
| 2.5 | Delete Client | Confirmation dialog, cascade unassignment of contacts (`clienteId = null`, NOT deleted), specific toast copy |
| 2.6 | Sort Client List | Client-side sort (Nombre A→Z/Z→A, Más reciente/antiguo), no extra API call, compatibility with active search filter, default sort order |

### Out of Scope for This Epic

- Contact (`Contacto`) CRUD and Cliente↔Contacto association logic — Epics 3 and 4
- Authentication/authorization — explicitly deferred (MVP)
- Server-side pagination — MVP dataset capped at 500 records (NFR10), full list loaded and filtered client-side
- Bulk operations (bulk delete, bulk import) — not in PRD scope

### Existing Test Coverage (Pre-Design Analysis)

A partial E2E suite already exists at `e2e/tests/clientes/clientes-crud.spec.ts` (written ahead of implementation, per project convention) covering:
- FR1 (list existing clients), FR2 (search by name, search by NIT), FR4 (create client), FR7 (duplicate-NIT error), FR8 (required-field validation)

**Confirmed gaps** (no backend `Clientes` source exists yet under `backend/src` — this design precedes implementation):
- No coverage for FR3 (detail view / deep linking — Story 2.2)
- No coverage for FR5 (edit — Story 2.4)
- No coverage for FR6 (delete + cascade unassignment — Story 2.5)
- No coverage for Story 2.6 (sorting) at all
- No EmptyState / ErrorPanel + retry coverage
- No backend API integration tests (xUnit) or unit tests (validators, command handlers) for the `Clientes` resource
- No explicit NFR1 (search latency) or NFR2 (mutation-to-UI latency) verification

This design closes those gaps and defines the full coverage plan for the epic; the existing spec file's 5 scenarios are folded into TC-E2-P0-02/03/04 and TC-E2-P1-05/06 below to avoid duplication.

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Category | Probability | Impact | Score | Priority | Mitigation Strategy |
|---|-----------|----------|:---:|:---:|:---:|:---:|----------------------|
| R1 | Duplicate NIT/RUC not rejected consistently (frontend Zod passes, backend unique constraint missing/mis-mapped to 409) | DATA | 2 | 3 | **6** | P0 | API integration test: unique index on `nit`; 409 mapped from `DbUpdateException`/domain exception with safe message (NFR6) |
| R2 | Deleting a client with associated contacts cascades a hard DELETE onto `contactos` instead of setting `cliente_id = NULL` | DATA | 2 | 3 | **6** | P0 | API integration test asserting contacts survive deletion with `clienteId: null`; verify FK is `ON DELETE SET NULL`, not `CASCADE` |
| R3 | Frontend Zod schema and backend FluentValidation validator diverge on required fields, allowing invalid data through one layer | BUS | 2 | 2 | 4 | P1 | Contract test: same required-field set (Nombre, NIT, Teléfono, Ciudad) asserted at both API and UI layers |
| R4 | Search (client-side filter) exceeds 1s response/render target at 500 records (NFR1) | PERF | 2 | 2 | 4 | P1 | Component/perf test seeding 500 records, measuring filter-to-render time |
| R5 | SortControl state conflicts with active search filter — selecting a sort clears the search box or triggers an unwanted refetch | TECH | 2 | 2 | 4 | P1 | Component test: apply search, change sort, assert search input value unchanged and no new network call fired |
| R6 | Deep link to `/clientes/:clienteId` with a non-existent or malformed UUID crashes the view instead of a graceful not-found message | BUS | 2 | 2 | 4 | P1 | E2E test navigating directly to a random UUID; component test for the not-found branch |
| R7 | Mutation success (create/edit/delete) does not invalidate the `['clientes']` query key, so changes aren't visible within NFR2's 2s window | TECH | 2 | 2 | 4 | P1 | Integration test asserting `invalidateQueries(['clientes'])` fires in `onSuccess`; E2E timing assertion |
| R8 | Free-text fields (Nombre, Ciudad, Teléfono) are not sanitized/validated server-side, exposing an injection vector (NFR5) | SEC | 1 | 3 | 3 | P2 | API integration test with script/SQL-like payloads asserting safe storage/rendering (no execution, no raw error) |
| R9 | Delete confirmation dialog can be double-submitted or bypassed via rapid interaction, causing accidental irreversible data loss | BUS | 1 | 3 | 3 | P2 | E2E test: rapid double-click on "Confirmar"; assert only one DELETE request fires |
| R10 | Backend unavailable at initial list load does not surface `ErrorPanel` + "Reintentar", leaving a blank/broken screen | OPS | 1 | 2 | 2 | P2 | Component test mocking a failed fetch; assert ErrorPanel renders and retry re-triggers the query |
| R11 | Default sort ("Más reciente") not actually applied on first render because `createdAt` ordering isn't guaranteed by the list endpoint | TECH | 1 | 1 | 1 | P3 | Component test asserting initial render order matches `createdAt desc` with no explicit sort selection |

### Top 3 Risk Areas for Epic 2

1. **Cascade unassignment on delete (R2)** — the single highest-consequence risk: an incorrect FK cascade (`CASCADE` instead of `SET NULL`) silently destroys contact records with no recovery path, directly violating the epic's explicit acceptance criterion (Story 2.5, last scenario) and FR25.
2. **NIT uniqueness enforcement (R1)** — client uniqueness is a core business invariant; if only enforced client-side, concurrent users or direct API calls can create duplicate clients, corrupting the catalog referenced by NIT/RUC throughout the system.
3. **Validation/state consistency across layers (R3, R5, R7)** — this epic introduces the first read/write cycle with optimistic cache invalidation (FR27) and dual-layer validation (Zod + FluentValidation); divergence here produces confusing, hard-to-reproduce bugs later in Epics 3–4 which build on the same pattern.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌▌▌▌▌▌▌     8 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌  9 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌  9 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌▌▌         5 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                       31 tests
```

### Rationale

- **Epic 2 is the first domain-logic epic**, so the pyramid shifts toward API integration and component tests relative to Epic 1 — the business rules (uniqueness, cascade, validation) live in the backend command handlers and are cheapest/most reliable to verify with xUnit + `WebApplicationFactory`.
- **E2E is reserved for the critical user journeys** explicitly named in the epic ACs: create→appears in list, search, detail navigation via deep link, delete with cascade toast copy, and sort behavior — each a full-stack round trip that unit/API tests alone cannot verify (UI wiring, toast text, URL updates).
- **Component tests cover UI-only concerns** that don't need a real backend: form validation messages, SortControl logic (no refetch), EmptyState/ErrorPanel rendering, cache-invalidation wiring (mocked query client).
- **Avoid duplication**: NIT-uniqueness business logic is verified once at the API level (xUnit) and once end-to-end for the user-facing message (E2E) — not re-verified at the component level.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Is Marked Done

#### TC-E2-P0-01: Client List Renders with Nombre and NIT/RUC

**Level:** E2E (Playwright)
**Story:** 2.1
**Requirement:** AC-E2.1, Story 2.1 scenario 1

**Precondition:** At least one client exists in the system (seeded via API).

**Test Steps:**
1. Seed a client via `ApiHelper.createCliente()`.
2. Navigate to `/clientes`.

**Expected Result:**
- Left panel (280px) shows the client with Nombre and NIT/RUC visible.

**Automation:** Extends existing `clientes-crud.spec.ts`.

---

#### TC-E2-P0-02: Create Client With Valid Data Appears Immediately

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, FR27
**Risk covered:** R7

**Precondition:** `/clientes` view loaded.

**Test Steps:**
1. Click "Nuevo cliente", fill Nombre/NIT/Teléfono/Ciudad, click "Guardar".
2. Assert client appears in list without page reload.
3. Assert toast "Cliente creado correctamente" is shown.

**Expected Result:**
- Client visible in list within NFR2 (2s), success toast shown with exact Spanish copy.

**Automation:** Already exists (`FR4 — debe crear un nuevo cliente`); extend with toast assertion.

---

#### TC-E2-P0-03: Duplicate NIT/RUC Returns 409 With Safe User Message

**Level:** E2E (Playwright) + API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-E2.4 (implicit), Story 2.3 scenario 4
**Risk covered:** R1

**Precondition:** A client with NIT `X` already exists.

**Test Steps (E2E):**
1. Attempt to create a second client with the same NIT, different Nombre.
2. Submit the form.

**Test Steps (API):**
1. `POST /api/v1/clientes` with an existing `nit`.

**Expected Result:**
- HTTP 409 Conflict.
- Response body does NOT contain stack trace / internal exception details (NFR6).
- UI shows "El NIT/RUC ya está registrado" (no technical details).
- Form is NOT closed; user can correct and resubmit.

**Automation:** E2E exists (`FR7`); add xUnit `ClienteEndpointsTests.CreateCliente_DuplicateNit_Returns409`.

---

#### TC-E2-P0-04: Required-Field Validation Blocks Create Submission (Client + Server)

**Level:** E2E (Playwright) + API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-E2.4
**Risk covered:** R3

**Test Steps (E2E):**
1. Open "Nuevo cliente" form, submit with all fields empty.

**Test Steps (API):**
1. `POST /api/v1/clientes` with an empty/missing `nombre`.

**Expected Result:**
- UI: inline error messages on each empty required field; form NOT submitted to backend (no network call fires).
- API: 400 Bad Request with FluentValidation error details per field, no persistence occurs.

**Automation:** E2E exists (`FR8`); add xUnit `CreateClienteRequestValidatorTests` (unit, see TC-E2-P2-06) + `ClienteEndpointsTests.CreateCliente_MissingRequiredFields_Returns400`.

---

#### TC-E2-P0-05: Delete Client Cascades — Contacts Unassigned, Not Deleted

**Level:** E2E (Playwright) + API Integration (xUnit)
**Story:** 2.5
**Requirement:** Story 2.5, last scenario (cascade), FR25
**Risk covered:** R2 — highest severity risk in the epic

**Precondition:** A client exists with ≥2 associated contacts (`cliente_id` set).

**Test Steps (API):**
1. `DELETE /api/v1/clientes/{id}`.
2. `GET /api/v1/contactos` and inspect the previously associated contacts.

**Test Steps (E2E):**
1. Open client detail, click "Eliminar", confirm.
2. Assert toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
3. Query contacts (via API helper) and assert they still exist with `clienteId: null`.

**Expected Result:**
- Client record removed from `clientes` table.
- Associated contacts remain in `contactos` table with all data intact, `cliente_id = NULL`.
- Contacts appear under the "Sin cliente" filter (cross-checked functionally in Epic 3/4, referenced here for regression).
- Right panel returns to empty/default state; list no longer shows the deleted client.

**Automation:** New — xUnit `ClienteEndpointsTests.DeleteCliente_WithAssociatedContacts_UnassignsInsteadOfDeleting`; new Playwright spec `e2e/tests/clientes/clientes-delete.spec.ts`.

---

#### TC-E2-P0-06: Database-Level Unique Constraint Prevents Duplicate NIT Even Bypassing Frontend

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** Architecture — `uk_clientes_nit` unique index
**Risk covered:** R1

**Precondition:** Client with NIT `X` exists.

**Test Steps:**
1. Issue two concurrent (or sequential, bypassing UI) `POST /api/v1/clientes` requests with the same `nit` directly against the API.

**Expected Result:**
- Exactly one record persists; the second request receives 409, not a 500 or silent duplicate row.
- Confirms defense-in-depth: the invariant holds even if a future client (mobile app, script) skips the frontend Zod check.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + real/test Postgres instance, asserting on `uk_clientes_nit`.

---

### P1 — Must Pass Before Story Is Closed as Done

#### TC-E2-P1-01: Edit Client — Pre-Filled Form and Immediate Update

**Level:** E2E (Playwright)
**Story:** 2.4
**Requirement:** Story 2.4, scenarios 1–2, FR6, FR27

**Test Steps:**
1. Open a client's detail, click "Editar".
2. Assert form is pre-filled with current values.
3. Modify Ciudad, save.

**Expected Result:**
- Form pre-fills all four fields correctly.
- Detail panel and list reflect the change immediately (no reload).
- Toast "Cliente actualizado correctamente" shown.

**Automation:** New — `e2e/tests/clientes/clientes-edit.spec.ts`.

---

#### TC-E2-P1-02: Edit — Clearing a Required Field Blocks Save

**Level:** E2E (Playwright)
**Story:** 2.4
**Requirement:** Story 2.4, scenario 3
**Risk covered:** R3

**Test Steps:**
1. Open edit form for an existing client, clear "Nombre", submit.

**Expected Result:**
- Inline error shown; form NOT submitted; original data unchanged in backend.

**Automation:** New E2E test.

---

#### TC-E2-P1-03: Edit — Cancel Discards Changes

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** Story 2.4, scenario 4

**Test Steps:**
1. Render `ClienteForm` in edit mode with initial values.
2. Modify a field, click "Cancelar".
3. Re-render/query the underlying client data source (mocked).

**Expected Result:**
- No mutation call is fired; original client data is unchanged.
- Form closes without a toast.

**Automation:** New — Vitest + RTL + MSW mock verifying zero PUT calls.

---

#### TC-E2-P1-04: Search Filters by Name Within NFR1 at Scale

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** Story 2.1, scenario 2, NFR1
**Risk covered:** R4

**Precondition:** Mock `['clientes']` query cache seeded with 500 records.

**Test Steps:**
1. Render `ClienteListView` with 500-record fixture.
2. Type a search term matching a subset.
3. Measure time from keystroke to filtered render.

**Expected Result:**
- Filtered results render in <1s (target well under, since client-side filter should be ~tens of ms).
- Only matching Nombre/NIT records shown.

**Automation:** New — Vitest with `performance.now()` timing assertion; complements existing E2E search tests (FR2) which validate correctness but not the 500-record timing budget.

---

#### TC-E2-P1-05: Search Filters by NIT/RUC (Regression, Existing Coverage Retained)

**Level:** E2E (Playwright)
**Story:** 2.1
**Requirement:** Story 2.1, scenario 2

**Automation:** Already covered — `FR2 — debe filtrar clientes por NIT` in `clientes-crud.spec.ts`. Retained as-is.

---

#### TC-E2-P1-06: EmptyState Displayed When No Clients Exist (Regression Baseline)

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** Story 2.1, scenario 3

**Test Steps:**
1. Render `ClienteListView` with an empty `['clientes']` result.

**Expected Result:**
- `EmptyState` component renders with guidance text to create the first client.
- No console errors.

**Automation:** New — no existing test covers this scenario (existing E2E suite always seeds ≥1 client).

---

#### TC-E2-P1-07: Client Detail View — Click Navigation and URL Update

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** Story 2.2, scenario 1, FR30

**Test Steps:**
1. Seed a client, navigate to `/clientes`, click the client item.

**Expected Result:**
- Right panel shows Nombre, NIT/RUC, Teléfono, Ciudad.
- URL updates to `/clientes/:clienteId`.

**Automation:** New — `e2e/tests/clientes/clientes-detalle.spec.ts`.

---

#### TC-E2-P1-08: Direct URL Access to `/clientes/:clienteId` Loads Correct Client

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** Story 2.2, scenario 2, FR30

**Test Steps:**
1. Seed a client via API, obtain its ID.
2. Navigate directly to `http://localhost:5173/clientes/{id}` (no prior UI navigation).

**Expected Result:**
- Correct client details load and display without an intermediate redirect.

**Automation:** New E2E test.

---

#### TC-E2-P1-09: Non-Existent `clienteId` Shows Graceful Not-Found

**Level:** E2E (Playwright) + Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** Story 2.2, scenario 3
**Risk covered:** R6

**Test Steps (E2E):**
1. Navigate to `/clientes/{random-uuid-not-in-db}`.

**Test Steps (Component):**
1. Render `ClienteDetailView` with a query that resolves to 404/`undefined`.

**Expected Result:**
- A not-found message displays gracefully; no unhandled exception, no blank screen, no app crash.

**Automation:** New tests at both levels.

---

#### TC-E2-P1-10: Delete Confirmation — Cancel Preserves Record

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** Story 2.5, scenario 3

**Test Steps:**
1. Open client detail, click "Eliminar", then click "Cancelar" in the confirmation dialog.

**Expected Result:**
- Dialog closes; client record remains unchanged in list and backend.

**Automation:** New E2E test (part of `clientes-delete.spec.ts`).

---

#### TC-E2-P1-11: Sort Nombre A→Z / Z→A Without New API Call

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6, scenarios 1–2
**Risk covered:** R5

**Test Steps:**
1. Render `ClienteListView` with a mocked TanStack Query client and a network-call spy.
2. Select "Nombre A→Z" from `SortControl`.
3. Select "Nombre Z→A".

**Expected Result:**
- List reorders correctly in both directions.
- Zero additional network requests fire (client-side re-sort of cached data only).

**Automation:** New — Vitest + RTL, spy on `apiClient`/`queryClient.fetchQuery`.

---

#### TC-E2-P1-12: Sort Applied to Active Search Results Without Clearing Filter

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6, scenario 5
**Risk covered:** R5

**Test Steps:**
1. Apply a search filter.
2. Change sort order via `SortControl`.

**Expected Result:**
- Sort applies only to the filtered subset.
- Search input value is unchanged after the sort change.

**Automation:** New Vitest + RTL test.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Sort by Más Reciente / Más Antiguo (createdAt)

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6, scenarios 3–4

**Test Steps:**
1. Render list with fixture clients with distinct `createdAt` timestamps.
2. Select "Más reciente", then "Más antiguo".

**Expected Result:**
- Order matches `createdAt desc` and `createdAt asc` respectively.

**Automation:** New Vitest test.

---

#### TC-E2-P2-02: Default Sort on Initial Load Is "Más Reciente"

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6, scenario 6
**Risk covered:** R11

**Test Steps:**
1. Render `ClienteListView` fresh (no prior sort selection in local state).

**Expected Result:**
- Initial order is newest-first without user interaction.

**Automation:** New Vitest test.

---

#### TC-E2-P2-03: ErrorPanel With "Reintentar" Shown on Fetch Failure

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** Story 2.1, scenario 4
**Risk covered:** R10

**Test Steps:**
1. Mock the clientes fetch to reject/fail.
2. Render `ClienteListView`.
3. Click "Reintentar".

**Expected Result:**
- `ErrorPanel` renders instead of the list.
- Clicking "Reintentar" re-triggers the query (spy assertion).

**Automation:** New Vitest + MSW test.

---

#### TC-E2-P2-04: Delete — Rapid Double-Confirm Does Not Fire Duplicate Deletes

**Level:** E2E (Playwright)
**Story:** 2.5
**Risk covered:** R9

**Test Steps:**
1. Open delete confirmation dialog.
2. Rapidly double-click "Confirmar".

**Expected Result:**
- Exactly one `DELETE` request is sent (network spy); no duplicate-key or 404-on-second-call error surfaces to the user.

**Automation:** New Playwright test using `page.route` request counting.

---

#### TC-E2-P2-05: Free-Text Fields Reject/Neutralize Injection-Style Payloads

**Level:** API Integration (xUnit)
**Story:** 2.3 / 2.4
**Requirement:** NFR5
**Risk covered:** R8

**Test Steps:**
1. `POST /api/v1/clientes` with `nombre` containing a script tag / SQL-meta payload (e.g. `"<script>alert(1)</script>"`, `"'; DROP TABLE clientes;--"`).

**Expected Result:**
- Request either is rejected by validation or stored as inert text (parameterized queries via EF Core prevent injection by design).
- No 500 error, no stack trace, no unexpected data loss (table still exists, other records intact).

**Automation:** New xUnit `ClienteEndpointsTests.CreateCliente_MaliciousInput_HandledSafely`.

---

#### TC-E2-P2-06: FluentValidation Unit Tests for Create/Update Cliente Validators

**Level:** Unit (xUnit)
**Story:** 2.3 / 2.4
**Requirement:** AC-E2.4

**Test Steps:**
1. Unit test `CreateClienteRequestValidator` and `UpdateClienteRequestValidator` against empty/whitespace/valid inputs for each of the four required fields.

**Expected Result:**
- Validators fail for empty/whitespace Nombre, NIT, Teléfono, Ciudad; pass for valid input.

**Automation:** New xUnit unit tests (fast, no HTTP/DB dependency).

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: Frontend Hook Unit Tests (useClientes / useCliente / mutations)

**Level:** Unit (Vitest)
**Story:** 2.1–2.5

**Test Steps:**
1. Unit test `useClientes.ts`, `useCliente.ts`, `useCreateCliente.ts`, `useUpdateCliente.ts`, `useDeleteCliente.ts` in isolation with a mocked `IClienteRepository`.

**Expected Result:**
- Each hook calls the correct repository method and query key; mutations call `invalidateQueries(['clientes'])` on success.

**Automation:** Co-located `*.test.ts` files per architecture convention (`useClientes.test.ts` alongside `useClientes.ts`).

---

#### TC-E2-P3-02: Backend Command Handler Unit Tests

**Level:** Unit (xUnit)
**Story:** 2.3–2.5

**Test Steps:**
1. Unit test `CreateClienteCommandHandler`, `UpdateClienteCommandHandler`, `DeleteClienteCommandHandler` against a mocked `IClienteRepository`.

**Expected Result:**
- Handlers call the repository correctly, map DTOs correctly, and propagate domain exceptions (e.g., duplicate NIT) without leaking persistence details.

**Automation:** New xUnit unit tests, mocked repository (no real DB).

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client (Nombre/NIT/Teléfono/Ciudad required) appears immediately | 2.3 | TC-E2-P0-02, TC-E2-P0-04 | Planned |
| AC-E2.2: Search by name or NIT/RUC, results <1s | 2.1 | TC-E2-P1-04, TC-E2-P1-05 | Planned |
| AC-E2.3: View full detail, edit any field, save | 2.2, 2.4 | TC-E2-P1-01, TC-E2-P1-07, TC-E2-P1-08 | Planned |
| AC-E2.4: Block save with empty required fields, clear errors | 2.3, 2.4 | TC-E2-P0-04, TC-E2-P1-02 | Planned |
| AC-E2.5: Delete client, disappears from list | 2.5 | TC-E2-P0-05, TC-E2-P1-10 | Planned |
| AC-E2.6: Sort list (4 modes) without reload, filter preserved | 2.6 | TC-E2-P1-11, TC-E2-P1-12, TC-E2-P2-01, TC-E2-P2-02 | Planned |
| Story 2.1 — EmptyState / ErrorPanel branches | 2.1 | TC-E2-P1-06, TC-E2-P2-03 | Planned |
| Story 2.2 — Not-found on invalid `clienteId` | 2.2 | TC-E2-P1-09 | Planned |
| Story 2.3 — Duplicate NIT 409 handling | 2.3 | TC-E2-P0-03, TC-E2-P0-06 | Planned |
| Story 2.4 — Cancel discards changes | 2.4 | TC-E2-P1-03 | Planned |
| Story 2.5 — Cascade unassignment of contacts on delete | 2.5 | TC-E2-P0-05 | Planned |
| NFR5 — Input sanitization | 2.3, 2.4 | TC-E2-P2-05 | Planned |
| NFR6 — No stack trace exposure | 2.3 | TC-E2-P0-03 | Planned |

**Status legend:** *Planned* — test case designed here, to be generated via `*atdd` (P0) and `*automate` (remaining) once story implementation begins. No status is marked "Covered" yet since this design runs before Epic 2 implementation.

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search <1s @ 500 records | TC-E2-P1-04 | Component (timed) |
| NFR2 | CRUD reflects in UI <2s | TC-E2-P0-02, TC-E2-P1-01, TC-E2-P0-05 (implicit timing), R7 mitigation | E2E |
| NFR3 | Responsive with 10 concurrent users | Not directly tested in this epic (deferred to `*nfr` workflow / load test if needed) | N/A this epic |
| NFR5 | Input validation/sanitization | TC-E2-P2-05, TC-E2-P2-06 | API / Unit |
| NFR6 | No stack traces exposed | TC-E2-P0-03 | E2E + API |
| NFR10/11 | Scale to 500 clients, extensible model | TC-E2-P1-04 (dataset size); schema review (no hardcoded limits) — manual architecture check | Component / Review |

---

## 7. Test Execution Order

```
Phase 1 — Backend Domain Gate (P0, no UI needed)
  1. TC-E2-P0-06  DB unique constraint on NIT
  2. TC-E2-P0-03  Duplicate NIT → 409 (API half)
  3. TC-E2-P0-04  Required-field validation (API half)
  4. TC-E2-P0-05  Cascade unassignment on delete (API half)

Phase 2 — Core E2E Journeys (P0)
  5. TC-E2-P0-01  List renders
  6. TC-E2-P0-02  Create client → appears immediately
  7. TC-E2-P0-03  Duplicate NIT → 409 (E2E half)
  8. TC-E2-P0-04  Required-field validation (E2E half)
  9. TC-E2-P0-05  Delete cascade (E2E half)

Phase 3 — Detail, Edit, Delete Flows (P1)
 10. TC-E2-P1-07  Detail view navigation
 11. TC-E2-P1-08  Deep link direct access
 12. TC-E2-P1-09  Not-found handling
 13. TC-E2-P1-01  Edit pre-fill + update
 14. TC-E2-P1-02  Edit required-field validation
 15. TC-E2-P1-03  Edit cancel discards changes
 16. TC-E2-P1-10  Delete cancel preserves record

Phase 4 — Search & Sort (P1)
 17. TC-E2-P1-04  Search performance @ 500 records
 18. TC-E2-P1-05  Search by NIT (regression)
 19. TC-E2-P1-06  EmptyState
 20. TC-E2-P1-11  Sort by name, no API call
 21. TC-E2-P1-12  Sort + search combined

Phase 5 — Edge Cases & Hardening (P2)
 22. TC-E2-P2-01  Sort by date
 23. TC-E2-P2-02  Default sort order
 24. TC-E2-P2-03  ErrorPanel + retry
 25. TC-E2-P2-04  Double-confirm delete
 26. TC-E2-P2-05  Injection-safe inputs
 27. TC-E2-P2-06  Validator unit tests

Phase 6 — Unit Suites (P3)
 28. TC-E2-P3-01  Frontend hook unit tests
 29. TC-E2-P3-02  Backend handler unit tests
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Playwright | E2E tests (CRUD journeys, deep linking, delete cascade) | `e2e/` |
| `ApiHelper` / `ClientesPage` | Existing E2E page object + API setup/teardown helpers | `e2e/pages`, `e2e/helpers` |
| Vitest + `@testing-library/react` | Component tests (form validation, SortControl, EmptyState, ErrorPanel) | Frontend |
| MSW | Mock `/api/v1/clientes` responses for component tests (error, empty, 500-record fixtures) | Frontend |
| xUnit + `WebApplicationFactory<Program>` | API integration tests (uniqueness, cascade, validation, security) | Backend |
| xUnit (isolated) | Unit tests for validators and command handlers | Backend |

### New Test Data Needs

- **500-record client fixture** for NFR1 performance testing (`buildCliente()` factory extended with a bulk-seed helper, e.g. `seedClientes(count: 500)` via direct API calls or DB seeding script).
- **Client-with-contacts fixture**: a client plus ≥2 contacts pre-associated, for cascade-delete verification (extends `buildContacto({ clienteId })`).
- Extend `ClientesPage` page object with locators for: edit button (`btnEditar`), `SortControl` (`getByTestId('sort-control')`), and detail-panel field locators (currently only list/form locators exist).

### Environment Prerequisites

```
- Backend Clientes vertical slice implemented (Domain/Application/Infrastructure/API layers) — does not exist yet at design time
- PostgreSQL running with `clientes` table + `uk_clientes_nit` unique index + `contactos.cliente_id` FK as ON DELETE SET NULL
- Frontend clientes module scaffolded per architecture.md folder structure
- All npm/NuGet dependencies installed
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|--------------|-------|
| P0 | 6 | 2.0 | 12.0 | Cascade delete and NIT uniqueness require careful DB-level assertions |
| P1 | 12 | 1.0 | 12.0 | Standard CRUD + navigation + sort coverage |
| P2 | 6 | 0.5 | 3.0 | Edge cases, security payloads, validator units |
| P3 | 2 | 0.25 | 0.5 | Hook/handler unit test suites |
| **Total** | **26** | — | **27.5 hours** | **~3.4 days** |

*(Note: 26 distinct new/extended test cases across 31 total test executions when counting the dual-level P0 cases as one design unit each; effort above counts unique test-case designs, not raw assertion count.)*

### Prerequisites

**Test Data:**
- `buildCliente()` factory (already exists) — extend with bulk-seed variant for NFR1 tests
- `buildContacto({ clienteId })` (already exists) — reuse for cascade-delete fixture
- No new external services or mocks beyond MSW (frontend) and `WebApplicationFactory` (backend)

**Tooling:**
- Playwright — already configured (`playwright.config.ts`)
- Vitest + RTL + MSW — already configured (`frontend/vitest.config.ts`)
- xUnit + `WebApplicationFactory<Program>` — already configured (`backend/tests/SiesaAgents.IntegrationTests`)

**Environment:**
- PostgreSQL with the `clientes`/`contactos` schema from Epic 1 extended per architecture.md's data model (Story 1.3 delivered the DB foundation; Epic 2 stories add the domain tables/migrations)

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions) — 6 test cases (TC-E2-P0-01 through -06)
- **P1 pass rate**: ≥95% — 12 test cases
- **P2/P3 pass rate**: ≥90% (informational, may be deferred with justification)
- **High-risk mitigations** (R1, R2 — score 6): 100% complete before Epic 2 closure

### Coverage Targets

- **Critical paths** (create, edit, delete, cascade unassignment): 100%
- **Security scenarios** (NFR5, NFR6): 100%
- **Data integrity** (NIT uniqueness, contact unassignment): 100%
- **Sort/search UX**: ≥80% of AC covered by automated tests

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-06)
- [ ] No high-risk items (R1, R2) unmitigated at epic close
- [ ] Cascade delete verified at API level with a real DB (not mocked repository) — mocking this risk away would defeat its purpose
- [ ] Duplicate-NIT 409 verified with a safe (non-leaking) error body
- [ ] Toast copy strings match exactly what E2E assertions expect (Spanish, case-sensitive)

---

## 9. Mitigation Plans

### R1: Duplicate NIT/RUC Not Rejected Consistently (Score: 6)

**Mitigation Strategy:** Enforce uniqueness at three layers: (1) Postgres unique index `uk_clientes_nit`, (2) `CreateClienteCommandHandler` catches the resulting `DbUpdateException` and translates it to a domain-specific conflict exception, (3) API endpoint maps that exception to HTTP 409 with a generic message (no SQL error text).
**Owner:** Backend dev (story 2.3 implementer)
**Timeline:** Before story 2.3 is marked done
**Status:** Planned
**Verification:** TC-E2-P0-03, TC-E2-P0-06

### R2: Cascade Hard-Deletes Contacts Instead of Unassigning (Score: 6)

**Mitigation Strategy:** Confirm EF Core FK configuration for `contactos.cliente_id` uses `OnDelete(DeleteBehavior.SetNull)`, not `Cascade` or `Restrict`, in `ContactoConfiguration.cs`. Add an explicit migration-level assertion test.
**Owner:** Backend dev (story 2.5 implementer)
**Timeline:** Before story 2.5 is marked done
**Status:** Planned
**Verification:** TC-E2-P0-05

---

## 10. Assumptions and Dependencies

### Assumptions

1. Backend `Clientes` vertical slice (entity, repository, handlers, endpoints, validators) does not exist yet at the time of this design — all API-level test cases assume implementation occurs per `architecture.md`'s documented structure.
2. Toast copy strings are taken verbatim from the epic/story acceptance criteria and must not be altered during implementation without updating the corresponding E2E assertions.
3. The `nit` unique index and the `cliente_id` `ON DELETE SET NULL` FK behavior are assumed to be implemented exactly as specified in `architecture.md` (lines documenting the `clientes`/`contactos` schema).
4. No authentication exists in the MVP, so all test scenarios assume unauthenticated access to all endpoints.

### Dependencies

1. Story 1.3 (Backend Database Foundation) must be complete — provides EF Core/PostgreSQL wiring this epic's migrations extend.
2. Existing `e2e/tests/clientes/clientes-crud.spec.ts`, `e2e/pages/clientes.page.ts`, `e2e/helpers/{api,data}.helper.ts` must be extended, not duplicated, to avoid redundant coverage — required before story 2.4/2.5/2.6 close.

### Risks to Plan

- **Risk**: `ClientesPage` page object lacks locators for edit button, `SortControl`, and detail-panel fields.
  - **Impact**: New E2E tests (P1 detail/edit/sort tests) cannot be authored until the page object is extended.
  - **Contingency**: Extend `ClientesPage` as part of story 2.2/2.4/2.6 implementation (or immediately before `*atdd`/`*automate` runs for those stories).

---

## Follow-on Workflows (Manual)

- Run `*atdd` per story to generate failing P0 tests before implementation begins (TC-E2-P0-01 through -06).
- Run `*automate` after each story's implementation to generate P1–P3 coverage from this design.
- Run `*trace` after all 6 stories are implemented to validate full AC-to-test coverage and issue the epic gate decision.

---

**Generated by**: BMad TEA Agent — Test Architect Module (`sa-tea-test-design` sub-agent)
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
