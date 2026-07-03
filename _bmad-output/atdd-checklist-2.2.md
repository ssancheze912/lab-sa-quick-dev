# ATDD Checklist — Epic 2, Story 2.2: Client Detail View

**Date:** 2026-07-03
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + API Integration (xUnit) + E2E (Playwright)

---

## Story Summary

Story 2.2 introduces the master-detail deep-link experience on `/clientes/{clienteId}`: clicking a list item updates the URL and renders the 4-field client detail in the right panel; direct navigation to the deep-link URL renders the detail with the corresponding item highlighted; a non-existent id resolves to a Spanish not-found panel with a back-to-list CTA — all without unmounting the AppShell / navigation rail / left list panel. On the backend, this story adds `GET /api/v1/clientes/{id:guid}` returning either the full DTO (200) or an RFC 7807 Problem Details 404 without leaking internals (NFR6).

**As a** commercial team member
**I want** to view the complete details of a client by selecting them from the list
**So that** I can review all their information without navigating away from the clientes section.

---

## Acceptance Criteria (Story 2.2)

1. **AC #1** — Click on a `<ClientListItem>` updates URL to `/clientes/{id}` (FR30); right panel shows `<ClienteDetailView>` with Nombre, NIT/RUC, Teléfono, Ciudad; the selected item gains active styling via `activeProps`; SPA navigation only (AppShell + NavigationRail stay mounted).
2. **AC #2** — Direct navigation to `/clientes/{id}` (deep-link or refresh) renders both list AND detail; selected item is highlighted; no redirect back to `/clientes`.
3. **AC #3** — Non-existent id → `<ClienteNotFound>` (`data-testid="cliente-not-found"`) with Spanish copy + `<Link to="/clientes">Volver a la lista</Link>`; no console error; AppShell + list panel intact.
4. **AC #4** — Backend endpoint `GET /api/v1/clientes/{id:guid}` returns 200 + single JSON object; camelCase fields (`id, nombre, nitRuc, telefono, ciudad, createdAt, updatedAt`); ISO-8601 + offset timestamps; `:guid` route constraint short-circuits non-GUID segments to 404 without invoking the handler.
5. **AC #5** — 404 for well-formed GUID with no matching row; `Content-Type: application/problem+json`; body contains `title / status / type / instance`; NO `stackTrace / Exception / Npgsql / DbUpdateException` in body (NFR6).
6. **AC #6** — Backend `IClienteRepository.GetByIdAsync(Guid id, CancellationToken)` + `ClienteRepository` implementation using `AsNoTracking().FirstOrDefaultAsync`.
7. **AC #7** — Frontend `IClienteRepository.getById(id, signal?)` domain + `clienteApiRepository.getById` via `apiClient.get`.
8. **AC #8** — `useCliente(clienteId)` hook: `queryKey: ['clientes', clienteId]` (canonical), `queryFn` calls repo with AbortSignal, `staleTime: 30_000`, `retry: false` on 404, `isClienteNotFound(error)` helper exported.
9. **AC #9** — `tsc -b` + `dotnet build` → 0 errors / 0 warnings; no `any` casts.
10. **AC #10** — All P0/P1 tests from this ATDD pass (or self-skip per Docker-sandbox rule).
11. **AC #11** — All user-facing text in Spanish (`Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`, "No se encontró el cliente solicitado…", "Volver a la lista"); code identifiers in English.

---

## Failing Tests Created (RED Phase)

### Component Tests (Vitest + React Testing Library + MSW)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (~330 lines) — **14 tests**

