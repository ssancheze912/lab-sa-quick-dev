# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-23
**Author:** TEA Agent (claude-sonnet-4-6)
**Primary Test Levels:** Component (Vitest + RTL + MSW) + Unit (Vitest hook) + Backend Unit (xUnit)

---

## Story Summary

Story 2.1 establishes the client list display and real-time search in the split-panel layout.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px) renders a scrollable list of all clients, each item showing Nombre and NIT/RUC.

2. **AC2** — Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, with results appearing in under 1 second for up to 500 records (NFR1), and no additional API call is triggered.

3. **AC3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed with a message guiding the user to create their first client, and no list items are rendered.

4. **AC4** — Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, and clicking "Reintentar" triggers a re-fetch.

5. **AC5** — Given the client list is loaded, When the user clears the search field after filtering, Then all clients are visible again.

---

## Failing Tests Created (RED Phase)

### Unit Tests — Vitest (useClientes hook) — 7 tests

**File:** `frontend/src/modules/crm/clientes/application/useClientes.test.ts`

#### Data fetching (4 tests)

- **Test:** `should return 3 clients when GET /api/v1/clientes responds with 3 records`
  - **Status:** RED — `useClientes` hook does not exist yet
  - **Verifies:** AC1 — hook returns correct data

- **Test:** `should set isLoading=true initially and isLoading=false after fetch completes`
  - **Status:** RED — `useClientes` does not exist yet
  - **Verifies:** AC1 — loading state lifecycle

- **Test:** `should return clients with all required fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt`
  - **Status:** RED — `useClientes` and `Cliente` domain type do not exist yet
  - **Verifies:** AC1 — DTO shape correctness

- **Test:** `should use queryKey ["clientes"] for TanStack Query cache`
  - **Status:** RED — canonical query key `['clientes']` not yet defined
  - **Verifies:** AC1 — TanStack Query cache key architecture rule

#### Error handling (3 tests)

- **Test:** `should set isError=true when GET /api/v1/clientes returns a network error`
  - **Status:** RED — `useClientes` does not exist yet
  - **Verifies:** AC4 — error flag exposed (not raw error.message)

- **Test:** `should set isError=true when GET /api/v1/clientes returns HTTP 500`
  - **Status:** RED — `useClientes` does not exist yet
  - **Verifies:** AC4 — HTTP 500 triggers error state

- **Test:** `should expose a refetch function for retry capability (AC4)`
  - **Status:** RED — `useClientes` does not exist yet
  - **Verifies:** AC4 — refetch function required by ErrorPanel

---

