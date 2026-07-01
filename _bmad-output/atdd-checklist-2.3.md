# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit) for backend contract (409/400/201) — the epic's highest-risk paths (R1, R3); Component (Vitest + RTL + MSW) for `ClienteForm` behavior; E2E (Playwright) for the P0 full-stack create journey (TC-E2-P0-06)

---

## Story Summary

As a commercial team member, I want to register a new client by filling in a form, so that the client is available in the system immediately for the whole team.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form (`ClienteForm`) opens with fields: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad` (all required per FR1).
2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created and appears in the client list immediately, no manual refresh, no full page reload (FR27). **And** a toast de éxito muestra exactamente "Cliente creado correctamente" (TC-E2-P0-06, TC-E2-P2-05).
3. **Given** the user submits the form with one or more required fields empty (or whitespace-only), **When** the form is validated, **Then** clear inline error messages appear on the empty fields (FR8) via Zod (frontend). **And** the form is NOT submitted to the backend (AC-E2.4).
4. **Given** the backend independently validates the request (defense in depth, TC-E2-P0-05), **When** a `POST /api/v1/clientes` is made with empty/whitespace-only required fields (bypassing frontend), **Then** the backend returns `400 Bad Request` with FluentValidation field-level error details and no record is persisted.
5. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a `409 Conflict`, **Then** an error message indicates "El NIT/RUC ya está registrado" without exposing technical details (NFR6). **And** the form remains open with the entered data intact (no data loss).

---

## Test Framework Note

This is the first Epic 2 story to introduce a **write path** (Command) on both backend and frontend. RED-phase coverage spans all four levels called out in test-design-epic-2.md for Story 2.3 (TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-05, TC-E2-P0-06, TC-E2-P2-01, TC-E2-P2-02, TC-E2-P2-05):

- **Backend API Integration (xUnit + `WebApplicationFactory<Program>`)** — extends `ClienteEndpointsTests.cs` with `POST /api/v1/clientes` cases (201/409/400). Requires a real PostgreSQL connection (`uk_clientes_nit` constraint enforcement is not honored by EF InMemory).
- **Backend Repository Integration (xUnit)** — extends `ClienteRepositoryTests.cs` with `AddAsync` happy-path + duplicate-NIT `DbUpdateException` cases, against the same real Postgres connection.
- **Backend Unit (xUnit)** — new `CreateClienteRequestValidatorTests.cs`, pure FluentValidation tests with zero HTTP/DB dependency (TC-E2-P2-02).
- **Frontend Unit (Vitest)** — new `clienteSchema.test.ts` for the Zod schema in isolation (TC-E2-P2-01).
- **Frontend Component (Vitest + RTL + MSW)** — new `useCreateCliente.test.tsx` (mutation hook contract) and `ClienteForm.test.tsx` (form behavior, all ACs), plus a small additive `ClienteListView.create-trigger.test.tsx` for the new "Nuevo cliente" button/dialog composition on the existing list view.
- **E2E (Playwright)** — new `e2e/tests/clientes/create-client.spec.ts`, the story-mandated path, covering the full create→list→detail journey (TC-E2-P0-06) plus AC #3/#5 UI-level validation paths.

**Test infrastructure extended in this ATDD pass** (did not exist before):

- `frontend/src/test/msw/handlers.ts` — added a default `POST /api/v1/clientes` 201 success handler, `clienteNitConflictProblemDetails` (409 Problem Details fixture), and `clienteValidationErrorProblemDetails` (400 FluentValidation-shaped fixture). Reuses the existing `createCliente` factory — no new entity shape.
- `e2e/tests/clientes/create-client.spec.ts` — new dedicated E2E spec (story-mandated path), separate from the pre-existing generic `clientes-crud.spec.ts` (which has a lighter FR4/FR7/FR8 create smoke-test predating this story's detailed AC breakdown; both files coexist, no overlap removed).

**Note on `sonner`/toast wiring (blocking implementation dependency):** the architecture mandates `toast.success('Cliente creado correctamente')` on the mutation's `onSuccess`. This project has **no toast library mounted at the app root yet** — `siesa-ui-kit@^1.0.250` exports `toast` + `ToastProvider` (`export { Toast, ToastProvider, toast } from './components/Toast'`), which is the P0 choice per the company's "check siesa-ui-kit first" rule. All component tests here `vi.mock('siesa-ui-kit')`'s `toast` export directly. **DEV must additionally mount `<ToastProvider>` in `frontend/src/main.tsx`** (currently only `QueryProvider` + `RouterProvider`) for the toast to render in the real app — this is not covered by a failing test in this ATDD pass (component tests mock the import, so they don't exercise the real provider), but is called out here explicitly so it isn't missed during GREEN.

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `e2e/tests/clientes/create-client.spec.ts` (new, 152 lines)

- `TC-E2-P0-06 — AC #1: "Nuevo cliente" opens a form with Nombre, NIT/RUC, Teléfono, Ciudad` — RED: no "Nuevo cliente" button exists on `ClienteListView` yet
- `TC-E2-P0-06 — AC #2: submitting valid data creates the client and it appears in the list immediately` — RED: `POST /api/v1/clientes` endpoint does not exist (405/404), form does not exist
- `TC-E2-P0-06 — AC #2: shows the exact success toast "Cliente creado correctamente" (TC-E2-P2-05)` — RED: no toast provider mounted, no form, no endpoint
- `TC-E2-P0-06 — AC #2: newly created client is selectable and its detail matches submitted values` — RED: cannot create a client (no endpoint/form)
- `AC #3: submitting the form with all required fields empty shows inline errors and does not create a client` — RED: form does not exist
- `AC #5: submitting a duplicate NIT/RUC shows "El NIT/RUC ya está registrado" and keeps the form open with data intact` — RED: 409 mapping does not exist (`ExceptionHandlingMiddleware` currently only handles the generic 500 case), form does not exist

