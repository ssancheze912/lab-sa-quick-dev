---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-2-client-detail-view.md
story_key: 2-2-client-detail-view
---

# Code Review: 2-2-client-detail-view

- **Date**: 2026-05-24
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: Complete

## Initial Discovery

- **Undocumented Changes**:
  - `backend/src/SiesaAgents.API/Program.cs` — modified (adds DI registrations + MapClienteEndpoints)
  - `frontend/vite.config.ts` — modified (adds `pool: 'forks'` to test config)
  - `frontend/src/routeTree.gen.ts` — auto-generated file updated by TanStack Router plugin (expected)
  - `_bmad-output/implementation-artifacts/2-1-client-list-search.md` — story file update from previous story (outside scope of 2.2)
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — sprint tracking update (outside scope)

- **Missing Files (Story Claims NOT in Git)**:
  - `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — Task 4 required a backend integration test for `GET /api/v1/clientes/{id}`. No `SiesaAgents.IntegrationTests` project exists at all. **HIGH FINDING.**

---

## Review Plan

### Items to Verify
- [x] AC1: Right panel renders Nombre, NIT/RUC, Teléfono, Ciudad on client click
- [x] AC2: URL updates to `/clientes/:clienteId` without full page reload
- [x] AC3: Deep link `/clientes/:clienteId` fetches via GET and populates panel
- [x] AC4: Non-existent clienteId → "Cliente no encontrado." graceful message
- [x] AC5: Skeleton loading state (react-loading-skeleton), NOT spinner
- [x] AC6: ErrorPanel with "Reintentar" on 5xx/network error
- [x] AC7: GET /api/v1/clientes/{id} returns 200 + ClienteDto
- [x] AC8: GET /api/v1/clientes/{id} returns 404 + Problem Details RFC 7807
- [x] AC9: Default empty state when no clienteId in URL

### Focus Areas
- Security: ClienteEndpoints.cs, GetClienteByIdQueryHandler.cs
- Architecture compliance: folder structure, naming, DateTimeOffset usage
- Test quality: unit + component tests, missing integration tests
- 404 handling correctness in frontend

---

## Review Findings

### Critical Issues (Must Fix)

- **[CRITICAL] Task 4 — Backend integration tests for GET /api/v1/clientes/{id} are completely absent.**
  Story marks Task 4 as `[x]` complete, but `SiesaAgents.IntegrationTests` project does not exist anywhere in the repository tree. Tests for 200/404 responses using `WebApplicationFactory<Program>` + PostgreSQL TestContainers (TC-E2-P2-06) were never created. The story claims these tests exist, which is a false assertion.
  File: `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — DOES NOT EXIST.

### High Issues (Should Fix Before Merge)

- **[HIGH] `useCliente` missing `retry: 1` configuration specified in story Task 5.**
  AC5/Task 5 specifies `retry: 1` (retry once on network failure). The implemented hook in `useCliente.ts` only has `staleTime: 0` and `enabled: !!id`. The `retry` option is absent, which means TanStack Query's default of 3 retries applies for all error states. This contradicts the explicit architecture decision in the story and could produce degraded UX (3 retries instead of 1 before showing `ErrorPanel`).
  File: `frontend/src/modules/crm/clientes/application/useCliente.ts` line 9.

- **[HIGH] `ClienteEndpoints.cs` — GET /api/v1/clientes/{id} uses `Results.Problem()` which does NOT return `Content-Type: application/problem+json` by default in .NET Minimal APIs.**
  The endpoint returns `Results.Problem(new ProblemDetails { ... })`. In .NET 10 Minimal APIs, `Results.Problem()` sets Content-Type to `application/problem+json` only when using the overload with `statusCode` + `detail` parameters, or when `ProblemDetails` is the established response. In practice `Results.Problem(problemDetails)` does work correctly, BUT the code is using `Microsoft.AspNetCore.Mvc.ProblemDetails` (imported via `using Microsoft.AspNetCore.Mvc`) instead of letting ASP.NET handle it natively. The `using Microsoft.AspNetCore.Mvc` import is unnecessary and potentially confusing — `Results.Problem()` in Minimal APIs works through `TypedResults.Problem` internally. Verify `Content-Type: application/problem+json` is being returned; the E2E test `TC-E2-P2-06` validates this explicitly.
  File: `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` lines 2, 25-31.

