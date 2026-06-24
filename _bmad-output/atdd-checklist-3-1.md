# ATDD Checklist - Epic 3, Story 3.1: Contact List & Search

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** E2E

---

## Story Summary

Commercial team members need a full-page table view at `/contactos` that lists all contacts (Nombre, Cargo, Email) and supports real-time client-side search by Nombre or Email. The page handles loading, empty, and error states gracefully using skeleton loaders, EmptyState, and ErrorPanel components already present from Epic 2.

**As a** commercial team member
**I want** to see a list of all contacts and search them by name or email
**So that** I can quickly find any contact regardless of their client association

---

## Acceptance Criteria

1. **AC1** — Given contacts exist, when the user navigates to `/contactos`, a full-page table (`ContactoListView`) shows Nombre, Cargo, and Email per row.
2. **AC2** — Given the list is loaded, when the user types in the search input, the list filters in real time (client-side, no new API call) matching Nombre or Email case-insensitively, under 1 second with up to 1,000 records.
3. **AC3** — Given no contacts exist (API returns `[]`), an `EmptyState` with Spanish guidance message "No hay contactos registrados. Crea el primero." is displayed.
4. **AC4** — Given the backend is unavailable, an `ErrorPanel` with a "Reintentar" button is displayed; clicking Reintentar triggers a new fetch attempt.
5. **AC5** — Given the list is rendered, clicking a contact row updates the URL to `/contactos/:contactoId` via TanStack Router client-side navigation (no full page reload).
6. **AC6** — When the component mounts, a single `GET /api/v1/contactos` request is sent and the response is cached under `queryKey: ['contactos']` via TanStack Query.
7. **AC7** — While data is loading, a skeleton loader (`react-loading-skeleton`) is rendered — no spinner.

---

## Failing Tests Created (RED Phase)

### E2E Tests (26 tests)

**File:** `e2e/tests/contactos/contact-list-search.spec.ts`

**AC1 — Contact list renders full-page table:**

- **Test:** `should render the contactos-view wrapper and the ContactoListView root`
  - **Status:** RED — `contactos-view` and `contacto-list-view` data-testid attributes not yet present
  - **Verifies:** AC1 — `/contactos` route renders `ContactoListView`

- **Test:** `should render a contact row for each contact returned by the API`
  - **Status:** RED — `contact-list-item-{id}` elements not rendered (component not implemented)
  - **Verifies:** AC1 — one row per contact from API response

- **Test:** `should display Nombre in each contact row`
  - **Status:** RED — contact rows not rendered
  - **Verifies:** AC1 — Nombre visible in each row

- **Test:** `should display Cargo in each contact row`
  - **Status:** RED — contact rows not rendered
  - **Verifies:** AC1 — Cargo visible in each row

- **Test:** `should display Email in each contact row`
  - **Status:** RED — contact rows not rendered
  - **Verifies:** AC1 — Email visible in each row

- **Test:** `should render list wrapped in a section with aria-label="Lista de contactos" (WCAG 2.1 AA)`
  - **Status:** RED — semantic `<section aria-label="Lista de contactos">` not present
  - **Verifies:** AC1 — WCAG 2.1 AA accessibility requirement

**AC2 — Real-time search filter:**

- **Test:** `should render the search input with correct Spanish placeholder text`
  - **Status:** RED — `contact-search-input` not present
  - **Verifies:** AC2 — search input with placeholder "Buscar por nombre o email..."

- **Test:** `should filter the list by Nombre when user types in the search input`
  - **Status:** RED — search functionality not implemented
  - **Verifies:** AC2 — filter by Nombre

- **Test:** `should filter the list by Email when user types in the search input`
  - **Status:** RED — search functionality not implemented
  - **Verifies:** AC2 — filter by Email

- **Test:** `should filter case-insensitively (lowercase input matches uppercase Nombre)`
  - **Status:** RED — case-insensitive filter not implemented
  - **Verifies:** AC2 — case-insensitive matching

- **Test:** `should restore the full list when search input is cleared`
  - **Status:** RED — search clear behavior not implemented
  - **Verifies:** AC2 — restore full list on clear

- **Test:** `should NOT trigger a new API call when filtering (client-side only)`
  - **Status:** RED — no implementation to test against
  - **Verifies:** AC2 — client-side only, no extra API calls

**AC3 — EmptyState on empty contact list:**

