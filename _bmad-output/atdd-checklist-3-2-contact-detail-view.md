# ATDD Checklist - Epic 3, Story 3.2: Contact Detail View

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Component

---

## Story Summary

A commercial team member can view the complete details of a contact by selecting them from the list or navigating directly via URL. The detail view displays all four FR13 fields (Nombre, Cargo, Teléfono, Email) and handles not-found and backend-error scenarios gracefully.

**As a** commercial team member
**I want** to view the complete details of a contact by selecting them from the list
**So that** I can review all their information at once

---

## Acceptance Criteria

1. **Given** the contact list is displayed, **When** the user clicks on a contact item, **Then** the contact detail view shows: Nombre, Cargo, Teléfono, Email (FR13), **And** the URL updates to `/contactos/:contactoId` (FR30).

2. **Given** the user accesses `/contactos/:contactoId` directly via URL, **When** the page loads, **Then** the correct contact details are displayed (FR30).

3. **Given** a `contactoId` in the URL does not exist, **When** the page loads, **Then** a not-found message is displayed gracefully (no crash, no blank page).

4. **Given** the backend is unavailable when loading a specific contact detail, **When** the `GET /api/v1/contactos/:id` fetch fails with a non-404 error, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the contact data.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/contactos/contactos-detail-view.spec.ts`

- **Test:** `TC-E3-3-2-E2E-1: should show Nombre, Cargo, Teléfono, and Email in detail view when navigating directly to /contactos/:id`
  - **Status:** RED — fails until `ContactoDetailView` renders all 4 FR13 fields and `contactos.$contactoId.tsx` is fully implemented
  - **Verifies:** AC #1, #2 — deep link loads all 4 fields (FR13 + FR30)

- **Test:** `should update URL to /contactos/:contactoId when user clicks a contact item in the list`
  - **Status:** RED — fails until `ContactoListItem` uses TanStack Router `<Link>` for navigation
  - **Verifies:** AC #1 — URL updates on click (FR30)

- **Test:** `should show ErrorPanel with "Reintentar" button when backend fails with non-404 error on contact detail`
  - **Status:** RED — fails until `ContactoDetailView` renders `ErrorPanel` with `onRetry` on 500
  - **Verifies:** AC #4 — non-404 error shows ErrorPanel

- **Test:** `TC-E3-3-2-E2E-2: should display not-found message when navigating to /contactos/00000000-0000-0000-0000-000000000000`
  - **Status:** RED — fails until `ContactoDetailView` renders `NotFoundPanel` on 404
  - **Verifies:** AC #3 — not-found rendered gracefully (no crash)

### API Tests (5 tests)

**File:** `e2e/tests/api/contactos-detail.api.spec.ts`

- **Test:** `TC-E3-3-2-API-1: should return 200 with correct ContactoDto including all 4 FR13 fields when fetching an existing contact by id`
  - **Status:** RED — fails until `GET /api/v1/contactos/:id` returns valid ContactoDto (already implemented in Story 3.1 backend; this test verifies the contract)
  - **Verifies:** AC #2 — all 4 fields (Nombre, Cargo, Teléfono, Email) returned by API

- **Test:** `should return correct content-type application/json for a valid contact`
  - **Status:** RED — fails until endpoint responds with correct content-type
  - **Verifies:** API contract — application/json content type

- **Test:** `should return all required ContactoDto fields (id, nombre, cargo, telefono, email, clienteId, createdAt, updatedAt)`
  - **Status:** RED — fails until all DTO fields are present in response
  - **Verifies:** AC #2 — complete ContactoDto shape

- **Test:** `TC-E3-3-2-API-2: should return 404 with Problem Details RFC 7807 when contact id does not exist`
  - **Status:** RED — fails until endpoint returns RFC 7807 Problem Details on 404
  - **Verifies:** AC #3 — 404 with Problem Details, no crash

- **Test:** `should return content-type application/problem+json for a 404 response`
  - **Status:** RED — fails until endpoint returns correct content-type for Problem Details
  - **Verifies:** NFR6 — no stack traces, RFC 7807 content-type

- **Test:** `should return 404 for a syntactically valid but non-existent UUID`
  - **Status:** RED — fails until endpoint correctly handles valid-format but non-existent UUIDs
  - **Verifies:** AC #3 — no crash on valid UUID that doesn't exist

### Component Tests (11 tests)

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoDetailView.test.tsx`

- **Test:** `TC-E3-3-2-CMP-1: should display Nombre, Cargo, Teléfono, and Email when contact is loaded`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** AC #1, #2 — all 4 FR13 fields rendered

