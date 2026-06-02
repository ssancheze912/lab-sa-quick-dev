---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-02"
updatedAt: "2026-06-02"
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

**Date:** 2026-06-02
**Author:** SiesaTeam (TEA — Test Architect)
**Status:** Draft
**Workflow:** `_bmad/bmm/testarch/test-design` v4.0 (BMad v6) — Epic-Level Mode (Phase 4)

---

## Executive Summary

**Scope:** Full epic-level test design for Epic 2 — Client Management. Six stories cover end-to-end CRUD over the `clientes` domain entity, plus dual search (name / NIT-RUC), client-side sorting, and split-panel deep-linking. This epic is the first to introduce user input, persistence, and domain validation into the system; therefore it is also the first epic where NFR1 (search < 1 s with 500 records), NFR2 (CRUD reflected in UI < 2 s), NFR5 (input validation / sanitization), NFR6 (no internal error exposure), FR8 (required fields enforced), and FR27 (immediate visibility of changes) become testable.

**Epic Goal:** Ship a working `/clientes` view backed by `GET/POST/PUT/DELETE /api/v1/clientes`, with React Hook Form + Zod on the frontend, FluentValidation on the backend, EF Core persistence on PostgreSQL, TanStack Query cache invalidation for FR27, client-side filtering + sorting over the cached list, and ON DELETE SET NULL preserving orphan contacts (FR25 hook for Epic 4).

**Risk Summary:**

- Total risks identified: **12**
- High-priority risks (score ≥6): **4** (R-001 NIT uniqueness race, R-002 ON DELETE SET NULL, R-003 search latency NFR1, R-004 stack-trace leakage NFR6)
- Risk categories present: **TECH, SEC, PERF, DATA, BUS, OPS**

**Coverage Summary:**

- P0 scenarios: **9** (18.0 hours)
- P1 scenarios: **12** (12.0 hours)
- P2 scenarios: **8** (4.0 hours)
- P3 scenarios: **3** (0.75 hours)
- **Total effort:** **34.75 hours (~4.3 days)** — 32 automated tests

**Test Pyramid (epic-2):**

| Level | Count | Tool |
|-------|-------|------|
| E2E | 4 | Playwright |
| API Integration | 12 | xUnit + `WebApplicationFactory<Program>` + TestContainers Postgres |
| Component | 11 | Vitest + @testing-library/react |
| Unit | 5 | Vitest (Zod schema, sort utils) + xUnit (Validators, Command/Query Handlers) |
| **Total** | **32** | — |

---

## 1. Epic Overview & Test Scope

### Stories in Scope

| Story | Title | Primary Test Concerns |
|-------|-------|------------------------|
| 2.1 | Client List & Search | `GET /api/v1/clientes`, TanStack Query `['clientes']`, 280 px list panel, client-side search filter, EmptyState, ErrorPanel + Reintentar, NFR1 < 1 s @ 500 records |
| 2.2 | Client Detail View | `GET /api/v1/clientes/:id`, split-panel right side, URL sync `/clientes/:clienteId` (FR30), graceful not-found |
| 2.3 | Create Client | `POST /api/v1/clientes`, ClienteForm + Zod, FR1 required fields, FR8 inline errors, FR27 list invalidation, 409 on duplicate NIT, success toast |
| 2.4 | Edit Client | `PUT /api/v1/clientes/:id`, pre-filled form (FR6), inline validation, optimistic UI vs invalidation, "Cancelar" preserves original |
| 2.5 | Delete Client | `DELETE /api/v1/clientes/:id`, confirmation dialog, FR27 list update, right panel resets, ON DELETE SET NULL for `contactos.cliente_id` (FR25 hook) |
| 2.6 | Sort Client List | Client-side sort over TanStack cache (no extra fetch), 4 modes, sort + search composable, default `Más reciente` |

### Out of Scope for This Epic

- Authentication / authorization (deferred — MVP).
- Contact CRUD (Epic 3).
- Client ↔ Contact association UI on the client detail view (Epic 4 Story 4.1/4.2). The DB-level FK behavior (ON DELETE SET NULL) is in scope here because it is wired by Story 2.5's migration; the UI surface "Sin cliente" filter is verified in Epic 4.
- HTTPS configuration (NFR4 — non-local deployments only).
- Server-side pagination (deferred — NFR10 caps at 500 records, fits in memory).

### Acceptance Criteria Inventory

| Source | Code | Acceptance Criterion |
|--------|------|----------------------|
| Epic-2 | AC-E2.1 | User registers a new client (Nombre, NIT/RUC, Teléfono, Ciudad) and it appears in the list immediately |
| Epic-2 | AC-E2.2 | User searches by name or NIT/RUC; results render in < 1 s (NFR1) |
| Epic-2 | AC-E2.3 | User views client detail, edits any field, saves changes |
| Epic-2 | AC-E2.4 | System blocks saving a client with empty required fields, shows clear messages (FR8) |
| Epic-2 | AC-E2.5 | User deletes a client and it stops appearing in the list |
| Epic-2 | AC-E2.6 | User sorts list by Nombre A→Z, Nombre Z→A, Más reciente, Más antiguo — no reload, preserves active search filter |
| Story 2.1 | AC-2.1.a | `/clientes` shows 280 px left panel scrollable list with Nombre + NIT/RUC per item |
| Story 2.1 | AC-2.1.b | Real-time client-side search filters by Nombre OR NIT/RUC; results in < 1 s with 500 records (NFR1) |
| Story 2.1 | AC-2.1.c | EmptyState rendered when no clients exist |
| Story 2.1 | AC-2.1.d | ErrorPanel + Reintentar on backend fetch failure |
| Story 2.2 | AC-2.2.a | Click on client item shows full detail (Nombre, NIT/RUC, Teléfono, Ciudad) + URL updates to `/clientes/:clienteId` (FR30) |
| Story 2.2 | AC-2.2.b | Direct URL access to `/clientes/:clienteId` renders the correct client (FR30) |
| Story 2.2 | AC-2.2.c | Non-existent `clienteId` shows graceful not-found message |
| Story 2.3 | AC-2.3.a | "Nuevo cliente" opens form with required fields per FR1 |
| Story 2.3 | AC-2.3.b | Valid submit creates client + appears in list immediately (FR27) + success toast |
| Story 2.3 | AC-2.3.c | Empty required fields produce inline error messages, form NOT submitted (FR8) |
| Story 2.3 | AC-2.3.d | Duplicate NIT/RUC → backend 409 → "El NIT/RUC ya está registrado" without technical detail (NFR6) |
| Story 2.4 | AC-2.4.a | "Editar" opens form pre-filled with current values (FR6) |
| Story 2.4 | AC-2.4.b | Valid update reflects in detail + list immediately (FR27) + success toast |
| Story 2.4 | AC-2.4.c | Clearing a required field shows inline error and blocks submit (FR8) |
| Story 2.4 | AC-2.4.d | "Cancelar" closes form, original data unchanged |
| Story 2.5 | AC-2.5.a | "Eliminar" opens confirmation dialog (Confirmar / Cancelar) |
| Story 2.5 | AC-2.5.b | Confirm → client removed from list (FR27), right panel resets to empty state, toast "Cliente eliminado correctamente" |
| Story 2.5 | AC-2.5.c | Cancel keeps the client intact |
| Story 2.5 | AC-2.5.d | Deleting a client with associated contacts: client deleted, contacts kept with `clienteId = null`, surface "Sin cliente" filter (FR25), toast mentions orphaning |
| Story 2.6 | AC-2.6.a | "Nombre A→Z" reorders ascending, no API call |
| Story 2.6 | AC-2.6.b | "Nombre Z→A" reorders descending, no API call |
| Story 2.6 | AC-2.6.c | "Más reciente" orders by createdAt descending |
| Story 2.6 | AC-2.6.d | "Más antiguo" orders by createdAt ascending |
| Story 2.6 | AC-2.6.e | Sort applied over active search filter preserves search input |
| Story 2.6 | AC-2.6.f | Default sort on initial load is "Más reciente" |

