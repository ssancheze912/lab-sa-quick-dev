---
epic: 2
title: "Client Management (Gestión de Clientes)"
mode: epic-level
phase: 4
createdAt: "2026-06-08"
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

**Date:** 2026-06-08
**Author:** SiesaTeam
**Status:** Draft

---

## 1. Executive Summary

**Scope:** Epic-level test design for Epic 2 (full design level).

Epic 2 delivers the complete CRUD lifecycle for the `Cliente` aggregate (Nombre, NIT/RUC, Teléfono, Ciudad), together with list view, search (by name and NIT/RUC), detail view with deep-link, client-side sort, and graceful behavior on cascading deletion (contacts become unassigned). Foundation built in Epic 1 (PostgreSQL + EF Core + snake_case + Problem Details middleware + CORS + TanStack Router/Query shell) is a prerequisite — this epic activates the first real domain.

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (score ≥6): 3
- Critical categories: DATA (cascade unassign), PERF (search ≤1s with 500 records — NFR1), SEC (NIT/RUC uniqueness + injection)

**Coverage Summary:**

- P0 scenarios: 9 (18.0 hours)
- P1 scenarios: 14 (14.0 hours)
- P2 scenarios: 11 (5.5 hours)
- P3 scenarios: 4 (1.0 hours)
- **Total effort:** 38.5 hours (~5 days)

---

## 2. Epic Overview & Test Scope

### Epic Summary

The commercial team can register, view, search, update, delete and sort client records. The epic activates the `clientes` table (UUID PK, unique `nit`, `DateTimeOffset` timestamps), the REST resource `/api/v1/clientes` (full CRUD + search-by-query), the TanStack Query cache `['clientes']` with mutation-based invalidation (FR27 — changes visible to all users) and the split-panel UI (`/clientes`, `/clientes/:clienteId`).

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | Client-side filter <1s with 500 rows, EmptyState, ErrorPanel + Reintentar |
| 2.2 | Client Detail View | Split panel, deep-link `/clientes/:clienteId`, not-found |
| 2.3 | Create Client | Required-field validation (Zod + FluentValidation), NIT unique 409, optimistic insert |
| 2.4 | Edit Client | Pre-filled form, partial updates, validation, cancel = no-op |
| 2.5 | Delete Client | Confirmation dialog, cascade unassign of contacts (`ON DELETE SET NULL`), informative toast |
| 2.6 | Sort Client List | Client-side sort, no extra fetch, default "Más reciente", preserves search filter |

### Out of Scope

- Contact entity and contact CRUD — Epic 3.
- Client ↔ Contact association/disassociation flows — Epic 4 (this epic only validates the side-effect of `ON DELETE SET NULL`).
- Authentication / authorization — explicitly deferred (MVP).
- Server-side pagination — NFR10 caps MVP at 500 clients; client-side rendering is intentional.

### Dependencies (Hard Prerequisites)

| # | Prerequisite | Source | Verification |
|---|---|---|---|
| D1 | Backend running, CORS allows `http://localhost:5173` | Epic 1 / TC-E1-P0-04 | Re-run smoke before E2E |
| D2 | `siesa_agents_db` exists, snake_case naming active | Epic 1 / TC-E1-P1-05 | Migration must run for `clientes` table |
| D3 | Problem Details RFC 7807 middleware registered | Epic 1 / TC-E1-P0-05 | Required for 409/400 contract tests |
| D4 | TanStack Router routes `/clientes` and `/clientes/:clienteId` resolvable | Epic 1 / TC-E1-P1-02 | Required for deep-link tests |
| D5 | `SortControl` component exists at `src/shared/components/SortControl` | Story 2.6 tech context | Component test prerequisite |

---

## 3. Risk Assessment

