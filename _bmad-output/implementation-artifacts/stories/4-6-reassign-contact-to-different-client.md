# Story 4.6: Reassign Contact to Different Client

Status: ready

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to reassign a contact from one client to a different client,
So that I can correct associations or reflect organizational changes.

## Acceptance Criteria

1. **Given** the user is viewing a contact detail that is associated with a client, **When** the user clicks the "Reasignar" button in `ContactoDetailPanel`, **Then** a dialog opens showing a selector with all available clients to choose from (FR26).

2. **Given** the user selects a different client in the selector and confirms, **When** the reassignment is saved, **Then** `PUT /api/v1/contactos/{id}/cliente` is called with `{ clienteId: newClienteId }` **And** queryKeys `['contactos']`, `['contactos', { clienteId: oldId }]`, and `['contactos', { clienteId: newId }]` are all invalidated **And** a toast shows "Contacto reasignado correctamente" (FR26, FR27).

3. **Given** the reassignment succeeds, **When** the user navigates to the new client's detail, **Then** the contact appears in the new client's ContactManager **And** it is no longer present in the previous client's ContactManager (FR26, FR27).

4. **Given** the user opens the reassignment dialog, **When** the user clicks "Cancelar" or closes the dialog without confirming, **Then** the contact's client association remains unchanged.

## Tasks / Subtasks

- [ ] Task 1 — Frontend: create `useReassignContacto` mutation hook (AC: 2)
  - [ ] Create `frontend/src/modules/crm/contactos/application/useReassignContacto.ts`
  - [ ] Signature: `useReassignContacto(contactoId: string, oldClienteId: string | null)`
  - [ ] `mutationFn`: calls `contactoApiRepository.assignCliente(contactoId, newClienteId)` — which sends `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: newClienteId }`
  - [ ] `onSuccess`: invalidate three query keys:
    - `queryClient.invalidateQueries({ queryKey: ['contactos'] })`
    - `queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: oldClienteId }] })` — only if `oldClienteId` is non-null
    - `queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: newClienteId }] })`
    - `queryClient.invalidateQueries({ queryKey: ['contactos', contactoId] })`
  - [ ] `onSuccess`: `toast.success('Contacto reasignado correctamente')` (Spanish)
  - [ ] `onError`: `toast.error('No se pudo reasignar el contacto. Intenta de nuevo.')` (Spanish)

- [ ] Task 2 — Frontend: create `ReassignClienteDialog` component (AC: 1, 4)
  - [ ] Create `frontend/src/modules/crm/contactos/presentation/ReassignClienteDialog.tsx`
  - [ ] Props: `{ isOpen: boolean; onClose: () => void; contactoId: string; currentClienteId: string | null; contactoNombre: string }`
  - [ ] Inside the dialog, call `useClientes()` to fetch all available clients — queryKey `['clientes']`
  - [ ] While clients are loading: render skeleton rows (react-loading-skeleton, NOT spinner)
  - [ ] Render a scrollable list or combobox of all clients (exclude the currently assigned client from the selectable list to prevent re-assigning to the same client)
  - [ ] Each client option: `data-testid="cliente-option"`, displays client `nombre`
  - [ ] Selected client tracked in local state `selectedClienteId: string | null` initialized to `null`
  - [ ] "Confirmar" button: disabled when `selectedClienteId === null`; `data-testid="btn-confirmar-reasignar"`
  - [ ] "Cancelar" button: `data-testid="btn-cancelar-reasignar"`; calls `onClose()` without mutation
  - [ ] Clicking "Confirmar": calls `reassignMutation.mutate(selectedClienteId)`, then calls `onClose()` on success
  - [ ] Dialog title: "Reasignar contacto" (Spanish); use shadcn/ui `Dialog` component
  - [ ] WCAG 2.1 AA: `aria-label="Seleccionar nuevo cliente"` on the client selection control
  - [ ] `data-testid="reassign-cliente-dialog"` on the dialog container

