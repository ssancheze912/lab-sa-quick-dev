---
epic: 1
title: "Project Foundation & Application Shell"
mode: epic-level
phase: 4
createdAt: "2026-06-29"
stories:
  - "1.1 — Project Initialization & Repository Structure"
  - "1.2 — Frontend Navigation Shell"
  - "1.3 — Backend Database Foundation"
status: complete
---

# Test Design — Epic 1: Project Foundation & Application Shell

**Date:** 2026-06-29
**Author:** SiesaTeam
**Status:** Approved
**Workflow:** `_bmad/bmm/testarch/test-design` (Epic-Level, Phase 4)

---

## Executive Summary

**Scope:** Full test design for Epic 1 — Project Foundation & Application Shell

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (score ≥6): 3 (R1 CORS, R2 TypeScript build, R3 Problem Details middleware)
- Critical categories: TECH, OPS, SEC

**Coverage Summary:**

- P0 scenarios: 5 tests (10.0 hours)
- P1 scenarios: 6 tests (6.0 hours)
- P2 scenarios: 4 tests (2.0 hours)
- P3 scenarios: 2 tests (0.5 hours)
- **Total effort:** 18.5 hours (~2.3 days)

---

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 1 establishes the complete technical foundation for Siesa Agents: a Vite/React/TypeScript frontend (pnpm) and a .NET 10 Clean Architecture backend, both connected to a PostgreSQL database, with functional SPA navigation (NavigationRail/NavigationBar), responsive layout, deep-linking routes, and backend error-handling middleware conforming to Problem Details RFC 7807.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 1.1 | Project Initialization & Repository Structure | Dev environment, toolchain (pnpm), CORS, TypeScript strict, Scalar |
| 1.2 | Frontend Navigation Shell | SPA routing, responsive nav (desktop/mobile), deep linking, 404 |
| 1.3 | Backend Database Foundation | EF Core / PostgreSQL wiring, migrations, snake_case naming, Problem Details middleware |

### Out of Scope for This Epic

- Domain entity tables (`clientes`, `contactos`) — created in Epics 2 and 3
- Authentication / authorization — explicitly deferred (MVP)
- HTTPS configuration — non-local deployments only (NFR4)

---

## 2. Risk Assessment

### Risk Matrix

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | TECH | CORS misconfiguration between frontend (5173) and backend (5000) silently blocks all API calls | 2 | 3 | 6 | Explicit integration test: verify OPTIONS preflight + actual GET returns `Access-Control-Allow-Origin: http://localhost:5173` | DEV | Sprint 1 |
| R-002 | TECH | TypeScript strict mode breaks compilation on first run (implicit `any`, missing types) | 2 | 3 | 6 | Build test: `pnpm run build` exits code 0, `tsc --noEmit` zero errors | DEV | Sprint 1 |
| R-003 | SEC | `ExceptionHandlingMiddleware` missing or mis-ordered exposes raw stack traces to clients | 2 | 3 | 6 | Integration test: trigger unhandled exception, assert Problem Details RFC 7807 with no `stackTrace` key | DEV | Sprint 1 |
| R-004 | TECH | TanStack Router deep-linking fails on direct URL access due to missing SPA fallback | 2 | 2 | 4 | E2E/Component test: navigate directly to `/clientes` and `/contactos`, assert correct view | DEV | Sprint 1 |
| R-005 | DATA | EF Core `ApplySnakeCaseNaming()` not applied or applied before other configurations, breaking future migrations | 1 | 3 | 3 | Integration test: verify `siesa_agents_db` created, `__ef_migrations_history` in snake_case | DEV | Sprint 1 |
| R-006 | OPS | PostgreSQL connection string missing or wrong in `appsettings.Development.json`, causing startup failure | 2 | 2 | 4 | Integration test: backend health check endpoint responds 200 after `dotnet run` | DEV | Sprint 1 |
| R-007 | BUS | NavigationRail/NavigationBar from siesa-ui-kit renders incorrectly at responsive breakpoint (lg: 1024px) | 1 | 2 | 2 | Component test with viewport simulation: assert rail visible at 1280px, navbar at 375px | DEV | Sprint 1 |
| R-008 | OPS | Scalar registration accidentally replaced by Swagger middleware, violating corporate standards | 1 | 1 | 1 | Smoke test: GET `/scalar` returns 200, no `swagger-ui` string in response | DEV | Sprint 1 |
| R-009 | TECH | Solution project references (.csproj not correctly linked in .sln) cause build failures in CI | 1 | 2 | 2 | Build test: `dotnet build SiesaAgents.sln` exits 0 with all 4 CA projects | DEV | Sprint 1 |

