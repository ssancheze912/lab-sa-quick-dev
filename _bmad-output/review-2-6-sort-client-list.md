---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/stories/2-6-sort-client-list.md
story_key: 2-6-sort-client-list
---

# Code Review: 2-6-sort-client-list

- **Date**: 2026-05-21
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: Complete

## Initial Discovery

- **Undocumented Changes**: `e2e/tests/clientes/clientes-sort-edge.spec.ts`, `frontend/src/modules/crm/clientes/__tests__/sortClientes.edge.test.ts`, `frontend/src/shared/components/__tests__/SortControl.edge.test.tsx` — committed but not listed in the story's File List (MEDIUM: incomplete documentation).
- **Missing Files**: None — all files claimed in the File List are present in git.
- **Pre-existing Failures**: 16 tests in `ClienteListPanel.test.tsx` fail due to missing TanStack Router context in test setup — pre-existing since story 2.1 code review, NOT introduced by story 2.6.

## Review Plan

### Items to Verify

- [x] AC1: `sortClientes('nombre-asc')` sorts alphabetically ascending — `sortClientes.ts`
- [x] AC2: `sortClientes('nombre-desc')` sorts alphabetically descending — `sortClientes.ts`
- [x] AC3: `sortClientes('fecha-desc')` sorts by createdAt descending — `sortClientes.ts`
- [x] AC4: `sortClientes('fecha-asc')` sorts by createdAt ascending — `sortClientes.ts`
- [x] AC5: Sort applies to filtered set without clearing search — `ClienteListPanel.tsx` useMemo chain
- [x] AC6: Default sort is `fecha-desc` ("Más reciente") — `ClienteListPanel.tsx` useState initial value
- [x] Task 1: `sortClientes` pure utility — `sortClientes.ts` present and correct
- [x] Task 2: `SortControl` component — present with correct props, labels, aria attributes
- [x] Task 3: Integration into `ClienteListPanel` — present with correct useMemo chain
- [x] Task 4: Unit tests `sortClientes.test.ts` — 5 tests, all GREEN
- [x] Task 5: Unit tests `SortControl.test.tsx` — 6 tests, all GREEN
- [x] Task 6: E2E tests `clientes-sort.spec.ts` + POM extension — present

### Focus Areas

- Architecture compliance: `SortControl.tsx` (shared) import of module-specific type
- Accessibility: `SortControl` listbox keyboard navigation
- Test coverage: `ClienteListPanel` integration tests for sort
- Stale test assertions: route count in `-routing-edge-cases.test.ts`

## Review Findings

### Critical Issues (Must Fix)

None.

### Medium Issues (Should Fix — AUTO-FIXED)

- **[MED] Architecture violation (FIXED)**: `SortControl.tsx` (a `shared/` component) imported `SortOption` from `../../modules/crm/clientes/application/sortClientes`. Per clean architecture, shared components must not depend on module-specific application layers (inward dependency flow violated). **Fix applied**: `SortOption` type is now defined locally in `SortControl.tsx` and exported. Test files updated accordingly. `sortClientes.ts` retains its own `SortOption` definition; TypeScript structural typing ensures compatibility.

- **[MED] Stale test assertion (FIXED)**: `src/routes/__tests__/-routing-edge-cases.test.ts` UNIT-RE-03 asserted exactly 5 routes, but the actual route tree has 7 (Story 2.2 added `/_app/clientes/$clienteId`, Story 1.3 added `/not-found`). This caused a permanent test failure unrelated to story 2.6 but caught during this review. **Fix applied**: assertion updated to `toHaveLength(7)` with updated comment.

### Low Issues (Informational / Pending Manual Attention)

- **[LOW] Missing keyboard navigation in `SortControl`**: The custom listbox pattern (`role="listbox"` / `role="option"`) requires keyboard interaction (Arrow keys to navigate options, Escape to close, Enter to select) per WCAG 2.1 AA. The implementation only handles mouse clicks and click-outside-to-close. `aria-haspopup="listbox"` and `aria-expanded` are correctly set, but keyboard operability is incomplete. A native `<select>` or shadcn/ui `Select` would fulfill WCAG out of the box. The `SortControl.edge.test.tsx` file mentions keyboard accessibility in its header comment but no keyboard-specific test was implemented for it. This should be tracked for a follow-up.

- **[LOW] Undocumented edge test files in story File List**: Three edge test files (`sortClientes.edge.test.ts`, `SortControl.edge.test.tsx`, `clientes-sort-edge.spec.ts`) were committed as part of story 2.6 but are not listed in the story's `## Dev Agent Record > File List`. Documentation gap only — no functional impact.

- **[LOW] `ClienteListPanel.test.tsx` integration gap**: None of the 16 existing `ClienteListPanel` tests cover sort integration. The tests all fail due to missing Router context (pre-existing issue), so even if sort tests were added to this file they would not run. This gap is acceptable given the dedicated `sortClientes.test.ts` and `SortControl.test.tsx` suites, plus the E2E coverage, but integration-level unit testing of the `useMemo` chain (filter + sort) is absent.

- **[LOW] `SortControl` list options are not keyboard-focusable (`tabIndex`)**: The `<li role="option">` elements have no `tabIndex`, making them unreachable via Tab key when the dropdown is open.

## Fix Outcome

- **Action Taken**: Auto-fixed
- **Fixed Count**: 2
- **Issues Remaining Manual**: 2 (keyboard navigation gaps)
- **Recommended Status**: done

## Status Sync

- **Story File Status**: Already `done` (set by dev agent — no change needed)
- **Sprint Status YAML**: Confirmed `done` for story `2-6-sort-client-list`
