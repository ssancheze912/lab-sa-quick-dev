# ATDD Checklist - Epic 3, Story 3.2: Contact Detail View

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** API (backend) + Component (frontend RTL) + E2E

---

## Story Summary

**As a** commercial team member,
**I want** to view the complete details of a contact by selecting them from the list,
**So that** I can review all their information at once.

Delivers ONLY the read-only contact detail view + deep-linking navigation (`/contactos/:contactoId`). Does NOT implement Editar/Eliminar actions (Stories 3.4/3.5), associated-client display (Epic 4/FR22), or the create contact form (Story 3.3).

---

## Acceptance Criteria

1. Clicking a contact in the list shows the complete contact details (Nombre, Cargo, Teléfono, Email) in the right panel; URL updates to `/contactos/:contactoId` (FR13, FR30).
2. Direct navigation to `/contactos/:contactoId` (no prior in-app navigation) renders the correct contact details (FR30, TC-E3-P1-06).
3. A well-formed but non-existent `contactoId` renders a graceful not-found message — no blank page, no unhandled JS error, no console error (TC-E3-P1-07, R5).
4. With no contact selected, the right panel shows an empty/default state.

---

## Failing Tests Created (RED Phase)

### Backend xUnit — Repository (9 tests added)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Repositories/ContactoRepositoryTests.cs` (345 lines total; Story 3.2 block appended)

- ✅ `GetByIdAsync_WithExistingId_ReturnsTheMatchingEntity` — RED: `IContactoRepository`/`ContactoRepository` has no `GetByIdAsync` member (compile error CS1061)
- ✅ `GetByIdAsync_WithNonExistentId_ReturnsNull` — RED: same
- ✅ `GetByIdAsync_WithGuidEmpty_ReturnsNullNotAnException` — RED: same
- ✅ `GetByIdAsync_DoesNotReturnAContactoDeletedAfterBeingSeeded` — RED: same
- ✅ `GetByIdAsync_WithExistingId_ReturnsEntityWithAssociatedClienteId` — RED: same

**Verified:** `dotnet build SiesaAgents.sln` fails with `CS1061: 'ContactoRepository' does not contain a definition for 'GetByIdAsync'` at all 5 call sites — correct RED phase at compile time.

### Backend xUnit — Endpoint Integration (9 tests added)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ContactoEndpointsTests.cs` (343 lines total; Story 3.2 block appended)

- ✅ `GetContactoById_WithExistingId_ReturnsOk` — RED: `GetContactoByIdQueryHandler` does not exist yet
- ✅ `GetContactoById_WithExistingId_ReturnsTheCorrectContactoDto` — RED: same
- ✅ `GetContactoById_WithNonExistentId_ReturnsNotFound` — RED: `GET /api/v1/contactos/{id:guid}` route not mapped yet
- ✅ `GetContactoById_WithNonExistentId_ReturnsProblemDetailsWithoutStackTrace` — RED: same
- ✅ `GetContactoById_WithGuidEmptyRouteSegment_ReturnsNotFound` — RED: same
- ✅ `GetContactoById_WithMalformedGuidRouteSegment_ReturnsBadRequestNot500` — RED: same
- ✅ `GetContactoById_ResponseUsesCamelCaseJsonPropertyNames` — RED: same
- ✅ `GetContactoById_DoesNotReturnAContactoDeletedAfterCreation` — RED: same

### Frontend Vitest + RTL — Component (18 tests, new file)

**File:** `frontend/src/modules/crm/contactos/presentation/components/ContactoDetailView.test.tsx` (273 lines)

- AC #1: Nombre/Cargo/Teléfono/Email render, Spanish labels, `contacto-detail-panel` testid, no Editar/Eliminar buttons (7 tests)
- AC #1/#2 loading: skeleton via `contacto-detail-loading` (1 test)
- AC #3 not-found: 404 renders `contacto-not-found`, no raw Problem Details leak, no field labels leak, `listMembership="missing"` skips the by-id request entirely (R5 mitigation), `listMembership="pending"` shows skeleton without firing the request (5 tests)
- AC #4 empty/default: `contacto-detail-empty` renders with no `contactoId`, Spanish guidance copy, zero fetch when `contactoId` is undefined (3 tests)

**Status:** RED — `Failed to resolve import "./ContactoDetailView"` (component does not exist). Verified via `vitest run`.

### Frontend Vitest + RTL — Routing wiring (2 tests added to existing file)

**File:** `frontend/src/modules/crm/contactos/presentation/components/ContactoListView.test.tsx` (333 lines total; Story 3.2 block appended)