### API Tests (13 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` (extended, +11 tests)

- `PostClientes_WithValidPayload_ReturnsCreated` — RED: `POST /api/v1/clientes` route not mapped in `ClienteEndpoints.cs`
- `PostClientes_WithValidPayload_ReturnsBodyMatchingSubmittedFields` — RED: endpoint does not exist
- `PostClientes_WithValidPayload_IncludesLocationHeaderPointingToGetById` — RED: endpoint does not exist
- `PostClientes_WithDuplicateNit_ReturnsConflict` — RED: endpoint does not exist; 409 mapping does not exist
- `PostClientes_WithDuplicateNit_ReturnsProblemDetailsWithSpanishMessageAndNoTechnicalLeakage` — RED: endpoint + 409 mapping do not exist
- `PostClientes_WithDuplicateNit_DoesNotPersistASecondRecord` — RED: endpoint does not exist
- `PostClientes_WithEmptyNombreAndMissingNit_ReturnsBadRequest` — RED: endpoint + validator do not exist
- `PostClientes_WithEmptyNombreAndMissingNit_ReturnsFieldLevelErrorsForBoth` — RED: endpoint + validator do not exist
- `PostClientes_WithAllFieldsWhitespaceOnly_ReturnsBadRequest` — RED: endpoint + validator do not exist
- `PostClientes_WithInvalidPayload_DoesNotPersistAnyRecord` — RED: endpoint does not exist

**File:** `backend/tests/SiesaAgents.IntegrationTests/Repositories/ClienteRepositoryTests.cs` (extended, +2 tests)

- `AddAsync_WithValidCliente_PersistsItAndIsRetrievableAfterwards` — RED: `ClienteRepository`/`IClienteRepository` do not declare `AddAsync` (build error: `CS1061`)
- `AddAsync_WithDuplicateNit_ThrowsDbUpdateExceptionFromUniqueConstraint` — RED: same build error

### Unit Tests (Backend, 9 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Validators/CreateClienteRequestValidatorTests.cs` (new, 118 lines)