### Risk Matrix

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-201 | DATA | Story 2.5: deleting a `cliente` that has associated `contactos` loses contact data or fails with FK violation if `ON DELETE SET NULL` is not configured. Affects future Epic 3/4. | 3 | 3 | **9** | Integration test asserting cascade `cliente_id = NULL`, all contact rows preserved; explicit FK config in `OnModelCreating`. | Backend | Before story 2.5 closure |
| R-202 | PERF | NFR1: search must render in <1s with 500 records. Client-side filter on every keystroke can jank if not memoized/debounced. | 2 | 3 | **6** | Component perf test with 500 seeded clients; assert filter+render <1000ms; require `useMemo` / 150ms debounce. | Frontend | Before story 2.1 closure |
| R-203 | SEC | NIT/RUC uniqueness: duplicate POST must return 409 with safe `Problem Details` body; no `stackTrace` leak. Also covers NFR5 input sanitization. | 2 | 3 | **6** | Integration test: insert duplicate NIT → 409 + RFC 7807 body without internals; FluentValidator rejects empty/oversized payloads. | Backend | Before story 2.3 closure |
| R-204 | BUS | Story 2.6: changing sort while a search filter is active accidentally clears the filter → user loses context. | 2 | 2 | 4 | Component test: type search → change sort → assert filter still active and result set is sorted within filtered subset. | Frontend | Before 2.6 closure |
| R-205 | DATA | FR27 optimistic mutations: invalidation of `['clientes']` not triggered after create/update/delete → list shows stale data; team B does not see team A's changes. | 2 | 2 | 4 | Component test with `QueryClient` spy: assert `invalidateQueries({ queryKey: ['clientes'] })` called on success of every mutation. | Frontend | Before each story closure |
| R-206 | BUS | Story 2.4: edit form `Cancelar` button submits or persists partial edits → silent data corruption from the user's perspective. | 1 | 3 | 3 | Component test: open edit, modify field, click Cancel → assert no PUT request issued and original data displayed. | Frontend | Before 2.4 closure |
| R-207 | TECH | Story 2.2: `/clientes/:clienteId` with non-existent UUID throws unhandled error or blank panel instead of friendly "not found". | 2 | 2 | 4 | Component/E2E test: navigate to unknown UUID → assert NotFound view rendered, layout preserved. | Frontend | Before 2.2 closure |
| R-208 | TECH | Backend fetch on `/clientes` fails (network/500) → frontend shows blank list instead of ErrorPanel + Reintentar. | 2 | 2 | 4 | Component test with MSW mock returning 500 → assert ErrorPanel + working Reintentar button (re-fetches on click). | Frontend | Before 2.1 closure |
| R-209 | BUS | Required-field validation (FR8) only enforced client-side → backend accepts empty body and creates malformed records. | 1 | 3 | 3 | Integration test: POST with each field empty → 400 with RFC 7807 ValidationProblemDetails listing the offending fields. | Backend | Before 2.3 closure |
| R-210 | OPS | Toast notifications missing or in English → fails P0 standard ("Spanish UI text"). | 1 | 1 | 1 | Component snapshot test: assert exact strings "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente". | Frontend | Before each story closure |
| R-211 | DATA | Story 2.6 default sort "Más reciente" not applied on first render → list order non-deterministic, breaks AC. | 1 | 2 | 2 | Component test: render `ClienteListView` with no prior state → assert items ordered by `createdAt` desc. | Frontend | Before 2.6 closure |

### Top 3 Risk Areas for Epic 2

1. **Cascade unassign on delete (R-201, score 9)** — corruption risk to the contact catalogue that Epic 3/4 will rely on; tested at integration level over a real Postgres schema.
2. **Search performance NFR1 (R-202, score 6)** — UX-breaking and explicit non-functional commitment.
3. **NIT/RUC uniqueness + safe error contract (R-203, score 6)** — combines data integrity (duplicates), security (NFR6 no stack-trace exposure) and validation (NFR5).

### Risk Category Legend

- **TECH**: Architecture / integration / framework
- **SEC**: Access controls, input validation, error exposure
- **PERF**: SLAs (NFR1, NFR2)
- **DATA**: Data integrity, cascade, invalidation
- **BUS**: UX, business logic
- **OPS**: Deployment, copy, accessibility

---