- **Test:** `should render Nombre as a heading element (text-xl font-bold)`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** Nombre rendered as `<h2>` heading

- **Test:** `should use data-testid="contacto-detail-view" on the root container`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** Correct data-testid on root element

- **Test:** `should render skeleton placeholders while contact data is loading`
  - **Status:** RED — fails because `ContactoDetailView` does not exist; also verifies react-loading-skeleton usage (not spinner)
  - **Verifies:** `isLoading` state uses react-loading-skeleton

- **Test:** `TC-E3-3-2-CMP-3: should show ErrorPanel with "Reintentar" button when fetch returns 500`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** AC #4 — ErrorPanel + Reintentar on non-404 error

- **Test:** `should trigger a new GET request when "Reintentar" button is clicked after 500 error`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** AC #4 — refetch triggered on Reintentar click

- **Test:** `should show ErrorPanel when network request fails completely (network error)`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** AC #4 — complete network failure also shows ErrorPanel

- **Test:** `TC-E3-3-2-CMP-2: should show NotFoundPanel with "Contacto no encontrado" title (not ErrorPanel) when fetch returns 404`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** AC #3 — 404 shows NotFoundPanel, NOT ErrorPanel

- **Test:** `should display not-found description text for 404 response in Spanish`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** AC #3 — description text "El contacto solicitado no existe o fue eliminado."

- **Test:** `should NOT show the "Reintentar" button on 404 (not an ephemeral error)`
  - **Status:** RED — fails because `ContactoDetailView` does not exist
  - **Verifies:** AC #3 — 404 is not transient; no Reintentar button shown

- **Test:** `TC-E3-3-2-CMP-4: should render ContactoListItem as a link that points to /contactos/$contactoId`
  - **Status:** RED — fails until `ContactoListItem` is updated to use TanStack Router `<Link>`
  - **Verifies:** AC #1 — clicking list item navigates to correct URL (FR30)

---

## Data Factories Used

### Contacto Factory (existing from Story 3.1)

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts`

**Exports used:**
- `buildContacto(overrides?)` — Build single Contacto with optional field overrides
- `buildContactoList(count, overridesFn?)` — Build array of Contactos
- `resetContactoCounter()` — Reset counter in afterEach for deterministic IDs

**E2E Factory (existing from Story 3.1):**

**File:** `e2e/helpers/data.helper.ts`

- `buildContacto(overrides?)` — Build contacto data for API seeding

---

## Fixtures

No new fixtures created. Existing infrastructure reused:

- `e2e/fixtures/base.fixture.ts` — Extended Playwright test with `contactosPage` fixture
- `e2e/helpers/api.helper.ts` — `ApiHelper.createContacto()` / `ApiHelper.deleteContacto()` for test data seeding and cleanup
- MSW server per component test file for network-first interception

---

## Mock Requirements

### GET /api/v1/contactos/:id

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "nombre": "María López",
  "cargo": "Gerente Comercial",
  "telefono": "3001234567",
  "email": "maria.lopez@empresa.co",
  "clienteId": null,
  "createdAt": "2026-06-28T10:30:00Z",
  "updatedAt": "2026-06-28T10:30:00Z"
}
```

**Not Found Response (404, Problem Details RFC 7807):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Contacto no encontrado",
  "status": 404,
  "detail": "El contacto solicitado no fue encontrado."
}
```

**Server Error Response (500):**

```json
{
  "title": "Internal Server Error",
  "status": 500
}
```

**Notes:** All E2E tests that mock the per-contact API endpoint intercept `**/api/v1/contactos/:id` BEFORE navigation using `page.route()`. Component tests use MSW `setupServer()` with `server.listen()` called in `beforeAll()`.

---

## Required data-testid Attributes

### ContactoDetailView Component

- `contacto-detail-view` — Root container of the detail view (already documented in story spec)

### Shared Components (confirmed from prior stories)

- `not-found-panel` — Root container of `NotFoundPanel` component (from Story 2.2)
- `error-panel` — Root container of `ErrorPanel` component (from Story 2.1)

### ContactoListItem Component (navigation update)

- `contacto-list-item` — List item root (already present from Story 3.1)

**Implementation example:**

```tsx
// ContactoDetailView.tsx
<div data-testid="contacto-detail-view" className="p-6">
  <h2 className="text-xl font-bold text-slate-900 mb-4">{data.nombre}</h2>
  <dl>
    <dt>Cargo</dt><dd>{data.cargo}</dd>
    <dt>Teléfono</dt><dd>{data.telefono}</dd>
    <dt>Email</dt><dd>{data.email}</dd>
  </dl>
