# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-07-08
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + @testing-library/react + MSW) with supporting Application-layer (Vitest hook), Contract (Zod parity), Routing-integration (TanStack Router memory history), Backend Integration (xUnit + `WebApplicationFactory<Program>`), and E2E (Playwright, route-intercepted)

---

## Story Summary

Story 2.3 introduces the first Cliente **mutation** slice. Under RED phase, the tests lock the behaviour of every layer of the create-cliente flow: backend `CreateClienteCommandHandler` + `CreateClienteRequestValidator` + `POST /api/v1/clientes` endpoint (including 400 RFC 7807 validation body + 409 `ClienteNitConflictException` translation); frontend `clienteSchema` (Zod↔FluentValidation parity anchor for R-006), `useCreateCliente` mutation classification (nit-conflict / network / validation kinds), `ClienteForm` + `ClienteFormDialog` UI states (validation, inline nit error, network alert, freeze-during-submit); routing-integration through the real routeTree; and Playwright E2E for the P0 R-011/R-002/R-001 scenarios.

**As a** commercial team member
**I want** to register a new client by filling in a form with Nombre, NIT/RUC, Teléfono and Ciudad
**So that** the client is available in the system immediately for the whole team.

---

## Acceptance Criteria

1. **AC #1** — `/clientes` "Nuevo cliente" button (previously disabled) opens a shadcn `Dialog` with title "Nuevo cliente", four required fields (Nombre, NIT/RUC, Teléfono, Ciudad) in order, plus Cancelar + Guardar buttons. Focus lands on Nombre.
2. **AC #2** — Valid submit fires `POST /api/v1/clientes`; on 201 `['clientes']` is invalidated, dialog closes, `toast.success` displays exact Spanish copy, and the new row appears in the list without reload.
3. **AC #3** — Empty submit → four inline errors via Zod with exact Spanish messages; the request is NEVER sent (MSW POST count === 0); button remains enabled.
4. **AC #4** — Duplicate NIT (409 + RFC 7807 detail "El NIT/RUC ya está registrado") → inline error under NIT; dialog stays open; NO raw error body leak to the DOM (NFR6).
5. **AC #5** — On 201 success `queryClient.invalidateQueries({queryKey:['clientes']})` fires exactly once; user is NOT navigated away from `/clientes`.
6. **AC #6** — Cancelar / Escape / overlay-click discards form state (never stale on re-open) and does not fire POST.
7. **AC #7** — Non-409 non-2xx (500, 503, network) → top-of-form `Alert` with "No se pudo guardar" / "Comprueba tu conexión e intenta nuevamente."; dialog stays open; raw error NEVER shown (NFR6).
8. **AC #8** — During in-flight submit: Guardar `aria-busy="true"` + disabled, inputs readOnly, Cancelar stays enabled.
9. **AC #9** — Backend `POST /api/v1/clientes` with a valid unique body → HTTP 201 + `Location` header + full `ClienteDto` (createdAt === updatedAt).
10. **AC #10** — Missing / empty / whitespace-only field → HTTP 400 with RFC 7807 body, `errors` map keyed by camelCase field names, Spanish messages verbatim; NO `stackTrace`/`exception`.
11. **AC #11** — Duplicate `nit` → application-level `NitExistsAsync` short-circuit → `ClienteNitConflictException` → middleware translates to HTTP 409 + RFC 7807 detail "El NIT/RUC ya está registrado". `AddAsync` NEVER invoked.
12. **AC #12** — Build (backend + frontend) compiles clean; TypeScript strict; CSS gzip ≤ +8 KB regression.
13. **AC #13** — All existing suites remain green; new suites pass; >80% coverage on new files.

---

## Failing Tests Created (RED Phase)

### Backend Tests — xUnit + `WebApplicationFactory<Program>` + FluentValidation.TestHelper

#### File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` (3 tests, NEW)