### High-Priority Risks (Score ≥6) — Immediate Mitigation Required

**R-001: CORS Misconfiguration (Score: 6)**
**Mitigation Strategy:** Register CORS policy in `Program.cs` with `policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`. Apply `app.UseCors("DevCors")` before endpoint mappings. Covered by TC-E1-P0-04.
**Owner:** DEV
**Status:** Planned
**Verification:** OPTIONS preflight returns 204 with `Access-Control-Allow-Origin: http://localhost:5173`. GET returns same header.

**R-002: TypeScript Strict Mode Build Failure (Score: 6)**
**Mitigation Strategy:** Set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` in `tsconfig.app.json`. Run `pnpm run build` as smoke gate before any implementation proceeds. Covered by TC-E1-P0-01.
**Owner:** DEV
**Status:** Planned
**Verification:** `pnpm run build` exits code 0 and produces `dist/` folder. Zero TypeScript errors.

**R-003: Stack Trace Exposure via Middleware (Score: 6)**
**Mitigation Strategy:** `ExceptionHandlingMiddleware` registered BEFORE endpoint mapping in `Program.cs`. Returns `ProblemDetails` with `Detail = null` (never `ex.Message`). Covered by TC-E1-P0-05.
**Owner:** DEV
**Status:** Planned
**Verification:** 500 response body contains `status`, `title` fields and does NOT contain `stackTrace`, `exception`, `innerException`, or `message` from the exception.

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-004 | TECH | TanStack Router deep-linking failure on direct URL | 2 | 2 | 4 | Covered by TC-E1-P1-02, TC-E1-P1-03 | DEV |
| R-006 | OPS | PostgreSQL connection string missing | 2 | 2 | 4 | Covered by TC-E1-P1-05 | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-005 | DATA | ApplySnakeCaseNaming not applied correctly | 1 | 3 | 3 | Covered by TC-E1-P1-05, TC-E1-P2-04 | Monitor |
| R-007 | BUS | NavigationRail/Bar breakpoint rendering | 1 | 2 | 2 | Covered by TC-E1-P2-01, TC-E1-P2-02 | Monitor |
| R-008 | OPS | Swagger instead of Scalar | 1 | 1 | 1 | Covered by TC-E1-P0-03 | Monitor |
| R-009 | TECH | Solution .csproj references broken | 1 | 2 | 2 | Covered by TC-E1-P1-06 | Monitor |

### Top 3 Risk Areas for Epic 1

1. **CORS + API connectivity (R-001)** — frontend and backend on different ports; misconfiguration blocks the entire app and is invisible until runtime.
2. **Problem Details middleware (R-003)** — if `ExceptionHandlingMiddleware` is unregistered or ordered after terminal middleware, stack traces leak to end users, violating NFR6.
3. **TypeScript strict compilation (R-002)** — a single implicit `any` or missing type causes the entire build to fail, blocking all subsequent development.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 1 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌▌▌          2 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌▌    7 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌      6 tests
  Unit/Build (Vitest/shell) ▌▌▌▌▌▌             4 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                         19 tests
```

### Rationale

- **Epic 1 is infrastructure-heavy, not domain-heavy** — most value comes from integration and build validation, not unit tests.
- **E2E coverage is minimal** (2 tests) because there is no business logic to exercise end-to-end yet; the shell is verified via component tests which are faster and sufficient.
- **API integration tests dominate** because CORS, middleware ordering, database connectivity, and endpoint configuration are the primary risks.
- **Package manager is `pnpm`** — all frontend test commands use `pnpm run ...` or `pnpm exec ...` (not `npm`/`npx`).

---

## 4. Test Coverage Plan

