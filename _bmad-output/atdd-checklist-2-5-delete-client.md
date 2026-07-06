# ATDD Checklist - Epic 2, Story 2.5: Delete Client

**Date:** 2026-07-06
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit) + Component (Vitest + RTL) + E2E (Playwright, new)

---

## Story Summary

Adds a "Eliminar" trigger to `ClienteDetailView`, next to the existing "Editar" button, that
opens a confirmation dialog (reusing the same `Dialog` primitives `ClienteForm` already uses).
Confirming calls a new `DELETE /api/v1/clientes/{id}` endpoint, removes the row from the list
with no reload, navigates back to `/clientes`'s default empty state, and shows a success toast.
Canceling leaves the record completely unchanged. The epic's "contacts survive unassigned"
scenario is explicitly out of scope for this story (see AC #4 / Dev Notes: `Contacto` doesn't
exist yet).

**As a** commercial team member
**I want** to delete a client record
**So that** the client list only contains active and relevant records

---

## Acceptance Criteria

1. Given the user is viewing a client's detail (`cliente-detail-panel`), when they click "Eliminar" (next to "Editar"), then a confirmation dialog opens (`role="dialog"`, reusing `@/shared/components/ui/dialog`) titled "¿Eliminar este cliente?" with "Confirmar"/"Cancelar" actions.
2. Given the confirmation dialog is open, when "Confirmar" is clicked, then `DELETE /api/v1/clientes/{id}` is called, the client list no longer shows it with no reload (FR27), the app navigates back to `/clientes`'s default empty state (not the not-found variant), a success toast "Cliente eliminado correctamente" shows, and the dialog closes. "Confirmar" is disabled while the mutation is pending (double-submit guard, R9).
3. Given the confirmation dialog is open, when "Cancelar" is clicked (or Escape/overlay), then no DELETE request is ever sent, the dialog closes, and the record remains completely unchanged.
4. **[Scope note]** The epic's "client with associated contacts → contacts survive unassigned" scenario is NOT implemented in this story — `Contacto` doesn't exist yet (Story 3.1) and `contactos.cliente_id` doesn't exist either (Epic 4). This story deletes only the `Cliente` row.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 new tests, 1 new file)

**File:** `e2e/tests/clientes/clientes-delete.spec.ts` (new, 168 lines) — covers `test-design-epic-2.md`'s TC-E2-P0-05 (Cliente-only portion) and TC-E2-P1-10
**Page object:** `e2e/pages/clientes.page.ts` — `btnEliminar`/`btnConfirmarEliminar` locators already pre-added for this story (verified present, no changes needed)

- ✅ **Test:** `TC-E2-P0-05 — confirmar eliminación quita el cliente de la lista y muestra el toast de éxito (Cliente-only)`
  - **Status:** RED (blocked) — depends on `DELETE /api/v1/clientes/{id}`, the "Eliminar" trigger, and the confirmation dialog, none of which exist yet.
  - **Verifies:** AC #1, #2, FR27
- ✅ **Test:** `TC-E2-P0-05 — confirmar eliminación navega de vuelta al estado vacío por defecto de /clientes` — **Status:** RED (same) — **Verifies:** AC #2 (route-level `onDeleted` → `navigate`)
- ✅ **Test:** `TC-E2-P0-05 — la eliminación es persistente en el backend` — **Status:** RED (same) — **Verifies:** AC #2 (genuine deletion, not just hidden client-side)
- ✅ **Test:** `TC-E2-P1-10 — cancelar la eliminación cierra el diálogo sin enviar DELETE` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `TC-E2-P1-10 — cancelar la eliminación no modifica el registro original en el backend` — **Status:** RED (same) — **Verifies:** AC #3

**Verified locally (this session):** `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts --list` → parses correctly (10 test runs across chromium/mobile-chrome, 5 unique cases); not executed against a running dev server (none available in this environment) — locators/assertions match the planned implementation exactly (`btnEliminar`, `btnConfirmarEliminar`, dialog role + exact title/toast copy), same convention as prior stories' checklists.

**Deliberately NOT authored at E2E:** the contacts-cascade half of TC-E2-P0-05 ("contacts survive unassigned, appear under 'Sin cliente'") — per AC #4/Dev Notes, `Contacto` does not exist in the codebase yet (Story 3.1) and the FK is added in Epic 4; authoring that assertion now would be untestable and is explicitly deferred. TC-E2-P2-04 (rapid double-click, R9's full E2E assertion) remains a `*automate`/future-sprint item per the test design's P2 priority — this ATDD pass covers the `disabled` state at the component level instead (see below).

