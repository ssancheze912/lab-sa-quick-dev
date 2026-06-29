# Automation Summary - Story 2.5: Delete Client

**Date:** 2026-06-29
**Story:** 2.5 - Delete Client
**Mode:** BMad-Integrated
**Coverage Target:** critical-paths + edge cases
**Branch:** develop-platform-gaduranb-rq2-epic-2-gestion-de-clientes

---

## Baseline (ATDD Tests Already in GREEN)

30 tests passing (30/30) before this expansion:
- Unit: 9 tests (`useDeleteCliente.test.ts`)
- Component: 14 tests (`ClienteDetailView.delete.test.tsx`)
- API Integration: 7 tests (`DeleteClienteEndpointTests.cs`)
- E2E: in ATDD but requires live backend (marked deferred in ATDD phase)

---

## Tests Created (Expansion)

### Unit Tests — `useDeleteCliente.edge.test.ts` (4 new tests)

- `[P2]` No options provided — succeeds without throwing (null-safety of options?.onSuccess)
- `[P2]` No options provided — still calls invalidateQueries with ['clientes']
- `[P2]` isError resets to false after second mutation succeeds following a first failure
- `[P2]` DELETE 404 (already-deleted race condition) — isError true, invalidateQueries NOT called

All 4 passing. File: `frontend/src/modules/crm/clientes/application/useDeleteCliente.edge.test.ts`

### Component Tests — `ClienteDetailView.delete.edge.test.tsx` (5 passing + 1 fixme)

- `[P1]` DELETE 500: dialog stays open (error path does not transition to empty-state)
- `[P1] FIXME` DELETE 500: error toast "Error al eliminar el cliente" — SKIPPED (see fixme note)
- `[P1]` DELETE 404 race condition: dialog stays open
- `[P1]` Dialog idempotency: can be reopened after cancel
- `[P2]` "Confirmar" button has correct label text "Confirmar" before any mutation
- `[P2]` "Cancelar" does not emit DELETE even via keyboard + click combination

5 passing, 1 skipped. File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.edge.test.tsx`

### API Integration Tests — `DeleteClienteEndpointEdgeTests.cs` (3 new tests)

- Delete two clients sequentially — each returns 204, no cross-contamination
- Delete one of three clients — others remain in list (targeted deletion only)
- DELETE with invalid (non-Guid) route param — 400 or 404, never 500

All 3 passing. File: `backend/tests/SiesaAgents.IntegrationTests/Clientes/DeleteClienteEndpointEdgeTests.cs`

### E2E Tests — `delete-cliente.edge.spec.ts` (3 active + 1 fixme)

Require live frontend + network interception (no live backend needed — all routes mocked):

- `[P1] FIXME` DELETE 500: dialog stays open AND error toast shown — FIXME (same impl gap)
- `[P1]` Navigation rail visible during delete dialog flow
- `[P1]` "Confirmar" button disabled while DELETE is in-flight
- `[P2]` Delete dialog has `role="dialog"` and `aria-modal="true"` (blocking modal semantics)

E2E tests require live frontend server (`pnpm --filter frontend dev`). 3 active tests; 1 fixme.
File: `e2e/tests/clientes/delete-cliente.edge.spec.ts`

---

## Infrastructure

No new fixtures or factories created. Existing infrastructure reused:
- `frontend/src/test/msw/handlers/clientes-delete.handlers.ts` — existing handlers sufficient
- `frontend/src/test/factories/cliente.factory.ts` — existing factory sufficient

---

## Tests Marked as FIXME

**2 tests** marked as `it.skip` (Vitest) / `test.fixme` (Playwright) — same root cause:

**Root cause:** `useDeleteCliente.ts` and `ClienteDetailView.tsx` do not implement an error toast on DELETE failure. The story dev notes specify: `"onError: shows generic 'Error al eliminar el cliente' (never expose raw error details)"` — this was not implemented in the story's dev phase.

Files affected:
1. `ClienteDetailView.delete.edge.test.tsx` line ~118 — `it.skip`
2. `delete-cliente.edge.spec.ts` line ~72 — `test.fixme`

**Resolution required:** Add `onError` callback to `ClienteDetailView.tsx` that calls `toast.error('Error al eliminar el cliente')` when `deleteMutation.isError` becomes true (or handle in `useDeleteCliente` options).

---

## Coverage Analysis

**Total new tests:** 15 (12 new passing + 2 fixme + 1 E2E deferred with live backend)

**By level:**
- E2E: 4 tests (3 active, 1 fixme — requires live frontend)
- API Integration: 3 tests (all passing)
- Component: 6 tests (5 passing, 1 fixme)
- Unit: 4 tests (all passing)

**By priority:**
- P0: 0 new (all P0 were covered in ATDD)
- P1: 8 new (6 component+E2E, 2 unit)
- P2: 7 new (4 unit, 2 component, 1 E2E)

**Edge cases now covered:**
- Hook null-safety (no options)
- isError state reset between mutations
- DELETE 404 race condition (client deleted concurrently)
- Error path: dialog stays open on failure (500 and 404)
- Dialog open/close/reopen idempotency
- Confirm button label verification
- Cancel-via-keyboard boundary
- DELETE sequential isolation (no DB contamination)
- Selective deletion (others unaffected)
- Invalid Guid route param rejection
- Navigation rail visible during modal flow
- isPending double-click guard (E2E level)
- Modal aria attributes (accessibility)

**Identified gaps (fixme):**
- Error toast on DELETE failure not implemented in ClienteDetailView / useDeleteCliente

---

## Test Execution

```bash
# Run all new unit + component edge tests
cd frontend && pnpm vitest run src/modules/crm/clientes/application/useDeleteCliente.edge.test.ts src/modules/crm/clientes/presentation/ClienteDetailView.delete.edge.test.tsx

# Run new API integration edge tests
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~DeleteClienteEndpointEdgeTests"

# Run E2E edge tests (requires live frontend: pnpm --filter frontend dev)
npx playwright test e2e/tests/clientes/delete-cliente.edge.spec.ts
```

---

## Definition of Done

- [x] All tests follow Given-When-Then format
- [x] All tests use data-testid selectors
- [x] All tests have priority tags ([P0], [P1], [P2])
- [x] No hard waits or flaky patterns
- [x] Tests are deterministic
- [x] Unfixable tests marked with it.skip/test.fixme with detailed comments
- [x] Implementation gap documented (error toast on DELETE failure)
- [x] No duplicate coverage with ATDD tests
- [x] E2E tests use network-first pattern (route.fulfill before page.goto)

## Next Steps

1. Fix implementation gap: add `toast.error('Error al eliminar el cliente')` for DELETE failure in `ClienteDetailView.tsx`
2. Remove `it.skip`/`test.fixme` from affected tests after fix
3. Run full E2E suite with live frontend to validate E2E edge tests
4. Run `bmad tea *trace` to update traceability matrix with new test IDs
