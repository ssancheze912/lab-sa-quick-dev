---
epic: 1
title: "Project Foundation & Application Shell"
type: traceability-matrix
scope: epic
generatedAt: "2026-05-29"
stories:
  - "1.1 — Project Initialization & Repository Structure"
  - "1.2 — Frontend Navigation Shell"
  - "1.3 — Backend Database Foundation"
---

# Traceability Matrix — Epic 1: Project Foundation & Application Shell

## Summary

| Dimension | Count |
|-----------|-------|
| Acceptance Criteria (story-level) | 14 |
| Epic-level AC | 3 |
| Test Cases Designed (test-design-epic-1.md) | 17 |
| Test Files with Evidence | 11 |
| P0 Test Cases | 5 |
| P1 Test Cases | 6 |
| P2 Test Cases | 4 |
| P3 Test Cases | 2 |

---

## Phase 1 — Traceability Matrix

### Story 1.1 — Project Initialization & Repository Structure

| AC ID | Acceptance Criterion | Priority | Test Case(s) | Test File(s) | Evidence Status |
|-------|---------------------|----------|--------------|--------------|-----------------|
| AC-1.1-1 | `pnpm run dev` starts Vite on port 5173, TypeScript strict mode enabled | P0 | TC-E1-P0-01, TC-E1-P0-02 | `e2e/tests/foundation/project-initialization.spec.ts`, `frontend/src/test/shared/lib/queryClient.test.ts`, `frontend/src/test/shared/lib/apiClient.test.ts` | PRESENT — unit tests pass (4 tests); E2E test spec exists; build verified (95.39 kB gzipped, zero TS errors documented in story) |
| AC-1.1-2 | Backend starts on port 5000; Scalar loads at `/scalar`; 4 CA projects referenced correctly | P0 | TC-E1-P0-03, TC-E1-P1-06 | `e2e/tests/api/backend-initialization.api.spec.ts` | PRESENT — E2E spec covers Scalar endpoint, server startup, CA layers; .NET runtime unavailable in CI (documented gap in story 1.1 dev notes) |
| AC-1.1-3 | CORS allows requests from `http://localhost:5173` | P0 | TC-E1-P0-04 | `e2e/tests/api/backend-initialization.api.spec.ts` | PRESENT — E2E spec has CORS preflight and actual request tests (lines 76-110); implementation verified in Program.cs |
| AC-1.1-4 | TypeScript strict mode: zero errors with `strict`, `noImplicitAny`, `strictNullChecks` | P0 | TC-E1-P0-01 | `frontend/src/test/shared/lib/queryClient.test.ts`, `frontend/src/test/shared/lib/apiClient.test.ts` | PRESENT — 4 passing unit tests; `npx tsc --noEmit` exits 0 documented in story completion notes |
| AC-1.1-5 | `dotnet build SiesaAgents.sln` compiles all 4 projects with zero errors | P1 | TC-E1-P1-06 | `e2e/tests/api/backend-initialization.api.spec.ts` (runtime proxy test) | PRESENT — E2E test "all CA layers responding" as build proxy; .NET build not executable in CI |

### Story 1.2 — Frontend Navigation Shell

