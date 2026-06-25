# Test Design: Epic 3 - Contact Management

**Date:** 2026-06-25
**Author:** SiesaTeam
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic Source:** `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md`

---

## Executive Summary

**Scope:** Full test design for Epic 3 — Contact Management (Gestión de Contactos)

This epic delivers complete CRUD operations for the contacts catalog independent of any client relationship: list & real-time search (Story 3.1), contact detail view with deep linking (Story 3.2), create (Story 3.3), edit (Story 3.4), and delete with confirmation dialog (Story 3.5). All changes must reflect immediately in the UI (FR27 / TanStack Query `invalidateQueries`). Client-side filtering handles search by name and email (NFR1: <1s with up to 1,000 records). Backend validation uses FluentValidation; frontend uses Zod + React Hook Form. Error handling follows Problem Details RFC 7807 (NFR6). No authentication in MVP. Tech stack: React 18 + TanStack Router/Query + Zustand 5 (frontend), .NET 10 Minimal API + EF Core 10 + PostgreSQL (backend).

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (score >= 6): 3
- Critical categories: PERF, SEC, DATA

**Coverage Summary:**

- P0 scenarios: 8 (16 hours)
- P1 scenarios: 13 (13 hours)
- P2/P3 scenarios: 12 (5 hours)
- **Total effort:** 34 hours (~4.5 days)

---

## Risk Assessment

### High-Priority Risks (Score >= 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | PERF | Client-side search over 1,000 contacts (NFR1: <1s) exceeds the threshold when filtering by both name and email simultaneously; dataset is 2x larger than the client catalog (500 records), increasing risk of visible lag | 2 | 3 | 6 | Performance test seeds 1,000 contacts and measures debounced filter render time; assert results appear in <1s; debounce delay (150ms) verified at component level; if client-side filter is too slow, flag for server-side search endpoint | DEV/QA | Story 3.1 |
| R-002 | SEC | Backend accepts a contact record with empty or whitespace-only required fields (Nombre, Cargo, Teléfono, Email) due to missing FluentValidation rules, violating NFR5 and AC-E3.4 | 2 | 3 | 6 | API test sends POST/PUT with each required field individually empty or whitespace-only; assert HTTP 400 + Problem Details body; Zod front-end schema tested at component level with each field blank | DEV | Stories 3.3, 3.4 |
| R-003 | SEC | Backend does not validate email format on input — malformed email addresses are persisted, allowing injection-style or corrupt data (NFR5, FR9) | 2 | 3 | 6 | API test sends contacts with invalid email formats (no @, SQL injection string, empty domain); assert HTTP 400 + field-level error; Zod `.email()` rule tested in component test | DEV | Stories 3.3, 3.4 |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-004 | DATA | TanStack Query cache not invalidated after create/edit/delete — contact list shows stale data after a mutation, violating FR27 (immediate reflection) | 2 | 2 | 4 | Unit/integration test verifies `invalidateQueries(['contacts'])` called after each mutation hook; E2E asserts new/updated/deleted contact reflected in list immediately without page reload | DEV |
| R-005 | BUS | Deep-link to `/contactos/:contactoId` for a non-existent UUID renders a blank or error screen instead of a graceful not-found message (AC — Story 3.2) | 2 | 2 | 4 | E2E navigates directly to `/contactos/00000000-0000-0000-0000-000000000000`; assert not-found message is displayed; no unhandled exception or blank screen | QA |
| R-006 | DATA | Cancelling an edit does not reset form internal state — re-opening the edit form shows dirty values instead of server data (AC — Story 3.4) | 2 | 2 | 4 | Component test: open edit, mutate fields, click "Cancelar", re-open edit form; assert all fields match original server values | DEV |
| R-007 | BUS | Confirmation dialog for delete can be dismissed accidentally (e.g., backdrop click, ESC key) causing unintended data loss if the system treats dismissal as confirmation (AC — Story 3.5) | 2 | 2 | 4 | E2E tests: (a) click "Cancelar" — contact remains; (b) press ESC — contact remains; (c) click backdrop — contact remains; (d) confirm — contact deleted | QA |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-008 | OPS | Backend 5xx error during contact list load is silently swallowed — no ErrorPanel shown to user (AC — Story 3.1) | 1 | 2 | 2 | E2E intercepts GET /api/v1/contacts with forced 500; assert ErrorPanel + "Reintentar" button visible; retry triggers re-fetch | QA |
| R-009 | BUS | Empty state component not shown when contact list is genuinely empty (zero records); user sees blank space with no guidance (AC — Story 3.1) | 1 | 1 | 1 | Component test renders ContactList with empty array; assert EmptyState rendered with "Nuevo contacto" CTA | DEV |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure, input validation)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria:** Blocks core journey + High/critical risk + No acceptable workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| AC-E3.1: Create contact with all required fields — contact appears in list (FR9, FR27) | E2E | R-002 | 1 | QA | Happy path: fill Nombre, Cargo, Teléfono, Email; submit; assert in list + success toast |
| AC-E3.4: Backend rejects empty/whitespace required fields (POST + PUT) | API | R-002 | 4 | DEV | One API test per field (Nombre, Cargo, Teléfono, Email); assert HTTP 400 + Problem Details |
| AC-E3.4: Backend rejects invalid email format (POST + PUT) | API | R-003 | 2 | DEV | Two invalid email formats; assert HTTP 400 + field-level error |
| AC-E3.2: Search by name and email returns results in <1s (NFR1 with 1,000 records) | Component/E2E | R-001 | 1 | QA | Seed 1,000 contacts; type query; measure render time < 1,000ms |

