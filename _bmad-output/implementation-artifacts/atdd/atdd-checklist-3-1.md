# ATDD Checklist — Epic 3, Story 3.1: Contact List & Search

**Date:** 2026-05-21
**Story:** 3.1 — Contact List & Search
**Epic:** 3 — Contact Management
**Phase:** RED (failing tests written; implementation not yet started)

---

## Story Summary

**As a** commercial team member,
**I want** to see a list of all contacts and search them by name or email,
**So that** I can quickly find any contact regardless of their client association.

---

## Acceptance Criteria

1. **AC1** — Given there are contacts in the system, When the user navigates to `/contactos`, Then a list of all contacts is displayed And each item shows Nombre, Cargo, and Email (FR10).

2. **AC2** — Given the contact list is loaded, When the user types in the search field, Then the list filters in real time showing only contacts whose Nombre or Email match the input And results appear in under 1 second with up to 1,000 records (NFR1, FR11, FR12) And no additional API call is made during typing — filtering is client-side.

3. **AC3** — Given there are no contacts in the system, When the user navigates to `/contactos`, Then an `EmptyState` component is displayed guiding the user to create the first contact.

4. **AC4** — Given the backend is unavailable when the page loads, When the fetch fails, Then an `ErrorPanel` with a "Reintentar" button is displayed instead of the list And clicking "Reintentar" retries the API call.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (6 tests)

**File:** `e2e/tests/contactos/contactos-list.spec.ts`

- **Test: E2E-CT-01** — la lista renderiza todos los contactos con nombre, cargo y email al cargar la página
  - **Priority:** P0
  - **Status:** RED — `ContactoListView` component not implemented; `GET /api/v1/contactos` endpoint does not exist; `data-testid="contacto-row"` does not render
  - **Verifies:** AC1 — Each contact row is visible with nombre, cargo, and email; only one initial GET call made

- **Test: E2E-CT-02** — buscar por nombre filtra la lista en tiempo real sin llamadas extra a la API
  - **Priority:** P0
  - **Status:** RED — `ContactoListView` not implemented; `searchInput` locator (`placeholder=/buscar contacto/i`) does not exist; `filterContactos` `useMemo` logic not in place
  - **Verifies:** AC2 — Typing in search input filters visible rows by Nombre; no additional `GET /api/v1/contactos` calls after initial load; only matching contact visible

- **Test: E2E-CT-03** — buscar por email filtra la lista en tiempo real sin llamadas extra a la API
  - **Priority:** P0
  - **Status:** RED — Same blockers as E2E-CT-02; email-based client-side filter not implemented
  - **Verifies:** AC2 — Typing a partial email value filters visible rows by Email; non-matching contacts not visible; no extra API calls

- **Test: E2E-CT-04** — limpiar el campo de búsqueda restaura la lista completa
  - **Priority:** P1
  - **Status:** RED — `ContactoListView` and search input not implemented; clearing has no effect on non-existent component
  - **Verifies:** AC2 (full list restore) — After clearing the search input both contacts are visible again

- **Test: E2E-CT-05** — EmptyState se muestra cuando no hay contactos en el sistema
  - **Priority:** P2
  - **Status:** RED — `EmptyState` component not rendered at `/contactos`; `data-testid="empty-state"` selector does not exist; API returns mocked empty array `[]`
  - **Verifies:** AC3 — `empty-state` testId visible; Spanish guidance text matches `/no hay contactos|primer contacto/i`; zero `contacto-row` elements rendered

- **Test: E2E-CT-06** — ErrorPanel con botón "Reintentar" se muestra cuando la API devuelve 500
  - **Priority:** P2
  - **Status:** RED — `ErrorPanel` not rendered at `/contactos`; `data-testid="error-panel"` does not exist; "Reintentar" button not present; retry-triggered re-fetch not wired
  - **Verifies:** AC4 — `error-panel` testId visible; "Reintentar" button visible; no contact rows rendered; clicking "Reintentar" triggers a new `GET /api/v1/contactos` call

---

### API Integration Tests — Playwright APIRequestContext (2 tests)

**File:** `e2e/tests/contactos/contactos-api.spec.ts`

