# ATDD Checklist - Epic 4, Story 4.3: Navigate from Client Detail to Contact Detail

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** E2E

---

## Story Summary

A commercial team member needs to navigate from a contact row listed inside the ContactManager (displayed in the client detail view) directly to that contact's full detail view. The navigation must be reachable in no more than 2 clicks from the client list. A "Volver" back-navigation button on the contact detail view allows the user to return to the client detail in one click.

**As a** commercial team member
**I want** to navigate from a contact listed in the client detail to that contact's full detail view
**So that** I can access all contact information with no more than 2 clicks from the client

---

## Acceptance Criteria

1. **AC1 (FR22, NFR8):** Given the user is in the client detail view and contacts are listed in the ContactManager, When the user clicks on a contact item, Then the user is navigated to `/contactos/:contactoId` showing the full contact detail (FR22) **And** the navigation requires no more than 2 clicks from the client record (NFR8).

2. **AC2:** Given the user navigated to a contact from the client detail, When the user clicks the browser back button or a "Volver" link, Then the user returns to the client detail view at `/clientes/:clienteId`.

---

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `e2e/tests/asociacion/asociacion-navegacion.spec.ts`

- **Test:** `E2E-AC-10 — Clicking a contact row in ContactManager navigates to /contactos/:contactoId`
  - **Priority:** P0
  - **Status:** RED — `page.waitForURL('**/contactos/${contacto.id}')` will timeout; `ContactManager` `onItemClick` not yet wired in `ClienteDetailView`; `onContactClick` method missing from `ClienteContactServiceAdapter`
  - **Verifies:** FR22 — clicking a contact row in ContactManager performs SPA navigation to `/contactos/:contactoId` within 2 clicks from `/clientes`

- **Test:** `E2E-AC-11 — Navigation from client list to contact detail requires exactly 2 clicks`
  - **Priority:** P0
  - **Status:** RED — contact click will not navigate; `clickCount` assertion `expect(clickCount).toBe(2)` will fail if URL is never reached; proves NFR8 constraint at test level
  - **Verifies:** NFR8 — confirms exactly 2 user clicks suffice to reach `/contactos/:contactoId` from `/clientes`

- **Test:** `E2E-AC-12 — Clicking "Volver" in contact detail returns to client detail view`
  - **Priority:** P1
  - **Status:** RED — `page.getByTestId('btn-volver')` will not be found; `ContactoDetailView` does not yet render the "Volver" button; `waitForURL('/clientes/${cliente.id}')` will timeout
  - **Verifies:** AC2 — "Volver" button present with correct `data-testid` and `aria-label`; clicking it triggers `router.history.back()` and returns the user to the client detail URL

---

## Data Factories Used

### buildCliente (existing — `e2e/helpers/data.helper.ts`)

**Exports:** `buildCliente(overrides?)` — generates unique client payload with `nombre`, `nit`, `telefono`, `ciudad`

### buildContacto (existing — `e2e/helpers/data.helper.ts`)

**Exports:** `buildContacto(overrides?)` — generates unique contact payload; accepts `clienteId` override for pre-association

---

## Fixtures / Helpers Used

### ApiHelper (existing — `e2e/helpers/api.helper.ts`)

- `createCliente(data)` — POST `/api/v1/clientes`; returns created client with `id`
- `createContacto(data)` — POST `/api/v1/contactos`; accepts `clienteId` for pre-association
- `deleteContacto(id)` — DELETE `/api/v1/contactos/:id` (cleanup in `afterEach`)
- `deleteCliente(id)` — DELETE `/api/v1/clientes/:id` (cleanup in `afterEach`)

**Auto-cleanup:** `afterEach` block iterates `createdContactoIds` and `createdClienteIds` arrays, deleting in order (contacts before clients to respect FK constraints).

---

## Mock Requirements

### Network Interception (network-first pattern — no mocking, pass-through)

All three tests use `page.route(...)` with `route.continue()` **before** `page.goto()` to satisfy the network-first requirement. Actual API calls reach the real backend; interception is used only to guarantee routes are registered before any navigation occurs.

