---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-05-25"
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

Epic 2 delivers the full CRUD lifecycle for the `clientes` entity: list with real-time search, detail view with deep linking, create/edit form with validation, delete with confirmation dialog, and client-side sort without re-fetch. The split-panel layout (`ClienteListView` 280px + `ClienteDetailView` flex) and the `SortControl` component are first introduced here. All operations must comply with FR27 (immediate visibility), NFR1 (search < 1s / 500 records), and NFR2 (CRUD < 2s).

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Pagination-free list, real-time filter, EmptyState, ErrorPanel + retry |
| 2.2 | Client Detail View | Detail panel, deep link `/clientes/:clienteId`, 404 for unknown id |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), 409 duplicate NIT/RUC, toast, FR27 |
| 2.4 | Edit Client | Pre-filled form, save/cancel, inline validation, FR27 |
| 2.5 | Delete Client | Confirmation dialog, FR27 removal, orphan contacts → clienteId=null, toast |
| 2.6 | Sort Client List | Client-side sort over cache (nombre-asc/desc, fecha-desc/asc), preserves search filter |

### Out of Scope for This Epic

- Contact management panel inside client detail (Epic 4)
- Authentication / authorization (deferred)
- Server-side pagination (NFR10 / NFR11 — 500 records max in MVP)
- Contact association endpoints (Epic 3/4)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **TanStack Query cache invalidation missing** after create/edit/delete — list does not reflect changes, violating FR27 | High | Critical | P0 | Integration test: after mutation, assert `['clientes']` queryKey is invalidated and refetch returns updated list |
| R2 | **Zod + FluentValidation dual-validation gap** — frontend allows submission of invalid data that backend rejects without a user-friendly error message | High | High | P0 | Unit tests for `clienteSchema.ts` + integration test verifying 400 response is surfaced as inline error (not raw JSON) |
| R3 | **409 Duplicate NIT/RUC not handled on frontend** — backend returns 409 but frontend shows a generic error or nothing | Medium | High | P0 | Integration test: mock 409 response, assert "El NIT/RUC ya está registrado" message appears in the form |
| R4 | **Delete with associated contacts** — `ON DELETE SET NULL` not wired in EF Core `ContactoConfiguration`, causing FK constraint violation on delete | Medium | Critical | P0 | API integration test: create client with contact, delete client, assert 204 and contact's `clienteId` is null |
| R5 | **Real-time search filter performance** degraded above 300 records — `useMemo` recomputed on every keystroke without debounce | Medium | Medium | P1 | Component test: render 500-item list, assert filter result appears within 1000ms (NFR1) |
| R6 | **SortControl + active search filter interaction** — changing sort clears the search input or triggers a re-fetch | Medium | Medium | P1 | Component test: apply search, change sort, assert search input unchanged and no API call issued |
| R7 | **Deep link `/clientes/:clienteId`** — TanStack Router not loading client by ID on direct URL access, or showing the wrong panel | Medium | High | P1 | E2E test: navigate directly to `/clientes/{uuid}`, assert detail panel shows correct client data |
| R8 | **EmptyState not rendered when no clients exist** — conditional render missing or wrong guard | Low | Medium | P2 | Component test: render `ClienteListView` with empty array, assert EmptyState component is visible |
| R9 | **ErrorPanel + "Reintentar" not rendered on API failure** — error boundary or query error state not wired | Low | Medium | P2 | Component test: mock fetch rejection, assert ErrorPanel with retry button is displayed |
| R10 | **Toast messages absent or in wrong language** — success/error toasts hardcoded in English or not triggered | Low | Medium | P2 | Component tests for each mutation: assert Spanish toast text on success and error paths |
| R11 | **Cancel button on Edit form** does not restore original data — state mutation of form fields persists after cancel | Low | Medium | P2 | Component test: open edit form, change fields, click cancel, assert detail panel shows original values |

### Top 3 Risk Areas for Epic 2

