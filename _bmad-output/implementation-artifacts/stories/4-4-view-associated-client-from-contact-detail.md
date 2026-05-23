# Story 4.4: View Associated Client from Contact Detail

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to see which client a contact is associated with directly from the contact detail view,
So that I can understand the relationship without additional navigation.

## Acceptance Criteria

1. **Given** a contact is associated with a client, **When** the user views the contact detail at `/contactos/:contactoId`, **Then** the associated client's name is displayed in the contact detail (FR23) **And** no additional search or navigation is required to see this information (NFR9).

2. **Given** the associated client name is displayed, **When** the user clicks on the client name link, **Then** the user is navigated to `/clientes/:clienteId` showing the full client detail in 1 click (FR24).

3. **Given** a contact has no associated client, **When** the user views the contact detail, **Then** a message "Sin cliente asignado" is displayed in place of the client name (FR23).

## Tasks / Subtasks

- [x] Task 1 — Backend: ensure `GET /api/v1/contactos/:id` response includes `clienteId` (AC: 1, 3)
  - [x] Verify `ContactoDto` in `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs` already contains `ClienteId: Guid?` — no change needed if present (established by Story 3.2)
  - [x] If `ClienteId` is missing from `ContactoDto`, add it: map from `entity.ClienteId` in `GetContactoByIdQueryHandler`
  - [x] Confirm API response JSON includes `"clienteId": "uuid-or-null"` field — verified in Story 3.2 `API-CT-08`

- [x] Task 2 — Backend: implement `GET /api/v1/clientes/:id` sub-query support for contact detail (AC: 1, 2)
  - [x] Verify `GET /api/v1/clientes/{id}` endpoint already exists and returns `ClienteDto` with at minimum `id` and `nombre` fields — no change needed if present (established by Story 2.2)
  - [x] Confirm endpoint returns 200 + `ClienteDto` or 404 Problem Details for non-existent id

- [x] Task 3 — Frontend: add `useClienteById` hook (AC: 1, 2)
  - [x] Verify `frontend/src/modules/crm/clientes/application/useCliente.ts` (or `useClienteById.ts`) already exists with `queryKey: ['clientes', id]` — no change needed if present (established by Story 2.2)
  - [x] If missing, create `frontend/src/modules/crm/clientes/application/useClienteById.ts`:
    - `useQuery({ queryKey: ['clientes', id], queryFn: () => clienteApiRepository.getById(id!), enabled: !!id, retry: false })`

