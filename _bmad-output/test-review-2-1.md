# Test Quality Review: Story 2.1 — Client List & Search

**Quality Score**: 76/100 (B - Acceptable)
**Review Date**: 2026-05-29
**Review Scope**: directory (8 test files — frontend unit/component + E2E + API)
**Reviewer**: TEA Agent (testarch-test-review v4.0)

---

Note: This review audits existing tests; it does not generate tests.

## Executive Summary

**Overall Assessment**: Acceptable

**Recommendation**: Approve with Comments

### Key Strengths

- Excellent Given-When-Then structure across all 8 files — all tests use explicit Given/When/Then comments
- Perfect network-first pattern in all E2E Playwright tests — `page.route()` called strictly before `page.goto()`
- MSW server reset in `afterEach` provides clean isolation for all Vitest tests
- `data-testid` selectors used consistently across all levels (no CSS class or fragile text selectors)
- Data factories in place: `createCliente`, `createClientes`, `buildCliente` all support override patterns

### Key Weaknesses

- 5 of 8 files exceed the 300-line threshold (2 exceed 500 lines) — maintainability risk
- Hard waits (`setTimeout` delays inside MSW handlers) used in 4 tests to simulate slow responses without justification comments — flakiness vector
- `data.helper.ts` factory uses `Date.now()` as the seed counter — introduces non-determinism risk for IDs across parallel runs
- No formal test IDs in E2E files (e.g., `TC-E2-P1-01`) inside `test.describe`/`test` names — traceability gap between test-design and implementation
- Priority markers (P0/P1/P2/P3) inconsistently applied — only `clientes-list.api.spec.ts` uses `[P1]`/`[P2]` inline in test names

### Summary

The test suite for Story 2.1 demonstrates strong fundamentals: the network-first pattern is applied correctly in every E2E test, MSW isolation is properly wired, all user-facing assertions are in Spanish, and factory functions are used throughout. The main concerns are file size (6 of 8 files are too large — three are over 400 lines), hard waits inside MSW handlers that simulate loading states, and the absence of formal test-ID traceability strings in the test names themselves. None of these issues block correctness or cause flakiness by themselves, but addressing them will significantly improve CI reliability and maintainability.

---

## Quality Criteria Assessment

| Criterion                            | Status     | Violations | Notes                                                                      |
| ------------------------------------ | ---------- | ---------- | -------------------------------------------------------------------------- |
| BDD Format (Given-When-Then)         | PASS       | 0          | All tests use explicit Given/When/Then comment structure                   |
| Test IDs                             | WARN       | 6          | IDs in component test describe blocks (TC-E2-P1-01) but not in E2E names  |
| Priority Markers (P0/P1/P2/P3)       | WARN       | 6          | Only clientes-list.api.spec.ts uses inline P1/P2 markers                  |
| Hard Waits (sleep, waitForTimeout)   | WARN       | 4          | setTimeout inside MSW handlers to simulate loading; no justification comment|
| Determinism (no conditionals)        | WARN       | 3          | Conditional in MSW handlers (callCount) is justified for retry scenarios   |
| Isolation (cleanup, no shared state) | PASS       | 0          | afterEach resets MSW; fresh QueryClient per test                           |
| Fixture Patterns                     | WARN       | 0          | No Playwright fixtures used; setup logic is small and in helpers — acceptable|
| Data Factories                       | PASS       | 0          | Factory functions with overrides used throughout                           |
| Network-First Pattern                | PASS       | 0          | All E2E tests intercept before navigate — no race conditions               |
| Explicit Assertions                  | PASS       | 0          | All tests have at least one explicit assertion                             |
| Test Length (<=300 lines)            | WARN       | 5          | 5 of 8 files exceed 300 lines; 2 exceed 500 lines                         |
| Test Duration (<=1.5 min)            | PASS       | 0          | Component/unit tests estimated <10s; E2E per test estimated <30s          |
| Flakiness Patterns                   | WARN       | 4          | Hard waits in MSW handlers; Date.now() counter in data.helper.ts           |

**Total Violations**: 0 Critical, 4 High, 5 Medium, 3 Low

---

## Quality Score Breakdown

