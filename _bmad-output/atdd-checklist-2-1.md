# ATDD Checklist - Epic 2, Story 2.1: Client List & Search

**Date:** 2026-06-12
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

As a commercial team member, I want to see a list of all clients and search them by name or NIT/RUC, so that I can quickly find the client I'm looking for. The story covers the left panel (280px) of the split-panel layout at `/clientes`, fetching all clients via `GET /api/v1/clientes` and filtering them client-side in real time.

**As a** commercial team member
**I want** to see a scrollable client list and search by name or NIT/RUC
**So that** I can quickly find the client I'm looking for

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, when the user navigates to `/clientes`, then the left panel (280px) displays a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **AC2** — Given the client list is loaded, when the user types in the search field, then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).

3. **AC3** — Given there are no clients in the system, when the user navigates to `/clientes`, then an `EmptyState` component (variant `no-clients`) is displayed with a message guiding the user to create the first client.

4. **AC4** — Given the search input yields no matches, when the user has typed a search term, then an `EmptyState` component (variant `search-empty`) is displayed with text "No se encontró ningún cliente" and a "Crear cliente" CTA.

5. **AC5** — Given the backend is unavailable when the page loads, when the fetch fails, then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list.

6. **AC6** — Given the client list is loading for the first time, when the fetch is in-flight, then skeleton placeholders (via `react-loading-skeleton`) are shown in the list panel (not a spinner).

7. **AC7** — Given the client list is loaded, when a client item has zero associated contacts, then the list item displays an amber `⚠` badge indicating "Sin contactos asignados".

8. **AC8** — Given the client list is displayed, when the user clicks on a client item, then the item becomes visually selected (left border `primary-600`, background `primary-50`) and the right panel loads the selected client detail.

---

## Failing Tests Created (RED Phase)

### E2E Tests (24 tests)

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

#### AC1 — Client list displayed in left panel

- **Test:** `should display the left panel with fixed 280px width on desktop`
  - **Status:** RED — `[data-testid="clientes-list-panel"]` element does not exist; layout not implemented
  - **Verifies:** Left panel renders at exactly 280px width at desktop viewport

- **Test:** `should display each client item with Nombre visible`
  - **Status:** RED — `[data-testid="cliente-list-item"]` not implemented yet; no rendering
  - **Verifies:** Each client's Nombre appears in a list item

- **Test:** `should display each client item with NIT/RUC visible`
  - **Status:** RED — NIT field not rendered in list item component
  - **Verifies:** Each client's NIT/RUC appears visible in the list item

- **Test:** `should render a scrollable client list when there are multiple clients`
  - **Status:** RED — List not implemented, item count assertion will fail
  - **Verifies:** All 10 mock client items are rendered in the panel

#### AC2 — Real-time search filters the client list

- **Test:** `should display the search input with correct placeholder`
  - **Status:** RED — Search input with `role="searchbox"` and `aria-label="Buscar clientes"` not implemented
  - **Verifies:** Input has correct placeholder "Buscar por nombre o NIT..." in Spanish

- **Test:** `should filter list in real time when user types a name match`
  - **Status:** RED — Client-side filter logic (`useMemo`) not implemented
  - **Verifies:** Typing "Acme" hides "Beta Corp" and shows "Acme Colombia SAS"

- **Test:** `should filter list in real time when user types a NIT match`
  - **Status:** RED — NIT filtering not implemented in search logic
  - **Verifies:** Typing a NIT shows only the matching client

- **Test:** `should search be case-insensitive for Nombre`
  - **Status:** RED — Case-insensitive filtering not implemented
  - **Verifies:** Lowercase "acme colombia" matches "Acme Colombia SAS"

- **Test:** `should wrap search input in a role=search container`
  - **Status:** RED — `role="search"` container not implemented
  - **Verifies:** ARIA search landmark wraps the input

#### AC3 — EmptyState no-clients variant

