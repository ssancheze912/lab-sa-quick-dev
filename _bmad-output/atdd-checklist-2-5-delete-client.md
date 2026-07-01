# ATDD Checklist - Epic 2, Story 2.5: Delete Client

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** API/Integration (backend, R2 is the highest-priority risk) + Component (frontend UI flow) + E2E (full journey)

---

## Story Summary

As a commercial team member, I want to delete a client record, so that the client list only contains active and relevant records. The deletion must correctly handle two variants: clients with no associated contacts (simple success toast) and clients with associated contacts (contacts are orphaned via `ON DELETE SET NULL` at the database FK level, never cascade-deleted).

**As a** commercial team member
**I want** to delete a client record
**So that** the client list only contains active and relevant records

---

## Acceptance Criteria

1. Clicking "Eliminar" on a client's detail view opens a confirmation dialog (`siesa-ui-kit` `AlertDialog`) asking "¿Eliminar este cliente?" with "Confirmar"/"Cancelar" (TC-E2-P0-04).
2. Confirming deletion of a client with NO associated contacts removes it from the list immediately, returns the right panel to the empty/default state, and shows toast "Cliente eliminado correctamente" (TC-E2-P2-07, FR27).
3. Confirming deletion of a client WITH associated contacts deletes the client, preserves all contacts with `cliente_id = NULL` (DB FK `ON DELETE SET NULL`, not app-level logic — R2, TC-E2-P0-03), and shows toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." (TC-E2-P0-04).
4. Clicking "Cancelar" closes the dialog, leaves the client unchanged, and makes zero `DELETE` calls (TC-E2-P1-11).
5. Dismissing via Esc/backdrop (not explicit "Cancelar") does not delete the client and makes zero `DELETE` calls (R9, TC-E2-P2-03).
6. `DELETE` for a non-existent id returns `404 Not Found` with no false-success toast.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/clientes/delete-client.spec.ts` (~215 lines)

- **Test:** `TC-E2-P0-04 — AC #1: "Eliminar" opens a confirmation dialog...`
  - **Status:** RED — `btnEliminar`/`btnConfirmarEliminar` triggers exist in the page object but the frontend has no "Eliminar" button/dialog yet.
- **Test:** `TC-E2-P2-07 — AC #2: deleting a client with no contacts removes it from the list...`
  - **Status:** RED — `DELETE /api/v1/clientes/{id}` endpoint does not exist (404/405 from the real backend).
- **Test:** `AC #2: the deleted client is not retrievable via the API afterwards`
  - **Status:** RED — same missing endpoint.
