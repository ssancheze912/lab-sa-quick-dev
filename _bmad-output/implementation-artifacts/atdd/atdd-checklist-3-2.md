# ATDD Checklist — Epic 3, Story 3.2: Contact Detail View

**Date:** 2026-05-21
**Story:** 3.2 — Contact Detail View
**Epic:** 3 — Contact Management
**Primary Test Level:** E2E + API
**Phase:** RED (failing tests written; implementation not yet started)

---

## Story Summary

**As a** commercial team member,
**I want** to view the complete details of a contact by selecting them from the list,
**So that** I can review all their information at once.

---

## Acceptance Criteria

1. **AC1** — Given the contact list is displayed, When the user clicks on a contact item, Then the contact detail view shows: Nombre, Cargo, Teléfono, Email (FR13) And the URL updates to `/contactos/:contactoId` (FR30).

2. **AC2** — Given the user accesses `/contactos/:contactoId` directly via URL, When the page loads, Then the correct contact details are displayed (FR30).

3. **AC3** — Given a contactoId in the URL does not exist, When the page loads, Then a not-found message is displayed gracefully.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (4 tests)

**File:** `e2e/tests/contactos/contactos-detail.spec.ts`

- **Test: E2E-CT-07** — hacer clic en un contacto muestra el panel de detalle con los 4 campos
  - **Priority:** P0
  - **AC:** AC1
  - **Status:** RED — `ContactoDetailPanel` component not implemented; `GET /api/v1/contactos/:id` endpoint does not exist; `data-testid="contacto-detail-panel"` not rendered; `data-testid="contacto-detail-nombre"`, `"contacto-detail-cargo"`, `"contacto-detail-telefono"`, `"contacto-detail-email"` do not exist; `ContactoListItem` not wrapped in `<Link>`; `/contactos` route has no `<Outlet />`
  - **Verifies:** AC1 — After clicking a contact row in the list, `contacto-detail-panel` is visible and all 4 field testids display the correct values from the created contact

- **Test: E2E-CT-08** — la URL se actualiza a /contactos/:contactoId al hacer clic en un contacto
  - **Priority:** P1
  - **AC:** AC1 (FR30)
  - **Status:** RED — TanStack Router dynamic route `/contactos/$contactoId` not created; `ContactoListItem` not wrapped in `<Link>`; URL does not update on click
  - **Verifies:** AC1 (FR30) — After clicking a contact row, `page.url()` contains `/contactos/{uuid}` matching regex `/\/contactos\/[0-9a-f]{8}-[0-9a-f]{4}-/i`

- **Test: E2E-CT-09** — navegación directa a /contactos/:id carga el detalle correcto
  - **Priority:** P1
  - **AC:** AC2 (FR30)
  - **Status:** RED — TanStack Router route `/contactos/$contactoId` not registered; `ContactoDetailPanel` not implemented; `GET /api/v1/contactos/:id` endpoint does not exist
  - **Verifies:** AC2 (FR30) — `page.goto('/contactos/:id')` directly loads `contacto-detail-panel` with the correct `nombre` and `email` without prior list interaction

- **Test: E2E-CT-10** — navegar a un contactoId inexistente muestra "Contacto no encontrado" sin errores JS
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — `ContactoDetailPanel` 404 branch (`data-testid="contacto-not-found"`) not implemented; `useContactoById` hook with `retry: false` not created; `GET /api/v1/contactos/:id` returning 404 Problem Details not implemented
  - **Verifies:** AC3 — After navigating to a non-existent UUID, `contacto-not-found` testId is visible with text matching `/contacto no encontrado/i` and no `pageerror` events are fired

---

### API Integration Tests — Playwright APIRequestContext (2 tests)

**File:** `e2e/tests/contactos/contactos-api.spec.ts` (Story 3.2 describe block: `Story 3.2 — API: GET /api/v1/contactos/:id`)

