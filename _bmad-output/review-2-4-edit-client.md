---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-4-edit-client.md
story_key: 2-4-edit-client
---

# Code Review: 2-4-edit-client

- **Date**: 2026-06-24
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: Complete

## Initial Discovery

- **Undocumented Changes**: None — all files in git match the story's File List exactly.
- **Missing Files**: None — all 16 claimed files (5 new, 11 modified across frontend and backend) are present and accounted for.
- **Git Branch**: `develop-sa-quick-dev-gaduranb-rq2-epic-02-gestion-de-clientes`

---

## Review Plan

### Items to Verify
- [x] AC1: Form pre-fills all fields with current client data on "Editar" click
- [x] AC2: PUT /api/v1/clientes/{id} called on save, queries invalidated, success toast shown
- [x] AC3: Zod + RHF inline validation prevents backend call on empty required fields
- [x] AC4: Cancel without saving leaves data unchanged, no API call
- [x] AC5: Submit button disabled + "Guardando..." during in-flight mutation
- [x] AC6: 409 Conflict shows "El NIT/RUC ya está registrado" without technical details
- [x] Task 2: update() in IClienteRepository.ts
- [x] Task 3: update() in clienteApiRepository.ts
- [x] Task 4: useUpdateCliente hook
- [x] Task 7: UpdateClienteCommand + UpdateClienteCommandHandler
- [x] Task 9: UpdateClienteRequestValidator (FluentValidation)
- [x] Task 10: UpdateClienteRequest DTO
- [x] Task 11: PUT endpoint registered in ClienteEndpoints.cs
- [x] Task 13: 40 frontend unit tests passing
- [x] Task 14: 7 unit tests + 4 PUT integration tests

### Focus Areas
- **Critical**: EF Core tracking in ClienteRepository.GetByIdAsync (AsNoTracking + update pattern)
- **Security**: Input validation coverage frontend + backend
- **Type Safety**: TypeScript typing on error handler in useUpdateCliente
- **Test Coverage**: Backend unit test for 404 integration test response body validation

---

## Review Findings

### Critical Issues (Must Fix)

**[CRITICAL-1] EF Core `AsNoTracking()` on `GetByIdAsync` breaks update persistence**

