# Story 2.2: Client Detail View

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
So that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item in the left panel, **Then** the right panel renders the complete client details: Nombre, NIT/RUC, Teléfono, and Ciudad, **And** the selected client item is visually highlighted (Siesa Blue `#0e79fd`) in the list.

2. **Given** the user clicks on a client item, **When** the selection occurs, **Then** the URL updates to `/clientes/:clienteId` with the actual client UUID (FR30 deep linking), without a full page reload.

3. **Given** the user accesses `/clientes/:clienteId` directly (deep link), **When** the page loads, **Then** the client detail view fetches the client by ID from `GET /api/v1/clientes/{id}` and renders the correct data, **And** the corresponding client item in the left panel list is highlighted as active.

4. **Given** a `clienteId` in the URL does not exist (backend returns 404), **When** the page loads, **Then** a not-found message is displayed gracefully in the right panel in Spanish (e.g., "Cliente no encontrado"), **And** no unhandled error is thrown to the console.

5. **Given** the backend is unavailable when fetching a specific client by ID (network error or 5xx), **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed in the right panel; clicking "Reintentar" triggers a new fetch via TanStack Query `refetch`.

6. **Given** the client detail view is loading (fetching the client by ID), **When** the request is in-flight, **Then** a skeleton screen (via `react-loading-skeleton`) is displayed in the right panel — NOT a spinner.

7. **Given** the user is on `/clientes` with no client selected, **When** no `clienteId` is in the URL, **Then** the right panel shows the placeholder state "Selecciona un cliente para ver el detalle" (in Spanish), and no detail fetch is made.

## Tasks / Subtasks

