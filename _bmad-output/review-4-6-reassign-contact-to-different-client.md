---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/stories/4-6-reassign-contact-to-different-client.md
story_key: 4-6-reassign-contact-to-different-client
---

# Code Review: 4-6-reassign-contact-to-different-client

- **Date**: 2026-06-07
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: PASS CON OBSERVACIONES

## Initial Discovery

- **Undocumented Changes**: None — all files declared in the story File List are present in git commits.
- **Missing Files**: None — all 8 files from the story File List were found on disk.
- **Extra files found in git** (additions from automate step, not listed in story File List):
  - `frontend/src/modules/crm/contactos/__tests__/useReassignContacto.edge.test.ts` (expected extension file)
  - `frontend/src/modules/crm/contactos/presentation/__tests__/ReassignClienteDialog.edge.test.tsx` (expected extension file)
  - `e2e/tests/asociacion/asociacion-reasignacion-edge.spec.ts` (expected extension file)
  - `e2e/tests/asociacion/asociacion-api-edge-4-6.spec.ts` (expected extension file)

---

## Review Plan

### Items Verified
- [x] AC1: "Reasignar" button opens dialog when contact has an assigned client
- [x] AC2: PUT /api/v1/contactos/{id}/cliente called, 3+1 query keys invalidated, toast shown
- [x] AC3: Contact manager updated in both old and new client detail views
- [x] AC4: Cancel closes dialog without calling mutation
- [x] Task 1: useReassignContacto hook
- [x] Task 2: ReassignClienteDialog component
- [x] Task 3: ContactoDetailPanel updated with Reasignar button
- [x] Task 4: POM updated
- [x] Task 5: Unit tests (4/4 UNIT-AC-06..09)
- [x] Task 6: E2E tests (E2E-AC-20..24)
- [x] Task 7: API integration test API-AC-05
- [x] Architecture compliance: folder structure, DDD layers, TypeScript
- [x] Security: no exposed keys, RBAC not applicable (frontend-only change)
- [x] Accessibility: WCAG 2.1 AA
- [x] Spanish UI text
- [x] Company standards: shadcn/Radix, TailwindCSS, Siesa Blue

---

## Review Findings

### Critical Issues (Must Fix)
None.

### Medium Issues (Should Fix)

**[MED-01] — Story spec uses `shadcn/ui Dialog` but implementation uses `@radix-ui/react-dialog` directly**

- **File**: `frontend/src/modules/crm/contactos/presentation/ReassignClienteDialog.tsx`, line 2
- **Code**: `import * as Dialog from '@radix-ui/react-dialog'`
- **Story Dev Notes**: "Uses shadcn/ui `Dialog` (already available in the project from Story 1.2 — `npx shadcn@latest add dialog`)"
- **Pattern reference**: The story pattern code also shows `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'`
- **Analysis**: The `@/components/ui/dialog` shadcn wrapper does not exist in the project (no `src/components` directory). The pattern in `ContactoFormDialog.tsx` (from earlier stories) also uses `@radix-ui/react-dialog` directly. This is a consistent project-wide pattern that predates this story; the story's dev notes were aspirational. The implementation is consistent with the existing codebase. However, the divergence between story artifact documentation and actual implementation is worth noting.
- **Impact**: LOW — functionally equivalent. The consistent use of Radix directly across the project is intentional (no shadcn component wrappers installed).
- **Recommendation**: Document in story that shadcn wrappers are not installed; `@radix-ui/react-dialog` direct import is the project standard.

**[MED-02] — `pageerror` handler in `asociacion-reasignacion-edge.spec.ts` logged but did NOT throw (inconsistency with main spec)**

- **File**: `e2e/tests/asociacion/asociacion-reasignacion-edge.spec.ts`, line 32–35
- **Problem**: Main spec (`asociacion-reasignacion.spec.ts`) correctly throws on `pageerror` to surface client-side runtime errors as test failures. The edge spec only called `console.error`, meaning browser JS errors would be silently swallowed during edge test runs.
- **Story requirement**: "All tests add `page.on('pageerror', ...)` listener" — implied that the listener should surface errors as test failures.
- **Fix**: AUTO-FIXED — `throw err` added to the handler.

### Low Issues (Nice to Fix / Observations)

**[LOW-01] — `useEffect` reset of `selectedClienteId` on dialog open uses `isOpen` dependency**

- **File**: `frontend/src/modules/crm/contactos/presentation/ReassignClienteDialog.tsx`, lines 38–40
- **Code**: `useEffect(() => { if (isOpen) setSelectedClienteId(null) }, [isOpen])`
- **Observation**: This pattern correctly resets state when the dialog opens. However, the effect also runs when `isOpen` transitions from `true` to `false` (the `if (isOpen)` guard prevents the reset on close). This is correct. Edge test `E2E-46-EDGE-06` explicitly validates this behavior. No code change needed — marking as documentation.

**[LOW-02] — `handleConfirm` calls `onClose()` via `mutate` callback, creating a double-close risk if Radix `onOpenChange` also fires `onClose`**

- **File**: `frontend/src/modules/crm/contactos/presentation/ReassignClienteDialog.tsx`, lines 44–48 and 59–61
- **Analysis**: `handleConfirm` calls `reassignMutation.mutate(selectedClienteId, { onSuccess: () => onClose() })`. Simultaneously, the `onOpenChange` handler at the Dialog.Root level also calls `onClose()` when `open` becomes false (but only if `!reassignMutation.isPending`). After mutation success, `onClose()` fires from the mutation callback, which sets `isReassignOpen=false` in the parent, which triggers `onOpenChange(false)`, but `!reassignMutation.isPending` would now be false momentarily. In practice, TanStack Query transitions `isPending` to false synchronously after `onSuccess` fires, so `onOpenChange` may fire a second `onClose()` call. The parent's `setIsReassignOpen(false)` is idempotent so this causes no visible bug. However, it is a subtle double-invoke scenario that could confuse future maintainers.
- **Risk**: LOW — no functional regression. State is already `false` on the second call.

**[LOW-03] — `UNIT-44-EDGE-02` documents an empty string `clienteId` edge case as a "known limitation" without a `TODO`**

- **File**: `frontend/src/modules/crm/contactos/presentation/__tests__/ContactoDetailPanel.cliente.edge.test.tsx`, lines 145–186
- **Observation**: The test correctly documents that the guard uses `=== null || === undefined` rather than a falsy check. While the backend should never send `""` as `clienteId`, the test comment explicitly identifies this as a limitation with no tracking item. Consider adding a comment linking to a GitHub issue or Story follow-up if this defensive check is ever needed.
- **Impact**: Negligible in current state. Backend contract guarantees `null | uuid`.

---

## Fix Outcome

- **Action Taken**: Auto-fixed 1 issue
- **Fixed Count**: 1 (MED-02 — throw added to pageerror handler in edge spec)
- **Task Count**: 0 pending action items
- **Recommended Status**: done

---

## Status Sync

- **Story File Status**: Remains `done` (no regression found)
- **Sprint Status YAML**: Already `done` — no change needed
