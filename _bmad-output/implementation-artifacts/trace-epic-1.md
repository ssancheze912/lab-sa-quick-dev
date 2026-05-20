---
epic: 1
title: "Project Foundation & Application Shell"
scope: epic
date: 2026-05-20
phase: trace
stories:
  - "1.1: Project Initialization & Repository Structure"
  - "1.2: Frontend Navigation Shell"
  - "1.3: Backend Database Foundation"
gate_decision: CONCERNS
coverage_overall: 88
coverage_p0: 100
coverage_p1: 92
---

# Traceability Matrix — Epic 1: Project Foundation & Application Shell

## 1. Scope

| Field | Value |
|---|---|
| Epic | 1 — Project Foundation & Application Shell |
| Stories | 1.1, 1.2, 1.3 |
| Gate Scope | epic |
| Date | 2026-05-20 |
| Gate Decision | **CONCERNS** |

---

## 2. Requirement Inventory

### Epic-Level Acceptance Criteria

| ID | Description | Story | FRs |
|---|---|---|---|
| AC-E1.1 | App loads and shows accessible navigation structure on desktop and mobile | 1.2 | FR29 |
| AC-E1.2 | User can navigate between Clientes and Contactos without full page reloads | 1.2 | FR28 |
| AC-E1.3 | Direct URL access to `/clientes` and `/contactos` renders correct views (deep linking) | 1.2 | FR30 |

### Story-Level Acceptance Criteria

| ID | Story | Description |
|---|---|---|
| AC-1.1.1 | 1.1 | Frontend: npm run dev starts Vite on port 5173, TypeScript strict mode |
| AC-1.1.2 | 1.1 | Backend: dotnet run starts on port 5000, Scalar at /scalar |
| AC-1.1.3 | 1.1 | 4 Clean Architecture projects referenced, dotnet build exits 0 |
| AC-1.1.4 | 1.1 | CORS allows requests from localhost:5173 |
| AC-1.2.1 | 1.2 | Desktop: NavigationRail (siesa-ui-kit) visible ≥1024px with SPA navigation (FR28) |
| AC-1.2.2 | 1.2 | Mobile: NavigationBar (siesa-ui-kit) visible <1024px, items tappable ≥44px (FR29) |
| AC-1.2.3 | 1.2 | Deep linking /clientes and /contactos without redirect (FR30) |
| AC-1.2.4 | 1.2 | Unknown route displays 404 view in Spanish |
| AC-1.3.1 | 1.3 | dotnet ef database update creates siesa_agents_db, migrations folder with 1 entry |
| AC-1.3.2 | 1.3 | Unhandled exception → Problem Details RFC 7807 (status, title, detail), no stackTrace (NFR6) |
| AC-1.3.3 | 1.3 | ApplySnakeCaseNaming() called last in OnModelCreating |
| AC-1.3.4 | 1.3 | AppDbContext.Database.CanConnectAsync() returns true for siesa_agents_db |

### Functional Requirements

| FR | Description | Story |
|---|---|---|
| FR28 | SPA routing, no full page reload on navigation | 1.2 |
| FR29 | Mobile browser access with NavigationBar | 1.2 |
| FR30 | Deep linking — direct URL renders correct view | 1.2 |

### Non-Functional Requirements

| NFR | Description | Story |
|---|---|---|
| NFR6 | No stack traces exposed in error responses | 1.3 |
| NFR11 | UUID PKs, snake_case schema (foundation only, future entities) | 1.3 |

---

## 3. Test Inventory

### 3.1 Story 1.1 — E2E & API Tests (36 total, all GREEN)

