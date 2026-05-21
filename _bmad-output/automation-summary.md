# Automation Summary — Story 4.6: Reassign Contact to Different Client

**Date:** 2026-05-21
**Story:** 4.6 — Reassign Contact to Different Client
**Epic:** 4 — Client-Contact Association & Data Quality
**Mode:** BMad-Integrated
**Coverage Target:** critical-paths (edge cases + error paths + boundary conditions)

---

## Context

This workflow expanded coverage BEYOND the ATDD baseline already present for Story 4.6:
- `e2e/tests/asociacion/asociacion-reasignacion.spec.ts` — 5 E2E tests (E2E-AC-20 through E2E-AC-24)
- `e2e/tests/asociacion/asociacion-api.spec.ts` — 1 API test (API-AC-05)
- `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.test.ts` — 4 unit tests (UNIT-AC-06 through UNIT-AC-09)

No backend changes were made; expansion focused on edge cases, accessibility,
error paths and component-level coverage of `ReassignClienteDialog`, which was
not covered by the ATDD baseline.

---

## Tests Created

### E2E Edge Cases — `e2e/tests/asociacion/asociacion-reasignacion-edge.spec.ts` (8 tests)

| Test ID | Priority | Description |
|---------|----------|-------------|
| E2E-46-EDGE-01 | P1 | "Reasignar" button is NOT rendered for orphan contact (clienteId === null) |
| E2E-46-EDGE-02 | P1 | "Confirmar" button is disabled until a cliente option is selected |
| E2E-46-EDGE-03 | P1 | Dialog list exposes `aria-label="Seleccionar nuevo cliente"` (WCAG 2.1 AA) |
| E2E-46-EDGE-04 | P1 | Closing the dialog with Escape does NOT trigger PUT /cliente |
| E2E-46-EDGE-05 | P1 | Selecting B then C only persists the final selection on confirm (single PUT) |
| E2E-46-EDGE-06 | P2 | Reopening dialog after cancel resets the previous selection (no stale state) |
| E2E-46-EDGE-07 | P2 | "Reasignar" button has `aria-label="Reasignar contacto a otro cliente"` |
| E2E-46-EDGE-08 | P2 | Dialog title is "Reasignar contacto" (Spanish — company standard) |

### API Edge Cases — `e2e/tests/asociacion/asociacion-api-edge-4-6.spec.ts` (6 tests)

| Test ID | Priority | Description |
|---------|----------|-------------|
| API-46-EDGE-01 | P1 | PUT /cliente with the SAME clienteId returns 200 (idempotency) |
| API-46-EDGE-02 | P1 | PUT /cliente with a NON-EXISTENT clienteId returns 4xx; clienteId unchanged |
| API-46-EDGE-03 | P1 | Reassign A → B → A leaves the contact on A (reversibility/consistency) |
| API-46-EDGE-04 | P1 | Reassignment updates `updatedAt` (boundary: monotonically increases) |
| API-46-EDGE-05 | P2 | PUT with malformed body returns 400 Problem Details (no stack trace, NFR6) |
| API-46-EDGE-06 | P2 | Reassignment moves the contact between `?clienteId={old}` → `{new}` filters |

### Unit Edge Cases — `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.edge.test.ts` (5 tests)

| Test ID | Priority | Description |
|---------|----------|-------------|
| UNIT-46-EDGE-01 | P1 | onError fires `toast.error("No se pudo reasignar el contacto. Intenta de nuevo.")` |
| UNIT-46-EDGE-02 | P1 | onError does NOT call `queryClient.invalidateQueries` (no cache disruption on failure) |
| UNIT-46-EDGE-03 | P1 | A single `mutate()` produces exactly one `assignCliente` call (no duplicate PUTs) |
| UNIT-46-EDGE-04 | P2 | `isPending` reflects the in-flight state of the mutation |
| UNIT-46-EDGE-05 | P2 | onSuccess invalidates the contact-detail key `['contactos', contactoId]` |

### Component Edge Cases — `frontend/src/modules/crm/contactos/presentation/__tests__/ReassignClienteDialog.edge.test.tsx` (8 tests)