1. **FR27 cache invalidation** (R1) — the most pervasive risk; any of the 3 mutation hooks missing `invalidateQueries(['clientes'])` renders the list stale after create/edit/delete, breaking the core visibility requirement.
2. **Delete with orphan contacts** (R4) — if `ON DELETE SET NULL` is not configured in EF Core, every client with contacts will throw a 500 FK constraint error on delete, making the delete feature completely non-functional for real data.
3. **Dual-validation gap** (R2) — Zod validates on the frontend, FluentValidation on the backend; if they are inconsistent, a user may be blocked by a backend 400/409 with no readable inline error, violating AC-E2.4.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)           ▌▌▌▌▌▌          3 tests
  API Integration (xUnit)    ▌▌▌▌▌▌▌▌▌▌▌▌▌  13 tests
  Component (Vitest+RTL)     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 14 tests
  Unit (Vitest/xUnit)        ▌▌▌▌▌▌▌▌        8 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                        38 tests
```

### Rationale

- **API integration tests dominate** because the five backend command/query handlers (Create, Update, Delete, GetList, GetById) each require full round-trip validation including FluentValidation, conflict detection, and cascade behavior.
- **Component tests are extensive** because the split-panel UI has multiple interactive states (empty, error, loaded, form open, form validation, sort + search interaction) that are faster and more reliable to test at component level than E2E.
- **E2E tests focus on deep linking and end-to-end CRUD** — scenarios that require browser navigation and real URL changes.
- **Unit tests** cover `clienteSchema.ts` (Zod validation rules) and domain entity behavior independently.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: TanStack Query Cache Invalidated After Create

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR27, AC-E2.1
**Risk covered:** R1

**Precondition:** `useCreateCliente` mutation hook wired. MSW intercepts `POST /api/v1/clientes` returning `201` with the new client object.

**Test Steps:**
1. Render `ClienteListView` wrapping `QueryClientProvider`.
2. MSW seeds GET `/api/v1/clientes` with 2 existing clients.
3. Open the create form and fill in all required fields (Nombre, NIT/RUC, Teléfono, Ciudad).
4. Submit the form.
5. Wait for mutation `onSuccess` to fire.
6. Assert `queryClient.getQueryState(['clientes'])` has been invalidated (or assert list re-rendered with the new client).

**Expected Result:**
- The new client appears in the list immediately without manual refresh.
- `queryClient.invalidateQueries({ queryKey: ['clientes'] })` was called.
- Toast "Cliente creado correctamente" is visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-02: TanStack Query Cache Invalidated After Update

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** FR27, AC-E2.3
**Risk covered:** R1

**Precondition:** `useUpdateCliente` mutation hook wired. MSW intercepts `PUT /api/v1/clientes/{id}` returning `200` with updated client.

**Test Steps:**
1. Render detail view with a pre-loaded client.
2. Click "Editar", modify the Nombre field.
3. Submit the form.
4. Assert the updated Nombre appears in both the detail panel and the list panel.

**Expected Result:**
- Updated Nombre reflected immediately in the UI.
- Toast "Cliente actualizado correctamente" is visible.
- No full page reload occurred.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-03: TanStack Query Cache Invalidated After Delete

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** FR27, AC-E2.5
**Risk covered:** R1

**Precondition:** `useDeleteCliente` mutation hook wired. MSW intercepts `DELETE /api/v1/clientes/{id}` returning `204`.

**Test Steps:**
1. Render view with a client selected in the detail panel.
2. Click "Eliminar", confirm in the dialog.
3. Assert the client is removed from the list.
4. Assert the right panel returns to the default/empty state.

**Expected Result:**
- Client no longer appears in the list.
- Right panel shows empty/default state.
- Toast "Cliente eliminado correctamente" is visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-04: Zod Schema Rejects Empty Required Fields

**Level:** Unit
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** `clienteSchema.ts` Zod schema imported.

**Test Steps:**
1. Call `clienteSchema.safeParse({})` with empty object.
2. Call `clienteSchema.safeParse({ nombre: 'Test' })` with missing NIT/RUC, Teléfono, Ciudad.
3. Call `clienteSchema.safeParse({ nombre: 'Test', nit: '123456', telefono: '3001234567', ciudad: 'Bogotá' })` with all fields.

**Expected Result:**
- Empty object: `success: false` with errors on all 4 required fields (nombre, nit, telefono, ciudad).
- Partial input: `success: false` with errors only on missing fields.
- Complete input: `success: true`.

**Automation:** Vitest unit test.

---

#### TC-E2-P0-05: Backend Rejects Empty Required Fields — FluentValidation Returns 400

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC-E2.4, FR8, NFR5
**Risk covered:** R2

**Precondition:** Backend running via `WebApplicationFactory<Program>`.

**Test Steps:**
1. POST `{ "nombre": "", "nit": "", "telefono": "", "ciudad": "" }` to `/api/v1/clientes`.
2. POST `{ "nombre": "ACME", "nit": "" }` to `/api/v1/clientes` (partial).

**Expected Result:**
- Both requests return HTTP 400.
- Response `Content-Type: application/problem+json`.
- Problem Details body contains `errors` object with field-level validation messages.
- No raw exception or stack trace in response.

**Automation:** xUnit + `WebApplicationFactory<Program>`.

---

#### TC-E2-P0-06: Backend Returns 409 on Duplicate NIT/RUC

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** AC from Story 2.3 (409 conflict), NFR6
**Risk covered:** R3

**Precondition:** Client with NIT `123456789` already in database (TestContainers Postgres).

**Test Steps:**
1. POST `{ "nombre": "Empresa B", "nit": "123456789", "telefono": "3001234567", "ciudad": "Medellín" }` to `/api/v1/clientes`.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- `detail` field contains human-readable message (no stack trace, no raw SQL).

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P0-07: Frontend Surfaces 409 as Inline Form Error

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC from Story 2.3 (409 frontend handling), NFR6
**Risk covered:** R3

**Precondition:** MSW intercepts `POST /api/v1/clientes` and returns 409.

**Test Steps:**
1. Render the create client form.
2. Fill all required fields with a duplicate NIT.
3. Submit the form.
4. Assert error message "El NIT/RUC ya está registrado" is displayed in the form.
5. Assert no technical error details are shown to the user.

**Expected Result:**
- Inline error message "El NIT/RUC ya está registrado" visible.
- Form remains open (not dismissed on error).
- No toast with technical error content.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-08: Delete Client with Associated Contacts Returns 204 and Sets clienteId to Null

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** AC from Story 2.5 (orphan contacts), FR23
**Risk covered:** R4

**Precondition:** Database (TestContainers) has client C1 with 2 associated contacts CO1 and CO2.

**Test Steps:**
1. DELETE `/api/v1/clientes/{C1.id}`.
2. GET `/api/v1/contactos/{CO1.id}` and `/api/v1/contactos/{CO2.id}`.

**Expected Result:**
- DELETE returns 204 No Content.
- Client C1 is removed: GET `/api/v1/clientes/{C1.id}` returns 404.
- CO1.clienteId is `null`.
- CO2.clienteId is `null`.
- Contacts CO1 and CO2 still exist (not deleted).

**Automation:** xUnit + TestContainers.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: Create Client — Full Happy Path API Integration

**Level:** API Integration (xUnit)
**Story:** 2.3
**Requirement:** FR1, FR4, AC-E2.1

**Test Steps:**
1. POST `{ "nombre": "ACME S.A.", "nit": "900123456-1", "telefono": "6014567890", "ciudad": "Bogotá" }` to `/api/v1/clientes`.
2. GET `/api/v1/clientes`.

**Expected Result:**
- POST returns 201 with created object containing `id` (UUID), all fields, `createdAt` (DateTimeOffset ISO 8601).
- GET list includes the newly created client.

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P1-02: Get Client List Returns All Clients

**Level:** API Integration (xUnit)
**Story:** 2.1
**Requirement:** FR1, FR2

**Test Steps:**
1. Seed 5 clients in test database.
2. GET `/api/v1/clientes`.

**Expected Result:**
- HTTP 200.
- Response is a JSON array (no wrapper) with 5 items.
- Each item contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P1-03: Get Client by ID Returns Correct Client

**Level:** API Integration (xUnit)
**Story:** 2.2
**Requirement:** FR3, AC from Story 2.2 (deep link)

**Test Steps:**
1. Seed client with known ID.
2. GET `/api/v1/clientes/{id}`.
3. GET `/api/v1/clientes/{nonexistent-uuid}`.

**Expected Result:**
- First request: 200 with correct client data.
- Second request: 404 with Problem Details body.

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P1-04: Update Client — Happy Path API Integration

**Level:** API Integration (xUnit)
**Story:** 2.4
**Requirement:** FR5, FR6

**Test Steps:**
1. Seed client C1.
2. PUT `/api/v1/clientes/{C1.id}` with `{ "nombre": "ACME Modificado", "nit": "900123456-1", "telefono": "3002222222", "ciudad": "Cali" }`.
3. GET `/api/v1/clientes/{C1.id}`.

**Expected Result:**
- PUT returns 200 with updated client object.
- GET returns updated values including new `updatedAt` timestamp.
- `updatedAt` > `createdAt`.

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P1-05: Delete Client — No Associated Contacts

**Level:** API Integration (xUnit)
**Story:** 2.5
**Requirement:** FR7 (implied), AC-E2.5

**Test Steps:**
1. Seed client C1 with no contacts.
2. DELETE `/api/v1/clientes/{C1.id}`.
3. GET `/api/v1/clientes/{C1.id}`.

**Expected Result:**
- DELETE returns 204 No Content.
- GET returns 404.

**Automation:** xUnit + TestContainers.

---

#### TC-E2-P1-06: Real-Time Search Filter — Filters List Without API Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-E2.2, FR2, NFR1

**Precondition:** MSW seeds GET `/api/v1/clientes` with 10 clients including "ACME S.A." (NIT: 900100001) and "Beta Corp" (NIT: 900200002).

**Test Steps:**
1. Render `ClienteListView`.
2. Type "ACME" into the search input.
3. Assert list shows only items matching "ACME".
4. Assert MSW did NOT receive a second GET request to `/api/v1/clientes`.
5. Clear the input.
6. Assert the full list is restored.

**Expected Result:**
- Filtering is purely client-side (no additional API call).
- Only matching clients visible while filter active.
- Full list restored on clear.

**Automation:** Vitest + RTL + MSW (request count assertion).

---

#### TC-E2-P1-07: Search Filter by NIT/RUC

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-E2.2, FR2

**Test Steps:**
1. Render `ClienteListView` with clients including one with NIT "900123456-1".
2. Type "900123456" into search input.
3. Assert only the matching client appears.

**Expected Result:**
- List filters by NIT/RUC partial match.
- No API call triggered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Deep Link to /clientes/:clienteId Loads Correct Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC from Story 2.2, FR3, FR30

**Precondition:** Frontend and backend running. Client with known UUID exists in database.

**Test Steps:**
1. Navigate directly in browser to `http://localhost:5173/clientes/{known-uuid}`.
2. Wait for page to render.
3. Assert the detail panel displays the client's Nombre, NIT/RUC, Teléfono, Ciudad.
4. Assert the URL is still `/clientes/{known-uuid}` (no redirect).

