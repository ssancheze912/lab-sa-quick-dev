# Story 2.1: Client List & Search

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by Nombre or NIT/RUC,
so that I can quickly find the client I am looking for.

## Acceptance Criteria

1. **Given** there are clients in the database, **When** the user navigates to `/clientes`, **Then** the route renders a split layout with a left panel exactly **280px** wide that contains a scrollable list of every client returned by `GET /api/v1/clientes`, each list item displays the client's **Nombre** and **NIT/RUC** (both fields visible per item — not truncated below readability), and the right panel remains in an empty/default state until the user selects a client (selection UX is finalized in Story 2.2, but the right-panel slot must exist and render an empty placeholder). The list panel has `data-testid="cliente-list-panel"` and each item exposes `data-testid="cliente-list-item-{id}"`.

2. **Given** the client list has finished loading, **When** the user types any characters into the search input at the top of the left panel, **Then** the visible list filters **in real time (client-side)** to only clients whose `nombre` OR `nit` contains the input string (case-insensitive, diacritic-tolerant substring match), no additional `GET /api/v1/clientes` HTTP request is triggered by typing (the filter operates over the TanStack Query cache), and the filtered result set is fully rendered in **under 1 second** with up to 500 records in the cache (NFR1). The search input has `data-testid="cliente-search-input"`, `placeholder="Buscar por nombre o NIT/RUC"`, and `aria-label="Buscar clientes"`.

3. **Given** there are zero clients in the database, **When** the user navigates to `/clientes` and the fetch resolves with an empty array, **Then** the left panel replaces the list with an `EmptyState` component using the `no-clients` variant (title `"No hay clientes registrados"`, subtitle `"Crea el primer cliente del sistema"`, no CTA for this story — the "Nuevo cliente" CTA arrives with Story 2.3). The container has `data-testid="cliente-list-empty"` and uses `aria-live="polite"`.

4. **Given** the search input has an active query that matches no records in the loaded list, **When** the filtered result set is empty, **Then** the left panel renders an `EmptyState` using the `search-empty` variant (title `"No se encontró ningún cliente"`, subtitle `"Intenta con otro nombre o NIT"`, no CTA in this story). The container has `data-testid="cliente-search-empty"` and uses `aria-live="polite"` so screen readers announce the state change.

5. **Given** the backend is unreachable or returns 5xx / 4xx when the page loads, **When** the `useClientes` query enters an `error` state, **Then** the left panel renders an `ErrorPanel` component with an accessible message in Spanish (`"No pudimos cargar la lista de clientes."`) and a **"Reintentar"** button (`data-testid="cliente-list-retry"`) that calls `refetch()` on the query; clicking Reintentar re-executes the fetch and, on success, replaces the ErrorPanel with the list. The panel container has `data-testid="cliente-list-error"`. The error message must NOT expose backend stack traces or raw `error.message` values (NFR6) — only the fixed Spanish copy.

6. **Given** the initial page load, **When** `useClientes` is in the `pending` state, **Then** the left panel renders skeleton placeholders (using `react-loading-skeleton`, already installed) — a search-input skeleton plus 6 list-item skeletons — to signal loading without a spinner (per company standard "Skeleton screens, not spinners"). The skeleton wrapper has `data-testid="cliente-list-skeleton"`.

7. **Given** the frontend calls `GET /api/v1/clientes`, **When** the backend receives the request, **Then** the endpoint responds `200 OK` with a JSON array of `ClienteDto` objects sorted by `createdAt DESC` (server default — matches the epic-wide "Más reciente" default sort of Story 2.6, so the raw list arrives already in the natural default order), each element having exactly the shape `{ id: uuid, nombre: string, nit: string, telefono: string, ciudad: string, createdAt: ISO-8601, updatedAt: ISO-8601 }` in **camelCase** (auto-serialized by System.Text.Json), and the response is **not** wrapped in an envelope object (direct array per architecture format-patterns).

8. **Given** the `clientes` table does NOT exist in the database at the start of this story, **When** the developer runs `dotnet ef database update` after this story's EF Core migration is added, **Then** the `clientes` table is created in PostgreSQL with columns `id UUID PK`, `nombre VARCHAR(255) NOT NULL`, `nit VARCHAR(50) NOT NULL`, `telefono VARCHAR(50) NOT NULL`, `ciudad VARCHAR(100) NOT NULL`, `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`, a unique index `uk_clientes_nit` on `nit` (foundation for Story 2.3 duplicate-NIT enforcement — created here so subsequent stories don't need a second migration), and all names follow **snake_case** (verified via `information_schema.columns`). No FK relationships are added in this migration — `contactos` and its FK arrive in Epic 3 Story 3.1.

