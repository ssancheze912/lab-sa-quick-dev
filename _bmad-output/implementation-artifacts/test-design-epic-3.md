---
epic: 3
title: "Contact Management"
mode: epic-level
phase: 4
createdAt: "2026-07-01"
updatedAt: "2026-07-01"
stories:
  - "3.1 — Contact List & Search"
  - "3.2 — Contact Detail View"
  - "3.3 — Create Contact"
  - "3.4 — Edit Contact"
  - "3.5 — Delete Contact"
status: complete
epicImplementationStatus: pending
storyStatuses:
  3.1: pending
  3.2: pending
  3.3: pending
  3.4: pending
  3.5: pending
---

# Test Design — Epic 3: Contact Management

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 3 delivers the full CRUD lifecycle for the `contactos` domain: list with real-time search (by Nombre or Email), detail view with deep linking, creation and editing via a validated form, and deletion with confirmation. This epic is structurally a **near-mirror of Epic 2 (Clientes)** — same split-panel UI pattern, same FluentValidation (backend) + Zod (frontend) validation approach, same TanStack Query optimistic-update/invalidation strategy — applied to a different domain entity.

**Critical starting condition (unique to this epic):** the `contactos` table, `ContactoEntity`, `ContactoConfiguration` (EF Core mapping incl. the `fk_contactos_clientes` FK with `ON DELETE SET NULL`), and the migration already exist in the codebase — introduced minimally by Story 2.5 solely to prove the FK-orphaning behavior when a client is deleted. **No migration work is in scope for Epic 3.** What's missing and must be built: `IContactoRepository` + EF implementation, Application layer (Commands/Queries/Validators for Create/Update/Delete/GetAll/GetById), `ContactoEndpoints`, and the full frontend module (`src/modules/crm/contactos/` — domain/application/infrastructure/presentation layers mirroring `clientes/`) replacing the current placeholder `ContactosView` stub at `src/routes/_app/contactos.tsx`.

