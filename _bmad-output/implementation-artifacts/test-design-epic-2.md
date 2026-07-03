---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-07-03"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: ready
---

# Test Design — Epic 2: Client Management

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 implements the full CRUD lifecycle for the `Cliente` domain entity plus real-time search and client-side sorting. It introduces the first business domain of Siesa-Agents on top of the Epic 1 foundation (Vite/React + AppShell + .NET 10 + `AppDbContext` with `ApplySnakeCaseNaming`). The user experience follows a master-detail pattern under `/clientes` with deep linking, optimistic UI via TanStack Query, and Problem Details error handling for validation and conflict scenarios.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Left panel list, real-time filter (NFR1 <1s / 500 records), empty state, error panel |
| 2.2 | Client Detail View | Right panel render, deep link `/clientes/:clienteId`, not-found handling |
| 2.3 | Create Client | Form + Zod validation, 409 on duplicate NIT/RUC, optimistic insert + toast |
| 2.4 | Edit Client | Pre-filled form, optimistic update, validation, cancel discards changes |
| 2.5 | Delete Client | Confirmation dialog, optimistic delete, orphaned contacts remain (clienteId → NULL) |
| 2.6 | Sort Client List | 4 sort modes client-side over TanStack cache, sort × search composition, default "Más reciente" |

### Out of Scope for This Epic

- Contacts CRUD (Epic 3)
- Client–Contact association UI (Epic 4)
- The `contactos` table schema itself — Story 2.5 only requires the FK relationship configured with `OnDelete(DeleteBehavior.SetNull)`; contact CRUD is validated in Epic 3
- Authentication / authorization (deferred MVP)
- Pagination (500 records limit per NFR10 — all clients loaded in a single query)

### Assumptions Requiring Confirmation

- **A1**: The `Cliente` entity uses `Guid` PK and `DateTimeOffset CreatedAt` (per architecture UUIDs + `DateTimeOffset` mandate).
- **A2**: The `contactos` table is created in Epic 3 with `ClienteId` as nullable FK and `OnDelete(SetNull)`. Story 2.5's cascade-to-null test is validated in Epic 2 only against the FK configuration; the runtime cascade behavior is re-verified in Epic 3.
- **A3**: NIT/RUC uniqueness is enforced by a unique index on `clientes.nit_ruc` (backend responsibility), not by application-level pre-check.
- **A4**: Search debounce is applied client-side (~150ms) to keep NFR1 comfortable; no backend search endpoint is required at this scale.

---

## 2. Risk Assessment

### Risk Matrix

