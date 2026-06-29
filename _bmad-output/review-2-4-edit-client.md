---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-4-edit-client.md
story_key: 2-4-edit-client
---

# Code Review: 2-4-edit-client

- **Date**: 2026-06-29
- **Reviewer**: SiesaTeam (AI Agent — Adversarial Senior Developer)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes** (in git but not in Story File List):
  - `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs` — modified (NitAlreadyExistsException added to this file from the Commands namespace)
  - `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — present in commit diff
  - `backend/src/SiesaAgents.Application/Clientes/Queries/GetClientesQueryHandler.cs` — present in commit diff

- **Missing Files** (in Story File List but not changed in git): None critical — all declared files are present in the commit.

- **Uncommitted changes**: `package.json` and `package-lock.json` untracked (not part of implementation, low concern).

---

## Review Plan

### Items to Verify

- [x] AC1: Edit form opens pre-filled with Nombre, NIT/RUC, Teléfono, Ciudad → `ClienteForm.tsx` mode/cliente props + defaultValues
- [x] AC2: Changes reflected in list and detail immediately, success toast → `useUpdateCliente.ts` invalidateQueries + form toast
- [x] AC3: Clearing required field shows inline error, form not submitted → Zod schema + RHF validation
- [x] AC4: Cancel without saving keeps original data, no PUT triggered → Cancel button calls onCancel() without submit
- [x] AC5: invalidateQueries(['clientes']) and (['clientes', id]) on PUT onSuccess → `useUpdateCliente.ts` lines 12-13
- [x] Task 1: useUpdateCliente hook implemented → file present, useMutation pattern correct
- [x] Task 2: update() method in clienteApiRepository → implemented as PUT via apiClient
- [x] Task 3: ClienteForm supports edit mode with mode/cliente props → implemented
- [x] Task 4: ClienteDetailView has Editar button + isEditFormOpen state → implemented
- [x] Task 5: PUT /api/v1/clientes/{id} endpoint → implemented with handler, validator, 200/400/404 responses
- [x] Task 6: Tests — frontend ATDD + component + backend integration → all present

### Focus Areas
- Type safety: `Cliente.ts` domain type vs backend `ClienteDto` contract
- Double-fire issue: `onSuccess` bound at hook level AND used in mutate callback
- Heroicons usage: `PencilIcon` vs inline SVG
- NIT uniqueness on update: domain business rule
- CancellationToken: async best practices

---

## Review Findings

### Critical Issues (Must Fix)

None critical blocking ACs.

### High Issues

#### [HIGH-1] `Cliente` domain type is missing `updatedAt` field

**File**: `frontend/src/modules/crm/clientes/domain/Cliente.ts`

The backend `ClienteDto` now returns `updatedAt: DateTimeOffset` (added in this story), but the frontend `Cliente` interface only declares:
```typescript
export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
}
```
`updatedAt` is missing. Tests work around this with spread (`{ ...EXISTING_CLIENTE, updatedAt: '...' }`), but in production TypeScript code `cliente.updatedAt` would be `undefined` at the type level. This is a type-contract mismatch with the backend and violates strict TypeScript.

**Impact**: Strict TypeScript compilation warning/error if any component ever references `updatedAt`, and potential future runtime bugs.
**Fix**: Add `updatedAt: string` to the `Cliente` interface.

### Medium Issues

#### [MED-1] `PencilIcon` from Heroicons is NOT used — inline SVG used instead

**File**: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` (lines 85-97)

The story specification (Task 4 and Dev Notes) explicitly states: "Add 'Editar' button (Heroicon `PencilIcon` + label)". The project already imports `PencilIcon` from `@heroicons/react/24/outline` in `ClienteListView.tsx`. However `ClienteDetailView.tsx` uses a raw inline SVG path instead of the library component.

**Impact**: Inconsistency with project icon system, technical debt — the inline SVG shape doesn't match Heroicons' official PencilSquareIcon path accurately.
**Fix**: Replace inline SVG with `import { PencilSquareIcon } from '@heroicons/react/24/outline'` and use `<PencilSquareIcon className="w-4 h-4" aria-hidden="true" />`.

#### [MED-2] NIT uniqueness not validated on update — DB-level constraint leak risk

**File**: `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`

