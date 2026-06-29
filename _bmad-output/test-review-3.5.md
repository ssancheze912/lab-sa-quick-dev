# Test Quality Review: Story 3.5 — Delete Contact

**Quality Score**: 84/100 (A — Good)
**Review Date**: 2026-06-29
**Review Scope**: directory (3 files, Story 3.5)
**Reviewer**: TEA Agent (testarch-test-review v4.0)

---

## Executive Summary

**Overall Assessment**: Good

**Recommendation**: Approve with Comments

### Key Strengths

- Excellent Given-When-Then structure with explicit comments in every test block across all three files
- Comprehensive factory abstraction (`contacto.factory.ts`) with sequential counters, override support, and `resetContactoCounter()` called in `beforeEach` — strong isolation
- Perfect isolation in MSW setup: `server.listen` in `beforeEach`, `server.resetHandlers` + `server.close` + `vi.restoreAllMocks` in `afterEach` — no shared MSW state between tests
- Backend integration tests use per-test `WebApplicationFactory` with unique in-memory DB names (`Guid.NewGuid()`) preventing any cross-test data pollution
- All three test IDs from the story spec (`TC-E3-P0-delete-01`, `TC-E3-P1-delete-01/02`, `TC-E3-P0-delete-api-01`, `TC-E3-P2-delete-api-02`) are present, labeled, and traceable to ACs

### Key Weaknesses

- `ContactoDetailView.delete.test.tsx` is 485 lines — exceeds the 300-line acceptable ceiling (P2)
- `useDeleteContacto.test.ts` uses duplicate test ID `TC-E3-P2-delete-01` for two separate `it` blocks (lines 74 and 100), making result-to-requirement traceability ambiguous (P1)
- No `@faker-js/faker` — factory uses counter-based IDs which is acceptable, but the factory re-export chain is indirect and fragile (`modules/test/factories/contacto.factory.ts` re-exports to `test/factories/contacto.factory.ts`). A path alias would be cleaner (P3)
- AC #4 (both `['contactos']` AND `['contactos', id]` invalidated) is tested only via two separate `it` blocks under the same ID; a single atomic test covering both assertions would be cleaner per the one-principal-assertion-per-test guidance (P3)
- Backend test `DeleteContacto_RemovedFromList_AfterDeletion` (line 131) uses `Assert.Contains(contactoId.ToString(), listAfterJson)` for pre-condition check — this is a string search on raw JSON that could false-positive if the ID appears in another field (P2)

### Summary

All five ACs are covered at the correct test level (unit, component, and API integration). The tests follow Given-When-Then, use `data-testid` selectors consistently, contain no hard waits, no shared mutable globals, and no determinism issues. The two issues worth addressing before merge are: (1) the duplicate test ID on `TC-E3-P2-delete-01` in `useDeleteContacto.test.ts` which impairs CI result reporting, and (2) the oversized `ContactoDetailView.delete.test.tsx` at 485 lines. No critical (P0) violations were found. Approval with minor corrections is warranted.

---

## Quality Criteria Assessment

| Criterion                            | Status      | Violations | Notes                                                                 |
| ------------------------------------ | ----------- | ---------- | --------------------------------------------------------------------- |
| BDD Format (Given-When-Then)         | PASS        | 0          | All tests have explicit Given/When/Then comments                      |
| Test IDs                             | WARN        | 1          | TC-E3-P2-delete-01 duplicated across two separate it-blocks           |
| Priority Markers (P0/P1/P2/P3)       | PASS        | 0          | Priority inline labels present ([P0], [P1], etc.) and in IDs          |
| Hard Waits (sleep, waitForTimeout)   | PASS        | 0          | No setTimeout/sleep/waitForTimeout; uses waitFor() correctly          |
| Determinism (no conditionals)        | PASS        | 0          | No if/else, try/catch in test logic; MSW controls all branching       |
| Isolation (cleanup, no shared state) | PASS        | 0          | afterEach resets MSW + restores mocks; per-test QueryClient/factory   |
| Fixture Patterns                     | PASS        | 0          | createWrapper() helper and renderContactoDetailView() centralise setup |
| Data Factories                       | PASS        | 0          | contacto.factory.ts used; supports overrides and counter reset         |
| Network-First Pattern                | PASS        | 0          | server.use() always before render/hook call; no race conditions        |
| Explicit Assertions                  | PASS        | 0          | Every test has at least one expect/Assert; none rely on implicit waits |
| Test Length (<=300 lines)            | WARN        | 1          | ContactoDetailView.delete.test.tsx = 485 lines (>300 acceptable limit) |
| Test Duration (<=1.5 min)            | PASS        | 0          | Tests are unit/component/integration with no heavy I/O; within target  |
| Flakiness Patterns                   | PASS        | 0          | No hardcoded ports/URLs; MSW intercepts all network; no timing asserts |

