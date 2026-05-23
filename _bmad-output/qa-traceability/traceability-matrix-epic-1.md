---
epic: 1
title: "Project Foundation & Application Shell"
generatedAt: "2026-05-23"
phase: testarch-trace
stories:
  - "1.1 — Project Initialization & Repository Structure"
  - "1.2 — Frontend Navigation Shell"
  - "1.3 — Backend Database Foundation"
storyStatuses:
  "1.1": done
  "1.2": in-progress (review FAIL — CRITICAL-1: siesa-ui-kit not used)
  "1.3": done
---

# Requirements-to-Tests Traceability Matrix — Epic 1

## Epic Overview

Epic 1 establishes the complete technical foundation for Siesa Agents: Vite/React/TypeScript frontend, .NET 10 Clean Architecture backend, PostgreSQL via EF Core, functional SPA navigation shell, and Problem Details RFC 7807 error middleware.

---

## Section 1 — Acceptance Criteria Inventory

### Epic-Level AC

| AC ID | Description | FR / NFR | Story |
|-------|-------------|----------|-------|
| AC-E1.1 | App loads and shows accessible navigation on mobile and desktop | FR28, FR29 | 1.2 |
| AC-E1.2 | Navigate between Clientes and Contactos without full page reloads | FR28 | 1.2 |
| AC-E1.3 | Direct URL to /clientes and /contactos renders correct views (deep linking) | FR30 | 1.2 |

### Story 1.1 — Project Initialization & Repository Structure

| AC ID | Description | FR / NFR |
|-------|-------------|----------|
| AC-1.1.a | `pnpm run dev` starts on port 5173 with no errors | — |
| AC-1.1.b | TypeScript strict mode enabled (`"strict": true`) | — |
| AC-1.1.c | Backend starts on port 5000, Scalar loads at `/scalar` | — |
| AC-1.1.d | Four Clean Architecture projects referenced correctly in solution | — |
| AC-1.1.e | CORS allows requests from `http://localhost:5173` | — |

### Story 1.2 — Frontend Navigation Shell

| AC ID | Description | FR / NFR |
|-------|-------------|----------|
| AC-1.2.a | NavigationRail on desktop (≥ 1024px) with Clientes/Contactos entries | FR28 |
| AC-1.2.b | NavigationBar on mobile (< 1024px), items tappable with 44px targets | FR29 |
| AC-1.2.c | SPA navigation — no full page reload between routes | FR28 |
| AC-1.2.d | Deep linking via URL bar renders correct view | FR30 |
| AC-1.2.e | 404 / not-found view displayed gracefully with back link | — |
| AC-1.2.f | Spanish aria-labels, Tab reachability, Enter/Space activation (WCAG 2.1 AA) | — |

### Story 1.3 — Backend Database Foundation

| AC ID | Description | FR / NFR |
|-------|-------------|----------|
| AC-1.3.a | `siesa_agents_db` created with no errors via `dotnet ef database update` | — |
| AC-1.3.b | EF Core `Migrations/` folder with initial empty migration | — |
| AC-1.3.c | Problem Details RFC 7807 on unhandled exception (no stack trace) | NFR6 |
| AC-1.3.d | `ApplySnakeCaseNaming()` applied in `OnModelCreating` | — |
| AC-1.3.e | Build succeeds, AppDbContext registered in DI with DefaultConnection | — |

---

## Section 2 — Test Inventory

### Tests Defined (test-design-epic-1.md)

