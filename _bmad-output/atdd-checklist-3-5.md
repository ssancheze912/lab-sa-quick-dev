# ATDD Checklist - Epic 3, Story 3.5: Delete Contact

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** Component + API + E2E

---

## Story Summary

This story implements the delete functionality for the Contacts domain (Epic 3 — Gestión de Contactos). It mirrors the delete pattern established in Story 2.5 (Delete Client) applied to the contactos domain. Deletion is a simple hard-delete (no cascade complexity) that returns 204 No Content and shows a confirmation dialog before executing.

**As a** commercial team member
**I want** to delete a contact record
**So that** the contact list only contains relevant records

---

## Acceptance Criteria

1. **Given** the user is viewing a contact's detail, **When** the user clicks "Eliminar", **Then** a confirmation dialog appears with the message "¿Eliminar este contacto?" and two buttons: "Confirmar" and "Cancelar".

2. **Given** the user clicks "Confirmar" in the confirmation dialog, **When** the deletion is processed via `DELETE /api/v1/contactos/:id`, **Then** the contact is removed from the list immediately without page reload (FR27), **And** the view navigates back to `/contactos`, **And** a toast displays "Contacto eliminado correctamente".

3. **Given** the user clicks "Cancelar" in the confirmation dialog, **When** the dialog closes, **Then** the contact record remains in the system unchanged and no DELETE API call is made.

---

## Failing Tests Created (RED Phase)

### Component Tests (9 tests)

**File:** `frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`

- **Test:** `should show "Eliminar" button in the data-loaded state`
  - **Status:** RED — `ContactoDetailView` does not have `btn-eliminar` yet
  - **Verifies:** AC #1 prerequisite — "Eliminar" button renders in data-loaded state

- **Test:** `TC-E3-3-5-CMP-1: clicking "Eliminar" opens dialog with "¿Eliminar este contacto?" title`
  - **Status:** RED — AlertDialog not wired in `ContactoDetailView`
  - **Verifies:** AC #1 — exact dialog title text in Spanish

- **Test:** `should show "Confirmar" and "Cancelar" buttons in the dialog`
  - **Status:** RED — `btn-confirm-delete` and `btn-cancel-delete` data-testids missing
  - **Verifies:** AC #1 — both dialog buttons present with correct labels

- **Test:** `should NOT show btn-eliminar when contactoId is undefined`
  - **Status:** RED — guard logic not yet in `ContactoDetailView`
  - **Verifies:** "Eliminar" only visible in data-loaded state (not placeholder)

- **Test:** `TC-E3-3-5-CMP-2: clicking "Cancelar" closes dialog and makes no DELETE API call`
  - **Status:** RED — cancel logic not yet implemented
  - **Verifies:** AC #3 — no mutation triggered on cancel

- **Test:** `contact remains in the system after clicking "Cancelar"`
  - **Status:** RED — cancel path not implemented
  - **Verifies:** AC #3 — zero DELETE calls on cancel

- **Test:** `TC-E3-3-5-CMP-3: clicking "Confirmar" calls DELETE API exactly once and calls onContactoDeleted`
  - **Status:** RED — `useDeleteContacto` hook and `onContactoDeleted` prop not yet implemented
  - **Verifies:** AC #2 — mutation executes + navigation callback fires (R-002)

- **Test:** `should close the dialog after confirming deletion`
  - **Status:** RED — dialog close-on-success not implemented
  - **Verifies:** AC #2 — dialog dismisses after successful deletion

- **Test:** `should disable "Confirmar" button while DELETE mutation is pending`
  - **Status:** RED — `disabled={isPending}` not yet on confirm button
  - **Verifies:** Enforcement checklist requirement — prevent double-submit

- **Test:** `TC-E3-3-5-CMP-4: should show toast "Contacto eliminado correctamente" when DELETE returns 204`
  - **Status:** RED — toast call not yet in component `onSuccess`
  - **Verifies:** AC #2, R-010 — exact Spanish toast text

- **Test:** `should show error toast when DELETE fails with 500`
  - **Status:** RED — error handler not yet in component `onError`
  - **Verifies:** AC #2 — graceful error handling

- **Test:** `should NOT call onContactoDeleted when DELETE fails with 500`
  - **Status:** RED — `onContactoDeleted` guard not implemented
  - **Verifies:** Navigation only happens on success, not on error

### API Tests (7 tests)

**File:** `e2e/tests/api/contactos-delete.api.spec.ts`

