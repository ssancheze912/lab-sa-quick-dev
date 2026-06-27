---
epic: 3
title: "Contact Management"
phase: 4
mode: epic-level
date: 2026-05-21
stories:
  - "3.1: Contact List & Search"
  - "3.2: Contact Detail View"
  - "3.3: Create Contact"
  - "3.4: Edit Contact"
  - "3.5: Delete Contact"
frs_covered: [FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16]
nfrs_relevant: [NFR1, NFR2, NFR5, NFR6]
status: complete
---

# Test Design — Epic 3: Contact Management

## 1. Epic Overview

Epic 3 delivers the complete CRUD lifecycle for contact records as standalone entities in Siesa Agents CRM. Contacts exist independently of any client relationship — they have a nullable `clienteId` FK that is out of scope for this epic (covered in Epic 4). The contact table view lives at `/contactos`; the detail view at `/contactos/:contactoId`.

| Story | Scope |
|---|---|
| 3.1 | Contact table list at `/contactos`; real-time search by Nombre/Email; EmptyState; ErrorPanel |
| 3.2 | Contact detail view; URL deep linking `/contactos/:contactoId`; not-found handling |
| 3.3 | "Nuevo contacto" dialog form; POST `/api/v1/contactos`; toast success; required field validation |
| 3.4 | "Editar" pre-filled form; PUT `/api/v1/contactos/:id`; cancel preserves data |
| 3.5 | "Eliminar" confirmation dialog; DELETE `/api/v1/contactos/:id`; returns to list |

**Epic-Level Acceptance Criteria:**

| AC | Description |
|---|---|
| AC-E3.1 | User can register a new contact (Nombre, Cargo, Teléfono, Email) and it appears in the list immediately |
| AC-E3.2 | User can search contacts by name or email and see results in under 1 second |
| AC-E3.3 | User can view full contact detail, edit any field and save changes |
| AC-E3.4 | System prevents saving a contact with empty required fields, showing clear error messages |
| AC-E3.5 | User can delete a contact and it disappears from the list |

**FRs Covered:** FR9 (create), FR10 (list), FR11 (search by name), FR12 (search by email), FR13 (view detail), FR14 (edit), FR15 (delete), FR16 (required field validation)

**NFRs Applicable:**
- NFR1: Search results in < 1s with up to 1,000 records
- NFR2: CRUD changes reflected in UI in < 2s
- NFR5: Input validation and sanitization (FluentValidation + Zod)
- NFR6: No stack traces or internal errors exposed to user

---

## 2. Risk Assessment

### Risk Matrix

| ID | Risk | Probability | Impact | Priority | Mitigation |
|---|---|---|---|---|---|
| R1 | Real-time search fires a new API call on every keystroke instead of filtering the in-memory TanStack Query cache | High | High | P0 | E2E test: type multiple characters, assert only the initial GET `/api/v1/contactos` is made; no subsequent network calls during typing |
| R2 | TanStack Query cache not invalidated after create/edit/delete — list does not update without page reload (FR27 violated) | High | High | P0 | E2E tests: assert new/edited/deleted contact appears/disappears in table immediately without `page.reload()` |
| R3 | Required field validation only runs on backend — empty form submitted, causing unnecessary round trip and poor UX | High | High | P0 | E2E test: submit empty form, assert no POST call fired; inline error messages visible on all 4 fields |
| R4 | Email field uniqueness not enforced per PRD — duplicate emails accepted silently | Medium | High | P1 | API test: POST same email twice, assert second returns 409 or 400 with error detail. Note: check if FR16 implies email uniqueness scoped to this epic or only within a client (Epic 4) |
| R5 | Deep link `/contactos/:contactoId` with non-existent ID throws uncaught exception instead of graceful not-found UI | Medium | High | P1 | E2E test: navigate to `/contactos/00000000-0000-0000-0000-000000000000`; assert not-found component renders; assert no `pageerror` event |
| R6 | Cancel on Edit form fires PUT request — data changed in backend despite user intent to discard | Medium | High | P1 | E2E test: open edit form, modify field, click Cancelar; assert no PUT request fired; original data unchanged |
| R7 | `clienteId` field included in Epic 3 contact creation — breaks scope boundary; should be `null` by default until Epic 4 | Medium | Medium | P1 | API test: POST new contact without `clienteId`; GET by id; assert `clienteId === null` in response |
| R8 | EmptyState not shown when contact list is genuinely empty — blank table area with no user guidance | Medium | Medium | P2 | E2E test: ensure no pre-existing contacts, navigate to `/contactos`, assert EmptyState component visible |
| R9 | ErrorPanel with "Reintentar" button not rendered when API call fails — no user feedback on network error | Low | High | P2 | E2E test with `page.route` mock 500: navigate to `/contactos`, assert ErrorPanel + Reintentar button visible |
| R10 | URL not updated when clicking a contact row — deep linking for `/contactos/:id` broken (FR30) | Low | Medium | P2 | E2E test: click contact row, assert URL changes to `/contactos/{uuid}` pattern |
| R11 | ContactosPage POM `contactoRows` locator (`data-testid="contacto-row"`) missing from implementation | Low | Medium | P1 | POM audit before first E2E run; assert locator resolves to at least one element on populated list |
| R12 | Search debounce timing mismatch — `buscar()` helper fills input but results appear after test assertion | Low | Medium | P2 | Add `waitForResponse` or fixed `waitForTimeout(300)` after `buscar()` in helper; assert row count changes |

