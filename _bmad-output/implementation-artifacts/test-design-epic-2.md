---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-05-31"
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

Epic 2 delivers the complete CRUD feature for client records in Siesa Agents. It covers: loading and searching the client list (left panel, 280px), viewing full client details via deep-linked URL (`/clientes/:clienteId`), creating a new client via a validated form (Nombre, NIT/RUC, Teléfono, Ciudad), editing existing clients with pre-filled form, deleting clients with a confirmation dialog (orphan contacts become unassigned), and sorting the list client-side by four criteria (nombre-asc/desc, fecha-desc/asc). The epic implements FR1–FR8 and FR27 (immediate UI updates), and is the first feature that exercises the `clientes` table, TanStack Query cache, React Hook Form + Zod, FluentValidation, and the 409 conflict path.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | TanStack Query load, client-side filter, EmptyState, ErrorPanel + retry |
| 2.2 | Client Detail View | Panel detail display, deep-link `/clientes/:clienteId`, not-found case |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), 409 NIT conflict, toast, query invalidation |
| 2.4 | Edit Client | Pre-fill form, update mutation, cancel without save, required field inline error |
| 2.5 | Delete Client | Confirmation dialog, orphan contact handling, toast, panel empty state reset |
| 2.6 | Sort Client List | Client-side sort (4 options), default "Más reciente", sort preserves active search filter |

### Out of Scope for This Epic

- Contact management (Epic 3)
- Client ↔ Contact association (Epic 4)
- ContactManager component integration (Epic 4)
- Authentication / authorization — deferred (MVP)
- Server-side pagination — deferred (post-MVP)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Probability | Impact | Priority | Mitigation Strategy |
|---|-----------|-------------|--------|----------|---------------------|
| R1 | **TanStack Query invalidation** not triggered after create/edit/delete, leaving stale data visible | High | Critical | P0 | Integration test: mutate → assert `['clientes']` cache is refetched and new item appears in list immediately (FR27) |
| R2 | **Zod schema** allows empty strings as valid (JavaScript empty-string vs undefined subtlety), bypassing required field validation on the frontend | High | High | P0 | Unit test: submit form with every required field blank → assert inline errors fire before any API call is made |
| R3 | **FluentValidation** for `CreateClienteRequest` missing `NotEmpty()` rule for one or more fields, allowing persistence of incomplete records | Medium | High | P0 | API integration test: POST `/api/v1/clientes` with missing required fields → assert 400 + `errors` object with field-level details |
| R4 | **NIT uniqueness constraint** not enforced at backend, allowing duplicate NITs silently | Medium | Critical | P0 | API integration test: POST two clients with same NIT → assert second returns 409 with `"El NIT/RUC ya está registrado"` message (no raw DB error) |
| R5 | **Client-side sort** modifies the original TanStack Query cache (mutates state), causing sort to persist after query refetch in unexpected ways | Medium | Medium | P1 | Component test: sort → invalidate/refetch → assert sort resets to default or persists correctly per UX spec |
| R6 | **Deep-link** `/clientes/:clienteId` with a non-existent ID returns blank page or unhandled JS error instead of graceful not-found message | Medium | High | P1 | E2E / Component test: navigate directly to `/clientes/nonexistent-uuid` → assert not-found message displayed |
| R7 | **Delete with associated contacts** — backend does not implement `ON DELETE SET NULL` cascade, orphaning contacts permanently or causing FK constraint violation | High | Critical | P1 | API integration test: create client with contacts → delete client → assert contacts still exist with `clienteId: null` |
| R8 | **Cancel edit** restores previous form state but TanStack Query cache is stale if the component fetched fresh data mid-edit | Low | Medium | P2 | Component test: open edit → modify fields → click Cancel → assert original values displayed |
| R9 | **Toast messages** appear in wrong language (English) or do not appear at all after successful mutations | Low | Medium | P2 | Component test per mutation: assert Spanish toast text (exact string) after create/edit/delete success |
| R10 | **SortControl default** does not render "Más reciente" on initial load, showing unsorted or wrong default | Low | Low | P2 | Component test: render `ClienteListView` with clients → assert sort selector value is "fecha-desc" on mount |
| R11 | **Search + Sort interaction** — changing sort order clears the active search input text | Medium | Medium | P2 | Component test: type search → change sort → assert `searchInput` value unchanged and filtered results persist |

### Top 3 Risk Areas for Epic 2

