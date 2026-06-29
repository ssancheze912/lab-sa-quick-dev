# Test Quality Review: Story 4.2 — Associate/Disassociate Contacts from Client

**Quality Score**: 72/100 (B - Acceptable)
**Review Date**: 2026-06-29
**Review Scope**: Suite (5 files — 2 unit hook tests, 2 component tests, 1 integration test)
**Reviewer**: TEA Agent (testarch-test-review v4.0)

---

Note: This review audits existing tests; it does not generate tests.

## Executive Summary

**Overall Assessment**: Acceptable

**Recommendation**: Approve with Comments

### Key Strengths

- Excellent Given-When-Then structure in all 5 files, with inline comments marking each phase
- No hard waits detected anywhere in the suite — all async flows use waitFor/act correctly
- Component tests use data factories with counter-reset in beforeEach, ensuring deterministic IDs
- Backend integration tests have strict database isolation (unique in-memory DB per test class instance)
- data-testid selectors are present and used appropriately in component tests (`asociar-contacto-dialog`, `asociar-contacto-empty-state`, `contacto-item-{id}`)

### Key Weaknesses

- TC-3 (toast success) and TC-4 (toast error) in both hook tests do NOT assert the actual toast message content — they only verify `isSuccess`/`isError` state, leaving AC #8 toast text unverified at unit level
- MSW server lifecycle anti-pattern: `server.listen()` in `beforeEach` + `server.close()` in `afterEach` (should be `beforeAll`/`afterAll`) in all 4 frontend test files
- `AsociarContactoDialog.test.tsx` (392 lines) and `AssignClienteEndpointTests.cs` (533 lines) exceed the 300-line threshold
- Duplicate MSW handler implementation: `src/test/msw/handlers/` and `src/modules/test/msw/handlers/` contain identical code rather than a re-export chain

### Summary

The test suite provides solid structural quality and good AC coverage. Given-When-Then format is consistently applied, isolation is well-managed, and the backend integration tests are thorough. The main concerns are: (1) the toast assertion gap — the story explicitly mandates Spanish toast text per AC #8, but the hook-level TC-3/TC-4 tests only verify mutation state rather than the toast call, and (2) the MSW lifecycle anti-pattern which could cause subtle failures in test runners that parallelize describe blocks. The file size violations and handler duplication are maintainability risks but do not affect test correctness.

---

## Quality Criteria Assessment

| Criterion                            | Status     | Violations | Notes                                                              |
| ------------------------------------ | ---------- | ---------- | ------------------------------------------------------------------ |
| BDD Format (Given-When-Then)         | PASS       | 0          | All 5 files use GWT comments consistently                          |
| Test IDs                             | PASS       | 0          | TC-1 through TC-5/TC-7 IDs present in file headers and describe blocks |
| Priority Markers (P0/P1/P2/P3)       | WARN       | 5          | No P0/P1/P2/P3 markers in test code; partially mitigated by file headers |
| Hard Waits (sleep, waitForTimeout)   | PASS       | 0          | No hard waits detected in any file                                 |
| Determinism (no conditionals)        | PASS       | 0          | No if/else or try-catch flow control in test bodies                |
| Isolation (cleanup, no shared state) | WARN       | 4          | MSW server.listen()/close() in beforeEach/afterEach (all 4 frontend files) |
| Fixture Patterns                     | WARN       | 4          | renderDialog() helper used (good) but no test.extend fixtures; acceptable at this level |
| Data Factories                       | PASS       | 0          | createContacto/createCliente factories with overrides and reset used correctly |
| Network-First Pattern                | PASS       | 0          | server.use() always called before renderHook/render; MSW intercepts before execution |
| Explicit Assertions                  | WARN       | 4          | TC-3/TC-4 in useAsociarContacto and useDesasociarContacto verify only state, not toast content |
| Test Length (≤300 lines)             | WARN       | 2          | AsociarContactoDialog.test.tsx (392 lines), AssignClienteEndpointTests.cs (533 lines) |
| Test Duration (≤1.5 min)             | PASS       | 0          | Unit and component tests estimated <10s each; integration tests <30s |
| Flakiness Patterns                   | WARN       | 4          | MSW listen/close in beforeEach/afterEach is a potential source of flakiness |

