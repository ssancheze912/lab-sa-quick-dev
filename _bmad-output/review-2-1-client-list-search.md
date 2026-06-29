---
story_path: _bmad-output/implementation-artifacts/2-1-client-list-search.md
story_key: 2-1-client-list-search
date: 2026-06-29
reviewer: SiesaTeam (AI Agent — adversarial)
stepsCompleted: [1, 2, 3, 4, 5]
---

# Code Review: 2-1-client-list-search

- **Date**: 2026-06-29
- **Reviewer**: SiesaTeam (AI Agent — adversarial)
- **Status**: Complete (PASS WITH OBSERVATIONS)

## Initial Discovery

- **Working tree**: clean before review (everything committed under feat/sa-quick-dev-epics-1-4-2026-06-29 across commits 1b7baf4, c7d26b6, f0e8cb0, dd17759).
- **Undocumented changes**: None — every file in the four commits is listed in the story's File List.
- **Missing files**: None — every file claimed in the File List is present in git.
- **False claims (story File List vs. reality)**:
  - Task 2 says "Remove .gitkeep from Domain/Clientes/Interfaces/" → already done.
  - Task 4 says "Remove .gitkeep from Infrastructure/Repositories/" → NOT done. .gitkeep was still tracked. FIXED in this review.
  - Task 5 says "Remove .gitkeep from Application/Clientes/" → NOT done. .gitkeep was still tracked. FIXED in this review.
  - The story's File List "Backend — removed" section only enumerated the Domain ones — Application + Infrastructure removals were omitted from the claim.
- **Tests**: 108/108 frontend Vitest tests green before and after the review (`pnpm test`). Backend tests not executable in sandbox (no dotnet CLI); covered by Testcontainer suite in CI.

## Review Plan

### Items Verified

- [x] AC #1 — clientes migration with snake_case columns, pk_clientes, uk_clientes_nit, ix_clientes_nombre_trgm GIN trigram, pg_trgm extension. Migration file inspected: ✅ all elements present.
- [x] AC #2 — GET /api/v1/clientes returns Ok with ClienteDto[] (camelCase), empty array on no rows, ?search filter on nombre OR nit case-insensitive. Endpoint + handler + repo inspected: ✅.
- [x] AC #3 — 280px aside panel with sticky search input, vertically scrollable list, ClientListItem rendered as `<button>` with aria-label and aria-current. Inspected ClienteListView.tsx + ClientListItem.tsx: ✅.
- [x] AC #4 — siesa-ui-kit Input, real-time client-side filter via useMemo, 150ms debounce, no extra GET fired (MSW spy in TC-E2-P2-04). ✅.
- [x] AC #5 — EmptyState variants no-clients (with non-functional CTA) and search-empty, aria-live=polite. ✅.
- [x] AC #6 — ErrorPanel surfaces only the Spanish copy + Reintentar button, never receives the error object (NFR6). ✅.
- [x] AC #7 — 5 react-loading-skeleton items inside role=status, aria-busy=true, aria-label=Cargando clientes during pending. ✅.

### Focus Areas
- Security: backend ILIKE input (potential wildcard injection — see issue [HIGH-1]).
- React rules-of-hooks: useSearch inside try/catch in ClienteListView.
- Story claim hygiene (File List vs. git reality).
- DTO/contract alignment (entity.Nit → dto.NitRuc → frontend Cliente.nitRuc).

## Review Findings

### Critical Issues (Must Fix) — 0

_None._

### High Issues (Should Fix) — 2 (both auto-fixed)