**Top 3 Critical Risk Areas:**

1. **Cache invalidation after mutation (R2)** — If TanStack Query keys `['contactos']` are not invalidated after create/edit/delete, the contact table will show stale data violating FR27. This risk is structural and affects Stories 3.3, 3.4, and 3.5.
2. **Client-side search vs. API re-fetch (R1)** — Epic 3 manages up to 1,000 contact records. The architecture specifies client-side filtering via `useMemo` over the TanStack Query cache. Any deviation (debounce calling API per keystroke) breaks NFR1 and creates load risk.
3. **Frontend-only form validation (R3)** — All 4 fields (Nombre, Cargo, Teléfono, Email) are required per FR16. If Zod validation is not wired to React Hook Form, invalid payloads reach the backend unnecessarily, and users get poor error feedback. This is the highest-frequency user interaction failure point.

---

## 3. Test Strategy by Level

### Level Distribution

| Level | Tool | Volume | Focus |
|---|---|---|---|
| E2E (UI) | Playwright (chromium) | 26 tests | Full user journeys, form interactions, table behaviors, URL routing |
| API / Integration | Playwright APIRequestContext | 9 tests | REST contract validation, 400/404/500 error responses, nullable clienteId |
| Component / Unit | Vitest + RTL (frontend) | 6 tests | Contact search filter function, contactoSchema Zod validation |
| Backend Unit | xUnit | 5 tests | ContactoValidator (FluentValidation), ContactoService command handlers |

**Total: 46 test cases**

### Playwright Projects Applicable

| Project | Rationale |
|---|---|
| chromium (Desktop Chrome) | Primary — all E2E tests |
| firefox | Secondary coverage for form interactions |
| mobile-chrome (Pixel 5) | Responsive layout: contact table scrolls correctly on mobile viewport |

### Key Testing Principles for Epic 3

- All API setup/teardown uses `ApiHelper` (`e2e/helpers/api.helper.ts`) — already has `createContacto`, `deleteContacto`, `getContactos`. No UI to create test data.
- All test data built with `buildContacto()` from `data.helper.ts` — no hardcoded email addresses.
- Each test cleans up its own created records in `afterEach` via `apiHelper.deleteContacto(id)`.
- All text assertions use Spanish patterns with case-insensitive regex (`/guardar/i`, `/cancelar/i`, `/nuevo contacto/i`).
- Network interception via `page.route()` for error scenarios — no test infrastructure changes needed.
- The `ContactosPage` POM (`e2e/pages/contactos.page.ts`) already exists with all required locators. No extension needed for Epic 3 (no sort control in this epic).
- Search assertions: after `contactosPage.buscar(termino)`, use `contactoRows.count()` or filter by `hasText`. Add `waitForTimeout(350)` after fill if debounce is implemented.

---

## 4. Test Cases

### 4.1 E2E Tests (Playwright)