### P0 (Critical) — Run on Every Commit

**Criteria**: Blocks core journey + High risk (score ≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| TypeScript strict build exits 0 (AC-1.1.b, AC-1.1.d-build) | Unit/Build | R-002 | 1 | DEV | `pnpm run build` gate |
| Frontend dev server starts on port 5173 (AC-1.1.a) | Unit/Smoke | R-002 | 1 | DEV | Process smoke check |
| Backend starts, Scalar loads at /scalar (AC-1.1.c) | API Integration | R-008 | 1 | DEV | WebApplicationFactory |
| CORS allows requests from localhost:5173 (AC-1.1.e) | API Integration | R-001 | 1 | DEV | OPTIONS + GET preflight |
| ExceptionHandlingMiddleware returns Problem Details RFC 7807 (AC-1.3.c, NFR6) | API Integration | R-003 | 1 | DEV | xUnit, verify no stackTrace |

**Total P0:** 5 tests, 10.0 hours

### P1 (High) — Run on PR to Main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| SPA navigation — no full page reload (AC-E1.2, FR28) | Component (Vitest+RTL) | R-004 | 1 | DEV | TanStack Router test utils |
| Deep linking `/clientes` direct URL (AC-E1.3, FR30) | E2E (Playwright) | R-004 | 1 | QA | Playwright browser |
| Deep linking `/contactos` direct URL (AC-E1.3, FR30) | E2E (Playwright) | R-004 | 1 | QA | Playwright browser |
| 404 route — unknown URL shows not-found view (AC-1.2.e) | Component (Vitest+RTL) | - | 1 | DEV | RTL render |
| EF Core migration creates `siesa_agents_db` + snake_case (AC-1.3.a, AC-1.3.b, R-005) | API Integration | R-005, R-006 | 1 | DEV | TestContainers/Postgres |
| Clean Architecture solution builds without errors (AC-1.1.d) | Unit/Build | R-009 | 1 | DEV | `dotnet build SiesaAgents.sln` |

**Total P1:** 6 tests, 6.0 hours

### P2 (Medium) — Run Nightly/Weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| NavigationRail visible on desktop viewport 1280px (AC-E1.1, AC-1.2.a) | Component (Vitest+RTL) | R-007 | 1 | DEV | jsdom viewport config |
| NavigationBar visible on mobile viewport 375px (AC-E1.1, AC-1.2.b, FR29) | Component (Vitest+RTL) | R-007 | 1 | DEV | jsdom viewport config |
| Index route `/` redirects to `/clientes` | Component (Vitest+RTL) | - | 1 | DEV | Router redirect assert |
| snake_case columns applied (`__ef_migrations_history`) (AC-1.3.d) | API Integration | R-005 | 1 | DEV | `information_schema.columns` |

**Total P2:** 4 tests, 2.0 hours

### P3 (Low) — Run On-Demand

**Criteria**: Nice-to-have + Exploratory + Test suite scaffolding

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| Frontend unit test suite passes (`pnpm exec vitest run`) | Unit | 1 | DEV | Vitest, coverage report |
| Backend unit test suite passes (`dotnet test`) | Unit | 1 | DEV | xUnit, SiesaAgents.UnitTests |

**Total P3:** 2 tests, 0.5 hours

---

## 5. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E1-P0-01: Frontend TypeScript Build Passes in Strict Mode

**Level:** Unit / Build
**Story:** 1.1
**Requirement:** AC-1.1 (TypeScript strict mode enabled)
**Risk covered:** R-002

**Precondition:** Frontend project initialized with `pnpm create vite@latest frontend -- --template react-ts`. `tsconfig.app.json` has `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`.

**Test Steps:**
1. Run `pnpm exec tsc --noEmit` from the `frontend/` directory.
2. Run `pnpm run build` and observe exit code.

**Expected Result:**
- `tsc --noEmit` exits with code 0 and zero errors.
- `pnpm run build` produces a `dist/` folder with no TypeScript compilation errors.

**Automation:** Shell script / CI build step — runs as pre-commit hook or first CI stage.

---

#### TC-E1-P0-02: Frontend Dev Server Starts on Port 5173

**Level:** Unit / Smoke
**Story:** 1.1
**Requirement:** AC-1.1 (`pnpm run dev` starts on port 5173 with no errors)
**Risk covered:** R-002

**Precondition:** All `pnpm install` dependencies installed.

**Test Steps:**
1. Run `pnpm run dev` in `frontend/`.
2. After server ready signal, perform GET request to `http://localhost:5173`.

**Expected Result:**
- Process starts without errors in stdout.
- HTTP 200 response with HTML containing Vite entry point.

**Automation:** Shell test or Playwright launch fixture.

---

#### TC-E1-P0-03: Backend Starts and Scalar Loads

**Level:** API Integration
**Story:** 1.1
**Requirement:** AC-1.1 (backend starts on port 5000, Scalar loads at `/scalar`)
**Risk covered:** R-008

**Precondition:** `dotnet run` in `src/SiesaAgents.API/`. PostgreSQL running locally.

**Test Steps:**
1. Start backend via `WebApplicationFactory<Program>`.
2. GET `/scalar`.

**Expected Result:**
- HTTP 200 with HTML containing Scalar UI.
- Response body does NOT contain string `swagger-ui`.
- `Content-Type` is `text/html`.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>`.

---

#### TC-E1-P0-04: CORS Allows Requests from localhost:5173

**Level:** API Integration
**Story:** 1.1
**Requirement:** AC-1.1 (CORS from localhost:5173 without errors)
**Risk covered:** R-001

**Precondition:** Backend running. CORS policy `"DevCors"` configured in `Program.cs` with `WithOrigins("http://localhost:5173")`.

**Test Steps:**
1. Send OPTIONS preflight to the backend with:
   - `Origin: http://localhost:5173`
   - `Access-Control-Request-Method: GET`
2. Send GET to any endpoint with `Origin: http://localhost:5173`.

**Expected Result:**
- OPTIONS returns 204 with `Access-Control-Allow-Origin: http://localhost:5173`.
- GET returns with `Access-Control-Allow-Origin: http://localhost:5173` header present.
- No 403 or missing CORS header.

**Automation:** xUnit integration test with `HttpClient`.

---

#### TC-E1-P0-05: ExceptionHandlingMiddleware Returns Problem Details RFC 7807

**Level:** API Integration
**Story:** 1.3
**Requirement:** AC-1.3 (Problem Details on unhandled exception, NFR6)
**Risk covered:** R-003

**Precondition:** Backend running. A test endpoint registered ONLY in test configuration that throws `new Exception("internal test")`.

**Test Steps:**
1. Register a minimal test endpoint `GET /api/v1/test-error` that throws `new Exception("internal test")`.
2. Call the endpoint via `WebApplicationFactory`.
3. Inspect response.

**Expected Result:**
- HTTP status: 500.
- `Content-Type: application/problem+json`.
- Response JSON contains `status`, `title` fields.
- Response JSON does NOT contain `stackTrace`, `exception`, `innerException`, or the raw exception message.
- `Detail` field is null or omitted.

**Automation:** xUnit integration test.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E1-P1-01: SPA Navigation — No Full Page Reload Between Routes

**Level:** Component (Vitest + RTL)
**Story:** 1.2
**Requirement:** AC-E1.2 (navigate between Clientes and Contactos without full page reloads), FR28

**Precondition:** TanStack Router configured with `/clientes` and `/contactos` routes. Root layout with NavigationRail rendered.

**Test Steps:**
1. Render `<RouterProvider>` wrapping the app shell.
2. Simulate user click on "Clientes" nav item.
3. Assert URL is `/clientes` and view content renders.
4. Simulate user click on "Contactos" nav item.
5. Assert URL is `/contactos` and view content renders.
6. Verify `window.location.reload` was NOT called.

**Expected Result:**
- TanStack Router navigation occurs (no `window.location.href` assignment).
- Both route views render without unmounting the shell layout.

**Automation:** Vitest + `@testing-library/react` + TanStack Router test utilities.

---

#### TC-E1-P1-02: Deep Linking — Direct URL Access to /clientes

**Level:** E2E (Playwright)
**Story:** 1.2
**Requirement:** AC-E1.3 (deep linking), FR30
**Risk covered:** R-004

**Precondition:** Frontend dev server running on port 5173.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes` (no prior navigation).
2. Wait for page to render.

**Expected Result:**
- The Clientes view is rendered (contains expected heading or route-specific content).
- No redirect to a home/root screen.
- No 404 or blank page.

**Automation:** Playwright E2E test.

---

#### TC-E1-P1-03: Deep Linking — Direct URL Access to /contactos

**Level:** E2E (Playwright)
**Story:** 1.2
**Requirement:** AC-E1.3 (deep linking), FR30
**Risk covered:** R-004

**Precondition:** Frontend dev server running on port 5173.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/contactos`.
2. Wait for page to render.

**Expected Result:**
- The Contactos view is rendered.
- No redirect or blank page.

**Automation:** Playwright E2E test.

---

#### TC-E1-P1-04: 404 Route — Unknown URL Shows Not-Found View

**Level:** Component (Vitest + RTL)
**Story:** 1.2
**Requirement:** AC-1.2 (404 / not-found view displayed gracefully)

**Test Steps:**
1. Render router with path set to `/ruta-que-no-existe`.
2. Assert a not-found component is displayed.

**Expected Result:**
- A not-found component renders (not a blank screen, not a JS error).
- Navigation shell is still visible (layout persists).

**Automation:** Vitest + RTL.

---

#### TC-E1-P1-05: EF Core Migration Creates Database and Migrations Table

**Level:** API Integration
**Story:** 1.3
**Requirement:** AC-1.3 (database created with no errors, migrations folder exists)
**Risk covered:** R-005, R-006

**Precondition:** PostgreSQL running locally. Connection string in `appsettings.Development.json` points to `siesa_agents_db`. No `siesa_agents_db` database exists.

**Test Steps:**
1. Run `dotnet ef database update` in `src/SiesaAgents.Infrastructure`.
2. Connect to PostgreSQL and query `information_schema.tables` in `siesa_agents_db`.

**Expected Result:**
- `siesa_agents_db` database created with no errors.
- `__ef_migrations_history` table exists (snake_case confirms `ApplySnakeCaseNaming()` is active).
- No domain tables exist yet (`clientes`, `contactos` absent — scope note respected).

**Automation:** xUnit integration test using `TestContainers` (Postgres) or local test database.

---

#### TC-E1-P1-06: Clean Architecture Solution Builds Without Errors

**Level:** Unit / Build
**Story:** 1.1
**Requirement:** AC-1.1 (four CA projects referenced correctly in solution)
**Risk covered:** R-009

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

**Level:** Component (Vitest + RTL)
**Story:** 1.2
**Requirement:** AC-E1.1, AC-1.2.a (NavigationRail visible on desktop, siesa-ui-kit)
**Risk covered:** R-007

**Test Steps:**
1. Render the root layout at viewport width 1280px.
2. Query for the `NavigationRail` component (siesa-ui-kit).

**Expected Result:**
- NavigationRail component is in the DOM and visible.
- Contains "Clientes" and "Contactos" navigation entries.

**Automation:** Vitest + RTL with `jsdom` viewport configuration.

---

#### TC-E1-P2-02: NavigationBar Visible on Mobile Viewport

**Level:** Component (Vitest + RTL)
**Story:** 1.2
**Requirement:** AC-E1.1, AC-1.2.b (mobile NavigationBar, FR29)
**Risk covered:** R-007

**Test Steps:**
1. Render the root layout at viewport width 375px.
2. Query for the `NavigationBar` component from siesa-ui-kit.

**Expected Result:**
- NavigationBar component is in the DOM and visible.
- NavigationRail is NOT rendered (or hidden/display:none).
- All navigation items are present and tappable (accessible).

**Automation:** Vitest + RTL.

---

#### TC-E1-P2-03: Index Route Redirects to /clientes

**Level:** Component (Vitest + RTL)
**Story:** 1.2

**Test Steps:**
1. Render router with path set to `/` (root index).
2. Assert redirect occurs to `/clientes`.

**Expected Result:**
- URL changes to `/clientes`.
- Clientes view content is rendered (not a blank page at `/`).

**Automation:** Vitest + RTL.

---

#### TC-E1-P2-04: snake_case Column Naming Applied via ApplySnakeCaseNaming

**Level:** API Integration
**Story:** 1.3
**Requirement:** AC-1.3 (snake_case convention applied)
**Risk covered:** R-005

**Test Steps:**
1. After running `dotnet ef database update`, inspect the SQL schema of `__ef_migrations_history`.
2. Verify column names are `migration_id`, `product_version` (snake_case).
3. Alternatively: confirm `AppDbContext.OnModelCreating` calls `modelBuilder.ApplySnakeCaseNaming()` as the last statement.

**Expected Result:**
- All EF-managed column names in the database are lowercase snake_case.
- No PascalCase column names exist (no `MigrationId` — must be `migration_id`).

**Automation:** xUnit integration test querying `information_schema.columns`.

---

### P3 — Nice to Have / Future Sprint

#### TC-E1-P3-01: Vitest Unit Tests Pass in Frontend

**Level:** Unit
**Story:** 1.1

**Test Steps:**
1. Run `pnpm exec vitest run` from `frontend/`.

**Expected Result:**
- All unit tests pass.
- Coverage report generated.

**Automation:** Vitest.

---

#### TC-E1-P3-02: xUnit Unit Tests Pass in Backend

**Level:** Unit
**Story:** 1.1

**Test Steps:**
1. Run `dotnet test tests/SiesaAgents.UnitTests` from `backend/`.

**Expected Result:**
- All unit tests pass.
- Zero test failures.

**Automation:** xUnit.

---

## 6. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E1.1: App loads with accessible navigation on mobile and desktop | 1.2 | TC-E1-P2-01, TC-E1-P2-02 | Covered |
| AC-E1.2: Navigate between Clientes/Contactos without full reload | 1.2 | TC-E1-P1-01 | Covered |
| AC-E1.3: Direct URL to /clientes and /contactos renders correct views | 1.2 | TC-E1-P1-02, TC-E1-P1-03 | Covered |
| AC-1.1.a: `pnpm run dev` starts on 5173 with no errors | 1.1 | TC-E1-P0-01, TC-E1-P0-02 | Covered |
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
  1. TC-E1-P0-01  TypeScript strict build (pnpm)
  2. TC-E1-P0-02  Frontend dev server on 5173
  3. TC-E1-P1-06  Solution build (dotnet)

Phase 2 — Backend API Gate (P0, DB needed)
  4. TC-E1-P0-03  Scalar loads at /scalar
  5. TC-E1-P0-04  CORS preflight + actual request
  6. TC-E1-P0-05  Problem Details middleware

Phase 3 — Database Gate (P1)
  7. TC-E1-P1-05  EF Core migration + snake_case table
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
 16. TC-E1-P3-01  Vitest unit tests (pnpm)
 17. TC-E1-P3-02  xUnit unit tests (dotnet)
```

### Smoke Tests (<5 min)

**Purpose:** Fast feedback — catch build-breaking issues before any other tests run.

- [ ] TC-E1-P0-01: TypeScript strict build exits 0 (30s)
- [ ] TC-E1-P0-02: Frontend dev server starts on 5173 (45s)
- [ ] TC-E1-P0-03: Scalar loads at /scalar (20s)

**Total:** 3 scenarios

### P0 Tests (<10 min)

**Purpose:** Critical path validation — block merge if any fail.

- [ ] TC-E1-P0-04: CORS preflight from localhost:5173 (API)
- [ ] TC-E1-P0-05: Problem Details no stackTrace (API)

**Total (combined with smoke):** 5 scenarios

### P1 Tests (<30 min)

**Purpose:** Important feature coverage — required for story completion.

- [ ] TC-E1-P1-01: SPA navigation no reload (Component)
- [ ] TC-E1-P1-02: Deep link /clientes (E2E)
- [ ] TC-E1-P1-03: Deep link /contactos (E2E)
- [ ] TC-E1-P1-04: 404 route graceful render (Component)
- [ ] TC-E1-P1-05: EF Core migration + siesa_agents_db (API)
- [ ] TC-E1-P1-06: dotnet build SiesaAgents.sln (Build)

**Total:** 6 scenarios

### P2/P3 Tests (<60 min)

**Purpose:** Full regression and scaffolding validation.

- [ ] TC-E1-P2-01: NavigationRail desktop (Component)
- [ ] TC-E1-P2-02: NavigationBar mobile (Component)
- [ ] TC-E1-P2-03: Index redirect to /clientes (Component)
- [ ] TC-E1-P2-04: snake_case columns (API)
- [ ] TC-E1-P3-01: Vitest run (Unit)
- [ ] TC-E1-P3-02: xUnit dotnet test (Unit)

**Total:** 6 scenarios

---

## 9. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.0 | 10.0 | CORS, middleware, strict build — complex setup |
| P1 | 6 | 1.0 | 6.0 | Standard coverage — routing, DB migration, build |
| P2 | 4 | 0.5 | 2.0 | Component viewport, snake_case validation |
| P3 | 2 | 0.25 | 0.5 | Unit test suites (scaffolded by impl) |
| **Total** | **17** | — | **18.5 hours** | **~2.3 days** |

### Prerequisites

**Test Data:**
- No domain entity factories needed for Epic 1 (no domain tables yet)
- `WebApplicationFactory<Program>` test host for backend integration tests
- `TestContainers` Postgres container for DB isolation (optional, recommended)

**Tooling:**

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| Playwright | E2E tests (deep linking) | Frontend/E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for migration tests | Backend |
| MSW | API mock for component tests | Frontend |

**Environment:**

```
- Node.js 20+ with pnpm (mandatory — NOT npm)
- .NET 10 SDK
- PostgreSQL 18+ running locally on default port 5432
- Database user with CREATE DATABASE privilege
- All pnpm dependencies installed (pnpm install)
- All NuGet packages restored (dotnet restore)
```

---

## 10. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions — 5 tests must all pass)
- **P1 pass rate:** 100% for this epic (foundation layer; no partial pass acceptable)
- **P2/P3 pass rate:** ≥90% (may be deferred with documented justification)
- **High-risk mitigations (R-001, R-002, R-003):** 100% complete before Epic 1 closure

### Coverage Targets

- **Critical paths (CORS, middleware, TypeScript build):** 100%
- **Security scenarios (NFR6 — no stack trace exposure):** 100%
- **Navigation shell:** ≥80% of AC covered by automated tests
- **Database wiring:** 100% of AC covered

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E1-P0-01 through TC-E1-P0-05)
- [ ] No high-risk items (R-001, R-002, R-003) unmitigated
- [ ] Problem Details format verified — no stack trace leakage (R-003)
- [ ] CORS preflight + actual request verified (R-001)
- [ ] TypeScript strict build exits 0 with `pnpm` (R-002)

---

## 11. Definition of Done for Epic 1

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E1-P0-01 through TC-E1-P0-05)
- [ ] All P1 test cases pass (TC-E1-P1-01 through TC-E1-P1-06)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] TypeScript build produces zero errors in strict mode (`pnpm run build`)
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
8. **Package manager is `pnpm`** — all `npm` or `npx` commands in this epic must be replaced with `pnpm` / `pnpm exec`.

---

## Assumptions and Dependencies

### Assumptions

1. PostgreSQL 18+ is available locally on port 5432 with `CREATE DATABASE` privilege.
2. Node.js 20+ and pnpm are installed on development and CI machines.
3. .NET 10 SDK and EF Core CLI (`dotnet ef`) are installed.
4. `siesa-ui-kit` npm package is accessible via private registry.

### Dependencies

1. siesa-ui-kit package registry access — Required before Story 1.1
2. PostgreSQL local instance — Required before Story 1.3
3. TanStack Router file-based routing generator — Required before Story 1.2

---

## Follow-on Workflows

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run by `*test-design`).
- Run `*automate` for broader coverage once implementation exists.
- Run `*trace` to generate traceability matrix at epic close.

---

## Appendix

### Related Documents

- Epic Source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Story 1.1: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`
- NFR Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design` (Epic-Level, Phase 4)
**Version:** 4.0 (BMad v6)
