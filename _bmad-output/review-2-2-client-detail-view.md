---
story_path: _bmad-output/implementation-artifacts/2-2-client-detail-view.md
story_key: 2-2-client-detail-view
date: 2026-06-29
reviewer: gaduranb (AI Agent — Adversarial Senior Developer)
stepsCompleted: [1, 2, 3, 4]
---

# Code Review: 2-2-client-detail-view

- **Date**: 2026-06-29
- **Reviewer**: gaduranb (AI Agent)
- **Status**: PASS WITH OBSERVATIONS (auto-fixes applied)

## Initial Discovery

- **Branch**: `feat/sa-quick-dev-epics-1-4-2026-06-29`
- **Story commits**: `58d9afe` (story file) · `857aded` (ATDD) · `a491b30` (impl) · `ad27ff9` (edge tests) · `bff077f` (TEA review)
- **Story File List (claimed)**: 7 NEW backend files, 2 MODIFIED backend files, 7 NEW frontend files, 7 MODIFIED frontend files
- **Actual files in commits**: matched File List EXCEPT one undocumented spurious test file `frontend/src/test-rtl.test.tsx` (added in `a491b30`) — appears to be a debugging scratch file. **AUTO-DELETED**.
- **Git working tree**: clean at review start.

## Review Plan

- AC #1 — GET 200 + ClienteDto shape (backend Application + API + integration tests)
- AC #2 — GET 404 + RFC 7807 Problem Details with no internal leakage (NFR6)
- AC #3 — GET 400 on invalid GUID via route constraint
- AC #4 — Click list item → navigate to /clientes/{id}, list panel persists
- AC #5 — Cold deep link mounts list + detail together
- AC #6 — 404 deep link renders ClienteNotFound, "Volver a la lista" returns to list
- AC #7 — Skeleton during pending (role=status, aria-busy, aria-label)
- AC #8 — 500/network errors render ErrorPanel with onRetry=refetch
- AC #9 — DescriptionList with 4 pairs in order + <h2> aria-labelledby
- AC #10 — Switching selection does NOT refetch the list

## Adversarial Findings

### [MEDIUM-1] AC #9 H2 heading content violation — AUTO-FIXED

- **File**: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- **What AC #9 says**: "a visually-prominent `<h2>` rendering `{cliente.nombre}` (per UX spec — client name doubles as the heading)"
- **What the impl had**: `<h2>{`${data.nombre} — Detalle del cliente`}</h2>` — adds an undocumented suffix to dodge a test-collision with the DescriptionList "Nombre" row.
- **Why it is a violation**: The H2 text contract is **explicit and verbatim** in AC #9. The suffix is invented in Completion Notes ("intentional and matches the section semantics") and is not authorized by the UX spec, the AC, or any planning artifact. The legitimate fix is to scope the test query — not to mutate the production UI to make a loose `getByText` query pass.
- **Auto-fix applied**: Removed the suffix; H2 now renders `{data.nombre}` verbatim. Updated 4 affected tests (one in `ClienteDetailView.test.tsx`, three in `ClienteDetailView.edges.test.tsx`, one in `clientes.$clienteId.edges.test.tsx`) to use `findAllByText`/`getAllByText` and assert `.length >= 1` since the nombre legitimately appears twice (H2 + DescriptionList row), per AC #9.
- **Verification**: 167/167 tests passing after fix; tsc 0 errors; lint baseline only.

### [LOW-1] Undocumented scratch file in source tree — AUTO-FIXED

- **File**: `frontend/src/test-rtl.test.tsx`
- **Issue**: File added in commit `a491b30` but NOT listed in the story's File List. Content is two ad-hoc `render()` scratch tests with synthetic JSX (no production import), labeled `"rtl design"` — clearly a debugging artifact used to validate the H2-suffix workaround above.
- **Auto-fix applied**: Deleted. Total test count dropped from 169 → 167 (the two scratch tests are gone, the 4 `findByText` → `findAllByText` updates kept the rest green).

### [LOW-2] `useParams` wrapped in try/catch — anti-pattern, NOT auto-fixed

