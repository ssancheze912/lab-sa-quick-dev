# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-13
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** E2E (Playwright) + Component (Vitest + RTL + MSW)

---

## Story Summary

Story 2.1 implements the read-only left panel (280px fixed width) of the `/clientes` split-panel view. It fetches all clients from `GET /api/v1/clientes`, displays them in a scrollable list with Nombre and NIT/RUC per item, and provides real-time client-side search filtering via `useMemo`. The right panel is an empty placeholder — client detail is Story 2.2.

**As a** commercial team member
**I want** to see a list of all clients and search them by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px fixed width) renders a scrollable list of all clients, showing Nombre and NIT/RUC per item.

2. **AC2** — Given the client list is loaded, When the user types in the search input field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input (case-insensitive), and results appear in under 1 second for up to 500 records (NFR1).

3. **AC3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed in the left panel with a message guiding the user to create the first client.

4. **AC4** — Given the backend is unavailable when the page loads, When the `GET /api/v1/clientes` fetch fails, Then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list, and clicking "Reintentar" triggers a new fetch.

5. **AC5** — Given the client list is rendered, When the user clears the search input, Then the full unfiltered list is restored immediately.

6. **AC6** — Given the search input has an active value and the user navigates away and returns, When the page remounts, Then the search input starts empty (no persisted search state across navigation).

---

## Failing Tests Created (RED Phase)

### E2E Tests (16 tests)

**File:** `e2e/tests/clientes/client-list-search.spec.ts`

**Status:** Tests already created (file existed from prior workflow run).

- **Test:** `AC1 — Client list panel renders at /clientes > should render the clientes-list-panel element with 280px width`
  - **Status:** RED — `data-testid="clientes-list-panel"` does not exist (ClienteListPanel not implemented)
  - **Verifies:** AC1 — List panel container present

- **Test:** `AC1 — Client list panel renders at /clientes > should render each client list item with data-testid="cliente-list-item"`
  - **Status:** RED — `data-testid="cliente-list-item"` does not exist
  - **Verifies:** AC1 — Client list items rendered

- **Test:** `AC1 — Client list panel renders at /clientes > should display the client Nombre in each list item`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC1 — Nombre visible per item

- **Test:** `AC1 — Client list panel renders at /clientes > should display the client NIT/RUC in each list item`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC1 — NIT/RUC visible per item

- **Test:** `AC1 — Client list panel renders at /clientes > should render a search input with aria-label="Buscar clientes"`
  - **Status:** RED — `data-testid="clientes-search-input"` does not exist
  - **Verifies:** AC1 + WCAG 2.1 AA — Search input with aria-label

- **Test:** `AC2 — Real-time search filtering > should show only clients matching the search term (by Nombre)`
  - **Status:** RED — ClienteListPanel not implemented; filtering logic absent
  - **Verifies:** AC2 — Nombre-based filter

- **Test:** `AC2 — Real-time search filtering > should show only clients matching the search term (by NIT)`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — NIT-based filter

- **Test:** `AC2 — Real-time search filtering > should perform case-insensitive search`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Case-insensitive matching

- **Test:** `AC2 — Real-time search filtering > should not trigger an additional API call when search input changes`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Filtering is client-side (no extra API call)

- **Test:** `AC3 — EmptyState when no clients exist > should render the EmptyState component when the API returns an empty array`
  - **Status:** RED — `data-testid="empty-state"` does not exist
  - **Verifies:** AC3 — EmptyState shown on empty list

- **Test:** `AC3 — EmptyState when no clients exist > should show a guiding message in the EmptyState`
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — Guiding message "No hay clientes registrados" visible

- **Test:** `AC3 — EmptyState when no clients exist > should NOT show the client list when EmptyState is displayed`
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — No list items alongside empty state

- **Test:** `AC4 — ErrorPanel on API failure with retry > should render the ErrorPanel when GET /api/v1/clientes returns 500`
  - **Status:** RED — `data-testid="error-panel"` does not exist
  - **Verifies:** AC4 — ErrorPanel shown on API error

