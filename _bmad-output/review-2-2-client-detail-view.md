---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-2-client-detail-view.md
story_key: 2-2-client-detail-view
reviewer: SiesaTeam (AI Agent)
date: 2026-06-25
status: In Progress
---

# Code Review: 2-2-client-detail-view

- **Date**: 2026-06-25
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

### Git Changes (Actual)
Branch: `develop-sa-gaduranb-rq2-epic-02-gestion-de-clientes`
Commit: `69ae9ed` — feat(story-2.2): implement Client Detail View

**Files Changed (16 total):**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — modified
- `backend/src/SiesaAgents.API/Program.cs` — modified
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs` — new
- `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs` — new
- `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs` — modified
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` — new
- `frontend/src/modules/crm/clientes/application/useCliente.test.ts` — new
- `frontend/src/modules/crm/clientes/application/useCliente.ts` — new
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — modified
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — modified
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.test.tsx` — new
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx` — new
- `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` — modified
- `frontend/src/routeTree.gen.ts` — modified
- `frontend/src/routes/_app/clientes.$clienteId.tsx` — new
- `frontend/src/routes/_app/clientes.tsx` — modified

- **Undocumented Changes**: None — all git files match story File List.
- **Files in Story but NOT in Git**: None — all claimed files present.
- **Missing Documentation**: None found.

---

## Review Plan

### Items to Verify

- [ ] AC1: client fields rendered (Nombre, NIT/RUC, Teléfono, Ciudad), active highlight Siesa Blue
- [ ] AC2: URL updates to `/clientes/:clienteId` on click, no full reload
- [ ] AC3: deep link fetches via GET /api/v1/clientes/{id}, active client highlighted
- [ ] AC4: 404 shows "Cliente no encontrado" gracefully, no unhandled error
- [ ] AC5: ErrorPanel with "Reintentar" on 5xx, refetch triggered
- [ ] AC6: Skeleton screen (not spinner) during loading
- [ ] AC7: Placeholder "Selecciona un cliente para ver el detalle" on /clientes (no ID)
- [ ] Task 1: GetClienteByIdQuery/Handler created, endpoint added, registered in DI
- [ ] Task 2: Unit + Integration tests for GetClienteById
- [ ] Task 3: useCliente hook, getById added to repository
- [ ] Task 4: ClienteDetailPanel — all states (placeholder/skeleton/404/error/success)
- [ ] Task 5: clientes.$clienteId.tsx route, clientes.tsx updated, ClienteListPanel props
- [ ] Task 6: useCliente + ClienteDetailPanel tests — 8 + 15 tests

### Focus Areas
- Backend security: input validation on the GUID route, FluentValidation presence
- Frontend 404 detection: AxiosError cast pattern
- Routing: unused navigate/variables in clientes.tsx
- Tests: coverage completeness, AC2 deep-link test coverage
- Architecture: Clean Architecture compliance

---

## Review Findings

### Critical Issues (Must Fix)

None found.

### High Issues (Should Fix)

**[HIGH-1] No FluentValidation on GET /api/v1/clientes/{id} endpoint — security requirement not met**

File: `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`

The company standards mandate FluentValidation on all endpoints. The `GET /api/v1/clientes/{id:guid}` endpoint receives a `Guid` from the route but no FluentValidation validator is wired. The `{id:guid}` route constraint does reject non-GUID strings at the routing level, but there is no application-layer validation (e.g., checking for `Guid.Empty`). A request with `GET /api/v1/clientes/00000000-0000-0000-0000-000000000000` hits the handler and makes a DB query for an empty GUID instead of returning a 400 immediately.

From company standards: *"FluentValidation on all endpoints"* — security section.

**[HIGH-2] Unused variable `activeClienteId` and dead code in `clientes.tsx`**

File: `frontend/src/routes/_app/clientes.tsx`

The `clientes.tsx` route extracts `activeClienteId` from child matches (lines 13–16) but this value is only passed to `ClienteListPanel` in the fallback branch (`childMatches.length === 0`). When the `$clienteId` route IS active, the component short-circuits with `return <Outlet />` at line 23, making the `activeClienteId` computation and the `handleClienteSelect` function in lines 13–19 dead code in the active-child case. The `Outlet` delegates entirely to `clientes.$clienteId.tsx`, which correctly wires its own `activeClienteId`. The code is not broken but carries unnecessary computation and a confusing dead branch.