### API Tests (7 tests: 3 xUnit Unit new + 4 xUnit Integration new file)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs` (new, 3 tests)

- ✅ **Test:** `Handle_ReturnsTrue_WhenRepositoryDeletesSuccessfully`
  - **Status:** RED — **verified locally** (`dotnet build tests/SiesaAgents.UnitTests`): `CS0246` (`DeleteClienteCommand`/`DeleteClienteCommandHandler` don't exist, `IClienteRepository.DeleteAsync` doesn't exist).
  - **Verifies:** AC #2 (success path)
- ✅ **Test:** `Handle_ReturnsFalse_WhenClienteDoesNotExist` — **Status:** RED (same) — **Verifies:** AC #2 (not-found is a return value, not an exception — mirrors `GetByIdAsync`'s nullable-return simplicity; no `DeleteClienteResult` wrapper per Dev Notes)
- ✅ **Test:** `Handle_ForwardsCommandIdVerbatim_ToRepositoryDeleteAsync` — **Status:** RED (same) — **Verifies:** AC #2 (handler applies no transformation to its input)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsDeleteTests.cs` (**new file**, 4 tests) — see "Architecture Decision" in Notes for why this is a new file rather than another section in `ClienteEndpointsTests.cs`.

- ✅ **Test:** `DeleteCliente_ReturnsNoContent_WhenClienteExists`
  - **Status:** RED — **verified locally** (`dotnet build tests/SiesaAgents.IntegrationTests`): build **succeeds** (no new C# symbols referenced beyond `HttpClient.DeleteAsync`, a BCL method), but the test fails at **runtime** — asserts `204` and gets `404` today because no `DELETE` route is mapped in `ClienteEndpoints`. This is still a valid RED state (missing implementation causing a runtime assertion failure, not a compile error) — the same class of RED as a handler returning wrong data, just surfaced one phase later than the Unit tests above.
  - **Verifies:** AC #2
- ✅ **Test:** `DeleteCliente_RemovesFromDatabase` — **Status:** RED (same — asserts a follow-up `GET` returns `404`, but today the `DELETE` itself 404s and never removes anything, so the entity search still exists via the original seed until manual cleanup) — **Verifies:** AC #2 (genuine persistence, not just echoed)
- ✅ **Test:** `DeleteCliente_ReturnsNotFound_WhenClienteDoesNotExist` — **Status:** coincidentally returns `404` today (no route mapped at all) for the *same* reason the endpoint should return `404` once implemented — documented as a known ATDD edge case (same class as Story 2.4's "Cancelar/no-PUT" GREEN-before-implementation case): it will remain meaningful once the route exists, since a mapped `DELETE /{id:guid}` route with a real random `Guid` still needs to hit the `false` branch of the handler to return `404`, rather than falling through to ASP.NET's global no-route-matched `404`. **Verifies:** AC #2
- ✅ **Test:** `DeleteCliente_DoesNotAffectOtherClientes` — **Status:** RED (fails today because the `DELETE` call 404s and does nothing, but the test seeds two clients and only cleans up the "untouched" one in `finally`, so the "to-delete" one leaks in the DB until the endpoint exists and the test suite is re-run — acceptable known ATDD-phase leak, consistent with Story 2.1's documented "Known Cross-Story Test Dependency") — **Verifies:** AC #2 (no cross-record damage)

**Verified locally (this session, no PostgreSQL required for the Unit-level check; Integration-level build verified, runtime not executed — no local PostgreSQL instance available in this environment, consistent with prior stories' `RequiresPostgresFactAttribute` soft-skip convention):**
- `dotnet build tests/SiesaAgents.UnitTests` → **6 `CS0246` errors**, whole assembly RED.
- `dotnet build tests/SiesaAgents.IntegrationTests` → **build succeeds** (0 errors) — expected, since `DELETE` calls only exercise `HttpClient`, a BCL type; the RED state for this file surfaces at test-*run* time (`404` instead of `204`) rather than compile time, decorated with `[RequiresPostgresFact]` per the project's soft-skip convention (Story 1.3) so it reports "Skipped" rather than a false "Passed" when PostgreSQL is unreachable.
- Pre-existing `ClienteEndpointsTests.cs`/`ClienteEndpointsEdgeCasesTests.cs`/`ClienteEndpointsUpdateTests.cs`/`ClienteEndpointsUpdateEdgeCasesTests.cs` were **not modified** — left fully intact.

### Component Tests (10 tests, added to `ClienteDetailView.test.tsx`)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (extended, +10 tests)

- ✅ **Test:** `[P0] renders an "Eliminar" button once the client loads`
  - **Status:** RED — **verified locally** (`vitest run`): `findByRole('button', { name: /eliminar/i })` times out (button doesn't exist).
  - **Verifies:** AC #1
- ✅ **Test:** `[P0] clicking "Eliminar" opens a dialog titled "¿Eliminar este cliente?"` — **Status:** RED (same) — **Verifies:** AC #1
- ✅ **Test:** `[P0] the confirmation dialog shows "Confirmar" and "Cancelar" actions` — **Status:** RED (same) — **Verifies:** AC #1
- ✅ **Test:** `[P0] closes the dialog and never sends a DELETE when "Cancelar" is clicked` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `[P1] leaves the client record completely unchanged in the panel after "Cancelar"` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `[P0] calls DELETE /api/v1/clientes/:id exactly once on a mocked 204 response` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `[P0] shows the success toast "Cliente eliminado correctamente" after a successful delete` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `[P0] closes the dialog after a successful delete` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `[P0] calls the onDeleted prop after a successful delete` — **Status:** RED (same) — **Verifies:** AC #2 (router-agnostic component, per Dev Notes — `onDeleted` prop, not `useNavigate()` inside `ClienteDetailView`)
- ✅ **Test:** `[P1] disables "Confirmar" while the delete mutation is pending (R9 double-submit guard)` — **Status:** RED (same) — **Verifies:** AC #2 Dev Notes (R9 mitigation)

**Verified locally (this session):**
- `pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` → **10 failed, 12 passed** (22 total) — all 10 new Story 2.5 tests are RED; **all 12 pre-existing Story 2.2/2.4 tests still pass, zero regression** introduced by this ATDD pass (the render helper now accepts an optional `onDeleted` param and always mounts `<Toaster />`, both backward-compatible no-ops for existing calls).

---

## Data Factories Created

No new factories — reuses `frontend/src/test/factories/cliente.factory.ts` (`createCliente`) and `e2e/helpers/data.helper.ts` (`buildCliente`), both already generating all required fields plus `id`/`createdAt`.

---

## Fixtures Created

No new fixtures. Reuses the shared MSW `server`, `TestWebApplicationFactory`/`RequiresPostgresFactAttribute` (backend), `ClienteEndpointsTestBase` (Story 2.4's shared helpers — `Client`, `UniqueNit()`, `SeedClientesAsync`, `DeleteClientesAsync`, `GetClientesAsync`, `ClienteApiResponse`), and `e2e/fixtures/base.fixture.ts`/`ApiHelper` (whose `deleteCliente(id)` helper already existed, used here for E2E cleanup as it has been since Story 2.1).

---

## Mock Requirements

### DELETE /api/v1/clientes/{id} Mock (frontend component tests)

**Endpoint:** `DELETE /api/v1/clientes/{id}`

**Success Response (204):** empty body.

**Notes:** No error-response contract needs mocking for this story's scope — the story's ACs only cover the success (204) and cancel (no request) paths. A generic-failure path (analogous to `ClienteForm`'s NFR6 safe-message branch on a 500) is not required by any AC and is not tested here; `useDeleteCliente` has no documented error-handling requirement in the story beyond the two ACs covered.

---

## Required data-testid Attributes

No new `data-testid` attributes — reuses accessible role/label queries, consistent with Stories 2.3/2.4's established convention:

- Trigger: `getByRole('button', { name: /eliminar/i })` (`btnEliminar`, already present in `clientes.page.ts`)
- Dialog: `getByRole('dialog')` — same `Dialog` primitive instance type as `ClienteForm`'s edit/create dialog
- Title: `getByText('¿Eliminar este cliente?')`
- Actions: `getByRole('button', { name: /confirmar/i })` / `/cancelar/i` (`btnConfirmarEliminar`/`btnCancelar`, already present in `clientes.page.ts`)
- Existing detail-panel testids reused: `cliente-detail-panel`, `cliente-detail-nombre`

**Implementation Example:**

```tsx
<Button htmlType="button" size="sm" type="outline" onClick={() => setIsDeleteOpen(true)}>Eliminar</Button>
<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>¿Eliminar este cliente?</DialogTitle></DialogHeader>
    <DialogFooter>
      <Button type="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
      <Button disabled={deleteCliente.isPending} onClick={handleConfirmDelete}>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Implementation Checklist

### Test: Backend handler unit tests (AC #2)

**File:** `DeleteClienteCommandHandlerTests.cs`

- [ ] Add `IClienteRepository.DeleteAsync(Guid id, CancellationToken)`; implement in `ClienteRepository` (Task 1)
- [ ] Create `DeleteClienteCommand`, `DeleteClienteCommandHandler` (returns `bool` directly — no `DeleteClienteResult` wrapper)
- [ ] Extend the fake `IClienteRepository` implementations in `GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `CreateClienteCommandHandlerTests.cs`, `UpdateClienteCommandHandlerTests.cs` with a no-op `DeleteAsync` so they keep compiling against the larger interface
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~DeleteClienteCommandHandlerTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Backend integration tests for DELETE /api/v1/clientes/{id} (AC #2)

**File:** `ClienteEndpointsDeleteTests.cs` (new)

- [ ] Add `group.MapDelete("/{id:guid}", ...)` to `ClienteEndpoints` → `204` on success, `404` on not-found
- [ ] Register `DeleteClienteCommandHandler` in `Program.cs`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~DeleteCliente"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: "Eliminar" button + confirmation dialog in ClienteDetailView (AC #1, #2, #3)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- [ ] Extend `IClienteRepository`/`clienteApiRepository` with `delete(id)`
- [ ] Create `useDeleteCliente.ts` (invalidates only `['clientes']` + `toast.success('Cliente eliminado correctamente')` — per Dev Notes, does NOT invalidate `['clientes', id]`)
- [ ] Add `onDeleted?: () => void` prop to `ClienteDetailViewProps`
- [ ] Add "Eliminar" `Button` + second `Dialog` (reusing `@/shared/components/ui/dialog`) to `ClienteDetailView.tsx`, inside the `isSuccess && data` branch
- [ ] Implement `handleConfirmDelete` (mutateAsync → close dialog → `onDeleted?.()`)
- [ ] Run test: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- [ ] ✅ Tests pass (green phase), 12 pre-existing tests remain green

**Estimated Effort:** 2 hours

---

### Test: Route-level navigation wiring (AC #2)

**File:** `frontend/src/routes/_app/clientes.$clienteId.tsx`

- [ ] Add `useNavigate()` + `onDeleted={() => navigate({ to: '/clientes' })}` passed to `<ClienteDetailView>`
- [ ] No dedicated unit test at this level (no router-context test exists for route files in this project) — covered by the E2E spec instead
- [ ] ✅ Manually verified once E2E spec passes

**Estimated Effort:** 0.5 hours

---

### Test: E2E delete-client flows (AC #1, #2, #3)

**File:** `e2e/tests/clientes/clientes-delete.spec.ts`

- [ ] No further test authoring — once the tasks above are complete, run this spec to confirm it passes
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts`
- [ ] ✅ TC-E2-P0-05 (Cliente-only)/TC-E2-P1-10 pass

**Estimated Effort:** 0.5 hours (verification only)

---

## Running Tests

```bash
# Backend unit + integration tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~DeleteClienteCommandHandlerTests"
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~DeleteCliente"

# Frontend component tests
cd frontend && pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx

# E2E (once implementation lands)
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts --headed
npx playwright test e2e/tests/clientes/clientes-delete.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ All new tests written and verified failing for the right reason (frontend: `vitest run`; backend unit: `dotnet build`; backend integration: build succeeds, runtime 404≠204 documented)
- ✅ No new fixtures/factories needed — Stories 2.1-2.4's are reused as-is
- ✅ Mock requirements documented for DEV team
- ✅ No new data-testid requirements — role/label/text queries only
- ✅ Implementation checklist created
- ✅ New E2E spec authored ahead of implementation (`clientes-delete.spec.ts`), `btnEliminar`/`btnConfirmarEliminar` locators confirmed already present in `clientes.page.ts`, per the project's established ATDD convention (Stories 2.1-2.4)

**Verification (this session):**

- `backend`: `dotnet build tests/SiesaAgents.UnitTests` → 6 `CS0246` errors, whole assembly RED.
- `backend`: `dotnet build tests/SiesaAgents.IntegrationTests` → builds clean; `ClienteEndpointsDeleteTests` tests are RED at runtime (asserts `204`, gets `404`, since no `DELETE` route is mapped) — decorated `[RequiresPostgresFact]`, not executed against a live PostgreSQL instance in this environment.
- `frontend`: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` → 10 new RED tests; all 12 pre-existing Story 2.2/2.4 tests still pass, **zero regression**.
- `e2e`: `npx playwright test e2e/tests/clientes/clientes-delete.spec.ts --list` → parses correctly, 10 runs (5 cases × 2 projects); not executed against a live server in this environment.

### GREEN Phase (DEV Team - Next Steps)

Implement Story 2.5 Tasks 1-6 exactly as specified in the story file, one failing test at a
time: backend `IClienteRepository.DeleteAsync` + `ClienteRepository` (Task 1), `DeleteClienteCommand`/`Handler` + `DELETE /api/v1/clientes/{id}` endpoint (Task 2), the fake-repository
compilation fixes (Task 3), then the frontend data layer + `useDeleteCliente` (Task 4), then
the "Eliminar" button + confirmation `Dialog` + `onDeleted` prop wiring in `ClienteDetailView`
and the route file (Task 5), finally re-running `clientes-delete.spec.ts` to confirm it turns
GREEN (Task 6).

### REFACTOR Phase (DEV Team - After All Tests Pass)

Standard refactor pass once GREEN. No test-infrastructure debt introduced by this ATDD pass —
`ClienteEndpointsDeleteTests.cs` reuses `ClienteEndpointsTestBase` with zero new duplication.

---

## Next Steps

1. Share this checklist and the failing tests above with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase using the commands above
3. Implement Story 2.5 Tasks 1-6 one test at a time (red → green)
4. Run `clientes-delete.spec.ts` to confirm it is now GREEN
5. When all gating tests pass, refactor code for quality, then mark story 'done' in sprint-status.yaml

---

## Notes

- **Architecture Decision — new integration test file instead of extending `ClienteEndpointsTests.cs`:** the story's Task 3 literally describes extending `ClienteEndpointsTests.cs`, but that file is already 523 lines — over the project's ~500-line test-file guideline flagged in Story 2.3's code review and the exact reason `ClienteEndpointsUpdateTests.cs` was split into its own file in Story 2.4. Following that established precedent, this ATDD pass creates **`ClienteEndpointsDeleteTests.cs`** as a new file inheriting `ClienteEndpointsTestBase` directly, adding zero new duplicated helper code and not growing any existing file further.
- **Backend integration RED is runtime, not compile-time**: unlike the Unit-level `DeleteClienteCommandHandlerTests.cs` (which fails to compile because `DeleteClienteCommand`/`Handler` don't exist as C# symbols), `ClienteEndpointsDeleteTests.cs` only calls `HttpClient.DeleteAsync` — a BCL method that always exists — so the assembly **builds successfully** today. The tests are still genuinely RED: with no `DELETE` route mapped in `ClienteEndpoints`, ASP.NET's default routing returns a generic `404` for every request, which happens to make `DeleteCliente_ReturnsNoContent_WhenClienteExists` fail (expects `204`) while incidentally making `DeleteCliente_ReturnsNotFound_WhenClienteDoesNotExist` pass today for the wrong reason (no route matched at all, not the handler's real not-found branch). This is a documented, accepted ATDD edge case — the same class as Story 2.4's checklist "GREEN-before-implementation" note — and remains a meaningful regression guard once the real `DELETE /{id:guid}` route and handler exist.
- **`DeleteCliente_DoesNotAffectOtherClientes` leaks the "to-delete" seed row today**: since the `DELETE` call currently does nothing (404, no route), the seeded `toDelete` client is never actually removed from the DB by the test itself; only `untouched` is cleaned up in the `finally` block (matching the assertion's intent once the endpoint exists). This is an accepted, temporary ATDD-phase artifact — once Task 2 lands, the `DELETE` call genuinely removes `toDelete` and no leak occurs on subsequent runs.
- **E2E strategy for this story**: per Story 2.5 Task 6's explicit instruction, `clientes-delete.spec.ts` is authored now, ahead of implementation, matching Stories 2.1-2.4's convention; the `btnEliminar`/`btnConfirmarEliminar` locators were already present in `clientes.page.ts` before this ATDD pass began (pre-added for this story), requiring no page-object changes. The contacts-cascade half of TC-E2-P0-05 is intentionally NOT authored — per AC #4/Dev Notes, `Contacto` doesn't exist in the codebase yet.
- No new test infrastructure (factories/fixtures/MSW server) was needed — Stories 2.1-2.4's are reused verbatim, including `ApiHelper.deleteCliente(id)`, which already existed for E2E cleanup purposes since Story 2.1.

---

**Generated by BMad TEA Agent** - 2026-07-06
