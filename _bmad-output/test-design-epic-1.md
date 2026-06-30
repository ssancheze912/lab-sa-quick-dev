# Test Design: Epic 1 - Project Foundation & Application Shell

**Date:** 2026-06-30
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Workflow:** `_bmad/bmm/testarch/test-design` v4.0

---

## Executive Summary

**Scope:** Full test design for Epic 1 — Project Foundation & Application Shell

Epic 1 establishes the technical foundation: frontend (Vite + React + TypeScript strict) and backend (.NET 10 Clean Architecture) projects initialized, dev servers running, and users can navigate between Clientes and Contactos sections via a functional application shell with responsive navigation (NavigationRail on desktop, NavigationBar on mobile) and deep linking support.

**Stories covered:**
- Story 1.1: Project Initialization & Repository Structure
- Story 1.2: Frontend Navigation Shell
- Story 1.3: Backend Database Foundation

**Requirements covered:** FR28, FR29, FR30 + NFR3 (concurrency baseline), NFR5 (input sanitization foundation), NFR6 (error exposure)

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (score ≥6): 3
- Critical categories: TECH, OPS, BUS

**Coverage Summary:**

- P0 scenarios: 6 (12 hours)
- P1 scenarios: 9 (9 hours)
- P2/P3 scenarios: 8 (3 hours)
- **Total effort:** 24 hours (~3 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                                                 | Probability | Impact | Score | Mitigation                                                                                          | Owner | Timeline   |
|---------|----------|---------------------------------------------------------------------------------------------|-------------|--------|-------|------------------------------------------------------------------------------------------------------|-------|------------|
| R-001   | TECH     | CORS misconfiguration causes frontend (port 5173) to fail all requests to backend (port 5000) | 3           | 3      | 9     | Verify CORS policy explicitly allows `http://localhost:5173` in `Program.cs`; add integration test for preflight OPTIONS | Dev   | Story 1.1  |
| R-002   | OPS      | EF Core initial migration fails or `dotnet ef database update` errors against PostgreSQL 18   | 2           | 3      | 6     | Run migration in CI against a disposable PostgreSQL container; validate `siesa_agents_db` creation   | Dev   | Story 1.3  |
| R-003   | BUS      | NavigationRail/NavigationBar components from siesa-ui-kit not rendering correctly on mobile viewport (< 1024px breakpoint) | 2 | 3 | 6 | Run responsive E2E test at 375px and 1280px viewports with Playwright; verify mobile nav accessibility | QA    | Story 1.2  |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                                                              | Probability | Impact | Score | Mitigation                                                                         | Owner |
|---------|----------|------------------------------------------------------------------------------------------|-------------|--------|-------|------------------------------------------------------------------------------------|-------|
| R-004   | TECH     | TypeScript strict mode causes compilation failures on missing type annotations in generated code | 2 | 2   | 4     | Verify `tsc --noEmit` exits with 0 in CI as part of build check                    | Dev   |
| R-005   | OPS      | Scalar API documentation page fails to load at `/scalar` due to incorrect registration   | 2           | 2      | 4     | Integration test: HTTP GET `/scalar` returns 200 after `dotnet run`                | Dev   |
| R-006   | TECH     | TanStack Router deep linking fails for `/clientes` and `/contactos` on direct URL access (no base href configured) | 2 | 2 | 4 | E2E test: navigate directly to each route; verify correct view renders without redirect | QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                                                               | Probability | Impact | Score | Action  |
|---------|----------|-------------------------------------------------------------------------------------------|-------------|--------|-------|---------|
| R-007   | OPS      | Backend dev port 5000 conflicts with another local process                                | 1           | 2      | 2     | Monitor — document port in README; fallback to 5001 HTTPS |
| R-008   | BUS      | 404 / not-found route displays unstyled or blank page (poor UX baseline)                  | 1           | 2      | 2     | Monitor — verify 404 renders gracefully in P1 test       |
| R-009   | TECH     | `ApplySnakeCaseNaming()` not called last in `OnModelCreating`, causing column name mismatch | 1          | 3      | 3     | Unit test on `AppDbContext`: verify snake_case naming applied to entity columns     |

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

**Criteria**: Blocks core journey + High risk (≥6) + No workaround exists

| Requirement / AC                                          | Test Level  | Risk Link | Test Count | Owner | Notes                                       |
|-----------------------------------------------------------|-------------|-----------|------------|-------|---------------------------------------------|
| AC-E1.1: App loads, navigation structure visible (desktop) | E2E         | R-003     | 2          | QA    | Viewport 1280×800; check NavigationRail present |
| AC-E1.1: App loads, navigation structure visible (mobile)  | E2E         | R-003     | 1          | QA    | Viewport 375×667; check NavigationBar present instead of rail |
| AC-E1.2: Navigate Clientes ↔ Contactos without full reload | E2E         | R-006     | 1          | QA    | Confirm no full page reload (no navigation event) between sections |
| CORS: Frontend calls backend without CORS error           | API         | R-001     | 1          | Dev   | Preflight OPTIONS + actual GET to `/api/v1/clientes` from port 5173 origin |
| Backend starts, Scalar loads at `/scalar`                 | API         | R-005     | 1          | Dev   | HTTP GET `/scalar` returns 200 OK after `dotnet run` |

**Total P0:** 6 tests, 12 hours

### P1 (High) — Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement / AC                                                             | Test Level | Risk Link | Test Count | Owner | Notes                                                        |
|------------------------------------------------------------------------------|------------|-----------|------------|-------|--------------------------------------------------------------|
| AC-E1.3: Deep link `/clientes` renders correct view directly                 | E2E        | R-006     | 1          | QA    | Load URL directly, verify ClientesView renders               |
| AC-E1.3: Deep link `/contactos` renders correct view directly                | E2E        | R-006     | 1          | QA    | Load URL directly, verify ContactosView renders              |
| Unknown route displays 404 view (not blank)                                  | E2E        | R-008     | 1          | QA    | Navigate to `/ruta-inexistente`; expect not-found component  |
| Frontend compiles with TypeScript strict mode (`tsc --noEmit` = 0)           | Unit/Build | R-004     | 1          | Dev   | CI build check; treated as a single gated test               |
| `npm run dev` starts Vite on 5173 with no errors                             | API        | R-004     | 1          | Dev   | Verify dev server process health + port listen               |
| `dotnet run` starts backend on port 5000 with no errors                       | API        | R-002     | 1          | Dev   | Process health check + port 5000 open                        |
| Clean Architecture: 4 projects referenced correctly in .sln                  | Unit       | R-004     | 1          | Dev   | `dotnet build SiesaAgents.sln` exits 0; verify project refs  |
| `dotnet ef database update` creates `siesa_agents_db` without errors          | API        | R-002     | 1          | Dev   | Integration test against Postgres container                  |
| Problem Details RFC 7807 format returned on unhandled exception               | API        | -         | 1          | Dev   | Force exception via test endpoint; verify `status`, `title`, `detail` fields; no stack trace |

**Total P1:** 9 tests, 9 hours

### P2 (Medium) — Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement / AC                                                                     | Test Level | Risk Link | Test Count | Owner | Notes                                                       |
|--------------------------------------------------------------------------------------|------------|-----------|------------|-------|-------------------------------------------------------------|
| EF Core `AppDbContext`: `ApplySnakeCaseNaming()` correctly maps entity properties     | Unit       | R-009     | 2          | Dev   | Test via `IModel` reflection: verify `ClienteEntity.Nombre` → column `nombre` |
| EF Core migrations folder exists in `SiesaAgents.Infrastructure`                     | Unit       | R-002     | 1          | Dev   | File system assertion — check `Migrations/` dir exists with at least 1 file |
| Clean Architecture dependency rules: Domain has no references to Infrastructure       | Unit       | R-004     | 1          | Dev   | `dotnet build` + reflection test: verify Domain .csproj has 0 refs to Infrastructure |

**Total P2:** 4 tests, 2 hours

### P3 (Low) — Run on-demand

**Criteria**: Nice-to-have + Exploratory + Baseline benchmarks

| Requirement                                                           | Test Level | Test Count | Owner | Notes                                                    |
|-----------------------------------------------------------------------|------------|------------|-------|----------------------------------------------------------|
| NavigationRail ARIA accessibility: items have accessible labels        | E2E        | 1          | QA    | Axe accessibility scan on desktop shell                  |
| NavigationBar ARIA accessibility: items accessible and tappable        | E2E        | 1          | QA    | Axe accessibility scan on mobile viewport                |
| Backend startup time benchmark (< 5s)                                  | API        | 1          | Dev   | Time `dotnet run` until Scalar page responds             |
| Vite HMR hot-reload baseline smoke                                     | E2E        | 1          | Dev   | Change a file, verify browser reflects update < 3s       |

**Total P3:** 4 tests, 1 hour

---

## Execution Order

### Smoke Tests (< 5 min)

**Purpose:** Fast feedback — catch build-breaking and startup issues

- [ ] Frontend starts Vite on port 5173 with no errors (30s)
- [ ] Backend starts on port 5000 and Scalar loads at `/scalar` (45s)
- [ ] App loads, desktop NavigationRail visible (E2E, 1 min)

**Total:** 3 scenarios

### P0 Tests (< 10 min)

**Purpose:** Critical path validation — CORS, navigation rendering, SPA routing

- [ ] App loads on desktop viewport 1280×800 — NavigationRail visible (E2E)
- [ ] App loads on mobile viewport 375×667 — NavigationBar visible, NavigationRail absent (E2E)
- [ ] Navigate Clientes → Contactos: no full page reload (E2E)
- [ ] CORS: frontend origin `http://localhost:5173` → backend OPTIONS + GET allowed (API)
- [ ] Scalar API docs page loads at `/scalar` — HTTP 200 (API)

**Total:** 5 scenarios (after smoke, so smoke item deduplicated)

### P1 Tests (< 30 min)

**Purpose:** Important feature coverage — deep linking, error handling, project setup integrity

- [ ] Direct URL `/clientes` renders ClientesView (E2E)
- [ ] Direct URL `/contactos` renders ContactosView (E2E)
- [ ] Unknown route `/ruta-inexistente` shows 404 not-found view (E2E)
- [ ] TypeScript strict build: `tsc --noEmit` exits 0 (Build)
- [ ] `dotnet build SiesaAgents.sln` exits 0 with 4 projects referenced (Build)
- [ ] `dotnet ef database update` creates `siesa_agents_db` (API/Integration)
- [ ] Unhandled exception returns Problem Details RFC 7807 — no stack trace exposed (API)

**Total:** 7 scenarios

### P2/P3 Tests (< 60 min)

**Purpose:** Full regression — naming conventions, architecture rules, accessibility

- [ ] `AppDbContext` snake_case naming applied: `nombre`, `created_at`, `cliente_id` columns (Unit)
- [ ] Domain project has 0 references to Infrastructure (Unit)
- [ ] Migrations folder exists with at least 1 migration file (Unit)
- [ ] NavigationRail ARIA accessibility scan passes (E2E, P3)
- [ ] NavigationBar mobile ARIA accessibility scan passes (E2E, P3)

**Total:** 5 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count | Hours/Test | Total Hours | Notes                                |
|-----------|-------|------------|-------------|--------------------------------------|
| P0        | 6     | 2.0        | 12          | E2E setup, CORS integration test     |
| P1        | 9     | 1.0        | 9           | Mix of E2E, API integration, build   |
| P2        | 4     | 0.5        | 2           | Unit tests, file assertions          |
| P3        | 4     | 0.25       | 1           | Accessibility + benchmark            |
| **Total** | **23**| —          | **24**      | **~3 days**                          |

### Prerequisites

**Test Data:**
- No domain test data factories required for Epic 1 (no entity CRUD)
- Empty database state (`siesa_agents_db` created via migration)

**Tooling:**
- Playwright (E2E tests) — Chromium browser minimum; test at 1280px and 375px viewports
- Vitest + xUnit (unit/integration tests)
- PostgreSQL container (Docker) for migration integration tests
- `dotnet ef` CLI tools installed

**Environment:**
- Node.js (compatible with Vite 7+) installed on CI
- .NET 10 SDK installed on CI
- PostgreSQL 18 reachable on test environment (port 5432, `siesa_agents_db` database)
- Environment variables: `VITE_API_URL=http://localhost:5000`, `ConnectionStrings__DefaultConnection` pointing to test Postgres

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions — blocks sprint completion)
- **P1 pass rate:** ≥95% (≥8 of 9 tests passing; any failure requires waiver or fix)
- **P2/P3 pass rate:** ≥90% (informational)
- **High-risk mitigations (R-001, R-002, R-003):** 100% covered before marking epic complete

