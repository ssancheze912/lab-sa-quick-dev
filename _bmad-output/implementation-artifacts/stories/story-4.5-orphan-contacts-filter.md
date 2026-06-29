# Story 4.5: Orphan Contacts Filter

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to filter the contact list to show only contacts not associated with any client,
so that I can identify and manage unassigned contacts easily.

## Acceptance Criteria

1. **Given** the user is on the `/contactos` view, **When** the user activates the "Sin cliente" filter toggle, **Then** the list shows only contacts whose `clienteId` is null. (FR25, AC-E4.5)

2. **Given** the "Sin cliente" filter is active, **When** contacts are displayed, **Then** the count of orphan contacts is visible (e.g., "X contactos sin cliente"). (FR25, AC-E4.5)

3. **Given** the "Sin cliente" filter is active and all contacts have a client assigned, **When** the filtered list is empty, **Then** an `EmptyState` component is shown with the Spanish message "Todos los contactos tienen un cliente asignado". (AC-E4.5)

4. **Given** the "Sin cliente" filter is active, **When** the user deactivates the toggle, **Then** the full contact list is restored showing all contacts. (AC-E4.5)

5. **Given** the "Sin cliente" filter is toggled, **When** the filter state changes, **Then** the filter state is reflected in the URL as a search parameter (`?sinCliente=true`) so the view is deep-linkable and shareable. (FR29 — deep linking, company standard: URL as source of truth)

6. **Given** a user navigates directly to `/contactos?sinCliente=true`, **When** the view renders, **Then** the "Sin cliente" filter is activated automatically and only orphan contacts are shown. (FR29)

7. **Given** the contact list is loading, **When** the fetch is in progress, **Then** a skeleton placeholder is displayed (react-loading-skeleton, not a spinner). (company standard)

8. **Given** the backend is unavailable, **When** the fetch fails, **Then** an `ErrorPanel` with a "Reintentar" button is shown — never a raw error message. (NFR6)

9. **Given** the "Sin cliente" filter toggle is rendered, **When** the user views it, **Then** it is keyboard-accessible (focusable, activatable via Enter/Space) and meets WCAG 2.1 AA. (company standard)

## Tasks / Subtasks

