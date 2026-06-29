# ATDD Checklist — Story 4.1: View Associated Contacts in Client Detail

**Status**: RED phase complete  
**Date**: 2026-06-29  
**Story**: Story 4.1 — View Associated Contacts in Client Detail  
**Branch (worktree)**: `develop-platform-gaduranb-rq4-epic-4-asociacion-cliente-contacto`  

---

## Acceptance Criteria Coverage

| AC | Description | Test Level | File | Status |
|----|-------------|------------|------|--------|
| AC #1 | ContactManager renders in right panel when client has contacts | E2E | `e2e/tests/clientes/cliente-contactos-asociados.spec.ts` | RED |
| AC #1 | ContactManager section visible (`data-testid="cliente-contactos-seccion"`) | Component | `ClienteDetailView.contactos.test.tsx` | RED |
| AC #2 | Calls `GET /api/v1/contactos?clienteId=:id` via ClienteContactServiceAdapter | E2E | `e2e/tests/clientes/cliente-contactos-asociados.spec.ts` | RED |
| AC #2 | Uses TanStack Query key `['contactos', { clienteId }]` | Unit | `useContactosByCliente.test.ts` | RED |
| AC #2 | Backend accepts `clienteId` query param and filters results | API | `ContactosByClienteIdTests.cs` | RED |
| AC #3 | Empty-state "Sin contactos asociados" when no contacts | E2E | `e2e/tests/clientes/cliente-contactos-asociados.spec.ts` | RED |
| AC #3 | Empty-state element (`data-testid="contactos-empty-state"`) rendered | Component | `ClienteDetailView.contactos.test.tsx` | RED |
| AC #3 | Backend returns `[]` for unknown clienteId | API | `ContactosByClienteIdTests.cs` | RED |
| AC #4 | Error state + "Reintentar" button on backend failure | E2E | `e2e/tests/clientes/cliente-contactos-asociados.spec.ts` | RED |
| AC #4 | `data-testid="contactos-error-state"` + "Reintentar" button | Component | `ClienteDetailView.contactos.test.tsx` | RED |
| AC #4 | `refetch` function exposed by hook | Unit | `useContactosByCliente.test.ts` | RED |
| AC #5 | Skeleton shown while contacts loading (no spinner) | E2E | `e2e/tests/clientes/cliente-contactos-asociados.spec.ts` | RED |
| AC #5 | `data-testid="contactos-skeleton"` visible during fetch | Component | `ClienteDetailView.contactos.test.tsx` | RED |
| AC #5 | `isLoading` exposed by hook during in-flight fetch | Unit | `useContactosByCliente.test.ts` | RED |
| AC #6 | URL does not change; deep-link renders ContactManager | E2E | `e2e/tests/clientes/cliente-contactos-asociados.spec.ts` | RED |

---

## Test Files Generated

### E2E (Playwright)

- **File**: `e2e/tests/clientes/cliente-contactos-asociados.spec.ts`
- **Tests**: 11 tests
- **ACs covered**: AC #1, #2, #3, #4, #5, #6
- **Pattern**: Network-first route interception (intercept BEFORE navigate)
- **Expected RED failure**: `data-testid="cliente-contactos-seccion"` not present (ContactManager not mounted)

### Component Tests (Vitest + RTL + MSW)

