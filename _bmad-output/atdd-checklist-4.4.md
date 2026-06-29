# ATDD Checklist - Epic 4, Story 4.4: View Associated Client from Contact Detail

**Date:** 2026-06-29
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** Component + E2E

---

## Story Summary

A commercial team member needs to see which client a contact is associated with directly from the contact detail view, so they can understand the relationship without extra navigation. The contact detail at `/contactos/:contactoId` must show the associated client's name as a navigable link (or "Sin cliente asignado" when unset), with proper loading/error states and full keyboard accessibility.

**As a** commercial team member
**I want** to see which client a contact is associated with from the contact detail view
**So that** I can understand the relationship without additional navigation

---

## Acceptance Criteria

1. **AC #1** — Contact with `clienteId` set: associated client name displayed in contact detail view (FR23)
2. **AC #2** — Clicking the client name link navigates to `/clientes/:clienteId` (FR24)
3. **AC #3** — Navigation requires no more than 1 click to reach client detail from contact detail (NFR9)
4. **AC #4** — Contact with `clienteId` null: "Sin cliente asignado" shown in client association section (FR23)
5. **AC #5** — Loading state: skeleton placeholder shown while client data is being fetched (company standard)
6. **AC #6** — Fetch error: error state with retry option shown; no raw error message exposed (NFR6)
7. **AC #7** — Client name link is keyboard-accessible (focusable, activatable via Enter) — WCAG 2.1 AA

---

## Failing Tests Created (RED Phase)

### Component Tests (12 tests)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.clienteAsociado.test.tsx`

- RED **TC-1** — `should display the associated client nombre when contacto has a non-null clienteId`
  - **Status:** RED — `[data-testid="cliente-asociado-section"]` does not exist; client name never renders
  - **Verifies:** AC #1 — client nombre visible when clienteId is set

- RED **TC-2** — `should render [data-testid="cliente-asociado-section"] when contact has clienteId`
  - **Status:** RED — `cliente-asociado-section` testid missing from ContactoDetailView
  - **Verifies:** AC #1 — section container rendered

- RED **TC-3** — `should render [data-testid="navigate-to-cliente"] with href /clientes/{clienteId}`
  - **Status:** RED — `navigate-to-cliente` link does not exist
  - **Verifies:** AC #2 — navigation link href is correct

- RED **TC-3b** — `should render the client nombre as the link text inside navigate-to-cliente`
  - **Status:** RED — no link element with client name
  - **Verifies:** AC #2 — link text is client nombre

- RED **TC-4** — `should render navigate-to-cliente as a direct link (no modal or intermediate step required)`
  - **Status:** RED — `navigate-to-cliente` element not rendered
  - **Verifies:** AC #3 — direct link, 1-click navigation

- RED **TC-5** — `should display "Sin cliente asignado" when the contact has no associated client`
  - **Status:** RED — "Sin cliente asignado" string not rendered in component
  - **Verifies:** AC #4 — null clienteId message

- RED **TC-5b** — `should render [data-testid="sin-cliente-message"] when clienteId is null`
  - **Status:** RED — `sin-cliente-message` testid does not exist
  - **Verifies:** AC #4 — message element testid

- RED **TC-5c** — `should NOT render navigate-to-cliente link when clienteId is null`
  - **Status:** RED (passes vacuously until navigate-to-cliente is implemented)
  - **Verifies:** AC #4 — no link when no clienteId

- RED **TC-6** — `should still render [data-testid="cliente-asociado-section"] when clienteId is null`
  - **Status:** RED — section not rendered for null clienteId case either
  - **Verifies:** AC #4 — section always present

- RED **TC-7** — `should display [data-testid="cliente-loading-skeleton"] while client fetch is in-flight`
  - **Status:** RED — `cliente-loading-skeleton` testid does not exist
  - **Verifies:** AC #5 — skeleton during load

- RED **TC-8** — `should render an error state in the cliente-asociado-section when client fetch returns 500`
  - **Status:** RED — `cliente-asociado-error` testid does not exist
  - **Verifies:** AC #6 — error state on fetch failure

- RED **TC-9** — `should render a retry button when client fetch fails`
  - **Status:** RED — `cliente-asociado-retry` button does not exist
  - **Verifies:** AC #6 — retry button present

- RED **TC-9b** — `should trigger a new client fetch when retry button is clicked`
  - **Status:** RED — no retry mechanism implemented
  - **Verifies:** AC #6 — retry triggers refetch

- RED **TC-10** — `should NOT expose raw error messages or stack traces when client fetch fails`
  - **Status:** RED — error state does not exist yet
  - **Verifies:** AC #6 / NFR6 — no technical error exposure

- RED **TC-11** — `should render navigate-to-cliente as an <a> element`
  - **Status:** RED — element does not exist
  - **Verifies:** AC #7 — natively keyboard-focusable

