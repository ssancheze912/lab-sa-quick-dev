---
epic: 2
title: "Client Management"
phase: 4
mode: epic-level
date: 2026-05-20
stories:
  - "2.1: Client List & Search"
  - "2.2: Client Detail View"
  - "2.3: Create Client"
  - "2.4: Edit Client"
  - "2.5: Delete Client"
  - "2.6: Sort Client List"
frs_covered: [FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8]
nfrs_relevant: [NFR1, NFR2, NFR5, NFR6]
status: complete
---

# Test Design — Epic 2: Client Management

## 1. Epic Overview

Epic 2 delivers the complete CRUD lifecycle for client records in Siesa Agents CRM, along with real-time search and client-side sorting.

| Story | Scope |
|---|---|
| 2.1 | Left panel (280px) listing all clients; real-time search by Nombre/NIT; EmptyState; ErrorPanel |
| 2.2 | Right panel detail view; URL deep linking `/clientes/:id`; not-found handling |
| 2.3 | "Nuevo cliente" dialog form; POST `/api/v1/clientes`; toast success; duplicate NIT 409 handling |
| 2.4 | "Editar" pre-filled form; PUT `/api/v1/clientes/:id`; cancel preserves data |
| 2.5 | "Eliminar" confirmation dialog; DELETE `/api/v1/clientes/:id`; contacts unassigned on cascade |
| 2.6 | SortControl component; 4 sort options (nombre-asc, nombre-desc, fecha-desc, fecha-asc); client-side sort; preserves active search filter |

**Epic-Level Acceptance Criteria:**

| AC | Description |
|---|---|
| AC-E2.1 | User can register a new client (Nombre, NIT/RUC, Teléfono, Ciudad) and it appears in the list immediately |
| AC-E2.2 | User can search clients by name or NIT/RUC and see results in under 1 second |
| AC-E2.3 | User can view full client detail, edit any field and save changes |
| AC-E2.4 | System prevents saving a client with empty required fields, showing clear error messages |
| AC-E2.5 | User can delete a client and it disappears from the list |
| AC-E2.6 | User can sort the client list without reloading the page or losing the active search filter |

**FRs Covered:** FR1 (create), FR2 (list), FR3 (search by name), FR4 (search by NIT), FR5 (view detail), FR6 (edit), FR7 (delete), FR8 (required field validation)

**NFRs Applicable:**
- NFR1: Search results in < 1s with up to 500 records
- NFR2: CRUD changes reflected in UI in < 2s
- NFR5: Input validation and sanitization (FluentValidation + Zod)
- NFR6: No stack traces or internal errors exposed to user

---

## 2. Risk Assessment

### Risk Matrix

| ID | Risk | Probability | Impact | Priority | Mitigation |
|---|---|---|---|---|---|
| R1 | Real-time search debounce not implemented or firing on every keystroke — causes N API calls instead of client-side filter | High | High | P0 | E2E test that types multiple characters and verifies only the initial load request is made; assert no new network calls during typing |
| R2 | NIT uniqueness constraint violation (409) not surfaced to user — form closes silently or shows generic error | High | High | P0 | API-level test for 409 response; E2E test verifying Spanish message "El NIT/RUC ya está registrado" appears inline |
| R3 | Delete with associated contacts — `cliente_id` not set to NULL on cascade; contacts orphaned or deleted | High | High | P0 | API integration test: create client + contacts, delete client, assert contacts still exist with `clienteId = null` |
| R4 | TanStack Query cache not invalidated after mutation — list does not update without reload (FR27 violated) | High | High | P0 | E2E tests: assert new/edited/deleted client appears/disappears in list immediately without page reload |
| R5 | Sort combined with search filter — changing SortControl clears `searchInput` value or re-fetches from API | Medium | High | P1 | E2E test: type search term → apply sort → assert search input retains value and list shows only matching + sorted items |
| R6 | Deep link `/clientes/:id` with non-existent ID — unhandled 404 throws uncaught exception instead of graceful not-found | Medium | High | P1 | E2E test: navigate directly to `/clientes/00000000-0000-0000-0000-000000000000`; assert not-found UI renders |
| R7 | Cancel on Edit form — `PUT` request fires even when user clicks "Cancelar" | Medium | High | P1 | E2E test: open edit form, modify field, click cancel, assert no PUT network request fired |
| R8 | Required field validation runs only on backend — empty fields submitted causing unnecessary round trip | Medium | Medium | P1 | E2E test: submit form empty, assert no API call made; inline error messages visible |
| R9 | EmptyState not shown when client list is genuinely empty — list panel shows blank area | Medium | Medium | P2 | E2E test: ensure no pre-existing clients, navigate to `/clientes`, assert EmptyState component visible |
| R10 | SortControl default order not "Más reciente" on initial load — new clients appear at bottom of list | Low | Medium | P2 | E2E test: create two clients in sequence, verify newest appears first on fresh page load |
| R11 | ErrorPanel with "Reintentar" button not rendered when API call fails — no user feedback on network error | Low | High | P2 | E2E test with API route interception: mock 500, navigate to `/clientes`, assert ErrorPanel + Reintentar button visible |
| R12 | URL not updated when clicking a client item — deep linking (FR30) broken for /clientes/:id | Low | Medium | P2 | E2E test: click client item, assert URL changes to `/clientes/{uuid}` |

