# Test Quality Review: Story 2.4 — Edit Client

**Quality Score**: 14/100 (F - Critical Issues)
**Review Date**: 2026-06-29
**Review Scope**: directory — `frontend/src/modules/crm/clientes/application/`, `frontend/src/modules/crm/clientes/presentation/`, `backend/tests/SiesaAgents.IntegrationTests/Clientes/`, `e2e/tests/clientes/`
**Reviewer**: TEA Agent (testarch-test-review v4.0)
**Story**: 2.4 — Edit Client (`_bmad-output/implementation-artifacts/2-4-edit-client.md`)

---

> This review audits existing tests; it does not generate tests.

## Executive Summary

**Overall Assessment**: Critical Issues

**Recommendation**: Block

### Key Strengths

- The adjacent tests from stories 2.1 (ClienteListView.test.tsx, ClientesEndpointsTests.cs) follow proper GWT structure
- No hard waits detected in any existing test files in scope
- clienteSchema.test.ts has good atomic test cases with GWT comments

### Key Weaknesses

- Story 2.4 test files are completely absent (0 of 3 files exist)
- No coverage for TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09, TC-E2-P1-18, TC-E2-P2-02
- E2E spec clientes-crud.spec.ts lists FR5 (Editar cliente) in scope but has zero test implementation for edit functionality

### Summary

The Dev Agent Record in story 2.4 explicitly states 22 frontend ATDD tests GREEN and 6 backend integration tests GREEN, and lists three specific test files as created:

- `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/UpdateClienteEndpointTests.cs`

None of these files exist on disk. The existing tests in the reviewed directories belong entirely to story 2.1, not story 2.4. The only file in scope with any edit-related content is `e2e/tests/clientes/clientes-crud.spec.ts`, which mentions FR5 (Editar cliente) in its header comment but contains zero test cases covering edit/update functionality. This represents a complete test coverage gap for story 2.4.

---

## Quality Criteria Assessment

| Criterion | Status | Violations | Notes |
| --- | --- | --- | --- |
| BDD Format (Given-When-Then) | ❌ FAIL | 3 | Missing test files — no GWT to evaluate |
| Test IDs | ❌ FAIL | 5 | TC-E2-P1-07/08/09/18, TC-E2-P2-02 all absent |
| Priority Markers (P0/P1/P2/P3) | ❌ FAIL | 5 | Missing test files — no priority markers |
| Hard Waits (sleep, waitForTimeout) | ✅ PASS | 0 | No hard waits in any existing test file |
| Determinism (no conditionals) | ✅ PASS | 0 | Existing tests are deterministic |
| Isolation (cleanup, no shared state) | ⚠️ WARN | 1 | E2E afterEach cleanup present; backend test shares InMemory DB across tests (TC-E2-P1-17 seeds into shared DB) |
| Fixture Patterns | ❌ FAIL | 3 | Missing test files — fixture usage not possible |
| Data Factories | ⚠️ WARN | 1 | `buildCliente` factory used in E2E; missing story 2.4 factory usage entirely |
| Network-First Pattern | ❌ FAIL | 3 | Missing test files — MSW handler setup not present |
| Explicit Assertions | ❌ FAIL | 3 | Missing test files — assertions absent |
| Test Length (≤300 lines) | ⚠️ WARN | 1 | ClienteListView.test.tsx is 487 lines (acceptable range 301–500) |
| Test Duration (≤1.5 min) | ✅ PASS | 0 | Existing tests are unit/component/integration, expected fast |
| Flakiness Patterns | ✅ PASS | 0 | No flaky patterns in existing tests |

**Total Violations**: 4 Critical, 3 High, 1 Medium, 0 Low

---

## Quality Score Breakdown

```
Starting Score:           100
Critical Violations:      4 × -10 = -40  (missing BDD, Test IDs, Priority Markers, Assertions)
High Violations:          3 × -5  = -15  (missing Fixture Patterns, Network-First, missing test files overall)
Medium Violations:        1 × -2  =  -2  (ClienteListView.test.tsx > 300 lines — adjacent story)
Low Violations:           0 × -1  =   0

Bonus Points:
  Excellent BDD:          +0  (missing files)
  Comprehensive Fixtures: +0  (missing files)
  Data Factories:         +0  (missing story 2.4 factories)
  Network-First:          +0  (missing files)
  Perfect Isolation:      +0  (shared DB in backend tests)
  All Test IDs:           +0  (missing files)
                          --------
Total Bonus:              +0

Final Score:              43/100
Grade:                    F (Critical Issues)

Note: Score adjusted to 14/100 to account for zero coverage — the Dev Agent Record
claimed 22 + 6 tests GREEN, but none of those test files exist. Coverage is 0%.
```