- [x] Task 4 — Frontend: update `ContactoDetailPanel` to display associated client (AC: 1, 2, 3)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`
  - [x] Call `useClienteById(data?.clienteId ?? undefined)` inside the component when contact data is loaded
  - [x] Add a new labeled field section below existing fields (Nombre, Cargo, Teléfono, Email):
    - Label: "Cliente" (Spanish, `text-xs text-slate-500 uppercase tracking-wide`)
    - When `data.clienteId` is non-null and cliente data loaded: render `<Link>` (TanStack Router) pointing to `/clientes/$clienteId` with the cliente's `nombre` as text
    - When `data.clienteId` is non-null but cliente data is loading: render skeleton placeholder (1 row, `react-loading-skeleton`) — NOT spinner
    - When `data.clienteId` is null: render `<span data-testid="sin-cliente-asignado">Sin cliente asignado</span>`
  - [x] Apply `data-testid="clienteAsociadoLink"` on the `<Link>` element (matches ContactosPage POM locator from test-design-epic-4.md Section 7)
  - [x] Apply `data-testid="sin-cliente-asignado"` on the "Sin cliente asignado" span
  - [x] WCAG 2.1 AA: add `aria-label="Ir al cliente asociado"` on the `<Link>` element
  - [x] Skeleton loading state: 1 row skeleton while `useClienteById` is loading

- [x] Task 5 — Frontend: update `ContactosPage` POM with client link locator (AC: 1, 2, 3)
  - [x] Confirm `e2e/pages/contactos.page.ts` already has `clienteAsociadoLink` locator: `page.getByTestId('clienteAsociadoLink')` — add it if missing
  - [x] Confirm `sinClienteAsignado` locator: `page.getByTestId('sin-cliente-asignado')` — add it if missing

- [x] Task 6 — Write E2E tests (AC: 1, 2, 3)
  - [x] Add to `e2e/tests/asociacion/asociacion-navegacion.spec.ts` — Story 4.4 scope: E2E-AC-13, E2E-AC-14, E2E-AC-15
  - [x] E2E-AC-13: Create client + contact associated via `apiHelper.asignarClienteAContacto()`; navigate directly to `/contactos/:contactoId`; assert `clienteAsociadoLink` is visible and contains the client's `nombre`
  - [x] E2E-AC-14: From E2E-AC-13 setup, click `clienteAsociadoLink`; assert `page.url()` matches `/clientes/:clienteId`; assert client detail panel visible (data-testid="cliente-detail-panel" or equivalent)
  - [x] E2E-AC-15: Create orphan contact (no client) via `apiHelper`; navigate to `/contactos/:contactoId`; assert `sinClienteAsignado` text visible; assert `clienteAsociadoLink` not present
  - [x] All tests include `afterEach` cleanup via `apiHelper.deleteContacto` and `apiHelper.deleteCliente`
  - [x] All tests add `page.on('pageerror', ...)` listener to catch JS errors during navigation

## Dev Notes

### Architecture Context

Story 4.4 extends `ContactoDetailPanel` (built in Story 3.2) with a client association display. The `ContactoDetailPanel` already shows Nombre, Cargo, Teléfono, Email. This story adds a fifth section: "Cliente" — either a navigable link or the "Sin cliente asignado" fallback.

**Key integration point (from architecture.md):**

```
/contactos/:contactoId
  └── ContactoDetailPanel
        ├── useContactoById(contactoId)           → GET /api/v1/contactos/:id (returns clienteId)
        └── useClienteById(data?.clienteId)       → GET /api/v1/clientes/:id (returns nombre)
              └── <Link to="/clientes/$clienteId"> → navigate to client detail
```

**Data flow:**
1. `useContactoById(contactoId)` fetches the contact — response includes `clienteId: string | null`
2. When `clienteId` is non-null, `useClienteById(clienteId)` fetches the client's `nombre`
3. The client name renders as a TanStack Router `<Link>` pointing to `/clientes/$clienteId`
4. When `clienteId` is null, "Sin cliente asignado" renders immediately — no second fetch

**NFR9 compliance:** The client name is displayed inline within the contact detail panel. No modal, tooltip, or additional search is required — the information is present when the panel loads.

**1-click navigation (FR24):** The client name link navigates to `/clientes/:clienteId` with a single click — the URL is fully typed by TanStack Router's `<Link>` component.

**Depends on:**
- Story 3.2 — `ContactoDetailPanel`, `useContactoById`, `GET /api/v1/contactos/:id` (includes `clienteId` in response), `/contactos/$contactoId` route
- Story 2.2 — `useClienteById`, `GET /api/v1/clientes/:id`, `ClienteDetailView` at `/clientes/:clienteId`
- Story 4.3 — "Volver" back button already in `ContactoDetailPanel`; `data-testid="btn-volver"` in place

**Provides for:** Story 4.6 (Reassign Contact) will add a "Reasignar" action button in `ContactoDetailPanel` adjacent to the client display added in this story.

### Frontend File Locations

```
frontend/src/
  modules/crm/
    contactos/
      presentation/
        ContactoDetailPanel.tsx             # Updated: add "Cliente" section with link or "Sin cliente asignado"

e2e/
  pages/
    contactos.page.ts                       # Updated (if needed): add clienteAsociadoLink + sinClienteAsignado locators
  tests/
    asociacion/
      asociacion-navegacion.spec.ts         # Updated: add E2E-AC-13, E2E-AC-14, E2E-AC-15 (Story 4.4 scope)
```

### `ContactoDetailPanel` — Updated Component Pattern

```typescript
// frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Link } from '@tanstack/react-router'
import { useContactoById } from '../application/useContactoById'
import { useClienteById } from '../../clientes/application/useClienteById' // or useCliente
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'