#### File: `e2e/tests/contactos/contactos-list.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-CT-01 | P0 | 3.1 | AC-E3.2 | Contact table renders all contacts returned by API on page load |
| E2E-CT-02 | P0 | 3.1 | AC-E3.2 | Typing in search input filters table to matching contacts by Nombre in real time without new API calls |
| E2E-CT-03 | P0 | 3.1 | AC-E3.2 | Typing email fragment in search input filters table to matching contacts by Email |
| E2E-CT-04 | P1 | 3.1 | — | Clearing search input after filtering restores full contact list |
| E2E-CT-05 | P2 | 3.1 | — | EmptyState component is visible when no contacts exist in the system |
| E2E-CT-06 | P2 | 3.1 | — | ErrorPanel with "Reintentar" button is shown when API returns 500 on load |

**Implementation notes:**
- E2E-CT-02: Use `page.route('**/api/v1/contactos', ...)` to assert only 1 GET call is made on page load; subsequent filter is client-side. Type multiple characters, assert no additional GET network requests via `page.on('request', ...)` listener.
- E2E-CT-03: Create 3 contacts with distinct emails. Type partial email of one. Assert only 1 row visible. Assert no new GET `/api/v1/contactos` fired.
- E2E-CT-05: Requires isolation — clear all contacts via `apiHelper` in `beforeEach` or mock empty `[]` response with `page.route`.
- E2E-CT-06: Use `page.route('**/api/v1/contactos', route => route.fulfill({ status: 500 }))` before `contactosPage.goto()`.

---

#### File: `e2e/tests/contactos/contactos-detail.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-CT-07 | P0 | 3.2 | AC-E3.3 | Clicking a contact row shows full detail (Nombre, Cargo, Teléfono, Email) in detail panel |
| E2E-CT-08 | P1 | 3.2 | — | URL updates to `/contactos/:contactoId` after clicking a contact row (FR30) |
| E2E-CT-09 | P1 | 3.2 | — | Direct navigation to `/contactos/:contactoId` loads correct contact detail without prior list interaction |
| E2E-CT-10 | P1 | 3.2 | — | Direct navigation to `/contactos/00000000-0000-0000-0000-000000000000` shows not-found message gracefully |

**Implementation notes:**
- E2E-CT-07: Create contact via `apiHelper.createContacto()`. Navigate to `/contactos`, click the row matching the name. Assert `contactosPage.detailPanel` is visible and contains all 4 field values.
- E2E-CT-08: After `contactosPage.seleccionarContacto(nombre)`, assert `page.url()` matches `/contactos/{uuid}` using regex `/\/contactos\/[0-9a-f]{8}-/`.
- E2E-CT-09: Use `page.goto('/contactos/' + contacto.id)` directly. Assert `detailPanel` shows correct nombre without first rendering the list.
- E2E-CT-10: Assert not-found component is visible and listen for `page.on('pageerror', err => throw err)` — must not trigger.

---

#### File: `e2e/tests/contactos/contactos-create.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-CT-11 | P0 | 3.3 | AC-E3.1 | Clicking "Nuevo contacto" opens the form dialog with all 4 required fields visible (Nombre, Cargo, Teléfono, Email) |
| E2E-CT-12 | P0 | 3.3 | AC-E3.1 | Submitting all required fields creates contact and it appears in table immediately (no reload) |
| E2E-CT-13 | P0 | 3.3 | AC-E3.4 | Submitting empty form shows inline error messages on all 4 fields and does NOT call POST API |
| E2E-CT-14 | P0 | 3.3 | AC-E3.4 | Submitting partially empty form shows error only on empty required fields |
| E2E-CT-15 | P1 | 3.3 | AC-E3.1 | Success toast "Contacto creado correctamente" appears after successful create |
| E2E-CT-16 | P1 | 3.3 | — | Form closes automatically after successful create |
| E2E-CT-17 | P1 | 3.3 | — | New contact created via form has `clienteId = null` (no client association in Epic 3) |

**Implementation notes:**
- E2E-CT-12: After `contactosPage.guardar()`, assert `contactosPage.form` is hidden and the new contact's nombre is visible in `contactosPage.contactoRows`. Monitor: no `page.reload()` call — optimistic update via TanStack Query `invalidateQueries(['contactos'])`.
- E2E-CT-13: Before clicking guardar with empty form, set request listener: `page.on('request', r => { if (r.url().includes('/contactos') && r.method() === 'POST') fail() })`. Click guardar, assert form still visible with 4 inline error messages.
- E2E-CT-15: Assert `page.getByRole('status')` or `page.getByText(/contacto creado correctamente/i)` is visible.
- E2E-CT-17: After create via form, call `apiHelper.getContactos()`, find by nombre, assert `clienteId === null`.