- **Test: API-CT-07** — GET /api/v1/contactos devuelve un array; cada item contiene id, nombre, email y cargo
  - **Priority:** P1
  - **Status:** RED — `GET /api/v1/contactos` endpoint does not exist; response is `404 Not Found` or `ECONNREFUSED`
  - **Verifies:** AC1 — HTTP 200; body is a direct JSON array (no wrapper); each item has `id` (UUID v4), `nombre`, `email`, `cargo` (non-empty strings); `createdAt` and `updatedAt` are ISO 8601 with timezone (DateTimeOffset); `clienteId` is null or UUID

- **Test: API-CT-07b** — GET /api/v1/contactos devuelve Content-Type application/json en condiciones normales
  - **Priority:** P1
  - **Status:** RED — Endpoint does not exist; Content-Type is not `application/json` (404 or ECONNREFUSED)
  - **Verifies:** AC1 (contract guard) — Status 200; `Content-Type` header contains `application/json` but NOT `problem+json`; body is a plain array with no `title` or `status` fields

---

### Frontend Unit Tests — Vitest + RTL (2 tests)

**File:** `frontend/src/modules/crm/contactos/application/__tests__/useContactos.test.ts`

- **Test: UNIT-CT-FE-01** — returns contact data from repository on success
  - **Priority:** P1
  - **Status:** RED — `useContactos.ts` does not exist; `contactoApiRepository.ts` does not exist; `Contacto.ts` domain interface does not exist
  - **Verifies:** AC1 — `useContactos` hook resolves with contact array from `contactoApiRepository.getAll()`; `isError` is false

- **Test: UNIT-CT-FE-02** — exposes isError = true when fetch throws
  - **Priority:** P1
  - **Status:** RED — Same blockers as UNIT-CT-FE-01
  - **Verifies:** AC4 — When repository throws, `isError` is `true` and `data` is `undefined`

---

### Frontend Unit Tests — Vitest (5 tests)

**File:** `frontend/src/modules/crm/contactos/__tests__/filterContactos.test.ts`

- **Test: UNIT-CT-05** — filterContactos("Juan") returns contacts matching nombre case-insensitively
  - **Priority:** P1
  - **Status:** RED — `filterContactos.ts` does not exist
  - **Verifies:** AC2 — Only contact whose `nombre` contains 'Juan' (case-insensitive) is returned

- **Test: UNIT-CT-05b** — filterContactos("JUAN") matches nombre case-insensitively
  - **Priority:** P1
  - **Status:** RED — Same blocker
  - **Verifies:** AC2 — Uppercase query still matches lowercase `nombre`

- **Test: UNIT-CT-06b** — filterContactos("acme.co") returns contacts matching by email domain
  - **Priority:** P1
  - **Status:** RED — Same blocker
  - **Verifies:** AC2 — Email domain fragment matches the correct contact

- **Test: UNIT-CT-06c** — filterContactos("ANA.M") matches email case-insensitively
  - **Priority:** P1
  - **Status:** RED — Same blocker
  - **Verifies:** AC2 — Uppercase email fragment still matches lowercase `email`

- **Test: UNIT-CT-07/07b/08** — empty query, whitespace query, immutability
  - **Priority:** P1
  - **Status:** RED — Same blocker
  - **Verifies:** AC2 edge cases — Empty/whitespace query returns full array; input array is not mutated

---

### Backend Unit Tests — xUnit (2 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Handlers/GetContactosQueryHandlerTests.cs`

- **Test: UNIT-B-CT-GET-01** — HandleAsync_WithContactos_ReturnsMappedDtos
  - **Priority:** P1
  - **Status:** RED — `ContactoEntity`, `IContactoRepository`, `GetContactosQueryHandler`, `GetContactosQuery`, `ContactoDto` do not exist
  - **Verifies:** AC1 — Handler maps entity list to `ContactoDto[]` with correct Nombre, Cargo, and Email values

- **Test: UNIT-B-CT-GET-02** — HandleAsync_WithNoContactos_ReturnsEmptyCollection
  - **Priority:** P1
  - **Status:** RED — Same blockers
  - **Verifies:** AC1 — Handler returns an empty (not null) collection when repository has no records

---

## Total Tests in RED Phase

| Level | File | Count | Test IDs |
|---|---|---|---|
| E2E (Playwright) | `contactos-list.spec.ts` | 6 | E2E-CT-01 through E2E-CT-06 |
| API (Playwright APIRequestContext) | `contactos-api.spec.ts` | 2 | API-CT-07, API-CT-07b |
| Frontend Unit (Vitest) | `useContactos.test.ts` | 2 | UNIT-CT-FE-01, UNIT-CT-FE-02 |
| Frontend Unit (Vitest) | `filterContactos.test.ts` | 7 | UNIT-CT-05, 05b, 06, 06b, 06c, 07, 07b, 08 |
| Backend Unit (xUnit) | `GetContactosQueryHandlerTests.cs` | 2 | UNIT-B-CT-GET-01, UNIT-B-CT-GET-02 |
| **Total** | | **19** | |