**Total P0:** 8 tests, 16 hours

### P1 (High) - Run on PR to main

**Criteria:** Important user features + Medium risk (3–4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | -----  |
| AC-E3.5: Delete contact — removed from list + success toast (FR15, FR27) | E2E | R-007 | 1 | QA | Confirm dialog → confirm → contact gone; toast validated |
| AC-E3.5: Cancel delete — contact remains in list | E2E | R-007 | 1 | QA | Confirm dialog → "Cancelar" → contact still visible |
| AC-E3.3: Edit contact — pre-filled form, save → reflected in detail and list (FR14, FR27) | E2E | R-004 | 1 | QA | Open edit, change one field, save; assert updated value in detail + list |
| AC-E3.3: Cancel edit — original data unchanged | Component | R-006 | 1 | DEV | Open edit, dirty fields, cancel; assert original values restored |
| FR27 / TanStack Query cache invalidation after create, edit, delete | Unit | R-004 | 3 | DEV | One unit test per mutation hook: create, update, delete; assert `invalidateQueries(['contacts'])` |
| AC — Story 3.2: Deep-link `/contactos/:contactoId` renders correct contact details | E2E | R-005 | 1 | QA | Direct URL navigation; assert all four fields displayed |
| AC — Story 3.2: Non-existent contactoId renders not-found message | E2E | R-005 | 1 | QA | Direct URL with random UUID; assert graceful not-found |
| AC-E3.1: Form-level Zod validation blocks submission with empty required fields (frontend) | Component | R-002 | 4 | DEV | One component test per required field left blank; assert inline error + no API call |

**Total P1:** 13 tests, 13 hours

### P2 (Medium) - Run nightly/weekly

**Criteria:** Secondary features + Low risk + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| AC — Story 3.1: Empty state shown when no contacts exist | Component | R-009 | 1 | DEV | Render with empty array; assert EmptyState + CTA present |
| AC — Story 3.1: ErrorPanel + Reintentar when backend is unavailable | E2E | R-008 | 1 | QA | Intercept GET contacts → 500; assert ErrorPanel; click retry → re-fetch fires |
| AC-E3.2: Search filters real-time by name (partial match) | Component | — | 1 | DEV | Type partial name; assert filtered results |
| AC-E3.2: Search filters real-time by email (partial match) | Component | — | 1 | DEV | Type partial email; assert filtered results |
| AC-E3.4: Backend error surfaced without stack trace (NFR6) | E2E | — | 1 | QA | Trigger backend validation error; assert user-friendly message, no stack trace |
| Story 3.2: URL updates to `/contactos/:contactoId` on item click (FR30) | E2E | — | 1 | QA | Click contact in list; assert URL pattern and detail fields |
| Story 3.3: Success toast "Contacto creado correctamente" appears after create | E2E | — | 1 | QA | Complete create flow; assert toast text |
| Story 3.4: Success toast "Contacto actualizado correctamente" appears after edit | E2E | — | 1 | QA | Complete edit flow; assert toast text |
| Story 3.5: Success toast "Contacto eliminado correctamente" after delete | E2E | — | 1 | QA | Complete delete flow; assert toast text |
| Zod email validation on frontend rejects malformed email | Component | R-003 | 1 | DEV | Enter invalid email in form; assert inline error message |

**Total P2:** 10 tests, 5 hours

### P3 (Low) - Run on-demand

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
| ----------- | ---------- | ---------- | ----- | ----- |
| ESC key dismisses confirmation dialog without deleting contact | E2E | 1 | QA | Press ESC on confirm dialog; assert contact still in list |
| Backdrop click dismisses confirmation dialog without deleting contact | E2E | 1 | QA | Click dialog backdrop; assert contact still in list |

**Total P3:** 2 tests, 0.5 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose:** Fast feedback — catch build-breaking regressions on contacts feature

- [ ] Contact list loads at `/contactos` with at least one record (30s)
- [ ] Create contact with all required fields — success (1min)
- [ ] Search filters contact list by name (30s)

**Total:** 3 scenarios

### P0 Tests (<10 min)

**Purpose:** Critical path validation — block merge if any fail

- [ ] Create contact: all required fields → contact in list + toast (E2E)
- [ ] POST /api/v1/contacts with empty Nombre → HTTP 400 Problem Details (API)
- [ ] POST /api/v1/contacts with empty Cargo → HTTP 400 Problem Details (API)
- [ ] POST /api/v1/contacts with empty Teléfono → HTTP 400 Problem Details (API)
- [ ] POST /api/v1/contacts with empty Email → HTTP 400 Problem Details (API)
- [ ] POST /api/v1/contacts with invalid email → HTTP 400 Problem Details (API)
- [ ] PUT /api/v1/contacts/:id with invalid email → HTTP 400 Problem Details (API)
- [ ] Search 1,000-record dataset → results in <1s (Component/E2E)

**Total:** 8 scenarios

### P1 Tests (<30 min)

**Purpose:** Important feature coverage — run on every PR to main

- [ ] Delete contact with confirmation → removed from list + toast (E2E)
- [ ] Cancel delete → contact remains (E2E)
- [ ] Edit contact → pre-filled, save, reflected in list (E2E)
- [ ] Cancel edit → original data restored in form (Component)
- [ ] invalidateQueries after create mutation (Unit)
- [ ] invalidateQueries after update mutation (Unit)
- [ ] invalidateQueries after delete mutation (Unit)
- [ ] Deep-link `/contactos/:contactoId` → correct contact displayed (E2E)
- [ ] Deep-link `/contactos/non-existent-uuid` → not-found message (E2E)
- [ ] Zod blocks submit with empty Nombre (Component)
- [ ] Zod blocks submit with empty Cargo (Component)
- [ ] Zod blocks submit with empty Teléfono (Component)
- [ ] Zod blocks submit with empty Email (Component)

**Total:** 13 scenarios

### P2/P3 Tests (<60 min)

**Purpose:** Full regression — run nightly

- [ ] EmptyState when no contacts (Component)
- [ ] ErrorPanel + retry when GET fails with 500 (E2E)
- [ ] Real-time filter by name partial match (Component)
- [ ] Real-time filter by email partial match (Component)
- [ ] Backend error displayed without stack trace (E2E)
- [ ] URL updates to `/contactos/:contactoId` on item click (E2E)
- [ ] Toast "Contacto creado correctamente" after create (E2E)
- [ ] Toast "Contacto actualizado correctamente" after edit (E2E)
- [ ] Toast "Contacto eliminado correctamente" after delete (E2E)
- [ ] Zod rejects malformed email in form (Component)
- [ ] ESC dismisses confirm dialog — contact untouched (E2E)
- [ ] Backdrop click dismisses confirm dialog — contact untouched (E2E)

**Total:** 12 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count | Hours/Test | Total Hours | Notes |
| --------- | ----- | ---------- | ----------- | ----- |
| P0        | 8     | 2.0        | 16          | API contract tests + performance seed setup |
| P1        | 13    | 1.0        | 13          | E2E CRUD + TanStack Query unit tests |
| P2        | 10    | 0.5        | 5           | Edge cases, toast assertions, URL checks |
| P3        | 2     | 0.25       | 0.5         | Dismiss-dialog edge cases |
| **Total** | **33** | **-**     | **34.5**    | **~4.5 days** |

### Prerequisites

**Test Data:**

- `ContactFactory` (faker-based): generates Nombre, Cargo, Teléfono, Email; supports bulk seed (1,000 records for NFR1 test)
- `contactFixture` (Playwright fixture): auto-creates and auto-cleans a single contact per test requiring isolation
- `emptyContactsFixture`: ensures zero contacts before EmptyState test

**Tooling:**

- Playwright (E2E + API tests) — existing project setup in `/e2e/`
- Vitest + React Testing Library (Component + Unit tests) — existing setup in `/frontend/`
- MSW or Playwright `route.fulfill()` for network interception (ErrorPanel test, backend-error-without-stack-trace test)
- `performance.now()` or Playwright `page.evaluate()` for NFR1 timing assertion

**Environment:**

- PostgreSQL test database with clean state per test suite run
- Backend running at `http://localhost:5000` (or Playwright `baseURL`) for E2E
- HTTPS enforcement tested in staging/pre-prod only (NFR4 — out of scope for local tests)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions; block merge if any P0 fails)
- **P1 pass rate:** >= 95% (explicit waiver required for any failure)
- **P2/P3 pass rate:** >= 90% (informational; tracked in dashboard)
- **High-risk mitigations (R-001, R-002, R-003):** 100% — all three must have passing tests before Epic 3 ships

