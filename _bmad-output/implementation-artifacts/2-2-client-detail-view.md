# Story 2.2: Client Detail View

Status: implemented

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** la lista de clientes está renderizada en `/clientes` (izquierda, 280px), **When** el usuario hace click (o presiona `Enter`/`Space` con foco) sobre un `ClientListItem` cuyo `cliente.id` es `X`, **Then** el router de TanStack Router navega a `/clientes/X` **sin recargar la página** (SPA — FR28), y en el panel derecho (`data-testid="cliente-detail-panel"`, `role="region"`, `aria-labelledby="cliente-detail-title"`) se renderiza `ClienteDetailView` mostrando los cuatro campos del cliente: `Nombre` (heading), `NIT/RUC`, `Teléfono`, `Ciudad`. El item seleccionado en la lista queda **visualmente marcado** (`aria-pressed="true"`, borde izquierdo azul `#0e79fd` sobre fondo `#eff8ff`) mientras la ruta activa contenga `clienteId === X`. (FR3, FR5, FR27, FR28 — AC-E2.3 — test-design-epic-2 P1#12)

2. **Given** el usuario está en el panel de detalle mostrando el cliente `X`, **When** el usuario hace click sobre un `ClientListItem` distinto con `id` `Y`, **Then** la URL cambia a `/clientes/Y`, el panel derecho re-renderiza los datos de `Y` sin desmontar la lista, el ítem `Y` queda marcado como seleccionado y el ítem `X` vuelve al estado default. **No** se hace refetch de `['clientes']` (list-level query — client-side switch) y `['clientes', Y]` se dispara sólo si no está en caché o su `staleTime` (30_000 ms) expiró. (FR27, FR28)

3. **Given** un usuario pega o escribe directamente la URL `/clientes/:clienteId` en el navegador y `clienteId` es un UUID válido correspondiente a un cliente existente, **When** la app monta y la ruta se resuelve, **Then** `ClienteDetailView` se muestra en el panel derecho con los datos del cliente pedidos vía `GET /api/v1/clientes/:clienteId` (queryKey `['clientes', clienteId]`), `ClienteListView` sigue montado a la izquierda, y el `ClientListItem` correspondiente queda marcado como seleccionado. El "deep linking" funciona sin login previo — no hay autenticación en MVP (arquitectura). (FR30, FR28 — AC-E2.3 — test-design-epic-2 P1#3)

4. **Given** el hook `useCliente(clienteId)` está haciendo la petición inicial (`isLoading === true`), **When** el panel derecho se renderiza por primera vez, **Then** en lugar del contenido del detalle se muestra un skeleton loader (`react-loading-skeleton`) con **al menos 4 líneas** apiladas que imitan la forma de las etiquetas + valores del detalle. El contenedor tiene `aria-busy="true"` y `data-testid="cliente-detail-skeleton"`. (UX spec — Loading states, NFR2)

5. **Given** el `clienteId` de la URL **no corresponde a ningún cliente existente** (backend responde `404 Not Found` con Problem Details RFC 7807), **When** el hook `useCliente(clienteId)` termina con `isError === true` y `error.response?.status === 404`, **Then** el panel derecho muestra un componente `NotFoundClientePanel` (`role="alert"`, `aria-live="polite"`, `data-testid="cliente-not-found"`) con:
   - Icono Heroicon `ExclamationTriangleIcon` en ámbar
   - Título `"Cliente no encontrado"`
   - Subtítulo `"El cliente que buscas no existe o fue eliminado."`
   - `Button` de siesa-ui-kit con texto `"Volver a Clientes"` que invoca `navigate({ to: '/clientes' })`.

   La UI **no debe crashear**, **no debe** mostrar un mensaje genérico de error, y **no debe** exponer el body del Problem Details al usuario final. El backend siempre retorna Problem Details JSON — el frontend nunca lo pinta crudo (NFR6). (FR30, NFR6 — AC-E2.3 — mitiga R-010 — test-design-epic-2 P1#2, P1#3)

6. **Given** el backend está inalcanzable (5xx, network error, timeout) **al pedir el cliente por ID**, **When** `useCliente(clienteId)` reporta `isError === true` y `error.response?.status !== 404` (o no hay respuesta), **Then** el panel derecho renderiza el `ErrorPanel` compartido (`data-testid="cliente-detail-error-panel"`, `role="alert"`) con el `Button` "Reintentar" que invoca `refetch()` del `useCliente`. Los mensajes son en español y genéricos, **nunca** stack traces (NFR6). (test-design-epic-2 P1#6 análogo — R-009)

7. **Given** el usuario está en `/clientes` (ruta index sin `clienteId`), **When** el panel derecho se renderiza, **Then** se muestra el placeholder `"Selecciona un cliente para ver el detalle"` en desktop (≥ 1024px). En viewport móvil (< 1024px) el panel derecho no se muestra (solo la lista ocupa el ancho completo — comportamiento heredado de Story 2.1). Cuando el usuario selecciona un cliente en móvil, la lista se oculta y el detalle ocupa el ancho completo con un botón `"← Volver"` en el header del detalle que invoca `navigate({ to: '/clientes' })` (patrón master-detail responsive — UX spec Phase 2/3). (FR29, UX spec — Responsive breakpoints)

8. **Given** el backend expone `GET /api/v1/clientes/{id:guid}`, **When** el frontend hace la petición con un UUID válido, **Then** el endpoint responde:
   - **200 OK** con un `ClienteDto` JSON (id, nombre, nit, telefono, ciudad, createdAt, updatedAt — mismo shape que el `GET /api/v1/clientes`) si el cliente existe;
   - **404 Not Found** con Problem Details RFC 7807 (`type`, `title: "Cliente no encontrado"`, `status: 404`, `detail`, `instance: /api/v1/clientes/{id}`) si no existe;
   - **400 Bad Request** con Problem Details si el `{id}` no es un GUID válido (route constraint `{id:guid}` produce esto automáticamente en Minimal API).

   Implementación .NET 10 Minimal API + EF Core 10 siguiendo Clean Architecture + DDD: `IClienteRepository.GetByIdAsync(Guid id, CancellationToken)` (Domain) → `GetClienteByIdQuery(Guid Id)` + `GetClienteByIdQueryHandler` (Application/CQRS) → `ClienteRepository.GetByIdAsync` con `AsNoTracking()` (Infrastructure) → endpoint en `ClienteEndpoints.MapGet("/{id:guid}")` (API). Las respuestas 404 pasan por el pipeline estándar (`Results.NotFound(...)` con `ProblemDetails`), y `ExceptionHandlingMiddleware` cubre cualquier excepción no controlada (NFR6). (Architecture — API & Communication Patterns + Error handling)

9. **Given** el proyecto tiene suites de test verdes de historias anteriores (Story 1.1, 1.2, 1.3, 2.1), **When** se ejecutan `pnpm --filter frontend build`, `pnpm --filter frontend lint`, `pnpm --filter frontend test`, `dotnet build`, `dotnet test`, **Then** todos completan con **cero errores TypeScript**, cero errores de lint, y **todos los tests unitarios/de componente/de integración pasan** — incluyendo los nuevos tests listados en Tasks 8, 9 y 10, y sin regresiones en los 60 tests de frontend + 45 tests de backend heredados de Story 2.1. (Company standards — test-design-epic-2 NFR6 compliance)

## Tasks / Subtasks

- [x] **Task 1 — Backend Domain: `IClienteRepository.GetByIdAsync`** (AC: #8)
  - [ ] Editar `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` para agregar:
    ```csharp
    Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    ```
    (Nullable return — el handler decide si `null` → 404. No lanzar excepciones desde el repo por not-found; eso es un caso de uso conocido, no una condición excepcional.)
  - [ ] `dotnet build` sobre `SiesaAgents.Domain` — cero errores

- [x] **Task 2 — Backend Infrastructure: `ClienteRepository.GetByIdAsync`** (AC: #8)
  - [ ] Editar `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` para implementar el método nuevo:
    ```csharp
    public async Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // AsNoTracking: read-only query — el detalle es idempotente y no muta la entidad.
        return await _db.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
    ```
  - [ ] `dotnet build` sobre `SiesaAgents.Infrastructure` — cero errores

- [x] **Task 3 — Backend Application: Query + Handler CQRS** (AC: #8)
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.Queries;

    public sealed record GetClienteByIdQuery(Guid Id);
    ```
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`:
    ```csharp
    using SiesaAgents.Application.Clientes.DTOs;
    using SiesaAgents.Domain.Clientes.Interfaces;

    namespace SiesaAgents.Application.Clientes.Queries;

    public sealed class GetClienteByIdQueryHandler
    {
        private readonly IClienteRepository _repository;

        public GetClienteByIdQueryHandler(IClienteRepository repository)
        {
            _repository = repository;
        }

        public async Task<ClienteDto?> HandleAsync(
            GetClienteByIdQuery query,
            CancellationToken cancellationToken = default)
        {
            var cliente = await _repository.GetByIdAsync(query.Id, cancellationToken);
            if (cliente is null)
            {
                return null;
            }

            return new ClienteDto(
                cliente.Id,
                cliente.Nombre,
                cliente.Nit,
                cliente.Telefono,
                cliente.Ciudad,
                cliente.CreatedAt,
                cliente.UpdatedAt);
        }
    }
    ```
  - [ ] `dotnet build` sobre `SiesaAgents.Application` — cero errores

- [x] **Task 4 — Backend API: Endpoint `GET /api/v1/clientes/{id:guid}` + 404 Problem Details** (AC: #5, #8)
  - [ ] Editar `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` para agregar el endpoint dentro del `group.MapGroup("/api/v1/clientes")` (después del `group.MapGet("/", ...)` existente):
    ```csharp
    group.MapGet("/{id:guid}", async (
        Guid id,
        GetClienteByIdQueryHandler handler,
        HttpContext http,
        CancellationToken ct) =>
    {
        var dto = await handler.HandleAsync(new GetClienteByIdQuery(id), ct);
        if (dto is null)
        {
            return Results.Problem(
                title: "Cliente no encontrado",
                detail: $"No existe ningún cliente con id {id}.",
                statusCode: StatusCodes.Status404NotFound,
                type: "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                instance: http.Request.Path);
        }

        return Results.Ok(dto);
    })
    .WithName("GetClienteById");
    ```
  - [ ] Editar `backend/src/SiesaAgents.API/Program.cs` para registrar en DI (junto a los otros scoped services de Story 2.1, antes de `builder.Build()`):
    ```csharp
    builder.Services.AddScoped<GetClienteByIdQueryHandler>();
    ```
  - [ ] Verificar contra Scalar (`http://localhost:5000/scalar`) que `GetClienteById` aparece listado. **NO** usar Swagger (arquitectura prohíbe `app.UseSwagger()`).
  - [ ] La route constraint `{id:guid}` produce automáticamente un 400 Problem Details cuando el segmento no parsea como GUID (comportamiento estándar de Minimal API — cumple NFR6).
  - [ ] El endpoint **NO expone** stack traces — `ExceptionHandlingMiddleware` (Epic 1 Story 1.3) y `AddProblemDetails()` en `Program.cs` ya cubren esto.

- [x] **Task 5 — Backend Tests: Unit + Integration** (AC: #5, #8, #9)
  - [ ] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`:
    - `HandleAsync_ExistingId_ReturnsDto()` — mock `IClienteRepository.GetByIdAsync` para retornar una `ClienteEntity`; assert DTO shape (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
    - `HandleAsync_NotFound_ReturnsNull()` — mock `GetByIdAsync` returning `null`; assert `result is null`
    - `HandleAsync_PassesCancellationToken()` — asserta que el CT se propaga al repo
  - [ ] `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — extender la clase existente con:
    - `GetClienteById_ExistingId_Returns200WithDto()` — seed 1 cliente, GET `/api/v1/clientes/{id}`, assert 200 + DTO fields + camelCase JSON keys (`"id"`, `"nombre"`, `"createdAt"`)
    - `GetClienteById_UnknownId_Returns404ProblemDetails()` — seed vacío o id aleatorio, GET `/api/v1/clientes/{Guid.NewGuid()}`, assert **status 404**, `Content-Type: application/problem+json`, body contiene `"title":"Cliente no encontrado"`, `"status":404`, y **no** contiene `System.` ni `.cs:line` (NFR6). Cubre P1#2 de test-design.
    - `GetClienteById_InvalidGuid_Returns400()` — GET `/api/v1/clientes/not-a-guid`, assert status 400 (route constraint) y respuesta es Problem Details (o el 404 emitido por `UseStatusCodePages` sobre el fallback — depende de la implementación; capture el status que el framework produce y asserta que **no** hay stack trace).
    - `GetClienteById_UnknownId_DoesNotLeakStackTrace()` — asserta que la respuesta 404 no contiene `at System.`, `Microsoft.EntityFrameworkCore`, ni `.cs:line` (NFR6, reforzando el test existente `GetClientes_UnknownSubroute_DoesNotLeakStackTrace`).
  - [ ] `dotnet test` — todos los tests verdes (mínimo 4 nuevos + 45 heredados de Story 2.1)

- [x] **Task 6 — Frontend Domain + Infrastructure: repository `getById`** (AC: #8)
  - [ ] Editar `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` para agregar:
    ```ts
    import type { Cliente } from './Cliente'
    export interface IClienteRepository {
      getAll(signal?: AbortSignal): Promise<Cliente[]>
      getById(id: string, signal?: AbortSignal): Promise<Cliente>
    }
    ```
    (Contract: `getById` **rechaza** con el error de Axios cuando el backend responde ≠ 2xx. React Query traducirá eso a `isError`.)
  - [ ] Editar `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` para implementar `getById`:
    ```ts
    export const clienteApiRepository: IClienteRepository = {
      async getAll(signal) { /* existente */ },
      async getById(id, signal) {
        const { data } = await apiClient.get<Cliente>(`/api/v1/clientes/${id}`, { signal })
        return data
      },
    }
    ```
    (Los interceptors de Axios ya están wired desde Epic 1. **No** capturar el error aquí — dejar que Axios lance el `AxiosError` que React Query manejará.)

- [x] **Task 7 — Frontend Application: `useCliente(clienteId)` hook (TanStack Query)** (AC: #3, #4, #5, #6)
  - [ ] Crear `frontend/src/modules/crm/clientes/application/useCliente.ts`:
    ```ts
    import { useQuery } from '@tanstack/react-query'
    import type { AxiosError } from 'axios'
    import type { Cliente } from '../domain/Cliente'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    /**
     * Reads a single cliente by id. Returns AxiosError as `error` when the backend
     * responds with a non-2xx (404 included). Callers check `error.response?.status`.
     */
    export function useCliente(clienteId: string | undefined) {
      return useQuery<Cliente, AxiosError>({
        queryKey: ['clientes', clienteId] as const,
        queryFn: ({ signal }) => {
          if (!clienteId) {
            throw new Error('clienteId is required')
          }
          return clienteApiRepository.getById(clienteId, signal)
        },
        enabled: Boolean(clienteId),
        staleTime: 30_000,
        // Don't retry 404 — the record simply doesn't exist and retrying is a waste.
        retry: (failureCount, error) => {
          if (error.response?.status === 404) return false
          return failureCount < 2
        },
      })
    }
    ```
  - [ ] Crear `useCliente.test.tsx` con `QueryClientProvider` mock + MSW handlers específicos para:
    - Happy path: `http.get('*/api/v1/clientes/:id', ({ params }) => HttpResponse.json(fixture))` → `isSuccess` con `data.nombre` correcto
    - 404 path: `HttpResponse.json({ title: 'Cliente no encontrado', status: 404 }, { status: 404 })` → `isError === true` **y** `error.response?.status === 404`
    - 500 path: `HttpResponse.json({ status: 500 }, { status: 500 })` → `isError === true` y `error.response?.status !== 404`
    - Disabled query (`clienteId === undefined`) → `isPending === true`, sin fetch disparado
  - [ ] Exportar `useCliente` desde `frontend/src/modules/crm/clientes/index.ts` (barrel)

- [x] **Task 8 — Frontend Shared: `NotFoundClientePanel`** (AC: #5)
  - [ ] Crear `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.tsx`:
    ```tsx
    import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
    import { Button } from 'siesa-ui-kit'
    import { useNavigate } from '@tanstack/react-router'

    export interface NotFoundClientePanelProps {
      onBack?: () => void
      testId?: string
    }

    /**
     * Rendered inside the split-panel right side when GET /clientes/:id returns
     * 404. Local (panel-scoped) not-found — the app-level NotFoundView is only
     * used by the root router notFoundComponent.
     */
    export function NotFoundClientePanel({
      onBack,
      testId = 'cliente-not-found',
    }: NotFoundClientePanelProps) {
      const navigate = useNavigate()

      const handleBack = () => {
        if (onBack) {
          onBack()
          return
        }
        void navigate({ to: '/clientes' })
      }

      return (
        <div
          role="alert"
          aria-live="polite"
          data-testid={testId}
          className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-50">
            <ExclamationTriangleIcon className="size-10 text-amber-500" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Cliente no encontrado</h3>
          <p className="text-sm text-slate-500">
            El cliente que buscas no existe o fue eliminado.
          </p>
          <div className="mt-2">
            <Button type="default" size="base" onClick={handleBack}>
              Volver a Clientes
            </Button>
          </div>
        </div>
      )
    }
    ```
  - [ ] Crear `NotFoundClientePanel.test.tsx` — smoke + click "Volver a Clientes" invoca `navigate({ to: '/clientes' })` (mock `useNavigate`) + `role="alert"` presente
  - [ ] Crear `index.ts` (barrel) — `export { NotFoundClientePanel } from './NotFoundClientePanel'`
  - [ ] **Justificación de componente separado (no reusar `NotFoundView`):** `NotFoundView` es la 404 a nivel de app (montada en `__root.notFoundComponent`) y renderiza un heading `h1` con el CTA "Ir a Clientes" — se muestra cuando la ruta no matchea. `NotFoundClientePanel` es una 404 **local** que se renderiza **dentro** del panel derecho del split-panel de `/clientes/:clienteId` cuando la ruta sí existe pero el recurso no; usa `h3` para no chocar con el `<h1>Clientes</h1>` del panel izquierdo (jerarquía semántica correcta) y el CTA dice "Volver a Clientes" (contexto local).

- [x] **Task 9 — Frontend Presentation: `ClienteDetailView`** (AC: #1, #3, #4, #5, #6, #7)
  - [ ] Crear `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    ```tsx
    import { useNavigate } from '@tanstack/react-router'
    import Skeleton from 'react-loading-skeleton'
    import { ArrowLeftIcon } from '@heroicons/react/24/outline'
    import { Button } from 'siesa-ui-kit'
    import { ErrorPanel } from '@/shared/components/ErrorPanel'
    import { NotFoundClientePanel } from '@/shared/components/NotFoundClientePanel'
    import { useCliente } from '../application/useCliente'

    export interface ClienteDetailViewProps {
      clienteId: string
    }

    /**
     * Right-hand panel of the /clientes split view. Renders the four Cliente
     * fields (Nombre, NIT/RUC, Teléfono, Ciudad) for a given clienteId. On 404
     * shows a local NotFoundClientePanel (never crashes, never leaks internals).
     */
    export function ClienteDetailView({ clienteId }: ClienteDetailViewProps) {
      const navigate = useNavigate()
      const { data: cliente, isLoading, isError, error, refetch } = useCliente(clienteId)

      if (isLoading) {
        return (
          <section
            data-testid="cliente-detail-skeleton"
            aria-busy="true"
            className="flex flex-1 flex-col gap-3 p-6"
          >
            <Skeleton height={28} width="60%" />
            <Skeleton height={20} width="40%" />
            <Skeleton height={20} width="50%" />
            <Skeleton height={20} width="35%" />
          </section>
        )
      }

      if (isError) {
        if (error?.response?.status === 404) {
          return <NotFoundClientePanel />
        }
        return (
          <ErrorPanel
            onRetry={() => {
              void refetch()
            }}
            testId="cliente-detail-error-panel"
          />
        )
      }

      if (!cliente) {
        // Defensive: should not happen — isLoading+isError cover the branches.
        return null
      }

      return (
        <section
          data-testid="cliente-detail-panel"
          role="region"
          aria-labelledby="cliente-detail-title"
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <header className="flex items-center gap-2 border-b border-slate-200 p-4 lg:hidden">
            <button
              type="button"
              aria-label="Volver a la lista de clientes"
              onClick={() => void navigate({ to: '/clientes' })}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Volver
            </button>
          </header>

          <div className="flex flex-col gap-6 p-6">
            <h2
              id="cliente-detail-title"
              className="text-xl font-bold text-slate-900"
            >
              {cliente.nombre}
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  NIT/RUC
                </dt>
                <dd
                  data-testid="cliente-detail-nit"
                  className="mt-1 text-sm text-slate-900"
                >
                  {cliente.nit}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Teléfono
                </dt>
                <dd
                  data-testid="cliente-detail-telefono"
                  className="mt-1 text-sm text-slate-900"
                >
                  {cliente.telefono}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ciudad
                </dt>
                <dd
                  data-testid="cliente-detail-ciudad"
                  className="mt-1 text-sm text-slate-900"
                >
                  {cliente.ciudad}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )
    }
    ```
  - [ ] Crear `ClienteDetailView.test.tsx`:
    - `renders skeleton on initial load` — MSW no-response yet → asserta `data-testid="cliente-detail-skeleton"` + `aria-busy="true"`
    - `renders cliente fields on success` — MSW returns fixture (Acme Corp) → asserta Nombre en `h2`, NIT/RUC, Teléfono, Ciudad visibles con sus `data-testid`
    - `renders NotFoundClientePanel on 404` — MSW `HttpResponse.json({...}, {status: 404})` → asserta `data-testid="cliente-not-found"` visible y `data-testid="cliente-detail-panel"` **NO** presente
    - `renders ErrorPanel with retry on 500` — MSW `HttpResponse.json({}, {status: 500})` → asserta `data-testid="cliente-detail-error-panel"` visible; click "Reintentar" invoca refetch (verificado con MSW request counter → 2 GETs a `/api/v1/clientes/:id`)
    - `no crash sin credenciales/data extra` — smoke: renderiza para un `clienteId` válido, no arroja excepción en jsdom
  - [ ] Exportar `ClienteDetailView` desde el barrel `index.ts` del módulo

- [x] **Task 10 — Wire selection: `ClientListItem` + `ClienteListView` (isSelected via route params)** (AC: #1, #2)
  - [ ] Editar `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Importar `useNavigate` y `useMatchRoute` de `@tanstack/react-router`
    - Dentro del componente:
      ```ts
      const navigate = useNavigate()
      const matchRoute = useMatchRoute()
      const detailMatch = matchRoute({ to: '/clientes/$clienteId' }) as { clienteId?: string } | false
      const activeClienteId = detailMatch ? detailMatch.clienteId : undefined
      ```
    - Cambiar la prop `onSelect` del `ClientListItem` de un `console.info(...)` a:
      ```ts
      onSelect={(id) => void navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })}
      isSelected={activeClienteId === cliente.id}
      ```
  - [ ] `ClientListItem.tsx` **ya soporta** `isSelected` (Story 2.1) — no requiere cambios de props.
  - [ ] En viewport móvil (< 1024px), cuando `activeClienteId` está definido, la lista debe ocultarse (el detalle ocupa todo). Añadir en el `<aside>` root:
    ```tsx
    className={`${activeClienteId ? 'hidden lg:flex' : 'flex'} h-full w-full flex-col border-r border-slate-200 lg:w-[280px] lg:shrink-0`}
    ```
    (Reemplaza la línea de className existente. Preserva la conducta desktop — a 280px la lista siempre visible; a mobile, solo si no hay detalle activo.)
  - [ ] Actualizar `ClienteListView.test.tsx` — los tests existentes que asertan `screen.getByRole('button', { name: /Ver cliente:.../ })` no cambian (la interfaz sigue igual). Añadir 2 nuevos:
    - `[TC-Story-2.2-Selection]` — mock `useNavigate` con `vi.fn()`; click en un item invoca navigate con `{ to: '/clientes/$clienteId', params: { clienteId: '11111111-...' } }`
    - `[TC-Story-2.2-Selected-Style]` — mock `useMatchRoute` para retornar `{ clienteId: '11111111-...' }`; asserta que el `ClientListItem` correspondiente tiene `aria-pressed="true"` y clase `border-l-[#0e79fd]`

- [x] **Task 11 — Routing: layout `clientes` + `clientes.index` + `clientes.$clienteId`** (AC: #1, #3, #7)
  - [ ] Renombrar el **rol** de `frontend/src/routes/clientes.tsx` a layout route con `<Outlet />`:
    ```tsx
    import { createFileRoute, Outlet } from '@tanstack/react-router'
    import { ClienteListView } from '@/modules/crm/clientes'

    export const Route = createFileRoute('/clientes')({ component: ClientesLayout })

    function ClientesLayout() {
      return (
        <section
          data-testid="clientes-view"
          aria-labelledby="clientes-title"
          className="flex h-[calc(100dvh-56px)] lg:h-[100dvh]"
        >
          <ClienteListView />
          <Outlet />
        </section>
      )
    }
    ```
    (Ya no renderiza el div "Selecciona un cliente..." — eso vive ahora en la ruta index.)
  - [ ] Crear `frontend/src/routes/clientes.index.tsx` — la ruta hija que se muestra cuando la URL es exactamente `/clientes`:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'

    export const Route = createFileRoute('/clientes/')({ component: ClientesIndex })

    function ClientesIndex() {
      return (
        <div
          data-testid="cliente-detail-empty"
          className="hidden flex-1 items-center justify-center text-slate-400 lg:flex"
        >
          Selecciona un cliente para ver el detalle
        </div>
      )
    }
    ```
  - [ ] Crear `frontend/src/routes/clientes.$clienteId.tsx` — la ruta hija dinámica para `/clientes/:clienteId`:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'

    export const Route = createFileRoute('/clientes/$clienteId')({
      component: ClienteDetailRoute,
    })

    function ClienteDetailRoute() {
      const { clienteId } = Route.useParams()
      return <ClienteDetailView clienteId={clienteId} />
    }
    ```
  - [ ] Regenerar `routeTree.gen.ts` — TanStack Router Vite plugin lo hace automático en `pnpm --filter frontend dev` y en `pnpm --filter frontend build`. Verificar que la ruta `/clientes/$clienteId` aparece en el árbol generado.
  - [ ] **Nota sobre el pattern:** `_app/clientes.tsx` + `_app/clientes.$clienteId.tsx` del architecture.md usa un pathless layout `_app/`. Este proyecto usa un enfoque más simple: `__root.tsx` monta el `AppShell` que envuelve todos los routes vía `<Outlet />`. Por tanto NO se agrega `_app/`; los archivos van en `routes/` con nombres planos.

- [x] **Task 12 — MSW handlers extendidos para `/api/v1/clientes/:id`** (AC: #5, #6, #9)
  - [ ] Editar `frontend/src/test/msw/handlers.ts` para agregar el handler de detalle usando el mismo `seedClientes`:
    ```ts
    import { http, HttpResponse } from 'msw'
    import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

    export const seedClientes: Cliente[] = [ /* existente */ ]

    export const handlers = [
      http.get('*/api/v1/clientes', () => HttpResponse.json(seedClientes)),
      http.get('*/api/v1/clientes/:id', ({ params }) => {
        const cliente = seedClientes.find((c) => c.id === params.id)
        if (!cliente) {
          return HttpResponse.json(
            {
              type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
              title: 'Cliente no encontrado',
              status: 404,
              detail: `No existe ningún cliente con id ${String(params.id)}.`,
            },
            { status: 404 },
          )
        }
        return HttpResponse.json(cliente)
      }),
    ]
    ```
  - [ ] Los tests individuales que quieran forzar 404/500 usan `server.use(http.get('*/api/v1/clientes/:id', ...))` en un `beforeEach` (patrón heredado de Story 2.1).

- [x] **Task 13 — Frontend tests: cobertura Story 2.2** (AC: #1, #2, #3, #4, #5, #6, #7, #9)
  - [ ] `useCliente.test.tsx` (Task 7)
  - [ ] `NotFoundClientePanel.test.tsx` (Task 8)
  - [ ] `ClienteDetailView.test.tsx` (Task 9)
  - [ ] `ClienteListView.test.tsx` — añadir los 2 tests nuevos de selección (Task 10)
  - [ ] Test de **integración de ruta** — nuevo archivo `frontend/src/routes/clientes.detail.integration.test.tsx`:
    - Renderiza el árbol de rutas con `createMemoryHistory({ initialEntries: ['/clientes/11111111-1111-1111-1111-111111111111'] })` + `createRouter` + `<RouterProvider />`
    - Asserta que `data-testid="cliente-detail-panel"` renderiza con los datos del seed (P1#12 — URL updates + panel renders)
    - Segundo test: initial URL `/clientes/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` (id inexistente en seed) → MSW 404 → asserta `data-testid="cliente-not-found"` visible (P1#3, mitiga R-010)
    - Tercer test: initial URL `/clientes` (index) → asserta `data-testid="cliente-detail-empty"` visible y `data-testid="cliente-detail-panel"` **no** visible
  - [ ] Ejecutar `pnpm --filter frontend test` — TODOS los specs verdes (60 heredados + al menos ~18 nuevos)

- [x] **Task 14 — Verificación end-to-end** (AC: #9)
  - [ ] `pnpm --filter frontend build` → 0 errores TypeScript, `routeTree.gen.ts` incluye `/clientes/$clienteId`
  - [ ] `pnpm --filter frontend lint` → 0 errores
  - [ ] `pnpm --filter frontend test` → todos los tests verdes
  - [ ] `dotnet build backend/SiesaAgents.sln` → 0 errores
  - [ ] `dotnet test backend/SiesaAgents.sln` → todos los tests verdes
  - [ ] Manual sanity: `pnpm --filter frontend dev` + backend corriendo local:
    - Visitar `http://localhost:5173/clientes` → panel derecho placeholder
    - Click en un cliente → URL cambia a `/clientes/{id}` sin recarga; detalle visible
    - Refrescar F5 sobre `/clientes/{id}` → detalle se carga solo (deep link)
    - Escribir `/clientes/00000000-0000-0000-0000-000000000000` en la barra → panel derecho muestra "Cliente no encontrado" con CTA "Volver a Clientes"
    - Escribir `/clientes/not-a-guid` → framework devuelve 400/404 sin stack trace; la app no crashea (renderiza el `notFoundComponent` de la ruta padre o ErrorBoundary de TanStack Router)
    - Detener backend + escribir `/clientes/{id-valido-cached}` → si el cache está vacío, `ErrorPanel` con "Reintentar"

## Dev Notes

### Story 2.1 handoff (relevante para esta historia)

- `ClienteListView` ya renderiza el panel izquierdo 280px con `Input` de búsqueda y `ClientListItem[]`. El `onSelect` actual es un stub `console.info('TODO: Story 2.2 — client detail selection', id)` — Task 10 lo reemplaza con `navigate({ to: '/clientes/$clienteId', ... })`.
- `ClientListItem` ya expone `isSelected` (border-l azul `#0e79fd`, `aria-pressed`). Task 10 solo debe pasarle la prop derivada de la ruta activa.
- `useClientes()` cachea `['clientes']` con `staleTime: 30_000` — el hook nuevo `useCliente(id)` usa el mismo staleTime y queryKey pattern `['clientes', id]` per architecture (línea 279 — `['clientes', id]` → `GET /api/v1/clientes/:id`).
- `clienteApiRepository.getAll` ya está wired con `apiClient` (Axios singleton, baseURL desde `VITE_API_URL`, cancelable via `AbortSignal`). El nuevo `getById` sigue el mismo patrón.
- `MSW` server ya está wired en `frontend/src/test/setup.ts` con `beforeAll(server.listen({ onUnhandledRequest: 'error' }))`. `resetHandlers` corre después de cada test, así que overrides por-test son seguros.
- `EmptyState` y `ErrorPanel` compartidos viven en `frontend/src/shared/components/`. El nuevo `NotFoundClientePanel` sigue el mismo patrón (folder + `.tsx` + `.test.tsx` + `index.ts` barrel).
- `frontend/src/routes/clientes.tsx` ya existe. Task 11 lo **transforma** de una vista completa a un **layout route** con `<Outlet />` — el `ClienteListView` se mantiene siempre montado a la izquierda y el `Outlet` inyecta la vista hija (index o detail) a la derecha. El heading `<h1>Clientes</h1>` sigue viviendo dentro del panel — el spec E2E de Story 1.2 (`page.getByRole('heading', { level: 1 })`) sigue verde.
- `react-loading-skeleton` ya está instalado y su CSS importado en `main.tsx` (Story 2.1). Reusar `<Skeleton />` directamente.

### Story 1.3 handoff (backend)

- `AppDbContext` tiene `DbSet<ClienteEntity> Clientes` (Story 2.1). No requiere cambios.
- `ExceptionHandlingMiddleware` está registrado y retorna Problem Details RFC 7807. Cubre cualquier excepción no controlada.
- `AddProblemDetails()` + `UseStatusCodePages()` están wired en `Program.cs`. Los 400 producidos por la route constraint `{id:guid}` salen como Problem Details automáticamente.
- El endpoint retorna 404 con `Results.Problem(...)` — **NO** con `Results.NotFound(new { message: "..." })` (esto último rompería el contract JSON Problem Details).

### Alignment with company standards

**Clean Architecture + DDD (mandatory):**
- Frontend: `modules/crm/clientes/{domain, application, infrastructure, presentation}` — nuevo hook `useCliente` en application, nuevo método `getById` en infrastructure, nuevo `ClienteDetailView` en presentation (per `.claude/agent-memory/sa-quick-dev/company-standards.md`).
- Backend: `SiesaAgents.Domain` (interface extendida) → `SiesaAgents.Application` (nueva Query + Handler) → `SiesaAgents.Infrastructure` (nueva impl de repo) → `SiesaAgents.API` (nuevo endpoint).

**Stack (locked):**
- Frontend: React 19, Vite 8, TS 6, TanStack Query 5 (`useQuery` con `signal` + `enabled` + `retry` function), TanStack Router 1 (file-based, dynamic param `$clienteId`, `useParams`, `useNavigate`, `useMatchRoute`), Zustand 5 (no requerido en esta historia), Tailwind v4, siesa-ui-kit ^1.0.255, `@heroicons/react`, `react-loading-skeleton`.
- Backend: .NET 10, Minimal API, EF Core 10 + Npgsql, xUnit, `Microsoft.AspNetCore.Mvc.Testing` (WebApplicationFactory) + EF Core InMemory para tests sin Docker.

**Convenciones críticas:**
- **PKs**: `Guid` en backend, `string` (UUID serializado) en frontend — NUNCA `int`.
- **DateTime**: los DTOs siguen usando `DateTimeOffset` (nunca `DateTime`).
- **snake_case en DB** via `ApplySnakeCaseNaming()` — no requiere cambios (la tabla `clientes` ya existe desde Story 2.1).
- **Problem Details RFC 7807** para todos los errores — 404 emitido con `Results.Problem(...)`; 400 emitido automáticamente por Minimal API sobre route constraint; 500 capturado por `ExceptionHandlingMiddleware`.
- **Scalar** para docs — Swagger prohibido.
- **Texto UI 100% en español (es-CO); código 100% en inglés** — labels ("NIT/RUC", "Teléfono", "Ciudad", "Cliente no encontrado", "Volver a Clientes"), aria-labels ("Volver a la lista de clientes"), title del error 404 en Problem Details ("Cliente no encontrado").
- **WCAG 2.1 AA** — `<h2>` para nombre del cliente, `<dt>`/`<dd>` semántico para pares label/value, `aria-labelledby` conectando `<section>` con el título del detalle, `aria-live="polite"` en not-found panel, contraste ≥ 4.5:1 (slate-500/slate-900), touch targets ≥ 44px.
- **Bundle < 500KB gzipped** — no nuevas dependencias pesadas (reusa Heroicons + react-loading-skeleton + siesa-ui-kit).
- **Package manager**: `pnpm` (respetar lockfile existente).

**Component hierarchy of decision (obligatoria, per UX spec):**
1. siesa-ui-kit primero — `Button` (en NotFoundClientePanel y ErrorPanel — ya existente).
2. shadcn/Radix segundo — no requerido en esta historia.
3. Custom composition tercero — `ClienteDetailView` (dl/dt/dd + Tailwind) y `NotFoundClientePanel` son composiciones custom sobre siesa-ui-kit + Heroicons.

**MasterCrud (per mastercrud-use-reference.md):**
- **NO se usa en esta historia.** Story 2.2 es un panel de detalle de **un solo registro** (read-only en esta historia — editar es Story 2.4) mostrando 4 campos vía `<dl>`. MasterCrud es el orquestador de pantallas CRUD basadas en `MasterCrudField[]` + `CrudService<T>` que combinan grid + form + filters — arquitectura sobredimensionada para un "leer un cliente por id y mostrar sus 4 campos". La arquitectura del proyecto (architecture.md líneas 617–619) explícitamente diseña `ClienteDetailView` como componente flex del panel derecho custom (más adelante instanciará `ContactManager` en Epic 4). Documentado sin implementar.

### Contexto de Story previa (Story 2.1)

Learnings extraídos del `Completion Notes` de Story 2.1 que aplican aquí:
- **jsdom + Tailwind classes**: assertions sobre clases (`lg:w-[280px]`, `border-l-[#0e79fd]`) son más deterministas que manipular viewport en jsdom. Aplicar el mismo patrón para asserts de `hidden lg:flex` (Task 10 mobile hide).
- **`server.use(...)` per-test**: cuando un test necesita 404/500, sobrescribir el handler dentro del `beforeEach` o al inicio del `it(...)` — `server.resetHandlers()` restaura defaults automáticamente.
- **CSS ordering**: `siesa-ui-kit/styles.css` antes de `./index.css`, luego `react-loading-skeleton/dist/skeleton.css` — no cambiar orden.
- **`tsconfig.app.json` excluye `.test.tsx`** — los tests no bloquean `pnpm build`; la ruta `.integration.test.tsx` sigue la misma convención.
- **Route file naming**: `routeFileIgnorePattern: '\\.(test|spec)\\.(ts|tsx)$'` — los archivos de test **junto** a routes deben usar sufijo `.test.tsx`, nunca al lado sin sufijo (colisiona con file-based routing).
- **`AbortSignal` en Axios**: usar `apiClient.get(url, { signal })` — Axios 1.7+ soporta AbortController nativo; TanStack Query 5 pasa `signal` en `queryFn`. No inventar cancelación manual.
- **`cssMinify: false`** en `vite.config.ts` — no revertir; lightningcss choca con tokens de siesa-ui-kit.

### Test design references

- `_bmad-output/test-design-epic-2.md` — Story 2.2 mapea a:
  - **P1#2:** GET /clientes/{id} returns 404 for non-existent id — Task 5 integration test `GetClienteById_UnknownId_Returns404ProblemDetails`
  - **P1#3:** Deep link `/clientes/:clienteId` with unknown id shows not-found gracefully — Task 13 integration test + `ClienteDetailView` 404 branch test
  - **P1#12:** URL updates to `/clientes/:clienteId` on selection (FR30 deep linking) — Task 10 `ClienteListView` selection test + Task 13 route integration test
  - **R-010 mitigation:** Deep link with non-existent id shows graceful not-found — Task 8 (NotFoundClientePanel) + Task 9 (ClienteDetailView 404 branch) + Task 13 tests
- La test suite ATDD de Story 2.2 (si sa-quick-dev la genera) se colocará en `e2e/tests/clientes/story-2.2-client-detail-view.spec.ts` con mock de `page.route()`. Los asserts equivalentes viven en Vitest para el sandbox sin Playwright browsers.

### Git intelligence (últimos commits sobre patrones a seguir)

- Story 2.1 (commit `2cfbdc4`) dejó el patrón `frontend/src/shared/components/{Component}/{Component}.tsx + {Component}.test.tsx + index.ts` — replicar exacto para `NotFoundClientePanel`.
- Story 2.1 dejó el patrón backend `SiesaAgents.{Layer}/Clientes/{Kind}/*.cs` — replicar para `GetClienteByIdQuery` y `GetClienteByIdQueryHandler`.
- Story 1.2 (commit `df0f0db`, `NotFoundView`) usa el mismo patrón conceptual (icono ámbar `ExclamationTriangleIcon` + heading + subtitle + CTA `Button` de siesa-ui-kit + `useNavigate`) — pero **NO** se reusa como componente porque `NotFoundView` es la 404 a nivel de app (root `notFoundComponent`) mientras que `NotFoundClientePanel` es una 404 local dentro del panel derecho. Ver justificación en Task 8.
- El sufijo de branch commits sigue el patrón `wip(epic-2/story-2.2): ...` — respetar para consistencia de historial.

### Latest tech info (Web research)

- **TanStack Query 5** — el `queryKey: ['clientes', clienteId]` con `enabled: Boolean(clienteId)` es el patrón canónico para "no fetchear hasta tener id"; la función `retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 2` evita reintentos inútiles en 404. `AxiosError.response?.status` está tipado por Axios 1.7+ automáticamente cuando se declara `useQuery<Cliente, AxiosError>(...)`.
- **TanStack Router 1** — `createFileRoute('/clientes/$clienteId')({ component })` con `Route.useParams()` retorna `{ clienteId: string }`. `useMatchRoute()({ to: '/clientes/$clienteId' })` retorna `false` o `{ clienteId: string }` con el valor actual — perfecto para el `isSelected` en la lista. `<Outlet />` en el componente del layout `clientes.tsx` inyecta la ruta hija.
- **Minimal API** — `MapGet("/{id:guid}", ...)` con la route constraint `:guid` valida automáticamente el segmento; sin constraint el endpoint acepta cualquier string y el error de parseo llegaría como `500`. La constraint retorna `400 Problem Details` cuando el segmento no parsea — nunca `500`.
- **MSW 2** — `http.get('*/api/v1/clientes/:id', ({ params }) => ...)` inyecta `params.id` como string. Para simular 404 con Problem Details JSON: `HttpResponse.json({ title, status: 404, ... }, { status: 404 })`.
- **`react-loading-skeleton@^3.5.0`** — compatible con React 19; `<Skeleton height={20} width="40%" />` renderiza rectángulo animado. Ya está instalado y su CSS importado desde Story 2.1.
- **Axios v1.7+** — el error de una respuesta HTTP no-2xx es un `AxiosError` con `response.status`, `response.data`, `response.headers` tipados. Para importar el tipo: `import type { AxiosError } from 'axios'` (Axios 1.7 exporta el tipo).

### Project Structure Notes

**Archivos creados por esta historia:**

Frontend:
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCliente.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.tsx`
- `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.test.tsx`
- `frontend/src/shared/components/NotFoundClientePanel/index.ts`
- `frontend/src/routes/clientes.index.tsx`
- `frontend/src/routes/clientes.$clienteId.tsx`
- `frontend/src/routes/clientes.detail.integration.test.tsx`

Backend:
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

**Archivos modificados por esta historia:**

Frontend:
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — añade `getById(id, signal?)`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implementa `getById`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — cabla selección con `useNavigate` + `useMatchRoute`; oculta lista en mobile cuando hay detalle activo
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — 2 tests nuevos (selection navigate + isSelected route param)
- `frontend/src/modules/crm/clientes/index.ts` — exporta `useCliente` y `ClienteDetailView`
- `frontend/src/routes/clientes.tsx` — se transforma en layout route con `<Outlet />` (se quita el div placeholder inline; ese contenido pasa a `clientes.index.tsx`)
- `frontend/src/test/msw/handlers.ts` — añade handler `GET /api/v1/clientes/:id`

Backend:
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — añade `GetByIdAsync(Guid, CancellationToken)`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implementa `GetByIdAsync`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — añade `MapGet("/{id:guid}", ...)` con Results.Problem 404
- `backend/src/SiesaAgents.API/Program.cs` — registra `GetClienteByIdQueryHandler`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — 4 tests nuevos (200 by id, 404 problem details, invalid guid, no stack trace leak)

**NO creados en esta historia:**
- `ClienteForm.tsx`, `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente` (Stories 2.3–2.5)
- `SortControl` en `shared/components` (Story 2.6)
- `ContactManager` bindings dentro de `ClienteDetailView` (Epic 4 — asociación cliente-contacto)
- `useCliente` **no** implementa cache warm-up desde `useClientes` (aunque sería posible por queryKey overlap `['clientes', id]` sobre `['clientes']` — decisión: hacer fetch dedicado del detalle para tener siempre los datos frescos; simpler than manual `setQueryData`)

**Conflictos detectados y resolución:**
- `frontend/src/routes/clientes.tsx` — el div placeholder inline ("Selecciona un cliente...") se **mueve** a `clientes.index.tsx` (patrón TanStack Router). El comportamiento visible es idéntico cuando la URL es `/clientes` (placeholder visible en desktop), pero ahora `/clientes/:id` sí puede reemplazarlo vía `<Outlet />`.
- `ClienteListView.tsx` — el `onSelect={() => console.info(...)}` de Story 2.1 se **reemplaza** por `useNavigate`. No hay conflicto de contract porque `ClientListItem.onSelect` es `(id: string) => void`.
- Los tests existentes de `ClienteListView.test.tsx` que mockean el `onSelect` implícito no rompen: el componente ahora invoca `navigate` internamente. En jsdom `useNavigate` de TanStack Router necesita un `RouterProvider` o un mock — los tests existentes de Story 2.1 no lo tenían; **añadir** en el `beforeEach` un `vi.mock('@tanstack/react-router', async () => { const actual = await vi.importActual<...>('@tanstack/react-router'); return { ...actual, useNavigate: () => vi.fn(), useMatchRoute: () => () => false } })`. Esto permite que los tests heredados sigan verdes sin RouterProvider real, y los tests nuevos de Task 10 sobrescriben los mocks localmente.

### References

- Epic 2 source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2]
- Epic 2 AC-E2.3 (view + edit detail): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Epic 2]
- Functional Requirements FR3, FR5, FR27, FR28, FR29, FR30: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md]
- Non-Functional Requirements NFR2, NFR6: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md]
- Architecture — API endpoints (`GET /api/v1/clientes/{id}`): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Frontend routing (`/clientes/:id` → ClienteDetailView): [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — TanStack Query keys (`['clientes', id]` → GET /api/v1/clientes/:id): [Source: _bmad-output/planning-artifacts/architecture.md#TanStack Query keys]
- Architecture — Error handling (Problem Details RFC 7807, no stack traces, NFR6): [Source: _bmad-output/planning-artifacts/architecture.md#Error handling]
- Architecture — Component Boundaries (ClienteListView + ClienteDetailView split panel): [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries]
- Architecture — Frontend folder structure (modules/crm/clientes DDD layers + useCliente + ClienteDetailView): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- UX spec — Phase 3 Detail + ContactManager (nombre, NIT, city, phone in detail header): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Phase 3 — Detail + ContactManager]
- UX spec — Mobile responsive (breakpoint lg, master-detail hide/show): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive]
- UX spec — Error & Recovery Patterns (panel "No se pudo cargar" + "Intentar de nuevo"): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Error & Recovery Patterns]
- Test design epic-2 P1#2, P1#3, P1#12 + R-010 mitigation: [Source: _bmad-output/test-design-epic-2.md]
- Story 2.1 handoff (ClienteListView, useClientes, MSW, react-loading-skeleton, split-panel base): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 1.2 handoff (NotFoundView pattern, routing conventions, AppShell): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]
- Story 1.3 handoff (AppDbContext, ExceptionHandlingMiddleware, ProblemDetails, Scalar): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- Company standards (Clean Arch + DDD, stack, WCAG 2.1 AA, es-CO/EN split, DateTimeOffset, Problem Details, Scalar, snake_case): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- MasterCrud reference (not used in this story — see Alignment section): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- TanStack Router file-based routing + `$` dynamic params: [Source: https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing]
- TanStack Query 5 `retry` function + `enabled` flag: [Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-retries]
- Minimal API route constraints (`:guid`, `:int`, etc.): [Source: https://learn.microsoft.com/aspnet/core/fundamentals/routing#route-constraint-reference]
- Problem Details RFC 7807: [Source: https://datatracker.ietf.org/doc/html/rfc7807]

### UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit@^1.0.255` (ya instalado en Story 1.2)
- **Install:** N/A — ya está en `frontend/package.json`
- **Usage:** Se DEBEN usar componentes de `siesa-ui-kit` para todos los primitivos UI donde exista un equivalente. En esta historia: `Button` (en `NotFoundClientePanel` para "Volver a Clientes"; `ErrorPanel` ya lo usa para "Reintentar").
- **Constraint:** No crear un `Button` custom. `ClienteDetailView` y `NotFoundClientePanel` son **composiciones** que envuelven primitivos siesa-ui-kit + Heroicons + Tailwind. `<dl>/<dt>/<dd>` son elementos HTML nativos con jerarquía semántica — no requieren un componente kit.
- **MasterCrud:** NO aplica a Story 2.2 (justificado en "Alignment with company standards" arriba). Documentar sin implementar.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- Backend build clean (0 warnings, 0 errors).
- Backend tests: 49 unit / 21 integration passed. `MigrationsAndSnakeCaseTests` skipped (Docker/Testcontainers not available in sandbox — same behaviour as Story 2.1 baseline; not a regression).
- Frontend build clean (TypeScript strict). Route tree regenerated by TanStack Router Vite plugin.
- Frontend lint: only pre-existing `react/only-export-components` warnings from routes (colocated `Route` export + component — inherited pattern from Story 1.2).
- Frontend tests: 106 passing (up from 60 at Story 2.1 hand-off).

### Completion Notes List

- E2E specs (`e2e/tests/clientes/story-2.2-client-detail-view.spec.ts`, 15 tests) and API contract specs (`e2e/tests/api/story-2.2-cliente-detail.api.spec.ts`, 4 tests) require Playwright browsers + live backend on `http://localhost:5000`. Backend requires PostgreSQL, and this sandbox has no Docker — **documented as non-blocking**. All test coverage is mirrored inside Vitest suites (`clientes.detail.integration.test.tsx`, `ClienteDetailView.test.tsx`, `useCliente.test.tsx`, `NotFoundClientePanel.test.tsx`) that exercise the same acceptance criteria against MSW mocks.
- `useCliente` retries non-404 responses up to 2 times (per Task 7 spec). Vitest wrappers therefore set `retryDelay: 0` so retry cycles don't blow the 1s `findBy…` timeout.
- Existing Story 2.1 `ClienteListView.test.tsx` suite kept green by mocking `useNavigate` / `useMatchRoute` in the test file — no `RouterProvider` needed for tests that render the component in isolation.
- Route file naming: `clientes.tsx` becomes a layout with `<Outlet />`; `clientes.index.tsx` renders the empty placeholder; `clientes.$clienteId.tsx` renders `ClienteDetailView`. `routeTree.gen.ts` regenerated automatically by the TanStack Router Vite plugin.
- Backend 404 emitted via `Results.Problem(...)` (Problem Details RFC 7807, `application/problem+json`) — NFR6 verified by dedicated integration tests: response body contains no `System.*` / `Microsoft.EntityFrameworkCore` / `.cs:line` signals.

### File List

Created:
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCliente.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.tsx`
- `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.test.tsx`
- `frontend/src/shared/components/NotFoundClientePanel/index.ts`
- `frontend/src/routes/clientes.index.tsx`
- `frontend/src/routes/clientes.$clienteId.tsx`
- `frontend/src/routes/clientes.detail.integration.test.tsx`

Modified:
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added `GetByIdAsync(Guid, CancellationToken)`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented `GetByIdAsync` with `AsNoTracking`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `MapGet("/{id:guid}", ...)` with 404 Problem Details
- `backend/src/SiesaAgents.API/Program.cs` — registered `GetClienteByIdQueryHandler` in DI
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — implemented the new interface member on the fake repo
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — 4 new tests (200 dto, 404 Problem Details, 400 route constraint, no stack-trace leak)
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `getById`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented `getById`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` — wired `useNavigate` + `useMatchRoute`; mobile hide via `hidden lg:flex` when `activeClienteId` is set
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` — added Story 2.2 selection tests + module-level mocks for TanStack Router hooks (keeps Story 2.1 tests green)
- `frontend/src/modules/crm/clientes/index.ts` — exported `useCliente` and `ClienteDetailView`
- `frontend/src/routes/clientes.tsx` — transformed to layout route with `<Outlet />`; empty-detail placeholder moved to `clientes.index.tsx`
- `frontend/src/test/msw/handlers.ts` — added `http.get('*/api/v1/clientes/:id', ...)` handler returning seed or 404 Problem Details
- `frontend/src/routeTree.gen.ts` — regenerated by the TanStack Router Vite plugin (includes `/clientes/$clienteId` and `/clientes/`)