**Top 3 Critical Risk Areas:**

1. **Data mutation + cache invalidation (R1, R4)** — If TanStack Query cache is not invalidated after create/edit/delete, the list will not reflect changes without a reload, violating FR27. This is the most widespread structural risk affecting Stories 2.3, 2.4, and 2.5.
2. **NIT uniqueness and 409 error handling (R2)** — A silent failure on duplicate NIT degrades data quality and user trust. Both frontend Zod validation and backend FluentValidation are in play; the 409 contract between API and UI is a critical boundary.
3. **Delete cascade and contact integrity (R3)** — Story 2.5 defines explicit behavior when deleting a client that has associated contacts (`clienteId = null`, contacts remain). If the DB cascade is misconfigured (e.g., ON DELETE CASCADE instead of ON DELETE SET NULL), production data loss will occur.

---

## 3. Test Strategy by Level

### Level Distribution

| Level | Tool | Volume | Focus |
|---|---|---|---|
| E2E (UI) | Playwright (chromium) | 28 tests | Full user journeys, form interactions, list behaviors, URL routing |
| API / Integration | Playwright APIRequestContext | 10 tests | REST contract validation, 409/404/500 error responses, cascade behavior |
| Component / Unit | Vitest + RTL (frontend) | 8 tests | SortControl logic, search filter function, form validation schema |
| Backend Unit | xUnit | 6 tests | ClienteValidator (FluentValidation), ClienteService command handlers |

**Total: 52 test cases**

### Playwright Projects Applicable

| Project | Rationale |
|---|---|
| chromium (Desktop Chrome) | Primary — all E2E tests |
| firefox | Secondary coverage for form interactions and sort |
| mobile-chrome (Pixel 5) | Responsive layout: split panel collapses correctly on mobile |

### Key Testing Principles for Epic 2

- All API setup/teardown uses `ApiHelper` (`e2e/helpers/api.helper.ts`) — no UI to create test data.
- All test data built with `buildCliente()` from `data.helper.ts` — no hardcoded NITs.
- Each test cleans up its own created records in `afterEach` via `apiHelper.deleteCliente(id)`.
- All text assertions use Spanish patterns matching the UI (`/guardar/i`, `/cancelar/i`, `/eliminar/i`, `/nuevo cliente/i`).
- Network interception via `page.route()` for error scenarios — no test infrastructure changes needed.
- The `ClientesPage` POM (`e2e/pages/clientes.page.ts`) already exists and covers all required locators. Extend it only for SortControl.

---

## 4. Test Cases

### 4.1 E2E Tests (Playwright)

#### File: `e2e/tests/clientes/clientes-list.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-C-01 | P0 | 2.1 | AC-E2.2 | List panel renders all clients returned by API on page load |
| E2E-C-02 | P0 | 2.1 | AC-E2.2 | Typing in search input filters list to matching clients (by Nombre) in real time without new API calls |
| E2E-C-03 | P0 | 2.1 | AC-E2.2 | Typing NIT in search input filters list to matching clients (by NIT/RUC) |
| E2E-C-04 | P1 | 2.1 | — | Clearing search input after filtering restores full client list |
| E2E-C-05 | P2 | 2.1 | — | EmptyState component is visible when no clients exist in the system |
| E2E-C-06 | P2 | 2.1 | — | ErrorPanel with "Reintentar" button is shown when API returns 500 on load |

