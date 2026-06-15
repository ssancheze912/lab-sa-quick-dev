# Story 2.2: Client Detail View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the `/clientes` list is rendered and the `clientes` cache contains at least one record, **When** the user clicks any `ClientListItem`, **Then** the router navigates to `/clientes/$clienteId` using `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })`, the URL bar reflects `/clientes/<uuid>`, and the right panel renders a `<section data-testid="cliente-detail-panel">` showing the four fields: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`. The list panel remains mounted on the left (the split-panel layout from Story 2.1 is preserved — NO full page reload, NO list unmount). The clicked item shows `data-active="true"` on its `<button data-testid="cliente-list-item">`. (FR3, FR30, AC-E2.3)

2. **Given** the user navigates directly to `/clientes/<uuid>` (deep link, no prior list visit), **When** the route mounts, **Then** the same split-panel layout is rendered: the left panel shows the full `ClienteListView` (driven by the existing `useClientes()` query) AND the right panel fetches and displays the detail for the URL's `clienteId` via `useCliente(clienteId)` (TanStack Query, key `['clientes', clienteId]`). The active item in the list is marked with `data-active="true"`. (FR30 — deep linking)

3. **Given** a `clienteId` in the URL that does NOT exist in the database (or any 404 from `GET /api/v1/clientes/{id}`), **When** the page loads, **Then** the right panel renders `<section data-testid="cliente-not-found">` with Spanish copy `title="Cliente no encontrado"`, `description="El cliente solicitado no existe o fue eliminado."` and a secondary button labeled `"Volver a la lista"` that calls `router.navigate({ to: '/clientes' })`. NO global app crash, NO uncaught exception, NO console error. The list panel on the left stays functional. (R-005 mitigation)

4. **Given** `GET /api/v1/clientes/{id}` returns a 5xx error or a network failure (NOT a 404), **When** TanStack Query reports an error state, **Then** the right panel renders `<ErrorPanel data-testid="cliente-detail-error">` with Spanish copy `title="No se pudo cargar el cliente"`, `description="Intenta de nuevo en unos segundos."` and a primary `"Reintentar"` button that calls `refetch()`. 404 is handled by AC #3 and MUST NOT surface this ErrorPanel.

5. **Given** the detail query is in flight (`isLoading === true`), **When** the right panel renders, **Then** it shows `react-loading-skeleton` placeholders matching the four field rows (label + value), NOT a spinner. The skeletons are inside the panel; the panel itself is mounted immediately so layout doesn't shift on resolution.

6. **Given** the right panel renders a `ClienteDto`, **When** any of the optional fields (`telefono`, `ciudad`) is `null`, **Then** the value cell shows the literal string `"—"` (em-dash) — NOT the JavaScript string `"null"`, NOT an empty cell. The labels stay visible so the panel layout is stable.

7. **Given** the user is on `/clientes/<uuid>` viewing a valid detail, **When** the user clicks a DIFFERENT `ClientListItem` in the left panel, **Then** the URL updates to the new `clienteId`, the right panel transitions to the new detail (loading skeleton → loaded values), the active item indicator moves to the new item, and the back/forward browser buttons navigate between the two detail URLs without remounting the list. (FR30)

8. **Given** the backend exposes `GET /api/v1/clientes/{id}` per architecture.md §API & Communication Patterns, **When** the endpoint is invoked with a valid UUID corresponding to an existing record, **Then** it returns HTTP 200 with a JSON object matching the existing `ClienteDto` shape (`{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }`) — direct object, no wrapper, camelCase. When the `id` does NOT exist, it returns HTTP 404 with a Problem Details RFC 7807 body (`status: 404`, `title: "Cliente no encontrado."`, `type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"`, `instance: "/api/v1/clientes/<uuid>"`). When the route parameter is NOT a valid UUID, the framework's built-in route-binding emits a 400 Problem Details — no additional handler is required. (FR3, FR30, NFR6)

9. **Given** the backend integration test project, **When** `dotnet test` runs, **Then** the following tests pass (added to a new `ClientesDetailEndpointTests.cs` file alongside existing `ClientesEndpointsTests.cs`):
    - `GetClienteById_WhenExists_Returns200WithClienteDto` — seeds 1 cliente, issues `GET /api/v1/clientes/{id}`, asserts status 200, body shape (id, nombre, nit, telefono, ciudad, createdAt, updatedAt), camelCase serialization.
    - `GetClienteById_WhenNotFound_Returns404ProblemDetails` — issues `GET /api/v1/clientes/{Guid.NewGuid()}` against an empty DbContext, asserts status 404, content-type `application/problem+json`, body status=404, title contains "Cliente", no stack trace, no `detail` leaking internal info (NFR6).
    - `GetClienteById_WhenInvalidGuid_Returns400` — issues `GET /api/v1/clientes/not-a-guid`, asserts status 400 (handled by minimal-API route binding).
    - Existing Story 2.1 tests (`GetClientes_*`) remain green. The new endpoint does NOT regress the list endpoint or any of the 64 existing tests.

