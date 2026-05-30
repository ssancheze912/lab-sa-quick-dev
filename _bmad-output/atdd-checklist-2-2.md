# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-05-30
**Author:** SiesaTeam
**Primary Test Level:** Component (with E2E for user-facing journeys)

---

## Story Summary

A commercial team member wants to view the complete details of a client by selecting them from the list, reviewing all their information (Nombre, NIT/RUC, Teléfono, Ciudad) without navigating away from the clients section. The feature implements deep linking via `/clientes/:clienteId` (FR30) and appropriate loading/error/empty states.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC#1** — Given the client list is displayed When the user clicks on a client item Then the right panel renders the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad And the URL updates to `/clientes/:clienteId` (FR30 deep linking) — no full page reload.

2. **AC#2** — Given the user accesses the URL `/clientes/:clienteId` directly (deep link) When the page loads Then the correct client details are loaded via `GET /api/v1/clientes/{id}` and displayed in the right panel And the client list on the left is also loaded (FR30).

3. **AC#3** — Given a `clienteId` in the URL does not exist in the system When the page loads Then a not-found message is displayed gracefully in the right panel And no JavaScript error is thrown And the navigation shell remains visible.

4. **AC#4** — Given the user is on the detail view at `/clientes/:clienteId` When the backend returns a network error for `GET /api/v1/clientes/{id}` Then an error state message with a retry option is shown in the right panel (not a blank screen).

5. **AC#5** — Given a client is selected When its details are loading Then skeleton placeholders are shown in the right panel (not a spinner) using `react-loading-skeleton`.

---

## Failing Tests Created (RED Phase)

### E2E Tests (12 tests)

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

AC1 Tests:
- **Test:** AC1 — Click client item → right panel renders Nombre
  - **Status:** RED — `data-testid="clientes-list-panel"` and `data-testid="cliente-detail-panel"` not yet implemented
  - **Verifies:** Client Nombre appears in right panel after click

- **Test:** AC1 — Click client item → right panel renders NIT/RUC
  - **Status:** RED — `ClienteDetailView` component not yet implemented
  - **Verifies:** NIT/RUC value appears in right panel

- **Test:** AC1 — Click client item → right panel renders Teléfono
  - **Status:** RED — `ClienteDetailView` component not yet implemented
  - **Verifies:** Teléfono value appears in right panel

- **Test:** AC1 — Click client item → right panel renders Ciudad
  - **Status:** RED — `ClienteDetailView` component not yet implemented
  - **Verifies:** Ciudad value appears in right panel

- **Test:** AC1 — Click client item → URL updates to `/clientes/:clienteId` without full reload
  - **Status:** RED — `ClienteListView` onClick navigation not yet wired to TanStack Router
  - **Verifies:** FR30 deep linking — URL update without page reload

AC2 Tests:
- **Test:** AC2 — Direct URL access `/clientes/:clienteId` → client details displayed
  - **Status:** RED — `clientes.$clienteId.tsx` route not rendering `ClienteDetailView` (TC-E2-P2-02)
  - **Verifies:** Deep link loads and renders client data

- **Test:** AC2 — Direct URL access → client list on left is also loaded
  - **Status:** RED — Split-panel layout not fully wired
  - **Verifies:** Both panels load simultaneously on deep link

- **Test:** AC2 — Direct URL access → selected client is highlighted in the list
  - **Status:** RED — `isSelected` prop on `ClientListItem` not implemented
  - **Verifies:** Visual selection state in list matches URL param

AC3 Tests:
- **Test:** AC3 — Non-existent `clienteId` → not-found message in right panel
  - **Status:** RED — 404 handling in `ClienteDetailView` not implemented
  - **Verifies:** Graceful not-found UI instead of crash

- **Test:** AC3 — Non-existent `clienteId` → navigation shell remains visible
  - **Status:** RED — `data-testid="nav-shell"` not yet verified
  - **Verifies:** App shell not destroyed by 404 error

- **Test:** AC3 — Non-existent `clienteId` → no uncaught JavaScript error
  - **Status:** RED — Error boundary / error handling not implemented
  - **Verifies:** Zero uncaught JS errors on 404

