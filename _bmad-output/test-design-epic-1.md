---
epic: 1
title: "Project Foundation & Application Shell"
mode: epic-level
phase: 4
workflow: testarch-test-design
createdAt: "2026-06-08"
stories:
  - "1.1 — Project Initialization & Repository Structure"
  - "1.2 — Frontend Navigation Shell"
  - "1.3 — Backend Database Foundation"
status: complete
---

# Test Design: Epic 1 — Project Foundation & Application Shell

**Date:** 2026-06-08
**Author:** SiesaTeam
**Status:** Approved

---

## Executive Summary

**Scope:** Full test design for Epic 1 — Project Foundation & Application Shell (3 stories, greenfield).

Epic 1 establishes the complete technical foundation for Siesa Agents: a Vite/React/TypeScript frontend and a .NET 10 Clean Architecture backend, both connected to a PostgreSQL database, with functional SPA navigation (NavigationRail/NavigationBar), responsive layout, deep-linking routes, and backend error-handling middleware conforming to Problem Details RFC 7807.

This epic is infrastructure-heavy, not domain-heavy. The primary risks are integration and configuration failures rather than business logic errors.

**Stories in Scope:**

| Story | Title | Key Concerns |
|-------|-------|--------------|
| 1.1 | Project Initialization & Repository Structure | Dev environment, TypeScript strict, CORS, Scalar, Clean Architecture wiring |
| 1.2 | Frontend Navigation Shell | SPA routing, responsive nav (desktop/mobile), deep linking, 404 handling |
| 1.3 | Backend Database Foundation | EF Core + PostgreSQL, migrations, snake_case naming, Problem Details middleware |

**Out of Scope for Epic 1:**
- Domain entity tables (`clientes`, `contactos`) — created in Epics 2 and 3
- Authentication / authorization — explicitly deferred (MVP)
- HTTPS configuration — non-local deployments only (NFR4)
- Input validation of domain data — no user input in Epic 1 (NFR5 deferred to Epic 2+)

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (score ≥6): 3 (R1, R2, R3)
- Critical categories: TECH, SEC, OPS

**Coverage Summary:**