---

## 2. Risk Assessment

Standard scoring: **Risk Score = Probability (1–3) × Impact (1–3)**. Threshold ≥6 → immediate mitigation.

### 2.1 High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | DATA | `uk_clientes_nit` unique constraint not honored end-to-end, or race condition between two concurrent `POST /api/v1/clientes` with same NIT produces duplicates or 500 instead of 409 | 3 | 3 | **9** | DB-level `UNIQUE` on `nit` + `CreateClienteCommandHandler` catches `DbUpdateException` for unique-violation → maps to `Conflict` (409). API integration test asserts second POST returns 409 with Problem Details `title: "Duplicate NIT"` | Backend DEV + QA | Story 2.3 close |
| R-002 | DATA | `contactos.cliente_id` FK does NOT have `ON DELETE SET NULL`, or migration omits index `ix_contactos_cliente_id` — deleting a client either fails with FK violation or cascades and deletes contacts (data loss) | 2 | 3 | **6** | Migration in Story 2.5 declares `OnDelete(DeleteBehavior.SetNull)`; integration test: seed client + contact, DELETE client, assert client gone AND contact persisted with `cliente_id = NULL` | Backend DEV + QA | Story 2.5 close |
| R-003 | PERF | Client-side filter on 500 records exceeds NFR1 (< 1 s) — debouncing missing, expensive re-renders, or accidental server roundtrip on every keystroke | 2 | 3 | **6** | Component perf test: seed 500 clients in TanStack cache, measure filter render p95 < 200 ms; manual stopwatch on slowest hardware; no network call fired during typing (assert via MSW spy) | Frontend DEV + QA | Story 2.1 close |
| R-004 | SEC | 409 / 500 from backend exposes raw exception details (`Microsoft.EntityFrameworkCore.DbUpdateException: ...`) — violates NFR6 information disclosure | 2 | 3 | **6** | `ExceptionHandlingMiddleware` (Epic 1 R-003) already in place; this epic must ADD domain-specific mappings for `DbUpdateException` (unique violation) → 409 with sanitized title/detail. Integration test asserts no stack-trace, no `Microsoft.*` strings in body | Backend DEV + QA | Story 2.3 close |

### 2.2 Medium-Priority Risks (Score 3-5)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-005 | BUS | FR27 broken: after CRUD mutation, the list and detail panel are stale because `queryClient.invalidateQueries(['clientes'])` is missing or wrong key shape | 3 | 2 | **6** | Component test per mutation hook asserts `invalidateQueries` called with exact key `['clientes']`; integration test creates + lists and asserts the new client is present | Frontend DEV |
| R-006 | TECH | Sort + search composition breaks (e.g., sorting clears the search input, or filter applied after sort instead of before, producing inconsistent counts) | 2 | 2 | **4** | Component test: type search query → assert filtered list → switch sort → assert search input preserved AND filtered list is reordered (NOT cleared). Unit-test the pure `sortClientes(list, mode)` function | Frontend DEV |
| R-007 | TECH | Deep link `/clientes/:clienteId` does not work on direct URL access — `clienteId` param not parsed, or list panel not pre-selected to match URL | 2 | 2 | **4** | E2E: navigate directly to `/clientes/{realId}`, assert detail panel shows that client AND list item is highlighted | QA |
| R-008 | DATA | EF Core `ClienteEntity` schema drifts from PRD (e.g., persists `DateTime` instead of `DateTimeOffset`, or `nit` allows null) — breaks Epic 4 association | 2 | 2 | **4** | Schema test (xUnit + `information_schema`): assert columns `id uuid PK`, `nit text UNIQUE NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL` | Backend DEV |
| R-009 | BUS | Inline FR8 validation message uses backend English / technical wording instead of Spanish user-friendly text, OR shows after backend roundtrip (slow UX) | 1 | 2 | **2** | Zod schema in Spanish, message asserted in component test; backend FluentValidation runs but is treated as defense-in-depth | Frontend DEV |
| R-010 | OPS | TestContainers Postgres slow / flaky on CI causing test timeouts and false failures | 2 | 2 | **4** | Reuse container across tests in `IntegrationTestFixture`; pin postgres image; document re-run policy | DevOps |

### 2.3 Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-011 | BUS | Toast text drift (e.g., "Cliente creado." vs "Cliente creado correctamente") — copy mismatch with PRD | 2 | 1 | **2** | Constant in `i18n.ts` or shared `messages.ts`; component test asserts exact string |
| R-012 | OPS | TanStack Query cache leakage between tests causes flaky assertions (state bleeds) | 1 | 2 | **2** | `createTestQueryClient()` per test; reset cache in `afterEach` |