- **File**: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.contactos.test.tsx`
- **Tests**: 12 tests (5 describe blocks)
- **ACs covered**: AC #1, #2, #3, #4, #5
- **Pattern**: Vitest + React Testing Library + MSW v2 node server
- **Expected RED failure**: `[data-testid="cliente-contactos-seccion"]` does not exist in current `ClienteDetailView`

### Unit Tests (Vitest + MSW)

- **File**: `frontend/src/modules/crm/contactos/application/useContactosByCliente.test.ts`
- **Tests**: 12 tests (4 describe blocks)
- **ACs covered**: AC #2 (TanStack Query key), AC #4 (refetch), AC #5 (isLoading)
- **Pattern**: `renderHook` + MSW v2 node server
- **Expected RED failure**: `Cannot find module './useContactosByCliente'`

### API Integration Tests (.NET xUnit)

- **File**: `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactosByClienteIdTests.cs`
- **Tests**: 8 tests (3 TC groups)
- **ACs covered**: AC #1, #2, #3 (backend filter), security (invalid UUID → 400)
- **Pattern**: xUnit + WebApplicationFactory<Program> + EF Core InMemory (per-factory unique DB)
- **Expected RED failure**: `GET /api/v1/contactos` does not accept `?clienteId` param yet → returns unfiltered list or 400

---

## Test ID Summary

| Test ID | Level | AC | Description |
|---------|-------|----|-------------|
| TC-E4-1-01 | E2E | #1 | ContactManager section visible with contacts |
| TC-E4-1-02 | E2E | #1 | Contact list shows contact row with correct name |
| TC-E4-1-03 | E2E | #2 | contactos request fires with clienteId param |
| TC-E4-1-04 | E2E | #3 | Empty-state "Sin contactos asociados" shown |
| TC-E4-1-05 | E2E | #3 | Contact list NOT shown on empty state |
| TC-E4-1-06 | E2E | #4 | Error state + "Reintentar" button on 500 |
| TC-E4-1-07 | E2E | #4 | Reintentar triggers second fetch |
| TC-E4-1-08 | E2E | #5 | Skeleton visible during in-flight fetch |
| TC-E4-1-09 | E2E | #5 | No spinner (skeleton only — company standard) |
| TC-E4-1-10 | E2E | #6 | URL unchanged after load (no redirect) |
| TC-E4-1-11 | E2E | #6 | Deep-link renders ContactManager section |
| TC-C4-1-01 | Component | #1 | cliente-contactos-seccion visible with contacts |
| TC-C4-1-02 | Component | #1 | contactos-lista visible with contact name |
| TC-C4-1-03 | Component | #1 | "Contactos" heading present |
| TC-C4-1-04 | Component | #3 | Empty-state "Sin contactos asociados" |
| TC-C4-1-05 | Component | #3 | contactos-lista absent on empty state |
| TC-C4-1-06 | Component | #5 | contactos-skeleton visible during loading |
| TC-C4-1-07 | Component | #5 | No spinner (progressbar role absent) |
| TC-C4-1-08 | Component | #4 | contactos-error-state visible on 500 |
| TC-C4-1-09 | Component | #4 | "Reintentar" button visible on error |
| TC-C4-1-10 | Component | #4 | Raw error not exposed in UI |
| TC-C4-1-11 | Component | #4 | Reintentar triggers new fetch |
| TC-C4-1-12 | Component | #5 | Accessibility: no critical axe violations (ContactManager section heading) |
| TC-U4-1-01 | Unit | — | Query disabled when clienteId undefined |
| TC-U4-1-02 | Unit | — | Query disabled when clienteId null |
| TC-U4-1-03 | Unit | — | Query disabled when clienteId empty string |
| TC-U4-1-04 | Unit | #2 | Returns 2 contacts for valid clienteId |
| TC-U4-1-05 | Unit | #2 | Uses GET /api/v1/contactos?clienteId= URL |
| TC-U4-1-06 | Unit | #2 | TanStack Query cache deduplication via key |
| TC-U4-1-07 | Unit | #3 | Returns empty array on 200 with [] |
| TC-U4-1-08 | Unit | #3 | isSuccess true on empty array |
| TC-U4-1-09 | Unit | #4 | isError true on 500 |
| TC-U4-1-10 | Unit | #4 | isError true on 503 |
| TC-U4-1-11 | Unit | #4 | refetch is callable function |
| TC-U4-1-12 | Unit | #5 | isLoading true during in-flight fetch |
| TC-API4-1-01 | API | #1, #2 | Filter by clienteId returns only that client's contacts |
| TC-API4-1-02 | API | #1 | Content-Type application/json |
| TC-API4-1-03 | API | #1, #2 | DTO shape: all required fields present |
| TC-API4-1-04 | API | #3 | Empty array for unknown clienteId |
| TC-API4-1-05 | API | #3 | Empty array when other client has contacts |
| TC-API4-1-06 | API | security | 400 Bad Request for non-UUID clienteId |
| TC-API4-1-07 | API | security | 400 with Problem Details for invalid format |
| TC-API4-1-08 | API | security | 400 for SQL injection attempt |
| TC-API4-1-09 | API | security | Not 500 for empty clienteId param |

---

## RED Phase Expected Failures

All tests are expected to FAIL in the current state because:

1. **`useContactosByCliente.ts`** does not exist → `Cannot find module './useContactosByCliente'`
2. **`ClienteDetailView.tsx`** does not render the ContactManager section → `data-testid` not found
3. **`GET /api/v1/contactos`** does not accept `?clienteId` filter → returns unfiltered list or ignores param
4. **E2E**: `data-testid="cliente-contactos-seccion"` absent from rendered page

## GREEN Phase Target

Tests will pass GREEN when:
- Task 1: `useContactosByCliente.ts` created with `useQuery(['contactos', { clienteId }])`
- Task 2: `contactoApiRepository.getByClienteId(clienteId)` implemented
- Task 3: `ClienteContactServiceAdapter` implements `IContactServiceAdapter`
- Task 4: `ClienteDetailView.tsx` mounts `ContactManager` in right panel
- Task 5: Backend `GetContactosQuery` + handler + endpoint updated with `clienteId` filter
