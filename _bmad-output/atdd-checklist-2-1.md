# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-23
**Story:** 2.1 — Client List & Search
**Epic:** 2 — Gestión de Clientes
**Primary Test Levels:** Component (Vitest + RTL + MSW) · API (Playwright) · E2E (Playwright)

---

## Story Summary

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
So that I can quickly find the client I'm looking for.

---

## Acceptance Criteria

1. **AC#1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px) renders a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **AC#2** — Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive substring), and results appear in under 1 second with up to 500 records (NFR1).

3. **AC#3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed with a message guiding the user to create the first client. No list items are rendered.

4. **AC#4** — Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list. Clicking "Reintentar" triggers a refetch and, on success, replaces the error panel with the client list.

---

## Failing Tests Created (RED Phase)

### Component Tests — Vitest + RTL + MSW

**File:** `frontend/src/modules/crm/clientes/domain/__tests__/Cliente.test.ts` (4 tests)

| Test | Status | Verifies |
|------|--------|---------|
| should export a type that allows an object with all required fields | RED — `Cliente.ts` does not exist | AC#1 — domain entity importable |
| should allow creating a valid Cliente-shaped object with all 7 required fields | RED — module missing | AC#1 — 7 fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt |
| should have id as a string field | RED | AC#1 — field type |
| should have nombre as a string field | RED | AC#1 — field type |

---

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useClientes.test.ts` (6 tests)

| Test | Status | Verifies |
|------|--------|---------|
| should return an array of clients when the API responds with 2 items | RED — `useClientes.ts` does not exist | AC#1 — hook returns data |
| should include nit in each returned client object | RED | AC#1 — nit field present |
| should expose isLoading as true initially | RED | AC#1 — loading state |
| should expose isError as false on successful fetch | RED | AC#4 — error state |
| should expose isError as true when the API returns a network error | RED | AC#4 — error state |
| should expose a refetch function | RED | AC#4 — refetch available |
| should use queryKey [clientes] for caching | RED | AC#1 — query key |

---

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` (TC-E2-P1-01 through TC-E2-P1-06, 21 tests)

