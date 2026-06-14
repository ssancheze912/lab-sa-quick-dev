# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-14
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** Component (Vitest + RTL + MSW) + E2E (Playwright) + Hook unit

---

## Story Summary

As a commercial team member, I want to view the complete details of a client by selecting them from the list, so that I can review all their information without navigating away from the clients section.

This story builds the right panel (detail view) of the master-detail CRM layout, including:
- `ClienteDetailView` component with 4 field groups (Nombre, NIT/RUC, Teléfono, Ciudad)
- `useCliente` TanStack Query hook fetching `GET /api/v1/clientes/:id`
- TanStack Router route `/clientes/$clienteId` (file-based, dynamic segment)
- Deep-link support (FR30): direct URL access loads client without prior list navigation
- Graceful not-found handling (404 → "Cliente no encontrado." message)
- Skeleton loading state in the right panel
- Placeholder state when no client is selected (`clienteId = null`)

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad, and the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on `/clientes` with no client selected, **When** the right panel is displayed, **Then** a placeholder message "Selecciona un cliente para ver sus detalles." is shown in the right panel.

3. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (deep link), **Then** the correct client details are loaded and displayed without requiring prior navigation through the list (FR30).

4. **Given** a `clienteId` in the URL does not exist in the system, **When** the page loads, **Then** a not-found message "Cliente no encontrado." is displayed gracefully in the right panel — no crash, no blank screen, no console error.

5. **Given** the client detail is loading after selection, **When** data has not yet arrived, **Then** a skeleton placeholder is displayed in the right panel instead of the detail content.

6. **Given** a client is selected and the detail is visible, **When** the user clicks a different client in the list, **Then** the right panel updates to show the new client's details and the URL updates to `/clientes/:newClienteId`.

---

## Failing Tests Created (RED Phase)

### Hook Tests (8 tests)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useCliente.test.ts`

- **Test:** AC#5 — should return isLoading=true initially while fetch is in progress
  - **Status:** RED — `useCliente` hook does not exist; `Cannot find module '../useCliente'`
  - **Verifies:** AC#5 — loading skeleton triggerable by parent

- **Test:** AC#3 — should return the correct cliente when API responds with 200
  - **Status:** RED — hook and `clienteApiRepository.getById` not implemented
  - **Verifies:** AC#3 — direct URL access returns correct client data

- **Test:** AC#3 — should return typed Cliente with all 7 required fields
  - **Status:** RED — same
  - **Verifies:** AC#3 — domain type compliance (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)

- **Test:** AC#4 — should return data=null when API returns 404 (TC-E2-P1-05)
  - **Status:** RED — `getById` 404 handling not implemented
  - **Verifies:** AC#4 — graceful 404 → null (no error thrown)

- **Test:** 5xx — should expose isError=true when API returns 500
  - **Status:** RED — hook not implemented
  - **Verifies:** Error propagation for non-404 errors

- **Test:** AC#2 — should NOT fetch when id is null (disabled query)
  - **Status:** RED — `enabled: !!id` guard not implemented
  - **Verifies:** AC#2 — placeholder state; no spurious fetch when no client selected

- **Test:** disabled — should NOT fetch when id is empty string
  - **Status:** RED — same
  - **Verifies:** Guard against falsy ids

- **Test:** architecture — should use queryKey ["clientes", id]
  - **Status:** RED — hook not implemented
  - **Verifies:** TanStack Query key per architecture.md

---

### Component Tests (18 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**AC#2 — Placeholder state (3 tests):**

- **Test:** should render placeholder message when clienteId is null
  - **Status:** RED — `ClienteDetailView` does not exist
  - **Verifies:** AC#2 — "Selecciona un cliente para ver sus detalles." rendered

- **Test:** should render placeholder with role="status" for accessibility
  - **Status:** RED — same
  - **Verifies:** AC#2 — WCAG 2.1 AA: role="status" on placeholder

- **Test:** should NOT render detail content or skeleton when clienteId is null
  - **Status:** RED — same
  - **Verifies:** AC#2 — exclusive state: only placeholder shown

**AC#5 — Loading skeleton (1 test):**

- **Test:** should render skeleton placeholder while client data is loading
  - **Status:** RED — `ClienteDetailView` + `useCliente` not implemented; `cliente-detail-skeleton` testid missing
  - **Verifies:** AC#5 — `data-testid="cliente-detail-skeleton"` shown during loading

**AC#1 & AC#3 — Detail rendering (6 tests):**

