---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-29"
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

Epic 2 delivers the complete CRUD lifecycle for client records (Clientes): list with real-time search, detail view with deep linking, create form with validation, edit form pre-filled, delete with confirmation dialog and orphan-contact handling, and client-side sort by name/date without extra API calls. It covers FRs 1–8 and NFRs 1, 2, 5, 6 from the PRD.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Real-time filter over TanStack Query cache, EmptyState, ErrorPanel + retry |
| 2.2 | Client Detail View | Deep linking via `/clientes/:clienteId`, 404 handling for invalid IDs |
| 2.3 | Create Client | Form validation (Zod + backend FluentValidation), 409 NIT conflict, success toast |
| 2.4 | Edit Client | Pre-fill, mutation invalidation, cancel preserves data, validation on clear |
| 2.5 | Delete Client | Confirmation dialog, orphan-contact handling (`clienteId = null`), cancel guard |
| 2.6 | Sort Client List | Client-side sort over cache (no extra fetch), 4 criteria, persists active search |

### Out of Scope for This Epic

- Contact management CRUD (Epic 3)
- Client–Contact association UI (Epic 4)
- Authentication / authorization (deferred per PRD)
- Server-side pagination (deferred; NFR10 scope: 500 records max)
- HTTPS configuration (non-local deployments only, NFR4)

---

## 2. Risk Assessment

### Risk Matrix

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-E2-01 | DATA | NIT/RUC uniqueness constraint not enforced at backend → duplicate clients can be created | 2 | 3 | **6** | API integration test: POST with duplicate NIT asserts HTTP 409 with Problem Details; FluentValidation + UK index in PostgreSQL verified | QA | Sprint 2 |
| R-E2-02 | DATA | Client deletion sets `clienteId = null` on associated contacts but orphan contacts are lost or corrupted | 2 | 3 | **6** | Integration test: seed client with contacts, DELETE, assert contacts still exist with `clienteId = null` and toast message contains orphan warning | QA | Sprint 2 |
| R-E2-03 | BUS | Real-time search (NFR1 < 1s) fails with 500 records due to synchronous filtering blocking React render | 2 | 3 | **6** | Performance component test: seed MSW response with 500 clients, measure filter time with `useMemo`, assert < 150ms (well under 1s threshold for local filter) | QA/DEV | Sprint 2 |
| R-E2-04 | BUS | Sort state cleared when active search filter changes — violates AC-E2.6 (sort must persist filter) | 2 | 2 | **4** | Component test: apply search, change sort, assert filtered AND sorted list is rendered without search reset | QA/DEV | Sprint 2 |
| R-E2-05 | TECH | TanStack Query cache not invalidated after create/edit/delete → stale client list shown (violates FR27, NFR2) | 2 | 3 | **6** | Mutation hook unit tests: verify `queryClient.invalidateQueries(['clientes'])` is called in `onSuccess`; component test: create client, assert new entry visible in list | DEV | Sprint 2 |
| R-E2-06 | SEC | Backend returns raw validation errors or stack traces in 400/409 responses, exposing internals (NFR6) | 2 | 3 | **6** | Integration test: invalid POST → assert response is Problem Details RFC 7807 (fields: `status`, `title`, `errors`), assert no `stackTrace` key | QA | Sprint 2 |
| R-E2-07 | TECH | Deep linking to `/clientes/:clienteId` with invalid UUID or non-existent ID causes unhandled JS error instead of graceful 404 | 2 | 2 | **4** | E2E test: navigate to `/clientes/non-existent-id`, assert not-found message rendered, no crash or blank screen | QA | Sprint 2 |
| R-E2-08 | BUS | Cancel on edit form modifies state before cancel is clicked, leaving dirty data visible in the detail panel | 1 | 2 | **2** | Component test: open edit form, modify a field, click cancel, assert detail panel shows original values | DEV | Sprint 2 |
| R-E2-09 | PERF | TanStack Query initial fetch blocks render — no loading state shown while 500 clients load (UX degradation) | 1 | 2 | **2** | Component test: MSW delays response 200ms, assert loading skeleton/spinner is rendered before list appears | DEV | Sprint 2 |
| R-E2-10 | OPS | Zod schema `clienteSchema` diverges from backend FluentValidation rules — frontend permits submit while backend rejects | 1 | 2 | **2** | Code review / contract test: compare required fields (Nombre, NIT, Teléfono, Ciudad) in `clienteSchema.ts` vs `CreateClienteRequestValidator.cs` | DEV | Sprint 2 |

### High-Priority Risks (Score ≥ 6) — Summary

| Risk ID | Category | Description | Score |
|---------|----------|-------------|-------|
| R-E2-01 | DATA | Duplicate NIT not blocked | 6 |
| R-E2-02 | DATA | Orphan contacts corrupted on client delete | 6 |
| R-E2-03 | PERF | Client-side filter < 1s with 500 records | 6 |
| R-E2-05 | TECH | Query cache not invalidated after mutations | 6 |
| R-E2-06 | SEC | Problem Details not returned — stack traces leak | 6 |

### Top 3 Risk Areas for Epic 2

1. **Data integrity on delete** (R-E2-02): when a client with contacts is deleted, the cascade behavior (`ON DELETE SET NULL`) must propagate correctly; failure loses contact-client associations silently and violates FR25 (orphan filter).
2. **NIT uniqueness enforcement** (R-E2-01): the `uk_clientes_nit` unique index plus 409-response wiring is the primary guard against duplicate client records, which are a business-critical data quality issue.
3. **Query cache invalidation** (R-E2-05): if mutations don't invalidate `['clientes']`, the UI shows stale data, breaking FR27 ("changes immediately visible") and NFR2 (< 2s update).

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)             ▌▌▌▌▌▌▌▌▌            5 tests
  API Integration (xUnit)      ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   12 tests
  Component (Vitest+RTL+MSW)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  18 tests
  Unit (Vitest/xUnit)          ▌▌▌▌▌▌▌▌▌▌           10 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                               45 tests