**TC-E2-P1-01 — Client list renders all clients with Nombre and NIT/RUC (5 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should render 2 client items when the API returns 2 clients | RED — `ClienteListView.tsx` does not exist | AC#1 — list renders items |
| should display "Cliente A" as the nombre of the first item | RED | AC#1 — nombre visible |
| should display the NIT/RUC of each client in the list items | RED | AC#1 — nit visible |
| should render the list inside a container with data-testid="clientes-list-panel" | RED | AC#1 — panel present |
| should render a scrollable list element (ul) containing the client items | RED | AC#1 — scrollable list |

**TC-E2-P1-02 — EmptyState when no clients exist (4 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should render the EmptyState component when the API returns an empty array | RED — `EmptyState.tsx` does not exist | AC#3 — EmptyState rendered |
| should display the guiding message to create the first client | RED | AC#3 — Spanish guidance message |
| should NOT render any client list items when the list is empty | RED | AC#3 — no list items |
| should NOT render the EmptyState when there are clients | RED | AC#3 — EmptyState absent with data |

**TC-E2-P1-03 — ErrorPanel on backend failure + Reintentar (4 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should render the ErrorPanel when the API call fails | RED — `ErrorPanel.tsx` does not exist | AC#4 — ErrorPanel rendered |
| should display a "Reintentar" button inside the ErrorPanel | RED | AC#4 — Reintentar button |
| should replace the ErrorPanel with the client list when Reintentar is clicked and refetch succeeds | RED | AC#4 — refetch flow |
| should NOT render the ErrorPanel when the API is successful | RED | AC#4 — no error panel on success |

**TC-E2-P1-04 — Real-time search filters by Nombre (4 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should show only clients matching the search term when typing in the search field | RED | AC#2 — nombre filter |
| should filter case-insensitively (uppercase search matches lowercase nombre) | RED | AC#2 — case-insensitive |
| should restore all items when the search field is cleared | RED | AC#2 — clear restores list |
| should display a no-results message when search matches nothing | RED | AC#2 — no-results message |

**TC-E2-P1-05 — Real-time search filters by NIT/RUC (3 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should filter clients when the user types a known NIT value | RED | AC#2 — NIT filter |
| should match partial NIT substrings | RED | AC#2 — substring match |
| should return all clients when search is cleared after NIT filter | RED | AC#2 — clear restores list |

**TC-E2-P1-06 — Search performance with 500 records (1 test):**

| Test | Status | Verifies |
|------|--------|---------|
| should filter 500 clients in under 1000ms | RED | NFR1 — < 1 s with 500 records |

**Search field accessibility (1 test):**

| Test | Status | Verifies |
|------|--------|---------|
| should render a search input with aria-label="Buscar cliente" | RED | AC#1 — accessible search field |

---

**File:** `frontend/src/shared/components/__tests__/ClientListItem.test.tsx` (10 tests)

| Test | Status | Verifies |
|------|--------|---------|
| should render the nombre prop as primary text | RED — `ClientListItem.tsx` does not exist | AC#1 — nombre rendered |
| should render the nit prop as secondary text | RED | AC#1 — nit rendered |
| should render with data-testid="cliente-list-item" | RED | AC#1 — testid present |
| should call onClick when the item is clicked | RED | AC#1 — click handler |
| should NOT call onClick when rendered without clicking | RED | AC#1 — no spurious calls |
| should set aria-selected="true" when isSelected is true | RED | AC#1 — selected state |
| should set aria-selected="false" when isSelected is false | RED | AC#1 — unselected state |
| should have role="listitem" | RED | AC#1 — accessible role |
| should have aria-label equal to the nombre prop | RED | AC#1 — accessible label |

---

**File:** `frontend/src/shared/components/__tests__/EmptyState.test.tsx` (5 tests)

| Test | Status | Verifies |
|------|--------|---------|
| should render the message passed as a prop | RED — `EmptyState.tsx` does not exist | AC#3 — message rendered |
| should render with data-testid="empty-state" | RED | AC#3 — testid present |
| should render the default clientes guidance message correctly | RED | AC#3 — Spanish message |
| should render without crashing when aria-label is provided | RED | AC#3 — aria-label prop |
| should accept different message strings without crashing | RED | AC#3 — flexible prop |

---

**File:** `frontend/src/shared/components/__tests__/ErrorPanel.test.tsx` (8 tests)

| Test | Status | Verifies |
|------|--------|---------|
| should render the Spanish error message "Ocurrió un error al cargar los datos." | RED — `ErrorPanel.tsx` does not exist | AC#4 — Spanish error message |
| should render a "Reintentar" button | RED | AC#4 — button present |
| should render with data-testid="error-panel" | RED | AC#4 — testid present |
| should render without crashing when aria-label is provided | RED | AC#4 — aria-label prop |
| should call onRetry when the "Reintentar" button is clicked | RED | AC#4 — retry handler called |
| should call onRetry with no arguments when clicked | RED | AC#4 — call signature |
| should NOT call onRetry when rendered without clicking | RED | AC#4 — no spurious calls |
| should have the "Reintentar" button as a native button element | RED | AC#4 — button semantics |
| should expose the Reintentar button with minimum touch-target size | RED | AC#4 — a11y touch target |

---

### E2E / API Tests — Playwright

**File:** `e2e/tests/clientes/clientes-list-search.spec.ts`

**TC-E2-P2-06 — GET /api/v1/clientes returns 200 with full client list (5 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should respond with HTTP 200 and a JSON array | RED — endpoint not implemented | AC#1 — endpoint exists |
| should return content-type application/json | RED | AC#1 — JSON content type |
| should return a JSON array (not an object or null) | RED | AC#1 — direct array response |
| should return client objects with all required camelCase fields | RED | AC#1 — 7 fields in camelCase |
| should return client fields in camelCase (not snake_case) | RED | AC#1 — camelCase serialization |

**AC#1 — Client list UI renders at /clientes (2 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should render the clientes-list-panel at /clientes | RED — `ClienteListView` not wired | AC#1 — list panel visible |
| should show a client item for each existing client in the system | RED | AC#1 — items match DB |

**AC#2 — Real-time search filters (2 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should filter the list when the user types in the search field (by nombre) | RED | AC#2 — nombre filter in browser |
| should filter the list when searching by NIT/RUC | RED | AC#2 — NIT filter in browser |

**AC#3 — EmptyState (1 test):**

| Test | Status | Verifies |
|------|--------|---------|
| should display the EmptyState component when the client list is empty | RED | AC#3 — EmptyState in browser |

**AC#4 — ErrorPanel + Reintentar (2 tests):**

| Test | Status | Verifies |
|------|--------|---------|
| should show ErrorPanel when the backend is unavailable | RED | AC#4 — ErrorPanel in browser |
| should show the client list after clicking "Reintentar" and refetch succeeds | RED | AC#4 — retry flow in browser |

---

## Data Factories Used

```typescript
// frontend test helpers (within test files)
function createMockCliente(overrides?: Partial<Cliente>): Cliente
function createMockClienteList(count: number): Cliente[]

// e2e/helpers/data.helper.ts (existing)
buildCliente(overrides?)  // used for API test setup/teardown
```

---

## MSW Handlers Used

All component tests use inline MSW handlers via `server.use()`. Patterns:

```typescript
// Success with list
http.get('/api/v1/clientes', () => HttpResponse.json([...]))

// Empty list
http.get('/api/v1/clientes', () => HttpResponse.json([]))

// Network error
http.get('/api/v1/clientes', () => HttpResponse.error())

// First fail, then succeed (TC-E2-P1-03)
let callCount = 0
http.get('/api/v1/clientes', () => {
  callCount++
  if (callCount === 1) return HttpResponse.error()
  return HttpResponse.json([...])
})

// 500 items for performance test
http.get('/api/v1/clientes', () => HttpResponse.json(allClientes))
```

---

## Required data-testid Attributes

| testid | Component | Purpose |
|--------|-----------|---------|
| `clientes-list-panel` | `ClienteListView` | List panel container (280px left panel) |
| `cliente-list-item` | `ClientListItem` | Individual client row in the list |
| `empty-state` | `EmptyState` | Empty state container |
| `error-panel` | `ErrorPanel` | Error state container |

---

## Implementation Checklist

### Tasks to make RED tests pass (GREEN phase):

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` — TypeScript interface with 7 fields
- [ ] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — `getAll(): Promise<Cliente[]>`
- [ ] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — `GET /api/v1/clientes`
- [ ] Create `frontend/src/modules/crm/clientes/application/useClientes.ts` — TanStack Query hook with `queryKey: ['clientes']`
- [ ] Create `frontend/src/shared/components/ClientListItem.tsx` — Props: `{ id, nombre, nit, isSelected?, onClick }` with `data-testid="cliente-list-item"`, `role="listitem"`, `aria-selected`, `aria-label={nombre}`
- [ ] Create `frontend/src/shared/components/EmptyState.tsx` — Props: `{ message, 'aria-label'? }` with `data-testid="empty-state"`
- [ ] Create `frontend/src/shared/components/ErrorPanel.tsx` — Props: `{ onRetry, 'aria-label'? }` with `data-testid="error-panel"`, "Reintentar" button, Spanish error message
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — search Input with `placeholder="Buscar cliente..."`, `aria-label="Buscar cliente"`, `useMemo` filter, conditional rendering of EmptyState / ErrorPanel / list, `data-testid="clientes-list-panel"`
- [ ] Backend: Create `ClienteEntity`, `IClienteRepository`, `ClienteDto`, `GetClientesQueryHandler`
- [ ] Backend: Create `ClienteRepository`, EF Core configuration, migration
- [ ] Backend: Register `GET /api/v1/clientes` endpoint returning camelCase JSON array

---

## Running Tests

```bash
# Run all Story 2.1 component tests
pnpm --filter frontend test src/modules/crm/clientes src/shared/components

# Run specific test files
pnpm --filter frontend test src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx
pnpm --filter frontend test src/shared/components/__tests__/ClientListItem.test.tsx
pnpm --filter frontend test src/shared/components/__tests__/EmptyState.test.tsx
pnpm --filter frontend test src/shared/components/__tests__/ErrorPanel.test.tsx
pnpm --filter frontend test src/modules/crm/clientes/application/__tests__/useClientes.test.ts
pnpm --filter frontend test src/modules/crm/clientes/domain/__tests__/Cliente.test.ts

# Run all frontend tests
pnpm --filter frontend test

# Run E2E tests for Story 2.1
pnpm exec playwright test e2e/tests/clientes/clientes-list-search.spec.ts

# Run E2E chromium only
pnpm exec playwright test e2e/tests/clientes/clientes-list-search.spec.ts --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 59 component tests written and failing (`Failed to resolve import` — implementation files missing)
- ✅ 12 E2E/API tests written and failing (backend endpoint not implemented, frontend not wired)
- ✅ MSW handlers in place for all network scenarios (success, empty, error, retry)
- ✅ `data-testid` requirements defined for 4 components
- ✅ Implementation checklist created with ordered tasks

**Verification:**
- Component tests fail with: `Error: Failed to resolve import "../Cliente" from ...`
- E2E tests will fail with: `net::ERR_CONNECTION_REFUSED` (backend not running) or missing testids

---

### GREEN Phase (DEV Agent — Next Steps)

**Recommended implementation order:**
1. `Cliente.ts` interface — unblocks domain test + all downstream imports
2. `IClienteRepository.ts` — unblocks infrastructure layer
3. `clienteApiRepository.ts` — unblocks hook
4. `useClientes.ts` — unblocks component
5. `ClientListItem.tsx` — simplest component, no dependencies
6. `EmptyState.tsx` — pure presentational
7. `ErrorPanel.tsx` — pure presentational with onClick
8. `ClienteListView.tsx` — orchestrates all above + search filter logic
9. Backend: entity + repository + endpoint
10. Wire route at `frontend/src/routes/clientes.tsx`

---

## Acceptance Criteria Coverage Matrix

| AC | Test Cases | Level | Status |
|----|------------|-------|--------|
| AC#1 — List renders at /clientes with Nombre + NIT/RUC | TC-E2-P1-01, TC-E2-P2-06, AC#1 E2E | Component + API + E2E | RED |
| AC#2 — Real-time search by Nombre (case-insensitive) | TC-E2-P1-04, AC#2 E2E | Component + E2E | RED |
| AC#2 — Real-time search by NIT/RUC | TC-E2-P1-05, AC#2 E2E | Component + E2E | RED |
| AC#2 — Performance < 1 s with 500 records (NFR1) | TC-E2-P1-06 | Component | RED |
| AC#3 — EmptyState when no clients | TC-E2-P1-02, AC#3 E2E | Component + E2E | RED |
| AC#4 — ErrorPanel on fetch failure | TC-E2-P1-03, AC#4 E2E | Component + E2E | RED |
| AC#4 — Reintentar triggers refetch | TC-E2-P1-03, AC#4 E2E | Component + E2E | RED |

---

## Test Count Summary

| Level | File | Tests |
|-------|------|-------|
| Unit | `Cliente.test.ts` | 4 |
| Unit/Hook | `useClientes.test.ts` | 7 |
| Component | `ClienteListView.test.tsx` | 21 |
| Component | `ClientListItem.test.tsx` | 9 |
| Component | `EmptyState.test.tsx` | 5 |
| Component | `ErrorPanel.test.tsx` | 9 |
| E2E/API | `clientes-list-search.spec.ts` | 12 |
| **Total** | | **67** |

---

## Knowledge Base References Applied

- **network-first** — MSW `server.listen()` called in `beforeAll` before any test renders; E2E `page.route()` registered before `page.goto()`
- **selector-resilience** — All selectors use `data-testid`, `role`, `aria-label`, `placeholder`; no CSS class selectors
- **Given-When-Then** — All tests structured with explicit GIVEN / WHEN / THEN comments
- **no-hard-waits** — All async waits use `waitFor()` with explicit conditions; no `sleep` or `setTimeout`
- **test-quality** — Each test has a single focused assertion goal; atomic test cases

---

**Generated by BMad TEA Agent** — 2026-05-23