| Test ID | File | Level | Priority | AC Coverage |
|---|---|---|---|---|
| E2E-INIT-01 | foundation/project-initialization.spec.ts | E2E | P1 | AC-1.1.1 |
| E2E-INIT-02 | foundation/project-initialization.spec.ts | E2E | P1 | AC-1.1.4 |
| E2E-INIT-03 | foundation/project-initialization.spec.ts | E2E | P2 | AC-1.1.1 |
| E2E-INIT-04 | foundation/project-initialization.spec.ts | E2E | P2 | AC-1.1.1 |
| API-F-01 | foundation/backend-health.spec.ts | API | P0 | AC-1.1.2 |
| API-F-02 | foundation/backend-health.spec.ts | API | P0 | AC-1.1.4 |
| API-F-03 | foundation/backend-health.spec.ts | API | P1 | AC-1.3.2, NFR6 |
| API-S-01 | foundation/solution-structure.spec.ts | API | P0 | AC-1.1.3 |
| API-S-02 | foundation/solution-structure.spec.ts | API | P0 | AC-1.1.2, AC-1.1.3 |
| E2E-EDGE-01..06 | foundation/project-initialization-edge.spec.ts | E2E | P1/P2 | AC-1.1.1, AC-1.1.4 |
| API-EDGE-01..09 | foundation/backend-health-edge.spec.ts | API | P1 | AC-1.1.4, NFR6 |
| ARCH-EDGE-01..12 | foundation/solution-structure-edge.spec.ts | API/File | P0/P1/P2 | AC-1.1.3, AC-1.1.1 |

**Story 1.1 total: 36 tests — all GREEN**

### 3.2 Story 1.2 — E2E Tests (31+ total, GREEN)

| Test ID | File | Level | Priority | AC Coverage |
|---|---|---|---|---|
| E2E-F-01 | navigation/navigation-shell.spec.ts | E2E | P0 | AC-E1.1, AC-1.2.1 |
| E2E-F-02 | navigation/navigation-shell.spec.ts | E2E | P0 | AC-E1.2, AC-1.2.1, FR28 |
| E2E-F-03 | navigation/navigation-shell.spec.ts | E2E | P0 | AC-E1.2, AC-1.2.1, FR28 |
| E2E-F-01b | navigation/navigation-shell.spec.ts | E2E | P0 | AC-1.2.1 |
| E2E-F-04 | navigation/navigation-shell.spec.ts | E2E | P0 | AC-E1.3, AC-1.2.3, FR30 |
| E2E-F-05 | navigation/navigation-shell.spec.ts | E2E | P0 | AC-E1.3, AC-1.2.3, FR30 |
| E2E-F-08 | navigation/navigation-shell.spec.ts | E2E | P2 | AC-1.2.4 |
| E2E-F-08b | navigation/navigation-shell.spec.ts | E2E | P2 | AC-1.2.4 |
| E2E-F-06 | navigation/navigation-shell-mobile.spec.ts | E2E-mobile | P1 | AC-E1.1, AC-1.2.2, FR29 |
| E2E-F-07a | navigation/navigation-shell-mobile.spec.ts | E2E-mobile | P1 | AC-1.2.2, FR29 |
| E2E-F-07b | navigation/navigation-shell-mobile.spec.ts | E2E-mobile | P1 | AC-1.2.2, FR29 |
| E2E-F-07c | navigation/navigation-shell-mobile.spec.ts | E2E-mobile | P1 | AC-1.2.2, FR29 |
| E2E-F-07d | navigation/navigation-shell-mobile.spec.ts | E2E-mobile | P1 | AC-1.2.2, FR29 |
| Edge cases (19) | navigation/navigation-shell-edge-cases.spec.ts | E2E | P1/P2 | AC-1.2.1..4 |
| Edge cases p2 (8) | navigation/navigation-shell-edge-cases-part2.spec.ts | E2E | P1/P2 | AC-1.2.1..4 |

**Story 1.2 total: ~40 tests — GREEN (tests pass)**
**Story 1.2 code-review: CONCERNS — siesa-ui-kit NavigationRail/NavigationBar/LayoutBase NOT used (custom nav implementation instead)**