- `Validate_WithAllFieldsPopulated_IsValid` — RED: `CreateClienteCommand`/`CreateClienteRequestValidator` do not exist (build error: `CS0234`/`CS0246`)
- `Validate_WithEmptyOrWhitespaceNombre_IsInvalid` (×3 inline cases) — RED: same build error
- `Validate_WithEmptyOrWhitespaceNit_IsInvalid` (×3 inline cases) — RED: same build error
- `Validate_WithEmptyOrWhitespaceTelefono_IsInvalid` (×3 inline cases) — RED: same build error
- `Validate_WithEmptyOrWhitespaceCiudad_IsInvalid` (×3 inline cases) — RED: same build error
- `Validate_WithAllFieldsWhitespaceOnly_ReturnsAnErrorForEachField` — RED: same build error

### Unit Tests (Frontend, 8 tests)

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts` (new, 103 lines)

- `should return success: true for a fully valid payload` — RED: `clienteSchema.ts` does not exist (`Failed to resolve import`)
- `should return success: false when nombre is an empty string` — RED: module not found
- `should return an issue on the nombre path when nombre is whitespace-only` — RED: module not found
- `should return success: false when nit is an empty string` — RED: module not found
- `should return success: false when telefono is an empty string` — RED: module not found
- `should return success: false when ciudad is an empty string` — RED: module not found
- `should report an issue for every field when all are empty` — RED: module not found
- `should produce Spanish error messages` — RED: module not found

### Component Tests (24 tests)

**File:** `frontend/src/modules/crm/clientes/application/hooks/useCreateCliente.test.tsx` (new, 143 lines)

- `should invalidate the ["clientes"] query cache on successful create` — RED: `useCreateCliente.ts` does not exist (`Failed to resolve import`)
- `should call toast.success with the exact copy "Cliente creado correctamente" (TC-E2-P2-05)` — RED: module not found
- `should reject with the 409 error when the backend returns a duplicate NIT/RUC conflict` — RED: module not found
- `should NOT call toast.success when the backend returns a 409 conflict` — RED: module not found
- `should call toast.error with the generic message for a non-409 failure (e.g. 500)` — RED: module not found
- `should NOT invalidate the query cache when the create request fails` — RED: module not found

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteForm.test.tsx` (new, 213 lines)

- **AC #1 — renders all required fields:** 5 tests (Nombre, NIT/RUC, Teléfono, Ciudad, "Guardar" button) — RED: `ClienteForm.tsx` does not exist
- **AC #3 — required-field validation blocks submission:** 3 tests (inline error, mutation not called on empty, mutation not called on whitespace-only Nombre) — RED: module not found
- **AC #2 — successful submit:** 2 tests (exact success toast, `onSuccess` callback invoked) — RED: module not found
- **AC #5 — 409 duplicate NIT/RUC:** 4 tests (friendly message shown, form stays open/`onSuccess` not called, entered values intact, no generic toast fired) — RED: module not found

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.create-trigger.test.tsx` (new, 60 lines — additive to Story 2.1's `ClienteListView.test.tsx`, does not duplicate its coverage)

- `should render a "Nuevo cliente" button` — RED: no such button exists on `ClienteListView.tsx` yet
- `should open the ClienteForm dialog when "Nuevo cliente" is clicked` — RED: button + dialog + form do not exist
- `should NOT restructure the existing list/search rendering (search input still present)` — PASSES already (pre-existing behavior; included as a regression guard, not a RED-phase test)

---

## Data Factories Created

No new data factories were required. Story 2.3 reuses the existing `Cliente` factory (Story 2.1):

**File:** `frontend/src/test/factories/cliente.factory.ts` (unchanged)

- `createCliente(overrides?)` — used to build valid create-payloads in component/E2E tests
- `createClientes(count)` — used in the "Nuevo cliente" trigger tests' seeded list

**File:** `e2e/helpers/data.helper.ts` (unchanged)

- `buildCliente(overrides?)` — used in `create-client.spec.ts` for valid/duplicate-NIT payloads

---

## Fixtures Created

No new Playwright fixtures were required — `create-client.spec.ts` reuses the existing `e2e/fixtures/base.fixture.ts`, `ClientesPage` (page object, already has `abrirFormularioNuevo`/`llenarFormulario`/`guardar`/`seleccionarCliente`), and `ApiHelper` (already has `createCliente`/`deleteCliente`/`getClientes`) established in Stories 2.1/2.2.

---

## Mock Requirements

### `POST /api/v1/clientes` Mock (MSW, frontend)

**File:** `frontend/src/test/msw/handlers.ts`

**Success Response (201):**

```json
{
  "id": "<uuid>",
  "nombre": "<submitted or faker default>",
  "nit": "<submitted or faker default>",
  "telefono": "<submitted or faker default>",
  "ciudad": "<submitted or faker default>",
  "createdAt": "<ISO timestamp>"
}
```

**409 Conflict Response** (`clienteNitConflictProblemDetails`):

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado"
}
```