- **Test:** `HandleAsync_CreatesEntity_AndReturnsDto_WhenNitIsUnique`
  - **Status:** RED — `CreateClienteCommand`, `CreateClienteCommandHandler`, `CreateClienteRequest`, `IClienteRepository.AddAsync/NitExistsAsync` do not exist yet.
  - **Verifies:** AC #9
- **Test:** `HandleAsync_ThrowsClienteNitConflictException_WhenNitExists`
  - **Status:** RED — same reason + `ClienteNitConflictException` missing.
  - **Verifies:** AC #11 (defence-in-depth: AddAsync never invoked).
- **Test:** `HandleAsync_PassesRequestValues_ToEntityFactory`
  - **Status:** RED — same reason.
  - **Verifies:** AC #9 (R-006 mapping seam anchor).

#### File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs` (12 tests, NEW)

- Happy-path: `Validate_Passes_WhenAllFieldsPresent`.
- Per-field null / empty / whitespace parametric coverage (Nombre × 3, NIT × 3, Teléfono × 2, Ciudad × 2).
- Multi-field: `Validate_ReportsAllFourErrors_WhenAllFieldsAreEmpty`.
- **Status:** RED — `CreateClienteRequest` DTO + `CreateClienteRequestValidator` do not exist yet.
- **Verifies:** AC #10 + R-006 parity (message strings hand-copied — see `clienteSchema.contract.test.ts`).

#### File: `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsCreateTests.cs` (6 tests, NEW)

- **Test:** `CreateCliente_Returns201_WithLocationHeader_AndDto_WhenBodyIsValid`
  - **Status:** RED — endpoint `POST /api/v1/clientes` is not mapped yet.
  - **Verifies:** AC #9.
- **Test:** `CreateCliente_Returns400_WithValidationProblem_WhenBodyIsIncomplete`
  - **Status:** RED — `ValidationEndpointFilter<CreateClienteRequest>` not wired.
  - **Verifies:** AC #10 (camelCase keys, Spanish messages, NFR6 anti-leak).
- **Test:** `CreateCliente_Returns400_WithSpecificField_WhenOnlyOneFieldMissing`
  - **Status:** RED.
  - **Verifies:** AC #10 (partial validation isolation).
- **Test:** `CreateCliente_Returns409_WithProblemDetails_WhenNitAlreadyExists`
  - **Status:** RED — middleware branch missing.
  - **Verifies:** AC #11 + NFR6 anti-leak (developer message "NIT '…' already exists" sentinel must NOT leak).
- **Test:** `CreateCliente_Returns409_EvenWhen_AddAsyncNeverInvoked`
  - **Status:** RED.
  - **Verifies:** AC #11 (defence-in-depth — application check prevents write).
- **Test:** `CreateCliente_PersistsRow_ThatIsThenVisibleOnGet`
  - **Status:** RED.
  - **Verifies:** AC #9 (persistence integration end-to-end).

#### File: `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddleware_NitConflictTests.cs` (1 test, NEW)

- **Test:** `Middleware_Translates_ClienteNitConflictException_To_409_ProblemDetails`
  - **Status:** RED — middleware catch branch and `ClienteNitConflictException` missing.
  - **Verifies:** AC #11 middleware seam + NFR6/R-001 anti-leak.

### Frontend Tests — Vitest + @testing-library/react + MSW

#### File: `frontend/src/modules/crm/clientes/application/clienteSchema.contract.test.ts` (10 tests, NEW)

- Happy DTO passes.
- Parametric table (8 tests): `[field, badValue (empty|whitespace), expectedSpanishMessage]` — identical hand-copied strings to backend validator (R-006 anchor).
- Multi-empty: exactly one error per field.
- **Status:** RED — `clienteSchema.ts` not created yet.
- **Verifies:** AC #3 + AC #10 (Zod ↔ FluentValidation parity anchor).

#### File: `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts` (4 tests, NEW)

