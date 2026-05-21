# ATDD Checklist — Epic 4, Story 4.5: Orphan Contacts Filter

**Date:** 2026-05-21
**Story:** 4.5 — Orphan Contacts Filter
**Epic:** 4 — Client-Contact Association & Data Quality
**Phase:** RED (failing tests written; implementation not yet started)

---

## Story Summary

**As a** commercial team member,
**I want** to filter the contact list to show only contacts not associated with any client,
**So that** I can identify and manage unassigned contacts easily.

---

## Acceptance Criteria

1. **AC1** — Given the user is on `/contactos`, When the user activates the "Sin cliente" filter toggle, Then the list shows only contacts whose `clienteId` is null (FR25) AND the count of orphan contacts is visible.

2. **AC2** — Given the "Sin cliente" filter is active, When all contacts have a client assigned, Then an `EmptyState` is displayed indicating all contacts are assigned (no orphan contacts).

3. **AC3** — Given the "Sin cliente" filter is active, When the user deactivates the filter, Then the full contact list is restored (all contacts visible regardless of `clienteId`).

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (4 tests)

**File:** `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts`

- **Test: E2E-AC-16** — "Sin cliente" filter muestra solo contactos con clienteId null
  - **Priority:** P0
  - **AC:** AC1 (FR25)
  - **Status:** RED — `data-testid="filtro-sin-cliente"` button does not exist yet in `ContactoListView`; `filterOrphanContactos()` utility does not exist; `sinClienteActive` state not wired; filter pipeline not implemented.
  - **Verifies:** `filtroSinCliente` toggle is visible at `/contactos`; clicking it shows only the 2 orphan contacts (clienteId = null); contacts with clienteId are hidden; `contactoRows.count()` equals 2.

- **Test: E2E-AC-17** — Contador de contactos sin cliente es visible y correcto cuando el filtro está activo
  - **Priority:** P0
  - **AC:** AC1
  - **Status:** RED — `data-testid="orphan-count"` badge does not exist yet; orphan count display logic in `ContactoListView` not implemented; `filterOrphanContactos(data).length` not computed.
  - **Verifies:** After filter activation, `orphanCount` element is visible; text matches `/2 sin cliente/i`; count is based on global (unfiltered) orphan dataset.

- **Test: E2E-AC-18** — EmptyState aparece cuando todos los contactos tienen cliente y el filtro está activo
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `EmptyState` variant for sinCliente filter not implemented; `ContactoListView` does not render distinct empty state when `sinClienteActive === true` and `filteredContactos.length === 0`; title "Todos los contactos tienen cliente" not present in component.
  - **Verifies:** After filter activation with no orphan contacts in DB, `EmptyState` with text `/todos los contactos tienen cliente/i` is visible; `contacto-row` count is 0.

- **Test: E2E-AC-19** — Desactivar el filtro "Sin cliente" restaura la lista completa de contactos
  - **Priority:** P1
  - **AC:** AC3
  - **Status:** RED — filter toggle deactivation logic (`setSinClienteActive(prev => !prev)`) not implemented; `useMemo` filter pipeline not updated to revert to `filterContactos(data, searchQuery)` when inactive.
  - **Verifies:** After filter activation (2 orphans visible), clicking toggle again deactivates filter; all 4 contacts are visible; both contacts-with-client and orphan contacts appear.

---

### API Integration Test — Playwright (1 test)

**File:** `e2e/tests/asociacion/asociacion-api.spec.ts` (Story 4.5 describe block appended)

- **Test: API-AC-06** — GET /api/v1/contactos?sinCliente=true devuelve solo los contactos sin cliente (FR25)
  - **Priority:** P0
  - **AC:** AC1 (FR25)
  - **Status:** RED — `?sinCliente=true` query param not supported by `ContactoEndpoints.cs`; `GetOrphanContactosQueryHandler` does not exist; `GetOrphanContactosQuery` record does not exist; `IContactoRepository.GetOrphanAsync()` not defined; endpoint dispatching logic not updated.
  - **Verifies:** Response status 200; body is JSON array; returned items all have `clienteId === null`; the 2 contacts with a clienteId are NOT in the response; the orphan contact IS in the response.