1. **Mutation invalidation + data freshness** (R1, R7) — FR27 requires changes to be immediately visible; incorrect `invalidateQueries` or missing `ON DELETE SET NULL` cascade are the most impactful silent failures across the entire epic.
2. **Dual-layer validation consistency** (R2, R3, R4) — the frontend Zod schema and backend FluentValidation must agree on what constitutes a valid client; divergence allows bad data into the DB or confusing UX errors.
3. **NIT/RUC uniqueness and conflict handling** (R4) — a 409 response that leaks a raw DB error violates NFR6 and degrades user trust; the `ExceptionHandlingMiddleware` must map DB unique constraint violations to a human-readable Problem Details response.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌           3 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 15 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌  14 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌▌▌         8 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                        40 tests
```

### Rationale

- **API Integration tests dominate** because Epic 2 introduces the first real domain endpoints (`/api/v1/clientes`); CRUD correctness, validation rules, uniqueness constraints, and cascade behavior must be verified at the HTTP boundary.
- **Component tests are second** because client-side filtering, sorting, form validation feedback, toast messages, and EmptyState/ErrorPanel rendering are best exercised via Vitest + RTL without a running backend.
- **E2E tests are minimal** (3) — reserved for the highest-confidence scenarios: full happy-path create, deep-link detail, and delete with navigation. Browser automation adds value here where cross-layer integration (form → toast → list update) is critical.
- **Unit tests** cover pure logic: Zod schema validation, sort comparators, FluentValidation rules, and command handlers in isolation.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: POST /api/v1/clientes — Creates Client with All Required Fields

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.1, FR4
**Risk covered:** R1, R3

**Precondition:** Backend running with empty `clientes` table (TestContainers Postgres). All four required fields provided: Nombre, NIT, Teléfono, Ciudad.

**Test Steps:**
1. POST `http://localhost:5000/api/v1/clientes` with body:
   ```json
   { "nombre": "Empresa Ejemplo", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }
   ```
2. Assert HTTP status.
3. GET `http://localhost:5000/api/v1/clientes` and inspect response array.

**Expected Result:**
- POST returns 201 Created.
- Response body contains `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601), `updatedAt`.
- GET returns array with the newly created client.
- `createdAt` field is a `DateTimeOffset`-formatted timestamp (never plain date).

**Automation:** xUnit integration test using `WebApplicationFactory<Program>` + TestContainers (Postgres).

---

#### TC-E2-P0-02: POST /api/v1/clientes — Rejects Missing Required Fields (400)

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4, FR8
**Risk covered:** R3

**Precondition:** Backend running.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{}` (all fields absent).
2. POST `/api/v1/clientes` with body `{ "nombre": "X" }` (NIT, Teléfono, Ciudad absent).
3. For each response, inspect status and body.

**Expected Result:**
- Both return HTTP 400.
- `Content-Type: application/problem+json`.
- Response body contains `errors` object with keys matching the missing field names.
- No stack trace in response body (NFR6).

**Automation:** xUnit integration test.

---

#### TC-E2-P0-03: POST /api/v1/clientes — Returns 409 on Duplicate NIT

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC (Story 2.3 — 409 conflict), FR7
**Risk covered:** R4

**Precondition:** Client with NIT `"900123456-1"` already exists in the DB.

**Test Steps:**
1. POST `/api/v1/clientes` with the same NIT `"900123456-1"`.
2. Inspect response status and body.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- `detail` field contains `"El NIT/RUC ya está registrado"` (Spanish, human-readable).
- No raw PostgreSQL constraint error or `InnerException` exposed (NFR6).

**Automation:** xUnit integration test.

---

#### TC-E2-P0-04: Frontend Zod Schema — Rejects Empty Required Fields Before API Call

**Level:** Unit
**Story:** 2.3, 2.4
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** `clienteSchema.ts` (Zod) imported. No API mock needed.

**Test Steps:**
1. Call `clienteSchema.safeParse({})` — all fields absent.
2. Call `clienteSchema.safeParse({ nombre: "", nit: "", telefono: "", ciudad: "" })` — all fields empty string.
3. Call `clienteSchema.safeParse({ nombre: "X", nit: "Y", telefono: "Z", ciudad: "W" })` — all fields present.

**Expected Result:**
- Step 1: `success: false` with errors on `nombre`, `nit`, `telefono`, `ciudad`.
- Step 2: `success: false` (empty string must NOT pass — use `.min(1)` in Zod schema).
- Step 3: `success: true`.

**Automation:** Vitest unit test.

---

#### TC-E2-P0-05: TanStack Query Cache Invalidated After Create Mutation

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR27 (changes visible immediately to all users)
**Risk covered:** R1

**Precondition:** MSW intercepts `GET /api/v1/clientes` returning an empty array initially, then a single client after the POST succeeds. MSW intercepts `POST /api/v1/clientes` returning 201.

