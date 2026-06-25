# ATDD Checklist - Epic 3, Story 3.1: Contact List & Search

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component

---

## Story Summary

As a commercial team member, the user wants to see a full list of contacts and search them by name or email, so they can quickly find any contact regardless of their client association. The story covers the read path only for the `contactos` module (FR10 + FR11 + FR12). It is directly analogous to Story 2.1 (Client List & Search).

**As a** commercial team member
**I want** to see a list of all contacts and search them by name or email
**So that** I can quickly find any contact regardless of their client association

---

## Acceptance Criteria

1. **Given** there are contacts in the system, **When** the user navigates to `/contactos`, **Then** a list of all contacts is displayed showing Nombre, Cargo, and Email per item (FR10).

2. **Given** the contact list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only contacts whose Nombre or Email match the input (case-insensitive), **And** results appear in under 1 second with up to 1,000 records (NFR1, FR11, FR12).

3. **Given** there are no contacts in the system (empty array returned by API), **When** the user navigates to `/contactos`, **Then** an `EmptyState` component is displayed with a message in Spanish guiding the user to create the first contact; the search field and list container are still rendered but empty.

4. **Given** the backend is unavailable when the page loads (network error or 5xx), **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list; clicking "Reintentar" triggers a new fetch via TanStack Query `refetch`.

---

## Failing Tests Created (RED Phase)

### E2E Tests (18 tests)

**File:** `e2e/story-3-1/contact-list-search.spec.ts`

- **Test:** AC1 — should render the contact list container when contacts exist
  - **Status:** RED - `/contactos` route not implemented, `ContactoListView` does not exist, `data-testid="contactos-list-container"` missing
  - **Verifies:** AC1 — navigating to `/contactos` renders the contact list container

- **Test:** AC1 — should display contact Nombre in each list item
  - **Status:** RED - list item component missing, `data-testid="contacto-list-item"` missing
  - **Verifies:** AC1 — Nombre field visible in list item

- **Test:** AC1 — should display contact Cargo in each list item
  - **Status:** RED - list item component missing, cargo not rendered
  - **Verifies:** AC1 — Cargo field visible in list item

- **Test:** AC1 — should display contact Email in each list item
  - **Status:** RED - list item component missing, email not rendered
  - **Verifies:** AC1 — Email field visible in list item

- **Test:** AC1 — should render the search input field with accessible aria-label
  - **Status:** RED - search input missing, `data-testid="contactos-search-input"` missing
  - **Verifies:** AC1 — search input is rendered

- **Test:** AC2 — should filter contact list by nombre when user types in search field
  - **Status:** RED - search/filter logic not implemented
  - **Verifies:** AC2 — real-time filtering by nombre

- **Test:** AC2 — should filter contact list by email when user types in search field
  - **Status:** RED - search/filter logic not implemented
  - **Verifies:** AC2 — real-time filtering by email

- **Test:** AC2 — should perform case-insensitive filtering by nombre
  - **Status:** RED - case-insensitive comparison not implemented
  - **Verifies:** AC2 — case-insensitive match

- **Test:** AC2 — should perform case-insensitive filtering by email
  - **Status:** RED - case-insensitive comparison not implemented
  - **Verifies:** AC2 — case-insensitive match on email

- **Test:** AC2 — should show all contacts when search field is cleared
  - **Status:** RED - filter state reset not implemented
  - **Verifies:** AC2 — clearing search restores full list

- **Test:** AC2 — should show zero items when search text matches no contact
  - **Status:** RED - filter logic not implemented
  - **Verifies:** AC2 — no false positives in filtering

- **Test:** AC3 — should display EmptyState component when API returns empty array
  - **Status:** RED - `EmptyState` not rendered, `data-testid="empty-state"` missing
  - **Verifies:** AC3 — EmptyState displayed when API returns []

- **Test:** AC3 — should display a Spanish guidance message in the EmptyState
  - **Status:** RED - EmptyState with Spanish message not implemented
  - **Verifies:** AC3 — message contains Spanish text with "contacto"

- **Test:** AC3 — should still render search input when API returns empty array
  - **Status:** RED - search input not rendered in empty state
  - **Verifies:** AC3 — search input present even when empty

