---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-07-01"
author: "SiesaTeam (TEA — Test Architect)"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: Draft
---

# Test Design — Epic 2: Client Management

## 1. Executive Summary

**Scope:** Full test design for Epic 2 (Client Management) — 6 user stories covering the complete CRUD lifecycle of the `Cliente` entity plus search, sort, and cascade-safe deletion.

**Coverage:**
- FRs covered: FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8 (client CRUD + search) + FR25, FR27, FR30 (orphan contacts, real-time sync, deep linking)
- NFRs covered: NFR1 (search <1s @ 500 records), NFR2 (CRUD <2s UI update), NFR5 (input sanitization), NFR6 (no stack trace exposure), NFR11 (extensible model)

**Risk Summary:**
- Total risks identified: **11**
- High-priority risks (score ≥6): **4**
- Critical categories: **DATA** (cascade + orphan contacts), **SEC** (validation bypass), **PERF** (search latency)

**Coverage Plan Summary:**
- P0 scenarios: **12** (~24 hours)
- P1 scenarios: **20** (~20 hours)
- P2 scenarios: **15** (~7.5 hours)
- P3 scenarios: **6** (~1.5 hours)
- **Total: 53 tests / ~53 hours (~6.5 days)**

**Test Levels Distribution:**
- E2E (Playwright): **10** — critical journeys, deep linking, cascade behaviour
- API/Integration (xUnit + WebApplicationFactory): **20** — endpoint contracts, validation, DB behaviour
- Component (Vitest + RTL): **15** — forms, list, sort, dialogs
- Unit (Vitest / xUnit): **8** — validators, sort utils, schemas

---

## 2. Epic Overview & Test Scope

### Epic Summary

Epic 2 implements the complete client CRUD (Create, Read, Update, Delete) plus list, search, sort, and detail-view behavior on top of the foundation delivered in Epic 1. It introduces the `clientes` table, five REST endpoints (`/api/v1/clientes`), the split-panel `/clientes` route, the `ClienteForm` React Hook Form + Zod flow, and the client-side search/sort mechanics driven by TanStack Query cache.

### Stories in Scope

| Story | Title | Primary Concerns |
|-------|-------|------------------|
| 2.1 | Client List & Search | Data fetch, real-time client-side filter, empty & error states, NFR1 (<1s @ 500 records) |
| 2.2 | Client Detail View | URL sync `/clientes/:clienteId`, deep linking (FR30), not-found handling |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), unique NIT (409), immediate list update (FR27), success toast |
| 2.4 | Edit Client | Pre-filled form, optimistic update, cancel semantics, required-field validation |
| 2.5 | Delete Client | Confirmation dialog, immediate list removal, **cascade orphaning of contacts** (FK ON DELETE SET NULL) — highest-risk story |
| 2.6 | Sort Client List | Client-side sorting over TanStack Query cache, sort + filter coexistence, default `Más reciente` |

### Out of Scope for This Epic

- Contact CRUD (Epic 3)
- Client↔Contact association operations (Epic 4)
- Authentication / authorization (deferred to post-MVP per PRD)
- Server-side pagination (deferred per NFR11 — not needed for 500 records)
- Bulk operations (import/export)

### Assumptions

1. Epic 1 (foundation) is complete: CORS, TanStack Router, TanStack Query provider, Axios `apiClient`, `ExceptionHandlingMiddleware`, EF Core + PostgreSQL are all functional.
2. `siesa-ui-kit` components (`Button`, `Input`, `Toast`, `Dialog`, form primitives) render correctly.
3. Test DB is isolated per test run (`WebApplicationFactory` + Testcontainers or migration-per-test-class).
4. Frontend tests use MSW to mock `/api/v1/clientes` endpoints.
5. The `contactos` table exists as a schema stub with the nullable `cliente_id` FK (created in migration but populated in Epic 3) — required to validate Story 2.5's ON DELETE SET NULL behavior.

---

## 3. Risk Assessment

