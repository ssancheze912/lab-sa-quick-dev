# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-23
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright) + API Integration (Playwright request) + Component Spec (Vitest+RTL)

---

## Story Summary

Story 2.2 extends the split-panel layout established in Story 2.1 to implement the client detail view. When a user clicks a client in the left panel, the right panel transitions from the default placeholder to a full detail view showing Nombre, NIT/RUC, Teléfono, and Ciudad. The URL updates to `/clientes/:clienteId` (TanStack Router dynamic route) enabling deep linking (FR30). A backend endpoint `GET /api/v1/clientes/{id}` is introduced and returns Problem Details RFC 7807 on 404.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **AC1 (Detail panel on client selection):** Given the client list is displayed in the left panel, when the user clicks on a client item, then the right panel renders the complete client detail showing: Nombre, NIT/RUC, Teléfono, and Ciudad, and the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **AC2 (Direct URL access — deep linking):** Given the user accesses `/clientes/:clienteId` directly (e.g., via bookmark or shared link), when the page loads, then the correct client details are fetched from `GET /api/v1/clientes/{id}` and displayed in the right panel, and the matching item in the left list is highlighted (FR30).

3. **AC3 (Not-found handling):** Given a `clienteId` in the URL does not correspond to any existing client, when `GET /api/v1/clientes/{id}` returns 404, then the right panel displays a graceful not-found message ("Cliente no encontrado.") instead of crashing or showing raw error data.

4. **AC4 (Loading skeleton on detail fetch):** Given the right panel is fetching a client by ID, when the request is in flight, then skeleton placeholders (via `react-loading-skeleton`) are displayed in the right panel — no spinner.

5. **AC5 (Error panel on fetch failure):** Given the backend is unavailable when the detail fetch runs, when the `GET /api/v1/clientes/{id}` request fails (non-404 error), then an `ErrorPanel` with a "Reintentar" button is displayed in the right panel, and clicking it re-triggers the query.

6. **AC6 (Default empty state — no client selected):** Given the user is on `/clientes` without a `clienteId` in the URL, when the page loads, then the right panel shows the default placeholder ("Selecciona un cliente de la lista").

7. **AC7 (Backend endpoint GET /api/v1/clientes/{id}):** Given the frontend calls `GET /api/v1/clientes/{id}`, when the client exists, then the endpoint returns a JSON object `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }` with HTTP 200. When the client does not exist, it returns Problem Details RFC 7807 with HTTP 404.

8. **AC8 (Selected item highlighted in list):** Given a `clienteId` is active in the URL, when the left panel renders the client list, then the corresponding `ClienteListItem` displays in the highlighted/active visual state (Siesa Blue accent `#0e79fd`).

9. **AC9 (Accessibility):** Given the detail panel is rendered, when the page is inspected, then the panel heading has an appropriate ARIA heading level (h2) and all fields have visible labels that screen readers can associate with their values (via `<dl>/<dt>/<dd>` semantic structure).

---

## Failing Tests Created (RED Phase)

### E2E Tests (19 tests)

