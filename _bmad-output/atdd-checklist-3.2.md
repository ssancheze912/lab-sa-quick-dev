# ATDD Checklist — Epic 3, Story 3.2: Contact Detail View

**Date:** 2026-06-29
**Author:** gaduranb@siesa.com
**Primary Test Level:** Component + API Integration
**Story Status:** ready-for-dev → RED phase complete

---

## Story Summary

As a commercial team member, I want to view the complete details of a contact by selecting them from the list, so that I can review all their information (Nombre, Cargo, Teléfono, Email) at once. The view must support direct URL access (deep link), graceful 404 handling, loading skeletons, and error recovery.

**As a** commercial team member
**I want** to view complete contact details by navigating to `/contactos/:contactoId`
**So that** I can review all contact information at once

---

## Acceptance Criteria

1. GIVEN the contact list is displayed, WHEN the user clicks on a contact, THEN the detail view shows Nombre, Cargo, Teléfono, Email and URL updates to `/contactos/:contactoId`. (FR13, FR30, AC-E3.3)
2. GIVEN the user accesses `/contactos/:contactoId` via deep link, WHEN the page loads, THEN the correct contact details are displayed. (FR30)
3. GIVEN a `contactoId` does not exist, WHEN the page loads, THEN "Contacto no encontrado" is shown without technical details. (NFR6)
4. GIVEN the backend is unavailable, WHEN the fetch fails, THEN an `ErrorPanel` with "Reintentar" button is displayed; clicking retries the fetch. (NFR6)
5. GIVEN the page is loading, WHEN fetch is in-progress, THEN a skeleton loading state is shown. (company standard)
6. GIVEN the detail view is displayed, WHEN user clicks "Editar", THEN navigation to edit view is initiated (Story 3.4 — placeholder). (FR14)
7. GIVEN the detail view is displayed, WHEN user clicks "Eliminar", THEN deletion action is initiated (Story 3.5 — placeholder). (AC-E3.5)

---

## Failing Tests Created (RED Phase)

### E2E Tests (8 tests)

**File:** `e2e/tests/contactos/contacto-detail.spec.ts`

- **Test:** `AC#2 — deep link to /contactos/:contactoId renders correct contact Nombre`
  - **Status:** RED — route `/contactos/$contactoId` does not exist yet
  - **Verifies:** AC #2 — deep link loads correct contact

- **Test:** `AC#2 — deep link renders correct Cargo field`
  - **Status:** RED — ContactoDetailView does not exist
  - **Verifies:** AC #1, #2 — Cargo field rendered

- **Test:** `AC#2 — deep link renders correct Teléfono field`
  - **Status:** RED — ContactoDetailView does not exist
  - **Verifies:** AC #1, #2 — Teléfono field rendered

- **Test:** `AC#2 — deep link renders correct Email field`
  - **Status:** RED — ContactoDetailView does not exist
  - **Verifies:** AC #1, #2 — Email field rendered

- **Test:** `AC#2 — URL updates to /contactos/:contactoId on deep link navigation`
  - **Status:** RED — route does not exist
  - **Verifies:** AC #2 — URL stays at deep link

- **Test:** `AC#2 — deep link does not show blank screen`
  - **Status:** RED — ContactoDetailView does not exist
  - **Verifies:** AC #2 — panel visible, no blank screen

- **Test:** `AC#3 — deep link to non-existent UUID shows "Contacto no encontrado"`
  - **Status:** RED — not-found state not implemented
  - **Verifies:** AC #3 — Spanish not-found message

- **Test:** `AC#3 — no JavaScript crash when deep link points to non-existent contact`
  - **Status:** RED — no implementation to guard against errors
  - **Verifies:** AC #3, NFR6 — no JS crash, no stack traces

### Unit Tests — useContacto hook (9 tests)

**File:** `frontend/src/modules/crm/contactos/application/useContacto.test.ts`

- **Test:** `should NOT enable the query when contactoId is undefined`
  - **Status:** RED — `useContacto.ts` does not exist
  - **Verifies:** TC-3 — disabled query when no ID

