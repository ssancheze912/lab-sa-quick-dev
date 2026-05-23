# ATDD Checklist - Epic 4, Story 4.4: View Associated Client from Contact Detail

**Date:** 2026-05-21
**Author:** SiesaTeam
**Primary Test Level:** E2E

---

## Story Summary

A commercial team member needs to see which client a contact is associated with directly from the contact detail view at `/contactos/:contactoId`. The `ContactoDetailPanel` (established in Story 3.2) is extended with a new "Cliente" section: when `clienteId` is present, a navigable link to `/clientes/:clienteId` renders with the client's `nombre`; when `clienteId` is null, "Sin cliente asignado" renders inline. No additional search or navigation is required to see this information (NFR9).

**As a** commercial team member
**I want** to see which client a contact is associated with directly from the contact detail view
**So that** I can understand the relationship without additional navigation

---

## Acceptance Criteria

1. **AC1** — Given a contact is associated with a client, When the user views the contact detail at `/contactos/:contactoId`, Then the associated client's name is displayed in the contact detail (FR23) And no additional search or navigation is required to see this information (NFR9).

2. **AC2** — Given the associated client name is displayed, When the user clicks on the client name link, Then the user is navigated to `/clientes/:clienteId` showing the full client detail in 1 click (FR24).

3. **AC3** — Given a contact has no associated client, When the user views the contact detail, Then a message "Sin cliente asignado" is displayed in place of the client name (FR23).

---

## Failing Tests Created (RED Phase)

### E2E Tests (3 tests)

**File:** `e2e/tests/asociacion/asociacion-navegacion.spec.ts` (Story 4.4 scope — appended)

- **Test:** E2E-AC-13 — Contact detail shows associated client name when contact has a client [RED]
  - **Status:** RED — `data-testid="clienteAsociadoLink"` does not exist yet; `ContactoDetailPanel` does not yet render the "Cliente" section; `useClienteById` hook may not be wired in the component
  - **Verifies:** AC1 — `contacto-detail-panel` is visible; `clienteAsociadoLink` is visible and contains the client's `nombre`; `sin-cliente-asignado` is NOT attached to the DOM (FR23, NFR9)
  - **Priority:** P0

- **Test:** E2E-AC-14 — Clicking client name link in contact detail navigates to /clientes/:clienteId in 1 click [RED]
  - **Status:** RED — `clienteAsociadoLink` does not exist; TanStack Router `<Link>` to `/clientes/$clienteId` not rendered; `aria-label="Ir al cliente asociado"` absent; `cliente-detail-panel` not reachable from this flow
  - **Verifies:** AC2 — `clienteAsociadoLink` has `aria-label="Ir al cliente asociado"` (WCAG 2.1 AA); clicking navigates to `/clientes/:clienteId` without page reload; `cliente-detail-panel` is visible at destination (FR24)
  - **Priority:** P0