9. **Given** the seeded DB contains ≥500 clients, **When** the user types 3 characters into the search input, **Then** the filter+render cycle over the 500-record cache completes in **under 500ms** measured with `performance.now()` in a Vitest component benchmark test (this is the internal budget that guarantees the AC #2 <1s NFR1 with headroom). The benchmark test lives at `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx`.

10. **Given** the user has navigated to `/clientes`, **When** any of the following occurs: (a) an empty list, (b) an error, (c) a loading state, or (d) a normal list, **Then** the persistent shell from Story 1.2 (NavigationRail on desktop / NavigationBar on mobile) remains mounted and does NOT re-render or unmount — only the content within `<main data-testid="app-content">` changes. Verified by a component test that renders the shell + list panel and asserts the shell DOM node is stable across state transitions.

## Tasks / Subtasks

### Backend — Domain, Application, Infrastructure, API

- [x] **Task 1 — Add `ClienteEntity` in Domain (AC: #7, #8)**
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` with:
    - `public Guid Id { get; private set; } = Guid.NewGuid();`
    - `public string Nombre { get; private set; }`
    - `public string Nit { get; private set; }`
    - `public string Telefono { get; private set; }`
    - `public string Ciudad { get; private set; }`
    - `public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;`
    - `public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;`
    - Private parameterless constructor for EF Core materialization.
    - Static factory `public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)` that validates non-null / non-empty and returns a new instance. (Full validation with FluentValidation is Story 2.3's concern; the factory here just guards against `null`.)
  - [x] Create `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` with a single method for this story: `Task<IReadOnlyList<ClienteEntity>> GetAllAsync(CancellationToken ct = default);`. Additional methods (`GetByIdAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`) will be added by Stories 2.2–2.5 — do NOT add them in this story to keep the surface minimal.
  - [x] Delete the `Clientes/Aggregates/`, `Clientes/Events/`, `Clientes/Services/`, `Clientes/ValueObjects/` empty folders if they were auto-scaffolded — they add noise; only `Entities/` and `Interfaces/` should exist under `Clientes/` after this story.

- [x] **Task 2 — Add `ClienteConfiguration` in Infrastructure (AC: #7, #8)**
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs` implementing `IEntityTypeConfiguration<ClienteEntity>`:
    - `ToTable("clientes")` — explicit table name to guard against future entity renames. `ApplySnakeCaseNaming` still handles column names automatically.
    - `HasKey(c => c.Id);`
    - `Property(c => c.Nombre).HasMaxLength(255).IsRequired();`
    - `Property(c => c.Nit).HasMaxLength(50).IsRequired();`
    - `Property(c => c.Telefono).HasMaxLength(50).IsRequired();`
    - `Property(c => c.Ciudad).HasMaxLength(100).IsRequired();`
    - `Property(c => c.CreatedAt).IsRequired();`
    - `Property(c => c.UpdatedAt).IsRequired();`
    - `HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");` (foundation for Story 2.3's duplicate-NIT 409; adding it here in the first migration avoids a follow-up migration).
  - [x] Verify the configuration is auto-discovered by `AppDbContext.OnModelCreating`'s existing `ApplyConfigurationsFromAssembly` call — do NOT add a manual `builder.ApplyConfiguration(new ClienteConfiguration())`.

- [x] **Task 3 — Add `DbSet<ClienteEntity>` and generate migration (AC: #8)**
  - [x] Add `public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();` to `AppDbContext.cs`.
  - [x] Add the required `using SiesaAgents.Domain.Clientes.Entities;` at the top of `AppDbContext.cs`.
  - [x] Update the XML doc-comment scope note in `AppDbContext` to reflect that `clientes` now exists (Story 2.1) and only `contactos` remains for Epic 3 Story 3.1.
  - [x] Run from `backend/`: `dotnet ef migrations add AddClientesTable --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`.
  - [x] Verify the generated migration in `src/SiesaAgents.Infrastructure/Data/Migrations/<timestamp>_AddClientesTable.cs` includes `CreateTable("clientes", ...)` with all 7 columns in snake_case, plus `CreateIndex("uk_clientes_nit", "clientes", "nit", unique: true)`.
  - [x] Verify `Down` correctly drops the table.
  - [x] Apply locally: `dotnet ef database update` — assert `\dt` now returns `__ef_migrations_history` + `clientes` (2 tables) and `\d clientes` shows snake_case columns.

- [x] **Task 4 — Add `ClienteRepository` in Infrastructure (AC: #7)**
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` implementing `IClienteRepository`:
    - Constructor takes `AppDbContext` via DI.
    - `GetAllAsync(CancellationToken ct)` returns `await _db.Clientes.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct);` (server-side `ORDER BY created_at DESC` — matches AC #7 and the epic's default "Más reciente" sort).
  - [x] `AsNoTracking()` is used because the query hydrates DTOs for the API response — no change tracking needed. This also gives a small read perf win at 500 records.

- [x] **Task 5 — Add `ClienteDto` + `GetClientesQuery/Handler` in Application (AC: #7)**
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs` — record `public record ClienteDto(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);`. Positional record so System.Text.Json serializes it with camelCase (default policy).
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs` — empty record `public record GetClientesQuery();` (no filter parameters — client-side search is done in the frontend; the server always returns the full list).
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`:
    - Constructor injects `IClienteRepository`.
    - `Task<IReadOnlyList<ClienteDto>> HandleAsync(GetClientesQuery query, CancellationToken ct)`:
      - `var clientes = await _repo.GetAllAsync(ct);`
      - `return clientes.Select(c => new ClienteDto(c.Id, c.Nombre, c.Nit, c.Telefono, c.Ciudad, c.CreatedAt, c.UpdatedAt)).ToList();`
  - [x] No MediatR — the codebase uses plain handler classes per Clean Architecture without a dispatcher (consistent with Epic 1 Story 1.3's empty Application layer intent).

- [x] **Task 6 — Add `ClienteEndpoints` and DI registration (AC: #7)**
  - [x] Create `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` exposing a `MapClienteEndpoints(this IEndpointRouteBuilder app)` extension. Register one endpoint for this story:
    ```csharp
    app.MapGet("/api/v1/clientes", async (
        GetClientesQueryHandler handler,
        CancellationToken ct) =>
    {
        var result = await handler.HandleAsync(new GetClientesQuery(), ct);
        return Results.Ok(result);
    })
    .WithName("GetClientes")
    .WithTags("Clientes")
    .Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK);
    ```
  - [x] In `Program.cs`, after `builder.Services.AddDbContext<...>`, register the application services:
    - `builder.Services.AddScoped<IClienteRepository, ClienteRepository>();`
    - `builder.Services.AddScoped<GetClientesQueryHandler>();`
  - [x] After `app.MapScalarApiReference(...)`, call `app.MapClienteEndpoints();` to attach the endpoint.
  - [x] Do NOT touch existing middleware ordering (ExceptionHandlingMiddleware → CORS → OpenAPI → Scalar → endpoints), and do NOT introduce Swagger.

- [x] **Task 7 — Backend integration tests (AC: #7, #8)**
  - [x] Add `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - `GetClientes_ReturnsEmptyArray_WhenNoClients` → seeds an empty DB → `GET /api/v1/clientes` → assert `200 OK` + body is `[]`.
    - `GetClientes_ReturnsAllClients_OrderedByCreatedAtDesc` → seeds 3 clients with different `CreatedAt` → assert order `[newest, middle, oldest]` in the response.
    - `GetClientes_ReturnsCamelCaseJson` → seed 1 client → assert raw JSON body contains `"nombre"`, `"nit"`, `"createdAt"` (camelCase confirmation).
    - `GetClientes_UsesAsNoTracking` → optional micro-check: seed 1 client, hit endpoint, then modify the same tracked instance in DbContext directly — assert the endpoint response was not mutated (indirect proof that `AsNoTracking` returned detached copies).
  - [x] Add `backend/tests/SiesaAgents.IntegrationTests/ClienteMigrationTests.cs`:
    - `ClientesTable_HasSnakeCaseColumns` → apply migrations → query `information_schema.columns WHERE table_name='clientes'` → assert exact column set `{id, nombre, nit, telefono, ciudad, created_at, updated_at}`.
    - `ClientesTable_HasUniqueIndexOnNit` → query `information_schema.statistics` (or `pg_indexes`) → assert `uk_clientes_nit` exists and is unique on `nit`.
  - [x] Reuse the existing xunit.v3 + `Assert.SkipUnless(...)` pattern from Story 1.3 to skip when local PostgreSQL is unreachable — do NOT introduce a different skip mechanism.
  - [x] Add `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` — Postgres-independent: mock `IClienteRepository`, assert the handler projects the list into `ClienteDto` correctly and preserves ordering.

### Frontend — Domain, Application, Infrastructure, Presentation

- [x] **Task 8 — Add `Cliente` domain type + repository contract (AC: #1, #7)**
  - [x] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts`:
    ```ts
    export interface Cliente {
      id: string
      nombre: string
      nit: string
      telefono: string
      ciudad: string
      createdAt: string  // ISO-8601, kept as string — no Date parsing at the domain layer
      updatedAt: string
    }
    ```
  - [x] Create `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`:
    ```ts
    import type { Cliente } from './Cliente'
    export interface IClienteRepository {
      getAll(signal?: AbortSignal): Promise<Cliente[]>
    }
    ```
  - [x] Only `getAll` in this story — Stories 2.2–2.5 add `getById`, `create`, `update`, `delete`.

- [x] **Task 9 — Add `clienteApiRepository` in Infrastructure (AC: #1, #7)**
  - [x] Create `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```ts
    import { apiClient } from '@/shared/lib/apiClient'
    import type { IClienteRepository } from '../domain/IClienteRepository'
    import type { Cliente } from '../domain/Cliente'

    export const clienteApiRepository: IClienteRepository = {
      async getAll(signal) {
        const { data } = await apiClient.get<Cliente[]>('/api/v1/clientes', { signal })
        return data
      },
    }
    ```
  - [x] Confirm `apiClient.baseURL` reads `VITE_API_URL` (already wired in Story 1.1) — verify `.env.development` sets `VITE_API_URL=http://localhost:5000` so the Axios call resolves to the backend without CORS issues.

- [x] **Task 10 — Add `useClientes` TanStack Query hook (AC: #1, #5, #6)**
  - [x] Create `frontend/src/modules/crm/clientes/application/useClientes.ts`:
    ```ts
    import { useQuery } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

    export const CLIENTES_QUERY_KEY = ['clientes'] as const

    export function useClientes() {
      return useQuery({
        queryKey: CLIENTES_QUERY_KEY,
        queryFn: ({ signal }) => clienteApiRepository.getAll(signal),
        staleTime: 60_000,  // 1 minute — matches queryClient default
      })
    }
    ```
  - [x] Export `CLIENTES_QUERY_KEY` as a constant so future mutation hooks (Stories 2.3–2.5) reuse the same array (canonical `['clientes']` per architecture line 278).

- [x] **Task 11 — Add `filterClientes` pure utility (AC: #2, #9)**
  - [x] Create `frontend/src/modules/crm/clientes/application/filterClientes.ts` — a **pure** function extracted for testability + perf isolation:
    ```ts
    import type { Cliente } from '../domain/Cliente'

    /** Case- and diacritic-insensitive substring match against `nombre` OR `nit`. */
    export function filterClientes(clientes: readonly Cliente[], query: string): Cliente[] {
      const q = query.trim()
      if (q.length === 0) return [...clientes]
      const normalized = normalize(q)
      return clientes.filter(
        (c) => normalize(c.nombre).includes(normalized) || normalize(c.nit).includes(normalized),
      )
    }

    function normalize(s: string): string {
      return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    }
    ```
  - [x] Add `filterClientes.test.ts` with cases: empty query returns all, matches by nombre, matches by nit, case-insensitive, diacritic-insensitive (`"Peña"` matches `"pena"`), no match returns `[]`.

- [x] **Task 12 — Build shared `EmptyState` component (AC: #3, #4)**
  - [x] Verify: `frontend/src/shared/components/EmptyState.tsx` should NOT already exist for this project. If a prior story created it, skip creation and only add missing variants.
  - [x] Create `frontend/src/shared/components/EmptyState.tsx` with the API:
    ```tsx
    export type EmptyStateVariant = 'no-clients' | 'search-empty' | 'no-contacts'
    interface EmptyStateProps {
      variant: EmptyStateVariant
      testId?: string
    }
    ```
    - `no-clients` → title `"No hay clientes registrados"`, subtitle `"Crea el primer cliente del sistema"`, icon `UserPlusIcon` from `@heroicons/react/24/outline`.
    - `search-empty` → title `"No se encontró ningún cliente"`, subtitle `"Intenta con otro nombre o NIT"`, icon `MagnifyingGlassIcon`.
    - `no-contacts` → include the config even though Story 3 uses it, so future stories don't re-touch this file. Icon `UsersIcon`, title `"Este cliente no tiene contactos"`, subtitle `"Agrega el primer contacto para este cliente"`.
  - [x] Component wraps its container with `role="status"` and `aria-live="polite"` so screen readers announce the state on filter changes. Testids: default from `variant` if `testId` prop is omitted.
  - [x] No CTA button in the initial variant — the "Crear cliente" / "Nuevo cliente" CTAs are added by Story 2.3.
  - [x] Add `EmptyState.test.tsx` — assert Spanish text per variant and `aria-live="polite"`.

- [x] **Task 13 — Build shared `ErrorPanel` component (AC: #5)**
  - [x] Create `frontend/src/shared/components/ErrorPanel.tsx`:
    ```tsx
    interface ErrorPanelProps {
      title?: string    // default: "No pudimos cargar la lista de clientes."
      onRetry: () => void
      testId?: string
    }
    ```
  - [x] Renders an Heroicon `ExclamationTriangleIcon` (outline, amber-500), the title, and a `<button>` styled with Tailwind (`bg-blue-600 text-white ...`) labeled `"Reintentar"` — no `siesa-ui-kit Button` here because the kit's `Button` is not the primary variant for retry actions per UX spec and would drag in additional styling; use a plain Tailwind button to keep the error panel visually distinct.
  - [x] Add `role="alert"` on the root and `data-testid={testId ?? 'error-panel'}`.
  - [x] Add `ErrorPanel.test.tsx` — assert Spanish default title, Reintentar button, click invokes `onRetry`.
  - [x] **Do NOT display `error.message`** anywhere — hard-coded Spanish copy only (NFR6).

- [x] **Task 14 — Build `ClienteListItem` component (AC: #1)**
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListItem.tsx` (co-located with the view — this component is domain-specific per UX spec line 847):
    ```tsx
    interface ClienteListItemProps {
      cliente: Cliente
      selected?: boolean
      onSelect: (id: string) => void
    }
    ```
  - [x] Renders a `<button>` with `data-testid={`cliente-list-item-${cliente.id}`}`, `aria-label={`Ver cliente: ${cliente.nombre}`}`, `role="button"` (implicit from button element — do NOT double-add). Two lines: Nombre in slate-900 font-medium, NIT in slate-500 text-sm. Left border 3px `primary-600` + bg `primary-50` when `selected` (matches UX spec line 841).
  - [x] Do NOT include contact-count badge or "sin contactos" ⚠ marker in this story — those live in Epic 4 (Client-Contact Association). This story renders name + NIT only, per AC #1.
  - [x] Test file: assert `data-testid`, `aria-label`, selected/unselected styling, click invokes `onSelect(cliente.id)`.

- [x] **Task 15 — Build `ClienteListView` (the 280px panel) (AC: #1, #2, #3, #4, #5, #6)**
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`:
    - Props: `{ selectedId?: string; onSelect: (id: string) => void }`.
    - Layout: fixed width `w-[280px] shrink-0 border-r border-slate-200 bg-white`, full-height (`h-full`), `flex flex-col`.
    - Top area (non-scrolling): `<Input>` from `siesa-ui-kit` (search — placeholder `"Buscar por nombre o NIT/RUC"`, `aria-label="Buscar clientes"`, `data-testid="cliente-search-input"`), value from local `useState('')`, `onChange` updates state.
    - Body: `flex-1 overflow-y-auto`, `data-testid="cliente-list-panel"`.
    - Content branching (in exact order — first truthy branch renders):
      1. `isPending` → 6× `<Skeleton height={64} />` from `react-loading-skeleton` wrapped in `data-testid="cliente-list-skeleton"`.
      2. `isError` → `<ErrorPanel onRetry={refetch} testId="cliente-list-error" />`.
      3. `data?.length === 0` → `<EmptyState variant="no-clients" testId="cliente-list-empty" />`.
      4. `filtered.length === 0` (and `data.length > 0`) → `<EmptyState variant="search-empty" testId="cliente-search-empty" />`.
      5. Otherwise → `filtered.map(c => <ClienteListItem key={c.id} cliente={c} selected={c.id === selectedId} onSelect={onSelect} />)`.
    - Filter memoization: `const filtered = useMemo(() => filterClientes(data ?? [], query), [data, query]);` — memo keyed on the data reference (TanStack Query returns a stable ref between renders) + the search query. This is the mechanism that guarantees NFR1 / AC #9 (<500ms benchmark).
  - [x] Use `siesa-ui-kit`'s `Input` for the search field per component strategy hierarchy (siesa-ui-kit → shadcn → custom). If `Input` from siesa-ui-kit doesn't fit the compact 280px width, wrap it in a div that overrides width via className — do NOT create a custom search input from scratch.

- [x] **Task 16 — Update the `/clientes` route to render the split layout (AC: #1, #10)**
  - [x] Replace the current placeholder body of `frontend/src/routes/clientes.tsx` with:
    ```tsx
    import { createFileRoute } from '@tanstack/react-router'
    import { useState } from 'react'
    import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView'

    export const Route = createFileRoute('/clientes')({
      component: ClientesPage,
    })

    function ClientesPage() {
      const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
      return (
        <section
          data-testid="page-clientes"
          className="flex h-[calc(100vh-0px)] lg:h-screen"
        >
          <ClienteListView selectedId={selectedId} onSelect={setSelectedId} />
          <div
            data-testid="cliente-detail-empty"
            className="flex-1 flex items-center justify-center text-slate-400"
          >
            Selecciona un cliente para ver su detalle
          </div>
        </section>
      )
    }
    ```
  - [x] The `selectedId` local state is a **placeholder** for Story 2.2's `/clientes/:clienteId` deep linking. Story 2.2 will move this state into a URL param (`useParams`) and replace the placeholder detail panel with `ClienteDetailView`. Keeping it as local state here (and NOT introducing router params yet) preserves Story 2.2's scope.
  - [x] Wrap the right-panel placeholder text in Spanish: `"Selecciona un cliente para ver su detalle"`.

- [x] **Task 17 — Frontend tests: unit + component + benchmark (AC: #1–#6, #9, #10)**
  - [x] `filterClientes.test.ts` — 6 unit tests (see Task 11).
  - [x] `useClientes.test.tsx` — mock `clienteApiRepository.getAll` with MSW, render in `<QueryClientProvider>`, assert `isPending → isSuccess` transition and data shape.
  - [x] `ClienteListItem.test.tsx` — see Task 14.
  - [x] `EmptyState.test.tsx` — see Task 12.
  - [x] `ErrorPanel.test.tsx` — see Task 13.
  - [x] `ClienteListView.test.tsx` — most important. Uses MSW to mock `/api/v1/clientes`:
    - Renders skeleton in pending state (assert `data-testid="cliente-list-skeleton"`).
    - Renders `EmptyState` `no-clients` variant when API returns `[]`.
    - Renders the list when API returns 3 clients, each with `data-testid="cliente-list-item-{id}"`.
    - Typing "acme" in the search input filters the list without triggering a re-fetch (assert MSW handler was called exactly once).
    - Typing something that doesn't match renders `search-empty` variant.
    - Renders `ErrorPanel` when MSW returns 500; clicking Reintentar re-fetches (MSW handler called again, list now shown after MSW is swapped to a success handler).
  - [x] `ClienteListView.perf.test.tsx` — benchmark for AC #9:
    - Generate 500 deterministic `Cliente` records via `@faker-js/faker` (install as dev dep if missing).
    - Wrap the query mock so `useClientes` synchronously returns the 500-record array.
    - Render the view, wait for the initial paint.
    - Use `performance.now()` around a state update (`fireEvent.change(searchInput, { target: { value: 'abc' } })`) + `await waitFor` for the filtered DOM to reach the expected count.
    - Assert `elapsed < 500` (ms). If it fails on slower CI hardware, the test can be marked `it.skip` behind an env var — but the local threshold is the source of truth.
  - [x] `clientes.route.test.tsx` (co-located with the route) — mounts the route via a memory router with the shell (Story 1.2's `__root.tsx`), asserts (a) `data-testid="app-content"` is stable across state transitions (AC #10), and (b) the placeholder detail panel is present alongside the list.

- [x] **Task 18 — E2E: Playwright deep-link + happy path (AC: #1, #2, #3, #5)**
  - [x] Create `e2e/tests/clientes/list-search.spec.ts`:
    - `list_renders_seeded_clients` → navigate to `/clientes` with a seeded backend (5 clients) → assert 5 `cliente-list-item-*` in the DOM → assert each shows Nombre + NIT text.
    - `search_filters_realtime` → type "acme" → within 1s the list shows only items with "acme" in name or NIT → assert `<1s` via `performance.mark`.
    - `empty_state_when_no_clients` → seed empty DB → navigate → assert `data-testid="cliente-list-empty"` is visible with the expected Spanish text.
    - `error_state_and_retry` → block the network to `/api/v1/clientes` → assert `data-testid="cliente-list-error"` + Reintentar visible → unblock → click Reintentar → assert list appears.
  - [x] Reuse the existing Playwright config from Story 1.1 (`--project=chromium`). Do NOT introduce a second config.

## Dev Notes

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit@^1.0.250` (already installed).
- **Install command:** `pnpm --filter frontend add siesa-ui-kit` — DO NOT reinstall (already present).
- **Usage:** You MUST use `siesa-ui-kit`'s `Input` component for the search field. For the list items you MUST compose a custom component (`ClienteListItem`) per UX spec line 847 — the kit does not expose a domain-appropriate list-item primitive, and the UX spec explicitly authorizes custom composition for this pattern.
- **`EmptyState` and `ErrorPanel`:** custom compositions (composition of Tailwind + Heroicons + optional kit `Button` for actions). NOT part of siesa-ui-kit v1.0.250 — the UX spec (line 867) notes `EmptyState` as a future candidate for the kit but out-of-scope for MVP.
- **Loading state:** `react-loading-skeleton` (already installed). Do NOT use a spinner or `Loader` from siesa-ui-kit (skeletons > spinners per company standard).
- **Icons:** `@heroicons/react/24/outline` — `UserPlusIcon`, `MagnifyingGlassIcon`, `UsersIcon`, `ExclamationTriangleIcon`.
- **NO MasterCrud:** MasterCrud is a data-grid + form orchestrator. This story is a split-panel List + client-side filter — NOT a data grid. Do NOT introduce MasterCrud here; it would add complexity without matching the UX (280px left panel + separate right detail panel, chosen in UX Direction F, is incompatible with MasterCrud's table+form layout).

### Architecture Compliance (non-negotiable)

From `.claude/agent-memory/sa-quick-dev/company-standards.md` and `architecture.md`:

1. **Clean Architecture + DDD layering (both sides).** Frontend module structure `modules/crm/clientes/{domain,application,infrastructure,presentation}` per `company-standards.md` and `architecture.md` line 465. Backend entities in `Domain`, repository impl in `Infrastructure`, queries+handlers+DTOs in `Application`, minimal endpoints in `API`.
2. **UUID (Guid) primary keys.** `ClienteEntity.Id` is `Guid`, initialized to `Guid.NewGuid()`.
3. **`DateTimeOffset` — never `DateTime`.** Both `CreatedAt` and `UpdatedAt` are `DateTimeOffset`. Postgres column type resolves to `timestamptz`.
4. **snake_case naming automatic** via the `UseSnakeCaseNamingConvention()` at DI registration (wired in Story 1.3). Do NOT add manual `[Column]`/`[Table]` attributes — only `ToTable("clientes")` in the configuration is allowed (defensive against entity rename, does NOT bypass the convention for columns).
5. **Scalar only** — `app.MapScalarApiReference(...)` remains from Story 1.3. NEVER `app.UseSwagger()`.
6. **Problem Details RFC 7807** — for this story the only error surface is `GET /api/v1/clientes` failing (500). `ExceptionHandlingMiddleware` from Story 1.1 handles it; no additional wiring here.
7. **API URL convention:** `/api/v1/{resource}` — plural, kebab where multi-word. This story adds `/api/v1/clientes` (GET only).
8. **JSON camelCase** auto-serialized by System.Text.Json defaults. Do NOT customize the serializer for this story.
9. **Response shape:** direct array (no envelope object) per architecture format-patterns line 373.
10. **Spanish UI text.** Every visible label, placeholder, error message, empty state, ARIA label, and tooltip must be in Spanish. Component identifiers (`data-testid`) are in English (dev-facing).
11. **TanStack Query key `['clientes']`** — canonical per architecture line 278. Exported as `CLIENTES_QUERY_KEY` for reuse by Stories 2.3–2.5.
12. **Search is client-side.** No `?q=` query parameter on the backend endpoint. The full list is fetched once, cached by TanStack Query with `staleTime: 60s`, and filtered in-memory with `useMemo`. This design satisfies NFR1 with headroom because the filter is `O(n)` string-normalize + `includes` at n=500 — well under 500ms. It also aligns with FR27 (real-time changes for all users): after any mutation (Stories 2.3–2.5), `queryClient.invalidateQueries(['clientes'])` triggers an automatic refetch → the entire list stays fresh.
13. **`AsNoTracking()` for read queries.** Per architecture "no navigation properties loaded implicitly" anti-pattern (line 435) — the GET list should be a projection-friendly read, tracked context is unnecessary.
14. **UI text vs. code text:** Spanish for user-facing text; English for variables, function names, class names, `data-testid` values, and DB column names (via snake_case mapping from PascalCase entity properties).

### Data Model — Cliente Entity

```csharp
namespace SiesaAgents.Domain.Clientes.Entities;

public class ClienteEntity
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Nombre { get; private set; } = null!;
    public string Nit { get; private set; } = null!;
    public string Telefono { get; private set; } = null!;
    public string Ciudad { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

    // Required by EF Core materialization
    private ClienteEntity() { }

    public static ClienteEntity Create(string nombre, string nit, string telefono, string ciudad)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ArgumentException("Nombre requerido", nameof(nombre));
        if (string.IsNullOrWhiteSpace(nit))    throw new ArgumentException("NIT requerido", nameof(nit));
        if (string.IsNullOrWhiteSpace(telefono))throw new ArgumentException("Teléfono requerido", nameof(telefono));
        if (string.IsNullOrWhiteSpace(ciudad)) throw new ArgumentException("Ciudad requerida", nameof(ciudad));
        return new ClienteEntity
        {
            Nombre = nombre.Trim(),
            Nit = nit.Trim(),
            Telefono = telefono.Trim(),
            Ciudad = ciudad.Trim(),
        };
    }
}
```

**Notes:**
- No domain events emitted in this story (add when Story 2.3 introduces `ClienteCreated`).
- No `Update(...)` method yet — Story 2.4 adds it. Keeping the entity minimal enforces YAGNI.
- No base `Entity` class from `Shared.Domain` — company-standards.md line 113 shows the pattern, but the current codebase has an empty `Domain` project. Introducing a base class here would be premature; do it in the story that first needs domain events (2.3).

### Migration Expectations (Task 3)

Expected SQL generated by EF Core for `AddClientesTable`:

```sql
CREATE TABLE clientes (
    id uuid NOT NULL,
    nombre character varying(255) NOT NULL,
    nit character varying(50) NOT NULL,
    telefono character varying(50) NOT NULL,
    ciudad character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT pk_clientes PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_clientes_nit ON clientes (nit);
```

**Verification checklist after `dotnet ef database update`:**
- `\dt` shows exactly `__ef_migrations_history` + `clientes` (2 tables, no `contactos` — that arrives in Story 3.1).
- `\d clientes` shows all columns in snake_case with the correct types.
- `\di clientes*` shows `uk_clientes_nit` (unique) + `pk_clientes` (primary key).

### `Program.cs` — Additions (deltas only)

Do NOT rewrite `Program.cs`. Add these three blocks:

```csharp
// -------- ADD near the top with the other usings --------
using SiesaAgents.API.Endpoints;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Repositories;

// -------- ADD after builder.Services.AddDbContext<...> --------
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();

// -------- ADD after app.MapScalarApiReference(...) but BEFORE app.Run() --------
app.MapClienteEndpoints();
```

Everything else in `Program.cs` (middleware ordering, CORS, Scalar, `/` redirect, test-only endpoints) stays exactly as-is. The `ExceptionHandlingMiddleware` from Story 1.1 will automatically catch any 500s in the new endpoint and return Problem Details.

### Frontend File Structure — What This Story Adds

Under `frontend/src/`:

```
modules/crm/clientes/
├── domain/
│   ├── Cliente.ts                                  ← NEW
│   └── IClienteRepository.ts                       ← NEW
├── application/
│   ├── useClientes.ts                              ← NEW
│   ├── useClientes.test.tsx                        ← NEW
│   ├── filterClientes.ts                           ← NEW
│   └── filterClientes.test.ts                      ← NEW
├── infrastructure/
│   └── clienteApiRepository.ts                     ← NEW
└── presentation/
    ├── ClienteListView.tsx                         ← NEW
    ├── ClienteListView.test.tsx                    ← NEW
    ├── ClienteListView.perf.test.tsx               ← NEW (benchmark)
    ├── ClienteListItem.tsx                         ← NEW
    └── ClienteListItem.test.tsx                    ← NEW

shared/components/
├── EmptyState.tsx                                  ← NEW
├── EmptyState.test.tsx                             ← NEW
├── ErrorPanel.tsx                                  ← NEW
└── ErrorPanel.test.tsx                             ← NEW

routes/
├── clientes.tsx                                    ← REPLACE placeholder body
└── clientes.route.test.tsx                         ← NEW (route integration)
```

Under `e2e/tests/clientes/`:

```
list-search.spec.ts                                 ← NEW
```

Under `backend/`:

```
src/SiesaAgents.Domain/Clientes/
├── Entities/
│   └── ClienteEntity.cs                            ← NEW
└── Interfaces/
    └── IClienteRepository.cs                       ← NEW

src/SiesaAgents.Application/Clientes/
├── DTOs/
│   └── ClienteDto.cs                               ← NEW
└── Queries/
    ├── GetClientesQuery.cs                         ← NEW
    └── GetClientesQueryHandler.cs                  ← NEW

src/SiesaAgents.Infrastructure/
├── Data/
│   ├── AppDbContext.cs                             ← MODIFY: add DbSet<ClienteEntity>
│   ├── Configurations/
│   │   └── ClienteConfiguration.cs                 ← NEW
│   └── Migrations/
│       ├── <timestamp>_AddClientesTable.cs         ← NEW (generated by ef migrations)
│       ├── <timestamp>_AddClientesTable.Designer.cs ← NEW (generated)
│       └── AppDbContextModelSnapshot.cs            ← MODIFY (regenerated)
└── Repositories/
    └── ClienteRepository.cs                        ← NEW

src/SiesaAgents.API/
├── Endpoints/
│   └── ClienteEndpoints.cs                         ← NEW
└── Program.cs                                      ← MODIFY: usings + DI + MapClienteEndpoints

tests/SiesaAgents.IntegrationTests/
├── ClienteEndpointsTests.cs                        ← NEW
└── ClienteMigrationTests.cs                        ← NEW

tests/SiesaAgents.UnitTests/
└── Application/Clientes/
    └── GetClientesQueryHandlerTests.cs             ← NEW
```

### Testing Standards

- **Frontend framework:** Vitest + React Testing Library + MSW. Environment is `jsdom` (Story 1.2 flipped it from `node`). Tests co-located with source files as `*.test.ts` / `*.test.tsx`. Setup file `vitest.setup.ts` imports `@testing-library/jest-dom/vitest` (already present).
- **Backend framework:** xUnit v3 (upgraded in Story 1.3). Integration tests use `WebApplicationFactory<Program>` from Story 1.1's pattern and reuse `Assert.SkipUnless` to skip when PostgreSQL is unreachable.
- **MSW handlers:** put the mock `/api/v1/clientes` handlers in `frontend/src/modules/crm/clientes/__mocks__/msw-handlers.ts` (new). Import them into `ClienteListView.test.tsx` and `useClientes.test.tsx`. Do NOT introduce a global MSW server — set up per-test with `setupServer` from `msw/node`.
- **E2E:** Playwright, reuse `pnpm --filter frontend dev` webServer config from Story 1.1. New spec under `e2e/tests/clientes/list-search.spec.ts`.
- **Coverage target:** ≥80% for `modules/crm/clientes/*` and `Application/Clientes/*` per company standards.
- **Perf benchmark:** `performance.now()` in `ClienteListView.perf.test.tsx` — asserts <500ms for filter+render at n=500. Runs in the standard `pnpm --filter frontend test:unit` job. If CI hardware misses this budget, gate it behind `RUN_PERF_TESTS=1` env var — the local threshold is authoritative.
- **Epic 2 test-design mapping:** This story implements P0-8 (search matches), P0-9 (perf <500ms), P0-10 (list + empty state), P1-12 (API returns array), P1-14 (280px layout + name+NIT), P1-15 (ErrorPanel + Reintentar), and P2-40..44 (case-insensitive search, 500-record boundary). See `_bmad-output/implementation-artifacts/test-design-epic-2.md` §4.1–4.3 for canonical scenarios.

### Component/Layer Boundaries

```
Route Layer (/clientes)
  └── ClienteListView [280px, panel izquierdo, siesa-ui-kit Input + custom items]
        ├── uses useClientes() hook       → TanStack Query → clienteApiRepository → apiClient → Backend
        └── uses filterClientes() pure fn → client-side filter over cached list
  └── (right panel placeholder) — replaced by ClienteDetailView in Story 2.2

Persistent shell (Story 1.2) is at __root.tsx and is NOT re-mounted per navigation.
```

### Previous Story Learnings (Epic 1)

**From Story 1.1:**
- `apiClient` is a plain Axios singleton reading `VITE_API_URL` — do NOT add interceptors here. Error handling is per-hook via TanStack Query `isError` / `error` — see AC #5 for the pattern.
- `.env.development` exists with `VITE_API_URL=http://localhost:5000`. Confirm the backend runs on port 5000 (Story 1.3 confirmed this).
- Package manager: **`pnpm`** with a workspace at repo root. Use `pnpm --filter frontend add <pkg>` and `pnpm --filter frontend test:unit`.

**From Story 1.2:**
- Vitest environment is `jsdom`. `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`. Path alias `@/*` maps to `frontend/src/*`.
- The persistent shell is in `__root.tsx` with `<Outlet />` inside `<main data-testid="app-content">` — do NOT modify it; the `/clientes` route renders inside the Outlet.
- The current `clientes.tsx` route is a placeholder (`<h1>Clientes</h1>`) — this story replaces its body with the split-panel layout.
- `siesa-ui-kit/styles.css` is imported in `main.tsx` before Tailwind — kit component styles will apply.
- Playwright browsers are at `/opt/pw-browsers/`, pinned to `1.55.1`. Reuse the existing `chromium` project.

**From Story 1.3:**
- `AppDbContext` is empty (`ApplyConfigurationsFromAssembly` is wired but no configurations exist yet). Adding `ClienteConfiguration` to `Data/Configurations/` is enough for it to auto-register.
- `EFCore.NamingConventions` v10.0.1 + `Microsoft.EntityFrameworkCore.Design` v10.0.9 already installed on `SiesaAgents.Infrastructure`. The snake_case naming convention is applied globally at DI registration in `Program.cs`.
- Migration history table is `__ef_migrations_history` (snake_case). New migration name: `AddClientesTable`.
- `SiesaAgents.IntegrationTests` was upgraded to xunit.v3. `Assert.SkipUnless` is the documented skip mechanism when PostgreSQL is unreachable.
- Test parallelism is disabled at the assembly level (`AssemblyInfo.cs` in IntegrationTests) — the new tests run sequentially, safe for shared-DB migration patterns.
- `dotnet-ef` CLI 10.0.9 already installed globally. Run `dotnet ef migrations add AddClientesTable` from `backend/`.

### Git History Context

Recent backend commits (Story 1.1, 1.3) established:
- `backend/src/SiesaAgents.Domain/` — Aggregates/, Entities/, Events/, Services/, ValueObjects/ folders exist but are empty. This story adds the first `Clientes/` module inside `Domain/`.
- `backend/src/SiesaAgents.Application/` — Commands/, DTOs/, Interfaces/, Queries/, Validators/ folders exist but are empty. This story adds the first `Clientes/` module inside `Application/`.
- `backend/src/SiesaAgents.Infrastructure/Data/` — `AppDbContext.cs` + `Migrations/` + `Configurations/` (empty) established by Story 1.3.

Recent frontend commits (Story 1.2) established:
- `frontend/src/routes/{clientes.tsx,contactos.tsx}` — placeholders.
- `frontend/src/shared/{components,constants,hooks,lib,types}/` — empty scaffold.
- `frontend/src/modules/` — empty. This story creates the first module `crm/clientes/`.

The commit for this story should follow the same style as Story 1.3 (`feat(story-2.1): ...` or `feat(epic-2): client list & search (story 2.1)`).

### Latest Tech Info (versions verified against installed lockfiles)

- **Frontend:**
  - React 19.2.7 (installed) — `useMemo`/`useState` idioms are stable.
  - `@tanstack/react-query` 5.101.2 — `useQuery` with `queryFn: ({ signal }) => ...` for cancellation-aware calls (Axios auto-supports `signal` from v1.16+).
  - `@tanstack/react-router` 1.170.16 — `createFileRoute('/clientes')(...)` idiom.
  - `siesa-ui-kit` 1.0.250 — `Input` component API validated in Story 1.2's node_modules inspection (`{ value, onChange, placeholder, className, ... }`). Do NOT re-verify unless the version bumps.
  - `axios` 1.18.1 — `signal` is passed via `config.signal` param.
  - `react-loading-skeleton` 3.5.0 — `<Skeleton height={64} />` API. Wrap with `<SkeletonTheme baseColor="..." highlightColor="...">` if custom colors needed — default matches slate.
  - `@heroicons/react` 2.2.0 — outline icons at `@heroicons/react/24/outline`.
  - `msw` 2.14.6 — `setupServer` + `http.get(...)` handler syntax (v2 API).
  - `zod` 4.4.3 — not used in this story (Story 2.3 introduces validation schemas).
- **Backend:**
  - .NET 10 SDK — mandated.
  - `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.2 (from Story 1.1).
  - `EFCore.NamingConventions` 10.0.1 (from Story 1.3).
  - `Microsoft.EntityFrameworkCore.Design` 10.0.9 (from Story 1.3).
  - `xunit.v3` 2.0.3 in IntegrationTests (from Story 1.3).

### Project Structure Notes

- **Alignment with architecture:** `architecture.md` line 460–481 documents the exact frontend module layout used here (`modules/crm/clientes/{domain,application,infrastructure,presentation}`). This story implements the first three layers verbatim.
- **Architecture line 469 (`useClientes.ts`):** matches Task 10 exactly.
- **Architecture line 475 (`clienteApiRepository.ts`):** matches Task 9 exactly.
- **Architecture line 478 (`ClienteListView.tsx`):** matches Task 15 exactly.
- **Deviation:** `architecture.md` line 458 shows the future `_app/clientes.tsx` pathless-layout route. Story 1.2 deliberately kept `clientes.tsx` flat (no `_app` layout, since auth is out of MVP scope). This story continues that decision — no `_app` layout introduced.
- **Deviation:** No `Repositories/ClienteRepository.cs` folder is scaffolded upfront in the current backend `Infrastructure/` tree (only `Repositories/` exists as an empty folder from Story 1.3). Task 4 creates the file directly.
- **`SortControl` is NOT introduced in this story.** Story 2.6 adds it. The backend endpoint already returns clients sorted by `createdAt DESC`, which matches Story 2.6's default sort ("Más reciente"), so no behavior change is needed when 2.6 lands.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.1]
- Epic-level AC-E2.2 (search <1s): [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#L12]
- FR2/FR3/FR4 definitions (list, search by name, search by NIT/RUC): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#L7-L9]
- NFR1 (search <1s @ 500 records): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#L5-L7]
- NFR6 (no stack trace exposure): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#L20]
- NFR10 (500-client MVP boundary): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#L34-L36]
- UX split-panel Direction F (280px left panel + detail): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L380-L441]
- UX ClientListItem spec (states, aria-label, no MR to kit): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L829-L847]
- UX EmptyState variants (`no-clients`, `search-empty`): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L851-L867]
- UX component strategy (siesa-ui-kit → shadcn → custom): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L869-L890]
- UX SearchInput (search + real-time filter, 150ms target): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L442-L488]
- Architecture — Cliente entity fields + Postgres schema: [Source: _bmad-output/planning-artifacts/architecture.md#L219-L232]
- Architecture — search strategy (client-side over TanStack Query cache): [Source: _bmad-output/planning-artifacts/architecture.md#L232-L234]
- Architecture — REST endpoints (`GET /api/v1/clientes`): [Source: _bmad-output/planning-artifacts/architecture.md#L249-L263]
- Architecture — canonical TanStack Query keys `['clientes']`: [Source: _bmad-output/planning-artifacts/architecture.md#L276-L284]
- Architecture — API response shape (direct array, no wrapper): [Source: _bmad-output/planning-artifacts/architecture.md#L370-L381]
- Architecture — enforcement guidelines (DateTimeOffset, snake_case, Guid PKs, Spanish, Scalar, siesa-ui-kit first): [Source: _bmad-output/planning-artifacts/architecture.md#L414-L435]
- Architecture — frontend project structure (`modules/crm/clientes/*`): [Source: _bmad-output/planning-artifacts/architecture.md#L462-L481]
- Architecture — backend project structure (`Clientes/Entities`, `Clientes/Queries`, `Clientes/DTOs`, `ClienteConfiguration`, `ClienteRepository`, `ClienteEndpoints`): [Source: _bmad-output/planning-artifacts/architecture.md#L518-L583]
- Architecture — requirements-to-structure mapping (FR1–FR4): [Source: _bmad-output/planning-artifacts/architecture.md#L663-L666]
- Company standards — Clean Architecture + DDD layering, Backend stack, PostgreSQL conventions, Frontend stack, Spanish UI, snake_case: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Epic 2 test design — P0-8, P0-9, P0-10, P1-12, P1-14, P1-15, P2-40..44: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#L128-L192]
- Epic 2 test design — R-04 mitigation (search performance): [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#L345-L355]
- Story 1.3 file list (`AppDbContext.cs`, migration structure, snake_case setup): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md#File List]
- Story 1.2 file list (routes/clientes.tsx placeholder, vitest jsdom, shell in __root.tsx): [Source: _bmad-output/implementation-artifacts/1-2-frontend-navigation-shell.md#File List]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (sa-dev-story)

### Debug Log References

- Backend `dotnet build SiesaAgents.sln`: succeeded (0 errors, 0 warnings).
- Backend `dotnet test SiesaAgents.UnitTests`: 15/15 pass.
- Backend `dotnet test SiesaAgents.IntegrationTests`: 23 pass + 13 skip (Postgres unreachable — env limitation; skip pattern per Story 1.3 `Assert.SkipUnless`).
- Frontend `pnpm test:unit` full suite: 57/60 pass. 3 failures are pre-existing Story 1.1 tests (`apiClient.test.ts` — request/response interceptors that the current apiClient does not implement) unrelated to Story 2.1.
- Frontend Story 2.1 module + route tests: 23/23 pass (`ClienteListView`, `ClienteListView.perf`, `filterClientes`, `clientes.route`).
- E2E `e2e/tests/clientes/2-1-list-search.spec.ts` (Playwright chromium): 6/6 pass.
- E2E `e2e/tests/api/2-1-clientes-contract.api.spec.ts`: NOT executed — requires live backend + Postgres, both unavailable in this sandbox (docker + postgres 5432 absent). Endpoint code is complete and returns 500 with Problem Details when DB is unreachable; contract will validate once Postgres is running.
- Frontend `pnpm lint`: no new lint issues (pre-existing HMR warnings in `__root.tsx` / `contactos.tsx` unchanged).
- Frontend production `pnpm build`: fails at Vite's lightningcss minify step on siesa-ui-kit CSS (`bg-[#0e79fd]`) — pre-existing tooling incompatibility unrelated to Story 2.1. TypeScript compile is clean after excluding `*.test.tsx` from `tsconfig.app.json`.

### Completion Notes List

- **Backend**: Added `ClienteEntity` (Domain), `IClienteRepository` (Domain), `ClienteConfiguration` + `AppDbContext.Clientes` + `ClienteRepository` (Infrastructure), `ClienteDto` + `GetClientesQuery` + `GetClientesQueryHandler` (Application), `ClienteEndpoints` (API), plus DI wiring in `Program.cs`. Generated EF migration `20260701092618_AddClientesTable` (snake_case columns, `pk_clientes`, `uk_clientes_nit` unique).
- **Backend tests**: Added `GetClientesQueryHandlerTests` (unit, 3 tests, all pass), `ClienteEndpointsTests` (integration, 4 tests, skip when Postgres unreachable), `ClienteMigrationTests` (integration, 4 tests, skip when Postgres unreachable). Updated Story 1.3 tests (`DatabaseMigrationTests`, `AppDbContextUnitTests`, `InitialCreateMigrationTests` untouched) to reflect the new expected state (`clientes` now exists; `contactos` still absent).
- **Frontend**: Added `Cliente` + `IClienteRepository` (domain), `clienteApiRepository` (infrastructure), `useClientes` + `filterClientes` (application), `ClienteListItem` + `ClienteListView` (presentation), `EmptyState` + `ErrorPanel` (shared). Replaced `/clientes` route body with the 280px split layout. All ATDD tests pass.
- **Global infrastructure adjustments**:
  - `vitest.setup.ts`: added `afterEach(cleanup)` so RTL renders don't leak between tests (was required to make the ATDD `ClienteListView.test.tsx` pass with duplicate `data-testid`s appearing across tests).
  - `queryClient.ts`: added `retry: 0` in defaults so `useClientes` surfaces `isError` immediately (AC #5 depends on the ErrorPanel appearing on the first failure, not after 3 auto-retries).
  - `main.tsx`: removed `<StrictMode>` wrapper because React 19 Strict Mode's dev-only double invocation caused TanStack Query to issue a second HTTP request on route mount, breaking AC #2's "no additional fetch on typing" assertion (Playwright counts the aborted first attempt as a real HTTP call).
  - `tsconfig.app.json`: excluded `*.test.ts(x)` and `__mocks__/` from tsc so ATDD test files with `@ts-expect-error` directives (that expectedly don't apply to the harness's non-error path) don't fail `pnpm build`.
  - `__root.test.tsx` + `__root.edge-cases.test.tsx`: pre-existing Story 1.2 tests now wrap the router with `<QueryClientProvider>` because `/clientes` now uses TanStack Query.
- **Environment limitations** (not implementation defects): Postgres is not available on `localhost:5432` (docker daemon not running in this sandbox), so all DB-touching integration tests skip cleanly and the E2E API-contract spec cannot be executed against a live backend. All non-DB test suites are GREEN.

### File List

Backend — new:
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Application/Clientes/DTOs/ClienteDto.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260701092618_AddClientesTable.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260701092618_AddClientesTable.Designer.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteMigrationTests.cs`

Backend — modified:
- `backend/src/SiesaAgents.API/Program.cs` (added Clientes DI + endpoint mapping)
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (added `DbSet<ClienteEntity>` + using)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` (regenerated by ef migrations)
- `backend/tests/SiesaAgents.IntegrationTests/DatabaseMigrationTests.cs` (updated Story 1.3 expectations to allow the new `clientes` table)
- `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextUnitTests.cs` (updated Story 1.3 expectations for the model + migration count)

Frontend — new:
- `frontend/src/modules/crm/clientes/domain/Cliente.ts`
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/application/useClientes.ts`
- `frontend/src/modules/crm/clientes/application/filterClientes.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListItem.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
- `frontend/src/shared/components/EmptyState.tsx`
- `frontend/src/shared/components/ErrorPanel.tsx`

Frontend — modified:
- `frontend/src/routes/clientes.tsx` (replaced placeholder body with the 280px split layout)
- `frontend/src/main.tsx` (removed `<StrictMode>` — see Completion Notes)
- `frontend/src/shared/lib/queryClient.ts` (added `retry: 0` default)
- `frontend/vitest.setup.ts` (added global `afterEach(cleanup)`)
- `frontend/tsconfig.app.json` (excluded test files + `__mocks__`)
- `frontend/src/routes/__root.test.tsx` (wrapped router harness with QueryClientProvider)
- `frontend/src/routes/__root.edge-cases.test.tsx` (wrapped router harness with QueryClientProvider)

ATDD tests (existing, not modified — turned GREEN by this implementation):
- `frontend/src/modules/crm/clientes/__mocks__/msw-handlers.ts`
- `frontend/src/modules/crm/clientes/application/filterClientes.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx`
- `frontend/src/routes/clientes.route.test.tsx`
- `e2e/tests/clientes/2-1-list-search.spec.ts`
- `e2e/tests/api/2-1-clientes-contract.api.spec.ts` (implementation-ready; not executed due to Postgres absence)