| Test ID | Description | Priority | Level | Story |
|---------|-------------|----------|-------|-------|
| TC-E1-P0-01 | TypeScript strict build passes (`tsc --noEmit` exits 0) | P0 | Unit/Build | 1.1 |
| TC-E1-P0-02 | Frontend dev server starts on port 5173 | P0 | Smoke | 1.1 |
| TC-E1-P0-03 | Backend starts and Scalar loads at `/scalar` | P0 | API Integration | 1.1 |
| TC-E1-P0-04 | CORS allows requests from localhost:5173 (preflight + actual) | P0 | API Integration | 1.1 |
| TC-E1-P0-05 | ExceptionHandlingMiddleware returns Problem Details RFC 7807 | P0 | API Integration | 1.3 |
| TC-E1-P1-01 | SPA navigation — no full page reload between routes | P1 | Component | 1.2 |
| TC-E1-P1-02 | Deep linking — direct URL access to /clientes | P1 | E2E | 1.2 |
| TC-E1-P1-03 | Deep linking — direct URL access to /contactos | P1 | E2E | 1.2 |
| TC-E1-P1-04 | 404 route — unknown URL shows not-found view | P1 | Component | 1.2 |
| TC-E1-P1-05 | EF Core migration creates database and `__EFMigrationsHistory` table | P1 | API Integration | 1.3 |
| TC-E1-P1-06 | Clean Architecture solution builds without errors | P1 | Build | 1.1 |
| TC-E1-P2-01 | NavigationRail visible on desktop viewport | P2 | Component | 1.2 |
| TC-E1-P2-02 | NavigationBar visible on mobile viewport | P2 | Component | 1.2 |
| TC-E1-P2-03 | Index route redirects to /clientes | P2 | Component | 1.2 |
| TC-E1-P2-04 | snake_case column naming applied via ApplySnakeCaseNaming | P2 | API Integration | 1.3 |
| TC-E1-P3-01 | Vitest unit tests pass in frontend | P3 | Unit | 1.1 |
| TC-E1-P3-02 | xUnit unit tests pass in backend | P3 | Unit | 1.1 |

### ATDD-Defined Tests (per ATDD checklists)

#### Story 1.1 — E2E + API (atdd-checklist-1-1.md)

| Test ID | File | Description | Level |
|---------|------|-------------|-------|
| ATDD-1.1-E2E-01 | `e2e/tests/foundation/project-initialization.spec.ts` | Frontend serves on port 5173 without errors | E2E |
| ATDD-1.1-E2E-02 | `e2e/tests/foundation/project-initialization.spec.ts` | Root HTML has React mount point `[data-testid="app-root"]` | E2E |
| ATDD-1.1-E2E-03 | `e2e/tests/foundation/project-initialization.spec.ts` | No TypeScript compilation errors in browser console | E2E |
| ATDD-1.1-E2E-04 | `e2e/tests/foundation/project-initialization.spec.ts` | No JS runtime errors on initial load | E2E |
| ATDD-1.1-E2E-05 | `e2e/tests/foundation/project-initialization.spec.ts` | Frontend reaches backend without CORS errors | E2E |
| ATDD-1.1-E2E-06 | `e2e/tests/foundation/project-initialization.spec.ts` | Backend responds without CORS blocking | E2E |
| ATDD-1.1-E2E-07 | `e2e/tests/foundation/project-initialization.spec.ts` | No Vite TypeScript error overlay on load | E2E |
| ATDD-1.1-API-01 | `e2e/tests/api/backend-initialization.api.spec.ts` | Backend API running on port 5000 | API |
| ATDD-1.1-API-02 | `e2e/tests/api/backend-initialization.api.spec.ts` | Scalar page at /scalar returns 200 | API |
| ATDD-1.1-API-03 | `e2e/tests/api/backend-initialization.api.spec.ts` | /scalar returns HTML content | API |
| ATDD-1.1-API-04 | `e2e/tests/api/backend-initialization.api.spec.ts` | Swagger/OpenAPI UI NOT exposed | API |
| ATDD-1.1-API-05 | `e2e/tests/api/backend-initialization.api.spec.ts` | WeatherForecast endpoint NOT exposed | API |
| ATDD-1.1-API-06 | `e2e/tests/api/backend-initialization.api.spec.ts` | CORS header allows localhost:5173 | API |
| ATDD-1.1-API-07 | `e2e/tests/api/backend-initialization.api.spec.ts` | OPTIONS preflight succeeds for frontend origin | API |
| ATDD-1.1-API-08 | `e2e/tests/api/backend-initialization.api.spec.ts` | Four CA layers responding (proxy via server startup) | API |
| ATDD-1.1-API-09 | `e2e/tests/api/backend-initialization.api.spec.ts` | Problem Details RFC 7807 for unhandled errors | API |

#### Story 1.2 — E2E + Component (atdd-checklist-1-2.md)

