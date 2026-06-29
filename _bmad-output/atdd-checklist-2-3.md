# ATDD Checklist - Epic 2, Story 2.3: Create Client

**Date:** 2026-06-29
**Author:** SiesaTeam (TEA Agent)
**Primary Test Level:** Component (Vitest + RTL + MSW) — secondary: E2E (Playwright) + API integration (Playwright APIRequestContext) + Hook (Vitest) + Repository (Vitest)

---

## Story Summary

As a commercial team member, I want to register a new client by filling in a form, so that the client is available in the system immediately for the whole team.

**Source:** `_bmad-output/implementation-artifacts/2-3-create-client.md`

---

## Acceptance Criteria

1. **AC #1** — `POST /api/v1/clientes` returns `201 Created` + `ClienteDto` (camelCase, `nitRuc`, ISO 8601 timestamps, `createdAt == updatedAt`) + `Location: /api/v1/clientes/{newId}`. Row persists and is visible via `GET /api/v1/clientes/{id}` and `GET /api/v1/clientes`.
2. **AC #2** — Empty / whitespace-only / oversized payload → `400` + `application/problem+json` (RFC 7807), `errors` keyed by camelCase field names. No internal-detail leakage (NFR6).
3. **AC #3** — Duplicate `nitRuc` → `409` + `application/problem+json` with `title="NIT/RUC duplicado"`, `detail="El NIT/RUC ya está registrado"`, `type="https://tools.ietf.org/html/rfc7231#section-6.5.8"`, `instance="/api/v1/clientes"`. No SQL / EF leakage (NFR6).
4. **AC #4** — Clicking the visible "Nuevo cliente" button (left panel sticky header) opens an `AlertDialog` with title `"Nuevo cliente"` and 4 `aria-required` inputs (Nombre, NIT/RUC, Teléfono, Ciudad) + Guardar/Cancelar buttons.
5. **AC #5** — Empty submit blocks (zero POST calls), 4 inline Spanish errors, first failing field receives focus, dialog stays open.
6. **AC #6** — Happy path: dialog closes; `['clientes']` cache prepended (NOT refetched); new `ClientListItem` visible; success toast `"Cliente creado correctamente"`.
7. **AC #7** — 409 path: dialog stays open; inline NIT/RUC error `"El NIT/RUC ya está registrado"`; NO toast; DOM contains no SQL / EF / 409 / about:blank.
8. **AC #8** — 500 / generic error: dialog stays open; error toast `"No pudimos crear el cliente. Inténtalo de nuevo."`; cache unchanged; form values preserved.
9. **AC #9** — Cancel button + Escape close dialog without firing POST; form state resets on close.
10. **AC #10** — Submitting state disables Guardar/Cancelar + 4 inputs; second click on Guardar MUST NOT fire a second POST.

---

## Failing Tests Created (RED Phase)

### API Integration Tests — Playwright APIRequestContext (10 tests)

**File:** `e2e/tests/api/create-cliente.api.atdd.spec.ts`

- AC #1 — `201` + `ClienteDto` (camelCase, `nitRuc`, ISO 8601, UUID `id`) + `Location` header
- AC #1 — `createdAt == updatedAt` on first insert
- AC #1 — New row retrievable via `GET /api/v1/clientes/{id}` → `200`
- AC #1 — New id appears in `GET /api/v1/clientes` list
- AC #2 — Empty body → `400` + `application/problem+json` + 4 camelCase error keys
- AC #2 / NFR6 — 400 body does NOT leak `ClienteEntity` / `DbContext` / `"Nit"` / SQL / stack frames
- AC #2 — Parameterized: omitting each of the 4 fields (4 tests via `for…of`) → 400 with that field key
- AC #3 — Duplicate nitRuc → `409` + safe Problem Details (`title`, `detail`, `type`, `instance`)
- AC #3 / NFR6 — 409 body does NOT contain `23505` / `DbUpdateException` / `uk_clientes_nit` / SQL / stack frames
- AC #3 — Duplicate row is NOT persisted (assert list still has only one row with that nitRuc)

### E2E Tests — Playwright Browser (8 tests)

**File:** `e2e/tests/clientes/create-cliente.atdd.spec.ts`

