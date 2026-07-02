# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-07-02
**Author:** SiesaTeam
**Primary Test Level:** E2E (Playwright) + API contract (Playwright request)

---

## Story Summary

Edit any field of an existing client via a modal form pre-filled with the current values. On success the changes surface immediately in the detail panel and the list item at its original position with a success toast; on duplicate NIT (against a different row) the form shows an inline error and stays open; on 404 / 5xx / network errors a red toast surfaces and values are preserved.

**As a** commercial team member
**I want** to edit any field of an existing client
**So that** the client information stays up to date

---

## Acceptance Criteria

1. AC1 — Detail panel header shows a secondary Button "Editar" (`data-testid="cliente-editar-button"`, `aria-label="Editar cliente"`), rendered only when `cliente` is loaded. Clicking it opens `ClienteFormModal` in edit mode.
2. AC2 — Modal title is "Editar cliente" (NOT "Nuevo cliente"). The 4 Inputs (`cliente-form-nombre|nit|telefono|ciudad`) are pre-filled from the cliente; auto-focus lands on Nombre; actions are Cancelar (outline) + Guardar (submit).
3. AC3 — Empty/whitespace-only fields → inline errors with exact Spanish copy; `aria-invalid="true"`; `aria-describedby="{field}-error"`; **no** PUT reaches the backend.
4. AC4 — Valid submit → `PUT /api/v1/clientes/{id}` with trimmed camelCase JSON → 200 → modal closes, `toast.success("Cliente actualizado correctamente")`, detail panel reflects the change immediately; list item updates in place (order preserved — not reinserted at head like Create).
5. AC5 — Backend 409 duplicate NIT → modal stays open, inline error `"El NIT/RUC ya está registrado"` under NIT input, **no** red toast, Problem Details `detail`/`title` never leaked (NFR6). Same NIT on the same row does NOT 409.
6. AC6 — Backend 404 (row deleted by another session) → red toast `"No se pudo guardar. Intenta de nuevo."`, modal stays open, values preserved.
7. AC7 — Backend 5xx / network error → red toast, modal stays open, values preserved.
8. AC8 — Cancelar / Esc / ✕ → modal closes without submit; original values preserved in detail; reopening restores the original values (no residue).
9. AC9 — Backend `PUT /api/v1/clientes/{id:guid}`: 200 OK with `ClienteDto` (createdAt immutable, updatedAt refreshed) on valid input; 400 Problem Details on empty/whitespace/MaxLength/non-Guid id; 404 Problem Details when id doesn't exist; 409 Problem Details (`title: "NIT/RUC duplicado"`, `field: "nit"`) on `uk_clientes_nit` violation against a different row.
10. AC10 — Project-level `pnpm build/lint/test` + `dotnet build/test` all pass with no regressions (validated at Task 16 — not part of ATDD RED-phase surface).

---

## Failing Tests Created (RED Phase)

### E2E Tests (26 tests)

**File:** `e2e/tests/clientes/story-2.4-edit-client.spec.ts`

- **AC1**
  - `[TC-Story-2.4-Editar-Button-Visible]` — Editar button visible with `aria-label="Editar cliente"` when cliente loaded
  - `[TC-Story-2.4-Editar-Button-Hidden-While-Loading]` — button NOT rendered during `isLoading`
  - `[TC-Story-2.4-Editar-Button-Hidden-On-404]` — button NOT rendered in `NotFoundClientePanel`
  - `[TC-Story-2.4-Editar-Opens-Modal]` — click opens modal with "Editar cliente" title
- **AC2**
  - `[TC-Story-2.4-Prefill-Fields]` — all 4 inputs pre-filled from the cliente
  - `[TC-Story-2.4-Prefill-Title]` — modal title `"Editar cliente"` (NOT `"Nuevo cliente"`)
  - `[TC-Story-2.4-Prefill-Focus]` — auto-focus on Nombre input
  - `[TC-Story-2.4-Prefill-Actions]` — Cancelar + Guardar buttons rendered
- **AC3**
  - `[TC-Story-2.4-Validation-EmptyNombre]` — cleared Nombre → inline error + 0 PUTs + `aria-invalid`
  - `[TC-Story-2.4-Validation-WhitespaceNit]` — whitespace NIT → inline error + 0 PUTs
  - `[TC-Story-2.4-Validation-ARIA]` — `aria-describedby="nombre-error"` wired on Nombre input