```

### Rationale

- **Component tests dominate** because the majority of Epic 2 behaviors (search filtering, sort logic, form validation, toast feedback, dialog state) are pure front-end concerns that execute fastest with Vitest+RTL+MSW and don't require a running backend.
- **API integration tests are the second largest group** because backend validation (FluentValidation), constraint handling (409 NIT duplicate, 204 delete, orphan `SET NULL`), and Problem Details format require an actual HTTP layer tested via `WebApplicationFactory<Program>`.
- **E2E tests are targeted** at the 5 critical user journeys that cross the full stack and must work in a real browser (deep linking, full CRUD round-trip, orphan-contact scenario).
- **Unit tests** cover isolated business logic: Zod schema validation, mutation hooks' `invalidateQueries` calls, and backend command/query handler logic.

### Test Level Assignment Rationale by Feature

| Feature | Dominant Level | Reason |
|---------|---------------|--------|
| Real-time search filter | Component | Pure client-side `useMemo` filter over cached array |
| Sort control | Component | Client-side sort state (`useState`), no API call |
| Create form validation (client-side) | Unit | Zod schema — pure function, no DOM needed |
| Create form submission | Component | MSW intercepts POST, asserts toast + list update |
| Edit pre-fill | Component | Renders form with pre-populated values from cache |
| Delete confirmation | Component | Dialog state machine (open/confirm/cancel) |
| NIT uniqueness 409 | API Integration | Requires actual DB + FluentValidation pipeline |
| Orphan contact SET NULL | API Integration | Requires actual DB cascade behavior verification |
| Deep link `/clientes/:id` | E2E | Requires real URL bar and router hydration |
| Cache invalidation | Unit | Hook spy on `queryClient.invalidateQueries` |
| Problem Details format | API Integration | HTTP response structure verification |

---

## 4. Test Cases by Priority

### P0 — Critical Path (Run on every commit)

These tests block the core user journey: a commercial team member must be able to list, create, and delete clients. Failure here means the epic cannot ship.

---

#### TC-E2-P0-01: Client List Renders All Clients from API

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-E2.1, FR1, FR2
**Risk covered:** R-E2-05 (cache population), R-E2-09 (loading state)

**Precondition:** MSW handler returns array of 3 clients from `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView` wrapped in `QueryClientProvider` and MSW.
2. Assert a loading skeleton or spinner is visible before the response resolves.
3. After MSW response resolves, assert all 3 client names appear in the list.
4. Assert each list item shows Nombre and NIT/RUC.

**Expected Result:**
- Loading indicator shown during fetch.
- All 3 clients rendered as list items with Nombre and NIT/RUC visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-02: Empty State Rendered When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 (empty state scenario)
**Risk covered:** R-E2-09

**Precondition:** MSW handler returns empty array `[]` from `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView`.
2. Assert `EmptyState` component is rendered with a message guiding user to create the first client.
3. Assert no client list items are present.

**Expected Result:**
- `EmptyState` visible with creation-prompt text.
- Zero list items in DOM.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-03: ErrorPanel with Retry When API Fails to Load

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 (backend unavailable scenario)
**Risk covered:** R-E2-09

**Precondition:** MSW handler returns 500 for `GET /api/v1/clientes`.

**Test Steps:**
1. Render `ClienteListView` with MSW network error.
2. Assert `ErrorPanel` component with "Reintentar" button is rendered.
3. Simulate click on "Reintentar" button.
4. Assert `GET /api/v1/clientes` is called a second time (retry triggered).

**Expected Result:**
- `ErrorPanel` with retry button visible.
- Retry button triggers re-fetch.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-04: Create Client — Successful Submission Adds to List

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR4, FR27
**Risk covered:** R-E2-05 (cache invalidation), R-E2-03

**Precondition:** MSW handler: `POST /api/v1/clientes` → 201 with new client; `GET /api/v1/clientes` includes the new client after invalidation.

**Test Steps:**
1. Render `ClienteListView` with initial list of 2 clients.
2. Click "Nuevo cliente".
3. Fill Nombre, NIT/RUC, Teléfono, Ciudad fields.
4. Submit form.
5. Assert success toast "Cliente creado correctamente" appears.
6. Assert the new client is visible in the list (cache invalidated and re-fetched).

**Expected Result:**
- Form submits, POST called with correct payload.
- Toast shown.
- New client visible in list immediately.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-05: Create Client — Required Field Validation Prevents Submission

**Level:** Unit (Zod schema) + Component
**Story:** 2.3
**Requirement:** AC-E2.4, FR8
**Risk covered:** R-E2-10 (schema alignment)

**Part A — Unit (Zod schema):**
1. Import `clienteSchema` from `clienteSchema.ts`.
2. Call `clienteSchema.safeParse({})` (all fields empty).
3. Assert result is `{ success: false }`.
4. Assert errors include `nombre`, `nit`, `telefono`, `ciudad`.

**Part B — Component:**
1. Render `ClienteForm`.
2. Leave all fields empty, click submit.
3. Assert inline error messages appear on each required field.
4. Assert POST was NOT called (MSW receives 0 requests).

**Expected Result:**
- Zod schema rejects empty object with errors on all 4 required fields.
- UI shows inline errors; form does not submit.

**Automation:** Vitest (unit) + Vitest + RTL + MSW (component).

---

#### TC-E2-P0-06: Delete Client — Confirmation Dialog Shown, Deletion Removes from List

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC-E2.5, FR7, FR27
**Risk covered:** R-E2-05 (cache invalidation after delete)

**Precondition:** MSW: `DELETE /api/v1/clientes/{id}` → 204; `GET /api/v1/clientes` excludes deleted client.

**Test Steps:**
1. Render client detail view for a known client.
2. Click "Eliminar".
3. Assert confirmation dialog appears with text "¿Eliminar este cliente?" and "Confirmar"/"Cancelar" buttons.
4. Click "Confirmar".
5. Assert DELETE called with correct ID.
6. Assert toast "Cliente eliminado correctamente" appears.
7. Assert deleted client is no longer in the list (cache invalidated).
8. Assert right panel returns to empty/default state.

**Expected Result:**
- Dialog lifecycle correct.
- Client removed from list post-confirmation.
- Cache invalidated; right panel cleared.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-07: API — POST /api/v1/clientes Creates Client and Returns 201

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** FR1, FR4
**Risk covered:** R-E2-01 (NIT stored), R-E2-06 (correct response shape)

**Precondition:** `WebApplicationFactory<Program>` with test PostgreSQL database.

**Test Steps:**
1. POST `{ "nombre": "Acme Corp", "nit": "900123456-7", "telefono": "3001234567", "ciudad": "Bogotá" }` to `/api/v1/clientes`.
2. Assert HTTP 201 Created.
3. Assert response body has `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 with TZ).
4. GET `/api/v1/clientes/{id}` → assert same data.

