# Code Review: 2-5-delete-client

- **Date**: 2026-07-06
- **Reviewer**: SiesaTeam (AI Agent, sa-code-review sub-agent)
- **Status**: Complete

## Initial Discovery
- **Git repo**: yes. No uncommitted/staged changes (all work already committed across commits `e684576`..`b88610c`).
- **Actual Changed Files** (diff `31686e2..b88610c`, i.e. story 2.4's last commit through story 2.5's last commit): mostly matches the story's Dev Agent Record File List, plus two undocumented files (see below).
- **Undocumented Changes**:
  - `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsDeleteEdgeCasesTests.cs` — new file added by the `testarch-automate` phase (documented in `automation-summary-2-5-delete-client.md`) but missing from the story's File List.
  - `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge-cases.test.tsx` — modified by the `testarch-automate` phase (2 new tests: Escape-close path, DELETE-500-failure path) but missing from the story's File List.
- **Missing Files** (claimed in story but absent in git): none.

## Review Plan
- AC1 (Eliminar button + confirmation dialog): `ClienteDetailView.tsx`, `ClienteDetailView.delete.test.tsx`.
- AC2 (Confirmar → DELETE, cache invalidation, navigation via `onDeleted`, success toast, double-submit guard): `DeleteClienteCommandHandler.cs`, `ClienteEndpoints.cs`, `useDeleteCliente.ts`, `ClienteDetailView.tsx`, `clientes.$clienteId.tsx`, `ClienteDetailView.delete.test.tsx`, `ClienteEndpointsDeleteTests.cs`.
- AC3 (Cancelar/Escape/overlay → no DELETE, record unchanged): `ClienteDetailView.tsx`, `ClienteDetailView.delete.test.tsx`, `ClienteDetailView.edge-cases.test.tsx`.
- AC4 (contacts survive, `clienteId = null`): explicitly out of scope per story's own scope note — verified no `Contacto`-related code was touched anywhere in the diff.
- Focus areas: error-path UX consistency (delete failure feedback vs. sibling create/update flows), architecture/company-standards compliance (UUID PK, Minimal API, no unnecessary result-wrapper types, Clean Architecture folder placement), test quality/coverage, File List accuracy vs. actual git diff.

## Verification Performed
- `dotnet build` (backend, full solution): 0 errors, 0 warnings — confirmed.
- `dotnet test tests/SiesaAgents.UnitTests --filter Clientes`: 80/80 passed — confirmed.
- `npx vitest run src/modules/crm/clientes` (frontend): 10 files / 95 tests passed — confirmed, including after the `onError` fix described below.
- `npx tsc -b` (frontend): clean, no type errors.
- `npx oxlint` on the modified file: clean.
- Read and manually traced: `IClienteRepository.cs`, `ClienteRepository.cs`, `DeleteClienteCommand.cs`, `DeleteClienteCommandHandler.cs`, `ClienteEndpoints.cs`, `Program.cs`, `DeleteClienteCommandHandlerTests.cs`, `ClienteEndpointsDeleteTests.cs`, `ClienteEndpointsDeleteEdgeCasesTests.cs`, `ClienteDetailView.tsx`, `useDeleteCliente.ts`, `IClienteRepository.ts`, `clienteApiRepository.ts`, `clientes.$clienteId.tsx`, `ClienteDetailView.edge-cases.test.tsx`.
- All 3 in-scope ACs (AC1-AC3) verified implemented with matching, real (non-placeholder) test coverage. AC #4's deferral verified respected (no `Contacto`/`contactos` references anywhere in the diff).
- Standards compliance checked against `.claude/agent-memory/sa-quick-dev/company-standards.md`: UUID PKs ✅ (no new entity created, delete-by-id only), Minimal API (no controllers) ✅, `MapScalarApiReference`/no `UseSwagger` unchanged ✅, Clean Architecture + DDD folder placement (Domain/Application/Infrastructure/API layering backend; `modules/crm/clientes/{domain,application,infrastructure,presentation}` frontend) ✅, no unrequested abstraction (`DeleteClienteResult`/generic `ConfirmDialog`) introduced — matches "map requirements directly to components" ✅, Spanish UI copy / English code ✅, siesa-ui-kit `Button` reuse + shared `Dialog` primitives (no new dialog abstraction) ✅.
- Integration tests (Postgres-gated, `RequiresPostgresFact`) not executed in this sandbox (no reachable PostgreSQL instance) — story's own Debug Log and `automation-summary-2-5-delete-client.md` record 66/66 passing including all `DeleteCliente*` suites; not independently re-verified here.