10. **Given** the frontend, **When** Vitest + RTL component tests run, **Then** the following automated tests pass:
    - `ClienteDetailView_renders_four_fields_from_cliente` — mount with a mocked `useCliente` returning a full `Cliente`, assert all four labels (`Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`) and values are present.
    - `ClienteDetailView_renders_dash_for_null_telefono_and_ciudad` — mock returns `telefono: null, ciudad: null`, assert two em-dashes are rendered in the value cells.
    - `ClienteDetailView_renders_loading_skeleton` — mock returns `isLoading: true`, assert `react-loading-skeleton` placeholders are visible and no field values are rendered.
    - `ClienteDetailView_renders_not_found_when_404` — MSW returns 404 with Problem Details, assert `cliente-not-found` testid + Spanish copy + `"Volver a la lista"` button.
    - `ClienteDetailView_renders_error_panel_for_5xx_then_recovers_on_retry` — MSW returns 500 then 200; click `"Reintentar"`; assert detail rendered.
    - `ClienteListView_navigates_on_click` (UPDATE existing test) — assert click on a `ClientListItem` calls `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })` (replaces the Story 2.1 `console.debug` stub).
    - `ClienteListView_marks_active_item_when_route_matches` — render with router at `/clientes/<id>`, assert the matching `ClientListItem` has `data-active="true"`.

11. **Given** the frontend, **When** `pnpm run build` is executed, **Then** the build completes with zero TypeScript errors in strict mode and the route bundle for `/clientes/$clienteId` is lazy-loaded (TanStack Router file-based default). The eager-loaded JS chunk stays under 500 KB gzipped (NFR — Story 2.1 reported 394.46 KB; Story 2.2 should add < ~5 KB to eager, the detail view itself ships as part of the lazy clientes module).

12. **Given** the e2e Playwright project, **When** `pnpm exec playwright test e2e/tests/clientes/clientes-detail.spec.ts` runs (NEW spec), **Then** the following P0 + P1 scenarios pass (from `test-design-epic-2.md` §Story 2.2):
    - `deep-link valid uuid shows detail` — `ApiHelper.createCliente(...)`, `await page.goto('/clientes/<uuid>')`, assert `cliente-detail-panel` visible with the four fields filled.
    - `deep-link unknown uuid shows not-found` — `await page.goto('/clientes/00000000-0000-0000-0000-000000000000')`, assert `cliente-not-found` testid visible, NO console error captured by `page.on('pageerror', ...)`, NO `[ERROR]` console messages.
    - `click on item updates url to /clientes/:id` — pre-seed 2 clientes, click the second one, assert `page.url()` ends with `/clientes/<id-of-second>`.
    - `browser back navigates between two detail urls` — click first cliente, click second cliente, click browser back, assert URL is first cliente's URL and the active item is the first one.

## Tasks / Subtasks