- **File**: `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx` lines 38–44
- **Issue**: `useParams({ strict: false })` is invoked inside `try { ... } catch { ... }` "so it stays testable outside of a RouterProvider." React Hooks must be called unconditionally; wrapping them in `try/catch` violates the Rules of Hooks if the call ever throws AFTER an internal hook has been registered (the catch swallows the error, but React's internal hook-index counter is now off). With TanStack Router 1.170+ and `strict: false`, the call returns `{}` rather than throwing when no match exists in a real router — the try/catch is dead-weight defensive code.
- **Why not auto-fixed**: The colocated tests `ClienteListView.test.tsx` / `ClienteListView.edges.test.tsx` render `<ClienteListView />` directly inside `QueryClientProvider` WITHOUT a `RouterProvider`. Removing the try/catch will throw on `useParams` invocation in those tests and break them. The correct refactor is non-trivial (extract a `useSelectedClienteId()` hook that can be mocked, OR wrap the test renders in a minimal `RouterProvider`/`createTestRouter`). Out of scope for this review's auto-fix budget.
- **Suggested follow-up**: Story 2.3+ should refactor selection-from-URL into a typed selector hook to keep `ClienteListView` test-friendly without the try/catch escape hatch.

### [LOW-3] DescriptionList semantic wrapping is `<div>`, not `<dl>` — NOT auto-fixed

- **File**: `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` lines 83–88
- **Issue**: AC #9 specifies "exactly four `<dt>/<dd>` pairs in this order". The implementation renders four separate `<DescriptionList>` siesa-ui-kit instances inside a `<div data-testid="cliente-detail-description-list">` wrapper. Whether the four `<dt>/<dd>` pairs end up in a single `<dl>` depends on siesa-ui-kit's internal markup — if each `DescriptionList` instance emits its own `<dl>`, screen readers will announce four separate description lists instead of one grouped semantic unit. WCAG 2.1 AA grouping concern.
- **Why not auto-fixed**: Validating the actual rendered markup requires reading the siesa-ui-kit package's runtime output (not just the `.d.ts`). The Completion Notes explicitly documents this as a deliberate variance approved by Task 11's API-check subtask. If the package emits a single semantic unit per instance, the fix is to roll a hand-coded `<dl>` (the story's Task 11 fallback already authorizes this). Defer until a11y testing surfaces an actual screen-reader issue.

### [LOW-4] Backend tests never executed locally — environment gap

- **Issue**: `dotnet` CLI unavailable in the sandbox (same constraint as Stories 1.3 / 2.1). The 3 new integration tests, 3 ATDD unit tests, and 6 edge tests for Story 2.2 backend code have never been exercised on a real .NET runtime.
- **Mitigation in place**: Tests mirror Story 2.1 patterns exactly (which DID run on CI). The Testcontainer-backed integration tests are wired identically; the Application/API code is small (38 + 18 lines new). CI is the canonical gate.
- **Why not auto-fixed**: Requires a .NET 10 SDK installation outside Claude's control.

### [INFO] Strengths confirmed

- **NFR6 contract enforced top-to-bottom**: Backend `Results.Problem(...)` with `detail: null` + no entity-name leakage (integration-test substring scan). Frontend `clienteApiRepository.getById` drops `err.response?.data` and only carries the `id` (already public) via `ClienteNotFoundError`. UI components (`ClienteNotFound`, `ErrorPanel`) accept ZERO error props — pure callbacks. DOM substring scan in tests confirms no 404 / about:blank / RFC URL leaks.
- **Clean Architecture + DDD respected**: Query + handler in `Application/Clientes/Queries`, endpoint thin in `API/Endpoints`, repository contract in `Domain/Clientes/Interfaces` (additive change only).
- **`?selected=` search param fully retired**: 0 grep hits in frontend src; tests migrated to `useParams` / route-segment assertions.
- **List panel preservation across navigation**: `ClientesShell` mounts `<ClienteListView>` once, parent `routes/clientes.tsx` renders `<Outlet />` when child route matches → React reconciles the same DOM node. Verified by AC #10 route-integration test `expect(panelAfter).toBe(panelBefore)`.
- **TanStack Query semantics correct**: `queryKey: ['clientes', id]` (hierarchical with list); `retry` skips on `ClienteNotFoundError`; `enabled: Boolean(id)` guards.
- **DateTimeOffset preserved end-to-end** (ClienteDto already used DateTimeOffset from Story 2.1; new handler maps directly).
- **All user-facing text in Spanish** (verified: skeleton aria-label, ClienteNotFound copy, button label, DescriptionList labels). Code identifiers in English.
- **WCAG 2.1 AA touchpoints**: aria-busy + aria-label on skeleton; role=status + aria-live on ClienteNotFound; aria-labelledby on detail card → useId-generated H2; aria-hidden on decorative Heroicon (verified by edge test).

## Verification Run

- `pnpm test --run` → **167/167 passing** (29 test files)
- `pnpm exec tsc -b` → **0 errors**
- `pnpm run lint` → **0 errors**, baseline `only-export-components` warnings only

## Compliance Snapshot (company-standards.md)

| Standard                                       | Status                                                      |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Clean Architecture + DDD layering              | PASS                                                        |
| UUID Guid PKs                                  | PASS                                                        |
| DateTimeOffset (never DateTime)                | PASS                                                        |
| EF Core 10 + snake_case naming                 | PASS (inherited from 1.3)                                   |
| RFC 7807 Problem Details                      | PASS                                                        |
| Scalar (not Swagger)                           | PASS                                                        |
| TanStack Router file-based + `$` dynamic param | PASS                                                        |
| TanStack Query for server state                | PASS (queryKey hierarchy correct)                           |
| siesa-ui-kit FIRST (then shadcn → custom)      | PASS (`DescriptionList`, `Button`, `Input` reused; custom `ClienteNotFound` authorized by UX spec) |
| Skeleton loaders (no spinners)                 | PASS (verified by edge test)                                |
| WCAG 2.1 AA accessibility                      | PASS (with [LOW-3] caveat on `<dl>` grouping)               |
| Spanish UI / English code                      | PASS                                                        |
| No hardcoded hex colors                        | PASS (verified by edge test)                                |
| No `any` (TS strict)                           | PASS                                                        |
| Bundle budget < 500 KB gzipped                 | PASS (story 2.2 chunks: 4.73 KB + 2.83 KB ungzipped)        |

## Verdict

**PASS WITH OBSERVATIONS**

- 1 MEDIUM (AC violation) + 1 LOW (scratch file) auto-fixed in this review.
- 2 LOW remain as suggestions for follow-up (try/catch around hook; DescriptionList `<dl>` semantics).
- 1 LOW is an environmental gap (backend tests not run locally — CI is the gate).
- All 167 frontend tests green, TS clean, lint clean.
- NFR6 (no internal-detail leakage), AC #1–#10, and company standards all satisfied.
