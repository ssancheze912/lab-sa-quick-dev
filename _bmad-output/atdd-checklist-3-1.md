# ATDD Checklist - Epic 3, Story 3.1: Contact List & Search

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + RTL + MSW) + API (xUnit + WebApplicationFactory) + E2E (Playwright)

---

## Story Summary

As a commercial team member, I want to see a list of all contacts and search them by name or email, so that I can quickly find any contact regardless of their client association. The view is a full-page list at `/contactos` (not a side panel) showing Nombre, Cargo, and Email per item with real-time client-side filtering.

**As a** commercial team member
**I want** to see a list of all contacts and search them by name or email
**So that** I can quickly find any contact regardless of their client association

---

## Acceptance Criteria

1. **AC#1** — Given there are contacts in the system, When the user navigates to `/contactos`, Then a list of all contacts is displayed showing `Nombre`, `Cargo`, and `Email` per item (FR10).

2. **AC#2** — Given the contact list is loaded, When the user types in the search field, Then the list filters in real time (client-side, no API call) showing only contacts whose `Nombre` or `Email` match the input, and results appear in under 1 second with up to 1,000 records (NFR1, FR11, FR12).

3. **AC#3** — Given there are no contacts in the system, When the user navigates to `/contactos`, Then an `EmptyState` component is displayed guiding the user to create the first contact, and no list items are rendered.

4. **AC#4** — Given the backend is unavailable when the page loads, When the fetch fails (any HTTP error or network error), Then an `ErrorPanel` component is displayed with a "Reintentar" button instead of the list, and clicking "Reintentar" triggers a new fetch.

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `e2e/tests/contactos/contactos-list-search.spec.ts`

- **Test:** TC-E3-3-1-E2E-1 — should render full-page contact list with Nombre, Cargo, and Email per item
  - **Status:** RED — `data-testid="contacto-list-item"` does not exist; `/contactos` route and `ContactoListView` not implemented
  - **Verifies:** AC#1 — full-page list at `/contactos` shows Nombre, Cargo, Email per item
  - **Priority:** P0

- **Test:** TC-E3-3-1-E2E-2 — should filter contact list by nombre in real time within 1 second (NFR1)
  - **Status:** RED — search input placeholder `/buscar por nombre o email/i` and filter logic not implemented
  - **Verifies:** AC#2 — real-time filter by nombre, results in <1s
  - **Priority:** P1

- **Test:** TC-E3-3-1-E2E-3 — should filter contact list by email in real time within 1 second
  - **Status:** RED — filter by email not implemented
  - **Verifies:** AC#2 — real-time filter by email, results in <1s
  - **Priority:** P1

- **Test:** TC-E3-3-1-E2E-4 — should show EmptyState when there are no contacts in the system
  - **Status:** RED — `data-testid="empty-state"` expected when API returns `[]`
  - **Verifies:** AC#3 — EmptyState shown when no data
  - **Priority:** P1

- **Test:** TC-E3-3-1-E2E-5 — should show ErrorPanel with "Reintentar" button when backend returns 500
  - **Status:** RED — `data-testid="error-panel"` and "Reintentar" button not implemented
  - **Verifies:** AC#4 — ErrorPanel shown on fetch failure
  - **Priority:** P1

- **Test:** TC-E3-3-1-E2E-6 — should trigger a new fetch when "Reintentar" is clicked after an error
  - **Status:** RED — retry logic via `refetch` on `useContactos` not implemented
  - **Verifies:** AC#4 — clicking Reintentar triggers new GET
  - **Priority:** P1

### API Tests (3 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/GetContactosApiTests.cs`

- **Test:** GetContactos_WhenContactoExists_Returns200WithNombreCargoEmailFields (TC-E3-3-1-API-1)
  - **Status:** RED — `GET /api/v1/contactos` endpoint does not exist; `ContactoEntity` and migration not implemented
  - **Verifies:** AC#1 — GET returns 200 with array items containing nombre, cargo, email
  - **Priority:** P0

- **Test:** PostContacto_ThenGetContactos_ReturnsCreatedContactInList (TC-E3-3-1-API-2)
  - **Status:** RED — `POST /api/v1/contactos` and re-GET not implemented
  - **Verifies:** AC#1 — created contact appears in list
  - **Priority:** P0