- **Test:** `should NOT enable the query when contactoId is null`
  - **Status:** RED — `useContacto.ts` does not exist
  - **Verifies:** TC-3 — disabled query for null

- **Test:** `should NOT enable the query when contactoId is empty string`
  - **Status:** RED — `useContacto.ts` does not exist
  - **Verifies:** TC-3 — disabled query for empty string

- **Test:** `should fetch and return contacto data when contactoId is a valid UUID`
  - **Status:** RED — `useContacto.ts` and `getById` not implemented
  - **Verifies:** TC-1 — successful fetch returns data

- **Test:** `should expose data.nombre correctly after successful fetch`
  - **Status:** RED — not implemented
  - **Verifies:** TC-1 — data field access works

- **Test:** `should use canonical query key ["contactos", id]`
  - **Status:** RED — not implemented
  - **Verifies:** TC-1 — cache key deduplication

- **Test:** `should expose isError true when the API returns 404`
  - **Status:** RED — not implemented
  - **Verifies:** TC-2 — 404 maps to isError

- **Test:** `should expose isError true when the API returns 500`
  - **Status:** RED — not implemented
  - **Verifies:** TC-2 — 5xx maps to isError

- **Test:** `should expose isLoading true while fetch has not resolved`
  - **Status:** RED — not implemented
  - **Verifies:** TC-3 — isLoading during pending fetch

### Component Tests — ContactoDetailView (12 tests)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx`

- **Test:** `should display Nombre, Cargo, Teléfono, Email when contactoId resolves to a contact`
  - **Status:** RED — `ContactoDetailView.tsx` does not exist
  - **Verifies:** TC-2, AC #1 — all 4 fields rendered

- **Test:** `should display the detail panel container with data-testid="contacto-detail-panel"`
  - **Status:** RED — component does not exist
  - **Verifies:** TC-2 — panel testid present

- **Test:** `should display Spanish field labels: Nombre, Cargo, Teléfono, Email`
  - **Status:** RED — component does not exist
  - **Verifies:** TC-6, AC #1 — Spanish labels mandatory

- **Test:** `should display "Contacto no encontrado" when MSW returns 404`
  - **Status:** RED — not-found state not implemented
  - **Verifies:** TC-4, AC #3 — Spanish not-found message

- **Test:** `should NOT display contact data fields when contact is not found`
  - **Status:** RED — component does not exist
  - **Verifies:** TC-4 — no data leaked on 404

- **Test:** `should NOT cause a JavaScript crash when API returns 404`
  - **Status:** RED — no graceful 404 handling
  - **Verifies:** TC-4, NFR6 — crash-free 404

- **Test:** `should render ErrorPanel when GET /api/v1/contactos/:id returns 500`
  - **Status:** RED — ErrorPanel not wired
  - **Verifies:** TC-3, AC #4 — error panel shown

- **Test:** `should display "Reintentar" button in ErrorPanel`
  - **Status:** RED — not implemented
  - **Verifies:** TC-3, AC #4 — retry button present

- **Test:** `should trigger a new fetch when Reintentar button is clicked`
  - **Status:** RED — not implemented
  - **Verifies:** TC-3, AC #4 — retry triggers refetch

- **Test:** `should NOT expose technical error details in the error panel`
  - **Status:** RED — no error masking
  - **Verifies:** TC-3, NFR6 — no stack trace exposure

- **Test:** `should display loading skeleton while fetch is in-flight`
  - **Status:** RED — skeleton not implemented
  - **Verifies:** TC-1, AC #5 — skeleton during loading

- **Test:** `should render "Editar" button when contacto is loaded`
  - **Status:** RED — buttons not implemented
  - **Verifies:** TC-5, AC #6 — Editar button present

- **Test:** `should render "Eliminar" button when contacto is loaded`
  - **Status:** RED — buttons not implemented
  - **Verifies:** TC-5, AC #7 — Eliminar button present

### API Integration Tests — GET /api/v1/contactos/{id} (7 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactoByIdEndpointTests.cs`

- **Test:** `TC1_GetContactoById_Returns200_WithContactoDto_WhenContactExists`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** TC-1, AC #1, #2 — 200 + full ContactoDto