- [ ] Task 1 — Extend backend `GET /api/v1/contactos` to support `?sinCliente=true` query param (AC: #1, #2, #5, #6)
  - [ ] Update `GetContactosQuery.cs` in `SiesaAgents.Application/Contactos/Queries/` — add `bool SinCliente` property (default `false`)
  - [ ] Update `GetContactosQueryHandler.cs` — when `SinCliente == true`, apply `WHERE cliente_id IS NULL` filter using EF Core: `.Where(c => c.ClienteId == null)`
  - [ ] Update `ContactoEndpoints.cs` in `SiesaAgents.API/Endpoints/` — bind `sinCliente` query param from request to `GetContactosQuery.SinCliente`
    - Endpoint signature: `GET /api/v1/contactos?sinCliente=true` → filter by `ClienteId IS NULL`
    - When `sinCliente` is absent or `false` → return all contacts (existing behavior unchanged)
  - [ ] No new migration required — `ClienteId` nullable column already exists from Story 3.1

- [ ] Task 2 — Extend `IContactoRepository` and `contactoApiRepository` to pass `sinCliente` param (AC: #1, #5, #6)
  - [ ] Update `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — change `getAll()` signature to `getAll(params?: { sinCliente?: boolean }): Promise<Contacto[]>`
  - [ ] Update `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — pass `params.sinCliente === true ? { sinCliente: true } : {}` as Axios query params to `GET /api/v1/contactos`

- [ ] Task 3 — Extend `useContactos` hook to accept and forward `sinCliente` filter (AC: #1, #5, #6)
  - [ ] Update `frontend/src/modules/crm/contactos/application/useContactos.ts`
    - Accept optional parameter: `sinCliente?: boolean`
    - Use `queryKey: ['contactos', { sinCliente: sinCliente ?? false }]` so filtered and unfiltered lists are cached separately
    - Pass `sinCliente` to `contactoApiRepository.getAll({ sinCliente })`
    - `staleTime: 0` (existing behavior)

- [ ] Task 4 — Add "Sin cliente" filter toggle and URL sync to `ContactoListView.tsx` (AC: #1, #2, #3, #4, #5, #6, #9)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
    - Read `sinCliente` search param from TanStack Router: `const { sinCliente } = Route.useSearch()` — value is `true | undefined`
    - Pass `sinCliente` to `useContactos(sinCliente)` hook
    - Render a "Sin cliente" toggle button/badge above the list (e.g., shadcn `Toggle` or `Badge` with `onClick`)
      - Active state: filled/highlighted style; inactive: outlined
      - Label: "Sin cliente" (Spanish, MANDATORY)
      - `data-testid="filtro-sin-cliente"`
      - On click: call `router.navigate({ search: (prev) => ({ ...prev, sinCliente: !sinCliente || undefined }) })` — removes param when deactivated (clean URL)
      - Keyboard-accessible: rendered as `<button>` or shadcn `Toggle` component (natively focusable, Enter/Space activatable)
    - When `sinCliente === true` and data is non-empty: render count badge `"{data.length} contacto(s) sin cliente"` above list with `data-testid="contador-sin-cliente"`
    - When `sinCliente === true` and data is empty: render `EmptyState` with message `"Todos los contactos tienen un cliente asignado"` instead of default empty message
    - Existing search (`q=`) input remains functional and operates on top of the filtered result set (both filters compose client-side)

- [ ] Task 5 — Register `sinCliente` as a validated TanStack Router search param on the `/contactos` route (AC: #5, #6)
  - [ ] Update `frontend/src/routes/_app/contactos.tsx`
    - Define `validateSearch` using Zod: `z.object({ sinCliente: z.boolean().optional() })`
    - Export `Route` with `createFileRoute('/contactos')({ validateSearch, component: ContactoListView })`
    - TanStack Router will parse `?sinCliente=true` → `boolean` automatically via Zod coercion

- [ ] Task 6 — Write tests (AC: #1–#9)
  - [ ] **Component test** `ContactoListView.sinCliente.test.tsx` (Vitest + RTL + MSW)
    - TC-1: When `sinCliente=true` is in search params, `useContactos` is called with `sinCliente: true` and only orphan contacts are rendered
    - TC-2: When `sinCliente=true` and data is empty, `EmptyState` shows "Todos los contactos tienen un cliente asignado"
    - TC-3: When `sinCliente=true` and contacts exist, count badge renders with `data-testid="contador-sin-cliente"`
    - TC-4: Clicking `data-testid="filtro-sin-cliente"` toggle when inactive navigates to `?sinCliente=true`
    - TC-5: Clicking `data-testid="filtro-sin-cliente"` toggle when active removes `sinCliente` param from URL
    - TC-6: While loading, skeleton placeholder renders (not spinner)
    - TC-7: On fetch error, `ErrorPanel` renders with "Reintentar" button
    - TC-8: Filter toggle renders as `<button>` (keyboard-accessible)
  - [ ] **Backend unit test** `GetContactosQueryHandlerTests.cs` (xUnit)
    - TC-1: When `SinCliente = true`, handler returns only contacts with `ClienteId = null`
    - TC-2: When `SinCliente = false` (default), handler returns all contacts
  - [ ] **E2E test** `e2e/tests/contactos/orphan-contacts-filter.spec.ts` (Playwright)
    - TC-1: Navigate to `/contactos`, activate "Sin cliente" filter, verify URL becomes `/contactos?sinCliente=true` and only orphan contacts are shown
    - TC-2: Navigate directly to `/contactos?sinCliente=true`, verify filter is pre-activated and list is filtered
    - TC-3: Deactivate filter, verify URL returns to `/contactos` and full list is shown

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. This story spans **Presentation + Application + Infrastructure** layers on the frontend and **Presentation (Endpoints) + Application (Query/Handler)** layers on the backend.
- **Backend filter:** The architecture explicitly defines `GET /api/v1/contactos?sinCliente=true` as the supported endpoint (architecture.md line 256). The `GetContactosQueryHandler` adds a `.Where(c => c.ClienteId == null)` filter when `SinCliente == true`. No new endpoint — extends existing.
- **Frontend filter strategy:** Architecture specifies client-side filtering via `useMemo` for search (NFR1 < 1s, ≤ 500 records). For the orphan filter, the backend returns only orphan contacts when `sinCliente=true` is passed — this is a server-side filter (not client-side) since orphan detection depends on `clienteId == null` already available in the API contract.
- **URL as source of truth:** Architecture mandates `selectedClienteId: string | null — sincronizado con URL param` and FR29 requires deep-linking. The `sinCliente` filter state goes in the URL (`?sinCliente=true`), managed via TanStack Router `validateSearch`.
- **TanStack Query key isolation:** `['contactos', { sinCliente: false }]` and `['contactos', { sinCliente: true }]` are separate cache entries — mutations that call `invalidateQueries({ queryKey: ['contactos'] })` (stories 4.1–4.2) will invalidate both (prefix match), so FR27 (changes immediately visible) is maintained.
- **MasterCrud applicability:** NOT applicable. This story adds a filter toggle to an existing list view, not a new standalone CRUD view.
- **No new database migration.** `client_id` nullable column in `contactos` table is already in place from Story 3.1.

### Project Structure Notes

Frontend files to modify:
```
frontend/src/modules/crm/contactos/
  domain/
    IContactoRepository.ts               ← Add optional params to getAll()
  application/
    useContactos.ts                      ← Accept sinCliente param, update queryKey
  infrastructure/
    contactoApiRepository.ts             ← Pass sinCliente to Axios params
  presentation/
    ContactoListView.tsx                 ← Add filter toggle + URL sync + count badge

frontend/src/routes/_app/
  contactos.tsx                          ← Add validateSearch with Zod for sinCliente
```

Backend files to modify:
```
SiesaAgents.Application/Contactos/Queries/
  GetContactosQuery.cs                   ← Add SinCliente property
  GetContactosQueryHandler.cs            ← Add WHERE clause when SinCliente == true

SiesaAgents.API/Endpoints/
  ContactoEndpoints.cs                   ← Bind sinCliente query param
```

No new files required. No database migration required.

### API Contract

Existing endpoint extended (no breaking change):

```
GET /api/v1/contactos               → Returns all contacts (unchanged)
GET /api/v1/contactos?sinCliente=true → Returns only contacts WHERE cliente_id IS NULL
```

Request: standard GET, no body.

Response (unchanged shape — only filtered):
```json
[
  { "id": "uuid", "nombre": "...", "cargo": "...", "telefono": "...", "email": "...", "clienteId": null, "createdAt": "..." }
]
```

### Backend Handler Pattern

```csharp
// GetContactosQuery.cs
public record GetContactosQuery(bool SinCliente = false) : IQuery<IEnumerable<ContactoDto>>;

// GetContactosQueryHandler.cs
public async Task<IEnumerable<ContactoDto>> Handle(GetContactosQuery query, CancellationToken ct)
{
    var q = _context.Contactos.AsNoTracking();
    if (query.SinCliente)
        q = q.Where(c => c.ClienteId == null);
    return await q.Select(c => new ContactoDto { ... }).ToListAsync(ct);
}

// ContactoEndpoints.cs — endpoint binding
app.MapGet("/api/v1/contactos", async (bool sinCliente = false, IQueryHandler<GetContactosQuery, ...> handler, CancellationToken ct) =>
    Results.Ok(await handler.Handle(new GetContactosQuery(sinCliente), ct)));
```

### Frontend Filter Pattern

```typescript
// useContactos.ts — extended
export function useContactos(sinCliente = false) {
  return useQuery({
    queryKey: ['contactos', { sinCliente }],
    queryFn: () => contactoApiRepository.getAll({ sinCliente }),
    staleTime: 0,
  })
}

// contactos.tsx route — validateSearch
import { z } from 'zod'
const contactosSearch = z.object({ sinCliente: z.boolean().optional() })
export const Route = createFileRoute('/contactos')({
  validateSearch: contactosSearch,
  component: ContactoListView,
})

// ContactoListView.tsx — toggle
const { sinCliente } = Route.useSearch()
const navigate = Route.useNavigate()

function toggleSinCliente() {
  void navigate({ search: (prev) => ({ ...prev, sinCliente: sinCliente ? undefined : true }) })
}
```

### TanStack Query Keys (Canonical)

```typescript
['contactos', { sinCliente: false }]    // All contacts (default)
['contactos', { sinCliente: true }]     // Orphan contacts only
['contactos', id]                       // Single contact (unchanged)
```

### User-Facing Spanish Text (Mandatory)

```
"Sin cliente"                                       ← filter toggle label
"X contacto(s) sin cliente"                         ← count badge when filter active
"Todos los contactos tienen un cliente asignado"    ← empty state when filter active and no orphans
"Reintentar"                                        ← retry button on error state
```

### Testing Notes

- MSW handlers needed:
  - `GET /api/v1/contactos` (no params) → return mixed contacts (some with `clienteId`, some null)
  - `GET /api/v1/contactos?sinCliente=true` → return only contacts with `clienteId: null`
- TanStack Router test setup: use `createMemoryHistory` with initial entries including `?sinCliente=true` to test pre-activated filter.
- For URL navigation assertions: assert `router.state.location.search` contains `sinCliente=true` after toggle click.
- Backend tests use EF Core InMemory provider with seed data: mix of contacts with and without `ClienteId`.

### Previous Story Context

- **Story 3.1** (`contact-list-search`): Implemented `ContactoListView.tsx`, `useContactos.ts`, `contactoApiRepository.ts`, `IContactoRepository.ts`, and route `_app/contactos.tsx`. This story modifies all of those files. The existing text search (by `nombre` / `email`) must remain functional.
- **Story 4.1** (`view-associated-contacts-in-client-detail`): Confirmed backend `GET /api/v1/contactos?clienteId=:id` exists. The `sinCliente=true` param is a different query param on the same endpoint — no conflict.
- **Story 4.2** (`associate-disassociate-contacts-from-client`): Mutations call `invalidateQueries({ queryKey: ['contactos'] })` — this prefix-invalidates both `['contactos', { sinCliente: false }]` and `['contactos', { sinCliente: true }]` automatically. No changes needed to Story 4.2 mutation code.

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision).
- `sinCliente` is a boolean query param — no injection risk. TanStack Router `validateSearch` with Zod coerces and validates it.
- Never expose raw error messages in the UI (NFR6) — use the existing `ErrorPanel` component.
- All user-facing text in Spanish (MANDATORY company standard).

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.5 AC and FR25, AC-E4.5
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — `GET /api/v1/contactos?sinCliente=true` endpoint, URL search param state, query keys
- Story 3.1 (ContactoListView foundation): `_bmad-output/implementation-artifacts/stories/story-3.1-contact-list-search.md`
- Story 4.1 (ContactManager + clienteId filter): `_bmad-output/implementation-artifacts/stories/story-4.1-view-associated-contacts-in-client-detail.md`
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, TanStack Router search params, Zod, react-loading-skeleton, WCAG 2.1 AA, Spanish UI text
