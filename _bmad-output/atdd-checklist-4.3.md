# ATDD Checklist - Epic 4, Story 4.3: Navigate from Client Detail to Contact Detail

**Date:** 2026-06-29
**Author:** gaduranb@siesa.com
**Primary Test Level:** Component + E2E

---

## Story Summary

As a commercial team member, I want to navigate from a contact listed in the client detail to that contact's full detail view so that I can access all contact information with no more than 2 clicks from the client.

This story is a pure Presentation-layer concern. It wraps existing contact items in `ContactosSeccion` (inside `ClienteDetailView`) with TanStack Router `<Link>` components, and adds a "Volver al cliente" / "Volver a contactos" back-navigation affordance to `ContactoDetailView`.

**As a** commercial team member
**I want** to click on a contact in the client detail and navigate to the contact's full detail page
**So that** I can access all contact information in at most 2 clicks from the client record

---

## Acceptance Criteria

1. Given the user is in the client detail view and contacts are listed in `ContactosSeccion`, When the user clicks on a contact item, Then the router navigates to `/contactos/:contactoId` showing the full contact detail. (FR22, AC-E4.2)

2. Given the user clicks a contact item, When navigation occurs, Then no more than 2 clicks from the client record are required to reach the contact detail. (NFR8, AC-E4.2)

3. Given the user navigates from client detail to a contact detail, When `/contactos/:contactoId` renders, Then `ContactoDetailView` renders with full contact data. (FR22)

4. Given the user has navigated to a contact detail, When the user clicks browser back, Then the router returns to `/clientes/:clienteId` and `ContactosSeccion` re-renders. (UX, FR30)

5. Given `ContactosSeccion` is rendered with contacts, When the user views each contact item, Then each is a keyboard-accessible link (WCAG 2.1 AA).

6. Given the contact item is a navigable link, When it renders, Then it displays at minimum the contact's `nombre` and `cargo` fields as visible text.

---

## Failing Tests Created (RED Phase)

### E2E Tests (9 tests)

**File:** `e2e/tests/clientes/navigate-client-to-contact.spec.ts`

- **Test:** AC#1 — clicking a contact item navigates to /contactos/:contactoId
  - **Status:** RED — `[data-testid="contacto-item-{id}"]` does not exist; contact items are not links
  - **Verifies:** AC #1 — router navigates to contact detail on click

- **Test:** AC#1 — URL after clicking contact item matches /contactos/:contactoId exactly
  - **Status:** RED — same as above; no navigation occurs
  - **Verifies:** AC #1 — correct URL after click

- **Test:** AC#2 — reaching contact detail from client list requires at most 2 clicks
  - **Status:** RED — contact item not clickable, navigation fails at step 2
  - **Verifies:** AC #2 — NFR8, 2-click limit

- **Test:** AC#3 — /contactos/:contactoId route renders ContactoDetailView with contact nombre
  - **Status:** RED (partial) — route exists but may pass; depends on Story 3.2 completion
  - **Verifies:** AC #3 — ContactoDetailView renders at the route

- **Test:** AC#3 — ContactoDetailView renders full contact fields (cargo, email) at the route
  - **Status:** RED (partial) — same as above
  - **Verifies:** AC #3 — full contact data rendered

- **Test:** AC#4 — browser back from contact detail returns to /clientes/:clienteId
  - **Status:** RED — clicking contact item fails before back navigation can be tested
  - **Verifies:** AC #4 — browser history back returns to client detail

- **Test:** AC#4 — ContactosSeccion re-renders after back navigation
  - **Status:** RED — same prerequisite failure
  - **Verifies:** AC #4 — contacts list visible after back

- **Test:** AC#5 — contact item link is focusable via keyboard Tab
  - **Status:** RED — no link element with `data-testid="contacto-item-{id}"` exists
  - **Verifies:** AC #5 — WCAG 2.1 AA keyboard focus

- **Test:** AC#5 — pressing Enter on a focused contact item navigates to contact detail
  - **Status:** RED — no link element exists for keyboard activation
  - **Verifies:** AC #5 — keyboard Enter triggers navigation

### Component Tests — ClienteDetailView navigation (8 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.navigation.test.tsx`

- **Test:** TC-1 — should render each contact item as a link whose href points to /contactos/{contactoId}
  - **Status:** RED — contact items are not `<a>` elements; no href attribute
  - **Verifies:** AC #1 — links exist with correct href