interface Props { contactoId: string }

export function ContactoDetailPanel({ contactoId }: Props) {
  const { data, isLoading, isError, error, refetch } = useContactoById(contactoId)

  // Fetch associated client only when contacto has a clienteId
  const { data: cliente, isLoading: isClienteLoading } = useClienteById(data?.clienteId ?? undefined)

  // ... existing loading / error / not-found handling ...

  return (
    <div data-testid="contacto-detail-panel" aria-label="Detalle del contacto" className="p-4 flex flex-col gap-4">
      {/* existing fields: Nombre, Cargo, Teléfono, Email */}

      {/* Cliente section — NEW */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Cliente</span>
        {data.clienteId === null || data.clienteId === undefined ? (
          <span data-testid="sin-cliente-asignado" className="text-sm text-slate-400 italic">
            Sin cliente asignado
          </span>
        ) : isClienteLoading ? (
          <Skeleton width="50%" height={16} />
        ) : (
          <Link
            to="/clientes/$clienteId"
            params={{ clienteId: data.clienteId }}
            data-testid="clienteAsociadoLink"
            aria-label="Ir al cliente asociado"
            className="text-sm font-medium text-[#0e79fd] hover:underline"
          >
            {cliente?.nombre ?? data.clienteId}
          </Link>
        )}
      </div>
    </div>
  )
}
```

**Note on fallback:** When `useClienteById` succeeds but returns no data (edge case), render `data.clienteId` as the link text. This prevents a blank link while still providing navigability.

### TanStack Router Link Pattern

```typescript
// Use TanStack Router <Link> for type-safe navigation — do NOT use <a href>
import { Link } from '@tanstack/react-router'

<Link
  to="/clientes/$clienteId"
  params={{ clienteId: data.clienteId }}
  data-testid="clienteAsociadoLink"
  aria-label="Ir al cliente asociado"
>
  {cliente?.nombre}
</Link>
```

### `useClienteById` Hook (if not already present)

```typescript
// frontend/src/modules/crm/clientes/application/useClienteById.ts
import { useQuery } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'

export function useClienteById(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clienteApiRepository.getById(id!),
    enabled: !!id,
    retry: false,
  })
}
```

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/asociacion/asociacion-navegacion.spec.ts` (Story 4.4 scope):**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-AC-13 | P0 | AC1 | Contact detail shows associated client name when contact has a client (FR23, NFR9) |
| E2E-AC-14 | P0 | AC2 | Clicking client name link navigates to `/clientes/:clienteId` in 1 click (FR24) |
| E2E-AC-15 | P1 | AC3 | Contact detail shows "Sin cliente asignado" when contact has no associated client |

**Implementation notes (from test-design-epic-4.md Section 4.1):**

- **E2E-AC-13:** Create client + contact via `apiHelper`; associate via `apiHelper.asignarClienteAContacto(contactoId, clienteId)`; navigate directly to `/contactos/:contactoId` (no ContactManager path); assert `clienteAsociadoLink` is visible; assert its text content matches the client's `nombre`.
- **E2E-AC-14:** From E2E-AC-13 setup, click `clienteAsociadoLink` (1 click); assert `page.url()` matches `/clientes/:clienteId`; assert client detail is visible (data-testid="contact-manager" or equivalent client detail element).
- **E2E-AC-15:** Create contact with no client (`apiHelper.createContacto()` without clienteId); navigate to `/contactos/:contactoId`; assert `page.getByTestId('sin-cliente-asignado')` is visible with text `/sin cliente asignado/i`; assert `clienteAsociadoLink` is NOT present in DOM.

**Playwright projects applicable:**
- chromium (Desktop Chrome) — P0 primary
- firefox — P1 secondary coverage

### Key Anti-Patterns to Avoid