### Medium Issues (Should Fix)

- **[MED] `vite.config.ts` modified file NOT documented in story File List.**
  The addition of `pool: 'forks'` to the vitest configuration is an uncommitted change to `vite.config.ts` that does not appear in the story's Dev Agent Record File List. This is an undocumented side-effect change. While the change itself is functional (needed to fix MSW compatibility with vitest), it should be documented as a modified file.

- **[MED] `backend/src/SiesaAgents.API/Program.cs` modified file NOT documented in story File List.**
  `Program.cs` was significantly modified (adding DI registrations for `IClienteRepository`, `MediatR`, and `MapClienteEndpoints()`). It appears in git diff as a modified file but is absent from the story's "Backend — modified files" section. This is incomplete documentation in the Dev Agent Record.

- **[MED] `GetClienteByIdQueryHandler` maps `entity.Id` into `ClienteDto.Id` but the entity returned by `IClienteRepository.GetByIdAsync(request.Id)` may have a different `Id` than `request.Id`.**
  The `ClienteRepository.GetByIdAsync` uses `FindAsync([id], ct)` which returns the entity by PK — the entity's `Id` WILL equal `request.Id`. However, the unit tests mock `GetByIdAsync(id, ...)` to return a `ClienteEntity.Create(...)` — but `ClienteEntity.Create` generates a NEW `Guid.NewGuid()` for the entity's `Id`, meaning the returned DTO's `id` will NOT match the queried `id` in the tests. The test `Handle_WhenRepositoryReturnsEntity_MapsIdAsNonEmptyGuid` only asserts `NotEqual(Guid.Empty)` — not that the DTO `Id` equals `request.Id`. This is a weak assertion that could mask a real bug if the handler logic changed.
  File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` line 168.

### Low Issues (Nice to Fix)

- **[LOW] `ClienteDetailView.tsx` — the empty state container (`!clienteId` branch) lacks `aria-label` or any accessible landmark.**
  The default empty state returns a plain `<div>` wrapper with no ARIA role. The accessibility requirements in the story specify `aria-label="Detalle del cliente"` or `aria-labelledby` on the detail panel container. The loaded state has `aria-label="Detalle del cliente"` on its `<section>`, but the empty and not-found states use bare `<div>` without equivalent ARIA attributes. This is a minor WCAG 2.1 AA gap.
  File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` lines 17-24, 46-50, 62-68.

- **[LOW] `ClienteDetailView.test.tsx` retains `@ts-expect-error` comment intended for RED phase.**
  The test file was written in ATDD RED phase and includes `// @ts-expect-error module does not exist until implementation` on the import of `ClienteDetailView`. Since the implementation now exists, this suppression is stale and misleading. TypeScript should be able to resolve the import cleanly.
  File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` line 30.

- **[LOW] `useCliente.test.ts` retains `@ts-expect-error` comment intended for RED phase.**
  Same issue as above — RED phase comment stale after implementation.
  File: `frontend/src/modules/crm/clientes/application/useCliente.test.ts` line 25.

---

## Auto-Fix Actions

### Fix 1 — Add `retry: 1` to `useCliente.ts` (HIGH)

Applied directly to `frontend/src/modules/crm/clientes/application/useCliente.ts`.

### Fix 2 — Remove stale `@ts-expect-error` comments (LOW)

Applied to both test files.

### Fix 3 — Add `aria-label` to empty/not-found states in `ClienteDetailView.tsx` (LOW)

Applied to bare `<div>` wrappers in empty-state and not-found branches.

---

## Fix Outcome

- **Action Taken**: Auto-fix applied for HIGH (retry config) and LOW (stale comments, missing aria-label)
- **Fixed Count**: 3 auto-fixes applied
- **Remaining Manual**: CRITICAL (integration tests), HIGH (verify Problem Details content-type), MED (undocumented files in story)
- **Recommended Status**: in-progress (CRITICAL issue unresolved)

---

## Status Sync

- **Story File Status**: Updated to `in-progress`
- **Sprint Status YAML**: Skipped (status is in-progress, not done)