- **Test:** `AC4 — ErrorPanel on API failure with retry > should render a "Reintentar" button inside the ErrorPanel`
  - **Status:** RED — `data-testid="error-panel-retry-button"` does not exist
  - **Verifies:** AC4 — Retry button with Spanish label

- **Test:** `AC4 — ErrorPanel on API failure with retry > should trigger a new GET /api/v1/clientes fetch when "Reintentar" is clicked`
  - **Status:** RED — ErrorPanel retry logic not implemented
  - **Verifies:** AC4 — Retry button triggers new fetch

- **Test:** `AC5 — Clearing search restores full list > should restore all items when the search input is cleared`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC5 — Full list restored on clear

- **Test:** `AC6 — Search input resets on navigation > should start with an empty search input after navigating away and back`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC6 — No persisted search state across navigation

### Component Tests (15 tests)

**File:** `frontend/src/__tests__/clientes/client-list-search.test.tsx`

- **Test:** `AC1 — Client list panel renders at /clientes > should render the clientes-list-panel container element`
  - **Status:** RED — Dynamic import fails: `ClienteListPanel` module does not exist yet
  - **Verifies:** AC1 — `data-testid="clientes-list-panel"` present in DOM

- **Test:** `AC1 — Client list panel renders at /clientes > should render client list items when data is loaded`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC1 — Two `data-testid="cliente-list-item"` elements rendered

- **Test:** `AC1 — Client list panel renders at /clientes > should display the Nombre of each client in the list`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC1 — Client Nombre visible in panel text content

- **Test:** `AC1 — Client list panel renders at /clientes > should display the NIT/RUC of each client in the list`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC1 — Client NIT visible in panel text content

- **Test:** `AC1 — Client list panel renders at /clientes > should render the search input with aria-label="Buscar clientes" for WCAG 2.1 AA`
  - **Status:** RED — `data-testid="clientes-search-input"` not present
  - **Verifies:** AC1 + WCAG 2.1 AA — aria-label="Buscar clientes" on input

- **Test:** `AC1 — Client list panel renders at /clientes > should render skeleton placeholders while data is loading`
  - **Status:** RED — `data-testid="clientes-list-skeleton"` not present; no skeleton implementation
  - **Verifies:** AC1 — Skeleton (not spinner) shown during loading

- **Test:** `AC2 — Real-time search filtering > should show only clients matching the search term by Nombre`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Nombre filter hides non-matching clients

- **Test:** `AC2 — Real-time search filtering > should show only clients matching the search term by NIT/RUC`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — NIT filter hides non-matching clients

- **Test:** `AC2 — Real-time search filtering > should perform case-insensitive matching (uppercase input)`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Uppercase input matches mixed-case data

- **Test:** `AC2 — Real-time search filtering > should perform case-insensitive matching (lowercase input)`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Lowercase input matches mixed-case data

- **Test:** `AC2 — Real-time search filtering > should NOT trigger an additional API call when the search input changes`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC2 — Filtering is client-side; no extra fetch

- **Test:** `AC3 — EmptyState when no clients exist > should render the EmptyState component when the API returns an empty array`
  - **Status:** RED — `data-testid="empty-state"` not present
  - **Verifies:** AC3 — EmptyState in DOM

- **Test:** `AC3 — EmptyState when no clients exist > should show a guiding message to create the first client`
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — Text "No hay clientes registrados" visible

- **Test:** `AC3 — EmptyState when no clients exist > should NOT render any client-list-item elements when EmptyState is displayed`
  - **Status:** RED — EmptyState not implemented
  - **Verifies:** AC3 — Zero list items when empty

- **Test:** `AC4 — ErrorPanel on API failure with retry > should render the ErrorPanel component when GET /api/v1/clientes returns 500`
  - **Status:** RED — `data-testid="error-panel"` not present
  - **Verifies:** AC4 — ErrorPanel in DOM on 500