</div>

// NotFoundPanel.tsx (already implemented)
<div data-testid="not-found-panel">...</div>

// ErrorPanel.tsx (already implemented)
<div data-testid="error-panel">...</div>
```

---

## Implementation Checklist

### Test: TC-E3-3-2-API-1 — GET /api/v1/contactos/:id returns 200 + ContactoDto

**File:** `e2e/tests/api/contactos-detail.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `IContactoRepository.GetByIdAsync(Guid id, CancellationToken ct)` exists — confirmed from Story 3.1
- [ ] Verify `ContactoRepository` implements `GetByIdAsync` — confirmed from Story 3.1
- [ ] Verify `GET /{id:guid}` is mapped in `ContactoEndpoints.cs` returning `Results.Ok(ContactoDto)` — confirmed from Story 3.1
- [ ] Verify `ContactoDto` includes all 4 FR13 fields: nombre, cargo, telefono, email
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/contactos-detail.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (endpoint already implemented — verification only)

---

### Test: TC-E3-3-2-API-2 — GET /api/v1/contactos/{unknown-uuid} returns 404 + Problem Details

**File:** `e2e/tests/api/contactos-detail.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `ContactoEndpoints.cs` returns `Results.Problem(statusCode: 404, ...)` (not `Results.NotFound()`)
- [ ] Verify response content-type is `application/problem+json` for 404
- [ ] Verify response body has `status`, `title`, `detail` fields (RFC 7807)
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/contactos-detail.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (endpoint already implemented — verification only)

---

### Test: TC-E3-3-2-CMP-1 — ContactoDetailView with valid ID shows all 4 fields

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `getById(id: string): Promise<Contacto>` to `IContactoRepository.ts`
- [ ] Implement `getById(id: string)` in `contactoApiRepository.ts` — `GET /api/v1/contactos/${id}` via `apiClient`
- [ ] Create `useContacto.ts` hook with `queryKey: ['contactos', id]`, `enabled: !!id`, `staleTime: 0`
- [ ] Create `ContactoDetailView.tsx` component:
  - Accept `contactoId: string` prop
  - Use `useContacto(contactoId)` hook
  - `isLoading` → react-loading-skeleton (4 lines, NOT spinner)
  - `isError` (non-404) → `<ErrorPanel onRetry={refetch} message="No se pudo cargar el contacto." />`
  - `isError` + 404 detection → `<NotFoundPanel title="Contacto no encontrado" description="El contacto solicitado no existe o fue eliminado." />`
  - Data loaded → detail card with Nombre (heading), Cargo, Teléfono, Email
  - `data-testid="contacto-detail-view"` on root element
  - All labels in Spanish
- [ ] Add `data-testid="contacto-detail-view"` to root element
- [ ] Run test: `pnpm --filter frontend test ContactoDetailView`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: TC-E3-3-2-CMP-2 — MSW 404 shows NotFoundPanel

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Implement 404 detection in `ContactoDetailView`: `axios.isAxiosError(error) && error.response?.status === 404`
- [ ] Render `<NotFoundPanel title="Contacto no encontrado" description="El contacto solicitado no existe o fue eliminado." />` for 404 (NOT ErrorPanel)
- [ ] Confirm `NotFoundPanel` has `data-testid="not-found-panel"` (confirmed from Story 2.2)
- [ ] Run test: `pnpm --filter frontend test ContactoDetailView`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (part of ContactoDetailView implementation)

---

### Test: TC-E3-3-2-CMP-3 — MSW 500 shows ErrorPanel + Reintentar

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Implement `isError` (non-404) state in `ContactoDetailView` → `<ErrorPanel onRetry={refetch} />`
- [ ] Confirm `ErrorPanel` has `data-testid="error-panel"` and "Reintentar" button (confirmed from Story 2.1)
- [ ] Run test: `pnpm --filter frontend test ContactoDetailView`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (part of ContactoDetailView implementation)

---

### Test: TC-E3-3-2-CMP-4 — ContactoListItem navigates to /contactos/$contactoId

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoDetailView.test.tsx`

**Tasks to make this test pass:**

- [ ] Update `ContactoListItem.tsx` to use TanStack Router `<Link to="/contactos/$contactoId" params={{ contactoId: contacto.id }}>` — NOT `window.location.href`
- [ ] Ensure the rendered element is an anchor (`<a>`) with `href` containing the contacto id
- [ ] Run test: `pnpm --filter frontend test ContactoDetailView`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E3-3-2-E2E-1 — Navigate to /contactos/:id shows all four fields

