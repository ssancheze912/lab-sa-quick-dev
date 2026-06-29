# ATDD Checklist - Epic 2, Story 2.2: Client Detail View

**Date:** 2026-06-29
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** Component (Vitest + RTL + MSW) — secondary E2E (Playwright) + API integration (Playwright API)

---

## Story Summary

As a commercial team member, I want to view the complete details of a client by selecting them from the list, so that I can review all their information without navigating away from the clients section.

---

## Acceptance Criteria

1. AC #1 — `GET /api/v1/clientes/{id}` returns `200` + single `ClienteDto` (camelCase, `nitRuc`, ISO 8601 timestamps).
2. AC #2 — Non-existent id → `404` + `application/problem+json` (RFC 7807), no internal-detail leakage (NFR6).
3. AC #3 — Syntactically invalid UUID → `400` (route-constraint failure).
4. AC #4 — Clicking a list item navigates to `/clientes/{id}` route segment; list panel stays mounted; selected item gets `aria-current="true"`.
5. AC #5 — Cold deep link `/clientes/{id}` resolves; list + detail render together; detail loads via TanStack Query (`['clientes', id]`).
6. AC #6 — Non-existent deep-link id → graceful `ClienteNotFound` component (exact Spanish copy + "Volver a la lista" CTA); no console error; no leakage of 404 / Problem Details strings.
7. AC #7 — Skeleton placeholder (`role="status"`, `aria-busy="true"`, `aria-label="Cargando cliente"`) while detail GET is pending.
8. AC #8 — Non-404 errors render `ErrorPanel` (reused from Story 2.1) with `onRetry={refetch}`; no error object accepted (NFR6).
9. AC #9 — Detail card uses siesa-ui-kit `DescriptionList` with 4 pairs in order: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`; wrapped in a section with `aria-labelledby` pointing to an `<h2>` rendering the client name.
10. AC #10 — Switching selection does NOT refetch `GET /api/v1/clientes` (list cache reused).

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (7 tests)

**File:** `e2e/tests/clientes/cliente-detail-deep-link.atdd.spec.ts`

- AC #5 — cold deep link renders detail card with 4 fields (Nombre/NIT/RUC/Teléfono/Ciudad)
- AC #5 — cold deep link mounts left list AND right detail panel together
- AC #4 — click list item → URL updates to `/clientes/{id}` + detail card renders
- AC #4 — clicked item has `aria-current="true"`
- AC #6 / R7 — non-existent deep-link id → ClienteNotFound + exact Spanish copy + zero console errors + NFR6 leak check
- AC #6 — "Volver a la lista" navigates back to `/clientes`
- AC #10 — switching selection does NOT refetch `GET /api/v1/clientes`
- AC #7 — skeleton renders with `role="status"` / `aria-busy="true"` / `aria-label="Cargando cliente"` during pending

### API Integration Tests — Playwright APIRequestContext (5 tests)

**File:** `e2e/tests/api/cliente-by-id.api.atdd.spec.ts`

- AC #1 — `200 OK` + ClienteDto (camelCase, `nitRuc`, single object NOT array)
- AC #1 — `createdAt`/`updatedAt` are ISO 8601 with timezone info
- AC #2 — non-existent id → `404` + `application/problem+json` + RFC 7807 body (`detail: null`)
- AC #2 / NFR6 — 404 body does NOT contain `ClienteEntity`, `DbContext`, SQL, or stack-trace frames
- AC #3 — `GET /api/v1/clientes/not-a-guid` → `400`

### Component Tests — Vitest + RTL + MSW (9 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- AC #7 — skeleton with `role=status` / `aria-busy` / `aria-label` during pending
- AC #5 / AC #9 — 200 → DescriptionList with 4 pairs (Nombre, NIT/RUC, Teléfono, Ciudad)
- AC #9 — `<h2>` renders client name + `aria-labelledby` wires the card to it
- AC #6 / R7 — 404 → `ClienteNotFound`; exact Spanish copy; no console.error
- AC #6 / NFR6 — DOM does NOT contain `404`, `about:blank`, `section-6.5.4`
- AC #6 — "Volver a la lista" calls `navigate({ to: '/clientes' })` once
- AC #8 / R8 — 500 → `ErrorPanel`; click "Reintentar"; detail card renders after recovery
- NFR6 — `ErrorPanel` does NOT leak `500` / `about:blank` / `http` / `api/v1`