### 3.1 High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| **R-01** | DATA | Deleting a client with associated contacts corrupts contacts or violates FK constraint (should orphan contacts, not delete or block) | 3 | 3 | **9** | Integration test verifying `ON DELETE SET NULL` on `contactos.cliente_id`; contacts survive delete with `cliente_id = NULL` | QA + DEV | Before Story 2.5 merge |
| **R-02** | SEC | Frontend Zod validation is bypassed (curl/Postman), backend FluentValidation missing → invalid data persisted (empty required fields, XSS in Nombre) | 2 | 3 | **6** | API tests hitting endpoints directly with malformed payloads; backend must reject with 400 + Problem Details | QA | Before Story 2.3 merge |
| **R-03** | DATA | Duplicate NIT/RUC persists due to race condition or missing unique constraint — creates ambiguous client identity | 2 | 3 | **6** | DB constraint `uk_clientes_nit` + explicit 409 handling test; concurrent-request test verifying only one record wins | QA + DEV | Before Story 2.3 merge |
| **R-04** | PERF | Client-side filter+sort over 500 records blocks main thread >1s (violates NFR1) due to naive re-render or missing memoization | 2 | 3 | **6** | Benchmark test with 500-record fixture; assert filter+sort round-trip <500ms using `performance.now()` in a component test | DEV | Before Story 2.1 merge |

### 3.2 Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| **R-05** | BUS | User closes form via `Cancelar` mid-edit but changes silently persisted (state leak between edit sessions) | 2 | 2 | **4** | Component test asserting `Cancelar` restores original values and doesn't fire mutation | QA |
| **R-06** | TECH | `queryClient.invalidateQueries(['clientes'])` not fired after mutation → stale list (FR27 violation) | 2 | 2 | **4** | Component/hook test asserting refetch after each of create/update/delete | DEV |
| **R-07** | DATA | Optimistic update rollback fails on 4xx/5xx, leaving UI in inconsistent state (record shown but not persisted) | 2 | 2 | **4** | MSW test simulating 500 response; assert item reverts and error toast displays | QA |
| **R-08** | BUS | Search input is not debounced or filter uses substring match on wrong field → poor UX, false negatives on NIT search | 2 | 2 | **4** | Component test: typing "123" matches both `nombre` containing "123" and `nit` starting with "123" | DEV |
| **R-09** | BUS | Sort + Search interaction: changing sort clears search input (FR/Story 2.6 explicit AC) | 2 | 2 | **4** | Component test: apply search, then change sort → assert search input preserved and sort applied to filtered set | QA |

### 3.3 Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| **R-10** | OPS | Missing/inconsistent Spanish text in errors ("Cliente creado correctamente" vs. English fallback) | 2 | 1 | **2** | Snapshot text assertions in component tests |
| **R-11** | BUS | Default sort not applied (`Más reciente`) on initial load — user sees arbitrary order | 1 | 2 | **2** | Component test on initial render |

### Risk Category Legend

- **TECH**: Technical/Architecture
- **SEC**: Security (validation, sanitization, data exposure)
- **PERF**: Performance (NFR1/NFR2)
- **DATA**: Data Integrity (cascades, uniqueness, orphaning)
- **BUS**: Business logic / UX correctness
- **OPS**: Operations (i18n, config)

---

## 4. Test Coverage Plan

### 4.1 P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey · High-risk (score ≥6) · No workaround · Security/data critical.

| # | Requirement | Story | Test Level | Risk Link | Test Count | Owner | Notes |
|---|-------------|-------|------------|-----------|------------|-------|-------|
| 1 | Create client with all required fields → appears in list + toast | 2.3 | E2E | — | 1 | QA | End-to-end happy path via Playwright |
| 2 | Create client with empty required fields → inline errors, no POST | 2.3 | Component | R-02 | 1 | QA | Zod + RHF validation |
| 3 | Create client with duplicate NIT → 409 handled, friendly error | 2.3 | API | R-03 | 1 | QA | Backend must return Problem Details 409 |
| 4 | Backend rejects direct API POST with empty/invalid fields (bypass frontend) | 2.3 | API | R-02 | 2 | QA | FluentValidation + Problem Details 400 |
| 5 | Delete client with associated contacts → contacts survive w/ `cliente_id = NULL` | 2.5 | API | R-01 | 1 | QA + DEV | **Highest risk — must not break FR23/FR25** |
| 6 | Delete client confirmation flow (dialog appears, Cancelar aborts) | 2.5 | Component | — | 1 | QA | RTL — dialog gating |
| 7 | Edit client → PUT `/api/v1/clientes/:id` persists changes visible in list | 2.4 | E2E | — | 1 | QA | End-to-end via Playwright |
| 8 | Search returns matches for name and NIT/RUC | 2.1 | Component | R-08 | 1 | QA | MSW-mocked 500-record fixture |
| 9 | Search performance: filter over 500 records completes <500ms | 2.1 | Component | R-04 | 1 | DEV | Benchmark using `performance.now()` |
| 10 | List loads successfully; empty state renders when no clients | 2.1 | Component | — | 1 | QA | EmptyState visible |
| 11 | Deep link `/clientes/:clienteId` loads correct detail directly | 2.2 | E2E | — | 1 | QA | FR30 |

