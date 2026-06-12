# Story 2.2: Client Detail View

Status: draft

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed **when** the user clicks on a client item **then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad **and** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view **when** the user accesses the URL `/clientes/:clienteId` directly **then** the correct client details are loaded and displayed (FR30).

3. **Given** a `clienteId` in the URL does not exist **when** the page loads **then** a not-found message ("Cliente no encontrado") is displayed gracefully in the right panel without crashing the application.

4. **Given** the client detail is loading **when** the `GET /api/v1/clientes/:id` fetch is in-flight **then** skeleton placeholders (via `react-loading-skeleton`) are shown in the right panel.

5. **Given** the backend is unavailable when loading the detail **when** the `GET /api/v1/clientes/:id` fetch fails **then** an `ErrorPanel` with a "Reintentar" button is displayed in the right panel.

6. **Given** no client is selected **when** the user is on `/clientes` without a `clienteId` param **then** the right panel shows a `EmptyState` (variant `no-selection`) with text "Selecciona un cliente para ver sus detalles".

## Tasks / Subtasks

- [ ] **Task 1 — Backend: GET /api/v1/clientes/{id} endpoint** (AC: 2, 3, 4, 5)
  - [ ] 1.1 Implement `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` in `SiesaAgents.Application/Clientes/Queries/` if not already present from previous stories
  - [ ] 1.2 Confirm `ClienteDto` in `SiesaAgents.Application/Clientes/DTOs/` includes all required fields: `id (Guid)`, `nombre`, `nit`, `telefono`, `ciudad`, `createdAt (DateTimeOffset)`, `contactCount (int)` — extend if needed
  - [ ] 1.3 Register `GET /api/v1/clientes/{id}` in `ClienteEndpoints.cs` — returns `ClienteDto` (direct object, 200) or 404 Problem Details when not found
  - [ ] 1.4 Write unit tests for `GetClienteByIdQueryHandler` in `SiesaAgents.UnitTests/Application/Clientes/` — cover: found, not found
  - [ ] 1.5 Write integration test for `GET /api/v1/clientes/{id}` in `SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — cover: 200, 404

- [ ] **Task 2 — Frontend Domain: extend IClienteRepository** (AC: 2)
  - [ ] 2.1 Add `getById(id: string): Promise<Cliente>` method to `IClienteRepository` interface in `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`

- [ ] **Task 3 — Frontend Infrastructure: API repository** (AC: 2, 3, 5)
  - [ ] 3.1 Implement `getById(id: string)` in `clienteApiRepository.ts` — calls `GET /api/v1/clientes/:id` via `apiClient` Axios singleton; throws on 404 so TanStack Query marks it as error

- [ ] **Task 4 — Frontend Application: useCliente hook** (AC: 2, 3, 4, 5)
  - [ ] 4.1 Implement `useCliente.ts` in `frontend/src/modules/crm/clientes/application/useCliente.ts` — uses `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), staleTime: 30_000, enabled: !!id })`
  - [ ] 4.2 Write unit test `useCliente.test.ts` co-located with the hook, using MSW to mock `GET /api/v1/clientes/:id` for success, 404, and network error cases

- [ ] **Task 5 — Frontend Presentation: ClienteDetailPanel component** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 5.1 Create `ClienteDetailPanel.tsx` in `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
    - [ ] 5.1a Render client fields using `siesa-ui-kit` `DescriptionList`: Nombre, NIT/RUC, Teléfono, Ciudad
    - [ ] 5.1b Render skeleton placeholders (`react-loading-skeleton`) while `isLoading === true` — match field layout shape with `aria-busy="true"` on the container
    - [ ] 5.1c Render `ErrorPanel` with `onRetry={refetch}` when `isError === true`
    - [ ] 5.1d Render not-found message ("Cliente no encontrado") when query succeeds but data is undefined/null (404 case resolved as no-data)
    - [ ] 5.1e Render the `EmptyState` (variant `no-selection`) when `clienteId` is absent (no client selected yet)
  - [ ] 5.2 Add `EmptyState` variant `no-selection` to `frontend/src/shared/components/EmptyState.tsx`
    - [ ] 5.2a Title: `"Selecciona un cliente para ver sus detalles"`, icon: `UserIcon` (Heroicons outline), no CTA

