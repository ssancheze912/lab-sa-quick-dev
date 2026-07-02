# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-07-02
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright) + API contract (Playwright request)

---

## Story Summary

Register a new client via a modal form with 4 required fields (Nombre, NIT/RUC, Teléfono, Ciudad). On success the client is added to the list immediately with a success toast; on duplicate NIT the form shows an inline error; on network/server errors a red toast surfaces and the modal stays open with values preserved.

**As a** commercial team member
**I want** to register a new client by filling in a form
**So that** the client is available in the system immediately for the whole team

---

## Acceptance Criteria

1. AC1 — Header shows a primary "Nuevo cliente" button (`data-testid="cliente-nuevo-button"`) that opens `ClienteFormModal` in create mode with autofocus on Nombre. Visible even when the list is empty; the EmptyState CTA opens the same modal.
2. AC2 — The modal is an `AlertDialog` (`data-testid="cliente-form-modal"`) containing four required `Input`s (`cliente-form-nombre|nit|telefono|ciudad`), `aria-required="true"`, plus `Cancelar`/`Guardar` action buttons and the "* Campos obligatorios" legend.
3. AC3 — Empty/whitespace-only fields → inline errors (`{testid}-error`) with exact Spanish copy; `aria-invalid="true"`; `aria-describedby="{field}-error"`; **no** POST reaches the backend.
4. AC4 — Valid submit → `POST /api/v1/clientes` with trimmed camelCase JSON → 201 → modal closes, `toast.success("Cliente creado correctamente")`, new cliente prepended to the list; `['clientes']` cache invalidated.
5. AC5 — Backend 409 duplicate NIT → modal stays open, inline error `"El NIT/RUC ya está registrado"` under NIT input, **no** red toast, Problem Details `detail`/`title` never leaked (NFR6).
6. AC6 — Backend 5xx / network error → red toast `"No se pudo guardar. Intenta de nuevo."`, modal stays open, values preserved.
7. AC7 — Backend `POST /api/v1/clientes`: 201 Created + Location + camelCase DTO on valid input; 400 Problem Details on empty/whitespace/MaxLength violations; 409 Problem Details (`title: "NIT/RUC duplicado"`, `field: "nit"`) on `uk_clientes_nit` violation.

---

## Failing Tests Created (RED Phase)

### E2E Tests (17 tests)

**File:** `e2e/tests/clientes/story-2.3-create-client.spec.ts`

- **AC1**
  - `[TC-Story-2.3-Header-Button]` — header button visible with `aria-label="Nuevo cliente"`
  - `[TC-Story-2.3-Header-Button-Empty-List]` — button visible when list is empty
  - `[TC-Story-2.3-Header-Opens-Modal]` — click opens modal with empty fields + focus on Nombre
  - `[TC-Story-2.3-Empty-CTA-Opens-Modal]` — EmptyState CTA opens the same modal
- **AC2**
  - `[TC-Story-2.3-Modal-Fields]` — 4 required Inputs with `aria-required="true"`
  - `[TC-Story-2.3-Modal-Actions]` — Cancelar + Guardar buttons visible
  - `[TC-Story-2.3-Modal-Legend]` — `"* Campos obligatorios"` present
  - `[TC-Story-2.3-Modal-Cancel-Closes]` — Cancelar closes modal without POST
- **AC3**
  - `[TC-Story-2.3-Validation-Empty]` — empty form submit → 4 inline errors + 0 POSTs
  - `[TC-Story-2.3-Validation-Whitespace]` — whitespace Nombre → inline error on blur + `aria-invalid`
  - `[TC-Story-2.3-Validation-ARIA]` — `aria-describedby="nit-error"` wired on NIT field
- **AC4**
  - `[TC-Story-2.3-Happy]` — POST body is trimmed camelCase, modal closes on 201
  - `[TC-Story-2.3-Happy-Toast]` — `"Cliente creado correctamente"` visible in DOM
  - `[TC-Story-2.3-Happy-List]` — new cliente appears at top of list (FR27)
- **AC5**
  - `[TC-Story-2.3-409-Inline]` — inline `"El NIT/RUC ya está registrado"` under NIT input
  - `[TC-Story-2.3-409-Modal-Stays]` — modal stays open with fields preserved
  - `[TC-Story-2.3-409-No-Toast]` — no red toast on 409
  - `[TC-Story-2.3-409-NoLeak]` — Problem Details `detail`/`title` never leak (NFR6)
- **AC6**
  - `[TC-Story-2.3-5xx-Toast]` — red toast `"No se pudo guardar. Intenta de nuevo."`
  - `[TC-Story-2.3-5xx-Modal-Stays]` — modal stays open with values intact

All E2E tests use **network-first pattern** (`page.route()` before `page.goto()`) and `data-testid` selectors exclusively.

### API Contract Tests (10 tests)

**File:** `e2e/tests/api/story-2.3-create-client.api.spec.ts`

- **AC7 happy path**
  - `[TC-Story-2.3-API-201]` — 201 + Location header + camelCase ClienteDto
  - `[TC-Story-2.3-API-201-RoundTrip]` — GET Location returns same DTO
  - `[TC-Story-2.3-API-201-Trim]` — server trims all 4 string fields