- **Test:** should render Nombre when client data arrives
  - **Status:** RED — component + hook not implemented
  - **Verifies:** AC#1, AC#3 — Nombre field visible

- **Test:** should render NIT/RUC when client data arrives
  - **Status:** RED — same
  - **Verifies:** AC#1, AC#3 — NIT/RUC field visible

- **Test:** should render Teléfono when client data arrives
  - **Status:** RED — same
  - **Verifies:** AC#1, AC#3 — Teléfono field visible

- **Test:** should render Ciudad when client data arrives
  - **Status:** RED — same
  - **Verifies:** AC#1, AC#3 — Ciudad field visible

- **Test:** should render detail container with data-testid="cliente-detail-view"
  - **Status:** RED — `data-testid="cliente-detail-view"` attribute not added yet
  - **Verifies:** AC#1 — testid present for E2E and component test selectors

- **Test:** should render all 4 field labels in Spanish
  - **Status:** RED — component not implemented
  - **Verifies:** AC#1 — Spanish labels (Nombre, NIT/RUC, Teléfono, Ciudad)

**WCAG — Accessibility (2 tests):**

- **Test:** should render article with aria-label containing client name
  - **Status:** RED — `<article aria-label={...}>` not implemented
  - **Verifies:** AC#1 — WCAG 2.1 AA: `role="article"` with descriptive aria-label

- **Test:** should use dl/dt/dd semantics for field groups
  - **Status:** RED — description list structure not implemented
  - **Verifies:** AC#1 — semantic HTML: dl/dt/dd per story spec

**AC#4 — Not-found state (4 tests):**

- **Test:** should render "Cliente no encontrado." when API returns 404 (TC-E2-P2-03)
  - **Status:** RED — 404 rendering branch not implemented
  - **Verifies:** AC#4 — not-found message shown

- **Test:** should render not-found with role="status"
  - **Status:** RED — same
  - **Verifies:** AC#4 — accessible status announcement

- **Test:** should NOT render skeleton or detail view when showing not-found
  - **Status:** RED — same
  - **Verifies:** AC#4 — exclusive state: only not-found shown

- **Test:** should not crash or show blank screen on not-found
  - **Status:** RED — error boundary / data=null handling not implemented
  - **Verifies:** AC#4 — no crash, no blank screen

**AC#6 — Switching clients (2 tests):**

- **Test:** should update to new client data when clienteId prop changes
  - **Status:** RED — component + hook not implemented; prop change triggers re-fetch
  - **Verifies:** AC#6 — right panel updates to new client on prop change

- **Test:** should update NIT/RUC when switching from clienteA to clienteB
  - **Status:** RED — same
  - **Verifies:** AC#6 — all fields update, not just Nombre

---

### E2E Tests (7 tests)