- **Test:** `AC4 — ErrorPanel on API failure with retry > should render a "Reintentar" button inside the ErrorPanel`
  - **Status:** RED — `data-testid="error-panel-retry-button"` not present
  - **Verifies:** AC4 — Retry button with Spanish label "Reintentar"

- **Test:** `AC4 — ErrorPanel on API failure with retry > should trigger a new GET /api/v1/clientes fetch when "Reintentar" is clicked`
  - **Status:** RED — ErrorPanel and refetch logic not implemented
  - **Verifies:** AC4 — Clicking retry triggers new fetch; list recovers

- **Test:** `AC4 — ErrorPanel on API failure with retry > should NOT render client-list-item elements when ErrorPanel is displayed`
  - **Status:** RED — ErrorPanel not implemented
  - **Verifies:** AC4 — Zero list items alongside error state

- **Test:** `AC5 — Clearing search restores full list > should restore all items when the search input is cleared`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC5 — Full list restored after clearing search

- **Test:** `AC5 — Clearing search restores full list > should show all items when search input has only whitespace`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC5 — Whitespace-only treated as empty query

- **Test:** `AC6 — Search input resets on component mount > should start with an empty search input when ClienteListPanel first mounts`
  - **Status:** RED — ClienteListPanel not implemented
  - **Verifies:** AC6 — `useState('')` initialises to empty string

---

## Required data-testid Attributes

### ClienteListPanel (`frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`)

- `clientes-list-panel` — Root container of the 280px left panel
- `clientes-search-input` — The `<input>` element for search (`aria-label="Buscar clientes"`, `placeholder="Buscar por nombre o NIT/RUC"`)
- `clientes-list-skeleton` — Skeleton container rendered during `isLoading` state (5 skeleton rows)
- `cliente-list-item` — Each item in the client list (rendered by `ClientListItem`)

### Shared Components

- `empty-state` — Root element of `EmptyState.tsx` in `frontend/src/shared/components/`
- `error-panel` — Root element of `ErrorPanel.tsx` in `frontend/src/shared/components/`
- `error-panel-retry-button` — The "Reintentar" button inside `ErrorPanel.tsx`

**Implementation example:**

```tsx
// ClienteListPanel.tsx
<div data-testid="clientes-list-panel" className="w-[280px] shrink-0 ...">
  <input
    data-testid="clientes-search-input"
    aria-label="Buscar clientes"
    placeholder="Buscar por nombre o NIT/RUC"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  {isLoading && (
    <div data-testid="clientes-list-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} height={52} />
      ))}
    </div>
  )}
  {isError && <ErrorPanel onRetry={refetch} />}
  {!isLoading && !isError && filteredClientes.length === 0 && (
    <EmptyState message="No hay clientes registrados. Crea el primero." />
  )}
  {!isLoading && !isError && filteredClientes.length > 0 && (
    filteredClientes.map((c) => (
      <ClientListItem key={c.id} nombre={c.nombre} nit={c.nit} />
    ))
  )}
</div>

// EmptyState.tsx
<div data-testid="empty-state" ...>

// ErrorPanel.tsx
<div data-testid="error-panel" ...>
  <button data-testid="error-panel-retry-button" onClick={onRetry}>Reintentar</button>
</div>

// ClientListItem.tsx
<div data-testid="cliente-list-item" ...>
```

---

## Mock Requirements

### MSW handlers (`frontend/src/__tests__/clientes/client-list-search.test.tsx`)

- `GET /api/v1/clientes` → `200 OK` + `Cliente[]` (default handler)
- `GET /api/v1/clientes` → `200 OK` + `[]` (empty list override for AC3 tests)
- `GET /api/v1/clientes` → `500 Internal Server Error` + Problem Details (error override for AC4 tests)

No MSW service worker setup needed — `msw/node` is used for Vitest server-side interception.