**Total Violations**: 0 Critical (P0), 4 High (P1), 6 Medium (P2), 1 Low (P3)

---

## Quality Score Breakdown

```
Starting Score:           100
Critical Violations:      0 × 10  = -0
High Violations:          4 × 5   = -20
Medium Violations:        6 × 2   = -12
Low Violations:           1 × 1   = -1

Bonus Points:
  Excellent BDD:          +5
  Data Factories:         +5
  Network-First Pattern:  +5
  No Hard Waits (bonus):  +0  (covered by base score)
                          --------
Total Bonus:              +10 (capped — no comprehensive fixtures or all test IDs bonus applies)

Adjustment: GWT is excellent (+5), isolation pattern (-MSW lifecycle already penalized in Medium)

Final Score:              max(0, min(100, 100 - 33 + 5)) = 72/100
Grade:                    B (Acceptable)
```

---

## Critical Issues (Must Fix)

No critical (P0) issues detected.

---

## Recommendations (Should Fix)

### 1. Toast Assertion Gap in Hook Tests TC-3 and TC-4

**Severity**: P1 (High)
**Location**: `useAsociarContacto.test.ts:188-203`, `useAsociarContacto.test.ts:211-226`, `useDesasociarContacto.test.ts:188-204`, `useDesasociarContacto.test.ts:212-227`
**Criterion**: Explicit Assertions
**Knowledge Base**: test-quality.md

**Issue Description**:
TC-3 and TC-4 in both hook tests claim to verify toast messages ("Contacto asociado correctamente" and "No se pudo asociar el contacto. Intenta de nuevo.") per AC #8, but the actual assertions only check `isSuccess`/`isError` on the mutation state. The toast function call is never verified. If the hook's `onSuccess`/`onError` callback omits or misspells the toast message, these tests will still pass.

**Current Code**:

```typescript
// useAsociarContacto.test.ts TC-3 (lines 196-203)
// THEN: mutation completes successfully (toast assertion verified via side-effect)
await waitFor(() => expect(result.current.isSuccess).toBe(true));
// No toast.success('Contacto asociado correctamente') assertion exists
```

**Recommended Fix**:

```typescript
import { vi } from 'vitest';

// At top of file - mock the toast module
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import toast from 'react-hot-toast';

// TC-3: Verify toast content
it('should show toast "Contacto asociado correctamente" on successful association', async () => {
  server.use(handleAssignClienteSuccess({ clienteId: CLIENTE_ID }));
  const { wrapper } = createWrapper();
  const { result } = renderHook(() => useAsociarContacto(), { wrapper });

  await act(async () => {
    result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  // THEN: correct Spanish toast was shown
  expect(toast.success).toHaveBeenCalledWith('Contacto asociado correctamente');
});

// TC-4: Verify error toast content
it('should show toast "No se pudo asociar el contacto. Intenta de nuevo." on error', async () => {
  server.use(handleAssignClienteServerError());
  const { wrapper } = createWrapper();
  const { result } = renderHook(() => useAsociarContacto(), { wrapper });

  await act(async () => {
    result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
  });

  await waitFor(() => expect(result.current.isError).toBe(true));
  // THEN: correct Spanish error toast was shown
  expect(toast.error).toHaveBeenCalledWith('No se pudo asociar el contacto. Intenta de nuevo.');
});
```

**Why This Matters**:
AC #8 of Story 4.2 explicitly mandates Spanish toast messages. Without asserting the exact text, a regression in the `onError` callback (wrong message, missing call, wrong toast type) will go undetected. This is the primary way users know an action failed.

**Applies To**: Same fix needed in `useDesasociarContacto.test.ts` TC-3/TC-4.

---

### 2. MSW Server Lifecycle Anti-Pattern (beforeEach/afterEach instead of beforeAll/afterAll)

**Severity**: P1 (High)
**Location**: `useAsociarContacto.test.ts:36-44`, `useDesasociarContacto.test.ts:36-44`, `AsociarContactoDialog.test.tsx:46-56`, `ConfirmarDesasociarDialog.test.tsx:39-48`
**Criterion**: Isolation, Flakiness Patterns
**Knowledge Base**: test-quality.md

