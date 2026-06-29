# Story 3.2: Contact Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a contact by selecting them from the list,
so that I can review all their information at once.

## Acceptance Criteria

1. **Given** the contact list is displayed, **When** the user clicks on a contact item, **Then** the contact detail view shows: Nombre, Cargo, Teléfono, Email, and the URL updates to `/contactos/:contactoId`. (FR13, FR30, AC-E3.3)

2. **Given** the user accesses `/contactos/:contactoId` directly via URL (deep link), **When** the page loads, **Then** the correct contact details are displayed for that `contactoId`. (FR30)

3. **Given** a `contactoId` in the URL does not exist in the system, **When** the page loads, **Then** a not-found message ("Contacto no encontrado") is displayed gracefully without exposing technical details. (NFR6)

4. **Given** the backend is unavailable when the detail page loads, **When** the fetch for the contact fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the contact details, and clicking the button triggers a new fetch. (NFR6)

5. **Given** the detail page is loading data, **When** the fetch is in progress, **Then** a skeleton loading state (`react-loading-skeleton`) is shown for each field. (company standard)

6. **Given** the contact detail view is displayed, **When** the user clicks the "Editar" button, **Then** navigation to the edit view for that contact is initiated (Story 3.4 — scope deferred, button must be visible but can be a placeholder link). (FR14, AC-E3.3)

7. **Given** the contact detail view is displayed, **When** the user clicks the "Eliminar" button, **Then** navigation/action for deletion is initiated (Story 3.5 — scope deferred, button must be visible but can be a placeholder). (AC-E3.5)

## Tasks / Subtasks

