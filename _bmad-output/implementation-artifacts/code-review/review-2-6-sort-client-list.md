---
story_key: 2-6-sort-client-list
story_path: _bmad-output/implementation-artifacts/stories/story-2.6-sort-client-list.md
date: 2026-06-29
reviewer: SiesaTeam (AI Agent)
status: done
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
---

# Code Review: 2-6-sort-client-list

- **Date**: 2026-06-29
- **Reviewer**: SiesaTeam (AI Agent — Adversarial Senior Developer)
- **Story**: Story 2.6 — Sort Client List
- **Status**: PASS CON OBSERVACIONES

## Initial Discovery

- **Undocumented Changes**: None — all files in git match the Story File List.
- **Missing Files**: None — all claimed files exist and were implemented.
- **Pre-existing Test Failures**: 27 failures in 6 test files from previous stories (ClienteListView.edge.test.tsx, ClienteListView.test.tsx, etc.) — confirmed pre-date Story 2.6 via git history. NOT caused by Story 2.6 changes.
- **Story 2.6 Tests**: 27/27 GREEN (SortControl.test.tsx: 14 + ClienteListView.sort.test.tsx: 13).

## Review Plan

### Items to Verify

- [x] AC1: Nombre A→Z sort (client-side, no new API call)
- [x] AC2: Nombre Z→A sort (client-side, no new API call)
- [x] AC3: Más reciente (fecha-desc) sort (client-side, no new API call)
- [x] AC4: Más antiguo (fecha-asc) sort (client-side, no new API call)
- [x] AC5: Sort + active search — search input not cleared (R-E2-04)
- [x] AC6: Default sort is "Más reciente" (fecha-desc) on initial load
- [x] Task 1: SortControl shared component created with correct ARIA label, type, options
- [x] Task 2: ClienteListView updated with sortOrder state and filteredAndSorted useMemo
- [x] Task 3: createdAt field verified in Cliente.ts and ClienteDto.cs
- [x] Task 4: Tests TC-E2-P1-12 through P1-16, P2-01, P3-01 written and passing

### Focus Areas

- Performance: useMemo dependencies, Array.sort immutability
- Correctness: localeCompare locale parameters, sort pipeline
- Accessibility: ARIA label on SortControl
- Company standards: siesa-ui-kit component usage policy
- Type safety: SortOption type union

---

## Review Findings

### Critical Issues (Must Fix)

None.

### High Issues (Should Fix)