### Coverage Targets

- **Critical paths (create/edit/delete contacts):** >= 80%
- **Security scenarios (empty/invalid input, email format):** 100%
- **Business logic (filter, deep link, optimistic update, toast):** >= 70%
- **Edge cases (cancel, dismiss dialog, empty state, error state):** >= 50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (score >= 6) items unmitigated (R-001 PERF, R-002 SEC, R-003 SEC)
- [ ] Email format validation tests (R-003) pass 100% at both API and component level
- [ ] NFR1 search performance confirmed in <1s with 1,000 records

---

## Mitigation Plans

### R-001: Client-side search performance with 1,000 contacts (Score: 6)

**Mitigation Strategy:** Implement debounced (150ms) client-side filter using `useMemo` over the TanStack Query cached list. If performance test shows >= 1s with 1,000 records in browser, escalate to a server-side search endpoint (`GET /api/v1/contacts?search=`) before release. Run performance assertion in a dedicated test that seeds 1,000 contacts via API before measuring.
**Owner:** DEV (implementation), QA (performance test authoring)
**Timeline:** Story 3.1 implementation
**Status:** Planned
**Verification:** Performance test passes with seed of 1,000 contacts and asserts filter render time < 1,000ms using `performance.now()`.

### R-002: Missing required-field validation in backend (Score: 6)

