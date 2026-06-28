# Story 3.2: Contact Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a contact by selecting them from the list,
so that I can review all their information at once.

## Acceptance Criteria

1. **Given** the contact list is displayed, **When** the user clicks on a contact item, **Then** the contact detail view shows: Nombre, Cargo, Teléfono, Email (FR13), **And** the URL updates to `/contactos/:contactoId` (FR30).

2. **Given** the user accesses `/contactos/:contactoId` directly via URL, **When** the page loads, **Then** the correct contact details are displayed (FR30).

3. **Given** a `contactoId` in the URL does not exist, **When** the page loads, **Then** a not-found message is displayed gracefully (no crash, no blank page).

4. **Given** the backend is unavailable when loading a specific contact detail, **When** the `GET /api/v1/contactos/:id` fetch fails with a non-404 error, **Then** an `ErrorPanel` with a "Reintentar" button is displayed instead of the contact data.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Verify `GET /api/v1/contactos/:id` endpoint is complete (AC: #2, #3, #4)
  - [ ] Verify `IContactoRepository.GetByIdAsync(Guid id, CancellationToken ct)` exists in `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` — confirmed present from Story 3.1
  - [ ] Verify `ContactoRepository` implements `GetByIdAsync` — confirmed present from Story 3.1
  - [ ] Verify `GET /{id:guid}` is mapped in `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — confirmed present from Story 3.1; returns `Results.Ok(ContactoDto)` on success, `Results.Problem(statusCode: 404)` when not found
  - [ ] No new backend files needed; endpoint is already implemented in Story 3.1

- [ ] Task 2 — Frontend: Application layer — `useContacto` hook (AC: #2, #4)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContacto.ts` — TanStack Query hook:
    - `queryKey: ['contactos', id]` — canonical per-entity key (same pattern as `['clientes', id]` in Story 2.2)
    - `queryFn: () => contactoApiRepository.getById(id!)` — calls `GET /api/v1/contactos/${id}`
    - `enabled: !!id` — no fetch when id is undefined
    - `staleTime: 0`
  - [ ] Extend `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `getById(id: string): Promise<Contacto>`
  - [ ] Extend `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — add `getById(id: string)` method: `GET /api/v1/contactos/${id}` via `apiClient`; axios throws on 404 (AxiosError with `response.status === 404`)

- [ ] Task 3 — Frontend: Presentation layer — `ContactoDetailView` component (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`:
    - Accepts `contactoId: string` prop
    - Uses `useContacto(contactoId)` hook
    - `isLoading` state: renders skeleton placeholders (`react-loading-skeleton`) for 4 fields — NOT a spinner
    - `isError` + 404 detection via `axios.isAxiosError(error) && error.response?.status === 404` → renders `<NotFoundPanel title="Contacto no encontrado" description="El contacto solicitado no existe o fue eliminado." />`
    - `isError` (non-404): renders `<ErrorPanel onRetry={refetch} message="No se pudo cargar el contacto." />`
    - Data loaded: renders read-only detail card with: Nombre (heading `text-xl font-bold`), Cargo, Teléfono, Email — all field labels in Spanish
    - All user-facing text in Spanish
    - `data-testid="contacto-detail-view"` on root element
  - [ ] Reuse `frontend/src/shared/components/NotFoundPanel.tsx` — confirmed present from Story 2.2; accepts `title: string`, `description?: string`, `data-testid="not-found-panel"`
  - [ ] Reuse `frontend/src/shared/components/ErrorPanel.tsx` — confirmed present from Story 2.1

- [ ] Task 4 — Frontend: Route wiring — replace stub with full `ContactoDetailPage` (AC: #1, #2)
  - [ ] Update `frontend/src/routes/_app/contactos.$contactoId.tsx` — replace the `ContactoDetailStub` with a full-page layout:
    - Renders `<ContactoListView />` on the left (280px wide, reuse same split-panel as `clientes.$clienteId.tsx`)
    - Renders `<ContactoDetailView contactoId={contactoId} />` on the right (flex-1)
    - Reads `contactoId` via `Route.useParams()`
  - [ ] Update `frontend/src/routes/_app/contactos.tsx` — replace stub or placeholder right panel with a "no contact selected" state or render `<ContactoListView />` alone (full page, since contacts uses full-page layout per Story 3.1)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoListItem.tsx` — clicking a list item navigates to `/contactos/$contactoId` using TanStack Router `<Link>` or `router.navigate()`. Do NOT use `window.location.href`. Add `aria-label` or visible active state when `contactoId` matches.

- [ ] Task 5 — Tests (AC: #1, #2, #3, #4) — aligned with test-design-epic-3.md
  - [ ] **Backend API — P1**: `GET /api/v1/contactos/:id` with seeded contacto returns 200 + correct `ContactoDto` (xUnit, WebApplicationFactory + Testcontainers)
  - [ ] **Backend API — P1**: `GET /api/v1/contactos/{unknown-uuid}` returns 404 + Problem Details (xUnit, WebApplicationFactory + Testcontainers)
  - [ ] **Frontend component — P1**: `ContactoDetailView` with valid contactoId shows Nombre, Cargo, Teléfono, Email (Vitest + RTL + MSW)
  - [ ] **Frontend component — P2**: `ContactoDetailView` with non-existent ID (MSW 404) renders `NotFoundPanel` with "Contacto no encontrado" (Vitest + RTL + MSW)
  - [ ] **Frontend component — P1**: `ContactoDetailView` with MSW 500 shows `ErrorPanel` + "Reintentar" button (Vitest + RTL + MSW)
  - [ ] **Frontend component — P2**: clicking a `ContactoListItem` navigates to `/contactos/$contactoId` (verify route param matches) (Vitest + RTL + TanStack Router test util)
  - [ ] **E2E — P1**: navigate directly to `/contactos/:id` — detail shows all four fields correctly (Playwright, TC-E3-3-2-E2E-1, risk R-006)

## Dev Notes

### Architecture Context

This story wires the per-contact detail view for Epic 3. It follows the same detail-view pattern established in Story 2.2 (Client Detail View) but uses a **full-page layout** instead of a split-panel, consistent with the design direction for contacts. Specifically:

- `GET /api/v1/contactos/:id` backend endpoint is **already implemented in Story 3.1** (`ContactoEndpoints.cs` line ~17); no new backend files needed.
- `useContacto(id)` TanStack Query hook uses canonical key `['contactos', id]` (mirrors `['clientes', id]` from Story 2.2).
- `ContactoDetailView` presentation component replaces the stub in `contactos.$contactoId.tsx`.
- URL deep linking `/contactos/:contactoId` is FR30 — the route file `contactos.$contactoId.tsx` already exists as a stub from Story 3.1 and must be fully implemented here.

**Scope boundary (CRITICAL):** This story is **read-only detail view only**. No edit/delete/create functionality is wired here (Stories 3.3–3.5). `ContactoDetailView` may include Edit/Delete button placeholders (disabled) if the layout calls for it, but their logic must NOT be implemented.

**Layout decision — full page vs split panel:**
- Clientes (Epic 2) uses a 280px split-panel (left: list, right: detail).
- Contactos (Epic 3) uses a **full-page list view at `/contactos`**. When a contact is selected, the contact detail view replaces the full page at `/contactos/:contactoId`. The left contact list can be displayed alongside the detail (similar to the client split-panel) or the detail can occupy the full page — use the same approach as `clientes.$clienteId.tsx` as a reference. The key requirement is that navigating to `/contactos/:contactoId` renders the contact detail with all four fields visible.

**MasterCrud note:** MasterCrud is NOT used here. This is a read-only detail card component consistent with the direct-component pattern established in Epic 2 and Epic 3.1.

**URL as source of truth:** `contactoId` is read from the URL via `Route.useParams()`. No Zustand state for selected contact. Clicking a `ContactoListItem` navigates using TanStack Router — NOT `window.location.href`.

### Backend: GET /api/v1/contactos/:id — ALREADY IMPLEMENTED

The endpoint exists in `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`:

```csharp
group.MapGet("/{id:guid}", async (Guid id, IContactoRepository repo, CancellationToken ct) =>
{
    var contacto = await repo.GetByIdAsync(id, ct);
    if (contacto is null)
        return Results.Problem(
            detail: "El contacto solicitado no fue encontrado.",
            statusCode: 404,
            title: "Contacto no encontrado");
    return Results.Ok(new ContactoDto(
        contacto.Id, contacto.Nombre, contacto.Cargo, contacto.Telefono,
        contacto.Email, contacto.ClienteId, contacto.CreatedAt, contacto.UpdatedAt));
});
```

Response shape — success (200 OK):
```json
{
  "id": "uuid",
  "nombre": "María López",
  "cargo": "Gerente Comercial",
  "telefono": "3001234567",
  "email": "maria.lopez@empresa.com",
  "clienteId": null,
  "createdAt": "2026-06-28T10:30:00Z",
  "updatedAt": "2026-06-28T10:30:00Z"
}
```

Response shape — not found (404, Problem Details RFC 7807):
```json
{
  "title": "Contacto no encontrado",
  "status": 404,
  "detail": "El contacto solicitado no fue encontrado."
}
```

`IContactoRepository.GetByIdAsync` is already declared in `IContactoRepository.cs` and implemented in `ContactoRepository.cs` from Story 3.1.

### Frontend: useContacto Hook

```typescript
// frontend/src/modules/crm/contactos/application/useContacto.ts
import { useQuery } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';

export const useContacto = (id: string | undefined) =>
  useQuery({
    queryKey: ['contactos', id],
    queryFn: () => contactoApiRepository.getById(id!),
    enabled: !!id,
    staleTime: 0,
  });
```

**CRITICAL:** Query key `['contactos', id]` — NOT `['contacto', id]` (singular) and NOT `['contactos', { id }]` (object wrapper). This is the canonical key per architecture doc. Must match for cache invalidation in Stories 3.3–3.5.

### Frontend: contactoApiRepository — getById extension

```typescript
// Extend frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
// Add to the repository object:
getById: async (id: string): Promise<Contacto> => {
  const response = await apiClient.get<Contacto>(`/api/v1/contactos/${id}`);
  return response.data;
},
```

Axios throws an `AxiosError` on 4xx/5xx. Detect 404 in the component:

```typescript
import axios from 'axios';
const isNotFound = isError && axios.isAxiosError(error) && error.response?.status === 404;
```

### Frontend: ContactoDetailView — Key Implementation Points

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import { useContacto } from '../application/useContacto';
import { ErrorPanel } from '@/shared/components/ErrorPanel';
import { NotFoundPanel } from '@/shared/components/NotFoundPanel';

interface ContactoDetailViewProps {
  contactoId: string;
}

export const ContactoDetailView = ({ contactoId }: ContactoDetailViewProps) => {
  const { data, isLoading, isError, error, refetch } = useContacto(contactoId);

  const isNotFound = isError && axios.isAxiosError(error) && error.response?.status === 404;

  if (isLoading) return <Skeleton count={4} height={32} className="mb-2" />;
  if (isNotFound) return (
    <NotFoundPanel
      title="Contacto no encontrado"
      description="El contacto solicitado no existe o fue eliminado."
    />
  );
  if (isError) return <ErrorPanel onRetry={refetch} message="No se pudo cargar el contacto." />;

  return (
    <div data-testid="contacto-detail-view" className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{data!.nombre}</h2>
      <dl className="space-y-3">
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cargo</dt>
          <dd className="text-sm text-slate-900 mt-0.5">{data!.cargo}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teléfono</dt>
          <dd className="text-sm text-slate-900 mt-0.5">{data!.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</dt>
          <dd className="text-sm text-slate-900 mt-0.5">{data!.email}</dd>
        </div>
      </dl>
    </div>
  );
};
```

### Frontend: TanStack Router — Dynamic Route (replace stub)

```typescript
// frontend/src/routes/_app/contactos.$contactoId.tsx
// Replace the ContactoDetailStub with this full implementation:
import { createFileRoute } from '@tanstack/react-router';
import { ContactoListView } from '../../modules/crm/contactos/presentation/ContactoListView';
import { ContactoDetailView } from '../../modules/crm/contactos/presentation/ContactoDetailView';

export const Route = createFileRoute('/_app/contactos/$contactoId')({
  component: ContactoDetailPage,
});

function ContactoDetailPage() {
  const { contactoId } = Route.useParams();
  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r border-slate-200 overflow-y-auto">
        <ContactoListView />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ContactoDetailView contactoId={contactoId} />
      </div>
    </div>
  );
}
```

### Frontend: ContactoListItem — Navigation on Click

```typescript
// Update ContactoListItem.tsx or ContactoListView.tsx to use TanStack Router Link:
import { Link } from '@tanstack/react-router';

// Wrap each item OR use router.navigate() in onClick:
<Link to="/contactos/$contactoId" params={{ contactoId: contacto.id }}>
  <ContactoListItem contacto={contacto} isActive={...} />
</Link>
```

`isActive` highlight: compare `contactoId` from `Route.useParams()` with each contact's id. Render a visual highlight (e.g., `bg-[#0e79fd] text-white`) on the active item.

### Project Structure Notes

**Files to create:**

```
frontend/
└── src/
    ├── modules/crm/contactos/
    │   ├── domain/IContactoRepository.ts        ← MODIFY (add getById)
    │   ├── application/useContacto.ts            ← CREATE
    │   ├── infrastructure/contactoApiRepository.ts ← MODIFY (add getById method)
    │   ├── presentation/ContactoDetailView.tsx   ← CREATE
    │   └── __tests__/ContactoDetailView.test.tsx ← CREATE
    └── routes/_app/
        ├── contactos.$contactoId.tsx             ← MODIFY (replace stub)
        └── contactos.tsx                         ← VERIFY (may stay full-page, no change needed)
```

**Files to verify from Story 3.1 (do NOT recreate):**

```
backend/
└── src/
    ├── SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs  ← GetByIdAsync confirmed
    ├── SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs    ← GetByIdAsync confirmed
    └── SiesaAgents.API/Endpoints/ContactoEndpoints.cs                  ← GET /{id:guid} confirmed

frontend/
└── src/
    ├── modules/crm/contactos/
    │   ├── domain/Contacto.ts                     ← interface confirmed
    │   ├── infrastructure/contactoApiRepository.ts ← exists; extend with getById
    │   └── presentation/ContactoListItem.tsx       ← exists; update navigation to use Link
    ├── shared/components/NotFoundPanel.tsx         ← confirmed from Story 2.2; data-testid="not-found-panel"
    ├── shared/components/ErrorPanel.tsx            ← confirmed from Story 2.1; data-testid="error-panel"
    └── shared/lib/apiClient.ts                     ← confirmed from Story 1.2; do NOT recreate
```

**Backend tests — new file:**

```
backend/tests/SiesaAgents.UnitTests/Contactos/GetContactoByIdApiTests.cs  ← CREATE (P1 + P1 API tests)
```

### TanStack Query Key Alignment

Per architecture canonical keys:
- `['contactos']` → all contacts (`useContactos`, Story 3.1)
- `['contactos', id]` → single contact (`useContacto`, this story)

**CRITICAL:** The `id` in `queryKey: ['contactos', id]` must be the string UUID from the route param. Invalidating `['contactos']` in Stories 3.3–3.5 will NOT invalidate `['contactos', id]` — use `invalidateQueries({ queryKey: ['contactos'] })` with `exact: false` OR invalidate both separately on mutations.

### Testing Approach

**Backend integration tests** use `WebApplicationFactory<Program>` + Testcontainers PostgreSQL (established in Story 1.3). Seed a `ContactoEntity` via `AppDbContext` in the test fixture, then:
- Assert `GET /api/v1/contactos/{seeded-id}` returns 200 + correct DTO fields (Nombre, Cargo, Teléfono, Email).
- Assert `GET /api/v1/contactos/{unknown-uuid}` returns 404 + Problem Details (type, title, status, detail keys).

**Frontend component tests** use Vitest + React Testing Library + MSW 2.x. Reuse `contactoFactory.ts` from Story 3.1:
- MSW handler: `http.get('/api/v1/contactos/:id', resolver)` responding with a fixture `Contacto`.
- Override handler per test for 404/500 scenarios.

**Key test scenarios for this story (from test-design-epic-3.md):**

| Test ID | Level | Scenario | Priority |
|---------|-------|----------|---------|
| TC-E3-3-2-API-1 | API | `GET /api/v1/contactos/:id` returns 200 + correct ContactoDto with all 4 fields | P1 |
| TC-E3-3-2-API-2 | API | `GET /api/v1/contactos/{unknown-uuid}` returns 404 + Problem Details | P1 |
| TC-E3-3-2-CMP-1 | Component | `ContactoDetailView` with valid ID shows Nombre, Cargo, Teléfono, Email | P1 |
| TC-E3-3-2-CMP-2 | Component | `ContactoDetailView` with MSW 404 shows `NotFoundPanel` "Contacto no encontrado" | P2 |
| TC-E3-3-2-CMP-3 | Component | `ContactoDetailView` with MSW 500 shows `ErrorPanel` + "Reintentar" | P1 |
| TC-E3-3-2-CMP-4 | Component | Clicking `ContactoListItem` navigates to `/contactos/$contactoId` | P2 |
| TC-E3-3-2-E2E-1 | E2E | Navigate directly to `/contactos/:id` — all four fields displayed | P1 |
| TC-E3-3-2-E2E-2 | E2E | Navigate to `/contactos/00000000-0000-0000-0000-000000000000` — not-found rendered | P3 |

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `useContacto` has `enabled: !!id` — no fetch when id is undefined/empty
- [ ] Query key is `['contactos', id]` (array with id string) — NOT `['contacto', id]` and NOT `['contactos', { id }]`
- [ ] 404 detected via `axios.isAxiosError(error) && error.response?.status === 404` — separate path from generic `isError`
- [ ] 404 renders `NotFoundPanel` — NOT `ErrorPanel` (different UX intent, confirmed from Story 2.2 pattern)
- [ ] `isLoading` uses `react-loading-skeleton` — NOT a spinner
- [ ] All user-facing text in Spanish: field labels (Cargo, Teléfono, Email), error messages, not-found text
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `ContactoListItem` click uses TanStack Router `<Link>` or `router.navigate()` — NOT `window.location.href`
- [ ] URL updates to `/contactos/:contactoId` on item selection (FR30)
- [ ] `GET /api/v1/contactos/:id` 404 response uses `Results.Problem(...)` — NOT `Results.NotFound()` with empty body (already implemented)
- [ ] Detail view shows exactly 4 fields: Nombre, Cargo, Teléfono, Email (FR13) — no extra/missing fields
- [ ] Backend error responses use Problem Details RFC 7807 — no stack traces exposed (NFR6)
- [ ] `data-testid="contacto-detail-view"` on root element of `ContactoDetailView`
- [ ] `data-testid="not-found-panel"` on `NotFoundPanel` (confirmed present in `NotFoundPanel.tsx`)
- [ ] `data-testid="error-panel"` on `ErrorPanel` (confirmed present in `ErrorPanel.tsx`)

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md#Story 3.2`]
- Architecture — FR13 (View contact detail fields): [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- Architecture — FR30 (deep linking): [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements Overview`]
- Architecture — TanStack Query canonical keys (['contactos', id]): [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Architecture — REST endpoint GET /api/v1/contactos/{id}: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — Frontend folder structure (contactos.$contactoId.tsx route): [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`]
- Architecture — Enforcement guidelines (Problem Details, Spanish text, no any): [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Test design — TC-E3-3-2 test scenarios, R-006 risk: [Source: `_bmad-output/test-design-epic-3.md#4. Test Coverage Plan`]
- Preceding story — ContactoListView, ContactoListItem, contactoApiRepository, contactoFactory: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- Preceding story — ClienteDetailView pattern (useCliente hook, 404 detection, split-panel): [Source: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md`]
- Backend — IContactoRepository.GetByIdAsync already declared: [Source: `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`]
- Backend — GET /{id:guid} already implemented: [Source: `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`]
- Shared component — NotFoundPanel (data-testid, props): [Source: `frontend/src/shared/components/NotFoundPanel.tsx`]
- Shared component — ErrorPanel (data-testid, onRetry prop): [Source: `frontend/src/shared/components/ErrorPanel.tsx`]
- Company standards — Frontend stack (TanStack Router, TanStack Query, Axios): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]
- Company standards — Backend stack (Minimal API, Problem Details RFC 7807): [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`]
- Company standards — Spanish user-facing text rule: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