AC4 Tests:
- **Test:** AC4 — Network error → error message shown in right panel (not blank screen)
  - **Status:** RED — Network error state in `ClienteDetailView` not implemented
  - **Verifies:** Error message visible in right panel

- **Test:** AC4 — Network error → "Reintentar" button is visible
  - **Status:** RED — Retry button not implemented
  - **Verifies:** Retry option available to user

- **Test:** AC4 — Clicking "Reintentar" → new network request triggered
  - **Status:** RED — `refetch()` not wired to retry button
  - **Verifies:** Retry triggers a new API call

AC5 Tests:
- **Test:** AC5 — Loading state → skeleton placeholder shown (not spinner)
  - **Status:** RED — `data-testid="cliente-detail-skeleton"` not yet implemented
  - **Verifies:** Company standard: react-loading-skeleton, no spinners

### Component Tests (20 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- **Test (TC-E2-P1-11):** Given clienteId in URL When renders Then Nombre is displayed
  - **Status:** RED — `ClienteDetailView` component does not exist
  - **Verifies:** AC#1, AC#2 — detail fields rendered

- **Test (TC-E2-P1-11):** Given clienteId in URL When renders Then NIT/RUC is displayed
  - **Status:** RED — component missing
  - **Verifies:** NIT field rendering

- **Test (TC-E2-P1-11):** Given clienteId in URL When renders Then Teléfono is displayed
  - **Status:** RED — component missing
  - **Verifies:** Teléfono field rendering

- **Test (TC-E2-P1-11):** Given clienteId in URL When renders Then Ciudad is displayed
  - **Status:** RED — component missing
  - **Verifies:** Ciudad field rendering

- **Test (TC-E2-P1-11):** Semantic HTML — field labels use dt elements (WCAG 2.1 AA)
  - **Status:** RED — dl/dt/dd structure not implemented
  - **Verifies:** Accessibility requirement for field/value pairs

- **Test (TC-E2-P1-11):** cliente-detail-panel testid is present on success render
  - **Status:** RED — data-testid attribute missing
  - **Verifies:** Test selector contract

- **Test (TC-E2-P1-12):** Non-existent id → not-found message displayed
  - **Status:** RED — 404 error handling not implemented
  - **Verifies:** AC#3 — graceful not-found state

- **Test (TC-E2-P1-12):** Non-existent id → no spinner shown
  - **Status:** RED — error state rendering missing
  - **Verifies:** Company standard: no spinners in error state

- **Test (TC-E2-P1-12):** Non-existent id → "Reintentar" button is NOT shown (404 is not retriable)
  - **Status:** RED — 404 vs network error discrimination not implemented
  - **Verifies:** AC#3 vs AC#4 distinction

- **Test:** Loading → skeleton placeholder shown (data-testid="cliente-detail-skeleton")
  - **Status:** RED — skeleton rendering not implemented
  - **Verifies:** AC#5 — react-loading-skeleton standard

- **Test:** Loading → aria-busy attribute set (WCAG 2.1 AA)
  - **Status:** RED — WCAG attribute missing
  - **Verifies:** Accessibility during loading state

- **Test:** Network error → error message shown
  - **Status:** RED — network error state missing
  - **Verifies:** AC#4 — error state rendering

- **Test:** Network error → "Reintentar" button shown
  - **Status:** RED — retry button missing
  - **Verifies:** AC#4 — retry option

- **Test:** Clicking "Reintentar" → new fetch triggered (refetch)
  - **Status:** RED — refetch wiring missing
  - **Verifies:** AC#4 — retry functionality

- **Test:** Network error retry button has aria-label (WCAG 2.1 AA)
  - **Status:** RED — aria-label on retry button missing
  - **Verifies:** Accessibility of retry button

- **Test:** No clienteId in URL → placeholder text "Selecciona un cliente..."
  - **Status:** RED — empty state rendering missing
  - **Verifies:** AC#1 empty/default state

- **Test:** No clienteId in URL → no single-client API call made
  - **Status:** RED — `enabled: !!id` not implemented
  - **Verifies:** Query disabled when no id present

