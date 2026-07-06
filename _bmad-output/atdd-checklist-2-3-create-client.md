# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-07-06
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit) + Component (Vitest + RTL) — E2E already exists (see Notes)

---

## Story Summary

Adds the ability to register a new client via a "Nuevo cliente" dialog form (Nombre, NIT/RUC,
Teléfono, Ciudad), backed by a new `POST /api/v1/clientes` endpoint. Duplicate NITs are
rejected with `409` (DB-level `uk_clientes_nit` constraint is the source of truth), and
missing required fields are blocked both client-side (Zod) and server-side (FluentValidation).

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. Given the user is on `/clientes`, when they click "Nuevo cliente", then a dialog opens with four required, labeled fields (Nombre, NIT/RUC, Teléfono, Ciudad) (FR1).
2. Given the dialog is open and filled with valid data, when the user clicks "Guardar", then `POST /api/v1/clientes` is called, the new client appears in the list immediately (FR27, `invalidateQueries(['clientes'])`), a success toast "Cliente creado correctamente" shows, and the dialog closes.
3. Given the dialog is open with one or more required fields empty, when "Guardar" is clicked, then inline "requerido" errors appear, no `POST` is ever sent, and the dialog stays open (FR8).
4. Given the dialog is open and the submitted NIT/RUC already exists, when the backend responds `409`, then an inline error "El NIT/RUC ya está registrado" appears next to NIT/RUC, no technical detail is exposed (NFR6), and the dialog stays open.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 new — 7 pre-existing tests unblocked, see Notes)

**Files:** `e2e/tests/clientes/clientes-crud.spec.ts` (existing, FR4/FR7/FR8), `e2e/tests/clientes/clientes-detalle.spec.ts` (existing, TC-E2-P1-07/08)

Per Story 2.3 Task 6's explicit instruction ("Do not add new E2E specs"), no new E2E files
were created. These pre-existing specs (authored ahead of implementation by Stories 2.1/2.2's
own ATDD passes) already exercise every AC of this story and are documented here as this
story's E2E coverage:

- ✅ **Test:** `FR4 — debe crear un nuevo cliente` (`clientes-crud.spec.ts`)
  - **Status:** RED (blocked) — depends on `POST /api/v1/clientes`, this story's scope.
  - **Verifies:** AC #2
- ✅ **Test:** `FR7 — debe mostrar error cuando NIT ya existe` (`clientes-crud.spec.ts`)
  - **Status:** RED (blocked) — same dependency.
  - **Verifies:** AC #4
- ✅ **Test:** `FR8 — debe validar campos requeridos en el formulario` (`clientes-crud.spec.ts`)
  - **Status:** RED (blocked) — dialog/validation don't exist yet.
  - **Verifies:** AC #3
- ✅ **Test:** `FR1 — debe listar clientes existentes` / `FR2 —` (x2) (`clientes-crud.spec.ts`)
  - **Status:** RED (blocked) — seed via `apiHelper.createCliente` needs `POST`.
  - **Verifies:** AC #2 indirectly (seeding dependency, not this story's own AC)
- ✅ **Test:** `TC-E2-P1-07 — clic en un cliente navega al detalle...` (`clientes-detalle.spec.ts`)
  - **Status:** RED (blocked) — documented Story 2.2 cross-story dependency on this story's `POST`.
  - **Verifies:** FR30 (Story 2.2 scope, unblocked as a side effect of this story)
- ✅ **Test:** `TC-E2-P1-08 — acceso directo a /clientes/:clienteId...` (`clientes-detalle.spec.ts`)
  - **Status:** RED (blocked) — same dependency as TC-E2-P1-07.
  - **Verifies:** FR30 (Story 2.2 scope)

**Verified locally (this session):** confirmed via `dotnet`/`vitest` runs above that the
underlying `POST` endpoint does not exist yet (405/404 responses); did not execute the
Playwright suite itself in this environment (no running frontend+backend dev servers), but no
changes were made to these files' assertions/locators, per the story's explicit instruction —
only the implementation (Tasks 1-5) needs to change to turn them GREEN.

### API Tests (23 tests: 5 xUnit Unit new + 14 xUnit Integration additions to existing files)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs` (new, 5 tests)