## 4. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌            3 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌   10 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  14 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌▌▌▌▌▌      11 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                       38 tests
```

### Rationale

- **Component-heavy** because Epic 2 is the first full UI domain: split panel, form, dialog, sort, search — all best validated with Vitest + RTL + MSW (fast, deterministic, viewport-flexible).
- **API integration is second** because the high-priority risks (R-201 cascade, R-203 NIT 409) are backend contracts; we test them through `WebApplicationFactory<Program>` against a real Postgres (TestContainers) to validate EF `OnDelete(DeleteBehavior.SetNull)` and FluentValidation wiring end-to-end.
- **E2E is minimal (3 happy-path journeys)** — deep-link, create-and-see-in-list, delete-with-confirmation — to avoid duplicating coverage already provided by component+API levels.
- **Unit coverage** focuses on pure logic: Zod schema, sort comparators, filter predicate, FluentValidator rules.

### Level Selection Heuristics Applied

- AC behavior tied to **HTTP contract / DB constraint** → API integration (e.g., `409` for duplicate NIT, `ON DELETE SET NULL`).
- AC behavior tied to **rendering / interaction in one view** → Component (e.g., search filter, sort order, dialog open).
- AC tied to **deep linking, multi-route navigation, real browser address bar** → E2E.
- AC tied to **pure function output** (sort comparator, schema validation) → Unit.

---

## 5. Test Cases by Priority

### P0 — Must Pass Before Epic Is Closed (Critical Path)

#### TC-E2-P0-01: Cascade Unassign on Client Deletion Preserves Contacts

**Level:** API Integration
**Story:** 2.5
**Requirement:** AC-2.5 (cascade), FR25, architecture `ON DELETE SET NULL`
**Risk covered:** R-201

- **Precondition:** Schema migrated; seed 1 `cliente` with 3 associated `contactos` (`cliente_id` set).
- **Steps:** DELETE `/api/v1/clientes/{id}`; then GET `/api/v1/contactos`; query `information_schema.referential_constraints` for `fk_contactos_clientes` rule.
- **Expected:** Response 204. The 3 contacts still exist; their `cliente_id` is `NULL`; FK rule is `SET NULL`. No 500. No contact row deleted.
- **Automation:** xUnit + `WebApplicationFactory<Program>` + TestContainers Postgres.

#### TC-E2-P0-02: Create Client — Duplicate NIT Returns 409 with Safe Problem Details

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-2.3 (NIT conflict), NFR5, NFR6
**Risk covered:** R-203

- **Steps:** POST `/api/v1/clientes` with a NIT that already exists.
- **Expected:** 409. `Content-Type: application/problem+json`. Body contains `status`, `title`, `detail`. Body does **not** contain `stackTrace`, `exception`, `innerException`, raw SQL, or table names.
- **Automation:** xUnit integration test, assertion uses JSON path negation.

#### TC-E2-P0-03: Required-Field Validation Rejects Empty Fields (Backend)

**Level:** API Integration
**Story:** 2.3
**Requirement:** AC-E2.4, FR8, NFR5
**Risk covered:** R-209

- **Steps:** POST `/api/v1/clientes` with each of `nombre`, `nit`, `telefono`, `ciudad` empty in turn.
- **Expected:** 400 with `ValidationProblemDetails` listing the offending field; no DB row created.
- **Automation:** xUnit parameterised test (4 cases).

#### TC-E2-P0-04: Create Client — Happy Path E2E (Persistence + List Visibility)

**Level:** E2E (Playwright)
**Story:** 2.3
**Requirement:** AC-E2.1, FR1, FR27
**Risk covered:** R-205

- **Steps:** Open `/clientes` → click "Nuevo cliente" → fill all 4 fields → submit.
- **Expected:** Form closes; toast "Cliente creado correctamente" visible; new item appears in the left list panel within 2s (NFR2) without page reload.
- **Automation:** Playwright with HAR + cleanup fixture (delete via API in `afterEach`).

#### TC-E2-P0-05: Search Performance ≤1s with 500 Records (NFR1)

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-E2.2, NFR1
**Risk covered:** R-202

- **Precondition:** MSW returns 500 seeded clients on `GET /api/v1/clientes`.
- **Steps:** Render `ClienteListView`, wait for hydration, type a 4-char query in the search input; measure time from `input` event to filtered DOM update.
- **Expected:** Filtered list rendered in <1000ms; result set matches predicate over both `nombre` and `nit`.
- **Automation:** Vitest with `performance.now()` measurement; CI threshold set with 20% headroom.

#### TC-E2-P0-06: Delete Client — Confirmation Dialog and Toast

**Level:** Component (Vitest + RTL)
**Story:** 2.5
**Requirement:** AC-E2.5, AC-2.5
**Risk covered:** R-201 (UI half)

- **Steps:** Render detail view of seeded client → click "Eliminar" → confirm.
- **Expected:** Dialog appears with text "¿Eliminar este cliente?", "Confirmar" and "Cancelar" buttons; on Confirm, DELETE mutation called, item removed from list, right panel returns to default state, toast displays "Cliente eliminado correctamente" (or extended cascade text if contacts existed).
- **Automation:** Vitest + RTL + MSW.

#### TC-E2-P0-07: Deep Link Resolves Correct Client (`/clientes/:clienteId`)

**Level:** E2E (Playwright)
**Story:** 2.2
**Requirement:** AC-E2.3 indirect, FR30
**Risk covered:** R-207 (happy path)

- **Steps:** Navigate browser directly to `/clientes/{validUuid}`.
- **Expected:** Right panel renders the client with matching `nombre`, `nit`; no redirect.
- **Automation:** Playwright with seeded UUID via API fixture.

#### TC-E2-P0-08: List Fetch Failure Renders ErrorPanel with Retry

**Level:** Component (Vitest + RTL)
**Story:** 2.1
**Requirement:** AC-2.1 (error state)
**Risk covered:** R-208

- **Steps:** MSW returns 500 on first GET; render view → click "Reintentar" with MSW now returning 200.
- **Expected:** ErrorPanel rendered first; after Retry, list is rendered.
- **Automation:** Vitest + MSW with handler swap.

#### TC-E2-P0-09: FR27 — Mutation Invalidates `['clientes']` Cache

**Level:** Component (Vitest + RTL)
**Story:** 2.3, 2.4, 2.5
**Requirement:** AC-E2.1/3/5, FR27
**Risk covered:** R-205

- **Steps:** Spy on `queryClient.invalidateQueries`; trigger create, update, and delete mutations.
- **Expected:** `invalidateQueries({ queryKey: ['clientes'] })` called once per successful mutation.
- **Automation:** Vitest + injected mock `QueryClient`.

**Total P0:** 9 tests · 18 hours

---

### P1 — Must Pass Before Each Story Is Closed

#### TC-E2-P1-01: Client List Renders All Items in Left Panel (280px)

**Level:** Component · **Story:** 2.1 · **AC:** AC-2.1 list rendering
- Render with 10 seeded clients; assert `<li>` for each, each row shows `nombre` and `nit`; panel width 280px.

#### TC-E2-P1-02: Search Filters by Both `nombre` and `nit` Substrings

**Level:** Component · **Story:** 2.1 · **AC:** AC-E2.2, FR3, FR4
- Render with 5 clients including one with NIT `900123-1`; type `9001`; assert only that row remains.

#### TC-E2-P1-03: EmptyState Displayed When List Is Empty

**Level:** Component · **Story:** 2.1 · **AC:** AC-2.1 empty
- MSW returns `[]`; assert `EmptyState` component rendered with guidance copy.

#### TC-E2-P1-04: Click List Item Updates Right Panel and URL

**Level:** Component · **Story:** 2.2 · **AC:** AC-2.2, FR30
- Click on item → assert right panel detail shown; assert URL becomes `/clientes/:clienteId`.

#### TC-E2-P1-05: Non-Existent `clienteId` Shows Graceful Not-Found

**Level:** Component · **Story:** 2.2 · **AC:** AC-2.2 not-found · **Risk:** R-207
- MSW returns 404 for `/api/v1/clientes/{id}`; assert friendly "Cliente no encontrado" message; navigation shell still visible.

#### TC-E2-P1-06: Create Form Opens with All Required Fields

**Level:** Component · **Story:** 2.3 · **AC:** AC-2.3 form open, FR1
- Click "Nuevo cliente"; assert form with 4 named inputs (Nombre, NIT/RUC, Teléfono, Ciudad) and submit button.

#### TC-E2-P1-07: Frontend Validation Blocks Submit on Empty Required Field

**Level:** Component · **Story:** 2.3 · **AC:** AC-E2.4, FR8
- Submit empty form; assert inline error per field; assert NO POST sent (MSW counter == 0).

#### TC-E2-P1-08: Duplicate NIT Returns User-Friendly Inline Error

**Level:** Component · **Story:** 2.3 · **AC:** AC-2.3 conflict · **Risk:** R-203 (UI)
- MSW returns 409 RFC 7807; assert message "El NIT/RUC ya está registrado" displayed, no technical jargon.

#### TC-E2-P1-09: Edit Form Pre-Filled with Current Values

**Level:** Component · **Story:** 2.4 · **AC:** AC-2.4 prefill, FR6
- Click Editar on a seeded client; assert inputs contain current `nombre`, `nit`, `telefono`, `ciudad`.

#### TC-E2-P1-10: Edit Submit Updates Detail and List Immediately

**Level:** API Integration · **Story:** 2.4 · **AC:** AC-E2.3, FR27
- PUT `/api/v1/clientes/{id}` with new `telefono`; subsequent GET returns updated value; `updated_at > created_at`.

#### TC-E2-P1-11: Edit Cancel Discards Changes

**Level:** Component · **Story:** 2.4 · **AC:** AC-2.4 cancel · **Risk:** R-206
- Modify a field, click Cancelar; assert detail shows original value; assert no PUT issued.

#### TC-E2-P1-12: Sort by `nombre-asc` and `nombre-desc` Reorders Without Refetch

**Level:** Component · **Story:** 2.6 · **AC:** AC-2.6 (4 options)
- Spy on `fetch` after initial load; change SortControl to A→Z and Z→A; assert order matches and `fetch` not called again.

#### TC-E2-P1-13: Sort + Active Search Preserves Both

**Level:** Component · **Story:** 2.6 · **AC:** AC-2.6 combined · **Risk:** R-204
- Type search query; change sort to `nombre-asc`; assert filtered subset is sorted, search input still contains the query.

#### TC-E2-P1-14: Default Sort on First Load Is "Más reciente"

**Level:** Component · **Story:** 2.6 · **AC:** AC-2.6 default · **Risk:** R-211
- Render fresh; assert items in `createdAt` desc order; assert SortControl displays "Más reciente".

**Total P1:** 14 tests · 14 hours

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E2-P2-01: GET `/api/v1/clientes` Returns Seeded List

**Level:** API Integration · **Story:** 2.1
- Seed 3 clients; assert 200, array length 3, snake_case keys serialized as camelCase in JSON.

#### TC-E2-P2-02: GET `/api/v1/clientes/{id}` Returns Single Client

**Level:** API Integration · **Story:** 2.2
- Seed 1 client; GET by id; assert all 4 fields plus `id`, `createdAt`, `updatedAt`.

#### TC-E2-P2-03: POST Successful Create Returns 201 + Location Header

**Level:** API Integration · **Story:** 2.3
- POST valid body; assert 201, `Location: /api/v1/clientes/{id}`, response body contains generated UUID.

#### TC-E2-P2-04: PUT Update Returns 200 with Updated Body

**Level:** API Integration · **Story:** 2.4
- Seed client; PUT with modified `ciudad`; assert 200; assert response reflects new value.

#### TC-E2-P2-05: DELETE Non-Existent Client Returns 404 RFC 7807

**Level:** API Integration · **Story:** 2.5
- DELETE random UUID; assert 404 with safe `Problem Details` body.

#### TC-E2-P2-06: NIT/RUC Unique Index Enforced at DB Level

**Level:** API Integration · **Story:** 2.3
- Inspect schema; assert `uk_clientes_nit` unique index exists on `nit` column.

#### TC-E2-P2-07: `clientes` Table Uses snake_case Columns

**Level:** API Integration · **Story:** Epic 1 carryover applied to new domain
- Query `information_schema.columns` for `clientes`; assert columns `id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at` exist.

#### TC-E2-P2-08: `createdAt` / `updatedAt` Use `DateTimeOffset` (UTC offset present)

**Level:** API Integration · **Story:** Architecture compliance
- Create client; assert JSON timestamp has `+00:00` or `Z` suffix.

#### TC-E2-P2-09: Sort "Más antiguo" Orders by `createdAt` Asc

**Level:** Component · **Story:** 2.6
- Seed 3 clients with distinct `createdAt`; select Más antiguo; assert oldest first.

#### TC-E2-P2-10: Delete with Cascade Toast Includes Extended Message

**Level:** Component · **Story:** 2.5
- Delete a client that had contacts (mock backend response indicates affected contacts); assert toast text includes "Sus contactos asociados quedaron sin cliente asignado."

#### TC-E2-P2-11: List Renders within NFR2 (<2s) for CRUD UI Update

**Level:** Component · **Story:** Epic-wide NFR2
- After create mutation success, measure time until new row appears in DOM; assert <2000ms.

**Total P2:** 11 tests · 5.5 hours

---

### P3 — Nice to Have / Regression Suite

#### TC-E2-P3-01: Unit — Zod `clienteSchema` Rejects Invalid Inputs

**Level:** Unit · **Story:** 2.3
- Test schema with empty strings, oversized strings, non-string NIT; assert each path fails parse.

#### TC-E2-P3-02: Unit — Sort Comparators

**Level:** Unit · **Story:** 2.6
- Pure-function tests for the 4 comparators (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`).