### Hook Tests (13 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

- **Test:** id is undefined → query disabled, no API call made
  - **Status:** RED — `useCliente` hook does not exist
  - **Verifies:** AC#2/AC#4 — `enabled: !!id` pattern

- **Test:** id is empty string → query disabled
  - **Status:** RED — hook missing
  - **Verifies:** edge case for falsy id

- **Test:** valid id → query fetches GET /api/v1/clientes/:id
  - **Status:** RED — hook missing
  - **Verifies:** AC#2 — query enabled and fetches

- **Test:** valid id → data contains Nombre
  - **Status:** RED — hook missing
  - **Verifies:** field mapping in response

- **Test:** valid id → data contains NIT
  - **Status:** RED — hook missing
  - **Verifies:** field mapping

- **Test:** valid id → data contains Teléfono
  - **Status:** RED — hook missing
  - **Verifies:** field mapping

- **Test:** valid id → data contains Ciudad
  - **Status:** RED — hook missing
  - **Verifies:** field mapping

- **Test:** valid id → isLoading is initially true
  - **Status:** RED — hook missing
  - **Verifies:** loading state contract

- **Test:** non-existent id → isError is true on 404
  - **Status:** RED — hook missing
  - **Verifies:** AC#4 — error state on 404

- **Test:** non-existent id → data is undefined on error
  - **Status:** RED — hook missing
  - **Verifies:** data cleared on error

- **Test:** non-existent id → error object exposed for 404 detection
  - **Status:** RED — hook missing
  - **Verifies:** error.response?.status accessible for 404 discrimination

