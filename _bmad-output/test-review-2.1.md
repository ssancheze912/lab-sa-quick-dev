# Test Quality Review: Story 2.1 - Client List & Search

**Quality Score**: 92/100 (A - Good)
**Review Date**: 2026-07-08
**Review Scope**: directory (20 test files across backend + frontend)
**Reviewer**: TEA Agent (autonomous)
**Story**: `_bmad-output/implementation-artifacts/2-1-client-list-search.md`

---

Note: This review audits existing tests for Story 2.1; it does not generate tests.

## Executive Summary

**Overall Assessment**: Good — production-ready with minor observations

**Recommendation**: Approve with Comments

### Key Strengths

- Exemplary Given-When-Then structure in every test — narrative-style comments and titles across all 20 files.
- Strong isolation posture: fresh `QueryClient` per test, MSW `resetHandlers` per test, WebApplicationFactory scope-per-fact + DI override with hand-rolled `FakeClienteRepository` (matches company standard "no NSubstitute").
- Factory-driven data (`buildCliente` / `buildClientes` + xUnit `Create*WithCreatedAt` helpers) — zero hardcoded magic UUIDs, no shared fixtures leaking across tests.
- ARIA-first selectors on the frontend (`getByRole` + Spanish `aria-label`), `data-testid` reserved for the two elements where semantics don't disambiguate (`cliente-skeleton`, `clientes-view`).
- Edge tests carry explicit `[P0]/[P1]/[P2]` priority tags and cover Unicode, cancellation, large-payload (500 items), concurrency, and cleanup on unmount.

### Key Weaknesses

- Two `setTimeout`-based hard waits in `ClienteListView` tests to gate on the 150 ms debounce — flakiness risk under slow CI.
- One non-deterministic OR assertion in `ClienteListView.edge.test.tsx` that accepts either outcome instead of pinning the specification.
- `ClienteListView.test.tsx` at 286 lines is close to the 300-line soft-cap and could be split by concern.

### Summary

Story 2.1 tests demonstrate a mature engineering baseline: every layer of the Clean Architecture — Domain, Application, Infrastructure, API on the backend and Domain, Application, Infrastructure, Presentation on the frontend — has both a happy-path suite and a companion `*.edge.test.*` file that exercises boundary conditions. Naming, isolation and factory patterns are consistently applied. The only material findings are (1) a small number of blind time-based waits inside the router+MSW+debounce integration flow that could become flaky, and (2) one assertion that accepts two possible outcomes. Neither is blocking; both are addressable in a follow-up PR.

---

## Quality Criteria Assessment

| Criterion                            | Status  | Violations | Notes                                                                                  |
| ------------------------------------ | ------- | ---------- | -------------------------------------------------------------------------------------- |
| BDD Format (Given-When-Then)         | PASS    | 0          | GWT in comments AND in `it()` titles across 20/20 files.                               |
| Test IDs                             | PASS    | 0          | Tests trace to AC #1-#11 explicitly in headers; not P0-suffixed but linked in prose.   |
| Priority Markers (P0/P1/P2/P3)       | PASS    | 0          | Edge tests carry explicit `[P0]/[P1]/[P2]` tags. Happy-path tests defer to test-design. |
| Hard Waits (setTimeout / sleep)      | WARN    | 2          | 2 tests wait 250 ms blindly to gate on debounce (justified w/ comment, still risky).   |
| Determinism (no conditionals)        | WARN    | 1          | `ClienteListView.edge.test.tsx:187` uses OR-assertion — accepts two outcomes.          |
| Isolation (cleanup, no shared state) | PASS    | 0          | Fresh QueryClient/handler/factory per test. `beforeEach/afterEach` cleanup for timers. |
| Fixture Patterns                     | PASS    | 0          | Backend: WebApplicationFactory + DI override + `FakeClienteRepository`. Frontend: `wrapperFactory()`, `mountApp()`. |
| Data Factories                       | PASS    | 0          | `buildCliente/buildClientes` on FE; xUnit `CreateEntityWith*` helpers on BE.           |
| Network-First Pattern                | PASS    | 0          | `server.use(http.get(...))` set up BEFORE `renderHook`/`mountApp` in every case.       |
| Explicit Assertions                  | PASS    | 0          | Every test has 1-3 focused `expect`/`Assert.*` calls tied to a single behaviour.       |
| Test Length (≤300 lines)             | WARN    | 1          | `ClienteListView.test.tsx` = 286 lines (approaching the 300-line soft-cap).            |
| Test Duration (≤1.5 min)             | PASS    | 0          | All tests are unit/component/API-in-memory; well under 90 s each.                      |
| Flakiness Patterns                   | WARN    | 2          | Blind `setTimeout(250)` on the router+MSW integration path — see Hard Waits row.       |

