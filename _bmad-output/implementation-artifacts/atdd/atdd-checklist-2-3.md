# ATDD Checklist — Epic 2, Story 2.3: Create Client

**Date:** 2026-05-20
**Story:** 2.3 — Create Client
**Epic:** 2 — Client Management
**Phase:** RED (failing tests written; implementation not yet started)

---

## Story Summary

**As a** commercial team member,
**I want** to register a new client by filling in a form,
**So that** the client is available in the system immediately for the whole team.

---

## Acceptance Criteria

1. **AC1** — Given the user is on the `/clientes` view, When the user clicks "Nuevo cliente", Then a dialog form opens with four fields: Nombre, NIT/RUC, Teléfono, Ciudad — all marked as required (FR1).

2. **AC2** — Given the user fills all required fields and clicks "Guardar", When the form is submitted, Then the client is created via `POST /api/v1/clientes`, the dialog closes, the new client appears in the left panel list immediately without a page reload (FR27), and a toast displays "Cliente creado correctamente".

3. **AC3** — Given the user clicks "Guardar" with one or more required fields empty, When the Zod schema validation runs on submit, Then inline error messages appear under each empty field (FR8), the form does NOT send any request to the backend, and the dialog remains open.

4. **AC4** — Given the user submits a NIT/RUC that already exists, When the backend returns HTTP 409, Then an inline error message "El NIT/RUC ya está registrado" appears in the form without exposing technical details (NFR6), and the dialog remains open.

---

## Failing Tests Created (RED Phase)

### E2E Tests — Playwright (7 tests)

**File:** `e2e/tests/clientes/clientes-create.spec.ts`

- **Test: E2E-C-11** — "Nuevo cliente" abre el formulario con los 4 campos requeridos
  - **Priority:** P0
  - **AC:** AC1
  - **Status:** RED — `ClienteListPanel` does not yet have the "Nuevo cliente" button (`data-testid="btn-nuevo-cliente"`); `ClienteFormDialog` component not implemented; `data-testid="cliente-form-dialog"` does not exist; `data-testid="input-nombre|input-nit|input-telefono|input-ciudad"` not present
  - **Verifies:** `btnNuevoCliente` is visible in the list panel; clicking it opens a dialog (`role="dialog"`); all 4 inputs and both action buttons (`btn-guardar`, `btn-cancelar`) are visible inside `cliente-form-dialog`

- **Test: E2E-C-12** — enviar formulario completo crea el cliente y lo muestra en la lista sin recargar
  - **Priority:** P0
  - **AC:** AC2
  - **Status:** RED — `ClienteFormDialog` not implemented; `btn-guardar` click does not fire `POST /api/v1/clientes`; `queryClient.invalidateQueries({ queryKey: ['clientes'] })` not triggered; new client does not appear in list without reload
  - **Verifies:** Exactly one POST call to `/api/v1/clientes`; dialog closes after submit; new client item visible in `clienteItems` without `page.reload()`; cleanup via `apiHelper.getClientes()`

- **Test: E2E-C-13** — enviar formulario vacío muestra errores inline y no lanza petición POST
  - **Priority:** P0
  - **AC:** AC3 (Risk R8)
  - **Status:** RED — `clienteSchema.ts` Zod schema not implemented; form submit without validation fires POST (or does nothing); inline error text for all 4 required fields not rendered; `postFired` assertion fails
  - **Verifies:** Clicking `btn-guardar` on an empty form keeps dialog open; Spanish error text visible for Nombre, NIT, Teléfono, Ciudad; `postFired === false` (no network request made)

- **Test: E2E-C-14** — formulario parcialmente vacío muestra errores solo en campos vacíos
  - **Priority:** P0
  - **AC:** AC3
  - **Status:** RED — same root cause as E2E-C-13; conditional per-field error rendering not implemented; error-nit element present when NIT is filled (unexpected error) or absent when empty
  - **Verifies:** With Nombre + NIT filled, Teléfono + Ciudad empty — errors visible for empty fields only; `data-testid="error-nit"` NOT visible; Nombre error NOT visible; `postFired === false`

