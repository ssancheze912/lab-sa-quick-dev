# Story 4.3: Navigate from Client Detail to Contact Detail

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to navigate from a contact listed in the client detail to that contact's full detail view,
so that I can access all contact information with no more than 2 clicks from the client.

## Acceptance Criteria

1. **Given** the user is in the client detail view (`/clientes/:clienteId`) and contacts are listed in the `ContactosSeccion`, **When** the user clicks on a contact item, **Then** the router navigates to `/contactos/:contactoId` showing the full contact detail. (FR22, AC-E4.2)

2. **Given** the user clicks a contact item in the contacts section, **When** navigation occurs, **Then** no more than 2 clicks from the client record are required to reach the contact detail. (NFR8, AC-E4.2)

3. **Given** the user is navigating from the client detail to a contact detail, **When** the `/contactos/:contactoId` route renders, **Then** the `ContactoDetailView` (already implemented in Story 3.2) renders with the full contact data. (FR22)

4. **Given** the user has navigated to a contact detail from the client detail, **When** the user clicks the browser back button, **Then** the router returns to `/clientes/:clienteId` and the `ContactosSeccion` re-renders with previously fetched contact data (no forced refetch needed unless cache is stale). (UX correctness, FR30)

5. **Given** the `ContactosSeccion` is rendered with contacts, **When** the user views each contact item, **Then** each item is rendered as a clickable link (or button with `onClick` that calls `router.navigate`) so it is keyboard-accessible and meets WCAG 2.1 AA. (company standard)

6. **Given** the contact item is a navigable link, **When** it renders, **Then** it displays at minimum the contact's `nombre` and `cargo` fields as visible text, consistent with the existing `ContactosSeccion` layout from Story 4.1/4.2. (UX consistency)

## Tasks / Subtasks