#### TC-E2-P3-03: Unit — Filter Predicate Combines `nombre` + `nit`

**Level:** Unit · **Story:** 2.1
- Pure function `matchesQuery(client, q)` covers case-insensitive substring on both fields.

#### TC-E2-P3-04: Unit — FluentValidator (backend) Rules

**Level:** Unit · **Story:** 2.3
- xUnit test on `CreateClienteCommandValidator`: each rule (NotEmpty, MaxLength) reports the expected `PropertyName`.

**Total P3:** 4 tests · 1 hour

---

## 6. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E2.1: Register new client and see it in list immediately | 2.3 | TC-E2-P0-04, TC-E2-P0-09, TC-E2-P1-06, TC-E2-P2-03 | Covered |
| AC-E2.2: Search by name or NIT in <1s | 2.1 | TC-E2-P0-05, TC-E2-P1-02 | Covered |
| AC-E2.3: View detail, edit, save | 2.2, 2.4 | TC-E2-P1-04, TC-E2-P1-09, TC-E2-P1-10, TC-E2-P2-04 | Covered |
| AC-E2.4: Prevent saving with empty required fields | 2.3, 2.4 | TC-E2-P0-03, TC-E2-P1-07 | Covered |
| AC-E2.5: Delete and remove from list | 2.5 | TC-E2-P0-01, TC-E2-P0-06, TC-E2-P2-05, TC-E2-P2-10 | Covered |
| AC-E2.6: Sort with 4 options, no reload, no filter loss | 2.6 | TC-E2-P1-12, TC-E2-P1-13, TC-E2-P1-14, TC-E2-P2-09 | Covered |
| AC-2.1 (deep dive): EmptyState, ErrorPanel | 2.1 | TC-E2-P0-08, TC-E2-P1-03 | Covered |
| AC-2.2 (deep dive): Deep link + not-found | 2.2 | TC-E2-P0-07, TC-E2-P1-05 | Covered |
| AC-2.3 (deep dive): NIT 409 friendly error | 2.3 | TC-E2-P0-02, TC-E2-P1-08 | Covered |
| AC-2.4 (deep dive): Cancel preserves data | 2.4 | TC-E2-P1-11 | Covered |
| AC-2.5 (deep dive): Confirmation + cascade text | 2.5 | TC-E2-P0-06, TC-E2-P2-10 | Covered |

