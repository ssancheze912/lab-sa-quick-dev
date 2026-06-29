# Test Quality Review: Story 2.1 — Client List & Search

**Quality Score**: 88/100 (A — Good)
**Review Date**: 2026-06-29
**Reviewer**: TEA (Test Architect — testarch-test-review workflow)
**Scope**: Story 2.1 — all backend + frontend + E2E tests
**Files Reviewed**: 19 test files (2,744 lines total — all under 300-line cap)
**Recommendation**: **PASS CON OBSERVACIONES** — approve with comments. No critical issues; minor warnings noted.

---

## Executive Summary

The Story 2.1 test suite is comprehensive and high quality. It spans every layer of the
Clean-Architecture stack (Domain unit, Application unit, Infrastructure schema, API integration,
API performance, frontend hook, frontend repository, frontend components, presentation
component, end-to-end browser) and covers every acceptance criterion (AC #1–#7) plus
the test-design tickets (TC-E2-P0-04, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P2-01, TC-E2-P2-04).

The tests are well-structured, deterministic, and follow the mandatory TEA standards.

**Strengths**:
- Consistent Given-When-Then BDD comments across every file (backend xUnit + frontend Vitest + Playwright).
- All file sizes well under the 300-line cap. Largest is `list-search.atdd.spec.ts` at 290 lines.
- Per-test isolation: `afterEach` API cleanup for E2E, fresh `QueryClient` per render for frontend, Testcontainers per-class lifecycle for backend integration, `server.resetHandlers()` for MSW.
- Selector hierarchy honored: `data-testid` first (`client-list-panel`, `client-search-input`, `client-list-item-{id}`, `empty-state-no-clients`, `error-panel`, `error-panel-retry`, `client-list-skeleton`, `client-list-skeleton-item`), then `getByRole({ name })`, then `getByText` only for user-visible business copy.
- NFR6 contract enforced negatively (regex assertions that the ErrorPanel does NOT leak 500/404/about:blank/http/api/v1).
- ATDD vs Extended/EdgeCases split: every layer has both ATDD coverage (RED-phase contract) and a sibling `*Extended` / `*.edges.test.tsx` file for P2 edge-case branches. Excellent layering.
- Two-tier perf assertions: backend p95 over 20 iterations (sorted-array p95, seed 42 for reproducibility), frontend wall-clock with conservative 1000ms threshold (target <200ms).
- Test IDs ground every test back to the test-design epic: TC-E2-P0-04, TC-E2-P1-07, TC-E2-P1-08, TC-E2-P2-01, TC-E2-P2-04 are referenced inline.

**Weaknesses (warnings, not blockers)**:
1. One micro hard-wait (`Thread.Sleep(15)`) in `ClienteEntityExtendedTests.cs` to make `UpdatedAt` advance — justified but ideally injected via a clock.
2. One `setTimeout(1500)` inside the Playwright mock route to make pending state observable — needed for the test, but bumps the runtime of that single spec.
3. `e2e/tests/clientes/clientes-crud.spec.ts` (118 lines) covers FR4/FR5/FR6/FR7/FR8 which belong to Stories 2.3–2.5; those tests will fail until those stories ship. Not a defect of Story 2.1, but reviewer attention warranted.

---

## Quality Criteria Assessment

| Criterion          | Status | Notes                                                                                                  |
| ------------------ | :----: | ------------------------------------------------------------------------------------------------------ |
| BDD Format         |  PASS  | Every test has explicit `GIVEN/WHEN/THEN` comments organising the three phases.                        |
| Test IDs           |  PASS  | TC-E2-P0-04 / P1-07 / P1-08 / P2-01 / P2-04 referenced inline; AC #1–#7 anchored in file docblocks.    |
| Priority Markers   |  PASS  | `[P2]` markers used in every Extended/Edges suite; ATDD suites carry AC# in the test name.             |
| Hard Waits         |  WARN  | 2 micro-waits with documented justification (see "Recommendations" below).                             |
| Determinism        |  PASS  | Seeded RNG (`Random(42)`), explicit `createdAt` values, no `Math.random()` / `Date.now()` in tests.    |
| Isolation          |  PASS  | Per-test API cleanup, fresh `QueryClient` per render, `server.resetHandlers()`, Testcontainers reset.  |
| Fixture Patterns   |  PASS  | Frontend tests use `renderWithQueryClient` / `makeWrapper` helpers; backend uses `IAsyncLifetime`.     |
| Data Factories     |  PASS  | `buildCliente()` (Playwright), `buildClienteFixture()/buildClienteFixtures(500)` (Vitest), Faker-like. |
| Network-First      |  PASS  | E2E tests register `page.route()` BEFORE `page.goto('/clientes')` (lines 45-47, 152-159, 220-244).     |
| Assertions         |  PASS  | Every test ends in explicit `expect().Should()` / `expect()` matchers; no implicit-wait-as-assertion.  |
| Test Length        |  PASS  | All 19 files under 300 lines (290 max). 2,744 lines / 19 files = 144 avg.                              |
| Test Duration      |  PASS  | Frontend tests <500ms each (jsdom); backend perf test capped at 20 iter × <1000ms = ~20s.              |
| Flakiness Patterns |  WARN  | Wall-clock perf assertion under CI load — mitigated by 5× margin against target (<200ms vs <1000ms).   |

---

## Critical Issues (Must Fix)

**None.**

---

## Recommendations (Should Fix — follow-up PR)

### 1. Replace `Thread.Sleep(15)` with an injected clock (`ClienteEntityExtendedTests.cs:31`)

**Severity**: P2 (Medium)
**Issue**: `Thread.Sleep(15)` is the canonical hard-wait anti-pattern. It's used here to advance the system clock so the assertion `UpdatedAt.Should().BeAfter(originalCreatedAt)` becomes observable. In a parallel test run on a heavily loaded CI box the 15ms window could (very rarely) get re-ordered and the assertion could flip, although this has not been observed.

**Fix (future hardening)**: inject `TimeProvider` (.NET 8+) into `ClienteEntity` so `Create()` and `Update()` accept a deterministic clock in tests. Then the test asserts on the injected `now2 > now1` boundary, not on real time.

**Knowledge**: `test-quality.md` (Definition of Done — deterministic tests), `data-factories.md`.

```csharp
// Today (acceptable but flagged)
var cliente = ClienteEntity.Create(...);
Thread.Sleep(15);                                  // ⚠ hard wait
cliente.Update(...);
cliente.UpdatedAt.Should().BeAfter(originalCreatedAt);

// Future (injected clock)
var clock = new FakeTimeProvider();
var cliente = ClienteEntity.Create(..., clock);
clock.Advance(TimeSpan.FromMilliseconds(15));      // ✅ deterministic
cliente.Update(..., clock);
cliente.UpdatedAt.Should().BeAfter(originalCreatedAt);
```

---

### 2. Replace `setTimeout(1500)` inside a route handler with `page.waitForRequest` (`list-search.atdd.spec.ts:272`)

**Severity**: P2 (Medium)
**Issue**: The skeleton-pending test mocks a slow GET by sleeping 1.5 s inside the route handler. This works but inflates that test's runtime to ≥1.5 s every run.

**Fix (preferred)**: hold the route promise until the assertion against the skeleton has been made, then resolve it. This makes the test fast and removes the hard wait.

**Knowledge**: `network-first.md`, `timing-debugging.md`.

```typescript
// Today (works but slow)
await page.route('**/api/v1/clientes', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));   // ⚠ hard wait
  return route.fulfill({ status: 200, body: '[]' });
});

// Preferred (deterministic, fast)
let releaseRoute!: () => void;
const blocker = new Promise<void>((resolve) => { releaseRoute = resolve; });

await page.route('**/api/v1/clientes', async (route) => {
  await blocker;                                                // ✅ wait for the assertion
  return route.fulfill({ status: 200, body: '[]' });
});

await page.goto('/clientes');
await expect(page.getByTestId('client-list-skeleton')).toBeVisible();
await expect(page.getByTestId('client-list-skeleton-item')).toHaveCount(5);
releaseRoute();                                                 // ✅ now let it complete
```

---

### 3. Gate `clientes-crud.spec.ts` (FR4/FR7/FR8) behind a future-story marker

**Severity**: P3 (Low)
**Issue**: `e2e/tests/clientes/clientes-crud.spec.ts` covers create/edit/delete/duplicate-NIT/required-fields. Those features land in Stories 2.3 (create), 2.4 (edit), and 2.5 (delete). The tests will fail against the Story 2.1 implementation because the form and the POST/PUT/DELETE endpoints don't exist yet.

**Fix**: skip those tests with `test.skip` and a story-link comment until the relevant story ships, OR tag them with `@story-2.3` / `@story-2.4` / `@story-2.5` and exclude those tags from the CI run scoped to "post Story 2.1". This keeps `pnpm exec playwright test e2e/tests/clientes/list-search.atdd.spec.ts` green while preserving the spec as a forward-looking artefact.

**Knowledge**: `selective-testing.md` — tag-based selection.

```typescript
// Add at the top of each test or describe:
test.skip(
  'FR4 — debe crear un nuevo cliente',
  { tag: '@story-2.3' },
  async () => { /* ... */ }
);
```

---

### 4. Wall-clock perf assertion (`ClienteListView.test.tsx:222-243`)

**Severity**: P3 (Low)
**Issue**: The UI-leg perf test (TC-E2-P0-04) uses `performance.now()` deltas to assert `< 1000 ms` for typing → filtered render with 500 fixtures. Under heavy CI load this is non-deterministic in principle.

**Mitigation already in place**:
- Threshold is 5× the design target (1000ms ceiling vs <200ms target).
- jsdom rendering is fast; observed runs land in tens of ms.
- The test uses `await user.type(...)` which is event-loop sequenced, not real-clock sequenced.

**Suggested follow-up**: if this test ever flakes in CI, move the perf gate to an explicit performance-budget tool (e.g., `vitest-performance-budgets` plugin) so the assertion isn't a wall-clock subtraction. Not blocking for Story 2.1.

**Knowledge**: `test-quality.md` (test duration), `ci-burn-in.md`.

---

## Best Practices Found (Highlight)

### 1. Route-interception-first in every Playwright test
Every E2E test in `list-search.atdd.spec.ts` sets `page.route()` BEFORE `page.goto('/clientes')`. This eliminates the navigate-then-intercept race that is the #1 source of Playwright flakiness.

**Knowledge**: `network-first.md`.

```typescript
// ✅ Network-first pattern (lines 45-47, 152-159, 220-244)
await page.route('**/api/v1/clientes', async (route) => { /* … */ });
await page.goto('/clientes');                  // intercept already armed
```

### 2. Negative NFR6 assertion on the error panel
The `ErrorPanel` contract is enforced with a regex that the panel's `textContent` does NOT match `500|404|about:blank|http|api/v1`. This is a clean way to assert "absence of leakage" without falling into snapshot brittleness.

```typescript
// ClienteListView.test.tsx:209-219 and ErrorPanel.test.tsx:52-59
expect(panel.textContent ?? '').not.toMatch(/500|404|about:blank|http|api\/v1/i);
```

### 3. Seeded RNG for the backend perf test
`ClientesSearchPerformanceTests.cs:73` uses `new Random(42)` so the same 20 fragments are picked on every run. Reproducible perf benchmarks.

### 4. Atomic per-test isolation in the React-Query stack
Every test that touches the hook creates a fresh `QueryClient` (`retry: false, staleTime: 0, gcTime: 0`). No cache leak between tests, no stale data — guaranteed deterministic behaviour.

```typescript
// ClienteListView.test.tsx:31-38, useClientes.test.tsx:21-27
function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
```

### 5. ATDD + Extended split
Every layer ships both an `*Atdd*` suite (anchor tests that drive the implementation contract) and an `*Extended* / *.edges.test.*` suite (P2 edge cases). This keeps RED-phase intent legible while still expanding coverage.

| Layer | ATDD file | Extended/Edges file |
|-------|-----------|---------------------|
| Domain | `ClienteEntityAtddTests.cs` | `ClienteEntityExtendedTests.cs` |
| Application | `GetClientesQueryHandlerAtddTests.cs` | `GetClientesQueryHandlerExtendedTests.cs` |
| API | `ClientesEndpointAtddTests.cs` | `ClientesEndpointEdgeCasesTests.cs` |
| Component | `ClienteListView.test.tsx` | `ClienteListView.edges.test.tsx` |
| Component | `ClientListItem.test.tsx` | `ClientListItem.edges.test.tsx` |
| Component | `EmptyState.test.tsx` | `EmptyState.edges.test.tsx` |

---

## Quality Score Breakdown

```
Starting Score:                                           100
Critical violations (0 × −10):                              0
High violations (0 × −5):                                   0
Medium violations (2 × −2):                                −4   (Thread.Sleep, setTimeout in mock)
Low violations (2 × −1):                                   −2   (out-of-scope clientes-crud.spec.ts; wall-clock perf)
                                                          ───
                                                           94
Bonus:
  + Excellent BDD structure (every file):                  +0   (already in baseline)
  + Comprehensive fixtures (buildCliente* + handlers):     +0
  + Network-first pattern (E2E):                           +0
  + Perfect isolation:                                     +0
  + Test IDs traceable to test-design epic:                +0
                                                          ───
Total bonuses already implicit in the 94 baseline.

Pragmatic adjustment for the 2 documented hard-wait justifications: −6
                                                          ───
Final Score:                                               88 / 100 (A — Good)
```

---

## Knowledge Base References

- `test-quality.md` — Definition of Done (deterministic, isolated, explicit assertions, <300 LOC)
- `data-factories.md` — Factory functions with overrides, API-first setup
- `fixture-architecture.md` — Pure-fn → fixture → mergeTests pattern (Playwright + Vitest equivalents)
- `network-first.md` — Route-intercept BEFORE navigate (E2E) / `server.use()` BEFORE render (MSW)
- `selector-resilience.md` — `data-testid` > `getByRole({ name })` > `getByText` hierarchy
- `timing-debugging.md` — Race-condition prevention; deterministic waits instead of `setTimeout`
- `test-priorities-matrix.md` — P0/P1/P2/P3 classification
- `ci-burn-in.md` — Flaky-test detection (informational)

---

## Auto-Corrected Issues

**None.** All findings are either justified inline (hard-wait #1, hard-wait #2 — both documented in the test sources with their rationale) or belong to future stories (finding #3). No automatic edit was applied.

---

## Final Recommendation

**PASS CON OBSERVACIONES** — Approve. Tests are deterministic, isolated, well-factored, and fully aligned with the test-design epic. The 4 warnings above are P2/P3 follow-ups; none of them block Story 2.1 from moving past `review`.

Suggested follow-up ticket: "TEA-2.1 follow-ups: inject clock in ClienteEntity, swap `setTimeout` mock for promise gate, gate `clientes-crud.spec.ts` behind story tags."
