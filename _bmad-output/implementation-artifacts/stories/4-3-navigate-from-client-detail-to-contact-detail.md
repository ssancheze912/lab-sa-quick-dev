# Story 4.3: Navigate from Client Detail to Contact Detail

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to navigate from a contact listed in the client detail to that contact's full detail view,
So that I can access all contact information with no more than 2 clicks from the client.

## Acceptance Criteria

1. **Given** the user is in the client detail view and contacts are listed in the ContactManager, **When** the user clicks on a contact item, **Then** the user is navigated to `/contactos/:contactoId` showing the full contact detail (FR22) **And** the navigation requires no more than 2 clicks from the client record (NFR8).

2. **Given** the user navigated to a contact from the client detail, **When** the user clicks the browser back button or a "Volver" link, **Then** the user returns to the client detail view at `/clientes/:clienteId`.

## Tasks / Subtasks

- [x] Task 1 — Frontend: extend `ClienteContactServiceAdapter` with `onContactClick` navigation handler (AC: 1)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts`
  - [x] Add `onContactClick(contactoId: string): void` method — calls `router.navigate({ to: '/contactos/$contactoId', params: { contactoId } })` using TanStack Router's `useNavigate` hook result passed via constructor
  - [x] Constructor accepts `navigate: ReturnType<typeof useNavigate>` as third argument (after `clienteId` and `queryClient`)
  - [x] Ensure `onContactClick` is wired to the `ContactManager` `onItemClick` prop (or equivalent siesa-ui-kit callback prop name)

- [x] Task 2 — Frontend: update `ClienteDetailView` to wire navigation callback into ContactManager (AC: 1)
  - [x] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [x] Call `const navigate = useNavigate()` at component top level
  - [x] Pass `navigate` to `ClienteContactServiceAdapter` constructor: `new ClienteContactServiceAdapter(clienteId, queryClient, navigate)`
  - [x] Update `useMemo` dependency array to `[clienteId, queryClient, navigate]`
  - [x] Pass `adapter.onContactClick` (or equivalent) to `<ContactManager>` via the correct prop (e.g., `onItemClick`)

- [x] Task 3 — Frontend: add "Volver" link in `ContactoDetailView` with back-navigation support (AC: 2)
  - [x] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
  - [x] Add a "Volver" button/link using TanStack Router's `<Link>` component or `useNavigate`
  - [x] On click, call `router.history.back()` (or `window.history.back()`) to return to the previous route
  - [x] Render the "Volver" button with `data-testid="btn-volver"` for E2E test targeting
  - [x] Button label: "Volver" (Spanish; WCAG 2.1 AA `aria-label="Volver a la vista anterior"`)

- [x] Task 4 — Frontend: extend `ContactosPage` POM with navigation locators (AC: 1, 2)
  - [x] Update `e2e/pages/contactos.page.ts` — add `btnVolver` locator: `page.getByTestId('btn-volver')`
  - [x] Confirm `clienteAsociadoLink` locator is already present (referenced in test-design-epic-4.md Section 7)

- [x] Task 5 — Write E2E tests (AC: 1, 2)
  - [x] Add to `e2e/tests/asociacion/asociacion-navegacion.spec.ts` — Story 4.3 scope: E2E-AC-10, E2E-AC-11, E2E-AC-12
  - [x] E2E-AC-10: Create client + associated contact via `apiHelper`; navigate to `/clientes`; click client item (click 1); assert `contactManagerContainer` visible; click contact row in ContactManager (click 2); assert URL matches `/contactos/{uuid}` (FR22)
  - [x] E2E-AC-11: Same setup — wrap click interactions with explicit click counter; assert exactly 2 clicks from landing on `/clientes` to `/contactos/:contactoId` (NFR8)
  - [x] E2E-AC-12: After navigating to contact via ContactManager (click 2), click `btnVolver` or call `page.goBack()`; assert `page.url()` matches `/clientes/:clienteId`
  - [x] All tests include `afterEach` cleanup via `apiHelper.deleteContacto` and `apiHelper.deleteCliente`
  - [x] All tests add `page.on('pageerror', ...)` listener to catch JS errors during navigation

## Dev Notes

### Architecture Context

Story 4.3 extends the navigation layer built by Stories 4.1 and 4.2. The `ClienteDetailView`, `ClienteContactServiceAdapter`, and the `/contactos/$contactoId` route are all in place. This story wires the ContactManager's `onItemClick` callback (or equivalent) to TanStack Router navigation, and adds a "Volver" back-navigation control to `ContactoDetailView`.

**Key integration point (from architecture.md):**

```
Route Layer (_app/clientes.$clienteId.tsx)
  └── ClienteDetailView [right panel]
        └── ContactManager [siesa-ui-kit — onItemClick prop]
              └── ClienteContactServiceAdapter.onContactClick(contactoId)
                    └── navigate({ to: '/contactos/$contactoId', params: { contactoId } })