---

#### File: `e2e/tests/contactos/contactos-edit.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-CT-18 | P0 | 3.4 | AC-E3.3 | Clicking "Editar" on a contact opens pre-filled form with current values of all 4 fields |
| E2E-CT-19 | P0 | 3.4 | AC-E3.3 | Modifying a field and saving updates detail panel and list row immediately (no reload) |
| E2E-CT-20 | P0 | 3.4 | AC-E3.4 | Clearing a required field and saving shows inline error; no PUT API call fired |
| E2E-CT-21 | P1 | 3.4 | — | Success toast "Contacto actualizado correctamente" appears after successful edit |
| E2E-CT-22 | P1 | 3.4 | — | Clicking "Cancelar" closes form without making PUT request; original data unchanged |

**Implementation notes:**
- E2E-CT-18: After clicking Editar, assert `contactosPage.inputNombre.inputValue()` equals the contact's nombre; assert `contactosPage.inputEmail.inputValue()` equals the email.
- E2E-CT-19: Modify nombre to a unique value. After save, assert new nombre visible in `contactosPage.contactoRows` and `contactosPage.detailPanel`.
- E2E-CT-20: Clear `inputNombre`, click guardar. Assert form visible, error message visible on Nombre field. Use request interceptor to assert no PUT call fired.
- E2E-CT-22: Use `page.route` to intercept PUT to `/api/v1/contactos/*` and fail if called; open edit, modify field, click Cancelar. Assert original nombre still displayed in detail.

---

#### File: `e2e/tests/contactos/contactos-delete.spec.ts`

| Test ID | Priority | Story | AC | Description |
|---|---|---|---|---|
| E2E-CT-23 | P0 | 3.5 | AC-E3.5 | Clicking "Eliminar" shows confirmation dialog with "Confirmar" and "Cancelar" buttons |
| E2E-CT-24 | P0 | 3.5 | AC-E3.5 | Confirming deletion removes contact from table immediately and returns to contact list view |
| E2E-CT-25 | P0 | 3.5 | AC-E3.5 | Success toast "Contacto eliminado correctamente" appears after deletion |
| E2E-CT-26 | P1 | 3.5 | — | Clicking "Cancelar" in confirmation dialog leaves contact in table unchanged |

**Implementation notes:**
- E2E-CT-23: Create contact via `apiHelper`. Navigate to `/contactos`, select contact, click Eliminar. Assert dialog visible with both buttons. Assert no DELETE fired yet.
- E2E-CT-24: After confirmar, assert the deleted contact's nombre is no longer in `contactosPage.contactoRows`. Assert view navigates to `/contactos` (URL check).
- E2E-CT-26: Use request interceptor to assert no DELETE call; click Cancelar in dialog; assert contact row still present in table.

---

### 4.2 API / Integration Tests

#### File: `e2e/tests/contactos/contactos-api.spec.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| API-CT-01 | P0 | 3.3 | POST `/api/v1/contactos` with valid payload returns 201 and body with `id` (UUID), `nombre`, `cargo`, `telefono`, `email`, `clienteId` (null), `createdAt` |
| API-CT-02 | P0 | 3.3 | POST `/api/v1/contactos` with missing `nombre` returns 400 and Problem Details body (no stack trace) |
| API-CT-03 | P0 | 3.3 | POST `/api/v1/contactos` with missing `email` returns 400 and Problem Details body |
| API-CT-04 | P0 | 3.3 | POST `/api/v1/contactos` with missing `cargo` returns 400 and Problem Details body |
| API-CT-05 | P0 | 3.4 | PUT `/api/v1/contactos/:id` with valid changes returns 200 and updated fields in body |
| API-CT-06 | P0 | 3.5 | DELETE `/api/v1/contactos/:id` returns 204 and subsequent GET `/api/v1/contactos/:id` returns 404 |
| API-CT-07 | P1 | 3.1 | GET `/api/v1/contactos` returns array of contacts; each item has `id`, `nombre`, `email`, `cargo` fields |
| API-CT-08 | P1 | 3.2 | GET `/api/v1/contactos/:id` with valid ID returns 200 and full contact object with `clienteId: null` |
| API-CT-09 | P1 | 3.2 | GET `/api/v1/contactos/:id` with non-existent ID returns 404 and Problem Details (no stack trace) |

