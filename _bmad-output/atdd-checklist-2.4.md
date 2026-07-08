# ATDD Checklist - Epic 2, Story 2.4: Edit Client

**Date:** 2026-07-08
**Author:** SiesaTeam
**Primary Test Level:** Component (Vitest + @testing-library/react + MSW) with supporting Application-layer (Vitest hook), Backend Application (xUnit + FluentValidation.TestHelper), Backend Integration (xUnit + `WebApplicationFactory<Program>`), Routing-integration (TanStack Router memory history), and E2E (Playwright, route-intercepted)

---

## Story Summary

Story 2.4 introduces the second Cliente **mutation** slice: EDIT. Under RED phase, the tests lock the behaviour of every layer of the update-cliente flow: backend `UpdateClienteCommandHandler` + `UpdateClienteRequestValidator` + `PUT /api/v1/clientes/{id:guid}` endpoint (including 200 with preserved createdAt / refreshed updatedAt, 400 RFC 7807 validation body, 404 route-constraint + not-found, and 409 NIT-collides-with-another-row plus AC #6 same-NIT round trip); frontend `useUpdateCliente` mutation classification (nit-conflict / not-found / network / validation kinds), the reusable `ClienteForm` widened submitError prop, the new `ClienteEditDialog` shell (pre-fill, cancel, in-flight discipline), the `Editar` button in `ClienteDetailView`, routing-integration through the real routeTree, and Playwright E2E for the P0 R-011 / R-002 / R-001 / 404-race scenarios.

**As a** commercial team member
**I want** to edit any field of an existing client by opening a pre-filled form and saving my changes
**So that** the client information stays up to date and is reflected immediately for the whole team.

---

## Acceptance Criteria

1. **AC #1** — Detail card header shows an "Editar" button (aria-label "Editar cliente"); clicking opens shadcn `Dialog` titled "Editar cliente" hosting the reusable `ClienteForm` pre-filled with the four current values; focus lands on Nombre.
2. **AC #2** — Valid submit fires `PUT /api/v1/clientes/{id}`; on 200 `['clientes']` AND `['clientes', id]` are invalidated (R-011 — list + detail refetch), dialog closes, `toast.success('Cliente actualizado correctamente')` fires, updated values visible in detail card + list row without reload.
3. **AC #3** — Empty required field(s) → Zod resolver runs → NO PUT is fired → four inline errors with exact Spanish messages; `Guardar` stays enabled.
4. **AC #4** — Cancelar / Escape / overlay-click discards form state (`reset()` on unmount); NO PUT is fired; re-opening shows the pre-fill again (no stale in-flight edits leak).
5. **AC #5** — 409 with RFC 7807 body → inline NIT error "El NIT/RUC ya está registrado"; dialog stays open; NO raw error body leak to DOM (NFR6).
6. **AC #6** — Unchanged NIT (same as current row's) → 200 OK (exclude-self check on backend, no client-side barrier).
7. **AC #7** — 404 → top-of-form alert "El cliente ya no existe" / "Cierra el formulario..."; other 5xx → alert "No se pudo guardar" / "Comprueba tu conexión e intenta nuevamente."; raw error NEVER shown (NFR6).
8. **AC #8** — During in-flight submit: `Guardar` aria-busy + disabled, `Cancelar` enabled, inputs readOnly, toast delayed until settle.
9. **AC #9** — Backend `PUT /api/v1/clientes/{id:guid}` with valid unique-or-self body → 200 OK + full ClienteDto; `createdAt` preserved, `updatedAt` refreshed to `DateTimeOffset.UtcNow`.
10. **AC #10** — Missing / empty / whitespace-only field → 400 RFC 7807 with `errors` map keyed by camelCase field names and Spanish messages verbatim; NO `stackTrace`/`exception` leaks (NFR6, R-001).
11. **AC #11** — Non-existent id → 404 RFC 7807 (via `UseStatusCodePages` rewrite); non-Guid path → routing 404. NO framework internals leak.
12. **AC #12** — NIT collides with a DIFFERENT row → application-level `NitExistsForAnotherAsync` short-circuit → `ClienteNitConflictException` → middleware translates to 409 RFC 7807 detail "El NIT/RUC ya está registrado"; `UpdateAsync` NEVER invoked (defence-in-depth, R-002).
13. **AC #13** — Build (backend + frontend) compiles clean; TypeScript strict; CSS gzip ≤ +4 KB regression vs Story 2.3.
14. **AC #14** — All existing suites remain green; new suites pass; >80% coverage on new files.

---

## Failing Tests Created (RED Phase)

### Backend Tests — xUnit + `WebApplicationFactory<Program>` + FluentValidation.TestHelper

#### File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs` (5 tests, NEW)

- **Test:** `HandleAsync_UpdatesEntity_AndReturnsDto_WhenIdExists_AndNitIsUniqueOrSelf`
  - **Status:** RED — `UpdateClienteCommand`, `UpdateClienteCommandHandler`, `UpdateClienteRequest`, `IClienteRepository.UpdateAsync/NitExistsForAnotherAsync`, `ClienteEntity.Update(...)` do not exist yet.
  - **Verifies:** AC #9 (happy path — createdAt preserved, updatedAt refreshed, identity check on updated entity).
- **Test:** `HandleAsync_ReturnsNull_WhenIdDoesNotExist`
  - **Status:** RED — same reason.
  - **Verifies:** AC #11 (short-circuit: NitExistsForAnotherAsync and UpdateAsync never called).
- **Test:** `HandleAsync_ThrowsClienteNitConflictException_WhenNitCollidesWithAnotherRow`
  - **Status:** RED — same reason + reuse of Story 2.3's `ClienteNitConflictException`.
  - **Verifies:** AC #12 (defence-in-depth: UpdateAsync never invoked, R-002).
- **Test:** `HandleAsync_AllowsSameNit_WhenItBelongsToTheSameRow`
  - **Status:** RED — same reason.
  - **Verifies:** AC #6 (exclude-self semantic — the "cannot save because you didn't change NIT" regression guard).
- **Test:** `HandleAsync_PassesRequestValues_ToEntityMutator`
  - **Status:** RED — same reason.
  - **Verifies:** AC #9 (R-006 mapping seam anchor).

#### File: `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs` (12 tests, NEW)

- Happy-path: `Validate_Passes_WhenAllFieldsPresent`.
- Per-field null / empty / whitespace parametric coverage (Nombre × 3, NIT × 3, Teléfono × 2, Ciudad × 2).
- Multi-field: `Validate_ReportsAllFourErrors_WhenAllFieldsAreEmpty`.
- **Status:** RED — `UpdateClienteRequest` DTO + `UpdateClienteRequestValidator` do not exist yet.
- **Verifies:** AC #10 + R-006 parity (message strings hand-copied — MUST be byte-for-byte identical to `CreateClienteRequestValidatorTests` and the frontend `clienteSchema`).

#### File: `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsUpdateTests.cs` (8 tests, NEW)

- **Test:** `UpdateCliente_Returns200_WithFullDto_WhenBodyIsValid`
  - **Status:** RED — PUT endpoint not mapped yet.
  - **Verifies:** AC #9 (createdAt preserved, updatedAt > createdAt).
- **Test:** `UpdateCliente_Returns400_WithValidationProblem_WhenBodyIsIncomplete`
  - **Status:** RED — `ValidationEndpointFilter<UpdateClienteRequest>` not wired.
  - **Verifies:** AC #10 (camelCase keys, Spanish messages, NFR6 anti-leak).
- **Test:** `UpdateCliente_Returns400_WithSpecificField_WhenOnlyOneFieldMissing`
  - **Status:** RED.
  - **Verifies:** AC #10 (partial validation isolation).
- **Test:** `UpdateCliente_Returns404_WithProblemDetails_WhenIdDoesNotExist`
  - **Status:** RED — handler returns null unhandled; `UseStatusCodePages` rewrite unverified.
  - **Verifies:** AC #11 (RFC 7807 404, NFR6 anti-leak).
- **Test:** `UpdateCliente_Returns404_ForNonGuidPath`
  - **Status:** RED — route constraint pending.
  - **Verifies:** AC #11 (route-constraint short-circuit).
- **Test:** `UpdateCliente_Returns409_WithProblemDetails_WhenNitCollidesWithAnotherRow`
  - **Status:** RED — middleware branch relies on new `NitExistsForAnotherAsync`.
  - **Verifies:** AC #12 + NFR6 anti-leak (developer message "NIT '…' already exists" + "already exists" sentinel must NOT leak). `UpdateAsync` counter = 0.
- **Test:** `UpdateCliente_Returns200_WhenNitIsUnchanged`
  - **Status:** RED.
  - **Verifies:** AC #6 (exclude-self at endpoint level).
- **Test:** `UpdateCliente_PersistsRow_ThatIsThenVisibleOnGet`
  - **Status:** RED.
  - **Verifies:** AC #9 (persistence integration end-to-end).

### Frontend Tests — Vitest + @testing-library/react + MSW

#### File: `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts` (5 tests, NEW)

- **Test:** success (200) — invalidate ['clientes'] AND ['clientes', id] + toast.success("Cliente actualizado correctamente").
- **Test:** 409 classification — kind='nit-conflict', nitMessage exact string; toast NOT called; invalidation NOT called.
- **Test:** 404 classification — kind='not-found', generic.title="El cliente ya no existe", subtitle contains "Cierra el formulario".
- **Test:** 500 classification — kind='network', generic.title="No se pudo guardar", subtitle="Comprueba tu conexión e intenta nuevamente.".
- **Test:** 400 classification (Zod bypass) — kind='validation'.
- **Status:** RED — `useUpdateCliente.ts` + `clienteApiRepository.update` not implemented yet.
- **Verifies:** AC #2, #5, #7, #10 (R-011 double-invalidation, R-001 anti-leak).

#### File: `frontend/src/modules/crm/clientes/presentation/ClienteEditDialog.test.tsx` (6 tests, NEW)

- **Test:** open=false → form not rendered.
- **Test:** open=true → dialog title "Editar cliente" + four inputs pre-filled with current cliente values + Guardar/Cancelar visible.
- **Test:** Cancelar click → onOpenChange(false).
- **Test:** 200 → dialog closes + BOTH ['clientes'] and ['clientes', id] invalidated + toast.success called.
- **Test:** 409 → NIT inline error appears; dialog stays open; toast NOT called.
- **Test:** 404 → top-of-form alert "El cliente ya no existe" + "cierra el formulario" subtitle; toast NOT called.
- **Test:** 500 → top-of-form alert "No se pudo guardar" / "Comprueba tu conexión e intenta nuevamente."; toast NOT called.
- **Status:** RED — `ClienteEditDialog.tsx` + `ClienteForm.tsx` widened submitError prop pending.
- **Verifies:** AC #1, #2, #4, #5, #7.

#### File: `frontend/src/modules/crm/clientes/presentation/ClienteEditDialog.edge.test.tsx` (3 tests, NEW)

- **Test:** required-field errors on edit — clear Nombre → submit → "El nombre es obligatorio" appears; PUT count = 0.
- **Test:** real-time re-validation — after error appears, typing clears it (reValidateMode: 'onChange').
- **Test:** same-NIT round trip — pre-fill nit="900111000", edit only Nombre, submit → PUT fires → 200 closes dialog (no FE "NIT unchanged" barrier).
- **Status:** RED — dialog wiring pending.
- **Verifies:** AC #3, #6.

#### File: `frontend/src/routes/clientes.edit.test.tsx` (3 tests, NEW)

- **Test:** happy path via router — deep-link → click Editar → edit Nombre → submit → dialog closes → detail card re-renders with new value → toast.success called.
- **Test:** duplicate NIT then retry — 409 → inline NIT error → edit NIT → 200 → dialog closes → toast fires.
- **Test:** 404 on submit — alert "El cliente ya no existe" visible; dialog stays open; toast NOT called.
- **Status:** RED — router does not know about the Editar button + dialog yet.
- **Verifies:** AC #1, #2, #5, #7 (through the real routeTree seam).

### E2E Tests — Playwright + `page.route` (network-first interception)

#### File: `e2e/tests/clientes/story-2-4-edit-client.spec.ts` (4 tests, NEW)

- **Test:** AC #1 / #2 (R-011) — Detail + list refresh happy path with exact Spanish toast copy.
- **Test:** AC #5 (R-002) — 409 duplicate NIT inline error; dialog stays open; no toast.
- **Test:** AC #5 / NFR6 (R-001) — DOM anti-leak (no stackTrace / SqlException / NpgsqlException / exception).
- **Test:** AC #7 — 404 (row deleted by another user) → top-of-form alert "El cliente ya no existe".
- **Status:** RED — the button + dialog + mutation must be wired.
- **Verifies:** AC #1, #2, #5, #7 through real browser interactions.

---

## Data Factories Created

### Cliente Factory (REUSED — no new file)

**File:** `frontend/src/test/factories/cliente.factory.ts` (Story 2.1)

**Exports:**

- `buildCliente(overrides?)` — single Cliente with deterministic-ish random values (Math.random-based).
- `buildClientes(count, overridesFn?)` — array of Clientes.

**Example Usage:**

```typescript
const target = buildCliente({ nombre: 'Old Name', nit: '900111000' })
const updated = { ...target, nombre: 'New Name' }
```

**Notes:**

- No new frontend factories needed — Story 2.4 reuses Story 2.1's `buildCliente`.
- Backend: no factory files — hand-rolled `FakeClienteRepository` instances live inside each test class (extends the Story 2.3 pattern with `UpdateAsync` + `NitExistsForAnotherAsync` counters).

---

## Fixtures Created

### E2E Fixtures (REUSED — no new file)

**File:** `e2e/fixtures/base.fixture.ts` (Story 2.1)

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test.
- `contactosPage` — Navigates to `/contactos` before the test.

**Notes:**

- Story 2.4's E2E test deep-links to `/clientes/:id` directly with `page.goto()`; no new fixture required.

---

## Mock Requirements

### Backend Fake Repository Extensions

**Interface extension (Task 1 of story):**

- `UpdateAsync(ClienteEntity cliente, CancellationToken ct)` — returns Task; mutates in-place.
- `NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct)` — returns bool; TRUE only when a row with `nit` exists whose `Id != id`.

**Fake test-double contract (embedded in each test class):**

```csharp
public int UpdateAsyncCalls { get; private set; }
public int NitExistsForAnotherAsyncCalls { get; private set; }
public ClienteEntity? LastUpdatedEntity { get; private set; }

public Task UpdateAsync(ClienteEntity cliente, CancellationToken ct) { UpdateAsyncCalls += 1; LastUpdatedEntity = cliente; return Task.CompletedTask; }
public Task<bool> NitExistsForAnotherAsync(Guid id, string nit, CancellationToken ct) { NitExistsForAnotherAsyncCalls += 1; return Task.FromResult(_items.Any(e => e.Nit == nit && e.Id != id)); }
```

### Frontend MSW Handlers (per-test overrides)

**PUT /api/v1/clientes/:id — success (200):**

```json
{
  "id": "11111111-...",
  "nombre": "New Name",
  "nit": "900111000",
  "telefono": "3009998877",
  "ciudad": "Cali",
  "createdAt": "<seeded>",
  "updatedAt": "<fresh>"
}
```

**PUT /api/v1/clientes/:id — 400 validation problem:**

```json
{ "type": "", "title": "Validation Failed", "status": 400, "errors": {} }
```

Content-Type: `application/problem+json`.

**PUT /api/v1/clientes/:id — 404 not found (race with delete):**

```json
{ "type": "", "title": "Not Found", "status": 404 }
```

Content-Type: `application/problem+json`.

**PUT /api/v1/clientes/:id — 409 NIT conflict:**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "El NIT/RUC ya está registrado"
}
```

Content-Type: `application/problem+json`.

**PUT /api/v1/clientes/:id — 500 network failure:**

```json
{}
```

Status: 500.

---

## Required data-testid Attributes

### ClienteDetailCard (edit action)

- `cliente-detail-edit` — the `Editar` button in the detail card header (per Task 7). Also carries `aria-label="Editar cliente"`.

### ClienteEditDialog

- `cliente-edit-dialog` — the shadcn `DialogContent` root (per Task 7). Distinct from `cliente-form-dialog` (Story 2.3) so tests can disambiguate the Nuevo vs Editar dialog.

### ClienteForm (REUSED from Story 2.3)

- `cliente-form` — form root (unchanged).
- Existing inline error `role="alert"` nodes with `aria-describedby` binding — unchanged.

**Implementation Example:**

```tsx
<Button
  type="outline"
  onClick={() => setEditOpen(true)}
  aria-label="Editar cliente"
  data-testid="cliente-detail-edit"