- **Test: API-CT-08** — GET /api/v1/contactos/:id con ID válido devuelve 200 + ContactoDto completo con clienteId: null
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `GET /api/v1/contactos/{id:guid}` endpoint not registered; `GetContactoByIdQueryHandler` not created; `IContactoRepository.GetByIdAsync` not implemented
  - **Verifies:** AC2 — HTTP 200; body is a direct object (not array, not wrapper `{ data: {} }`); fields `id` (UUID), `nombre`, `cargo`, `telefono`, `email` match the created contact; `clienteId` is `null`; `createdAt` and `updatedAt` are ISO 8601 with timezone (DateTimeOffset)

- **Test: API-CT-09** — GET /api/v1/contactos/:id con ID inexistente devuelve 404 Problem Details sin stackTrace
  - **Priority:** P1
  - **AC:** AC3 (NFR6)
  - **Status:** RED — `GET /api/v1/contactos/{id:guid}` endpoint not registered; when endpoint exists, 404 Problem Details response not yet returning `Content-Type: application/problem+json`; `stackTrace` key not suppressed
  - **Verifies:** AC3 (NFR6) — HTTP 404; `Content-Type` contains `problem+json`; body has `status: 404` and non-empty `title`; no `stackTrace`, `StackTrace`, or `stack_trace` key present

---

## Supporting Infrastructure

### Page Object Model

**File:** `e2e/pages/contactos.page.ts` — **already exists and complete for Story 3.2**

Key locators verified:

| Locator | Property | Selector |
|---|---|---|
| Contact rows | `contactoRows` | `getByTestId('contacto-row')` |
| Detail panel | `detailPanel` | `getByTestId('contacto-detail-panel')` |
| Select contact action | `seleccionarContacto(nombre)` | `getByTestId('contacto-row').filter({ hasText: nombre }).click()` |

No POM changes required for Story 3.2.

### Data Factory

**File:** `e2e/helpers/data.helper.ts` — **already exists and complete for Story 3.2**

`buildContacto(overrides?)` factory exports all fields needed:

```typescript
buildContacto({
  nombre: 'María García',
  cargo: 'Gerente Comercial',
  telefono: '+57 1 234 5679',
  email: 'm.garcia@empresa.com',
})
```

No factory changes required for Story 3.2.

### API Helper

**File:** `e2e/helpers/api.helper.ts` — **already exists and complete for Story 3.2**

`ApiHelper` exports `createContacto()` and `deleteContacto()` — both used in E2E test setup/teardown. No changes required.

### Base Fixture

**File:** `e2e/fixtures/base.fixture.ts` — **already exists and complete for Story 3.2**

Provides `contactosPage` fixture with `page.goto('/contactos')` setup. No changes required.

---

## Required data-testid Attributes

All `data-testid` attributes must be present in the frontend implementation for E2E tests to pass.

### ContactoDetailPanel Component (`frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`)

| Attribute | Element | Condition | Used By |
|---|---|---|---|
| `contacto-detail-panel` | Root `<div>` | Always (loading and loaded states) | E2E-CT-07, E2E-CT-09 |
| `contacto-detail-nombre` | Nombre value `<span>` | When data loaded | E2E-CT-07, E2E-CT-09 |
| `contacto-detail-cargo` | Cargo value `<span>` | When data loaded | E2E-CT-07 |
| `contacto-detail-telefono` | Teléfono value `<span>` | When data loaded | E2E-CT-07 |
| `contacto-detail-email` | Email value `<span>` | When data loaded | E2E-CT-07, E2E-CT-09 |
| `contacto-not-found` | Not-found `<div>` | When 404 response | E2E-CT-10 |

**Implementation Example:**

```tsx
// Loaded state root
<div data-testid="contacto-detail-panel" aria-label="Detalle del contacto">

// Individual fields
<span data-testid="contacto-detail-nombre">{data.nombre}</span>
<span data-testid="contacto-detail-cargo">{data.cargo}</span>
<span data-testid="contacto-detail-telefono">{data.telefono}</span>
<span data-testid="contacto-detail-email">{data.email}</span>

// 404 not-found state
<div data-testid="contacto-not-found">Contacto no encontrado</div>
```

**Important:** `data-testid="contacto-detail-panel"` must also be present on the root element during the **loading skeleton state** (so the panel locator resolves before data is available).

---

## Mock / Intercept Strategy

