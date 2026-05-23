# ATDD Checklist — Epic 2, Story 2.2: Client Detail View

**Date:** 2026-05-20
**Story:** 2.2 — Client Detail View
**Epic:** 2 — Client Management
**Phase:** RED (failing tests written; implementation not yet started)

---

## Story Summary

**As a** commercial team member,
**I want** to view the complete details of a client by selecting them from the list,
**So that** I can review all their information without navigating away from the clients section.

---

## Acceptance Criteria

1. **AC1** — Given the client list is displayed, When the user clicks on a client item in the left panel, Then the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad AND the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **AC2** — Given the user navigates directly to `/clientes/:clienteId` (deep link), When the page loads, Then the correct client details are loaded and displayed without requiring prior list interaction (FR30).

3. **AC3** — Given a `clienteId` in the URL does not exist in the system, When the page loads, Then a not-found message is displayed gracefully in the right panel AND no unhandled JavaScript error is thrown.

4. **AC4** — Given the `/clientes` route is loaded and no client has been selected, When the right panel is visible, Then a default empty state or placeholder is shown (no blank/broken UI).

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (5 tests)

**File:** `e2e/tests/clientes/clientes-detail.spec.ts`

- **Test: E2E-C-07** — hacer clic en un cliente muestra Nombre, NIT, Teléfono y Ciudad en el panel derecho
  - **Priority:** P0
  - **AC:** AC1, AC-E2.3
  - **Status:** RED — `ClienteDetailPanel` component not implemented; `data-testid="cliente-detail-panel"` does not exist; clicking a list item does not update the right panel; `seleccionarCliente()` click has no route effect
  - **Verifies:** After clicking a client in the list panel, the detail panel (`data-testid="cliente-detail-panel"`) shows the client's Nombre, NIT/RUC, Teléfono, and Ciudad

- **Test: E2E-C-08** — la URL se actualiza a /clientes/:clienteId al hacer clic en un cliente
  - **Priority:** P1
  - **AC:** AC1 (FR30)
  - **Status:** RED — `ClienteListPanel` does not yet wire `navigate({ to: '/clientes/$clienteId' })` on click; clicking a list item does not change the URL
  - **Verifies:** After `seleccionarCliente(nombre)`, `page.url()` matches `/clientes/{uuid}` pattern; TanStack Router deep-link URL is set

- **Test: E2E-C-09** — navegación directa a /clientes/:clienteId carga el detalle sin interacción previa con la lista
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `clientes.$clienteId.tsx` route does not exist; `page.goto('/clientes/:id')` renders nothing or 404-like state; `ClienteDetailPanel` not rendered; `useCliente` hook not implemented
  - **Verifies:** Direct `page.goto('/clientes/' + cliente.id)` renders the detail panel with all 4 fields without clicking any list item

- **Test: E2E-C-10** — navegar a un clienteId inexistente muestra mensaje "no encontrado" sin errores de JS
  - **Priority:** P1
  - **AC:** AC3 (Risk R6)
  - **Status:** RED — `ClienteDetailPanel` 404 branch not implemented; no "Cliente no encontrado" text rendered; `page.on('pageerror', fn)` listener asserts zero JS errors (which may pass coincidentally) but the visible text assertion will fail
  - **Verifies:** Route with `nonExistentId` shows text matching `/cliente no encontrado/i`; `data-testid="cliente-detail-panel"` visible; zero `pageerror` events fired

- **Test: E2E-C-07-EMPTY** — el panel derecho muestra un placeholder cuando no hay cliente seleccionado
  - **Priority:** P1
  - **AC:** AC4
  - **Status:** RED — `/clientes` route right panel shows blank content instead of an `EmptyState`; text matching `/selecciona un cliente/i` not present; `data-testid="cliente-detail-loading"` assertion may vary
  - **Verifies:** At `/clientes` with no `:clienteId` param, the right-panel area shows Spanish placeholder text matching `/selecciona un cliente/i`

---

### API Integration Tests — Playwright APIRequestContext (2 tests)

**File:** `e2e/tests/clientes/clientes-api.spec.ts`

- **Test: API-C-08** — GET /api/v1/clientes/:id con ID válido devuelve 200 y ClienteDto completo
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `GET /api/v1/clientes/{id}` endpoint not registered; response is `404 Not Found` (route not found) or `ECONNREFUSED`
  - **Verifies:** HTTP 200; body is a direct object (not array, not wrapper); contains `id` (matching UUID), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601 + timezone), `updatedAt` (ISO 8601 + timezone); no `data` wrapper