**Implementation notes:**
- E2E-C-02: Use `page.route('**/api/v1/clientes', ...)` to assert only 1 GET call is made on page load; subsequent filter is client-side. Type multiple characters, assert no additional network requests.
- E2E-C-05: Requires isolation — either clear all clients via `apiHelper` in `beforeEach` or use a separate browser context with mocked empty response.
- E2E-C-06: Use `page.route('**/api/v1/clientes', route => route.fulfill({ status: 500 }))` before navigation.

---

#### File: `e2e/tests/clientes/clientes-detail.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-C-07 | P0 | 2.2 | AC-E2.3 | Clicking a client in the list shows full detail (Nombre, NIT, Teléfono, Ciudad) in right panel |
| E2E-C-08 | P1 | 2.2 | — | URL updates to `/clientes/:clienteId` after clicking a client item (FR30) |
| E2E-C-09 | P1 | 2.2 | — | Direct navigation to `/clientes/:clienteId` loads correct client detail without prior list interaction |
| E2E-C-10 | P1 | 2.2 | — | Direct navigation to `/clientes/00000000-0000-0000-0000-000000000000` shows not-found message gracefully |

**Implementation notes:**
- E2E-C-08: After `clientesPage.seleccionarCliente(nombre)`, assert `page.url()` matches `/clientes/{uuid}` pattern.
- E2E-C-09: Use `page.goto('/clientes/' + cliente.id)` directly. Assert detail panel content without clicking list item.
- E2E-C-10: Assert the not-found component is visible and no unhandled JS error is thrown (listen for `page.on('pageerror', ...)`).

---

#### File: `e2e/tests/clientes/clientes-create.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-C-11 | P0 | 2.3 | AC-E2.1 | Clicking "Nuevo cliente" opens the form dialog with all 4 required fields visible |
| E2E-C-12 | P0 | 2.3 | AC-E2.1 | Submitting all required fields creates client and it appears in list immediately (no reload) |
| E2E-C-13 | P0 | 2.3 | AC-E2.4 | Submitting empty form shows inline error messages and does NOT call POST API |
| E2E-C-14 | P0 | 2.3 | AC-E2.4 | Submitting partially empty form shows error only on empty required fields |
| E2E-C-15 | P0 | 2.3 | — | Backend 409 (duplicate NIT) surfaces message "El NIT/RUC ya está registrado" in form |
| E2E-C-16 | P1 | 2.3 | AC-E2.1 | Success toast "Cliente creado correctamente" appears after successful create |
| E2E-C-17 | P1 | 2.3 | — | Form closes automatically after successful create |

**Implementation notes:**
- E2E-C-12: After `clientesPage.guardar()`, assert `clientesPage.form` is hidden and the new client's Nombre is visible in `clientesPage.clienteItems`. Monitor: no `page.reload()` call — this is an optimistic update via TanStack Query `invalidateQueries`.
- E2E-C-13: Before clicking guardar with empty form, set up a request listener: `page.on('request', r => if r.url includes '/clientes' and r.method === 'POST' → fail test)`.
- E2E-C-15: Pre-create client via `apiHelper.createCliente(data)`. Open form, fill same NIT with different Nombre, click guardar. Assert form remains visible with the 409 error message.
- E2E-C-16: Assert toast element with matching text using `page.getByRole('status')` or `page.getByText(/cliente creado correctamente/i)`.

---

#### File: `e2e/tests/clientes/clientes-edit.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-C-18 | P0 | 2.4 | AC-E2.3 | Clicking "Editar" on a client opens pre-filled form with current field values |
| E2E-C-19 | P0 | 2.4 | AC-E2.3 | Modifying a field and saving updates detail panel and list immediately (no reload) |
| E2E-C-20 | P0 | 2.4 | AC-E2.4 | Clearing a required field and saving shows inline error; no PUT API call fired |
| E2E-C-21 | P1 | 2.4 | — | Success toast "Cliente actualizado correctamente" appears after successful edit |
| E2E-C-22 | P1 | 2.4 | — | Clicking "Cancelar" closes form without making PUT request; original data unchanged |

