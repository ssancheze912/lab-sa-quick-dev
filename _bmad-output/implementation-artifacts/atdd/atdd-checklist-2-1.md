# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-05-20
**Story:** 2.1 — Client List & Search
**Epic:** 2 — Client Management
**Phase:** RED (failing tests written; implementation not yet started)

---

## Story Summary

**As a** commercial team member,
**I want** to see a list of all clients and search them by name or NIT/RUC,
**So that** I can quickly find the client I am looking for.

---

## Acceptance Criteria

1. **AC1** — Given there are clients in the system, When the user navigates to `/clientes`, Then the left panel (280px wide) shows a scrollable list of all clients And each item displays the client's Nombre and NIT/RUC.

2. **AC2** — Given the client list is loaded, When the user types in the search field, Then the list filters in real time showing only clients whose Nombre or NIT/RUC match the input And results appear in under 1 second with up to 500 records (NFR1) And no additional API call is made during typing — filtering is client-side.

3. **AC3** — Given there are no clients in the system, When the user navigates to `/clientes`, Then an `EmptyState` component is displayed with a message guiding the user to create the first client.

4. **AC4** — Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list And clicking "Reintentar" retries the API call.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (6 tests)

**File:** `e2e/tests/clientes/clientes-list.spec.ts`

- **Test: E2E-C-01** — el panel izquierdo renderiza todos los clientes al cargar la página
  - **Priority:** P0
  - **Status:** RED — `ClienteListPanel` component not implemented; `GET /api/v1/clientes` endpoint does not exist; `data-testid="clientes-list-panel"` and `data-testid="cliente-list-item"` selectors do not render
  - **Verifies:** AC1 — List panel visible; each client's nombre and NIT/RUC visible as list items; only one initial GET call made

- **Test: E2E-C-02** — buscar por nombre filtra la lista en tiempo real sin llamadas extra a la API
  - **Priority:** P0
  - **Status:** RED — `ClienteListPanel` not implemented; `searchInput` locator (`placeholder="Buscar por nombre o NIT/RUC"`) does not exist; filter `useMemo` logic not in place
  - **Verifies:** AC2 — Typing in search input filters visible items by Nombre; no additional `GET /api/v1/clientes` calls after initial load; only matching client visible

- **Test: E2E-C-03** — buscar por NIT/RUC filtra la lista en tiempo real
  - **Priority:** P1
  - **Status:** RED — Same blockers as E2E-C-02; NIT-based client-side filter not implemented
  - **Verifies:** AC2 — Typing a NIT value filters visible items by NIT; non-matching client not visible; no extra API calls

- **Test: E2E-C-04** — limpiar el campo de búsqueda restaura la lista completa
  - **Priority:** P1
  - **Status:** RED — `ClienteListPanel` and search input not implemented; `limpiarBusqueda()` has no effect on non-existent component
  - **Verifies:** AC2 (full list restore) — After clearing the search input both clients are visible again

- **Test: E2E-C-05** — EmptyState se muestra cuando no hay clientes en el sistema
  - **Priority:** P2
  - **Status:** RED — `EmptyState` component not implemented; `data-testid="empty-state"` selector does not render; API returns mocked empty array `[]`
  - **Verifies:** AC3 — `emptyState` locator visible; Spanish guidance text matches `/no hay clientes|primer cliente/i`; zero `cliente-list-item` elements rendered

- **Test: E2E-C-06** — ErrorPanel con botón "Reintentar" se muestra cuando la API devuelve 500
  - **Priority:** P2
  - **Status:** RED — `ErrorPanel` component not implemented; `data-testid="error-panel"` selector does not render; "Reintentar" button not present; retry-triggered re-fetch not wired
  - **Verifies:** AC4 — `error-panel` testId visible; "Reintentar" button visible; no client items rendered; clicking "Reintentar" triggers a new `GET /api/v1/clientes` call

---

### API Integration Tests — Playwright APIRequestContext (2 tests)

**File:** `e2e/tests/clientes/clientes-api.spec.ts`

- **Test: API-C-07** — GET /api/v1/clientes devuelve un array; cada item contiene id, nombre y nit
  - **Priority:** P1
  - **Status:** RED — `GET /api/v1/clientes` endpoint does not exist; response is `404 Not Found` or `ECONNREFUSED`
  - **Verifies:** AC1 — HTTP 200; body is a direct JSON array (no wrapper); each item has `id` (UUID v4), `nombre` (non-empty string), `nit` (non-empty string), `createdAt` (ISO 8601 with timezone — DateTimeOffset)

- **Test: API-C-07b** — GET /api/v1/clientes devuelve Content-Type application/json en condiciones normales
  - **Priority:** P1
  - **Status:** RED — Endpoint does not exist; Content-Type is not `application/json` (404 or ECONNREFUSED)
  - **Verifies:** AC1 (contract guard) — Status 200; `Content-Type` header contains `application/json` but NOT `problem+json`; body is a plain array with no `title` or `status` fields

---

## Total Tests in RED Phase

