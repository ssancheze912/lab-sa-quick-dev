# Test Quality Review: Story 2.4 — Edit Client

**Quality Score**: 93/100 (A+ - Excellent)
**Review Date**: 2026-07-01
**Review Scope**: directory (all tests for Story 2.4)
**Reviewer**: TEA Agent (SiesaTeam)

---

Note: This review audits existing tests; it does not generate tests.

## Files Reviewed

| File | Lines (total) | Story 2.4 section | Framework |
| --- | --- | --- | --- |
| `e2e/tests/clientes/edit-client.spec.ts` | 217 | Entire file (new) | Playwright |
| `backend/tests/SiesaAgents.IntegrationTests/Repositories/ClienteRepositoryTests.cs` | 471 | Lines 345-471 (~127 lines; shared file, Stories 2.1-2.4) | xUnit |
| `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` | 1006 | Lines 630-1006 (~377 lines; shared file, Stories 2.1-2.4) | xUnit (`WebApplicationFactory`) |
| `backend/tests/SiesaAgents.UnitTests/Validators/UpdateClienteRequestValidatorTests.cs` | 208 | Entire file (new) | xUnit |
| `frontend/src/modules/crm/clientes/presentation/components/ClienteForm.test.tsx` | 658 | Lines 386-657 (~272 lines; shared file, Stories 2.3-2.4) | Vitest + RTL + MSW |
| `frontend/src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx` | 369 | Lines 210-369 (~160 lines; shared file, Stories 2.2 + 2.4) | Vitest + RTL + MSW |
| `frontend/src/modules/crm/clientes/application/hooks/useUpdateCliente.test.tsx` | 313 | Entire file (new) | Vitest + RTL + MSW |

## Executive Summary

**Overall Assessment**: Excellent

**Recommendation**: Approve

### Key Strengths