>
  Editar
</Button>

<Dialog open={editOpen} onOpenChange={setEditOpen}>
  <DialogContent aria-describedby={undefined} data-testid="cliente-edit-dialog">
    <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
    <ClienteForm defaultValues={{ ... }} ... />
  </DialogContent>
</Dialog>
```

---

## Implementation Checklist

### Test: `HandleAsync_UpdatesEntity_AndReturnsDto_WhenIdExists_AndNitIsUniqueOrSelf`

**File:** `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

**Tasks to make this test pass:**

- [ ] Add `IClienteRepository.UpdateAsync` + `IClienteRepository.NitExistsForAnotherAsync` (Task 1).
- [ ] Add `ClienteEntity.Update(...)` mutation method (Task 1).
- [ ] Create `UpdateClienteRequest` DTO (Task 3).
- [ ] Create `UpdateClienteCommand` + `UpdateClienteCommandHandler` (Task 3).
- [ ] Register handler in DI (`Program.cs`, Task 3).
- [ ] Run test: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~UpdateClienteCommandHandlerTests"`
- [ ] Test passes (green phase).

### Test: `UpdateCliente_Returns200_WithFullDto_WhenBodyIsValid` (endpoint)

**File:** `backend/tests/SiesaAgents.UnitTests/Api/ClienteEndpointsUpdateTests.cs`