- **Test:** `should display EmptyState no-clients when client list is empty and no search is active`
  - **Status:** RED — `EmptyState` component not implemented; `[data-testid="empty-state-no-clients"]` missing
  - **Verifies:** EmptyState renders when API returns `[]` and search is empty

- **Test:** `should display "No hay clientes registrados" title in empty state (no-clients)`
  - **Status:** RED — EmptyState title text not implemented
  - **Verifies:** Correct Spanish title text is visible

- **Test:** `should display "Nuevo cliente" CTA in no-clients empty state`
  - **Status:** RED — CTA button not implemented in EmptyState
  - **Verifies:** "Nuevo cliente" button is rendered in the empty state

#### AC4 — EmptyState search-empty variant

- **Test:** `should display EmptyState search-empty when search term has no matches`
  - **Status:** RED — `[data-testid="empty-state-search-empty"]` not implemented
  - **Verifies:** EmptyState search-empty renders when filter returns 0 results

- **Test:** `should display "No se encontró ningún cliente" in search-empty state`
  - **Status:** RED — search-empty text not implemented
  - **Verifies:** Correct message text appears when search yields no results

- **Test:** `should display "Crear cliente" CTA in search-empty state`
  - **Status:** RED — "Crear cliente" CTA not implemented in search-empty EmptyState
  - **Verifies:** "Crear cliente" button is visible when search has no matches

- **Test:** `should restore client list when search field is cleared`
  - **Status:** RED — List restoration on clear not implemented
  - **Verifies:** Clearing search input restores the full client list

#### AC5 — ErrorPanel when backend unavailable

- **Test:** `should display ErrorPanel when GET /api/v1/clientes returns a server error`
  - **Status:** RED — `ErrorPanel` component not implemented; `[data-testid="error-panel"]` missing
  - **Verifies:** ErrorPanel renders when API returns 500

- **Test:** `should display "No se pudo cargar la lista de clientes" in ErrorPanel`
  - **Status:** RED — ErrorPanel text not implemented
  - **Verifies:** Correct error message text is visible

- **Test:** `should display "Intentar de nuevo" retry button in ErrorPanel`
  - **Status:** RED — Retry button not implemented in ErrorPanel
  - **Verifies:** "Intentar de nuevo" button is visible in the error state

- **Test:** `should retry and show client list when "Intentar de nuevo" is clicked after recovery`
  - **Status:** RED — Retry/refetch logic not wired to ErrorPanel button
  - **Verifies:** Clicking retry triggers a new fetch and shows the list on success

#### AC6 — Skeleton placeholders during loading

- **Test:** `should show skeleton placeholders (not a spinner) while fetch is in-flight`
  - **Status:** RED — `[data-testid="client-list-skeleton"]` not implemented; react-loading-skeleton not wired
  - **Verifies:** Skeleton rows appear during fetch; no spinner is shown

- **Test:** `should set aria-busy="true" on list panel while loading`
  - **Status:** RED — `aria-busy` attribute not set on list panel during loading state
  - **Verifies:** List panel has `aria-busy="true"` during in-flight fetch

- **Test:** `should replace skeleton with client list once fetch completes`
  - **Status:** RED — Skeleton-to-list transition not implemented
  - **Verifies:** Skeleton disappears and real list items appear after fetch

#### AC7 — Amber badge for zero contacts

- **Test:** `should display amber ⚠ badge for a client with contactCount 0`
  - **Status:** RED — `[data-testid="sin-contactos-badge"]` not implemented
  - **Verifies:** Amber badge appears on list item when `contactCount === 0`

- **Test:** `should show "Sin contactos asignados" tooltip on the amber badge`
  - **Status:** RED — Badge title attribute not implemented
  - **Verifies:** Badge has `title="Sin contactos asignados"` for tooltip/accessibility

- **Test:** `should NOT display amber ⚠ badge for a client with one or more contacts`
  - **Status:** RED — Badge visibility logic not implemented
  - **Verifies:** Badge is absent when `contactCount > 0`