**Expected Result:**
- Correct client detail is displayed without navigating through the list first.
- No blank panel or error state.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-09: Deep Link to /clientes/:nonExistentId Shows Not-Found Message

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC from Story 2.2 (graceful not-found)

**Test Steps:**
1. Navigate directly to `http://localhost:5173/clientes/00000000-0000-0000-0000-000000000000`.
2. Assert a not-found message is displayed.
3. Assert the application shell (navigation) is still visible.

**Expected Result:**
- Not-found message rendered.
- No JS exception thrown.
- NavigationRail/NavigationBar still visible.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-10: SortControl Sorts by Nombre A→Z Without API Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC from Story 2.6, AC-E2.6

**Precondition:** List loaded with clients: "Zebra Corp", "ACME", "Beta Ltd".

**Test Steps:**
1. Render `ClienteListView` with above clients.
2. Select "Nombre A→Z" from SortControl.
3. Assert list order: ACME → Beta Ltd → Zebra Corp.
4. Assert no additional GET request was made to `/api/v1/clientes`.

**Expected Result:**
- Alphabetical ascending order applied.
- No API call triggered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: SortControl Sort Preserved Over Active Search Filter

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC from Story 2.6 (sort + filter coexistence), AC-E2.6

**Test Steps:**
1. Render with 5 clients. Type "Corp" in search (2 results).
2. Select "Nombre Z→A" from SortControl.
3. Assert the 2 filtered results are sorted Z→A.
4. Assert the search input still contains "Corp".
5. Assert no additional GET request triggered.