**Implementation notes:**
- All API tests use `request` fixture from Playwright — no browser UI involved.
- API-CT-01: Assert `id` matches UUID v4 pattern (`/^[0-9a-f]{8}-/i`); assert `clienteId === null` (Epic 3 scope); assert `createdAt` is ISO 8601 with timezone offset.
- API-CT-02/03/04: Assert `response.status() === 400`; parse JSON body and assert no `stackTrace` key present (NFR6); assert `errors` object contains the field name with error message.
- API-CT-06: POST a contact, DELETE it, then GET it. Assert final GET returns 404 and Problem Details.
- API-CT-09: Assert `response.status() === 404`; parse body and assert no `stackTrace` key (NFR6).

---

### 4.3 Component / Unit Tests (Frontend — Vitest)

#### File: `frontend/src/modules/crm/contactos/__tests__/contactoSchema.test.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-CT-01 | P1 | 3.3/3.4 | `contactoSchema` rejects object with empty `nombre` — returns ZodError |
| UNIT-CT-02 | P1 | 3.3/3.4 | `contactoSchema` rejects object with empty `email` — returns ZodError |
| UNIT-CT-03 | P1 | 3.3/3.4 | `contactoSchema` rejects object with invalid email format — returns ZodError |
| UNIT-CT-04 | P1 | 3.3/3.4 | `contactoSchema` accepts valid payload with all 4 required fields — returns parsed object |

#### File: `frontend/src/modules/crm/contactos/__tests__/filterContactos.test.ts`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-CT-05 | P1 | 3.1 | `filterContactos(contacts, 'Juan')` returns only contacts whose `nombre` contains 'Juan' (case-insensitive) |
| UNIT-CT-06 | P1 | 3.1 | `filterContactos(contacts, 'test@')` returns only contacts whose `email` contains 'test@' (case-insensitive) |

---

### 4.4 Backend Unit Tests (xUnit)

#### File: `backend/tests/SiesaAgents.UnitTests/Validators/ContactoValidatorTests.cs`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-B-CT-01 | P1 | 3.3/3.4 | `CreateContactoCommand` validator: empty Nombre fails with localized error message |
| UNIT-B-CT-02 | P1 | 3.3/3.4 | `CreateContactoCommand` validator: empty Email fails with error message |
| UNIT-B-CT-03 | P1 | 3.3/3.4 | `CreateContactoCommand` validator: valid payload (Nombre + Cargo + Telefono + Email) passes validation |

#### File: `backend/tests/SiesaAgents.UnitTests/Handlers/ContactoHandlerTests.cs`

| Test ID | Priority | Story | Description |
|---|---|---|---|
| UNIT-B-CT-04 | P1 | 3.3 | `CreateContactoHandler` returns created `ContactoDto` with UUID id and `ClienteId = null` on success |
| UNIT-B-CT-05 | P1 | 3.5 | `DeleteContactoHandler` does not throw when deleting existing contact with no client association |

---

## 5. Test Execution Order & Priority

### P0 — Blocking (gate for beginning story implementation)

1. API-CT-01 — POST create returns 201 with valid contract (clienteId=null)
2. API-CT-02 — Missing nombre returns 400 Problem Details (no stack trace)
3. API-CT-03 — Missing email returns 400 Problem Details
4. API-CT-04 — Missing cargo returns 400 Problem Details
5. API-CT-06 — DELETE returns 204; subsequent GET returns 404
6. API-CT-05 — PUT returns 200 with updated fields
7. E2E-CT-01 — Table renders on page load
8. E2E-CT-02 — Real-time search by Nombre (client-side, no extra API calls)
9. E2E-CT-11 — Form opens with 4 fields
10. E2E-CT-12 — Create contact appears in table immediately
11. E2E-CT-13 — Empty form: error messages shown, no POST fired
12. E2E-CT-18 — Edit form pre-filled with current values
13. E2E-CT-19 — Edit save updates table row immediately
14. E2E-CT-20 — Edit: clear required field → error, no PUT fired
15. E2E-CT-23 — Delete confirmation dialog
16. E2E-CT-24 — Delete removes from table immediately
17. E2E-CT-07 — Detail panel renders all 4 fields

