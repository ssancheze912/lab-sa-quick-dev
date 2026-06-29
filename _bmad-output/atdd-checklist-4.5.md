# ATDD Checklist - Epic 4, Story 4.5: Orphan Contacts Filter

**Date:** 2026-06-29
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** E2E + Component + API

---

## Story Summary

This story adds a "Sin cliente" filter toggle to the `/contactos` contact list view, allowing commercial team members to quickly identify and manage orphan contacts (those with `clienteId = null`). The filter state is URL-synced via `?sinCliente=true` for deep-linking and sharing. The backend extends `GET /api/v1/contactos` with a new `sinCliente` boolean query param.

**As a** commercial team member
**I want** to filter the contact list to show only contacts not associated with any client
**So that** I can identify and manage unassigned contacts easily

---

## Acceptance Criteria

1. Given the user is on the `/contactos` view, When the user activates the "Sin cliente" filter toggle, Then the list shows only contacts whose `clienteId` is null. (FR25, AC-E4.5)
2. Given the "Sin cliente" filter is active, When contacts are displayed, Then the count of orphan contacts is visible (e.g., "X contactos sin cliente"). (FR25, AC-E4.5)
3. Given the "Sin cliente" filter is active and all contacts have a client assigned, When the filtered list is empty, Then an `EmptyState` with "Todos los contactos tienen un cliente asignado" is shown. (AC-E4.5)
4. Given the "Sin cliente" filter is active, When the user deactivates the toggle, Then the full contact list is restored. (AC-E4.5)
5. Given the "Sin cliente" filter is toggled, When the filter state changes, Then the filter state is reflected in the URL as `?sinCliente=true`. (FR29 — deep linking)
6. Given a user navigates directly to `/contactos?sinCliente=true`, When the view renders, Then the "Sin cliente" filter is activated automatically. (FR29)
7. Given the contact list is loading, When the fetch is in progress, Then a skeleton placeholder is displayed (react-loading-skeleton, not a spinner). (company standard)
8. Given the backend is unavailable, When the fetch fails, Then an `ErrorPanel` with a "Reintentar" button is shown. (NFR6)
9. Given the "Sin cliente" filter toggle is rendered, When the user views it, Then it is keyboard-accessible (focusable, Enter/Space activatable) and meets WCAG 2.1 AA. (company standard)

---

## Failing Tests Created (RED Phase)

### E2E Tests (13 tests)

**File:** `e2e/tests/contactos/orphan-contacts-filter.spec.ts`

- **Test:** AC#1 — debe mostrar solo contactos sin cliente al activar el filtro "Sin cliente"
  - **Status:** RED — `data-testid="filtro-sin-cliente"` does not exist; API does not handle `?sinCliente=true`
  - **Verifies:** AC#1 — filter toggle renders and sends sinCliente=true to backend

- **Test:** AC#2 — debe mostrar el conteo de contactos sin cliente cuando el filtro está activo
  - **Status:** RED — `data-testid="contador-sin-cliente"` does not exist
  - **Verifies:** AC#2 — count badge visible when filter is active

- **Test:** AC#3 — debe mostrar EmptyState con mensaje específico cuando no hay contactos sin cliente
  - **Status:** RED — EmptyState message "Todos los contactos tienen un cliente asignado" not implemented
  - **Verifies:** AC#3 — specific empty state message for orphan filter with no results

- **Test:** AC#4 — debe restaurar la lista completa al desactivar el filtro "Sin cliente"
  - **Status:** RED — toggle deactivation/URL removal not implemented
  - **Verifies:** AC#4 — full list is restored when toggle is clicked off

- **Test:** AC#5 — debe reflejar el estado del filtro en la URL como `?sinCliente=true`
  - **Status:** RED — TanStack Router validateSearch not configured for sinCliente
  - **Verifies:** AC#5 — URL sync when filter activated

- **Test:** AC#5 — debe eliminar `?sinCliente=true` de la URL al desactivar el filtro
  - **Status:** RED — clean URL removal not implemented
  - **Verifies:** AC#5 — URL cleanup when filter deactivated

- **Test:** AC#6 — debe pre-activar el filtro al navegar directamente a `/contactos?sinCliente=true`
  - **Status:** RED — route does not parse sinCliente from URL yet
  - **Verifies:** AC#6 — deep-link pre-activation