**Expected Result:**
- 201 with complete `ClienteDto` in response body.
- `createdAt` is `DateTimeOffset` ISO 8601 format (not DateTime without TZ).
- Record persisted to DB.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-08: API — DELETE /api/v1/clientes/{id} Returns 204 and Contact FK Set to Null

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** FR7, AC-2.5 (orphan contacts)
**Risk covered:** R-E2-02 (orphan contacts — critical)

**Precondition:** Seed DB with 1 client and 2 contacts having `clienteId` pointing to that client.

**Test Steps:**
1. DELETE `/api/v1/clientes/{clienteId}`.
2. Assert HTTP 204 No Content.
3. GET `/api/v1/contactos/{contactId1}` → assert `clienteId` is `null`.
4. GET `/api/v1/contactos/{contactId2}` → assert `clienteId` is `null`.
5. GET `/api/v1/clientes/{clienteId}` → assert HTTP 404.

**Expected Result:**
- Client deleted (404 on subsequent GET).
- Both contacts still exist with `clienteId = null`.
- Contacts not deleted.

**Automation:** xUnit + `WebApplicationFactory<Program>` + test DB seed.

---

#### TC-E2-P0-09: API — POST with Duplicate NIT Returns 409 with Problem Details

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-2.3 (NIT duplicate), NFR6
**Risk covered:** R-E2-01 (NIT uniqueness), R-E2-06 (no stack trace)

**Test Steps:**
1. POST client with `nit: "123456789"` → 201.
2. POST another client with same `nit: "123456789"`.
3. Assert HTTP 409 Conflict.
4. Assert response `Content-Type: application/problem+json`.
5. Assert body contains `status: 409`, `title`, `detail` including "NIT/RUC ya está registrado".
6. Assert body does NOT contain `stackTrace`, `exception`, or `innerException` keys.

**Expected Result:**
- 409 with Problem Details.
- User-friendly message about duplicate NIT.
- No internal details exposed.

**Automation:** xUnit.

---

### P1 — Important Features (Run on PR to main)

---

#### TC-E2-P1-01: Real-Time Search Filters List by Nombre

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2, FR3
**Risk covered:** R-E2-03 (< 1s filter)

**Precondition:** MSW returns 3 clients: "Acme Corp", "Beta SA", "Aceros del Valle".

**Test Steps:**
1. Render `ClienteListView`.
2. Type "Ace" in the search field.
3. Assert only "Acme Corp" and "Aceros del Valle" are visible.
4. Assert "Beta SA" is NOT in the DOM.
5. Clear search. Assert all 3 visible.

**Expected Result:**
- Real-time filter with no API re-fetch.
- Case-insensitive match on Nombre.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-02: Real-Time Search Filters List by NIT/RUC

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2, FR4
**Risk covered:** R-E2-03

**Test Steps:**
1. Render list with 3 clients having distinct NITs.
2. Type partial NIT of one client in search.
3. Assert only matching client visible; others absent.

**Expected Result:**
- Filter matches NIT/RUC substring, not just prefix.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-03: Search Returns Results in Under 1 Second with 500 Records

**Level:** Component / Performance (Vitest)
**Story:** 2.1
**Requirement:** AC-E2.2, NFR1
**Risk covered:** R-E2-03 (performance — HIGH)

**Precondition:** MSW returns array of 500 generated client objects. `useMemo` filter wired in `ClienteListView`.

**Test Steps:**
1. Render `ClienteListView` with 500 clients loaded.
2. Mark `performance.now()` before typing in search.
3. Type a search string that matches ~10 records.
4. Mark `performance.now()` after list re-renders.
5. Assert elapsed time < 150ms (< 1s NFR with comfortable margin).

**Expected Result:**
- Filter completes in < 150ms for 500 records (client-side `useMemo`).
- No API call triggered during search.

**Automation:** Vitest with `performance.now()` timing assertion.

---

#### TC-E2-P1-04: Client Detail Renders All Fields on Item Click

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** AC-2.2, FR5
**Risk covered:** R-E2-07

**Test Steps:**
1. Render `ClienteListView` + `ClienteDetailView` split panel.
2. MSW returns client with all fields populated.
3. Click a client in the list.
4. Assert right panel shows Nombre, NIT/RUC, Teléfono, Ciudad.
5. Assert URL updated to `/clientes/:clienteId` (TanStack Router).

**Expected Result:**
- All 4 fields visible in detail panel.
- URL reflects selected client ID.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-05: Deep Link to /clientes/:clienteId Loads Correct Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (direct URL access), FR30
**Risk covered:** R-E2-07

**Precondition:** Frontend dev server + backend running. Client exists in DB with known ID.

**Test Steps:**
1. Navigate browser directly to `http://localhost:5173/clientes/{knownClientId}`.
2. Assert client detail view renders with correct Nombre.
3. Assert no redirect to home, no blank page, no error.

**Expected Result:**
- Deep link hydrates correct client detail without prior navigation.

**Automation:** Playwright.

---

#### TC-E2-P1-06: Deep Link to Non-Existent clienteId Shows Not-Found Message

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 (non-existent ID graceful handling)
**Risk covered:** R-E2-07 (graceful 404)

**Test Steps:**
1. Navigate directly to `http://localhost:5173/clientes/00000000-0000-0000-0000-000000000000`.
2. Assert a not-found message is displayed.
3. Assert no JavaScript crash or blank white screen.

**Expected Result:**
- Graceful not-found UI renders.
- Navigation shell still visible.