- **AC4**
  - `[TC-Story-2.4-Happy-Put-Body]` — PUT body is trimmed camelCase, targets correct id, modal closes on 200
  - `[TC-Story-2.4-Happy-Toast]` — success toast `"Cliente actualizado correctamente"` visible (create copy absent)
  - `[TC-Story-2.4-Happy-Detail]` — detail panel reflects the new value without reload
  - `[TC-Story-2.4-Happy-List-Order-Preserved]` — updated list item stays at index 1 (no reinsert at head)
- **AC5**
  - `[TC-Story-2.4-409-Inline]` — inline `"El NIT/RUC ya está registrado"` under NIT input + `aria-invalid`
  - `[TC-Story-2.4-409-Modal-Stays]` — modal stays open with edited values preserved
  - `[TC-Story-2.4-409-No-Toast]` — no red toast on 409
  - `[TC-Story-2.4-409-NoLeak]` — Problem Details `detail`/`title` + EF Core / SqlState never leak (NFR6)
- **AC6**
  - `[TC-Story-2.4-404-Toast]` — red toast `"No se pudo guardar. Intenta de nuevo."` on 404
  - `[TC-Story-2.4-404-Modal-Stays]` — modal stays open with edited values
  - `[TC-Story-2.4-404-NoLeak]` — backend detail / stack traces never leak
- **AC7**
  - `[TC-Story-2.4-5xx-Toast]` — red toast on 500
  - `[TC-Story-2.4-5xx-Modal-Stays]` — modal stays open with values intact
- **AC8**
  - `[TC-Story-2.4-Cancel-Closes]` — Cancelar closes the modal without PUT (no toast)
  - `[TC-Story-2.4-Cancel-Esc]` — Escape closes the modal without PUT
  - `[TC-Story-2.4-Cancel-Detail-Unchanged]` — detail panel keeps the ORIGINAL nombre after cancel
  - `[TC-Story-2.4-Cancel-Reopen-Restores]` — reopening shows the ORIGINAL cliente values (no residue)

All E2E tests use **network-first pattern** (`page.route()` before `page.goto()`), `data-testid` selectors exclusively, and explicit `toBeVisible`/`toHaveText`/`toHaveCount` waits — no `page.waitForTimeout`.

### API Contract Tests (13 tests)

**File:** `e2e/tests/api/story-2.4-edit-client.api.spec.ts`

- **AC9 happy path (200)**
  - `[TC-Story-2.4-API-200]` — valid payload returns 200 with the updated ClienteDto (camelCase, id echoed)
  - `[TC-Story-2.4-API-200-Preserves-CreatedAt]` — `createdAt` is immutable; `updatedAt` refreshes
  - `[TC-Story-2.4-API-200-RoundTrip]` — GET after PUT returns the updated DTO
  - `[TC-Story-2.4-API-200-Trim]` — server trims all 4 string fields
  - `[TC-Story-2.4-API-200-SameNit]` — reusing the same NIT on the same row does NOT 409 (AC5 corollary)
- **AC9 validation (400)**
  - `[TC-Story-2.4-API-400-EmptyNombre]` — empty Nombre → 400 with `errors.nombre`
  - `[TC-Story-2.4-API-400-WhitespaceAll]` — 4 whitespace fields → 400 with 4 error keys
  - `[TC-Story-2.4-API-400-NitMaxLength]` — NIT > 50 chars → 400 with `errors.nit`
  - `[TC-Story-2.4-API-400-InvalidGuid]` — non-GUID id segment → 400 (route constraint `{id:guid}`)
  - `[TC-Story-2.4-API-400-NoStackTrace]` — 400 body has no stack-trace signals (NFR6)
- **AC9 not-found (404)**
  - `[TC-Story-2.4-API-404]` — unknown GUID → 404 with `title: "Cliente no encontrado"`
  - `[TC-Story-2.4-API-404-NoLeak]` — 404 body has no low-level signals (NFR6)
- **AC9 / AC5 duplicate (409)**
  - `[TC-Story-2.4-API-409-Duplicate]` — updating A with B's NIT → 409 with expected copy + `field: "nit"`
  - `[TC-Story-2.4-API-409-NoLeak]` — 409 body has no `23505`, `uk_clientes_nit`, EF Core, or Npgsql signals
  - `[TC-Story-2.4-API-409-NoPersist]` — failed duplicate PUT does NOT overwrite cliente A (rollback verified)

### Component Tests (0 at this level)