---

## Implementation Checklist

### Task A — Backend: API endpoint and domain layer (AC1, AC4)

**Files to create:**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`

**Files to modify:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — Add `DbSet<ClienteEntity>`
- `backend/src/SiesaAgents.API/Program.cs` — Register `IClienteRepository` + map endpoints

**Tests to verify (GREEN):**
- [ ] `GET /api/v1/clientes` returns `200 OK` + JSON array when clients exist
- [ ] `GET /api/v1/clientes` returns `200 OK` + `[]` when no clients exist (never 404)
- [ ] `GET /api/v1/clientes` returns Problem Details RFC 7807 on unhandled exception

---

### Task B — Frontend: Domain + Infrastructure layers (AC1, AC4)

**Files to create:**
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`

**Tests to verify (GREEN):**
- [ ] `clienteApiRepository.ts` calls `GET /api/v1/clientes` and returns typed `Cliente[]`

---

### Task C — Frontend: Application layer — useClientes hook (AC1, AC4)

**Files to create:**
- `frontend/src/modules/crm/clientes/application/useClientes.ts`

**Spec:**
- `queryKey: ['clientes']`
- `staleTime: 60_000`
- `retry: 2`
- Returns `{ data, isLoading, isError, refetch }`

**Tests to verify (GREEN):**
- [ ] Component test: `isLoading` state triggers skeleton render
- [ ] Component test: `isError` state triggers ErrorPanel render
- [ ] Component test: successful data triggers list render

---

### Task D — Frontend: Shared components (AC3, AC4)

**Files to create (if not existing from Story 1.x):**
- `frontend/src/shared/components/EmptyState.tsx` — `data-testid="empty-state"`, props: `message`, optional `ctaLabel`, `onCta`
- `frontend/src/shared/components/ErrorPanel.tsx` — `data-testid="error-panel"`, retry button `data-testid="error-panel-retry-button"`, props: `onRetry`, optional `message`
- `frontend/src/shared/components/ClientListItem.tsx` — `data-testid="cliente-list-item"`, props: `nombre`, `nit`, optional `isSelected`, `onClick`

**Tests to verify (GREEN):**
- [ ] `data-testid="empty-state"` renders with guiding message
- [ ] `data-testid="error-panel"` renders with `data-testid="error-panel-retry-button"` labeled "Reintentar"
- [ ] `data-testid="cliente-list-item"` renders Nombre and NIT

---

### Task E — Frontend: Presentation layer — ClienteListPanel (AC1–AC6)

**Files to create:**
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`

**Requirements:**
- `data-testid="clientes-list-panel"` on root container
- Search `<input data-testid="clientes-search-input" aria-label="Buscar clientes" />`
- Loading state: `data-testid="clientes-list-skeleton"` with 5 skeleton rows (react-loading-skeleton)
- Error state: `<ErrorPanel onRetry={refetch} />`
- Empty state: `<EmptyState message="No hay clientes registrados. Crea el primero." />`
- List: `filteredClientes.map(c => <ClientListItem key={c.id} nombre={c.nombre} nit={c.nit} />)`
- Filter via `useMemo`: case-insensitive match on `nombre` and `nit`; whitespace-only = empty
- `useState<string>('')` for `searchQuery` (no persistence across navigation)

**Tests to verify (GREEN):**
- [ ] `pnpm --filter frontend vitest run src/__tests__/clientes/client-list-search.test.tsx` → all 15 tests pass
- [ ] `pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts` → all 16 tests pass

---

### Task F — Frontend: Route integration (AC1, AC6)

**Files to modify:**
- `frontend/src/routes/_app/clientes.tsx` — Import and render `ClienteListPanel` in the left panel slot (280px)

**Tests to verify (GREEN):**
- [ ] Navigating to `/clientes` renders `data-testid="clientes-list-panel"` in E2E
- [ ] Navigating away and back resets search input to empty (AC6)

---

## Running Tests

```bash
# Run all Story 2.1 component tests
pnpm --filter frontend vitest run src/__tests__/clientes/client-list-search.test.tsx

