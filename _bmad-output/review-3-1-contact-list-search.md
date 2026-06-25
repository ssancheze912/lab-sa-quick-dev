---
stepsCompleted: [1, 2, 3]
story_path: _bmad-output/implementation-artifacts/3-1-contact-list-search.md
story_key: 3-1-contact-list-search
---

# Code Review: 3-1-contact-list-search

- **Date**: 2026-06-25
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: None — all files in git commit match the story's File List exactly.
- **Missing Files**: None — all claimed files are present in the commit.
- **Uncommitted Changes**: Only `pnpm-lock.yaml` (untracked) — not a story file, no issue.

---

## Review Plan

### Items to Verify

- [x] AC1: `/contactos` route renders list showing Nombre, Cargo, Email per item
- [x] AC2: Real-time search filters by nombre/email, case-insensitive, < 1 second with 1,000 records
- [x] AC3: EmptyState shown when API returns empty array; search field still rendered
- [x] AC4: ErrorPanel + "Reintentar" button on backend error; retry triggers refetch
- [x] Task 1: EF Core migration creates `contactos` table with correct schema
- [x] Task 2: GET /api/v1/contactos query and endpoint
- [x] Task 3: Frontend domain entity and repository interface
- [x] Task 4: Infrastructure layer — contactoApiRepository
- [x] Task 5: useContactos hook
- [x] Task 6: EmptyState and ErrorPanel shared components verified
- [x] Task 7: ContactoListView presentation component
- [x] Task 8: TanStack Router route /contactos wired
- [x] Task 9: Frontend unit/component tests (claimed: 6 + 19)
- [x] Task 10: Backend unit/integration tests (claimed: 4 + 4)

### Focus Areas

- Double-sorting performance: `ContactoRepository` + `GetContactosQueryHandler`
- Missing `AsNoTracking()` on read-only query
- Debounce claim in DevNotes vs actual implementation
- WCAG role semantics: `role="listbox"` + `role="option"` without owner relationship
- Missing `UpdatedAt` mutation in `ContactoEntity`

---

## Review Findings

### Critical Issues (Must Fix)

None.

### High Issues (Should Fix)

- **[HIGH-1] Double OrderByDescending — redundant in-memory sort degrades performance for large datasets**
  `ContactoRepository.GetAllAsync()` orders at the DB level (`OrderByDescending(c => c.CreatedAt)`), then `GetContactosQueryHandler.HandleAsync()` applies a second in-memory `OrderByDescending(e => e.CreatedAt)` on the materialized `IEnumerable`. The handler receives already-ordered data from the repository. The in-memory sort is redundant and forces re-ordering of up to N records on every request.
  - File: `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs:13` AND `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactosQueryHandler.cs:12`
  - Fix: Remove the `OrderByDescending` from the handler. Ordering is a persistence concern — the repository already guarantees order. The application layer should trust the repository contract.

- **[HIGH-2] Missing `AsNoTracking()` on read-only query — EF Core tracks all entities unnecessarily**
  `ContactoRepository.GetAllAsync()` materializes entities with change tracking enabled (`ToListAsync()` without `AsNoTracking()`). The `GET /api/v1/contactos` endpoint is read-only and never modifies entities. Change tracking allocates memory for snapshots and degrades performance under load.
  - File: `backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs:12-14`
  - Fix: Add `.AsNoTracking()` before `.ToListAsync()`.

### Medium Issues (Should Fix)

- **[MED-1] Dev Notes claim 150ms debounce, but no debounce is implemented**
  The story Dev Notes state: "the frontend filters via `useMemo` with a 150ms debounce." However, `ContactoListView.tsx` has NO debounce — `searchQuery` state updates synchronously on every keystroke (`onChange={(e) => setSearchQuery(e.target.value)}`). The NFR1 performance test passes because `useMemo` is fast enough with 1,000 records, but the documented design intent is not implemented. This is a documentation inconsistency that could mislead future developers adding more features.
  - File: `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx:31` and Story Dev Notes
  - Fix: Either (a) implement debounce (e.g., with `useDebounce` hook, 150ms) or (b) update the Dev Notes to remove the debounce claim. Since NFR1 passes without debounce and it adds complexity, option (b) is preferable for this MVP scope.