Component-level testing for `ClienteFormModal` edit mode is defined in the story as Vitest tests (Task 10 `ClienteFormModal.edit.test.tsx` + Task 11 `ClienteDetailView.test.tsx`) under `frontend/src/modules/crm/clientes/presentation/` — outside the Playwright ATDD suite. The E2E tests above cover the modal's UX end-to-end; the API tests cover the backend contract.

---

## Data Factories

Test data is created inline in each spec file to keep test intent local and traceable:

- **`seedClientes: ClienteDto[]`** — 3 seed clientes (Acme Corp, Beta Distribuciones, Gamma Suministros) with distinct NITs used to trigger the 409 duplicate flow and to prove list order is preserved.
- **`refreshedUpdatedAt`** — deterministic timestamp returned by the mocked PUT so tests can assert `updatedAt` refresh.
- **`buildValidCreatePayload(overrides)`** (API spec) — seed factory used to POST a fresh cliente before each PUT test.
- **`buildValidUpdatePayload(overrides)`** (API spec) — factory for valid PUT bodies with a randomised NIT (`uniqueNit(seed)`).
- **`seedCliente(request)`** — helper that POSTs a fresh cliente and returns `{ id, body }` for reuse in the `finally` cleanup.

---

## Fixtures / Route Mocks

Local route interceptors in `story-2.4-edit-client.spec.ts`:

- `mockClientesListAndUpdate(page, putLog)` — mocks GET (list + byId, mutable) and PUT (200 with echo of trimmed payload); records every PUT for assertions and preserves list order.
- `mockClientesUpdate409(page, putLog)` — mocks PUT → 409 with full Problem Details (verbose `detail`) so NFR6 assertions can prove nothing leaks.
- `mockClientesUpdate404(page, putLog)` — mocks PUT → 404 for the cross-session delete race.
- `mockClientesUpdate500(page, putLog)` — mocks PUT → 500 for the red-toast path.
- `mockDetailSlow(page, delayMs)` — delayed GET so tests can assert the Editar button is hidden while `isLoading`.
- `mockDetail404(page)` — GET returns 404 so tests can assert the Editar button is hidden in the NotFoundClientePanel branch.

API spec uses the real backend at `API_BASE_URL` — each test seeds and deletes its own cliente(s) in a `try/finally` block. NITs are randomised per test to avoid unique-index collisions.

---

## Mock Requirements for DEV Team

**Frontend MSW handler** (Task 13 of the story):

- `PUT /api/v1/clientes/:id`
  - 200 body: full updated `Cliente` DTO with `createdAt` preserved and `updatedAt` refreshed
  - 404 body: Problem Details `{ title: "Cliente no encontrado", status: 404, detail: "No existe ningún cliente con id {id}.", instance: "/api/v1/clientes/{id}" }`
  - 409 body: Problem Details `{ title: "NIT/RUC duplicado", status: 409, detail: "Ya existe un cliente con el NIT/RUC indicado.", field: "nit", extensions: { field: "nit" } }`
  - 500 body: Problem Details `{ title: "Server error", status: 500 }`

**Backend endpoint** (Tasks 1-7):

- `PUT /api/v1/clientes/{id:guid}` — 200 / 400 / 404 / 409 responses per AC9.
- Validation: `UpdateClienteRequestValidator` (FluentValidation) with identical rules to Create.
- Duplicate NIT (23505 + `uk_clientes_nit`) → `DuplicateNitException` → 409 `Results.Problem` with `extensions: { field: "nit" }`.
- Missing row → `ClienteNotFoundException` → 404 `Results.Problem`.

---

## Required `data-testid` Attributes

### `ClienteDetailView` (header)

- `cliente-editar-button` — secondary "Editar" button (`type="outline"`, `aria-label="Editar cliente"`)
- `cliente-detail-panel` — root panel (already exists from Story 2.2)

### `ClienteFormModal` (reused from Story 2.3 — edit-mode assertions rely on the same testids)

- `cliente-form-modal` — `AlertDialog` root
- `cliente-form-nombre` — Nombre `Input`
- `cliente-form-nit` — NIT/RUC `Input`
- `cliente-form-telefono` — Teléfono `Input`
- `cliente-form-ciudad` — Ciudad `Input`
- `cliente-form-nombre-error` — inline error under Nombre
- `cliente-form-nit-error` — inline error under NIT (also used for the 409 duplicate message)
- `cliente-form-telefono-error` — inline error under Teléfono
- `cliente-form-ciudad-error` — inline error under Ciudad
- `cliente-form-cancel` — Cancelar button (outline)
- `cliente-form-submit` — Guardar submit button

