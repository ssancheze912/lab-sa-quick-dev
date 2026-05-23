---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/stories/3-5-delete-contact.md
story_key: 3-5-delete-contact
---

# Code Review: 3-5-delete-contact

- **Date**: 2026-05-21
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: Complete

## Initial Discovery
- **Undocumented Changes**: None — all files in git match the story's File List.
- **Missing Files**: None — all claimed files are present in the repository.

---

## Review Plan

### Items to Verify
- [x] AC1: Clicking "Eliminar" opens confirmation dialog with "¿Eliminar este contacto?", "Confirmar", "Cancelar"
- [x] AC2: DELETE /api/v1/contactos/:id fires on confirm, contact removed from list (FR27), URL → /contactos, toast shown
- [x] AC3: Cancel closes dialog without firing DELETE; record unchanged

### Focus Areas
- **Security**: ExceptionHandlingMiddleware NFR6 compliance, endpoint validation
- **EF Core**: Entity tracking on delete path
- **TanStack Query**: Cache invalidation, double-callback risk
- **Accessibility**: aria-labelledby / aria-describedby, alertdialog role
- **Testing**: Unit test fake completeness, E2E coverage

---

## Review Findings

### Critical Issues (Must Fix)

- [CRITICAL] **EF Core Untracked Entity on Delete** — `ContactoRepository.DeleteAsync(ContactoEntity entity, CancellationToken ct)` calls `_context.Contactos.Remove(entity)` on an entity fetched with `AsNoTracking()` in `GetByIdAsync`. EF Core will throw `InvalidOperationException: The instance of entity type 'ContactoEntity' cannot be tracked because another instance with the same key value for {'Id'} is already being tracked` (or similar) at runtime. The analogous `ClienteRepository.DeleteAsync(Guid id, ct)` correctly uses `FindAsync` to get a tracked instance. File: `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`.
  **AUTO-FIXED**: `DeleteAsync` now calls `FindAsync([entity.Id], ct)` to get a tracked instance before calling `Remove`.

### Medium Issues (Should Fix)

- [MED] **Endpoint 404 documentation uses generic `Produces` instead of `ProducesProblem`** — The DELETE endpoint uses `.Produces(StatusCodes.Status404NotFound)` which documents the response as empty, not as Problem Details (RFC 7807). The `ClienteEndpoints` DELETE correctly uses `.ProducesProblem(StatusCodes.Status404NotFound)`. This causes incorrect Scalar documentation. File: `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` line 67.
  **AUTO-FIXED**: Changed to `.ProducesProblem(StatusCodes.Status404NotFound)`.

### Low Issues (Suggestions)

- [LOW] **Toast responsibility diverges from reference pattern** — `useDeleteCliente` does NOT fire toast in the hook (toast is fired in the dialog's per-call onSuccess), following the principle that the dialog owns user feedback. `useDeleteContacto` fires toast in the hook's onSuccess instead. Both approaches work correctly without double-firing, but they are inconsistent within the codebase. No functional defect.

- [LOW] **Redundant `isPending` guard in `handleCancel`** — `handleCancel` contains `if (deleteMutation.isPending) return` as an early guard, but the "Cancelar" button is already `disabled={deleteMutation.isPending}`. The guard can never be reached via button click. It only provides a marginal programmatic safety net. Harmless but redundant. File: `frontend/src/modules/crm/contactos/presentation/DeleteContactoDialog.tsx`.

---

## AC Validation

| AC | Status | Evidence |
|----|--------|---------|
| AC1 | PASS | `btn-eliminar` in `ContactoDetailPanel` sets `deleteDialogOpen=true`; `DeleteContactoDialog` renders with `role="alertdialog"`, title "Eliminar contacto", body "¿Eliminar este contacto?", both buttons with correct data-testids. |
| AC2 | PASS (after fix) | `useDeleteContacto` calls `DELETE /api/v1/contactos/${id}`, invalidates `['contactos']` on success, fires success toast; `DeleteContactoCommandHandler` fetches entity by ID (throws `KeyNotFoundException` → 404 via middleware) then deletes. Repository fix applied. |
| AC3 | PASS | `handleCancel` calls `onClose()` without invoking `deleteMutation.mutate()`; `onOpenChange` guard prevents close during pending. E2E-CT-26 covers this with route interception. |

---

## Fix Outcome
- **Action Taken**: Auto-fixed
- **Fixed Count**: 2
- **Task Count**: 0
- **Recommended Status**: done

---

## Status Sync
- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced
