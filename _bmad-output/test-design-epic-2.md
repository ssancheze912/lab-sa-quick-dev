---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
workflow: testarch-test-design
createdAt: "2026-06-08"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: complete
---

# Test Design: Epic 2 — Client Management

**Date:** 2026-06-08
**Author:** SiesaTeam
**Status:** Approved

---

## Executive Summary

**Scope:** Full test design for Epic 2 — Client Management (6 stories, greenfield, building on Epic 1 foundation).

Epic 2 implements the complete CRUD lifecycle for client records: listing, searching, viewing details, creating, editing, deleting, and sorting. It is the first domain-feature epic and introduces the `clientes` table, all five REST endpoints for the cliente resource, the TanStack Query client-side filtering pattern, optimistic UI mutations, and the split-panel layout (`ClienteListView` + `ClienteDetailView`).

This epic is domain-logic-heavy. The primary risks are data integrity (NIT/RUC uniqueness conflict), validation bypass, incorrect TanStack Query key invalidation causing stale UI, referential integrity on delete (contacts must not be orphaned improperly), and client-side sorting correctness.

**Stories in Scope:**

| Story | Title | Key Concerns |
|-------|-------|--------------|
| 2.1 | Client List & Search | List rendering, real-time filter, empty state, backend error fallback |
| 2.2 | Client Detail View | Detail panel, deep-link via clienteId, 404 on non-existent client |
| 2.3 | Create Client | Form validation (Zod+FluentValidation), NIT uniqueness (409), optimistic update |
| 2.4 | Edit Client | Pre-fill form, save changes, cancel without mutation, validation on update |
| 2.5 | Delete Client | Confirmation dialog, cascade-to-null for contacts, correct toast messages |
| 2.6 | Sort Client List | Client-side sort (4 criteria), sort preserves active filter, default "Más reciente" |

**Out of Scope for Epic 2:**
- Contact management UI and API (Epic 3)
- Client–Contact association (Epic 4)
- Authentication / authorization — explicitly deferred (MVP)
- Mobile viewport responsive layout is covered by Epic 1; Epic 2 must not regress it

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥6): 5 (R1, R2, R3, R4, R5)
- Critical categories: DATA, BUS, TECH, SEC, PERF

**Coverage Summary:**

- P0 scenarios: 8 (16.0 hours)
- P1 scenarios: 14 (14.0 hours)
- P2 scenarios: 8 (4.0 hours)
- P3 scenarios: 3 (0.75 hours)
- **Total effort:** 34.75 hours (~4.3 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R1 | DATA | NIT/RUC uniqueness constraint not enforced at the database layer — allows duplicate NIT records to be created if two requests arrive near-simultaneously, corrupting the client base | 2 (Possible) | 3 (Critical) | 6 | Integration test: attempt to POST two clientes with identical NIT via `WebApplicationFactory`; assert second request returns 409 with `"El NIT/RUC ya está registrado"` and only one record exists in DB | DEV | Sprint 2 |
| R2 | DATA | DELETE endpoint does not implement ON DELETE SET NULL — deleting a cliente that has associated contactos cascades-deletes the contacts rather than nullifying `cliente_id`, violating FR23 and story 2.5 AC | 2 (Possible) | 3 (Critical) | 6 | Integration test: seed cliente + 2 contactos via API; DELETE cliente; assert contactos still exist with `clienteId = null` | DEV | Sprint 2 |
| R3 | BUS | TanStack Query cache not invalidated after create/edit/delete mutation — UI remains stale, showing outdated client list without reflecting the change (FR27 violation, NFR2 violation) | 2 (Possible) | 3 (Critical) | 6 | Component/integration test: assert `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is called on mutation `onSuccess`; verify list refetches and shows new/updated/deleted record | DEV | Sprint 2 |
| R4 | SEC | Frontend Zod validation can be bypassed by submitting a direct API call — backend FluentValidation must independently enforce all required-field and business rules. Risk: if only Zod validates, a curl call with empty body creates a corrupt record | 2 (Possible) | 3 (Critical) | 6 | API integration test: POST/PUT to `/api/v1/clientes` with empty body and with missing required fields; assert 400 Problem Details with field-level errors (`errors.nombre`, `errors.nit`, etc.) — no 201/200 returned | DEV/QA | Sprint 2 |
| R5 | PERF | Client-side search filter on 500 records exceeds 1 second NFR1 threshold if implemented incorrectly (e.g., unoptimized useMemo dependency, regex on every keypress, no debounce) | 2 (Possible) | 3 (Critical) | 6 | Performance test: render ClienteListView with 500 seeded mock clients; measure time from keypress to filtered list render; assert < 1000ms (NFR1) | DEV/QA | Sprint 2 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R6 | BUS | Inline validation error messages on the create/edit form are shown server-side but frontend does not map `errors` object from Problem Details RFC 7807 to the correct form field — user sees generic error instead of field-specific message | 2 (Possible) | 2 (Degraded) | 4 | Component test: mock API 400 response with `errors.nit = ["El NIT/RUC ya está registrado"]`; assert field error renders adjacent to NIT input, not as a global toast | DEV | Sprint 2 |
| R7 | BUS | Sort state is lost when a search filter is applied or cleared — sort resets to default when user types in search box, or search result clears when sort changes (AC-E2.6 violation) | 2 (Possible) | 2 (Degraded) | 4 | Component test: apply sort "Nombre A→Z", then type in search box; assert sort order is preserved on filtered results; clear search; assert sort still active | DEV | Sprint 2 |
| R8 | TECH | `clientes.$clienteId.tsx` route does not trigger a 404/not-found state when the clienteId in URL doesn't exist — instead shows a blank panel or crashes with an unhandled error | 2 (Possible) | 2 (Degraded) | 4 | E2E/component test: navigate to `/clientes/00000000-0000-0000-0000-000000000000`; assert a graceful not-found message renders in the right panel; no JS error in console | DEV/QA | Sprint 2 |
| R9 | DATA | "Cancel" button on edit form triggers a mutation or partially persists data if the form is submitted before cancel — original data should remain unchanged when user cancels without saving | 1 (Unlikely) | 3 (Critical) | 3 | Component test: open edit form, change Nombre field value, click "Cancelar"; assert original data visible in detail view; assert no PUT request was issued (MSW captures requests) | DEV | Sprint 2 |
| R10 | BUS | Confirmation dialog for delete can be bypassed (dialog skipped) due to async rendering race condition or incorrect dialog state management — deletion executes without user confirmation | 1 (Unlikely) | 3 (Critical) | 3 | Component test: click "Eliminar"; assert dialog appears with "¿Eliminar este cliente?" text and two buttons before any DELETE call is made; MSW confirms no DELETE request without dialog confirmation step | DEV | Sprint 2 |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R11 | OPS | EF Core migration for `clientes` table not applied correctly — snake_case column names (`nit`, `nombre`, `telefono`, `ciudad`, `created_at`, `updated_at`) not matching Architecture spec, causing runtime query failures | 1 (Unlikely) | 2 (Degraded) | 2 | Integration test: query `information_schema.columns` for `clientes` table; assert all columns are snake_case per architecture spec | Monitor |
| R12 | BUS | Empty-state component (EmptyState) is not shown when the client list has zero records — user sees blank space instead of the guidance message pointing them to create the first client | 1 (Unlikely) | 1 (Minor) | 1 | Component test: render ClienteListView with empty `[]` data; assert `EmptyState` component is in the DOM with actionable message | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey + High risk (score ≥6) + No workaround exists

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-2.3: POST /api/v1/clientes with valid body returns 201 + created record | API Integration | R3, R4 | 1 | DEV | Assert response shape, UUID id, all fields present |
| AC-2.3: POST with duplicate NIT returns 409 + "El NIT/RUC ya está registrado" (no stack trace) | API Integration | R1 | 1 | DEV/QA | Backend enforces uniqueness; Problem Details RFC 7807; NFR6 |
| AC-2.3: POST with missing required fields returns 400 Problem Details with field-level errors | API Integration | R4 | 1 | DEV/QA | FluentValidation — all required field scenarios in one parameterized test |
| AC-2.5: DELETE /api/v1/clientes/:id → contactos remain with clienteId = null (ON DELETE SET NULL) | API Integration | R2 | 1 | DEV | Seed cliente + contacts; DELETE; assert contacts survive, clienteId = null |
| AC-E2.4: Validation prevents saving client with empty required fields; form NOT submitted | Component | R4, R6 | 1 | DEV | Zod client-side: submit empty form; assert inline errors on all required fields; MSW confirms no POST |
| AC-E2.1: Create client → new record appears in ClienteListView immediately (cache invalidated) | Component | R3 | 1 | DEV | Mock POST success; assert `invalidateQueries(['clientes'])` called; list re-renders with new item |
| AC-E2.3: Edit client → changes reflected in detail panel and list immediately after save | Component | R3 | 1 | DEV | Mock PUT success; assert `invalidateQueries(['clientes'])` called; updated data renders |
| AC-E2.5: Delete → client removed from list; right panel returns to empty/default state | Component | R3 | 1 | DEV | Mock DELETE success; assert list no longer contains deleted item; detail panel reset |

**Total P0:** 8 tests, 16.0 hours

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-2.1: GET /api/v1/clientes returns array of all clientes | API Integration | — | 1 | DEV | Assert 200, array, shape: id+nombre+nit+telefono+ciudad+createdAt+updatedAt |
| AC-2.1: GET /api/v1/clientes/:id returns single cliente by UUID | API Integration | — | 1 | DEV | Valid UUID → 200 + full object; unknown UUID → 404 Problem Details |
| AC-E2.2: Search filters list in real time by Nombre (client-side) | Component | R5 | 1 | DEV | Type partial name; assert only matching items visible; assert no new API call fired (MSW) |
| AC-E2.2: Search filters list in real time by NIT/RUC (client-side) | Component | R5 | 1 | DEV | Type partial NIT; assert correct filtering; case-insensitive matching |
| AC-E2.2: Search results under 1 second with 500 records (NFR1) | Component/Perf | R5 | 1 | DEV/QA | 500 mock clients; measure keypress-to-render elapsed time < 1000ms |
| AC-2.2: Click cliente in list → right panel shows full details (Nombre, NIT/RUC, Teléfono, Ciudad) | E2E | — | 1 | QA | Playwright: navigate to /clientes; click first item; assert detail panel content |
| AC-2.2: URL updates to /clientes/:clienteId when client selected (FR30 deep linking) | E2E | R8 | 1 | QA | Playwright: click item; assert URL contains clienteId UUID |
| AC-2.2: Direct URL /clientes/:clienteId loads correct detail (FR30) | E2E | R8 | 1 | QA | Playwright: navigate directly to URL; assert detail renders without list click |
| AC-2.2: Non-existent clienteId URL shows graceful not-found message | Component | R8 | 1 | DEV | Mock 404 from API; assert not-found message in right panel; no crash |
| AC-2.3: "Nuevo cliente" button opens form with all 4 required fields | Component | — | 1 | DEV | Click button; assert form renders with Nombre, NIT/RUC, Teléfono, Ciudad fields |
| AC-2.4: Edit form opens pre-filled with current client values (FR6) | Component | — | 1 | DEV | Click "Editar"; assert form inputs contain existing values |
| AC-2.4: Clicking "Cancelar" without saving preserves original data | Component | R9 | 1 | DEV | Open edit form; modify field; click Cancelar; assert original data visible; no PUT call |
| AC-2.5: Delete confirmation dialog appears with correct text and two buttons | Component | R10 | 1 | DEV | Click "Eliminar"; assert dialog text "¿Eliminar este cliente?"; assert "Confirmar" and "Cancelar" buttons |
| AC-2.6: Sort "Nombre A→Z" orders list alphabetically ascending without new API call | Component | R7 | 1 | DEV | Select sort option; assert order; MSW confirms no new GET request |

**Total P1:** 14 tests, 14.0 hours

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-2.6: Sort "Nombre Z→A" orders list alphabetically descending without new API call | Component | R7 | 1 | DEV | Assert descending order; no GET fired |
| AC-2.6: Sort "Más reciente" orders by createdAt descending (newest first) | Component | — | 1 | DEV | Seed clients with different createdAt; assert newest first |
| AC-2.6: Sort "Más antiguo" orders by createdAt ascending (oldest first) | Component | — | 1 | DEV | Assert oldest first |
| AC-2.6: Active search filter preserved when sort changes (AC-E2.6) | Component | R7 | 1 | DEV | Type filter; change sort; assert filter active, sort applied to filtered set |
| AC-2.6: Default sort on page load is "Más reciente" | Component | — | 1 | DEV | Load without prior interaction; assert sort state = "fecha-desc" |
| AC-2.1: EmptyState rendered when no clients exist | Component | R12 | 1 | DEV | Mock empty array; assert EmptyState in DOM with guidance message |
| AC-2.1: ErrorPanel with "Reintentar" button shown when backend is unavailable | Component | — | 1 | DEV | Mock fetch failure; assert ErrorPanel renders; click Reintentar triggers refetch |
| AC-E2.1: Toast "Cliente creado correctamente" shown on successful creation | Component | — | 1 | DEV | Mock POST success; assert success toast message |

**Total P2:** 8 tests, 4.0 hours

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Edge cases for DB validation

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| `clientes` table columns are snake_case per architecture spec (nit, nombre, etc.) | API Integration | 1 | DEV | Query information_schema.columns; assert all column names snake_case |
| Toast "Cliente actualizado correctamente" on successful edit | Component | 1 | DEV | Mock PUT success; assert correct toast text |
| Toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." when client with contacts deleted | Component | 1 | DEV | Mock DELETE success with contact-orphan scenario; assert specific toast |

**Total P3:** 3 tests, 0.75 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose:** Fast feedback — catch broken API routes and TypeScript errors before running full suite

- [ ] TC-E2-P0-01: POST /api/v1/clientes with valid body → 201 (30s)
- [ ] TC-E2-P0-05: Frontend Zod validation — submit empty form → inline errors, no POST (45s)
- [ ] TC-E2-P0-06: Create client → list updates immediately (cache invalidated) (45s)

**Total:** 3 scenarios

### P0 Tests (<10 min)

**Purpose:** Critical path validation — CRUD correctness, validation, cache invalidation, referential integrity

```
Phase 1 — Backend API Gate
  1. TC-E2-P0-01  POST valid cliente → 201 + created record
  2. TC-E2-P0-02  POST duplicate NIT → 409 + "El NIT/RUC ya está registrado"
  3. TC-E2-P0-03  POST missing required fields → 400 Problem Details (field-level errors)
  4. TC-E2-P0-04  DELETE cliente with contacts → contacts remain, clienteId = null

Phase 2 — Frontend Critical Path
  5. TC-E2-P0-05  Empty form submit → inline validation errors, no POST issued
  6. TC-E2-P0-06  Create → list cache invalidated, new record visible
  7. TC-E2-P0-07  Edit → list cache invalidated, updated record visible
  8. TC-E2-P0-08  Delete → list cache invalidated, item removed, panel reset
```

**Total:** 8 P0 scenarios

### P1 Tests (<30 min)

**Purpose:** Important feature coverage — search, detail view, routing, form UX, sort basics

```
Phase 3 — Backend Read Endpoints
  9.  TC-E2-P1-01  GET /api/v1/clientes → 200 array
 10.  TC-E2-P1-02  GET /api/v1/clientes/:id → 200 single / 404 missing

Phase 4 — Search & Performance
 11.  TC-E2-P1-03  Search by Nombre (client-side, no new API call)
 12.  TC-E2-P1-04  Search by NIT/RUC (client-side, case-insensitive)
 13.  TC-E2-P1-05  Search 500 records < 1s (NFR1)

Phase 5 — Detail View & Deep Linking
 14.  TC-E2-P1-06  Click cliente → right panel shows full detail
 15.  TC-E2-P1-07  URL updates to /clientes/:clienteId on click
 16.  TC-E2-P1-08  Direct URL /clientes/:clienteId loads correct detail
 17.  TC-E2-P1-09  Non-existent clienteId → graceful not-found message

Phase 6 — Form UX & Sort
 18.  TC-E2-P1-10  "Nuevo cliente" button opens form with 4 required fields
 19.  TC-E2-P1-11  Edit form pre-filled with current values
 20.  TC-E2-P1-12  Cancel edit → original data preserved, no PUT issued
 21.  TC-E2-P1-13  Delete confirmation dialog renders before any DELETE call
 22.  TC-E2-P1-14  Sort "Nombre A→Z" orders list, no new API call
```

**Total:** 14 P1 scenarios

### P2/P3 Tests (<60 min)

**Purpose:** Full regression — sort variants, edge states, toasts, DB schema

```
Phase 7 — Sort Variants (P2)
 23.  TC-E2-P2-01  Sort "Nombre Z→A"
 24.  TC-E2-P2-02  Sort "Más reciente" (createdAt desc)
 25.  TC-E2-P2-03  Sort "Más antiguo" (createdAt asc)
 26.  TC-E2-P2-04  Sort preserves active search filter
 27.  TC-E2-P2-05  Default sort = "Más reciente" on page load

Phase 8 — Edge State & UX (P2)
 28.  TC-E2-P2-06  EmptyState on zero clients
 29.  TC-E2-P2-07  ErrorPanel + Reintentar on backend failure
 30.  TC-E2-P2-08  Toast "Cliente creado correctamente"

Phase 9 — DB Schema & Toast Variants (P3, on-demand)
 31.  TC-E2-P3-01  clientes table snake_case columns
 32.  TC-E2-P3-02  Toast "Cliente actualizado correctamente"
 33.  TC-E2-P3-03  Toast "Cliente eliminado. Sus contactos..." (with contacts)
```

**Total:** 11 P2/P3 scenarios

---

## Detailed Test Cases

### P0 — Must Pass Before Any Story Implementation Begins

#### TC-E2-P0-01: POST /api/v1/clientes with Valid Body Returns 201

**Level:** API Integration (xUnit + WebApplicationFactory)
**Story:** 2.3
**Requirement:** AC-2.3 — client created and appears immediately (FR27)
**Risk Covered:** R3, R4

**Precondition:** Backend running via `WebApplicationFactory<Program>`. Test PostgreSQL DB with `clientes` migration applied.

**Test Steps:**
1. POST `/api/v1/clientes` with body `{ "nombre": "Empresa Test S.A.", "nit": "900123456-1", "telefono": "3001234567", "ciudad": "Bogotá" }`.
2. Inspect response.

**Expected Result:**
- HTTP 201 Created.
- Response body contains: `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601), `updatedAt`.
- Record exists in DB (`SELECT * FROM clientes WHERE nit = '900123456-1'` returns one row).
- No `stackTrace` in response.

**Automation:** xUnit parameterized test using `WebApplicationFactory`.

---

#### TC-E2-P0-02: POST with Duplicate NIT Returns 409 and Correct Error Message

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-2.3 — "El NIT/RUC ya está registrado" error (NFR6)
**Risk Covered:** R1

**Precondition:** A cliente with NIT `900123456-1` already exists in DB.

**Test Steps:**
1. POST `/api/v1/clientes` with same NIT `900123456-1` (different Nombre).
2. Inspect response.
3. Query DB: `SELECT COUNT(*) FROM clientes WHERE nit = '900123456-1'`.

**Expected Result:**
- HTTP 409 Conflict.
- `Content-Type: application/problem+json`.
- Response contains `detail` or `errors.nit` with value `"El NIT/RUC ya está registrado"`.
- No `stackTrace`, no C# type names exposed.
- DB count = 1 (no duplicate created).

**Automation:** xUnit integration test.

---

#### TC-E2-P0-03: POST with Missing Required Fields Returns 400 with Field-Level Errors

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4 — system prevents saving with empty required fields (FR8)
**Risk Covered:** R4

**Precondition:** Backend running. No existing data required.

**Test Steps (parameterized — test each missing-field scenario):**
1. POST with body `{}` (all fields missing).
2. POST with body `{ "nit": "123", "telefono": "300", "ciudad": "Cali" }` (Nombre missing).
3. POST with body `{ "nombre": "Test", "telefono": "300", "ciudad": "Cali" }` (NIT missing).
4. POST with body `{ "nombre": "Test", "nit": "123" }` (Teléfono and Ciudad missing).

**Expected Result for each case:**
- HTTP 400 Bad Request.
- `Content-Type: application/problem+json`.
- Response `errors` object contains keys for each missing field (e.g., `errors.nombre`, `errors.nit`).
- No 201 or 200 returned on any missing-field case.

**Automation:** xUnit parameterized theory test.

---

#### TC-E2-P0-04: DELETE Cliente with Contacts — Contacts Remain with clienteId = null

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 — contacts retain data with clienteId = null (FR23)
**Risk Covered:** R2

**Precondition:** Seed: 1 cliente (id = `clienteA`) + 2 contactos referencing `cliente_id = clienteA`.

**Test Steps:**
1. DELETE `/api/v1/clientes/{clienteA}`.
2. GET `/api/v1/contactos` and inspect each seeded contacto.

**Expected Result:**
- DELETE returns 204 No Content.
- GET `/api/v1/clientes/{clienteA}` returns 404 (deleted).
- Both contactos still exist in DB with `clienteId = null`.
- No cascade-delete occurred.

**Automation:** xUnit integration test (seed via API or direct EF Core context).

---

#### TC-E2-P0-05: Zod Validation — Submit Empty Form Shows Inline Errors, No POST Issued

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-E2.4 — clear inline error messages, form NOT submitted (FR8)
**Risk Covered:** R4, R6

**Precondition:** `ClienteForm` rendered in create mode with MSW intercepting POST `/api/v1/clientes`.

**Test Steps:**
1. Render `<ClienteForm />` (create mode).
2. Click submit without filling any field.
3. Inspect DOM for error messages.
4. Check MSW request log.

**Expected Result:**
- Inline error messages appear adjacent to each required field (Nombre, NIT/RUC, Teléfono, Ciudad).
- Error text is in Spanish (e.g., "El nombre es requerido").
- MSW captures zero POST requests to `/api/v1/clientes`.
- Form does not close or navigate.

**Automation:** Vitest + RTL + MSW handler asserting no outgoing POST.

---

#### TC-E2-P0-06: Create Client → Cache Invalidated, New Record Appears in List

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3
**Requirement:** AC-E2.1 — client appears in list immediately (FR27, NFR2)
**Risk Covered:** R3

**Precondition:** ClienteListView rendered with MSW returning initial list of 2 clients. `useCreateCliente` hook wired to MSW.

**Test Steps:**
1. Render `ClienteListView` + `useCreateCliente` within a `QueryClientProvider`.
2. Trigger mutation with valid new client payload.
3. MSW returns 201 with new client object.
4. Assert list re-fetches.

**Expected Result:**
- `queryClient.invalidateQueries({ queryKey: ['clientes'] })` called on `onSuccess`.
- MSW captures a subsequent GET `/api/v1/clientes` (refetch triggered).
- List now shows 3 items including the new client.
- No manual page reload required.

**Automation:** Vitest + RTL + MSW + TanStack Query test utilities.

---

#### TC-E2-P0-07: Edit Client → Cache Invalidated, Updated Record Reflects in List and Detail

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC-2.4 — changes reflected immediately (FR27, NFR2)
**Risk Covered:** R3

**Precondition:** ClienteDetailView rendered with existing client data. MSW intercepts PUT.

**Test Steps:**
1. Render detail view showing client with Nombre "Empresa Vieja".
2. Open edit form; change Nombre to "Empresa Nueva".
3. Submit form; MSW returns 200 with updated object.
4. Assert cache invalidation and UI update.

**Expected Result:**
- `invalidateQueries(['clientes'])` called on success.
- Detail panel shows "Empresa Nueva" without page reload.
- List panel (if rendered) also reflects the new name.
- Toast "Cliente actualizado correctamente" shown.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P0-08: Delete → Client Removed from List, Detail Panel Resets

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC-2.5 — client removed from list immediately; right panel empty/default state
**Risk Covered:** R3

**Precondition:** Split-panel view rendered with client selected and detail visible. MSW intercepts DELETE.

**Test Steps:**
1. Render split-panel with client selected.
2. Click "Eliminar" → confirm in dialog.
3. MSW returns 204.
4. Inspect list and detail panel.

**Expected Result:**
- `invalidateQueries(['clientes'])` called.
- Deleted client no longer in list.
- Right panel reverts to empty/default state (no detail shown).
- Toast "Cliente eliminado correctamente" displayed (or contact-orphan variant if applicable).

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E2-P1-01: GET /api/v1/clientes Returns 200 Array

**Level:** API Integration
**Story:** 2.1
**Requirement:** AC-2.1 — list all clients (FR2)

**Test Steps:**
1. Seed 3 clients in test DB.
2. GET `/api/v1/clientes`.

**Expected Result:**
- HTTP 200.
- Response is a JSON array (not wrapped object).
- Array length = 3.
- Each element has: `id` (UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-02: GET /api/v1/clientes/:id — Valid UUID Returns 200; Unknown UUID Returns 404

**Level:** API Integration
**Story:** 2.2
**Requirement:** AC-2.2 — client detail (FR5); graceful 404

**Test Steps:**
1. GET `/api/v1/clientes/{validId}` → assert 200 + full object.
2. GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000` → assert 404 Problem Details.

**Expected Result:**
- Valid: 200 + all fields including `createdAt`, `updatedAt`.
- Invalid: 404 + `Content-Type: application/problem+json`; no `stackTrace`.

**Automation:** xUnit integration test.

---

#### TC-E2-P1-03: Real-Time Search Filters by Nombre (No API Call)

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-E2.2 — filter in real time (FR3)
**Risk Covered:** R5

**Precondition:** ClienteListView with 5 mock clients: ["Acme Corp", "Beta SA", "Acme Beta", "Gamma", "Delta"].

**Test Steps:**
1. Type "acme" in search field.
2. Inspect visible list items.
3. Check MSW for any new GET calls.

**Expected Result:**
- Only "Acme Corp" and "Acme Beta" visible (case-insensitive match).
- MSW logs NO new GET `/api/v1/clientes` request (client-side filter only).

**Automation:** Vitest + RTL + MSW request assertion.

---

#### TC-E2-P1-04: Real-Time Search Filters by NIT/RUC (Client-Side)

**Level:** Component
**Story:** 2.1
**Requirement:** AC-E2.2 — filter by NIT/RUC (FR4)
**Risk Covered:** R5

**Test Steps:**
1. Type partial NIT (e.g., "9001") in search field.
2. Inspect visible items.

**Expected Result:**
- Only clients whose NIT starts with or contains "9001" are visible.
- No new API call triggered.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-05: Search 500 Records Renders in Under 1 Second (NFR1)

**Level:** Component / Performance
**Story:** 2.1
**Requirement:** NFR1 — search < 1s with 500 records
**Risk Covered:** R5

**Precondition:** 500 mock client objects generated via factory function.

**Test Steps:**
1. Render ClienteListView with 500 items loaded in TanStack Query cache.
2. Record timestamp before typing in search box.
3. Type 3 characters.
4. Record timestamp after filtered list renders.

**Expected Result:**
- Elapsed time < 1000ms.
- Correct filtered items visible.
- useMemo or equivalent optimization applied (dependency array correct).

**Automation:** Vitest with `performance.now()` assertions.

---

#### TC-E2-P1-06: Click Cliente in List → Right Panel Shows Full Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 — complete client details in right panel (FR5)

**Precondition:** Frontend + backend running. At least 1 client seeded.

**Test Steps:**
1. Navigate to `http://localhost:5173/clientes`.
2. Click first client list item.
3. Inspect right panel.

**Expected Result:**
- Right panel shows: Nombre, NIT/RUC, Teléfono, Ciudad.
- All four fields are populated and visible.
- Left panel list remains visible (split layout intact).

**Automation:** Playwright E2E.

---

#### TC-E2-P1-07: URL Updates to /clientes/:clienteId When Client Selected

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 — deep-link URL update (FR30)
**Risk Covered:** R8

**Test Steps:**
1. Navigate to `/clientes`.
2. Click a client item.
3. Inspect browser URL.

**Expected Result:**
- URL changes to `/clientes/{uuid}` where `{uuid}` matches the selected client's ID.
- URL format is a valid UUID4 string.
- No full page reload (SPA navigation).

**Automation:** Playwright E2E.

---

#### TC-E2-P1-08: Direct URL /clientes/:clienteId Loads Correct Detail

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-2.2 — direct URL access loads client (FR30)
**Risk Covered:** R8

**Precondition:** Known client ID from seeded data.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes/{knownId}` (no prior navigation).
2. Wait for render.

**Expected Result:**
- Right panel renders with correct client's detail (Nombre, NIT, etc.).
- No redirect to `/clientes` or blank panel.
- Navigation shell visible.

**Automation:** Playwright E2E.

---

#### TC-E2-P1-09: Non-Existent clienteId in URL Shows Graceful Not-Found Message

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.2
**Requirement:** AC-2.2 — not-found message displayed gracefully

**Precondition:** MSW returns 404 for GET `/api/v1/clientes/00000000-0000-0000-0000-000000000000`.

**Test Steps:**
1. Render `ClienteDetailView` with `clienteId = "00000000-0000-0000-0000-000000000000"`.
2. Mock API returns 404.
3. Inspect right panel.

**Expected Result:**
- Not-found message displayed in right panel (e.g., "Cliente no encontrado").
- No JS error / uncaught exception in console.
- Navigation shell remains intact.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-10: "Nuevo Cliente" Button Opens Form with 4 Required Fields

**Level:** Component (Vitest + RTL)
**Story:** 2.3
**Requirement:** AC-2.3 — form with Nombre, NIT/RUC, Teléfono, Ciudad (FR1)

**Test Steps:**
1. Render ClienteListView or split-panel view.
2. Click "Nuevo cliente" button.
3. Inspect rendered form.

**Expected Result:**
- Form opens with 4 input fields: Nombre, NIT/RUC, Teléfono, Ciudad.
- All fields have visible labels in Spanish.
- Submit button present.

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-11: Edit Form Opens Pre-Filled with Current Client Values

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC-2.4 — form pre-filled with current values (FR6)

**Precondition:** ClienteDetailView rendered with client: `{ nombre: "Empresa X", nit: "800456789-2", telefono: "6012345678", ciudad: "Medellín" }`.

**Test Steps:**
1. Click "Editar" button.
2. Inspect all 4 form input values.

**Expected Result:**
- Nombre input has value "Empresa X".
- NIT/RUC input has value "800456789-2".
- Teléfono input has value "6012345678".
- Ciudad input has value "Medellín".

**Automation:** Vitest + RTL.

---

#### TC-E2-P1-12: Cancel Edit — Original Data Preserved, No PUT Issued

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.4
**Requirement:** AC-2.4 — cancel without saving
**Risk Covered:** R9

**Test Steps:**
1. Open edit form.
2. Change Nombre to "Nombre Diferente".
3. Click "Cancelar".
4. Inspect detail view; check MSW log.

**Expected Result:**
- Detail view still shows original Nombre (not "Nombre Diferente").
- MSW captures zero PUT requests to `/api/v1/clientes/:id`.
- Form closes without any mutation.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-13: Delete Confirmation Dialog Appears Before Any DELETE Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.5
**Requirement:** AC-2.5 — confirmation required before delete
**Risk Covered:** R10

**Test Steps:**
1. Click "Eliminar" button.
2. Inspect DOM for dialog.
3. Check MSW log (before confirming).

**Expected Result:**
- Dialog contains text "¿Eliminar este cliente?".
- Both "Confirmar" and "Cancelar" buttons present.
- MSW confirms zero DELETE requests issued before dialog confirmation.

**Automation:** Vitest + RTL + MSW.

---

#### TC-E2-P1-14: Sort "Nombre A→Z" Reorders List Alphabetically, No New API Call

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.6
**Requirement:** AC-2.6 — client-side sort (SortControl)
**Risk Covered:** R7

**Precondition:** ClienteListView with mock clients: ["Zebra Corp", "Alpha SA", "Mango Ltda"].

**Test Steps:**
1. Select "Nombre A→Z" from SortControl.
2. Inspect list order.
3. Check MSW for new GET.

**Expected Result:**
- List order: ["Alpha SA", "Mango Ltda", "Zebra Corp"].
- MSW captures zero new GET `/api/v1/clientes` requests.
- `sortOption` state = `"nombre-asc"`.

**Automation:** Vitest + RTL + MSW.

---

### P2 — Should Pass Before Epic is Marked Complete

#### TC-E2-P2-01: Sort "Nombre Z→A" Reorders Alphabetically Descending

**Level:** Component
**Story:** 2.6

**Test Steps:** Select "Nombre Z→A"; assert order reversed.

**Expected Result:** ["Zebra Corp", "Mango Ltda", "Alpha SA"]. No new API call.

---

#### TC-E2-P2-02: Sort "Más Reciente" Orders by createdAt Descending

**Level:** Component
**Story:** 2.6

**Test Steps:** Seed clients with known `createdAt` differences; select "Más reciente"; assert newest first.

**Expected Result:** Newest `createdAt` appears first in list. `sortOption = "fecha-desc"`.

---

#### TC-E2-P2-03: Sort "Más Antiguo" Orders by createdAt Ascending

**Level:** Component
**Story:** 2.6

**Test Steps:** Select "Más antiguo"; assert oldest first.

**Expected Result:** Oldest `createdAt` appears first. `sortOption = "fecha-asc"`.

---

#### TC-E2-P2-04: Sort Preserves Active Search Filter When Sort Changes

**Level:** Component
**Story:** 2.6
**Requirement:** AC-E2.6 — sort without clearing search
**Risk Covered:** R7

**Test Steps:**
1. Type "acme" in search → 2 results visible.
2. Change sort from "Más reciente" to "Nombre A→Z".
3. Inspect state.

**Expected Result:**
- Search input still contains "acme".
- Only acme-matching clients visible (filter preserved).
- Results re-ordered per new sort.
- No search input cleared.

---

#### TC-E2-P2-05: Default Sort on Initial Page Load is "Más reciente"

**Level:** Component
**Story:** 2.6

**Test Steps:** Render ClienteListView without any prior interaction; inspect sort state and SortControl selected value.

**Expected Result:** `sortOption` state = `"fecha-desc"`. SortControl displays "Más reciente" as selected.

---

#### TC-E2-P2-06: EmptyState Component Displayed When No Clients Exist

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 — empty state with guidance
**Risk Covered:** R12

**Test Steps:** Render ClienteListView with MSW returning `[]`; inspect DOM.

**Expected Result:** EmptyState component rendered; contains actionable guidance text (e.g., "Crea tu primer cliente"); no blank space.

---

#### TC-E2-P2-07: ErrorPanel with "Reintentar" Shown on Backend Failure

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.1
**Requirement:** AC-2.1 — error state with retry

**Test Steps:** MSW returns network error for GET `/api/v1/clientes`; render ClienteListView; inspect DOM; click "Reintentar".

**Expected Result:** ErrorPanel rendered instead of list. "Reintentar" button present. Clicking it triggers another GET request (MSW captures second call).

---

#### TC-E2-P2-08: Toast "Cliente creado correctamente" on Successful Create

**Level:** Component (Vitest + RTL + MSW)
**Story:** 2.3

**Test Steps:** Submit valid create form; MSW returns 201; inspect toast.

**Expected Result:** Success toast with text "Cliente creado correctamente" visible. (Spanish, no English text.)

---

### P3 — Nice to Have / On-Demand

#### TC-E2-P3-01: clientes Table Has Correct snake_case Columns

**Level:** API Integration
**Story:** 2.3 (DB migration)
**Risk Covered:** R11

**Test Steps:** Query `information_schema.columns` for `clientes` table.

**Expected Result:** Columns present: `id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`. No PascalCase columns.

---

#### TC-E2-P3-02: Toast "Cliente actualizado correctamente" on Successful Edit

**Level:** Component
**Story:** 2.4

**Test Steps:** Submit valid edit; MSW returns 200; inspect toast.

**Expected Result:** Success toast "Cliente actualizado correctamente".

---

#### TC-E2-P3-03: Toast "Cliente eliminado. Sus contactos..." on Delete with Orphaned Contacts

**Level:** Component
**Story:** 2.5
**Requirement:** AC-2.5 — specific toast when contacts are orphaned

**Test Steps:** Delete client that has contacts (mock scenario); MSW returns 204; inspect toast text.

**Expected Result:** Toast contains "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."

---

## Acceptance Criteria Coverage Matrix

| Epic / Story AC | Story | Test Cases | Status |
|-----------------|-------|------------|--------|
| AC-E2.1: Register new client → appears in list immediately | 2.3 | TC-E2-P0-06 | Covered |
| AC-E2.2: Search by name or NIT/RUC in under 1 second | 2.1 | TC-E2-P1-03, TC-E2-P1-04, TC-E2-P1-05 | Covered |
| AC-E2.3: View detail, edit any field, save changes | 2.2, 2.4 | TC-E2-P1-06, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P0-07 | Covered |
| AC-E2.4: Prevent save with empty required fields — inline errors | 2.3, 2.4 | TC-E2-P0-05, TC-E2-P0-03 | Covered |
| AC-E2.5: Delete → client disappears from list | 2.5 | TC-E2-P0-08 | Covered |
| AC-E2.6: Sort by 4 criteria, preserves filter, no page reload | 2.6 | TC-E2-P1-14, TC-E2-P2-01–04 | Covered |
| AC-2.1.a: Scrollable list — Nombre + NIT/RUC visible per item | 2.1 | TC-E2-P1-06 (detail also asserts list) | Covered |
| AC-2.1.b: Real-time filter on keypress | 2.1 | TC-E2-P1-03, TC-E2-P1-04 | Covered |
| AC-2.1.c: EmptyState when no clients | 2.1 | TC-E2-P2-06 | Covered |
| AC-2.1.d: ErrorPanel + Reintentar on backend failure | 2.1 | TC-E2-P2-07 | Covered |
| AC-2.2.a: Right panel shows full detail on click | 2.2 | TC-E2-P1-06 | Covered |
| AC-2.2.b: URL updates to /clientes/:clienteId | 2.2 | TC-E2-P1-07 | Covered |
| AC-2.2.c: Direct URL loads correct detail | 2.2 | TC-E2-P1-08 | Covered |
| AC-2.2.d: Non-existent clienteId → graceful not-found | 2.2 | TC-E2-P1-09 | Covered |
| AC-2.3.a: "Nuevo cliente" button opens form with 4 required fields | 2.3 | TC-E2-P1-10 | Covered |
| AC-2.3.b: Create with all valid fields → success toast + list update | 2.3 | TC-E2-P0-01, TC-E2-P0-06, TC-E2-P2-08 | Covered |
| AC-2.3.c: Submit empty/partial form → inline errors, no submission | 2.3 | TC-E2-P0-05 | Covered |
| AC-2.3.d: Duplicate NIT/RUC → 409 "El NIT/RUC ya está registrado" | 2.3 | TC-E2-P0-02 | Covered |
| AC-2.4.a: Edit form pre-filled with current values | 2.4 | TC-E2-P1-11 | Covered |
| AC-2.4.b: Save changes reflected immediately + toast | 2.4 | TC-E2-P0-07, TC-E2-P3-02 | Covered |
| AC-2.4.c: Validate required fields on update | 2.4 | TC-E2-P0-03 (PUT variant) | Covered |
| AC-2.4.d: Cancel → no change, no mutation | 2.4 | TC-E2-P1-12 | Covered |
| AC-2.5.a: Confirmation dialog before delete | 2.5 | TC-E2-P1-13 | Covered |
| AC-2.5.b: Confirm delete → removed from list + panel reset | 2.5 | TC-E2-P0-08 | Covered |
| AC-2.5.c: Cancel dialog → client unchanged | 2.5 | TC-E2-P1-13 (verify no DELETE) | Covered |
| AC-2.5.d: Delete with contacts → contacts remain (clienteId = null) | 2.5 | TC-E2-P0-04 | Covered |
| AC-2.6.a: "Nombre A→Z" sort | 2.6 | TC-E2-P1-14 | Covered |
| AC-2.6.b: "Nombre Z→A" sort | 2.6 | TC-E2-P2-01 | Covered |
| AC-2.6.c: "Más reciente" sort | 2.6 | TC-E2-P2-02 | Covered |
| AC-2.6.d: "Más antiguo" sort | 2.6 | TC-E2-P2-03 | Covered |
| AC-2.6.e: Sort preserves active search filter | 2.6 | TC-E2-P2-04 | Covered |
| AC-2.6.f: Default sort = "Más reciente" | 2.6 | TC-E2-P2-05 | Covered |

---

## NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1s with 500 records | TC-E2-P1-05 | Component/Perf |
| NFR2 | CRUD reflects changes in UI < 2s | TC-E2-P0-06, TC-E2-P0-07, TC-E2-P0-08 | Component |
| NFR5 | Input validation and sanitization | TC-E2-P0-03, TC-E2-P0-05 | API Integration + Component |
| NFR6 | No stack traces exposed to users | TC-E2-P0-02, TC-E2-P0-03 | API Integration |

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 8 | 2.0 | 16.0 | Complex setup: TestContainers, MSW + QueryClient, multi-layer validation |
| P1 | 14 | 1.0 | 14.0 | Standard coverage: API reads, E2E navigation, component form UX |
| P2 | 8 | 0.5 | 4.0 | Sort variants, edge states, toast verification |
| P3 | 3 | 0.25 | 0.75 | DB schema check, toast text variants |
| **Total** | **33** | — | **34.75 hours** | **~4.3 days** |

### Prerequisites

**Test Data — Factories:**

| Factory | Purpose | Layer |
|---------|---------|-------|
| `ClienteFactory` | Generate valid `CreateClienteRequest` objects with unique NITs (using faker-based sequential IDs) | Frontend + Backend |
| `ClienteEntityFactory` | Seed `ClienteEntity` records directly into TestContainers DB for integration tests | Backend |
| `ContactoEntityFactory` | Seed `ContactoEntity` with nullable `clienteId` for TC-E2-P0-04 | Backend |

**Tooling:**

| Tool | Purpose | Layer |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering and interaction | Frontend |
| MSW 2+ | API mock — intercept fetch, assert no unexpected calls | Frontend |
| TanStack Query test utilities | `QueryClientProvider` wrapper, cache assertions | Frontend |
| Playwright 1.40+ | E2E tests for detail view, deep linking, split panel | E2E |
| xUnit 2+ | Backend unit + integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing (CRUD endpoints) | Backend |
| TestContainers (Postgres) | Isolated DB for ON DELETE SET NULL and migration tests | Backend |

**Environment:**
- Node.js 20+ with npm — frontend build/test
- .NET 10 SDK — backend build/test
- PostgreSQL 18+ running locally (or TestContainers) — `siesa_agents_db` with Epic 1 + Epic 2 migrations
- All npm dependencies installed (`npm install`)
- All NuGet packages restored (`dotnet restore`)
- Epic 1 foundation complete (navigation shell, DB connection, middleware) — prerequisite for all Epic 2 tests

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — all 8 tests must pass before any Epic 2 story can be closed)
- **P1 pass rate**: ≥95% (at least 13 of 14 — any failure requires documented justification)
- **P2/P3 pass rate**: ≥90% (informational; deferred with justification acceptable)
- **High-risk mitigations** (R1–R5): 100% complete or formally approved waivers before Epic 2 closure

### Coverage Targets

- **Critical paths** (CRUD full lifecycle + cache invalidation): 100%
- **Security scenarios** (NFR6 — no stack traces, validation bypass prevention): 100%
- **Data integrity scenarios** (NIT uniqueness, ON DELETE SET NULL): 100%
- **Business logic** (validation, sort, filter): ≥80%
- **Edge cases** (empty state, error panel, cancel flows): ≥70%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 through TC-E2-P0-08)
- [ ] No high-risk items (R1–R5) unmitigated
- [ ] NIT uniqueness enforced at DB level AND API level (R1)
- [ ] ON DELETE SET NULL confirmed for contactos on cliente deletion (R2)
- [ ] TanStack Query invalidation verified on all 3 mutation types (R3)
- [ ] Backend FluentValidation operates independently of frontend Zod (R4)
- [ ] Search performance ≤ 1s with 500 records measured (R5)

---

## Mitigation Plans

### R1: NIT/RUC Uniqueness Not Enforced at Database Level (Score: 6)

**Mitigation Strategy:** Enforce unique constraint at two levels: (1) EF Core configuration — `builder.HasIndex(e => e.NIT).IsUnique()` in `ClienteConfiguration.cs`; (2) `CreateClienteRequestValidator` catches duplicate in `MustAsync` call to repository before DB insert; (3) `ExceptionHandlingMiddleware` catches `DbUpdateException` with unique violation and returns 409 Problem Details with message "El NIT/RUC ya está registrado" — no stack trace.

**Owner:** DEV
**Timeline:** Story 2.3 implementation
**Status:** Planned
**Verification:** TC-E2-P0-02 — integration test seeding duplicate NIT, asserting 409 + correct message + single DB record

---

### R2: DELETE Does Not Implement ON DELETE SET NULL (Score: 6)

**Mitigation Strategy:** Configure `ContactoConfiguration.cs` with `builder.HasOne(c => c.Cliente).WithMany().HasForeignKey(c => c.ClienteID).OnDelete(DeleteBehavior.SetNull)`. Migration must generate `ON DELETE SET NULL` in PostgreSQL FK constraint. Verify with `pg_dump` or `information_schema.referential_constraints` in integration test.

**Owner:** DEV
**Timeline:** Story 2.5 implementation (requires contactos migration from Epic 3 foundation — can be stubbed in Epic 2 test via direct EF context seeding)
**Status:** Planned
**Verification:** TC-E2-P0-04 — seed cliente + contacts, DELETE cliente, assert contacts persist with `clienteId = null`

---

### R3: TanStack Query Cache Not Invalidated After Mutations (Score: 6)

**Mitigation Strategy:** Enforce `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in ALL three mutation hooks (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) inside `onSuccess` callback. Architecture pattern already documented — enforcement is implementation verification via test. MSW + QueryClient wrapper tests will catch missing invalidation by asserting the subsequent GET refetch occurs.

**Owner:** DEV
**Timeline:** Stories 2.3, 2.4, 2.5 implementation
**Status:** Planned
**Verification:** TC-E2-P0-06, TC-E2-P0-07, TC-E2-P0-08

---

### R4: Frontend Zod Bypass — Backend Validation Must Be Independent (Score: 6)

**Mitigation Strategy:** `CreateClienteRequestValidator` and `UpdateClienteRequestValidator` must enforce all required-field rules without any dependency on Zod or frontend state. API integration tests POST directly to endpoints bypassing frontend (curl-equivalent via `HttpClient`) with missing/empty fields. FluentValidation registered in DI with automatic validation endpoint filter in Minimal API.

**Owner:** DEV
**Timeline:** Story 2.3 and 2.4 implementation
**Status:** Planned
**Verification:** TC-E2-P0-03 — parameterized API tests with empty/missing required fields

---

### R5: Search Performance Exceeds 1 Second on 500 Records (Score: 6)

**Mitigation Strategy:** Client-side filter must use `useMemo` with correct dependency array `[clientes, searchQuery]`. Filter must use `string.toLowerCase().includes()` (O(n) string scan) — no regex compilation on each keystroke. Debounce NOT required per architecture (150ms debounce optional for input UX but not needed for performance at 500 records). Confirm with performance test measuring keypress-to-render time.

**Owner:** DEV
**Timeline:** Story 2.1 implementation
**Status:** Planned
**Verification:** TC-E2-P1-05 — 500 mock clients, measure elapsed < 1000ms

---

## Constraints for Story Implementation Agents

The following constraints must be enforced during implementation for all tests to pass:

1. `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente` hooks MUST call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` inside `onSuccess`.
2. `ClienteConfiguration.cs` MUST include `builder.HasIndex(e => e.NIT).IsUnique()` — unique constraint on the `nit` column.
3. `ContactoConfiguration.cs` FK on `cliente_id` MUST use `OnDelete(DeleteBehavior.SetNull)` — not `Cascade` or `Restrict`.
4. `CreateClienteRequestValidator` and `UpdateClienteRequestValidator` MUST validate all four required fields independently of frontend Zod.
5. `ExceptionHandlingMiddleware` MUST catch `DbUpdateException` for unique constraint violations and return HTTP 409 with `"El NIT/RUC ya está registrado"` — no raw exception message.
6. Client-side filter in `ClienteListView` MUST use `useMemo` with `[clientes, searchQuery]` as dependency array — no filter re-computation on unrelated state changes.
7. `SortControl` sort state MUST be separate from search state — changing sort MUST NOT clear search input; changing search MUST NOT reset sort.
8. The `SortControl` component identifier values MUST be exactly: `nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`.
9. Default sort state on mount MUST be `"fecha-desc"` (Más reciente).
10. All user-facing toast messages MUST be in Spanish and match the exact text in Acceptance Criteria (e.g., "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente").
11. Sort MUST be performed client-side over the TanStack Query cache — no additional `GET /api/v1/clientes?sort=...` calls triggered.

---

## Definition of Done for Epic 2

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E2-P0-01 through TC-E2-P0-08)
- [ ] All P1 test cases pass (TC-E2-P1-01 through TC-E2-P1-14)
- [ ] P2 test cases pass or are formally deferred with documented justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] NIT uniqueness confirmed at DB, validator, and API layers
- [ ] ON DELETE SET NULL behavior confirmed via integration test
- [ ] TanStack Query cache invalidation verified for all 3 mutation types
- [ ] Search performance measured at ≤1s with 500 records
- [ ] All Spanish toast messages verified for exact text match

---

## Assumptions and Dependencies

### Assumptions

1. Epic 1 implementation is complete: navigation shell, CORS, ExceptionHandlingMiddleware, EF Core + PostgreSQL connection, `ApplySnakeCaseNaming()` all verified before Epic 2 testing begins.
2. The `contactos` table migration (Epic 3) is NOT required for TC-E2-P0-04 — the test will seed contacts directly via EF Core context or a stubbed contactos migration applied in the test setup only.
3. `siesa-ui-kit` `SortControl` component accepts `value` and `onChange` props that map to sort option identifiers — component contract consistent with architecture spec.
4. MSW 2+ is used for all frontend component tests that assert no unintended API calls (e.g., no GET fired during sort or filter).

### Dependencies

1. Epic 1 foundation stories (1.1, 1.2, 1.3) complete — prerequisite for all E2E and API integration tests.
2. PostgreSQL 18+ running with `clientes` migration applied — required before any P0 API integration test.
3. `ClienteFactory` and `ContactoEntityFactory` implemented — required for TC-E2-P0-04 and P1 API tests.

### Risks to Plan

- **Risk:** `TestContainers` Postgres image unavailable in CI (network restriction)
  - **Impact:** TC-E2-P0-04 and TC-E2-P3-01 cannot run in CI isolation
  - **Contingency:** Use a dedicated PostgreSQL service in CI pipeline (`services:` in GitHub Actions / GitLab CI)

- **Risk:** `contactos` migration not available during Epic 2 testing (contacts seeded for TC-E2-P0-04)
  - **Impact:** ON DELETE SET NULL test requires contactos table to exist
  - **Contingency:** Apply a lightweight contactos stub migration in the test project only (does not need to match full Epic 3 schema)

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests for TC-E2-P0-01 through TC-E2-P0-08 (separate workflow; not auto-run).
- Run `*automate` for broader coverage once Stories 2.1–2.6 implementations exist.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam — Date: 2026-06-08
- [ ] Tech Lead: SiesaTeam — Date: 2026-06-08
- [ ] QA Lead: SiesaTeam — Date: 2026-06-08

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories: TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` — Probability x impact matrix (scores 1-9, threshold ≥6 for immediate mitigation)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision framework
- `test-priorities-matrix.md` — P0-P3 prioritization criteria and time budgets

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD (Functional): `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- PRD (NFRs): `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- PRD (Feature — Gestión de Clientes): `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Epic 1 Test Design: `_bmad-output/test-design-epic-1.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Epic:** 2 — Client Management
**Mode:** Epic-Level (Phase 4)