- **Test:** refetch function is available (AC#4 retry)
  - **Status:** RED — hook missing
  - **Verifies:** retry support contract

- **Test:** two different ids → each makes independent fetch (query key isolation)
  - **Status:** RED — hook missing
  - **Verifies:** `queryKey: ['clientes', id]` uniqueness

---

## Data Factories

### Cliente Factory (existing — from Story 2.1)

**File:** `e2e/helpers/data.helper.ts`

**Exports:**
- `buildCliente(overrides?)` — creates a client payload with unique Nombre, NIT, Teléfono, Ciudad

**New handler exports added:**

**File:** `frontend/src/__mocks__/handlers/clientes.ts`

- `clienteByIdHandlers` — MSW handlers for `GET /api/v1/clientes/:id` (success + 404)
- `clienteByIdErrorHandlers` — MSW handlers returning network error for `GET /api/v1/clientes/:id`
- `clienteNotFoundHandlers` — MSW handlers returning 404 Problem Details for all single-client requests
- `mockCliente` — single pre-populated mock client (re-export of `mockClientes[0]`)

---

## Fixtures

### Existing E2E Fixture (from Story 2.1)

**File:** `e2e/fixtures/base.fixture.ts`

- `clientesPage` — navigates to `/clientes` and provides page
- `ApiHelper` — creates and deletes clients via real API for E2E test isolation

**Cleanup:** Each E2E test uses `test.afterEach` to delete created clients by ID.

---

## Mock Requirements

### GET /api/v1/clientes/{id} — Success

**Endpoint:** `GET /api/v1/clientes/{id:guid}`

**Success Response (200 OK):**
```json
{
  "id": "a1b2c3d4-0000-0000-0000-000000000001",
  "nombre": "Ana García",
  "nit": "900-111-001",
  "telefono": "3001111111",
  "ciudad": "Bogotá",
  "createdAt": "2026-01-01T00:00:00+00:00",
  "updatedAt": "2026-01-01T00:00:00+00:00"
}
```

### GET /api/v1/clientes/{id} — Not Found (RFC 7807)

**Not Found Response (404):**
```json
{
  "status": 404,
  "title": "Cliente no encontrado",
  "detail": "No existe un cliente con ID {id}."
}
```
**Content-Type:** `application/problem+json`

### GET /api/v1/clientes/{id} — Network Error

**Network Error:** Simulated via `HttpResponse.error()` (MSW) or 500 status code in E2E tests.
- Tests verify error state message: "No se pudo cargar el cliente."
- Tests verify retry button is shown with aria-label

---

## Required data-testid Attributes

### ClienteDetailView Component

- `cliente-detail-panel` — outer container div wrapping the entire right panel (success, error, not-found states)
- `cliente-detail-skeleton` — skeleton loading container (shown during `isLoading`, before data arrives)

### ClienteListView Component (update from Story 2.1)

- `clientes-list-panel` — already expected in E2E tests (verify it exists or add if missing)
- `cliente-list-item` — already exists from Story 2.1 (used in E2E clicks)

### Navigation Shell

- `nav-shell` — outer navigation shell element (verified by AC#3 E2E test to remain visible after 404)

**Implementation Example:**

```tsx
// ClienteDetailView.tsx — success state
<div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-y-auto">
  <h2>{cliente.nombre}</h2>
  <dl>
    <div><dt>NIT/RUC</dt><dd>{cliente.nit}</dd></div>
    ...
  </dl>
</div>

// ClienteDetailView.tsx — loading state
<div data-testid="cliente-detail-skeleton" aria-busy="true" className="flex-1 p-6 space-y-4">
  <Skeleton height={28} width="60%" />
  <Skeleton count={4} height={20} />
</div>

// Retry button (network error state)
<button aria-label="Reintentar carga del cliente" onClick={() => refetch()}>
  Reintentar
</button>
```

---

## Implementation Checklist

### Test Group: ClienteDetailView Success State (TC-E2-P1-11)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts` hook
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` component
- [ ] Component reads `clienteId` from `useParams({ strict: false })` — TanStack Router
- [ ] Add `data-testid="cliente-detail-panel"` to success-state container
- [ ] Render `<h2>` with `cliente.nombre`
- [ ] Render `<dl>` with `<dt>/<dd>` pairs for NIT/RUC, Teléfono, Ciudad
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: Not-Found State (TC-E2-P1-12)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Add 404 error detection: `axios.isAxiosError(error) && error.response?.status === 404`
- [ ] Render `"Cliente no encontrado"` paragraph when `is404` is true
- [ ] Do NOT render "Reintentar" button for 404 (only for network errors)
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: Loading Skeleton State (AC#5)

**Tasks to make these tests pass:**

- [ ] Import `Skeleton` from `react-loading-skeleton` (package installed as per Dev Notes)
- [ ] Render skeleton when `isLoading === true`
- [ ] Add `data-testid="cliente-detail-skeleton"` to skeleton container
- [ ] Add `aria-busy="true"` to loading container (WCAG 2.1 AA)
- [ ] Do NOT render spinner (company standard)
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: Network Error + Retry State (AC#4)

**Tasks to make these tests pass:**

- [ ] Render error message "No se pudo cargar el cliente." for non-404 errors
- [ ] Render `<button>` with `aria-label="Reintentar carga del cliente"` text "Reintentar"
- [ ] Wire retry button `onClick` to `refetch()` from `useCliente`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: Empty State (No clienteId)

**Tasks to make these tests pass:**

- [ ] When `!clienteId`, render `<p>Selecciona un cliente para ver su detalle</p>`
- [ ] Confirm `useCliente(undefined)` has `enabled: false` — no API call made
- [ ] Run test: `pnpm --filter frontend test ClienteDetailView.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: useCliente Hook

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**Tasks to make these tests pass:**

- [ ] Create `useCliente.ts` with `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id!), enabled: !!id })`
- [ ] Export: `{ data, isLoading, isError, error, refetch }`
- [ ] Add `getById(id: string): Promise<Cliente>` to `clienteApiRepository.ts`
- [ ] Add `getById` to `IClienteRepository.ts` interface
- [ ] Run test: `pnpm --filter frontend test useCliente.test`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group: E2E — AC1 Click Navigation

**File:** `e2e/tests/clientes/client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] Update `ClienteListView` onClick to call `navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })`
- [ ] Use `useNavigate` from `@tanstack/react-router`
- [ ] Add `isSelected` prop: compare `c.id` with URL `clienteId` param
- [ ] Selected item style: `bg-blue-50 border-l-2 border-primary`
- [ ] Run test: `pnpm exec playwright test client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: E2E — AC2 Deep Link

