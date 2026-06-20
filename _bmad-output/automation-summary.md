# Automation Summary — Story 2.3: Create Client

**Date:** 2026-06-20
**Story:** 2.3 — Create Client
**Epic:** Epic 2 — Client Management
**Coverage Target:** BMad-Integrated (edge cases + error paths + boundary conditions)
**Mode:** BMad-Integrated (ATDD tests existed, expanded with edge cases)

---

## Tests Created

### Unit Tests — clienteSchema (P2)

- `frontend/src/modules/crm/clientes/application/clienteSchema.edge.test.ts` (17 tests)
  - [P2] Whitespace-only boundary: space passes min(1), empty string fails — documents no trim behavior
  - [P2] NIT-specific error message "El NIT no puede estar vacío" (different from other fields)
  - [P2] Numeric strings accepted as NIT (pure digits, dash-format)
  - [P2] Special characters and accented letters accepted in nombre and ciudad
  - [P2] 255-char nombre accepted (no maxLength constraint)
  - [P2] 50-char NIT accepted (no maxLength constraint — documents gap)
  - [P2] null nombre rejected (type error)
  - [P2] undefined nit (missing field) rejected
  - [P2] number type for telefono rejected
  - [P2] Fully empty object {} produces exactly 4 field errors
  - [P2] Correct error messages for all 4 fields independently verified

### Unit Tests — useCreateCliente (P1-P2)

- `frontend/src/modules/crm/clientes/application/useCreateCliente.edge.test.ts` (9 tests)
  - [P1] invalidateQueries(['clientes']) called on success
  - [P1] 400 Bad Request triggers toast.error
  - [P1] Network error (no response) triggers toast.error
  - [P2] 503 Service Unavailable triggers toast.error
  - [P2] isSuccess becomes true after successful mutation
  - [P2] isPending is true while mutation is in-flight
  - [P2] mutate passes all 4 fields to repository with exact values
  - [P2] 409 does NOT trigger toast.error (handled by form setError)
  - [P2] isError=true and error.response.status=409 exposed to form layer

### Component Tests — ClienteForm (P1-P3)

- `frontend/src/modules/crm/clientes/presentation/ClienteForm.edge.test.tsx` (14 tests)
  - [P1] 500 error does NOT set NIT field error (only 409 does)
  - [P1] 500 error does NOT show any inline field errors
  - [P1] Partial fill: only unfilled field shows error (3 filled, 1 empty → 1 error)
  - [P1] Ciudad-only error when other 3 fields filled
  - [P1] Error elements have CSS class text-red-600
  - [P1] NIT conflict error element has CSS class text-red-600
  - [P1] Cancel resets form values before calling onClose
  - [P2] aria-describedby set on Nombre input when error is present
  - [P2] aria-describedby set on NIT input when NIT is empty on submit
  - [P2] aria-describedby NOT set on Nombre input initially (no error)
  - [P2] mutate receives exact typed values (no trimming)
  - [P2] Guardar button disabled when isPending=true (prevents double-submit)
  - [P3] Guardar button has type="submit"
  - [P3] Cancelar button has type="button" (prevents accidental form submission)

### Component Tests — NuevoClienteDialog (P1-P3)

- `frontend/src/modules/crm/clientes/presentation/NuevoClienteDialog.edge.test.tsx` (12 tests)
  - [P1] Backdrop (overlay) click calls onClose
  - [P1] Clicking inside dialog content does NOT call onClose
  - [P1] Dialog element has aria-modal="true"
  - [P1] Close (✕) button has aria-label="Cerrar"
  - [P1] Clicking ✕ button calls onClose
  - [P1] ✕ button does NOT submit the form (mutate not called)
  - [P2] Dialog absent from DOM when open=false (not hidden — unmounted)
  - [P2] Rapid open/close/reopen cycle renders cleanly
  - [P2] Pressing Escape when open=true calls onClose
  - [P2] Pressing Escape when open=false does NOT call onClose
  - [P3] Dialog title is an h2 heading containing "Nuevo cliente"
  - [P3] aria-labelledby references element containing "Nuevo cliente"

### E2E Tests — Create Client UI (P1-P3)

- `e2e/tests/clientes/create-client.edge.spec.ts` (10 tests)
  - [P1] 500 response shows "No se pudo guardar. Intenta de nuevo." toast
  - [P1] 500 response does NOT show "El NIT/RUC ya está registrado" inline
  - [P1] Reopening dialog after Cancelar shows empty fields
  - [P1] Reopening dialog after Esc shows empty fields
  - [P2] POST body contains all 4 fields with values matching typed input
  - [P2] Two consecutive clients with different NITs both appear in list
  - [P2] Nombre error disappears after fixing the empty field
  - [P2] All 4 inline errors shown simultaneously on empty submit
  - [P3] Dialog reopens cleanly with empty fields after successful creation
  - [P2] "Nuevo cliente" is an h2 heading inside the dialog

