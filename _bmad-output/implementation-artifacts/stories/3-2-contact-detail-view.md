# Story 3.2: Contact Detail View

Status: done
Review: PASS

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a contact by selecting them from the list,
so that I can review all their information at once.

## Acceptance Criteria

1. **Given** the contact list is displayed, **When** the user clicks on a contact item, **Then** the contact detail view shows: Nombre, Cargo, Teléfono, Email (FR13) **And** the URL updates to `/contactos/:contactoId` (FR30).

2. **Given** the user accesses `/contactos/:contactoId` directly via URL, **When** the page loads, **Then** the correct contact details are displayed (FR30).

3. **Given** a contactoId in the URL does not exist, **When** the page loads, **Then** a not-found message is displayed gracefully.

## Tasks / Subtasks

- [x] Task 1 — Backend: implement `GET /api/v1/contactos/:id` endpoint (AC: 1, 2, 3)
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQuery.cs` — record with `Guid Id` parameter
  - [x] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs` — calls `IContactoRepository.GetByIdAsync(id, ct)`, maps to `ContactoDto`, returns `null` when not found
  - [x] Add `GetByIdAsync(Guid id, CancellationToken ct): Task<ContactoEntity?>` to `IContactoRepository` interface
  - [x] Implement `GetByIdAsync` in `ContactoRepository.cs` → `_context.Contactos.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)`
  - [x] Add `GET /{id:guid}` endpoint to `ContactoEndpoints.cs` — returns `200 OK + ContactoDto` or `404 Problem Details` (RFC 7807)
  - [x] Register `GetContactoByIdQueryHandler` in `Program.cs` DI

- [x] Task 2 — Frontend: implement `useContactoById` TanStack Query hook (AC: 1, 2)
  - [x] Create `frontend/src/modules/crm/contactos/application/useContactoById.ts`
  - [x] Use `useQuery` with `queryKey: ['contactos', id]`
  - [x] `queryFn`: calls `contactoApiRepository.getById(id)`
  - [x] `enabled: !!id` — prevents fetching when id is undefined
  - [x] `retry: false` — avoids retrying on 404
  - [x] Add `getById(id: string): Promise<Contacto>` to `IContactoRepository` interface
  - [x] Implement `getById` in `contactoApiRepository.ts` → `GET /api/v1/contactos/:id`