**Automation:** Playwright.

---

#### TC-E2-P1-07: Edit Client — Form Opens Pre-Filled with Current Values

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (pre-fill), FR6
**Risk covered:** R-E2-08

**Precondition:** MSW returns a client with Nombre="Delta SA", NIT="888", Teléfono="3219876543", Ciudad="Medellín".

**Test Steps:**
1. Render detail view for the client.
2. Click "Editar".
3. Assert form opens with all fields pre-populated with current values.
4. Assert `Nombre` input value = "Delta SA", `NIT` = "888", etc.

**Expected Result:**
- All 4 fields pre-filled with exact current values.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-08: Edit Client — Cancel Preserves Original Data

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (cancel preserves data)
**Risk covered:** R-E2-08

**Test Steps:**
1. Open edit form pre-filled.
2. Change `Nombre` to "Modified Name".
3. Click "Cancelar".
4. Assert form closes and detail panel still shows "Delta SA" (original).
5. Assert no PUT request was made.

**Expected Result:**
- Original data preserved on cancel.
- No mutation triggered.

**Automation:** Vitest + RTL + MSW (assert no PUT).

---

#### TC-E2-P1-09: Edit Client — Successful Save Updates List and Detail

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC-2.4, FR6, FR27
**Risk covered:** R-E2-05 (cache invalidation on edit)

**Precondition:** MSW: `PUT /api/v1/clientes/{id}` → 200 with updated body; `GET /api/v1/clientes` returns updated list.

**Test Steps:**
1. Open edit form for a client.
2. Change `Ciudad` to "Cali".
3. Submit.
4. Assert PUT called with correct payload.
5. Assert toast "Cliente actualizado correctamente" appears.
6. Assert detail panel and list reflect updated Ciudad.

**Expected Result:**
- PUT called, cache invalidated, UI updated.
- Toast shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: Delete Client — Cancel Preserves Client Record

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-2.5 (cancel confirmation)

**Test Steps:**
1. Open client detail, click "Eliminar".
2. Assert dialog appears.
3. Click "Cancelar".
4. Assert dialog closed.
5. Assert DELETE was NOT called.
6. Assert client still appears in list.

**Expected Result:**
- Cancel aborts deletion.
- Client record unchanged.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Delete Client with Associated Contacts — Orphan Toast Shown

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC-2.5 (orphan-contact scenario)
**Risk covered:** R-E2-02

**Precondition:** MSW: `DELETE /api/v1/clientes/{id}` → 204; response or subsequent state indicates contacts were orphaned.

**Test Steps:**
1. Render detail view for a client that has 2 associated contacts.
2. Click "Eliminar" → "Confirmar".
3. Assert toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." is shown.
4. Assert client removed from list.

**Expected Result:**
- Specific orphan-contact toast message shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Sort — Nombre A→Z Sorts List Alphabetically Ascending

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6 (Nombre A→Z)

**Precondition:** List has clients: "Zeta", "Alpha", "Mango". No active search filter.

**Test Steps:**
1. Render `ClienteListView` with 3 clients.
2. Select "Nombre A→Z" from `SortControl`.
3. Assert order in DOM: "Alpha", "Mango", "Zeta".
4. Assert no additional `GET /api/v1/clientes` was called.

**Expected Result:**
- Alphabetically ascending order.
- No API re-fetch.

**Automation:** Vitest + RTL + MSW (assert request count stays at 1).

---

#### TC-E2-P1-13: Sort — Nombre Z→A Sorts List Alphabetically Descending

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (Nombre Z→A)

**Test Steps:**
1. Same setup as TC-E2-P1-12.
2. Select "Nombre Z→A".
3. Assert order: "Zeta", "Mango", "Alpha".

**Expected Result:** Descending alphabetical order. No re-fetch.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: Sort — Más Reciente and Más Antiguo Order by Creation Date

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (date-based sort)

**Precondition:** 3 clients with `createdAt`: A=2026-01-01, B=2026-06-01, C=2026-03-01.

**Test Steps:**
1. Select "Más reciente" → assert order: B, C, A.
2. Select "Más antiguo" → assert order: A, C, B.

**Expected Result:**
- Date descending ("Más reciente"): newest first.
- Date ascending ("Más antiguo"): oldest first.
- No re-fetch.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-15: Sort Applies to Already-Filtered Results Without Clearing Search

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-E2.6 (sort + filter combined), AC-2.6

**Risk covered:** R-E2-04 (sort clears filter — HIGH)

**Test Steps:**
1. Load list with 5 clients, 2 matching "Ac" search ("Acme", "Aceros"), 3 non-matching.
2. Type "Ac" in search → assert only 2 visible.
3. Select "Nombre Z→A" sort.
4. Assert search input still contains "Ac".
5. Assert only 2 filtered results shown, now in reverse-alpha order.

**Expected Result:**
- Sort applied to filtered set without clearing search.
- Both state variables (search + sort) coexist.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-16: Default Sort is "Más Reciente" on Initial Load

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC-2.6 (default sort)

**Test Steps:**
1. Render `ClienteListView` fresh with no prior sort state.
2. Assert `SortControl` shows "Más reciente" as selected.
3. Assert list is ordered newest-first by `createdAt`.

**Expected Result:**
- Default sort = `fecha-desc` ("Más reciente") applied without user interaction.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-17: API — GET /api/v1/clientes Returns List with All Expected Fields

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirement:** FR1, FR2