### 3.3 Story 1.3 — Unit, Integration & API Tests (48 total, all GREEN)

| Test ID | File | Level | Priority | AC Coverage |
|---|---|---|---|---|
| UNIT-F-04 | UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs | Unit | P1 | AC-1.3.2, NFR6 |
| UNIT-F-04b | UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs | Unit | P1 | AC-1.3.2 |
| UNIT-F-04c | UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs | Unit | P1 | AC-1.3.2 |
| UNIT-F-04d | UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs | Unit | P1 | AC-1.3.2 |
| UNIT-F-05 | UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs | Unit | P1 | AC-1.3.2, NFR6 |
| Middleware edge (11) | UnitTests/Middleware/ExceptionHandlingMiddlewareEdgeCaseTests.cs | Unit | P1/P2 | AC-1.3.2, NFR6 |
| UNIT-F-06 | UnitTests/Infrastructure/AppDbContextTests.cs | Unit | P2 | AC-1.3.3 |
| UNIT-F-06b | UnitTests/Infrastructure/AppDbContextTests.cs | Unit | P2 | AC-1.3.3 |
| UNIT-F-06c | UnitTests/Infrastructure/AppDbContextTests.cs | Unit | P2 | AC-1.3.3 |
| UNIT-F-06d | UnitTests/Infrastructure/AppDbContextTests.cs | Unit | P2 | AC-1.3.3 (scope guard) |
| DbContext edge (8) | UnitTests/Infrastructure/AppDbContextEdgeCaseTests.cs | Unit | P2 | AC-1.3.3 |
| INT-F-01 | IntegrationTests/DatabaseFoundationTests.cs | Integration | P1 | AC-1.3.4 |
| INT-F-01b | IntegrationTests/DatabaseFoundationTests.cs | Integration | P1 | AC-1.3.1 |
| INT-F-02 | IntegrationTests/DatabaseFoundationTests.cs | Integration | P1 | AC-1.3.1 |
| INT-F-02b | IntegrationTests/DatabaseFoundationTests.cs | Integration | P1 | AC-1.3.1 |
| DB integration edge (6) | IntegrationTests/DatabaseFoundationEdgeCaseTests.cs | Integration | P1/P2 | AC-1.3.1, AC-1.3.4 |
| API-F-03 | e2e/tests/database/database-foundation.spec.ts | API | P1 | AC-1.3.2, NFR6 |
| DB-F-01 | e2e/tests/database/database-foundation.spec.ts | API | P1 | AC-1.3.2 |
| DB-F-02 | e2e/tests/database/database-foundation.spec.ts | API | P1 | AC-1.3.4 |
| DB-F-03 | e2e/tests/database/database-foundation.spec.ts | API | P1 | AC-1.3.2 |
| DB edge (19) | e2e/tests/database/database-foundation-edge.spec.ts | API | P1/P2 | AC-1.3.1..4 |

**Story 1.3 total: ~48 tests — all GREEN**

---

## 4. Requirements-to-Tests Coverage Matrix