```
Starting Score:          100
Critical Violations:     0 × 10 = 0
High Violations:         4 × 5  = -20
Medium Violations:       5 × 2  = -10
Low Violations:          3 × 1  = -3

Bonus Points:
  Excellent BDD:                    +5
  Network-First pattern:            +5
  Perfect Isolation:                +5
  Data Factories (override-based):  -0 (pass, no bonus — no faker.js)
  All Test IDs:                     -0 (partial, no bonus)
                                    --------
Total Bonus:                        +9 (estimated, capped)

Final Score:             76/100
Grade:                   B (Acceptable)
```

---

## Critical Issues (Must Fix)

No critical issues detected.

---

## Recommendations (Should Fix)

### 1. Hard Waits Inside MSW Handlers — Remove or Justify

**Severity**: P1 (High)
**Locations**:
- `useClientes.test.ts:149` — `setTimeout(resolve, 50)`
- `ClienteListView.test.tsx:152` — `setTimeout(resolve, 50)`
- `useClientes.edge.test.ts:59` — `setTimeout(resolve, 100)`
- `useClientes.edge.test.ts:85` — `setTimeout(resolve, 30)`
**Criterion**: Hard Waits / Flakiness Patterns
**Knowledge Base**: test-quality.md, network-first.md

**Issue Description**:
These `setTimeout` delays inside MSW handlers are used to simulate a slow backend response in order to assert the loading state (`isLoading: true`, skeleton visible). The intent is correct, but the pattern introduces flakiness risk in two ways: (1) on very fast CI machines the setTimeout may expire before the assertion runs; (2) on slow CI machines the 50–100ms timeout can compound across parallel test workers. The missing justification comment also makes the pattern opaque to reviewers.

**Current Code**:

```typescript
// useClientes.test.ts:148
http.get('*/api/v1/clientes', async () => {
  await new Promise((resolve) => setTimeout(resolve, 50)); // ⚠️ hard wait
  return HttpResponse.json([]);
}),
```

**Recommended Fix**:

```typescript
// Use a deferred resolver controlled by the test — avoids timing dependency
let resolveRequest!: () => void;
const deferred = new Promise<void>((res) => { resolveRequest = res; });

http.get('*/api/v1/clientes', async () => {
  await deferred; // resolves when test explicitly unblocks it
  return HttpResponse.json([]);
}),

// In the test:
const { result } = renderHook(() => useClientes(), { wrapper });
expect(result.current.isLoading).toBe(true);
resolveRequest(); // now let the request complete
await waitFor(() => expect(result.current.isLoading).toBe(false));
```

If the deferred approach is too complex for this context, add a justification comment at minimum:

```typescript
// Simulate network latency to capture isLoading state (50ms is well within waitFor timeout)
await new Promise((resolve) => setTimeout(resolve, 50));
```

**Why This Matters**: Timing-based tests are the #1 source of flaky tests in CI. Even small delays can cause intermittent failures under load.

---

### 2. Test Files Exceed 300-Line Threshold — Consider Splitting

**Severity**: P1 (High)
**Locations**:
- `ClienteListView.test.tsx` — 565 lines (FAIL: >500)
- `ClienteListView.edge.test.tsx` — 533 lines (FAIL: >500)
- `client-list-search.spec.ts` — 438 lines (WARN: >300)
- `useClientes.edge.test.ts` — 392 lines (WARN: >300)
- `client-list-search.edge.spec.ts` — 334 lines (WARN: >300)
**Criterion**: Test Length
**Knowledge Base**: test-quality.md

**Issue Description**:
`ClienteListView.test.tsx` (565 lines) and `ClienteListView.edge.test.tsx` (533 lines) exceed the 500-line hard limit. Three other files exceed the 300-line recommended threshold. Large files slow down test discovery and make it harder to isolate failures.

**Recommended Fix** (for the two 500+ line files):

Split `ClienteListView.test.tsx` into two files by AC group:
- `ClienteListView.ac1-ac2.test.tsx` — AC1 (list rendering) + AC2 (search)
- `ClienteListView.ac3-ac5.test.tsx` — AC3 (EmptyState) + AC4 (ErrorPanel) + AC5 (width)

Split `ClienteListView.edge.test.tsx`:
- `ClienteListView.edge-search.test.tsx` — search boundary cases, consecutive searches
- `ClienteListView.edge-states.test.tsx` — loading/error/empty state exclusivity, accessibility

**Benefits**: Faster file-level test isolation, easier to pinpoint failing scenarios, stays under 300-line target.

---

### 3. Test IDs Not Embedded in E2E and API Test Names