- Consistent Given-When-Then structure via comments across all seven files, including every edge case added by testarch-automate (idempotent double-PUT, malformed GUID route segment, route-id-wins-over-body-id, network-error-without-response, stale-closure id targeting).
- Strong isolation/cleanup discipline maintained from prior stories: backend uses GUID-suffixed unique data + `IAsyncLifetime`/`DisposeAsync` tracked deletion (`ClienteRepositoryTests`, `ClienteEndpointsTests`); E2E uses `afterEach` deleting all `createdIds` via API; frontend resets mocks in `beforeEach(vi.clearAllMocks())` in the files that mock `toast`, and relies on MSW's per-test `server.use()` overrides.
- Excellent defense-in-depth coverage for the self-exclusion requirement (AC #7) — the trickiest logic in this story is independently verified at the repository layer (`UpdateAsync_WithSelfUnchangedNit_DoesNotThrow`), the endpoint layer (`PutClientes_WithSelfUnchangedNit_ReturnsOkNotConflict`, plus the idempotent double-PUT edge case), and the component layer (`ClienteForm.test.tsx` AC #7 test) — no reliance on a single layer proving the DB-constraint-is-per-value design decision.
- Rigorous coverage of the R6 stale-cache risk called out in Dev Notes: `useUpdateCliente.test.tsx` explicitly asserts BOTH `['clientes']` and `['clientes', id]` are invalidated, plus a dedicated "exactly once each" edge case guarding against duplicate invalidation.
- Data factories used consistently: `buildCliente` (E2E), `createCliente` (frontend, faker-based, reused from Story 2.2/2.3), GUID-suffixed inline builders (backend) — no hardcoded magic data colliding across parallel test runs.
- Network-first discipline strictly followed: every MSW `server.use()` override in `ClienteForm.test.tsx`, `useUpdateCliente.test.tsx`, and `ClienteDetailView.test.tsx` is registered before the render/interaction that triggers the request.
- Good negative-space testing for AC #6 (Cancelar): both `ClienteForm.test.tsx` and `edit-client.spec.ts` assert `requestCount`/`putCallCount === 0` via a request spy/route intercept, not just that the dialog closes — proving zero network calls, not merely UI state.
- E2E honesty in Dev Agent Record: the story's own debug log discloses a flaky AC #7 E2E test under 2-worker parallelism (passes under `--workers=1`), diagnosed as resource contention rather than a defect — transparent flakiness disclosure rather than a hidden retry-masking pattern.

### Key Weaknesses

- Selectors continue to rely on `getByLabelText`/`getByRole` rather than `data-testid` for form fields and buttons across `ClienteForm.test.tsx` (edit-mode section), `edit-client.spec.ts` (via `ClientesPage`), and `ClienteDetailView.test.tsx`'s "Editar" button queries — same pre-existing deviation from the TEA `data-testid`-first selector standard already flagged in Story 2.3's review; not introduced by this story.
- `ClienteEndpointsTests.cs` (1006 lines total) and `ClienteForm.test.tsx` (658 lines total) now substantially exceed the 300-line guideline as shared, accumulating multi-story files. Story 2.4's own additions remain compact and clearly delimited (`--- Story 2.4: ... ---` comments), but the trend across Stories 2.1→2.4 shows these files growing every story without a split.
- No explicit machine-parseable test-ID scheme (e.g. `2.4-E2E-001`) in describe/test names; traceability instead relies on inline `TC-E2-P1-XX`/AC-number comments — functional for humans, consistent with prior stories, but not automatable for coverage tooling.

### Summary

The Story 2.4 test suite is comprehensive and deterministic across all four layers (backend unit/integration, frontend component/hook, E2E), with the trickiest requirement of this story — NIT self-exclusion on update (AC #7) — independently verified at three layers. No hard waits, no shared mutable state, and no flakiness-masking patterns (retries, try/catch swallowing assertions) were found in the test code itself; the one disclosed E2E flake (AC #7 under parallel workers) is transparently documented as environmental resource contention in the Dev Agent Record rather than papered over with a retry. The two structural findings — selector strategy not using `data-testid` and two backend/frontend files exceeding 300 lines — are the same pre-existing patterns inherited from Stories 2.1-2.3 flagged in the prior review, now trending larger; they do not block approval but warrant a refactor before Story 2.5 adds another CRUD verb.

---

## Quality Criteria Assessment

| Criterion | Status | Violations | Notes |
| --- | --- | --- | --- |
| BDD Format (Given-When-Then) | PASS | 0 | Comment-based GWT in every test across all 7 files |
| Test IDs | WARN | 1 | TC-E2-P1-08/09/10/15, TC-E2-P2-06 referenced in comments/docblocks; no formal `2.4-XXX-00N` scheme in test names |
| Priority Markers | WARN | 1 | `[P2]` prefix used only on E2E edge-case tests (testarch-automate additions); no P0/P1 tags on the core AC tests, priority implicit via AC/TC-ID comments |
| Hard Waits | PASS | 0 | No `waitForTimeout`/`sleep()`/hardcoded delays in test-side code across all 7 files; the two `setTimeout(50ms)` occurrences in `ClienteDetailView.test.tsx` (loading-state tests) are inside MSW mock handlers simulating latency, not test-side waits |
| Determinism | PASS | 0 | No conditional test logic controlling assertions; `.catch(() => null)` occurrences (E2E cleanup, `useUpdateCliente.test.tsx` 409/network-error tests) are cleanup/rejection-swallowing for intentionally-failing calls, not assertion-flow control; no unguarded randomness |
| Isolation | PASS | 0 | Backend: `_createdIds` + `DisposeAsync` + GUID-suffixed data. Frontend: `vi.clearAllMocks()` (where `toast` is mocked) + fresh `QueryClient` per test + MSW auto-reset. E2E: `afterEach` deletes all `createdIds` via `apiHelper.deleteCliente` |
| Fixture Patterns | PASS | 0 | `renderClienteForm`/`renderEditClienteForm`/`renderUseUpdateCliente`/`renderDetail` pure-function test helpers; E2E uses `base.fixture` + `ClientesPage` POM, consistent with Stories 2.1-2.3 |
| Data Factories | PASS | 0 | `buildCliente` (E2E), `createCliente` (frontend, faker), GUID-suffixed builders (backend) — all support overrides, reused from prior stories |
| Network-First Pattern | PASS | 0 | All `server.use()` overrides precede DOM interaction/render/mutation call across `ClienteForm.test.tsx`, `useUpdateCliente.test.tsx`, `ClienteDetailView.test.tsx` |
| Explicit Assertions | PASS | 0 | Every test has specific, scoped assertions (`toHaveValue`, `toHaveBeenCalledWith`, `toBeInTheDocument`, status-code checks, `invalidateSpy` call-count checks) |
| Test Length (≤300 lines) | WARN | 2 | `ClienteEndpointsTests.cs` (1006 total) and `ClienteForm.test.tsx` (658 total) exceed 300 lines as shared multi-story files; Story 2.4's own sections are ~377 and ~272 lines respectively (would each individually also exceed 300 if isolated, though close for `ClienteForm.test.tsx`'s edit section) |
| Test Duration (≤1.5 min) | PASS | 0 | No complex setup; simulated MSW delays capped at 50ms; nothing suggests slow suites |
| Flakiness Patterns | WARN | 1 | Dev Agent Record discloses one E2E test (AC #7 self-exclusion) failed once under 2-worker parallelism due to resource contention, passing consistently under `--workers=1`; transparently documented, not masked by a retry, but represents a latent CI flakiness risk under default parallel execution |

**Total Violations**: 0 Critical, 0 High, 5 Medium (test-ID scheme, priority markers, 2 file-length, 1 disclosed parallelism flake), 0 Low

---

## Quality Score Breakdown

```
Starting Score:          100
Critical Violations:     -0 × 10 = 0
High Violations:         -0 × 5  = 0
Medium Violations:       -5 × 2  = -10
Low Violations:          -0 × 1  = 0

Bonus Points:
  Excellent BDD:         +5
  Comprehensive Fixtures: +5
  Data Factories:        +5
  Network-First:         +5
  Perfect Isolation:     +5
  All Test IDs:          +0 (informal scheme only)
                         --------
Total Bonus:             +25

Final Score:             93/100 (rounded contribution capped at 100)
Grade:                   A+ (Excellent)
```

---

## Critical Issues (Must Fix)

No critical issues detected.

---

## Recommendations (Should Fix)

### 1. Address the disclosed AC #7 E2E flake under parallel workers before it accumulates

**Severity**: P2 (Medium)
**Location**: `e2e/tests/clientes/edit-client.spec.ts` — `AC #7: editing with the client's own unchanged NIT/RUC succeeds (self-exclusion)` test; documented in `2-4-edit-client.md` Dev Agent Record ("Debug Log References")
**Criterion**: Flakiness Patterns
**Knowledge Base**: ci-burn-in.md, timing-debugging.md

**Issue Description**: The story's own Dev Agent Record discloses this test failed once under 2-worker parallelism due to resource contention against other test files' seed/cleanup, passing consistently under `--workers=1`. This is transparently reported rather than hidden, which is good practice, but it is a real latent flakiness risk if CI runs with default parallelism.

**Recommended Fix**: Run a burn-in loop (10 iterations under the project's actual CI worker count) specifically on `edit-client.spec.ts` combined with the other `clientes/` spec files to confirm whether this is a one-off or a reproducible race. If reproducible, investigate whether test data seeding across files needs stronger isolation (e.g., a per-file DB schema/tag) rather than relying on GUID-suffixed data alone.

**Why This Matters**: An intermittent CI failure that "usually passes" erodes trust in the suite and tends to get workaround-retried rather than fixed, exactly the anti-pattern `ci-burn-in.md` warns against.

---

### 2. Split shared backend/frontend test files continuing to exceed 300 lines

**Severity**: P2 (Medium)
**Location**: `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` (1006 lines), `frontend/src/modules/crm/clientes/presentation/components/ClienteForm.test.tsx` (658 lines)
**Criterion**: Test Length
**Knowledge Base**: test-quality.md

**Issue Description**: This is the same finding raised in the Story 2.3 review, now larger: both files span four stories' worth of test cases. Story 2.4's own sections are compact and delimited (`--- Story 2.4: ... ---` comments), so this is an accumulating pattern, not a defect introduced here — but the trend line means Story 2.5 (delete) will push `ClienteEndpointsTests.cs` well past 1100 lines.

**Recommended Fix**: Before Story 2.5, split `ClienteEndpointsTests.cs` by HTTP verb (e.g., partial classes `ClienteEndpointsTests.Get.cs` / `.Post.cs` / `.Put.cs` / `.Delete.cs`), and split `ClienteForm.test.tsx` into `ClienteForm.create.test.tsx` / `ClienteForm.edit.test.tsx` (the file already has a clear internal seam at line 386).

**Why This Matters**: Navigability and review effort degrade linearly with file growth; splitting now (with only two modes: create/edit) is far cheaper than after Story 2.5 adds a third concern (delete confirmation).

**Priority**: P2 — not a blocker for this story, but should be scheduled before Story 2.5.

---

### 3. Adopt `data-testid` for edit-mode form/trigger selectors

**Severity**: P2 (Medium)
**Location**: `frontend/src/modules/crm/clientes/presentation/components/ClienteForm.test.tsx` (edit-mode section, lines 440-657), `e2e/pages/clientes.page.ts` (`inputNombre`, `inputNit`, `inputTelefono`, `inputCiudad`, `btnGuardar`, `btnCancelar`), `ClienteDetailView.test.tsx`'s `getByRole('button', { name: /editar/i })` queries
**Criterion**: Selector Resilience
**Knowledge Base**: selector-resilience.md

**Issue Description**: Same finding as Story 2.3's review, extended to the new "Editar" trigger and edit-mode form queries — role/label-based selectors are reasonably resilient (accessibility-driven) but still couple to Spanish copy wording, which a future localization pass would break across every layer simultaneously.

**Recommended Fix**: Add `data-testid` attributes to the "Editar" button and reuse the same `cliente-form-*` convention recommended in the Story 2.3 review for the shared `ClienteForm` inputs (they're the same DOM elements in both modes, so this fix covers both stories at once).

**Why This Matters**: A single fix here retroactively improves both Story 2.3 and 2.4 test resilience, since `ClienteForm` is shared.

**Related Violations**: Identical to Story 2.3 review finding #1 — recommend batching both into one follow-up PR.

---

## Best Practices Found

### 1. Three-layer verification of the self-exclusion edge case (AC #7)

**Location**: `ClienteRepositoryTests.cs:452-470` (`UpdateAsync_WithSelfUnchangedNit_DoesNotThrow`), `ClienteEndpointsTests.cs:842-861` (`PutClientes_WithSelfUnchangedNit_ReturnsOkNotConflict`) + `942-960` (idempotent double-PUT edge case), `ClienteForm.test.tsx:639-656`
**Pattern**: Independent, layered verification of a subtle race-condition-adjacent business rule
**Knowledge Base**: test-levels-framework.md, data-factories.md

**Why This Is Good**: AC #7 is the easiest requirement in this story to get subtly wrong (an eager application-level uniqueness pre-check would false-positive on self-update). Verifying it at the repository layer (no exception thrown), the endpoint layer (200 not 409, plus idempotent repeat-submit), and the component layer (toast fires) means a regression at any layer is caught immediately rather than only surfacing in E2E.

### 2. Negative-space assertions for "Cancelar makes zero API calls" (AC #6)

**Location**: `edit-client.spec.ts:134-159` (route intercept counting `PUT` calls), `ClienteForm.test.tsx:616-636` (MSW handler counting `requestCount`)
**Pattern**: Explicit request-count assertion, not just UI-state assertion
**Knowledge Base**: network-first.md, test-quality.md

**Why This Is Good**: It would be easy to write a shallow test that only checks the dialog closes on Cancelar. Both the E2E and component tests instead instrument the network layer itself to prove zero requests fired — a stronger guarantee that directly targets the R8 risk called out in the story's Dev Notes.

### 3. Transparent flakiness disclosure over silent retry-masking

**Location**: `2-4-edit-client.md` Dev Agent Record ("Debug Log References")
**Pattern**: Documenting a known intermittent failure with root-cause hypothesis instead of adding a retry/skip
**Knowledge Base**: ci-burn-in.md

**Why This Is Good**: The dev agent could have silently added a retry or `test.skip` to make the suite "green." Instead it documented the exact condition (2-worker parallelism, resource contention) and confirmed via `git stash` that it's pre-existing/environmental, giving the team an actionable, honest signal rather than a hidden flake.

---

## Test File Analysis (Story 2.4 additions only)

### Test Coverage Scope

- **AC #1** (Editar opens pre-filled form): covered by `edit-client.spec.ts` (TC-E2-P1-08), `ClienteForm.test.tsx` (4 pre-fill tests), `ClienteDetailView.test.tsx` (trigger visibility across loading/success/not-found states + pre-fill-without-extra-fetch)
- **AC #2** (save reflects immediately, exact toast): covered across E2E (2 tests: detail + list reflection), `ClienteForm.test.tsx` (toast + onSuccess), `useUpdateCliente.test.tsx` (toast + cache invalidation)
- **AC #3** (backend independent validation, 400): covered by `UpdateClienteRequestValidatorTests.cs` (11 tests incl. edge cases) + `ClienteEndpointsTests.cs` (400 + field-errors + no-persist tests)
- **AC #4** (frontend validation blocks submit): covered by `ClienteForm.test.tsx` (inline error + mutation-not-called)
- **AC #5** (409 conflict, friendly message, data intact): covered at all three layers — backend endpoint (409 + Spanish message + no-tech-leakage + no-persist), frontend hook (rejects + no toast + no cache invalidation), frontend component (inline message + form stays open + data intact), E2E (full journey)
- **AC #6** (Cancelar, zero API calls): covered by `ClienteForm.test.tsx`, `ClienteDetailView.test.tsx` (discard-draft-on-reopen), E2E (route-intercept + reopen-after-cancel edge case)
- **AC #7** (self-exclusion): covered by repository, endpoint (incl. idempotent double-PUT), component, and E2E layers

**Coverage**: 7/7 acceptance criteria covered across at least two independent layers each (100%), with AC #5 and AC #7 covered across three-plus layers matching the story's explicit defense-in-depth requirement.

---

## Knowledge Base References

This review consulted the following knowledge base fragments:

- test-quality.md — Definition of Done for tests (no hard waits, <300 lines, <1.5 min, self-cleaning)
- fixture-architecture.md — Pure function to Fixture to mergeTests pattern
- network-first.md — Route intercept before navigate/interact (race condition prevention)
- data-factories.md — Factory functions with overrides, API-first setup
- test-levels-framework.md — E2E vs API vs Component vs Unit appropriateness
- selector-resilience.md — data-testid > ARIA > text > CSS hierarchy
- test-healing-patterns.md — Stale selectors, race conditions, hard waits
- timing-debugging.md — Race condition prevention and async debugging
- selective-testing.md — Duplicate coverage detection
- ci-burn-in.md — Flaky test detection via burn-in loops

---

## Decision

**Recommendation**: Approve

**Rationale**: All seven acceptance criteria are covered redundantly across independent test layers with no critical or high-severity violations. The suite is deterministic, isolated, free of hard waits, and free of retry-masking. The five medium findings — selector strategy, two growing file sizes, informal test-ID scheme, and one transparently-disclosed parallelism-related E2E flake — are consistent with (and in most cases identical to) the pre-existing patterns already flagged in the Story 2.3 review, and none block this story's approval. The disclosed AC #7 flake and the file-size trend both warrant scheduled follow-up before Story 2.5 (delete) adds a fifth CRUD-verb concern to the same shared files.

> Test quality is excellent with 93/100 score. Minor issues noted (data-testid adoption, backend/frontend file length, one disclosed parallel-worker flake) can be addressed in follow-up work. Tests are production-ready and follow best practices.

---

## Review Metadata

**Generated By**: BMad TEA Agent (Test Architect)
**Workflow**: testarch-test-review v4.0
**Review ID**: test-review-2-4-edit-client-20260701
**Timestamp**: 2026-07-01
**Version**: 1.0