---

## data-testid Attributes Required

The following `data-testid` attributes must be present in the frontend implementation for E2E tests to pass:

| Attribute | Component | File | Used By |
|---|---|---|---|
| `contacto-row` | `ContactoListItem` (each row) | `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx` | E2E-CT-01 through E2E-CT-04 |
| `empty-state` | `EmptyState` | `frontend/src/shared/components/EmptyState.tsx` | E2E-CT-05 |
| `error-panel` | `ErrorPanel` | `frontend/src/shared/components/ErrorPanel.tsx` | E2E-CT-06 |

The search input is located via `getByPlaceholder(/buscar contacto/i)` — the implementation must include `placeholder="Buscar contacto por nombre o email"` to satisfy the existing POM locator in `e2e/pages/contactos.page.ts`.

---

## Mock / Intercept Strategy

| Test | Strategy | Detail |
|---|---|---|
| E2E-CT-01, CT-02, CT-03, CT-04 | `page.route('**/api/v1/contactos', route => route.continue())` — network-first intercept | Count API calls to assert no extra requests during typing |
| E2E-CT-05 | `page.route('**/api/v1/contactos', route => route.fulfill({ status: 200, body: '[]' }))` before `goto()` | Guarantees empty state regardless of DB content |
| E2E-CT-06 | `page.route('**/api/v1/contactos', route => route.fulfill({ status: 500 }))` before `goto()` | Simulates unavailable backend — intercept BEFORE navigation to avoid race condition |
| API-CT-07, CT-07b | No mocking — direct `request.get()` against running backend | Requires backend running at `http://localhost:5000` |
| UNIT-CT-FE-01/02 | `vi.mock('../../infrastructure/contactoApiRepository', ...)` | Isolates hook from real HTTP calls |
| UNIT-B-CT-GET-01/02 | `FakeContactoRepository` in-memory stub | Isolates handler from EF Core and database |

---

## POM Locators Verified

The existing `e2e/pages/contactos.page.ts` POM covers all locators needed for Story 3.1:

| Locator | Property | Selector |
|---|---|---|
| Search input | `searchInput` | `getByPlaceholder(/buscar contacto/i)` |
| Contact rows | `contactoRows` | `getByTestId('contacto-row')` |

**Note:** The POM `searchInput` uses `getByPlaceholder(/buscar contacto/i)`. Story 3.1 specifies `placeholder="Buscar contacto por nombre o email"`. The regex `/buscar contacto/i` matches this placeholder — no POM update required.

---

## Implementation Checklist

### Test Group: E2E-CT-01 + API-CT-07 + API-CT-07b — Contact list renders and API contract

**Make these tests pass by implementing:**

- [ ] Task 10 (Backend): Create `ContactoEntity.cs` in `SiesaAgents.Domain/Contactos/Entities/`
- [ ] Task 10 (Backend): Create `IContactoRepository.cs` with `GetAllAsync(CancellationToken ct)` method
- [ ] Task 10 (Backend): Create `ContactoConfiguration.cs` (EF Core, FK to clientes, indexes)
- [ ] Task 10 (Backend): Add `DbSet<ContactoEntity> Contactos` to `AppDbContext`
- [ ] Task 10 (Backend): Run EF Core migration `AddContactoEntity`
- [ ] Task 11 (Backend): Create `GetContactosQuery.cs`, `GetContactosQueryHandler.cs`, `ContactoDto.cs`
- [ ] Task 12 (Backend): Create `ContactoRepository.cs` implementing `IContactoRepository`
- [ ] Task 13 (Backend): Create `ContactoEndpoints.cs` registering `GET /api/v1/contactos`
- [ ] Task 13 (Backend): Register in `Program.cs` via `app.MapContactoEndpoints()`
- [ ] Task 1 (Frontend): Create `Contacto.ts` TypeScript interface
- [ ] Task 2 (Frontend): Create `contactoApiRepository.ts`
- [ ] Task 3 (Frontend): Create `useContactos.ts` TanStack Query hook with `queryKey: ['contactos']`
- [ ] Task 5 (Frontend): Create `ContactoListView.tsx` with search input and `data-testid="contacto-row"` on each item
- [ ] Task 6 (Frontend): Create `ContactoListItem.tsx` displaying nombre, cargo, email
- [ ] Task 9 (Frontend): Wire `ContactoListView` into `/contactos` route