---

## 7. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search <1s with 500 records | TC-E2-P0-05 | Component |
| NFR2 | CRUD UI update <2s | TC-E2-P0-04, TC-E2-P2-11 | E2E + Component |
| NFR5 | Input validation/sanitization | TC-E2-P0-03, TC-E2-P3-04 | API + Unit |
| NFR6 | No stack trace exposure | TC-E2-P0-02, TC-E2-P2-05 | API |
| NFR11 | Schema supports expansion (UUID PK) | TC-E2-P2-07, TC-E2-P2-08 | API |

---

## 8. Test Execution Order

```
Phase 1 — Backend Contract Gate (P0 API)
  1. TC-E2-P2-07  snake_case columns exist
  2. TC-E2-P2-06  uk_clientes_nit unique index
  3. TC-E2-P0-03  Required-field validation 400
  4. TC-E2-P0-02  Duplicate NIT 409 + safe Problem Details
  5. TC-E2-P0-01  Cascade unassign on delete

Phase 2 — Frontend Critical UI Gate (P0 Component)
  6. TC-E2-P0-05  Search <1s with 500 records
  7. TC-E2-P0-08  ErrorPanel + Reintentar
  8. TC-E2-P0-06  Delete confirmation + toast
  9. TC-E2-P0-09  Mutation invalidates ['clientes']

Phase 3 — E2E Happy Path Gate (P0 E2E)
 10. TC-E2-P0-04  Create cliente end-to-end
 11. TC-E2-P0-07  Deep link to /clientes/:id

Phase 4 — Story Closure (P1, run on PR to main)
 12. TC-E2-P1-01 … TC-E2-P1-14

Phase 5 — Full Regression (P2, nightly)
 13. TC-E2-P2-01 … TC-E2-P2-11

Phase 6 — Unit Suite (P3, every commit, fast)
 14. TC-E2-P3-01 … TC-E2-P3-04
```

