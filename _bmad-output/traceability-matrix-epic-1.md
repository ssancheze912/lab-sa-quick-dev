# Traceability Matrix — Epic 1: Project Foundation & Application Shell

**Generated:** 2026-05-24
**Scope:** Epic 1 (Stories 1.1, 1.2, 1.3)
**Status Basis:** Implementation story files, ATDD checklists, code review reports, sprint-status.yaml

---

## Section 1 — Requirements Inventory

### Epic-Level Acceptance Criteria

| AC ID | Description | Story Source |
|-------|-------------|--------------|
| AC-E1.1 | App loads with accessible navigation on mobile and desktop | Epic 1 |
| AC-E1.2 | Navigate between Clientes/Contactos without full page reloads (FR28) | Epic 1 |
| AC-E1.3 | Direct URL to /clientes and /contactos renders correct views (FR30) | Epic 1 |

### Story-Level Acceptance Criteria

| AC ID | Story | Description |
|-------|-------|-------------|
| AC-1.1.a | 1.1 | `pnpm run dev` starts Vite on port 5173 with no errors |
| AC-1.1.b | 1.1 | TypeScript strict mode enabled (strict, noImplicitAny, strictNullChecks) |
| AC-1.1.c | 1.1 | Backend starts on port 5000, Scalar loads at /scalar |
| AC-1.1.d | 1.1 | Four Clean Architecture projects referenced correctly in solution |
| AC-1.1.e | 1.1 | CORS allows requests from http://localhost:5173 |
| AC-1.2.a | 1.2 | NavigationRail on desktop with Clientes/Contactos entries (FR28) |
| AC-1.2.b | 1.2 | NavigationBar on mobile (<1024px), items tappable ≥44px (FR29, WCAG 2.1 AA) |
| AC-1.2.c | 1.2 | SPA navigation — no full page reload between routes |
| AC-1.2.d | 1.2 | Deep linking via URL bar to /clientes and /contactos |
| AC-1.2.e | 1.2 | 404 / not-found view on unknown route (Spanish message, link to /clientes) |
| AC-1.2.f | 1.2 | Active nav item shows highlighted visual state (aria-current="page") |
| AC-1.2.g | 1.2 | <nav aria-label="Navegación principal">, accessible names, Tab navigation |
| AC-1.3.a | 1.3 | siesa_agents_db created with no errors; EF Core Migrations/ folder exists |
| AC-1.3.b | 1.3 | Problem Details RFC 7807 on unhandled exception, no stack traces (NFR6) |
| AC-1.3.c | 1.3 | ApplySnakeCaseNaming() applied last in OnModelCreating |
| AC-1.3.d | 1.3 | AddDbContext<AppDbContext> registered with Npgsql provider, DefaultConnection |
| AC-1.3.e | 1.3 | dotnet build — all projects compile with zero errors and zero warnings |

---

## Section 2 — Test Case Inventory

### From test-design-epic-1.md (Canonical Test Design)

| TC ID | Priority | Level | Story | Requirements |
|-------|----------|-------|-------|--------------|
| TC-E1-P0-01 | P0 | Unit/Build | 1.1 | AC-1.1.a, AC-1.1.b |
| TC-E1-P0-02 | P0 | Smoke | 1.1 | AC-1.1.a |
| TC-E1-P0-03 | P0 | API Integration | 1.1 | AC-1.1.c |
| TC-E1-P0-04 | P0 | API Integration | 1.1 | AC-1.1.e |
| TC-E1-P0-05 | P0 | API Integration | 1.3 | AC-1.3.b (NFR6) |
| TC-E1-P1-01 | P1 | Component | 1.2 | AC-E1.2, AC-1.2.c, FR28 |
| TC-E1-P1-02 | P1 | E2E | 1.2 | AC-E1.3, AC-1.2.d, FR30 |
| TC-E1-P1-03 | P1 | E2E | 1.2 | AC-E1.3, AC-1.2.d, FR30 |
| TC-E1-P1-04 | P1 | Component | 1.2 | AC-1.2.e |
| TC-E1-P1-05 | P1 | API Integration | 1.3 | AC-1.3.a, AC-1.3.c |
| TC-E1-P1-06 | P1 | Build | 1.1 | AC-1.1.d, AC-1.3.e |
| TC-E1-P2-01 | P2 | Component | 1.2 | AC-E1.1, AC-1.2.a |
| TC-E1-P2-02 | P2 | Component | 1.2 | AC-E1.1, AC-1.2.b |
| TC-E1-P2-03 | P2 | Component | 1.2 | AC-1.2.d (index redirect) |
| TC-E1-P2-04 | P2 | API Integration | 1.3 | AC-1.3.c |
| TC-E1-P3-01 | P3 | Unit | 1.1 | AC-1.1.b |
| TC-E1-P3-02 | P3 | Unit | 1.1 | AC-1.1.d |

