# Test Design: Epic 1 - Project Foundation & Application Shell

**Date:** 2026-05-24
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Epic-level test design for Epic 1 — Project Foundation & Application Shell (Stories 1.1, 1.2, 1.3)

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (≥6): 3 (R1, R2, R3)
- Critical categories: TECH (build/toolchain), OPS (CORS/middleware ordering), DATA (EF Core snake_case)

**Coverage Summary:**

- P0 scenarios: 5 (10.0 hours)
- P1 scenarios: 6 (6.0 hours)
- P2/P3 scenarios: 6 (2.5 hours)
- **Total effort**: 18.5 hours (~2.3 days)

---

## Epic Context

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 1.1 | Project Initialization & Repository Structure | Dev environment, toolchain, CORS, TypeScript strict, Scalar |
| 1.2 | Frontend Navigation Shell | SPA routing, responsive nav (desktop/mobile), deep linking, 404 |
| 1.3 | Backend Database Foundation | EF Core/PostgreSQL wiring, migrations, snake_case naming, Problem Details middleware |

### Functional Requirements Covered

FR28 (SPA navigation without full page reloads), FR29 (mobile-responsive navigation), FR30 (deep linking via direct URL access).

### Non-Functional Requirements in Scope

NFR6 (no stack traces exposed to end users — Problem Details RFC 7807) is the only NFR with active test coverage in Epic 1. NFR4 (HTTPS) and NFR5 (input sanitization) are deferred to non-local deployments and Epics 2+ respectively.

### Out of Scope

- Domain entity tables (`clientes`, `contactos`) — created in Epics 2 and 3
- Authentication / authorization — explicitly deferred (MVP)
- HTTPS configuration — non-local deployments only (NFR4)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | OPS | CORS misconfiguration between frontend (port 5173) and backend (port 5000) silently blocks all API calls; error is invisible until runtime | 2 | 3 | 6 | Explicit integration test: verify OPTIONS preflight + actual GET request returns 200 from `http://localhost:5173` with correct `Access-Control-Allow-Origin` header | DEV | Sprint 1 |
| R-002 | TECH | TypeScript strict mode compilation failure on first run due to implicit `any`, missing types, or dependency type gaps | 2 | 3 | 6 | Build gate test: `npx tsc --noEmit` must exit code 0; `npm run build` must produce `dist/` without type errors | DEV | Sprint 1 |
| R-003 | OPS | ExceptionHandlingMiddleware missing, mis-ordered (registered after endpoint mapping), or incomplete — exposes raw stack traces to clients, violating NFR6 | 2 | 3 | 6 | Integration test: trigger unhandled exception via test endpoint; assert Problem Details RFC 7807 format with no `stackTrace`, `exception`, or `innerException` keys in response | DEV | Sprint 1 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-004 | TECH | TanStack Router deep-linking fails on direct URL access due to missing SPA fallback (`historyApiFallback` in Vite or server 404 redirect) | 2 | 2 | 4 | E2E test: navigate directly to `/clientes` and `/contactos` without prior navigation; assert correct view renders | DEV |
| R-005 | DATA | EF Core `ApplySnakeCaseNaming()` not applied or applied before other entity configurations, breaking future migrations | 1 | 3 | 3 | Integration test: verify `__ef_migrations_history` table uses snake_case column names (`migration_id`, `product_version`) | DEV |
| R-006 | OPS | PostgreSQL connection string missing or invalid in `appsettings.Development.json`, causing silent startup failure | 2 | 2 | 4 | Integration test: backend starts and returns 200 from a health/Scalar endpoint | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-007 | BUS | NavigationRail/NavigationBar from siesa-ui-kit renders incorrectly or fails to swap at responsive breakpoint (lg: 1024px) | 1 | 2 | 2 | Component test with viewport resize |
| R-008 | OPS | Scalar registration accidentally replaced by Swagger middleware, violating corporate standards | 1 | 1 | 1 | Smoke test: GET `/scalar` returns 200 |
| R-009 | TECH | Solution `.csproj` project references not correctly linked in `.sln`, causing build failures in CI | 1 | 2 | 2 | Build test: `dotnet build SiesaAgents.sln` exits 0 |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-1.1 TypeScript strict build passes | Unit/Build | R-002 | 2 | DEV | `tsc --noEmit` + `npm run build` |
| AC-1.1 CORS allows requests from localhost:5173 | API Integration | R-001 | 1 | QA | OPTIONS preflight + GET with Origin header |
| AC-1.1 Backend starts + Scalar loads at /scalar | API Integration | R-008 | 1 | QA | `WebApplicationFactory<Program>` |
| AC-1.3 Problem Details RFC 7807 on unhandled exception (NFR6) | API Integration | R-003 | 1 | QA | Assert no stackTrace key in response |

