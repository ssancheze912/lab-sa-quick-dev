# Test Design: Epic 1 - Project Foundation & Application Shell

**Date:** 2026-06-28
**Author:** SiesaTeam
**Epic Source:** `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 1 — Project Foundation & Application Shell

Epic 1 establishes the technical foundation: both frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) project shells initialized, the SPA navigation structure (NavigationRail / NavigationBar), and the PostgreSQL/EF Core database layer with Problem Details error handling. No domain business logic is implemented in this epic — the focus is infrastructure correctness, project structure compliance, and navigation shell behavior.

**Risk Summary:**

- Total risks identified: 8
- High-priority risks (score ≥6): 2
- Critical categories: TECH, OPS, BUS

**Coverage Summary:**

- P0 scenarios: 6 (12 hours)
- P1 scenarios: 8 (8 hours)
- P2/P3 scenarios: 10 (6 hours)
- **Total effort**: 26 hours (~3.5 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | TECH | Clean Architecture project references incorrectly wired (.csproj dependencies missing or circular between API/Application/Domain/Infrastructure) causing build failure | 2 | 3 | 6 | Verify all four project references exist and build runs clean with `dotnet build`; include build verification in P0 smoke test | DEV | Story 1.1 |
| R-002 | BUS | Navigation shell renders NavigationRail on desktop but fails to switch to NavigationBar on mobile viewport, blocking mobile access entirely (FR29, AC-E1.1) | 2 | 3 | 6 | Responsive breakpoint test at lg:1024px with RTL + jsdom viewport resize; also E2E test with mobile viewport | QA | Story 1.2 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-003 | TECH | TanStack Router not configured with file-based routing — deep links (`/clientes`, `/contactos`) return 404 or redirect instead of rendering the correct view (FR30, AC-E1.3) | 2 | 2 | 4 | Unit/component test for route rendering; verify `routeTree.gen.ts` is generated and routes registered correctly | DEV | Story 1.2 |
| R-004 | OPS | CORS not configured in `Program.cs` — frontend requests from `localhost:5173` blocked with CORS error on any HTTP call | 2 | 2 | 4 | Integration test: frontend dev server makes OPTIONS/GET request to backend and receives 200 with correct CORS headers | DEV | Story 1.1 |
| R-005 | DATA | `ApplySnakeCaseNaming()` missing or applied before model configuration — future column names will not follow snake_case convention, breaking migrations | 2 | 2 | 4 | Unit test verifying `OnModelCreating` calls `ApplySnakeCaseNaming()` as last step; verify EF Core migration output matches expected column names | DEV | Story 1.3 |
| R-006 | OPS | `dotnet ef database update` fails — connection string misconfigured in `appsettings.Development.json` or PostgreSQL not reachable | 2 | 2 | 4 | Integration test: database creation succeeds and `siesa_agents_db` exists after migration | DEV | Story 1.3 |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-007 | OPS | Vite dev server fails to start on port 5173 — missing dependency or misconfigured `vite.config.ts` | 1 | 2 | 2 | Smoke test: `npm run dev` exits with code 0 and server responds on port 5173 | Monitor |
| R-008 | BUS | 404/not-found route renders blank page or crashes instead of displaying a graceful error view | 1 | 1 | 1 | Component test: navigating to `/unknown-route` renders not-found view without JS error | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### Story Mapping

| Story | Acceptance Criteria | Key Testable Behaviors |
| ----- | ------------------- | ---------------------- |
| 1.1 — Project Initialization | `npm run dev` starts Vite on 5173, TypeScript strict, `dotnet run` starts on 5000, Scalar at `/scalar`, 4 CA projects referenced, CORS allows 5173 | Dev server startup, TS strict config, backend startup, Scalar docs endpoint, Clean Architecture project graph, CORS preflight |
| 1.2 — Frontend Navigation Shell | NavigationRail on desktop, NavigationBar on mobile, SPA navigation (no reload), deep links work, 404 graceful | Responsive nav component, route rendering, URL-based navigation, not-found view |
| 1.3 — Backend Database Foundation | `siesa_agents_db` created, EF migrations folder exists, Problem Details RFC 7807 format, snake_case naming applied | DB creation, migration execution, error response format, snake_case column naming |

---

### P0 (Critical) — Run on every commit

**Criteria**: Blocks core infrastructure setup + High risk (≥6) + Foundation for all subsequent epics

| Requirement | Test Level | Risk Link | Scenario | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | -------- | ---------- | ----- | ----- |
| AC-E1.1 — App loads with navigation on desktop | E2E | R-002 | NavigationRail visible on desktop viewport (≥1024px), both "Clientes" and "Contactos" entries present | 1 | QA | Playwright, viewport 1280×720 |
| AC-E1.1 — App loads with navigation on mobile | E2E | R-002 | NavigationBar visible on mobile viewport (<1024px), all navigation items accessible | 1 | QA | Playwright, viewport 390×844 |
| AC-E1.2 — SPA navigation without page reload | E2E | R-003 | Clicking "Clientes" → URL changes to `/clientes`, no full page reload; clicking "Contactos" → URL changes to `/contactos`, no reload | 1 | QA | Playwright `page.on('load')` must not fire after initial load |
| AC-E1.3 — Deep linking `/clientes` renders correct view | E2E | R-003 | Direct navigation to `localhost:5173/clientes` renders ClientesView without redirect | 1 | QA | Playwright direct URL navigation |
| AC-E1.3 — Deep linking `/contactos` renders correct view | E2E | R-003 | Direct navigation to `localhost:5173/contactos` renders ContactosView without redirect | 1 | QA | Playwright direct URL navigation |
| Story 1.1 — Clean Architecture build succeeds | API | R-001 | `dotnet build` succeeds with 0 errors for all 4 projects in the solution; API project references Application, Application references Domain, Infrastructure references Domain | 1 | DEV | xUnit build test or CI dotnet build gate |

**Total P0**: 6 tests, 12 hours

---

### P1 (High) — Run on PR to main

**Criteria**: Important infrastructure behaviors + Medium risk (3-4) + Required for subsequent epic development

| Requirement | Test Level | Risk Link | Scenario | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | -------- | ---------- | ----- | ----- |
| Story 1.1 — CORS allows frontend origin | API | R-004 | OPTIONS request from `localhost:5173` to `localhost:5000/api/v1/` returns 200 with `Access-Control-Allow-Origin: http://localhost:5173` | 1 | DEV | xUnit WebApplicationFactory |
| Story 1.1 — Backend starts and Scalar loads | API | R-001 | GET `/scalar` returns 200 HTML response; no Swagger endpoint registered | 1 | DEV | xUnit WebApplicationFactory |
| Story 1.1 — TypeScript strict mode enabled | Unit | R-001 | `tsconfig.app.json` has `"strict": true`; `npm run build` produces 0 type errors | 1 | DEV | Vitest configuration test or CI build gate |
| Story 1.2 — Not-found route renders gracefully | Component | R-008 | Navigating to `/unknown-xyz-route` renders a 404/not-found component without React error boundary crash | 1 | DEV | Vitest + RTL with MemoryRouter |
| Story 1.2 — Root `/` redirects to `/clientes` | Component | R-003 | Navigating to `/` redirects user to `/clientes` | 1 | DEV | Vitest + RTL |
| Story 1.3 — Database creation succeeds | API | R-006 | `siesa_agents_db` database exists after `dotnet ef database update`; migrations folder exists in Infrastructure project | 1 | DEV | Integration test with test PostgreSQL instance |
| Story 1.3 — Problem Details format on unhandled exception | API | R-001 | Request that triggers an unhandled exception returns JSON with `status`, `title`, `detail` fields (RFC 7807); no `stackTrace` field present | 1 | DEV | xUnit WebApplicationFactory with a deliberately failing endpoint |
| Story 1.3 — snake_case naming applied | Unit | R-005 | `AppDbContext.OnModelCreating` calls `ApplySnakeCaseNaming()` — verified via EF Core model inspection or migration snapshot column names | 1 | DEV | xUnit unit test on DbContext |