- **Test:** 201 → invalidate ['clientes'] + toast.success("Cliente creado correctamente").
- **Test:** 409 → `CreateClienteError.kind === 'nit-conflict'` + Spanish `nitMessage`; toast NOT fired.
- **Test:** 500 → `kind === 'network'` + Spanish generic.title/subtitle; toast NOT fired.
- **Test:** 400 (defense-in-depth) → `kind === 'validation'`.
- **Status:** RED — `useCreateCliente.ts` + `clienteApiRepository.create` do not exist yet.
- **Verifies:** AC #2, #4, #5, #7 (mutation hook classification & side-effects).

#### File: `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx` (8 tests, NEW)

- Structure: four labels in exact order (Nombre, NIT/RUC, Teléfono, Ciudad) + two action buttons + focus on Nombre.
- Empty submit → four Spanish errors visible + onSubmit not called.
- Reactivity: typing into NIT clears NIT error (`reValidateMode: 'onChange'`).
- Happy submit → onSubmit called once with the trimmed values.
- `submitError.kind='nit-conflict'` → inline NIT error only; no top alert.
- `submitError.kind='network'` → top Alert with exact Spanish copy.
- `isSubmitting=true` → inputs readOnly, Guardar disabled + aria-busy, Cancelar enabled.
- **Status:** RED — `ClienteForm.tsx` not created yet.
- **Verifies:** AC #1, #3, #4, #7, #8.

#### File: `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.test.tsx` (6 tests, NEW)

- `open=false` → form not in DOM.
- `open=true` → title + form visible.
- Cancelar → onOpenChange(false).
- 201 → dialog closes, invalidate ['clientes'], toast.success fires.
- 409 → dialog stays open, NIT inline error visible, toast NOT fired.
- 500 → dialog stays open, top-of-form Alert visible with exact Spanish copy, toast NOT fired.
- **Status:** RED — `ClienteFormDialog.tsx` not created yet.
- **Verifies:** AC #1, #2, #4, #6, #7.

#### File: `frontend/src/routes/clientes.create.test.tsx` (2 tests, NEW)

- Happy path — open dialog on `/clientes`, submit → 201 → dialog closes → new row appears in list → toast.success fires.
- Duplicate then success — 409 → NIT inline error; edit NIT → 201 → dialog closes → toast fires.
- **Status:** RED — enable-button + dialog integration missing; also depends on invalidation-driven refetch.
- **Verifies:** AC #1, #2, #4, #5.

### E2E Tests — Playwright (route-intercepted, network-first)

#### File: `e2e/tests/clientes/story-2-3-create-client.spec.ts` (4 tests, NEW)

- **AC #1 / #2 (R-011):** open dialog → fill 4 fields → 201 → new row appears without reload + Spanish toast.
- **AC #4 (R-002):** 409 → inline NIT error surfaces; dialog stays open; toast NOT visible.
- **AC #7 / NFR6 (R-001):** DOM never contains `stackTrace`, `SqlException`, `NpgsqlException`, or the substring `exception`.
- **AC #3:** empty submit → four Spanish inline errors + POST count === 0.
- **Status:** RED — full slice not wired.
- **Verifies:** AC #1, #2, #3, #4, #7 at user-journey level.

---

## Data Factories Used (Reused)

### `buildCliente` — Vitest

- **File:** `frontend/src/test/factories/cliente.factory.ts` (Story 2.1 — no new factory needed).

### `buildCliente` — Playwright

- **File-local factory** in `e2e/tests/clientes/story-2-3-create-client.spec.ts` (mirrors the Story 2.1/2.2 local-factory convention).

**Rationale:** Story 2.3 does not introduce a new data shape — the create request is a subset of the read DTO, and the response is the same `ClienteDto` used by Story 2.1.

---

## Fixtures Created

**None new.** Story 2.3 reuses:

- `e2e/fixtures/base.fixture.ts` — Playwright base test.
- `frontend/src/test/msw/server.ts` + `handlers.ts` — MSW server + `API_BASE` constant.
- `frontend/src/test-setup.ts` — `beforeAll(server.listen)` + `afterEach(server.resetHandlers)`.
- Hand-rolled `FakeClienteRepository` inside each new backend test file — extends the Story 2.1/2.2 pattern with `AddAsync` + `NitExistsAsync` counters. The optional consolidation into `tests/Fakes/` is intentionally deferred (Story 2.4/2.5 will consolidate when three files share the fake).

---

## Mock Requirements

### Backend

- `FakeClienteRepository` (in-memory) implements the full `IClienteRepository` contract including `AddAsync` and `NitExistsAsync`. Tracks `AddAsyncCalls` and `NitExistsAsyncCalls` for defence-in-depth assertions.
- `UseEnvironment("Testing")` swaps EF Core-backed repo with the fake.
- `Results.NotFound()`/`Results.ValidationProblem()`/`ExceptionHandlingMiddleware` are the only server-side sources of RFC 7807 bodies.

### Frontend

- MSW handlers per test:
  - `POST http://localhost:5000/api/v1/clientes` → 201 with the created DTO body, or 409 with RFC 7807, or 500, or 400 for the classification unit tests.
  - `GET http://localhost:5000/api/v1/clientes` → 200 with the list body; a second call after a successful POST returns the updated list (used by the routing-integration + E2E happy-path tests).
- `siesa-ui-kit.toast` module is mocked at module level:
  ```ts
  vi.mock('siesa-ui-kit', async (importOriginal) => {
    const original = await importOriginal<typeof import('siesa-ui-kit')>()
    return { ...original, toast: { success: vi.fn(), error: vi.fn() } }
  })
  ```
- `ToastProvider` is NOT required in Vitest tests because the mocked `toast.success` is captured before any provider work.

---

## Required data-testid Attributes

### `ClienteForm` (new)

- `cliente-form` — the `<form>` element (Vitest visibility assertions).
- `cliente-form-submit` — the Guardar `<button>` (E2E resilience anchor).
- `cliente-form-alert` — the top-of-form `Alert` container (only visible on `kind === 'network'` | `'validation'`).

### `ClienteFormDialog` (new)

- `cliente-form-dialog` — the `DialogContent` element (visibility/portaling checks).

### Existing (reused)

- `data-selected="true"|"false"` on `ClienteListItem` (Story 2.1).
- Nothing else changes on the list panel.

**Implementation reminder:**

```tsx
<form data-testid="cliente-form" onSubmit={handleSubmit(onSubmit)}>
  {showGenericAlert && <Alert data-testid="cliente-form-alert" title={...} description={...} />}
  <Field id="cliente-nombre" label="Nombre" {...register('nombre')} autoFocus />
  <Field id="cliente-nit" label="NIT/RUC" {...register('nit')} />
  <Field id="cliente-telefono" label="Teléfono" {...register('telefono')} />
  <Field id="cliente-ciudad" label="Ciudad" {...register('ciudad')} />
  <Button type="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
  <Button type="default" color="primary" buttonType="submit" data-testid="cliente-form-submit"
          aria-busy={isSubmitting} disabled={isSubmitting}>Guardar</Button>
</form>
```

---

## Implementation Checklist

### Test: Backend handler (`CreateClienteCommandHandlerTests`)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`

**Tasks to make these tests pass (Tasks 1 + 3):**

- [ ] Create `backend/src/SiesaAgents.Domain/Clientes/Exceptions/ClienteNitConflictException.cs` (sealed, `.Nit` property).
- [ ] Extend `IClienteRepository` with `AddAsync(ClienteEntity, ct)` and `NitExistsAsync(string, ct)`.
- [ ] Create `CreateClienteRequest` sealed record DTO.
- [ ] Create `CreateClienteCommand` sealed record wrapping the DTO.
- [ ] Create `CreateClienteCommandHandler` (direct handler, no MediatR): NIT check → throw `ClienteNitConflictException` OR `ClienteEntity.Create(...)` + `AddAsync` + return `ClienteDto`.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~CreateClienteCommandHandlerTests`.
- [ ] ✅ Tests pass.

### Test: Backend validator (`CreateClienteRequestValidatorTests`)

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteRequestValidatorTests.cs`

