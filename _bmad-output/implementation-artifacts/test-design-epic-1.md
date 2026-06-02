---
epic: 1
title: "Project Foundation & Application Shell"
mode: epic-level
phase: 4
createdAt: "2026-05-20"
updatedAt: "2026-06-02"
stories:
  - "1.1 — Project Initialization & Repository Structure"
  - "1.2 — Frontend Navigation Shell"
  - "1.3 — Backend Database Foundation"
status: approved
---

# Test Design — Epic 1: Project Foundation & Application Shell

**Date:** 2026-06-02
**Author:** SiesaTeam (TEA — Test Architect)
**Status:** Approved
**Workflow:** `_bmad/bmm/testarch/test-design` v4.0 (BMad v6) — Epic-Level Mode (Phase 4)

---

## Executive Summary

**Scope:** Full epic-level test design for Epic 1 — Project Foundation & Application Shell.

**Epic Goal:** Stand up the Vite/React/TypeScript frontend and the .NET 10 Clean Architecture backend, wire up PostgreSQL via EF Core, expose SPA navigation with deep-linking (`/clientes`, `/contactos`), and harden the backend with Problem Details RFC 7807 error handling. No domain logic for `clientes` / `contactos` yet — these arrive in Epics 2 and 3.

**Risk Summary:**

- Total risks identified: **9**
- High-priority risks (score ≥6): **3** (R1 CORS, R2 TS strict, R3 Problem Details)
- Risk categories present: **TECH, SEC, OPS, BUS**

**Coverage Summary:**

- P0 scenarios: **5** (10.0 hours)
- P1 scenarios: **6** (6.0 hours)
- P2 scenarios: **4** (2.0 hours)
- P3 scenarios: **2** (0.5 hours)
- **Total effort:** **18.5 hours (~2.3 days)** — 17 automated tests

**Test Pyramid (epic-1):**

| Level | Count | Tool |
|-------|-------|------|
| E2E | 2 | Playwright |
| API Integration | 5 | xUnit + `WebApplicationFactory<Program>` (+ TestContainers Postgres) |
| Component | 6 | Vitest + @testing-library/react |
| Unit / Build | 4 | Vitest / xUnit / `dotnet build` / `tsc --noEmit` |
| **Total** | **17** | — |

---

## 1. Epic Overview & Test Scope

### Stories in Scope

| Story | Title | Primary Test Concerns |
|-------|-------|------------------------|
| 1.1 | Project Initialization & Repository Structure | Dev toolchain, TypeScript strict, Scalar, CORS, Clean Architecture solution build |
| 1.2 | Frontend Navigation Shell | TanStack Router SPA navigation, responsive nav (siesa-ui-kit NavigationRail/NavigationBar), deep linking, 404 |
| 1.3 | Backend Database Foundation | EF Core + PostgreSQL wiring, initial empty migration, `ApplySnakeCaseNaming()`, `ExceptionHandlingMiddleware` → Problem Details (NFR6) |

### Out of Scope for This Epic

- Domain entity tables `clientes` (Epic 2 Story 2.1) and `contactos` (Epic 3 Story 3.1).
- Authentication / authorization (deferred — MVP).
- HTTPS configuration (NFR4 — non-local deployments only).
- Performance / load testing (no domain endpoints exist yet; deferred to Epic 2+).

### Acceptance Criteria Inventory