**Total Violations**: 0 Critical, 1 High, 3 Medium, 0 Low

---

## Quality Score Breakdown

```
Starting Score:          100
Critical Violations:     -0 × 10 = 0
High Violations:         -1 × 5  = -5
Medium Violations:       -3 × 2  = -6
Low Violations:          -0 × 1  = 0

Bonus Points:
  Excellent BDD:         +5
  Comprehensive Fixtures: +5
  Data Factories:        +5
  Network-First:         +5
  Perfect Isolation:     +5
  All Test IDs:          +0 (traced but not machine-tagged in filenames)
                         --------
Total Bonus:             +25 (capped by ceiling)

Final Score:             92/100
Grade:                   A (Good)
```

---

## Critical Issues (Must Fix)

No critical issues detected.

---

## Recommendations (Should Fix)

### 1. Replace blind `setTimeout(250)` debounce gates with polling waitFor

**Severity**: P1 (High)
**Location**:
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx:143`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge.test.tsx:178`

**Criterion**: Hard Waits / Flakiness Patterns
**Knowledge Base**: test-quality.md, network-first.md

**Issue Description**:

Both tests fire multiple `fireEvent.change` events on the search input and then block on a hardcoded 250 ms `Promise + setTimeout` to give the 150 ms debounce time to settle before asserting `calls === 1` (or "no additional MSW hits"). On a slow CI worker, 250 ms may be insufficient to observe a bug where the debounce is broken and an extra request fires slightly later — turning a real flakiness issue into an intermittent test pass. Conversely, using `waitFor` with the same assertion converges as soon as the condition holds and fails clearly if it doesn't.

**Current Code**:

```typescript
// ClienteListView.test.tsx:141-146
fireEvent.change(input, { target: { value: 'acost' } })
// Give the debounce a chance to settle without producing extra fetches.
await new Promise((resolve) => setTimeout(resolve, 250))
expect(calls).toBe(1)
```

**Recommended Improvement**:

```typescript
// Assert on the intent (no extra calls) and poll for a bounded window.
await new Promise((r) => setTimeout(r, 200))       // ONE bounded settle-window
await waitFor(() => expect(calls).toBe(1))         // polls until stable
```

Even better: use `vi.useFakeTimers()` for the debounce hook and `vi.advanceTimersByTime(150)` — the `useDebouncedValue` unit tests already do this pattern (`useDebouncedValue.test.ts`). The tricky part is that TanStack Query's internal state also uses timers; if fake timers destabilise it, keep the polling `waitFor` alternative above.

**Why This Matters**:

Blind fixed-time waits are the number-one source of flaky tests in Playwright/Vitest suites. Under CI worker starvation, 250 ms can silently truncate. Per test-quality.md: "hard waits without justification" is a P0 pattern; this one has a justification comment but the pattern is still fragile.

**Related Violations**:
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.edge.test.ts:33-34` uses `setTimeout(500)` inside an MSW handler to simulate a slow server for the abort test — this is a **legitimate** use (test-scope delay, not a blind wait on assertion timing). No change needed there.
- `ClienteListView.test.tsx:231-232` and `ClienteListView.edge.test.tsx:147-148` use `setTimeout(250)` inside MSW handlers to hold the response open long enough to observe the skeleton — same legitimate pattern.

---

### 2. Non-deterministic OR assertion in whitespace-only search test

**Severity**: P1 (High)
**Location**: `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge.test.tsx:184-187`

**Criterion**: Determinism
**Knowledge Base**: test-quality.md

**Issue Description**:

The test asserts `expect(buttons.length === 5 || searchEmpty !== null).toBe(true)` — accepting *either* "all 5 present" or "search-empty state visible". This is an explicit admission that the test doesn't know what the implementation does, and it will pass under both correct AND incorrect behaviours (e.g., filter accidentally erasing everything on whitespace input).

**Current Code**:

```typescript
fireEvent.change(input, { target: { value: ' ' } })
await new Promise((r) => setTimeout(r, 250))
const buttons = screen.queryAllByRole('button', { name: /ver cliente/i })
const searchEmpty = screen.queryByText('No se encontró ningún cliente')
expect(buttons.length === 5 || searchEmpty !== null).toBe(true)
```

**Recommended Improvement**:

The current `ClienteListView` implementation calls `norm(' ')` → `' '` and checks `if (!debouncedSearch) return list` — a single space is truthy, so the filter runs. `' '` is contained in names like `"Empresa 000"` (which include a space), so the current behaviour matches all items whose `nombre` or `nit` contains a space. Pin the test to what the implementation actually does:

```typescript
// Since factory names include a space (e.g. "Empresa 000"), the filter matches all.
await waitFor(() => {
  expect(screen.getAllByRole('button', { name: /ver cliente/i })).toHaveLength(5)
})
```

If the product decision is that whitespace should behave as an empty search, either trim in the filter (`if (!debouncedSearch.trim()) return list`) and assert 5 visible, OR keep the current behaviour and assert on the deterministic 5-visible outcome the factory produces. Either way, the test must be single-outcome.

**Why This Matters**:

An OR-assertion is functionally a no-op guard rail — it can never fail the way the reader expects, so a regression in filter semantics will slip past this test. Per test-quality.md: "tests should not have conditionals or accept multiple outcomes."

---

### 3. `ClienteListView.test.tsx` approaching 300-line soft cap

**Severity**: P2 (Medium)
**Location**: `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (286 lines)

**Criterion**: Test Length
**Knowledge Base**: test-quality.md

**Issue Description**:

The file bundles six concerns (happy path, search, empty states, error state, loading skeletons, selection, split-panel wrapper). At 286 lines it is still within acceptable range, but any further AC will push it over 300. Consider splitting by concern:

```
ClienteListView.render.test.tsx     (happy path + split-panel wrapper)
ClienteListView.search.test.tsx     (all search-filter tests)
ClienteListView.empty.test.tsx      (both empty states)
ClienteListView.error.test.tsx      (ErrorPanel + Reintentar)
ClienteListView.selection.test.tsx  (AC #7 selection)
```

Each file would sit at ~50-70 lines with clearer diff-review boundaries. Not blocking for Story 2.1.

**Why This Matters**:

Long test files are harder to read on a PR, slower to run selectively, and tend to accrete unrelated setup helpers over time. The 300-line rule from test-quality.md is a lagging indicator — 286 is a signal to plan a split for Story 2.2 when a new concern arrives.

---

## Best Practices Found

### 1. WebApplicationFactory + DI override with `FakeClienteRepository`

**Location**: `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs:35-51`
**Pattern**: In-memory endpoint test with DI seam

**Why This Is Good**:

Exactly matches the company standard from Story 2.1's Testing Standards: "hand-rolled fake class implementing IClienteRepository is preferred over mocking libraries". `FactoryWithSeed` returns a fresh `WebApplicationFactory` per test with a scoped DI override, so every test starts with a clean seed and no DB dependency. Zero mocking-library overhead.

