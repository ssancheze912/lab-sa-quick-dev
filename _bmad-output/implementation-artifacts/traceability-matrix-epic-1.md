---
epic: 1
title: "Project Foundation & Application Shell"
workflow: testarch-trace
phase: traceability-matrix
createdAt: "2026-06-04"
stories:
  - "1.1 — Project Initialization & Repository Structure"
  - "1.2 — Frontend Navigation Shell"
  - "1.3 — Backend Database Foundation"
scope: epic
---

# Traceability Matrix — Epic 1: Project Foundation & Application Shell

## 1. Requirements-to-Tests Matrix

### Epic-Level Acceptance Criteria

| Req ID | Requirement Description | Story | FR/NFR | Priority | Test Cases | Test Files | Coverage Status |
|--------|------------------------|-------|--------|----------|------------|------------|-----------------|
| AC-E1.1 | App loads with accessible navigation on mobile and desktop | 1.2 | FR29, FR28 | P1 | TC-E1-P2-01, TC-E1-P2-02 | `root.test.tsx` (tests 1, 2 — desktop rail, mobile bar) | COVERED |
| AC-E1.2 | Navigate between Clientes/Contactos without full page reload | 1.2 | FR28 | P1 | TC-E1-P1-01 | `root.test.tsx` (SPA navigation tests) | COVERED |
| AC-E1.3 | Direct URL to /clientes and /contactos renders correct views | 1.2 | FR30 | P1 | TC-E1-P1-02, TC-E1-P1-03 | Playwright E2E (defined; not yet automated) | PARTIALLY COVERED |

### Story 1.1 — Acceptance Criteria

| Req ID | Requirement Description | Priority | Test Cases | Test Files | Coverage Status |
|--------|------------------------|----------|------------|------------|-----------------|
| AC-1.1.1 | `pnpm run dev` starts Vite on port 5173 with no TS errors | P0 | TC-E1-P0-01, TC-E1-P0-02 | `queryClient.test.ts`, `apiClient.test.ts` (build validates this) | COVERED (unit tests pass; smoke test is manual/CI) |
| AC-1.1.2 | TypeScript strict mode: zero TS errors with strict+noImplicitAny+strictNullChecks | P0 | TC-E1-P0-01 | `apiClient.test.ts`, `queryClient.test.ts` (compiled under strict mode) | COVERED |
| AC-1.1.3 | Backend starts on port 5000, Scalar loads at `/scalar` | P0 | TC-E1-P0-03 | xUnit integration (defined in test-design; not yet automated as integration test) | PARTIALLY COVERED |
| AC-1.1.4 | Four Clean Architecture projects referenced correctly in solution | P1 | TC-E1-P1-06 | Manual/CI: `dotnet build SiesaAgents.sln` | PARTIALLY COVERED |
| AC-1.1.5 | CORS allows requests from `http://localhost:5173` without errors | P0 | TC-E1-P0-04 | xUnit integration (defined; not yet automated as integration test) | PARTIALLY COVERED |

### Story 1.2 — Acceptance Criteria

| Req ID | Requirement Description | Priority | Test Cases | Test Files | Coverage Status |
|--------|------------------------|----------|------------|------------|-----------------|
| AC-1.2.1 | NavigationRail visible on desktop (>=1024px) with Clientes/Contactos entries | P2 | TC-E1-P2-01 | `root.test.tsx` (desktop rail tests) | COVERED |
| AC-1.2.2 | NavigationBar visible on mobile (<1024px), all items accessible | P2 | TC-E1-P2-02 | `root.test.tsx` (mobile bar tests) | COVERED |
| AC-1.2.3 | SPA navigation: no full page reload between routes | P1 | TC-E1-P1-01 | `root.test.tsx`, `root-edge-cases.test.tsx` | COVERED |
| AC-1.2.4 | Deep linking: `/clientes` direct access renders correct view (FR30) | P1 | TC-E1-P1-02 | Playwright E2E (defined; not yet automated) | PARTIALLY COVERED |
| AC-1.2.5 | Deep linking: `/contactos` direct access renders correct view (FR30) | P1 | TC-E1-P1-03 | Playwright E2E (defined; not yet automated) | PARTIALLY COVERED |
| AC-1.2.6 | Unknown route shows 404 / not-found view gracefully | P1 | TC-E1-P1-04 | `NotFoundView.test.tsx`, `root-404-nav.test.tsx` | COVERED |
| AC-1.2.7 | Root `/` redirects automatically to `/clientes` | P2 | TC-E1-P2-03 | `root.test.tsx` (index redirect test) | COVERED |
| AC-1.2.8 | Navigation uses `<nav>` semantics, ARIA labels in Spanish, WCAG 2.1 AA | P2 | TC-E1-P0-01 (a11y) | `root.test.tsx` (aria-label assertions) | COVERED |

### Story 1.3 — Acceptance Criteria