| Source | Code | Acceptance Criterion |
|--------|------|----------------------|
| Epic-1 | AC-E1.1 | App loads with accessible navigation on desktop and mobile browsers |
| Epic-1 | AC-E1.2 | User can navigate between Clientes and Contactos without full page reloads (FR28) |
| Epic-1 | AC-E1.3 | Direct URL access to `/clientes` and `/contactos` renders correct view (FR30) |
| Story 1.1 | AC-1.1.a | `npm run dev` starts Vite on 5173 with no errors |
| Story 1.1 | AC-1.1.b | TypeScript strict mode enabled |
| Story 1.1 | AC-1.1.c | Backend starts on 5000; Scalar loads at `/scalar` |
| Story 1.1 | AC-1.1.d | Four CA projects (API, Application, Domain, Infrastructure) referenced in solution |
| Story 1.1 | AC-1.1.e | CORS allows requests from `http://localhost:5173` |
| Story 1.2 | AC-1.2.a | NavigationRail visible on desktop with Clientes/Contactos entries |
| Story 1.2 | AC-1.2.b | Mobile NavigationBar visible on small viewports (FR29) |
| Story 1.2 | AC-1.2.c | SPA navigation without full reload (FR28) |
| Story 1.2 | AC-1.2.d | Deep linking via URL bar (FR30) |
| Story 1.2 | AC-1.2.e | Graceful 404 / not-found view |
| Story 1.3 | AC-1.3.a | `siesa_agents_db` created by `dotnet ef database update` |
| Story 1.3 | AC-1.3.b | EF Core migrations folder exists in SiesaAgents.Infrastructure |
| Story 1.3 | AC-1.3.c | Unhandled exceptions return Problem Details RFC 7807 — no stack trace (NFR6) |
| Story 1.3 | AC-1.3.d | `ApplySnakeCaseNaming()` applied; future tables follow snake_case |

---

## 2. Risk Assessment

Standard scoring: **Risk Score = Probability (1–3) × Impact (1–3)**. Threshold ≥6 → immediate mitigation.

### 2.1 High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 (R1) | TECH | CORS misconfiguration between frontend (5173) and backend (5000) silently blocks all API calls; invisible until runtime | 3 | 3 | **9** | Explicit integration test: OPTIONS preflight + actual GET from `Origin: http://localhost:5173` returns expected `Access-Control-Allow-Origin` header | DEV + QA | Story 1.1 close |
| R-002 (R2) | TECH | TypeScript strict mode breaks compilation on first run (implicit `any`, missing types in transitive deps), blocking all subsequent frontend work | 2 | 3 | **6** | Build gate: `npx tsc --noEmit` and `npm run build` must exit 0 in CI | DEV | Story 1.1 close |
| R-003 (R3) | SEC | `ExceptionHandlingMiddleware` missing, mis-ordered, or returning raw exception details — violates NFR6 (information disclosure) | 2 | 3 | **6** | Integration test: trigger unhandled exception via test endpoint, assert `application/problem+json`, fields `{status, title, detail}` present, `stackTrace` / `exception` / `innerException` absent | DEV + QA | Story 1.3 close |

### 2.2 Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-004 (R4) | TECH | TanStack Router deep-linking fails on direct URL access (missing SPA fallback / catch-all) | 2 | 2 | **4** | E2E + component tests for `/clientes` and `/contactos` direct loads | DEV |
| R-005 (R5) | DATA | `ApplySnakeCaseNaming()` not applied, applied before other config, or omitted — breaks future migrations in Epic 2/3 | 1 | 3 | **3** | Integration test: assert `__ef_migrations_history` columns are snake_case | DEV |
| R-006 (R6) | OPS | PostgreSQL connection string missing/incorrect in `appsettings.Development.json` → silent startup failure | 2 | 2 | **4** | Integration test: backend boots and health endpoint responds 200 | DEV |

### 2.3 Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-007 (R7) | BUS | NavigationRail/NavigationBar swap fires at the wrong responsive breakpoint (lg: 1024px), degrading mobile UX | 1 | 2 | **2** | Monitor + component viewport tests |
| R-008 (R8) | OPS | Scalar registration accidentally replaced by Swagger middleware, breaking corporate standard | 1 | 1 | **1** | Smoke test on `/scalar` |
| R-009 (R9) | OPS | Solution project references (.csproj / .sln) not linked → CI build failure | 1 | 2 | **2** | Monitor + `dotnet build SiesaAgents.sln` in CI |

### 2.4 Risk Category Legend

- **TECH** — Technical / Architecture (CORS, build toolchain, routing fallback)
- **SEC** — Security (NFR6 information disclosure)
- **PERF** — Not applicable to Epic 1 (no domain endpoints yet)
- **DATA** — Data Integrity (EF Core naming convention)
- **BUS** — Business Impact (UX degradation on wrong breakpoint)
- **OPS** — Operations (config, build, deployment plumbing)

---

## 3. Test Coverage Plan

### 3.1 P0 (Critical) — Run on every commit