```

**TanStack Router navigation pattern:**

```typescript
// Use useNavigate inside the component; pass the result into the adapter
const navigate = useNavigate()
const adapter = useMemo(
  () => new ClienteContactServiceAdapter(clienteId, queryClient, navigate),
  [clienteId, queryClient, navigate],
)
```

**Back navigation approach:** Use `window.history.back()` (or `router.history.back()`) inside the "Volver" handler in `ContactoDetailView`. This preserves the browser history stack regardless of how the user arrived at the contact detail — whether from ContactManager or directly via URL. Do NOT hardcode `/clientes/:clienteId` as the back target, since the contact detail is also accessible standalone.

**2-click navigation path (NFR8):**
1. Click 1 — select a client from `ClienteListPanel` (navigates to `/clientes/:clienteId`)
2. Click 2 — click a contact row in `ContactManager` (navigates to `/contactos/:contactoId`)

Both clicks are from the `/clientes` starting point — total of 2 clicks, satisfying NFR8.

**Depends on:**
- Story 4.1 — `ClienteDetailView`, `ClienteContactServiceAdapter`, `ContactManager` wiring, `useContactosByCliente`
- Story 4.2 — `ClienteContactServiceAdapter` constructor updated to accept `QueryClient`
- Story 3.2 — `ContactoDetailView` already exists at `/contactos/$contactoId`

**Provides for:** Story 4.4 (view associated client from contact detail) extends `ContactoDetailView` with a client link, building on the same view reached via Story 4.3 navigation.

### Frontend File Locations

```
frontend/src/
  modules/crm/
    clientes/
      presentation/
        ClienteDetailView.tsx               # Updated: pass navigate to adapter; update useMemo deps
        ClienteContactServiceAdapter.ts     # Updated: add onContactClick(contactoId); constructor accepts navigate
    contactos/
      presentation/
        ContactoDetailView.tsx              # Updated: add "Volver" button with data-testid="btn-volver"

e2e/
  pages/
    contactos.page.ts                       # Updated: add btnVolver locator
  tests/
    asociacion/
      asociacion-navegacion.spec.ts         # NEW (Story 4.3 scope): E2E-AC-10, E2E-AC-11, E2E-AC-12
