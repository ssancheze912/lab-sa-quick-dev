# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-07-02
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** E2E (Playwright) with API contract complement

---

## Story Summary

As a commercial team member, I want to view the complete details of a client by
selecting them from the list, so that I can review all their information without
navigating away from the clients section.

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away

---

## Acceptance Criteria

1. **AC1** — Click (or `Enter`/`Space`) on a `ClientListItem` navigates to
   `/clientes/:clienteId` (SPA — no full page reload) and the right panel
   (`data-testid="cliente-detail-panel"`, `role="region"`) renders `ClienteDetailView`
   with Nombre (heading), NIT/RUC, Teléfono, Ciudad. The selected item is visually
   marked (`aria-pressed="true"`).
2. **AC2** — Switching from cliente X to cliente Y updates the URL and re-renders
   the detail without unmounting the list; the list `['clientes']` query is not
   re-fetched (`['clientes', id]` fetched only when not cached / stale).
3. **AC3** — Deep-linking to `/clientes/:id` directly loads the detail; the list
   is still mounted and the corresponding item is marked as selected.
4. **AC4** — During `isLoading`, a skeleton (`data-testid="cliente-detail-skeleton"`,
   `aria-busy="true"`) with at least 4 lines is rendered.
5. **AC5** — On 404 from GET `/api/v1/clientes/:id`, `NotFoundClientePanel`
   (`data-testid="cliente-not-found"`, `role="alert"`) with title
   "Cliente no encontrado", subtitle "El cliente que buscas no existe o fue
   eliminado." and CTA "Volver a Clientes" is rendered. No stack traces exposed
   to the UI (NFR6). The detail panel is not rendered simultaneously.
6. **AC6** — On 5xx / network error, `ErrorPanel`
   (`data-testid="cliente-detail-error-panel"`, `role="alert"`) with "Reintentar"
   button is rendered; clicking it triggers refetch.
7. **AC7** — On `/clientes` (index without `:clienteId`), the right panel shows
   the placeholder "Selecciona un cliente para ver el detalle"
   (`data-testid="cliente-detail-empty"`). Mobile master-detail behaviour hides
   the list once a cliente is active.
8. **AC8** — Backend exposes GET `/api/v1/clientes/{id:guid}` returning:
     - 200 OK + `ClienteDto` (camelCase, ISO 8601, Guid string) on existing id
     - 404 Not Found + Problem Details RFC 7807 on unknown id
     - 400 Bad Request + Problem Details on non-GUID segment (route constraint)
9. **AC9** — Build/lint/tests pass in both workspaces with no regressions.

---

## Failing Tests Created (RED Phase)

### E2E Tests (14 tests)

**File:** `e2e/tests/clientes/story-2.2-client-detail-view.spec.ts`

- **[TC-Story-2.2-Select]** RED — no `cliente-detail-panel` in `/clientes` yet. Verifies AC1 navigation + 4 fields rendered.
- **[TC-Story-2.2-Selected-Style]** RED — no `aria-pressed` state derived from route yet. Verifies AC1 selected item styling.
- **[TC-Story-2.2-Select-NoReload]** RED — click currently `console.info`s, no navigation. Verifies AC1 SPA behaviour (FR28).
- **[TC-Story-2.2-Switch]** RED — no detail panel to switch between yet. Verifies AC2 URL + panel swap.
- **[TC-Story-2.2-Switch-NoRefetchList]** RED — list is not currently cached across route changes. Verifies AC2 no `['clientes']` refetch.
- **[TC-Story-2.2-DeepLink]** RED — no `/clientes/$clienteId` route yet. Verifies AC3 deep-link.
- **[TC-Story-2.2-DeepLink-Selected]** RED — no `useMatchRoute`-driven `isSelected` in the list. Verifies AC3 selected-in-list on deep link.
- **[TC-Story-2.2-Skeleton]** RED — no `cliente-detail-skeleton` testid yet. Verifies AC4 skeleton + aria-busy.
- **[TC-Story-2.2-NotFound]** RED — no `NotFoundClientePanel` component yet. Verifies AC5 title/subtitle/CTA.
- **[TC-Story-2.2-NotFound-NoDetail]** RED — no 404 branch yet. Verifies AC5 mutual exclusion of states.
- **[TC-Story-2.2-NotFound-BackButton]** RED — CTA does not exist yet. Verifies AC5 navigate back.
- **[TC-Story-2.2-NotFound-NoStackTrace]** RED — no defensive rendering yet. Verifies AC5/NFR6 no stack-trace leak.
- **[TC-Story-2.2-Error]** RED — no `cliente-detail-error-panel` yet. Verifies AC6 5xx branch.
- **[TC-Story-2.2-Error-Retry]** RED — no refetch wiring. Verifies AC6 Reintentar refetch.
- **[TC-Story-2.2-Empty-Placeholder]** RED — `/clientes` still renders old inline placeholder without the new testid. Verifies AC7 placeholder.

