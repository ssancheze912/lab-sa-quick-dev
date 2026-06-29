# Story 4.1: View Associated Contacts in Client Detail

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see all contacts associated with a client directly within the client detail view,
so that I have a complete picture of that client's contacts without navigating elsewhere.

## Acceptance Criteria

1. **Given** a client has associated contacts, **When** the user opens the client detail view (`/clientes/:clienteId`), **Then** the `ContactManager` component (siesa-ui-kit) is rendered in the right panel and displays all contacts linked to that client. (FR21, AC-E4.2)

2. **Given** the ContactManager is mounted, **When** it initialises, **Then** it calls `GET /api/v1/contactos?clienteId=:id` through the `ClienteContactServiceAdapter` wired to TanStack Query key `['contactos', { clienteId }]`. (FR21)

3. **Given** a client has no associated contacts, **When** the user opens the client detail view, **Then** the ContactManager renders an empty-state indicator with the message "Sin contactos asociados" (no contacts linked yet). (FR21)

4. **Given** the backend is unavailable when loading a client's contacts, **When** the fetch fails, **Then** the ContactManager (or its wrapping `ClienteDetailView`) displays an error state with a "Reintentar" button that triggers a new fetch. (NFR6)

5. **Given** the contact list for a client is being fetched, **When** the request is in flight, **Then** a skeleton loading state (`react-loading-skeleton`) is shown instead of the contact list (no spinners — company standard). (company standard)

6. **Given** the user is on `/clientes/:clienteId`, **When** the page loads, **Then** the URL does not change and deep-linking to that URL directly also renders the ContactManager with the correct data. (FR30)

## Tasks / Subtasks

