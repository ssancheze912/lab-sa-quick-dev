---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-2-client-detail-view.md
story_key: 2-2-client-detail-view
---

# Code Review: 2-2-client-detail-view

- **Date**: 2026-06-21
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: Complete

## Initial Discovery

- **Undocumented Changes**: None — all files in git commit match the story File List exactly.
- **Missing Files**: None — all claimed files are present in git.
- **Git Commit**: `666de9a` `feat(story-2.2): implement client detail view (frontend + backend)`

Files changed in commit (21 files) match story File List: PASS

---

## Review Plan

### Items to Verify
- [x] AC1: Right panel shows Nombre, NIT/RUC, Teléfono, Ciudad; URL updates to `/clientes/:clienteId`
- [x] AC2: Direct URL (deep link, cold TQ cache) fetches via `GET /api/v1/clientes/{id}`
- [x] AC3: 404 from backend shows Spanish not-found message, no stack trace (NFR6)
- [x] AC4: Network/server error shows `ErrorPanel` with "Reintentar" button
- [x] Task 1: Backend `GET /api/v1/clientes/{id}` endpoint registered, returns 200/404
- [x] Task 2: Backend unit + integration tests
- [x] Task 3: Frontend domain layer `getById`
- [x] Task 4: `useCliente` hook with canonical query key
- [x] Task 5: `ClienteDetailView` component all states
- [x] Task 6: TanStack Router dynamic route + `ClientListItem` navigation
- [x] Task 7: Frontend unit + component tests

### Focus Areas
- Security: `ClienteEndpoints.cs` — GUID route constraint, no SQL injection risk, Problem Details format
- Performance: `ClienteRepository.cs` — single EF Core `FirstOrDefaultAsync` query
- Error handling: `ClienteDetailView.tsx` — 404 vs network error discrimination
- Test quality: `useCliente.test.ts`, `ClienteDetailView.test.tsx`, `GetClienteByIdQueryHandlerTests.cs`
- Standards compliance: DateTimeOffset, UUID PK, Clean Architecture layers, Spanish UI text

---

## Review Findings

### CRITICAL Issues (Must Fix Before Done)

None found.

---

### HIGH Issues (Must Fix)