**File:** `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

- **Test:** should render the right panel with client detail when a client list item is clicked
  - **Status:** RED — `[data-testid="cliente-detail-panel"]` shows detail content; route `/clientes/:clienteId` not implemented
  - **Verifies:** AC1 — Right panel renders on click

- **Test:** should display the selected client Nombre in the detail panel after clicking a list item
  - **Status:** RED — `[data-testid="cliente-detail-nombre"]` element not implemented
  - **Verifies:** AC1 — Nombre shown in detail panel

- **Test:** should display the selected client NIT/RUC in the detail panel after clicking a list item
  - **Status:** RED — `[data-testid="cliente-detail-nit"]` element not implemented
  - **Verifies:** AC1 — NIT/RUC shown in detail panel

- **Test:** should update the URL to /clientes/:clienteId when a client item is clicked
  - **Status:** RED — TanStack Router route `clientes.$clienteId.tsx` not implemented; URL does not change
  - **Verifies:** AC1 — FR30 deep linking URL update

- **Test:** should load the correct client detail when navigating directly to /clientes/:clienteId
  - **Status:** RED — Direct navigation to dynamic route not implemented
  - **Verifies:** AC2 — Deep linking direct access

- **Test:** should display all client detail fields when navigating directly to /clientes/:clienteId
  - **Status:** RED — `[data-testid="cliente-detail-telefono"]` and `[data-testid="cliente-detail-ciudad"]` not implemented
  - **Verifies:** AC2 — All fields rendered on direct URL access

- **Test:** should highlight the matching list item when navigating directly to /clientes/:clienteId
  - **Status:** RED — `data-active="true"` attribute not implemented on list items
  - **Verifies:** AC2 — Matching list item highlighted on deep link

- **Test:** should display graceful not-found message when clienteId does not exist (404)
  - **Status:** RED — `[data-testid="cliente-not-found"]` element not implemented
  - **Verifies:** AC3 — Graceful 404 not-found handling

- **Test:** should display "Cliente no encontrado." text when 404 is returned
  - **Status:** RED — Not-found message not rendered
  - **Verifies:** AC3 — Exact not-found message text

- **Test:** should not expose raw error data or crash when 404 is returned
  - **Status:** RED — No error boundary / not-found state implemented
  - **Verifies:** AC3 — No raw error data leakage (NFR6)

- **Test:** should display skeleton placeholders in right panel while detail fetch is in flight
  - **Status:** RED — `[data-testid="cliente-detail-skeleton"]` not implemented; no loading state in right panel
  - **Verifies:** AC4 — Skeleton loading in right panel

- **Test:** should not show a spinner while the detail fetch is in flight
  - **Status:** RED — No loading state differentiation in right panel
  - **Verifies:** AC4 — Absence of spinner (react-loading-skeleton required)

- **Test:** should display ErrorPanel in the right panel when GET /api/v1/clientes/{id} fails with 500
  - **Status:** RED — `[data-testid="cliente-detail-error"]` element not implemented
  - **Verifies:** AC5 — ErrorPanel in right panel on 500

- **Test:** should display a "Reintentar" button in the right panel ErrorPanel on non-404 failure
  - **Status:** RED — ErrorPanel with retry not rendered in right panel
  - **Verifies:** AC5 — Reintentar button in right panel error state

- **Test:** should re-trigger the detail query when "Reintentar" button is clicked
  - **Status:** RED — No retry mechanism wired in right panel
  - **Verifies:** AC5 — Query re-triggered on retry click

- **Test:** should show default placeholder in right panel when on /clientes without a clienteId
  - **Status:** RED — Same as Story 2.1 AC9 baseline; this validates continuity
  - **Verifies:** AC6 — Default placeholder on /clientes base route

- **Test:** should not show the detail panel content when no client is selected on /clientes
  - **Status:** RED — Detail fields (`cliente-detail-nit`) should not render on /clientes
  - **Verifies:** AC6 — No stale detail rendered on base route

- **Test:** should apply active state to the ClienteListItem matching the active clienteId URL param
  - **Status:** RED — `data-active="true"` attribute on list item not implemented
  - **Verifies:** AC8 — Active item highlight (Siesa Blue)

- **Test:** should NOT apply active state to non-selected list items
  - **Status:** RED — No active attribute differentiation implemented
  - **Verifies:** AC8 — Non-selected items have no active state

- **Test:** should render the client Nombre as an h2 heading in the detail panel
  - **Status:** RED — `role="heading" level=2` inside detail panel not implemented
  - **Verifies:** AC9 — ARIA heading level for accessibility

- **Test:** should render field labels (NIT/RUC, Teléfono, Ciudad) visible to screen readers in the detail panel
  - **Status:** RED — Field labels (`<dt>` elements) not implemented
  - **Verifies:** AC9 — Visible labels for screen readers

- **Test:** should render "Teléfono" label visible in the detail panel
  - **Status:** RED — Field label not implemented
  - **Verifies:** AC9 — Teléfono label visible

- **Test:** should render "Ciudad" label visible in the detail panel
  - **Status:** RED — Field label not implemented
  - **Verifies:** AC9 — Ciudad label visible

- **Test:** should render "—" for null Teléfono field in the detail panel
  - **Status:** RED — Null field rendering not implemented
  - **Verifies:** AC9 — Null optional fields show "—"

- **Test:** should render "—" for null Ciudad field in the detail panel
  - **Status:** RED — Null field rendering not implemented
  - **Verifies:** AC9 — Null optional fields show "—"

**Total E2E tests:** 25 tests

---

### API Tests (13 tests)

**File:** `e2e/tests/api/story-2-2-cliente-by-id-endpoint.api.spec.ts`

- **Test:** should return HTTP 200 when GET /api/v1/clientes/{id} is called with an existing client id
  - **Status:** RED — `GET /{id:guid}` route not implemented in `ClienteEndpoints.cs`
  - **Verifies:** AC7 — 200 happy path

- **Test:** should return Content-Type application/json from GET /api/v1/clientes/{id}
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC7 — JSON response format

- **Test:** should return a JSON object (not an array) from GET /api/v1/clientes/{id}
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC7 — Single object response shape

- **Test:** should return all required fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt
  - **Status:** RED — Endpoint not implemented; `ClienteDto` missing for single-item response
  - **Verifies:** AC7 — Required field contract

- **Test:** should return the correct field values matching the created client
  - **Status:** RED — `GetClienteByIdQueryHandler` not implemented
  - **Verifies:** AC7 — Correct field values returned

- **Test:** should return id as a valid UUID string from GET /api/v1/clientes/{id}
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC7 — UUID format on id field

- **Test:** should return createdAt and updatedAt as ISO 8601 datetime strings
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC7 — ISO 8601 datetime format

- **Test:** should return null for telefono when client was created with null telefono
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC7 — Nullable optional fields in response

- **Test:** should return HTTP 404 when GET /api/v1/clientes/{id} is called with a non-existent id
  - **Status:** RED — Endpoint returns 404 not implemented
  - **Verifies:** AC7 — 404 not-found

- **Test:** should return Problem Details RFC 7807 shape on 404 — field "title" present
  - **Status:** RED — `Results.Problem(...)` not implemented for not-found
  - **Verifies:** AC7 — Problem Details "title" field

- **Test:** should return Problem Details RFC 7807 shape on 404 — field "status" equals 404
  - **Status:** RED — Problem Details "status" field not implemented
  - **Verifies:** AC7 — Problem Details "status" = 404

- **Test:** should return "Cliente no encontrado." as the title in Problem Details 404 response
  - **Status:** RED — Exact "Cliente no encontrado." title not returned
  - **Verifies:** AC7 — Exact not-found title text

- **Test:** should NOT expose stack traces or internal exception details in 404 response body
  - **Status:** RED — Error handling middleware not validated for this route
  - **Verifies:** AC7 + NFR6 — No internal details exposed

- **Test:** should return 404 for a syntactically valid but non-existent UUID
  - **Status:** RED — Endpoint not implemented
  - **Verifies:** AC7 — Valid UUID treated as not-found

**Total API tests:** 14 tests

---

### Component Tests (12 specifications)

**File:** `e2e/tests/clientes/component/ClienteDetailPanel.component.spec.ts`

Specification file for Vitest+RTL tests to be implemented at:
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`
- `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**ClienteDetailPanel specs (8):**
- AC6: Renders `DefaultDetailPlaceholder` when `clienteId` is `undefined`
- AC4: Renders skeleton placeholders (not spinner) while `isLoading === true`
- AC5: Renders `ErrorPanel` with "Reintentar" when non-404 error occurs
- AC5: "Reintentar" click re-triggers the query (callCount >= 2)
- AC3: Renders "Cliente no encontrado." message when API returns 404
- AC1+AC9: Renders all fields (Nombre, NIT/RUC, Teléfono, Ciudad) on success
- AC9: Renders "—" for null Teléfono
- AC9: Renders "—" for null Ciudad
- AC9: Nombre displayed as `<h2>` heading
- AC9: Fields wrapped in `<dl>` semantic definition list

**useCliente hook specs (5):**
- Returns `Cliente` object on successful fetch
- Sets `isError` and `error.response.status === 404` on 404
- Sets `isError` with non-404 status on 500
- Does NOT execute query when `id` is `undefined` (`enabled: false`)
- Does NOT retry on 404 (retry guard returns `false`)

---

## Data Factories

### Cliente Factory

**File:** `e2e/support/factories/cliente.factory.ts` (existing — established in Story 2.1)

**Exports used by Story 2.2:**
- `buildClienteFixture(overrides?)` — Creates a single `ClienteFixture` with optional field overrides
- `buildClienteFixtures(count, overrides?)` — Creates an array of fixtures

**Key overrides used in Story 2.2 tests:**
```typescript
// Client with all fields
buildClienteFixture({
  id: 'aaaaaaaa-aaaa-4000-8000-aaaaaaaaaaaa',
  nombre: 'Empresa Alpha SA',
  nit: '900123456',
  telefono: '3001234567',
  ciudad: 'Bogotá',
});