- **Test:** `TC1_GetContactoById_Returns_ContentTypeApplicationJson_WhenContactExists`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** TC-1 — correct Content-Type

- **Test:** `TC2_GetContactoById_Returns404_WithProblemDetails_WhenContactNotFound`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** TC-2, AC #3 — 404 + Problem Details RFC 7807

- **Test:** `TC2_GetContactoById_Returns_ProblemJsonContentType_WhenContactNotFound`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** TC-2 — RFC 7807 Content-Type

- **Test:** `TC2_GetContactoById_DoesNotExposeStackTrace_WhenContactNotFound`
  - **Status:** RED — no error handling
  - **Verifies:** TC-2, NFR6 — no stack traces in 404 body

- **Test:** `TC2_GetContactoById_Returns_SpanishTitleInProblemDetails_WhenNotFound`
  - **Status:** RED — endpoint does not exist
  - **Verifies:** TC-2 — Spanish title in Problem Details

- **Test:** `TC3_GetContactoById_Returns400_WhenIdIsNotValidUuid`
  - **Status:** RED — endpoint does not exist (or 404 from routing)
  - **Verifies:** TC-3 — 400 on invalid UUID format

---

## Data Factories Created / Extended

### Contacto Factory (already exists, used as-is)

**File:** `frontend/src/test/factories/contacto.factory.ts`

**Exports used:**
- `createContacto(overrides?)` — creates single ContactoTestData
- `createContactos(count)` — creates array
- `resetContactoCounter()` — resets sequential ID counter in beforeEach

**New MSW Handler Factory:**

**File:** `frontend/src/test/msw/handlers/contactos-detail.handlers.ts`

**Exports:**
- `handleGetContactoByIdSuccess(contacto)` — GET /:contactoId returns 200
- `handleGetContactoByIdNotFound(contactoId?)` — GET /:contactoId returns 404
- `handleGetContactoByIdDelayed(contacto, delayMs)` — GET /:contactoId delayed (loading tests)
- `handleGetContactoByIdError()` — GET /:contactoId returns 500

---

## Required data-testid Attributes

### ContactoDetailView Component

- `contacto-detail-panel` — outer detail panel container (shown when data loaded)
- `contacto-detail-skeleton` — skeleton loading container (visible during isLoading)
- `contacto-detail-error-panel` — error state container (visible when isError)
- `contacto-detail-retry-button` — retry button in error panel (text: "Reintentar")
- `contacto-edit-button` — "Editar" action button (placeholder for Story 3.4)
- `contacto-delete-button` — "Eliminar" action button (placeholder for Story 3.5)

### Route page `/contactos/$contactoId`

- No additional testids required beyond what ContactoDetailView provides

**Implementation Example:**

```tsx
// ContactoDetailView.tsx
{isLoading && <div data-testid="contacto-detail-skeleton">...</div>}
{isError && (
  <div data-testid="contacto-detail-error-panel">
    <button data-testid="contacto-detail-retry-button" onClick={refetch}>Reintentar</button>
  </div>
)}
{data && (
  <div data-testid="contacto-detail-panel">
    ...
    <button data-testid="contacto-edit-button">Editar</button>
    <button data-testid="contacto-delete-button">Eliminar</button>
  </div>
)}
```

---

## Mock Requirements

### GET /api/v1/contactos/:contactoId

**Success Response (200):**
```json
{
  "id": "10000000-0000-0000-0000-000000000001",
  "nombre": "Juan Pérez",
  "cargo": "Gerente de Ventas",
  "telefono": "3001234567",
  "email": "juan.perez@siesa.com",
  "clienteId": null,
  "createdAt": "2026-06-29T10:00:00Z"
}
```

**Not-Found Response (404 Problem Details):**
```json
{
  "status": 404,
  "title": "Contacto no encontrado",
  "detail": "No existe un contacto con id '00000000-0000-0000-0000-000000000000'."
}
```

**Error Response (500):**
```json
{ "status": 500, "title": "Internal Server Error" }
```

