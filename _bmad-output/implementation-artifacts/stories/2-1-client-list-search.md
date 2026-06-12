# Story 2.1: Client List & Search

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all clients and search them by name or NIT/RUC,
so that I can quickly find the client I'm looking for.

## Acceptance Criteria

1. **Given** there are clients in the system **when** the user navigates to `/clientes` **then** the left panel (280px) displays a scrollable list of all clients with Nombre and NIT/RUC visible per item.

2. **Given** the client list is loaded **when** the user types in the search field **then** the list filters in real time showing only clients whose Nombre or NIT/RUC match the input, and results appear in under 1 second with up to 500 records (NFR1).

3. **Given** there are no clients in the system **when** the user navigates to `/clientes` **then** an `EmptyState` component (variant `no-clients`) is displayed with a message guiding the user to create the first client.

4. **Given** the search input yields no matches **when** the user has typed a search term **then** an `EmptyState` component (variant `search-empty`) is displayed with text "No se encontró ningún cliente" and a "Crear cliente" CTA.

5. **Given** the backend is unavailable when the page loads **when** the fetch fails **then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the list.

6. **Given** the client list is loading for the first time **when** the fetch is in-flight **then** skeleton placeholders (via `react-loading-skeleton`) are shown in the list panel (not a spinner).

7. **Given** the client list is loaded **when** a client item has zero associated contacts **then** the list item displays an amber `⚠` badge indicating "Sin contactos asignados".

8. **Given** the client list is displayed **when** the user clicks on a client item **then** the item becomes visually selected (left border `primary-600`, background `primary-50`) and the right panel loads the selected client detail.

## Tasks / Subtasks

- [ ] **Task 1 — Backend: GET /api/v1/clientes endpoint** (AC: 1, 2, 5)
  - [ ] 1.1 Implement `GetClientesQuery` + `GetClientesQueryHandler` in `SiesaAgents.Application/Clientes/Queries/`
  - [ ] 1.2 Implement `ClienteDto` in `SiesaAgents.Application/Clientes/DTOs/` with fields: `id (Guid)`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt (DateTimeOffset)`, `contactCount (int)`
  - [ ] 1.3 Register `GET /api/v1/clientes` in `ClienteEndpoints.cs` — returns `ClienteDto[]` (direct array, no wrapper)
  - [ ] 1.4 Validate endpoint returns 200 with empty array when no records exist
  - [ ] 1.5 Write unit tests for `GetClientesQueryHandler` in `SiesaAgents.UnitTests/Application/Clientes/`
  - [ ] 1.6 Write integration test for `GET /api/v1/clientes` in `SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

- [ ] **Task 2 — Frontend Domain: Cliente entity and repository interface** (AC: 1, 2)
  - [ ] 2.1 Define `Cliente` TypeScript interface in `frontend/src/modules/crm/clientes/domain/Cliente.ts` — fields: `id: string`, `nombre: string`, `nit: string`, `telefono: string`, `ciudad: string`, `createdAt: string`, `contactCount: number`
  - [ ] 2.2 Define `IClienteRepository` interface in `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — method: `getAll(): Promise<Cliente[]>`

- [ ] **Task 3 — Frontend Infrastructure: API repository** (AC: 1, 5)
  - [ ] 3.1 Implement `clienteApiRepository.ts` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — `getAll()` calls `GET /api/v1/clientes` via `apiClient` Axios singleton
  - [ ] 3.2 Ensure `apiClient.ts` at `frontend/src/shared/lib/apiClient.ts` is configured with `baseURL: import.meta.env.VITE_API_URL`

- [ ] **Task 4 — Frontend Application: useClientes hook** (AC: 1, 2, 5, 6)
  - [ ] 4.1 Implement `useClientes.ts` in `frontend/src/modules/crm/clientes/application/useClientes.ts` — uses `useQuery({ queryKey: ['clientes'], queryFn: ... })` with `staleTime: 30_000`
  - [ ] 4.2 Write unit test `useClientes.test.ts` co-located with the hook, using MSW to mock `GET /api/v1/clientes`

- [ ] **Task 5 — Frontend Presentation: ClienteListView component** (AC: 1, 2, 3, 4, 5, 6, 7, 8)
  - [ ] 5.1 Create `ClienteListView.tsx` in `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
    - [ ] 5.1a Render siesa-ui-kit `Input` with `placeholder="Buscar por nombre o NIT..."` and `aria-label="Buscar clientes"`, wrapped in `role="search"` container
    - [ ] 5.1b Filter clients client-side with `useMemo` on `searchQuery` state (debounce 150ms max); filter by `nombre` OR `nit` (case-insensitive)
    - [ ] 5.1c Render skeleton placeholders (`react-loading-skeleton`) while `isLoading === true`
    - [ ] 5.1d Render `EmptyState` (variant `no-clients`) when data is loaded and `clientes.length === 0` AND `searchQuery` is empty
    - [ ] 5.1e Render `EmptyState` (variant `search-empty`) when `filteredClientes.length === 0` AND `searchQuery.length > 0`
    - [ ] 5.1f Render `ErrorPanel` with `onRetry={refetch}` when `isError === true`
    - [ ] 5.1g Render filtered client list as scrollable panel (280px fixed width on `lg:`)
  - [ ] 5.2 Create `ClientListItem.tsx` in `frontend/src/shared/components/ClientListItem.tsx`
    - [ ] 5.2a Display: `nombre`, `ciudad`, contact count `Badge`, amber `⚠` Badge when `contactCount === 0` with `title="Sin contactos asignados"`
    - [ ] 5.2b States: default, hover (`slate-50`), selected (left border 3px `primary-600`, bg `primary-50`)
    - [ ] 5.2c Accessibility: `role="button"`, `aria-label="Ver cliente: {nombre}"`, keyboard navigable (`Tab` + `Enter`)
  - [ ] 5.3 Create `EmptyState.tsx` in `frontend/src/shared/components/EmptyState.tsx` with variants `no-clients`, `search-empty`, `no-contacts`
  - [ ] 5.4 Create `ErrorPanel.tsx` in `frontend/src/shared/components/ErrorPanel.tsx` accepting `onRetry: () => void` prop