// Client with null optional fields (AC9 "—" rendering)
buildClienteFixture({
  id: 'bbbbbbbb-bbbb-4000-8000-bbbbbbbbbbbb',
  nombre: 'Beta Comercial Ltda',
  nit: '800987654',
  telefono: null,
  ciudad: null,
});
```

---

## Fixtures

### Clientes Fixture

**File:** `e2e/support/fixtures/clientes.fixture.ts` (existing — established in Story 2.1)

**Existing fixtures:** `clientesPageWithData`, `clientesPageEmpty`, `clientesPageError`, `clientesPageBulk`

**Story 2.2 note:** E2E tests in `story-2-2-client-detail-view.spec.ts` use inline `page.route()` intercepts rather than the fixture object, because detail tests require intercepting both the list endpoint (`**/api/v1/clientes`) and the per-item endpoint (`**/api/v1/clientes/*`) simultaneously with independent response control.

**New fixture recommended (optional):** A `clienteDetailPage` fixture could be added to `clientes.fixture.ts` for cleaner test DRY-ness, but inline routes are sufficient for Story 2.2 per the keep-it-simple principle.

---

## Mock Requirements

### GET /api/v1/clientes (list endpoint)

**Used by:** All E2E detail tests (required to populate left panel)

**Success Response:**
```json
[
  { "id": "uuid", "nombre": "Empresa Alpha SA", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá", "createdAt": "...", "updatedAt": "..." },
  { "id": "uuid", "nombre": "Beta Comercial Ltda", "nit": "800987654", "telefono": null, "ciudad": null, "createdAt": "...", "updatedAt": "..." }
]
```

### GET /api/v1/clientes/:id (detail endpoint)

**Used by:** All E2E and Component detail tests

**Success Response (200):**
```json
{
  "id": "aaaaaaaa-aaaa-4000-8000-aaaaaaaaaaaa",
  "nombre": "Empresa Alpha SA",
  "nit": "900123456",
  "telefono": "3001234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

**Not-Found Response (404 — Problem Details RFC 7807):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Cliente no encontrado.",
  "status": 404,
  "detail": "No existe un cliente con id '{id}'."
}
```

**Error Response (500):**
```json
{ "title": "Internal Server Error", "status": 500 }
```

---

## Required data-testid Attributes

### ClienteDetailPanel (right panel — `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`)

- `cliente-detail-panel` — Root container of the right panel (both placeholder and detail states)
- `cliente-detail-skeleton` — Wrapper around `<Skeleton>` elements shown during loading
- `cliente-detail-error` — The `ErrorPanel` shown on non-404 errors
- `cliente-not-found` — Container shown when 404 is returned
- `cliente-detail-nombre` — `<h2>` or `<dd>` for the Nombre value
- `cliente-detail-nit` — `<dd>` for the NIT/RUC value
- `cliente-detail-telefono` — `<dd>` for the Teléfono value (renders "—" when null)
- `cliente-detail-ciudad` — `<dd>` for the Ciudad value (renders "—" when null)

### ClienteListItem (left panel list item — active state)

- `cliente-list-item` — Existing from Story 2.1
- `data-active="true"` — Boolean attribute added to the active/selected list item

**Implementation Example:**
```tsx
// ClienteDetailPanel.tsx
<div data-testid="cliente-detail-panel" className="flex-1 p-6 overflow-y-auto">
  {clienteId === undefined && <DefaultDetailPlaceholder />}
  {isLoading && (
    <div data-testid="cliente-detail-skeleton">
      <Skeleton count={4} height={28} />
    </div>
  )}
  {isError && error?.response?.status === 404 && (
    <div data-testid="cliente-not-found">
      <p>Cliente no encontrado.</p>
    </div>
  )}
  {isError && error?.response?.status !== 404 && (
    <div data-testid="cliente-detail-error">
      <ErrorPanel message="No se pudo cargar el detalle del cliente." onRetry={refetch} />
    </div>
  )}
  {data && (
    <>
      <h2 data-testid="cliente-detail-nombre">{data.nombre}</h2>
      <dl>
        <dt>NIT/RUC</dt>
        <dd data-testid="cliente-detail-nit">{data.nit}</dd>
        <dt>Teléfono</dt>
        <dd data-testid="cliente-detail-telefono">{data.telefono ?? '—'}</dd>
        <dt>Ciudad</dt>
        <dd data-testid="cliente-detail-ciudad">{data.ciudad ?? '—'}</dd>
      </dl>
    </>
  )}
</div>

// ClienteListItem — active state
<li
  data-testid="cliente-list-item"
  data-active={selectedId === cliente.id ? 'true' : undefined}
  onClick={() => onSelect(cliente.id)}
>
  {/* ... */}