- P0 scenarios: 5 (10.0 hours)
- P1 scenarios: 6 (6.0 hours)
- P2 scenarios: 4 (2.0 hours)
- P3 scenarios: 2 (0.5 hours)
- **Total effort:** 18.5 hours (~2.3 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R1 | TECH | CORS misconfiguration between frontend (port 5173) and backend (port 5000) silently blocks all API calls — invisible at build time, only fails at runtime | 2 (Possible) | 3 (Critical) | 6 | Integration test: verify OPTIONS preflight + actual GET from `http://localhost:5173` origin returns `Access-Control-Allow-Origin` header correctly | DEV | Sprint 1 |
| R2 | TECH | TypeScript strict mode breaks compilation on first run — implicit `any`, missing types in third-party dependencies cause build failure, blocking all subsequent development | 2 (Possible) | 3 (Critical) | 6 | Build test: `npx tsc --noEmit` exits with code 0; `npm run build` produces dist/ with zero TS errors | DEV | Sprint 1 |
| R3 | SEC | `ExceptionHandlingMiddleware` missing, mis-ordered, or not registered in Program.cs pipeline — allows raw stack traces and C# exception details to reach end users, violating NFR6 | 2 (Possible) | 3 (Critical) | 6 | Integration test: trigger unhandled exception via test endpoint, assert response is Problem Details RFC 7807 format with no `stackTrace`, `exception`, or `innerException` keys | DEV | Sprint 1 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R4 | TECH | TanStack Router deep-linking fails on direct URL access — SPA 404 issue when dev server is not configured to fall back to `index.html` for unknown paths | 2 (Possible) | 2 (Degraded) | 4 | E2E test: navigate browser directly to `/clientes` and `/contactos` without prior SPA navigation; assert correct view renders without redirect | DEV/QA |
| R5 | DATA | EF Core `ApplySnakeCaseNaming()` not applied or applied before other model configurations — breaks snake_case convention for all future migrations in Epics 2+ | 1 (Unlikely) | 3 (Critical) | 3 | Integration test: verify `__ef_migrations_history` table uses snake_case columns (`migration_id`, `product_version`), confirming `ApplySnakeCaseNaming()` is the last call in `OnModelCreating` | DEV |
| R6 | OPS | PostgreSQL connection string missing or incorrect in `appsettings.Development.json` — causes backend startup failure or silent connection errors that block database-dependent tests | 2 (Possible) | 2 (Degraded) | 4 | Integration test: verify backend starts and responds 200 from a health or Scalar endpoint with PostgreSQL running | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R7 | BUS | NavigationRail/NavigationBar from siesa-ui-kit renders incorrectly at the responsive breakpoint (lg: 1024px) — users see wrong nav component on certain viewports | 1 (Unlikely) | 2 (Degraded) | 2 | Component test with viewport resize: assert correct component at 1280px (desktop) and 375px (mobile) | Monitor |
| R8 | OPS | Scalar registration accidentally replaced by Swagger middleware, violating corporate standards (`app.UseSwagger()` anti-pattern) | 1 (Unlikely) | 1 (Minor) | 1 | Smoke test: GET `/scalar` returns 200 with Scalar HTML (no `swagger-ui` string) | Monitor |
| R9 | OPS | Solution project references (.csproj not correctly linked in .sln) cause build failures in CI, despite local builds succeeding | 1 (Unlikely) | 2 (Degraded) | 2 | Build test: `dotnet build SiesaAgents.sln` exits 0 with all four CA projects built successfully | Monitor |

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
| AC-1.1: TypeScript strict mode — `tsc --noEmit` exits 0 | Unit/Build | R2 | 1 | DEV | Run as CI pre-check; catches implicit `any` and missing type declarations |
| AC-1.1: Frontend dev server starts on port 5173 without errors | Unit/Smoke | R2 | 1 | DEV | Shell test or Playwright launch fixture; verifies Vite config and dependency resolution |
| AC-1.1: Backend starts on port 5000; Scalar loads at `/scalar` | API Integration | R8 | 1 | DEV | `WebApplicationFactory<Program>`; asserts 200 with Scalar HTML, no Swagger string |
| AC-1.1: CORS allows requests from `localhost:5173` | API Integration | R1 | 1 | DEV | OPTIONS preflight + GET with Origin header; asserts `Access-Control-Allow-Origin` present |
| AC-1.3: ExceptionHandlingMiddleware returns Problem Details RFC 7807 | API Integration | R3 | 1 | QA | Test endpoint throws; assert `status`, `title`, `detail` present; `stackTrace` absent |

**Total P0:** 5 tests, 10.0 hours

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-E1.2: Navigate between Clientes/Contactos without full page reload (FR28) | Component (Vitest+RTL) | R4 | 1 | DEV | `RouterProvider` + RTL; verify `useNavigate()` used, no `window.location.reload()` |
| AC-E1.3: Direct URL `/clientes` renders Clientes view (FR30) | E2E (Playwright) | R4 | 1 | QA | Open browser to path directly; assert correct view, no redirect |
| AC-E1.3: Direct URL `/contactos` renders Contactos view (FR30) | E2E (Playwright) | R4 | 1 | QA | Open browser to path directly; assert correct view, no redirect |
| AC-1.2: Unknown route renders 404/not-found view gracefully | Component (Vitest+RTL) | — | 1 | DEV | Render router with unknown path; assert not-found component; shell layout still visible |
| AC-1.3: `dotnet ef database update` creates `siesa_agents_db` with no errors | API Integration | R5, R6 | 1 | DEV | TestContainers Postgres; assert DB created; `__ef_migrations_history` exists in snake_case; no `clientes`/`contactos` tables |
| AC-1.1: `dotnet build SiesaAgents.sln` exits 0 — all 4 CA projects build | Unit/Build | R9 | 1 | DEV | CI build step; assert all four projects compile: API, Application, Domain, Infrastructure |

**Total P1:** 6 tests, 6.0 hours

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-E1.1: NavigationRail visible on desktop (1280px viewport) | Component (Vitest+RTL) | R7 | 1 | DEV | jsdom viewport config; assert `NavigationRail` in DOM with "Clientes" and "Contactos" entries |
| AC-E1.1: NavigationBar visible on mobile (375px viewport), NavigationRail hidden (FR29) | Component (Vitest+RTL) | R7 | 1 | DEV | jsdom viewport config; assert `NavigationBar` rendered, `NavigationRail` absent or hidden |
| AC-1.2 (implied): Index route `/` redirects to `/clientes` | Component (Vitest+RTL) | — | 1 | DEV | Render router at `/`; assert URL changes to `/clientes`, Clientes view content renders |
| AC-1.3: snake_case columns confirmed in EF schema | API Integration | R5 | 1 | DEV | Query `information_schema.columns` for `__ef_migrations_history`; assert `migration_id`, `product_version` (no PascalCase) |

**Total P2:** 4 tests, 2.0 hours

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Test suite scaffolding validation

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| Frontend test suite runs: `npx vitest run` exits 0 | Unit (Vitest) | 1 | DEV | Validates test runner and initial scaffolded tests pass |
| Backend test suite runs: `dotnet test SiesaAgents.UnitTests` exits 0 | Unit (xUnit) | 1 | DEV | Validates xUnit project is wired correctly; zero test failures |

**Total P3:** 2 tests, 0.5 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose:** Fast feedback — catch build-breaking issues before running integration tests

- [ ] TC-E1-P0-01: TypeScript strict build (`tsc --noEmit`) (30s)
- [ ] TC-E1-P0-02: Frontend dev server starts on port 5173 (45s)
- [ ] TC-E1-P1-06: .NET solution builds (`dotnet build SiesaAgents.sln`) (60s)

**Total:** 3 scenarios

### P0 Tests (<10 min)

**Purpose:** Critical path validation — CORS, middleware, strict compilation

```
Phase 1 — Build Gate (no DB required)
  1. TC-E1-P0-01  TypeScript strict build (tsc --noEmit exits 0)
  2. TC-E1-P0-02  Frontend dev server starts on port 5173
  3. TC-E1-P1-06  Solution build (dotnet build SiesaAgents.sln)

Phase 2 — Backend API Gate (DB required)
  4. TC-E1-P0-03  Scalar loads at /scalar (not Swagger)
  5. TC-E1-P0-04  CORS preflight + GET from localhost:5173
  6. TC-E1-P0-05  ExceptionHandlingMiddleware — Problem Details RFC 7807
```

**Total:** 5 P0 scenarios

### P1 Tests (<30 min)

**Purpose:** Important feature coverage — routing, DB, navigation

```
Phase 3 — Database Gate
  7. TC-E1-P1-05  EF Core migration creates siesa_agents_db + snake_case migrations table
  8. TC-E1-P2-04  snake_case column verification (information_schema)

Phase 4 — Frontend Shell Tests
  9. TC-E1-P1-01  SPA navigation without full page reload
 10. TC-E1-P1-02  Deep link /clientes (E2E)
 11. TC-E1-P1-03  Deep link /contactos (E2E)
 12. TC-E1-P1-04  404 route — not-found view rendered
```

**Total:** 6 P1 scenarios

### P2/P3 Tests (<60 min)

**Purpose:** Full regression — responsive nav, redirect, unit suites

```
Phase 5 — Responsive Navigation (P2)
 13. TC-E1-P2-01  NavigationRail visible at 1280px
 14. TC-E1-P2-02  NavigationBar visible at 375px, NavigationRail hidden
 15. TC-E1-P2-03  Index route / redirects to /clientes

Phase 6 — Unit Test Suites (P3, on-demand)
 16. TC-E1-P3-01  Vitest unit tests (npx vitest run)
 17. TC-E1-P3-02  xUnit unit tests (dotnet test SiesaAgents.UnitTests)
```

**Total:** 6 P2/P3 scenarios

---

## Detailed Test Cases

### P0 — Must Pass Before Any Story Begins Implementation

#### TC-E1-P0-01: Frontend TypeScript Build Passes in Strict Mode

**Level:** Unit / Build
**Story:** 1.1
**Requirement:** AC-1.1 (TypeScript strict mode enabled)
**Risk Covered:** R2

**Precondition:** Frontend project initialized with `npm create vite@latest -- --template react-ts`; `tsconfig.json` has `"strict": true`.

**Test Steps:**
1. Run `npx tsc --noEmit` from the `frontend/` directory.
2. Run `npm run build` and observe exit code.

**Expected Result:**
- `tsc --noEmit` exits with code 0 and zero TypeScript errors.
- `npm run build` produces a `dist/` folder with no compilation errors.
- No implicit `any` warnings in strict mode.

**Automation:** CI pre-check / build script.

---

#### TC-E1-P0-02: Frontend Dev Server Starts on Port 5173

**Level:** Unit / Smoke
**Story:** 1.1
**Requirement:** AC-1.1 (`npm run dev` starts on port 5173 with no errors)
**Risk Covered:** R2

**Precondition:** All `npm install` dependencies are installed.

**Test Steps:**
1. Run `npm run dev` in `frontend/`.
2. After server is ready, perform GET request to `http://localhost:5173`.

**Expected Result:**
- Process starts without errors in stdout.
- HTTP 200 response with HTML content containing Vite entry point.
- No EADDRINUSE or dependency resolution errors.

**Automation:** Shell test or Playwright launch fixture.

---

#### TC-E1-P0-03: Backend Starts and Scalar Loads

**Level:** API Integration
**Story:** 1.1
**Requirement:** AC-1.1 (backend on port 5000, Scalar at `/scalar`)
**Risk Covered:** R8

**Precondition:** `dotnet run` in `SiesaAgents.API/`. PostgreSQL running locally.

**Test Steps:**
1. Start backend via `WebApplicationFactory<Program>`.
2. GET `/scalar`.

**Expected Result:**
- HTTP 200 with HTML containing Scalar UI.
- Response body does NOT contain `swagger-ui` string.
- `Content-Type` contains `text/html`.

**Automation:** xUnit integration test using `WebApplicationFactory<Program>`.

---

#### TC-E1-P0-04: CORS Allows Requests from localhost:5173

**Level:** API Integration
**Story:** 1.1
**Requirement:** AC-1.1 (CORS from localhost:5173 without errors)
**Risk Covered:** R1

**Precondition:** CORS configured in `Program.cs` with explicit origin `http://localhost:5173`.

**Test Steps:**
1. Send OPTIONS preflight to any backend endpoint with:
   - `Origin: http://localhost:5173`
   - `Access-Control-Request-Method: GET`
2. Send GET with `Origin: http://localhost:5173` header.

**Expected Result:**
- OPTIONS returns 204 with `Access-Control-Allow-Origin: http://localhost:5173`.
- GET response includes `Access-Control-Allow-Origin` header.
- No 403 Forbidden or missing CORS header.
- Origin `http://localhost:5174` is NOT in the allow-list (boundary check).

**Automation:** xUnit integration test with `HttpClient` via `WebApplicationFactory`.

---

#### TC-E1-P0-05: ExceptionHandlingMiddleware Returns Problem Details RFC 7807

**Level:** API Integration
**Story:** 1.3
**Requirement:** AC-1.3 (Problem Details on unhandled exception — NFR6)
**Risk Covered:** R3

**Precondition:** Backend running. A test endpoint that throws `new Exception("test error")` registered only in test configuration.

**Test Steps:**
1. Register test endpoint `GET /api/v1/test-error` via `WebApplicationFactory` with-services override.
2. Call endpoint.
3. Inspect response body.

**Expected Result:**
- HTTP status 500.
- `Content-Type: application/problem+json`.
- Response JSON contains fields: `status`, `title`, `detail`.
- Response JSON does NOT contain: `stackTrace`, `exception`, `innerException`, `traceId` with C# type info.
- No raw C# exception type name visible to caller.

**Automation:** xUnit integration test.

---

### P1 — Must Pass Before Story is Closed as Done

#### TC-E1-P1-01: SPA Navigation — No Full Page Reload Between Routes

**Level:** Component (Vitest + RTL)
**Story:** 1.2
**Requirement:** AC-E1.2 (navigate Clientes/Contactos without full page reload — FR28)
**Risk Covered:** R4

**Precondition:** TanStack Router configured with `/clientes` and `/contactos` routes. Root layout with NavigationRail rendered.

**Test Steps:**
1. Render `<RouterProvider>` wrapping the app shell.
2. Simulate click on "Clientes" nav item.
3. Assert URL is `/clientes` and view content renders.
4. Simulate click on "Contactos" nav item.
5. Assert URL is `/contactos` and view content renders.
6. Verify `window.location.reload()` was NOT called.

**Expected Result:**
- TanStack Router `useNavigate()` navigation occurs — no full page reload.
- Both route views render without unmounting the shell layout.
- Navigation items remain visible in both views.

**Automation:** Vitest + `@testing-library/react` + TanStack Router test utilities.

---

#### TC-E1-P1-02: Deep Linking — Direct URL Access to /clientes

**Level:** E2E (Playwright)
**Story:** 1.2
**Requirement:** AC-E1.3 (deep linking — FR30)
**Risk Covered:** R4

**Precondition:** Frontend dev server running on port 5173. Vite configured to serve `index.html` for all unknown routes (SPA fallback).

**Test Steps:**
1. Open browser directly to `http://localhost:5173/clientes` (no prior navigation).
2. Wait for page to render.

**Expected Result:**
- Clientes view is rendered (expected heading or route-specific content visible).
- No redirect to home screen or root URL.
- No 404 page or blank screen.
- NavigationRail or NavigationBar is visible.

**Automation:** Playwright E2E test.

---

#### TC-E1-P1-03: Deep Linking — Direct URL Access to /contactos

**Level:** E2E (Playwright)
**Story:** 1.2
**Requirement:** AC-E1.3 (deep linking — FR30)
**Risk Covered:** R4

**Precondition:** Frontend dev server running on port 5173.

**Test Steps:**
1. Open browser directly to `http://localhost:5173/contactos`.
2. Wait for page to render.

**Expected Result:**
- Contactos view is rendered.
- No redirect or blank page.
- Navigation shell remains visible.

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
- Not-found component renders (not blank screen, not JS error).
- Navigation shell layout remains visible (shell does not unmount).
- TanStack Router catch-all `*` route is configured.

**Automation:** Vitest + RTL.

---

#### TC-E1-P1-05: EF Core Migration Creates Database and Migrations Table

**Level:** API Integration
**Story:** 1.3
**Requirement:** AC-1.3 (database created, migrations folder exists)
**Risk Covered:** R5, R6

**Precondition:** PostgreSQL running (TestContainers or local). No `siesa_agents_db` exists.

**Test Steps:**
1. Run `dotnet ef database update` against test PostgreSQL instance.
2. Connect and query `information_schema.tables` in `siesa_agents_db`.
3. Query `information_schema.columns` for `__ef_migrations_history`.

**Expected Result:**
- `siesa_agents_db` database created with no errors.
- `__ef_migrations_history` table exists with snake_case name.
- Columns are `migration_id`, `product_version` (not PascalCase `MigrationId`).
- No domain tables (`clientes`, `contactos`) exist — scope note respected.
- Migrations folder exists in `SiesaAgents.Infrastructure`.

**Automation:** xUnit integration test using `TestContainers` (Postgres) or local test database.

---

#### TC-E1-P1-06: Clean Architecture Solution Builds Without Errors

**Level:** Unit / Build
**Story:** 1.1
**Requirement:** AC-1.1 (four CA projects referenced correctly in solution)
**Risk Covered:** R9

**Test Steps:**
1. Run `dotnet build SiesaAgents.sln` from the `backend/` directory.

**Expected Result:**
- All four projects build successfully: `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`.
- Zero errors and zero unresolved project references.
- `dotnet build` exits with code 0.

**Automation:** CI build step / shell test.

---

### P2 — Should Pass Before Epic is Marked Complete

#### TC-E1-P2-01: NavigationRail Visible on Desktop Viewport

**Level:** Component (Vitest + RTL)
**Story:** 1.2
**Requirement:** AC-E1.1 (NavigationRail on desktop — siesa-ui-kit)
**Risk Covered:** R7

**Test Steps:**
1. Render root layout at viewport width 1280px (above lg: 1024px breakpoint).
2. Query for the `NavigationRail` component from siesa-ui-kit.

**Expected Result:**
- `NavigationRail` is in the DOM and visible.
- Contains "Clientes" and "Contactos" navigation entries.
- `NavigationBar` (mobile) is not rendered or is hidden.

**Automation:** Vitest + RTL with `jsdom` viewport configuration.

---

#### TC-E1-P2-02: NavigationBar Visible on Mobile Viewport

**Level:** Component (Vitest + RTL)
**Story:** 1.2
**Requirement:** AC-E1.1 (mobile NavigationBar, all items accessible — FR29)
**Risk Covered:** R7

**Test Steps:**
1. Render root layout at viewport width 375px (below lg: 1024px breakpoint).
2. Query for the `NavigationBar` component from siesa-ui-kit.

**Expected Result:**
- `NavigationBar` is in the DOM and visible.
- `NavigationRail` is NOT rendered (or is hidden/`display:none`).
- All navigation items are present and accessible (ARIA-accessible tap targets).

**Automation:** Vitest + RTL.

---

#### TC-E1-P2-03: Index Route Redirects to /clientes

**Level:** Component (Vitest + RTL)
**Story:** 1.2
**Requirement:** Implied by routing design (index route must resolve to a meaningful view)

**Test Steps:**
1. Render router with path set to `/` (root index).
2. Assert redirect occurs to `/clientes`.

**Expected Result:**
- URL changes to `/clientes`.
- Clientes view content renders (not a blank page at `/`).
- TanStack Router `redirect` or `<Navigate to="/clientes" />` is active.

**Automation:** Vitest + RTL.

---

#### TC-E1-P2-04: snake_case Column Naming Applied via ApplySnakeCaseNaming

**Level:** API Integration
**Story:** 1.3
**Requirement:** AC-1.3 (snake_case convention applied)
**Risk Covered:** R5

**Test Steps:**
1. After running migration, query `information_schema.columns` for `__ef_migrations_history` in `siesa_agents_db`.
2. Assert column names are snake_case.

**Expected Result:**
- Column names are `migration_id`, `product_version` (snake_case).
- No PascalCase column names exist (e.g., no `MigrationId`).
- Confirms `modelBuilder.ApplySnakeCaseNaming()` is the last call in `OnModelCreating`.

**Automation:** xUnit integration test querying `information_schema.columns`.

---

### P3 — Nice to Have / Future Sprint

#### TC-E1-P3-01: Vitest Unit Tests Pass in Frontend

**Level:** Unit
**Story:** 1.1

**Test Steps:**
1. Run `npx vitest run` from `frontend/`.

**Expected Result:**
- All unit tests pass.
- Coverage report generated.
- Exit code 0.

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
- Exit code 0.

**Automation:** xUnit.

---

## Acceptance Criteria Coverage Matrix

| Epic / Story AC | Stories | Test Cases | Status |
|-----------------|---------|------------|--------|
| AC-E1.1: App loads with accessible navigation on mobile and desktop | 1.2 | TC-E1-P2-01, TC-E1-P2-02 | Covered |
| AC-E1.2: Navigate Clientes/Contactos without full page reload (FR28) | 1.2 | TC-E1-P1-01 | Covered |
| AC-E1.3: Direct URL `/clientes` and `/contactos` renders correct views (FR30) | 1.2 | TC-E1-P1-02, TC-E1-P1-03 | Covered |
| AC-1.1.a: `npm run dev` starts on port 5173 with no errors | 1.1 | TC-E1-P0-02 | Covered |
| AC-1.1.b: TypeScript strict mode enabled | 1.1 | TC-E1-P0-01 | Covered |
| AC-1.1.c: Backend starts on port 5000, Scalar loads at `/scalar` | 1.1 | TC-E1-P0-03 | Covered |
| AC-1.1.d: Four CA projects referenced correctly in solution | 1.1 | TC-E1-P1-06 | Covered |
| AC-1.1.e: CORS allows requests from localhost:5173 | 1.1 | TC-E1-P0-04 | Covered |
| AC-1.2.a: NavigationRail on desktop with Clientes/Contactos entries | 1.2 | TC-E1-P2-01 | Covered |
| AC-1.2.b: NavigationBar on mobile, all items tappable (FR29) | 1.2 | TC-E1-P2-02 | Covered |
| AC-1.2.c: SPA navigation (no full reload) | 1.2 | TC-E1-P1-01 | Covered |
| AC-1.2.d: Deep linking via URL bar | 1.2 | TC-E1-P1-02, TC-E1-P1-03 | Covered |
| AC-1.2.e: 404 / not-found view on unknown route | 1.2 | TC-E1-P1-04 | Covered |
| AC-1.3.a: `siesa_agents_db` created with no errors | 1.3 | TC-E1-P1-05 | Covered |
| AC-1.3.b: EF Core migrations folder exists in SiesaAgents.Infrastructure | 1.3 | TC-E1-P1-05 | Covered |
| AC-1.3.c: Problem Details RFC 7807 on unhandled exception (NFR6) | 1.3 | TC-E1-P0-05 | Covered |
| AC-1.3.d: `ApplySnakeCaseNaming()` applied in `OnModelCreating` | 1.3 | TC-E1-P2-04 | Covered |

---

## NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR4 | HTTPS in non-local deployments | Out of scope for Epic 1 (local dev only) | N/A |
| NFR5 | Input validation / sanitization | No user input in Epic 1 — deferred to Epic 2+ | N/A |
| NFR6 | No stack traces exposed to end users | TC-E1-P0-05 | API Integration |

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 5 | 2.0 | 10.0 | CORS, middleware, strict build — complex setup |
| P1 | 6 | 1.0 | 6.0 | Standard coverage — routing, DB migration, build |
| P2 | 4 | 0.5 | 2.0 | Component viewport tests, snake_case validation |
| P3 | 2 | 0.25 | 0.5 | Unit test suites (already scaffolded by impl) |
| **Total** | **17** | — | **18.5 hours** | **~2.3 days** |

### Prerequisites

**Test Data:**
- No domain entity factories needed for Epic 1 (no domain tables yet)
- `WebApplicationFactory<Program>` test host for backend integration tests
- `TestContainers` Postgres container for isolated DB migration tests (recommended over local DB)

**Tooling:**

| Tool | Purpose | Layer |
|------|---------|-------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| @testing-library/jest-dom | DOM matchers | Frontend |
| Playwright 1.40+ | E2E deep-link verification | E2E |
| xUnit 2+ | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Isolated DB for migration tests | Backend |
| MSW | API mock for component tests (future) | Frontend |

**Environment:**
- Node.js 20+ with npm — frontend build/test
- .NET 10 SDK — backend build/test
- PostgreSQL 18+ running locally on default port 5432
- Database user with CREATE DATABASE privilege
- All npm dependencies installed (`npm install`)
- All NuGet packages restored (`dotnet restore`)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — all 5 tests must pass)
- **P1 pass rate**: 100% for this epic (foundation layer; partial pass is not acceptable)
- **P2/P3 pass rate**: ≥90% (may be deferred with documented justification)
- **High-risk mitigations** (R1, R2, R3): 100% complete before Epic 1 closure

