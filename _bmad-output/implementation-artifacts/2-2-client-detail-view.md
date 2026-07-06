# Story 2.2: Client Detail View

Status: ready-for-dev

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

- [ ] Task 1 — `GetByIdAsync` on `IClienteRepository` + `GetClienteByIdQuery` + `GET /api/v1/clientes/{id}` endpoint (AC: #1, #2, #3)
  - [ ] Extend `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken)`. Update the interface's XML doc comment — it currently says "Story 2.1 scope... do NOT add GetByIdAsync yet"; that statement is now stale and must be corrected/removed.
  - [ ] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: `dbContext.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken)` — returns `null` when not found, do not throw.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`: `public sealed record GetClienteByIdQuery(Guid Id);`
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`: `public class GetClienteByIdQueryHandler(IClienteRepository clienteRepository)` with `Task<ClienteDto?> Handle(GetClienteByIdQuery query, CancellationToken cancellationToken)` — calls `GetByIdAsync`, maps to `ClienteDto` (same field mapping as `GetClientesQueryHandler`) or returns `null` if the repository returned `null`. Do NOT throw a domain "not found" exception here — returning `null` and letting the endpoint decide the HTTP status keeps this handler symmetric with `GetClientesQueryHandler` and avoids introducing new exception-handling middleware for what is a normal, expected outcome (AC #3).
  - [ ] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add to the existing `group` (do not create a new `MapGroup`): `group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken cancellationToken) => { var cliente = await handler.Handle(new GetClienteByIdQuery(id), cancellationToken); return cliente is null ? Results.NotFound() : Results.Ok(cliente); });`. The `:guid` route constraint means a malformed (non-UUID) segment in the URL never reaches the handler and falls through to ASP.NET's default 404 — consistent with the "not found" behavior required by AC #3 for both malformed and well-formed-but-missing IDs.
  - [ ] Register the new handler in `backend/src/SiesaAgents.API/Program.cs`: `builder.Services.AddScoped<GetClienteByIdQueryHandler>();` next to the existing `GetClientesQueryHandler` registration.

- [ ] Task 2 — Backend tests (AC: #1, #2, #3)
  - [ ] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (mirror `GetClientesQueryHandlerTests.cs`'s style): `Handle` returns the mapped `ClienteDto` when the repository returns an entity; `Handle` returns `null` when the repository returns `null`.
  - [ ] Extend `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` with: `GET /api/v1/clientes/{id}` returns `200` + the correct `ClienteDto` fields for a client seeded directly via `AppDbContext` (same seeding approach already used in this file for the list endpoint — do NOT depend on `POST`, which does not exist until Story 2.3); `GET /api/v1/clientes/{randomGuidNotInDb}` returns `404`.
  - [ ] Extend `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsEdgeCasesTests.cs` (or add inline if more appropriate) with: `GET /api/v1/clientes/{malformed-non-guid-string}` returns `404` (proves the `:guid` route constraint behaves as documented in Task 1).

- [ ] Task 3 — Frontend data layer: `getById` on the client repository + `useCliente` hook (AC: #1, #2, #3)
  - [ ] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: add `getById(id: string): Promise<Cliente | null>`.
  - [ ] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: implement `getById` via `apiClient.get<Cliente>(\`/api/v1/clientes/${id}\`)`; catch the request, and when `isAxiosError(error) && error.response?.status === 404` return `null` (a valid, expected outcome — not an error state); re-throw any other error so TanStack Query's `isError` path still triggers for real failures (network/5xx), matching the existing `ErrorPanel` convention from Story 2.1.
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`: `export function useCliente(clienteId: string) { return useQuery({ queryKey: ['clientes', clienteId], queryFn: () => clienteApiRepository.getById(clienteId), enabled: !!clienteId }) }` — query key matches `architecture.md`'s canonical `['clientes', id]` exactly.

- [ ] Task 4 — Routing: nested `/clientes` layout + `/clientes/:clienteId` deep-linkable route (AC: #1, #2)
  - [ ] Modify `frontend/src/routes/_app/clientes.tsx`: change it from a route with a hardcoded detail placeholder into a layout that renders `<ClienteListView />` on the left and `<Outlet />` (from `@tanstack/react-router`) where the detail panel currently sits — this is what allows `/clientes` and `/clientes/$clienteId` to share the same list panel per `architecture.md`'s split-panel routing table. Keep the existing `data-testid="clientes-view"` wrapper and the `<h1>Clientes</h1>` heading (both are asserted by pre-existing routing tests, do not remove them).
  - [ ] Create `frontend/src/routes/_app/clientes.index.tsx` (`createFileRoute('/_app/clientes/')`): renders the default right-panel placeholder that used to live inline in `clientes.tsx` — `data-testid="cliente-detail-panel"` wrapping `<p className="text-slate-500">Selecciona un cliente para ver su detalle</p>`. This preserves today's `/clientes` behavior exactly (list + "select a client" placeholder) with zero visible regression.
  - [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` (`createFileRoute('/_app/clientes/$clienteId')`): reads `const { clienteId } = Route.useParams()` and renders `<ClienteDetailView clienteId={clienteId} />` (Task 5). This is the file that satisfies FR30 deep linking — TanStack Router resolves it directly on a hard navigation/URL paste, no client-side-only routing trick needed.
  - [ ] Do not hand-edit `frontend/src/routeTree.gen.ts` — it is auto-generated by the `@tanstack/router-plugin` Vite plugin on dev/build; just verify after running `pnpm dev`/`pnpm build` that it now contains `/_app/clientes/`, `/_app/clientes/$clienteId` entries alongside the existing `/_app/clientes`.

- [ ] Task 5 — `ClienteDetailView` component + wiring the list item click (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`, props `{ clienteId: string }`. Use `useCliente(clienteId)` and branch on query state inside a `data-testid="cliente-detail-panel"` wrapper (this testid moves here from `clientes.index.tsx`'s placeholder — both routes render the exact same testid so `e2e/pages/clientes.page.ts`'s `detailPanel` locator keeps working regardless of which of the two sibling routes is active):
    - `isError` → `<ErrorPanel message="No se pudo cargar" onRetry={() => refetch()} />` (reuse the Story 2.1 component verbatim — same safe-copy convention, NFR6).
    - `isSuccess && data === null` → `<EmptyState title="Cliente no encontrado" subtitle="Verifica el enlace o vuelve a la lista de clientes" testId="cliente-not-found" />` (AC #3 — reuses `EmptyState`'s existing `testId` prop, exactly like Story 2.1 reused it for the `no-clients` variant; no new component needed).
    - `isSuccess && data` → the detail fields, semantic `<dl>`/`<dt>`/`<dd>` pairs for Nombre / NIT/RUC / Teléfono / Ciudad, each `<dd>` carrying its `data-testid` per AC #1 (`cliente-detail-nombre`, `cliente-detail-nit`, `cliente-detail-telefono`, `cliente-detail-ciudad`). Label the NIT/RUC `<dt>` as "NIT/RUC" (matches the label already used across the epic's UX copy, e.g. `ux-design-specification.md`).
    - While `isPending` (initial load): render nothing extra inside the panel (no AC in this story requires a loading indicator — mirrors Story 2.1's accepted, documented deferral of skeleton loading states).
  - [ ] Update `frontend/src/shared/components/ClientListItem.tsx`: wrap its content in a `Link` from `@tanstack/react-router` — `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }} data-testid="cliente-list-item" className="block cursor-pointer rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">` (move `data-testid` onto the `Link` itself so `e2e`/RTL selectors keep resolving to the clickable element). This closes the Story 2.1 code-review follow-up noting the item rendered `cursor-pointer` with no click handler.

- [ ] Task 6 — Tests (AC: #1, #2, #3)
  - [ ] `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (Vitest + RTL + MSW, mirroring `ClienteListView.test.tsx`'s network-first pattern against `*/api/v1/clientes/:id`): renders all four detail fields with the correct values when the mocked `GET` resolves `200` (AC #1, #2 — rendering itself is identical whether reached via click or direct load, since both go through the same `useCliente` hook); renders `cliente-not-found` (`EmptyState` variant) when the mocked `GET` resolves `404` (AC #3, TC-E2-P1-09 component half); renders `error-panel` (not `cliente-not-found`) when the mocked `GET` resolves `500`, and never renders the raw error body (NFR6).
  - [ ] Extend `frontend/src/shared/components/ClientListItem.tsx`'s coverage (new `ClientListItem.test.tsx`, or add cases to the existing `ClienteListView.test.tsx` suite if a dedicated file doesn't already exist): the rendered item is a link pointing to `/clientes/$clienteId` with the correct `clienteId` param.
  - [ ] `e2e/pages/clientes.page.ts`: add locators for the detail fields — `detailNombre = page.getByTestId('cliente-detail-nombre')`, `detailNit = page.getByTestId('cliente-detail-nit')`, `detailTelefono = page.getByTestId('cliente-detail-telefono')`, `detailCiudad = page.getByTestId('cliente-detail-ciudad')`, and `notFoundMessage = page.getByTestId('cliente-not-found')` — this was flagged as a known gap in `test-design-epic-2.md` §9 ("ClientesPage lacks locators for... detail-panel fields... extend as part of story 2.2").
  - [ ] Create `e2e/tests/clientes/clientes-detalle.spec.ts` covering `test-design-epic-2.md`'s TC-E2-P1-07/08/09:
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

Claude Sonnet 5 (sa-create-story sub-agent)

### Debug Log References

### Completion Notes List

### File List
