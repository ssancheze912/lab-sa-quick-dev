# ATDD Checklist — Epic 3, Story 3.1: Contact List & Search

**Date:** 2026-06-29
**Author:** TEA Agent (sa-tea-atdd)
**Story:** 3.1 — Contact List & Search
**Primary Test Level:** Component (Vitest + RTL + MSW), E2E (Playwright), API Integration (xUnit)

---

## Story Summary

A commercial team member needs to navigate to `/contactos` and see a scrollable list of all contacts with their Nombre, Cargo, and Email; search in real time by Nombre or Email (case-insensitive, substring, < 1s for 1,000 records); and receive appropriate feedback when the list is empty or the backend is unavailable.

**As a** commercial team member
**I want** to see a list of all contacts and search them by name or email
**So that** I can quickly find any contact regardless of their client association

---

## Acceptance Criteria

1. Given contacts exist, when navigating to `/contactos`, then a list of all contacts is displayed showing Nombre, Cargo, and Email per item. (FR10, AC-E3.1)
2. Given the list is loaded, when typing in the search field, then the list filters in real time matching Nombre OR Email as substring (case-insensitive), results in < 1s with up to 1,000 records. (FR11, FR12, NFR1, AC-E3.2)
3. Given no contacts in the system, when navigating to `/contactos`, then `EmptyState` is displayed with a Spanish creation-prompt message. (AC-E3.1)
4. Given the backend is unavailable when the page loads, when the fetch fails, then `ErrorPanel` with a "Reintentar" button is shown; clicking it triggers a new fetch. (NFR6)

---

## Failing Tests Created (RED Phase)

### Unit Tests — Zod Schema Validation (12 tests)

**File:** `frontend/src/modules/crm/contactos/application/contactoSchema.test.ts`

**TC-E3-SCHEMA-01 group (4 tests):**

- `safeParse({}) returns { success: false } with errors on nombre`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** AC#2, Task 4 — Schema rejects missing nombre

- `safeParse({}) returns { success: false } with errors on cargo`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** AC#2 — Schema rejects missing cargo

- `safeParse({}) returns { success: false } with errors on telefono`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** AC#2 — Schema rejects missing telefono

- `safeParse({}) returns { success: false } with errors on email`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** AC#2 — Schema rejects missing email

**TC-E3-SCHEMA-02 group (2 tests):**

- `should return { success: true } for a completely valid contacto`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** Positive path — valid payload parses successfully

- `should preserve all field values when valid`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** Parsed data matches input on all fields

**TC-E3-SCHEMA-03 group (3 tests):**

- `should return { success: false } with error on email when format is invalid`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** AC#2 — Email field must pass Zod email format validation

- `should fail for email without domain`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** Email format — no domain

- `should fail for email without @ symbol`
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** Email format — no @ symbol

**TC-E3-SCHEMA-04 group (7 tests):**

- `should fail when nombre is missing` / `should fail when cargo is missing` / `should fail when telefono is missing` / `should fail when email is missing` — individual field omission
  - **Status:** RED — Cannot find module `./contactoSchema`

- `should fail when nombre is an empty string` / `should fail when cargo is an empty string` / `should fail when telefono is an empty string` — empty string rejection
  - **Status:** RED — Cannot find module `./contactoSchema`
  - **Verifies:** Schema uses `min(1)` not just `required()`

---

### Component Tests (16 tests)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx`

**TC-E3-P0-01 group (3 tests):**

- `should show loading skeleton before data arrives`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#1 — Loading state (react-loading-skeleton) shown before API resolves

- `should render all 3 contacts after data arrives`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#1 — All items rendered with data-testid `contacto-item-{id}`

- `should display Nombre, Cargo, and Email for each contact item`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#1 — Each row shows Nombre (bold), Cargo, Email

**TC-E3-P0-02 group (3 tests):**