### API Tests — POST /api/v1/clientes (P1-P3)

- `e2e/tests/api/create-client.api.edge.spec.ts` (14 tests)
  - [P1] 400 when nombre omitted entirely (vs empty string)
  - [P1] 400 when nit omitted entirely
  - [P1] 400 when telefono omitted entirely
  - [P1] 400 when ciudad omitted entirely
  - [P1] 409 body status field is exactly 409
  - [P2] 409 detail contains the conflicting NIT value
  - [P2] 409 response Content-Type includes json
  - [P1] GET /api/v1/clientes/{id} returns created client after POST
  - [P1] Created client appears in GET /api/v1/clientes list
  - [P2] Two clients with different NITs both return 201
  - [P2] Whitespace-only nombre returns 400 or 201 (documents backend trim behavior)
  - [P2] NIT with dash-format "900111222-1" accepted (201)
  - [P2] Nombre with accented characters accepted (201)
  - [P3] Location header ends with the new client UUID

---

## Coverage Summary

### Total New Tests Generated

| Level | File | Tests |
|-------|------|-------|
| Unit | clienteSchema.edge.test.ts | 17 |
| Unit | useCreateCliente.edge.test.ts | 9 |
| Component | ClienteForm.edge.test.tsx | 14 |
| Component | NuevoClienteDialog.edge.test.tsx | 12 |
| E2E | create-client.edge.spec.ts | 10 |
| API | create-client.api.edge.spec.ts | 14 |
| **Total** | | **76 new tests** |

### Priority Breakdown

| Priority | Count |
|----------|-------|
| P1 | 27 |
| P2 | 40 |
| P3 | 9 |

### Test Execution (Frontend — Vitest)

```bash
# Run all frontend tests including new edge cases
cd frontend && pnpm run test --run

# Run only story 2.3 edge case tests
cd frontend && pnpm run test --run clienteSchema.edge useCreateCliente.edge ClienteForm.edge NuevoClienteDialog.edge
```

### Test Execution (E2E/API — Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run only create-client edge cases
npx playwright test e2e/tests/clientes/create-client.edge.spec.ts
npx playwright test e2e/tests/api/create-client.api.edge.spec.ts

# Run by priority
npx playwright test --grep "@P1"
```

---

## Coverage Analysis

### What Was Already Covered (ATDD)

- AC1: Form renders 4 required fields, labels with *, legend
- AC2: Valid submit calls mutate with correct data
- AC3: Empty fields show inline errors; mutate blocked
- AC4: 409 conflict shows "El NIT/RUC ya está registrado" on NIT field
- AC5: Cancel calls onClose; Esc closes dialog
- AC6: role="dialog", aria-labelledby, Tab navigation
- AC7: isPending → disabled button, "Guardando..." text
- API: 201 with ClienteDto, 400 for empty fields, 409 for duplicate NIT

### What This Expansion Adds (Edge Cases)

- Error path isolation: 500 does NOT trigger NIT inline error (only 409 does)
- ARIA completeness: aria-modal, aria-describedby on errors, aria-label on close button
- Boundary conditions: whitespace, long strings, accented chars, numeric NIT formats
- Schema type safety: null/undefined/wrong-type rejection
- NIT message uniqueness: "El NIT no puede estar vacío" vs "Este campo es requerido"
- Form reset verification: values cleared after cancel and after success
- invalidateQueries call verified independently (not just ATDD which only checks list update)
- Error state segregation: 400/500/network all trigger toast; 409 does not
- Backdrop click close path
- Button type attributes (type="submit" vs type="button")
- POST body field accuracy via network interception
- API: omitted fields (not just empty strings) return 400
- API: Location header format and UUID correctness
- API: sequential creates with unique NITs

### Coverage Status

- All 7 acceptance criteria covered by ATDD + edge cases
- Error paths: 400, 409, 500, network error all covered
- Boundary conditions: empty, whitespace, null, undefined, long strings, special chars
- ARIA accessibility: all attributes verified
- 0 tests marked as test.fixme()

---

## Definition of Done

- [x] All tests follow Given-When-Then format
- [x] All tests have priority tags ([P1], [P2], [P3])
- [x] No hard waits or flaky patterns
- [x] Component tests use vi.mock for dependencies
- [x] E2E tests use network-first interception (route before navigate)
- [x] Factory helpers used for test data (buildCliente, createCliente)
- [x] All 52 new component/unit tests pass (verified: 242 total passing)
- [x] 0 tests marked test.fixme()
- [x] Test files under 300 lines each

## Next Steps

1. Run E2E tests against a live backend: `npx playwright test e2e/tests/clientes/create-client.edge.spec.ts`
2. Monitor 500/network error toasts in CI for flakiness
3. Consider adding `.trim()` to clienteSchema to reject whitespace-only inputs (documented gap)
4. Run traceability matrix: `bmad tea *trace`