- [ ] **Task 6 — Frontend Route: /clientes and /clientes/:clienteId** (AC: 1, 2, 6)
  - [ ] 6.1 Create route file `frontend/src/routes/_app/clientes.$clienteId.tsx` — renders the split-panel layout with `ClienteListView` (280px) on the left and `ClienteDetailPanel` on the right, receiving `clienteId` from route params
  - [ ] 6.2 Update `frontend/src/routes/_app/clientes.tsx` — right panel renders `ClienteDetailPanel` without a `clienteId` (triggers `no-selection` empty state)
  - [ ] 6.3 Update `ClientListItem` click handler in `ClienteListView` (or parent route) to navigate to `/clientes/:clienteId` via TanStack Router `useNavigate`
  - [ ] 6.4 Ensure selected item visual state (left border `primary-600`, bg `primary-50`) matches the `clienteId` in the current URL param

- [ ] **Task 7 — Tests** (AC: 1–6)
  - [ ] 7.1 Write component tests for `ClienteDetailPanel` using Vitest + RTL + MSW covering: loading skeleton, not-found, error panel, client detail render, no-selection empty state
  - [ ] 7.2 Write route-level integration test: navigate to `/clientes/some-uuid` and verify the correct client detail is rendered with MSW
  - [ ] 7.3 Ensure axe accessibility check passes in component tests (WCAG 2.1 AA)

## Dev Notes

### Architecture Overview

This story implements the **client detail view** — the right panel of the split-panel layout at `/clientes/:clienteId`. It covers frontend + backend for fetching and displaying a single client by ID with deep-linking support (FR30). No mutations occur in this story (Edit/Delete are Stories 2.4–2.5; ContactManager is Story 2.x+).

**Clean Architecture layers touched:**

- **Domain (frontend):** `IClienteRepository.ts` — add `getById` method
- **Application (frontend):** `useCliente.ts` — new TanStack Query hook
- **Infrastructure (frontend):** `clienteApiRepository.ts` — implement `getById`
- **Presentation (frontend):** `ClienteDetailPanel.tsx` (new), `EmptyState.tsx` (add `no-selection` variant)
- **Domain (backend):** `ClienteEntity.cs` (already exists — no changes)
- **Application (backend):** `GetClienteByIdQuery.cs`, `GetClienteByIdQueryHandler.cs` (create if not present from Story 1.3)
- **Infrastructure (backend):** `ClienteRepository.cs` (already has `GetByIdAsync` from Story 1.3 — verify)
- **Presentation/API (backend):** `ClienteEndpoints.cs` — adds `GET /api/v1/clientes/{id}`

### UI Implementation Requirements (MANDATORY)

- **Library:** `siesa-ui-kit`
- **Install:** `npm install siesa-ui-kit` (dependency already present from Story 2.1)
- **Usage:** You MUST use `siesa-ui-kit` components for all UI elements. Check the kit first before building custom.
- **Constraint:** Do not create custom components if a `siesa-ui-kit` equivalent exists.

**siesa-ui-kit components used in this story:**

| Component | Usage |
|-----------|-------|
| `DescriptionList` | Display client fields (Nombre, NIT/RUC, Teléfono, Ciudad) in detail view |
| `Badge` | Contact count shown in detail header (reuse from Story 2.1) |
| `LayoutBase` | Shell (already set up in Story 1.2 — do not recreate) |
| `NavigationRail` | Already set up in Story 1.2 — verify `/clientes` remains the active nav item |

**shadcn components used:**
- None required for this story.

**Custom components (no kit equivalent):**
- `ClienteDetailPanel` — domain-specific detail panel. Built with siesa-ui-kit `DescriptionList` + Tailwind tokens.
- `EmptyState` (extended with `no-selection` variant) — already exists from Story 2.1.

### Data Flow

```
User clicks ClientListItem in ClienteListView
  → TanStack Router navigate('/clientes/:clienteId')
  → URL updates → clientes.$clienteId.tsx route activates
  → ClienteDetailPanel receives clienteId from route params
  → useCliente(clienteId) → TanStack Query → GET /api/v1/clientes/:id
  → isLoading → skeleton shown
  → data arrives → DescriptionList renders fields
  → isError → ErrorPanel shown with refetch()

User navigates to /clientes/:clienteId directly (deep link)
  → Same flow — useCliente fetches on mount
  → 404 response → error state shown with "Cliente no encontrado"

User is on /clientes (no clienteId)
  → ClienteDetailPanel receives no clienteId
  → EmptyState variant 'no-selection' displayed
```

