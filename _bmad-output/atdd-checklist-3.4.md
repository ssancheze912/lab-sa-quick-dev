# ATDD Checklist — Story 3.4: Edit Contact

**Story:** 3.4 Edit Contact  
**Status:** RED (tests generated — implementation does not exist yet)  
**Date:** 2026-06-29  
**Branch (worktree):** `develop-platform-gaduranb-rq3-epic-3-gestion-de-contactos`

---

## Coverage Summary

| Layer | File | Tests | Status |
|-------|------|-------|--------|
| Unit (hook) | `application/useUpdateContacto.test.ts` | 10 | RED |
| Component (form) | `presentation/ContactoForm.edit.test.tsx` | 15 | RED |
| E2E (Playwright) | `e2e/tests/contactos/edit-contacto.spec.ts` | 12 | RED |
| API Integration | `Contactos/UpdateContactoEndpointTests.cs` | 8 | RED |
| MSW Handlers | `test/msw/handlers/contactos-update.handlers.ts` | — (helpers) | N/A |

**Total: 45 tests across 4 files**

---

## Acceptance Criteria Traceability

| AC | Description | Test IDs | Level | File |
|----|-------------|----------|-------|------|
| AC-1 | "Editar" opens form pre-filled with all 4 fields (Nombre, Cargo, Teléfono, Email) | TC-E3-P1-07, [P0] pre-fill E2E | Component, E2E | `ContactoForm.edit.test.tsx`, `edit-contacto.spec.ts` |
| AC-2 | Save changes → reflected in detail + list immediately, toast "Contacto actualizado correctamente" | TC-E3-P1-09, TC-E3-P1-18, [P1] PUT success E2E | Component, API, E2E | All three |
| AC-3 | Clear required field + submit → inline error, PUT NOT submitted | TC-E3-P2-02, [P1] validation E2E | Component, E2E | `ContactoForm.edit.test.tsx`, `edit-contacto.spec.ts` |
| AC-4 | "Cancelar" closes form, original data unchanged, no PUT triggered | TC-E3-P1-08, [P0] cancel E2E | Component, E2E | `ContactoForm.edit.test.tsx`, `edit-contacto.spec.ts` |
| AC-5 | onSuccess → invalidateQueries(['contactos']) AND invalidateQueries(['contactos', id]) both called | TC-E3-P2-update-01 (both keys), [P1] re-fetch E2E | Unit, E2E | `useUpdateContacto.test.ts`, `edit-contacto.spec.ts` |
| AC-6 | Backend 400 → error shown without stack trace (NFR6) | TC-E3-update-400, TC-E3-update-400-email, [P1] 400 E2E | API, Component, E2E | `UpdateContactoEndpointTests.cs`, `ContactoForm.edit.test.tsx`, `edit-contacto.spec.ts` |
| AC-7 | Backend 404 → generic error toast, no stack trace (NFR6) | TC-E3-update-404, [P1] 404 E2E | API, E2E | `UpdateContactoEndpointTests.cs`, `edit-contacto.spec.ts` |

---

## Test Cases Detail

### Unit Tests — `useUpdateContacto.test.ts`

| Test ID | Description | AC |
|---------|-------------|-----|
| TC-E3-P2-update-01a | `invalidateQueries(['contactos'])` called on PUT success | AC-5 |
| TC-E3-P2-update-01b | `invalidateQueries(['contactos', id])` called on PUT success | AC-5 |
| (invalidate-no-error) | `invalidateQueries` NOT called when mutation fails | AC-5 |
| TC-E3-P2-update-02 | `isPending` is true while PUT is in flight | AC-2 |
| (isPending-idle) | `isPending` is false before mutation is triggered | AC-2 |
| TC-E3-P2-update-03a | `isError` true when backend returns 404 | AC-7 |
| TC-E3-P2-update-03b | `isError` true when backend returns 400 | AC-6 |
| (onSuccess-called) | `options.onSuccess` called when mutation succeeds | AC-2 |
| (onSuccess-not-called) | `options.onSuccess` NOT called when mutation fails | AC-2 |
| (isError-idle) | `isError` is false before mutation is triggered | — |

### Component Tests — `ContactoForm.edit.test.tsx`

| Test ID | Description | AC |
|---------|-------------|-----|
| TC-E3-P1-07a | All 4 inputs pre-filled with existing contact values | AC-1 |
| TC-E3-P1-07b | Guardar and Cancelar buttons rendered in edit mode | AC-1 |
| TC-E3-P1-08a | `onCancel` called + PUT NOT triggered when "Cancelar" clicked after modifying | AC-4 |
| TC-E3-P1-08b | `onCancel` called without any field modification | AC-4 |
| TC-E3-P1-09a | PUT body contains correct payload with updated cargo | AC-2 |
| TC-E3-P1-09b | Success toast "Contacto actualizado correctamente" shown after PUT 200 | AC-2 |
| TC-E3-P1-09c | `onSuccess` called after PUT 200 | AC-2 |
| (isPending-button) | Guardar button disabled while PUT is in flight | AC-2 |
| TC-E3-P2-02a | Inline error on Nombre field + PUT NOT called when Nombre cleared | AC-3 |
| TC-E3-P2-02b | All 4 inline errors shown when all fields cleared | AC-3 |
| TC-E3-email-edit-invalid-a | Email format error message shown + PUT NOT called | AC-3 |
| TC-E3-email-edit-invalid-b | `contacto-form-error-email` testid shown for invalid email | AC-3 |
| (400-generic-error) | Generic "Error al actualizar el contacto" shown on PUT 400 | AC-6 |
| (400-no-stack-trace) | No stackTrace/innerException/exception shown in UI on PUT 400 | AC-6 |
| (400-no-success) | `onSuccess` NOT called when backend returns 400 | AC-6 |