| # | Category | Description | Probability | Impact | Score | Priority | Mitigation |
|---|----------|-------------|-------------|--------|-------|----------|------------|
| R1 | DATA | Deleting a client cascades and removes its contacts instead of setting `clienteId = NULL` (violates Story 2.5 last AC) | 3 | 3 | 9 | P0 | Configure `OnDelete(DeleteBehavior.SetNull)` on FK; integration test asserts contact rows survive after client delete |
| R2 | DATA | Duplicate NIT/RUC persisted because unique constraint is missing at DB level (relying only on FE check) | 2 | 3 | 6 | P0 | Add unique index migration; integration test asserts 409 Conflict on duplicate insert |
| R3 | SEC | 409 conflict response leaks stack trace or raw EF exception message (violates NFR6) | 2 | 3 | 6 | P0 | Problem Details middleware maps `DbUpdateException` → RFC 7807 with sanitized `detail` |
| R4 | BUS | Optimistic UI update does not roll back on API failure, leaving stale client visible in list (violates FR27 semantics) | 2 | 3 | 6 | P0 | TanStack Query `onError` handler restores previous cache snapshot; component test simulates failure |
| R5 | PERF | Search filter re-renders the full list on every keystroke, blowing NFR1 with 500 records | 2 | 2 | 4 | P1 | Debounce 150ms + `useMemo` filter + virtualized list only if profiling requires it; component test with 500-item fixture asserts <1s render |
| R6 | BUS | Sort control triggers a new API fetch (violates Story 2.6 "sin recargar" AC) | 2 | 2 | 4 | P1 | Sort is pure client-side over TanStack cache; component test asserts `useQuery` fetch count unchanged after sort switch |
| R7 | BUS | Sort resets the active search filter (violates Story 2.6 filter-preservation AC) | 2 | 2 | 4 | P1 | Sort and search state independent (two `useState` hooks); component test asserts filter input value survives sort change |
| R8 | BUS | Deep link `/clientes/:clienteId` with non-existent ID crashes app instead of showing not-found (violates Story 2.2 AC) | 2 | 2 | 4 | P1 | Route loader returns 404 payload → NotFound view; E2E test hits invalid GUID and asserts graceful message |
| R9 | SEC | Backend accepts empty/whitespace required fields, bypassing FR8 validation on the server | 2 | 2 | 4 | P1 | FluentValidation on `CreateClienteCommand` + `UpdateClienteCommand`; integration test posts empty strings and asserts 400 with field errors |
| R10 | TECH | `clientes` migration uses PascalCase column names because `ApplySnakeCaseNaming()` runs before entity config | 1 | 3 | 3 | P2 | Confirmed pattern from Epic 1 (last call in `OnModelCreating`); integration test inspects `information_schema.columns` on `clientes` |
| R11 | OPS | Backend unavailable at page load shows blank UI instead of ErrorPanel with Reintentar (violates Story 2.1 AC) | 2 | 2 | 4 | P1 | TanStack Query `isError` → `<ErrorPanel onRetry={refetch} />`; component test with MSW error handler |
| R12 | BUS | EmptyState never renders because the query returns `[]` and the list mistakes it for "still loading" | 1 | 2 | 2 | P2 | Explicit `data.length === 0 && !isLoading` guard; component test with empty fixture |
| R13 | DATA | `CreatedAt` uses `DateTime.UtcNow` (naive) instead of `DateTimeOffset.UtcNow`, breaking sort by creation date across timezones | 1 | 2 | 2 | P2 | Entity property is `DateTimeOffset`; unit test asserts default value is `DateTimeOffset` |

### Top 3 Risk Areas