**Implementation notes:**
- E2E-C-18: After clicking Editar, assert `clientesPage.inputNombre.inputValue()` equals the client's nombre.
- E2E-C-19: Modify nombre to a unique value. After save, assert new value visible in both list item and detail panel.
- E2E-C-20: Clear `inputNombre`, click guardar. Assert form visible, error message visible. Use request interceptor to assert no PUT call was made.
- E2E-C-22: Use `page.route` to intercept PUT and fail the test if called; open edit, modify field, click Cancelar. Assert original nombre still displayed.

---

#### File: `e2e/tests/clientes/clientes-delete.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-C-23 | P0 | 2.5 | AC-E2.5 | Clicking "Eliminar" shows confirmation dialog with "Confirmar" and "Cancelar" |
| E2E-C-24 | P0 | 2.5 | AC-E2.5 | Confirming deletion removes client from list immediately and shows empty/default right panel |
| E2E-C-25 | P0 | 2.5 | AC-E2.5 | Success toast "Cliente eliminado correctamente" appears after deletion (no associated contacts) |
| E2E-C-26 | P1 | 2.5 | — | Clicking "Cancelar" in confirmation dialog leaves client in list unchanged |
| E2E-C-27 | P1 | 2.5 | — | Deleting client with associated contacts: toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." |

**Implementation notes:**
- E2E-C-24: After confirmar, assert the deleted client's nombre is no longer in `clientesPage.clienteItems`, and assert `clientesPage.emptyState` or default state is visible in right panel.
- E2E-C-26: Use request interceptor to assert no DELETE call; click Cancelar; assert client still in list.
- E2E-C-27: Use `apiHelper.createCliente` + `apiHelper.createContacto({ clienteId: cliente.id })`. Select the client, click Eliminar, confirm. Assert specific toast text.

---

#### File: `e2e/tests/clientes/clientes-sort.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-C-28 | P0 | 2.6 | AC-E2.6 | Selecting "Nombre A→Z" reorders list alphabetically ascending without new API call |
| E2E-C-29 | P0 | 2.6 | AC-E2.6 | Selecting "Nombre Z→A" reorders list alphabetically descending without new API call |
| E2E-C-30 | P1 | 2.6 | AC-E2.6 | Selecting "Más reciente" orders by creation date descending (newest first) |
| E2E-C-31 | P1 | 2.6 | AC-E2.6 | Selecting "Más antiguo" orders by creation date ascending (oldest first) |
| E2E-C-32 | P0 | 2.6 | AC-E2.6 | Changing sort with active search filter: search input value is preserved, sort applies only to filtered set |
| E2E-C-33 | P2 | 2.6 | — | Default sort on initial page load is "Más reciente" (newest client appears first) |

**Implementation notes:**
- E2E-C-28/E2E-C-29: Create at least 3 clients with known names (e.g., "Zebra Corp", "Alfa SAS", "Medio Ltda"). After sort, assert `clienteItems.nth(0)` contains the expected name using `toHaveText`.
- E2E-C-28/E2E-C-29: Monitor network requests — assert no `GET /api/v1/clientes` fires after SortControl interaction.
- E2E-C-30/E2E-C-31: Create clients with known `createdAt` ordering (sequential API creates). After sort, assert relative order by checking the first and last visible item.
- E2E-C-32: Type a search term that matches 2 of 3 test clients. Change sort. Assert `clientesPage.searchInput.inputValue()` still equals the search term. Assert filtered+sorted count matches.
- SortControl locator to add to `ClientesPage`: `this.sortControl = page.getByTestId('sort-control')` + `this.sortOption = (value: string) => page.getByRole('option', { name: new RegExp(value, 'i') })`.

---

### 4.2 API / Integration Tests

#### File: `e2e/tests/clientes/clientes-api.spec.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| API-C-01 | P0 | 2.3 | POST `/api/v1/clientes` with valid payload returns 201 and body with `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` |
| API-C-02 | P0 | 2.3 | POST `/api/v1/clientes` with duplicate NIT returns 409 and Problem Details body with no stack trace |
| API-C-03 | P0 | 2.3 | POST `/api/v1/clientes` with missing required field (`nombre`) returns 400 and Problem Details body |
| API-C-04 | P0 | 2.4 | PUT `/api/v1/clientes/:id` with valid changes returns 200 and updated fields in body |
| API-C-05 | P0 | 2.5 | DELETE `/api/v1/clientes/:id` returns 204 and subsequent GET `/api/v1/clientes/:id` returns 404 |
| API-C-06 | P0 | 2.5 | DELETE `/api/v1/clientes/:id` (with associated contacts): contacts still exist via GET `/api/v1/contactos/:id`; `clienteId` field is `null` |
| API-C-07 | P1 | 2.1 | GET `/api/v1/clientes` returns array of clients; each item has `id`, `nombre`, `nit` fields |
| API-C-08 | P1 | 2.2 | GET `/api/v1/clientes/:id` with valid ID returns 200 and full client object |
| API-C-09 | P1 | 2.2 | GET `/api/v1/clientes/:id` with non-existent ID returns 404 and Problem Details (no stack trace) |
| API-C-10 | P1 | 2.4 | PUT `/api/v1/clientes/:id` with missing required field returns 400 Problem Details |

