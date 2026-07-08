# Test Design: Epic 1 - Project Foundation & Application Shell

**Date:** 2026-07-08
**Author:** SiesaTeam
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 1 (Project Foundation & Application Shell)

Epic 1 establishes the technical foundation of Siesa-Agents: frontend (Vite + React 18 + TypeScript strict + TanStack Router/Query) and backend (.NET 10 Clean Architecture + EF Core 10 + PostgreSQL 18) projects initialized and running, the navigation shell (NavigationRail/NavigationBar from siesa-ui-kit) wired for desktop and mobile, deep linking working, and the database/migrations/error-handling foundation in place for Epics 2-4 to build entities on top of.

This epic has **no business-logic acceptance criteria** (no CRUD, no domain entities) — risk is concentrated in **environment/tooling setup (TECH)**, **cross-origin wiring (SEC/TECH)**, and **routing/responsive behavior (BUS)**. Because it is foundational, any gap here blocks or destabilizes all downstream epics.

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (≥6): 3
- Critical categories: TECH, OPS, SEC

**Coverage Summary:**

- P0 scenarios: 11 (22 hours)
- P1 scenarios: 9 (9 hours)
- P2/P3 scenarios: 8 (3 hours)
- **Total effort**: 34 hours (~4.5 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------------ | ------- | -------- |
| R-001 | TECH | Clean Architecture project references misconfigured (API → Application → Domain → Infrastructure) causing runtime DI failures or circular references that only surface later when Epic 2/3 add handlers | 2 | 3 | 6 | Verify `dotnet build` succeeds and each project only references the correct lower layer; add a solution-level build check in CI story | Dev | Story 1.1 |
| R-002 | SEC/TECH | CORS misconfiguration blocks (or over-permits) frontend↔backend calls — either breaks all future features or opens the API to arbitrary origins in later environments | 2 | 3 | 6 | Explicit `localhost:5173`-only CORS policy in dev; automated API test asserting `Access-Control-Allow-Origin` header; revisit policy before any non-local deployment (NFR4) | Dev | Story 1.1 |
| R-003 | OPS | Global exception middleware fails to catch an exception type (e.g., thrown before middleware registration order) and a stack trace leaks to the client, violating NFR6 and exposing internals | 2 | 3 | 6 | Order-of-registration test + integration test forcing an unhandled exception and asserting Problem Details shape with no stack trace | Dev/QA | Story 1.3 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------------ | ------- |
| R-004 | TECH | `ApplySnakeCaseNaming()` not applied last (or omitted) in `OnModelCreating`, causing PascalCase columns to leak into Postgres, silently breaking Epic 2/3 EF configurations | 2 | 2 | 4 | Migration snapshot review test asserting generated SQL uses snake_case identifiers | Dev | 
| R-005 | BUS | NavigationRail/NavigationBar breakpoint logic misfires at the 1024px boundary, showing both or neither nav variant on tablet-sized viewports | 2 | 2 | 4 | Component/E2E viewport tests at 1023px/1024px/1025px boundaries | Dev/QA |
| R-006 | TECH | TanStack Router deep link to `/clientes` or `/contactos` renders a blank/loading shell forever because the route isn't registered in `routeTree.gen.ts` before the placeholder views exist | 2 | 2 | 4 | E2E test hitting each route directly via URL (not via in-app navigation) | QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------- |
| R-007 | OPS | `dotnet ef database update` fails silently in a fresh dev environment if Postgres connection string/env var is wrong, wasting onboarding time | 1 | 2 | 2 | Monitor — document `.env`/`appsettings.Development.json` setup in README |
| R-008 | BUS | 404/not-found view is generic/unstyled and does not use siesa-ui-kit, causing a jarring UX inconsistency (no functional risk) | 1 | 1 | 1 | Monitor |
| R-009 | TECH | Vite TypeScript strict mode is later silently disabled by a config drift PR, reintroducing type-safety gaps | 1 | 1 | 1 | Monitor — covered by `tsconfig.json` compiling with `--noEmit` in CI (Story 1.1 follow-on) |

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
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| `npm run dev` starts Vite on 5173, no console errors | API/Smoke | R-009 | 1 | QA | e2e/tests/foundation (already scaffolded) |
| `dotnet run` starts API on 5000 and `/scalar` loads | API | R-001 | 1 | QA | backend-initialization.api.spec.ts covers this shape |
| Four Clean Architecture projects reference correctly (solution builds) | Unit/Build | R-001 | 1 | Dev | `dotnet build` in CI, not a runtime test but a gate |
| CORS allows `localhost:5173` → backend without errors | API | R-002 | 2 | QA | Positive case + negative case (disallowed origin rejected) |
| Unhandled backend exception returns Problem Details (no stack trace) | API | R-003 | 2 | QA | Force 500 via test-only trigger endpoint or fault injection |
| `dotnet ef database update` creates `siesa_agents_db` with no errors | Integration | R-007 | 1 | Dev | Run against ephemeral/test Postgres instance |
| NavigationRail visible on desktop viewport with Clientes/Contactos entries | E2E | R-005 | 1 | QA | Desktop viewport ≥1024px |
| Clicking Clientes/Contactos navigates without full page reload | E2E | R-006 | 1 | QA | Assert no `window.load` event fires, only route change |
| NavigationBar (mobile) visible and tappable on mobile viewport | E2E | R-005 | 1 | QA | Mobile viewport <1024px |

**Total P0**: 11 tests, 22 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| Direct URL access to `/clientes` renders correct view (deep link) | E2E | R-006 | 1 | QA | No redirect to home |
| Direct URL access to `/contactos` renders correct view (deep link) | E2E | R-006 | 1 | QA | No redirect to home |
| Unknown route shows 404/not-found view gracefully | E2E | R-008 | 1 | QA | |
| EF Core migrations folder exists with initial empty migration | Unit/Static | R-004 | 1 | Dev | Verify no `ClienteEntity`/`ContactoEntity` defined yet (scope guard) |
| Generated SQL/migration snapshot uses snake_case column names | Integration | R-004 | 1 | Dev | Assert on migration `Up()` SQL or `information_schema` |
| Viewport boundary at exactly 1024px picks correct nav variant | Component | R-005 | 2 | Dev | 1023px → mobile, 1024px → desktop (per breakpoint decision) |
| TypeScript strict mode compiles with zero errors (`tsc --noEmit`) | Static | R-009 | 1 | Dev | CI gate |
| All navigation items in mobile NavigationBar are reachable via keyboard/tap target size | Component | R-005 | 1 | QA | Accessibility smoke check |

**Total P1**: 9 tests, 9 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| Repeated `dotnet ef database update` is idempotent (no duplicate migration errors) | Integration | R-007 | 1 | Dev | |
| Backend responds correctly when Postgres is temporarily unavailable at startup | Integration | R-007 | 1 | Dev | Fails fast with clear log, not silent hang |
| Root path `/` behavior (redirect vs shell) is stable across reloads | E2E | R-006 | 1 | QA | |
| Browser back/forward buttons behave correctly across `/clientes` ↔ `/contactos` | E2E | - | 1 | QA | |
| 404 view styling uses siesa-ui-kit primitives (non-blocking cosmetic check) | Component | R-008 | 1 | Dev | |

**Total P2**: 5 tests, 2.5 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
| ------------- | ---------- | ---------- | ----- | ------- |
| Cross-browser smoke (Firefox, Edge) of nav shell rendering | E2E | 2 | QA | Playwright config already has firefox/edge projects |
| Cold-start time of `npm run dev` / `dotnet run` benchmarked for regression tracking | Perf | 1 | Dev | Informational only, no gate |

**Total P3**: 3 tests, 0.75 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Frontend dev server starts, no console errors (30s)
- [ ] Backend `/scalar` loads (30s)
- [ ] NavigationRail renders on desktop load (45s)

**Total**: 3 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] Backend/Frontend startup + Clean Architecture build gate
- [ ] CORS positive/negative
- [ ] Exception middleware → Problem Details (no stack trace)
- [ ] `dotnet ef database update` succeeds
- [ ] Desktop NavigationRail + navigation without reload
- [ ] Mobile NavigationBar visible/tappable

