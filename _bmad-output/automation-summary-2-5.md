# Automation Summary — Story 2.5: Delete Client

**Date:** 2026-06-24
**Story:** 2.5 — Delete Client
**Epic:** 2 — Client Management
**Mode:** BMad-Integrated
**Coverage Target:** edge cases + error paths + boundary conditions

---

## Tests Created (New — Expansion of ATDD baseline)

### E2E Tests — Delete Client Edge Cases (10 tests)

- `e2e/tests/clientes/delete-client.edge-cases.spec.ts`
  - [P1] Dialog subtitle "Esta acción no se puede deshacer." is rendered (1 test)
  - [P1] Dialog reopens correctly after a previous cancel (1 test)
  - [P1] Multiple sequential cancel cycles leave dialog closeable each time (1 test)
  - [P1] Both "Editar" and "Eliminar" buttons visible simultaneously when data loaded (1 test)
  - [P1] "Eliminar" button activatable via Enter key (keyboard accessibility) (1 test)
  - [P1] 404 on DELETE (stale client mid-flow) shows error toast (1 test)
  - [P1] 404 on DELETE — URL stays at /clientes/{id} (no navigation on error) (1 test)
  - [P2] "Confirmar" re-enables after a failed DELETE (retry possible) (1 test)
  - [P2] Network failure (connection refused) during DELETE shows error toast (1 test)
  - [P1] "Eliminar" button NOT visible while client is still loading (skeleton state) (1 test)

### API Tests — DELETE Endpoint Edge Cases (9 tests)

- `e2e/tests/api/delete-client.api.edge-cases.spec.ts`
  - [P1] DELETE does NOT remove other clients from the list (1 test)
  - [P1] DELETE does NOT modify unrelated client's data (1 test)
  - [P1] All 3 contacts become unassigned when a client with multiple contacts is deleted (1 test)
  - [P1] 404 response Content-Type is application/json or application/problem+json (1 test)
  - [P1] 404 detail field (when present) is human-readable — no .NET class names (1 test)
  - [P1] 400 response for malformed UUID includes a status field (1 test)
  - [P2] Overlong path segment does not return 500 (1 test)
  - [P1] Second DELETE on same ID returns 404, not 500 (idempotency) (1 test)
  - [P1] List does not include deleted client after second DELETE attempt (1 test)

### Unit Tests — useDeleteCliente Hook Edge Cases (8 tests)

- `frontend/src/modules/crm/clientes/application/useDeleteCliente.edge-cases.test.ts`
  - [P2] hasContacts undefined → shows generic toast (not contacts-aware) (1 test)
  - [P1] toast.success NOT called on error path (1 test)
  - [P1] toast.error NOT called on success path (1 test)
  - [P1] invalidateQueries NOT called on error path (1 test)
  - [P1] Exactly clientes and contactos query keys invalidated (no more, no less) (1 test)
  - [P2] Second sequential successful mutation triggers toast and invalidation again (1 test)
  - [P2] isPending is false before any mutation is triggered (1 test)
  - [P1] isError is true after unexpected 500 error (1 test)

### Component Tests — ClienteDetailView Delete Interaction Edge Cases (9 tests)

- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete-edge-cases.test.tsx`
  - [P1] "Eliminar" absent during skeleton loading state (1 test)
  - [P1] "Eliminar" absent when client returns 404 (1 test)
  - [P1] "Eliminar" absent in error panel state (500) (1 test)
  - [P1] Error toast shown when DELETE returns 500 (1 test)
  - [P2] "Confirmar" button re-enables after failed DELETE (not stuck in "Eliminando...") (1 test)
  - [P1] "Cancelar" does NOT trigger navigate (1 test)
  - [P0] navigate called with { to: '/clientes' } on successful delete (1 test)
  - [P1] Opening delete dialog does not show edit form (dialogs independent) (1 test)
  - [P1] Cancelling delete dialog allows opening edit dialog afterwards (1 test)

---

## Infrastructure

No new fixtures or factories were required. The existing `e2e/support/factories/cliente.factory.ts` provides `createClienteDto()` and `createClientePayload()` which are reused in all new E2E tests.

---

## Coverage Analysis

**Total New Tests:** 36
- P0: 1 test (critical navigation assertion)
- P1: 27 tests (high-priority edge cases and error paths)
- P2: 8 tests (medium-priority boundary conditions)

**Test Levels:**
- E2E: 10 tests (boundary conditions + error paths in browser context)
- API: 9 tests (backend contract edge cases — isolation, idempotency, multiple contacts)
- Component: 9 tests (React component state edge cases)
- Unit: 8 tests (hook behavior edge cases)

**ATDD Baseline (not duplicated):** 21 E2E + 9 API + 6 hook + 5 component = 41 tests in existing files

**Coverage Status:**
- All 6 acceptance criteria have edge-case expansion
- Error paths fully covered: 500, 404-mid-session, network abort, idempotent double-delete
- State transitions covered: loading/error/not-found states hide "Eliminar" button
- UI state edge cases covered: dialog reopen, dialog independence, button re-enable after error
- API contract edge cases covered: data isolation, multiple contacts, error format validation
- Keyboard accessibility covered: Enter key on "Eliminar" button

---

## Test Files Generated

| File | Level | Tests |
|------|-------|-------|
| `e2e/tests/clientes/delete-client.edge-cases.spec.ts` | E2E | 10 |
| `e2e/tests/api/delete-client.api.edge-cases.spec.ts` | API | 9 |
| `frontend/src/modules/crm/clientes/application/useDeleteCliente.edge-cases.test.ts` | Unit | 8 |
| `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete-edge-cases.test.tsx` | Component | 9 |

---

## Definition of Done

- [x] All tests follow Given-When-Then format (implicit in Arrange/Act/Assert)
- [x] All tests have priority tags ([P0], [P1], [P2])
- [x] All E2E tests use data-testid selectors
- [x] All E2E tests use network-first route interception (before page.goto)
- [x] No hard waits / no waitForTimeout in E2E edge cases (except one brief settle in ATDD baseline)
- [x] No page objects — tests are direct
- [x] No duplicate coverage with ATDD baseline
- [x] Unit tests mock siesa-ui-kit and TanStack Router correctly
- [x] Tests marked fixme: 0

---

## Test Execution

```bash
# Run all E2E tests for delete story
npx playwright test e2e/tests/clientes/delete-client

# Run edge cases only
npx playwright test e2e/tests/clientes/delete-client.edge-cases.spec.ts
npx playwright test e2e/tests/api/delete-client.api.edge-cases.spec.ts

# Run unit/component tests
pnpm --filter frontend test src/modules/crm/clientes/application/useDeleteCliente.edge-cases.test.ts
pnpm --filter frontend test src/modules/crm/clientes/presentation/ClienteDetailView.delete-edge-cases.test.tsx

# Run by priority
npx playwright test --grep "\[P0\]"
npx playwright test --grep "\[P0\]|\[P1\]"
```

## Next Steps

1. Review generated tests with team
2. Run tests in CI pipeline
3. Integrate with quality gate: `bmad tea *gate`
4. Monitor for flaky tests in burn-in loop