- **Test:** AC3 — should still render list container when API returns empty array
  - **Status:** RED - list container not rendered in empty state
  - **Verifies:** AC3 — list container present even when empty

- **Test:** AC4 — should display ErrorPanel when API returns 500
  - **Status:** RED - `ErrorPanel` not rendered, `data-testid="error-panel"` missing
  - **Verifies:** AC4 — ErrorPanel shown on 5xx error

- **Test:** AC4 — should display ErrorPanel when API call fails with network error
  - **Status:** RED - error handling for network abort not implemented
  - **Verifies:** AC4 — ErrorPanel shown on network error

- **Test:** AC4 — should display a "Reintentar" button inside ErrorPanel
  - **Status:** RED - retry button missing, `data-testid="error-panel-retry-button"` missing
  - **Verifies:** AC4 — retry button is present in error state

- **Test:** AC4 — should trigger a new fetch when "Reintentar" button is clicked
  - **Status:** RED - refetch on retry click not wired
  - **Verifies:** AC4 — clicking Reintentar triggers TanStack Query refetch

### API Tests (11 tests)

**File:** `e2e/story-3-1/contactos-api.api.spec.ts`

- **Test:** GET /api/v1/contactos — should return HTTP 200 OK
  - **Status:** RED - endpoint not registered in backend
  - **Verifies:** AC1 — backend endpoint exists and returns 200

- **Test:** GET /api/v1/contactos — should return Content-Type application/json
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC1 — correct content type

- **Test:** GET /api/v1/contactos — should return a JSON array directly (not an object wrapper)
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC1 — direct array response, no wrapper object

- **Test:** GET /api/v1/contactos — should return items with camelCase id field (UUID string)
  - **Status:** RED - `ContactoEntity` and mapping not implemented
  - **Verifies:** AC1 — id field is UUID in camelCase

- **Test:** GET /api/v1/contactos — should return items with camelCase nombre field
  - **Status:** RED - `ContactoDto` not implemented
  - **Verifies:** AC1 — nombre field in camelCase

- **Test:** GET /api/v1/contactos — should return items with camelCase cargo field
  - **Status:** RED - `ContactoDto` not implemented
  - **Verifies:** AC1 — cargo field in camelCase

- **Test:** GET /api/v1/contactos — should return items with camelCase email field
  - **Status:** RED - `ContactoDto` not implemented
  - **Verifies:** AC1 — email field in camelCase

- **Test:** GET /api/v1/contactos — should return items with nullable camelCase clienteId field
  - **Status:** RED - nullable FK `ClienteId` not implemented
  - **Verifies:** AC1 — clienteId is UUID or null (FR23 orphan preservation)

- **Test:** GET /api/v1/contactos — should return items with camelCase createdAt and updatedAt fields as ISO 8601
  - **Status:** RED - DateTimeOffset serialization not implemented
  - **Verifies:** AC1 — timestamps in ISO 8601 camelCase

- **Test:** GET /api/v1/contactos — should NOT return snake_case field names
  - **Status:** RED - endpoint not implemented
  - **Verifies:** AC1 — camelCase contract enforced

- **Test:** GET /api/v1/contactos — AC3 — should return 200 OK with array when no contacts exist
  - **Status:** RED - endpoint returns 404
  - **Verifies:** AC3 — empty array returned (not 404) when table is empty

### Component/Unit Tests (17 tests)

**Hook file:** `frontend/src/modules/crm/contactos/application/useContactos.test.ts` (6 tests)

- **Test:** useContactos — should use queryKey ["contactos"]
  - **Status:** RED - `useContactos` hook file does not exist
  - **Verifies:** AC1 — queryKey is `['contactos']`

- **Test:** useContactos — should return data array with contact objects on success
  - **Status:** RED - hook not implemented
  - **Verifies:** AC1 — data contains contact objects with nombre, cargo, email

- **Test:** useContactos — should expose isLoading true before data arrives
  - **Status:** RED - hook not implemented
  - **Verifies:** AC1 — loading state exposed