**400 Bad Request Response** (`clienteValidationErrorProblemDetails`):

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "nombre": ["Este campo es obligatorio"],
    "nit": ["Este campo es obligatorio"]
  }
}
```

**Notes:** Individual tests override the default 201 handler via `server.use(...)` for the 409/400 paths, per `network-first.md` — the override is always registered before the DOM interaction that triggers the mutation.

### `siesa-ui-kit` `toast` Mock (Vitest)

Both `useCreateCliente.test.tsx` and `ClienteForm.test.tsx` use `vi.mock('siesa-ui-kit', ...)` to replace only the `toast` export (`success`/`error`/`warning`/`info` spies) while keeping all other real exports (`Input`, etc.) via `vi.importActual`. This isolates assertions on toast copy/invocation without needing a real `ToastProvider` context mounted in the component test tree.

---

## Required data-testid Attributes

No **new** `data-testid` attributes are strictly required beyond what Stories 2.1/2.2 already established (`clientes-list-panel`, `cliente-list-item`, `cliente-search-input`), because this story's tests primarily target accessible roles/labels (`getByRole('dialog')`, `getByRole('button', { name: /nuevo cliente/i })`, `getByLabelText(/nombre/i)`) per selector-resilience.md's data-testid > ARIA > text hierarchy — ARIA/label queries were preferred here since `ClienteForm` is a labeled form and the dialog is a native `role="dialog"` (Radix `Dialog`, already scaffolded at `frontend/src/shared/components/ui/dialog.tsx`).

### ClienteListView (extended)

- `nuevo-cliente-button` (optional, recommended) — if the accessible name alone (`getByRole('button', { name: /nuevo cliente/i })`) proves brittle in practice, add this testid; tests currently pass via role+name and do not require it.

### ClienteForm (new)

- Standard HTML `<label htmlFor>` / `id` pairing for all four fields is sufficient (tests use `getByLabelText`) — no testid required.
- The 409 inline error message must be plain visible text reading exactly `"El NIT/RUC ya está registrado"` (tests use `getByText` with the exact string).

**Implementation Example:**

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="nombre">Nombre</label>
      <Input id="nombre" {...register('nombre')} />
      {errors.nombre && <p>{errors.nombre.message}</p>}
      {/* ...NIT/RUC, Teléfono, Ciudad... */}
      {conflictError && <p role="alert">{conflictError}</p>}
      <Button type="submit">Guardar</Button>
    </form>
  </DialogContent>
</Dialog>
```

---

## Implementation Checklist

### Test: Backend — `AddAsync` + uniqueness (Repository tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Repositories/ClienteRepositoryTests.cs`

**Tasks to make this test pass:**

- [ ] Add `Task AddAsync(ClienteEntity cliente, CancellationToken ct)` to `IClienteRepository`
- [ ] Implement `AddAsync` in `ClienteRepository` (`Add` + `SaveChangesAsync`, no pre-check query)
- [ ] Confirm `uk_clientes_nit` unique index is active (Story 2.1 migration — should already be in place)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ClienteRepositoryTests`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: Backend — `CreateClienteCommand` + Handler + Validator (Unit tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Validators/CreateClienteRequestValidatorTests.cs`

**Tasks to make this test pass:**