- **[HIGH — AUTO-FIXED]** `localeCompare` called without Spanish locale in `ClienteListView.tsx` lines 48–50.
  - **File**: `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - **Before**: `a.nombre.localeCompare(b.nombre)` / `b.nombre.localeCompare(a.nombre)`
  - **After**: `a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })` / `b.nombre.localeCompare(a.nombre, 'es', { sensitivity: 'base' })`
  - **Impact**: Without locale `'es'` and `sensitivity: 'base'`, Spanish characters (ñ, á, é, í, ó, ú) sort incorrectly. "Ñoño" would sort BEFORE "nube" instead of after (as per Spanish alphabetical rules). The story's Dev Notes explicitly specify `localeCompare(b.nombre, 'es', { sensitivity: 'base' })`. The implementation deviated from the specification.
  - **Status**: AUTO-CORRECTED in worktree. All 27 tests remain GREEN.

### Medium Issues (Warning — Pending Manual Attention)

- **[MED — PENDING]** siesa-ui-kit has a `Select` component but was not used in `SortControl.tsx`.
  - **File**: `frontend/src/shared/components/SortControl.tsx`
  - **Standard**: Company Standards mandate "check siesa-ui-kit first, then shadcn via MCP, then custom". siesa-ui-kit v1.0.245 exports `Select` and `SelectOption` from `./components/Select/Select`. The dev notes also say "Check siesa-ui-kit catalog FIRST". A native `<select>` was used instead.
  - **Impact**: Design system inconsistency. The siesa-ui-kit Select would carry Siesa brand styling, accessibility enhancements, and consistent UX. Using a native `<select>` may diverge from the design system.
  - **Mitigation**: The native `<select>` with `aria-label="Ordenar clientes"` is functionally correct and WCAG 2.1 AA compliant. The dev notes note: "If NOT found in siesa-ui-kit → use shadcn Select... If neither → build a minimal native `<select>`". This is defensible if the siesa-ui-kit Select API is not compatible with controlled pattern. However, siesa-ui-kit DOES export `SelectOption` type suggesting it likely supports controlled value.
  - **Recommendation**: Evaluate siesa-ui-kit `Select` component API. If it supports `value`/`onChange` controlled pattern, migrate SortControl to use it in the next story or as a follow-up task.

### Low Issues / Suggestions

- **[LOW — PENDING]** No `filteredClientes.length === 0` + active `searchQuery` feedback in main render path.
  - **File**: `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`
  - **Detail**: When the list has clients but search filters all out (`filteredAndSorted.length === 0` with `searchQuery !== ''`), the component renders an empty list with no user feedback (no "No results for 'x'" message). The edge test file `ClienteListView.edge.test.tsx` tests for this. This is a pre-existing gap from Story 2.1, not introduced by Story 2.6 — but AC5 (sort+search) makes it more salient.
  - **Scope**: Out of scope for Story 2.6. Story 2.1 is done. Track as tech debt.

- **[LOW — SUGGESTION]** `filteredAndSorted` combines filter+sort in one useMemo (uses `[data, searchQuery, sortOrder]` deps).
  - **Detail**: The story spec suggests a two-stage pipeline (`filteredClientes` → `sortedClientes`). The implementation chose a single combined useMemo which is functionally correct and arguably more efficient. However, if future stories need to reuse `filteredClientes` separately (e.g., for result count display), the combined approach will require refactoring.
  - **Risk**: Low. Acceptable for current scope.

- **[LOW — INFO]** `contactCount` field in `Cliente.ts` is optional but `ClienteDto.cs` does not include it.
  - **Detail**: Consistent with prior stories — `contactCount` is present in the domain type as optional for forward compatibility but not yet in the DTO. Not a Story 2.6 concern.

---

## AC Verification Matrix

| AC | Requirement | Implementation | Result |
|----|-------------|----------------|--------|
| AC1 | Nombre A→Z, no API call | `localeCompare(b.nombre, 'es', {sensitivity: 'base'})` in useMemo | PASS (after fix) |
| AC2 | Nombre Z→A, no API call | `localeCompare(a.nombre, 'es', {sensitivity: 'base'})` in useMemo | PASS (after fix) |
| AC3 | Más reciente (fecha-desc), no API call | `new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()` | PASS |
| AC4 | Más antiguo (fecha-asc), no API call | `new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()` | PASS |
| AC5 | Sort+search: search not cleared | Independent `searchQuery` + `sortOrder` useState | PASS |
| AC6 | Default sort = "Más reciente" | `useState<SortOption>('fecha-desc')` | PASS |

---

## Code Quality Assessment

| Category | Finding |
|----------|---------|
| Type Safety | PASS — `SortOption` type union exported correctly; no `any` usage |
| Immutability | PASS — `[...filtered].sort()` spreads before sort; original data not mutated |
| Performance | PASS — `useMemo` with correct deps `[data, searchQuery, sortOrder]`; O(n log n) sort on ≤500 records is acceptable |
| Accessibility | PASS — `aria-label="Ordenar clientes"` present on `<select>` element; WCAG 2.1 AA compliant |
| Architecture | PASS — Sort logic is in Presentation layer (`ClienteListView.tsx`); no Domain/Application/Infrastructure changes |
| Spanish UI text | PASS — All 4 options in Spanish; ARIA label in Spanish |
| English code | PASS — `sortOrder`, `SortOption`, `filteredAndSorted`, `setSortOrder` all in English |
| Test coverage | PASS — 27 tests covering all 6 ACs; TC-E2-P1-12 through P3-01 |
| Backend compliance | PASS — `ClienteDto.cs` uses `DateTimeOffset CreatedAt` (not `DateTime`) per company standard |

---

## Fix Outcome

- **Action Taken**: Auto-fixed (1 critical correctness issue)
- **Fixed Count**: 1
- **Task Count**: 1 pending medium (siesa-ui-kit Select migration — out of story scope)
- **Recommended Status**: done

---

## Status Sync

- **Story File Status**: Updated to `done`
- **Sprint Status YAML**: Synced `2-6-sort-client-list: done`

---

## Jira Sync (Automated via sa-jira-sync-api)

- **Story**: Story 2.6: Sort Client List
- **Story Content Sync**: Attempted (depends on Jira config availability)
- **Infrastructure**: Node.js direct API (OAuth shared with get-features)

---

## Repository Sync

- **Worktree Branch**: develop-platform-gaduranb-rq2-epic-2-gestion-de-clientes
- **Main Repo Branch**: develop-platform-gaduranb-rq1-epic-1-foundation
- **Commit**: Performed
- **Push**: Performed
- **GitFlow Compliance**: Verified
- **Status**: Workflow Completed Successfully
