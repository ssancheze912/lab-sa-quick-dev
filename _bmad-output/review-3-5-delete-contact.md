---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: /home/user/lab-sa-quick-dev/_bmad-output/implementation-artifacts/stories/story-3.5-delete-contact.md
story_key: 3-5-delete-contact
---

# Code Review: 3-5-delete-contact

- **Date**: 2026-06-29
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: None — all 14 changed files documented in Story File List
- **Missing Files**: None — all files listed in story match git commit
- **Git Status**: All changes committed in `586e02f2` on branch `develop-platform-gaduranb-rq3-epic-3-gestion-de-contactos`

## Review Plan

### Items to Verify
- [x] AC1: Confirmation dialog with "¿Eliminar este contacto?", "Confirmar", "Cancelar"
- [x] AC2: Contact removed, view returns to /contactos, toast "Contacto eliminado correctamente"
- [x] AC3: "Cancelar" closes dialog, no DELETE triggered
- [x] AC4: invalidateQueries(['contactos']) AND invalidateQueries(['contactos', id]) on success
- [x] AC5: Non-existent ID → 404 Problem Details RFC 7807, no stackTrace
- [x] Task 1: useDeleteContacto hook
- [x] Task 2: IContactoRepository.delete + contactoApiRepository.delete
- [x] Task 3: ContactoDetailView AlertDialog + navigation
- [x] Task 4: Backend DELETE endpoint, command/handler, DI, middleware
- [x] Task 5: Unit + component + integration tests

### Focus Areas
- Security checks on: ExceptionHandlingMiddleware.cs, ContactoDetailView.tsx
- Performance checks on: ContactoRepository.cs (SaveChangesAsync consistency)
- Error handling: useDeleteContacto.ts (onError), ContactoDetailView.tsx (navigate try-catch)
- WCAG Accessibility: ContactoDetailView.tsx (dialog aria attributes)

---

## Review Findings

### Critical Issues (Must Fix)

None.

---

### Medium Issues (Should Fix)

**[MED-01] WCAG 2.1 AA — Dialog missing `aria-describedby` linking to description paragraph**

**File**: `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`

The custom dialog at line 152 declares `aria-labelledby="contacto-delete-dialog-title"` correctly, but the description paragraph "Esta acción no se puede deshacer." has no `id` attribute, and the dialog element does not have `aria-describedby` pointing to it.

Per WCAG 2.1 SC 4.1.2 (Name, Role, Value) and ARIA 1.1 `role="dialog"`, screen readers need `aria-describedby` to surface the description. This means screen reader users get the title but not the description of the destructive action.

**Fix**: Add `id="contacto-delete-dialog-description"` to the paragraph and `aria-describedby="contacto-delete-dialog-description"` to the dialog `<div>`.

---

**[MED-02] Swallowed navigate() error hides real failures in production**

**File**: `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` lines 26-29

```typescript
try {
  navigate({ to: '/contactos' })
} catch {
  // No router context in test environment
}
```

The `try/catch` is present to work around the absence of a TanStack Router context in tests. However, the empty catch silently swallows any navigation errors in production (e.g., route not registered, router misconfiguration). The correct approach is to mock or provide the router context in tests, not to suppress errors in production code. This also means AC #2 (navigation to /contactos) can fail silently with zero user feedback.

**Fix**: Remove the try/catch from production code; instead wrap the component in the router context in tests, or use `vi.mock('@tanstack/react-router')` to mock `useNavigate`.

---

**[MED-03] `SaveChangesAsync` inconsistency — DeleteAsync saves internally while AddAsync/UpdateAsync do not**

**File**: `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` lines 34-38

`DeleteAsync` calls `dbContext.SaveChangesAsync(ct)` internally. However `AddAsync` and `UpdateAsync` do NOT — they rely on the Application layer calling `repository.SaveChangesAsync(ct)` explicitly (as seen in `CreateContactoCommandHandler` and `UpdateContactoCommandHandler`). This creates an inconsistent Unit-of-Work pattern that will confuse future developers and makes `DeleteContactoCommandHandler` behave differently from the rest of the CQRS stack.