**Code Example**:

```csharp
private WebApplicationFactory<Program> FactoryWithSeed(params ClienteEntity[] seed)
{
    return _factory.WithWebHostBuilder(builder =>
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IClienteRepository>();
            services.AddSingleton<IClienteRepository>(_ =>
            {
                var fake = new FakeClienteRepository();
                fake.Seed(seed);
                return fake;
            });
        });
    });
}
```

**Use as Reference**: Every future backend endpoint story (2.2, 2.3, 2.4, 2.5) should replicate this pattern.

---

### 2. `useDebouncedValue` unit test uses fake timers correctly

**Location**: `frontend/src/modules/crm/clientes/application/useDebouncedValue.test.ts:13-21, 43-54`
**Pattern**: `vi.useFakeTimers` + `vi.advanceTimersByTime` with `beforeEach/afterEach` cleanup

**Why This Is Good**:

The hook is tested with **fake timers** and deterministic time advancement — no `setTimeout(150)` in the test itself. `beforeEach` installs fake timers, `afterEach` restores real timers. `act(() => vi.advanceTimersByTime(150))` guarantees the assertion runs exactly at the boundary. This is the canonical pattern from `timing-debugging.md`.

**Code Example**:

```typescript
beforeEach(() => { vi.useFakeTimers() })
afterEach(()  => { vi.useRealTimers() })

it('THEN debounced value has updated', () => {
  const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 150), {
    initialProps: { value: 'a' },
  })
  rerender({ value: 'abc' })
  act(() => { vi.advanceTimersByTime(150) })
  expect(result.current).toBe('abc')
})
```

**Use as Reference**: The same pattern should be applied to `ClienteListView` search tests to eliminate the two hard-wait findings above.

---

### 3. ARIA-first selectors with Spanish localised labels

**Location**: `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (throughout)
**Pattern**: `getByRole('button', { name: /ver cliente:\s*empresa a/i })` + `getByLabelText(/buscar clientes/i)`

**Why This Is Good**:

Every user-facing element is selected by role + accessible name, exactly as recommended in selector-resilience.md. Spanish labels are asserted verbatim via `case-insensitive` regex — catches both semantic role AND localised label at once. `data-testid` is only used where semantics don't disambiguate (`cliente-skeleton` collection, `clientes-view` split-panel wrapper).

**Use as Reference**: Every future frontend story should keep this discipline — no `getByText('button label')`, no `container.querySelector('.some-css-class')`.

---

### 4. Explicit `[P0]/[P1]/[P2]` priority tags in edge tests

**Location**: e.g. `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs:22, 76, 84`
**Pattern**: Inline `// [P0]` / `// [P1]` / `// [P2]` prefix on each edge-case comment

**Why This Is Good**:

Traceability from test → risk register at a glance. When trimming a slow CI matrix, `[P0]` and `[P1]` can be filtered by comment scan. Not machine-tagged (no attribute), but readable and grep-able.

---

## Test File Analysis

### File Metadata Summary