**Implementation notes:**
- All API tests use `request` fixture from Playwright — no browser UI involved.
- API-C-02: Assert `response.status() === 409`; parse JSON body and assert no `stackTrace` key present (NFR6).
- API-C-06: Setup — create client, create 2 contacts with `clienteId = cliente.id`; delete client; GET each contact; assert `clienteId === null`. This is the critical cascade test for R3.
- API-C-01: Assert `id` matches UUID v4 pattern (`/^[0-9a-f]{8}-/i`); assert `createdAt` is ISO 8601 with timezone offset (DateTimeOffset — not plain DateTime).

---

### 4.3 Component / Unit Tests (Frontend — Vitest)

#### File: `frontend/src/shared/components/__tests__/SortControl.test.tsx`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-C-01 | P1 | 2.6 | SortControl renders 4 options: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo" |
| UNIT-C-02 | P1 | 2.6 | SortControl fires `onChange` callback with correct sort option identifier when an option is selected |
| UNIT-C-03 | P1 | 2.6 | SortControl shows "Más reciente" selected by default when no `value` prop is passed |
| UNIT-C-04 | P2 | 2.6 | SortControl controlled: changing `value` prop updates the displayed selection |

#### File: `frontend/src/modules/crm/clientes/__tests__/sortClientes.test.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-C-05 | P1 | 2.6 | `sortClientes('nombre-asc')` returns clients alphabetically ascending by nombre |
| UNIT-C-06 | P1 | 2.6 | `sortClientes('nombre-desc')` returns clients alphabetically descending by nombre |
| UNIT-C-07 | P1 | 2.6 | `sortClientes('fecha-desc')` returns clients newest first (by createdAt) |
| UNIT-C-08 | P1 | 2.6 | `sortClientes('fecha-asc')` returns clients oldest first (by createdAt) |

---

### 4.4 Backend Unit Tests (xUnit)

#### File: `backend/tests/SiesaAgents.UnitTests/Validators/ClienteValidatorTests.cs`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-B-01 | P1 | 2.3/2.4 | `CreateClienteCommand` validator: empty Nombre fails with error message |
| UNIT-B-02 | P1 | 2.3/2.4 | `CreateClienteCommand` validator: empty NIT fails with error message |
| UNIT-B-03 | P1 | 2.3/2.4 | `CreateClienteCommand` validator: valid payload passes validation |

#### File: `backend/tests/SiesaAgents.UnitTests/Handlers/ClienteHandlerTests.cs`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-B-04 | P1 | 2.3 | `CreateClienteHandler` returns created `ClienteDto` with UUID id on success |
| UNIT-B-05 | P1 | 2.3 | `CreateClienteHandler` throws `ConflictException` when NIT already exists in repository |
| UNIT-B-06 | P1 | 2.5 | `DeleteClienteHandler` does not throw when deleting client with 0 contacts |

---

## 5. Test Execution Order & Priority

### P0 — Blocking (gate for beginning story implementation)

1. API-C-01 — POST create returns 201 with valid contract
2. API-C-02 — Duplicate NIT returns 409 Problem Details (no stack trace)
3. API-C-05 — DELETE returns 204; subsequent GET returns 404
4. API-C-06 — DELETE with contacts: contacts retain `clienteId = null`
5. API-C-03 — Missing required field returns 400
6. E2E-C-01 — List renders on page load
7. E2E-C-02 — Real-time search by Nombre (client-side, no extra API calls)
8. E2E-C-11 — Form opens with 4 fields
9. E2E-C-12 — Create client appears in list immediately
10. E2E-C-13 — Empty form: error messages shown, no POST fired
11. E2E-C-15 — Duplicate NIT: 409 message in form
12. E2E-C-18 — Edit form pre-filled
13. E2E-C-19 — Edit save updates list immediately
14. E2E-C-20 — Edit: clear required field → error, no PUT fired
15. E2E-C-23 — Delete confirmation dialog
16. E2E-C-24 — Delete removes from list immediately
17. E2E-C-28 — Sort Nombre A→Z (no new API call)
18. E2E-C-29 — Sort Nombre Z→A
19. E2E-C-32 — Sort preserves active search filter