**Expected Result:**
- Sort applied on top of filtered set.
- Search input not cleared.
- No re-fetch.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Default Sort Order is "Más reciente"

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC from Story 2.6 (default sort)

**Test Steps:**
1. Render `ClienteListView` for the first time (no sort preference set).
2. Assert SortControl displays "Más reciente" as the selected option.
3. Assert the list order matches fecha-desc (newest `createdAt` first).

**Expected Result:**
- SortControl defaults to `fecha-desc`.
- List order reflects newest first.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-13: Edit Form Pre-Filled with Current Client Values

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC from Story 2.4, FR6

**Test Steps:**
1. Render `ClienteDetailView` with client `{ nombre: "ACME", nit: "900123456-1", telefono: "6014567890", ciudad: "Bogotá" }`.
2. Click "Editar".
3. Assert form fields are pre-filled with the current values.

**Expected Result:**
- Nombre input value: "ACME".
- NIT input value: "900123456-1".
- Teléfono input value: "6014567890".
- Ciudad input value: "Bogotá".

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-14: Cancel Edit Does Not Change Client Data

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC from Story 2.4 (cancel without save)
**Risk covered:** R11

**Test Steps:**
1. Render `ClienteDetailView` with client data.
2. Click "Editar", change Nombre to "Modified Name".
3. Click "Cancelar".
4. Assert detail panel shows original Nombre (not "Modified Name").