### Component Tests — Vitest + RTL + MSW (ClienteListPanel) — 20 tests

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx`

#### TC-E2-P1-01 — AC1: Renders all clients (7 tests)

- **Test:** `should render the left panel with data-testid="clientes-list-panel"`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC1 — panel container with testid

- **Test:** `should render exactly 3 client items when API returns 3 records`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC1 — correct count of list items (TC-E2-P1-01)

- **Test:** `should display Nombre for each client item`
  - **Status:** RED — `ClienteListPanel` and `ClienteListItem` do not exist yet
  - **Verifies:** AC1 — Nombre visible per item

- **Test:** `should display NIT/RUC for each client item`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC1 — NIT/RUC visible per item

- **Test:** `should render the list container with role="list"`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC1 / WCAG 2.1 AA — accessible list role

- **Test:** `should render each item with role="listitem"`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC1 / WCAG 2.1 AA — accessible listitem role

- **Test:** `should render the search input with aria-label="Buscar clientes"`
  - **Status:** RED — search input does not exist yet
  - **Verifies:** AC2 / WCAG 2.1 AA — accessible search label

- **Test:** `should render search input with placeholder "Buscar por nombre o NIT/RUC..."`
  - **Status:** RED — search input does not exist yet
  - **Verifies:** AC2 — correct placeholder text in Spanish

#### TC-E2-P1-02 — AC3: EmptyState when no clients (3 tests)

- **Test:** `should render EmptyState component when API returns empty array`
  - **Status:** RED — `EmptyState` component does not exist yet
  - **Verifies:** AC3 — EmptyState rendered (TC-E2-P1-02)

- **Test:** `should display a guiding message when no clients exist`
  - **Status:** RED — `EmptyState` component does not exist yet
  - **Verifies:** AC3 — guidance message with role="status"

- **Test:** `should NOT render any list items when API returns empty array`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC3 — zero list items in empty state

#### TC-E2-P1-03 — AC4: ErrorPanel + Reintentar (4 tests)

- **Test:** `should render ErrorPanel when GET /api/v1/clientes returns network error`
  - **Status:** RED — `ErrorPanel` component does not exist yet
  - **Verifies:** AC4 — ErrorPanel rendered with role="alert" (TC-E2-P1-03)

- **Test:** `should display a "Reintentar" button inside ErrorPanel`
  - **Status:** RED — `ErrorPanel` component does not exist yet
  - **Verifies:** AC4 — button labeled exactly "Reintentar"

- **Test:** `should re-fetch and render clients when Reintentar is clicked after error`
  - **Status:** RED — `ErrorPanel.onRetry` not wired to `refetch` yet
  - **Verifies:** AC4 — retry triggers re-fetch and renders list

- **Test:** `should NOT render client list items when in error state`
  - **Status:** RED — `ClienteListPanel` error path does not exist yet
  - **Verifies:** AC4 — no list items during error

#### TC-E2-P1-04 — AC2: Real-time search by Nombre (4 tests)

- **Test:** `should filter list to show only matching client when Nombre is typed`
  - **Status:** RED — search + filter logic does not exist yet
  - **Verifies:** AC2 — Nombre filter (TC-E2-P1-04)

- **Test:** `should perform case-insensitive Nombre filtering`
  - **Status:** RED — filter logic does not exist yet
  - **Verifies:** AC2 — case-insensitive matching

- **Test:** `should NOT trigger an additional API call when typing in search field (AC2/NFR1)`
  - **Status:** RED — filter must be client-side via useMemo
  - **Verifies:** AC2 / NFR1 — no extra API call

- **Test:** `should show all clients when search term has no match`
  - **Status:** RED — filter logic does not exist yet
  - **Verifies:** AC2 — zero results on non-matching term

#### TC-E2-P1-05 — AC2+AC5: Search by NIT/RUC + clear restores full list (3 tests)

- **Test:** `should filter list to show only matching client when NIT/RUC is typed`
  - **Status:** RED — filter logic does not exist yet
  - **Verifies:** AC2 — NIT/RUC filter (TC-E2-P1-05)

- **Test:** `should restore full list when search field is cleared (AC5)`
  - **Status:** RED — filter + clear logic does not exist yet
  - **Verifies:** AC5 — clearing search restores all items (TC-E2-P1-05)

- **Test:** `should NOT trigger an extra API call when filtering by NIT/RUC (NFR1)`
  - **Status:** RED — filter must be client-side
  - **Verifies:** AC2 / NFR1 — no extra API call on NIT search

#### TC-E2-P2-06 — NFR1: Filter 500 records under 1 second (1 test)

- **Test:** `should filter 500 mock clients in under 1000ms (NFR1)`
  - **Status:** RED — `ClienteListPanel` and filter logic do not exist yet
  - **Verifies:** AC2 / NFR1 — performance requirement (TC-E2-P2-06)

---

### Backend Unit Tests — xUnit (GetClientesQueryHandler) — 5 tests

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`

- **Test:** `HandleAsync_WhenNoClientsExist_ReturnsEmptyList`
  - **Status:** RED — `GetClientesQueryHandler`, `IClienteRepository`, `GetClientesQuery` do not exist yet
  - **Verifies:** AC1 / TC-E2-P1-17 — empty list from empty repository

- **Test:** `HandleAsync_WhenClientsExist_MapsEntityFieldsToDtoCorrectly`
  - **Status:** RED — `ClienteEntity`, `ClienteDto`, `GetClientesQueryHandler` do not exist yet
  - **Verifies:** AC1 / TC-E2-P1-17 — entity-to-DTO field mapping

- **Test:** `HandleAsync_WhenClientsExist_DtoHasNonEmptyId`
  - **Status:** RED — `ClienteEntity` (and its Guid auto-assignment) does not exist yet
  - **Verifies:** AC1 / TC-E2-P1-17 — DTO Id is valid Guid

- **Test:** `HandleAsync_WhenClientsExist_DtoHasDateTimeOffsetTimestamps`
  - **Status:** RED — `ClienteEntity` with DateTimeOffset fields does not exist yet
  - **Verifies:** AC1 / TC-E2-P1-17 — DateTimeOffset (never DateTime) architectural rule

- **Test:** `HandleAsync_WhenMultipleClientsExist_ReturnsAllClients`
  - **Status:** RED — `GetClientesQueryHandler` does not exist yet
  - **Verifies:** AC1 / TC-E2-P1-17 — returns all 3 clients

- **Test:** `HandleAsync_PassesCancellationToken_ToRepository`
  - **Status:** RED — `GetClientesQueryHandler` does not exist yet
  - **Verifies:** AC1 — CancellationToken correctly forwarded to repository

