# Story 3.1: Contact List & Search

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see a list of all contacts and search them by name or email,
so that I can quickly find any contact regardless of their client association.

## Acceptance Criteria

1. **Given** there are contacts in the system, **When** the user navigates to `/contactos`, **Then** a list of all contacts is displayed, with each item showing Nombre, Cargo, and Email. (FR10, AC-E3.1)

2. **Given** the contact list is loaded, **When** the user types in the search field, **Then** the list filters in real time showing only contacts whose Nombre or Email contains the input as a substring (case-insensitive), and results appear in under 1 second with up to 1,000 records. (FR11, FR12, NFR1, AC-E3.2)

3. **Given** there are no contacts in the system, **When** the user navigates to `/contactos`, **Then** an `EmptyState` component is displayed with a Spanish message guiding the user to create the first contact. (AC-E3.1)

4. **Given** the backend is unavailable when the page loads, **When** the fetch for the contact list fails, **Then** an `ErrorPanel` component with a "Reintentar" button is displayed instead of the list, and clicking the button triggers a new fetch. (NFR6)

## Tasks / Subtasks

- [x] Task 1 — Create domain entity and repository contract for Contacto (AC: #1, #2)
  - [x] Create `frontend/src/modules/crm/contactos/domain/Contacto.ts` — TypeScript interface: `id: string`, `nombre: string`, `cargo: string`, `telefono: string`, `email: string`, `clienteId: string | null`, `createdAt: string` (ISO 8601)
  - [x] Create `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — interface with `getAll(): Promise<Contacto[]>` method

- [x] Task 2 — Create infrastructure layer: API repository (AC: #1, #4)
  - [x] Verify `frontend/src/shared/lib/apiClient.ts` — Axios singleton exists (created in Story 1.1/2.1)
  - [x] Create `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implements `IContactoRepository`, calls `GET /api/v1/contactos` via `apiClient`

- [x] Task 3 — Create application layer: TanStack Query hook (AC: #1, #2, #4)
  - [x] Create `frontend/src/modules/crm/contactos/application/useContactos.ts` — `useQuery({ queryKey: ['contactos'], queryFn: contactoApiRepository.getAll })` with `staleTime: 0`
  - [x] Expose `data`, `isLoading`, `isError`, `refetch` from the hook

- [x] Task 4 — Create Zod schema for contacto entity validation (AC: #2)
  - [x] Create `frontend/src/modules/crm/contactos/application/contactoSchema.ts` — Zod schema requiring `nombre`, `cargo`, `telefono`, `email` (all non-empty strings, `email` must be valid email format); export `ContactoFormData` type

- [x] Task 5 — Create presentation components: ContactoListView (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
    - Calls `useContactos()` hook
    - Shows loading skeleton (`react-loading-skeleton`) while `isLoading === true`
    - Shows `ErrorPanel` with "Reintentar" button wired to `refetch` when `isError === true`
    - Shows `EmptyState` when `data` is an empty array
    - Renders scrollable list of `ContactListItem` components when data has items
    - Search input (controlled) filters the TanStack Query cache client-side via `useMemo`; filter matches substring of `nombre` OR `email`, case-insensitive
  - [x] Create `frontend/src/modules/crm/contactos/presentation/ContactListItem.tsx` — renders a single contact row showing `nombre` (bold), `cargo`, and `email`
  - [x] Verify `frontend/src/shared/components/EmptyState.tsx` exists (created in Story 2.1); create if missing — accepts `message: string` prop; renders Spanish guidance text
  - [x] Verify `frontend/src/shared/components/ErrorPanel.tsx` exists (created in Story 2.1); create if missing — accepts `onRetry: () => void` prop; renders error message and "Reintentar" button

- [x] Task 6 — Wire route to ContactoListView (AC: #1)
  - [x] Create or update `frontend/src/routes/_app/contactos.tsx` — render `<ContactoListView />`

- [x] Task 7 — Backend: GET /api/v1/contactos endpoint (AC: #1, #4)
  - [x] Verify/create `ContactoEntity` in `SiesaAgents.Domain/Entities/ContactoEntity.cs` with properties: `Id` (Guid, UUID PK), `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (Guid? nullable FK → ClienteEntity), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
  - [x] Verify/create `ContactoConfiguration.cs` in `SiesaAgents.Infrastructure/Data/Configurations/` — EF Core config: table `contactos`, index `ix_contactos_email`, nullable FK `cliente_id`, `ON DELETE SET NULL`, snake_case via `ApplySnakeCaseNaming()`
  - [x] Verify/create `IContactoRepository.cs` in `SiesaAgents.Application/Contactos/Interfaces/`
  - [x] Create `GetContactosQuery.cs` + `GetContactosQueryHandler.cs` in `SiesaAgents.Application/Contactos/Queries/` — handler returns `IEnumerable<ContactoDto>` (direct array, no wrapper)
  - [x] Create `ContactoDto.cs` in `SiesaAgents.Application/Contactos/DTOs/` — fields: `Id` (Guid), `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (Guid?), `CreatedAt` (DateTimeOffset)
  - [x] Create/verify endpoint `GET /api/v1/contactos` in `SiesaAgents.API/Endpoints/ContactosEndpoints.cs` — returns `200 OK` with `IEnumerable<ContactoDto>` direct array; register endpoint group in `Program.cs`

- [x] Task 8 — Database migration for contactos table (AC: #1)
  - [x] Verify `contactos` migration exists from Story 1.3; if not, create EF Core migration: `dotnet ef migrations add AddContactosTable -p SiesaAgents.Infrastructure -s SiesaAgents.API`
  - [x] Apply migration: `dotnet ef database update -p SiesaAgents.Infrastructure -s SiesaAgents.API` (migration created; apply requires live DB)

- [x] Task 9 — Write tests (AC: #1–#4)
  - [x] **Unit test** `contactoSchema.test.ts`: 16/16 PASS — all required scenarios covered
  - [x] **Component test** `ContactoListView.test.tsx` with MSW: 17/17 PASS — all scenarios covered
  - [x] **API integration test** `ContactosEndpointsTests.cs` (xUnit + WebApplicationFactory): 3/3 PASS

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced on both frontend and backend. Dependency flows inward: Domain ← Application ← Infrastructure ← Presentation.
- **No direct API calls in components.** All data fetching goes through application-layer hooks (`useContactos.ts`).
- **Client-side filtering**: Load all contacts once with `queryKey: ['contactos']`. Filter via `useMemo` inside the component. No additional API call on search. This satisfies NFR1 (< 1s for 1,000 records).
- **Search is substring-based, case-insensitive**, applied to `nombre` OR `email`. Use `contact.nombre.toLowerCase().includes(q) || contact.email.toLowerCase().includes(q)` logic.
- **Loading state**: Use `react-loading-skeleton` skeleton screens (not spinners) — company standard.
- **Error state**: Never show `error.message` directly. Use `<ErrorPanel onRetry={refetch} />`.
- **No sort control in this story**: Story 3.1 scope is list + search only. Sorting is not in the epic AC for this story.
- **EmptyState and ErrorPanel**: These shared components were created in Story 2.1. Verify they exist at `frontend/src/shared/components/` before creating new ones.
- **`clienteId` field**: Must be nullable (`string | null`) in the TypeScript domain type, as contacts can exist without a client association (FR25 — orphan contacts).

### siesa-ui-kit Usage (MANDATORY)

Check the siesa-ui-kit catalog first before creating any UI component:
- Check for `EmptyState`, `ErrorPanel`, `ContactListItem` equivalents in siesa-ui-kit before creating custom components
- Install: `pnpm install siesa-ui-kit` (should already be present from Story 1.1/1.2)
- If no equivalent exists in siesa-ui-kit, fall back to shadcn/ui, then custom
- All user-facing text in Spanish: "Buscar por nombre o email...", "Sin contactos", "No se pudo cargar la lista de contactos. Intenta de nuevo.", "Reintentar"

### Project Structure Notes

Frontend files to create or modify:
```
frontend/src/modules/crm/contactos/
  domain/
    Contacto.ts                          ← New
    IContactoRepository.ts               ← New
  application/
    useContactos.ts                      ← New
    contactoSchema.ts                    ← New
  infrastructure/
    contactoApiRepository.ts             ← New
  presentation/
    ContactoListView.tsx                 ← New
    ContactListItem.tsx                  ← New
frontend/src/shared/components/
  EmptyState.tsx                         ← Verify exists (Story 2.1); create if missing
  ErrorPanel.tsx                         ← Verify exists (Story 2.1); create if missing
frontend/src/routes/_app/
  contactos.tsx                          ← Create or update (render <ContactoListView />)
```

Backend files to create or verify:
```
SiesaAgents.Domain/Entities/
  ContactoEntity.cs                      ← Verify/create
SiesaAgents.Infrastructure/Data/Configurations/
  ContactoConfiguration.cs              ← Verify/create
SiesaAgents.Application/Contactos/
  Interfaces/IContactoRepository.cs     ← New
  Queries/GetContactosQuery.cs          ← New
  Queries/GetContactosQueryHandler.cs   ← New
  DTOs/ContactoDto.cs                   ← New
SiesaAgents.API/Endpoints/
  ContactosEndpoints.cs                 ← New
```

### API Contract

```
GET /api/v1/contactos
  Response: 200 OK
  Body: ContactoDto[] (direct array, no wrapper)

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

**Critical**: `createdAt` MUST be `DateTimeOffset` in C# (never `DateTime`). The JSON output must include timezone information.

### TanStack Query Keys (Canonical)

```typescript
['contactos']                   // All contacts list — used by useContactos.ts
['contactos', { clienteId }]    // Contacts for a specific client — used in Epic 4
['contactos', id]               // Single contact — used by useContacto.ts (Story 3.2+)
```

All mutations in later stories (3.3, 3.4, 3.5) MUST call:
```typescript
queryClient.invalidateQueries({ queryKey: ['contactos'] })
```

### Database Constraints (PostgreSQL)

From architecture — `contactos` table:
```sql
id UUID PRIMARY KEY DEFAULT uuidv7()
nombre VARCHAR NOT NULL
cargo VARCHAR(100) NOT NULL
telefono VARCHAR(50) NOT NULL
email VARCHAR(255) NOT NULL
cliente_id UUID NULLABLE REFERENCES clientes(id) ON DELETE SET NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

INDEX ix_contactos_email ON contactos(email)
INDEX ix_contactos_cliente_id ON contactos(cliente_id)
```

EF Core uses `ApplySnakeCaseNaming()` in `OnModelCreating` — do NOT add manual `[Column]`/`[Table]` attributes.

### Filter Implementation Pattern

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx
import { useState, useMemo } from 'react'

const [searchQuery, setSearchQuery] = useState('')

const filteredContactos = useMemo(() => {
  if (!searchQuery.trim()) return data ?? []
  const q = searchQuery.toLowerCase()
  return (data ?? []).filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  )
}, [data, searchQuery])
```

### Performance Constraint (NFR1)

- Max dataset: 1,000 contacts loaded in a single fetch
- Filter must complete in < 150ms (comfortable margin under NFR1's 1s threshold)
- Use `useMemo(() => ..., [data, searchQuery])` to memoize the filtered result
- Do NOT trigger API call on each keystroke — all filtering is in-memory

### Parallel with Story 2.1

This story mirrors Story 2.1 (Client List & Search) for the contacts domain. Key differences:
- Search field filters by `nombre` OR `email` (not nombre/NIT as in clients)
- Display fields per list item: `nombre`, `cargo`, `email` (not nombre/NIT as in clients)
- Dataset scale: 1,000 contacts (vs. 500 clients)
- No sort control in this story (Story 3.1 scope is narrower than Story 2.1 which included SortControl baseline)
- Module path: `modules/crm/contactos/` (not `clientes/`)

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision)
- CORS: backend allows `localhost:5173` in development
- Never expose raw error messages in the UI — use `ErrorPanel` with generic "Reintentar" message
- All user-facing text in Spanish (MANDATORY company standard)
- Email field in domain type is a plain string; Zod validates format — no additional sanitization needed at this layer

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md` — Story 3.1 AC and FRs
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — Search Strategy, Data Architecture, API contract, TanStack Query keys, Frontend module structure
- Story 2.1 (parallel reference): `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — same pattern for client list; adapt for contactos domain
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, siesa-ui-kit, TanStack Query, DateTimeOffset, Spanish UI text
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-contactos.md` — FR9–FR16, FR25

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — no blockers encountered.

### Completion Notes List

- Zod v4 compatibility: The pre-written tests used Zod v3 API (`result.error.errors`). Zod v4 uses `result.error.issues`. Added a compatibility wrapper in `contactoSchema.ts` that attaches an `errors` getter aliasing `issues` on the ZodError object for backward compat.
- Backend integration tests: Fixed WebApplicationFactory to remove all DbContext/Npgsql descriptors before registering InMemory provider to avoid provider conflict. Same root cause existed in clientes tests.
- DB migration created but not applied (no live PostgreSQL in dev environment; will apply on deploy).
- `data-testid="contacto-row"` used for E2E POM + `data-testid="contacto-item-{id}"` on inner div for component tests — both coexist via nested divs.

### File List

Frontend (created/modified):
- `frontend/src/modules/crm/contactos/domain/Contacto.ts` (created)
- `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` (created)
- `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` (created)
- `frontend/src/modules/crm/contactos/application/useContactos.ts` (created)
- `frontend/src/modules/crm/contactos/application/contactoSchema.ts` (created)
- `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx` (created)
- `frontend/src/modules/crm/contactos/presentation/ContactListItem.tsx` (created)
- `frontend/src/routes/_app/contactos.tsx` (modified)

Backend (created/modified):
- `backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs` (created)
- `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs` (created)
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (modified — added Contactos DbSet)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` (created)
- `backend/src/SiesaAgents.Application/Contactos/Interfaces/IContactoRepository.cs` (created)
- `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs` (created)
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs` (created)
- `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs` (created)
- `backend/src/SiesaAgents.API/Endpoints/ContactosEndpoints.cs` (created)
- `backend/src/SiesaAgents.API/Program.cs` (modified — registered contactos services + endpoint)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260629161612_AddContactosTable.cs` (created)
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260629161612_AddContactosTable.Designer.cs` (created)
- `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosEndpointsTests.cs` (modified — enabled seeding, fixed factory)