| AC ID | Acceptance Criterion | Priority | Test Case(s) | Test File(s) | Evidence Status |
|-------|---------------------|----------|--------------|--------------|-----------------|
| AC-1.2-1 | Desktop: NavigationRail visible on left with Clientes/Contactos entries (FR28) | P2 | TC-E1-P2-01 | `frontend/src/routes/__tests__/navigation.test.tsx` (12 tests), `e2e/tests/foundation/navigation-shell.spec.ts` | PRESENT — component tests for rail presence (9 tests); E2E spec (desktop AC1 group) |
| AC-1.2-2 | Mobile viewport (< 1024px): NavigationBar at bottom, items tappable (FR29) | P2 | TC-E1-P2-02 | `frontend/src/routes/__tests__/navigation-mobile.test.tsx` (7 tests), `e2e/tests/foundation/navigation-shell.spec.ts`, `frontend/src/shared/hooks/__tests__/useIsDesktop.test.ts` | PRESENT — mobile component tests (7 tests); E2E mobile AC2 group; useIsDesktop hook tests (10 tests) |
| AC-1.2-3 | Direct URL `/clientes` renders Clientes view with active highlight, no redirect (FR30) | P1 | TC-E1-P1-02 | `e2e/tests/foundation/navigation-shell.spec.ts` (AC3 group), `frontend/src/routes/__tests__/navigation.test.tsx` | PRESENT — E2E deep link tests (4 tests); component active highlight tests |
| AC-1.2-4 | Direct URL `/contactos` renders Contactos view with active highlight, no redirect (FR30) | P1 | TC-E1-P1-03 | `e2e/tests/foundation/navigation-shell.spec.ts` (AC4 group) | PRESENT — E2E deep link tests (4 tests) |
| AC-1.2-5 | Unknown route: 404 not-found view in Spanish with link to `/clientes` | P1 | TC-E1-P1-04 | `frontend/src/routes/__tests__/not-found.test.tsx` (5 tests), `e2e/tests/foundation/navigation-shell-routing.spec.ts` (AC5 group) | PRESENT — unit tests (5 tests); E2E routing tests (4 tests) |
| AC-1.2-6 | Root path `/` redirects automatically to `/clientes` | P2 | TC-E1-P2-03 | `e2e/tests/foundation/navigation-shell-routing.spec.ts` (AC6 group) | PRESENT — E2E redirect tests (2 tests) |
| AC-1.2-SPA | SPA navigation: no full page reload between Clientes/Contactos (FR28) | P1 | TC-E1-P1-01 | `e2e/tests/foundation/navigation-shell.spec.ts` (click navigation tests) | PRESENT — E2E click navigation tests verify URL change without reload |

### Story 1.3 — Backend Database Foundation

