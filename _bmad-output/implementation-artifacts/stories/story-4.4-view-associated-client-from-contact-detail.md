# Story 4.4: View Associated Client from Contact Detail

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see which client a contact is associated with directly from the contact detail view,
so that I can understand the relationship without additional navigation.

## Acceptance Criteria

1. **Given** a contact is associated with a client, **When** the user views the contact detail at `/contactos/:contactoId`, **Then** the associated client's name is displayed in the contact detail view. (FR23, AC-E4.3)

2. **Given** the associated client name is displayed in the contact detail, **When** the user clicks on the client name link, **Then** the router navigates to `/clientes/:clienteId` showing the full client detail. (FR24, AC-E4.3)

3. **Given** the user clicks on the client name link from the contact detail, **When** navigation occurs, **Then** no more than 1 click is required to reach the client detail from the contact detail. (NFR9, AC-E4.3)

4. **Given** a contact has no associated client (`clienteId` is null), **When** the user views the contact detail, **Then** a message "Sin cliente asignado" is displayed in the client association section instead of a link. (FR23, AC-E4.3)

5. **Given** the contact detail is loading the client data, **When** the fetch is in progress, **Then** a skeleton placeholder is shown in the client association section (react-loading-skeleton). (company standard — skeleton screens, not spinners)

6. **Given** the backend is unavailable when loading the associated client's data, **When** the fetch fails, **Then** an error state with a retry option is shown in the client association section — never a raw error message. (NFR6)

7. **Given** the client name link is rendered, **When** the user views it, **Then** it is keyboard-accessible (focusable, activatable via Enter/Space) and meets WCAG 2.1 AA. (company standard)

## Tasks / Subtasks

