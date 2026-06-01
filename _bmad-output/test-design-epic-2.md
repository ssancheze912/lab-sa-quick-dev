---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
workflow: testarch-test-design
createdAt: "2026-06-01"
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

**Date:** 2026-06-01
**Author:** SiesaTeam
**Status:** Draft
**Output folder:** `_bmad-output/`

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (6 stories, 6 Epic ACs)

Epic 2 delivers the complete CRUD lifecycle for client records: scrollable/searchable list with split-panel layout, client detail view with deep linking, creation form with validation, inline editing, deletion with confirmation and contact orphan handling, and client-side sort without API re-fetch. The frontend operates against `GET/POST/PUT/DELETE /api/v1/clientes` and is implemented in `src/modules/crm/clientes/` following Clean Architecture DDD conventions.

**Risk Summary:**

- Total risks identified: 10
- High-priority risks (score >= 6): 4 (R1 NIT uniqueness conflict, R2 delete with associated contacts, R3 real-time list update after mutation, R4 client-side search performance)
- Critical categories: DATA, BUS, TECH, PERF

**Coverage Summary:**

- P0 scenarios: 7 (14.0 hours) — critical paths: CRUD happy paths, validation, NIT uniqueness, delete-with-contacts
- P1 scenarios: 9 (9.0 hours) — deep linking, error states, cancel flows, sort-with-filter, orphan contacts toast
- P2 scenarios: 6 (3.0 hours) — edge cases: search debounce, empty state, 404 clientId, sort default, toast messages, pagination of 500 records
- P3 scenarios: 3 (0.75 hours) — unit tests for hooks, validators, schema
- **Total effort:** 26.75 hours (~3.3 days)

---

## Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | 280px panel, real-time filter, EmptyState, ErrorPanel + retry |
| 2.2 | Client Detail View | Split panel, URL sync `/clientes/:clienteId`, deep link, not-found |
| 2.3 | Create Client | Form validation (Zod + backend FluentValidation), NIT uniqueness 409, success toast, immediate list update |
| 2.4 | Edit Client | Pre-filled form, required-field validation on edit, cancel preserves data, success toast |
| 2.5 | Delete Client | Confirmation dialog, immediate removal, right-panel reset, contact orphan handling, cancel preserves record |
| 2.6 | Sort Client List | 4 sort criteria client-side, no API call on sort, sort persists with active search filter, default sort "Más reciente" |

### Out of Scope for This Epic

- Contact creation/editing within client detail (Epic 4 — Client-Contact Association)
- Contacts section standalone (Epic 3)
- Authentication/authorization (deferred per PRD)
- Pagination server-side (client-side scrollable list, max 500 records per NFR10)

---

## Risk Assessment

### Risk Matrix

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R1 | DATA | NIT/RUC duplicate not detected frontend-side; backend 409 returns but error message not surfaced correctly or exposes technical details | 2 (Possible) | 3 (Critical) | **6** | API integration test: POST duplicate NIT → assert 409 + `"El NIT/RUC ya está registrado"` without `stackTrace`; component test: 409 response displays inline error | QA/DEV | Story 2.3 |
| R2 | DATA | Delete client with associated contacts silently deletes contacts or fails without correct toast/orphan handling (contacts must become `clienteId = null`) | 2 (Possible) | 3 (Critical) | **6** | Integration test: create client + contacts, delete client, assert contacts still exist with `clienteId = null`; E2E: verify orphan toast message | QA/DEV | Story 2.5 |
| R3 | TECH | TanStack Query cache not invalidated after create/update/delete, causing stale list (FR27 violation — changes must be immediate) | 2 (Possible) | 3 (Critical) | **6** | Component/integration test: perform mutation, assert `queryClient.invalidateQueries(['clientes'])` triggered; list reflects new state without manual reload | QA/DEV | Stories 2.3, 2.4, 2.5 |
| R4 | PERF | Real-time client-side search filter with 500 records exceeds 1-second render time (NFR1 violation) | 1 (Unlikely) | 3 (Critical) | **3** | Performance test: load 500 mock clients, type in search field, assert list rerenders in under 1s (< 50ms client-side filter) | QA | Story 2.1 |
| R5 | BUS | Sort resets active search filter when user changes sort order (violates AC-E2.6) | 2 (Possible) | 2 (Degraded) | **4** | Component test: apply search filter "ACME", change sort to "Nombre A→Z", assert search input still contains "ACME" and list is filtered+sorted | QA | Story 2.6 |
| R6 | BUS | Sort triggers new API call (GET /api/v1/clientes) instead of reordering cached data (violates technical context of Story 2.6) | 2 (Possible) | 2 (Degraded) | **4** | Component test: mock API, change sort, assert `axios.get` called only once (initial load), NOT on sort change | QA/DEV | Story 2.6 |
| R7 | BUS | Form pre-fill on edit loads stale data (not current TanStack Query cache value) causing data loss on concurrent edits | 1 (Unlikely) | 2 (Degraded) | **2** | Component test: render edit form with `useCliente(id)` mock, assert all 4 fields pre-filled with correct cached values | QA | Story 2.4 |
| R8 | BUS | Cancel on create/edit form submits or modifies data instead of discarding | 1 (Unlikely) | 2 (Degraded) | **2** | Component test: fill form, click Cancel, assert no API call made, original data unchanged | QA | Stories 2.3, 2.4 |
| R9 | BUS | Delete cancel dialog dismissal deletes the record anyway (race condition or dialog close event triggers delete) | 1 (Unlikely) | 2 (Degraded) | **2** | Component test: open delete dialog, click Cancelar, assert DELETE HTTP call never made, record still in list | QA | Story 2.5 |
| R10 | TECH | URL not updated to `/clientes/:clienteId` when user selects a client (deep linking breaks, FR30 violation) | 1 (Unlikely) | 2 (Degraded) | **2** | E2E test: click client in list, assert URL changes to `/clientes/:clienteId` and direct URL access renders same detail | QA | Story 2.2 |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

### High-Priority Risks (Score >= 6) — Mitigation Plans

#### R1: NIT/RUC Duplicate — 409 Conflict Not Surfaced Correctly (Score: 6)

**Mitigation Strategy:** Backend `CreateClienteRequestValidator` must enforce unique NIT via `IClienteRepository.ExistsNitAsync`. On duplicate: return HTTP 409 with Problem Details body `{ "detail": "El NIT/RUC ya está registrado" }` — no `stackTrace` key. Frontend `useCreateCliente` mutation `onError` handler must map 409 status to an inline form error on the NIT field (not a generic toast). Verified by: (a) xUnit integration test POST duplicate NIT → 409 + Problem Details, (b) Vitest component test mocking 409 response → inline error visible.

**Owner:** DEV  
**Timeline:** Story 2.3 implementation  
**Status:** Planned  
**Verification:** TC-E2-P0-05 passes

#### R2: Delete with Associated Contacts — Orphan Handling (Score: 6)

**Mitigation Strategy:** Backend `DeleteClienteCommandHandler` must NOT cascade-delete contacts. EF Core configuration `ContactoConfiguration.cs` sets `ON DELETE SET NULL` on `cliente_id` FK. After deletion: contacts retain all data with `cliente_id = null`. Frontend toast must show `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` when the deleted client had contacts, and `"Cliente eliminado correctamente"` otherwise. Backend endpoint should return `204 No Content`; frontend must invalidate `['clientes']` and `['contactos']` query keys.

**Owner:** DEV  
**Timeline:** Story 2.5 implementation  
**Status:** Planned  
**Verification:** TC-E2-P0-06, TC-E2-P0-07 pass

#### R3: TanStack Query Cache Not Invalidated After Mutation (Score: 6)

**Mitigation Strategy:** All mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`. Edit and delete mutations must additionally invalidate `['clientes', id]` for the specific record. The list component must NOT require a page reload to reflect changes — TanStack Query's automatic refetch on invalidation handles FR27.

**Owner:** DEV  
**Timeline:** Stories 2.3, 2.4, 2.5  
**Status:** Planned  
**Verification:** TC-E2-P0-03, TC-E2-P0-04, TC-E2-P0-06 pass

---

## Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌▌▌▌▌           4 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   10 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  13 tests
  Unit (Vitest / xUnit)     ▌▌▌▌▌▌▌▌              5 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                              32 tests
```

### Rationale

- **Domain-heavy epic.** Epic 2 introduces the first real business domain (clients) with full CRUD, validation rules, and optimistic UI. This shifts the test distribution toward API integration and component tests compared to Epic 1.
- **API integration tests (10)** cover the entire backend CRUD surface: create/read/update/delete happy paths, NIT uniqueness, FluentValidation error responses, and contact orphan handling on delete.
- **Component tests (13)** cover: form validation feedback (inline errors), cancel flows, sort-without-API-call, sort-with-active-filter, query cache invalidation, error state panels, empty state, and form pre-fill.
- **E2E tests (4)** focus on end-to-end user journeys where multiple layers must cooperate: full create workflow, deep link to client detail, delete with orphan toast, and search+sort combined.
- **Unit tests (5)** cover Zod schema validation and FluentValidation validators independently from HTTP concerns.

---

## Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey + High risk (score >= 6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| GET /api/v1/clientes returns client list | API Integration | R3 | 1 | QA | Happy path list retrieval |
| POST /api/v1/clientes creates client, list updates immediately | API Integration + Component | R3 | 2 | QA/DEV | Backend: 201 + body; Frontend: list refreshes without reload |
| PUT /api/v1/clientes/:id updates client, list/detail update immediately | API Integration + Component | R3 | 2 | QA/DEV | Backend: 200 + body; Frontend: cache invalidated |
| DELETE /api/v1/clientes/:id with no contacts — client removed | API Integration | R3 | 1 | QA | 204 No Content |
| POST duplicate NIT returns 409 with Problem Details | API Integration | R1 | 1 | QA | No stackTrace, correct detail message |
| DELETE /api/v1/clientes/:id with contacts — contacts become clienteId=null | API Integration | R2 | 1 | QA | ON DELETE SET NULL |
| Frontend delete with contacts shows orphan toast | E2E | R2 | 1 | QA | Exact Spanish message |

**Total P0:** 7 tests, 14.0 hours

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (score 3-5) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| Sort does NOT trigger new API call | Component | R6 | 1 | QA | Assert axios.get called once only |
| Sort with active search filter preserves filter | Component | R5 | 1 | QA | Filter input unchanged after sort |
| POST with empty required fields returns 400 + validation errors | API Integration | - | 1 | QA | FluentValidation response |
| Frontend form: empty required field shows inline error, blocks submit | Component | - | 2 | QA | One per create/edit form |
| Cancel on create form — no API call made | Component | R8 | 1 | QA | Axios not called |
| Cancel on edit form — original data unchanged | Component | R8 | 1 | QA | No mutation triggered |
| Cancel on delete dialog — record remains | Component | R9 | 1 | QA | DELETE not called |
| Direct URL /clientes/:clienteId renders correct detail | E2E | R10 | 1 | QA | Deep link works |

**Total P1:** 9 tests, 9.0 hours

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (score 1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| Empty client list shows EmptyState component with guidance message | Component | - | 1 | QA | Story 2.1 |
| Backend unavailable shows ErrorPanel with "Reintentar" button | Component | - | 1 | QA | Story 2.1 |
| Non-existent clienteId in URL shows not-found message | Component | - | 1 | QA | Story 2.2 |
| Default sort order is "Más reciente" on initial load | Component | - | 1 | QA | Story 2.6 |
| Create success toast: "Cliente creado correctamente" | Component | - | 1 | QA | Story 2.3 |
| Edit success toast: "Cliente actualizado correctamente" | Component | - | 1 | QA | Story 2.4 |

**Total P2:** 6 tests, 3.0 hours

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Schema/validator unit coverage

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| Zod `clienteSchema` rejects empty Nombre | Unit (Vitest) | 1 | DEV | Schema unit test |
| Zod `clienteSchema` rejects empty NIT | Unit (Vitest) | 1 | DEV | Schema unit test |
| `CreateClienteRequestValidator` rejects blank Nombre (FluentValidation) | Unit (xUnit) | 1 | DEV | Validator unit test |

**Total P3:** 3 tests, 0.75 hours

---

## Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E2-P0-01: GET /api/v1/clientes Returns Client List

**Level:** API Integration (xUnit + WebApplicationFactory)
**Story:** 2.1
**Requirement:** FR1, FR2
**Risk covered:** R3 (validates list endpoint that mutation invalidation refreshes)

**Precondition:** Database seeded with 3 client records via test fixture.

**Test Steps:**
1. GET `/api/v1/clientes` via `WebApplicationFactory<Program>` HttpClient.
2. Inspect status code and response body.

**Expected Result:**
- HTTP 200 OK.
- Response body is a JSON array with 3 items.
- Each item contains `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
- Array is returned directly (no wrapper object per architecture spec).

**Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers Postgres.

---

#### TC-E2-P0-02: POST /api/v1/clientes Creates Client with 201 Response

**Level:** API Integration
**Story:** 2.3
**Requirement:** FR1, AC-E2.1
**Risk covered:** R3

**Precondition:** Clean database (no clients).

**Test Steps:**
1. POST `/api/v1/clientes` with body: `{ "nombre": "Empresa ACME", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }`.
2. Inspect response.

**Expected Result:**
- HTTP 201 Created.
- Response body contains the created client with a `id` (UUID), all submitted fields, and `createdAt` (ISO 8601 DateTimeOffset).
- `Location` header set to `/api/v1/clientes/{id}`.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-03: Frontend Create Client — List Updates Without Page Reload

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR27, AC-E2.1
**Risk covered:** R3

**Precondition:** MSW handlers set up for GET `/api/v1/clientes` (returns empty array initially, then returns 1 client after POST). `useCreateCliente` mutation wired to invalidate `['clientes']`.

**Test Steps:**
1. Render `ClienteListView` with QueryClientProvider.
2. Assert list is empty initially.
3. Trigger `useCreateCliente` mutation with valid data.
4. MSW responds with 201 (new client).
5. Wait for query invalidation and re-fetch.
6. Assert new client appears in the list DOM.

**Expected Result:**
- New client item visible in list after mutation.
- No `window.location.reload()` or navigation occurred.
- `queryClient.getQueryData(['clientes'])` updated with new entry.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-04: Frontend Edit Client — List and Detail Update Without Page Reload

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** FR6, FR27, AC-E2.3
**Risk covered:** R3

**Precondition:** MSW handlers for GET `/api/v1/clientes` (1 client), GET `/api/v1/clientes/:id`, PUT `/api/v1/clientes/:id` (returns updated client).

**Test Steps:**
1. Render `ClienteDetailView` with existing client data pre-loaded.
2. Click "Editar" — assert form opens pre-filled with current values.
3. Change `ciudad` field to "Medellín" and submit form.
4. Wait for mutation onSuccess and query re-invalidation.
5. Assert detail panel shows "Medellín".
6. Assert list item also shows updated ciudad (cache invalidated for `['clientes']`).

**Expected Result:**
- `useUpdateCliente` mutation fires PUT with correct payload.
- Both `['clientes']` and `['clientes', id]` query keys invalidated.
- UI reflects changes without page reload (FR27).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-05: POST Duplicate NIT Returns 409 with Problem Details — No Stack Trace

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4, NFR6
**Risk covered:** R1

**Precondition:** Client with NIT `900123456-1` already exists in the database.

**Test Steps:**
1. POST `/api/v1/clientes` with `{ "nombre": "Otra Empresa", "nit": "900123456-1", "telefono": "3009876543", "ciudad": "Cali" }`.
2. Inspect response status and body.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Response body contains `"detail": "El NIT/RUC ya está registrado"`.
- Response body does NOT contain `stackTrace`, `exception`, or `innerException` keys.
- `status` field in body equals `409`.

**Automation:** xUnit integration test.

---

#### TC-E2-P0-06: DELETE /api/v1/clientes/:id With Associated Contacts — Contacts Become clienteId = null

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 (last scenario — orphan contacts)
**Risk covered:** R2

**Precondition:** Client A with UUID exists; 3 contacts exist with `clienteId = ClienteA.id`.

**Test Steps:**
1. DELETE `/api/v1/clientes/{ClienteA.id}`.
2. GET `/api/v1/contactos` and inspect each contact's `clienteId`.

**Expected Result:**
- DELETE returns HTTP 204 No Content.
- All 3 contacts still exist (not deleted).
- Each contact's `clienteId` is `null`.
- Client no longer appears in GET `/api/v1/clientes`.

**Automation:** xUnit integration test with TestContainers Postgres.

---

#### TC-E2-P0-07: E2E — Full Create Client Journey with Success Toast

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** FR1, AC-E2.1, AC-2.3
**Risk covered:** R3, R1

**Precondition:** Frontend and backend running. Empty client list.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click "Nuevo cliente" button.
3. Fill form: Nombre = "Cliente E2E", NIT = "800000001-0", Teléfono = "3100000001", Ciudad = "Bogotá".
4. Click submit (save) button.
5. Observe list and toast notification.

**Expected Result:**
- Toast appears with text "Cliente creado correctamente".
- New client "Cliente E2E" appears in the left panel list immediately.
- Form closes (modal or panel collapses).
- URL remains at `/clientes` (no redirect).

**Automation:** Playwright E2E.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: Sort Change Does Not Trigger New API Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-2.6 (technical context — no additional fetch on sort)
**Risk covered:** R6

**Precondition:** MSW handler for GET `/api/v1/clientes` returns 5 clients. Sort state managed via React `useState`. Axios spy/mock enabled.

**Test Steps:**
1. Render `ClienteListView` — API called once on mount (fetches 5 clients).
2. Record number of GET `/api/v1/clientes` calls made.
3. Change sort from "Más reciente" to "Nombre A→Z" via SortControl.
4. Change again to "Nombre Z→A".
5. Count total API calls.

**Expected Result:**
- GET `/api/v1/clientes` called exactly 1 time total (on mount).
- No additional calls triggered by sort changes.
- List order changes in DOM after each sort change.

**Automation:** Vitest + RTL + MSW request count assertions.

---

#### TC-E2-P1-02: Sort With Active Search Filter Preserves Filter

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-E2.6, AC-2.6 (last scenario)
**Risk covered:** R5

**Precondition:** 5 clients in mock data, including 2 matching "ACME".

**Test Steps:**
1. Render `ClienteListView`.
2. Type "ACME" in search field — list shows 2 filtered results.
3. Change sort to "Nombre A→Z" via SortControl.
4. Inspect search field value and list contents.

**Expected Result:**
- Search input still contains "ACME" after sort change.
- List shows only 2 "ACME" clients (filter not cleared).
- List is reordered alphabetically within the filtered set.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-03: POST /api/v1/clientes With Empty Required Fields Returns 400

**Level:** API Integration
**Story:** 2.3
**Requirement:** FR8, AC-E2.4
**Risk covered:** (none direct; validates FluentValidation wiring)

**Precondition:** Backend running via WebApplicationFactory.

**Test Steps:**
1. POST `/api/v1/clientes` with body: `{ "nombre": "", "nit": "", "telefono": "", "ciudad": "" }`.
2. Inspect response.

**Expected Result:**
- HTTP 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response body contains `errors` object with at least 4 keys: `Nombre`, `Nit`, `Telefono`, `Ciudad`.
- Each key has a non-empty error message string.
- No `stackTrace` in response.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-04: Frontend Create Form — Empty Nombre Shows Inline Error, Blocks Submit

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** FR8, AC-E2.4, AC-2.3
**Risk covered:** (frontend validation gate)

**Precondition:** `ClienteForm` rendered in create mode with MSW. Zod schema requires all 4 fields.

**Test Steps:**
1. Render `ClienteForm` (create mode).
2. Leave "Nombre" empty; fill other fields.
3. Click submit button.
4. Inspect DOM for validation error.

**Expected Result:**
- Form is NOT submitted (no POST call to `/api/v1/clientes`).
- An inline error message appears adjacent to the Nombre field (Spanish text).
- Other fields do not show errors (they are valid).

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-05: Frontend Edit Form — Empty Required Field Shows Inline Error, Blocks Submit

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** FR8, AC-E2.4, AC-2.4

**Precondition:** `ClienteForm` rendered in edit mode, pre-filled with valid data.

**Test Steps:**
1. Render `ClienteForm` (edit mode) with existing client data.
2. Clear the "Teléfono" field (set it to empty).
3. Click submit button.
4. Inspect DOM for validation error.

**Expected Result:**
- Form is NOT submitted (no PUT call).
- Inline error appears on the Teléfono field.
- No success toast displayed.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-06: Cancel on Create Form — No API Call Made

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-2.3 (implied — cancel discards without side effects)
**Risk covered:** R8

**Precondition:** `ClienteForm` open in create mode with MSW. POST handler registered.

**Test Steps:**
1. Fill all 4 fields with valid data.
2. Click "Cancelar" button.
3. Assert API calls made.

**Expected Result:**
- POST `/api/v1/clientes` never called.
- Form closes (component unmounts or hides).
- No toast displayed.
- Client list unchanged.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-07: Cancel on Edit Form — Original Client Data Unchanged

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC-2.4
**Risk covered:** R8

**Precondition:** `ClienteForm` open in edit mode with client data `{ ciudad: "Bogotá" }`. PUT handler registered.

**Test Steps:**
1. Change `ciudad` to "Cali".
2. Click "Cancelar" without submitting.
3. Inspect detail view.

**Expected Result:**
- PUT `/api/v1/clientes/:id` never called.
- Detail view shows "Bogotá" (original value unchanged).
- No success toast shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-08: Cancel Delete Dialog — Record Remains in System

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC-2.5
**Risk covered:** R9

**Precondition:** Client detail view rendered with 1 client. DELETE handler registered in MSW.

**Test Steps:**
1. Click "Eliminar" button — confirmation dialog appears.
2. Click "Cancelar" in dialog.
3. Assert dialog closes and record status.

**Expected Result:**
- DELETE `/api/v1/clientes/:id` never called.
- Dialog closes.
- Client detail remains visible in right panel.
- Client still present in list.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-09: E2E — Direct URL /clientes/:clienteId Renders Correct Client Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** FR30, AC-2.2
**Risk covered:** R10

**Precondition:** Client with known UUID exists in the database. Frontend and backend running.

**Test Steps:**
1. Without prior navigation, open browser directly to `http://localhost:5173/clientes/{clienteId}`.
2. Wait for page to render.

**Expected Result:**
- Client detail panel renders with correct Nombre, NIT, Teléfono, and Ciudad.
- Left panel list is also visible and loaded.
- No redirect, no blank page.
- URL stays at `/clientes/{clienteId}`.

**Automation:** Playwright E2E.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: Empty Client List Shows EmptyState Component

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 (empty state scenario)

**Test Steps:**
1. MSW returns empty array `[]` for GET `/api/v1/clientes`.
2. Render `ClienteListView`.
3. Assert DOM.

**Expected Result:**
- `EmptyState` component is visible.
- A guiding message encourages user to create the first client.
- List is not rendered (no empty `<ul>` or similar).

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-02: Backend Unavailable Shows ErrorPanel With "Reintentar" Button

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 (error state scenario)

**Test Steps:**
1. MSW returns a network error for GET `/api/v1/clientes`.
2. Render `ClienteListView`.
3. Assert DOM.

**Expected Result:**
- `ErrorPanel` component is visible.
- A "Reintentar" button is present.
- Client list items are NOT rendered.
- Clicking "Reintentar" triggers a new fetch (calls GET `/api/v1/clientes` again).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-03: Non-Existent clienteId in URL Shows Not-Found Message

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirement:** AC-2.2 (not-found scenario)

**Test Steps:**
1. MSW returns 404 for GET `/api/v1/clientes/nonexistent-id`.
2. Render route `/clientes/nonexistent-id` via TanStack Router.
3. Assert DOM.

**Expected Result:**
- A not-found message is displayed gracefully (not a blank screen, not a JS error).
- Navigation shell remains visible.

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-04: Default Sort Order is "Más Reciente" on Initial Load

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-2.6 (default sort scenario)

**Test Steps:**
1. Render `ClienteListView` for the first time (no prior sort preference stored).
2. Inspect SortControl component and list order.

**Expected Result:**
- SortControl shows "Más reciente" as selected option.
- Client list is ordered by `createdAt` descending (newest client appears first in DOM).

**Automation:** Vitest + RTL.

---

#### TC-E2-P2-05: Create Success Toast — "Cliente creado correctamente"

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-2.3

**Test Steps:**
1. MSW POST handler returns 201 with created client.
2. Fill and submit `ClienteForm`.
3. Assert toast.

**Expected Result:**
- Toast notification appears with text "Cliente creado correctamente".
- Toast is not an error toast (no red/destructive styling).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P2-06: Edit Success Toast — "Cliente actualizado correctamente"

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC-2.4

**Test Steps:**
1. MSW PUT handler returns 200 with updated client.
2. Edit 1 field in `ClienteForm` (edit mode) and submit.
3. Assert toast.

**Expected Result:**
- Toast notification appears with text "Cliente actualizado correctamente".

**Automation:** Vitest + RTL + MSW.

---

### P3 — Nice to Have / Validator Unit Coverage

#### TC-E2-P3-01: Zod clienteSchema Rejects Empty Nombre

**Level:** Unit (Vitest)
**Story:** 2.3
**Requirement:** FR8

**Test Steps:**
1. Import `clienteSchema` from `src/modules/crm/clientes/application/clienteSchema.ts`.
2. Parse `{ nombre: "", nit: "123", telefono: "321", ciudad: "X" }`.
3. Assert parse result.

**Expected Result:**
- `safeParse` returns `success: false`.
- Error path includes `nombre`.

**Automation:** Vitest unit test.

---

#### TC-E2-P3-02: Zod clienteSchema Rejects Empty NIT

**Level:** Unit (Vitest)
**Story:** 2.3
**Requirement:** FR7, FR8

**Test Steps:**
1. Parse `{ nombre: "Test", nit: "", telefono: "321", ciudad: "X" }` against `clienteSchema`.
2. Assert parse result.

**Expected Result:**
- `safeParse` returns `success: false`.
- Error path includes `nit`.

**Automation:** Vitest unit test.

---

#### TC-E2-P3-03: CreateClienteRequestValidator Rejects Blank Nombre

**Level:** Unit (xUnit)
**Story:** 2.3
**Requirement:** FR8

**Test Steps:**
1. Instantiate `CreateClienteRequestValidator`.
2. Validate `new CreateClienteRequest { Nombre = "", Nit = "123", Telefono = "321", Ciudad = "X" }`.
3. Assert validation result.

**Expected Result:**
- `IsValid` is `false`.
- Errors collection contains an error for `Nombre`.

**Automation:** xUnit unit test.

---

## Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Coverage Status |
|---------|---------|------------|-----------------|
| AC-E2.1: New client registers and appears in list immediately | 2.3 | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P0-07 | Covered |
| AC-E2.2: Search by name or NIT returns results in under 1 second | 2.1 | TC-E2-P1-02 (filter behavior), PERF note R4 | Covered (filter correctness; perf via R4 mitigation) |
| AC-E2.3: User can view detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P0-04, TC-E2-P1-09 | Covered |
| AC-E2.4: System prevents save with empty required fields, shows clear errors | 2.3, 2.4 | TC-E2-P0-05, TC-E2-P1-03, TC-E2-P1-04, TC-E2-P1-05 | Covered |
| AC-E2.5: User can delete client, stops appearing in list | 2.5 | TC-E2-P0-06 (backend), TC-E2-P1-08 (cancel guard) | Covered |
| AC-E2.6: Sort list without reloading page or losing active search filter | 2.6 | TC-E2-P1-01, TC-E2-P1-02, TC-E2-P2-04 | Covered |

### Story-Level AC Coverage

| Story AC | Test Cases | Coverage |
|----------|------------|---------|
| 2.1: Client list visible in 280px panel | TC-E2-P0-01 | Covered |
| 2.1: Real-time filter on name/NIT | TC-E2-P1-02 (filter side of sort+filter test) | Covered |
| 2.1: EmptyState when no clients | TC-E2-P2-01 | Covered |
| 2.1: ErrorPanel + Reintentar on backend failure | TC-E2-P2-02 | Covered |
| 2.2: Detail panel shows all fields on selection | TC-E2-P0-04 | Covered |
| 2.2: URL updates to /clientes/:clienteId | TC-E2-P1-09 | Covered |
| 2.2: Direct URL loads correct client | TC-E2-P1-09 | Covered |
| 2.2: Non-existent clienteId shows not-found | TC-E2-P2-03 | Covered |
| 2.3: Form opens with 4 required fields | TC-E2-P1-04 | Covered |
| 2.3: Successful create + toast + immediate list | TC-E2-P0-02, TC-E2-P0-03, TC-E2-P0-07, TC-E2-P2-05 | Covered |
| 2.3: Empty fields — inline error, no submit | TC-E2-P1-04 | Covered |
| 2.3: Duplicate NIT → inline error "El NIT/RUC ya está registrado" | TC-E2-P0-05 | Covered |
| 2.4: Edit form pre-filled with current values | TC-E2-P0-04 | Covered |
| 2.4: Save changes + toast + immediate update | TC-E2-P0-04, TC-E2-P2-06 | Covered |
| 2.4: Empty required field on edit — inline error | TC-E2-P1-05 | Covered |
| 2.4: Cancel preserves original data | TC-E2-P1-07 | Covered |
| 2.5: Confirmation dialog on "Eliminar" | TC-E2-P1-08 | Covered |
| 2.5: Confirmed delete — removed from list, panel resets, toast | TC-E2-P0-06, TC-E2-P0-07 | Covered |
| 2.5: Cancel — record unchanged | TC-E2-P1-08 | Covered |
| 2.5: Delete with contacts — orphan handling + specific toast | TC-E2-P0-06, TC-E2-P0-07 | Covered |
| 2.6: Nombre A→Z sort works | TC-E2-P1-01 | Covered |
| 2.6: Nombre Z→A sort works | TC-E2-P1-01 | Covered |
| 2.6: Más reciente sort works | TC-E2-P2-04 | Covered |
| 2.6: Más antiguo sort works | TC-E2-P1-01 | Covered |
| 2.6: Sort with active filter — filter not cleared | TC-E2-P1-02 | Covered |
| 2.6: Default sort is "Más reciente" | TC-E2-P2-04 | Covered |

---

## NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | R4 mitigation (client-side useMemo filter); TC-E2-P1-02 validates filter correctness | Component |
| NFR2 | CRUD changes reflect in UI in under 2s | TC-E2-P0-03, TC-E2-P0-04 (mutation + invalidation cycle) | Component |
| NFR5 | API validates and sanitizes all inputs | TC-E2-P1-03 (FluentValidation), TC-E2-P3-03 (validator unit) | API Integration + Unit |
| NFR6 | No stack traces exposed | TC-E2-P0-05 (409 response), TC-E2-P1-03 (400 response) | API Integration |
| NFR7 | Core tasks completable without training | TC-E2-P0-07 (E2E full journey) | E2E |
| NFR8 | No more than 2 clicks from client to contacts | Out of scope Epic 2 — contacts covered in Epic 4 | N/A |
| NFR9 | View contact's client without extra navigation | Out of scope Epic 2 — Epic 4 coverage | N/A |
| NFR10 | Works with up to 500 clients | R4 mitigation note (filter performance threshold) | PERF |
| NFR11 | No hardcoded limits in data layer | Architecture: UUID PKs + EF Core without max constraints — validated in architecture doc | ARCH |

---

## Execution Order

Minimizes blocked tests due to environment and data dependencies:

```
Phase 1 — Backend CRUD Gate (P0, requires TestContainers Postgres)
  1. TC-E2-P0-01  GET /api/v1/clientes returns client list
  2. TC-E2-P0-02  POST /api/v1/clientes — creates client, 201 response
  3. TC-E2-P0-05  POST duplicate NIT → 409 Problem Details, no stackTrace
  4. TC-E2-P0-06  DELETE with contacts → contacts become clienteId=null
  5. TC-E2-P1-03  POST empty fields → 400 + FluentValidation errors

Phase 2 — E2E Full Journey (P0/P1, requires both servers running)
  6. TC-E2-P0-07  E2E: full create client journey with success toast
  7. TC-E2-P1-09  E2E: direct URL /clientes/:clienteId renders detail

Phase 3 — Component Mutation + Cache (P0, MSW, no real backend)
  8. TC-E2-P0-03  Frontend create — list updates without page reload
  9. TC-E2-P0-04  Frontend edit — detail + list update without reload

Phase 4 — Component Form Validation (P1, MSW)
 10. TC-E2-P1-04  Create form: empty Nombre → inline error
 11. TC-E2-P1-05  Edit form: clear Teléfono → inline error
 12. TC-E2-P1-06  Cancel create → no API call
 13. TC-E2-P1-07  Cancel edit → original data unchanged
 14. TC-E2-P1-08  Cancel delete dialog → DELETE not called

Phase 5 — Component Sort Tests (P1, MSW)
 15. TC-E2-P1-01  Sort change → no new API call
 16. TC-E2-P1-02  Sort with active filter → filter preserved

Phase 6 — Component Edge Cases (P2, MSW)
 17. TC-E2-P2-01  Empty list → EmptyState component
 18. TC-E2-P2-02  Backend unavailable → ErrorPanel + Reintentar
 19. TC-E2-P2-03  Non-existent clienteId in URL → not-found message
 20. TC-E2-P2-04  Default sort is "Más reciente"
 21. TC-E2-P2-05  Create success toast text
 22. TC-E2-P2-06  Edit success toast text

Phase 7 — Unit Tests (P3, on-demand)
 23. TC-E2-P3-01  Zod schema rejects empty Nombre
 24. TC-E2-P3-02  Zod schema rejects empty NIT
 25. TC-E2-P3-03  CreateClienteRequestValidator rejects blank Nombre
```

### Smoke Tests (< 5 min)

**Purpose:** Fast feedback — catch broken API surface before component tests run.

- [ ] TC-E2-P0-01: GET /api/v1/clientes returns list (15s)
- [ ] TC-E2-P0-02: POST /api/v1/clientes — 201 created (15s)
- [ ] TC-E2-P0-07: E2E full create journey (60s)

**Total:** 3 smoke scenarios

### P0 Tests (< 15 min)

- [ ] TC-E2-P0-03: Frontend create → list updates (Component)
- [ ] TC-E2-P0-04: Frontend edit → detail + list update (Component)
- [ ] TC-E2-P0-05: Duplicate NIT → 409 Problem Details (API Integration)
- [ ] TC-E2-P0-06: Delete with contacts → contacts orphaned (API Integration)

**Total:** 7 P0 scenarios (including smoke)

### P1 Tests (< 40 min)

- [ ] TC-E2-P1-01 through TC-E2-P1-09 (9 tests)

### P2/P3 Tests (< 60 min)

- [ ] TC-E2-P2-01 through TC-E2-P2-06 (6 tests)
- [ ] TC-E2-P3-01 through TC-E2-P3-03 (3 tests)

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 7 | 2.0 | 14.0 | CRUD + orphan handling + E2E journey — complex DB/MSW setup |
| P1 | 9 | 1.0 | 9.0 | Form validation, cancel flows, sort, deep link |
| P2 | 6 | 0.5 | 3.0 | Edge cases — empty state, error panel, toast text, default sort |
| P3 | 3 | 0.25 | 0.75 | Schema + validator unit tests |
| **Total** | **25** | — | **26.75 hours** | **~3.3 days** |

### Test Data Requirements

**Backend (xUnit TestContainers):**
- `ClienteTestFixture`: factory for valid `ClienteEntity` (Guid ID, Nombre, NIT, Telefono, Ciudad, DateTimeOffset timestamps)
- `ContactoTestFixture`: factory for `ContactoEntity` with nullable `ClienteId` (reused from Epic 4)
- Seeding helpers: `SeedClientes(count)`, `SeedClienteWithContacts(clienteCount, contactsPerClient)`

**Frontend (MSW handlers):**
```typescript
// handlers/clientes.ts
rest.get('/api/v1/clientes', (_, res, ctx) => res(ctx.json(mockClientes)))
rest.post('/api/v1/clientes', ...)
rest.get('/api/v1/clientes/:id', ...)
rest.put('/api/v1/clientes/:id', ...)
rest.delete('/api/v1/clientes/:id', (req, res, ctx) => res(ctx.status(204)))
// Error variants:
rest.post('/api/v1/clientes', (_, res, ctx) => res(ctx.status(409), ctx.json(conflictProblemDetails)))
rest.get('/api/v1/clientes', (_, res, ctx) => res(ctx.networkError('Failed to fetch')))
```

### Tooling

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| @testing-library/user-event | User interaction simulation | Frontend |
| MSW 2+ | API mocking in component tests | Frontend |
| Playwright 1.40+ | E2E tests | E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| FluentValidation.TestHelper | Validator unit testing | Backend |

### Environment Prerequisites

- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ (or TestContainers auto-provision in CI)
- Frontend running on port 5173 (E2E tests)
- Backend running on port 5000 (E2E tests)
- All npm dependencies installed (`npm install`)
- All NuGet packages restored (`dotnet restore`)
- `siesa-ui-kit` accessible in corporate npm registry

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% — no P0 test may fail at epic closure
- **P1 pass rate:** 100% — all story-level acceptance criteria must be verified
- **P2/P3 pass rate:** >= 90% (remainder may be deferred with documented justification)
- **High-risk mitigations (R1, R2, R3):** 100% complete before Epic 2 closure

### Coverage Targets

- **Critical paths (CRUD happy paths):** 100%
- **Validation (frontend + backend):** 100% of FR8 scenarios
- **Security (NFR6 — no stack trace):** 100%
- **Orphan contact handling:** 100% (backend + toast message)
- **Sort behavior:** 100% of AC-E2.6 scenarios

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] NIT uniqueness enforced and surfaced correctly without technical detail exposure (R1)
- [ ] Delete-with-contacts sets `clienteId = null` on all orphaned contacts (R2)
- [ ] TanStack Query cache invalidated after every mutation — no stale list (R3)
- [ ] No `stackTrace` exposed in any 4xx or 5xx response (NFR6)
- [ ] Sort does not trigger additional API calls (Story 2.6 technical constraint)