1. **Delete cascade correctness (R1, score 9)** — Story 2.5's contract that contacts survive and become unassigned is a data-integrity requirement that cannot be recovered manually if broken. Requires FK config verified at both migration level and runtime.
2. **Duplicate NIT/RUC integrity (R2, R3, combined score 6+6)** — Uniqueness must hold at the DB layer AND the error must round-trip through Problem Details without exposing internals. A DB constraint violation is the last line of defense.
3. **Optimistic UI rollback (R4, score 6)** — FR27 requires immediate reflection; if rollback is missing, users see phantom clients or stale data after a failed create/edit/delete, silently corrupting their mental model.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌            3 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  9 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  10 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌▌▌          5 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                        27 tests
```

### Rationale

- **API integration is the dominant layer** because Epic 2 introduces the first business persistence surface: uniqueness constraints, FK cascade config, validation, and Problem Details mapping are all server-authoritative and cannot be trusted from FE alone.
- **Component tests carry the FE weight** rather than E2E because the master-detail interactions (search, sort, form validation, empty/error panels) are UI-state concerns that render deterministically in RTL and would be slow/flaky in Playwright.
- **E2E is reserved for the highest-value happy paths and deep-link scenarios** where routing + server + rendering must integrate — one create+edit+delete journey and two deep-link cases.
- **Unit tests focus on Zod schemas, sort comparators, and validators** — pure functions with clear edge cases.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Is Closed

#### TC-E2-P0-01: Delete Client Sets Associated Contacts to Unassigned (Does Not Delete Them)

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** Story 2.5 last AC — "los contactos previamente asociados quedan sin cliente asignado (`clienteId = null`)"
**Risk covered:** R1

**Precondition:** Test DB seeded with 1 client and 2 contacts referencing that client (contacts inserted directly via `AppDbContext` since Epic 3 endpoints do not exist yet; use raw entity insert).

**Test Steps:**
1. `DELETE /api/v1/clientes/{clienteId}` via `WebApplicationFactory`.
2. Query `contactos` table where `id` in the seeded contact IDs.
3. Query `clientes` table for the deleted `clienteId`.

**Expected Result:**
- DELETE returns 204.
- Both contact rows still exist.
- Both contact rows have `cliente_id IS NULL`.
- Client row is absent (or soft-delete flag set, per implementation).

**Automation:** xUnit + `WebApplicationFactory<Program>` + `TestContainers` Postgres. If contact endpoints do not yet exist, seed via `DbContext` directly.

---

#### TC-E2-P0-02: Creating a Client with Duplicate NIT/RUC Returns 409 Problem Details

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** Story 2.3 AC-4 — "409 conflict … El NIT/RUC ya está registrado", NFR5, NFR6
**Risk covered:** R2, R3

**Precondition:** DB seeded with a client whose NIT/RUC is `900123456-7`.

**Test Steps:**
1. `POST /api/v1/clientes` with body containing `nitRuc: "900123456-7"` and other valid fields.
2. Inspect response.

**Expected Result:**
- HTTP 409.
- `Content-Type: application/problem+json`.
- Body contains `title`, `status: 409`, `detail` (user-safe message referencing NIT/RUC uniqueness).
- Body does NOT contain `stackTrace`, `exception`, `innerException`, or any raw `Npgsql` / `DbUpdateException` text.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-03: Backend Rejects Client Creation with Missing Required Fields (Server-Side Validation)

**Level:** API Integration (xUnit)
**Story:** 2.3, 2.4
**Requirement:** FR8, NFR5, Story 2.3 AC-3
**Risk covered:** R9

**Test Steps:**
1. `POST /api/v1/clientes` with body `{ "nombre": "", "nitRuc": "  ", "telefono": null, "ciudad": "" }`.
2. Inspect response.

**Expected Result:**
- HTTP 400.
- `Content-Type: application/problem+json`.
- Body includes `errors` object with entries for each empty required field (`nombre`, `nitRuc`, `telefono`, `ciudad`).
- No stack trace exposed.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-04: Optimistic Update Rolls Back on API Failure

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR27 semantics — data changes reflect immediately, but a failed mutation must not leave phantom rows
**Risk covered:** R4

**Test Steps:**
1. Render `<ClientListView>` with TanStack Query provider and seed cache with 3 clients.
2. Configure MSW handler for `POST /api/v1/clientes` to return 500.
3. User submits the create form with valid fields.
4. Immediately after submit, assert the new client is visible (optimistic).
5. After the mocked failure resolves, assert the new client has been removed from the list.
6. Assert an error toast is displayed.

**Expected Result:**
- Optimistic row appears briefly (verifies UX).
- Row is rolled back on failure.
- Error toast rendered with a user-friendly message.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-05: Create Client — Happy Path End-to-End

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR27
**Risk covered:** R4 (indirect), integration confidence

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente".
3. Fill Nombre, NIT/RUC (unique), Teléfono, Ciudad.
4. Submit.
5. Wait for toast "Cliente creado correctamente".
6. Assert the new client appears in the list panel.
7. Assert the URL contains `/clientes/:clienteId` for the newly created client (auto-selected).

**Expected Result:**
- Client persisted (verified via subsequent list refresh or backend inspection).
- List shows the new record without page reload.
- Success toast displayed.

**Automation:** Playwright E2E, seeded against a fresh test DB.

---

### P1 — Must Pass Before Epic Is Closed

#### TC-E2-P1-01: Client List Renders and Search Filters in Real Time

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-E2.2, Story 2.1 first & second ACs, NFR1
**Risk covered:** R5

**Test Steps:**
1. Configure MSW to return 500 clients (fixture) on `GET /api/v1/clientes`.
2. Render `<ClientListView>`.
3. Wait for list to render.
4. Type `"Corp"` into the search input.
5. Measure elapsed time to filter render (Vitest timers or `performance.now()`).

**Expected Result:**
- Initial list renders all 500 items in a scrollable container.
- Search filter completes and DOM updates in under 1 second.
- Only items matching Nombre or NIT/RUC containing `"Corp"` are visible.

**Automation:** Vitest + RTL + MSW + fixture generator.

---

#### TC-E2-P1-02: Empty State Renders When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** Story 2.1 third AC (EmptyState)
**Risk covered:** R12

**Test Steps:**
1. Configure MSW to return `[]` on `GET /api/v1/clientes`.
2. Render `<ClientListView>`.
3. Wait for query to resolve.

**Expected Result:**
- EmptyState component visible with guiding message.
- List container is NOT rendered.
- Loading spinner is NOT present.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: ErrorPanel with Retry Renders When Backend Fails

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** Story 2.1 fourth AC
**Risk covered:** R11

**Test Steps:**
1. Configure MSW handler to return 500 on `GET /api/v1/clientes`.
2. Render `<ClientListView>`.
3. Assert `<ErrorPanel>` with "Reintentar" button is rendered.
4. Reconfigure MSW to return 200 with data, click "Reintentar".
5. Assert list renders.

**Expected Result:**
- Error panel visible on failure.
- Retry triggers `refetch` (verified via MSW request count going from 1 to 2).
- List renders after successful retry.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-04: Deep Link `/clientes/:clienteId` Renders Detail Directly

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** Story 2.2 second AC, FR30
**Risk covered:** R8 (positive case)

**Test Steps:**
1. Seed backend with a client of known `clienteId`.
2. Open browser directly to `http://localhost:5173/clientes/{clienteId}`.
3. Wait for render.