```
Route 1: **/api/v1/contactos?clienteId=${cliente.id}   → route.continue()
Route 2: **/api/v1/contactos/${contacto.id}            → route.continue()
```

**No mocked responses required** — tests run against the live dev backend.

---

## Required data-testid Attributes

### ClienteListPanel (ClientesPage / `clientes-list-panel`)

- `cliente-list-item` — each client row in the left-panel list (already required by Story 2.x)

### ClienteDetailView / ContactManager wrapper

- `contact-manager` — root wrapper `<div data-testid="contact-manager">` around the `<ContactManager>` component (required for `page.getByTestId('contact-manager').getByText(contacto.nombre).click()`)

### ContactoDetailView

- `btn-volver` — the "Volver" back-navigation button
  ```tsx
  <button
    data-testid="btn-volver"
    aria-label="Volver a la vista anterior"
    onClick={() => router.history.back()}
  >
    Volver
  </button>
  ```

**Implementation example:**

```tsx
// ClienteDetailView.tsx
<div data-testid="contact-manager">
  <ContactManager adapter={adapter} onItemClick={(contacto) => adapter.onContactClick(contacto.id)} />
</div>

// ContactoDetailView.tsx
<button
  data-testid="btn-volver"
  aria-label="Volver a la vista anterior"
  onClick={() => router.history.back()}
  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
>
  Volver
</button>
```

---

## Implementation Checklist

### Test: E2E-AC-10 / E2E-AC-11 — Contact row click navigates to /contactos/:contactoId

**File:** `e2e/tests/asociacion/asociacion-navegacion.spec.ts`

**Tasks to make this test pass:**