| Test | Strategy | Pattern |
|---|---|---|
| E2E-CT-07 | `page.route('**/api/v1/contactos', route => route.continue())` before `goto()` | Network-first intercept; real API used for data; allows detail fetch to proceed normally |
| E2E-CT-08 | Same as CT-07 | Allows URL update to propagate after click |
| E2E-CT-09 | `page.route('**/api/v1/contactos/${contacto.id}', route => route.continue())` before `page.goto()` | Network-first; intercept single-contact route before direct navigation |
| E2E-CT-10 | `page.route('**/api/v1/contactos/${nonExistentId}', route => route.fulfill({ status: 404, ... }))` before `page.goto()` | Simulates 404 gracefully; no real DB needed; registered BEFORE navigation to avoid race condition |
| API-CT-08 | No mocking — direct `request.post()` then `request.get()` | Requires backend running at `http://localhost:5000` |
| API-CT-09 | No mocking — direct `request.get()` with non-existent UUID | Requires backend running; verifies no `stackTrace` in response body |

---

## Implementation Checklist

### Test Group: E2E-CT-07 — Click contact → detail panel shows 4 fields

**File:** `e2e/tests/contactos/contactos-detail.spec.ts`

**Tasks to make this test pass:**

- [ ] Task 1 (Backend): Create `GetContactoByIdQuery.cs` — record with `Guid Id` parameter
- [ ] Task 1 (Backend): Create `GetContactoByIdQueryHandler.cs` — calls `IContactoRepository.GetByIdAsync(id, ct)`, maps to `ContactoDto`
- [ ] Task 1 (Backend): Add `GetByIdAsync(Guid id, CancellationToken ct): Task<ContactoEntity?>` to `IContactoRepository` interface
- [ ] Task 1 (Backend): Implement `GetByIdAsync` in `ContactoRepository.cs` → `_context.Contactos.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)`
- [ ] Task 1 (Backend): Add `GET /{id:guid}` endpoint to `ContactoEndpoints.cs` — returns `200 OK + ContactoDto` or `404 Problem Details`
- [ ] Task 1 (Backend): Register `GetContactoByIdQueryHandler` in `Program.cs` DI
- [ ] Task 2 (Frontend): Create `useContactoById.ts` TanStack Query hook — `queryKey: ['contactos', id]`, `enabled: !!id`, `retry: false`
- [ ] Task 2 (Frontend): Add `getById(id: string): Promise<Contacto>` to `IContactoRepository.ts` interface
- [ ] Task 2 (Frontend): Implement `getById` in `contactoApiRepository.ts` → `GET /api/v1/contactos/:id`
- [ ] Task 3 (Frontend): Create `ContactoDetailPanel.tsx` with `data-testid="contacto-detail-panel"` on root element
- [ ] Task 3 (Frontend): Add `data-testid="contacto-detail-nombre"`, `"contacto-detail-cargo"`, `"contacto-detail-telefono"`, `"contacto-detail-email"` on respective value spans
- [ ] Task 3 (Frontend): Add loading skeleton (4 rows via `react-loading-skeleton`) — NOT spinner — root element must still have `data-testid="contacto-detail-panel"` in loading state
- [ ] Task 4 (Frontend): Create `/contactos/$contactoId` TanStack Router route (`contactos.$contactoId.tsx`) rendering `ContactoDetailPanel`
- [ ] Task 5 (Frontend): Wrap `ContactoListItem` in `ContactoListView.tsx` with TanStack Router `<Link>` pointing to `/contactos/$contactoId`
- [ ] Task 6 (Frontend): Add `<Outlet />` to `/contactos` route (`contactos.tsx`) for nested detail panel rendering
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-detail.spec.ts --grep "E2E-CT-07"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test Group: E2E-CT-08 — Click contact → URL updates to /contactos/:id

**File:** `e2e/tests/contactos/contactos-detail.spec.ts`

**Tasks to make this test pass:**

- [ ] Depends on Tasks 4, 5, and 6 from E2E-CT-07 group (route, Link, Outlet)
- [ ] Verify TanStack Router `<Link to="/contactos/$contactoId" params={{ contactoId: id }}>` generates the correct href
- [ ] Verify `page.waitForURL('**/contactos/${contacto.id}')` resolves after click
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-detail.spec.ts --grep "E2E-CT-08"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (blocked by CT-07 tasks)