**Total P0**: **12 tests · ~24 hours**

### 4.2 P1 (High) — Run on PR to main

**Criteria:** Important features · Medium risk (3-4) · Common workflows.

| # | Requirement | Story | Test Level | Risk Link | Test Count | Owner | Notes |
|---|-------------|-------|------------|-----------|------------|-------|-------|
| 12 | GET `/api/v1/clientes` returns array of clients | 2.1 | API | — | 1 | QA | Integration test |
| 13 | GET `/api/v1/clientes/:id` returns 404 for unknown id | 2.2 | API | — | 1 | QA | Problem Details 404 |
| 14 | List shows Nombre + NIT/RUC per item in 280px panel | 2.1 | Component | — | 1 | QA | Layout assertion |
| 15 | ErrorPanel with "Reintentar" appears on fetch failure | 2.1 | Component | — | 1 | QA | MSW-simulated 500 |
| 16 | Detail-view URL updates on list-item click | 2.2 | E2E | — | 1 | QA | FR30 |
| 17 | Not-found message shown for invalid `clienteId` in URL | 2.2 | Component | — | 1 | QA | Graceful UX |
| 18 | Success toast "Cliente creado correctamente" after create | 2.3 | Component | R-10 | 1 | QA | Spanish text |
| 19 | Success toast "Cliente actualizado correctamente" after edit | 2.4 | Component | R-10 | 1 | QA | Spanish text |
| 20 | Toast "Cliente eliminado correctamente" after simple delete | 2.5 | Component | R-10 | 1 | QA | Spanish text |
| 21 | Toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." after cascade delete | 2.5 | Component | R-01 | 1 | QA | Cascade UX |
| 22 | Edit form pre-fills current client values | 2.4 | Component | — | 1 | QA | React Hook Form defaults |
| 23 | Cancelar in edit closes form without persisting changes | 2.4 | Component | R-05 | 1 | QA | State isolation |
| 24 | Clearing a required field in edit → inline error, no PUT | 2.4 | Component | R-02 | 1 | QA | Zod on submit |
| 25 | After create/update/delete, `['clientes']` query invalidates → refetch | 2.1–2.5 | Component | R-06 | 1 | DEV | RTK/Query invalidation hook test |
| 26 | Optimistic update rolls back on 500 error and shows error toast | 2.3–2.5 | Component | R-07 | 1 | QA | MSW error scenario |
| 27 | Sort `Nombre A→Z` and `Nombre Z→A` reorders list (no API call) | 2.6 | Component | — | 2 | QA | Assert `fetch` mock **not** called |
| 28 | Sort `Más reciente` / `Más antiguo` orders by `createdAt` desc/asc | 2.6 | Component | — | 2 | QA | Uses fixture with mixed dates |
| 29 | Changing sort with active search preserves search input | 2.6 | Component | R-09 | 1 | QA | Cross-feature interaction |

**Total P1**: **20 tests · ~20 hours**

### 4.3 P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features · Low risk (1-2) · Edge cases.