**Test Steps:**
1. Render `ClienteListView` wrapped in `QueryClientProvider`.
2. Assert initial empty list (or EmptyState).
3. Trigger the "Nuevo cliente" form, fill all fields, submit.
4. Wait for mutation `onSuccess` to call `invalidateQueries(['clientes'])`.
5. Assert the new client appears in the list without a manual page reload.

**Expected Result:**
- Client list re-renders with the new client after the mutation completes.
- No `window.location.reload()` called.
- Spanish toast "Cliente creado correctamente" is visible.

**Automation:** Vitest + `@testing-library/react` + MSW.

---

#### TC-E2-P0-06: PUT /api/v1/clientes/{id} — Updates Client Successfully

**Level:** API Integration
**Story:** 2.4
**Requirement:** AC (Story 2.4 — edit), FR5
**Risk covered:** R1

**Precondition:** Client exists in DB with known `id`.

**Test Steps:**
1. PUT `/api/v1/clientes/{id}` with body `{ "nombre": "Nombre Actualizado", "nit": "900123456-1", "telefono": "3009999999", "ciudad": "Medellín" }`.
2. GET `/api/v1/clientes/{id}` and inspect updated values.

**Expected Result:**
- PUT returns 200 OK with the updated client object.
- Subsequent GET confirms `nombre` and `telefono` reflect new values.
- `updatedAt` timestamp is greater than `createdAt`.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-07: DELETE /api/v1/clientes/{id} — Removes Client

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-E2.5, FR6
**Risk covered:** R1

**Precondition:** Client exists with known `id`. No associated contacts.

**Test Steps:**
1. DELETE `/api/v1/clientes/{id}`.
2. GET `/api/v1/clientes/{id}`.
3. GET `/api/v1/clientes` and verify the item is absent.

**Expected Result:**
- DELETE returns 204 No Content.
- Subsequent GET by ID returns 404.
- List no longer includes the deleted client.

**Automation:** xUnit integration test.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: GET /api/v1/clientes — Returns All Clients as Array

**Level:** API Integration
**Story:** 2.1
**Requirement:** AC-E2.1 (client appears immediately), FR1
**Risk covered:** R1

**Precondition:** Three clients pre-seeded in DB.

**Test Steps:**
1. GET `/api/v1/clientes`.
2. Inspect response structure.

**Expected Result:**
- HTTP 200.
- Response body is a JSON array (not wrapped object).
- Each item contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
- All three clients present.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-02: GET /api/v1/clientes/{id} — Returns Single Client

**Level:** API Integration
**Story:** 2.2
**Requirement:** AC (Story 2.2 — detail view), FR3
**Risk covered:** R6

**Test Steps:**
1. GET `/api/v1/clientes/{known-id}`.
2. GET `/api/v1/clientes/{non-existent-uuid}`.

**Expected Result:**
- Known ID: HTTP 200 with full client object.
- Non-existent ID: HTTP 404 with Problem Details body (not a 500 or blank).

**Automation:** xUnit integration test.

---

#### TC-E2-P1-03: DELETE /api/v1/clientes/{id} — Orphan Contacts Remain with clienteId null

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC (Story 2.5 — orphan contacts), FR23
**Risk covered:** R7

**Precondition:** Client exists with `id`. Two contacts exist with `clienteId = {id}`.

**Test Steps:**
1. DELETE `/api/v1/clientes/{id}`.
2. GET `/api/v1/contactos` and find both previously associated contacts.

**Expected Result:**
- DELETE returns 204 No Content.
- Both contacts still exist in the system (not deleted).
- Both contacts have `clienteId: null`.
- No FK constraint violation error.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-04: Client List Renders with Data and Shows Each Client's Nombre and NIT

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC (Story 2.1 — list visible with Nombre and NIT per item)
**Risk covered:** R1

**Precondition:** MSW mocks `GET /api/v1/clientes` returning two clients.

**Test Steps:**
1. Render `ClienteListView` inside `QueryClientProvider`.
2. Wait for the query to resolve.
3. Assert both `nombre` values visible.
4. Assert both `nit` values visible.
5. Assert left panel width is 280px (or has the expected CSS class).

**Expected Result:**
- Both client items render with Nombre and NIT/RUC visible per item.
- No loading spinner remains after data resolves.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-05: Client List — Real-Time Search Filters by Nombre and NIT

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2 (search results under 1s), FR2
**Risk covered:** R2

**Precondition:** MSW returns three clients: "Empresa Alpha" (NIT: 111), "Beta Corp" (NIT: 222), "Gamma SA" (NIT: 333).

**Test Steps:**
1. Render `ClienteListView`.
2. Type "Alpha" into the search field.
3. Assert only "Empresa Alpha" visible.
4. Clear search, type "222".
5. Assert only "Beta Corp" visible.
6. Assert "Empresa Alpha" and "Gamma SA" are not in the DOM.