- **AC7 validation (400)**
  - `[TC-Story-2.3-API-400-EmptyNombre]` — empty Nombre → 400 with `errors.nombre`
  - `[TC-Story-2.3-API-400-WhitespaceAll]` — 4 whitespace fields → 400 with 4 error keys
  - `[TC-Story-2.3-API-400-NitMaxLength]` — NIT > 50 chars → 400 with `errors.nit`
  - `[TC-Story-2.3-API-400-NoStackTrace]` — 400 body no stack-trace signals (NFR6)
- **AC7 duplicate (409)**
  - `[TC-Story-2.3-API-409-Duplicate]` — second POST with same NIT → 409 with exact copy + `field="nit"`
  - `[TC-Story-2.3-API-409-NoLeak]` — 409 body has no EF Core / Npgsql / `23505` / `uk_clientes_nit` signals
  - `[TC-Story-2.3-API-409-NoDuplicateRow]` — failed duplicate does not persist a second row

### Component Tests (0 tests at this level)

Component-level testing for `ClienteFormModal` is defined in the story as Vitest tests (Task 12) and lives under `frontend/src/modules/crm/clientes/presentation/ClienteFormModal.test.tsx` — outside the Playwright ATDD suite. The E2E tests above already cover the modal's UX and the API contract tests cover backend behaviour.

---

## Data Factories

Test data is created inline in each spec file to keep test intent local and traceable:

- **`seedClientes: ClienteDto[]`** — 2 seed clientes (Acme Corp, Beta Distribuciones) with known NITs used to trigger the 409 duplicate flow.
- **`NEW_CLIENTE`** — deterministic new-cliente DTO returned by the mocked POST endpoint (id, nombre, nit, telefono, ciudad).
- **`buildValidPayload(overrides)`** (API spec) — factory for valid POST bodies with a randomised NIT (`uniqueNit(seed)`) to avoid parallel-run collisions on `uk_clientes_nit`.

---

## Fixtures / Route Mocks

Local route interceptors in `story-2.3-create-client.spec.ts`:

- `mockClientesList(page, body)` — mocks `GET /api/v1/clientes` with a static list.
- `mockClientesListAndCreate(page, postLog)` — mocks both GET (mutable list) and POST (201 with echo of trimmed payload); records every POST for assertions.
- `mockClientesCreate409(page, postLog)` — mocks POST → 409 Conflict with full Problem Details (including verbose `detail`) so NFR6 assertions can prove the copy never leaks.
- `mockClientesCreate500(page, postLog)` — mocks POST → 500 Problem Details so red-toast path is exercised.

API spec uses the real backend at `API_BASE_URL` — each test seeds and deletes its own cliente in a `try/finally` block. Randomised NITs per test avoid unique-index collisions.

---

## Mock Requirements for DEV Team

**Frontend MSW handler** (Task 14 of the story):

- `POST /api/v1/clientes`
  - 201 body: `Cliente` DTO with `id`, `createdAt`, `updatedAt`; response header `Location: /api/v1/clientes/{id}`
  - 409 body: Problem Details `{ title: "NIT/RUC duplicado", status: 409, detail: "Ya existe un cliente con el NIT/RUC indicado.", field: "nit", extensions: { field: "nit" } }`
  - 500 body: Problem Details `{ title: "Server error", status: 500 }`

**Toast Provider** (Task 8):

- `ToastProvider` from `siesa-ui-kit` must wrap `RouterProvider` in `frontend/src/main.tsx` so the mutation hook can render success/error toasts globally.

---

## Required `data-testid` Attributes

### `ClienteListView` (header)

- `cliente-nuevo-button` — primary "Nuevo cliente" button in the panel header

### `ClienteFormModal`

- `cliente-form-modal` — `AlertDialog` root
- `cliente-form-nombre` — Nombre `Input`
- `cliente-form-nit` — NIT/RUC `Input`
- `cliente-form-telefono` — Teléfono `Input`
- `cliente-form-ciudad` — Ciudad `Input`
- `cliente-form-nombre-error` — inline error under Nombre
- `cliente-form-nit-error` — inline error under NIT (also used for 409 duplicate message)
- `cliente-form-telefono-error` — inline error under Teléfono
- `cliente-form-ciudad-error` — inline error under Ciudad
- `cliente-form-cancel` — Cancelar button (outline)
- `cliente-form-submit` — Guardar submit button

### Required ARIA wiring

- Each error element id = `{field}-error` (e.g. `nit-error`); the matching `Input` carries `aria-describedby="{field}-error"` and `aria-invalid="true"` when in error state.
- Auto-focus on `cliente-form-nombre` when `isOpen` toggles true.

---

## Implementation Checklist (mapped to story Tasks)

For each failing test, run the corresponding tasks in `_bmad-output/implementation-artifacts/2-3-create-client.md`:

### E2E AC1 tests → Tasks 12 + 13