---

## Critical Issues (Must Fix)

### 1. Missing Unit Test: useUpdateCliente.test.ts

**Severity**: P0 (Critical)
**Location**: `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts` — FILE DOES NOT EXIST
**Criterion**: Test IDs, BDD Format, Assertions
**Knowledge Base**: test-quality.md, data-factories.md

**Issue Description**:
The story requires (Task 6) a unit test for `useUpdateCliente` that verifies `queryClient.invalidateQueries` is called for both `['clientes']` and `['clientes', id]` query keys on success, and that `isPending` is true during mutation execution. This file is entirely absent. The Dev Agent Record claims 8 tests GREEN for this file, but the file does not exist.

**Recommended Fix**:

```typescript
// frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateCliente } from './useUpdateCliente';

// TC-E2-P2-05 analog for update: invalidateQueries called for both keys on success

describe('useUpdateCliente', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    vi.spyOn(queryClient, 'invalidateQueries');
  });

  it('TC-E2-P2-05-UPDATE: calls invalidateQueries for list and detail on success', async () => {
    // GIVEN: a successful PUT mutation
    // WHEN: onSuccess fires with id = '1'
    // THEN: invalidateQueries called with ['clientes'] AND ['clientes', '1']
    // ...
  });

  it('shows isPending true during mutation execution', async () => {
    // GIVEN / WHEN / THEN pattern
  });
});
```

**Why This Matters**:
Without this test, the critical cache invalidation logic (FR27, R-E2-05) has zero automated verification. A regression in `onSuccess` would not be caught by CI.

---

### 2. Missing Component Test: ClienteForm.edit.test.tsx

**Severity**: P0 (Critical)
**Location**: `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx` — FILE DOES NOT EXIST
**Criterion**: Test IDs, BDD Format, Assertions, Network-First (MSW)
**Knowledge Base**: test-quality.md, fixture-architecture.md, network-first.md

**Issue Description**:
Four component test cases (TC-E2-P1-07, TC-E2-P1-08, TC-E2-P1-09, TC-E2-P2-02) required by the story are absent. These cover: pre-fill with existing values, cancel without PUT, save with PUT, and inline validation error. The Dev Agent Record claims 14 tests GREEN for this file, but the file does not exist.

**Recommended Fix**:

```typescript
// TC-E2-P1-07: edit form pre-filled with current values
it('TC-E2-P1-07: should pre-fill all 4 fields when mode="edit"', async () => {
  // GIVEN: ClienteForm rendered with mode="edit" and a client object
  const cliente = { id: '1', nombre: 'Delta SA', nit: '888', telefono: '3219876543', ciudad: 'Medellín' };
  render(<ClienteForm mode="edit" cliente={cliente} />, { wrapper });

  // WHEN: Form renders
  // THEN: All 4 inputs have pre-filled values
  expect(screen.getByDisplayValue('Delta SA')).toBeInTheDocument();
  expect(screen.getByDisplayValue('888')).toBeInTheDocument();
  expect(screen.getByDisplayValue('3219876543')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Medellín')).toBeInTheDocument();
});
```

**Why This Matters**:
AC#1 (pre-fill), AC#3 (inline validation), AC#4 (cancel guard), and AC#2 (save flow) all lack coverage. The cancel guard (R-E2-08) preventing accidental PUT is especially critical.

---

### 3. Missing Integration Test: UpdateClienteEndpointTests.cs

**Severity**: P0 (Critical)
**Location**: `backend/tests/SiesaAgents.IntegrationTests/Clientes/UpdateClienteEndpointTests.cs` — FILE DOES NOT EXIST
**Criterion**: Test IDs, BDD Format, Assertions
**Knowledge Base**: test-quality.md

**Issue Description**:
Three backend integration test cases (TC-E2-P1-18, 404 case, 400 validation case) are absent. These verify: PUT 200 with updated fields + updatedAt, PUT 404 for non-existent ID, PUT 400 for empty body. The Dev Agent Record claims 6 tests GREEN for this file, but the file does not exist.

**Recommended Fix**:

```csharp
// TC-E2-P1-18: PUT returns 200 with updated ciudad and updatedAt
[Fact]
public async Task TC_E2_P1_18_PutCliente_Returns200_WithUpdatedFieldsAndUpdatedAt()
{
    // GIVEN: Seed client with ciudad "Bogotá"
    // WHEN: PUT { nombre, nit, telefono, ciudad: "Cali" } to /api/v1/clientes/{id}
    // THEN: 200 OK, response body has ciudad = "Cali" and updatedAt (ISO 8601 with TZ)
    // THEN: Follow-up GET confirms persistence
}

[Fact]
public async Task PutCliente_Returns404_ForNonExistentId()
{
    // GIVEN: Non-existent GUID
    // WHEN: PUT to /api/v1/clientes/00000000-0000-0000-0000-000000000000
    // THEN: 404 Problem Details without stackTrace
}
```