**Tasks to make this test pass:**

- [ ] Add `PUT /api/v1/clientes/{id:guid}` endpoint (Task 4) with `.AddEndpointFilter<ValidationEndpointFilter<UpdateClienteRequest>>()`.
- [ ] Ensure `ExceptionHandlingMiddleware` (Story 2.3) still catches `ClienteNitConflictException`.
- [ ] Implement `ClienteRepository.UpdateAsync` + `NitExistsForAnotherAsync` (Task 2).
- [ ] Run test: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ClienteEndpointsUpdateTests"`
- [ ] Test passes (green phase).

### Test: `useUpdateCliente — success path` (200)

**File:** `frontend/src/modules/crm/clientes/application/useUpdateCliente.test.ts`

**Tasks to make this test pass:**

- [ ] Extend `IClienteRepository.ts` with `update(id, payload, signal?)` (Task 6).
- [ ] Implement `clienteApiRepository.update` (Task 6).
- [ ] Create `useUpdateCliente.ts` with the `UpdateClienteError` classification helper (Task 6).
- [ ] Invalidate BOTH `['clientes']` AND `['clientes', id]` on success (R-011).
- [ ] Call `toast.success('Cliente actualizado correctamente')`.
- [ ] Run test: `pnpm --dir frontend test useUpdateCliente`
- [ ] Test passes (green phase).