> Note: the counts above include 15 test items. The suite groups them under 7
> `describe` blocks aligned to AC1–AC7.

### API Tests (4 tests)

**File:** `e2e/tests/api/story-2.2-cliente-detail.api.spec.ts`

- **[TC-Story-2.2-API-200]** RED — endpoint `GET /api/v1/clientes/{id:guid}` not yet registered. Verifies AC8 200 + DTO shape.
- **[TC-Story-2.2-API-404]** RED — endpoint missing → 404 comes from framework fallback, not Problem Details. Verifies AC8 404 + RFC 7807.
- **[TC-Story-2.2-API-400]** RED — no route constraint handling yet. Verifies AC8 400 for non-GUID + no stack trace.
- **[TC-Story-2.2-API-NoStackTrace]** RED — Problem Details middleware needs the endpoint to exist. Verifies AC5/NFR6 no stack-trace signals.

### Component Tests (deferred to DEV)

Per Tasks 7–10 & 13 of the story, comprehensive Vitest + RTL component tests
live in the DEV agent's scope:

- `frontend/src/modules/crm/clientes/application/useCliente.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (+2 new tests)
- `frontend/src/routes/clientes.detail.integration.test.tsx`

These will be authored during implementation (green phase) — the ATDD E2E/API
tests define the acceptance contract they must respect.

---

## Data Factories Created

### Inline `seedClientes` factory

**File:** `e2e/tests/clientes/story-2.2-client-detail-view.spec.ts`

Fixed `ClienteDto[]` seed with three deterministic entries (Acme Corp / Beta
Distribuciones / Gamma Industrial) matching the Story 2.1 seed — used for
consistency across specs and to allow expected-value assertions on each field.

**API seed helper:** `seedCliente(request)` in the API spec creates one cliente
via `POST /api/v1/clientes` and returns its id. The test uses a `try/finally`
cleanup via `DELETE /api/v1/clientes/:id`. Guarded with `test.skip(...)` if the
POST endpoint is unavailable (backend for Story 2.3 not yet implemented).

---

## Fixtures Created

No new Playwright fixtures required. All network calls are intercepted
network-first with `page.route()` before `page.goto(...)` — pattern inherited
from Story 2.1.

---

## Mock Requirements

All required mocks are inline in the E2E spec via `page.route(...)`. No external
mock service required.

### GET /api/v1/clientes/:id — five variants used by tests

- **Success (matching seed):** 200 + `ClienteDto` for the matching id, else 404.
- **Always 404:** 404 + Problem Details RFC 7807.
- **Error:** 500 + `application/problem+json`.
- **Delayed success:** 200 + DTO after 1500ms (for skeleton).
- **First-fail-then-success:** first GET → 500, subsequent → 200 (for Reintentar).

Combined with GET /api/v1/clientes (list) intercepts from Story 2.1's inline
patterns, this keeps every test hermetic.

---

## Required data-testid Attributes

### `/clientes/:clienteId` route + `ClienteDetailView`

- `cliente-detail-panel` — root `<section>` of the right-hand detail panel (`role="region"`, `aria-labelledby="cliente-detail-title"`).
- `cliente-detail-skeleton` — loading skeleton container (`aria-busy="true"`).
- `cliente-detail-error-panel` — ErrorPanel root when the fetch fails with 5xx (`role="alert"`).
- `cliente-detail-nit` — `<dd>` for NIT/RUC value.
- `cliente-detail-telefono` — `<dd>` for Teléfono value.
- `cliente-detail-ciudad` — `<dd>` for Ciudad value.

### `NotFoundClientePanel`

- `cliente-not-found` — root of the local 404 panel (`role="alert"`, `aria-live="polite"`).

### `/clientes` index (placeholder)

- `cliente-detail-empty` — placeholder rendered when no `:clienteId` is active.

### `ClienteListView` selection state (already partially present from Story 2.1)

- `cliente-list-item` — each list item; must now expose `aria-pressed="true"` when its id matches the active route param.

---

## Implementation Checklist

### Test: [TC-Story-2.2-Select] Click a list item navigates to /clientes/:id and renders detail

**Files to change:**

- `frontend/src/routes/clientes.tsx` — convert to layout route with `<Outlet />`.
- `frontend/src/routes/clientes.$clienteId.tsx` — create dynamic route.
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — create component.
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — wire `useNavigate` + `useMatchRoute`.
- `frontend/src/modules/crm/clientes/application/useCliente.ts` — TanStack Query hook.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — `getById`.

**Tasks:**

- [ ] Create `ClienteDetailView` rendering Nombre (h2), NIT/RUC (dd), Teléfono (dd), Ciudad (dd)
- [ ] Add `data-testid="cliente-detail-panel"` + `role="region"` + `aria-labelledby`
- [ ] Add `data-testid`s for each field value
- [ ] Wire click on `ClientListItem` to `navigate({ to: '/clientes/$clienteId', params })`
- [ ] Run test: `pnpm test:e2e -- story-2.2-client-detail-view.spec.ts -g "TC-Story-2.2-Select"`
- [ ] ✅ Test passes (green phase)

### Test: [TC-Story-2.2-Selected-Style] Selected item has aria-pressed="true"

- [ ] Compute `isSelected = activeClienteId === cliente.id` in `ClienteListView`
- [ ] Pass `isSelected` prop to `ClientListItem` (Story 2.1 already renders `aria-pressed`)
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-Select-NoReload] SPA navigation

- [ ] Ensure `navigate({ to: '/clientes/$clienteId' })` uses TanStack Router (no `window.location`)
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-Switch] Switching X → Y updates URL + panel

- [ ] Route change unmounts previous `ClienteDetailView` render and re-mounts with new params
- [ ] `<Outlet />` keeps the list mounted while swapping detail
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-Switch-NoRefetchList] No `['clientes']` refetch on switch

- [ ] Confirm layout route keeps `useClientes` mounted (list query cached, `staleTime: 30_000`)
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-DeepLink] Deep link loads detail

- [ ] `useCliente(clienteId)` triggers `GET /api/v1/clientes/:id`
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-DeepLink-Selected] Deep-linked item is selected in list

- [ ] `useMatchRoute` returns the active `clienteId`; list item marks itself as selected
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-Skeleton] Skeleton with aria-busy

- [ ] Render `Skeleton` (react-loading-skeleton) with at least 4 rows
- [ ] Container has `data-testid="cliente-detail-skeleton"` + `aria-busy="true"`
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-NotFound] 404 branch renders NotFoundClientePanel

- [ ] Create `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.tsx`
- [ ] Title "Cliente no encontrado" + subtitle + CTA "Volver a Clientes"
- [ ] Root `role="alert"` + `data-testid="cliente-not-found"` + `aria-live="polite"`
- [ ] Branch in `ClienteDetailView`: `error?.response?.status === 404 → <NotFoundClientePanel />`
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-NotFound-NoDetail] Mutual exclusion

- [ ] Never render both `cliente-detail-panel` and `cliente-not-found` at the same time
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-NotFound-BackButton] CTA navigates to /clientes

- [ ] CTA `Button` (siesa-ui-kit) → `useNavigate({ to: '/clientes' })`
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-NotFound-NoStackTrace] NFR6 for 404

- [ ] Never render `error.response?.data` verbatim; only friendly copy
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-Error] 5xx renders ErrorPanel

- [ ] Reuse `ErrorPanel` shared component from Story 2.1
- [ ] Set `testId="cliente-detail-error-panel"` and pass `onRetry` callback
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-Error-Retry] Reintentar refetches

- [ ] `onRetry={() => void refetch()}` calls TanStack Query `refetch()`
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-Empty-Placeholder] /clientes shows placeholder

- [ ] Create `frontend/src/routes/clientes.index.tsx` rendering `data-testid="cliente-detail-empty"` with copy "Selecciona un cliente para ver el detalle"
- [ ] Placeholder hidden on mobile (`hidden lg:flex`)
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-API-200] Backend returns 200 + DTO by id

- [ ] Add `IClienteRepository.GetByIdAsync(Guid, CancellationToken)` in Domain
- [ ] Implement `ClienteRepository.GetByIdAsync` with `AsNoTracking()`
- [ ] Create `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` (CQRS)
- [ ] Wire endpoint `MapGet("/{id:guid}", …)` returning `Results.Ok(dto)`
- [ ] Register handler in DI (`Program.cs`)
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-API-404] Unknown id returns 404 Problem Details

- [ ] Handler returns `null` when not found; endpoint returns `Results.Problem(title: "Cliente no encontrado", statusCode: 404, ...)`
- [ ] Content-Type `application/problem+json` (framework default when using `Results.Problem`)
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-API-400] Non-GUID segment returns 4xx Problem Details

- [ ] Route constraint `{id:guid}` refuses non-GUID; framework emits Problem Details
- [ ] ✅ Test passes

### Test: [TC-Story-2.2-API-NoStackTrace] NFR6 for 404 response

- [ ] Confirm `ExceptionHandlingMiddleware` + `AddProblemDetails()` are in the pipeline (already wired in Story 1.3)
- [ ] Do not surface `.cs:line`, `System.` prefixes, or `Microsoft.EntityFrameworkCore` traces
- [ ] ✅ Test passes

---

## Running Tests

```bash
# Run the full Story 2.2 ATDD suite (E2E + API contract) via Playwright
pnpm exec playwright test e2e/tests/clientes/story-2.2-client-detail-view.spec.ts e2e/tests/api/story-2.2-cliente-detail.api.spec.ts