- [ ] **Task 6 — Frontend Route: /clientes** (AC: 1)
  - [ ] 6.1 Create/update `frontend/src/routes/_app/clientes.tsx` — renders the split-panel layout: `ClienteListView` (280px) on left, right panel placeholder (to be populated by Story 2.2)
  - [ ] 6.2 Wrap app in `QueryClientProvider` (already in `src/app/providers/`) — confirm setup from Story 1.x is in place

- [ ] **Task 7 — Tests** (AC: 1–8)
  - [ ] 7.1 Write component tests for `ClienteListView` using Vitest + RTL + MSW covering: loading skeleton, empty state (no clients), empty state (search no results), error panel, client list render, real-time filter
  - [ ] 7.2 Write component test for `ClientListItem` covering: default, selected, `contactCount === 0` amber badge
  - [ ] 7.3 Ensure axe accessibility check passes in component tests (WCAG 2.1 AA)

## Dev Notes

### Architecture Overview

This story implements the **read-only client list view** — the entry panel of the split-panel layout (`/clientes`). It covers frontend + backend for fetching and displaying all clients with real-time search. No mutations occur in this story (Create/Edit/Delete are Stories 2.3–2.5).

**Clean Architecture layers touched:**
- **Domain (frontend):** `Cliente.ts`, `IClienteRepository.ts`
- **Application (frontend):** `useClientes.ts`
- **Infrastructure (frontend):** `clienteApiRepository.ts`
- **Presentation (frontend):** `ClienteListView.tsx`, `ClientListItem.tsx` (shared), `EmptyState.tsx` (shared), `ErrorPanel.tsx` (shared)
- **Domain (backend):** `ClienteEntity.cs` (already exists from Story 1.3)
- **Application (backend):** `GetClientesQuery.cs`, `GetClientesQueryHandler.cs`, `ClienteDto.cs`
- **Infrastructure (backend):** `ClienteRepository.cs` (already exists from Story 1.3 — implements `getAll`)
- **Presentation/API (backend):** `ClienteEndpoints.cs` — adds `GET /api/v1/clientes`

### UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit`
- **Install:** `npm install siesa-ui-kit` (ensure dependency is present in `frontend/package.json`)
- **Usage:** You MUST use `siesa-ui-kit` components for all UI elements. Check the kit first before building custom.
- **Constraint:** Do not create custom components if a `siesa-ui-kit` equivalent exists.

**siesa-ui-kit components used in this story:**

| Component | Usage |
|-----------|-------|
| `Input` | Search field — `placeholder="Buscar por nombre o NIT..."`, `aria-label="Buscar clientes"` |
| `Badge` | Contact count per client item; amber `⚠` for clients with 0 contacts |
| `LayoutBase` | Shell (already set up in Story 1.2 — do not recreate) |
| `NavigationRail` | Already set up in Story 1.2 — verify `/clientes` is the active nav item |

**shadcn components used:**
- None required for this story.