- **Test:** ContactosTable_WhenMigrationApplied_HasNullableClienteIdColumnAndIndexes (TC-E3-3-1-API-3)
  - **Status:** RED — EF Core migration for `contactos` table not created
  - **Verifies:** Database schema — nullable `cliente_id`, indexes `ix_contactos_cliente_id` and `ix_contactos_email`
  - **Priority:** P2

### Component Tests (13 tests)

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoListView.test.tsx`

- **Test:** TC-E3-3-1-CMP-1 — should filter 1,000 records in ≤150ms when user types in search field
  - **Status:** RED — `ContactoListView` not implemented; `useMemo` filter not present
  - **Verifies:** AC#2 + NFR1 R-003 — search performance with 1,000 records ≤150ms
  - **Priority:** P0

- **Test:** TC-E3-3-1-CMP-2 — should show only matching items when user types nombre in search field
  - **Status:** RED — `ContactoListView` not implemented
  - **Verifies:** AC#2 — filter by nombre partial match
  - **Priority:** P1

- **Test:** should show all items when search field is cleared
  - **Status:** RED — `ContactoListView` not implemented
  - **Verifies:** AC#2 — clearing search restores full list

- **Test:** TC-E3-3-1-CMP-3 — should show only matching items when user types email fragment in search field
  - **Status:** RED — `ContactoListView` not implemented
  - **Verifies:** AC#2 — filter by email partial match
  - **Priority:** P1

- **Test:** TC-E3-3-1-CMP-4 — should show EmptyState component and no list items when data is empty
  - **Status:** RED — `ContactoListView` and `EmptyState` (verify from Story 2.1) not wired
  - **Verifies:** AC#3 — EmptyState shown on empty data
  - **Priority:** P1

- **Test:** TC-E3-3-1-CMP-5 — should show ErrorPanel with "Reintentar" button when fetch returns 500
  - **Status:** RED — `ContactoListView` and `ErrorPanel` (verify from Story 2.1) not wired
  - **Verifies:** AC#4 — ErrorPanel shown on 500
  - **Priority:** P1

- **Test:** should show ErrorPanel when network request fails completely
  - **Status:** RED — `ContactoListView` error handling not implemented
  - **Verifies:** AC#4 — ErrorPanel shown on network error

- **Test:** TC-E3-3-1-CMP-6 — should trigger a new GET request when "Reintentar" button is clicked
  - **Status:** RED — `refetch` wiring in `ContactoListView` not implemented
  - **Verifies:** AC#4 — Reintentar triggers new GET
  - **Priority:** P1

- **Test:** should render each contact item with Nombre, Cargo, and Email visible
  - **Status:** RED — `ContactoListItem` not implemented
  - **Verifies:** AC#1 — three fields shown per item

- **Test:** should render the search input with Spanish placeholder text
  - **Status:** RED — search input not implemented
  - **Verifies:** AC#2 — Spanish placeholder "Buscar por nombre o email..."

- **Test:** should render the section heading "Contactos" in Spanish
  - **Status:** RED — heading not implemented
  - **Verifies:** AC#1 — heading "Contactos" visible

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoSchema.test.ts` (5 unit tests)

- **Test:** TC-E3-3-1-UNIT-1 — should reject a payload with empty nombre
  - **Status:** RED — `contactoSchema` does not exist
  - **Verifies:** Zod validation — nombre required
  - **Priority:** P2

- **Test:** TC-E3-3-1-UNIT-2 — should reject a payload with empty cargo
  - **Status:** RED — `contactoSchema` does not exist
  - **Verifies:** Zod validation — cargo required
  - **Priority:** P2

- **Test:** TC-E3-3-1-UNIT-3 — should reject a payload with empty telefono
  - **Status:** RED — `contactoSchema` does not exist
  - **Verifies:** Zod validation — telefono required
  - **Priority:** P2

- **Test:** TC-E3-3-1-UNIT-4 — should reject a payload with empty email
  - **Status:** RED — `contactoSchema` does not exist
  - **Verifies:** Zod validation — email required
  - **Priority:** P2

- **Test:** should accept a valid payload with all required fields filled
  - **Status:** RED — `contactoSchema` does not exist
  - **Verifies:** Zod validation — valid payload passes

