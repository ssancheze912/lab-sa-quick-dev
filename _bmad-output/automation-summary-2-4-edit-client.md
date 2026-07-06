# Automation Summary — Story 2.4: Edit Client

**Date:** 2026-07-06
**Story:** 2.4 — Edit Client
**Epic:** 2 — Client Management
**Mode:** BMad-Integrated (expansion of existing ATDD suite)
**Coverage Target:** critical-paths + edge cases

## Context

ATDD tests already existed and were GREEN per the story's Dev Agent Record (`dotnet test`: 89 unit + 72 integration; `npx vitest run`: 94/94; `npx playwright test e2e/tests/clientes`: 15/15):

- `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx` (17 tests — AC1 pre-fill + title, AC2 valid submit + toast + close + full-body payload, AC3 empty-field validation, AC4 Cancelar discards changes, 409 duplicate-NIT inline error)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs` (13 tests — per-field empty/whitespace, MaximumLength boundaries, all-empty)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs` (9 tests — NotFound/Success/Conflict outcomes, CreatedAt preservation, entity-forwarding)
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsUpdateTests.cs` (9 tests — 200 + DTO echo + persistence, 404 not-found, 400 missing fields + no-leak, 409 duplicate NIT + no-leak)
- `e2e/tests/clientes/clientes-edit.spec.ts` (TC-E2-P1-01/02 — pre-fill + immediate list/detail update, required-field validation blocks save)

This pass expanded coverage with edge cases, boundary conditions, and negative/error paths not exercised by the ATDD suite, without modifying any pre-existing ATDD test assertion. No new E2E specs were added — per the story's own Task 6 instruction, cancel/escape-level behavior belongs at the component level, and the pre-existing E2E specs remain the E2E surface for this story.

## Tests Created

### Component Tests (P1-P2, Vitest + RTL + MSW)

Extended `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx` (6 new tests):

- [P2] Generic safe message ("No se pudo guardar. Intenta de nuevo.") renders when `PUT` fails with 500 — this branch existed in code (shared with create) but was untested for edit mode
- [P2] The raw backend exception/technical string is never rendered on a 500 (NFR6)
- [P2] Generic safe message renders on a true network-layer failure (no HTTP response at all — the same code path a concurrent-delete 404 falls into, per the story's Dev Notes)
- [P2] Dialog stays open (no `onOpenChange(false)`) when `PUT` fails with 500, so the user can retry
- [P1] Pressing **Escape** discards changes and sends zero `PUT` requests — AC #4 explicitly says "Cancelar (or closes the dialog via Escape/overlay)" but only the "Cancelar" button click was covered by the ATDD suite
- [P1] Re-baseline regression guard: if the `cliente` prop changes to a *different* client while the dialog stays open, the form re-fills with the new client's values, not the stale previous ones — exercises the `useEffect([open, cliente])` dependency directly rather than only through the always-blank/always-same-client cases the ATDD suite covered

### Unit Tests (xUnit)

No gaps found — `UpdateClienteRequestValidatorTests.cs` and `UpdateClienteCommandHandlerTests.cs` already mirror `CreateCliente*`'s post-review structure exactly (per-field empty/whitespace, all four MaximumLength boundaries, NotFound/Success/Conflict/CreatedAt-preservation outcomes). Adding more here would duplicate coverage already exercised more cheaply at the integration level below.

### API/Integration Tests (P0-P2, xUnit + `WebApplicationFactory` + real PostgreSQL)

New file `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsUpdateEdgeCasesTests.cs` (9 new tests) — a new file rather than growing `ClienteEndpointsUpdateTests.cs` further, following the same "keep test files lean" convention Story 2.4's own Task 3 established:

- **[P0] `UpdateCliente_ReturnsOk_WhenNitIsUnchanged`** — the most important gap found: `ClienteForm` always submits the *full* current form values (AC #2), so the overwhelming majority of real edits resubmit the client's own unchanged NIT. Nothing in the ATDD suite proved this isn't mistaken for a self-conflict against `uk_clientes_nit`.
- [P0] `UpdateCliente_PersistsCiudadChange_WhenNitIsResubmittedUnchanged` — companion persistence check for the same scenario
- [P2] `UpdateCliente_ReturnsNotFound_WhenIdIsMalformedGuid` — mirrors `GetClienteById`'s existing malformed-Guid coverage, now proven for the `PUT` route too
- [P2] `UpdateCliente_ReturnsNotFound_WhenIdIsEmptyGuid` — `Guid.Empty` treated as any other well-formed-but-missing Id
- [P2] `UpdateCliente_ReturnsOk_WhenIdIsUppercaseGuid` — route-constraint case-insensitivity
- [P1] `UpdateCliente_WhitespaceOnlyNombre_Returns400` — the ATDD suite only proved *empty-string* Nombre → 400; whitespace-only is a distinct input shape hitting the same `NotEmpty()` guard
- [P2] `UpdateCliente_NombreAtMaxLength_ReturnsOk` — 200-character boundary accepted
- [P2] `UpdateCliente_NombreExceedsMaxLength_LeavesOriginalRecordUnchanged` — 201-character rejection leaves the original row untouched (no partial apply)
- [P2] `UpdateCliente_WithScriptTagInNombre_PersistsAsPlainText` — mirrors `CreateCliente`'s NFR5 injection-safety coverage for the edit path

**Total new tests: 15** (6 component + 9 integration), all GREEN on first run — no `test.fixme()` needed, no healing required.

## Test Healing Report

**Auto-Heal Enabled:** `config.tea_use_mcp_enhancements = false` → pattern-based healing (no MCP tools) — not invoked, since no test failed.
**Iterations Allowed:** 3

### Validation Results

- **Frontend (`ClienteForm.edit.test.tsx`, extended):** 21/21 passed on first run.
- **Full frontend `clientes` module (`npx vitest run src/modules/crm/clientes`):** 83/83 passed (8 files) — no regression in the 77 pre-existing tests.
- **`npx tsc -b`:** clean, no type errors introduced.
- **Backend unit (`dotnet test tests/SiesaAgents.UnitTests`):** 89/89 passed, unchanged (no new unit tests added — gap analysis found none worth adding without duplicating integration coverage).
- **Backend integration, new file only:** 9/9 passed on first run against real local PostgreSQL.
- **Full backend integration suite (`dotnet test tests/SiesaAgents.IntegrationTests`):** 81/81 passed (72 pre-existing + 9 new), no `[RequiresPostgresFact]` skips.

### Healing Outcomes

No healing was required — all 15 new tests passed on the first run across every level. No `test.fixme()` needed.

### Knowledge Base References Applied

- `test-levels-framework.md` — Component reserved for UI-state/interaction edge cases (Escape key, error-branch rendering, prop-change re-baseline); Integration reserved for HTTP-layer/DB-constraint concerns (self-NIT conflict, route Guid parsing, MaximumLength/DB boundary, injection safety) — no unit-level additions since the existing validator/handler suites already fully mirror the Create-side post-review pattern
- `test-priorities-matrix.md` — P0 for the self-NIT-conflict regression guard (the single highest-risk untested path, since it's the *default* real-world submission shape), P1 for whitespace-boundary/Escape-key coverage, P2 for route/boundary/injection polish
- `test-quality.md` — Given-When-Then, one behavior per test, deterministic (`HttpResponse.error()` for true network failures, `fireEvent.keyDown` for Escape instead of a timing-based interaction), `finally`-block DB cleanup, no page objects, no shared state
- `data-factories.md` — reused each file's existing `UniqueNit()`/`createCliente()`/`ClienteEndpointsTestBase` helpers rather than introducing new factory patterns
- `network-first.md` — MSW handlers registered via `server.use(...)` before interaction, consistent with the ATDD suite's established pattern

## Coverage Analysis

**Coverage Status:**

- ✅ AC1-AC4 happy/negative paths already covered by ATDD (unchanged, still GREEN) — this pass added the self-NIT-resubmission regression guard, Escape-key discard, prop-change re-baseline, and generic-500/network-failure branches, none of which the ATDD suite exercised.
- ✅ Highest-risk gap closed: a normal edit (change one field, resubmit the rest unchanged, including NIT) is now proven not to false-positive as a duplicate-NIT conflict against itself.
- ✅ AC #4 gap closed: the acceptance criterion's own text ("Cancelar (or closes the dialog via Escape/overlay)") had only the button-click path tested; Escape is now covered. Overlay-click was not added — Radix's overlay-click and Escape both funnel through the same `onOpenChange` callback tested by the Escape case, so adding a third assertion of the identical code path would be duplicate coverage per the "avoid duplicate coverage" principle.
- ✅ Route/boundary parity closed: `PUT /{id:guid}` now has the same malformed/empty/uppercase-Guid coverage `GET /{id:guid}` already had.
- ✅ NFR5/NFR6 parity closed: injection-safety and generic-error-message coverage, already present for create, is now present for edit too.

## Known Issue Investigated (Not Fixed — Third-Party Library)

**React warning across multiple `clientes` module tests:** `Received \`false\` for a non-boolean attribute \`error\`.`