- [x] Task 1 — Backend: Implement `GET /api/v1/clientes/{id}` query and endpoint (AC: #3, #4, #5)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`: `record GetClienteByIdQuery(Guid Id)`.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`: calls `IClienteRepository.GetByIdAsync(id)`, returns `ClienteDto?`. If `null`, endpoint returns 404.
  - [x] Update `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: `GetByIdAsync` already existed from Story 2.1 — verified.
  - [x] Update `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: `GetByIdAsync` already implemented from Story 2.1 — verified.
  - [x] Add `GET /api/v1/clientes/{id}` mapping in `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`: returns `200 OK` with `ClienteDto` when found, `404 Problem Details` (RFC 7807) when not found.
  - [x] Register `GetClienteByIdQueryHandler` in `Program.cs`.
  - [x] `ExceptionHandlingMiddleware` already wired from Story 1.3 — 404 handled at endpoint level with `Results.Problem()`.

- [x] Task 2 — Backend: Write unit and integration tests for `GetClienteById` (AC: #3, #4, #5)
  - [x] Create `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`:
    - Test: returns `ClienteDto` when client exists.
    - Test: returns null when client does not exist.
    - Test: returns null when ID doesn't match.
  - [x] Extend `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`:
    - Test `GET /api/v1/clientes/{id}` returns `200 OK` with correct client data when client exists.
    - Test `GET /api/v1/clientes/{id}` returns `404` with Problem Details when client does not exist.
    - Test response is `application/json` with camelCase fields.

- [x] Task 3 — Frontend: Implement application layer hook `useCliente` (AC: #3, #5, #6)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.ts`.
  - [x] Update `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: added `getById` method.
  - [x] Update `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: added `getById(id: string): Promise<Cliente>`.

- [x] Task 4 — Frontend: Create `ClienteDetailPanel` presentation component (AC: #1, #4, #5, #6, #7)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`:
    - Placeholder when `clienteId` undefined.
    - Skeleton screen (4 rows) via `react-loading-skeleton` on load.
    - ErrorPanel with "Reintentar" on 5xx.
    - "Cliente no encontrado" with Heroicons icon on 404 (distinct from ErrorPanel).
    - Success: `<dl>` with Spanish labels (Nombre, NIT/RUC, Teléfono, Ciudad).
    - WCAG 2.1 AA: `aria-label` on container, `aria-live="polite"` on not-found, semantic `<dl>/<dt>/<dd>`.

- [x] Task 5 — Frontend: Wire TanStack Router routes for client detail deep linking (AC: #2, #3, #7)
  - [x] Created `frontend/src/routes/_app/clientes.$clienteId.tsx` — dynamic child route.
  - [x] Updated `frontend/src/routes/_app/clientes.tsx` — uses `useNavigate` + `useChildMatches` for selection, delegates to Outlet for child.
  - [x] Updated `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` — accepts `activeClienteId` and `onClienteSelect` props.
  - [x] Updated `frontend/src/routeTree.gen.ts` — added `$clienteId` child route under `clientes`.

- [x] Task 6 — Frontend: Write unit and component tests (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Create `frontend/src/modules/crm/clientes/application/useCliente.test.ts`: 8 tests covering loading/success/error/404/undefined-id states.
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`: 15 tests covering all ACs (placeholder, skeleton, fields, ErrorPanel+retry, 404).
  - [x] All 106 frontend tests pass (including existing navigation, list panel, and shared component tests).

## Dev Notes

### Architecture Alignment

This story builds the **read path for single-client detail** (FR3) and adds **deep linking** (FR30). It introduces:
- New backend query: `GET /api/v1/clientes/{id}` (handler + endpoint)
- New frontend hook: `useCliente(id)` — TanStack Query key `['clientes', id]`
- New frontend component: `ClienteDetailPanel` (presentation layer)
- TanStack Router dynamic route: `_app/clientes.$clienteId.tsx`

Clean Architecture layers for frontend (`src/modules/crm/clientes/`):
- **Domain**: `Cliente.ts` (entity already exists from Story 2.1), `IClienteRepository.ts` (add `getById`)
- **Application**: `useCliente.ts` (new hook, queryKey: `['clientes', id]`)
- **Infrastructure**: `clienteApiRepository.ts` (add `getById` method)
- **Presentation**: `ClienteDetailPanel.tsx` (new component)

Backend layers:
- **Domain**: `IClienteRepository.cs` (verify `GetByIdAsync` exists)
- **Application**: `GetClienteByIdQuery.cs`, `GetClienteByIdQueryHandler.cs`
- **Infrastructure**: `ClienteRepository.cs` (implement `GetByIdAsync`)
- **API**: `ClienteEndpoints.cs` (add `GET /api/v1/clientes/{id}` mapping)

### URL / Routing Strategy (FR30 Deep Linking)

Per architecture decision, TanStack Router file-based routing is used:

```
/clientes              → _app/clientes.tsx         (no client selected — placeholder right panel)
/clientes/:clienteId   → _app/clientes.$clienteId.tsx (client detail in right panel)
```

The `$clienteId` segment is a TanStack Router dynamic parameter. Access via `useParams()`:
```typescript
import { useParams } from '@tanstack/react-router';
const { clienteId } = useParams({ from: '/_app/clientes/$clienteId' });
```

Both routes render `ClienteListPanel` on the left. The `$clienteId` route additionally renders `ClienteDetailPanel` on the right with the active client ID.

Navigation from list item click:
```typescript
// Inside ClienteListPanel or ClientListItem — use TanStack Router Link
import { Link } from '@tanstack/react-router';
<Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>
  <ClientListItem ... />
</Link>
```

### State Management

- **Server state**: TanStack Query `useCliente(id)` with `queryKey: ['clientes', id]` — fetches from `GET /api/v1/clientes/{id}`.
- **Active client state**: derived from URL param `clienteId` — NO Zustand, NO local state for selection. URL is the single source of truth per architecture decision.
- **List data**: already cached by `useClientes()` with `queryKey: ['clientes']` from Story 2.1. When user clicks a client, the detail view may already have partial data in cache (`['clientes']` array), but `useCliente(id)` fetches the authoritative single record.

### UI Implementation Requirements (MANDATORY)

- **siesa-ui-kit first**: check siesa-ui-kit catalog before creating any custom UI components. Note from Story 2.1: `EmptyState` and `ErrorPanel` are NOT in siesa-ui-kit; use the custom components already created (`frontend/src/shared/components/EmptyState.tsx`, `frontend/src/shared/components/ErrorPanel.tsx`).
- **Loading skeleton**: use `react-loading-skeleton` — skeleton screens, NOT spinners (company standard).
- **404 handling**: do NOT reuse `ErrorPanel` for 404 — render a distinct "Cliente no encontrado" message.
- **Brand colors**: active list item highlight → `#0e79fd` (Siesa Blue). Detail panel uses Tailwind `slate-*` for labels.
- **Typography**: Inter font classes — `font-light` (300), `font-normal` (400), `font-bold` (700).
- All user-facing text MUST be in Spanish: labels ("Nombre", "NIT/RUC", "Teléfono", "Ciudad"), messages, ARIA labels.
- Code (variables, functions, types) in English.
- WCAG 2.1 AA compliance: keyboard navigable links/items, `aria-label` on panels, focus visible rings.

### MasterCrud Note

This story renders a **custom split-panel detail view**, NOT a MasterCrud grid. MasterCrud applies to standard table-based CRUD screens. `ClienteDetailPanel` is a read-only detail card — no MasterCrud usage.

### 404 vs Error Differentiation

Distinguish between a true not-found condition and a generic fetch error:

```typescript
// In ClienteDetailPanel.tsx
const { data, isLoading, isError, error, refetch } = useCliente(clienteId);

const is404 = isError && (error as AxiosError)?.response?.status === 404;

if (isLoading) return <SkeletonDetail />;
if (is404) return <p aria-live="polite">Cliente no encontrado</p>;
if (isError) return <ErrorPanel onRetry={refetch} />;
```

### Backend 404 Handling

Two valid approaches (choose one consistently):
1. **Endpoint-level**: `GetClienteByIdQueryHandler` returns `null` → endpoint returns `Results.NotFound()` (Problem Details auto-formatted by ASP.NET Core 10 with `AddProblemDetails()`).
2. **Exception-based**: Handler throws `NotFoundException` → `ExceptionHandlingMiddleware` maps to 404 Problem Details.

Preferred: endpoint-level (`Results.NotFound()`) for simplicity. Response body:
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente con id {id} no encontrado."
}
```

### Backend Enforcement Rules (Mandatory)

- `ClienteEntity.Id`: `Guid` (UUID) — `GetByIdAsync` parameter is `Guid`, NOT `string`.
- `CreatedAt` / `UpdatedAt`: `DateTimeOffset` — already established in Story 2.1's `ClienteDto`.
- `GET /api/v1/clientes/{id}` returns direct `ClienteDto` object (no wrapper). 404 returns Problem Details.
- API documentation: Scalar at `/scalar` (already wired — do NOT add Swagger).
- `ExceptionHandlingMiddleware` is already wired from Story 1.3 — do NOT re-register.

### Project Structure Notes

Files to create or modify in this story:

**Backend — new:**
```
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs
backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs
backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs
```

**Backend — modify:**
```
backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs      ← verify/add GetByIdAsync
backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs        ← implement GetByIdAsync
backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs                       ← add GET /api/v1/clientes/{id}
backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs             ← extend with new endpoint tests
```

**Frontend — new:**
```
frontend/src/modules/crm/clientes/application/useCliente.ts
frontend/src/modules/crm/clientes/application/useCliente.test.ts
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx
frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx
frontend/src/routes/_app/clientes.$clienteId.tsx
```

**Frontend — modify:**
```
frontend/src/modules/crm/clientes/domain/IClienteRepository.ts           ← add getById
frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts  ← add getById
frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx        ← add activeClienteId prop, Link navigation
frontend/src/routes/_app/clientes.tsx                                       ← update to handle client click → navigate
```

### API Contract

```
GET /api/v1/clientes/{id}

Response 200 OK — Content-Type: application/json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Empresa Ejemplo S.A.",
  "nit": "900123456-7",
  "telefono": "6011234567",
  "ciudad": "Bogotá",
  "createdAt": "2026-03-12T10:30:00Z",
  "updatedAt": "2026-03-12T10:30:00Z"
}

Response 404 Not Found — Problem Details RFC 7807
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Cliente con id 550e8400-e29b-41d4-a716-446655440000 no encontrado."
}

Response 500 — Problem Details RFC 7807 (via ExceptionHandlingMiddleware)
```

### Previous Story Learnings (from Story 2.1)

1. `siesa-ui-kit` does NOT export `EmptyState` or `ErrorPanel` — use the custom components at `frontend/src/shared/components/`.
2. `@/` path alias is configured in `vite.config.ts` (`resolve.alias`) and `tsconfig.json` (`baseUrl` + `paths`) — use it for all imports.
3. `ExceptionHandlingMiddleware` is already wired in `Program.cs` from Story 1.3 — do NOT re-register.
4. `AppDbContext.Clientes` DbSet already exists — no new migration needed for this story (detail only reads data).
5. Tests for navigation routes (`navigation.test.tsx`) need MSW stubs for `GET /api/v1/clientes` — when adding new routes, add corresponding MSW stubs in test setup.
6. `IClienteRepository` returns `IEnumerable<ClienteEntity>` (not `ClienteDto`) from `GetAllAsync` — `GetByIdAsync` should return `ClienteEntity?` consistently (projection to DTO happens in the handler).
7. `react-loading-skeleton` is already installed — use it directly for skeleton screens.

### Git History Context

Recent commits confirm:
- Story 2.1 is complete (`review` status): `ClienteEntity`, `ClienteDto`, `GetClientesQueryHandler`, `ClienteRepository`, `ClienteEndpoints`, `useClientes`, `ClienteListPanel`, `ClientListItem`, `EmptyState`, `ErrorPanel`, `clientes.tsx` route, TanStack Query integration — all in place.
- Test infrastructure (`MSW`, Vitest, RTL, xUnit) is working.
- `@/` alias and `apiClient.ts` are configured.
- The `_app/clientes.tsx` route already renders `ClienteListPanel`.

### References

- FR3 (Ver detalle cliente) [Source: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.2`]
- FR30 (Deep linking — URLs directas) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- TanStack Router file-based routing: `_app/clientes.$clienteId.tsx` [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- TanStack Query key `['clientes', id]` [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- `GET /api/v1/clientes/{id}` endpoint contract [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- `ClienteDetailView` component in architecture [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure`]
- `IContactServiceAdapter` note: NOT applicable for this story (contacts are in Epic 4, Story 4.1) [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- Problem Details RFC 7807 for 404 [Source: `_bmad-output/planning-artifacts/architecture.md#Backend Critical Rules`]
- siesa-ui-kit P0 mandatory rule + no EmptyState/ErrorPanel in kit [Source: Story 2.1 Completion Notes]
- MasterCrud reference (not applicable for split-panel detail view) [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- Company standards: DateTimeOffset, UUID PKs, snake_case DB, Scalar, Problem Details [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

1. `GetByIdAsync` and `ClienteRepository` implementation were already in place from Story 2.1 — no changes needed to Domain/Infrastructure layers.
2. Backend 404 handled at endpoint level via `Results.Problem()` (RFC 7807) — not via middleware exception mapping.
3. `ClienteListPanel` refactored to accept `activeClienteId` and `onClienteSelect` props; navigation uses `useNavigate` (not `Link`) to preserve testability without router context in unit tests.
4. `clientes.$clienteId.tsx` auto-registered as a child route of `clientes` by TanStack Router generator — `routeTree.gen.ts` was regenerated automatically.
5. `clientes.tsx` uses `useChildMatches` to detect when the `$clienteId` child route is active and delegates rendering to `<Outlet />`.
6. All 106 frontend + 28 backend unit + 13 backend integration tests pass (147 total).
7. TypeScript check: only existing `baseUrl` deprecation warning from config — no new type errors introduced.

### File List

**Backend — new:**
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`

**Backend — modified:**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `GET /api/v1/clientes/{id:guid}` endpoint
- `backend/src/SiesaAgents.API/Program.cs` — registered `GetClienteByIdQueryHandler`
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — added 4 new integration tests

**Frontend — new:**
- `frontend/src/modules/crm/clientes/application/useCliente.ts`
- `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`

**Frontend — modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `getById`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — added `getById`
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` — added `activeClienteId`/`onClienteSelect` props
- `frontend/src/routes/_app/clientes.tsx` — uses `useNavigate` + `useChildMatches` + `<Outlet />`
- `frontend/src/routeTree.gen.ts` — auto-regenerated with `$clienteId` child route
