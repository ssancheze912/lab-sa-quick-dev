# Story 2.2: Client Detail View

Status: done

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
So that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: Nombre, NIT/RUC, Teléfono, Ciudad **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly, **Then** the correct client details are loaded and displayed (FR30).

3. **Given** a clienteId in the URL does not exist, **When** the page loads, **Then** a not-found message is displayed gracefully.

## Tasks / Subtasks

- [x] Task 1 — Backend: implement `GET /api/v1/clientes/:id` endpoint (AC: 1, 2, 3)
  - [x] `GetClienteByIdQuery` record already created (existed from Story 2.1 prep)
  - [x] `GetClienteByIdQueryHandler` already created (existed from Story 2.1 prep)
  - [x] Add `GET /{id:guid}` endpoint to `ClienteEndpoints.cs` — returns 200+ClienteDto or 404 Problem Details
  - [x] Register `GetClienteByIdQueryHandler` in `Program.cs` DI
  - [x] `GetByIdAsync` already in `IClienteRepository` and `ClienteRepository`

- [x] Task 2 — Frontend: implement `useClienteById` hook (AC: 1, 2)
  - [x] Create `frontend/src/modules/crm/clientes/application/useClienteById.ts`
  - [x] Use `useQuery` with `queryKey: ['clientes', id]`
  - [x] `enabled: !!id`, `retry: false` (avoid retrying 404)
  - [x] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository`
  - [x] Implement `getById` in `clienteApiRepository.ts` → `GET /api/v1/clientes/:id`

- [x] Task 3 — Frontend: implement `ClienteDetailPanel` component (AC: 1, 2, 3)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
  - [x] Props: `clienteId: string`
  - [x] Shows Nombre, NIT/RUC, Teléfono, Ciudad with labeled fields
  - [x] `data-testid="cliente-detail-panel"` on root element
  - [x] `data-testid="cliente-detail-nombre|nit|telefono|ciudad"` on field values
  - [x] Shows skeleton loading state via react-loading-skeleton
  - [x] 404 case: shows `data-testid="cliente-not-found"` with "Cliente no encontrado"
  - [x] Generic error case: shows error message

- [x] Task 4 — Frontend: create `/clientes/$clienteId` route (AC: 1, 2)
  - [x] Create `frontend/src/routes/_app/clientes.$clienteId.tsx`
  - [x] Route renders `ClienteDetailPanel` with `clienteId` from route params

- [x] Task 5 — Frontend: update `ClienteListPanel` to navigate on click (AC: 1)
  - [x] Wrap `ClientListItem` with TanStack Router `<Link>` pointing to `/clientes/$clienteId`
  - [x] Mark active item based on `useParams` current `clienteId`

- [x] Task 6 — Write E2E tests (AC: 1, 2, 3)
  - [x] Create `e2e/tests/clientes/clientes-detail.spec.ts`
    - E2E-C-07: Click client → detail panel shows Nombre, NIT, Teléfono, Ciudad
    - E2E-C-08: Click client → URL updates to `/clientes/:clienteId`
    - E2E-C-09: Direct navigation to `/clientes/:id` loads correct detail
    - E2E-C-10: Navigate to non-existent ID → not-found message, no JS errors

- [x] Task 7 — Add API-C-08 and API-C-09 to clientes-api.spec.ts (AC: 1, 2, 3)
  - [x] API-C-08: GET `/api/v1/clientes/:id` valid → 200 + full object
  - [x] API-C-09: GET `/api/v1/clientes/:id` non-existent → 404 Problem Details (no stack trace)

## Dev Notes

### Backend Changes

- `GetClienteByIdQuery` and `GetClienteByIdQueryHandler` were pre-created during Story 2.1
- `GetByIdAsync` was already in `IClienteRepository` and `ClienteRepository`
- Added `GET /{id:guid}` to `ClienteEndpoints.cs` between the list endpoint and the POST endpoint
- Registered `GetClienteByIdQueryHandler` in `Program.cs`
- Returns `Results.Problem(statusCode: 404)` for not-found (RFC 7807 Problem Details)

### Frontend File Locations

```
frontend/src/
  modules/crm/clientes/
    application/
      useClienteById.ts             # TanStack Query hook — queryKey: ['clientes', id]
    infrastructure/
      clienteApiRepository.ts       # Updated: added getById()
    domain/
      IClienteRepository.ts         # Updated: added getById()
    presentation/
      ClienteDetailPanel.tsx        # Right panel — detail view
  routes/_app/
    clientes.$clienteId.tsx         # TanStack Router dynamic route

e2e/tests/clientes/
  clientes-detail.spec.ts           # E2E-C-07 to E2E-C-10
  clientes-api.spec.ts              # Added: API-C-08, API-C-09 describe block
```

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- All 4 E2E tests in clientes-detail.spec.ts GREEN (chromium)
- API-C-08 and API-C-09 in clientes-api.spec.ts GREEN
- Story 2.1 regression: all 6 E2E tests in clientes-list.spec.ts still GREEN
- Backend: `GetClienteByIdQueryHandler` registered in DI; endpoint added to `ClienteEndpoints.cs`
- Frontend: routeTree.gen.ts already included `clientes.$clienteId` import (Vite picks up files automatically)
- Fixed `FakeClienteRepository` in `GetClientesQueryHandlerTests.cs` (missing `GetByIdAsync` method added)

### File List

**Created:**
- `frontend/src/modules/crm/clientes/application/useClienteById.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`
- `e2e/tests/clientes/clientes-detail.spec.ts`

**Modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `getById()`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — added `getById()`
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` — added Link navigation + active state
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `GET /{id:guid}` endpoint
- `backend/src/SiesaAgents.API/Program.cs` — registered `GetClienteByIdQueryHandler`
- `backend/tests/SiesaAgents.UnitTests/Handlers/GetClientesQueryHandlerTests.cs` — added `GetByIdAsync` to `FakeClienteRepository`
- `e2e/tests/clientes/clientes-api.spec.ts` — added Story 2.2 describe block with API-C-08 and API-C-09