**Total P0**: 5 tests, 10.0 hours

#### Test Case Details

**TC-E1-P0-01: Frontend TypeScript Build Passes in Strict Mode**

- **Level:** Unit / Build | **Story:** 1.1 | **Risk:** R-002
- **Steps:** (1) Run `npx tsc --noEmit` from `frontend/`. (2) Run `npm run build`.
- **Expected:** `tsc --noEmit` exits code 0; `npm run build` produces `dist/` with zero TypeScript errors.
- **Automation:** CI build step / shell test.

**TC-E1-P0-02: Frontend Dev Server Starts on Port 5173**

- **Level:** Unit / Smoke | **Story:** 1.1 | **Risk:** R-002
- **Steps:** (1) Run `npm run dev` in `frontend/`. (2) GET `http://localhost:5173`.
- **Expected:** Process starts without errors; HTTP 200 with Vite HTML entry point.
- **Automation:** Shell test or Playwright launch fixture.

**TC-E1-P0-03: Backend Starts and Scalar Loads**

- **Level:** API Integration | **Story:** 1.1 | **Risk:** R-008
- **Steps:** (1) Start backend via `WebApplicationFactory<Program>`. (2) GET `/scalar`.
- **Expected:** HTTP 200 with Scalar UI HTML; no `swagger-ui` string in response body.
- **Automation:** xUnit integration test.

**TC-E1-P0-04: CORS Allows Requests from localhost:5173**

- **Level:** API Integration | **Story:** 1.1 | **Risk:** R-001
- **Steps:** (1) Send OPTIONS preflight with `Origin: http://localhost:5173`. (2) Send GET with same Origin.
- **Expected:** OPTIONS returns `Access-Control-Allow-Origin: http://localhost:5173`; GET includes CORS header; no 403.
- **Automation:** xUnit integration test with `HttpClient`.

**TC-E1-P0-05: ExceptionHandlingMiddleware Returns Problem Details RFC 7807**

- **Level:** API Integration | **Story:** 1.3 | **Risk:** R-003
- **Steps:** (1) Register test endpoint `GET /api/v1/test-error` that throws `new Exception("internal test")`. (2) Call endpoint. (3) Inspect response.
- **Expected:** HTTP 500; `Content-Type: application/problem+json`; response contains `status`, `title`, `detail`; does NOT contain `stackTrace`, `exception`, or `innerException`.
- **Automation:** xUnit integration test.

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E1.2 SPA navigation without full page reload (FR28) | Component | R-004 | 1 | DEV | TanStack Router navigation; assert no window.location.reload |
| AC-E1.3 Deep link /clientes renders correct view (FR30) | E2E | R-004 | 1 | QA | Playwright direct URL navigation |
| AC-E1.3 Deep link /contactos renders correct view (FR30) | E2E | R-004 | 1 | QA | Playwright direct URL navigation |
| AC-1.2 404 / not-found view on unknown route | Component | - | 1 | DEV | Router catch-all route renders gracefully |
| AC-1.3 EF Core migration creates DB and migrations table | API Integration | R-005, R-006 | 1 | QA | `siesa_agents_db` created; `__ef_migrations_history` exists |
| AC-1.1 Clean Architecture solution builds without errors | Unit/Build | R-009 | 1 | DEV | `dotnet build SiesaAgents.sln` exits 0 |

**Total P1**: 6 tests, 6.0 hours

#### Test Case Details

