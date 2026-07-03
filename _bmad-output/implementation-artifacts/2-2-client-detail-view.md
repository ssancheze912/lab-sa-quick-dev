# Story 2.2: Client Detail View

Status: ready-for-dev

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clientes section.

## Acceptance Criteria

1. **Given** the client list is loaded at `/clientes` (rendered by Story 2.1's `_app/clientes.tsx` layout), **When** the user clicks on a client item, **Then** the URL updates to `/clientes/{clienteId}` (FR30 deep linking, `test-design-epic-2.md#TC-E2-P1-04`), the right panel renders `<ClienteDetailView>` with the complete client fields — **Nombre**, **NIT/RUC**, **Teléfono**, **Ciudad** — and the corresponding item in the left list gets the active-selection styling (`activeProps` on the TanStack Router `<Link>`). Navigation between clients happens client-side (SPA — no full page reload); the AppShell (`data-testid="app-shell"`) and NavigationRail (`data-testid="nav-rail"`) from Story 1.2 remain mounted throughout.

2. **Given** the user opens `http://localhost:5173/clientes/{clienteId}` **directly** in a new browser tab or refreshes the page while on a detail view, **When** the route resolves, **Then** TanStack Router matches `_app/clientes.$clienteId.tsx` under the `_app/clientes.tsx` parent layout — the left list and the right detail panel BOTH render, populated from independent queries `['clientes']` and `['clientes', clienteId]`. The selected item is highlighted in the list; there is no redirect back to `/clientes`.

3. **Given** the URL contains a `clienteId` that does not exist in the backend, **When** the detail query resolves with HTTP 404, **Then** the right panel renders a Spanish not-found message (`<ClienteNotFound>`, e.g. "No se encontró el cliente solicitado." + "Es posible que haya sido eliminado o que el enlace sea incorrecto.") plus a `<Link to="/clientes">Volver a la lista</Link>` CTA. No JavaScript error is thrown to the console (`test-design-epic-2.md#TC-E2-P1-05` — negative case). The AppShell chrome and the left list panel remain intact — only the detail slot is replaced.

4. **Given** the backend is running with Epic 1 + Story 2.1 wiring, **When** the frontend fetches `GET /api/v1/clientes/{id}` with a valid GUID for a persisted client, **Then** the API returns HTTP `200 OK` with a single JSON object (no envelope) shaped exactly like the list DTO — camelCase fields `id`, `nombre`, `nitRuc`, `telefono`, `ciudad`, `createdAt`, `updatedAt`; `createdAt`/`updatedAt` are ISO-8601 with timezone offset (`DateTimeOffset` serialization, `architecture.md#Format Patterns`). The endpoint is registered on the same `MapGroup("/api/v1/clientes")` in `ClienteEndpoints.cs` as `MapGet("/{id:guid}", ...)` — the `:guid` route constraint MUST be present so a non-GUID segment (e.g. `/api/v1/clientes/foo`) yields 404 without hitting the handler.

5. **Given** a request `GET /api/v1/clientes/{id}` where `{id}` is a well-formed GUID with no matching row, **When** the handler resolves the repository result to `null`, **Then** the endpoint returns HTTP `404 Not Found` with `Content-Type: application/problem+json` (RFC 7807) — body contains `status: 404`, `title: "Not Found"`, `type`, and `instance: /api/v1/clientes/{id}`. The response body does NOT include any `stackTrace`, `exception`, `innerException`, or raw EF/`Npgsql` text (`test-design-epic-2.md#TC-E2-P1-12` negative case, NFR6). The existing `UseStatusCodePages(...)` handler in `Program.cs` already produces the Problem Details shape for framework 404s — the endpoint MUST invoke it, e.g. by returning `Results.NotFound()` (which triggers `StatusCodePages`) rather than serializing a bespoke JSON body.

6. **Given** the `IClienteRepository` interface in `SiesaAgents.Domain.Clientes.Interfaces`, **When** the backend project compiles, **Then** it exposes a new method `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);` alongside the existing `GetAllAsync`. `ClienteRepository` (Infrastructure) implements it using EF Core `dbContext.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)`. No other repository method is added in this story (Add/Update/Delete belong to 2.3/2.4/2.5).

7. **Given** the frontend `IClienteRepository` domain interface, **When** the TypeScript project compiles (`pnpm exec tsc -b`), **Then** it exposes an additional method `getById(id: string, signal?: AbortSignal): Promise<Cliente>`. `clienteApiRepository` (Infrastructure) implements it via `apiClient.get<Cliente>('/api/v1/clientes/${id}', { signal })`. On a 404 response, the Axios call throws an `AxiosError` with `response.status === 404` — the calling hook maps this to a distinct query state (see AC #8) rather than to a generic error.

8. **Given** the new application hook `useCliente(clienteId: string)`, **When** it is used inside `<ClienteDetailView>`, **Then** it wraps `useQuery` with **`queryKey: ['clientes', clienteId]`** (canonical per `architecture.md` line 279 / 402 / 630) and `queryFn: ({ signal }) => clienteApiRepository.getById(clienteId, signal)`. Retries on 404 are disabled — `retry: (failureCount, error) => !isAxios404(error)` — so a not-found scenario resolves fast (single request) and the detail view can distinguish "not found" from "network error" by checking `error?.response?.status === 404`. `staleTime` is `30_000` (same as `useClientes` for cache-consistency). Do NOT introduce a Zustand store — the TanStack Query cache is the source of truth (per `architecture.md#State Boundaries`).

9. **Given** the developer runs `pnpm exec tsc -b` from `frontend/` and `dotnet build backend/SiesaAgents.sln`, **When** compilation finishes, **Then** both emit `0 errors` and `0 warnings` (the `NU1903` suppression from Epic 1 remains in force — no new suppressions introduced). No `any` casts in the new TypeScript code (`useCliente.ts`, `ClienteDetailView.tsx`, `ClienteNotFound.tsx`, updated `clienteApiRepository.ts`, updated `IClienteRepository.ts`, updated `ClientListItem.tsx`, new `_app/clientes.$clienteId.tsx`, new `_app/clientes.index.tsx`). All Spanish user-facing text uses double quotes; code identifiers stay in English.

10. **Given** the developer runs `pnpm --filter frontend test` and `dotnet test backend/SiesaAgents.sln`, **When** the suites complete, **Then** all pre-existing Story 2.1 and Epic 1 tests still pass, plus the following new/reused test cases from `test-design-epic-2.md` all pass (or are `Skip`-guarded per the Docker-sandbox pattern established in Story 1.3):
    - **TC-E2-P1-12** — `GET /api/v1/clientes/{id}` returns 200 + full payload for an existing GUID; returns 404 Problem Details for `00000000-0000-0000-0000-000000000000`.
    - **`ClienteDetailView.test.tsx`** — with MSW serving the `list` handler AND a new `byId` handler:
        - Happy path: rendering `/clientes/{knownId}` shows the four fields with the correct values.
        - 404 path: rendering `/clientes/00000000-0000-0000-0000-000000000000` shows `<ClienteNotFound>` (`data-testid="cliente-not-found"`) with a Spanish message and a link back to `/clientes`.
        - Loading skeleton: while the query is pending, `react-loading-skeleton` renders (fields NOT shown); resolves to fields on success.
        - Deep-link selection sync: rendering the route directly highlights the corresponding `data-testid="cliente-list-item"` (via TanStack Router `activeProps` — no click simulated).
    - **`useCliente.test.tsx`** — hook contract:
        - Canonical `queryKey: ['clientes', id]` (asserted via `queryClient.getQueryCache().find(...)`).
        - `retry` is disabled for 404 (single request against MSW error handler).
        - On non-404 (e.g. 500), `isError` is true and `error` is exposed.
    - **`ClientListItem.test.tsx`** (extended, non-regression) — after the migration from `<button>`+`onSelect` to `<Link to="/clientes/$clienteId">`, the assertions from Story 2.1 (nombre + NIT visible; 44 px tap target; item receives the ATDD `data-testid`) all still pass; a new assertion verifies the `href` attribute of the anchor points to `/clientes/{cliente.id}`.

11. **Given** all user-facing text on the client detail view, **When** the UI is rendered, **Then** every visible label, section header, empty-state copy, error message, aria-label, and CTA is in **Spanish** (company-standard P0). The four detail rows use Spanish field labels: `"Nombre"`, `"NIT/RUC"`, `"Teléfono"`, `"Ciudad"`. Code identifiers (variables, functions, types, files) remain in English.

## Tasks / Subtasks

- [ ] **Task 1 — Backend: extend `IClienteRepository` + `ClienteRepository` with `GetByIdAsync` (AC: #6)**
  - [ ] Update `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — add the method signature below the existing `GetAllAsync`:
    ```csharp
    Task<ClienteEntity?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);
    ```
    Return `null` (not throw) when the entity is absent — the not-found decision is a query concern (see Task 2), not a domain-layer exception. Keeping the domain method nullable-return-based avoids polluting the Domain layer with an HTTP concept.
  - [ ] Update `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implement `GetByIdAsync`:
    ```csharp
    public async Task<ClienteEntity?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
    ```
    `AsNoTracking()` matches the `GetAllAsync` pattern (read-only endpoint). `FirstOrDefaultAsync` returns `null` when no row matches — that `null` is the signal the handler uses to decide 404.
  - [ ] Do NOT introduce any additional repository method (`AddAsync`, `UpdateAsync`, `DeleteAsync`) — those land in Stories 2.3, 2.4, 2.5.

- [ ] **Task 2 — Backend: Application layer `GetClienteByIdQuery` + Handler (AC: #4, #5, #6)**
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.Queries;

    public record GetClienteByIdQuery(Guid Id);
    ```
    Use a `record` for immutability, matching the `GetClientesQuery` style. The single `Id` property matches the route parameter.
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`:
    ```csharp
    using SiesaAgents.Application.Clientes.DTOs;
    using SiesaAgents.Domain.Clientes.Interfaces;

    namespace SiesaAgents.Application.Clientes.Queries;

    public class GetClienteByIdQueryHandler(IClienteRepository repository)
    {
        public async Task<ClienteDto?> HandleAsync(
            GetClienteByIdQuery query,
            CancellationToken cancellationToken = default)
        {
            var cliente = await repository.GetByIdAsync(query.Id, cancellationToken);
            if (cliente is null)
            {
                return null;
            }

            return new ClienteDto(
                cliente.Id,
                cliente.Nombre,
                cliente.NitRuc,
                cliente.Telefono,
                cliente.Ciudad,
                cliente.CreatedAt,
                cliente.UpdatedAt);
        }
    }
    ```
    Reuse the existing `ClienteDto` — no separate `ClienteDetailDto`. The list DTO already exposes every field the detail view consumes. Handler is a POCO (no MediatR) matching `GetClientesQueryHandler`.

- [ ] **Task 3 — Backend: extend `ClienteEndpoints.cs` with `MapGet("/{id:guid}")` (AC: #4, #5)**
  - [ ] Update `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — add a second `MapGet` inside the existing `MapGroup`:
    ```csharp
    group.MapGet("/{id:guid}", async (
            Guid id,
            GetClienteByIdQueryHandler handler,
            CancellationToken cancellationToken) =>
    {
        var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), cancellationToken);
        return dto is null
            ? Results.NotFound()
            : Results.Ok(dto);
    });
    ```
    - The `:guid` route constraint short-circuits any non-GUID segment to a framework 404 — the handler never runs on garbage input.
    - `Results.NotFound()` (parameter-less) triggers the `UseStatusCodePages(...)` middleware already registered in `Program.cs`, which emits an `application/problem+json` body with the correct RFC 7807 shape. Do NOT hand-roll `Results.Problem(...)` — the middleware is the single source of truth for the 404 body per Epic 1's convention.
  - [ ] Keep the existing `MapGet("/", ...)` (list endpoint) untouched — order both `MapGet` calls under the same `MapGroup` variable `group` so they share the `/api/v1/clientes` prefix and the `Clientes` OpenAPI tag.

- [ ] **Task 4 — Backend: register `GetClienteByIdQueryHandler` in DI (AC: #4)**
  - [ ] Update `backend/src/SiesaAgents.API/Program.cs` — add the handler registration next to the existing `GetClientesQueryHandler` line (do NOT move existing lines):
    ```csharp
    builder.Services.AddScoped<GetClienteByIdQueryHandler>();
    ```
    Insert directly after `builder.Services.AddScoped<GetClientesQueryHandler>();`. The pipeline order (`UseMiddleware<ExceptionHandlingMiddleware>()` → `UseStatusCodePages(...)` → `UseCors(...)` → `MapOpenApi()` → `MapScalarApiReference()` → `MapClienteEndpoints()`) is LOCKED by Epic 1 tests — do NOT reorder.
  - [ ] `IClienteRepository`/`ClienteRepository` DI registration is already present (Story 2.1) — no change required.

- [ ] **Task 5 — Backend: integration test for `GET /api/v1/clientes/{id}` (AC: #10 → TC-E2-P1-12)**
  - [ ] Extend `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` (already exists from Story 2.1) — add two `[SkippableFact]` cases wired to the shared `TestcontainerFactory` (`Skip.IfNot(_dockerAvailable, ...)` pattern from Story 1.3):
    1. **Existing id**: seed a `ClienteEntity` via `AppDbContext`, `GET /api/v1/clientes/{known}` → assert `200 OK`, response is a single JSON object with all seven camelCase keys, `createdAt` matches ISO-8601-with-offset regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)$`.
    2. **Missing id**: `GET /api/v1/clientes/00000000-0000-0000-0000-000000000000` → assert `404 Not Found`, `Content-Type` starts with `application/problem+json`, deserialized body contains `title == "Not Found"`, `status == 404`, `instance == "/api/v1/clientes/00000000-0000-0000-0000-000000000000"`, and (as a defense-in-depth check for NFR6) the raw response text does NOT contain the substrings `stackTrace`, `Exception`, `Npgsql`, `DbUpdateException`.
  - [ ] Reuse the seeding helper already used by the list-integration test — do NOT introduce a second `WebApplicationFactory<Program>`.

- [ ] **Task 6 — Frontend: extend `IClienteRepository` domain interface + `clienteApiRepository` (AC: #7)**
  - [ ] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — add the method signature next to the existing `getAll`:
    ```typescript
    export interface IClienteRepository {
      getAll(signal?: AbortSignal): Promise<Cliente[]>
      getById(id: string, signal?: AbortSignal): Promise<Cliente>
    }
    ```
    The infrastructure implementation MAY throw on 404 (Axios default); the calling hook (`useCliente`) is responsible for translating that to a not-found UI state. Keep the return type as `Promise<Cliente>` (not `Promise<Cliente | null>`) — the caller uses `useQuery`'s `isError` + `error.response.status` to branch, which is the idiomatic TanStack Query pattern for HTTP status–driven UI states.
  - [ ] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — add the `getById` implementation:
    ```typescript
    export const clienteApiRepository: IClienteRepository = {
      async getAll(signal) { /* unchanged */ },
      async getById(id, signal) {
        const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`, { signal })
        return data
      },
    }
    ```
    Use a template literal — never concatenate. The AbortSignal from TanStack Query propagates automatic cancellation on unmount / navigation.

- [ ] **Task 7 — Frontend: `useCliente(clienteId)` application hook (AC: #8, #10)**
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    ```typescript
    import { useQuery } from '@tanstack/react-query'
    import { AxiosError } from 'axios'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    /**
     * Query hook for a single cliente by id.
     * `queryKey: ['clientes', id]` is canonical per architecture.md line 279/402/630.
     * Retries on 404 are disabled so the not-found UI state resolves fast.
     */
    export function useCliente(clienteId: string) {
      return useQuery({
        queryKey: ['clientes', clienteId],
        queryFn: ({ signal }) => clienteApiRepository.getById(clienteId, signal),
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof AxiosError && error.response?.status === 404) {
            return false
          }
          return failureCount < 3
        },
      })
    }

    export function isClienteNotFound(error: unknown): boolean {
      return error instanceof AxiosError && error.response?.status === 404
    }
    ```
    Export both `useCliente` and the helper `isClienteNotFound` — the detail view uses the helper to distinguish a legitimate 404 (render `<ClienteNotFound>`) from an actual failure (render `<ErrorPanel>` with retry). `retry` uses the TanStack Query v5 predicate form, matching the library docs.

- [ ] **Task 8 — Frontend: `<ClienteDetailView>` presentation component (AC: #1, #2, #3, #11)**
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Accept `clienteId: string` as a prop (populated by the route in Task 9).
    - Call `useCliente(clienteId)`; destructure `data`, `isLoading`, `isError`, `error`, `refetch`.
    - Render inside `<article data-testid="cliente-detail" className="flex-1 flex flex-col overflow-y-auto p-6 gap-4">`.
    - Branch semantics (in order — first true wins):
      1. `isLoading` → `<div data-testid="cliente-detail-skeleton" className="p-3"><Skeleton count={5} height={24} /></div>` (react-loading-skeleton).
      2. `isError` AND `isClienteNotFound(error)` → `<ClienteNotFound />` (see Task 10).
      3. `isError` AND NOT `isClienteNotFound(error)` → `<ErrorPanel onRetry={() => void refetch()} />` (reuse Story 2.1 component).
      4. `!data` (guard) → render skeleton (defensive fallback — should not happen after successful query).
      5. otherwise → detail body:
        ```tsx
        <header className="flex flex-col gap-1">
          <h2 data-testid="cliente-detail-nombre" className="text-2xl font-semibold text-slate-900">{data.nombre}</h2>
          <p className="text-sm text-slate-500">NIT/RUC: {data.nitRuc}</p>
        </header>
        <dl className="grid grid-cols-1 gap-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Nombre</dt>
            <dd data-testid="cliente-detail-field-nombre" className="text-sm text-slate-900">{data.nombre}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">NIT/RUC</dt>
            <dd data-testid="cliente-detail-field-nit-ruc" className="text-sm text-slate-900">{data.nitRuc}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Teléfono</dt>
            <dd data-testid="cliente-detail-field-telefono" className="text-sm text-slate-900">{data.telefono}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Ciudad</dt>
            <dd data-testid="cliente-detail-field-ciudad" className="text-sm text-slate-900">{data.ciudad}</dd>
          </div>
        </dl>
        ```
      - Use a semantic `<dl>` for the field list (WCAG 2.1 AA — better than a `<div>` grid for screen readers when the pairs are label→value).
      - All labels are in **Spanish** (`Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`).
      - Do NOT include Editar / Eliminar buttons — those land in Stories 2.4 / 2.5.
      - Do NOT include contact management — that belongs to Epic 3 / Epic 4. `ContactManager` from siesa-ui-kit is out of scope for Story 2.2.

- [ ] **Task 9 — Frontend: create the `_app/clientes.$clienteId.tsx` deep-link route + split the placeholder to `_app/clientes.index.tsx` (AC: #1, #2, #3)**
  - [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

    export const Route = createFileRoute('/_app/clientes/$clienteId')({
      component: ClienteDetailRoute,
    })

    function ClienteDetailRoute() {
      const { clienteId } = Route.useParams()
      return <ClienteDetailView clienteId={clienteId} />
    }
    ```
    `Route.useParams()` returns a fully-typed `{ clienteId: string }` thanks to TanStack Router's file-based type generation — no manual `z.object({ clienteId: z.string().uuid() })` parsing needed. UUID-shape validation is the backend's responsibility (route constraint `:guid` on the API, `AxiosError.response.status === 404` on invalid GUIDs).
  - [ ] Create `frontend/src/routes/_app/clientes.index.tsx` (owns the "no client selected" placeholder that currently lives directly inside `clientes.tsx`):
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'

    export const Route = createFileRoute('/_app/clientes/')({
      component: ClientesEmptyDetail,
    })

    function ClientesEmptyDetail() {
      return (
        <div
          data-testid="cliente-detail-placeholder"
          className="flex-1 hidden lg:flex items-center justify-center text-sm text-slate-500"
        >
          Selecciona un cliente para ver el detalle
        </div>
      )
    }
    ```
    The TanStack Router "index" file (`clientes.index.tsx`) matches ONLY when the URL is exactly `/clientes` (no child param). Once the user opens `/clientes/{clienteId}`, the index route unmounts and `$clienteId.tsx` takes its slot in the parent's `<Outlet />`.
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` — remove the inline placeholder now that it moved to `clientes.index.tsx`. Final file:
    ```tsx
    import { createFileRoute, Outlet } from '@tanstack/react-router'
    import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

    export const Route = createFileRoute('/_app/clientes')({
      component: ClientesLayout,
    })

    function ClientesLayout() {
      return (
        <section data-testid="clientes-view" className="flex h-full">
          <ClienteListView />
          <Outlet />
        </section>
      )
    }
    ```
    The `data-testid="clientes-view"` MUST be preserved — Epic 1's `TC-E1-P1-01` navigation ATDD asserts on it. Only the placeholder move is a behavioural change; the layout container and its test hooks are unchanged.
  - [ ] After creating the two new route files, let TanStack Router regenerate `frontend/src/routeTree.gen.ts` via its Vite plugin (dev server or `pnpm exec tsc -b`) — do NOT hand-edit that file, it is generated.