---

### Test Group: E2E-CT-09 — Direct navigation to /contactos/:id loads correct detail

**File:** `e2e/tests/contactos/contactos-detail.spec.ts`

**Tasks to make this test pass:**

- [ ] Depends on all backend and frontend tasks from E2E-CT-07 group
- [ ] Verify `contactos.$contactoId.tsx` route reads `contactoId` from `Route.useParams()` and passes it to `ContactoDetailPanel`
- [ ] Verify `useContactoById(contactoId)` triggers `GET /api/v1/contactos/:id` when `contactoId` is defined
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-detail.spec.ts --grep "E2E-CT-09"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (blocked by CT-07 tasks)

---

### Test Group: E2E-CT-10 — Non-existent ID → not-found message, no JS errors

**File:** `e2e/tests/contactos/contactos-detail.spec.ts`

**Tasks to make this test pass:**

- [ ] Depends on Tasks 2 and 3 from E2E-CT-07 group (hook with `retry: false`, ContactoDetailPanel)
- [ ] Task 3 (Frontend): In `ContactoDetailPanel`, distinguish 404 error from generic error — inspect `error.response?.status === 404` from Axios error
- [ ] Task 3 (Frontend): Render `<div data-testid="contacto-not-found">Contacto no encontrado</div>` when 404 detected
- [ ] Task 3 (Frontend): Render `<ErrorPanel />` for all other errors (non-404)
- [ ] Verify `useContactoById` `retry: false` prevents retrying 404 responses (avoids infinite loops)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-detail.spec.ts --grep "E2E-CT-10"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: API-CT-08 — GET /api/v1/contactos/:id valid → 200 + ContactoDto

**File:** `e2e/tests/contactos/contactos-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Task 1 (Backend): Register `GET /{id:guid}` in `ContactoEndpoints.cs` returning `Results.Ok(contactoDto)`
- [ ] Task 1 (Backend): `ContactoDto` must include all fields: `id`, `nombre`, `cargo`, `telefono`, `email`, `clienteId`, `createdAt`, `updatedAt`
- [ ] Task 1 (Backend): Verify response is a direct object — no `{ data: {} }` wrapper
- [ ] Task 1 (Backend): Verify `clienteId` is serialized as `null` when not set
- [ ] Task 1 (Backend): Verify `createdAt`/`updatedAt` use `DateTimeOffset` (not `DateTime`) for ISO 8601 timezone compliance
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "API-CT-08"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: API-CT-09 — GET /api/v1/contactos/:id non-existent → 404 Problem Details

**File:** `e2e/tests/contactos/contactos-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Task 1 (Backend): Endpoint returns `Results.Problem(statusCode: 404, title: "Not Found", detail: "...")` when handler returns `null`
- [ ] Task 1 (Backend): Verify ASP.NET Core serializes Problem Details with `Content-Type: application/problem+json`
- [ ] Task 1 (Backend): Ensure production middleware does NOT include `stackTrace` in error responses (NFR6)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "API-CT-09"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (blocked by API-CT-08 tasks)

---

## Running Tests