Covers ACs #1, #3, #11 through a stub TanStack memory router + `QueryClientProvider` around `<ClienteDetailView>`.

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 1 | should render the cliente Nombre in the detail-field-nombre testid | RED — `ClienteDetailView` module missing | TC-E2-P1-04, AC #1 |
| 2 | should render the cliente NIT/RUC in the detail-field-nit-ruc testid | RED — component missing | TC-E2-P1-04, AC #1 |
| 3 | should render the cliente Teléfono in the detail-field-telefono testid | RED — component missing | TC-E2-P1-04, AC #1 |
| 4 | should render the cliente Ciudad in the detail-field-ciudad testid | RED — component missing | TC-E2-P1-04, AC #1 |
| 5 | should render Spanish field labels: Nombre, NIT/RUC, Teléfono, Ciudad | RED — component missing | TC-E2-P1-04, AC #11 |
| 6 | should NOT render the ClienteNotFound panel on a successful response | RED — component missing | TC-E2-P1-04 branch discipline |
| 7 | should render the cliente-not-found panel when the API returns 404 | RED — `ClienteNotFound.tsx` missing | TC-E2-P1-05, AC #3 |
| 8 | should render Spanish copy inside the not-found panel | RED — component missing | TC-E2-P1-05, AC #11 |
| 9 | should expose a "Volver a la lista" link pointing to /clientes | RED — component missing | TC-E2-P1-05, AC #3 |
| 10 | should NOT render the detail fields when the API returns 404 | RED — component missing | TC-E2-P1-05 branch discipline |
| 11 | should NOT render the ErrorPanel when the API returns 404 (404 ≠ 5xx) | RED — component missing | TC-E2-P1-05 branch discipline |
| 12 | should render the ErrorPanel (not ClienteNotFound) when the API returns 500 | RED — component missing | Non-404 error path |
| 13 | should render the detail-skeleton before the query resolves | RED — component missing | Loading skeleton |
| 14 | should dismiss the skeleton once the query resolves with data | RED — component missing | Loading skeleton dismiss |
| 15 | should mount the cliente-detail wrapper on successful load | RED — component missing | Article container present |

**MSW handlers extended** in `frontend/src/test/handlers/clientes.ts` — added `byId(cliente)`, `byIdNotFound()`, `byIdError(status)`, `byIdDelayed(cliente, ms)`.

### Hook Tests (Vitest + RTL + MSW)

**File:** `frontend/src/modules/crm/clientes/application/useCliente.test.tsx` (~230 lines) — **7 tests**

Direct hook-level tests that validate the TanStack Query contract of `useCliente(clienteId)` + `isClienteNotFound(error)` helper.

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 1 | should cache the fetched cliente under queryKey ["clientes", id] | RED — hook missing | AC #8 canonical key |
| 2 | should resolve with the cliente returned by the repository | RED — hook missing | AC #7, AC #8 |
| 3 | should NOT retry the request when the API returns 404 (single hit) | RED — hook missing | AC #8 no-retry on 404 |
| 4 | should mark isClienteNotFound(error) === true on a 404 response | RED — helper missing | AC #8 |
| 5 | should retry more than once when the API returns 500 | RED — hook missing | AC #8 retry on non-404 |
| 6 | should mark isClienteNotFound(error) === false on a non-404 response | RED — helper missing | AC #8 |
| 7 | isClienteNotFound — helper returns false for undefined/null/strings/Error | RED — helper missing | AC #8 helper contract |

### `<ClientListItem>` Migration Tests (extend existing file)