### 2.4 Risk Category Legend

- **TECH** — Technical/Architecture (routing, composition, query keys)
- **SEC** — Security (NFR5 input validation, NFR6 information disclosure)
- **PERF** — Performance (NFR1 < 1 s search, NFR2 < 2 s CRUD reflection)
- **DATA** — Data Integrity (FK behavior, unique constraints, schema)
- **BUS** — Business Impact (FR27 freshness, UX copy, validation timing)
- **OPS** — Operations (test infra, flakiness)

---

## 3. Test Coverage Plan

### 3.1 P0 (Critical) — Run on every commit

**Criteria:** Blocks core epic + High risk (≥6) + No workaround.

| ID | Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|----|-------------|-----------|-----------|------------|-------|-------|
| TC-E2-P0-01 | AC-2.3.a/b, FR1 — Happy-path create client | API Integration | R-001, R-005, R-008 | 1 | QA | `POST /api/v1/clientes` with valid body → 201 + body matches; subsequent `GET /api/v1/clientes` includes it |
| TC-E2-P0-02 | AC-2.3.d — Duplicate NIT/RUC → 409 (NFR6 sanitized) | API Integration | R-001, R-004 | 1 | QA | Two POSTs same NIT; second returns 409 + Problem Details; body contains NO `DbUpdateException`, NO `Microsoft.*`, NO stack |
| TC-E2-P0-03 | AC-2.3.c, AC-2.4.c, FR8 — Required fields enforced backend | API Integration | R-009 | 1 | QA | `POST` with missing `nombre` → 400 Problem Details with `errors` map; same for `nit`, `telefono`, `ciudad` |
| TC-E2-P0-04 | AC-E2.3, FR6 — Edit client end-to-end | API Integration | R-005 | 1 | QA | Create → PUT update `nombre`/`telefono` → GET shows updated; `updatedAt` > `createdAt` |
| TC-E2-P0-05 | AC-E2.5, AC-2.5.d — Delete client preserves contacts (FR25 hook) | API Integration | R-002 | 1 | QA | Seed client + 2 contacts via direct DB; DELETE `/api/v1/clientes/:id` → 204; assert client gone, both contacts persist with `cliente_id = NULL` |
| TC-E2-P0-06 | AC-2.1.b, NFR1 — Client-side filter under 1 s @ 500 records | Component (Vitest+RTL+MSW) | R-003 | 1 | Frontend DEV | Mock `GET /api/v1/clientes` with 500-record faker dataset; type partial NIT; assert filtered length AND elapsed render time < 200 ms p95; assert NO additional fetch |
| TC-E2-P0-07 | AC-2.3.b, FR27 — Create flow refreshes list cache | Component (Vitest+RTL) | R-005 | 1 | Frontend DEV | Render `ClienteForm`; submit; assert `queryClient.invalidateQueries` called with `['clientes']` AND new item appears in `ClienteListView` re-render |
| TC-E2-P0-08 | AC-2.5.b, FR27 — Delete flow refreshes cache + resets detail | Component (Vitest+RTL) | R-005 | 1 | Frontend DEV | Confirm dialog → mutation → assert invalidate + right panel returns to empty state + toast "Cliente eliminado correctamente" |
| TC-E2-P0-09 | AC-E2.1, AC-E2.3, AC-E2.5 — End-to-end create → edit → delete via UI | E2E (Playwright) | R-001, R-002, R-005 | 1 | QA | Single happy path Playwright spec covering full CRUD against running backend + Postgres |

**Total P0:** 9 tests, **18.0 hours**.

### 3.2 P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3–5) + Common workflows.

| ID | Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|----|-------------|-----------|-----------|------------|-------|-------|
| TC-E2-P1-01 | AC-2.1.a — List view renders 280 px panel with Nombre + NIT/RUC | Component | — | 1 | Frontend DEV | Render `ClienteListView` with 3 fixtures, assert panel width class + visible fields |
| TC-E2-P1-02 | AC-2.1.b — Search filters by name AND by NIT (dual) | Component | R-003 | 1 | Frontend DEV | Type "ACM" → matches Nombre "Acme"; type "900" → matches NIT "900123456" |
| TC-E2-P1-03 | AC-2.1.c — EmptyState when zero clients | Component | — | 1 | Frontend DEV | Mock empty list → assert EmptyState + CTA "Nuevo cliente" |
| TC-E2-P1-04 | AC-2.1.d — ErrorPanel + Reintentar on fetch failure | Component | — | 1 | Frontend DEV | MSW returns 500 → assert ErrorPanel renders + click Reintentar triggers refetch |
| TC-E2-P1-05 | AC-2.2.a/b, FR30 — Detail view + URL deep link `/clientes/:clienteId` | E2E (Playwright) | R-007 | 1 | QA | Click list item → URL updates → detail renders; reload URL directly → detail still renders |
| TC-E2-P1-06 | AC-2.2.c — Non-existent clienteId shows not-found | Component | — | 1 | Frontend DEV | Render with `clienteId="non-existent-uuid"`, MSW returns 404 → assert friendly not-found message |
| TC-E2-P1-07 | AC-2.3.a/b — Create form: open, fill, submit, success toast | Component | — | 1 | Frontend DEV | RHF + Zod happy path including toast assertion |
| TC-E2-P1-08 | AC-2.3.c, FR8 — Inline validation per required field | Component | R-009 | 1 | Frontend DEV | Submit empty form → 4 inline errors in Spanish; no API call (assert MSW spy) |
| TC-E2-P1-09 | AC-2.4.a — Edit form pre-filled (FR6) | Component | — | 1 | Frontend DEV | Open Editar → form values match current client |
| TC-E2-P1-10 | AC-2.4.d — Cancelar preserves original data | Component | — | 1 | Frontend DEV | Modify field → Cancel → reopen detail → original values intact |
| TC-E2-P1-11 | AC-2.5.a/c — Confirmation dialog + Cancel keeps client | Component | — | 1 | Frontend DEV | Open dialog → Cancel → assert client still in list, no DELETE call fired |
| TC-E2-P1-12 | AC-2.6.a–d — Sort modes operate over cached list (no API call) | Component / Unit | R-006 | 1 | Frontend DEV | Pure-function unit test for `sortClientes(list, mode)` covering 4 modes + MSW spy assertion |