---

### Test Group: E2E-CT-02, E2E-CT-03, E2E-CT-04 — Client-side real-time search

**Make these tests pass by implementing:**

- [ ] Task 4 (Frontend): Create `filterContactos.ts` — pure utility, case-insensitive match on `nombre` and `email`
- [ ] Task 5 (Frontend): Add `useState('')` for `searchQuery` in `ContactoListView`
- [ ] Task 5 (Frontend): Add search input with `placeholder="Buscar contacto por nombre o email"` and `aria-label="Buscar contactos"`
- [ ] Task 5 (Frontend): Add `useMemo` filter calling `filterContactos(data, searchQuery)` — render filtered result
- [ ] Verify: no `?search=` query parameter sent to `GET /api/v1/contactos` — filtering is purely client-side

---

### Test Group: E2E-CT-05 — EmptyState shown when no contacts exist

**Make this test pass by implementing:**

- [ ] Task 7 (Frontend): Verify `EmptyState.tsx` (from Story 2.1) has `data-testid="empty-state"`
- [ ] Task 5 (Frontend): In `ContactoListView`, show `<EmptyState>` when `!isLoading && !isError && data.length === 0`
- [ ] Task 5 (Frontend): Use props: `title="No hay contactos registrados"`, `description="Crea el primer contacto para comenzar."`

---

### Test Group: E2E-CT-06 — ErrorPanel with "Reintentar" button on API failure

**Make this test pass by implementing:**

- [ ] Task 8 (Frontend): Verify `ErrorPanel.tsx` (from Story 2.1) has `data-testid="error-panel"` and a "Reintentar" button
- [ ] Task 5 (Frontend): In `ContactoListView`, show `<ErrorPanel onRetry={refetch} />` when `isError === true`
- [ ] Task 3 (Frontend): Ensure `useContactos` exposes `refetch` from `useQuery` return value

---

### Test Group: UNIT-CT-FE-01, UNIT-CT-FE-02 — useContactos hook

**Make these tests pass by implementing:**

- [ ] Task 1 (Frontend): Create `Contacto.ts` TypeScript interface with all required fields
- [ ] Task 2 (Frontend): Create `contactoApiRepository.ts` implementing `IContactoRepository` using `apiClient`
- [ ] Task 3 (Frontend): Create `useContactos.ts` calling `contactoApiRepository.getAll()` and returning `{ data, isLoading, isError, refetch }`

---

### Test Group: UNIT-CT-05 through UNIT-CT-08 — filterContactos utility

**Make these tests pass by implementing:**

- [ ] Task 4 (Frontend): Create `filterContactos.ts` with signature `filterContactos(contacts: Contacto[], query: string): Contacto[]`
- [ ] Verify: query.trim() check — empty/whitespace returns full array
- [ ] Verify: case-insensitive match on `nombre` and `email`
- [ ] Verify: function does not mutate the input array (use `contacts.filter(...)`, not in-place sort)

---

### Test Group: UNIT-B-CT-GET-01, UNIT-B-CT-GET-02 — GetContactosQueryHandler

**Make these tests pass by implementing:**

- [ ] Task 10 (Backend): Create `ContactoEntity.cs` with `Create(nombre, cargo, telefono, email)` factory
- [ ] Task 10 (Backend): Create `IContactoRepository.cs` with `GetAllAsync` method
- [ ] Task 11 (Backend): Create `GetContactosQuery.cs` (record, no parameters)
- [ ] Task 11 (Backend): Create `ContactoDto.cs` with all required fields
- [ ] Task 11 (Backend): Create `GetContactosQueryHandler.cs` calling `IContactoRepository.GetAllAsync()` and mapping to `ContactoDto`

---

## Running Tests