- [ ] Task 1 — Implement `useContactosByCliente(clienteId)` application hook (AC: #1, #2, #4, #5)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContactosByCliente.ts`
    - Uses `useQuery({ queryKey: ['contactos', { clienteId }], queryFn: () => contactoApiRepository.getByClienteId(clienteId), enabled: !!clienteId })`
    - Exposes `data`, `isLoading`, `isError`, `refetch`
    - Depends on `IContactoRepository` (already defined in Story 3.1)

- [ ] Task 2 — Extend infrastructure repository with `getByClienteId` method (AC: #1, #2)
  - [ ] Update `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
    - Add `getByClienteId(clienteId: string): Promise<Contacto[]>` that calls `GET /api/v1/contactos?clienteId={clienteId}` via `apiClient`
  - [ ] Update `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
    - Add `getByClienteId(clienteId: string): Promise<Contacto[]>` method signature

- [ ] Task 3 — Implement `ClienteContactServiceAdapter` (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts`
    - Implements `IContactServiceAdapter` from siesa-ui-kit
    - Constructor receives `clienteId: string` and an Axios `apiClient` instance
    - `getContacts()` → calls `GET /api/v1/contactos?clienteId={clienteId}` and maps to the ContactManager's expected contact shape
    - All method implementations must use the Axios `apiClient` from `frontend/src/shared/lib/apiClient.ts`
    - Check siesa-ui-kit docs for the exact `IContactServiceAdapter` interface contract before writing the implementation

- [ ] Task 4 — Update `ClienteDetailView` to mount the ContactManager (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
    - Import `ContactManager` from `siesa-ui-kit` (verify import path from installed package)
    - Instantiate `ClienteContactServiceAdapter` with the active `clienteId` (via prop or route param)
    - Render `<ContactManager adapter={adapter} />` in the right panel alongside the existing client details
    - While the `ClienteContactServiceAdapter` is initialising, show `react-loading-skeleton` skeleton rows
    - On adapter error, display `<ErrorPanel onRetry={...} />` with "Reintentar" label
    - Empty state: pass appropriate prop or rely on ContactManager's built-in empty state — verify siesa-ui-kit ContactManager empty-state API
    - All user-facing labels in Spanish: "Contactos", "Sin contactos asociados", "Reintentar"

- [ ] Task 5 — Backend: add `clienteId` query-param filter on `GET /api/v1/contactos` (AC: #1, #2)
  - [ ] Update `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs`
    - Add optional `Guid? ClienteId` parameter to the query record
  - [ ] Update `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs`
    - When `ClienteId` is provided, add `WHERE cliente_id = @clienteId` filter to the EF Core query
    - Use `DynamicLinq` only if filter composition requires it at runtime; otherwise plain LINQ `.Where(c => c.ClienteId == query.ClienteId)` is sufficient
  - [ ] Update `backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs`
    - Accept optional `clienteId` query string: `GET /api/v1/contactos?clienteId={uuid}`
    - Pass the parsed `Guid?` value to `GetContactosQuery`
    - Return `200 OK` with array of `ContactoDto` (direct array — no wrapper)
    - Invalid UUID format for `clienteId` → return `400 Bad Request` Problem Details RFC 7807

- [ ] Task 6 — Write tests (AC: #1–#6)
  - [ ] **Unit test** `useContactosByCliente.test.ts` (Vitest + MSW):
    - TC-1: Returns contacts array when API responds 200
    - TC-2: Returns empty array when API responds 200 with []
    - TC-3: Returns `isError = true` when API responds 5xx
    - TC-4: `enabled: false` when `clienteId` is undefined/null — no fetch fired
  - [ ] **Component test** `ClienteDetailView.test.tsx` (Vitest + RTL + MSW):
    - TC-1: ContactManager is rendered when client has contacts (mock adapter returns data)
    - TC-2: Empty-state message "Sin contactos asociados" shown when adapter returns []
    - TC-3: Skeleton displayed while contacts are loading
    - TC-4: ErrorPanel with "Reintentar" shown on fetch error
    - TC-5: Accessibility check via axe — no critical violations
  - [ ] **API integration test** `ContactosByClienteIdTests.cs` (xUnit + WebApplicationFactory):
    - TC-1: `GET /api/v1/contactos?clienteId={existingId}` returns 200 with contacts belonging to that client only
    - TC-2: `GET /api/v1/contactos?clienteId={unknownId}` returns 200 with empty array
    - TC-3: `GET /api/v1/contactos?clienteId=not-a-uuid` returns 400 Problem Details

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced on both frontend and backend. Dependency flows inward: Domain ← Application ← Infrastructure ← Presentation.
- **No direct API calls in components.** Data flows through: `ContactManager` → `ClienteContactServiceAdapter` (implements `IContactServiceAdapter`) → `contactoApiRepository` → Axios `apiClient` → Backend REST API.
- **TanStack Query key for contacts by client**: `['contactos', { clienteId }]` — canonical key defined in architecture. Invalidation of this key (in Stories 4.2+) will automatically refresh the ContactManager.
- **Loading state**: Use `react-loading-skeleton` skeleton screens (not spinners) — mandatory company standard.
- **Error state**: Never show `error.message` directly. Use `<ErrorPanel onRetry={refetch} />` for load failures (company architecture pattern).
- **MasterCrud applicability**: This story renders a **read-only contact panel** inside a client detail view. MasterCrud is **NOT applicable** here — the correct pattern is `ContactManager` (siesa-ui-kit native component) wired via `ClienteContactServiceAdapter` as defined in the architecture. MasterCrud is intended for standalone CRUD grid views, not embedded panels.
- **ContactManager (siesa-ui-kit)**: The architecture mandates `siesa-ui-kit`'s `ContactManager` component as P0 for this view. Verify the exact import path and `IContactServiceAdapter` interface from the installed package before implementation.
- **`ClienteContactServiceAdapter`**: Project-specific class (not from siesa-ui-kit). It is the bridge between ContactManager's abstract `IContactServiceAdapter` interface and the project's Axios-based REST API. Instantiated per `ClienteDetailView` with the active `clienteId`. Located in `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts`.
- **Route**: `/clientes/:clienteId` is already registered as `_app/clientes.$clienteId.tsx` (Story 2.2). This story adds the ContactManager to the existing `ClienteDetailView` component — no new route file needed.

### siesa-ui-kit Usage (MANDATORY)

- `ContactManager` from `siesa-ui-kit` is the P0 component for this story. Check its API before implementing:
  - Confirm `IContactServiceAdapter` interface (methods required: at minimum `getContacts(clienteId)`)
  - Confirm the ContactManager's empty-state and error-state API (props vs. built-in)
  - Install: `pnpm install siesa-ui-kit` (should already be present from Stories 1.x/2.x/3.x)
- Do NOT build a custom contacts list component. If siesa-ui-kit's ContactManager is insufficient for this story, document the gap and fall back to a custom read-only list using shadcn/ui `Card` + `Separator`.
- All user-facing text in Spanish: "Contactos", "Sin contactos asociados", "Reintentar", "No se pudo cargar los contactos. Intenta de nuevo."

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/contactos/
  domain/
    IContactoRepository.ts              ← Modify (add getByClienteId signature)
  application/
    useContactosByCliente.ts            ← New
  infrastructure/
    contactoApiRepository.ts            ← Modify (add getByClienteId method)

frontend/src/modules/crm/clientes/
  presentation/
    ClienteContactServiceAdapter.ts     ← New (IContactServiceAdapter impl)
    ClienteDetailView.tsx               ← Modify (mount ContactManager)
```

Backend files to create or modify:
```
backend/src/SiesaAgents.Application/Contactos/
  Queries/GetContactosQuery.cs          ← Modify (add optional ClienteId param)
  Queries/GetContactosQueryHandler.cs   ← Modify (add WHERE filter)
backend/src/SiesaAgents.API/Endpoints/
  ContactosEndpoints.cs                 ← Modify (accept ?clienteId query param)
```

No database migration required. The `cliente_id` column already exists on the `contactos` table (created in Story 1.3 / 3.1). The `ix_contactos_cliente_id` index is already defined in the architecture for this query pattern.

### API Contract

```
GET /api/v1/contactos?clienteId={uuid}
  Query param: clienteId — optional valid UUID (Guid)
  Response 200 OK:
    Body: ContactoDto[] (direct array — no wrapper object)
  Response 400 Bad Request:
    Body: Problem Details RFC 7807 (invalid UUID format for clienteId)

ContactoDto {
  id: string           // UUID
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: string | null   // UUID or null
  createdAt: string    // DateTimeOffset ISO 8601 with TZ — e.g. "2026-06-29T10:00:00Z"
}
```

**Critical**: `createdAt` MUST be `DateTimeOffset` in C# (never `DateTime`). JSON output must include timezone information.

### TanStack Query Keys (Canonical)

```typescript
['contactos']                      // All contacts list — used by useContactos.ts (Story 3.1)
['contactos', { clienteId }]       // Contacts for a specific client — used by useContactosByCliente.ts (this story)
['contactos', id]                  // Single contact — used by useContacto.ts (Story 3.2)
```

Mutations in Stories 4.2 (associate/disassociate) MUST invalidate `['contactos']` and `['contactos', { clienteId }]`.

### Error Response Pattern (Backend)

```csharp
// 400 — invalid UUID for clienteId query param
return Results.Problem(
  title: "Parámetro inválido",
  detail: "El valor proporcionado para 'clienteId' no es un UUID válido.",
  statusCode: StatusCodes.Status400BadRequest
);
```

### Database

No new migration required. The `contactos` table already has:
- `cliente_id UUID NULL REFERENCES clientes(id) ON DELETE SET NULL`
- Index: `ix_contactos_cliente_id`

The EF Core query `WHERE cliente_id = @clienteId` will use the existing index (architecture guarantee).

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision).
- CORS: backend allows `localhost:5173` in development.
- Never expose raw error messages or stack traces in the UI — use `ErrorPanel` and Problem Details.
- All user-facing text in Spanish (MANDATORY company standard).
- `clienteId` query param MUST be validated as a valid `Guid` to prevent injection attacks.

### Previous Story Context (Story 3.2 — Contact Detail View)

- `IContactoRepository` interface is already defined in `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`.
- `contactoApiRepository.ts` infrastructure implementation is established.
- `useContacto(id)` hook already exists — `useContactosByCliente(clienteId)` follows the same pattern with a list query.
- The `Contacto` domain entity type is already defined and includes `clienteId?: string | null`.

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.1 AC and FRs (FR21, AC-E4.2)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — ContactManager / IContactServiceAdapter pattern, TanStack Query keys, API contract, component boundaries diagram
- Story 3.2 (same domain, contact detail): `_bmad-output/implementation-artifacts/stories/story-3.2-contact-detail-view.md` — IContactoRepository interface, infrastructure layer, useContacto hook pattern
- Story 2.2 (client detail route already registered): existing `_app/clientes.$clienteId.tsx` and `ClienteDetailView.tsx`
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, siesa-ui-kit (P0), TanStack Query, DateTimeOffset, Spanish UI text
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md` — FR17–FR24
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — NOT applicable (ContactManager pattern used instead)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