**Tasks to make these tests pass (Task 3):**

- [ ] Add `FluentValidation.TestHelper` reference to the test csproj (or the `FluentValidation` package if not already present).
- [ ] Create `CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>` with `NotEmpty().WithMessage(...)` per field, Spanish messages verbatim.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~CreateClienteRequestValidatorTests`.
- [ ] ✅ Tests pass.

### Test: Backend endpoint (`ClienteEndpointsCreateTests`)

**File:** `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsCreateTests.cs`

**Tasks to make these tests pass (Tasks 2 + 4):**

- [ ] Implement `ClienteRepository.AddAsync` + `NitExistsAsync` (Task 2).
- [ ] Create `ValidationEndpointFilter<T>` (RFC 7807 400 with camelCase keys).
- [ ] Add `MapPost("/", …).AddEndpointFilter<ValidationEndpointFilter<CreateClienteRequest>>().Produces<ClienteDto>(201).ProducesValidationProblem(400).ProducesProblem(409)`.
- [ ] Add DI in `Program.cs`: `AddScoped<CreateClienteCommandHandler>()` + `AddValidatorsFromAssemblyContaining<CreateClienteRequestValidator>()`.
- [ ] Extend `ExceptionHandlingMiddleware` with a `catch (ClienteNitConflictException)` branch that emits RFC 7807 with `detail: "El NIT/RUC ya está registrado"`.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~ClienteEndpointsCreateTests`.
- [ ] ✅ Tests pass.

### Test: Middleware (`ExceptionHandlingMiddleware_NitConflictTests`)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddleware_NitConflictTests.cs`

**Tasks to make this test pass (Task 4 middleware branch):**

- [ ] Add `catch (ClienteNitConflictException)` branch before the generic `catch (Exception)` in `ExceptionHandlingMiddleware`.
- [ ] Emit HTTP 409, `application/problem+json`, `title: "Conflict"`, `detail: "El NIT/RUC ya está registrado"`; no `stackTrace`/`exception` keys.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter FullyQualifiedName~ExceptionHandlingMiddleware_NitConflictTests`.
- [ ] ✅ Test passes.

### Test: Zod schema contract (`clienteSchema.contract.test.ts`)

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.contract.test.ts`

**Tasks to make these tests pass (Task 6):**

- [ ] Create `clienteSchema.ts` with `z.object({...}).trim().min(1, { message: ... })` per field — Spanish messages verbatim.
- [ ] Run: `pnpm --dir frontend test clienteSchema.contract`.
- [ ] ✅ Tests pass.

### Test: Mutation hook (`useCreateCliente.test.ts`)

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.test.ts`

**Tasks to make these tests pass (Task 6):**

- [ ] Extend `IClienteRepository` (TS) with `create(payload, signal)` and implement on `clienteApiRepository`.
- [ ] Create `useCreateCliente.ts` with the classification helper (`kind: 'nit-conflict' | 'validation' | 'network'`) and `onSuccess: () => invalidateQueries + toast.success('Cliente creado correctamente')`.
- [ ] Run: `pnpm --dir frontend test useCreateCliente`.
- [ ] ✅ Tests pass.

### Test: Form component (`ClienteForm.test.tsx`)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteForm.test.tsx`

**Tasks to make these tests pass (Task 7):**

- [ ] Create `ClienteForm.tsx` per the Task 7 spec: React Hook Form + zodResolver + `mode: 'onSubmit'`, `reValidateMode: 'onChange'`, autoFocus on Nombre, `Alert` (destructive) at top for network errors, per-field inline errors with `role="alert"`, submit button `data-testid="cliente-form-submit"` + `aria-busy` + freeze inputs when `isSubmitting`.
- [ ] Run: `pnpm --dir frontend test ClienteForm.test`.
- [ ] ✅ Tests pass.

