# Test Design: Epic 1 - Project Foundation & Application Shell

**Date:** 2026-06-24
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic Source:** `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`

---

## Executive Summary

**Scope:** Full test design for Epic 1 — Project Foundation & Application Shell

Epic 1 establishes the project scaffolding, frontend navigation shell, and backend database foundation. There are no domain CRUD operations yet; this epic only validates that:
- Both dev servers boot and communicate correctly (Story 1.1)
- The SPA navigation shell renders correctly on desktop and mobile, supports deep linking and 404 handling (Story 1.2)
- PostgreSQL is connected, EF Core migrations run, and the global error middleware works (Story 1.3)

**FRs covered:** FR28, FR29, FR30
**NFRs covered:** NFR4 (HTTPS), NFR5 (input validation infrastructure), NFR6 (Problem Details error format), NFR11 (UUID PKs / no hardcoded limits)

**Risk Summary:**

- Total risks identified: 8
- High-priority risks (score ≥6): 3
- Critical categories: OPS, TECH, DATA

**Coverage Summary:**

| Priority | Scenarios | Effort (hours) |
|----------|-----------|---------------|
| P0       | 8         | 16.0          |
| P1       | 10        | 10.0          |
| P2       | 7         | 3.5           |
| P3       | 4         | 1.0           |
| **Total**| **29**    | **30.5 (~4 days)** |

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | OPS | Dev servers fail to start or bind to wrong ports (frontend 5173, backend 5000). Breaks entire team development workflow. | 2 | 3 | 6 | Verify startup commands and port binding in CI smoke test; document exact startup sequence in README | DEV | Sprint 1 Day 1 |
| R-002 | TECH | CORS misconfiguration prevents frontend from reaching backend. `localhost:5173` not in allowed origins. | 2 | 3 | 6 | Add explicit API integration test hitting backend from Vitest/Playwright; verify `Access-Control-Allow-Origin` header | DEV | Sprint 1 Day 2 |
| R-003 | DATA | EF Core migration fails or `siesa_agents_db` database not created correctly. Blocks all future epic migrations. | 2 | 3 | 6 | Add backend integration test that runs `dotnet ef database update` and validates DB existence; assert snake_case column naming | DEV | Sprint 1 Day 2 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-004 | TECH | TanStack Router deep linking fails — unknown routes return 500 or blank page instead of 404 view. | 2 | 2 | 4 | E2E test navigating directly to `/clientes`, `/contactos`, and an unknown route | QA |
| R-005 | TECH | Mobile viewport breakpoint misconfigured — NavigationRail visible on mobile instead of NavigationBar. | 2 | 2 | 4 | E2E viewport test at 390px (iPhone 14) and 1280px (desktop) | QA |
| R-006 | OPS | TypeScript strict mode errors fail `npm run build` silently. tsc not run as part of CI. | 2 | 2 | 4 | Add `tsc --noEmit` check in unit/build step; verify strict mode flag in tsconfig | DEV |
| R-007 | DATA | `ApplySnakeCaseNaming()` not applied or applied in wrong order in `OnModelCreating`. Future migrations generate PascalCase columns. | 1 | 3 | 3 | Unit test asserting column names in EF Core model metadata | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-008 | OPS | Scalar API docs page not loading at `/scalar`. Wrong registration order in `Program.cs`. | 1 | 2 | 2 | Manual smoke check or simple HTTP 200 assertion against `/scalar` | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### Story Coverage Breakdown

| Story | Description | Primary Test Focus |
|-------|-------------|-------------------|
| 1.1 | Project Initialization & Repository Structure | Dev server startup, CORS, TypeScript compilation |
| 1.2 | Frontend Navigation Shell | Routing, responsive layout, deep linking, 404 |
| 1.3 | Backend Database Foundation | DB creation, migrations, error middleware |

---

### P0 (Critical) — Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Req / AC | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|----------|------------|-----------|----------------------|------------|-------|
| Story 1.1 — Frontend server starts | Unit/Build | R-001 | `npm run dev` exits with code 0 and Vite dev server binds to port 5173; `tsc --noEmit` passes | 2 | DEV |
| Story 1.1 — Backend server starts | API | R-001 | `dotnet run` starts; GET `/scalar` returns HTTP 200; health endpoint or root returns 200/404 (not 500) | 2 | DEV |
| Story 1.1 — CORS allowed from 5173 | API | R-002 | Backend responds with `Access-Control-Allow-Origin: http://localhost:5173` for OPTIONS preflight to `/api/v1/` | 1 | QA |
| Story 1.3 — Database created | API | R-003 | `siesa_agents_db` database exists after migration; EF Core `__EFMigrationsHistory` table present | 1 | DEV |
| Story 1.3 — Problem Details middleware | API | R-003 | Force an unhandled exception (invalid route parameter or deliberate 500); assert response body matches RFC 7807 structure: `status`, `title`, `detail` fields; no stack trace in body | 2 | QA |

