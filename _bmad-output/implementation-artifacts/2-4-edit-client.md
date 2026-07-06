# Story 2.4: Edit Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to edit any field of an existing client,
so that the client information stays up to date.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail (`ClienteDetailView`, `data-testid="cliente-detail-panel"`), **When** the user clicks "Editar" (`role="button"`, name `/editar/i`), **Then** the same `ClienteForm` dialog used for creation opens in edit mode, titled "Editar cliente", pre-filled with the client's current Nombre, NIT/RUC, Teléfono and Ciudad values (FR6) — each field accessible via `page.getByLabel(/nombre|nit|teléfono|ciudad/i)`, matching Story 2.3's established locator convention.

2. **Given** the edit dialog is open and the user modifies one or more fields with valid data, **When** the user clicks "Guardar", **Then** `PUT /api/v1/clientes/{id}` is called with the full current form values, the client detail (`ClienteDetailView`) and the client list (`ClienteListView`) both reflect the change immediately with no page reload (FR27 — via `queryClient.invalidateQueries({ queryKey: ['clientes'] })` **and** `queryClient.invalidateQueries({ queryKey: ['clientes', id] })`, since the detail panel reads from the latter key), a success toast shows the exact Spanish copy **"Cliente actualizado correctamente"**, and the dialog closes.