### Test: Form dialog (`ClienteFormDialog.test.tsx`)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.test.tsx`

**Tasks to make these tests pass (Task 7):**

- [ ] Create `ClienteFormDialog.tsx` with shadcn `Dialog` + `DialogHeader` + `DialogTitle`. Wire `useCreateCliente` in the shell; on success `mutation.reset()` + `onOpenChange(false)`; gate close during `mutation.isPending`.
- [ ] Run: `pnpm --dir frontend test ClienteFormDialog.test`.
- [ ] ✅ Tests pass.

### Test: Routing integration (`clientes.create.test.tsx`)

**File:** `frontend/src/routes/clientes.create.test.tsx`

**Tasks to make these tests pass (Task 8):**

- [ ] Enable the "Nuevo cliente" button in `ClienteListView.tsx` (drop `disabled` + `title`); add `useState` for dialog open + mount `<ClienteFormDialog>` at the bottom of the aside.
- [ ] Ensure `useCreateCliente` invalidates `['clientes']` so the list refetches and the new row surfaces.
- [ ] Mount `siesa-ui-kit ToastProvider` in `main.tsx` (or app providers) — the mocked `toast.success` still fires without it, but production requires the provider.
- [ ] Run: `pnpm --dir frontend test clientes.create`.
- [ ] ✅ Tests pass.

### Test: E2E (`story-2-3-create-client.spec.ts`)

**File:** `e2e/tests/clientes/story-2-3-create-client.spec.ts`

**Tasks to make these tests pass (Tasks 2 + 4 + 7 + 8 combined):**

- [ ] Ensure the entire vertical slice is wired.
- [ ] Run: `pnpm playwright test e2e/tests/clientes/story-2-3-create-client.spec.ts --project=chromium`.
- [ ] ✅ Tests pass.

---

## Running Tests

