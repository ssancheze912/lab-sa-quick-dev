# Test Design: Epic 1 - Project Foundation & Application Shell

**Date:** 2026-06-25
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic Source:** `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`

---

## Executive Summary

**Scope:** Full test design for Epic 1 — Project Foundation & Application Shell

This epic establishes the technical skeleton: frontend (Vite + React + TanStack Router) and backend (.NET 10 Clean Architecture) initialization, the navigation shell (NavigationRail / NavigationBar), and the PostgreSQL + EF Core data foundation. No domain entities are defined in this epic; the migration produced is intentionally empty.

**Risk Summary:**

- Total risks identified: 8
- High-priority risks (score >= 6): 2
- Critical categories: OPS, TECH, BUS

**Coverage Summary:**

- P0 scenarios: 5 (10 hours)
- P1 scenarios: 7 (7 hours)
- P2/P3 scenarios: 9 (4.5 hours)
- **Total effort:** 21.5 hours (~3 days)

---

## Risk Assessment

### High-Priority Risks (Score >= 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | OPS | `dotnet run` or `npm run dev` fail on a clean machine due to missing dependencies, wrong SDK version, or missing PostgreSQL instance, blocking all subsequent development | 3 | 3 | 9 | Write explicit smoke tests that assert server startup; document exact SDK versions (Node 20+, .NET 10, PostgreSQL 18+); add pre-flight checks to README | DEV | Sprint 0 |
| R-002 | TECH | CORS misconfiguration causes frontend (port 5173) to be blocked by the backend (port 5000), making all API calls fail silently in browser | 2 | 3 | 6 | Integration test validates CORS preflight response headers; E2E test makes a real cross-origin request and confirms no network error | DEV | Story 1.1 |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-003 | TECH | TypeScript strict mode compilation errors from partial or incorrect dependency wiring break the build | 2 | 2 | 4 | CI step: `tsc --noEmit` as part of the build gate | DEV |
| R-004 | BUS | Mobile NavigationBar not rendered when viewport is below lg:1024px breakpoint — users on mobile cannot navigate | 2 | 2 | 4 | Component-level test at 375px viewport; E2E on mobile viewport confirms NavigationBar visible and NavigationRail hidden | QA |
| R-005 | TECH | TanStack Router deep-link to `/clientes` or `/contactos` redirects to home instead of rendering the correct view | 2 | 2 | 4 | E2E test navigates directly to URL and verifies correct view renders (no redirect) | QA |
| R-006 | DATA | EF Core `dotnet ef database update` fails due to connection string misconfiguration or missing PostgreSQL role, leaving DB non-existent | 2 | 2 | 4 | API integration test verifies DB connection is healthy on startup; migration script tested in CI with a PostgreSQL test service | DEV |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-007 | OPS | snake_case naming convention not applied in `OnModelCreating` causes column name mismatch on first migration | 1 | 2 | 2 | Unit test for `AppDbContext` configuration verifies `ApplySnakeCaseNaming()` is called; code review checklist | DEV |
| R-008 | BUS | 404/not-found route missing — unknown URLs cause unhandled exception or blank screen instead of graceful view | 1 | 2 | 2 | E2E test navigates to `/ruta-inexistente` and verifies a 404/not-found component is rendered | QA |

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

**Criteria:** Blocks core journey + High risk (>= 6) + No workaround

| Requirement | Acceptance Criterion | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ------------------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E1.1: App loads with navigation structure | App loads and navigation is visible on desktop | E2E | R-001 | 1 | QA | Playwright; assert NavigationRail visible |
| AC-E1.1: App loads with navigation structure | App loads and navigation is visible on mobile | E2E | R-001, R-004 | 1 | QA | Playwright at 375px viewport; assert NavigationBar visible |
| Frontend-backend CORS (Story 1.1) | Frontend request to backend returns 200, no CORS error | API/Integration | R-002 | 1 | DEV | Use Playwright network intercept or Vitest + MSW real CORS check |
| AC-E1.2: SPA navigation (Story 1.2) | Clicking "Clientes" navigates to `/clientes` without full page reload | E2E | R-001 | 1 | QA | Assert no full navigation event; URL changes, page does not hard-refresh |
| AC-E1.2: SPA navigation (Story 1.2) | Clicking "Contactos" navigates to `/contactos` without full page reload | E2E | R-001 | 1 | QA | Assert no full navigation event |