---

### E2E Tests — Playwright (Story 2.1 full-stack, AC1)

**File:** `e2e/tests/clientes/client-list-and-search.spec.ts` *(already created in previous workflow)*

- **Test:** `AC1 — should render the left client list panel (280px) when navigating to /clientes`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC1 — panel visible at `/clientes`

- **Test:** `AC1 — should display Nombre and NIT/RUC for each client item in the list`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC1 — both fields per item

- **Test:** `AC1 — should render exactly the number of client items returned by the API`
  - **Status:** RED — `ClienteListPanel` does not exist yet
  - **Verifies:** AC1 — item count matches API

- **Test:** `AC1 — should render the search input field above the client list`
  - **Status:** RED — search input does not exist yet
  - **Verifies:** AC2 — search input present

- **Test:** `AC1 — full-stack: should list a real client created via API`
  - **Status:** RED — backend endpoint and `ClienteListPanel` do not exist yet
  - **Verifies:** AC1 — full-stack integration

---

## Summary of RED Tests (Failing — Require Implementation)

| # | Test | File | AC | TC |
|---|------|------|----|----|
| 1 | `should return 3 clients when GET /api/v1/clientes responds with 3 records` | useClientes.test.ts | AC1 | TC-E2-P1-01 |
| 2 | `should set isLoading=true initially...` | useClientes.test.ts | AC1 | TC-E2-P1-01 |
| 3 | `should return clients with all required fields` | useClientes.test.ts | AC1 | TC-E2-P1-17 |
| 4 | `should use queryKey ["clientes"]` | useClientes.test.ts | AC1 | TC-E2-P1-01 |
| 5 | `should set isError=true ... network error` | useClientes.test.ts | AC4 | TC-E2-P1-03 |
| 6 | `should set isError=true ... HTTP 500` | useClientes.test.ts | AC4 | TC-E2-P1-03 |
| 7 | `should expose a refetch function` | useClientes.test.ts | AC4 | TC-E2-P1-03 |
| 8 | `should render left panel with data-testid="clientes-list-panel"` | ClienteListPanel.test.tsx | AC1 | TC-E2-P1-01 |
| 9 | `should render exactly 3 client items` | ClienteListPanel.test.tsx | AC1 | TC-E2-P1-01 |
| 10 | `should display Nombre for each client item` | ClienteListPanel.test.tsx | AC1 | TC-E2-P1-01 |
| 11 | `should display NIT/RUC for each client item` | ClienteListPanel.test.tsx | AC1 | TC-E2-P1-01 |
| 12 | `should render list container with role="list"` | ClienteListPanel.test.tsx | AC1 | TC-E2-P1-01 |
| 13 | `should render each item with role="listitem"` | ClienteListPanel.test.tsx | AC1 | TC-E2-P1-01 |
| 14 | `should render search input with aria-label="Buscar clientes"` | ClienteListPanel.test.tsx | AC2 | TC-E2-P1-04 |
| 15 | `should render search input with placeholder "Buscar por nombre o NIT/RUC..."` | ClienteListPanel.test.tsx | AC2 | TC-E2-P1-04 |
| 16 | `should render EmptyState when API returns empty array` | ClienteListPanel.test.tsx | AC3 | TC-E2-P1-02 |
| 17 | `should display guiding message when no clients exist` | ClienteListPanel.test.tsx | AC3 | TC-E2-P1-02 |
| 18 | `should NOT render list items when API returns empty array` | ClienteListPanel.test.tsx | AC3 | TC-E2-P1-02 |
| 19 | `should render ErrorPanel on network error` | ClienteListPanel.test.tsx | AC4 | TC-E2-P1-03 |
| 20 | `should display "Reintentar" button inside ErrorPanel` | ClienteListPanel.test.tsx | AC4 | TC-E2-P1-03 |
| 21 | `should re-fetch and render clients when Reintentar is clicked` | ClienteListPanel.test.tsx | AC4 | TC-E2-P1-03 |
| 22 | `should NOT render list items when in error state` | ClienteListPanel.test.tsx | AC4 | TC-E2-P1-03 |
| 23 | `should filter list to show only matching client when Nombre is typed` | ClienteListPanel.test.tsx | AC2 | TC-E2-P1-04 |
| 24 | `should perform case-insensitive Nombre filtering` | ClienteListPanel.test.tsx | AC2 | TC-E2-P1-04 |
| 25 | `should NOT trigger additional API call when typing in search` | ClienteListPanel.test.tsx | AC2 | TC-E2-P1-04 |
| 26 | `should show no items when search term has no match` | ClienteListPanel.test.tsx | AC2 | TC-E2-P1-04 |
| 27 | `should filter by NIT/RUC when typed` | ClienteListPanel.test.tsx | AC2 | TC-E2-P1-05 |
| 28 | `should restore full list when search field is cleared` | ClienteListPanel.test.tsx | AC5 | TC-E2-P1-05 |
| 29 | `should NOT trigger extra API call when filtering by NIT/RUC` | ClienteListPanel.test.tsx | AC2 | TC-E2-P1-05 |
| 30 | `should filter 500 mock clients in under 1000ms (NFR1)` | ClienteListPanel.test.tsx | AC2 | TC-E2-P2-06 |
| 31 | `HandleAsync_WhenNoClientsExist_ReturnsEmptyList` | GetClientesQueryHandlerTests.cs | AC1 | TC-E2-P1-17 |
| 32 | `HandleAsync_WhenClientsExist_MapsEntityFieldsToDtoCorrectly` | GetClientesQueryHandlerTests.cs | AC1 | TC-E2-P1-17 |
| 33 | `HandleAsync_WhenClientsExist_DtoHasNonEmptyId` | GetClientesQueryHandlerTests.cs | AC1 | TC-E2-P1-17 |
| 34 | `HandleAsync_WhenClientsExist_DtoHasDateTimeOffsetTimestamps` | GetClientesQueryHandlerTests.cs | AC1 | TC-E2-P1-17 |
| 35 | `HandleAsync_WhenMultipleClientsExist_ReturnsAllClients` | GetClientesQueryHandlerTests.cs | AC1 | TC-E2-P1-17 |
| 36 | `HandleAsync_PassesCancellationToken_ToRepository` | GetClientesQueryHandlerTests.cs | AC1 | TC-E2-P1-17 |