---

## 9. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| MSW | Mock `/api/v1/clientes` endpoints | Frontend |
| Playwright 1.40+ | E2E (create, deep link) | Frontend/E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres 18+) | Isolated DB per integration test class | Backend |
| Bogus (or AutoFixture) | Test data factories for `Cliente` | Backend |
| faker-js | Test data factories for client UI fixtures | Frontend |

### Test Data Requirements

- **`ClienteFactory` (backend, Bogus)**: generates `Cliente` with unique NIT (`9{8-digits}-{check}`), random Spanish city, valid phone, auto-cleanup via `IAsyncLifetime`.
- **`clienteFixture` (frontend, faker-js)**: generates 1, 10 or 500 client objects with deterministic seed for performance tests.
- **`contactosFixture`**: 3 contacts pre-associated to a client, used only by TC-E2-P0-01.

### Environment Prerequisites

- Node.js 20+, .NET 10 SDK, PostgreSQL 18+ (TestContainers pulls image automatically).
- All Epic 1 P0 tests passing — `TC-E1-P0-01 .. TC-E1-P0-05` are hard prerequisites.
- Backend env var `ASPNETCORE_ENVIRONMENT=Testing` to enable in-memory test endpoints.
- MSW service worker registered in frontend test setup (`vitest.setup.ts`).

