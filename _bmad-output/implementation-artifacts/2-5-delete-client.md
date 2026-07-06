# Story 2.5: Delete Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a client record,
so that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a client's detail (`ClienteDetailView`, `data-testid="cliente-detail-panel"`), **When** the user clicks "Eliminar" (`role="button"`, name `/eliminar/i`, rendered next to the existing "Editar" button), **Then** a confirmation dialog opens (`role="dialog"`, reusing `@/shared/components/ui/dialog` — the same `Dialog` primitives `ClienteForm` already uses) titled **"¿Eliminar este cliente?"** with two actions: **"Confirmar"** and **"Cancelar"**.

2. **Given** the confirmation dialog is open, **When** the user clicks "Confirmar", **Then** `DELETE /api/v1/clientes/{id}` is called, the client list (`ClienteListView`) no longer shows it with no page reload (FR27, via `queryClient.invalidateQueries({ queryKey: ['clientes'] })`), the app navigates away from `/clientes/:clienteId` back to `/clientes` so the right panel returns to the default empty state ("Selecciona un cliente para ver su detalle", `clientes.index.tsx` — **not** the "Cliente no encontrado" not-found variant), a success toast shows the exact Spanish copy **"Cliente eliminado correctamente"**, and the dialog closes. The "Confirmar" button is disabled while the mutation is pending, so a rapid double-click cannot fire two `DELETE` requests.

3. **Given** the confirmation dialog is open, **When** the user clicks "Cancelar" (or closes the dialog via Escape/overlay), **Then** no `DELETE` request is ever sent, the dialog closes, and the client record remains completely unchanged (still selected in the detail panel, still present in the list).

4. **[Scope note — not implemented in this story, see Dev Notes]** The epic's AC for "client with associated contacts" (contacts survive with `clienteId = null` and appear under "Sin cliente") **cannot be implemented yet**: the `Contacto` entity does not exist in the codebase (it is created in Story 3.1) and the `contactos.cliente_id` FK does not exist either (added in Epic 4). This story deletes only the `Cliente` row. No `Contacto`-referencing code, migration, or test is added here — see Dev Notes for why zero extra work will be needed once Epic 4 lands the FK.

## Tasks / Subtasks

