# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-07-06
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit) + Component (Vitest + RTL) + E2E (Playwright, new)

---

## Story Summary

Extends the existing `ClienteForm` dialog to also serve as an edit form (`cliente` prop
present → edit mode), triggered by an "Editar" button in `ClienteDetailView`, backed by a new
`PUT /api/v1/clientes/{id}` endpoint. The form opens pre-filled with the client's current
values; a valid save updates both the detail panel and the list immediately (no reload);
clearing a required field blocks the save with an inline error; canceling discards changes.

**As a** commercial team member
**I want** to edit any field of an existing client
**So that** the client information stays up to date

---

## Acceptance Criteria

1. Given the user is viewing a client's detail, when they click "Editar", then the same `ClienteForm` dialog opens in edit mode, titled "Editar cliente", pre-filled with the client's current Nombre, NIT/RUC, Teléfono and Ciudad values (FR6).
2. Given the edit dialog is open and the user modifies fields with valid data, when "Guardar" is clicked, then `PUT /api/v1/clientes/{id}` is called, both `ClienteDetailView` and `ClienteListView` reflect the change immediately with no reload (FR27 — invalidates `['clientes']` and `['clientes', id]`), a success toast "Cliente actualizado correctamente" shows, and the dialog closes.
3. Given the edit dialog is open, when the user clears a required field and clicks "Guardar", then an inline "requerido" error appears, no `PUT` is ever sent (client-side Zod), and the dialog remains open (FR8).
4. Given the edit dialog is open and the user has modified fields, when "Cancelar" is clicked (or the dialog is closed via Escape/overlay) without saving, then no `PUT` is ever sent, the dialog closes, and the client's original data remains completely unchanged.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 new tests, 1 new file)

**File:** `e2e/tests/clientes/clientes-edit.spec.ts` (new, 148 lines) — covers `test-design-epic-2.md`'s TC-E2-P1-01/02
**Page object:** `e2e/pages/clientes.page.ts` (extended: `btnEditar` locator + `abrirFormularioEdicion()` helper)

- ✅ **Test:** `TC-E2-P1-01 — el formulario de edición se precarga con los valores actuales del cliente`
  - **Status:** RED (blocked) — depends on `PUT /api/v1/clientes/{id}`, `ClienteForm` edit mode, and the "Editar" trigger, none of which exist yet.
  - **Verifies:** AC #1, FR6
- ✅ **Test:** `TC-E2-P1-01 — guardar cambios actualiza el detalle y la lista de inmediato (FR6, FR27)` — **Status:** RED (same) — **Verifies:** AC #2, FR27
- ✅ **Test:** `TC-E2-P1-01 — guardar cambios actualiza la fila del cliente en la lista (FR27)` — **Status:** RED (same) — **Verifies:** AC #2, FR27
- ✅ **Test:** `TC-E2-P1-02 — limpiar un campo requerido bloquea el guardado con un error inline (FR8)` — **Status:** RED (same) — **Verifies:** AC #3, FR8
- ✅ **Test:** `TC-E2-P1-02 — limpiar un campo requerido no modifica el registro original en el backend` — **Status:** RED (same) — **Verifies:** AC #3

**Verified locally (this session):** `npx playwright test e2e/tests/clientes/clientes-edit.spec.ts --list` → parses correctly (10 test runs across chromium/mobile-chrome, 5 unique cases); did not execute against a running dev server (none available in this environment) — locators/assertions match the planned implementation exactly (`btnEditar`, `form` as `role="dialog"`, `getByLabel` per field, `btnGuardar`/`btnCancelar`), same convention as prior stories' checklists.

**Deliberately NOT duplicated at E2E:** TC-E2-P1-03 (Cancel discards changes) is a component-level case per `test-design-epic-2.md` — covered by `ClienteForm.edit.test.tsx`'s AC4 suite instead, avoiding duplicate coverage across levels.

### API Tests (28 tests: 20 xUnit Unit new + 8 xUnit Integration new file)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs` (new, 11 `[Fact]`/`[Theory]` declarations, 15 test cases)