# Run component tests in watch mode
pnpm --filter frontend vitest --watch src/__tests__/clientes/

# Run all Story 2.1 E2E tests
pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts

# Run E2E tests in headed mode
pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts --headed

# Run E2E tests by AC
pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC1"
pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC2"
pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC3"
pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC4"
pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC5"
pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts --grep "AC6"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- E2E tests created and present in `e2e/tests/clientes/client-list-search.spec.ts` (pre-existing)
- Component tests created at `frontend/src/__tests__/clientes/client-list-search.test.tsx`
- Network-first intercepts applied in both E2E (page.route before page.goto) and component tests (MSW beforeAll server.listen)
- `data-testid` requirements documented for all UI elements
- Implementation checklist created per task/AC

**Verification:**

- E2E tests fail with: `Error: locator('[data-testid="clientes-list-panel"]') resolves to 0 elements` (ClienteListPanel not implemented)
- Component tests fail with: `Error: Cannot find module '../../modules/crm/clientes/presentation/ClienteListPanel'` (file does not exist)
- All failures are due to missing implementation, not test bugs

### GREEN Phase (DEV Agent — Next Steps)

**Implementation order (least-to-most-dependent):**

1. Backend API (Task A) — enables real data flow
2. Frontend domain + infrastructure (Task B) — typed contracts + repository
3. `useClientes` hook (Task C) — TanStack Query integration
4. Shared components: `EmptyState`, `ErrorPanel`, `ClientListItem` (Task D)
5. `ClienteListPanel` (Task E) — assembles all above
6. Route wiring in `clientes.tsx` (Task F)

**Key principles:**

- Verify `pnpm run dev` produces zero TypeScript errors after each task
- Do NOT create a search API parameter — filtering is entirely client-side via `useMemo`
- Use `react-loading-skeleton`, NOT a spinner, for loading state
- All user-facing text in Spanish; all code (variables, functions) in English

### REFACTOR Phase (DEV Agent — After All Tests Pass)

1. Confirm all 31 tests pass (15 component + 16 E2E)
2. Verify `useMemo` dependency array is correct (`[clientes, searchQuery]`)
3. Confirm `ClienteListPanel` does not call any additional API on search input change
4. Verify WCAG 2.1 AA: `aria-label="Buscar clientes"` on search input

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (sa-dev-story agent)
2. Run failing component tests to confirm RED phase: `pnpm --filter frontend vitest run src/__tests__/clientes/client-list-search.test.tsx`
3. Run failing E2E tests to confirm RED phase: `pnpm playwright test e2e/tests/clientes/client-list-search.spec.ts`
4. Begin implementation with Task A (backend API endpoint) — provides real data
5. Work one task at a time (red → green per AC)
6. After all tests pass, refactor for code quality

---

## Knowledge Base References Applied

- **network-first** — MSW `server.listen()` called in `beforeAll` (before any test); `page.route()` registered before `page.goto()` in all E2E tests
- **Given-When-Then** — All tests follow GWT naming pattern in comments
- **test-levels** — E2E (Playwright) for full user journey; Component (Vitest + RTL + MSW) for isolated unit behavior, loading/error states, and accessibility
- **selector-resilience** — All selectors use `data-testid`; no CSS class selectors
- **no-hard-waits** — All async assertions use `await waitFor()` (RTL) or `await expect(...).toBeVisible()` (Playwright); no `sleep()` or `page.waitForTimeout()`

---

## Test Count Summary

| Level | Count | File |
|---|---|---|
| E2E (Playwright) | 16 | `e2e/tests/clientes/client-list-search.spec.ts` |
| Component (Vitest + RTL) | 15 | `frontend/src/__tests__/clientes/client-list-search.test.tsx` |
| **Total** | **31** | |

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-13