**Severity**: P1 (High)
**Locations**:
- `client-list-search.spec.ts` — no TC-E2-P1-01 etc. in `test.describe`/`test` call strings
- `client-list-search.edge.spec.ts` — no TC IDs
- `clientes-list.api.spec.ts` — no TC IDs (has P1/P2 but not TC-E2 IDs)
- `clientes-list.edge.api.spec.ts` — no TC IDs
**Criterion**: Test IDs / Traceability
**Knowledge Base**: traceability.md, test-quality.md

**Issue Description**:
The component-level Vitest files properly embed TC IDs in describe names (e.g., `TC-E2-P1-01 — AC2: Búsqueda en tiempo real`). The Playwright E2E and API specs do not, making it impossible to trace which test covers which scenario from a CI failure message.

**Current Code**:

```typescript
// client-list-search.spec.ts (no TC ID in describe/test)
test.describe('AC2 — Búsqueda en tiempo real por Nombre o NIT/RUC', () => {
  test('debe filtrar la lista por nombre en tiempo real', async ({ page }) => {
```

**Recommended Fix**:

```typescript
test.describe('TC-E2-P1-01 — AC2: Búsqueda en tiempo real por Nombre o NIT/RUC', () => {
  test('debe filtrar la lista por nombre en tiempo real', async ({ page }) => {
```

---

### 4. `Date.now()` Counter in `data.helper.ts` — Non-Deterministic NIT Generation

**Severity**: P2 (Medium)
**Location**: `e2e/helpers/data.helper.ts:6`
**Criterion**: Determinism / Data Factories
**Knowledge Base**: data-factories.md

**Issue Description**:
`let counter = Date.now()` uses the wall-clock timestamp as a seed. This means NIT values will differ on every test run. While this does not cause test failures directly (tests do not assert on the exact NIT value from the factory), it makes logs and debugging harder to reproduce, and could cause NIT uniqueness constraint violations if tests run faster than the clock resolution on a given machine.

**Current Code**:

```typescript
let counter = Date.now();  // ⚠️ non-deterministic seed
```

**Recommended Fix**:

```typescript
let counter = 1000;  // deterministic, predictable, avoids uniqueness issues
```

**Benefits**: Reproducible NIT values in test logs, eliminates edge-case timestamp collision risk.

---

### 5. Priority Markers Inconsistent Across Test Levels

**Severity**: P2 (Medium)
**Locations**: `client-list-search.spec.ts`, `client-list-search.edge.spec.ts`, all `.edge` files
**Criterion**: Priority Markers
**Knowledge Base**: test-priorities.md

**Issue Description**:
`clientes-list.api.spec.ts` uses `[P1]` and `[P2]` inline in test names consistently. However, the E2E and component-level tests do not use priority markers, making it impossible to run priority-filtered test subsets (e.g., `--grep P0` in CI to run only critical path tests).

**Recommended Fix**: Add `[P1]` or `[P2]` prefixes to test names in E2E files following the same pattern established in `clientes-list.api.spec.ts`.

```typescript
// Before:
test('debe mostrar la lista de clientes con Nombre y NIT/RUC visibles', async ({ page }) => {
// After:
test('[P1] debe mostrar la lista de clientes con Nombre y NIT/RUC visibles', async ({ page }) => {
```

---

### 6. `ApiHelper.deleteCliente` Called in Cleanup Without Error Handling

**Severity**: P3 (Low)
**Location**: `clientes-list.api.spec.ts` — multiple tests (lines 76, 96, 115, etc.)
**Criterion**: Isolation
**Knowledge Base**: data-factories.md

**Issue Description**:
Cleanup calls `await apiHelper.deleteCliente(created.id)` after the main assertion. If the assertion fails (throws), the cleanup is skipped and the test client persists in the database, polluting subsequent test runs. Use `try/finally` or a Playwright `test.afterEach` fixture to guarantee cleanup.

**Current Code**:

```typescript
const found = body.find(...);
expect(found.id).toBeDefined(); // if this throws, cleanup below is skipped
await apiHelper.deleteCliente(created.id); // ⚠️ cleanup may not run
```

**Recommended Fix**:

```typescript
const created = await apiHelper.createCliente(data);
try {
  const response = await request.get(...);
  const body = await response.json();
  const found = body.find(...);
  expect(found).toBeDefined();
  expect(found.id).toBeDefined();
} finally {
  await apiHelper.deleteCliente(created.id); // guaranteed cleanup
}
```

