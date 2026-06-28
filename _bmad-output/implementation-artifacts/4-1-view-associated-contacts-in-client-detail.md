# Story 4.1: View Associated Contacts in Client Detail

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see all contacts associated with a client directly within the client detail view,
so that I have a complete picture of that client's contacts without navigating elsewhere.

## Acceptance Criteria

1. **Given** a client has associated contacts, **When** the user opens the client detail view at `/clientes/:clienteId`, **Then** the `ContactManager` (siesa-ui-kit) is rendered in the client detail panel showing all contacts linked to that client (FR21), **And** the `ContactManager` uses the `ClienteContactServiceAdapter` wired to `GET /api/v1/contactos?clienteId=:id`.

2. **Given** a client has no associated contacts, **When** the user opens the client detail view, **Then** the `ContactManager` displays an empty state indicating no contacts are linked yet.

3. **Given** the backend is unavailable when loading the client's contacts, **When** the fetch to `GET /api/v1/contactos?clienteId=:id` fails, **Then** the `ContactManager` displays an error state with a retry option.

## Tasks / Subtasks

- [ ] Task 1 — Backend: Add `clienteId` query filter to `GET /api/v1/contactos` endpoint (AC: #1, #2, #3)
  - [ ] Verify `GetContactosQueryHandler.cs` in `backend/src/SiesaAgents.Application/Contactos/Queries/` — add optional `Guid? ClienteId` filter param to `GetContactosQuery` record
  - [ ] Update `GetContactosQueryHandler.cs` — when `ClienteId` is not null, apply `.Where(c => c.ClienteId == query.ClienteId)` on the EF Core query before returning the list
  - [ ] Update `ContactoEndpoints.cs` in `backend/src/SiesaAgents.API/Endpoints/` — extend the existing `MapGet("/", ...)` handler to read optional `clienteId` query param (`Guid? clienteId = null`) and pass it to `GetContactosQuery`; no new endpoint needed
  - [ ] Verify `ContactoConfiguration.cs` has `ix_contactos_cliente_id` index configured — add if missing (EF Core: `.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id")`)
  - [ ] No new backend files required — all changes are additive modifications to existing handlers and endpoints

- [ ] Task 2 — Frontend: Application layer — `useContactosByCliente` hook (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContactosByCliente.ts` — TanStack Query hook:
    - `queryKey: ['contactos', { clienteId }]` — canonical key per architecture (`architecture.md#State Boundaries`)
    - `queryFn: () => contactoApiRepository.getByClienteId(clienteId!)` — calls `GET /api/v1/contactos?clienteId=${clienteId}`
    - `enabled: !!clienteId` — no fetch when clienteId is undefined
    - `staleTime: 0`
  - [ ] Extend `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — add `getByClienteId(clienteId: string): Promise<Contacto[]>`
  - [ ] Extend `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — add `getByClienteId(clienteId: string)` method: `GET /api/v1/contactos?clienteId=${clienteId}` via `apiClient`; returns `response.data` (array)

- [ ] Task 3 — Frontend: Infrastructure layer — `ClienteContactServiceAdapter` (AC: #1, #2, #3)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts`:
    - Implements the `IContactServiceAdapter` interface from `siesa-ui-kit`
    - Constructor accepts `clienteId: string` — instantiated per `ClienteDetailView` render
    - Wraps `contactoApiRepository.getByClienteId(clienteId)` to fulfill the siesa-ui-kit adapter contract
    - Adapter pattern: bridges the `ContactManager` component (siesa-ui-kit) to the REST API through the existing `contactoApiRepository`
    - No direct Axios calls — delegates to `contactoApiRepository` for network access
  - [ ] Verify the `IContactServiceAdapter` contract from `siesa-ui-kit` — import and inspect the interface before implementing (use TypeScript type checking to validate the implementation)

- [ ] Task 4 — Frontend: Presentation layer — integrate `ContactManager` into `ClienteDetailView` (AC: #1, #2, #3)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    - Import `ContactManager` from `siesa-ui-kit` and `ClienteContactServiceAdapter` from `./ClienteContactServiceAdapter`
    - After the read-only client fields section, render the `ContactManager` component:
      ```tsx
      const adapter = useMemo(
        () => new ClienteContactServiceAdapter(clienteId!),
        [clienteId]
      );
      <ContactManager adapter={adapter} />
      ```
    - Use `useMemo` to stabilize the adapter instance per `clienteId` — prevents unnecessary re-instantiation on every render
    - The `ContactManager` is rendered only when `clienteId` is defined and the client data has loaded (not in loading, error, or not-found states)
    - All siesa-ui-kit component labels and UI text must be in Spanish — verify `ContactManager` accepts a locale prop or default Spanish configuration
    - `data-testid="contact-manager-section"` on the wrapper `div`

- [ ] Task 5 — Tests (AC: #1, #2, #3)
  - [ ] **Backend API — P1**: `GET /api/v1/contactos?clienteId={uuid}` returns 200 + array of `ContactoDto` belonging to that client (xUnit + WebApplicationFactory) — seed 2 contactos with `ClienteId = X` and 1 with `ClienteId = Y`; assert response contains only the 2 for X
  - [ ] **Backend API — P1**: `GET /api/v1/contactos?clienteId={uuid}` returns 200 + empty array `[]` when no contacts are linked to that client (xUnit)
  - [ ] **Backend API — P2**: `GET /api/v1/contactos` without `clienteId` param still returns all contacts (backwards compatibility; xUnit)
  - [ ] **Frontend hook — P1**: `useContactosByCliente` with a valid `clienteId` calls `GET /api/v1/contactos?clienteId=...` and returns the contact list (Vitest + MSW)
  - [ ] **Frontend hook — P1**: `useContactosByCliente` with `clienteId = undefined` does NOT fire any HTTP request (Vitest + MSW, `enabled: !!clienteId`)
  - [ ] **Frontend component — P0**: `ClienteDetailView` with a valid `clienteId` renders `ContactManager` in the DOM (`data-testid="contact-manager-section"` present) (Vitest + RTL + MSW)
  - [ ] **Frontend component — P1**: `ContactManager` within `ClienteDetailView` receives the correct `ClienteContactServiceAdapter` instance constructed with the active `clienteId` (Vitest + RTL + MSW)
  - [ ] **Frontend component — P1**: When `GET /api/v1/contactos?clienteId=...` returns an empty array, `ContactManager` renders empty state (Vitest + RTL + MSW)
  - [ ] **Frontend component — P1**: When `GET /api/v1/contactos?clienteId=...` returns 500, `ContactManager` renders error state with retry option (Vitest + RTL + MSW)

## Dev Notes

### Architecture Context

Story 4.1 adds the first layer of Epic 4: rendering the `ContactManager` (siesa-ui-kit) inside `ClienteDetailView`. It is a **read-only view story** — no association/disassociation mutations are implemented here (those belong to Story 4.2).

**Component Boundary (from `architecture.md#Component Boundaries (Frontend)`):**

```
Route Layer (_app/clientes.$clienteId.tsx)
  └── ClienteDetailView [flex, panel derecho]
        └── [client fields section — read-only, from Story 2.2]
        └── ContactManager [siesa-ui-kit nativo] ← NEW in this story
              └── ClienteContactServiceAdapter [IContactServiceAdapter impl] ← NEW
                    └── contactoApiRepository.getByClienteId() [Axios]
                          └── GET /api/v1/contactos?clienteId=:id
```

**Scope boundary (CRITICAL):**
- This story covers **read-only display of associated contacts** only.
- No add/remove contact buttons are wired — the `ContactManager` is rendered in read-only/view mode.
- Association mutations (`PUT /api/v1/contactos/{id}/cliente`) are Story 4.2 scope.
- Navigation from contact items in the `ContactManager` to `/contactos/:contactoId` is Story 4.3 scope.

**MasterCrud note:** MasterCrud is NOT applicable. The established split-panel layout (`ClienteListView 280px` + `ClienteDetailView flex`) continues unchanged. MasterCrud is a full-page table/form orchestrator that conflicts with this design. [Source: `2-1-client-list-search.md#Dev Notes`, `2-2-client-detail-view.md#Dev Notes`]

**siesa-ui-kit is P0 mandatory** for `ContactManager`. Do not create a custom contacts-list component as a replacement.

### Backend: Extend GetContactosQuery with clienteId Filter

The existing `GET /api/v1/contactos` endpoint already serves Story 3.1. This story extends it with an optional `clienteId` query param — **no new endpoint is created**.

```csharp
// backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs
// ADD optional parameter:
public record GetContactosQuery(string? Search = null, Guid? ClienteId = null);

// GetContactosQueryHandler.cs — extend the query:
public async Task<List<ContactoDto>> Handle(GetContactosQuery query, CancellationToken ct)
{
    var q = _context.Contactos.AsQueryable();
    if (!string.IsNullOrWhiteSpace(query.Search))
        q = q.Where(c => c.Nombre.Contains(query.Search) || c.Email.Contains(query.Search));
    if (query.ClienteId.HasValue)
        q = q.Where(c => c.ClienteId == query.ClienteId.Value);
    var entities = await q.OrderBy(c => c.Nombre).ToListAsync(ct);
    return entities.Select(e => new ContactoDto(e.Id, e.Nombre, e.Cargo, e.Telefono, e.Email, e.ClienteId, e.CreatedAt, e.UpdatedAt)).ToList();
}
```

```csharp
// ContactoEndpoints.cs — extend the existing GET "/" handler:
group.MapGet("/", async (
    [AsParameters] string? search,
    [AsParameters] Guid? clienteId,
    GetContactosQueryHandler handler,
    CancellationToken ct) =>
{
    var dtos = await handler.Handle(new GetContactosQuery(search, clienteId), ct);
    return Results.Ok(dtos);
});
```

Response shape — success (200 OK):
```json
[
  { "id": "uuid", "nombre": "Ana García", "cargo": "Directora", "telefono": "3001234567", "email": "ana@example.com", "clienteId": "uuid-cliente", "createdAt": "...", "updatedAt": "..." }
]
```
Empty response (no contacts linked): `[]` — HTTP 200 with empty array (NOT 404).

### Frontend: useContactosByCliente Hook

```typescript
// frontend/src/modules/crm/contactos/application/useContactosByCliente.ts
import { useQuery } from '@tanstack/react-query';
import { contactoApiRepository } from '../infrastructure/contactoApiRepository';

export const useContactosByCliente = (clienteId: string | undefined) =>
  useQuery({
    queryKey: ['contactos', { clienteId }],
    queryFn: () => contactoApiRepository.getByClienteId(clienteId!),
    enabled: !!clienteId,
    staleTime: 0,
  });
```

**Query key alignment (CRITICAL):** Must be `['contactos', { clienteId }]` (object wrapper) — this is the canonical key per architecture for client-scoped contact queries. Matches the invalidation pattern in Story 4.2: `queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId }] })`.

### Frontend: contactoApiRepository Extension

```typescript
// ADD to frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts
getByClienteId: async (clienteId: string): Promise<Contacto[]> => {
  const response = await apiClient.get<Contacto[]>('/api/v1/contactos', {
    params: { clienteId },
  });
  return response.data;
},
```

### Frontend: ClienteContactServiceAdapter

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts
import type { IContactServiceAdapter } from 'siesa-ui-kit';
import { contactoApiRepository } from '../../contactos/infrastructure/contactoApiRepository';
import type { Contacto } from '../../contactos/domain/Contacto';

export class ClienteContactServiceAdapter implements IContactServiceAdapter {
  constructor(private readonly clienteId: string) {}

  async getContacts(): Promise<Contacto[]> {
    return contactoApiRepository.getByClienteId(this.clienteId);
  }

  // Additional methods required by IContactServiceAdapter (Story 4.2 will implement mutations):
  // async addContact(...), async removeContact(...) — stub with throw for now
}
```

**Note:** Verify the exact `IContactServiceAdapter` interface shape from `siesa-ui-kit` via TypeScript introspection before implementing. The interface contract may include additional methods beyond `getContacts`. Stub any mutation methods (add/remove) with `throw new Error('Not implemented — Story 4.2')` to satisfy the type system without premature logic.

### Frontend: ClienteDetailView — Integration Point

```tsx
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
import { useMemo } from 'react';
import { ContactManager } from 'siesa-ui-kit';
import { ClienteContactServiceAdapter } from './ClienteContactServiceAdapter';

// Inside ClienteDetailView, after the read-only client fields:
const adapter = useMemo(
  () => new ClienteContactServiceAdapter(clienteId!),
  [clienteId]
);

// In the return JSX (only when client data is loaded):
<div data-testid="contact-manager-section" className="mt-6">
  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
    Contactos asociados
  </h3>
  <ContactManager adapter={adapter} />
</div>
```

**useMemo is mandatory** — prevents re-instantiation of the adapter on every render, which would cause `ContactManager` to re-fetch unnecessarily.

### TanStack Query Key Alignment

Per `architecture.md#State Boundaries`:
```typescript
['contactos']                       // All contacts — Stories 3.1–3.5
['contactos', { clienteId }]        // Contacts for a specific client — THIS story + 4.2
['contactos', id]                   // Single contact — Story 3.2
```

The `{ clienteId }` object wrapper in the key is intentional — it scopes the cache entry to that specific client. Invalidating `['contactos', { clienteId }]` in Story 4.2 will only refetch the filtered list, not the full `['contactos']` list.

### Project Structure Notes

**Files to create:**
```
frontend/
└── src/
    ├── modules/crm/
    │   ├── contactos/
    │   │   ├── domain/IContactoRepository.ts                      ← MODIFY (add getByClienteId)
    │   │   ├── application/useContactosByCliente.ts               ← CREATE
    │   │   └── infrastructure/contactoApiRepository.ts            ← MODIFY (add getByClienteId)
    │   └── clientes/
    │       └── presentation/
    │           ├── ClienteContactServiceAdapter.ts                ← CREATE
    │           └── ClienteDetailView.tsx                          ← MODIFY (add ContactManager)

backend/
└── src/
    ├── SiesaAgents.Application/
    │   └── Contactos/
    │       └── Queries/
    │           ├── GetContactosQuery.cs                           ← MODIFY (add ClienteId param)
    │           └── GetContactosQueryHandler.cs                    ← MODIFY (add clienteId filter)
    └── SiesaAgents.API/
        └── Endpoints/
            └── ContactoEndpoints.cs                               ← MODIFY (add clienteId query param)

tests/
└── (Backend) GetContactosByClienteApiTests.cs                    ← CREATE (P1 + P2 API tests)
```

**Files NOT to modify (verify only):**
- `ContactoEndpoints.cs` existing `GET /` binding — extend, do not replace
- `ClienteDetailView.tsx` client data section — preserve existing fields (Nombre, NIT, Teléfono, Ciudad) and loading/error/not-found states from Story 2.2
- `contactoApiRepository.ts` export pattern — use the same singleton export as established in Epic 3

### Enforcement Checklist (Must Verify Before Marking Done)

- [ ] `GET /api/v1/contactos?clienteId={uuid}` returns `[]` (200 OK) when no contacts matched — NOT 404
- [ ] `GET /api/v1/contactos` without `clienteId` still returns all contacts (backwards compatibility)
- [ ] `useContactosByCliente` uses `enabled: !!clienteId` — no fetch when clienteId is undefined
- [ ] Query key is `['contactos', { clienteId }]` (object wrapper) — NOT `['contactos', clienteId]` (flat string)
- [ ] `ClienteContactServiceAdapter` is instantiated inside `useMemo([clienteId])` — prevents re-instantiation loop
- [ ] `ContactManager` from `siesa-ui-kit` is used — NOT a custom contacts list component
- [ ] `ContactManager` is rendered only when client data has loaded (not in loading/error/not-found states)
- [ ] All user-facing text in Spanish: section heading "Contactos asociados", empty state, error state labels
- [ ] No `any` type in TypeScript — strict mode enforced
- [ ] `DateTimeOffset` in backend `ContactoDto` — verified (established in Epic 3)
- [ ] `ix_contactos_cliente_id` index exists in `ContactoConfiguration.cs` — verify or add
- [ ] `ClienteContactServiceAdapter` mutation stubs (`addContact`, `removeContact`) throw `Error('Not implemented — Story 4.2')` rather than silently doing nothing

### References

- Epic source: [Source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md#Story 4.1`]
- Architecture — Component boundaries (ContactManager in ClienteDetailView): [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)`]
- Architecture — TanStack Query canonical keys (contactos + clienteId): [Source: `_bmad-output/planning-artifacts/architecture.md#State Boundaries`]
- Architecture — REST endpoint `GET /api/v1/contactos?clienteId=...`: [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Architecture — FR21 (ContactManager in client detail): [Source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md#Acceptance Criteria (QA Validation)`]
- Architecture — IContactServiceAdapter + ClienteContactServiceAdapter: [Source: `_bmad-output/planning-artifacts/architecture.md#Decision Priority Analysis`]
- Preceding story — ClienteDetailView (split-panel, useCliente, client fields): [Source: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md`]
- Preceding story — contactoApiRepository, IContactoRepository: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- Preceding story — GetContactosQueryHandler baseline: [Source: `_bmad-output/implementation-artifacts/3-1-contact-list-search.md`]
- MasterCrud reference (NOT applicable to this story): [Source: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md`]
- Company standards — siesa-ui-kit P0 mandatory: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Key Rules`]
- Company standards — TanStack Query + TypeScript strict: [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Frontend Stack`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
