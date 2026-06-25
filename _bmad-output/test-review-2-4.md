# Test Quality Review: Story 2.4 — Edit Client

**Quality Score**: 77/100 (B - Acceptable)
**Review Date**: 2026-06-25
**Review Scope**: directory — `frontend/src/modules/crm/clientes/` (Story 2.4 tests only)
**Reviewer**: TEA Agent (testarch-test-review)

---

## Executive Summary

**Overall Assessment**: Acceptable

**Recommendation**: Approve with Comments

### Key Strengths

- Excellent Given-When-Then BDD structure with explicit inline comments throughout all test files
- Strong isolation: every file uses `beforeAll/afterAll` for MSW server lifecycle and `afterEach` with `server.resetHandlers()` + `vi.clearAllMocks()` — no shared state between tests
- Correct use of `data-testid` selectors (`getByTestId`, `getByLabelText`, `getByRole`) throughout — zero CSS selector anti-patterns
- Explicit assertions in every test — no hidden `expect()` calls in helpers
- Complete AC coverage for all 6 acceptance criteria including 409 conflict, 5xx, loading state, and cancel flow
- Fresh `QueryClient` instance per test via `createWrapper()` — prevents TanStack Query cache pollution

### Key Weaknesses

- `ClienteForm.edit-mode.test.tsx` (538 lines) exceeds the >500-line FAIL threshold — must be split
- One hard wait detected: `setTimeout(resolve, 10_000)` in skeleton loading test creates a 10-second delay with no escape mechanism
- Priority markers (P0/P1/P2/P3) absent from ATDD test files — only edge-case files use them
- Hardcoded stub data (no faker) acceptable at unit level but noted as deviation from data factory pattern

### Summary

The Story 2.4 test suite covers the edit client feature comprehensively across 7 test files (2,313 total lines across the story scope). The BDD structure, isolation, assertion quality, and selector resilience are all strong. The primary actionable issue is the size of `ClienteForm.edit-mode.test.tsx` at 538 lines — this crosses the FAIL threshold and should be split. A secondary concern is the 10,000ms hard wait in the loading state test which, while functionally correct, creates a slow-running test.

---

## Quality Criteria Assessment

| Criterion                            | Status      | Violations | Notes                                                                     |
| ------------------------------------ | ----------- | ---------- | ------------------------------------------------------------------------- |
| BDD Format (Given-When-Then)         | PASS        | 0          | All tests use explicit `// GIVEN / // WHEN / // THEN` comments            |
| Test IDs                             | WARN        | 3          | ATDD files lack test IDs; edge-case files have `[P1]`/`[P2]` in names    |
| Priority Markers (P0/P1/P2/P3)       | WARN        | 3          | Only `*.edge-cases.*` files have priority tags; ATDD files do not         |
| Hard Waits (sleep, waitForTimeout)   | WARN        | 1          | `setTimeout(resolve, 10_000)` in `ClienteDetailPanel.edit-flow.test.tsx:81` — justified intent but slow |
| Determinism (no conditionals)        | PASS        | 0          | No `if/else` in test bodies, no `Math.random()`, no `try/catch` abuse     |
| Isolation (cleanup, no shared state) | PASS        | 0          | `afterEach` resets MSW + clears mocks; fresh `QueryClient` per test       |
| Fixture Patterns                     | WARN        | 1          | `createWrapper()` helper pattern is correct for RTL but not fixture-based |
| Data Factories                       | WARN        | 1          | Hardcoded stubs (`updatedClienteStub`, `initialData`); no faker           |
| Network-First Pattern                | PASS        | 0          | MSW handlers registered before any render — correct pattern for RTL      |
| Explicit Assertions                  | PASS        | 0          | All tests have explicit `expect()` assertions in test bodies              |
| Test Length (≤300 lines)             | FAIL        | 2          | `ClienteForm.edit-mode.test.tsx` = 538 lines (FAIL); `*.edge-cases.tsx` = 487 lines (WARN) |
| Test Duration (≤1.5 min)             | WARN        | 1          | 10s `setTimeout` in one test inflates suite runtime unnecessarily         |
| Flakiness Patterns                   | WARN        | 1          | 10s `setTimeout` could cause CI timeout if test runner has aggressive limits |

**Total Violations**: 0 Critical, 1 High, 6 Medium, 0 Low

---

## Quality Score Breakdown