**[HIGH-1] `ClientesIndexComponent` exported but dead — placeholder is NEVER shown at `/clientes` (AC#1 regression)**

- **File**: `frontend/src/routes/_app/clientes.tsx` (line 20–22)
- **Problem**: `ClientesIndexComponent` is defined and exported but is NOT registered as a TanStack Router index route. There is no `clientes.index.tsx` file. When the user navigates to `/clientes` without selecting a client, the `<Outlet />` renders nothing — a blank right panel rather than the intended placeholder message "Selecciona un cliente de la lista para ver su detalle."
- **Evidence**: `routeTree.gen.ts` shows no index route for `/_app/clientes`. The `ClientesIndexComponent` is only referenced inside `clientes.tsx` and never imported by the router.
- **AC Impact**: AC1 requires the placeholder to be visible in the initial empty state. The story's Task 6 explicitly states "ensure the two-panel layout shell renders `<Outlet />` in the right panel" — the Outlet is there but nothing fills it without an index route.
- **Fix**: Create `frontend/src/routes/_app/clientes.index.tsx` that exports the index route rendering `<ClienteDetailView clienteId={undefined} />`, OR wire `ClientesIndexComponent` as the `component` in `clientes.tsx`'s `createFileRoute` call.

---

### MEDIUM Issues (Should Fix)

**[MED-1] 404 NotFound response does NOT use `application/problem+json` Content-Type — partial RFC 7807 compliance**

- **File**: `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (line 29)
- **Problem**: `Results.NotFound(new { title = "Cliente no encontrado.", status = 404 })` returns an anonymous object with `Content-Type: application/json`. The company standard requires Problem Details RFC 7807 with `Content-Type: application/problem+json`. The `ExceptionHandlingMiddleware` correctly uses `ProblemDetails` for 500 errors but the 404 case bypasses it.
- **Comparison**: `ExceptionHandlingMiddleware` sets `context.Response.ContentType = "application/problem+json"` and uses `new ProblemDetails { ... }`. The endpoint uses an anonymous object.
- **Fix**: Replace with `Results.Problem(title: "Cliente no encontrado.", statusCode: 404)` or construct a `ProblemDetails` instance.

**[MED-2] `ClienteDetailView` uses non-null assertion (`data!`) without null guard — TypeScript strict mode violation risk**

- **File**: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` (lines 57, 64, 68, 72)
- **Problem**: `data!.nombre`, `data!.nit`, `data!.telefono`, `data!.ciudad` use the non-null assertion operator. While the guard `if (isLoading) / if (isNotFound) / if (isError)` above logically guarantees `data` is defined by line 57, TypeScript strict mode still allows this pattern only if `data` type is `T | undefined`. This is acceptable only if all error/loading/notFound paths exit early before reaching line 57. Code analysis confirms early returns are correctly placed — however, the `enabled: !!id` guard on `useCliente` means `data` is always `undefined` when `clienteId` is `undefined`, but that case is also early-returned. The pattern is logically correct but fragile against future refactoring. Low actual risk; medium code quality concern per TypeScript strict standards.
- **Fix**: Use optional chaining with a final null guard: `if (!data) return null;` before the return statement at line 55.

**[MED-3] Integration tests use `EF Core InMemory` instead of `PostgreSQL TestContainers` — violates backend testing standards**

- **File**: `backend/tests/SiesaAgents.UnitTests/Integration/ClienteEndpointsTests.cs` (lines 29–32)
- **Problem**: Company standards (`company-standards.md#Testing Standards`) specify "xUnit + EF Core InMemory (unit) + PostgreSQL Test Containers (integration)". The integration tests replace the real `AppDbContext` with `UseInMemoryDatabase`. InMemory doesn't support snake_case naming, constraint validation, or certain EF Core behaviors that PostgreSQL enforces. This means the integration tests cannot catch real DB-level issues.
- **Context**: The story notes "dotnet SDK not available in this environment" and the pattern was established in Story 2.1. This is an acknowledged environment limitation but still a standards deviation.
- **Fix**: Document as a known limitation in the story's Completion Notes. Flag for resolution when CI/CD with dotnet SDK is available. (Cannot auto-fix without dotnet SDK.)

---

### LOW Issues (Nice to Fix)

**[LOW-1] `ClienteDetailView.test.tsx` uses `onUnhandledRequest: 'warn'` instead of `'error'`**

- **File**: `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx` (line 53)
- **Problem**: `server.listen({ onUnhandledRequest: 'warn' })` vs `useCliente.test.ts` which uses `'error'`. Using `'warn'` silently allows unhandled requests to pass through to the network, which can mask missing MSW handlers. Best practice is `'error'` to fail tests on unhandled requests.
- **Fix**: Change to `server.listen({ onUnhandledRequest: 'error' })`.

**[LOW-2] `clientes.tsx` imports `ClienteDetailView` but only uses it in the dead `ClientesIndexComponent` — unnecessary import**

- **File**: `frontend/src/routes/_app/clientes.tsx` (line 3)
- **Problem**: `import { ClienteDetailView } from '@/modules/crm/clientes/presentation/ClienteDetailView'` is only used by `ClientesIndexComponent` which is never registered as a route (see HIGH-1). If HIGH-1 is fixed by creating `clientes.index.tsx`, this import in `clientes.tsx` becomes unnecessary.
- **Fix**: Resolved by fixing HIGH-1 — move the import to `clientes.index.tsx`.

**[LOW-3] `FakeClienteRepository` in `GetClienteByIdQueryHandlerTests.cs` only returns entity when `id` matches — but `GetAllAsync` always returns empty list**

- **File**: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (lines 73–76)
- **Problem**: `FakeClienteRepository.GetAllAsync()` always returns an empty list regardless. While harmless for this handler's tests, it means the fake can't be reused for `GetClientesQueryHandler` tests. Minor design issue but not a correctness problem.
- **Severity**: Cosmetic/maintainability.

---

## AC Verification Summary

| AC | Status | Evidence |
|----|--------|----------|
| AC1 (right panel shows fields, URL updates) | PARTIAL — fields render correctly but placeholder at `/clientes` is broken (HIGH-1) | `ClienteDetailView.tsx` shows all 4 fields; index route missing |
| AC2 (deep link cold cache) | PASS | `useCliente` hook with `enabled: !!id`, `clienteApiRepository.getById` via Axios |
| AC3 (404 shows Spanish not-found, no stack trace) | PASS | `isNotFound` discrimination, "Cliente no encontrado." message, NFR6 verified by tests |
| AC4 (backend unavailable → ErrorPanel + Reintentar) | PASS | `if (isError)` → `<ErrorPanel onRetry={() => refetch()} />` |

---

## Standards Compliance

| Standard | Status | Notes |
|----------|--------|-------|
| UUID PKs (Guid) | PASS | Entity base class uses `Guid.NewGuid()` |
| DateTimeOffset (never DateTime) | PASS | `ClienteDto`, `ClienteEntity`, `Entity` all use `DateTimeOffset` |
| Clean Architecture layers | PASS | domain → application → infrastructure → presentation, no cross-layer violations |
| DDD Entity pattern (private ctor + static Create) | PASS | `ClienteEntity.Create()` factory pattern |
| CQRS | PASS | `GetClienteByIdQuery` + `GetClienteByIdQueryHandler` |
| FluentValidation | N/A | Read-only query, no input validation required (GET by GUID — route constraint handles format) |
| Problem Details RFC 7807 | PARTIAL — MED-1 | Content-Type missing for 404 |
| TanStack Router file-based routing | PASS | `clientes.$clienteId.tsx` correctly uses `$` prefix |
| TanStack Query canonical key | PASS | `['clientes', id]` exactly as specified |
| Spanish UI text | PASS | All user-facing text in Spanish |
| Code/variables in English | PASS | All code identifiers in English |
| react-loading-skeleton (not spinner) | PASS | `Skeleton` component used in loading state |
| WCAG 2.1 AA semantic HTML | PASS | `<dl>/<dt>/<dd>` structure, `aria-label` on search, touch targets ≥ 44px |
| Heroicons | N/A | No icons added in this story |

---

## Auto-Corrections Applied

### Fix 1 — HIGH-1: Create `clientes.index.tsx` index route

Created `frontend/src/routes/_app/clientes.index.tsx` to register the index route and show the placeholder when no client is selected.

### Fix 2 — MED-1: Fix 404 response to use proper Problem Details

Updated `ClienteEndpoints.cs` to use `Results.Problem()` for RFC 7807 compliance.

### Fix 3 — LOW-1: Fix `onUnhandledRequest` to `'error'`

Updated `ClienteDetailView.test.tsx` MSW server setup.

---

## Fix Outcome

- **Action Taken**: Auto-fixed
- **Fixed Count**: 3 (HIGH-1, MED-1, LOW-1)
- **Remaining Manual Action**: MED-2 (optional refactor), MED-3 (environment limitation, documented), LOW-2 (resolved by HIGH-1 fix), LOW-3 (cosmetic)
- **Recommended Status**: done

---

## Status Sync

- **Story File Status**: Updated to `done`
- **Sprint Status YAML**: Skipped (sprint-status.yaml not found at `_bmad-output/implementation-artifacts/sprint-status.yaml`)