- `should render EmptyState component when API returns empty array`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#3 — EmptyState shown with data-testid `contactos-empty-state`

- `should show zero contact list items when empty`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#3 — No contacto-item elements in DOM

- `should display Spanish creation-prompt message in EmptyState`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#3 — Text contains /contacto/i in Spanish

**TC-E3-P0-03 group (3 tests):**

- `should render ErrorPanel when GET /api/v1/contactos returns 500`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#4 — ErrorPanel shown with data-testid `contactos-error-panel`

- `should display Reintentar button in ErrorPanel`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#4 — Button with data-testid `contactos-retry-button` and text /reintentar/i

- `should trigger a new fetch when Reintentar button is clicked`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#4 — Clicking Reintentar clears error and retries fetch

**TC-E3-P1-01 group (3 tests):**

- `should show only matching contacts when searching by partial Nombre`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#2 — Search input `contactos-search-input` filters by nombre substring

- `should restore full list when search is cleared`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#2 — Empty search restores all results

- `should perform case-insensitive search on Nombre`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#2 — Case-insensitive substring match on nombre

**TC-E3-P1-02 group (3 tests):**

- `should show only matching contacts when searching by partial email domain`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#2 — Search filters by email substring (@siesa matches email)

- `should match email substring (not only prefix)`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#2 — Substring match in any position of email

- `should perform case-insensitive search on Email`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#2 — Case-insensitive email match

**TC-E3-P1-03 (1 test):**

- `should filter 1,000 contacts in under 150ms`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#2, NFR1 — Client-side useMemo filter completes < 150ms for 1,000 records

**TC-E3-P2-01 (1 test):**

- `should display loading skeleton before data arrives (200ms delay)`
  - **Status:** RED — Cannot find module `./ContactoListView`
  - **Verifies:** AC#1 — Skeleton visible during fetch; disappears after data arrives

---

### E2E Tests — Playwright (10 tests)

**File:** `e2e/tests/contactos/contactos-list-search.spec.ts`

**AC#1 group (2 tests):**

- `AC#1 — debe mostrar lista de contactos con Nombre, Cargo y Email`
  - **Status:** RED — Route `/contactos` renders placeholder "Próximamente" instead of ContactoListView
  - **Verifies:** AC#1 — Contact rows visible with Nombre, Cargo, Email after API seed

- `AC#1 — debe mostrar múltiples contactos en la lista`
  - **Status:** RED — contacto-row elements not present
  - **Verifies:** AC#1 — Multiple contacts rendered simultaneously

**AC#2 group (5 tests):**

- `AC#2 — debe filtrar contactos en tiempo real por Nombre`
  - **Status:** RED — search input not present
  - **Verifies:** AC#2, FR11 — Real-time nombre filter

- `AC#2 — debe filtrar contactos en tiempo real por Email`
  - **Status:** RED — search input not present
  - **Verifies:** AC#2, FR12 — Real-time email filter

- `AC#2 — búsqueda por Nombre debe ser case-insensitive`
  - **Status:** RED — search input not present
  - **Verifies:** AC#2 — Case-insensitive nombre search

- `AC#2 — limpiar búsqueda restaura lista completa`
  - **Status:** RED — search input not present
  - **Verifies:** AC#2 — Clear search restores full list

- `AC#2 — no debe llamar al API en cada keystroke (filtrado client-side)`
  - **Status:** RED — search input not present
  - **Verifies:** AC#2 — No additional GET on each keystroke (client-side filtering)

**AC#3 group (1 test):**

- `AC#3 — debe mostrar EmptyState cuando no hay contactos`
  - **Status:** RED — EmptyState not wired in placeholder route
  - **Verifies:** AC#3 — EmptyState with Spanish text on empty API response

**AC#4 group (2 tests):**

- `AC#4 — debe mostrar ErrorPanel cuando el backend falla al cargar`
  - **Status:** RED — ErrorPanel not wired in placeholder route
  - **Verifies:** AC#4 — ErrorPanel shown on 500 response

