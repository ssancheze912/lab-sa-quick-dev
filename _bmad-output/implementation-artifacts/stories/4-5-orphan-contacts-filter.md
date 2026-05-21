# Story 4.5: Orphan Contacts Filter

Status: ready

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to filter the contact list to show only contacts not associated with any client,
So that I can identify and manage unassigned contacts easily.

## Acceptance Criteria

1. **Given** the user is on `/contactos`, **When** the user activates the "Sin cliente" filter toggle, **Then** the list shows only contacts whose `clienteId` is null (FR25) **And** the count of orphan contacts is visible.

2. **Given** the "Sin cliente" filter is active, **When** all contacts have a client assigned, **Then** an `EmptyState` is displayed indicating all contacts are assigned (no orphan contacts).

3. **Given** the "Sin cliente" filter is active, **When** the user deactivates the filter, **Then** the full contact list is restored (all contacts visible regardless of `clienteId`).

## Tasks / Subtasks

- [ ] Task 1 — Backend: add `sinCliente` query param support to `GET /api/v1/contactos` (AC: 1, 2)
  - [ ] Add `GetOrphanContactosQuery.cs` in `backend/src/SiesaAgents.Application/Contactos/Queries/` — record with no parameters
  - [ ] Add `GetOrphanContactosQueryHandler.cs` — calls `IContactoRepository.GetOrphanAsync(ct)`, maps to `ContactoDto[]`
  - [ ] Add `GetOrphanAsync(CancellationToken ct): Task<IEnumerable<ContactoEntity>>` to `IContactoRepository` interface (`backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`)
  - [ ] Implement `GetOrphanAsync` in `ContactoRepository.cs` → `_context.Contactos.AsNoTracking().Where(c => c.ClienteId == null).OrderByDescending(c => c.CreatedAt).ToListAsync(ct)`
  - [ ] Update `GET /` endpoint in `ContactoEndpoints.cs` to accept optional `?sinCliente=true` query param — when `sinCliente=true`, dispatch `GetOrphanContactosQueryHandler`; existing `?clienteId=` and no-param branches unchanged
  - [ ] Register `GetOrphanContactosQueryHandler` in `Program.cs` DI

- [ ] Task 2 — Frontend: add `filterOrphanContactos` utility function (AC: 1, 2, 3)
  - [ ] Create `frontend/src/modules/crm/contactos/application/filterOrphanContactos.ts`
  - [ ] Signature: `filterOrphanContactos(contacts: Contacto[]): Contacto[]`
  - [ ] Returns contacts where `clienteId === null`
  - [ ] Returns empty array when input is empty — no error thrown

- [ ] Task 3 — Frontend: update `ContactoListView` to add "Sin cliente" filter toggle (AC: 1, 2, 3)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
  - [ ] Add boolean state: `const [sinClienteActive, setSinClienteActive] = useState(false)`
  - [ ] Add "Sin cliente" toggle button below the search input:
    - Label: "Sin cliente" (Spanish)
    - `data-testid="filtro-sin-cliente"` on the toggle element
    - Active visual state: Siesa Blue `#0e79fd` background with white text; inactive: `slate-100` background, `slate-700` text
    - `aria-pressed={sinClienteActive}` for WCAG 2.1 AA compliance
    - `aria-label="Filtrar contactos sin cliente"` on the button
  - [ ] Filter pipeline in `useMemo`:
    - When `sinClienteActive === false`: apply `filterContactos(data, searchQuery)` (existing behavior unchanged)
    - When `sinClienteActive === true`: apply `filterOrphanContactos(filterContactos(data, searchQuery))`
  - [ ] When `sinClienteActive === true`, display orphan count badge adjacent to the toggle:
    - Count text: `"{n} sin cliente"` where n = `filterOrphanContactos(data).length` (total orphan count regardless of searchQuery)
    - `data-testid="orphan-count"` on the count element
  - [ ] `EmptyState` when `filteredContactos.length === 0` and `sinClienteActive === true`: use `title="Todos los contactos tienen cliente"` and `description="No hay contactos sin cliente asignado."`
  - [ ] `EmptyState` when `filteredContactos.length === 0` and `sinClienteActive === false`: keep existing behavior (`title="No hay contactos registrados"`)

- [ ] Task 4 — Frontend: update `ContactosPage` POM with orphan filter locators (AC: 1, 2, 3)
  - [ ] Confirm or add in `e2e/pages/contactos.page.ts`:
    - `filtroSinCliente`: `page.getByTestId('filtro-sin-cliente')`
    - `orphanCount`: `page.getByTestId('orphan-count')`