```bash
# Run all Story 3.1 E2E tests
npx playwright test e2e/tests/contactos/contactos-list.spec.ts

# Run Story 3.1 API integration tests
npx playwright test e2e/tests/contactos/contactos-api.spec.ts

# Run all Story 3.1 E2E + API tests together
npx playwright test e2e/tests/contactos/

# Run a specific test by ID
npx playwright test e2e/tests/contactos/contactos-list.spec.ts --grep "E2E-CT-01"

# Run in headed mode for debugging
npx playwright test e2e/tests/contactos/contactos-list.spec.ts --headed

# Run frontend unit tests (Vitest)
cd frontend && npx vitest run src/modules/crm/contactos

# Run only filterContactos tests
cd frontend && npx vitest run src/modules/crm/contactos/__tests__/filterContactos.test.ts

# Run only useContactos tests
cd frontend && npx vitest run src/modules/crm/contactos/application/__tests__/useContactos.test.ts

# Run backend unit tests (xUnit)
cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~GetContactosQueryHandlerTests"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All 19 tests written and in failing state. Expected failure reasons before implementation:

- E2E-CT-01 to E2E-CT-06: `page.goto('/contactos')` loads placeholder route; `data-testid="contacto-row"` not found → `TimeoutError` or `HaveCount` fails
- API-CT-07, API-CT-07b: `GET http://localhost:5000/api/v1/contactos` → `404 Not Found` (endpoint not registered)
- UNIT-CT-FE-01/02: Module `../../infrastructure/contactoApiRepository` not found → `Cannot find module` error
- UNIT-CT-05 through UNIT-CT-08: Module `../application/filterContactos` not found → `Cannot find module` error
- UNIT-B-CT-GET-01/02: `SiesaAgents.Application.Contactos.Queries`, `SiesaAgents.Domain.Contactos.*` namespaces do not exist → compile error

### GREEN Phase (DEV Team — Next Steps)

Priority order aligned with P0 → P1 → P2:

1. Implement backend Tasks 10–13 (entity, migration, repository, handler, endpoint) — unblocks API-CT-07, API-CT-07b, UNIT-B-CT-GET-01/02, E2E-CT-01
2. Implement frontend Tasks 1–3 (Contacto interface, repository, hook) — unblocks UNIT-CT-FE-01/02
3. Implement frontend Task 4 (`filterContactos`) — unblocks UNIT-CT-05 through UNIT-CT-08
4. Implement frontend Tasks 5–6 (`ContactoListView`, `ContactoListItem`) + Task 9 (wire route) — unblocks E2E-CT-01, CT-02, CT-03, CT-04
5. Wire `EmptyState` into `ContactoListView` (Task 7) — unblocks E2E-CT-05
6. Wire `ErrorPanel` into `ContactoListView` (Task 8) — unblocks E2E-CT-06

### REFACTOR Phase (DEV Team — After All Tests Pass)

- Verify `useMemo` filter performs under 150ms with 1,000 records (NFR1)
- Confirm no `?search=` parameter ever appears in network requests during search
- Confirm skeleton placeholders (3 rows) display during `isLoading === true`
- Confirm all user-facing text is in Spanish
- Confirm `data-testid="contacto-row"` is on EVERY list item element (risk R11)

---

## Coverage Matrix — Story 3.1

| AC | Requirement | Test(s) | Level | Status |
|---|---|---|---|---|
| AC1 | List renders all contacts with Nombre, Cargo, Email | E2E-CT-01, API-CT-07, API-CT-07b, UNIT-CT-FE-01 | E2E + API + Unit | RED |
| AC2 | Real-time filter by Nombre (client-side, no extra API calls) | E2E-CT-02, E2E-CT-04, UNIT-CT-05, UNIT-CT-05b | E2E + Unit | RED |
| AC2 | Real-time filter by Email (client-side) | E2E-CT-03, UNIT-CT-06b, UNIT-CT-06c | E2E + Unit | RED |
| AC2 | Empty query returns full array | UNIT-CT-07, UNIT-CT-07b | Unit | RED |
| AC2 (NFR1) | Filter results under 1 second with up to 1,000 records | E2E-CT-02 (no extra calls asserted) | E2E | RED |
| AC3 | EmptyState shown when no contacts | E2E-CT-05 | E2E | RED |
| AC4 | ErrorPanel + Reintentar shown on API 500 | E2E-CT-06, UNIT-CT-FE-02 | E2E + Unit | RED |
| AC4 | Reintentar retries GET /api/v1/contactos | E2E-CT-06 | E2E | RED |
| — | Handler maps entities to DTOs correctly | UNIT-B-CT-GET-01 | Backend Unit | RED |
| — | Handler returns empty collection (not null) | UNIT-B-CT-GET-02 | Backend Unit | RED |

**Coverage: All 4 AC requirements addressed — 100%**

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-21