- **Test:** useContactos — should expose isError true and error object when API fails
  - **Status:** RED - hook not implemented
  - **Verifies:** AC4 — error state exposed

- **Test:** useContactos — should expose a refetch function on error state
  - **Status:** RED - hook not implemented
  - **Verifies:** AC4 — refetch function available

- **Test:** useContactos — should return empty array when API returns empty array
  - **Status:** RED - hook not implemented
  - **Verifies:** AC3 — empty array propagated correctly

**View file:** `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx` (17 tests)

- **Test:** AC1 — should render the list container
  - **Status:** RED - `ContactoListView` does not exist
  - **Verifies:** AC1 — list container renders

- **Test:** AC1 — should render contact nombre in list item
  - **Status:** RED - component not implemented
  - **Verifies:** AC1 — nombre visible

- **Test:** AC1 — should render contact cargo in list item
  - **Status:** RED - component not implemented
  - **Verifies:** AC1 — cargo visible

- **Test:** AC1 — should render contact email in list item
  - **Status:** RED - component not implemented
  - **Verifies:** AC1 — email visible

- **Test:** AC1 — should render the search input with aria-label in Spanish
  - **Status:** RED - search input not implemented
  - **Verifies:** AC1 — search input present

- **Test:** AC2 — should filter list items by nombre substring
  - **Status:** RED - filter logic not implemented
  - **Verifies:** AC2 — nombre filtering

- **Test:** AC2 — should filter list items by email substring
  - **Status:** RED - filter logic not implemented
  - **Verifies:** AC2 — email filtering

- **Test:** AC2 — should perform case-insensitive filtering by nombre
  - **Status:** RED - case-insensitive logic not implemented
  - **Verifies:** AC2 — case-insensitive nombre match

- **Test:** AC2 — should perform case-insensitive filtering by email
  - **Status:** RED - case-insensitive logic not implemented
  - **Verifies:** AC2 — case-insensitive email match

- **Test:** AC2 — should show zero items when search matches nothing
  - **Status:** RED - filter not implemented
  - **Verifies:** AC2 — no false positives

- **Test:** AC3 — should display EmptyState when API returns empty array
  - **Status:** RED - EmptyState not rendered
  - **Verifies:** AC3 — EmptyState displayed

- **Test:** AC3 — should display Spanish guidance message in EmptyState
  - **Status:** RED - EmptyState message not implemented
  - **Verifies:** AC3 — Spanish message with "contacto"

- **Test:** AC3 — should not show contact list items when data is empty
  - **Status:** RED - EmptyState branch not implemented
  - **Verifies:** AC3 — no list items when empty

- **Test:** AC3 — should still render search input when data is empty
  - **Status:** RED - layout not implemented
  - **Verifies:** AC3 — search input present in empty state

- **Test:** AC3 — should still render list container when data is empty
  - **Status:** RED - layout not implemented
  - **Verifies:** AC3 — list container present in empty state

- **Test:** AC4 — should display ErrorPanel when API returns 500
  - **Status:** RED - error state branch not implemented
  - **Verifies:** AC4 — ErrorPanel displayed on 5xx

- **Test:** AC4 — should display "Reintentar" button inside ErrorPanel
  - **Status:** RED - retry button not implemented
  - **Verifies:** AC4 — retry button present

- **Test:** AC4 — should call refetch when "Reintentar" button is clicked
  - **Status:** RED - refetch not wired to button
  - **Verifies:** AC4 — retry triggers TanStack Query refetch

- **Test:** NFR1 — should complete filter in under 1,000ms with 1,000 contacts (R-001)
  - **Status:** RED - filter not implemented
  - **Verifies:** NFR1 / R-001 — performance requirement

---

## Data Factories Created

### Contacto Factory (inline in test files)

Inline `buildContacto` factory used in test files following the same pattern as Story 2.1.

**Pattern:**
```typescript
const buildContacto = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  nombre: 'Juan Pérez',
  cargo: 'Gerente Comercial',
  telefono: '3001234567',
  email: 'juan.perez@empresa.com',
  clienteId: null,
  createdAt: '2026-06-25T10:30:00Z',
  updatedAt: '2026-06-25T10:30:00Z',
  ...overrides,
});
```