- [ ] Task 5 — Frontend: write unit tests for `filterOrphanContactos` (AC: 1, 2)
  - [ ] Create `frontend/src/modules/crm/contactos/__tests__/filterOrphanContactos.test.ts`
  - [ ] UNIT-AC-04: `filterOrphanContactos(contacts)` returns only contacts where `clienteId === null`
  - [ ] UNIT-AC-05: `filterOrphanContactos([])` returns empty array without error

- [ ] Task 6 — Backend: write unit test for `GetOrphanContactosQueryHandler` (AC: 1, 2)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Handlers/GetOrphanContactosQueryHandlerTests.cs`
  - [ ] UNIT-B-AC-ORPHAN-01: Handler returns only contacts with `ClienteId == null` as `ContactoDto[]`
  - [ ] UNIT-B-AC-ORPHAN-02: Handler returns empty array when no orphan contacts exist

- [ ] Task 7 — Write E2E tests (AC: 1, 2, 3)
  - [ ] Create `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts` (Story 4.5 scope: E2E-AC-16, E2E-AC-17, E2E-AC-18, E2E-AC-19)
  - [ ] E2E-AC-16: Create 2 contacts with client + 2 orphan contacts via `apiHelper`; navigate to `/contactos`; assert `filtroSinCliente` locator visible; click it; assert `contactoRows.count()` equals 2; assert rows contain only the orphan contacts' nombres
  - [ ] E2E-AC-17: Same setup as E2E-AC-16; after filter activated, assert `orphanCount` text is visible and matches `/2 sin cliente/i`
  - [ ] E2E-AC-18: Create 2 contacts all with a client (no orphans); navigate to `/contactos`; activate filter; assert `EmptyState` visible with text `/todos los contactos tienen cliente/i`
  - [ ] E2E-AC-19: E2E-AC-16 setup; activate filter; click `filtroSinCliente` again to deactivate; assert all 4 contacts are visible again
  - [ ] All tests include `afterEach` cleanup via `apiHelper.deleteContacto` and `apiHelper.deleteCliente`
  - [ ] All tests add `page.on('pageerror', ...)` listener

- [ ] Task 8 — Write API integration test (AC: 1)
  - [ ] Add to `e2e/tests/asociacion/asociacion-api.spec.ts` — Story 4.5 scope: API-AC-06
  - [ ] API-AC-06: Create 3 contacts — 2 with clienteId, 1 without; `GET /api/v1/contactos?sinCliente=true`; assert response status 200; assert array length is 1; assert returned contact's `clienteId === null`

## Dev Notes

### Architecture Context

Story 4.5 adds an orphan filter to `ContactoListView` (built in Story 3.1). The filter operates client-side over the already-fetched `['contactos']` TanStack Query cache — no new query key is required. The backend endpoint `GET /api/v1/contactos?sinCliente=true` is added for API test verification (API-AC-06) and future direct API consumers; the frontend uses client-side filtering consistent with the project's search strategy (architecture.md: all records loaded on mount, filtering is in-memory).

**Key integration point (from architecture.md):**

```
ContactoListView
  ├── useContactos()                    → ['contactos'] → GET /api/v1/contactos (all contacts)
  ├── filterContactos(data, query)      → search filter (existing)
  └── filterOrphanContactos(filtered)   → sinCliente filter (NEW — composable, applied after search)
```

**Filter composition:** The orphan filter is applied after the search filter. This means when both `sinClienteActive` and `searchQuery` are active, only contacts matching the search AND having `clienteId === null` are shown.

**Count badge:** The orphan count reflects `filterOrphanContactos(data).length` — the total number of orphan contacts in the full (unfiltered) dataset. This ensures the count shown on the badge is always the global orphan count, not influenced by the active search query.

**Backend support:** `GET /api/v1/contactos?sinCliente=true` adds `GetOrphanContactosQueryHandler` alongside the existing `GetContactosQueryHandler` and `GetContactosByClienteIdQueryHandler`. The endpoint dispatches the correct handler based on which query params are present.

**Depends on:**
- Story 3.1 — `ContactoListView`, `useContactos`, `filterContactos`, `contactoApiRepository`, `Contacto` interface, `IContactoRepository`
- Story 3.1 — `EmptyState` and `ErrorPanel` shared components

**Provides for:** Story 4.6 (Reassign Contact) — after reassignment, the orphan filter remains consistent since `invalidateQueries({ queryKey: ['contactos'] })` auto-refreshes the list.

### Frontend File Locations

```
frontend/src/
  modules/crm/contactos/
    application/
      filterOrphanContactos.ts              # NEW: pure utility — filter contacts where clienteId === null
    presentation/
      ContactoListView.tsx                  # Updated: add sinCliente toggle + orphan count + EmptyState variant