---

### Frontend Unit Tests — Vitest (4 tests)

**File:** `frontend/src/modules/crm/contactos/__tests__/filterOrphanContactos.test.ts`

- **Test: UNIT-AC-04** — returns only contacts where clienteId === null
  - **Priority:** P1
  - **AC:** AC1
  - **Status:** RED — `frontend/src/modules/crm/contactos/application/filterOrphanContactos.ts` does not exist; import will fail with `Cannot find module '../application/filterOrphanContactos'`.
  - **Verifies:** `filterOrphanContactos(mixedContacts)` returns exactly 2 items; all items have `clienteId === null`; contacts with non-null `clienteId` are excluded.

- **Test: UNIT-AC-04b** — does NOT include contacts with a non-null clienteId
  - **Priority:** P1
  - **AC:** AC1
  - **Status:** RED — same root cause as UNIT-AC-04.
  - **Verifies:** Contacts with `clienteId` set to a UUID string are not returned.

- **Test: UNIT-AC-04c** — returns empty array when all contacts have a clienteId
  - **Priority:** P1
  - **AC:** AC1 / AC2
  - **Status:** RED — same root cause.
  - **Verifies:** When all input contacts have non-null `clienteId`, returns empty array.

- **Test: UNIT-AC-05** — returns empty array when input is empty — no error thrown
  - **Priority:** P1
  - **AC:** AC1
  - **Status:** RED — same root cause as UNIT-AC-04; module does not exist.
  - **Verifies:** `filterOrphanContactos([])` does not throw; returns `[]`; result is a proper array.

---

### Backend Unit Tests — xUnit (2 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/GetOrphanContactosQueryHandlerTests.cs`

- **Test: UNIT-B-AC-ORPHAN-01** — HandleAsync_WithOrphanContactos_ReturnsOnlyOrphanDtos
  - **Priority:** P1
  - **AC:** AC1
  - **Status:** RED — `GetOrphanContactosQueryHandler` class does not exist; `GetOrphanContactosQuery` record does not exist; `IContactoRepository.GetOrphanAsync()` method not defined; compile error: `CS0246`.
  - **Verifies:** Handler returns `ContactoDto[]` with exactly 2 items when repo `GetOrphanAsync` returns 2 orphans; all dtos have `ClienteId == null`; the contact with a clienteId is NOT in the result.

- **Test: UNIT-B-AC-ORPHAN-02** — HandleAsync_WithNoOrphanContactos_ReturnsEmptyCollection
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — same root cause as UNIT-B-AC-ORPHAN-01; compile error: `CS0246`.
  - **Verifies:** Handler returns empty collection when `GetOrphanAsync` returns empty; no exception thrown.

---

## Data Infrastructure

### Data Factories (Existing — Reused)

**File:** `e2e/helpers/data.helper.ts`

The `buildContacto()` and `buildCliente()` factories already exist and are reused without modification. `buildContacto` accepts `clienteId: string | null` override to create both orphan and assigned contacts.

### API Helper (Existing — Reused)

**File:** `e2e/helpers/api.helper.ts`

Existing `createContacto()`, `deleteContacto()`, `createCliente()`, and `deleteCliente()` methods are reused. No new helper methods required.

### Page Object Model (Updated)

**File:** `e2e/pages/contactos.page.ts`

Added two new locators:
- `filtroSinCliente`: `page.getByTestId('filtro-sin-cliente')` (updated from role-based selector)
- `orphanCount`: `page.getByTestId('orphan-count')` (NEW)

---

## Mock Requirements

### Network-First Interception

All E2E tests intercept `**/api/v1/contactos**` with `route.continue()` BEFORE `page.goto()` to prevent race conditions:

