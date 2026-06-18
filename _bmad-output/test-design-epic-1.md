---
epic: 1
title: "Project Foundation & Application Shell"
mode: epic-level
phase: 4
createdAt: "2026-06-18"
stories:
  - "1.1 — Project Initialization & Repository Structure"
  - "1.2 — Frontend Navigation Shell"
  - "1.3 — Backend Database Foundation"
status: complete
---

# Test Design: Epic 1 - Project Foundation & Application Shell

**Date:** 2026-06-18
**Author:** SiesaTeam
**Status:** Approved

---

## Executive Summary

**Scope:** Full test design for Epic 1

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (score ≥6): 3 (R1, R2, R3)
- Critical categories: TECH, OPS, SEC

**Coverage Summary:**

- P0 scenarios: 5 (10.0 hours)
- P1 scenarios: 6 (6.0 hours)
- P2/P3 scenarios: 6 (2.5 hours)
- **Total effort**: 18.5 hours (~2.3 days)

---

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 1 establishes the complete technical foundation for Siesa Agents: a Vite/React/TypeScript frontend and a .NET 10 Clean Architecture backend, both connected to a PostgreSQL database, with functional SPA navigation (NavigationRail/NavigationBar), responsive layout, deep-linking routes, and backend error-handling middleware conforming to Problem Details RFC 7807.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 1.1 | Project Initialization & Repository Structure | Dev environment, toolchain, CORS, TypeScript strict, Scalar |
| 1.2 | Frontend Navigation Shell | SPA routing, responsive nav (desktop/mobile), deep linking, 404 |
| 1.3 | Backend Database Foundation | EF Core / PostgreSQL wiring, migrations, snake_case naming, Problem Details middleware |

### Out of Scope for This Epic

- Domain entity tables (`clientes`, `contactos`) — created in Epics 2 and 3
- Authentication / authorization — explicitly deferred (MVP)
- HTTPS configuration — non-local deployments only (NFR4)

---

## 2. Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R1 | TECH | CORS misconfiguration between frontend (5173) and backend (5000) silently blocks all API calls | 3 | 3 | 9 | Explicit integration test: verify OPTIONS preflight + actual request returns 200 from `localhost:5173` | DEV | Sprint 1 |
| R2 | TECH | TypeScript strict mode breaks compilation on first run (implicit `any`, missing types) | 2 | 3 | 6 | Unit/build test: `npx tsc --noEmit` exits with code 0 | DEV | Sprint 1 |
| R3 | SEC | ExceptionHandlingMiddleware missing or mis-ordered exposes raw stack traces to clients | 2 | 3 | 6 | Integration test: trigger unhandled exception, assert Problem Details RFC 7807 format with no `stackTrace` key | DEV | Sprint 1 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R4 | TECH | TanStack Router deep-linking fails on direct URL access due to missing SPA fallback | 2 | 2 | 4 | E2E/Component test: navigate directly to `/clientes` and `/contactos`, assert correct view | DEV | Sprint 1 |
| R5 | DATA | EF Core `ApplySnakeCaseNaming()` not applied or applied out of order, breaking future migrations | 1 | 3 | 3 | Integration test: verify `siesa_agents_db` created, assert `__EFMigrationsHistory` uses snake_case | DEV | Sprint 1 |
| R6 | OPS | PostgreSQL connection string missing in `appsettings.Development.json`, causing silent startup failure | 2 | 2 | 4 | Integration test: `dotnet run` health check endpoint responds 200 | DEV | Sprint 1 |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R7 | BUS | NavigationRail/NavigationBar from siesa-ui-kit renders incorrectly at responsive breakpoint (lg: 1024px) | 1 | 2 | 2 | Component test with viewport resize | Monitor |
| R8 | OPS | Scalar registration accidentally replaced by Swagger middleware | 1 | 1 | 1 | Smoke test: GET `/scalar` returns 200 | Monitor |
| R9 | OPS | Solution project references (.csproj not correctly linked in .sln) cause CI build failures | 1 | 2 | 2 | Build test: `dotnet build SiesaAgents.sln` exits 0 | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

### Top 3 Risk Areas for Epic 1