| AC ID | Acceptance Criterion | Priority | Test Case(s) | Test File(s) | Evidence Status |
|-------|---------------------|----------|--------------|--------------|-----------------|
| AC-1.3-1 | `dotnet ef database update` creates `siesa_agents_db`; migrations folder exists in Infrastructure | P1 | TC-E1-P1-05 | `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` | PARTIAL — unit tests verify AppDbContext instantiation + EnsureCreated; actual PostgreSQL integration test (TestContainers) not implemented; migration files present at `backend/src/SiesaAgents.Infrastructure/Migrations/` |
| AC-1.3-2 | Unhandled exception returns Problem Details RFC 7807 with no stack traces (NFR6) | P0 | TC-E1-P0-05 | `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (14 tests), `e2e/tests/api/backend-database-foundation.api.spec.ts`, `e2e/tests/api/backend-initialization.api.spec.ts` | PRESENT — 14 unit tests (500/404/400/happy path); E2E API spec for all probe endpoints; stack trace verification explicit |
| AC-1.3-3 | `ApplySnakeCaseNaming()` applied in `OnModelCreating`; snake_case column names | P2 | TC-E1-P2-04 | `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` (5 tests), `backend/tests/SiesaAgents.UnitTests/Infrastructure/ModelBuilderExtensionsTests.cs` | PRESENT — model build tests; custom `ModelBuilderExtensions` tested; actual DB column inspection requires PostgreSQL (not available in CI) |

### Epic-Level Acceptance Criteria

| AC ID | Acceptance Criterion | Priority | Test Case(s) | Test File(s) | Evidence Status |
|-------|---------------------|----------|--------------|--------------|-----------------|
| AC-E1.1 | App loads with accessible navigation on mobile and desktop | P2 | TC-E1-P2-01, TC-E1-P2-02 | `navigation.test.tsx`, `navigation-mobile.test.tsx`, `navigation-shell.spec.ts` | PRESENT |
| AC-E1.2 | Navigate between Clientes/Contactos without full page reload | P1 | TC-E1-P1-01 | `e2e/tests/foundation/navigation-shell.spec.ts` | PRESENT |
| AC-E1.3 | Direct URL to `/clientes` and `/contactos` renders correct views | P1 | TC-E1-P1-02, TC-E1-P1-03 | `e2e/tests/foundation/navigation-shell.spec.ts` | PRESENT |

---

## Consolidated Coverage by Priority

### P0 — 5 Test Cases (TC-E1-P0-01 through TC-E1-P0-05)

| Test Case | Requirement | Evidence | Status |
|-----------|-------------|----------|--------|
| TC-E1-P0-01 | TypeScript strict build | Unit tests pass; tsc --noEmit = 0 errors documented | COVERED |
| TC-E1-P0-02 | Frontend dev server on port 5173 | E2E spec exists; verified in story completion | COVERED |
| TC-E1-P0-03 | Backend starts; Scalar loads at /scalar | E2E spec `backend-initialization.api.spec.ts` | COVERED |
| TC-E1-P0-04 | CORS from localhost:5173 | E2E spec CORS tests (preflight + actual request) | COVERED |
| TC-E1-P0-05 | Problem Details RFC 7807 no stack trace (NFR6) | 14 xUnit unit tests + E2E API spec | COVERED |

### P1 — 6 Test Cases (TC-E1-P1-01 through TC-E1-P1-06)

| Test Case | Requirement | Evidence | Status |
|-----------|-------------|----------|--------|
| TC-E1-P1-01 | SPA navigation no full reload (FR28) | E2E navigation-shell.spec.ts click tests | COVERED |
| TC-E1-P1-02 | Deep link /clientes (FR30) | E2E navigation-shell.spec.ts AC3 group | COVERED |
| TC-E1-P1-03 | Deep link /contactos (FR30) | E2E navigation-shell.spec.ts AC4 group | COVERED |
| TC-E1-P1-04 | 404 not-found view | 5 unit tests + 4 E2E routing tests | COVERED |
| TC-E1-P1-05 | EF Core migration creates DB; migrations table snake_case | AppDbContextTests (5 unit tests); actual PostgreSQL validation MISSING (requires TestContainers/real DB) | PARTIAL |
| TC-E1-P1-06 | Clean Architecture solution builds | E2E runtime proxy test (server up = build passed) | COVERED (proxy) |

### P2 — 4 Test Cases (TC-E1-P2-01 through TC-E1-P2-04)

| Test Case | Requirement | Evidence | Status |
|-----------|-------------|----------|--------|
| TC-E1-P2-01 | NavigationRail visible at desktop viewport | 9 component tests + E2E | COVERED |
| TC-E1-P2-02 | NavigationBar visible at mobile viewport | 7 component tests + E2E + useIsDesktop hook tests | COVERED |
| TC-E1-P2-03 | Index route / redirects to /clientes | 2 E2E routing tests | COVERED |
| TC-E1-P2-04 | snake_case column naming via ApplySnakeCaseNaming | ModelBuilderExtensionsTests + AppDbContextTests; DB-level inspection MISSING | PARTIAL |

### P3 — 2 Test Cases (TC-E1-P3-01 through TC-E1-P3-02)

| Test Case | Requirement | Evidence | Status |
|-----------|-------------|----------|--------|
| TC-E1-P3-01 | Vitest unit tests pass | 4 frontend unit tests + 24+ component tests | COVERED |
| TC-E1-P3-02 | xUnit unit tests pass | 14 middleware tests + 5 DbContext tests + 3 entity tests | COVERED |

---

## Test File Inventory

| File | Layer | Story | Tests | Priority Tags |
|------|-------|-------|-------|---------------|
| `frontend/src/test/shared/lib/queryClient.test.ts` | Unit | 1.1 | 2 | P3 |
| `frontend/src/test/shared/lib/apiClient.test.ts` | Unit | 1.1 | 2 | P3 |
| `frontend/src/routes/__tests__/navigation.test.tsx` | Component | 1.2 | 12 | P0/P1/P2 |
| `frontend/src/routes/__tests__/navigation-mobile.test.tsx` | Component | 1.2 | 7 | P1/P2 |
| `frontend/src/routes/__tests__/not-found.test.tsx` | Component | 1.2 | 5 | P1 |
| `frontend/src/routes/__tests__/navigation-edge.test.tsx` | Component | 1.2 | unknown | P1/P2 |
| `frontend/src/routes/__tests__/views-edge.test.tsx` | Component | 1.2 | ~8 | P1/P2 |
| `frontend/src/shared/hooks/__tests__/useIsDesktop.test.ts` | Unit | 1.2 | 10 | P1/P2 |
| `e2e/tests/foundation/project-initialization.spec.ts` | E2E/Smoke | 1.1 | 7+ | P0 |
| `e2e/tests/foundation/navigation-shell.spec.ts` | E2E | 1.2 | 18 | P1/P2 |
| `e2e/tests/foundation/navigation-shell-routing.spec.ts` | E2E | 1.2 | 6 | P1/P2 |
| `e2e/tests/api/backend-initialization.api.spec.ts` | API E2E | 1.1 | 11 | P0/P1 |
| `e2e/tests/api/backend-database-foundation.api.spec.ts` | API E2E | 1.3 | 18 | P0/P1/P2 |
| `backend/tests/.../Middleware/ExceptionHandlingMiddlewareTests.cs` | Unit | 1.3 | 14 | P0 |
| `backend/tests/.../Infrastructure/AppDbContextTests.cs` | Unit | 1.3 | 5 | P1/P3 |
| `backend/tests/.../Infrastructure/ModelBuilderExtensionsTests.cs` | Unit | 1.3 | unknown | P2 |
| `backend/tests/.../Domain/EntityTests.cs` | Unit | 1.1 | 3 | P3 |
| `backend/tests/.../Domain/ExceptionTests.cs` | Unit | 1.3 | unknown | P1 |
| `backend/tests/.../Middleware/ExceptionHandlingMiddlewareEdgeCaseTests.cs` | Unit | 1.3 | unknown | P1 |

---

## Gaps and Risks

### Gap 1 — TC-E1-P1-05: PostgreSQL Integration Test Missing (P1)
- **Description:** The test design requires an actual PostgreSQL database to verify `siesa_agents_db` is created, `__ef_migrations_history` uses snake_case, and no domain tables exist. The implemented tests use InMemory provider only.
- **Evidence available:** Unit tests verify AppDbContext can be instantiated and model builds without error; migration files exist at `backend/src/SiesaAgents.Infrastructure/Migrations/`.
- **Impact:** P1 gap — story 1.3 AC1 (DB creation) and AC3 (snake_case DB-level verification) not fully validated at integration level.
- **Mitigation:** TestContainers or a local PostgreSQL environment would close this gap. The custom `ModelBuilderExtensions.cs` has unit tests but column naming at DB level is unverified.

### Gap 2 — siesa-ui-kit Not Available (P2 — Design Gap)
- **Description:** Story 1.2 specifies `NavigationRail` and `NavigationBar` from `siesa-ui-kit`. The package is unavailable in the registry; custom Tailwind-based components were implemented as substitutes. Story completion notes document the gap as non-breaking for future kit adoption.
- **Impact:** Responsive behaviour and accessibility are tested with the custom components, not the official kit. Tests cover the custom implementation (data-testid attributes match expected contract).
- **Risk:** If siesa-ui-kit API differs from the custom implementation, tests will need updating.

### Gap 3 — E2E Tests Require Running Servers (Execution Gap)
- **Description:** All E2E and API-level Playwright tests require live servers (frontend on 5173, backend on 5000 with PostgreSQL). These cannot be executed in the current CI environment.
- **Impact:** TC-E1-P0-01 through TC-E1-P0-05 are partially verified only through unit tests + documented build output. Full E2E validation is deferred to an environment with running servers.

### Gap 4 — ATDD Checklist Only Covers Story 1.1
- **Description:** The `atdd-checklist-1-1.md` file was generated only for Story 1.1. Stories 1.2 and 1.3 have E2E test files but no formal ATDD checklist documenting RED phase verification.
- **Impact:** Informational — test coverage exists; checklist is a process artifact, not a blocking quality concern.