```

### `ClienteContactServiceAdapter` — `onContactClick` Extension

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts
import type { QueryClient } from '@tanstack/react-query'
import type { NavigateFn } from '@tanstack/react-router'
import { apiClient } from '../../../../shared/lib/apiClient'
import type { IContactServiceAdapter } from 'siesa-ui-kit'

export class ClienteContactServiceAdapter implements IContactServiceAdapter {
  constructor(
    private readonly clienteId: string,
    private readonly queryClient: QueryClient,
    private readonly navigate: NavigateFn,
  ) {}

  async getByRecordId() {
    const response = await apiClient.get(`/api/v1/contactos?clienteId=${this.clienteId}`)
    return response.data
  }

  async assignContacto(contactoId: string): Promise<void> {
    await apiClient.put(`/api/v1/contactos/${contactoId}/cliente`, { clienteId: this.clienteId })
    this.queryClient.invalidateQueries({ queryKey: ['contactos'] })
    this.queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: this.clienteId }] })
  }

  async removeContacto(contactoId: string): Promise<void> {
    await apiClient.put(`/api/v1/contactos/${contactoId}/cliente`, { clienteId: null })
    this.queryClient.invalidateQueries({ queryKey: ['contactos'] })
    this.queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: this.clienteId }] })
  }

  onContactClick(contactoId: string): void {
    this.navigate({ to: '/contactos/$contactoId', params: { contactoId } })
  }
}
```

### `ClienteDetailView` — Updated `useMemo` and `ContactManager` Wiring

```typescript
// frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx — relevant changes
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { ClienteContactServiceAdapter } from './ClienteContactServiceAdapter'

export function ClienteDetailView({ clienteId }: Props) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const adapter = useMemo(
    () => new ClienteContactServiceAdapter(clienteId, queryClient, navigate),
    [clienteId, queryClient, navigate],
  )

  // Pass onItemClick (confirm exact prop name with siesa-ui-kit ContactManager API)
  return (
    // ... existing markup ...
    <div data-testid="contact-manager">
      <ContactManager adapter={adapter} onItemClick={(contacto) => adapter.onContactClick(contacto.id)} />
    </div>
  )
}
```

**Note:** Verify the exact prop name for item click callback in siesa-ui-kit `ContactManager` documentation. It may be `onItemClick`, `onContactSelect`, `onRowClick`, or similar. If the `IContactServiceAdapter` interface itself defines the navigation callback, implement it there and omit the separate prop.

### `ContactoDetailView` — "Volver" Back Button