- AC #4 — "Nuevo cliente" button is always visible (left panel sticky header)
- AC #4 — Clicking opens dialog with title + 4 `aria-required` inputs + Guardar/Cancelar buttons
- AC #5 — Empty submit blocks: zero POST calls, 4 inline Spanish errors visible
- AC #6 — Happy path 201 → dialog closes, success toast, new item in list (network-first intercept BEFORE navigate)
- AC #7 — Duplicate NIT 409 → dialog stays open, inline NIT/RUC error, NFR6 substring scan on page HTML
- AC #8 — 500 → dialog stays open, error toast, form values preserved, NFR6 substring scan
- AC #9 — Cancelar closes dialog without firing POST; reopening shows empty fields (form reset)
- AC #10 — Slow POST (500 ms): double-click on Guardar fires POST exactly once

### Component Tests — Vitest + RTL + MSW (9 tests)

**File:** `frontend/src/modules/crm/clientes/presentation/CreateClienteDialog.test.tsx`

- AC #4 — 4 `aria-required` inputs (Nombre, NIT/RUC, Teléfono, Ciudad) + Guardar/Cancelar buttons rendered with exact Spanish copy
- AC #5 — Empty submit: 4 inline Spanish errors visible, MSW spy on POST hit 0 times
- AC #5 — Partial fill (only Nombre): 3 inline errors on empty fields, Nombre's error absent, no POST
- AC #6 — Happy 201: `onClose` invoked, success toast invoked with exact copy, `['clientes']` cache prepended at index 0
- AC #7 — 409 duplicate NIT: dialog stays open (`onClose` NOT called), inline NIT/RUC error visible, no toast, NFR6 substring scan on `container.outerHTML`
- AC #8 — 500: error toast invoked with exact copy, `onClose` NOT called, form values preserved
- AC #9 — Cancelar: `onClose` invoked, no POST fired
- AC #10 — Slow POST (300 ms): the 4 inputs + Cancelar button are disabled while in-flight
- AC #10 — Double-click on Guardar: only one POST is fired

### Hook Tests — Vitest + RTL + MSW (5 tests)

**File:** `frontend/src/modules/crm/clientes/application/useCreateCliente.test.tsx`

- AC #6 — 201 success: mutation `status='success'`, cache prepended at index 0 (existing element pushed to index 1)
- AC #6 — Undefined cache: mutation success seeds `['clientes']` with `[new]`
- AC #7 — 409: mutation `status='error'` + `error instanceof DuplicateNitError === true`; cache unchanged
- AC #8 — 400: mutation `status='error'` + `error instanceof ClienteValidationError === true`; cache unchanged
- AC #8 — 500: mutation `status='error'`, MSW handler hit EXACTLY ONCE (no retry, `retry: false`); cache unchanged

### Repository Tests — Vitest + MSW (5 tests)

**File:** `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.create.test.ts`

- AC #6 — 201 returns the parsed `Cliente`
- AC #7 — 409 throws `DuplicateNitError`
- AC #8 — 400 throws `ClienteValidationError` whose `fieldErrors` equals the body's `errors` map
- AC #8 — 500 re-throws the raw transport error (NOT wrapped)
- AC #8 — Network error (`HttpResponse.error()`) re-throws underlying transport error

**Total tests:** 37 (10 API + 8 E2E + 9 Component + 5 Hook + 5 Repository).

---

## Data Factories / Fixtures Used

### E2E — reused

The existing `ApiHelper` (`e2e/helpers/api.helper.ts`) and `buildCliente()` factory (`e2e/helpers/data.helper.ts`) are reused. The `afterEach` block deletes any created clients via `apiHelper.deleteCliente(id)`. No new factory required.

### Frontend — reused

`buildClienteFixture()` from `frontend/src/mocks/handlers/clientes.ts` (added in Story 2.1) is reused to generate randomized fixtures with camelCase fields and ISO 8601 timestamps.

### New MSW handlers required (Task 13 — to be added by DEV)

The component / hook / repo tests register their POST handlers inline via `server.use(http.post(...))`. The persistent handler factories listed in Task 13 (`createClienteSuccessHandler`, `createClienteValidationHandler`, `createClienteDuplicateNitHandler`, `createClienteServerErrorHandler`, `createClienteSlowHandler`) are NOT strictly required by the test files — the inline form keeps each scenario self-contained. DEV may still add them to `frontend/src/mocks/handlers/clientes.ts` per the story spec for reuse in route-level integration tests.