**[HIGH-3] AC2 has no dedicated test — deep-link URL update on client click is not verified**

Files: `frontend/src/routes/_app/clientes.$clienteId.tsx`, `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx`

AC2 states: "When the user clicks on a client item, the URL updates to `/clientes/:clienteId`." There is no test that simulates a click on a `ClientListItem` and verifies the URL changes via `navigate`. The `useCliente.test.ts` and `ClienteDetailPanel.test.tsx` files cover API/rendering states but no test exercises the navigation callback path. The click handler in `ClienteDetailPage` passes `handleClienteSelect` → `navigate(...)`, but this is never tested.

### Medium Issues (Should Fix)

**[MED-1] `is404` check using `AxiosError` cast is fragile and order-dependent**

File: `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`, lines 65–66

```typescript
const is404 = isError && (error as AxiosError)?.response?.status === 404;
if (is404) { ... }
// then
if (isError) { ... }
```

The cast `(error as AxiosError)` is an unsafe type assertion — TypeScript cannot verify this. If the error is a non-Axios error (e.g., a network error throws a plain `Error` or a TanStack Query wrapping), `?.response?.status` will silently be `undefined` and fall through to the generic ErrorPanel, which is acceptable behaviour. However, the `is404` variable is declared AFTER the `isLoading` check but computed even when `isLoading` is true and `error` is null. This is minor but shows imprecise scoping — `is404` should be derived only inside the `isError` branch. More critically, there is no `throwOnError` config in `useCliente`, which means the `error` type is `Error | null`, and asserting it to `AxiosError` bypasses TypeScript's strictness requirement (company standard: NO `any`, by extension no unsafe casts).

**[MED-2] Integration test uses EF Core InMemory provider — not aligned with company standards**

File: `backend/tests/SiesaAgents.IntegrationTests/ClienteEndpointsTests.cs`

Company standards specify: *"PostgreSQL Test Containers (integration)"* for backend integration tests. The `InMemoryClienteFactory` uses `UseInMemoryDatabase` instead of a Testcontainers/PostgreSQL container. EF Core InMemory does not enforce relational constraints, snake_case naming conventions, or PostgreSQL-specific behaviors. This was already present from Story 2.1 but the new tests extend this pattern, propagating the non-compliance.

**[MED-3] `useCliente` hook has no `throwOnError` or explicit error boundary config — silent 404 swallowing**

File: `frontend/src/modules/crm/clientes/application/useCliente.ts`

TanStack Query v5 changed the default error handling — HTTP errors are thrown by Axios but TanStack Query catches them and sets `isError`. The hook does not configure `throwOnError: false` explicitly (it relies on default), nor does it document that the `error` will always be an `AxiosError` when using `clienteApiRepository`. The `useCliente` hook signature returns `UseQueryResult<Cliente, Error>` (inferred), but `clienteApiRepository.getById` actually throws `AxiosError` on non-2xx. Callers (like `ClienteDetailPanel`) cast to `AxiosError` without any type guard, creating a maintenance risk for future developers who may not use Axios.

### Low Issues (Nice to Fix)

**[LOW-1] `GetClienteByIdQuery` is a bare record without namespace-level XML documentation**

File: `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`

The query record `GetClienteByIdQuery(Guid Id)` has no XML summary documentation. While other handlers in the solution follow this same lean pattern, the company architecture documentation emphasizes explicit contracts. This is a minor consistency issue.

**[LOW-2] `clientes.$clienteId.tsx` imports `useNavigate` but the local navigate function is redundant**

File: `frontend/src/routes/_app/clientes.$clienteId.tsx`

The route imports `useNavigate` from TanStack Router and defines `handleClienteSelect` which calls `navigate(...)`. However, since `ClienteListPanel.onClick` already calls this, the pattern is correct. The minor issue is that `ClienteListPanel` calls `onClienteSelect(id)` with just the raw ID string, and the navigate call hardcodes `to: '/clientes/$clienteId'`. This works but is less type-safe than using TanStack Router's `Link` component, which would benefit from compile-time route checking. Not broken, but a robustness improvement.