</li>
```

---

## Implementation Checklist

### Test Group: AC1 — Detail panel on client selection

**Tests:** 4 E2E tests in `story-2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` (TanStack Router dynamic route for `/clientes/:clienteId`)
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx` with props `{ clienteId: string | undefined }`
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts` (TanStack Query hook `['clientes', id]`)
- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository` interface
- [ ] Implement `getById` in `clienteApiRepository.ts` — `GET /api/v1/clientes/${id}` via Axios
- [ ] Update `frontend/src/routes/_app/clientes.tsx` — `onSelect` navigates to `/clientes/${id}`
- [ ] Add `data-testid="cliente-detail-panel"` to right panel root container
- [ ] Add `data-testid="cliente-detail-nombre"` to the Nombre display element
- [ ] Add `data-testid="cliente-detail-nit"` to the NIT display element
- [ ] Run test: `npx playwright test story-2-2-client-detail-view.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 4 hours

---

### Test Group: AC2 — Deep linking (direct URL access)

**Tests:** 3 E2E tests in `story-2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] Verify `clientes.$clienteId.tsx` uses `useParams({ from: '/_app/clientes/$clienteId' })` to retrieve `clienteId` type-safely
- [ ] Ensure `useCliente(clienteId)` is called in `ClienteDetailPanel` and fetches from `GET /api/v1/clientes/${id}`
- [ ] Add `data-active="true"` attribute to `ClienteListItem` when its `id === selectedId`
- [ ] Pass `selectedId={clienteId}` from route param to `ClienteListPanel`
- [ ] Run test: `npx playwright test story-2-2-client-detail-view.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC3 — Not-found handling

**Tests:** 3 E2E tests in `story-2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `ClienteDetailPanel`: check `isError && error?.response?.status === 404` and render not-found state
- [ ] Add `data-testid="cliente-not-found"` to the not-found container
- [ ] Display text "Cliente no encontrado." (exact string, in Spanish)
- [ ] Ensure no raw error details (`error.message`, `detail`, stack trace) are rendered to user
- [ ] Run test: `npx playwright test story-2-2-client-detail-view.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC4 — Loading skeleton in right panel

**Tests:** 2 E2E tests in `story-2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `ClienteDetailPanel`: render `<Skeleton count={4} height={28} />` from `react-loading-skeleton` when `isLoading === true`
- [ ] Wrap skeleton in container with `data-testid="cliente-detail-skeleton"`
- [ ] Ensure no `<role="progressbar">` spinner element is rendered in the right panel at any state
- [ ] Run test: `npx playwright test story-2-2-client-detail-view.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC5 — ErrorPanel on non-404 failure

**Tests:** 3 E2E tests in `story-2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `ClienteDetailPanel`: check `isError && error?.response?.status !== 404` and render `<ErrorPanel>`
- [ ] Pass `message="No se pudo cargar el detalle del cliente."` and `onRetry={refetch}` to `ErrorPanel`
- [ ] Wrap `ErrorPanel` in container with `data-testid="cliente-detail-error"`
- [ ] Verify `ErrorPanel` component has a "Reintentar" `<button>` with accessible name
- [ ] Run test: `npx playwright test story-2-2-client-detail-view.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC6 — Default empty state

**Tests:** 2 E2E tests in `story-2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] Ensure `frontend/src/routes/_app/clientes.tsx` (base route) renders `<DefaultDetailPlaceholder />` in right panel
- [ ] Verify `clientes.tsx` does NOT render `ClienteDetailPanel` detail content (only `DefaultDetailPlaceholder`)
- [ ] `DefaultDetailPlaceholder` must render text matching `/selecciona un cliente de la lista/i`
- [ ] Run test: `npx playwright test story-2-2-client-detail-view.spec.ts --grep "AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC7 — Backend endpoint GET /api/v1/clientes/{id}

**Tests:** 14 API tests in `story-2-2-cliente-by-id-endpoint.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — record with `Guid Id`
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — returns `ClienteDto?`
- [ ] Verify `IClienteRepository.GetByIdAsync(Guid id, CancellationToken ct)` exists (Story 2.1 Task 1.2)
- [ ] Verify `ClienteRepository.GetByIdAsync` implementation exists (Story 2.1 Task 2.4)
- [ ] Add `GET /{id:guid}` route to `ClienteEndpoints.cs` inside `MapClienteEndpoints`
- [ ] Return `Results.Ok(cliente)` when found; `Results.Problem(title: "Cliente no encontrado.", statusCode: 404, ...)` when null
- [ ] Register `GetClienteByIdQueryHandler` as scoped in `Program.cs`
- [ ] Run test: `npx playwright test story-2-2-cliente-by-id-endpoint.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test Group: AC8 — Selected item highlighted

**Tests:** 2 E2E tests in `story-2-2-client-detail-view.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `ClienteListPanel`: accept `selectedId?: string` prop
- [ ] In each `ClienteListItem`: add `data-active={id === selectedId ? 'true' : undefined}` attribute
- [ ] Apply Siesa Blue `#0e79fd` visual styling when `data-active="true"` (border-left or background accent via Tailwind)
- [ ] Pass `selectedId={clienteId}` from the route param to `ClienteListPanel` in `clientes.$clienteId.tsx`
- [ ] Run test: `npx playwright test story-2-2-client-detail-view.spec.ts --grep "AC8"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC9 — Accessibility

**Tests:** 6 E2E tests in `story-2-2-client-detail-view.spec.ts` + Vitest specs

**Tasks to make these tests pass:**

- [ ] Render `<h2 data-testid="cliente-detail-nombre">{data.nombre}</h2>` as the panel heading
- [ ] Wrap field labels and values in `<dl>/<dt>/<dd>` semantic structure
- [ ] Add visible `<dt>` labels: "NIT/RUC", "Teléfono", "Ciudad" — must be in the DOM and visible
- [ ] Render `data.telefono ?? '—'` in `<dd data-testid="cliente-detail-telefono">`
- [ ] Render `data.ciudad ?? '—'` in `<dd data-testid="cliente-detail-ciudad">`
- [ ] Run test: `npx playwright test story-2-2-client-detail-view.spec.ts --grep "AC9"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: Component/Hook Tests (Vitest + RTL)