**TC-E1-P1-01: SPA Navigation — No Full Page Reload Between Routes**

- **Level:** Component (Vitest + RTL) | **Story:** 1.2 | **Risk:** R-004
- **Steps:** (1) Render `<RouterProvider>` with app shell. (2) Click "Clientes" nav item; assert URL is `/clientes`. (3) Click "Contactos"; assert URL is `/contactos`. (4) Verify `window.location.reload()` NOT called.
- **Expected:** Router navigation occurs without full page reload; shell layout persists across route changes.
- **Automation:** Vitest + RTL + TanStack Router test utilities.

**TC-E1-P1-02: Deep Linking — Direct URL Access to /clientes**

- **Level:** E2E (Playwright) | **Story:** 1.2 | **Risk:** R-004
- **Steps:** (1) Open browser directly to `http://localhost:5173/clientes` with no prior navigation. (2) Wait for render.
- **Expected:** Clientes view renders; no redirect to root; no 404 or blank page.
- **Automation:** Playwright E2E.

**TC-E1-P1-03: Deep Linking — Direct URL Access to /contactos**

- **Level:** E2E (Playwright) | **Story:** 1.2 | **Risk:** R-004
- **Steps:** (1) Open browser directly to `http://localhost:5173/contactos`. (2) Wait for render.
- **Expected:** Contactos view renders; no redirect or blank page.
- **Automation:** Playwright E2E.

**TC-E1-P1-04: 404 Route — Unknown URL Shows Not-Found View**

- **Level:** Component (Vitest + RTL) | **Story:** 1.2 | **Risk:** -
- **Steps:** (1) Render router with path set to `/ruta-que-no-existe`. (2) Assert not-found component is displayed.
- **Expected:** Not-found component renders; navigation shell is still visible; no JS error.
- **Automation:** Vitest + RTL.

**TC-E1-P1-05: EF Core Migration Creates Database and Migrations Table**

- **Level:** API Integration | **Story:** 1.3 | **Risk:** R-005, R-006
- **Steps:** (1) Run `dotnet ef database update`. (2) Query `information_schema.tables` in `siesa_agents_db`. (3) Verify `__ef_migrations_history` exists with snake_case columns. (4) Assert no `clientes` or `contactos` tables exist (scope note respected).
- **Expected:** `siesa_agents_db` created; `__ef_migrations_history` table present; no domain tables.
- **Automation:** xUnit integration test using TestContainers (Postgres) or local test DB.

**TC-E1-P1-06: Clean Architecture Solution Builds Without Errors**

- **Level:** Unit / Build | **Story:** 1.1 | **Risk:** R-009
- **Steps:** (1) Run `dotnet build SiesaAgents.sln` from `backend/`.
- **Expected:** All four projects build: API, Application, Domain, Infrastructure; zero errors; exit code 0.
- **Automation:** CI build step / shell test.

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E1.1 NavigationRail visible on desktop (≥1280px) | Component | R-007 | 1 | DEV | jsdom viewport 1280px |
| AC-E1.1 NavigationBar visible on mobile (375px) | Component | R-007 | 1 | DEV | jsdom viewport 375px; assert rail hidden |
| AC-1.2 Index route redirects to /clientes | Component | - | 1 | DEV | TanStack Router redirect |
| AC-1.3 snake_case column naming via ApplySnakeCaseNaming | API Integration | R-005 | 1 | QA | Query `information_schema.columns` |

**Total P2**: 4 tests, 2.0 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
| ----------- | ---------- | ---------- | ----- | ----- |
| Frontend unit test suite passes (Vitest) | Unit | 1 | DEV | `npx vitest run` from `frontend/` |
| Backend unit test suite passes (xUnit) | Unit | 1 | DEV | `dotnet test tests/SiesaAgents.UnitTests` |

**Total P3**: 2 tests, 0.5 hours

#### P2 Test Case Details

**TC-E1-P2-01: NavigationRail Visible on Desktop Viewport**

- **Level:** Component (Vitest + RTL) | **Story:** 1.2 | **Risk:** R-007
- **Steps:** (1) Render root layout at viewport 1280px. (2) Query for `NavigationRail` (siesa-ui-kit).
- **Expected:** NavigationRail in DOM with "Clientes" and "Contactos" entries.