1. **CORS + API connectivity** (R1, score 9) — frontend and backend on different ports; any misconfiguration blocks the entire app invisibly until runtime.
2. **Problem Details middleware** (R3, score 6) — if `ExceptionHandlingMiddleware` is unregistered or ordered after the terminal middleware, stack traces leak to end users, violating NFR6.
3. **TypeScript strict compilation** (R2, score 6) — a single implicit `any` or missing type causes the entire build to fail, blocking all subsequent development.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 1 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌▌▌         2 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌   7 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌     6 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌            4 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                        19 tests
```

### Rationale

- **Epic 1 is infrastructure-heavy, not domain-heavy** — most value comes from integration and build validation, not unit tests.
- **E2E coverage is minimal** (2 tests) because there is no business logic to exercise end-to-end yet; the shell is verified via component tests which are faster and sufficient.
- **API integration tests dominate** because CORS, middleware ordering, database connectivity, and endpoint configuration are the primary risks.

---

## 4. Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| TypeScript strict build passes (`tsc --noEmit` exits 0) | Unit/Build | R2 | 1 | DEV | CI pre-check |
| Frontend dev server starts on port 5173 | Unit/Smoke | R2 | 1 | DEV | Playwright launch fixture |
| Backend starts and Scalar loads at `/scalar` | API Integration | R8 | 1 | DEV | WebApplicationFactory |
| CORS allows requests from `localhost:5173` | API Integration | R1 | 1 | DEV | OPTIONS + GET with Origin header |
| ExceptionHandlingMiddleware returns Problem Details RFC 7807 | API Integration | R3 | 1 | DEV | xUnit + WebApplicationFactory |

**Total P0**: 5 tests, 10.0 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| SPA navigation — no full page reload between routes | Component | R4 | 1 | DEV | Vitest + RTL |
| Deep linking — direct URL access to `/clientes` | E2E | R4 | 1 | QA | Playwright |
| Deep linking — direct URL access to `/contactos` | E2E | R4 | 1 | QA | Playwright |
| 404 route — unknown URL shows not-found view | Component | - | 1 | DEV | Vitest + RTL |
| EF Core migration creates database and migrations table | API Integration | R5, R6 | 1 | DEV | xUnit + TestContainers |
| Clean Architecture solution builds without errors | Unit/Build | R9 | 1 | DEV | CI build step |

**Total P1**: 6 tests, 6.0 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| NavigationRail visible on desktop viewport (1280px) | Component | R7 | 1 | DEV | Vitest + RTL + jsdom |
| NavigationBar visible on mobile viewport (375px) | Component | R7 | 1 | DEV | Vitest + RTL |
| Index route (`/`) redirects to `/clientes` | Component | - | 1 | DEV | Vitest + RTL |
| snake_case column naming applied via ApplySnakeCaseNaming | API Integration | R5 | 1 | DEV | xUnit + DB schema query |

**Total P2**: 4 tests, 2.0 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| Vitest unit test suite passes in frontend | Unit | 1 | DEV | `npx vitest run` |
| xUnit unit tests pass in backend | Unit | 1 | DEV | `dotnet test SiesaAgents.UnitTests` |

**Total P3**: 2 tests, 0.5 hours

---

## 5. Detailed Test Cases

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E1-P0-01: Frontend TypeScript Build Passes in Strict Mode

**Level:** Unit / Build | **Story:** 1.1 | **Risk:** R2

**Precondition:** Frontend project initialized with `npm create vite@latest -- --template react-ts`, `tsconfig.json` has `"strict": true`.

**Test Steps:**
1. Run `npx tsc --noEmit` from the `frontend/` directory.
2. Run `npm run build` and observe exit code.

**Expected Result:**
- `tsc --noEmit` exits with code 0 and zero errors.
- `npm run build` produces a `dist/` folder with no TypeScript compilation errors.

**Automation:** Vitest/build script — runs as part of CI pre-check.

---

#### TC-E1-P0-02: Frontend Dev Server Starts on Port 5173

**Level:** Unit / Smoke | **Story:** 1.1 | **Risk:** R2

**Precondition:** All `npm install` dependencies are installed.

**Test Steps:**
1. Run `npm run dev` in `frontend/`.
2. After server is ready, perform GET request to `http://localhost:5173`.

**Expected Result:**
- Process starts without errors in stdout.
- HTTP 200 response with HTML content containing Vite entry point.

**Automation:** Shell test or Playwright launch fixture.