**Total P1**: 8 tests, 8 hours

---

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary behaviors + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Scenario | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | -------- | ---------- | ----- | ----- |
| Story 1.1 — Vite dev server responds on port 5173 | Unit | R-007 | Vite configuration specifies port 5173; `vite.config.ts` contains correct port setting | 1 | DEV | Configuration assertion test |
| Story 1.1 — Frontend dependencies installed correctly | Unit | — | `package.json` contains all required dependencies: siesa-ui-kit, @tanstack/react-router, @tanstack/react-query, zustand, axios, zod, react-hook-form, tailwindcss, vitest | 1 | DEV | Config file assertion |
| Story 1.2 — NavigationRail component uses siesa-ui-kit | Component | — | NavigationRail component imports from siesa-ui-kit, not from a custom implementation | 1 | DEV | Vitest + RTL component import assertion |
| Story 1.2 — Navigation items label text is Spanish | Component | — | NavigationRail/NavigationBar renders "Clientes" and "Contactos" (Spanish) not English equivalents | 1 | DEV | Vitest + RTL text assertion |
| Story 1.3 — EF Core migrations folder exists | Unit | R-006 | `SiesaAgents.Infrastructure/Migrations/` directory exists with at least one migration file after `dotnet ef migrations add InitialCreate` | 1 | DEV | File system assertion in test setup |
| Story 1.3 — DateTimeOffset used (not DateTime) | Unit | R-005 | All entity properties for timestamps use `DateTimeOffset`, verified against entity property types via reflection | 1 | DEV | xUnit reflection-based assertion |
| Story 1.3 — UUID (Guid) primary keys | Unit | R-005 | All entity primary keys are `Guid` type | 1 | DEV | xUnit reflection-based assertion |