| # | Requirement | Story | Test Level | Risk Link | Test Count | Owner | Notes |
|---|-------------|-------|------------|-----------|------------|-------|-------|
| 30 | Default sort on initial render is `Más reciente` | 2.6 | Component | R-11 | 1 | QA | AC-specific |
| 31 | `createClienteSchema` (Zod) validates all field constraints | 2.3 | Unit | — | 1 | DEV | Schema unit test |
| 32 | `updateClienteSchema` (Zod) validates partial updates | 2.4 | Unit | — | 1 | DEV | Schema unit test |
| 33 | `CreateClienteRequestValidator` (FluentValidation) covers name/NIT/phone/city | 2.3 | Unit | R-02 | 1 | DEV | xUnit unit test |
| 34 | `UpdateClienteRequestValidator` covers all fields | 2.4 | Unit | R-02 | 1 | DEV | xUnit unit test |
| 35 | Sort utility function ordering for tied `createdAt` (stable) | 2.6 | Unit | — | 1 | DEV | Deterministic ordering |
| 36 | `ClienteEndpoints` returns 201 with `Location` header on create | 2.3 | API | — | 1 | QA | REST convention |
| 37 | `ClienteEndpoints` returns 200 with updated body on PUT | 2.4 | API | — | 1 | QA | REST convention |
| 38 | `ClienteEndpoints` returns 204 No Content on DELETE | 2.5 | API | — | 1 | QA | REST convention |
| 39 | Backend logs errors but never returns stack trace (NFR6) | all | API | R-02 | 1 | QA | Problem Details format only |
| 40 | Search debounce prevents excessive re-renders | 2.1 | Component | — | 1 | DEV | Optional micro-optimization |
| 41 | Search case-insensitive on Nombre and NIT | 2.1 | Component | R-08 | 1 | QA | Diacritic handling |
| 42 | Long field values (>255 char Nombre) rejected by validator | 2.3 | Unit | R-02 | 1 | DEV | Boundary |
| 43 | XSS-like input in Nombre/Ciudad rejected or safely escaped | 2.3 | API | R-02 | 1 | QA | `<script>` payload |
| 44 | List renders correctly with exactly 500 records (upper bound) | 2.1 | Component | R-04 | 1 | DEV | NFR10 boundary |

**Total P2**: **15 tests · ~7.5 hours**

### 4.4 P3 (Low) — Run on-demand

| # | Requirement | Story | Test Level | Test Count | Owner | Notes |
|---|-------------|-------|------------|------------|-------|-------|
| 45 | Visual regression of detail panel layout | 2.2 | E2E | 1 | QA | Screenshot diff |
| 46 | Accessibility (axe) on `/clientes` and `/clientes/:id` | 2.1, 2.2 | E2E | 1 | QA | WCAG AA smoke |
| 47 | Keyboard navigation through list items | 2.1 | Component | 1 | QA | a11y |
| 48 | Search performance benchmark at 1,000 records (NFR11 headroom) | 2.1 | Component | 1 | DEV | Beyond MVP scope |
| 49 | i18n fallback: unhandled key does not render a raw code | all | Component | 1 | QA | Defensive check |
| 50 | Concurrent-create race: two POSTs with same NIT → one 201, one 409 | 2.3 | API | 1 | DEV | Only if load-test infra exists |

**Total P3**: **6 tests · ~1.5 hours**

---

## 5. Execution Order

### Smoke Tests (<5 min)
- **[P0-1]** Create client happy path (E2E)
- **[P0-8]** Search returns matches
- **[P0-10]** List + empty state render
- **[P0-11]** Deep link `/clientes/:id` loads detail
- **[P0-7]** Edit client happy path (E2E)

**Total: 5 smoke scenarios**

### P0 Tests (<10 min)
- All 12 P0 scenarios from §4.1 (E2E, API, and critical Component tests)
- Includes **R-01 cascade delete** and **R-04 performance benchmark** — both non-negotiable gates

**Total: 12 scenarios**

### P1 Tests (<30 min)
- All 20 P1 scenarios from §4.2
- Focus: mutation invalidation, optimistic rollback, sort behavior, Spanish text, error UX

**Total: 20 scenarios**

### P2/P3 Tests (<60 min)
- Unit tests (validators, schemas, sort utilities)
- Boundary & security tests (XSS, long values, 500-record load)
- Nightly regression + on-demand P3 (visual, a11y, benchmarks)

**Total: 21 scenarios (15 P2 + 6 P3)**

---

## 6. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 12 | 2.0 | 24.0 | Complex E2E + integration setup, cascade delete |
| P1 | 20 | 1.0 | 20.0 | Standard component + API tests |
| P2 | 15 | 0.5 | 7.5 | Unit + simple edge cases |
| P3 | 6 | 0.25 | 1.5 | Exploratory / on-demand |
| **Total** | **53** | **—** | **53.0** | **~6.5 days** |

### Prerequisites

**Test Data / Factories:**
- `ClienteFactory` (backend, xUnit) — Bogus-based, produces valid `ClienteEntity` with unique NIT
- `clientesFixture.ts` (frontend, MSW) — 500-record deterministic fixture for filter/sort benchmarks
- `contactosSeedFixture.ts` — small set of contacts attached to a client to verify R-01 cascade orphaning