- [ ] Task 3 — Frontend: update `ContactoDetailPanel` to add "Reasignar" button (AC: 1, 4)
  - [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`
  - [ ] Import and render `ReassignClienteDialog`
  - [ ] Add boolean state: `const [isReassignOpen, setIsReassignOpen] = useState(false)`
  - [ ] Add "Reasignar" button adjacent to the "Cliente" section (added in Story 4.4):
    - Label: "Reasignar" (Spanish)
    - Only visible when `data.clienteId` is non-null (contact must have an assigned client to reassign)
    - `data-testid="btn-reasignar"` on the button
    - `aria-label="Reasignar contacto a otro cliente"` for WCAG 2.1 AA
    - On click: `setIsReassignOpen(true)`
    - Style: secondary/outline variant, adjacent to the client name display
  - [ ] Pass to `ReassignClienteDialog`: `isOpen={isReassignOpen}`, `onClose={() => setIsReassignOpen(false)}`, `contactoId={contactoId}`, `currentClienteId={data.clienteId}`, `contactoNombre={data.nombre}`

- [ ] Task 4 — Frontend: update `ContactosPage` POM with reassignment locators (AC: 1, 2, 4)
  - [ ] Update `e2e/pages/contactos.page.ts`:
    - `btnReasignar`: `page.getByTestId('btn-reasignar')`
    - `reassignClienteDialog`: `page.getByTestId('reassign-cliente-dialog')`
    - `clienteOptions`: `page.getByTestId('cliente-option')`
    - `btnConfirmarReasignar`: `page.getByTestId('btn-confirmar-reasignar')`
    - `btnCancelarReasignar`: `page.getByTestId('btn-cancelar-reasignar')`

- [ ] Task 5 — Frontend: write unit tests for `useReassignContacto` (AC: 2)
  - [ ] Create `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.test.ts`
  - [ ] UNIT-AC-06: `mutationFn` calls `contactoApiRepository.assignCliente(contactoId, newClienteId)` with correct arguments
  - [ ] UNIT-AC-07: `onSuccess` invalidates `['contactos']`, `['contactos', { clienteId: oldId }]`, and `['contactos', { clienteId: newId }]`
  - [ ] UNIT-AC-08: `onSuccess` calls `toast.success('Contacto reasignado correctamente')`
  - [ ] UNIT-AC-09: When `oldClienteId` is null, `['contactos', { clienteId: null }]` key is NOT invalidated (no-op)

- [ ] Task 6 — Write E2E tests (AC: 1, 2, 3, 4)
  - [ ] Create `e2e/tests/asociacion/asociacion-reasignacion.spec.ts`
  - [ ] E2E-AC-20: Create 2 clients + 1 contact assigned to client A via `apiHelper`; navigate to `/contactos/:contactoId`; assert `btnReasignar` visible; click it; assert `reassignClienteDialog` visible; assert client B's `nombre` visible in dialog options
  - [ ] E2E-AC-21: From E2E-AC-20 setup, select client B in dialog; click `btnConfirmarReasignar`; assert `reassignClienteDialog` closed; assert contact detail shows client B's `nombre` in `clienteAsociadoLink`; navigate to `/clientes/:clienteAId`; assert contact NOT in ContactManager; navigate to `/clientes/:clienteBId`; assert contact IS in ContactManager
  - [ ] E2E-AC-22: Same setup as E2E-AC-21; after confirming reassignment, assert no `page.reload()` used; verify `PUT /api/v1/contactos/:id/cliente` called once via `page.on('request', ...)` listener
  - [ ] E2E-AC-23: E2E-AC-20 setup; select client B; click `btnConfirmarReasignar`; assert toast with text `/contacto reasignado correctamente/i` is visible
  - [ ] E2E-AC-24: E2E-AC-20 setup; open dialog; click `btnCancelarReasignar`; assert `reassignClienteDialog` not visible; assert `clienteAsociadoLink` still shows client A's `nombre`; navigate to `/clientes/:clienteAId`; assert contact still in ContactManager
  - [ ] All tests include `afterEach` cleanup via `apiHelper.deleteContacto` and `apiHelper.deleteCliente` for both clients
  - [ ] All tests add `page.on('pageerror', ...)` listener

- [ ] Task 7 — Write API integration test (AC: 2)
  - [ ] Add to `e2e/tests/asociacion/asociacion-api.spec.ts` — Story 4.6 scope: API-AC-05
  - [ ] API-AC-05: Create client A, client B, and contact assigned to client A; `PUT /api/v1/contactos/{id}/cliente` with `{ clienteId: clienteB.id }`; assert response status 200; assert response body `clienteId === clienteB.id`; `GET /api/v1/contactos/{id}`; assert `clienteId === clienteB.id`

## Dev Notes

### Architecture Context

Story 4.6 adds a reassignment action to `ContactoDetailPanel` (built in Story 4.4). The "Reasignar" button opens `ReassignClienteDialog`, which uses the existing `useClientes()` hook to list all available clients. Confirmation calls `useReassignContacto` — a new mutation hook that reuses `contactoApiRepository.assignCliente()` (already available from Story 4.2's `AssignCliente` command) with the new `clienteId`.

**Key integration point (from architecture.md):**

```
/contactos/:contactoId
  └── ContactoDetailPanel
        ├── useContactoById(contactoId)           → GET /api/v1/contactos/:id (returns clienteId)
        ├── "Reasignar" button → isReassignOpen=true
        └── ReassignClienteDialog
              ├── useClientes()                   → GET /api/v1/clientes (all clients)
              └── useReassignContacto(contactoId, oldClienteId)
                    └── PUT /api/v1/contactos/{id}/cliente { clienteId: newId }
                          → onSuccess: invalidate ['contactos'], ['contactos', {clienteId: oldId}], ['contactos', {clienteId: newId}], ['contactos', contactoId]
```

**No backend changes required.** The `PUT /api/v1/contactos/{id}/cliente` endpoint already handles any `clienteId` UUID — associating, disassociating (null), or reassigning (different UUID) with the same `AssignClienteToContactoCommandHandler`. This was established in Story 4.2.

**Cache invalidation strategy (critical — Risk R1, R5 from test-design-epic-4.md):**

The reassignment case requires invalidating THREE query keys:
1. `['contactos']` — global contacts list (used by `/contactos` view)
2. `['contactos', { clienteId: oldId }]` — old client's ContactManager must remove the contact
3. `['contactos', { clienteId: newId }]` — new client's ContactManager must show the contact
4. `['contactos', contactoId]` — contact detail must reflect new clienteId

Missing any of these invalidations causes stale ContactManager data (Risk R5) or stale contact detail (incorrect client name still shown).

**Dialog component:** Uses shadcn/ui `Dialog` (already available in the project from Story 1.2 — `npx shadcn@latest add dialog`). The client selector renders all clients from `useClientes()` queryKey `['clientes']` — no new API endpoint needed.

**Depends on:**
- Story 3.2 — `ContactoDetailPanel`, `useContactoById`, `/contactos/$contactoId` route
- Story 4.2 — `contactoApiRepository.assignCliente(contactoId, clienteId)` method, `AssignClienteToContactoCommandHandler` backend (no changes needed)
- Story 4.4 — "Cliente" section and `clienteAsociadoLink` in `ContactoDetailPanel` (the "Reasignar" button is placed adjacent to this section)
- Story 2.1 — `useClientes()` hook, `['clientes']` query key

**Provides for:** No further stories in this epic depend on Story 4.6.

### Frontend File Locations

```
frontend/src/
  modules/crm/contactos/
    application/
      useReassignContacto.ts                # NEW: mutation hook wrapping PUT /api/v1/contactos/{id}/cliente
    presentation/
      ContactoDetailPanel.tsx               # Updated: add "Reasignar" button + ReassignClienteDialog
      ReassignClienteDialog.tsx             # NEW: dialog with client selector + confirm/cancel

e2e/
  pages/
    contactos.page.ts                       # Updated: add btnReasignar, reassignClienteDialog, clienteOptions, btnConfirmarReasignar, btnCancelarReasignar
  tests/
    asociacion/
      asociacion-reasignacion.spec.ts       # NEW: E2E-AC-20, E2E-AC-21, E2E-AC-22, E2E-AC-23, E2E-AC-24
      asociacion-api.spec.ts                # Updated: add API-AC-05
```

### `useReassignContacto` Hook Pattern

```typescript
// frontend/src/modules/crm/contactos/application/useReassignContacto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contactoApiRepository } from '../infrastructure/contactoApiRepository'
import { toast } from 'sonner' // or whatever toast library is configured

export function useReassignContacto(contactoId: string, oldClienteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newClienteId: string) =>
      contactoApiRepository.assignCliente(contactoId, newClienteId),
    onSuccess: (_data, newClienteId) => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] })
      if (oldClienteId) {
        queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: oldClienteId }] })
      }
      queryClient.invalidateQueries({ queryKey: ['contactos', { clienteId: newClienteId }] })
      queryClient.invalidateQueries({ queryKey: ['contactos', contactoId] })
      toast.success('Contacto reasignado correctamente')
    },
    onError: () => {
      toast.error('No se pudo reasignar el contacto. Intenta de nuevo.')
    },
  })
}
```

### `ReassignClienteDialog` Component Pattern

```tsx
// frontend/src/modules/crm/contactos/presentation/ReassignClienteDialog.tsx
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useClientes } from '../../clientes/application/useClientes'
import { useReassignContacto } from '../application/useReassignContacto'