3. **Given** the edit dialog is open, **When** the user clears a required field (e.g. Nombre) and clicks "Guardar", **Then** a clear inline error message appears next to the empty field (via siesa-ui-kit `Input`'s `error`/`errorMessage` props, rendered text matching `/requerido/i`) (FR8), **no** `PUT` request is ever sent (client-side Zod validation blocks submission, reusing the existing `clienteSchema`), and the dialog remains open.

4. **Given** the edit dialog is open and the user has modified one or more fields, **When** the user clicks "Cancelar" (or closes the dialog via Escape/overlay) without clicking "Guardar", **Then** no `PUT` request is ever sent, the dialog closes, and the client's original data — both in the backend and as displayed in the detail/list — remains completely unchanged.

## Tasks / Subtasks

- [x] Task 1 — Backend: `ClienteEntity.Update()` domain method (AC: #2, #3)
  - [x] In `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`, add an instance method `public void Update(string nombre, string nit, string telefono, string ciudad)` that applies the **identical** defense-in-depth `ArgumentException` guards `Create` already uses (`string.IsNullOrWhiteSpace` on all four fields), then sets `Nombre`, `Nit`, `Telefono`, `Ciudad` from the arguments and `UpdatedAt = DateTimeOffset.UtcNow` — `Id` and `CreatedAt` are never touched by `Update` (immutable after creation). Update the class's XML doc comment (currently says "Story 2.1 scope: only the properties needed to list clients... full FluentValidation/Zod validation belongs to Story 2.3") to also mention `Update` covers Story 2.4's edit path with the same validation guard as `Create`.

- [x] Task 2 — Backend: `UpdateCliente` command + handler + `PUT /api/v1/clientes/{id}` endpoint (AC: #2, #3)
  - [x] Extend `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`: add `Task<bool> UpdateAsync(ClienteEntity cliente, CancellationToken cancellationToken)` — same `true`/`false` contract as `AddAsync` (`false` only on a `uk_clientes_nit` unique-index violation, e.g. the user edits the NIT to a value another client already has; `true` otherwise). Update the interface's XML doc comment (currently ends "UpdateAsync/DeleteAsync are still out of scope — Stories 2.4-2.5 extend this interface further") to reflect that `UpdateAsync` now exists and only `DeleteAsync` (Story 2.5) remains.
  - [x] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: `dbContext.Clientes.Update(cliente); try { await dbContext.SaveChangesAsync(cancellationToken); return true; } catch (DbUpdateException ex) when (IsUniqueNitViolation(ex)) { dbContext.Entry(cliente).State = EntityState.Detached; return false; }` — reuses the existing private `IsUniqueNitViolation` helper verbatim (no new package/using needed). `DbSet.Update()` correctly attaches an untracked entity instance (the one returned by `GetByIdAsync`'s `AsNoTracking()` query, then mutated via `ClienteEntity.Update()`) and marks it `Modified` without requiring it to already be tracked.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`: `public sealed record UpdateClienteRequest(string Nombre, string Nit, string Telefono, string Ciudad);` — the `Id` comes from the route (`{id:guid}`), not the body, matching the existing `GET /api/v1/clientes/{id:guid}` convention.
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`: `public class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>` with `RuleFor(x => x.Nombre).NotEmpty().MaximumLength(200)`, `Nit` → `MaximumLength(50)`, `Telefono` → `MaximumLength(30)`, `Ciudad` → `MaximumLength(100)` — mirror `CreateClienteRequestValidator`'s **final** (post-code-review) state exactly, including the `MaximumLength` rules from the start (Story 2.3 only added these in its code-review round after `testarch-automate` found the gap; Story 2.4 must not repeat that gap).
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`: `public sealed record UpdateClienteCommand(Guid Id, string Nombre, string Nit, string Telefono, string Ciudad);`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteResult.cs`: `public sealed record UpdateClienteResult(ClienteDto? Cliente, bool IsConflict, bool IsNotFound) { public static UpdateClienteResult Success(ClienteDto cliente) => new(cliente, false, false); public static UpdateClienteResult Conflict() => new(null, true, false); public static UpdateClienteResult NotFound() => new(null, false, true); }` — same "expected outcome is a return value, not an exception" pattern `CreateClienteResult` established; `IsNotFound` is new because, unlike create, an update targets an `Id` that might no longer exist (e.g. deleted by another user between the detail-view load and the save).
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`: `public class UpdateClienteCommandHandler(IClienteRepository clienteRepository)` with `Task<UpdateClienteResult> Handle(UpdateClienteCommand command, CancellationToken cancellationToken)` — calls `clienteRepository.GetByIdAsync(command.Id, cancellationToken)`; if `null`, return `UpdateClienteResult.NotFound()`; otherwise call `existing.Update(command.Nombre, command.Nit, command.Telefono, command.Ciudad)`, then `clienteRepository.UpdateAsync(existing, cancellationToken)`; if that returns `false`, return `UpdateClienteResult.Conflict()`; otherwise map `existing` (now mutated in place, `CreatedAt` untouched) to a `ClienteDto` and return `UpdateClienteResult.Success(dto)`.
  - [x] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add to the existing `group`: `group.MapPut("/{id:guid}", async (Guid id, UpdateClienteRequest request, IValidator<UpdateClienteRequest> validator, UpdateClienteCommandHandler handler, CancellationToken cancellationToken) => { var validation = await validator.ValidateAsync(request, cancellationToken); if (!validation.IsValid) return Results.ValidationProblem(validation.ToDictionary()); var result = await handler.Handle(new UpdateClienteCommand(id, request.Nombre, request.Nit, request.Telefono, request.Ciudad), cancellationToken); if (result.IsNotFound) return Results.NotFound(); if (result.IsConflict) return Results.Conflict(new ProblemDetails { Status = StatusCodes.Status409Conflict, Title = "Conflict", Detail = "El NIT/RUC ya está registrado." }); return Results.Ok(result.Cliente); });` — `200 OK` + updated object matches `architecture.md`'s documented `PUT → 200 OK + updated object` format pattern.
  - [x] Register in `backend/src/SiesaAgents.API/Program.cs`: `builder.Services.AddScoped<IValidator<UpdateClienteRequest>, UpdateClienteRequestValidator>();` and `builder.Services.AddScoped<UpdateClienteCommandHandler>();` next to the existing `CreateClienteRequestValidator`/`CreateClienteCommandHandler` registrations; add the corresponding `using` for `UpdateClienteRequest`'s validator namespace (already covered by the existing `using SiesaAgents.Application.Clientes.Commands;`/`.Validators;` if those namespaces are reused, otherwise add explicitly).

- [x] Task 3 — Backend tests: extract shared test fixture, then add `UpdateCliente` coverage (AC: #2, #3)
  - [x] **Pay down the review debt flagged in Story 2.3 (`review-2-3-create-client.md`/`2-3-create-client.md`'s Review Follow-ups, Medium item):** `ClienteEndpointsTests.cs` (584 lines) and `ClienteEndpointsEdgeCasesTests.cs` (508 lines) each independently define identical private helpers (`UniqueNit()`, `SeedClientesAsync`, `DeleteClientesAsync`, `DeleteClienteByNitAsync`, `ClearClientesTableAsync`, `GetClientesAsync`, and the `ClienteApiResponse` record). Before adding this story's new tests, extract all of these into a new shared `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTestBase.cs` (`public abstract class ClienteEndpointsTestBase : IClassFixture<TestWebApplicationFactory>` exposing `protected HttpClient Client` from the fixture plus `protected` versions of all six helpers), and have both `ClienteEndpointsTests : ClienteEndpointsTestBase` and `ClienteEndpointsEdgeCasesTests : ClienteEndpointsTestBase` inherit from it instead of redeclaring the duplicated members. This is a pure refactor (no assertion/behavior changes) — run the full existing suite after to confirm zero regressions before adding new tests on top.
  - [x] Add `UpdateClienteRequestValidatorTests.cs` to `backend/tests/SiesaAgents.UnitTests/Application/Clientes/`: mirror `CreateClienteRequestValidatorTests.cs`'s final (post-review) structure exactly — `NotEmpty`/whitespace-only cases and `MaximumLength` boundary cases (200/50/30/100) for all four fields, plus one fully-valid pass case.
  - [x] Add `UpdateClienteCommandHandlerTests.cs` to the same folder (mirror `CreateClienteCommandHandlerTests.cs`'s hand-rolled-fake convention, no mocking framework): `Handle` returns `NotFound` (no `Cliente`, `IsNotFound` true, `IsConflict` false) when `GetByIdAsync` returns `null`; `Handle` returns `Success` with a `ClienteDto` whose fields match the command when `GetByIdAsync` finds the entity and `UpdateAsync` returns `true`; `Handle` returns `Conflict` (no `Cliente`) when `UpdateAsync` returns `false`; `Handle` preserves the original `CreatedAt` (assert the returned DTO's `CreatedAt` equals the pre-existing entity's, not `DateTimeOffset.UtcNow`) since only `Update()` — not `Create()` — runs on this path.
  - [x] Extend the fake `IClienteRepository` implementations in `GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs` and `CreateClienteCommandHandlerTests.cs` (both `FakeClienteRepository` and `RecordingClienteRepository` where present) with a no-op-compatible `UpdateAsync` implementation (`Task.FromResult(true)`), the same mechanical step Story 2.3 performed for `AddAsync` — required to keep them compiling against the now-larger `IClienteRepository` interface.
  - [x] Extend `ClienteEndpointsTests.cs` (now inheriting `ClienteEndpointsTestBase`) with: `UpdateCliente_ReturnsOk_WithValidData` (`200`); `UpdateCliente_ReturnsUpdatedCliente_WithValidData` (response body reflects the new field values, `Id` and `CreatedAt` unchanged from the seeded original); `UpdateCliente_PersistsChanges` (a subsequent `GET /api/v1/clientes/{id}` returns the updated values); `UpdateCliente_ReturnsNotFound_WhenClienteDoesNotExist` (random `Guid`, assert `404`); `UpdateCliente_MissingRequiredFields_Returns400` (empty `Nombre` on an existing client, assert `400` and that the original record is unchanged via a follow-up `GET`); `UpdateCliente_DuplicateNit_Returns409` (seed two clients, `PUT` the second one's NIT to match the first's, assert `409` and that the second client's NIT in the DB is unchanged — mirrors `CreateCliente_DuplicateNit_Returns409`'s no-leak assertion style).

- [x] Task 4 — Frontend data layer: `update` on the client repository + `useUpdateCliente` mutation hook (AC: #2, #3, #4)
  - [x] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: add `update(id: string, data: CreateClienteInput): Promise<Cliente>` — reuses the existing `CreateClienteInput` type as-is (identical four-field shape for both create and update payloads; no new `UpdateClienteInput` type needed, per minimal-complexity).
  - [x] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: `async update(id: string, data: CreateClienteInput): Promise<Cliente> { const response = await apiClient.put<Cliente>(\`/api/v1/clientes/${id}\`, data); return response.data }`. Like `create`, do **not** catch `409`/`404` here — let the `AxiosError` propagate so `ClienteForm` can react distinctly (inline NIT error vs. generic message), same rationale as `create`'s Dev Note.
  - [x] Create `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`: `export function useUpdateCliente() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: CreateClienteInput }) => clienteApiRepository.update(id, data), onSuccess: (_updated, variables) => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); queryClient.invalidateQueries({ queryKey: ['clientes', variables.id] }); toast.success('Cliente actualizado correctamente') } })` — invalidates **both** the list key (`['clientes']`, refreshes `ClienteListView`) and the single-record key (`['clientes', id]`, refreshes the currently-open `ClienteDetailView` via `useCliente`), since AC #2 requires both to update immediately. No `onError` here, same reasoning as `useCreateCliente`.

- [x] Task 5 — Extend `ClienteForm` to support edit mode; wire "Editar" trigger in `ClienteDetailView` (AC: #1, #2, #3, #4)
  - [x] In `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`, add an optional prop `cliente?: Cliente | null` to `ClienteFormProps`. Compute `const isEditMode = !!cliente`. Add `const updateCliente = useUpdateCliente()` alongside the existing `const createCliente = useCreateCliente()`. This single component now serves both "Nuevo cliente" and "Editar cliente" — matching `architecture.md`'s directory-tree comment `ClienteForm.tsx  # React Hook Form + Zod — crear/editar` (already documented, unimplemented until now).
  - [x] Add `useEffect(() => { if (open) reset(cliente ? { nombre: cliente.nombre, nit: cliente.nit, telefono: cliente.telefono, ciudad: cliente.ciudad } : { nombre: '', nit: '', telefono: '', ciudad: '' }) }, [open, cliente, reset])` — re-applies the correct baseline (the client's current values, or blank) every time the dialog transitions to open, satisfying AC #1's "opens pre-filled with current values" and keeping the existing bare `reset()` call in `handleOpenChange` correct for **both** modes (on close/cancel it now reverts to whichever baseline the effect last set, blank for create or the original client values for edit — this is exactly AC #4's "original data remains unchanged" behavior, achieved with zero new logic in `handleOpenChange`).
  - [x] Change `DialogTitle` to `{isEditMode ? 'Editar cliente' : 'Nuevo cliente'}`.
  - [x] Update `onSubmit`: `const onSubmit = handleSubmit(async (values) => { try { if (isEditMode) { await updateCliente.mutateAsync({ id: cliente!.id, data: values }) } else { await createCliente.mutateAsync(values) } onOpenChange(false) } catch (error) { if (isAxiosError(error) && error.response?.status === 409) { setError('nit', { type: 'manual', message: 'El NIT/RUC ya está registrado' }); return } setError('root', { type: 'manual', message: 'No se pudo guardar. Intenta de nuevo.' }) } })` — the 409/generic-failure branching is identical for both modes (a duplicate NIT is exactly as possible on edit as on create, since both go through the same `uk_clientes_nit` constraint); a `404` (client deleted concurrently) falls into the generic `root` branch, which is an acceptable, safe (NFR6) fallback for this rare race.
  - [x] Update the "Guardar" `Button`'s `disabled` prop to `disabled={isEditMode ? updateCliente.isPending : createCliente.isPending}`.
  - [x] In `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`: add `const [isEditOpen, setIsEditOpen] = useState(false)`, an "Editar" siesa-ui-kit `Button` (`htmlType="button"`, `size="sm"`, `onClick={() => setIsEditOpen(true)}`) rendered only in the `isSuccess && data` branch (alongside the existing `<dl>`), and mount `<ClienteForm open={isEditOpen} onOpenChange={setIsEditOpen} cliente={data} />` once, inside that same branch (so `cliente` is always a loaded, non-null `Cliente` when the form can possibly be opened).

- [x] Task 6 — Tests (AC: #1, #2, #3, #4)
  - [x] Create `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx` (Vitest + RTL + MSW, new file rather than growing the already-large `ClienteForm.test.tsx` — same rationale Story 2.3's code-review round used to split out `clienteSchema.test.ts`): renders `ClienteForm` with `open` and a `cliente` fixture (via `createCliente()` from `@/test/factories/cliente.factory`) and asserts all four fields are pre-filled with that client's current values (AC #1); asserts the dialog title reads "Editar cliente"; clearing "Nombre" and clicking "Guardar" shows the inline "requerido" error and asserts the mocked `PUT` handler was never invoked (AC #3); modifying a field and clicking "Guardar" against a mocked `200` response calls `onOpenChange(false)` and shows the toast "Cliente actualizado correctamente" (AC #2); against a mocked `409` response, asserts the exact text "El NIT/RUC ya está registrado" renders and the dialog stays open; clicking "Cancelar" after modifying fields asserts zero `PUT` calls were made and `onOpenChange(false)` is called (AC #4).
  - [x] Extend `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` with a case verifying the "Editar" button renders once the client loads (`getByRole('button', { name: /editar/i })`) and clicking it opens the dialog (`getByRole('dialog')`) with the loaded client's Nombre already visible in the corresponding input.
  - [x] Do not add new E2E specs in this story — per the project's established ATDD convention (Stories 2.1-2.3), `e2e/tests/clientes/clientes-edit.spec.ts` and the `btnEditar` locator addition to `e2e/pages/clientes.page.ts` are authored ahead of implementation by the ATDD phase, covering `test-design-epic-2.md`'s TC-E2-P1-01 (pre-fill + immediate update) and TC-E2-P1-02 (required-field validation blocks save); run them once available to confirm this story's implementation makes them pass.

## Dev Notes

### Architecture patterns and constraints

- **Same `ClienteForm`, not a separate `ClienteEditForm`**: `architecture.md`'s Complete Project Directory Structure already documents `ClienteForm.tsx` as "React Hook Form + Zod — crear/editar" — a single component for both flows was the intended design from the start, not a Story 2.4 deviation. The `cliente` prop's presence/absence is the only branching signal (`isEditMode = !!cliente`), keeping the component's Zod schema, dialog chrome, and 409/error handling fully shared instead of duplicated.
- **Expected outcomes remain return values, not exceptions**: `UpdateClienteResult` follows `CreateClienteResult`'s established pattern (Story 2.3 Dev Notes), adding `IsNotFound` for the one new failure mode an update has that a create doesn't — the target `Id` may no longer exist. The endpoint, not the handler, still owns the HTTP status mapping (404/409/200).
- **NIT uniqueness applies identically on edit**: the `uk_clientes_nit` DB constraint (Story 2.1) is the sole source of truth for both `AddAsync` and the new `UpdateAsync` — no separate `ExistsByNitAsync` pre-check on either path, for the same race-condition reason documented in Story 2.3's Dev Notes. A user editing a client's NIT to collide with another client's NIT gets the identical `409` + inline-field-error UX as creating a duplicate.
- **Query invalidation must cover both the list and the single-record cache**: unlike `useCreateCliente` (which only needs to invalidate `['clientes']`, since a newly created client has no existing single-record cache entry to refresh), `useUpdateCliente` must invalidate **both** `['clientes']` and `['clientes', id]` — `ClienteDetailView`'s `useCliente(clienteId)` hook reads from the latter key, and without invalidating it the detail panel would keep showing stale data until an unrelated refetch happened, violating AC #2/FR27.
- **Cancel-discards-changes requires no new logic**: because `ClienteForm` is always mounted (its `useForm` state persists across `open` toggles, same as the existing create flow), re-establishing the correct baseline via `reset(...)` inside a `useEffect` keyed on `[open, cliente]` is sufficient — the pre-existing bare `reset()` call already wired into `handleOpenChange` (Story 2.3) then correctly reverts to that baseline on Cancel/Escape/overlay-click for both modes, with zero mode-specific cancel handling needed.
- **Test-infrastructure debt must be paid down here, not deferred again**: Story 2.3's `review-2-3-create-client.md` explicitly flagged the duplicated `UniqueNit()`/`SeedClientesAsync`/`DeleteClientesAsync`/`ClienteApiResponse` boilerplate across `ClienteEndpointsTests.cs` and `ClienteEndpointsEdgeCasesTests.cs` as a Medium finding, deferred with the explicit note "schedule as a dedicated refactor task before Story 2.4 (`PUT`) adds another section to the same files." Task 3 extracts a shared `ClienteEndpointsTestBase` before adding any new `UpdateCliente*` tests, so this story does not compound the debt a third time.

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed) — `Input` (label/error/errorMessage) and `Button` (`htmlType="submit"`/`"button"`, distinct from the unrelated visual `type` prop) for the "Editar" trigger and all form controls, exactly as Story 2.3 established.
- **Dialog**: reuse `frontend/src/shared/components/ui/dialog.tsx` (shadcn/Radix) — the same `Dialog` instance type Story 2.3 wired up, now rendered from `ClienteDetailView` as well as `ClienteListView`.
- **Forms**: React Hook Form + Zod, reusing the existing `clienteSchema.ts` verbatim — no new schema needed since edit and create share identical field rules (including the `MaximumLength` rules).
- **Toasts**: `sonner`'s `<Toaster/>` is already mounted globally (`main.tsx`, Story 2.3) — `toast.success('Cliente actualizado correctamente')` from `useUpdateCliente` renders with no additional wiring.
- Do not build a second form/dialog component for editing — extend the existing `ClienteForm`, per the Dev Notes above.

### Project Structure Notes

- New backend files: `SiesaAgents.Application/Clientes/Commands/{UpdateClienteCommand.cs,UpdateClienteCommandHandler.cs,UpdateClienteResult.cs}`, `SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`, `SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs` — exact paths from `architecture.md`'s directory tree, mirroring the `Create*` siblings already present.
- Modified backend files: `SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs` (add `Update`), `SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (add `UpdateAsync`), `SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (implement it), `SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (add `PUT /{id:guid}`), `SiesaAgents.API/Program.cs` (register validator + handler), the three `*HandlerTests.cs` files needing a no-op `UpdateAsync` fake addition.
- New backend test file: `SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTestBase.cs` (extracted shared fixture/helpers — Task 3).
- New frontend files: `modules/crm/clientes/application/useUpdateCliente.ts`, `modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`.
- Modified frontend files: `modules/crm/clientes/domain/IClienteRepository.ts` (add `update`), `modules/crm/clientes/infrastructure/clienteApiRepository.ts` (add `update`), `modules/crm/clientes/presentation/ClienteForm.tsx` (edit-mode support), `modules/crm/clientes/presentation/ClienteDetailView.tsx` (add "Editar" button + `ClienteForm` mount).
- No backend schema/migration changes — the `clientes` table, `uk_clientes_nit` index and `updated_at` column already exist from Story 2.1; this story only adds a new write path over the same row.
- No changes to `ContactoEntity`/contacts code — out of scope (Epic 3).

### Testing Standards Summary

- Frontend: Vitest + React Testing Library + MSW, co-located `*.test.tsx`, same network-first pattern (`server.use(...)` before render/interaction) established in Stories 2.1-2.3.
- Backend: xUnit; new unit tests in `SiesaAgents.UnitTests/{Domain,Application}/Clientes/`; integration tests extending `ClienteEndpointsTests.cs` after it is refactored onto the new shared `ClienteEndpointsTestBase` (Task 3) — do not duplicate the extracted helpers.
- Relevant test-design cases (`test-design-epic-2.md`): TC-E2-P1-01 (pre-fill + immediate update, E2E — new spec), TC-E2-P1-02 (required-field validation blocks save, E2E — new spec), TC-E2-P1-03 (cancel discards changes, component-level — covered by `ClienteForm.edit.test.tsx`).
- All UI copy in Spanish; the 409, 404-fallback and empty-field error messages all render through siesa-ui-kit `Input`'s existing error-state styling/ARIA or the existing `role="alert"` root-error paragraph — no new ARIA wiring needed.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.4: Edit Client]
- Functional requirements: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management] (FR6 — editar cualquier campo, FR8 — validación campos requeridos, FR27 — cambios reflejados inmediatamente)
- Architecture — REST contract, mutation/invalidation pattern, directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] (`PUT /api/v1/clientes/{id}`), [#Format Patterns] (`PUT → 200 OK + updated object`), [#Process Patterns] (mutation invalidation snippet), [#Complete Project Directory Structure] (`ClienteForm.tsx` "crear/editar", `useUpdateCliente.ts`, `UpdateClienteCommand.cs`, `UpdateClienteCommandHandler.cs`, `UpdateClienteRequest.cs`, `UpdateClienteRequestValidator.cs`), [#Traceability] (FR5/FR6 — "Editar cliente" → `ClienteForm.tsx` + `useUpdateCliente.ts` + `UpdateClienteCommandHandler.cs`)
- Epic-level test plan: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P1-01], [#TC-E2-P1-02], [#TC-E2-P1-03]
- Previous story state and established patterns (`ClienteEntity.Create`, `IClienteRepository`/`ClienteRepository` `AddAsync`, `ClienteEndpoints`, `ClienteForm`, `clienteSchema`, `useCreateCliente`, `ClienteDetailView`, `useCliente`): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md#Dev Notes], [#File List], [#Review Follow-ups (AI)] (test-file-size/duplication debt this story pays down); [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Dev Notes]; [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md#Dev Notes]
- Company stack/DB/UI standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (sa-create-story sub-agent for story authoring; sa-dev-story sub-agent for implementation)

### Debug Log References

- `dotnet build` (backend, all 6 projects): 0 errors, 0 warnings.
- `dotnet test tests/SiesaAgents.UnitTests`: 89/89 passed.
- `dotnet test tests/SiesaAgents.IntegrationTests` (PostgreSQL reachable): 72/72 passed. One
  ATDD-authored assertion (`UpdateCliente_ReturnsUpdatedCliente_WithValidData`'s exact
  `CreatedAt` equality) initially failed due to PostgreSQL `timestamptz`'s microsecond
  precision vs .NET's 100ns tick precision — fixed to a <1ms tolerance comparison, consistent
  with the same round-trip caveat already documented on
  `GetClienteById_ReturnsCorrectDto_WhenClienteExists`.
- `npx vitest run` (frontend, full suite): 94/94 passed.
- `npx tsc -b` (frontend): no type errors.
- `npx oxlint src/modules/crm/clientes`: no lint issues.
- `npx playwright test e2e/tests/clientes --project=chromium`: 15/15 passed (5 new
  `clientes-edit.spec.ts` cases + 10 pre-existing `clientes-crud`/`clientes-detalle` cases,
  confirming no regressions).

### Completion Notes List

- Implemented `ClienteEntity.Update()` with the identical defense-in-depth guards as `Create`;
  `Id`/`CreatedAt` are never touched.
- Extended `IClienteRepository`/`ClienteRepository` with `UpdateAsync`, mirroring `AddAsync`'s
  `uk_clientes_nit`-conflict-as-`false` contract.
- Added `UpdateClienteRequest`/`UpdateClienteRequestValidator` (with `MaximumLength` rules from
  the start, per Story 2.3's code-review lesson), `UpdateClienteCommand`/`UpdateClienteResult`
  (with the new `IsNotFound` outcome)/`UpdateClienteCommandHandler`, and the
  `PUT /api/v1/clientes/{id:guid}` endpoint (404/409/200 mapping), registered in `Program.cs`.
- Paid down the Story 2.3 code-review test-infrastructure debt: extracted
  `ClienteEndpointsTestBase` (Client, `UniqueNit()`, `SeedClientesAsync`, `DeleteClientesAsync`,
  `DeleteClienteByNitAsync`, `ClearClientesTableAsync`, `GetClientesAsync`,
  `ClienteApiResponse`) and refactored `ClienteEndpointsTests`/`ClienteEndpointsEdgeCasesTests`
  to inherit from it (pure refactor, zero assertion changes, all pre-existing tests still pass).
- Added the no-op `UpdateAsync` fake implementation to the three existing handler-test files'
  `IClienteRepository` fakes to keep them compiling against the larger interface.
- The ATDD-authored `ClienteEndpointsUpdateTests`, `UpdateClienteCommandHandlerTests` and
  `UpdateClienteRequestValidatorTests` all pass unmodified except the one `CreatedAt` precision
  fix noted in Debug Log References.
- Extended `IClienteRepository`/`clienteApiRepository` (frontend) with `update`, added
  `useUpdateCliente` (invalidates both `['clientes']` and `['clientes', id]`, shows the exact
  success toast copy).
- Extended `ClienteForm` with an optional `cliente` prop / `isEditMode`, a `useEffect` that
  re-applies the correct baseline (client's current values or blank) whenever the dialog opens,
  the "Editar cliente" title, and mode-aware submit/disabled wiring. Zero new cancel-handling
  logic was needed — the existing bare `reset()` on close reverts to whichever baseline the
  effect last set.
- Added the "Editar" button and mounted `ClienteForm` in `ClienteDetailView`'s success branch.
- The ATDD-authored `ClienteForm.edit.test.tsx` and the `ClienteDetailView.test.tsx` "Editar"
  cases all pass unmodified.
- Ran the pre-authored `e2e/tests/clientes/clientes-edit.spec.ts` (TC-E2-P1-01/02) plus the full
  `e2e/tests/clientes` suite — all 15 specs pass, confirming both this story's new flow and no
  regression to Stories 2.1-2.3's existing flows.

### File List

**New (backend):**
- `backend/src/SiesaAgents.Application/Clientes/DTOs/UpdateClienteRequest.cs`
- `backend/src/SiesaAgents.Application/Clientes/Validators/UpdateClienteRequestValidator.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteResult.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/UpdateClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTestBase.cs`

**Modified (backend):**
- `backend/src/SiesaAgents.Domain/Clientes/Entities/ClienteEntity.cs`
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsTests.cs` (now inherits `ClienteEndpointsTestBase`)
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsEdgeCasesTests.cs` (now inherits `ClienteEndpointsTestBase`)
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsUpdateTests.cs` (CreatedAt assertion tolerance fix)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs` (fake `UpdateAsync`)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs` (fake `UpdateAsync`)
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs` (fake `UpdateAsync`)

**New (frontend):**
- `frontend/src/modules/crm/clientes/application/useUpdateCliente.ts`

**Modified (frontend):**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`

**Pre-existing (ATDD-authored, no changes needed beyond the one noted fix):**
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteRequestValidatorTests.cs`
- `frontend/src/modules/crm/clientes/presentation/ClienteForm.edit.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx`
- `e2e/tests/clientes/clientes-edit.spec.ts`
- `e2e/pages/clientes.page.ts`