**Criteria:** Blocks core foundation + High risk (score ≥6) + No workaround.

| ID | Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|----|-------------|-----------|-----------|------------|-------|-------|
| TC-E1-P0-01 | AC-1.1.a/b — TypeScript strict build | Unit / Build | R-002 | 1 | DEV | `tsc --noEmit` + `npm run build` exit 0 |
| TC-E1-P0-02 | AC-1.1.a — Vite dev server on 5173 | Unit / Smoke | R-002 | 1 | DEV | `npm run dev` boots, GET 5173 returns 200 |
| TC-E1-P0-03 | AC-1.1.c — Backend boots + Scalar at `/scalar` | API Integration | R-008 | 1 | QA | xUnit + `WebApplicationFactory<Program>` |
| TC-E1-P0-04 | AC-1.1.e — CORS from `localhost:5173` | API Integration | R-001 | 1 | QA | OPTIONS preflight + GET, assert `Access-Control-Allow-Origin` |
| TC-E1-P0-05 | AC-1.3.c — Problem Details RFC 7807 (NFR6) | API Integration | R-003 | 1 | QA | Trigger unhandled exception, assert no stack trace |

**Total P0:** 5 tests, **10.0 hours**.

### 3.2 P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (score 3–4) + Core user flows.

| ID | Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|----|-------------|-----------|-----------|------------|-------|-------|
| TC-E1-P1-01 | AC-E1.2 / FR28 — SPA navigation, no reload | Component (Vitest+RTL) | R-004 | 1 | DEV | Assert router navigation, not `window.location.href` |
| TC-E1-P1-02 | AC-E1.3 / FR30 — Deep link `/clientes` | E2E (Playwright) | R-004 | 1 | QA | Direct browser load, no redirect |
| TC-E1-P1-03 | AC-E1.3 / FR30 — Deep link `/contactos` | E2E (Playwright) | R-004 | 1 | QA | Direct browser load, no redirect |
| TC-E1-P1-04 | AC-1.2.e — 404 / not-found view | Component (Vitest+RTL) | R-004 | 1 | DEV | Unknown path renders NotFound, layout persists |
| TC-E1-P1-05 | AC-1.3.a/b — `siesa_agents_db` created + migrations folder | API Integration | R-005, R-006 | 1 | QA | `dotnet ef database update`, assert DB + `__ef_migrations_history` |
| TC-E1-P1-06 | AC-1.1.d — Clean Architecture solution builds | Unit / Build | R-009 | 1 | DEV | `dotnet build SiesaAgents.sln` exits 0 |

**Total P1:** 6 tests, **6.0 hours**.

### 3.3 P2 (Medium) — Run nightly / weekly

**Criteria:** Secondary features + Low risk (score 1–2) + Responsive / convention assertions.

| ID | Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|----|-------------|-----------|-----------|------------|-------|-------|
| TC-E1-P2-01 | AC-1.2.a — NavigationRail visible on desktop | Component (Vitest+RTL) | R-007 | 1 | DEV | Render at 1280px, assert NavigationRail present |
| TC-E1-P2-02 | AC-1.2.b / FR29 — NavigationBar visible on mobile | Component (Vitest+RTL) | R-007 | 1 | DEV | Render at 375px, assert NavigationBar present, Rail hidden |
| TC-E1-P2-03 | UX convenience — `/` redirects to `/clientes` | Component (Vitest+RTL) | — | 1 | DEV | Default landing convention |
| TC-E1-P2-04 | AC-1.3.d — `ApplySnakeCaseNaming()` applied | API Integration | R-005 | 1 | QA | Inspect `information_schema.columns` |

**Total P2:** 4 tests, **2.0 hours**.

### 3.4 P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Scaffolding sanity.

| ID | Requirement | Test Level | Test Count | Owner | Notes |
|----|-------------|-----------|------------|-------|-------|
| TC-E1-P3-01 | Frontend unit suite scaffolded | Unit (Vitest) | 1 | DEV | `npx vitest run` passes |
| TC-E1-P3-02 | Backend unit suite scaffolded | Unit (xUnit) | 1 | DEV | `dotnet test tests/SiesaAgents.UnitTests` passes |

**Total P3:** 2 tests, **0.5 hours**.

---