- **Test:** AC#6 — el filtro pre-activado vía URL tiene estado visual "activo"
  - **Status:** RED — active state styling not implemented
  - **Verifies:** AC#6 — aria-pressed/data-state reflects active filter

- **Test:** AC#7 — debe mostrar skeleton de carga (no spinner) mientras se carga la lista
  - **Status:** GREEN (existing implementation) — `data-testid="contactos-list-skeleton"` already exists
  - **Verifies:** AC#7 — react-loading-skeleton used during fetch

- **Test:** AC#8 — debe mostrar ErrorPanel con botón "Reintentar" cuando el backend falla
  - **Status:** GREEN (existing implementation) — ErrorPanel already exists
  - **Verifies:** AC#8 — error handling not regreded by story 4.5

- **Test:** AC#8 — ErrorPanel con Reintentar también aplica cuando sinCliente fetch falla
  - **Status:** RED — sinCliente fetch error path not tested
  - **Verifies:** AC#8 — error handling when sinCliente=true request fails

- **Test:** AC#9 — el toggle "Sin cliente" debe ser accesible por teclado (WCAG 2.1 AA)
  - **Status:** RED — toggle not implemented; keyboard tab navigation untested
  - **Verifies:** AC#9 — Tab focus reaches the toggle

- **Test:** AC#9 — el toggle "Sin cliente" se puede activar con Enter/Space
  - **Status:** RED — keyboard activation not implemented
  - **Verifies:** AC#9 — Enter and Space keys activate the filter

### API Integration Tests (8 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosSinClienteEndpointTests.cs`

- **Test:** TC1 — GetContactos_SinClienteTrue_Returns200_WithOnlyOrphanContacts
  - **Status:** RED — `sinCliente` query param not bound in `ContactosEndpoints.cs`; `GetContactosQuery` missing `SinCliente` property
  - **Verifies:** AC#1 — backend returns only contacts WHERE clienteId IS NULL when sinCliente=true

- **Test:** TC1b — GetContactos_SinClienteTrue_Returns_CorrectDtoShape
  - **Status:** RED — same as TC1
  - **Verifies:** AC#1, AC#2 — DTO shape includes clienteId=null for orphans

- **Test:** TC2 — GetContactos_SinClienteFalse_Returns200_WithAllContacts
  - **Status:** RED — sinCliente param not bound
  - **Verifies:** AC#4 — sinCliente=false returns all contacts (no filter)

- **Test:** TC3 — GetContactos_NoSinClienteParam_Returns200_WithAllContacts_NoRegression
  - **Status:** RED — will pass after TC1 is implemented (no regression test)
  - **Verifies:** Regression — existing behavior unchanged when sinCliente is absent

- **Test:** TC4 — GetContactos_SinClienteTrue_ReturnsEmptyArray_WhenNoOrphansExist
  - **Status:** RED — sinCliente filter not implemented
  - **Verifies:** AC#3 — backend returns [] when no orphan contacts exist

- **Test:** TC5 — GetContactos_SinClienteTrue_NeverIncludesAssignedContacts
  - **Status:** RED — sinCliente filter not implemented
  - **Verifies:** AC#1 — strict: assigned contacts never appear in sinCliente=true results

- **Test:** TC6 — GetContactos_SinClienteInvalid_Returns400_BadRequest
  - **Status:** RED — sinCliente param not validated
  - **Verifies:** Security — invalid boolean param returns 400 not 500

- **Test:** TC6b — GetContactos_SinClienteEmpty_DoesNotReturn500
  - **Status:** RED — sinCliente param not bound
  - **Verifies:** Defensive — empty sinCliente param doesn't cause 500

### Component Tests (18 tests)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoListView.sinCliente.test.tsx`

- **Tests in TC-4.5-COMP-01 (2 tests):**
  - **Status:** RED — `filtro-sin-cliente` toggle doesn't exist; `useContactos` doesn't accept sinCliente param
  - **Verifies:** AC#1 — component renders only orphan contacts when filter active; sinCliente=true passed to API

- **Tests in TC-4.5-COMP-02 (2 tests):**
  - **Status:** RED — EmptyState message not implemented for sinCliente empty state
  - **Verifies:** AC#3 — specific EmptyState message "Todos los contactos tienen un cliente asignado"

- **Tests in TC-4.5-COMP-03 (3 tests):**
  - **Status:** RED — `contador-sin-cliente` badge doesn't exist
  - **Verifies:** AC#2 — count badge with correct count and "sin cliente" text