```bash
# Run all Story 3.2 E2E tests
npx playwright test e2e/tests/contactos/contactos-detail.spec.ts

# Run Story 3.2 API integration tests only
npx playwright test e2e/tests/contactos/contactos-api.spec.ts --grep "Story 3.2"

# Run all Story 3.2 tests at once
npx playwright test e2e/tests/contactos/contactos-detail.spec.ts e2e/tests/contactos/contactos-api.spec.ts

# Run a specific test by ID
npx playwright test e2e/tests/contactos/contactos-detail.spec.ts --grep "E2E-CT-07"
npx playwright test e2e/tests/contactos/contactos-detail.spec.ts --grep "E2E-CT-10"

# Run in headed mode for debugging
npx playwright test e2e/tests/contactos/contactos-detail.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/contactos/contactos-detail.spec.ts --grep "E2E-CT-07" --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All 6 tests are written in failing state. Expected failure reasons before implementation:

- **E2E-CT-07**: `contactosPage.seleccionarContacto(nombre)` clicks a row but no navigation happens; `contactosPage.detailPanel` (`getByTestId('contacto-detail-panel')`) times out — `ContactoDetailPanel` component does not exist
- **E2E-CT-08**: Same as CT-07; `page.waitForURL('**/contactos/${contacto.id}')` times out — TanStack Router route not registered and `<Link>` not in place
- **E2E-CT-09**: `page.goto('/contactos/${contacto.id}')` — TanStack Router route not registered; page renders fallback or 404 app error; `contacto-detail-panel` times out
- **E2E-CT-10**: `page.goto('/contactos/${nonExistentId}')` — route not registered; `contacto-not-found` testId times out; risk of unhandled error events
- **API-CT-08**: `GET http://localhost:5000/api/v1/contactos/${id}` → `404 Not Found` (endpoint not registered at the `/{id:guid}` path)
- **API-CT-09**: Same as API-CT-08; endpoint not found; `status` assertion fails (`404` expected but `404` for wrong reason — no Problem Details format)

### GREEN Phase (DEV Team — Next Steps)

Priority order to make tests pass one at a time:

1. **Backend Tasks 1a–1f** (endpoint, handler, repository method) — unblocks API-CT-08, API-CT-09
2. **Frontend Task 2** (`useContactoById` hook + `getById` in repository) — unblocks hook layer
3. **Frontend Task 3** (`ContactoDetailPanel` component with all testids + skeleton + 404/error states) — unblocks E2E-CT-07, E2E-CT-10
4. **Frontend Task 4** (`contactos.$contactoId.tsx` route) + **Task 6** (add `<Outlet />` to `/contactos`) — unblocks E2E-CT-08, E2E-CT-09
5. **Frontend Task 5** (wrap `ContactoListItem` with `<Link>`) — completes E2E-CT-07, E2E-CT-08

### REFACTOR Phase (DEV Team — After All Tests Pass)

- Verify `data-testid="contacto-detail-panel"` is present on the root in both loading AND loaded states
- Confirm loading state uses `react-loading-skeleton` (4 skeleton rows) — NOT a spinner
- Confirm all user-facing text is in Spanish (`"Contacto no encontrado"`, field labels)
- Confirm `useContactoById` has `retry: false` and `enabled: !!id`
- Confirm query key is an array `['contactos', id]` — NOT a plain string
- Confirm 404 detection uses `error.response?.status === 404` from Axios error (not just `isError`)
- Verify no `stackTrace` field leaks from backend in any error scenario
- Confirm `DateTimeOffset` used throughout backend (not `DateTime`)

---

## Coverage Matrix — Story 3.2

| AC | Requirement | Test(s) | Level | Status |
|---|---|---|---|---|
| AC1 | Click contact row → detail panel shows Nombre, Cargo, Teléfono, Email | E2E-CT-07 | E2E (P0) | RED |
| AC1 (FR30) | Click contact row → URL updates to `/contactos/:id` | E2E-CT-08 | E2E (P1) | RED |
| AC2 (FR30) | Direct URL navigation loads correct contact detail | E2E-CT-09, API-CT-08 | E2E + API (P1) | RED |
| AC3 | Non-existent ID → not-found message gracefully | E2E-CT-10, API-CT-09 | E2E + API (P1) | RED |
| NFR6 | No stackTrace in 404 response | API-CT-09 | API (P1) | RED |

**Coverage: All 3 AC requirements + NFR6 addressed — 100%**

---

## Notes

- Story 3.2 mirrors the pattern of Story 2.2 (Client Detail View). Reference `e2e/tests/clientes/clientes-detail.spec.ts` for analogous test patterns already green.
- The 404 handling in `ContactoDetailPanel` requires distinguishing network/server errors (generic `isError`) from a 404 specifically — inspect `error.response?.status === 404` from the Axios error object in `useContactoById`.
- All test infrastructure (POM, ApiHelper, `buildContacto` factory, base fixture) is already in place from Story 3.1 ATDD — no new support files required.
- E2E-CT-10 registers `page.on('pageerror', ...)` **before** the network route intercept and before `page.goto()` — this order is intentional to catch any synchronous initialization errors.

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-21