**File:** `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

- **Test:** AC#2 — should show placeholder message in right panel when no client is selected
  - **Status:** RED — `ClienteDetailView` component + `/clientes` route update not implemented
  - **Verifies:** AC#2 — placeholder visible on `/clientes` base route (full stack)

- **Test:** AC#1 (TC-E2-P1-08) — should show client details in right panel when client item is clicked
  - **Status:** RED — `ClienteDetailView` + `/clientes/$clienteId` route not implemented
  - **Verifies:** AC#1 — all 4 fields visible after click; URL updates to `/clientes/:id`

- **Test:** AC#3 (TC-E2-P2-04) — should load client details on direct URL access without prior navigation
  - **Status:** RED — `/clientes/$clienteId` route + `useCliente` deep-link loading not implemented
  - **Verifies:** AC#3 — FR30 deep linking; correct data without list navigation

- **Test:** AC#3 — deep link should also render the client list panel (left panel visible)
  - **Status:** RED — master-detail layout on direct URL not implemented
  - **Verifies:** AC#3 — both panels visible on direct URL access

- **Test:** AC#4 — should display "Cliente no encontrado." for non-existent UUID without crashing
  - **Status:** RED — 404 graceful handling not implemented
  - **Verifies:** AC#4 — no crash, no JS error, not-found message shown

- **Test:** AC#4 — should NOT show cliente-detail-view for non-existent UUID
  - **Status:** RED — same
  - **Verifies:** AC#4 — detail view not shown on not-found

- **Test:** AC#1/AC#6 — should update right panel and URL when switching between clients
  - **Status:** RED — navigation + panel update not implemented
  - **Verifies:** AC#1 + AC#6 — switching clients updates both panel and URL

---

## API Tests (7 tests — already covered in Story 2.2 API spec)

**File:** `e2e/tests/api/clientes-getbyid-api.spec.ts` (ALREADY CREATED in prior ATDD work)

These tests cover the backend contract for `GET /api/v1/clientes/{id}` (TC-E2-P1-05):

- AC#3 — 200 OK with correct ClienteDto for existing ID
- AC#3 — all 7 required fields present per API contract
- AC#3 — exact field values matching seeded client
- AC#3 — no EF Core navigation property names in response
- AC#4 — 404 Not Found for non-existent UUID (TC-E2-P1-05)
- AC#4 — Problem Details (application/problem+json) for 404
- AC#4 — 404 body contains status 404 and descriptive title
- AC#4 — 404 must not expose stack trace (NFR6)

---

## Data Factories

### Cliente Factory (frontend)

**File:** `frontend/src/test/factories/cliente.factory.ts` (already exists from Story 2.1 ATDD)

**Exports used in Story 2.2 tests:**
- `createCliente(overrides?)` — Creates a single Cliente with optional overrides. Used in component tests to generate MSW response payloads for `CLIENT_A_ID` and `CLIENT_B_ID`.
- `resetClienteFactory()` — Called in `afterEach` to reset counter for deterministic tests.

### E2E Data Helper

**File:** `e2e/helpers/data.helper.ts` (already exists)
**Export:** `buildCliente(overrides?)` — generates unique client data for E2E setup.

---

## Fixtures

### Base E2E Fixture

**File:** `e2e/fixtures/base.fixture.ts` (already exists)

Used in E2E tests with `{ page, request }` via `test.extend<TestFixtures>`.

### Page Object Model

**File:** `e2e/pages/clientes.page.ts` (already exists from Story 2.1)

The `ClientesPage` POM already has:
- `detailPanel: page.getByTestId('cliente-detail-panel')` — note: story spec uses `cliente-detail-view`; E2E tests use `getByTestId('cliente-detail-view')` directly to match the story's `data-testid` spec.

---

## Mock Requirements

### GET /api/v1/clientes/:id — MSW Handlers (Component Tests)

**Endpoint:** `GET http://localhost:5000/api/v1/clientes/:id`

**Success Response (existing client):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nombre": "Empresa ABC",
  "nit": "900123456-7",
  "telefono": "601 234 5678",
  "ciudad": "Bogotá",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

**404 Not Found Response (non-existent client):**
```json
{
  "title": "Cliente no encontrado.",
  "status": 404
}
```
Status: 404

**Loading delay simulation:**
- `await new Promise(() => undefined)` — never-resolving promise keeps the loading state active during synchronous assertions for AC#5 skeleton tests.

**Notes:**
- MSW server is set up with `beforeAll`/`afterEach`/`afterAll` lifecycle in each test file.
- Network-first pattern: MSW handlers registered before component render in unit/component tests.
- E2E tests use real backend (live API against test database).

---

## Required data-testid Attributes

### ClienteDetailView / Right Panel

| Element | data-testid | Notes |
|---------|-------------|-------|
| Detail container (when client loaded) | `cliente-detail-view` | Wraps `<article>` with aria-label |
| Skeleton (during loading) | `cliente-detail-skeleton` | Rendered while `isLoading=true` |

### ARIA Attributes Required

| Element | ARIA | Notes |
|---------|------|-------|
| Placeholder container | `role="status"` | When `clienteId=null` |
| Not-found container | `role="status"` | When data=null after load |
| Detail article | `role="article"` + `aria-label="Detalle del cliente {nombre}"` | WCAG 2.1 AA |
| Field groups | `<dl>/<dt>/<dd>` semantics | Per story spec |

---

## Implementation Checklist

### Test: AC#2 — Placeholder state

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make these 3 tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- [ ] Add null check: when `clienteId === null`, render `<div role="status">Selecciona un cliente para ver sus detalles.</div>`
- [ ] Ensure `cliente-detail-view` testid is NOT rendered when `clienteId=null`
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`

---

### Test: AC#5 — Loading skeleton

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts` — TanStack Query hook with `queryKey: ['clientes', id]`, `enabled: !!id`, `staleTime: 1000 * 60`
- [ ] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` with `getById(id: string): Promise<Cliente | null>` (returns null on 404, re-throws on 5xx)
- [ ] In `ClienteDetailView`: when `isLoading`, render `<div data-testid="cliente-detail-skeleton"><Skeleton .../></div>`
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`

---