### P1 — High (should pass before second story in sprint)

- E2E-CT-03 (search by Email), E2E-CT-04 (clear search)
- E2E-CT-08 (URL update), E2E-CT-09 (deep link), E2E-CT-10 (not-found)
- E2E-CT-14 (partial validation), E2E-CT-15 (create toast), E2E-CT-16 (form close), E2E-CT-17 (clienteId=null)
- E2E-CT-21 (edit toast), E2E-CT-22 (cancel no PUT)
- E2E-CT-25 (delete toast), E2E-CT-26 (cancel no DELETE)
- API-CT-07, API-CT-08, API-CT-09
- UNIT-CT-01 through UNIT-CT-06
- UNIT-B-CT-01 through UNIT-B-CT-05

### P2 — Medium (complete within epic sprint)

- E2E-CT-05 (EmptyState)
- E2E-CT-06 (ErrorPanel with Reintentar)
- E2E-CT-10 (not-found graceful)
- Mobile-chrome: E2E-CT-01, E2E-CT-11, E2E-CT-12 run on Pixel 5 viewport

### P3 — Low (nice to have)

- Cross-browser: E2E-CT-02, E2E-CT-12, E2E-CT-19, E2E-CT-24 run on firefox project
- Performance assertion: E2E-CT-02 with `performance.now()` check that filter result renders in < 1000ms (NFR1 — 1,000 records)
- NFR2 timing assertion on create/edit/delete: measure from click to list update < 2000ms

---

## 6. Test File Structure

```
e2e/
  tests/
    contactos/
      contactos-list.spec.ts           # E2E-CT-01 to E2E-CT-06
      contactos-detail.spec.ts         # E2E-CT-07 to E2E-CT-10
      contactos-create.spec.ts         # E2E-CT-11 to E2E-CT-17
      contactos-edit.spec.ts           # E2E-CT-18 to E2E-CT-22
      contactos-delete.spec.ts         # E2E-CT-23 to E2E-CT-26
      contactos-api.spec.ts            # API-CT-01 to API-CT-09
  pages/
    contactos.page.ts                  # Existing — no extension needed for Epic 3
  helpers/
    api.helper.ts                      # Existing — createContacto, deleteContacto, getContactos ready
    data.helper.ts                     # Existing — buildContacto() ready to use
  fixtures/
    base.fixture.ts                    # Existing — reuse as-is

frontend/src/
  modules/crm/contactos/__tests__/
    contactoSchema.test.ts             # UNIT-CT-01 to UNIT-CT-04
    filterContactos.test.ts            # UNIT-CT-05 to UNIT-CT-06

backend/tests/
  SiesaAgents.UnitTests/
    Validators/
      ContactoValidatorTests.cs        # UNIT-B-CT-01 to UNIT-B-CT-03
    Handlers/
      ContactoHandlerTests.cs          # UNIT-B-CT-04 to UNIT-B-CT-05
```

---

## 7. ContactosPage POM — Audit Notes

The existing `e2e/pages/contactos.page.ts` is complete for Epic 3 with no extension required. Key locators confirmed ready:

- `searchInput` → `page.getByPlaceholder(/buscar contacto/i)`
- `contactoRows` → `page.getByTestId('contacto-row')` — verify `data-testid="contacto-row"` is applied to each `<tr>` or list item in `ContactoListView.tsx`
- `btnNuevoContacto` → `page.getByRole('button', { name: /nuevo contacto/i })`
- `form` → `page.getByRole('dialog')`
- `detailPanel` → `page.getByTestId('contacto-detail-panel')` — verify `data-testid="contacto-detail-panel"` exists on the detail container

**Search debounce note:** If `ContactoListView.tsx` implements a debounce (recommended: 150ms), add `await contactosPage.page.waitForTimeout(300)` after `contactosPage.buscar(termino)` before asserting row count.

---

## 8. Coverage Matrix — Epic 3