**Test Steps:**
1. Seed 2 clients.
2. GET `/api/v1/clientes`.
3. Assert HTTP 200.
4. Assert response is a JSON array (not wrapped object).
5. Each item has: `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601+TZ).

**Expected Result:**
- Direct array response.
- All DTO fields present with correct types.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P1-18: API — PUT /api/v1/clientes/{id} Updates and Returns 200

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirement:** FR6

**Test Steps:**
1. Seed client with `ciudad: "Bogotá"`.
2. PUT with `{ ..., ciudad: "Cali" }`.
3. Assert 200 with updated `ClienteDto`.
4. GET same ID → assert `ciudad = "Cali"`.

**Expected Result:**
- 200 with updated object.
- Persistence confirmed by subsequent GET.

**Automation:** xUnit.

---

#### TC-E2-P1-19: API — POST with Empty Required Fields Returns 400 Problem Details

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-E2.4, FR8, NFR5, NFR6
**Risk covered:** R-E2-06

**Test Steps:**
1. POST `{}` (empty body) to `/api/v1/clientes`.
2. Assert HTTP 400.
3. Assert `Content-Type: application/problem+json`.
4. Assert `errors` object contains entries for `nombre`, `nit`, `telefono`, `ciudad`.
5. Assert no `stackTrace` key in response.

**Expected Result:**
- 400 with field-level validation errors.
- Problem Details format.
- No internal details exposed.

**Automation:** xUnit.

---

### P2 — Secondary Coverage (Run nightly or weekly)

---

#### TC-E2-P2-01: SortControl Component Renders All 4 Options

**Level:** Component (Vitest + RTL)
**Story:** 2.6

**Test Steps:**
1. Render `SortControl` in isolation.
2. Assert 4 options exist: "Nombre A→Z", "Nombre Z→A", "Más reciente", "Más antiguo".

**Expected Result:** All 4 sort options visible and selectable.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-02: Edit Client — Clear Required Field Shows Inline Error, Blocks Submit

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC-2.4 (validation on edit clear), FR8

**Test Steps:**
1. Open edit form pre-filled.
2. Clear `Nombre` field.
3. Submit.
4. Assert inline error on `Nombre` field.
5. Assert PUT not called.

**Expected Result:** Validation prevents save with empty required field.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: NIT/RUC Conflict — Frontend Shows "El NIT/RUC ya está registrado" Without Technical Details

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-2.3 (409 handling), NFR6
**Risk covered:** R-E2-06

**Precondition:** MSW returns 409 `{ "status": 409, "title": "Conflict", "detail": "El NIT/RUC ya está registrado" }`.

**Test Steps:**
1. Fill form and submit.
2. MSW responds 409.
3. Assert error message "El NIT/RUC ya está registrado" shown in UI.
4. Assert no stack trace or technical error text visible.

**Expected Result:** User-friendly conflict message displayed.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: Loading State Shown During Initial Client List Fetch

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** UX — loading feedback
**Risk covered:** R-E2-09

**Precondition:** MSW delays response 200ms.

**Test Steps:**
1. Render `ClienteListView`.
2. Before response: assert loading indicator visible.
3. After response: assert loading indicator gone, list visible.

**Expected Result:** Loading state visible during fetch; disappears on data arrival.

**Automation:** Vitest + RTL + MSW with delayed response.

---

#### TC-E2-P2-05: Cache Invalidation After Create — useCreateCliente Calls invalidateQueries

**Level:** Unit (Vitest)
**Story:** 2.3
**Requirement:** FR27, NFR2
**Risk covered:** R-E2-05 (cache invalidation — critical)

**Test Steps:**
1. Spy on `queryClient.invalidateQueries`.
2. Execute `useCreateCliente` mutation `onSuccess` callback.
3. Assert `invalidateQueries({ queryKey: ['clientes'] })` was called.

**Expected Result:** `['clientes']` query key invalidated on successful create.

**Automation:** Vitest unit test with `queryClient` spy.

---

#### TC-E2-P2-06: Cache Invalidation After Delete — useDeleteCliente Calls invalidateQueries

**Level:** Unit (Vitest)
**Story:** 2.5
**Requirement:** FR27
**Risk covered:** R-E2-05

**Test Steps:**
1. Spy on `queryClient.invalidateQueries`.
2. Execute `useDeleteCliente` mutation `onSuccess` callback.
3. Assert `invalidateQueries({ queryKey: ['clientes'] })` called.

**Expected Result:** Cache invalidated after delete.

**Automation:** Vitest unit.

---

#### TC-E2-P2-07: Zod Schema Rejects Partial Payloads

**Level:** Unit (Vitest)
**Story:** 2.3/2.4
**Requirement:** FR8
**Risk covered:** R-E2-10

**Test Steps:**
1. Test `clienteSchema.safeParse({ nombre: "X" })` — all other fields empty.
2. Assert `nit`, `telefono`, `ciudad` are in the error path.
3. Test `clienteSchema.safeParse({ nombre: "X", nit: "Y", telefono: "Z", ciudad: "W" })`.
4. Assert `{ success: true }`.

**Expected Result:** Schema validates exactly the 4 required fields.

**Automation:** Vitest unit.

---

#### TC-E2-P2-08: Full CRUD E2E Round-Trip

**Level:** E2E (Playwright)
**Story:** 2.3, 2.4, 2.5
**Requirement:** FR1, FR4, FR6, FR7, FR27

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente", fill all fields, submit.
3. Assert new client appears in list.
4. Click client, click "Editar", change Ciudad, save.
5. Assert updated Ciudad in detail.
6. Click "Eliminar", confirm.
7. Assert client no longer in list.

**Expected Result:** Full CRUD lifecycle works end-to-end in browser.

**Automation:** Playwright.

---

#### TC-E2-P2-09: API — GET /api/v1/clientes/{id} Returns 404 for Non-Existent ID

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirement:** AC-2.2 (invalid ID graceful handling)
**Risk covered:** R-E2-07

**Test Steps:**
1. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.
2. Assert HTTP 404.
3. Assert Problem Details body with `status: 404`.

**Expected Result:** 404 Problem Details; no 500.

**Automation:** xUnit.

---

#### TC-E2-P2-10: API — DELETE Non-Existent Client Returns 404

**Level:** API Integration (xUnit)
**Story:** 2.5

**Test Steps:**
1. DELETE `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.
2. Assert HTTP 404.

**Expected Result:** 404 Problem Details.

**Automation:** xUnit.

---

### P3 — Nice to Have / On-Demand

---

#### TC-E2-P3-01: Sort State Persists Identifier Values Correctly in useState

**Level:** Unit (Vitest)
**Story:** 2.6

