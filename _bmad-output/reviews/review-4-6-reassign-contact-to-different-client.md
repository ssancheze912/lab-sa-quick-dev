---
stepsCompleted: [1, 2, 3, 4, 5, 6]
story_path: /home/user/lab-sa-quick-dev/_bmad-output/implementation-artifacts/stories/story-4.6-reassign-contact-to-different-client.md
story_key: 4-6-reassign-contact-to-different-client
---

# Code Review: 4-6-reassign-contact-to-different-client

- **Date**: 2026-06-29
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: `frontend/src/test/msw/handlers/contactos-reasignar-cliente.handlers.ts` (canonical handler) not listed in story File List — handler at `modules/test` path is a re-export shim
- **Missing Files**: Story marks all tasks as `[ ]` (unchecked) — tasks were implemented but not marked `[x]`. This is a documentation gap, not a code gap.

## Review Plan

### Items to Verify

- [x] AC1: "Reasignar cliente" button visible when clienteId non-null
- [x] AC2: Dialog selector excludes current client
- [x] AC3: PUT /api/v1/contactos/{id}/cliente called with { clienteId: newClienteId }
- [x] AC4: TanStack Query keys invalidated + success toast
- [x] AC5: New client name appears in ClienteAsociadoSeccion after reassignment
- [x] AC6: Cancel does not trigger API call
- [x] AC7: Confirm button disabled while pending
- [x] AC8: Error toast on failure
- [x] AC9: Backend handler overwrites clienteId unconditionally (verified)
- [x] AC10: Button hidden when clienteId is null
- [x] AC11: Button keyboard-accessible (native button element)

### Focus Areas

- WCAG 2.1 AA: dialog.tsx focus trap, Escape key, aria attributes
- TanStack Query: cache invalidation correctness
- Memory leaks: portal cleanup, ToastProvider nesting
- TypeScript strictness: any types, missing interfaces
- Component filter logic: client exclusion correctness

## Review Findings

### HIGH Issues

- **[HIGH] H1 — WCAG 2.1 AA: No keyboard focus trap in Dialog**
  - File: `frontend/src/shared/components/ui/dialog.tsx`
  - The Dialog component renders via `createPortal` but has no focus trap. Tab navigation escapes the dialog into the hidden `#root` (which has `visibility: hidden` + `aria-hidden="true"`). WCAG 2.1 success criterion 2.1.2 (No Keyboard Trap) requires keyboard focus to remain within the dialog while open.
  - Additionally, the Escape key is not handled — WCAG 2.1 / ARIA Authoring Practices Guide require Escape to close dialogs.
  - AC#11 of the story requires WCAG 2.1 AA compliance.

- **[HIGH] H2 — WCAG 2.1 AA: "Reasignar cliente" button missing aria-label**
  - File: `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` line 77-85
  - The button contains an icon + text "Reasignar cliente" but lacks an `aria-label`. While the text is accessible, there is no `aria-label` for screen readers to disambiguate which contact is being reassigned (unlike the Edit/Delete buttons at lines 207/217 which have `aria-label={Editar contacto ${data.nombre}}`). AC#11 requires WCAG 2.1 AA compliance; company standard mandates accessible labels.

- **[HIGH] H3 — ToastProvider double-nested: memory/rendering issue**
  - `ContactoDetailView.tsx` wraps in `ToastProvider` (line 306) and `ReasignarClienteDialog.tsx` also wraps in `ToastProvider` (line 152). When the dialog is open it nests two ToastProviders. This can cause duplicate toast containers rendered to the DOM, possible duplicate toast notifications, and a DOM memory cost for an additional hidden Toaster root. The `ReasignarClienteDialog` is always rendered inside `ContactoDetailView`'s `ToastProvider` — the inner one is redundant and harmful.

### MEDIUM Issues

- **[MED] M1 — Buggy client exclusion filter logic in ReasignarClienteDialog**
  - File: `frontend/src/modules/crm/contactos/presentation/ReasignarClienteDialog.tsx` lines 33-40
  - The filter uses a `_currentExcluded` mutable variable inside the filter callback to exclude only the FIRST occurrence of `currentClienteId`. If a client list ever contains the same `id` more than once (duplicate data from the API), only the first is excluded. The correct pattern is a direct equality check: `c.id !== currentClienteId`. This is the standard approach and avoids the fragile stateful variable.

- **[MED] M2 — Missing Escape key handler on Dialog backdrop**
  - File: `frontend/src/shared/components/ui/dialog.tsx` line 29-37
  - The Dialog overlay handles click-outside via `onClick` but there is no `onKeyDown` handler for the Escape key. The ARIA Dialog pattern (APG) requires Escape to close the dialog. This is both a WCAG and a UX issue.

- **[MED] M3 — Story tasks not marked as done [x]**
  - File: `story-4.6-reassign-contact-to-different-client.md`
  - All 6 tasks and their subtasks remain `[ ]` (unchecked) despite the implementation being complete. The story's Dev Agent Record should reflect what was actually done.

### LOW Issues

- **[LOW] L1 — Duplicate MSW handler file**
  - Files: `frontend/src/modules/test/msw/handlers/contactos-reasignar-cliente.handlers.ts` (re-export shim) and `frontend/src/test/msw/handlers/contactos-reasignar-cliente.handlers.ts` (canonical).
  - The shim exists to satisfy a relative import path in `useReasignarContacto.test.ts`. This is a path management smell — the test imports from `'../../../test/msw/...'` which resolves to `modules/test/...`, but the real file is at `src/test/...`. The shim works but adds a maintenance burden. Low risk because the shim is correctly a re-export only.

- **[LOW] L2 — focusContent programmatic focus fires on every open (useEffect without dependency)**
  - File: `frontend/src/shared/components/ui/dialog.tsx` line 52-54
  - `useEffect(() => { ref.current?.focus() }, [])` runs once on mount. Since the dialog unmounts when `open=false` (checked in the parent Dialog), this correctly re-focuses on each open. Low severity: no bug, but the intent should be documented.

- **[LOW] L3 — Story File List does not list test files or MSW handlers created**
  - Story's Dev Notes lists only the main implementation files, not tests. Not a blocking issue but inconsistent with the project's documentation standard.

## Fix Outcome

- **Action Taken**: Fixed automatically
- **Fixed Count**: 5 (H1+M2 focus trap + Escape key, H2 aria-label, H3 redundant ToastProvider, M1 filter bug, M3 task status)
- **Task Count**: 0 pending action items
- **Recommended Status**: done

## Status Sync

- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced — 4-6-reassign-contact-to-different-client -> done

## Jira Sync (Automated via sa-jira-sync-api)

- **Story**: Story 4.6: Reassign Contact to Different Client
- **Infrastructure**: Skipped — no Jira config found or story not yet synced to Jira
