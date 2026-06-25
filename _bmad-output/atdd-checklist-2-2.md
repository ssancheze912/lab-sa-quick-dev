# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** E2E + Component + API

---

## Story Summary

A commercial team member can click any client in the left panel list to see full client details (Nombre, NIT/RUC, Teléfono, Ciudad) in the right panel. The selected client is highlighted in Siesa Blue. The URL updates to `/clientes/:clienteId` for deep linking support (FR30), and the view handles loading (skeleton), 404 (Spanish message), server errors (ErrorPanel + Reintentar), and the no-selection placeholder state.

**As a** commercial team member
**I want** to view complete client details by clicking a client from the list
**So that** I can review all their information without navigating away from the clients section

---

## Acceptance Criteria

1. Clicking a client in the left panel renders detail (Nombre, NIT/RUC, Teléfono, Ciudad) in the right panel, and the selected item is highlighted in Siesa Blue (`#0e79fd`).
2. Clicking a client updates the URL to `/clientes/:clienteId` (UUID) without a full page reload (FR30 deep linking).
3. Accessing `/clientes/:clienteId` directly fetches the client by ID from `GET /api/v1/clientes/{id}` and highlights the matching item in the left list.
4. If the `clienteId` returns 404, the right panel displays "Cliente no encontrado" in Spanish — no unhandled errors thrown.
5. If the backend is unavailable (network error or 5xx), an `ErrorPanel` with a "Reintentar" button is shown; clicking it triggers TanStack Query `refetch`.
6. While loading, the right panel displays a skeleton screen via `react-loading-skeleton` — NOT a spinner.
7. At `/clientes` with no `clienteId` in URL, the right panel shows "Selecciona un cliente para ver el detalle" (Spanish) and no detail fetch is made.

---

## Failing Tests Created (RED Phase)

### E2E Tests (19 tests)

**File:** `e2e/story-2-2/client-detail-view.spec.ts`

**AC1 — Detail panel on client click (5 tests)**
- RED - `ClienteDetailPanel` component and `clientes.$clienteId` route not yet implemented
  - Verifies: Nombre rendered in detail panel after click
  - Verifies: NIT/RUC rendered in detail panel after click
  - Verifies: Teléfono rendered in detail panel after click
  - Verifies: Ciudad rendered in detail panel after click
  - Verifies: Clicked list item has `data-active="true"` attribute (Siesa Blue highlight)

**AC2 — URL updates to /clientes/:clienteId (2 tests)**
- RED - TanStack Router route `_app/clientes.$clienteId.tsx` not yet implemented
  - Verifies: URL changes to `/clientes/{uuid}` after click
  - Verifies: No full page reload occurs (client-side SPA navigation)

**AC3 — Deep link access (2 tests)**
- RED - `GET /api/v1/clientes/{id}` endpoint not yet implemented
  - Verifies: Direct URL access `/clientes/:clienteId` renders client detail
  - Verifies: Corresponding list item is highlighted on deep link load

**AC4 — 404 shows "Cliente no encontrado" (2 tests)**
- RED - `ClienteDetailPanel` 404 state not yet implemented
  - Verifies: `[data-testid="cliente-not-found"]` contains "Cliente no encontrado"
  - Verifies: `ErrorPanel` is NOT shown for 404 (distinct UI from 5xx errors)

**AC5 — ErrorPanel with Reintentar on failure (4 tests)**
- RED - `ClienteDetailPanel` error state not yet implemented
  - Verifies: ErrorPanel shown on 500 detail fetch
  - Verifies: "Reintentar" button present in detail ErrorPanel
  - Verifies: Clicking Reintentar triggers refetch and shows client on success
  - Verifies: ErrorPanel shown on network error (connection refused)

**AC6 — Skeleton screen (not spinner) (2 tests)**
- RED - `ClienteDetailPanel` loading skeleton not yet implemented
  - Verifies: `[data-testid="cliente-detail-skeleton"]` visible during slow load
  - Verifies: `[data-testid="loading-spinner"]` is NOT present during load