- **Test: E2E-C-15** — NIT duplicado devuelve 409 y muestra "El NIT/RUC ya está registrado" en el formulario
  - **Priority:** P0
  - **AC:** AC4 (Risk R2)
  - **Status:** RED — `ClienteFormDialog` 409 error branch not implemented; `setError('nit', { message: 'El NIT/RUC ya está registrado' })` not called on 409 response; `data-testid="error-nit"` does not contain the expected Spanish message; dialog closes or shows generic error instead
  - **Verifies:** Creates existing client via `apiHelper`; submits form with same NIT; dialog stays open; `error-nit` element visible and contains "El NIT/RUC ya está registrado"; page content has no stack trace / DbUpdateException text (NFR6)

- **Test: E2E-C-16** — toast "Cliente creado correctamente" aparece tras creación exitosa
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `useCreateCliente` hook not implemented; `toast.success('Cliente creado correctamente')` not called on mutation `onSuccess`; no toast visible after form submit
  - **Verifies:** After successful form submit, `page.getByText(/cliente creado correctamente/i)` is visible (toast notification rendered)

- **Test: E2E-C-17** — el formulario se cierra automáticamente tras una creación exitosa
  - **Priority:** P1
  - **AC:** AC2
  - **Status:** RED — `ClienteFormDialog` `onSuccess` callback calling `onClose()` not implemented; dialog stays open after successful creation instead of hiding automatically
  - **Verifies:** After `btn-guardar` click on a valid form, `form` (role="dialog") becomes hidden without manual cancel; `listPanel` still visible (no full-page navigation)

---

### API Integration Tests — Playwright APIRequestContext (3 tests)

**File:** `e2e/tests/clientes/clientes-create.spec.ts`

- **Test: API-C-01** — POST /api/v1/clientes con payload válido devuelve 201 + cuerpo completo con UUID y createdAt ISO 8601
  - **Priority:** P0
  - **AC:** AC2
  - **Status:** RED — `POST /api/v1/clientes` endpoint exists but `CreateClienteCommandHandler` may not be fully wired; 201 response with full body fields (id UUID v4, nombre, nit, telefono, ciudad, createdAt ISO 8601 with timezone) may not be serialized correctly
  - **Verifies:** HTTP 201; `body.id` matches UUID v4 regex; `body.nombre/nit/telefono/ciudad` match submitted payload; `body.createdAt` matches ISO 8601 + timezone regex; no `data` wrapper

- **Test: API-C-02** — POST /api/v1/clientes con NIT duplicado devuelve 409 + Problem Details sin stackTrace
  - **Priority:** P0
  - **AC:** AC4 (Risk R2, NFR6)
  - **Status:** RED — `ExceptionHandlingMiddleware` likely maps `DbUpdateException` to 500, not 409; `ConflictException` domain class may not exist; PostgreSQL error code `23505` not detected and re-thrown as conflict; response body may contain stack trace
  - **Verifies:** HTTP 409; `body.status === 409`; `body.title` non-empty; `body.detail` matches `/NIT|RUC|registrado/i`; no `stackTrace`, `StackTrace`, `exception` keys; body JSON has no "at SiesaAgents" or "DbUpdateException" text (NFR6)

- **Test: API-C-03** — POST /api/v1/clientes sin campo nombre devuelve 400 + Problem Details
  - **Priority:** P0
  - **AC:** AC3
  - **Status:** RED — `CreateClienteCommandValidator` (FluentValidation) validates empty Nombre; middleware may return 500 instead of 400 if unhandled; `body.status === 400` assertion may fail; no `stackTrace` assertion
  - **Verifies:** HTTP 400; `body.status === 400`; `body.title` non-empty; no `stackTrace` or `exception` keys exposed (NFR6)