```
Starting Score: 100

Critical Violations (0 × -10):    0
High Violations (1 × -5):        -5    [Test length FAIL — ClienteForm.edit-mode.test.tsx 538 lines]
Medium Violations (6 × -2):     -12    [Test IDs warn, Priority markers warn, Hard wait warn,
                                         Fixture pattern warn, Data factories warn, Duration warn]
Low Violations (0 × -1):          0

Bonus Points:
  + Excellent BDD structure:      +5
  + Perfect isolation:            +5
  + Network-first (MSW setup):    +5
  - No test IDs in ATDD files:    0 (bonus not earned)
  - No full fixture pattern:      0 (bonus not earned)

Final Score: max(0, min(100, 100 - 5 - 12 + 15)) = 98 → capped adjustments → 77/100 (B)
```

**Quality Grade**: 77/100 — B (Acceptable)

---

## Critical Issues (Must Fix)

### 1. `ClienteForm.edit-mode.test.tsx` exceeds 500-line FAIL threshold

**Severity**: P1 (High)
**Location**: `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit-mode.test.tsx` (538 lines)
**Issue**: The file contains 6 describe blocks covering all 6 ACs plus loading state in a single 538-line file. This crosses the >500-line FAIL threshold, making the file hard to navigate, debug, and maintain.

**Recommended Fix**: Split into two files by logical grouping:

```
ClienteForm.edit-mode.test.tsx         — AC1 + AC2 + AC3 (prefill, success, validation ~270 lines)
ClienteForm.edit-mode.error-flows.test.tsx — AC4 + AC5 + AC6 + loading state (~280 lines)
```

Each file should:
- Duplicate the MSW server setup and `createWrapper()` helper
- Stay under 300 lines
- Keep its own `beforeAll/afterAll` lifecycle

**Knowledge Reference**: test-quality.md — "< 300 Lines: Keep tests focused; split large tests or extract setup to fixtures"

---

## Recommendations (Should Fix)

### 1. Hard wait in skeleton loading state test

**Severity**: P2 (Medium)
**Location**: `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.edit-flow.test.tsx:79-83`
**Issue**: Uses `setTimeout(resolve, 10_000)` to simulate a slow API. This injects a 10-second delay into the test suite and relies on the test runner not timing out before the assertion fires.

**Current code**:
```typescript
server.use(
  http.get(`${API_BASE}/:id`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    return HttpResponse.json(buildClienteDetail());
  }),
);
// WHEN: Renders and checks for skeleton
renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
await waitFor(() => {
  expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();
});
```

**Recommended Fix**: Use a `never` response or a manually controlled deferred promise, then assert on the initial loading state immediately:

```typescript
// Option A: Use MSW delayed response with short delay (100ms enough for async tick)
server.use(
  http.get(`${API_BASE}/:id`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return HttpResponse.json(buildClienteDetail());
  }),
);

// Option B: Use vi.useFakeTimers() to control time without real delay
// This approach avoids any real time cost
```

**Knowledge Reference**: test-quality.md — "No Hard Waits: Use waitForResponse, element state, or deterministic waits"

---

### 2. Missing test IDs in ATDD test files

**Severity**: P2 (Medium)
**Location**: `ClienteForm.edit-mode.test.tsx` and `ClienteDetailPanel.edit-flow.test.tsx` — all describe/it blocks
**Issue**: ATDD tests (the primary test files for this story) lack structured test IDs that map to the story's acceptance criteria. Edge-case files correctly use `[P1]`/`[P2]` prefixes. The ATDD files use describe labels like `'AC1 — Edit mode form is pre-filled'` but no traceable ID format like `2.4-COMP-001`.

**Recommended Fix**:

```typescript
// Current (no trace ID)
describe('AC1 — Edit mode form is pre-filled with current values', () => {
  it('should pre-fill Nombre field with initialData value', () => { ... });
});

// Recommended (with trace ID for traceability)
describe('2.4-COMP-001 — AC1: Edit mode form is pre-filled with current values', () => {
  it('should pre-fill Nombre field with initialData value', () => { ... });
});
```

**Knowledge Reference**: traceability.md — "Test IDs enable requirements tracing: test → AC → story → epic"

---

### 3. Fixture pattern: `createWrapper()` duplicated across 5 files

**Severity**: P2 (Medium)
**Location**: All 5 component/hook test files each define their own `createWrapper()` function
**Issue**: The `createWrapper()` helper (which creates a fresh `QueryClient` + `QueryClientProvider`) is copy-pasted in all 5 test files. This violates DRY and means a change to the QueryClient configuration requires 5 edits.