**Expected Result:**
- Filter is applied in-memory (no additional API call triggered during typing).
- Results update after each keystroke within 1 second.

**Automation:** Vitest + RTL + MSW. Performance bound: assert no additional `fetch` was made to backend (MSW call count stays at 1).

---

#### TC-E2-P1-06: EmptyState Displayed When No Clients Exist

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC (Story 2.1 — empty state)

**Precondition:** MSW mocks `GET /api/v1/clientes` returning `[]`.

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for query to resolve.
3. Inspect DOM.

**Expected Result:**
- `EmptyState` component is rendered.
- Message guides user to create the first client (Spanish text).
- No client list items rendered.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: ErrorPanel with "Reintentar" Displayed When Backend Unavailable

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC (Story 2.1 — ErrorPanel on fetch failure)
**Risk covered:** R1

**Precondition:** MSW mocks `GET /api/v1/clientes` returning a network error.

**Test Steps:**
1. Render `ClienteListView`.
2. Wait for TanStack Query to exhaust retries.
3. Assert `ErrorPanel` is rendered with a "Reintentar" button.
4. Mock the next request to return 200 with data.
5. Click "Reintentar".
6. Assert client list renders.

**Expected Result:**
- `ErrorPanel` with "Reintentar" button shown (not a blank screen or JS error).
- Clicking "Reintentar" triggers a new fetch and renders the list on success.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Deep Link /clientes/:clienteId Displays Correct Client Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC (Story 2.2 — deep linking), FR30
**Risk covered:** R6