### Required ARIA wiring

- Each error element id = `{field}-error` (e.g. `nombre-error`); the matching `Input` carries `aria-describedby="{field}-error"` and `aria-invalid="true"` in error state.
- Modal title text `"Editar cliente"` visible in DOM (dynamic — `"Nuevo cliente"` in create mode).
- Auto-focus on `cliente-form-nombre` when the modal opens in edit mode.

---

## Implementation Checklist (mapped to story Tasks)

For each failing test, run the corresponding tasks in `_bmad-output/implementation-artifacts/2-4-edit-client.md`:

### E2E AC1 tests → Task 11

- [ ] Task 11: add "Editar" secondary Button to `ClienteDetailView` header with `useState(isEditOpen)`; render the modal at fragment level; hide the button on `isLoading`, `isError`, and `!cliente`.

### E2E AC2 tests → Task 10

- [ ] Task 10: extend `ClienteFormModalProps` to a discriminated union (`create | edit`); wire `defaultValues={initialValues}` + `reset(initialValues)` on open; dynamic title (`"Editar cliente"` vs `"Nuevo cliente"`); `setFocus('nombre')`.

### E2E AC3 tests → Task 10 (reuses the Story 2.3 `clienteFormSchema`)

- [ ] Task 10: submit handler blocks PUT when validation fails; inline error `data-testid`s + `aria-invalid` + `aria-describedby` reused from Story 2.3 without duplication.

### E2E AC4 tests → Tasks 8 + 9 + 10 + 12 + 13

- [ ] Task 8: extend `IClienteRepository` + `clienteApiRepository.update`.
- [ ] Task 9: `useUpdateCliente(clienteId)` with `setQueryData(['clientes'], map-in-place)` + `setQueryData(['clientes', id], updated)` + `invalidateQueries` for both keys + `toast.success("Cliente actualizado correctamente")`.
- [ ] Task 10: modal `onSubmit` calls `updateMutation.mutateAsync(values)`; on success `reset(updated)` + `onClose()`.
- [ ] Task 12: export `useUpdateCliente` from the barrel.
- [ ] Task 13: MSW PUT handler returning 200 with `updatedAt` refreshed and `createdAt` immutable.

### E2E AC5 tests → Tasks 9 + 10

- [ ] Task 9: `onError` short-circuits when `error.response?.status === 409` (no toast).
- [ ] Task 10: catch 409 in the modal `onSubmit` and call `setError('nit', { message: 'El NIT/RUC ya está registrado' })`.

### E2E AC6 tests → Task 9

- [ ] Task 9: on `error.response?.status === 404` fire the red toast AND `invalidateQueries(['clientes'])`; modal stays open (caller decides).

### E2E AC7 tests → Task 9

- [ ] Task 9: default `onError` fires `toast.error("No se pudo guardar. Intenta de nuevo.")` on 5xx / network / non-2xx.

### E2E AC8 tests → Task 10

- [ ] Task 10: `onClose` triggers `reset(initialValues)` (no residue on reopen); Cancelar/Esc/✕ share the same handler via `siesa-ui-kit` `AlertDialog`.

### API tests → Tasks 1-7

- [ ] Task 1: `ClienteEntity.Update(...)` + `ClienteNotFoundException` + `IClienteRepository.UpdateAsync`.
- [ ] Task 2: `ClienteRepository.UpdateAsync` (no `try/catch` — bubbles `DbUpdateException`).
- [ ] Task 3: `UpdateClienteRequest` + `UpdateClienteRequestValidator` (FluentValidation, identical rules to Create).
- [ ] Task 4: `UpdateClienteCommand` + `UpdateClienteCommandHandler` (null → `ClienteNotFoundException`; 23505 + `uk_clientes_nit` → `DuplicateNitException`).
- [ ] Task 6: `MapPut("/{id:guid}", …)` returning `Results.Ok` / `Results.ValidationProblem` / `Results.Problem` (404 for not-found, 409 with `extensions: { field: "nit" }` for duplicate); DI wiring for the handler + validator.
- [ ] Task 7: .NET integration tests covering 200/400/404/409/same-nit-no-conflict/trim/createdAt-preserved.

---

## Running Tests