- [ ] Create `CreateClienteCommand.cs` (record: `Nombre`, `Nit`, `Telefono`, `Ciudad`) in `Application/Commands/Clientes/`
- [ ] Create `CreateClienteRequestValidator.cs` (FluentValidation, `NotEmpty()` on all four fields) in `Application/Validators/`
- [ ] Create `CreateClienteCommandHandler.cs` (calls `ClienteEntity.Create` → `IClienteRepository.AddAsync` → maps to `ClienteDto`)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter FullyQualifiedName~CreateClienteRequestValidatorTests`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: Backend — `POST /api/v1/clientes` endpoint (Integration tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs`

**Tasks to make this test pass:**

- [ ] Add `app.MapPost("/api/v1/clientes", ...)` to `ClienteEndpoints.cs` — `201 Created` + `ClienteDto` + `Location` header on success
- [ ] Wire FluentValidation into the endpoint pipeline (or invoke explicitly in the handler) → `400` with `errors: { field: [...] }` shape on failure
- [ ] Catch the unique-constraint `DbUpdateException` (in `ClienteEndpoints.cs` or `ExceptionHandlingMiddleware.cs`) → map to `409 Conflict` with Problem Details `detail: "El NIT/RUC ya está registrado"` — no `Npgsql`/`DbUpdateException`/constraint-name text in the response body
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ClienteEndpointsTests`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2.0 hours

---

### Test: Frontend — `clienteSchema.ts` (Unit test)

**File:** `frontend/src/modules/crm/clientes/application/clienteSchema.test.ts`

**Tasks to make this test pass:**

- [ ] Create `clienteSchema.ts` in `frontend/src/modules/crm/clientes/application/` — Zod object with `nombre`/`nit`/`telefono`/`ciudad` all `z.string().trim().min(1, { message: 'Este campo es obligatorio' })`
- [ ] Export the inferred TS type for `ClienteForm` reuse
- [ ] Run test: `pnpm --filter frontend test -- clienteSchema.test.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Frontend — `useCreateCliente` mutation hook

**File:** `frontend/src/modules/crm/clientes/application/hooks/useCreateCliente.test.tsx`

**Tasks to make this test pass:**

- [ ] Add `create(data): Promise<Cliente>` to `IClienteRepository.ts` (frontend domain interface)
- [ ] Implement `create` in `clienteApiRepository.ts` — `POST /api/v1/clientes`, let 409/400 propagate as a rejected promise
- [ ] Create `useCreateCliente.ts` — TanStack `useMutation`; `onSuccess`: invalidate `['clientes']` + `toast.success('Cliente creado correctamente')` (import `toast` from `siesa-ui-kit`); `onError`: if `isAxiosError` + `status === 409`, do NOT toast (let the caller/form render inline) — otherwise `toast.error('No se pudo guardar. Intenta de nuevo.')`
- [ ] Add `**MUST**: mount `<ToastProvider>` from `siesa-ui-kit` in `frontend/src/main.tsx`** so `toast()` calls render in the real app (not required for these mocked tests, but required for the app itself and for E2E)
- [ ] Run test: `pnpm --filter frontend test -- useCreateCliente.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Frontend — `ClienteForm.tsx` component

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteForm.test.tsx`

**Tasks to make this test pass:**

- [ ] Create `ClienteForm.tsx` — React Hook Form + `zodResolver(clienteSchema)`, fields Nombre/NIT/RUC/Teléfono/Ciudad using `siesa-ui-kit` `Input` with `<label htmlFor>` bound via RHF `register`
- [ ] Render inline error text under each field bound to `formState.errors`
- [ ] On submit, call `useCreateCliente().mutateAsync(data)`; on success, call the `onSuccess` prop (host closes the dialog) + rely on the hook's toast
- [ ] On a typed 409 error, use RHF `setError` (or a dedicated inline banner) to show "El NIT/RUC ya está registrado" — do NOT call `onSuccess`, do NOT reset the form (values must remain populated)
- [ ] Accept `mode: 'create' | 'edit'` + optional `initialValues` prop surface (Story 2.4 will wire the edit path; this story implements only `mode="create"` behavior)
- [ ] Run test: `pnpm --filter frontend test -- ClienteForm.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2.5 hours

---

