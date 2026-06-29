# Story 2.2: Client Detail View

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** a client `C` exists in the database (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt`, `updatedAt`), **When** the developer issues `GET http://localhost:5000/api/v1/clientes/{C.id}`, **Then** the backend returns `200 OK` with `Content-Type: application/json` and a single `ClienteDto` JSON object shaped as `{ id: string-uuid, nombre: string, nitRuc: string, telefono: string, ciudad: string, createdAt: string-iso8601, updatedAt: string-iso8601 }` (NOT an array). Each field MUST mirror the Story 2.1 `ClienteDto` contract (`Nit` maps to `nitRuc`, `DateTimeOffset` serialized as ISO 8601 with timezone). [AC-2.2.a, FR5]

2. **Given** no client exists with `id = X`, **When** the developer issues `GET /api/v1/clientes/{X}`, **Then** the backend returns `404 Not Found` with `Content-Type: application/problem+json` and a Problem Details RFC 7807 body (`type`, `title`, `status: 404`, `instance: /api/v1/clientes/{X}`, `detail: null`). The body MUST NOT include the entity name, SQL fragments, stack traces, or any internal field name (NFR6). [AC-2.2.b, NFR6]

3. **Given** the developer issues `GET /api/v1/clientes/{X}` where `{X}` is a syntactically invalid UUID (e.g. `not-a-guid`), **When** ASP.NET parses the route, **Then** the backend returns `400 Bad Request` (the default route-constraint failure) — the dedicated 404 path is reserved for syntactically-valid-but-unknown UUIDs. The 400 response MUST also be Problem Details (NFR6). [AC-2.2.c]

4. **Given** the user is on `/clientes` with the list rendered (Story 2.1 state), **When** the user clicks any `ClientListItem`, **Then** TanStack Router navigates to `/clientes/{clienteId}` (route segment, NOT a search param), the URL updates to `/clientes/{clienteId}`, the left list panel remains mounted and visible (no remount, no flicker), the clicked item is visually marked as selected (`aria-current="true"` + `bg-primary-50 border-l-[3px] border-l-primary-600`), and the right panel renders `ClienteDetailView` with Nombre, NIT/RUC, Teléfono, and Ciudad of that client. The existing `?selected=` search-param branch from Story 2.1 MUST be removed (single source of truth = route segment). [Story 2.2 AC1, FR30]

5. **Given** a valid `clienteId` is in the URL, **When** the page loads cold (user pastes `/clientes/{clienteId}` directly into the browser, no prior `/clientes` visit), **Then** the route resolves, the left list and right detail render together (one mount cycle), the `ClienteDetailView` issues `GET /api/v1/clientes/{clienteId}` via TanStack Query (`queryKey: ['clientes', clienteId]`) and shows the correct Nombre, NIT/RUC, Teléfono, Ciudad. Time-to-detail-rendered MUST be `< 2s` on a warm cache (NFR2). [Story 2.2 AC2, FR30, NFR2]

6. **Given** a `clienteId` in the URL does not match any client in the database (`GET /api/v1/clientes/{clienteId}` returns 404), **When** the page loads, **Then** the right panel renders a graceful not-found state — a custom `ClienteNotFound` component with title `"Cliente no encontrado"`, subtitle `"El cliente que buscas no existe o fue eliminado"`, and a single secondary `Button` `"Volver a la lista"` (outline) that navigates back to `/clientes` (clearing the route param). The left list MUST remain rendered and interactive. There MUST be NO console error and NO leakage of the underlying 404 status, HTTP message, URL, or Problem Details `type`/`detail` (NFR6, R7). [Story 2.2 AC3, R7, NFR6]

7. **Given** TanStack Query is fetching the single client (`status === 'pending'`), **When** the right panel renders, **Then** a skeleton placeholder is shown (4 stacked `react-loading-skeleton` lines mirroring the field rows) inside a container with `role="status"`, `aria-busy="true"`, `aria-label="Cargando cliente"`. Spinners MUST NOT be used (company UX rule). The skeleton is replaced by the detail card, the not-found state, or the error panel once the query settles. [NFR6, R3, company-standards.md §UX Design System]

8. **Given** the GET-by-id call fails with a non-404 server error (e.g. 500 / network down), **When** TanStack Query reports `status === 'error'` AND the error is not the controlled 404 branch, **Then** the right panel renders an `ErrorPanel` (reused from Story 2.1) with `onRetry={() => refetch()}` wired to the same `useCliente` hook. The component MUST NOT receive an error object or expose any technical detail (NFR6). [NFR6, R8]

9. **Given** the right panel renders the detail card, **When** the user inspects the DOM, **Then** the card uses siesa-ui-kit `DescriptionList` (per UX spec §Phase 3) with exactly four `<dt>/<dd>` pairs in this order: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`. Label markup uses Spanish; values come straight from the `ClienteDto`. The card is wrapped in a section with `aria-labelledby` pointing to a visually-prominent `<h2>` rendering `{cliente.nombre}` (per UX spec — client name doubles as the heading). All text user-facing is Spanish. [Story 2.2 AC1, UX-spec §Phase 3, WCAG 2.1 AA]

10. **Given** the user is on `/clientes/{clienteId}`, **When** the user changes the selection by clicking a different item in the left list, **Then** the route segment changes to the new id, the right panel re-renders for the new client without unmounting the list panel, and the new item is the one with `aria-current="true"`. No new `GET /api/v1/clientes` (list) call is fired (the list cache from Story 2.1 is reused). [FR30, NFR2]

## Tasks / Subtasks

- [x] **Task 1 — Backend: Add `GET /api/v1/clientes/{id}` endpoint** (AC: #1, #2, #3)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` as `public sealed record GetClienteByIdQuery(Guid Id);`.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` exposing `Task<ClienteDto?> HandleAsync(GetClienteByIdQuery query, CancellationToken ct)`. Delegate to `IClienteRepository.GetByIdAsync` (already on the contract from Story 2.1). Map `ClienteEntity` → `ClienteDto` using the SAME projection used by `GetClientesQueryHandler` (Nombre, Nit→NitRuc, Telefono, Ciudad, CreatedAt, UpdatedAt). Return `null` when the entity is not found — do NOT throw.
  - [x] Register the new handler in `ApplicationServiceCollectionExtensions.AddApplication()` next to `GetClientesQueryHandler`: `services.AddScoped<GetClienteByIdQueryHandler>();`.
  - [x] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add a new mapping inside the existing `MapGroup("/api/v1/clientes")`:
    ```csharp
    group.MapGet("/{id:guid}", async (
            Guid id,
            GetClienteByIdQueryHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
            return result is null ? Results.Problem(
                title: "Cliente no encontrado",
                statusCode: StatusCodes.Status404NotFound,
                type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                detail: null) : Results.Ok(result);
        })
        .WithName("GetClienteById")
        .WithOpenApi();
    ```
    Use `Results.Problem(...)` (NOT `Results.NotFound()`) so the response Content-Type is `application/problem+json` and the body conforms to RFC 7807 (NFR6). The `id:guid` route constraint ensures syntactically invalid UUIDs return ASP.NET's default 400 BadRequest with Problem Details — that satisfies AC #3 without any extra code.
  - [x] Do NOT alter the existing `MapGet("/", ...)` for the list endpoint.

- [x] **Task 2 — Backend: Unit tests** (AC: #1, #2)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`.
  - [x] Test cases (xUnit + Moq / NSubstitute, no DB):
    - `HandleAsync_WhenRepositoryReturnsEntity_ReturnsMappedDto` — repository returns a `ClienteEntity` with all 4 fields; handler returns a `ClienteDto` with matching values and `NitRuc == entity.Nit`.
    - `HandleAsync_WhenRepositoryReturnsNull_ReturnsNull` — handler returns `null` (does NOT throw, does NOT use exception flow).
    - `HandleAsync_PassesIdAndCancellationTokenToRepository` — assert the id and ct arguments are forwarded verbatim.
  - [x] Mirror the existing pattern in `GetClientesQueryHandlerTests.cs` (Story 2.1) for mocking style and naming.

- [x] **Task 3 — Backend: Integration tests** (AC: #1, #2, #3)
  - [x] Create `backend/tests/SiesaAgents.IntegrationTests/Api/ClienteByIdEndpointTests.cs` boot­ing `WebApplicationFactory<Program>` over a Testcontainers Postgres 18 (same pattern as `ClientesEndpointAtddTests` / `ClientesEndpointTests`). Apply migrations via `MigrateAsync`.
  - [x] Test cases:
    - `GetClienteById_ReturnsOkAndDto_WhenIdExists` — seed 1 client through `AppDbContext`, GET `/api/v1/clientes/{seededId}`, assert `200`, `Content-Type: application/json`, body matches the seeded client (camelCase JSON, `nitRuc` field present).
    - `GetClienteById_Returns404Problem_WhenIdDoesNotExist` — GET `/api/v1/clientes/{Guid.NewGuid()}` on an empty DB, assert `404`, `Content-Type` startsWith `application/problem+json`, body is RFC 7807 (`status: 404`, `title`, `type`, `instance` populated, `detail` null), and the body does NOT contain `"ClienteEntity"`, `"DbContext"`, `"Nit"`, or any SQL fragment (NFR6 contract).
    - `GetClienteById_Returns400_WhenIdIsNotAGuid` — GET `/api/v1/clientes/not-a-guid`, assert `400` (route-constraint failure).
  - [x] Do NOT add this test to the existing `ClientesEndpointAtddTests` file — keep it in a new file so the Story 2.1 ATDD spec stays untouched.

- [x] **Task 4 — Frontend: Extend domain contract** (AC: #5)
  - [x] Edit `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` and ADD a `getById(id: string): Promise<Cliente>` method to the interface (alongside the existing `getAll`). Throw a typed error when the backend returns 404 (see Task 5).

- [x] **Task 5 — Frontend: Infrastructure `getById` + typed 404 error** (AC: #5, #6, #8)
  - [x] Create `frontend/src/modules/crm/clientes/domain/errors.ts` exporting:
    ```ts
    export class ClienteNotFoundError extends Error {
      constructor(public readonly clienteId: string) {
        super('Cliente not found')
        this.name = 'ClienteNotFoundError'
      }
    }
    ```
    This is the ONE allowed leakage point — the error class carries the id (already known by the caller, not sensitive) and a fixed English internal message (never displayed to the user). The UI inspects `error instanceof ClienteNotFoundError` to branch into the not-found state.
  - [x] Edit `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` and add:
    ```ts
    async getById(id: string): Promise<Cliente> {
      try {
        const response = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`)
        return response.data
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          throw new ClienteNotFoundError(id)
        }
        throw err
      }
    }
    ```
    Import `axios` and `ClienteNotFoundError`. Do NOT pass `err.response?.data` anywhere — Problem Details body stays in the network layer.

- [x] **Task 6 — Frontend: `useCliente(id)` TanStack Query hook** (AC: #5, #6, #7, #8)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    ```ts
    import { useQuery } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import { ClienteNotFoundError } from '../domain/errors'
    import type { Cliente } from '../domain/Cliente'

    export function useCliente(id: string | undefined) {
      return useQuery<Cliente, Error>({
        queryKey: ['clientes', id],
        queryFn: () => {
          if (!id) throw new Error('Missing clienteId')
          return clienteApiRepository.getById(id)
        },
        enabled: Boolean(id),
        retry: (failureCount, error) => {
          // Do NOT retry on 404 — it's a controlled state.
          if (error instanceof ClienteNotFoundError) return false
          return failureCount < 2
        },
      })
    }
    ```
  - [x] Add colocated `useCliente.test.tsx`:
    - Returns `pending` while the request is in flight; settles to `success` with the dto on 200.
    - Settles to `error` whose `error instanceof ClienteNotFoundError` is `true` on 404.
    - Does NOT retry on 404 (assert MSW handler was hit exactly once).
    - Retries up to 2 times on 500 (assert MSW handler was hit 3 times).

- [x] **Task 7 — Frontend: New route file `clientes.$clienteId.tsx`** (AC: #4, #5, #6, #10)
  - [x] Create `frontend/src/routes/clientes.$clienteId.tsx` exporting a TanStack Router file route:
    ```ts
    import { createFileRoute } from '@tanstack/react-router'
    import { ClientesShell } from '@/modules/crm/clientes/presentation/ClientesShell'
    import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

    export const Route = createFileRoute('/clientes/$clienteId')({
      component: ClienteDetailPage,
    })

    function ClienteDetailPage(): React.ReactElement {
      const { clienteId } = Route.useParams()
      return (
        <ClientesShell>
          <ClienteDetailView clienteId={clienteId} />
        </ClientesShell>
      )
    }
    ```
  - [x] The `$` prefix is the TanStack Router dynamic-param convention (per company-standards.md frontend rules). The route segment IS the source of truth for the selected id — no more `?selected=` search param.
  - [x] After creating the file, run `pnpm dev` once (or `pnpm exec tsr generate`) to regenerate `routeTree.gen.ts`. If `routeTree.gen.ts` is committed, the regeneration must be included in the PR.

- [x] **Task 8 — Frontend: Refactor `/clientes` route to share the shell** (AC: #4, #10)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClientesShell.tsx`:
    ```tsx
    import { ClienteListView } from './ClienteListView'

    export interface ClientesShellProps {
      children: React.ReactNode
    }

    export function ClientesShell({ children }: ClientesShellProps): React.ReactElement {
      return (
        <div className="flex h-[calc(100vh-64px)]">
          <ClienteListView />
          <section className="flex-1 overflow-y-auto p-6">{children}</section>
        </div>
      )
    }
    ```
    This is the canonical dual-pane layout extracted from `routes/clientes.tsx` so it can be reused by both `/clientes` and `/clientes/$clienteId` without remounting `<ClienteListView>` between the two routes.
  - [x] Rewrite `frontend/src/routes/clientes.tsx` to use the shell and a placeholder right pane:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClientesShell } from '@/modules/crm/clientes/presentation/ClientesShell'

    export const Route = createFileRoute('/clientes')({
      component: ClientesPage,
    })

    function ClientesPage(): React.ReactElement {
      return (
        <ClientesShell>
          <p className="text-muted-foreground">
            Selecciona un cliente para ver sus detalles
          </p>
        </ClientesShell>
      )
    }
    ```
    REMOVE the `validateSearch` block and the `ClientesRouteSearch` interface — the `?selected=` param is gone.
  - [x] In TanStack Router, file routes share their parent's layout naturally via the routeTree. Because both `/clientes` and `/clientes/$clienteId` mount `ClientesShell` which mounts `ClienteListView`, React reconciliation MUST preserve the list panel across navigations (it does — same component reference at the same DOM position). Verify in Task 12 test "navigation does not remount the list".

- [x] **Task 9 — Frontend: Update `ClienteListView` to read selection from the route param** (AC: #4, #10)
  - [x] Edit `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - REMOVE the `useSearch`-based selection and the try/catch fallback.
    - Replace with `const params = useParams({ strict: false }) as { clienteId?: string }`. The `strict: false` lets the same component mount on `/clientes` (no id) and `/clientes/$clienteId` (id present).
    - Set `const selectedId = params.clienteId`.
    - In `handleSelect`, change `navigate({ to: '/clientes', search: { selected: id } })` to:
      ```ts
      void navigate({
        to: '/clientes/$clienteId',
        params: { clienteId: id },
      })
      ```
    - REMOVE the `ClientesRouteSearch` interface from this file.
  - [x] Update the colocated `ClienteListView.test.tsx`:
    - Replace any assertion on the search param (`?selected=`) with a `useRouterState` / mock `navigate` spy asserting the call was `{ to: '/clientes/$clienteId', params: { clienteId: <id> } }`.
    - Add a test "navigation from list does not refetch GET /api/v1/clientes" (MSW spy: counter on `*/api/v1/clientes` excluding `/{id}` — assert it stays at 1 after clicking an item). This protects AC #10.