---

## Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-07)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-09)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case skipped without documented reason
- [ ] Orphan contact behavior verified end-to-end (delete client → contacts still exist with `clienteId = null`)
- [ ] NIT duplicate returns 409 Problem Details with no stack trace exposure
- [ ] TanStack Query invalidation verified — list updates without page reload after every mutation (FR27)
- [ ] Sort operates entirely on cached data — zero additional API calls on sort change
- [ ] All user-facing text verified in Spanish (toasts, errors, empty state, confirmation dialog)

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 is complete: Frontend and backend are running. PostgreSQL schema includes `clientes` table with UUID PK, `nombre`, `nit` (unique), `telefono`, `ciudad`, `created_at`, `updated_at` (all snake_case via `ApplySnakeCaseNaming()`).
2. `contactos` table exists with nullable `cliente_id` FK configured as `ON DELETE SET NULL` (from Epic 1 or Epic 3 — must exist before TC-E2-P0-06 runs).
3. `siesa-ui-kit` provides `EmptyState`, `ErrorPanel`, `SortControl` components — or these are custom implementations under `src/shared/components/`.
4. MSW 2.x is configured in Vitest setup (`src/setupTests.ts`) with `server.listen()` / `server.resetHandlers()` / `server.close()` lifecycle.
5. TanStack Router test utilities are available for component-level routing assertions.