**Total P2**: 7 tests, 3.5 hours

---

### P3 (Low) — Run on-demand

**Criteria**: Nice-to-have validations + Exploratory + Non-blocking

| Requirement | Test Level | Scenario | Test Count | Owner | Notes |
| ----------- | ---------- | -------- | ---------- | ----- | ----- |
| Story 1.2 — Keyboard navigation accessible | E2E | Tab-key navigation cycles through NavigationRail items on desktop; focus indicators visible | 1 | QA | Accessibility audit — Playwright |
| Story 1.1 — Backend project solution structure | Unit | `SiesaAgents.sln` references exactly 4 projects (API, Application, Domain, Infrastructure) | 1 | DEV | .sln file parse assertion |
| Story 1.3 — Problem Details returns correct HTTP status codes | API | 404 response for unknown route returns Problem Details with `status: 404`; unhandled exceptions return `status: 500` | 1 | DEV | xUnit WebApplicationFactory |

**Total P3**: 3 tests, 2.5 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues before any full test run

- [ ] P0-01: Clean Architecture build succeeds (dotnet build 0 errors) — 1 min
- [ ] P0-04: Deep link `/clientes` renders correct view — 30s
- [ ] P0-05: Deep link `/contactos` renders correct view — 30s

**Total**: 3 scenarios

---

### P0 Tests (<10 min)

**Purpose**: Critical foundation validation — navigation, routing, build integrity

- [ ] P0-01: Clean Architecture build succeeds (API→Application→Domain←Infrastructure)
- [ ] P0-02: NavigationRail visible on desktop viewport (1280×720)
- [ ] P0-03: NavigationBar visible on mobile viewport (390×844)
- [ ] P0-04: SPA navigation without full page reload (Clientes + Contactos)
- [ ] P0-05: Deep link `/clientes` renders ClientesView
- [ ] P0-06: Deep link `/contactos` renders ContactosView

**Total**: 6 scenarios

---

### P1 Tests (<30 min)

**Purpose**: Infrastructure contracts — CORS, database, error handling, TypeScript strict

- [ ] P1-01: CORS allows `localhost:5173` origin (OPTIONS → 200 + correct headers)
- [ ] P1-02: Backend starts; Scalar at `/scalar` returns 200; no Swagger endpoint
- [ ] P1-03: TypeScript strict mode enabled (build 0 type errors)
- [ ] P1-04: Not-found route renders graceful 404 view without crash
- [ ] P1-05: Root `/` redirects to `/clientes`
- [ ] P1-06: `siesa_agents_db` created; migrations folder exists
- [ ] P1-07: Unhandled exception → Problem Details RFC 7807 (no stackTrace)
- [ ] P1-08: `ApplySnakeCaseNaming()` applied in `OnModelCreating`

**Total**: 8 scenarios

---

### P2/P3 Tests (<60 min)

**Purpose**: Full regression — configuration correctness, entity conventions, labels

- [ ] P2-01: Vite port 5173 in config
- [ ] P2-02: `package.json` has all required dependencies
- [ ] P2-03: NavigationRail imports from siesa-ui-kit
- [ ] P2-04: Navigation labels "Clientes" and "Contactos" in Spanish
- [ ] P2-05: Migrations folder and initial migration file exist
- [ ] P2-06: All entity timestamp properties are `DateTimeOffset`
- [ ] P2-07: All entity PKs are `Guid`
- [ ] P3-01: Keyboard navigation — tab cycles through nav items
- [ ] P3-02: `.sln` references exactly 4 projects
- [ ] P3-03: Problem Details returns correct HTTP status codes (404, 500)

**Total**: 10 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| -------- | ----- | ---------- | ----------- | ----- |
| P0 | 6 | 2.0 | 12 | E2E setup + Playwright config; build verification |
| P1 | 8 | 1.0 | 8 | WebApplicationFactory setup; RTL component tests |
| P2 | 7 | 0.5 | 3.5 | Configuration assertions; reflection tests |
| P3 | 3 | 0.25 | 0.75 | Exploratory; accessibility |
| **Total** | **24** | **-** | **~26** | **~3.5 days** |

### Prerequisites

**Test Data:**

- No domain data fixtures required for Epic 1 (no entity tables exist yet)
- Test PostgreSQL instance for Story 1.3 integration tests (or test containers via Testcontainers.PostgreSql)

**Tooling:**