**Expected Result:**
- Detail panel unchanged.
- Form closed.
- No mutation called.

**Automation:** Vitest + RTL.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: EmptyState Displayed When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC from Story 2.1 (empty state)
**Risk covered:** R8

**Test Steps:**
1. MSW returns empty array `[]` for GET `/api/v1/clientes`.
2. Render `ClienteListView`.
3. Assert `EmptyState` component is visible.
4. Assert the EmptyState contains guidance text prompting the user to create the first client.

**Expected Result:**
- EmptyState rendered.
- No list items visible.
- Guidance message in Spanish.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-02: ErrorPanel with "Reintentar" Displayed on Fetch Failure

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC from Story 2.1 (error state)
**Risk covered:** R9

**Test Steps:**
1. MSW intercepts GET `/api/v1/clientes` and returns network error.
2. Render `ClienteListView`.
3. Assert `ErrorPanel` component is visible with a "Reintentar" button.
4. Click "Reintentar" button.
5. Assert a new GET request is made to `/api/v1/clientes`.

**Expected Result:**
- ErrorPanel rendered on fetch failure.
- Retry button triggers a new fetch.
- No raw error message exposed.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Create Success Toast — Spanish Text

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC from Story 2.3 (toast), company standard (Spanish UI)
**Risk covered:** R10

**Test Steps:**
1. MSW returns 201 for POST `/api/v1/clientes`.
2. Submit valid create form.
3. Assert toast appears with text "Cliente creado correctamente".

**Expected Result:**
- Toast visible with exact Spanish text.
- No English text in toast.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: Update Success Toast — Spanish Text

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC from Story 2.4 (toast), company standard
**Risk covered:** R10

**Test Steps:**
1. MSW returns 200 for PUT `/api/v1/clientes/{id}`.
2. Submit valid edit form.
3. Assert toast "Cliente actualizado correctamente".

**Expected Result:**
- Toast with exact Spanish text.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-05: Delete Success Toast — Spanish Text, Orphan Note When Contacts Present

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC from Story 2.5 (toast with orphan message)
**Risk covered:** R10

**Test Steps:**
1. Scenario A: MSW returns 204, client has no contacts. Confirm delete. Assert toast "Cliente eliminado correctamente".
2. Scenario B: MSW returns 204 with metadata indicating orphan contacts. Assert toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

**Expected Result:**
- Correct Spanish toast for each scenario.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: Delete Confirmation Dialog — Cancel Keeps Client

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC from Story 2.5 (cancel delete)

**Test Steps:**
1. Click "Eliminar" on a client.
2. Assert confirmation dialog appears with "¿Eliminar este cliente?" text and "Confirmar" + "Cancelar" buttons.
3. Click "Cancelar".
4. Assert dialog closed and the client is still in the list.
5. Assert no DELETE request was made.

**Expected Result:**
- Dialog closed.
- Client unchanged.
- No API call.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-07: SortControl Sorts by Fecha Ascendente and Descendente

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC from Story 2.6 (Más reciente / Más antiguo)

**Test Steps:**
1. Render list with clients having different `createdAt` values.
2. Select "Más reciente" — assert newest first.
3. Select "Más antiguo" — assert oldest first.

**Expected Result:**
- Both date-based sort options produce correct order.
- No API call triggered.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-08: Inline Validation Error on Empty Required Field at Submit

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8

