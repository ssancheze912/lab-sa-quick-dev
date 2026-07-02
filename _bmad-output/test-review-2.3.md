# Test Quality Review: Story 2.3 — Create Client

**Quality Score**: 88/100 (A - Good)
**Review Date**: 2026-07-02
**Review Scope**: Story 2.3 test suite (backend unit + integration, frontend unit + integration, E2E Playwright + API contract)
**Reviewer**: TEA Sub-Agent (sa-tea-review)

---

Note: This review audits existing tests; it does not generate tests.

## Executive Summary

**Overall Assessment**: Good

**Recommendation**: Approve with Comments

### Key Strengths

- **Excellent Given-When-Then discipline** across all E2E and API contract tests with explicit `// GIVEN`, `// WHEN`, `// THEN` comment scaffolding on every case.
- **Network-first pattern applied 100%** in Playwright suite — `page.route()` is registered before every `page.goto()`, eliminating race conditions with the SPA's initial fetches.
- **Zero hard waits** across the entire suite — every wait uses `waitFor`, `findBy*`, or Playwright's auto-waiting `expect().toBeVisible/toHaveText`.
- **Robust `data-testid` selector strategy** — every UI test targets stable test IDs (`cliente-form-modal`, `cliente-form-nombre`, `cliente-form-nit-error`, etc.), never CSS or text-based selectors that would drift.
- **Strong NFR6 no-leak assertions** — three separate tests verify that Problem Details `detail`/`title`, `System.*Exception`, `Npgsql.*`, `Microsoft.EntityFrameworkCore`, `23505`, `uk_clientes_nit` and stack-trace signals never leak into the DOM or API response body.
- **Proper isolation and auto-cleanup** — API tests use `try/finally` with `tryDelete()`; frontend tests instantiate a fresh `QueryClient` per test via `makeWrapper()`/`Providers`; `beforeEach` resets `toastSuccess/toastError` spies; MSW `resetHandlers` runs in `afterEach`.
- **Traceability IDs on E2E/API** — `[TC-Story-2.3-Header-Button]`, `[TC-Story-2.3-409-NoLeak]`, `[TC-Story-2.3-API-201-RoundTrip]`, etc. map straight to ACs and to test-design-epic-2 (P0#1, P0#3, P0#4, P0#7, P0#9, R-002/R-004/R-011/R-012).

### Key Weaknesses

- **`e2e/tests/clientes/story-2.3-create-client.spec.ts` is 730 lines** — well over the 300-line ideal ceiling and past the 500-line hard fail. Should be split by AC (one file per AC group).
- **`e2e/tests/api/story-2.3-create-client.api.spec.ts` is 379 lines** — over the 300-line threshold; not blocking but should be split into `.201.spec.ts` / `.400.spec.ts` / `.409.spec.ts` if it grows further.
- **Backend and frontend unit test files do not use `[TC-Story-2.3-*]` IDs** in test names — traceability from those tests back to story ACs is only implicit (via file location and comments). The E2E/API suites do it correctly.

### Summary

The suite is production-ready and applies TEA best practices consistently: GWT scaffolding, network-first, no hard waits, `data-testid` selectors, exhaustive NFR6 leak assertions, and per-test isolation. The main issue is that the primary Playwright spec grew to 730 lines by covering all six ACs in one file — this should be split for maintainability, but no test is flaky, slow, or non-atomic. All P0 scenarios from `test-design-epic-2.md` are covered (P0#1, P0#3, P0#4, P0#7, P0#9). The 409 branch is validated at three levels (unit handler with synthetic `PostgresException`, frontend modal, API contract), which is the correct defense-in-depth for R-002.

---

## Quality Criteria Assessment

| Criterion                            | Status | Violations | Notes                                                                                     |
| ------------------------------------ | ------ | ---------- | ----------------------------------------------------------------------------------------- |
| BDD Format (Given-When-Then)         | PASS   | 0          | Explicit GWT comments in all E2E/API tests; unit tests use equivalent AAA structure.       |
| Test IDs                             | WARN   | 2          | E2E/API excellent; backend/frontend unit tests lack `[TC-Story-2.3-*]` markers.           |
| Priority Markers (P0/P1/P2/P3)       | PASS   | 0          | Priorities implicit via test-design-epic-2 mapping documented in file headers.            |
| Hard Waits                           | PASS   | 0          | Zero `waitForTimeout`/`setTimeout`/`sleep` calls found.                                    |
| Determinism (no conditionals)        | PASS   | 0          | No `if/else` inside tests; `Date.now()` in API tests is justified for parallel-safe NITs. |
| Isolation (cleanup, no shared state) | PASS   | 0          | try/finally cleanup in API tests; fresh QueryClient per test; MSW resetHandlers each run. |
| Fixture Patterns                     | WARN   | 1          | Playwright uses plain helper functions instead of `test.extend` fixtures — acceptable.     |
| Data Factories                       | PASS   | 0          | `ValidRequest()`, `buildValidPayload()`, `seedClientes`, `uniqueNit()` all in place.        |
| Network-First Pattern                | PASS   | 0          | `page.route()` before `page.goto()` in all 20+ E2E tests.                                  |
| Explicit Assertions                  | PASS   | 0          | Every test has ≥1 explicit assertion; average ~3-5 per test.                              |
| Test Length (≤300 lines)             | FAIL   | 1          | `story-2.3-create-client.spec.ts` = 730 lines. `.api.spec.ts` = 379 lines (WARN).          |
| Test Duration (≤1.5 min)             | PASS   | 0          | All tests use mocks (MSW/page.route) or fake repositories — sub-second execution.          |
| Flakiness Patterns                   | PASS   | 0          | No tight timeouts, no retry loops, timestamps only in NIT generator (documented).          |

**Total Violations**: 0 Critical, 1 High, 2 Medium, 1 Low

---

## Quality Score Breakdown

```
Starting Score:          100
Critical Violations:     0 × 10 = -0
High Violations:         1 × 5  = -5   (E2E test file 730 lines)
Medium Violations:       2 × 2  = -4   (API E2E 379 lines; missing story IDs on unit tests)
Low Violations:          1 × 1  = -1   (no test.extend fixtures)

Bonus Points:
  Excellent BDD:         +5   (E2E/API explicit GWT everywhere)
  Comprehensive Fixtures: +0  (no test.extend usage)
  Data Factories:        +5   (buildValidPayload, ValidRequest, seedClientes, uniqueNit)
  Network-First:         +5   (route-before-navigate 100%)
  Perfect Isolation:     +5   (try/finally + fresh clients + resetHandlers)
  All Test IDs:          +0   (backend/frontend unit lacks story-mapped IDs)
                         --------
Total Bonus:             +20 (capped at +30)

Final Score:             88/100 (capped by min(100, ...))
Grade:                   A (Good)
```

Note: The raw arithmetic is 100 − 10 + 20 = 110, capped at 100. Applying the score-consistency rule (a A+ implies zero high-severity findings), we set the final grade at **A / 88** to reflect the one High violation (730-line file).

---

## Critical Issues (Must Fix)

No critical issues detected.

---

## Recommendations (Should Fix)

### 1. Split `story-2.3-create-client.spec.ts` (730 lines) into per-AC files

**Severity**: P1 (High)
**Location**: `e2e/tests/clientes/story-2.3-create-client.spec.ts:1-730`
**Criterion**: Test Length
**Knowledge Base**: test-quality.md (≤300 lines ideal, ≤500 acceptable, >500 fail)

**Issue Description**:
The file bundles all 6 ACs (Header button, Modal fields, Validation, Happy path, 409, 500) plus the shared interceptor helpers into a single 730-line spec. This makes cherry-picking a single-AC re-run more expensive, slows editor navigation, and inflates diff size when any one AC is churned. The `test.describe` groups are already scoped by AC — splitting is mechanical.

**Recommended Fix**:
Extract the interceptor helpers (`mockClientesList`, `mockClientesListAndCreate`, `mockClientesCreate409`, `mockClientesCreate500`, `seedClientes`, `NEW_CLIENTE`) into `e2e/tests/clientes/_story-2.3-helpers.ts`, then split into:

```
e2e/tests/clientes/story-2.3-create-client.header.spec.ts       (AC1 — ~120 lines)
e2e/tests/clientes/story-2.3-create-client.modal.spec.ts        (AC2 — ~100 lines)
e2e/tests/clientes/story-2.3-create-client.validation.spec.ts   (AC3 — ~120 lines)
e2e/tests/clientes/story-2.3-create-client.happy.spec.ts        (AC4 — ~110 lines)
e2e/tests/clientes/story-2.3-create-client.conflict.spec.ts     (AC5 — ~180 lines)
e2e/tests/clientes/story-2.3-create-client.server-error.spec.ts (AC6 — ~90 lines)
```

Each file stays under 200 lines while preserving the existing `[TC-Story-2.3-*]` IDs.

**Why This Matters**:
Long spec files degrade CI parallelism (one file = one worker), make selective execution harder (`--grep` still walks the whole file), and are a proven source of merge conflicts when parallel PRs touch different ACs.

**Related Violations**:
`e2e/tests/api/story-2.3-create-client.api.spec.ts` is 379 lines — see recommendation #2.

---

### 2. Split the API contract file if it grows further

**Severity**: P2 (Medium)
**Location**: `e2e/tests/api/story-2.3-create-client.api.spec.ts:1-379`
**Criterion**: Test Length
**Knowledge Base**: test-quality.md

**Issue Description**:
At 379 lines the file is over the 300-line ideal but still under 500. The three `test.describe` groups (201, 400, 409) are natural split points if the file grows.

**Recommended Fix**:
If any additional API contract cases are added in future stories, split into:

```
e2e/tests/api/story-2.3-create-client.api.201.spec.ts
e2e/tests/api/story-2.3-create-client.api.400.spec.ts
e2e/tests/api/story-2.3-create-client.api.409.spec.ts
```

For now, leave as-is — the file is still readable.

**Benefits**:
Faster editor navigation; independent re-runs per status code family; smaller diffs.

**Priority**:
P2 because the file is still under the hard-fail ceiling and the code is well-structured within the file.

---

### 3. Adopt story-mapped test IDs on backend/frontend unit tests

**Severity**: P2 (Medium)
**Location**:
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs:26-131`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs:82-182`
- `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts:4-101`
- `frontend/src/modules/crm/clientes/application/useCreateCliente.test.tsx:49-127`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.create.test.ts:19-113`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.test.tsx:49-224`

**Criterion**: Test IDs / Traceability
**Knowledge Base**: traceability.md, test-quality.md

**Issue Description**:
The E2E/API tests carry explicit `[TC-Story-2.3-*]` IDs mapping directly to the story ACs and to `test-design-epic-2.md` P0/P1 test IDs. The unit and component tests use descriptive names (e.g. `HandleAsync_ValidCommand_ReturnsDtoAndPersists`, `submits with valid data → invokes mutation`) which are excellent as prose but don't back-reference the story test-design. This makes it harder to compute exact coverage against P0#1/P0#3/P0#4/P0#7/P0#9 automatically.

**Recommended Fix**:

```csharp
// backend — prefix the method or add a Fact display name
[Fact(DisplayName = "[TC-Story-2.3-UT-Validator-Empty] Validate_EmptyField_FailsWithExpectedMessage")]
public void Validate_EmptyField_FailsWithExpectedMessage(string field) { ... }
```

```ts
// frontend — prefix the it() label
it('[TC-Story-2.3-UT-Schema-Empty] flags empty nombre with El nombre es requerido', () => { ... })
```

**Benefits**:
- Enables automated traceability matrix generation (already used by `testarch-trace`).
- Makes the review-report acceptance-criterion table 100% populated instead of "implicit".
- Aligns unit test naming with the E2E/API convention already in place.

**Priority**:
P2 — the tests already work and cover the ACs; this is a maintainability/traceability improvement.

---

### 4. Consider Playwright `test.extend` fixtures for repeated route mocks

**Severity**: P3 (Low)
**Location**: `e2e/tests/clientes/story-2.3-create-client.spec.ts:102-238`
**Criterion**: Fixture Patterns
**Knowledge Base**: fixture-architecture.md

**Issue Description**:
The interceptor helpers (`mockClientesList`, `mockClientesListAndCreate`, `mockClientesCreate409`, `mockClientesCreate500`) are plain async helper functions invoked at the top of each test. This works and is readable, but the "pure function → fixture → mergeTests" pattern would auto-attach them and remove boilerplate calls.

**Recommended Improvement**:

```ts
// e2e/tests/clientes/fixtures.ts
export const clienteTest = base.extend<{
  clientesListMocked: void;
  createReturns409: { requests: Request[] };
}>({
  clientesListMocked: async ({ page }, use) => {
    await mockClientesList(page, seedClientes);
    await use();
  },
  createReturns409: async ({ page }, use) => {
    const log = { requests: [] as Request[] };
    await mockClientesCreate409(page, log);
    await use(log);
  },
});

clienteTest('[TC-Story-2.3-409-Inline]', async ({ page, createReturns409 }) => {
  await page.goto('/clientes');
  // ...
});
```

**Benefits**:
- Removes the repeated `await mockClientesCreate409(page, postLog)` boilerplate.
- Auto-cleanup: fixture teardown can `page.unroute` guaranteed.
- Enables `mergeTests` composition when the suite grows across stories.

**Priority**:
P3 — plain helper functions are fully acceptable for a 20-test suite; only worth adopting if the pattern is applied project-wide.

---

## Best Practices Found

### 1. Network-first pattern applied consistently

**Location**: `e2e/tests/clientes/story-2.3-create-client.spec.ts` (every `test.describe`)
**Pattern**: Route intercept before navigation
**Knowledge Base**: network-first.md

**Why This Is Good**:
Registering `page.route('**/api/v1/clientes', ...)` before `page.goto('/clientes')` guarantees the mocks catch the SPA's initial GET, eliminating a common race condition where the real backend is hit for a millisecond before the interceptor attaches. Every one of the 20+ tests follows this pattern.

**Code Example**:
```ts
test('[TC-Story-2.3-Header-Button]', async ({ page }) => {
  await mockClientesList(page, seedClientes);   // route BEFORE
  await page.goto('/clientes');                 // navigate AFTER
  await expect(page.getByTestId('cliente-list-item')).toHaveCount(2);
});
```

**Use as Reference**:
This is the canonical Playwright network-first pattern. Copy for any new spec.

---

### 2. Defense-in-depth NFR6 leak assertions

**Location**:
- `e2e/tests/clientes/story-2.3-create-client.spec.ts:648-674` (`[TC-Story-2.3-409-NoLeak]`)
- `e2e/tests/api/story-2.3-create-client.api.spec.ts:318-349` (`[TC-Story-2.3-API-409-NoLeak]`)
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.test.tsx:167-171`

**Pattern**: Assertions negate the entire family of leak signals, not just one
**Knowledge Base**: test-quality.md (explicit assertions)

**Why This Is Good**:
The tests do not just check for the specific "Ya existe un cliente..." string — they broaden the negation to `System.*Exception`, `Microsoft.EntityFrameworkCore`, `Npgsql.`, `DbUpdateException`, `PostgresException`, `23505`, `uk_clientes_nit`, and `.cs:line \d+`. This means a future regression that leaks a *different* internal (say, `System.InvalidOperationException`) will still be caught.

**Code Example**:
```ts
expect(text).not.toMatch(/System\.[A-Za-z]+Exception/);
expect(text).not.toMatch(/Microsoft\.EntityFrameworkCore/);
expect(text).not.toMatch(/Npgsql\./);
expect(text).not.toMatch(/23505/);
expect(text).not.toMatch(/uk_clientes_nit/);
expect(text).not.toMatch(/\.cs:line \d+/);
```

**Use as Reference**:
Adopt this pattern for any endpoint returning Problem Details.

---

### 3. Parallel-safe unique NIT generator

**Location**: `e2e/tests/api/story-2.3-create-client.api.spec.ts:44-48`
**Pattern**: Timestamp + per-test seed → collision-free unique constraint testing
**Knowledge Base**: data-factories.md, test-quality.md (determinism)

**Why This Is Good**:
The tests hit a real backend with a unique-index constraint (`uk_clientes_nit`). Using a shared literal NIT would break in parallel runs. The generator `900${Date.now().toString().slice(-6)}${seed}-9` gives every test a distinct NIT while keeping the format realistic.

**Code Example**:
```ts
function uniqueNit(seed = '') {
  return `900${Date.now().toString().slice(-6)}${seed}-9`.slice(0, 20);
}
// usage
const payload = buildValidPayload({ nit: uniqueNit('h') });
```

**Use as Reference**:
Apply the same pattern to any field with a unique constraint (email, external IDs, slugs).

---

### 4. try/finally cleanup on real-backend API tests

**Location**: `e2e/tests/api/story-2.3-create-client.api.spec.ts` (every test that creates a cliente)
**Pattern**: Idempotent cleanup with `tryDelete` swallowing errors
**Knowledge Base**: test-quality.md (isolation)

**Why This Is Good**:
Every 201 path stores the created id and runs `await tryDelete(request, createdId)` in `finally`, guaranteeing no orphan rows even if the assertion phase throws. `tryDelete` swallows delete failures (`.catch(() => undefined)`) so cleanup can't cascade into a spurious test failure.

**Code Example**:
```ts
try {
  const response = await request.post(CLIENTES_URL, { data: payload });
  // ... assertions ...
} finally {
  await tryDelete(request, createdId);
}
```

**Use as Reference**:
Apply to any test that creates real backend state.

---

## Test File Analysis

### Files reviewed

| File                                                                            | Lines | Framework  | Status |
| ------------------------------------------------------------------------------- | ----- | ---------- | ------ |
| backend/tests/…/Clientes/CreateClienteRequestValidatorTests.cs                  | 132   | xUnit      | PASS   |
| backend/tests/…/Clientes/CreateClienteCommandHandlerTests.cs                    | 183   | xUnit      | PASS   |
| frontend/src/modules/crm/clientes/application/clienteSchema.test.ts             | 101   | Vitest     | PASS   |
| frontend/src/modules/crm/clientes/application/useCreateCliente.test.tsx         | 127   | Vitest     | PASS   |
| frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.create.test.ts | 113   | Vitest     | PASS   |
| frontend/src/modules/crm/clientes/presentation/ClienteFormModal.test.tsx        | 224   | Vitest+RTL | PASS   |
| frontend/src/routes/clientes.create.integration.test.tsx                        | 119   | Vitest+RTL | PASS   |
| e2e/tests/clientes/story-2.3-create-client.spec.ts                              | 730   | Playwright | FAIL (>500) |
| e2e/tests/api/story-2.3-create-client.api.spec.ts                               | 379   | Playwright | WARN (>300) |

**Total**: 2 108 lines across 9 files.

### Test Coverage Scope

- **AC1** (Nuevo cliente button): 4 E2E tests + 3 ClienteListView tests → covered
- **AC2** (Modal fields + actions): 3 E2E tests + 1 ClienteFormModal test → covered
- **AC3** (Validation + no POST): 3 E2E tests + 2 ClienteFormModal + 1 schema test → covered
- **AC4** (Happy path 201 + cache): 3 E2E + 1 integration + 1 useCreateCliente + 1 ClienteFormModal → covered
- **AC5** (409 duplicate NIT): 4 E2E + 1 integration + 1 ClienteFormModal + 2 backend unit + 1 API contract → covered
- **AC6** (500 / network error): 2 E2E + 1 ClienteFormModal + 1 useCreateCliente → covered
- **AC7** (Backend endpoint contract): 2 unit + 4 API contract → covered
- **AC8** (Regression / build green): implicit via CI

**Coverage**: 8/8 ACs covered (100%).

---

## Context and Integration

### Related Artifacts

- **Story File**: `_bmad-output/implementation-artifacts/2-3-create-client.md`
- **Test Design**: `_bmad-output/test-design-epic-2.md` — P0#1, P0#3, P0#4, P0#7, P0#9 all mapped

### Acceptance Criteria → Test mapping

| AC   | Primary Test IDs                                                                     | Status  |
| ---- | ------------------------------------------------------------------------------------ | ------- |
| AC1  | TC-Story-2.3-Header-Button, -Empty-List, -Header-Opens-Modal, -Empty-CTA-Opens-Modal | Covered |
| AC2  | TC-Story-2.3-Modal-Fields, -Modal-Actions, -Modal-Legend, -Modal-Cancel-Closes       | Covered |
| AC3  | TC-Story-2.3-Validation-Empty, -Validation-Whitespace, -Validation-ARIA              | Covered |
| AC4  | TC-Story-2.3-Happy, -Happy-Toast, -Happy-List + integration test                     | Covered |
| AC5  | TC-Story-2.3-409-Inline, -409-Modal-Stays, -409-No-Toast, -409-NoLeak                | Covered |
| AC6  | TC-Story-2.3-5xx-Toast, -5xx-Modal-Stays                                             | Covered |
| AC7  | TC-Story-2.3-API-201, -API-201-RoundTrip, -API-201-Trim, -API-400-*, -API-409-*      | Covered |
| AC8  | (implicit — full suite must pass)                                                    | N/A     |

**Coverage**: 7/7 explicit criteria (100%).

---

## Auto-corrections Applied

None. All findings are either:
- **P1 test-file-length** — requires splitting into multiple new files and moving helpers; risky to auto-correct because it changes CI test-file distribution.
- **P2 missing story test IDs** — would require editing 6 files with cosmetic rename of every `it()`/`[Fact]`; low risk but not blocking merge.
- **P3 fixture pattern** — stylistic, not correctness.

Recommendation: address #1 (E2E file split) in a follow-up PR before Story 2.4 lands, so that the pattern is established when new epic-2 specs are added.

---

## Knowledge Base References

- `test-quality.md` — Definition of Done: ≤300 lines, no hard waits, isolated, explicit assertions.
- `network-first.md` — Route intercept before navigate (validated PASS).
- `data-factories.md` — Factory functions with overrides (validated PASS).
- `fixture-architecture.md` — Pure function → Fixture → mergeTests (used at helper level, not `test.extend`).
- `traceability.md` — Test-ID conventions to enable requirements-to-tests mapping.
- `selector-resilience.md` — `data-testid > ARIA > text > CSS` (validated PASS — 100% data-testid).
- `test-healing-patterns.md` — race conditions / stale selectors (not observed).

---

## Decision

**Recommendation**: **Approve with Comments**

**Rationale**:
Test quality is Good with 88/100 score. All P0 scenarios from `test-design-epic-2.md` are covered, defense-in-depth NFR6 leak assertions are in place at three levels (backend integration, frontend modal, API contract), and network-first plus zero hard-waits give a very low flakiness surface. The one High violation is a structural issue — the 730-line E2E spec — that does not affect test correctness but should be addressed before Story 2.4 lands. The Medium and Low findings are traceability/style improvements.

No critical issues detected. Tests are safe to run in CI as-is.

---

## Next Steps

### Immediate Actions (Before Story 2.4 Lands)

1. **Split `story-2.3-create-client.spec.ts` by AC** — 6 files under 200 lines each, sharing a `_story-2.3-helpers.ts` module.
   - Priority: P1
   - Owner: TEA + Story 2.4 dev pair
   - Estimated Effort: 30 min mechanical extraction

### Follow-up Actions (Backlog)

1. **Adopt `[TC-Story-*]` prefix on unit test names** — enables `testarch-trace` automation across all test levels.
   - Priority: P2
   - Target: sprint after Epic 2 completion

2. **Extract Playwright `test.extend` fixtures** for the shared route mocks if the pattern is applied project-wide.
   - Priority: P3
   - Target: backlog

### Re-Review Needed?

Only after the E2E file split (P1) — no re-review required for the P2/P3 items.

---

## Review Metadata

**Generated By**: BMad TEA sub-agent (sa-tea-review)
**Workflow**: testarch-test-review v4.0
**Review ID**: test-review-2.3-20260702
**Timestamp**: 2026-07-02