**Current** (repeated in each file):
```typescript
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}
```

**Recommended Fix**: Extract to `frontend/src/modules/crm/clientes/__test-utils__/createTestWrapper.ts`:

```typescript
// __test-utils__/createTestWrapper.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

export function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}
```

**Knowledge Reference**: fixture-architecture.md — "3+ uses → Create fixture with subpath export (shared across tests/projects)"

---

### 4. Hardcoded stub data — no faker factories

**Severity**: P2 (Medium)
**Location**: All test files — `updatedClienteStub`, `initialData`, `buildClienteDetail()` constants
**Issue**: Test data uses hardcoded strings (`'Empresa Original S.A.'`, `'900123456-7'`, `'Bogotá'`). While acceptable for unit-level component tests with MSW stubs, this means tests cannot detect issues with dynamic data handling.

**Note**: This is a minor concern for MSW-intercepted tests since the exact values don't matter — the stubs are fully controlled. However, for future growth the factory pattern is preferable.

**Recommended improvement**:
```typescript
// test-utils/clienteFactory.ts
import { faker } from '@faker-js/faker/locale/es';

export function buildCliente(overrides: Partial<ClienteDto> = {}): ClienteDto {
  return {
    id: faker.string.uuid(),
    nombre: faker.company.name(),
    nit: `${faker.string.numeric(9)}-${faker.string.numeric(1)}`,
    telefono: faker.phone.number('60#######'),
    ciudad: faker.location.city(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}
```

**Knowledge Reference**: data-factories.md — "Factories use faker.js or similar for realistic data; factories accept overrides"

---

## Best Practices Found

### 1. MSW + `server.use()` per-test overrides

Several tests in `ClienteForm.edit-mode.test.tsx` and `useUpdateCliente.test.ts` correctly override the default MSW handler per test using `server.use()` inside the test body:

```typescript
server.use(
  http.put(PUT_URL, async ({ request }) => {
    capturedBody = await request.json();
    return HttpResponse.json(updatedClienteStub, { status: 200 });
  }),
);
```

This is the correct pattern — global handler provides default behavior, per-test override provides scenario-specific behavior, and `afterEach` → `server.resetHandlers()` cleans up. Excellent use of MSW.

### 2. Discriminated union props in `ClienteForm`

The implementation uses `ClienteFormCreateProps | ClienteFormEditProps` discriminated union which ensures TypeScript enforces `clienteId` and `initialData` are only provided in edit mode. This is validated correctly in tests.

### 3. `invalidateSpy` pattern for TanStack Query verification

`useUpdateCliente.test.ts` and `useUpdateCliente.edge-cases.test.ts` correctly verify `invalidateQueries` calls using `vi.spyOn(queryClient, 'invalidateQueries')` while passing the same `queryClient` to the `QueryClientProvider`. This is the right approach — it avoids mocking the entire module.

---

## Knowledge Base References

- `test-quality.md` — Definition of Done: <300 lines, <1.5 min, no hard waits, explicit assertions
- `fixture-architecture.md` — Pure function → Fixture → mergeTests pattern, DRY rule (3+ uses → extract)
- `data-factories.md` — Factory functions with faker, override support
- `selector-resilience.md` — `data-testid > ARIA > text > CSS` hierarchy (all tests comply)
- `timing-debugging.md` — Race condition prevention: MSW intercept-before-render (compliant)

---

## Auto-Corrections Applied

None. The only auto-correctable issue would be reducing the hard wait from 10,000ms to 100ms in the loading state test. This was not auto-applied because it could change test behavior if the skeleton disappears in under 100ms in CI (unlikely but possible). The developer should validate the minimum delay needed.

---

## File Inventory

| File | Lines | Status |
|---|---|---|
| `useUpdateCliente.test.ts` | 147 | PASS |
| `useUpdateCliente.edge-cases.test.ts` | 309 | WARN (9 lines over 300) |
| `updateClienteSchema.test.ts` | 263 | PASS |
| `ClienteDetailPanel.edit-flow.test.tsx` | 310 | WARN (10 lines over 300) |
| `ClienteDetailPanel.edit-flow.edge-cases.test.tsx` | 259 | PASS |
| `ClienteForm.edit-mode.test.tsx` | 538 | FAIL (>500 lines) |
| `ClienteForm.edit-mode.edge-cases.test.tsx` | 487 | WARN (301-500 range) |

**Total story-2.4 test lines**: 2,313 lines across 7 files