The `UpdateClienteCommandHandler` does NOT check if the new NIT conflicts with another existing client. The `CreateClienteCommandHandler` explicitly calls `repository.GetByNitAsync(command.Nit)` before creating. On update, if a user changes a client's NIT to one already used by another client, the handler will call `entity.Update()` and then `repository.UpdateAsync()` + `SaveChangesAsync()`, which will throw a `DbUpdateException` from PostgreSQL's unique constraint. The `ExceptionHandlingMiddleware` does catch `DbUpdateException` for unique violations and returns 409, but this means the NIT uniqueness check on update relies entirely on the DB constraint rather than an application-level domain rule. This is a missing domain validation that should be consistent with the Create pattern.

**Note**: The middleware does handle this (returns 409), so it won't cause a 500 in production — but it's inconsistent with the DDD pattern established for Create.

#### [MED-3] Edit button `Editar` missing `aria-label` — WCAG 2.1 AA

**File**: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` (line 79-99)

The Editar button has text "Editar" as a text node which is accessible to screen readers. However, the button has no `aria-label` that includes context about which client is being edited. The company standard requires WCAG 2.1 AA compliance. For a split-panel view with multiple possible clients, a screen reader user clicking "Editar" would not know which client this button refers to.
**Fix**: Add `aria-label={`Editar cliente ${data.nombre}`}` to the button.

### Low Issues

#### [LOW-1] `onSuccess` bound at hook-level AND toast in mutate callback — potential ordering confusion

**File**: `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx` (lines 30-47)

The component calls `useUpdateCliente({ onSuccess })` which binds the `onSuccess` prop at hook instantiation time. Then on line 37-47, `updateMutation.mutate(...)` is called with a per-call `onSuccess` callback that shows the toast. In TanStack Query v5, BOTH `onSuccess` handlers fire sequentially (hook-level first, then per-call). The current behavior is correct: the form's `onSuccess` prop (close dialog) fires, then the toast fires.

However, this is potentially confusing: if `setIsEditFormOpen(false)` fires before the toast, the toast may render in a detached/unmounted component tree. This is not currently a bug with `siesa-ui-kit`'s ToastProvider wrapping, but it creates a subtle ordering dependency.

The `useCreateCliente` hook does NOT include a similar pattern — its hook-level `onSuccess` also calls `options?.onSuccess?.()`, and the mutate callback shows the toast. The architecturally cleaner approach is to move toast display to the hook level (like `useCreateCliente` conceptually should do) or to the per-call callback only (not the hook level).

**Recommendation**: Move toast to the hook's `onSuccess` directly and remove the per-call `onSuccess` override, or keep the per-call callback only. The current mixed approach works but is fragile.

#### [LOW-2] Undocumented modifications to `GetClienteByIdQueryHandler.cs` and `GetClientesQueryHandler.cs`

**Files**: `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`, `GetClientesQueryHandler.cs`

These files appear in the git commit diff but are not listed in the Story's File List. Minor documentation gap. These were likely updated to return the new `ClienteDto` with `updatedAt` field.

---

## Auto-Fix Actions

### Fix Applied: HIGH-1 — Added `updatedAt` to `Cliente` domain interface

Updating `frontend/src/modules/crm/clientes/domain/Cliente.ts` to add `updatedAt` field.

### Fix Applied: MED-1 — Replace inline SVG with PencilSquareIcon from Heroicons

Updating `ClienteDetailView.tsx` to import and use `PencilSquareIcon` from `@heroicons/react/24/outline`.

### Fix Applied: MED-3 — Add `aria-label` to Editar button

Updating `ClienteDetailView.tsx` to add `aria-label={`Editar cliente ${data.nombre}`}`.

---

## Fix Outcome

- **Action Taken**: Fixed (3 auto-fixes applied) + Action Items (2 items for manual review)
- **Fixed Count**: 3 (HIGH-1, MED-1, MED-3)
- **Pending Manual**: 2 (MED-2 NIT uniqueness on update, LOW-1 onSuccess ordering)
- **Recommended Status**: `done` — All ACs validated as implemented; remaining issues are enhancements/consistency improvements that don't block functionality.

## Status Sync
- **Story File Status**: Updated to `done`
- **Sprint Status YAML**: Synced — `2-4-edit-client` → `done`