- [x] Task 3 — Frontend: implement `ContactoDetailPanel` presentation component (AC: 1, 2, 3)
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`
  - [x] Props: `contactoId: string`
  - [x] Shows labeled fields: Nombre, Cargo, Teléfono, Email — all user-facing labels in Spanish
  - [x] `data-testid="contacto-detail-panel"` on root element
  - [x] `data-testid="contacto-detail-nombre"` on Nombre field value
  - [x] `data-testid="contacto-detail-cargo"` on Cargo field value
  - [x] `data-testid="contacto-detail-telefono"` on Teléfono field value
  - [x] `data-testid="contacto-detail-email"` on Email field value
  - [x] Loading state: skeleton placeholders via `react-loading-skeleton` (4 rows) — NOT spinners
  - [x] 404 case: renders `data-testid="contacto-not-found"` with text "Contacto no encontrado"
  - [x] Generic error case: renders error message via `<ErrorPanel />` component
  - [x] WCAG 2.1 AA: use `aria-label` on the panel container

- [x] Task 4 — Frontend: create `/contactos/$contactoId` route (AC: 1, 2)
  - [x] Create `frontend/src/routes/_app/contactos.$contactoId.tsx`
  - [x] Route renders `ContactoDetailPanel` with `contactoId` from `useParams`
  - [x] File name follows TanStack Router `$` prefix convention for dynamic params

- [x] Task 5 — Frontend: update `ContactoListView` to navigate on contact click (AC: 1)
  - [x] Wrap `ContactoListItem` in `ContactoListView.tsx` with TanStack Router `<Link>` pointing to `/contactos/$contactoId`
  - [x] Apply active item state using `useParams` — highlight the currently selected contact row

- [x] Task 6 — Frontend: update `/contactos` route to include `<Outlet />` (AC: 1, 2)
  - [x] Update `frontend/src/routes/_app/contactos.tsx` to render `<Outlet />` alongside `ContactoListView`
  - [x] This enables the detail panel to render as a nested child route of `/contactos`

- [x] Task 7 — Write E2E tests (AC: 1, 2, 3)
  - [x] Create `e2e/tests/contactos/contactos-detail.spec.ts`
    - E2E-CT-07 (P0): Click contact row → `contacto-detail-panel` visible with all 4 fields (Nombre, Cargo, Teléfono, Email)
    - E2E-CT-08 (P1): Click contact row → URL updates to `/contactos/{uuid}` pattern
    - E2E-CT-09 (P1): Direct navigation to `/contactos/:id` → correct contact detail displayed without prior list interaction
    - E2E-CT-10 (P1): Navigate to `/contactos/00000000-0000-0000-0000-000000000000` → `contacto-not-found` component visible, no `pageerror` events

- [x] Task 8 — Write API integration tests for Story 3.2 (AC: 2, 3)
  - [x] Add Story 3.2 describe block to `e2e/tests/contactos/contactos-api.spec.ts`
    - API-CT-08 (P1): `GET /api/v1/contactos/:id` valid ID → 200 + full `ContactoDto` with `clienteId: null`
    - API-CT-09 (P1): `GET /api/v1/contactos/:id` non-existent ID → 404 Problem Details (no `stackTrace` key in body)

## Dev Notes

### Architecture Context

This story builds directly on Story 3.1 (Contact List & Search). It mirrors the pattern established in Story 2.2 (Client Detail View) for the contacts domain.

**Depends on:**
- Story 3.1 — `ContactoEntity`, `IContactoRepository`, `ContactoRepository`, `ContactoEndpoints`, `contactoApiRepository`, `ContactoListView`, `/contactos` route all established
- Story 1.2 — `contactos.$contactoId.tsx` route slot defined in TanStack Router structure

**Provides for:** Stories 3.3 (Create Contact) and 3.4 (Edit Contact) will add "Nuevo contacto" and "Editar" action buttons inside the detail panel.

**Route structure (TanStack Router):**
```
/contactos                         → ContactoListView (list)
/contactos/:contactoId             → ContactoListView + ContactoDetailPanel (nested route via <Outlet />)
```

**Query key for single contact:** `['contactos', id]` — per architecture.md canonical query keys.

### Frontend File Locations

```
frontend/src/
  modules/crm/contactos/
    domain/
      IContactoRepository.ts              # Updated: add getById(id: string): Promise<Contacto>
    application/
      useContactoById.ts                  # TanStack Query hook — queryKey: ['contactos', id]
    infrastructure/
      contactoApiRepository.ts            # Updated: add getById()
    presentation/
      ContactoDetailPanel.tsx             # Detail panel — 4 labeled fields + skeleton + not-found
  routes/_app/
    contactos.$contactoId.tsx             # TanStack Router dynamic route — renders ContactoDetailPanel
    contactos.tsx                         # Updated: add <Outlet /> for detail nested route

e2e/tests/contactos/
  contactos-detail.spec.ts                # E2E-CT-07 to E2E-CT-10
  contactos-api.spec.ts                   # Updated: Story 3.2 describe block (API-CT-08, API-CT-09)
```

### `useContactoById` Hook Pattern

```typescript
// frontend/src/modules/crm/contactos/application/useContactoById.ts
import { useQuery } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'

export function useContactoById(id: string | undefined) {
  return useQuery({
    queryKey: ['contactos', id],
    queryFn: () => contactoApiRepository.getById(id!),
    enabled: !!id,
    retry: false,  // Avoids retrying 404 responses
  })
}
```

### `ContactoDetailPanel` Component Pattern

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useContactoById } from '../application/useContactoById'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface Props { contactoId: string }

export function ContactoDetailPanel({ contactoId }: Props) {
  const { data, isLoading, isError } = useContactoById(contactoId)

  if (isLoading) {
    return (
      <div data-testid="contacto-detail-panel" className="p-4 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton width="30%" height={12} />
            <Skeleton width="60%" height={16} />
          </div>
        ))}
      </div>
    )
  }

  if (isError || !data) {
    if (!data && !isError) {
      // 404 case — query returned undefined (not-found)
      return (
        <div data-testid="contacto-not-found" className="p-4 text-slate-500">
          Contacto no encontrado
        </div>
      )
    }
    return <ErrorPanel />
  }

  return (
    <div data-testid="contacto-detail-panel" aria-label="Detalle del contacto" className="p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Nombre</span>
        <span data-testid="contacto-detail-nombre" className="text-sm font-medium text-slate-900">{data.nombre}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Cargo</span>
        <span data-testid="contacto-detail-cargo" className="text-sm text-slate-700">{data.cargo}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Teléfono</span>
        <span data-testid="contacto-detail-telefono" className="text-sm text-slate-700">{data.telefono}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Email</span>
        <span data-testid="contacto-detail-email" className="text-sm text-slate-700">{data.email}</span>
      </div>
    </div>
  )
}
```