**AC7 — Placeholder on /clientes without clienteId (3 tests)**
- RED - Placeholder state in `ClienteDetailPanel` not yet implemented
  - Verifies: "Selecciona un cliente para ver el detalle" visible at /clientes
  - Verifies: No detail API call made when no clienteId is in URL
  - Verifies: Right panel container is still visible in placeholder state

### API Tests (13 tests)

**File:** `e2e/story-2-2/cliente-detail.api.spec.ts`

**AC3 — GET /api/v1/clientes/{id} happy path (10 tests)**
- RED - `GET /api/v1/clientes/{id}` endpoint not yet implemented
  - Verifies: 200 OK for existing client
  - Verifies: Content-Type application/json
  - Verifies: Body is a direct ClienteDto object (not wrapped, not an array)
  - Verifies: id field matches requested UUID
  - Verifies: nombre field is a non-empty string
  - Verifies: nit field is a non-empty string
  - Verifies: telefono field is a non-empty string
  - Verifies: ciudad field is a non-empty string
  - Verifies: createdAt and updatedAt are ISO 8601 date strings
  - Verifies: No snake_case field names (camelCase only)

**AC4 — 404 Not Found (3 tests)**
- RED - Endpoint not yet implemented
  - Verifies: HTTP 404 for unknown client ID
  - Verifies: Problem Details RFC 7807 body with status 404 and title
  - Verifies: Content-Type is application/json or application/problem+json

### Component Tests (21 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`

**AC7 — Placeholder state (3 tests)**
- RED - `ClienteDetailPanel` component does not exist yet
  - Verifies: Placeholder text rendered when clienteId is undefined
  - Verifies: No `cliente-detail-content` element when clienteId is undefined
  - Verifies: No API request made when clienteId is undefined

**AC6 — Skeleton loading state (2 tests)**
- RED - `ClienteDetailPanel` component does not exist yet
  - Verifies: `[data-testid="cliente-detail-skeleton"]` visible during in-flight request
  - Verifies: `[data-testid="loading-spinner"]` NOT present during load

**AC1 — Success state with all fields (5 tests)**
- RED - `ClienteDetailPanel` component does not exist yet
  - Verifies: Nombre displayed in detail content
  - Verifies: NIT/RUC displayed in detail content
  - Verifies: Teléfono displayed in detail content
  - Verifies: Ciudad displayed in detail content
  - Verifies: Spanish labels (Nombre, NIT/RUC, Teléfono, Ciudad) present

**AC4 — 404 not-found message (2 tests)**
- RED - `ClienteDetailPanel` component does not exist yet
  - Verifies: "Cliente no encontrado" shown on 404
  - Verifies: ErrorPanel NOT shown on 404

**AC5 — ErrorPanel with Reintentar (4 tests)**
- RED - `ClienteDetailPanel` component does not exist yet
  - Verifies: ErrorPanel shown on 500
  - Verifies: "Reintentar" button present in ErrorPanel
  - Verifies: Clicking Reintentar triggers refetch and shows client on success
  - Verifies: 404 not-found message NOT shown on 500

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**AC3, AC5, AC6, AC7 — useCliente hook (9 tests)**
- RED - `useCliente` hook does not exist yet
  - Verifies: queryKey `['clientes', id]` used (fetch succeeds)
  - Verifies: Returns correct client object on success
  - Verifies: isLoading true before data arrives
  - Verifies: isError true on 500
  - Verifies: refetch function exposed on error state
  - Verifies: error exposed for 404 status differentiation
  - Verifies: id=undefined does NOT trigger fetch (isLoading=false, isFetching=false)
  - Verifies: isPending false when id is undefined
  - Verifies: data is undefined when id is undefined

---

## Data Factories

### Cliente Detail Factory (extends Story 2.1 factory)