| Requirement ID | Description | Test IDs | Evidence Level | Priority | Status |
|---|---|---|---|---|---|
| AC-E1.1 | Navigation structure accessible desktop + mobile | E2E-F-01, E2E-F-06, E2E-F-07a/b | E2E, E2E-mobile | P0 | COVERED |
| AC-E1.2 | Navigate without full reload | E2E-F-02, E2E-F-03 | E2E | P0 | COVERED |
| AC-E1.3 | Deep linking /clientes, /contactos | E2E-F-04, E2E-F-05 | E2E | P0 | COVERED |
| AC-1.1.1 | Frontend Vite port 5173, TypeScript strict | E2E-INIT-01/03/04, ARCH-EDGE-11/12 | E2E, File | P0/P1 | COVERED |
| AC-1.1.2 | Backend port 5000, Scalar /scalar | API-F-01, API-S-02 | API | P0 | COVERED |
| AC-1.1.3 | 4 CA projects, dotnet build 0 | API-S-01, ARCH-EDGE-06..10 | API, File | P0/P1 | COVERED |
| AC-1.1.4 | CORS from localhost:5173 | API-F-02, E2E-INIT-02, ARCH-EDGE-04/05 | API, E2E | P0/P1 | COVERED |
| AC-1.2.1 | NavigationRail desktop (siesa-ui-kit) | E2E-F-01, E2E-F-01b, E2E-F-02/03 | E2E | P0 | COVERED-GAP* |
| AC-1.2.2 | NavigationBar mobile (siesa-ui-kit), ≥44px | E2E-F-06, E2E-F-07a/b/c/d | E2E-mobile | P1 | COVERED-GAP* |
| AC-1.2.3 | Deep linking without redirect | E2E-F-04, E2E-F-05 | E2E | P0 | COVERED |
| AC-1.2.4 | 404 view in Spanish | E2E-F-08, E2E-F-08b | E2E | P2 | COVERED |
| AC-1.3.1 | siesa_agents_db created, 1 migration | INT-F-02, INT-F-02b, INT-F-01b | Integration | P1 | COVERED |
| AC-1.3.2 | Problem Details RFC 7807, no stackTrace | UNIT-F-04/05, API-F-03, DB-F-01/03 | Unit, API | P1 | COVERED |
| AC-1.3.3 | ApplySnakeCaseNaming() last in OnModelCreating | UNIT-F-06/06b/06c/06d | Unit | P2 | COVERED |
| AC-1.3.4 | CanConnectAsync() returns true | INT-F-01, DB-F-02 | Integration, API | P1 | COVERED |
| FR28 | SPA routing, no reload | E2E-F-02, E2E-F-03 | E2E | P0 | COVERED |
| FR29 | Mobile navigation | E2E-F-06, E2E-F-07a/b/c/d | E2E-mobile | P1 | COVERED-GAP* |
| FR30 | Deep linking | E2E-F-04, E2E-F-05 | E2E | P0 | COVERED |
| NFR6 | No stack traces in errors | UNIT-F-05, API-F-03, API-EDGE-* | Unit, API | P1 | COVERED |
| NFR11 | UUID PKs, snake_case (foundation) | UNIT-F-06, UNIT-F-06d | Unit | P2 | COVERED |

**COVERED-GAP***: Tests pass and exercise the navigation behavior, but implementation uses custom hand-rolled `<nav>` components instead of mandated `siesa-ui-kit` NavigationRail / NavigationBar / LayoutBase. Tests validate functional behavior (E2E routes, SPA, mobile touch targets) but do not assert component identity against the design system library. The AC wording explicitly requires siesa-ui-kit components.

---

## 5. Coverage Summary

### By Priority

| Priority | Requirements | Covered | Gaps | Coverage % |
|---|---|---|---|---|
| P0 | 9 (AC-E1.1, AC-E1.2, AC-E1.3, AC-1.1.1..4, AC-1.2.1, FR28) | 9 | 0 functional gaps; 1 implementation gap (siesa-ui-kit) | **100%** |
| P1 | 12 (AC-1.2.2, AC-1.3.1..4, FR29, FR30, NFR6, UNIT-F-01, UNIT-F-02, UNIT-F-03) | 11 | 1 gap: UNIT-F-03 weak — no RTL render assertion for NavigationRail | **92%** |
| P2 | 3 (AC-1.2.4, AC-1.3.3, NFR11) | 3 | 0 | **100%** |
| P3 | 0 | — | — | N/A |
| **Overall** | **24** | **~21 fully, 3 with gaps** | **2 concerns** | **~88%** |

### Test Count Summary

| Story | E2E | API | Unit | Integration | Total |
|---|---|---|---|---|---|
| 1.1 | 10 | 26 | 0 | 0 | **36** |
| 1.2 | 40+ | 0 | 3 (weak) | 0 | **~43** |
| 1.3 | 0 | 23 | 20 | 10 | **~53** |
| **Epic 1** | **50+** | **49** | **23** | **10** | **~130+** |