### E2E Tests — `edit-contacto.spec.ts`

| Test ID | Priority | Description | AC |
|---------|----------|-------------|-----|
| [P0] pre-fill-4-fields | P0 | All 4 inputs pre-filled when "Editar" clicked | AC-1 |
| [P0] form-shown-panel-hidden | P0 | Detail panel hides, edit form shows | AC-1 |
| [P1] toast-success | P1 | Toast "Contacto actualizado correctamente" after PUT 200 | AC-2 |
| [P1] form-closes-on-success | P1 | Edit form closes, detail panel restored after PUT 200 | AC-2 |
| [P1] re-fetch-after-put | P1 | Detail GET called ≥2 times (cache invalidation verified) | AC-5 |
| [P1] validation-blocks-put | P1 | Inline error on Nombre + PUT NOT called when Nombre cleared | AC-3 |
| [P0] cancel-closes-form | P0 | Edit form closes + detail panel shown after "Cancelar" | AC-4 |
| [P1] cancel-no-put | P1 | PUT NOT triggered when "Cancelar" clicked after field modification | AC-4 |
| [P1] 400-no-stack-trace | P1 | Generic error shown, no stackTrace exposed on PUT 400 | AC-6 |
| [P1] 404-generic-toast | P1 | Generic error shown, no stackTrace exposed on PUT 404 | AC-7 |
| [P2] nav-rail-visible | P2 | Navigation rail visible while edit form is open | — |

### API Integration Tests — `UpdateContactoEndpointTests.cs`

| Test ID | Description | AC |
|---------|-------------|-----|
| TC-E3-P1-18 | PUT cargo "Gerente" → 200, dto.cargo="Gerente", updatedAt set, follow-up GET persists | AC-2 |
| (updated-nombre) | PUT updates nombre field correctly | AC-2 |
| (content-type) | PUT 200 response Content-Type is application/json | AC-2 |
| TC-E3-update-404 | PUT to non-existent ID → 404 Problem Details, no stackTrace | AC-7 |
| TC-E3-update-400 | PUT {} empty body → 400 + errors for all 4 fields, no stackTrace | AC-6 |
| (partial-400) | PUT body with only nombre → 400 for missing fields | AC-6 |
| TC-E3-update-400-email | PUT with invalid email format → 400 + email error, no stackTrace | AC-6 |
| (no-domain-email) | PUT with "user@" (no domain) → 400 | AC-6 |

---

## Expected RED Failures

The following symbols/modules do not exist yet and will cause the tests to fail in RED phase:

**Frontend:**
- `useUpdateContacto.ts` — `Cannot find module './useUpdateContacto'`
- `ContactoForm` mode="edit" prop — form does not accept `contacto` or `mode` props yet
- `contactoApiRepository.update(id, data)` — `update` method not implemented
- `IContactoRepository.update()` — method not in interface

**Backend:**
- `PUT /api/v1/contactos/{id}` endpoint — returns 404 or 405 Method Not Allowed
- `UpdateContactoCommand.cs` + `UpdateContactoCommandHandler.cs` — not created
- `UpdateContactoRequestValidator.cs` — not created
- `UpdateContactoRequest.cs` DTO — not created
- `ContactoEntity.Update()` method — not added
- `IContactoRepository.UpdateAsync()` — not in interface
- `ContactoRepository.UpdateAsync()` — not implemented
- `ContactoDto.UpdatedAt` field — may be missing

---

## Quality Gate

- [ ] All tests are in RED state (failing) — confirmed by absence of implementation
- [ ] Tests follow Given-When-Then format
- [ ] Network-first intercepts used in E2E tests
- [ ] Only `data-testid` selectors used in E2E (no CSS/XPath)
- [ ] No hard waits (`page.waitForTimeout`) — only explicit waits (`waitFor`, `toBeVisible`)
- [ ] Both query keys `['contactos']` and `['contactos', id]` tested in unit layer
- [ ] NFR6 verified: no stackTrace/innerException exposed in 400/404 responses
- [ ] All user-facing text in Spanish (toast, error messages, labels)
- [ ] `DateTimeOffset` (not `DateTime`) verified in API integration tests via `updatedAt`

---

## Files Generated

| Path | Type |
|------|------|
| `frontend/src/modules/crm/contactos/application/useUpdateContacto.test.ts` | Unit test (Vitest + MSW) |
| `frontend/src/modules/crm/contactos/presentation/ContactoForm.edit.test.tsx` | Component test (Vitest + RTL + MSW) |
| `frontend/src/test/msw/handlers/contactos-update.handlers.ts` | MSW handler helpers |
| `e2e/tests/contactos/edit-contacto.spec.ts` | E2E test (Playwright) |
| `backend/tests/SiesaAgents.IntegrationTests/Contactos/UpdateContactoEndpointTests.cs` | API integration test (xUnit) |