- `should mark the ContactListItem matching the current $contactoId route param as selected` — RED: `ContactoListView.tsx` does not derive/pass `selected` yet (verified failing: `expected [] to have a length of 1`)
- `should NOT mark any item as selected when on the bare /contactos route` — PASSES today (no selection logic exists yet, so nothing is marked — this is a valid baseline assertion, not a false green: it will keep passing after implementation since `/contactos` with no `contactoId` should still show nothing selected)

**Note:** Navigation-on-click itself (the `useNavigate` call) is authoritatively verified in the E2E test below (`AC #1 — should navigate to /contactos/:contactoId ... when a list item is clicked`), matching this project's established convention (no existing `ClienteListView.test.tsx` unit test mocks `useNavigate` either — see Dev Notes).

### E2E (Playwright) — 6 tests, new file

**File:** `e2e/tests/contactos/contact-detail-view.spec.ts` (132 lines)

- `TC-E3-P1-06 — should load and display the correct contact when navigating directly to /contactos/:contactoId`
- `TC-E3-P1-06 — should not redirect to /contactos root when deep-linking to an existing contact`
- `TC-E3-P1-07 — should show a graceful not-found UI for a well-formed but non-existent contactoId`
- `TC-E3-P1-07 — should log zero console errors when the contactoId does not exist`
- `AC #4 — should show the empty/default state on /contactos when no contact is selected`
- `AC #1 — should navigate to /contactos/:contactoId and show its details when a list item is clicked`

**Status:** RED — depends on `ContactoDetailView`/`useContacto`/`GetContactoById` endpoint (Story 3.2, not yet implemented) AND on `POST /api/v1/contactos` (used via `ApiHelper.createContacto` to seed data), which does not exist until **Story 3.3**. This mirrors the same accepted RED-phase ordering Story 2.2's E2E tests had on Story 2.3's POST endpoint. These tests will fully resolve to GREEN only once both 3.2 and 3.3 are implemented.

---

## Supporting Infrastructure Added

### MSW Handlers

**File:** `frontend/src/test/msw/handlers.ts`

- `CONTACTO_BY_ID_ENDPOINT = '*/api/v1/contactos/:id'` — default 200 success handler
- `defaultContacto` — default contact fixture (via `createContacto()`)
- `contactoNotFoundProblemDetails` — RFC 7807 body for the 404 case (mirrors `clienteNotFoundProblemDetails`)

### Page Object Model

**File:** `e2e/pages/contactos.page.ts`

- `detailEmptyState` (`contacto-detail-empty`), `detailNotFound` (`contacto-not-found`), `detailLoading` (`contacto-detail-loading`) locators added
- `gotoDetail(contactoId)` method added — direct navigation to `/contactos/:contactoId`

### Data Factories (already existed, reused)

- `frontend/src/test/factories/contacto.factory.ts` — `createContacto`/`createContactos` (faker-based)
- `e2e/helpers/data.helper.ts` — `buildContacto` (faker-based, unique per call)
- `e2e/helpers/api.helper.ts` — `ApiHelper.createContacto`/`deleteContacto` (already existed from Story 3.1 prep; auto-cleanup via `afterEach`)

---

## Mock Requirements

### GET /api/v1/contactos/:id Mock (MSW, frontend unit tests)

**Success Response (200):**

```json
{
  "id": "<uuid>",
  "nombre": "string",
  "cargo": "string",
  "telefono": "string",
  "email": "string",
  "clienteId": null,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**Failure Response (404, RFC 7807):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Contacto no encontrado."
}
```

---

## Required data-testid Attributes

### ContactoDetailView

- `contacto-detail-panel` — success-state container (Nombre/Cargo/Teléfono/Email)
- `contacto-detail-empty` — empty/default "no contact selected" state
- `contacto-detail-loading` — skeleton loading state
- `contacto-not-found` — graceful not-found state

### ContactoListView / ContactListItem (already exist, behavior now activated)

- `contacto-list-item` — clickable row; needs `onClick`/`selected` wired (Task 4)

**Implementation Example:**

```tsx
<div data-testid="contacto-detail-panel">...</div>
<div data-testid="contacto-detail-empty">Selecciona un contacto para ver el detalle.</div>
<div data-testid="contacto-detail-loading"><Skeleton .../></div>
<div data-testid="contacto-not-found">Contacto no encontrado</div>
```

---

## Implementation Checklist

### Backend