## Review Findings

### Critical Issues (Must Fix)
- None.

### High Issues (Must Fix)
- None. No task marked `[x]` was found to be missing from the code; no in-scope AC is unimplemented.

### Medium Issues (Should Fix)
- **[MED] Silent delete-failure UX gap**: `ClienteDetailView.handleConfirmDelete` caught a failed `DELETE` (500/network error) with an empty `catch { /* comment only */ }` — the dialog stayed open but gave the user **zero feedback** that anything went wrong, no toast, no inline message. This is inconsistent with the sibling `ClienteForm` create/update flows, which both render `'No se pudo guardar. Intenta de nuevo.'` on failure, and with `useDeleteCliente`'s own `toast.success` on the happy path (a mutation that announces success but not failure). The test-automation phase found and deliberately left this open, calling it "a UX/product decision, out of scope for a test-automation pass" (`automation-summary-2-5-delete-client.md`). Code review judged this **in scope for Story 2.5**: AC #2 already governs this exact mutation's user-facing feedback, and leaving a failure silent contradicts both the established sibling pattern and the general principle that a failed user action must be visibly communicated. — **AUTO-FIXED**: added `onError: () => toast.error('No se pudo eliminar el cliente. Intenta de nuevo.')` to `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts` (one line, reuses the `sonner` import already present in the same file for `toast.success`). Verified: 95/95 tests in the `clientes` module still pass (the existing DELETE-500 component test only asserts dialog-stays-open/`onDeleted`-not-called/record-unchanged — it does not assert toast absence, so no test needed updating), `tsc -b` clean, `oxlint` clean.
- **[MED] Undocumented files (File List gap)**: two files created/modified by the `testarch-automate` phase after the dev pass were missing from the story's File List — `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsDeleteEdgeCasesTests.cs` (new, 4 tests) and `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge-cases.test.tsx` (modified, 2 new tests). Same category of finding as Story 2.4's review. — **AUTO-FIXED**: both entries added to the story's File List with a one-line description and cross-reference to `automation-summary-2-5-delete-client.md`.

### Low Issues (Nice to Fix)
- **[LOW] Overlay-click close path has no dedicated test**: AC #3's text says "Cancelar (or closes the dialog via Escape/overlay)". Escape is covered (`ClienteDetailView.edge-cases.test.tsx`) but a distinct overlay-click test was never added. Low risk — Radix's overlay-click and Escape both route through the same `onOpenChange(false)` callback the Escape test already exercises — so no action taken, consistent with the test-quality review's own conclusion (`test-review-2-5-delete-client.md`). Flagged only for awareness, not blocking.
- **[LOW] `ClienteEndpointsTests.cs`/`ClienteEndpointsEdgeCasesTests.cs` remain oversized** (523/447 lines, pre-existing debt from Stories 2.1-2.4, correctly not compounded further by this story since delete tests went into new sibling files). Carried-forward note only, no action needed in this story.

## Task Completion Audit
All Tasks 1-6 checkboxes verified against actual code/tests: backend `IClienteRepository.DeleteAsync` + `ClienteRepository` implementation, `DeleteClienteCommand`/`DeleteClienteCommandHandler`, `DELETE /api/v1/clientes/{id:guid}` endpoint (204/404), DI registration, the fake-repository `DeleteAsync` no-ops in the four extended unit-test files, frontend `delete()` on the repository, `useDeleteCliente` mutation hook, "Eliminar" button + confirmation `Dialog` + `onDeleted` prop in `ClienteDetailView`, `useNavigate()` wiring in `clientes.$clienteId.tsx`, and the full test suite (ATDD + automate + E2E) — all present and passing. No task found marked done with missing code. AC #4's explicit non-implementation is correctly reflected in both code (no `Contacto` references) and tests (no test invents the cascade behavior).

## Fix Outcome
- **Action Taken**: Fixed automatically (both Medium issues — one behavioral/UX fix, one documentation-gap fix).
- **Fixed Count**: 2
- **Task Count**: 0 (no Review Follow-ups items needed — nothing deferred beyond the two already-noted Low/carried-forward items, which are non-blocking)
- **Recommended Status**: done

## Status Sync
- **Story File Status**: Updated `review` → `done`
- **Sprint Status YAML**: Synced (`2-5-delete-client: done`)

## Jira Sync
- Skipped — out of scope for this sub-agent invocation (no Jira sync/commit/push performed; those remain the orchestrator's responsibility if required).

## Repository Sync
- **Commit/Push**: Skipped — not performed by this review (scope limited to review + auto-fix of code/documentation/status per invocation instructions).