- **Test:** TC-1 — should navigate to /contactos/{contactoId} when user clicks a contact item
  - **Status:** RED — contact items not rendered as links
  - **Verifies:** AC #1 — click interaction

- **Test:** TC-2 — should render contact items as anchor elements (role=link), not plain divs
  - **Status:** RED — `getByRole('link', { name: /contactName/ })` returns nothing
  - **Verifies:** AC #5 — WCAG-accessible link role

- **Test:** TC-2 — should render all contact items as links within the contact list
  - **Status:** RED — items are not `<a>` tags
  - **Verifies:** AC #5 — all items navigable

- **Test:** TC-3 — should display the contact nombre inside the contact item link
  - **Status:** RED — contact items may already show nombre but not as a link (may partially pass)
  - **Verifies:** AC #6 — nombre visible

- **Test:** TC-3 — should display the contact cargo inside the contact item link
  - **Status:** RED — cargo visible check; may partially pass but link wrapping will fail
  - **Verifies:** AC #6 — cargo visible

- **Test:** TC-3 — should display both nombre and cargo together in each contact item
  - **Status:** RED — `data-testid="contacto-item-{id}"` does not exist; lookup fails
  - **Verifies:** AC #6 — both fields together

- **Test:** TC-4 — should have the contact item link as a focusable element (tabIndex not -1)
  - **Status:** RED — no link element with testid exists
  - **Verifies:** AC #5 — element in tab order

### Component Tests — ContactoDetailView back navigation (10 tests)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.backNavigation.test.tsx`

- **Test:** TC-1 — should render a "Volver al cliente" link when contact has a non-null clienteId
  - **Status:** RED — back link does not exist in ContactoDetailView
  - **Verifies:** AC #4 — back navigation affordance

- **Test:** TC-1 — should render the "Volver al cliente" link with href /clientes/{clienteId}
  - **Status:** RED — no link, no href
  - **Verifies:** AC #4 — correct href to client

- **Test:** TC-1 — should render the back link with data-testid="contacto-back-link" when clienteId is set
  - **Status:** RED — testid absent
  - **Verifies:** AC #4 — testid exists for stable selection

- **Test:** TC-2 — should render "Volver a contactos" link when contact has clienteId null
  - **Status:** RED — back link absent for null clienteId case
  - **Verifies:** AC #4 — fallback back link

- **Test:** TC-2 — should render the "Volver a contactos" link with href /contactos
  - **Status:** RED — no link present
  - **Verifies:** AC #4 — correct href for null clienteId

- **Test:** TC-2 — should NOT render "Volver al cliente" when clienteId is null
  - **Status:** RED (inverted — may pass trivially now, correct when link is added)
  - **Verifies:** AC #4 — conditional rendering

- **Test:** TC-2 — should render back link with data-testid="contacto-back-link" when clienteId is null
  - **Status:** RED — testid absent
  - **Verifies:** AC #4 — testid for null case

- **Test:** TC-3 — should render ArrowLeftIcon or navigational cue in "Volver al cliente" link
  - **Status:** RED — back link absent; SVG/icon check will fail
  - **Verifies:** AC #4, company standard (Heroicons ArrowLeftIcon)

- **Test:** TC-3 — should render ArrowLeftIcon as aria-hidden (decorative)
  - **Status:** RED — no SVG exists in back link
  - **Verifies:** AC #4, WCAG — decorative icon marked aria-hidden

- **Test:** TC-3 — should render "Volver a contactos" with ArrowLeftIcon when clienteId is null
  - **Status:** RED — back link absent for null case
  - **Verifies:** AC #4 — icon present for both link variants

---

## Data Factories Used

Reuses existing factories — no new factories needed.

### Contacto Factory

**File:** `frontend/src/test/factories/contacto.factory.ts`

**Exports used:**
- `createContacto(overrides?)` — creates single contact; supports `clienteId: string | null`
- `createContactos(count, overrides?)` — creates array of contacts
- `resetContactoCounter()` — reset in `beforeEach` for deterministic IDs

### Cliente Factory

**File:** `frontend/src/test/factories/cliente.factory.ts`

**Exports used:**
- `createCliente(overrides?)` — creates single client with `id`
- `resetClienteCounter()` — reset in `beforeEach`

### E2E Data Helpers

**File:** `e2e/helpers/data.helper.ts`

**Functions used:**
- `buildCliente(overrides?)` — build cliente payload for API creation
- `buildContacto(overrides?)` — build contacto payload for API creation

---

## Fixtures Used

Reuses existing fixtures — no new fixtures needed.

### Base E2E Fixture