- [ ] Task 12: build `ClienteFormModal` with all `data-testid` attributes and `aria-*` wiring.
- [ ] Task 13: add "Nuevo cliente" button to `ClienteListView` header; wire `EmptyState` CTA to `setIsFormOpen(true)`; render the modal outside the `<aside>`.

### E2E AC2 tests → Task 12

- [ ] Configure `AlertDialog` (`size="max-w-md"`, `hideCancel`, `showCloseButton`, custom `actions`) and stack the four `Input`s in the required order. Render the "* Campos obligatorios" legend.

### E2E AC3 tests → Tasks 9 + 12

- [ ] Task 9: `clienteFormSchema` with `.trim().min(1, "…")` and matching Spanish messages.
- [ ] Task 12: RHF integration with `zodResolver`, `mode: "onBlur"`, inline error rendering with `aria-invalid`/`aria-describedby`.

### E2E AC4 tests → Tasks 8 + 10 + 11 + 12 + 13 + 14

- [ ] Task 8: mount `ToastProvider`.
- [ ] Task 10: `clienteApiRepository.create(payload)`.
- [ ] Task 11: `useCreateCliente` with `setQueryData(['clientes'], …)` + `invalidateQueries(['clientes'])` + `toast.success`.
- [ ] Task 12: modal submit → `mutateAsync`; on success `reset()` + `onClose()`.
- [ ] Task 14: MSW POST handler returning 201.

### E2E AC5 tests → Tasks 11 + 12

- [ ] Task 11: `onError` short-circuits when `error.response?.status === 409` (no toast).
- [ ] Task 12: catch 409 in `onSubmit`, call `setError('nit', { message: 'El NIT/RUC ya está registrado' })`, keep modal open.

### E2E AC6 tests → Task 11

- [ ] Task 11: default `onError` fires `toast.error("No se pudo guardar. Intenta de nuevo.")`.

### API tests → Tasks 1-7

- [ ] Task 1: `DuplicateNitException` + `IClienteRepository.AddAsync`.
- [ ] Task 2: `ClienteRepository.AddAsync` (no `try/catch`).
- [ ] Task 3: `CreateClienteRequest` + `CreateClienteRequestValidator` (FluentValidation).
- [ ] Task 4: `CreateClienteCommand` + handler translating 23505 → `DuplicateNitException`.
- [ ] Task 6: `MapPost("/", …)` returning `Results.Created` / `Results.ValidationProblem` / `Results.Problem` (409 with `field: "nit"`).
- [ ] Task 7: `.NET` integration tests confirming 201/400/409 shape.

---

## Running Tests

```bash
# Run only the Story 2.3 E2E ATDD tests
pnpm exec playwright test e2e/tests/clientes/story-2.3-create-client.spec.ts

# Run only the Story 2.3 API contract tests
pnpm exec playwright test e2e/tests/api/story-2.3-create-client.api.spec.ts

# Debug a single test
pnpm exec playwright test e2e/tests/clientes/story-2.3-create-client.spec.ts \
  --grep "TC-Story-2.3-Happy" --debug

# Run in headed mode to observe the browser
pnpm exec playwright test e2e/tests/clientes/story-2.3-create-client.spec.ts --headed

# Full Playwright suite (all epics, all stories)
pnpm exec playwright test
```

Note: the API spec targets the real backend at `http://localhost:5000`. It is started automatically by the Playwright `webServer` config in `playwright.config.ts` (both frontend on 5173 and backend on 5000).

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 27 new tests (17 E2E + 10 API) are written and target selectors / endpoints that do not exist yet.
- Expected initial failure modes:
  - E2E → `expect().toBeVisible()` timeouts on missing `data-testid`s (e.g. `cliente-nuevo-button`, `cliente-form-modal`, `cliente-form-nit-error`).
  - API → `POST /api/v1/clientes` responds with 404 (endpoint not mapped) or 405.

### GREEN Phase (DEV)

1. Implement backend Tasks 1-7 → API contract tests turn green.
2. Implement frontend Tasks 8-14 in order → E2E AC1..AC6 tests turn green as each capability lands.
3. Task 15 adds a Vitest integration test — orthogonal to this ATDD suite.

### REFACTOR Phase

- Once every ATDD test is green, extract shared helpers if the same route handler is copy-pasted across specs (e.g. move `mockClientesListAndCreate` into `e2e/helpers/` when Story 2.4/2.5 need it).

---

## Notes

- **Playwright is present in this project** (`playwright.config.ts`, `e2e/` dir). Vitest-level tests referenced by story Tasks 12, 15 are DEV responsibility (Task 5 GREEN phase for the story workflow), not part of this ATDD delivery.
- The AC7 API tests intentionally poke the real backend (not MSW) so we validate the actual .NET contract, not the mock. Each test cleans up after itself via a `finally` block.
- NFR6 (no leak) is asserted in three complementary places: E2E DOM snapshot after 409, E2E DOM snapshot after 500, and API response-text checks after 400/409.
- All UI copy is Spanish; all code identifiers are English — the assertions use the exact Spanish strings mandated in the story.

---

**Generated by BMad TEA Agent** — 2026-07-02