| Level | File | Count | Test IDs |
|---|---|---|---|
| E2E (Playwright) | `clientes-list.spec.ts` | 6 | E2E-C-01 through E2E-C-06 |
| API (Playwright APIRequestContext) | `clientes-api.spec.ts` | 2 | API-C-07, API-C-07b |
| **Total** | | **8** | |

---

## data-testid Attributes Required

The following `data-testid` attributes must be added to frontend components to make the E2E tests pass:

| Attribute | Component | File | Used By |
|---|---|---|---|
| `clientes-list-panel` | `ClienteListPanel` | `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` | E2E-C-01 |
| `cliente-list-item` | `ClientListItem` | `frontend/src/shared/components/ClientListItem.tsx` | E2E-C-01 through E2E-C-04 |
| `empty-state` | `EmptyState` | `frontend/src/shared/components/EmptyState.tsx` | E2E-C-05 |
| `error-panel` | `ErrorPanel` | `frontend/src/shared/components/ErrorPanel.tsx` | E2E-C-06 |

The search input is located via `placeholder` (`/buscar por nombre o nit\/ruc/i`) — no additional `data-testid` needed for this locator if the placeholder matches exactly.

---

## Mock / Intercept Strategy

| Test | Strategy | Detail |
|---|---|---|
| E2E-C-01, C-02, C-03, C-04 | `page.route('**/api/v1/clientes', route => route.continue())` — network-first intercept | Count API calls to assert no extra requests during typing |
| E2E-C-05 | `page.route('**/api/v1/clientes', route => route.fulfill({ status: 200, body: '[]' }))` before `goto()` | Intercept set up before navigation to avoid race condition |
| E2E-C-06 | `page.route('**/api/v1/clientes', route => route.fulfill({ status: 500 }))` before `goto()` | Intercept set up before navigation — simulates unavailable backend |
| API-C-07, C-07b | No mocking — direct `request.get()` against running backend | Requires backend running at `http://localhost:5000` |

---

## POM Locators Verified

The existing `e2e/pages/clientes.page.ts` POM covers all locators needed for Story 2.1:

| Locator | Property | Selector |
|---|---|---|
| List panel | `listPanel` | `getByTestId('clientes-list-panel')` |
| Search input | `searchInput` | `getByPlaceholder(/buscar cliente/i)` |
| Client items | `clienteItems` | `getByTestId('cliente-list-item')` |
| Empty state | `emptyState` | `getByTestId('empty-state')` |

**Note:** The `searchInput` locator uses `getByPlaceholder(/buscar cliente/i)`. The story specification defines `placeholder="Buscar por nombre o NIT/RUC"`. The regex `/buscar cliente/i` will NOT match this placeholder. The implementation must either:
  - Use `placeholder="Buscar cliente..."` (matches existing POM), OR
  - The POM `searchInput` must be updated to `getByPlaceholder(/buscar/i)` (broader match).

Recommendation: Update `clientes.page.ts` `searchInput` to `page.getByPlaceholder(/buscar/i)` to match any variant without coupling to exact placeholder wording.

---

## Implementation Checklist

### Test Group: E2E-C-01 — List panel renders all clients on page load

**Make this test pass by implementing:**

- [ ] Task 9 (Backend): Create `ClienteEntity` in `SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- [ ] Task 9 (Backend): Add `DbSet<ClienteEntity> Clientes` to `AppDbContext`
- [ ] Task 9 (Backend): Create `ClienteConfiguration.cs` with unique index on `nit`
- [ ] Task 9 (Backend): Run EF Core migration `AddClienteEntity`
- [ ] Task 10 (Backend): Create `GetClientesQuery`, `GetClientesQueryHandler`, `ClienteDto`
- [ ] Task 11 (Backend): Create `ClienteRepository` implementing `IClienteRepository`
- [ ] Task 12 (Backend): Create `ClienteEndpoints.cs` registering `GET /api/v1/clientes`
- [ ] Task 12 (Backend): Register endpoint in `Program.cs` via `app.MapClienteEndpoints()`
- [ ] Task 1 (Frontend): Create `Cliente` TypeScript interface
- [ ] Task 2 (Frontend): Create `clienteApiRepository.ts`
- [ ] Task 3 (Frontend): Create `useClientes` TanStack Query hook
- [ ] Task 4 (Frontend): Create `ClienteListPanel.tsx` with `data-testid="clientes-list-panel"` and `overflow-y-auto`
- [ ] Task 5 (Frontend): Create `ClientListItem.tsx` with `data-testid="cliente-list-item"`; display `nombre` and `nit`
- [ ] Task 8 (Frontend): Wire `ClienteListPanel` into `/clientes` route

---

### Test Group: E2E-C-02, E2E-C-03, E2E-C-04 — Client-side real-time search

**Make these tests pass by implementing:**

- [ ] Task 4 (Frontend): Add `useState('')` for `searchQuery` in `ClienteListPanel`
- [ ] Task 4 (Frontend): Add search input with `placeholder="Buscar por nombre o NIT/RUC"` and `aria-label="Buscar clientes"`; bind to `searchQuery`
- [ ] Task 4 (Frontend): Add `useMemo` filter over `data` array — case-insensitive match on `nombre` and `nit`
- [ ] Task 4 (Frontend): Render `filteredClientes` (NOT raw `data`) into the list
- [ ] Verify: no `?search=` query parameter sent to `GET /api/v1/clientes` — filtering is purely client-side

---

### Test Group: E2E-C-05 — EmptyState shown when no clients exist

**Make this test pass by implementing:**

- [ ] Task 6 (Frontend): Create `EmptyState.tsx` with `data-testid="empty-state"`
- [ ] Task 6 (Frontend): Default text: `"No hay clientes registrados"` and description `"Crea el primer cliente para comenzar."`
- [ ] Task 4 (Frontend): In `ClienteListPanel`, show `<EmptyState />` when `!isLoading && !isError && data.length === 0`

---

### Test Group: E2E-C-06 — ErrorPanel with "Reintentar" button on API failure

**Make this test pass by implementing:**

- [ ] Task 7 (Frontend): Create `ErrorPanel.tsx` with `data-testid="error-panel"`
- [ ] Task 7 (Frontend): Default message: `"No se pudo cargar la información"`
- [ ] Task 7 (Frontend): "Reintentar" button that calls `onRetry` prop; WCAG 2.1 AA accessible
- [ ] Task 4 (Frontend): In `ClienteListPanel`, show `<ErrorPanel onRetry={refetch} />` when `isError === true`
- [ ] Task 3 (Frontend): Expose `refetch` from `useClientes` hook return value

---

### Test Group: API-C-07, API-C-07b — GET /api/v1/clientes REST contract

**Make these tests pass by implementing:**

- [ ] Same backend tasks as E2E-C-01 (Tasks 9–12)
- [ ] Confirm response is a direct JSON array (no `{ data: [...] }` wrapper)
- [ ] Confirm `createdAt` serializes as ISO 8601 with timezone offset (DateTimeOffset, not DateTime)
- [ ] Confirm `id` is a UUID v4 string matching `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

