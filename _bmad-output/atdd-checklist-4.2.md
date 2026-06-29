# ATDD Checklist — Story 4.2: Associate & Disassociate Contacts from Client

**Story**: 4.2 — Associate & Disassociate Contacts from Client
**Phase**: RED (tests written BEFORE implementation — all expected to fail)
**Date**: 2026-06-29
**Branch (worktree)**: `develop-platform-gaduranb-rq4-epic-4-asociacion-cliente-contacto`
**Workflow**: testarch-atdd

---

## Summary

| Level | File | Tests | Status |
|-------|------|-------|--------|
| Hook (Vitest+MSW) | `useAsociarContacto.test.ts` | 9 | RED |
| Hook (Vitest+MSW) | `useDesasociarContacto.test.ts` | 9 | RED |
| Component (Vitest+RTL+MSW) | `AsociarContactoDialog.test.tsx` | 11 | RED |
| Component (Vitest+RTL+MSW) | `ConfirmarDesasociarDialog.test.tsx` | 10 | RED |
| API Integration (.NET xUnit) | `AssignClienteEndpointTests.cs` | 9 | RED |
| E2E (Playwright) | `asociar-desasociar-contacto.spec.ts` | 11 | RED |
| **TOTAL** | | **59** | **RED** |

---

## Acceptance Criteria Coverage

| AC | Description | Tests Covering |
|----|-------------|---------------|
| AC #1 | Contact selector dialog opens on "Asociar contacto" button | E2E: AC#1 tests (×2), Component: TC-1 |
| AC #2 | PUT /api/v1/contactos/{id}/cliente with { clienteId } called; contact appears in list | Hook: TC-1, TC-2; API: TC-1, TC-6; E2E: AC#2 |
| AC #3 | TanStack Query keys invalidated after association | Hook (asociar): TC-2 (×3 tests) |
| AC #4 | "Desasociar" button → confirmation dialog appears | Component: TC-1, TC-2; E2E: AC#4 (×2) |
| AC #5 | PUT with { clienteId: null }; contact removed from list; contact still accessible | Hook: TC-1, API: TC-2, TC-5, TC-6; E2E: AC#5; Component: TC-3 |
| AC #6 | TanStack Query keys invalidated after disassociation | Hook (desasociar): TC-2 (×3 tests) |
| AC #7 | Loading indicator; buttons disabled during pending mutation | Hook: TC-5; Component: TC-6, TC-5; E2E: AC#7 |
| AC #8 | Error toast in Spanish on failure; no data change | Hook: TC-4; Component: TC-7, TC-6; E2E: AC#8 |
| AC #9 | Empty state "No hay contactos disponibles" in selector | Component: TC-3 (×2); E2E: AC#9 |
| AC #10 | Cancel closes dialogs without API call | Component: TC-5, TC-4; E2E: AC#10 (×2) |

---

## Files Generated

### MSW Handlers (new)

- `frontend/src/test/msw/handlers/contactos-assign-cliente.handlers.ts`
  - `handleAssignClienteSuccess(overrides?)`
  - `handleAssignClienteNotFound()`
  - `handleAssignClienteValidationError()`
  - `handleAssignClienteServerError()`

### Frontend Hook Tests (RED)

- `frontend/src/modules/crm/clientes/application/useAsociarContacto.test.ts`
  - Imports non-existent `./useAsociarContacto`
  - Expected RED failure: "Cannot find module './useAsociarContacto'"

- `frontend/src/modules/crm/clientes/application/useDesasociarContacto.test.ts`
  - Imports non-existent `./useDesasociarContacto`
  - Expected RED failure: "Cannot find module './useDesasociarContacto'"

### Frontend Component Tests (RED)

- `frontend/src/modules/crm/clientes/presentation/AsociarContactoDialog.test.tsx`
  - Imports non-existent `../AsociarContactoDialog`
  - Expected RED failure: "Cannot find module '../AsociarContactoDialog'"

- `frontend/src/modules/crm/clientes/presentation/ConfirmarDesasociarDialog.test.tsx`
  - Imports non-existent `../ConfirmarDesasociarDialog`
  - Expected RED failure: "Cannot find module '../ConfirmarDesasociarDialog'"

### Backend Integration Tests (RED)

- `backend/tests/SiesaAgents.IntegrationTests/Contactos/AssignClienteEndpointTests.cs`
  - Uses `PUT /api/v1/contactos/{id}/cliente` (endpoint not yet registered)
  - Expected RED failure: 404 or 405 response (endpoint missing)

### E2E Tests (RED)

- `e2e/tests/clientes/asociar-desasociar-contacto.spec.ts`
  - Uses `data-testid="asociar-contacto-btn"` (not yet implemented)
  - Uses `data-testid="asociar-contacto-dialog"` (not yet implemented)
  - Uses `data-testid="desasociar-btn-{contactoId}"` (not yet implemented)
  - Uses `data-testid="confirmar-desasociar-dialog"` (not yet implemented)

---

## data-testid Contract (Required by Implementation)

The following `data-testid` attributes MUST be present in the implementation for tests to pass:

| Component | data-testid | Description |
|-----------|------------|-------------|
| `ClienteDetailView` | `asociar-contacto-btn` | "Asociar contacto" action button |
| `AsociarContactoDialog` | `asociar-contacto-dialog` | Dialog root element |
| `AsociarContactoDialog` | `asociar-contacto-empty-state` | Empty state container |
| `AsociarContactoDialog` | `contacto-item-{id}` | Each selectable contact row |
| `ConfirmarDesasociarDialog` | `confirmar-desasociar-dialog` | Dialog root element |
| `ClienteDetailView` (contacts list) | `desasociar-btn-{contactoId}` | Per-contact disassociate button |

---

## API Contract Verified

```
PUT /api/v1/contactos/{id}/cliente
  Body: { "clienteId": "uuid" }    ← Associate
  Body: { "clienteId": null }       ← Disassociate
  Response 200 OK: ContactoDto
  Response 404: Problem Details
  Response 400: Problem Details (invalid Guid.Empty)
```

---

## TanStack Query Keys Verified

```typescript
['contactos']                        // Global invalidation
['contactos', { clienteId: string }] // Per-client invalidation
```

---

## RED Phase Instructions

1. Run tests — **ALL SHOULD FAIL** (RED)
2. Implement the story (Tasks 1–7 from story file)
3. Run tests again — **ALL SHOULD PASS** (GREEN)
4. Refactor if needed — tests must still pass (REFACTOR)

---

## Quality Gate

- [ ] All 59 tests fail in RED phase (before implementation)
- [ ] All 59 tests pass in GREEN phase (after implementation)
- [ ] No tests skipped or marked `.skip`
- [ ] No `hard waits` (only `waitFor` / `expect.poll`)
- [ ] All user-facing text verified in Spanish
- [ ] No CSS selectors — only `data-testid` and semantic roles used
- [ ] Network interceptors set BEFORE navigation in E2E tests