**Specification file:** `e2e/tests/clientes/component/ClienteDetailPanel.component.spec.ts`
**Implement at:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx` and `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**Tasks:**

- [ ] Create `ClienteDetailPanel.test.tsx` with MSW handlers for `GET /api/v1/clientes/:id`
- [ ] Implement all 10 `ClienteDetailPanel` test specs from the component spec file
- [ ] Create `useCliente.test.ts` with MSW handlers and renderHook for the 5 hook specs
- [ ] Run: `pnpm --filter frontend test run`
- [ ] ✅ Component and hook tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all E2E failing tests for Story 2.2
npx playwright test story-2-2-client-detail-view.spec.ts story-2-2-cliente-by-id-endpoint.api.spec.ts

# Run E2E detail tests only
npx playwright test story-2-2-client-detail-view.spec.ts

# Run API integration tests only
npx playwright test story-2-2-cliente-by-id-endpoint.api.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test story-2-2-client-detail-view.spec.ts --headed

# Debug specific test
npx playwright test story-2-2-client-detail-view.spec.ts --debug

# Run frontend component/hook tests (Vitest)
pnpm --filter frontend test run

# Run only ClienteDetailPanel component tests
pnpm --filter frontend test run ClienteDetailPanel

# Run only useCliente hook tests
pnpm --filter frontend test run useCliente
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All E2E tests written and failing (25 tests in `story-2-2-client-detail-view.spec.ts`)
- All API integration tests written and failing (14 tests in `story-2-2-cliente-by-id-endpoint.api.spec.ts`)
- Component/hook specifications written as RED-phase spec (12 specs in `ClienteDetailPanel.component.spec.ts`)
- Network-first intercept pattern applied (routes intercepted BEFORE navigation in all tests)
- `data-testid` requirements documented
- Implementation checklist created