- [x] Task 1 — Add `ClienteAsociadoSeccion` to `ContactoDetailView.tsx` to display the associated client (AC: #1, #4, #5, #6, #7)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
    - Import `Link` from `@tanstack/react-router`
    - Import `BuildingOfficeIcon` from `@heroicons/react/24/outline` (Heroicons — primary icon library)
    - Add a `ClienteAsociadoSeccion` section in the layout (below or alongside existing contact fields)
    - If `contacto.clienteId` is non-null: render a `<Link to="/clientes/$clienteId" params={{ clienteId: contacto.clienteId }}>` showing the client name
      - Client name is fetched via `useCliente(contacto.clienteId)` (queryKey: `['clientes', contacto.clienteId]`)
      - While loading: render skeleton placeholder using `react-loading-skeleton`
      - On error: render error state with retry button (call `refetch`)
      - Link label: client's `nombre` field, prefixed with `BuildingOfficeIcon`
      - Style: `cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 rounded`
      - `data-testid="cliente-asociado-link"`
    - If `contacto.clienteId` is null: render `<p data-testid="sin-cliente-message">Sin cliente asignado</p>` in muted text (`text-slate-500`)
    - All user-facing text in Spanish (MANDATORY)

- [x] Task 2 — Implement or reuse `useCliente(id)` hook in the contactos module (AC: #1, #5, #6)
  - [x] Check if `frontend/src/modules/crm/clientes/application/useCliente.ts` already exists (Story 2.2)
    - If it exists: import and reuse it directly in `ContactoDetailView.tsx`
    - If it does not exist: create `frontend/src/modules/crm/contactos/application/useClienteAsociado.ts`
      - `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id), enabled: !!id })`
      - Returns `{ cliente, isLoading, isError, refetch }`
  - [x] No new backend endpoint required — `GET /api/v1/clientes/{id}` already exists (Story 2.2)

- [x] Task 3 — Verify TanStack Router route for `/clientes/:clienteId` is registered (AC: #2)
  - [x] Confirm `frontend/src/routes/_app/clientes.$clienteId.tsx` exists (created in Story 2.2, confirmed in Story 4.3)
  - [x] No changes needed to this file

- [x] Task 4 — Write tests (AC: #1–#7)
  - [x] **Component test** `ContactoDetailView.clienteAsociado.test.tsx` (Vitest + RTL + MSW)
    - TC-1: When contact has `clienteId`, renders client name as a `<Link>` with `data-testid="cliente-asociado-link"` pointing to `/clientes/{clienteId}`
    - TC-2: When contact has `clienteId` is null, renders `data-testid="sin-cliente-message"` with text "Sin cliente asignado"
    - TC-3: Clicking the client name link navigates to `/clientes/{clienteId}` (assert link `href` or router.navigate call)
    - TC-4: While loading client data, skeleton placeholder renders (assert `react-loading-skeleton` presence or `data-testid="cliente-loading-skeleton"`)
    - TC-5: On fetch error, error state renders with retry button
    - TC-6: Client name link is keyboard-focusable (rendered as `<a>` or `<Link>` — not a `<div>`)
  - [x] **E2E test** `e2e/tests/contactos/view-client-from-contact.spec.ts` (Playwright)
    - TC-1: Navigate to contact detail, verify client name is visible and clicking it navigates to `/clientes/{clienteId}`
    - TC-2: Navigate to contact detail for orphan contact, verify "Sin cliente asignado" text

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. This story is a **Presentation + Application layer** concern — reading an already-existing relationship from cached data and rendering a navigable link.
- **No new API endpoints.** The contact's `clienteId` field is already returned by `GET /api/v1/contactos/{id}` as `ContactoDto.clienteId`. The client name is fetched via the existing `GET /api/v1/clientes/{id}` (Story 2.2). No new backend work required.
- **Hook reuse.** `useCliente(id)` is likely already implemented in `frontend/src/modules/crm/clientes/application/` from Story 2.2. Reuse it if present; create a local `useClienteAsociado` in the contactos module only if not importable.
- **TanStack Router typed navigation.** Use `<Link to="/clientes/$clienteId" params={{ clienteId: contacto.clienteId }}>` — type-safe. Route `_app/clientes.$clienteId.tsx` confirmed existing (Story 2.2).
- **MasterCrud applicability.** NOT applicable. This story displays a single association field within a contact detail view. MasterCrud is for standalone data grid/form CRUD views.
- **siesa-ui-kit.** `siesa-ui-kit@1.0.245` has no `ContactManager` (confirmed Story 4.1). No siesa-ui-kit component is needed for this story — standard TanStack Router `<Link>` suffices.
- **No mutations.** This story is read/display/navigate only. No `useMutation`, no data modification.
- **Skeleton screens.** Per company standard, use `react-loading-skeleton` (not spinners) for loading states. Already used elsewhere in the project.

### Project Structure Notes

Frontend files to modify:
```
frontend/src/modules/crm/contactos/
  presentation/
    ContactoDetailView.tsx              ← Add ClienteAsociadoSeccion
```

Frontend files to check/reuse (no change expected):
```
frontend/src/modules/crm/clientes/
  application/
    useCliente.ts                       ← Story 2.2 hook (reuse if exists)

frontend/src/routes/_app/
  clientes.$clienteId.tsx              ← Route from Story 2.2 (verify, no change)
  contactos.$contactoId.tsx            ← Route from Story 3.2 (no change)
```

Backend files to modify: **None.** All required endpoints already exist.

No database migration required.

### API Contract (No Changes)

All required endpoints exist from prior stories:

```
GET /api/v1/contactos/{id}    ← Story 3.2 — returns ContactoDto with clienteId field
GET /api/v1/clientes/{id}     ← Story 2.2 — returns ClienteDto with nombre field
```

Relevant DTOs:

```typescript
// ContactoDto — returned by GET /api/v1/contactos/{id}
ContactoDto {
  id: string           // UUID
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: string | null   // UUID — used to conditionally fetch/render client link
  createdAt: string    // DateTimeOffset ISO 8601
}

// ClienteDto — returned by GET /api/v1/clientes/{id}
ClienteDto {
  id: string           // UUID
  nombre: string       // Displayed as the navigable client link text
  nit: string
  telefono: string
  email: string
  createdAt: string    // DateTimeOffset ISO 8601
}
```

### TanStack Query Keys (Canonical)

```typescript
['contactos', contactoId]      // Single contact — already fetched by ContactoDetailView (Story 3.2)
['clientes', clienteId]        // Single client — fetched by useCliente(clienteId) when clienteId is non-null
```

### Rendering Pattern

```typescript
import { Link } from '@tanstack/react-router'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'
import Skeleton from 'react-loading-skeleton'

// In ContactoDetailView, after contact data is loaded:
function ClienteAsociadoSeccion({ clienteId }: { clienteId: string | null }) {
  const { data: cliente, isLoading, isError, refetch } = useCliente(clienteId ?? '')
  // hook should be enabled only when clienteId is non-null

  if (!clienteId) {
    return <p data-testid="sin-cliente-message" className="text-slate-500 text-sm">Sin cliente asignado</p>
  }

  if (isLoading) {
    return <Skeleton data-testid="cliente-loading-skeleton" width={200} height={20} />
  }

  if (isError) {
    return (
      <div>
        <span className="text-red-500 text-sm">Error al cargar cliente</span>
        <button onClick={() => void refetch()} className="ml-2 text-blue-600 text-sm underline">Reintentar</button>
      </div>
    )
  }

  return (
    <Link
      to="/clientes/$clienteId"
      params={{ clienteId }}
      data-testid="cliente-asociado-link"
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded cursor-pointer"
    >
      <BuildingOfficeIcon className="h-4 w-4" aria-hidden="true" />
      {cliente?.nombre}
    </Link>
  )
}
```

### User-Facing Spanish Text (Mandatory)

```
"Sin cliente asignado"     ← when contact has no associated client (clienteId is null)
"Error al cargar cliente"  ← when client fetch fails
"Reintentar"               ← retry button label
```

Section heading (if added as a label in the layout):
```
"Cliente asociado"         ← label for the client association section
```

### Testing Notes

- Use `MemoryRouter` from TanStack Router testing utilities or a mock router context to test navigation without a real browser.
- For link href assertions: `getByTestId('cliente-asociado-link').getAttribute('href')` must include `/clientes/{clienteId}`.
- MSW handlers needed:
  - `GET /api/v1/contactos/:id` — return contact with `clienteId` (non-null case) or `clienteId: null` (null case)
  - `GET /api/v1/clientes/:id` — return cliente with `nombre` field
- For skeleton test: assert `data-testid="cliente-loading-skeleton"` is rendered before MSW resolves. Use `msw` delayed response if needed.
- For WCAG: assert the client link renders as `<a>` tag (not `<div>` or `<span>`) so it is natively keyboard-focusable.

### Previous Story Context

- **Story 2.2** (`client-detail-view`): Implemented `ClienteDetailView` at `/clientes/:clienteId` and registered route `_app/clientes.$clienteId.tsx`. Also likely implemented `useCliente(id)` hook — check before creating a new one.
- **Story 3.2** (`contact-detail-view`): Implemented `ContactoDetailView` at `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` and registered route `_app/contactos.$contactoId.tsx`. This is the component to modify.
- **Story 4.3** (`navigate-from-client-detail-to-contact-detail`): Added back-navigation to `ContactoDetailView.tsx` — a "Volver al cliente" link when `contacto.clienteId` is non-null and "Volver a contactos" when null. Task 1 of this story must coexist with and not break that back-navigation. The `ClienteAsociadoSeccion` is a distinct display section (showing the client relationship for informational purposes), separate from the back-navigation affordance.
- **Story 4.2** (`associate-disassociate-contacts-from-client`): Confirmed `contactoApiRepository` has `assignCliente` method and `IContactoRepository` interface is established. The `contacto.clienteId` field is now always populated/unpopulated correctly by the backend.

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision).
- Navigation parameters (`clienteId`) are UUIDs validated by TanStack Router type-safe params — no injection risk.
- Never expose raw error messages or stack traces in the UI — use friendly Spanish error messages (NFR6).
- All user-facing text in Spanish (MANDATORY company standard).

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.4 AC and FRs (FR23, FR24, NFR9, AC-E4.3)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — route `/contactos/:id` maps to `ContactoDetailView` with "cliente link", query keys, `ClienteDto` shape
- Story 3.2 (ContactoDetailView foundation): `_bmad-output/implementation-artifacts/stories/story-3.2-contact-detail-view.md`
- Story 4.3 (back-navigation in ContactoDetailView): `_bmad-output/implementation-artifacts/stories/story-4.3-navigate-from-client-detail-to-contact-detail.md` — "Volver al cliente" back link already present; this story adds the informational client association display section
- Story 2.2 (ClienteDetailView + useCliente hook): `_bmad-output/implementation-artifacts/stories/story-2.2-client-detail-view.md`
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, TanStack Router, Heroicons, react-loading-skeleton, WCAG 2.1 AA, Spanish UI text, NO spinners