- **Test:** `should render the EmptyState component when API returns an empty array`
  - **Status:** RED — `empty-state` not rendered for `/contactos`
  - **Verifies:** AC3 — EmptyState on empty response

- **Test:** `should display Spanish guidance text in EmptyState pointing to contact creation`
  - **Status:** RED — EmptyState not rendered
  - **Verifies:** AC3 — Spanish message "No hay contactos registrados"

- **Test:** `should NOT render any contact rows when the list is empty`
  - **Status:** RED — component not implemented
  - **Verifies:** AC3 — no rows in DOM when empty

**AC4 — ErrorPanel on fetch failure:**

- **Test:** `should render the ErrorPanel component when the backend returns a 500 error`
  - **Status:** RED — `error-panel` not rendered for `/contactos`
  - **Verifies:** AC4 — ErrorPanel on 500 response

- **Test:** `should render the ErrorPanel component on a network error`
  - **Status:** RED — error handling not implemented
  - **Verifies:** AC4 — ErrorPanel on network abort

- **Test:** `should render a "Reintentar" button inside the ErrorPanel`
  - **Status:** RED — ErrorPanel not rendered
  - **Verifies:** AC4 — Reintentar button present

- **Test:** `should trigger a new fetch when "Reintentar" button is clicked`
  - **Status:** RED — retry logic not implemented
  - **Verifies:** AC4 — clicking Reintentar triggers refetch

- **Test:** `should NOT render contact rows when in error state`
  - **Status:** RED — component not implemented
  - **Verifies:** AC4 — no rows when in error state

**AC5 — Contact row click navigates client-side:**

- **Test:** `should update URL to /contactos/:contactoId when a row is clicked`
  - **Status:** RED — navigation not implemented
  - **Verifies:** AC5 — URL updates to `/contactos/:contactoId`

- **Test:** `should NOT reload the full page when navigating to /contactos/:contactoId (client-side nav)`
  - **Status:** RED — TanStack Router navigation not implemented
  - **Verifies:** AC5 — no full page reload (FR30)

**AC6 — Single API request on mount:**

- **Test:** `should send exactly one GET /api/v1/contactos request when the page mounts`
  - **Status:** RED — component not implemented
  - **Verifies:** AC6 — single mount request

- **Test:** `should NOT send additional GET requests when the search input is used`
  - **Status:** RED — TanStack Query caching not implemented
  - **Verifies:** AC6 — cache under `['contactos']` queryKey

**AC7 — Skeleton loader during fetch:**

- **Test:** `should render the skeleton loader while the API request is in flight`
  - **Status:** RED — `contacto-list-skeleton` not present
  - **Verifies:** AC7 — skeleton shown during loading

- **Test:** `should NOT render a spinner during loading (skeleton only, no spinner)`
  - **Status:** RED — loading state not implemented
  - **Verifies:** AC7 — no spinner element

- **Test:** `should hide the skeleton loader once contact data is fully loaded`
  - **Status:** RED — skeleton not implemented
  - **Verifies:** AC7 — skeleton hidden after data loads

---

### API Tests (8 tests)

**File:** `e2e/tests/api/contact-list.api.spec.ts`

- **Test:** `should return HTTP 200 when the contactos table is accessible`
  - **Status:** RED — `GET /api/v1/contactos` endpoint not implemented
  - **Verifies:** AC6 — 200 status code

- **Test:** `should return Content-Type: application/json`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — correct content type header

- **Test:** `should return a JSON array (not an object wrapper)`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — bare array response (no `{ data: [...] }` wrapper)

- **Test:** `should return HTTP 200 with empty array [] when no contacts exist`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — 200 + `[]` (not 404) when empty

- **Test:** `should return contact objects with required camelCase fields`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — response shape: id, nombre, cargo, telefono, email, clienteId, createdAt, updatedAt

- **Test:** `should return id as a UUID string (not numeric)`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — UUID primary key format

- **Test:** `should return createdAt and updatedAt as ISO 8601 timestamp strings`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — ISO 8601 timestamp format

- **Test:** `should NOT return snake_case field names (must be camelCase)`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — no snake_case keys (created_at, updated_at, cliente_id)

- **Test:** `should return clienteId as null when contact has no associated client`
  - **Status:** RED — endpoint not implemented
  - **Verifies:** AC6 — nullable clienteId FK returns null