- **Test:** `TC-E2-P0-03/TC-E2-P0-04 — AC #3: deleting a client WITH associated contacts...`
  - **Status:** RED — missing endpoint + missing Contacto seed surface (`ContactoEntity` doesn't exist yet).
- **Test:** `TC-E2-P0-03 (R2) — AC #3: the associated contact still exists with clienteId null...`
  - **Status:** RED — same as above; this is the single most important test in the epic.
- **Test:** `TC-E2-P1-11 — AC #4: "Cancelar" makes zero DELETE calls...`
  - **Status:** RED — no "Eliminar"/dialog UI to interact with yet.
- **Test:** `the full clientes E2E suite journey remains green: creating, then deleting, a client with no contacts`
  - **Status:** RED — regression-guard journey combining Story 2.3's create flow with this story's delete flow.

**Note:** AC #5 (Esc/backdrop dismissal) and AC #6 (404 false-success) are deliberately covered at the component/API level only (not duplicated as full E2E journeys), per the workflow's "avoid duplicate coverage" guidance — see `ClienteDetailView.test.tsx` and `ClienteEndpointsTests.cs`.

### API/Integration Tests (backend, xUnit) (23 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Repositories/ClienteRepositoryTests.cs` (+5 tests appended)

- `DeleteAsync_WithExistingIdAndNoAssociatedContacts_RemovesTheClienteAndReturnsTrue` — RED: `IClienteRepository.DeleteAsync` doesn't exist (compile error).
- `DeleteAsync_WithNonExistentId_ReturnsFalse` — RED: same.
- `DeleteAsync_DoesNotThrowWhenCalledTwiceForTheSameId_SecondCallReturnsFalse` — RED: same.
- `DeleteAsync_WithClienteThatHasAssociatedContacts_OrphansTheContactsInsteadOfCascadeDeletingThem` — RED: `ContactoEntity` doesn't exist (compile error). **R2/TC-E2-P0-03 — the single most important test in the epic.**
- `DeleteAsync_WithClienteThatHasNoAssociatedContacts_ContactCountIsZeroAfterDeletion` — RED: same.

**File:** `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` (+9 tests appended)

- `DeleteClientes_WithExistingIdAndNoContacts_ReturnsNoContent`
- `DeleteClientes_WithExistingIdAndNoContacts_DoesNotIncludeTheHadAssociatedContactsHeaderAsTrue`
- `DeleteClientes_WithExistingIdAndNoContacts_ClientIsNoLongerRetrievableAfterwards`
- `DeleteClientes_WithExistingIdAndAssociatedContacts_ReturnsNoContentWithHadAssociatedContactsHeaderTrue` (Task 3 header contract)
- `DeleteClientes_WithNonExistentId_ReturnsNotFound` (AC #6)
- `DeleteClientes_WithNonExistentId_DoesNotReturnAFalseSuccessStatus` (AC #6)
- `DeleteClientes_WithMalformedGuidRouteSegment_ReturnsNotFoundNot500`
- `DeleteClientes_CalledTwiceInSuccession_SecondCallReturnsNotFound`
- `DeleteClientes_DoesNotAffectOtherClientesInTheList`
  - **Status (all above):** RED — `DELETE /api/v1/clientes/{id}` is not mapped yet; `ContactoEntity` reference fails to compile.

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextMigrationTests.cs` (updated: 1 test superseded, 2 tests added)

- `Database_ContainsClientesTable_AndContactosTableAsOfStory25` (replaces the Story 2.1-era test that asserted `contactos` did NOT exist) — RED: migration not created yet.
- `Database_ContactosClienteIdForeignKey_HasOnDeleteSetNullBehavior` — RED: FK doesn't exist yet. Verifies `pg_constraint.confdeltype = 'n'` (SET NULL) for `fk_contactos_clientes` — closes R2 at the schema level, independent of the repository-level test.
- `Database_ContactosTable_HasClienteIdIndex` — RED: index doesn't exist yet.

### Component Tests (Frontend, Vitest + RTL) (24 tests)

**File:** `frontend/src/modules/crm/clientes/application/hooks/useDeleteCliente.test.tsx` (new, ~280 lines, 12 tests)

- Covers: `['clientes']` invalidation (not `['clientes', id]`), both toast variants (AC #2/#3), R11 cross-variant guard, 404 → "El cliente ya no existe." (AC #6), generic error toast, promise rejection propagation, id-targeting correctness, network-error handling.
- **Status:** RED — `Failed to resolve import "./useDeleteCliente"` (module does not exist). Verified via `npx vitest run`.

**File:** `frontend/src/modules/crm/clientes/presentation/components/ClienteDetailView.test.tsx` (extended, +14 tests)

- AC #1: "Eliminar" button renders only in loaded state; opens dialog with exact copy "¿Eliminar este cliente?"; shows "Confirmar"/"Cancelar"; dialog is separate from the edit dialog.
- AC #2: `DELETE` fires on Confirmar; right panel returns to `cliente-detail-empty`; exact success toast.
- AC #3: orphaning toast shown when `X-Had-Associated-Contacts: true`; right panel still returns to empty state; R11 cross-variant guard.
- AC #4: Cancelar closes dialog with zero DELETE calls; client remains displayed.
- AC #5: Esc key dismissal makes zero DELETE calls; client remains displayed (not deleted, not empty state).
- AC #6: 404 on confirm does not show a false-success toast.
- **Status:** RED — verified via `npx vitest run`: **14 failed, 22 passed** (all 22 pre-existing Story 2.1–2.4 tests remain green — no regression).

---

## Data Factories / Handlers

No new data factory file needed — reused `frontend/src/test/factories/cliente.factory.ts` (`createCliente`) unchanged, plus `e2e/helpers/data.helper.ts`'s existing `buildCliente`/`buildContacto`.

### MSW Handlers Extended

**File:** `frontend/src/test/msw/handlers.ts`

**Added:**

- `http.delete(CLIENTE_BY_ID_ENDPOINT, ...)` — default 204 success handler (no-contacts variant, no header). Tests override via `server.use(...)` for the with-contacts (header) and 404 paths, per `network-first.md`.
- `clienteDeleteNotFoundProblemDetails` — RFC 7807 body for the DELETE 404 case (AC #6).

---

## Fixtures / Helpers

No new Playwright fixture needed. Reused `e2e/fixtures/base.fixture.ts`, `e2e/helpers/api.helper.ts` (`deleteCliente`, `createContacto`, `deleteContacto`, `getContactos` — already present in the helper, targeting `/api/v1/contactos`), and extended `e2e/pages/clientes.page.ts` with two new methods:

- `abrirDialogoEliminar()` — clicks "Eliminar", asserts the confirmation copy is visible.
- `confirmarEliminar()` — clicks "Confirmar".

---

## Mock Requirements

### `X-Had-Associated-Contacts` Response Header (Task 3)

**Endpoint:** `DELETE /api/v1/clientes/{id}`

**Success response (no contacts):** `204 No Content`, header absent or `"false"`.

**Success response (had contacts):** `204 No Content`, header `X-Had-Associated-Contacts: true`.

**Not found:** `404 Not Found`, RFC 7807 Problem Details body.

**Notes:** This header is a narrow, story-scoped mechanism (documented in the story's Dev Notes as replaceable once Epic 3 delivers a real Contacto query surface). Both frontend (`clienteApiRepository.remove`) and backend (`ClienteEndpoints.cs`) must agree on this exact header name/values.

### Contacto Seed Surface for E2E (AC #3)

The E2E test file documents that `ApiHelper.createContacto`/`deleteContacto`/`getContactos` (already present in `e2e/helpers/api.helper.ts`, targeting `/api/v1/contactos`) are used to seed/verify a contact associated with the client being deleted. Since full Contacto CRUD is Epic 3 scope, the dev team must ensure *some* minimal seeding path exists by the time this story reaches GREEN — a lightweight test-only endpoint, or the existing helper if a minimal Contacto POST/GET surface is stood up. The acceptance contract (contacts survive with `clienteId === null`) does not depend on which seeding mechanism is used.

---

## Required data-testid / Selector Attributes

### `ClienteDetailView` (Eliminar flow)

- Button labelled exactly "Eliminar" (`getByRole('button', { name: /^eliminar$/i })`) — sibling to the existing "Editar" button.
- `AlertDialog` (second instance, independent from the edit dialog) with:
  - `title="¿Eliminar este cliente?"` (exact text, queried via `getByText`)
  - "Confirmar" action button
  - "Cancelar" action button
- No new `data-testid` strictly required (role/text queries suffice, consistent with the existing "Editar" button pattern) — reuses `cliente-detail-panel` and `cliente-detail-empty` already present.

**Page Object additions** (`e2e/pages/clientes.page.ts`, already present or added):

- `btnEliminar` — `getByRole('button', { name: /eliminar/i })`
- `btnConfirmarEliminar` — `getByRole('button', { name: /confirmar/i })`

---

## Implementation Checklist

### Backend

- [ ] Task 1 — Create `ContactoEntity` (`backend/src/SiesaAgents.Domain/Entities/ContactoEntity.cs`), `ContactoConfiguration.cs` with explicit `OnDelete(DeleteBehavior.SetNull)`, register in `AppDbContext`, generate `AddContactoEntity` migration.
  - Run: `dotnet build` (must resolve `ContactoEntity` compile errors in test projects).
  - Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter AppDbContextMigrationTests` → `Database_ContainsClientesTable_AndContactosTableAsOfStory25`, `Database_ContactosClienteIdForeignKey_HasOnDeleteSetNullBehavior`, `Database_ContactosTable_HasClienteIdIndex` must pass.
- [ ] Task 2 — Add `DeleteAsync`/`CountByClienteIdAsync` to `IClienteRepository`/`ClienteRepository`; `DeleteClienteCommand` + Handler; `MapDelete` endpoint.
  - Run: `dotnet test --filter ClienteRepositoryTests` → all `DeleteAsync_*` tests pass, including the R2 orphaning test.
  - Run: `dotnet test --filter ClienteEndpointsTests` → all `DeleteClientes_*` tests pass.
- [ ] Task 3 — `X-Had-Associated-Contacts` header on the 204 response.
  - Run: `DeleteClientes_WithExistingIdAndAssociatedContacts_ReturnsNoContentWithHadAssociatedContactsHeaderTrue` passes.

### Frontend

- [ ] Task 4 — `remove()` on `IClienteRepository.ts`/`clienteApiRepository.ts`; `useDeleteCliente.ts` hook.
  - Run: `pnpm --filter frontend test useDeleteCliente` → all 12 tests pass.
- [ ] Task 5 — "Eliminar" button + second `AlertDialog` + empty-state transition in `ClienteDetailView.tsx`.
  - Run: `pnpm --filter frontend test ClienteDetailView` → all 36 tests pass (22 pre-existing + 14 new).
- [ ] Task 6 — E2E: verify `e2e/tests/clientes/delete-client.spec.ts` (7 tests) passes against the running stack; confirm the full `e2e/tests/clientes/` suite has no regressions.

**Estimated Effort:** 6-9 hours (backend FK/migration work + frontend hook/dialog wiring + E2E contact-seed groundwork).

---

## Running Tests

```bash
# Backend
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~ClienteRepositoryTests|FullyQualifiedName~ClienteEndpointsTests|FullyQualifiedName~AppDbContextMigrationTests"

# Frontend unit/component
cd frontend && npx vitest run src/modules/crm/clientes

# Frontend single file
cd frontend && npx vitest run src/modules/crm/clientes/application/hooks/useDeleteCliente.test.tsx

# E2E (requires backend + frontend running)
npx playwright test e2e/tests/clientes/delete-client.spec.ts

# E2E headed/debug
npx playwright test e2e/tests/clientes/delete-client.spec.ts --headed
npx playwright test e2e/tests/clientes/delete-client.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ All tests written and failing for the right reason (missing `ContactoEntity`, missing `DeleteAsync`, missing `DELETE` endpoint, missing `useDeleteCliente`, missing "Eliminar" UI).
- ✅ MSW handlers extended (network-first, default 204 handler + 404 Problem Details fixture).
- ✅ Page object extended with `abrirDialogoEliminar()`/`confirmarEliminar()`.
- ✅ No test-authoring bugs: frontend component/hook tests confirmed via `npx vitest run` (14/14 new ClienteDetailView tests fail as expected; useDeleteCliente fails on import resolution; 127 pre-existing tests in the `clientes` module remain green — zero regressions). Backend confirmed via `dotnet build` (fails exclusively on the two expected `ContactoEntity` symbol errors).
- ✅ E2E spec confirmed to parse/list correctly via `npx playwright test --list` (28 test instances across 4 projects, 7 unique tests).

### GREEN Phase (DEV Team — Next Steps)

1. Start with Task 1 (`ContactoEntity`/migration) — unblocks compilation of both backend test files.
2. Task 2 (repository + command + endpoint) — makes the bulk of backend tests pass.
3. Task 3 (header) — small addition, makes the header-contract tests pass.
4. Task 4 (frontend hook) — makes `useDeleteCliente.test.tsx` pass.
5. Task 5 (UI wiring) — makes `ClienteDetailView.test.tsx`'s 14 new tests pass.
6. Task 6 (E2E) — run the full `e2e/tests/clientes/` suite, confirm zero regressions to Stories 2.1–2.4.

### REFACTOR Phase (DEV Team — After All Tests Pass)

Standard refactor discipline per company standards — no test behavior changes, only implementation quality improvements, with the full suite re-run after each change.

---

## Notes

- **Superseded test:** `AppDbContextMigrationTests.Database_ContainsClientesTable_ButNotContactos` (Story 2.1-era) was replaced by `Database_ContainsClientesTable_AndContactosTableAsOfStory25`, since this story intentionally introduces the `contactos` table. This is an expected, story-scoped test evolution, not an accidental regression.
- **R2 is covered at TWO independent levels:** the schema/FK level (`Database_ContactosClienteIdForeignKey_HasOnDeleteSetNullBehavior`, via `pg_constraint.confdeltype`) and the repository behavior level (`DeleteAsync_WithClienteThatHasAssociatedContacts_OrphansTheContactsInsteadOfCascadeDeletingThem`, via actual delete + re-query). Both must run against real PostgreSQL — EF Core InMemory does not enforce FK `ON DELETE` behavior.
- **R11 (toast copy exactness):** explicit "must never cross" tests added at both the hook level (`useDeleteCliente.test.tsx`) and the component level (`ClienteDetailView.test.tsx`) — a regression that shows the wrong toast variant for either delete path will be caught immediately.
- **E2E Contacto seeding dependency:** the AC #3 E2E tests depend on a minimal Contacto seeding mechanism reaching parity with `ApiHelper.createContacto`'s existing shape (which already assumes `POST /api/v1/contactos` exists) — flagged explicitly in the spec file's header comment so the dev team is not surprised by this cross-story dependency.
- Backend and frontend test counts: 23 backend (xUnit) + 26 frontend (12 hook + 14 component) + 7 E2E = **56 new/modified tests** for this story.

---

## Test Execution Evidence

### Backend (`dotnet build`)

```
error CS0246: The type or namespace name 'ContactoEntity' could not be found
  at Repositories/ClienteRepositoryTests.cs(485,24)
error CS0246: The type or namespace name 'ContactoEntity' could not be found
  at Endpoints/ClienteEndpointsTests.cs(1018,24)
Build FAILED. 2 Error(s)
```

Expected — confirms RED phase is blocked exclusively on the story's Task 1 deliverable (`ContactoEntity`), not on any typo/setup issue.

### Frontend (`npx vitest run`)

```
useDeleteCliente.test.tsx: Failed to resolve import "./useDeleteCliente" — module does not exist (expected)

ClienteDetailView.test.tsx: Test Files 1 failed (1)
                             Tests  14 failed | 22 passed (36)
```

14 new Story 2.5 tests fail (missing "Eliminar" UI); all 22 pre-existing Story 2.1–2.4 tests still pass — zero regressions.

```
Full clientes module: Test Files  2 failed | 9 passed (11)
                       Tests      14 failed | 127 passed (141)
```

### E2E (`npx playwright test --list`)

```
Total: 28 tests in 1 file
```

(7 unique tests × 4 configured projects: chromium, firefox, edge, mobile-chrome)

**Summary:** Total new/modified tests: 56. RED verified: 100% (all fail either at compile-time, import-time, or assertion-time, for the expected missing-implementation reasons — zero test-authoring bugs identified).

---

## Knowledge Base References Applied

- **network-first.md** — MSW `server.use(...)` overrides registered before `render`/`renderHook` in every new test; Playwright `page.route` spies registered before the triggering click in E2E Cancelar tests.
- **data-factories.md** — reused `createCliente`/`buildCliente`/`buildContacto` factories, no hardcoded test data.
- **selector-resilience.md** — role/text queries (`getByRole('button', { name: ... })`, exact-copy `getByText`) consistent with the existing Editar-flow pattern; no CSS selectors introduced.
- **test-quality.md** — one behavior per test, Given-When-Then comments throughout, explicit `waitFor`/`findBy*` (no hard waits).
- **component-tdd.md** — `toast` mocked via `vi.mock('siesa-ui-kit', ...)` mirroring `useUpdateCliente.test.tsx`'s exact isolation pattern.

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-07-01