**Total P0**: 8 tests, 16.0 hours

---

### P1 (High) — Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Req / AC | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|----------|------------|-----------|----------------------|------------|-------|
| AC-E1.1 — App loads with navigation | E2E | R-004, R-005 | On 1280px desktop: app loads, NavigationRail is visible on left, "Clientes" and "Contactos" items present | 2 | QA |
| AC-E1.1 — Mobile navigation | E2E | R-005 | On 390px mobile viewport: NavigationBar (bottom) replaces NavigationRail; all nav items visible and tappable | 2 | QA |
| AC-E1.2 — SPA navigation without reload | E2E | R-004 | Click "Clientes" → URL changes to `/clientes`; click "Contactos" → URL changes to `/contactos`; no full page reload (verify no `navigation` performance entry of type `navigate` except initial) | 2 | QA |
| AC-E1.3 — Deep linking /clientes | E2E | R-004 | Navigate directly to `http://localhost:5173/clientes`; assert correct view rendered, no redirect to home | 1 | QA |
| AC-E1.3 — Deep linking /contactos | E2E | R-004 | Navigate directly to `http://localhost:5173/contactos`; assert correct view rendered | 1 | QA |
| Story 1.2 — 404 not-found view | E2E | R-004 | Navigate directly to `/ruta-desconocida`; assert 404/not-found view displayed gracefully (not blank or error page) | 1 | QA |
| Story 1.3 — snake_case naming applied | Unit | R-007 | EF Core model has `created_at`, `updated_at` in `__EFMigrationsHistory` or check via reflection on model metadata | 1 | DEV |

**Total P1**: 10 tests, 10.0 hours

---

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Req / AC | Test Level | Risk Link | Scenario Description | Test Count | Owner |
|----------|------------|-----------|----------------------|------------|-------|
| Story 1.1 — Clean Architecture project refs | Unit | — | Verify SiesaAgents.sln references all 4 csproj files (API, Application, Domain, Infrastructure) | 1 | DEV |
| Story 1.1 — CORS blocked for other origins | API | R-002 | Backend blocks CORS from `http://localhost:3000` (different port); validates strict origin policy | 1 | QA |
| Story 1.2 — Index route redirects to /clientes | E2E | — | Navigate to `/` (root); assert redirect or content matches `/clientes` view | 1 | QA |
| Story 1.2 — Keyboard navigation | E2E | — | Tab through NavigationRail items on desktop; each item receives focus and activates on Enter | 1 | QA |
| Story 1.3 — Problem Details no stack trace | API | R-003 | Response body from 500-forced endpoint does NOT contain `stackTrace`, `exception`, or `.cs:line` patterns | 1 | QA |
| Story 1.3 — Migration idempotent | API | R-003 | Running `dotnet ef database update` twice produces no error (idempotency check) | 1 | DEV |
| R-008 — Scalar docs load | API | R-008 | GET `/scalar` returns HTTP 200 and `Content-Type: text/html` | 1 | DEV |

**Total P2**: 7 tests, 3.5 hours

---

### P3 (Low) — Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Req / AC | Test Level | Scenario Description | Test Count | Owner |
|----------|------------|----------------------|------------|-------|
| Story 1.1 — Initial bundle size | Unit/Build | Assert frontend bundle < 500KB gzipped for initial route; Vite build report | 1 | DEV |
| Story 1.2 — ARIA landmark roles | E2E | Assert `<nav>` or role="navigation" present; no `aria-hidden` on nav items | 1 | QA |
| Story 1.2 — Browser compatibility smoke | E2E | Run E2E suite on Firefox and Edge (in addition to Chrome/Chromium); assert P0 scenarios pass | 1 | QA |
| Story 1.3 — DB connection error resilience | API | Bring down PostgreSQL; assert backend returns 503 with Problem Details (not 500 with stack trace) | 1 | DEV |

**Total P3**: 4 tests, 1.0 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback — catch build-breaking issues before any other tests run

- [ ] TypeScript strict compilation passes (`tsc --noEmit`) (30s)
- [ ] Vite dev server starts and serves on port 5173 (45s)
- [ ] .NET backend starts and `/scalar` returns HTTP 200 (60s)
- [ ] GET `/api/v1/` or health route returns non-500 (15s)

**Total**: 4 scenarios (~2.5 min)

### P0 Tests (<10 min)

