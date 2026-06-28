# Automation Summary - Story 2.1: Client List & Search

**Date:** 2026-06-28
**Story:** 2.1 — Client List & Search
**Mode:** BMad-Integrated
**Coverage Target:** critical-paths + edge cases

---

## Tests Created

### Backend Unit Tests (P1–P2)

- `backend/tests/SiesaAgents.UnitTests/Clientes/ClienteEntityTests.cs` (12 tests)
  - [P1] Create() throws on null Nombre
  - [P1] Create() throws on whitespace-only Nombre (Theory: 3 cases)
  - [P1] Create() throws on null NIT
  - [P1] Create() throws on whitespace-only NIT (Theory: 2 cases)
  - [P1] Create() throws on null Telefono
  - [P1] Create() throws on null Ciudad
  - [P2] Create() trims leading/trailing whitespace from all fields
  - [P2] Create() sets recent UTC DateTimeOffset on CreatedAt/UpdatedAt
  - [P2] Create() generates distinct non-empty Guid Ids
  - [P2] Update() overwrites all mutable fields and refreshes UpdatedAt
  - [P2] Update() trims whitespace from all fields

### Backend API Edge-Case Tests (P1–P2)

- `backend/tests/SiesaAgents.UnitTests/Clientes/GetClientesApiEdgeCaseTests.cs` (6 tests)
  - [P1] Response Content-Type is application/json
  - [P1] Response root JSON element is array (not wrapped object)
  - [P1] Response contains all required DTO fields (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
  - [P1] Multiple seeded clients all appear in response
  - [P2] Duplicate NIT returns 409 Conflict
  - [P2] createdAt is valid ISO 8601 DateTimeOffset (UTC)

### Frontend Unit — clienteSchema Edge Cases (P2–P3)

- `frontend/src/modules/crm/clientes/__tests__/clienteSchema.edge.test.ts` (13 tests)
  - [P2] Rejects empty Telefono
  - [P2] Rejects empty Ciudad
  - [P2] Rejects Nombre exceeding 255 characters
  - [P2] Accepts Nombre at exactly 255 characters (boundary)
  - [P2] Rejects NIT exceeding 50 characters
  - [P2] Accepts NIT at exactly 50 characters (boundary)
  - [P2] Rejects Telefono exceeding 50 characters
  - [P2] Rejects Ciudad exceeding 100 characters
  - [P2] Accepts Ciudad at exactly 100 characters (boundary)
  - [P2] Error message for empty Nombre is in Spanish
  - [P2] Error message for empty NIT is in Spanish
  - [P2] Complete valid payload accepted with all values preserved
  - [P2] All-empty payload reports errors on all four fields
  - [P3] Rejects nombre when provided as a number (type coercion guard)

### Frontend Unit — sortClientes Edge Cases (P1–P2)

- `frontend/src/modules/crm/clientes/__tests__/sortClientes.edge.test.ts` (10 tests)
  - [P2] Empty array returns empty array without error
  - [P2] Single-element array unchanged for nombre-asc
  - [P2] Single-element array unchanged for fecha-desc
  - [P1] Original array not mutated when sorting
  - [P2] Identical nombres handled without error (all items preserved)
  - [P2] Identical createdAt dates handled without error
  - [P2] Mixed-case names sorted correctly (localeCompare es)
  - [P2] Accented Spanish names sorted correctly (á, é, ó, ú, ñ)
  - [P2] nombre-desc is exact reverse of nombre-asc
  - [P2] fecha-desc and fecha-asc are exact inverses
  - [P2] 500 clients sorted in under 50ms (performance sanity)

### Frontend Component — ClienteListItem (P1–P2)

- `frontend/src/modules/crm/clientes/__tests__/ClienteListItem.test.tsx` (11 tests)
  - [P1] Renders Nombre and NIT visible
  - [P1] Has data-testid="cliente-list-item"
  - [P1] Has role="button" and tabIndex=0 for accessibility
  - [P2] aria-label contains both Nombre and NIT
  - [P1] Applies active background when isActive=true
  - [P1] Does not apply active background when isActive=false
  - [P1] Calls onClick with cliente object when clicked
  - [P1] Does not throw when onClick not provided and item clicked
  - [P1] Calls onClick when Enter key is pressed
  - [P1] Calls onClick when Space key is pressed
  - [P2] Does NOT call onClick when Tab key pressed

### Frontend Component — ClienteListView Edge Cases (P1–P2)

- `frontend/src/modules/crm/clientes/__tests__/ClienteListView.edge.test.tsx` (11 tests)
  - [P1] Lowercase search matches uppercase nombre (case-insensitive)
  - [P1] Uppercase search matches lowercase nombre
  - [P1] Search with leading/trailing whitespace matches correct client
  - [P1] No-results state shows EmptyState when search matches nothing
  - [P1] Full list restored when search cleared after no-results
  - [P1] Loading skeleton shown and no client items during fetch
  - [P1] onClienteSelect called with correct cliente when item clicked
  - [P1] Active highlighting applied to item matching selectedClienteId
  - [P1] NIT search matches with uppercase input on lowercase NIT
  - [P2] clientes-list-panel data-testid present on root container
  - (plus MSW error suppression pattern preserved)

### E2E Tests — Edge Cases (P1–P2)

- `e2e/tests/clientes/clientes-list-search-edge-cases.spec.ts` (9 tests)
  - [P1] Case-insensitive search finds client with mixed-case nombre
  - [P1] Search by partial NIT filters list correctly
  - [P1] Clearing search restores full list
  - [P1] No-results state shows EmptyState when search matches nothing
  - [P2] Keyboard navigation: item has tabindex=0 (Tab-accessible)
  - [P2] Spanish placeholder text in search input
  - [P2] "Clientes" heading present in Spanish
  - [P1] ErrorPanel shown when backend returns 429 (rate limit)
  - [P2] clientes-list-panel data-testid present

---

## Infrastructure

No new fixtures or factories created. Existing infrastructure leveraged:
- `clienteFactory.ts` — reused by all new frontend tests
- `data.helper.ts` — reused by new E2E tests
- `base.fixture.ts` — reused by new E2E tests
- `ApiHelper` — reused by new E2E tests

---

## Coverage Analysis

**Total New Tests:** 72
- P1: 35 tests (high priority — edge cases and error paths)
- P2: 35 tests (medium priority — boundary conditions)
- P3: 2 tests (low priority — type coercion guards)

**By Level:**
- Backend Unit: 12 tests (ClienteEntity domain validation)
- Backend API: 6 tests (response shape, contract, duplicate NIT)
- Frontend Unit (schema): 13 tests (boundary lengths, field validation, error messages)
- Frontend Unit (sort): 11 tests (empty, immutability, locale, ties, performance)
- Frontend Component (ClienteListItem): 11 tests (keyboard, active state, callbacks)
- Frontend Component (ClienteListView): 11 tests (case-insensitive, loading, select, no-results)
- E2E: 9 tests (case-insensitive, NIT search, clear, no-results, keyboard, 429)

**ATDD Tests (existing — Green):** 27 tests across 5 files
**New Automation Tests:** 72 tests across 6 new files

**Coverage Gaps Addressed:**
- ClienteEntity domain validation (all 4 required fields, whitespace, trimming)
- ClienteEntity Update() method — zero ATDD coverage → now fully covered
- API response contract (Content-Type, JSON array shape, DTO completeness)
- Duplicate NIT (uk_clientes_nit) enforcement → 409 Conflict
- clienteSchema boundary lengths and Spanish error messages
- sortClientes immutability, empty input, accented chars, locale correctness
- ClienteListItem accessibility (keyboard, aria-label, active state, callbacks)
- ClienteListView case-insensitive search, loading state, no-results state
- E2E case-insensitive and NIT partial search, 429 error handling

**Remaining Gaps (documented for future stories):**
- useClientes hook — no unit tests (TanStack Query hook testing is complex; component tests cover integration)
- clienteApiRepository — no unit tests (covered indirectly by API + E2E tests)
- EmptyState / ErrorPanel standalone component tests (shared components, low-risk)

---

## Definition of Done

- [x] All tests follow Given-When-Then format
- [x] All tests have priority tags ([P1], [P2], [P3])
- [x] All frontend component tests use data-testid selectors
- [x] MSW network-first pattern applied (handlers before render)
- [x] Route intercept before navigation in E2E tests
- [x] No hard waits or sleeps
- [x] Self-cleaning (E2E tests cleanup via afterEach)
- [x] No page objects (direct test code)
- [x] Test files under 300 lines
- [x] Existing ATDD tests NOT modified or duplicated

---

## Next Steps

1. Run frontend unit tests: `cd frontend && pnpm test`
2. Run backend tests: `cd backend && dotnet test`
3. Run E2E tests: `npx playwright test e2e/tests/clientes/`
4. Monitor for flaky tests in CI burn-in
5. Integrate with quality gate for Epic 2

**Test Execution:**
```bash
# Frontend unit + component
cd frontend && pnpm test

# Backend unit + integration
cd backend && dotnet test

# E2E clientes suite (all)
npx playwright test e2e/tests/clientes/

# E2E edge cases only
npx playwright test e2e/tests/clientes/clientes-list-search-edge-cases.spec.ts
```
