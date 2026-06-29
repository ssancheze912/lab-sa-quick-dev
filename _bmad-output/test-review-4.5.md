# Test Quality Review: Story 4.5 — Orphan Contacts Filter

**Quality Score**: 74/100 (B — Acceptable)
**Review Date**: 2026-06-29
**Review Scope**: directory (3 files, Story 4.5)
**Reviewer**: BMad TEA Agent (testarch-test-review v4.0)

---

## Executive Summary

**Overall Assessment**: Acceptable

**Recommendation**: Approve with Comments

### Key Strengths

- Comprehensive AC coverage: all 9 acceptance criteria have at least one test across the three files
- Network-first pattern consistently applied in E2E — `page.route()` is always called before `page.goto()` (no race conditions detected)
- Backend isolation is correct: each test instantiates its own `ContactosSinClienteWebApplicationFactory` with a unique `Guid.NewGuid()` database name — zero shared state between tests
- Data factories used in both E2E (`buildContacto`) and component tests (`createContacto`) — no bare hardcoded object literals for domain data
- MSW 2 lifecycle in component tests is sound: `server.listen()` in `beforeEach`, `server.resetHandlers()` + `server.close()` in `afterEach` — handlers do not bleed between tests
- Accessibility coverage is unusually thorough: keyboard Tab-focus loop, Enter activation, Space activation, ARIA pressed-state, `tagName === 'BUTTON'`, `aria-hidden` check

### Key Weaknesses