- [ ] **Task 10 — Frontend: `<ClienteNotFound>` shared component (AC: #3, #11)**
  - [ ] Create `frontend/src/shared/components/ClienteNotFound.tsx`:
    ```tsx
    import { Link } from '@tanstack/react-router'

    /**
     * Not-found panel for the Cliente Detail view (Story 2.2 AC #3).
     * Rendered when useCliente() resolves to isError + 404. Sibling of EmptyState
     * / ErrorPanel — placeholder-simple, all Spanish copy, and provides a link
     * back to the client list so the user is never trapped.
     */
    export function ClienteNotFound() {
      return (
        <div
          data-testid="cliente-not-found"
          className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <p className="text-sm font-medium text-slate-700">
            No se encontró el cliente solicitado.
          </p>
          <p className="text-xs text-slate-500">
            Es posible que haya sido eliminado o que el enlace sea incorrecto.
          </p>
          <Link
            to="/clientes"
            data-testid="cliente-not-found-back"
            className="text-sm text-[--color-brand-primary,#0e79fd] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-primary,#0e79fd]"
          >
            Volver a la lista
          </Link>
        </div>
      )
    }
    ```
    Kept placeholder-simple by design (matches `EmptyState.tsx` / `ErrorPanel.tsx` conventions from Story 2.1). Uses `<Link>` from TanStack Router — a `<button onClick={navigate}>` would break the SPA back-navigation semantic. All copy in Spanish, all identifiers in English.

- [ ] **Task 11 — Frontend: migrate `<ClientListItem>` from `<button>` selection to TanStack Router `<Link>` (AC: #1, #2, #10)**
  - [ ] Update `frontend/src/shared/components/ClientListItem.tsx` — replace the internal `<button>` with `<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>`. Drop the `isSelected` / `onSelect` props (they were placeholders per Story 2.1 dev notes — the deep-link migration is Story 2.2's job). Use `activeProps` for the selected styling so TanStack Router owns the "which item is active" decision (URL-driven, not local state).
    ```tsx
    import { Link } from '@tanstack/react-router'
    import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

    interface ClientListItemProps {
      cliente: Cliente
    }

    export function ClientListItem({ cliente }: ClientListItemProps) {
      return (
        <li data-testid="cliente-list-item" className="border-b border-slate-100">
          <Link
            to="/clientes/$clienteId"
            params={{ clienteId: cliente.id }}
            className="block w-full text-left px-3 py-2 min-h-[44px] hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-primary,#0e79fd]"
            activeProps={{ className: 'bg-slate-100 font-semibold' }}
          >
            <p className="text-sm text-slate-900 truncate">{cliente.nombre}</p>
            <p className="text-xs text-slate-500 truncate">NIT/RUC: {cliente.nitRuc}</p>
          </Link>
        </li>
      )
    }
    ```
    - `data-testid="cliente-list-item"` is preserved — the Story 2.1 component tests + Playwright page object reference it.
    - `min-h-[44px]` preserves the 44 px tap target introduced in the Story 2.1 accessibility pass.
    - `activeProps` is the idiomatic TanStack Router way to style the active `<Link>` — it swaps in the classes automatically when the current URL matches the `to` + `params`, so the highlight is URL-driven for BOTH click AND deep-link scenarios (satisfies AC #1 and AC #2 in a single line).
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` if it was passing the removed `isSelected` / `onSelect` props — but from the Story 2.1 code (`filtered.map((cliente) => <ClientListItem key={cliente.id} cliente={cliente} />)`) the call site already passes only `cliente`, so no change is needed. Confirm by re-reading the file before making edits.

- [ ] **Task 12 — Frontend: MSW handler for `GET /api/v1/clientes/:id` (AC: #10)**
  - [ ] Update `frontend/src/test/handlers/clientes.ts` — add three factories next to the existing `list` / `empty` / `error` / `listDelayed`:
    ```typescript
    /**
     * Returns the provided cliente on `GET /api/v1/clientes/:id`.
     * Used by <ClienteDetailView> happy-path tests + TC-E2-P1-04 deep-link.
     */
    byId: (cliente: Cliente) =>
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)),

    /**
     * Returns 404 Problem Details for any `GET /api/v1/clientes/:anything`.
     * Exercises the <ClienteNotFound> render path (TC-E2-P1-05).
     */
    byIdNotFound: () =>
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231',
            title: 'Not Found',
            status: 404,
            instance: '/api/v1/clientes/unknown',
          },
          { status: 404 },
        )),

    /**
     * Returns 500 on `GET /api/v1/clientes/:id` — used to distinguish the
     * generic error path (ErrorPanel) from the not-found path.
     */
    byIdError: (status = 500) =>
      http.get('*/api/v1/clientes/:id', () =>
        new HttpResponse(null, { status })),
    ```
    Keep the wildcard host prefix (`*/api/v1/...`) so tests do not need to know `VITE_API_URL` — consistent with Story 2.1's `list` handler style.

- [ ] **Task 13 — Frontend: component + hook tests (AC: #10)**
  - [ ] Create `frontend/src/modules/crm/clientes/application/useCliente.test.tsx` — three cases:
    1. **Canonical key**: mount the hook via `renderHook(() => useCliente('client-uuid'), { wrapper })` with an MSW `byId` handler; after `waitFor(() => result.current.isSuccess)`, assert `queryClient.getQueryCache().find({ queryKey: ['clientes', 'client-uuid'] })` is defined.
    2. **404 → no retry**: install `byIdNotFound()`, count MSW requests, wait for `result.current.isError`; assert exactly `1` request was made (no retry loop) and `isClienteNotFound(result.current.error) === true`.
    3. **500 → retries**: install `byIdError(500)`, use a `QueryClient` with `defaultOptions.queries.retry: 3` overridden to `retryDelay: 0` for speed; assert `> 1` MSW request AND `isClienteNotFound(result.current.error) === false`.
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` — four cases:
    1. **Happy path**: `byId(makeCliente({ id: '...', nombre: 'ACME', nitRuc: '900-1', telefono: '3001234567', ciudad: 'Bogotá' }))`, render `<ClienteDetailView clienteId="..." />` inside `QueryClientProvider`, assert `data-testid="cliente-detail-field-nombre"` has text `"ACME"`, and each of the four field testids is present with the correct value.
    2. **404 path**: `byIdNotFound()`, render for any id, assert `data-testid="cliente-not-found"` visible, assert `data-testid="cliente-not-found-back"` has an `href` pointing to `/clientes`.
    3. **Non-404 error path**: `byIdError(500)` (with `retry: 0` on the test's `QueryClient` to fail fast), assert `data-testid="error-panel"` visible (Story 2.1's `<ErrorPanel>` is reused), NOT `cliente-not-found`.
    4. **Loading skeleton**: use `listDelayed`-style delayed byId handler (add if needed) or freeze the resolution; before resolving, assert `data-testid="cliente-detail-skeleton"` is present; after resolving, skeleton is gone and fields are visible.
  - [ ] Extend `frontend/src/shared/components/ClientListItem.test.tsx` (already exists from Story 2.1) — after the `<Link>` migration:
    - Wrap the render in a memory router (`createMemoryHistory` + `RouterProvider`) with a stub route tree containing `/clientes/$clienteId` so the `<Link>` resolves.
    - Assert the rendered anchor has `href` matching `/clientes/${cliente.id}`.
    - Preserve the pre-existing Story 2.1 assertions (nombre + NIT visible, 44 px min-height, `data-testid="cliente-list-item"`).
  - [ ] Confirm all pre-existing Story 2.1 tests still pass — `ClienteListView.test.tsx`, `ClienteListView.edge.test.tsx`, `useClientes.test.tsx`, `EmptyState.test.tsx`, `ErrorPanel.test.tsx` — no assertion touched. If any of them mounted the `<section data-testid="clientes-view">` root and asserted the inline placeholder rendered by default, retarget the assertion to the `_app/clientes.index.tsx` route (via a memory-router setup) — the placeholder still exists, only its location moved.