### useCliente Hook Tests — Vitest (4 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.tsx`

- AC #5 — settles to `success` with the dto on 200
- AC #6 — settles to `error` whose `error instanceof ClienteNotFoundError` on 404; handler hit exactly once (no retry)
- AC #8 — retries up to 2 times on 500 (3 total handler hits); error is NOT a `ClienteNotFoundError`
- AC #5 — does NOT fire any request when `id` is undefined (`enabled: Boolean(id)`)

### ClienteNotFound Component Tests — Vitest (5 tests)

**File:** `frontend/src/shared/components/ClienteNotFound/ClienteNotFound.test.tsx`

- AC #6 — exact Spanish title and subtitle copy
- AC #6 — `data-testid="cliente-not-found"`, `role="status"`, `aria-live="polite"`
- AC #6 — single "Volver a la lista" button
- AC #6 — click → `onBackToList` fires exactly once
- NFR6 — receives only `{ onBackToList }` (no error prop); HTML cannot leak `404` / `about:blank` / `section-6.5.4` / `ClienteEntity`

### Route Integration Tests — Vitest + RTL + Memory Router (4 tests)

**File:** `frontend/src/routes/clientes.$clienteId.test.tsx`

- AC #5 — cold deep link at `/clientes/{id}` mounts list panel AND detail card
- AC #6 / R7 — non-existent id deep link → `ClienteNotFound`; list stays interactive
- AC #6 — "Volver a la lista" returns router to `/clientes`
- AC #4 / AC #10 — clicking list item updates URL to `/clientes/{id}` and the list panel keeps the same DOM node (no remount)

---

## Data Factories / Fixtures Created

### MSW per-id handlers (additive to existing Story 2.1 set)

**File:** `frontend/src/mocks/handlers/clientes.ts`

New exports:

- `clienteByIdHandler(cliente)` — `200` + the given `ClienteFixture`
- `clienteByIdNotFoundHandler(id)` — `404` + RFC 7807 Problem Details (`Content-Type: application/problem+json`, `detail: null`)
- `clienteByIdServerErrorHandler(id)` — `500` + Problem Details body (drives the `ErrorPanel` branch)

### E2E factories — reused

The existing E2E `ApiHelper` (`e2e/helpers/api.helper.ts`) and `buildCliente()` factory (`e2e/helpers/data.helper.ts`) are reused. No new factory required for Story 2.2 because the per-id endpoint reads data already created by the existing `createCliente()` helper.

---

## Mock Requirements (DEV Team — for the backend handoff)

| Endpoint | Status | Body | Notes |
|----------|--------|------|-------|
| `GET /api/v1/clientes/{id}` | `200` | `ClienteDto` (camelCase, `nitRuc`) | Single object, NOT an array |
| `GET /api/v1/clientes/{id}` | `404` | RFC 7807 Problem Details (`application/problem+json`) | `detail: null`; body never contains `ClienteEntity`, `DbContext`, SQL fragments, or stack frames (NFR6) |
| `GET /api/v1/clientes/not-a-guid` | `400` | Default ASP.NET Problem Details | Route-constraint `:guid` failure |

---

## Required `data-testid` Attributes

These attributes MUST be added by the DEV team. Tests will stay RED until they exist.

### `ClienteDetailView` (`/clientes/$clienteId`)

- `cliente-detail-skeleton` — skeleton container during pending (`role="status"`, `aria-busy="true"`, `aria-label="Cargando cliente"`)
- `cliente-detail-card` — the rendered detail `<article>` (success branch). Must carry `aria-labelledby` pointing to an `<h2 id="cliente-detail-heading">{cliente.nombre}</h2>`
- `cliente-detail-description-list` — the siesa-ui-kit `DescriptionList` (already wired in Task 11)

### `ClienteNotFound` (`shared/components/ClienteNotFound`)

- `cliente-not-found` — root `<section>` with `role="status"` and `aria-live="polite"`

### `ClienteListView` (updated — Story 2.1 selectors carry over)

- Existing: `client-list-panel`, `client-search-input`, `client-list-skeleton`, `client-list-skeleton-item`, `client-list-item-{id}`, `empty-state-no-clients`, `empty-state-search-empty`, `error-panel`, `error-panel-retry`
- New behaviour: `client-list-item-{id}` carries `aria-current="true"` when the route param `clienteId` matches that id (Task 9)

---

## Implementation Checklist