---

## Total Tests in RED Phase

| Level | File | Count | Test IDs |
|---|---|---|---|
| E2E (Playwright) | `clientes-create.spec.ts` | 7 | E2E-C-11, E2E-C-12, E2E-C-13, E2E-C-14, E2E-C-15, E2E-C-16, E2E-C-17 |
| API (Playwright APIRequestContext) | `clientes-create.spec.ts` | 3 | API-C-01, API-C-02, API-C-03 |
| **Total** | | **10** | |

---

## data-testid Attributes Required

The following `data-testid` attributes must be present in frontend components for the E2E tests to pass:

| Attribute | Component | File | Used By |
|---|---|---|---|
| `btn-nuevo-cliente` | `ClienteListPanel` | `frontend/src/modules/crm/clientes/presentation/ClienteListPanel.tsx` | E2E-C-11, E2E-C-12, E2E-C-13, E2E-C-14, E2E-C-15, E2E-C-16, E2E-C-17 |
| `cliente-form-dialog` | `ClienteFormDialog` (on `DialogContent`) | `frontend/src/modules/crm/clientes/presentation/ClienteFormDialog.tsx` | E2E-C-11 |
| `input-nombre` | `ClienteFormDialog` | same file | E2E-C-11, E2E-C-12, E2E-C-13, E2E-C-14, E2E-C-15, E2E-C-16, E2E-C-17 |
| `input-nit` | `ClienteFormDialog` | same file | E2E-C-11, E2E-C-12, E2E-C-13, E2E-C-14, E2E-C-15, E2E-C-16, E2E-C-17 |
| `input-telefono` | `ClienteFormDialog` | same file | E2E-C-11, E2E-C-12, E2E-C-13, E2E-C-14, E2E-C-15, E2E-C-16, E2E-C-17 |
| `input-ciudad` | `ClienteFormDialog` | same file | E2E-C-11, E2E-C-12, E2E-C-13, E2E-C-14, E2E-C-15, E2E-C-16, E2E-C-17 |
| `btn-guardar` | `ClienteFormDialog` | same file | E2E-C-11, E2E-C-12, E2E-C-13, E2E-C-14, E2E-C-15, E2E-C-16, E2E-C-17 |
| `btn-cancelar` | `ClienteFormDialog` | same file | E2E-C-11 |
| `error-nit` | `ClienteFormDialog` (inline error `<p role="alert">`) | same file | E2E-C-14 (not.toBeVisible), E2E-C-15 (toBeVisible + text) |

---

## Mock / Intercept Strategy

| Test | Strategy | Detail |
|---|---|---|
| E2E-C-11 | `page.route('**/api/v1/clientes', route.continue())` BEFORE `goto()` | Network-first pass-through; no real data needed for this test |
| E2E-C-12 | `page.route('**/api/v1/clientes', ...)` BEFORE `goto()`; count POST calls | Pass-through + POST counter; real backend call; cleanup via `apiHelper.getClientes()` |
| E2E-C-13 | `page.route('**/api/v1/clientes', abort POST)` BEFORE `goto()` | POST intercepted and aborted; `postFired` flag set if POST fires — asserted `false` |
| E2E-C-14 | Same as E2E-C-13 | Abort POST; partial form fill; field-level error assertions |
| E2E-C-15 | `page.route('**/api/v1/clientes', route.continue())` BEFORE `goto()` | Real 409 from backend; existing client created via `apiHelper` BEFORE intercept setup; cleanup via `createdIds` |
| E2E-C-16 | `page.route('**/api/v1/clientes', route.continue())` BEFORE `goto()` | Real backend; toast assertion; cleanup via `apiHelper.getClientes()` |
| E2E-C-17 | `page.route('**/api/v1/clientes', route.continue())` BEFORE `goto()` | Real backend; dialog hidden assertion; cleanup via `apiHelper.getClientes()` |
| API-C-01 | No mocking — direct `request.post` to real backend | Creates and cleans up via `afterEach` using `createdIds` |
| API-C-02 | No mocking — two sequential `request.post` calls | First creates original; second sends duplicate NIT; only original ID in `createdIds` for cleanup |
| API-C-03 | No mocking — `request.post` with missing `nombre` field | No cleanup needed (400 means nothing was created) |