---

## 10. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 9 | 2.0 | 18.0 | Cascade DB test, perf test (500 rows), E2E setup |
| P1 | 14 | 1.0 | 14.0 | Standard component + API tests, MSW handlers |
| P2 | 11 | 0.5 | 5.5 | Contract + serialization checks |
| P3 | 4 | 0.25 | 1.0 | Pure-function unit tests |
| **Total** | **38** | — | **38.5 hours** | **~5 days for 1 dev** |

### Prerequisites Summary

- Factories: `ClienteFactory` (backend), `clienteFixture` (frontend).
- Fixtures: `seededClient`, `clientWithContacts`, `fiveHundredClients`.
- TestContainers Postgres image cached locally.
- MSW handler library at `frontend/src/test/handlers/clientes.ts`.

---

## 11. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no waivers for cascade, NIT 409, search perf).
- **P1 pass rate:** ≥95% (waiver requires Tech Lead sign-off).
- **P2/P3 pass rate:** ≥90% (informational; failures filed as tickets).
- **High-risk (score ≥6) mitigations:** 100% complete (R-201, R-202, R-203 — no exceptions).

### Coverage Targets

- **Critical paths (create, delete-with-cascade, search):** 100%.
- **Backend `Cliente` aggregate code:** ≥80% line coverage in unit + integration tests.
- **Frontend `modules/crm/clientes`:** ≥80% line coverage.
- **NFR-targeted scenarios (NFR1, NFR6):** 100%.

### Non-Negotiable Requirements

- [ ] TC-E2-P0-01 (cascade) green against real Postgres.
- [ ] TC-E2-P0-02 (NIT 409 safe Problem Details — no `stackTrace` key).
- [ ] TC-E2-P0-05 (search <1000ms with 500 records, measured in CI).
- [ ] TC-E2-P0-09 (mutation invalidation — proves FR27).
- [ ] All toasts in Spanish (TC-E2-P2-10 + R-210).
- [ ] No P0/P1 test skipped without ticket reference.

---

## 12. Mitigation Plans

### R-201: Cascade Unassign on Client Deletion (Score 9)

- **Strategy:** Enforce in EF model with `entity.HasMany(c => c.Contactos).WithOne().OnDelete(DeleteBehavior.SetNull)`; reinforce with FK at DB level (`ON DELETE SET NULL`).
- **Owner:** Backend dev.
- **Timeline:** Before Story 2.5 PR merges.
- **Verification:** TC-E2-P0-01 plus manual inspection of `information_schema.referential_constraints`.

### R-202: Search Performance ≤1s (Score 6)