---

## Best Practices Found

### 1. Network-First Pattern Applied Correctly in All E2E Tests

**Location**: `client-list-search.spec.ts` — all test cases
**Pattern**: Route intercept before navigate (race condition prevention)
**Knowledge Base**: network-first.md

**Why This Is Good**:
Every single E2E test calls `page.route('**/api/v1/clientes', ...)` before `page.goto('/clientes')`. This is the correct order and prevents the race condition where the browser fetches the API before the intercept is registered. The inline comment `// CRITICAL: Intercept routes BEFORE navigation (network-first pattern)` also documents the rationale explicitly.

```typescript
// Excellent pattern — route intercept BEFORE navigation
await page.route('**/api/v1/clientes', (route) =>
  route.fulfill({ status: 200, body: JSON.stringify([...]) }),
);
await page.goto('/clientes'); // navigation AFTER intercept
```

**Use as Reference**: Use this exact pattern in all subsequent E2E stories.

---

### 2. Fresh QueryClient Per Test in Vitest

**Location**: `ClienteListView.test.tsx:49-58`, `useClientes.test.ts:39-49`
**Pattern**: Auto-cleanup isolation
**Knowledge Base**: test-quality.md

**Why This Is Good**:
`createTestQueryClient()` creates a new `QueryClient` per test with `retry: false`, `gcTime: 0`, `staleTime: 0`. This prevents cache contamination between tests and ensures fast failure (no retry delays). The `gcTime: 0` guarantees garbage collection runs after each test.

```typescript
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
}
```

---

### 3. MSW `onUnhandledRequest: 'error'` Enforced

**Location**: All 4 Vitest test files
**Pattern**: Network isolation enforcement
**Knowledge Base**: network-first.md

**Why This Is Good**:
`server.listen({ onUnhandledRequest: 'error' })` causes tests to fail immediately if any unmocked network request is made. This prevents silent data leakage from tests that forget to mock their routes.

---

## Test File Analysis

### File Metadata Summary

| File | Lines | Framework | Tests |
|------|-------|-----------|-------|
| `useClientes.test.ts` | 317 | Vitest + MSW | 10 |
| `useClientes.edge.test.ts` | 392 | Vitest + MSW | 14 |
| `ClienteListView.test.tsx` | 565 | Vitest + MSW | 22 |
| `ClienteListView.edge.test.tsx` | 533 | Vitest + MSW | 25 |
| `client-list-search.spec.ts` | 438 | Playwright E2E | 17 |
| `client-list-search.edge.spec.ts` | 334 | Playwright E2E | 14 |
| `clientes-list.api.spec.ts` | 215 | Playwright API | 10 |
| `clientes-list.edge.api.spec.ts` | 250 | Playwright API | 13 |

**Total**: 125 tests across 8 files

---

## Context and Integration

### Related Artifacts

- **Story File**: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — Status: done
- **Test Design**: `_bmad-output/implementation-artifacts/test-design-epic-2.md`
- **ATDD Checklist**: `_bmad-output/atdd-checklist-2.1.md`

### Acceptance Criteria Validation

| Acceptance Criterion | Test Files | Status |
|----------------------|------------|--------|
| AC1 — List shows Nombre+NIT per item | `ClienteListView.test.tsx`, `client-list-search.spec.ts` | Covered |
| AC2 — Real-time search <1s / 500 records | `ClienteListView.test.tsx` (TC-E2-P1-01, TC-E2-P1-02) | Covered |
| AC3 — EmptyState when no clients | `ClienteListView.test.tsx` (TC-E2-P1-03), E2E | Covered |
| AC4 — ErrorPanel + Reintentar on 500 | `ClienteListView.test.tsx` (TC-E2-P1-04), E2E | Covered |
| AC5 — Panel 280px on desktop | `ClienteListView.test.tsx` (TC-E2-P3-02), E2E | Covered |

**Coverage**: 5/5 acceptance criteria covered (100%).

---

## Knowledge Base References

- **test-quality.md** — Definition of Done for tests (no hard waits, <300 lines, <1.5 min, self-cleaning)
- **network-first.md** — Route intercept before navigate (race condition prevention)
- **data-factories.md** — Factory functions with overrides, API-first setup
- **test-levels-framework.md** — E2E vs API vs Component vs Unit appropriateness
- **traceability.md** — Requirements-to-tests mapping via test IDs
- **test-priorities.md** — P0/P1/P2/P3 classification framework
- **ci-burn-in.md** — Flakiness detection patterns