- Vitest + @testing-library/react for frontend component and unit tests
- xUnit + WebApplicationFactory for backend API integration tests
- Playwright for E2E navigation and viewport tests
- Testcontainers.PostgreSql (optional but recommended) for database integration tests
- TypeScript compiler (`tsc --noEmit`) for strict-mode build gate

**Environment:**

- Node.js + .NET 10 SDK on dev machine / CI runner
- PostgreSQL 18 accessible for Story 1.3 integration tests (local or Docker)
- Vite dev server running on port 5173 for E2E tests
- .NET backend running on port 5000 for E2E and API integration tests

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — these block all subsequent epic development)
- **P1 pass rate**: ≥95% (one P1 failure allowed with documented waiver)
- **P2/P3 pass rate**: ≥90% (informational; non-blocking)
- **High-risk mitigations (R-001, R-002)**: 100% complete before Story 1.2 and 1.3 begin

### Coverage Targets

- **Critical paths (navigation + routing)**: ≥80%
- **Infrastructure contracts (CORS, error handling, DB)**: 100% via P1
- **Entity conventions (UUID, DateTimeOffset, snake_case)**: 100% via P2

### Non-Negotiable Requirements

- [ ] All P0 tests pass before any work on Epic 2 begins
- [ ] R-001 (Clean Architecture build) mitigated — all 4 projects build successfully
- [ ] R-002 (mobile navigation) mitigated — responsive nav verified at both breakpoints
- [ ] No high-risk (≥6) items unmitigated at Epic 1 completion

---

## Mitigation Plans

### R-001: Clean Architecture Build Integrity (Score: 6)

**Mitigation Strategy:** Include `dotnet build` as the first CI step. Story 1.1 acceptance criteria explicitly requires the 4-project solution to compile. Verify via xUnit test that project references match the expected graph: API → Application, API → Infrastructure, Application → Domain, Infrastructure → Domain. Block merge if build fails.

**Owner:** DEV
**Timeline:** Story 1.1 completion
**Status:** Planned
**Verification:** P0-01 test passes in CI; `dotnet build SiesaAgents.sln` returns exit code 0

---

### R-002: Mobile Navigation Breakpoint (Score: 6)

**Mitigation Strategy:** Implement Playwright E2E test that sets viewport to 390×844 (iPhone 14 form factor) and asserts NavigationBar is rendered (not NavigationRail). Also test at 1280×720 for desktop. Since siesa-ui-kit handles the breakpoint logic internally, the test validates that the correct component is mounted, not internal implementation.

**Owner:** QA
**Timeline:** Story 1.2 completion
**Status:** Planned
**Verification:** P0-02 and P0-03 pass for both viewport sizes

---

## Assumptions and Dependencies

### Assumptions

1. Playwright is available as the E2E test framework — if not yet installed, `testarch-framework` workflow must run first to set it up.
2. A local PostgreSQL 18 instance (or Docker container) is available for Story 1.3 database integration tests.
3. siesa-ui-kit NavigationRail and NavigationBar components are accessible via npm and implement the responsive breakpoint at lg:1024px as documented in the UX spec.
4. No authentication is required for any test in Epic 1 (per PRD — no auth in MVP).
5. The E2E tests run against the locally running dev servers (Vite on 5173, .NET on 5000), not against a deployed environment.

### Dependencies

1. Playwright test framework initialized — Required before P0 E2E tests can run (use `testarch-framework` workflow if not yet set up)
2. PostgreSQL 18 instance available — Required for Story 1.3 database integration tests
3. siesa-ui-kit npm package installed — Required for Story 1.2 NavigationRail/NavigationBar tests

### Risks to Plan

- **Risk**: Playwright framework not yet initialized in the project
  - **Impact**: P0 E2E tests (P0-02 through P0-05) cannot run
  - **Contingency**: Run `testarch-framework` workflow before executing E2E tests; P0-01 (build) and P1 unit/API tests can run independently
- **Risk**: PostgreSQL unavailable in CI
  - **Impact**: P1-06 (DB creation) integration test fails
  - **Contingency**: Use Testcontainers.PostgreSql to spin up ephemeral DB in test process

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before Story 1.1 implementation begins (separate workflow; not auto-run by `*test-design`).
- Run `*automate` to expand component and unit test coverage once Story 1.2 and 1.3 implementations exist.
- Run `*framework` if Playwright is not yet initialized in the frontend project.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam — Date: ___
- [ ] Tech Lead: SiesaTeam — Date: ___
- [ ] QA Lead: SiesaTeam — Date: ___

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories, scoring)
- `probability-impact.md` — Risk scoring methodology (P×I matrix)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision guide
- `test-priorities-matrix.md` — P0-P3 prioritization criteria

### Related Documents

- Epic Source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: Epic-Level (Phase 4)