**Total**: 11 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] Deep linking `/clientes`, `/contactos`
- [ ] 404 view
- [ ] Snake_case migration verification
- [ ] Breakpoint boundary tests (1023/1024px)
- [ ] TypeScript strict compile gate

**Total**: 9 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] EF migration idempotency / DB-unavailable handling
- [ ] Browser back/forward navigation
- [ ] Cross-browser smoke (Firefox/Edge)
- [ ] Cold-start benchmarks (informational)

**Total**: 8 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| --------- | ----- | ---------- | ------------ | ----------------------- |
| P0 | 11 | 2.0 | 22 | Complex setup (CORS, exception injection, DB) |
| P1 | 9 | 1.0 | 9 | Standard coverage |
| P2 | 5 | 0.5 | 2.5 | Simple scenarios |
| P3 | 3 | 0.25 | 0.75 | Exploratory/benchmark |
| **Total** | **28** | **-** | **34.25** | **~4.5 days** |

### Prerequisites

**Test Data:**

- No domain fixtures needed (Epic 1 has no entities) — only environment/config fixtures
- `data.helper.ts` (already scaffolded in `e2e/helpers/`) can host viewport/URL constants for foundation tests

**Tooling:**

- Playwright (already initialized — `playwright.config.ts`, `e2e/` scaffold with chromium/firefox/edge projects) for E2E
- xUnit (backend, per architecture.md `SiesaAgents.UnitTests` / `SiesaAgents.IntegrationTests`) for build/DI, CORS, and exception-middleware tests
- `dotnet build` / `tsc --noEmit` as static/CI gates rather than runtime tests
- Ephemeral or local test PostgreSQL instance for migration tests