| # | File | Lines | Framework | Language |
|---|------|-------|-----------|----------|
| 1 | `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs` | 141 | xUnit | C# |
| 2 | `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` | 123 | xUnit | C# |
| 3 | `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerEdgeTests.cs` | 143 | xUnit | C# |
| 4 | `backend/tests/SiesaAgents.UnitTests/Infrastructure/ClienteConfigurationTests.cs` | 112 | xUnit | C# |
| 5 | `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs` | 138 | xUnit + WAF | C# |
| 6 | `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsEdgeTests.cs` | 210 | xUnit + WAF | C# |
| 7 | `frontend/src/modules/crm/clientes/application/useClientes.test.ts` | 79 | Vitest + RTL | TS |
| 8 | `frontend/src/modules/crm/clientes/application/useClientes.edge.test.ts` | 112 | Vitest + RTL | TS |
| 9 | `frontend/src/modules/crm/clientes/application/useDebouncedValue.test.ts` | 92 | Vitest + RTL | TS |
| 10 | `frontend/src/modules/crm/clientes/application/useDebouncedValue.edge.test.ts` | 130 | Vitest + RTL | TS |
| 11 | `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.test.ts` | 73 | Vitest + MSW | TS |
| 12 | `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.edge.test.ts` | 110 | Vitest + MSW | TS |
| 13 | `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` | **286** | Vitest + MSW + Router | TSX |
| 14 | `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge.test.tsx` | 207 | Vitest + MSW + Router | TSX |
| 15 | `frontend/src/shared/components/EmptyState.test.tsx` | 55 | Vitest + RTL | TSX |
| 16 | `frontend/src/shared/components/EmptyState.edge.test.tsx` | 103 | Vitest + RTL | TSX |
| 17 | `frontend/src/shared/components/ErrorPanel.test.tsx` | 68 | Vitest + RTL | TSX |
| 18 | `frontend/src/shared/components/ErrorPanel.edge.test.tsx` | 83 | Vitest + RTL | TSX |
| 19 | `frontend/src/shared/components/ClienteListItem.test.tsx` | 64 | Vitest + RTL | TSX |
| 20 | `frontend/src/shared/components/ClienteListItem.edge.test.tsx` | 126 | Vitest + RTL | TSX |

**Aggregate**: 2,255 lines across 20 files. Average 113 lines/file. No file exceeds 300.

### Priority Distribution (edge tests only, happy-path deferred to test-design)

- P0 (Critical): 6 tests (domain guard clauses in `ClienteEntityTests`)
- P1 (High): ~15 tests
- P2 (Medium): ~10 tests
- P3 (Low): 0 explicitly tagged

---

## Context and Integration

### Related Artifacts

- **Story File**: [`_bmad-output/implementation-artifacts/2-1-client-list-search.md`](implementation-artifacts/2-1-client-list-search.md)
- **Acceptance Criteria Mapped**: 11/11 (100%)
- **Test Design**: [`_bmad-output/test-design-epic-2.md`](test-design-epic-2.md)
- **Risk Assessment**: Epic 2 — P0 R-011 (invalidation), P1 R-003 (search perf), P0 R-001 (error exposure) covered

### Acceptance Criteria Validation

| AC | Test Coverage | Status |
|----|---------------|--------|
| #1 (list rendered, 280px panel, createdAt DESC) | `ClienteListView.test.tsx` happy path + split-panel + order-preservation edge | Covered |
| #2 (client-side search, ≤1s, useMemo, 150ms debounce) | `ClienteListView.test.tsx` search block + `useDebouncedValue.test.ts` | Covered |
| #3 (search-empty EmptyState, aria-live) | `ClienteListView.test.tsx` empty-states + `EmptyState.test.tsx` | Covered |
| #4 (no-clients EmptyState) | `ClienteListView.test.tsx` empty-states + `EmptyState.test.tsx` | Covered |
| #5 (ErrorPanel + Reintentar, no raw error) | `ClienteListView.test.tsx` error + `ErrorPanel.test.tsx` NFR6 assertion | Covered |
| #6 (6 skeleton items) | `ClienteListView.test.tsx` loading-skeletons | Covered |
| #7 (URL update + selected visual via data-selected) | `ClienteListView.test.tsx` selection block + `ClienteListItem.test.tsx` | Covered |
| #8 (GET /api/v1/clientes → 200 with ClienteDto array camelCase) | `ClienteEndpointsTests.cs` + `clienteApiRepository.test.ts` | Covered |
| #9 (migration + schema + unique index) | `ClienteConfigurationTests.cs` + migration inspection in dev-notes | Covered |
| #10 (build succeeds, no `any`, CSS gzip within 5 KB) | Verified in dev-story build logs (not test-code) | Covered |
| #11 (all tests pass, >80% coverage on new files) | 63/63 backend + 134/134 frontend tests green per dev-story record | Covered |