**Issue Description**:
All 4 frontend test files call `server.listen()` inside `beforeEach` and `server.close()` inside `afterEach`. MSW 2.x documentation and best practices recommend listening once per suite (`beforeAll`) and closing once (`afterAll`), with `resetHandlers()` between tests. The current pattern creates unnecessary overhead and can cause "already listening" warnings or subtle race conditions if Vitest runs describes in parallel.

**Current Code**:

```typescript
// ❌ Anti-pattern (all 4 frontend files)
beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close(); // Closes and re-opens per test — unnecessary overhead
  vi.restoreAllMocks();
});
```

**Recommended Fix**:

```typescript
// ✅ Correct MSW 2.x lifecycle pattern
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => server.close());
```

**Why This Matters**:
Calling `server.close()` and `server.listen()` on every test is functionally correct in most cases but adds overhead and deviates from MSW documentation. In Vitest with worker-based parallelism, calling `server.listen()` after `server.close()` in the same process can trigger warnings and potential instability.

---

### 3. File Size Violations

**Severity**: P2 (Medium)
**Location**: `AsociarContactoDialog.test.tsx` (392 lines), `AssignClienteEndpointTests.cs` (533 lines)
**Criterion**: Test Length
**Knowledge Base**: test-quality.md

**Issue Description**:
Two files exceed the 300-line threshold. `AsociarContactoDialog.test.tsx` at 392 lines is in the WARN range (301-500). `AssignClienteEndpointTests.cs` at 533 lines exceeds 500 lines.

**Recommended Fix for AsociarContactoDialog.test.tsx**:
Split into two files:
- `AsociarContactoDialog-rendering.test.tsx` — TC-1 through TC-3 (display/rendering scenarios)
- `AsociarContactoDialog-interaction.test.tsx` — TC-4 through TC-7 (user interaction, mutation, error scenarios)

**Recommended Fix for AssignClienteEndpointTests.cs**:
The 533-line count is inflated by extensive inline documentation comments and the factory `SeedContactoAsync` helper. Consider:
- Extract `SeedContactoAsync` to a shared `ContactoTestHelpers.cs` base class
- Move the `AssignClienteWebApplicationFactory` to a shared `TestFactories/` folder

**Why This Matters**:
Large test files are harder to navigate, review, and debug when a specific scenario fails. Splitting by scenario category improves maintainability.

---

### 4. Duplicate MSW Handler Implementation

**Severity**: P2 (Medium)
**Location**: `src/test/msw/handlers/contactos-assign-cliente.handlers.ts` and `src/modules/test/msw/handlers/contactos-assign-cliente.handlers.ts`
**Criterion**: Data Factories / Maintainability
**Knowledge Base**: data-factories.md

**Issue Description**:
The same handler logic exists in two separate files with identical code. Some factory files in `modules/test/` correctly re-export from `src/test/` (e.g., `contacto.factory.ts` in `modules/test` is a re-export). The MSW handler files are full duplicates.

**Recommended Fix**:

```typescript
// src/modules/test/msw/handlers/contactos-assign-cliente.handlers.ts
// ✅ Re-export from canonical location instead of duplicating
export * from '../../../../test/msw/handlers/contactos-assign-cliente.handlers';
```

**Why This Matters**:
If the handler response schema changes (e.g., new field added to `ContactoDto`), both files must be updated. A re-export ensures a single source of truth.

---

### 5. Missing Priority Markers

**Severity**: P2 (Medium)
**Location**: All 5 test files
**Criterion**: Priority Markers
**Knowledge Base**: test-priorities.md

**Issue Description**:
No P0/P1/P2/P3 priority markers are present in test code. The file headers describe coverage (TC-1 through TC-N) but do not classify which tests are critical-path (P0), important (P1), or regression (P2/P3). This makes CI filtering and selective test execution harder.

**Recommended Fix** (inline comment approach per TEA standards):

```typescript
// TC-1: Calls correct endpoint (P1 — correctness of API contract)
describe('useAsociarContacto — TC-1 [P1]: calls correct endpoint with correct body', () => {

// TC-3: Toast success message (P1 — AC #8 mandatory requirement)
describe('useAsociarContacto — TC-3 [P1]: success toast in Spanish', () => {
```

---