- RED **TC-11b** — `should make navigate-to-cliente accessible as a link role (WCAG 2.1 AA)`
  - **Status:** RED — no link role found for client name
  - **Verifies:** AC #7 — ARIA role=link

- RED **TC-12** — `should include focus-visible ring styling on navigate-to-cliente`
  - **Status:** RED — element does not exist
  - **Verifies:** AC #7 — keyboard focus ring (WCAG 2.1 AA)

### E2E Tests (10 tests)

**File:** `e2e/tests/contactos/view-client-from-contact.spec.ts`

- RED **E2E-1** — `AC#1 — contact detail shows associated client nombre when clienteId is set`
  - **Status:** RED — client name not visible in contact detail page
  - **Verifies:** AC #1

- RED **E2E-2** — `AC#1 — cliente-asociado-section is rendered when contact has clienteId`
  - **Status:** RED — section testid not found in DOM
  - **Verifies:** AC #1

- RED **E2E-3** — `AC#2 — clicking navigate-to-cliente link navigates to /clientes/:clienteId`
  - **Status:** RED — link does not exist; click would fail
  - **Verifies:** AC #2

- RED **E2E-4** — `AC#2 — navigate-to-cliente link href contains /clientes/{clienteId}`
  - **Status:** RED — link not rendered
  - **Verifies:** AC #2

- RED **E2E-5** — `AC#3 — contact detail reaches client detail in exactly 1 click`
  - **Status:** RED — no direct link exists in contact detail
  - **Verifies:** AC #3

- RED **E2E-6** — `AC#4 — "Sin cliente asignado" text shown when contact clienteId is null`
  - **Status:** RED — text not rendered in contact detail page
  - **Verifies:** AC #4

- RED **E2E-7** — `AC#4 — navigate-to-cliente link is NOT rendered when contact has no clienteId`
  - **Status:** RED (passes vacuously; but coupled to E2E-6 failure first)
  - **Verifies:** AC #4

- RED **E2E-8** — `AC#4 — sin-cliente-message element is present when contact has no clienteId`
  - **Status:** RED — testid not found in page
  - **Verifies:** AC #4

- RED **E2E-9** — `AC#7 — navigate-to-cliente is keyboard-focusable (renders as <a> element)`
  - **Status:** RED — element does not exist in page
  - **Verifies:** AC #7

- RED **E2E-10** — `AC#7 — navigate-to-cliente can be activated via keyboard (Tab + Enter)`
  - **Status:** RED — element does not exist; keyboard interaction not possible
  - **Verifies:** AC #7

### API Tests

No new API tests generated — story is presentation/application layer only. No new backend endpoints required. Existing `GET /api/v1/contactos/{id}` and `GET /api/v1/clientes/{id}` endpoints are already tested in Stories 3.2 and 2.2 respectively.

---

## Data Factories

### Existing Factories Reused

**Contacto Factory:** `frontend/src/test/factories/contacto.factory.ts`
- `createContacto(overrides?)` — includes `clienteId: string | null` field
- `resetContactoCounter()` — call in beforeEach for deterministic IDs

**Cliente Factory:** `frontend/src/test/factories/cliente.factory.ts`
- `createCliente(overrides?)` — includes `id`, `nombre`, `nit`, `telefono`, `ciudad`
- `resetClienteCounter()` — call in beforeEach for deterministic IDs

**E2E Data Helpers:** `e2e/helpers/data.helper.ts`
- `buildCliente(overrides?)` — generates unique client data for E2E seeding
- `buildContacto(overrides?)` — generates unique contact data; supports `clienteId` override

No new factories required — existing factories already model the `clienteId` field on `ContactoTestData`.

---

## MSW Handlers Created

**New File:** `frontend/src/test/msw/handlers/contactos-cliente-asociado.handlers.ts`

| Handler | Endpoint | Purpose |
|---|---|---|
| `handleGetContactoWithClienteId(contacto)` | `GET /api/v1/contactos/:id` | Contact with non-null clienteId |
| `handleGetContactoWithNullClienteId(contacto)` | `GET /api/v1/contactos/:id` | Contact with clienteId: null |
| `handleGetClienteAsociadoSuccess(cliente)` | `GET /api/v1/clientes/:id` | Client fetch success |
| `handleGetClienteAsociadoDelayed(cliente, ms)` | `GET /api/v1/clientes/:id` | Client fetch delayed (loading state) |
| `handleGetClienteAsociadoError()` | `GET /api/v1/clientes/:id` | Client fetch 500 error |

---

## Required data-testid Attributes

### ContactoDetailView — ClienteAsociadoSeccion