### Coverage Targets

- **Critical paths** (CORS, middleware, TypeScript build): 100%
- **Security scenarios** (NFR6 — no stack trace exposure): 100%
- **Navigation shell AC coverage**: ≥80%
- **Database wiring AC coverage**: 100%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E1-P0-01 through TC-E1-P0-05)
- [ ] No high-risk items (R1, R2, R3) unmitigated
- [ ] Problem Details format verified — no stack trace leakage (R3)
- [ ] CORS preflight + actual request verified from localhost:5173 (R1)
- [ ] TypeScript strict build exits 0 (R2)

---

## Mitigation Plans

### R1: CORS Misconfiguration (Score: 6)

**Mitigation Strategy:** Explicitly configure `app.UseCors()` in `Program.cs` BEFORE endpoint mapping. Policy must include `WithOrigins("http://localhost:5173")`, `AllowAnyMethod()`, and `AllowAnyHeader()`. Test with both OPTIONS preflight and GET with Origin header via `WebApplicationFactory`.

**Owner:** DEV
**Timeline:** Story 1.1 implementation
**Status:** Planned
**Verification:** TC-E1-P0-04 — API integration test asserting `Access-Control-Allow-Origin: http://localhost:5173` in response

---

### R2: TypeScript Strict Mode Compilation Failure (Score: 6)