**Precondition:** Frontend dev server and backend running. One client seeded with known `clienteId`.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{known-clienteId}`.
2. Wait for page render.

**Expected Result:**
- Right panel shows Nombre, NIT/RUC, Teléfono, Ciudad of the correct client.
- No redirect away from the URL.
- No blank page or JS error.

**Automation:** Playwright E2E test.

---

#### TC-E2-P1-09: /clientes/:clienteId with Non-Existent ID Shows Not-Found Message

**Level:** Component (Vitest + RTL)
**Story:** 2.2
**Requirement:** AC (Story 2.2 — not-found case)
**Risk covered:** R6

**Precondition:** MSW mocks `GET /api/v1/clientes/{unknown-id}` returning 404.

**Test Steps:**
1. Render `ClienteDetailView` with `clienteId` set to a non-existent UUID.
2. Wait for query to resolve.

**Expected Result:**
- Not-found message displayed gracefully.
- No crash or unhandled error boundary activation.
- Navigation shell remains visible.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: Create Client Form — Shows Inline Errors on Empty Submit

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-E2.4, FR8
**Risk covered:** R2

**Precondition:** `ClienteForm` rendered in create mode. MSW mock present for POST (should NOT be called).

**Test Steps:**
1. Render `ClienteForm`.
2. Click submit without filling any field.
3. Inspect DOM for inline error messages.
4. Assert no fetch was made.

**Expected Result:**
- Inline error messages appear on Nombre, NIT/RUC, Teléfono, Ciudad fields.
- MSW records zero POST calls.
- Form remains open (not submitted).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-11: Edit Client — Form Pre-Filled with Current Values

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC (Story 2.4 — pre-filled form), FR6
**Risk covered:** R8

**Precondition:** MSW mocks `GET /api/v1/clientes/{id}` returning a specific client. `ClienteForm` rendered in edit mode.

**Test Steps:**
1. Render `ClienteDetailView` and open edit form.
2. Inspect input field values.

**Expected Result:**
- `Nombre` input value equals the client's current `nombre`.
- `NIT/RUC` input value equals the client's current `nit`.
- `Teléfono` input value equals the client's current `telefono`.
- `Ciudad` input value equals the client's current `ciudad`.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-12: Edit Client — Cancel Does Not Alter Client Data

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC (Story 2.4 — cancel)
**Risk covered:** R8

**Precondition:** `ClienteForm` open in edit mode, pre-filled with client data. MSW mock for PUT present (should NOT be called).

**Test Steps:**
1. Modify the `Nombre` field.
2. Click "Cancelar".
3. Assert PUT was not called.
4. Assert detail panel still shows original `nombre`.

**Expected Result:**
- Zero PUT requests.
- Original client data visible in detail panel.
- Form is closed.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Delete Client — Confirmation Dialog Appears and Cancel Aborts

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC (Story 2.5 — dialog and cancel)

**Precondition:** `ClienteDetailView` rendered with a client. MSW mock for DELETE present (should NOT be called).

**Test Steps:**
1. Click "Eliminar".
2. Assert confirmation dialog appears with "¿Eliminar este cliente?" and both "Confirmar" and "Cancelar" options.
3. Click "Cancelar".
4. Assert DELETE was not called.
5. Assert client is still visible in the list.

**Expected Result:**
- Dialog shows the Spanish confirmation message.
- Clicking "Cancelar" closes the dialog without making any API call.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-14: Delete Client — Full Happy Path (Confirm, List Removes Item, Right Panel Resets)

**Level:** E2E (Playwright)
**Story:** 2.5
**Requirement:** AC-E2.5
**Risk covered:** R1

**Precondition:** Frontend and backend running. One client seeded with known `id`.

**Test Steps:**
1. Navigate to `/clientes/{id}`.
2. Click "Eliminar".
3. Click "Confirmar" in the dialog.
4. Wait for mutation to complete.

**Expected Result:**
- Client disappears from the left panel list.
- Right panel shows empty/default state (not the deleted client).
- Toast shows "Cliente eliminado correctamente" (or orphan-contact variant when applicable).

**Automation:** Playwright E2E.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Sort "Nombre A→Z" Orders List Alphabetically Without New API Call

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC (Story 2.6 — nombre-asc)
**Risk covered:** R5

**Precondition:** MSW returns three clients in random order: "Zorro SA", "Alpha Corp", "Beta Ltd". MSW call count tracked.

**Test Steps:**
1. Render `ClienteListView`.
2. Select "Nombre A→Z" from `SortControl`.
3. Assert list order.
4. Assert no additional fetch was made.

**Expected Result:**
- List order: "Alpha Corp", "Beta Ltd", "Zorro SA".
- MSW fetch call count remains at 1 (no additional API call).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-02: Sort "Nombre Z→A" Orders List Reverse Alphabetically

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC (Story 2.6 — nombre-desc)
**Risk covered:** R5

**Test Steps:**
1. Render `ClienteListView` with three clients: "Alpha Corp", "Beta Ltd", "Zorro SA".
2. Select "Nombre Z→A" from `SortControl`.
3. Assert list order.

**Expected Result:**
- List order: "Zorro SA", "Beta Ltd", "Alpha Corp".
- No additional API call.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Sort "Más reciente" Is Default on Initial Load

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC (Story 2.6 — default sort)
**Risk covered:** R10

**Test Steps:**
1. Render `ClienteListView` without any prior sort preference.
2. Inspect `SortControl` selected value.
3. Assert list order based on `createdAt` descending.

**Expected Result:**
- `SortControl` shows "Más reciente" as the selected option.
- List order places the client with the most recent `createdAt` first.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-04: Sort Preserves Active Search Filter

**Level:** Component (Vitest + RTL)
**Story:** 2.6
**Requirement:** AC (Story 2.6 — sort+filter interaction)
**Risk covered:** R11

**Precondition:** Three clients returned by MSW: "Alpha Corp", "Beta Ltd", "Zorro Alpha" (two match "alpha" search).

**Test Steps:**
1. Render `ClienteListView`.
2. Type "alpha" in the search field.
3. Assert two results visible: "Alpha Corp", "Zorro Alpha".
4. Select "Nombre Z→A" from `SortControl`.
5. Assert search input still shows "alpha".
6. Assert list shows filtered results in new sort order: "Zorro Alpha", "Alpha Corp".

**Expected Result:**
- Search input not cleared.
- Sort applied to already-filtered set (not full list).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-05: Create Client — Spanish Toast "Cliente creado correctamente"

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC (Story 2.3 — success toast)
**Risk covered:** R9

**Precondition:** MSW mocks POST returning 201. Toast library rendered in test tree.

**Test Steps:**
1. Render form in create mode.
2. Fill all required fields.
3. Submit.
4. Wait for mutation `onSuccess`.
5. Assert toast message.

**Expected Result:**
- Toast with exact text "Cliente creado correctamente" appears.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: Edit Client — Spanish Toast "Cliente actualizado correctamente"

**Level:** Component (Vitest + RTL)
**Story:** 2.4
**Requirement:** AC (Story 2.4 — success toast)
**Risk covered:** R9

**Precondition:** MSW mocks PUT returning 200.

**Test Steps:**
1. Render form in edit mode, modify a field, submit.
2. Assert toast.

**Expected Result:**
- Toast with exact text "Cliente actualizado correctamente" appears.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-07: Delete Client with Orphan Contacts — Special Toast Message

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC (Story 2.5 — orphan contacts toast)
**Risk covered:** R7, R9

**Precondition:** MSW mocks DELETE returning 204. Backend indicates contacts were orphaned (or the UI logic checks contact count before delete — per implementation decision).

**Test Steps:**
1. Render detail view for a client that has associated contacts.
2. Confirm deletion.
3. Assert toast message text.

**Expected Result:**
- Toast shows "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-08: PUT /api/v1/clientes/{id} — Rejects Missing Required Fields (400)

**Level:** API Integration
**Story:** 2.4
**Requirement:** AC (Story 2.4 — inline error on empty required field), FR8
**Risk covered:** R3

**Precondition:** Client exists with known `id`.

**Test Steps:**
1. PUT `/api/v1/clientes/{id}` with body `{ "nombre": "", "nit": "valid-nit", "telefono": "valid", "ciudad": "valid" }`.
2. Inspect response.

**Expected Result:**
- HTTP 400 with Problem Details.
- `errors` object contains `nombre` field error.
- No partial update persisted.

**Automation:** xUnit integration test.

---

### P3 — Nice to Have / Future Sprint

#### TC-E2-P3-01: Search Performance — Filters 500 Clients in Under 1 Second

**Level:** Component / Performance
**Story:** 2.1
**Requirement:** NFR1 (under 1s with 500 records)

**Test Steps:**
1. Seed MSW with 500 client records.
2. Render `ClienteListView`, wait for data load.
3. Type a search query that matches 50 results.
4. Measure time from `input` change event to last render.

**Expected Result:**
- Filter computation completes in under 100ms (well within the 1s NFR1 budget).

**Automation:** Vitest with `performance.now()` measurement.

---

#### TC-E2-P3-02: Sort Unit Tests — sort comparators return correct ordering

**Level:** Unit
**Story:** 2.6
**Requirement:** AC (Story 2.6 — sort logic)

**Test Steps:**
1. Import the sort comparator functions (or `useMemo` sort logic from `ClienteListView`).
2. Test `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc` with a 3-element test array.

**Expected Result:**
- Each comparator produces the expected ordered output.

**Automation:** Vitest unit test (pure function, no DOM needed).

---

#### TC-E2-P3-03: FluentValidation Unit Test — CreateClienteRequestValidator

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirement:** FR8
**Risk covered:** R3

**Test Steps:**
1. Instantiate `CreateClienteRequestValidator`.
2. Validate a request with all fields present → assert valid.
3. Validate a request with each required field empty one at a time → assert invalid with field-specific error.

**Expected Result:**
- Validator correctly marks each missing field.

**Automation:** xUnit unit test (no DB needed).

---

#### TC-E2-P3-04: Full Create Client E2E — Form to List Appearance

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1

**Precondition:** Frontend + backend running with empty `clientes` table.

**Test Steps:**
1. Navigate to `/clientes`.
2. Assert `EmptyState` displayed.
3. Click "Nuevo cliente".
4. Fill Nombre, NIT/RUC, Teléfono, Ciudad.
5. Submit.
6. Assert client appears in left panel list.
7. Assert toast "Cliente creado correctamente" visible.

**Expected Result:**
- Full create flow works end-to-end in browser.

**Automation:** Playwright E2E.

---

#### TC-E2-P3-05: GET /api/v1/clientes Returns Results Ordered by createdAt Descending by Default

**Level:** API Integration
**Story:** 2.6
**Requirement:** AC (Story 2.6 — "Más reciente" default)

**Test Steps:**
1. Seed three clients at different timestamps (oldest → newest).
2. GET `/api/v1/clientes`.
3. Assert response array order.

**Expected Result:**
- Newest client appears first in the API response array.

**Note:** If sorting is purely client-side, this test validates only that the TanStack Query cache is built from the array in a deterministic order. Confirm implementation approach before writing.

**Automation:** xUnit integration test.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register client with all fields, appears in list immediately | 2.3 | TC-E2-P0-01, TC-E2-P0-05, TC-E2-P3-04 | Covered |
| AC-E2.2: Search by name or NIT in under 1 second | 2.1 | TC-E2-P1-05, TC-E2-P3-01 | Covered |
| AC-E2.3: View full detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P0-06, TC-E2-P1-08, TC-E2-P1-11 | Covered |
| AC-E2.4: Required fields validation — error messages, no submission | 2.3, 2.4 | TC-E2-P0-02, TC-E2-P0-04, TC-E2-P1-10, TC-E2-P2-08 | Covered |
| AC-E2.5: Delete client, removed from list | 2.5 | TC-E2-P0-07, TC-E2-P1-14 | Covered |
| AC-E2.6: Sort list by 4 criteria without reload, preserves active filter | 2.6 | TC-E2-P2-01, TC-E2-P2-02, TC-E2-P2-03, TC-E2-P2-04 | Covered |
| Story 2.1: EmptyState when no clients | 2.1 | TC-E2-P1-06 | Covered |
| Story 2.1: ErrorPanel + Reintentar on fetch failure | 2.1 | TC-E2-P1-07 | Covered |
| Story 2.2: Deep link `/clientes/:clienteId` direct URL | 2.2 | TC-E2-P1-08 | Covered |
| Story 2.2: Non-existent ID shows not-found gracefully | 2.2 | TC-E2-P1-09, TC-E2-P1-02 | Covered |
| Story 2.3: 409 on duplicate NIT — human-readable message | 2.3 | TC-E2-P0-03 | Covered |
| Story 2.4: Form pre-filled on edit | 2.4 | TC-E2-P1-11 | Covered |
| Story 2.4: Cancel does not alter data | 2.4 | TC-E2-P1-12 | Covered |
| Story 2.5: Confirmation dialog with Confirmar/Cancelar | 2.5 | TC-E2-P1-13 | Covered |
| Story 2.5: Orphan contacts become unassigned (clienteId=null) | 2.5 | TC-E2-P1-03 | Covered |
| Story 2.5: Orphan contacts toast message | 2.5 | TC-E2-P2-07 | Covered |
| Story 2.6: Default sort "Más reciente" on initial load | 2.6 | TC-E2-P2-03 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search results < 1s with 500 records | TC-E2-P1-05, TC-E2-P3-01 | Component / Performance |
| NFR2 | CRUD changes reflected in UI < 2s | TC-E2-P0-05, TC-E2-P1-14 | Component, E2E |
| NFR5 | Input validation and sanitization in API | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P2-08, TC-E2-P3-03 | API Integration, Unit |
| NFR6 | No stack traces or raw errors exposed to users | TC-E2-P0-02, TC-E2-P0-03 | API Integration |
| NFR7 | Core tasks completable without training | TC-E2-P3-04 (E2E happy path) | E2E |
| NFR11 | No hardcoded limits in data layer | TC-E2-P1-03 (UUID FK, no cascade delete) | API Integration |

---

## 7. Test Execution Order

```
Phase 1 — Backend API Gate (P0 — DB required)
  1. TC-E2-P0-01  POST create client — happy path
  2. TC-E2-P0-02  POST create client — 400 missing fields
  3. TC-E2-P0-03  POST create client — 409 duplicate NIT
  4. TC-E2-P0-06  PUT update client — happy path
  5. TC-E2-P0-07  DELETE client — happy path
  6. TC-E2-P1-01  GET list all clients
  7. TC-E2-P1-02  GET single client (200 + 404)
  8. TC-E2-P1-03  DELETE client — orphan contacts clienteId=null