**TC-E1-P2-02: NavigationBar Visible on Mobile Viewport**

- **Level:** Component (Vitest + RTL) | **Story:** 1.2 | **Risk:** R-007
- **Steps:** (1) Render root layout at viewport 375px. (2) Query for `NavigationBar` (siesa-ui-kit).
- **Expected:** NavigationBar visible; NavigationRail hidden/absent; all items tappable.

**TC-E1-P2-03: Index Route Redirects to /clientes**

- **Level:** Component (Vitest + RTL) | **Story:** 1.2
- **Steps:** (1) Render router with path `/`. (2) Assert redirect to `/clientes`.
- **Expected:** URL becomes `/clientes`; Clientes view content renders.

**TC-E1-P2-04: snake_case Column Naming Applied via ApplySnakeCaseNaming**

- **Level:** API Integration | **Story:** 1.3 | **Risk:** R-005
- **Steps:** (1) After `dotnet ef database update`, query `information_schema.columns` for `siesa_agents_db`. (2) Inspect `__ef_migrations_history` column names.
- **Expected:** Columns are `migration_id`, `product_version` (snake_case); no PascalCase column names.

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] TC-E1-P0-01: TypeScript strict build (`tsc --noEmit` exits 0) (1min)
- [ ] TC-E1-P0-02: Frontend dev server starts on port 5173 (30s)
- [ ] TC-E1-P1-06: `dotnet build SiesaAgents.sln` exits 0 (1min)

**Total**: 3 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] TC-E1-P0-03: Backend starts + Scalar loads (API Integration)
- [ ] TC-E1-P0-04: CORS preflight from localhost:5173 (API Integration)
- [ ] TC-E1-P0-05: Problem Details RFC 7807 on unhandled exception (API Integration)

**Total**: 3 scenarios (5 total with smoke)

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] TC-E1-P1-05: EF Core migration creates DB with snake_case (API Integration)
- [ ] TC-E1-P1-01: SPA navigation no full page reload (Component)
- [ ] TC-E1-P1-02: Deep link /clientes (E2E)
- [ ] TC-E1-P1-03: Deep link /contactos (E2E)
- [ ] TC-E1-P1-04: 404 route shows not-found view (Component)

**Total**: 5 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] TC-E1-P2-01: NavigationRail visible at 1280px desktop (Component)
- [ ] TC-E1-P2-02: NavigationBar visible at 375px mobile (Component)
- [ ] TC-E1-P2-03: Index route redirects to /clientes (Component)
- [ ] TC-E1-P2-04: snake_case column naming verification (API Integration)
- [ ] TC-E1-P3-01: Vitest unit test suite passes (Unit)
- [ ] TC-E1-P3-02: xUnit unit test suite passes (Unit)

**Total**: 6 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| -------- | ----- | ---------- | ----------- | ----- |
| P0 | 5 | 2.0 | 10.0 | CORS, middleware, strict build — complex setup |
| P1 | 6 | 1.0 | 6.0 | Standard coverage — routing, DB migration, build |
| P2 | 4 | 0.5 | 2.0 | Component viewport tests, snake_case validation |
| P3 | 2 | 0.25 | 0.5 | Unit suites (already scaffolded by implementation) |
| **Total** | **17** | **—** | **18.5 hours** | **~2.3 days** |

### Prerequisites

**Test Data:**

- No domain entity factories needed for Epic 1 (no domain tables created yet)
- `WebApplicationFactory<Program>` test host for backend integration tests
- Optional: TestContainers Postgres container for database isolation

**Tooling:**

- Vitest 2+ with `@testing-library/react` and `jsdom` — frontend unit/component tests
- Playwright 1.40+ — E2E deep-link verification (2 tests)
- xUnit 2+ with `WebApplicationFactory<Program>` — backend integration tests
- TestContainers (Postgres) — isolated database for migration integration tests

**Environment:**