- **Root cause:** `siesa-ui-kit`'s `Input` component (v1.0.256, installed from npm into `node_modules/siesa-ui-kit`) forwards its own `error` prop straight through to the underlying native `<input>` DOM element instead of consuming it internally before spreading `...rest`. `ClienteForm.tsx` correctly follows the documented API (`error={!!errors.nombre}`, a boolean, per `MasterCrud`/`siesa-ui-kit` conventions) — the warning fires whenever `error` is `false` (the common, non-error-state case), because React then tries to render a boolean as a DOM attribute.
- **Why not fixed here:** the defect is inside the installed third-party package (`node_modules/siesa-ui-kit`), not in this repository's application or test code. It is not introduced by, or specific to, Story 2.4 — it was reproduced by running the pre-existing `ClienteForm.test.tsx` (create mode, Story 2.3) as well, so it predates this story and affects every `Input` usage across the `clientes` module (and likely every other module using this component).
- **Recommendation:** report upstream to the `siesa-ui-kit` maintainers to either (a) destructure and consume `error`/`errorMessage` internally without spreading them onto the native `<input>`, or (b) coerce `error` to a `data-*` attribute/string before forwarding. No test or application code change can suppress this warning without either patching `node_modules` (non-durable) or wrapping `Input` in a local adapter (out of scope for a test-automation pass). Documented here for the team; not actioned as a fix.