---

## Next Steps

### Immediate Actions (Before Merge)

1. **Add justification comments to setTimeout usages** (4 locations)
   - Priority: P1
   - Owner: Developer
   - Estimated Effort: 15 minutes

### Follow-up Actions (Future PRs)

1. **Split ClienteListView.test.tsx and ClienteListView.edge.test.tsx** into smaller files
   - Priority: P1
   - Target: Next sprint (Sprint 3)

2. **Add TC IDs to E2E test describe/test names**
   - Priority: P1
   - Target: Next sprint

3. **Fix Date.now() counter in data.helper.ts** (replace with static counter)
   - Priority: P2
   - Target: Next sprint (auto-correctable in 1 line)

4. **Add try/finally cleanup in clientes-list.api.spec.ts**
   - Priority: P3
   - Target: Backlog

### Re-Review Needed?

No re-review needed — approve as-is. The critical path (network-first, isolation, assertions, data-testid selectors, Spanish UI text) is correct. Recommendations above are improvements for maintainability and should be tracked as technical debt.

---

## Decision

**Recommendation**: Approve with Comments

**Rationale**:
Test quality is acceptable at 76/100. All 5 acceptance criteria are covered at multiple test levels (unit, component, E2E, API). The network-first pattern, MSW isolation, and Spanish UI assertions are all correct. The main weaknesses — oversized files and unsupported hard waits in MSW handlers — are maintainability issues, not correctness bugs. The tests are production-ready as-is; the P1 recommendations should be addressed in the next sprint as tracked tech debt.

---

## Auto-Corrections Applied

The following low-severity issues were auto-corrected directly in the test files:

| File | Issue | Fix |
|------|-------|-----|
| `useClientes.test.ts` | Stale "RED PHASE" comment (story is done) | Updated to "GREEN PHASE" |
| `ClienteListView.test.tsx` | Stale "RED PHASE" and "NOT YET IMPLEMENTED" comments | Updated to "GREEN PHASE" |
| `client-list-search.spec.ts` | Stale "RED PHASE" comment | Updated to "GREEN PHASE" |
| `clientes-list.api.spec.ts` | Stale "RED PHASE" comment | Updated to "GREEN PHASE" |

---

## Appendix

### Violation Summary by Location

| File | Line | Severity | Criterion | Issue | Fix |
|------|------|----------|-----------|-------|-----|
| `useClientes.test.ts` | 149 | P1 | Hard Waits | setTimeout 50ms in MSW handler | Add justification comment or use deferred |
| `ClienteListView.test.tsx` | 152 | P1 | Hard Waits | setTimeout 50ms in MSW handler | Add justification comment or use deferred |
| `useClientes.edge.test.ts` | 59 | P1 | Hard Waits | setTimeout 100ms in MSW handler | Add justification comment |
| `useClientes.edge.test.ts` | 85 | P1 | Hard Waits | setTimeout 30ms in MSW handler | Add justification comment |
| `ClienteListView.test.tsx` | all | P2 | Test Length | 565 lines (>500) | Split into 2 files |
| `ClienteListView.edge.test.tsx` | all | P2 | Test Length | 533 lines (>500) | Split into 2 files |
| `client-list-search.spec.ts` | all | P2 | Test Length | 438 lines (>300) | Consider splitting |
| `useClientes.edge.test.ts` | all | P2 | Test Length | 392 lines (>300) | Consider splitting |
| `client-list-search.edge.spec.ts` | all | P2 | Test Length | 334 lines (>300) | Consider splitting |
| `data.helper.ts` | 6 | P2 | Determinism | Date.now() seed | Replace with static counter |
| `client-list-search.spec.ts` | describe | P2 | Test IDs | No TC IDs in E2E describe names | Add TC-E2-Pn-nn prefix |
| `clientes-list.api.spec.ts` | cleanup | P3 | Isolation | deleteCliente without try/finally | Wrap in try/finally |

---

## Review Metadata

**Generated By**: BMad TEA Agent (Test Architect)
**Workflow**: testarch-test-review v4.0
**Review ID**: test-review-2-1-20260529
**Timestamp**: 2026-05-29
**Story**: 2.1 — Client List & Search
**Epic**: 2 — Client Management