**Tooling:**
- **Playwright** — E2E on `http://localhost:5173` against seeded backend
- **Vitest + Testing Library + MSW** — Component + hook tests
- **xUnit + WebApplicationFactory + Testcontainers-PostgreSQL** — Backend integration tests
- **Bogus** — DTO/entity factories in backend
- **@faker-js/faker** — Fixture generation in frontend

**Environment:**
- Local PostgreSQL 18 with dedicated `siesa_agents_test_db` (isolated from dev)
- Ephemeral DB per test class via Testcontainers (recommended) or shared migration-per-test-run with transaction rollback
- MSW interceptors set up in `vitest.setup.ts`
- Playwright auth-less config (no login flow in MVP)

---

## 7. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: **100%** — no exceptions, no waivers
- **P1 pass rate**: **≥95%** — failures require documented waiver
- **P2/P3 pass rate**: **≥90%** — informational, tracked for trends
- **High-risk mitigations (R-01…R-04)**: **100% complete** — cascade delete, validation bypass, duplicate NIT, and search performance must all have passing tests before merge

### Coverage Targets

- **Critical paths (create, edit, delete happy paths)**: **100%** E2E coverage
- **Security scenarios (SEC risks R-02, R-03)**: **100%** — backend validators covered by unit + integration
- **Business logic (CRUD handlers, sort, search)**: **≥80%** unit + component coverage
- **Edge cases (empty list, 404, 409, 500, cancel semantics)**: **≥60%**

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] **R-01**: Cascade delete → orphan contacts survive with `cliente_id = NULL` (verified via integration test on real PostgreSQL)
- [ ] **R-02**: Backend rejects malformed payloads (curl-level bypass test passes)
- [ ] **R-03**: Duplicate NIT → 409 Problem Details returned, no duplicate row inserted
- [ ] **R-04**: 500-record filter+sort benchmark <500ms
- [ ] All Problem Details responses conform to RFC 7807 (no stack traces) — extends NFR6 from Epic 1
- [ ] All UI text asserted in Spanish (toasts, errors, labels, dialog messages)

---

## 8. Mitigation Plans

### R-01 — Deleting client with contacts (Score: 9) ★ HIGHEST

**Mitigation Strategy:**
- EF Core `ContactoConfiguration` MUST declare `.OnDelete(DeleteBehavior.SetNull)` on the `ClienteId` FK.
- PostgreSQL migration must generate `ON DELETE SET NULL`.
- Integration test: seed 1 client + 2 contacts → DELETE client → assert 2 contacts remain in `contactos` with `cliente_id IS NULL`.
- Component test: after cascade delete, assert Spanish toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
- Sanity check with a raw SQL query in the integration test asserting the FK definition (`information_schema.referential_constraints`).

**Owner:** DEV (implementation) + QA (verification)
**Timeline:** Before Story 2.5 merges
**Status:** Planned
**Verification:** Integration test `ClienteEndpointsTests.Delete_WithAssociatedContacts_OrphansContacts` passes.

### R-02 — Frontend validation bypass (Score: 6)

**Mitigation Strategy:**
- All Zod rules mirrored in FluentValidation (Nombre required + max length, NIT required + regex, Telefono required, Ciudad required).
- API test suite `ClienteEndpointsTests.CreateInvalidPayload_Returns400ProblemDetails` covers each field individually and all-empty case.
- `ExceptionHandlingMiddleware` (from Epic 1) confirmed to convert ValidationException → 400 Problem Details with `errors` dictionary, no stack.

**Owner:** QA
**Timeline:** Before Story 2.3 merges
**Status:** Planned
**Verification:** API test suite green + manual `curl` bypass check documented in the story.

### R-03 — Duplicate NIT/RUC (Score: 6)

**Mitigation Strategy:**
- DB migration creates `CREATE UNIQUE INDEX uk_clientes_nit ON clientes(nit)`.
- `CreateClienteCommandHandler` catches `DbUpdateException` on unique-violation SQLState (`23505`) → throws `ConflictException` → middleware returns 409 + Spanish error `El NIT/RUC ya está registrado`.
- Frontend `useCreateCliente` maps 409 → inline field error under NIT input.
- Concurrent-create P3 test optional but validates race handling.