### Coverage Targets

- **Critical paths (navigation shell, CORS, server startup):** ≥80%
- **Security scenarios (NFR6 — no stack trace exposure):** 100%
- **Architecture integrity (Clean Architecture, TypeScript strict):** ≥70%
- **Edge cases (unknown route, 404):** ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk items (score ≥6: R-001, R-002, R-003) unmitigated
- [ ] CORS test passes (R-001 is a total blocker — any subsequent epic depends on frontend↔backend communication)
- [ ] Problem Details RFC 7807 test passes (NFR6 requirement)

---

## Mitigation Plans

### R-001: CORS Misconfiguration (Score: 9)

**Mitigation Strategy:** In `Program.cs`, explicitly configure CORS policy:

```csharp
builder.Services.AddCors(opts => opts.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173").AllowAnyMethod().AllowAnyHeader()));
app.UseCors();
```

Add an API integration test that sends a preflight OPTIONS request with `Origin: http://localhost:5173` and verifies `Access-Control-Allow-Origin` header in response.

**Owner:** Dev
**Timeline:** Story 1.1 implementation
**Status:** Planned
**Verification:** P0 CORS API test passes in CI

### R-002: EF Core Migration Against PostgreSQL (Score: 6)

**Mitigation Strategy:** Add a CI job that spins up a PostgreSQL 18 container via Docker, runs `dotnet ef database update`, and asserts `siesa_agents_db` exists with 0 errors. Connection string pulled from environment variable — no hardcoded credentials.