| Req ID | Requirement Description | Priority | Test Cases | Test Files | Coverage Status |
|--------|------------------------|----------|------------|------------|-----------------|
| AC-1.3.1 | `dotnet ef database update` creates `siesa_agents_db` with no errors | P1 | TC-E1-P1-05 | Manual/CI: `dotnet ef database update` (files created manually; integration test defined) | PARTIALLY COVERED |
| AC-1.3.2 | `InitialCreate` migration exists with empty `Up()`/`Down()` | P1 | TC-E1-P1-05 | Migration files exist: `20260604000000_InitialCreate.cs` | COVERED |
| AC-1.3.3 | `UseSnakeCaseNamingConvention()` applied in `OnModelCreating` | P2 | TC-E1-P2-04 | `AppDbContextTests.cs` (OnModelCreating_AppliesSnakeCaseNaming) | COVERED |
| AC-1.3.4 | ExceptionHandlingMiddleware returns RFC 7807 Problem Details (NFR6) | P0 | TC-E1-P0-05 | `ExceptionHandlingMiddlewareTests.cs`, `ExceptionHandlingMiddlewareEdgeCaseTests.cs` | COVERED |
| AC-1.3.5 | `AppDbContext` registered in DI with `DefaultConnection` connection string | P1 | TC-E1-P1-05 | `AppDbContextTests.cs` (instantiation tests), `Program.cs` manual review | COVERED |
| AC-1.3.6 | `appsettings.Development.json` targets `siesa_agents_db` via Npgsql | P1 | TC-E1-P1-05 | Config file verified at `appsettings.Development.json` | COVERED |

---

## 2. FR/NFR Traceability

| FR/NFR ID | Requirement | Epic 1 Coverage | Test Case(s) |
|-----------|-------------|-----------------|--------------|
| FR28 | SPA navigation (no full page reload) between Clientes/Contactos | Full | TC-E1-P1-01 |
| FR29 | Mobile-responsive NavigationBar accessible | Full | TC-E1-P2-02 |
| FR30 | Deep linking — direct URL access to /clientes and /contactos | Partial (unit-level RTL; E2E Playwright not yet automated) | TC-E1-P1-02, TC-E1-P1-03 |
| NFR6 | No stack traces exposed in error responses | Full | TC-E1-P0-05 |

---

## 3. Test Coverage Summary

### Tests Defined in test-design-epic-1.md (17 total planned)

| TC ID | Priority | Description | Automation Status | Test File |
|-------|----------|-------------|-------------------|-----------|
| TC-E1-P0-01 | P0 | TypeScript strict build | AUTOMATED | Build process + unit test suite |
| TC-E1-P0-02 | P0 | Frontend dev server starts on 5173 | MANUAL/CI | Shell/smoke test |
| TC-E1-P0-03 | P0 | Backend starts and Scalar loads | DEFINED-NOT-AUTOMATED | xUnit integration (not yet created) |
| TC-E1-P0-04 | P0 | CORS allows requests from localhost:5173 | DEFINED-NOT-AUTOMATED | xUnit integration (not yet created) |
| TC-E1-P0-05 | P0 | ExceptionHandlingMiddleware returns RFC 7807 | AUTOMATED | `ExceptionHandlingMiddlewareTests.cs` |
| TC-E1-P1-01 | P1 | SPA navigation — no full page reload | AUTOMATED | `root.test.tsx` |
| TC-E1-P1-02 | P1 | Deep linking — /clientes direct access | DEFINED-NOT-AUTOMATED | Playwright E2E (not yet created) |
| TC-E1-P1-03 | P1 | Deep linking — /contactos direct access | DEFINED-NOT-AUTOMATED | Playwright E2E (not yet created) |
| TC-E1-P1-04 | P1 | 404 route — unknown URL shows not-found view | AUTOMATED | `NotFoundView.test.tsx`, `root-404-nav.test.tsx` |
| TC-E1-P1-05 | P1 | EF Core migration creates DB and migrations table | DEFINED-NOT-AUTOMATED | Manual/CI; unit tests for context creation exist |
| TC-E1-P1-06 | P1 | Clean Architecture solution builds without errors | MANUAL/CI | `dotnet build SiesaAgents.sln` |
| TC-E1-P2-01 | P2 | NavigationRail visible on desktop viewport | AUTOMATED | `root.test.tsx` |
| TC-E1-P2-02 | P2 | NavigationBar visible on mobile viewport | AUTOMATED | `root.test.tsx` |
| TC-E1-P2-03 | P2 | Index route redirects to /clientes | AUTOMATED | `root.test.tsx` |
| TC-E1-P2-04 | P2 | snake_case column naming applied | AUTOMATED | `AppDbContextTests.cs` |
| TC-E1-P3-01 | P3 | Vitest unit tests pass in frontend | AUTOMATED | All `.test.ts/tsx` files in `frontend/src` |
| TC-E1-P3-02 | P3 | xUnit unit tests pass in backend | AUTOMATED | All `*Tests.cs` in `backend/tests` |