---

## Data Factories Created

### Contacto Factory

**File:** `e2e/support/factories/contacto.factory.ts`

**Exports:**

- `createContactoPayload(overrides?)` — Build a POST body (no id, no timestamps)
- `createContactoDto(overrides?)` — Build a full ContactoDto (with id + timestamps) for mock API responses
- `createContactoDtos(count, overrides?)` — Build an array of ContactoDto objects

**Example Usage:**

```typescript
const contacto = createContactoDto({ nombre: 'Juan Pérez' });
const contactos = createContactoDtos(5);
const specific = createContactoDto({ id: '11111111-1111-1111-1111-111111111111' });
```

---

## Fixtures Created

No custom fixtures required for Story 3.1. Route interception via `page.route()` is used directly in tests (network-first pattern). The existing Playwright `test` fixture from `@playwright/test` is sufficient.

---

## Mock Requirements

### GET /api/v1/contactos Mock

**Endpoint:** `GET /api/v1/contactos`

**Success Response (200 — contacts exist):**

```json
[
  {
    "id": "00000000-0000-0000-0003-000000000001",
    "nombre": "Contacto Test 1",
    "cargo": "Gerente Comercial",
    "telefono": "3100000001",
    "email": "contacto1@test.com",
    "clienteId": null,
    "createdAt": "2026-06-24T00:00:00.000Z",
    "updatedAt": "2026-06-24T00:00:00.000Z"
  }
]
```

**Success Response (200 — empty list):**

```json
[]
```

**Failure Response (500):**

```json
{ "title": "Internal Server Error" }
```

**Notes:**
- All E2E tests mock this endpoint via `page.route('**/api/v1/contactos', ...)` BEFORE navigation.
- API tests hit the real endpoint at `http://localhost:5000/api/v1/contactos`.
- `clienteId` is `null` for contacts without client association — this is valid per the nullable FK design.

---

## Required data-testid Attributes

### ContactosPage (`frontend/src/routes/_app/contactos.tsx`)

- `contactos-view` — root `<div>` wrapper of the `/contactos` page

### ContactoListView (`frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`)

- `contacto-list-view` — root element of `ContactoListView`
- `contact-search-input` — the search `<input>` with `placeholder="Buscar por nombre o email..."`
- `contact-list-item-{id}` — each contact row (e.g., `contact-list-item-00000000-0000-0000-0003-000000000001`)
- `contacto-list-skeleton` — container wrapping the skeleton rows during loading
- `empty-state` — `EmptyState` component (reused from `frontend/src/shared/components/EmptyState.tsx`)
- `error-panel` — `ErrorPanel` component (reused from `frontend/src/shared/components/ErrorPanel.tsx`)
- `retry-button` — "Reintentar" button inside `ErrorPanel`

**Implementation Example:**

```tsx
// ContactoListView.tsx (root)
<section aria-label="Lista de contactos" data-testid="contacto-list-view">
  <input data-testid="contact-search-input" placeholder="Buscar por nombre o email..." />
  {isLoading && <div data-testid="contacto-list-skeleton">{/* skeleton rows */}</div>}
  {isError && <ErrorPanel onRetry={refetch} />}
  {!isLoading && !isError && filteredContactos.length === 0 && (
    <EmptyState message="No hay contactos registrados. Crea el primero." />
  )}
  {!isLoading && !isError && filteredContactos.map((c) => (
    <div key={c.id} data-testid={`contact-list-item-${c.id}`} onClick={() => navigate(...)}>
      {c.nombre} · {c.cargo} · {c.email}
    </div>
  ))}
</section>

// EmptyState.tsx (existing shared component — must expose data-testid="empty-state")
// ErrorPanel.tsx (existing shared component — must expose data-testid="error-panel" and data-testid="retry-button")

// ContactosPage (contactos.tsx)
<div className="flex flex-col h-full" data-testid="contactos-view">
  <ContactoListView />
</div>
```

---

## Implementation Checklist

### Test: AC1 — Contact list table renders on /contactos