**Total P1:** 12 tests, **12.0 hours**.

### 3.3 P2 (Medium) — Run nightly / weekly

**Criteria:** Secondary features + Low risk (1–2) + Edge cases.

| ID | Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|----|-------------|-----------|-----------|------------|-------|-------|
| TC-E2-P2-01 | AC-2.6.e — Sort preserves active search filter | Component | R-006 | 1 | Frontend DEV | Type query → set sort → assert input value unchanged + filtered list reordered |
| TC-E2-P2-02 | AC-2.6.f — Default sort is "Más reciente" on first load | Component | — | 1 | Frontend DEV | Render fresh → assert dropdown value `fecha-desc` |
| TC-E2-P2-03 | Schema integrity — `clientes` table columns + types + indexes | API Integration | R-008 | 1 | Backend DEV | xUnit query on `information_schema.columns` + `pg_indexes`; assert `uk_clientes_nit` exists; `created_at timestamptz` |
| TC-E2-P2-04 | NFR5 — Backend validator rejects oversized/malformed strings | API Integration | — | 1 | Backend DEV | FluentValidation: nombre > 200 chars, nit empty after trim → 400 |
| TC-E2-P2-05 | Edit with no changes — PUT idempotent | API Integration | — | 1 | Backend DEV | PUT same body twice → both 200 with same response, `updatedAt` stable on second call (depends on handler choice — document) |
| TC-E2-P2-06 | Delete idempotency — second DELETE returns 404 | API Integration | — | 1 | Backend DEV | DELETE → 204; DELETE same id → 404 (NOT 500) |
| TC-E2-P2-07 | Frontend AbortController cancels in-flight fetches on rapid nav | Component | — | 1 | Frontend DEV | Switch route mid-fetch → assert no React state-update-after-unmount warning |
| TC-E2-P2-08 | Sort stability — same name different NIT preserves insertion-order tiebreak | Unit | R-006 | 1 | Frontend DEV | `sortClientes` pure function test |

**Total P2:** 8 tests, **4.0 hours**.

### 3.4 P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks.

| ID | Requirement | Test Level | Test Count | Owner | Notes |
|----|-------------|-----------|------------|-------|-------|
| TC-E2-P3-01 | NFR1 stress — Filter under 1 s at 5,000 records (beyond MVP) | Component perf | 1 | Frontend DEV | Forward-looking perf budget for NFR10 expansion |
| TC-E2-P3-02 | NFR2 — End-to-end create reflects in UI < 2 s | E2E (Playwright) | 1 | QA | Stopwatch around `click Guardar` → list shows new item |
| TC-E2-P3-03 | Zod schema unit tests — all error paths | Unit (Vitest) | 1 | Frontend DEV | Parametrized over field × empty/oversize/format |

**Total P3:** 3 tests, **0.75 hours**.

---

## 4. Detailed Test Cases (Reference)

Each test case below is owned by the corresponding story. Story-level test designs produced by `sa-quick-dev` MUST cite these IDs (TC-E2-P0-01, …) for traceability.

### P0

- **TC-E2-P0-01 — Happy-Path Create Client (Backend)**
  Level: API Integration · Story 2.3 · Risks R-001, R-005, R-008
  Steps: `POST /api/v1/clientes` with `{nombre:"Acme S.A.", nit:"900123456-1", telefono:"+51 999 888 777", ciudad:"Lima"}`.
  Expected: 201 Created; response includes `id` (uuid), `createdAt`, `updatedAt`; subsequent `GET /api/v1/clientes` array contains it.
  Automation: xUnit + `WebApplicationFactory<Program>` + TestContainers Postgres.

- **TC-E2-P0-02 — Duplicate NIT/RUC Returns Sanitized 409**
  Level: API Integration · Story 2.3 · Risks R-001, R-004
  Steps: POST a client; POST again with same `nit`.
  Expected: Second response 409 Conflict; `Content-Type: application/problem+json`; body has `{status:409, title, detail}`; body does NOT contain `DbUpdateException`, `Microsoft.`, `stackTrace`, `inner`.
  Automation: xUnit integration test.

- **TC-E2-P0-03 — Required Fields Enforced (Backend FR8)**
  Level: API Integration · Stories 2.3 & 2.4 · Risk R-009
  Steps: POST with each of `nombre`, `nit`, `telefono`, `ciudad` missing (one at a time).
  Expected: 400 Problem Details with `errors: { fieldName: [message] }`; no DB row inserted.
  Automation: Parametrized xUnit `[Theory]`.

- **TC-E2-P0-04 — Edit Client End-to-End (Backend)**
  Level: API Integration · Story 2.4 · Risk R-005
  Steps: Create client; `PUT /api/v1/clientes/:id` with `{nombre:"Acme Updated", telefono:"+51 111 222 333", ciudad:"Cusco", nit:"900123456-1"}`; `GET /api/v1/clientes/:id`.
  Expected: 200 OK; updated fields persisted; `updatedAt` > `createdAt`.
  Automation: xUnit integration test.

- **TC-E2-P0-05 — Delete Preserves Associated Contacts (FR25 / R-002)**
  Level: API Integration · Story 2.5 · Risk R-002
  Steps: Seed via direct DB insert: 1 client + 2 contacts with `cliente_id = client.id`. `DELETE /api/v1/clientes/:id`.
  Expected: 204 No Content; `SELECT * FROM clientes` returns 0 rows for that id; `SELECT cliente_id FROM contactos WHERE id IN (...)` returns 2 rows of `NULL`.
  Automation: xUnit + TestContainers — direct SQL assertions.

- **TC-E2-P0-06 — Search Filter Performance @ 500 Records (NFR1 / R-003)**
  Level: Component (Vitest + RTL + MSW)
  Steps: Pre-warm TanStack Query with 500 faker-generated clients (deterministic seed); render `ClienteListView`; type `"ACM"` into search input; measure `performance.now()` around render commit; assert filtered list length matches expected; assert MSW saw zero additional requests during typing.
  Expected: p95 render < 200 ms across 10 iterations; 0 network calls.
  Automation: Vitest with `vi.useFakeTimers` for debounce control.