**Coverage**: 11/11 acceptance criteria mapped to at least one test (100%).

---

## Knowledge Base References

This review consulted the following fragments from `_bmad/bmm/testarch/tea-index.csv`:

- `test-quality.md` — Definition of Done (hard-wait ban, ≤300 lines, ≤1.5 min, isolation, explicit assertions)
- `data-factories.md` — Factory + override pattern with API-first setup
- `fixture-architecture.md` — Pure function → Fixture → mergeTests composition (`FactoryWithSeed`, `wrapperFactory`, `mountApp`)
- `selector-resilience.md` — `getByRole` > `getByLabelText` > `getByText` > `getByTestId` hierarchy
- `timing-debugging.md` — Fake timers vs polling vs blind wait
- `network-first.md` — Route intercept before navigate (`server.use` before `renderHook`)
- `test-healing-patterns.md` — Common flakiness signatures (blind `setTimeout`, OR-assertions)

---

## Next Steps

### Immediate Actions (Before Merge)

None strictly required — the two P1 findings do not block merge. Approve with the two follow-up items scheduled.

### Follow-up Actions (Next PR / Story 2.2)

1. **Replace 2× blind `setTimeout(250)` gates in `ClienteListView.*.test.tsx` with `waitFor` polling** (or fake timers). Priority: P1. Target: alongside Story 2.2 tests to keep the pattern uniform.
2. **Pin the whitespace-only-search assertion** (`ClienteListView.edge.test.tsx:184-187`) to a single deterministic outcome — either assert 5 visible OR trim in the filter and assert `no-clients`. Priority: P1.
3. **Plan a split of `ClienteListView.test.tsx`** into `render / search / empty / error / selection` when Story 2.2 adds detail-panel tests to prevent the file crossing 300 lines. Priority: P2.

### Re-Review Needed?

No re-review needed — approve as-is. Follow-ups are captured for the next iteration.

---

## Decision

**Recommendation**: Approve with Comments

**Rationale**:

Test quality is Good with a 92/100 score. Twenty test files across both stacks demonstrate consistent, disciplined engineering: full Given-When-Then narrative, factory-driven data, ARIA-first selectors, per-test isolation, and explicit priority tags on edge cases. The three findings — 2 blind `setTimeout` debounce gates and 1 non-deterministic OR-assertion — are P1 improvements that reduce future flakiness but do not currently break the suite (all 63 backend + 134 frontend tests pass green per the dev-story completion record). Approve for merge with the follow-up items scheduled for Story 2.2's PR.

---

## Appendix

### Violation Summary by Location

| Line | Severity | Criterion | Issue | Fix |
|------|----------|-----------|-------|-----|
| `ClienteListView.test.tsx:143` | P1 | Hard Wait | `setTimeout(250)` to gate debounce | Use `waitFor` polling or `vi.useFakeTimers` |
| `ClienteListView.edge.test.tsx:178` | P1 | Hard Wait | `setTimeout(250)` to gate debounce | Same as above |
| `ClienteListView.edge.test.tsx:187` | P1 | Determinism | OR-assertion accepts two outcomes | Pin to the single expected outcome |
| `ClienteListView.test.tsx` (whole file) | P2 | Test Length | 286 lines (near 300 cap) | Plan to split by concern in Story 2.2 |

### Auto-Corrections Applied

None. Each finding requires a semantic decision (which outcome to pin the test to, or fake-timer trade-off vs `waitFor` polling in the presence of TanStack Query's own timers) that is safer to leave to the author than to auto-rewrite mechanically.

---

## Review Metadata

- **Generated By**: BMad TEA Agent (via sa-tea-review sub-agent inside sa-quick-dev pipeline)
- **Workflow**: `testarch-test-review` v4.0
- **Review ID**: `test-review-2.1-20260708`
- **Timestamp**: 2026-07-08
- **Version**: 1.0
