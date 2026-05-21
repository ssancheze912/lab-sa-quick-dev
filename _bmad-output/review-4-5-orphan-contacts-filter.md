---
stepsCompleted: [1, 2, 3, 4, 5]
story_key: 4-5-orphan-contacts-filter
story_path: _bmad-output/implementation-artifacts/stories/4-5-orphan-contacts-filter.md
verdict: PASS
---

# Code Review: 4-5-orphan-contacts-filter

- **Date**: 2026-05-21
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: PASS (post auto-fix)

## Initial Discovery

- **Undocumented Changes (in git, not in story File List)**:
  - `e2e/tests/asociacion/asociacion-filtro-huerfanos-edge.spec.ts` (commit 731593e) — added to story File List
- **False Claims (in story, not correctly implemented)**:
  - Story claims `AssignClienteCommandHandlerEdgeCaseTests.cs` was modified with `GetOrphanAsync` — it was NOT
  - Story claims `AssignClienteCommandHandlerTests.cs` was modified with `GetOrphanAsync` — NOT in develop branch
  - Story claims `ContactoEndpoints.cs` sinCliente param was pre-implemented in epic branch — NOT in develop
  - Story claims `Program.cs` DI registration was pre-implemented — NOT in develop

## Review Plan

### Items Verified
- [x] AC1: sinCliente filter shows only contacts with clienteId null — implemented in ContactoListView.tsx
- [x] AC2: EmptyState when all contacts have a client — implemented with distinct title/description
- [x] AC3: Deactivating filter restores full list — useState toggle correct
- [x] Task 1: GetOrphanContactosQuery + Handler + IContactoRepository.GetOrphanAsync + ContactoRepository.GetOrphanAsync — verified
- [x] Task 2: filterOrphanContactos utility — verified
- [x] Task 3: ContactoListView toggle + count badge + filter pipeline — verified
- [x] Task 4: POM locators filtroSinCliente + orphanCount — verified
- [x] Task 5: Frontend unit tests UNIT-AC-04, UNIT-AC-05 (4 tests) — verified
- [x] Task 6: Backend unit tests UNIT-B-AC-ORPHAN-01, UNIT-B-AC-ORPHAN-02 — verified
- [x] Task 7: E2E tests E2E-AC-16 through E2E-AC-19 — verified
- [x] Task 8: API-AC-06 added to asociacion-api.spec.ts — verified

## Review Findings

### Critical Issues (Auto-Fixed)

- [CRITICAL — AUTO-FIXED] `backend/src/SiesaAgents.API/Program.cs` — `GetOrphanContactosQueryHandler` was NOT registered in the `develop` branch. The story implementation commit (32b8cc3) added the handler class but did not wire it into DI. At runtime, the endpoint would throw a 500 DI resolution error for `?sinCliente=true` requests. **Fix:** Added `builder.Services.AddScoped<GetOrphanContactosQueryHandler>()` after `GetContactosByClienteIdQueryHandler` registration.

- [CRITICAL — AUTO-FIXED] `backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs` — `GET /api/v1/contactos` in `develop` branch did NOT support `?sinCliente=true` query param. The entire orphan dispatch branch was missing. API-AC-06 integration test would fail. **Fix:** Added `[FromQuery] bool? sinCliente` param, `GetOrphanContactosQueryHandler orphanHandler` param, and the `if (sinCliente == true)` branch dispatching to `orphanHandler`.

- [CRITICAL — AUTO-FIXED] `backend/tests/SiesaAgents.UnitTests/Handlers/AssignClienteCommandHandlerEdgeCaseTests.cs` — Both `CapturingContactoRepository` and `CancellingContactoRepository` fake repository implementations did NOT implement `GetOrphanAsync` from `IContactoRepository`. This is a compilation error — the solution would not build. The story dev notes falsely claimed this file was updated. **Fix:** Added `GetOrphanAsync` returning empty collection to both fake implementations.

- [CRITICAL — AUTO-FIXED] `backend/tests/SiesaAgents.UnitTests/Handlers/AssignClienteCommandHandlerTests.cs` — `CapturingContactoRepository` also missing `GetOrphanAsync`. The feature branch (rq4) had this fixed, but the `develop` branch commit missed it for this specific file. **Fix:** Added `GetOrphanAsync` returning empty collection.

### Medium Issues

None found.

### Low Issues / Suggestions

- [WARN] E2E-AC-16 (`toHaveCount(2)`) and E2E-AC-17 (`/2 sin cliente/i`) assert exact counts that assume no pre-existing orphan contacts in the test database. Parallel test execution or cleanup failures between tests could cause flakiness. Acceptable risk given the `afterEach` cleanup pattern and unique contact names, but worth noting.

- [INFO] `e2e/tests/asociacion/asociacion-filtro-huerfanos-edge.spec.ts` was missing from the story File List. Added to file list.

## Compliance Check

| Standard | Status | Notes |
|----------|--------|-------|
| Clean Architecture | PASS | filterOrphanContactos in application/, handler in Application layer, repo in Infrastructure |
| DateTimeOffset (no DateTime) | PASS | ContactoEntity uses DateTimeOffset, test asserts Assert.IsType<DateTimeOffset> |
| UUID PKs | PASS | Guid.NewGuid() in ContactoEntity.Create factory |
| TypeScript strict (no `any`) | PASS | Proper type imports, Contacto[] typed |
| FluentValidation | N/A | Read-only query, no input validation needed |
| Spanish UI text | PASS | "Sin cliente", "Todos los contactos tienen cliente", etc. |
| WCAG 2.1 AA | PASS | aria-pressed={sinClienteActive}, aria-label on button |
| Skeleton loading | PASS | react-loading-skeleton used for isLoading state |
| Siesa Blue (#0e79fd) | PASS | Active toggle uses bg-[#0e79fd] |
| DDD entity pattern | PASS | ContactoEntity.Create() factory, private constructor |
| Test structure (AAA) | PASS | Arrange/Act/Assert in unit tests |

## Outcome

**PASS** — 3 critical compilation/runtime bugs auto-fixed. Implementation is correct and complete. All ACs satisfied.