**Purpose**: Critical path validation — block merge if any fail

- [ ] CORS preflight returns correct `Access-Control-Allow-Origin` header (API)
- [ ] `siesa_agents_db` exists after EF migration (API/Integration)
- [ ] `__EFMigrationsHistory` table present (API/Integration)
- [ ] Force-500 endpoint returns Problem Details RFC 7807, no stack trace (API)
- [ ] Force-400 endpoint returns Problem Details with `errors` field (API)
- [ ] tsc --noEmit with strict mode passes (Build)
- [ ] Backend server binds to port 5000 (API)
- [ ] Frontend server binds to port 5173 (Build)

**Total**: 8 scenarios

### P1 Tests (<30 min)

**Purpose**: Navigation shell and routing validation

- [ ] Desktop: NavigationRail visible, Clientes + Contactos items present (E2E)
- [ ] Desktop: Click nav items → SPA navigation, no full reload (E2E)
- [ ] Mobile 390px: NavigationBar visible instead of Rail (E2E)
- [ ] Mobile 390px: All nav items tappable (E2E)
- [ ] Direct URL `/clientes` → correct view, no redirect (E2E)
- [ ] Direct URL `/contactos` → correct view, no redirect (E2E)
- [ ] Direct URL `/ruta-invalida` → 404 view rendered gracefully (E2E)
- [ ] EF Core model uses snake_case column naming (Unit)
- [ ] SiesaAgents.sln references all 4 projects (Unit)
- [ ] `ApplySnakeCaseNaming()` called in `OnModelCreating` (Unit)

**Total**: 10 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression, edge cases, and compliance checks

- [ ] CORS blocks origin `localhost:3000` (API)
- [ ] Root `/` redirects to `/clientes` (E2E)
- [ ] Keyboard navigation through NavRail (E2E)
- [ ] Problem Details response never exposes `stackTrace` pattern (API)
- [ ] Migration idempotency — second run no error (API)
- [ ] Scalar docs load with text/html (API)
- [ ] Bundle size check < 500KB gzipped (Build)
- [ ] ARIA landmark roles present in navigation (E2E)
- [ ] P0 suite passes on Firefox and Edge (E2E)
- [ ] DB connection failure → 503 Problem Details (API)
- [ ] tsc strict flags verified in tsconfig (Unit)

**Total**: 11 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 8 | 2.0 | 16.0 | Complex environment setup (DB, CORS, server startup) |
| P1 | 10 | 1.0 | 10.0 | E2E viewport + routing scenarios |
| P2 | 7 | 0.5 | 3.5 | Edge cases and compliance |
| P3 | 4 | 0.25 | 1.0 | Exploratory, benchmarks |
| **Total** | **29** | — | **30.5** | **~4 days** |

### Test Level Distribution

| Level | Count | Rationale |
|-------|-------|-----------|
| E2E (Playwright) | 13 | Navigation shell, routing, responsive layout — requires browser |
| API/Integration | 10 | Server startup, CORS, Problem Details, DB migrations — requires running services |
| Unit/Build | 6 | TypeScript compilation, EF Core model metadata, project structure |

### Prerequisites

**Test Data:**
- No domain data required for Epic 1 (empty DB schema only)
- PostgreSQL `siesa_agents_db` must be created before API tests run
- Initial EF Core migration must be applied

**Tooling:**
- Playwright (Chromium, Firefox, Edge) for E2E and API
- Vitest + `@testing-library/react` for component/unit tests
- `dotnet test` with xUnit for backend unit and integration tests
- `dotnet ef database update` in CI before API tests

**Environment:**
- Node.js 20+ and .NET 10 SDK installed
- PostgreSQL 18 running locally or in Docker (CI)
- Vite dev server on port 5173 (or Playwright baseURL configured)
- .NET API on port 5000
- CI: sequential start order: `PostgreSQL → dotnet run → npm run dev`

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% — zero exceptions, blocks merge
- **P1 pass rate**: ≥95% — waivers require tech lead sign-off
- **P2/P3 pass rate**: ≥90% — informational, does not block merge
- **High-risk mitigations (R-001, R-002, R-003)**: 100% implemented and verified

### Coverage Targets

- **Critical paths (navigation shell, server startup)**: ≥80%
- **Error handling (Problem Details)**: 100%
- **Business logic in Epic 1**: N/A (no domain logic yet)
- **Edge cases**: ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass before any Epic 2 story starts
- [ ] CORS tested explicitly — never assumed
- [ ] Problem Details middleware verified to suppress stack traces
- [ ] EF Core snake_case naming verified before migrations are built on top of it
- [ ] TypeScript strict mode verified before frontend code expands