**Notes:**
- `createdAt` MUST be `DateTimeOffset` (ISO 8601 with TZ) — never plain `DateTime`
- `clienteId` may be null or a valid UUID (nullable FK)
- 404 must use RFC 7807 Problem Details with Content-Type: application/problem+json

---

## Implementation Checklist

### Backend: GET /api/v1/contactos/{id} endpoint

**Tests this makes pass:** TC-1, TC-2, TC-3 (all 7 backend integration tests)

- [ ] Update `IContactoRepository.cs` — add `Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)`
- [ ] Update `ContactoRepository.cs` — implement `GetByIdAsync` using `FindAsync` or `FirstOrDefaultAsync`
- [ ] Create `GetContactoByIdQuery.cs` — `record GetContactoByIdQuery(Guid Id) : IRequest<ContactoDto?>`
- [ ] Create `GetContactoByIdQueryHandler.cs` — calls `IContactoRepository.GetByIdAsync`, returns `ContactoDto` or `null`
- [ ] Update `ContactosEndpoints.cs` — add `GET /api/v1/contactos/{id}` endpoint:
  - Returns `200 OK` + `ContactoDto` when found
  - Returns `404 + Problem Details RFC 7807` when not found (no stack traces)
  - `{id}` bound as `Guid` — .NET returns 400 automatically on invalid UUID
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "ContactoByIdEndpoint"`
- [ ] ✅ All 7 tests pass (green phase)

**Estimated Effort:** 1–2 hours

---

### Frontend: useContacto hook

**Tests this makes pass:** 9 unit tests in `useContacto.test.ts`

- [ ] Update `IContactoRepository.ts` — add `getById(id: string): Promise<Contacto>` to the interface
- [ ] Update `contactoApiRepository.ts` — implement `getById(id)` calling `GET /api/v1/contactos/:id`; throw on 404
- [ ] Create `useContacto.ts`:
  ```typescript
  export function useContacto(id: string | null | undefined) {
    return useQuery({
      queryKey: ['contactos', id],
      queryFn: () => contactoApiRepository.getById(id!),
      enabled: !!id,
    })
  }
  ```
- [ ] Run: `pnpm vitest run frontend/src/modules/crm/contactos/application/useContacto.test.ts`
- [ ] ✅ All 9 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Frontend: ContactoDetailView component

**Tests this makes pass:** 12 component tests in `ContactoDetailView.test.tsx`

- [ ] Create `ContactoDetailView.tsx` at `frontend/src/modules/crm/contactos/presentation/`
  - Accepts `contactoId: string` prop
  - Calls `useContacto(contactoId)` hook
  - Shows `react-loading-skeleton` (data-testid: `contacto-detail-skeleton`) when `isLoading`
  - Shows `ErrorPanel` (data-testid: `contacto-detail-error-panel`) with retry button (`contacto-detail-retry-button`) when `isError`
  - Shows "Contacto no encontrado" when query returns 404/null data
  - Renders all fields in Spanish labels: Nombre, Cargo, Teléfono, Email
  - Renders panel container with `data-testid="contacto-detail-panel"`
  - Renders `Editar` button (`data-testid="contacto-edit-button"`) — placeholder
  - Renders `Eliminar` button (`data-testid="contacto-delete-button"`) — placeholder
  - Uses `<dl>`/`<dt>`/`<dd>` or equivalent semantic HTML (WCAG 2.1 AA)
  - Check siesa-ui-kit for `DetailPanel`/`InfoCard` before creating custom layout
- [ ] Run: `pnpm vitest run frontend/src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx`
- [ ] ✅ All 12 component tests pass (green phase)

**Estimated Effort:** 1–2 hours

---

### Frontend: TanStack Router route `/contactos/$contactoId`

**Tests this makes pass:** 8 E2E tests in `contacto-detail.spec.ts`

- [ ] Create `frontend/src/routes/_app/contactos.$contactoId.tsx`
  - Extract `contactoId` from route params via `useParams({ from: '/_app/contactos/$contactoId' })`
  - Render `<ContactoDetailView contactoId={contactoId} />`
- [ ] Update `frontend/src/routes/_app/contactos.tsx`
  - Ensure `ContactListItem` navigates to `/contactos/${contact.id}` on click (via TanStack Router `<Link>`)
- [ ] Run E2E: `pnpm playwright test e2e/tests/contactos/contacto-detail.spec.ts`
- [ ] ✅ All 8 E2E tests pass (green phase)

**Estimated Effort:** 0.5–1 hour

---

## Running Tests

```bash
# All ATDD tests for Story 3.2
# Backend integration tests
dotnet test backend/tests/SiesaAgents.IntegrationTests/ --filter "ContactoById"