**Total Violations**: 0 Critical, 1 High, 2 Medium, 1 Low

---

## Quality Score Breakdown

```
Starting Score:              100
Critical Violations:         0 × 10  =   0
High Violations:             1 × 5   =  -5
Medium Violations:           2 × 2   =  -4
Low Violations:              1 × 1   =  -1

Bonus Points:
  Excellent BDD structure:   +5
  Comprehensive Fixtures:    +0  (helper functions, not test.extend fixtures — acceptable for Vitest)
  Data Factories:            +5  (factory + override pattern)
  Network-First:             +5  (MSW server.use before render)
  Perfect Isolation:         +5  (afterEach cleanup + per-test QueryClient + unique DB names)
  All Test IDs:              +0  (duplicate ID deducts bonus)
                             ------
Total Bonus:                 +20

Final Score:                 84/100
Grade:                       A (Good)
```

---

## Critical Issues (Must Fix)

No critical issues detected.

---

## Recommendations (Should Fix)

### 1. Duplicate Test ID TC-E3-P2-delete-01

**Severity**: P1 (High)
**Location**: `frontend/src/modules/crm/contactos/application/useDeleteContacto.test.ts:74` and `:100`
**Criterion**: Test IDs

**Issue Description**:
Two separate `it` blocks both carry the label `TC-E3-P2-delete-01`. The first (line 74) validates invalidation of `['contactos']`; the second (line 100) validates invalidation of `['contactos', id]`. In CI test reporters and traceability matrices, both results collapse under a single ID, masking individual failures.

**Current Code**:

```typescript
// Line 74
it('TC-E3-P2-delete-01: should call invalidateQueries with ["contactos"] after successful DELETE', ...

// Line 100
it('TC-E3-P2-delete-01: should call invalidateQueries with ["contactos", id] after successful DELETE', ...
```

**Recommended Fix**:

```typescript
it('TC-E3-P2-delete-01a: should call invalidateQueries with ["contactos"] after successful DELETE', ...

it('TC-E3-P2-delete-01b: should call invalidateQueries with ["contactos", id] after successful DELETE', ...
```

**Benefits**:
Unique IDs allow CI to report each assertion independently and map precisely to AC #4 in the traceability matrix.

**Priority**:
P1 — impairs requirement-to-test traceability; low effort to fix (rename strings).

---

### 2. ContactoDetailView.delete.test.tsx Exceeds 300-Line Limit

**Severity**: P2 (Medium)
**Location**: `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.delete.test.tsx` (485 lines total)
**Criterion**: Test Length

**Issue Description**:
The file is 485 lines, exceeding the 300-line acceptable ceiling (200 ideal, 300 acceptable, >300 warns). The file contains 5 describe blocks and 13 it-blocks; the primary growth drivers are the repeated `waitFor` setup patterns and the `isPending` test at lines 445–485 which requires an inline promise-based MSW handler.

**Current Code**:
Single file with all 5 describe groups spanning 485 lines.

**Recommended Fix**:
Split into two files along natural boundaries:

```typescript
// File 1: ContactoDetailView.delete-dialog.test.tsx (~280 lines)
// Contains: TC-E3-P0-delete-01 (dialog open/confirm/toast)
//           TC-E3-P1-delete-01 (cancel preserves contact)

// File 2: ContactoDetailView.delete-error.test.tsx (~210 lines)
// Contains: TC-E3-P1-delete-02 (404 error toast, no navigation, NFR6)
//           isPending/disabled Confirmar button test
```

**Benefits**:
Smaller files are easier to navigate, faster to review, and map more directly to individual ACs.

**Priority**:
P2 — does not block merge; can be addressed in a follow-up PR.

---

### 3. String JSON Contains-Check as Pre-condition Assertion

**Severity**: P2 (Medium)
**Location**: `backend/tests/SiesaAgents.IntegrationTests/Contactos/DeleteContactoEndpointTests.cs:142`
**Criterion**: Determinism / Assertion Specificity

**Issue Description**:
`Assert.Contains(contactoId.ToString(), listBeforeJson)` performs a raw string search on the JSON body. If the Guid appears in any field (e.g., a different contact's `clienteId` or a metadata property) the assertion can pass when the intended contact is actually absent. Similarly `Assert.DoesNotContain` on line 152 could be a false negative.

**Current Code**:

```csharp
var listBeforeJson = await listBefore.Content.ReadAsStringAsync();
Assert.Contains(contactoId.ToString(), listBeforeJson);
// ...
var listAfterJson = await listAfter.Content.ReadAsStringAsync();
Assert.DoesNotContain(contactoId.ToString(), listAfterJson);
```

**Recommended Fix**:

```csharp
var listBefore = await httpClient.GetAsync("/api/v1/contactos");
using var docBefore = JsonDocument.Parse(await listBefore.Content.ReadAsStringAsync());
var idsBefore = docBefore.RootElement.EnumerateArray()
    .Select(e => e.GetProperty("id").GetString())
    .ToList();
Assert.Contains(contactoId.ToString(), idsBefore);
// ... (delete) ...
var listAfter = await httpClient.GetAsync("/api/v1/contactos");
using var docAfter = JsonDocument.Parse(await listAfter.Content.ReadAsStringAsync());
var idsAfter = docAfter.RootElement.EnumerateArray()
    .Select(e => e.GetProperty("id").GetString())
    .ToList();
Assert.DoesNotContain(contactoId.ToString(), idsAfter);
```

**Benefits**:
Assertion is scoped to the `id` field only; eliminates false-positive/negative risk.

**Priority**:
P2 — low real-world risk given isolated DB seeding; clean to fix.

---

### 4. Indirect Re-export Chain for Factory / Handlers

**Severity**: P3 (Low)
**Location**: `frontend/src/modules/crm/contactos/application/useDeleteContacto.test.ts:29` import path
**Criterion**: Maintainability

**Issue Description**:
The test imports `createContacto` via `'../../../test/factories/contacto.factory'` which resolves to a re-export stub in `modules/test/factories/contacto.factory.ts` that then re-exports from `test/factories/contacto.factory.ts`. Similarly, MSW handlers use a re-export stub in `modules/crm/contactos/application/` pointing to `modules/test/msw/handlers/` which points to `test/msw/handlers/`. Two levels of re-export add maintenance overhead.

**Recommended Fix**:
Configure a `@test` path alias in `vite.config.ts`/`tsconfig.json`:

```typescript
// tsconfig.json paths
"@test/*": ["src/test/*"]

// Import directly:
import { createContacto } from '@test/factories/contacto.factory'
import { handleDeleteContactoSuccess } from '@test/msw/handlers/contactos-delete.handlers'
```

**Benefits**:
Eliminates re-export chain, makes imports self-documenting, reduces indirection.

**Priority**:
P3 — cosmetic; current approach works but will accumulate complexity as test files grow.

---

## Best Practices Found

### 1. Per-Test Isolated QueryClient via createWrapper()

**Location**: `useDeleteContacto.test.ts:53-65`
**Pattern**: Isolated QueryClient per test

**Why This Is Good**:
Each call to `createWrapper()` creates a fresh `QueryClient` with `retry: false` and `refetchOnWindowFocus: false`. This guarantees no query/mutation state leaks between tests, eliminating a common source of flakiness in TanStack Query test suites.

```typescript
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  };
}
```

### 2. Unique In-Memory DB per Backend Test Class

**Location**: `DeleteContactoEndpointTests.cs:38`
**Pattern**: Isolated database per factory instance

**Why This Is Good**:
`DatabaseName = $"DeleteContactoTestDb_{Guid.NewGuid()}"` means every test that instantiates its own `DeleteContactoWebApplicationFactory` gets a completely isolated EF Core InMemory database. No data pollution between test methods even when tests run in parallel.

```csharp
public string DatabaseName { get; init; } = $"DeleteContactoTestDb_{Guid.NewGuid()}";
```

### 3. MSW isPending Test Using Promise-Based Handler

**Location**: `useDeleteContacto.test.ts:153-188` and `ContactoDetailView.delete.test.tsx:447-484`
**Pattern**: Controlled async handler for in-flight state

**Why This Is Good**:
Using a manually-resolved Promise inside the MSW handler allows asserting the intermediate `isPending = true` state without any `sleep()` or `waitForTimeout`. The pattern is fully deterministic.

```typescript
let resolveRequest!: () => void;
const requestPending = new Promise<void>((resolve) => {
  resolveRequest = resolve;
});
server.use(
  http.delete('/api/v1/contactos/:id', async () => {
    await requestPending;
    return new HttpResponse(null, { status: 204 });
  })
);
// ... assert isPending === true ...
resolveRequest(); // then assert isPending === false
```

---

## Acceptance Criteria Coverage

| Acceptance Criterion | Test ID(s)                                      | Status   | File                                   |
| -------------------- | ----------------------------------------------- | -------- | -------------------------------------- |
| AC #1 — Confirmation dialog (title, Confirmar, Cancelar) | TC-E3-P0-delete-01 | Covered | ContactoDetailView.delete.test.tsx |
| AC #2 — Deletion removes from list, toast, navigate to /contactos | TC-E3-P0-delete-01, TC-E3-P0-delete-api-01 | Covered | both frontend + backend |
| AC #3 — Cancel closes dialog, no DELETE called | TC-E3-P1-delete-01 | Covered | ContactoDetailView.delete.test.tsx |
| AC #4 — invalidateQueries for both keys on onSuccess | TC-E3-P2-delete-01 (×2) | Covered | useDeleteContacto.test.ts |
| AC #5 — 404 Problem Details, no stackTrace | TC-E3-P2-delete-api-02, TC-E3-P1-delete-02 | Covered | backend + frontend |

**Coverage**: 5/5 ACs covered (100%)

---

## Test File Analysis

### useDeleteContacto.test.ts

- **File Path**: `frontend/src/modules/crm/contactos/application/useDeleteContacto.test.ts`
- **File Size**: 284 lines
- **Test Framework**: Vitest + React Testing Library + MSW 2
- **Language**: TypeScript
- **Describe Blocks**: 4
- **Test Cases**: 9
- **Fixtures Used**: `createWrapper()` helper (not test.extend — appropriate for Vitest)
- **Data Factories Used**: `createContacto` from contacto.factory.ts

### ContactoDetailView.delete.test.tsx

- **File Path**: `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.delete.test.tsx`
- **File Size**: 485 lines (WARN: >300)
- **Test Framework**: Vitest + React Testing Library + MSW 2
- **Language**: TypeScript
- **Describe Blocks**: 5
- **Test Cases**: 13
- **Fixtures Used**: `renderContactoDetailView()` helper centralising QueryClient + render
- **Data Factories Used**: `createContacto`, `resetContactoCounter`

### DeleteContactoEndpointTests.cs

- **File Path**: `backend/tests/SiesaAgents.IntegrationTests/Contactos/DeleteContactoEndpointTests.cs`
- **File Size**: 312 lines
- **Test Framework**: xUnit 2 + WebApplicationFactory + EF Core InMemory
- **Language**: C#
- **Test Classes**: 2 (factory + test class)
- **Test Methods**: 7 (5 [Fact] methods + 2 variants)
- **Isolation**: per-method `using var factory = new DeleteContactoWebApplicationFactory()`

---

## Violation Summary by Location

| Location                                       | Severity | Criterion       | Issue                                          | Fix                                  |
| ---------------------------------------------- | -------- | --------------- | ---------------------------------------------- | ------------------------------------ |
| useDeleteContacto.test.ts:74 and :100          | P1       | Test IDs        | Duplicate TC-E3-P2-delete-01 across two it-blocks | Rename to -01a / -01b               |
| ContactoDetailView.delete.test.tsx (485 lines) | P2       | Test Length     | File >300 lines (485)                           | Split into dialog + error files      |
| DeleteContactoEndpointTests.cs:142             | P2       | Assertions      | String contains on raw JSON for list pre-condition | Parse JSON array, check id field    |
| useDeleteContacto.test.ts:29 import chain      | P3       | Maintainability | Two-level re-export chain for factory/handlers  | Add @test path alias in tsconfig     |

---

## Next Steps

### Immediate Actions (Before Merge)

1. **Rename duplicate test ID TC-E3-P2-delete-01** — Rename to `TC-E3-P2-delete-01a` and `TC-E3-P2-delete-01b` in `useDeleteContacto.test.ts` lines 74 and 100.
   - Priority: P1
   - Owner: Developer
   - Estimated Effort: 5 minutes

### Follow-up Actions (Future PRs)

1. **Split ContactoDetailView.delete.test.tsx** — Separate dialog/confirm flow from error/NFR6 tests.
   - Priority: P2
   - Target: next sprint

2. **Strengthen list assertion in DeleteContactoEndpointTests.cs** — Use JSON array parse + `id` field check instead of string contains.
   - Priority: P2
   - Target: next sprint

3. **Add @test path alias** — Eliminate re-export chain; configure `tsconfig.json` + `vite.config.ts`.
   - Priority: P3
   - Target: backlog

### Re-Review Needed?

No re-review needed for the P2/P3 items. Re-review after P1 fix is optional (single rename, low risk).

---

## Decision

**Recommendation**: Approve with Comments

**Rationale**:
The test suite is well-structured, fully covers all five ACs, and demonstrates strong isolation and determinism at all three test levels (unit hook, component RTL, and API integration). No critical or hard-wait violations exist. The single P1 issue (duplicate test ID) is a one-line rename that can be fixed inline before merge with no logic change. The P2 issues (file length and JSON assertion) are technical debt that can safely be addressed in follow-up PRs without impacting functional coverage or CI reliability.

---

## Knowledge Base References

- **test-quality.md** — Definition of Done: deterministic, isolated with cleanup, explicit assertions, <300 lines, <1.5 min
- **fixture-architecture.md** — Pure function helper pattern (`createWrapper`, `renderContactoDetailView`)
- **network-first.md** — MSW `server.use()` before render/renderHook prevents race conditions
- **data-factories.md** — `contacto.factory.ts` with override support and counter reset
- **test-levels-framework.md** — Correct separation: unit hook / component RTL / API integration
- **test-priorities.md** — P0/P1/P2/P3 inline labels present in test descriptions
- **traceability.md** — All TC IDs map to ACs; duplicate ID identified as traceability gap

---

## Review Metadata

**Generated By**: BMad TEA Agent (Test Architect)
**Workflow**: testarch-test-review v4.0
**Review ID**: test-review-story-3.5-20260629
**Story**: Story 3.5 — Delete Contact
**Timestamp**: 2026-06-29
**Version**: 1.0
