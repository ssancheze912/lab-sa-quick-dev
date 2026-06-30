# Automation Summary - Story 2.5: Delete Client

**Date:** 2026-06-30
**Story:** 2.5 — Delete Client
**Epic:** 2 — Client Management
**Mode:** BMad-Integrated
**Coverage Target:** edge cases (expanding ATDD acceptance tests)

---

## Context

ATDD tests for this story already covered all 4 acceptance criteria at E2E, API, Component and Unit levels. This automation run expands coverage with edge cases, error paths, and boundary conditions not addressed in the acceptance tests.

---

## Tests Created (44 new tests)

### E2E Edge Cases (9 tests) — P1/P2

File: `e2e/tests/clientes/delete-client.edge.spec.ts`

- [P1] Dialog description contains client name for contextual awareness
- [P1] Pressing Escape closes AlertDialog without deleting client
- [P1] "Cancelar" button disabled while deletion is in flight (isPending guard)
- [P1] "Confirmar" shows "Eliminando..." text while pending
- [P1] Error toast shown when DELETE returns 500 (server error path)
- [P1] URL stays at client detail after 500 error (no navigation on failure)
- [P1] Client detail content remains visible after failed deletion
- [P2] Double-clicking "Confirmar" triggers DELETE only once (disabled guard)
- [P1] Right panel empty after successful deletion (no detail content)

### API Edge Cases (8 tests) — P1/P2

File: `e2e/tests/api/clientes-delete.edge.api.spec.ts`

- [P1] DELETE with non-UUID path segment returns 4xx (not 500)
- [P2] Non-UUID path returns structured error body (not empty)
- [P1] No stack trace in response for invalid UUID input (NFR6)
- [P1] Second DELETE on already-deleted client returns 404 (not idempotent)
- [P1] Second DELETE response follows Problem Details RFC 7807
- [P2] Concurrent DELETEs on same client: exactly one 204 and one 404
- [P1] All 3 contacts have clienteId = null after client deletion (FR25 multi-contact)
- [P1] Successful 204 response has empty body (RFC 7230 compliance)

### Component Edge Cases (9 tests) — P1/P2

File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.edge.test.tsx`

- [P1] Dialog description includes client name (contextual confirmation)
- [P1] "Cancelar" disabled when isPending = true
- [P1] "Confirmar" shows "Eliminando..." when isPending = true
- [P1] "Confirmar" shows "Confirmar" when NOT pending (baseline)
- [P1] Disabled "Confirmar" does NOT call mutate (double-submit guard)
- [P2] "Eliminar" button NOT rendered during loading skeleton state
- [P2] "Eliminar" button NOT rendered when client not found (isError)
- [P1] "Eliminar" button remains enabled after dialog cancellation
- [P1] useDeleteCliente called with onSuccess option (not a bare hook call)

### Unit Edge Cases (10 tests) — P1/P2

File: `frontend/src/modules/crm/clientes/application/useDeleteCliente.edge.test.ts`

- [P2] mutate with empty string still calls repository (backend validates)
- [P1] Generic network error shows error toast
- [P1] isError = true after generic network error
- [P2] toast.success NOT called on error
- [P1] isPending returns to false after successful mutation lifecycle
- [P1] isPending returns to false after failed mutation lifecycle
- [P2] Sequential mutations on different IDs each call repository once
- [P2] Mutation succeeds without throwing when onSuccess omitted
- [P2] Mutation succeeds without throwing when options = {}
- [P2] ["contactos"] NOT invalidated when mutation fails with 404

### Backend Unit Edge Cases (8 tests) — P1/P2

File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerEdgeCaseTests.cs`

- Validator rejects Guid.Empty (ValidationException, not NotFoundException)
- Validator accepts valid Guid without errors
- Handler throws ValidationException for Guid.Empty before reaching repo
- CancellationToken forwarded from handler to repository.DeleteAsync
- Three-client repo: only targeted client removed, two others remain
- Handler passes the exact Guid from the command to the repository
- Two sequential deletes on different clients both succeed (repo empty)
- NotFoundException message contains the client id for traceability

---

## Infrastructure

No new fixtures or factories created — ATDD tests already established `ApiHelper` and `buildCliente`/`buildContacto` factories. The new edge tests reuse these helpers directly.

---

## Coverage Analysis

| Level | ATDD Tests (pre-existing) | New Edge Tests | Total |
|-------|--------------------------|---------------|-------|
| E2E | 14 | 9 | 23 |
| API | 11 | 8 | 19 |
| Component | 13 | 9 | 22 |
| Unit (frontend) | 11 | 10 | 21 |
| Unit (backend) | 6 | 8 | 14 |
| **Total** | **55** | **44** | **99** |

### Gaps Intentionally Not Covered

- AC4 E2E tests (contacts become unassigned) — contacts module (Epic 3) not yet implemented, those ATDD tests are already out-of-scope per story notes.
- Accessibility: ARIA attribute validation and screen reader flow — covered by WCAG audit in NFR workflow.
- Visual regression: "Eliminar" button styling (red/destructive) — out of scope for this workflow.

---

## Definition of Done

- [x] All tests follow Given-When-Then format
- [x] All tests use data-testid selectors (E2E/Component)
- [x] All tests have priority tags [P1]/[P2]
- [x] No hard waits (page.waitForTimeout / cy.wait)
- [x] No page objects
- [x] Test files under 300 lines each
- [x] No fixme tests — all 44 tests are fully implementable against current code
- [x] Avoids duplicate coverage with existing ATDD tests

---

## Test Execution

```bash
# Run E2E edge cases
npx playwright test e2e/tests/clientes/delete-client.edge.spec.ts

# Run API edge cases
npx playwright test e2e/tests/api/clientes-delete.edge.api.spec.ts

# Run all delete-client specs
npx playwright test --grep "delete-client"

# Run frontend unit tests
pnpm --filter frontend test src/modules/crm/clientes

# Run backend unit tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "DeleteCliente"
```

---

## Next Steps

1. Review generated edge tests with team
2. Run in CI pipeline alongside ATDD tests
3. Integrate with quality gate: `bmad tea *trace`
4. Monitor E2E concurrent-delete test for flakiness (race-condition scenario)