Phase 2 — Frontend Unit Gate (P0 — no DB)
  9. TC-E2-P0-04  Zod schema rejects empty/blank required fields

Phase 3 — Component Tests (P0/P1)
 10. TC-E2-P0-05  TanStack Query invalidation after create
 11. TC-E2-P1-04  Client list renders Nombre + NIT per item
 12. TC-E2-P1-05  Real-time search filter (name and NIT)
 13. TC-E2-P1-06  EmptyState on empty list
 14. TC-E2-P1-07  ErrorPanel + Reintentar on network error
 15. TC-E2-P1-09  Not-found message on invalid clienteId
 16. TC-E2-P1-10  Inline errors on empty form submit
 17. TC-E2-P1-11  Edit form pre-filled with current values
 18. TC-E2-P1-12  Cancel edit — no PUT, original data intact
 19. TC-E2-P1-13  Delete confirmation dialog + cancel aborts

Phase 4 — E2E Tests (P1)
 20. TC-E2-P1-08  Deep link /clientes/:clienteId direct URL
 21. TC-E2-P1-14  Delete full happy path (confirm, list update, panel reset)

Phase 5 — P2 Component + API Tests
 22. TC-E2-P2-01  Sort nombre-asc
 23. TC-E2-P2-02  Sort nombre-desc
 24. TC-E2-P2-03  Default sort "Más reciente"
 25. TC-E2-P2-04  Sort preserves active search filter
 26. TC-E2-P2-05  Toast "Cliente creado correctamente"
 27. TC-E2-P2-06  Toast "Cliente actualizado correctamente"
 28. TC-E2-P2-07  Toast orphan contacts message on delete
 29. TC-E2-P2-08  PUT 400 on empty required field