```bash
# Backend — only Story 2.3 tests
dotnet test backend/SiesaAgents.sln \
  --filter "FullyQualifiedName~CreateClienteCommandHandlerTests|FullyQualifiedName~CreateClienteRequestValidatorTests|FullyQualifiedName~ClienteEndpointsCreateTests|FullyQualifiedName~ExceptionHandlingMiddleware_NitConflictTests"

# Backend — full suite (Story 1.x + 2.1 + 2.2 + 2.3 baseline)
dotnet test backend/SiesaAgents.sln

# Frontend — only Story 2.3 tests
pnpm --dir frontend test clienteSchema.contract useCreateCliente ClienteForm.test ClienteFormDialog.test clientes.create

# Frontend — full suite
pnpm --dir frontend test

# E2E — Story 2.3 spec only
pnpm playwright test e2e/tests/clientes/story-2-3-create-client.spec.ts --project=chromium

# E2E — all
pnpm playwright test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All tests written and failing.
- Fixtures / factories reused (no new ones needed — Story 2.1 blessed the pattern).
- Mock requirements documented above (siesa-ui-kit `toast` module mock).
- `data-testid` requirements listed above.
- Implementation checklist created per test.

### GREEN Phase (DEV Team — Next Steps)

1. Task 1 (Domain: `AddAsync` + `NitExistsAsync` + `ClienteNitConflictException`) → unblocks handler tests.
2. Task 2 (Infrastructure: `ClienteRepository.AddAsync` + `NitExistsAsync`) → unblocks endpoint tests.
3. Task 3 (Application: DTO + Command + Handler + Validator) → GREEN on handler + validator tests.
4. Task 4 (API: endpoint + `ValidationEndpointFilter` + middleware branch) → GREEN on endpoint + middleware tests.
5. Task 6 (Frontend Application: schema + repository extension + `useCreateCliente`) → GREEN on schema + hook tests.
6. Task 7 (Presentation: `ClienteForm` + `ClienteFormDialog`) → GREEN on form + dialog tests.
7. Task 8 (Integration: enable button + mount dialog + `ToastProvider`) → GREEN on routing-integration.
8. E2E spec → GREEN once the frontend dev server serves the wired route.
9. Task 10 (verification) → typecheck, build, CSS gzip diff, full tests.

### REFACTOR Phase (DEV Team — After GREEN)

- Consider lifting `FakeClienteRepository` into `backend/tests/SiesaAgents.UnitTests/Fakes/FakeClienteRepository.cs` — three separate test files now instantiate it inline.
- Verify strict-mode typing on the `CreateClienteError` union — no `any` type in the classification helper.
- Confirm CSS gzip diff is within budget (see AC #12).

---

## Notes

- Every ATDD test is intentionally FAILING now — that is the RED phase contract.
- The backend endpoint tests share the same `WebApplicationFactory<Program>` + `UseEnvironment("Testing")` + fake-repository override pattern established by Stories 2.1 and 2.2.
- The frontend routing test reuses the Story 2.2 `mountAt(path)` helper (memory history + `routeTree`).
- `useCreateCliente.test.ts` + `ClienteFormDialog.test.tsx` + `clientes.create.test.tsx` mock `siesa-ui-kit`'s `toast` at module level so the assertions do not depend on a mounted `ToastProvider`.
- The mocked backend response strictly obeys the RFC 7807 media type (`Content-Type: application/problem+json` where applicable) so the classification helper's axios-response inspection is exercised end-to-end.
- E2E spec uses `page.route` interception BEFORE `page.goto` — the network-first pattern from the TEA knowledge base — and passes both list and POST through the same regex-matched handler (branching on `route.request().method()`).
- The R-006 parity anchor lives in two files that intentionally do NOT share a fixture: `CreateClienteRequestValidatorTests.cs` (backend) and `clienteSchema.contract.test.ts` (frontend). If a message string drifts on either side, one suite will fail first at PR time.
- No new Zustand store, no new global QueryClient — matches Story 2.1/2.2 architectural conventions.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Reused Story 2.1's `server` (MSW) + `wrapperFactory` patterns.
- **data-factories.md** — Reused `buildCliente` factory from Story 2.1.
- **network-first.md** — Playwright `page.route(...)` registered BEFORE `page.goto(...)` in every E2E test.
- **selector-resilience.md** — data-testid + role-based selectors; label-based for form inputs (accessible by design).
- **test-quality.md** — Given-When-Then structure, atomic assertions per test, no hard waits (only bounded `waitForTimeout` for negative-space assertions e.g. "no POST fired").
- **test-levels-framework.md** — Component (Vitest + RTL) as primary level for branches; Contract (Zod↔FluentValidation parity); Routing-integration for URL seam; Backend integration for endpoint/handler/middleware; E2E for user journey.
- **timing-debugging.md** — 409/500 no-retry semantics use handler call-count assertions; MSW handlers assert POST count negatively for the empty-form case.
- **component-tdd.md** — `ClienteForm` tests exercise the red→green→refactor loop for form validation branches (Zod resolver, reValidateMode, freeze-during-submit).

---

## Next Steps

1. Share this checklist and the failing tests with the dev workflow (manual handoff).
2. Run the failing suites to confirm RED:
   - `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~CreateClienteCommandHandlerTests|FullyQualifiedName~ClienteEndpointsCreateTests"`
   - `pnpm --dir frontend test clienteSchema.contract useCreateCliente ClienteForm.test ClienteFormDialog.test`
3. Begin implementation task-by-task per the checklist above.
4. When all tests are green, run `pnpm --dir frontend test -- --coverage` to verify `> 80%` on new files.
5. Manual smoke: navigate to `/clientes`, click Nuevo cliente, fill 4 fields, submit, verify the row appears in the list AND the toast displays; test duplicate NIT flow.

---

**Generated by BMad TEA Agent** — 2026-07-08
