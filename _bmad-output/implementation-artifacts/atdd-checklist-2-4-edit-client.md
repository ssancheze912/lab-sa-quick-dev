# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** E2E (with API + Component supporting coverage)

---

## Story Summary

Edit an existing client's Nombre, NIT/RUC, Teléfono, and Ciudad via a pre-filled form, with immediate reflection in the detail view and list, backend-independent validation, duplicate-NIT conflict handling with self-exclusion, and a no-op Cancelar path.

**As a** commercial team member,
**I want** to edit any field of an existing client,
**So that** the client information stays up to date.

---

## Acceptance Criteria

1. Clicking "Editar" opens `ClienteForm` in `mode="edit"` pre-filled with the client's current Nombre, NIT/RUC, Teléfono, Ciudad (TC-E2-P1-08).
2. Saving via `PUT /api/v1/clientes/{id}` reflects changes in detail + list immediately (no reload) and shows toast "Cliente actualizado correctamente" (TC-E2-P1-09, TC-E2-P2-06).
3. Backend independently validates empty/whitespace required fields → `400 Bad Request` with FluentValidation field errors, no persistence (defense in depth, mirrors Story 2.3 R3).
4. Clearing a required field shows an inline Zod error and blocks submission (TC-E2-P1-10).
5. A NIT/RUC colliding with a DIFFERENT client → `409 Conflict`, "El NIT/RUC ya está registrado", form stays open with data intact.
6. "Cancelar" closes the form with zero API calls, original data unchanged (TC-E2-P1-15 / R8).
7. Self-update with the client's OWN unchanged NIT/RUC succeeds (self-exclusion, no false 409).

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/clientes/edit-client.spec.ts`

- **Test:** `TC-E2-P1-08 — AC #1: "Editar" opens the form pre-filled with the current values`
  - **Status:** RED — no "Editar" trigger exists on `ClienteDetailView`, `PUT` endpoint missing.
  - **Verifies:** AC #1.
- **Test:** `TC-E2-P1-09 — AC #2: saving changes updates the detail panel immediately and shows the exact success toast`
  - **Status:** RED — `PUT /api/v1/clientes/{id}` does not exist; toast copy not wired.
  - **Verifies:** AC #2.
- **Test:** `TC-E2-P1-09 — AC #2: the updated client also reflects the change in the list without a page reload`
  - **Status:** RED — same as above; query invalidation for `['clientes']` not wired for edit.
  - **Verifies:** AC #2, R6.
- **Test:** `AC #4 — TC-E2-P1-10: clearing a required field blocks submit with an inline error`
  - **Status:** RED — edit trigger/form not wired; blocked before reaching this assertion.
  - **Verifies:** AC #4.
- **Test:** `AC #5: submitting a NIT/RUC that collides with a different client shows the conflict error and keeps data intact`
  - **Status:** RED — `PUT` endpoint/409 mapping missing.
  - **Verifies:** AC #5.
- **Test:** `AC #6 — TC-E2-P1-15: "Cancelar" makes zero API calls and preserves the original client data`
  - **Status:** RED — no `onCancel` wiring on `ClienteForm`, no "Editar" trigger.
  - **Verifies:** AC #6, R8.
- **Test:** `AC #7: editing with the client's own unchanged NIT/RUC succeeds (self-exclusion)`
  - **Status:** RED — `PUT` endpoint/self-exclusion logic missing.
  - **Verifies:** AC #7.

### API Tests (18 tests — backend integration + unit)

**Files:**
- `backend/tests/SiesaAgents.IntegrationTests/Repositories/ClienteRepositoryTests.cs` (+7 tests appended)
- `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` (+13 tests appended)
- `backend/tests/SiesaAgents.UnitTests/Validators/UpdateClienteRequestValidatorTests.cs` (new file, 7 tests)

Repository (`ClienteRepositoryTests`):
- `UpdateAsync_WithValidChanges_PersistsAndReturnsTheUpdatedEntity` — RED: `ClienteEntity.Update` / `IClienteRepository.UpdateAsync` don't exist (compile error, correct RED signal).
- `UpdateAsync_WithValidChanges_PersistsChangesRetrievableAfterwards` — RED: same.
- `UpdateAsync_BumpsUpdatedAtButDoesNotChangeCreatedAtOrId` — RED: same; verifies AC #2/#7 timestamp discipline.
- `UpdateAsync_WithNonExistentEntity_ReturnsNull` — RED: same; 404 case contract.
- `UpdateAsync_WithNitCollidingWithADifferentClient_ThrowsDbUpdateException` — RED: same; AC #5.
- `UpdateAsync_WithSelfUnchangedNit_DoesNotThrow` — RED: same; AC #7 self-exclusion.