Phase 6 — P3 / Nice-to-Have
 30. TC-E2-P3-01  Search performance 500 records < 1s
 31. TC-E2-P3-02  Sort comparator unit tests
 32. TC-E2-P3-03  FluentValidation unit test
 33. TC-E2-P3-04  Full create E2E
 34. TC-E2-P3-05  API default sort order
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| MSW (Mock Service Worker) | API mock for component tests | Frontend |
| Playwright | E2E tests | Frontend / E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| FluentAssertions | Readable assertions in xUnit | Backend |

### Environment Prerequisites

```
- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432 (or TestContainers)
- Database user with CREATE DATABASE + CREATE TABLE privileges
- `clientes` and `contactos` tables created via EF Core migration (Epic 1 prerequisite)
- All npm dependencies installed (npm install)
- All NuGet packages restored (dotnet restore)
- Frontend dev server on port 5173 (for E2E tests)
- Backend dev server on port 5000 (for E2E tests)
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 7 | 2.0 | 14.0 | DB + Zod + mutation invalidation — high setup cost |
| P1 | 14 | 1.0 | 14.0 | Component + API + E2E standard coverage |
| P2 | 8 | 0.75 | 6.0 | Sort variants + toast assertions + validation |
| P3 | 5 | 0.5 | 2.5 | Performance, unit, full E2E |
| **Total** | **34** | — | **36.5 hours** | **~4.5 days** |

### Prerequisites

**Test Data:**
- Minimum: 3 pre-seeded clients with distinct Nombre, NIT, and `createdAt` timestamps for sort tests
- Edge cases: 1 client with associated contacts (for orphan-contact delete test)
- Factory helpers recommended: `ClienteEntityFactory` (xUnit) and MSW handler factory (Frontend)

**Tooling:**
- MSW 2+ with `@msw/browser` and `@msw/node` adapters
- TestContainers.Npgsql for isolated Postgres per integration test class
- Playwright 1.40+ for E2E

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (7 tests — must all pass before any implementation story is demo-ready)
- **P1 pass rate**: 100% (14 tests — must all pass before epic is marked Done in sprint)
- **P2 pass rate**: ≥ 90% (8 tests — may defer 1 with justification)
- **P3 pass rate**: informational — tracked but not blocking

### Coverage Targets

- **API CRUD endpoints**: 100% of happy paths + primary error paths
- **Validation** (both Zod and FluentValidation): 100% — required fields, uniqueness constraint
- **Client-side filtering**: 100% of AC-E2.2
- **Client-side sorting**: all 4 sort options covered (P2)
- **Cascade behavior** (orphan contacts): 100% — NFR11 and Story 2.5 AC

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] Mutation invalidation verified — new/edited/deleted client appears/disappears in list (R1)
- [ ] 409 NIT conflict returns Spanish human-readable message — no raw DB error (R4, NFR6)
- [ ] Orphan contacts remain with `clienteId: null` after client delete (R7)
- [ ] Zod schema blocks empty strings on required fields (R2)

---

## 9. Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-14)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] API CRUD for `/api/v1/clientes` verified: GET list, GET by ID, POST, PUT, DELETE all return correct status codes and bodies
- [ ] Orphan contact behavior verified at DB level (`clienteId = null`, contact record not deleted)
- [ ] `ExceptionHandlingMiddleware` maps NIT uniqueness violation to 409 + Spanish message
- [ ] Client-side filter (real-time search) verified with no additional fetch calls
- [ ] Client-side sort preserves active search and produces correct ordering for all 4 sort options

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. `clienteSchema.ts` (Zod) must use `.min(1, "Campo requerido")` on all four required fields — `.string()` alone does NOT reject empty strings.
2. `CreateClienteRequestValidator` (FluentValidation) must call `.NotEmpty()` on all four fields; `.NotNull()` alone is insufficient for empty-string rejection.
3. `ContactoConfiguration.cs` must configure `ON DELETE SET NULL` for the `cliente_id` FK — do NOT use `ON DELETE CASCADE` or `ON DELETE RESTRICT`.
4. `useCreateCliente.ts`, `useUpdateCliente.ts`, `useDeleteCliente.ts` mutations MUST call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess` — FR27 compliance.
5. The 409 NIT conflict must be caught in `ExceptionHandlingMiddleware` (or a dedicated exception type) and mapped to a Problem Details response with `detail: "El NIT/RUC ya está registrado"` — never expose raw `Npgsql.PostgresException` to the client.
6. `SortControl` sort state is `local React useState` — do NOT use Zustand for it and do NOT invalidate TanStack Query on sort change.
7. `ClienteListView` must apply the sort on a derived array (via `useMemo`), never mutating the TanStack Query cache array directly.
8. All toast messages must be in Spanish — verify exact strings match the acceptance criteria text.
9. The `clientes` table `nit` column must have a unique index (`uk_clientes_nit`) configured in `ClienteConfiguration.cs` for the 409 constraint test to work.
10. The `SortControl` default selected value must be `"fecha-desc"` (identifier for "Más reciente") on initial render.