interface Props {
  isOpen: boolean
  onClose: () => void
  contactoId: string
  currentClienteId: string | null
  contactoNombre: string
}

export function ReassignClienteDialog({ isOpen, onClose, contactoId, currentClienteId, contactoNombre }: Props) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)
  const { data: clientes = [], isLoading } = useClientes()
  const reassignMutation = useReassignContacto(contactoId, currentClienteId)

  const availableClientes = clientes.filter(c => c.id !== currentClienteId)

  const handleConfirm = () => {
    if (!selectedClienteId) return
    reassignMutation.mutate(selectedClienteId, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent data-testid="reassign-cliente-dialog">
        <DialogHeader>
          <DialogTitle>Reasignar contacto</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2" aria-label="Seleccionar nuevo cliente">
          {isLoading ? (
            <Skeleton count={4} height={36} />
          ) : (
            availableClientes.map(cliente => (
              <button
                key={cliente.id}
                type="button"
                data-testid="cliente-option"
                onClick={() => setSelectedClienteId(cliente.id)}
                className={
                  selectedClienteId === cliente.id
                    ? 'px-3 py-2 rounded text-sm text-left font-medium bg-[#0e79fd] text-white'
                    : 'px-3 py-2 rounded text-sm text-left font-medium bg-slate-100 text-slate-700 hover:bg-slate-200'
                }
              >
                {cliente.nombre}
              </button>
            ))
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            data-testid="btn-cancelar-reasignar"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="btn-confirmar-reasignar"
            onClick={handleConfirm}
            disabled={!selectedClienteId || reassignMutation.isPending}
            className="px-4 py-2 rounded text-sm font-medium bg-[#0e79fd] text-white disabled:opacity-50"
          >
            Confirmar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Updated `ContactoDetailPanel` — "Reasignar" Button Addition

```tsx
// frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx
// (additions to Story 4.4's ContactoDetailPanel)
import { useState } from 'react'
import { ReassignClienteDialog } from './ReassignClienteDialog'

// Inside component:
const [isReassignOpen, setIsReassignOpen] = useState(false)

// In "Cliente" section (adjacent to clienteAsociadoLink):
{data.clienteId !== null && data.clienteId !== undefined && (
  <button
    type="button"
    data-testid="btn-reasignar"
    aria-label="Reasignar contacto a otro cliente"
    onClick={() => setIsReassignOpen(true)}
    className="text-xs text-slate-500 hover:text-[#0e79fd] underline ml-2"
  >
    Reasignar
  </button>
)}

<ReassignClienteDialog
  isOpen={isReassignOpen}
  onClose={() => setIsReassignOpen(false)}
  contactoId={contactoId}
  currentClienteId={data.clienteId ?? null}
  contactoNombre={data.nombre}
/>
```

### `ContactosPage` POM Extension

```typescript
// e2e/pages/contactos.page.ts — additions for Story 4.6
readonly btnReasignar: Locator;
readonly reassignClienteDialog: Locator;
readonly clienteOptions: Locator;
readonly btnConfirmarReasignar: Locator;
readonly btnCancelarReasignar: Locator;

// In constructor:
this.btnReasignar = page.getByTestId('btn-reasignar');
this.reassignClienteDialog = page.getByTestId('reassign-cliente-dialog');
this.clienteOptions = page.getByTestId('cliente-option');
this.btnConfirmarReasignar = page.getByTestId('btn-confirmar-reasignar');
this.btnCancelarReasignar = page.getByTestId('btn-cancelar-reasignar');
```

### Testing Requirements

**E2E Tests (Playwright) — `e2e/tests/asociacion/asociacion-reasignacion.spec.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| E2E-AC-20 | P0 | AC1 | Reassign button opens dialog with all available clients listed |
| E2E-AC-21 | P0 | AC2, AC3 | Confirming reassignment: contact removed from old client ContactManager and appears in new client ContactManager immediately |
| E2E-AC-22 | P0 | AC2 | After reassignment, both client contact lists update without page refresh (no page.reload()) |
| E2E-AC-23 | P1 | AC2 | Toast "Contacto reasignado correctamente" shown after successful reassignment |
| E2E-AC-24 | P1 | AC4 | Cancelling reassignment leaves contact's client association unchanged |

**API Integration Test — `e2e/tests/asociacion/asociacion-api.spec.ts` (Story 4.6 scope):**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| API-AC-05 | P0 | AC2 | `PUT /api/v1/contactos/{id}/cliente` with different valid `clienteId` returns 200 with new `clienteId` (FR26) |

**Frontend Unit Tests (Vitest) — `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.test.ts`:**

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| UNIT-AC-06 | P1 | AC2 | `mutationFn` calls `contactoApiRepository.assignCliente` with correct `contactoId` and `newClienteId` |
| UNIT-AC-07 | P1 | AC2 | `onSuccess` invalidates `['contactos']`, `['contactos', { clienteId: oldId }]`, and `['contactos', { clienteId: newId }]` |
| UNIT-AC-08 | P1 | AC2 | `onSuccess` fires `toast.success('Contacto reasignado correctamente')` |
| UNIT-AC-09 | P1 | AC2 | When `oldClienteId` is null, key `['contactos', { clienteId: null }]` is NOT invalidated |

### Key Anti-Patterns to Avoid

```
❌ New backend endpoint for reassignment        → reuse PUT /api/v1/contactos/{id}/cliente (same as assign/disassociate)
❌ Spinner for loading clients in dialog        → react-loading-skeleton (Skeleton count={4})
❌ English dialog title "Reassign contact"     → "Reasignar contacto" (Spanish mandatory)
❌ English button labels "Confirm"/"Cancel"    → "Confirmar"/"Cancelar" (Spanish mandatory)
❌ Missing oldClienteId invalidation           → ['contactos', { clienteId: oldId }] MUST be invalidated (Risk R5)
❌ Missing newClienteId invalidation           → ['contactos', { clienteId: newId }] MUST be invalidated (Risk R1)
❌ Showing current client in selector          → filter out currentClienteId from availableClientes list
❌ Zustand for isReassignOpen state            → local useState in ContactoDetailPanel is sufficient
❌ "Reasignar" button visible when no client   → only render button when data.clienteId is non-null
❌ Hardcoded client list                       → use useClientes() → ['clientes'] query key
❌ page.reload() in E2E tests                  → FR27: changes visible without reload
❌ Toast in English                            → "Contacto reasignado correctamente" (Spanish)
❌ aria-label missing on selection control     → WCAG 2.1 AA: aria-label="Seleccionar nuevo cliente"
❌ data-testid mismatch with POM               → must match exactly: 'btn-reasignar', 'reassign-cliente-dialog', 'cliente-option', 'btn-confirmar-reasignar', 'btn-cancelar-reasignar'
```

## References

- Epic source: `_bmad-output/planning-artifacts/epics/epic-04-asociacion-cliente-contacto.md` — Story 4.6 AC (FR26, FR27)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` — "API & Communication Patterns" (`PUT /api/v1/contactos/{id}/cliente`), TanStack Query canonical keys, "Process Patterns" (mutation invalidation), "Anti-patterns" (DateTimeOffset, Scalar, Spanish UI)
- Test design: `_bmad-output/implementation-artifacts/test-design-epic-4.md` — E2E-AC-20, E2E-AC-21, E2E-AC-22, E2E-AC-23, E2E-AC-24, API-AC-05, UNIT-AC-06 through UNIT-AC-09, Risk R1 ("dual cache invalidation"), Risk R5 ("stale cache after reassign")
- PRD feature: `_bmad-output/planning-artifacts/prd/feature-asociacion-cliente-contacto.md` — FR26 (reassign contact), FR27 (immediate visibility)
- Company standards: `.claude/agent-memory/sa-quick-dev/company-standards.md` — Frontend Stack (TanStack Query 5+, React 18+ hooks, TypeScript strict, shadcn/ui Dialog), UX (Spanish UI text, WCAG 2.1 AA, react-loading-skeleton, Siesa Blue `#0e79fd`)
- Predecessor stories:
  - `_bmad-output/implementation-artifacts/stories/4-2-associate-disassociate-contacts-from-client.md` — `contactoApiRepository.assignCliente()` method, `AssignClienteToContactoCommandHandler` backend (no changes needed)
  - `_bmad-output/implementation-artifacts/stories/4-4-view-associated-client-from-contact-detail.md` — `ContactoDetailPanel` with "Cliente" section; `clienteAsociadoLink` locator in POM; "Reasignar" button to be placed adjacent to this section
  - `_bmad-output/implementation-artifacts/stories/2-1-client-list-and-search.md` — `useClientes()` hook, `['clientes']` query key

## Dev Agent Record

### Agent Model Used

<!-- To be filled by dev agent -->

### Debug Log References

<!-- To be filled by dev agent -->

### Completion Notes List

<!-- To be filled by dev agent -->

### File List

- `frontend/src/modules/crm/contactos/application/useReassignContacto.ts` (NEW)
- `frontend/src/modules/crm/contactos/presentation/ReassignClienteDialog.tsx` (NEW)
- `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx` (MODIFIED — add "Reasignar" button + ReassignClienteDialog)
- `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.test.ts` (NEW)
- `e2e/pages/contactos.page.ts` (MODIFIED — add reassignment locators)
- `e2e/tests/asociacion/asociacion-reasignacion.spec.ts` (NEW — E2E-AC-20 to E2E-AC-24)
- `e2e/tests/asociacion/asociacion-api.spec.ts` (MODIFIED — API-AC-05 added)