### Test: GET /api/v1/clientes/{id} backend endpoint (Task 1, 2, 3)

- [ ] Create `Application/Clientes/Queries/GetClienteByIdQuery.cs`
- [ ] Create `Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` (delegates to `IClienteRepository.GetByIdAsync`; returns `null` on miss — no throw)
- [ ] Register handler in `ApplicationServiceCollectionExtensions.AddApplication()`
- [ ] Add `MapGet("/{id:guid}", ...)` to `ClienteEndpoints.cs` with `Results.Problem(...)` on miss (RFC 7807)
- [ ] Run `dotnet test backend/tests/SiesaAgents.UnitTests/` → `GetClienteByIdQueryHandlerTests` pass
- [ ] Run `dotnet test backend/tests/SiesaAgents.IntegrationTests/` → `ClienteByIdEndpointTests` pass
- [ ] Run Playwright API spec → `e2e/tests/api/cliente-by-id.api.atdd.spec.ts` passes

### Test: Frontend domain + infrastructure (Task 4, 5)

- [ ] Add `getById(id)` to `IClienteRepository` contract
- [ ] Create `domain/errors.ts` with `ClienteNotFoundError`
- [ ] Implement `clienteApiRepository.getById` mapping 404 → `ClienteNotFoundError`
- [ ] Do NOT pass the Problem Details body anywhere — discard it at the network layer

### Test: useCliente hook (Task 6)

- [ ] Create `application/useCliente.ts` (TanStack Query hook, queryKey `['clientes', id]`, `enabled: Boolean(id)`, 404-aware retry policy)
- [ ] Run `pnpm --filter frontend test useCliente` → all 4 tests pass

### Test: ClienteNotFound shared component (Task 10)

- [ ] Create `shared/components/ClienteNotFound/ClienteNotFound.tsx` (props: `{ onBackToList }` — no error prop)
- [ ] Create barrel `shared/components/ClienteNotFound/index.ts`
- [ ] Run `pnpm --filter frontend test ClienteNotFound` → all 5 tests pass

### Test: ClienteDetailView component (Task 11)

- [ ] Create `presentation/ClienteDetailView.tsx` with 3-branch render (`pending → error → success`); inside `error`, sub-branch on `error instanceof ClienteNotFoundError`
- [ ] Render skeleton container with the spec a11y attributes
- [ ] Render `<article data-testid="cliente-detail-card" aria-labelledby="cliente-detail-heading">` + `<h2 id="cliente-detail-heading">{cliente.nombre}</h2>` + `DescriptionList` with 4 pairs
- [ ] Wire `onBackToList` to `navigate({ to: '/clientes' })`
- [ ] Run `pnpm --filter frontend test ClienteDetailView` → all 9 tests pass

### Test: ClientesShell + route refactor (Task 7, 8, 9)

- [ ] Create `presentation/ClientesShell.tsx` (dual-pane layout, mounts `ClienteListView` + `{children}`)
- [ ] Refactor `routes/clientes.tsx` to use `ClientesShell` + placeholder right pane; REMOVE `validateSearch` and `ClientesRouteSearch`
- [ ] Create `routes/clientes.$clienteId.tsx` (uses `ClientesShell` + `ClienteDetailView`)
- [ ] Refactor `ClienteListView` to read selection from `useParams({ strict: false })`; update `navigate` call to `{ to: '/clientes/$clienteId', params: { clienteId: id } }`
- [ ] Regenerate `routeTree.gen.ts` (`pnpm dev` once, or `pnpm exec tsr generate`)

### Test: Route integration (Task 12)

- [ ] Run `pnpm --filter frontend test clientes.\$clienteId` → all 4 tests pass

### Test: E2E (Task 12)

- [ ] All backend + frontend in place, dev servers runnable
- [ ] Run `pnpm exec playwright test e2e/tests/clientes/cliente-detail-deep-link.atdd.spec.ts`
- [ ] All 8 E2E scenarios pass

### Build + lint gate (Task 14, 15)

- [ ] `pnpm exec tsc -b` → 0 errors
- [ ] `pnpm run lint` → 0 errors (only pre-existing `only-export-components` warnings on route files)
- [ ] `pnpm test` → ALL tests pass (new + Story 2.1 + Story 1.2 baselines)
- [ ] `pnpm run build` → main bundle < 500 KB gzipped
- [ ] `dotnet build backend/SiesaAgents.sln` → 0 warnings
- [ ] `dotnet test backend/SiesaAgents.sln` → all unit + integration tests pass