| Test ID | File | Description | Level |
|---------|------|-------------|-------|
| ATDD-1.2-E2E-01..22 | `e2e/tests/navigation/frontend-navigation-shell.spec.ts` | 22 E2E tests covering AC1–AC5 (navigation, 44px targets, keyboard, 404, deep link, active state) | E2E |
| ATDD-1.2-COMP-01..12 | `frontend/src/routes/__tests__/root.test.tsx` | 12 component tests: NavigationRail, NavigationBar, aria-labels, active state, conditional rendering, WCAG | Component |
| ATDD-1.2-COMP-13..16 | `frontend/src/routes/__tests__/notFound.test.tsx` | 5 component tests: 404 view, Spanish heading, back link, link text | Component |

**Note:** Actual `root.test.tsx` contains 30 tests (ATDD 12 + 18 edge cases). `notFound.test.tsx` contains 16 tests. Total component tests: 46.

#### Story 1.3 — Unit + API (atdd-checklist-1-3.md)

| Test ID | File | Description | Level |
|---------|------|-------------|-------|
| ATDD-1.3-UNIT-01..08 | `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | 8 unit tests: content-type, status 500, Problem Details body, null detail, no stack trace, pass-through | Unit |
| ATDD-1.3-API-01..14 | `e2e/tests/foundation/backend-database-foundation.api.spec.ts` | 14 API tests: AC3 middleware (7), AC1 DB health (3), AC5 DI (3), AC4 snake_case (1) | API |

---

## Section 3 — Requirements-to-Tests Traceability Matrix

| AC ID | Description | Test Cases | Test Files | Evidence Level | Status |
|-------|-------------|------------|-----------|----------------|--------|
| AC-E1.1 | Accessible navigation on mobile and desktop | TC-E1-P2-01, TC-E1-P2-02, ATDD-1.2-E2E-01..06 | root.test.tsx, frontend-navigation-shell.spec.ts | Component + E2E | INCOMPLETE — Story 1.2 in-progress (review FAIL) |
| AC-E1.2 | Navigate without full reload | TC-E1-P1-01, ATDD-1.2-E2E-04..05 | root.test.tsx, frontend-navigation-shell.spec.ts | Component + E2E | INCOMPLETE — Story 1.2 in-progress |
| AC-E1.3 | Deep linking to /clientes and /contactos | TC-E1-P1-02, TC-E1-P1-03, ATDD-1.2-E2E-13..16 | frontend-navigation-shell.spec.ts | E2E | INCOMPLETE — Story 1.2 in-progress |
| AC-1.1.a | pnpm dev starts on 5173 | TC-E1-P0-01, TC-E1-P0-02, ATDD-1.1-E2E-01..04 | project-initialization.spec.ts | E2E | COVERED — Story 1.1 done |
| AC-1.1.b | TypeScript strict mode | TC-E1-P0-01, ATDD-1.1-E2E-03, ATDD-1.1-E2E-07 | project-initialization.spec.ts | E2E | COVERED — Story 1.1 done |
| AC-1.1.c | Backend on port 5000, Scalar at /scalar | TC-E1-P0-03, ATDD-1.1-API-01..03 | backend-initialization.api.spec.ts | API | COVERED — Story 1.1 done |
| AC-1.1.d | Four CA projects referenced correctly | TC-E1-P1-06, ATDD-1.1-API-08 | backend-initialization.api.spec.ts | API | COVERED — Story 1.1 done |
| AC-1.1.e | CORS allows localhost:5173 | TC-E1-P0-04, ATDD-1.1-E2E-05..06, ATDD-1.1-API-06..07 | project-initialization.spec.ts, backend-initialization.api.spec.ts | E2E + API | COVERED — Story 1.1 done |
| AC-1.2.a | NavigationRail on desktop | TC-E1-P2-01, ATDD-1.2-COMP-01, ATDD-1.2-E2E-01..03 | root.test.tsx, frontend-navigation-shell.spec.ts | Component + E2E | INCOMPLETE — Story 1.2 in-progress; review FAIL on CRITICAL-1 (siesa-ui-kit not used) |
| AC-1.2.b | NavigationBar on mobile with 44px targets | TC-E1-P2-02, ATDD-1.2-COMP-05..06, ATDD-1.2-E2E-07..12 | root.test.tsx, frontend-navigation-shell.spec.ts | Component + E2E | INCOMPLETE — Story 1.2 in-progress; breakpoint was wrong (768px vs 1024px); auto-corrected |
| AC-1.2.c | SPA navigation no full reload | TC-E1-P1-01, ATDD-1.2-E2E-04..05 | root.test.tsx, frontend-navigation-shell.spec.ts | Component + E2E | INCOMPLETE — Story 1.2 in-progress; 4 Playwright tests marked .fixme (framenavigated limitation) |
| AC-1.2.d | Deep linking via URL bar | TC-E1-P1-02, TC-E1-P1-03, ATDD-1.2-E2E-13..16 | frontend-navigation-shell.spec.ts | E2E | INCOMPLETE — Story 1.2 in-progress |
| AC-1.2.e | 404 not-found view | TC-E1-P1-04, ATDD-1.2-COMP-13..16, ATDD-1.2-E2E-19..22 | notFound.test.tsx, frontend-navigation-shell.spec.ts | Component + E2E | INCOMPLETE — Story 1.2 in-progress |
| AC-1.2.f | Spanish aria-labels, Tab/Enter/Space (WCAG 2.1 AA) | ATDD-1.2-COMP-07..09, ATDD-1.2-E2E-23..27 | root.test.tsx, frontend-navigation-shell.spec.ts | Component + E2E | INCOMPLETE — Story 1.2 in-progress |
| AC-1.3.a | siesa_agents_db created, __EFMigrationsHistory present | TC-E1-P1-05, ATDD-1.3-API-08..10 | backend-database-foundation.api.spec.ts | API Integration | COVERED (design) — Story 1.3 done; requires PostgreSQL to execute |
| AC-1.3.b | EF Core Migrations/ folder with empty InitialCreate | TC-E1-P1-05, ATDD-1.3-API-10 | backend-database-foundation.api.spec.ts | API Integration | COVERED (design) — Story 1.3 done |
| AC-1.3.c | Problem Details RFC 7807, no stack trace (NFR6) | TC-E1-P0-05, ATDD-1.3-UNIT-01..06, ATDD-1.3-API-01..07 | ExceptionHandlingMiddlewareTests.cs, backend-database-foundation.api.spec.ts | Unit + API | COVERED — Story 1.3 done; unit tests designed and files confirmed present |
| AC-1.3.d | ApplySnakeCaseNaming() applied last in OnModelCreating | TC-E1-P2-04, ATDD-1.3-API-14 | backend-database-foundation.api.spec.ts | API Integration | COVERED (design) — Story 1.3 done |
| AC-1.3.e | Build succeeds, AppDbContext DI registered | TC-E1-P1-06, ATDD-1.3-API-11..13 | backend-database-foundation.api.spec.ts | API Integration | COVERED — Story 1.3 done |

---

## Section 4 — NFR Coverage

| NFR | Requirement | Test Cases | Status |
|-----|-------------|------------|--------|
| NFR4 | HTTPS in non-local deployments | Out of scope for Epic 1 | N/A |
| NFR5 | Input validation / sanitization | No user input in Epic 1 — deferred to Epic 2+ | N/A |
| NFR6 | No stack traces exposed in error responses | TC-E1-P0-05, ATDD-1.3-UNIT-05..06, ATDD-1.3-API-06..07 | COVERED — tests designed and middleware hardened |

---

## Section 5 — Coverage Analysis by Priority

### P0 Tests (5 total)

| Test | AC Covered | Evidence | Pass Confidence |
|------|-----------|----------|-----------------|
| TC-E1-P0-01 | AC-1.1.a, AC-1.1.b | E2E spec file present (project-initialization.spec.ts); Story 1.1 done | HIGH |
| TC-E1-P0-02 | AC-1.1.a | E2E spec file present; Story 1.1 done | HIGH |
| TC-E1-P0-03 | AC-1.1.c | ATDD API spec present; Story 1.1 done | HIGH |
| TC-E1-P0-04 | AC-1.1.e | ATDD E2E + API specs present; Story 1.1 done | HIGH |
| TC-E1-P0-05 | AC-1.3.c, NFR6 | ATDD unit tests file present (ExceptionHandlingMiddlewareTests.cs); Story 1.3 done | HIGH |

**P0 Coverage: 5/5 = 100%** — All P0 requirements have test designs and associated story implementations complete.

### P1 Tests (6 total)

| Test | AC Covered | Evidence | Pass Confidence |
|------|-----------|----------|-----------------|
| TC-E1-P1-01 | AC-1.2.c, AC-E1.2 | Component spec present; Story 1.2 in-progress, review FAIL | MEDIUM |
| TC-E1-P1-02 | AC-1.2.d, AC-E1.3 | E2E spec present; Story 1.2 in-progress | MEDIUM |
| TC-E1-P1-03 | AC-1.2.d, AC-E1.3 | E2E spec present; Story 1.2 in-progress | MEDIUM |
| TC-E1-P1-04 | AC-1.2.e | Component spec present (notFound.test.tsx); Story 1.2 in-progress | MEDIUM |
| TC-E1-P1-05 | AC-1.3.a, AC-1.3.b | API spec present; Story 1.3 done; requires live DB | MEDIUM |
| TC-E1-P1-06 | AC-1.1.d, AC-1.3.e | Story 1.1 done; verified via server startup proxy | HIGH |

**P1 Coverage: 6/6 = 100%** — All P1 requirements have test designs. However, Story 1.2 is in-progress (review FAIL on CRITICAL-1 — siesa-ui-kit not used), which means P1 tests TC-E1-P1-01 through TC-E1-P1-04 are DESIGNED but execution confidence is MEDIUM (implementation does not yet satisfy mandatory company standard).

### P2 Tests (4 total)

| Test | AC Covered | Evidence | Pass Confidence |
|------|-----------|----------|-----------------|
| TC-E1-P2-01 | AC-1.2.a, AC-E1.1 | Component spec present; Story 1.2 in-progress, siesa-ui-kit not used | LOW |
| TC-E1-P2-02 | AC-1.2.b, AC-E1.1 | Component spec present; breakpoint auto-corrected to 1024px | LOW |
| TC-E1-P2-03 | (index redirect to /clientes) | Spec designed; Story 1.2 in-progress | LOW |
| TC-E1-P2-04 | AC-1.3.d | API spec present; Story 1.3 done | HIGH |

**P2 Coverage: 4/4 = 100% design coverage.** Execution confidence LOW for TC-E1-P2-01..03 due to Story 1.2 pending review.

---

## Section 6 — Test Implementation Status

### Implemented Test Files Confirmed

| File | Story | Tests | Implementation Status |
|------|-------|-------|----------------------|
| `frontend/src/routes/__tests__/root.test.tsx` | 1.2 | 30 (AC1+AC2+AC3+AC5+edge) | PRESENT |
| `frontend/src/routes/__tests__/notFound.test.tsx` | 1.2 | 16 (AC4+edge) | PRESENT |
| `frontend/src/shared/lib/__tests__/apiClient.test.ts` | 1.1 | present | PRESENT |
| `frontend/src/shared/lib/__tests__/queryClient.test.ts` | 1.1 | present | PRESENT |
| `frontend/src/shared/lib/__tests__/apiClient.edge.test.ts` | 1.1 | present | PRESENT |
| `frontend/src/shared/lib/__tests__/queryClient.edge.test.ts` | 1.1 | present | PRESENT |
| `frontend/src/app/providers/__tests__/QueryProvider.test.tsx` | 1.1 | present | PRESENT |
| `frontend/src/routes/__tests__/routeViews.test.tsx` | 1.2 | present | PRESENT |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` | 1.3 | 8 | PRESENT |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareEdgeCaseTests.cs` | 1.3 | present | PRESENT |
| `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareResponseIntegrityTests.cs` | 1.3 | present | PRESENT |
| `backend/tests/SiesaAgents.UnitTests/SharedDomain/EntityTests.cs` | 1.1 | present | PRESENT |
| `backend/tests/SiesaAgents.UnitTests/SharedDomain/AggregateRootTests.cs` | 1.1 | present | PRESENT |
| `backend/tests/SiesaAgents.UnitTests/SharedDomain/ValueObjectTests.cs` | 1.1 | present | PRESENT |
| `backend/tests/SiesaAgents.UnitTests/SharedDomain/DomainEventTests.cs` | 1.1 | present | PRESENT |
| `e2e/tests/foundation/project-initialization.spec.ts` | 1.1 | 7 E2E | PRESENT |
| `e2e/tests/api/backend-initialization.api.spec.ts` | 1.1 | 9 API | PRESENT |
| `e2e/tests/navigation/frontend-navigation-shell.spec.ts` | 1.2 | 22+ E2E | PRESENT |
| `e2e/tests/foundation/backend-database-foundation.api.spec.ts` | 1.3 | 14 API | PRESENT |
| `e2e/tests/foundation/project-initialization.edge.spec.ts` | 1.1 | edge | PRESENT |
| `e2e/tests/api/backend-initialization.edge.api.spec.ts` | 1.1 | edge | PRESENT |
| `e2e/tests/foundation/backend-database-foundation.edge.spec.ts` | 1.3 | edge | PRESENT |
| `e2e/tests/navigation/frontend-navigation-shell.edge.spec.ts` | 1.2 | edge | PRESENT |

---

## Section 7 — Gap Analysis

### Critical Gaps

| Gap ID | Description | AC Impacted | Severity |
|--------|-------------|-------------|----------|
| GAP-1 | Story 1.2 review FAIL — siesa-ui-kit components (LayoutBase, NavigationRail, NavigationBar) NOT used; custom nav components violate mandatory company standard | AC-1.2.a, AC-1.2.b, AC-E1.1 | CRITICAL |
| GAP-2 | 4 Playwright E2E tests for SPA navigation (no full-reload assertion via `framenavigated`) are marked `.fixme` and cannot pass without test modification or hash routing | AC-1.2.c, AC-E1.2 | HIGH |

### Execution Gaps (Environment-Dependent)

| Gap ID | Description | AC Impacted | Severity |
|--------|-------------|-------------|----------|
| GAP-3 | P1 database tests (TC-E1-P1-05, ATDD-1.3-API-01..14) require running PostgreSQL — cannot be verified in current environment | AC-1.3.a, AC-1.3.b, AC-1.3.d | MEDIUM (environment) |
| GAP-4 | P0 backend tests (TC-E1-P0-03, TC-E1-P0-04, TC-E1-P0-05) require running servers — cannot be verified in current environment | AC-1.1.c, AC-1.1.e, AC-1.3.c | MEDIUM (environment) |

### Resolved (Auto-Corrected During Review)

| Item | Resolution |
|------|-----------|
| Story 1.2 mobile breakpoint 768px vs 1024px | Auto-corrected in root.test.tsx to 1024px |
| Story 1.1 .env* not in .gitignore | Auto-fixed in Story 1.1 review |
| Story 1.1 Vitest test block missing | Auto-fixed in Story 1.1 review |
| Story 1.1 VITE_API_URL type | Auto-fixed |

---

## Section 8 — Summary Coverage Counts

| Priority | Total Tests Designed | AC Rows Covered | Design Coverage | Execution Confidence |
|----------|---------------------|-----------------|-----------------|---------------------|
| P0 | 5 | 5 (AC-1.1.a..e + AC-1.3.c) | 100% | HIGH (Story 1.1 + 1.3 done) |
| P1 | 6 | 6 (AC-E1.2, AC-E1.3, AC-1.2.c..e, AC-1.3.a..b, AC-1.1.d) | 100% | MEDIUM (Story 1.2 blocked) |
| P2 | 4 | 4 (AC-E1.1, AC-1.2.a..b, AC-1.3.d) | 100% | LOW–HIGH (mixed) |
| P3 | 2 | (unit test suite runs) | 100% | MEDIUM (needs dotnet SDK) |
| **Overall** | **17** | **17 AC rows** | **100%** | **MIXED** |

---

*Generated by testarch-trace workflow — 2026-05-23*