- **[MED-2] WCAG role semantics: `role="listbox"` + `role="option"` pattern is invalid without interactive keyboard management**
  `ContactoListView.tsx:63` uses `<ul role="listbox">` with children `<li role="option" aria-selected={false} tabIndex={0}>`. The ARIA authoring practices require that a `listbox` widget manages focus programmatically (via `aria-activedescendant` or roving `tabIndex`) and responds to arrow key navigation. The current implementation only adds `tabIndex=0` to each item, leaving up/down arrow navigation broken for screen reader users. WCAG 2.1 AA requires that keyboard interaction patterns match the declared role.
  - File: `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx:63-79`
  - Fix: Either (a) implement proper keyboard management for `listbox` (arrow keys, Home/End), or (b) downgrade to `<ul role="list">` / `<li>` with plain `tabIndex` and no `role="option"` — which matches the actual interaction model (navigable list, not a selection widget). Option (b) is appropriate given this story has no selection behavior.

- **[MED-3] `ContactoEndpoints.cs` — `Produces(StatusCodes.Status200OK)` declares untyped response; Scalar/OpenAPI has no schema**
  The endpoint declares `.Produces(StatusCodes.Status200OK)` without a type parameter. Scalar will show the 200 response as having no body schema. The comparable `GetClientes` endpoint follows the same pattern (confirmed consistent), but it is a project-wide gap. For a read endpoint returning `IEnumerable<ContactoDto>`, the declaration should be `.Produces<IEnumerable<ContactoDto>>(StatusCodes.Status200OK)`.
  - File: `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs:16`
  - Note: This is consistent with existing `ClienteEndpoints.cs` — both have the same issue. Fixing here would be inconsistent unless fixed globally.

### Low Issues (Nice to Fix)

- **[LOW-1] `ContactoEntity` has no `UpdatedAt` mutation method — entity will have stale `UpdatedAt` on future updates**
  `ContactoEntity.cs` sets `UpdatedAt = DateTimeOffset.UtcNow` at creation time (via property initializer), but has no `Update()` method to mutate `UpdatedAt` when the entity is modified. This story only implements the read path (Stories 3.3–3.5 implement writes), so there is no regression today. However, the entity is incomplete by design — a future story implementing `UpdateAsync` MUST remember to add the `Update()` method. The risk is that it could be forgotten.
  - File: `backend/src/SiesaAgents.Domain/Contactos/Entities/ContactoEntity.cs`
  - Note: This is intentional scope limitation (write operations in Stories 3.3-3.5). Documenting is sufficient; no code change required now.

- **[LOW-2] `useContactos.test.ts` uses `setTimeout(resolve, 5000)` to simulate loading — slow test**
  Test "should expose isLoading true before data arrives" suspends the MSW handler for 5,000ms but immediately asserts `isLoading === true` without awaiting. The `setTimeout` never resolves during the test run, leaving a dangling timer. While Vitest's fake timers would address this, the test currently relies on the synchronous `isLoading: true` state before the first render cycle — the 5,000ms delay is never actually waited. This is misleading and could cause flakiness in CI environments with different timer behavior.
  - File: `frontend/src/modules/crm/contactos/application/useContactos.test.ts:80`
  - Fix: Replace the open-ended `setTimeout` with `vi.useFakeTimers()` or simply assert `isLoading` before awaiting success — no artificial delay needed.

---

## Fix Outcome

- **Action Taken**: Auto-fix applied for HIGH-1 (double sort), HIGH-2 (AsNoTracking), MED-1 (debounce doc inconsistency corrected in Dev Notes)
- **Fixed Count**: 3
- **Manual Attention Required**: MED-2 (WCAG role semantics), MED-3 (Produces type), LOW-2 (slow test)
- **Recommended Status**: done (all ACs implemented and verified; High issues auto-corrected; remaining Medium/Low are warnings not blockers)