**Verification:**

- E2E tests fail because routes `clientes.$clienteId.tsx` and `ClienteDetailPanel` don't exist
- API tests fail because `GET /api/v1/clientes/{id}` route is not implemented in the backend
- Component specs will fail as Vitest tests once the implementation exists but tests are written before components

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Start with **AC7 (backend endpoint)** — unblocks all other test groups
2. Implement `GetClienteByIdQuery`, `GetClienteByIdQueryHandler`, and `GET /{id:guid}` route
3. Verify API tests pass: `npx playwright test story-2-2-cliente-by-id-endpoint.api.spec.ts`
4. Implement **frontend domain layer**: `useCliente.ts` hook and `getById` in `clienteApiRepository.ts`
5. Implement **`ClienteDetailPanel.tsx`** with all states (loading, error, not-found, success)
6. Create **`clientes.$clienteId.tsx`** dynamic route file
7. Update **`clientes.tsx`** — `onSelect` navigates to `/clientes/${id}`
8. Implement **active state** on `ClienteListItem` (`data-active` attribute)
9. Verify all E2E tests pass: `npx playwright test story-2-2-client-detail-view.spec.ts`
10. Implement **Vitest + RTL** component and hook tests and verify they pass

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Start with backend (AC7) to unblock frontend tests
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Extract split-panel layout logic if duplicated across `clientes.tsx` and `clientes.$clienteId.tsx`
2. Consider a shared `ClientesLayout` wrapper for DRY layout
3. Ensure Tailwind classes for active state use CSS custom property or design token rather than hardcoded `#0e79fd`
4. Run full test suite to confirm no regressions

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test story-2-2-client-detail-view.spec.ts story-2-2-cliente-by-id-endpoint.api.spec.ts`
3. **Begin implementation** starting with AC7 (backend) as it unblocks all other tests
4. **Work one test group at a time** following the implementation checklist order
5. **Implement Vitest+RTL tests** as part of the GREEN phase (component specs serve as guide)
6. **When all tests pass**, refactor for quality
7. **When refactoring complete**, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation: `page.route()` called before `page.goto()` in all E2E tests
- **fixture-architecture.md** — Existing `clientes.fixture.ts` patterns reused; inline intercepts for dual-endpoint tests
- **data-factories.md** — `buildClienteFixture()` from `cliente.factory.ts` used with targeted overrides
- **selector-resilience.md** — All selectors use `data-testid` (`getByTestId`) or semantic roles (`getByRole`, `getByText`) — no CSS class selectors
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, explicit waits only
- **component-tdd.md** — Vitest+RTL specs written before implementation; MSW for API boundary mocking
- **timing-debugging.md** — Promise-based response delay in AC4 tests (no `page.waitForTimeout`)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test story-2-2-client-detail-view.spec.ts story-2-2-cliente-by-id-endpoint.api.spec.ts`