### TanStack Query Key

The canonical query key for a single client is `['clientes', id]`.

```typescript
// frontend/src/modules/crm/clientes/application/useCliente.ts
export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    staleTime: 30_000,
    enabled: !!id,
  });
}
```

The `enabled: !!id` guard prevents a fetch when no client is selected (the `/clientes` route without a `clienteId` param).

### Selected Client Visual Sync

The `ClientListItem` in `ClienteListView` must visually reflect the currently selected client based on the URL param. The `clientes.$clienteId.tsx` route and the `clientes.tsx` route both render `ClienteListView`; the selected state comes from matching `clienteId` param with each item's `id`.

```typescript
// In ClienteListView or the route component, obtain current clienteId:
const { clienteId } = useParams({ from: '/_app/clientes/$clienteId' }) // or undefined on /clientes
// Pass selectedId to ClienteListView → ClientListItem:
// <ClientListItem selected={item.id === clienteId} ... />
```

### Backend: API Response Contract

```
GET /api/v1/clientes/{id}
Response: 200 OK
Body: ClienteDto (direct object)

ClienteDto {
  id: Guid,
  nombre: string,
  nit: string,
  telefono: string,
  ciudad: string,
  createdAt: DateTimeOffset,  // ISO 8601 with TZ — "2026-03-12T10:30:00Z"
  contactCount: int
}

404 Not Found
Body: Problem Details RFC 7807
{
  "status": 404,
  "title": "Cliente no encontrado",
  "detail": "No existe un cliente con el ID proporcionado."
}
```

Error responses follow Problem Details RFC 7807 — handled by `ExceptionHandlingMiddleware.cs`.

### Backend: EF Core / Database

- `ClienteEntity` already exists from Story 1.3 in `SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `ClienteRepository.cs` already exists in `SiesaAgents.Infrastructure/Repositories/` — verify `GetByIdAsync(Guid id)` is implemented; if not, implement it
- `AppDbContext.cs` already applies `ApplySnakeCaseNaming()` — do NOT add `[Column]` or `[Table]` attributes
- `DateTimeOffset` is mandatory — never `DateTime`
- UUID (Guid) primary key is mandatory

### Project Structure Notes

All files created in this story follow the canonical structure from `architecture.md`:

```
frontend/src/
  routes/_app/
    clientes.tsx                          ← Route for /clientes (no clienteId) — right panel: no-selection EmptyState
    clientes.$clienteId.tsx               ← Route for /clientes/:clienteId — right panel: ClienteDetailPanel
  modules/crm/clientes/
    domain/
      IClienteRepository.ts               ← Add getById method
    application/
      useCliente.ts                       ← TanStack Query hook — queryKey: ['clientes', id]
      useCliente.test.ts                  ← Co-located test
    infrastructure/
      clienteApiRepository.ts             ← Add getById() Axios call
    presentation/
      ClienteDetailPanel.tsx              ← Right panel — renders client fields
  shared/
    components/
      EmptyState.tsx                      ← Add no-selection variant

backend/src/
  SiesaAgents.Application/Clientes/
    Queries/
      GetClienteByIdQuery.cs              ← Create if not present
      GetClienteByIdQueryHandler.cs       ← Create if not present
    DTOs/
      ClienteDto.cs                       ← Verify all fields present (no changes expected)
  SiesaAgents.API/Endpoints/
    ClienteEndpoints.cs                   ← Add GET /api/v1/clientes/{id}