**Test Steps:**
1. Open create form.
2. Leave Nombre empty, fill remaining fields.
3. Click submit.
4. Assert inline error message appears under Nombre field.
5. Assert no API call was made.

**Expected Result:**
- Inline error under empty field.
- Form not submitted.
- Error message in Spanish.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-09: Search Performance — 500-Record Filter Under 1 Second

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** NFR1, AC-E2.2
**Risk covered:** R5

**Test Steps:**
1. Seed `ClienteListView` with 500 synthetic client objects.
2. Start timer. Type "xyz" in search input. Stop timer when list re-renders.
3. Assert elapsed time < 1000ms.

**Expected Result:**
- Filtered result rendered in under 1 second.

**Automation:** Vitest + RTL (performance timing).

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: E2E Create Client Full Flow

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, FR4

**Test Steps:**
1. Navigate to `/clientes`.
2. Click "Nuevo cliente".
3. Fill form (Nombre, NIT/RUC, Teléfono, Ciudad).
4. Submit.
5. Assert client appears in list and detail panel loads.

**Expected Result:**
- Client visible in list immediately.
- Detail panel shows new client data.
- Toast visible.

**Automation:** Playwright E2E.

---

#### TC-E2-P3-02: Nombre Z→A Sort Applied Correctly

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC from Story 2.6 (Nombre Z→A)

**Test Steps:**
1. Render with clients "ACME", "Zebra Corp", "Beta Ltd".
2. Select "Nombre Z→A".
3. Assert order: Zebra Corp → Beta Ltd → ACME.

**Automation:** Vitest + RTL.

---

#### TC-E2-P3-03: Update Client — Backend Rejects Duplicate NIT on Edit

**Level:** API Integration (xUnit)
**Story:** 2.4

**Test Steps:**
1. Create clients C1 (NIT: A) and C2 (NIT: B).
2. PUT `/api/v1/clientes/{C2.id}` with NIT changed to A.

**Expected Result:**
- HTTP 409 Conflict.
- Problem Details body with clear conflict message.

**Automation:** xUnit + TestContainers.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register new client, appears in list immediately | 2.3 | TC-E2-P0-01, TC-E2-P1-01, TC-E2-P3-01 | Covered |
| AC-E2.2: Search by name or NIT/RUC, results < 1 second | 2.1 | TC-E2-P1-06, TC-E2-P1-07, TC-E2-P2-09 | Covered |
| AC-E2.3: View detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P0-02, TC-E2-P1-04, TC-E2-P1-13 | Covered |
| AC-E2.4: System prevents saving with empty required fields | 2.3, 2.4 | TC-E2-P0-04, TC-E2-P0-05, TC-E2-P2-08 | Covered |
| AC-E2.5: Delete client, removed from list | 2.5 | TC-E2-P0-03, TC-E2-P1-05 | Covered |
| AC-E2.6: Sort list by 4 criteria without reload or losing filter | 2.6 | TC-E2-P1-10, TC-E2-P1-11, TC-E2-P1-12, TC-E2-P2-07, TC-E2-P3-02 | Covered |

---

## 6. Story-Level AC Coverage