**Exports (inline helpers):**
- `buildContacto(overrides?)` — Create single contact object with optional field overrides
- `Array.from({ length: N }, (_, i) => buildContacto({ id: String(i), ... }))` — Bulk creation for performance test

---

## Fixtures Created

Tests use MSW (Mock Service Worker) for network interception — no separate Playwright fixture files needed for this story. MSW server is composed per test file following the established pattern from Story 2.1.

**Pattern (per test file):**
```typescript
const server = setupServer(
  http.get('http://localhost:5000/api/v1/contactos', () => HttpResponse.json([buildContacto()])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Mock Requirements

### Contactos API Mock

**Endpoint:** `GET /api/v1/contactos`
**Used in:** E2E tests (Playwright `page.route`) and component tests (MSW)

**Success Response (with contacts):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "nombre": "Juan Pérez",
    "cargo": "Gerente Comercial",
    "telefono": "3001234567",
    "email": "juan.perez@empresa.com",
    "clienteId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-06-25T10:30:00Z",
    "updatedAt": "2026-06-25T10:30:00Z"
  }
]
```

**Empty Response:**
```json
[]
```

**Error Response (5xx):**
```json
{ "status": 500, "title": "Internal Server Error" }
```

**Notes:** E2E tests use Playwright `page.route('**/api/v1/contactos', ...)` with network-first pattern (intercept before navigation). Component tests use MSW `setupServer`.

---

## Required data-testid Attributes

### ContactoListView Component

- `contactos-list-container` — Scrollable container wrapping the entire list and search
- `contactos-search-input` — `<input type="search">` with `aria-label="Buscar contactos"`
- `contacto-list-item` — Each contact row in the list (one per contact in filtered results)

### Shared Components (already in use from Story 2.1 — must remain unchanged)

- `empty-state` — `EmptyState` component wrapper (already has this testid from Story 2.1)
- `error-panel` — `ErrorPanel` component wrapper (already has this testid from Story 2.1)
- `error-panel-retry-button` — "Reintentar" button inside `ErrorPanel` (already has this testid)

**Implementation Example:**
```tsx
<div data-testid="contactos-list-container">
  <input
    type="search"
    data-testid="contactos-search-input"
    aria-label="Buscar contactos"
    placeholder="Buscar por nombre o email..."
  />
  {filtered.map((c) => (
    <div key={c.id} data-testid="contacto-list-item" role="option">
      <span>{c.nombre}</span>
      <span>{c.cargo}</span>
      <span>{c.email}</span>
    </div>
  ))}
</div>
```

---

## Implementation Checklist

### Test: AC1 — Contact list renders on /contactos

**Files:** `e2e/story-3-1/contact-list-search.spec.ts` (AC1 describe block)

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs`
- [ ] Create `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs` and `GetContactosQueryHandler.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
- [ ] Register `DbSet<ContactoEntity> Contactos` in `AppDbContext.cs`
- [ ] Create and apply EF Core migration `AddContactosTable`
- [ ] Register `IContactoRepository` in `Program.cs`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — map `GET /api/v1/contactos`
- [ ] Register endpoint in `Program.cs`
- [ ] Create `frontend/src/modules/crm/contactos/domain/Contacto.ts`
- [ ] Create `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
- [ ] Create `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/contactos/application/useContactos.ts` (queryKey: `['contactos']`)
- [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx` — render list with nombre, cargo, email
- [ ] Add `data-testid="contactos-list-container"` to list container
- [ ] Add `data-testid="contacto-list-item"` to each list item
- [ ] Wire route `frontend/src/routes/_app/contactos.tsx` → render `ContactoListView`
- [ ] Run test: `npx playwright test e2e/story-3-1/contact-list-search.spec.ts --project=chromium`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: AC2 — Real-time search filtering

**Files:** `e2e/story-3-1/contact-list-search.spec.ts` (AC2 describe block), `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx` (AC2 describe block)

**Tasks to make this test pass:**

