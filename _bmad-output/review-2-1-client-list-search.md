---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-1-client-list-search.md
story_key: 2-1-client-list-search
---

# Code Review: 2-1-client-list-search

- **Date**: 2026-06-30
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress → FAIL (rework required)

## Initial Discovery

- **Undocumented Changes (in Git but not in Story File List)**:
  - `backend/src/SiesaAgents.Infrastructure/Migrations/20260630052917_AddClientesTable.Designer.cs`
  - `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`
  - `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerEdgeCaseTests.cs`
  - `frontend/src/modules/crm/clientes/application/useClientes.edge.test.ts`
  - `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge.test.tsx`
  - `frontend/src/shared/components/ClienteListItem.test.tsx`
  - `frontend/src/shared/components/EmptyState.test.tsx`
  - `frontend/src/shared/components/ErrorPanel.test.tsx`
  - `e2e/tests/api/clientes-list.api.spec.ts`
  - `e2e/tests/clientes/client-list-search.edge.spec.ts`
  - `e2e/tests/clientes/client-list-search.spec.ts`
  - `_bmad-output/atdd-checklist-2.1.md`
  - `_bmad-output/automation-summary-2-1.md`
  - `.gitignore` (strengthened)
- **Files in Story but NOT in Git**: None — all story-claimed files exist.

## Review Plan

### Items Verified

- [x] AC1: Left panel 280px, scrollable list with nombre+nit — PASS
- [x] AC2: Real-time client-side filter via useMemo, case-insensitive — PASS
- [x] AC3: EmptyState component on empty data — PASS
- [x] AC4: ErrorPanel with Reintentar button on fetch failure — PASS
- [x] AC5: Right panel default empty state when no client selected — PASS
- [x] AC6: TanStack Query cache with staleTime > 0 (30s) — PASS
- [x] Task 1: Cliente.ts domain entity + IClienteRepository — PASS
- [x] Task 2: clienteApiRepository implementation — PASS
- [x] Task 3: useClientes hook with queryKey, staleTime, refetch — PASS
- [x] Task 4: ClienteListItem with selection, keyboard, aria — PASS
- [x] Task 5: ClienteListView with skeleton, filter, navigation — PASS
- [x] Task 6: ClientesPage route _app/clientes — PASS (but missing $clienteId child route — CRITICAL)
- [x] Task 7: Backend ClienteEntity + IClienteRepository — PASS
- [x] Task 8: EF Core config, migration, AppDbContext — PASS
- [x] Task 9: ClienteRepository + DI registration — PASS
- [x] Task 10: GetClientesQuery + Handler + DTO — PASS
- [x] Task 11: Minimal API endpoint GET /api/v1/clientes — PASS (with fix applied)
- [x] Task 12: Backend unit tests (3) — PASS
- [x] Task 13: Frontend unit tests (9) — PASS

### Focus Areas

- Security: ExceptionHandlingMiddleware, appsettings.Development.json, endpoint auth
- Architecture compliance: UUID strategy, FluentValidation, domain events, route completeness
- Standards: Heroicons usage, TypeScript strict mode, Single-SPA

## Review Findings

### Critical Issues (Must Fix)

- [CRITICAL] **Missing `$clienteId` dynamic route** — `ClienteListView.tsx:78` navigates to `/clientes/$clienteId` but `frontend/src/routes/_app/clientes.$clienteId.tsx` does not exist. `routeTree.gen.ts` confirms only `/clientes` is registered. `useParams({ strict: false })` at line 14-15 will always produce `selectedId = ''`; no item will ever appear selected. The navigation call will fail silently or throw depending on TanStack Router version.

- [CRITICAL] **FluentValidation installed but never used** — `SiesaAgents.Application.csproj` references `FluentValidation 12.1.1` but no `AbstractValidator` exists anywhere in the codebase. Company standards mandate FluentValidation on all endpoints. This is an incomplete compliance with architecture standards.

### High Issues (Must Fix)

- [HIGH] **UUID v4 instead of UUID v7 for PK generation** — `ClienteEntity.cs:19` uses `Guid.NewGuid()` (random UUIDs). Company standards DB conventions state `id UUID PRIMARY KEY DEFAULT uuidv7()`. Sequential UUIDs are required to prevent B-tree index fragmentation on large datasets.

- [HIGH] **Database credentials committed to git** — `appsettings.Development.json` contains `Password=postgres`. Company standards: "secrets in env vars, never expose API keys/credentials". Must be moved to `dotnet user-secrets` or environment variables.

### Medium Issues (Should Fix)

- [MED] **No integration tests for HTTP endpoint** — Only unit tests exist. The actual HTTP behavior (status 200, correct JSON shape, CORS headers, 500 on DB failure) is untested. Company standards require PostgreSQL TestContainers integration tests in `SiesaAgents.IntegrationTests/`.

- [MED] **Type-unsafe `useParams` cast** — `ClienteListView.tsx:15` casts params as `Record<string, string>`. This bypasses TanStack Router's type system. Once the `$clienteId` route is created, use the route-specific typed `useParams`.

### Auto-Fixed by Review Agent

- [FIXED-CRITICAL] **ExceptionHandlingMiddleware leaked `ex.Message` in production** — Added `IsDevelopment()` guard in `ExceptionHandlingMiddleware.cs`. Detail is now `ex.Message` only in development; production returns generic message.
- [FIXED-MED] **Endpoint missing OpenAPI documentation** — Added `.WithName("GetClientes")`, `.WithTags("Clientes")`, `.Produces<IEnumerable<ClienteDto>>()`, `.ProducesProblem(500)`, `.WithOpenApi()` to `ClienteEndpoints.cs`.
- [FIXED-MED] **Inline SVGs instead of Heroicons** — `EmptyState.tsx` now uses `ClipboardDocumentListIcon`, `ErrorPanel.tsx` now uses `ExclamationTriangleIcon` from `@heroicons/react/24/outline`.

## Fix Outcome

- **Action Taken**: 3 Auto-Fixed + 4 Action Items created in story file
- **Fixed Count**: 3
- **Task Count**: 4 pending (2 critical, 2 high/medium)
- **Recommended Status**: in-progress (rework required)

## Status Sync

- **Story File Status**: Updated to `in-progress`
- **Sprint Status YAML**: Updated — `2-1-client-list-search: in-progress`