**File:** `e2e/fixtures/base.fixture.ts`

Provides `clientesPage` and `contactosPage` pre-navigation fixtures. E2E tests use direct `page.goto()` for precise control.

### ApiHelper

**File:** `e2e/helpers/api.helper.ts`

Used in `afterEach` to clean up created clients and contacts: `deleteCliente(id)`, `deleteContacto(id)`.

---

## Mock Requirements

### MSW 2 Handlers (Component Tests)

Contact items use already-available MSW handlers. No new handler files needed.

**GET /api/v1/clientes/:clienteId**
- Success: returns `ClienteTestData` (JSON)
- Used in: `ClienteDetailView.navigation.test.tsx`

**GET /api/v1/contactos?clienteId={uuid}**
- Success: returns `ContactoTestData[]` (JSON)
- Empty: returns `[]`
- Used in: `ClienteDetailView.navigation.test.tsx`

**GET /api/v1/contactos/:contactoId**
- Success: returns single `ContactoTestData` with `clienteId` field
- Used in: `ContactoDetailView.backNavigation.test.tsx`

### E2E Network Interception

All E2E tests use `page.route('**/api/v1/...**', route.continue())` to pass through to the real backend. Network-first pattern applied: intercept BEFORE `page.goto()`.

---

## Required data-testid Attributes

### ClienteDetailView — ContactosSeccion contact items

- `contacto-item-{contacto.id}` — each contact item rendered as `<a>` link, one per contact in the list. Example: `data-testid="contacto-item-10000000-0000-0000-0000-000000000001"`
- `contactos-lista` — already exists (Story 4.1); container for the contact list

### ContactoDetailView — back navigation

- `contacto-back-link` — the back-navigation `<Link>` element (either "Volver al cliente" or "Volver a contactos")

**Implementation Examples:**

```tsx
// In ContactosSeccion (ClienteDetailView.tsx):
<Link
  to="/contactos/$contactoId"
  params={{ contactoId: contacto.id }}
  data-testid={`contacto-item-${contacto.id}`}
  className="block cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md px-3 py-2 transition-colors"
>
  <span className="font-medium">{contacto.nombre}</span>
  <span className="text-sm text-slate-500 ml-2">{contacto.cargo}</span>
</Link>

// In ContactoDetailView.tsx (when contacto.clienteId is set):
<Link
  to="/clientes/$clienteId"
  params={{ clienteId: contacto.clienteId! }}
  data-testid="contacto-back-link"
>
  <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
  Volver al cliente
</Link>

// In ContactoDetailView.tsx (when contacto.clienteId is null):
<Link to="/contactos" data-testid="contacto-back-link">
  <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
  Volver a contactos
</Link>
```

---

## Implementation Checklist

### Task 1 — Wrap contact items in ContactosSeccion with Link (AC #1, #2, #5, #6)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`

**Tasks to make tests pass:**