**Expected Results:**

- Total E2E tests: 25 (all failing — routes and components not implemented)
- Total API tests: 14 (all failing — `GET /api/v1/clientes/{id}` not implemented)
- Passing: 0 (expected)
- Failing: 39 (expected)
- Status: RED phase — tests define expected behavior before implementation

**Expected failure messages (representative):**
- E2E: `Error: Timeout 30000ms exceeded. ... waiting for locator('[data-testid="cliente-detail-panel"]')...`
- E2E (URL): `Error: expect(page).toHaveURL('/clientes/aaaaaaaa-aaaa-4000-8000-aaaaaaaaaaaa')`
- API: `Error: expect(response.status()).toBe(200) — Received: 404` (endpoint not found)
- API (not-found): `Error: expect(body.title).toBe('Cliente no encontrado.') — Received: undefined`

---

## Notes

- **Routing decision (CRITICAL):** Story 2.1 used `selectedClienteId` as a URL search param (`?clienteId=xxx`). Story 2.2 transitions to a path-based dynamic segment `/clientes/:clienteId` using TanStack Router file convention `clientes.$clienteId.tsx`. The `clientes.tsx` base route must be updated to navigate to this new path on client selection.
- **Backend dependency:** All frontend AC1–AC6 and AC8–AC9 tests that use `API_CLIENTE_BY_ID_URL` intercept `**/api/v1/clientes/*` — this glob also matches `**/api/v1/clientes` (list). To avoid interference, list intercepts are registered first with the more specific glob; Playwright uses the first matching route handler.
- **No retry on 404:** The `useCliente` hook must configure `retry: (failureCount, error) => error?.response?.status === 404 ? false : failureCount < 2` to prevent TanStack Query from retrying on not-found errors.
- **`data-active` attribute:** Using a boolean HTML attribute (`data-active="true"` / absent) rather than a CSS class for active state makes Playwright assertions deterministic and avoids coupling to Tailwind class names.

---

**Generated by BMad TEA Agent** - 2026-06-23