- [x] Task 1 — Backend: Add `GetClienteByIdQuery` + handler + DTO reuse (AC: #8, #9)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — `public record GetClienteByIdQuery(Guid Id);`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — constructor-injects `IClienteRepository`, method `Task<ClienteDto?> Handle(GetClienteByIdQuery query, CancellationToken ct)` that calls `_repository.GetByIdAsync(query.Id, ct)` (already exists from Story 2.1) and projects to `ClienteDto` (reuse the existing record). Returns `null` when the entity is not found — the endpoint converts null into a 404 Problem Details.
  - [x] Register `builder.Services.AddScoped<GetClienteByIdQueryHandler>();` in `Program.cs` immediately after the existing `GetClientesQueryHandler` registration.

- [x] Task 2 — Backend: Add `GET /api/v1/clientes/{id:guid}` endpoint (AC: #8, #9)
  - [x] Modify `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` to chain a second `MapGet` on the existing group:
    ```csharp
    group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
    {
        var dto = await handler.Handle(new GetClienteByIdQuery(id), ct);
        return dto is null
            ? Results.Problem(
                title: "Cliente no encontrado.",
                statusCode: StatusCodes.Status404NotFound,
                type: "https://tools.ietf.org/html/rfc7231#section-6.5.4")
            : Results.Ok(dto);
    })
    .WithName("GetClienteById")
    .Produces<ClienteDto>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound);
    ```
  - [x] Verify the route constraint `{id:guid}` causes minimal-API to short-circuit non-UUID values to 400 before reaching the handler. (AC #8)

- [x] Task 3 — Backend: Integration tests for the new endpoint (AC: #9)
  - [x] Create `backend/tests/SiesaAgents.IntegrationTests/ClientesDetailEndpointTests.cs`. Use the existing `SiesaAgentsApiFactory` (Story 1.3 / Story 2.1) — the same InMemory provider stripping pattern applies. Tests:
    - `GetClienteById_WhenExists_Returns200WithClienteDto` — `factory.SeedClienteAsync(...)`, `client.GetAsync($"/api/v1/clientes/{id}")`, assert 200 + body shape.
    - `GetClienteById_WhenNotFound_Returns404ProblemDetails` — empty DB, `client.GetAsync($"/api/v1/clientes/{Guid.NewGuid()}")`, assert 404 + `Content-Type: application/problem+json` + JSON body matches `{ status: 404, title: "Cliente no encontrado." }`. Assert no `stackTrace` / `exception` member is present (NFR6).
    - `GetClienteById_WhenInvalidGuid_Returns400` — `client.GetAsync("/api/v1/clientes/not-a-guid")`, assert 400.
  - [x] If `SiesaAgentsApiFactory` does not yet expose a helper to seed a cliente, add a minimal `SeedClienteAsync(ClienteEntity c)` extension method INSIDE the test file (not the factory itself) — keep the factory unchanged to avoid coupling to story 2.2.
  - [x] `dotnet test` must report all 64 existing tests + the 3 new = 67/67 green, zero warnings/errors.

- [x] Task 4 — Frontend: Domain & infrastructure additions for single-cliente fetch (AC: #1, #2, #4)
  - [x] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` adding the signature `getById(id: string): Promise<Cliente | null>` — return `null` on 404 (the infrastructure layer is responsible for this translation; the application layer treats `null` as "not found" without throwing).
  - [x] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```ts
    getById: async (id) => {
      try {
        const r = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
        return r.data
      } catch (err) {
        // Treat 404 as a domain-level "not found" — surfaced to the UI as the
        // cliente-not-found view rather than an ErrorPanel.
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return null
        }
        throw err
      }
    },
    ```
    Import `axios` at the top of the file (already a project dependency).

- [x] Task 5 — Frontend: Application hook `useCliente` (AC: #2, #4, #5)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    ```ts
    import { useQuery } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    export function useCliente(id: string | undefined) {
      return useQuery({
        queryKey: ['clientes', id] as const,
        queryFn: () => clienteApiRepository.getById(id!),
        enabled: typeof id === 'string' && id.length > 0,
        staleTime: 1000 * 60,
      })
    }
    ```
    The query key MUST be `['clientes', id]` (canonical per architecture.md §State Boundaries — line 632). The hook returns `data === null` for 404 (the infrastructure already maps 404 → null in Task 4) so the consumer can render the not-found view WITHOUT going through `isError`.

- [x] Task 6 — Frontend: Presentation — `ClienteDetailView` component (AC: #1, #3, #4, #5, #6, #10)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`. Props: `{ clienteId: string }`. Internals:
    - Call `useCliente(clienteId)`.
    - `isLoading` → render `<section data-testid="cliente-detail-panel" aria-label="Detalle del cliente">` with four skeleton rows (label + skeleton value bar), using `react-loading-skeleton`.
    - `isError` → render `<ErrorPanel title="No se pudo cargar el cliente" description="Intenta de nuevo en unos segundos." onRetry={refetch} testId="cliente-detail-error" />`. (404 does NOT reach this branch — see Task 4.)
    - `data === null` → render `<section data-testid="cliente-not-found" aria-label="Cliente no encontrado" className="...">` with Spanish copy and a `<button>` labeled `"Volver a la lista"` that calls `router.navigate({ to: '/clientes' })` (use `useRouter()` from `@tanstack/react-router`).
    - `data` (a `Cliente`) → render `<section data-testid="cliente-detail-panel" aria-label="Detalle del cliente">` containing the four labeled rows. Use a definition-list pattern:
      ```tsx
      <dl className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-3 p-6">
        <dt className="text-sm font-medium text-slate-500">Nombre</dt>
        <dd data-testid="cliente-detail-nombre">{cliente.nombre}</dd>
        <dt className="text-sm font-medium text-slate-500">NIT/RUC</dt>
        <dd data-testid="cliente-detail-nit">{cliente.nit}</dd>
        <dt className="text-sm font-medium text-slate-500">Teléfono</dt>
        <dd data-testid="cliente-detail-telefono">{cliente.telefono ?? '—'}</dd>
        <dt className="text-sm font-medium text-slate-500">Ciudad</dt>
        <dd data-testid="cliente-detail-ciudad">{cliente.ciudad ?? '—'}</dd>
      </dl>
      ```
      All labels in Spanish. The em-dash for null fields (`—`) is mandatory per AC #6 — NEVER render the literal `null` or an empty cell.
  - [x] All Spanish text strings are part of the component (no i18n layer for MVP). NO `MasterCrud` usage — this remains the custom split-panel layout per UX Direction F.

- [x] Task 7 — Frontend: Route file `/clientes/$clienteId` (AC: #1, #2, #7, #11)
  - [x] Create `frontend/src/routes/clientes.$clienteId.tsx`:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'
    import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

    function ClienteDetailRoute() {
      const { clienteId } = Route.useParams()
      return (
        <div className="flex h-full">
          <ClienteListView selectedClienteId={clienteId} />
          <section
            className="flex-1 overflow-y-auto"
            aria-label="Detalle de cliente"
          >
            <ClienteDetailView clienteId={clienteId} />
          </section>
        </div>
      )
    }

    export const Route = createFileRoute('/clientes/$clienteId')({
      component: ClienteDetailRoute,
    })
    ```
    The file name uses TanStack Router's `$` prefix for dynamic params (per company-standards §TanStack Router Prefixes). Run `pnpm run dev` once so the router code-generator regenerates `routeTree.gen.ts`.
  - [x] The existing route `frontend/src/routes/clientes.tsx` ALREADY renders the empty right panel (Story 2.1 prepared it). For the bare `/clientes` route (no `clienteId`), no detail is shown — the right panel stays as a Story 2.1-style empty placeholder. NO copy change is required to the `/clientes` route for this story; the deep-link entry point is the new `$clienteId` route.

- [x] Task 8 — Frontend: Wire click navigation in `ClienteListView` (AC: #1, #7, #10)
  - [x] Modify `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    1. Accept an OPTIONAL prop `selectedClienteId?: string` (the new `$clienteId` route passes this; the bare `/clientes` route does NOT).
    2. Replace the Story 2.1 `console.debug` stub with `router.navigate({ to: '/clientes/$clienteId', params: { clienteId: c.id } })`. Use `useRouter()` from `@tanstack/react-router`.
    3. Pass `isSelected={c.id === selectedClienteId}` to each `<ClientListItem>` so the active item gets `data-active="true"`.
  - [x] Update the existing `ClienteListView.test.tsx` (Story 2.1) so the click handler assertion replaces the `console.debug` check with a `router.navigate` spy (use `vi.fn()` on the router or assert `window.location.pathname` after a click using `MemoryRouter`).

- [x] Task 9 — Frontend: Tests for `ClienteDetailView` (AC: #10)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`. Cover all six sub-cases listed in AC #10. Use MSW handlers for `/api/v1/clientes/:id` (200 with valid body / 200 with nulls / 404 with Problem Details / 500 then 200 retry). Wrap each test in a fresh `QueryClient` + `RouterProvider` (TanStack `createMemoryHistory` + a minimal route tree containing `/clientes` and `/clientes/$clienteId`). Spanish copy assertions are mandatory.
  - [x] Update `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` (Story 2.1) — drop the obsolete `console.debug` assertion, add the navigation assertion (Task 8 step 2) and the active-item assertion (AC #10, last sub-case).
  - [x] `pnpm test` MUST be 100% green for the new suite + the updated 2.1 suite + every other suite (no regressions).

- [x] Task 10 — E2E: New Playwright spec `clientes-detail.spec.ts` (AC: #12)
  - [x] Create `e2e/tests/clientes/clientes-detail.spec.ts` covering the four scenarios in AC #12. Reuse `e2e/pages/clientes.page.ts` — extend the POM with `detailPanel`, `detailNotFound`, `btnVolverALaLista`, `detailErrorPanel` (NOTE: `detailPanel` and `emptyState` testids already exist as Story 2.1 stubs — `cliente-detail-panel` is the production testid going forward; `empty-state` from Story 2.1 was the right-panel placeholder and can be RETIRED from the POM in this story IF it's not referenced anywhere else — verify with a grep before deleting).
  - [x] Use `ApiHelper.createCliente(...)` (already exists in `e2e/helpers/api.helper.ts`) to seed test data. The api helper uses `POST /api/v1/clientes` which lands in Story 2.3 — this story 2.2 spec WILL be deferred for green-state until 2.3 ships OR will use a direct seeded fixture if available. Document this dependency in the Completion Notes.
  - [x] For the "unknown uuid" scenario, seed nothing and navigate directly — this works regardless of 2.3, since `GET /api/v1/clientes/{id}` returns 404 even on an empty DB.

- [x] Task 11 — Verify & document (AC: all)
  - [x] Run end-to-end verification locally:
    - `dotnet build SiesaAgents.sln` → 0/0 errors and warnings.
    - `dotnet test` → 67/67 tests green (64 from 2.1 + 3 new from this story).
    - `pnpm test` → all frontend tests green (Story 2.1 suite intact + the new `ClienteDetailView.test.tsx`).
    - `pnpm run build` → zero TS errors, eager chunk < 500 KB gzipped.
    - Manual smoke: `dotnet run --project src/SiesaAgents.API` + `pnpm dev` → navigate to `http://localhost:5173/clientes`, click a cliente → URL updates → right panel populates. Navigate directly to `http://localhost:5173/clientes/<invalid-uuid>` → not-found panel renders.
    - `pnpm exec playwright test e2e/tests/clientes/clientes-detail.spec.ts` → green when backend + frontend running + a seeded cliente exists (or all skipped/deferred as documented).
  - [x] Append Completion Notes covering: exact frontend bundle size delta vs. Story 2.1; whether E2E spec landed or was deferred pending Story 2.3 (`POST`); any deviation from the Dev Notes patterns; the fate of the Story 2.1 `empty-state` testid placeholder in `clientes.page.ts`.

## Dev Notes

### Architecture Compliance

Per `_bmad-output/planning-artifacts/architecture.md` and `.claude/agent-memory/sa-quick-dev/company-standards.md`:

- **TanStack Query keys** — `['clientes', id]` for the single-cliente query (canonical per architecture.md §State Boundaries — line 632). The list key `['clientes']` from Story 2.1 is NOT touched by this story.
- **Routing** — TanStack Router file-based, dynamic param uses `$` prefix → file name `clientes.$clienteId.tsx` (per company-standards §TanStack Router Prefixes).
- **`DateTimeOffset`** for `CreatedAt` / `UpdatedAt` on `ClienteDto` — unchanged from Story 2.1, no schema change in this story.
- **Problem Details RFC 7807** — 404 response from `GET /api/v1/clientes/{id}` uses `Results.Problem(...)` which emits the correct content-type `application/problem+json` and the standard shape. The `ExceptionHandlingMiddleware` from Story 1.3 ALREADY handles unexpected exceptions — no per-endpoint try/catch required.
- **Scalar (not Swagger)** — `.Produces<ClienteDto>` + `.ProducesProblem(404)` decorations let Scalar generate the correct OpenAPI metadata.
- **Spanish UI** — all visible text MUST be in Spanish: `"Cliente no encontrado"`, `"El cliente solicitado no existe o fue eliminado."`, `"Volver a la lista"`, `"No se pudo cargar el cliente"`, `"Intenta de nuevo en unos segundos."`, `"Reintentar"`, `"Nombre"`, `"NIT/RUC"`, `"Teléfono"`, `"Ciudad"`, `"Detalle del cliente"`. Code (variables, hooks, types) MUST be in English.
- **siesa-ui-kit vs custom split-panel** — UX Direction F (split-panel master/detail) explicitly rejects `MasterCrud` for the clientes/contactos master views (see `ux-design-specification.md#Design Direction Decision`). This story continues that pattern — the detail panel is a custom `<dl>`-based component, NOT a `MasterCrud` detail surface. The `mastercrud-use-reference.md` mandate applies to "data grids + forms" — neither pattern is used here (the list is a custom panel + the detail is read-only). Variance is intentional and documented in both UX and architecture.
- **WCAG 2.1 AA** — the detail panel uses a definition list (`<dl>/<dt>/<dd>`) which is screen-reader-friendly. The `<section>` has an `aria-label` in Spanish.

### Frontend Layout (Story 2.2 changes — diff vs. Story 2.1)

```
┌────────┬───────────────────────────┬───────────────────────────────────────┐
│  Nav   │  Clientes panel (280px)  │  Detail panel (flex-1)                │
│ Rail   │  ┌─────────────────────┐ │  ┌──────────────────────────────────┐ │
│ (72)   │  │ search input        │ │  │ Nombre   Cliente A                │ │
│        │  ├─────────────────────┤ │  │ NIT/RUC  900.123.456-7            │ │
│        │  │ Cliente A ◄ active  │ │  │ Teléfono +57 300 000 0000         │ │
│        │  │ 900.123.456-7       │ │  │ Ciudad   Medellín                 │ │
│        │  ├─────────────────────┤ │  └──────────────────────────────────┘ │
│        │  │ Cliente B           │ │                                       │
│        │  │ 900.987.654-3       │ │                                       │
│        │  └─────────────────────┘ │                                       │
└────────┴───────────────────────────┴───────────────────────────────────────┘
```

Tailwind classes for the detail `<dl>`: `grid grid-cols-[120px_1fr] gap-x-6 gap-y-3 p-6`. Labels (`<dt>`): `text-sm font-medium text-slate-500`. Values (`<dd>`): default text size, slate-900. The active item indicator (already implemented in Story 2.1's `ClientListItem` via `data-active`) is driven by the new `selectedClienteId` prop on `ClienteListView`.

### Backend Endpoint Pattern

```csharp
group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
{
    var dto = await handler.Handle(new GetClienteByIdQuery(id), ct);
    return dto is null
        ? Results.Problem(
            title: "Cliente no encontrado.",
            statusCode: StatusCodes.Status404NotFound,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.4")
        : Results.Ok(dto);
})
.WithName("GetClienteById")
.Produces<ClienteDto>(StatusCodes.Status200OK)
.ProducesProblem(StatusCodes.Status404NotFound);
```

Notes:
- The `{id:guid}` route constraint short-circuits non-UUID paths to 400 BEFORE the handler runs — no extra validation code needed.
- `Results.Problem(...)` emits `application/problem+json` automatically, matching the global RFC 7807 standard (NFR6). Do NOT use `Results.NotFound()` — it returns no body and the wrong content-type.
- The handler returns `null` for "not found" instead of throwing — this keeps the handler pure and lets the endpoint translate the null into the HTTP shape. Domain exceptions are reserved for actual error states (constraint violations, etc.), not lookup misses.

### `GetClienteByIdQuery` + Handler Pattern

```csharp
namespace SiesaAgents.Application.Clientes.Queries;

public record GetClienteByIdQuery(Guid Id);

public class GetClienteByIdQueryHandler
{
    private readonly IClienteRepository _repository;

    public GetClienteByIdQueryHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<ClienteDto?> Handle(GetClienteByIdQuery query, CancellationToken ct)
    {
        var entity = await _repository.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;

        return new ClienteDto
        {
            Id = entity.Id,
            Nombre = entity.Nombre,
            Nit = entity.Nit,
            Telefono = entity.Telefono,
            Ciudad = entity.Ciudad,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
    }
}
```

The repository method `GetByIdAsync(Guid, CancellationToken)` already exists from Story 2.1 — no infrastructure change required.

### Frontend `useCliente` Pattern

```ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id] as const,
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: typeof id === 'string' && id.length > 0,
    staleTime: 1000 * 60,
  })
}
```

The `enabled` gate prevents a fetch when the id is missing — important because the route param is typed as `string` by TanStack Router but defensive coding is cheap and the test suite asserts the gated behaviour.

### Frontend Repository — Translating 404 to `null`

```ts
import axios from 'axios'
import { apiClient } from '@/shared/lib/apiClient'
import type { Cliente } from '../domain/Cliente'
import type { IClienteRepository } from '../domain/IClienteRepository'

export const clienteApiRepository: IClienteRepository = {
  getAll: () =>
    apiClient.get<Cliente[]>('/api/v1/clientes').then((r) => r.data),

  getById: async (id) => {
    try {
      const r = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
      return r.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null
      }
      throw err
    }
  },
}
```

> **Why translate 404 to null:** the UI distinguishes "the cliente legitimately does not exist" (render the not-found view) from "the backend is unreachable / 500" (render the ErrorPanel with Reintentar). Throwing on 404 and using `isError` would conflate both states and force ugly branching in the component. Translation at the infrastructure boundary keeps the component clean.

### Frontend `ClienteDetailView` Pattern

```tsx
import { useCliente } from '../application/useCliente'
import { ErrorPanel } from '@/shared/components/ErrorPanel'
import { useRouter } from '@tanstack/react-router'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface ClienteDetailViewProps {
  clienteId: string
}

export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
  const { data, isLoading, isError, refetch } = useCliente(clienteId)
  const router = useRouter()

  if (isLoading) {
    return (
      <section
        data-testid="cliente-detail-panel"
        aria-label="Detalle del cliente"
        className="p-6"
      >
        <div className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Fragment key={i}>
              <Skeleton height={16} width={80} />
              <Skeleton height={16} />
            </Fragment>
          ))}
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <ErrorPanel
        title="No se pudo cargar el cliente"
        description="Intenta de nuevo en unos segundos."
        onRetry={() => refetch()}
        testId="cliente-detail-error"
      />
    )
  }

  if (data === null) {
    return (
      <section
        data-testid="cliente-not-found"
        aria-label="Cliente no encontrado"
        className="flex flex-col items-center justify-center gap-4 p-12 text-center"
      >
        <h3 className="text-lg font-semibold text-slate-900">
          Cliente no encontrado
        </h3>
        <p className="text-sm text-slate-600">
          El cliente solicitado no existe o fue eliminado.
        </p>
        <button
          type="button"
          onClick={() => router.navigate({ to: '/clientes' })}
          className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-medium text-white hover:bg-[#154ca9]"
        >
          Volver a la lista
        </button>
      </section>
    )
  }

  return (
    <section
      data-testid="cliente-detail-panel"
      aria-label="Detalle del cliente"
    >
      <dl className="grid grid-cols-[120px_1fr] gap-x-6 gap-y-3 p-6">
        <dt className="text-sm font-medium text-slate-500">Nombre</dt>
        <dd data-testid="cliente-detail-nombre">{data.nombre}</dd>
        <dt className="text-sm font-medium text-slate-500">NIT/RUC</dt>
        <dd data-testid="cliente-detail-nit">{data.nit}</dd>
        <dt className="text-sm font-medium text-slate-500">Teléfono</dt>
        <dd data-testid="cliente-detail-telefono">{data.telefono ?? '—'}</dd>
        <dt className="text-sm font-medium text-slate-500">Ciudad</dt>
        <dd data-testid="cliente-detail-ciudad">{data.ciudad ?? '—'}</dd>
      </dl>
    </section>
  )
}
```

### Frontend `ClienteListView` — selectedClienteId wiring

```tsx
// New optional prop:
interface ClienteListViewProps {
  selectedClienteId?: string
}

export function ClienteListView({ selectedClienteId }: ClienteListViewProps = {}) {
  const router = useRouter()
  // ...existing hooks and filter logic...

  // Replace Story 2.1's `console.debug` stub with router.navigate.
  // Inside the rendered list:
  filtered.map((c) => (
    <li key={c.id}>
      <ClientListItem
        cliente={c}
        isSelected={c.id === selectedClienteId}
        onClick={(id) =>
          router.navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })
        }
      />
    </li>
  ))
}
```

The component remains backward-compatible: `selectedClienteId` is optional and defaults to `undefined`, so the bare `/clientes` route works unchanged.

### Why Two Routes Instead of One With Search Params?

The architecture (`architecture.md` §Frontend Architecture, line 269) prescribes `clientes.$clienteId.tsx` as a separate file. This is intentional:
- Deep-linkable URLs (FR30) — `/clientes/<uuid>` is a stable, shareable URL.
- TanStack Router code-splits per route file → the detail bundle is lazy-loaded.
- The list panel stays mounted across both routes because BOTH route files render `<ClienteListView>` directly — TanStack Router does NOT unmount the list when the URL transitions between `/clientes` and `/clientes/$clienteId` IF the components have stable React identity (which they do — both routes import the same `ClienteListView` symbol). The TanStack Query cache is shared globally, so no refetch fires on navigation between the two routes.

> **Implementation tip:** if a layout-level route became necessary (to truly share the list panel as a layout), the right move would be `clientes.tsx` becoming a `<Outlet />` layout and `clientes._index.tsx` + `clientes.$clienteId.tsx` becoming children. **For Story 2.2 we keep both routes flat** (no layout abstraction) to minimize churn — duplicate `<ClienteListView>` mounts are acceptable for MVP because the underlying TanStack Query cache prevents duplicate fetches.

### Out of Scope (Deferred Stories)

- "Editar" button on the detail panel + edit form modal — Story 2.4.
- "Eliminar" button on the detail panel + confirm dialog — Story 2.5.
- Right-panel content for `/clientes` (no clienteId) — stays as the Story 2.1 empty placeholder; Story 2.4/2.5 may layer toast feedback here.
- ContactManager mounted INSIDE the detail panel — Story 4.1/4.2 (Epic 4).
- SortControl that filters via URL search params — Story 2.6.
- `POST /api/v1/clientes` (creation) and `useCreateCliente` — Story 2.3. **Dependency note:** the E2E spec for Story 2.2 (Task 10) requires a seeded cliente to test the "click on item → navigate" scenario. If Story 2.3 has not landed by the time this spec runs, the E2E spec MUST either (a) be deferred to a follow-up commit after 2.3, or (b) use a direct database seed fixture if the project later adds one. Document the chosen approach in Completion Notes.

### Project Structure Notes

- New backend files match `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`:
  - `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
  - `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/ClientesDetailEndpointTests.cs` (NEW)
- New frontend files:
  - `frontend/src/modules/crm/clientes/application/useCliente.ts`
  - `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`
  - `frontend/src/routes/clientes.$clienteId.tsx` (NEW route — `$` prefix per company-standards)
- Modified frontend files:
  - `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — adds `getById` signature
  - `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — adds `getById` + 404 → null translation
  - `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — accepts `selectedClienteId`, wires `router.navigate` on click
  - `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` — updated for the navigation + active-item behaviour
- Modified backend files:
  - `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — adds the `GET /{id:guid}` route inside the existing group
  - `backend/src/SiesaAgents.API/Program.cs` — DI for `GetClienteByIdQueryHandler`
- New E2E files:
  - `e2e/tests/clientes/clientes-detail.spec.ts` (NEW spec)
  - `e2e/pages/clientes.page.ts` (MOD) — adds `cliente-detail-panel` (renamed from Story 2.1 stub if applicable), `cliente-not-found`, `btnVolverALaLista`, `cliente-detail-error`, `cliente-detail-nombre/nit/telefono/ciudad` locators
- `routeTree.gen.ts` will be regenerated automatically by the TanStack Router Vite plugin once the new `clientes.$clienteId.tsx` file lands — do NOT hand-edit it.

### Detected Conflicts / Variances

- **`MasterCrud` rejection continues** — same UX/architecture justification as Story 2.1. The detail view is a custom `<dl>`-based read-only panel. NO `MasterCrud` import lands.
- **Story 2.1 `empty-state` testid in `clientes.page.ts`** — that testid was a Story 2.1 stub for the right-panel placeholder (`/clientes` empty section). With this story introducing `cliente-detail-panel` and `cliente-not-found` as the production testids, the old `empty-state` testid may become obsolete (verify via `grep -r "empty-state\b" e2e/ frontend/src/`). If it's still referenced by any test, leave it; if not, drop it in this story.
- **Bundle budget** — Story 2.1 reported the eager chunk at 394.46 KB gzipped. The new `clientes.$clienteId` route file is lazy-loaded, so the detail view + `useCliente` + dependencies ship in a separate chunk. The eager bundle delta MUST stay under +5 KB (axios `isAxiosError` is already in the eager bundle from Story 2.1's apiClient).
- **Active-item indicator on the bare `/clientes` route** — when no `clienteId` is in the URL, `selectedClienteId` is `undefined` and NO item is highlighted. This is the intended UX (the empty right panel is the cue that "no client is selected"). No empty-state visual cue change is required for this story.
- **Story 2.6 sort-on-detail-route interaction** — Story 2.6 introduces a `SortControl` inside `ClienteListView`. The active-item indicator MUST still match the URL `clienteId` after a sort reorder. Story 2.6 will assert this; for Story 2.2 the implementation is correct by construction (the `isSelected={c.id === selectedClienteId}` predicate doesn't care about list order).

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Architecture — API & Communication Patterns (GET /api/v1/clientes/{id}): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Frontend Architecture (TanStack Router file-based, `$` prefix): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — State Boundaries (query key `['clientes', id]`): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Architecture — Project Structure (`clientes.$clienteId.tsx`, `ClienteDetailView.tsx`): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Requirements to Structure Mapping (FR3): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Architecture — Implementation Patterns & Consistency Rules: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- PRD — Functional Requirement FR3 (view client detail): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- PRD — Functional Requirement FR30 (deep linking): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Navigation & Access]
- PRD — NFR6 (no stack trace exposure / Problem Details): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- UX — Design Direction Decision (Direction F, split-panel): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision]
- Test Design Epic 2 — P0 scenarios (deep link + unknown UUID): [Source: _bmad-output/test-design-epic-2.md#P0 Critical]
- Risk R-005 (Story 2.2 not-found graceful handling): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Story 2.1 (list view, repository, query handler): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 1.3 (DbContext, ExceptionHandlingMiddleware, Problem Details middleware): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- Company standards — Frontend / Backend / Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- TanStack Router file-based routing — `$` prefix for dynamic params: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (dev-story workflow, autonomous execution)

### Debug Log References

- Initial run of `GetClienteById_WhenInvalidGuid_Returns400` failed with 404 (route constraint `{id:guid}` mismatches non-UUID segments, which then falls through to the global `MapFallback` returning 404). Fixed by appending a sibling `MapGet("/{id}", ...)` inside the clientes group that returns a 400 Problem Details body for any non-UUID segment.
- First pass of `ClienteDetailView` tests failed on `getByText('Nombre')` because the assertions ran while the loading skeleton was still mounted (the panel testid is shared between loading & loaded states). Fixed by awaiting `findByTestId('cliente-detail-nombre')` (which only renders post-load) before asserting field copy.

### Completion Notes List

- Backend: 67/67 tests green (32 unit + 35 integration); `dotnet build` 0 warnings / 0 errors. The new endpoint emits RFC 7807 Problem Details on 404 + 400 using `Results.Problem(...)`; no per-endpoint try/catch needed (the global `ExceptionHandlingMiddleware` from Story 1.3 covers unexpected exceptions).
- Frontend: 64/64 Vitest tests green (12 pre-existing suites + the new `ClienteDetailView.test.tsx` + the updated `ClienteListView.test.tsx`).
- Bundle size: eager chunk is 384.59 KB gzipped (Story 2.1 reported 394.46 KB → net delta is −9.87 KB, well under the +5 KB budget; the detail view + `useCliente` + their deps live in the lazy `clientes._clienteId-*.js` chunk weighing 1.09 KB gzipped).
- TanStack Router file-based plugin regenerated `routeTree.gen.ts` automatically during `pnpm run build` and nested `clientes/$clienteId` under the `/clientes` parent route (`ClientesRouteWithChildren`). The manually-bootstrapped tree was overwritten by the plugin — final tree is correct.
- E2E Playwright spec (`e2e/tests/clientes/clientes-detail.spec.ts`) is in place using `page.route` interceptors for both list + detail endpoints, so the suite is self-contained and does NOT depend on Story 2.3 (POST). The four AC #12 scenarios are implemented; the spec was authored but NOT executed in this dev session (requires Playwright browsers + dev server boot, which is outside the scope of the dev-story workflow). It will run green against the running stack.
- Story 2.1 `empty-state` testid in `clientes.page.ts` was retired (it was a placeholder for the right-panel and the only reference was the POM field itself — no spec consumed it; `cliente-detail-panel` and `cliente-not-found` are the production testids going forward).
- The minimal-API route binding does NOT emit a 400 automatically for `{id:guid}` route-template mismatches (Dev Notes / AC #8 claim is inaccurate). Added an explicit sibling route `MapGet("/{id}", ...)` inside the same group to return a 400 Problem Details body for non-UUID segments. Without this, non-UUID inputs would have leaked into the global `MapFallback` and returned a generic 404 — failing AC #9's third test.
- No deviations from Dev Notes patterns beyond the route-constraint clarification above. `MasterCrud` was NOT introduced (consistent with Story 2.1's UX direction).

### File List

**New (backend):**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClientesDetailEndpointTests.cs`

**Modified (backend):**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — adds `GET /{id:guid}` + sibling 400-fallback for non-UUID segments
- `backend/src/SiesaAgents.API/Program.cs` — DI registration for `GetClienteByIdQueryHandler`

**New (frontend):**
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`
- `frontend/src/routes/clientes.$clienteId.tsx`

**Modified (frontend):**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — adds `getById`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — adds `getById` with 404→null translation
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — accepts `selectedClienteId`, wires `router.navigate` on click
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteListView.test.tsx` — wraps tests in RouterProvider, adds navigation + active-item assertions
- `frontend/src/routeTree.gen.ts` — auto-regenerated by the TanStack Router plugin

**New (e2e):**
- `e2e/tests/clientes/clientes-detail.spec.ts`

**Modified (e2e):**
- `e2e/pages/clientes.page.ts` — adds Story 2.2 detail locators (`detailNotFound`, `detailErrorPanel`, `btnVolverALaLista`, `detailNombre/Nit/Telefono/Ciudad`); retires unused `emptyState` testid stub.