- [x] Task 1 — Backend: `IClienteRepository.DeleteAsync` + `ClienteRepository` implementation (AC: #2)
  - [x] In `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`, add `Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)` — returns `true` when a matching client was found and removed, `false` when no client with that `id` exists (simpler contract than `AddAsync`/`UpdateAsync`: delete has no unique-constraint conflict to report, so no `bool` "conflict" overload is needed). Update the interface's XML doc comment (currently ends "DeleteAsync is still out of scope — Story 2.5 extends this interface further") to say `DeleteAsync` now exists and the interface is complete for Epic 2's CRUD scope.
  - [x] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`: `var cliente = await dbContext.Clientes.FirstOrDefaultAsync(c => c.Id == id, cancellationToken); if (cliente is null) return false; dbContext.Clientes.Remove(cliente); await dbContext.SaveChangesAsync(cancellationToken); return true;` — a tracked fetch (no `AsNoTracking()`, unlike `GetByIdAsync`) so `Remove` can mark it `Deleted` directly.

- [x] Task 2 — Backend: `DeleteCliente` command + handler + `DELETE /api/v1/clientes/{id}` endpoint (AC: #2)
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`: `public sealed record DeleteClienteCommand(Guid Id);`
  - [x] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`: `public class DeleteClienteCommandHandler(IClienteRepository clienteRepository) { public Task<bool> Handle(DeleteClienteCommand command, CancellationToken cancellationToken) => clienteRepository.DeleteAsync(command.Id, cancellationToken); }` — **no `DeleteClienteResult` wrapper type**, unlike `CreateClienteResult`/`UpdateClienteResult`: delete has exactly one binary outcome (found-and-deleted vs. not-found), so the handler returning `bool` directly (mirroring `GetByIdAsync`'s nullable-return simplicity) avoids an unnecessary abstraction layer.
  - [x] In `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`, add to the existing `group`: `group.MapDelete("/{id:guid}", async (Guid id, DeleteClienteCommandHandler handler, CancellationToken cancellationToken) => { var deleted = await handler.Handle(new DeleteClienteCommand(id), cancellationToken); return deleted ? Results.NoContent() : Results.NotFound(); });` — `204 No Content` on success matches `architecture.md`'s documented `DELETE → 204 No Content` format pattern; `404` when the id doesn't exist (already-deleted / stale client, e.g. a second tab).
  - [x] Register in `backend/src/SiesaAgents.API/Program.cs`: `builder.Services.AddScoped<DeleteClienteCommandHandler>();` next to the existing `Create*`/`Update*` handler registrations. No new validator/DTO is needed — `DeleteClienteCommand` takes only the route-bound `id`, nothing to validate.

- [x] Task 3 — Backend tests (AC: #2)
  - [x] Extend the fake `IClienteRepository` implementations in `GetClientesQueryHandlerTests.cs`, `GetClienteByIdQueryHandlerTests.cs`, `CreateClienteCommandHandlerTests.cs` and `UpdateClienteCommandHandlerTests.cs`'s `FakeClienteRepository`/`RecordingClienteRepository` with a no-op-compatible `DeleteAsync` implementation (`Task.FromResult(true)`), the same mechanical step Story 2.4 performed for `UpdateAsync` — required to keep them compiling against the now-larger `IClienteRepository` interface.
  - [x] Add `DeleteClienteCommandHandlerTests.cs` to `backend/tests/SiesaAgents.UnitTests/Application/Clientes/` (hand-rolled fake, no mocking framework, mirroring `UpdateClienteCommandHandlerTests.cs`'s convention): `Handle` returns `true` when the fake repository's `DeleteAsync` returns `true`; `Handle` returns `false` when it returns `false`; a recording fake asserts the handler forwards `command.Id` verbatim to `clienteRepository.DeleteAsync`. (Already authored by the ATDD phase; verified GREEN against this story's implementation.)
  - [x] Extend `ClienteEndpointsTests.cs` (inherits `ClienteEndpointsTestBase`) with: `DeleteCliente_ReturnsNoContent_WhenClienteExists` (`204`); `DeleteCliente_RemovesFromDatabase` (a follow-up `GET /api/v1/clientes/{id}` on the same id now returns `404`); `DeleteCliente_ReturnsNotFound_WhenClienteDoesNotExist` (random `Guid`, assert `404`); `DeleteCliente_DoesNotAffectOtherClientes` (seed two clients via `SeedClientesAsync`, delete one, assert the other still appears in `GetClientesAsync()`). (Already authored by the ATDD phase as `ClienteEndpointsDeleteTests.cs`; verified GREEN.)

- [x] Task 4 — Frontend data layer: `delete` on the client repository + `useDeleteCliente` mutation hook (AC: #2)
  - [x] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`: add `delete(id: string): Promise<void>`.
  - [x] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`: `async delete(id: string): Promise<void> { await apiClient.delete(\`/api/v1/clientes/${id}\`) }`.
  - [x] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`: `export function useDeleteCliente() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (id: string) => clienteApiRepository.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente eliminado correctamente') } }) }` — invalidates only `['clientes']` (the list). Deliberately does **not** invalidate `['clientes', id]`: the record no longer exists, and refetching it would just produce a `404`/`null`, rendering the "Cliente no encontrado" not-found branch instead of AC #2's required default empty state — navigation (Task 5) is what achieves the correct UX, not cache invalidation.

- [x] Task 5 — Frontend: confirmation dialog + "Eliminar" trigger in `ClienteDetailView`; wire post-delete navigation from the route (AC: #1, #2, #3)
  - [x] **Critical constraint**: `ClienteDetailView.test.tsx` (Story 2.2/2.4, unchanged by this story) renders `ClienteDetailView` standalone inside only a `QueryClientProvider` — **no router context**. Calling `useNavigate()` directly inside `ClienteDetailView` would throw in every one of those existing tests. Instead, add an **optional** prop `onDeleted?: () => void` to `ClienteDetailViewProps`; the component calls `onDeleted?.()` after a successful delete instead of navigating itself. Existing tests that don't pass the prop are unaffected (it's simply `undefined` and never invoked).
  - [x] In `frontend/src/routes/_app/clientes.$clienteId.tsx` (`ClienteDetailRoute`), add `const navigate = useNavigate()` (from `@tanstack/react-router`, same import already used in `AppNavigation.tsx`) and pass `onDeleted={() => navigate({ to: '/clientes' })}` to `<ClienteDetailView clienteId={clienteId} onDeleted={...} />`. Navigating to `/clientes` unmounts the `$clienteId` route and renders `clientes.index.tsx`'s `ClientesIndexView` in the `Outlet` — this **is** AC #2's "right panel returns to empty/default state".
  - [x] In `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`: add `const [isDeleteOpen, setIsDeleteOpen] = useState(false)` and `const deleteCliente = useDeleteCliente()`. Add an "Eliminar" `Button` (`htmlType="button"`, `size="sm"`, `type="outline"`) next to the existing "Editar" button, `onClick={() => setIsDeleteOpen(true)}`.
  - [x] Add a second `Dialog` (reuse `@/shared/components/ui/dialog`, same primitives as `ClienteForm`) controlled by `isDeleteOpen`: `DialogTitle` reads **"¿Eliminar este cliente?"**; `DialogFooter` has a "Cancelar" `Button` (`type="outline"`, `onClick={() => setIsDeleteOpen(false)}`) and a "Confirmar" `Button` (`disabled={deleteCliente.isPending}`, `onClick={handleConfirmDelete}`).
  - [x] Implement `const handleConfirmDelete = async () => { await deleteCliente.mutateAsync(clienteId); setIsDeleteOpen(false); onDeleted?.() }`. Both new elements (Eliminar button + confirmation `Dialog`) are mounted only inside the existing `isSuccess && data` branch, same placement rule Story 2.4 established for "Editar"/`ClienteForm`.

- [x] Task 6 — Tests (AC: #1, #2, #3)
  - [x] Extend `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (MSW, network-first pattern — register handlers via `server.use(...)` before rendering): renders an "Eliminar" button once the client loads; clicking it opens a dialog showing the text "¿Eliminar este cliente?"; clicking "Cancelar" closes the dialog and asserts zero `DELETE` requests were made (MSW handler spy/call-count); clicking "Confirmar" against a mocked `204` response calls the mocked `DELETE /api/v1/clientes/:id` exactly once, shows the toast "Cliente eliminado correctamente", and calls the `onDeleted` prop (pass a `vi.fn()` as `onDeleted` and assert it was called) — do **not** assert real router navigation at this component-test level, since the component itself only calls `onDeleted`; the route-level wiring (Task 5's second subtask) is covered by the E2E spec instead. (Already authored by the ATDD phase; verified GREEN — all 22 tests in the file pass.)
  - [x] Do not add new E2E specs in this story — per the project's established ATDD convention (Stories 2.1-2.4), `e2e/tests/clientes/clientes-delete.spec.ts` is authored ahead of implementation by the ATDD phase, and `e2e/pages/clientes.page.ts` **already contains** the `btnEliminar` (`getByRole('button', { name: /eliminar/i })`) and `btnConfirmarEliminar` (`getByRole('button', { name: /confirmar/i })`) locators pre-added for this story. It covers `test-design-epic-2.md`'s TC-E2-P0-05 (**Cliente-only portion**: client row removed, list updated, toast shown — the contacts-cascade portion of that test case is out of scope per AC #4/Dev Notes) and TC-E2-P1-10 (cancel preserves the record). Not re-run in this dev pass (requires the full app + Playwright browsers running); implementation matches every locator/copy string the spec asserts on.

## Dev Notes

### Architecture patterns and constraints

- **Why no `Contacto` cascade logic is implemented here (AC #4)**: the epic's last Story 2.5 scenario ("client has associated contacts → contacts survive, unassigned, appear in 'Sin cliente'") depends on a `Contacto` entity and a `contactos.cliente_id` FK that **do not exist in this codebase yet** — `Contacto` is created in Story 3.1, and the client↔contact association (including the FK itself) is built in Epic 4. `architecture.md` already documents the target schema (`contactos.cliente_id uuid nullable FK → clientes.id ON DELETE SET NULL`) and `test-design-epic-2.md`'s TC-E2-P0-05/R2 assume that schema exists — both were written before this scope constraint was confirmed. Per explicit instruction for this story, **do not invent the `Contacto` entity**: implement only the simple `Cliente` deletion (Tasks 1-6). When Epic 4 adds the FK with `ON DELETE SET NULL` (the behavior already specified in `architecture.md`), PostgreSQL enforces the unassignment automatically at the database level the moment a `clientes` row is deleted — `DeleteClienteCommandHandler` will need **zero changes** for that behavior to work. Epic 4's story authoring should re-verify this assumption once `Contacto` exists.
- **No `DeleteClienteResult` type**: unlike `CreateClienteResult`/`UpdateClienteResult` (Stories 2.3/2.4), which needed to distinguish `Success`/`Conflict`/`NotFound`, a delete has only one binary outcome — found-and-removed vs. not-found — so the handler returns `bool` directly. Introducing a result wrapper for a single boolean would be an unrequested abstraction layer (company standard: map requirements directly to components).
- **`useDeleteCliente` invalidates only `['clientes']`, not `['clientes', id]`**: refetching the now-deleted single-record key would resolve `404`/`null` and render `ClienteDetailView`'s existing "Cliente no encontrado" not-found branch — which is a **different** UI state than AC #2's required "default empty state" (`clientes.index.tsx`'s "Selecciona un cliente..." message). The correct empty state is reached by navigating away from the `$clienteId` route entirely (Task 5), not by cache invalidation.
- **`onDeleted` callback prop, not `useNavigate()` inside `ClienteDetailView`**: `ClienteDetailView.test.tsx` (established in Stories 2.2/2.4) renders the component wrapped only in `QueryClientProvider`, with no router context. Calling a router hook directly inside the component would break every existing test in that file. The optional `onDeleted?: () => void` prop keeps the component router-agnostic and backward-compatible; only the route file (`clientes.$clienteId.tsx`) — which already runs inside the router — supplies the actual `navigate({ to: '/clientes' })` call. This mirrors the existing separation of concerns: presentation components stay declarative, routing decisions live in route files.
- **Double-submit protection (test-design R9)**: the "Confirmar" button's `disabled={deleteCliente.isPending}` prevents a rapid double-click from firing two `DELETE` requests — the same pattern `ClienteForm`'s "Guardar" button already uses (`disabled={isEditMode ? updateCliente.isPending : createCliente.isPending}`).
- **No new validator/DTO**: `DeleteClienteCommand` only needs the route-bound `id` (a `Guid` route constraint `{id:guid}` already rejects malformed ids with a `400` before the handler runs, same as `PUT`/`GET /{id:guid}`) — nothing to validate.

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed) — `Button` (`htmlType="button"`, `type="outline"` for secondary actions) for "Eliminar"/"Cancelar", exactly as `ClienteForm` already establishes.
- **Dialog**: reuse `frontend/src/shared/components/ui/dialog.tsx` (shadcn/Radix) — do not build a new confirmation-dialog abstraction; instantiate the same `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogFooter` primitives `ClienteForm` already uses, mounted directly in `ClienteDetailView`.
- **Toasts**: `sonner`'s `<Toaster/>` is already mounted globally (`main.tsx`) — `toast.success('Cliente eliminado correctamente')` from `useDeleteCliente` renders with no additional wiring.
- Do not build a second, generic/reusable "ConfirmDialog" component for this single use case — a dedicated abstraction is not requested by this story's scope (minimal-complexity principle); Story 3.5 (Delete Contact) can decide independently whether to extract one once a second delete flow exists.

### Project Structure Notes

- New backend files: `SiesaAgents.Application/Clientes/Commands/{DeleteClienteCommand.cs,DeleteClienteCommandHandler.cs}` — exact paths from `architecture.md`'s directory tree pattern, mirroring the `Create*`/`Update*` siblings already present.
- Modified backend files: `SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` (add `DeleteAsync`), `SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (implement it), `SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (add `DELETE /{id:guid}`), `SiesaAgents.API/Program.cs` (register handler), the four `*HandlerTests.cs` files needing a no-op `DeleteAsync` fake addition.
- No backend schema/migration changes — the `clientes` table already exists from Story 2.1; this story only adds a new delete path over the same row. No `Contacto`/`contactos` files are touched (out of scope — Epics 3/4).
- New frontend files: `modules/crm/clientes/application/useDeleteCliente.ts`.
- Modified frontend files: `modules/crm/clientes/domain/IClienteRepository.ts` (add `delete`), `modules/crm/clientes/infrastructure/clienteApiRepository.ts` (add `delete`), `modules/crm/clientes/presentation/ClienteDetailView.tsx` (add "Eliminar" button + confirmation `Dialog` + `onDeleted` prop), `routes/_app/clientes.$clienteId.tsx` (wire `useNavigate()` → `onDeleted`).

### Testing Standards Summary

- Frontend: Vitest + React Testing Library + MSW, extending the existing co-located `ClienteDetailView.test.tsx`, same network-first pattern (`server.use(...)` before render/interaction) established in Stories 2.1-2.4. Assert `onDeleted` was invoked (via a passed `vi.fn()`) rather than real navigation — navigation itself has no unit under test at the component level since it now lives in the route file.
- Backend: xUnit; new unit tests in `SiesaAgents.UnitTests/Application/Clientes/`; integration tests extending `ClienteEndpointsTests.cs` (already on the shared `ClienteEndpointsTestBase` from Story 2.4 — reuse its `SeedClientesAsync`/`GetClientesAsync` helpers, do not duplicate them).
- Relevant test-design cases (`test-design-epic-2.md`): TC-E2-P0-05 (Cliente-only portion only — see AC #4 scope note), TC-E2-P1-10 (cancel preserves record), R9 mitigation (double-confirm protection, verified here via the `disabled` state; TC-E2-P2-04's full rapid-double-click E2E assertion remains a `*automate`/future-sprint item per the test design's P2 priority).
- All UI copy in Spanish; toast copy string must match exactly: "Cliente eliminado correctamente".

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.5: Delete Client]
- Functional requirements: [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management] (FR7 — eliminar cliente, FR27 — cambios reflejados inmediatamente); FR25 (contactos huérfanos) is explicitly **deferred** — see AC #4/Dev Notes.
- Architecture — REST contract, format pattern, directory structure: [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] (`DELETE /api/v1/clientes/{id}`), [#Format Patterns] (`DELETE → 204 No Content`), [#Complete Project Directory Structure] (`DeleteClienteCommand.cs`, `DeleteClienteCommandHandler.cs`), [#Data Model] (`contactos.cliente_id ... ON DELETE SET NULL` — the Epic 4 schema this story deliberately does not implement yet).
- Epic-level test plan: [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#TC-E2-P0-05], [#TC-E2-P1-10], [#R2], [#R9] — note TC-E2-P0-05 and R2 as written assume the `Contacto` entity/FK exist; this story satisfies only their Cliente-deletion half.
- Previous story state and established patterns (`ClienteEntity`, `IClienteRepository`/`ClienteRepository`, `ClienteEndpoints`, `ClienteEndpointsTestBase`, `ClienteDetailView`, `useUpdateCliente`, `ClienteForm`'s `Dialog` usage): [Source: _bmad-output/implementation-artifacts/2-4-edit-client.md#Dev Notes], [#File List]; [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md#Dev Notes] (`ClienteDetailView`, not-found branch, `clientes.index.tsx` default state).
- Company stack/DB/UI standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (sa-create-story sub-agent for story authoring)

### Debug Log References

- `dotnet build` (backend): 0 errors, 0 warnings.
- `dotnet test tests/SiesaAgents.UnitTests`: 92/92 passed.
- `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~Clientes`: 62/62 passed (includes the 4 new `ClienteEndpointsDeleteTests` cases).
- `npx vitest run` (frontend, full suite): 13 files / 110 tests passed, including all 22 tests in `ClienteDetailView.test.tsx` (Story 2.5's delete-flow tests were already authored RED by the ATDD phase and are now GREEN).
- `npx tsc -b` (frontend): clean, no type errors.
- `npx oxlint` (frontend): only pre-existing `react(only-export-components)` warnings on route files, unrelated to this story.

### Completion Notes List

- ATDD phase had already authored failing tests for this story (backend: `DeleteClienteCommandHandlerTests.cs`, `ClienteEndpointsDeleteTests.cs`; frontend: the "Story 2.5" describe blocks in `ClienteDetailView.test.tsx`; E2E: `clientes-delete.spec.ts` with `btnEliminar`/`btnConfirmarEliminar` locators pre-added to `clientes.page.ts`). This dev pass implemented production code only, no test files were authored from scratch — all pre-existing tests now pass.
- Implemented exactly per Tasks 1-6: `IClienteRepository.DeleteAsync` + `ClienteRepository` implementation, `DeleteClienteCommand`/`DeleteClienteCommandHandler`, `DELETE /api/v1/clientes/{id:guid}` endpoint (204/404), DI registration, the 6 fake-repository `DeleteAsync` no-ops needed to keep existing unit test doubles compiling against the extended interface, frontend `delete()` on the repository, `useDeleteCliente` mutation hook, the "Eliminar" button + confirmation `Dialog` + `onDeleted` prop in `ClienteDetailView`, and `useNavigate()` wiring in `clientes.$clienteId.tsx`.
- No `DeleteClienteResult` wrapper type was introduced (handler returns `bool` directly) and no new generic `ConfirmDialog` abstraction was built — both deliberate per Dev Notes/minimal-complexity principle.
- AC #4 (contacts survive with `clienteId = null`) is out of scope per the story's explicit scope note — `Contacto` entity doesn't exist yet (Story 3.1) and the FK is added in Epic 4; no `Contacto`-related code was touched.
- E2E spec (`clientes-delete.spec.ts`) was not executed in this pass (requires the full app stack + Playwright browsers running); the implementation was manually cross-checked against every locator, dialog copy, and toast string it asserts on.

### File List

**Backend — new:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`

**Backend — modified:**
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs`
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClienteByIdQueryHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/CreateClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/UpdateClienteCommandHandlerTests.cs`

**Backend — pre-existing (authored by ATDD phase, unmodified in this pass):**
- `backend/tests/SiesaAgents.UnitTests/Application/Clientes/DeleteClienteCommandHandlerTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/Clientes/ClienteEndpointsDeleteTests.cs`

**Frontend — new:**
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`

**Frontend — modified:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts`
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
- `frontend/src/routes/_app/clientes.$clienteId.tsx`

**Frontend — pre-existing (authored by ATDD phase, split by TEA test-quality review):**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.test.tsx` (256 lines, was 471 — Story 2.5's delete-flow tests extracted to the new sibling file below, no assertion/behavior changes)

**Frontend — new (added by TEA test-quality review, `testarch-test-review`):**
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.delete.test.tsx` (268 lines — extracted from `ClienteDetailView.test.tsx`, which had crossed the project's <300-line-per-file standard; mirrors the `ClienteForm.edit.test.tsx`/`ClienteForm.edit.submit.test.tsx` split from Story 2.4's review)

**E2E — pre-existing (authored by ATDD phase, unmodified in this pass):**
- `e2e/tests/clientes/clientes-delete.spec.ts`
- `e2e/pages/clientes.page.ts`