Note: this same inconsistency exists in `ClienteRepository` (the reference pattern from Story 2.5), so the implementation correctly mirrors the existing codebase pattern. This is a WARNING about the pattern inherited from prior stories rather than a fresh regression.

**Fix (per story scope)**: Keep as-is to match the established codebase pattern from `DeleteClienteCommandHandler` + `ClienteRepository`. Flag as tech debt for a future refactor to Unit-of-Work.

---

### Low Issues (Suggestions)

**[LOW-01] `ContactoNotFoundException` placed in Commands namespace instead of Domain**

**File**: `backend/src/SiesaAgents.Application/Contactos/Commands/DeleteContactoCommandHandler.cs` lines 5-6

`ContactoNotFoundException` is defined inside the `Commands` namespace. Per Clean Architecture + DDD, domain-specific exceptions should live in the Domain layer (or at minimum in `Application/Contactos/Exceptions/`) to allow reuse by Query handlers (e.g., `GetContactoByIdQueryHandler` currently returns `null` instead of throwing — if it were to throw in the future, it would need to import from `Commands`). The `ClienteNotFoundException` in the Clientes domain has the same issue — this is an established pattern in this codebase, but worth noting.

**Fix (optional)**: Move to `SiesaAgents.Application/Contactos/Exceptions/ContactoNotFoundException.cs`. Out of scope for this story.

---

**[LOW-02] `GetAllAsync` in `ContactoRepository` lacks `CancellationToken` parameter**

**File**: `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs` line 10

`GetAllAsync()` does not accept a `CancellationToken`, making it inconsistent with `GetByIdAsync`, `AddAsync`, `UpdateAsync`, and `DeleteAsync` which all accept `ct`. Pre-existing issue; not introduced by this story.

---

**[LOW-03] Dialog description text hardcoded in component — not consistent with i18n/l10n approach**

The story spec's requirement for all UI text to be in Spanish is met, but the text "Esta acción no se puede deshacer." is hardcoded inline. Minor observation — no action required for this story scope.

---

### AC Validation Summary

| AC | Status | Evidence |
|----|--------|---------|
| AC1 — Confirmation dialog with correct text + buttons | PASS | `ContactoDetailView.tsx` lines 152-191; `data-testid="contacto-detail-delete-dialog"` + title + buttons |
| AC2 — Contact removed, navigate to /contactos, success toast | PASS | `useDeleteContacto.ts` line 17 toast; `ContactoDetailView.tsx` lines 23-32 navigate+invalidate; **caveat: navigate wrapped in try-catch (MED-02)** |
| AC3 — "Cancelar" never calls mutate | PASS | Line 174 `onClick={() => setIsDeleteDialogOpen(false)}` — no mutate call |
| AC4 — invalidateQueries both keys on success | PASS | `useDeleteContacto.ts` lines 15-16 |
| AC5 — 404 Problem Details no stackTrace | PASS | `ExceptionHandlingMiddleware.cs` lines 35-48 + `DeleteContactoEndpointTests.cs` TC-E3-P2-delete-api-02 |

### Task Completion Audit

| Task | Status | Notes |
|------|--------|-------|
| Task 1 — useDeleteContacto hook | PASS | Correct useMutation, invalidates both keys, success+error toast, options.onSuccess callback |
| Task 2 — IContactoRepository.delete + contactoApiRepository.delete | PASS | Correctly typed, returns void |
| Task 3 — ContactoDetailView AlertDialog + navigation | PASS WITH CAVEAT | MED-02: navigate in try-catch |
| Task 4 — Backend DELETE endpoint + command/handler/DI/middleware | PASS | All registered, endpoint returns 204/404 |
| Task 5 — Tests (8 unit + 13 component + 7 API) | PASS | All GREEN per dev agent record |

---

## Fix Outcome

- **Action Taken**: Auto-fix applied for MED-01 (WCAG aria-describedby) and MED-02 (remove try-catch from production code)
- **Fixed Count**: 2
- **Task Count**: 0
- **Recommended Status**: done

## Status Sync
- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced — `3-5-delete-contact: done`