- [ ] Task 1 — Create application-layer hook `useContacto(id)` for single contact fetch (AC: #1, #2, #3, #4, #5)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContacto.ts`
    - Uses `useQuery({ queryKey: ['contactos', id], queryFn: () => contactoApiRepository.getById(id), enabled: !!id })`
    - Expose `data`, `isLoading`, `isError`, `refetch` from the hook
    - Depends on `IContactoRepository` interface (already defined in Story 3.1)

- [ ] Task 2 — Extend infrastructure repository with `getById` method (AC: #1, #2, #3, #4)
  - [ ] Update `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts`
    - Add `getById(id: string): Promise<Contacto>` method that calls `GET /api/v1/contactos/:id` via `apiClient`
    - On 404 response, throw a typed error so the UI can display a not-found state
  - [ ] Update `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
    - Add `getById(id: string): Promise<Contacto>` method signature

- [ ] Task 3 — Create `ContactoDetailView` presentation component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
    - Accepts `contactoId: string` prop (received from route param)
    - Calls `useContacto(contactoId)` hook
    - Shows `react-loading-skeleton` skeleton for each field while `isLoading === true` (not spinners — company standard)
    - Shows `ErrorPanel` with "Reintentar" button wired to `refetch` when `isError === true`
    - Shows "Contacto no encontrado" message (Spanish) when the query returns 404 / null data
    - Renders all contact fields when data is available: Nombre, Cargo, Teléfono, Email (all labels in Spanish)
    - Includes "Editar" and "Eliminar" action buttons (visible, placeholder behavior for Stories 3.4/3.5)
    - Check siesa-ui-kit catalog for a `DetailPanel` or `InfoCard` equivalent before building custom layout
    - WCAG 2.1 AA compliance: use semantic HTML (`<dl>`/`<dt>`/`<dd>` or equivalent), appropriate ARIA labels
    - Tailwind styling with Siesa Blue (`#0e79fd`) for primary actions

- [ ] Task 4 — Wire TanStack Router route for `/contactos/:contactoId` (AC: #1, #2)
  - [ ] Create `frontend/src/routes/_app/contactos.$contactoId.tsx`
    - Use TanStack Router `$` prefix convention for dynamic segment: `contactoId`
    - Extract `contactoId` from route params via `useParams()` or loader
    - Render `<ContactoDetailView contactoId={contactoId} />`
  - [ ] Update `frontend/src/routes/_app/contactos.tsx` (existing list route)
    - Ensure `ContactListItem` navigates to `/contactos/${contact.id}` on click (via TanStack Router `<Link>`)

- [ ] Task 5 — Backend: GET /api/v1/contactos/{id} endpoint (AC: #1, #2, #3, #4)
  - [ ] Create `GetContactoByIdQuery.cs` + `GetContactoByIdQueryHandler.cs` in `backend/src/SiesaAgents.Application/Contactos/Queries/`
    - Query: `record GetContactoByIdQuery(Guid Id) : IRequest<ContactoDto?>`
    - Handler: calls `IContactoRepository.GetByIdAsync(query.Id)`, returns `ContactoDto` or `null` if not found
  - [ ] Update `backend/src/SiesaAgents.Application/Contactos/Interfaces/IContactoRepository.cs`
    - Add `Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)` method signature
  - [ ] Update `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`
    - Implement `GetByIdAsync(Guid id)` using EF Core `FindAsync` or `FirstOrDefaultAsync`
  - [ ] Update `backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs`
    - Add `GET /api/v1/contactos/{id}` endpoint
    - Returns `200 OK` + `ContactoDto` when found
    - Returns `404 Not Found` + Problem Details RFC 7807 when not found (never expose stack traces)
    - `{id}` parsed as `Guid` — return 400 Bad Request if not a valid UUID

- [ ] Task 6 — Write tests (AC: #1–#5)
  - [ ] **Unit test** `useContacto.test.ts` (Vitest + MSW):
    - TC-1: Returns contact data on successful fetch
    - TC-2: Returns isError = true when API responds 404
    - TC-3: Returns isLoading = true while fetch is pending
  - [ ] **Component test** `ContactoDetailView.test.tsx` (Vitest + RTL + MSW):
    - TC-1: Shows skeleton while loading
    - TC-2: Shows all contact fields (Nombre, Cargo, Teléfono, Email) when data is loaded
    - TC-3: Shows ErrorPanel with "Reintentar" button on fetch error
    - TC-4: Shows "Contacto no encontrado" on 404
    - TC-5: "Editar" and "Eliminar" buttons are rendered
    - TC-6: Accessibility check via axe — no critical violations
  - [ ] **API integration test** `ContactoByIdEndpointTests.cs` (xUnit + WebApplicationFactory):
    - TC-1: GET /api/v1/contactos/{id} returns 200 with correct contact data
    - TC-2: GET /api/v1/contactos/{unknownId} returns 404 Problem Details
    - TC-3: GET /api/v1/contactos/not-a-uuid returns 400

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced on both frontend and backend. Dependency flows inward: Domain ← Application ← Infrastructure ← Presentation.
- **No direct API calls in components.** All data fetching goes through the application-layer hook `useContacto.ts`.
- **TanStack Query key for single contact**: `['contactos', id]` — canonical key from architecture. This ensures the detail view benefits from cache population if the list was already fetched.
- **Loading state**: Use `react-loading-skeleton` skeleton screens (not spinners) — company standard.
- **Error state**: Never show `error.message` directly. Use `<ErrorPanel onRetry={refetch} />` for load failures.
- **Not-found state**: Distinct from fetch error. Check for 404 response specifically and show "Contacto no encontrado" in Spanish.
- **Route param**: TanStack Router uses `$` prefix for dynamic segments. File name: `contactos.$contactoId.tsx`. Access via `useParams()`.
- **MasterCrud applicability**: This story is a read-only detail view (no grid, no form CRUD). MasterCrud orchestrator is NOT applicable here. A simple `ContactoDetailView` component following the read-detail pattern is correct.
- **Editing and deletion buttons** (Stories 3.4/3.5): Render buttons visually, but final navigation/action behavior belongs to those stories. Link/onClick stub is acceptable to avoid test breakage.
- **`clienteId` field**: Present in the entity (Story 3.1) but intentionally NOT displayed in this story's detail view. Epic 4 (Association) handles the client link display.

### siesa-ui-kit Usage (MANDATORY)

Check the siesa-ui-kit catalog first before creating any UI component:
- Check for `DetailPanel`, `InfoCard`, `FieldRow`, or equivalent display components in siesa-ui-kit before building custom layouts
- Install: `pnpm install siesa-ui-kit` (should already be present from Stories 1.x/2.x/3.1)
- If no equivalent exists in siesa-ui-kit, fall back to shadcn/ui (Card, Separator), then custom
- All user-facing text in Spanish: "Nombre", "Cargo", "Teléfono", "Email", "Editar", "Eliminar", "Contacto no encontrado", "Reintentar", "No se pudo cargar el contacto. Intenta de nuevo."

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/contactos/
  domain/
    IContactoRepository.ts             ← Modify (add getById signature)
  application/
    useContacto.ts                     ← New
  infrastructure/
    contactoApiRepository.ts           ← Modify (add getById method)
  presentation/
    ContactoDetailView.tsx             ← New
frontend/src/routes/_app/
  contactos.$contactoId.tsx            ← New (dynamic route)
  contactos.tsx                        ← Modify (add Link navigation to detail)
```

Backend files to create or modify:
```
backend/src/SiesaAgents.Application/Contactos/
  Interfaces/IContactoRepository.cs   ← Modify (add GetByIdAsync)
  Queries/GetContactoByIdQuery.cs     ← New
  Queries/GetContactoByIdQueryHandler.cs ← New
backend/src/SiesaAgents.Infrastructure/Repositories/
  ContactoRepository.cs               ← Modify (implement GetByIdAsync)
backend/src/SiesaAgents.API/Endpoints/
  ContactosEndpoints.cs               ← Modify (add GET /{id} route)
```

### API Contract

```
GET /api/v1/contactos/{id}
  Path param: id — valid UUID (Guid)
  Response 200 OK:
    Body: ContactoDto (direct object)
  Response 404 Not Found:
    Body: Problem Details RFC 7807
  Response 400 Bad Request:
    Body: Problem Details RFC 7807 (invalid UUID format)

ContactoDto {
  id: Guid            // UUID
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: Guid?    // null if contact has no associated client
  createdAt: string   // DateTimeOffset ISO 8601 with TZ — e.g. "2026-06-29T10:00:00Z"
}
```

**Critical**: `createdAt` MUST be `DateTimeOffset` in C# (never `DateTime`). JSON output must include timezone information.

### TanStack Query Keys (Canonical)

```typescript
['contactos']                   // All contacts list — used by useContactos.ts (Story 3.1)
['contactos', id]               // Single contact — used by useContacto.ts (this story)
['contactos', { clienteId }]    // Contacts for a specific client — used in Epic 4
```

Mutations in Stories 3.3, 3.4, 3.5 MUST invalidate both `['contactos']` and `['contactos', id]`.

### TanStack Router Route File Naming

```
contactos.$contactoId.tsx   ← flat route (dot notation), $ prefix = dynamic param
```

Access params:
```typescript
import { useParams } from '@tanstack/react-router'
const { contactoId } = useParams({ from: '/_app/contactos/$contactoId' })
```

### Error Response Pattern (Backend)

```csharp
// 404 — not found
return Results.Problem(
  title: "Contacto no encontrado",
  detail: $"No existe un contacto con id '{id}'.",
  statusCode: StatusCodes.Status404NotFound
);

// 400 — invalid UUID (handled by route binding)
// .NET Minimal API automatically returns 400 if Guid binding fails
```

### Parallel with Story 2.2 (Client Detail View)

This story mirrors the client detail view pattern for the contacts domain. Key differences:
- Fields displayed: Nombre, Cargo, Teléfono, Email (contacts) vs. Nombre, NIT, Teléfono, Ciudad (clients)
- Route: `/contactos/:contactoId` (vs. `/clientes/:clienteId`)
- Module path: `modules/crm/contactos/` (not `clientes/`)
- `clienteId` is present in the entity but NOT shown in this view (Epic 4 scope)

### Database

No new migration required for this story. The `contactos` table already has all required fields (created in Story 3.1 / Story 1.3).

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- CORS: backend allows `localhost:5173` in development
- Never expose raw error messages or stack traces in the UI — use `ErrorPanel` and Problem Details
- All user-facing text in Spanish (MANDATORY company standard)
- `id` path parameter must be validated as a valid `Guid` to prevent injection

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.2 AC and FRs
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — Frontend routing, TanStack Query keys, API contract, Backend patterns
- Story 3.1 (same domain, list view): `_bmad-output/implementation-artifacts/stories/story-3.1-contact-list-search.md` — domain layer, infrastructure, shared components established here
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, siesa-ui-kit, TanStack Query, DateTimeOffset, Spanish UI text
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-contactos.md` — FR9–FR16, FR25
- MasterCrud reference: `_bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md` — Not applicable for read-only detail view

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