**Total P0:** 5 tests, 10 hours

---

### P1 (High) — Run on PR to main

**Criteria:** Important features + Medium risk (3–4) + Common workflows

| Requirement | Acceptance Criterion | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ------------------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E1.3: Deep linking (Story 1.2) | Direct URL `/clientes` renders ClientesView — no redirect | E2E | R-005 | 1 | QA | Playwright page.goto('/clientes') — verify heading/element |
| AC-E1.3: Deep linking (Story 1.2) | Direct URL `/contactos` renders ContactosView — no redirect | E2E | R-005 | 1 | QA | Playwright page.goto('/contactos') |
| Story 1.2: 404 route | Unknown route shows 404 view, not blank screen | E2E | R-008 | 1 | QA | page.goto('/ruta-inexistente'); assert 404 component |
| Story 1.2: Mobile breakpoint | NavigationRail hidden on mobile viewport | Component | R-004 | 1 | DEV | Vitest + RTL; render at 375px; assert rail not visible |
| Story 1.2: Desktop breakpoint | NavigationBar hidden on desktop viewport | Component | R-004 | 1 | DEV | Vitest + RTL; render at 1280px; assert bar not visible |
| Story 1.3: DB connection | Backend starts and DB connection is healthy | API | R-006 | 1 | DEV | Health-check endpoint or `/scalar` loads without DB error |
| Story 1.3: Problem Details format | Unhandled exception returns Problem Details RFC 7807 with no stack trace | API | — | 1 | DEV | Trigger intentional exception; assert `status`, `title`, `detail` present; assert no `stackTrace` field |

**Total P1:** 7 tests, 7 hours

---

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary features + Low risk (1–2) + Edge cases

| Requirement | Acceptance Criterion | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ------------------- | ---------- | --------- | ---------- | ----- | ----- |
| Story 1.1: TypeScript strict compilation | `tsc --noEmit` exits 0 — no type errors | Unit/CI | R-003 | 1 | DEV | Run as part of lint step; not a Vitest test |
| Story 1.3: snake_case DB naming | `AppDbContext.OnModelCreating` calls `ApplySnakeCaseNaming()` | Unit | R-007 | 1 | DEV | xUnit test using InMemory or Sqlite provider; verify generated SQL or entity configs |
| Story 1.1: Frontend dev server startup | `npm run dev` starts Vite on port 5173 with no errors | API/Smoke | R-001 | 1 | DEV | Script-level check; assert process exits 0 or health URL responds |
| Story 1.1: Backend dev server startup | `dotnet run` starts API on port 5000; `/scalar` loads | API/Smoke | R-001 | 1 | DEV | HTTP GET `/scalar` returns 200 |
| Story 1.3: EF Core migration | `dotnet ef database update` creates `siesa_agents_db` without errors | OPS | R-006 | 1 | DEV | Integration test with test PostgreSQL instance |

**Total P2:** 5 tests, 2.5 hours

---

### P3 (Low) — Run on-demand

**Criteria:** Nice-to-have + Exploratory + Lower-impact edge cases

| Requirement | Test Level | Test Count | Owner | Notes |
| ----------- | ---------- | ---------- | ----- | ----- |
| Story 1.1: 4 Clean Architecture project references in solution | Unit/Build | 1 | DEV | `dotnet build` with reference check; verify project count |
| Story 1.2: Navigation items are tappable on mobile (ARIA) | E2E | 1 | QA | Playwright mobile; assert items have accessible roles and are clickable |
| Story 1.1: CORS — exact origin allowed | API | 1 | DEV | Verify `Access-Control-Allow-Origin: http://localhost:5173` in response header |
| Story 1.3: DateTimeOffset fields — no DateTime usage | Unit | 1 | DEV | Code analysis / unit test verifying entity field types |

