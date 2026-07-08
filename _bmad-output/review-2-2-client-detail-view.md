---
stepsCompleted: [1, 2, 3, 4]
story_path: _bmad-output/implementation-artifacts/2-2-client-detail-view.md
story_key: 2-2-client-detail-view
reviewer: sa-code-review (autonomous)
---

# Code Review: 2-2-client-detail-view

- **Date**: 2026-07-08
- **Reviewer**: gaduranb@siesa.com (AI Agent — Adversarial Senior Developer)
- **Story Status (input)**: review
- **Verdict**: PASS CON OBSERVACIONES

## Initial Discovery

### Git vs Story File List

**Uncommitted (git) — 7 modified + 18 untracked:**
- M `_bmad-output/automation-summary.md`
- M `_bmad-output/implementation-artifacts/2-2-client-detail-view.md`
- M `_bmad-output/implementation-artifacts/sprint-status.yaml`
- M `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- M `backend/src/SiesaAgents.API/Program.cs`
- M `frontend/src/routes/clientes.$clienteId.tsx`
- M `frontend/src/test/factories/cliente.factory.ts`
- ?? `_bmad-output/atdd-checklist-2.2.md`
- ?? `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQuery.cs`
- ?? `backend/src/SiesaAgents.Application/Clientes/Queries/GetClienteByIdQueryHandler.cs`
- ?? `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdEdgeTests.cs`
- ?? `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdTests.cs`
- ?? `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerEdgeTests.cs`
- ?? `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
- ?? `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`
- ?? `frontend/src/modules/crm/clientes/application/useCliente.edge.test.ts`
- ?? `frontend/src/modules/crm/clientes/application/useCliente.test.ts`
- ?? `frontend/src/modules/crm/clientes/application/useCliente.ts`
- ?? `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge.test.tsx`
- ?? `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- ?? `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- ?? `frontend/src/routes/clientes.$clienteId.test.tsx`
- ?? `frontend/src/shared/components/ClienteNotFound.edge.test.tsx`
- ?? `frontend/src/shared/components/ClienteNotFound.test.tsx`
- ?? `frontend/src/shared/components/ClienteNotFound.tsx`

**Files in Git but NOT in Story File List (documentation gap — auto-fixed below):**
- `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsGetByIdEdgeTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerEdgeTests.cs`
- `frontend/src/modules/crm/clientes/application/useCliente.edge.test.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.edge.test.tsx`
- `frontend/src/shared/components/ClienteNotFound.edge.test.tsx`
- `e2e/tests/clientes/story-2-2-client-detail-view.spec.ts`

**Files in Story but NOT in Git**: None (all claimed files exist).

## Review Plan

### AC Validation Focus
- AC #1/#2/#7 — Deep-link and selection switching → `ClienteDetailView.tsx`, `clientes.$clienteId.tsx`.
- AC #3/#4 — 404 + non-UUID short-circuit → `ClienteNotFound.tsx`, `useCliente.ts`.
- AC #5 — Skeleton loading → `ClienteDetailView.tsx (ClienteDetailSkeleton)`.
- AC #6 — Non-404 error branch → `ErrorPanel` re-used from Story 2.1.
- AC #8/#9/#10 — Backend `GET /api/v1/clientes/{id:guid}` → `ClienteEndpoints.cs`, `GetClienteByIdQueryHandler.cs`.
- AC #11/#12 — Build/test gates.

### Standards Compliance Focus
- .NET 10 Minimal API + Clean Arch layering.
- UUID PK, `DateTimeOffset`, snake_case.
- Frontend: TS strict (no `any`), Spanish user-facing text, Zustand not used (URL is source of truth), TanStack Query keys.
- Company standard: "Skeleton screens, not spinners".

## Review Findings

### Critical Issues (Must Fix)

_None_ — build passes (0 warnings/0 errors backend, TS strict clean frontend), all 121/121 backend and 248/248 frontend tests pass. Every AC has direct code evidence and passing tests.

### Medium Issues (Should Fix)

