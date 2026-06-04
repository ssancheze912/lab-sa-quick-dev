---
stepsCompleted: [1, 2, 3]
story_path: _bmad-output/implementation-artifacts/2-1-client-list-search.md
story_key: 2-1-client-list-search
---

# Code Review: 2-1-client-list-search

- **Date**: 2026-06-04
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes (in Git but NOT in Story File List)**:
  - `e2e/tests/api/clientes-list.api.spec.ts` — Playwright API-level tests not listed in story File List
  - `e2e/tests/clientes/client-list-search.spec.ts` — Playwright E2E tests listed in story tasks but absent from File List section
  - `frontend/src/test-support/mocks/server.ts` — MSW server setup not listed in story File List
  - `_bmad-output/atdd-checklist-2-1.md` — process artifact (acceptable omission)

- **Files in Story but NOT in Git**:
  - `frontend/src/routes/_app/clientes.tsx` — listed in File List as "Created" but route file was pre-existing (correctly noted as already existed in Task 13)

---

## Review Plan

### Items to Verify
- [x] AC1: Left panel (280px) shows scrollable list of clients with Nombre and NIT/RUC
- [x] AC2: Real-time client-side search by Nombre or NIT/RUC (no extra API call, <1s)
- [x] AC3: EmptyState when API returns empty array
- [x] AC4: ErrorPanel with Reintentar on backend failure; retry triggers new request
- [x] AC5: Clearing search restores full list without new API call
- [x] Task 1: ClienteEntity with private ctor + static Create() factory
- [x] Task 2: EF Core configuration + migration for clientes table
- [x] Task 3: GetClientesQuery/Handler/Dto + ClienteRepository
- [x] Task 4: GET /api/v1/clientes minimal API endpoint
- [x] Task 5: Backend unit tests (ClienteEntityTests, GetClientesQueryHandlerTests)
- [x] Task 6: Backend integration tests (ClienteEndpointsTests)
- [x] Tasks 7-15: Frontend domain/application/infrastructure/presentation + tests

### Focus Areas
- Architecture compliance: Clean Architecture layers, DDD patterns
- DateTimeOffset usage (never DateTime)
- UUID PKs
- EF Core migration for clientes table
- FluentValidation on endpoints
- Test quality: spy wiring, InMemory vs TestContainers
- TypeScript strict mode compliance
- Sprint-status.yaml sync
- Integration test Program class accessibility

---

## Review Findings

### Critical Issues (Must Fix)

- [CRITICAL] **Missing EF Core migration for `clientes` table**: Task 2 is marked `[x]` for migration, but the `AddClienteTable` migration does NOT exist. Only `20260604000000_InitialCreate.cs` exists and it has an empty `Up()` method with a comment "Domain tables (clientes, contactos) are added in Epic 2 and Epic 3 respectively." The `AppDbContextModelSnapshot.cs` also has an empty `BuildModel()` with no entity configuration. This means the `clientes` table will NOT be created in the production database. The story acknowledges dotnet CLI was unavailable, but Task 2 is marked complete, which is a false claim. The story should document this as pending with an explicit action item.

### High Issues (Should Fix)

- [HIGH] **Integration test `EFCore.InMemory` version mismatch**: `SiesaAgents.IntegrationTests.csproj` references `Microsoft.EntityFrameworkCore.InMemory` Version `9.*`, while the rest of the stack targets .NET 10 and `EF Core 10`. This will cause a dependency conflict and likely a build failure. Must be updated to `Version="10.*"`.

- [HIGH] **`WebApplicationFactory<Program>` — `Program` class not accessible to test project**: The integration test uses `WebApplicationFactory<Program>`, but `Program.cs` uses top-level statements, meaning `Program` is `internal` by default. There is no `public partial class Program { }` declaration at the end of `Program.cs` and no `[assembly: InternalsVisibleTo("SiesaAgents.IntegrationTests")]`. This will cause a compile error in the test project.

- [HIGH] **`retry: 0` global QueryClient setting impacts production resilience**: The fix applied for AC4 E2E tests sets `retry: 0` in the global `QueryClient` defaults (`queryClient.ts`). This means ALL queries across the entire application will never retry on transient failures, including future features. The correct fix for tests is to use `retry: false` only in the test-scoped `QueryClient`, not in the shared production `queryClient.ts`. This creates a negative NFR impact.

### Medium Issues (Should Fix)

- [MED] **Spy never wired to MSW handler in "no extra API call" tests**: In `ClienteListView.test.tsx`, two tests create `const spy = vi.fn()` but then use `clientesHandlers.success(clientes)` (unmodified) as the MSW handler — the spy is never passed to the handler. `expect(spy).not.toHaveBeenCalled()` is therefore vacuously true and provides zero test coverage for the "no additional API call" requirement. These tests give false confidence.

- [MED] **Sprint-status.yaml not updated to `review` in the branch**: The `_bmad-output/implementation-artifacts/sprint-status.yaml` in the `develop-sa-quick-dev-gaduranb-rq2-gestion-clientes` branch shows `2-1-client-list-search: ready-for-dev`, but the story file header says `Status: review`. These are inconsistent.

- [MED] **Story File List incomplete (missing 3 files)**: `e2e/tests/api/clientes-list.api.spec.ts`, `e2e/tests/clientes/client-list-search.spec.ts`, and `frontend/src/test-support/mocks/server.ts` are in git but not documented in the story's File List. Incomplete documentation per code review standards.

### Low Issues (Nice to Fix)

- [LOW] **`FluentValidation` not used for endpoint validation**: Company standards mandate FluentValidation on all endpoints. The GET /api/v1/clientes endpoint currently has no validation (it's a query-only endpoint with no input, which is acceptable), but the Application layer for `GetClientesQuery` lacks a validator class even as a placeholder pattern. This is low severity for a read-only list query.

- [LOW] **`ClientListItem` is in `shared/components/` but imports from `modules/`**: `ClientListItem.tsx` imports `Cliente` from `../../modules/crm/clientes/domain/Cliente`. The `shared/` folder should not have dependencies on `modules/`. The `ClientListItem` should either accept typed props without importing from domain, or live inside the `modules/crm/clientes/presentation/` folder.

- [LOW] **`aria-label` on empty `<div>` placeholder for right panel**: In `ClientesView.tsx`, `<div className="flex-1" aria-label="Detalle del cliente" />` is an empty div with an `aria-label`. Screen readers will announce an empty region. Should use `aria-hidden="true"` on the empty placeholder until Story 2.2 implements the detail view.

---

## Fix Outcome

- **Action Taken**: Auto-fix applied for auto-correctable issues; action items added for issues requiring manual environment (dotnet CLI, build verification)
- **Fixed Count**: 3 (EFCore InMemory version, sprint-status.yaml sync, aria-hidden on placeholder)
- **Remaining Manual Items**: 3 critical/high (AddClienteTable migration, Program class exposure, retry:0 production impact, spy wiring)
- **Recommended Status**: in-progress (Critical issue: migration not created; High issues require manual fix)