### P1 — High (should pass before second story in sprint)

- E2E-C-03 (search by NIT), E2E-C-04 (clear search)
- E2E-C-07 (detail panel), E2E-C-08 (URL update), E2E-C-09 (deep link), E2E-C-10 (not-found)
- E2E-C-16, E2E-C-17 (create toast + form close)
- E2E-C-21, E2E-C-22 (edit toast + cancel no PUT)
- E2E-C-25, E2E-C-26, E2E-C-27 (delete toasts + cancel)
- E2E-C-30, E2E-C-31 (sort by date)
- API-C-04, API-C-07, API-C-08, API-C-09, API-C-10
- UNIT-C-01 through UNIT-C-04 (SortControl)
- UNIT-C-05 through UNIT-C-08 (sortClientes function)
- UNIT-B-01 through UNIT-B-06

### P2 — Medium (complete within epic sprint)

- E2E-C-05 (EmptyState)
- E2E-C-06 (ErrorPanel with Reintentar)
- E2E-C-33 (default sort order)
- Mobile-chrome tests: E2E-C-01, E2E-C-11, E2E-C-12 run on Pixel 5 viewport

### P3 — Low (nice to have)

- Cross-browser: E2E-C-02, E2E-C-12, E2E-C-19, E2E-C-24 run on firefox project
- Performance assertion: E2E-C-02 with `performance.now()` check that filter result renders in < 1000ms (NFR1)
- NFR2 assertion on create/edit/delete: measure time from click to list update < 2000ms

---

## 6. Test File Structure

```
e2e/
  tests/
    clientes/
      clientes-list.spec.ts           # E2E-C-01 to E2E-C-06
      clientes-detail.spec.ts         # E2E-C-07 to E2E-C-10
      clientes-create.spec.ts         # E2E-C-11 to E2E-C-17
      clientes-edit.spec.ts           # E2E-C-18 to E2E-C-22
      clientes-delete.spec.ts         # E2E-C-23 to E2E-C-27
      clientes-sort.spec.ts           # E2E-C-28 to E2E-C-33
      clientes-api.spec.ts            # API-C-01 to API-C-10
  pages/
    clientes.page.ts                  # Existing — extend with SortControl locators
  helpers/
    api.helper.ts                     # Existing — already has createCliente, deleteCliente, getClientes
    data.helper.ts                    # Existing — buildCliente() ready to use
  fixtures/
    base.fixture.ts                   # Existing — reuse as-is

frontend/src/
  shared/components/__tests__/
    SortControl.test.tsx              # UNIT-C-01 to UNIT-C-04
  modules/crm/clientes/__tests__/
    sortClientes.test.ts              # UNIT-C-05 to UNIT-C-08

backend/tests/
  SiesaAgents.UnitTests/
    Validators/
      ClienteValidatorTests.cs        # UNIT-B-01 to UNIT-B-03
    Handlers/
      ClienteHandlerTests.cs          # UNIT-B-04 to UNIT-B-06
```

---

## 7. ClientesPage POM — Extension Required

The existing `e2e/pages/clientes.page.ts` covers list, detail, and form interactions. One extension is needed for Story 2.6:

```typescript
// Add to ClientesPage constructor:
this.sortControl = page.getByTestId('sort-control');
this.btnEditar = page.getByRole('button', { name: /editar/i });

// Add methods:
async seleccionarOrden(option: 'nombre-asc' | 'nombre-desc' | 'fecha-desc' | 'fecha-asc') {
  await this.sortControl.click();
  await this.page.getByRole('option', { name: new RegExp(option, 'i') }).click();
}

async abrirEdicion() {
  await this.btnEditar.click();
  await expect(this.form).toBeVisible();
}
```

**Note:** The exact `data-testid` for SortControl must match what is defined in `src/shared/components/SortControl`. If the component uses a `<select>` element instead of a custom dropdown, use `page.selectOption('[data-testid="sort-control"]', value)`.