- ✅ **Test:** `Validate_Succeeds_WhenAllFieldsAreValid`
  - **Status:** RED — **verified locally** (`dotnet build tests/SiesaAgents.UnitTests`): `CS0246` (`UpdateClienteRequest`/`UpdateClienteRequestValidator` don't exist).
  - **Verifies:** AC #3 (accepts valid input)
- ✅ **Test:** `Validate_Fails_When{Nombre,Nit,Telefono,Ciudad}IsEmptyOrWhitespace` (4× `[Theory]`, 2 cases each) — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `Validate_Fails_When{Nombre,Nit,Telefono,Ciudad}ExceedsMaxLength` (4×) — **Status:** RED (same) — **Verifies:** AC #3 (MaximumLength present from the start, per Task 2's explicit instruction not to repeat Story 2.3's gap)
- ✅ **Test:** `Validate_Succeeds_WhenNombreIsExactlyAtMaxLength` — **Status:** RED (same) — **Verifies:** AC #3 boundary
- ✅ **Test:** `Validate_Fails_WithOneErrorPerField_WhenAllFourFieldsAreEmpty` — **Status:** RED (same) — **Verifies:** AC #3

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs` (new, 9 tests)

- ✅ **Test:** `Handle_ReturnsNotFoundResult_WhenClienteDoesNotExist`
  - **Status:** RED — same build failure (`UpdateClienteCommand`/`Handler`/`Result` don't exist).
  - **Verifies:** AC #2 (Dev Notes: `IsNotFound` — new failure mode vs. create)
- ✅ **Test:** `Handle_ReturnsNullCliente_WhenClienteDoesNotExist` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `Handle_ReturnsFalseIsConflict_WhenClienteDoesNotExist` — **Status:** RED (same) — **Verifies:** AC #2 (not-found ≠ conflict)
- ✅ **Test:** `Handle_ReturnsSuccessResult_WhenClienteExistsAndUpdateSucceeds` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `Handle_ReturnsClienteDto_MappingAllFieldsFromCommand_WhenUpdateSucceeds` — **Status:** RED (same) — **Verifies:** AC #2 field mapping
- ✅ **Test:** `Handle_PreservesOriginalCreatedAt_WhenUpdateSucceeds` — **Status:** RED (same) — **Verifies:** AC #2 (Dev Notes: only `Update()`, not `Create()`, runs on this path)
- ✅ **Test:** `Handle_ReturnsConflictResult_WhenUpdateAsyncReturnsFalse` — **Status:** RED (same) — **Verifies:** AC #3 (NIT-collision-on-edit)
- ✅ **Test:** `Handle_ReturnsNullCliente_WhenUpdateAsyncReturnsFalse` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `Handle_PassesUpdatedEntityWithCommandFields_ToRepositoryUpdateAsync` — **Status:** RED (same) — **Verifies:** AC #2 (handler applies `Update()` before persisting)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsUpdateTests.cs` (**new file**, 8 tests) — see "Architecture Decision" in Notes for why this is a new file rather than another section in `ClienteEndpointsTests.cs`/`ClienteEndpointsEdgeCasesTests.cs`.

- ✅ **Test:** `UpdateCliente_ReturnsOk_WithValidData`
  - **Status:** RED — **verified locally** (`dotnet build tests/SiesaAgents.IntegrationTests`): `CS0246` (`ClienteEndpointsTestBase` doesn't exist yet — Task 3 creates it — **and** `PUT /{id:guid}` doesn't exist — Task 2).
  - **Verifies:** AC #2
- ✅ **Test:** `UpdateCliente_ReturnsUpdatedCliente_WithValidData` — **Status:** RED (same) — **Verifies:** AC #2 (Id/CreatedAt unchanged, other fields updated)
- ✅ **Test:** `UpdateCliente_PersistsChanges` — **Status:** RED (same) — **Verifies:** AC #2 (genuine persistence, not just echoed)
- ✅ **Test:** `UpdateCliente_ReturnsNotFound_WhenClienteDoesNotExist` — **Status:** RED (same) — **Verifies:** AC #2 (404 for a deleted/nonexistent Id)
- ✅ **Test:** `UpdateCliente_MissingRequiredFields_Returns400` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `UpdateCliente_MissingRequiredFields_LeavesOriginalRecordUnchanged` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `UpdateCliente_DuplicateNit_Returns409` — **Status:** RED (same) — **Verifies:** AC #3 (Dev Notes: NIT uniqueness applies identically on edit)
- ✅ **Test:** `UpdateCliente_DuplicateNit_DoesNotChangeSecondClientsNitInDb` — **Status:** RED (same) — **Verifies:** AC #3 (no partial-update leak)

**Verified locally (this session, no PostgreSQL required for this check):**
- `dotnet build tests/SiesaAgents.UnitTests` → **3 `CS0246` errors**, whole assembly RED.
- `dotnet build tests/SiesaAgents.IntegrationTests` → **1 `CS0246` error** (`ClienteEndpointsTestBase`), whole assembly RED — confirms the new file's dependency on Task 3's not-yet-created base class compiles-fails exactly as intended.
- Pre-existing `ClienteEndpointsTests.cs`/`ClienteEndpointsEdgeCasesTests.cs` were **not modified** — left fully intact for Task 3 (dev-story) to refactor.

### Component Tests (18 tests: 15 new file + 3 added to `ClienteDetailView.test.tsx`)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx` (new, 15 tests)

- ✅ **Test:** `[P0] pre-fills Nombre with the client's current value`
  - **Status:** RED — **verified locally** (`vitest run`): field renders empty (`ClienteFormProps` has no `cliente` prop yet, Task 5).
  - **Verifies:** AC #1
- ✅ **Test:** `[P0] pre-fills NIT/RUC / Teléfono / Ciudad with the client's current value` (×3) — **Status:** RED (same) — **Verifies:** AC #1
- ✅ **Test:** `[P0] renders the dialog title as "Editar cliente"` — **Status:** RED (same) — **Verifies:** AC #1
- ✅ **Test:** `[P0] shows an inline "requerido" message when Nombre is cleared and Guardar is clicked` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `[P0] never sends PUT /api/v1/clientes/{id} when Nombre is cleared` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `[P0] keeps the dialog open when Nombre is cleared and Guardar is clicked` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `[P0] calls onOpenChange(false) after a successful PUT` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `[P0] shows the success toast "Cliente actualizado correctamente" after a successful PUT` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `[P1] sends the full current form values (all four fields) in the PUT body` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `[P1] shows "El NIT/RUC ya está registrado" next to the NIT field on a 409 response` — **Status:** RED (same) — **Verifies:** AC #2 Dev Notes (409 handling shared with create)
- ✅ **Test:** `[P1] keeps the dialog open on a 409 response` — **Status:** RED (same) — **Verifies:** AC #2 Dev Notes
- ✅ **Test:** `[P0] calls onOpenChange(false) and never sends a PUT when Cancelar is clicked`
  - **Status:** GREEN-before-implementation (documented) — **verified locally**: passes today because Cancelar's existing `handleOpenChange` logic (Story 2.3) already closes the dialog without submitting, regardless of mode. Remains a meaningful regression guard once edit mode exists. — **Verifies:** AC #4
- ✅ **Test:** `[P1] resets fields back to the client's original values when Cancelar is clicked` — **Status:** RED — **verified locally**: field resets to blank (`''`), not the client's original value (`cliente` prop not wired into the `reset()` baseline yet). — **Verifies:** AC #4

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (extended, +3 tests)

- ✅ **Test:** `[P0] renders an "Editar" button once the client loads`
  - **Status:** RED — **verified locally**: `findByRole('button', { name: /editar/i })` times out (button doesn't exist).
  - **Verifies:** AC #1
- ✅ **Test:** `[P0] clicking "Editar" opens a dialog` — **Status:** RED (same) — **Verifies:** AC #1
- ✅ **Test:** `[P0] the opened dialog shows the loaded client's Nombre already filled in` — **Status:** RED (same) — **Verifies:** AC #1

**Verified locally (this session):**
- `pnpm vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx` → **14 failed, 1 passed** (15 total) — the 1 pass is the documented GREEN-before-implementation Cancelar case above.
- `pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` → **3 failed, 9 passed** (12 total) — the 3 new Story 2.4 tests are RED; **all 9 pre-existing Story 2.2/2.3 tests still pass, zero regression** introduced by this ATDD pass.

---

## Data Factories Created

No new factories — reuses `frontend/src/test/factories/cliente.factory.ts` (`createCliente`) and `e2e/helpers/data.helper.ts` (`buildCliente`), both already generating all four required fields plus `id`/`createdAt`.

---

## Fixtures Created

No new fixtures. Reuses the shared MSW `server`, `TestWebApplicationFactory`/`RequiresPostgresFactAttribute` (backend), and `e2e/fixtures/base.fixture.ts`/`ApiHelper`, all established in Stories 2.1-2.3.

One new **test infrastructure dependency** is introduced (not a fixture, but load-bearing for RED→GREEN): `ClienteEndpointsUpdateTests.cs` inherits `ClienteEndpointsTestBase`, which Story 2.4 Task 3 must create as part of implementation (see Architecture Decision in Notes).

---

## Mock Requirements

### PUT /api/v1/clientes/{id} Mock (frontend component tests)

**Endpoint:** `PUT /api/v1/clientes/{id}`

**Success Response (200):**

```json
{ "id": "...", "nombre": "Acme Corp Updated", "nit": "900123456", "telefono": "3009999999", "ciudad": "Cali" }
```

**Conflict Response (409):**

```json
{ "detail": "El NIT/RUC ya está registrado." }
```

**Not Found:** `404` with an empty body (client deleted concurrently — falls into `ClienteForm`'s generic `root` error branch per Dev Notes).

**Notes:** Identical error-shape contract to `POST /api/v1/clientes` (Story 2.3) — the 409 inline-NIT-error and generic-failure paths in `ClienteForm` are fully shared between create and edit modes.

---

## Required data-testid Attributes

No new `data-testid` attributes — reuses accessible role/label queries, consistent with Story 2.3's established convention:

- Trigger: `getByRole('button', { name: /editar/i })` (`btnEditar`, new in `clientes.page.ts`)
- Dialog: `getByRole('dialog')` (`form`) — same instance type as create
- Fields: `getByLabel(/nombre|nit|teléfono|ciudad/i)` (`inputNombre`/`inputNit`/`inputTelefono`/`inputCiudad`) — same locators as create
- Actions: `getByRole('button', { name: /guardar/i })` / `/cancelar/i` (`btnGuardar`/`btnCancelar`) — same locators as create
- Existing detail-panel testids reused: `cliente-detail-panel`, `cliente-detail-nombre/nit/telefono/ciudad`

**Implementation Example:**

```tsx
<Button htmlType="button" size="sm" onClick={() => setIsEditOpen(true)}>Editar</Button>
<ClienteForm open={isEditOpen} onOpenChange={setIsEditOpen} cliente={data} />
```

---

## Implementation Checklist

### Test: Backend validator + handler unit tests (AC #2, #3)

**Files:** `UpdateClienteRequestValidatorTests.cs`, `UpdateClienteCommandHandlerTests.cs`

- [ ] Add `ClienteEntity.Update(nombre, nit, telefono, ciudad)` (Task 1)
- [ ] Add `IClienteRepository.UpdateAsync(ClienteEntity, CancellationToken)`; implement in `ClienteRepository` (Task 2)
- [ ] Create `UpdateClienteRequest`, `UpdateClienteRequestValidator` (with `MaximumLength` from the start)
- [ ] Create `UpdateClienteCommand`, `UpdateClienteResult` (with `IsNotFound`), `UpdateClienteCommandHandler`
- [ ] Extend the fake `IClienteRepository` implementations in `GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `CreateClienteCommandHandlerTests.cs` with a no-op `UpdateAsync` so they keep compiling against the larger interface
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~UpdateClienteRequestValidatorTests|FullyQualifiedName~UpdateClienteCommandHandlerTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2.5 hours

---

### Test: Backend integration tests for PUT /api/v1/clientes/{id} (AC #2, #3)

**File:** `ClienteEndpointsUpdateTests.cs` (new)

- [ ] Extract `ClienteEndpointsTestBase` from the duplicated helpers in `ClienteEndpointsTests.cs`/`ClienteEndpointsEdgeCasesTests.cs` (Task 3 — pure refactor, run the full existing suite after to confirm zero regressions)
- [ ] Have `ClienteEndpointsTests`/`ClienteEndpointsEdgeCasesTests` inherit from `ClienteEndpointsTestBase` instead of redeclaring helpers
- [ ] Add `group.MapPut("/{id:guid}", ...)` to `ClienteEndpoints`, wiring `IValidator<UpdateClienteRequest>` → `400`, not-found → `404`, conflict → `409`, success → `200 OK`
- [ ] Register `IValidator<UpdateClienteRequest>` and `UpdateClienteCommandHandler` in `Program.cs`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~UpdateCliente"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours (includes the Task 3 refactor)

---

### Test: ClienteForm edit-mode component tests (AC #1, #2, #3, #4)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`

- [ ] Extend `IClienteRepository`/`clienteApiRepository` with `update(id, data)`
- [ ] Create `useUpdateCliente.ts` (invalidates `['clientes']` **and** `['clientes', id]` + `toast.success('Cliente actualizado correctamente')`)
- [ ] Add `cliente?: Cliente | null` prop to `ClienteForm`, `isEditMode = !!cliente`, `useEffect` re-`reset()`-ing on `[open, cliente]`
- [ ] Change `DialogTitle` to conditional "Editar cliente" / "Nuevo cliente"
- [ ] Branch `onSubmit` on `isEditMode` (update vs. create mutation); keep 409/generic error handling shared
- [ ] Run test: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: "Editar" button + dialog wiring in ClienteDetailView (AC #1)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`

- [ ] Add "Editar" button + `ClienteForm` mount (with `cliente={data}`) to `ClienteDetailView.tsx`, inside the `isSuccess && data` branch
- [ ] Run test: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- [ ] ✅ Tests pass (green phase), 9 pre-existing tests remain green

**Estimated Effort:** 0.5 hours

---

### Test: E2E edit-client flows (AC #1, #2, #3)

**File:** `e2e/tests/clientes/clientes-edit.spec.ts` (new)

- [ ] No further test authoring — once Tasks 1-5 above are complete, run this spec to confirm it passes
- [ ] Run test: `npx playwright test e2e/tests/clientes/clientes-edit.spec.ts`
- [ ] ✅ TC-E2-P1-01/02 pass

**Estimated Effort:** 0.5 hours (verification only)

---

## Running Tests

```bash
# Backend unit + integration tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~UpdateClienteRequestValidatorTests|FullyQualifiedName~UpdateClienteCommandHandlerTests"
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~UpdateCliente"

# Frontend component tests
cd frontend && pnpm vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx
cd frontend && pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx

# E2E (once Tasks 1-5 land)
npx playwright test e2e/tests/clientes/clientes-edit.spec.ts
npx playwright test e2e/tests/clientes/clientes-edit.spec.ts --headed
npx playwright test e2e/tests/clientes/clientes-edit.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ All new tests written and verified failing for the right reason (frontend: `vitest run`; backend: `dotnet build`)
- ✅ No new fixtures/factories needed — Stories 2.1-2.3's are reused as-is
- ✅ Mock requirements documented for DEV team
- ✅ No new data-testid requirements — role/label queries only
- ✅ Implementation checklist created
- ✅ New E2E spec authored ahead of implementation (`clientes-edit.spec.ts` + `btnEditar` locator), per the project's established ATDD convention (Stories 2.1-2.3)

**Verification (this session):**

- `backend`: `dotnet build tests/SiesaAgents.UnitTests` → 3 `CS0246` errors, whole assembly RED.
- `backend`: `dotnet build tests/SiesaAgents.IntegrationTests` → 1 `CS0246` error (`ClienteEndpointsTestBase`), whole assembly RED — confirms the new file's intentional double-dependency (missing endpoint + missing shared test base) compiles-fails correctly.
- `frontend`: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx` → 14 of 15 genuinely RED; 1 documented GREEN-before-implementation (Cancelar/no-PUT, trivially true since Cancelar never submits regardless of mode).
- `frontend`: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` → 3 new RED tests; all 9 pre-existing Story 2.2/2.3 tests still pass, **zero regression**.
- `e2e`: `npx playwright test e2e/tests/clientes/clientes-edit.spec.ts --list` → parses correctly, 10 runs (5 cases × 2 projects); not executed against a live server in this environment.

### GREEN Phase (DEV Team - Next Steps)

Implement Story 2.4 Tasks 1-6 exactly as specified in the story file, one failing test at a
time: backend `ClienteEntity.Update()` + `UpdateAsync` + validator/command/handler/endpoint
(Tasks 1-2), the `ClienteEndpointsTestBase` extraction (Task 3, before running
`ClienteEndpointsUpdateTests.cs`), then the frontend data layer + `useUpdateCliente` (Task 4),
then `ClienteForm` edit mode + `ClienteDetailView` wiring (Task 5), finally re-running
`clientes-edit.spec.ts` to confirm it turns GREEN (Task 6).

### REFACTOR Phase (DEV Team - After All Tests Pass)

Standard refactor pass once GREEN. The Task 3 extraction is itself the refactor for this
story's own test-infrastructure debt — no further duplication risk introduced by this ATDD
pass, since `ClienteEndpointsUpdateTests.cs` never duplicates the six shared helpers.

---

## Next Steps

1. Share this checklist and the failing tests above with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase using the commands above
3. Implement Story 2.4 Tasks 1-6 one test at a time (red → green)
4. Run `clientes-edit.spec.ts` to confirm it is now GREEN
5. When all gating tests pass, refactor code for quality, then mark story 'done' in sprint-status.yaml

---

## Notes

- **Architecture Decision — new integration test file instead of extending the two large ones:** Story 2.3's code review flagged `ClienteEndpointsTests.cs` (584 lines) and `ClienteEndpointsEdgeCasesTests.cs` (508 lines) as exceeding the project's ~500-line test-file guideline, both duplicating identical private helpers (`UniqueNit()`, `SeedClientesAsync`, `DeleteClientesAsync`, `DeleteClienteByNitAsync`, `ClearClientesTableAsync`, `GetClientesAsync`, `ClienteApiResponse`). Story 2.4 Task 3 already schedules extracting a shared `ClienteEndpointsTestBase` for exactly this reason. Rather than adding an `UpdateCliente*` section to either large file (as the story's Task 3 literally describes) and growing them further before the refactor lands, this ATDD pass created **`ClienteEndpointsUpdateTests.cs`** as a new file that inherits `ClienteEndpointsTestBase` directly. This: (a) adds zero new duplicated helper code, (b) does not touch or grow the two existing large files at all — Task 3's extraction shrinks them independently, (c) still fails to compile today for a correct, intentional RED reason (the base class doesn't exist until Task 3, and the `PUT` endpoint doesn't exist until Task 2). The DEV team should create `ClienteEndpointsTestBase` per Task 3's exact spec (protected `Client`, `UniqueNit()`, `SeedClientesAsync`, `DeleteClientesAsync`, `DeleteClienteByNitAsync`, `ClearClientesTableAsync`, `GetClientesAsync`, `ClienteApiResponse`) and have both `ClienteEndpointsTests`/`ClienteEndpointsEdgeCasesTests` inherit from it; `ClienteEndpointsUpdateTests.cs` then compiles against it with no further changes needed.
- **E2E strategy for this story**: per Story 2.4 Task 6's explicit instruction, `clientes-edit.spec.ts` (TC-E2-P1-01/02) and the `btnEditar` locator are authored now, ahead of implementation, matching Stories 2.1-2.3's convention. TC-E2-P1-03 (Cancel discards changes) is intentionally left at the component level (`ClienteForm.edit.test.tsx`) per `test-design-epic-2.md`'s explicit level assignment, avoiding duplicate coverage across levels.
- The Cancelar/no-PUT "GREEN-before-implementation" case documented above is a known, accepted TDD edge case (same pattern as Story 2.3's checklist) — it trivially passes today because Cancelar's create-mode logic already never submits; it becomes the true AC #4 regression guard once edit mode exists.
- No new test infrastructure (factories/fixtures/MSW server) was needed beyond `ClienteEndpointsTestBase` (a DEV-side refactor deliverable, not a new fixture) — Stories 2.1-2.3's are reused verbatim.

---

**Generated by BMad TEA Agent** - 2026-07-06