- [x] Task 1 — Add navigation link to each contact item in `ContactosSeccion` inside `ClienteDetailView.tsx` (AC: #1, #2, #5, #6)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
    - Import `Link` from `@tanstack/react-router` (or use `useNavigate` hook with `router.navigate`)
    - Wrap each contact item in `ContactosSeccion` with a `<Link to="/contactos/$contactoId" params={{ contactoId: contacto.id }}>` (TanStack Router typed link)
    - Preserve existing `data-testid="contactos-lista"` attribute on the list container
    - Each contact item must retain `data-testid="contacto-item-{contacto.id}"` or equivalent for test targeting
    - The link/button must be keyboard-focusable and have visible focus styles (WCAG 2.1 AA)
    - Style the item as a clickable row: add `cursor-pointer`, `hover:bg-slate-50 dark:hover:bg-slate-800` (TailwindCSS, Siesa design system)
    - Do NOT add a new API call — navigation uses the already-available `Contacto` data from `useContactosByCliente`

- [x] Task 2 — Verify TanStack Router route for `/contactos/:contactoId` is already registered (AC: #3)
  - [x] Confirm `frontend/src/routes/_app/contactos.$contactoId.tsx` exists (created in Story 3.2)
  - [x] If the file does not exist, create a minimal route file pointing to `ContactoDetailView` component
  - [x] No new backend endpoint needed — `GET /api/v1/contactos/{id}` already exists (Story 3.2)

- [x] Task 3 — Add "Volver al cliente" back-navigation affordance in `ContactoDetailView` (AC: #4)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
    - Use TanStack Router's `useRouterState` or check `history.state` to detect if the user arrived from a client detail
    - If `clienteId` is available from the contact's data (field `contacto.clienteId`), render a "Volver al cliente" link: `<Link to="/clientes/$clienteId" params={{ clienteId: contacto.clienteId }}>Volver al cliente</Link>`
    - If `clienteId` is null, render a generic "Volver a contactos" link: `<Link to="/contactos">Volver a contactos</Link>`
    - Use Heroicons `ArrowLeftIcon` as icon prefix for the back link (company standard: Heroicons primary)
    - All user-facing text in Spanish

- [x] Task 4 — Write tests (AC: #1–#6)
  - [x] **Component test** `ClienteDetailView.navigation.test.tsx` (Vitest + RTL + MSW)
    - TC-1: Clicking a contact item navigates to `/contactos/{contactoId}` (assert `router.navigate` or link `href` contains correct path)
    - TC-2: Contact items are rendered as links/buttons with correct `href` or `onClick`
    - TC-3: Contact item displays `nombre` and `cargo` text
    - TC-4: Keyboard Enter/Space on focused contact item triggers navigation (WCAG compliance)
  - [x] **Component test** `ContactoDetailView.backNavigation.test.tsx` (Vitest + RTL + MSW)
    - TC-1: "Volver al cliente" link renders with correct `/clientes/{clienteId}` href when contact has a clienteId
    - TC-2: "Volver a contactos" link renders when contact has no clienteId (clienteId is null)
    - TC-3: Back link contains `ArrowLeftIcon` aria label or text

## Dev Notes

### Architecture Patterns

- **Clean Architecture + DDD** enforced. This story is purely a **Presentation layer** concern — no new domain entities, no new application hooks, no new backend endpoints.
- **No new API calls.** Navigation uses the `Contacto[]` data already fetched and cached by `useContactosByCliente(clienteId)` (queryKey `['contactos', { clienteId }]`) from Story 4.1. The `contacto.id` field from the cached data is used directly as the navigation parameter.
- **TanStack Router typed navigation.** Use `<Link>` component or `router.navigate` with typed params. The route `/contactos/$contactoId` already exists (Story 3.2, file `_app/contactos.$contactoId.tsx`). Type-safe params: `{ contactoId: string }` (UUID).
- **Back navigation.** The contact's `clienteId` field (nullable `string | null`) is already returned by `GET /api/v1/contactos/{id}` as `ContactoDto.clienteId`. Use this field in `ContactoDetailView` to determine whether to show a "Volver al cliente" or "Volver a contactos" link. No new backend field needed.
- **siesa-ui-kit.** Story 4.1 confirmed `siesa-ui-kit@1.0.245` has no `ContactManager`. The `ContactosSeccion` custom component in `ClienteDetailView.tsx` is the established fallback. This story modifies that component to add clickable navigation to each item. Do NOT attempt to import `ContactManager` from siesa-ui-kit.
- **MasterCrud applicability.** NOT applicable. This story modifies an embedded contact panel within a detail view, not a standalone CRUD grid. MasterCrud is for standalone data grid/form views.
- **No optimistic updates or mutations.** This story is read/navigate only.

### siesa-ui-kit Usage

- `siesa-ui-kit@1.0.245` does NOT have a `ContactManager` component (confirmed Story 4.1). Do NOT import it.
- For the clickable contact items: use a plain HTML anchor via `<Link>` from TanStack Router — no siesa-ui-kit component required.
- For the back-navigation link: use a standard `<Link>` with Heroicons `ArrowLeftIcon` (Heroicons is the primary icon library per company standards).

### Project Structure Notes

Frontend files to modify:
```
frontend/src/modules/crm/clientes/
  presentation/
    ClienteDetailView.tsx              ← Add Link wrapper to each contact item in ContactosSeccion

frontend/src/modules/crm/contactos/
  presentation/
    ContactoDetailView.tsx             ← Add "Volver al cliente" / "Volver a contactos" back link
```

Frontend files to verify (no change expected):
```
frontend/src/routes/_app/
  contactos.$contactoId.tsx            ← Route file created in Story 3.2 (verify exists)
  clientes.$clienteId.tsx              ← Route file created in Story 2.2 (verify exists)
```

Backend files to modify: **None.** All required endpoints already exist.

No database migration required.

### API Contract (No Changes)

All required API endpoints were implemented in prior stories:

```
GET /api/v1/contactos?clienteId={uuid}    ← Story 4.1 — fetches contacts for ContactosSeccion
GET /api/v1/contactos/{id}               ← Story 3.2 — fetches single contact for ContactoDetailView
GET /api/v1/clientes/{id}                ← Story 2.2 — fetches single client for ClienteDetailView
```

The `ContactoDto` returned by both endpoints already includes the `clienteId` field:

```typescript
ContactoDto {
  id: string           // UUID — used as navigation parameter
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: string | null   // Used in ContactoDetailView to render correct back link
  createdAt: string    // DateTimeOffset ISO 8601
}
```

### TanStack Router Navigation Pattern

```typescript
// Option A — Link component (preferred for visible links)
import { Link } from '@tanstack/react-router'

// In ContactosSeccion, each contact item:
<Link
  to="/contactos/$contactoId"
  params={{ contactoId: contacto.id }}
  className="block cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md px-3 py-2 transition-colors"
>
  <span className="font-medium">{contacto.nombre}</span>
  <span className="text-sm text-slate-500 ml-2">{contacto.cargo}</span>
</Link>

// In ContactoDetailView, back-navigation link:
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

// When contact has a clienteId:
<Link to="/clientes/$clienteId" params={{ clienteId: contacto.clienteId }}>
  <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
  Volver al cliente
</Link>

// When contact has no clienteId (null):
<Link to="/contactos">
  <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
  Volver a contactos
</Link>
```

### TanStack Query Keys (No Changes)

```typescript
['contactos', { clienteId }]   // Used by ContactosSeccion — navigation data already here
['contactos', id]              // Used by ContactoDetailView — already fetches clienteId field
```

### User-Facing Spanish Text (Mandatory)

```
"Volver al cliente"       ← back link when contact has clienteId
"Volver a contactos"      ← back link when contact has no clienteId
```

The contact items in `ContactosSeccion` already display names in Spanish — no new labels required for the contact list items themselves.

### Testing Notes

- Use `MemoryRouter` from TanStack Router testing utilities or a mock router context to test navigation without a real browser environment.
- For `Link` href assertions: render component and assert `getByRole('link', { name: /contact-name/ }).getAttribute('href')` includes `/contactos/{contactoId}`.
- For keyboard navigation: `userEvent.keyboard('{Enter}')` after `userEvent.tab()` to focus the link.
- MSW is already set up in this project (Stories 4.1/4.2). Reuse existing MSW handlers for `GET /api/v1/contactos?clienteId=...` and `GET /api/v1/contactos/{id}`.

### Previous Story Context

- **Story 4.1** (`view-associated-contacts-in-client-detail`): Implemented `ContactosSeccion` inside `ClienteDetailView.tsx`. The contacts list with `data-testid="contactos-lista"` is the target for modification in Task 1. `useContactosByCliente` hook provides `Contacto[]` with `id` field used for navigation.
- **Story 4.2** (`associate-disassociate-contacts-from-client`): Added "Asociar contacto" and "Desasociar" buttons to `ContactosSeccion`. Task 1 must preserve these buttons and their layout when adding the navigation link to each item.
- **Story 3.2** (`contact-detail-view`): Implemented `ContactoDetailView` at `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` and registered route `_app/contactos.$contactoId.tsx`. Task 2 verifies this route exists; Task 3 modifies `ContactoDetailView` to add back-navigation.
- **Story 2.2** (`client-detail-view`): Registered route `_app/clientes.$clienteId.tsx` and implemented `ClienteDetailView.tsx`. The route exists for the back-navigation "Volver al cliente" link.

### Security Notes

- No authentication in MVP (explicit PRD/architecture decision).
- Navigation parameters (`contactoId`, `clienteId`) are UUIDs. TanStack Router validates route param types; no injection risk via URL params at the component level.
- Never expose raw error messages in the UI.
- All user-facing text in Spanish (MANDATORY company standard).

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.3 AC and FRs (FR22, NFR8, AC-E4.2)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — TanStack Router routing table (`/clientes/:id`, `/contactos/:id`), TanStack Query keys, navigation patterns
- Story 4.1 (ContactosSeccion foundation): `_bmad-output/implementation-artifacts/stories/story-4.1-view-associated-contacts-in-client-detail.md` — `ContactosSeccion` implementation, `useContactosByCliente` hook, `data-testid` attributes
- Story 4.2 (ContactosSeccion actions): `_bmad-output/implementation-artifacts/stories/story-4.2-associate-disassociate-contacts-from-client.md` — "Asociar" and "Desasociar" buttons in `ContactosSeccion`, must be preserved
- Story 3.2 (ContactoDetailView): `_bmad-output/implementation-artifacts/stories/story-3.2-contact-detail-view.md` — `ContactoDetailView` component, route file `_app/contactos.$contactoId.tsx`
- Story 2.2 (ClienteDetailView): route file `_app/clientes.$clienteId.tsx`
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Clean Architecture, TanStack Router, Heroicons, WCAG 2.1 AA, Spanish UI text
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md` — FR22 (navigate from client to contact), NFR8 (2-click navigation)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Task 1: Added `Link` import from `@tanstack/react-router` to `ClienteDetailView.tsx`. Each contact item in `ContactosSeccion` is now wrapped in a `<Link>` with `data-testid="contacto-item-{contacto.id}"`, keyboard-accessible, and styled with hover and focus-visible ring styles.
- Task 2: Confirmed `frontend/src/routes/_app/contactos.$contactoId.tsx` exists from Story 3.2. No changes needed.
- Task 3: Added back-navigation to `ContactoDetailView.tsx`. When `contacto.clienteId` is non-null, renders "Volver al cliente" link to `/clientes/$clienteId`. When null, renders "Volver a contactos" link to `/contactos`. Both use `ArrowLeftIcon` (Heroicons) with `aria-hidden="true"` and `data-testid="contacto-back-link"`.
- Task 4: ATDD tests (RED phase already generated) turned GREEN. Also added `Link` mock to all existing ContactoDetailView and ClienteDetailView test files that were rendering these components without router context — no new test logic was changed, only router mocking was added to prevent context errors.
- All 19 ATDD tests (9 navigation + 10 back-navigation) pass GREEN.
- No regressions introduced; 12 pre-existing failures remain (pre-existed before this story).

### File List

**Modified:**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.delete.test.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.delete.edge.test.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.edge.test.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.contactos.edgecases.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.contactos.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.edge.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edit.edge.test.tsx`

**Verified (no change needed):**
- `frontend/src/routes/_app/contactos.$contactoId.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`

**Already existed (ATDD RED phase):**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.navigation.test.tsx`
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.backNavigation.test.tsx`
- `e2e/tests/clientes/navigate-client-to-contact.spec.ts`