---

## 6. Gaps & Risk Register

| Gap ID | Requirement | Gap Description | Severity | Story |
|---|---|---|---|---|
| GAP-01 | AC-1.2.1, AC-1.2.2, FR29 | siesa-ui-kit NavigationRail/NavigationBar/LayoutBase NOT used. Custom `<nav>` hand-rolled instead. Tests pass functionally but the design system contract is violated. Code-review verdict: CONCERNS. | HIGH | 1.2 |
| GAP-02 | UNIT-F-03 / AC-1.2.1 | Unit test UNIT-F-03 only asserts route registration (`/_app` in routesById), not that NavigationRail component renders. No RTL render or DOM assertion. | MEDIUM | 1.2 |
| GAP-03 | BUILD-F-01/02 | No explicit build smoke check test exists in the E2E suite as a gating test (separate CI step implied but not formalized as a tracked test ID in the suite). Evidence exists indirectly via passing E2E tests (server starts = build passed). | LOW | 1.1 |

---

## 7. Quality Gate Decision

### Thresholds Applied

| Threshold | Required | Actual | Met? |
|---|---|---|---|
| P0 coverage | ≥ 100% | 100% | YES |
| P1 coverage | ≥ 90% | 92% | YES |
| Overall coverage | ≥ 80% | ~88% | YES |
| Evidence completeness | No MISSING evidence | All P0/P1 have test evidence | YES |
| Implementation fidelity | Requirements implemented as specified | GAP-01: siesa-ui-kit NOT used | NO (Story 1.2) |

### Gate: CONCERNS

**Rationale:**

All numeric coverage thresholds are MET (P0 = 100%, P1 = 92%, overall = ~88%). All P0 and P1 tests have evidence and pass GREEN. However, the following non-numeric concern prevents a clean PASS:

1. **GAP-01 (HIGH):** Story 1.2 AC-1.2.1 and AC-1.2.2 explicitly require `NavigationRail`, `NavigationBar`, and `LayoutBase` from `siesa-ui-kit`. The implementation uses a custom hand-rolled `<nav>` component that bypasses the design system entirely. The code-review verdict for Story 1.2 is "PASS CON OBSERVACIONES" (critical issues outstanding). This is a requirements fidelity failure — the behavior is tested and passes, but the mandated technology constraint is violated. Story 1.2 status remains `review` (not `done`).

2. **GAP-02 (MEDIUM):** UNIT-F-03 does not perform an actual RTL component render to assert NavigationRail is present. It only checks route registration. The P1 test weakness reduces confidence in the component-level assertion.

**Story statuses:**
- Story 1.1: `review` — all tests PASS, code-review PASS
- Story 1.2: `review` — tests GREEN, code-review CONCERNS (siesa-ui-kit not used; story not marked `done`)
- Story 1.3: `done` — all tests PASS, code-review PASS

**Resolution required before PASS:**
- Story 1.2 must replace custom `<nav>` with `NavigationRail`, `NavigationBar`, and `LayoutBase` from siesa-ui-kit, then pass code-review without critical findings.
- UNIT-F-03 should be upgraded to an RTL render test asserting the NavigationRail component is rendered.

---

## 8. Traceability Completeness

| Artifact | Status |
|---|---|
| Epic AC → Tests | COMPLETE |
| Story AC → Tests | COMPLETE |
| FR → Tests | COMPLETE |
| NFR → Tests | COMPLETE (NFR6, NFR11) |
| Test Design (test-design-epic-1.md) → Implementation | COMPLETE (all designed tests created) |
| ATDD Checklists → Test files | COMPLETE (all 3 checklists realized) |
| Code review findings → Gate | COMPLETE (GAP-01 sourced from review-1-2) |