**Owner:** Dev
**Timeline:** Story 1.3 implementation
**Status:** Planned
**Verification:** P1 integration test `dotnet ef database update` exits 0 on CI

### R-003: NavigationRail/NavigationBar Responsive Rendering (Score: 6)

**Mitigation Strategy:** Write Playwright E2E tests at two viewport sizes:
- Desktop: 1280×800 — assert `NavigationRail` component is visible, `NavigationBar` is hidden/absent
- Mobile: 375×667 — assert `NavigationBar` is visible, `NavigationRail` is hidden/absent

Use `data-testid` attributes on both components for reliable selectors.

**Owner:** QA
**Timeline:** Story 1.2 implementation
**Status:** Planned
**Verification:** P0 E2E tests for both viewport sizes pass

---

## Assumptions and Dependencies

### Assumptions

1. PostgreSQL 18 is available on the local and CI environment at port 5432 with a database user that can create `siesa_agents_db`.
2. `siesa-ui-kit` `NavigationRail` and `NavigationBar` components are importable and follow the documented responsive breakpoint (lg: 1024px) from the architecture specification.
3. No authentication is required in Epic 1 — all routes are publicly accessible (explicit PRD decision: no auth in MVP).
4. The Playwright E2E test framework will be initialized separately via the `testarch-framework` workflow before ATDD execution.