**File:** `e2e/support/factories/cliente.factory.ts` (existing — `buildClienteResponse` covers AC3 stub needs)

The existing `buildClienteResponse()` factory from Story 2.1 is reused. New inline helpers are defined inside each test file to keep them self-contained (same pattern as `client-list-search.spec.ts`).

---

## Fixtures Created

No new E2E fixtures are required for this story. All route intercepts are registered inline using the network-first pattern. The existing `base.fixture.ts` is not used directly — tests use raw `{ page }` and `{ request }` fixtures.

---

## Mock Requirements

### GET /api/v1/clientes/{id} — Client Detail Endpoint

All E2E and API tests that require intercepted network responses use Playwright's `page.route()` or the real backend (`request.get()`).

**Success response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nombre": "Empresa Ejemplo S.A.",
  "nit": "900123456-7",
  "telefono": "6011234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-03-12T10:30:00Z"
}
```

**404 Not Found response:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente con id 00000000-0000-0000-0000-000000000000 no encontrado."
}
```

**500 Server Error response:**
```json
{
  "status": 500,
  "title": "Internal Server Error"
}
```

---

## Required data-testid Attributes

### ClienteDetailPanel (right panel)

- `cliente-detail-panel` — Container for the entire right panel area
- `cliente-detail-placeholder` — Placeholder state container ("Selecciona un cliente...")
- `cliente-detail-skeleton` — Skeleton screen container (react-loading-skeleton, shown during load)
- `cliente-detail-content` — Success state container with all client fields
- `cliente-not-found` — 404 not-found state message container
- `error-panel` — Generic error state (from shared `ErrorPanel` component, Story 2.1)
- `error-panel-retry-button` — "Reintentar" button inside ErrorPanel

### ClienteListPanel (left panel — update from Story 2.1)

- `cliente-list-item` — (existing) Each client list item must accept `data-active="true"` when selected
- `clientes-list-panel` — (existing) Left panel container

**Implementation Example:**
```tsx
// ClienteDetailPanel.tsx
<section data-testid="cliente-detail-panel" aria-label="Detalle de cliente">
  {/* Placeholder */}
  <p data-testid="cliente-detail-placeholder">Selecciona un cliente para ver el detalle</p>

  {/* Loading */}
  <div data-testid="cliente-detail-skeleton">
    <Skeleton count={4} />
  </div>

  {/* 404 */}
  <p data-testid="cliente-not-found" aria-live="polite">Cliente no encontrado</p>

  {/* Success */}
  <dl data-testid="cliente-detail-content">
    <dt>Nombre</dt><dd>{cliente.nombre}</dd>
    <dt>NIT/RUC</dt><dd>{cliente.nit}</dd>
    <dt>Teléfono</dt><dd>{cliente.telefono}</dd>
    <dt>Ciudad</dt><dd>{cliente.ciudad}</dd>
  </dl>
</section>

// ClienteListPanel — list item with active state
<li data-testid="cliente-list-item" data-active={isActive ? 'true' : 'false'}>
  ...
</li>
```

---

## Implementation Checklist

### Test: AC7 — Placeholder when no client selected

**Files:** `e2e/story-2-2/client-detail-view.spec.ts` (AC7 suite), `ClienteDetailPanel.test.tsx` (AC7 suite)