```bash
# Run only the Story 2.4 E2E ATDD tests
pnpm exec playwright test e2e/tests/clientes/story-2.4-edit-client.spec.ts

# Run only the Story 2.4 API contract tests
pnpm exec playwright test e2e/tests/api/story-2.4-edit-client.api.spec.ts

# Debug a single test
pnpm exec playwright test e2e/tests/clientes/story-2.4-edit-client.spec.ts \
  --grep "TC-Story-2.4-Happy-Put-Body" --debug

# Run in headed mode to observe the browser
pnpm exec playwright test e2e/tests/clientes/story-2.4-edit-client.spec.ts --headed

# Full Playwright suite (all epics, all stories)
pnpm exec playwright test
```

Note: the API spec targets the real backend at `http://localhost:5000`. It is started automatically by the Playwright `webServer` config in `playwright.config.ts` (both frontend on 5173 and backend on 5000).

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 39 new tests (26 E2E + 13 API) are written and target selectors / endpoints that do not exist yet.
- Expected initial failure modes:
  - E2E → `expect().toBeVisible()` timeouts on missing `data-testid`s (`cliente-editar-button`) or missing modal title text (`"Editar cliente"`); `toHaveValue()` fails because the modal is not pre-filled; PUT never fires so `putLog` stays empty.
  - API → `PUT /api/v1/clientes/{id}` responds with 404 (endpoint not mapped) or 405 (route exists but PUT not registered).

### GREEN Phase (DEV)

1. Implement backend Tasks 1-7 → API contract tests turn green.
2. Implement frontend Tasks 8-13 in order → E2E AC1..AC8 tests turn green as each capability lands.
3. Tasks 14 + 15 add Vitest integration tests — orthogonal to this ATDD suite.

### REFACTOR Phase

- Once every ATDD test is green, consider extracting shared route handlers (`mockClientesListAndUpdate` etc.) into `e2e/helpers/` if Story 2.5 (Delete) needs similar mocks.

---

## Notes

- **Playwright is present in this project** (`playwright.config.ts`, `e2e/` dir). Vitest-level tests referenced by story Tasks 10-11 (`ClienteFormModal.edit.test.tsx`, `ClienteDetailView.test.tsx`) and Tasks 14-15 (route integration tests) are DEV responsibility (GREEN phase), not part of this ATDD delivery.
- **Same-NIT-no-409 corollary** (AC5): the API test `[TC-Story-2.4-API-200-SameNit]` is critical — the unique index cannot be violated by the row that already owns the value.
- **Order-preserved list update** (AC4): the E2E test `[TC-Story-2.4-Happy-List-Order-Preserved]` differentiates Edit (`setQueryData(map-in-place)`) from Create (which prepends to the head). This is the primary regression risk if a DEV copies the Story 2.3 pattern verbatim.
- **NFR6 (no leak) is asserted in five complementary places**: E2E DOM snapshots after 409, 404, and 500; API response-text checks after 400, 404, and 409.
- **AC10 (no regressions)** is a project-level concern verified in Task 16 (`pnpm build/lint/test`, `dotnet build/test`). It's not directly encoded as an ATDD test because the RED-phase suite is what proves the change; a green Playwright run alongside the existing Story 2.1-2.3 suites doubles as the regression signal.
- All UI copy is Spanish; all code identifiers are English — the assertions use the exact Spanish strings mandated in the story.

---

## Knowledge Base References Applied

- **network-first.md** — every route intercept is registered BEFORE `page.goto()` so the SPA's initial GET hits the mock; PUT log is populated by the mock handler.
- **selector-resilience.md** — `data-testid` used exclusively; no CSS / class / structural selectors.
- **test-quality.md** — Given-When-Then structure; one behavioural assertion per test (with tightly related follow-up assertions on the same behaviour); explicit `toBeVisible` / `toHaveText` / `toHaveCount` waits.
- **timing-debugging.md** — no `page.waitForTimeout`; the only `setTimeout` lives inside `mockDetailSlow` (route-side delay to simulate a slow backend for the loading-branch test).
- **data-factories.md** — helper functions build deterministic seed clientes (`CLIENTE_A/B/C`) + parametrised NITs in the API spec.
- **test-healing-patterns.md** — the mock `putLog.requests.length === 0` assertion catches accidental PUTs during validation-error scenarios (mitigates R-011 exact-copy drift).

---

**Generated by BMad TEA Agent** — 2026-07-02