**Custom components (no kit equivalent):**
- `ClientListItem` — domain-specific list item. Built with siesa-ui-kit `Badge` + Tailwind tokens. No hex colors hardcoded.
- `EmptyState` — reusable across stories. Uses Heroicons + siesa-ui-kit `Button` (outline variant) for CTA.
- `ErrorPanel` — reusable. Uses siesa-ui-kit `Button` for the retry action.

### Search Implementation Detail

Search is performed **client-side** using `useMemo`:
```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
const filteredClientes = useMemo(() => {
  if (!searchQuery.trim()) return clientes;
  const q = searchQuery.toLowerCase();
  return clientes.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.nit.toLowerCase().includes(q)
  );
}, [clientes, searchQuery]);
```
This guarantees NFR1 (< 1 second with 500 records) since filtering 500 objects in memory is < 50ms.

**No backend search parameter is needed for this story.** `GET /api/v1/clientes` returns all records.

**Debounce:** Apply 150ms debounce on `setSearchQuery` to prevent excessive re-renders during fast typing. Use `useState` + a `useEffect` with `setTimeout` or a simple debounce utility in `src/shared/lib/`.

### Data Flow

```
User types in search field
  → onChange → debounce(150ms) → setSearchQuery
  → useMemo filters clientes[] in memory
  → ClienteListView re-renders filtered list (< 50ms for 500 records)

Page loads /clientes
  → useClientes() → TanStack Query → GET /api/v1/clientes
  → isLoading → skeleton shown
  → data arrives → list rendered
  → isError → ErrorPanel shown with refetch()
```

### TanStack Query Key

The canonical query key for the client list is `['clientes']`.

```typescript
// frontend/src/modules/crm/clientes/application/useClientes.ts
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteApiRepository.getAll(),
    staleTime: 30_000,
  });
}
```

Future mutations (Stories 2.3–2.5) will call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` to trigger a refetch automatically.

### Backend: contactCount in ClienteDto

The `contactCount` field in `ClienteDto` requires a JOIN or COUNT query. Use **linq2db** for this query (per ORM Selection Guide: complex queries → linq2db):

```csharp
// SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs
// Use linq2db to project: SELECT c.*, COUNT(ct.id) AS contact_count FROM clientes c LEFT JOIN contactos ct ON ct.cliente_id = c.id GROUP BY c.id
```

Alternatively, if EF Core is used, use a projection with `Select` including a subquery count — confirm with the tech lead. The `ClienteDto.ContactCount` must be populated, not defaulted to 0.

### Backend: API Response Contract

```
GET /api/v1/clientes
Response: 200 OK
Body: ClienteDto[] (direct array — no wrapper object)

ClienteDto {
  id: Guid,
  nombre: string,
  nit: string,
  telefono: string,
  ciudad: string,
  createdAt: DateTimeOffset,  // ISO 8601 with TZ — "2026-03-12T10:30:00Z"
  contactCount: int
}
```

Error responses follow Problem Details RFC 7807 — handled by `ExceptionHandlingMiddleware.cs`.

### Backend: EF Core / Database

- `ClienteEntity` already exists from Story 1.3 in `SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `ClienteRepository.cs` already exists in `SiesaAgents.Infrastructure/Repositories/`
- `AppDbContext.cs` already applies `ApplySnakeCaseNaming()` — do NOT add `[Column]` or `[Table]` attributes
- `DateTimeOffset` is mandatory — never `DateTime`
- UUID (Guid) primary key is mandatory

### Project Structure Notes

All files created in this story follow the canonical structure from `architecture.md`:

```
frontend/src/
  routes/_app/clientes.tsx                      ← Route entry point (split panel)
  modules/crm/clientes/
    domain/
      Cliente.ts                                ← Entity interface
      IClienteRepository.ts                     ← Repository contract
    application/
      useClientes.ts                            ← TanStack Query hook
      useClientes.test.ts                       ← Co-located test
    infrastructure/
      clienteApiRepository.ts                   ← Axios implementation
    presentation/
      ClienteListView.tsx                       ← 280px left panel
  shared/
    components/
      ClientListItem.tsx                        ← List item (custom, domain-specific)
      EmptyState.tsx                            ← Reusable empty state
      ErrorPanel.tsx                            ← Reusable error panel
    lib/
      apiClient.ts                              ← Axios singleton (already from Story 1.x)

backend/src/
  SiesaAgents.Application/Clientes/
    Queries/
      GetClientesQuery.cs
      GetClientesQueryHandler.cs
    DTOs/
      ClienteDto.cs
  SiesaAgents.API/Endpoints/
    ClienteEndpoints.cs                         ← Add GET /api/v1/clientes
```