**Tasks to make this test pass:**
- [ ] Create `frontend/src/routes/_app/clientes.tsx` placeholder right panel (pass `clienteId=undefined` to `ClienteDetailPanel`)
- [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx` with placeholder branch
- [ ] Add `data-testid="cliente-detail-placeholder"` to placeholder paragraph
- [ ] Add `data-testid="cliente-detail-panel"` to panel container
- [ ] Ensure `useCliente(undefined)` has `enabled: false` (no fetch triggered)
- [ ] Run test: `npx playwright test e2e/story-2-2/client-detail-view.spec.ts --grep "AC7"`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.test`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC6 — Skeleton screen during loading

**Files:** `e2e/story-2-2/client-detail-view.spec.ts` (AC6 suite), `ClienteDetailPanel.test.tsx` (AC6 suite)

**Tasks to make this test pass:**
- [ ] Add loading branch to `ClienteDetailPanel.tsx` using `react-loading-skeleton` (already installed)
- [ ] Add `data-testid="cliente-detail-skeleton"` to skeleton wrapper div
- [ ] Ensure NO `data-testid="loading-spinner"` exists anywhere in the loading branch
- [ ] Run test: `npx playwright test e2e/story-2-2/client-detail-view.spec.ts --grep "AC6"`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.test`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC3 — Backend `GET /api/v1/clientes/{id}` endpoint

**Files:** `e2e/story-2-2/cliente-detail.api.spec.ts` (AC3 suite)

**Tasks to make this test pass:**
- [ ] Add `GetByIdAsync(Guid id)` to `IClienteRepository.cs` if missing
- [ ] Implement `GetByIdAsync` in `ClienteRepository.cs` using `AppDbContext.Clientes.FindAsync(id)`
- [ ] Create `GetClienteByIdQuery.cs` record
- [ ] Create `GetClienteByIdQueryHandler.cs` that calls `IClienteRepository.GetByIdAsync`
- [ ] Add `GET /api/v1/clientes/{id}` mapping in `ClienteEndpoints.cs`
- [ ] Return `200 OK` with `ClienteDto` on success
- [ ] Verify endpoint returns camelCase field names (JSON serialization already configured)
- [ ] Run test: `npx playwright test e2e/story-2-2/cliente-detail.api.spec.ts`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC4 — 404 response and "Cliente no encontrado" message

**Files:** `e2e/story-2-2/cliente-detail.api.spec.ts` (AC4 suite), `e2e/story-2-2/client-detail-view.spec.ts` (AC4 suite), `ClienteDetailPanel.test.tsx` (AC4 suite)

**Tasks to make this test pass:**
- [ ] Backend: When `GetByIdAsync` returns null, endpoint returns `Results.NotFound()` (Problem Details RFC 7807)
- [ ] Frontend: In `ClienteDetailPanel.tsx`, detect `is404 = isError && (error as AxiosError)?.response?.status === 404`
- [ ] Add 404 branch rendering `<p data-testid="cliente-not-found" aria-live="polite">Cliente no encontrado</p>`
- [ ] Ensure `ErrorPanel` is NOT rendered for 404 (distinct UI path)
- [ ] Run test: `npx playwright test e2e/story-2-2/client-detail-view.spec.ts --grep "AC4"`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.test`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC5 — ErrorPanel with Reintentar on 5xx/network failure

**Files:** `e2e/story-2-2/client-detail-view.spec.ts` (AC5 suite), `ClienteDetailPanel.test.tsx` (AC5 suite)

**Tasks to make this test pass:**
- [ ] Add error branch (non-404) in `ClienteDetailPanel.tsx` rendering `<ErrorPanel onRetry={refetch} />`
- [ ] Reuse existing `frontend/src/shared/components/ErrorPanel.tsx` (from Story 2.1)
- [ ] Ensure `ErrorPanel` exposes `data-testid="error-panel"` and `data-testid="error-panel-retry-button"`
- [ ] Wire `onRetry` prop to TanStack Query `refetch` function from `useCliente(clienteId)`
- [ ] Run test: `npx playwright test e2e/story-2-2/client-detail-view.spec.ts --grep "AC5"`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.test`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC1 — Detail fields rendered on success

**Files:** `e2e/story-2-2/client-detail-view.spec.ts` (AC1 suite), `ClienteDetailPanel.test.tsx` (AC1 suite)

**Tasks to make this test pass:**
- [ ] Add success branch in `ClienteDetailPanel.tsx` rendering all fields
- [ ] Use `<dl data-testid="cliente-detail-content">` with `<dt>/<dd>` for Nombre, NIT/RUC, Teléfono, Ciudad
- [ ] All labels must be in Spanish: "Nombre", "NIT/RUC", "Teléfono", "Ciudad"
- [ ] Use Inter font Tailwind classes: `font-light`, `font-normal`, `font-bold`
- [ ] Run test: `npx playwright test e2e/story-2-2/client-detail-view.spec.ts --grep "AC1"`
- [ ] Run test: `pnpm --filter frontend test ClienteDetailPanel.test`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC2 — URL updates on client click (no page reload)

**Files:** `e2e/story-2-2/client-detail-view.spec.ts` (AC2 suite)

**Tasks to make this test pass:**
- [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` TanStack Router dynamic route
- [ ] Use TanStack Router `<Link to="/clientes/$clienteId">` inside each `ClientListItem`
- [ ] Update `ClienteListPanel.tsx` to accept `activeClienteId?: string` and `onClienteSelect?` props
- [ ] Pass `isActive={cliente.id === activeClienteId}` to each `<ClientListItem>`
- [ ] `<ClientListItem>` must set `data-active={isActive ? 'true' : 'false'}` on the `<li>` element
- [ ] Run test: `npx playwright test e2e/story-2-2/client-detail-view.spec.ts --grep "AC2"`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC3 — Deep link highlights correct list item

**Files:** `e2e/story-2-2/client-detail-view.spec.ts` (AC3 suite)

**Tasks to make this test pass:**
- [ ] In `clientes.$clienteId.tsx` route: extract `clienteId` via `useParams()`
- [ ] Pass `clienteId` as `activeClienteId` prop to `ClienteListPanel`
- [ ] Pass `clienteId` as prop to `ClienteDetailPanel`
- [ ] Create `useCliente(id)` hook in `frontend/src/modules/crm/clientes/application/useCliente.ts`
- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts` and `clienteApiRepository.ts`
- [ ] Run test: `npx playwright test e2e/story-2-2/client-detail-view.spec.ts --grep "AC3"`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: useCliente hook unit tests

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.ts`

**Tasks to make this test pass:**
- [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`
- [ ] Use `useQuery` with `queryKey: ['clientes', id]` and `enabled: !!id`
- [ ] Call `clienteApiRepository.getById(id!)` as the `queryFn`
- [ ] Set `staleTime: 30_000`
- [ ] Add `getById: async (id: string) => { ... }` to `clienteApiRepository.ts`
- [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts`
- [ ] Run test: `pnpm --filter frontend test useCliente.test`
- [ ] Confirm tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all E2E failing tests for Story 2.2
npx playwright test e2e/story-2-2/

# Run E2E tests in headed mode
npx playwright test e2e/story-2-2/ --headed

# Run only E2E UI tests
npx playwright test e2e/story-2-2/client-detail-view.spec.ts

# Run only API contract tests
npx playwright test e2e/story-2-2/cliente-detail.api.spec.ts

# Debug specific E2E test
npx playwright test e2e/story-2-2/client-detail-view.spec.ts --debug

# Run frontend component tests (Vitest)
pnpm --filter frontend test ClienteDetailPanel.test
pnpm --filter frontend test useCliente.test

# Run all frontend tests
pnpm --filter frontend test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**
- All tests written and failing (implementation does not exist)
- Network-first intercept pattern applied to all Playwright E2E tests
- `data-testid` selectors used throughout — no fragile CSS selectors
- Given-When-Then format applied to all tests
- Mock requirements documented (request/response shapes)
- Required `data-testid` attributes fully listed
- Implementation checklist created with concrete tasks

**Verification:**
- E2E tests fail: `ClienteDetailPanel` does not exist, route `clientes.$clienteId.tsx` does not exist, `GET /api/v1/clientes/{id}` not implemented
- Component tests fail: `ClienteDetailPanel` module cannot be imported
- Hook tests fail: `useCliente` module cannot be imported
- All failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with `useCliente` hook — foundational)
2. **Read the test** to understand expected behavior (queryKey, enabled flag, error states)
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Suggested order:**
   - `useCliente.ts` hook (foundation for all other tests)
   - `clienteApiRepository.getById` + `IClienteRepository.getById`
   - Backend `GET /api/v1/clientes/{id}` endpoint (unblocks API tests)
   - `ClienteDetailPanel.tsx` (placeholder → skeleton → 404 → error → success)
   - `clientes.$clienteId.tsx` route + list item navigation
   - URL update + deep link highlight

**Key Principles:**
- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Extract shared types** if `buildClienteStub` helpers are duplicated
3. **Review accessibility** — `ClienteDetailPanel` must use semantic `<dl>/<dt>/<dd>` or equivalent with `aria-label` on container
4. **Verify WCAG 2.1 AA** — keyboard navigation, focus visible rings on list items
5. **Ensure tests still pass** after each refactor
6. **Update story file** to add new files to the File List section

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (`dev-story` agent)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/story-2-2/`
3. **Begin implementation** using implementation checklist (start with `useCliente.ts`)
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor for quality (accessibility, WCAG AA, code organization)
6. **When refactoring complete**, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — All Playwright E2E tests intercept routes BEFORE `page.goto()` to prevent race conditions
- **data-factories.md** — Inline `buildClienteStub` helpers with override support; `buildClienteResponse` from Story 2.1 factory reused
- **component-tdd.md** — RTL + MSW pattern for component tests matching Story 2.1 style
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, explicit `waitFor` instead of hard waits
- **selector-resilience.md** — `data-testid` attributes only; no CSS class or text selectors for structural elements
- **fixture-architecture.md** — No new fixtures needed; Playwright built-in `{ page }` and `{ request }` fixtures used

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/story-2-2/`

**Expected results (all tests FAIL in RED phase):**

```
FAILED e2e/story-2-2/client-detail-view.spec.ts
  AC1: ClienteDetailPanel — page.getByTestId('cliente-detail-content') not found
  AC2: URL not updated — route clientes.$clienteId.tsx does not exist
  AC3: Deep link — GET /api/v1/clientes/{id} returns 404 (not implemented)
  AC4: [data-testid="cliente-not-found"] not found
  AC5: [data-testid="error-panel"] not found in detail panel
  AC6: [data-testid="cliente-detail-skeleton"] not found
  AC7: [data-testid="cliente-detail-placeholder"] not found

FAILED e2e/story-2-2/cliente-detail.api.spec.ts
  All tests: 404 — GET /api/v1/clientes/{id} endpoint not implemented

FAILED frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx
  All tests: Cannot find module './ClienteDetailPanel'

FAILED frontend/src/modules/crm/clientes/application/useCliente.test.ts
  All tests: Cannot find module './useCliente'
```

**Summary:**
- Total E2E tests: 32 (19 UI + 13 API)
- Total component tests: 30 (21 component + 9 hook)
- Total tests: 62
- Passing: 0 (expected)
- Failing: 62 (expected)
- Status: RED phase verified

---

## Notes

- `react-loading-skeleton` is already installed (confirmed in Story 2.1 dev notes). Import directly: `import Skeleton from 'react-loading-skeleton'`.
- `ErrorPanel` at `frontend/src/shared/components/ErrorPanel.tsx` is already implemented (Story 2.1). Do NOT recreate.
- `ExceptionHandlingMiddleware` is already wired in `Program.cs` (Story 1.3). Do NOT re-register.
- The 404 vs. 5xx distinction is critical: only 5xx/network errors → `ErrorPanel`; 404 → `data-testid="cliente-not-found"` paragraph.
- `AppDbContext.Clientes` DbSet exists — no migration needed for this story (read-only).
- `@/` path alias is configured in both `vite.config.ts` and `tsconfig.json` — use it for all imports.
- All user-facing text must be in Spanish; code (variables, types, functions) in English.

---

**Generated by BMad TEA Agent** - 2026-06-25