### Test: AC#1 & AC#3 — Detail rendering (all 4 fields)

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make these 6 tests pass:**
- [ ] In `ClienteDetailView`: when `data` is a `Cliente`, render `<article data-testid="cliente-detail-view" aria-label={...} role="article">` wrapping a `<dl>` with 4 `<dt>/<dd>` pairs
- [ ] dt texts: "Nombre", "NIT/RUC", "Teléfono", "Ciudad" (Spanish, exact)
- [ ] dd values: `data.nombre`, `data.nit`, `data.telefono`, `data.ciudad`
- [ ] Apply styles per story spec (text-xs, font-medium, text-slate-500, uppercase, tracking-wide for dt; text-base, text-slate-800 for dd)
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`

---

### Test: WCAG — article + aria-label + dl/dt/dd

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make these 2 tests pass:**
- [ ] Ensure `<article aria-label={`Detalle del cliente ${data.nombre}`}` wraps the detail content
- [ ] Ensure `<dl>` contains exactly 4 `<dt>` and 4 `<dd>` elements
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`

---

### Test: AC#4 — Not-found handling

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make these 4 tests pass:**
- [ ] In `clienteApiRepository.getById`: catch 404 → return `null`; do NOT set `isError`
- [ ] In `ClienteDetailView`: when `data === null && !isLoading`, render `<div role="status">Cliente no encontrado.</div>`
- [ ] Ensure `cliente-detail-skeleton` and `cliente-detail-view` are NOT rendered when data=null
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`

---

### Test: AC#6 — Switching clients

**File:** `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`

**Tasks to make these 2 tests pass:**
- [ ] `useCliente(id)` re-fetches when `id` prop changes (TanStack Query handles this by default)
- [ ] `ClienteDetailView` re-renders to new client data when `clienteId` prop changes
- [ ] Run: `pnpm --filter frontend test ClienteDetailView`

---

### Test: useCliente hook (all 8 tests)

**File:** `frontend/src/modules/crm/clientes/application/__tests__/useCliente.test.ts`

**Tasks to make these tests pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts` (see pattern in Dev Notes)
- [ ] Extend `clienteApiRepository` with `getById(id: string): Promise<Cliente | null>`
- [ ] Implement 404 → null mapping in `getById` (axios `error.response?.status === 404`)
- [ ] `enabled: !!id` guard ensures no fetch when id is null or empty string
- [ ] `queryKey: ['clientes', id]` matches architecture spec
- [ ] Run: `pnpm --filter frontend test useCliente`

---

### Test: E2E — AC#2 placeholder + AC#1 detail click

**File:** `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

**Tasks to make these E2E tests pass:**
- [ ] Update `frontend/src/routes/_app/clientes.tsx`: replace `onClienteSelect` stub with `navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })`; render `<ClienteDetailView clienteId={null} />` in right panel
- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`: dynamic route with `useParams`, renders `<ClienteListView>` + `<ClienteDetailView clienteId={clienteId} />`
- [ ] Wire `onClienteSelect` in `ClienteListView` to call `navigate({ to: '/clientes/$clienteId', params: { clienteId: selectedId } })`
- [ ] Run: `npx playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

---

### Test: E2E — AC#3 deep link (TC-E2-P2-04)

**File:** `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

**Tasks to make these 2 deep-link tests pass:**
- [ ] `clientes.$clienteId.tsx` route must load client data on mount via `useCliente(clienteId)` — no list pre-load required
- [ ] TanStack Router route segment `$clienteId` must be declared (file name: `clientes.$clienteId.tsx`)
- [ ] Backend: `GET /api/v1/clientes/{id:guid}` endpoint must exist (from Task 6 in story spec)
- [ ] Run: `npx playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

---

### Test: E2E — AC#4 not-found (no crash)

**File:** `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

**Tasks to make these 2 tests pass:**
- [ ] Backend `GET /api/v1/clientes/{id}` returns 404 + Problem Details for unknown UUID
- [ ] `ClienteDetailView` renders "Cliente no encontrado." when `data === null`
- [ ] No `console.error` with "Uncaught" / "TypeError" in page
- [ ] Run: `npx playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

---

### Test: E2E — AC#6 switch clients (URL update)

**File:** `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

**Tasks to make this test pass:**
- [ ] `onClienteSelect` on `ClienteListView` calls `navigate({ to: '/clientes/$clienteId', params: { clienteId: selectedId } })` for each click
- [ ] TanStack Router updates URL and re-renders `ClienteDetailView` with the new id
- [ ] Run: `npx playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

---

## Running Tests

```bash
# Run component tests for Story 2.2 (frontend)
pnpm --filter frontend test ClienteDetailView
pnpm --filter frontend test useCliente