---

#### TC-E1-P0-03: Backend Starts and Scalar Loads

**Level:** API Integration | **Story:** 1.1 | **Risk:** R8

**Precondition:** `dotnet run` in `SiesaAgents.API/`. PostgreSQL running locally.

**Test Steps:**
1. Start backend.
2. GET `http://localhost:5000/scalar`.

**Expected Result:**
- HTTP 200 with HTML containing Scalar UI (not Swagger).
- No `swagger-ui` string present in response body.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>`.

---

#### TC-E1-P0-04: CORS Allows Requests from localhost:5173

**Level:** API Integration | **Story:** 1.1 | **Risk:** R1

**Precondition:** Backend running. CORS configured in `Program.cs`.

**Test Steps:**
1. Send OPTIONS preflight to `http://localhost:5000/api/v1/` with headers:
   - `Origin: http://localhost:5173`
   - `Access-Control-Request-Method: GET`
2. Send GET `http://localhost:5000/api/v1/` with `Origin: http://localhost:5173`.

**Expected Result:**
- OPTIONS returns 204 with `Access-Control-Allow-Origin: http://localhost:5173`.
- GET returns with `Access-Control-Allow-Origin` header present.
- No `403` or missing CORS header.

**Automation:** xUnit integration test with `HttpClient`.

---

#### TC-E1-P0-05: ExceptionHandlingMiddleware Returns Problem Details RFC 7807

**Level:** API Integration | **Story:** 1.3 | **Risk:** R3

**Precondition:** Backend running. A test endpoint that intentionally throws `Exception("test error")` exists or is registered only in test configuration.

**Test Steps:**
1. Register a test endpoint `GET /api/v1/test-error` that throws `new Exception("internal test")`.
2. Call the endpoint via `WebApplicationFactory`.
3. Inspect the response body.

**Expected Result:**
- HTTP status: 500.
- `Content-Type: application/problem+json`.
- Response JSON contains `status`, `title`, `detail` fields.
- Response JSON does NOT contain `stackTrace`, `exception`, or `innerException` keys.

**Automation:** xUnit integration test.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E1-P1-01: SPA Navigation — No Full Page Reload Between Routes

**Level:** Component | **Story:** 1.2 | **Risk:** R4

**Precondition:** TanStack Router configured with `/clientes` and `/contactos` routes. Root layout with NavigationRail rendered.

**Test Steps:**
1. Render `<RouterProvider>` wrapping the app shell.
2. Simulate user click on "Clientes" nav item.
3. Assert URL is `/clientes` and view content renders.
4. Simulate user click on "Contactos" nav item.
5. Assert URL is `/contactos` and view content renders.
6. Verify `window.location.reload()` was NOT called.

**Expected Result:**
- Router navigation occurs (no `window.location.href` assignment).
- Both route views render without unmounting the shell layout.

**Automation:** Vitest + `@testing-library/react` + `@tanstack/react-router` test utilities.

---

#### TC-E1-P1-02: Deep Linking — Direct URL Access to /clientes

**Level:** E2E (Playwright) | **Story:** 1.2 | **Risk:** R4

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes` (no prior navigation).
2. Wait for page to render.

**Expected Result:**
- The Clientes view is rendered.
- No redirect to a home/root screen.
- No 404 or blank page.

---

#### TC-E1-P1-03: Deep Linking — Direct URL Access to /contactos

**Level:** E2E (Playwright) | **Story:** 1.2 | **Risk:** R4

**Test Steps:**
1. Open browser directly to `http://localhost:5173/contactos`.
2. Wait for page to render.

**Expected Result:**
- The Contactos view is rendered.
- No redirect or blank page.

---

#### TC-E1-P1-04: 404 Route — Unknown URL Shows Not-Found View

**Level:** Component | **Story:** 1.2

**Test Steps:**
1. Render router with path set to `/ruta-que-no-existe`.
2. Assert a "not found" or 404 component is displayed.

**Expected Result:**
- A not-found component renders (not a blank screen, not a JS error).
- Navigation shell is still visible (layout persists).

**Automation:** Vitest + RTL.

---

#### TC-E1-P1-05: EF Core Migration Creates Database and Migrations Table

**Level:** API Integration | **Story:** 1.3 | **Risk:** R5, R6