- **Test: API-C-09** — GET /api/v1/clientes/:id con ID inexistente devuelve 404 con Problem Details sin stackTrace
  - **Priority:** P1
  - **AC:** AC3 (NFR6)
  - **Status:** RED — `GET /api/v1/clientes/{id}` endpoint not registered; response is `404 Not Found` but not RFC 7807 Problem Details format; `Content-Type: application/problem+json` header not set
  - **Verifies:** HTTP 404; `Content-Type: application/problem+json`; body has `status: 404` and non-empty `title`; no `stackTrace`, `StackTrace`, or `exception` keys present (NFR6)

---

## Total Tests in RED Phase

| Level | File | Count | Test IDs |
|---|---|---|---|
| E2E (Playwright) | `clientes-detail.spec.ts` | 5 | E2E-C-07, E2E-C-08, E2E-C-09, E2E-C-10, E2E-C-07-EMPTY |
| API (Playwright APIRequestContext) | `clientes-api.spec.ts` | 2 | API-C-08, API-C-09 |
| **Total** | | **7** | |

---

## data-testid Attributes Required

The following `data-testid` attributes must be present in frontend components for the E2E tests to pass:

| Attribute | Component | File | Used By |
|---|---|---|---|
| `cliente-detail-panel` | `ClienteDetailPanel` | `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx` | E2E-C-07, E2E-C-08, E2E-C-09, E2E-C-10, E2E-C-07-EMPTY |
| `cliente-detail-loading` | skeleton/loading state inside `ClienteDetailPanel` | same file | E2E-C-07-EMPTY (asserts NOT visible) |
| `cliente-list-item` | `ClientListItem` | (exists from Story 2.1) | E2E-C-07, E2E-C-08 |
| `clientes-list-panel` | `ClienteListPanel` | (exists from Story 2.1) | E2E-C-07, E2E-C-08, E2E-C-07-EMPTY |

---

## Mock / Intercept Strategy

| Test | Strategy | Detail |
|---|---|---|
| E2E-C-07 | `page.route('**/api/v1/clientes', route.continue())` + `page.route('**/api/v1/clientes/**', route.continue())` before navigation | Network-first pass-through; requires real backend data via `apiHelper.createCliente()` |
| E2E-C-08 | Same as E2E-C-07 | Also asserts `page.url()` after click |
| E2E-C-09 | `page.route('**/api/v1/clientes/**', route.continue())` before `page.goto('/clientes/:id')` | Network-first for deep link; no prior list interaction |
| E2E-C-10 | `page.route('**/api/v1/clientes/00000000-...', route.fulfill({ status: 404, body: ProblemDetails }))` before `page.goto()` | Intercept set up BEFORE navigation to simulate 404; `page.on('pageerror', fn)` set up before intercept |
| E2E-C-07-EMPTY | `page.route('**/api/v1/clientes', route.continue())` before `goto()` | Real list data; no client selected; asserts placeholder text |
| API-C-08 | No mocking — direct `request.post` to create, then `request.get` by ID | Creates and cleans up real test data via `try/finally` |
| API-C-09 | No mocking — direct `request.get` against running backend with nil UUID | Backend must handle the 00000000-... UUID gracefully |

---

## POM Locators Used

The `e2e/pages/clientes.page.ts` POM covers all locators needed for Story 2.2 tests:

| Locator | Property | Selector | Used By |
|---|---|---|---|
| Detail panel | `detailPanel` | `getByTestId('cliente-detail-panel')` | E2E-C-07, C-08, C-09, C-10 |
| List panel | `listPanel` | `getByTestId('clientes-list-panel')` | E2E-C-07, C-08, C-07-EMPTY |
| Client items | `clienteItems` | `getByTestId('cliente-list-item')` | E2E-C-07, C-08 |
| Empty state | `emptyState` | `getByTestId('empty-state')` | (available; not directly used in Story 2.2 tests) |
| Inline text | `page.getByText(/cliente no encontrado/i)` | Text matcher | E2E-C-10 |
| Inline text | `page.getByText(/selecciona un cliente/i)` | Text matcher | E2E-C-07-EMPTY |
| Loading state | `page.getByTestId('cliente-detail-loading')` | data-testid | E2E-C-07-EMPTY (not.toBeVisible()) |

---

## Implementation Checklist

### Test Group: E2E-C-07, E2E-C-08 — Click list item → detail panel + URL update

**Make these tests pass by implementing:**