## Definition of Done

- [x] All tests follow Given-When-Then format
- [x] All tests have priority tags (`[P0]`-`[P2]`) in names/comments
- [x] No hard waits; MSW `HttpResponse.error()` and `fireEvent.keyDown` used for deterministic simulation; `finally`-block cleanup for DB-seeded rows
- [x] No page objects; no new shared/global state introduced
- [x] Test files under the project's lean-file convention (new integration file is self-contained, ~250 lines)
- [x] 15/15 new tests pass on first run; 0 marked `test.fixme()`
- [x] Full frontend `clientes` module: 83/83 tests GREEN (`npx vitest run`); `npx tsc -b` clean
- [x] Full backend suite: 170/170 tests GREEN (`dotnet test`, 89 unit + 81 integration)
- [x] No duplicate coverage introduced (Component reserved for UI-state/interaction edge cases; Integration reserved for HTTP-layer/DB-constraint concerns)
- [x] Known non-blocking third-party issue investigated and documented (React `error` boolean-attribute warning in `siesa-ui-kit`'s `Input`)

## Next Steps

1. Run full suite in CI: `npx vitest run` (frontend), `dotnet test` (backend) — CI must provision a reachable PostgreSQL instance or the `[RequiresPostgresFact]` integration tests will soft-skip instead of validating.
2. Report the `siesa-ui-kit` `Input` `error`-attribute-forwarding warning upstream to the UI kit's maintainers (see "Known Issue Investigated" above) — not a blocker for this story, but worth a tracked ticket since it will keep appearing in every module's test output until fixed at the source.
3. Proceed to `bmad tea *trace` / quality gate once all Epic 2 stories are automated.