**Mitigation Strategy:** Enforce `"strict": true` in both `tsconfig.json` and `tsconfig.app.json`. Add `tsc --noEmit` as a pre-CI step that runs before tests. Ensure all third-party package type definitions are installed (`@types/*` packages) to avoid implicit `any`.

**Owner:** DEV
**Timeline:** Story 1.1 implementation
**Status:** Planned
**Verification:** TC-E1-P0-01 — build test asserting `tsc --noEmit` exits with code 0

---

### R3: ExceptionHandlingMiddleware Missing or Mis-ordered (Score: 6)

**Mitigation Strategy:** Register `app.UseMiddleware<ExceptionHandlingMiddleware>()` as the FIRST middleware in `Program.cs` pipeline, before `app.UseRouting()`, `app.UseCors()`, and `app.MapEndpoints()`. Middleware must catch all `Exception` types and return `application/problem+json` with `status`, `title`, `detail` fields — never `stackTrace`.

**Owner:** DEV
**Timeline:** Story 1.3 implementation
**Status:** Planned
**Verification:** TC-E1-P0-05 — integration test triggering unhandled exception and asserting RFC 7807 response with no stack trace fields

---

## Constraints for Story Implementation Agents

The following constraints must be enforced during implementation for all tests to pass:

1. `ExceptionHandlingMiddleware` must be registered BEFORE endpoint mapping in `Program.cs` middleware pipeline.
2. `modelBuilder.ApplySnakeCaseNaming()` must be the LAST call inside `OnModelCreating`.
3. `app.UseSwagger()` must NOT appear anywhere — use `app.MapScalarApiReference()` exclusively.
4. CORS policy must explicitly allow `http://localhost:5173` as origin.
5. TanStack Router must be configured with a catch-all `*` route pointing to a NotFound component.
6. The index route (`/`) must redirect to `/clientes` via TanStack Router's `redirect` or equivalent.
7. Frontend viewport breakpoint for nav component swap is `lg: 1024px` — use Tailwind responsive classes.
8. Vite dev server must be configured with `historyApiFallback: true` (or equivalent) to serve `index.html` for all routes, enabling deep linking.