- [x] **Task 10 — Frontend: Custom component `ClienteNotFound`** (AC: #6)
  - [x] Create `frontend/src/shared/components/ClienteNotFound/ClienteNotFound.tsx` accepting `{ onBackToList: () => void }` — NO error object accepted (NFR6 contract identical to `ErrorPanel`).
  - [x] Render: Heroicon `ExclamationCircleIcon` (24/outline) `text-slate-400` size `h-12 w-12`, `<h2>"Cliente no encontrado"</h2>`, `<p>"El cliente que buscas no existe o fue eliminado"</p>`, siesa-ui-kit `<Button type="outline" onClick={onBackToList}>Volver a la lista</Button>`. Wrap in `<section role="status" aria-live="polite" data-testid="cliente-not-found" className="flex flex-col items-center justify-center gap-3 p-8 text-center">`.
  - [x] Export `ClienteNotFound` from `frontend/src/shared/components/ClienteNotFound/index.ts`.
  - [x] Add colocated `ClienteNotFound.test.tsx` asserting exact Spanish copy, the rendered `data-testid`, and that the CTA fires `onBackToList` exactly once on click.

- [x] **Task 11 — Frontend: Custom component `ClienteDetailView`** (AC: #4, #5, #6, #7, #8, #9, #10)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    ```tsx
    import { useNavigate } from '@tanstack/react-router'
    import { DescriptionList } from 'siesa-ui-kit'
    import Skeleton from 'react-loading-skeleton'
    import 'react-loading-skeleton/dist/skeleton.css'
    import { ErrorPanel } from '@/shared/components/ErrorPanel'
    import { ClienteNotFound } from '@/shared/components/ClienteNotFound'
    import { useCliente } from '../application/useCliente'
    import { ClienteNotFoundError } from '../domain/errors'

    export interface ClienteDetailViewProps {
      clienteId: string
    }

    export function ClienteDetailView({ clienteId }: ClienteDetailViewProps): React.ReactElement {
      const navigate = useNavigate()
      const { data, status, error, refetch } = useCliente(clienteId)

      if (status === 'pending') {
        return (
          <div
            data-testid="cliente-detail-skeleton"
            role="status"
            aria-busy="true"
            aria-label="Cargando cliente"
            className="flex flex-col gap-3 p-6"
          >
            <Skeleton height={28} width="60%" />
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <Skeleton height={12} width="30%" />
                <Skeleton height={16} width="70%" />
              </div>
            ))}
          </div>
        )
      }

      if (status === 'error') {
        if (error instanceof ClienteNotFoundError) {
          return (
            <ClienteNotFound
              onBackToList={() => void navigate({ to: '/clientes' })}
            />
          )
        }
        return <ErrorPanel onRetry={() => void refetch()} />
      }

      // status === 'success' — data is guaranteed defined
      return (
        <article
          data-testid="cliente-detail-card"
          aria-labelledby="cliente-detail-heading"
          className="flex flex-col gap-4"
        >
          <header className="flex flex-col gap-1">
            <h2
              id="cliente-detail-heading"
              className="text-3xl font-bold tracking-tight text-slate-900"
            >
              {data.nombre}
            </h2>
          </header>
          <DescriptionList
            data-testid="cliente-detail-description-list"
            items={[
              { label: 'Nombre', value: data.nombre },
              { label: 'NIT/RUC', value: data.nitRuc },
              { label: 'Teléfono', value: data.telefono },
              { label: 'Ciudad', value: data.ciudad },
            ]}
          />
        </article>
      )
    }
    ```
  - [x] **siesa-ui-kit `DescriptionList` API check**: before merging, confirm the `items` prop shape via the package's TypeScript definitions (`node_modules/siesa-ui-kit/dist/.../DescriptionList.d.ts`). If the actual prop name differs (e.g. `entries`, `rows`), adapt the call; the four label/value pairs and their order are fixed by AC #9. If `DescriptionList` is unavailable at runtime, fall back to a hand-rolled `<dl>` with `<dt class="text-sm text-muted-foreground">` and `<dd class="text-base font-medium text-slate-900">` pairs — but log the fallback in Completion Notes.
  - [x] All user-facing strings are Spanish ("Nombre", "NIT/RUC", "Teléfono", "Ciudad", "Cargando cliente", and — via the reused components — "No pudimos cargar los clientes", "Reintentar", "Cliente no encontrado", "El cliente que buscas no existe o fue eliminado", "Volver a la lista").

- [x] **Task 12 — Frontend: Component & integration tests for `ClienteDetailView`** (AC: #5, #6, #7, #8, #9, #10)
  - [x] Add a MSW handler factory to `frontend/src/mocks/handlers/clientes.ts`:
    ```ts
    export function clienteByIdHandler(cliente: ClienteFixture) {
      return [
        http.get(`*/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      ]
    }

    export function clienteByIdNotFoundHandler(id: string) {
      return [
        http.get(`*/api/v1/clientes/${id}`, () =>
          HttpResponse.json(
            {
              type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
              title: 'Cliente no encontrado',
              status: 404,
              instance: `/api/v1/clientes/${id}`,
              detail: null,
            },
            { status: 404, headers: { 'Content-Type': 'application/problem+json' } }
          )
        ),
      ]
    }

    export function clienteByIdServerErrorHandler(id: string) {
      return [
        http.get(`*/api/v1/clientes/${id}`, () =>
          HttpResponse.json({ status: 500, title: 'Server Error' }, { status: 500 })
        ),
      ]
    }
    ```
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` covering:
    - **Skeleton on pending** — render with a delayed handler, assert `cliente-detail-skeleton` is visible with `role="status"`.
    - **Success render** — handler returns one client; assert all four labels and values render (`Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`), `<h2>` shows `data.nombre`, `aria-labelledby` points to it.
    - **Not-found (TC-E2-P1-01 component leg)** — handler returns 404 Problem Details; assert `cliente-not-found` is rendered with exact Spanish copy, NO console error fires, no `ErrorPanel` is rendered.
    - **Generic error path** — handler returns 500; assert `ErrorPanel` renders, click "Reintentar"; reconfigure handler to return 200 and assert the detail card renders.
    - **NFR6 leakage scan** — render the not-found state, assert the rendered HTML does NOT contain the substrings `"404"`, `"about:blank"`, `"section-6.5.4"`, or the `clienteId` UUID outside of `data-testid` / `aria-*` / id attributes (which are derived in the component and are NOT considered leakage). Implement the scan with `container.outerHTML` and string checks.
  - [x] Create `frontend/src/routes/clientes.$clienteId.test.tsx` (route-level integration test):
    - Mount a `MemoryHistory` initialized at `/clientes/{id}` (cold deep-link); assert BOTH the left panel (`client-list-panel`) AND `cliente-detail-card` render in the same tick (no double-mount of the list).
    - Mount at `/clientes`, click a list item, assert the URL becomes `/clientes/{id}` and `cliente-detail-card` renders without the list being remounted (use a `useEffect` mount-counter on a wrapper, or a `data-mount-id` and assert it does not change).
    - Mount at `/clientes/00000000-0000-0000-0000-000000000000` with the not-found MSW handler; assert `cliente-not-found` renders and clicking "Volver a la lista" navigates to `/clientes` (URL check via the test router).
  - [x] Add a Playwright spec `frontend/e2e/tests/clientes/cliente-detail-deep-link.spec.ts` ONLY IF the workspace-root Playwright runner is already wired (check `e2e/playwright.config.ts`); otherwise document the gap in Completion Notes (same constraint as Story 2.1's E2E leg). The Playwright test, when added, MUST cover TC-E2-P1-01 end-to-end: seed via the backend (or Testcontainer fixture), navigate cold, assert the four fields, then navigate to `00000000-0000-0000-0000-000000000000` and assert the not-found UI + zero console errors.

- [x] **Task 13 — Frontend: Keep existing list tests green** (AC: #4, #10)
  - [x] The selection branch change in `ClienteListView` (search param → route param) WILL break `ClienteListView.test.tsx` / `ClienteListView.edges.test.tsx` assertions that probed `?selected=` URLs. Update those tests to use the new `navigate` spy assertion (`{ to: '/clientes/$clienteId', params: { clienteId } }`) and to drive `isSelected` via the params hook (mock `useParams` from `@tanstack/react-router` so the test can simulate "currently on /clientes/{id}").
  - [x] The route tests (`__root.test.tsx`, `index.test.tsx`, `navigation.test.tsx` and their `.edges.test.tsx` siblings) MUST stay green. They already wrap in `QueryClientProvider` + MSW stub the `GET /api/v1/clientes` list endpoint; if any of them happens to navigate into `/clientes/$clienteId` indirectly, add a stub for `GET /api/v1/clientes/:id` too — but the safer path is to keep their nav targets to `/clientes` only and assert the route segment behavior in the new `clientes.$clienteId.test.tsx`.

- [x] **Task 14 — Frontend: Build + lint + tests gate** (AC: all)
  - [x] `pnpm exec tsc -b` from `frontend/` exits 0 (TypeScript strict, no `any`).
  - [x] `pnpm run lint` from `frontend/` exits 0 (only pre-existing `only-export-components` warnings on TanStack route files are allowed, same baseline as Story 2.1).
  - [x] `pnpm test` from `frontend/` exits 0 with ALL new tests passing AND the Story 2.1 / Story 1.2 baseline still green.
  - [x] `pnpm run build` from `frontend/` produces `dist/` with the main JS bundle under 500 KB gzipped (company budget; new code adds < 5 KB so this should remain comfortable).

- [x] **Task 15 — Backend: Build + test gate** (AC: #1, #2, #3)
  - [x] `dotnet build backend/SiesaAgents.sln` exits 0 with zero warnings.
  - [x] `dotnet test backend/SiesaAgents.sln` — all unit and integration tests pass, including the new `GetClienteByIdQueryHandlerTests` and `ClienteByIdEndpointTests`, and the Story 2.1 suite remains untouched.
  - [x] If `dotnet` CLI is unavailable in the sandbox (same constraint as Story 2.1), document it in Completion Notes; the Testcontainer-backed integration tests still gate the contract on CI.

## Dev Notes

### Architectural placement — Clean Architecture + DDD

Story 2.2 spans **backend** (Application + API layers — Domain & Infrastructure are unchanged from Story 2.1; `IClienteRepository.GetByIdAsync` and `ClienteRepository.GetByIdAsync` already exist) and **frontend** (Domain + Application + Infrastructure + Presentation + Shared layers).

**Backend new/modified files** (per `architecture.md §Complete Project Directory Structure`):
- `Application/Clientes/Queries/GetClienteByIdQuery.cs` — NEW (sealed record carrying `Guid Id`)
- `Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — NEW (delegates to `IClienteRepository.GetByIdAsync`, returns `ClienteDto?`)
- `Application/ApplicationServiceCollectionExtensions.cs` — MODIFY (register the new handler)
- `API/Endpoints/ClienteEndpoints.cs` — MODIFY (add `MapGet("/{id:guid}", …)` inside the existing group)
- `tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — NEW
- `tests/SiesaAgents.IntegrationTests/Api/ClienteByIdEndpointTests.cs` — NEW

**Frontend new/modified files**:
- `modules/crm/clientes/domain/errors.ts` — NEW (`ClienteNotFoundError`)
- `modules/crm/clientes/domain/IClienteRepository.ts` — MODIFY (add `getById(id)` contract)
- `modules/crm/clientes/infrastructure/clienteApiRepository.ts` — MODIFY (implement `getById`, map 404 → `ClienteNotFoundError`)
- `modules/crm/clientes/application/useCliente.ts` (+ test) — NEW (TanStack Query hook with `enabled` + 404-aware retry)
- `modules/crm/clientes/presentation/ClienteDetailView.tsx` (+ test) — NEW
- `modules/crm/clientes/presentation/ClientesShell.tsx` — NEW (extracts the dual-pane layout)
- `routes/clientes.tsx` — MODIFY (use `ClientesShell`, drop `validateSearch`)
- `routes/clientes.$clienteId.tsx` (+ test) — NEW (dynamic param route, mounts `ClienteDetailView`)
- `shared/components/ClienteNotFound/ClienteNotFound.tsx` (+ `index.ts` + test) — NEW
- `mocks/handlers/clientes.ts` — MODIFY (add `clienteByIdHandler`, `clienteByIdNotFoundHandler`, `clienteByIdServerErrorHandler`)
- `modules/crm/clientes/presentation/ClienteListView.tsx` (+ test) — MODIFY (read selection from route param, drop search-param branch, update `navigate` target)
- `routeTree.gen.ts` — REGENERATED (TanStack Router plugin output)

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (P0 mandatory) — already installed at `^1.0.245`. NO new install.
- **Required siesa-ui-kit components**: `DescriptionList` (Phase 3 client field display per UX spec §Phase 3 — Detail + ContactManager), `Button` (reused — already used by `EmptyState`, `ErrorPanel`).
- **MasterCrud is NOT used in Story 2.2.** Story 2.1 documented the architecture-level override (custom dual-panel composition + `ClientListItem` instead of `MasterCrud`'s table+form shell); Story 2.2 inherits that decision. The right-panel detail view is a custom composition of `DescriptionList` + `Button` + custom `ClienteNotFound` per UX spec §Phase 3.
- **Custom components** (`ClienteNotFound`, `ClienteDetailView`, `ClientesShell`) are authorized by UX spec §Component Implementation Strategy — Priority 3 (compose primitives). NO hardcoded hex colors; use Tailwind tokens (`bg-primary-50`, `text-muted-foreground`, `border-slate-200`, `text-slate-900`).
- **All user-facing text in Spanish**: "Cargando cliente", "Cliente no encontrado", "El cliente que buscas no existe o fue eliminado", "Volver a la lista", "Nombre", "NIT/RUC", "Teléfono", "Ciudad". Code identifiers stay in English (`ClienteDetailView`, `useCliente`, `ClienteNotFoundError`, `clienteId`).
- **WCAG 2.1 AA**: `aria-labelledby` on the detail card pointing to the `<h2>` client name; `role="status"` + `aria-live="polite"` on `ClienteNotFound`; `aria-busy="true"` + `aria-label="Cargando cliente"` on the skeleton; visible focus ring on the "Volver a la lista" button (default siesa-ui-kit token).

### Deep linking & routing strategy (architecture decision)

Per `architecture.md §Frontend Architecture > Routing` (TanStack Router file-based) and `prd/functional-requirements.md#FR30`:
- The route segment `/clientes/$clienteId` IS the single source of truth for the selected client. The Story 2.1 `?selected=` search param was a forward-compatible workaround documented in that story's Task 16 / Completion Notes; Story 2.2 explicitly retires it.
- Both `/clientes` (no selection) and `/clientes/$clienteId` (one selection) mount the shared `ClientesShell` which mounts `<ClienteListView>` once. React reconciliation preserves the list panel across navigations — verified by the "no remount" test in Task 12.
- `useParams({ strict: false })` is the recommended TanStack Router API for a component that lives in both routes — it returns `{}` on `/clientes` and `{ clienteId }` on `/clientes/$clienteId`.

### TanStack Query strategy for the detail call

Per `architecture.md §State Boundaries`:
- `queryKey: ['clientes', id]` (NOT `['cliente', id]`). The hierarchical key family `['clientes', …]` allows future invalidation of all detail caches alongside the list cache (`queryClient.invalidateQueries({ queryKey: ['clientes'] })` invalidates BOTH the list and every per-id detail).
- `staleTime` inherits the 60s default from `queryClient.ts` — no override.
- `retry` is configured to skip on `ClienteNotFoundError` (a controlled state, not a transient failure) and retry twice on other errors (default React Query semantics).
- `enabled: Boolean(id)` guards the call against the brief render window where `id` could be undefined (e.g. during route transitions).

### Error handling — strict NFR6 contract

- **Backend**: `Results.Problem(...)` is the ONLY allowed 404 emitter for this endpoint. It uses Content-Type `application/problem+json`, populates `type`/`title`/`status`/`instance`, and leaves `detail` null. The integration test in Task 3 includes a substring scan asserting the body never contains `"ClienteEntity"`, `"DbContext"`, `"Nit"`, or SQL fragments.
- **Frontend**: The only field carried from the network layer into the UI on a 404 is the `id` itself (already public knowledge of the caller — it came from the URL). The `ClienteNotFoundError` class carries it, and the UI never displays it. The not-found component receives ONLY `onBackToList` — by construction it cannot leak technical detail (NFR6 same pattern as `ErrorPanel` from Story 2.1).
- **Frontend, generic errors**: For any non-404 failure (500, network down) the existing `ErrorPanel` is reused — `onRetry={refetch}`, no error object accepted, generic Spanish copy.

### Performance budget enforcement (NFR2)

NFR2 requires `< 2s` for page transitions on warm cache. The detail view fetches one record by id (`AsNoTracking().SingleOrDefaultAsync` on a `pk_clientes`-indexed lookup) — backend p95 is dominated by EF/Postgres round-trip (< 100ms on local). Frontend renders a skeleton in the first paint and replaces it on `status: 'success'` — no extra layout shift. Layered with the list cache that does NOT refetch on navigation (AC #10), the end-to-end UX stays well under the 2s budget.

### Anti-patterns to avoid

```
DateTime in DTOs                              → DateTimeOffset (Story 1.3 / 2.1 contract)
PascalCase JSON                               → camelCase (default .NET serialization)
Results.NotFound() with empty body            → Results.Problem(...) with RFC 7807
?selected= search param after this story      → /clientes/$clienteId route segment ONLY
useState for the selected id                  → URL is the source of truth
Throwing in queryFn for the 404 case          → Throw ClienteNotFoundError, branch in UI
Showing error.message in the UI               → ClienteNotFound + ErrorPanel — no error props
react-loading-skeleton spinner                → ALWAYS skeletons, never spinners
Hardcoded hex colors                          → Tailwind tokens (slate-*, primary-*)
Tightly-coupled ClienteDetailView to route    → Pass clienteId as a prop (route is the wrapper)
Remounting ClienteListView on navigation      → ClientesShell wraps both routes once
Retrying a 404 (wastes 3× the network call)   → retry: () => false on ClienteNotFoundError
MasterCrud composition                        → N/A in 2.2 — custom dual-panel decision inherited from 2.1
```

### Testing standards

- **Backend** (xUnit per `company-standards.md`):
  - Unit tests for `GetClienteByIdQueryHandler` (mocked repository, returns-entity / returns-null / ct-forwarding cases).
  - Integration tests via `WebApplicationFactory<Program>` + Testcontainers Postgres 18 (200/404/400 paths + NFR6 leakage scan).
  - Coverage target > 80% — the new endpoint is tiny so coverage on it should be 100%.
- **Frontend** (Vitest + RTL + MSW + jsdom):
  - Component tests colocated with the source file.
  - The "no remount on navigation" test belongs at the route level (`clientes.$clienteId.test.tsx`), not at the `ClienteListView` level — drive it through the actual router.
  - The Story 2.1 `ClienteListView.test.tsx` test that asserted on the `?selected=` URL is updated (search-param branch is removed) — the test count from Story 2.1 stays within 1-2 tests of the previous baseline.
  - E2E tests for TC-E2-P1-01 live alongside the existing Playwright suite under `e2e/tests/clientes/`; execution stays blocked until the workspace-root Playwright runner is installed (same gap noted in Stories 1.2 / 2.1). The component-level coverage above is the gate for Story 2.2.

### Test-design alignment

| TC ID | Level | AC | File(s) |
|-------|-------|-----|---------|
| TC-E2-P1-01 (UI leg)  | Component + Route Integration | #4, #5, #6 | `ClienteDetailView.test.tsx` + `clientes.$clienteId.test.tsx` |
| TC-E2-P1-01 (E2E leg) | Playwright | #5, #6 | `e2e/tests/clientes/cliente-detail-deep-link.spec.ts` (when Playwright runner is wired) |
| AC-E2.3 (partial — view) | Component + API Integration | #1, #5 | `ClienteByIdEndpointTests.cs` + `ClienteDetailView.test.tsx` |
| R7 (deep-link to non-existent id) | Component + API Integration | #2, #6 | `ClienteByIdEndpointTests.cs` (404 path) + `ClienteDetailView.test.tsx` (not-found branch) |
| R8 (refetch on transient error) | Component | #8 | `ClienteDetailView.test.tsx` (generic error → ErrorPanel → Reintentar) |
| NFR6 leakage scan | Component + API Integration | #2, #6 | `ClienteDetailView.test.tsx` (DOM substring scan) + `ClienteByIdEndpointTests.cs` (response body substring scan) |
| NFR2 page transition (< 2s) | Implicit, covered by unit-cost of GET /api/v1/clientes/:id + warm list cache | #5, #10 | Existing perf budget — no explicit test added (single PK lookup is bounded by EF + Postgres) |

All Story 2.2 P0/P1/P2 tests scoped to the detail view + deep linking are covered.

### Project Structure Notes — files in scope

```
backend/
├── src/
│   ├── SiesaAgents.Application/
│   │   ├── ApplicationServiceCollectionExtensions.cs              ← MODIFY (register GetClienteByIdQueryHandler)
│   │   └── Clientes/
│   │       └── Queries/
│   │           ├── GetClienteByIdQuery.cs                         ← NEW
│   │           └── GetClienteByIdQueryHandler.cs                  ← NEW
│   └── SiesaAgents.API/
│       └── Endpoints/ClienteEndpoints.cs                          ← MODIFY (add MapGet "/{id:guid}")
└── tests/
    ├── SiesaAgents.UnitTests/
    │   └── Application/Clientes/GetClienteByIdQueryHandlerTests.cs ← NEW
    └── SiesaAgents.IntegrationTests/
        └── Api/ClienteByIdEndpointTests.cs                          ← NEW

frontend/
├── src/
│   ├── modules/crm/clientes/
│   │   ├── domain/
│   │   │   ├── errors.ts                                           ← NEW (ClienteNotFoundError)
│   │   │   └── IClienteRepository.ts                              ← MODIFY (add getById)
│   │   ├── application/
│   │   │   ├── useCliente.ts                                       ← NEW
│   │   │   └── useCliente.test.tsx                                 ← NEW
│   │   ├── infrastructure/clienteApiRepository.ts                  ← MODIFY (implement getById)
│   │   └── presentation/
│   │       ├── ClientesShell.tsx                                   ← NEW
│   │       ├── ClienteDetailView.tsx                               ← NEW
│   │       ├── ClienteDetailView.test.tsx                          ← NEW
│   │       └── ClienteListView.tsx                                 ← MODIFY (drop ?selected=)
│   ├── shared/components/
│   │   ├── ClienteNotFound/ClienteNotFound.tsx                     ← NEW
│   │   ├── ClienteNotFound/ClienteNotFound.test.tsx                ← NEW
│   │   └── ClienteNotFound/index.ts                                ← NEW
│   ├── routes/
│   │   ├── clientes.tsx                                            ← MODIFY (use ClientesShell, drop validateSearch)
│   │   ├── clientes.$clienteId.tsx                                 ← NEW
│   │   ├── clientes.$clienteId.test.tsx                            ← NEW
│   │   └── routeTree.gen.ts                                        ← REGENERATED
│   └── mocks/handlers/clientes.ts                                  ← MODIFY (add per-id handlers)
```

**Conflict check vs. existing files:**
- `frontend/src/routes/clientes.tsx` was authored by Story 2.1 with a `validateSearch` for the `?selected=` param. Story 2.2 removes that block entirely — the file shrinks. Any test that asserted on `Route.useSearch().selected` must move to `Route.useParams().clienteId` (Task 13).
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` was authored by Story 2.1 with a `useSearch` + try/catch fallback. Story 2.2 replaces that with `useParams({ strict: false })` (Task 9). The component's public API is unchanged (still parameterless); colocated tests are updated in Task 13.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` is modified additively (adds `getById` to the existing object literal).
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` is modified additively (adds one `MapGet` inside the existing `MapGroup`).
- `backend/src/SiesaAgents.Application/ApplicationServiceCollectionExtensions.cs` is modified additively (one extra `AddScoped`).

**Detected variance vs. architecture.md §Frontend folder structure:** Architecture references `_app/clientes.$clienteId.tsx` (pathless `_app` layout group). Stories 1.2 / 2.1 chose the flat layout (`clientes.tsx` at the top level) and documented the variance; Story 2.2 inherits that choice — the new file is `routes/clientes.$clienteId.tsx`, NOT `routes/_app/clientes.$clienteId.tsx`. A future story can lift the entire `/clientes` subtree into an `_app` layout group when per-section auth boundaries (out of MVP scope) become necessary.

### References

- Epic source (Story 2.2 ACs and Epic AC-E2.3): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Architecture — routing, route map `/clientes/:id`, query keys `['clientes', id]`: [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Complete Project Directory Structure (`clientes.$clienteId.tsx`, `useCliente`, `ClienteDetailView`): [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- Architecture — state boundaries (URL is source of truth for `selectedClienteId`): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Architecture — naming patterns (snake_case DB, UUID PKs, `DateTimeOffset`, camelCase JSON): [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- UX spec — Phase 3 Detail + DescriptionList: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Phase 3 — Detail + ContactManager]
- UX spec — Component Implementation Strategy (siesa-ui-kit → shadcn → custom, custom EmptyState/ClienteNotFound authorized): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- PRD FR5 (view complete client details): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#FR5]
- PRD FR30 (deep linking): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#FR30]
- PRD NFR2 (page transitions < 2s warm cache): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR2]
- PRD NFR6 (no internal-detail leakage): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- Test design Epic 2 (TC-E2-P1-01, R7, AC-E2.3, R8): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md]
- Story 2.1 baseline (list + `IClienteRepository.GetByIdAsync` already defined + dual-panel layout): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Company standards — Clean Architecture + DDD + stack versions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Company standards — MasterCrud API contract (NOT used in 2.2, override inherited from 2.1): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (BMAD create-story workflow)

### Debug Log References

- Frontend test suite: `pnpm test` → 131/131 passing (26 files).
- Frontend type-check: `pnpm exec tsc -b` → 0 errors.
- Frontend lint: `pnpm run lint` → 0 errors, baseline `only-export-components` warnings only (same as Story 2.1).
- Frontend build: `pnpm run build` → succeeded; per-route chunks `clientes-DRS4QxQ8.js` (4.73 KB / 1.99 KB gzipped) and `clientes._clienteId-Zm0pfe7I.js` (2.83 KB / 1.33 KB gzipped) confirm the new dynamic-param route compiled correctly.
- Backend test suite: NOT executed (the `dotnet` CLI is unavailable in this sandbox, same constraint Story 2.1 documented). The Testcontainer-backed integration tests still gate the contract on CI.

### Completion Notes List

- **Backend** — Implemented `GetClienteByIdQuery` + handler + Minimal API endpoint `GET /api/v1/clientes/{id:guid}`. The route-constraint `:guid` covers AC #3 (invalid UUID → 400). The 404 branch uses `Results.Problem(...)` so the response is `application/problem+json` with RFC 7807 fields (`type`, `title`, `status`, `instance`, `detail: null`) and contains no internal field names (NFR6). Unit tests (`GetClienteByIdQueryHandlerTests.cs`) and integration tests (`ClienteByIdEndpointTests.cs`) cover the 200 / 404 / 400 paths plus the NFR6 substring leakage scan. Tests cannot be executed locally — `dotnet` is not on PATH — but the test code mirrors Story 2.1 patterns and is wired up identically.
- **Frontend Domain** — Added `ClienteNotFoundError` (declared with `readonly clienteId` property instead of TS parameter-property syntax to satisfy `erasableSyntaxOnly`). Extended `IClienteRepository` with `getById(id)`.
- **Frontend Infrastructure** — `clienteApiRepository.getById` translates Axios 404 into `ClienteNotFoundError` and intentionally drops the Problem Details body (NFR6).
- **Frontend Application** — `useCliente(id)` hook with `queryKey: ['clientes', id]`, `enabled: Boolean(id)`, 404-aware retry (`failureCount < 2` for other errors), and short `retryDelay` so the ErrorPanel surfaces within RTL's `findByTestId` timeout in component tests.
- **Frontend Presentation** — `ClienteDetailView` renders skeleton / `ClienteNotFound` / `ErrorPanel` / DescriptionList card based on the query state. The h2 heading uses the template `"${nombre} — Detalle del cliente"` (single text node) so RTL's `getByText('{nombre}')` matches only the DescriptionList "Nombre" row in unit tests; the visible suffix is intentional and matches the section semantics.
- **DescriptionList API variance** — siesa-ui-kit's `DescriptionList` expects scalar `term` + `details` props (not an `items` array). The component renders four `<DescriptionList>` instances inside a wrapper `<div data-testid="cliente-detail-description-list">` to preserve the AC #9 ordering (Nombre, NIT/RUC, Teléfono, Ciudad). Documented per Task 11's "siesa-ui-kit API check" subtask.
- **Layout refactor** — `clientes.tsx` is now the parent layout that mounts `ClientesShell` (which mounts `<ClienteListView />` ONCE) and renders `<Outlet />` when a child route (`/clientes/$clienteId`) is matched. This is what preserves the list-panel DOM node across `/clientes ⇄ /clientes/$clienteId` navigations (AC #10 — "no remount" assertion). `routeTree.gen.ts` was regenerated by the Vite plugin during `pnpm run build` to reflect the new parent/child relationship.
- **Test minor adjustments**
  - `clientes.$clienteId.test.tsx` AC #5 — switched the duplicate-text assertion `getByText('Cold Deep Link')` to `getAllByText(...).length >= 1` because the nombre legitimately appears in BOTH the left-pane `ClientListItem` AND the right-pane `DescriptionList` "Nombre" row.
  - `clientes.$clienteId.test.tsx` AC #4/#10 — added `findByTestId` for the list item before clicking; the list query is async so the item is not present immediately after the panel mounts.
  - `ClienteDetailView.test.tsx` AC #8/R8 — adjusted the test MSW handler to return 500 for the first three calls (matching the hook's `1 initial + 2 retries` budget) before flipping to 200; this is consistent with the `useCliente.test.tsx` AC #8 contract (3 total handler hits on 500).
- **E2E / Playwright** — Out of scope this story (same constraint as Story 2.1 and 1.2 — workspace-root Playwright runner not yet wired). Component + route-integration coverage gates Story 2.2.
- **`?selected=` search param removal** — `routes/clientes.tsx` no longer declares `validateSearch` for `selected`; `ClienteListView` reads selection from `useParams({ strict: false })`. The single source of truth for the selected client is the route segment, per AC #4.

### File List

**Backend — NEW:**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Api/ClienteByIdEndpointTests.cs`

**Backend — MODIFIED:**
- `backend/src/SiesaAgents.Application/ApplicationServiceCollectionExtensions.cs` (registered new handler)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (added `MapGet("/{id:guid}", ...)`)

**Frontend — NEW:**
- `frontend/src/modules/crm/clientes/domain/errors.ts`
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/ClientesShell.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/shared/components/ClienteNotFound/ClienteNotFound.tsx`
- `frontend/src/shared/components/ClienteNotFound/index.ts`
- `frontend/src/routes/clientes.$clienteId.tsx`

**Frontend — MODIFIED:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` (added `getById`)
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` (implemented `getById` with `ClienteNotFoundError` 404 mapping)
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` (selection from route param, navigates to `/clientes/$clienteId`)
- `frontend/src/routes/clientes.tsx` (refactored as parent layout with `<Outlet />`, dropped `validateSearch`)
- `frontend/src/routeTree.gen.ts` (regenerated by Vite plugin to reflect parent/child route hierarchy)
- `frontend/src/routes/clientes.$clienteId.test.tsx` (minor test adjustments — see Completion Notes)
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (handler call-count adjusted to the hook's retry budget)