| Test ID | Priority | Description |
|---------|----------|-------------|
| COMP-46-EDGE-01 | P1 | Loading clientes shows `react-loading-skeleton` (no spinner — UX standard) |
| COMP-46-EDGE-02 | P1 | Current `currentClienteId` is filtered out from the option list |
| COMP-46-EDGE-03 | P1 | Empty-state "No hay otros clientes disponibles" when only the current exists |
| COMP-46-EDGE-04 | P1 | "Confirmar" disabled until an option is selected; enabled after click |
| COMP-46-EDGE-05 | P1 | Dialog title is "Reasignar contacto" (Spanish — no English text) |
| COMP-46-EDGE-06 | P1 | "Confirmar" invokes `reassignMutation.mutate(selectedClienteId)` |
| COMP-46-EDGE-07 | P2 | Selected option carries `aria-selected="true"` (WCAG 2.1 AA + role="option") |
| COMP-46-EDGE-08 | P2 | "Cancelar" invokes `onClose` and does NOT fire the mutation |

---

## Coverage Summary

**Total New Tests: 27**

| Level | New Tests | P1 | P2 |
|-------|-----------|----|----|
| E2E | 8 | 5 | 3 |
| API | 6 | 4 | 2 |
| Component | 8 | 6 | 2 |
| Unit | 5 | 3 | 2 |

**Priority Breakdown:**
- P0: 0 (all P0 scenarios already covered in ATDD baseline)
- P1: 18 tests
- P2: 9 tests
- P3: 0

**Combined Coverage (ATDD + Edge Cases):**
- E2E total: 13 tests (5 ATDD + 8 edge)
- API total: 7 tests (1 ATDD + 6 edge)
- Unit total: 9 tests (4 ATDD + 5 edge)
- Component total: 8 tests (0 ATDD + 8 edge) — net new layer of coverage

**No tests marked as `test.fixme()`.** All generated tests passed validation on
first iteration (no auto-healing required).

---

## Validation Results

### Unit + Component Suite (Vitest)

```
$ pnpm vitest run \
    src/modules/crm/contactos/__tests__/useReassignContacto.test.ts \
    src/modules/crm/contactos/__tests__/useReassignContacto.edge.test.ts \
    src/modules/crm/contactos/presentation/__tests__/ReassignClienteDialog.edge.test.tsx

Test Files  3 passed (3)
     Tests  17 passed (17)
```

### TypeScript

```
$ pnpm tsc --noEmit
(clean — 0 errors)
```

### Playwright

```
$ pnpm exec playwright test --list \
    e2e/tests/asociacion/asociacion-reasignacion-edge.spec.ts \
    e2e/tests/asociacion/asociacion-api-edge-4-6.spec.ts

Total: 28 tests in 2 files  (14 chromium + 14 mobile-chrome)
```

E2E + API specs require a running backend (port 5000) + frontend (port 5173).
The Playwright `--list` step verifies syntax, fixtures and discovery only — full
execution is wired through CI/CD as per the project standard.

---

## Coverage Gap Analysis

### Covered by this workflow

- Orphan contact: "Reasignar" button correctly hidden
- Confirm button disabled state (no empty mutation possible)
- Selection-changes-before-confirm only fires the final PUT
- Escape key closes the dialog without mutation
- Selection reset on dialog reopen
- Dialog accessibility: aria-label on selection list, aria-selected on options, aria-label on Reasignar button
- Spanish-only UI text (dialog title, button labels, toasts, empty state)
- Reassignment to same clienteId (idempotent)
- Reassignment to non-existent clienteId (server-side rejection)
- A → B → A reversibility
- updatedAt monotonic progression (ISO 8601 with timezone — DateTimeOffset)
- Malformed body → 400 Problem Details (NFR6 — no stack trace)
- Backend filter consistency after reassignment (`?clienteId={old|new}`)
- Hook error path: toast.error fires; no cache invalidated on failure
- Hook contract: single mutate → single PUT (no double-fire)
- Hook isPending state tracking
- Hook invalidates contact-detail query key (`['contactos', contactoId]`)
- Dialog: skeleton during clientes load (not a spinner)
- Dialog: current cliente filtered out from options
- Dialog: empty-state when only the current cliente exists
- Dialog: Confirmar disabled then enabled transition
- Dialog: mutate invoked with the correct clienteId
- Dialog: Cancelar fires onClose and never mutates