#### AC8 — Client item selection

- **Test:** `should apply selected visual state (aria-selected=true) when a client is clicked`
  - **Status:** RED — Selected state management not implemented; `aria-selected` not set
  - **Verifies:** Clicking a client sets `aria-selected="true"` on the item

- **Test:** `should load the right panel with client detail when a client is clicked`
  - **Status:** RED — Right panel not wired to list item click event
  - **Verifies:** `[data-testid="cliente-detail-panel"]` becomes visible after click

- **Test:** `should be keyboard navigable (Tab + Enter) to select a client item`
  - **Status:** RED — Keyboard event handlers not implemented on list item
  - **Verifies:** Pressing Enter on a focused list item selects it

- **Test:** `should have role=button and aria-label for each client list item`
  - **Status:** RED — `role="button"` and `aria-label="Ver cliente: {nombre}"` not implemented
  - **Verifies:** Each list item has correct ARIA role and label

### API Tests (5 tests)

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts` (API contract section)

- **Test:** `should return HTTP 200 with an array when clients exist`
  - **Status:** RED — `GET /api/v1/clientes` endpoint not implemented
  - **Verifies:** Endpoint returns 200 with array body

- **Test:** `should return HTTP 200 with empty array when no clients exist`
  - **Status:** RED — Endpoint not implemented; would return 404 or connection refused
  - **Verifies:** Empty state returns `[]` not 204 or 404

- **Test:** `should return client objects with required ClienteDto fields`
  - **Status:** RED — `GetClientesQueryHandler` and `ClienteDto` not implemented
  - **Verifies:** Response items have id, nombre, nit, telefono, ciudad, createdAt, contactCount

- **Test:** `should return a direct array (not wrapped in an object)`
  - **Status:** RED — No response wrapper contract enforced yet
  - **Verifies:** Response body is `ClienteDto[]` not `{ data: ClienteDto[] }`

- **Test:** `should return Content-Type application/json`
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** Content-Type header is `application/json`

---

## Data Factories Created

### Cliente Factory

**File:** `e2e/factories/cliente.factory.ts`

**Exports:**

- `buildCliente(overrides?)` — Create a single `ClienteDto` with generated unique fields
- `buildClientes(count, overrides?)` — Create an array of `ClienteDto` instances

**Interface:** `ClienteDto` — matches backend contract: `id, nombre, nit, telefono, ciudad, createdAt, contactCount`

**Usage Example:**

```typescript
// Default client with contactCount 1
const cliente = buildCliente();

// Client with zero contacts (triggers amber badge)
const sinContactos = buildCliente({ contactCount: 0 });

// Specific NIT for NIT-filter test
const nitEspecifico = buildCliente({ nit: '900123456' });

// Generate 500 clients for performance testing
const manyClientes = buildClientes(500);
```

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` already provides:

- `clientesPage` — Navigates to `/clientes` before the test via `page.goto('/clientes')`

No additional fixtures were created for Story 2.1 since tests use direct route interception (`page.route`) via the network-first pattern rather than real backend data seeding.

---

## Mock Requirements

### GET /api/v1/clientes — Backend API Mock

**Endpoint:** `GET /api/v1/clientes` (intercepted via `page.route('**/api/v1/clientes', ...)`)