## 4. Detailed Test Cases (Reference)

Each test case below is owned by the corresponding story. The full step-level detail (preconditions, steps, expected results, automation hooks) is canonical for ATDD and implementation handoff.

> **Tip:** The story-level test design generated during the development loop (`sa-quick-dev` orchestrator) MUST cite these IDs (TC-E1-P0-01, …) to maintain traceability.

### P0

- **TC-E1-P0-01 — TypeScript Strict Build Passes**
  Level: Unit/Build · Story 1.1 · Risk R-002
  Steps: `npx tsc --noEmit` and `npm run build` from `frontend/`.
  Expected: both exit 0; `dist/` produced; zero TS errors.
  Automation: Vitest or shell test in CI pre-check.

- **TC-E1-P0-02 — Frontend Dev Server on 5173**
  Level: Unit/Smoke · Story 1.1 · Risk R-002
  Steps: `npm run dev`; once ready, `GET http://localhost:5173`.
  Expected: HTTP 200 with Vite entry HTML; no errors in stdout.
  Automation: Shell test or Playwright launch fixture.

- **TC-E1-P0-03 — Backend Boots & Scalar Loads**
  Level: API Integration · Story 1.1 · Risk R-008
  Steps: Spin up backend via `WebApplicationFactory<Program>`; `GET /scalar`.
  Expected: 200 OK with Scalar UI HTML; body does NOT contain `swagger-ui`.
  Automation: xUnit integration test.

- **TC-E1-P0-04 — CORS Allows `localhost:5173`**
  Level: API Integration · Story 1.1 · Risk R-001
  Steps: OPTIONS preflight with `Origin: http://localhost:5173` and `Access-Control-Request-Method: GET`; then GET with same `Origin`.
  Expected: OPTIONS 204 with `Access-Control-Allow-Origin: http://localhost:5173`; GET includes CORS header.
  Automation: xUnit `HttpClient`.

- **TC-E1-P0-05 — Problem Details RFC 7807 (NFR6)**
  Level: API Integration · Story 1.3 · Risk R-003
  Steps: Register test endpoint `GET /api/v1/test-error` (test config only) that throws; call it; inspect body.
  Expected: 500 (or mapped) status; `Content-Type: application/problem+json`; body has `{status, title, detail}`; NO `stackTrace`, `exception`, `innerException`.
  Automation: xUnit integration test.

### P1

- **TC-E1-P1-01 — SPA Navigation No Full Reload**
  Level: Component · Story 1.2 · FR28
  Steps: Render `<RouterProvider>`; click Clientes, then Contactos.
  Expected: URL changes; views render; `window.location.reload()` NOT called; shell layout persists.
  Automation: Vitest + RTL + TanStack Router test utils.

- **TC-E1-P1-02 — Deep Link `/clientes`**
  Level: E2E · Story 1.2 · FR30
  Steps: Open browser directly to `http://localhost:5173/clientes`.
  Expected: Clientes view renders; no redirect; no 404.
  Automation: Playwright.

- **TC-E1-P1-03 — Deep Link `/contactos`**
  Level: E2E · Story 1.2 · FR30
  Steps: Open browser directly to `http://localhost:5173/contactos`.
  Expected: Contactos view renders; no redirect.
  Automation: Playwright.

- **TC-E1-P1-04 — 404 / Not-Found View**
  Level: Component · Story 1.2
  Steps: Render router with `/ruta-que-no-existe`.
  Expected: NotFound component renders; navigation shell still visible.
  Automation: Vitest + RTL.

- **TC-E1-P1-05 — EF Core Migration Creates DB**
  Level: API Integration · Story 1.3 · Risks R-005, R-006
  Steps: `dotnet ef database update`; query `information_schema.tables`.
  Expected: `siesa_agents_db` created; `__ef_migrations_history` exists in snake_case; no domain tables present.
  Automation: xUnit + TestContainers (Postgres) or local test DB.

- **TC-E1-P1-06 — Solution Builds**
  Level: Unit/Build · Story 1.1 · Risk R-009
  Steps: `dotnet build SiesaAgents.sln`.
  Expected: All 4 projects build, exit code 0.
  Automation: CI build step.

### P2