# Run only the E2E acceptance suite
pnpm exec playwright test e2e/tests/clientes/story-2.2-client-detail-view.spec.ts

# Run only the API contract suite
pnpm exec playwright test e2e/tests/api/story-2.2-cliente-detail.api.spec.ts

# Run one describe (or one test by title)
pnpm exec playwright test e2e/tests/clientes/story-2.2-client-detail-view.spec.ts -g "TC-Story-2.2-Select"

# Debug a single test with the Playwright inspector
pnpm exec playwright test e2e/tests/clientes/story-2.2-client-detail-view.spec.ts --debug -g "TC-Story-2.2-NotFound"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 15 E2E scenarios written and expected to fail (missing route, missing components, missing endpoint).
- All 4 API contract scenarios written and expected to fail (endpoint not registered).
- Data-testid + role/aria requirements documented.
- Mock strategies documented (network-first).

### GREEN Phase (DEV Team — Next Steps)

1. Pick the failing test that unlocks the smallest slice (recommended order: API 200 → API 404 → E2E DeepLink → NotFound → Error → Skeleton → Select/Switch).
2. Implement minimal code (backend endpoint, then frontend hook + component + route) to make that test pass.
3. Run the test; if green, move on. Keep the rest of the suite failing until each slice lands.
4. Add the DEV-owned Vitest specs listed in Task 13 as you go — they complement (not replace) the ATDD suite.