- **Test:** `TC-E3-3-5-API-1: should return 204 No Content when deleting an existing contact`
  - **Status:** RED — `DELETE /api/v1/contactos/:id` endpoint not yet implemented
  - **Verifies:** AC #2 — 204 No Content is the success status (not 200)

- **Test:** `should remove the deleted contact from GET /api/v1/contactos list response`
  - **Status:** RED — endpoint missing
  - **Verifies:** FR27 — immediate list removal after deletion

- **Test:** `should NOT affect other contacts when one contact is deleted`
  - **Status:** RED — endpoint missing
  - **Verifies:** Deletion is scoped to a single contact (no collateral damage)

- **Test:** `TC-E3-3-5-API-2: should return 404 with Problem Details RFC 7807 for non-existent UUID`
  - **Status:** RED — endpoint missing; when added, must use `Results.Problem(...)` not `Results.NotFound()`
  - **Verifies:** AC #2 error path — Problem Details RFC 7807 compliant 404

- **Test:** `should return content-type application/problem+json for a 404 DELETE response`
  - **Status:** RED — endpoint missing
  - **Verifies:** Content-type header on 404 responses

- **Test:** `should NOT expose stack traces in 404 DELETE response`
  - **Status:** RED — endpoint missing
  - **Verifies:** NFR6 — `ExceptionHandlingMiddleware` blocks stack traces

- **Test:** `should return 404 for a second DELETE call to an already-deleted contact UUID`
  - **Status:** RED — endpoint missing
  - **Verifies:** Idempotency behavior — re-deletion returns 404

### E2E Tests (5 tests)

**File:** `e2e/tests/contactos/contactos-delete.spec.ts`

- **Test:** `should show confirmation dialog when "Eliminar" button is clicked (AC #1)`
  - **Status:** RED — full stack not implemented
  - **Verifies:** AC #1 — dialog title + buttons visible before any API call

- **Test:** `should close dialog and make no DELETE API call when "Cancelar" is clicked (AC #3)`
  - **Status:** RED — full stack not implemented
  - **Verifies:** AC #3 — cancel closes dialog, no mutation

- **Test:** `TC-E3-3-5-E2E-1: should remove contact from left panel and navigate to /contactos after deletion`
  - **Status:** RED — full stack not implemented
  - **Verifies:** AC #2 — full delete journey: toast, list update (FR27), URL navigation

- **Test:** `should show "Eliminar" button only in data-loaded state`
  - **Status:** RED — guard logic not implemented
  - **Verifies:** AC #1 — button visibility gated by data-loaded state

- **Test:** `should keep "Editar" button functional after delete dialog is cancelled`
  - **Status:** RED — full stack not implemented
  - **Verifies:** Regression guard — Story 3.4 "Editar" remains functional after Story 3.5 changes

---

## Data Factories Used

### Contacto Factory

**File:** `frontend/src/modules/crm/contactos/__tests__/contactoFactory.ts` (reused from Story 3.1)

**Exports:**
- `buildContacto(overrides?)` — Create single contacto with optional overrides
- `buildContactoList(count, overridesFn?)` — Create array of contactos
- `resetContactoCounter()` — Reset counter for deterministic IDs in `afterEach`

**E2E Data Helper:**

**File:** `e2e/helpers/data.helper.ts` (reused from Story 3.2)
- `buildContacto(overrides?)` — Seed data for E2E tests

---

## Fixtures Used

**E2E API Helper:**

**File:** `e2e/helpers/api.helper.ts` (reused from Story 3.2)
- `createContacto(data)` — POST to seed contact before tests
- `deleteContacto(id)` — DELETE for cleanup in `afterEach`

**Component Test Pattern:**
- MSW `setupServer()` with per-test `server.use(...)` handlers registered BEFORE render (network-first)
- `QueryClient` with `retry: false, staleTime: 0` for deterministic test behavior
- `Toaster` from `sonner` mounted to capture toast assertions

---

## Mock Requirements

### DELETE /api/v1/contactos/:id Mock

**Endpoint:** `DELETE /api/v1/contactos/:id`

**Success Response:**
```
204 No Content (no body)
```

**Failure Response (not found):**
```json
{
  "title": "Contacto no encontrado",
  "status": 404,
  "detail": "El contacto solicitado no fue encontrado."
}
```

**Notes:** Simple hard-delete — no cascade complexity, no `hadContacts` strategy. Always returns 204 on success. MSW handler: `http.delete('/api/v1/contactos/:id', () => new HttpResponse(null, { status: 204 }))`