- [ ] **Task 14 — Frontend: E2E updates for deep-link scenarios (AC: #10 sensor — TC-E2-P1-04 + TC-E2-P1-05)**
  - [ ] The pre-authored Playwright specs under `e2e/tests/clientes/` (e.g. `clientes-crud.spec.ts`) already reference deep-link flows. Verify that the `ClientesPage` page object still exposes selectors that map cleanly to the new markup:
    - `page.getByTestId('cliente-detail')` → the new detail article.
    - `page.getByTestId('cliente-list-item')` → still present on each `<li>`.
    - `page.getByTestId('cliente-not-found')` → new, added in Task 10.
  - [ ] Do NOT rewrite the specs — align the DOM testids in Task 8 / Task 10 to whatever the page object uses. If the page object references an ID that does not exist in this story's markup, add the missing `data-testid` rather than rewriting the ATDD spec (spec = source of truth, per Story 2.1 convention).
  - [ ] Do NOT block on Playwright browser execution in the sandbox — Story 1.1 note #7 flagged the proxy 403 for browser download. Execution is left to the TEA `sa-tea-atdd-run` sub-agent in the pipeline.

- [ ] **Task 15 — Verify build + type-check + tests (AC: #9, #10)**
  - [ ] From `frontend/`, run `pnpm exec tsc -b` → 0 errors (verifies typegen picked up the new `$clienteId` route file).
  - [ ] From `frontend/`, run `pnpm --filter frontend test` → all vitest suites GREEN (Epic 1 + Story 2.1 + Story 2.2 new component/hook tests). No skipped tests without a documented reason.
  - [ ] From `backend/`, run `dotnet build backend/SiesaAgents.sln` → 0 errors, 0 warnings (NU1903 suppression unchanged).
  - [ ] From `backend/`, run `dotnet test backend/SiesaAgents.sln --no-build` → all tests pass or are `Skip`-guarded per the TestContainers/Docker sandbox pattern.
  - [ ] Update this story file's `Dev Agent Record` section with: model used, debug logs, completion notes, and full File List (created + modified). Do NOT touch anything above the `Dev Agent Record` header.

## Dev Notes

### Architecture-mandated file placement

Per `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure` and `.claude/agent-memory/sa-quick-dev/company-standards.md`:

| Layer | Path | Story 2.2 status |
|-------|------|------------------|
| BE Domain | `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` | Modify (add `GetByIdAsync`) |
| BE Infrastructure | `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` | Modify (implement `GetByIdAsync`) |
| BE Application | `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` | Create |
| BE Application | `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` | Create |
| BE API | `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` | Modify (add `MapGet("/{id:guid}")`) |
| BE API | `backend/src/SiesaAgents.API/Program.cs` | Modify (register `GetClienteByIdQueryHandler`) |
| BE Tests | `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` | Modify (add TC-E2-P1-12 cases) |
| FE Domain | `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` | Modify (add `getById`) |
| FE Application | `frontend/src/modules/crm/clientes/application/useCliente.ts` | Create |
| FE Infrastructure | `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` | Modify (add `getById`) |
| FE Presentation | `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` | Create |
| FE Shared | `frontend/src/shared/components/ClienteNotFound.tsx` | Create |
| FE Shared | `frontend/src/shared/components/ClientListItem.tsx` | Modify (`<button>` → `<Link>`, drop `isSelected`/`onSelect`) |
| FE Route | `frontend/src/routes/_app/clientes.tsx` | Modify (remove inline placeholder, keep `<Outlet />`) |
| FE Route | `frontend/src/routes/_app/clientes.$clienteId.tsx` | Create |
| FE Route | `frontend/src/routes/_app/clientes.index.tsx` | Create |
| FE Route | `frontend/src/routeTree.gen.ts` | Auto-regenerate (do NOT hand-edit) |
| FE Tests | `frontend/src/test/handlers/clientes.ts` | Modify (add `byId`/`byIdNotFound`/`byIdError`) |
| FE Tests | `frontend/src/modules/crm/clientes/application/useCliente.test.tsx` | Create |
| FE Tests | `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` | Create |
| FE Tests | `frontend/src/shared/components/ClientListItem.test.tsx` | Modify (extend for `<Link>`, keep Story 2.1 assertions) |

Out of scope for Story 2.2 (do NOT touch):
- `POST /api/v1/clientes` and `CreateClienteCommand.cs` — Story 2.3.
- `PUT /api/v1/clientes/{id}` and `UpdateClienteCommand.cs` — Story 2.4.
- `DELETE /api/v1/clientes/{id}` and `DeleteClienteCommand.cs` — Story 2.5.
- `SortControl` and `nombre-asc | nombre-desc | fecha-desc | fecha-asc` — Story 2.6.
- `ClienteForm.tsx`, `useCreateCliente.ts`, `useUpdateCliente.ts`, `clienteSchema.ts` (Zod) — Stories 2.3 / 2.4.
- `ContactoEntity.cs`, `contactos` table, `ContactManager` from `siesa-ui-kit`, `ClienteContactServiceAdapter` — Epic 3 / Epic 4.
- Editar / Eliminar buttons on `<ClienteDetailView>` — Stories 2.4 / 2.5.

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit@^1.0.255` (P0 per `company-standards.md#Frontend Key Rules` + `architecture.md#Corporate Standards`).
- **Install:** already present in `frontend/package.json`. Verify: `pnpm --filter frontend list siesa-ui-kit`.
- **Usage:** Story 2.2 does NOT introduce a new siesa-ui-kit primitive because the detail view is purely a read-only field list — no CRUD grid, no orchestrator, no form. `<ClienteDetailView>` is composed of native semantic HTML (`<article>`, `<header>`, `<dl>`) styled with Tailwind. This is consistent with the Story 2.1 fallback rule: when a primitive does not honour the required contract (or none is needed), use native HTML.
- **MasterCrud:** Explicitly **out of scope** for Story 2.2. The `mastercrud-use-reference.md` guidance applies to CRUD screens that combine data grid + form + filters in a single orchestrator. Story 2.2 is a read-only detail view; there is no grid, no form. MasterCrud enters the picture at Story 2.3 (Create Client) and 2.4 (Edit Client) IF a decision is made to unify list + form under a single orchestrator, but for a detail-only view the split-panel + `<dl>` composition is the correct minimum-complexity choice.
- **ContactManager:** Explicitly **out of scope**. `ContactManager` is a `siesa-ui-kit` native component that renders inline contact CRUD inside the client detail (per UX Direction F). Contact management belongs to Epic 3 (contact CRUD) and Epic 4 (client↔contact association). Adding it here would drag in `ContactoEntity`, `IContactServiceAdapter`, and the `contactos` table — all of which are out of scope for Epic 2.
- **Icons:** Heroicons only if needed (none required in 2.2 — labels are plain text).
- **Text:** ALL user-facing text in Spanish. Code (types, functions, files) in English.
- **Brand tokens:** `--color-brand-primary`, `--color-brand-tertiary` (already declared in `src/index.css`). Use Tailwind `slate-*` for neutrals. NO hex hard-coding.
- **Loading state:** `react-loading-skeleton` (installed) — NEVER a spinner. Same rule as Story 2.1.
- **Accessibility:** semantic `<dl>` for field pairs, `<article>` for the detail container, `<header>` inside. Focus ring on the `<Link>` back to list uses `focus-visible:ring-2 focus-visible:ring-[--color-brand-primary]`. `<Link>` items in the list already have min-h 44 px tap targets (preserved from Story 2.1's migration).

### TanStack Router — file-based deep linking

- Route file: `frontend/src/routes/_app/clientes.$clienteId.tsx` maps to URL `/clientes/{clienteId}`. The `$` prefix is TanStack Router's dynamic-parameter convention (`company-standards.md#TanStack Router Prefixes`).
- Route file: `frontend/src/routes/_app/clientes.index.tsx` maps to URL `/clientes` **exactly** — it takes the `<Outlet />` slot when no child param matches. This is the standard TanStack Router "index route" pattern; without it, `/clientes` would render the parent layout with no child, which is fine visually but breaks any future default-content expectations.
- Route file: `frontend/src/routes/_app/clientes.tsx` remains the parent layout — it renders `<ClienteListView />` (always) + `<Outlet />` (which fills with either `clientes.index.tsx`'s placeholder or `clientes.$clienteId.tsx`'s detail).
- `_app` prefix on all three files is a **pathless layout** (leading underscore per `company-standards.md`) — it does NOT add a `/_app` segment to the URL; it just groups the routes under the AppShell layout from Story 1.2.
- `Route.useParams()` inside the child route returns a typed `{ clienteId: string }`. No manual URL parsing, no zod schema on the param — Router owns the type.
- `activeProps` on `<Link>` is Router-driven — the active class is applied automatically whenever the current URL matches the `to` + `params`, so:
  - Clicking a list item navigates → item highlights (satisfies AC #1).
  - Loading `/clientes/{id}` directly in a new tab → matching item highlights on first paint (satisfies AC #2).
- `routeTree.gen.ts` is auto-regenerated by `@tanstack/router-vite-plugin` at build/dev time. Do NOT hand-edit it. If the file does not update, run `pnpm exec vite build --mode development` or restart the dev server so the plugin re-scans `src/routes/`.

### TanStack Query — patterns for `useCliente`

- **Query key:** `['clientes', clienteId]` — canonical per `architecture.md#TanStack Query keys` (line 279, 402, 630). Do NOT prefix, do NOT concat, do NOT wrap in an object.
- **`staleTime`:** `30_000` — same as `useClientes`. Prevents redundant re-fetches when the user toggles between list and detail during a session.
- **`retry`:** disabled specifically for HTTP 404 via the predicate form. On any other error (network, 5xx), the default retry (`3` attempts with exponential backoff) applies. Rationale: a 404 is a deterministic "resource does not exist" — retrying wastes bandwidth and delays the not-found UI state that the user should see immediately.
- **`isClienteNotFound(error)` helper:** the detail view uses this to branch between `<ClienteNotFound>` (404) and `<ErrorPanel>` (any other error). Export the helper from `useCliente.ts` so tests can import and assert against it directly.
- **Invalidation from other stories:** Stories 2.4 (edit) and 2.5 (delete) will invalidate both `['clientes']` AND `['clientes', clienteId]`. This story's `useCliente` must be resilient to invalidation-triggered refetches (it is — the standard `useQuery` behaviour handles refetch on cache invalidation).
- **Optimistic updates:** NOT applicable in Story 2.2 (read-only). Optimistic patterns land in 2.3/2.4/2.5.
- **AbortSignal:** propagated from TanStack Query into the Axios call, enabling automatic request cancellation when the route unmounts or when the query key changes (user clicks a different client while a request is in flight).

### Backend patterns

- **CQRS:** `GetClienteByIdQuery` (record) + `GetClienteByIdQueryHandler` (POCO). Mirrors `GetClientesQuery` from Story 2.1. No MediatR.
- **Repository:** `GetByIdAsync` returns `ClienteEntity?` (nullable). `AsNoTracking()` for the read path. Domain method returns null (not throw) on missing — the HTTP not-found decision is made in the endpoint (Task 3).
- **Minimal API + route constraint:** `MapGet("/{id:guid}", ...)`. The `:guid` constraint short-circuits non-GUID segments to a framework 404 without invoking the handler. Never use `[ApiController]` classes.
- **Problem Details on 404:** `Results.NotFound()` (parameter-less) triggers the `UseStatusCodePages(...)` middleware already wired in `Program.cs` (Story 1.3 / Story 2.1). That middleware emits `application/problem+json` with the correct RFC 7807 shape (`title`, `status`, `type`, `instance`). Do NOT hand-roll `Results.Problem(...)` — the middleware is the single source of truth.
- **NFR6 — no stack traces:** the framework middleware never emits `stackTrace` / `exception` fields. Integration test defensively asserts absence of those substrings in the response body.
- **DateTimeOffset:** unchanged from Story 2.1 — the DTO already carries `DateTimeOffset` fields serialized as ISO-8601 with offset.
- **DI:** `GetClienteByIdQueryHandler` registered as `Scoped`. `IClienteRepository` registration (Story 2.1) is reused.

### Search & filter — no changes

Search is entirely a Story 2.1 concern and remains untouched. Story 2.2 does NOT modify `<ClienteListView>` search logic, `useMemo` filter, `useDeferredValue` debounce, or any of the accent-insensitive normalization code. The only change to the list-panel side is that clicking an item now navigates to `/clientes/{id}` (via the migrated `<Link>` inside `<ClientListItem>`) instead of triggering a local `onSelect` callback.

### Layout & responsive behavior

- **Desktop (≥ 1024 px)**: 280 px left panel (from Story 2.1) + flex-1 right panel (`<Outlet />`). The `<Outlet />` renders either `clientes.index.tsx`'s placeholder (URL is `/clientes`) or `clientes.$clienteId.tsx`'s `<ClienteDetailView>` (URL is `/clientes/{id}`).
- **Mobile (< 1024 px)**: unchanged from Story 2.1. The 280 px panel is hidden via `hidden lg:flex`. On mobile, the detail view is technically reachable via deep-link but the list panel is hidden — this is acceptable for MVP (deferred to a later mobile master-detail refactor per Story 2.1 dev notes).
- **Scrolling**: the detail article uses `overflow-y-auto` so long payloads (once we add more fields in later stories) do not push the AppShell out of view.

### AppShell & routing integration

- `AppShell` (Story 1.2) wraps the entire route tree via `_app/*` pathless layout — no changes.
- `data-testid="clientes-view"` on the parent layout is PRESERVED — Epic 1 nav ATDD test relies on it.
- `data-testid="cliente-detail-placeholder"` moves from `clientes.tsx` inline JSX to `clientes.index.tsx`. Semantically identical (still shown when no client selected), but now file-scoped to the "index" route.
- `<Outlet />` in `clientes.tsx` is the extension point — no change from Story 2.1.
- `routeTree.gen.ts` will be regenerated to include `AppClientesClienteIdRoute` and `AppClientesIndexRoute` — this is a build-time concern owned by the Router Vite plugin.

### Testing conventions

- **Vitest + RTL + MSW**: reuse the Story 2.1 setup (`src/test/setup.ts`). The MSW server is already global; new handlers piggyback on the existing server. Reset handlers between tests (`beforeEach(() => server.resetHandlers())`).
- **`data-testid` selectors** (new for 2.2, keep these names — the Playwright page object references them):
  - `cliente-detail` — outer `<article>` of the detail view.
  - `cliente-detail-skeleton` — loading placeholder.
  - `cliente-detail-nombre` — the h2 title in the detail header.
  - `cliente-detail-field-nombre` — the `<dd>` for the Nombre row.
  - `cliente-detail-field-nit-ruc` — the `<dd>` for the NIT/RUC row.
  - `cliente-detail-field-telefono` — the `<dd>` for the Teléfono row.
  - `cliente-detail-field-ciudad` — the `<dd>` for the Ciudad row.
  - `cliente-not-found` — outer container of the not-found panel.
  - `cliente-not-found-back` — the "Volver a la lista" link.
- **`data-testid` selectors** (preserved from 2.1, do NOT rename):
  - `clientes-view`, `cliente-list-panel`, `cliente-list-search`, `cliente-list`, `cliente-list-item`, `cliente-list-skeleton`, `empty-state`, `error-panel`, `error-panel-retry`, `cliente-detail-placeholder`.
- **TanStack Query in tests**: create a fresh `QueryClient` per test with `defaultOptions: { queries: { retry: false, gcTime: 0 } }` to keep tests deterministic. For the 500-error retry test, override `retry` back to a small number.
- **TanStack Router in tests**: for `<ClientListItem>` tests that render the `<Link>` in isolation, wrap the render with a memory-history router that has a stub route tree containing `/clientes/$clienteId`. For `<ClienteDetailView>` tests, mount the component directly with `clienteId` as a prop (bypasses Router) — the route file is a thin wrapper and does not need its own test.
- **xUnit + TestContainers Postgres**: Story 1.3 / Story 2.1 pattern. Use `Xunit.SkippableFact` + Docker-availability probe to skip gracefully in Docker-less sandboxes. Document skips in Debug Log References.
- **Coverage target**: > 80 % on `useCliente`, `clienteApiRepository.getById`, `ClienteDetailView`, `ClienteNotFound`, updated `ClientListItem`.

### Scope discipline — what this story does NOT do

- No `POST /api/v1/clientes` endpoint — Story 2.3.
- No `PUT /api/v1/clientes/{id}` — Story 2.4.
- No `DELETE /api/v1/clientes/{id}` — Story 2.5.
- No Editar / Eliminar CTAs on `<ClienteDetailView>` — Stories 2.4 / 2.5.
- No Zod `clienteSchema.ts`, no `<ClienteForm>` — Stories 2.3 / 2.4.
- No `SortControl` on the list — Story 2.6.
- No `contactos` table, no `ContactoEntity`, no `ContactManager` component, no `ClienteContactServiceAdapter` — Epic 3 / Epic 4.
- No mobile master-detail rework — deferred per Story 2.1 dev notes.
- No dark-mode toggle, no i18n switcher, no auth — deferred per PRD.
- No microfrontend / single-SPA integration — MVP is a standalone SPA per `architecture.md`.
- No `Cache-Control`/`ETag` headers on the detail endpoint — deferred; TanStack Query's `staleTime` provides sufficient caching for MVP.

### Project Structure Notes

- Alignment: All new file paths follow `architecture.md#Complete Project Directory Structure` exactly. `_app/clientes.$clienteId.tsx` matches architecture line 459. `ClienteDetailView.tsx` under `modules/crm/clientes/presentation/` matches architecture line 478. `useCliente.ts` under `application/` matches the `queryKey: ['clientes', id]` mapping on line 279/402/630. `GetClienteByIdQueryHandler.cs` under `SiesaAgents.Application/Clientes/Queries/` matches the Story 2.1 pattern.
- Variance (intentional): `_app/clientes.index.tsx` is not explicitly listed in the architecture tree, but it is the standard TanStack Router "index" file pattern (mandatory whenever a parent layout renders `<Outlet />` and needs a default child for the bare-URL case). Adding it beside `clientes.tsx` is architecturally consistent — the file is a natural TanStack Router convention, not a variance from the corporate standard.
- Variance (intentional): `ClienteNotFound.tsx` under `frontend/src/shared/components/` sits beside `EmptyState.tsx` / `ErrorPanel.tsx`. Not in the architecture tree explicitly but consistent with the shared-components pattern established in Story 2.1. Rationale: a cross-cutting UI primitive for the "resource-shaped 404" case (once Epic 3 lands, `<ContactoDetailView>` will need the same panel — placing it in `shared/components` avoids future duplication).

### References

- Epic source + Story 2.2 AC: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Test design (TC-E2-P1-04, TC-E2-P1-05, TC-E2-P1-12): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Story 2.1 dev context — `<Outlet />`, `ClientListItem` migration, MSW handler shape, testids: [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Frontend + backend folder trees, TanStack Query keys, REST endpoints, DI order, `queryKey: ['clientes', id]`: [Source: _bmad-output/planning-artifacts/architecture.md]
- TanStack Router prefixes (`$` for dynamic param, `_` for pathless layout): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- FR30 deep linking: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#FR30]
- FR5 view client detail: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- NFR6 (no stack traces on error responses): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md]
- Frontend stack, folder structure, siesa-ui-kit rule, Spanish rule, snake_case conventions, `DateTimeOffset` mandate: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- `ExceptionHandlingMiddleware` + `UseStatusCodePages` Problem Details wiring (locked by Epic 1 tests): [Source: backend/src/SiesaAgents.API/Program.cs, backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs]
- Pre-existing Playwright `ClientesPage` page object + `clientes-crud.spec.ts`: [Source: e2e/tests/clientes/clientes-crud.spec.ts, e2e/pages/clientes.page.ts]
- Sandbox proxy caveat for TestContainers/Docker (Story 1.3 skip pattern): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