**Test Steps:**
1. Test that sort option identifiers match expected constants: `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`.
2. Verify `SortControl` maps display label to identifier correctly.

**Expected Result:** All 4 identifiers present and correctly mapped.

**Automation:** Vitest unit.

---

#### TC-E2-P3-02: E2E — Sort Persists After Page Refresh (optional UX enhancement)

**Level:** E2E (Playwright)
**Story:** 2.6

**Note:** Sort state is `useState` (local) per architecture — sort resets on refresh by design. This test validates that default sort ("Más reciente") is correctly applied after refresh.

**Test Steps:**
1. Sort to "Nombre A→Z".
2. Refresh page.
3. Assert `SortControl` shows "Más reciente" (default — reset expected per architecture).

**Expected Result:** Default sort applied on fresh load; no broken state.

**Automation:** Playwright.

---

#### TC-E2-P3-03: Client List Handles > 10 Concurrent Simulated Users (NFR3 Baseline)

**Level:** API Integration / Load (xUnit)
**Story:** 2.1
**Requirement:** NFR3 (10 simultaneous users)

**Test Steps:**
1. Fire 10 parallel `GET /api/v1/clientes` requests via `WebApplicationFactory`.
2. Assert all 10 return 200 within 2 seconds.
3. Assert no 503 or 500 responses.

**Expected Result:** All 10 concurrent requests succeed without degradation.

**Automation:** xUnit with parallel `Task.WhenAll`.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic/Story AC | Stories | Test Cases | Level | Status |
|--------------|---------|------------|-------|--------|
| AC-E2.1: Register client, appears in list immediately | 2.3 | TC-E2-P0-04, TC-E2-P0-07 | Component, API | Covered |
| AC-E2.2: Search by name/NIT < 1 second | 2.1 | TC-E2-P1-01, TC-E2-P1-02, TC-E2-P1-03 | Component | Covered |
| AC-E2.3: View detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-04, TC-E2-P1-07, TC-E2-P1-09, TC-E2-P1-18 | Component, API | Covered |
| AC-E2.4: Required fields blocked — inline errors | 2.3, 2.4 | TC-E2-P0-05, TC-E2-P2-02, TC-E2-P1-19 | Unit, Component, API | Covered |
| AC-E2.5: Delete removes from list | 2.5 | TC-E2-P0-06, TC-E2-P0-08 | Component, API | Covered |
| AC-E2.6: Sort without reload, filter preserved | 2.6 | TC-E2-P1-12–16, TC-E2-P2-01 | Component | Covered |
| AC-2.1: Empty state + error panel | 2.1 | TC-E2-P0-02, TC-E2-P0-03 | Component | Covered |
| AC-2.1: Real-time search | 2.1 | TC-E2-P1-01, TC-E2-P1-02 | Component | Covered |
| AC-2.2: Detail on click, URL update | 2.2 | TC-E2-P1-04, TC-E2-P1-05 | Component, E2E | Covered |
| AC-2.2: Direct URL access / deep link | 2.2 | TC-E2-P1-05, TC-E2-P1-06 | E2E | Covered |
| AC-2.2: Invalid clienteId graceful message | 2.2 | TC-E2-P1-06, TC-E2-P2-09 | E2E, API | Covered |
| AC-2.3: Form opens with required fields | 2.3 | TC-E2-P0-04, TC-E2-P0-05 | Component | Covered |
| AC-2.3: Success toast "Cliente creado correctamente" | 2.3 | TC-E2-P0-04 | Component | Covered |
| AC-2.3: Validation — empty required fields blocked | 2.3 | TC-E2-P0-05, TC-E2-P2-07 | Unit, Component | Covered |
| AC-2.3: NIT duplicate — 409 handled gracefully | 2.3 | TC-E2-P0-09, TC-E2-P2-03 | API, Component | Covered |
| AC-2.4: Edit form pre-filled | 2.4 | TC-E2-P1-07 | Component | Covered |
| AC-2.4: Save reflects changes immediately | 2.4 | TC-E2-P1-09, TC-E2-P1-18 | Component, API | Covered |
| AC-2.4: Required field cleared — blocked | 2.4 | TC-E2-P2-02 | Component | Covered |
| AC-2.4: Cancel preserves original data | 2.4 | TC-E2-P1-08 | Component | Covered |
| AC-2.5: Confirmation dialog shown | 2.5 | TC-E2-P0-06 | Component | Covered |
| AC-2.5: Confirmed deletion removes from list | 2.5 | TC-E2-P0-06, TC-E2-P0-08 | Component, API | Covered |
| AC-2.5: Cancel preserves record | 2.5 | TC-E2-P1-10 | Component | Covered |
| AC-2.5: Orphan contacts — SET NULL + special toast | 2.5 | TC-E2-P0-08, TC-E2-P1-11 | API, Component | Covered |
| AC-2.6: Nombre A→Z, Z→A sorts | 2.6 | TC-E2-P1-12, TC-E2-P1-13 | Component | Covered |
| AC-2.6: Más reciente / Más antiguo sort | 2.6 | TC-E2-P1-14 | Component | Covered |
| AC-2.6: Sort + active search — no clear | 2.6 | TC-E2-P1-15 | Component | Covered |
| AC-2.6: Default sort "Más reciente" | 2.6 | TC-E2-P1-16 | Component | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Test Cases | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-03 | Component (performance) |
| NFR2 | CRUD update < 2s UI | TC-E2-P0-04, TC-E2-P1-09 (invalidateQueries verifies refresh) | Component, Unit |
| NFR3 | 10 simultaneous users | TC-E2-P3-03 | API Integration (load) |
| NFR4 | HTTPS in non-local deployments | Out of scope for Epic 2 (local dev) | N/A |
| NFR5 | Input validation + sanitization | TC-E2-P0-05, TC-E2-P1-19, TC-E2-P2-07 | Unit, API |
| NFR6 | No stack traces exposed | TC-E2-P0-09, TC-E2-P1-19, TC-E2-P2-03 | API, Component |
| NFR10 | 500 client scale | TC-E2-P1-03 | Component (performance) |

---

## 7. Test Execution Order