# Run all frontend tests (will also catch regressions in Story 2.1)
pnpm --filter frontend test --run

# Run all E2E tests for Story 2.2
npx playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts

# Run API integration tests for Story 2.2
npx playwright test e2e/tests/api/clientes-getbyid-api.spec.ts

# Run Story 2.2 E2E tests in headed mode
npx playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**
- All tests written and failing
- Fixtures and factories available (reusing existing `cliente.factory.ts` and `data.helper.ts`)
- Mock requirements documented (MSW handlers in each test file)
- data-testid requirements listed
- Implementation checklist created

**Verification:**
- All component/hook tests fail with "Cannot find module" (modules not yet created)
- All E2E tests fail with "element not found" or "URL mismatch" (routes not implemented)
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with backend endpoint)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended Order:**
1. Backend: `GET /api/v1/clientes/{id:guid}` endpoint → `GetClienteByIdQuery` + handler → makes API tests pass
2. Frontend: `clienteApiRepository.getById` — extend existing repository
3. Frontend: `useCliente` hook with `enabled: !!id`, `queryKey: ['clientes', id]`
4. Frontend: `ClienteDetailView` — null state, skeleton state, not-found state, detail state
5. Frontend routes: Update `clientes.tsx` + Create `clientes.$clienteId.tsx`
6. Run all E2E tests to verify full-stack integration

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

- All tests passing (green phase complete)
- Review `ClienteDetailView` for readability
- Ensure `data-testid` attributes are consistent across the master-detail layout
- Verify `aria-label` contains client name in Spanish
- Ensure tests still pass after each refactor

---

## Coverage Summary

| AC | Description | Hook Tests | Component Tests | E2E Tests | API Tests |
|----|-------------|-----------|----------------|-----------|-----------|
| AC#1 | Click shows full details; URL updates | — | 8 | 2 | — |
| AC#2 | Placeholder when no client selected | 2 | 3 | 1 | — |
| AC#3 | Deep link direct URL access (FR30) | 3 | 6 | 2 | 4 |
| AC#4 | Not-found graceful handling | 2 | 4 | 2 | 4 |
| AC#5 | Loading skeleton | 1 | 1 | — | — |
| AC#6 | Switching clients updates panel + URL | — | 2 | 1 | — |

**Total new tests generated for Story 2.2:**
- Hook tests: 8
- Component tests: 18
- E2E tests: 7
- API tests: 7 (already existed in `clientes-getbyid-api.spec.ts`, included for completeness)

**New tests created by this ATDD run: 33**

---

## Test Execution Evidence

### Expected RED Phase Failures

**Component/Hook tests (`pnpm --filter frontend test --run`):**
```
FAIL  src/modules/crm/clientes/application/__tests__/useCliente.test.ts
  Cannot find module '../useCliente'

FAIL  src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx
  Cannot find module '../ClienteDetailView'
```

**E2E tests (`npx playwright test e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`):**
```
FAIL  story-2-2-client-detail-view.spec.ts
  [AC#2] Expected: "Selecciona un cliente para ver sus detalles." — element not found
  [AC#1] Expected: testId 'cliente-detail-view' — not in DOM
  [AC#3] Expected: testId 'cliente-detail-view' — not in DOM (route not implemented)
  [AC#4] Expected: "Cliente no encontrado." — element not found (404 handling not done)
```

**Status:** RED phase — all Story 2.2-specific tests fail due to missing implementation.

---

## Notes

- The `cliente.factory.ts` and `data.helper.ts` already exist from Story 2.1 ATDD work. No new factory files needed.
- The `clientes-getbyid-api.spec.ts` API test file was already created as part of prior Story 2.2 ATDD preparation and is included in this checklist for completeness.
- `resetClienteFactory()` is called in `afterEach` to ensure deterministic counter reset between tests.
- All UI text is in Spanish per company standards (placeholder text, not-found message, field labels).
- `enabled: !!id` in `useCliente` is critical — prevents spurious API calls when `clienteId=null`.
- The `data-testid="cliente-detail-view"` attribute must be on the `<article>` element, not a wrapping div.
- Backend dependency: `GET /api/v1/clientes/{id:guid}` must return `null` → 404 Problem Details; `useCliente` maps 404 to `data: null`.

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-14