- [ ] Task 5 (Frontend): Update `ClienteListPanel.tsx` — add `useNavigate()` and call `navigate({ to: '/clientes/$clienteId', params: { clienteId: cliente.id } })` on item click
- [ ] Task 5 (Frontend): Read `selectedClienteId` from `useParams({ strict: false })` and pass `isActive` to each `ClientListItem`
- [ ] Task 3 (Frontend): Create `ClienteDetailPanel.tsx` with `data-testid="cliente-detail-panel"` and props `clienteId: string | undefined`
- [ ] Task 3 (Frontend): Render Nombre, NIT, Teléfono, Ciudad using `<dl>/<dt>/<dd>` semantic markup with `aria-label` on the panel region
- [ ] Task 4 (Frontend): Create `clientes.$clienteId.tsx` route — extracts `clienteId` from `Route.useParams()` and renders `<ClienteDetailPanel clienteId={clienteId} />`
- [ ] Task 2 (Frontend): Create `useCliente.ts` with `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id!), enabled: !!id })`
- [ ] Task 1 (Frontend): Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts` and implement in `clienteApiRepository.ts` → `GET /api/v1/clientes/:id`

---

### Test Group: E2E-C-09 — Deep link to /clientes/:clienteId

**Make this test pass by implementing:**

- [ ] Task 4 (Frontend): `clientes.$clienteId.tsx` route must be registered and respond to `page.goto('/clientes/:id')`
- [ ] Task 2 (Frontend): `useCliente(id)` fires on mount when `id` is defined (no prior navigation needed)
- [ ] Task 1 (Frontend): `clienteApiRepository.getById(id)` calls `GET /api/v1/clientes/:id`
- [ ] Task 7 (Backend): `GET /api/v1/clientes/{id:guid}` endpoint returns 200 + ClienteDto for valid existing IDs

---

### Test Group: E2E-C-10 — Non-existent clienteId → graceful not-found

**Make this test pass by implementing:**

- [ ] Task 3 (Frontend): `ClienteDetailPanel` shows "Cliente no encontrado" (`EmptyState` with appropriate title) when `isError === true` and the error status is 404
- [ ] Task 1 (Frontend): `clienteApiRepository.getById(id)` must reject with error carrying `response.status === 404` (Axios error) on 404 response
- [ ] Task 2 (Frontend): `useCliente` exposes `isError` and `error` from `useQuery` — no swallowing of errors
- [ ] Verify: `page.on('pageerror', fn)` fires zero events — React error boundary or conditional rendering must prevent unhandled errors

---

### Test Group: E2E-C-07-EMPTY — Empty state at /clientes with no selection

**Make this test pass by implementing:**

- [ ] Task 6 (Frontend): Update `clientes.tsx` route — render `<Outlet />` as right panel; add default `EmptyState` placeholder `"Selecciona un cliente para ver sus detalles"` when no child route is active
- [ ] Task 3 (Frontend): `ClienteDetailPanel` when `clienteId === undefined` shows `EmptyState` (AC4)
- [ ] Verify: `data-testid="cliente-detail-loading"` element is NOT visible at `/clientes` (no spurious loading state)

---

### Test Group: API-C-08 — GET /api/v1/clientes/:id returns 200 + full ClienteDto

**Make this test pass by implementing:**

- [ ] Task 7 (Backend): Verify/create `GetClienteByIdQuery.cs` — record with `Guid Id`
- [ ] Task 7 (Backend): Verify/create `GetClienteByIdQueryHandler.cs` — calls `IClienteRepository.GetByIdAsync(id, ct)`, maps to `ClienteDto`, returns `null` if not found
- [ ] Task 7 (Backend): Verify/add `GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository` interface
- [ ] Task 7 (Backend): Verify/add `ClienteRepository.GetByIdAsync` — `AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)`
- [ ] Task 7 (Backend): Verify/add `MapGet("/{id:guid}", ...)` in `ClienteEndpoints.cs` — returns `Results.Ok(dto)` for found, `Results.Problem(statusCode: 404)` for null
- [ ] Verify: `ClienteDto` includes `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt` (all serialized with camelCase)
- [ ] Verify: `createdAt` and `updatedAt` serialize as ISO 8601 with timezone (DateTimeOffset — not plain DateTime)

---

### Test Group: API-C-09 — GET /api/v1/clientes/:id with non-existent ID returns 404 Problem Details

**Make this test pass by implementing:**

- [ ] Task 7 (Backend): Endpoint returns `Results.Problem(statusCode: 404, title: "Cliente no encontrado", detail: ...)` when handler returns `null`
- [ ] Task 7 (Backend): Confirm `app.UseProblemDetails()` or equivalent is configured so 404 responses use `Content-Type: application/problem+json`
- [ ] Task 7 (Backend): Confirm `app.UseExceptionHandler()` or global handler suppresses `stackTrace` in responses (NFR6)
- [ ] Verify: Response body contains `status: 404` and non-empty `title`
- [ ] Verify: Response body does NOT contain `stackTrace`, `StackTrace`, or `exception` keys

---

## Running Tests

```bash
# Run all Story 2.2 E2E detail tests
npx playwright test e2e/tests/clientes/clientes-detail.spec.ts