Endpoints (`ClienteEndpointsTests`), `PUT /api/v1/clientes/{id}`:
- 200 happy path (3 tests: status, body reflects changes, persisted+visible on GET).
- 404 non-existent id.
- 400 empty required fields (2 tests: status + field-level errors/no persistence).
- 409 NIT collision with different client (3 tests: status, Spanish message w/o leakage, no persistence).
- 200 self-update with unchanged NIT (AC #7).
- camelCase JSON response shape.
- Edge cases: malformed GUID route segment (not 500), body `id` mismatch vs route `id` (route wins).
- **Status:** RED — `PUT /api/v1/clientes/{id:guid}` route does not exist yet (405/404 at present).

Validator (`UpdateClienteRequestValidatorTests`, new):
- All-fields-populated valid; empty/whitespace/null Nombre, Nit, Telefono, Ciudad each invalid; all-whitespace reports 4 errors; `Id` is NOT validated.
- **Status:** RED — `UpdateClienteCommand`/`UpdateClienteRequestValidator` don't exist (compile error, correct RED signal).

### Component Tests (24 tests)

**Files:**
- `frontend/src/modules/crm/clientes/presentation/components/ClienteForm.test.tsx` (+16 tests appended, edit-mode suite)
- `frontend/src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx` (+5 tests appended, "Editar" trigger suite)
- `frontend/src/modules/crm/clientes/application/hooks/useUpdateCliente.test.tsx` (new file, 8 tests)

`ClienteForm.test.tsx` (edit mode):
- AC #1 pre-fill: Nombre/NIT/Teléfono/Ciudad each show current value on mount (4 tests) — **PASS already** (initialValues plumbing pre-existed from Story 2.3); kept as regression guards.
- AC #2 success: exact toast "Cliente actualizado correctamente"; `onSuccess` invoked — **RED**, form still calls `useCreateCliente` regardless of mode.
- AC #4 validation: clearing Nombre shows inline error; blocks the update mutation — validation-only assertion passes (Zod is mode-agnostic), the "does not call update mutation" test is a regression guard.
- AC #5 conflict: 409 shows inline message; form stays open; data intact — **RED**, currently a real edit submit still POSTs (wrong verb/endpoint), so the MSW `PUT` override never intercepts it.
- AC #6 Cancelar: `onCancel` called, zero API calls — **RED**, `ClienteForm` has no `onCancel` prop today.
- AC #7 self-exclusion: success toast when NIT unchanged — **RED**, same root cause as AC #2.

`ClienteDetailView.test.tsx` ("Editar" trigger):
- "Editar" button renders only in the loaded success branch (3 tests: present when loaded, absent while loading, absent when not-found) — **RED** for the "present when loaded" and "opens dialog" cases (no button exists yet); the two "absent" cases pass today by absence of any button anywhere (kept as regression guards).
- Clicking "Editar" opens the dialog — **RED**.
- Edit form pre-fills from already-loaded data, no extra fetch — **RED**.

`useUpdateCliente.test.tsx` (new):
- Invalidates `['clientes']` list cache — **RED**, module doesn't exist.
- Invalidates `['clientes', id]` detail cache (R6) — **RED**.
- Exact success toast copy (TC-E2-P2-06) — **RED**.
- 409 rejects promise, no toast at all (success or error) — **RED**.
- No cache invalidation on 409 failure — **RED**.
- Generic `toast.error` on non-409 failure (e.g. 500) — **RED**.

All "RED" component/hook tests currently fail with `Failed to resolve import "./useUpdateCliente"` (module missing) or with assertion failures because `ClienteForm` still unconditionally calls `useCreateCliente`/POSTs regardless of `mode` — both are the correct RED reasons (missing implementation, not test bugs). Verified via `vitest run`.

---

## Data Factories Created

No new factories required — reuses `createCliente`/`createClientes` from `frontend/src/test/factories/cliente.factory.ts` (Story 2.1) and `buildCliente` from `e2e/helpers/data.helper.ts` (Story 2.1/2.3).

---

## Fixtures Created

No new fixtures required — reuses `e2e/fixtures/base.fixture.ts` and `ApiHelper` (`e2e/helpers/api.helper.ts`, already exposes `createCliente`/`deleteCliente`/`getClientes`).

---

## Mock Requirements

### `PUT /api/v1/clientes/:id` (MSW)

**File:** `frontend/src/test/msw/handlers.ts` (updated)

- Default success handler: `200 OK`, echoes `{ ...defaultCliente, ...body, id: params.id }`.
- Tests override via `server.use(...)` for:
  - `409 Conflict` → `clienteNitConflictProblemDetails` (reused as-is from Story 2.3).
  - `500` generic failure (inline in `useUpdateCliente.test.tsx`).
  - Request-count spies for zero-call assertions (Cancelar, validation-blocks-submit).

No new Problem Details fixtures were needed — `clienteNitConflictProblemDetails` and `clienteNotFoundProblemDetails` are reused verbatim from Story 2.2/2.3.

---

## Required data-testid / Accessible-Name Attributes

Per project convention, interactive controls are targeted by accessible role/name (`getByRole`) and labeled inputs by `getByLabelText`, not raw `data-testid`, except for structural containers. New requirements for this story:

### ClienteDetailView

- "Editar" `Button` (`siesa-ui-kit`) — accessible name `/editar/i`, rendered only inside the existing `cliente-detail-panel` success branch (not loading/error/not-found).

### ClienteForm

- `onCancel` prop wired to the "Cancelar" button (existing accessible name `/cancelar/i` already assumed by `e2e/pages/clientes.page.ts`'s `btnCancelar`) — must trigger zero network requests.
- Existing `data-testid="cliente-detail-panel"` (Story 2.2) reused as the host branch for the new button — no new testid needed there.

**Implementation Example:**

```tsx
<Button onClick={() => setEditOpen(true)}>Editar</Button>
```

---

## Implementation Checklist

### Backend

- [ ] `ClienteEntity.Update(nombre, nit, telefono, ciudad)` — reuse `Create`'s validation, set `UpdatedAt`, never touch `Id`/`CreatedAt`.
- [ ] `IClienteRepository.UpdateAsync(ClienteEntity, ct)` — additive; returns `null` if not found.
- [ ] `ClienteRepository.UpdateAsync` — load tracked entity, mutate via `.Update(...)`, `SaveChangesAsync`; let unique-violation propagate as `DbUpdateException`.
- [ ] `UpdateClienteCommand` (`Id, Nombre, Nit, Telefono, Ciudad`) in `Application/Commands/Clientes/`.
- [ ] `UpdateClienteCommandHandler` — `GetByIdAsync` → `null` ? `null` : mutate + `UpdateAsync` + map to `ClienteDto`.
- [ ] `UpdateClienteRequestValidator` (FluentValidation) — `NotEmpty()` on Nombre/Nit/Telefono/Ciudad, NOT on `Id`.
- [ ] `ClienteEndpoints.MapPut("/api/v1/clientes/{id:guid}", ...)` — route `id` overrides body `id`; validator → 400; handler `null` → 404; `IsUniqueViolation` catch → 409; success → 200 + `ClienteDto`.
- [ ] Run: `dotnet test` (backend/tests, requires local Postgres per `ClienteRepositoryTests`/`ClienteEndpointsTests` connection string).
- [ ] ✅ All backend Story 2.4 tests pass (green phase).

### Frontend

- [ ] `IClienteRepository.ts` — add `update(id, data): Promise<Cliente>`.
- [ ] `clienteApiRepository.ts` — implement `update` via `PUT /api/v1/clientes/${id}`.
- [ ] `useUpdateCliente.ts` — `useMutation`, invalidates `['clientes']` + `['clientes', id]`, success toast "Cliente actualizado correctamente", 409 not toasted, other errors → generic toast.
- [ ] `ClienteForm.tsx` — branch `mode === 'edit'` to call `useUpdateCliente(id)` instead of `useCreateCliente`; add `onCancel` prop wired to "Cancelar" with zero mutation calls.
- [ ] `ClienteDetailView.tsx` — add "Editar" `Button` inside the existing success branch, opens `ClienteForm mode="edit"` in `AlertDialog` with `initialValues` from already-loaded `data` (no extra fetch).
- [ ] Run: `pnpm test` (frontend).
- [ ] ✅ All frontend Story 2.4 tests pass (green phase).

### E2E

- [ ] Run: `npx playwright test e2e/tests/clientes/edit-client.spec.ts` (and full `e2e/tests/clientes/` suite for no regression).
- [ ] ✅ All Story 2.4 E2E tests pass; Stories 2.1–2.3 E2E suites remain green.

**Estimated Effort:** 6–8 hours (backend CQRS slice ~2.5h, frontend hook+wiring ~2.5h, E2E/verification ~1.5h — consistent with Stories 2.1–2.3 sizing).

---

## Running Tests

```bash
# Backend (requires local Postgres: siesa_agents_db)
cd backend && dotnet test

# Backend — Story 2.4 only
dotnet test --filter "FullyQualifiedName~UpdateAsync|FullyQualifiedName~PutClientes|FullyQualifiedName~UpdateClienteRequestValidator"

# Frontend
cd frontend && pnpm test

# Frontend — Story 2.4 files only
pnpm exec vitest run src/modules/crm/clientes/application/hooks/useUpdateCliente.test.tsx src/modules/crm/clientes/presentation/components/ClienteForm.test.tsx src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx

# E2E
npx playwright test e2e/tests/clientes/edit-client.spec.ts
npx playwright test e2e/tests/clientes/   # full regression
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 49 new/extended failing tests written across E2E (7), Backend API/Repository (18), Backend Unit/Validator (7), Frontend Component (16 edit-mode + 5 detail-trigger), Frontend Hook (8) — totals include a handful of regression-guard assertions that pass today by absence of the feature (documented above), not silently green due to a test bug.
- ✅ Frontend RED verified via `vitest run`: `useUpdateCliente.test.tsx` fails on missing module import; `ClienteForm.test.tsx` fails 6/31 new+existing tests (edit-mode success/409/cancel/self-exclusion paths); `ClienteDetailView.test.tsx` fails 3/18 (Editar button/dialog/pre-fill).
- ✅ Backend RED verified via `dotnet build`: compile errors on `ClienteEntity.Update`, `IClienteRepository.UpdateAsync`, `UpdateClienteCommand` — the strongest possible RED signal (missing symbols, not just failing assertions).
- ✅ Mock requirements documented (MSW `PUT` handler + 409/500 overrides).
- ✅ No new data-testid required; accessible-name conventions documented for the "Editar" button and "Cancelar" wiring.
- ✅ Implementation checklist created, mapped 1:1 to Story 2.4's existing Tasks 1–6.

### GREEN Phase (DEV Team — Next Steps)

1. Implement backend Task 1 → 3 (Entity/Repository/Command/Handler/Validator/Endpoint) in order; run `dotnet test` after each.
2. Implement frontend Task 4 (repository/hook), then Task 5 (`ClienteForm` branch + `onCancel` + `ClienteDetailView` "Editar" trigger); run `pnpm test` after each.
3. Run the E2E suite last; it exercises the full stack together.

### REFACTOR Phase (DEV Team)

- After all Story 2.4 tests are green, confirm no regression across Stories 2.1–2.3 suites (`pnpm test`, `dotnet test`, full `e2e/tests/clientes/` run) before marking the story done.

---

## Next Steps

1. Share this checklist and the failing tests with the dev workflow (manual handoff — not auto-consumed).
2. Dev implements Tasks 1–6 from the story file, one test at a time (RED → GREEN).
3. Confirm no regression to Stories 2.1–2.3 test suites.
4. Update story status to `done` in `sprint-status.yaml` once green + reviewed.

---

## Knowledge Base References Applied

- `network-first.md` — all MSW/Playwright route interceptions registered before navigation/render.
- `data-factories.md` — reused `createCliente`/`buildCliente` factories, no duplication.
- `test-quality.md` — one primary assertion per test, Given-When-Then structure throughout.
- `selector-resilience.md` — `getByRole`/`getByLabelText` over CSS selectors; `data-testid` only for structural containers, consistent with Stories 2.1–2.3.
- `test-levels-framework.md` — E2E for the full user journey (P1 acceptance test), API/Repository tests for backend contract + validation independence (R3), Component tests for UI-level edit-mode wiring and toast copy exactness (R11).

---

## Notes

- This ATDD pass extends existing Story 2.1–2.3 test files (`ClienteForm.test.tsx`, `ClienteDetailView.test.tsx`, `ClienteRepositoryTests.cs`, `ClienteEndpointsTests.cs`) rather than creating parallel files, mirroring the project's established convention of one test file per production file across stories.
- The AC #1 pre-fill and AC #4 basic-validation assertions in `ClienteForm.test.tsx` pass today because Story 2.3 already built the `mode`/`initialValues` prop surface — this is expected and intentional per the story's Dev Notes ("Story 2.4 will do the actual edit-mode wiring"); they are kept as regression guards, not padding.
- Backend RED phase is verified via compiler errors (missing `Update`/`UpdateAsync`/`UpdateClienteCommand` symbols) rather than runtime failures, since a local Postgres instance was not exercised in this pass — this is the same verification method Story 2.3's ATDD pass would have used for equivalent CQRS-slice additions.