- **TC-E1-P2-01 — NavigationRail @ Desktop (1280px)**
  Level: Component · Story 1.2 · AC-1.2.a
  Automation: Vitest + RTL with `jsdom` viewport.

- **TC-E1-P2-02 — NavigationBar @ Mobile (375px)**
  Level: Component · Story 1.2 · AC-1.2.b · FR29 · Risk R-007
  Automation: Vitest + RTL.

- **TC-E1-P2-03 — `/` Redirects to `/clientes`**
  Level: Component · Story 1.2
  Automation: Vitest + RTL.

- **TC-E1-P2-04 — snake_case Column Naming**
  Level: API Integration · Story 1.3 · AC-1.3.d · Risk R-005
  Steps: After migration, assert columns are lowercase snake_case (e.g., `migration_id`, `product_version`).
  Automation: xUnit query on `information_schema.columns`.

### P3

- **TC-E1-P3-01 — Vitest Unit Suite Passes** (Vitest)
- **TC-E1-P3-02 — xUnit Unit Suite Passes** (xUnit)

---

## 5. Execution Order

Order minimizes blocking due to environment / build dependencies.

### Phase 1 — Build Gate (no DB required) — Smoke (<5 min)

- TC-E1-P0-01 TypeScript strict build
- TC-E1-P0-02 Frontend dev server on 5173
- TC-E1-P1-06 Solution `dotnet build`

### Phase 2 — Backend API Gate (DB required) — P0 (<10 min)

- TC-E1-P0-03 Scalar loads
- TC-E1-P0-04 CORS preflight
- TC-E1-P0-05 Problem Details middleware

### Phase 3 — Database Gate — P1 (<15 min)

- TC-E1-P1-05 EF Core migration + DB created
- TC-E1-P2-04 snake_case column verification

### Phase 4 — Frontend Shell — P1/P2 (<30 min)

- TC-E1-P1-01 SPA navigation no reload
- TC-E1-P1-02 Deep link `/clientes`
- TC-E1-P1-03 Deep link `/contactos`
- TC-E1-P1-04 404 route
- TC-E1-P2-01 NavigationRail @ 1280px
- TC-E1-P2-02 NavigationBar @ 375px
- TC-E1-P2-03 `/` → `/clientes`

### Phase 5 — Unit Suites — P3 (<10 min)

- TC-E1-P3-01 Vitest
- TC-E1-P3-02 xUnit

---

## 6. Resource Estimates

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|-----------|-------------|-------|
| P0 | 5 | 2.0 | 10.0 | CORS, middleware, strict build — complex setup |
| P1 | 6 | 1.0 | 6.0 | Routing, DB migration, solution build |
| P2 | 4 | 0.5 | 2.0 | Viewport / convention assertions |
| P3 | 2 | 0.25 | 0.5 | Unit suite sanity |
| **Total** | **17** | — | **18.5** | **~2.3 days** |

### Prerequisites

**Test Data:**

- No domain entity factories required (no `clientes` / `contactos` tables yet).
- `WebApplicationFactory<Program>` test host for backend integration tests.
- Optional: TestContainers Postgres container for DB isolation in CI.

**Tooling:**