# Frontend unit tests (useContacto hook)
pnpm --prefix frontend vitest run src/modules/crm/contactos/application/useContacto.test.ts

# Frontend component tests (ContactoDetailView)
pnpm --prefix frontend vitest run src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx

# E2E tests (Playwright)
pnpm playwright test e2e/tests/contactos/contacto-detail.spec.ts

# E2E headed mode (see browser)
pnpm playwright test e2e/tests/contactos/contacto-detail.spec.ts --headed

# E2E debug mode
pnpm playwright test e2e/tests/contactos/contacto-detail.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 36 tests written and failing
- MSW handler factory created (`contactos-detail.handlers.ts`)
- E2E, unit, component, and integration test levels covered
- Mock requirements documented
- data-testid requirements specified
- Implementation checklist created

**Verification:**

All tests fail due to missing implementation — not test bugs:
- E2E: `contacto-detail.spec.ts` → 404 because route `/contactos/$contactoId` does not exist
- Unit: `useContacto.test.ts` → "Cannot find module '../useContacto'"
- Component: `ContactoDetailView.test.tsx` → "Cannot find module '../ContactoDetailView'"
- API: `ContactoByIdEndpointTests.cs` → 404/405 because endpoint not registered

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist
6. Move to next test

**Recommended order:**
1. Backend: `IContactoRepository.GetByIdAsync` + `ContactoRepository` implementation
2. Backend: `GetContactoByIdQuery` + `GetContactoByIdQueryHandler`
3. Backend: Register `GET /api/v1/contactos/{id}` in `ContactosEndpoints.cs`
4. Frontend: Update `IContactoRepository.ts` + `contactoApiRepository.ts` with `getById`
5. Frontend: Create `useContacto.ts` hook
6. Frontend: Create `ContactoDetailView.tsx` component
7. Frontend: Create `contactos.$contactoId.tsx` route file

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 36 tests pass
2. Check siesa-ui-kit for `DetailPanel`/`InfoCard` equivalent
3. Ensure WCAG 2.1 AA compliance (semantic HTML in detail view)
4. Review Tailwind styling (Siesa Blue `#0e79fd` for primary actions)
5. Confirm `clienteId` is NOT displayed (Epic 4 scope)

---

## Test Files Summary

| Level | File | Tests | Status |
|-------|------|-------|--------|
| E2E (Playwright) | `e2e/tests/contactos/contacto-detail.spec.ts` | 8 | RED |
| Unit (Vitest+MSW) | `frontend/src/modules/crm/contactos/application/useContacto.test.ts` | 9 | RED |
| Component (Vitest+RTL+MSW) | `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx` | 12 | RED |
| API Integration (xUnit) | `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactoByIdEndpointTests.cs` | 7 | RED |
| MSW Handlers | `frontend/src/test/msw/handlers/contactos-detail.handlers.ts` | — | Support |
| **Total** | | **36** | **RED** |

---

## Knowledge Base References Applied

- **network-first.md** — Route interception BEFORE navigation in E2E tests
- **fixture-architecture.md** — Shared `ApiHelper` + `buildContacto` factory for E2E teardown
- **data-factories.md** — `createContacto(overrides?)` pattern with sequential counters
- **component-tdd.md** — `renderContactoDetailView()` helper isolates QueryClient per test
- **test-quality.md** — Given-When-Then format, one assertion per test, `onUnhandledRequest: 'error'`
- **selector-resilience.md** — All selectors use `data-testid` (no CSS/text fragile selectors)
- **test-levels-framework.md** — E2E for user journeys; API for contract; Component for UI; Unit for hook

---

**Generated by BMad TEA Agent** — 2026-06-29