**Environment:**

- Frontend dev server on 5173, backend on 5000/5001 (per architecture.md)
- Local PostgreSQL 18+ instance (`siesa_agents_db`)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: ≥80% (startup, CORS, exception handling, navigation, deep linking)
- **Security scenarios**: 100% (CORS positive/negative, no-stack-trace-exposure)
- **Business logic**: N/A for this epic (no domain logic yet)
- **Edge cases**: ≥50% (404 route, viewport boundaries, DB-unavailable)

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated (R-001, R-002, R-003)
- [ ] Security tests (CORS, no-stack-trace) pass 100%
- [ ] `dotnet build` and `tsc --noEmit` are green in CI before any Epic 2 story starts

---

## Mitigation Plans

### R-001: Clean Architecture project reference misconfiguration (Score: 6)

**Mitigation Strategy:** Add explicit `dotnet build` verification as a CI/local gate immediately after Story 1.1; review `.csproj` `<ProjectReference>` entries against architecture.md's layering (API→Application→Domain, Infrastructure→Application→Domain) to catch inverted or missing references before any handler code is written.
**Owner:** Dev
**Timeline:** Story 1.1 completion
**Status:** Planned
**Verification:** `dotnet build` exits 0; manual review of `.csproj` reference graph

### R-002: CORS misconfiguration (Score: 6)

**Mitigation Strategy:** Configure CORS policy explicitly for `localhost:5173` only in development (per architecture.md Authentication & Security table); add an automated API test asserting the `Access-Control-Allow-Origin` header is present for allowed origin and absent/rejected for a disallowed origin.
**Owner:** Dev
**Timeline:** Story 1.1 completion
**Status:** Planned
**Verification:** API integration test suite (positive + negative CORS case)

### R-003: Exception middleware leaking stack traces (Score: 6)

**Mitigation Strategy:** Register `ExceptionHandlingMiddleware` first in the pipeline; add an integration test that forces an unhandled exception (e.g., a test-only endpoint or a mocked handler throwing) and asserts the response is Problem Details RFC 7807 shape (status, title, detail) with no `stackTrace` field or exception message leakage.
**Owner:** Dev/QA
**Timeline:** Story 1.3 completion
**Status:** Planned
**Verification:** Integration test in `SiesaAgents.IntegrationTests`

---

## Assumptions and Dependencies

### Assumptions

1. No authentication exists in Epic 1 (confirmed by architecture.md — auth deferred post-MVP), so no auth-related test scenarios are included.
2. Epic 1 introduces no domain entities (`ClienteEntity`/`ContactoEntity` are explicitly out of scope per the epic's scope note) — coverage is limited to infrastructure, shell, and routing behavior.
3. The Playwright E2E framework (`playwright.config.ts`, `e2e/` fixtures/pages/helpers) is already scaffolded and will be extended, not created from scratch, for Epic 1 P0/P1 scenarios.
4. Breakpoint value of 1024px (`lg:`) is taken from architecture.md's "Responsive layout" cross-cutting concern as the desktop/mobile nav switch point.

### Dependencies

1. Local PostgreSQL 18+ instance available for migration and exception-handling integration tests — required before Story 1.3 tests can run.
2. `SiesaAgents.IntegrationTests` project (xUnit, per architecture.md test folder structure) must exist to host CORS and exception-middleware tests.

### Risks to Plan

- **Risk**: Epic 1 stories are implemented out of order (e.g., navigation shell before backend CORS is verified), causing P0 navigation tests to pass while masking an unverified CORS risk.
  - **Impact**: False sense of readiness before Epic 2 begins consuming the API from the frontend.
  - **Contingency**: Enforce the quality gate criteria (all P0 pass, R-001/R-002/R-003 mitigated) before marking epic-1 complete in sprint-status.yaml, regardless of story completion order.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run).
- Run `*automate` for broader coverage once implementation exists.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _____ Date: _____
- [ ] Tech Lead: _____ Date: _____
- [ ] QA Lead: _____ Date: _____

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework
- `probability-impact.md` - Risk scoring methodology
- `test-levels-framework.md` - Test level selection
- `test-priorities-matrix.md` - P0-P3 prioritization

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd/functional-requirements.md`, `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Existing E2E scaffold: `e2e/tests/foundation/project-initialization.spec.ts`, `e2e/tests/api/backend-initialization.api.spec.ts`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