e2e/
  pages/
    contactos.page.ts                       # Updated (if needed): add filtroSinCliente + orphanCount locators
  tests/
    asociacion/
      asociacion-filtro-huerfanos.spec.ts   # NEW: E2E-AC-16, E2E-AC-17, E2E-AC-18, E2E-AC-19
      asociacion-api.spec.ts                # Updated: add API-AC-06
```

### `filterOrphanContactos` Utility

```typescript
// frontend/src/modules/crm/contactos/application/filterOrphanContactos.ts
import { Contacto } from '../domain/Contacto'

export function filterOrphanContactos(contacts: Contacto[]): Contacto[] {
  return contacts.filter(c => c.clienteId === null)
}
```

### Updated `ContactoListView` Filter Pattern

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx
import { useState, useMemo } from 'react'
import { useContactos } from '../application/useContactos'
import { filterContactos } from '../application/filterContactos'
import { filterOrphanContactos } from '../application/filterOrphanContactos'

const [searchQuery, setSearchQuery] = useState('')
const [sinClienteActive, setSinClienteActive] = useState(false)
const { data = [], isLoading, isError, refetch } = useContactos()

const orphanCount = useMemo(() => filterOrphanContactos(data).length, [data])

const filteredContactos = useMemo(() => {
  const searched = filterContactos(data, searchQuery)
  return sinClienteActive ? filterOrphanContactos(searched) : searched
}, [data, searchQuery, sinClienteActive])
```

### "Sin cliente" Toggle Button Pattern

```tsx
<button
  type="button"
  data-testid="filtro-sin-cliente"
  aria-pressed={sinClienteActive}
  aria-label="Filtrar contactos sin cliente"
  onClick={() => setSinClienteActive(prev => !prev)}
  className={
    sinClienteActive
      ? 'px-3 py-1 rounded text-sm font-medium bg-[#0e79fd] text-white'
      : 'px-3 py-1 rounded text-sm font-medium bg-slate-100 text-slate-700'
  }
>
  Sin cliente
</button>

{sinClienteActive && (
  <span data-testid="orphan-count" className="text-xs text-slate-500">
    {orphanCount} sin cliente
  </span>
)}
```

### EmptyState Variants

```tsx
// When filter active and no orphan contacts found
{filteredContactos.length === 0 && sinClienteActive && (
  <EmptyState
    title="Todos los contactos tienen cliente"
    description="No hay contactos sin cliente asignado."
  />
)}

// When no filter active and no contacts at all (existing behavior)
{filteredContactos.length === 0 && !sinClienteActive && (
  <EmptyState
    title="No hay contactos registrados"
    description="Crea el primer contacto para comenzar."
  />
)}
```

### Backend: `GetOrphanContactosQueryHandler` Pattern

```csharp
// backend/src/SiesaAgents.Application/Contactos/Queries/GetOrphanContactosQuery.cs
namespace SiesaAgents.Application.Contactos.Queries;
public record GetOrphanContactosQuery();

// backend/src/SiesaAgents.Application/Contactos/Queries/GetOrphanContactosQueryHandler.cs
public class GetOrphanContactosQueryHandler
{
    private readonly IContactoRepository _repo;
    public GetOrphanContactosQueryHandler(IContactoRepository repo) => _repo = repo;

    public async Task<IEnumerable<ContactoDto>> HandleAsync(GetOrphanContactosQuery query, CancellationToken ct)
    {
        var contactos = await _repo.GetOrphanAsync(ct);
        return contactos.Select(c => new ContactoDto
        {
            Id = c.Id,
            Nombre = c.Nombre,
            Cargo = c.Cargo,
            Telefono = c.Telefono,
            Email = c.Email,
            ClienteId = c.ClienteId,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
        });
    }
}
```

### Backend: Updated `GET /api/v1/contactos` Endpoint

```csharp
// ContactoEndpoints.cs — GET / handler dispatching logic
group.MapGet("/", async (
    [FromQuery] Guid? clienteId,
    [FromQuery] bool? sinCliente,
    GetContactosQueryHandler allHandler,
    GetContactosByClienteIdQueryHandler byClienteHandler,
    GetOrphanContactosQueryHandler orphanHandler,
    CancellationToken ct) =>
{
    if (sinCliente == true)
    {
        var result = await orphanHandler.HandleAsync(new GetOrphanContactosQuery(), ct);
        return Results.Ok(result);
    }
    if (clienteId.HasValue)
    {
        var result = await byClienteHandler.HandleAsync(new GetContactosByClienteIdQuery(clienteId.Value), ct);
        return Results.Ok(result);
    }
    {
        var result = await allHandler.HandleAsync(new GetContactosQuery(), ct);
        return Results.Ok(result);
    }
})
.WithName("GetContactos")
.Produces<ContactoDto[]>(StatusCodes.Status200OK);
```