### Test: Frontend — "Nuevo cliente" trigger on `ClienteListView`

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.create-trigger.test.tsx`

**Tasks to make this test pass:**

- [ ] Check `siesa-ui-kit` for a dialog/modal primitive; if none confirmed, use the already-scaffolded `shadcn/ui Dialog` (`frontend/src/shared/components/ui/dialog.tsx`) per the architecture's fallback order
- [ ] Add a `siesa-ui-kit` `Button` labeled "Nuevo cliente" to `ClienteListView.tsx`, composed with the `Dialog`/`DialogContent` hosting `<ClienteForm mode="create" onSuccess={() => setOpen(false)} />` — additive only, do not restructure existing list/search rendering
- [ ] Run test: `pnpm --filter frontend test -- ClienteListView.create-trigger.test.tsx`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: E2E — Create Client journey

**File:** `e2e/tests/clientes/create-client.spec.ts`

**Tasks to make this test pass:**

- [ ] All backend tasks above complete (`POST /api/v1/clientes` live end-to-end)
- [ ] All frontend tasks above complete (`ClienteForm`, "Nuevo cliente" trigger, `useCreateCliente`, `ToastProvider` mounted in `main.tsx`)
- [ ] Run test: `npx playwright test e2e/tests/clientes/create-client.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours (verification only, assuming above tasks are complete)

---

## Running Tests

```bash
# Run all Story 2.3 frontend tests
pnpm --filter frontend test -- clienteSchema.test.ts useCreateCliente.test.tsx ClienteForm.test.tsx ClienteListView.create-trigger.test.tsx

# Run all Story 2.3 backend tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter FullyQualifiedName~CreateClienteRequestValidatorTests
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~ClienteEndpointsTests|FullyQualifiedName~ClienteRepositoryTests"

# Run the E2E create-client spec (requires frontend + backend running)
npx playwright test e2e/tests/clientes/create-client.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/clientes/create-client.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/clientes/create-client.spec.ts --debug

# Run full suites with coverage
pnpm --filter frontend test
dotnet test backend/SiesaAgents.sln
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 60 failing tests written across E2E (6), API integration (13), backend unit (9 incl. inline theory cases), frontend unit (8), and component (24) levels
- ✅ RED phase verified: frontend tests fail with `Failed to resolve import` (module not found) or `Unable to find an accessible element`; backend tests fail to compile (`CS0234`/`CS0246`/`CS1061` — `AddAsync`, `CreateClienteCommand`, `CreateClienteRequestValidator` do not exist), confirming failures are due to missing implementation, not test bugs
- ✅ MSW handlers extended (201/409/400 fixtures) with auto-registered defaults, overridable per test
- ✅ Mock requirements documented (siesa-ui-kit `toast` mock, MSW Problem Details fixtures)
- ✅ data-testid/ARIA requirements listed
- ✅ Implementation checklist created, mapped 1:1 to the story's existing Tasks 1-6

**Verification command results (RED confirmed):**

```
pnpm --filter frontend test -- clienteSchema.test.ts useCreateCliente.test.tsx ClienteForm.test.tsx ClienteListView.create-trigger.test.tsx
  → 4 test files failed (3 via "Failed to resolve import", 1 via 2 failing assertions
    for the not-yet-existing "Nuevo cliente" button; its 3rd test already passes
    since it only asserts pre-existing search-input behavior)

dotnet build backend/SiesaAgents.sln
  → Build FAILED: 5 compile errors, all pointing at the exact missing Story 2.3
    symbols (Commands namespace, Validators namespace, CreateClienteCommand,
    ClienteRepository.AddAsync) — zero unrelated/accidental failures

npx playwright test e2e/tests/clientes/create-client.spec.ts --list
  → 24 tests listed (6 scenarios × 4 browser projects), confirms the spec
    parses correctly; full run requires the dev server + backend running and
    will fail at the "Nuevo cliente" button / POST endpoint, as expected