---

## Red-Green-Refactor Workflow

### RED Phase (complete — this checklist)

- All tests created at the right level (E2E, API, Component, Route, Hook, Shared)
- Per-id MSW handlers added to `frontend/src/mocks/handlers/clientes.ts`
- Expected outcome: every test fails because the corresponding endpoint / hook / component does NOT yet exist (and `routes/clientes.$clienteId.tsx` is not in `routeTree.gen.ts`)

### GREEN Phase (DEV team)

1. Start with the backend endpoint (`GetClienteByIdQuery` + handler + `MapGet`). Fastest feedback loop because the API integration test covers the contract end-to-end.
2. Add the frontend domain errors (`ClienteNotFoundError`) + infrastructure (`getById`).
3. Implement the `useCliente` hook (drives the per-id MSW handlers used by the rest of the suite).
4. Build the `ClienteNotFound` shared component (no router dependency — easiest test).
5. Build `ClienteDetailView` (depends on `useCliente`, `ClienteNotFound`, `ErrorPanel`).
6. Refactor `ClienteListView` (drop `?selected=`, switch to `useParams`).
7. Create `ClientesShell` + the two routes (`clientes.tsx`, `clientes.$clienteId.tsx`). Regenerate `routeTree.gen.ts`.
8. Finally run the E2E + route integration tests.

### REFACTOR Phase

- Tests are the safety net — refactor freely once green
- Common candidates: extract the detail-card layout into a smaller `<ClienteDetailCard data={cliente} />` purely-presentational component once the AC branches are stable; lift the `'Cliente no encontrado'` copy into i18n strings when the i18n story lands.

---

## Running Tests

```bash
# Backend — Application unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/

# Backend — API + Schema integration tests (Testcontainers Postgres 18)
dotnet test backend/tests/SiesaAgents.IntegrationTests/

# Frontend — Vitest (component, hook, route)
pnpm --filter frontend test

# Frontend — single suite
pnpm --filter frontend test ClienteDetailView

# E2E — Playwright (requires backend + frontend running)
pnpm exec playwright test e2e/tests/clientes/cliente-detail-deep-link.atdd.spec.ts

# E2E — API only (no UI dependency)
pnpm exec playwright test e2e/tests/api/cliente-by-id.api.atdd.spec.ts
```

---

## Knowledge Base References Applied

- `network-first.md` — every E2E test uses `page.route(...)` BEFORE `page.goto(...)`
- `data-factories.md` — `buildClienteFixture` + per-id MSW handlers reuse the Story 2.1 fixture factory (faker-style, random ids)
- `fixture-architecture.md` — MSW server lifecycle wired via `setupFiles`; per-suite `server.use(...)` composes the per-id branches
- `component-tdd.md` — RTL + MSW for branches (`pending` / `success` / `error/not-found` / `error/server`)
- `test-quality.md` — Given-When-Then; one behavioural focus per test; deterministic via MSW
- `selector-resilience.md` — `data-testid` everywhere; ARIA names where they map to user intent (`Volver a la lista`, `Reintentar`)
- `test-healing-patterns.md` — `aria-current="true"` asserted via `toHaveAttribute` (not via class match); selectors stable across CSS refactors

---

## Notes

- The Playwright E2E spec (`cliente-detail-deep-link.atdd.spec.ts`) is added per Task 12 with the constraint that the workspace-root Playwright runner is already wired (`playwright.config.ts` at repo root + Story 2.1's spec already running). It executes against the live dev servers via `webServer.command`.
- The component-level NFR6 leakage scan asserts on `container.innerHTML` directly — that's the gate. The clienteId (which IS in `data-testid` and `aria-labelledby` attributes by design) is NOT considered leakage because the caller already knows it (it came from the URL).
- The "no remount" assertion in the route integration test uses DOM-node identity comparison (`expect(panelAfter).toBe(panelBefore)`) — React reconciliation keeps the same node when the component reference is stable across the routes via `ClientesShell`.
- Story 2.1's `?selected=` search-param tests in `ClienteListView.test.tsx` are NOT updated here (that belongs to the DEV agent during the implementation pass — see Task 13). The new test suite intentionally references the route-segment world (`/clientes/$clienteId`).

---

**Generated by BMad TEA Agent** — 2026-06-29
