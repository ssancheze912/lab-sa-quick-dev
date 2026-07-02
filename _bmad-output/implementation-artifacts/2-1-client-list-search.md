# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** hay clientes registrados en el sistema, **When** el usuario navega a `/clientes` en un viewport desktop (≥ 1024px), **Then** en la zona de contenido — a la derecha del `NavigationRail` — se renderiza un panel izquierdo (`data-testid="clientes-list-panel"`) de **exactamente 280px de ancho** (`w-[280px] shrink-0`) que contiene: (a) header con título "Clientes", (b) `Input` de búsqueda con `aria-label="Buscar clientes"` y placeholder `"Buscar por nombre o NIT..."`, y (c) una lista scrollable vertical (`overflow-y-auto`) con **un `ClientListItem` por cliente**, cada uno mostrando `Nombre` (línea 1, `text-sm font-semibold text-slate-900`) y `NIT/RUC` (línea 2, `text-xs text-slate-500`). En viewport móvil (< 1024px) el panel ocupa el ancho completo (`w-full`). (FR2, FR3, FR4 — AC-E2.2 — cubre TC-Story-2.1 en test-design-epic-2 P1#1, P1#4)

2. **Given** la lista de clientes está cargada, **When** el usuario escribe en el campo de búsqueda, **Then** la lista se filtra **en tiempo real** (client-side, sin llamada adicional al backend) mostrando únicamente los clientes cuyo `Nombre` **O** `NIT/RUC` contengan el texto ingresado (comparación **case-insensitive** con `.toLowerCase().includes(query.toLowerCase())` tras `.trim()` del query). El filtrado usa `useMemo` sobre el arreglo del cache de TanStack Query. La lista re-renderiza en **< 1s con hasta 500 registros** (NFR1) — respaldado por un test de performance con dataset seed de 500 clientes. (FR2, FR3, FR4, NFR1 — AC-E2.2 — mapea a P0#6 y P1#4 del test-design-epic-2)

3. **Given** el filtro de búsqueda no coincide con ningún cliente, **When** el `useMemo` retorna un arreglo vacío pero el estado del query es `success` con datos existentes, **Then** dentro del panel izquierdo (donde iban los items) se renderiza un `EmptyState` variante `search-empty` con título `"No se encontró ningún cliente"` y subtítulo `"Intenta con otro nombre o NIT"`; el `Input` de búsqueda **permanece visible y con el foco preservable**. (UX spec — Component Strategy: EmptyState variants)

4. **Given** no hay clientes registrados en el sistema, **When** el usuario navega a `/clientes` y la respuesta del backend es un arreglo vacío `[]`, **Then** el panel izquierdo muestra el header + `Input` de búsqueda **deshabilitado** (`disabled`), y debajo el componente `EmptyState` variante `no-clients` con título `"No hay clientes registrados"`, subtítulo `"Crea el primer cliente del sistema"` y CTA `"Nuevo cliente"` (la acción del CTA solo hace `console.info('TODO: Story 2.3 — Create Client')` en esta historia — el flujo real se implementa en Story 2.3). El `EmptyState` tiene `aria-live="polite"`. (FR2 — AC contexto).

5. **Given** el backend está inalcanzable o retorna un error (5xx, network error, timeout) cuando la página carga, **When** el hook `useClientes` reporta `isError === true`, **Then** el panel izquierdo NO renderiza la lista ni el `EmptyState`, sino un componente `ErrorPanel` (`data-testid="clientes-error-panel"`, `role="alert"`) con:
   - Icono Heroicon `ExclamationTriangleIcon` en rojo
   - Título `"No se pudo cargar"`
   - Subtítulo `"Verifica tu conexión e intenta de nuevo."`
   - `Button` de siesa-ui-kit con texto `"Reintentar"` que al hacer click invoca `refetch()` del `useClientes` (o `queryClient.refetchQueries({ queryKey: ['clientes'] })`).
   El backend **NUNCA** expone stack traces al usuario final: los mensajes son en español y genéricos (NFR6). (AC-E2.2 — Error & Recovery Patterns: "Error de red carga inicial") — mapea a P1#6 del test-design.

6. **Given** los datos aún se están cargando (`useClientes` en estado `isLoading`), **When** el panel se renderiza por primera vez, **Then** en lugar de la lista se muestra un skeleton loader (`react-loading-skeleton`) que imita la forma de **al menos 5 `ClientListItem`** (rectángulos apilados con altura ~56px). El `Input` de búsqueda permanece renderizado pero **deshabilitado** durante el loading. `aria-busy="true"` en el contenedor del skeleton. (UX spec — Loading states)

7. **Given** el panel izquierdo está montado, **When** el usuario recibe la vista, **Then** **todo el texto de UI está en español (es-CO)** — títulos, placeholders, aria-labels, empty states, botones, mensajes de error — y **todo el código** (nombres de componentes, hooks, variables, tipos, test descriptions, query keys, endpoints) **está en inglés**. Se cumple WCAG 2.1 AA (contraste ≥ 4.5:1, `aria-label` en el input, targets táctiles ≥ 44px). (Company standards — es-CO/EN split, WCAG 2.1 AA)

8. **Given** el backend expone `GET /api/v1/clientes`, **When** el frontend hace la petición inicial vía `apiClient` (Axios), **Then** el endpoint responde `200 OK` con un arreglo JSON `ClienteDto[]` — cada objeto con `id` (UUID string), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (ISO 8601), `updatedAt` (ISO 8601). El backend implementa la query en `.NET 10 Minimal API` con `EF Core 10` + PostgreSQL 18 siguiendo Clean Architecture + DDD: `ClienteEntity` (Domain) + `GetClientesQuery`/`GetClientesQueryHandler` (Application/CQRS) + `ClienteRepository` (Infrastructure) + `ClienteEndpoints` (API). Los timestamps son `DateTimeOffset` (nunca `DateTime`), la PK es `Guid` (UUID), el naming de tablas/columnas es snake_case (via `ApplySnakeCaseNaming()`). (Architecture — Data Architecture + API Contracts + Backend Critical Rules)

9. **Given** el proyecto tiene suites de test verdes de historias anteriores, **When** se ejecutan `pnpm --filter frontend build`, `pnpm --filter frontend lint`, `pnpm --filter frontend test`, `dotnet build`, `dotnet test`, **Then** todos completan con **cero errores TypeScript**, cero errores de lint, y **todos los tests unitarios/de componente/de integración pasan** — incluyendo los nuevos tests de esta historia listados en Tasks 12 y 13. (Test design epic-2 — P0/P1 coverage — NFR6 compliance test)

## Tasks / Subtasks

- [ ] **Task 1 — Backend Domain: `ClienteEntity`** (AC: #8)
  - [ ] Crear proyecto (si no existe) `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj` (ya existe, según árbol del repo) y agregar carpeta `Clientes/Entities/`
  - [ ] Crear `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`:
    ```csharp
    namespace SiesaAgents.Domain.Clientes.Entities;

    public class ClienteEntity
    {
        public Guid Id { get; private set; } = Guid.NewGuid();
        public string Nombre { get; private set; } = string.Empty;
        public string Nit { get; private set; } = string.Empty;
        public string Telefono { get; private set; } = string.Empty;
        public string Ciudad { get; private set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

        private ClienteEntity() { } // EF Core

        public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
        {
            if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre requerido", nameof(nombre));
            if (string.IsNullOrWhiteSpace(nit)) throw new ArgumentException("NIT requerido", nameof(nit));
            if (string.IsNullOrWhiteSpace(telefono)) throw new ArgumentException("Telefono requerido", nameof(telefono));
            if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad requerido", nameof(ciudad));

            return new ClienteEntity
            {
                Nombre = nombre.Trim(),
                Nit = nit.Trim(),
                Telefono = telefono.Trim(),
                Ciudad = ciudad.Trim()
            };
        }
    }
    ```
  - [ ] Crear la interfaz de repositorio `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` con al menos `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default)`
  - [ ] `dotnet build` sobre `SiesaAgents.Domain` — cero errores

- [ ] **Task 2 — Backend Infrastructure: EF Core config, DbSet y Migration** (AC: #8)
  - [ ] Crear `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementando `IEntityTypeConfiguration<ClienteEntity>`:
    - Tabla: `clientes` (auto vía `ApplySnakeCaseNaming()`; `ToTable("Clientes")` opcional)
    - `HasKey(c => c.Id)`
    - `Property(c => c.Nombre).IsRequired().HasMaxLength(200)`
    - `Property(c => c.Nit).IsRequired().HasMaxLength(50)`
    - `Property(c => c.Telefono).IsRequired().HasMaxLength(50)`
    - `Property(c => c.Ciudad).IsRequired().HasMaxLength(100)`
    - `Property(c => c.CreatedAt).IsRequired()`
    - `Property(c => c.UpdatedAt).IsRequired()`
    - `HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit")` (unique constraint — R-002 mitigation, requerido por Story 2.3 pero declarado aquí ya que ClienteEntity es el owner)
  - [ ] Agregar en `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
    - `public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();`
    - Eliminar el comentario `NOTE: <c>DbSet&lt;ClienteEntity&gt;</c> is added in Epic 2 Story 2.1.`
  - [ ] Crear implementación `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` con `AppDbContext` inyectado y `GetAllAsync` retornando `await _db.Clientes.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct)` (default sort "Más reciente" según Story 2.6 → sirve para Story 2.6 pero no afecta esta AC porque el sort real se hace client-side)
  - [ ] Generar migration: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verificar que la migración crea `clientes` con columnas snake_case (`id`, `nombre`, `nit`, `telefono`, `ciudad`, `created_at`, `updated_at`) y el índice `uk_clientes_nit`

- [ ] **Task 3 — Backend Application: DTOs + Query CQRS** (AC: #8)
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`:
    ```csharp
    public sealed record ClienteDto(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt);
    ```
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — `public sealed record GetClientesQuery();` (sin parámetros — la búsqueda es client-side por diseño architecture: NFR1 ≤ 500 registros)
  - [ ] Crear `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — inyecta `IClienteRepository`, invoca `GetAllAsync` y proyecta `ClienteEntity → ClienteDto` (no exponer entities directamente)
  - [ ] `dotnet build` sobre `SiesaAgents.Application` — cero errores; añadir referencia a `SiesaAgents.Domain` si no está

- [ ] **Task 4 — Backend API: Endpoint `GET /api/v1/clientes`** (AC: #8)
  - [ ] Crear `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`:
    ```csharp
    public static class ClienteEndpoints
    {
        public static IEndpointRouteBuilder MapClienteEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/clientes").WithTags("Clientes");

            group.MapGet("/", async (GetClientesQueryHandler handler, CancellationToken ct) =>
            {
                var query = new GetClientesQuery();
                var result = await handler.HandleAsync(query, ct);
                return Results.Ok(result);
            });

            return app;
        }
    }
    ```
  - [ ] En `Program.cs`, registrar en DI (antes de `builder.Build()`):
    ```csharp
    builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
    builder.Services.AddScoped<GetClientesQueryHandler>();
    ```
  - [ ] Después de `app.MapScalarApiReference();` invocar `app.MapClienteEndpoints();`
  - [ ] Verificar contra Scalar (`http://localhost:5000/scalar`) que el endpoint está listado y responde `200 [] ` con base de datos vacía
  - [ ] El endpoint NO expone stack traces — `ExceptionHandlingMiddleware` ya lo maneja (Epic 1 Story 1.3 lo dejó configurado)

- [ ] **Task 5 — Backend Tests: Unit + Integration** (AC: #8, #9)
  - [ ] `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs` con:
    - `Create_WithValidData_ReturnsEntity()` — asserts Id no vacío, `CreatedAt` y `UpdatedAt` cercanos a `UtcNow`, campos trimeados
    - `Create_WithEmptyNombre_Throws()` — `Assert.Throws<ArgumentException>`
    - Casos análogos para Nit, Telefono, Ciudad vacíos / null / whitespace
  - [ ] `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`:
    - Mock `IClienteRepository` (Moq o `NSubstitute` — usa lo que ya está en el csproj de UnitTests)
    - Verifica que el handler llama `GetAllAsync` y proyecta a `ClienteDto[]` correctamente
  - [ ] `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` con `WebApplicationFactory<Program>`:
    - `GetClientes_WhenEmpty_Returns200EmptyArray()`
    - `GetClientes_WithSeededData_Returns200WithClientes()` — seed 3 clientes, valida shape del DTO (id, nombre, nit, telefono, ciudad, createdAt, updatedAt) y camelCase JSON
    - Si Testcontainers-PostgreSQL no está disponible, usar EF Core InMemory provider como fallback (per test-design assumption)
  - [ ] `dotnet test` — todos los tests verdes

- [ ] **Task 6 — Frontend Module Structure: `modules/crm/clientes/`** (AC: #1, #7)
  - [ ] Crear la estructura de carpetas siguiendo Clean Architecture + DDD (per architecture.md, per company-standards):
    ```
    frontend/src/modules/crm/clientes/
      domain/
        Cliente.ts                    # Type/interface
        IClienteRepository.ts          # Repository contract
      application/
        useClientes.ts                 # TanStack Query hook — queryKey: ['clientes']
      infrastructure/
        clienteApiRepository.ts        # Axios impl of IClienteRepository
      presentation/
        ClienteListView.tsx            # 280px panel — this story owns it
        ClientListItem.tsx             # List item — this story owns it
        ClienteListView.test.tsx
        ClientListItem.test.tsx
      index.ts                         # Barrel: exports ClienteListView, useClientes, types
    ```
  - [ ] `Cliente.ts`:
    ```ts
    export interface Cliente {
      readonly id: string
      readonly nombre: string
      readonly nit: string
      readonly telefono: string
      readonly ciudad: string
      readonly createdAt: string  // ISO 8601
      readonly updatedAt: string  // ISO 8601
    }
    ```
  - [ ] `IClienteRepository.ts`:
    ```ts
    import type { Cliente } from './Cliente'
    export interface IClienteRepository {
      getAll(signal?: AbortSignal): Promise<Cliente[]>
    }
    ```

- [ ] **Task 7 — Frontend Infrastructure: `clienteApiRepository`** (AC: #8)
  - [ ] `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```ts
    import { apiClient } from '@/shared/lib/apiClient'
    import type { Cliente } from '../domain/Cliente'
    import type { IClienteRepository } from '../domain/IClienteRepository'

    export const clienteApiRepository: IClienteRepository = {
      async getAll(signal) {
        const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
        return data
      },
    }
    ```
  - [ ] `frontend/src/shared/lib/apiClient.ts` ya existe (Epic 1). Verificar que `baseURL` viene de `import.meta.env.VITE_API_URL` (default `http://localhost:5000`) — si no, ajustar

- [ ] **Task 8 — Frontend Application: `useClientes` hook (TanStack Query)** (AC: #2, #5, #6, AC-relacionado con R-004)
  - [ ] `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```ts
    import { useQuery } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    export function useClientes() {
      return useQuery({
        queryKey: ['clientes'] as const,
        queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
        staleTime: 30_000,
      })
    }
    ```
  - [ ] Test unitario `useClientes.test.ts` con `@tanstack/react-query`'s `QueryClientProvider` mock + MSW handler para `/api/v1/clientes` — valida `data` en `isSuccess`, `error` en `isError`, refetch en `Reintentar`

- [ ] **Task 9 — Frontend Shared: `EmptyState`, `ErrorPanel`, `ClientListItem`** (AC: #3, #4, #5)
  - [ ] `frontend/src/shared/components/EmptyState/EmptyState.tsx`:
    ```tsx
    import type { ReactNode } from 'react'
    export type EmptyStateVariant = 'search-empty' | 'no-clients' | 'no-contacts'
    export interface EmptyStateProps {
      variant: EmptyStateVariant
      title: string
      subtitle?: string
      icon?: ReactNode
      cta?: { label: string; onClick: () => void }
    }
    export function EmptyState({ variant, title, subtitle, icon, cta }: EmptyStateProps) { /* ... */ }
    ```
    - Root container: `role="status"`, `aria-live="polite"`, `data-testid={\`empty-state-\${variant}\`}`, layout centrado con Tailwind
    - Icono default por variante (opcional): `MagnifyingGlassIcon` para `search-empty`, `UserGroupIcon` para `no-clients`
    - Colores neutros (Tailwind slate)
  - [ ] `frontend/src/shared/components/EmptyState/EmptyState.test.tsx` — smoke + verifica variantes y aria-live
  - [ ] `frontend/src/shared/components/EmptyState/index.ts` — barrel
  - [ ] `frontend/src/shared/components/ErrorPanel/ErrorPanel.tsx`:
    ```tsx
    import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
    import { Button } from 'siesa-ui-kit'
    export interface ErrorPanelProps {
      title?: string
      message?: string
      onRetry: () => void
      testId?: string
    }
    export function ErrorPanel({
      title = 'No se pudo cargar',
      message = 'Verifica tu conexión e intenta de nuevo.',
      onRetry,
      testId = 'error-panel',
    }: ErrorPanelProps) { /* ... */ }
    ```
    - Root: `role="alert"`, `data-testid={testId}`, layout centrado, icono rojo, `Button` de siesa-ui-kit con texto `"Reintentar"` invocando `onRetry`
  - [ ] `frontend/src/shared/components/ErrorPanel/ErrorPanel.test.tsx` — verifica rendering, click "Reintentar" invoca `onRetry`, `role="alert"`
  - [ ] `frontend/src/shared/components/ErrorPanel/index.ts` — barrel
  - [ ] `frontend/src/modules/crm/clientes/presentation/ClientListItem.tsx`:
    ```tsx
    import type { Cliente } from '../domain/Cliente'
    export interface ClientListItemProps {
      cliente: Cliente
      isSelected?: boolean
      onSelect?: (id: string) => void
    }
    export function ClientListItem({ cliente, isSelected = false, onSelect }: ClientListItemProps) { /* ... */ }
    ```
    - `role="button"`, `tabIndex={0}`, `aria-label={\`Ver cliente: \${cliente.nombre}\`}`
    - Layout: dos líneas verticales — `Nombre` (`text-sm font-semibold text-slate-900`) sobre `NIT/RUC` (`text-xs text-slate-500`)
    - Estados via Tailwind: default (bg-white), hover (`hover:bg-slate-50`), selected (borde izquierdo 3px `border-l-[3px] border-l-primary-600 bg-primary-50` — si el token `primary-600` no existe en Tailwind config, usar `#0e79fd` via `border-l-[#0e79fd]`)
    - `onKeyDown` maneja `Enter` y `Space` para activar `onSelect`
    - Altura mínima `min-h-[44px]` (WCAG touch target)
  - [ ] `ClientListItem.test.tsx` — smoke + selected state + keyboard activation

- [ ] **Task 10 — Frontend Presentation: `ClienteListView` (280px panel)** (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Estado local: `const [searchQuery, setSearchQuery] = useState('')`
    - Datos: `const { data: clientes = [], isLoading, isError, refetch } = useClientes()`
    - Filtrado memoizado:
      ```ts
      const filteredClientes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return clientes
        return clientes.filter(
          (c) =>
            c.nombre.toLowerCase().includes(q) ||
            c.nit.toLowerCase().includes(q),
        )
      }, [clientes, searchQuery])
      ```
    - Layout root: `<aside data-testid="clientes-list-panel" className="flex flex-col w-full lg:w-[280px] lg:shrink-0 border-r border-slate-200 h-full">`
    - Header: `<div className="p-4 border-b border-slate-200"><h2 className="text-lg font-bold text-slate-900">Clientes</h2></div>`
    - Search box: siesa-ui-kit `Input` con:
      - `aria-label="Buscar clientes"`
      - `placeholder="Buscar por nombre o NIT..."`
      - `value={searchQuery}`
      - `onChange={(e) => setSearchQuery(e.target.value)}`
      - `disabled={isLoading || isError || (clientes.length === 0 && !searchQuery)}`
      - `data-testid="clientes-search-input"`
    - Rendering condicional (en este orden):
      1. `isLoading` → skeleton (Task 11)
      2. `isError` → `<ErrorPanel onRetry={() => refetch()} testId="clientes-error-panel" />`
      3. `clientes.length === 0` → `<EmptyState variant="no-clients" title="No hay clientes registrados" subtitle="Crea el primer cliente del sistema" cta={{ label: 'Nuevo cliente', onClick: () => console.info('TODO: Story 2.3 — Create Client') }} />`
      4. `filteredClientes.length === 0` (con query activo) → `<EmptyState variant="search-empty" title="No se encontró ningún cliente" subtitle="Intenta con otro nombre o NIT" />`
      5. Lista scrollable: `<ul role="list" data-testid="clientes-list" className="flex-1 overflow-y-auto">` con `<li key={c.id}>` envolviendo `<ClientListItem>`
    - No hay panel de detalle en esta historia — Story 2.2 lo agrega; por ahora `onSelect` puede ser `undefined` o simplemente `console.info('TODO: Story 2.2 — client detail selection', id)`
  - [ ] `index.ts` barrel: `export { ClienteListView } from './presentation/ClienteListView'`

- [ ] **Task 11 — Skeleton loader** (AC: #6)
  - [ ] Instalar `react-loading-skeleton` (si no está en `package.json` — Epic 1 no lo agregó; el architecture.md lo lista pero verificar): `pnpm --filter frontend add react-loading-skeleton@^3.5.0`
  - [ ] Importar CSS de skeleton en `main.tsx`: `import 'react-loading-skeleton/dist/skeleton.css'`
  - [ ] En `ClienteListView`, cuando `isLoading === true`, renderizar dentro del contenedor con `aria-busy="true"` un `<div>` con 5 `<Skeleton height={56} className="mb-1" />`
  - [ ] Nota: `react-loading-skeleton` NO tiene issues conocidos con React 19 al momento del cutoff; si CI lo rechaza, alternativa aceptable: implementar skeleton inline con `animate-pulse bg-slate-200 h-14 rounded` (Tailwind puro)

- [ ] **Task 12 — Wire `/clientes` route con `ClienteListView`** (AC: #1)
  - [ ] Editar `frontend/src/routes/clientes.tsx` (creado en Story 1.2 como placeholder):
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { ClienteListView } from '@/modules/crm/clientes'

    export const Route = createFileRoute('/clientes')({ component: ClientesPage })

    function ClientesPage() {
      return (
        <section
          data-testid="clientes-view"
          aria-labelledby="clientes-title"
          className="flex h-[calc(100dvh-64px)] lg:h-[100dvh]"
        >
          <h1 id="clientes-title" className="sr-only">Clientes</h1>
          <ClienteListView />
          {/* Detail panel (Story 2.2) will render here to the right */}
          <div className="hidden lg:flex flex-1 items-center justify-center text-slate-400">
            Selecciona un cliente para ver el detalle
          </div>
        </section>
      )
    }
    ```
  - [ ] Verificar que el heading `<h1>Clientes</h1>` sigue siendo accesible por lector de pantalla (Story 1.2 lo verifica en E2E) — moverlo a `sr-only` es aceptable porque el header del panel también dice "Clientes"; **alternativa**: dejar el `<h1>` visible en el header del panel — si Story 1.2 spec asserts `getByRole('heading', { level: 1 }).toHaveText(/Clientes/i)`, esta versión pasa igual porque el header del panel puede ser el `<h1>` en lugar de `<h2>`. Optar por: el `<h1 id="clientes-title">Clientes</h1>` vive DENTRO del `ClienteListView` header en lugar de `sr-only`. Ajustar `ClienteListView` para renderizar `<h1 id="clientes-title" className="text-lg font-bold text-slate-900">Clientes</h1>` y remover el `<h1 className="sr-only">` de `clientes.tsx`.
  - [ ] Confirmar que el spec E2E de Story 1.2 (`e2e/tests/foundation/navigation-shell.spec.ts` TC-E1-P1-02) sigue verde: `page.getByRole('heading', { level: 1 })` matches `/Clientes/i`

- [ ] **Task 13 — MSW handlers** (AC: #5, #9)
  - [ ] Verificar si existe MSW setup del Epic 1 (`frontend/src/test/msw/handlers.ts` o similar). Si NO existe, crear:
    - `frontend/src/test/msw/handlers.ts`:
      ```ts
      import { http, HttpResponse } from 'msw'
      import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

      const seedClientes: Cliente[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          nombre: 'Acme Corp',
          nit: '900123456-7',
          telefono: '+57 300 111 1111',
          ciudad: 'Cali',
          createdAt: '2026-06-01T10:00:00Z',
          updatedAt: '2026-06-01T10:00:00Z',
        },
        // ...
      ]

      export const handlers = [
        http.get('*/api/v1/clientes', () => HttpResponse.json(seedClientes)),
      ]
      ```
    - `frontend/src/test/msw/server.ts` (para Vitest): `import { setupServer } from 'msw/node'; export const server = setupServer(...handlers)`
    - Wire en `frontend/src/test/setup.ts` (existe desde Story 1.2):
      ```ts
      import '@testing-library/jest-dom'
      import { server } from './msw/server'
      beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
      afterEach(() => server.resetHandlers())
      afterAll(() => server.close())
      ```
  - [ ] Añadir factory helper `frontend/src/test/factories/clienteFactory.ts` para generar `Cliente[]` seed:
    ```ts
    import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'
    export function makeCliente(overrides: Partial<Cliente> = {}): Cliente { /* faker o valores determinísticos */ }
    export function makeClientesBulk(n: number): Cliente[]
    ```
  - [ ] Cubrir handlers para: 200 con array, 200 con `[]`, 500 error (usando `HttpResponse.error()` o `HttpResponse.json({ ... }, { status: 500 })`) — usados en tests de EmptyState y ErrorPanel

- [ ] **Task 14 — Frontend tests (Vitest + RTL)** (AC: #1, #2, #3, #4, #5, #6, #9)
  - [ ] `ClienteListView.test.tsx`:
    - `[TC-Story-2.1-P1#5-Empty]` con MSW mockeando `[]` → renderiza `EmptyState` variant `no-clients` con título "No hay clientes registrados"
    - `[TC-Story-2.1-P1#4-Filter]` con MSW mockeando 3 clientes, escribir en el input filtra en tiempo real (case-insensitive) por Nombre y por NIT
    - `[TC-Story-2.1-search-empty]` con MSW mockeando 3 clientes, buscar un string que no matchea → renderiza `EmptyState` variant `search-empty`
    - `[TC-Story-2.1-P1#6-Error]` con MSW mockeando 500 → renderiza `ErrorPanel` con "Reintentar"; click en "Reintentar" invoca `refetch` — asserted via MSW request counter (2 GETs a `/api/v1/clientes`)
    - `[TC-Story-2.1-Loading]` en el primer render antes de que MSW resuelva → asserta `aria-busy="true"` y presencia de skeletons
    - `[TC-Story-2.1-Panel-Width]` en jsdom (proxy en clase Tailwind): asserta que el root `<aside>` tiene la clase `lg:w-[280px]` (assertion de clase — deterministic sin viewport real)
    - `[TC-Story-2.1-Spanish-Labels]` — el `Input` tiene `aria-label="Buscar clientes"` y placeholder `"Buscar por nombre o NIT..."`; el header muestra "Clientes"
    - `[TC-Story-2.1-P0#6-NFR1]` (perf) — en `vitest bench` o test regular con `performance.now()`: seedear 500 clientes vía factory, ejecutar la búsqueda con un query, medir que el re-render del filtered set toma < 900ms (threshold conservador dado overhead de jsdom vs. navegador real; ver R-003 mitigación). Aceptable declararlo como bench separado (`ClienteListView.bench.ts`) si Vitest bench está disponible; si no, test regular con `performance.now()`.
  - [ ] `ClientListItem.test.tsx`: smoke + keyboard (Enter / Space activan `onSelect`) + selected state
  - [ ] `EmptyState.test.tsx`: smoke + variantes + `aria-live="polite"` + CTA invoca onClick
  - [ ] `ErrorPanel.test.tsx`: smoke + click "Reintentar" invoca `onRetry` + `role="alert"`
  - [ ] `useClientes.test.tsx`: happy path (200) + error path (500) → `isError`
  - [ ] Ejecutar `pnpm --filter frontend test` — TODOS los specs (nuevos + existentes de Epic 1) GREEN

- [ ] **Task 15 — Verificación end-to-end (AC: #9)**
  - [ ] `pnpm --filter frontend build` → 0 errores TypeScript
  - [ ] `pnpm --filter frontend lint` → 0 errores
  - [ ] `pnpm --filter frontend test` → todos los tests verdes
  - [ ] `dotnet build backend/SiesaAgents.sln` → 0 errores
  - [ ] `dotnet test backend/SiesaAgents.sln` → todos los tests verdes
  - [ ] Manual sanity: `pnpm --filter frontend dev` + backend corriendo local → visitar `http://localhost:5173/clientes`, ver el panel 280px, buscar en el input (debe filtrar sin latencia), desconectar backend → ver `ErrorPanel` con "Reintentar"

## Dev Notes

### Story 1.2 handoff (relevante para esta historia)

- `AppShell` y `NavigationRail`/`NavigationBar` ya están montados; esta historia sólo agrega contenido dentro del `<Outlet />` de la ruta `/clientes`
- `frontend/src/routes/clientes.tsx` existe como placeholder (`<section data-testid="clientes-view">...</section>`) — esta historia reemplaza su contenido
- El **spec E2E de Story 1.2** ya asserta `page.getByRole('heading', { level: 1 })` matches `/Clientes/i` en `/clientes` → mantener un `<h1>Clientes</h1>` visible o `sr-only` en la nueva vista (Task 12 lo resuelve poniendo el `<h1>` como header del panel)
- El QueryProvider (`frontend/src/app/providers/QueryProvider.tsx`) y el `QueryClient` de TanStack Query ya están wired (Epic 1)
- `apiClient` (Axios singleton) ya vive en `frontend/src/shared/lib/apiClient.ts` (Epic 1)
- Tests de Vitest + jsdom + `@testing-library/jest-dom` + `@testing-library/user-event` ya funcionan; MSW **puede** no estar aún wired al setup — Task 13 lo cablea si no está

### Story 1.3 handoff (backend)

- `AppDbContext` existe con `ApplySnakeCaseNaming()` invocado como última línea de `OnModelCreating` — DO NOT reordenar
- `ExceptionHandlingMiddleware` ya está registrado en `Program.cs` y retorna Problem Details RFC 7807 (NFR6)
- `AddOpenApi()` + `MapScalarApiReference()` ya están wired — cualquier endpoint nuevo aparece automáticamente en `/scalar`
- `AddCors(DevCorsPolicy)` permite `http://localhost:5173` — el frontend puede llamar directamente sin proxy
- NO usar Swagger (`app.UseSwagger()` está prohibido — architecture rule)

### Alignment with company standards

**Clean Architecture + DDD (mandatory):**
- Frontend: `modules/crm/clientes/{domain, application, infrastructure, presentation}` — nunca importar directamente entre módulos hermanos; sólo desde `shared/` (per `.claude/agent-memory/sa-quick-dev/company-standards.md`)
- Backend: `SiesaAgents.Domain` (entities + repo interfaces, cero deps) → `SiesaAgents.Application` (queries + handlers + DTOs) → `SiesaAgents.Infrastructure` (repo impl + EF Core) → `SiesaAgents.API` (endpoints only)

**Stack (locked):**
- Frontend: React 19 (repo actual — el standards dice React 18+; 19 cumple), Vite 8, TS 6, TanStack Query 5, TanStack Router 1, Zustand 5, Tailwind v4, siesa-ui-kit ^1.0.255
- Backend: .NET 10, Minimal API, EF Core 10 + Npgsql, xUnit
- Test: Vitest 4 + RTL + MSW 2 (frontend), xUnit + WebApplicationFactory (backend)

**Convenciones críticas:**
- Guid (UUID) para PKs — NUNCA int autoincremental
- `DateTimeOffset` para timestamps — NUNCA `DateTime`
- snake_case en DB via `ApplySnakeCaseNaming()` — sin atributos `[Column]` manuales
- Problem Details RFC 7807 para errores — sin stack traces al usuario (NFR6)
- Scalar para API docs — Swagger prohibido
- Texto UI 100% en español (es-CO); código 100% en inglés
- WCAG 2.1 AA — `aria-label` en inputs, contraste 4.5:1, touch target 44px
- Bundle < 500KB gzipped — react-loading-skeleton + heroicons son ligeros; sin nuevas deps pesadas
- Package manager: `pnpm` (respetando lockfile existente en frontend; backend usa dotnet)

**Component hierarchy of decision (obligatoria, per UX spec):**
1. siesa-ui-kit primero — `Input`, `Button` de esta historia vienen de aquí
2. shadcn/Radix segundo — no requerido en Story 2.1
3. Custom composition tercero — `ClientListItem`, `EmptyState`, `ErrorPanel` son composiciones custom sobre siesa-ui-kit + Tailwind (siesa-ui-kit no expone estos primitivos genéricos)

**MasterCrud (per mastercrud-use-reference.md):**
- **NO se usa en esta historia.** Story 2.1 es un panel lista de 280px con `ClientListItem` custom y layout split-panel (list + detail) — no una tabla CRUD tradicional. MasterCrud es el patrón para pantallas CRUD basadas en `MasterCrudField[]` + `CrudService<T>`; aquí el flujo es lista scrollable + búsqueda client-side + selección → panel detalle (Story 2.2). El architecture.md explícitamente elige `ClienteListView` + `ClienteDetailView` custom (no MasterCrud) porque el diseño UX es split-panel, no tabla. Documentado por si futuras historias del epic (ej: pantalla admin de clientes) sí lo requieren.

**Client-side search rationale (NFR1 + NFR10):**
- Dataset MVP ≤ 500 clientes (NFR10); el arquitecto decidió carga completa + filtrado client-side vs. endpoint de búsqueda backend
- Ventaja: 0 latencia por keystroke; consistencia total con caché de TanStack Query; Story 2.6 (sort) es trivial
- Trade-off: primera carga baja hasta 500 filas → mitigado por skeleton (Task 11) + `staleTime: 30s`
- Si el proyecto excede 500 registros post-MVP, migrar a `useQuery({ queryKey: ['clientes', { q: searchQuery }], enabled: !!searchQuery })` con debounce 150ms

### Contexto de Story previa (Story 1.2)

Learnings extraídos del `Completion Notes` de Story 1.2 que aplican aquí:
- **CSS ordering:** siesa-ui-kit `styles.css` se importa ANTES de `./index.css` en `main.tsx` — no cambiar ese orden
- **jsdom viewport:** los tests de viewport en jsdom asertan CLASES Tailwind (`lg:w-[280px]`) en lugar de manipular `window.innerWidth` — más determinístico
- **Vite router plugin:** `routeFileIgnorePattern: '\\.(test|spec)\\.(ts|tsx)$'` está configurado — nombrar tests con `.test.tsx` o `.spec.tsx` (nunca al lado de un archivo de ruta sin sufijo)
- **`cssMinify: false`** en `vite.config.ts` — no revertir; lightningcss choca con tokens de siesa-ui-kit
- **`tsconfig.app.json`** ya excluye `*.test.ts(x)` y `src/test/**` del build de producción — los tests no bloquean `pnpm build`
- **`window.location` mock:** `src/test/setup.ts` ya lo swap-ea a un objeto plain configurable — reusable si algún test lo necesita

### Test design references

- `_bmad-output/test-design-epic-2.md` — Story 2.1 mapea a:
  - **P0#6:** Search returns results in <1s with 500-record dataset (NFR1) → Task 14 perf test
  - **P0#7:** cache invalidation — no aplica a esta historia (no hay mutations en Story 2.1), aplica a 2.3/2.4/2.5
  - **P1#1:** GET /clientes list — Task 5 integration test
  - **P1#4:** Real-time search debounced filter matches Nombre and NIT → Task 14
  - **P1#5:** Empty state renders when zero clients returned → Task 14
  - **P1#6:** Error panel with "Reintentar" refetches on click → Task 14
  - **P2#7:** Search on 500-record dataset re-renders within budget → Task 14 bench
  - **R-003 mitigation:** perf bench en Task 14 (NFR1)
  - **R-013 mitigation:** loading skeleton en Task 11 (NFR2)

### Git intelligence (últimos commits sobre patrones a seguir)

- Story 1.2 dejó el patrón `frontend/src/shared/components/{Component}/{Component}.tsx + {Component}.test.tsx + index.ts` — replicar exacto para `EmptyState` y `ErrorPanel`
- Story 1.3 dejó el patrón `SiesaAgents.{Layer}/{Domain}/{Kind}/*.cs` en el backend — replicar para `Clientes`

### Latest tech info (Web research)

- **TanStack Query 5** — `useQuery` accepts `signal` en `queryFn` para abortar peticiones cuando el componente desmonta; se cablea con Axios v1.18 vía `apiClient.get(url, { signal })` (Axios 1.7+ soporta AbortController nativo)
- **MSW 2 (msw@^2.14.6)** — sintaxis `http.get('*/api/v1/clientes', () => HttpResponse.json(data))`; `HttpResponse.error()` simula falla de red
- **siesa-ui-kit 1.0.255** — `Input` component acepta `aria-label`, `placeholder`, `disabled`, `value`, `onChange` estándar; `Button` acepta `variant`, `onClick`
- **react-loading-skeleton 3.5.0** — compatible con React 19; requiere importar `skeleton.css` una vez en `main.tsx`
- **@heroicons/react 2.2** — ya instalado en Story 1.2; `ExclamationTriangleIcon` disponible en `/24/outline`

### Project Structure Notes

**Archivos creados por esta historia:**

Frontend:
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.test.tsx`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClientListItem.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClientListItem.test.tsx`
- `frontend/src/modules/crm/clientes/index.ts` (barrel)
- `frontend/src/shared/components/EmptyState/EmptyState.tsx`
- `frontend/src/shared/components/EmptyState/EmptyState.test.tsx`
- `frontend/src/shared/components/EmptyState/index.ts`
- `frontend/src/shared/components/ErrorPanel/ErrorPanel.tsx`
- `frontend/src/shared/components/ErrorPanel/ErrorPanel.test.tsx`
- `frontend/src/shared/components/ErrorPanel/index.ts`
- `frontend/src/test/msw/handlers.ts` (si no existe)
- `frontend/src/test/msw/server.ts` (si no existe)
- `frontend/src/test/factories/clienteFactory.ts`

Backend:
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Migrations/{timestamp}_AddClientesTable.cs` (auto)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/tests/SiesaAgents.UnitTests/Domain/ClienteEntityTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

**Archivos modificados por esta historia:**
- `frontend/src/routes/clientes.tsx` — reemplaza placeholder con `<ClienteListView />` en layout split-panel
- `frontend/src/test/setup.ts` — wire MSW server (si no está)
- `frontend/src/main.tsx` — importa `react-loading-skeleton/dist/skeleton.css`
- `frontend/package.json` — agrega `react-loading-skeleton`
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — agrega `DbSet<ClienteEntity> Clientes`
- `backend/src/SiesaAgents.API/Program.cs` — registra `IClienteRepository`, `GetClientesQueryHandler`, y monta `MapClienteEndpoints()`

**NO creados en esta historia:**
- `ClienteDetailView.tsx` (Story 2.2)
- `ClienteForm.tsx`, `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente` (Stories 2.3–2.5)
- `SortControl` en `shared/components` (Story 2.6)
- `ContactoEntity` / rutas `/contactos/*` (Epic 3)

**Conflictos detectados y resolución:**
- El `<h1>Clientes</h1>` de la vista placeholder de Story 1.2 se traslada al header del `ClienteListView` (dentro del panel 280px) — el spec E2E de Story 1.2 sigue verde porque busca por `role="heading" level={1}` y texto `/Clientes/i`, sin restringir el ancestro
- El `<p className="mt-2 text-slate-600">La gestión de clientes se habilitará en la Épica 2.</p>` de la placeholder desaparece — ya no es placeholder

### References

- Epic 2 source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Epic 2 AC-E2.2 (search under 1s @ 500 records): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Epic 2]
- Functional Requirements FR1–FR8: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- Non-Functional Requirements NFR1, NFR2, NFR5, NFR6: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md]
- Architecture — Data Architecture (ClienteEntity shape, snake_case DB, DateTimeOffset): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Architecture — API endpoints (`GET /api/v1/clientes`): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Frontend folder structure (modules/crm/clientes DDD layers): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Search strategy (client-side filter over TanStack cache): [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Architecture — Naming conventions (camelCase TS, PascalCase C#, snake_case SQL): [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- UX spec — 280px panel, split layout, real-time search, debounce 150ms, placeholder text: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Search & Filtering Patterns, #Phase 2 Client list panel (280px)]
- UX spec — EmptyState variants (search-empty / no-clients): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EmptyState]
- UX spec — ClientListItem contract (Nombre + Ciudad + Badge; adaptado a Nombre + NIT/RUC per Story 2.1 AC): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ClientListItem]
- UX spec — Error & Recovery Patterns (panel "No se pudo cargar" + "Intentar de nuevo"): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Error & Recovery Patterns]
- UX spec — Toasts (Spanish copy, red 5s + "Reintentar" action): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- Test design epic-2 P0/P1 mapping to Story 2.1: [Source: _bmad-output/test-design-epic-2.md]
- Company standards (Clean Arch + DDD, stack, WCAG 2.1 AA, es-CO/EN split, DateTimeOffset, Scalar, snake_case): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- MasterCrud reference (not used in this story — see Alignment section): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]
- Story 1.2 handoff (AppShell, routes/clientes.tsx placeholder, MSW pending): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md]
- Story 1.3 handoff (AppDbContext + ApplySnakeCaseNaming + ExceptionHandlingMiddleware + Scalar): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- TanStack Query 5 useQuery with AbortSignal: [Source: https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation]
- MSW 2 http handler syntax: [Source: https://mswjs.io/docs/api/http/]

### UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit@^1.0.255` (ya instalado en Story 1.2)
- **Install:** N/A — ya está en `frontend/package.json`
- **Usage:** Se DEBEN usar componentes de `siesa-ui-kit` para todos los primitivos UI donde exista un equivalente. En esta historia: `Input` (search box), `Button` (CTA de EmptyState + "Reintentar" de ErrorPanel).
- **Constraint:** No crear un `Input` custom ni un `Button` custom. Los componentes custom (`ClientListItem`, `EmptyState`, `ErrorPanel`) son **composiciones** que envuelven primitivos siesa-ui-kit + Tailwind, NO reemplazos.
- **MasterCrud:** NO aplica a Story 2.1 (justificado en "Alignment with company standards" arriba). Documentar sin implementar.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

### Completion Notes List

### File List