```
Phase 1 — Build/Unit Gate (no server needed)
  1. TC-E2-P0-05 (Part A)  Zod schema blocks empty submit
  2. TC-E2-P2-07            Zod schema rejects partial payload
  3. TC-E2-P2-05            Cache invalidation — useCreateCliente
  4. TC-E2-P2-06            Cache invalidation — useDeleteCliente
  5. TC-E2-P3-01            Sort identifier constants

Phase 2 — Component Gate / P0 (MSW, no running backend)
  6.  TC-E2-P0-01  Client list renders from MSW
  7.  TC-E2-P0-02  Empty state when no clients
  8.  TC-E2-P0-03  ErrorPanel + retry on API failure
  9.  TC-E2-P0-04  Create — submit → toast → list update
 10.  TC-E2-P0-05  (Part B) Form validation prevents submit

Phase 3 — Component Gate / P0 Delete (MSW)
 11.  TC-E2-P0-06  Delete confirmation → removal from list

Phase 4 — Component Gate / P1 (MSW)
 12.  TC-E2-P1-01  Search by Nombre
 13.  TC-E2-P1-02  Search by NIT/RUC
 14.  TC-E2-P1-03  Search performance 500 records
 15.  TC-E2-P1-04  Detail view on click
 16.  TC-E2-P1-07  Edit pre-fill
 17.  TC-E2-P1-08  Edit cancel preserves data
 18.  TC-E2-P1-09  Edit save updates list
 19.  TC-E2-P1-10  Delete cancel preserves client
 20.  TC-E2-P1-11  Delete orphan-contact toast
 21.  TC-E2-P1-12  Sort A→Z
 22.  TC-E2-P1-13  Sort Z→A
 23.  TC-E2-P1-14  Sort by date
 24.  TC-E2-P1-15  Sort + filter combined
 25.  TC-E2-P1-16  Default sort Más reciente

Phase 5 — API Integration Gate / P0 (backend + DB required)
 26.  TC-E2-P0-07  POST creates 201 client
 27.  TC-E2-P0-08  DELETE 204 + orphan contacts SET NULL
 28.  TC-E2-P0-09  POST duplicate NIT → 409 Problem Details

Phase 6 — API Integration Gate / P1 (backend + DB)
 29.  TC-E2-P1-17  GET list returns correct DTO shape
 30.  TC-E2-P1-18  PUT updates and returns 200
 31.  TC-E2-P1-19  POST empty → 400 Problem Details

Phase 7 — E2E / P1 (full stack)
 32.  TC-E2-P1-05  Deep link to existing client
 33.  TC-E2-P1-06  Deep link to non-existent client → not-found

Phase 8 — P2 Supplementary
 34–43.  TC-E2-P2-01 through TC-E2-P2-10

Phase 9 — P3 / On-Demand
 44–46.  TC-E2-P3-01 through TC-E2-P3-03
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW 2+ | API mocking for component tests | Frontend |
| Playwright 1.40+ | E2E tests (deep link, CRUD round-trip) | Frontend/E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process HTTP testing | Backend |
| TestContainers (Postgres) or local test DB | Isolated DB for integration tests | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on port 5432
- Database: siesa_agents_db with clientes + contactos tables (from Epic 1/1.3 migrations + Epic 2 migration)
- Frontend dependencies installed (npm install)
- NuGet packages restored (dotnet restore)
- Playwright browsers installed (npx playwright install)
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 9 | 2.0 | 18.0 | DB seed, orphan scenario, duplicate NIT — complex setup |
| P1 | 19 | 1.0 | 19.0 | Standard coverage — search, sort, CRUD component + API |
| P2 | 10 | 0.5 | 5.0 | Supplementary validation, edge cases |
| P3 | 3 | 0.25 | 0.75 | On-demand; load test and sort constants |
| **Total** | **41** | — | **42.75 hours** | **~5.3 days** |

> Note: 4 additional sub-tests in TC-E2-P0-05 (Part A / Unit) and TC-E2-P1-14 (2 sort directions in 1 case) and TC-E2-P3-01 (identifier constants) bring the effective test count to ~45.

### Prerequisites

**Test Data Factories:**
- `ClienteFactory` — generates `ClienteEntity` with Faker-based Nombre, NIT unique, Teléfono, Ciudad
- `ContactoFactory` — generates `ContactoEntity` with nullable `ClienteId` for orphan tests

**Tooling:**
- MSW 2+ with `http.get`/`http.post`/`http.put`/`http.delete` handlers for all `/api/v1/clientes` routes
- Playwright fixtures for frontend dev server + backend startup
- xUnit shared `WebApplicationFactory` fixture with test DB isolation

**Environment:**
- `clientes` and `contactos` tables must exist (Epic 2 EF Core migration applied)
- UK constraint `uk_clientes_nit` active
- FK constraint `fk_contactos_clientes` with `ON DELETE SET NULL` active

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (all 9 P0 test cases must pass; no exceptions)
- **P1 pass rate**: ≥95% (≥18 of 19 P1 tests; failures require waiver + documented reason)
- **P2/P3 pass rate**: ≥90% (informational; may be deferred to next sprint with justification)
- **High-risk mitigations (R-E2-01, R-E2-02, R-E2-03, R-E2-05, R-E2-06)**: 100% complete before Epic 2 closure

### Coverage Targets

- **Critical paths** (CRUD lifecycle, search, sort): ≥85%
- **Security scenarios** (NFR5 validation, NFR6 no stack traces): 100%
- **Business logic** (NIT uniqueness, orphan contact handling, sort+filter combined): 100%
- **Edge cases** (empty state, error state, cancel guards, 404 deep link): ≥80%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-09)
- [ ] Orphan contact scenario verified: contacts remain with `clienteId = null` after client delete (R-E2-02)
- [ ] NIT/RUC uniqueness enforced at DB + API level with 409 response (R-E2-01)
- [ ] Search < 1s with 500 records verified (R-E2-03)
- [ ] Query cache invalidated after all mutations (R-E2-05)
- [ ] No stack traces or internal details exposed in error responses (R-E2-06)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-09)
- [ ] All P1 test cases pass or are formally deferred with documented justification
- [ ] P2 test cases pass or deferred (≥90% pass rate)
- [ ] No P0/P1 test case skipped without a documented reason
- [ ] Orphan-contact deletion scenario verified end-to-end (DB + API + frontend)
- [ ] NIT uniqueness verified in DB (uk_clientes_nit) + backend (409) + frontend (error display)
- [ ] Real-time search < 150ms for 500 records confirmed
- [ ] Sort + filter combination verified (no search clear on sort change)
- [ ] All mutation hooks call `queryClient.invalidateQueries(['clientes'])`

---

## 10. Mitigation Plans

### R-E2-01: NIT Uniqueness Not Enforced (Score: 6)

**Mitigation Strategy:** Enforce at three layers:
1. PostgreSQL: `uk_clientes_nit` unique index (already in architecture)
2. Backend: `CreateClienteRequestValidator.cs` unique check + `ExceptionHandlingMiddleware` maps duplicate key exception → 409
3. Frontend: `ClienteForm.tsx` displays 409 error as "El NIT/RUC ya está registrado"

**Owner:** DEV (backend) + QA (TC-E2-P0-09 verification)
**Timeline:** Sprint 2
**Verification:** TC-E2-P0-09 and TC-E2-P2-03

---

### R-E2-02: Orphan Contacts Corrupted on Delete (Score: 6)

**Mitigation Strategy:** Verify `ON DELETE SET NULL` cascade on `fk_contactos_clientes` FK is applied in `ContactoConfiguration.cs` (EF Core `OnDelete(DeleteBehavior.SetNull)`). Test at API layer seeds contacts, deletes client, asserts contacts have `clienteId = null`.

**Owner:** DEV (EF Core config) + QA (TC-E2-P0-08 verification)
**Timeline:** Sprint 2
**Verification:** TC-E2-P0-08 (API) and TC-E2-P1-11 (frontend toast)

---

### R-E2-03: Filter Performance < 1s with 500 Records (Score: 6)

**Mitigation Strategy:** Architecture mandates client-side `useMemo` filter over in-memory TanStack Query cache. The `useMemo` recomputes only when `clients` array or `searchQuery` changes. With 500 items, this is < 50ms in modern V8. Test with 500 generated objects and `performance.now()` assertion at < 150ms threshold.

**Owner:** DEV (useMemo implementation) + QA (TC-E2-P1-03)
**Timeline:** Sprint 2
**Verification:** TC-E2-P1-03

---

### R-E2-05: Query Cache Not Invalidated After Mutations (Score: 6)

**Mitigation Strategy:** All mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must include `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] })` per architecture enforcement rules. Unit tests spy on `queryClient.invalidateQueries`.

**Owner:** DEV (mutation hooks) + QA (TC-E2-P2-05, TC-E2-P2-06)
**Timeline:** Sprint 2
**Verification:** TC-E2-P2-05 and TC-E2-P2-06

---

### R-E2-06: Stack Traces Exposed in Error Responses (Score: 6)

**Mitigation Strategy:** `ExceptionHandlingMiddleware.cs` (implemented in Epic 1, TC-E1-P0-05 verified) must cover all 400/409/404 error paths. FluentValidation errors mapped to Problem Details 400. Domain conflict exceptions mapped to 409. Integration tests assert no `stackTrace` key in any error response.

**Owner:** DEV (middleware already in Epic 1) + QA (TC-E2-P0-09, TC-E2-P1-19)
**Timeline:** Sprint 2 (carried from Epic 1 infrastructure)
**Verification:** TC-E2-P0-09 and TC-E2-P1-19

---

## 11. Assumptions and Dependencies

### Assumptions

1. Epic 1 is complete: `siesa_agents_db` exists, `ExceptionHandlingMiddleware` is active, frontend builds with TypeScript strict mode.
2. Epic 2 migration adds `clientes` table with `uk_clientes_nit` unique index and `contactos` table with `fk_contactos_clientes ON DELETE SET NULL`.
3. `ClienteContactServiceAdapter` (siesa-ui-kit ContactManager integration) is out of scope for this epic — tested in Epic 4.
4. No authentication is required (MVP scope); all API endpoints are publicly accessible.
5. Sort is entirely client-side (`useState`) — no sort parameters sent to backend.

### Dependencies

1. EF Core migration for `clientes` table — required before API integration tests can run
2. MSW 2+ handler configuration for all 5 `/api/v1/clientes` endpoints — required before component tests
3. `WebApplicationFactory<Program>` shared fixture with test database isolation — required before backend integration tests
4. Playwright browser installation (`npx playwright install`) — required before E2E tests

### Known Risks to Plan

- **Risk**: PostgreSQL `ON DELETE SET NULL` not configured in EF Core `ContactoConfiguration.cs`
  - **Impact**: R-E2-02 becomes a production data-loss issue
  - **Contingency**: Code review checklist item; TC-E2-P0-08 fails early to catch this

- **Risk**: `SortControl` component does not exist yet in `src/shared/components/`
  - **Impact**: Story 2.6 blocked
  - **Contingency**: Story 2.6 includes SortControl implementation as part of delivery; TC-E2-P2-01 validates the component in isolation

---

## 12. Follow-on Workflows (Manual)

- Run `*atdd` per story (2.1–2.6) to generate failing tests before implementation (red phase of TDD cycle).
- Run `*automate` after implementation to expand coverage for edge cases not captured in ATDD.
- Run `*trace` after Epic 2 completion to generate traceability matrix linking FR1–FR8 and NFR1/2/5/6 to passing tests.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: — Date: —
- [ ] Tech Lead: — Date: —
- [ ] QA Lead: — Date: —

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories: TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` — Risk scoring methodology (Probability × Impact)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision framework
- `test-priorities-matrix.md` — P0-P3 prioritization criteria

### Related Documents

- PRD — `_bmad-output/planning-artifacts/prd/`
- Epic 2 — `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture — `_bmad-output/planning-artifacts/architecture.md`
- Test Design Epic 1 — `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Epic**: 2 — Client Management
**Mode**: Epic-Level (Phase 4)