### Dependencies

1. **Epic 1 complete** — Required: project structure, CORS, Problem Details middleware, PostgreSQL connection all verified.
2. **`contactos` table schema** — Required for TC-E2-P0-06 (delete with contacts test). If contacts table is not created until Epic 3, this test must be deferred to Epic 3 execution.
3. **`siesa-ui-kit` SortControl** — Required for Story 2.6 component tests; must expose sort option identifiers `nombre-asc | nombre-desc | fecha-desc | fecha-asc`.

### Implementation Constraints for Passing Tests

The following constraints must be enforced during implementation for tests to pass:

1. `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente` mutation hooks must call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess` — mandatory for FR27 and TC-E2-P0-03/04.
2. `useDeleteCliente` must also invalidate `['contactos']` when deleting a client with associated contacts.
3. `ClienteForm` must use `react-hook-form` with `zodResolver(clienteSchema)` — required for inline validation without backend round-trip (TC-E2-P1-04/05).
4. NIT conflict toast/error must NOT say "409" or show any HTTP detail — must say "El NIT/RUC ya está registrado" (TC-E2-P0-05, NFR6).
5. Sort in `ClienteListView` must be implemented via `useMemo` over the TanStack Query cached array + local `useState` sort key — NOT via a new API call (TC-E2-P1-01).
6. Delete confirmation dialog uses the exact Spanish text: `"¿Eliminar este cliente?"` with buttons `"Confirmar"` and `"Cancelar"`.
7. Orphan toast message must be: `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` (distinct from simple delete toast `"Cliente eliminado correctamente"`).

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework (6 categories, automated scoring)
- `test-levels-framework.md` - Test level selection (E2E vs API vs Component vs Unit)
- `test-priorities-matrix.md` - P0-P3 prioritization criteria

### Related Documents

- Epic source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD (functional requirements): `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- PRD (non-functional requirements): `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- PRD (feature spec): `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Epic 1 test design (reference): `_bmad-output/test-design-epic-1.md`

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run by `*test-design`).
- Run `*automate` for broader automation once Story 2.3 implementation exists.
- Run `*trace` to produce traceability matrix linking FR1-FR8 + Epic ACs to test cases.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam  Date: ________
- [ ] Tech Lead: SiesaTeam  Date: ________
- [ ] QA Lead: SiesaTeam  Date: ________

---

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow:** `testarch-test-design`
**Version:** 4.0 (BMad v6)
**Mode:** Epic-Level (Phase 4)
