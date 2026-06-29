# Traceability Matrix — Epic 4: Asociación Cliente-Contacto

**Generated:** 2026-06-29
**Epic:** EP-04 — Asociación Cliente-Contacto
**Stories Covered:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
**Gate Scope:** epic
**Branch:** develop-platform-gaduranb-rq4-epic-4-asociacion-cliente-contacto

---

## Phase 1: Requirements-to-Tests Traceability Matrix

### Epic Acceptance Criteria

| Epic AC | Description | Priority | FR Reference |
|---------|-------------|----------|-------------|
| AC-E4.1 | Associate contact to client directly from client detail | P0 | FR17, FR18 |
| AC-E4.2 | View all contacts in client detail; navigate to contact in ≤2 clicks | P0 | FR19, FR20, FR21 |
| AC-E4.3 | From contact detail, see associated client and navigate in 1 click | P0 | FR22 |
| AC-E4.4 | Disassociate contact without deleting either record | P0 | FR23, FR24 |
| AC-E4.5 | Filter contacts to show only orphans (no client); URL-deep-linkable | P1 | FR25, FR29 |
| AC-E4.6 | Reassign contact from one client to a different client | P1 | FR26 |
| AC-E4.7 | All changes immediately visible to all users without page refresh | P0 | FR27 |

---

### Traceability: Epic AC → Story → Tests

#### AC-E4.1 — Associate Contact from Client Detail

**Coverage Status:** FULL
**Implementing Story:** 4.2 (associate-disassociate-contacts-from-client)

| Test Level | File | Test IDs | Status |
|-----------|------|----------|--------|
| E2E | `e2e/tests/contactos/asociar-desasociar.spec.ts` | TC-1 (full associate flow), TC-5 (search + associate) | GREEN (story done) |
| Component | `AsociarContactoDialog.test.tsx` | TC-1 (client list shows), TC-2 (search filter), TC-3 (confirm triggers mutation), TC-4 (cancel no PUT) | GREEN |
| Unit | `useAsociarContacto.test.ts` | TC-1 (PUT body), TC-2 (cache invalidation), TC-3 (toast success), TC-4 (error toast) | GREEN |
| API | `AsociarContactoTests.cs` | TC-1 (PUT 200 OK), TC-2 (GET confirms clienteId) | GREEN |

**AC Story-level coverage:** AC#1 (associate button), AC#2 (dialog lists contacts), AC#3 (PUT updates association), AC#6 (PUT body `{ clienteId }`), AC#10 (disassociate removes clienteId)

---

#### AC-E4.2 — View Contacts in Client Detail + 2-Click Navigation

**Coverage Status:** FULL
**Implementing Stories:** 4.1 (view), 4.3 (navigate)

**Story 4.1 Tests (view):**

| Test Level | File | Test IDs | Status |
|-----------|------|----------|--------|
| E2E | `e2e/tests/clientes/view-contacts.spec.ts` | TC-1 (list renders), TC-2 (empty state), TC-3 (loading skeleton), TC-4 (error panel) | GREEN |
| Component | `ContactosSeccion.test.tsx` | TC-1 through TC-12 | GREEN |
| Unit | `useContactosByCliente.test.ts` | TC-1 through TC-12 | GREEN |
| API | `GetContactosByClienteTests.cs` | TC-1 through TC-9 | GREEN |

Total story 4.1 tests: 43

**Story 4.3 Tests (navigation ≤2 clicks):**

| Test Level | File | Test IDs | Status |
|-----------|------|----------|--------|
| E2E | `e2e/tests/contactos/navigate-contact-detail.spec.ts` | TC-1 (click navigates), TC-2 (back to client), TC-3 (≤2 clicks) | GREEN |
| Component | `ClienteDetailView.navigation.test.tsx` | TC-1 through TC-8 | GREEN |
| Component | `ContactoDetailView.backNav.test.tsx` | TC-1 through TC-10 | GREEN |

Total story 4.3 tests: 27

---

#### AC-E4.3 — View Associated Client from Contact Detail + 1-Click Navigation

**Coverage Status:** FULL
**Implementing Story:** 4.4 (view-associated-client-from-contact-detail)

| Test Level | File | Test IDs | Status |
|-----------|------|----------|--------|
| Component | `ClienteAsociadoSeccion.test.tsx` | TC-1 through TC-12 | GREEN |
| E2E | `e2e/tests/contactos/view-client-from-contact.spec.ts` | TC-1 through TC-10 | GREEN |

Total story 4.4 tests: 22 (100% AC coverage — 7/7 ACs)

**Note:** data-testid naming inconsistency flagged by test review — story spec uses `"cliente-asociado-link"` but ATDD checklist and tests use `"navigate-to-cliente"`. P1 quality issue, does not block functionality.

---