---

## POM Locators Used

The `e2e/pages/clientes.page.ts` POM covers all locators needed for Story 2.3 tests:

| Locator | Property | Selector | Used By |
|---|---|---|---|
| "Nuevo cliente" button | `btnNuevoCliente` | `getByRole('button', { name: /nuevo cliente/i })` | All E2E tests |
| Dialog | `form` | `getByRole('dialog')` | E2E-C-11 through E2E-C-17 |
| Nombre input | `inputNombre` | `getByLabel(/nombre/i)` | (via `page.getByTestId('input-nombre')` in tests) |
| NIT input | `inputNit` | `getByLabel(/nit/i)` | (via `page.getByTestId('input-nit')` in tests) |
| Teléfono input | `inputTelefono` | `getByLabel(/teléfono/i)` | (via `page.getByTestId('input-telefono')` in tests) |
| Ciudad input | `inputCiudad` | `getByLabel(/ciudad/i)` | (via `page.getByTestId('input-ciudad')` in tests) |
| Guardar button | `btnGuardar` | `getByRole('button', { name: /guardar/i })` | (via `page.getByTestId('btn-guardar')` in tests) |
| List panel | `listPanel` | `getByTestId('clientes-list-panel')` | E2E-C-17 |
| Client items | `clienteItems` | `getByTestId('cliente-list-item')` | E2E-C-12 |
| Error NIT | inline | `page.getByTestId('error-nit')` | E2E-C-14, E2E-C-15 |

---

## Implementation Checklist

### Test Group: E2E-C-11 — "Nuevo cliente" button opens dialog with 4 required fields

**Make this test pass by implementing:**

- [ ] Task 4 (Frontend): Add "Nuevo cliente" button to `ClienteListPanel.tsx` with `data-testid="btn-nuevo-cliente"`; manage open state with `useState<boolean>`
- [ ] Task 3 (Frontend): Create `ClienteFormDialog.tsx` with `data-testid="cliente-form-dialog"` on `DialogContent`
- [ ] Task 3 (Frontend): Add `data-testid="input-nombre|input-nit|input-telefono|input-ciudad"` to each input field
- [ ] Task 3 (Frontend): Add `data-testid="btn-guardar"` and `data-testid="btn-cancelar"` to footer buttons
- [ ] Task 1 (Frontend): Create `clienteSchema.ts` — Zod schema with 4 required string fields and Spanish error messages

---

### Test Group: E2E-C-12, E2E-C-16, E2E-C-17 — Successful creation flow

**Make these tests pass by implementing:**

- [ ] Task 2 (Frontend): Create `useCreateCliente.ts` mutation hook with `useMutation`
- [ ] Task 2 (Frontend): `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` then `toast.success('Cliente creado correctamente')`
- [ ] Task 2 (Frontend): Add `create(data: ClienteFormValues): Promise<Cliente>` to `IClienteRepository` interface
- [ ] Task 2 (Frontend): Implement `clienteApiRepository.create()` — POST `/api/v1/clientes`, return typed `Cliente`
- [ ] Task 3 (Frontend): `ClienteFormDialog` calls `onClose()` in mutation `onSuccess` callback — auto-closes dialog
- [ ] Task 5 (Backend): Verify `POST /api/v1/clientes` returns 201 with full `ClienteDto` body (id, nombre, nit, telefono, ciudad, createdAt)

---

### Test Group: E2E-C-13, E2E-C-14 — Frontend validation (Zod schema, no POST fired)

**Make these tests pass by implementing:**