---

## Data Factories Created

### Contacto Factory (Frontend)

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts`

**Exports:**
- `buildContacto(overrides?)` — Create single Contacto with optional field overrides
- `buildContactoList(count, overridesFn?)` — Create array of Contacto objects
- `resetContactoCounter()` — Reset internal counter (call in afterEach for determinism)

**Example Usage:**
```typescript
const c = buildContacto({ nombre: 'María López', email: 'maria@test.co' });
const list = buildContactoList(1000);
```

---

## Fixtures Created

### Base E2E Fixture (already exists — verified)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**
- `contactosPage` — Navigates to `/contactos` route before the test (already declared in base fixture)
  - **Setup:** Calls `page.goto('/contactos')`
  - **Provides:** Navigated page
  - **Cleanup:** None (navigation only)

**Note:** The `contactosPage` fixture was already declared in the base fixture from project setup. No new fixture file needed.

---

## Mock Requirements

### GET /api/v1/contactos

**Endpoint:** `GET /api/v1/contactos`

**Success Response:**
```json
[
  {
    "id": "uuid",
    "nombre": "María López",
    "cargo": "Gerente Comercial",
    "telefono": "3001234567",
    "email": "maria.lopez@empresa.com",
    "clienteId": null,
    "createdAt": "2026-06-28T10:30:00Z",
    "updatedAt": "2026-06-28T10:30:00Z"
  }
]
```

**Error Response (500):**
```json
{ "title": "Internal Server Error", "status": 500 }
```

**Notes:** Returns direct JSON array (no wrapper object). MSW handler must be registered in `frontend/src/test-setup.ts` or existing MSW handlers file to avoid `onUnhandledRequest: 'warn'` noise.

---

## Required data-testid Attributes

### `/contactos` Route — ContactoListView

- `contacto-list-item` — Each contact row/card in the list
- `empty-state` — EmptyState component (verify from Story 2.1; already exists on `EmptyState.tsx`)
- `error-panel` — ErrorPanel component (verify from Story 2.1; already exists on `ErrorPanel.tsx`)

### ContactoListItem Component

- `contacto-list-item` — Root element of each list item (used by list and for individual item targeting)

**Implementation Example:**
```tsx
// ContactoListItem.tsx
<li
  data-testid="contacto-list-item"
  role="button"
  tabIndex={0}
  className="hover:bg-slate-100 ..."
  onClick={onClick}
>
  <span className="font-bold">{contacto.nombre}</span>
  <span className="text-secondary">{contacto.cargo}</span>
  <span className="text-muted">{contacto.email}</span>
</li>

// EmptyState.tsx (from Story 2.1)
<div data-testid="empty-state">...</div>

// ErrorPanel.tsx (from Story 2.1)
<div data-testid="error-panel">
  <button onClick={onRetry}>Reintentar</button>