- [ ] Add `Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `IContactoRepository`
- [ ] Implement in `ContactoRepository` using `FirstOrDefaultAsync`, returns `null` when not found
- [ ] Create `GetContactoByIdQuery` + `GetContactoByIdQueryHandler` (mirrors `GetClienteByIdQuery`/Handler exactly)
- [ ] Add `GET /api/v1/contactos/{id:guid}` to `ContactoEndpoints.cs` — 200 + `ContactoDto`, 404 via `Results.NotFound()`
- [ ] Register `GetContactoByIdQueryHandler` in `Program.cs` DI
- [ ] Run: `dotnet test --filter "FullyQualifiedName~ContactoRepositoryTests|FullyQualifiedName~ContactoEndpointsTests"`
- [ ] ✅ All backend tests pass (green phase)

### Frontend

- [ ] Add `getById(id: string): Promise<Contacto>` to `IContactoRepository.ts` + `contactoApiRepository.ts`
- [ ] Create `useContacto.ts` hook — `queryKey: ['contactos', id]`, `{ enabled }` option
- [ ] Create `ContactoDetailView.tsx` — empty/loading/not-found/success states, `listMembership` prop pattern
- [ ] Create `contactos.$contactoId.tsx` route + `contactos.index.tsx` route
- [ ] Restructure `contactos.tsx` to parent + `<Outlet/>` (mirrors `clientes.tsx`)
- [ ] Wire `ContactListItem`'s `onClick`/`selected` in `ContactoListView.tsx` (scoped `$contactoId` match, not loose regex)
- [ ] Run: `pnpm --filter frontend test -- ContactoDetailView ContactoListView`
- [ ] ✅ All frontend tests pass (green phase)

### E2E

- [ ] Depends on Backend + Frontend tasks above, AND Story 3.3's `POST /api/v1/contactos` for data seeding
- [ ] Run: `npx playwright test e2e/tests/contactos/contact-detail-view.spec.ts`
- [ ] ✅ All E2E tests pass (green phase, after 3.2 + 3.3 both implemented)

**Estimated Effort:** 6-8 hours (backend 2h, frontend 3-4h, E2E validation 1-2h)

---

## Running Tests

```bash
# Backend
cd backend && dotnet test --filter "FullyQualifiedName~Contacto"

# Frontend unit/component
cd frontend && pnpm test -- ContactoDetailView ContactoListView

# E2E
npx playwright test e2e/tests/contactos/contact-detail-view.spec.ts --headed
npx playwright test e2e/tests/contactos/contact-detail-view.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 9 backend repository tests added — RED verified via `dotnet build` (CS1061 compile error)
- ✅ 8 backend endpoint tests added — RED verified (missing handler/route)
- ✅ 18 frontend component tests created (new file) — RED verified via `vitest run` (import resolution failure)
- ✅ 2 frontend routing tests added — RED verified (1 failing as expected, 1 valid baseline pass)
- ✅ 6 E2E tests created — RED (missing implementation + Story 3.3 dependency documented)
- ✅ MSW handlers, Page Object methods added

### GREEN Phase (DEV Team - Next Steps)

1. Implement backend `GetByIdAsync` + `GetContactoByIdQuery`/Handler + endpoint
2. Implement frontend `useContacto` + `ContactoDetailView` + routes + `ContactoListView` wiring
3. Run each test file, confirm green
4. E2E will remain RED on the seeding step until Story 3.3 lands (documented, expected)

### REFACTOR Phase (DEV Team)

Standard: verify all tests green, clean up duplication, keep tests passing.

---

## Next Steps

1. Share this checklist and failing tests with the dev-story workflow (manual handoff within this pipeline)
2. Implement backend Task 1, then frontend Tasks 2-4, one test at a time
3. Note the Story 3.3 dependency on the E2E seeding step — do not treat as a bug if E2E stays RED after 3.2 alone
4. When all tests pass, mark story `done`

---

## Notes

- This story is the exact structural mirror of Story 2.2 (Client Detail View) — all test patterns replicate `ClienteDetailView.test.tsx`/`client-detail-view.spec.ts` verbatim, scoped down to exclude Editar/Eliminar (out of scope per Dev Notes).
- The `listMembership` prop pattern is REQUIRED (not optional polish) to satisfy AC #3/TC-E3-P1-07's zero-console-error requirement — tested explicitly in `ContactoDetailView.test.tsx`.
- Query key `['contactos', id]` (array form) is asserted implicitly via the MSW handler contract; explicit non-negotiable per Epic 3 Test Design §10, item 7.
- Backend compile-time RED (CS1061) is the correct/expected xUnit RED-phase signal for this codebase's TDD style (same as `ClienteRepositoryTests`/`ClienteEndpointsTests` precedent).

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-07-01
