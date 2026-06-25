# Story 3.2: Contact Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a contact by selecting them from the list,
So that I can review all their information at once.

## Acceptance Criteria

1. **Given** the contact list is displayed, **When** the user clicks on a contact item, **Then** the contact detail view shows: Nombre, Cargo, Teléfono, Email (FR13), **And** the URL updates to `/contactos/:contactoId` (FR30).

2. **Given** the user accesses `/contactos/:contactoId` directly via URL (deep link), **When** the page loads, **Then** the correct contact details are fetched from `GET /api/v1/contactos/{id}` and displayed (FR30), **And** the API returns the contact in under 2 seconds (NFR2).

3. **Given** a `contactoId` in the URL does not exist (backend returns 404), **When** the page loads, **Then** a not-found message "Contacto no encontrado" is displayed gracefully in Spanish in the detail area, **And** no unhandled error is thrown to the console.

4. **Given** the backend is unavailable when fetching a specific contact by ID (network error or 5xx), **When** the fetch fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed; clicking "Reintentar" triggers a new fetch via TanStack Query `refetch`.

5. **Given** the contact detail view is loading (fetching the contact by ID), **When** the request is in-flight, **Then** a skeleton screen (via `react-loading-skeleton`) is displayed — NOT a spinner.

6. **Given** the user navigates back from the detail view to `/contactos`, **When** the navigation occurs, **Then** the contact list is still accessible and the back navigation works without a full page reload.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Implement `GET /api/v1/contactos/{id}` query and endpoint (AC: #2, #3, #4)
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQuery.cs`: `record GetContactoByIdQuery(Guid Id)`.
  - [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs`: calls `IContactoRepository.GetByIdAsync(id)`, returns `ContactoDto?`. If `null`, endpoint returns 404.
  - [ ] Verify `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` has `GetByIdAsync(Guid id)` — already defined in Story 3.1; if not, add it.
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` implements `GetByIdAsync` — already scaffolded in Story 3.1; if not, implement it: query `AppDbContext.Contactos.FirstOrDefaultAsync(c => c.Id == id)`, project to `ContactoDto`.
  - [ ] Add `GET /api/v1/contactos/{id:guid}` mapping in `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`: returns `200 OK` with `ContactoDto` when found, `404 Problem Details` (RFC 7807) via `Results.NotFound()` when not found.
  - [ ] Register `GetContactoByIdQueryHandler` in `Program.cs`.

- [ ] Task 2 — Backend: Write unit and integration tests for `GetContactoById` (AC: #2, #3, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Application/Contactos/GetContactoByIdQueryHandlerTests.cs`:
    - Test: returns `ContactoDto` when contact exists.
    - Test: returns null when contact does not exist.
    - Test: returns null when ID does not match any record.
  - [ ] Extend `backend/tests/SiesaAgents.IntegrationTests/ContactoEndpointsTests.cs`:
    - Test `GET /api/v1/contactos/{id}` returns `200 OK` with correct contact data when contact exists.
    - Test `GET /api/v1/contactos/{id}` returns `404` with Problem Details when contact does not exist.
    - Test response is `application/json` with camelCase fields.

- [ ] Task 3 — Frontend: Implement application layer hook `useContacto` (AC: #2, #4, #5)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContacto.ts`: TanStack Query hook using `queryKey: ['contactos', id]`, calls `IContactoRepository.getById(id)`, enabled only when `id` is truthy.
  - [ ] Update `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`: add `getById(id: string): Promise<Contacto>`.
  - [ ] Update `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`: implement `getById` calling `GET /api/v1/contactos/{id}` via Axios.

- [ ] Task 4 — Frontend: Create `ContactoDetailView` presentation component (AC: #1, #3, #4, #5, #6)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`:
    - Uses `useContacto(contactoId)` hook.
    - Skeleton screen (4 rows via `react-loading-skeleton`) while loading.
    - `ErrorPanel` with "Reintentar" on 5xx / network error.
    - "Contacto no encontrado" (with a Heroicons icon) for 404 — distinct from `ErrorPanel`.
    - Success state: `<dl>` with Spanish field labels: Nombre, Cargo, Teléfono, Email.
    - WCAG 2.1 AA: `aria-label` on container, `aria-live="polite"` on not-found state, semantic `<dl>/<dt>/<dd>`.
    - All user-facing text in Spanish.
    - Brand colors: field labels in Tailwind `slate-*` scale; primary accent `#0e79fd` (Siesa Blue) for headings/icons.
    - Back navigation link to `/contactos` in Spanish (e.g., "Volver a contactos").

- [ ] Task 5 — Frontend: Wire TanStack Router route `/contactos/$contactoId` (AC: #1, #2, #6)
  - [ ] Create `frontend/src/routes/_app/contactos.$contactoId.tsx` — dynamic child route rendering `ContactoDetailView`.
  - [ ] Access `contactoId` via `useParams({ from: '/_app/contactos/$contactoId' })`.
  - [ ] Update `frontend/src/routes/_app/contactos.tsx` to handle navigation: list items link to `/contactos/$contactoId` using TanStack Router `Link` or `useNavigate`.
  - [ ] Update `frontend/src/routeTree.gen.ts` (auto-regenerated by TanStack Router plugin — run `pnpm tsr generate` or equivalent).

- [ ] Task 6 — Frontend: Update `ContactoListView` to support navigation to detail (AC: #1)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`: wrap each list item with a TanStack Router `Link` pointing to `/contactos/$contactoId` with the correct `contactoId` param. Ensure the currently active contact item is visually highlighted (Siesa Blue `#0e79fd`). Derive active contact from URL param via `useParams` or `useChildMatches`.

- [ ] Task 7 — Frontend: Write unit and component tests (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContacto.test.ts`: tests for loading / success / error (5xx) / 404 / undefined-id states (min 6 tests).
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx`: tests for all ACs — skeleton displayed on load, fields rendered correctly (Nombre, Cargo, Teléfono, Email), ErrorPanel + retry on 5xx, "Contacto no encontrado" on 404, WCAG structural checks (aria-label, dl/dt/dd, aria-live).

## Dev Notes

### Architecture Alignment

This story builds the **read path for single-contact detail** (FR13) and adds **deep linking** for contacts (FR30). It is the direct analog of Story 2.2 (Client Detail View) in the contacts domain.

New files introduced:
- Backend query: `GET /api/v1/contactos/{id}` (handler + endpoint extension)
- Frontend hook: `useContacto(id)` — TanStack Query key `['contactos', id]`
- Frontend component: `ContactoDetailView` (presentation layer)
- TanStack Router dynamic route: `_app/contactos.$contactoId.tsx`

Clean Architecture layers for frontend (`src/modules/crm/contactos/`):
- **Domain**: `Contacto.ts` (entity already exists from Story 3.1), `IContactoRepository.ts` (add `getById`)
- **Application**: `useContacto.ts` (new hook, queryKey: `['contactos', id]`)
- **Infrastructure**: `contactoApiRepository.ts` (add `getById` method)
- **Presentation**: `ContactoDetailView.tsx` (new component)

Backend layers:
- **Domain**: `IContactoRepository.cs` — verify `GetByIdAsync` exists (defined in Story 3.1 interface contract)
- **Application**: `GetContactoByIdQuery.cs`, `GetContactoByIdQueryHandler.cs`
- **Infrastructure**: `ContactoRepository.cs` — verify/implement `GetByIdAsync`
- **API**: `ContactoEndpoints.cs` — add `GET /api/v1/contactos/{id:guid}` mapping

### URL / Routing Strategy (FR30 Deep Linking)

Per architecture decision, TanStack Router file-based routing:

```
/contactos                → _app/contactos.tsx           (contact list — list view)
/contactos/:contactoId    → _app/contactos.$contactoId.tsx (contact detail view)
```

The `$contactoId` segment is a TanStack Router dynamic parameter. Access via `useParams()`:
```typescript
import { useParams } from '@tanstack/react-router';
const { contactoId } = useParams({ from: '/_app/contactos/$contactoId' });
```

Navigation from list item click:
```typescript
import { Link } from '@tanstack/react-router';
<Link to="/contactos/$contactoId" params={{ contactoId: contacto.id }}>
  {/* list item content */}
</Link>
```

### State Management

- **Server state**: TanStack Query `useContacto(id)` with `queryKey: ['contactos', id]` — fetches from `GET /api/v1/contactos/{id}`.
- **Active contact state**: derived from URL param `contactoId` — NO Zustand, NO local state for selection. URL is the single source of truth per architecture decision.
- **List data**: already cached by `useContactos()` with `queryKey: ['contactos']` from Story 3.1. When user clicks a contact, detail view fetches the authoritative single record from `['contactos', id]`.
- **No Zustand store needed** for this story — URL is source of truth for selection.

### UI Implementation Requirements (MANDATORY)

- **siesa-ui-kit first**: check siesa-ui-kit catalog before creating any custom UI component. Note from Story 3.1: `EmptyState` and `ErrorPanel` are NOT in siesa-ui-kit; use the custom components already created (`frontend/src/shared/components/EmptyState.tsx`, `frontend/src/shared/components/ErrorPanel.tsx`).
- **Loading skeleton**: use `react-loading-skeleton` — skeleton screens, NOT spinners (company standard).
- **404 handling**: do NOT reuse `ErrorPanel` for 404 — render a distinct "Contacto no encontrado" message (consistent with Story 2.2 pattern for "Cliente no encontrado").
- **Brand colors**: active list item highlight → `#0e79fd` (Siesa Blue). Detail panel uses Tailwind `slate-*` for labels.
- **Typography**: Inter font classes — `font-light` (300), `font-normal` (400), `font-bold` (700).
- All user-facing text MUST be in Spanish: labels ("Nombre", "Cargo", "Teléfono", "Email"), messages, ARIA labels, back navigation link.
- Code (variables, functions, types) in English.
- WCAG 2.1 AA compliance: keyboard navigable links/items, `aria-label` on panels, focus visible rings.

### MasterCrud Note

This story renders a **custom read-only detail card view**, NOT a MasterCrud grid. MasterCrud applies to standard table-based CRUD screens with list + form. `ContactoDetailView` is a read-only detail card — no MasterCrud usage.

### 404 vs Error Differentiation

Distinguish between a true not-found condition and a generic fetch error (same pattern as Story 2.2):

```typescript
// In ContactoDetailView.tsx
const { data, isLoading, isError, error, refetch } = useContacto(contactoId);

const is404 = isError && (error as AxiosError)?.response?.status === 404;

if (isLoading) return <SkeletonDetail />;
if (is404) return <p aria-live="polite">Contacto no encontrado</p>;
if (isError) return <ErrorPanel onRetry={refetch} />;
```

### Backend 404 Handling

Use endpoint-level handling (consistent with Story 2.2):
- `GetContactoByIdQueryHandler` returns `null` → endpoint returns `Results.NotFound()` (Problem Details auto-formatted by ASP.NET Core 10 with `AddProblemDetails()`).

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Contacto con id {id} no encontrado."
}
```

### Backend Enforcement Rules (Mandatory)

- `ContactoEntity.Id`: `Guid` (UUID) — `GetByIdAsync` parameter is `Guid`, NOT `string`.
- `CreatedAt` / `UpdatedAt`: `DateTimeOffset` — already established in Story 3.1's `ContactoDto`.
- `ClienteId`: `Guid?` (nullable) — already established in Story 3.1.
- `GET /api/v1/contactos/{id}` returns direct `ContactoDto` object (no wrapper). 404 returns Problem Details.
- API documentation: Scalar at `/scalar` (already wired from Story 1.3 — do NOT add Swagger).
- `ExceptionHandlingMiddleware` is already wired from Story 1.3 — do NOT re-register.

### Project Structure Notes

Files to create or modify in this story:

**Backend — new:**
```
backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQuery.cs
backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs
backend/tests/SiesaAgents.UnitTests/Application/Contactos/GetContactoByIdQueryHandlerTests.cs
```

**Backend — verify/modify:**
```
backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs      ← verify/add GetByIdAsync
backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs        ← verify/implement GetByIdAsync
backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs                       ← add GET /api/v1/contactos/{id:guid}
backend/src/SiesaAgents.API/Program.cs                                           ← register GetContactoByIdQueryHandler
backend/tests/SiesaAgents.IntegrationTests/ContactoEndpointsTests.cs             ← extend with new endpoint tests
```

**Frontend — new:**
```
frontend/src/modules/crm/contactos/application/useContacto.ts
frontend/src/modules/crm/contactos/application/useContacto.test.ts
frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx
frontend/src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx
frontend/src/routes/_app/contactos.$contactoId.tsx
```

**Frontend — modify:**
```
frontend/src/modules/crm/contactos/domain/IContactoRepository.ts           ← add getById
frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts  ← add getById
frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx        ← add Link navigation + active highlight
frontend/src/routes/_app/contactos.tsx                                       ← update to support child route Outlet
frontend/src/routeTree.gen.ts                                                ← auto-regenerated by TanStack Router plugin
```

**Files to verify (reuse from Story 3.1):**
```
frontend/src/shared/components/EmptyState.tsx
frontend/src/shared/components/ErrorPanel.tsx
frontend/src/shared/lib/apiClient.ts
frontend/src/shared/lib/queryClient.ts
```

### API Contract

```
GET /api/v1/contactos/{id}

Response 200 OK — Content-Type: application/json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nombre": "Juan Pérez",
  "cargo": "Gerente Comercial",
  "telefono": "3001234567",
  "email": "juan.perez@empresa.com",
  "clienteId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-06-25T10:30:00Z",
  "updatedAt": "2026-06-25T10:30:00Z"
}

Response 404 Not Found — Problem Details RFC 7807
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Contacto con id 550e8400-e29b-41d4-a716-446655440001 no encontrado."
}

Response 500 — Problem Details RFC 7807 (via ExceptionHandlingMiddleware)
```

### Learnings from Story 3.1 and Story 2.2 (Directly Analogous)

1. `siesa-ui-kit` does NOT export `EmptyState` or `ErrorPanel` — use the custom components at `frontend/src/shared/components/`.
2. `@/` path alias is configured in `vite.config.ts` and `tsconfig.json` — use it for all imports.
3. `ExceptionHandlingMiddleware` is already wired in `Program.cs` from Story 1.3 — do NOT re-register.
4. `AppDbContext.Contactos` DbSet already exists from Story 3.1 — no new migration needed for this story (detail only reads data).
5. `IContactoRepository` returns `IEnumerable<ContactoEntity>` from `GetAllAsync`; `GetByIdAsync` should return `ContactoEntity?` (projection to DTO happens in the handler).
6. `react-loading-skeleton` is already installed — use it directly for skeleton screens.
7. Navigation tests (`navigation.test.tsx`) may need MSW stubs for `GET /api/v1/contactos/:id` — add them when updating route tests.
8. `ContactoEntity.ClienteId` is nullable — `ContactoDto.ClienteId` can be null; handle gracefully in the detail view (omit or show "Sin cliente asignado" if null).
9. `clientes.$clienteId.tsx` used `useChildMatches` in Story 2.2 to detect active child route — apply same pattern for `contactos.tsx`.

### References

- FR13 (Ver detalle contacto), FR30 (Deep linking) [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.2`]
- TanStack Router file-based routing: `_app/contactos.$contactoId.tsx` [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- TanStack Query key `['contactos', id]` [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- `GET /api/v1/contactos/{id}` endpoint contract [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- `ContactoDetailView` component in architecture [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure`]
- Problem Details RFC 7807 for 404 [Source: `_bmad-output/planning-artifacts/architecture.md#Backend Critical Rules`]
- `ContactoEntity` fields and nullable `ClienteId` [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- NFR2 (CRUD < 2s UI update) [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- Story 2.2 learnings (analogous client detail pattern) [Source: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md#Dev Notes`]
- Story 3.1 learnings (contactos domain foundation) [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md#Dev Notes`]
- siesa-ui-kit P0 mandatory rule + no EmptyState/ErrorPanel in kit [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md#Completion Notes List`]
- MasterCrud not applicable for read-only detail cards [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- Company standards: DateTimeOffset, UUID PKs, snake_case DB, Scalar, Problem Details [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