**Owner:** DEV + QA
**Timeline:** Before Story 2.3 merges
**Status:** Planned
**Verification:** `ClienteEndpointsTests.Create_DuplicateNit_Returns409` passes; frontend component test shows Spanish error under NIT field.

### R-04 — Filter/sort performance @ 500 records (Score: 6)

**Mitigation Strategy:**
- `ClienteListView` filter+sort implemented with `useMemo` keyed on `[clientes, searchQuery, sortOption]`.
- Benchmark component test loads 500-record fixture, executes filter+sort, and asserts elapsed <500ms via `performance.now()`.
- If threshold missed → refactor with pre-sorted keys or extract into a Web Worker (post-MVP consideration).

**Owner:** DEV
**Timeline:** Before Story 2.1 merges
**Status:** Planned
**Verification:** Benchmark test `ClienteListView.filter+sort under 500ms with 500 records` passes.

---

## 9. Dependencies

1. **Epic 1 foundation** — CORS, DbContext, ExceptionHandlingMiddleware, TanStack Router — **Required before Story 2.1**
2. **Contacts stub schema** — `contactos.cliente_id` FK column with ON DELETE SET NULL must exist before Story 2.5 integration test — **Required before Story 2.5**
3. **`siesa-ui-kit` v-current** — `Toast`, `Dialog`, form primitives — **Required by all stories**
4. **Test infrastructure** — Playwright + Vitest + MSW + Testcontainers-PostgreSQL harness — **Required before P0 execution**

### Risks to Plan

- **Risk:** siesa-ui-kit `Dialog` API changes mid-epic → breaks Story 2.5 confirmation flow tests.
  - **Impact:** Medium — component tests need update
  - **Contingency:** Fall back to shadcn/ui `AlertDialog` (per architecture allow-list)
- **Risk:** Testcontainers unavailable in CI → integration tests can't run against real PostgreSQL.
  - **Impact:** Medium — R-01 verification degraded
  - **Contingency:** Use shared test DB with transaction-rollback pattern; document trade-off in the story

---

## 10. Follow-on Workflows (Manual)

- Run `*atdd` per story starting with **Story 2.1** to generate the failing P0/P1 tests before implementation.
- Run `*automate` after each story implementation completes to expand coverage.
- Run `*trace` at epic close to produce the traceability matrix mapping FR1–FR8 → tests → risks.
- Run `*nfr` to validate NFR1 (search latency) and NFR6 (no stack trace exposure) with dedicated evidence.

---

## 11. Approval

**Test Design Approved By:**

- [ ] Product Manager: _____________ Date: __________
- [ ] Tech Lead: _____________ Date: __________
- [ ] QA Lead: _____________ Date: __________

**Comments:**

---

## 12. Appendix

### Story ↔ FR ↔ Risk Traceability

| Story | ACs | FRs Covered | NFRs Covered | Primary Risks |
|-------|-----|-------------|--------------|---------------|
| 2.1 List & Search | AC-E2.2 | FR2, FR3, FR4 | NFR1 | R-04, R-08 |
| 2.2 Detail View | — | FR5 | NFR11 (deep link FR30) | — |
| 2.3 Create | AC-E2.1, AC-E2.4 | FR1, FR8 | NFR5, NFR6 | R-02, R-03 |
| 2.4 Edit | AC-E2.3 | FR6, FR8 | NFR2, NFR5 | R-02, R-05, R-06 |
| 2.5 Delete | AC-E2.5 | FR7 (+ FR25, FR27 impact) | NFR2, NFR11 | **R-01**, R-07 |
| 2.6 Sort | AC-E2.6 | (UX) | NFR1 (client-side) | R-09, R-11 |

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories)
- `probability-impact.md` — Risk scoring methodology
- `test-levels-framework.md` — E2E vs API vs Component vs Unit
- `test-priorities-matrix.md` — P0-P3 prioritization

### Related Documents

- **PRD:** `_bmad-output/planning-artifacts/prd/functional-requirements.md`, `.../non-functional-requirements.md`
- **Epic:** `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md`
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
- **Previous Epic Test Design:** `_bmad-output/implementation-artifacts/test-design-epic-1.md`
- **Sprint Status:** `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by:** BMad TEA Agent — Test Architect Module (autonomous mode via `sa-quick-dev`)
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Date:** 2026-07-01