---

## Definition of Done for Epic 1

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E1-P0-01 through TC-E1-P0-05)
- [ ] All P1 test cases pass (TC-E1-P1-01 through TC-E1-P1-06)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] TypeScript build produces zero errors in strict mode
- [ ] `dotnet build` and `dotnet test` pass with zero failures
- [ ] CORS, middleware ordering, and Problem Details format manually verified in development environment

---

## Assumptions and Dependencies

### Assumptions

1. PostgreSQL 18+ is running locally with a user that has `CREATE DATABASE` privileges when integration tests execute.
2. The Vite dev server will be configured to redirect all unknown paths to `index.html` (historyApiFallback) for deep-linking to work in development.
3. `siesa-ui-kit` package is available via npm and its `NavigationRail` / `NavigationBar` components accept standard viewport-conditional rendering via Tailwind responsive classes.
4. `TestContainers` (Postgres) is the preferred approach for database isolation in CI — if unavailable, local DB teardown/setup scripts are acceptable.

### Dependencies

1. PostgreSQL 18+ running locally — required for TC-E1-P1-05 and TC-E1-P2-04 before Story 1.3 validation
2. `npm install` and `dotnet restore` must complete successfully — prerequisite for all test execution
3. Story 1.1 implementation complete — prerequisite for all Story 1.2 and 1.3 tests (dev environment must exist)

### Risks to Plan

- **Risk:** TestContainers Postgres image download fails in CI (network restrictions)
  - **Impact:** P1-05 and P2-04 cannot run in CI
  - **Contingency:** Use a pre-seeded local PostgreSQL service in CI pipeline instead of TestContainers

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests for TC-E1-P0-04 and TC-E1-P0-05 (separate workflow; not auto-run).
- Run `*automate` for broader coverage once Story 1.2 and 1.3 implementations exist.

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

- Epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD (NFRs): `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Implementation Story 1.1: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`
- System-level test design: Not yet generated (run `*test-design` in system-level mode if needed)

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Epic:** 1 — Project Foundation & Application Shell
**Mode:** Epic-Level (Phase 4)