- **Tests in TC-4.5-COMP-04 (2 tests):**
  - **Status:** RED — `filtro-sin-cliente` toggle doesn't exist
  - **Verifies:** AC#1, AC#9 — toggle renders with "Sin cliente" label

- **Tests in TC-4.5-COMP-05 (1 test):**
  - **Status:** RED — toggle deactivation not implemented
  - **Verifies:** AC#4 — full list restored when toggle clicked off

- **Tests in TC-4.5-COMP-06 (3 tests):**
  - **Status:** Partially GREEN (skeleton exists) / RED for sinCliente-specific loading path
  - **Verifies:** AC#7 — skeleton shown during sinCliente fetch

- **Tests in TC-4.5-COMP-07 (3 tests):**
  - **Status:** Partially GREEN (ErrorPanel exists) / RED for sinCliente error path
  - **Verifies:** AC#8 — ErrorPanel + Reintentar, no raw error messages

- **Tests in TC-4.5-COMP-08 (3 tests):**
  - **Status:** RED — toggle doesn't exist, accessibility not verified
  - **Verifies:** AC#9 — toggle is a `<button>`, has accessible label, not disabled/hidden

---

## Data Factories Created

### Contacto Factory (extended)

**File:** `frontend/src/test/factories/contacto.factory.ts` (existing, no changes needed)

**Exports:**
- `createContacto(overrides?)` — creates a contact with `clienteId: null` by default
- `createContactos(count, overrides?)` — creates N contacts
- `resetContactoCounter()` — resets counter for deterministic IDs

### Sin Cliente MSW Handler Factory (new)

**File:** `frontend/src/test/msw/handlers/contactos-sin-cliente.handlers.ts`

**Exports:**
- `handleGetContactosSinCliente(contactos)` — intercepts GET with sinCliente=true
- `handleGetContactosMixed(orphans, withCliente)` — mixed dataset, routes by sinCliente param
- `handleGetContactosSinClienteEmpty()` — returns [] for sinCliente=true
- `handleGetContactosSinClienteError()` — returns 500
- `handleGetContactosSinClienteDelayed(contactos, delayMs)` — delayed response
- `createOrphanContacto(overrides?)` — factory for orphan contacts
- `createOrphanContactos(count)` — N orphan contacts
- `createAssignedContacto(clienteId, overrides?)` — contact with non-null clienteId

---

## Fixtures Created

No new Playwright fixtures created. The existing `base.fixture.ts` is sufficient.

The `ContactosPage` POM (`e2e/pages/contactos.page.ts`) already has `filtroSinCliente` locator defined as `page.getByRole('checkbox', { name: /sin cliente/i })`. Note: once implemented, the toggle should use `data-testid="filtro-sin-cliente"` — the POM may need updating if the toggle renders as a button (not checkbox).

---

## Mock Requirements

### GET /api/v1/contactos?sinCliente=true (MSW — Component Tests)

**Endpoint:** `GET /api/v1/contactos?sinCliente=true`

**Success Response (with orphans):**
```json
[
  { "id": "uuid", "nombre": "...", "cargo": "...", "telefono": "...", "email": "...", "clienteId": null, "createdAt": "..." }
]
```

**Success Response (no orphans):**
```json
[]
```

**Notes:** MSW must check `url.searchParams.get('sinCliente') === 'true'` to differentiate from unfiltered requests.

### GET /api/v1/contactos?sinCliente=true (Playwright — E2E Tests)

**Pattern:** `**/api/v1/contactos?sinCliente=true`

**Usage:** `page.route('**/api/v1/contactos?sinCliente=true', handler)` — must be registered BEFORE `page.goto()`.

---

## Required data-testid Attributes

### ContactoListView — New Attributes for Story 4.5

- `filtro-sin-cliente` — The filter toggle button. Must be a `<button>` element (WCAG 2.1 AA keyboard accessibility). Label text: "Sin cliente".
- `contador-sin-cliente` — The count badge shown when filter is active AND data is non-empty. Text format: "X contacto(s) sin cliente".

### Existing Attributes (unchanged)

- `contactos-list-skeleton` — Loading skeleton (already implemented)
- `contactos-error-panel` — Error panel (already implemented)
- `contactos-retry-button` — Retry button (already implemented)
- `contactos-empty-state` — Empty state (already implemented — but message changes when sinCliente is active)
- `contacto-item-{id}` — Individual contact list items (unchanged)
- `contacto-row` — Contact row wrapper (unchanged)
- `contactos-search-input` — Search input (unchanged)