**Precondition:** PostgreSQL running locally. No `siesa_agents_db` database exists.

**Test Steps:**
1. Run `dotnet ef database update` in `SiesaAgents.Infrastructure`.
2. Connect to PostgreSQL and query `information_schema.tables` in `siesa_agents_db`.

**Expected Result:**
- `siesa_agents_db` database created with no errors.
- `__ef_migrations_history` table exists (snake_case confirms `ApplySnakeCaseNaming()` is active).
- No domain tables exist yet (`clientes`, `contactos` absent).

**Automation:** xUnit integration test using TestContainers (Postgres) or local test database.

---

#### TC-E1-P1-06: Clean Architecture Solution Builds Without Errors

**Level:** Unit / Build | **Story:** 1.1 | **Risk:** R9

**Test Steps:**
1. Run `dotnet build SiesaAgents.sln` from the `backend/` directory.

**Expected Result:**
- All four projects build successfully: `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`.
- Zero errors, zero unresolved project references.
- `dotnet build` exits with code 0.

**Automation:** CI build step / shell test.

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E1-P2-01: NavigationRail Visible on Desktop Viewport

**Level:** Component | **Story:** 1.2 | **Risk:** R7

**Test Steps:**
1. Render the root layout at viewport width 1280px.
2. Query for the `NavigationRail` component (siesa-ui-kit).

**Expected Result:**
- NavigationRail component is in the DOM and visible.
- Contains "Clientes" and "Contactos" navigation entries.

---

#### TC-E1-P2-02: NavigationBar Visible on Mobile Viewport

**Level:** Component | **Story:** 1.2 | **Risk:** R7

**Test Steps:**
1. Render the root layout at viewport width 375px.
2. Query for the `NavigationBar` component from siesa-ui-kit.

**Expected Result:**
- NavigationBar component is in the DOM and visible.
- NavigationRail is NOT rendered (or hidden).
- All navigation items are present and tappable.

---

#### TC-E1-P2-03: Index Route Redirects to /clientes

**Level:** Component | **Story:** 1.2

**Test Steps:**
1. Render router with path set to `/` (root index).
2. Assert redirect occurs to `/clientes`.

**Expected Result:**
- URL changes to `/clientes`.
- Clientes view content is rendered (not a blank page at `/`).

---

#### TC-E1-P2-04: snake_case Column Naming Applied via ApplySnakeCaseNaming

**Level:** API Integration | **Story:** 1.3 | **Risk:** R5

**Test Steps:**
1. After running `dotnet ef database update`, inspect the SQL schema of `__ef_migrations_history`.
2. Verify column names are `migration_id`, `product_version` (snake_case).

**Expected Result:**
- All EF-managed column names in the database are lowercase snake_case.
- No PascalCase column names (e.g., no `MigrationId` — must be `migration_id`).

**Automation:** xUnit integration test querying `information_schema.columns`.

---

### P3 — Nice to Have / Future Sprint

#### TC-E1-P3-01: Vitest Unit Tests Pass in Frontend

**Level:** Unit | **Story:** 1.1

**Test Steps:** Run `npx vitest run` from `frontend/`.

**Expected Result:** All unit tests pass, coverage report generated.

---

#### TC-E1-P3-02: xUnit Unit Tests Pass in Backend

**Level:** Unit | **Story:** 1.1

**Test Steps:** Run `dotnet test tests/SiesaAgents.UnitTests` from `backend/`.

**Expected Result:** All unit tests pass, zero test failures.

---