### REFACTOR Phase (DEV Team)

- With all tests green, tighten the split-panel layout, extract reusable pieces, and confirm the mobile hide/show still works (`hidden lg:flex`).
- Ensure no regressions: `pnpm --filter frontend test`, `pnpm --filter frontend build`, `dotnet test`.

---

## Knowledge Base References Applied

- `network-first.md` — All `page.route(...)` intercepts registered BEFORE `page.goto(...)`.
- `selector-resilience.md` — Only `data-testid` and ARIA queries (never CSS classes) used for assertions.
- `test-quality.md` — Given-When-Then structure, atomic assertions, deterministic seeds.
- `timing-debugging.md` — No hard waits; explicit `expect(...).toBeVisible()` and `expect(page).toHaveURL(...)` wait naturally.
- `data-factories.md` — Deterministic `seedClientes` array (aligned with Story 2.1 for consistency).
- `test-levels-framework.md` — E2E for user journey (AC1–7), API contract for backend contract (AC8/NFR6). No component tests here — deferred to DEV Vitest suite.

---

## Notes

- **Route pattern**: The story uses TanStack Router file-based routing with `$clienteId`. Tests assert URL with `new RegExp('/clientes/<id>$')` and rely on TanStack navigating without page reload (`__spaMarker__` window check).
- **404 Problem Details vs UI**: The frontend must never render `error.response?.data` (Problem Details) directly. Test [TC-Story-2.2-NotFound-NoStackTrace] scans the DOM for `.cs:line`, `System.*Exception`, and `Microsoft.EntityFrameworkCore` to enforce NFR6.
- **API 200 dependency**: `[TC-Story-2.2-API-200]` seeds via POST /clientes; it self-skips (`test.skip`) if POST is not available (backend Story 2.3 not implemented). This lets the suite stay green in intermediate states without hiding the missing GET-by-id endpoint failure.
- **Route ordering**: `page.route('**/api/v1/clientes', ...)` (list) and `page.route('**/api/v1/clientes/*', ...)` (detail) don't overlap in Playwright's glob matcher — the trailing `/*` guarantees the second only fires on `/clientes/:id`.

---

## Contact

**Questions or Issues?**

- Consult `_bmad/bmm/testarch/knowledge` for testing best practices
- Refer to `_bmad-output/atdd-checklist-2-1.md` for the Story 2.1 pattern this suite extends
- Refer to `_bmad-output/test-design-epic-2.md` for the P1#2 / P1#3 / P1#12 / R-010 mappings

---

**Generated by BMad TEA Agent** — 2026-07-02