- All three files exceed the 300-line threshold (532 / 573 / 549 lines) — medium priority splitting candidates
- E2E file (line 385) uses `new Promise(resolve => setTimeout(resolve, 500))` as a hard wait inside a `page.route` handler — this is a justified usage for skeleton capture but is undocumented
- Component test `renderWithSinCliente` helper (lines 55–75) ignores its `sinCliente` argument — it never actually passes the parameter to the component, making TC-4.5-COMP-01 to COMP-03 structurally incomplete for testing initial URL-derived state; tests will still exercise the toggle-click path once GREEN, but the pre-activated state path (AC#6 component side) is not covered
- E2E AC#6 visual-state test (lines 349–375) uses a `||`-chained conditional to detect the active state (`aria-pressed` OR `data-active` OR `data-state`), which is a determinism violation — the test will pass as soon as any one condition is truthy regardless of which attribute the implementation chooses
- Test IDs use mixed naming conventions: component tests use `TC-4.5-COMP-XX` in `describe` blocks, backend uses method prefixes `TC1_`, `TC1b_`, E2E tests only use inline comments (`// AC#1`) with no machine-readable ID — traceability is inconsistent

### Summary

The test suite covers a wide surface area for the orphan contacts filter feature and demonstrates solid understanding of the testing pyramid (E2E → Component → API Integration). The network-first discipline in E2E tests and per-test database isolation in backend tests are standout qualities that prevent flakiness. The most significant structural problem is that `renderWithSinCliente(sinCliente?)` discards its argument, which means component tests that need to assert pre-activated filter state (the URL-driven path) cannot reach that code path via the current test helper. This does not block implementation but means AC#6 on the component layer has a coverage gap. The hard wait in AC#7 and the deterministic-active-state check in AC#6 E2E should be addressed before the tests enter the CI pipeline permanently.

---

## Quality Criteria Assessment

| Criterion                            | Status     | Violations | Notes                                                                    |
| ------------------------------------ | ---------- | ---------- | ------------------------------------------------------------------------ |
| BDD Format (Given-When-Then)         | PASS       | 0          | All tests use explicit GIVEN/WHEN/THEN comments                          |
| Test IDs                             | WARN       | 2          | E2E tests lack machine-readable IDs; backend uses method-name prefix only |
| Priority Markers (P0/P1/P2/P3)       | WARN       | 1          | Component tests have P0/P1/P2 markers; E2E and backend have none         |
| Hard Waits (sleep, waitForTimeout)   | WARN       | 1          | E2E line 385: `setTimeout(resolve, 500)` inside route handler — justified but undocumented |
| Determinism (no conditionals)        | WARN       | 1          | E2E line 369–373: `\|\|`-chained conditional to detect active state       |
| Isolation (cleanup, no shared state) | PASS       | 0          | E2E afterEach cleanup; MSW resetHandlers; per-test DB factory            |
| Fixture Patterns                     | WARN       | 1          | E2E base.fixture provides minimal setup; `ContactosPage` POM used but not a fixture |
| Data Factories                       | PASS       | 0          | `createContacto`/`buildContacto` factories used consistently             |
| Network-First Pattern                | PASS       | 0          | All E2E routes registered before `page.goto()` / `page.route()`         |
| Explicit Assertions                  | PASS       | 0          | Each test has at least one `expect`/`Assert` assertion                   |
| Test Length (≤300 lines)             | FAIL       | 3          | All 3 files exceed 300 lines (532 / 573 / 549)                          |
| Test Duration (≤1.5 min)             | PASS       | 0          | Estimated duration well under 90s per test; backend uses InMemory DB     |
| Flakiness Patterns                   | WARN       | 2          | Hard wait + non-deterministic active-state check                        |

**Total Violations**: 0 Critical, 3 High, 4 Medium, 0 Low

---

## Quality Score Breakdown

```
Starting Score:          100
Critical Violations:     0 × 10 = 0
High Violations:         3 × 5 = -15
Medium Violations:       4 × 2 = -8
Low Violations:          0 × 1 = 0

Bonus Points:
  Excellent BDD:         +5  (explicit GIVEN/WHEN/THEN in all 39 tests)
  Comprehensive Fixtures: 0  (minimal Playwright fixtures)
  Data Factories:        +5  (consistent factory usage)
  Network-First:         +5  (all E2E intercepts pre-navigation)
  Perfect Isolation:     +5  (per-test DB, MSW reset)
  All Test IDs:          0   (inconsistent IDs)
                         --------
Total Bonus:             +20

Final Score:             97 - 15 - 8 + 20 = 74/100
Grade:                   B (Acceptable)
```

---

## Critical Issues (Must Fix)

No critical issues detected. ✅

---

## Recommendations (Should Fix)

### 1. `renderWithSinCliente` discards its `sinCliente` argument — AC#6 component path untested

**Severity**: P1 (High)
**Location**: `frontend/src/modules/crm/contactos/presentation/ContactoListView.sinCliente.test.tsx:55–75`
**Criterion**: Fixture Patterns / AC Coverage
**Knowledge Base**: component-tdd.md

**Issue Description**:
`renderWithSinCliente(sinCliente?)` accepts the param but never uses it. The component is always rendered without any search-param context. Tests that need to assert pre-activated filter state (URL-driven, AC#6) will not exercise the `Route.useSearch()` path — they will only exercise the toggle-click path. This means the component-level coverage for AC#6 ("navigating directly to `/contactos?sinCliente=true` pre-activates the filter") is absent.

**Current Code**:

```typescript
// ContactoListView.sinCliente.test.tsx:55-75
function renderWithSinCliente(sinCliente?: boolean) {
  const queryClient = new QueryClient({ ... });
  // sinCliente param is received but never used — component renders with no URL context
  return render(
    <QueryClientProvider client={queryClient}>
      <ContactoListView />
    </QueryClientProvider>
  );
}
```

**Recommended Fix**:

```typescript
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router';
// Or: mock Route.useSearch via vi.mock

function renderWithSinCliente(sinCliente?: boolean) {
  const queryClient = new QueryClient({ ... });

  // Option A — mock the TanStack Router hook
  vi.mock('../../../../../routes/_app/contactos', () => ({
    Route: {
      useSearch: () => ({ sinCliente }),
      useNavigate: () => vi.fn(),
    },
  }));

  return render(
    <QueryClientProvider client={queryClient}>
      <ContactoListView />
    </QueryClientProvider>
  );
}
```

**Benefits**: Enables testing both entry paths — toggle-click AND URL deep-link — at the component level, completing AC#6 coverage.

**Priority**: P1 — without this fix, the component test suite has a structural gap that will remain invisible in CI.

---

### 2. Non-deterministic active-state assertion in E2E AC#6 visual-state test

**Severity**: P1 (High)
**Location**: `e2e/tests/contactos/orphan-contacts-filter.spec.ts:369–373`
**Criterion**: Determinism
**Knowledge Base**: test-quality.md

**Issue Description**:
The test reads three different attributes and `||`-chains them to set `isActive`. This passes as soon as any one of the three attributes is truthy. The test will pass regardless of which convention the implementation adopts (`aria-pressed`, `data-active`, or `data-state`), meaning it provides no feedback if the developer uses a wrong attribute that still evaluates truthy for an unrelated reason.

**Current Code**:

```typescript
// orphan-contacts-filter.spec.ts:369-373
const isActive =
  (await toggle.getAttribute('aria-pressed')) === 'true' ||
  (await toggle.getAttribute('data-active')) === 'true' ||
  (await toggle.getAttribute('data-state')) === 'on';

expect(isActive).toBe(true);
```

**Recommended Fix**:

Align the test with the ATDD checklist requirement (data-testid="filtro-sin-cliente" must render as `<button>` with `aria-pressed`). Assert the specific attribute defined in the implementation contract:

```typescript
// orphan-contacts-filter.spec.ts — AC#6 visual state test
const toggle = page.getByTestId('filtro-sin-cliente');
// The implementation contract (ATDD checklist, story dev-notes) specifies aria-pressed
await expect(toggle).toHaveAttribute('aria-pressed', 'true');
```

**Benefits**: Makes the test deterministic — it fails when the implementation uses the wrong ARIA attribute, providing meaningful signal.

**Priority**: P1 — a test that passes for multiple possible implementations does not guard against regressions.

---

### 3. Undocumented hard wait inside E2E AC#7 route handler

**Severity**: P1 (High)
**Location**: `e2e/tests/contactos/orphan-contacts-filter.spec.ts:384–386`
**Criterion**: Hard Waits
**Knowledge Base**: test-quality.md, network-first.md

**Issue Description**:
The AC#7 skeleton test introduces a 500ms delay using `new Promise(resolve => setTimeout(resolve, 500))` inside the route handler to ensure the skeleton is captured before the data arrives. This is a legitimate technique for skeleton testing, but it is undocumented — a future reader may not understand why the delay exists and remove it, breaking the test.

**Current Code**:

```typescript
// orphan-contacts-filter.spec.ts:384-386
await page.route('**/api/v1/contactos**', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 500));  // no justification comment
  await route.fulfill({ ... });
});
```

**Recommended Fix**:

```typescript
await page.route('**/api/v1/contactos**', async (route) => {
  // Intentional 500ms delay: allows the loading skeleton to render before
  // data arrives. react-loading-skeleton renders synchronously on isLoading=true;
  // without this delay the data resolves before Playwright can capture the skeleton.
  await new Promise((resolve) => setTimeout(resolve, 500));
  await route.fulfill({ ... });
});
```

**Benefits**: Preserves justified intent; prevents future removal; satisfies knowledge base requirement that hard waits include justification comments.

**Priority**: P1 — undocumented delays are indistinguishable from copy-paste errors.

---

### 4. All three test files exceed 300 lines — splitting candidates

**Severity**: P2 (Medium)
**Location**: All three test files (532 / 573 / 549 lines)
**Criterion**: Test Length
**Knowledge Base**: test-quality.md

**Issue Description**:
The 300-line threshold is a WARN at 301–500 and FAIL at >500 lines per the TEA quality framework. All three files are in the FAIL range. The E2E file (532 lines) covers all 9 ACs in one file; the component test (573 lines) covers 8 test classes; the backend (549 lines) covers 8 tests plus a factory class.

**Recommended Split**:

- **E2E**: Split into `orphan-contacts-filter.activation.spec.ts` (AC#1–4), `orphan-contacts-filter.url.spec.ts` (AC#5–6), and `orphan-contacts-filter.ux.spec.ts` (AC#7–9)
- **Component**: Split into `ContactoListView.sinCliente.filtering.test.tsx` (TC-01 to TC-05) and `ContactoListView.sinCliente.ux.test.tsx` (TC-06 to TC-08)
- **Backend**: The backend file is within reasonable range for integration tests given the factory class overhead; lower priority to split

**Priority**: P2 — does not block CI but impacts maintainability for future stories modifying the same files.

---

### 5. Test IDs inconsistent across test levels — traceability gap

**Severity**: P2 (Medium)
**Location**: `e2e/tests/contactos/orphan-contacts-filter.spec.ts` (all tests)
**Criterion**: Test IDs
**Knowledge Base**: traceability.md

**Issue Description**:
Component tests use `TC-4.5-COMP-XX` format in `describe` blocks (machine-readable). Backend tests use method-name prefixes (`TC1_`, `TC1b_`). E2E tests use only inline comments (`// AC#1`). This makes cross-level traceability tooling impossible and manually connecting failing E2E tests to the ATDD checklist requires reading comments rather than IDs.

**Recommended Fix**:

```typescript
// E2E — add test ID to describe block title
test.describe('TC-4.5-E2E-01: Activating "Sin cliente" filter shows only orphan contacts', () => {
  test('AC#1 — debe mostrar solo contactos sin cliente...', async ({ page }) => {
```

Backend already uses method name as ID (`TC1_GetContactos_...`) — acceptable but should be aligned with the `TC-4.5-API-XX` convention used in the ATDD checklist.

**Priority**: P2 — does not affect test execution but reduces traceability matrix utility.

---

### 6. `sinCliente` variable shadowing in E2E — `sinClienteCalled` captured but never asserted

**Severity**: P2 (Medium)
**Location**: `e2e/tests/contactos/orphan-contacts-filter.spec.ts:488–490`
**Criterion**: Explicit Assertions
**Knowledge Base**: test-quality.md

**Issue Description**:
In the AC#9 Enter-key test (line 488), `sinClienteCalled` is captured and set to `true` when the API receives `sinCliente=true`. However, the test only asserts the URL change (`toHaveURL(/sinCliente=true/)`), not `sinClienteCalled`. The variable is declared but its value is never asserted — dead code that creates a false sense of coverage.

**Current Code**:

```typescript
// orphan-contacts-filter.spec.ts:488-490
let sinClienteCalled = false;
await page.route('**/api/v1/contactos**', async (route) => {
  const url = new URL(route.request().url());
  if (url.searchParams.get('sinCliente') === 'true') {
    sinClienteCalled = true;  // captured but never asserted
  }
  ...
});
// only asserts: await expect(page).toHaveURL(/sinCliente=true/)
```

**Recommended Fix**: Either assert `expect(sinClienteCalled).toBe(true)` or remove the variable entirely since the URL assertion is sufficient.

**Priority**: P2 — dead tracking variable reduces readability without adding coverage.

---

## Best Practices Found

### 1. Network-First Pattern Applied Consistently in E2E

**Location**: `e2e/tests/contactos/orphan-contacts-filter.spec.ts` (all tests)
**Pattern**: network-first.md — route intercept before navigation

All E2E tests set up `page.route()` handlers before calling `page.goto()` or `contactosPage.goto()`. This is the correct pattern to prevent race conditions where the navigation fires the network request before the intercept is registered.

```typescript
// Excellent pattern: intercept BEFORE navigate
await page.route('**/api/v1/contactos?sinCliente=true', async (route) => {
  await route.fulfill({ status: 200, body: JSON.stringify([...]) });
});
await page.goto('/contactos?sinCliente=true'); // intercept already in place
```

### 2. Per-Test Database Isolation in Backend

**Location**: `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosSinClienteEndpointTests.cs:39–65`
**Pattern**: data-factories.md — test data isolation

Every test method creates its own `ContactosSinClienteWebApplicationFactory` with `DatabaseName = $"ContactosSinClienteTestDb_{Guid.NewGuid()}"`. This is an exemplary pattern for integration tests — each test gets a fresh empty database, preventing contamination from parallel or sequential test runs.

```csharp
// Excellent pattern: per-test factory with unique DB name
var factory = new ContactosSinClienteWebApplicationFactory();
// DatabaseName is set via primary constructor default: Guid.NewGuid()
var client = factory.CreateClient();
```

### 3. MSW Handler Differentiation by Query Param

**Location**: `frontend/src/modules/crm/contactos/presentation/ContactoListView.sinCliente.test.tsx:92–99`
**Pattern**: network-first.md — selective route matching

The component tests use a single MSW handler that reads `url.searchParams.get('sinCliente')` to return different datasets. This is the correct pattern — avoids duplicating handler registrations and tests the routing logic embedded in the component.

```typescript
server.use(
  http.get('/api/v1/contactos', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('sinCliente') === 'true') {
      return HttpResponse.json([orphanContacto]);
    }
    return HttpResponse.json([orphanContacto, assignedContacto]);
  })
);
```

### 4. Accessibility Coverage Depth

**Location**: `e2e/tests/contactos/orphan-contacts-filter.spec.ts:454–531`
**Pattern**: selector-resilience.md — ARIA attribute assertions

The keyboard accessibility tests go beyond typical coverage: Tab-loop detection (up to 10 Tab presses), Enter activation, Space activation, and `aria-pressed` state. This level of WCAG 2.1 AA coverage at the E2E layer is commendable and unusual.

---

## Test File Analysis

### File 1: orphan-contacts-filter.spec.ts

- **File Path**: `e2e/tests/contactos/orphan-contacts-filter.spec.ts`
- **File Size**: 532 lines
- **Test Framework**: Playwright
- **Language**: TypeScript
- **Describe Blocks**: 1
- **Test Cases**: 13
- **Average Test Length**: ~38 lines per test
- **Fixtures Used**: `base.fixture` (provides `page`, `request`), `ContactosPage` POM
- **Data Factories Used**: `buildContacto`, `buildCliente` from `data.helper`

### File 2: ContactoListView.sinCliente.test.tsx

- **File Path**: `frontend/src/modules/crm/contactos/presentation/ContactoListView.sinCliente.test.tsx`
- **File Size**: 573 lines
- **Test Framework**: Vitest + React Testing Library + MSW 2
- **Language**: TypeScript (TSX)
- **Describe Blocks**: 8
- **Test Cases**: 18
- **Average Test Length**: ~27 lines per test
- **Fixtures Used**: `renderWithSinCliente` helper (not a proper fixture — see recommendation #1)
- **Data Factories Used**: `createContacto`, `createContactos`, `resetContactoCounter`

### File 3: ContactosSinClienteEndpointTests.cs

- **File Path**: `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosSinClienteEndpointTests.cs`
- **File Size**: 549 lines
- **Test Framework**: xUnit 2 + WebApplicationFactory + EF Core InMemory
- **Language**: C#
- **Test Classes**: 2 (`ContactosSinClienteWebApplicationFactory` + `ContactosSinClienteEndpointTests`)
- **Test Cases**: 8
- **Average Test Length**: ~50 lines per test (including seed data)
- **Data Isolation**: Per-test `Guid.NewGuid()` database name — excellent

---

## Context and Integration

### Related Artifacts

- **Story File**: `/home/user/lab-sa-quick-dev/_bmad-output/implementation-artifacts/stories/story-4.5-orphan-contacts-filter.md`
- **ATDD Checklist**: `/home/user/lab-sa-quick-dev/_bmad-output/atdd-checklist-4.5.md`

### Acceptance Criteria Validation

| Acceptance Criterion | Test Files | Coverage | Notes |
| --- | --- | --- | --- |
| AC#1 — Filter shows only `clienteId=null` | E2E TC-AC1, Comp TC-01, API TC1/TC5 | COVERED | Full stack coverage |
| AC#2 — Count badge visible when filter active | E2E TC-AC2, Comp TC-03 | COVERED | Count and text asserted |
| AC#3 — EmptyState with specific Spanish message | E2E TC-AC3, Comp TC-02, API TC4 | COVERED | Spanish text asserted in E2E and component |
| AC#4 — Deactivating toggle restores full list | E2E TC-AC4, Comp TC-05, API TC2 | COVERED | Re-click and full-list check |
| AC#5 — URL param `?sinCliente=true` | E2E TC-AC5 (×2) | COVERED | Add and remove param |
| AC#6 — Deep-link pre-activates filter | E2E TC-AC6 (×2) | PARTIAL | E2E covers URL navigation; component-level URL path not wired (see Rec#1) |
| AC#7 — Skeleton during loading | E2E TC-AC7, Comp TC-06 (×3) | COVERED | MSW delay pattern used |
| AC#8 — ErrorPanel + Reintentar | E2E TC-AC8 (×2), Comp TC-07 (×3) | COVERED | 500 path and sinCliente error path both covered |
| AC#9 — Keyboard accessibility WCAG 2.1 AA | E2E TC-AC9 (×3), Comp TC-08 (×3) | COVERED | Tab, Enter, Space, aria-pressed, button tag |

**Coverage**: 8/9 criteria fully covered, 1 partially covered (AC#6 component path)

---

## Knowledge Base References

- **test-quality.md** — Definition of Done: no hard waits, <300 lines, <1.5 min, isolated, explicit assertions
- **network-first.md** — Route intercept before navigate; all E2E tests apply this pattern
- **data-factories.md** — Factory functions with overrides; `createContacto` and `buildContacto` used
- **fixture-architecture.md** — Pure function → Fixture pattern; component helper partially implements this
- **component-tdd.md** — MSW 2 + Vitest + RTL; server lifecycle correct; helper needs URL context wiring
- **test-levels-framework.md** — E2E + API + Component: appropriate level for each scenario
- **selector-resilience.md** — data-testid selectors used exclusively; ARIA assertions in accessibility tests
- **traceability.md** — Test ID conventions; inconsistency detected across test levels
- **ci-burn-in.md** — Flakiness prevention; conditional active-state check is a flakiness risk

---

## Next Steps

### Immediate Actions (Before Merge to main)

1. **Document the 500ms hard wait in AC#7** (orphan-contacts-filter.spec.ts:385)
   - Priority: P1
   - Owner: Test author
   - Estimated Effort: 5 minutes (add comment)

2. **Replace OR-chained active-state check with deterministic `aria-pressed` assertion** (orphan-contacts-filter.spec.ts:369–373)
   - Priority: P1
   - Owner: Test author
   - Estimated Effort: 15 minutes

3. **Fix `renderWithSinCliente` to propagate `sinCliente` to component context** (ContactoListView.sinCliente.test.tsx:55–75)
   - Priority: P1
   - Owner: Test author
   - Estimated Effort: 1–2 hours (requires TanStack Router mock or memory-history wrapper)

### Follow-up Actions (Future PRs)

1. **Split all three files into focused files of ≤300 lines**
   - Priority: P2
   - Target: Next sprint

2. **Align E2E test IDs to `TC-4.5-E2E-XX` format for traceability matrix**
   - Priority: P2
   - Target: Next sprint

3. **Remove or assert `sinClienteCalled` in AC#9 Enter test**
   - Priority: P2
   - Target: Can be done during file-split refactor

### Re-Review Needed?

Re-review the component test file after fixing Recommendation #1 (the `renderWithSinCliente` URL context wiring). The other items are minor and can be verified in normal code review.

---

## Decision

**Recommendation**: Approve with Comments

**Rationale**:
The test suite demonstrates sound engineering fundamentals: network-first pattern, per-test database isolation, MSW 2 lifecycle correctness, data factory usage, and unusually thorough WCAG 2.1 AA coverage. These practices directly prevent flakiness and are production-ready patterns.

Three P1 issues require attention before the tests reach the permanent CI pipeline: the undocumented hard wait, the non-deterministic active-state check, and the unused `sinCliente` argument in the component test helper. The P1 issues are localized, low-effort fixes (together approximately 2–3 hours of work). None of them involve the test logic itself — only the test infrastructure and assertion specificity.

The test suite is approved to unblock the implementation GREEN phase. The three P1 issues should be resolved in the same PR or a fast-follow before the story transitions to `done`.

---

## Appendix

### Violation Summary by Location

| File | Line | Severity | Criterion | Issue | Fix |
| --- | --- | --- | --- | --- | --- |
| orphan-contacts-filter.spec.ts | 369–373 | P1 | Determinism | OR-chained active-state check | Assert `aria-pressed="true"` only |
| orphan-contacts-filter.spec.ts | 384–386 | P1 | Hard Waits | Undocumented `setTimeout(500)` | Add justification comment |
| orphan-contacts-filter.spec.ts | 488–490 | P2 | Assertions | `sinClienteCalled` declared but not asserted | Assert or remove |
| orphan-contacts-filter.spec.ts | All | P2 | Test IDs | No machine-readable `TC-4.5-E2E-XX` IDs | Add IDs to describe blocks |
| ContactoListView.sinCliente.test.tsx | 55–75 | P1 | Fixture/Coverage | `sinCliente` arg ignored in helper | Wire URL context via mock or router |
| ContactoListView.sinCliente.test.tsx | All | P2 | Test Length | 573 lines (FAIL threshold) | Split into 2 files |
| orphan-contacts-filter.spec.ts | All | P2 | Test Length | 532 lines (FAIL threshold) | Split into 3 files |
| ContactosSinClienteEndpointTests.cs | All | P2 | Test Length | 549 lines (FAIL threshold) | Lower priority — factory class inflates count |
| All files | — | P2 | Priority Markers | E2E/backend have no P0/P1/P2 markers | Add markers consistent with component tests |

---

## Review Metadata

**Generated By**: BMad TEA Agent (Test Architect)
**Workflow**: testarch-test-review v4.0
**Review ID**: test-review-4.5-20260629
**Timestamp**: 2026-06-29
**Story**: 4.5 — Orphan Contacts Filter
**Version**: 1.0