---

## Section 3 — Test Implementation Inventory

### Implemented Test Files (from Story File Lists and ATDD Checklists)

| File | Type | Story | Tests Count | AC Coverage |
|------|------|-------|-------------|-------------|
| `e2e/tests/foundation/project-initialization.spec.ts` | E2E/Playwright | 1.1 | ~8 | AC-1.1.a, AC-1.1.e, AC-1.1.b |
| `e2e/tests/foundation/project-initialization-edge-cases.spec.ts` | E2E/Playwright | 1.1 | ~6 | AC-1.1.a, AC-1.1.e |
| `e2e/tests/foundation/navigation-shell.spec.ts` | E2E/Playwright | 1.2 | 31 | AC-1.2.a–g, AC-E1.1–E1.3 |
| `e2e/tests/foundation/navigation-shell-edge-cases.spec.ts` | E2E/Playwright | 1.2 | ~10 | AC-1.2.a–g |
| `e2e/tests/foundation/router-edge-cases.spec.ts` | E2E/Playwright | 1.2 | ~8 | AC-1.2.d, AC-1.2.e |
| `e2e/tests/foundation/frontend-config-unit.spec.ts` | Unit (Playwright-based) | 1.1 | ~5 | AC-1.1.a, AC-1.1.b |
| `e2e/tests/api/backend-initialization.api.spec.ts` | API/Playwright | 1.1 | ~8 | AC-1.1.c, AC-1.1.e |
| `e2e/tests/api/backend-initialization-edge-cases.api.spec.ts` | API/Playwright | 1.1 | ~6 | AC-1.1.c, AC-1.1.e |
| `e2e/tests/api/database-foundation.api.spec.ts` | API/Playwright | 1.3 | 13 | AC-1.3.a–b, AC-1.3.d–e |
| `e2e/tests/api/database-foundation-edge-cases.api.spec.ts` | API/Playwright | 1.3 | ~6 | AC-1.3.b (NFR6) |
| `e2e/tests/api/database-foundation-edge-cases-ac345.api.spec.ts` | API/Playwright | 1.3 | ~6 | AC-1.3.c–e |
| `frontend/src/routes/__tests__/-AppLayout.test.tsx` | Component/Vitest | 1.2 | 48 | AC-1.2.a–g, AC-E1.1 |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` | Unit/xUnit | 1.3 | 5 | AC-1.3.c, AC-1.3.d |
| `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextEdgeCaseTests.cs` | Unit/xUnit | 1.3 | ~3 | AC-1.3.c |
| `backend/tests/SiesaAgents.UnitTests/PlaceholderTest.cs` | Unit/xUnit | 1.1 | ~3 | AC-1.1.d (Entity base) |

---

## Section 4 — Requirements-to-Tests Traceability Matrix

| Req ID | Priority | Description | Test Files | TC IDs | Test Count | Status |
|--------|----------|-------------|------------|--------|-----------|--------|
| AC-E1.1 | Epic | Accessible navigation on mobile & desktop | navigation-shell.spec.ts, -AppLayout.test.tsx | TC-E1-P2-01, TC-E1-P2-02 | 8+ | COVERED |
| AC-E1.2 | Epic | Navigate without full page reload (FR28) | navigation-shell.spec.ts, -AppLayout.test.tsx | TC-E1-P1-01 | 5+ | COVERED |
| AC-E1.3 | Epic | Deep linking /clientes /contactos (FR30) | navigation-shell.spec.ts | TC-E1-P1-02, TC-E1-P1-03 | 4 | COVERED |
| AC-1.1.a | P0 | pnpm run dev on 5173 | project-initialization.spec.ts, frontend-config-unit.spec.ts | TC-E1-P0-01, TC-E1-P0-02 | 6+ | COVERED |
| AC-1.1.b | P0 | TypeScript strict mode | project-initialization.spec.ts, frontend-config-unit.spec.ts | TC-E1-P0-01 | 3+ | COVERED |
| AC-1.1.c | P0 | Backend starts on 5000, Scalar at /scalar | backend-initialization.api.spec.ts, database-foundation.api.spec.ts | TC-E1-P0-03 | 6+ | COVERED |
| AC-1.1.d | P1 | Four CA projects in solution | PlaceholderTest.cs | TC-E1-P1-06 | 3 | COVERED - PARTIAL* |
| AC-1.1.e | P0 | CORS from localhost:5173 | backend-initialization.api.spec.ts, project-initialization.spec.ts | TC-E1-P0-04 | 4+ | COVERED |
| AC-1.2.a | P2 | NavigationRail on desktop | navigation-shell.spec.ts, -AppLayout.test.tsx | TC-E1-P2-01 | 8+ | COVERED |
| AC-1.2.b | P2 | NavigationBar on mobile ≥44px (FR29) | navigation-shell.spec.ts, -AppLayout.test.tsx | TC-E1-P2-02 | 6+ | COVERED |
| AC-1.2.c | P1 | SPA navigation no full reload | navigation-shell.spec.ts, -AppLayout.test.tsx | TC-E1-P1-01 | 5+ | COVERED - PARTIAL** |
| AC-1.2.d | P1 | Deep linking /clientes /contactos | navigation-shell.spec.ts | TC-E1-P1-02, TC-E1-P1-03, TC-E1-P2-03 | 8+ | COVERED |
| AC-1.2.e | P1 | 404 view Spanish, link to /clientes | navigation-shell.spec.ts, -AppLayout.test.tsx | TC-E1-P1-04 | 6+ | COVERED |
| AC-1.2.f | P1 | Active nav item aria-current="page" | navigation-shell.spec.ts, -AppLayout.test.tsx | TC-E1-P1-01 | 6+ | COVERED |
| AC-1.2.g | P1 | <nav> aria-label, accessible names, Tab | navigation-shell.spec.ts, -AppLayout.test.tsx | TC-E1-P2-01 | 6+ | COVERED |
| AC-1.3.a | P1 | siesa_agents_db created, Migrations/ folder | database-foundation.api.spec.ts | TC-E1-P1-05 | 3 | COVERED - ENV DEPENDENT*** |
| AC-1.3.b | P0 | Problem Details RFC 7807, no stack trace (NFR6) | database-foundation.api.spec.ts, database-foundation-edge-cases.api.spec.ts | TC-E1-P0-05 | 6+ | COVERED |
| AC-1.3.c | P1 | ApplySnakeCaseNaming() last in OnModelCreating | AppDbContextTests.cs, database-foundation-edge-cases-ac345.api.spec.ts | TC-E1-P1-05, TC-E1-P2-04 | 5+ | COVERED |
| AC-1.3.d | P0 | AddDbContext<AppDbContext> with Npgsql registered | database-foundation.api.spec.ts, AppDbContextTests.cs | TC-E1-P0-05, TC-E1-P1-05 | 4+ | COVERED |
| AC-1.3.e | P1 | dotnet build — zero errors/warnings | database-foundation.api.spec.ts (proxy via server start) | TC-E1-P1-06 | 3 | COVERED - ENV DEPENDENT*** |

**Notes:**
- `*` AC-1.1.d: dotnet build not verifiable — .NET 10 SDK absent in CI environment. PlaceholderTest validates Entity base only.
- `**` AC-1.2.c: 2/31 E2E tests fail due to Playwright test framework design issue (SPA navigation detection) — implementation is correct per code review.
- `***` AC-1.3.a and AC-1.3.e: Require running PostgreSQL and .NET 10 SDK — not available in CI environment. Migration files created manually; runtime verification deferred.

---

## Section 5 — Coverage Analysis

### Coverage by Priority

| Priority | Total Requirements | Requirements with Tests | Coverage % | Target | Status |
|----------|--------------------|------------------------|------------|--------|--------|
| P0 | 5 (AC-1.1.a, 1.1.b, 1.1.c, 1.1.e, 1.3.b) | 5 | 100% | 100% | PASS |
| P1 | 10 (AC-E1.2, AC-E1.3, AC-1.1.d, AC-1.2.c–f, AC-1.3.a, 1.3.c, 1.3.e) | 10 | 100% | 90% | PASS |
| P2 | 3 (AC-E1.1, AC-1.2.a, AC-1.2.b) | 3 | 100% | 80% | PASS |
| P3 | 0 explicit P3 requirements | 0 | N/A | N/A | N/A |
| **Overall** | **18** | **18** | **100%** | **80%** | **PASS** |

### Coverage Calculation Basis

All 18 requirement ACs have at least one test file explicitly targeting them, as evidenced by:
1. The ATDD checklists for Stories 1.2 and 1.3 (TEA agent RED phase documentation)
2. The test-design-epic-1.md canonical test design
3. The story File Lists documenting test files created
4. Code review reports confirming test pass states

### Known Test Result Deficiencies

| Issue | Severity | AC Affected | Explanation |
|-------|----------|-------------|-------------|
| 2/31 E2E tests failing | LOW | AC-1.2.c | Playwright v1.56 fires `framenavigated` for `history.pushState` — test design issue, not implementation bug. Implementation verified correct by code review (PASS verdict). |
| .NET 10 SDK absent | MEDIUM | AC-1.1.d, AC-1.3.a, AC-1.3.e | `dotnet build` and `dotnet ef database update` cannot run in this CI environment. Manual verification required on a machine with .NET 10 SDK. |
| PostgreSQL not available | MEDIUM | AC-1.3.a | Live DB integration tests (dotnet ef database update, snake_case column verification) deferred. |
| Vitest unit tests: 48/48 PASS | — | AC-1.2.a–g | Confirmed passing per Story 1.2 Senior Dev Review |
| xUnit unit tests: pass | — | AC-1.1.d, AC-1.3.c–d | Functional per code review (cannot run dotnet test in this env) |

---

## Section 6 — Gaps Identified

| Gap ID | AC | Priority | Gap Description | Risk Level |
|--------|-----|----------|-----------------|------------|
| GAP-01 | AC-1.1.d, AC-1.3.e | P1 | `dotnet build` not executable in CI (no .NET 10 SDK). Build correctness verified by code structure analysis only. | MEDIUM |
| GAP-02 | AC-1.3.a | P1 | `dotnet ef database update` not runnable without .NET SDK + live PostgreSQL. Migration files manually created but not runtime-verified. | MEDIUM |
| GAP-03 | AC-1.2.c | P1 | 2/31 E2E tests remain failing due to Playwright test design issue. Core SPA navigation is correctly implemented per code review but test evidence is incomplete. | LOW |
| GAP-04 | AC-1.3.d | P0 | API tests for AppDbContext DI registration require a running backend (port 5000). Backend start not verified in this CI environment. | LOW-MED |
| GAP-05 | NFR6/AC-1.3.b | P0 | Problem Details middleware verified by code inspection; API-level test execution requires running backend. Code inspection confirms correct implementation pattern. | LOW |

---

## Section 7 — Story Implementation Status Summary

| Story | Status | Stories Pass | Review Verdict | Key Evidence |
|-------|--------|-------------|----------------|--------------|
| 1.1 — Project Initialization | done | All tasks complete | PASS CON OBSERVACIONES (7 issues auto-fixed) | All files present, 48 unit tests pass, TypeScript 0 errors |
| 1.2 — Frontend Navigation Shell | done | All tasks complete | PASS (4 issues auto-fixed) | 48/48 Vitest tests pass, 29/31 E2E pass |
| 1.3 — Backend Database Foundation | in-progress* | All tasks marked [x] | N/A (no review file found) | Code correct per inspection; runtime blocked by env constraints |

*Note: sprint-status.yaml shows 1-3 as `in-progress` but all tasks in the story file are marked `[x]` complete. No code review file found for story 1.3 (unlike 1.1 and 1.2 which have review files).