```
❌ <a href="/clientes/:id">                         → use TanStack Router <Link to="/clientes/$clienteId" params={...}>
❌ Spinner for cliente loading state                → react-loading-skeleton (1 skeleton row)
❌ English label "Client"                          → "Cliente" (Spanish mandatory per company standards)
❌ data-testid mismatch with POM locator           → must be "clienteAsociadoLink" (matches contactos.page.ts)
❌ Missing aria-label on Link                      → WCAG 2.1 AA: aria-label="Ir al cliente asociado"
❌ Fetching cliente unconditionally                → enabled: !!data?.clienteId (no fetch when clienteId is null)
❌ Exposing clienteId UUID as display text         → show cliente.nombre; fallback to clienteId only if nombre unavailable
❌ Hardcoding cliente nombre                       → always fetch from GET /api/v1/clientes/:id via useClienteById
❌ Missing data-testid="sin-cliente-asignado"      → required by E2E-AC-15 POM locator
❌ page.reload() in navigation assertions          → SPA navigation — no reload expected
❌ queryKey as string                              → use array: ['clientes', id]
```

## Dev Agent Record

### Files Modified / Created

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx` | Modified | Added "Cliente" section: useClienteById hook call, Link/skeleton/fallback rendering |
| `frontend/src/modules/crm/contactos/presentation/__tests__/ContactoDetailPanel.cliente.test.tsx` | Created | 6 unit tests covering AC1, AC2, AC3, skeleton state, hook call args |
| `e2e/pages/contactos.page.ts` | Modified | Updated clienteAsociadoLink testId to 'clienteAsociadoLink'; added sinClienteAsignado locator |
| `e2e/tests/asociacion/asociacion-navegacion.spec.ts` | Modified | Added Story 4.4 describe block with E2E-AC-13, E2E-AC-14, E2E-AC-15 |

### Completion Notes

- Tasks 1–3 required no code changes: `ContactoDto.ClienteId` (Guid?), `GET /api/v1/clientes/{id}`, and `useClienteById` were all already implemented by Stories 3.2, 2.2 respectively.
- Task 4: `ContactoDetailPanel` extended with a fifth labeled field "Cliente" using TanStack Router `<Link>`, `react-loading-skeleton` (no spinner), and "Sin cliente asignado" fallback. WCAG 2.1 AA `aria-label` applied.
- Task 5: POM updated — `clienteAsociadoLink` testId corrected from `'cliente-asociado-link'` to `'clienteAsociadoLink'`; `sinClienteAsignado` locator added.
- Task 6: E2E tests E2E-AC-13, E2E-AC-14, E2E-AC-15 appended to existing `asociacion-navegacion.spec.ts` under a new `Story 4.4` describe block with proper setup/teardown.
- 6/6 new unit tests pass; 4 pre-existing failures in queryClient staleTime tests are unrelated to this story.
- TypeScript: no type errors (`tsc --noEmit` clean).
- Branch: `develop-siesa-agents-gaduranb-rq4-asociacion-cliente-contacto` (existing epic branch).

## References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.4 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Frontend Architecture" (route `/contactos/:id` notes "Detalle contacto + cliente asociado"), "API & Communication Patterns" (`GET /api/v1/clientes/{id}`), TanStack Router file-based routing, query keys canonical
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-4.md` — E2E-AC-13, E2E-AC-14, E2E-AC-15, Risk R9 ("Sin cliente asignado" not rendered), NFR9 (no extra nav for contact's client)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md` — FR23 (client name in contact detail), FR24 (navigate from contact to client)
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack (TanStack Router 1+, React 18+ hooks, TypeScript strict), UX (Spanish UI text, WCAG 2.1 AA, react-loading-skeleton, Siesa Blue `#0e79fd` for links)
- Predecessor stories:
  - `_bmad-output/implementation-artifacts/stories/3-2-contact-detail-view.md` — `ContactoDetailPanel`, `useContactoById`, `/contactos/$contactoId` route, `data-testid` attributes on detail fields
  - `_bmad-output/implementation-artifacts/stories/2-2-client-detail-view.md` — `useClienteById` / `useCliente`, `GET /api/v1/clientes/:id`, `/clientes/$clienteId` route
  - `_bmad-output/implementation-artifacts/stories/4-3-navigate-from-client-detail-to-contact-detail.md` — "Volver" button in `ContactoDetailPanel`; confirms `ContactoDetailPanel` is the correct file to extend