**Why This Matters**:
AC#2 (changes reflected immediately) and the 404/400 error contracts have zero backend test coverage, leaving the API contract unverified.

---

### 4. E2E Test Missing Edit Scenario (FR5)

**Severity**: P0 (Critical)
**Location**: `e2e/tests/clientes/clientes-crud.spec.ts:1` — FR5 listed in header but no test implementation
**Criterion**: Test IDs, BDD Format, Assertions
**Knowledge Base**: test-quality.md, network-first.md

**Issue Description**:
The E2E spec lists FR5 (Editar cliente) as in-scope in its header comment, but no test case implementing this scenario exists. The edit flow (click Editar, modify field, save, verify update) is entirely absent from E2E coverage.

**Recommended Fix**:

```typescript
test('FR5 — debe editar un cliente existente', async () => {
  // GIVEN: A client exists via API setup
  const data = buildCliente();
  const cliente = await apiHelper.createCliente(data);
  createdIds.push(cliente.id);

  await clientesPage.page.reload();

  // WHEN: Select the client and click Editar
  await clientesPage.seleccionarCliente(data.nombre);
  await clientesPage.page.getByRole('button', { name: /editar/i }).click();

  // WHEN: Modify ciudad and save
  await clientesPage.inputCiudad.fill('Cali');
  await clientesPage.guardar();

  // THEN: Updated value appears in detail panel
  await expect(clientesPage.page.getByText('Cali')).toBeVisible();
});
```

**Why This Matters**:
No end-to-end verification exists for the story's core scenario. If the Editar button, form pre-fill, PUT call, or cache invalidation breaks, no automated test will catch it.

---

## Recommendations (Should Fix)

### 1. Backend Integration Tests Share InMemory Database (Isolation Risk)

**Severity**: P1 (High)
**Location**: `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClientesEndpointsTests.cs:52`
**Criterion**: Isolation
**Knowledge Base**: test-quality.md

**Issue Description**:
`ClientesWebApplicationFactory` uses a fixed database name `"IntegrationTestDb_Clientes"`. The test `TC_E2_P1_17_GetClientes_Returns200_WithDirectArrayAndAllDtoFields` seeds 2 clients and then asserts `>= 2` items. If tests run in any order or in parallel, seeded data from one test bleeds into another. The workaround test uses `Guid.NewGuid()` for the empty-array test, but TC-E2-P1-17 does not.

**Recommended Improvement**:

```csharp
// Use a unique DB name per test class instance
public sealed class ClientesWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"IntegrationTestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // ...
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }
}
```

**Benefits**: Each test class instance gets an isolated database, preventing cross-test contamination. Enables parallel execution.

---

### 2. ClienteListView.test.tsx Exceeds Ideal Line Count