---

## Required data-testid Attributes

### ContactoDetailView (data-loaded state only)

- `btn-eliminar` — "Eliminar" trigger button (red border variant), visible ONLY when contact data is loaded
- `btn-confirm-delete` — "Confirmar" action button inside AlertDialog (disabled when `isPending`)
- `btn-cancel-delete` — "Cancelar" button inside AlertDialog (closes dialog without API call)
- `contacto-detail-view` — Root container of `ContactoDetailView` (already exists from Story 3.2)

**Implementation Example:**
```tsx
<button data-testid="btn-eliminar" aria-label="Eliminar contacto">Eliminar</button>

<AlertDialogAction data-testid="btn-confirm-delete" disabled={deleteMutation.isPending}>
  {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
</AlertDialogAction>

<AlertDialogCancel data-testid="btn-cancel-delete">Cancelar</AlertDialogCancel>
```

---

## Implementation Checklist

### Test: TC-E3-3-5-API-1 + TC-E3-3-5-API-2 — Backend DELETE endpoint

**File:** `e2e/tests/api/contactos-delete.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommand.cs` — `public record DeleteContactoCommand(Guid Id)`
- [ ] Create `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommandHandler.cs` — calls `GetByIdAsync`, returns `false` if null, calls `DeleteAsync`, returns `true`
- [ ] Add `Task DeleteAsync(ContactoEntity entity, CancellationToken ct)` to `backend/src/SiesaAgents.Domain/Contactos/Interfaces/IContactoRepository.cs`
- [ ] Add `DeleteAsync` implementation to `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` — `_context.Contactos.Remove(entity); await _context.SaveChangesAsync(ct);`
- [ ] Add `MapDelete("/{id:guid}", ...)` to `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`:
  - `true` → `Results.NoContent()` (204)
  - `false` → `Results.Problem(detail: "El contacto solicitado no fue encontrado.", statusCode: 404, title: "Contacto no encontrado")`
- [ ] Register `DeleteContactoCommandHandler` in `backend/src/SiesaAgents.API/Program.cs` DI
- [ ] Run tests: `npx playwright test e2e/tests/api/contactos-delete.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E3-3-5-CMP-1 — Frontend: "Eliminar" button + AlertDialog

**File:** `frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `useState<boolean>` `isDeleteDialogOpen` to `ContactoDetailView`
- [ ] Add `"Eliminar"` button with `data-testid="btn-eliminar"` and `aria-label="Eliminar contacto"` — visible only in data-loaded state
- [ ] Render `AlertDialog` from `@/components/ui/alert-dialog` when `isDeleteDialogOpen === true`
- [ ] Add `AlertDialogTitle` with text `"¿Eliminar este contacto?"`
- [ ] Add `AlertDialogCancel` with `data-testid="btn-cancel-delete"` and text `"Cancelar"`
- [ ] Add `AlertDialogAction` with `data-testid="btn-confirm-delete"` and text `"Confirmar"` / `"Eliminando..."`
- [ ] Run test: `npx vitest run frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: TC-E3-3-5-CMP-2 — Frontend: Cancel closes dialog, no DELETE

**File:** `frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`

**Tasks to make this test pass:**

- [ ] Wire `AlertDialogCancel` to close dialog via `onOpenChange` on `AlertDialog` (or `setIsDeleteDialogOpen(false)`)
- [ ] Ensure clicking "Cancelar" does NOT call any mutation
- [ ] Run test: `npx vitest run frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E3-3-5-CMP-3 — Frontend: useDeleteContacto hook + mutation wiring

**File:** `frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `frontend/src/modules/crm/contactos/application/useDeleteContacto.ts` — TanStack Query `useMutation`:
  - `mutationFn: (id: string) => contactoApiRepository.delete(id)`
  - `onSuccess: (_result, id) => { queryClient.invalidateQueries({ queryKey: ['contactos'] }); queryClient.removeQueries({ queryKey: ['contactos', id] }); }`
- [ ] Add `delete(id: string): Promise<void>` to `frontend/src/modules/crm/contactos/domain/IContactoRepository.ts`
- [ ] Add `delete` implementation to `frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts` — `DELETE /api/v1/contactos/${id}` via `apiClient`
- [ ] Add `onContactoDeleted?: () => void` prop to `ContactoDetailView`
- [ ] Wire `handleConfirmDelete` in `ContactoDetailView`:
  - `deleteMutation.mutate(contacto.id, { onSuccess, onError })`
  - `onSuccess`: calls `onContactoDeleted?.()`
  - Add `data-testid attributes: btn-confirm-delete, btn-cancel-delete`
- [ ] Run test: `npx vitest run frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: TC-E3-3-5-CMP-4 — Frontend: Toast "Contacto eliminado correctamente"