## 6. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E1.1: App loads with accessible navigation on mobile and desktop | 1.2 | TC-E1-P2-01, TC-E1-P2-02 | Covered |
| AC-E1.2: Navigate between Clientes/Contactos without full reload | 1.2 | TC-E1-P1-01 | Covered |
| AC-E1.3: Direct URL to /clientes and /contactos renders correct views | 1.2 | TC-E1-P1-02, TC-E1-P1-03 | Covered |
| AC-1.1.a: `npm run dev` starts on 5173 with no errors | 1.1 | TC-E1-P0-01, TC-E1-P0-02 | Covered |
| AC-1.1.b: TypeScript strict mode enabled | 1.1 | TC-E1-P0-01 | Covered |
| AC-1.1.c: Backend starts on 5000, Scalar loads at /scalar | 1.1 | TC-E1-P0-03 | Covered |
| AC-1.1.d: Four CA projects referenced correctly | 1.1 | TC-E1-P1-06 | Covered |
| AC-1.1.e: CORS allows requests from localhost:5173 | 1.1 | TC-E1-P0-04 | Covered |
| AC-1.2.a: NavigationRail on desktop with Clientes/Contactos entries | 1.2 | TC-E1-P2-01 | Covered |
| AC-1.2.b: NavigationBar on mobile, items tappable | 1.2 | TC-E1-P2-02 | Covered |
| AC-1.2.c: SPA navigation (no full reload) | 1.2 | TC-E1-P1-01 | Covered |
| AC-1.2.d: Deep linking via URL bar | 1.2 | TC-E1-P1-02, TC-E1-P1-03 | Covered |
| AC-1.2.e: 404 / not-found view on unknown route | 1.2 | TC-E1-P1-04 | Covered |
| AC-1.3.a: `siesa_agents_db` created with no errors | 1.3 | TC-E1-P1-05 | Covered |
| AC-1.3.b: EF Core migrations folder exists | 1.3 | TC-E1-P1-05 | Covered |
| AC-1.3.c: Problem Details RFC 7807 on unhandled exception (NFR6) | 1.3 | TC-E1-P0-05 | Covered |
| AC-1.3.d: `ApplySnakeCaseNaming()` applied | 1.3 | TC-E1-P2-04 | Covered |

---

## 7. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR4 | HTTPS in non-local deployments | Out of scope for Epic 1 (local dev only) | N/A |
| NFR5 | Input validation / sanitization | No user input in Epic 1 — deferred to Epic 2+ | N/A |
| NFR6 | No stack traces exposed | TC-E1-P0-05 | API Integration |

---

## 8. Execution Order

The following execution order minimizes blocked tests due to environment dependencies:

```
Phase 1 — Build Gate (P0, no DB needed)
  1. TC-E1-P0-01  TypeScript strict build
  2. TC-E1-P0-02  Frontend dev server on 5173
  3. TC-E1-P1-06  Solution build (dotnet)

Phase 2 — Backend API Gate (P0, DB needed)
  4. TC-E1-P0-03  Scalar loads
  5. TC-E1-P0-04  CORS preflight
  6. TC-E1-P0-05  Problem Details middleware

Phase 3 — Database Gate (P1)
  7. TC-E1-P1-05  EF Core migration + snake_case
  8. TC-E1-P2-04  snake_case column verification

Phase 4 — Frontend Shell Tests (P1-P2)
  9. TC-E1-P1-01  SPA navigation no reload
 10. TC-E1-P1-02  Deep link /clientes
 11. TC-E1-P1-03  Deep link /contactos
 12. TC-E1-P1-04  404 route
 13. TC-E1-P2-01  NavigationRail desktop
 14. TC-E1-P2-02  NavigationBar mobile
 15. TC-E1-P2-03  Index redirect to /clientes

Phase 5 — Unit Test Suites (P3)
 16. TC-E1-P3-01  Vitest unit tests
 17. TC-E1-P3-02  xUnit unit tests
```

---

## 9. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.0 | 10.0 | CORS, middleware, strict build — complex setup |
| P1 | 6 | 1.0 | 6.0 | Standard coverage — routing, DB migration, build |
| P2 | 4 | 0.5 | 2.0 | Component viewport, snake_case validation |
| P3 | 2 | 0.25 | 0.5 | Unit test suites (already scaffolded by impl) |
| **Total** | **17** | — | **18.5 hours** | **~2.3 days** |

### Prerequisites

**Test Data:**
- No domain entity factories needed for Epic 1 (no domain tables yet)
- `WebApplicationFactory<Program>` test host for backend integration tests
- Optional: `TestContainers` Postgres container for DB isolation

**Tooling:**
- Vitest 2+ with `@testing-library/react` and `jsdom` — frontend unit/component tests
- Playwright 1.40+ — E2E deep-link verification
- xUnit 2+ with `WebApplicationFactory<Program>` — backend integration tests
- TestContainers (Postgres) — isolated database for migration tests

**Environment:**
- Node.js 20+, npm — frontend build/test
- .NET 10 SDK — backend build/test
- PostgreSQL 18+ on port 5432 with CREATE DATABASE privilege
- All dependencies restored (`npm install`, `dotnet restore`)