---

## Mock Requirements (DEV Team — for the backend handoff)

| Endpoint | Status | Body shape | Notes |
|----------|--------|------------|-------|
| `POST /api/v1/clientes` | `201` | `ClienteDto` (camelCase, `nitRuc`, ISO 8601, `createdAt==updatedAt`) | `Location: /api/v1/clientes/{newId}` MUST be set |
| `POST /api/v1/clientes` | `400` | RFC 7807 + `errors: { nombre, nitRuc, telefono, ciudad }` | Each value is a non-empty string array of Spanish messages. NFR6: no `ClienteEntity` / `DbContext` / `"Nit"` / SQL / stack frames |
| `POST /api/v1/clientes` | `409` | RFC 7807 with `title="NIT/RUC duplicado"`, `detail="El NIT/RUC ya está registrado"`, `type="https://tools.ietf.org/html/rfc7231#section-6.5.8"`, `instance="/api/v1/clientes"` | NFR6: no `23505` / `DbUpdateException` / `uk_clientes_nit` / SQL fragments |
| `POST /api/v1/clientes` | `500` | RFC 7807 generic | Surfaces in UI as `toast.error("No pudimos crear el cliente. Inténtalo de nuevo.")` |

---

## Required `data-testid` Attributes

These attributes MUST be added by the DEV team. Tests use a mix of `data-testid` (for new elements) and ARIA-based queries (`getByRole`, `getByLabel`) — both must work.

### `CreateClienteDialog` (`presentation/CreateClienteDialog.tsx`)

- `create-cliente-form` — the inner `<form>` element wired to React Hook Form's `handleSubmit`
- `create-cliente-nombre` — the Nombre `<input>` (also `aria-required="true"` + `label="Nombre"`)
- `create-cliente-nitruc` — the NIT/RUC `<input>` (`aria-required="true"` + `label="NIT/RUC"`)
- `create-cliente-telefono` — the Teléfono `<input>` (`aria-required="true"` + `label="Teléfono"`)
- `create-cliente-ciudad` — the Ciudad `<input>` (`aria-required="true"` + `label="Ciudad"`)

### `ClienteListView` (updated — Story 2.1 selectors carry over)

- Existing: `client-list-panel`, `client-search-input`, `client-list-skeleton`, `client-list-skeleton-item`, `client-list-item-{id}`, `empty-state-no-clients`, `empty-state-search-empty`, `error-panel`, `error-panel-retry`
- New: a primary `<Button>` with `name="Nuevo cliente"` (role="button") in the sticky header above the search input

### `siesa-ui-kit AlertDialog` (no new `data-testid` required)

The `AlertDialog` from siesa-ui-kit exposes a `role="dialog"`. Tests query it via `getByRole('dialog')`. The two action buttons are queried by their visible text (`getByRole('button', { name: /guardar/i })` / `name: /cancelar/i`).

### Toast — mocked at test boundary

`siesa-ui-kit.toast.success` / `toast.error` are mocked via `vi.mock('siesa-ui-kit', …)` so the test asserts on the mock calls instead of DOM. The real `<ToastProvider />` is wired by `routes/__root.tsx` (Task 17) for E2E and production.

---

## Implementation Checklist