```typescript
await page.route('**/api/v1/contactos**', (route) => route.continue());
await page.goto('/contactos');
```

No external service mocking required — all tests hit the real backend API.

---

## Required data-testid Attributes

### ContactoListView (`frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`)

| Attribute | Element | Notes |
|---|---|---|
| `filtro-sin-cliente` | Toggle button — activates orphan filter | NEW — must be added |
| `orphan-count` | Span/badge showing orphan count | NEW — must be added; only visible when filter is active |

**Implementation example:**
```tsx
<button
  type="button"
  data-testid="filtro-sin-cliente"
  aria-pressed={sinClienteActive}
  aria-label="Filtrar contactos sin cliente"
  onClick={() => setSinClienteActive(prev => !prev)}
  className={
    sinClienteActive
      ? 'px-3 py-1 rounded text-sm font-medium bg-[#0e79fd] text-white'
      : 'px-3 py-1 rounded text-sm font-medium bg-slate-100 text-slate-700'
  }
>
  Sin cliente
</button>

{sinClienteActive && (
  <span data-testid="orphan-count" className="text-xs text-slate-500">
    {orphanCount} sin cliente
  </span>
)}
```

---

## Implementation Checklist

### Test: E2E-AC-16 — Filter shows only orphan contacts (P0)

**File:** `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts`

- [ ] Create `frontend/src/modules/crm/contactos/application/filterOrphanContactos.ts`
  - [ ] Signature: `filterOrphanContactos(contacts: Contacto[]): Contacto[]`
  - [ ] Implementation: `return contacts.filter(c => c.clienteId === null)`
- [ ] Add `sinClienteActive` state to `ContactoListView`: `const [sinClienteActive, setSinClienteActive] = useState(false)`
- [ ] Add "Sin cliente" toggle button with `data-testid="filtro-sin-cliente"` and `aria-pressed={sinClienteActive}`
- [ ] Update `useMemo` filter pipeline: when `sinClienteActive === true`, apply `filterOrphanContactos(filterContactos(data, searchQuery))`
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-16"`
- [ ] Test passes (green phase)

---

### Test: E2E-AC-17 — Orphan count badge is visible and correct (P0)

**File:** `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts`

- [ ] Compute `orphanCount` in `ContactoListView`: `const orphanCount = useMemo(() => filterOrphanContactos(data).length, [data])`
  - [ ] Note: count is based on full unfiltered `data`, NOT on `filteredContactos` (global orphan count, not search-dependent)
- [ ] Render orphan count badge when `sinClienteActive === true`:
  ```tsx
  {sinClienteActive && (
    <span data-testid="orphan-count">{orphanCount} sin cliente</span>
  )}
  ```
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-17"`
- [ ] Test passes (green phase)

---

### Test: E2E-AC-18 — EmptyState when all contacts have client (P1)

**File:** `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts`

- [ ] Add EmptyState variant in `ContactoListView` for the case when filter is active and no results:
  ```tsx
  {filteredContactos.length === 0 && sinClienteActive && (
    <EmptyState
      title="Todos los contactos tienen cliente"
      description="No hay contactos sin cliente asignado."
    />
  )}
  ```
- [ ] Preserve existing EmptyState for no-filter case:
  ```tsx
  {filteredContactos.length === 0 && !sinClienteActive && (
    <EmptyState title="No hay contactos registrados" description="Crea el primer contacto para comenzar." />
  )}
  ```
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-18"`
- [ ] Test passes (green phase)

---

### Test: E2E-AC-19 — Deactivating filter restores full list (P1)

**File:** `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts`

- [ ] Verify `setSinClienteActive(prev => !prev)` is wired to the toggle button `onClick` (toggle behavior — same button activates and deactivates)
- [ ] Verify that when `sinClienteActive === false`, the `useMemo` pipeline returns `filterContactos(data, searchQuery)` (existing behavior unchanged)
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-19"`
- [ ] Test passes (green phase)

