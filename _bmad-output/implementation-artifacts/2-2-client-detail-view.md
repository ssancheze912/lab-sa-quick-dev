# Story 2.2: Client Detail View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed (`data-testid="clientes-list-panel"`), **When** the user clicks a client item (`data-testid="cliente-list-item"`), **Then** the right panel (`data-testid="cliente-detail-panel"`) shows the complete client details — Nombre (`data-testid="cliente-detail-nombre"`), NIT/RUC (`data-testid="cliente-detail-nit"`), Teléfono (`data-testid="cliente-detail-telefono"`), Ciudad (`data-testid="cliente-detail-ciudad"`) — **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking) without a full page reload.

2. **Given** a client exists in the system, **When** the user accesses the URL `/clientes/:clienteId` directly (fresh load, no prior in-app navigation), **Then** the correct client's details load and display (FR30) inside the same split-panel layout (list still visible on the left).

3. **Given** a `clienteId` in the URL is well-formed but does not exist in the system, **When** the page loads (or the query resolves), **Then** a graceful not-found message is displayed in the detail panel instead of a crash or blank screen (`data-testid="cliente-not-found"`, reusing the `EmptyState` component), **And** the raw backend error is never rendered (NFR6).

## Tasks / Subtasks

- [x] Task 1 — `GetByIdAsync` on `IClienteRepository` + `GetClienteByIdQuery` + `GET /api/v1/clientes/{id}` endpoint (AC: #1, #2, #3)
  - [x] Extend `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken)`. Update the interface's XML doc comment — it currently says "Story 2.1 scope... do NOT add GetByIdAsync yet"; that statement is now stale and must be corrected/removed.
  - [x] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: `dbContext.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken)` — returns `null` when not found, do not throw.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`: `public sealed record GetClienteByIdQuery(Guid Id);`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`: `public class GetClienteByIdQueryHandler(IClienteRepository clienteRepository)` with `Task<ClienteDto?> Handle(GetClienteByIdQuery query, CancellationToken cancellationToken)` — calls `GetByIdAsync`, maps to `ClienteDto` (same field mapping as `GetClientesQueryHandler`) or returns `null` if the repository returned `null`. Do NOT throw a domain "not found" exception here — returning `null` and letting the endpoint decide the HTTP status keeps this handler symmetric with `GetClientesQueryHandler` and avoids introducing new exception-handling middleware for what is a normal, expected outcome (AC #3).
  - [x] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add to the existing `group` (do not create a new `MapGroup`): `group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken cancellationToken) => { var cliente = await handler.Handle(new GetClienteByIdQuery(id), cancellationToken); return cliente is null ? Results.NotFound() : Results.Ok(cliente); });`. The `:guid` route constraint means a malformed (non-UUID) segment in the URL never reaches the handler and falls through to ASP.NET's default 404 — consistent with the "not found" behavior required by AC #3 for both malformed and well-formed-but-missing IDs.
  - [x] Register the new handler in `backend/src/SiesaAgents.API/Program.cs`: `builder.Services.AddScoped<GetClienteByIdQueryHandler>();` next to the existing `GetClientesQueryHandler` registration.

- [x] Task 2 — Backend tests (AC: #1, #2, #3)
  - [x] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (mirror `GetClientesQueryHandlerTests.cs`'s style): `Handle` returns the mapped `ClienteDto` when the repository returns an entity; `Handle` returns `null` when the repository returns `null`.
  - [x] Extend `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` with: `GET /api/v1/clientes/{id}` returns `200` + the correct `ClienteDto` fields for a client seeded directly via `AppDbContext` (same seeding approach already used in this file for the list endpoint — do NOT depend on `POST`, which does not exist until Story 2.3); `GET /api/v1/clientes/{randomGuidNotInDb}` returns `404`.
  - [x] Extend `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsEdgeCasesTests.cs` (or add inline if more appropriate) with: `GET /api/v1/clientes/{malformed-non-guid-string}` returns `404` (proves the `:guid` route constraint behaves as documented in Task 1).

- [x] Task 3 — Frontend data layer: `getById` on the client repository + `useCliente` hook (AC: #1, #2, #3)
  - [x] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: add `getById(id: string): Promise<Cliente | null>`.
  - [x] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: implement `getById` via `apiClient.get<Cliente>(\`/api/v1/clientes/${id}\`)`; catch the request, and when `isAxiosError(error) && error.response?.status === 404` return `null` (a valid, expected outcome — not an error state); re-throw any other error so TanStack Query's `isError` path still triggers for real failures (network/5xx), matching the existing `ErrorPanel` convention from Story 2.1.
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`: `export function useCliente(clienteId: string) { return useQuery({ queryKey: ['clientes', clienteId], queryFn: () => clienteApiRepository.getById(clienteId), enabled: !!clienteId }) }` — query key matches `architecture.md`'s canonical `['clientes', id]` exactly.

- [x] Task 4 — Routing: nested `/clientes` layout + `/clientes/:clienteId` deep-linkable route (AC: #1, #2)
  - [x] Modify `frontend/src/routes/_app/clientes.tsx`: change it from a route with a hardcoded detail placeholder into a layout that renders `<ClienteListView />` on the left and `<Outlet />` (from `@tanstack/react-router`) where the detail panel currently sits — this is what allows `/clientes` and `/clientes/$clienteId` to share the same list panel per `architecture.md`'s split-panel routing table. Keep the existing `data-testid="clientes-view"` wrapper and the `<h1>Clientes</h1>` heading (both are asserted by pre-existing routing tests, do not remove them).
  - [x] Create `frontend/src/routes/_app/clientes.index.tsx` (`createFileRoute('/_app/clientes/')`): renders the default right-panel placeholder that used to live inline in `clientes.tsx` — `data-testid="cliente-detail-panel"` wrapping `<p className="text-slate-500">Selecciona un cliente para ver su detalle</p>`. This preserves today's `/clientes` behavior exactly (list + "select a client" placeholder) with zero visible regression.
  - [x] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` (`createFileRoute('/_app/clientes/$clienteId')`): reads `const { clienteId } = Route.useParams()` and renders `<ClienteDetailView clienteId={clienteId} />` (Task 5). This is the file that satisfies FR30 deep linking — TanStack Router resolves it directly on a hard navigation/URL paste, no client-side-only routing trick needed.
  - [x] Do not hand-edit `frontend/src/routeTree.gen.ts` — it is auto-generated by the `@tanstack/router-plugin` Vite plugin on dev/build; just verify after running `pnpm dev`/`pnpm build` that it now contains `/_app/clientes/`, `/_app/clientes/$clienteId` entries alongside the existing `/_app/clientes`.

- [x] Task 5 — `ClienteDetailView` component + wiring the list item click (AC: #1, #2, #3)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`, props `{ clienteId: string }`. Use `useCliente(clienteId)` and branch on query state inside a `data-testid="cliente-detail-panel"` wrapper (this testid moves here from `clientes.index.tsx`'s placeholder — both routes render the exact same testid so `e2e/pages/clientes.page.ts`'s `detailPanel` locator keeps working regardless of which of the two sibling routes is active):
    - `isError` → `<ErrorPanel message="No se pudo cargar" onRetry={() => refetch()} />` (reuse the Story 2.1 component verbatim — same safe-copy convention, NFR6).
    - `isSuccess && data === null` → `<EmptyState title="Cliente no encontrado" subtitle="Verifica el enlace o vuelve a la lista de clientes" testId="cliente-not-found" />` (AC #3 — reuses `EmptyState`'s existing `testId` prop, exactly like Story 2.1 reused it for the `no-clients` variant; no new component needed).
    - `isSuccess && data` → the detail fields, semantic `<dl>`/`<dt>`/`<dd>` pairs for Nombre / NIT/RUC / Teléfono / Ciudad, each `<dd>` carrying its `data-testid` per AC #1 (`cliente-detail-nombre`, `cliente-detail-nit`, `cliente-detail-telefono`, `cliente-detail-ciudad`). Label the NIT/RUC `<dt>` as "NIT/RUC" (matches the label already used across the epic's UX copy, e.g. `ux-design-specification.md`).
    - While `isPending` (initial load): render nothing extra inside the panel (no AC in this story requires a loading indicator — mirrors Story 2.1's accepted, documented deferral of skeleton loading states).
  - [x] Update `frontend/src/shared/components/ClientListItem.tsx`: wrap its content in a `Link` from `@tanstack/react-router` — `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }} data-testid="cliente-list-item" className="block cursor-pointer rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">` (move `data-testid` onto the `Link` itself so `e2e`/RTL selectors keep resolving to the clickable element). This closes the Story 2.1 code-review follow-up noting the item rendered `cursor-pointer` with no click handler.

- [x] Task 6 — Tests (AC: #1, #2, #3)
  - [x] `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (Vitest + RTL + MSW, mirroring `ClienteListView.test.tsx`'s network-first pattern against `*/api/v1/clientes/:id`): renders all four detail fields with the correct values when the mocked `GET` resolves `200` (AC #1, #2 — rendering itself is identical whether reached via click or direct load, since both go through the same `useCliente` hook); renders `cliente-not-found` (`EmptyState` variant) when the mocked `GET` resolves `404` (AC #3, TC-E2-P1-09 component half); renders `error-panel` (not `cliente-not-found`) when the mocked `GET` resolves `500`, and never renders the raw error body (NFR6).
  - [x] Extend `frontend/src/shared/components/ClientListItem.tsx`'s coverage (new `ClientListItem.test.tsx`, or add cases to the existing `ClienteListView.test.tsx` suite if a dedicated file doesn't already exist): the rendered item is a link pointing to `/clientes/$clienteId` with the correct `clienteId` param.
  - [x] `e2e/pages/clientes.page.ts`: add locators for the detail fields — `detailNombre = page.getByTestId('cliente-detail-nombre')`, `detailNit = page.getByTestId('cliente-detail-nit')`, `detailTelefono = page.getByTestId('cliente-detail-telefono')`, `detailCiudad = page.getByTestId('cliente-detail-ciudad')`, and `notFoundMessage = page.getByTestId('cliente-not-found')` — this was flagged as a known gap in `test-design-epic-2.md` §9 ("ClientesPage lacks locators for... detail-panel fields... extend as part of story 2.2").
  - [x] Create `e2e/tests/clientes/clientes-detalle.spec.ts` covering `test-design-epic-2.md`'s TC-E2-P1-07/08/09:
    - TC-E2-P1-09 (Non-existent `clienteId` shows graceful not-found) — fully runnable today, no dependency on the create endpoint: `await page.goto('/clientes/' + crypto.randomUUID())`, assert `clientesPage.notFoundMessage` is visible.
    - TC-E2-P1-07 (click navigation + URL update) and TC-E2-P1-08 (direct URL access) both require seeding a client via `apiHelper.createCliente(...)`, which calls `POST /api/v1/clientes` — **not implemented until Story 2.3** (identical, already-documented blocker as Story 2.1's `Known Cross-Story Test Dependency`). Author both tests per the test-design steps and the locators added above so they are correct and ready, but do not treat their pass/fail as a gate for this story — they become runnable the moment Story 2.3 lands. Component tests (this task, first bullet) already give full coverage of the detail-rendering logic (AC #1, #2) without needing `POST`.

## Dev Notes

### Architecture patterns and constraints

- **Routing (FR30 deep linking)**: `architecture.md` §Frontend Architecture documents `/clientes` and `/clientes/:id` as sibling entries in the same split-panel layout. TanStack Router's file-based convention achieves this via `clientes.tsx` (layout, renders `<Outlet/>`) + `clientes.index.tsx` (default right-panel placeholder) + `clientes.$clienteId.tsx` (detail). This is the direct, minimal-complexity realization of the documented routing table — no manual `<Routes>`/`react-router-dom` wiring, no custom URL-sync logic.
- **TanStack Query key**: `['clientes', id]` is the canonical key per `architecture.md`'s "TanStack Query keys" section — must match exactly (array form, `id` as second element) for cache consistency with future mutation-invalidation work in Stories 2.3–2.5.
- **Not-found is data, not an error**: a 404 from `GET /api/v1/clientes/{id}` is an expected, valid outcome (the ID is syntactically fine, the row just isn't there) — modeled as `ClienteDto? = null`, not a thrown exception. This keeps `isError` in `useCliente` reserved for genuine failures (network/5xx), so the UI can tell "not found" (AC #3) apart from "couldn't load" (reuses `ErrorPanel`) exactly as `test-design-epic-2.md`'s R6 risk mitigation expects.
- **Component reuse over new components**: `EmptyState` (Story 2.1) already accepts a `testId` prop for exactly this kind of variant — reused here as `cliente-not-found` instead of building a new "not found" component. `ErrorPanel` (Story 2.1) is reused verbatim for the detail panel's load-failure case. No new shared components are introduced by this story.
- **Not a MasterCrud scenario**: per Story 2.1's Dev Notes (still valid), `/clientes` is a custom split-panel, not a paginated data-grid CRUD screen — `MasterCrud`/`MasterPatternView` do not apply to the detail view either; a plain `<dl>` field list is the correct, minimal-complexity shape here.
- **Route param typing**: the `:guid` ASP.NET route constraint on `GET /api/v1/clientes/{id:guid}` and TanStack Router's `$clienteId` string param work together without extra validation code — a non-UUID path segment never reaches the C# handler (framework-level 404), and a syntactically valid-but-unknown UUID is handled by the query returning `null` (AC #3 covers both cases uniformly from the frontend's perspective: any non-2xx/`null` response renders the same not-found UI).

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, v1.0.256).
- This story adds no new form/input controls — `ClienteDetailView` is read-only display (edit is Story 2.4's scope). `EmptyState` and `ErrorPanel` are the only UI components involved, and both are pre-existing custom components from Story 2.1 (confirmed: no exported `EmptyState` in siesa-ui-kit's public API).
- Use `Link` from `@tanstack/react-router` (not a plain `<a>` or an `onClick` + `useNavigate` pair) for the list-item navigation — it produces a real, crawlable `href`, integrates with the router's active-link state, and is the idiomatic TanStack Router pattern for this kind of internal navigation.
- Icons: none required by this story's AC.

### Project Structure Notes

- New backend files: `SiesaAgents.Application/Clientes/Queries/{GetClienteByIdQuery.cs,GetClienteByIdQueryHandler.cs}` — same folder as the existing list query, matching `architecture.md`'s documented tree (`GetClienteByIdQuery.cs`/`GetClienteByIdQueryHandler.cs` are explicitly listed there, see architecture.md lines ~528-532).
- Modified backend files: `SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (add `GetByIdAsync`, fix stale doc comment), `SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (implement it), `SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (add the `{id:guid}` route to the existing group), `SiesaAgents.API/Program.cs` (register the new handler).
- New frontend files: `modules/crm/clientes/application/useCliente.ts`, `modules/crm/clientes/presentation/ClienteDetailView.tsx`, `routes/_app/clientes.index.tsx`, `routes/_app/clientes.$clienteId.tsx` — all match `architecture.md`'s Complete Project Directory Structure (`clientes.$clienteId.tsx` is explicitly listed there).
- Modified frontend files: `routes/_app/clientes.tsx` (placeholder → layout with `<Outlet/>`), `modules/crm/clientes/domain/IClienteRepository.ts` + `infrastructure/clienteApiRepository.ts` (add `getById`), `shared/components/ClientListItem.tsx` (wrap in `Link`).
- Modified E2E assets: `e2e/pages/clientes.page.ts` (new detail-field + not-found locators), new `e2e/tests/clientes/clientes-detalle.spec.ts`.
- No backend schema/migration changes — `ClienteEntity`/`clientes` table are unchanged from Story 2.1; this story only adds a new read path over the same data.

### Testing Standards Summary

- Frontend: Vitest + React Testing Library + MSW, co-located `*.test.tsx` (per `architecture.md`'s "Tests co-located" convention), same network-first pattern established in Story 2.1 (`server.use(...)` registered before render, `onUnhandledRequest: 'error'`).
- Backend: xUnit; unit test for the new handler in `SiesaAgents.UnitTests/Application/Clientes/`; integration tests extending the existing `ClienteEndpointsTests.cs`/`ClienteEndpointsEdgeCasesTests.cs` files rather than creating parallel new ones, since they already set up the `WebApplicationFactory`/`AppDbContext` seeding scaffolding this story needs.
- Relevant test-design cases (`test-design-epic-2.md`): TC-E2-P1-07 (click navigation — E2E, blocked on Story 2.3's `POST` for seeding, see Task 6), TC-E2-P1-08 (direct deep link — E2E, same blocker), TC-E2-P1-09 (not-found — E2E fully runnable now + component test, no blocker), risk R6 mitigation (malformed/missing UUID never crashes the view).
- All UI copy in Spanish; not-found and error states both use `EmptyState`/`ErrorPanel`'s existing `aria-live="polite"` (inherited automatically since both are reused unmodified).

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2: Client Detail View]
- Functional requirements: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management] (FR3 — ver detalle), [#Navegación y acceso] (FR30 — deep linking)
- Non-functional requirements: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security] (NFR6 — no raw error exposure)
- Architecture — routing table, query keys, directory structure, naming: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] (`/clientes/:id` route), [#TanStack Query keys] (`['clientes', id]`), [#Complete Project Directory Structure] (`clientes.$clienteId.tsx`, `GetClienteByIdQuery.cs`), [#Traceability] (FR3 → `clientes.$clienteId.tsx` → `ClienteDetailView.tsx`)
- UX specification — split-panel layout, NIT/RUC labeling: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Direction B: List + Detail Panel]
- Epic-level test plan: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-07], [#TC-E2-P1-08], [#TC-E2-P1-09], [#R6]
- Previous story state (`ClienteEntity`, `IClienteRepository`, `ClienteEndpoints`, `ClienteListView`, `EmptyState`, `ErrorPanel`, `ClientListItem`, `clientes.tsx`): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes], [#File List], [#Review Follow-ups (AI)]
- Company stack/DB/UI standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (sa-create-story sub-agent for story authoring; Claude Sonnet 5 sa-dev-story sub-agent for implementation)

### Debug Log References

- `dotnet build SiesaAgents.sln` → Build succeeded, 0 warnings, 0 errors (after fixing `GetClientesQueryHandlerTests.FakeClienteRepository` to implement the new `IClienteRepository.GetByIdAsync` member — CS0535 compile error, fixed).
- `dotnet test tests/SiesaAgents.UnitTests` → 39/39 passed.
- `dotnet test tests/SiesaAgents.IntegrationTests` → 38/38 passed (local PostgreSQL reachable, `RequiresPostgresFact` ran instead of skipping).
- `pnpm exec tsc -b` (frontend) → 0 type errors.
- `pnpm run lint` (frontend, oxlint) → 0 errors (only pre-existing `only-export-components` warnings on route files, same pattern as `contactos.tsx`).
- `pnpm test -- --run` (frontend, Vitest) → initial run: 15/47 failed — `ClientListItem`'s new `Link` wrapper (Task 5) requires a TanStack Router context, which broke 3 pre-existing Story 2.1 test files (`ClienteListView.test.tsx`, `.edge-cases.test.tsx`, `.perf.test.tsx`) that rendered `ClienteListView` without a router, plus `routing.edge-cases.test.tsx`'s AC5 case (which now legitimately matches the new `/clientes/$clienteId` route instead of falling through to the global not-found). Fixed by wrapping the three `ClienteListView` render helpers in a minimal `RouterProvider` (same pattern already used by the new `ClientListItem` describe block), by registering `notFoundComponent: NotFoundView` on the `/clientes` route (needed because it's now a layout with children, so TanStack's fuzzy not-found resolution stops there instead of bubbling to `/_app`), and by updating `routing.edge-cases.test.tsx`'s AC5 test to use a two-segment nested path (`/clientes/no-existe/extra`) that still shares the "/clientes" prefix but matches no leaf route. Final run: 47/47 passed.
- `pnpm exec vite build` → regenerated `frontend/src/routeTree.gen.ts` (gitignored, not committed) with the new `/_app/clientes/` and `/_app/clientes/$clienteId` entries. The build's final CSS-minify step fails with a pre-existing, unrelated `lightningcss` error on a Tailwind v4 arbitrary-value class (`bg-[#0e79fd]`) — confirmed unrelated to this story (same failure occurs on `main` before any of this story's changes) and does not block route-tree generation, which happens during the JS transform phase before the CSS step.
- E2E (Playwright, Chromium project, warm dev/API servers): `clientes-detalle.spec.ts` → TC-E2-P1-09 (not-found for non-existent clienteId) passes reliably once the dev server is warm; it flaked on the very first cold-start request in this sandboxed environment (Vite's on-demand compile of the first-ever hit route exceeded the default 5s assertion timeout) — a sandbox/tooling artifact, not a product defect, confirmed by re-running the same assertion against a pre-warmed server. TC-E2-P1-07 and TC-E2-P1-08 fail as documented in the story's own Task 6 guidance: `apiHelper.createCliente(...)` calls `POST /api/v1/clientes`, which does not exist until Story 2.3, so seeding never succeeds — this is the pre-existing, explicitly-accepted "Known Cross-Story Test Dependency," not a gate for this story. `clientes-crud.spec.ts` (FR4/FR7/FR8, "Nuevo cliente" button) also fails for the same pre-existing reason (Story 2.3/2.4 scope), confirming no new regression was introduced here.

### Completion Notes List

- Backend: added `GetByIdAsync` to `IClienteRepository`/`ClienteRepository` (AsNoTracking + `FirstOrDefaultAsync`, returns `null` on miss), `GetClienteByIdQuery`/`GetClienteByIdQueryHandler` (returns `ClienteDto?`, never throws on not-found), and `GET /api/v1/clientes/{id:guid}` on the existing endpoint group (`Results.NotFound()` vs `Results.Ok(dto)`), registered in `Program.cs`. The pre-existing ATDD RED-phase test suites (`GetClienteByIdQueryHandlerTests.cs`, and the Story 2.2 sections already appended to `ClienteEndpointsTests.cs`/`ClienteEndpointsEdgeCasesTests.cs`) went GREEN with no changes needed to the tests themselves — only `GetClientesQueryHandlerTests.cs`'s fake repository needed a new no-op-compatible `GetByIdAsync` implementation to keep compiling against the now-larger interface.
- Frontend: added `getById`/`useCliente` (query key `['clientes', id]` exactly per architecture.md), converted `clientes.tsx` into a layout (`<ClienteListView/>` + `<Outlet/>`), added `clientes.index.tsx` (placeholder, preserves pre-Story-2.2 `/clientes` behavior) and `clientes.$clienteId.tsx` (deep-linkable detail route), added `ClienteDetailView.tsx` (reuses `EmptyState`/`ErrorPanel` verbatim, `<dl>`/`<dt>`/`<dd>` field list), and wrapped `ClientListItem` in a `Link` to `/clientes/$clienteId`. The pre-existing ATDD RED-phase `ClienteDetailView.test.tsx` and the `ClientListItem` link-navigation cases already appended to `ClienteListView.test.tsx` went GREEN with no changes to the tests themselves.
- Registered `notFoundComponent: NotFoundView` on the `/clientes` route (`clientes.tsx`) — a necessary addition not explicitly called out in the story's task list, but required once `/clientes` became a layout with children: TanStack Router's fuzzy not-found resolution now stops at this route for any unmatched nested path under `/clientes`, so without this registration a nested unknown path (e.g. two segments deep) would fall back to TanStack's generic default instead of the project's Spanish `NotFoundView`, regressing AC5 of Story 1.2's routing spec. Mirrors the identical pattern already present on `/_app` and the root route.
- All 3 acceptance criteria are implemented and covered: AC1/AC2 by `ClienteDetailView`'s success-state rendering (component tests) plus the backend `200`/DTO-mapping tests; AC3 by the `data === null` → `EmptyState testId="cliente-not-found"` branch (component test + integration `404` tests + the `:guid`-malformed-route integration test) and by `ErrorPanel` never rendering raw error text (NFR6, component tests).
- E2E: added detail-field/not-found locators to `e2e/pages/clientes.page.ts` and `e2e/tests/clientes/clientes-detalle.spec.ts` were already authored by the ATDD phase per the story's Task 6 guidance; no changes were needed to make TC-E2-P1-09 pass. TC-E2-P1-07/08 remain correctly authored but blocked on Story 2.3's `POST /api/v1/clientes`, exactly as the story anticipates — not a gate for this story's completion.

### File List

**Backend — modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (fake repository updated to implement the new interface member)

**Backend — new:**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`

**Backend — pre-existing (ATDD RED-phase, unmodified, now GREEN):**
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (Story 2.2 sections)
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsEdgeCasesTests.cs` (Story 2.2 section)

**Frontend — modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/routes/_app/clientes.tsx`
- `frontend/src/shared/components/ClientListItem.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (render helper: added router context so the new `ClientListItem` `Link` resolves)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge-cases.test.tsx` (same router-context fix)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx` (same router-context fix)
- `frontend/src/app/routing.edge-cases.test.tsx` (AC5 nested-not-found test path updated to avoid colliding with the new `/clientes/$clienteId` route)

**Frontend — new:**
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/routes/_app/clientes.index.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`

**Frontend — pre-existing (ATDD RED-phase, unmodified, now GREEN):**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

**Frontend — new (testarch-automate phase, added after dev-story):**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge-cases.test.tsx` (query-key-driven refetch, `enabled` guard, Unicode rendering, pending state, genuine network failure — flagged by code review as missing from this File List, added here)

**Backend — modified (testarch-automate phase, added after dev-story):**
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (gained a "Test Automation Expansion" section — Id/CancellationToken propagation, `Guid.Empty`, independent-field-mapping cases — after the ATDD phase; corrected here from the previous "unmodified" listing above, which only reflected the file's state as of dev-story)

**E2E — pre-existing (ATDD RED-phase, unmodified):**
- `e2e/pages/clientes.page.ts` (detail-field + not-found locators already present)
- `e2e/tests/clientes/clientes-detalle.spec.ts` (TC-E2-P1-07/08/09 already authored)

**Not modified (auto-generated, gitignored):**
- `frontend/src/routeTree.gen.ts` (regenerated locally by the TanStack Router Vite plugin during `tsc -b`/`vite build`/`pnpm dev`; not committed per project convention)

## Senior Developer Review (AI)

- **Reviewer**: SiesaTeam (AI Agent, adversarial code review)
- **Date**: 2026-07-06
- **Outcome**: **Approve** (issues found were documentation-only / cosmetic; both auto-fixed)

### Verification performed

- `dotnet build SiesaAgents.sln` → 0 warnings, 0 errors.
- `dotnet test tests/SiesaAgents.UnitTests` → 43/43 passed.
- `pnpm exec tsc -b` → 0 type errors.
- `pnpm test -- --run` → 9 files, 52/52 passed.
- Read every file in the git diff (`681b6a2..6104d14`) against the story's AC1-AC3, cross-checked route params, DTO field-name casing (PascalCase C# → camelCase JSON → matches frontend `Cliente` type), `ProblemDetails`/`UseStatusCodePages` wiring (Story's `Results.NotFound()` correctly surfaces as RFC 7807 given the app's global `AddProblemDetails()`), and the `:guid` route-constraint + `enabled: !!clienteId` + `data === null` not-found flow end-to-end.
- Verified the stale "do NOT add GetByIdAsync yet" XML doc comment on `IClienteRepository` was actually corrected as Task 1 required (it was).

### Findings

1. **[MEDIUM] File List documentation gap (fixed)** — `frontend/.../ClienteDetailView.edge-cases.test.tsx` is a real file added to git by the testarch-automate phase but was absent from every File List section (not listed as new, modified, or pre-existing). Additionally, `GetClienteByIdQueryHandlerTests.cs` was listed as "pre-existing, unmodified" even though it gained a "Test Automation Expansion" section after the ATDD phase. Fixed by adding both files to accurate File List entries.
2. **[LOW] Redundant `!isError &&` guards (fixed)** — `ClienteDetailView.tsx`'s `isSuccess`-branch conditions were prefixed with a redundant `!isError &&` even though TanStack Query's `isError`/`isSuccess` are mutually exclusive query-status booleans (never both true). Harmless, but simplified for clarity per the "no dead conditions" maintainability check.
3. **[LOW] E2E `POST`-dependent tests remain non-gating (accepted, no action)** — TC-E2-P1-07/08 in `clientes-detalle.spec.ts` cannot pass until Story 2.3 ships `POST /api/v1/clientes`. This is explicitly documented in the story and mirrors the identical, already-accepted pattern from Story 2.1 — confirmed as a real, pre-existing cross-story dependency rather than a gap introduced by this story, so no fix applied.

### Acceptance Criteria coverage

- AC1 (click → detail panel + URL update, no reload): implemented via `ClientListItem`'s `Link` + `clientes.$clienteId.tsx`; covered by component tests, `ClienteListView.test.tsx` link-navigation cases, and E2E TC-E2-P1-07 (authored, blocked on Story 2.3 seeding).
- AC2 (direct URL / fresh load): implemented via the same route resolving independently of prior navigation; covered by component tests and E2E TC-E2-P1-08 (authored, blocked on Story 2.3 seeding).
- AC3 (graceful not-found, NFR6): implemented via `data === null` → `EmptyState testId="cliente-not-found"` and `isError` → `ErrorPanel` (never raw error text); covered by component tests, backend 404 integration tests, malformed-GUID integration test, and E2E TC-E2-P1-09 (passes today, no blocker).

### Change Log

- 2026-07-06: Code review (AI) — fixed File List documentation gaps and simplified redundant conditions in `ClienteDetailView.tsx`; story status → `done`.