### Backend — Task 1 (`ClienteValidator`)

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Validators/ClienteValidator.cs` with FluentValidation rules for the 4 fields + Spanish messages + length caps.
- [ ] Register in `ApplicationServiceCollectionExtensions.AddApplication()`.

### Backend — Task 2 (`CreateClienteCommand` + Handler)

- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommand.cs` (sealed record).
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/CreateClienteCommandHandler.cs` with the validate → pre-check NIT → create entity → persist → map dto flow.
- [ ] Create `backend/src/SiesaAgents.Application/Clientes/Exceptions/DuplicateNitException.cs`.
- [ ] Register handler in `ApplicationServiceCollectionExtensions.AddApplication()`.

### Backend — Task 3 (`POST /api/v1/clientes` endpoint)

- [ ] Add `group.MapPost("/", ...)` to `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` with try/catch on `ValidationException` (400 via `Results.ValidationProblem`) and `DuplicateNitException` (409 via `Results.Problem`).
- [ ] Add `ToCamelCase` private helper for FluentValidation `PropertyName` mapping.

### Backend — Task 4 / 5 / 6 (Unit + Integration tests)

- [ ] DEV team adds `CreateClienteCommandHandlerTests`, `ClienteValidatorTests`, `CreateClienteEndpointTests` per the story spec.
- [ ] Run `dotnet test backend/SiesaAgents.sln` → all new + existing tests pass.
- [ ] Run `pnpm exec playwright test e2e/tests/api/create-cliente.api.atdd.spec.ts` → all 10 API tests pass.

### Frontend — Task 7 / 8 (domain + typed errors)

- [ ] Add `create(input: CreateClienteInput): Promise<Cliente>` to `IClienteRepository`.
- [ ] Define `CreateClienteInput` shape (4 fields).
- [ ] Add `DuplicateNitError` and `ClienteValidationError` to `frontend/src/modules/crm/clientes/domain/errors.ts`.

### Frontend — Task 9 (infrastructure)

- [ ] Implement `clienteApiRepository.create` in `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` with 409 → `DuplicateNitError`, 400 → `ClienteValidationError`, others → re-throw.
- [ ] Run `pnpm --filter frontend test clienteApiRepository.create` → 5 tests pass.

### Frontend — Task 10 (Zod schema + mutation hook)

- [ ] Create `frontend/src/modules/crm/clientes/application/createClienteSchema.ts` with Zod schema + `CreateClienteFormValues` type + Spanish error messages.
- [ ] Create `frontend/src/modules/crm/clientes/application/useCreateCliente.ts` (TanStack Query mutation, `onSuccess` prepends to `['clientes']`, `retry: false`).
- [ ] Run `pnpm --filter frontend test useCreateCliente` → 5 tests pass.

### Frontend — Task 11 (CreateClienteDialog)

- [ ] Create `frontend/src/modules/crm/clientes/presentation/CreateClienteDialog.tsx` per the story spec (AlertDialog + RHF + Zod + 4 Inputs + setError-on-409/400 + toast.success/error + form reset on close).
- [ ] Run `pnpm --filter frontend test CreateClienteDialog` → 9 tests pass.

### Frontend — Task 12 (wire the button)

- [ ] Edit `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx`: add `useState<boolean>` for `isCreateOpen`; add `<Button>` "Nuevo cliente" in the sticky header above the search input; wire `onClick={() => setIsCreateOpen(true)}`; wire the EmptyState `onAction` to the same setter; render `<CreateClienteDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />`.

### Frontend — Task 17 (ToastProvider)

- [ ] Verify `<ToastProvider />` is mounted in `frontend/src/routes/__root.tsx`. Add if absent.

### Build + lint + test gate (Task 18 / 19)

- [ ] `pnpm exec tsc -b` from `frontend/` exits 0.
- [ ] `pnpm run lint` from `frontend/` exits 0.
- [ ] `pnpm test` from `frontend/` exits 0 (all new + Story 2.1/2.2 baselines green).
- [ ] `pnpm run build` from `frontend/` produces `dist/` with main bundle < 500 KB gzipped.
- [ ] `dotnet build backend/SiesaAgents.sln` exits 0 with zero warnings.
- [ ] `dotnet test backend/SiesaAgents.sln` — all unit + integration tests pass.
- [ ] `pnpm exec playwright test e2e/tests/clientes/create-cliente.atdd.spec.ts` — all 8 E2E tests pass.
- [ ] `pnpm exec playwright test e2e/tests/api/create-cliente.api.atdd.spec.ts` — all 10 API tests pass.

---

## Red-Green-Refactor Workflow

### RED Phase (complete — this checklist)

- 37 tests created across 5 files at 5 levels (API, E2E, Component, Hook, Repository)
- All assert behaviour that does NOT yet exist (no `MapPost("/", ...)` endpoint, no `CreateClienteDialog`, no `useCreateCliente`, no `clienteApiRepository.create`, no `DuplicateNitError` / `ClienteValidationError`)
- Network-first pattern applied in E2E (`page.route(...)` BEFORE `page.goto(...)`)
- `data-testid` selectors used where new (form fields); ARIA roles used where stable (`getByRole('dialog')`, `getByRole('button', { name: ... })`)
- One behavioural focus per test; deterministic via MSW / Playwright route fulfillment

### GREEN Phase (DEV team — next steps)

1. **Backend first** (Tasks 1, 2, 3): `ClienteValidator` → `CreateClienteCommand` + handler → `MapPost`. Fastest feedback because the API integration test covers the contract end-to-end via Testcontainers Postgres.
2. **Frontend domain + infra** (Tasks 7, 8, 9): typed errors → repository `create` with 409/400 mapping. The repo test pins the infra layer.
3. **Frontend hook** (Task 10): Zod schema + `useCreateCliente`. The hook test pins the mutation contract + cache behaviour.
4. **Frontend dialog** (Task 11): `CreateClienteDialog` (AlertDialog + RHF + Zod). The component test pins all UX branches.
5. **Wire-up** (Task 12): add the "Nuevo cliente" button + dialog state to `ClienteListView`. The E2E test pins end-to-end UX.

### REFACTOR Phase

- Tests are the safety net — refactor freely once green.
- Common candidates: extract the AlertDialog footer into a small `<CreateClienteFooter />` once Story 2.4 (edit) needs the same shape; lift Spanish copy into i18n strings when the i18n story lands.

---

## Running Tests

```bash
# Frontend — Vitest (component, hook, repo, route)
pnpm --filter frontend test