This distinction drives two epic-specific testing priorities: (1) verify the **existing** entity/schema is reused correctly (no accidental re-migration, no drift between `ContactoEntity` and the new DTOs/validators), and (2) verify the new CRUD surface behaves consistently with the Epic 2 pattern it mirrors (same toast conventions, same validation independence, same optimistic UI).

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 3.1 | Contact List & Search | Real-time client-side filter by Nombre/Email, NFR1 (<1s/1000 records — larger dataset than Epic 2's 500), EmptyState, ErrorPanel + retry |
| 3.2 | Contact Detail View | Deep linking `/contactos/:contactoId`, not-found handling |
| 3.3 | Create Contact | Required-field validation (Nombre, Cargo, Teléfono, Email) via Zod + FluentValidation, success toast, immediate list update |
| 3.4 | Edit Contact | Pre-filled form, partial update, cancel-preserves-data, required-field validation |
| 3.5 | Delete Contact | Confirmation dialog, contact removed from list, success toast |

### Out of Scope for This Epic

- Re-creating or re-migrating the `contactos` table / `ContactoEntity` / FK configuration — these already exist (Story 2.5) and must be reused as-is
- Client↔Contact association UI: assigning/reassigning a contact to a client, "Sin cliente" filter, viewing a contact's client from its detail (FR17–FR26 → Epic 4)
- Email format validation beyond "required, non-empty" (no explicit AC requires format/regex validation — flagged as an assumption, see Section 10)
- Authentication/authorization (deferred — MVP)
- Pagination (list loads all records; NFR10 caps at 1,000 contacts)

---

## 2. Risk Assessment

### Risk Matrix

| # | Risk Area | Category | Probability | Impact | Score | Priority | Mitigation Strategy |
|---|-----------|----------|-------------|--------|-------|----------|----------------------|
| R1 | **Entity/schema drift**: new Application-layer DTOs, Commands, or the frontend Zod schema diverge from the *already-existing* `ContactoEntity` (e.g., assume different field names/nullability, or a dev re-generates a migration that conflicts with the Story 2.5 migration), breaking the FK `ON DELETE SET NULL` contract Epic 2 depends on | TECH/DATA | 2 | 3 | 6 | P0 | Integration test: confirm no new migration is generated for `contactos` table; assert `ContactoConfiguration` (FK `fk_contactos_clientes`, `OnDelete(SetNull)`) is unchanged; regression-run Epic 2's TC-E2-P0-03 (delete client orphans contacts) to prove Epic 3's repository/endpoint additions did not alter the existing mapping |
| R2 | **Required-field validation bypass**: frontend Zod schema and backend FluentValidator diverge, allowing empty Nombre/Cargo/Teléfono/Email to reach the DB via direct API call (same class of risk as Epic 2's R3, now on a 4-field entity) | SEC/DATA | 2 | 2 | 4 | P1 | API-level test bypassing the UI: POST with empty/missing required fields, assert 400 with field-level FluentValidation errors, independent of frontend Zod |
| R3 | **Search performance regression at 1,000 records**: client-side filter is O(n²) or re-renders the full list on each keystroke; this is a stricter NFR1 bar than Epic 2 (1,000 contacts vs. 500 clients — 2x dataset) | PERF | 2 | 2 | 4 | P1 | Performance test: seed 1,000 contacts, measure filter render time on keystroke, assert <1000ms end-to-end |
| R4 | **Stale cache after mutation**: TanStack Query `invalidateQueries` key mismatch (e.g., `['contacto']` vs `['contactos']`) causes create/edit/delete to not reflect in the list without manual refresh, violating FR27/NFR2 | TECH | 2 | 2 | 4 | P1 | Component/E2E test: create/edit/delete a contact, assert list updates within 2s without page reload |
| R5 | **Deep-link not-found handling**: navigating to `/contactos/:contactoId` with a non-existent UUID throws an unhandled error or blank page instead of a graceful not-found message | BUS | 2 | 2 | 4 | P1 | E2E test: navigate to `/contactos/00000000-0000-0000-0000-000000000000`, assert graceful not-found UI, no console error/crash |
| R6 | **Search matches wrong fields**: search implementation filters only by Nombre (ignoring Email) or vice versa, silently narrowing AC-E3.2's dual-field requirement | BUS | 2 | 2 | 4 | P1 | Component test: search by a substring unique to one contact's Email (not present in any Nombre), assert that contact is returned |
| R7 | **Cancel-without-saving leaks state**: clicking "Cancelar" on the edit form partially mutates local state or triggers an unintended API call before discarding changes | BUS | 1 | 2 | 2 | P2 | Component test: edit fields, click Cancelar, assert original values displayed and zero API calls made |
| R8 | **Delete confirmation dialog dismissal**: clicking outside the dialog or pressing Esc deletes the contact instead of cancelling | DATA | 1 | 3 | 3 | P2 | Component test: open delete dialog, dismiss via Esc/backdrop click, assert contact NOT deleted |
| R9 | **EmptyState/ErrorPanel misfire**: EmptyState shown when contacts exist but the search yields zero matches (should show "no results", not "no contacts yet"), or ErrorPanel retry button doesn't actually retry the fetch | BUS | 2 | 1 | 2 | P2 | Component test: verify distinct empty-list vs. zero-search-results states; verify retry button re-invokes the query |
| R10 | **Toast message drift**: success/error toast copy doesn't match the exact Spanish strings specified in ACs ("Contacto creado correctamente", "Contacto actualizado correctamente", "Contacto eliminado correctamente"), breaking NFR7 consistency | BUS | 1 | 1 | 1 | P3 | Component test: assert exact toast text on create/edit/delete success paths |
| R11 | **`ContactoEntity`'s private-setter/factory pattern blocks partial updates**: `Create` is the only public constructor path today; an Edit command handler that doesn't add a corresponding `Update`/mutator method on the entity may be forced into an anti-pattern (e.g., reflection, or reconstructing via `Create` and losing `Id`/`CreatedAt`) | TECH | 2 | 2 | 4 | P1 | Unit test: `ContactoEntity` exposes an explicit update method (mirroring `ClienteEntity`'s pattern) that preserves `Id`/`CreatedAt` and bumps `UpdatedAt`; integration test confirms PUT preserves `Id` and `CreatedAt` across an update |

### Top 3 Risk Areas for Epic 3

1. **Entity/schema drift on top of a pre-existing table (R1)** — this is the epic's most distinctive risk: unlike Epic 2, Epic 3 does not start from a blank slate. A developer implementing the repository/commands could easily assume incorrect field constraints, accidentally scaffold a redundant migration, or (worst case) modify `ContactoConfiguration`'s FK behavior while adding CRUD — silently breaking the exact FK contract (`ON DELETE SET NULL`) that Epic 2's R2/TC-E2-P0-03 already validated. Must be caught by re-running Epic 2's delete-orphaning integration test as a regression gate, not assumed still-valid.
2. **Required-field validation independence (R2)** — structurally identical to Epic 2's highest non-DB risk; four required fields (vs. Clientes' four) means four independent bypass opportunities if FluentValidation and Zod schemas are authored independently and drift.
3. **Search performance at double the record count (R3)** — Epic 3's NFR1 target (1,000 contacts vs. 500 clients) is twice as demanding on the same client-side filtering strategy Epic 2 established; an implementation that "just barely" passed at 500 records may regress at 1,000, and this is easy to miss if the automation phase reuses Epic 2's test fixture size unchanged.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 3 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)          ▌▌▌▌▌▌▌▌         4 tests
  API Integration (xUnit)   ▌▌▌▌▌▌▌▌▌▌▌▌     10 tests
  Component (Vitest+RTL)    ▌▌▌▌▌▌▌▌▌▌▌▌▌    13 tests
  Unit (Vitest/xUnit)       ▌▌▌▌▌▌            5 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                        32 tests
```

### Rationale

- **Epic 3 is CRUD-heavy like Epic 2**, but has no uniqueness-constraint or cascading-delete complexity (Contacto has no unique business key and no dependent child entities) — this removes ~2 P0 API-integration tests relative to Epic 2's NIT/RUC-uniqueness and cascade-delete scenarios, but adds one dedicated **schema-drift regression test** unique to this epic (R1).
- **E2E is reserved for cross-cutting user journeys**: full create→list→edit→delete flow and deep linking — one fewer than Epic 2 because there is no delete-side-effect journey to verify (Contacto delete has no orphaning cascade of its own within this epic's scope).
- **Component tests dominate the frontend layer**, mirroring Epic 2's `ClienteForm`/list/search/empty/error pattern applied to `ContactoForm` and the contact list panel.
- **Unit tests cover the Zod schema, FluentValidation rules, and (new for this epic) the `ContactoEntity` update-method contract** in isolation.

---

## 4. Test Cases by Priority

### P0 — Must Pass Before Any Story Begins Implementation / Before Story Is Closed

#### TC-E3-P0-01: No New Migration Generated for `contactos` — Existing Schema Reused As-Is

**Level:** API Integration / Build-time check
**Story:** 3.3 (repository foundation), applies to all
**Requirement:** Epic constraint — reuse existing entity, no re-migration
**Risk covered:** R1

**Precondition:** `ContactoEntity`, `ContactoConfiguration`, and migration `20260701084227_AddContactoEntity` already exist from Story 2.5.

**Test Steps:**
1. After implementing `IContactoRepository`/EF repository and any new Commands/Queries, run `dotnet ef migrations list` (or equivalent check against `AppDbContextModelSnapshot.cs`).
2. Diff `ContactoConfiguration.cs` against its Story-2.5 committed version.

**Expected Result:**
- No new migration touching the `contactos` table is generated as part of Epic 3 work.
- `ContactoConfiguration.cs`'s FK definition (`fk_contactos_clientes`, `OnDelete(DeleteBehavior.SetNull)`) is byte-for-byte unchanged, or if changed, an explicit regression test (TC-E3-P0-02) still passes.

**Automation:** CI check / integration test asserting `AppDbContextModelSnapshot.cs` has no pending model changes for `contactos` (`dotnet ef migrations has-pending-model-changes` equivalent).

---

#### TC-E3-P0-02: Regression — Deleting a Client Still Orphans Contacts (Epic 2 R2 Contract Preserved)

**Level:** API Integration
**Story:** Cross-cutting (validates Epic 3 additions didn't regress Epic 2)
**Requirement:** Epic 2 Story 2.5 AC, `fk_contactos_clientes` `ON DELETE SET NULL`
**Risk covered:** R1

**Precondition:** Epic 3's `IContactoRepository`, endpoints, and commands are implemented.

**Test Steps:**
1. Create client C1 via `/api/v1/clientes`.
2. Create contacts K1, K2 via the **new** `/api/v1/contactos` POST endpoint with `clienteId = C1.id`.
3. DELETE `/api/v1/clientes/{C1.id}`.
4. GET `/api/v1/contactos/{K1.id}` and `/api/v1/contactos/{K2.id}` via the **new** GET-by-id endpoint.

**Expected Result:**
- K1 and K2 still exist (`200 OK`), `clienteId` is `null` on both.
- Confirms Epic 3's new repository/endpoint layer sits correctly on top of the unchanged FK behavior.

**Automation:** xUnit integration test against real/TestContainers Postgres (same rationale as TC-E2-P0-03 — FK behavior must not be trusted to EF InMemory).

---

#### TC-E3-P0-03: Backend Rejects Empty Required Fields Independent of Frontend Validation

**Level:** API Integration
**Story:** 3.3, 3.4
**Requirement:** AC-E3.4 (system prevents saving with empty required fields)
**Risk covered:** R2

**Test Steps:**
1. POST `/api/v1/contactos` with `nombre: ""`, omitting `cargo`, `telefono`, `email`.
2. POST `/api/v1/contactos` with all four fields as whitespace-only strings.

**Expected Result:**
- Both requests return `400 Bad Request` with FluentValidation field-level error details (`errors: { nombre: [...], cargo: [...], telefono: [...], email: [...] }`).
- No record is persisted (verify via subsequent GET list count unchanged).

**Automation:** xUnit integration test — bypasses UI entirely, mirrors TC-E2-P0-05.

---

#### TC-E3-P0-04: Create Contact Happy Path — End-to-End

**Level:** E2E (Playwright)
**Story:** 3.3
**Requirement:** AC-E3.1

**Test Steps:**
1. Navigate to `/contactos`.
2. Click "Nuevo contacto".
3. Fill Nombre, Cargo, Teléfono, Email with valid values.
4. Submit.

**Expected Result:**
- Contact appears in the list immediately (no manual refresh, no full page reload).
- Toast "Contacto creado correctamente" is shown.
- Newly created contact is selectable and its detail matches submitted values.

**Automation:** Playwright E2E.

---

#### TC-E3-P0-05: Frontend Displays Friendly Error on Backend Validation Failure

**Level:** Component (Vitest + RTL + MSW)
**Story:** 3.3
**Requirement:** Story 3.3 AC (backend validation error displayed clearly, NFR6)
**Risk covered:** R2

**Test Steps:**
1. Mock POST `/api/v1/contactos` to return `400` Problem Details via MSW.
2. Fill and submit `ContactoForm`.

**Expected Result:**
- Error message is displayed without exposing raw Problem Details JSON, stack traces, or technical details (NFR6).
- Form remains open with entered data intact (no data loss).

**Automation:** Vitest + RTL + MSW.

---

### P1 — Must Pass Before Story Is Closed as Done

#### TC-E3-P1-01: Real-Time Search Filters by Nombre and Email

**Level:** Component (Vitest + RTL)
**Story:** 3.1
**Requirement:** AC-E3.2
**Risk covered:** R6

**Test Steps:**
1. Render the contact list panel with a mocked list of 10 contacts (mixed names/emails).
2. Type a substring matching one contact's `nombre` into the search field.
3. Clear and type a substring unique to another contact's `email` (not a substring of any `nombre`).

**Expected Result:**
- Only matching contact(s) render after each keystroke sequence, for both Nombre and Email matches.
- Filtering happens without a new network request (client-side).

**Automation:** Vitest + RTL.

---

#### TC-E3-P1-02: Search Performance Under 1 Second with 1,000 Records

**Level:** E2E or Component (performance-focused)
**Story:** 3.1
**Requirement:** NFR1
**Risk covered:** R3

**Precondition:** Seed 1,000 contact records (via API or factory) — double Epic 2's benchmark size.

**Test Steps:**
1. Load `/contactos` with 1,000 records in cache.
2. Type a search query.
3. Measure time from keystroke to filtered DOM update.

**Expected Result:**
- Filtered results render in <1000ms end-to-end (NFR1), at the full NFR10 MVP scale ceiling for contacts.

**Automation:** Playwright E2E with performance timing assertions, or Vitest with `performance.now()` around the filter function with a 1,000-item fixture.

---

#### TC-E3-P1-03: EmptyState Displayed When No Contacts Exist

**Level:** Component (Vitest + RTL)
**Story:** 3.1
**Requirement:** Story 3.1 AC (EmptyState guidance)
**Risk covered:** R9

**Test Steps:**
1. Mock `GET /api/v1/contactos` to return `[]`.
2. Render `/contactos`.

**Expected Result:**
- `EmptyState` component renders with guidance to create the first contact.
- Distinct from the "no search results" state (TC-E3-P1-04).

**Automation:** Vitest + RTL + MSW.

---

#### TC-E3-P1-04: Zero Search Results Shows "No Results" State, Not EmptyState

**Level:** Component (Vitest + RTL)
**Story:** 3.1
**Risk covered:** R9

**Test Steps:**
1. Render list with 5 contacts loaded.
2. Type a search query matching none of them.

**Expected Result:**
- A "no results for this search" indicator is shown (not the zero-contacts `EmptyState`).
- Search input retains the typed value.

**Automation:** Vitest + RTL.

---

#### TC-E3-P1-05: ErrorPanel with Retry on Backend Failure

**Level:** Component (Vitest + RTL)
**Story:** 3.1
**Requirement:** Story 3.1 AC (ErrorPanel + Reintentar)

**Test Steps:**
1. Mock `GET /api/v1/contactos` to fail (500 or network error).
2. Render `/contactos`.
3. Click "Reintentar", now mocked to succeed.

**Expected Result:**
- `ErrorPanel` renders instead of the list on initial failure.
- Clicking "Reintentar" re-triggers the fetch; on success, the list renders.

**Automation:** Vitest + RTL + MSW (dynamic handler override).

---

#### TC-E3-P1-06: Contact Detail Deep Link Loads Correct Contact

**Level:** E2E (Playwright)
**Story:** 3.2
**Requirement:** FR30, Story 3.2 AC
**Risk covered:** R5

**Test Steps:**
1. Seed a contact, obtain its UUID.
2. Navigate directly to `/contactos/{uuid}` (no prior in-app navigation).

**Expected Result:**
- Correct contact details render (Nombre, Cargo, Teléfono, Email match seeded values).
- No redirect to `/contactos` root.

**Automation:** Playwright E2E.

---

#### TC-E3-P1-07: Non-Existent Contact ID Shows Graceful Not-Found

**Level:** E2E (Playwright)
**Story:** 3.2
**Risk covered:** R5

**Test Steps:**
1. Navigate to `/contactos/00000000-0000-0000-0000-000000000000`.

**Expected Result:**
- A graceful not-found message renders (not a blank page, not an unhandled JS error).
- No console errors logged.

**Automation:** Playwright E2E (assert `page.on('console')` has no error-level entries).

---

#### TC-E3-P1-08: Edit Form Pre-Fills with Current Values

**Level:** Component (Vitest + RTL)
**Story:** 3.4
**Requirement:** Story 3.4 AC (FR14)

**Test Steps:**
1. Render `ContactoForm` in edit mode with an existing contact object.

**Expected Result:**
- All four fields (Nombre, Cargo, Teléfono, Email) display the contact's current values on mount.

**Automation:** Vitest + RTL.

---

#### TC-E3-P1-09: Edit Saves Changes and Reflects Immediately in Detail + List

**Level:** E2E (Playwright)
**Story:** 3.4
**Requirement:** FR27
**Risk covered:** R4

**Test Steps:**
1. Open an existing contact's detail, click "Editar".
2. Change the `Cargo` field, submit.

**Expected Result:**
- Detail panel shows updated `Cargo` immediately.
- List item reflects update within 2s (NFR2), no manual refresh.
- Toast "Contacto actualizado correctamente" shown.

**Automation:** Playwright E2E.

---

#### TC-E3-P1-10: Edit Form Validation Blocks Empty Required Field

**Level:** Component (Vitest + RTL)
**Story:** 3.4
**Requirement:** Story 3.4 AC
**Risk covered:** R2

**Test Steps:**
1. Render `ContactoForm` in edit mode.
2. Clear the `Email` field, submit.

**Expected Result:**
- Inline error message appears on `Email`.
- `onSubmit`/API call is NOT invoked (assert mock not called).

**Automation:** Vitest + RTL.

---

#### TC-E3-P1-11: Update Preserves `Id` and `CreatedAt` Across Edit

**Level:** API Integration + Unit
**Story:** 3.4
**Risk covered:** R11

**Test Steps:**
1. Create a contact, record `Id` and `CreatedAt`.
2. PUT `/api/v1/contactos/{id}` with modified `Cargo`.
3. GET the contact.

**Expected Result:**
- `Id` and `CreatedAt` are unchanged.
- `UpdatedAt` is newer than the original `CreatedAt`/`UpdatedAt`.
- `Cargo` reflects the new value.

**Automation:** xUnit integration test; complemented by a domain-level xUnit unit test directly on `ContactoEntity`'s update method.

---

#### TC-E3-P1-12: Delete Confirmation Flow — Happy Path

**Level:** E2E (Playwright)
**Story:** 3.5
**Requirement:** Story 3.5 AC (toast "Contacto eliminado correctamente")

**Test Steps:**
1. Navigate to `/contactos/:contactoId` for a seeded contact.
2. Click "Eliminar".
3. Confirm dialog appears; click "Confirmar".

**Expected Result:**
- Contact removed from list immediately.
- View returns to the contact list.
- Toast reads exactly "Contacto eliminado correctamente".

**Automation:** Playwright E2E.

---

#### TC-E3-P1-13: Delete Confirmation Dialog — Cancel Preserves Contact

**Level:** Component (Vitest + RTL)
**Story:** 3.5
**Requirement:** Story 3.5 AC (Cancelar preserves record)

**Test Steps:**
1. Open delete confirmation dialog for a contact.
2. Click "Cancelar".

**Expected Result:**
- Dialog closes.
- No DELETE API call is made (assert mock/spy not called).
- Contact record remains in the system unchanged.

**Automation:** Vitest + RTL + MSW (assert no request recorded).

---

### P2 — Should Pass Before Epic Is Marked Complete

#### TC-E3-P2-01: Zod Schema Rejects Empty/Invalid Fields at Unit Level

**Level:** Unit (Vitest)
**Story:** 3.3, 3.4

**Test Steps:**
1. Call `contactoSchema.safeParse()` with empty `nombre`, `cargo`, `telefono`, `email` (individually and combined).

**Expected Result:**
- `safeParse` returns `success: false` with an issue for each empty required field.
- Valid payload returns `success: true`.

**Automation:** Vitest unit test directly against `contactoSchema.ts`.

---

#### TC-E3-P2-02: FluentValidation Validator Unit Tests

**Level:** Unit (xUnit)
**Story:** 3.3, 3.4

**Test Steps:**
1. Instantiate `CreateContactoRequestValidator` / `UpdateContactoRequestValidator` directly (no HTTP).
2. Validate payloads with missing/empty Nombre, Cargo, Telefono, Email.

**Expected Result:**
- `ValidationResult.IsValid == false` with expected error codes/messages per field.
- Valid payload passes.

**Automation:** xUnit unit test (no `WebApplicationFactory` needed).

---

#### TC-E3-P2-03: Delete Dialog Dismissal via Esc/Backdrop Does Not Delete

**Level:** Component (Vitest + RTL)
**Story:** 3.5
**Risk covered:** R8

**Test Steps:**
1. Open delete confirmation dialog.
2. Press `Escape` key (and separately, backdrop click if supported).

**Expected Result:**
- Dialog closes without triggering delete.
- No DELETE API call made.

**Automation:** Vitest + RTL.

---

#### TC-E3-P2-04: Edit Cancel Preserves Original Contact Data

**Level:** Component (Vitest + RTL)
**Story:** 3.4
**Risk covered:** R7

**Test Steps:**
1. Edit one or more fields in `ContactoForm` (edit mode).
2. Click "Cancelar".

**Expected Result:**
- Original contact values are displayed (form closes/reverts).
- Zero API calls made.

**Automation:** Vitest + RTL + MSW (assert no request recorded). Note: Epic 2 flagged an equivalent gap (TC-E2-P1-15) — this epic bakes the test in from the start rather than deferring it.

---

#### TC-E3-P2-05: List Item Shows Nombre, Cargo, and Email Per Row

**Level:** Component (Vitest + RTL)
**Story:** 3.1
**Requirement:** Story 3.1 AC

**Test Steps:**
1. Render list with sample contacts.

**Expected Result:**
- Each row displays `nombre`, `cargo`, and `email` visible without further interaction.

**Automation:** Vitest + RTL.

---

#### TC-E3-P2-06: Create/Edit/Delete Toast Exact Copy Verification

**Level:** Component (Vitest + RTL)
**Story:** 3.3, 3.4, 3.5
**Risk covered:** R10

**Test Steps:**
1. Successfully submit create form (mocked `201`).
2. Successfully submit edit form (mocked `200`).
3. Successfully confirm delete (mocked `204`).

**Expected Result:**
- Toast texts are exactly: "Contacto creado correctamente", "Contacto actualizado correctamente", "Contacto eliminado correctamente" (no variation, no orphaning-style variant needed — Contacto delete has no cascading side effect within this epic).

**Automation:** Vitest + RTL (3 assertions, can be grouped in one spec file).

---

#### TC-E3-P2-07: GET /api/v1/contactos Search Query Param Works Independent of Frontend Filter

**Level:** API Integration
**Story:** 3.1

**Test Steps:**
1. Seed contacts with distinct names/emails.
2. GET `/api/v1/contactos?q=<partial-name-or-email>`.

**Expected Result:**
- Backend search endpoint (fallback path per architecture) returns correctly filtered results by both Nombre and Email, independent of the primary client-side filtering strategy.

**Automation:** xUnit integration test.

---

### P3 — Nice to Have / Future Sprint

#### TC-E3-P3-01: Email Format Edge Cases (No Strict Format Enforced)

**Level:** Unit (Vitest + xUnit)
**Story:** 3.3

**Test Steps:**
1. Submit Email values with unusual-but-plausible formats (subdomains, `+` aliases, uppercase) and clearly invalid ones (no `@`, empty local part).

**Expected Result:**
- Document actual accept/reject behavior — no explicit AC mandates email format validation beyond "required"; this is exploratory to catch future regressions or to surface a gap for a follow-up story/ADR if the team decides format validation is needed.

**Automation:** Vitest/xUnit parametrized tests.

---

#### TC-E3-P3-02: Large Contact List Scroll Performance (Sanity Check)

**Level:** E2E (Playwright)
**Story:** 3.1

**Test Steps:**
1. Seed 1,000 contacts, scroll the list panel.

**Expected Result:**
- No visible jank or dropped frames (informal check — no strict SLA beyond NFR1 search timing).

**Automation:** Playwright manual scroll + visual check; not gating.

---

## 5. Acceptance Criteria Coverage Matrix

| Epic AC | Stories | Test Cases | Status |
|---------|---------|------------|--------|
| AC-E3.1: Register new contact, appears immediately | 3.3 | TC-E3-P0-04 | Covered |
| AC-E3.2: Search by name/email under 1s | 3.1 | TC-E3-P1-01, TC-E3-P1-02, TC-E3-P2-07 | Covered |
| AC-E3.3: View detail, edit any field, save | 3.2, 3.4 | TC-E3-P1-06, TC-E3-P1-08, TC-E3-P1-09 | Covered |
| AC-E3.4: Prevent save with empty required fields, clear errors | 3.3, 3.4 | TC-E3-P0-03, TC-E3-P1-10, TC-E3-P2-01, TC-E3-P2-02 | Covered |
| AC-E3.5: Delete contact, removed from list | 3.5 | TC-E3-P1-12 | Covered |
| Story 3.1 — EmptyState / ErrorPanel | 3.1 | TC-E3-P1-03, TC-E3-P1-04, TC-E3-P1-05, TC-E3-P2-05 | Covered |
| Story 3.2 — Not-found on invalid contactoId | 3.2 | TC-E3-P1-07 | Covered |
| Story 3.3 — Backend validation error displayed clearly (NFR6) | 3.3 | TC-E3-P0-05 | Covered |
| Story 3.4 — Cancel preserves data | 3.4 | TC-E3-P2-04 | Covered |
| Story 3.4 — Update preserves Id/CreatedAt | 3.4 | TC-E3-P1-11 | Covered |
| Story 3.5 — Confirmation dialog cancel | 3.5 | TC-E3-P1-13, TC-E3-P2-03 | Covered |
| Epic constraint — reuse existing entity/schema, no regression to Epic 2 FK behavior | Cross-cutting | TC-E3-P0-01, TC-E3-P0-02 | Covered |
| Toast copy exactness (all mutations) | 3.3, 3.4, 3.5 | TC-E3-P2-06 | Covered |

---

## 6. NFR Coverage

| NFR | Requirement | Covered By | Level |
|-----|-------------|------------|-------|
| NFR1 | Search <1s with up to 1,000 records | TC-E3-P1-02 | E2E/Performance |
| NFR2 | CRUD reflects in UI <2s | TC-E3-P0-04, TC-E3-P1-09, TC-E3-P1-12 | E2E |
| NFR3 | Responsive with 10 concurrent users | Deferred to `*nfr` workflow (load testing) — not covered by functional test design | N/A (see testarch-nfr) |
| NFR5 | Input validation/sanitization | TC-E3-P0-03, TC-E3-P2-01, TC-E3-P2-02 | API Integration + Unit |
| NFR6 | No stack traces/internal errors exposed | TC-E3-P0-05 | Component |
| NFR7 | No training required (consistent UX copy) | TC-E3-P2-06 | Component |
| NFR8 | ≤2 clicks from client to associated contact | Out of scope — Epic 4 (association UI) | N/A (Epic 4) |
| NFR9 | Contact detail shows associated client without extra navigation | Out of scope — Epic 4 (association UI); Epic 3's `ContactoDetail` has no client-linkage field yet | N/A (Epic 4) |
| NFR10 | Scoped for 1,000 contacts max | TC-E3-P1-02, TC-E3-P3-02 | Performance/Exploratory |
| NFR11 | Data model supports future expansion (no hardcoded limits) | Already satisfied by existing `ContactoEntity`/migration (Story 2.5) — verify no `LIMIT` constants hardcoded in new query layer during code review | N/A (code review) |

---

## 7. Test Execution Order

```
Phase 0 — Schema-Reuse Safety Gate (P0, unique to this epic)
  1. TC-E3-P0-01  No new migration generated for contactos
  2. TC-E3-P0-02  Regression: client delete still orphans contacts (Epic 2 FK contract)

Phase 1 — Backend Data Integrity Gate (P0, DB required)
  3. TC-E3-P0-03  Backend rejects empty required fields independent of frontend

Phase 2 — Core User Journeys (P0, E2E)
  4. TC-E3-P0-04  Create contact happy path
  5. TC-E3-P0-05  Friendly error on backend validation failure

Phase 3 — List/Search Component Suite (P1)
  6. TC-E3-P1-01  Real-time search filter (Nombre + Email)
  7. TC-E3-P1-02  Search performance @ 1,000 records
  8. TC-E3-P1-03  EmptyState (zero contacts)
  9. TC-E3-P1-04  Zero search results state
 10. TC-E3-P1-05  ErrorPanel + retry

Phase 4 — Detail & Deep Linking (P1)
 11. TC-E3-P1-06  Deep link to existing contact
 12. TC-E3-P1-07  Deep link to non-existent contact

Phase 5 — Form & Mutation Behavior (P1)
 13. TC-E3-P1-08  Edit form pre-fill
 14. TC-E3-P1-09  Edit reflects immediately
 15. TC-E3-P1-10  Edit validation blocks empty field
 16. TC-E3-P1-11  Update preserves Id/CreatedAt
 17. TC-E3-P1-12  Delete confirmation happy path
 18. TC-E3-P1-13  Delete cancel preserves contact

Phase 6 — Polish & Regression (P2)
 19. TC-E3-P2-01  Zod schema unit tests
 20. TC-E3-P2-02  FluentValidation unit tests
 21. TC-E3-P2-03  Esc/backdrop dismiss doesn't delete
 22. TC-E3-P2-04  Edit cancel preserves data
 23. TC-E3-P2-05  List item shows Nombre/Cargo/Email
 24. TC-E3-P2-06  Toast exact copy (create/edit/delete)
 25. TC-E3-P2-07  Backend search query param

Phase 7 — Exploratory / Future (P3)
 26. TC-E3-P3-01  Email format edge cases
 27. TC-E3-P3-02  Large list scroll sanity
```

---

## 8. Test Tooling & Environment Requirements

| Tool | Purpose | Project |
|------|---------|---------|
| Vitest 2+ | Unit + Component tests | Frontend |
| @testing-library/react | Component rendering | Frontend |
| MSW | API mocking (400, empty list, error, success) | Frontend |
| Playwright | E2E (create/edit/delete journeys, deep linking) | Frontend/E2E |
| xUnit | Unit + Integration tests | Backend |
| WebApplicationFactory\<Program\> | In-process API testing | Backend |
| TestContainers (Postgres) | Real FK constraint regression check (TC-E3-P0-02) — mandatory, cannot use in-memory provider | Backend |

### Environment Prerequisites

```
- All Epic 1/2 prerequisites (Node 20+/pnpm, .NET 10 SDK, PostgreSQL 18+)
- contactos table already migrated (Story 2.5 migration 20260701084227_AddContactoEntity) — do NOT re-migrate
- clientes table available for the delete-orphaning regression test (TC-E3-P0-02)
- Seed/factory helpers for contactos (faker-based, auto-cleanup) — new for this epic, mirrors clienteFactory
- MSW handlers for /api/v1/contactos endpoints (list, create, update, delete, 400, 500)
```

---

## 8b. Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|--------------|-------|
| P0 | 5 | 2.0 | 10.0 | Schema-reuse safety checks + backend validation + core E2E |
| P1 | 13 | 1.0 | 13.0 | Standard component/E2E coverage — search, detail, form, delete |
| P2 | 7 | 0.5 | 3.5 | Unit validators, toast copy, dialog dismissal, cancel-preserve |
| P3 | 2 | 0.25 | 0.5 | Exploratory / format edge cases |
| **Total** | **27** | — | **27.0 hours** | **~3.4 days** |

### Prerequisites

**Test Data:**
- `contactoFactory` (faker-based: nombre, cargo, telefono, email, optional `clienteId` override, auto-cleanup) — mirrors `clienteFactory`, may already partially exist from Story 2.5's FK test
- 1,000-record seed script for NFR1 performance testing (double Epic 2's 500-record script)

**Tooling:**
- MSW handlers for all `/api/v1/contactos` CRUD paths + error variants (400, 500, network failure)
- TestContainers Postgres — required for TC-E3-P0-02 (FK regression check, same rationale as Epic 2's TC-E2-P0-03)
- Playwright fixtures for authenticated-free navigation (no auth in MVP) — reuse Epic 2's fixtures

**Environment:**
- PostgreSQL 18+ with real FK constraints enabled (not InMemory) for integration suite
- Frontend dev server + backend API running concurrently for E2E suite

---

## 8c. Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions — all 5 P0 tests must pass, especially TC-E3-P0-01/02 schema-reuse gate)
- **P1 pass rate**: ≥95% (waivers require documented justification)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations** (R1): 100% verified before Epic 3 closure

### Coverage Targets

- **Critical paths** (create, edit, delete): 100%
- **Schema-reuse integrity** (no re-migration, FK contract preserved): 100%
- **Search correctness (Nombre + Email)**: 100%
- **Validation (frontend + backend, independently)**: 100%

### Non-Negotiable Requirements

- [ ] All P0 tests pass (TC-E3-P0-01 through TC-E3-P0-05)
- [ ] TC-E3-P0-02 specifically verified against a real Postgres instance (not EF InMemory) — proves Epic 3 did not regress Epic 2's FK data-loss guardrail
- [ ] No new migration is generated for the `contactos` table during Epic 3 implementation
- [ ] Backend validation (FluentValidation) independently verified — not solely reliant on frontend Zod (R2)
- [ ] Search covers both Nombre and Email fields (R6)

---

## 9. Definition of Done for Epic 3

The epic is considered test-complete when:

- [ ] All P0 test cases pass (TC-E3-P0-01 through TC-E3-P0-05)
- [ ] All P1 test cases pass (TC-E3-P1-01 through TC-E3-P1-13)
- [ ] P2 test cases pass or are formally deferred with justification
- [ ] The schema-reuse safety gate (TC-E3-P0-01, TC-E3-P0-02) confirms no regression to Epic 2's FK `ON DELETE SET NULL` behavior
- [ ] No P0/P1 test case is skipped without a documented reason
- [ ] `dotnet test` and `pnpm vitest run` pass with zero failures

---

## 10. Notes for Story Implementation Agents

The following constraints must be enforced during implementation for tests to pass:

1. **Do not re-create or re-migrate the `contactos` table.** `ContactoEntity`, `ContactoConfiguration`, and the migration `20260701084227_AddContactoEntity` already exist (Story 2.5). Build `IContactoRepository`, Commands/Queries, and endpoints on top of them without generating a new EF Core migration for this table.
2. `ContactoEntity` currently only exposes a `Create` factory and private setters — implementing Edit (Story 3.4) requires adding an explicit update method to the entity (mirroring whatever pattern `ClienteEntity` uses for its `Update`) that preserves `Id`/`CreatedAt` and bumps `UpdatedAt`. Do not bypass this via reflection or by reconstructing the entity through `Create`.
3. Do **not** modify `ContactoConfiguration.cs`'s FK definition (`fk_contactos_clientes`, `OnDelete(DeleteBehavior.SetNull)`) while adding repository/query logic — this is Epic 2's R2 guardrail and must remain intact; TC-E3-P0-02 is a regression gate for this specifically.
4. Backend FluentValidation validators for `CreateContactoRequest`/`UpdateContactoRequest` must be tested independently of the frontend — do not assume Zod is the only gate (mirrors Epic 2 R3/lesson).
5. The `contactos` GET endpoint's search must filter on **both** `Nombre` and `Email` (AC-E3.2) — a single-field `Contains` check on `Nombre` alone silently fails this AC.
6. Toast copy must match exactly: "Contacto creado correctamente", "Contacto actualizado correctamente", "Contacto eliminado correctamente" — no orphaning-style variant is needed here (unlike Epic 2's client-delete toast) since Epic 3's contact delete has no cascading side effect within this epic's scope.
7. TanStack Query cache key for contacts (e.g., `['contactos']`) must be used consistently across list/detail/create/update/delete hooks so `invalidateQueries` reliably refreshes the UI (mirrors Epic 2 lesson, R4).
8. Frontend module structure should mirror `frontend/src/modules/crm/clientes/` (domain/application/infrastructure/presentation layers) under `frontend/src/modules/crm/contactos/`, replacing the current placeholder `ContactosView` stub in `frontend/src/routes/_app/contactos.tsx`.
9. No email-format regex validation is implied by any AC — only "required, non-empty" is testable today (TC-E3-P3-01 documents this as an assumption/gap, not a bug, unless product direction changes).

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