### 6. `ConfirmarDesasociarDialog` TC-4 MSW Handler Mismatch

**Severity**: P3 (Low)
**Location**: `ConfirmarDesasociarDialog.test.tsx:241`
**Criterion**: Test Length / Maintainability

**Issue Description**:
TC-4 (cancel without API call) registers a PUT handler on `/api/v1/contactos/:id/cliente` (using `:id` as the param name), while all other tests in this suite use `:contactoId`. Both work in MSW but the inconsistency is confusing.

```typescript
// Line 241 in ConfirmarDesasociarDialog.test.tsx
http.put('/api/v1/contactos/:id/cliente', () => {  // ← ':id' inconsistent
```

**Recommended Fix**:

```typescript
http.put('/api/v1/contactos/:contactoId/cliente', () => {  // ← consistent with rest of suite
```

---

## Best Practices Found

### 1. Controlled-Delay Pattern for isPending Tests

**Location**: `useAsociarContacto.test.ts:269-308`, `useDesasociarContacto.test.ts:269-310`
**Pattern**: Controlled Promise resolution for in-flight state testing
**Knowledge Base**: timing-debugging.md

**Why This Is Good**:
TC-5 in both hook tests uses a manual Promise with a `resolveRequest` function to control exactly when the MSW response returns. This is the correct pattern for testing loading/pending states without hard waits.

```typescript
// ✅ Excellent controlled-delay pattern
let resolveRequest!: () => void;
const requestPending = new Promise<void>((resolve) => {
  resolveRequest = resolve;
});

server.use(
  http.put('/api/v1/contactos/:contactoId/cliente', async () => {
    await requestPending;  // Holds until we signal completion
    return HttpResponse.json({ ... }, { status: 200 });
  })
);

// Test the in-flight state
await waitFor(() => expect(result.current.isPending).toBe(true));

// Cleanup: release the hold
resolveRequest();
await waitFor(() => expect(result.current.isPending).toBe(false));
```

### 2. Per-Test Isolated QueryClient

**Location**: All 4 frontend test files — `createWrapper()` and `renderDialog()` helpers
**Pattern**: Factory function creating a new QueryClient per test
**Knowledge Base**: fixture-architecture.md

**Why This Is Good**:
Each test gets a fresh `QueryClient` via a factory function, preventing TanStack Query cache pollution between tests. The QueryClient is configured with `retry: false` and `refetchOnWindowFocus: false` to avoid test interference.

### 3. Backend Factory Isolation via Unique In-Memory DB

**Location**: `AssignClienteEndpointTests.cs:44-71`
**Pattern**: `WebApplicationFactory` with unique `DatabaseName` per instance
**Knowledge Base**: data-factories.md

**Why This Is Good**:
Each `AssignClienteWebApplicationFactory` instance generates a unique database name using `Guid.NewGuid()`, ensuring complete isolation between test class instances even when tests run in parallel.

### 4. Explicit AC Reference in Test Headers

**Location**: `AsociarContactoDialog.test.tsx:8-16`, `ConfirmarDesasociarDialog.test.tsx:8-16`
**Pattern**: AC-to-TC mapping in file header comments

**Why This Is Good**:
Each test file header lists which Acceptance Criteria each TC covers (e.g., `TC-1 (AC #1)`, `TC-6 (AC #7)`), providing traceability without a separate document for single-story test suites.

---

## Test File Analysis

### File Metadata

| File | Lines | Framework | Language |
|------|-------|-----------|----------|
| `useAsociarContacto.test.ts` | 310 | Vitest + MSW | TypeScript |
| `useDesasociarContacto.test.ts` | 311 | Vitest + MSW | TypeScript |
| `AsociarContactoDialog.test.tsx` | 392 | Vitest + RTL + MSW | TypeScript (TSX) |
| `ConfirmarDesasociarDialog.test.tsx` | 344 | Vitest + RTL + MSW | TypeScript (TSX) |
| `AssignClienteEndpointTests.cs` | 533 | xUnit + WebApplicationFactory | C# |

### Test Structure