File: `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — line 17-21

`GetByIdAsync` fetches the entity with `AsNoTracking()`, which detaches it from the EF Core change tracker. The `UpdateClienteCommandHandler` then calls `entity.Update(...)` and `repository.SaveChangesAsync()`. Because the entity is detached, EF Core does NOT see the mutations — `SaveChangesAsync()` will save 0 rows. The update will silently return the stale (original) data as the "updated" DTO without modifying the database.

This is confirmed by reading both files:
- `ClienteRepository.GetByIdAsync` → `AsNoTracking()` (detached entity returned)
- `UpdateClienteCommandHandler.HandleAsync` → calls `entity.Update(...)` then `repository.SaveChangesAsync()`

The unit tests use an InMemory DB with a plain `ClienteRepository`, which also applies `AsNoTracking()` — so the unit tests themselves are WRONG and would fail or produce incorrect assertions on a real PostgreSQL instance. The integration tests would catch this (EF tracking behaves the same), but they require a running Testcontainers environment.

**Fix required:** Remove `AsNoTracking()` from `GetByIdAsync`, OR add `dbContext.Clientes.Update(entity)` before `SaveChangesAsync` in the handler, OR restructure `GetByIdAsync` to have a tracked vs untracked variant.

---

### Medium Issues (Should Fix)

**[MED-1] `ClienteDetailView`: `ClienteForm` rendered inside `AlertDialog.actions` prop — likely renders in wrong DOM position**

File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — lines 115-137

The `AlertDialog` from siesa-ui-kit accepts `actions` as a ReactNode. The entire `<ClienteForm>` including its submit button and cancel button is passed as `actions`. This places a `<form>` element inside the dialog's action area. While functionally this may work in the mock (confirmed by passing tests), in production the siesa-ui-kit `AlertDialog` may wrap `actions` in a footer `<div>` with flexbox layout, causing the form to render inline in the dialog footer and potentially truncating or overflowing inputs (Nombre, NIT/RUC, Teléfono, Ciudad). The correct approach is to render `<ClienteForm>` as `children` of the dialog body, with only the action buttons in `actions`.

**Fix required:** Render `<ClienteForm>` as `children` of `AlertDialog`, not as `actions`. Move cancel/submit buttons to `actions` prop, OR confirm with siesa-ui-kit docs that this usage is correct.

**[MED-2] `useUpdateCliente.test.ts`: 409 error toast assertion is missing the period**

File: `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts` — line 120

The `useUpdateCliente.ts` hook calls `toast.error('El NIT/RUC ya está registrado')` (without period). However the backend returns `"El NIT/RUC ya está registrado."` (with period). The test verifies `'El NIT/RUC ya está registrado'` (no period) which matches the hook implementation. This is consistent — but the mismatch between the hook's string and the backend error message means any copy/paste scenario (e.g., if the message were passed from the backend error body) would silently diverge. Minor consistency concern; not a functional bug given the frontend ignores the backend body for this case.

**[MED-3] Backend entity `UpdatedAt` is `protected set` on `Entity` base class but `Update()` on `ClienteEntity` assigns it directly — works but violates encapsulation symmetry**

File: `backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs` — line 39

`UpdatedAt = DateTimeOffset.UtcNow;` assigns the base class field directly from the derived class. `UpdatedAt` has `protected set` which allows this, but the `Create()` factory method does NOT set `UpdatedAt` explicitly (relying on the base class default initializer). This means `CreatedAt` and `UpdatedAt` are initialized at object construction time (correct), but then `UpdatedAt` is overwritten in `Update()`. This is architecturally fine, but `CreatedAt` is also `protected set` and could be accidentally mutated by a future developer. The base class Entity should ideally expose `UpdatedAt` as settable only via a `Touch()` domain method. Low-priority design concern, not an active bug.

---

### Low Issues / Suggestions

**[LOW-1] `ClienteDetailView.tsx`: `isEditFormOpen &&` conditional guard means `AlertDialog` is only mounted when open — no animation on close**

File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — line 115

Using `{isEditFormOpen && <AlertDialog ... />}` unmounts the component entirely on close. If siesa-ui-kit `AlertDialog` has a built-in close animation triggered by `isOpen={false}`, it will never play because the component is unmounted before the animation can run. This matches Story 2.3's implementation pattern (acceptable as technical debt unless siesa-ui-kit requires the component to remain mounted).

**[LOW-2] No MSW handler for 404 in `ClienteDetailView.test.tsx` PUT handler; test verifying cancel doesn't call API is weak**

File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` — line 441-460

The "closes the edit form when 'Cancelar' is clicked without making API calls" test only verifies `mockToastSuccess` was not called. It does NOT verify that no PUT request was made to the mock server. A more rigorous assertion would track PUT call count to confirm zero requests were made.

**[LOW-3] `UpdateClienteCommandHandler` does not have a corresponding integration-level isolation — the handler unit test mixes integration (real `ClienteRepository` + InMemory DB) with unit test class**

File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

Tests `HandleAsync_UpdatesEntityAndReturnsUpdatedDto_WhenCommandIsValid` and `HandleAsync_PersistsUpdatedValuesInDatabase` use a real `ClienteRepository` backed by EF InMemory — this is closer to an integration test than a unit test. The `ThrowingUpdateClienteRepository` stub (used for the conflict test) is the correct unit testing pattern. The naming is misleading: these live in `UnitTests` but use the infrastructure layer. Not a functional bug, but a test architecture concern.

---

## Fix Outcome

**[CRITICAL-1] Auto-fix Applied: `GetByIdAsync` AsNoTracking removed for update path**

The most correct fix that preserves the `AsNoTracking` pattern for read-only query handlers while enabling tracking for the update handler is to remove `AsNoTracking()` from `GetByIdAsync`. Query handlers that use `GetByIdAsync` for reads will still work correctly (EF Core tracks the entity but if no mutations occur and no SaveChanges is called, there is no overhead). Alternatively an `UpdateAsync` method with tracking could be added, but that adds unnecessary interface bloat.

- **Fixed Count**: 1 (Critical)
- **Issues Requiring Manual Attention**: 1 Medium (AlertDialog form placement), 2 Low
- **Recommended Status**: in-progress (critical bug requires fix before done)

---

## Status Sync
- **Story File Status**: Remains `review` (bug found — must not advance to done)
- **Sprint Status YAML**: Not updated to done (critical bug blocks promotion)