---

### Test: API-AC-06 — GET ?sinCliente=true returns only orphan contacts (P0)

**File:** `e2e/tests/asociacion/asociacion-api.spec.ts`

- [ ] Add `GetOrphanContactosQuery.cs` in `backend/src/SiesaAgents.Application/Contactos/Queries/`:
  ```csharp
  public record GetOrphanContactosQuery();
  ```
- [ ] Add `GetOrphanContactosQueryHandler.cs` — calls `IContactoRepository.GetOrphanAsync(ct)`, maps to `ContactoDto[]`
- [ ] Add `GetOrphanAsync(CancellationToken ct): Task<IEnumerable<ContactoEntity>>` to `IContactoRepository` interface
- [ ] Implement `GetOrphanAsync` in `ContactoRepository.cs`:
  ```csharp
  public async Task<IEnumerable<ContactoEntity>> GetOrphanAsync(CancellationToken ct)
      => await _context.Contactos
          .AsNoTracking()
          .Where(c => c.ClienteId == null)
          .OrderByDescending(c => c.CreatedAt)
          .ToListAsync(ct);
  ```
- [ ] Update `GET /` endpoint in `ContactoEndpoints.cs` to accept `?sinCliente=true` and dispatch `GetOrphanContactosQueryHandler`
- [ ] Register `GetOrphanContactosQueryHandler` in `Program.cs` DI
- [ ] Run test: `npx playwright test e2e/tests/asociacion/asociacion-api.spec.ts --grep "API-AC-06"`
- [ ] Test passes (green phase)

---

### Test: UNIT-AC-04 / UNIT-AC-05 — filterOrphanContactos utility (P1)

**File:** `frontend/src/modules/crm/contactos/__tests__/filterOrphanContactos.test.ts`

- [ ] Create `frontend/src/modules/crm/contactos/application/filterOrphanContactos.ts`:
  ```typescript
  import { Contacto } from '../domain/Contacto'
  export function filterOrphanContactos(contacts: Contacto[]): Contacto[] {
    return contacts.filter(c => c.clienteId === null)
  }
  ```
- [ ] Run tests: `pnpm --filter frontend test src/modules/crm/contactos/__tests__/filterOrphanContactos.test.ts`
- [ ] All 4 unit tests pass (green phase)

---

### Test: UNIT-B-AC-ORPHAN-01 / UNIT-B-AC-ORPHAN-02 — GetOrphanContactosQueryHandler (P1)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/GetOrphanContactosQueryHandlerTests.cs`

- [ ] Add `GetOrphanAsync` to `IContactoRepository` interface (required to compile)
- [ ] Create `GetOrphanContactosQuery` record
- [ ] Create `GetOrphanContactosQueryHandler` class with `HandleAsync` method
- [ ] Implement `GetOrphanAsync` in `ContactoRepository.cs`
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "GetOrphanContactos"`
- [ ] Both unit tests pass (green phase)

---

## Running Tests

```bash
# Run all failing E2E tests for Story 4.5
npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts

# Run Story 4.5 API test only
npx playwright test e2e/tests/asociacion/asociacion-api.spec.ts --grep "Story 4.5"

# Run all Story 4.5 E2E tests in headed mode
npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --headed

# Run specific test by ID
npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-16"
npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-17"
npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-18"
npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-19"

# Run frontend unit tests
pnpm --filter frontend test src/modules/crm/contactos/__tests__/filterOrphanContactos.test.ts

# Run backend unit tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "GetOrphanContactos"