```

**No deviations from architecture.md structure are permitted.**

### Alignment With Previous Stories

- **Story 1.1 (Project Initialization):** Frontend and backend projects are initialized. `pnpm` is the package manager for the frontend. Respect the existing `pnpm-lock.yaml`.
- **Story 1.2 (Frontend Navigation Shell):** `LayoutBase`, `Navbar`, `NavigationRail` are already set up. The `/clientes` route exists — do not recreate the shell.
- **Story 1.3 (Backend/Database Foundation):** `ClienteEntity`, `IClienteRepository`, `ClienteRepository`, `AppDbContext`, and migrations are in place. `GetClienteByIdQueryHandler` may already exist — verify before creating.
- **Story 2.1 (Client List & Search):** `ClienteListView`, `ClientListItem`, `EmptyState`, `ErrorPanel`, `useClientes`, `clienteApiRepository.getAll()`, `ClienteDto`, and `GET /api/v1/clientes` are all implemented. This story builds on those without modifying their core behavior.

### Design / Visual Requirements

**Layout on desktop (≥ 1024px):**
```
[NavigationRail 72px] | [ClienteListView 280px, flex-shrink-0] | [ClienteDetailPanel: flex-1]
```

**ClienteDetailPanel visual:**
- Panel background: `white`; border-left `slate-200`
- Header: client `nombre` as `text-3xl font-bold` (`h2` semantics)
- Fields displayed via `siesa-ui-kit` `DescriptionList`:
  - "NIT/RUC": value of `nit`
  - "Teléfono": value of `telefono`
  - "Ciudad": value of `ciudad`
- Contact count badge (reuse `siesa-ui-kit` `Badge`) below the name — same style as `ClientListItem`
- Amber ⚠ badge when `contactCount === 0` — "Sin contactos asignados"
- Padding: `p-6` inside the panel

**Skeleton loading:**
- `react-loading-skeleton` — render skeleton for `h2` (name), and 3 field rows matching `DescriptionList` shape
- `aria-busy="true"` on the panel container while loading

**No-selection empty state:**
- Icon: `UserIcon` (Heroicons outline), size `h-12 w-12`, color `slate-300`
- Title: `"Selecciona un cliente para ver sus detalles"` (`text-sm text-slate-500`, centered)
- No CTA button
- Centered vertically in the right panel

**Error panel:**
- Reuse `ErrorPanel` component from Story 2.1 — same as the list panel error
- Text: `"No se pudo cargar el detalle del cliente"`
- Retry button: `"Intentar de nuevo"`

**Not-found state:**
- Icon: `ExclamationCircleIcon` (Heroicons outline), color `slate-400`
- Title: `"Cliente no encontrado"` (`text-sm text-slate-500`, centered)
- No CTA

**All user-facing text in Spanish** (P0 company standard):
- Detail panel title: use client `nombre` as heading
- Field labels: `"NIT/RUC"`, `"Teléfono"`, `"Ciudad"`
- No-selection empty state title: `"Selecciona un cliente para ver sus detalles"`
- Not-found title: `"Cliente no encontrado"`
- Error panel text: `"No se pudo cargar el detalle del cliente"`
- Error panel retry button: `"Intentar de nuevo"`
- Sin contactos badge tooltip: `"Sin contactos asignados"`

### Testing Standards

**Frontend (Vitest + RTL + MSW):**
- Test file co-located: `useCliente.test.ts` alongside `useCliente.ts`
- Component tests in `__tests__/` folder adjacent to the component
- Cover all AC states: loading skeleton, not-found (404), error panel, populated detail, no-selection empty state
- Verify URL param is reflected in the selected list item visual state
- Accessibility check per component using `@axe-core/react` or `jest-axe`
- No `any` types in test code (TypeScript strict)

**Backend (xUnit):**
- `GetClienteByIdQueryHandlerTests.cs` in `SiesaAgents.UnitTests/Application/Clientes/` — cover: found, not found (throws NotFoundException or returns null)
- Arrange / Act / Assert pattern
- Integration test in `ClienteEndpointsTests.cs` using PostgreSQL TestContainers — cover: 200 with correct body, 404 with Problem Details

**Coverage target:** > 80% for new code added in this story.

### Security Notes

- No authentication in MVP (explicit PRD decision)
- CORS: `localhost:5173` is allowed for development (configured in `Program.cs` from Story 1.3)
- FluentValidation is not needed for this GET endpoint — route param `{id}` is validated as Guid by .NET binding
- No sensitive data exposed — `ClienteDto` fields are all non-sensitive

### References

- Epic requirements: `_bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story-2.2`
- Architecture: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`
- Architecture: `_bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns`
- Architecture: `_bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping` (FR3, FR5, FR30)
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md#Component-Strategy`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md#User-Journey-Flows` (Journey 1: "Búsqueda de contacto durante llamada activa")
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md#Design-Direction-Decision` (Direction F)
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md` (FR3, FR5, FR28, FR30)
- Company Standards: `.claude/agent-memory/sa-quick-dev/company-standards.md`
- Story 2.1: `_bmad-output/implementation-artifacts/stories/2-1-client-list-search.md` (shared components, query keys, apiClient)