| Story | AC | Test Cases |
|-------|----|-----------|
| 2.1 — List & Search | Left panel scrollable list with Nombre + NIT | TC-E2-P1-02, TC-E2-P1-06 |
| 2.1 | Real-time filter, results < 1s, up to 500 records | TC-E2-P1-06, TC-E2-P1-07, TC-E2-P2-09 |
| 2.1 | EmptyState when no clients | TC-E2-P2-01 |
| 2.1 | ErrorPanel + Reintentar on backend unavailable | TC-E2-P2-02 |
| 2.2 — Detail View | Right panel shows full detail on click, URL → `/clientes/:id` | TC-E2-P1-08 |
| 2.2 | Direct URL access loads correct client | TC-E2-P1-08 |
| 2.2 | Not-found graceful message for unknown clienteId | TC-E2-P1-09 |
| 2.3 — Create | Form opens with all 4 required fields | TC-E2-P2-08 |
| 2.3 | Successful create → list + toast | TC-E2-P0-01, TC-E2-P1-01, TC-E2-P2-03 |
| 2.3 | Required fields validation — inline errors, no submit | TC-E2-P0-04, TC-E2-P0-05, TC-E2-P2-08 |
| 2.3 | Duplicate NIT/RUC → "El NIT/RUC ya está registrado" | TC-E2-P0-06, TC-E2-P0-07 |
| 2.4 — Edit | Form pre-filled with current values | TC-E2-P1-13 |
| 2.4 | Save → reflected immediately + toast | TC-E2-P0-02, TC-E2-P1-04, TC-E2-P2-04 |
| 2.4 | Required field cleared → inline error, no submit | TC-E2-P0-04, TC-E2-P2-08 |
| 2.4 | Cancel → no change | TC-E2-P1-14 |
| 2.5 — Delete | Confirmation dialog appears | TC-E2-P2-06 |
| 2.5 | Confirm → removed from list + right panel empty + toast | TC-E2-P0-03, TC-E2-P1-05, TC-E2-P2-05 |
| 2.5 | Cancel dialog → client unchanged | TC-E2-P2-06 |
| 2.5 | Delete with contacts → contacts `clienteId=null`, remain in system | TC-E2-P0-08 |
| 2.6 — Sort | Nombre A→Z without API call | TC-E2-P1-10 |
| 2.6 | Nombre Z→A | TC-E2-P3-02 |
| 2.6 | Más reciente / Más antiguo | TC-E2-P2-07 |
| 2.6 | Sort preserves active search filter | TC-E2-P1-11 |
| 2.6 | Default sort = Más reciente | TC-E2-P1-12 |

---

## 7. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-06, TC-E2-P2-09 | Component |
| NFR2 | CRUD < 2s UI update | TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-03 (TanStack Query invalidation asserted) | Component |
| NFR5 | Input validation + sanitization | TC-E2-P0-04, TC-E2-P0-05, TC-E2-P2-08 | Unit + API Integration |
| NFR6 | No stack traces exposed | TC-E2-P0-06, TC-E2-P0-07 (Problem Details only) | API Integration + Component |
| NFR7 | Core tasks without training | Covered by EmptyState (TC-E2-P2-01) and form validation (TC-E2-P2-08) | Component |

---

## 8. Test Execution Order

```
Phase 1 — Unit Gate (P0, no backend needed)
  1. TC-E2-P0-04   Zod schema rejects empty fields

Phase 2 — Backend API Gate (P0, TestContainers)
  2. TC-E2-P0-05   FluentValidation 400 response
  3. TC-E2-P0-06   409 Duplicate NIT/RUC
  4. TC-E2-P0-08   Delete with contacts → orphan SET NULL
  5. TC-E2-P1-01   Create client happy path
  6. TC-E2-P1-02   Get client list
  7. TC-E2-P1-03   Get by ID + 404 for unknown
  8. TC-E2-P1-04   Update client
  9. TC-E2-P1-05   Delete client (no contacts)
 10. TC-E2-P3-03   Update with duplicate NIT → 409

Phase 3 — Component Gate (P0, MSW mocks)
 11. TC-E2-P0-01   Cache invalidated after create
 12. TC-E2-P0-02   Cache invalidated after update
 13. TC-E2-P0-03   Cache invalidated after delete
 14. TC-E2-P0-07   409 surfaces as inline error
 15. TC-E2-P1-06   Real-time search — no API call
 16. TC-E2-P1-07   Search by NIT
 17. TC-E2-P1-10   Sort A→Z no API call
 18. TC-E2-P1-11   Sort preserves search filter
 19. TC-E2-P1-12   Default sort = Más reciente
 20. TC-E2-P1-13   Edit form pre-filled
 21. TC-E2-P1-14   Cancel edit — no change
 22. TC-E2-P2-01   EmptyState
 23. TC-E2-P2-02   ErrorPanel + retry
 24. TC-E2-P2-03   Create toast Spanish
 25. TC-E2-P2-04   Update toast Spanish
 26. TC-E2-P2-05   Delete toast (with/without orphans)
 27. TC-E2-P2-06   Cancel delete dialog
 28. TC-E2-P2-07   Sort by date asc/desc
 29. TC-E2-P2-08   Inline validation error
 30. TC-E2-P2-09   500-record filter < 1s
 31. TC-E2-P3-02   Sort Nombre Z→A

Phase 4 — E2E Gate (Playwright, full stack)
 32. TC-E2-P1-08   Deep link to /clientes/:id
 33. TC-E2-P1-09   Deep link unknown id → not-found
 34. TC-E2-P3-01   E2E create client full flow
```