- **TC-E2-P0-07 — Create Flow Invalidates `['clientes']` (FR27 / R-005)**
  Level: Component (Vitest + RTL)
  Steps: Render `ClienteForm` inside a test `QueryClientProvider`; submit valid payload; MSW returns 201; spy on `queryClient.invalidateQueries`.
  Expected: `invalidateQueries` called with `{ queryKey: ['clientes'] }`; toast "Cliente creado correctamente" rendered.
  Automation: Vitest + RTL + MSW.

- **TC-E2-P0-08 — Delete Flow Refreshes Cache + Resets Detail (FR27 / R-005)**
  Level: Component (Vitest + RTL)
  Steps: Render `ClienteDetailView` selected; click "Eliminar"; confirm dialog; MSW returns 204.
  Expected: `invalidateQueries(['clientes'])` called; right panel returns to empty/default state; toast "Cliente eliminado correctamente" rendered.
  Automation: Vitest + RTL.

- **TC-E2-P0-09 — E2E Create → Edit → Delete Happy Path**
  Level: E2E · Playwright · against live backend + Postgres
  Steps: Open `/clientes`; click "Nuevo cliente"; fill all 4 fields; Guardar; assert toast + new item in list; click item; Editar; change `telefono`; Guardar; assert detail updated; Eliminar; Confirmar; assert item gone + right panel empty.
  Expected: Full flow completes without errors; URL transitions `/clientes` → `/clientes/:id` → `/clientes`.
  Automation: Playwright.

### P1

- **TC-E2-P1-01 — List Panel Layout (280 px, Nombre + NIT)** — Vitest + RTL, assert width class + columns.
- **TC-E2-P1-02 — Dual Search (Nombre OR NIT)** — Vitest + RTL with seeded fixtures.
- **TC-E2-P1-03 — EmptyState When No Clients** — Vitest + RTL + MSW returning `[]`.
- **TC-E2-P1-04 — ErrorPanel + Reintentar** — Vitest + RTL + MSW returning 500, click Reintentar triggers second fetch (MSW handlers swapped to success).
- **TC-E2-P1-05 — Deep Link `/clientes/:clienteId`** — Playwright E2E; reload page on `/clientes/:realId`.
- **TC-E2-P1-06 — Non-existent `clienteId` Graceful Not-Found** — Vitest + RTL + MSW returning 404.
- **TC-E2-P1-07 — Create Form Happy Path + Toast** — Vitest + RTL.
- **TC-E2-P1-08 — FR8 Inline Validation (Spanish, no API call)** — Vitest + RTL + MSW spy.
- **TC-E2-P1-09 — Edit Form Pre-filled (FR6)** — Vitest + RTL.
- **TC-E2-P1-10 — Cancelar Preserves Original** — Vitest + RTL.
- **TC-E2-P1-11 — Delete Confirmation Cancel Keeps Client** — Vitest + RTL + MSW spy (no DELETE).
- **TC-E2-P1-12 — Sort Modes Are Client-Side** — Vitest unit test for `sortClientes` + component test asserts zero network calls on sort change.

### P2

- **TC-E2-P2-01 — Sort Preserves Active Search** — Vitest + RTL.
- **TC-E2-P2-02 — Default Sort Is "Más reciente"** — Vitest + RTL.
- **TC-E2-P2-03 — `clientes` Schema Integrity** — xUnit `information_schema` query.
- **TC-E2-P2-04 — Backend Validator Rejects Malformed Strings** — xUnit + FluentValidation.
- **TC-E2-P2-05 — PUT Idempotency** — xUnit integration test.
- **TC-E2-P2-06 — DELETE Idempotency Returns 404** — xUnit integration test.
- **TC-E2-P2-07 — AbortController on Rapid Navigation** — Vitest + RTL.
- **TC-E2-P2-08 — Sort Stability with Tiebreak** — Vitest pure-function test.

### P3

- **TC-E2-P3-01 — 5,000 Record Filter Stress** — Vitest perf budget.
- **TC-E2-P3-02 — NFR2 End-to-End Create < 2 s** — Playwright with stopwatch.
- **TC-E2-P3-03 — Zod Schema Parametrized Errors** — Vitest `it.each`.

---

## 5. Execution Order

Order minimizes blocking due to environment dependencies.

### Phase 1 — Backend Domain Gate (DB required) — P0 (<10 min)

- TC-E2-P0-01 Happy-path create
- TC-E2-P0-02 Duplicate NIT → 409
- TC-E2-P0-03 Required-fields enforced
- TC-E2-P0-04 Edit end-to-end
- TC-E2-P0-05 Delete preserves contacts (R-002)
- TC-E2-P2-03 Schema integrity

### Phase 2 — Frontend Cache & Performance Gate — P0/P1 (<15 min)

- TC-E2-P0-06 Search < 1 s @ 500
- TC-E2-P0-07 Create invalidates `['clientes']`
- TC-E2-P0-08 Delete invalidates + resets
- TC-E2-P1-12 Sort is client-side

### Phase 3 — Frontend UI Coverage — P1/P2 (<30 min)

- TC-E2-P1-01 … TC-E2-P1-11
- TC-E2-P2-01, TC-E2-P2-02, TC-E2-P2-07, TC-E2-P2-08

### Phase 4 — Backend Edge Cases — P2 (<10 min)

- TC-E2-P2-04, TC-E2-P2-05, TC-E2-P2-06

### Phase 5 — E2E Smoke — P0/P1/P3 (<15 min)

- TC-E2-P0-09 Full CRUD happy path
- TC-E2-P1-05 Deep link
- TC-E2-P3-02 NFR2 stopwatch

### Phase 6 — Optional Stress — P3 (<10 min)

- TC-E2-P3-01 5,000-record stress
- TC-E2-P3-03 Zod parametrized

---

## 6. Resource Estimates

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|-----------|-------------|-------|
| P0 | 9 | 2.0 | 18.0 | DB seeding, MSW perf, full CRUD E2E |
| P1 | 12 | 1.0 | 12.0 | Component + light E2E |
| P2 | 8 | 0.5 | 4.0 | Edge cases + schema |
| P3 | 3 | 0.25 | 0.75 | Stress + parametrized |
| **Total** | **32** | — | **34.75** | **~4.3 days** |

### Prerequisites