- [ ] Task 1 (Frontend): `clienteSchema.ts` — all 4 fields required; Spanish messages: "El nombre es requerido", "El NIT/RUC es requerido", "El teléfono es requerido", "La ciudad es requerida"
- [ ] Task 3 (Frontend): Wire React Hook Form + `zodResolver(clienteSchema)` in `ClienteFormDialog`
- [ ] Task 3 (Frontend): Render `<p role="alert">` inline error under each field — must NOT render if field is valid
- [ ] Task 3 (Frontend): `data-testid="error-nit"` on NIT inline error element — absent or hidden when NIT is valid

---

### Test Group: E2E-C-15, API-C-02 — Backend 409 duplicate NIT handling

**Make these tests pass by implementing:**

- [ ] Task 5 (Backend): Create `ConflictException.cs` in `SiesaAgents.Domain/Exceptions/` if it does not exist
- [ ] Task 5 (Backend): In `CreateClienteCommandHandler` or `ExceptionHandlingMiddleware`: catch `DbUpdateException` → check `InnerException` for `Npgsql.PostgresException` with `SqlState == "23505"` → throw `ConflictException("El NIT/RUC ya está registrado")`
- [ ] Task 5 (Backend): Register `ConflictException` in `ExceptionHandlingMiddleware` → 409 Problem Details with `detail: "El NIT/RUC ya está registrado"`, no stack trace (NFR6)
- [ ] Task 3 (Frontend): In `ClienteFormDialog` `onError` callback: detect `axios.isAxiosError(err) && err.response?.status === 409` → `setError('nit', { message: 'El NIT/RUC ya está registrado' })`
- [ ] Task 3 (Frontend): Dialog must remain open on 409 (do NOT call `onClose()` in error handler)

---

### Test Group: API-C-01 — POST valid payload returns 201 + full body

**Make this test pass by implementing:**

- [ ] Task 5 (Backend): Verify `POST /api/v1/clientes` is registered in `ClienteEndpoints.cs` and returns `Results.Created(...)` with 201 status
- [ ] Task 5 (Backend): Verify `ClienteDto` includes `id` (Guid, serialized as string), `nombre`, `nit`, `telefono`, `ciudad`, `createdAt` (DateTimeOffset — ISO 8601 with timezone, NOT plain DateTime)
- [ ] Task 5 (Backend): Verify JSON serialization uses camelCase (`System.Text.Json` default with `JsonNamingPolicy.CamelCase`)
- [ ] Task 5 (Backend): Ensure `CreateClienteCommandHandler` is registered in DI (already done in Story 2.1)

---

### Test Group: API-C-03 — POST missing nombre returns 400

**Make this test pass by implementing:**

- [ ] Task 5 (Backend): Verify `CreateClienteCommandValidator` FluentValidation rule fires for empty `Nombre` → 400 Bad Request
- [ ] Task 5 (Backend): Verify `ExceptionHandlingMiddleware` or validation pipeline maps `ValidationException` → 400 Problem Details (no stack trace)

---

## Running Tests