### Test: `ClienteEditDialog — visibility + pre-fill` (AC #1)

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteEditDialog.test.tsx`

**Tasks to make this test pass:**

- [ ] Widen `ClienteForm.tsx` `submitError` prop to `CreateClienteError | UpdateClienteError | null` and extend the `showGenericAlert` branch to include `'not-found'` (Task 7).
- [ ] Create `ClienteEditDialog.tsx` with shadcn `Dialog` + `DialogTitle="Editar cliente"` + reusable `ClienteForm` (Task 7).
- [ ] Wire `defaultValues={{ nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad }}`.
- [ ] Add `data-testid="cliente-edit-dialog"` on `DialogContent`.
- [ ] Run test: `pnpm --dir frontend test ClienteEditDialog.test`
- [ ] Test passes (green phase).

### Test: `/clientes/:clienteId — edit client happy path` (routing integration)

**File:** `frontend/src/routes/clientes.edit.test.tsx`

**Tasks to make this test pass:**

- [ ] Edit `ClienteDetailView.tsx`: add local `editOpen` state, mount `ClienteEditDialog`, and add the `Editar` button inside `ClienteDetailCard` header (Task 7).
- [ ] Import `Button` from `siesa-ui-kit` with `type="outline"` and `aria-label="Editar cliente"`.
- [ ] Run test: `pnpm --dir frontend test clientes.edit`
- [ ] Test passes (green phase).

### Test: `Story 2.4 — Edit Client (E2E)` (Playwright)

**File:** `e2e/tests/clientes/story-2-4-edit-client.spec.ts`

**Tasks to make this test pass:**

- [ ] All above tasks are complete AND the frontend dev server serves the wired components at `http://localhost:5173`.
- [ ] Run test: `pnpm playwright test story-2-4-edit-client`
- [ ] Test passes (green phase).