- Node.js 20+ with npm — frontend build and test execution
- .NET 10 SDK — backend build and test execution
- PostgreSQL 18+ on port 5432 with `CREATE DATABASE` privilege
- All dependencies restored (`npm install`, `dotnet restore`)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — all 5 tests must pass)
- **P1 pass rate**: 100% for this epic (foundation layer; no partial pass acceptable for infrastructure stories)
- **P2/P3 pass rate**: ≥90% (informational — may be deferred with justification)
- **High-risk mitigations**: 100% complete for R-001, R-002, R-003 before Epic 1 closure

### Coverage Targets

- **Critical paths** (CORS, Problem Details middleware, TypeScript build): 100%
- **Security scenarios** (NFR6 — no stack trace exposure): 100%
- **Navigation shell** (AC-E1.1, AC-E1.2, AC-E1.3): ≥80% automated coverage
- **Database wiring** (AC-1.3): 100% automated coverage

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E1-P0-01 through TC-E1-P0-05)
- [ ] No high-risk items (R-001, R-002, R-003) unmitigated
- [ ] Problem Details format verified — no stack trace leakage (R-003)
- [ ] CORS preflight + actual request verified with correct origin (R-001)
- [ ] TypeScript strict build exits code 0 with zero type errors (R-002)

---

## Mitigation Plans

### R-001: CORS Misconfiguration (Score: 6)

**Mitigation Strategy:** Register an explicit CORS policy in `Program.cs` that allows `http://localhost:5173` as origin. Test with both OPTIONS preflight and an actual GET request using `HttpClient` in `WebApplicationFactory`. Verify `Access-Control-Allow-Origin` header is present and matches exactly.

**Owner:** DEV
**Timeline:** Story 1.1 implementation
**Status:** Planned
**Verification:** TC-E1-P0-04 passes with HTTP 200 and correct CORS headers.

### R-002: TypeScript Strict Mode Compilation Failure (Score: 6)

**Mitigation Strategy:** Enable `"strict": true` in `tsconfig.json` from project initialization. Run `npx tsc --noEmit` as a mandatory CI pre-check before any other tests. Enforce in `npm run build` script. Add `"skipLibCheck": false` to catch third-party type issues early.

**Owner:** DEV
**Timeline:** Story 1.1 implementation
**Status:** Planned
**Verification:** TC-E1-P0-01 and TC-E1-P0-02 both pass with exit code 0.

### R-003: ExceptionHandlingMiddleware Missing or Mis-ordered (Score: 6)

**Mitigation Strategy:** Register `ExceptionHandlingMiddleware` as the FIRST middleware in the pipeline in `Program.cs` (before `app.UseRouting()`, `app.MapControllers()`, and endpoint mapping). Write an integration test that deliberately triggers an unhandled exception and asserts the response body conforms to Problem Details RFC 7807 (contains `status`, `title`, `detail`; does NOT contain `stackTrace` or `exception` keys).

**Owner:** DEV
**Timeline:** Story 1.3 implementation
**Status:** Planned
**Verification:** TC-E1-P0-05 passes with correct Problem Details format and no stack trace exposure.

---

## Acceptance Criteria Coverage Matrix