**File:** `frontend/src/shared/components/ClientListItem.test.tsx` — new **4 tests** added under the "Story 2.2 — TanStack Router <Link> migration" describe block. The pre-existing Story 2.1 assertions remain untouched and pass against the current `<button>` implementation until Task 11 lands the migration — at that point the DEV team removes/updates the Story 2.1 assertions (per the story's Task 13 explicit instruction to "extend").

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 1 | should render an anchor whose href points to /clientes/{id} | RED — still a `<button>` | AC #1, AC #10 page-object |
| 2 | should preserve the 44 px minimum tap target on the migrated anchor | RED — still a `<button>` | Accessibility carry-over |
| 3 | should apply the active class when the URL matches the item id (deep-link) | RED — no `activeProps` yet | AC #2 URL-driven highlight |
| 4 | should NOT apply the active class when the URL does not match the item id | RED — no `activeProps` yet | AC #2 branch discipline |

### API Integration Tests (xUnit + WebApplicationFactory + Testcontainers Postgres)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ClienteByIdEndpointTests.cs` (~230 lines) — **3 tests** (TC-E2-P1-12)

`Docker-availability` probe follows the Story 1.3 / 2.1 pattern — self-skips via `SkippableFact` when Docker is unavailable in the sandbox.

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 1 | GetClienteById_returns_200_with_full_payload_for_existing_id | RED — endpoint missing | TC-E2-P1-12, AC #4, #11 (implicit) |
| 2 | GetClienteById_returns_404_ProblemDetails_for_missing_id | RED — endpoint missing | TC-E2-P1-12, AC #5, NFR6 |
| 3 | GetClienteById_returns_404_when_segment_is_not_a_guid | RED — endpoint missing | AC #4 route constraint `:guid` |

### E2E Tests (Playwright)

**File:** `e2e/tests/clientes/clientes-deep-link.spec.ts` (~170 lines) — **7 tests** (TC-E2-P1-04 + TC-E2-P1-05)

Uses the existing `ApiHelper` + `buildCliente` factory for seed/teardown (Story 2.1 pattern). Data-testid selectors only.

| # | Test | Status | Verifies |
|---|------|--------|----------|
| 1 | TC-E2-P1-04 — abrir /clientes/{id} directamente renderiza el detalle | RED — route file + hook + view missing | TC-E2-P1-04, AC #2 |
| 2 | TC-E2-P1-04 — el AppShell y la lista permanecen montados al abrir /clientes/{id} | RED — same | AC #2 shell mount |
| 3 | TC-E2-P1-04 — deep-link resalta el item correspondiente en la lista | RED — no `activeProps` yet | AC #1, #2 highlight sync |
| 4 | TC-E2-P1-05 — /clientes/{guid-inexistente} renderiza ClienteNotFound | RED — component missing | TC-E2-P1-05, AC #3 |
| 5 | TC-E2-P1-05 — el link "Volver a la lista" navega a /clientes | RED — component missing | AC #3 CTA behaviour |
| 6 | TC-E2-P1-05 — no debe emitir errores de consola al renderizar not-found | RED — component missing | AC #3 (no JS error) |
| 7 | TC-E2-P1-05 — el AppShell y el panel de lista permanecen intactos en not-found | RED — component missing | AC #3 shell mount |

---

## Total Test Count

- Component tests: **15** (all RED — new `ClienteDetailView.test.tsx`)
- Hook tests: **7** (all RED — new `useCliente.test.tsx`)
- ClientListItem migration tests: **4** (all RED — added to existing file)
- API integration tests: **3** (all RED, Docker-guarded)
- E2E tests: **7** (all RED — new `clientes-deep-link.spec.ts`)
- **Grand total: 36 new failing tests**

---

## Data Factories Created / Reused

### `makeCliente` (frontend, extended)

**File:** `frontend/src/test/handlers/clientes.ts` — already exists from Story 2.1. No change to the factory; only the MSW handler surface was extended with `byId / byIdNotFound / byIdError / byIdDelayed`.

### Backend seed (`ClienteEntity` direct insert)

Reused Story 2.1 pattern — `AppDbContext.Clientes.Add(...)` inside a `WebApplicationFactory` scope. No new factory helper needed.

### E2E factory (`buildCliente`)

**File:** `e2e/helpers/data.helper.ts` — already exists from Story 2.1. No change.

---

## Fixtures Created / Reused

- **MSW `setupServer`** — instantiated at the top of each new test file (network-first pattern, handlers swapped per test).
- **`makeQueryClient()` / `makeQueryClientAllowRetries()`** — helpers inside `ClienteDetailView.test.tsx` and `useCliente.test.tsx` for deterministic isolation.
- **`renderDetailView(ui)`** — wraps a fresh QueryClient + a stub TanStack memory-router around the SUT so `<ClienteNotFound>`'s `<Link>` can resolve.
- **`renderInRouter(ui, initialPath)`** — helper inside the extended `ClientListItem.test.tsx` for the Link-migration tests.
- **E2E `base.fixture.ts`** — reused from Story 2.1; no new Playwright fixture added.

---

## Mock Requirements

**MSW request handlers** (`frontend/src/test/handlers/clientes.ts`, extended):

| Handler | Endpoint | Response | Purpose |
|---------|----------|----------|---------|
| `byId(cliente)` | `GET */api/v1/clientes/{cliente.id}` | `200 <cliente>` | Happy-path detail render |
| `byIdNotFound()` | `GET */api/v1/clientes/:id` | `404 <ProblemDetails>` | ClienteNotFound render |
| `byIdError(status)` | `GET */api/v1/clientes/:id` | `<status>` (null body) | ErrorPanel render |
| `byIdDelayed(cliente, ms)` | `GET */api/v1/clientes/{id}` | `200 <cliente>` after `ms` | Detail loading skeleton |

**Backend integration tests** — no mocks. Testcontainers Postgres provides a real DB.

**E2E** — no MSW. Real backend + real Postgres (or self-skipped when Docker is off).

---

## Required `data-testid` Attributes

### `ClienteDetailView` (`frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`)

- `cliente-detail` — outer `<article>` of the detail view.
- `cliente-detail-skeleton` — loading placeholder wrapper.
- `cliente-detail-nombre` — h2 title of the detail header.
- `cliente-detail-field-nombre` — `<dd>` for the Nombre row.
- `cliente-detail-field-nit-ruc` — `<dd>` for the NIT/RUC row.
- `cliente-detail-field-telefono` — `<dd>` for the Teléfono row.
- `cliente-detail-field-ciudad` — `<dd>` for the Ciudad row.

### `ClienteNotFound` (`frontend/src/shared/components/ClienteNotFound.tsx`)

- `cliente-not-found` — outer container of the not-found panel.
- `cliente-not-found-back` — the "Volver a la lista" `<Link>`.

### Preserved (from Story 2.1 / Story 1.2, do NOT rename)

- `app-shell`, `nav-rail`, `clientes-view`, `cliente-list-panel`, `cliente-list-search`, `cliente-list`, `cliente-list-item`, `cliente-list-skeleton`, `empty-state`, `error-panel`, `error-panel-retry`, `cliente-detail-placeholder`.

**Implementation example:**

```tsx
<article data-testid="cliente-detail" className="flex-1 flex flex-col overflow-y-auto p-6 gap-4">
  <header className="flex flex-col gap-1">
    <h2 data-testid="cliente-detail-nombre" className="text-2xl font-semibold text-slate-900">{data.nombre}</h2>
  </header>
  <dl className="grid grid-cols-1 gap-3">
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Nombre</dt>
      <dd data-testid="cliente-detail-field-nombre" className="text-sm text-slate-900">{data.nombre}</dd>
    </div>
    {/* … NIT/RUC / Teléfono / Ciudad rows … */}
  </dl>
</article>
```

---

## Implementation Checklist

### Tests 1–15 (AC #1, #3, #11): `ClienteDetailView.test.tsx`

- [ ] Task 6 — extend `IClienteRepository` + `clienteApiRepository` with `getById`.
- [ ] Task 7 — create `useCliente(clienteId)` + `isClienteNotFound` helper.
- [ ] Task 8 — create `ClienteDetailView.tsx` presentation component (article + dl + 4 Spanish labels + branching for loading/not-found/error/success).
- [ ] Task 10 — create `ClienteNotFound.tsx` shared component with `<Link to="/clientes">Volver a la lista</Link>`.
- [ ] Add `data-testid` values: `cliente-detail`, `cliente-detail-skeleton`, `cliente-detail-nombre`, `cliente-detail-field-nombre`, `cliente-detail-field-nit-ruc`, `cliente-detail-field-telefono`, `cliente-detail-field-ciudad`, `cliente-not-found`, `cliente-not-found-back`.
- [ ] Run: `pnpm --filter frontend test -- ClienteDetailView.test.tsx --run --reporter=verbose`
- [ ] Expected: tests 1–15 GREEN.

### Tests 1–7 (AC #8): `useCliente.test.tsx`

- [ ] Task 7 — implement `useCliente` with `queryKey: ['clientes', clienteId]`, `staleTime: 30_000`, `retry: (failureCount, error) => !isAxios404(error) && failureCount < 3`.
- [ ] Task 7 — export `isClienteNotFound(error): boolean`.
- [ ] Run: `pnpm --filter frontend test -- useCliente.test.tsx --run`
- [ ] Expected: tests 1–7 GREEN.

### Tests 1–4 (AC #1, #2, #10): `ClientListItem.test.tsx` (Story 2.2 describe block)

- [ ] Task 11 — migrate `<ClientListItem>` from `<button onClick={onSelect}>` to `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }} activeProps={{ className: 'bg-slate-100 font-semibold' }}>`.
- [ ] Drop `isSelected` / `onSelect` props from the interface.
- [ ] Keep `data-testid="cliente-list-item"` and the `min-h-[44px]` class.
- [ ] Update the pre-existing Story 2.1 tests in the file (`onSelect` callback, `isSelected` styling) — these will need to be removed or refactored to match the new URL-driven contract. Per Task 13 in the story: "extend" the file, keep the `nombre` / `NIT` / testid / 44 px assertions, replace the selection-callback assertions with the anchor-href + activeProps assertions from this ATDD spec.
- [ ] Run: `pnpm --filter frontend test -- ClientListItem.test.tsx --run`
- [ ] Expected: tests 1–4 GREEN.

### Tests 1–3 (AC #4, #5, NFR6): `ClienteByIdEndpointTests.cs` (TC-E2-P1-12)

- [ ] Task 1 — add `IClienteRepository.GetByIdAsync(Guid id, CancellationToken)` + `ClienteRepository.GetByIdAsync` (`AsNoTracking().FirstOrDefaultAsync`).
- [ ] Task 2 — create `GetClienteByIdQuery` (record) + `GetClienteByIdQueryHandler` returning `Task<ClienteDto?>`.
- [ ] Task 3 — extend `ClienteEndpoints.cs` with `group.MapGet("/{id:guid}", ...)` — returns `Results.NotFound()` (triggers `UseStatusCodePages` middleware for the Problem Details body) OR `Results.Ok(dto)`.
- [ ] Task 4 — register `GetClienteByIdQueryHandler` as Scoped in `Program.cs`.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ClienteByIdEndpointTests"`
- [ ] Expected: tests 1–3 GREEN when Docker is available; `Skip` otherwise.

### Tests 1–7 (AC #2, #3): `clientes-deep-link.spec.ts` E2E

- [ ] Task 9 — create `frontend/src/routes/_app/clientes.$clienteId.tsx` (dynamic-parameter route).
- [ ] Task 9 — create `frontend/src/routes/_app/clientes.index.tsx` (index route with placeholder).
- [ ] Task 9 — update `frontend/src/routes/_app/clientes.tsx` — remove inline placeholder; keep `<Outlet />`; preserve `data-testid="clientes-view"`.
- [ ] Let TanStack Router regenerate `frontend/src/routeTree.gen.ts` (Vite plugin).
- [ ] Verify AppShell (`data-testid="app-shell"`) + NavigationRail (`data-testid="nav-rail"`) from Story 1.2 are still exposed for the deep-link chrome assertions.
- [ ] Run: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/clientes/clientes-deep-link.spec.ts --project=chromium`
- [ ] Expected: tests 1–7 GREEN (or skipped if the sandbox lacks the Chromium binary — Story 1.1 note #7).

---

## Running Tests

```bash
# ---- Frontend (Vitest) ----
# All tests
pnpm --filter frontend test

# Only Story 2.2 component tests
pnpm --filter frontend test -- ClienteDetailView.test.tsx

# Only Story 2.2 hook tests
pnpm --filter frontend test -- useCliente.test.tsx

# ClientListItem (Story 2.1 + Story 2.2 Link migration)
pnpm --filter frontend test -- ClientListItem.test.tsx

# ---- Backend (xUnit) ----
# All tests (Testcontainers ones self-skip if Docker unavailable)
dotnet test backend/SiesaAgents.sln

# Only Story 2.2 endpoint tests
dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ClienteByIdEndpointTests"

# ---- E2E (Playwright) ----
# Story 2.2 deep-link spec
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/clientes/clientes-deep-link.spec.ts --project=chromium

# Full CRUD spec (Story 2.1 + 2.2 combined)
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers pnpm exec playwright test e2e/tests/clientes/ --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- 36 new tests written and failing (15 component + 7 hook + 4 list-item migration + 3 integration + 7 E2E).
- Component + hook tests use MSW `setupServer` + fresh `QueryClient` per test — deterministic, isolated, no shared state.
- Integration tests use Testcontainers Postgres + `WebApplicationFactory<Program>` with the Docker-availability probe (Story 1.3 / 2.1 pattern).
- E2E tests seed via the REST API (`ApiHelper.createCliente`) and cleanup in `afterEach`. Test IDs come from the `<Link>`-migrated `<ClientListItem>` and the new `<ClienteDetailView>` / `<ClienteNotFound>` components.
- All selectors are `data-testid`; no CSS classes, no XPath, no text-only matching for interactive elements.
- Given-When-Then structure applied consistently. One behavioural assertion per test where practical (some tests bundle related expectations only when they describe a single behaviour — e.g. `href` + `text` for the back-link CTA).

### GREEN Phase (DEV — Next Steps)

Work top-to-bottom through the implementation checklist:

1. **Task 1 + 2 + 3 + 4 (BE domain / application / API / DI)** → unblocks the 3 integration tests.
2. **Task 6 (FE domain / infra `getById`)** → foundation for the hook tests.
3. **Task 7 (`useCliente` + `isClienteNotFound`)** → unblocks the 7 hook tests.
4. **Task 10 (`ClienteNotFound`)** + **Task 8 (`ClienteDetailView`)** → unblocks the 15 component tests.
5. **Task 9 (routes)** → unblocks the E2E deep-link scenarios.
6. **Task 11 (`ClientListItem` migration)** → unblocks the 4 migration tests + the deep-link highlight E2E case.

Run the filtered command after each task and check off the boxes in this checklist.

### REFACTOR Phase (DEV — After All Tests Pass)

- Extract the "not-found panel" pattern (`<ClienteNotFound>`) into a fully generic `<ResourceNotFound>` primitive once Epic 3 lands and `<ContactoDetailView>` needs the same shape — for now keep the Cliente-specific name (YAGNI).
- Consider co-locating the memory-router test harness helpers (`renderDetailView`, `renderInRouter`) into `frontend/src/test/lib/router.tsx` once a third component test needs them (currently used by two files — waiting for the rule-of-three).
- Ensure `useCliente` and `useClientes` invalidation semantics stay in sync with the future `useCreateCliente` / `useUpdateCliente` / `useDeleteCliente` hooks (Stories 2.3–2.5) — invalidate both `['clientes']` AND `['clientes', id]` on write mutations.

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure; deterministic MSW handlers; fresh QueryClient per test; one behavioural claim per test; no shared state across tests.
- **selector-resilience.md** — `data-testid` selectors exclusively; anchor `href` assertions instead of CSS-class fingerprinting where the semantic is URL-driven; `role`+`name` only in accessibility-focused assertions.
- **network-first.md** — MSW `server.use(...)` invoked BEFORE `render()` so intercepts are in place before the query runs; E2E uses `apiHelper.createCliente` BEFORE `page.goto`; console-error collector installed BEFORE `page.goto` in the not-found spec.
- **data-factories.md** — reused `makeCliente` (Story 2.1) with `overrides` pattern; deterministic IDs; ISO-8601 + offset timestamps.
- **fixture-architecture.md** — `renderDetailView` / `renderInRouter` helpers compose `QueryClientProvider` + `RouterProvider` around the SUT with automatic teardown via RTL `cleanup()`.
- **timing-debugging.md** — no `setTimeout` waits in tests; `waitFor` and `findBy*` for async DOM updates; `MSW request counter` for retry-count assertion (no artificial delay).
- **component-tdd.md** — RED-phase generation; component isolated behind a query provider + router provider; skeleton assertion via delayed MSW response.
- **test-healing-patterns.md** — MSW handlers count requests to prove `retry: false` on 404 (single hit) and retries on 500 (> 1 hit); no reliance on internal Axios spies.
- **test-levels-framework.md** — API integration for the backend contract, component + hook tests for the UI branching, E2E only for the deep-link URL wiring + AppShell chrome assertions. No duplicate coverage.

---

## Test Execution Evidence

### Initial RED Verification (deferred)

Not executed automatically by this workflow — the `sa-tea-atdd-run` sub-agent in the orchestration pipeline is responsible for running the suites and reporting the pass/fail counts. Expected RED counts:

- Vitest: 15 (`ClienteDetailView.test.tsx`) + 7 (`useCliente.test.tsx`) + 4 (`ClientListItem.test.tsx` new describe) = **26 new failing tests**.
- xUnit integration: 3 tests either fail (endpoint missing) or self-skip (Docker unavailable — expected in the sandbox).
- Playwright E2E: 7 tests either fail (routes / components missing) or are gated on the Chromium binary availability.

---

## Notes

- **Docker unavailable** in the sandbox → the 3 Testcontainers-based tests self-skip via `SkippableFact` + `IsDockerAvailable()` probe. Coverage of TC-E2-P1-12 is deferred to CI or a local dev machine with Docker.
- **Chromium binary** — Story 1.1 note #7 flagged the proxy 403 for browser download. E2E execution is left to the TEA `sa-tea-atdd-run` sub-agent in the pipeline; the specs themselves are ready.
- **Extending `ClientListItem.test.tsx`** — the Story 2.1 assertions for `onSelect` / `isSelected` will BECOME red once Task 11 removes those props. That is expected and correct — the story's Task 13 explicitly instructs the DEV to update those assertions during GREEN. The 4 new tests added here (Story 2.2 describe block) currently RED will drive the migration; the pre-existing assertions serve as the "delete-when-migrated" checklist.
- **`isClienteNotFound` export** — the tests import both `useCliente` and `isClienteNotFound` from the same module. If the DEV chooses to place the helper in a sibling file, the import path in `useCliente.test.tsx` and `ClienteDetailView.tsx` MUST both update — but co-locating both symbols in `useCliente.ts` is the story's mandated design (Task 7).
- **`renderDetailView` harness** — bypasses the `_app/clientes.$clienteId.tsx` route file by passing `clienteId` as a direct prop to `<ClienteDetailView>`. The route file itself is a thin `Route.useParams()` wrapper covered by the E2E deep-link spec. Duplicating router setup in component tests would only add flakiness without new coverage.
- **`onUnhandledRequest: 'error'`** on MSW ensures any missed handler surfaces as a test failure — no silent fallthroughs.
- **No hard waits**: every async check uses `waitFor` or `findByTestId`. The `retryDelay: 0` in the retry-count test is a QueryClient config knob, not a timing wait — it accelerates the retry loop without gating test flow.
- **Console-error collector in E2E**: installed BEFORE `page.goto` so no early errors are missed. Filters out the expected HTTP 404 log (that is the backend's designed response, not a JS bug) — remaining errors, if any, indicate a legitimate crash.

---

**Generated by BMad TEA Agent (sa-tea-atdd) — 2026-07-03**