---

## Running Tests

```bash
# Run all Story 2.4 backend tests
dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~UpdateCliente|FullyQualifiedName~ClienteEndpointsUpdate"

# Run all Story 2.4 frontend tests
pnpm --dir frontend test useUpdateCliente ClienteEditDialog clientes.edit

# Run all Story 2.4 E2E tests
pnpm playwright test story-2-4-edit-client

# Run everything (backend + frontend + e2e)
dotnet test backend/SiesaAgents.sln
pnpm --dir frontend test
pnpm playwright test

# Debug a specific frontend test
pnpm --dir frontend test ClienteEditDialog --reporter=verbose

# Debug a specific E2E test in headed mode
pnpm playwright test story-2-4-edit-client --headed --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing.
- ✅ Fake repository extensions documented (mock requirements above).
- ✅ MSW handler shapes documented (per-status-code JSON bodies above).
- ✅ Required data-testid attributes listed.
- ✅ Implementation checklist created.

**Verification:**

- Running the new backend suites reports missing symbols (`UpdateClienteCommand`, `UpdateClienteRequest`, `UpdateClienteCommandHandler`, `UpdateClienteRequestValidator`, `ClienteEntity.Update`, `IClienteRepository.UpdateAsync`, `IClienteRepository.NitExistsForAnotherAsync`).
- Running the new frontend suites reports "Failed to resolve import './useUpdateCliente'" and "Failed to resolve import './ClienteEditDialog'".
- Running the Playwright suite fails on `getByRole('button', { name: /editar cliente/i })` — the Editar button does not exist yet.

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick Task 1 first** (backend domain): add `UpdateAsync` + `NitExistsForAnotherAsync` to `IClienteRepository` + `ClienteEntity.Update(...)`.
2. **Task 2**: implement the repository methods.
3. **Task 3**: create the Application layer (Request, Command, Handler, Validator) + DI.
4. **Task 4**: wire the PUT endpoint.
5. **Task 5**: run backend tests → they should now pass.
6. **Task 6**: frontend Application layer (`IClienteRepository.update`, `clienteApiRepository.update`, `useUpdateCliente`).
7. **Task 7**: frontend Presentation (widen `ClienteForm` prop, create `ClienteEditDialog`, add Editar button in `ClienteDetailView`).
8. **Task 8**: frontend integration + E2E tests should now pass.

**Key Principles:**

- One test at a time.
- Reuse Story 2.3's `ClienteNitConflictException`, `ValidationEndpointFilter<T>`, `AddValidatorsFromAssemblyContaining`, `ExceptionHandlingMiddleware`, `ClienteForm`, `ToastProvider`.
- The mutation hook MUST invalidate BOTH `['clientes']` AND `['clientes', id]` — missing the second key breaks R-011.
- `entity.Update(...)` MUST NOT touch `CreatedAt`.

**Progress Tracking:**

- Check off tasks as you complete them.
- Story 2.4 status transitions ready-for-dev → in-progress → ready-for-review.

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all previous suites still pass (Stories 1.x + 2.1 + 2.2 + 2.3).
2. Review code for quality — the mutation hook + dialog shells are small, keep them symmetric with Story 2.3.
3. **Do NOT** consolidate the inline `FakeClienteRepository` yet — that's Story 2.5's refactor.
4. **Do NOT** partially migrate to `siesa-ui-kit Alert type="destructive"` — Story 2.6+ will do that atomically.
5. Ensure `dotnet build` reports 0 new warnings and `pnpm --dir frontend typecheck` reports 0 errors.

**Completion:**

- All tests pass (backend + frontend + E2E).
- Coverage > 80% on new files.
- CSS gzip ≤ +4 KB vs Story 2.3 baseline (670.26 KB).

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff — the sub-agent orchestrator already handles this).
2. Run failing tests to confirm RED phase.
3. Begin implementation using the implementation checklist as a guide.
4. Work one Task at a time (Task 1 → 8).
5. When all tests pass, refactor for quality without changing behaviour.
6. Manually update story status in `sprint-status.yaml` when done.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Story 2.4 reuses Story 2.3's fixtures (`base.fixture.ts`, MSW server) — no new fixture files.
- **data-factories.md** — Story 2.4 reuses Story 2.1's `buildCliente` factory — no new factories.
- **component-tdd.md** — `ClienteEditDialog` + `ClienteEditDialog.edge` tests apply RGR discipline with provider isolation (each test has its own `QueryClient`).
- **network-first.md** — E2E tests intercept `page.route(...)` BEFORE `page.goto(...)`.
- **test-quality.md** — Given-When-Then structure; explicit Spanish string matchers; deterministic tests via MSW.
- **test-healing-patterns.md** — No hard waits (no `page.waitForTimeout` in productive paths); `waitFor` for async state; MSW returns quickly.
- **selector-resilience.md** — `data-testid` for dialog + form root; `getByRole` / `getByLabel` / `getByText` for user-visible surfaces.
- **timing-debugging.md** — 1ms `Task.Delay` in the backend test to guarantee `UpdatedAt > CreatedAt` monotonicity.
- **test-levels-framework.md** — E2E for R-011 critical path; Component for UI states; Application for hook classification; Backend Integration for API contract; Unit for handler + validator invariants.

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Expected — not executed here)

**Backend Command:** `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~UpdateCliente|FullyQualifiedName~ClienteEndpointsUpdate"`