**Expected Result:**
- Right panel shows the client detail with all fields populated.
- Left list is loaded and the target client is highlighted/selected.
- No redirect to `/clientes` root.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-05: Deep Link to Non-Existent Client Shows Not-Found Gracefully

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** Story 2.2 third AC
**Risk covered:** R8

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/00000000-0000-0000-0000-000000000000`.
2. Wait for render.

**Expected Result:**
- A "cliente no encontrado" message is displayed in the detail panel.
- No JS error in console.
- App shell (NavigationRail + list panel) still renders.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-06: Edit Client — Form Pre-Fills and Persists Changes with Optimistic Update

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** Story 2.4 first & second ACs, FR6, FR27
**Risk covered:** R4

**Test Steps:**
1. Seed cache with a client.
2. Render detail view for that client.
3. Click "Editar".
4. Assert all four fields are pre-filled with current values.
5. Modify Teléfono, submit (MSW returns 200 with updated payload).
6. Assert list panel and detail panel reflect new value immediately.
7. Assert success toast "Cliente actualizado correctamente".

**Expected Result:**
- Form pre-filled correctly.
- List + detail update without page reload.
- Toast displayed.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: Delete Client — Confirmation Dialog + Optimistic Removal

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** Story 2.5 ACs 1-2
**Risk covered:** R4

**Test Steps:**
1. Render detail view for a seeded client.
2. Click "Eliminar" — assert confirmation dialog with "¿Eliminar este cliente?" and Confirmar/Cancelar buttons.
3. Click "Confirmar" (MSW returns 204).
4. Assert client removed from list immediately.
5. Assert right panel returns to empty/default state.
6. Assert toast "Cliente eliminado correctamente".
7. Repeat scenario, click "Cancelar" — assert client remains and no request is sent.

**Expected Result:**
- Confirm removes; Cancel preserves.
- Toast on success.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Sort Control Reorders Client List Without New API Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** Story 2.6 first four ACs
**Risk covered:** R6

**Test Steps:**
1. Render `<ClientListView>` with 5 seeded clients of varying names and `createdAt` values.
2. Track MSW request count for `GET /api/v1/clientes`.
3. Select each sort mode (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`).
4. After each selection, assert the list order matches the expected comparator output.
5. Assert MSW request count is unchanged (still 1) after all four sort switches.