**Total P3:** 4 tests, 2 hours

---

## Execution Order

### Smoke Tests (< 5 min)

**Purpose:** Catch environment or build-breaking issues before running full suite

- [ ] Frontend dev server responds on port 5173 (30s)
- [ ] Backend dev server responds on port 5000 / `/scalar` loads (45s)
- [ ] App loads in browser — NavigationRail visible on desktop (1 min)

**Total:** 3 scenarios

---

### P0 Tests (< 10 min)

**Purpose:** Critical path validation — must pass on every commit

- [ ] App loads with NavigationRail on desktop (E2E)
- [ ] App loads with NavigationBar on mobile 375px (E2E)
- [ ] Frontend request to backend — no CORS error (API/Integration)
- [ ] Click "Clientes" navigates SPA-style, no page reload (E2E)
- [ ] Click "Contactos" navigates SPA-style, no page reload (E2E)

**Total:** 5 scenarios

---

### P1 Tests (< 30 min)

**Purpose:** Important feature and integration coverage — run on PR to main

- [ ] Direct URL `/clientes` renders ClientesView without redirect (E2E)
- [ ] Direct URL `/contactos` renders ContactosView without redirect (E2E)
- [ ] Unknown route renders 404 view gracefully (E2E)
- [ ] NavigationRail hidden at 375px — mobile (Component)
- [ ] NavigationBar hidden at 1280px — desktop (Component)
- [ ] Backend DB health check passes on startup (API)
- [ ] Unhandled exception returns Problem Details RFC 7807, no stack trace (API)

**Total:** 7 scenarios

---

### P2/P3 Tests (< 60 min)

**Purpose:** Full regression, edge cases, and compliance validation

- [ ] TypeScript strict compilation exits 0 (CI)
- [ ] `ApplySnakeCaseNaming()` called in `OnModelCreating` (Unit)
- [ ] EF Core migration creates `siesa_agents_db` (Integration)
- [ ] `dotnet build` — 4 CA projects referenced correctly (Build)
- [ ] Navigation items are tappable on mobile (ARIA) (E2E)
- [ ] CORS header `Access-Control-Allow-Origin` is exactly `http://localhost:5173` (API)
- [ ] Entity timestamp fields are `DateTimeOffset`, not `DateTime` (Unit)

**Total:** 7 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| -------- | ----- | ---------- | ----------- | ----- |
| P0 | 5 | 2.0 | 10.0 | Environment + Playwright setup cost |
| P1 | 7 | 1.0 | 7.0 | Standard coverage |
| P2 | 5 | 0.5 | 2.5 | Simple scenarios |
| P3 | 4 | 0.5 | 2.0 | Exploratory / compliance |
| **Total** | **21** | **—** | **21.5** | **~3 days** |

### Prerequisites

**Test Data:**

- No domain data factories needed for Epic 1 (no entities created)
- PostgreSQL test instance for migration integration test (Docker Compose or CI service)

**Tooling:**

- Playwright (latest) for E2E and mobile viewport tests
- Vitest + @testing-library/react for component tests
- xUnit for backend unit and integration tests
- PostgreSQL 18+ test service in CI (GitHub Actions `services:` block)
- `tsc --noEmit` in lint pipeline for TypeScript strict check

**Environment:**

- Node.js 20+ with npm
- .NET 10 SDK
- PostgreSQL 18+ local instance with `siesa_agents_db` database role
- Ports 5173 (frontend) and 5000 (backend) available and not blocked by firewall

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions — all 5 critical path tests must pass)
- **P1 pass rate:** >= 95% (at most 1 failure with documented waiver)
- **P2/P3 pass rate:** >= 90% (informational)
- **High-risk mitigations (R-001, R-002):** 100% complete or approved waivers