| File | Describe Blocks | Test Cases | Avg Lines/Test |
|------|----------------|------------|----------------|
| `useAsociarContacto.test.ts` | 5 | 7 | ~30 |
| `useDesasociarContacto.test.ts` | 5 | 7 | ~30 |
| `AsociarContactoDialog.test.tsx` | 7 | 10 | ~32 |
| `ConfirmarDesasociarDialog.test.tsx` | 6 | 10 | ~28 |
| `AssignClienteEndpointTests.cs` | N/A (class) | 8 | ~46 |

---

## Context and Integration

### Related Artifacts

- **Story File**: `story-4.2-associate-disassociate-contacts-from-client.md`
- **Acceptance Criteria Mapped**: 9/10 (90%)

### Acceptance Criteria Validation

| Acceptance Criterion | Tests Covering | Status | Notes |
|---------------------|----------------|--------|-------|
| AC #1 — Contact selector dialog appears | `AsociarContactoDialog` TC-1 | Covered | Dialog visibility verified |
| AC #2 — PUT endpoint called, contact appears in list | `useAsociarContacto` TC-1, `AsociarContactoDialog` TC-4, Backend TC-1 | Covered | Full stack coverage |
| AC #3 — TanStack Query keys invalidated | `useAsociarContacto` TC-2, `useDesasociarContacto` TC-2 | Covered | Both query keys verified |
| AC #4 — Confirmation dialog appears for disassociation | `ConfirmarDesasociarDialog` TC-1 | Covered | Dialog visibility verified |
| AC #5 — PUT with null, contact not deleted | `useDesasociarContacto` TC-1, Backend TC-2, TC-5 | Covered | Full stack coverage |
| AC #6 — TanStack Query keys invalidated on disassociate | `useDesasociarContacto` TC-2, `ConfirmarDesasociarDialog` TC-3 | Covered | Both keys verified |
| AC #7 — Loading indicator, buttons disabled | `useAsociarContacto` TC-5, `useDesasociarContacto` TC-5, Dialog TC-5/TC-6 | Covered | isPending verified |
| AC #8 — Toast in Spanish on error/success | TC-3/TC-4 in both hooks — state only, NOT toast text | **PARTIAL** | P1 gap: toast content unverified |
| AC #9 — Empty state "No hay contactos disponibles" | `AsociarContactoDialog` TC-3 | Covered | Two scenarios covered |
| AC #10 — Cancel closes without API call | `AsociarContactoDialog` TC-5, `ConfirmarDesasociarDialog` TC-4 | Covered | putCalled=false verified |

**Coverage**: 9/10 criteria covered (90%) — AC #8 is partially covered (state is verified, toast text is not).

---

## Knowledge Base References

This review consulted the following knowledge base fragments:

- **[test-quality.md](../../../_bmad/bmm/testarch/knowledge/test-quality.md)** — Definition of Done: <300 lines, <1.5 min, no hard waits, self-cleaning
- **[data-factories.md](../../../_bmad/bmm/testarch/knowledge/data-factories.md)** — Factory patterns with overrides and counter reset
- **[test-levels-framework.md](../../../_bmad/bmm/testarch/knowledge/test-levels-framework.md)** — Unit vs Component vs Integration appropriateness
- **[timing-debugging.md](../../../_bmad/bmm/testarch/knowledge/timing-debugging.md)** — Controlled-delay patterns for async tests
- **[test-priorities.md](../../../_bmad/bmm/testarch/knowledge/test-priorities-matrix.md)** — P0-P3 classification framework
- **[traceability.md](../../../_bmad/bmm/testarch/knowledge/traceability.md)** — AC-to-test mapping
- **[ci-burn-in.md](../../../_bmad/bmm/testarch/knowledge/ci-burn-in.md)** — Flakiness patterns

---

## Next Steps

### Immediate Actions (Before Merge)

1. **Add toast mock assertions to TC-3/TC-4 in hook tests** — Verify exact Spanish toast messages per AC #8
   - Priority: P1
   - Affects: `useAsociarContacto.test.ts` (lines 187-226), `useDesasociarContacto.test.ts` (lines 187-226)
   - Estimated Effort: 30 minutes

2. **Fix MSW server lifecycle in all 4 frontend test files** — Change beforeEach/afterEach to beforeAll/afterAll
   - Priority: P1
   - Affects: All 4 frontend test files
   - Estimated Effort: 15 minutes