</div>
```

---

## Implementation Checklist

### Test: TC-E3-3-1-API-1 & API-2 — GET + POST /api/v1/contactos

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/GetContactosApiTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs` with `Guid Id`, `string Nombre`, `string Cargo`, `string Telefono`, `string Email`, `Guid? ClienteId`, `DateTimeOffset CreatedAt`, `DateTimeOffset UpdatedAt`; private constructor + static `Create()` factory
- [ ] Create `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs` with `GetAllAsync(CancellationToken ct)`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/ContactoConfiguration.cs` with EF Core config, FK `ON DELETE SET NULL`, indexes `ix_contactos_email` and `ix_contactos_cliente_id`
- [ ] Add `DbSet<ContactoEntity> Contactos` to `AppDbContext.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/DTOs/ContactoDto.cs`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQuery.cs` + handler
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`; register in DI
- [ ] Create `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — `GET /api/v1/contactos`; register via `app.MapContactoEndpoints()`
- [ ] Run EF Core migration: `dotnet ef migrations add AddContactoEntity ...`
- [ ] Verify `clientes` migration is present (FK dependency)
- [ ] Add required data-testid attributes: N/A (backend only)
- [ ] Run test: `dotnet test --filter "FullyQualifiedName~GetContactosApiTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3–4 hours

---

### Test: TC-E3-3-1-API-3 — contactos table schema

**File:** `backend/tests/SiesaAgents.UnitTests/Contactos/GetContactosApiTests.cs`

**Tasks to make this test pass:**

- [ ] EF Core migration applied (covered by API-1/API-2 tasks above)
- [ ] Verify `ContactoConfiguration.cs` sets `IsRequired(false)` for `ClienteId`
- [ ] Verify `HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id")` present
- [ ] Verify `HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email")` present
- [ ] Run test: `dotnet test --filter "FullyQualifiedName~ContactosTable_WhenMigrationApplied"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (covered during API-1/API-2 implementation)

---

### Test: TC-E3-3-1-CMP-1 — Performance 1,000 records ≤150ms

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoListView.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx`
- [ ] Use `useMemo` (NOT inline JSX computation) to filter `data` on `searchQuery` change
- [ ] Filter must handle 1,000 records in ≤150ms (client-side, no API call)
- [ ] Add `data-testid="contacto-list-item"` to `ContactoListItem` root element
- [ ] Run test: `pnpm --filter frontend test -- ContactoListView.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E3-3-1-CMP-2 & CMP-3 — Search filter by nombre and email

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] `ContactoListView.tsx` — `useState<string>` for `searchQuery`
- [ ] `useMemo` filter: match `contacto.nombre.toLowerCase().includes(q)` OR `contacto.email.toLowerCase().includes(q)` (case-insensitive, trimmed)
- [ ] `ContactoListItem.tsx` — render `nombre`, `cargo`, `email`; `data-testid="contacto-list-item"` on root
- [ ] Search input placeholder: `"Buscar por nombre o email..."`
- [ ] Run test: `pnpm --filter frontend test -- ContactoListView.test`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour (covered during CMP-1 implementation)

---

### Test: TC-E3-3-1-CMP-4 — EmptyState shown when no data

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoListView.test.tsx`

**Tasks to make this test pass:**

- [ ] Verify `frontend/src/shared/components/EmptyState.tsx` exists from Story 2.1 (has `data-testid="empty-state"`)
- [ ] `ContactoListView.tsx` — when `data.length === 0` and not loading/error: render `<EmptyState title="Sin contactos" description="Crea el primer contacto para comenzar." />`
- [ ] Add required data-testid attributes: `empty-state` (verify on `EmptyState.tsx`)
- [ ] Run test: `pnpm --filter frontend test -- ContactoListView.test`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E3-3-1-CMP-5 & CMP-6 — ErrorPanel + Reintentar

**File:** `frontend/src/modules/crm/contactos/__tests__/ContactoListView.test.tsx`

**Tasks to make these tests pass:**

- [ ] Verify `frontend/src/shared/components/ErrorPanel.tsx` exists from Story 2.1 (has `data-testid="error-panel"`, `onRetry` prop, "Reintentar" button)
- [ ] `ContactoListView.tsx` — when `isError`: render `<ErrorPanel onRetry={refetch} message="No se pudieron cargar los contactos." />`
- [ ] Add required data-testid attributes: `error-panel` (verify on `ErrorPanel.tsx`)
- [ ] Run test: `pnpm --filter frontend test -- ContactoListView.test`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E3-3-1-UNIT-1 through UNIT-4 — contactoSchema Zod validation

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoSchema.test.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/modules/crm/contactos/application/contactoSchema.ts` — Zod schema for `nombre`, `cargo`, `telefono`, `email` all `z.string().min(1, ...)` with Spanish error messages
- [ ] Export `ContactoFormData` inferred type: `export type ContactoFormData = z.infer<typeof contactoSchema>`
- [ ] Run test: `pnpm --filter frontend test -- contactoSchema.test`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: E2E — TC-E3-3-1-E2E-1 through E2E-6

**File:** `e2e/tests/contactos/contactos-list-search.spec.ts`

**Tasks to make these tests pass:**

- [ ] All backend and frontend tasks above are complete
- [ ] Create `frontend/src/routes/_app/contactos.tsx` rendering `<ContactoListView />`
- [ ] Create `frontend/src/routes/_app/contactos.$contactoId.tsx` stub (renders "Detalle de contacto")
- [ ] Verify navigation rail in `__root.tsx` includes a "Contactos" link
- [ ] Add MSW handler for `GET /api/v1/contactos` in shared handlers file
- [ ] Add required data-testid attributes: `contacto-list-item`, `empty-state`, `error-panel`
- [ ] Run test: `pnpm exec playwright test e2e/tests/contactos/contactos-list-search.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour (route wiring after component is working)