### Dependencies

1. `testarch-framework` workflow — test framework initialized (Playwright configured, Vitest configured) — Required before Story 1.2 ATDD
2. `siesa-ui-kit` package available in npm registry — Required for Story 1.2 implementation
3. PostgreSQL 18 Docker image available in CI — Required for Story 1.3 integration test

### Risks to Plan

- **Risk:** `siesa-ui-kit` package is internal and may not be published in a registry accessible in CI
  - **Impact:** E2E navigation tests would require the frontend to build successfully first
  - **Contingency:** Use a local npm link or internal npm registry; document access instructions
- **Risk:** EF Core 10 and Npgsql may have compatibility issues with PostgreSQL 18 syntax
  - **Impact:** Migration fails with SQL error
  - **Contingency:** Test against PostgreSQL 16 if 18 is unavailable; update when 18 is stable

---

## Test Level Strategy Summary

For Epic 1 (foundation/infrastructure), the test distribution is weighted toward API-level and E2E due to the nature of the deliverables (server startup, routing, CORS, navigation shell). Business logic unit tests are minimal because Epic 1 contains no domain logic.

| Level     | Test Count | Percentage | Rationale                                                               |
|-----------|------------|------------|-------------------------------------------------------------------------|
| E2E       | 9          | 39%        | Navigation shell, routing, responsive behavior — must validate in browser |
| API       | 7          | 30%        | Backend startup, CORS, Problem Details, migration — HTTP-level contracts |
| Unit      | 5          | 22%        | Architecture rules, naming conventions, TypeScript build                 |
| Component | 2          | 9%         | Accessibility scans (P3 only)                                           |
| **Total** | **23**     | 100%       |                                                                         |

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests for this epic before implementation (separate workflow; not auto-run).
- Run `*automate` after implementation to expand coverage on P1/P2 scenarios.
- Run `*trace` after implementation to produce the traceability matrix and emit quality gate decision.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: — Date: —
- [ ] Tech Lead: — Date: —
- [ ] QA Lead: — Date: —

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories, gate decision engine)
- `probability-impact.md` — Probability × impact matrix methodology
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision
- `test-priorities-matrix.md` — P0-P3 automated priority calculation

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- PRD Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Date:** 2026-06-30