**Total RED tests (new): 36**
**E2E tests (already exist in client-list-and-search.spec.ts): 5**
**Grand total (new + existing E2E): 41 tests**

---

## data-testid Attributes Required

The following `data-testid` attributes must be added during implementation for tests to pass:

| Attribute | Element | Component | AC |
|-----------|---------|-----------|-----|
| `clientes-list-panel` | Left panel container div | `ClienteListPanel` | AC1 |
| `cliente-list-item` | Each client row | `ClienteListPanel` (list items) | AC1 |
| `empty-state` | Empty state wrapper | `EmptyState` | AC3 |

Additional required attributes inferred from `ClientesPage` POM:
- `cliente-detail-panel` — right panel (scope: Story 2.2)

---

## Mock Requirements

### MSW Handlers Required

```typescript
// Default handler (success with 3 clients)
http.get('*/api/v1/clientes', () => HttpResponse.json([...3 clients]))

// Error handler (override per test)
http.get('*/api/v1/clientes', () => HttpResponse.error())

// Empty handler (override per test)
http.get('*/api/v1/clientes', () => HttpResponse.json([]))

// 500 handler (override per test)
http.get('*/api/v1/clientes', () => new HttpResponse(null, { status: 500 }))

// 500-record handler (NFR1 performance test)
http.get('*/api/v1/clientes', () => HttpResponse.json([...500 clients]))
```

---

## Required Implementation to Make RED Tests GREEN

### Frontend

**Task 1 — Domain types:**
- [ ] `frontend/src/modules/crm/clientes/domain/Cliente.ts` — export `Cliente` interface (`id, nombre, nit, telefono, ciudad, createdAt, updatedAt`)
- [ ] `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — `getAll(): Promise<Cliente[]>`

**Task 2 — API Repository:**
- [ ] `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — calls `GET /api/v1/clientes` via `apiClient`

**Task 3 — useClientes hook:**
- [ ] `frontend/src/modules/crm/clientes/application/useClientes.ts` — `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll })` returning `{ data, isLoading, isError, refetch }`

**Task 4 — Shared components:**
- [ ] `frontend/src/shared/components/EmptyState.tsx` — `role="status"`, `data-testid="empty-state"`, accepts `message: string`
- [ ] `frontend/src/shared/components/ErrorPanel.tsx` — `role="alert"`, button labeled exactly "Reintentar", accepts `onRetry: () => void`

**Task 5 — ClienteListPanel:**
- [ ] `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`
  - `data-testid="clientes-list-panel"` on root div
  - Skeleton loading (react-loading-skeleton, NOT spinner) while `isLoading`
  - `<ErrorPanel onRetry={refetch} />` when `isError`
  - `<EmptyState />` when `data.length === 0`
  - `role="list"` on list container; each item `role="listitem"` + `data-testid="cliente-list-item"`
  - `<input aria-label="Buscar clientes" placeholder="Buscar por nombre o NIT/RUC...">` search field
  - `useMemo` filter by `nombre` OR `nit` (case-insensitive) — no extra API call