- [ ] Add `useState<string>('')` for `searchQuery` in `ContactoListView`
- [ ] Implement `useMemo` filter: `c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)` with 150ms debounce
- [ ] Bind filter to `contactos-search-input` onChange
- [ ] Add `data-testid="contactos-search-input"` with `aria-label="Buscar contactos"` and `placeholder="Buscar por nombre o email..."`
- [ ] Run test: `npx playwright test e2e/story-3-1/contact-list-search.spec.ts --project=chromium`
- [ ] Run test: `pnpm --filter frontend test src/modules/crm/contactos/presentation/ContactoListView.test.tsx`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — EmptyState when no contacts

**Files:** `e2e/story-3-1/contact-list-search.spec.ts` (AC3 describe block), component tests (AC3 describe block)

**Tasks to make this test pass:**

- [ ] Verify `frontend/src/shared/components/EmptyState.tsx` exists with `data-testid="empty-state"` (reuse from Story 2.1)
- [ ] Add conditional render in `ContactoListView`: when `data` is an empty array AND no search is active → render `<EmptyState>`
- [ ] EmptyState message must be in Spanish and contain "contacto" (e.g., "No hay contactos. Crea el primer contacto.")
- [ ] Ensure list container (`contactos-list-container`) is always rendered regardless of data state
- [ ] Ensure search input (`contactos-search-input`) is always rendered regardless of data state
- [ ] Run test: `npx playwright test e2e/story-3-1/contact-list-search.spec.ts --project=chromium`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — ErrorPanel on fetch failure + Reintentar

**Files:** `e2e/story-3-1/contact-list-search.spec.ts` (AC4 describe block), component tests (AC4 describe block)

**Tasks to make this test pass:**

- [ ] Verify `frontend/src/shared/components/ErrorPanel.tsx` exists with `data-testid="error-panel"` and `data-testid="error-panel-retry-button"` (reuse from Story 2.1)
- [ ] Add conditional render in `ContactoListView`: when `isError` is true → render `<ErrorPanel onRetry={refetch} />`
- [ ] Wire `refetch` from `useContactos()` to `ErrorPanel`'s `onRetry` prop
- [ ] Run test: `npx playwright test e2e/story-3-1/contact-list-search.spec.ts --project=chromium`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: API Contract — GET /api/v1/contactos

**File:** `e2e/story-3-1/contactos-api.api.spec.ts`

**Tasks to make this test pass:**

- [ ] All backend tasks in AC1 checklist above must be complete
- [ ] Verify response is a direct JSON array with camelCase fields: `id`, `nombre`, `cargo`, `telefono`, `email`, `clienteId` (nullable), `createdAt`, `updatedAt`
- [ ] Verify `clienteId` is `null` for orphan contacts (not `"null"` string)
- [ ] Run test: `npx playwright test e2e/story-3-1/contactos-api.api.spec.ts --project=chromium`
- [ ] ✅ API contract tests pass (green phase)

**Estimated Effort:** included in backend implementation above

---

### Test: NFR1 — Performance with 1,000 contacts (R-001)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx` (NFR1 describe block)

**Tasks to make this test pass:**

- [ ] Implement `useMemo` filter with 150ms debounce in `ContactoListView`
- [ ] Run performance test: `pnpm --filter frontend test src/modules/crm/contactos/presentation/ContactoListView.test.tsx`
- [ ] If `elapsed >= 1000ms` → escalate to server-side search endpoint (`GET /api/v1/contactos?search=`) per Dev Notes
- [ ] ✅ NFR1 test passes (green phase)

**Estimated Effort:** included in AC2 implementation above (measure during testing)

---

## Running Tests