---

## 10. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — 5 tests must all pass)
- **P1 pass rate**: 100% for this epic (foundation layer; no partial pass acceptable)
- **P2/P3 pass rate**: ≥90% (informational — may be deferred with justification)
- **High-risk mitigations** (R1, R2, R3): 100% complete before Epic 1 closure

### Coverage Targets

- **Critical paths** (CORS, middleware, TypeScript build): 100%
- **Security scenarios** (NFR6 — no stack trace exposure): 100%
- **Navigation shell**: ≥80% of AC covered by automated tests
- **Database wiring**: 100% of AC covered

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E1-P0-01 through TC-E1-P0-05)
- [ ] No high-risk items (R1, R2, R3) unmitigated
- [ ] Problem Details format verified — no stack trace leakage (R3)
- [ ] CORS preflight + actual request verified (R1)
- [ ] TypeScript strict build exits 0 (R2)

---

## 11. Definition of Done for Epic 1

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E1-P0-01 through TC-E1-P0-05)
- [ ] All P1 test cases pass (TC-E1-P1-01 through TC-E1-P1-06)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] TypeScript build produces zero errors in strict mode
- [ ] `dotnet build` and `dotnet test` pass with zero failures
- [ ] CORS, middleware ordering, and Problem Details format manually verified in development environment

---

## 12. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. `ExceptionHandlingMiddleware` must be registered BEFORE endpoint mapping in `Program.cs` middleware pipeline.
2. `modelBuilder.ApplySnakeCaseNaming()` must be the LAST call inside `OnModelCreating`.
3. `app.UseSwagger()` must NOT appear anywhere — use `app.MapScalarApiReference()` only.
4. CORS policy must explicitly allow `http://localhost:5173` as origin.
5. TanStack Router must be configured with a catch-all `*` route pointing to a NotFound component.
6. The index route (`/`) must redirect to `/clientes` via TanStack Router's `redirect`.
7. Frontend viewport breakpoint for nav component swap is `lg: 1024px` — use Tailwind responsive classes, not JS media queries, where possible.

---

## Mitigation Plans

### R1: CORS Misconfiguration (Score: 9)

**Mitigation Strategy:** Add `app.UseCors()` with explicit `WithOrigins("http://localhost:5173")` in `Program.cs`. Validate with TC-E1-P0-04 before any frontend-backend integration work.
**Owner:** DEV
**Timeline:** Sprint 1, Story 1.1
**Status:** Planned
**Verification:** TC-E1-P0-04 passes (OPTIONS + GET with Origin header returns correct CORS headers)

### R2: TypeScript Strict Mode Failure (Score: 6)

**Mitigation Strategy:** Configure `tsconfig.json` with `"strict": true` from project init. Add `tsc --noEmit` as a pre-commit hook and CI step.
**Owner:** DEV
**Timeline:** Sprint 1, Story 1.1
**Status:** Planned
**Verification:** TC-E1-P0-01 passes (`tsc --noEmit` exits 0)

### R3: Stack Trace Exposure via Missing Middleware (Score: 6)

**Mitigation Strategy:** Register `ExceptionHandlingMiddleware` as the FIRST middleware in `Program.cs`. Use xUnit integration test to verify no `stackTrace` field in error responses.
**Owner:** DEV
**Timeline:** Sprint 1, Story 1.3
**Status:** Planned
**Verification:** TC-E1-P0-05 passes (Problem Details returned, no stack trace in body)

---

## Assumptions and Dependencies

### Assumptions

1. PostgreSQL 18+ is available locally on port 5432 during development and CI.
2. `siesa-ui-kit` NavigationRail and NavigationBar components are available as npm package.
3. TanStack Router file-based routing is configured — `routeTree.gen.ts` is auto-generated.

### Dependencies

1. PostgreSQL local instance — Required for Story 1.3 database tests
2. siesa-ui-kit npm package — Required for Story 1.2 navigation component tests
3. .NET 10 SDK — Required for all backend tests

---

## Appendix

### Tooling Summary

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| Playwright | E2E tests (deep linking) | Frontend/E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for integration tests | Backend |
| MSW | API mock for component tests | Frontend |

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd/index.md`
- Epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: Epic-Level (Phase 4)