### Follow-up Actions (Future PRs)

1. **Split large test files** — AsociarContactoDialog (392 lines) and AssignClienteEndpointTests.cs (533 lines)
   - Priority: P2
   - Target: Next sprint

2. **Consolidate duplicate MSW handlers** — Replace `modules/test/msw/handlers/contactos-assign-cliente.handlers.ts` with re-export
   - Priority: P2
   - Target: Next sprint

3. **Add P0/P1/P2/P3 priority markers** — Inline in describe block names
   - Priority: P2
   - Target: Backlog

4. **Fix param name inconsistency** — `:id` → `:contactoId` in ConfirmarDesasociarDialog.test.tsx line 241
   - Priority: P3
   - Target: Backlog

### Re-Review Needed?

Re-review recommended after adding toast mock assertions (items 1 above). Other items are improvements and do not block merge.

---

## Decision

**Recommendation**: Approve with Comments

**Rationale**:
The test suite demonstrates solid foundational quality: GWT structure is consistent, no hard waits exist, data factories are used correctly, backend integration tests are well-isolated, and AC coverage is 90%. The two P1 issues (toast assertion gap and MSW lifecycle) are fixable in under an hour and should be addressed before merge. The remaining issues are maintainability improvements suitable for follow-up PRs. The suite is safe to merge after addressing the P1 items.

The AC #8 gap is the most important finding: Story 4.2 mandates specific Spanish toast text as a company standard (P0 UX requirement per architecture docs), yet the tests do not verify the toast library is called with the correct strings. This should be fixed to prevent silent regressions.

---

## Appendix

### Violation Summary by Location

| File | Line | Severity | Criterion | Issue | Fix |
|------|------|----------|-----------|-------|-----|
| `useAsociarContacto.test.ts` | 196-203 | P1 | Explicit Assertions | TC-3 only checks `isSuccess`, not toast text | Add `toast.success` mock assertion |
| `useAsociarContacto.test.ts` | 218-226 | P1 | Explicit Assertions | TC-4 only checks `isError`, not toast text | Add `toast.error` mock assertion |
| `useDesasociarContacto.test.ts` | 195-204 | P1 | Explicit Assertions | TC-3 only checks `isSuccess`, not toast text | Add `toast.success` mock assertion |
| `useDesasociarContacto.test.ts` | 218-226 | P1 | Explicit Assertions | TC-4 only checks `isError`, not toast text | Add `toast.error` mock assertion |
| `useAsociarContacto.test.ts` | 36-44 | P1 | Isolation/Flakiness | MSW listen in beforeEach / close in afterEach | Use beforeAll/afterAll |
| `useDesasociarContacto.test.ts` | 36-44 | P1 | Isolation/Flakiness | MSW listen in beforeEach / close in afterEach | Use beforeAll/afterAll |
| `AsociarContactoDialog.test.tsx` | 46-56 | P1 | Isolation/Flakiness | MSW listen in beforeEach / close in afterEach | Use beforeAll/afterAll |
| `ConfirmarDesasociarDialog.test.tsx` | 39-48 | P1 | Isolation/Flakiness | MSW listen in beforeEach / close in afterEach | Use beforeAll/afterAll |
| `AsociarContactoDialog.test.tsx` | All | P2 | Test Length | 392 lines (WARN: 301-500) | Split into 2 files |
| `AssignClienteEndpointTests.cs` | All | P2 | Test Length | 533 lines (FAIL: >500) | Extract helpers to base class |
| `modules/test/msw/handlers/contactos-assign-cliente.handlers.ts` | All | P2 | Data Factories | Duplicate implementation (not re-export) | Replace with re-export |
| All 5 files | N/A | P2 | Priority Markers | No P0/P1/P2/P3 markers | Add inline priority markers to describe names |
| `ConfirmarDesasociarDialog.test.tsx` | 241 | P3 | Maintainability | `:id` param name inconsistency vs `:contactoId` | Rename to `:contactoId` |

---

## Review Metadata

**Generated By**: BMad TEA Agent (Test Architect)
**Workflow**: testarch-test-review v4.0
**Review ID**: test-review-story-4.2-20260629
**Timestamp**: 2026-06-29
**Version**: 1.0