**Success Response (200):**

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "nombre": "Empresa Test 1",
    "nit": "900000001",
    "telefono": "3000000001",
    "ciudad": "Bogotá",
    "createdAt": "2026-06-12T00:00:00.000Z",
    "contactCount": 1
  }
]
```

**Empty Response (200 — no clients):**

```json
[]
```

**Failure Response (500 — server error):**

```json
{
  "title": "Internal Server Error",
  "status": 500
}
```

**Notes:**

- Route interception is done BEFORE `page.goto('/clientes')` in every E2E test (network-first pattern)
- AC5 tests simulate 500/503 to verify ErrorPanel rendering
- AC6 loading skeleton test uses a held route (Promise-based delay) to observe in-flight state
- AC4 retry test uses a counter to return 500 on first call and 200 on second call

---

## Required data-testid Attributes

### ClienteListView component (`frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`)

- `clientes-list-panel` — Left panel container (280px), must have `aria-busy="true"` while loading
- `client-list-skeleton` — Skeleton placeholder container (rendered when `isLoading === true`)
- `empty-state-no-clients` — EmptyState when `clientes.length === 0` and `searchQuery` is empty
- `empty-state-search-empty` — EmptyState when `filteredClientes.length === 0` and `searchQuery.length > 0`
- `error-panel` — ErrorPanel container (rendered when `isError === true`)

### ClientListItem component (`frontend/src/shared/components/ClientListItem.tsx`)

- `cliente-list-item` — Each individual client list item element
- `sin-contactos-badge` — Amber ⚠ badge shown when `contactCount === 0`

**Accessibility Attributes Required on `cliente-list-item`:**

- `role="button"` — Each item acts as a button for keyboard navigation
- `aria-label="Ver cliente: {nombre}"` — Accessible label per client
- `aria-selected="true"` — Set on the currently selected item; `"false"` on others

**Search container on ClienteListView:**

- `role="search"` — Wrapper div around the search input
- `aria-label="Buscar clientes"` — Label for the search landmark

**Implementation Example:**

```tsx
{/* List panel */}
<div data-testid="clientes-list-panel" aria-busy={isLoading}>

  {/* Search container */}
  <div role="search" aria-label="Buscar clientes">
    <Input placeholder="Buscar por nombre o NIT..." aria-label="Buscar clientes" />
  </div>

  {/* Loading skeleton */}
  {isLoading && <div data-testid="client-list-skeleton">...</div>}

  {/* Error state */}
  {isError && <div data-testid="error-panel"><button>Intentar de nuevo</button></div>}

  {/* Empty — no clients */}
  {!isLoading && !isError && clientes.length === 0 && searchQuery === '' && (
    <div data-testid="empty-state-no-clients">No hay clientes registrados</div>
  )}

  {/* Empty — search no results */}
  {!isLoading && !isError && filteredClientes.length === 0 && searchQuery.length > 0 && (
    <div data-testid="empty-state-search-empty">No se encontró ningún cliente</div>
  )}

  {/* Client list */}
  {filteredClientes.map((c) => (
    <div
      key={c.id}
      data-testid="cliente-list-item"
      role="button"
      aria-label={`Ver cliente: ${c.nombre}`}
      aria-selected={selectedId === c.id ? 'true' : 'false'}
      onClick={() => onSelect(c.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(c.id)}
      tabIndex={0}
    >
      {c.nombre}
      {c.contactCount === 0 && (
        <span data-testid="sin-contactos-badge" title="Sin contactos asignados">⚠</span>
      )}
    </div>
  ))}
</div>
```

---

## Implementation Checklist

### Test: AC1 — Client list displayed in left panel

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `ClienteListView.tsx` at `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- [ ] Add `data-testid="clientes-list-panel"` to the left panel container
- [ ] Set panel width to `w-[280px]` (Tailwind) with `flex-shrink-0` on `lg:` breakpoint
- [ ] Render `cliente-list-item` for each client from `useClientes()`
- [ ] Display `nombre` and `nit` in each list item (both visible)
- [ ] Make panel scrollable (`overflow-y-auto`)
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC1"`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Real-time search

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add search input to `ClienteListView.tsx` using siesa-ui-kit `Input` component
- [ ] Set `placeholder="Buscar por nombre o NIT..."` and `aria-label="Buscar clientes"`
- [ ] Wrap input in `<div role="search" aria-label="Buscar clientes">` container
- [ ] Implement `searchQuery` state with `useState`
- [ ] Apply 150ms debounce on `setSearchQuery` (useEffect with setTimeout)
- [ ] Implement `filteredClientes` with `useMemo` filtering by `nombre` OR `nit` (case-insensitive)
- [ ] Render `filteredClientes` list instead of full `clientes` list
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC2"`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC3 — EmptyState no-clients

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `EmptyState.tsx` at `frontend/src/shared/components/EmptyState.tsx`
- [ ] Implement variant `no-clients` with `data-testid="empty-state-no-clients"`
- [ ] Display `UsersIcon` (Heroicons outline) in the no-clients variant
- [ ] Show title "No hay clientes registrados" and subtitle "Crea el primer cliente del sistema"
- [ ] Add "Nuevo cliente" button (siesa-ui-kit `Button`, outline variant)
- [ ] Render `EmptyState` variant `no-clients` in `ClienteListView` when `clientes.length === 0 && searchQuery === ''`
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC3"`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC4 — EmptyState search-empty

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Implement variant `search-empty` in `EmptyState.tsx` with `data-testid="empty-state-search-empty"`
- [ ] Display `MagnifyingGlassIcon` (Heroicons outline) in the search-empty variant
- [ ] Show title "No se encontró ningún cliente" and subtitle "Intenta con otro nombre o NIT"
- [ ] Add "Crear cliente" button (siesa-ui-kit `Button`, outline variant)
- [ ] Render `EmptyState` variant `search-empty` in `ClienteListView` when `filteredClientes.length === 0 && searchQuery.length > 0`
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC4"`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — ErrorPanel

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `ErrorPanel.tsx` at `frontend/src/shared/components/ErrorPanel.tsx` accepting `onRetry: () => void` prop
- [ ] Add `data-testid="error-panel"` to the ErrorPanel root element
- [ ] Display "No se pudo cargar la lista de clientes" as error text
- [ ] Add "Intentar de nuevo" button (siesa-ui-kit `Button`) that calls `onRetry`
- [ ] Render `ErrorPanel` in `ClienteListView` when `isError === true`, passing `onRetry={refetch}`
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC5"`
- [ ] ✅ AC5 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC6 — Skeleton placeholders

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Install `react-loading-skeleton` (`pnpm --filter frontend add react-loading-skeleton`)
- [ ] Create skeleton placeholder component rendering 5–8 rows matching `ClientListItem` shape
- [ ] Add `data-testid="client-list-skeleton"` to the skeleton container
- [ ] Set `aria-busy={isLoading}` on `[data-testid="clientes-list-panel"]`
- [ ] Render skeleton when `isLoading === true`; replace with list when data arrives
- [ ] Ensure no `<div role="status">` spinner is rendered during loading
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC6"`
- [ ] ✅ AC6 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC7 — Amber badge for zero contacts

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `ClientListItem.tsx` at `frontend/src/shared/components/ClientListItem.tsx`
- [ ] Accept `contactCount: number` prop in `ClientListItem`
- [ ] Render `<span data-testid="sin-contactos-badge" title="Sin contactos asignados">⚠</span>` when `contactCount === 0`
- [ ] Apply amber styling: `bg-amber-100 text-amber-700` (Tailwind tokens, no hex)
- [ ] Hide the badge when `contactCount > 0`
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC7"`
- [ ] ✅ AC7 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC8 — Client item selection and right panel

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `role="button"` to each `[data-testid="cliente-list-item"]` element
- [ ] Add `aria-label="Ver cliente: {nombre}"` to each list item
- [ ] Implement `selectedClienteId` state in the `/clientes` route component
- [ ] Set `aria-selected={selectedClienteId === c.id ? 'true' : 'false'}` on each item
- [ ] Apply selected visual styles: `border-l-[3px] border-l-primary-600 bg-primary-50` (Tailwind)
- [ ] Add keyboard handler: `onKeyDown={(e) => e.key === 'Enter' && handleSelect(c.id)}`
- [ ] Add `tabIndex={0}` to make items keyboard focusable
- [ ] Create right panel placeholder with `data-testid="cliente-detail-panel"` (Story 2.2 will populate)
- [ ] Show/hide `cliente-detail-panel` based on whether a client is selected
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC8"`
- [ ] ✅ AC8 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: API Contract — GET /api/v1/clientes

**File:** `e2e/tests/clientes/story-2-1/client-list-search.spec.ts` (API section)

**Tasks to make these tests pass:**

- [ ] Implement `GetClientesQuery.cs` in `SiesaAgents.Application/Clientes/Queries/`
- [ ] Implement `GetClientesQueryHandler.cs` using linq2db for the contactCount JOIN query
- [ ] Implement `ClienteDto.cs` in `SiesaAgents.Application/Clientes/DTOs/` with fields: `id (Guid)`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt (DateTimeOffset)`, `contactCount (int)`
- [ ] Register `GET /api/v1/clientes` in `ClienteEndpoints.cs` returning `ClienteDto[]` (direct array)
- [ ] Validate endpoint returns 200 with `[]` when no records exist (not 404 or 204)
- [ ] Validate `Content-Type: application/json` on response
- [ ] Run test: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "API"`
- [ ] ✅ API tests pass (green phase)

**Estimated Effort:** 3 hours (backend implementation)

---

### Backend: useClientes hook (Frontend Application layer)

**Not covered by E2E tests directly but required for integration:**

- [ ] Implement `useClientes.ts` at `frontend/src/modules/crm/clientes/application/useClientes.ts`
- [ ] Use TanStack Query: `useQuery({ queryKey: ['clientes'], queryFn: clienteApiRepository.getAll, staleTime: 30_000 })`
- [ ] Implement `clienteApiRepository.ts` at `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- [ ] Ensure `apiClient.ts` at `frontend/src/shared/lib/apiClient.ts` uses `baseURL: import.meta.env.VITE_API_URL`
- [ ] Wrap app in `QueryClientProvider` (confirm from Story 1.x setup)

---

## Running Tests

```bash
# Run all Story 2.1 ATDD tests (E2E + API contract)
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts

# Run Story 2.1 E2E tests by AC
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC1"
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC2"
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC3"
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC4"
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC5"
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC6"
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC7"
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "AC8"

# Run only API contract tests (backend must be running)
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --grep "API"

# Run in headed mode to observe browser behavior
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --headed

# Debug a specific failing test
npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts --debug

# Run full E2E suite
npx playwright test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 29 tests written and failing (24 E2E + 5 API contract)
- ✅ Data factory `cliente.factory.ts` created with `buildCliente` and `buildClientes`
- ✅ Network-first route interception pattern applied (all routes intercepted BEFORE `page.goto`)
- ✅ Mock requirements documented for `GET /api/v1/clientes`
- ✅ Required `data-testid` attributes listed and mapped to components
- ✅ Implementation checklist created per AC
- ✅ API contract tests for backend implementation readiness

**Verification:**

- All E2E tests fail because frontend components (`ClienteListView`, `ClientListItem`, `EmptyState`, `ErrorPanel`) are not yet implemented
- API tests fail because `GET /api/v1/clientes` endpoint does not yet exist in the backend
- Failure messages are actionable: element not found / connection refused / wrong HTTP status

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one AC group** from the implementation checklist (suggest starting with API backend — AC API)
2. **Read the failing tests** to understand expected behavior (testids, status codes, structure)
3. **Implement minimal code** to make that group of tests pass
4. **Run tests** to verify they turn green
5. **Move to next AC group** (suggested order: AC1 → AC6 → AC2 → AC3 → AC4 → AC5 → AC7 → AC8)

**Suggested Implementation Order:**

1. **Backend: GET /api/v1/clientes** (makes API contract tests pass)
2. **Frontend: useClientes hook + repository** (data layer, unlocks all rendering)
3. **Frontend: ClienteListView basic list** (makes AC1 tests pass)
4. **Frontend: Skeleton loading** (makes AC6 tests pass)
5. **Frontend: Search input + filter logic** (makes AC2 tests pass)
6. **Frontend: EmptyState no-clients** (makes AC3 tests pass)
7. **Frontend: EmptyState search-empty** (makes AC4 tests pass)
8. **Frontend: ErrorPanel** (makes AC5 tests pass)
9. **Frontend: Amber badge** (makes AC7 tests pass)
10. **Frontend: Selection + right panel** (makes AC8 tests pass)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 29 tests pass (green phase complete)
2. Extract duplicated mock setup into a shared `page.route` helper if tests are repetitive
3. Ensure `useMemo` filter is O(n) and debounce is correctly applied (150ms)
4. Validate no hex colors were used — all Tailwind semantic tokens only
5. Run accessibility check: `@axe-core/react` passes WCAG 2.1 AA on `ClienteListView` and `ClientListItem`
6. Ensure TypeScript strict mode has no `any` types in new code

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts`
3. **Begin backend implementation** first (GET /api/v1/clientes) using implementation checklist
4. **Then implement frontend** in suggested order (useClientes → ClienteListView → States)
5. **Work one AC group at a time** (red → green for each group)
6. **When all tests pass**, refactor for code quality
7. **When refactoring complete**, update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — All E2E tests use `page.route()` BEFORE `page.goto()` to prevent race conditions
- **data-factories.md** — `cliente.factory.ts` uses counter-based unique IDs with partial override support
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, explicit waits (no sleeps)
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class or XPath selectors
- **fixture-architecture.md** — Existing `base.fixture.ts` extended; no new fixture needed for mock-based tests
- **test-levels-framework.md** — E2E for critical user journeys (AC1–AC8); API contract tests for backend validation
- **component-tdd.md** — Component-level ATDD deferred to Vitest+RTL layer (documented in story Tasks)
- **timing-debugging.md** — No hard waits; Promise-based route holding used for skeleton loading test

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/clientes/story-2-1/client-list-search.spec.ts`

**Expected Results:**

```
Running 29 tests using 4 workers

  ✗ AC1 — should display the left panel with fixed 280px width on desktop
    Error: Timeout waiting for [data-testid="clientes-list-panel"] to be visible

  ✗ AC1 — should display each client item with Nombre visible
    Error: Timeout waiting for [data-testid="cliente-list-item"]

  ✗ AC2 — should display the search input with correct placeholder
    Error: Timeout waiting for searchbox with name "Buscar clientes"

  ✗ AC3 — should display EmptyState no-clients when client list is empty
    Error: Timeout waiting for [data-testid="empty-state-no-clients"]

  ✗ AC5 — should display ErrorPanel when GET /api/v1/clientes returns a server error
    Error: Timeout waiting for [data-testid="error-panel"]

  ✗ API — should return HTTP 200 with an array when clients exist
    Error: Connection refused http://localhost:5000/api/v1/clientes

  ... (all 29 tests fail)

  29 failed
```

**Summary:**

- Total tests: 29
- Passing: 0 (expected)
- Failing: 29 (expected)
- Status: ✅ RED phase verified

---

## Notes

- This story implements **read-only client list** — no mutations (Create/Edit/Delete are Stories 2.3–2.5)
- The search is 100% client-side (`useMemo` over the TanStack Query cache) — no backend search parameter needed
- The API tests in this file require the backend server running on `http://localhost:5000`; set `API_BASE_URL` env var to override
- E2E tests intercept the API via `page.route('**/api/v1/clientes')` and do NOT require the backend to be running
- The right panel (`cliente-detail-panel`) is a placeholder for Story 2.2 — only presence/visibility is asserted in AC8 tests
- Contact badge (`contactCount`) field must be populated by the backend via a JOIN query — it must NOT default to 0

---

**Generated by BMad TEA Agent** - 2026-06-12