#### AC-E4.4 — Disassociate Contact Without Deleting Either Record

**Coverage Status:** FULL
**Implementing Story:** 4.2 (associate-disassociate-contacts-from-client)

| Test Level | File | Test IDs | Status |
|-----------|------|----------|--------|
| E2E | `e2e/tests/contactos/asociar-desasociar.spec.ts` | TC-3 (disassociate flow), TC-4 (confirm dialog), TC-6 (both records persist) | GREEN |
| Component | `ConfirmarDesasociarDialog.test.tsx` | TC-1 through TC-10 | GREEN |
| Unit | `useDesasociarContacto.test.ts` | TC-1 through TC-9 | GREEN |
| API | `DesasociarContactoTests.cs` | TC-1 through TC-5 | GREEN |

**AC Story-level coverage:** AC#4 (disassociate button), AC#5 (confirm dialog), AC#7 (PUT body `{ clienteId: null }`), AC#9 (records persist — GET confirms), AC#10 (button hidden after disassociation)

---

#### AC-E4.5 — Filter Contacts for Orphans (No Client)

**Coverage Status:** PARTIAL (8/9 story ACs fully covered; AC#6 component deep-link path has a gap)
**Implementing Story:** 4.5 (orphan-contacts-filter)

| Test Level | File | Test IDs | Status |
|-----------|------|----------|--------|
| E2E | `e2e/tests/contactos/orphan-contacts-filter.spec.ts` | TC-1 (activate filter + URL), TC-2 (deep-link pre-activated), TC-3 (deactivate restores) | GREEN |
| Component | `ContactoListView.sinCliente.test.tsx` | TC-1 through TC-8 | GREEN (with gap) |
| API | `GetContactosQueryHandlerTests.cs` | TC-1 (sinCliente=true filters), TC-2 (default returns all) | GREEN |

Total story 4.5 tests: 39

**Coverage gap:** AC#6 (direct navigation to `/contactos?sinCliente=true` pre-activates filter) — E2E TC-2 covers this at full-stack level but `renderWithSinCliente` helper in component tests ignores the `sinCliente` argument, so the component-level deep-link path is exercised only indirectly. Test review score: 74/100.

**Known test quality issues (P1):**
- `renderWithSinCliente` helper ignores `sinCliente` argument (functional gap in test helper)
- Non-deterministic OR-chained active-state assertion (`||`)
- Undocumented hard wait in E2E

---

#### AC-E4.6 — Reassign Contact to Different Client

**Coverage Status:** FULL
**Implementing Story:** 4.6 (reassign-contact-to-different-client)

| Test Level | File | Test IDs | Status |
|-----------|------|----------|--------|
| E2E | `e2e/tests/contactos/reassign-contact.spec.ts` | AC#1, AC#2, AC#10, TC-1 through TC-4 | RED→GREEN* |
| Component | `ReasignarClienteDialog.test.tsx` | TC-1 through TC-9 | RED→GREEN* |
| Component | `ContactoDetailView.reasignar.test.tsx` | TC-1 through TC-6 | RED→GREEN* |
| Unit | `useReasignarContacto.test.ts` | TC-1 through TC-6 | RED→GREEN* |
| API | `ReasignarClienteTests.cs` | TC-1 through TC-5 | RED→GREEN* |

Total story 4.6 tests: 39 (11/11 story ACs = 100% coverage)

*ATDD checklist generated in RED phase (pre-implementation). Story status is "done" — tests expected GREEN after implementation.

**Known test quality issues (P1):**
- Toast spy imports siesa-ui-kit instead of react-hot-toast (alignment risk)
- TC-8 error toast DOM lookup requires Toaster to be mounted

---

#### AC-E4.7 — Immediate Visibility (No Page Refresh Required)

**Coverage Status:** FULL
**Implementing Stories:** 4.2 (associate/disassociate), 4.6 (reassign)

| Test Level | File | Test IDs | Mechanism |
|-----------|------|----------|-----------|
| Unit | `useAsociarContacto.test.ts` | TC-2 (cache invalidation) | `invalidateQueries(['contactos'])` |
| Unit | `useDesasociarContacto.test.ts` | TC-2 (cache invalidation) | `invalidateQueries(['contactos'])` |
| Unit | `useReasignarContacto.test.ts` | TC-2a–2d (4 query key invalidations) | `invalidateQueries(['contactos', { clienteId: oldId }])` + new + base |
| E2E | `asociar-desasociar.spec.ts` | TC-7 (list updates without reload) | TanStack Query refetch on invalidation |
| E2E | `reassign-contact.spec.ts` | TC-2 (old client list), TC-3 (new client list) | TanStack Query refetch on invalidation |

**TanStack Query invalidation strategy:** All mutation hooks call `queryClient.invalidateQueries()` with appropriate keys — `['contactos']` prefix-match invalidates all derived views (list, per-client, orphan filter). No page refresh required by design.

---

### Summary: Coverage by Epic AC

| Epic AC | Priority | Stories | Tests | Coverage | Quality |
|---------|----------|---------|-------|----------|---------|
| AC-E4.1 | P0 | 4.2 | 59 total (subset) | FULL | B (test-review 72/100) |
| AC-E4.2 | P0 | 4.1 + 4.3 | 43 + 27 = 70 | FULL | B (test-review 79/100) |
| AC-E4.3 | P0 | 4.4 | 22 | FULL | B (test-review 79/100) |
| AC-E4.4 | P0 | 4.2 | 59 total (subset) | FULL | B (test-review 72/100) |
| AC-E4.5 | P1 | 4.5 | 39 | PARTIAL (8.5/9 ACs) | B- (test-review 74/100) |
| AC-E4.6 | P1 | 4.6 | 39 | FULL | B+ (test-review PASS) |
| AC-E4.7 | P0 | 4.2 + 4.6 | covered above | FULL | B |

**Total tests across epic:** ~229 (43 + 59 + 27 + 22 + 39 + 39)
**Test pyramid distribution:** E2E (51) + API/Integration (39) + Component (94) + Unit (45)

---

### Coverage Metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| P0 ACs covered | 5/5 | ≥ 100% | PASS |
| P1 ACs covered | ~1.94/2 (97%) | ≥ 90% | PASS |
| Overall ACs covered | ~6.94/7 (99%) | ≥ 80% | PASS |
| Test quality (avg review score) | ~76/100 | — | INFO |
| Formal CI evidence | NOT AVAILABLE | — | UNKNOWN |

---

### Identified Gaps

| Gap ID | Epic AC | Story | Type | Severity | Description |
|--------|---------|-------|------|----------|-------------|
| GAP-01 | AC-E4.5 | 4.5 | Test quality | P1 | `renderWithSinCliente` ignores `sinCliente` arg — component deep-link (AC#6) not truly exercised at component level |
| GAP-02 | AC-E4.2 | 4.4 | Naming inconsistency | P1 | `data-testid` mismatch: story spec `"cliente-asociado-link"` vs test impl `"navigate-to-cliente"` |
| GAP-03 | Multiple | 4.2–4.6 | Evidence | P1 | No formal CI test execution reports (JUnit XML / TAP / JSON) — evidence from story completion notes only |
| GAP-04 | AC-E4.1 | 4.2 | Test quality | P1 | Toast text assertion weak (spy does not verify exact string) |
| GAP-05 | AC-E4.6 | 4.6 | Test quality | P2 | Toast spy imports siesa-ui-kit instead of react-hot-toast (alignment risk) |

---

## Phase 2: Quality Gate Decision

### Decision Rules Applied

| Rule | Threshold | Measured | Met? |
|------|-----------|----------|------|
| P0 coverage | ≥ 100% | 100% (5/5) | YES |
| P1 coverage | ≥ 90% | ~97% (~1.94/2) | YES |
| Overall coverage | ≥ 80% | ~99% (~6.94/7) | YES |
| Evidence completeness | Required | UNKNOWN (no CI reports) | CONCERNS |
| Critical gaps | None allowed | 0 critical | YES |

### Gate Decision: CONCERNS

**Primary reason:** Formal CI test execution evidence is UNKNOWN. No JUnit XML, TAP, or JSON execution reports are available. Evidence of test passage comes exclusively from story completion status and ATDD checklist notes ("RED — implementation does not exist yet" for 4.6, story status "done" for others). Per deterministic decision rules, UNKNOWN evidence triggers CONCERNS.

**Secondary reasons:**
- GAP-01: `renderWithSinCliente` test helper defect means AC-E4.5 / AC#6 component-level coverage is not formally verified
- GAP-02: data-testid naming inconsistency in Story 4.4 (risk of test-to-implementation misalignment)
- GAP-04: Weak toast assertion in Story 4.2 (AC#8 partially covered)

**Not blocking:**
- All P0 ACs have full test coverage across all test levels
- P1 ACs meet the 90% threshold at 97%
- No critical defects identified in any code review
- All stories marked status: done
- Architecture patterns (Clean Architecture, TDD, TanStack Query, WCAG 2.1 AA) consistently applied

### Recommended Actions Before PASS

1. Run the full test suite in CI and export JUnit XML or equivalent execution report
2. Fix `renderWithSinCliente` helper in Story 4.5 tests to actually pass `sinCliente` to the router context
3. Resolve `data-testid` naming inconsistency in Story 4.4 (`"cliente-asociado-link"` vs `"navigate-to-cliente"`)
4. Verify Story 4.6 tests are GREEN after implementation (ATDD checklist was generated in RED phase)