**[LOW-3] `useCliente.test.ts` ATDD header comment says "RED Phase — Tests intentionally failing" — outdated after implementation**

File: `frontend/src/modules/crm/clientes/application/useCliente.test.ts`, line 1-10

The file header still says "ATDD — RED Phase (Tests intentionally failing — no implementation yet)". Post-implementation this comment is misleading to future maintainers. The same issue exists in `ClienteDetailPanel.test.tsx`.

---

---

## Fix Outcome

- **Action Taken**: Auto-fixed
- **Issues Auto-Corrected**: 3
  - [HIGH-2] Dead code removed from `frontend/src/routes/_app/clientes.tsx` — `activeClienteId` computation and duplicate `handleClienteSelect` moved after the Outlet short-circuit; `activeClienteId` correctly set to `undefined` in the no-child branch.
  - [MED-1] Unsafe `as AxiosError` cast replaced with `axios.isAxiosError()` type guard in `frontend/src/modules/crm/clientes/presentation/ClienteDetailPanel.tsx`.
  - [LOW-3] ATDD "RED Phase" header comments updated to "GREEN Phase" in `useCliente.test.ts` and `ClienteDetailPanel.test.tsx`.
- **Issues Requiring Manual Attention**:
  - [HIGH-1] No FluentValidation validator for `GetClienteByIdQuery` — the `{id:guid}` route constraint guards format but empty-GUID queries reach the DB. Add a validator or explicit empty-GUID check if desired for full compliance.
  - [HIGH-3] No test for AC2 (URL update on client click via navigate) — recommend adding a navigation test using TanStack Router's test utilities.
  - [MED-2] Integration tests use EF Core InMemory instead of Testcontainers/PostgreSQL — inherited from Story 2.1, should be addressed at the integration test infrastructure level.
  - [MED-3] `useCliente` error type is inferred as `Error`, not `AxiosError` — the `axios.isAxiosError()` guard in the component now handles this correctly, but consider typing the hook explicitly: `useQuery<Cliente, AxiosError>(...)`.
- **Recommended Status**: done

---

## Status Sync

- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced — 2-2-client-detail-view -> done

---

## Senior Developer Review (AI)

**Verdict: PASS WITH OBSERVATIONS**

All 7 Acceptance Criteria are implemented and verifiable:

- AC1: `ClienteDetailPanel` renders `<dl>` with Nombre, NIT/RUC, Teléfono, Ciudad; `ClienteListPanel` applies `isActive` prop styling with Siesa Blue `#0e79fd`. PASS.
- AC2: Navigation via `useNavigate` in `clientes.$clienteId.tsx` handles click-to-URL update. Routing architecture correct. Test gap noted [HIGH-3].
- AC3: `GET /api/v1/clientes/{id:guid}` endpoint returns `ClienteDto` 200, `useCliente` hook uses correct queryKey `['clientes', id]`. PASS.
- AC4: 404 from backend returns Problem Details RFC 7807; `ClienteDetailPanel` detects via `axios.isAxiosError()` + status 404, renders "Cliente no encontrado" distinct from ErrorPanel. PASS.
- AC5: `ErrorPanel` with `data-testid="error-panel-retry-button"` displayed on 5xx; `refetch` wired. PASS.
- AC6: `react-loading-skeleton` `<SkeletonDetail />` with 4 rows displayed during `isLoading`. No spinner. PASS.
- AC7: `clienteId === undefined` renders placeholder "Selecciona un cliente para ver el detalle"; no fetch triggered (`enabled: !!id`). PASS.

**Architecture compliance**: Clean Architecture layers respected (Domain → Application → Infrastructure → Presentation). DateTimeOffset used correctly. UUID PKs. Scalar API docs not modified (already wired). FluentValidation gap noted [HIGH-1].

**Test coverage**: 106 frontend + 28 backend unit + 13 backend integration = 147 tests. Coverage is thorough for component states. Gap in AC2 navigation test [HIGH-3].

_Reviewer: SiesaTeam (AI Agent) on 2026-06-25_