- Vitest 2+ with `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- Playwright 1.40+ (E2E deep linking).
- xUnit + `WebApplicationFactory<Program>` (in-process API testing).
- TestContainers (Postgres) — isolated DB for migration tests.
- MSW (frontend API mocking — placeholder for Epic 2+).

**Environment:**

- Node.js 20+ with npm.
- .NET 10 SDK.
- PostgreSQL 18+ on port 5432 with CREATE DATABASE privilege.
- All deps restored (`npm install`, `dotnet restore`).

---

## 7. Quality Gate Criteria

### Pass / Fail Thresholds

- **P0 pass rate:** **100%** — no exceptions (5/5 must pass).
- **P1 pass rate:** **100%** for this foundation epic — no partial pass acceptable.
- **P2 pass rate:** **≥90%** — informational; deferrals require justification.
- **P3 pass rate:** **≥90%** — informational.
- **High-risk mitigations (R-001, R-002, R-003):** **100% complete** before Epic 1 closure.

### Coverage Targets

- **Critical paths** (CORS, middleware, TS strict build): **100%**.
- **Security scenarios** (NFR6 — no stack trace exposure): **100%**.
- **Navigation shell** AC coverage by automated tests: **≥80%**.
- **Database wiring** AC coverage: **100%**.

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E1-P0-01 … TC-E1-P0-05).
- [ ] No high-risk items (R-001, R-002, R-003) unmitigated.
- [ ] Problem Details format verified — no stack-trace leakage (R-003).
- [ ] CORS preflight + actual request verified (R-001).
- [ ] TypeScript strict build exits 0 (R-002).

---

## 8. Mitigation Plans

### R-001 — CORS Misconfiguration (Score 9)

- **Strategy:** Configure named CORS policy in `Program.cs` allowing exactly `http://localhost:5173`; register BEFORE `MapEndpoints`. Add xUnit integration test for both preflight + actual request.
- **Owner:** Backend DEV + QA.
- **Timeline:** Story 1.1 closure.
- **Status:** Planned.
- **Verification:** TC-E1-P0-04 green; manual `curl -i -X OPTIONS` shows expected headers.

### R-002 — TypeScript Strict Compile (Score 6)

- **Strategy:** Enable `"strict": true` in `tsconfig.json`; add CI step `npx tsc --noEmit`; resolve all transitive type gaps explicitly (no `// @ts-ignore`).
- **Owner:** Frontend DEV.
- **Timeline:** Story 1.1 closure.
- **Status:** Planned.
- **Verification:** TC-E1-P0-01 green; CI build gate fails on TS errors.

### R-003 — Problem Details Middleware (Score 6)

- **Strategy:** Implement `ExceptionHandlingMiddleware`; register BEFORE endpoint mapping; return `application/problem+json` with `{status, title, detail}` only; never include exception/stack details. Add integration test that triggers throw and asserts shape.
- **Owner:** Backend DEV + QA.
- **Timeline:** Story 1.3 closure.
- **Status:** Planned.
- **Verification:** TC-E1-P0-05 green; manual review of `Program.cs` ordering.

---

## 9. Acceptance Criteria Coverage Matrix

| Epic / Story AC | Stories | Test Cases | Status |
|-----------------|---------|------------|--------|
| AC-E1.1 — Accessible navigation on desktop + mobile | 1.2 | TC-E1-P2-01, TC-E1-P2-02 | Covered |
| AC-E1.2 — SPA navigation without reload (FR28) | 1.2 | TC-E1-P1-01 | Covered |
| AC-E1.3 — Deep linking (FR30) | 1.2 | TC-E1-P1-02, TC-E1-P1-03 | Covered |
| AC-1.1.a — `npm run dev` on 5173 | 1.1 | TC-E1-P0-01, TC-E1-P0-02 | Covered |
| AC-1.1.b — TypeScript strict | 1.1 | TC-E1-P0-01 | Covered |
| AC-1.1.c — Backend on 5000 + Scalar | 1.1 | TC-E1-P0-03 | Covered |
| AC-1.1.d — Four CA projects in solution | 1.1 | TC-E1-P1-06 | Covered |
| AC-1.1.e — CORS from `localhost:5173` | 1.1 | TC-E1-P0-04 | Covered |
| AC-1.2.a — NavigationRail desktop | 1.2 | TC-E1-P2-01 | Covered |
| AC-1.2.b — NavigationBar mobile (FR29) | 1.2 | TC-E1-P2-02 | Covered |
| AC-1.2.c — SPA no reload (FR28) | 1.2 | TC-E1-P1-01 | Covered |
| AC-1.2.d — Deep linking (FR30) | 1.2 | TC-E1-P1-02, TC-E1-P1-03 | Covered |
| AC-1.2.e — 404 view | 1.2 | TC-E1-P1-04 | Covered |
| AC-1.3.a — `siesa_agents_db` created | 1.3 | TC-E1-P1-05 | Covered |
| AC-1.3.b — Migrations folder exists | 1.3 | TC-E1-P1-05 | Covered |
| AC-1.3.c — Problem Details RFC 7807 (NFR6) | 1.3 | TC-E1-P0-05 | Covered |
| AC-1.3.d — `ApplySnakeCaseNaming()` | 1.3 | TC-E1-P2-04 | Covered |

### NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR4 | HTTPS in non-local deployments | Out of scope — local dev only | N/A |
| NFR5 | Input validation / sanitization | No user input in Epic 1 — deferred to Epic 2+ | N/A |
| NFR6 | No stack trace exposure | TC-E1-P0-05 | API Integration |

---

## 10. Assumptions and Dependencies

### Assumptions

1. PostgreSQL 18+ is available locally on port 5432 with CREATE DATABASE privilege for the developer/CI user.
2. The team uses TanStack Router's catch-all (`splat`) route or equivalent for `/*` → NotFound; otherwise TC-E1-P1-04 must be adjusted.
3. The Scalar package version supported by .NET 10 is wired in `Program.cs` (`app.MapScalarApiReference()`), and Swagger middleware is intentionally absent (corporate standard).
4. `siesa-ui-kit` exposes both `NavigationRail` and `NavigationBar` components with documented breakpoints (lg: 1024px swap).
5. CI environment has Node.js 20+ and .NET 10 SDK.

### Dependencies

1. `siesa-ui-kit` published and installable — required by Story 1.2.
2. PostgreSQL local instance — required by Story 1.3 and tests TC-E1-P1-05, TC-E1-P2-04.
3. TanStack Router + Query packages installed (Story 1.1) — required for Story 1.2.
4. `WebApplicationFactory<Program>` enabled via internals-visible-to or `Program` partial — required by all API integration tests.

### Risks to Plan

- **Risk:** PostgreSQL version mismatch between dev machines and CI causes flaky migration tests.
  - **Impact:** Intermittent CI red on TC-E1-P1-05.
  - **Contingency:** Standardize on TestContainers Postgres image pinned to 18+; document in `tests/SiesaAgents.IntegrationTests/README.md`.
- **Risk:** `npm install` resolves a newer TypeScript transitively that introduces strict-mode regressions.
  - **Impact:** TC-E1-P0-01 fails on a fresh checkout.
  - **Contingency:** Pin `typescript` exact version in `package.json` and lock via `package-lock.json`.

---

## 11. Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests **after** Story 1.1 / 1.3 implementation starts (separate workflow; not auto-run by `*test-design`).
- Run `*automate` to extend coverage once implementation exists.
- Run `*nfr-assess` once the first domain endpoint is delivered (Epic 2 Story 2.1) — re-evaluate NFR5 once user input lands.

---

## 12. Notes for Story Implementation Agents

The following implementation constraints must be enforced so this test design passes:

1. `ExceptionHandlingMiddleware` MUST be registered BEFORE endpoint mapping in the `Program.cs` middleware pipeline.
2. `modelBuilder.ApplySnakeCaseNaming()` MUST be the LAST call inside `AppDbContext.OnModelCreating`.
3. `app.UseSwagger()` MUST NOT appear anywhere — use `app.MapScalarApiReference()` only.
4. CORS policy MUST explicitly allow `http://localhost:5173` as an origin (no wildcard for credentials).
5. TanStack Router MUST be configured with a catch-all `*` route pointing to a NotFound component.
6. The index route (`/`) MUST redirect to `/clientes` via TanStack Router's `redirect` / `<Navigate>` equivalent.
7. The viewport breakpoint for nav component swap is `lg: 1024px` — use Tailwind responsive classes, NOT JS media queries, where possible.
8. Story-level test design produced by `sa-quick-dev` MUST cite the IDs (TC-E1-P0-01 … TC-E1-P3-02) defined here for traceability.

---

## 13. Approval

**Test Design Approved By:**

- [ ] Product Manager: ______________  Date: ________
- [ ] Tech Lead: ______________  Date: ________
- [ ] QA Lead (TEA): SiesaTeam  Date: 2026-06-02

**Comments:**

Re-baselined on 2026-06-02 via `testarch-test-design` epic-level workflow as part of the `sa-quick-dev` orchestrator pre-loop. No structural changes vs. prior version (2026-05-20); recasting aligns with BMad v6 template (risk score, mitigations, gate criteria, traceability matrix). High-risk items unchanged: R-001 CORS, R-002 TS strict, R-003 Problem Details.

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
- Epic 1 source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