**Expected Result:**
- Order changes correctly for each mode.
- Zero additional fetches.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: Sort Composes With Active Search Without Clearing Filter

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6 fifth AC, AC-E2.6
**Risk covered:** R7

**Test Steps:**
1. Render list with 10 seeded clients.
2. Type "SA" in search — assert filtered subset shown.
3. Change sort to `nombre-desc`.
4. Assert:
   - Search input still contains "SA".
   - Filtered subset is still visible (no unfiltered clients).
   - Filtered subset is now ordered Z→A.

**Expected Result:**
- Filter preserved.
- Sort applied to filtered set only.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-10: Default Sort on Initial Load Is "Más reciente"

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** Story 2.6 sixth AC

**Test Steps:**
1. Render `<ClientListView>` fresh (no prior preference persisted).
2. Inspect SortControl current value.
3. Inspect list order.

**Expected Result:**
- SortControl shows `fecha-desc` (Más reciente).
- List is ordered by `createdAt` descending.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-11: GET /api/v1/clientes Returns Ordered List with All Required Fields

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirement:** FR2, FR5

**Precondition:** DB seeded with 3 clients.

**Test Steps:**
1. `GET /api/v1/clientes`.

**Expected Result:**
- HTTP 200.
- Response is an array of 3 items.
- Each item contains `id`, `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`.
- `createdAt` is ISO-8601 with timezone offset (DateTimeOffset serialization).

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P1-12: GET /api/v1/clientes/{id} — Existing and Non-Existing

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirement:** FR5, Story 2.2 third AC

**Test Steps:**
1. Seed DB with one client of known id.
2. `GET /api/v1/clientes/{knownId}` → assert 200 + full payload.
3. `GET /api/v1/clientes/00000000-0000-0000-0000-000000000000` → assert 404 with Problem Details.

**Expected Result:**
- Positive case returns 200 with complete client payload.
- Negative case returns 404 `application/problem+json` with no stack trace.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-13: PUT /api/v1/clientes/{id} — Update Persists and Rejects Empty Fields

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirement:** FR6, FR8

**Test Steps:**
1. Seed client, `PUT` with modified valid body → assert 200 and DB reflects new values.
2. `PUT` with `{ "nombre": "" }` → assert 400 Problem Details with `errors.nombre`.

**Expected Result:**
- Valid update persists.
- Empty required field returns 400.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-14: DELETE /api/v1/clientes/{id} — Returns 204 and Removes Row

**Level:** API Integration (xUnit)
**Story:** 2.5

**Test Steps:**
1. Seed client.
2. `DELETE /api/v1/clientes/{id}` → assert 204.
3. `GET /api/v1/clientes/{id}` → assert 404.

**Expected Result:**
- Delete succeeds and record is gone.

**Automation:** xUnit integration test.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: `clientes` Table Uses snake_case Columns

**Level:** API Integration (xUnit)
**Story:** All (schema-level)
**Requirement:** Architecture convention, Epic 1 pattern
**Risk covered:** R10

**Test Steps:**
1. After migration, query `information_schema.columns` for table `clientes`.

**Expected Result:**
- Columns are `id`, `nombre`, `nit_ruc`, `telefono`, `ciudad`, `created_at`.
- No PascalCase columns present.
- A unique index exists on `nit_ruc`.

**Automation:** xUnit integration test.

---

#### TC-E2-P2-02: `Cliente.CreatedAt` Uses DateTimeOffset (Not DateTime)