### Backend: `IContactoRepository` — new method

```csharp
// IContactoRepository.cs — add:
Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct);

// ContactoRepository.cs — implement:
public async Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct)
    => await _context.Contactos
        .AsNoTracking()
        .Where(c => c.ClienteId == null)
        .OrderByDescending(c => c.CreatedAt)
        .ToListAsync(ct);
```

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-AC-16 | P0 | AC1 | "Sin cliente" filter shows only contacts with `clienteId = null` |
| E2E-AC-17 | P0 | AC1 | Orphan contact count is visible when filter is active |
| E2E-AC-18 | P1 | AC2 | Empty state shown when all contacts have a client and filter is active |
| E2E-AC-19 | P1 | AC3 | Deactivating filter restores full contact list |

**API Integration Test — `e2e/tests/asociacion/asociacion-api.spec.ts` (Story 4.5 scope):**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| API-AC-06 | P0 | AC1 | `GET /api/v1/contactos?sinCliente=true` returns only orphan contacts (FR25) |

**Frontend Unit Tests (Vitest) — `frontend/src/modules/crm/contactos/__tests__/filterOrphanContactos.test.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| UNIT-AC-04 | P1 | AC1 | `filterOrphanContactos(contacts)` returns only contacts where `clienteId === null` |
| UNIT-AC-05 | P1 | AC1 | `filterOrphanContactos([])` returns empty array without error |

**Backend Unit Tests (xUnit) — `backend/tests/SiesaAgents.UnitTests/Handlers/GetOrphanContactosQueryHandlerTests.cs`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| UNIT-B-AC-ORPHAN-01 | P1 | AC1 | Handler returns `ContactoDto[]` where all have `ClienteId == null` |
| UNIT-B-AC-ORPHAN-02 | P1 | AC2 | Handler returns empty array when repository has no orphan contacts |

### Key Anti-Patterns to Avoid

```
❌ Fetching orphans from a separate API endpoint in frontend  → use client-side filterOrphanContactos() over ['contactos'] cache
❌ New TanStack Query key ['contactos', { sinCliente: true }] → no new key needed; filter is client-side
❌ orphanCount computed from filteredContactos               → must use filterOrphanContactos(data) on full unfiltered dataset
❌ Zustand store for sinClienteActive                        → local useState in ContactoListView is sufficient (not cross-route)
❌ English toggle label "No client"                          → "Sin cliente" (Spanish mandatory)
❌ Spinner for loading state                                 → react-loading-skeleton (skeleton screens)
❌ aria-pressed missing on toggle                            → WCAG 2.1 AA: aria-pressed={sinClienteActive}
❌ data-testid mismatch                                      → must be "filtro-sin-cliente" (matches contactos.page.ts POM)
❌ EmptyState same message for both empty states             → distinct messages per filter state
❌ sinCliente filter ignoring searchQuery                    → filter pipeline: filterContactos first, then filterOrphanContactos
```

## References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.5 AC (FR25)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Search Strategy" (client-side filter, in-memory, no `?search=` param), "API & Communication Patterns" (`GET /api/v1/contactos` with `?sinCliente=true`), TanStack Query canonical keys
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-4.md` — E2E-AC-16, E2E-AC-17, E2E-AC-18, E2E-AC-19, API-AC-06, UNIT-AC-04, UNIT-AC-05, Risk R7 ("orphan filter client-side correctness")
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md` — FR25 (orphan contacts filter)
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack (TanStack Query 5+, React 18+ hooks, TypeScript strict), UX (Spanish UI text, WCAG 2.1 AA, Siesa Blue `#0e79fd`)
- Predecessor stories:
  - `_bmad-output/implementation-artifacts/stories/3-1-contact-list-and-search.md` — `ContactoListView`, `useContactos`, `filterContactos`, `contactoApiRepository`, `Contacto` interface, `EmptyState`, `ErrorPanel`
  - `_bmad-output/implementation-artifacts/stories/4-1-view-associated-contacts-in-client-detail.md` — `IContactoRepository.GetByClienteIdAsync` pattern (reference for adding `GetOrphanAsync`)