```bash
# Run all Story 2.3 E2E create tests
npx playwright test e2e/tests/clientes/clientes-create.spec.ts

# Run only E2E tests (exclude API tests)
npx playwright test e2e/tests/clientes/clientes-create.spec.ts --grep "E2E-C-1"

# Run only API integration tests
npx playwright test e2e/tests/clientes/clientes-create.spec.ts --grep "API-C-0"

# Run all clientes tests together
npx playwright test e2e/tests/clientes/

# Run a specific test by ID
npx playwright test e2e/tests/clientes/clientes-create.spec.ts --grep "E2E-C-15"

# Run in headed mode for debugging
npx playwright test e2e/tests/clientes/clientes-create.spec.ts --headed

# Run with UI mode (interactive)
npx playwright test e2e/tests/clientes/ --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

All 10 tests written and in failing state. Expected failure reasons before implementation:

- E2E-C-11: `btnNuevoCliente` (`data-testid="btn-nuevo-cliente"`) not found in DOM → `TimeoutError`
- E2E-C-12: `btnNuevoCliente` not found → `TimeoutError`; even if button exists, `ClienteFormDialog` does not — dialog not visible
- E2E-C-13: `btnNuevoCliente` not found → `TimeoutError`; form submit fires POST (no frontend validation) → `postFired === true` assertion fails
- E2E-C-14: Same as E2E-C-13; field-level error assertions fail
- E2E-C-15: `btnNuevoCliente` not found → `TimeoutError`; even if form exists, 409 error branch not handled → `error-nit` text assertion fails
- E2E-C-16: `btnNuevoCliente` not found → `TimeoutError`; toast not shown
- E2E-C-17: `btnNuevoCliente` not found → `TimeoutError`; dialog does not auto-close
- API-C-01: `POST /api/v1/clientes` returns 201 (endpoint exists from Story 2.1) but `createdAt` might be plain DateTime without timezone → regex match fails
- API-C-02: `POST /api/v1/clientes` duplicate NIT returns 500 (unhandled DbUpdateException) instead of 409 → `expect(response.status()).toBe(409)` fails
- API-C-03: `POST /api/v1/clientes` without nombre returns 400 (FluentValidation) but Problem Details body may lack `status` field → `body.status === 400` assertion fails

### GREEN Phase (DEV Team — Priority Order)

1. Backend Task 5 — 409 conflict mapping (`ConflictException` + middleware) — unblocks API-C-02, E2E-C-15
2. Frontend Task 1 — `clienteSchema.ts` Zod schema — unblocks Tasks 2 and 3
3. Frontend Task 2 — `useCreateCliente.ts` hook — unblocks ClienteFormDialog submit logic
4. Frontend Task 3 — `ClienteFormDialog.tsx` with all states: empty validation, 409 error, success close — unblocks E2E-C-11, C-13, C-14, C-15, C-17
5. Frontend Task 4 — "Nuevo cliente" button in `ClienteListPanel` + dialog open state — unblocks all E2E tests
6. Backend validation — verify FluentValidation → 400 Problem Details — unblocks API-C-03
7. Backend DTO — verify `createdAt` is `DateTimeOffset` with timezone in JSON — unblocks API-C-01

### REFACTOR Phase (After All Tests Pass)

- Verify `queryClient.invalidateQueries({ queryKey: ['clientes'] })` is synchronous in `onSuccess` (not awaited separately)
- Confirm form resets after `onClose()` — `useForm.reset()` called to avoid stale values on reopen
- Confirm "Guardar" button shows disabled + "Guardando..." text while `isPending` is true
- Confirm all user-facing text is in Spanish (labels, placeholders, errors, toast)
- Confirm WCAG 2.1 AA: inputs linked to labels via `htmlFor`/`id`; `<p role="alert">` on error elements
- Confirm `data-testid` attributes match exactly what the tests expect (no typos)

---

## Coverage Matrix — Story 2.3

| AC | Requirement | Test(s) | Level | Status |
|---|---|---|---|---|
| AC1 | "Nuevo cliente" opens dialog with 4 required fields | E2E-C-11 | E2E | RED |
| AC2 | Submit creates client; appears in list immediately (FR27); toast shown; dialog closes | E2E-C-12, E2E-C-16, E2E-C-17, API-C-01 | E2E + API | RED |
| AC3 | Empty form: inline errors on all fields; no POST fired (FR8) | E2E-C-13, API-C-03 | E2E + API | RED |
| AC3 | Partial empty form: errors only on empty fields | E2E-C-14 | E2E | RED |
| AC4 | Duplicate NIT → 409 → "El NIT/RUC ya está registrado" in form (NFR6) | E2E-C-15, API-C-02 | E2E + API | RED |

**Coverage: 5/5 AC requirements addressed — 100%**

---

**Generated by BMad TEA Agent (testarch-atdd workflow)** — 2026-05-20