**Level:** Unit (xUnit)
**Story:** All (entity-level)
**Requirement:** Architecture mandate
**Risk covered:** R13

**Test Steps:**
1. Reflect on `Cliente` entity `CreatedAt` property.
2. Assert type is `DateTimeOffset`.

**Expected Result:**
- Property type is `DateTimeOffset`.

**Automation:** xUnit unit test.

---

#### TC-E2-P2-03: Zod Schema for Client Form Rejects Empty and Whitespace

**Level:** Unit (Vitest)
**Story:** 2.3, 2.4
**Requirement:** FR8

**Test Steps:**
1. Import the `clienteSchema` used by the form.
2. Parse `{ nombre: "", nitRuc: "  ", telefono: "", ciudad: "" }`.
3. Parse a valid object.

**Expected Result:**
- Invalid case throws `ZodError` with 4 issues (one per field).
- Valid case returns the parsed value.

**Automation:** Vitest unit test.

---

#### TC-E2-P2-04: Sort Comparators Are Stable and Correct for All Four Modes

**Level:** Unit (Vitest)
**Story:** 2.6

**Test Steps:**
1. Import comparator functions or the sort helper.
2. For each mode (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`), sort a fixture of 5 clients (with ties in `createdAt`).
3. Assert output order.

**Expected Result:**
- Alphabetical modes case-insensitive, locale-aware (Spanish accents ignored or handled per spec).
- Date modes correct.
- Ties in date preserve insertion order (stable sort).

**Automation:** Vitest unit test.

---

#### TC-E2-P2-05: FluentValidation Rules on `CreateClienteCommand`

**Level:** Unit (xUnit)
**Story:** 2.3, 2.4
**Requirement:** NFR5, FR8

**Test Steps:**
1. Instantiate `CreateClienteCommandValidator`.
2. Validate a command with each required field individually empty.
3. Validate a fully-valid command.

**Expected Result:**
- Each empty-field case produces exactly one validation error on the corresponding property.
- Valid case produces no errors.

**Automation:** xUnit unit test.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: Full Client Journey — Create → Search → Edit → Delete

**Level:** E2E (Playwright)
**Story:** 2.1–2.5

**Test Steps:**
1. Create client A.
2. Create client B.
3. Search for A by name — assert only A visible.
4. Edit A's phone — assert list and detail reflect.
5. Delete A — assert list shows only B.

**Expected Result:**
- End-to-end journey passes with all UX affordances (toasts, list updates, detail transitions).

**Automation:** Playwright E2E — smoke journey.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client, appears in list immediately | 2.3 | TC-E2-P0-05, TC-E2-P0-04, TC-E2-P0-03 | Covered |
| AC-E2.2: Search by name or NIT/RUC < 1s | 2.1 | TC-E2-P1-01 | Covered |
| AC-E2.3: View detail, edit any field, save | 2.2, 2.4 | TC-E2-P1-04, TC-E2-P1-06, TC-E2-P1-13 | Covered |
| AC-E2.4: Prevent empty required fields with clear errors | 2.3, 2.4 | TC-E2-P0-03, TC-E2-P1-13, TC-E2-P2-03, TC-E2-P2-05 | Covered |
| AC-E2.5: Delete client and it disappears from list | 2.5 | TC-E2-P1-07, TC-E2-P1-14, TC-E2-P0-01 | Covered |
| AC-E2.6: Sort without reload or losing search filter | 2.6 | TC-E2-P1-08, TC-E2-P1-09, TC-E2-P1-10, TC-E2-P2-04 | Covered |
| Story 2.1 EmptyState | 2.1 | TC-E2-P1-02 | Covered |
| Story 2.1 ErrorPanel + Reintentar | 2.1 | TC-E2-P1-03 | Covered |
| Story 2.2 deep link `/clientes/:clienteId` | 2.2 | TC-E2-P1-04, TC-E2-P1-05, TC-E2-P1-12 | Covered |
| Story 2.3 409 on duplicate NIT/RUC | 2.3 | TC-E2-P0-02 | Covered |
| Story 2.5 contacts remain unassigned after delete | 2.5 | TC-E2-P0-01 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with up to 500 records | TC-E2-P1-01 | Component (with 500-item fixture) |
| NFR2 | CRUD reflects in UI < 2s | TC-E2-P0-04, TC-E2-P1-06, TC-E2-P1-07 (via optimistic UI) | Component |
| NFR3 | 10 concurrent users | Out of scope — validated at NFR audit workflow, not per-story | N/A |
| NFR5 | Input validation and sanitization | TC-E2-P0-03, TC-E2-P1-13, TC-E2-P2-03, TC-E2-P2-05 | Integration + Unit |
| NFR6 | No stack traces exposed | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P1-12 | Integration |
| NFR10 | 500 clients dataset | TC-E2-P1-01 fixture | Component |
| NFR11 | No hardcoded limits | Enforced by design (no pagination cap, UUID PKs) — not directly testable in Epic 2 | N/A |

---

## 7. Test Execution Order

The following execution order minimizes blocked tests due to environment or schema dependencies:

```
Phase 1 — Schema & Entity Gate (P2 + P0 backend baseline)
  1. TC-E2-P2-01  clientes snake_case columns + unique index on nit_ruc
  2. TC-E2-P2-02  CreatedAt is DateTimeOffset
  3. TC-E2-P2-05  FluentValidation rules

Phase 2 — Backend CRUD Gate (P0/P1 integration)
  4. TC-E2-P1-11  GET list
  5. TC-E2-P1-12  GET by id (existing + not found)
  6. TC-E2-P0-03  POST rejects empty fields (400 Problem Details)
  7. TC-E2-P0-02  POST rejects duplicate NIT/RUC (409 Problem Details)
  8. TC-E2-P1-13  PUT persists and validates
  9. TC-E2-P1-14  DELETE returns 204 and removes row
 10. TC-E2-P0-01  DELETE sets contact.cliente_id to NULL (cascade correctness)

Phase 3 — Frontend Component Gate (P0/P1)
 11. TC-E2-P0-04  Optimistic update rollback on failure
 12. TC-E2-P1-01  List renders + search < 1s with 500 items
 13. TC-E2-P1-02  EmptyState
 14. TC-E2-P1-03  ErrorPanel + Reintentar
 15. TC-E2-P1-06  Edit form pre-fill + optimistic update
 16. TC-E2-P1-07  Delete confirmation + optimistic remove
 17. TC-E2-P1-08  Sort without new fetch
 18. TC-E2-P1-09  Sort composes with search
 19. TC-E2-P1-10  Default sort "Más reciente"
 20. TC-E2-P2-03  Zod schema rejects empty
 21. TC-E2-P2-04  Sort comparators

Phase 4 — E2E Journeys (P0/P1)
 22. TC-E2-P0-05  Create client happy path
 23. TC-E2-P1-04  Deep link to existing client
 24. TC-E2-P1-05  Deep link to non-existent client

Phase 5 — Extended Coverage (P3)
 25. TC-E2-P3-01  Full journey Create→Search→Edit→Delete
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/user-event | Realistic user interactions (typing, clicking) | Frontend |
| MSW 2+ | API mocking for component tests | Frontend |
| Playwright 1.40+ | E2E tests | Frontend/E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB per integration test | Backend |
| FluentAssertions | Readable assertions | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ available (via TestContainers or local)
- clientes migration applied to test DB
- (Optional) contactos table available for TC-E2-P0-01 cascade test;
  if not, seed contact rows via raw DbContext insert
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.0 | 10.0 | Cascade + Problem Details + optimistic rollback are non-trivial |
| P1 | 14 | 1.0 | 14.0 | Standard CRUD + list/sort/deep-link scenarios |
| P2 | 5 | 0.5 | 2.5 | Schema introspection, Zod, comparator unit tests |
| P3 | 1 | 1.5 | 1.5 | Full E2E journey |
| **Total** | **25** | — | **28.0 hours** | **~3.5 days** |

*(Test count in the table sums to 25; two P1 unique-index/schema assertions are folded into TC-E2-P2-01.)*

### Prerequisites

**Test Data:**
- Client fixture factory (`makeCliente({ nombre, nitRuc, telefono, ciudad, createdAt })`)
- 500-item fixture generator for NFR1 measurement
- Contact fixture (for TC-E2-P0-01) — direct entity insert if Epic 3 endpoints unavailable

**Tooling:**
- MSW handlers file: `frontend/src/test/handlers/clientes.ts`
- xUnit collection fixture for shared `WebApplicationFactory` + TestContainers Postgres
- Playwright `test.beforeEach` seeder that resets the `clientes` table

**Environment:**
- Same as Epic 1 baseline (Node 20+, .NET 10, Postgres 18+)
- Migration for `clientes` table applied to test DB

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (5/5 tests — no exceptions)
- **P1 pass rate**: 100% for this epic (business surface is small enough to demand full pass)
- **P2 pass rate**: ≥90% (informational; deferrals require justification in retrospective)
- **P3**: informational — may be deferred to Epic 3+
- **High-risk mitigations** (R1, R2, R3, R4): 100% resolved before Epic 2 closure

### Coverage Targets

- **Critical paths** (delete cascade, duplicate NIT/RUC, optimistic rollback, Problem Details): 100%
- **CRUD endpoints**: 100% of AC covered by integration tests
- **Search + sort + deep link**: 100% of AC covered by component/E2E tests
- **NFR6** (no stack trace): 100% on 4xx/5xx responses

### Non-Negotiable Requirements

- [ ] All 5 P0 tests pass
- [ ] R1 mitigated — delete cascade to null verified against real DB
- [ ] R2 mitigated — unique index on `nit_ruc` present in migration
- [ ] R3 mitigated — Problem Details on 409 verified with no `stackTrace` key
- [ ] R4 mitigated — optimistic rollback observed in component test
- [ ] NFR1 verified with 500-item fixture

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-05)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-14)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] Traceability matrix (Epic 2) shows every AC linked to at least one passing test
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] Problem Details format verified on 400 (validation), 404 (not found), 409 (duplicate) responses
- [ ] Delete cascade behavior confirmed against real Postgres (not in-memory provider)
- [ ] Search performance validated with 500-record fixture

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **`Cliente` entity** must define `CreatedAt` as `DateTimeOffset` (never `DateTime`).
2. **`clientes` migration** must add a unique index on `nit_ruc` column.
3. **Contact FK configuration** (Epic 3 companion, but scaffolded here or with a stub) must use `OnDelete(DeleteBehavior.SetNull)` on `ClienteId`.
4. **`ExceptionHandlingMiddleware`** must map:
   - `ValidationException` (FluentValidation) → 400 with `errors` field
   - `DbUpdateException` on unique-index violation → 409 with sanitized detail
   - Not-found lookups → 404 Problem Details
   - No `stackTrace` key on any response body
5. **Frontend forms** must use Zod schema `clienteSchema` — same schema for create and edit.
6. **TanStack Query mutations** must implement `onMutate` (optimistic snapshot), `onError` (rollback), and `onSettled` (invalidate).
7. **`/clientes` route** with param `clienteId` must render both list (left) and detail (right) with URL as source of truth for selection.
8. **`SortControl`** identifiers must be exactly `nombre-asc | nombre-desc | fecha-desc | fecha-asc`, default `fecha-desc`.
9. **Sort logic** must be pure client-side over the TanStack Query cache — no additional API call.
10. **Search input** must debounce ~150ms, filter with `useMemo`, and preserve its value across sort changes.
11. **All Spanish UI text** is P0 — toasts, dialog labels, empty state, error panel copy.