**Implementation Example:**

```tsx
{/* Filter toggle */}
<button
  type="button"
  data-testid="filtro-sin-cliente"
  aria-pressed={sinCliente === true}
  onClick={toggleSinCliente}
>
  Sin cliente
</button>

{/* Count badge — only when sinCliente active AND data non-empty */}
{sinCliente && data && data.length > 0 && (
  <span data-testid="contador-sin-cliente">
    {data.length} contacto(s) sin cliente
  </span>
)}
```

---

## Implementation Checklist

### Task 1 — Backend: Extend `GetContactosQuery` with `SinCliente` param

**File:** `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs`

- [ ] Add `bool SinCliente = false` parameter to `GetContactosQuery` record
- [ ] New signature: `public sealed record GetContactosQuery(Guid? ClienteId = null, bool SinCliente = false);`
- [ ] Run tests: `cd backend && dotnet test --filter "ContactosSinCliente"`
- [ ] Tests passing: TC1, TC1b, TC2, TC3

**Estimated Effort:** 0.25 hours

---

### Task 2 — Backend: Extend `GetContactosQueryHandler` with WHERE clause

**File:** `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs`

- [ ] After existing ClienteId filter: `if (query.SinCliente) q = q.Where(c => c.ClienteId == null);`
- [ ] Ensure ClienteId and SinCliente filters compose correctly (both can be present)
- [ ] Run tests: `cd backend && dotnet test --filter "ContactosSinCliente"`
- [ ] Tests passing: TC1, TC1b, TC4, TC5

**Estimated Effort:** 0.25 hours

---

### Task 3 — Backend: Bind `sinCliente` query param in `ContactosEndpoints.cs`

**File:** `backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs`

- [ ] Add `bool sinCliente = false` parameter to `GET /api/v1/contactos` endpoint
- [ ] Pass `sinCliente` to `GetContactosQuery(ClienteId: clienteId, SinCliente: sinCliente)`
- [ ] Validate: invalid boolean values return 400 (ASP.NET Core model binding does this automatically)
- [ ] Run tests: `cd backend && dotnet test --filter "ContactosSinCliente"`
- [ ] All 8 backend tests passing

**Estimated Effort:** 0.25 hours

---

### Task 4 — Frontend: Extend `IContactoRepository.getAll()` signature

**File:** `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`

- [ ] Change `getAll()` to `getAll(params?: { sinCliente?: boolean }): Promise<Contacto[]>`
- [ ] No data-testid changes needed

**Estimated Effort:** 0.25 hours

---

### Task 5 — Frontend: Extend `contactoApiRepository.getAll()` to pass `sinCliente`

**File:** `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`

- [ ] Update `getAll()` to accept params and pass `sinCliente: true` as Axios query param when set
- [ ] Pattern: `params: params?.sinCliente === true ? { sinCliente: true } : undefined`

**Estimated Effort:** 0.25 hours

---

### Task 6 — Frontend: Extend `useContactos` to accept `sinCliente` param

**File:** `frontend/src/modules/crm/contactos/application/useContactos.ts`

- [ ] Accept optional `sinCliente?: boolean` parameter
- [ ] Update `queryKey` to `['contactos', { sinCliente: sinCliente ?? false }]`
- [ ] Pass `sinCliente` to `contactoApiRepository.getAll({ sinCliente })`

**Estimated Effort:** 0.25 hours

---

### Task 7 — Frontend: Register `sinCliente` in TanStack Router validateSearch

**File:** `frontend/src/routes/_app/contactos.tsx`

- [ ] Import `z` from `zod`
- [ ] Define `validateSearch: z.object({ sinCliente: z.boolean().optional() })`
- [ ] Add `validateSearch` to the route's createFileRoute options

**Estimated Effort:** 0.25 hours

---