**Mitigation Strategy:** FluentValidation rules enforce `NotEmpty()` on Nombre, Cargo, Teléfono, Email for both `CreateContactCommand` and `UpdateContactCommand`. Each field tested individually in isolation via direct API calls. Zod schema on frontend mirrors backend rules. Both test suites must pass before merging Stories 3.3 and 3.4.
**Owner:** DEV
**Timeline:** Stories 3.3 and 3.4 implementation
**Status:** Planned
**Verification:** 4 API tests (one per field, POST) + 4 API tests (one per field, PUT) return HTTP 400 with Problem Details body.

### R-003: Email format not validated on input (Score: 6)

**Mitigation Strategy:** FluentValidation adds `.EmailAddress()` rule on the Email field in backend commands. Zod schema adds `.email()` validation on frontend. Test boundary cases: no `@`, invalid TLD, SQL injection string, empty string after trim.
**Owner:** DEV
**Timeline:** Stories 3.3 and 3.4 implementation
**Status:** Planned
**Verification:** API tests with at least 2 invalid email formats return HTTP 400; Component test with invalid email shows inline Zod error and no API call is made.

---

## Assumptions and Dependencies

### Assumptions

1. The contacts REST API follows the same pattern as clients: `GET /api/v1/contacts`, `GET /api/v1/contacts/:id`, `POST /api/v1/contacts`, `PUT /api/v1/contacts/:id`, `DELETE /api/v1/contacts/:id`.
2. E2E test infrastructure (Playwright, fixtures pattern) is established in `/e2e/` following the pattern of existing Epic 1 and Epic 2 tests.
3. A `ContactFactory` (similar to an existing `ClientFactory`) will be created for seeding; if not existing, it must be added in Story 3.1 or earlier.
4. The `contacto_id` field uses UUID (NFR11 / architecture decision), so non-existent ID deep-link tests use a valid UUID format.
5. No authentication is required — all endpoints are publicly accessible in MVP (no auth headers in tests).