# Debug a specific test
npx playwright test e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts --grep "E2E-AC-16" --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- E2E tests written in `e2e/tests/asociacion/asociacion-filtro-huerfanos.spec.ts` (4 tests — NEW)
- API integration test added to `e2e/tests/asociacion/asociacion-api.spec.ts` — Story 4.5 describe block (1 test — NEW)
- Frontend unit tests written in `frontend/src/modules/crm/contactos/__tests__/filterOrphanContactos.test.ts` (4 tests — NEW)
- Backend unit tests written in `backend/tests/SiesaAgents.UnitTests/Handlers/GetOrphanContactosQueryHandlerTests.cs` (2 tests — NEW)
- Network-first intercept pattern applied in all E2E tests
- `buildContacto()` and `buildCliente()` factories reused with auto-cleanup via tracked ID arrays + `test.afterEach`
- `data-testid` requirements documented
- ContactosPage POM updated with `filtroSinCliente` (data-testid based) and `orphanCount` locators
- Implementation checklist created per test

**Expected RED-phase failure messages:**

- `E2E-AC-16`: `Error: Timed out waiting for expect(locator).toBeVisible() — Locator: getByTestId('filtro-sin-cliente')` — toggle button does not exist yet
- `E2E-AC-17`: same as E2E-AC-16 root cause
- `E2E-AC-18`: same as E2E-AC-16 root cause
- `E2E-AC-19`: same as E2E-AC-16 root cause
- `API-AC-06`: `Error: expect(received).toBe(200) — received 400 or 404` — `?sinCliente=true` param not handled by endpoint
- `UNIT-AC-04`: `Error: Cannot find module '../application/filterOrphanContactos'`
- `UNIT-AC-05`: `Error: Cannot find module '../application/filterOrphanContactos'`
- `UNIT-B-AC-ORPHAN-01`: `CS0246: The type or namespace name 'GetOrphanContactosQueryHandler' could not be found`
- `UNIT-B-AC-ORPHAN-02`: `CS0246: The type or namespace name 'GetOrphanContactosQueryHandler' could not be found`

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Start with `filterOrphanContactos.ts`** — pure utility, no dependencies; makes UNIT-AC-04/05 pass immediately
2. **Add `GetOrphanAsync` to `IContactoRepository` + implement** — makes backend unit tests compile
3. **Create `GetOrphanContactosQuery` + handler** — makes UNIT-B-AC-ORPHAN-01/02 pass
4. **Update `ContactoEndpoints.cs` + register handler in DI** — makes API-AC-06 pass
5. **Add `sinClienteActive` state + toggle button to `ContactoListView`** — unblocks all E2E tests
6. **Update `useMemo` filter pipeline** — makes E2E-AC-16 and E2E-AC-19 pass
7. **Add orphan count badge** — makes E2E-AC-17 pass
8. **Add EmptyState variant** — makes E2E-AC-18 pass

**Key Principles:**
- One test at a time (start with P0, then P1)
- Run `npx playwright test` after each implementation step
- Filter pipeline: `filterContactos` first (search), then `filterOrphanContactos` (orphan filter)
- Count badge: use `filterOrphanContactos(data).length` — NOT `filteredContactos.length` (global count, search-independent)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 9 tests pass (4 E2E + 1 API + 4 frontend unit)
2. Verify no regressions in Stories 3.1, 4.1–4.4 tests
3. Confirm `useMemo` dependency arrays include `sinClienteActive` and `data`
4. Confirm `orphanCount` computation is memoized separately from `filteredContactos`
5. Run full test suite to confirm no regressions

---

## Knowledge Base References Applied

- **network-first** — Route interception BEFORE navigation in all E2E tests
- **data-factories** — `buildContacto()` / `buildCliente()` factories with counter-based unique IDs and override support
- **fixture-architecture** — `createdIds` arrays + `test.afterEach` for auto-cleanup
- **test-quality** — Given-When-Then structure; explicit waits only; no hard sleeps; `page.on('pageerror')` listener in all E2E tests
- **selector-resilience** — All selectors use `data-testid`; no CSS class selectors; POM updated with correct locators
- **test-levels-framework** — E2E for user journey (AC1/AC2/AC3); API for contract/backend filter validation (AC1/FR25); Unit for pure utility function and handler isolation

---

**Generated by BMad TEA Agent** — 2026-05-21