| Requirement | Test IDs | Level | Status |
|---|---|---|---|
| AC-E3.1 (create contact appears immediately) | E2E-CT-11, E2E-CT-12, API-CT-01 | E2E + API | Designed |
| AC-E3.2 (search < 1s, 1000 records) | E2E-CT-01, E2E-CT-02, E2E-CT-03 | E2E | Designed |
| AC-E3.3 (view detail, edit, save) | E2E-CT-07, E2E-CT-18, E2E-CT-19 | E2E | Designed |
| AC-E3.4 (block save on empty required) | E2E-CT-13, E2E-CT-14, E2E-CT-20, UNIT-B-CT-01, UNIT-B-CT-02 | E2E + Unit | Designed |
| AC-E3.5 (delete removes from list) | E2E-CT-23, E2E-CT-24, API-CT-06 | E2E + API | Designed |
| FR9 (create contact record) | E2E-CT-12, API-CT-01, UNIT-B-CT-04 | E2E + API + Unit | Designed |
| FR10 (list all contacts) | E2E-CT-01, API-CT-07 | E2E + API | Designed |
| FR11 (search by name) | E2E-CT-02, E2E-CT-04 | E2E | Designed |
| FR12 (search by email) | E2E-CT-03 | E2E | Designed |
| FR13 (view contact detail) | E2E-CT-07, E2E-CT-09, API-CT-08 | E2E + API | Designed |
| FR14 (edit contact) | E2E-CT-18, E2E-CT-19, API-CT-05 | E2E + API | Designed |
| FR15 (delete contact) | E2E-CT-23, E2E-CT-24, API-CT-06 | E2E + API | Designed |
| FR16 (required field validation) | E2E-CT-13, E2E-CT-14, E2E-CT-20, API-CT-02, API-CT-03, API-CT-04, UNIT-B-CT-01, UNIT-B-CT-02, UNIT-B-CT-03 | All levels | Designed |
| FR27 (changes immediately visible) | E2E-CT-12, E2E-CT-19, E2E-CT-24 | E2E | Designed |
| FR30 (deep linking /contactos/:id) | E2E-CT-08, E2E-CT-09, E2E-CT-10 | E2E | Designed |
| NFR1 (search < 1s) | E2E-CT-02 (+ P3 perf assertion) | E2E | Designed |
| NFR2 (CRUD < 2s) | E2E-CT-12, E2E-CT-19, E2E-CT-24 (P3 timing) | E2E | Designed |
| NFR5 (input validation + sanitization) | API-CT-02, API-CT-03, API-CT-04, UNIT-B-CT-01, UNIT-B-CT-02 | API + Unit | Designed |
| NFR6 (no stack traces) | API-CT-02, API-CT-09 | API | Designed |
| clienteId = null (Epic 3 scope boundary) | E2E-CT-17, API-CT-01, API-CT-08, UNIT-B-CT-04 | All levels | Designed |
| contactoSchema Zod validation | UNIT-CT-01, UNIT-CT-02, UNIT-CT-03, UNIT-CT-04 | Unit | Designed |
| Client-side search filter logic | UNIT-CT-05, UNIT-CT-06 | Unit | Designed |

**Coverage: 22/22 requirements addressed — 100%**

---

## 9. Definition of Done (Epic 3 Testing)

- [ ] All P0 test cases (17) pass before any story is considered dev-complete
- [ ] All P1 test cases (21) pass before Epic 3 is closed
- [ ] `contactosPage.contactoRows` locator resolves (`data-testid="contacto-row"` present in implementation)
- [ ] `contactos-api.spec.ts` passes fully against running backend — confirms REST contract
- [ ] API-CT-01 confirms `clienteId: null` in response — Epic 3 scope boundary enforced
- [ ] No test uses hardcoded email addresses — all use `buildContacto()` factory
- [ ] All Spanish text assertions use case-insensitive regex (no hardcoded exact strings)
- [ ] `afterEach` cleanup in all E2E spec files calls `apiHelper.deleteContacto(id)` for every created record
- [ ] `page.on('pageerror', ...)` listener added to deep link and error scenario tests (E2E-CT-10, E2E-CT-06)
- [ ] Mobile-chrome project run confirmed for P2 responsive tests (E2E-CT-01, E2E-CT-11, E2E-CT-12)
- [ ] Search debounce: `waitForTimeout(300)` added after `buscar()` call in all list filter assertions