**File:** `frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `toast.success('Contacto eliminado correctamente')` in component `onSuccess` inside `handleConfirmDelete` (NOT inside the hook)
- [ ] Add `toast.error('No se pudo eliminar el contacto. Intenta de nuevo.')` in component `onError`
- [ ] Run test: `npx vitest run frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: TC-E3-3-5-E2E-1 — Full delete journey (E2E)

**File:** `e2e/tests/contactos/contactos-delete.spec.ts`

**Tasks to make this test pass:**

- [ ] All backend tasks from TC-E3-3-5-API-1 complete
- [ ] All frontend tasks from TC-E3-3-5-CMP-1 through TC-E3-3-5-CMP-4 complete
- [ ] Wire `onContactoDeleted` prop in `frontend/src/routes/_app/contactos.$contactoId.tsx`:
  - `const navigate = useNavigate();`
  - `<ContactoDetailView contactoId={contactoId} onContactoDeleted={() => navigate({ to: '/contactos' })} />`
- [ ] Add `data-testid="contacto-list-item"` to items in `ContactoListView` (verify from Story 3.1)
- [ ] Run test: `npx playwright test e2e/tests/contactos/contactos-delete.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all component tests for this story
npx vitest run frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx

# Run API tests
npx playwright test e2e/tests/api/contactos-delete.api.spec.ts

# Run E2E tests
npx playwright test e2e/tests/contactos/contactos-delete.spec.ts

# Run all contactos tests (full suite)
npx vitest run frontend/src/modules/crm/contactos

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --headed

# Debug specific E2E test
npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --debug

# Run tests with UI
npx playwright test e2e/tests/contactos/contactos-delete.spec.ts --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (21 tests across 3 levels)
- ✅ Network-first intercept pattern applied in all component and E2E tests
- ✅ MSW handlers registered BEFORE render in all component tests
- ✅ Mock requirements documented (DELETE 204 + 404 Problem Details)
- ✅ data-testid requirements listed with implementation examples
- ✅ Implementation checklist created with clear tasks per test

**Verification:**

- All component tests fail with `Cannot find module '../presentation/ContactoDetailView'` error OR missing `btn-eliminar` data-testid
- All API tests fail with `404` (endpoint not found) on `DELETE /api/v1/contactos/:id`
- All E2E tests fail — "Eliminar" button not found in detail view
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with backend API tests)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend: `DeleteContactoCommand` → `DeleteContactoCommandHandler` → `IContactoRepository.DeleteAsync` → `ContactoEndpoints` → `Program.cs` DI
2. Frontend: `contactoApiRepository.delete` → `IContactoRepository.delete` → `useDeleteContacto`
3. Frontend UI: `ContactoDetailView` — `btn-eliminar` + `AlertDialog` + `handleConfirmDelete` + toast
4. Routing: `contactos.$contactoId.tsx` — wire `onContactoDeleted → navigate('/contactos')`

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor

**Completion:**

- All 21 tests pass
- Code quality meets team standards
- No regressions in Stories 3.3 / 3.4 (ContactoForm, useCreateContacto, useUpdateContacto unchanged)
- Ready for code review

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow
2. **Run failing tests** to confirm RED phase: `npx vitest run frontend/src/modules/crm/contactos/__tests__/DeleteContacto.test.tsx`
3. **Begin implementation** using implementation checklist as guide — start with backend
4. **Work one test at a time** (red → green for each)
5. **When all tests pass**, refactor code for quality
6. **When refactoring complete**, mark story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **data-factories.md** — Factory patterns with deterministic overrides for test data
- **fixture-architecture.md** — MSW `setupServer()` + QueryClient isolation + `resetContactoCounter()` in `afterEach`
- **test-quality.md** — Given-When-Then, one assertion per test, explicit waits, no hard waits
- **selector-resilience.md** — `data-testid` selectors exclusively (btn-eliminar, btn-confirm-delete, btn-cancel-delete)
- **component-tdd.md** — Component test strategies using Vitest + RTL + MSW

---

**Generated by BMad TEA Agent** — 2026-06-28