```typescript
// Addition to frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx
import { useRouter } from '@tanstack/react-router'

// Inside the component:
const router = useRouter()

// In JSX — add above the contact detail content:
<button
  data-testid="btn-volver"
  aria-label="Volver a la vista anterior"
  onClick={() => router.history.back()}
  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
>
  {/* Heroicons: ChevronLeftIcon */}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
  </svg>
  Volver
</button>
```

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/asociacion/asociacion-navegacion.spec.ts` (Story 4.3 scope):**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-AC-10 | P0 | AC1 | Clicking a contact row in ContactManager navigates to `/contactos/:contactoId` (≤ 2 clicks from client list) |
| E2E-AC-11 | P0 | AC1 | Navigation from client list to contact detail requires exactly 2 clicks: (1) select client, (2) click contact in ContactManager |
| E2E-AC-12 | P1 | AC2 | Back navigation from contact detail (reached via ContactManager) returns to client detail view |

**Implementation notes (from test-design-epic-4.md Section 4.1):**

- **E2E-AC-10:** Create client + associated contact via `apiHelper`; navigate to `/clientes`; click client item (click 1); assert `contactManagerContainer` visible with ContactManager; click contact row in ContactManager (click 2); assert `page.url()` matches `/contactos/{uuid}`.
- **E2E-AC-11:** Same setup as E2E-AC-10 with explicit click counter validation — wraps click interactions in a counter to verify only 2 clicks from landing on `/clientes`.
- **E2E-AC-12:** After navigating to contact via ContactManager (click 2), click `btnVolver` (`data-testid="btn-volver"`) or call `page.goBack()`; assert `page.url()` matches `/clientes/:clienteId`.

**Playwright projects applicable:**
- chromium (Desktop Chrome) — P0 primary
- mobile-chrome (Pixel 5) — NFR8 2-click check on mobile viewport (P2)

### Key Anti-Patterns to Avoid

```
❌ Hardcoding back URL in "Volver" as '/clientes'         → use router.history.back() (contact detail is accessible standalone)
❌ Navigating via window.location.href                    → TanStack Router navigate() for type-safe routing
❌ ContactManager onItemClick not wired                   → must propagate click to onContactClick(contactoId) — R4 risk
❌ page.reload() in E2E navigation tests                  → navigation is SPA — no reload expected
❌ English button label                                   → "Volver" (Spanish mandatory per company standards)
❌ Missing aria-label on Volver button                    → WCAG 2.1 AA: aria-label="Volver a la vista anterior"
❌ Missing data-testid="btn-volver"                       → required by E2E-AC-12 POM locator
❌ Spinner loading state in ContactoDetailView             → react-loading-skeleton
❌ navigate() called outside useMemo deps                 → add navigate to useMemo([clienteId, queryClient, navigate]) to avoid stale closures
❌ ContactManager onItemClick prop name assumed           → verify exact prop with siesa-ui-kit ContactManager API before implementation
```

## Dev Agent Record

### Implementation Notes

- `ClienteContactServiceAdapter` constructor extended to accept optional `navigate?: NavigateFn` as third argument; backward-compatible (existing 2-arg instantiations still work).
- `onContactClick(contactoId)` added to adapter — calls `navigate?.({ to: '/contactos/$contactoId', params: { contactoId } })`.
- `ClienteDetailView` updated: passes `navigate` to adapter, adds `useContactosByCliente` to resolve contact ID from click event via event delegation on the ContactManager container `<div>`.
- Navigation is implemented via click event delegation on the `<tr>` row in the ContactManager table layout — ContactManager (siesa-ui-kit v1.0.194) does NOT expose an external `onItemClick`/`onViewContact` prop at `ContactManagerProps` level; verified via type inspection and bundle analysis.
- `ContactoDetailPanel` (used at `/contactos/$contactoId` route) updated with "Volver" back button using `router.history.back()` — WCAG 2.1 AA compliant (`aria-label="Volver a la vista anterior"`, `data-testid="btn-volver"`).
- 2 new unit tests added: UNIT-AC-06 (onContactClick calls navigate), UNIT-AC-07 (no-throw when navigate is undefined).
- All 31 adapter unit tests pass. TypeScript clean. ESLint package unavailable in worktree (pre-existing issue, not related to this story).
- E2E tests E2E-AC-10, E2E-AC-11, E2E-AC-12 created in `e2e/tests/asociacion/asociacion-navegacion.spec.ts`.

### Files Modified/Created

- Modified: `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts`
- Modified: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- Modified: `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`
- Modified: `frontend/src/modules/crm/clientes/__tests__/ClienteContactServiceAdapter.test.ts`
- Modified: `e2e/pages/contactos.page.ts`
- Created: `e2e/tests/asociacion/asociacion-navegacion.spec.ts`

### References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.3 AC
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "Frontend Architecture" (routing `/contactos/:id`, `ContactoDetailView`), "Component Boundaries" (ClienteDetailView → ContactManager → ClienteContactServiceAdapter), TanStack Router file-based routing
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-4.md` — E2E-AC-10, E2E-AC-11, E2E-AC-12, Risk R4 (2-click navigation constraint), Risk R10 (back navigation)
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md` — FR22 (navigate from client to contact), NFR8 (≤ 2 clicks from client to contact)
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack (TanStack Router 1+, React 18+ hooks, TypeScript strict), UX (Heroicons, Spanish UI text, WCAG 2.1 AA)
- Predecessor stories:
  - `_bmad-output/implementation-artifacts/stories/4-1-view-associated-contacts-in-client-detail.md` — `ClienteDetailView`, `ClienteContactServiceAdapter` (read-only), ContactManager wiring
  - `_bmad-output/implementation-artifacts/stories/4-2-associate-disassociate-contacts-from-client.md` — `ClienteContactServiceAdapter` constructor extended with `QueryClient`; `ContactoDetailView` base implementation