- **Strategy:** Debounce input at 150ms; memoise filter with `useMemo`; render list with `react-window` if needed; do **not** call API on keystroke.
- **Owner:** Frontend dev.
- **Timeline:** Before Story 2.1 PR merges.
- **Verification:** TC-E2-P0-05 with measured `performance.now()` in CI.

### R-203: NIT/RUC Uniqueness + Safe Error Contract (Score 6)

- **Strategy:** Unique index `uk_clientes_nit`; catch `DbUpdateException` with PG error code `23505` in middleware; map to RFC 7807 with safe body.
- **Owner:** Backend dev.
- **Timeline:** Before Story 2.3 PR merges.
- **Verification:** TC-E2-P0-02 + TC-E2-P2-06.

---

## 13. Assumptions and Dependencies

### Assumptions

1. Epic 1 closure (`epic-1-report.md`) was successful; database, CORS, Problem Details middleware are live.
2. The `siesa-ui-kit` provides `Dialog`, `Toast`, `Input`, `Button`, `SortControl`, `EmptyState`, `ErrorPanel` primitives. (Fallback: shadcn/ui for Dialog already added per architecture.)
3. The team uses TanStack Query v5 — `invalidateQueries({ queryKey: [...] })` shape is the contract under test.
4. PostgreSQL 18 is available locally and as TestContainers image.

### Dependencies

1. Story 1.3 (Backend Database Foundation) must reach `done` before any P0 API test can run.
2. Story 1.2 (Frontend Navigation Shell) deep-link wiring required for TC-E2-P0-07.
3. `SortControl` component must exist at `src/shared/components/SortControl` before P1 sort tests are authored.

### Risks to Plan

- **Risk:** `siesa-ui-kit` does not ship a `SortControl` with the four required option ids.
  - **Impact:** Story 2.6 tests blocked.
  - **Contingency:** Build a thin local wrapper exposing `nombre-asc | nombre-desc | fecha-desc | fecha-asc` and proxy to the kit's `Select`.

---

## 14. Follow-on Workflows (Manual)

- Run `*atdd` to scaffold failing P0 tests (TC-E2-P0-01 … TC-E2-P0-09) once stories are ready-for-dev.
- Run `*automate` after Story 2.1/2.3/2.5 reach `review` to broaden coverage.
- Re-run `*test-design` if NFR1 target tightens (<500ms) or auth is introduced.

---

## 15. Notes for Story Implementation Agents

Constraints that the implementation must honor for tests to pass:

1. The FK `fk_contactos_clientes` MUST be declared `ON DELETE SET NULL` — not `CASCADE`, not `RESTRICT`.
2. EF Core `Cliente` entity must declare `Nit` as unique via `HasIndex(c => c.Nit).IsUnique()` (will become `uk_clientes_nit` after snake_case).
3. The middleware that catches `DbUpdateException` for code `23505` must produce `application/problem+json` with **no** internal keys (`stackTrace`, `exception`, `innerException`, SQL text).
4. The frontend `useClientes` hook MUST use `queryKey: ['clientes']` (array, not string) and every mutation hook MUST call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` on success.
5. The search input MUST debounce at 150ms and filter via a memoised pure function over the TanStack Query cache — no API call per keystroke.
6. `SortControl` MUST default to `fecha-desc` on first render and MUST NOT clear the search input when the sort option changes.
7. All UI copy in Spanish: "Nuevo cliente", "Cliente creado correctamente", "Cliente actualizado correctamente", "Cliente eliminado correctamente", "El NIT/RUC ya está registrado", "¿Eliminar este cliente?", "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (verbatim).
8. The delete confirmation dialog MUST come from `siesa-ui-kit` (or shadcn `Dialog` fallback) — no `window.confirm`.

---

## 16. Approval

**Test Design Approved By:**

- [ ] Product Manager — Date:
- [ ] Tech Lead — Date:
- [ ] QA Lead — Date:

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework
- `probability-impact.md` — Risk scoring methodology
- `test-levels-framework.md` — Test level selection
- `test-priorities-matrix.md` — P0-P3 prioritization

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- PRD NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (sections "Data Architecture", "API & Communication Patterns", "Frontend Architecture")
- Epic 1 test design (prerequisite): `_bmad-output/implementation-artifacts/test-design-epic-1.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