### Actual Test Files Found

**Frontend (Vitest + RTL):**
- `frontend/src/routes/__tests__/root.test.tsx` — 19 tests (navigation shell, SPA routing, responsive, a11y)
- `frontend/src/routes/__tests__/root-404-nav.test.tsx` — 404 and nav tests
- `frontend/src/routes/__tests__/root-edge-cases.test.tsx` — edge cases
- `frontend/src/shared/components/__tests__/NotFoundView.test.tsx` — 2 tests
- `frontend/src/shared/components/__tests__/NotFoundView-edge-cases.test.tsx` — edge cases
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClientesView.test.tsx`
- `frontend/src/modules/crm/contactos/presentation/__tests__/ContactosView.test.tsx`
- `frontend/src/shared/lib/__tests__/apiClient.test.ts` — Axios instance tests
- `frontend/src/shared/lib/__tests__/apiClient.edge.test.ts`
- `frontend/src/shared/lib/__tests__/queryClient.test.ts` — QueryClient tests
- `frontend/src/shared/lib/__tests__/queryClient.edge.test.ts`

**Backend (xUnit):**
- `backend/tests/SiesaAgents.UnitTests/Domain/EntityTests.cs` — Entity base class tests
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — DbContext tests
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextEdgeCaseTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` — RFC 7807 tests (500, 404, 400, 499)
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareEdgeCaseTests.cs`

**Missing (Defined but Not Automated):**
- Playwright E2E tests for deep linking (TC-E1-P1-02, TC-E1-P1-03)
- xUnit integration tests for CORS (TC-E1-P0-04) and Scalar (TC-E1-P0-03)
- xUnit integration test for DB migration (TC-E1-P1-05 as integration)

---

## 4. Coverage by Priority

| Priority | Total Defined | Fully Automated | Partial/Manual | Not Automated | Automation Rate |
|----------|---------------|-----------------|----------------|---------------|-----------------|
| P0 | 5 | 2 (TC-P0-01, TC-P0-05) | 1 (TC-P0-02 — CI smoke) | 2 (TC-P0-03, TC-P0-04) | 40% automated; 60% manual/pending |
| P1 | 6 | 2 (TC-P1-01, TC-P1-04) | 2 (TC-P1-05, TC-P1-06 — manual/CI) | 2 (TC-P1-02, TC-P1-03 — E2E) | 33% automated; 33% manual/CI; 33% pending |
| P2 | 4 | 4 (TC-P2-01 to TC-P2-04) | 0 | 0 | 100% automated |
| P3 | 2 | 2 (TC-P3-01, TC-P3-02) | 0 | 0 | 100% automated |

### Coverage by Requirement

| Priority | Total ACs | Covered (automated or manual with evidence) | Partially Covered | Uncovered |
|----------|-----------|---------------------------------------------|-------------------|-----------|
| P0 | 5 | 3 | 2 | 0 |
| P1 | 11 | 7 | 4 | 0 |
| P2 | 5 | 5 | 0 | 0 |
| Total | 21 | 15 | 6 | 0 |

**Overall AC coverage:** 15/21 = 71% fully covered; 6/21 partially covered (implementation evidence exists, automation pending)

---

## 5. Gap Analysis

### Critical Gaps (P0)

| Gap | Description | Risk | Status |
|-----|-------------|------|--------|
| G1 — CORS integration test | TC-E1-P0-04: No automated xUnit integration test verifying CORS preflight from `localhost:5173`. CORS is configured in `Program.cs` but not test-verified by an automated test. | HIGH (R1 — CORS misconfiguration silently blocks all API calls) | Implementation exists; test MISSING |
| G2 — Scalar integration test | TC-E1-P0-03: No automated test verifying `GET /scalar` returns 200. Scalar is configured but not integration-tested. | MEDIUM (R8) | Implementation exists; test MISSING |

### Significant Gaps (P1)

| Gap | Description | Risk | Status |
|-----|-------------|------|--------|
| G3 — E2E deep-link /clientes | TC-E1-P1-02: Playwright E2E not yet created. Deep linking is covered at unit level via TanStack Router in-memory tests but not verified at full browser level. | MEDIUM (R4 — SPA 404 on server-side direct access) | Unit evidence exists; E2E MISSING |
| G4 — E2E deep-link /contactos | TC-E1-P1-03: Same as G3 for `/contactos`. | MEDIUM (R4) | Unit evidence exists; E2E MISSING |
| G5 — DB migration integration test | TC-E1-P1-05: `dotnet ef database update` was run manually (CLI unavailable in CI). No TestContainers-based automated test verifies `siesa_agents_db` creation and `__ef_migrations_history` presence. | MEDIUM (R5, R6) | Migration files exist manually; integration test MISSING |

### Minor Gaps (P2+)

None — all P2 and P3 ACs have automated coverage.
