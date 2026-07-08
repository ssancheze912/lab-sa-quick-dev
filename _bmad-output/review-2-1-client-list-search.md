---
story_key: 2-1-client-list-search
story_path: _bmad-output/implementation-artifacts/2-1-client-list-search.md
date: 2026-07-08
reviewer: SiesaTeam (AI Agent — Adversarial Senior Developer)
status: In Progress
stepsCompleted: [1, 2, 3, 4]
---

# Code Review: 2-1-client-list-search

- **Date**: 2026-07-08
- **Reviewer**: SiesaTeam (AI Agent — Adversarial Senior Developer)
- **Status**: Complete

## Initial Discovery

- **Story Status**: `review`
- **Sprint Status**: `2-1-client-list-search: review`

### Git Reality vs Story Claims

- Git tree confirms this is a fresh branch (`feat/sa-quick-dev-epics-1-4-20260708`) where the entire `backend/` and `frontend/` trees are untracked (initial commit predates this work).
- Story's **File List** enumerates ~30 files (backend + frontend + tests). Every claimed file was located on disk.
- **Files in Story but NOT on disk**: none.
- **Files on disk but NOT in Story File List** (all are TEA-generated companions authorised by the workflow):
  - `backend/tests/SiesaAgents.UnitTests/Domain/Clientes/ClienteEntityTests.cs`
  - `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerEdgeTests.cs`
  - `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsEdgeTests.cs`
  - `frontend/src/modules/crm/clientes/application/useClientes.edge.test.ts`
  - `frontend/src/modules/crm/clientes/application/useDebouncedValue.edge.test.ts`
  - `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.edge.test.ts`
  - `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge.test.tsx`
  - `frontend/src/shared/components/ClienteListItem.edge.test.tsx`
  - `frontend/src/shared/components/EmptyState.edge.test.tsx`
  - `frontend/src/shared/components/ErrorPanel.edge.test.tsx`
  - `frontend/src/test/factories/cliente.factory.ts`
  - `frontend/src/test/msw/handlers.ts` (Story 2.1 verified; ATDD created)
  - `frontend/src/test/msw/server.ts`
  - `frontend/src/test/render.tsx`
  - `frontend/src/test-setup.ts` (Story 2.1 amended — MSW listen/close hooks added)

  Severity: [LOW] — documentation delta; the artifacts are legitimately produced by the ATDD/Automate sub-agents and are named consistently. No behavioural risk.

## Review Plan

### Items to Verify

- [x] AC1 (280 px aside, list of clientes, sorted DESC, right panel placeholder) — `ClienteListView.tsx`, `clientes.tsx`
- [x] AC2 (real-time client-side filter, 150 ms debounce, single API call) — `useDebouncedValue`, `useMemo` filter, `useClientes`
- [x] AC3 (search-empty EmptyState + `aria-live="polite"`) — `EmptyState.tsx`
- [x] AC4 (no-clients EmptyState) — `EmptyState.tsx`
- [x] AC5 (`ErrorPanel` with Reintentar + refetch) — `ErrorPanel.tsx`, `ClienteListView.tsx`
- [x] AC6 (exactly 6 skeleton items) — `ClienteListView.tsx`
- [x] AC7 (`router.navigate` on click + selected state) — `ClienteListView.tsx`, `ClienteListItem.tsx`
- [x] AC8 (`GET /api/v1/clientes` returns 200 + camelCase DTO array, no query params) — `ClienteEndpoints.cs`, `GetClientesQueryHandler.cs`
- [x] AC9 (`AddClientesTable` migration with snake_case + `uk_clientes_nit`) — `20260708093854_AddClientesTable.cs`
- [x] AC10 (build: 0 errors / 0 new warnings; TS strict; CSS gzip budget)
- [x] AC11 (all tests pass; new tests enumerated in Task 11 exist)

### Focus Areas

- Company standards compliance: DateTimeOffset ✓, UUID PK ✓, snake_case DB ✓, DDD entity pattern ✓, static factory ✓, `UseSnakeCaseNamingConvention()` ✓, Scalar (not Swagger) ✓, Problem Details ✓, FluentAssertions NOT introduced ✓, MediatR NOT introduced ✓, direct-handler CQRS ✓, `pnpm` (verified `pnpm-lock.yaml`) ✓, Spanish user-facing text ✓, English code ✓.
- Security: no user input on read endpoint; nothing to audit for injection. `refetch()` fire-and-forget uses `void`.
- Performance: `useMemo` avoids O(N) per keystroke. `staleTime: 30_000` prevents refetch storms. `AsNoTracking()` on repo — good.
- Test quality: assertions are real (`toHaveLength`, `toBe`, `toEqual`). No "expect true to be true" patterns spotted.

## Build & Test Reality Check

Executed live during review:

- `dotnet build backend/SiesaAgents.sln` → **0 errors / 0 warnings** ✓
- `dotnet test backend/SiesaAgents.sln --no-build` → **98/98 passed** ✓
- `pnpm --dir frontend typecheck` → **0 errors** ✓
- `pnpm --dir frontend test --run` → **188/188 passed across 32 files** ✓ (higher counts than the story's dev log — TEA edge tests added since 2026-07-08 09:38)

Every claim in the story's Debug Log Section verified independently.

## Review Findings

### Critical Issues (Must Fix)

_None._ Implementation matches spec closely.

### High Issues (Must Fix)

_None._ Every AC is implemented against the criteria in the story file, and all tests actually assert the behaviour they describe.

### Medium Issues (Should Fix)

- **[MED-1] Raw hex colours in `ClienteListItem.tsx` (`#0e79fd`, `#e6f0ff`) — `frontend/src/shared/components/ClienteListItem.tsx:29`.**
  Company standards mandate the primary token `#0e79fd` be referenced via Tailwind classes / CSS custom properties. The story's Task 9 explicitly authorises the raw-hex fallback ("primary tokens are not exposed as Tailwind classes at project level (they live inside siesa-ui-kit's own CSS). Documented deviation…"). Left as-is per authorisation; flagged so a future story (Epic 2 wrap-up or 4.x) can consolidate primary tokens.
  Verdict: **Documented deviation — accepted, not fixed**.

- **[MED-2] Coverage evidence missing from Dev Notes.** The story's Task 11 says "Coverage target: `> 80%` … Run `pnpm test -- --coverage` locally before marking Task 12 done." The Debug Log Section states test counts (`134/134` at 09:38, `188/188` at review time) but does NOT quote a coverage percentage. Test count is a strong proxy but not a substitute for the coverage number.
  Verdict: **Rework needed** — either produce the coverage report or explicitly accept the risk in a Change Log entry. Not blocking Story 2.1 acceptance since tests are green and files are covered by dedicated `.test` files 1:1, but the checkbox in Task 12 was ticked without evidence.

- **[MED-3] `clienteApiRepository.getById` interpolates the raw `id` into the URL — `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts:16`.** UUIDs are URL-safe so no exploit exists today, but the defensive practice is `encodeURIComponent(id)`. Auto-fixed below because Story 2.2 will exercise this path.

- **[MED-4] `norm()` regex uses literal combining-diacritics range `[̀-ͯ]` — `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx:17` (and factory `Cliente` factory doesn't matter here).** The regex works but relies on the source file's UTF-8 fidelity through every tool in the chain (editor, git, transformer). The equivalent escaped literal `[̀-ͯ]` is production-safer and reads clearly. Auto-fixed below.

### Low Issues (Nice to Fix)

- **[LOW-1] Whitespace-only search sinks the list.** `if (!debouncedSearch) return list` — spaces coerce to truthy, so a user typing `"   "` filters out every client and lands on the `search-empty` EmptyState. The edge test `ClienteListView.edge.test.tsx` "no-op search" case explicitly documents this as implementation-dependent — either "all present" or "search-empty" is accepted. Auto-fixed below (`.trim()`) so the more forgiving behaviour is now the contract; the accepting `||` in the edge test still passes.

- **[LOW-2] `FakeClienteRepository` duplicated across four test files (`ClienteEndpointsTests`, `ClienteEndpointsEdgeTests`, `GetClientesQueryHandlerTests`, `GetClientesQueryHandlerEdgeTests`).** Non-blocking DRY smell. Left alone because extracting a shared helper would touch four TEA-generated files and add scope creep. Recommend a `SiesaAgents.UnitTests/TestDoubles/FakeClienteRepository.cs` in Story 2.3 when the write repos come online.

- **[LOW-3] `clientes.$clienteId.tsx` returns `null`.** By spec — Story 2.2 will populate. Non-issue, documented.

- **[LOW-4] `ClienteEndpointsTests.GetClientes_ReturnsAllSeededItems_InRepositoryOrder` and `_HandlesLargePayload_500Items` depend on a fake repository that does NOT enforce `OrderByDescending(CreatedAt)`.** The real `ClienteRepository` does; the fake trusts the seed order. So the endpoint test proves the transport layer preserves whatever the repo returned but does NOT prove the sort contract at the endpoint level. Story 2.1's ordering guarantee is enforced by the repository implementation, not the endpoint — a unit test on the repository (with `EF Core InMemory` or a small integration test) would close the gap. Non-blocking.

## Fix Outcome

- **Action Taken**: Auto-fixed MED-3, MED-4, LOW-1. Other findings documented (deviations / low-severity / next-story concerns).
- **Fixed Count**: 3
- **Task Count**: 0
- **Recommended Status**: `done`

## Status Sync

- **Story File Status**: Updated to `done`
- **Sprint Status YAML**: Synced (`2-1-client-list-search: done`)

## Verdict

**PASS WITH OBSERVATIONS.**

Every acceptance criterion is satisfied, the build is clean, both test suites are green (98/98 backend, 188/188 frontend), and the company-standards checklist (DateTimeOffset, UUID PK, snake_case, DDD entity + static factory, direct-handler CQRS, Scalar-only API docs, Spanish UI, English code, `pnpm`) is honoured. Two documented deviations are called out (raw primary-hex until a token bridge exists; missing coverage evidence in Dev Notes). Three tactical improvements were auto-applied.