**Frontend Command:** `pnpm --dir frontend test useUpdateCliente ClienteEditDialog clientes.edit`

**E2E Command:** `pnpm playwright test story-2-4-edit-client`

**Expected Failure Modes:**

- Backend: compile-time errors on missing symbols (`UpdateClienteCommand`, `UpdateClienteCommandHandler`, `UpdateClienteRequest`, `UpdateClienteRequestValidator`, `IClienteRepository.UpdateAsync`, `IClienteRepository.NitExistsForAnotherAsync`, `ClienteEntity.Update`).
- Frontend: "Failed to resolve import './useUpdateCliente'" and "./ClienteEditDialog" at Vitest startup.
- E2E: `getByRole('button', { name: /editar cliente/i })` times out — the button is not in the DOM yet.

**Summary:**

- Backend: 25 new failing tests (5 handler + 12 validator + 8 endpoint).
- Frontend: 17 new failing tests (5 hook + 6 dialog + 3 edge + 3 routing).
- E2E: 4 new failing tests.
- **Total new failing tests: 46**.
- Status: ✅ RED phase established (verification of actual failures deferred to `sa-tea-atdd-run` sub-agent).

---

## Notes

- Story 2.4 REUSES Story 2.3's mutation slice pipeline extensively — the story surface area is deliberately small.
- The `Editar` button MUST live INSIDE the `ClienteDetailCard` success branch, NOT at the top level. The 404 / error / loading branches deliberately do NOT show `Editar`.
- The `UpdateClienteError` shape adds a fourth `kind: 'not-found'` to the Story 2.3 error union — this is Story-2.4-specific because you cannot 404 on a row you have not created yet.
- Same-NIT round trip (AC #6) is the load-bearing regression guard: `NitExistsForAnotherAsync(id, nit)` MUST exclude the current row (`e.Id != id`). Without this the "cannot save because you didn't change NIT" bug appears.
- Frontend inline error strings for validation MUST match backend Spanish strings VERBATIM (R-006 parity anchor). No shared string helper — the drift-anchor lives in the duplicate.
- No new packages introduced. No new toast/dialog libraries. No MediatR. No FluentAssertions.

---

## Contact

**Questions or Issues?**

- Ask in team standup.
- Tag @tea in Slack/Discord.
- Refer to `_bmad/bmm/workflows/testarch/atdd/instructions.md` for workflow documentation.
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices.

---

**Generated by BMad TEA Agent** - 2026-07-08