- **[MED-1] File List documentation drift** — Six files exist in git but are missing from the story's `## Dev Agent Record → File List` (five Automate-phase edge tests + one E2E spec). Workflow rule step-03.1 marks "Files in Git but NOT in Story" as MEDIUM (incomplete documentation). **Auto-fixed** below.
- **[MED-2] Debug Log References count drift** — Story claims `104/104` backend + `217/217` frontend tests, but actual counts are `121/121` and `248/248` (17 backend edge tests + 31 frontend edge tests were added during the Automate phase after the story was written). **Auto-fixed** below.
- **[MED-3] Duplicated `FakeClienteRepository` and `ClienteResponse` across 5 backend test files** — Story explicitly recommended (line 486) lifting the fake into `backend/tests/SiesaAgents.UnitTests/Fakes/FakeClienteRepository.cs` before Story 2.4/2.5 land. Duplication is currently in `ClienteEndpointsTests.cs`, `ClienteEndpointsGetByIdTests.cs`, `ClienteEndpointsGetByIdEdgeTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerEdgeTests.cs`. Not auto-fixed here (out of story scope; recommended refactor for Story 2.3/2.4).
- **[MED-4] Retry policy diverges from Dev Notes** — Dev Notes suggested `failureCount < 2` for non-404 (bounded retry for transient hiccups); the shipped `useCliente` uses `retry: false` for ALL errors. Rationale documented in Completion Notes (ATDD test expects ErrorPanel on the FIRST 500). Acceptable UX (manual `Reintentar` button drives recovery), but 401/503 transient blips won't self-heal. No action taken — the tradeoff is documented and covered by ATDD tests.

### Low / Suggestion Issues (Nice to Fix)

- **[LOW-1] Duplicated `isValidClienteId` invocation** in `ClienteDetailView.tsx` and inside `useCliente.ts`. The presentation layer imports `isValidClienteId` separately to gate on the same boolean the hook computes. Non-blocking; a future refactor could have the hook expose `isDisabled` in its return shape.
- **[LOW-2] Defensive dead branch** in `ClienteDetailView.tsx` — `if (!query.data)` after the `!enabled` / `isLoading` / `isError` guards is effectively unreachable for `useQuery` when the query is enabled and not errored. Small readability cost; not a correctness issue.
- **[LOW-3] Nested landmarks** — `ClienteDetailView` renders an `<article>` inside Story 2.1's `<section aria-label="Detalle del cliente">`. Not a WCAG violation (article is a landmark inside a section is allowed), but a screen-reader may announce two labels. Consider dropping the outer `aria-label` or the inner `<article>` in a later refactor.
- **[LOW-4] Axios `apiClient` has no request `timeout`** (inherited from Story 2.1). A hung backend leaves the skeleton on-screen indefinitely. Out of Story 2.2 scope.
- **[LOW-5] Test-side lifetime mismatch** — Endpoint tests register the fake as `AddSingleton<IClienteRepository>` while production DI uses `AddScoped`. Works because the fake is stateless per test-server lifetime; flag for future scoped-repo tests.
- **[LOW-6] `<div>` wrappers around `<dt>/<dd>` inside `<dl>`** in `ClienteDetailView.Field`. Valid HTML5 (per WHATWG), but some older assistive tech may parse `<dl>` semantics less optimally. Non-blocking.

### Positive Observations (Standards Compliance — verified)

- Clean Architecture layering respected: `GetClienteByIdQuery` is a pure record in `Application`, handler returns `null` (no HTTP concern), endpoint layer converts `null → 404`, repository interface stays in `Domain`.
- Backend: UUID PK, `DateTimeOffset` throughout, `:guid` route constraint used for AC #10, `Results.NotFound()` flows through `UseStatusCodePages` → RFC 7807 `application/problem+json` (AC #9 anti-leak asserted).
- Frontend: TanStack Query key convention `['clientes', id]` respected; Zustand not introduced; Spanish user-facing text verbatim; siesa-ui-kit `Button type="outline"` matches project convention; `aria-live="polite"` + `role="status"` for the not-found panel; skeleton (not spinner) for loading.
- No new NuGet packages, no EF migration, no `any` types introduced, no `console.*` calls added.
- All 12 ACs covered by executable tests (unit + component + routing-integration + E2E).

## Fix Outcome

- **Action Taken**: Auto-fix documentation drift (File List + Debug Log). No code changes to production/tests (all AC-verified, all tests green).
- **Fixed Count**: 2 (MED-1, MED-2).
- **Remaining Action Items (non-blocking, deferred)**: MED-3 (refactor `FakeClienteRepository` to shared file) — best done in Story 2.3/2.4.
- **Recommended Status**: `done` — every AC has passing tests, build + typecheck clean, no critical/high issues, only documentation-hygiene mediums (auto-fixed).