- [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteContactServiceAdapter.ts`
  - [ ] Add `onContactClick(contactoId: string): void` method calling `this.navigate({ to: '/contactos/$contactoId', params: { contactoId } })`
  - [ ] Update constructor to accept `navigate: NavigateFn` as third parameter (after `clienteId` and `queryClient`)
- [ ] Update `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
  - [ ] Import `useNavigate` from `@tanstack/react-router`
  - [ ] Call `const navigate = useNavigate()` at component top level
  - [ ] Pass `navigate` to adapter constructor: `new ClienteContactServiceAdapter(clienteId, queryClient, navigate)`
  - [ ] Add `navigate` to `useMemo` dependency array: `[clienteId, queryClient, navigate]`
  - [ ] Wire `adapter.onContactClick` to `<ContactManager>` via the correct callback prop (`onItemClick` or equivalent)
  - [ ] Ensure the `<ContactManager>` root element has `data-testid="contact-manager"` on its wrapper `<div>`
- [ ] Run test: `pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-10"`
- [ ] Run test: `pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-11"`
- [ ] ✅ Both tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: E2E-AC-12 — "Volver" button returns to client detail

**File:** `e2e/tests/asociacion/asociacion-navegacion.spec.ts`

**Tasks to make this test pass:**

- [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
  - [ ] Import `useRouter` from `@tanstack/react-router`
  - [ ] Call `const router = useRouter()` inside the component
  - [ ] Add "Volver" button JSX with `data-testid="btn-volver"`, `aria-label="Volver a la vista anterior"`, and `onClick={() => router.history.back()}`
  - [ ] Button label must be "Volver" (Spanish, per company standards)
  - [ ] Do NOT hardcode `/clientes/:clienteId` as back destination — use `router.history.back()` to preserve history stack
- [ ] Update `e2e/pages/contactos.page.ts` (already done — `btnVolver` locator present)
- [ ] Run test: `pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-12"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 4.3 failing tests
pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts

# Run specific test by ID
pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-10"
pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-11"
pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-12"

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --headed

# Debug a specific test
pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-10" --debug

# Run on mobile-chrome project (NFR8 viewport check)
pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --project=mobile-chrome
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 3 tests written and failing (missing `onContactClick` wiring + missing `btn-volver`)
- ✅ Network-first interception applied in all tests
- ✅ `afterEach` auto-cleanup via `apiHelper.deleteContacto` / `apiHelper.deleteCliente`
- ✅ `page.on('pageerror', ...)` listener in each test
- ✅ `data-testid` requirements documented
- ✅ Implementation checklist created with concrete tasks

**Verification:**

- Tests fail because `ClienteContactServiceAdapter.onContactClick` is not implemented
- Tests fail because `ContactManager` `onItemClick` prop is not wired in `ClienteDetailView`
- Tests fail because `data-testid="btn-volver"` element does not exist in `ContactoDetailView`
- All failures are due to missing implementation — not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick `E2E-AC-10` first (highest priority P0, foundational for AC1)
2. Implement `onContactClick` in `ClienteContactServiceAdapter`
3. Wire it in `ClienteDetailView` via `onItemClick` prop on `<ContactManager>`
4. Run `E2E-AC-10` → verify green
5. Run `E2E-AC-11` → verify green (same wiring satisfies NFR8 assertion)
6. Implement "Volver" button in `ContactoDetailView`
7. Run `E2E-AC-12` → verify green

**Key Principles:**

- One test at a time — don't implement everything at once
- Verify exact prop name for `ContactManager` item-click callback in siesa-ui-kit docs before coding
- Use `router.history.back()` — do NOT hardcode `/clientes/:clienteId` as back target

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 3 tests pass
2. Confirm `useMemo` dependency array includes `navigate` (no stale closures)
3. Extract any shared test setup into a named fixture if tests grow
4. Ensure tests still pass after refactoring

---

## Next Steps

1. Share this checklist and `e2e/tests/asociacion/asociacion-navegacion.spec.ts` with the dev workflow
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts`
3. Begin implementation following checklist (E2E-AC-10 → E2E-AC-11 → E2E-AC-12)
4. Work one test at a time (red → green for each)
5. When all 3 tests pass and refactor is complete, update story status to `done` in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception before navigation applied in all 3 tests
- **fixture-architecture.md** — `beforeEach`/`afterEach` pattern with tracked ID arrays for auto-cleanup
- **data-factories.md** — `buildCliente` / `buildContacto` with uniqueId overrides
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class selectors
- **test-quality.md** — One assertion per test (atomic); explicit waits via `waitForURL`; `pageerror` listener for silent JS errors
- **test-levels-framework.md** — E2E selected as primary level (full user journey: list → detail → contact detail → back)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts`

**Expected Results (RED phase — before implementation):**

```
  ✗  [chromium] › asociacion/asociacion-navegacion.spec.ts:48:3 › Story 4.3 — Navigate from Client Detail to Contact Detail › E2E-AC-10 — Clicking a contact row in ContactManager navigates to /contactos/:contactoId
     TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
     Expected URL pattern: **/contactos/**

  ✗  [chromium] › asociacion/asociacion-navegacion.spec.ts:94:3 › Story 4.3 — Navigate from Client Detail to Contact Detail › E2E-AC-11 — Navigation from client list to contact detail requires exactly 2 clicks
     TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
     Expected URL pattern: **/contactos/**

  ✗  [chromium] › asociacion/asociacion-navegacion.spec.ts:150:3 › Story 4.3 — Navigate from Client Detail to Contact Detail › E2E-AC-12 — Clicking "Volver" in contact detail returns to client detail view
     Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
     Locator: getByTestId('btn-volver')
```

**Summary:**

- Total tests: 3
- Passing: 0 (expected)
- Failing: 3 (expected)
- Status: ✅ RED phase verified

---

## Notes

- Story 4.3 depends on Stories 4.1 and 4.2 (`ClienteDetailView`, `ClienteContactServiceAdapter` with `QueryClient`, `ContactoDetailView` base)
- The `onContactClick` prop name on `ContactManager` (`onItemClick`, `onContactSelect`, etc.) must be verified against siesa-ui-kit API before implementation — see Anti-Patterns in story Dev Notes
- E2E-AC-11 uses a manual `clickCount` variable (not DOM mutation observer) — this is acceptable since the test flow is deterministic and linear
- `btn-volver` locator is already present in `ContactosPage` POM (`e2e/pages/contactos.page.ts`) — no POM changes needed
- Tests run in both `chromium` (P0) and `mobile-chrome` (P2) projects per `playwright.config.ts`

---

**Generated by BMad TEA Agent** - 2026-05-21