| Epic/Story AC | Test Cases | Level | Status |
| ------------- | ---------- | ----- | ------ |
| AC-E1.1: App loads with accessible navigation on mobile and desktop | TC-E1-P2-01, TC-E1-P2-02 | Component | Covered |
| AC-E1.2: Navigate between Clientes/Contactos without full page reload | TC-E1-P1-01 | Component | Covered |
| AC-E1.3: Direct URL to /clientes and /contactos renders correct views | TC-E1-P1-02, TC-E1-P1-03 | E2E | Covered |
| AC-1.1.a: `npm run dev` starts on 5173 with no errors | TC-E1-P0-01, TC-E1-P0-02 | Unit/Build | Covered |
| AC-1.1.b: TypeScript strict mode enabled | TC-E1-P0-01 | Unit/Build | Covered |
| AC-1.1.c: Backend starts on 5000, Scalar loads at /scalar | TC-E1-P0-03 | API Integration | Covered |
| AC-1.1.d: Four CA projects referenced correctly in solution | TC-E1-P1-06 | Unit/Build | Covered |
| AC-1.1.e: CORS allows requests from localhost:5173 | TC-E1-P0-04 | API Integration | Covered |
| AC-1.2.a: NavigationRail on desktop with Clientes/Contactos entries | TC-E1-P2-01 | Component | Covered |
| AC-1.2.b: NavigationBar on mobile, items tappable (FR29) | TC-E1-P2-02 | Component | Covered |
| AC-1.2.c: SPA navigation (no full reload) | TC-E1-P1-01 | Component | Covered |
| AC-1.2.d: Deep linking via URL bar (FR30) | TC-E1-P1-02, TC-E1-P1-03 | E2E | Covered |
| AC-1.2.e: 404 / not-found view on unknown route | TC-E1-P1-04 | Component | Covered |
| AC-1.3.a: `siesa_agents_db` created with no errors | TC-E1-P1-05 | API Integration | Covered |
| AC-1.3.b: EF Core migrations folder exists | TC-E1-P1-05 | API Integration | Covered |
| AC-1.3.c: Problem Details RFC 7807 on unhandled exception (NFR6) | TC-E1-P0-05 | API Integration | Covered |
| AC-1.3.d: `ApplySnakeCaseNaming()` applied in `OnModelCreating` | TC-E1-P2-04 | API Integration | Covered |

---

## Assumptions and Dependencies

### Assumptions

1. PostgreSQL 18+ is available and running locally on port 5432 with `CREATE DATABASE` privilege during integration test execution.
2. siesa-ui-kit NavigationRail and NavigationBar components are installed and available; their exact component names match the design specification.
3. TanStack Router is configured in file-based mode; SPA fallback (Vite `historyApiFallback`) is enabled for development server to support deep linking.

### Dependencies

1. Story 1.1 implementation completed — Required before P0 build/server tests can run
2. Story 1.2 implementation completed — Required before navigation shell component and E2E tests can run
3. Story 1.3 implementation completed — Required before DB migration and Problem Details tests can run

### Risks to Plan

- **Risk**: TestContainers may not be available in CI environment
  - **Impact**: TC-E1-P1-05 and TC-E1-P2-04 may fail in CI
  - **Contingency**: Use a locally-seeded PostgreSQL service in CI (GitHub Actions `services.postgres`) instead of TestContainers

- **Risk**: siesa-ui-kit component names differ from architecture doc specification
  - **Impact**: TC-E1-P2-01 and TC-E1-P2-02 selectors fail
  - **Contingency**: Update test selectors to use `data-testid` attributes or accessible role queries after confirming actual component API

---

## Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. `ExceptionHandlingMiddleware` must be registered BEFORE endpoint mapping in `Program.cs` middleware pipeline.
2. `modelBuilder.ApplySnakeCaseNaming()` must be the LAST call inside `OnModelCreating`.
3. `app.UseSwagger()` must NOT appear anywhere — use `app.MapScalarApiReference()` only.
4. CORS policy must explicitly allow `http://localhost:5173` as origin.
5. TanStack Router must be configured with a catch-all `*` route pointing to a `NotFound` component.
6. The index route (`/`) must redirect to `/clientes` via TanStack Router's `redirect`.
7. Frontend viewport breakpoint for nav component swap is `lg: 1024px` — use Tailwind responsive classes, not JS media queries where possible.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests from TC-E1-P0-01 through TC-E1-P0-05 (separate workflow; not auto-run).
- Run `*automate` for broader coverage once Story 1.1, 1.2, and 1.3 implementation exists.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam Date: 2026-05-24
- [ ] Tech Lead: SiesaTeam Date: 2026-05-24
- [ ] QA Lead: SiesaTeam Date: 2026-05-24

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework (TECH/SEC/PERF/DATA/BUS/OPS)
- `probability-impact.md` - Risk scoring: Probability (1-3) × Impact (1-3) = Score
- `test-levels-framework.md` - E2E vs API vs Component vs Unit decision matrix
- `test-priorities-matrix.md` - P0-P3 prioritization criteria and time budgets

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD (Non-Functional Requirements): `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Story 1.1: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: Epic-Level (Phase 4)