# Run Story 2.2 API integration tests only
npx playwright test e2e/tests/clientes/clientes-api.spec.ts --grep "API-C-08|API-C-09"

# Run all clientes tests together
npx playwright test e2e/tests/clientes/

# Run a specific test by ID
npx playwright test e2e/tests/clientes/clientes-detail.spec.ts --grep "E2E-C-07"

# Run in headed mode for debugging
npx playwright test e2e/tests/clientes/clientes-detail.spec.ts --headed

# Run with UI mode (interactive)
npx playwright test e2e/tests/clientes/ --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All 7 tests written and in failing state. Expected failure reasons before implementation:

- E2E-C-07: `apiHelper.createCliente()` succeeds; `clientesPage.seleccionarCliente()` clicks item; `detailPanel` (`data-testid="cliente-detail-panel"`) not found → `TimeoutError`
- E2E-C-08: Same as E2E-C-07; `page.waitForURL('**/clientes/${cliente.id}')` times out — URL stays `/clientes`
- E2E-C-09: `page.goto('/clientes/${cliente.id}')` renders `/clientes` shell without the detail route; `detailPanel` not found → `TimeoutError`
- E2E-C-10: 404 response intercepted correctly; `page.getByText(/cliente no encontrado/i)` not found (component not implemented) → `TimeoutError`
- E2E-C-07-EMPTY: `page.goto('/clientes')` renders; `getByText(/selecciona un cliente/i)` not found (no placeholder implemented) → `TimeoutError`
- API-C-08: `GET /api/v1/clientes/{id}` returns 404 (route not registered) → `expect(response.status()).toBe(200)` fails
- API-C-09: `GET /api/v1/clientes/{id}` returns 404 but without `Content-Type: application/problem+json` → content-type assertion fails

### GREEN Phase (DEV Team — Priority Order)

1. Backend Tasks 7 — `GET /api/v1/clientes/{id:guid}` endpoint (unblocks API-C-08, API-C-09, E2E-C-09)
2. Frontend Task 1 — `IClienteRepository.getById` + `clienteApiRepository.getById` (unblocks useCliente)
3. Frontend Task 2 — `useCliente.ts` hook (unblocks ClienteDetailPanel data)
4. Frontend Task 3 — `ClienteDetailPanel.tsx` with all states: loading, error-404, error-other, data, empty (unblocks E2E-C-07, E2E-C-09, E2E-C-10)
5. Frontend Task 4 — `clientes.$clienteId.tsx` route (unblocks E2E-C-09, E2E-C-10)
6. Frontend Task 5 — `ClienteListPanel` navigate on click + isActive (unblocks E2E-C-07, E2E-C-08)
7. Frontend Task 6 — `clientes.tsx` layout with `<Outlet />` + placeholder (unblocks E2E-C-07-EMPTY)

### REFACTOR Phase (After All Tests Pass)

- Verify URL is source of truth — no `clienteId` state in Zustand or `useState`
- Verify `useParams({ strict: false })` in `clientes.tsx` (parent) to read `clienteId` param
- Confirm `staleTime: 5 minutes` in `useCliente` aligns with `queryClient.ts` default
- Confirm loading state uses `react-loading-skeleton` (skeleton screens, NOT spinners)
- Confirm all user-facing text is in Spanish
- Confirm WCAG 2.1 AA: `<dl>/<dt>/<dd>` or labeled sections + `aria-label` on panel region

---

## Coverage Matrix — Story 2.2

| AC | Requirement | Test(s) | Level | Status |
|---|---|---|---|---|
| AC1 | Clicking client shows Nombre, NIT, Teléfono, Ciudad in right panel | E2E-C-07 | E2E | RED |
| AC1 | URL updates to `/clientes/:clienteId` on click (FR30) | E2E-C-08 | E2E | RED |
| AC2 | Deep link `/clientes/:clienteId` loads correct client without list interaction | E2E-C-09, API-C-08 | E2E + API | RED |
| AC3 | Non-existent clienteId shows not-found message gracefully, no JS errors | E2E-C-10, API-C-09 | E2E + API | RED |
| AC4 | No-selection state shows placeholder (not blank/broken) | E2E-C-07-EMPTY | E2E | RED |

**Coverage: 5/5 AC requirements addressed — 100%**

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-20