---

## 9. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW 2+ | API mocking for component tests | Frontend |
| React Hook Form (test utils) | Form state simulation | Frontend |
| Playwright 1.40+ | E2E tests (deep linking, full CRUD flow) | Frontend/E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| Bogus / AutoFixture | Test data generation (500-client seeding) | Backend + Frontend |

### Environment Prerequisites

```
- Node.js 20+ with pnpm (mandatory — NOT npm or yarn)
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432
- Docker (for TestContainers in CI)
- Epic 1 complete: clientes table exists (migration from Epic 1 backend foundation)
- pnpm install && dotnet restore executed
```

---

## 9b. Resource Estimates

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 8 | 2.5 | 20.0 | FK cascade, 409, cache invalidation — complex setup |
| P1 | 14 | 1.5 | 21.0 | CRUD integration + component interactive states |
| P2 | 9 | 0.75 | 6.75 | Edge cases, toast text, sort scenarios |
| P3 | 3 | 0.5 | 1.5 | E2E full flow + Z→A sort + duplicate NIT on edit |
| **Total** | **34** | — | **49.25 hours** | **~6 days** |

*Note: Test count in execution plan is 34 (excluding 4 scenarios that share test cases via parametrization).*

---

## 9c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (8 tests — zero exceptions)
- **P1 pass rate**: 100% before each story is marked Done
- **P2 pass rate**: ≥90% before Epic 2 closure (may defer with justification)
- **P3 pass rate**: best-effort / future sprint

### Coverage Targets

- **FR27 compliance** (cache invalidation): 100% — verified for create, update, delete
- **Validation coverage** (NFR5): 100% — Zod unit + FluentValidation integration
- **Error handling** (NFR6): 100% — no stack trace exposure verified
- **Search performance** (NFR1): 100% — 500-record filter < 1s verified
- **Story AC coverage**: 100% of all ACs mapped to at least one test case

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-08)
- [ ] FK cascade `ON DELETE SET NULL` for contacts verified (R4)
- [ ] TanStack Query cache invalidation verified for all 3 mutations (R1)
- [ ] 409 conflict surfaced as inline form error in Spanish (R3)
- [ ] Search performance < 1s with 500 records verified (R5)

---

## 10. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-08)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-14)
- [ ] P2 test cases pass or formally deferred with justification
- [ ] No P0/P1 test case skipped without documented reason
- [ ] `clientes` table migration verified in test database
- [ ] `contactos.cliente_id` FK configured with `ON DELETE SET NULL`
- [ ] All user-facing text in Spanish (toasts, errors, labels, placeholders)
- [ ] SortControl does not trigger API re-fetch on any sort option change
- [ ] Search filter persists across sort changes

---

## 11. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`** must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Missing this breaks TC-E2-P0-01/02/03.
2. **`ClienteForm`** must use `clienteSchema.ts` (Zod) and display inline errors via React Hook Form `formState.errors`. Never suppress validation errors.
3. **HTTP 409 response** from the backend must be caught in the mutation's `onError` handler and displayed as an inline form field error — not a generic toast.
4. **`ContactoConfiguration.cs`** must configure `OnDelete(DeleteBehavior.SetNull)` for the `cliente_id` FK. Without this, TC-E2-P0-08 will fail with a FK constraint violation.
5. **Search filtering** must use `useMemo` over the TanStack Query cached data — never fire a new `GET /api/v1/clientes?q=...` on keystroke.
6. **Sort state** (`useState<SortOption>('fecha-desc')`) must be local to the list component — never stored in Zustand (no cross-route persistence needed).
7. **`SortControl`** component is at `src/shared/components/SortControl`. Sort option identifiers: `nombre-asc` | `nombre-desc` | `fecha-desc` | `fecha-asc`.
8. All toast messages must use exact Spanish strings as defined in the epic ACs. Test assertions match exact text.
9. **`ClienteDetailView`** must use TanStack Router's `useParams()` to read `clienteId` from the URL — enabling deep linking without a prop-drilling workaround.
10. The confirmation dialog text must be "¿Eliminar este cliente?" with buttons labeled "Confirmar" and "Cancelar" (Spanish) to pass TC-E2-P2-06.