```bash
# Run all E2E tests for this story
npx playwright test e2e/story-3-1/ --project=chromium

# Run E2E tests in headed mode (see browser)
npx playwright test e2e/story-3-1/contact-list-search.spec.ts --project=chromium --headed

# Debug specific E2E test
npx playwright test e2e/story-3-1/contact-list-search.spec.ts --project=chromium --debug

# Run API contract tests only
npx playwright test e2e/story-3-1/contactos-api.api.spec.ts --project=chromium

# Run hook unit tests
pnpm --filter frontend test src/modules/crm/contactos/application/useContactos.test.ts

# Run component tests
pnpm --filter frontend test src/modules/crm/contactos/presentation/ContactoListView.test.tsx

# Run all frontend tests for contactos module
pnpm --filter frontend test src/modules/crm/contactos/

# Run all frontend tests with coverage
pnpm --filter frontend test --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- MSW mocks and inline factories created
- Mock requirements documented
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- All tests run and fail as expected (missing implementation)
- Failure messages are clear: `Cannot find module './useContactos'`, `Unable to find an element by: [data-testid="contactos-list-container"]`, etc.
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC1 backend tasks)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: ContactoEntity → migration → repository → query handler → endpoint
2. Frontend domain + infrastructure layers (Contacto.ts, contactoApiRepository.ts)
3. Frontend application layer (useContactos.ts)
4. Frontend presentation layer (ContactoListView.tsx with AC1 data rendering)
5. AC2 (search/filter logic)
6. AC3 (empty state branch)
7. AC4 (error panel + retry)
8. Route wiring (contactos.tsx)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. **Verify all tests pass** (green phase complete)
2. Extract reusable helpers if pattern differs from Story 2.1
3. Optimize `useMemo` filter if performance test shows > 500ms
4. Ensure tests still pass after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/story-3-1/ --project=chromium`
3. **Begin implementation** using implementation checklist as guide, starting with backend (Tasks 1–2 in story file)
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception with `page.route()` before `page.goto()` in all E2E tests
- **data-factories.md** — Inline `buildContacto()` factory with override support; bulk creation for performance test
- **fixture-architecture.md** — MSW `setupServer` with `beforeAll/afterEach/afterAll` lifecycle in all component test files
- **test-quality.md** — One assertion per test (atomic), Given-When-Then comments, explicit waits only
- **selector-resilience.md** — `data-testid` selectors throughout; no CSS class selectors
- **component-tdd.md** — `renderHook` + `waitFor` for async hook testing; `render` + `userEvent` for component tests
- **test-levels-framework.md** — E2E for critical user journeys (AC1–AC4), API tests for contract validation, Component/unit tests for hook logic and UI behavior

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/story-3-1/ --project=chromium`

**Expected Results:**

```
  FAIL  e2e/story-3-1/contact-list-search.spec.ts
  FAIL  e2e/story-3-1/contactos-api.api.spec.ts

  Summary:
  - Total tests: 29 (E2E)
  - Passing: 0 (expected)
  - Failing: 29 (expected)
  - Status: RED phase verified
```

**Expected Frontend Test Run:**

**Command:** `pnpm --filter frontend test src/modules/crm/contactos/`

```
  FAIL  src/modules/crm/contactos/application/useContactos.test.ts
  FAIL  src/modules/crm/contactos/presentation/ContactoListView.test.tsx

  Summary:
  - Total tests: 23 (component + unit)
  - Passing: 0 (expected)
  - Failing: 23 (expected)
  - Status: RED phase verified
```

**Expected Failure Messages:**

- `Cannot find module './useContactos' from 'src/modules/crm/contactos/application/useContactos.test.ts'`
- `Cannot find module './ContactoListView' from 'src/modules/crm/contactos/presentation/ContactoListView.test.tsx'`
- `Error: No routes registered for GET http://localhost:5000/api/v1/contactos` (API contract tests)
- `TimeoutError: page.getByTestId('contactos-list-container') - no element found` (E2E tests)

---

## Notes

- This story is **directly analogous** to Story 2.1 (Client List & Search). Follow the same architectural patterns for both backend and frontend layers.
- The `EmptyState` and `ErrorPanel` shared components from Story 2.1 are reused as-is with the same `data-testid` attributes.
- Search is **client-side only** for this MVP. If the NFR1 performance test fails (>= 1,000ms with 1,000 records), escalate to server-side search endpoint.
- `ContactoListView` is a **full-width view** (no split panel), unlike the `ClienteListPanel` which is part of a split layout.
- `clienteId` is nullable (contacts can exist without a client association per FR23).
- All user-facing text must be in Spanish; code in English.

---

**Generated by BMad TEA Agent** - 2026-06-25