---

## Running Tests

```bash
# Run all frontend component tests for this story
pnpm --filter frontend test -- ContactoListView.test ContactoListItem.test contactoSchema.test

# Run specific test file
pnpm --filter frontend test -- ContactoListView.test.tsx

# Run backend API tests for this story
dotnet test --filter "FullyQualifiedName~SiesaAgents.UnitTests.Contactos"

# Run E2E tests for this story
pnpm exec playwright test e2e/tests/contactos/contactos-list-search.spec.ts

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/contactos/contactos-list-search.spec.ts --headed

# Debug specific E2E test
pnpm exec playwright test e2e/tests/contactos/contactos-list-search.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (27 total: 6 E2E + 3 API + 13 Component + 5 Unit)
- ✅ contactoFactory created with auto-reset support
- ✅ Mock requirements documented (GET /api/v1/contactos)
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests fail on import (ContactoListView, contactoSchema do not exist)
- API tests fail because `/api/v1/contactos` endpoint is not implemented
- E2E tests fail because `/contactos` route and ContactoListView are not implemented
- Failure messages are clear: module not found / 404 endpoint

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with P0: TC-E3-3-1-API-1)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order (by dependency):**

1. Backend: ContactoEntity + migration + GET endpoint (API-1, API-2, API-3)
2. Frontend: contactoFactory already created; domain + application + infrastructure layers
3. Frontend: ContactoListView + ContactoListItem (CMP-1 through CMP-6)
4. Frontend: contactoSchema (UNIT-1 through UNIT-4)
5. Frontend: Route wiring at `/contactos` (E2E-1 through E2E-6)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review code for quality (readability, maintainability)
3. Extract duplications (DRY principle)
4. Ensure tests still pass after each refactor
5. Ready for code review and story approval

---

## Next Steps

1. **Run failing tests** to confirm RED phase: `pnpm --filter frontend test -- ContactoListView.test`
2. **Review this checklist** with team
3. **Begin implementation** following the recommended order above
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **Manually update story status** to 'done' in sprint-status.yaml when complete

---

## Knowledge Base References Applied

- **fixture-architecture.md** — base.fixture.ts already has `contactosPage` fixture; composition pattern followed
- **data-factories.md** — `contactoFactory.ts` created with deterministic fallback, overrides, reset function
- **network-first.md** — All MSW handlers registered BEFORE render/navigation; all `page.route()` calls precede `page.goto()`
- **test-quality.md** — Given-When-Then structure; one assertion per test (atomic); explicit waits only
- **selector-resilience.md** — `data-testid` selectors exclusively; no CSS selectors
- **timing-debugging.md** — `waitFor()` for async assertions; `toPass()` for polling; no `sleep()`

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Expected behavior (ContactoListView.test.tsx):**

```
FAIL  frontend/src/modules/crm/contactos/__tests__/ContactoListView.test.tsx
  Cannot find module '../presentation/ContactoListView' from 'ContactoListView.test.tsx'
```

**Expected behavior (contactoSchema.test.ts):**

```
FAIL  frontend/src/modules/crm/contactos/__tests__/contactoSchema.test.ts
  Cannot find module '../application/contactoSchema' from 'contactoSchema.test.ts'
```

**Expected behavior (Backend GetContactosApiTests.cs):**

```
FAIL  SiesaAgents.UnitTests.Contactos.GetContactosApiTests
  Expected 201 Created but got 404 Not Found (endpoint not implemented)
```

**Expected behavior (E2E contactos-list-search.spec.ts):**

```
FAIL  e2e/tests/contactos/contactos-list-search.spec.ts
  Locator.filter — Expected to find "contacto-list-item" but none found
```

**Summary:**

- Total tests: 27 (6 E2E + 3 API + 13 Component + 5 Unit)
- Passing: 0 (expected)
- Failing: 27 (expected — RED phase)
- Status: ✅ RED phase verified

---

**Generated by BMad TEA Agent** — 2026-06-28