**Note on 404 handling:** When `useContactoById` has `retry: false` and the backend returns 404, TanStack Query sets `isError = true`. In `ContactoDetailPanel`, distinguish the 404 case (render `data-testid="contacto-not-found"`) from other errors (render `<ErrorPanel />`). Inspect `error.response?.status === 404` from the Axios error to make this distinction.

### Route Files

```typescript
// frontend/src/routes/_app/contactos.$contactoId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ContactoDetailPanel } from '../../modules/crm/contactos/presentation/ContactoDetailPanel'

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailComponent,
})

function ContactoDetailComponent() {
  const { contactoId } = Route.useParams()
  return <ContactoDetailPanel contactoId={contactoId} />
}
```

```typescript
// frontend/src/routes/_app/contactos.tsx — add <Outlet /> to enable nested route rendering
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView'

export const Route = createFileRoute('/_app/contactos')({
  component: ContactosLayout,
})

function ContactosLayout() {
  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 border-r border-slate-200 overflow-y-auto">
        <ContactoListView />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
```

### Backend: `GET /api/v1/contactos/:id` Endpoint

```csharp
// Addition to backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs
group.MapGet("/{id:guid}", async (Guid id, GetContactoByIdQueryHandler handler, CancellationToken ct) =>
{
    var result = await handler.HandleAsync(new GetContactoByIdQuery(id), ct);
    return result is null
        ? Results.Problem(statusCode: 404, title: "Not Found", detail: $"Contacto con id '{id}' no encontrado.")
        : Results.Ok(result);
})
.WithName("GetContactoById")
.Produces<ContactoDto>(StatusCodes.Status200OK)
.Produces(StatusCodes.Status404NotFound);
```

### Backend: `GetContactoByIdQueryHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs
namespace SiesaAgents.Application.Contactos.Queries;

public class GetContactoByIdQueryHandler(IContactoRepository repository)
{
    public async Task<ContactoDto?> HandleAsync(GetContactoByIdQuery query, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(query.Id, ct);
        if (entity is null) return null;

        return new ContactoDto(
            entity.Id,
            entity.Nombre,
            entity.Cargo,
            entity.Telefono,
            entity.Email,
            entity.ClienteId,
            entity.CreatedAt,
            entity.UpdatedAt
        );
    }
}
```

### Backend: `GetByIdAsync` Repository Method

```csharp
// Addition to ContactoRepository.cs
public async Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)
    => await _context.Contactos.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
```

**Response contract (direct object, no wrapper):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nombre": "María García",
  "cargo": "Gerente Comercial",
  "telefono": "+57 1 234 5679",
  "email": "m.garcia@empresa.com",
  "clienteId": null,
  "createdAt": "2026-05-21T10:30:00Z",
  "updatedAt": "2026-05-21T10:30:00Z"
}
```