---

## Running Tests

```bash
# Run all Story 2.1 E2E tests
npx playwright test e2e/tests/clientes/clientes-list.spec.ts

# Run Story 2.1 API integration tests
npx playwright test e2e/tests/clientes/clientes-api.spec.ts

# Run all Story 2.1 tests together
npx playwright test e2e/tests/clientes/clientes-list.spec.ts e2e/tests/clientes/clientes-api.spec.ts

# Run a specific test by ID
npx playwright test e2e/tests/clientes/clientes-list.spec.ts --grep "E2E-C-01"

# Run in headed mode for debugging
npx playwright test e2e/tests/clientes/clientes-list.spec.ts --headed

# Run with UI mode (interactive)
npx playwright test e2e/tests/clientes/ --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All 8 tests written and in failing state. Expected failure reasons before implementation:

- E2E-C-01 to E2E-C-06: `page.goto('/clientes')` loads; `data-testid="clientes-list-panel"` not found → `TimeoutError`
- API-C-07, API-C-07b: `GET http://localhost:5000/api/v1/clientes` → `404 Not Found` (endpoint not registered)

### GREEN Phase (DEV Team — Next Steps)

Priority order aligned with P0 → P1 → P2:

1. Implement backend Tasks 9–12 (entity, migration, repository, endpoint) — unblocks API-C-07, API-C-07b, E2E-C-01
2. Implement frontend Tasks 1–5, 8 (domain, repository, hook, list panel, list item) — unblocks E2E-C-01
3. Add search input and `useMemo` filter (Task 4) — unblocks E2E-C-02, E2E-C-03, E2E-C-04
4. Create `EmptyState` component (Task 6) and wire in panel — unblocks E2E-C-05
5. Create `ErrorPanel` component (Task 7) and wire in panel — unblocks E2E-C-06

### REFACTOR Phase (DEV Team — After All Tests Pass)

- Verify `useMemo` filter performs under 150ms with 500 records (NFR1)
- Confirm no `?search=` parameter ever appears in network requests during search
- Confirm `overflow-y-auto` on the 280px panel (scrollable list — AC1)
- Confirm all user-facing text is in Spanish

---

## Coverage Matrix — Story 2.1

| AC | Requirement | Test(s) | Level | Status |
|---|---|---|---|---|
| AC1 | 280px panel renders all clients with Nombre + NIT/RUC | E2E-C-01, API-C-07, API-C-07b | E2E + API | RED |
| AC2 | Real-time filter by Nombre (client-side, no extra API calls) | E2E-C-02, E2E-C-04 | E2E | RED |
| AC2 | Real-time filter by NIT/RUC (client-side) | E2E-C-03 | E2E | RED |
| AC2 (NFR1) | Filter results appear in under 1 second with 500 records | E2E-C-02 (timing assertion) | E2E | RED |
| AC3 | EmptyState shown when no clients | E2E-C-05 | E2E | RED |
| AC4 | ErrorPanel + Reintentar shown on API 500 | E2E-C-06 | E2E | RED |
| AC4 | Reintentar retries GET /api/v1/clientes | E2E-C-06 | E2E | RED |

**Coverage: 7/7 AC requirements addressed — 100%**

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-20