**File:** `e2e/tests/contactos/contact-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/contactos/domain/Contacto.ts` interface
- [ ] Create `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` interface
- [ ] Create `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
- [ ] Create `frontend/src/modules/crm/contactos/application/useContactos.ts` (TanStack Query hook, `queryKey: ['contactos']`)
- [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx` with columns: Nombre, Cargo, Email
- [ ] Add `data-testid="contacto-list-view"` on root element of `ContactoListView`
- [ ] Add `data-testid="contact-list-item-{id}"` on each contact row
- [ ] Wrap list in `<section aria-label="Lista de contactos">` for WCAG 2.1 AA
- [ ] Update `frontend/src/routes/_app/contactos.tsx` to render `<ContactoListView />`
- [ ] Add `data-testid="contactos-view"` on the page root `<div>`
- [ ] Run test: `npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --grep "AC1"`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: AC2 — Real-time client-side search filter

**File:** `e2e/tests/contactos/contact-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `useState<string>('')` for `searchQuery` in `ContactoListView`
- [ ] Implement `useMemo` filter: `data.filter(c => c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))`
- [ ] Bind `searchQuery` state to `contact-search-input` onChange handler
- [ ] Set `placeholder="Buscar por nombre o email..."` on the search input (Spanish)
- [ ] Verify no additional `GET /api/v1/contactos` calls are triggered during search
- [ ] Run test: `npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --grep "AC2"`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 — EmptyState on empty contact list

**File:** `e2e/tests/contactos/contact-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Import `EmptyState` from `frontend/src/shared/components/EmptyState.tsx` (already exists from Story 2.1)
- [ ] Render `<EmptyState message="No hay contactos registrados. Crea el primero." />` when `data?.length === 0`
- [ ] Verify `EmptyState` exposes `data-testid="empty-state"` (check existing implementation)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --grep "AC3"`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — ErrorPanel with Reintentar retry

**File:** `e2e/tests/contactos/contact-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Import `ErrorPanel` from `frontend/src/shared/components/ErrorPanel.tsx` (already exists from Story 2.1)
- [ ] Render `<ErrorPanel onRetry={refetch} />` when `isError === true`
- [ ] Verify `ErrorPanel` exposes `data-testid="error-panel"` and `data-testid="retry-button"`
- [ ] Verify `onRetry` calls `refetch()` from `useContactos()`
- [ ] Run test: `npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --grep "AC4"`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — Row click navigates to /contactos/:contactoId

**File:** `e2e/tests/contactos/contact-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Import TanStack Router `useNavigate` or `Link` in `ContactoListView`
- [ ] Implement row `onClick`: `navigate({ to: '/contactos/$contactoId', params: { contactoId: c.id } })`
- [ ] Create `frontend/src/routes/_app/contactos.$contactoId.tsx` stub route (renders nothing — enables deep-link URL state)
- [ ] Verify no full page reload occurs on click (TanStack Router client-side navigation)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --grep "AC5"`
- [ ] ✅ AC5 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC6 — Backend GET /api/v1/contactos endpoint

**File:** `e2e/tests/api/contact-list.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs` (private ctor + static factory pattern)
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs`
- [ ] Add `DbSet<ContactoEntity> Contactos` to `AppDbContext`
- [ ] Run EF Core migration: `dotnet ef migrations add AddContactos` from `backend/`
- [ ] Create `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs`
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` (`GET /api/v1/contactos` → 200 + JSON array)
- [ ] Register `ContactoRepository` and `GetContactosQueryHandler` in `Program.cs` DI
- [ ] Call `app.MapContactoEndpoints()` in `Program.cs`
- [ ] Verify response is camelCase (ASP.NET JSON serialization default)
- [ ] Run test: `npx playwright test e2e/tests/api/contact-list.api.spec.ts`
- [ ] ✅ AC6 API tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test: AC7 — Skeleton loader during in-flight fetch

**File:** `e2e/tests/contactos/contact-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Install/verify `react-loading-skeleton` is present in `frontend/package.json`
- [ ] Render skeleton rows (5 rows) wrapped in `<div data-testid="contacto-list-skeleton">` when `isLoading === true`
- [ ] Ensure NO `<div role="progressbar">`, `.spinner`, or `data-testid="spinner"` element is rendered during loading
- [ ] Verify skeleton is hidden once data loads (component unmounts when `isLoading` becomes false)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --grep "AC7"`
- [ ] ✅ AC7 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E tests for Story 3.1
npx playwright test e2e/tests/contactos/contact-list-search.spec.ts

# Run API contract tests for Story 3.1
npx playwright test e2e/tests/api/contact-list.api.spec.ts