**Test Data:**

- `ClienteFactory` (Bogus on backend / faker-js on frontend) — generates Nombre, NIT (unique), Teléfono, Ciudad with Spanish locale.
- `clienteFixtures` for component tests — 3 deterministic clients + 1 with associated contacts for R-002 verification.
- 500-record dataset for TC-E2-P0-06 (seeded faker, deterministic seed).

**Tooling:**

- Vitest 2+ with `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- MSW 2+ for frontend API mocking + spies (`['clientes']` requests).
- Playwright 1.40+ for E2E (CRUD happy path + deep link + NFR2 stopwatch).
- xUnit + `WebApplicationFactory<Program>` (Epic 1 baseline).
- TestContainers Postgres 18 — isolated per integration test class.
- FluentAssertions for xUnit assertions.

**Environment:**

- Node.js 20+, npm.
- .NET 10 SDK.
- PostgreSQL 18+ (TestContainers in CI; local instance for dev runs).
- Frontend dev server on 5173, backend on 5000 — required by TC-E2-P0-09 and TC-E2-P1-05.

---

## 7. Quality Gate Criteria

### Pass / Fail Thresholds

- **P0 pass rate:** **100%** — no exceptions (9/9 must pass).
- **P1 pass rate:** **≥95%** — waivers documented if any fail.
- **P2 pass rate:** **≥90%** — informational.
- **P3 pass rate:** **≥90%** — informational.
- **High-risk mitigations (R-001 … R-004):** **100% complete** before Epic 2 closure.

### Coverage Targets

- **Critical paths** (Create, Edit, Delete, Search): **100%** covered by P0.
- **Security scenarios** (NFR6 no leakage; FR8 input validation): **100%**.
- **Performance NFR1 / NFR2:** **100%** (TC-E2-P0-06 + TC-E2-P3-02).
- **Data integrity** (R-001 unique NIT, R-002 SET NULL): **100%**.
- **Schema integrity:** **100%** (TC-E2-P2-03).

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E2-P0-01 … TC-E2-P0-09).
- [ ] R-001 mitigated — duplicate NIT returns 409 with sanitized Problem Details.
- [ ] R-002 mitigated — ON DELETE SET NULL verified in integration test.
- [ ] R-003 mitigated — filter p95 < 200 ms on 500 records, zero extra network calls.
- [ ] R-004 mitigated — no `Microsoft.*` / stack-trace strings in any error response body.
- [ ] FR27 verified — every CRUD mutation invalidates `['clientes']`.

---

## 8. Mitigation Plans

### R-001 — Unique NIT Constraint & 409 Mapping (Score 9)

- **Strategy:** Add `HasIndex(c => c.Nit).IsUnique()` in `ClienteConfiguration`; create migration. In `CreateClienteCommandHandler` and `UpdateClienteCommandHandler`, catch `DbUpdateException` whose inner `PostgresException.SqlState == "23505"` and throw a domain `DuplicateNitException` mapped by `ExceptionHandlingMiddleware` to a 409 Problem Details with `title: "NIT duplicado"` (Spanish) and a generic `detail` that does NOT include the EF or pg message.
- **Owner:** Backend DEV + QA (TEA).
- **Timeline:** Story 2.3 closure.
- **Status:** Planned.
- **Verification:** TC-E2-P0-02 green; manual `curl` repro returns expected shape; load test running two concurrent POSTs same NIT — exactly one succeeds.

### R-002 — `ON DELETE SET NULL` on `contactos.cliente_id` (Score 6)

- **Strategy:** In `ContactoConfiguration`, declare `HasOne<ClienteEntity>().WithMany().HasForeignKey(c => c.ClienteId).IsRequired(false).OnDelete(DeleteBehavior.SetNull)`. The migration generated by this configuration becomes part of Story 2.5 (NOT Story 3.1) because deletion of clients is the trigger. Index `ix_contactos_cliente_id` retained.
- **Owner:** Backend DEV + QA.
- **Timeline:** Story 2.5 closure.
- **Status:** Planned.
- **Verification:** TC-E2-P0-05 green; `\d contactos` in psql confirms `ON DELETE SET NULL`; manual delete with associated contacts.

### R-003 — Client-Side Filter Performance NFR1 (Score 6)

- **Strategy:** Use `useMemo(() => filterAndSort(clientes, query, sortMode), [clientes, query, sortMode])` to avoid recomputation; no debouncing required at 500 records since `filter` is O(n) and well under 200 ms on commodity hardware; component receives `clientes` directly from TanStack cache. The `sortClientes` and `filterClientes` helpers live as pure functions in `clientes/application` and are unit-tested.
- **Owner:** Frontend DEV + QA.
- **Timeline:** Story 2.1 closure.
- **Status:** Planned.
- **Verification:** TC-E2-P0-06 green at p95 < 200 ms; MSW spy confirms zero extra fetches during typing.

### R-004 — Sanitized Error Responses (Score 6 / NFR6)

- **Strategy:** Extend `ExceptionHandlingMiddleware` (Epic 1 R-003 baseline) with explicit mapping for `DuplicateNitException` → 409 and `ValidationException` → 400. Default branch: 500 with `title: "Error interno del servidor"`, `detail` omitted in production. Add a CI assertion (test) that response bodies for 400/409/500 contain no substring matching the regex `/Microsoft\.|System\.|at \w+\(/i`.
- **Owner:** Backend DEV + QA.
- **Timeline:** Story 2.3 closure.
- **Status:** Planned.
- **Verification:** TC-E2-P0-02 + TC-E2-P0-03 green; manual review of `Program.cs` middleware ordering.

---

## 9. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Stories | Test Cases | Status |
|-----------------|---------|------------|--------|
| AC-E2.1 — Register client appears in list immediately | 2.3 | TC-E2-P0-01, TC-E2-P0-07, TC-E2-P0-09 | Covered |
| AC-E2.2 — Search results < 1 s with 500 records (NFR1) | 2.1 | TC-E2-P0-06, TC-E2-P1-02 | Covered |
| AC-E2.3 — View detail, edit, save | 2.2, 2.4 | TC-E2-P0-04, TC-E2-P1-09, TC-E2-P0-09 | Covered |
| AC-E2.4 — Required fields enforced + clear messages (FR8) | 2.3, 2.4 | TC-E2-P0-03, TC-E2-P1-08 | Covered |
| AC-E2.5 — Delete removes client from list | 2.5 | TC-E2-P0-05, TC-E2-P0-08, TC-E2-P0-09 | Covered |
| AC-E2.6 — Sort 4 modes, no reload, preserves search | 2.6 | TC-E2-P1-12, TC-E2-P2-01, TC-E2-P2-02, TC-E2-P2-08 | Covered |
| AC-2.1.a — 280 px panel, Nombre + NIT visible | 2.1 | TC-E2-P1-01 | Covered |
| AC-2.1.b — Real-time search by Nombre OR NIT < 1 s | 2.1 | TC-E2-P0-06, TC-E2-P1-02 | Covered |
| AC-2.1.c — EmptyState | 2.1 | TC-E2-P1-03 | Covered |
| AC-2.1.d — ErrorPanel + Reintentar | 2.1 | TC-E2-P1-04 | Covered |
| AC-2.2.a — Click → detail + URL update (FR30) | 2.2 | TC-E2-P1-05 | Covered |
| AC-2.2.b — Direct URL access works (FR30) | 2.2 | TC-E2-P1-05 | Covered |
| AC-2.2.c — Non-existent clienteId graceful | 2.2 | TC-E2-P1-06 | Covered |
| AC-2.3.a — Nuevo cliente form opens | 2.3 | TC-E2-P1-07 | Covered |
| AC-2.3.b — Valid submit → list + toast (FR27) | 2.3 | TC-E2-P0-01, TC-E2-P0-07, TC-E2-P1-07 | Covered |
| AC-2.3.c — Empty required → inline errors, no submit (FR8) | 2.3 | TC-E2-P0-03, TC-E2-P1-08 | Covered |
| AC-2.3.d — Duplicate NIT → 409 sanitized (NFR6) | 2.3 | TC-E2-P0-02 | Covered |
| AC-2.4.a — Form pre-filled (FR6) | 2.4 | TC-E2-P1-09 | Covered |
| AC-2.4.b — Update reflects immediately (FR27) | 2.4 | TC-E2-P0-04, TC-E2-P0-09 | Covered |
| AC-2.4.c — Clearing required → inline error, no submit (FR8) | 2.4 | TC-E2-P0-03, TC-E2-P1-08 | Covered |
| AC-2.4.d — Cancelar preserves data | 2.4 | TC-E2-P1-10 | Covered |
| AC-2.5.a — Confirmation dialog | 2.5 | TC-E2-P0-08, TC-E2-P1-11 | Covered |
| AC-2.5.b — Confirm → removed + right panel empty + toast (FR27) | 2.5 | TC-E2-P0-08, TC-E2-P0-09 | Covered |
| AC-2.5.c — Cancel keeps record | 2.5 | TC-E2-P1-11 | Covered |
| AC-2.5.d — Delete client with contacts → SET NULL + FR25 toast | 2.5 | TC-E2-P0-05 | Covered |
| AC-2.6.a — Nombre A→Z, no API | 2.6 | TC-E2-P1-12 | Covered |
| AC-2.6.b — Nombre Z→A, no API | 2.6 | TC-E2-P1-12 | Covered |
| AC-2.6.c — Más reciente | 2.6 | TC-E2-P1-12 | Covered |
| AC-2.6.d — Más antiguo | 2.6 | TC-E2-P1-12 | Covered |
| AC-2.6.e — Sort preserves search | 2.6 | TC-E2-P2-01 | Covered |
| AC-2.6.f — Default sort = Más reciente | 2.6 | TC-E2-P2-02 | Covered |

### NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search < 1 s @ 500 records | TC-E2-P0-06, TC-E2-P3-01 | Component perf |
| NFR2 | CRUD reflects in UI < 2 s | TC-E2-P3-02 | E2E stopwatch |
| NFR5 | Input validation / sanitization | TC-E2-P0-03, TC-E2-P2-04 | API Integration |
| NFR6 | No internal error / stack-trace exposure | TC-E2-P0-02 | API Integration |
| NFR10 | 500 clients scope | TC-E2-P0-06 (lower bound), TC-E2-P3-01 (headroom) | Component perf |

### FR Coverage

| FR | Requirement | Covered By |
|----|-------------|------------|
| FR1 | Create with required fields | TC-E2-P0-01, TC-E2-P1-07 |
| FR2 | View scrollable list | TC-E2-P1-01 |
| FR3 | Search by name | TC-E2-P1-02 |
| FR4 | Search by NIT/RUC | TC-E2-P1-02 |
| FR5 | View full detail | TC-E2-P1-05 |
| FR6 | Edit any field | TC-E2-P0-04, TC-E2-P1-09 |
| FR7 | Delete client | TC-E2-P0-05, TC-E2-P0-08 |
| FR8 | Prevent saving with missing fields | TC-E2-P0-03, TC-E2-P1-08 |
| FR25 | Orphan contacts surface (hook) | TC-E2-P0-05 (DB layer) |
| FR27 | Changes reflected immediately for all users | TC-E2-P0-07, TC-E2-P0-08 |
| FR30 | Deep linking | TC-E2-P1-05 |

---

## 10. Assumptions and Dependencies

### Assumptions

1. Epic 1 (Foundation) is fully done — CORS, Problem Details middleware, Scalar, EF Core + Postgres wiring, snake_case naming, TanStack Router, NavigationRail/Bar. Verified via `sprint-status.yaml`: `epic-1: done`.
2. siesa-ui-kit ships a `DataTable` / `ConfirmDialog` / `Toast` API (or equivalent) usable for the list, confirmation dialog, and success/error toasts; component tests treat them as black-box children.
3. The `SortControl` component lives at `src/shared/components/SortControl` (per Story 2.6 technical context) and accepts the four canonical sort identifiers (`nombre-asc`, `nombre-desc`, `fecha-desc`, `fecha-asc`).
4. Sorting is client-side and does NOT trigger a refetch — TanStack Query `staleTime` for `['clientes']` is sufficiently long that no incidental refetch happens during a sort interaction.
5. `IClienteRepository` is registered in DI with a real EF Core implementation for integration tests (no in-memory provider — TestContainers Postgres is used to honor NOT NULL / UNIQUE constraints).
6. Frontend validation (Zod) and backend validation (FluentValidation) are kept in sync via shared field-name conventions but are tested independently — Zod for UX immediacy (TC-E2-P1-08), FluentValidation for defense-in-depth (TC-E2-P0-03, TC-E2-P2-04).
7. The toast message strings used as assertions in component tests are the canonical Spanish strings from the PRD epic source — any drift requires updating both PRD copy and tests in the same PR.

### Dependencies

1. `ClienteEntity` + `ClienteConfiguration` + initial migration delivered in Story 2.1 — required by ALL backend integration tests.
2. `ExceptionHandlingMiddleware` mapping for `DuplicateNitException` and `ValidationException` — required by TC-E2-P0-02 and TC-E2-P0-03 (Story 2.3).
3. TanStack Query `QueryClient` provider in app root + `createTestQueryClient()` helper for tests — required by all component tests.
4. MSW server with handlers for `GET/POST/PUT/DELETE /api/v1/clientes` — required by all frontend component tests.
5. TestContainers Postgres image available in CI — required by all backend integration tests.

### Risks to Plan

- **Risk:** ON DELETE SET NULL is declared in `ContactoConfiguration` (Epic 3) instead of being part of Story 2.5 migration, causing R-002 mitigation to fail until Epic 3.
  - **Impact:** TC-E2-P0-05 red until Epic 3 lands; data-loss risk during Epic 2 production windows.
  - **Contingency:** Story 2.5 explicitly owns the migration that adds the FK constraint with `ON DELETE SET NULL`, even if it touches the contacts table. Document in Story 2.5's tech notes.
- **Risk:** The 280 px panel width is a Tailwind class drift (e.g., `w-72` vs `w-[280px]`) — TC-E2-P1-01 may need the canonical class.
  - **Impact:** False red on layout assertion.
  - **Contingency:** Use `getBoundingClientRect()`-style assertion via `data-testid` rather than class-name matching.
- **Risk:** Playwright E2E (TC-E2-P0-09) requires a real running backend + DB; flaky in CI if startup races the test.
  - **Impact:** Intermittent CI red.
  - **Contingency:** `webServer` config in `playwright.config.ts` with `reuseExistingServer` and health-check wait on `/scalar`.

---

## 11. Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests **before** Story 2.1 / 2.3 / 2.5 implementation starts (separate workflow; not auto-run by `*test-design`).
- Run `*automate` to extend coverage to P1/P2 once implementation lands.
- Run `*nfr-assess` once Story 2.1 ships to validate NFR1 against real backend latency + 500-record dataset.
- Run `*trace` after Epic 2 closure to refresh the traceability matrix (`traceability-matrix-epic-2.md`).

---

## 12. Notes for Story Implementation Agents

The following implementation constraints MUST be enforced so this test design passes:

1. **`uk_clientes_nit` UNIQUE index** must be created in the Story 2.1 migration; `CreateClienteCommandHandler` must catch the unique violation and throw a domain `DuplicateNitException`.
2. **`ON DELETE SET NULL`** for `contactos.cliente_id` must be declared via `OnDelete(DeleteBehavior.SetNull)` in `ContactoConfiguration` and shipped in the Story 2.5 migration. The `contactos` table must already exist (placeholder migration acceptable) so the FK can be wired; alternatively the FK is added later in Epic 3 but the test (TC-E2-P0-05) blocks Story 2.5 acceptance until verified.
3. **`ExceptionHandlingMiddleware`** must NOT include exception type names, `Microsoft.*` namespaces, or stack traces in any response body. Domain exceptions (`DuplicateNitException`, `ValidationException`, `NotFoundException`) map to 409 / 400 / 404 with sanitized `title` (Spanish) and `detail`.
4. **TanStack Query mutation hooks** (`useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`) MUST call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` in `onSuccess`.
5. **Sort + filter** MUST be pure functions in `src/modules/crm/clientes/application/` (e.g., `sortClientes.ts`, `filterClientes.ts`) — unit-testable without React.
6. **Toast strings** are canonical Spanish from the PRD epic file (`Cliente creado correctamente`, `Cliente actualizado correctamente`, `Cliente eliminado correctamente`, and the orphan-toast for AC-2.5.d). Define them as exported constants to avoid drift.
7. **`DateTimeOffset` only** in `ClienteEntity` (Architecture enforcement guideline #1). Do NOT use `DateTime`.
8. **Story-level test design** produced by `sa-quick-dev` MUST cite the IDs defined here (TC-E2-P0-01 … TC-E2-P3-03) for traceability.
9. **Spanish messages** in Zod schema (`clienteSchema.ts`): "El nombre es obligatorio", "El NIT/RUC es obligatorio", "El teléfono es obligatorio", "La ciudad es obligatoria". Component test TC-E2-P1-08 asserts these strings.
10. **SortControl default value** on mount must be `fecha-desc` (Más reciente) per AC-2.6.f.

---

## 13. Approval

**Test Design Approved By:**

- [ ] Product Manager: ______________  Date: ________
- [ ] Tech Lead: ______________  Date: ________
- [ ] QA Lead (TEA): SiesaTeam  Date: 2026-06-02

**Comments:**

First baseline of Epic 2 test design via `testarch-test-design` epic-level workflow as part of the `sa-quick-dev` orchestrator pre-loop. Epic 2 is the first epic exercising the full domain stack delivered in Epic 1; therefore the four high-risk items (R-001 unique NIT race, R-002 ON DELETE SET NULL, R-003 NFR1 filter latency, R-004 NFR6 error sanitization) define the gate. Story-level work must align with the test IDs above to guarantee traceability into the per-story review and gate-decision artifacts.

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (TECH / SEC / PERF / DATA / BUS / OPS).
- `probability-impact.md` — Risk scoring methodology (P × I).
- `test-levels-framework.md` — Test level selection (E2E / API / Component / Unit).
- `test-priorities-matrix.md` — P0–P3 prioritization.

### Related Documents

- PRD shards: `_bmad-output/planning-artifacts/prd/index.md`
- Functional reqs: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Non-functional reqs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Feature shard: `_bmad-output/planning-artifacts/prd/feature-gestion-de-clientes.md`
- Epic 2 source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epic 1 test design (precedent / pattern): `_bmad-output/implementation-artifacts/test-design-epic-1.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