**File:** `e2e/tests/contactos/contactos-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Replace `ContactoDetailStub` in `contactos.$contactoId.tsx` with full `ContactoDetailPage`:
  - Left panel: `<ContactoListView />` (280px)
  - Right panel: `<ContactoDetailView contactoId={contactoId} />`
  - Read `contactoId` via `Route.useParams()`
- [ ] `ContactoDetailView` renders `data-testid="contacto-detail-view"` with all 4 fields visible
- [ ] Run test: `pnpm exec playwright test e2e/tests/contactos/contactos-detail-view.spec.ts --grep "TC-E3-3-2-E2E-1"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: TC-E3-3-2-E2E-2 — /contactos/00000000... shows not-found

**File:** `e2e/tests/contactos/contactos-detail-view.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `ContactoDetailView` renders `<NotFoundPanel>` on 404 (same as CMP-2)
- [ ] Verify `data-testid="not-found-panel"` is visible when 404 is received
- [ ] Run test: `pnpm exec playwright test e2e/tests/contactos/contactos-detail-view.spec.ts --grep "TC-E3-3-2-E2E-2"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by ContactoDetailView 404 implementation)

---

## Running Tests

```bash
# Run all E2E tests for this story
pnpm exec playwright test e2e/tests/contactos/contactos-detail-view.spec.ts

# Run API tests for this story
pnpm exec playwright test e2e/tests/api/contactos-detail.api.spec.ts

# Run component tests for this story
pnpm --filter frontend test ContactoDetailView

# Run all tests for Story 3.2 (API + E2E)
pnpm exec playwright test --grep "Story 3.2"

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/contactos/contactos-detail-view.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/contactos/contactos-detail-view.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (RED phase)
- contactoFactory reused from Story 3.1
- ApiHelper.createContacto / deleteContacto reused from Story 3.1
- Mock requirements documented for all 3 test levels
- data-testid requirements listed
- Implementation checklist created with per-test tasks

**Verification:**

- All 20 tests run and fail — failures due to missing implementation (`ContactoDetailView` not found, `useContacto` not found, `contactoApiRepository.getById` not implemented, route stub not replaced)
- E2E tests fail because `data-testid="contacto-detail-view"` does not exist in the DOM
- API tests may partially pass since backend is already implemented from Story 3.1 — this is expected and acceptable
- Component tests fail immediately on import due to missing `ContactoDetailView` module

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with API tests — quickest wins)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**

1. TC-E3-3-2-API-1 → Verify backend endpoint (Story 3.1 already done)
2. TC-E3-3-2-API-2 → Verify 404 Problem Details (Story 3.1 already done)
3. TC-E3-3-2-CMP-1 → Create `useContacto` + `ContactoDetailView` (all 4 fields)
4. TC-E3-3-2-CMP-3 → Add ErrorPanel state to ContactoDetailView
5. TC-E3-3-2-CMP-2 → Add NotFoundPanel state to ContactoDetailView
6. TC-E3-3-2-CMP-4 → Update ContactoListItem with TanStack Router Link
7. TC-E3-3-2-E2E-1 → Wire contactos.$contactoId.tsx (replace stub)
8. TC-E3-3-2-E2E-2 → Verify not-found E2E (covered by CMP-2 implementation)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Review `ContactoDetailView` for reusable patterns vs `ClienteDetailView` (Story 2.2)
2. Extract any duplication in 404 detection logic
3. Ensure `useContacto` query key matches architecture spec `['contactos', id]`
4. Verify all Spanish labels are consistent
5. Ensure tests still pass after refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/contactos/contactos-detail-view.spec.ts`
3. Begin implementation using implementation checklist — start with API verification (Task 1)
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: all E2E tests intercept `page.route()` BEFORE `page.goto()`; all component tests use `server.use()` BEFORE `render()`
- **data-factories.md** — `buildContacto()` factory from Story 3.1 reused; `resetContactoCounter()` called in `afterEach` for determinism
- **fixture-architecture.md** — `ApiHelper` used for E2E data seeding with `createdIds` array for cleanup in `afterEach`
- **test-quality.md** — Given-When-Then structure throughout; one assertion focus per test; no hard waits; explicit `waitFor` calls
- **selector-resilience.md** — `data-testid` selectors used exclusively (`contacto-detail-view`, `not-found-panel`, `error-panel`, `contacto-list-item`); no CSS selectors
- **timing-debugging.md** — `waitFor()` for async state resolution; no `sleep()` calls; `page.waitForURL()` for navigation assertions

---

**Generated by BMad TEA Agent** — 2026-06-28