**Tasks to make these tests pass:**

- [ ] Update `clientes.$clienteId.tsx` route to render `<ClienteDetailView />`
- [ ] Ensure `GET /api/v1/clientes/{id:guid}` endpoint is registered (backend Task 3)
- [ ] Run test: `pnpm exec playwright test client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: E2E — AC4 Network Error + Retry

**Tasks to make these tests pass:**

- [ ] Complete AC#4 component implementation above
- [ ] Run test: `pnpm exec playwright test client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** Covered above

---

### Test Group: E2E — AC5 Skeleton Loading

**Tasks to make these tests pass:**

- [ ] Complete AC#5 component implementation above
- [ ] Ensure `data-testid="cliente-detail-skeleton"` is on skeleton container
- [ ] Run test: `pnpm exec playwright test client-detail-view.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** Covered above

---

## Running Tests

```bash
# Run all component tests for this story
pnpm --filter frontend test ClienteDetailView.test

# Run hook tests
pnpm --filter frontend test useCliente.test

# Run all frontend tests
pnpm --filter frontend test

# Run E2E tests for this story
pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts

# Run E2E in headed mode (see browser)
pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts --headed

# Debug specific E2E test
pnpm exec playwright test e2e/tests/clientes/client-detail-view.spec.ts --debug

# Run all E2E tests
pnpm exec playwright test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (expected — components not yet created)
- MSW handlers added for `GET /api/v1/clientes/:id` (success, 404, network error)
- data-testid requirements documented
- Implementation checklist created

**Verification:**

- Component tests fail: `ClienteDetailView` module not found
- Hook tests fail: `useCliente` module not found
- E2E tests fail: `data-testid="cliente-detail-panel"` not found in DOM

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with hook, then component)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run test to verify it passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order:**
1. `useCliente.ts` hook (foundational — all component tests depend on it)
2. `clienteApiRepository.getById` method
3. `ClienteDetailView` success state
4. `ClienteDetailView` loading skeleton state
5. `ClienteDetailView` not-found state (404)
6. `ClienteDetailView` network error state + retry
7. `ClienteDetailView` empty state (no clienteId)
8. Update `ClienteListView` navigation onClick
9. Update `clientes.$clienteId.tsx` route

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Extract shared error/loading patterns if `ClienteListView` and `ClienteDetailView` share code
3. Ensure TypeScript strict mode — no `any` casts (use `axios.isAxiosError()` guard)
4. Optimize TanStack Query cache strategy if needed
5. Run all tests after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm --filter frontend test`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When complete, update story status to `done`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Pure function → fixture → mergeTests composition for E2E fixtures
- **data-factories.md** — `buildCliente` factory with overrides for unique test data per test
- **component-tdd.md** — Red-green-refactor, `QueryClientProvider` wrapper in component tests
- **network-first.md** — Route interception BEFORE navigation in all E2E tests (`page.route()` before `page.goto()`)
- **test-quality.md** — One assertion per test (atomic), Given-When-Then format, isolation via `server.resetHandlers()`
- **selector-resilience.md** — `data-testid` selectors throughout (no fragile CSS selectors)
- **timing-debugging.md** — `waitFor()` for async assertions, no hard waits/sleeps

---

## Test Files Summary

| File | Type | Tests | ACs Covered |
|------|------|-------|-------------|
| `e2e/tests/clientes/client-detail-view.spec.ts` | E2E | 15 | AC#1, AC#2, AC#3, AC#4, AC#5 |
| `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` | Component | 17 | AC#1, AC#2, AC#3, AC#4, AC#5 |
| `frontend/src/modules/crm/clientes/application/useCliente.test.ts` | Hook/Unit | 13 | AC#2, AC#4 |
| `frontend/src/__mocks__/handlers/clientes.ts` | MSW handlers | N/A | Support file |

**Total failing tests: 45 tests in RED phase**

---

**Generated by BMad TEA Agent** — 2026-05-30