---

## 8. Coverage Matrix — Epic 2

| Requirement | Test IDs | Level | Status |
|---|---|---|---|
| AC-E2.1 (create client appears immediately) | E2E-C-11, E2E-C-12, API-C-01 | E2E + API | Designed |
| AC-E2.2 (search < 1s, 500 records) | E2E-C-01, E2E-C-02, E2E-C-03 | E2E | Designed |
| AC-E2.3 (view detail, edit, save) | E2E-C-07, E2E-C-18, E2E-C-19 | E2E | Designed |
| AC-E2.4 (block save on empty required) | E2E-C-13, E2E-C-14, E2E-C-20, UNIT-B-01, UNIT-B-02 | E2E + Unit | Designed |
| AC-E2.5 (delete removes from list) | E2E-C-23, E2E-C-24, API-C-05 | E2E + API | Designed |
| AC-E2.6 (sort without reload, preserves filter) | E2E-C-28, E2E-C-29, E2E-C-32 | E2E | Designed |
| FR1 (create client record) | E2E-C-12, API-C-01, UNIT-B-04 | E2E + API + Unit | Designed |
| FR2 (list all clients) | E2E-C-01, API-C-07 | E2E + API | Designed |
| FR3 (search by name) | E2E-C-02, E2E-C-04 | E2E | Designed |
| FR4 (search by NIT) | E2E-C-03 | E2E | Designed |
| FR5 (view client detail) | E2E-C-07, E2E-C-09, API-C-08 | E2E + API | Designed |
| FR6 (edit client) | E2E-C-18, E2E-C-19, API-C-04 | E2E + API | Designed |
| FR7 (delete client) | E2E-C-23, E2E-C-24, API-C-05 | E2E + API | Designed |
| FR8 (required field validation) | E2E-C-13, E2E-C-14, E2E-C-20, API-C-03, UNIT-B-01, UNIT-B-02, UNIT-B-03 | All levels | Designed |
| FR27 (changes immediately visible) | E2E-C-12, E2E-C-19, E2E-C-24 | E2E | Designed |
| FR30 (deep linking /clientes/:id) | E2E-C-08, E2E-C-09, E2E-C-10 | E2E | Designed |
| NFR1 (search < 1s) | E2E-C-02 (+ P3 perf assertion) | E2E | Designed |
| NFR2 (CRUD < 2s) | E2E-C-12, E2E-C-19, E2E-C-24 (P3 timing) | E2E | Designed |
| NFR5 (input validation + sanitization) | API-C-02, API-C-03, UNIT-B-01, UNIT-B-02 | API + Unit | Designed |
| NFR6 (no stack traces) | API-C-02, API-C-09 | API | Designed |
| Duplicate NIT (409 + UI message) | E2E-C-15, API-C-02, UNIT-B-05 | All levels | Designed |
| Delete cascade (contacts → clienteId=null) | E2E-C-27, API-C-06 | E2E + API | Designed |
| SortControl — 4 options | UNIT-C-01, UNIT-C-02, UNIT-C-03, UNIT-C-04 | Unit | Designed |
| Client-side sort logic | UNIT-C-05, UNIT-C-06, UNIT-C-07, UNIT-C-08 | Unit | Designed |

**Coverage: 24/24 requirements addressed — 100%**

---

## 9. Definition of Done (Epic 2 Testing)

- [ ] All P0 test cases (19) pass before any story is considered dev-complete
- [ ] All P1 test cases (27) pass before Epic 2 is closed
- [ ] `ClientesPage` POM extended with SortControl locators (`seleccionarOrden`, `abrirEdicion`)
- [ ] `clientes-api.spec.ts` passes fully against running backend — confirms REST contract
- [ ] API-C-06 (cascade delete contacts) passes — confirmed data integrity
- [ ] No test uses hardcoded NIT values — all use `buildCliente()` factory
- [ ] All Spanish text assertions use case-insensitive regex (no hardcoded exact strings)
- [ ] `afterEach` cleanup in all E2E spec files calls `apiHelper.deleteCliente(id)` for every created record
- [ ] `page.on('pageerror', ...)` listener added to deep link and error scenario tests
- [ ] Mobile-chrome project run confirmed for P2 responsive tests (E2E-C-01, E2E-C-11, E2E-C-12)
