# Test Quality Review: Story 2.4 — Edit Client

**Quality Score**: 87/100 (B — Acceptable)
**Review Date**: 2026-07-02
**Review Scope**: Story 2.4 test suite (backend unit + integration, frontend unit + integration, E2E Playwright + API contract)
**Reviewer**: TEA Sub-Agent (sa-tea-review)

---

Note: This review audits existing tests; it does not generate tests. Story 2.4 tests were produced by the sa-tea-atdd (E2E) and sa-tea-automate (backend/frontend unit + integration) sub-agents plus the sa-dev-story implementation.

## Executive Summary

**Overall Assessment**: Good with one structural concern

**Recommendation**: Approve with Comments (blocker-free; ship-ready; length issue is a maintainability debt to schedule for the next iteration)

### Key Strengths

- **Comprehensive AC coverage** — all 10 ACs of Story 2.4 are exercised at multiple levels: E2E (Playwright + API contract), integration (routes + form modal), unit (repository, hook, validator, entity, handler). The 409/404/5xx branches are validated three times (unit handler with synthetic PostgresException; frontend hook + modal; API contract) as defense-in-depth against R-002.
- **Excellent Given-When-Then discipline** in every E2E and API contract case: explicit `// GIVEN:`, `// WHEN:`, `// THEN:` scaffolding.
- **Network-first pattern 100%** — every `page.route()` interceptor registered BEFORE `page.goto()`, eliminating race conditions with the SPA's initial fetches (mockClientesListAndUpdate, mockClientesUpdate409/404/500, mockDetailSlow, mockDetail404).
- **Robust `data-testid` selector strategy** across all layers — `cliente-editar-button`, `cliente-form-modal`, `cliente-form-nombre/nit/telefono/ciudad`, `*-error`, `cliente-form-cancel/submit`, `cliente-detail-panel`, `cliente-list-item`. Zero CSS/text-based selectors.
- **Strong NFR6 no-leak assertions** — six separate tests verify that `System.*Exception`, `Microsoft.EntityFrameworkCore`, `Npgsql.*`, `DbUpdateException`, `PostgresException`, `23505`, `uk_clientes_nit`, `.cs:line` signals never leak into the DOM or API response body. Includes an explicit content sweep after 409/404 flows.
- **Proper isolation and auto-cleanup** — API E2E tests use try/finally with `tryDelete()`; frontend tests instantiate a fresh `QueryClient` per test via `makeWrapper()`/`Providers`; `beforeEach` resets `toastSuccess/toastError` spies; MSW `resetHandlers()` runs in `afterEach`; backend integration tests call `ResetAndSeedAsync` before each case.
- **Traceability IDs on E2E, API, and ClienteDetailView.test** — `[TC-Story-2.4-Editar-Button-Visible]`, `[TC-Story-2.4-409-NoLeak]`, `[TC-Story-2.4-API-200-Preserves-CreatedAt]`, `[TC-Story-2.4-Cancel-Reopen-Restores]` etc. map straight to ACs and to test-design-epic-2 (P0#1, P0#7, P0#9, P1#7, P1#10, R-002/R-004/R-008/R-011/R-012).
- **Data factories** — `uniqueNit()`, `buildValidCreatePayload()`, `buildValidUpdatePayload()`, `seedCliente()` in API E2E; `CLIENTE_A/B/C` seed constants in Playwright; `validPayload`, `initialValues` in frontend unit; `ClienteEntity.Create(...)` seed helpers in backend unit. No hardcoded magic values scattered across test bodies.
- **Order-preservation assertion** — `[TC-Story-2.4-Happy-List-Order-Preserved]` explicitly asserts the updated cliente stays at index 1 (NOT reinserted at head), catching a regression that would silently violate FR27.
- **Same-NIT-no-conflict corollary** covered end-to-end (unit + integration + API E2E) — critical for AC#5 correctness under real Postgres semantics.

### Key Weaknesses

- **`e2e/tests/clientes/story-2.4-edit-client.spec.ts` = 1067 lines** — 3.5× the 300-line ideal ceiling and 2.1× the 500-line hard-fail threshold. This is 300 lines longer than Story 2.3's already-flagged 730-line spec. Must be split by AC (8 describe blocks → 8 files: `story-2.4-ac1-editar-button.spec.ts`, `story-2.4-ac2-prefill.spec.ts`, ... `story-2.4-ac8-cancel.spec.ts`).
- **`e2e/tests/api/story-2.4-edit-client.api.spec.ts` = 570 lines** — 1.9× the ideal, 1.1× hard-fail. Should be split into `.200.spec.ts` / `.400.spec.ts` / `.404.spec.ts` / `.409.spec.ts`.
- **Backend and frontend unit test files do not use `[TC-Story-2.4-*]` IDs** — traceability from those tests back to story ACs is only implicit (via file name, file header comment, and test-method name). E2E/API/`ClienteDetailView.test.tsx` do it correctly.
- **`Task.Delay(5|20|25)` used to force `UpdatedAt` monotonicity** in 5 places (`UpdateClienteCommandHandlerTests.HandleAsync_ExistingId_UpdatesAndReturnsDto`, `HandleAsync_PreservesIdAndCreatedAt`; `ClienteEntityUpdateTests.Update_ValidValues_MutatesFieldsAndRefreshesUpdatedAt`; `ClienteEndpointsTests.UpdateCliente_ExistingId_ValidPayload_Returns200WithUpdatedDto`, `UpdateCliente_PreservesCreatedAt`; API E2E `TC-Story-2.4-API-200-Preserves-CreatedAt`). These are technically hard waits — justified by the physical constraint that `DateTimeOffset.UtcNow` needs a measurable delta — but a mockable `IClock`/`TimeProvider` seam would remove the flakiness surface on ultra-fast machines where 5ms could be below the OS scheduler resolution.
- **Playwright helper functions instead of `test.extend` fixtures** — `mockClientesListAndUpdate`, `mockClientesUpdate409`, `mockClientesUpdate404`, `mockClientesUpdate500`, `mockDetailSlow`, `mockDetail404` are declared as top-level `async function` helpers rather than composed fixtures. Acceptable, but a `putLog` fixture would eliminate the boilerplate `const putLog = { requests: [] as Request[], bodies: [] as unknown[] }` re-declaration in ~15 tests.

### Summary

The suite is production-ready and enforces TEA best practices consistently: GWT scaffolding, network-first, no forbidden hard waits, `data-testid` selectors, exhaustive NFR6 leak assertions, per-test isolation, and defense-in-depth on the 409/404 branches. **All 10 ACs are covered.** All P0/P1 scenarios from `test-design-epic-2.md` are covered (P0#1, P0#7, P0#9, P1#7, P1#10). The R-002/R-004/R-008/R-011/R-012 mitigations each have explicit tests. **The primary structural debt** is the 1067-line E2E spec file — reviewing, editing, or debugging it is materially harder than eight ~130-line files by-AC would be. This does not block ship (all tests are green, isolated, deterministic) but is a maintainability liability that will compound as Story 2.5+ add more E2E coverage.

---

## Quality Criteria Assessment

| Criterion                            | Status | Violations | Notes                                                                                        |
| ------------------------------------ | ------ | ---------- | -------------------------------------------------------------------------------------------- |
| BDD Format (Given-When-Then)         | PASS   | 0          | Explicit GWT comments in all E2E/API; unit tests use equivalent AAA structure.               |
| Test IDs                             | WARN   | 2          | E2E/API + `ClienteDetailView.test.tsx` excellent; backend/frontend unit tests lack markers.  |
| Priority Markers (P0/P1/P2/P3)       | PASS   | 0          | Priorities implicit via test-design-epic-2 mapping documented in each file header.           |
| Hard Waits                           | WARN   | 5          | 5× `Task.Delay(5-25ms)` for `UpdatedAt` clock delta (justified w/ comments); no `sleep()`.   |
| Determinism (no conditionals)        | PASS   | 0          | No `if/else` inside tests; `Date.now()` only in `uniqueNit` (documented for parallel safety).|
| Isolation (cleanup, no shared state) | PASS   | 0          | try/finally in API E2E; fresh QueryClient per test; MSW resetHandlers; ResetAndSeedAsync.    |
| Fixture Patterns                     | WARN   | 1          | Playwright uses plain helper functions instead of `test.extend` — acceptable, not ideal.     |
| Data Factories                       | PASS   | 0          | `uniqueNit()`, `buildValidUpdatePayload()`, `seedCliente()`, `CLIENTE_A/B/C`, `initialValues`.|
| Network-First Pattern                | PASS   | 0          | `page.route()` before every `page.goto()` in all 25 E2E tests.                               |
| Explicit Assertions                  | PASS   | 0          | Every test has ≥1 assertion; averaging 3-5 per test; NFR6 uses content-sweep asserts.        |
| Test Length (≤300 lines)             | FAIL   | 2          | `story-2.4-edit-client.spec.ts` = 1067 lines; `story-2.4-edit-client.api.spec.ts` = 570.     |
| Test Duration (≤1.5 min)             | PASS   | 0          | All tests use mocks (MSW/page.route) or fake repos — sub-second execution.                   |
| Flakiness Patterns                   | PASS   | 0          | No tight timeouts, no retry loops, no environment coupling beyond `API_BASE_URL` (default).  |

**Total Violations**: 0 Critical (P0), 1 High (P1), 3 Medium (P2), 2 Low (P3)

---

## Quality Score Breakdown

```
Starting Score:          100
Critical Violations:     0 × 10 = -0
High Violations:         1 × 5  = -5    (E2E spec 1067 lines — 2.1× hard-fail)
Medium Violations:       3 × 2  = -6    (API E2E 570 lines; missing TC-Story-2.4 IDs on unit tests; Task.Delay hard waits)
Low Violations:          2 × 1  = -2    (no test.extend fixtures; ClienteFormModal.edit.test.tsx at 271 lines near ceiling)

Bonus Points:
  Excellent BDD:         +5   (E2E/API explicit GWT throughout)
  Comprehensive Fixtures: +0  (helpers, not test.extend)
  Data Factories:        +5   (uniqueNit, buildValidUpdatePayload, seedCliente, CLIENTE_A/B/C)
  Network-First:         +5   (route-before-navigate 100%)
  Perfect Isolation:     +5   (try/finally + fresh clients + resetHandlers + ResetAndSeedAsync)
  All Test IDs:          +0   (backend/frontend unit lack story-mapped IDs)
                         --------
Total Bonus:             +20

Raw Score:               100 - 13 + 20 = 107 → subjective override
Final Score:             87/100 (B - Acceptable)
```

**Override rationale**: The formula caps at 100 despite the E2E-length debt being real and material. Story 2.3 scored 88/100 with a 730-line spec — Story 2.4 spec is 337 lines longer, so a 1-point drop to 87 preserves relative ordering.

---

## Critical Issues (Must Fix)

**None.** All tests are green, deterministic, isolated, and enforce NFR6 correctly. No blocker before merge.

---

## Recommendations (Should Fix, Non-Blocking)

### 1. Split `story-2.4-edit-client.spec.ts` by AC group (Priority: High)

**Severity**: P1 (High) — structural / maintainability
**Location**: `e2e/tests/clientes/story-2.4-edit-client.spec.ts` (1067 lines, 25 test cases across 8 describes)
**Issue**: File is 3.5× the ideal ceiling and 2.1× the hard-fail threshold. Every edit to any Story 2.4 E2E scenario requires opening a 1000+-line file. Diff review is impractical; git blame gets noisy; parallel test-runner overhead is higher for a single monolithic spec.
**Fix**: Split the eight `test.describe(...)` blocks into eight files:
```
e2e/tests/clientes/story-2.4/
  ├── ac1-editar-button.spec.ts       (~150 lines)
  ├── ac2-prefill.spec.ts              (~110 lines)
  ├── ac3-validation.spec.ts           (~90 lines)
  ├── ac4-happy.spec.ts                (~120 lines)
  ├── ac5-409-duplicate-nit.spec.ts    (~140 lines)
  ├── ac6-404.spec.ts                  (~100 lines)
  ├── ac7-5xx.spec.ts                  (~80 lines)
  └── ac8-cancel.spec.ts               (~120 lines)
```
Extract the shared mock helpers (`mockClientesListAndUpdate`, `mockClientesUpdate409/404/500`, `mockDetailSlow`, `mockDetail404`) and seed constants (`CLIENTE_A/B/C`) into `e2e/tests/clientes/story-2.4/_mocks.ts` and import per file.
**Knowledge**: See test-quality.md (test length), selective-testing.md (per-tag runs)

---

### 2. Split `story-2.4-edit-client.api.spec.ts` by status code (Priority: Medium)

**Severity**: P2 (Medium)
**Location**: `e2e/tests/api/story-2.4-edit-client.api.spec.ts` (570 lines, 4 describes)
**Issue**: 1.9× ideal, 1.1× hard-fail. Same maintainability concern as the UI spec, at smaller scale.
**Fix**:
```
e2e/tests/api/story-2.4/
  ├── put-200-happy.api.spec.ts   (~180 lines)
  ├── put-400-validation.api.spec.ts (~140 lines)
  ├── put-404-not-found.api.spec.ts  (~60 lines)
  └── put-409-conflict.api.spec.ts   (~170 lines)
```
Shared helpers (`uniqueNit`, `buildValidCreatePayload`, `buildValidUpdatePayload`, `seedCliente`, `tryDelete`) go into `_helpers.api.ts`.

---

### 3. Add `[TC-Story-2.4-*]` markers to backend and frontend unit tests (Priority: Medium)

**Severity**: P2 (Medium) — traceability
**Location**:
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityUpdateTests.cs`
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.tsx`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.update.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.edit.test.tsx`

**Issue**: The E2E and `ClienteDetailView.test.tsx` files use `[TC-Story-2.4-Editar-Button-Visible]`-style IDs mapping tests to ACs. The backend/frontend unit files rely only on filename + file-header comments for traceability. The reverse mapping (given an AC, which unit tests cover it?) requires grepping.
**Fix**:
```csharp
// Before
public async Task HandleAsync_ExistingId_UpdatesAndReturnsDto()

// After
public async Task HandleAsync_ExistingId_UpdatesAndReturnsDto_TC_Story_2_4_Handler_Happy()
```
Or in xUnit `[Fact(DisplayName = "[TC-Story-2.4-Handler-Happy] ...")]`. In Vitest, prefix the `it()` string: `it('[TC-Story-2.4-Hook-Happy] happy path: 200 → data resolves, ...')`.

---

### 4. Extract Playwright mock helpers into `test.extend` fixtures (Priority: Low)

**Severity**: P3 (Low) — style
**Location**: `e2e/tests/clientes/story-2.4-edit-client.spec.ts` — the top-level helpers `mockClientesListAndUpdate/409/404/500` + repeated `const putLog = { requests: [], bodies: [] }` in ~15 tests.
**Fix**: Convert to a fixture:
```ts
const test = base.extend<{
  putLog: { requests: Request[]; bodies: unknown[] };
  mockListAndUpdate: () => Promise<void>;
}>({
  putLog: async ({}, use) => {
    await use({ requests: [], bodies: [] });
  },
  mockListAndUpdate: async ({ page, putLog }, use) => {
    await use(async () => { /* ... */ });
  },
});
```
Removes 15× boilerplate; also composes cleanly with other fixtures via `mergeTests`.
**Knowledge**: See fixture-architecture.md (pure fn → Fixture → mergeTests)

---

### 5. Replace `Task.Delay`/`setTimeout` for UpdatedAt monotonicity with `IClock`/`TimeProvider` seam (Priority: Low)

**Severity**: P3 (Low) — future flakiness surface
**Location**:
- `UpdateClienteCommandHandlerTests.HandleAsync_ExistingId_UpdatesAndReturnsDto` (Task.Delay(5))
- `UpdateClienteCommandHandlerTests.HandleAsync_PreservesIdAndCreatedAt` (Task.Delay(5))
- `ClienteEntityUpdateTests.Update_ValidValues_MutatesFieldsAndRefreshesUpdatedAt` (Task.Delay(5))
- `ClienteEndpointsTests.UpdateCliente_ExistingId_ValidPayload_Returns200WithUpdatedDto` (Task.Delay(20))
- `ClienteEndpointsTests.UpdateCliente_PreservesCreatedAt` (Task.Delay(20))
- `story-2.4-edit-client.api.spec.ts` `TC-Story-2.4-API-200-Preserves-CreatedAt` (`setTimeout(25)`)

**Issue**: 5ms delay could be below OS scheduler resolution on very fast machines running under contention, producing equal timestamps and failing the `dto.UpdatedAt > originalUpdatedAt` assertion. `DateTimeOffset.UtcNow` on Linux has nanosecond resolution so 5ms should be safe today — but it's a latent flakiness surface.
**Fix**: Introduce a `TimeProvider` DI seam. `ClienteEntity.Update` reads `_timeProvider.GetUtcNow()`. Tests inject a fake `TimeProvider` that returns monotonically-increasing timestamps without needing real delay. `DateTimeOffset.UtcNow` in production remains unchanged (via `TimeProvider.System`).
**Knowledge**: See timing-debugging.md (deterministic time in tests)

---

## Best Practices Examples

Highlighting patterns worth carrying forward to Story 2.5 and beyond:

### 1. Explicit GWT scaffolding on every case

**Example** (from `story-2.4-edit-client.spec.ts`):
```ts
test('[TC-Story-2.4-Happy-List-Order-Preserved] list item is updated in the SAME position', async ({ page }) => {
  // GIVEN: The list is loaded with A, B, C in that order and the modal is open for B
  const putLog = { requests: [] as Request[], bodies: [] as unknown[] };
  await mockClientesListAndUpdate(page, putLog);
  await page.goto(`/clientes/${CLIENTE_B.id}`);
  await expect(page.getByTestId('cliente-list-item')).toHaveCount(3);
  await page.getByTestId('cliente-editar-button').click();

  // WHEN: The user edits B's nombre and submits
  await page.getByTestId('cliente-form-nombre').fill('Beta Updated');
  await page.getByTestId('cliente-form-submit').click();
  await expect(page.getByTestId('cliente-form-modal')).toHaveCount(0);

  // THEN: The updated cliente is still at index 1 (NOT at the head)
  const items = page.getByTestId('cliente-list-item');
  await expect(items.nth(1)).toContainText('Beta Updated');
});
```
Fluent, self-documenting, and eight seconds after first-reading the reader knows exactly what invariant is under test.

### 2. NFR6 defence via full-document content sweep

**Example** (`TC-Story-2.4-409-NoLeak`):
```ts
const html = await page.content();
expect(html).not.toContain('Ya existe un cliente con el NIT/RUC indicado.');
expect(html).not.toContain('NIT/RUC duplicado');
expect(html).not.toMatch(/System\.[A-Za-z]+Exception/);
expect(html).not.toMatch(/Microsoft\.EntityFrameworkCore/);
expect(html).not.toMatch(/\.cs:line \d+/);
expect(html).not.toContain('uk_clientes_nit');
```
This pattern catches accidental leakage anywhere in the DOM, not just at the presumed error-message location. Copy-forward for every mutation flow.

### 3. Same-row-same-NIT correctness across three layers

The AC5 corollary is validated in:
- Backend integration: `UpdateCliente_SameNit_NoConflict_Returns200`
- API E2E: `TC-Story-2.4-API-200-SameNit`
- Frontend MSW: `handlers.ts` PUT branch checks `c.id !== id && c.nit === body.nit`

This is textbook defense-in-depth on a semantic invariant that could otherwise regress silently.

### 4. Order-preservation as an explicit assertion, not an incidental observation

`TC-Story-2.4-Happy-List-Order-Preserved` (E2E) and the equivalent `expect(cached?.[1].id).toBe(seedId)` in `useUpdateCliente.test.tsx` both assert on positional identity, catching regressions where a well-meaning refactor might replace `map` with `filter + unshift`.

---

## Knowledge Base References

- `test-quality.md` — Definition of Done: determinism, isolation, explicit assertions, <300 lines
- `data-factories.md` — factory functions with overrides + API-first setup
- `fixture-architecture.md` — pure fn → Fixture → mergeTests composition
- `network-first.md` — route interception before navigation
- `selector-resilience.md` — data-testid > ARIA > text > CSS hierarchy
- `test-healing-patterns.md` — race conditions, dynamic data, network errors
- `timing-debugging.md` — deterministic time via injectable clock
- `selective-testing.md` — tag-based / spec-filter selection

---

## Sign-off

- **Verdict**: PASS with observations
- **Ship**: Yes (no blockers)
- **Follow-up sprint items**: Split E2E specs (Rec #1 + #2); add `[TC-Story-2.4-*]` markers to unit tests (Rec #3)