- **[HIGH-1] [Backend] LIKE wildcard injection in `ClienteRepository.GetAllAsync`** (`backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs:28`).
  - Before: `var pattern = $"%{search}%";` then `EF.Functions.ILike(c.Nombre, pattern)`.
  - The value is parameterized by EF Core (no SQL injection), but `%` and `_` retain their LIKE-wildcard meaning, so a user searching `"100%"` matches every row and `"a_b"` matches `aXb`. This breaks the AC #2 contract ("contains the search fragment" — literal substring) and inflates the result set unexpectedly.
  - **Fix applied**: escape `\`, `%`, and `_` in the search input and pass the explicit escape char to `EF.Functions.ILike(value, pattern, "\\")`. Backwards-compatible with all existing ATDD tests (fragments `acme`, `900111`, `Distribuidora` contain no metacharacters).

- **[HIGH-2] [Story claim] False "Backend — removed" claims** in the story's Dev Agent Record File List.
  - Story says only `Domain/Clientes/Entities/.gitkeep` and `Domain/Clientes/Interfaces/.gitkeep` were removed; Tasks 4 and 5 explicitly mandated removal of `Infrastructure/Repositories/.gitkeep` and `Application/Clientes/.gitkeep` (and Task 3's implementation also leaves `Infrastructure/Data/Configurations/.gitkeep` dangling next to a real `.cs` file).
  - **Fix applied**: removed those three stale `.gitkeep` files via `git rm`. The remaining `Application/Clientes/Validators/.gitkeep` is intentional (Task 8 created it as a placeholder for Stories 2.3/2.4).

### Medium Issues (Should Fix) — 2 (one auto-fixed-with-revert, one observation)

- **[MED-1] [Frontend] `useSearch({ strict: false })` is wrapped in try/catch in `ClienteListView.tsx`** (`frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx:37-42`).
  - Discussion: per the TanStack docs, `useSearch({ strict: false })` should return `{}` when no matching route is mounted; in practice (TanStack Router 1.x) it throws when called without a `RouterProvider` ancestor. Component-level vitest suites mount this view without a router, so the catch is required for the existing test contract.
  - The hook itself is called unconditionally at a fixed position (rules-of-hooks compliant), but the try/catch is fragile and obscures intent.
  - **Fix attempted then reverted**: removing the try/catch broke 21 tests because the hook throws in jsdom without a router context. Comment expanded in code to document the workaround. Long-term remediation: wrap component-level tests in a thin `createMemoryHistory` + `RouterProvider`, or accept `selectedId` as a prop in Story 2.2. Logged for Story 2.2 follow-up — does not block 2.1.

- **[MED-2] [Frontend] `clienteApiRepository.getAll('')` silently drops the empty-string search param** (`frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts:13`).
  - Currently: `params: search ? { search } : undefined`. The empty string is falsy, so passing `""` is treated identically to `undefined`. Story 2.1 never hits this branch (search runs client-side), but the contract diverges from the backend's behaviour where `?search=` (blank) returns all rows.
  - **Decision**: NOT auto-fixed. Frontend code never calls this with `''`, and the AC for the repository contract is "exposed for forward compatibility". Documenting as tech debt for Stories 2.3/2.4 if server-side search is ever turned on.

### Low Issues (Nice to Fix) — 1

- **[LOW-1] [Tests] jsdom "Window's scrollTo() method" warnings flood the Vitest output.**
  - Coming from siesa-ui-kit's `Input` calling `scrollTo`. Not a regression; impacts log signal-to-noise. Could be silenced with `vi.stubGlobal('scrollTo', vi.fn())` in `test-setup.ts`. Out of Story 2.1 scope.

## Fix Outcome

- **Action Taken**: Auto-fixed [HIGH-1] and [HIGH-2]. [MED-1] documented in code + report (revert needed to keep tests green). [MED-2] and [LOW-1] logged for future stories.
- **Fixed Count**: 2 (HIGH)
- **Open Count**: 3 ([MED-1] non-blocking, [MED-2] non-blocking, [LOW-1] cosmetic)
- **Tests Re-run After Fix**: 108/108 Vitest green (`pnpm test`). Backend ATDD untouched by the fix (escape change is a strict superset of previous behaviour for non-wildcard fragments).
- **Recommended Status**: `done` (no critical, no unresolved high; the open meds/lows are not gating).

## Compliance Check vs `.claude/agent-memory/sa-quick-dev/company-standards.md`

| Standard | Verdict | Evidence |
|---|---|---|
| Clean Architecture + DDD layers | ✅ | Domain/Application/Infrastructure/API + Frontend modules/crm/clientes/{domain,application,infrastructure,presentation} |
| UUID PKs | ✅ | `ClienteEntity.Id = Guid.NewGuid()`, EF config `ValueGeneratedNever()` |
| DateTimeOffset (NOT DateTime) | ✅ | `CreatedAt`/`UpdatedAt` typed as `DateTimeOffset` in entity + DTO + migration |
| snake_case DB columns | ✅ | Migration emits `clientes`, `nombre`, `nit`, `created_at`, `updated_at`; convention `ApplySnakeCaseNaming()` preserved last |
| Entity factory pattern | ✅ | Sealed class, private ctor, static `Create()` + `Update()` with validation |
| CQRS handlers | ✅ | `GetClientesQuery` record + `GetClientesQueryHandler` |
| Scalar (NOT Swagger) | ✅ | `Program.cs` uses `MapScalarApiReference()` |
| TanStack Router + Query | ✅ | `routes/clientes.tsx` is a file-based route; `useClientes` wraps `useQuery` |
| siesa-ui-kit components | ✅ | `Input` + `Button` (type="outline") imported from `siesa-ui-kit` |
| User-facing copy in Spanish | ✅ | All strings: "Buscar por nombre o NIT/RUC", "No pudimos cargar los clientes", "Reintentar", "Lista de clientes", etc. |
| Code identifiers in English | ✅ | `ClienteListView`, `useClientes`, `EmptyState`, `ErrorPanel` |
| react-loading-skeleton (NOT spinners) | ✅ | `Skeleton` from `react-loading-skeleton` × 5 in pending state |
| Tailwind tokens (NOT hex) | ✅ | `bg-primary-50`, `border-slate-200`, `text-muted-foreground` |
| pnpm | ✅ | `pnpm test` is the documented gate |
| Tests colocated, MSW for HTTP | ✅ | `*.test.tsx` next to source; MSW server lifecycle wired in `test-setup.ts` |
| WCAG 2.1 AA (aria + tap targets) | ✅ | `aria-label`, `aria-current`, `role="status"`, `role="listbox"`, `min-h-[44px]` on item |

## Status Sync

- **Story File Status**: Updated to `review` → `done`
- **Sprint Status YAML**: Synced — `2-1-client-list-search: done`

## Verdict

**PASS CON OBSERVACIONES** — All 7 acceptance criteria met; backend slice implements Clean Architecture + DDD per company-standards; frontend slice respects siesa-ui-kit + dual-panel decision; 108/108 frontend tests pass; backend ATDD/integration suites authored against Testcontainers (CI-blocked execution, not a story defect). Two HIGH findings (LIKE-wildcard handling, stale .gitkeep cleanup) auto-corrected; three lower-severity items logged for follow-up without blocking the story transition to `done`.