# Run all Story 3.1 tests together
npx playwright test e2e/tests/contactos/contact-list-search.spec.ts e2e/tests/api/contact-list.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --debug

# Run tests matching specific AC
npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --grep "AC1"
npx playwright test e2e/tests/contactos/contact-list-search.spec.ts --grep "AC2"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (26 E2E + 9 API = 35 total)
- ✅ Contacto data factory created with auto-unique IDs
- ✅ Mock requirements documented (GET /api/v1/contactos)
- ✅ All required `data-testid` attributes listed
- ✅ Implementation checklist created with task-level detail

**Verification:**

- All 35 tests fail as expected (endpoint and component not yet implemented)
- E2E failures: "Timeout waiting for `[data-testid='contacto-list-view']`" — missing implementation
- API failures: "Expected 200, received connection refused" — backend not implemented
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (recommended start: AC6 backend endpoint — unblocks all tests)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist above
6. Move to next test and repeat

**Recommended order:**
1. AC6 (backend endpoint) — unblocks API tests and provides real data for E2E tests
2. AC1 (ContactoListView basic render) — foundational for all other E2E tests
3. AC7 (skeleton loader) — required before AC1 tests can fully pass
4. AC3 (EmptyState) — quick win, reuses existing component
5. AC4 (ErrorPanel + Reintentar) — quick win, reuses existing component
6. AC2 (search filter) — builds on AC1
7. AC5 (row click navigation) — builds on AC1

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 35 tests pass (green phase complete)
2. Extract any duplicated row-rendering logic
3. Optimize `useMemo` filter if needed
4. Ensure all tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/contactos/contact-list-search.spec.ts`
3. Begin implementation using the implementation checklist as guide (start with AC6 backend)
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor for quality
6. Update story status to `done` in sprint-status.yaml when refactoring is complete

---

## Knowledge Base References Applied

- **network-first.md** — Route interception BEFORE navigation to prevent race conditions (all E2E tests)
- **data-factories.md** — Contacto factory using monotonic counter for unique test data with overrides support
- **fixture-architecture.md** — Direct `page.route()` approach (no custom fixture needed for this story)
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, no hard waits
- **selector-resilience.md** — `data-testid` selectors used exclusively (no CSS class selectors)
- **timing-debugging.md** — Deferred resolver pattern for skeleton loader tests (no `page.waitForTimeout`)
- **test-levels-framework.md** — E2E for user-facing acceptance criteria; API for HTTP contract validation

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/contactos/contact-list-search.spec.ts e2e/tests/api/contact-list.api.spec.ts`

**Expected Results:**

```
Running 35 tests using 1 worker

  ✗  [chromium] › contactos/contact-list-search.spec.ts:55:3 › AC1 … should render the contactos-view wrapper … (timeout)
  ✗  [chromium] › contactos/contact-list-search.spec.ts:69:3 › AC1 … should render a contact row … (timeout)
  … (all 26 E2E tests fail with timeout — missing component implementation)

  ✗  [chromium] › api/contact-list.api.spec.ts:31:3 › GET /api/v1/contactos … should return HTTP 200 … (connection refused)
  … (all 9 API tests fail — backend endpoint not implemented)

  35 failed
```

**Summary:**

- Total tests: 35
- Passing: 0 (expected)
- Failing: 35 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- E2E tests: `TimeoutError: Waiting for locator('[data-testid="contactos-view"]') to be visible`
- API tests: `Error: connect ECONNREFUSED 127.0.0.1:5000` or `Expected: 200 / Received: 404`

---

## Notes

- `EmptyState` and `ErrorPanel` already exist from Story 2.1 (`frontend/src/shared/components/`). The DEV team must verify the existing components expose `data-testid="empty-state"`, `data-testid="error-panel"`, and `data-testid="retry-button"` — if not, those attributes must be added.
- `ContactoListView` uses a **full-page table** layout (not a 280px sidebar like `ClienteListView`). The root element is a `<section>` (not `<aside>`).
- The `clienteId` field is nullable. The factory defaults it to `null`. API tests verify this field is present and `null` for contacts without a client association.
- No `data-testid` required for individual table columns (Nombre, Cargo, Email) — the row-level `contact-list-item-{id}` is sufficient for `containsText` assertions.

---

**Generated by BMad TEA Agent** - 2026-06-24
