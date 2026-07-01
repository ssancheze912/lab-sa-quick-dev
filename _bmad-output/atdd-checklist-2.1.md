# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) — client-side list/search/empty/error states, per test-design-epic-2.md

---

## Story Summary

As a commercial team member, I want to see a list of all clients and search them by name or NIT/RUC, so that I can quickly find the client I'm looking for.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **Given** there are clients in the system, **When** the user navigates to `/clientes`, **Then** the left panel (280px, `.panel-list`) shows a scrollable list of all clients with `Nombre` and `NIT/RUC` visible per item.
2. **Given** the client list is loaded, **When** the user types in the search field, **Then** the list filters in real time (client-side, in-memory) by `Nombre` or `NIT/RUC` (case-insensitive substring), in under 1s with up to 500 records (NFR1).
3. **Given** there are no clients in the system, **When** the user navigates to `/clientes`, **Then** an `EmptyState` (`no-clients` variant) is displayed, structurally distinct from the zero-search-results case.
4. **Given** the list is loaded and the search matches nothing, **When** the filter is applied, **Then** a `search-empty` `EmptyState` variant is shown (NOT `no-clients`), and the search input retains its typed value.
5. **Given** the backend is unavailable on load, **When** the fetch fails, **Then** an `ErrorPanel` with "Reintentar" is shown; clicking it re-triggers the fetch and renders the list on success.

---

## Test Framework Note