**No deviations from architecture.md structure are permitted.**

### Alignment With Previous Stories

- **Story 1.1 (Project Initialization):** Frontend and backend projects are initialized. `pnpm` is the package manager for the frontend. Respect the existing `pnpm-lock.yaml`.
- **Story 1.2 (Frontend Navigation Shell):** `LayoutBase`, `Navbar`, `NavigationRail` are already set up. The `/clientes` route entry point likely exists but is empty — populate it, do not recreate the shell.
- **Story 1.3 (Backend/Database Foundation):** `ClienteEntity`, `IClienteRepository`, `ClienteRepository`, `AppDbContext`, migrations, and DB are already in place. Do not re-run migrations unless this story requires a schema change (it does not).

### Design / Visual Requirements

**Layout on desktop (≥ 1024px):**
```
[NavigationRail 72px] | [ClienteListView 280px, flex-shrink-0] | [Right panel: flex-1, placeholder]
```

**ClientListItem visual:**
- Default: bg `white`, border `slate-200`
- Hover: bg `slate-50`
- Selected: left border 3px `primary-600` (`#0e79fd`), bg `primary-50`
- Contact count badge: Tailwind `text-xs font-semibold`, border `slate-200`
- Sin contactos badge: bg `amber-100`, text `amber-700`, icon `⚠`

**Search field:**
- White background, `primary-600` focus ring (2px solid)
- Placeholder: `"Buscar por nombre o NIT..."` (in Spanish — mandatory P0 rule)
- Wrapped in `role="search"` container with `aria-label="Buscar clientes"`

**Skeleton loading:**
- `react-loading-skeleton` — render 5–8 skeleton rows matching `ClientListItem` shape
- `aria-busy="true"` on the list container while loading

**Empty state icons (Heroicons):**
- `no-clients`: `UsersIcon` (outline)
- `search-empty`: `MagnifyingGlassIcon` (outline)

**All user-facing text in Spanish** (P0 company standard):
- Search placeholder: `"Buscar por nombre o NIT..."`
- Empty state no-clients title: `"No hay clientes registrados"`
- Empty state no-clients subtitle: `"Crea el primer cliente del sistema"`
- Empty state no-clients CTA: `"Nuevo cliente"`
- Empty state search-empty title: `"No se encontró ningún cliente"`
- Empty state search-empty subtitle: `"Intenta con otro nombre o NIT"`
- Empty state search-empty CTA: `"Crear cliente"`
- Error panel text: `"No se pudo cargar la lista de clientes"`
- Error panel retry button: `"Intentar de nuevo"`
- Sin contactos badge tooltip: `"Sin contactos asignados"`

### Testing Standards

**Frontend (Vitest + RTL + MSW):**
- Test file co-located: `useClientes.test.ts` alongside `useClientes.ts`
- Component tests in `__tests__/` folder adjacent to the component, or co-located
- Cover all AC states: loading skeleton, empty (no data), empty (search), error, populated list, filter behavior
- Accessibility check per component using `@axe-core/react` or `jest-axe`
- No `any` types in test code (TypeScript strict)

**Backend (xUnit):**
- `GetClientesQueryHandlerTests.cs` in `SiesaAgents.UnitTests/Application/Clientes/`
- Arrange / Act / Assert pattern
- Integration test in `ClienteEndpointsTests.cs` using PostgreSQL TestContainers

**Coverage target:** > 80% for new code added in this story.

### Security Notes

- No authentication in MVP (explicit PRD decision — no auth tokens, no headers)
- CORS: `localhost:5173` is allowed for development (configured in `Program.cs` from Story 1.3)
- FluentValidation on GET is not needed (read-only endpoint with no input except future query params)
- No sensitive data exposed — `ClienteDto` does not include internal fields beyond what the UI needs

### References

- Epic requirements: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story-2.1`
- Architecture: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`
- Architecture: `_bmad-output/planning-artifacts/architecture.md#Data-Architecture`
- Architecture: `_bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns`
- Architecture: `_bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping` (FR1, FR2, NFR1)
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md#Search-Filtering-Patterns`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md#Empty-States-Loading-States`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md#Design-Direction-Decision` (Direction F)
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md` (FR1, FR2)
- Non-Functional Requirements: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md` (NFR1, NFR6)
- Company Standards: `.claude/agent-memory/sa-quick-dev/company-standards.md`
- MasterCrud Reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` (NOTE: MasterCrud is NOT used in this story — the UX spec explicitly chose Direction F with a custom `ClientListItem` panel, not a MasterCrud table. MasterCrud would apply if a full-width data table view were chosen.)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
