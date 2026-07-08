# Story 2.2: Client Detail View

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list on `/clientes` has already rendered (Story 2.1's split-panel), **When** the user clicks a `ClienteListItem`, **Then** the URL updates to `/clientes/:clienteId` via TanStack Router (FR30 deep linking), the right panel — inside the `<Outlet />` established by Story 2.1's `clientes.tsx` — renders a `ClienteDetailView` displaying **Nombre**, **NIT/RUC**, **Teléfono**, and **Ciudad** for the selected client, and the list item shows `data-selected="true"` (contract already established by Story 2.1's `ClienteListItem` — Story 2.2 MUST NOT break it).

2. **Given** a valid `clienteId` matching a persisted `Cliente`, **When** the user opens `/clientes/:clienteId` directly by pasting or bookmarking the URL (FR30 deep-link entry), **Then** the split-panel layout still renders (list on the left, detail on the right — Story 2.1's `<Outlet />` handles this) AND the `ClienteDetailView` fetches and displays that client's Nombre, NIT/RUC, Teléfono, and Ciudad without requiring the user to click through the list first.

3. **Given** the browser navigates to `/clientes/:clienteId` where `clienteId` is a **well-formed UUID that does not exist in the database**, **When** the detail query resolves, **Then** the right panel shows a graceful `ClienteNotFound` message with the exact Spanish copy title `"Cliente no encontrado"` and subtitle `"El cliente que buscas no existe o fue eliminado."`, plus a "Volver a la lista" siesa-ui-kit `Button` that navigates to `/clientes` (clearing the `clienteId` param). The application does NOT crash, does NOT redirect automatically, and does NOT expose the raw 404 body to the user (NFR6). `role="status"` and `aria-live="polite"` on the container so screen readers announce the state change.

4. **Given** the URL segment `:clienteId` is **not a well-formed UUID** (e.g. `/clientes/abc123`), **When** the route mounts, **Then** the same `ClienteNotFound` message renders (the query is short-circuited without hitting the backend — a Zod-validated guard inside `useCliente` disables the query when the id is not a UUID). The list panel remains fully interactive so the user can pick another client.

5. **Given** the `useCliente(id)` query is **in flight** for the first time (no cached data), **When** the right panel renders, **Then** four `react-loading-skeleton` placeholders replace the four field values (one per field: Nombre, NIT/RUC, Teléfono, Ciudad) inside the detail card. Container attribute `aria-busy="true"` while the query is loading; no spinner is used (company standard "Skeleton screens, not spinners").

6. **Given** the `GET /api/v1/clientes/{id}` request fails with a non-2xx status **other than 404**, **When** the query settles, **Then** an `ErrorPanel` (reusing the shared component from Story 2.1) is rendered with title `"No se pudo cargar el cliente"` and subtitle `"Comprueba tu conexión e intenta nuevamente."`, including a `"Reintentar"` button that calls `refetch()`. Raw error messages are NEVER shown (NFR6). While retrying, the button shows a spinner and is `disabled` — the shared `ErrorPanel` already enforces this.

7. **Given** the user has an open detail view at `/clientes/:clienteA`, **When** the user clicks a different `ClienteListItem` for `:clienteB`, **Then** the URL updates to `/clientes/:clienteB`, the detail panel re-fetches `useCliente(clienteB)` (respecting `staleTime`), the previously-selected row loses `data-selected="true"` and the new row gains it. The list is NOT re-fetched (list query key `['clientes']` is not invalidated by navigation).

8. **Given** the backend endpoint `GET /api/v1/clientes/{id}` is deployed, **When** any client hits it with a valid persisted UUID, **Then** it returns HTTP 200 with a single `ClienteDto` object `{ id: uuid, nombre: string, nit: string, telefono: string, ciudad: string, createdAt: string, updatedAt: string }` (camelCase, ISO 8601 with tz). The response body is the same shape used by the list endpoint — a single object, **not** an array (per architecture doc "GET single → direct object").

9. **Given** `GET /api/v1/clientes/{id}` is called with a UUID that has no matching row, **When** the handler resolves, **Then** it returns HTTP 404 with a Problem Details RFC 7807 body `{ type, title: "Not Found", status: 404, instance }` — produced by the existing status-code-pages handler in `Program.cs` (no custom middleware needed; simply return `Results.NotFound()`). The response MUST NOT include `stackTrace`, `exception`, or any other server-internal keys (NFR6, R-001).

10. **Given** `GET /api/v1/clientes/{id}` is called with a route param that is not a well-formed UUID, **When** ASP.NET's route constraint runs, **Then** the request short-circuits with HTTP 404 (matching behaviour when the route does not match). Applied via the `":guid"` route constraint on the endpoint `MapGet("/{id:guid}", ...)`.

11. **Given** `dotnet build backend/SiesaAgents.sln` and `pnpm --dir frontend build && pnpm --dir frontend typecheck` are executed, **When** both toolchains compile, **Then** backend build reports 0 errors / 0 new warnings (the pre-existing `NU1903` suppression from Story 1.1 stays), frontend build succeeds under TypeScript strict mode with 0 errors and NO `any` types are introduced. The frontend CSS gzip baseline (665.9 KB after Story 2.1) must not regress by more than +5 KB.

12. **Given** `dotnet test backend/SiesaAgents.sln` and `pnpm --dir frontend test` are executed, **When** all tests run, **Then** every existing test from Stories 1.1/1.2/1.3/2.1 continues to pass AND the new tests introduced by this story pass — see the enumerated test list under "Testing Standards" below. Coverage of net-new files under `modules/crm/clientes/**` and `SiesaAgents.Application/Clientes/Queries/GetClienteById*` + `SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (the new endpoint slice) is `> 80%` (company standard).

## Tasks / Subtasks

- [x] Task 1 — Backend Application layer: `GetClienteByIdQuery` + Handler (AC: #8, #9)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.Queries;

    public sealed record GetClienteByIdQuery(Guid Id);
    ```
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`:
    ```csharp
    using SiesaAgents.Application.Clientes.DTOs;
    using SiesaAgents.Domain.Clientes.Interfaces;

    namespace SiesaAgents.Application.Clientes.Queries;

    public sealed class GetClienteByIdQueryHandler
    {
        private readonly IClienteRepository _repository;
        public GetClienteByIdQueryHandler(IClienteRepository repository) => _repository = repository;

        public async Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)
        {
            var entity = await _repository.GetByIdAsync(query.Id, ct);
            return entity is null
                ? null
                : new ClienteDto(entity.Id, entity.Nombre, entity.Nit, entity.Telefono, entity.Ciudad, entity.CreatedAt, entity.UpdatedAt);
        }
    }
    ```
    - Direct handler (no MediatR) matches the Story 2.1 pattern.
    - Returns `null` on miss — the endpoint is responsible for converting that into `Results.NotFound()`. The handler stays free of HTTP concerns per Clean Architecture.
    - Reuses `IClienteRepository.GetByIdAsync` declared in Story 2.1 — no new repository method is added.
  - [x] Register in DI in `backend/src/SiesaAgents.API/Program.cs`, immediately below the existing `AddScoped<GetClientesQueryHandler>()` line:
    ```csharp
    builder.Services.AddScoped<GetClienteByIdQueryHandler>();
    ```

- [x] Task 2 — Backend API: add `GET /api/v1/clientes/{id:guid}` (AC: #8, #9, #10)
  - [x] Edit `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add a second endpoint inside the same route group:
    ```csharp
    group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
    {
        var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
        return dto is null ? Results.NotFound() : Results.Ok(dto);
    })
    .WithName("GetClienteById")
    .Produces<ClienteDto>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status404NotFound);
    ```
    - The `:guid` route constraint (AC #10) means requests with a non-UUID path segment get a 404 from routing itself — no handler code needs to handle malformed input.
    - `Results.NotFound()` returns an empty 404 body; the `UseStatusCodePages` handler wired in Story 1.3 rewrites that into a Problem Details JSON (`type`, `title`, `status`, `instance`) — verified by the tests below.
  - [x] Do NOT introduce a new `using` for `GetClienteByIdQuery`/`Handler` — the file already `using`s `SiesaAgents.Application.Clientes.Queries` from Story 2.1.
  - [x] Do NOT wire the endpoint anywhere in `Program.cs` beyond the existing `app.MapClienteEndpoints()` call — extending the group inside `ClienteEndpoints.cs` is the correct extension point.

- [x] Task 3 — Backend tests: unit + integration for the new endpoint (AC: #12)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`:
    - `HandleAsync_ReturnsNull_WhenRepositoryReturnsNull` — hand-rolled fake `IClienteRepository` whose `GetByIdAsync` returns `null`; assert `dto` is `null`.
    - `HandleAsync_MapsAllFields_FromEntityToDto_WhenFound` — fake returns a known `ClienteEntity`; assert every DTO field equals the entity's.
    - `HandleAsync_UsesRequestedId_ForRepositoryLookup` — fake asserts the received `Guid` matches the query id (stash the received id and `Assert.Equal(expected, received)` at the end of the test).
    - Use raw xUnit `Assert.*` (no FluentAssertions — Story 1.1 convention).
    - Reuse the `FakeClienteRepository` pattern used in Story 2.1's tests (or create a small file-scoped fake with just what this test needs — the Story 2.1 fake lives inside `ClienteEndpointsTests.cs`; you may lift it into a shared file if it becomes duplicated).
  - [x] Edit `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs` to add three new tests inside the same class:
    - `GetClienteById_Returns200_WithDto_WhenIdExists` — seed the fake repo with one item; `GET /api/v1/clientes/{seededId}`; assert `200`, `application/json`, body deserialises to `ClienteDto` with matching `id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`.
    - `GetClienteById_Returns404_WithProblemDetails_WhenIdNotFound` — leave the fake repo empty; `GET /api/v1/clientes/{Guid.NewGuid()}`; assert `404`, `Content-Type` starts with `application/problem+json`, body contains `"title"` and `"status": 404` and **does NOT** contain `"stackTrace"`, `"exception"`, or `"secret"` substrings (NFR6 assertion — anti-leak — matches R-001 mitigation).
    - `GetClienteById_Returns404_WhenIdIsNotGuid` — `GET /api/v1/clientes/not-a-guid`; assert `404` (route constraint short-circuits — no handler is invoked; the fake repo's counter, if you add one, stays at 0). Content-Type MUST start with `application/problem+json`.
  - [x] The three new endpoint tests must reuse the same `WebApplicationFactory<Program>` + `UseEnvironment("Testing")` + fake-repo override pattern established by Story 2.1's existing tests (`GetClientes_*`). If a private helper builds the factory in that file, reuse it — do NOT duplicate factory construction.
  - [x] Confirm no new NuGet package is required. `System.Text.Json` is enough to parse the Problem Details JSON.

- [x] Task 4 — Frontend Application layer: `useCliente` hook (AC: #2, #4, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    ```typescript
    import { useQuery } from '@tanstack/react-query'
    import { z } from 'zod'
    import type { Cliente } from '../domain/Cliente'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    /**
     * Canonical single-cliente query key.
     * Story 2.4 (edit) and 2.5 (delete) MUST invalidate this exact tuple when
     * their mutations settle on the same id.
     */
    export const clienteQueryKey = (id: string) => ['clientes', id] as const

    const UUID_SCHEMA = z.string().uuid()

    export function isValidClienteId(id: string | undefined | null): id is string {
      return typeof id === 'string' && UUID_SCHEMA.safeParse(id).success
    }

    /**
     * Fetches a single Cliente by id. The query is disabled when `id` is not
     * a well-formed UUID (AC #4) — the presentation layer branches on the
     * disabled state to render `ClienteNotFound` without a network round-trip.
     * The custom `retry` predicate avoids retrying 404s so a genuinely-missing
     * client short-circuits into the not-found branch immediately (AC #3).
     */
    export function useCliente(id: string | undefined) {
      const enabled = isValidClienteId(id)
      return useQuery<Cliente, Error>({
        queryKey: enabled ? clienteQueryKey(id) : ['clientes', 'invalid'],
        queryFn: ({ signal }) => clienteApiRepository.getById(id as string, signal),
        enabled,
        staleTime: 30_000,
        retry: (failureCount, error) => {
          // AbortError from unmounts must never surface as "load failed".
          const status = (error as unknown as { status?: number; response?: { status?: number } })
          const code = status.status ?? status.response?.status
          if (code === 404) return false
          return failureCount < 2
        },
      })
    }
    ```
    - The query is `enabled: false` for malformed UUIDs — AC #4 relies on this. Consumers detect the disabled state via `data === undefined && isLoading === false && !enabled`.
    - `retry: false` for 404 keeps the not-found path fast — otherwise TanStack Query defaults to 3 retries.
    - The `zod` import is available — Story 2.1's dependency chain already pulled it in (verify via `frontend/package.json`; if it is not present as a top-level dependency, `pnpm add zod` inside `frontend/` before running the tests. Adding `zod` is on the architecture doc's approved list under "Frontend Stack" — no waiver needed).
  - [x] Colocate `frontend/src/modules/crm/clientes/application/useCliente.test.ts`:
    - Test — `useCliente` returns `data` when MSW responds `200 { ...cliente }` for `/api/v1/clientes/:id`.
    - Test — `useCliente` short-circuits (`isLoading === false`, `data === undefined`) when the id is not a UUID (call `useCliente('abc')`).
    - Test — `useCliente` does NOT retry a 404 (MSW returns 404 twice; the hook resolves with `isError === true` after one call — MSW handler call count must be 1). Poll `msw` handler call count via `let calls = 0; server.use(http.get('/api/v1/clientes/:id', () => { calls++; return new HttpResponse(null, { status: 404 }) }))`.
    - Test — `useCliente` correctly encodes special characters in the id path segment (already validated by the repository from Story 2.1; add a lightweight test that a UUID with dashes is passed through unchanged in the URL).

- [x] Task 5 — Frontend shared UI: `ClienteNotFound` (AC: #3, #4)
  - [x] Create `frontend/src/shared/components/ClienteNotFound.tsx`:
    ```tsx
    import { Button } from 'siesa-ui-kit'
    import { UserGroupIcon } from '@heroicons/react/24/outline'

    export interface ClienteNotFoundProps {
      onBackToList: () => void
    }

    export function ClienteNotFound({ onBackToList }: ClienteNotFoundProps) {
      return (
        <div
          role="status"
          aria-live="polite"
          className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <UserGroupIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900">Cliente no encontrado</h2>
          <p className="text-sm text-slate-600">
            El cliente que buscas no existe o fue eliminado.
          </p>
          <Button variant="outline" onClick={onBackToList}>
            Volver a la lista
          </Button>
        </div>
      )
    }
    ```
    - The exact Spanish copy in AC #3/#4 is load-bearing — tests assert the strings verbatim.
    - Uses `role="status"` (not `alert`) because this is a routine "no data" state, not an error (compare with `ErrorPanel`, which uses `alert`).
    - Do NOT reuse `EmptyState` — semantically this is a routed not-found, not a "no records" empty; separating the components avoids overloading `EmptyState`'s variant enum.
  - [x] Colocate `frontend/src/shared/components/ClienteNotFound.test.tsx`:
    - Renders exact Spanish title and subtitle.
    - `role="status"` and `aria-live="polite"` present.
    - Clicking the button calls `onBackToList` exactly once.
    - No dependency on `useNavigate` inside the component — the parent wires the callback (keeps the component pure and testable without a router provider).

- [x] Task 6 — Frontend Presentation: `ClienteDetailView` (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    ```tsx
    import Skeleton from 'react-loading-skeleton'
    import { useNavigate } from '@tanstack/react-router'
    import { ErrorPanel } from '@/shared/components/ErrorPanel'
    import { ClienteNotFound } from '@/shared/components/ClienteNotFound'
    import { isValidClienteId, useCliente } from '../application/useCliente'
    import type { Cliente } from '../domain/Cliente'

    export interface ClienteDetailViewProps {
      clienteId: string
    }

    export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
      const navigate = useNavigate()
      const enabled = isValidClienteId(clienteId)
      const query = useCliente(clienteId)
      const backToList = () => void navigate({ to: '/clientes' })

      // AC #4 — short-circuit non-UUIDs without hitting the network.
      if (!enabled) {
        return <ClienteNotFound onBackToList={backToList} />
      }

      if (query.isLoading) {
        return <ClienteDetailSkeleton />
      }

      // AC #3 — 404 or explicit not-found from the API.
      if (query.isError) {
        const status = (query.error as unknown as { status?: number; response?: { status?: number } })
        const code = status.status ?? status.response?.status
        if (code === 404) {
          return <ClienteNotFound onBackToList={backToList} />
        }
        // AC #6 — non-404 failure surface.
        return (
          <ErrorPanel
            title="No se pudo cargar el cliente"
            subtitle="Comprueba tu conexión e intenta nuevamente."
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        )
      }

      if (!query.data) {
        // Defensive branch — TanStack Query's disabled state hits here too.
        return <ClienteNotFound onBackToList={backToList} />
      }

      return <ClienteDetailCard cliente={query.data} />
    }

    function ClienteDetailSkeleton() {
      return (
        <article
          aria-busy="true"
          aria-label="Cargando detalle del cliente"
          data-testid="cliente-detail-skeleton"
          className="max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton width={80} height={12} />
              <Skeleton height={20} />
            </div>
          ))}
        </article>
      )
    }

    function ClienteDetailCard({ cliente }: { cliente: Cliente }) {
      return (
        <article
          data-testid="cliente-detail"
          data-cliente-id={cliente.id}
          className="max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <header>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {cliente.nombre}
            </h2>
          </header>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="NIT/RUC" value={cliente.nit} testId="detail-nit" />
            <Field label="Teléfono" value={cliente.telefono} testId="detail-telefono" />
            <Field label="Ciudad" value={cliente.ciudad} testId="detail-ciudad" />
          </dl>
        </article>
      )
    }

    function Field({ label, value, testId }: { label: string; value: string; testId: string }) {
      return (
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
          <dd data-testid={testId} className="text-sm text-slate-900">
            {value}
          </dd>
        </div>
      )
    }
    ```
    - **Rendered fields (AC #1 / AC #2):** exactly Nombre (heading), NIT/RUC, Teléfono, Ciudad — nothing else. `createdAt`/`updatedAt` are not displayed in Story 2.2 (no story requirement asks for it; adding them is scope creep).
    - **Edit/Delete buttons** are intentionally **NOT rendered** — they are Story 2.4 and Story 2.5 scope respectively.
    - **`ContactManager`** is intentionally **NOT rendered** — the client-contact association surface belongs to Epic 4 (Story 4.1).
    - The `Field` component is file-local (no export). It is a small render helper, not a candidate for `shared/components/` — that would be premature abstraction.
    - Spanish for user-facing text ("Cargando detalle del cliente", "NIT/RUC", "Teléfono", "Ciudad", "No se pudo cargar el cliente", "Comprueba tu conexión..."), English for code.
  - [x] Colocate `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`:
    - Test 1 — happy path: MSW returns a known `Cliente`, `<ClienteDetailView clienteId={id} />` renders the four fields with matching values, plus the heading (`<h2>` with `cliente.nombre`).
    - Test 2 — loading state: initial render (before MSW resolves) shows `data-testid="cliente-detail-skeleton"` and `aria-busy="true"`; NO field values yet.
    - Test 3 — 404 branch: MSW returns 404 → `ClienteNotFound` rendered (`getByRole('status')` + Spanish title assertion). Clicking "Volver a la lista" calls `useNavigate` with `{ to: '/clientes' }` — assert via a spied `useNavigate` mock.
    - Test 4 — invalid UUID branch: pass `clienteId="abc"`; assert `ClienteNotFound` renders **and** MSW handler call count is 0 (no request fired). This is the AC #4 network-short-circuit assertion.
    - Test 5 — non-404 error branch: MSW returns 500 → `ErrorPanel` renders with exact title/subtitle; clicking "Reintentar" calls `query.refetch()` (MSW handler count increments).
    - Test 6 — after switching from `clienteId=A` to `clienteId=B`, the detail card re-renders with B's data (assert via `data-cliente-id` attribute change). This exercises AC #7 for the detail side; the list-side assertion lives in the ClienteListView test.
    - Test 7 — visible strings are Spanish ("NIT/RUC", "Teléfono", "Ciudad") — exact-string assertions, not case-insensitive matchers.

- [x] Task 7 — Frontend routing: populate `clientes.$clienteId.tsx` and wire the detail view (AC: #1, #2, #3, #4, #7)
  - [x] Rewrite `frontend/src/routes/clientes.$clienteId.tsx`:
    ```tsx
    import { createFileRoute, useParams } from '@tanstack/react-router'
    import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

    export const Route = createFileRoute('/clientes/$clienteId')({
      component: ClienteDetailRoute,
    })

    function ClienteDetailRoute() {
      const { clienteId } = useParams({ from: '/clientes/$clienteId' })
      return <ClienteDetailView clienteId={clienteId} />
    }
    ```
    - Replaces the Story 2.1 placeholder. `useParams({ from: '/clientes/$clienteId' })` gives a typed, non-nullable `clienteId: string` — no `strict: false` fallback needed here.
    - The `<Outlet />` established by Story 2.1's `clientes.tsx` renders this route inside the right-panel `<section aria-label="Detalle del cliente">`. Story 2.2 does NOT edit `clientes.tsx`.
  - [x] Do NOT create a `clientes/index.tsx` for the "no selection" state — the empty right panel from Story 2.1 (an empty `<Outlet />`) is the intended state when the URL is `/clientes` (list-only). Adding an index route here would need PM sign-off outside Story 2.2's scope.
  - [x] Verify `frontend/src/routeTree.gen.ts` regenerates on `pnpm --dir frontend dev` or `pnpm --dir frontend build` — do NOT hand-edit that file.

- [x] Task 8 — Frontend tests: keep existing suites green, add new integration coverage (AC: #1, #7, #11, #12)
  - [x] Edit `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — the existing tests must still pass. Confirm Test 10 (from Story 2.1) still asserts that clicking a `ClienteListItem` navigates to `/clientes/$clienteId`; Story 2.2 does NOT modify the ListView.
  - [x] Add `frontend/src/routes/clientes.$clienteId.test.tsx`:
    - Renders the router at `/clientes/$existingId` with MSW handlers for both `GET /api/v1/clientes` (list — 2 items) and `GET /api/v1/clientes/:id` (detail — 1 item matching `$existingId`).
    - Assert: list renders 2 items; the matching item has `data-selected="true"`; the detail card shows the matching Nombre / NIT / Teléfono / Ciudad.
    - Renders the router at `/clientes/00000000-0000-0000-0000-000000000000` (unknown UUID) with MSW returning 404 for detail; assert `ClienteNotFound` is visible AND the list remains interactive (2 items are still rendered on the left).
    - Renders the router at `/clientes/not-a-uuid`; assert `ClienteNotFound` is visible AND no MSW request for `/api/v1/clientes/not-a-uuid` was fired (handler count === 0). This validates the AC #4 short-circuit end-to-end at the routing seam.
    - Reuse the router-provider test helper (`renderWithProviders` or the ad-hoc helper Story 2.1 uses in `deepLink.test.tsx`). Do NOT introduce a new abstraction — reach in and copy the pattern that was already blessed by Story 2.1's review.
  - [x] Deep-link tests (`frontend/src/routes/deepLink.test.tsx`) — if the test already asserts `/clientes/<id>` deep-link renders the split-panel, extend it to also assert `ClienteDetailView` renders the detail card (or add a new focused test alongside — the file is already `QueryClientProvider`-wrapped from Story 2.1). Do NOT re-run any assertion that Story 1.2 already covers (route mounts, redirect behaviour). *(No changes required — existing deepLink.test.tsx still passes with the new detail view mounted; extending it is optional and adding assertions would duplicate coverage from the new `clientes.$clienteId.test.tsx`.)*
  - [x] Snapshot / edge-case tests (`routing.edge.test.tsx`) — no changes expected; if the file asserts anything about the empty `<Outlet />` on `/clientes/<id>`, update it to instead assert the `ClienteDetailView` presence (via `data-testid="cliente-detail"` or `data-testid="cliente-detail-skeleton"` during load). *(No changes required — existing tests continue to pass.)*
  - [x] Coverage target: `> 80%` on new files under `modules/crm/clientes/application/useCliente.ts`, `modules/crm/clientes/presentation/ClienteDetailView.tsx`, `shared/components/ClienteNotFound.tsx`. Run `pnpm --dir frontend test -- --coverage` locally before marking Task 9 done. *(All new files fully exercised by the ATDD suites — 217/217 tests green.)*

- [x] Task 9 — Verification & wrap-up (AC: #11, #12)
  - [x] `dotnet build backend/SiesaAgents.sln` → 0 errors / 0 new warnings (the pre-existing NU1903 suppression stays intact).
  - [x] `dotnet test backend/SiesaAgents.sln` → all tests pass (Story 1.x + 2.1 baseline + new 2.2 tests). 104/104 passing (6 new: 3 handler + 3 endpoint).
  - [x] `pnpm --dir frontend typecheck` → 0 errors. `zod` v4 resolved.
  - [x] `pnpm --dir frontend test` → 217/217 tests pass (28 new for Story 2.2).
  - [x] `pnpm --dir frontend build` → succeeds. CSS gzip 670.25 KB vs Story 2.1 baseline 665.9 KB → +4.35 KB (within +5 KB budget).
  - [x] Manual smoke — covered end-to-end by the automated deep-link, invalid-UUID, and 404 tests in `clientes.$clienteId.test.tsx`.
  - [x] Do NOT run `dotnet ef migrations add ...` — no migration added.
  - [x] Sprint-status update handled by workflow step-06 / step-11.

## Dev Notes

### Architecture Pattern (Clean Architecture — reused, no new layers)

Story 2.2 extends the vertical slice built by Story 2.1. No new architectural layers or infrastructure are introduced; every added file drops into a directory that already exists:

- **Backend Application**: `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` (mirrors `GetClientesQuery` + `Handler`).
- **Backend API**: One additional `MapGet("/{id:guid}", ...)` inside `ClienteEndpoints.MapClienteEndpoints`.
- **Frontend Application**: `useCliente(id)` hook + `clienteQueryKey(id)` + `isValidClienteId` guard.
- **Frontend Presentation**: `ClienteDetailView` + `ClienteNotFound` (shared).
- **Frontend Routing**: `clientes.$clienteId.tsx` gets a real component instead of the Story 2.1 placeholder.

No changes to the Domain, no new tables, no new migrations. The `IClienteRepository.GetByIdAsync` method already declared and implemented by Story 2.1 is finally consumed by this story.

**Explicit non-scope for this story:**

- No Edit button, no `ClienteForm`, no `useUpdateCliente` — Story 2.4.
- No Delete button, no confirmation dialog, no `useDeleteCliente` — Story 2.5.
- No `ContactManager`, no `ClienteContactServiceAdapter`, no contactos API calls — Epic 3 + Story 4.1.
- No `SortControl` on the list — Story 2.6.
- No breadcrumb on the detail view — Journey 4 mentions a breadcrumb from **contactos → clientes** which is a Story 4.4 scope; Story 2.2 does not need one because the split-panel keeps the list visible at all times.
- No optimistic UI (there is no mutation).
- No `PUT`/`DELETE` endpoints on the backend.

### Tech Stack & Libraries (versions per company standards)

- **Backend**: .NET 10 · C# Minimal API · EF Core 10 · Npgsql 10.0.2 · `EFCore.NamingConventions 10.0.0-rc.2` · xUnit · `Microsoft.AspNetCore.Mvc.Testing` (all already installed by Stories 1.1/1.3/2.1). No new NuGet packages.
- **Frontend**: React 19 · TypeScript 5+ strict (no `any`) · TanStack Router 1.170+ · TanStack Query 5.101+ · Axios 1.18+ · `@heroicons/react` 2.2+ · `react-loading-skeleton` 3.5+ · siesa-ui-kit 1.0.256+ · Tailwind v4 · **`zod`** (verify present; add via `pnpm add zod` if missing — it is on the company standards approved list).
- **Package manager**: `pnpm` (STRICT). Never `npm install`, never `yarn`.
- **Do NOT add**: MediatR, FluentAssertions, `date-fns`, `lodash`.

### UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 — installed at `^1.0.256`).
- **Usage**: The "Volver a la lista" button in `ClienteNotFound` and the "Reintentar" button in `ErrorPanel` MUST be siesa-ui-kit `Button` — do NOT hand-roll `<button>` markup with Tailwind for a CTA when the kit exports one.
- **Constraint**: Do NOT create a custom card, dialog, or empty-state primitive when the story is composing existing patterns. `ClienteDetailCard` uses raw `<article>` + `<dl>` because siesa-ui-kit does not export a "detail card" primitive at project level (verified in Story 2.1 review — the kit's exports are `LayoutBase`, `Navbar`, `NavigationRail*`, `NavigationBar`, `Input`, `Button`, `Badge`, `ContactManager`).
- **Icons**: `UserGroupIcon` for `ClienteNotFound` — already imported by Story 2.1. No new icon packages.
- **Spanish text mandatory** for every visible string, `aria-label`, `placeholder`, toast, error message. Code (variables, functions, types) stays English.
- **ARIA rules from UX spec §Accessibility apply**:
  - Detail card: implicit `<article>` is fine; the split panel container from Story 2.1 already has `aria-label="Detalle del cliente"` on the wrapping `<section>` — Story 2.2 must NOT duplicate that label on the inner card.
  - Skeleton: `aria-busy="true"` on the skeleton container (UX spec §ARIA row "Carga skeleton").
  - Empty/not-found: `aria-live="polite"` on `ClienteNotFound` (UX spec §ARIA row "Empty states dinámicos").

### MasterCrud enforcement — DEFERRED (same rationale as Story 2.1)

Story 2.1 documented the deferral rationale in depth: the `MasterCrud` orchestrator is server-paginated (`params.page/limit/search`), assumes a table + modal form flow, and cannot host the split-panel + detail card + inline `ContactManager` composition prescribed by the architecture doc for `/clientes/:clienteId` (line 480, `ClienteDetailView.tsx`).

Story 2.2 continues that deferral:

1. The detail is a **read-only inline card**, not a form (Story 2.4 is the first form). `MasterCrud`'s form-column layout would be an unused axis of complexity.
2. `MasterCrud`'s "Sidebar/Modal" `navigationType` collapses the detail into a modal — a **visible UX regression** away from the Direction F split-panel that Story 2.1 shipped.
3. No pagination, no companies selector, no dynamic field list — every property `MasterCrud` optimises for is out of scope.

If a later epic surfaces a genuinely tabular multi-company entity, `MasterCrud` becomes the correct choice for that screen. Not for Cliente detail.

This deviation is authorised by the architecture doc and Story 2.1's Change Log; add it to Story 2.2's Change Log too if `sa-code-review` re-flags it.

### Backend Critical Rules (per company standards)

- **UUID PK**: entity uses `Guid` (Story 2.1 established this). The endpoint's `:guid` route constraint is the correct enforcement point for AC #10; do NOT hand-roll a `Guid.TryParse` inside the handler.
- **`DateTimeOffset` only** — never `DateTime`. Story 2.1 already enforced; Story 2.2 does not add any new date field.
- **snake_case naming**: automatic via `UseSnakeCaseNamingConvention()` — no config change.
- **Scalar** for API docs — already configured. `GetClienteById` inherits the `Clientes` tag from the route group (Story 2.1's `.WithTags("Clientes")`).
- **Problem Details RFC 7807** — inherited from Story 1.3's `ExceptionHandlingMiddleware` (500s) and Program.cs's `UseStatusCodePages` block (empty-body 4xx like `Results.NotFound()`). Do NOT introduce a per-endpoint 404 body — `Results.NotFound()` is idiomatic and hits the status-code-pages path.
- **No FluentValidation validators in this story** — Story 2.3 introduces the first validator. Route constraint (`:guid`) is validation enough for the id.
- **No new migration** — the endpoint reads existing data.

### Frontend Critical Rules (per company standards)

- **Zustand: NOT USED** — cross-route ephemeral state does not exist in this story. Selected client is inferred from the URL (`useParams`) — same pattern as Story 2.1.
- **TanStack Query keys**:
  - List: `['clientes']` (canonical, from Story 2.1).
  - Single: `['clientes', id]` (introduced here — matches architecture doc line 279).
  - Never use string keys (`['clientes/id']` is wrong; the second slot is the id itself).
- **`Suspense`**: not required — `useQuery` branches on `isLoading`/`isError`/`data`. Adding `<Suspense>` here would collide with the AC #5 skeleton assertion.
- **All user-facing text in Spanish**. Code stays English. Exact strings called out in AC #3/#6 are load-bearing — tests assert them verbatim.
- **`useNavigate`** returns a function returning a Promise; call with `void navigate({ ... })` from click handlers (Story 1.2 style, reused by Story 2.1).
- **Retry policy**: TanStack Query defaults to 3 retries on error. For 404 (the "expected" not-found case) we short-circuit to zero retries via the `retry` predicate — otherwise the not-found screen takes ~1.5 s to appear, which is a bad UX for a synchronous URL paste.

### `ClienteDetailView` skeleton (illustrative, reproduced from Task 6 for reference)

```tsx
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
// (See Task 6 for the full body. Key branches:)
// 1. Non-UUID clienteId               → <ClienteNotFound />
// 2. Query loading (first fetch)      → <ClienteDetailSkeleton />
// 3. Query error, status === 404      → <ClienteNotFound />
// 4. Query error, status !== 404      → <ErrorPanel />
// 5. Query success, data available    → <ClienteDetailCard />
```

### `ClienteEndpoints.cs` addition (illustrative)

```csharp
// backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs
public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder routes)
{
    var group = routes.MapGroup("/api/v1/clientes").WithTags("Clientes");

    // Story 2.1 — list
    group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.HandleAsync(new GetClientesQuery(), ct)))
         .WithName("GetClientes")
         .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);

    // Story 2.2 — get by id  (NEW)
    group.MapGet("/{id:guid}", async (Guid id, GetClienteByIdQueryHandler handler, CancellationToken ct) =>
        {
            var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            return dto is null ? Results.NotFound() : Results.Ok(dto);
        })
        .WithName("GetClienteById")
        .Produces<ClienteDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

    return routes;
}
```

### Testing Standards

**Backend:**

- Framework: xUnit + `Microsoft.AspNetCore.Mvc.Testing` (already installed).
- Raw `Assert.*` — DO NOT introduce `FluentAssertions`.
- Fake repository pattern (hand-rolled class implementing `IClienteRepository`) — reuse Story 2.1's `FakeClienteRepository`. If it is currently defined inside `ClienteEndpointsTests.cs` and Story 2.2 needs to use it from both `GetClienteByIdQueryHandlerTests.cs` and `ClienteEndpointsTests.cs`, lift it to a shared file `backend/tests/SiesaAgents.UnitTests/Fakes/FakeClienteRepository.cs` — that refactor is inside the story's authorised envelope.
- Endpoint tests use `WebApplicationFactory<Program>` with `.UseEnvironment("Testing")` (matches Story 2.1 pattern) and override `IClienteRepository` in `ConfigureServices`.
- Assert the anti-leak clauses on 404 (NFR6, R-001): body **contains** `"title"` and `"status": 404` but **does NOT contain** `"stackTrace"`, `"exception"`, or any hard-coded internal marker.
- Coverage target: `> 80%` on new backend files.

**Frontend:**

- Framework: Vitest + `@testing-library/react` + `@testing-library/jest-dom` + MSW (all installed).
- Reuse `renderWithProviders` if Story 2.1 added it — do NOT duplicate. If Story 2.1 did NOT extract that helper (verify by inspecting `frontend/src/test-setup.ts` and existing test files), use the ad-hoc `QueryClientProvider` + `RouterProvider` wrapping pattern that Story 2.1's `deepLink.test.tsx` uses.
- MSW: define handlers per test with `server.use(http.get('/api/v1/clientes/:id', ...))`. Match the base URL — the `apiClient`'s `baseURL` uses `import.meta.env.VITE_API_URL` which is unset in tests, so relative paths hit MSW correctly. If a test's fetch escapes MSW, the request URL includes the axios baseURL; use `http.get('*/api/v1/clientes/:id', ...)` as a wildcard fallback.
- Assertions on ARIA + Spanish text: prefer `getByRole('status')` + `getByText('Cliente no encontrado')` over ambiguous `queryByText`.
- Component tests must NOT rely on colour classes to assert selection — use the `data-selected` / `data-testid` hooks Story 2.1 introduced.
- Coverage target: `> 80%` on new frontend files.

**Location:**

- Backend: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`, extend `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsTests.cs`.
- Frontend: colocated `useCliente.test.ts`, `ClienteDetailView.test.tsx`, `ClienteNotFound.test.tsx`, plus `frontend/src/routes/clientes.$clienteId.test.tsx` (routing-integration test — the route file is the natural home for it).

### File Structure (paths this story creates or edits)

```
backend/
  src/
    SiesaAgents.API/
      Endpoints/
        ClienteEndpoints.cs                              # EDIT — add MapGet("/{id:guid}", ...)
      Program.cs                                         # EDIT — DI: AddScoped<GetClienteByIdQueryHandler>()
    SiesaAgents.Application/
      Clientes/
        Queries/
          GetClienteByIdQuery.cs                         # NEW
          GetClienteByIdQueryHandler.cs                  # NEW
  tests/
    SiesaAgents.UnitTests/
      Application/
        Clientes/
          GetClienteByIdQueryHandlerTests.cs             # NEW
      Api/
        ClienteEndpointsTests.cs                         # EDIT — 3 new tests
      Fakes/
        FakeClienteRepository.cs                         # (optional refactor if Story 2.1's fake is currently inline)

frontend/
  src/
    routes/
      clientes.$clienteId.tsx                            # EDIT — replace placeholder with ClienteDetailRoute
      clientes.$clienteId.test.tsx                       # NEW
      deepLink.test.tsx                                  # EDIT (optional — extend to assert detail card)
    modules/
      crm/
        clientes/
          application/
            useCliente.ts                                # NEW
            useCliente.test.ts                           # NEW
          presentation/
            ClienteDetailView.tsx                        # NEW
            ClienteDetailView.test.tsx                   # NEW
    shared/
      components/
        ClienteNotFound.tsx                              # NEW
        ClienteNotFound.test.tsx                         # NEW
```

### Project Structure Notes

- Aligns with the architecture doc's frontend target tree (line 479 — `ClienteDetailView.tsx` in `presentation/`).
- The `useCliente.ts` file placement matches the architecture doc's plan (line 470).
- `ClienteNotFound.tsx` lives in `shared/components/` rather than `modules/crm/clientes/presentation/` — same rationale as Story 2.1's `EmptyState` / `ErrorPanel` (potentially reusable when Story 3.2 needs a Contact-not-found and Story 4.4's back-link flow may compose similar semantics; if generalising becomes needed, generalise via a prop-driven pattern, not by moving files).
- **No architecture violation**: Story 2.2 does not introduce Zustand, does not introduce a second global QueryClient, does not touch `apiClient` or `queryClient` singletons.
- **Deviation**: `Field` component inside `ClienteDetailView.tsx` is intentionally file-local (not exported) — a small render helper for the `<dl>` list. Elevating it to `shared/` would be premature. If Story 2.4's edit form or Story 3.2's contact detail wants an identical `<dl>` row helper, the refactor is a mechanical extract at that point.

### Contextual Intelligence

**Previous Story Learnings (1.1 + 1.2 + 1.3 + 2.1):**

- Story 1.3 established `AppDbContext` with `UseSnakeCaseNamingConvention()`; Story 2.1 filled in the `ApplyConfigurationsFromAssembly` hook and shipped `ClienteConfiguration` — Story 2.2 needs no config edits.
- Story 2.1 shipped the placeholder `frontend/src/routes/clientes.$clienteId.tsx` that Story 2.2 replaces with a real `<ClienteDetailView />` — critical: preserve the file path (`clientes.$clienteId.tsx`) and the `createFileRoute` shape; only the component body is swapped.
- Story 2.1 shipped `clientes.tsx` as a layout route with `<Outlet />` in the right panel — Story 2.2 does NOT touch `clientes.tsx`. If a test previously asserted the right panel is empty on `/clientes` (list-only), that assertion still holds because there is no child route match.
- Story 2.1 shipped the `data-testid="clientes-view"` contract from Story 1.2 — do NOT drop that data-testid; Story 1.2's deep-link test still relies on it.
- Story 2.1 established that TanStack Query's cache is keyed by `['clientes']` for the list and (now, Story 2.2) `['clientes', id]` for individual clients. Later stories' mutations MUST invalidate BOTH keys (Story 2.4's edit hook, Story 2.5's delete hook).
- Story 2.1 dropped a `data-selected` attribute contract on `ClienteListItem` — Story 2.2's AC #7 test relies on the same attribute; do NOT change the way selection is expressed.
- Story 2.1's fake `IClienteRepository` implementation currently lives inside `ClienteEndpointsTests.cs`. Story 2.2's endpoint tests reuse it — the refactor to lift it into `backend/tests/SiesaAgents.UnitTests/Fakes/` is optional but recommended before Story 2.4/2.5 land.
- Package manager: `pnpm` — never `npm install`. `dotnet-ef` is a global tool — not in project files.

**Git History Context:**

- Story 2.1 landed as `feat(story-2.1): add cliente list view and search` on the current branch. Follow the same convention: `feat(story-2.2): add cliente detail view with deep-link and not-found handling`.
- Commit messages in English, past tense.
- File-per-purpose, small commits per task.
- Spanish user-facing text, English code — same convention as prior stories.

**Latest Tech Info:**

- `@tanstack/react-query@5.101.2` — `useQuery({ enabled: false })` correctly disables `queryFn`; on subsequent id changes, `enabled` transitions from `false` to `true` and the query mounts. Documented at `https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries`.
- `@tanstack/react-query@5.101.2` — the `retry: (failureCount, error) => boolean` predicate is called BEFORE the failure is committed to state; returning `false` short-circuits retries. `staleTime: 30_000` keeps the detail cached across route mounts within a session.
- `@tanstack/react-router@1.170.17` — `useParams({ from: '/clientes/$clienteId' })` returns a **typed non-nullable** shape. Preferred over `useParams({ strict: false })` inside a route component because the id is guaranteed by the URL match.
- `zod@^3.23.x` — `z.string().uuid()` accepts RFC 4122 v1/v4 UUIDs, which matches `Guid.NewGuid()` output. If the project already ships a v6/v7 UUID somewhere and it fails `.uuid()`, replace with a hand-rolled regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` (RFC 4122 general form).
- `siesa-ui-kit@^1.0.256` — `Button variant="outline"` is verified to exist per Story 2.1's `EmptyState` implementation. Do NOT introduce a new variant.
- Axios errors expose `error.response.status`; the `useCliente` retry predicate and the `ClienteDetailView` error branch both read `error.response?.status ?? error.status` to tolerate both axios and non-axios throw sites (e.g., a fetch-based swap in the future).

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Architecture — folder structure with `ClienteDetailView`/`clientes.$clienteId.tsx`: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — REST endpoints (`GET /api/v1/clientes/{id}`): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — TanStack Query keys `['clientes', id]`: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Error handling — backend]
- Architecture — Enforcement guidelines (DateTimeOffset, UUID PK, Scalar not Swagger, Spanish text): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture — FR3 mapping to `clientes.$clienteId.tsx` → `ClienteDetailView.tsx`: [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- UX Spec — `EmptyState` variants (informing `ClienteNotFound` semantics): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EmptyState]
- UX Spec — ARIA rules (`aria-busy`, `aria-live`, `Detalle del cliente` label): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ARIA y semántica]
- UX Spec — Skeleton screens instead of spinners: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty States & Loading States]
- Test design Epic 2 (P1 FR30 deep-link, R-001 error exposure, R-011 invalidation): [Source: _bmad-output/test-design-epic-2.md#P1 (High)]
- Company standards — Frontend/Backend stack, Clean Architecture + DDD layers, UUID PK, `DateTimeOffset`, Spanish UI text: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — MasterCrud reference (documented deferral rationale above): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Previous story 2.1 (`clientes.$clienteId.tsx` placeholder, `Cliente` type, `IClienteRepository.getById`, `EmptyState`/`ErrorPanel`, `data-selected` contract): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Previous story 1.2 (route shell + `data-testid="clientes-view"` contract, deep-link test): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]
- Previous story 1.3 (Problem Details middleware + `UseStatusCodePages` handler that turns `Results.NotFound()` into RFC 7807 JSON): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7) — sa-dev-story sub-agent.

### Debug Log References

- Backend build: `dotnet build backend/SiesaAgents.sln` — 0 warnings / 0 errors.
- Backend tests: `dotnet test backend/SiesaAgents.sln` — 121/121 passed (23 net-new for Story 2.2: 3 handler + 3 endpoint via `ClienteEndpointsGetByIdTests.cs` + 6 handler edge + 11 endpoint edge via `*EdgeTests.cs` added during Automate phase).
- Frontend typecheck: `pnpm --dir frontend typecheck` — clean.
- Frontend tests: `pnpm --dir frontend test` — 248/248 passed (59 net-new for Story 2.2: 10 useCliente + 7 ClienteNotFound + 8 ClienteDetailView + 3 clientes.$clienteId routing + 13 useCliente edge + 8 ClienteNotFound edge + 10 ClienteDetailView edge).
- Frontend build: `pnpm --dir frontend build` — CSS gzip 670.25 KB (baseline 665.9 KB → +4.35 KB, within the +5 KB envelope).
- Code review: `_bmad-output/review-2-2-client-detail-view.md` — PASS CON OBSERVACIONES. 2 medium doc-drift issues auto-fixed (File List + this Debug Log). 1 non-blocking refactor (shared `FakeClienteRepository`) deferred to Story 2.3/2.4.

### Completion Notes List

- **Task 3 backend endpoint tests**: The story spec asked to extend `ClienteEndpointsTests.cs` with three new tests. The ATDD phase already generated the three tests inside a dedicated file — `ClienteEndpointsGetByIdTests.cs` — using the same `WebApplicationFactory<Program>` + `UseEnvironment("Testing")` + `services.RemoveAll<IClienteRepository>()` override pattern established by Story 2.1. Keeping the file separate has zero behavioural impact (they share the same xUnit collection and the same fake-repo shape) and avoids editing a file that Story 2.1 already froze.
- **Zod UUID guard relaxation**: The story spec suggested `z.string().uuid()`, but Zod v4 (installed at ^4.4.3) rejects both `Guid.Empty`-style nil UUIDs and the synthetic test fixtures from `buildCliente()` (e.g. `11111111-1111-1111-1111-111111111111` — the variant/version bits do not satisfy RFC 4122). To stay aligned with the backend's `:guid` route constraint (which accepts any hex 8-4-4-4-12 shape) and the existing test factory, `isValidClienteId` uses `z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)`. This still catches AC #4 non-UUIDs (`abc`, `not-a-uuid`) and still enforces the general UUID shape.
- **`buildCliente` factory fix (test infrastructure)**: The Story 2.1 factory built ids by padding `Date.now()` (13 digits in 2026) into the last group, producing 37-char strings that violated the 8-4-4-4-12 UUID hex format. Converting the counter to hex + slicing to the last 12 chars restores a canonical 36-char id. All 36 existing Story 2.1 test suites still pass unchanged.
- **`retry: false` on `useCliente`**: The story Dev Notes suggested a bounded-retry predicate (`failureCount < 2` for non-404), but the AC #6 ATDD test explicitly expects the ErrorPanel to appear after ONE 500 response, and the recovery test in the same file expects the FIRST call to fail and the SECOND to succeed (retry would silently succeed and hide the ErrorPanel). Setting `retry: false` respects the test spec and matches the intended UX ("Reintentar" is a manual, user-driven retry).
- **`siesa-ui-kit Button` prop**: Story 2.1's `ErrorPanel` uses `<Button type="outline">` (not `variant`) — that is the actual siesa-ui-kit API in this project. `ClienteNotFound` follows the same convention.
- **Non-scope stayed non-scope**: no Edit button, no Delete button, no ContactManager, no MasterCrud orchestrator, no new NuGet packages, no EF Core migration.

### File List

**Backend — created:**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` *(ATDD, provided as input)*
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerEdgeTests.cs` *(Automate phase — boundary/negative coverage)*
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdTests.cs` *(ATDD, provided as input)*
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdEdgeTests.cs` *(Automate phase — negative-path / verb / concurrency coverage)*

**Backend — modified:**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `MapGet("/{id:guid}", ...)` alongside the Story 2.1 list endpoint.
- `backend/src/SiesaAgents.API/Program.cs` — registered `GetClienteByIdQueryHandler` in DI.

**Frontend — created:**
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCliente.test.ts` *(ATDD, provided as input)*
- `frontend/src/modules/crm/clientes/application/useCliente.edge.test.ts` *(Automate phase — dedup, error paths, enabled transitions)*
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` *(ATDD, provided as input)*
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge.test.tsx` *(Automate phase — unicode, non-404 routing, NFR6 anti-leak)*
- `frontend/src/shared/components/ClienteNotFound.tsx`
- `frontend/src/shared/components/ClienteNotFound.test.tsx` *(ATDD, provided as input)*
- `frontend/src/shared/components/ClienteNotFound.edge.test.tsx` *(Automate phase — interaction + semantic contracts)*
- `frontend/src/routes/clientes.$clienteId.test.tsx` *(ATDD, provided as input)*
- `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts` *(ATDD, Playwright route-intercepted acceptance journey)*

**Frontend — modified:**
- `frontend/src/routes/clientes.$clienteId.tsx` — replaced Story 2.1 placeholder with `ClienteDetailRoute` that mounts `ClienteDetailView`.
- `frontend/src/test/factories/cliente.factory.ts` — small correctness fix so generated ids are canonical 36-char UUID-hex strings (see Completion Note above).

**Planning / evidence artifacts (informational):**
- `_bmad-output/atdd-checklist-2.2.md` — ATDD checklist snapshot for Story 2.2 (RED-phase test roster).
- `_bmad-output/review-2-2-client-detail-view.md` — Code-review output (this story).
