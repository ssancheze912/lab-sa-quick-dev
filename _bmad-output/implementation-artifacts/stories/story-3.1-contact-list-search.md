# Story 3.1: Contact List & Search

Status: ready-for-dev

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

- [ ] Task 1 — Create domain entity and repository contract for Contacto (AC: #1, #2)
  - [ ] Create `frontend/src/modules/crm/contactos/domain/Contacto.ts` — TypeScript interface: `id: string`, `nombre: string`, `cargo: string`, `telefono: string`, `email: string`, `clienteId: string | null`, `createdAt: string` (ISO 8601)
  - [ ] Create `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts` — interface with `getAll(): Promise<Contacto[]>` method

- [ ] Task 2 — Create infrastructure layer: API repository (AC: #1, #4)
  - [ ] Verify `frontend/src/shared/lib/apiClient.ts` — Axios singleton exists (created in Story 1.1/2.1)
  - [ ] Create `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — implements `IContactoRepository`, calls `GET /api/v1/contactos` via `apiClient`

- [ ] Task 3 — Create application layer: TanStack Query hook (AC: #1, #2, #4)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useContactos.ts` — `useQuery({ queryKey: ['contactos'], queryFn: contactoApiRepository.getAll })` with `staleTime: 0`
  - [ ] Expose `data`, `isLoading`, `isError`, `refetch` from the hook

- [ ] Task 4 — Create Zod schema for contacto entity validation (AC: #2)
  - [ ] Create `frontend/src/modules/crm/contactos/application/contactoSchema.ts` — Zod schema requiring `nombre`, `cargo`, `telefono`, `email` (all non-empty strings, `email` must be valid email format); export `ContactoFormData` type

- [ ] Task 5 — Create presentation components: ContactoListView (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
    - Calls `useContactos()` hook
    - Shows loading skeleton (`react-loading-skeleton`) while `isLoading === true`
    - Shows `ErrorPanel` with "Reintentar" button wired to `refetch` when `isError === true`
    - Shows `EmptyState` when `data` is an empty array
    - Renders scrollable list of `ContactListItem` components when data has items
    - Search input (controlled) filters the TanStack Query cache client-side via `useMemo`; filter matches substring of `nombre` OR `email`, case-insensitive
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactListItem.tsx` — renders a single contact row showing `nombre` (bold), `cargo`, and `email`
  - [ ] Verify `frontend/src/shared/components/EmptyState.tsx` exists (created in Story 2.1); create if missing — accepts `message: string` prop; renders Spanish guidance text
  - [ ] Verify `frontend/src/shared/components/ErrorPanel.tsx` exists (created in Story 2.1); create if missing — accepts `onRetry: () => void` prop; renders error message and "Reintentar" button

- [ ] Task 6 — Wire route to ContactoListView (AC: #1)
  - [ ] Create or update `frontend/src/routes/_app/contactos.tsx` — render `<ContactoListView />`

- [ ] Task 7 — Backend: GET /api/v1/contactos endpoint (AC: #1, #4)
  - [ ] Verify/create `ContactoEntity` in `SiesaAgents.Domain/Entities/ContactoEntity.cs` with properties: `Id` (Guid, UUID PK), `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (Guid? nullable FK → ClienteEntity), `CreatedAt` (DateTimeOffset), `UpdatedAt` (DateTimeOffset)
  - [ ] Verify/create `ContactoConfiguration.cs` in `SiesaAgents.Infrastructure/Data/Configurations/` — EF Core config: table `contactos`, index `ix_contactos_email`, nullable FK `cliente_id`, `ON DELETE SET NULL`, snake_case via `ApplySnakeCaseNaming()`
  - [ ] Verify/create `IContactoRepository.cs` in `SiesaAgents.Application/Contactos/Interfaces/`
  - [ ] Create `GetContactosQuery.cs` + `GetContactosQueryHandler.cs` in `SiesaAgents.Application/Contactos/Queries/` — handler returns `IEnumerable<ContactoDto>` (direct array, no wrapper)
  - [ ] Create `ContactoDto.cs` in `SiesaAgents.Application/Contactos/DTOs/` — fields: `Id` (Guid), `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (Guid?), `CreatedAt` (DateTimeOffset)
  - [ ] Create/verify endpoint `GET /api/v1/contactos` in `SiesaAgents.API/Endpoints/ContactosEndpoints.cs` — returns `200 OK` with `IEnumerable<ContactoDto>` direct array; register endpoint group in `Program.cs`

- [ ] Task 8 — Database migration for contactos table (AC: #1)
  - [ ] Verify `contactos` migration exists from Story 1.3; if not, create EF Core migration: `dotnet ef migrations add AddContactosTable -p SiesaAgents.Infrastructure -s SiesaAgents.API`
  - [ ] Apply migration: `dotnet ef database update -p SiesaAgents.Infrastructure -s SiesaAgents.API`

- [ ] Task 9 — Write tests (AC: #1–#4)
  - [ ] **Unit test** `contactoSchema.test.ts`: `safeParse({})` returns `{ success: false }` with errors on `nombre`, `cargo`, `telefono`, `email`; full valid object returns `{ success: true }`; invalid email format returns `{ success: false }` with error on `email`
  - [ ] **Component test** `ContactoListView.test.tsx` with MSW:
    - TC-E3-P0-01: MSW returns 3 contacts → all 3 rendered with Nombre, Cargo, and Email visible; loading skeleton shown before response
    - TC-E3-P0-02: MSW returns `[]` → `EmptyState` rendered, zero list items
    - TC-E3-P0-03: MSW returns 500 → `ErrorPanel` with "Reintentar" shown; click retries fetch
    - TC-E3-P1-01: Type "Ana" → only contacts with Nombre containing "Ana" visible; no additional GET called
    - TC-E3-P1-02: Type partial email "@siesa" → only email-matching contacts visible; no additional GET called
    - TC-E3-P1-03 (performance): Seed 1,000 contacts, filter, assert elapsed < 150ms
  - [ ] **API integration test** `ContactosEndpointsTests.cs` (xUnit + WebApplicationFactory):
    - TC-E3-P1-04: Seed 2 contacts, GET `/api/v1/contactos` → 200, JSON array, each item has `id` (UUID), `nombre`, `cargo`, `telefono`, `email`, `clienteId` (null or UUID), `createdAt` (ISO 8601 + TZ)

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

### Completion Notes List

### File List
