---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-3-create-client.md
story_key: 2-3-create-client
---

# Code Review: 2-3-create-client

- **Date**: 2026-06-24
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: Completed

## Initial Discovery

- **Undocumented Changes**: None — all files in git match the story file list.
- **Missing Files**: None — all claimed files are present in git.
- **Git Note**: All files are in uncommitted/untracked state on branch `develop-sa-quick-dev-gaduranb-rq2-epic-02-gestion-de-clientes`.

## Review Plan

### Items Verified

- [x] AC1: "Nuevo cliente" button opens form with all 4 required fields — implemented via `ClienteListView.tsx` + `ClienteForm.tsx`
- [x] AC2: POST /api/v1/clientes on submit, invalidateQueries, success toast — implemented in `useCreateCliente.ts` + endpoint
- [x] AC3: Zod + React Hook Form inline validation, no backend call on invalid — implemented in `clienteSchema.ts` + `ClienteForm.tsx`
- [x] AC4: 409 Conflict detection → "El NIT/RUC ya está registrado" toast — implemented in `useCreateCliente.ts` + `CreateClienteCommandHandler.cs`
- [x] AC5: Submit button disabled + loading indicator during mutation — implemented in `ClienteForm.tsx`
- [x] AC6: Cancel closes form without creating client — implemented in `ClienteListView.tsx` + `ClienteForm.tsx`
- [x] Task 1: Zod schema with all 4 fields + Spanish error messages — verified in `clienteSchema.ts`
- [x] Task 2: IClienteRepository extended with `create()` — verified in `IClienteRepository.ts`
- [x] Task 3: `create()` implementation in `clienteApiRepository.ts` — verified
- [x] Task 4: `useCreateCliente` hook with mutation, invalidation, toast — verified
- [x] Task 5: `ClienteForm` component with all testids, WCAG labels, loading state — verified
- [x] Task 6: `ClienteListView` extended with dialog trigger and form — verified
- [x] Task 7: `CreateClienteCommand` + `CreateClienteCommandHandler` — verified
- [x] Task 8: `CreateClienteRequestValidator` with FluentValidation — verified
- [x] Task 9: `CreateClienteRequest` DTO — verified
- [x] Task 10: POST endpoint — verified
- [x] Task 11: `AddAsync` + `SaveChangesAsync` in repository — verified
- [x] Task 12: `ConflictException` + middleware mapping — verified (pre-existed, no change required)
- [x] Task 13: Frontend unit tests — verified (all 3 test files present)
- [x] Task 14: Backend unit + integration tests — PARTIAL (missing ConflictException unit test — auto-fixed)

### Focus Areas

- Security: FluentValidation on all endpoints, no stack trace exposed on 409 — PASS
- Standards: DateTimeOffset, UUID PKs, EF Core snake_case, Scalar (not Swagger) — PASS
- Architecture: Clean arch layers, DDD entity pattern, CQRS — PASS

---

## Review Findings

### Medium Issues (Should Fix / Fixed)

- **[MED — AUTO-FIXED]** `useCreateCliente.ts`: `onError` typed `error` as `AxiosError` without runtime type guard. TanStack Query's `onError` callback receives `unknown`, and casting to `AxiosError` without `axios.isAxiosError()` narrows unsafely — if any non-Axios error surfaces, `error.response` access would throw at runtime. **Fixed**: changed type to `unknown` and added `axios.isAxiosError(error)` guard before accessing `error.response?.status`.

- **[MED — AUTO-FIXED]** Integration tests (`ClienteEndpointsTests.cs`, `DatabaseConnectivityTests.cs`, `DatabaseConnectivityEdgeCaseTests.cs`): Testcontainer image is `postgres:16-alpine`. Company standards mandate **PostgreSQL 18**. **Fixed in `ClienteEndpointsTests.cs`** (the file added in this story). The other two files (`DatabaseConnectivityTests.cs`, `DatabaseConnectivityEdgeCaseTests.cs`) were not modified in this story — they are pre-existing tech debt outside story scope.

### Low Issues (Should Fix / Fixed)

- **[LOW — AUTO-FIXED]** `CreateClienteCommandHandlerTests.cs`: Task 14 explicitly requires a test verifying "throws ConflictException on duplicate NIT". No such test existed — the EF InMemory provider does not enforce unique constraints so the real path is only exercised by integration tests. Added `HandleAsync_ThrowsConflictException_WhenDbUpdateExceptionContainsUkClientes` using an `IClienteRepository` fake stub (`ThrowingSaveClienteRepository`) that throws a `DbUpdateException` with `"uk_clientes_nit"` in the inner message, validating the handler's `catch` block re-throws as `ConflictException`.

### Informational Notes (No Action Required)

- **`AlertDialog` as form container**: The form is rendered inside the `description` prop of `AlertDialog` from siesa-ui-kit. This is an unconventional usage but the completion notes document it as the only available dialog variant in the kit. Semantically acceptable for now; flagged for replacement when a `Dialog` variant becomes available in siesa-ui-kit.

- **`ClienteEntity.Create()` does not explicitly set `UpdatedAt`**: This is by design — `Entity` base class constructor initializes both `CreatedAt` and `UpdatedAt` to `DateTimeOffset.UtcNow`. Consistent with the existing entity pattern.

- **Pre-existing test failure**: `renders skeleton loader while data is loading (AC#7)` in `ClienteListView.test.tsx` was already failing before this story (synchronous assertion without router settling). Not introduced by this story and documented in completion notes.

---

## Fix Outcome

- **Action Taken**: Fixed automatically
- **Fixed Count**: 3 (AxiosError narrowing, PostgreSQL version in new test file, ConflictException unit test)
- **Task Count**: 0
- **Recommended Status**: done

---

## Status Sync

- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced — `2-3-create-client: done`

---

## Jira Sync (Automated via sa-jira-sync-api)

- **Story**: Story 2.3: Create Client
- **Story Content Sync**: Skipped (no Jira config found — project_config.yaml not present)
- **Infrastructure**: Node.js direct API (OAuth shared with get-features)

---

## Repository Sync

- **Branch**: develop-sa-quick-dev-gaduranb-rq2-epic-02-gestion-de-clientes
- **Commit**: Pending (story status set to done)
- **Push**: Pending
- **GitFlow Compliance**: Verified against git-flow-siesa.md
- **Status**: Workflow Completed Successfully