---

## Mitigation Plans

### R-001: Dev Servers Fail to Start (Score: 6)

**Mitigation Strategy:** Create CI job step that starts both servers and asserts process exit code 0 within 60s. Use `wait-on` utility to verify ports are bound before tests run. Document exact startup commands in project README.

**Owner:** DEV
**Timeline:** Story 1.1 implementation (Sprint 1, Day 1-2)
**Status:** Planned
**Verification:** P0 smoke test — server startup tests pass in CI

---

### R-002: CORS Misconfiguration (Score: 6)

**Mitigation Strategy:** Add explicit CORS header assertion in API integration test using Playwright's `request` context or xUnit `HttpClient`. Test both the allowed origin (`localhost:5173`) and a blocked origin (`localhost:3000`). Register CORS policy in `Program.cs` with named policy before any endpoint mapping.

**Owner:** DEV
**Timeline:** Story 1.1 implementation (Sprint 1, Day 1-2)
**Status:** Planned
**Verification:** P0 API test — CORS preflight response headers pass; P2 API test — blocked origin confirmed

---

### R-003: EF Core Migration / Database Foundation Failure (Score: 6)

**Mitigation Strategy:** Add xUnit integration test project (`SiesaAgents.IntegrationTests`) that:
1. Runs `dotnet ef database update` against a test PostgreSQL instance
2. Asserts `siesa_agents_db` database is reachable
3. Queries `__EFMigrationsHistory` for presence of initial migration record
4. Inspects EF Core model for snake_case column names via `DbContext.Model`

Use Docker Compose in CI for ephemeral PostgreSQL container.

**Owner:** DEV
**Timeline:** Story 1.3 implementation (Sprint 1, Day 2-3)
**Status:** Planned
**Verification:** P0 API/Integration tests — DB creation and column naming pass

---

## Assumptions and Dependencies

### Assumptions

1. PostgreSQL 18 is available locally or via Docker in CI before backend tests run.
2. The `siesa_agents_db` connection string is configured in `appsettings.Development.json` with no auth beyond local connection.
3. `tea_use_playwright_utils: false` — no `@seontechnologies/playwright-utils` wrappers used; standard Playwright API applies.
4. No authentication in MVP scope — no session or auth tokens needed in E2E tests.
5. The frontend is served via `npm run dev` (Vite HMR) during testing, not via static build.

### Dependencies

1. Story 1.1 implementation complete — Required before any P0 server-startup tests can run
2. Story 1.3 implementation complete — Required before database migration tests can run
3. PostgreSQL container in CI — Required by end of Sprint 1 Day 1

### Risks to Plan

- **Risk**: PostgreSQL not available in CI environment
  - **Impact**: All DB-related P0 tests fail; Epic 2 blocked
  - **Contingency**: Use `testcontainers-dotnet` to spin up ephemeral PostgreSQL container per test run

- **Risk**: siesa-ui-kit NavigationRail/NavigationBar component names differ from assumptions
  - **Impact**: E2E selectors based on ARIA roles or component labels may need adjustment
  - **Contingency**: Use ARIA role selectors (`role="navigation"`) instead of component name; consult siesa-ui-kit catalog before writing tests

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run by `*test-design`).
- Run `*automate` for broader coverage once Story 1.1, 1.2, and 1.3 are implemented.
- Run `*nfr` after Epic 1 to validate NFR6 (Problem Details) and NFR4 (HTTPS) compliance.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam — Date: ___
- [ ] Tech Lead: SiesaTeam — Date: ___
- [ ] QA Lead: SiesaTeam — Date: ___

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories: TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` — Risk scoring: Probability × Impact matrix
- `test-levels-framework.md` — E2E vs API vs Unit decision framework
- `test-priorities-matrix.md` — P0-P3 prioritization criteria

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD: `_bmad-output/planning-artifacts/archive/prd.md`

### Validation Checklist

- [x] Risk assessment complete with all relevant categories (TECH, OPS, DATA)
- [x] All risks scored (probability × impact)
- [x] High-priority risks (≥6) flagged: R-001, R-002, R-003
- [x] Coverage matrix maps requirements to test levels
- [x] Priority levels assigned (P0-P3) for all 29 scenarios
- [x] Execution order defined (smoke → P0 → P1 → P2/P3)
- [x] Resource estimates provided (30.5 hours / ~4 days)
- [x] Quality gate criteria defined
- [x] Output file created and formatted correctly

---

**Generated by**: BMad TEA Agent - Test Architect Module (sa-tea-test-design)
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
**Mode**: Epic-Level (Phase 4) — forced per sa-quick-dev orchestrator
