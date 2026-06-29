# ATDD Checklist — Story 3.5: Delete Contact

**Phase:** RED (tests generated, failing — implementation does not exist yet)
**Generated:** 2026-06-29
**Story file:** `_bmad-output/implementation-artifacts/stories/story-3.5-delete-contact.md`

---

## Acceptance Criteria Coverage

| AC # | Description | Test IDs | Level | Status |
|------|-------------|----------|-------|--------|
| AC-1 | "Eliminar" button visible; dialog appears with "¿Eliminar este contacto?", "Confirmar", "Cancelar" | TC-E3-P0-delete-01 (E2E AC#1), TC-E3-P0-delete-01 (Component) | E2E + Component | RED |
| AC-2 | Confirming deletion removes contact, navigates to /contactos, toast "Contacto eliminado correctamente" | TC-E3-P0-delete-01 (E2E AC#2), TC-E3-P0-delete-01 (Component), TC-E3-P0-delete-api-01 (API) | E2E + Component + API | RED |
| AC-3 | "Cancelar" closes dialog, no DELETE triggered, contact unchanged | TC-E3-P1-delete-01 (E2E AC#3), TC-E3-P1-delete-01 (Component) | E2E + Component | RED |
| AC-4 | onSuccess calls invalidateQueries(['contactos']) AND invalidateQueries(['contactos', id]) | TC-E3-P2-delete-01 (Unit) | Unit | RED |
| AC-5 | DELETE non-existent ID → 404 Problem Details, no stackTrace (NFR6) | TC-E3-P2-delete-api-02 (API), TC-E3-P1-delete-02 (E2E AC#5) | E2E + API | RED |

---

## Test Cases — Full Inventory

### E2E Tests (Playwright)

**File:** `e2e/tests/contactos/delete-contacto.spec.ts`

| Test ID | Priority | Description | AC |
|---------|----------|-------------|----|
| E2E-AC1-1 | P0 | "Eliminar" button visible in detail panel | AC-1 |
| E2E-AC1-2 | P0 | Dialog opens with "¿Eliminar este contacto?" title | AC-1 |
| E2E-AC1-3 | P0 | Dialog description shows "Esta acción no se puede deshacer." | AC-1 |
| E2E-AC1-4 | P0 | "Confirmar" and "Cancelar" buttons visible in dialog | AC-1 |
| E2E-AC2-1 | P0 | DELETE called with correct contact ID when "Confirmar" clicked | AC-2 |
| E2E-AC2-2 | P0 | Toast "Contacto eliminado correctamente" shown after deletion | AC-2 |
| E2E-AC2-3 | P0 | Navigation to /contactos after successful deletion | AC-2 |
| E2E-AC3-1 | P1 | Dialog closes when "Cancelar" clicked | AC-3 |
| E2E-AC3-2 | P1 | DELETE NOT triggered when "Cancelar" clicked | AC-3 |
| E2E-AC3-3 | P1 | Contact remains in detail panel after "Cancelar" | AC-3 |
| E2E-AC5-1 | P1 | Generic error toast shown when DELETE returns 404 | AC-5 |
| E2E-AC5-2 | P1 | No navigation when DELETE returns 404 | AC-5 |
| E2E-AC5-3 | P2 | No raw error details exposed in UI (NFR6) | AC-5 |

### Component Tests (Vitest + RTL + MSW)

**File:** `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.delete.test.tsx`

| Test ID | Priority | Description | AC |
|---------|----------|-------------|----|
| TC-E3-P0-delete-01-a | P0 | "Eliminar" button visible when contact loaded | AC-1 |
| TC-E3-P0-delete-01-b | P0 | Dialog opens with "¿Eliminar este contacto?" | AC-1 |
| TC-E3-P0-delete-01-c | P0 | "Confirmar" and "Cancelar" buttons in dialog | AC-1 |
| TC-E3-P0-delete-01-d | P0 | DELETE called with correct contact ID | AC-2 |
| TC-E3-P0-delete-01-e | P0 | Toast "Contacto eliminado correctamente" shown | AC-2 |
| TC-E3-P0-delete-01-f | P0 | Dialog description "Esta acción no se puede deshacer." | AC-1 |
| TC-E3-P1-delete-01-a | P1 | Dialog closes when "Cancelar" clicked | AC-3 |
| TC-E3-P1-delete-01-b | P1 | DELETE NOT triggered when "Cancelar" clicked | AC-3 |
| TC-E3-P1-delete-01-c | P1 | Contact record still visible after "Cancelar" | AC-3 |
| TC-E3-P1-delete-02-a | P1 | Generic error toast shown when DELETE returns 404 | AC-5 |
| TC-E3-P1-delete-02-b | P1 | No navigation when DELETE returns 404 | AC-5 |
| TC-E3-P1-delete-02-c | P1 | No stack trace shown in UI (NFR6) | AC-5 |
| isPending-disabled | P1 | "Confirmar" disabled while DELETE in flight | AC-2 |

### Unit Tests (Vitest + TanStack Query)

**File:** `frontend/src/modules/crm/contactos/application/useDeleteContacto.test.ts`

| Test ID | Priority | Description | AC |
|---------|----------|-------------|----|
| TC-E3-P2-delete-01-a | P2 | invalidateQueries(['contactos']) called on onSuccess | AC-4 |
| TC-E3-P2-delete-01-b | P2 | invalidateQueries(['contactos', id]) called on onSuccess | AC-4 |
| TC-E3-P2-delete-01-c | P2 | invalidateQueries NOT called when DELETE fails | AC-4 |
| TC-E3-P2-delete-02-a | P2 | isPending true during in-flight DELETE | AC-2 |
| TC-E3-P2-delete-02-b | P2 | isPending false before mutation triggered | AC-2 |
| TC-E3-P2-delete-03 | P2 | isError true when backend returns 500 | AC-5 |
| onSuccess-callback-a | P2 | options.onSuccess called on mutation success | AC-2 |
| onSuccess-callback-b | P2 | options.onSuccess NOT called on mutation failure | AC-2 |

### API Integration Tests (.NET xUnit + WebApplicationFactory)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Contactos/DeleteContactoEndpointTests.cs`

| Test ID | Priority | Description | AC |
|---------|----------|-------------|----|
| TC-E3-P0-delete-api-01 | P0 | DELETE → 204 No Content + follow-up GET → 404 | AC-2 |
| delete-api-list | P0 | Deleted contact absent from GET list | AC-2 |
| delete-api-idempotent | P1 | Second DELETE → 404 with Problem Details, not 500 | AC-5 |
| TC-E3-P2-delete-api-02 | P2 | DELETE non-existent → 404 Problem Details, no stackTrace | AC-5 |
| delete-api-content-type | P2 | 404 response Content-Type is application/problem+json | AC-5 |
| delete-api-title-detail | P2 | 404 Problem Details has title and detail fields | AC-5 |
| delete-api-method-allowed | P2 | DELETE endpoint registered (not 405) | AC-2 |

---

## MSW Handler File Created

**File:** `frontend/src/test/msw/handlers/contactos-delete.handlers.ts`

Exports:
- `handleDeleteContactoSuccess()` — returns 204 No Content
- `handleDeleteContactoNotFound()` — returns 404 Problem Details
- `handleDeleteContactoServerError()` — returns 500

---

## RED Phase Summary

**Total test cases generated:** 33
- E2E (Playwright): 13 tests
- Component (Vitest + RTL + MSW): 13 tests
- Unit (Vitest + TanStack Query): 8 tests
- API Integration (.NET xUnit): 7 tests

**Expected failures until implementation completes:**
- `useDeleteContacto.ts` does not exist → unit + component tests fail on import
- `ContactoDetailView.tsx` missing `isDeleteDialogOpen` state + AlertDialog → component + E2E tests fail on missing testids
- `DELETE /api/v1/contactos/{id}` endpoint not registered → API tests return 404/405
- `DeleteContactoCommandHandler.cs` not implemented → API tests fail even after endpoint registration
- `IContactoRepository.DeleteAsync` not defined → compilation error in handler

**Traceability:**
- All P0 ACs (AC-1, AC-2) covered by at least 1 E2E + 1 Component + 1 API test
- All P1 ACs (AC-3) covered by at least 1 E2E + 1 Component test
- All P2 ACs (AC-4, AC-5) covered by unit tests + API integration tests
- NFR6 (no stack trace exposure) covered in API and E2E tests

---

## Files Generated

| File | Location | Purpose |
|------|----------|---------|
| `delete-contacto.spec.ts` | `e2e/tests/contactos/` | E2E Playwright tests — AC#1, AC#2, AC#3, AC#5 |
| `ContactoDetailView.delete.test.tsx` | `frontend/src/modules/crm/contactos/presentation/` | Component tests — TC-E3-P0-delete-01, TC-E3-P1-delete-01, TC-E3-P1-delete-02 |
| `useDeleteContacto.test.ts` | `frontend/src/modules/crm/contactos/application/` | Unit tests — TC-E3-P2-delete-01, TC-E3-P2-delete-02, TC-E3-P2-delete-03 |
| `DeleteContactoEndpointTests.cs` | `backend/tests/SiesaAgents.IntegrationTests/Contactos/` | API integration tests — TC-E3-P0-delete-api-01, TC-E3-P2-delete-api-02 |
| `contactos-delete.handlers.ts` | `frontend/src/test/msw/handlers/` | MSW handlers for DELETE /api/v1/contactos/:id |