- ✅ **Test:** `Validate_Succeeds_WhenAllFieldsAreValid`
  - **Status:** RED — **verified locally** (`dotnet build`): whole `SiesaAgents.UnitTests` assembly fails with `CS0234`/`CS0246` (`CreateClienteRequest`/`CreateClienteRequestValidator` don't exist).
  - **Verifies:** AC #3 (server-side validator accepts valid input)
- ✅ **Test:** `Validate_Fails_WhenNombreIsEmptyOrWhitespace` (`[Theory]`, 2 cases) — **Status:** RED (same compile error) — **Verifies:** AC #3, TC-E2-P2-06
- ✅ **Test:** `Validate_Fails_WhenNitIsEmptyOrWhitespace` (`[Theory]`, 2 cases) — **Status:** RED (same) — **Verifies:** AC #3, TC-E2-P2-06
- ✅ **Test:** `Validate_Fails_WhenTelefonoIsEmptyOrWhitespace` (`[Theory]`, 2 cases) — **Status:** RED (same) — **Verifies:** AC #3, TC-E2-P2-06
- ✅ **Test:** `Validate_Fails_WhenCiudadIsEmptyOrWhitespace` (`[Theory]`, 2 cases) — **Status:** RED (same) — **Verifies:** AC #3, TC-E2-P2-06

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` (new, 5 tests)

- ✅ **Test:** `Handle_ReturnsSuccessResult_WhenRepositoryAddSucceeds`
  - **Status:** RED — same build failure (`CreateClienteCommand`/`Handler`/`Result` don't exist).
  - **Verifies:** AC #2
- ✅ **Test:** `Handle_ReturnsClienteDto_MappingAllFieldsFromCommand_WhenRepositoryAddSucceeds` — **Status:** RED (same) — **Verifies:** AC #2 field mapping
- ✅ **Test:** `Handle_ReturnsConflictResult_WhenRepositoryAddFails` — **Status:** RED (same) — **Verifies:** AC #4
- ✅ **Test:** `Handle_ReturnsNullCliente_WhenRepositoryAddFails` — **Status:** RED (same) — **Verifies:** AC #4 (no partial data leaked on conflict)
- ✅ **Test:** `Handle_PassesEntityWithCommandFields_ToRepositoryAddAsync` — **Status:** RED (same) — **Verifies:** AC #2 (handler forwards fields verbatim to repository)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (extended, +9 tests)

- ✅ **Test:** `CreateCliente_ReturnsCreated_WithValidData`
  - **Status:** RED — **verified locally** (`dotnet test`): `Expected: Created / Actual: MethodNotAllowed` (no `POST` route mapped yet).
  - **Verifies:** AC #2
- ✅ **Test:** `CreateCliente_ReturnsCreatedCliente_WithValidData` — **Status:** RED — **verified locally**: `Id` deserializes to `Guid.Empty` (body isn't a `ClienteDto`). — **Verifies:** AC #2 field mapping
- ✅ **Test:** `CreateCliente_PersistsCliente_WithValidData` — **Status:** RED — **verified locally**: subsequent `GET` returns `404` since nothing was created. — **Verifies:** AC #2 (genuine persistence, not just an echoed response)
- ✅ **Test:** `CreateCliente_DuplicateNit_Returns409` — **Status:** RED — **verified locally**: `Expected: Conflict / Actual: MethodNotAllowed`. — **Verifies:** AC #4, TC-E2-P0-03
- ✅ **Test:** `CreateCliente_DuplicateNit_ResponseBodyContainsNoTechnicalDetail` — **Status:** GREEN-before-implementation (documented) — **verified locally**: passes today because the 405 response body coincidentally contains neither "Npgsql" nor "Exception"; will remain the true NFR6 guard once `POST` exists. — **Verifies:** NFR6
- ✅ **Test:** `CreateCliente_MissingRequiredFields_Returns400` — **Status:** RED — **verified locally**: `Expected: BadRequest / Actual: MethodNotAllowed`. — **Verifies:** AC #3, TC-E2-P0-04
- ✅ **Test:** `CreateCliente_MissingRequiredFields_DoesNotPersistAnything` — **Status:** GREEN-before-implementation (documented) — **verified locally**: passes today trivially (nothing can persist when the route doesn't exist); remains a meaningful regression guard post-implementation. — **Verifies:** AC #3
- ✅ **Test:** `CreateCliente_ConcurrentDuplicateNit_OnlyOnePersists` — **Status:** RED — **verified locally**: both requests return `405`, neither `Created` nor `Conflict`. — **Verifies:** TC-E2-P0-06
- ✅ **Test:** `CreateCliente_ConcurrentDuplicateNit_OnlyOneRecordExistsWithThatNit` — **Status:** RED — **verified locally**: collection is empty (no record persisted at all). — **Verifies:** TC-E2-P0-06

**File:** `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsEdgeCasesTests.cs` (extended, +3 tests)

- ✅ **Test:** `CreateCliente_WithScriptTagInNombre_ReturnsCreated` — **Status:** RED — **verified locally**: `Expected: Created / Actual: MethodNotAllowed`. — **Verifies:** TC-E2-P2-05, NFR5
- ✅ **Test:** `CreateCliente_WithSqlInjectionAttemptInNombre_ReturnsCreated` — **Status:** RED (same) — **Verifies:** TC-E2-P2-05, NFR5
- ✅ **Test:** `CreateCliente_WithSqlInjectionAttemptInNombre_DoesNotDropClientesTable` — **Status:** GREEN-before-implementation (documented) — **verified locally**: passes today because `GET /api/v1/clientes` is unaffected by the failed `POST`; remains the true regression guard (table not dropped, no 500) once `POST` exists. — **Verifies:** TC-E2-P2-05, NFR5

### Component Tests (14 tests: 12 new + 2 added to the existing ClienteListView suite)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` (new, 12 tests)

- ✅ **Test:** `renders Nombre, NIT/RUC, Teléfono and Ciudad fields when open is true`
  - **Status:** RED — **verified locally** (`vitest run`): fails to resolve import `"./ClienteForm"` (module doesn't exist).
  - **Verifies:** AC #1
- ✅ **Test:** `shows four inline "requerido" messages when Guardar is clicked with all fields empty` — **Status:** RED (same import error) — **Verifies:** AC #3
- ✅ **Test:** `never sends POST /api/v1/clientes when required fields are empty` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `keeps the dialog open when required fields are empty` — **Status:** RED (same) — **Verifies:** AC #3
- ✅ **Test:** `calls onOpenChange(false) after a successful POST` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `shows the success toast "Cliente creado correctamente" after a successful POST` — **Status:** RED (same) — **Verifies:** AC #2
- ✅ **Test:** `invalidates the clientes query cache after a successful POST (FR27)` — **Status:** RED (same) — **Verifies:** AC #2, FR27
- ✅ **Test:** `shows "El NIT/RUC ya está registrado" next to the NIT field on a 409 response` — **Status:** RED (same) — **Verifies:** AC #4
- ✅ **Test:** `keeps the dialog open on a 409 response` — **Status:** RED (same) — **Verifies:** AC #4
- ✅ **Test:** `renders a generic safe message when POST fails with 500` — **Status:** RED (same) — **Verifies:** NFR6
- ✅ **Test:** `never renders the raw backend error/exception message on a 500 (NFR6)` — **Status:** RED (same) — **Verifies:** NFR6

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` (extended, +2 tests)

- ✅ **Test:** `renders a "Nuevo cliente" button`
  - **Status:** RED — **verified locally**: `findByRole('button', { name: /nuevo cliente/i })` times out (button doesn't exist).
  - **Verifies:** AC #1
- ✅ **Test:** `clicking "Nuevo cliente" opens a dialog` — **Status:** RED (same) — **Verifies:** AC #1

**Verified locally (this session):** `pnpm vitest run src/modules/crm/clientes` → 2 test files failed (`ClienteForm.test.tsx`: 0 tests, import-resolution error; `ClienteListView.test.tsx`: 2 new tests failed, timeout on the missing button) and the pre-existing 35 tests across `ClienteDetailView.test.tsx`, `ClienteDetailView.edge-cases.test.tsx`, `ClienteListView.perf.test.tsx`, `ClienteListView.edge-cases.test.tsx` and the 13 pre-existing `ClienteListView.test.tsx` cases still pass — no regression introduced by this ATDD pass.

---

## Data Factories Created

No new factories — reuses `frontend/src/test/factories/cliente.factory.ts` (`createCliente`) from Story 2.1 and `e2e/helpers/data.helper.ts` (`buildCliente`). Both already generate all four required fields.

---

## Fixtures Created

No new fixtures. Reuses the shared MSW `server` (`frontend/src/test/msw/server.ts`), `TestWebApplicationFactory`/`RequiresPostgresFactAttribute` (backend), and `e2e/fixtures/base.fixture.ts`/`ApiHelper`, all established in Stories 2.1/2.2.

---

## Mock Requirements

### POST /api/v1/clientes Mock (frontend component tests)

**Endpoint:** `POST /api/v1/clientes`

**Success Response (201):**

```json
{ "id": "...", "nombre": "Acme Corp", "nit": "900123456", "telefono": "3001234567", "ciudad": "Bogotá" }
```

**Conflict Response (409):**

```json
{ "detail": "El NIT/RUC ya está registrado." }
```

**Failure Response (500):**

```json
{ "detail": "NpgsqlException: connection refused" }
```

**Notes:** The frontend must render the fixed copy "El NIT/RUC ya está registrado" on 409 (never the raw `detail`), and a generic safe message on any other failure (NFR6).

---

## Required data-testid Attributes

No new `data-testid` attributes — this story relies entirely on accessible role/label queries (per the story's own AC #1 wording and `e2e/pages/clientes.page.ts`'s existing locators):

- Trigger: `getByRole('button', { name: /nuevo cliente/i })` (`btnNuevoCliente`)
- Dialog: `getByRole('dialog')` (`form`)
- Fields: `getByLabel(/nombre|nit|teléfono|ciudad/i)` (`inputNombre`/`inputNit`/`inputTelefono`/`inputCiudad`)
- Actions: `getByRole('button', { name: /guardar/i })` / `/cancelar/i` (`btnGuardar`/`btnCancelar`)

**Implementation Example:**

```tsx
<Input label="Nombre" {...register('nombre')} error={!!errors.nombre} errorMessage={errors.nombre?.message} />
```

---

## Implementation Checklist

### Test: Backend validator + handler unit tests (AC #2, #3, #4)

**Files:** `CreateClienteRequestValidatorTests.cs`, `CreateClienteCommandHandlerTests.cs`

- [ ] Add `IClienteRepository.AddAsync(ClienteEntity, CancellationToken)`; implement in `ClienteRepository` translating `uk_clientes_nit` violations to `false`
- [ ] Create `CreateClienteRequest`, `CreateClienteRequestValidator` (FluentValidation `NotEmpty()` per field)
- [ ] Create `CreateClienteCommand`, `CreateClienteResult`, `CreateClienteCommandHandler`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~CreateClienteRequestValidatorTests|FullyQualifiedName~CreateClienteCommandHandlerTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2.5 hours

---

### Test: Backend integration tests for POST /api/v1/clientes (AC #2, #3, #4)

**Files:** `ClienteEndpointsTests.cs`, `ClienteEndpointsEdgeCasesTests.cs`

- [ ] Add `group.MapPost("/", ...)` to `ClienteEndpoints`, wiring `IValidator<CreateClienteRequest>` → `400`, conflict → `409`, success → `201 Created`
- [ ] Register `IValidator<CreateClienteRequest>` and `CreateClienteCommandHandler` in `Program.cs`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~CreateCliente"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: ClienteForm component tests (AC #1, #2, #3, #4)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

- [ ] Create `clienteSchema.ts` (Zod, `trim().min(1, 'requerido')` per field)
- [ ] Extend `IClienteRepository`/`clienteApiRepository` with `create` (no 409 catch — propagate)
- [ ] Create `useCreateCliente.ts` (`invalidateQueries(['clientes'])` + `toast.success(...)`)
- [ ] Mount `<Toaster/>` in `main.tsx` (Task 4)
- [ ] Create `ClienteForm.tsx` (RHF + Zod resolver, siesa-ui-kit `Input`s, 409 → `setError('nit', ...)`, other errors → `errors.root` `role="alert"`)
- [ ] Run test: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteForm.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test: "Nuevo cliente" button + dialog wiring (AC #1)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

- [ ] Add "Nuevo cliente" button + `ClienteForm` mount to `ClienteListView.tsx`
- [ ] Run test: `pnpm vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: E2E create-client flows (already authored, unblocked by this story)

**Files:** `e2e/tests/clientes/clientes-crud.spec.ts`, `e2e/tests/clientes/clientes-detalle.spec.ts`

- [ ] No new E2E code — once Tasks 1-5 above are complete, run the existing specs to confirm they pass
- [ ] Run test: `npx playwright test e2e/tests/clientes/`
- [ ] ✅ `FR4`/`FR7`/`FR8` (this story) and `TC-E2-P1-07`/`08` (Story 2.2, cross-story dependency) all pass

**Estimated Effort:** 0.5 hours (verification only, no authoring)

---

## Running Tests

```bash
# Backend unit + integration tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~CreateClienteRequestValidatorTests|FullyQualifiedName~CreateClienteCommandHandlerTests"
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~CreateCliente"

# Frontend component tests
cd frontend && pnpm vitest run src/modules/crm/clientes/presentation/ClienteForm.test.tsx
cd frontend && pnpm vitest run src/modules/crm/clientes/presentation/ClienteListView.test.tsx

# E2E (once Tasks 1-5 land)
npx playwright test e2e/tests/clientes/
npx playwright test e2e/tests/clientes/ --headed
npx playwright test e2e/tests/clientes/ --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ All new tests written and verified failing for the right reason (frontend: `vitest run`; backend: `dotnet build`/`dotnet test` against a locally reachable PostgreSQL instance)
- ✅ No new fixtures/factories needed — Story 2.1/2.2's are reused as-is
- ✅ Mock requirements documented for DEV team
- ✅ No new data-testid requirements — role/label queries only
- ✅ Implementation checklist created
- ✅ Pre-existing E2E specs (`clientes-crud.spec.ts`, `clientes-detalle.spec.ts`) reviewed and left untouched per Story 2.3 Task 6's explicit instruction — documented as this story's E2E coverage instead of duplicating them

**Verification (this session, against a live local PostgreSQL instance):**

- `backend`: `dotnet build tests/SiesaAgents.UnitTests` fails with 5 `CS0234`/`CS0246` errors — whole assembly RED, consistent with the project's established pattern (Story 2.1/2.2 checklists).
- `backend`: `dotnet test tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~CreateCliente"` → 9 of 12 new tests genuinely RED (405/404 responses since no `POST` route exists); 3 pass today as a documented, expected side effect of the missing route (same accepted pattern as Story 2.2's not-found tests) — see notes on each in the test list above.
- `frontend`: `pnpm vitest run src/modules/crm/clientes` → `ClienteForm.test.tsx` fails to resolve its import (module doesn't exist), `ClienteListView.test.tsx` has 2 new RED tests (missing button) with its 13 pre-existing Story 2.1/2.2 tests still passing, and the other 3 test files in the module (`ClienteDetailView.test.tsx`, `.edge-cases.test.tsx`, `ClienteListView.perf.test.tsx`, `.edge-cases.test.tsx`) remain fully green — no regression.

### GREEN Phase (DEV Team - Next Steps)

Implement Story 2.3 Tasks 1-6 exactly as specified in the story file, one failing test at a
time: backend `AddAsync`/validator/command/handler/endpoint (Tasks 1-2) first, then the
frontend data layer + `useCreateCliente` + `Toaster` (Tasks 3-4), then `ClienteForm` +
`ClienteListView` wiring (Task 5), finally re-running the pre-existing E2E specs to confirm
they turn GREEN (Task 6).

### REFACTOR Phase (DEV Team - After All Tests Pass)

Standard refactor pass once GREEN; no known duplication risk beyond what Stories 2.1/2.2 already established.

---

## Next Steps

1. Share this checklist and the failing tests above with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase using the commands above
3. Implement Story 2.3 Tasks 1-6 one test at a time (red → green)
4. Re-run `clientes-crud.spec.ts` and `clientes-detalle.spec.ts` to confirm they are now unblocked
5. When all gating tests pass, refactor code for quality, then mark story 'done' in sprint-status.yaml

---

## Notes

- **E2E strategy for this story**: per Story 2.3 Task 6's explicit instruction, no new E2E specs were authored. `e2e/tests/clientes/clientes-crud.spec.ts` (FR4/FR7/FR8) already covers every AC of this story end-to-end, and `e2e/tests/clientes/clientes-detalle.spec.ts`'s `TC-E2-P1-07`/`TC-E2-P1-08` (Story 2.2, documented cross-story dependency) become runnable as a side effect once this story's `POST` endpoint exists. This ATDD pass reviewed both files, confirmed their locators/assertions already match this story's planned implementation (`btnNuevoCliente`, `form` as `role="dialog"`, `getByLabel` per field, `btnGuardar`), and left them unmodified rather than duplicating coverage — consistent with the "avoid duplicate coverage across test levels" principle.
- The three "GREEN-before-implementation" backend integration tests (duplicate-NIT response body, missing-fields non-persistence, SQL-injection non-destruction) are a known, accepted TDD edge case — each asserts a negative/absence property that trivially holds when the endpoint doesn't exist yet. They are called out individually above so the dev team knows these are not proof of a working conflict/validation path; the sibling `Returns409`/`Returns400`/`ReturnsCreated` tests are this endpoint's true RED indicators.
- No new test infrastructure (factories/fixtures/MSW server) was needed — Story 2.1/2.2's are reused verbatim.

---

**Generated by BMad TEA Agent** - 2026-07-06