**404 response (Problem Details RFC 7807):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Contacto con id '...' no encontrado."
}
```

### Loading State — Skeleton Pattern

Use `react-loading-skeleton` (company standard) for all loading states — NOT spinners. Render 4 skeleton rows (one per field: Nombre, Cargo, Teléfono, Email).

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/contactos/contactos-detail.spec.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-CT-07 | P0 | AC1 | Click contact row → detail panel shows Nombre, Cargo, Teléfono, Email |
| E2E-CT-08 | P1 | AC1 | Click contact row → URL updates to `/contactos/{uuid}` |
| E2E-CT-09 | P1 | AC2 | Direct navigation to `/contactos/:id` loads correct contact detail |
| E2E-CT-10 | P1 | AC3 | Navigate to non-existent ID → not-found message visible, no JS errors |

**Implementation notes (from test-design-epic-3.md):**
- E2E-CT-07: Create contact via `apiHelper.createContacto()`. Navigate to `/contactos`, click the row matching the name. Assert `contactosPage.detailPanel` visible; assert all 4 `data-testid` field values match the created contact's data.
- E2E-CT-08: After `contactosPage.seleccionarContacto(nombre)`, assert `page.url()` matches `/contactos/{uuid}` using regex `/\/contactos\/[0-9a-f]{8}-/`.
- E2E-CT-09: Use `page.goto('/contactos/' + contacto.id)` directly. Assert `detailPanel` shows correct `nombre` without first loading the list view.
- E2E-CT-10: Register `page.on('pageerror', err => { throw err })` listener before navigation. Navigate to `/contactos/00000000-0000-0000-0000-000000000000`. Assert `data-testid="contacto-not-found"` element visible. Assert no `pageerror` events fired.

**API Integration Tests — `e2e/tests/contactos/contactos-api.spec.ts` (Story 3.2 scope):**

| Test ID | Priority | Description |
|---------|----------|-------------|
| API-CT-08 | P1 | `GET /api/v1/contactos/:id` valid ID → 200 + full `ContactoDto` with `clienteId: null` |
| API-CT-09 | P1 | `GET /api/v1/contactos/:id` non-existent ID → 404 Problem Details (no `stackTrace` key) |

**Implementation notes:**
- API-CT-08: Create contact via `apiHelper`, GET by returned `id`. Assert `status === 200`, assert body has all fields including `clienteId: null`, assert `id` is UUID pattern.
- API-CT-09: Assert `status === 404`. Parse JSON body and assert no `stackTrace` key present (NFR6 compliance).

### Key Anti-Patterns to Avoid

```
❌ retry: true on useContactoById          → retry: false (avoids retrying 404s)
❌ spinner for loading state               → react-loading-skeleton (4 skeleton rows)
❌ English UI text                         → all user-facing text in Spanish
❌ exposing error.message to user          → use data-testid="contacto-not-found" + ErrorPanel
❌ missing data-testid="contacto-detail-panel" → required by ContactosPage POM locator
❌ app.UseSwagger()                        → Scalar only (already configured)
❌ DateTime in backend                     → DateTimeOffset mandatory
❌ int/string PK                           → Guid (UUID) mandatory
❌ [Column("...")] attributes              → ApplySnakeCaseNaming() handles mapping automatically
❌ Navigation property lazy loading        → explicit queries only (AsNoTracking())
❌ queryKey as string                      → use array: ['contactos', id]
```

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.2 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Frontend Architecture" (route `/contactos/:id`, query key `['contactos', id]`), "API & Communication Patterns" (`GET /api/v1/contactos/{id}`), "Format Patterns" (GET single → direct object, 404 → Problem Details)
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-3.md` — E2E-CT-07 to E2E-CT-10, API-CT-08, API-CT-09, risk R5 (deep link graceful not-found), risk R10 (URL update on click)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-contactos.md` — FR13 (view detail), FR30 (deep linking)
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack, Backend Stack, Database Conventions, Backend Critical Rules
- Predecessor story: `_bmad-output/implementation-artifacts/stories/3-1-contact-list-and-search.md` — establishes `ContactoEntity`, `IContactoRepository`, `contactoApiRepository`, `ContactoListView`
- Reference story: `_bmad-output/implementation-artifacts/stories/2-2-client-detail-view.md` — analogous pattern for clientes

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TypeScript check: `pnpm tsc --noEmit` — 0 errors
- Frontend unit tests: 313 passed, 16 pre-existing failures in `ClienteListPanel.test.tsx` (unrelated to story 3.2)
- E2E tests (contactos-detail.spec.ts, contactos-api.spec.ts): exist as ATDD in RED phase awaiting running backend

### Completion Notes List

- All 8 tasks implemented and verified
- Task 6 (`contactos.tsx` `<Outlet />`) was already complete from Story 3.1; confirmed and left as-is
- E2E tests (Tasks 7 and 8) were pre-authored in ATDD phase; confirmed correct and present in worktree
- 404 detection uses `isAxiosError(error) && error.response?.status === 404` pattern matching `ClienteDetailPanel` reference
- `useParams({ strict: false })` used in `ContactoListView` for active row highlight — matches the clientes pattern

### File List

**To create (frontend):**
- `frontend/src/modules/crm/contactos/application/useContactoById.ts`
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`
- `frontend/src/routes/_app/contactos.$contactoId.tsx`
- `e2e/tests/contactos/contactos-detail.spec.ts`

**To modify (frontend):**
- `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `getById(id: string): Promise<Contacto>`
- `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implement `getById()`
- `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx` — wrap `ContactoListItem` with `<Link>` + active state
- `frontend/src/routes/_app/contactos.tsx` — add layout with `<Outlet />` for nested detail route

**To create (backend):**
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQuery.cs`
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs`

**To modify (backend):**
- `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` — add `GetByIdAsync`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — implement `GetByIdAsync`
- `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — add `GET /{id:guid}` endpoint
- `backend/src/SiesaAgents.API/Program.cs` — register `GetContactoByIdQueryHandler`

**To modify (tests):**
- `e2e/tests/contactos/contactos-api.spec.ts` — add Story 3.2 describe block with API-CT-08 and API-CT-09