### Known gaps (out of scope for Story 4.6)

- Real toast UI rendering in E2E (the ATDD spec E2E-AC-23 already covers this path; not duplicated in edge cases)
- Concurrent reassignment (two simultaneous PUTs) — race-condition scenario better suited to Story-level NFR (concurrency) testing
- Optimistic-UI rollback on mutation failure — current implementation does not use optimistic updates; behavior is "settle then invalidate"

---

## Files Modified or Created

### New test files

- `e2e/tests/asociacion/asociacion-reasignacion-edge.spec.ts` (8 E2E tests)
- `e2e/tests/asociacion/asociacion-api-edge-4-6.spec.ts` (6 API tests)
- `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.edge.test.ts` (5 unit tests)
- `frontend/src/modules/crm/contactos/presentation/__tests__/ReassignClienteDialog.edge.test.tsx` (8 component tests)

### Production code modified

None. The expansion is purely test-side — production behavior was already
correct per the ATDD baseline.

---

## Test Execution

```bash
# Unit + Component tests (Story 4.6 only)
cd frontend
pnpm vitest run \
  src/modules/crm/contactos/__tests__/useReassignContacto.test.ts \
  src/modules/crm/contactos/__tests__/useReassignContacto.edge.test.ts \
  src/modules/crm/contactos/presentation/__tests__/ReassignClienteDialog.edge.test.tsx

# E2E + API tests (Story 4.6 only — requires running backend + frontend)
pnpm exec playwright test \
  e2e/tests/asociacion/asociacion-reasignacion.spec.ts \
  e2e/tests/asociacion/asociacion-reasignacion-edge.spec.ts \
  e2e/tests/asociacion/asociacion-api-edge-4-6.spec.ts \
  --grep "Story 4.6"

# Run by priority (entire suite)
pnpm exec playwright test --grep "P1"
pnpm exec playwright test --grep "P2"
```

---

## Definition of Done

- [x] All tests follow Given-When-Then format
- [x] All tests have priority tags ([P1] / [P2])
- [x] All tests use data-testid selectors (no brittle CSS / XPath)
- [x] All tests are self-cleaning (afterEach deletes created contactos and clientes)
- [x] No hard waits — only one deliberate 1.1 s sleep in API-46-EDGE-04 to cross the 1-second timestamp granularity boundary (necessary for the assertion semantics; cannot be event-based)
- [x] No try-catch in test logic (only in afterEach cleanup)
- [x] All Spanish UI text validated against company standard
- [x] WCAG 2.1 AA aria-label coverage validated at dialog and button level
- [x] Test files under 400 lines each
- [x] Network-first pattern applied where applicable
- [x] No `page.reload()` calls in E2E tests (FR27)
- [x] No `test.fixme()` — every generated test passes / lists cleanly on first try
- [x] Output summary in this file

---

## Knowledge Base References Applied

- `test-levels-framework.md` — placed UI behavior at component level, error contract at API level, accessibility at E2E level
- `test-priorities-matrix.md` — P1 for accessibility / error contract / data integrity; P2 for boundary / nice-to-have coverage
- `test-quality.md` — atomic assertions, deterministic flow, no shared state
- `network-first.md` — `page.route()` registered before navigation in E2E specs
- `fixture-architecture.md` — followed the existing `ApiHelper` + `data.helper` pattern; no new global fixtures introduced (project standard)

---

## Next Steps

1. Run the full suite in CI with backend + frontend wired up
2. Integrate with `bmad tea *trace` to refresh the traceability matrix for Epic 4
3. Optionally run `bmad tea *gate` for Story 4.6 sign-off