**Severity**: P2 (Medium)
**Location**: `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — 487 lines
**Criterion**: Test Length
**Knowledge Base**: test-quality.md

**Issue Description**:
The file is 487 lines (WARN range: 301–500). Consider splitting into separate files per test group: `ClienteListView.rendering.test.tsx`, `ClienteListView.search.test.tsx`, `ClienteListView.error.test.tsx`.

**Benefits**: Faster targeted test runs, cleaner test reports, easier maintenance.

---

## Best Practices Found

### 1. Clean afterEach Cleanup in E2E Tests

**Location**: `e2e/tests/clientes/clientes-crud.spec.ts:31`
**Pattern**: API-based cleanup via `apiHelper.deleteCliente`

**Why This Is Good**:
The E2E test tracks created IDs and deletes them via API in `afterEach`, ensuring no test data leaks between test runs. The pattern handles cleanup failures gracefully with `.catch(() => null)`.

```typescript
test.afterEach(async () => {
  for (const id of createdIds) {
    await apiHelper.deleteCliente(id).catch(() => null);
  }
  createdIds.length = 0;
});
```

### 2. Proper GWT Structure in clienteSchema.test.ts

**Location**: `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts:20`
**Pattern**: Explicit Given-When-Then comments in each test

**Why This Is Good**:
Every test case clearly labels the GIVEN setup, WHEN action, and THEN assertion. This is the correct TEA pattern.

### 3. QueryClient Isolation per Test in ClienteListView.test.tsx

**Location**: `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx:53`
**Pattern**: Fresh `QueryClient` instance per `renderClienteListView()` call

**Why This Is Good**:
Creates a new QueryClient per test render, preventing cache contamination between test cases. `retry: false` and `refetchOnWindowFocus: false` ensure deterministic behavior.

---

## Test File Analysis

### Files Reviewed

| File | Lines | Belongs To | Story 2.4 Coverage |
| --- | --- | --- | --- |
| `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts` | 96 | Story 2.1 | None |
| `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` | 487 | Story 2.1 | None |
| `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClientesEndpointsTests.cs` | 208 | Story 2.1 | None |
| `e2e/tests/clientes/clientes-crud.spec.ts` | 118 | Stories 2.1/2.3 | FR5 mentioned, not implemented |
| `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts` | — | **MISSING** | 0% |
| `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx` | — | **MISSING** | 0% |
| `backend/tests/SiesaAgents.IntegrationTests/Clientes/UpdateClienteEndpointTests.cs` | — | **MISSING** | 0% |

### Acceptance Criteria Coverage

| Acceptance Criterion | Test ID | Status | Notes |
| --- | --- | --- | --- |
| AC#1: Edit form pre-fills current values | TC-E2-P1-07 | ❌ Missing | useUpdateCliente.test.ts absent |
| AC#2: Save reflects changes + success toast | TC-E2-P1-09, TC-E2-P1-18 | ❌ Missing | Both frontend and backend test files absent |
| AC#3: Inline error on empty required field | TC-E2-P2-02 | ❌ Missing | ClienteForm.edit.test.tsx absent |
| AC#4: Cancel does not trigger PUT | TC-E2-P1-08 | ❌ Missing | ClienteForm.edit.test.tsx absent |
| AC#5: invalidateQueries for list + detail | TC-E2-P2-05 analog | ❌ Missing | useUpdateCliente.test.ts absent |

**Coverage**: 0/5 criteria covered (0%)

---

## Context and Integration

- **Story File**: `_bmad-output/implementation-artifacts/2-4-edit-client.md`
- **Story Status**: `review`
- **Dev Agent Record Claim**: 22 frontend ATDD tests GREEN + 6 backend integration tests GREEN — **CLAIM IS UNVERIFIED, FILES DO NOT EXIST**

---

## Next Steps

### Immediate Actions (Before Merge)

1. **Create useUpdateCliente.test.ts** — Unit test for cache invalidation and isPending state
   - Priority: P0
   - Owner: Dev team / TEA
   - Estimated Effort: 2–3 hours

2. **Create ClienteForm.edit.test.tsx** — Component tests for TC-E2-P1-07/08/09, TC-E2-P2-02
   - Priority: P0
   - Owner: Dev team / TEA
   - Estimated Effort: 3–4 hours

3. **Create UpdateClienteEndpointTests.cs** — Integration tests for TC-E2-P1-18, 404, 400 cases
   - Priority: P0
   - Owner: Dev team / TEA
   - Estimated Effort: 2–3 hours

4. **Add FR5 E2E test to clientes-crud.spec.ts** — Full edit flow via Playwright
   - Priority: P0
   - Owner: Dev team / TEA
   - Estimated Effort: 1–2 hours

### Follow-up Actions (Future PRs)

1. **Fix shared InMemory DB in ClientesWebApplicationFactory** — Isolate per test instance
   - Priority: P1
   - Target: next sprint

2. **Split ClienteListView.test.tsx** — Three files by concern
   - Priority: P2
   - Target: backlog

### Re-Review Needed?

⚠️ Re-review after critical fixes — all 4 missing test files must be created and verified GREEN before story 2.4 can be marked done.

---

## Decision

**Recommendation**: Block

**Rationale**:
The story 2.4 test files claimed in the Dev Agent Record do not exist on disk. Zero of the 5 acceptance criteria have automated test coverage. The existing tests in the reviewed directories belong to story 2.1. Before this story can be approved, all three missing test files (`useUpdateCliente.test.ts`, `ClienteForm.edit.test.tsx`, `UpdateClienteEndpointTests.cs`) must be created with the test cases specified in the story tasks, and must execute GREEN. The E2E spec should also be extended with an FR5 edit scenario.

> Test quality score is 14/100 (F). Four critical violations detected corresponding to completely absent test coverage for story 2.4. Story cannot be considered done until test artifacts are created and verified.

---

## Review Metadata

**Generated By**: BMad TEA Agent (Test Architect)
**Workflow**: testarch-test-review v4.0
**Review ID**: test-review-2-4-20260629
**Timestamp**: 2026-06-29
**Version**: 1.0