### Backend

**Task 7 — Domain entity:**
- [ ] `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` — private constructor + `static Create(...)` factory + `DateTimeOffset` timestamps

**Task 8 — Repository interface:**
- [ ] `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — `GetAllAsync`, `GetByIdAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`

**Task 10 — DTO + Query + Handler:**
- [ ] `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record with all 7 fields
- [ ] `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — empty record
- [ ] `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — calls `IClienteRepository.GetAllAsync()`, maps to `IEnumerable<ClienteDto>`

---

## Running Tests

```bash
# Frontend — component + unit tests
cd frontend && pnpm exec vitest run src/modules/crm/clientes/application/useClientes.test.ts
cd frontend && pnpm exec vitest run src/modules/crm/clientes/presentation/ClienteListPanel.test.tsx

# Frontend — all Story 2.1 tests
cd frontend && pnpm exec vitest run --reporter=verbose src/modules/crm/clientes/

# Backend — unit tests
cd backend && dotnet test tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --filter "FullyQualifiedName~GetClientesQueryHandler"

# E2E — Story 2.1
pnpm exec playwright test e2e/tests/clientes/client-list-and-search.spec.ts

# All Story 2.1 tests
cd frontend && pnpm exec vitest run src/modules/crm/clientes/ && cd ../backend && dotnet test tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~GetClientesQueryHandler"
```

---

## Acceptance Criteria Coverage Matrix

| AC | Story | Test Cases | Test Files | Level |
|----|-------|------------|------------|-------|
| AC1 — Left panel with Nombre + NIT per item | 2.1 | TC-E2-P1-01, TC-E2-P1-17 | ClienteListPanel.test.tsx, useClientes.test.ts, GetClientesQueryHandlerTests.cs, client-list-and-search.spec.ts | Component + Unit + E2E |
| AC2 — Real-time search, no extra API call, < 1s | 2.1 | TC-E2-P1-04, TC-E2-P1-05, TC-E2-P2-06 | ClienteListPanel.test.tsx | Component + Performance |
| AC3 — EmptyState when no clients | 2.1 | TC-E2-P1-02 | ClienteListPanel.test.tsx | Component |
| AC4 — ErrorPanel + Reintentar + retry | 2.1 | TC-E2-P1-03 | ClienteListPanel.test.tsx, useClientes.test.ts | Component + Unit |
| AC5 — Clear search restores full list | 2.1 | TC-E2-P1-05 | ClienteListPanel.test.tsx | Component |

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) — All 36 new tests failing

**Verification of RED state:**
- Frontend unit/component tests fail with `Cannot find module './useClientes'` and `Cannot find module './ClienteListPanel'`
- Backend unit tests fail with `The type or namespace name 'GetClientesQueryHandler' could not be found`
- E2E tests fail because `ClienteListPanel` component is not rendered at `/clientes`
- All failures are due to missing implementation — NOT test bugs

### GREEN Phase (DEV Team)

**Recommended implementation order (fastest path to green):**

1. Create `Cliente.ts` + `IClienteRepository.ts` (domain types — unblocks all frontend tests)
2. Create `clienteApiRepository.ts` (infrastructure)
3. Create `useClientes.ts` (application hook — makes 7 hook unit tests pass)
4. Create `EmptyState.tsx` + `ErrorPanel.tsx` (shared components)
5. Create `ClienteListPanel.tsx` with search + filter (makes 20+ component tests pass)
6. Create backend domain + application layer: `ClienteEntity.cs`, `IClienteRepository.cs`, `ClienteDto.cs`, `GetClientesQuery.cs`, `GetClientesQueryHandler.cs` (makes 6 backend unit tests pass)
7. Wire `ClienteListPanel` into `/clientes` route (makes E2E tests pass)

### REFACTOR Phase (After All Tests Pass)

1. Confirm `data-testid` attributes are on the correct DOM elements
2. Confirm `role="list"` + `role="listitem"` + `role="alert"` + `role="status"` are correctly placed
3. Confirm filter uses `useMemo` (not re-computed on every render)
4. Confirm `ErrorPanel.onRetry` is wired to TanStack Query's `refetch` (not a manual state reset)
5. Confirm all user-facing text is in Spanish
6. Verify NFR1 test passes consistently on CI (not just local machine speed)

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-23