- **Test:** E2E-AC-15 — Contact detail shows "Sin cliente asignado" when contact has no associated client [RED]
  - **Status:** RED — `data-testid="sin-cliente-asignado"` does not exist yet; ContactoDetailPanel does not render the null-clienteId fallback; `clienteAsociadoLink` should not exist (but absence can't be confirmed until implementation)
  - **Verifies:** AC3 — `sin-cliente-asignado` is visible with text matching `/sin cliente asignado/i`; `clienteAsociadoLink` is NOT attached to the DOM (FR23)
  - **Priority:** P1

---

## Data Factories Used

### Cliente Factory

**File:** `e2e/helpers/data.helper.ts` (existing — reused)

**Exports:**
- `buildCliente(overrides?)` — Creates a client payload with unique nombre, nit, telefono, ciudad

### Contacto Factory

**File:** `e2e/helpers/data.helper.ts` (existing — reused)

**Exports:**
- `buildContacto(overrides?)` — Creates a contact payload; `clienteId` defaults to `null`

**Story 4.4 usage:**
- E2E-AC-13 & E2E-AC-14: `buildContacto({ clienteId: cliente.id })` — contact associated to a known client
- E2E-AC-15: `buildContacto({ clienteId: null })` — orphan contact with no client

---

## Fixtures Used

### ApiHelper (Setup/Teardown)

**File:** `e2e/helpers/api.helper.ts` (existing — reused)

**Methods used in Story 4.4 tests:**
- `createCliente(data)` — POST /api/v1/clientes → returns created client
- `createContacto(data)` — POST /api/v1/contactos with optional `clienteId`
- `deleteCliente(id)` — teardown in `afterEach`
- `deleteContacto(id)` — teardown in `afterEach`

**Note:** `asignarClienteAContacto()` is NOT used in Story 4.4 — the association is set at contact creation time via `clienteId` field in the POST payload (established in Story 3.2 API contract).

**Auto-cleanup pattern:**
```typescript
test.afterEach(async () => {
  for (const id of createdContactoIds) {
    await apiHelper.deleteContacto(id).catch(() => null);
  }
  for (const id of createdClienteIds) {
    await apiHelper.deleteCliente(id).catch(() => null);
  }
  createdContactoIds.length = 0;
  createdClienteIds.length = 0;
});
```

---

## Mock Requirements

### Network Intercept — Contact Detail (pass-through)

**Used in:** E2E-AC-13, E2E-AC-14, E2E-AC-15

**Pattern (network-first — intercept before navigation):**
```typescript
await page.route(`**/api/v1/contactos/${contacto.id}`, async (route) => {
  await route.continue(); // pass-through for real API call
});
await page.route(`**/api/v1/clientes/${cliente.id}`, async (route) => {
  await route.continue(); // pass-through for real API call
});
// THEN navigate
await page.goto(`/contactos/${contacto.id}`);
```

**Critical:** All route intercepts must be set BEFORE `page.goto()` (network-first pattern per ATDD rules).

---

## Required data-testid Attributes

### ContactoDetailPanel Component

The following `data-testid` attributes must be added to `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`:

- `contacto-detail-panel` — Root container (may already exist from Story 3.2)
- `clienteAsociadoLink` — The TanStack Router `<Link>` pointing to `/clientes/$clienteId`; must have `aria-label="Ir al cliente asociado"` (WCAG 2.1 AA); rendered when `data.clienteId` is non-null and cliente data is loaded
- `sin-cliente-asignado` — The `<span>` with "Sin cliente asignado" text; rendered when `data.clienteId` is null or undefined

**Implementation Example:**
```tsx
{data.clienteId === null || data.clienteId === undefined ? (
  <span data-testid="sin-cliente-asignado" className="text-sm text-slate-400 italic">
    Sin cliente asignado
  </span>
) : isClienteLoading ? (
  <Skeleton width="50%" height={16} /> // react-loading-skeleton — NOT a spinner
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
```

### POM Locators (Already Present)

**File:** `e2e/pages/contactos.page.ts`

Both locators are already defined in the POM — no changes needed:
```typescript
readonly clienteAsociadoLink: Locator; // page.getByTestId('clienteAsociadoLink')
readonly sinClienteAsignado: Locator;  // page.getByTestId('sin-cliente-asignado')
```

---

## Implementation Checklist

### Test: E2E-AC-13 (Contact detail shows associated client name — AC1)

**File:** `e2e/tests/asociacion/asociacion-navegacion.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `ContactoDto` in `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs` includes `ClienteId: Guid?` — `GET /api/v1/contactos/:id` must return `"clienteId": "uuid-or-null"` (Story 3.2 scope, no change if present)
- [ ] Verify `GET /api/v1/clientes/{id}` endpoint returns 200 + `ClienteDto` with `id` and `nombre` fields (Story 2.2 scope, no change if present)
- [ ] Verify or create `frontend/src/modules/crm/clientes/application/useClienteById.ts` with `queryKey: ['clientes', id]` and `enabled: !!id`
- [ ] Update `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx`:
  - Call `useClienteById(data?.clienteId ?? undefined)` inside the component
  - Add "Cliente" section below existing fields (Nombre, Cargo, Teléfono, Email)
  - Render `<Link data-testid="clienteAsociadoLink" aria-label="Ir al cliente asociado" ...>` when `clienteId` is non-null and data is loaded
  - Render `<Skeleton>` (react-loading-skeleton, 1 row) while `useClienteById` is loading
  - Render `<span data-testid="sin-cliente-asignado">Sin cliente asignado</span>` when `clienteId` is null
- [ ] Apply label "Cliente" (Spanish, `text-xs text-slate-500 uppercase tracking-wide`) above the value
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-13"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1–2 hours (leverages existing Story 3.2 + 2.2 infrastructure)

---

### Test: E2E-AC-14 (Clicking client link navigates to client detail — AC2)

**File:** `e2e/tests/asociacion/asociacion-navegacion.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm TanStack Router `<Link>` uses `to="/clientes/$clienteId"` with `params={{ clienteId: data.clienteId }}` — do NOT use `<a href>` (TanStack Router only)
- [ ] Confirm `aria-label="Ir al cliente asociado"` is on the `<Link>` element (WCAG 2.1 AA)
- [ ] Confirm `data-testid="clienteAsociadoLink"` is on the `<Link>` element
- [ ] Confirm `/clientes/$clienteId` route exists and renders `ClienteDetailView` with `data-testid="cliente-detail-panel"` (Story 2.2 scope)
- [ ] No `page.reload()` in the flow — SPA navigation via TanStack Router
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-14"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours (routing already exists from Story 2.2)

---

### Test: E2E-AC-15 ("Sin cliente asignado" for orphan contact — AC3)

**File:** `e2e/tests/asociacion/asociacion-navegacion.spec.ts`

**Tasks to make this test pass:**

- [ ] `ContactoDetailPanel` renders `<span data-testid="sin-cliente-asignado">Sin cliente asignado</span>` when `data.clienteId` is `null` or `undefined`
- [ ] The "Cliente" label section is still rendered (label visible); only the value changes to the "Sin cliente asignado" span
- [ ] `useClienteById` is NOT called when `clienteId` is null (no unnecessary API request): `enabled: !!id` in the hook prevents the fetch
- [ ] `data-testid="clienteAsociadoLink"` is NOT rendered in DOM when `clienteId` is null
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-15"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours (same component change as E2E-AC-13)

---

## Running Tests

```bash
# Run all Story 4.4 failing tests
npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-13|E2E-AC-14|E2E-AC-15"

# Run all Story 4.3 + 4.4 navigation tests
npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts

# Run only E2E-AC-13
npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-13"

# Run in headed mode (see browser)
npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --headed --grep "E2E-AC-13"

# Debug a specific test
npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --debug --grep "E2E-AC-14"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 3 tests written and failing
- E2E tests: 3 tests appended to `e2e/tests/asociacion/asociacion-navegacion.spec.ts` (E2E-AC-13, E2E-AC-14, E2E-AC-15)
- Network-first intercept pattern applied in all tests
- Auto-cleanup via `afterEach` in spec file (existing + new tests share the same teardown)
- Data factories reused from `e2e/helpers/data.helper.ts`
- `page.on('pageerror', ...)` listener in all 3 tests
- POM locators already present in `e2e/pages/contactos.page.ts`
- Mock requirements documented
- Required `data-testid` attributes listed
- Implementation checklist created

**Verification:**
- E2E-AC-13 fails: `expect(page.getByTestId('clienteAsociadoLink')).toBeVisible()` times out — element not in DOM; `ContactoDetailPanel` does not render "Cliente" section
- E2E-AC-14 fails: Same cause as E2E-AC-13; additionally `aria-label` assertion and URL navigation assertion fail
- E2E-AC-15 fails: `expect(page.getByTestId('sin-cliente-asignado')).toBeVisible()` times out — `ContactoDetailPanel` does not render the null-clienteId fallback

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Verify existing hooks** — Confirm `useClienteById` exists (Story 2.2); create if missing (0.25h)
2. **Update `ContactoDetailPanel.tsx`** — Add "Cliente" section with link/skeleton/fallback (1–1.5h)
3. **Verify backend** — Confirm `GET /api/v1/contactos/:id` returns `clienteId` and `GET /api/v1/clientes/:id` returns `nombre` (Story 3.2 + 2.2 scope; no changes expected)
4. **Run E2E-AC-15 first** — Fastest to go green (no client fetch needed; only null-check)
5. **Run E2E-AC-13** — Requires both contact and client API calls to succeed
6. **Run E2E-AC-14** — Builds on E2E-AC-13; checks navigation and aria-label

**Key Anti-Patterns to Avoid:**
- Do NOT use `<a href>` — use TanStack Router `<Link>`
- Do NOT use a spinner for loading state — use `react-loading-skeleton` (1 skeleton row)
- Do NOT show "Cliente" label in English — "Cliente" (Spanish mandatory)
- Do NOT fetch cliente unconditionally — `enabled: !!data?.clienteId`
- Do NOT call `page.reload()` in tests — SPA navigation only
- Do NOT expose UUID as display text — show `cliente.nombre`; fallback to `data.clienteId` only if `nombre` unavailable

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 3 tests pass (E2E-AC-13, E2E-AC-14, E2E-AC-15)
2. Confirm `useClienteById` query key matches canonical `['clientes', id]` pattern (not string key)
3. Ensure `data-testid` attributes match POM locators in `contactos.page.ts`
4. Run full navigation spec: `npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts`
5. Confirm no regressions in Story 4.3 tests (E2E-AC-10, E2E-AC-11, E2E-AC-12)
6. Confirm WCAG 2.1 AA: `aria-label="Ir al cliente asociado"` on the `<Link>` element
7. Run full E2E suite to confirm no regressions

---

## Next Steps

1. **Confirm RED phase** — Run failing tests:
   ```bash
   npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-13|E2E-AC-14|E2E-AC-15"
   ```
2. **Begin implementation** — Update `ContactoDetailPanel.tsx` with "Cliente" section
3. **Check `useClienteById`** — Verify or create in `frontend/src/modules/crm/clientes/application/`
4. **Run E2E-AC-15 first** — Quickest green (no client fetch, only null branch)
5. **Run full story tests** after all 3 tests pass
6. When all tests pass, update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first** — Route interception patterns: intercept BEFORE navigation (applied in all 3 E2E tests)
- **fixture-architecture** — Auto-cleanup pattern via `afterEach` (reused from existing spec teardown)
- **data-factories** — Factory patterns with unique IDs (`buildCliente`, `buildContacto` in `data.helper.ts`)
- **test-quality** — Given-When-Then structure, explicit waits (`expect(...).toBeVisible()`), `page.on('pageerror', ...)` listener
- **selector-resilience** — `data-testid` selectors exclusively; no CSS class selectors
- **test-levels-framework** — E2E only for Story 4.4 scope (no new backend endpoints; no new adapter classes; only ContactoDetailPanel UI extension)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**E2E test command:**
```bash
npx playwright test e2e/tests/asociacion/asociacion-navegacion.spec.ts --grep "E2E-AC-13|E2E-AC-14|E2E-AC-15"
```

**Expected failures:**
- E2E-AC-13: `expect(page.getByTestId('clienteAsociadoLink')).toBeVisible()` → `TimeoutError` — element not rendered
- E2E-AC-14: `expect(page.getByTestId('clienteAsociadoLink')).toBeVisible()` → `TimeoutError` — same cause
- E2E-AC-15: `expect(page.getByTestId('sin-cliente-asignado')).toBeVisible()` → `TimeoutError` — element not rendered

**Summary:**
- Total Story 4.4 tests: 3 (all E2E)
- Passing: 0 (expected — RED phase)
- Failing: 3 (expected)
- Status: RED phase — tests define behavior BEFORE implementation

---

## Notes

- Story 4.4 has no new API endpoints and no new adapter classes — it is purely a `ContactoDetailPanel` UI extension. Therefore, no API integration tests or unit tests are needed beyond the 3 E2E tests.
- The `useClienteById` hook is expected to already exist from Story 2.2 (`useCliente` or `useClienteById`). If absent, it must be created before the GREEN phase.
- All E2E tests use real API calls for data setup (no mocks for the happy-path data); only network intercepts for pass-through are used to prevent race conditions.
- `data-testid="contacto-detail-panel"` (root panel) is expected to already exist from Story 3.2. Only `clienteAsociadoLink` and `sin-cliente-asignado` are new.
- E2E-AC-14 asserts `cliente-detail-panel` is visible after navigation — this confirms the client detail route renders correctly (Story 2.2 infrastructure).
- All Spanish text assertions use case-insensitive regex (`/sin cliente asignado/i`).
- Story 4.3 tests (E2E-AC-10, E2E-AC-11, E2E-AC-12) are in the same spec file and must remain unaffected.

---

**Generated by BMad TEA Agent** — 2026-05-21