### Coverage Targets

- **Critical paths (app load, SPA navigation, deep linking):** >= 80%
- **Security / error handling (Problem Details, no stack trace):** 100%
- **Infrastructure setup (DB, CORS, TypeScript):** >= 70%
- **Edge cases (mobile breakpoint, 404, ARIA):** >= 50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass before merging any story to main
- [ ] No high-risk (score >= 6) items — R-001 and R-002 — unmitigated at epic close
- [ ] Problem Details RFC 7807 test (no stack trace exposure) passes 100%
- [ ] CORS integration test passes — frontend can reach backend without browser block

---

## Mitigation Plans

### R-001: Development server startup failure on clean machine (Score: 9)

**Mitigation Strategy:** Smoke tests assert both servers start and respond (Vite on 5173, .NET on 5000). README documents exact SDK versions. CI pipeline runs both startup checks as the first job. Developer onboarding checklist created.
**Owner:** DEV
**Timeline:** Story 1.1 completion
**Status:** Planned
**Verification:** P0 smoke tests pass; CI green on first pull

---

### R-002: CORS misconfiguration blocks frontend-backend communication (Score: 6)

**Mitigation Strategy:** API integration test sends a preflight OPTIONS request from `http://localhost:5173` origin and asserts `Access-Control-Allow-Origin` header value. E2E Playwright test makes a real API call from the browser and confirms no network error in console.
**Owner:** DEV
**Timeline:** Story 1.1 completion
**Status:** Planned
**Verification:** P0 CORS integration test passes; Playwright E2E shows no CORS error in browser console

---

## Assumptions and Dependencies

### Assumptions

1. PostgreSQL 18+ is available locally or as a Docker container; connection string is configured via `appsettings.Development.json`.
2. `siesa-ui-kit` provides `NavigationRail` and `NavigationBar` components that accept the responsive breakpoint logic described in the UX spec.
3. The Playwright test framework will be set up by the `testarch-framework` workflow; this design assumes it is already initialized or will be initialized in parallel with Epic 1 execution.
4. No authentication is required in this epic — all endpoints and routes are publicly accessible (consistent with PRD decision: no auth in MVP).

### Dependencies

1. Playwright test framework initialized — required before P0 E2E tests can run
2. PostgreSQL 18+ service available in CI — required before migration integration test (P2)
3. `siesa-ui-kit` npm package published and installable — required before component and E2E tests for navigation

### Risks to Plan

- **Risk:** PostgreSQL is not available in CI environment
  - **Impact:** Migration test (P2) cannot run; OPS gap
  - **Contingency:** Use GitHub Actions `services: postgres:` to spin up PostgreSQL as a CI service container

- **Risk:** Playwright not yet initialized when Epic 1 stories begin
  - **Impact:** P0 E2E tests cannot run immediately
  - **Contingency:** Run `testarch-framework` workflow before Story 1.2; in the interim, manually verify AC-E1.1 and AC-E1.2

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before Story 1.1/1.2/1.3 implementation begins.
- Run `*automate` for broader coverage after implementation is complete.
- Run `*nfr` to validate NFR1 (search < 1s) and NFR2 (CRUD < 2s) once Epic 2 entities exist.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: SiesaTeam  Date: ___________
- [ ] Tech Lead: SiesaTeam  Date: ___________
- [ ] QA Lead: SiesaTeam  Date: ___________

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (6 categories)
- `probability-impact.md` — Risk scoring methodology (P x I matrix)
- `test-levels-framework.md` — E2E vs API vs Component vs Unit decision framework
- `test-priorities-matrix.md` — P0–P3 automated priority calculation

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd/index.md`
- Epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design`
**Version:** 4.0 (BMad v6)
**Epic:** 1 — Project Foundation & Application Shell