# Frontend — single suites
pnpm --filter frontend test CreateClienteDialog
pnpm --filter frontend test useCreateCliente
pnpm --filter frontend test clienteApiRepository.create

# E2E + API — Playwright (requires backend + frontend running via webServer)
pnpm exec playwright test e2e/tests/clientes/create-cliente.atdd.spec.ts
pnpm exec playwright test e2e/tests/api/create-cliente.api.atdd.spec.ts

# Backend — Application unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/

# Backend — API integration tests (Testcontainers Postgres 18)
dotnet test backend/tests/SiesaAgents.IntegrationTests/
```

---

## Knowledge Base References Applied

- `network-first.md` — every E2E test uses `page.route(...)` BEFORE `page.goto(...)` (intercept-then-navigate)
- `data-factories.md` — `buildClienteFixture()` and `buildCliente()` reused; no hard-coded NIT collisions between tests
- `fixture-architecture.md` — MSW server lifecycle in `frontend/src/test-setup.ts`; per-test `server.use(...)` composes the per-scenario handlers
- `component-tdd.md` — RTL + MSW for branches (empty / partial / happy / 409 / 500 / in-flight); `toast` mocked at the module boundary to keep AlertDialog rendering real
- `test-quality.md` — Given-When-Then; one behavioural focus per test; deterministic via MSW
- `selector-resilience.md` — `data-testid` for new form fields; `getByRole`/`getByLabel` for stable ARIA targets; substring scans for NFR6 leakage on rendered HTML
- `timing-debugging.md` — slow-POST scenarios use `delay(300)` / `delay(500)` to expose the in-flight state without arbitrary hard waits

---

## Notes

- The "siesa-ui-kit" toast mock only replaces the `toast` export — the rest of the module (AlertDialog, Input, Button, ToastProvider) is preserved via `vi.importActual` so the dialog still renders correctly.
- NFR6 substring scans are performed on `container.outerHTML` (component tests) and `page.content()` (E2E) rather than against captured event handlers, because the contract is "the user MUST NEVER see these strings". The clienteId / nitRuc carried by the request body is NOT considered leakage (the user typed those values themselves).
- AC #5's "first failing field gets focus" assertion is not yet expressed as a focus-check in the tests; it is covered by the visible-error assertions plus the AC requirement on `setFocus`. The DEV team is responsible for wiring `setFocus(firstErrorKey)` per the story spec; the visual-error contract gates correctness.
- The Playwright workspace-root runner (`playwright.config.ts` at repo root) is already wired — same pattern as Stories 2.1 / 2.2. The new specs land in `e2e/tests/api/` and `e2e/tests/clientes/` next to the existing ATDD specs.
- The integration test `Post_PersistsCreatedAtAndUpdatedAtEqual_OnFirstInsert` from Task 6 maps to the Playwright API spec `AC #1 — createdAt equals updatedAt on first insert` (covers the same contract from the HTTP layer instead of the EF layer).

---

**Generated by BMad TEA Agent** — 2026-06-29