- `AC#4 — debe mostrar botón Reintentar que dispara nuevo fetch`
  - **Status:** RED — Reintentar button not present
  - **Verifies:** AC#4 — Retry button triggers new fetch and shows data on success

---

### API Integration Tests — xUnit (3 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosEndpointsTests.cs`

**TC-E3-P1-04 (1 test):**

- `TC_E3_P1_04_GetContactos_Returns200_WithDirectArrayAndAllDtoFields`
  - **Status:** RED — 404 because GET /api/v1/contactos is not registered in Program.cs
  - **Verifies:** AC#1 — Endpoint returns 200, direct JSON array, all DTO fields present with correct types (id: UUID, nombre: string, cargo: string, telefono: string, email: string, clienteId: null|UUID, createdAt: ISO 8601 with TZ)

- `GetContactos_Returns200_WithEmptyArray_WhenNoneExist`
  - **Status:** RED — 404 (endpoint not registered)
  - **Verifies:** AC#1 edge — Empty array response when no contacts in DB

- `GetContactos_Returns_ContentTypeApplicationJson`
  - **Status:** RED — 404 (endpoint not registered)
  - **Verifies:** Response Content-Type is application/json

---

## Test File Locations

| Level | File |
|-------|------|
| Unit (Schema) | `frontend/src/modules/crm/contactos/application/contactoSchema.test.ts` |
| Component | `frontend/src/modules/crm/contactos/presentation/ContactoListView.test.tsx` |
| E2E | `e2e/tests/contactos/contactos-list-search.spec.ts` |
| API Integration | `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosEndpointsTests.cs` |
| MSW Handlers | `frontend/src/test/msw/handlers/contactos.handlers.ts` |
| Test Factory | `frontend/src/test/factories/contacto.factory.ts` |

---

## Test Support Files Created

- `frontend/src/test/factories/contacto.factory.ts` — `createContacto()`, `createContactos()`, `resetContactoCounter()`
- `frontend/src/test/msw/handlers/contactos.handlers.ts` — `handleGetContactosSuccess()`, `handleGetContactosEmpty()`, `handleGetContactosError()`, `handleGetContactos1000()`, `handleGetContactosDelayed()`

---

## Acceptance Criteria Coverage Matrix

| AC | Unit Tests | Component Tests | E2E Tests | API Tests |
|----|-----------|-----------------|-----------|-----------|
| AC#1 — List contacts (Nombre, Cargo, Email) | — | TC-E3-P0-01 (3) | AC#1 (2) | TC-E3-P1-04 (1) |
| AC#2 — Real-time search Nombre/Email < 1s | TC-E3-SCHEMA (12) | TC-E3-P1-01,02,03 (7) | AC#2 (5) | — |
| AC#3 — EmptyState when no contacts | — | TC-E3-P0-02 (3) | AC#3 (1) | Empty array (1) |
| AC#4 — ErrorPanel + Reintentar on failure | — | TC-E3-P0-03 (3) | AC#4 (2) | — |
| Loading state | — | TC-E3-P2-01 (1) | — | — |

**Total tests in RED phase: 41**
- Unit (Schema): 12
- Component (Vitest+RTL+MSW): 16
- E2E (Playwright): 10
- API Integration (xUnit): 3

---

## Quality Gate

All 41 tests are expected to FAIL (RED) because:

1. `frontend/src/modules/crm/contactos/` module does not exist (no domain, application, infrastructure, or presentation layers)
2. `frontend/src/routes/_app/contactos.tsx` renders a placeholder instead of `ContactoListView`
3. `GET /api/v1/contactos` endpoint is not registered in `Program.cs`
4. `ContactoEntity` does not exist in `SiesaAgents.Domain`

**Definition of DONE for GREEN phase:** All 41 tests pass after implementing Story 3.1 tasks 1–8.