This project uses **Vitest + React Testing Library + MSW** for component-level coverage (primary level per `test-design-epic-2.md` §3) and **Playwright** for E2E. No unit/API-level tests are needed for this story — Story 2.1 is a frontend-only read path (backend `GetClientesQuery`/`ClienteRepository` tests belong to the story's Task 5 backend xUnit suite, written by DEV during implementation per Testing Standards Summary; ATDD here focuses on the frontend contract-facing behavior specified in the ACs).

**Test infrastructure created in this ATDD pass** (did not exist before):

- `frontend/src/test/factories/cliente.factory.ts` — faker-based `createCliente`/`createClientes(count)` factory (data-factories.md pattern)
- `frontend/src/test/msw/handlers.ts` — default MSW handler for `GET /api/v1/clientes`, exports `CLIENTES_ENDPOINT` for per-test `server.use()` overrides
- `frontend/src/test/msw/server.ts` — shared `setupServer(...handlers)` instance
- `frontend/src/test/setup.ts` — extended with MSW lifecycle (`server.listen/resetHandlers/close`, `onUnhandledRequest: 'error'`)
- `frontend/src/test/support/renderWithRouter.tsx` — extended with opt-in `withQueryClient` option (fresh `QueryClientProvider` per test, retries disabled) — backward compatible, existing AppShell/NotFoundView tests unaffected (verified: 27 pre-existing tests still pass)
- Devdependency added: `@faker-js/faker` (was missing; required for factory-based test data per data-factories.md)

---

## Failing Tests Created (RED Phase)

### Component Tests (16 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx` (288 lines)

- **AC #1 — list shows Nombre + NIT/RUC per item**
  - `should render the scrollable list panel with a list item per client returned by the API` — RED: `ClienteListView.tsx` does not exist
  - `should display both Nombre and NIT/RUC for each list item (TC-E2-P2-04)` — RED: module not found
  - `should render the list panel container with the 280px .panel-list class per UX spec` — RED: module not found
- **AC #2 — real-time client-side search**
  - `should filter the list to only clients whose nombre matches the typed search term` (TC-E2-P1-01) — RED: module not found
  - `should filter the list to only clients whose NIT/RUC matches the typed search term` (TC-E2-P1-01) — RED: module not found
  - `should match case-insensitively` — RED: module not found
  - `should not trigger a new network request while filtering (client-side only)` — RED: module not found
- **AC #3 — no-clients EmptyState**
  - `should render the no-clients EmptyState when the API returns an empty array` (TC-E2-P1-03) — RED: module not found
  - `should NOT render any list item rows when the dataset is empty` — RED: module not found
- **AC #4 — search-empty state, distinct from no-clients**
  - `should show the search-empty state (not no-clients) when the search matches nothing` (TC-E2-P1-04) — RED: module not found
  - `should retain the typed search value when zero results are found` — RED: module not found
  - `should keep the search input visible while the search-empty state is shown` — RED: module not found
- **AC #5 — ErrorPanel + Reintentar**
  - `should render ErrorPanel instead of the list when the initial fetch fails` (TC-E2-P1-05) — RED: module not found
  - `should show a "Reintentar" button inside the ErrorPanel` — RED: module not found
  - `should re-trigger the fetch and render the list when Reintentar succeeds` — RED: module not found
  - `should never render the raw error message text (no technical detail leak)` (NFR6) — RED: module not found

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.performance.test.tsx` (41 lines)

- **AC #2 — NFR1 performance**
  - `should render the filtered list in under 1000ms with 500 seeded clients` (TC-E2-P1-02) — RED: `ClienteListView.tsx` does not exist

### E2E Tests (3 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts` (93 lines) — complements the pre-existing `e2e/tests/clientes/clientes-crud.spec.ts` (FR1/FR2/FR4/FR7/FR8 against real seeded data), covering the mocked network-failure/empty-state journeys that spec does not exercise.

- `AC #3 — should show the no-clients EmptyState when the dataset is empty` — RED: `empty-state-no-clients` testid does not exist (placeholder route renders `<div data-testid="clientes-view">`)
- `AC #4 — should show a distinct search-empty state when a search matches no clients` — RED: search/list testids do not exist yet
- `AC #5 — should show ErrorPanel with Reintentar when the backend is unavailable, then load the list on retry success` — RED: `error-panel` testid does not exist

**Verification (RED phase confirmed):**

```
$ pnpm --filter frontend vitest run
 FAIL  ClienteListView.test.tsx — Failed to resolve import "./ClienteListView" (module not found)
 FAIL  ClienteListView.performance.test.tsx — Failed to resolve import "./ClienteListView" (module not found)
 Test Files  2 failed | 4 passed (6)   ← pre-existing suite (27 tests) unaffected
      Tests  27 passed (27)

$ npx playwright test e2e/tests/clientes/client-list-search.spec.ts --list
 12 tests in 1 file (3 tests × 4 browser projects) — discoverable, will fail at runtime
 against the current placeholder route (`<div data-testid="clientes-view">Clientes</div>`)
```

All failures are import/testid-not-found errors caused by missing implementation, not test bugs.

---

## Data Factories Created

### Cliente Factory

**File:** `frontend/src/test/factories/cliente.factory.ts`

**Exports:**

- `createCliente(overrides?)` — single `Cliente` with faker-generated `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`
- `createClientes(count, overrides?)` — bulk array (used by the 500-record NFR1 performance test)

**Example Usage:**

```typescript
const cliente = createCliente({ nombre: 'Comercializadora Andina SAS', nit: '900123456' });
const clientes = createClientes(500); // NFR1 performance fixture
```

---

## Fixtures / Infrastructure Created

### MSW Server (Component tests)

**File:** `frontend/src/test/msw/server.ts` + `frontend/src/test/msw/handlers.ts`

- `server` (`setupServer`) — started in `beforeAll`, reset in `afterEach`, closed in `afterAll` (`src/test/setup.ts`)
- `CLIENTES_ENDPOINT` (`*/api/v1/clientes`) — default success handler (5 clients); tests override per-scenario via `server.use(http.get(CLIENTES_ENDPOINT, ...))` **before** `renderWithRouter` triggers the mount-time fetch (network-first pattern)
- `onUnhandledRequest: 'error'` — fails fast if a test forgets to mock an endpoint it hits

### renderWithRouter (`withQueryClient` option)

**File:** `frontend/src/test/support/renderWithRouter.tsx`

- New opt-in `{ withQueryClient: true }` param wraps the router tree in a **fresh** `QueryClientProvider` per call (provider isolation, `component-tdd.md` Example 2), retries disabled so error-path assertions resolve immediately
- Backward compatible: default `false` preserves existing AppShell/NotFoundView test behavior (verified — 27 pre-existing tests unaffected)

**Example Usage:**

```typescript
renderWithRouter(<ClienteListView />, { initialPath: '/clientes', withQueryClient: true });
```

---

## Mock Requirements

### GET /api/v1/clientes Mock

**Endpoint:** `GET /api/v1/clientes`

**Success Response (200):**

```json
[
  { "id": "uuid", "nombre": "Comercializadora Andina SAS", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "2026-06-01T10:00:00.000Z" }
]
```

**Empty Response (200, AC #3):**

```json
[]
```

**Failure Response (500, AC #5):**

```json
{ "error": "unavailable" }
```

**Notes:** The component MUST NOT render the raw response body / `error.message` text under any circumstance (NFR6) — `ErrorPanel` must show only the fixed Spanish copy, never backend-provided strings.

---

## Required data-testid Attributes

### `/clientes` route (`ClienteListView`)

- `clientes-list-panel` — the 280px list panel container (must carry a `.panel-list` CSS class per UX spec)
- `cliente-search-input` — the search text input
- `cliente-list-item` — one per rendered client row (must show both `nombre` and `nit` as visible text)
- `empty-state-no-clients` — `EmptyState` variant shown when the dataset itself is empty (AC #3)
- `empty-state-search-empty` — `EmptyState` variant shown when a search matches zero clients (AC #4) — must be a **different** testid/element than `empty-state-no-clients`, not a shared component with a prop toggle that leaves both mounted
- `error-panel` — `ErrorPanel` container, shown instead of the list on fetch failure (AC #5); must contain a button matching accessible name `/reintentar/i`

**Implementation Example:**

```tsx
<div data-testid="clientes-list-panel" className="panel-list">
  <input data-testid="cliente-search-input" placeholder="Buscar cliente..." />
  {clientes.map((c) => (
    <div key={c.id} data-testid="cliente-list-item">
      <span>{c.nombre}</span>
      <span>{c.nit}</span>
    </div>
  ))}
</div>
```

---

## Implementation Checklist

### Test: ClienteListView.test.tsx (AC #1, #2, #3, #4)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `domain/entities/Cliente.ts`, `domain/repositories/IClienteRepository.ts`, `infrastructure/repositories/clienteApiRepository.ts`, `application/hooks/useClientes.ts` (Task 3 of story)
- [ ] Create `ClienteListView.tsx` rendering the search input + filtered list via `useMemo` over `useClientes()` cache data
- [ ] Create `ClientListItem.tsx` (`shared/components/`) showing `nombre` + `nit`
- [ ] Create `EmptyState.tsx` (`shared/components/`) with `no-clients` and `search-empty` variants, structurally distinct
- [ ] Add required data-testid attributes: `clientes-list-panel`, `cliente-search-input`, `cliente-list-item`, `empty-state-no-clients`, `empty-state-search-empty`
- [ ] Run test: `pnpm --filter frontend vitest run src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: ClienteListView.performance.test.tsx (AC #2, NFR1)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.performance.test.tsx`

**Tasks to make this test pass:**

- [ ] Ensure the client-side filter uses `useMemo` (not re-computed/re-fetched on unrelated renders)
- [ ] Confirm `useClientes()` fetches ALL records once (`queryKey: ['clientes']`, no `q` param) — filtering is purely in-memory
- [ ] Run test: `pnpm --filter frontend vitest run src/modules/crm/clientes/presentation/components/ClienteListView.performance.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (should pass once the AC#1/#2 implementation above is correct — isolates NFR1 as its own gate)

---

### Test: ClienteListView.test.tsx (AC #5 — ErrorPanel)

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `ErrorPanel.tsx` (`shared/components/`) accepting `onRetry: () => void`, rendering a "Reintentar" button, NEVER interpolating `error.message`
- [ ] Wire `useClientes()` `isError` state in `ClienteListView` to render `<ErrorPanel onRetry={refetch} />`
- [ ] Add data-testid: `error-panel`
- [ ] Run test: `pnpm --filter frontend vitest run src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: e2e/tests/clientes/client-list-search.spec.ts (AC #3, #4, #5 — full stack)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Tasks to make this test pass:**

- [ ] Replace the Story 1.2 placeholder in `frontend/src/routes/_app/clientes.tsx` with `<ClienteListView />`
- [ ] Confirm all data-testid attributes above are present in the real DOM (not just in isolated component tests)
- [ ] Run test: `npx playwright test e2e/tests/clientes/client-list-search.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour (mostly wiring, once component-level work above is done)

---

## Running Tests

```bash
# Run all failing tests for this story (component level)
pnpm --filter frontend vitest run src/modules/crm/clientes

# Run specific test file
pnpm --filter frontend vitest run src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx

# Run in watch mode
pnpm --filter frontend test:watch

# Run E2E tests for this story
npx playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run E2E in headed mode
npx playwright test e2e/tests/clientes/client-list-search.spec.ts --headed

# Run full frontend suite (regression check)
pnpm --filter frontend vitest run
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 18 component tests + 3 E2E tests written and failing (module/testid not found)
- ✅ `cliente.factory.ts` created with faker-based overrides
- ✅ MSW server/handlers created and wired into `setup.ts`
- ✅ `renderWithRouter` extended (backward compatible) for QueryClient provider isolation
- ✅ Mock requirements documented (success/empty/500 responses)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- `pnpm --filter frontend vitest run` → 2 new files fail on missing `ClienteListView` import; all 27 pre-existing tests still pass (no regression)
- `npx playwright test e2e/tests/clientes/client-list-search.spec.ts --list` → 12 tests (3 × 4 browser projects) discovered successfully
- `npx tsc --noEmit -p frontend/tsconfig.app.json` → only the 3 expected "Cannot find module" errors (ClienteListView × 2, Cliente entity × 1), no other type errors introduced

---

### GREEN Phase (DEV Team - Next Steps)

1. Pick one failing test from the Implementation Checklist above (start with AC #1/#2 — the core list+search path)
2. Implement minimal code to make it pass (Tasks 3-4 of the story file)
3. Run the test to verify green
4. Move to the next test (AC #3 → #4 → #5 → performance → E2E)
5. Repeat until all 21 tests pass

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 20 tests pass (16 functional component + 1 performance component + 3 E2E scenarios)
2. Review `ClienteListView.tsx` for readability/duplication with future Story 2.6 (Sort) which will extend the same component
3. Ensure tests still pass after each refactor
4. Confirm `dotnet test` (backend Task 5 tests, written separately by DEV) and `pnpm vitest run` both pass with zero failures before marking the story done

---

## Next Steps

1. Share this checklist and the failing test files with the dev-story workflow (manual handoff)
2. Implement one test at a time (RED → GREEN), starting with AC #1/#2
3. Run `pnpm --filter frontend vitest run` and `npx playwright test e2e/tests/clientes/client-list-search.spec.ts` frequently
4. When all tests pass, refactor with confidence
5. Update story status to reflect dev-story completion

---

## Knowledge Base References Applied

- **data-factories.md** — `createCliente`/`createClientes` faker-based factory with override support
- **network-first.md** — MSW handlers registered via `server.use()` before `renderWithRouter`/`page.route()` before `page.goto()` in every test
- **component-tdd.md** — Provider isolation (fresh `QueryClient` per test), Red-Green-Refactor structure
- **test-quality.md** — One behavior per test (performance isolated from functional suite), Given-When-Then comments, `data-testid` selectors only, no hard waits (`waitFor`/`findBy*` throughout)
- **test-levels-framework.md** — Component (Vitest+RTL) selected as primary level per test-design-epic-2.md; E2E reserved for the cross-cutting empty/error journeys not covered by the pre-existing CRUD spec

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm --filter frontend vitest run`

**Results:**

```
 FAIL  src/modules/crm/clientes/presentation/components/ClienteListView.performance.test.tsx
   Error: Failed to resolve import "./ClienteListView" — Does the file exist?
 FAIL  src/modules/crm/clientes/presentation/components/ClienteListView.test.tsx
   Error: Failed to resolve import "./ClienteListView" — Does the file exist?
 Test Files  2 failed | 4 passed (6)
      Tests  27 passed (27)   ← pre-existing suite, zero regressions
```

**Summary:**

- Total new tests: 17 (component-level: 16 functional + 1 performance) — currently fail at collection time (import resolution), confirming RED
- E2E new tests: 3 (× 4 browser projects = 12 runnable entries) — confirmed discoverable via `--list`, will fail at runtime against the current placeholder route
- Status: ✅ RED phase verified — all failures trace to missing implementation (`ClienteListView.tsx`, `Cliente.ts`, `EmptyState.tsx`, `ErrorPanel.tsx`, `ClientListItem.tsx`, `useClientes.ts`), not test defects

---

## Notes

- Backend tests (repository/endpoint xUnit, Task 5 of the story) are intentionally NOT generated by this ATDD pass — they are standard CQRS/Minimal API integration tests the DEV agent writes directly per company convention (`WebApplicationFactory<Program>`), and the story's own Task 5 already specifies them precisely (`ClienteRepositoryTests`, `ClienteEndpointsTests`). ATDD here focuses on the frontend-observable acceptance criteria.
- `TC-E2-P2-08` (backend `?q=` param, independent of frontend filter) is covered by the DEV-written backend integration test per Task 5, not duplicated here.
- The pre-existing `e2e/tests/clientes/clientes-crud.spec.ts` (FR1/FR2 against real API data) was left untouched — it already partially exercises AC #1/#2 with real data; this ATDD pass adds the mocked-network states (AC #3/#4/#5) that file does not cover, avoiding duplicate coverage per `test-levels-framework.md`.

---

**Generated by BMad TEA Agent** - 2026-07-01