### Dependencies

1. Epic 1 foundation (project initialization, navigation shell) — must be complete before E2E tests can run against `/contactos` routes.
2. `ContactFactory` seeding utility — required by Story 3.1 performance test; must exist before test authoring begins.
3. Backend `SiesaAgents.Application` FluentValidation rules for Contact — required by R-002 and R-003 mitigations.

### Risks to Plan

- **Risk:** ContactFactory does not exist at Epic 3 start.
  - **Impact:** NFR1 performance test (R-001) and isolation fixtures cannot be written.
  - **Contingency:** Create `ContactFactory` as part of Story 3.1 tech tasks; block performance test until factory is available.

- **Risk:** Client-side search over 1,000 contacts exceeds 1s on low-end hardware.
  - **Impact:** NFR1 violated; R-001 becomes a blocker.
  - **Contingency:** Flag as PERF risk immediately; implement server-side search endpoint as fast-follow within Epic 3 if performance test fails.

---

## Story-Level Test Mapping

| Story | Key AC | Covered Tests | Priority |
| ----- | ------- | ------------- | -------- |
| 3.1 List & Search | Contact list displayed, real-time search <1s, EmptyState, ErrorPanel | P0 (search perf), P1 (cache), P2 (empty, error) | P0/P1/P2 |
| 3.2 Detail View | Detail shows all fields, URL updates, deep-link, not-found | P1 (deep-link, not-found), P2 (URL, fields) | P1/P2 |
| 3.3 Create Contact | Create happy path, frontend validation, backend validation, backend error message | P0 (backend validation), P1 (Zod), E2E P0 create | P0/P1 |
| 3.4 Edit Contact | Pre-filled form, save reflected, frontend validation, cancel resets | P0 (backend PUT validation), P1 (edit E2E, cancel, Zod) | P0/P1 |
| 3.5 Delete Contact | Confirm dialog, confirmed delete, cancel delete, toasts | P1 (delete E2E, cancel), P2 (toast), P3 (ESC, backdrop) | P1/P2/P3 |

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before implementation of each story (TDD red phase).
- Run `*automate` for broader coverage once Stories 3.1–3.5 are implemented.
- Run `*nfr` to validate NFR1 (search performance) and NFR6 (no stack traces) after Epic 3 is complete.
- Run `*trace` to generate the requirements-to-tests traceability matrix and issue quality gate decision.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _________________ Date: _________
- [ ] Tech Lead: ________________________ Date: _________
- [ ] QA Lead: __________________________ Date: _________

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework (6 categories)
- `probability-impact.md` - Probability × impact scoring methodology
- `test-levels-framework.md` - E2E vs API vs Component vs Unit decision matrix
- `test-priorities-matrix.md` - P0–P3 automated priority calculation

### Related Documents

- PRD Feature: `_bmad-output/planning-artifacts/prd/feature-gestion-de-contactos.md`
- Epic Source: `_bmad-output/planning-artifacts/epics/epic-03-gestion-de-contactos.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- NFRs: `_bmad-output/planning-artifacts/prd/non-functional-requirements.md`
- Functional Requirements: `_bmad-output/planning-artifacts/prd/functional-requirements.md`
- Epic 2 Test Design Reference: `_bmad-output/test-design-epic-2.md`

---

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow:** `_bmad/bmm/testarch/test-design` (Epic-Level, Phase 4)
**Version:** 4.0 (BMad v6)