| data-testid | Element | Condition |
|---|---|---|
| `cliente-asociado-section` | `<section>` or `<div>` wrapper | Always (both cases) |
| `navigate-to-cliente` | `<Link>` rendered as `<a>` | When `clienteId` is non-null and client loaded |
| `sin-cliente-message` | `<p>` element | When `clienteId` is null |
| `cliente-loading-skeleton` | `<Skeleton>` component | While `isLoading` for client fetch |
| `cliente-asociado-error` | Error state container | When client fetch fails |
| `cliente-asociado-retry` | `<button>` retry element | When client fetch fails |

---

## Implementation Checklist

### Task 1: Add ClienteAsociadoSeccion to ContactoDetailView.tsx

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`

- [ ] Import `BuildingOfficeIcon` from `@heroicons/react/24/outline`
- [ ] Import `Skeleton` from `react-loading-skeleton`
- [ ] Import or create `useCliente(id)` hook (check `frontend/src/modules/crm/clientes/application/useCliente.ts` first)
- [ ] Create `ClienteAsociadoSeccion` sub-component receiving `{ clienteId: string | null }`
- [ ] Add `<section data-testid="cliente-asociado-section">` wrapper (always rendered)
- [ ] If `clienteId` is null: render `<p data-testid="sin-cliente-message" className="text-slate-500 text-sm">Sin cliente asignado</p>`
- [ ] If `isLoading`: render `<Skeleton data-testid="cliente-loading-skeleton" width={200} height={20} />`
- [ ] If `isError`: render `<div data-testid="cliente-asociado-error">` with `<button data-testid="cliente-asociado-retry" onClick={() => void refetch()}>Reintentar</button>`
- [ ] Success case: render `<Link to="/clientes/$clienteId" params={{ clienteId }} data-testid="navigate-to-cliente" className="... focus-visible:ring-2 focus-visible:ring-blue-500 ...">` with client nombre
- [ ] Mount `ClienteAsociadoSeccion` inside `ContactoDetailViewInner` after contact data is loaded
- [ ] Run component tests: `pnpm --filter frontend test -- ContactoDetailView.clienteAsociado`
- [ ] ✅ All 12 component tests pass (green phase)

### Task 2: Verify or create useCliente hook

**File:** `frontend/src/modules/crm/clientes/application/useCliente.ts` (check existence first)

- [ ] Check if `useCliente.ts` exists from Story 2.2
- [ ] If exists: import directly in `ContactoDetailView.tsx` — no changes needed
- [ ] If missing: create `frontend/src/modules/crm/contactos/application/useClienteAsociado.ts` with `useQuery({ queryKey: ['clientes', id], queryFn: ..., enabled: !!id })`
- [ ] Ensure hook returns `{ data, isLoading, isError, refetch }`

### Task 3: Verify TanStack Router route for /clientes/$clienteId

- [ ] Confirm `frontend/src/routes/_app/clientes.$clienteId.tsx` exists (Story 2.2)
- [ ] No changes needed to this file

---

## Running Tests

```bash
# Run all component tests for Story 4.4
pnpm --filter frontend test -- ContactoDetailView.clienteAsociado

# Run E2E tests for Story 4.4
pnpm exec playwright test e2e/tests/contactos/view-client-from-contact.spec.ts

# Run E2E tests headed (see browser)
pnpm exec playwright test e2e/tests/contactos/view-client-from-contact.spec.ts --headed

# Run all contact-related tests
pnpm --filter frontend test -- ContactoDetailView
pnpm exec playwright test e2e/tests/contactos/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 22 tests written and in failing state
- MSW handlers created for component tests
- E2E tests use network-first route interception
- Required `data-testid` attributes documented
- Implementation checklist created

### GREEN Phase (DEV Team)

1. Pick TC-1 (simplest: client name displayed)
2. Add `ClienteAsociadoSeccion` with minimal structure
3. Wire `useCliente(contacto.clienteId)` to fetch client data
4. Render client `nombre` inside the section
5. Run `pnpm --filter frontend test -- ContactoDetailView.clienteAsociado` — confirm TC-1 green
6. Continue one test at a time through the checklist
7. For E2E tests: run after component tests pass, ensure real API + UI work end-to-end

### REFACTOR Phase (DEV Team)

- Extract `ClienteAsociadoSeccion` to its own file if it grows beyond ~30 lines
- Ensure `useCliente` is shared (not duplicated) between clientes and contactos modules
- Verify all 22 tests still pass after any refactoring

---

## Notes

- Story is **presentation + application layer only** — no new backend endpoints, no migrations
- `ContactoDetailView.tsx` already has a "Volver al cliente" back-navigation link (Story 4.3); `ClienteAsociadoSeccion` is a distinct informational section and must coexist without breaking back-nav
- `ClienteTestData` interface in `cliente.factory.ts` does not include `email` field — the DTO has it but the factory omits it; MSW responses will include it from the actual API
- The `navigate-to-cliente` testid is the canonical selector for the Story 4.4 link (distinct from `contacto-back-link` used by Story 4.3)

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-29