- [ ] Import `Link` from `@tanstack/react-router`
- [ ] Wrap each contact item in `ContactosSeccion` with `<Link to="/contactos/$contactoId" params={{ contactoId: contacto.id }}>`
- [ ] Add `data-testid={`contacto-item-${contacto.id}`}` to each Link element
- [ ] Render `contacto.nombre` as visible text inside the link
- [ ] Render `contacto.cargo` as visible text inside the link
- [ ] Apply TailwindCSS hover styles: `cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md px-3 py-2 transition-colors`
- [ ] Preserve existing `data-testid="contactos-lista"` on the list container
- [ ] Preserve existing "Asociar contacto" and "Desasociar" buttons from Story 4.2
- [ ] Do NOT add new API calls — use `contacto.id` from existing `useContactosByCliente` data
- [ ] Run tests: `pnpm test --run ClienteDetailView.navigation`
- [ ] Run tests: `pnpm playwright test navigate-client-to-contact`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Task 2 — Verify contactos.$contactoId.tsx route exists (AC #3)

**File:** `frontend/src/routes/_app/contactos.$contactoId.tsx`

**Tasks:**

- [ ] Confirm file exists (created in Story 3.2)
- [ ] If missing: create minimal route file pointing to `ContactoDetailView` component
- [ ] No backend changes needed — `GET /api/v1/contactos/{id}` already exists
- [ ] Run tests: `pnpm playwright test navigate-client-to-contact -- --grep "AC#3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 15 minutes

---

### Task 3 — Add back navigation to ContactoDetailView (AC #4)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`

**Tasks:**

- [ ] Import `Link` from `@tanstack/react-router`
- [ ] Import `ArrowLeftIcon` from `@heroicons/react/24/outline`
- [ ] After contact data loads, check `contacto.clienteId` field (nullable `string | null`)
- [ ] If `contacto.clienteId` is truthy: render `<Link to="/clientes/$clienteId" params={{ clienteId: contacto.clienteId }} data-testid="contacto-back-link">` with "Volver al cliente" text
- [ ] If `contacto.clienteId` is null: render `<Link to="/contactos" data-testid="contacto-back-link">` with "Volver a contactos" text
- [ ] Include `<ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />` inside both links
- [ ] All user-facing text must be in Spanish (mandatory company standard)
- [ ] Run tests: `pnpm test --run ContactoDetailView.backNavigation`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all component tests for Story 4.3
cd frontend && pnpm test --run ClienteDetailView.navigation
cd frontend && pnpm test --run ContactoDetailView.backNavigation

# Run E2E tests for Story 4.3
pnpm playwright test e2e/tests/clientes/navigate-client-to-contact.spec.ts

# Run E2E in headed mode (see browser)
pnpm playwright test e2e/tests/clientes/navigate-client-to-contact.spec.ts --headed

# Run specific AC in E2E
pnpm playwright test e2e/tests/clientes/navigate-client-to-contact.spec.ts --grep "AC#1"

# Run all story 4.3 tests
pnpm playwright test e2e/tests/clientes/navigate-client-to-contact.spec.ts && cd frontend && pnpm test --run "ClienteDetailView.navigation|ContactoDetailView.backNavigation"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ E2E tests written and failing (9 tests) — contact items not yet links
- ✅ Component tests for ClienteDetailView navigation written and failing (8 tests)
- ✅ Component tests for ContactoDetailView back navigation written and failing (10 tests)
- ✅ No new factories needed — reused existing contacto.factory.ts and cliente.factory.ts
- ✅ data-testid requirements documented
- ✅ Implementation checklist created

**Total failing tests: 27 tests across 3 files**

**Verification:** Neither `ClienteDetailView.tsx` nor `ContactoDetailView.tsx` contain the required `contacto-item-{id}` links or `contacto-back-link` element. Grep confirms no implementation exists:
- `grep "contacto-item" ClienteDetailView.tsx` → no matches
- `grep "Volver al cliente\|contacto-back-link" ContactoDetailView.tsx` → no matches

---

### GREEN Phase (DEV Team)

1. Pick one failing test (recommend starting with `TC-1` in `ClienteDetailView.navigation.test.tsx`)
2. Implement `<Link>` wrapper for contact items in `ContactosSeccion`
3. Run `pnpm test --run ClienteDetailView.navigation` — verify green
4. Implement `contacto-back-link` in `ContactoDetailView.tsx`
5. Run `pnpm test --run ContactoDetailView.backNavigation` — verify green
6. Run E2E tests after both component tests pass

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 27 tests pass
2. Check TailwindCSS hover styles are consistent with Siesa design system
3. Ensure ArrowLeftIcon import uses `@heroicons/react/24/outline` (company standard: 24/outline)
4. Confirm no hard waits in tests
5. Ensure Spanish text is consistent throughout

---

## Knowledge Base References Applied

- **network-first.md** — E2E tests intercept routes BEFORE navigation (applied in all E2E tests)
- **component-tdd.md** — Given-When-Then format, MSW 2 setup/teardown, QueryClient per test
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class selectors
- **test-quality.md** — One assertion per test (atomic), isolated with cleanup, explicit waits only
- **fixture-architecture.md** — ApiHelper + `afterEach` cleanup pattern for E2E
- **data-factories.md** — Reused existing sequential counter factories (no faker installed)

---

## Notes

- This story is **Presentation layer only** — no new API endpoints, no backend changes, no new domain entities.
- **TanStack Router mock**: Component tests mock `@tanstack/react-router` so `<Link>` renders as a real `<a>` element with `href`. This allows `toHaveAttribute('href', ...)` assertions without a real router context.
- **Story 4.2 compatibility**: Task 1 must preserve "Asociar contacto" and "Desasociar" buttons added in Story 4.2. The Link wrapper goes around each contact row, not around those action buttons.
- **contacto.clienteId field**: Already returned by `GET /api/v1/contactos/{id}` (Story 3.2). No backend change needed for conditional back navigation.
- E2E tests `AC#3` may partially pass if Story 3.2 is already implemented — this is expected and correct behavior.

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-29