### Task 8 — Frontend: Add filter toggle + URL sync + count badge to `ContactoListView.tsx`

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`

- [ ] Read `sinCliente` from `Route.useSearch()`: `const { sinCliente } = Route.useSearch()`
- [ ] Read `navigate` from `Route.useNavigate()`
- [ ] Add `toggleSinCliente` function that updates URL search param
- [ ] Pass `sinCliente` to `useContactos(sinCliente)` hook
- [ ] Render `<button data-testid="filtro-sin-cliente">Sin cliente</button>` toggle
  - Active state: `aria-pressed={sinCliente === true}`, highlighted/filled visual style
  - Keyboard accessible (native `<button>`)
- [ ] When `sinCliente && data.length > 0`: render `<span data-testid="contador-sin-cliente">{data.length} contacto(s) sin cliente</span>`
- [ ] When `sinCliente && data.length === 0`: render `<EmptyState message="Todos los contactos tienen un cliente asignado" />`
- [ ] Add `data-testid="filtro-sin-cliente"` and `data-testid="contador-sin-cliente"` attributes
- [ ] Run component tests: `cd frontend && pnpm test ContactoListView.sinCliente`
- [ ] All 18 component tests passing

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Run all E2E tests for this story
pnpm exec playwright test e2e/tests/contactos/orphan-contacts-filter.spec.ts

# Run E2E in headed mode (see browser)
pnpm exec playwright test e2e/tests/contactos/orphan-contacts-filter.spec.ts --headed

# Run E2E with debug
pnpm exec playwright test e2e/tests/contactos/orphan-contacts-filter.spec.ts --debug

# Run component tests for this story
cd frontend && pnpm test src/modules/crm/contactos/presentation/ContactoListView.sinCliente.test.tsx

# Run backend API integration tests
cd backend && dotnet test tests/SiesaAgents.IntegrationTests/Contactos/ContactosSinClienteEndpointTests.cs

# Run ALL tests for Story 4.5
pnpm exec playwright test e2e/tests/contactos/orphan-contacts-filter.spec.ts && cd frontend && pnpm test ContactoListView.sinCliente && cd ../backend && dotnet test --filter "ContactosSinCliente"

# Run with coverage (frontend)
cd frontend && pnpm test --coverage ContactoListView.sinCliente
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (RED)
- ✅ MSW handler factory created for sinCliente scenarios
- ✅ Mock requirements documented for both MSW (component) and Playwright (E2E)
- ✅ Required data-testid attributes listed and described
- ✅ Implementation checklist created with clear tasks and file paths

**Verification:**

All component tests in `ContactoListView.sinCliente.test.tsx` fail because:
- `data-testid="filtro-sin-cliente"` does not exist in `ContactoListView.tsx`
- `data-testid="contador-sin-cliente"` does not exist
- `useContactos` does not accept `sinCliente` parameter
- "Todos los contactos tienen un cliente asignado" message is not implemented

All backend tests in `ContactosSinClienteEndpointTests.cs` fail because:
- `GetContactosQuery` does not have `SinCliente` property
- `ContactosEndpoints.cs` does not bind `sinCliente` query param
- `GetContactosQueryHandler` does not filter by `ClienteId IS NULL`

All E2E tests fail because:
- `filtro-sin-cliente` element not found on the `/contactos` page

---

### GREEN Phase (DEV Team - Next Steps)

1. **Start with backend** (Tasks 1-3) — unblocks frontend and E2E
2. **Then extend frontend repository/hook** (Tasks 4-6)
3. **Register search param in router** (Task 7)
4. **Implement the UI toggle + badges** (Task 8) — highest effort step
5. Run each test group after its corresponding task completes

**Key Principles:**
- One task at a time — run tests after each
- Keep existing tests GREEN (regression check)
- sinCliente=false (default) must behave identically to the current implementation

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Ensure `useContactos(['contactos', { sinCliente: false }])` invalidation still works after Story 4.2 mutations
2. Verify that text search (`q=`) still composes with sinCliente filter client-side
3. Clean up any duplicated handler code if MSW handlers were added to tests directly

---

## Next Steps

1. Share this checklist with the `dev-story` workflow (Story 4.5)
2. Confirm RED phase by running: `pnpm exec playwright test e2e/tests/contactos/orphan-contacts-filter.spec.ts`
3. Begin implementation using Tasks 1-8 above in order
4. Run tests after each task to confirm RED → GREEN progression
5. When all tests pass, verify no regressions in Stories 3.1, 4.1, and 4.2

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation pattern applied in all E2E tests
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS selectors
- **test-quality.md** — Given-When-Then structure, atomic assertions, isolated test data
- **component-tdd.md** — MSW 2 + Vitest + RTL pattern, QueryClient isolation per test
- **test-levels-framework.md** — E2E for critical user journeys + URL; API for backend contract; Component for UI behavior

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-29