```

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Start with the backend unit test (`CreateClienteRequestValidatorTests`) — smallest, no DB dependency
2. Then backend repository (`AddAsync`) and endpoint (`POST /api/v1/clientes`) tests — require a real Postgres connection
3. Then frontend unit (`clienteSchema`), then component (`useCreateCliente`, `ClienteForm`, list-view trigger)
4. **Mount `<ToastProvider>` in `main.tsx`** before attempting the E2E suite — toasts will not render in the real app otherwise
5. Finish with the E2E spec once both backend and frontend tasks are green

**Key Principles:**

- One test at a time, minimal implementation, run tests frequently
- Do not modify `GetAllAsync`/`GetByIdAsync` (Stories 2.1/2.2) — this story is purely additive to `IClienteRepository`/`ClienteRepository`
- Do not modify the existing `GET /api/v1/clientes` or `GET /api/v1/clientes/{id}` endpoints

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (`pnpm --filter frontend test` + `dotnet test backend/SiesaAgents.sln` + full Playwright run)
2. Review `ClienteForm`'s prop surface for clean Story 2.4 (edit-mode) reuse without premature abstraction
3. Ensure tests still pass after each refactor
4. Update `_bmad-output/implementation-artifacts/2-3-create-client.md` Dev Agent Record (File List, Completion Notes) when done

---

## Next Steps

1. Share this checklist and the failing tests with the dev workflow (manual handoff)
2. Run failing tests to reconfirm RED phase in the target dev environment (`dotnet test` requires a live PostgreSQL at `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`, matching Stories 2.1/2.2's precedent)
3. Begin implementation using the Implementation Checklist above, one test at a time
4. Mount `ToastProvider` early — several GREEN-phase component tests depend on the mocked `toast` import matching the real one's shape
5. When all tests pass, refactor code for quality
6. When refactoring is complete, manually update story status to `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- **data-factories.md** — reused `createCliente`/`buildCliente` factories (faker-based, override-friendly), no new factory needed since the response shape (`ClienteDto`/`Cliente`) is unchanged; only the request/command shape is new
- **network-first.md** — every MSW `server.use(...)` override registered before the DOM interaction that triggers the mutation; every Playwright test structured to fill+submit only after page/dialog is confirmed visible
- **test-quality.md** — one behavior per test (e.g., separate tests for "shows message" vs "keeps onSuccess uncalled" vs "preserves field values" on the 409 path, rather than one mega-assertion test)
- **component-tdd.md** — provider isolation via fresh `QueryClient` per test in `useCreateCliente.test.tsx`/`ClienteForm.test.tsx`; `vi.mock` with `importActual` to isolate only the `toast` export
- **selector-resilience.md** — ARIA role/label queries (`getByRole('dialog')`, `getByLabelText`) preferred over new custom `data-testid`s where the underlying primitives (Radix `Dialog`, labeled `Input`) already provide stable accessible semantics
- **test-levels-framework.md** — P0 risk (409/400 backend contract, R1/R3) pushed to API integration + unit levels for fast, precise failure isolation; the full user journey reserved for the single P0 E2E scenario (TC-E2-P0-06)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Notes

- The pre-existing `e2e/tests/clientes/clientes-crud.spec.ts` already contains a lighter `FR4`/`FR7`/`FR8` create-client smoke test predating this story's detailed AC breakdown. It was left untouched (no test removed) — `create-client.spec.ts` is the story-mandated, more granular replacement/superset for Story 2.3's specific ACs; consider consolidating or retiring the overlapping `clientes-crud.spec.ts` cases during a future `testarch-automate`/cleanup pass, but that is out of scope for this ATDD RED-phase pass (removing existing passing/documented tests is not this workflow's responsibility).
- `ClienteForm`'s `mode`/`initialValues` prop surface is deliberately included now (per the story's Dev Notes) so Story 2.4 (Edit Client) can reuse it without a rewrite — only the `create` path's behavior is tested/expected to pass in this story.
- Backend 409 mapping location (endpoint vs. middleware) is left to DEV's judgment per the story text ("whichever layer Story 1.3/2.2 established") — tests assert only on the HTTP contract (status code + body shape), not on which file performs the mapping.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `./bmm/docs/tea-README.md` for workflow documentation
- Consult `./bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-07-01
