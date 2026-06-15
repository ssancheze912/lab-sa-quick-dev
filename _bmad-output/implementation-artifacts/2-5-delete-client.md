# Story 2.5: Delete Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to delete a client record,
so that the client list only contains active and relevant records.

## Acceptance Criteria

1. **Given** the user is viewing a valid `ClienteDetailView` at `/clientes/$clienteId` (Story 2.2) with a loaded cliente, **When** the right panel renders the top action bar inside `<section data-testid="cliente-detail-panel">`, **Then** a destructive button labelled `"Eliminar"` (`<button data-testid="btn-eliminar-cliente">`) is visible at the TOP of the detail panel, placed to the LEFT of the existing `btn-editar-cliente` (Story 2.4) so the action bar reads `[Eliminar] ... [Editar]` (right-aligned). The button uses `bg-red-600 text-white font-semibold hover:bg-red-700` (UX spec §Button Hierarchy "Destructivo"), is keyboard-focusable with visible focus ring, and has `aria-label="Eliminar cliente"`. The button is HIDDEN when the panel is in `isLoading`, `isError`, or `cliente-not-found` states (only renders when `data` is a valid `Cliente`). (FR7, AC-E2.5, UX spec §Button Hierarchy)

2. **Given** the user clicks `"Eliminar"`, **When** the click handler fires, **Then** a confirmation dialog opens — `<div role="alertdialog" aria-modal="true" data-testid="cliente-delete-dialog">` — with title `<h2>¿Eliminar este cliente?</h2>` and a footer containing exactly two buttons: `[Cancelar]` (outline, left, `data-testid="btn-cancelar-eliminar"`) and `[Confirmar]` (red destructive, right, `data-testid="btn-confirmar-eliminar"`). The dialog traps focus inside, closes on `Esc`, on click outside, and on the `✕` icon. Initial focus lands on the `Cancelar` button (safe default for a destructive action — UX spec §Modal & Overlay Patterns and §Navegación por teclado: "`Tab` entre 'Cancelar' y 'Eliminar', `Esc` cierra"). NO `DELETE` request is fired until the user explicitly clicks `Confirmar`. (FR7, AC-E2.5, UX spec §Confirmación de eliminación)

3. **Given** the confirmation dialog is open, **When** the user clicks `Cancelar` (or `Esc`, or `✕`, or clicks the overlay), **Then** the dialog closes, NO `DELETE /api/v1/clientes/{id}` request is fired (assert via MSW `unhandledRequest: 'error'` in component tests, and via `page.route` interceptor in E2E), the cliente record remains in the system unchanged, the detail panel CONTINUES to show the same cliente data, and keyboard focus returns to the `btn-eliminar-cliente` button that opened the dialog. (FR7, AC-E2.5)

4. **Given** the confirmation dialog is open, **When** the user clicks `Confirmar`, **Then** the frontend issues `DELETE /api/v1/clientes/{id}` (where `{id}` is the routed `clienteId`), receives `HTTP 204 No Content` on success, invalidates the `['clientes']` TanStack Query key AND removes the `['clientes', id]` cache entry (`queryClient.removeQueries({ queryKey: ['clientes', id] })` — the single-cliente cache becomes stale immediately because the record no longer exists), the dialog closes, the frontend navigates from `/clientes/$clienteId` to `/clientes` so the URL no longer references the deleted id (the right panel returns to the empty/default state — Story 2.2's `ClienteDetailEmptyState` placeholder), the deleted cliente disappears from the list panel (FR27 — automatic propagation), and a success toast appears with Spanish copy `"Cliente eliminado correctamente"` (3s duration, `green-500` accent). (FR7, FR27, AC-E2.5, NFR2)

5. **Given** the cliente being deleted has associated contactos (Epic 3 / Epic 4 — `contactos.cliente_id` FK), **When** the deletion succeeds at the database level via `ON DELETE SET NULL` (FR25 contract), **Then** the same flow as AC #4 runs (204 → cache invalidation → navigation → list update) but the success toast copy switches to `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` (5s duration to compensate for the longer message, still `green-500` accent). The trigger is the backend response header `X-Contactos-Orphaned: <count>` (an integer ≥ 1) set by the `DELETE` endpoint when at least one contacto was orphaned. When the header is absent or `0`, the standard toast from AC #4 fires. **DEFERRAL NOTE — see Dev Notes §"Contactos Coupling Strategy":** the `contactos` table does NOT exist until Story 3.1 lands. For Story 2.5, the backend implementation MUST handle the `ON DELETE SET NULL` semantics defensively (via a Migration in 3.1, NOT this story) AND the `X-Contactos-Orphaned` header behavior MUST be wired in 2.5 in a forward-compatible way (header omitted in 2.5 → frontend defaults to AC #4 toast). The orphaning ASSERTION is OUT-OF-SCOPE for 2.5 testing (no contactos to orphan yet) but the FRONTEND header-driven branching IS tested via MSW mocks that fabricate the header. (FR7, FR25, AC-E2.5)

6. **Given** the backend exposes `DELETE /api/v1/clientes/{id:guid}` per architecture.md §API & Communication Patterns (line 254: `DELETE /api/v1/clientes/{id} → Delete`) and §API response shapes (line 377: `DELETE → 204 No Content`), **When** the endpoint is invoked with an existing `id`, **Then** it returns `HTTP 204 No Content` with NO response body. The implementation removes the `ClienteEntity` from the `Clientes` DbSet via `_context.Clientes.Remove(entity)` + `SaveChangesAsync(ct)`. No domain event is published in Story 2.5 (the global `ExceptionHandlingMiddleware` from Story 1.3 covers unexpected failures). (FR7, AC-E2.5)

7. **Given** the user submits a delete for a cliente whose `id` does NOT exist (e.g. it was deleted in another tab between fetch and DELETE), **When** the backend's repository lookup returns `null`, **Then** the API returns `HTTP 404 Not Found` with `Content-Type: application/problem+json` and a body `{ status: 404, title: "Cliente no encontrado.", type: "https://tools.ietf.org/html/rfc7231#section-6.5.4", instance: "/api/v1/clientes/{id}" }`. NO `stackTrace`, `exception`, or `detail` exposing internal types is included (NFR6). The frontend handles 404 the SAME WAY as a successful delete from a UX perspective: dialog closes, navigation to `/clientes` fires, list re-fetches (the missing row is no longer there), but the toast copy switches to `"Cliente no encontrado. La lista se actualizó."` (5s, `amber-500` informational accent — the user's intent was honored, just by a different mechanism). (FR7, NFR6)

8. **Given** a malformed `id` is passed to the endpoint (e.g. `/api/v1/clientes/not-a-guid`), **When** the route constraint `{id:guid}` fails to match, **Then** the sibling catch-all route `group.MapDelete("/{id}", ...)` (mirroring the existing GET + PUT catch-alls from Stories 2.2 + 2.4) returns `HTTP 400 Bad Request` with `Content-Type: application/problem+json` and title `"Identificador de cliente inválido."` and detail `"El identificador debe ser un UUID válido."`. NO stack trace leaks (NFR6). The frontend never reaches this path under normal navigation (the route param is always a valid UUID), but the contract is required for direct API consumers. (FR7, NFR6)

9. **Given** the user submits a delete, **When** the backend returns ANY 5xx error OR the request fails at the network layer, **Then** the dialog STAYS OPEN with the `Confirmar` button re-enabled, a red toast appears with Spanish copy `"No se pudo eliminar. Intenta de nuevo."` (5s duration), and the cliente record remains in the system unchanged (no cache mutation, no navigation). The user can retry by clicking `Confirmar` again or dismiss with `Cancelar`. The toast must NOT leak the raw error message or stack trace (NFR6). (NFR6, R-008)

10. **Given** the backend integration test project, **When** `dotnet test` runs, **Then** the following tests pass (new file `backend/tests/SiesaAgents.IntegrationTests/ClientesDeleteEndpointTests.cs`):
    - `DeleteCliente_WithExistingId_Returns204NoContent` — seed a cliente, DELETE its id, assert 204 + empty body + the cliente is gone from the DbContext (assert via direct DbContext read inside a fresh scope: `Assert.False(await db.Clientes.AnyAsync(c => c.Id == seededId))`).
    - `DeleteCliente_WhenNotFound_Returns404ProblemDetails` — DELETE a random `Guid.NewGuid()` against an empty DbContext, assert 404 + Problem Details body with `title: "Cliente no encontrado."` and `instance: "/api/v1/clientes/{id}"`. Assert NO `stackTrace`, `exception`, or `detail` member containing fully-qualified type names (reuse the `AssertNoInternalLeakage(JsonElement)` helper from `ClientesUpdateEndpointTests` — extract it to a shared static helper class if needed).
    - `DeleteCliente_WithInvalidGuid_Returns400ProblemDetails` — DELETE `/api/v1/clientes/not-a-guid`, assert 400 + Problem Details body with title `"Identificador de cliente inválido."` + detail `"El identificador debe ser un UUID válido."`. NO stack trace.
    - `DeleteCliente_ResponseHasNoBody` — DELETE existing id, assert `response.Content.Headers.ContentLength == 0` (or response body is empty/null) per the 204 contract.
    - `DeleteCliente_AfterDelete_GetByIdReturns404` — seed, DELETE, then GET the same id, assert 404 + Problem Details (ensures the delete is observable via subsequent reads — guards against silent failure / soft-delete drift).
    - `DeleteCliente_IsIdempotentLikeRest_SecondDeleteReturns404` — seed, DELETE (expect 204), DELETE the SAME id (expect 404 with the same Problem Details body). Documents REST semantics: DELETE is not truly idempotent in our implementation (the second call returns 404, not 204), but BOTH outcomes leave the system in the same state.
    - `DeleteCliente_OmitsContactosOrphanedHeader_WhenNoContactos` — seed a cliente with NO contactos (contactos table does not exist yet — assert by NOT-having the `X-Contactos-Orphaned` header in the 204 response). This locks in the forward-compatible header contract: absent header → frontend uses the standard "Cliente eliminado correctamente" toast.
    - All existing tests from Stories 1.3 + 2.1 + 2.2 + 2.3 + 2.4 MUST remain green. Story 2.4 baseline is **81/81 green**; Story 2.5 adds 7 new integration tests → **88/88 green** target (assuming no regression).

11. **Given** the frontend, **When** Vitest + RTL component tests run, **Then** the following automated tests pass:
    - `ClienteDetailView_renders_btn_eliminar_cliente` — mount with a mocked `useCliente` returning a full `Cliente`, assert `btn-eliminar-cliente` testid visible, has `aria-label="Eliminar cliente"`, has red destructive styling (`className` includes `bg-red-600`).
    - `ClienteDetailView_does_not_render_btn_eliminar_when_loading_or_error_or_not_found` — three sub-cases: `isLoading: true`, `isError: true`, `data: null`. Assert `btn-eliminar-cliente` is NOT present.
    - `ClienteDetailView_opens_delete_dialog_on_btn_click` — click `btn-eliminar-cliente`, assert `cliente-delete-dialog` testid visible, title `"¿Eliminar este cliente?"`, buttons `[Cancelar]` + `[Confirmar]`, initial focus on `Cancelar`.
    - `ClienteDeleteDialog_cancel_closes_without_request` — open dialog, click `Cancelar`, MSW configured with `onUnhandledRequest: 'error'`, assert dialog hidden, NO DELETE request fired, focus returns to `btn-eliminar-cliente`.
    - `ClienteDeleteDialog_esc_closes_without_request` — open dialog, press `Esc`, same assertions as the cancel-button test.
    - `ClienteDeleteDialog_confirm_204_fires_success_toast_and_navigates` — open dialog, click `Confirmar`, MSW returns 204, assert: dialog hidden, success toast `"Cliente eliminado correctamente"` visible, `router.navigate` called with `{ to: '/clientes' }`, `queryClient.invalidateQueries({ queryKey: ['clientes'] })` called, `queryClient.removeQueries({ queryKey: ['clientes', id] })` called.
    - `ClienteDeleteDialog_confirm_204_with_orphan_header_shows_compound_toast` — open dialog, click `Confirmar`, MSW returns 204 + header `X-Contactos-Orphaned: 2`, assert toast `"Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."` visible (5s duration). Same cache + navigation behavior as the standard 204 path.
    - `ClienteDeleteDialog_confirm_404_treats_as_success_with_informational_toast` — MSW returns 404 + Problem Details, assert: dialog hidden, amber/info toast `"Cliente no encontrado. La lista se actualizó."` (5s), navigation to `/clientes`, cache invalidated.
    - `ClienteDeleteDialog_confirm_500_keeps_dialog_open_and_red_toast` — MSW returns 500, assert: dialog STAYS OPEN, `Confirmar` button re-enabled (no permanent disabled state), red toast `"No se pudo eliminar. Intenta de nuevo."` visible (5s), NO navigation, NO cache mutation.
    - `ClienteDeleteDialog_confirm_network_error_keeps_dialog_open_and_red_toast` — MSW configured to fail the request entirely (network error), same assertions as the 500 case.
    - `useDeleteCliente_invalidates_list_and_removes_single_cache` — hook-level test: spy on `queryClient.invalidateQueries` + `queryClient.removeQueries`, success path calls `invalidateQueries({ queryKey: ['clientes'] })` AND `removeQueries({ queryKey: ['clientes', id] })`.
    - `useDeleteCliente_propagates_error_for_500` — hook-level test: MSW returns 500, assert `mutation.error` is the axios error (so the component's `onError` branch reads `err.response?.status === 500` and can branch correctly).
    - `useDeleteCliente_propagates_404_as_error` — hook-level test: MSW returns 404, assert `mutation.error` is non-null axios error with `response.status === 404` (so the component can treat it as "soft success" — see AC #7).
    - Story 2.4's `ClienteForm` + `ClienteDetailView` test suites (87 baseline) MUST remain green.

12. **Given** the frontend, **When** `pnpm run build` is executed, **Then** the build completes with zero TypeScript errors in strict mode. The eager-loaded JS chunk stays within the Story 2.4 budget (≤ 410 KB gzipped — Story 2.4 reported the eager chunk at 404.53 KB). The new `useDeleteCliente` hook + the `ClienteDeleteDialog` component + the delete button wiring land in the lazy `clientes._clienteId-*.js` chunk (budget: < +3 KB gzipped vs Story 2.4 baseline for that lazy chunk). NO new npm dependencies are introduced (re-use the existing `Dialog` shadcn primitive, the `siesa-ui-kit` toast, the `axios` + `@tanstack/react-query` already in the bundle).

13. **Given** the e2e Playwright project, **When** `pnpm exec playwright test e2e/tests/clientes/clientes-delete.spec.ts` runs (NEW spec), **Then** the following scenarios pass:
    - `delete cliente happy path` — `ApiHelper.createCliente(...)` to seed a cliente, navigate to `/clientes/<id>`, click `btn-eliminar-cliente`, assert dialog opens, click `btn-confirmar-eliminar`, assert: toast `"Cliente eliminado correctamente"` visible, URL changes to `/clientes` (no `/$id` suffix), the deleted cliente NO LONGER appears in the list panel, the right panel shows the default empty placeholder from Story 2.2.
    - `cancel keeps cliente unchanged` — seed cliente, open delete dialog, click `Cancelar`, assert: dialog closes, NO toast visible, URL still `/clientes/<id>`, cliente still in the list, cliente still in the detail panel (use `expect(page.url()).toContain(seededId)`).
    - `esc closes delete dialog without deletion` — seed cliente, open delete dialog, press `Esc`, same assertions as the cancel case.
    - `delete unknown id shows informational toast` — navigate directly to `/clientes/<random-uuid>` (a valid UUID that does not exist in the DB), wait for the not-found view (per Story 2.2 the detail panel renders `cliente-not-found`), then via `page.evaluate` artificially POST a delete to `/api/v1/clientes/<random-uuid>` and validate the API responds 404 + Problem Details. **NOTE:** this E2E test does NOT use the UI to trigger the delete (the not-found view does not render the `Eliminar` button per AC #1); it instead validates the BACKEND 404 contract end-to-end via Playwright's `APIRequestContext`.
    - `delete invalid uuid returns 400` — via `request.delete('/api/v1/clientes/not-a-guid')`, assert 400 + Problem Details title `"Identificador de cliente inválido."`. (R-008 mitigation, API-level.)
    - **EXTEND** `e2e/tests/api/` with a new `clientes-delete.api.spec.ts` covering:
      1. `DELETE /api/v1/clientes/{id}` with valid `id` → 204 + empty body + `X-Contactos-Orphaned` header NOT present.
      2. `DELETE` with unknown `id` → 404 Problem Details, Spanish title, NO stack trace (assert via JSON parse + key absence).
      3. `DELETE` with `not-a-guid` → 400 Problem Details, Spanish title.
      4. `DELETE` then `GET` same id → 404 (sequential, verifies the delete is observable).
      5. `DELETE` twice the same id → first 204, second 404 (REST-semantic idempotency from the caller's POV).
    - `pnpm exec playwright test e2e/tests/clientes/clientes-delete.spec.ts e2e/tests/api/clientes-delete.api.spec.ts` MUST be green when backend + frontend are running.

14. **Given** the full test suite, **When** local verification runs, **Then** the following counts hold:
    - `dotnet build SiesaAgents.sln` → 0 errors, 0 warnings.
    - `dotnet test` → **88/88 green** (81 baseline from Story 2.4 + 7 new from Story 2.5).
    - `pnpm test --run` (frontend) → all green; Story 2.4 baseline 87 + 13 new from Story 2.5 → target **≥ 100/100 green**.
    - `pnpm run build` → zero TypeScript errors, eager chunk ≤ 410 KB gzipped, no new npm dependency.
    - `pnpm exec playwright test e2e/tests/clientes/ e2e/tests/api/clientes-delete.api.spec.ts` → all green when the stack is running.

## Tasks / Subtasks

- [x] Task 1 — Backend: Application command `DeleteClienteCommand` + handler (AC: #4, #6, #7, #10)
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`:
    ```csharp
    namespace SiesaAgents.Application.Clientes.Commands;

    /// <summary>
    /// CQRS command: delete an existing cliente. Story 2.5.
    /// </summary>
    public record DeleteClienteCommand(Guid Id);
    ```
  - [ ] Create `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`:
    ```csharp
    using SiesaAgents.Domain.Clientes.Interfaces;

    namespace SiesaAgents.Application.Clientes.Commands;

    /// <summary>
    /// Handler for <see cref="DeleteClienteCommand"/>. Story 2.5.
    ///
    /// Flow:
    ///   1. Load the tracked entity via <see cref="IClienteRepository.GetByIdForUpdateAsync"/>
    ///      (the existing tracking variant from Story 2.4 — reuse, NO churn).
    ///   2. If null → return <c>(deleted: false, contactosOrphaned: 0)</c> so the endpoint
    ///      can translate to 404 Problem Details.
    ///   3. Call <c>_repository.Remove(entity)</c> + <c>SaveChangesAsync</c>.
    ///   4. Return <c>(deleted: true, contactosOrphaned: 0)</c> for Story 2.5. Story 3.x
    ///      will overload this return to expose the actual orphan count when the
    ///      contactos table lands.
    /// </summary>
    public class DeleteClienteCommandHandler
    {
        private readonly IClienteRepository _repository;

        public DeleteClienteCommandHandler(IClienteRepository repository)
            => _repository = repository;

        public async Task<DeleteClienteResult> Handle(DeleteClienteCommand command, CancellationToken ct)
        {
            var entity = await _repository.GetByIdForUpdateAsync(command.Id, ct);
            if (entity is null)
                return new DeleteClienteResult(Deleted: false, ContactosOrphaned: 0);

            await _repository.RemoveAsync(entity, ct);
            await _repository.SaveChangesAsync(ct);

            // ContactosOrphaned stays at 0 until Story 3.x adds the contactos table
            // and the cascade-SetNull behavior surfaces a real count here.
            return new DeleteClienteResult(Deleted: true, ContactosOrphaned: 0);
        }
    }

    public record DeleteClienteResult(bool Deleted, int ContactosOrphaned);
    ```
  - [ ] Register `builder.Services.AddScoped<DeleteClienteCommandHandler>();` in `Program.cs` immediately AFTER `UpdateClienteCommandHandler` registration (preserve the explicit handler-by-handler style established in Stories 2.1/2.2/2.3/2.4).
  - [ ] **NOTE — no FluentValidation validator for `DeleteClienteCommand`:** the only validation target is `Id`, and the route constraint `{id:guid}` + the sibling catch-all `MapDelete("/{id}", ...)` together cover the only invalid-input case (non-UUID → 400). A `Guid.Empty` body cannot reach the handler because there is no body — the id comes from the route. Skipping the validator avoids a no-op DI registration. Documented in Dev Notes.

- [x] Task 2 — Backend: Extend repository contract + implementation (AC: #4, #6, #10)
  - [ ] Extend `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` adding:
    ```csharp
    /// <summary>
    /// Marks the entity for deletion. The deletion is committed when
    /// <see cref="SaveChangesAsync"/> is awaited. Story 2.5.
    /// </summary>
    Task RemoveAsync(ClienteEntity entity, CancellationToken ct);
    ```
    Place the signature immediately AFTER `AddAsync` and BEFORE `SaveChangesAsync` to keep the interface's read/write grouping coherent.
  - [ ] Implement in `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`:
    ```csharp
    public Task RemoveAsync(ClienteEntity entity, CancellationToken ct)
    {
        _db.Clientes.Remove(entity);
        return Task.CompletedTask;
    }
    ```
    `_db.Clientes.Remove(entity)` is synchronous; wrapping in `Task.CompletedTask` keeps the interface async-shaped without forcing a needless `Task.Run`. The actual DB round-trip happens in `SaveChangesAsync(ct)`.

- [x] Task 3 — Backend: Endpoint `DELETE /api/v1/clientes/{id:guid}` (AC: #4, #6, #7, #8, #10)
  - [ ] Modify `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`. Append a `MapDelete` on the existing `group` (place it AFTER the `MapPut("/{id:guid}", ...)` route AND BEFORE the catch-all `MapGet("/{id}", ...)` / `MapPut("/{id}", ...)` so the GUID route still wins for valid UUIDs):
    ```csharp
    // DELETE /api/v1/clientes/{id:guid} — Story 2.5. 204 No Content on success;
    // 404 Problem Details if the cliente does not exist. Sets the
    // X-Contactos-Orphaned header to the count of contactos whose FK was nulled
    // by the cascade-SET-NULL behavior (always 0 in Story 2.5 until the
    // contactos table lands in Story 3.x; the header is OMITTED when the count
    // is 0 so frontend defaults to the standard success toast).
    group.MapDelete("/{id:guid}", async (
        Guid id,
        DeleteClienteCommandHandler handler,
        CancellationToken ct) =>
    {
        var result = await handler.Handle(new DeleteClienteCommand(id), ct);

        if (!result.Deleted)
        {
            return Results.Problem(
                title: "Cliente no encontrado.",
                statusCode: StatusCodes.Status404NotFound,
                type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                instance: $"/api/v1/clientes/{id}");
        }

        if (result.ContactosOrphaned > 0)
        {
            return Results.NoContent()
                .WithHeaders(new() { ["X-Contactos-Orphaned"] = result.ContactosOrphaned.ToString() });
        }

        return Results.NoContent();
    })
    .WithName("DeleteCliente")
    .Produces(StatusCodes.Status204NoContent)
    .ProducesProblem(StatusCodes.Status404NotFound);
    ```
  - [ ] **API contract caveat — `Results.NoContent()` with custom headers:** Minimal API's `Results.NoContent()` returns an `IResult` that does not directly accept headers. The correct pattern is either (a) return a `TypedResults.NoContent()` and append the header via `context.Response.Headers` in a custom result, or (b) write a thin `Results.Extensions` helper. The implementer SHOULD pick the cleanest option that compiles with .NET 10's Minimal API surface. **A safe fallback is to use the lower-level pattern:**
    ```csharp
    group.MapDelete("/{id:guid}", async (
        Guid id,
        DeleteClienteCommandHandler handler,
        HttpContext httpContext,
        CancellationToken ct) =>
    {
        var result = await handler.Handle(new DeleteClienteCommand(id), ct);

        if (!result.Deleted)
        {
            return Results.Problem(
                title: "Cliente no encontrado.",
                statusCode: StatusCodes.Status404NotFound,
                type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                instance: $"/api/v1/clientes/{id}");
        }

        if (result.ContactosOrphaned > 0)
        {
            httpContext.Response.Headers.Append(
                "X-Contactos-Orphaned",
                result.ContactosOrphaned.ToString());
        }

        return Results.NoContent();
    })
    ```
    This pattern is wire-format-equivalent and works across .NET 10's minimal API. Adopt this in the implementation.
  - [ ] **Sibling catch-all for non-UUID DELETE** (AC #8 — mirrors the Story 2.4 PUT pattern and Story 2.2 GET pattern):
    ```csharp
    // Sibling catch-all for DELETE — Story 2.5 AC #8. Non-UUID segments to DELETE
    // must return 400 Problem Details (otherwise MapFallback would 404 them).
    group.MapDelete("/{id}", (string id) =>
        Results.Problem(
            title: "Identificador de cliente inválido.",
            detail: "El identificador debe ser un UUID válido.",
            statusCode: StatusCodes.Status400BadRequest,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            instance: $"/api/v1/clientes/{id}"))
        .WithName("DeleteClienteInvalid")
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ExcludeFromDescription();
    ```

- [x] Task 4 — Backend: Integration tests for DELETE (AC: #10)
  - [ ] Create `backend/tests/SiesaAgents.IntegrationTests/ClientesDeleteEndpointTests.cs` reusing the `SiesaAgentsApiFactory` + `InMemoryFactory` + reflection-based `SeedCliente` helper from `ClientesUpdateEndpointTests.cs`:
    - `DeleteCliente_WithExistingId_Returns204NoContent` — seed, DELETE, assert 204 + verify the cliente row is gone (open a fresh scope, query the DbSet, expect no row with that id).
    - `DeleteCliente_WhenNotFound_Returns404ProblemDetails` — DELETE random `Guid.NewGuid()`, assert 404 + Problem Details + Spanish title + AssertNoInternalLeakage.
    - `DeleteCliente_WithInvalidGuid_Returns400ProblemDetails` — DELETE `/api/v1/clientes/not-a-guid`, assert 400 + Problem Details + Spanish title + AssertNoInternalLeakage.
    - `DeleteCliente_ResponseHasNoBody` — DELETE existing id, assert `response.Content.Headers.ContentLength` is 0 OR the body string is empty after `ReadAsStringAsync()`.
    - `DeleteCliente_AfterDelete_GetByIdReturns404` — seed, DELETE, GET same id, assert 404 (sequential test that locks in observable deletion).
    - `DeleteCliente_IsIdempotentLikeRest_SecondDeleteReturns404` — seed, DELETE → 204, DELETE → 404. Documents the contract.
    - `DeleteCliente_OmitsContactosOrphanedHeader_WhenNoContactos` — seed cliente (no contactos table yet — implicit), DELETE, assert response headers do NOT contain `X-Contactos-Orphaned`. Locks the forward-compat header contract.
  - [ ] **Helper extraction (optional but encouraged):** if `AssertNoInternalLeakage` is duplicated across `ClientesUpdateEndpointTests` and the new file, extract it to `backend/tests/SiesaAgents.IntegrationTests/Helpers/ProblemDetailsAssertions.cs`. Otherwise, copy the helper verbatim — both are acceptable.
  - [ ] All existing 81 tests MUST remain green. New count: **88/88 green**.

- [x] Task 5 — Frontend: Domain + Infrastructure — `delete` method (AC: #4, #11)
  - [ ] Extend `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` adding the `delete` signature:
    ```ts
    /**
     * Result of a `DELETE /api/v1/clientes/{id}` call. Returned by the
     * infrastructure layer so the application hook can branch on the
     * `X-Contactos-Orphaned` header without inspecting raw Axios responses
     * from the consumer side.
     */
    export interface DeleteClienteResult {
      contactosOrphaned: number
    }

    export interface IClienteRepository {
      getAll(): Promise<Cliente[]>
      getById(id: string): Promise<Cliente | null>
      create(input: CreateClienteInput): Promise<Cliente>
      update(id: string, input: UpdateClienteInput): Promise<Cliente>
      delete(id: string): Promise<DeleteClienteResult>
    }
    ```
  - [ ] Extend `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts`:
    ```ts
    delete: async (id) => {
      const r = await apiClient.delete<void>(`/api/v1/clientes/${id}`)
      const headerValue = r.headers['x-contactos-orphaned']
      const contactosOrphaned = headerValue ? Number.parseInt(headerValue, 10) : 0
      return { contactosOrphaned: Number.isFinite(contactosOrphaned) ? contactosOrphaned : 0 }
    },
    ```
    DO NOT catch axios errors here — propagate them so the application layer can branch on `404` (informational toast) vs `5xx` / network (red toast). The lowercase header key (`x-contactos-orphaned`) is the Axios + browser-normalized form (HTTP headers are case-insensitive but Node + Axios lower-case them).

- [x] Task 6 — Frontend: Application hook `useDeleteCliente` (AC: #4, #11)
  - [ ] Create `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`:
    ```ts
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
    import type { DeleteClienteResult } from '../domain/IClienteRepository'

    interface DeleteArgs {
      id: string
    }

    /**
     * TanStack Query mutation hook for deleting a cliente. Story 2.5.
     *
     * On success:
     *   - Invalidates the list: `['clientes']`.
     *   - Removes the single-cliente cache: `removeQueries({ queryKey: ['clientes', id] })`.
     *     The row no longer exists, so refetching it would 404; removing the cache
     *     entry prevents stale data flashes if the user navigates back to the
     *     same id via the browser history.
     *
     * The hook DOES NOT fire toasts, close the dialog, or navigate — those
     * concerns live in the consuming component (`ClienteDeleteDialog`) per the
     * architecture.md §Process Patterns separation of concerns rule.
     *
     * The returned `DeleteClienteResult` carries `contactosOrphaned: number`
     * for the consuming component to branch the success toast copy (AC #5).
     */
    export function useDeleteCliente() {
      const queryClient = useQueryClient()
      return useMutation<DeleteClienteResult, unknown, DeleteArgs>({
        mutationFn: ({ id }) => clienteApiRepository.delete(id),
        onSuccess: (_data, variables) => {
          queryClient.invalidateQueries({ queryKey: ['clientes'] })
          queryClient.removeQueries({ queryKey: ['clientes', variables.id] })
        },
      })
    }
    ```
  - [ ] **Optimistic delete — deliberately NOT implemented in 2.5:** an optimistic delete would remove the row from the cache BEFORE the server confirms. The trade-off is the same as Stories 2.3 + 2.4: rollback on 5xx requires `onMutate` snapshot + `onError` restore via `setQueryData` on both `['clientes']` AND `['clientes', id]`. The simpler "wait → confirm → invalidate" path is well within the NFR2 2s budget. The `Confirmar` button shows `"Eliminando…"` while pending. Documented in Dev Notes.

- [x] Task 7 — Frontend: New `ClienteDeleteDialog` component (AC: #2, #3, #4, #5, #7, #9, #11)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/ClienteDeleteDialog.tsx`:
    ```tsx
    import { useEffect, useRef } from 'react'
    import axios from 'axios'
    import { useNavigate } from '@tanstack/react-router'
    import { toast } from 'siesa-ui-kit'
    import {
      Dialog,
      DialogContent,
      DialogFooter,
      DialogHeader,
      DialogTitle,
    } from '@/shared/components/ui/dialog'
    import { useDeleteCliente } from '../application/useDeleteCliente'

    interface ClienteDeleteDialogProps {
      open: boolean
      onOpenChange: (open: boolean) => void
      clienteId: string
    }

    /**
     * Destructive confirmation dialog for deleting a cliente. Story 2.5.
     *
     * Renders an alertdialog with `[Cancelar]` (focused by default — safe
     * default for destructive actions per UX spec §Navegación por teclado)
     * and `[Confirmar]` (red destructive). The dialog stays open while the
     * mutation is pending and switches the Confirmar label to `"Eliminando…"`.
     *
     * Behavior:
     *   - 204 (success):       success toast + close + navigate to /clientes.
     *   - 204 + orphan header: compound toast (longer copy, 5s).
     *   - 404 (vanished row):  informational toast + close + navigate (treated
     *                           as soft-success — the user's intent is honored
     *                           by a different mechanism).
     *   - 5xx / network:       red toast + dialog STAYS OPEN with retry possible.
     */
    export function ClienteDeleteDialog({
      open,
      onOpenChange,
      clienteId,
    }: ClienteDeleteDialogProps) {
      const navigate = useNavigate()
      const mutation = useDeleteCliente()
      const cancelBtnRef = useRef<HTMLButtonElement>(null)

      // Focus the Cancelar button when the dialog opens — safe default for a
      // destructive action (per UX spec §Modal & Overlay Patterns).
      useEffect(() => {
        if (open) {
          // Defer focus to the next paint so Radix has mounted the content.
          const timer = setTimeout(() => cancelBtnRef.current?.focus(), 0)
          return () => clearTimeout(timer)
        }
      }, [open])

      function handleSuccess(contactosOrphaned: number) {
        if (contactosOrphaned > 0) {
          toast.success(
            'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.',
            { duration: 5000 },
          )
        } else {
          toast.success('Cliente eliminado correctamente', { duration: 3000 })
        }
        onOpenChange(false)
        navigate({ to: '/clientes' })
      }

      function handleConfirm() {
        mutation.mutate(
          { id: clienteId },
          {
            onSuccess: (result) => handleSuccess(result.contactosOrphaned),
            onError: (err) => {
              if (axios.isAxiosError(err) && err.response?.status === 404) {
                // The row vanished between fetch and DELETE — treat as soft-success.
                toast('Cliente no encontrado. La lista se actualizó.', {
                  duration: 5000,
                  // siesa-ui-kit toast: pass an `info` / `warning` variant if
                  // available; otherwise fall back to neutral.
                })
                onOpenChange(false)
                navigate({ to: '/clientes' })
                return
              }

              // 5xx + network — dialog stays open, red toast, user can retry.
              toast.error('No se pudo eliminar. Intenta de nuevo.', { duration: 5000 })
            },
          },
        )
      }

      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            data-testid="cliente-delete-dialog"
            role="alertdialog"
            className="max-w-md"
          >
            <DialogHeader>
              <DialogTitle>¿Eliminar este cliente?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600">
              Esta acción no se puede deshacer.
            </p>
            <DialogFooter>
              <button
                type="button"
                ref={cancelBtnRef}
                data-testid="btn-cancelar-eliminar"
                onClick={() => onOpenChange(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="btn-confirmar-eliminar"
                onClick={handleConfirm}
                disabled={mutation.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {mutation.isPending ? 'Eliminando…' : 'Confirmar'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    }
    ```
  - [ ] **Why a NEW component (not extending `ClienteForm`):** `ClienteForm` is a `dialog`/form pair tied to React Hook Form + Zod. The delete confirmation is a simple `alertdialog` with no form state — sharing the shell would force unrelated form props into the destructive path. The new component is small (~70 LOC) and reuses the `Dialog` shadcn primitive.
  - [ ] **The `role="alertdialog"` (vs `role="dialog"`):** WAI-ARIA distinguishes the two — `alertdialog` is for confirmation prompts requiring immediate user attention. Radix's `Dialog` does NOT natively switch the role; setting `role="alertdialog"` on the `DialogContent` overrides the default `dialog` role. (Same accessibility benefit as the UX spec's recommendation to use siesa-ui-kit `Alert` for confirmation.)
  - [ ] **siesa-ui-kit `Alert` vs shadcn `Dialog`:** the UX spec §"Confirmación de eliminación" recommends siesa-ui-kit `Alert`. Story 2.5 reuses the shadcn `Dialog` primitive (already imported via Stories 2.3/2.4) to avoid introducing a new dependency and to keep the destructive flow visually consistent with the create/edit dialogs. The accessibility role is upgraded via `role="alertdialog"` and the destructive button uses the brand red. Documented in Dev Notes as an intentional variance.

- [x] Task 8 — Frontend: Wire `"Eliminar"` button into `ClienteDetailView` (AC: #1, #2, #11)
  - [ ] Modify `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx`:
    1. Add local state `const [isDeleteOpen, setIsDeleteOpen] = useState(false)` ALONGSIDE the existing `isEditOpen` state (Story 2.4).
    2. Import `ClienteDeleteDialog` from `./ClienteDeleteDialog`.
    3. ONLY in the `data` (loaded valid cliente) branch — update the top action bar from a single right-aligned `[Editar]` button to a two-button bar `[Eliminar] ... [Editar]`:
       ```tsx
       <div className="flex items-center justify-end gap-2 p-6 pb-0">
         <button
           type="button"
           data-testid="btn-eliminar-cliente"
           onClick={() => setIsDeleteOpen(true)}
           aria-label="Eliminar cliente"
           className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/40"
         >
           Eliminar
         </button>
         <button
           type="button"
           data-testid="btn-editar-cliente"
           onClick={() => setIsEditOpen(true)}
           aria-label="Editar cliente"
           className="rounded-md bg-[#0e79fd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154ca9] focus:outline-none focus:ring-2 focus:ring-[#0e79fd]/40"
         >
           Editar
         </button>
       </div>
       ```
       Both buttons live in the SAME `flex items-center justify-end gap-2` container so they right-align together with an 8px gap. `Eliminar` is FIRST in source order so screen readers announce the destructive action first, matching the visual order (LTR locale).
    4. Render `<ClienteDeleteDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} clienteId={data.id} />` AS A SIBLING of the existing `<ClienteForm mode="edit" />` (co-located inside the same `data` branch).
    5. Both dialogs are mounted unconditionally inside the `data` branch — `open` props gate their visibility (per shadcn Dialog convention).

- [x] Task 9 — Frontend: Component tests (AC: #11)
  - [ ] Create `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDeleteDialog.test.tsx`:
    - `ClienteDeleteDialog_renders_title_and_two_buttons_with_initial_focus_on_cancel`
    - `ClienteDeleteDialog_cancel_button_closes_without_request` (MSW `onUnhandledRequest: 'error'`)
    - `ClienteDeleteDialog_esc_closes_without_request`
    - `ClienteDeleteDialog_overlay_click_closes_without_request`
    - `ClienteDeleteDialog_confirm_204_fires_success_toast_and_navigates` — spy on `useNavigate` return value, MSW returns 204, assert toast text + navigation call + cache invalidate + cache remove.
    - `ClienteDeleteDialog_confirm_204_with_orphan_header_shows_compound_toast` — MSW handler sets `X-Contactos-Orphaned: 2` header on 204; assert toast text matches the compound copy.
    - `ClienteDeleteDialog_confirm_404_treats_as_success_with_informational_toast` — MSW returns 404 + Problem Details body; assert toast text matches the informational copy, dialog closes, navigation fires.
    - `ClienteDeleteDialog_confirm_500_keeps_dialog_open_and_red_toast` — MSW returns 500; assert dialog still open, red toast text, `Confirmar` button re-enabled (not stuck in disabled state).
    - `ClienteDeleteDialog_confirm_network_error_keeps_dialog_open_and_red_toast` — MSW configured to throw a network error; same assertions as the 500 path.
    - Use a fresh `QueryClient` + `MemoryRouter`-equivalent wrapper for each test. Mock `siesa-ui-kit` `toast` like Story 2.3 does (the existing `ClienteForm.test.tsx` has the canonical setup — reuse it).
  - [ ] Create `frontend/src/modules/crm/clientes/application/__tests__/useDeleteCliente.test.tsx`:
    - `useDeleteCliente_invalidates_list_and_removes_single_cache_on_success`
    - `useDeleteCliente_returns_contactos_orphaned_zero_when_header_absent`
    - `useDeleteCliente_returns_contactos_orphaned_count_when_header_present` — MSW handler sets `X-Contactos-Orphaned: 3`; assert `mutation.data.contactosOrphaned === 3`.
    - `useDeleteCliente_propagates_404_as_axios_error_with_status_404`
    - `useDeleteCliente_propagates_500_as_axios_error_with_status_500`
  - [ ] Update `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx`:
    - `ClienteDetailView_renders_btn_eliminar_cliente_when_data_loaded` — mount with mocked `useCliente` returning a full `Cliente`, assert `btn-eliminar-cliente` testid visible with red destructive styling and the correct `aria-label`.
    - `ClienteDetailView_does_not_render_btn_eliminar_when_loading_or_error_or_not_found` — three sub-cases (`isLoading`, `isError`, `data === null`); assert the button is NOT present in any of them.
    - `ClienteDetailView_btn_eliminar_opens_delete_dialog` — click the button, assert `cliente-delete-dialog` testid visible with the correct title `"¿Eliminar este cliente?"`.
    - **Existing Story 2.4 tests for the Editar button MUST remain green.**
  - [ ] All frontend tests run via `pnpm test --run`. Story 2.4 baseline was 87/87 green; Story 2.5 adds ~13 new specs (5 for `ClienteDeleteDialog`, 5 for `useDeleteCliente`, 3 for `ClienteDetailView`) → target **≥ 100/100 green**.

- [x] Task 10 — Frontend: Build verification (AC: #12)
  - [ ] Run `pnpm run build`. Confirm:
    - Zero TypeScript errors in strict mode.
    - Eager chunk gzipped size ≤ 410 KB (Story 2.4 baseline 404.53 KB; Story 2.5 adds the new code to the lazy `clientes._clienteId-*.js` chunk, not the eager bundle).
    - The clientes lazy chunk may grow by < +3 KB gzipped (`useDeleteCliente` ~0.5 KB, `ClienteDeleteDialog` ~1.5 KB).
    - NO new npm dependency is added.

- [x] Task 11 — E2E: Update Playwright POM + new specs (AC: #13)
  - [ ] Extend `e2e/pages/clientes.page.ts`:
    - Replace the existing `btnEliminar` locator (it currently matches `getByRole('button', { name: /eliminar/i })` which is now ambiguous — the dialog's Cancelar button does not include "Eliminar" but the destructive button label DOES). Switch to testid-based locators:
      ```ts
      this.btnEliminarCliente = page.getByTestId('btn-eliminar-cliente')
      this.deleteDialog = page.getByTestId('cliente-delete-dialog')
      this.btnConfirmarEliminar = page.getByTestId('btn-confirmar-eliminar')
      this.btnCancelarEliminar = page.getByTestId('btn-cancelar-eliminar')
      this.toastDeleteSuccess = page.getByText('Cliente eliminado correctamente')
      this.toastDeleteOrphan = page.getByText('Sus contactos asociados quedaron sin cliente asignado.')
      this.toastDeleteNotFound = page.getByText('Cliente no encontrado. La lista se actualizó.')
      this.toastDeleteError = page.getByText('No se pudo eliminar. Intenta de nuevo.')
      ```
    - Keep the existing `btnEliminar` + `btnConfirmarEliminar` properties as aliases pointing at the new locators to avoid breaking any existing references in `clientes-crud.spec.ts` (if any).
  - [ ] Create `e2e/tests/clientes/clientes-delete.spec.ts` covering AC #13 scenarios 1–3:
    - `delete cliente happy path` — `ApiHelper.createCliente(...)` to seed, navigate to `/clientes/<id>`, click `btn-eliminar-cliente`, dialog opens, click `btn-confirmar-eliminar`, assert toast text + URL changes + cliente disappears from list + detail panel returns to default.
    - `cancel keeps cliente unchanged` — seed, open dialog, click `Cancelar`, assert no toast + URL unchanged + cliente still present.
    - `esc closes delete dialog` — seed, open dialog, `page.keyboard.press('Escape')`, same assertions as cancel.
  - [ ] Create `e2e/tests/api/clientes-delete.api.spec.ts` covering AC #13 API scenarios (no UI involvement — pure REST contract):
    - `DELETE valid id returns 204 with no body and no X-Contactos-Orphaned header`
    - `DELETE unknown id returns 404 Problem Details with Spanish title and no stack trace`
    - `DELETE non-uuid returns 400 Problem Details with Spanish title and no stack trace`
    - `DELETE then GET same id returns 404`
    - `DELETE twice returns 204 then 404`
  - [ ] `pnpm exec playwright test e2e/tests/clientes/clientes-delete.spec.ts e2e/tests/api/clientes-delete.api.spec.ts` must be green when backend + frontend are running.

- [x] Task 12 — Verify & document (AC: all)
  - [ ] Run end-to-end verification locally:
    - `dotnet build SiesaAgents.sln` → 0/0 errors and warnings.
    - `dotnet test` → **88/88 green** (81 baseline + 7 new from this story).
    - `pnpm test --run` → all frontend tests green (Story 2.4 suite intact + 13 new specs from this story).
    - `pnpm run build` → zero TS errors, eager chunk ≤ 410 KB gzipped, no new npm dependency.
    - Manual smoke: `dotnet run --project src/SiesaAgents.API` + `pnpm dev` → navigate to `http://localhost:5173/clientes`, create a cliente, click it, click `Eliminar`, dialog opens, click `Confirmar` → toast `"Cliente eliminado correctamente"` + URL changes to `/clientes` + cliente disappears from list. Repeat with `Cancelar` → cliente persists, no navigation.
    - `pnpm exec playwright test e2e/tests/clientes/ e2e/tests/api/clientes-delete.api.spec.ts` → all green when stack running.
  - [ ] Append Completion Notes covering: exact frontend bundle size delta vs Story 2.4; whether `Results.NoContent()` + custom header pattern compiled cleanly under .NET 10 (or which fallback the implementer used); FluentValidation skipped for `DeleteClienteCommand` confirmed (no validator file created); the result of `DeleteCliente_OmitsContactosOrphanedHeader_WhenNoContactos` (locks the forward-compat header contract); and whether the `404-treated-as-success` UX choice held under manual testing (some users may prefer a "your action could not be applied" message — capture feedback if any).

## Dev Notes

### Architecture Compliance

Per `_bmad-output/planning-artifacts/architecture.md` and `.claude/agent-memory/sa-quick-dev/company-standards.md`:

- **CQRS** — `DeleteClienteCommand` (write) + `DeleteClienteCommandHandler` mirror the Create / Update patterns from Stories 2.3 + 2.4. Commands live under `Application/Clientes/Commands/`; handlers register as `Scoped` in `Program.cs`. The handler returns a `DeleteClienteResult` record so the endpoint can distinguish "not found" (translate to 404) from "deleted with N orphaned contactos" (translate to 204 + `X-Contactos-Orphaned` header).
- **No FluentValidation validator for `DeleteClienteCommand`** — the only input is `Id` and the route constraint `{id:guid}` + sibling catch-all `MapDelete("/{id}", ...)` already enforce UUID syntax at the HTTP layer. A handler-level validator would be a no-op. Same pattern as the existing `MapGet("/{id:guid}", ...)` from Story 2.2 (no FluentValidation either).
- **Problem Details RFC 7807** — `Results.Problem(...)` for 404 + 400 emits `application/problem+json` automatically. NO `stackTrace`, `exception`, or `detail` exposing internal types is included (NFR6).
- **`DateTimeOffset`** — N/A for delete; no new timestamps land.
- **TanStack Query mutation pattern** — `useDeleteCliente` invalidates `['clientes']` AND removes `['clientes', id]` from the cache. The removal is intentional: the row no longer exists, so leaving a stale `['clientes', id]` entry would surface incorrect data if the user navigates back to `/clientes/<deleted-id>` via the browser history. `removeQueries` short-circuits that path → `useCliente` fires a fresh fetch → 404 → not-found view from Story 2.2.
- **Spanish UI** — every visible string is Spanish: button labels (`Eliminar`, `Confirmar`, `Cancelar`), dialog title (`¿Eliminar este cliente?`), descriptive text (`Esta acción no se puede deshacer.`), toasts, ARIA labels. Code (variables, hooks, types) is English.
- **siesa-ui-kit vs shadcn Dialog** — the UX spec §"Confirmación de eliminación" recommends siesa-ui-kit `Alert`. Story 2.5 reuses the shadcn `Dialog` primitive already imported via Stories 2.3 + 2.4 (avoid introducing a new dependency surface). The accessibility upgrade comes from `role="alertdialog"` on the content. The destructive button uses `bg-red-600` per UX spec §Button Hierarchy. Documented as intentional variance.
- **MasterCrud — explicitly not used** — same rationale as Stories 2.1 / 2.2 / 2.3 / 2.4. The delete confirmation does not warrant the MasterCrud orchestrator; a focused destructive alertdialog is the right abstraction.
- **`Scalar` not Swagger** — the new `MapDelete("/{id:guid}")` chain `.Produces(204)` + `.ProducesProblem(404)` decorations supply Scalar with full OpenAPI metadata.
- **WCAG 2.1 AA** — the `Eliminar` button has `aria-label="Eliminar cliente"`. The dialog uses `role="alertdialog"` (more appropriate than the default `dialog` for destructive confirmations) and the initial focus lands on the safer `Cancelar` button per UX spec §Navegación por teclado. `Esc` + click-outside + ✕ all close without firing the DELETE.

### Contactos Coupling Strategy (CRITICAL — FR25)

The story description calls out a CASE ESPECIAL: when a cliente has associated contactos, the deletion MUST orphan them (`SET NULL` on `cliente_id`) and the toast copy switches to the compound message.

**Reality at Story 2.5:** the `contactos` table does NOT exist yet — it is created in Story 3.1. The architecture commits to `ON DELETE SET NULL` (architecture.md line 229: `cliente_id uuid nullable FK → clientes.id ON DELETE SET NULL`) at the schema level, but Story 2.5 has nothing to orphan.

**Forward-compat strategy adopted by this story:**

1. **Backend handler returns a `DeleteClienteResult(bool Deleted, int ContactosOrphaned)`** — `ContactosOrphaned` is ALWAYS `0` in Story 2.5. Story 3.x will inject an `IContactoRepository` into the handler (or add a `CountContactosByClienteIdAsync` to a new repository) and populate the field with the real count.
2. **Endpoint sets the `X-Contactos-Orphaned: N` response header** ONLY when `N > 0`. In Story 2.5 this branch is unreachable (the count is always 0), so the header is omitted from every response.
3. **Frontend `clienteApiRepository.delete(...)` reads the header** and surfaces a `DeleteClienteResult { contactosOrphaned: number }` to the consumer. When the header is absent, `contactosOrphaned` is `0`.
4. **`ClienteDeleteDialog` branches the toast copy** on `result.contactosOrphaned > 0`. In Story 2.5 the frontend ALWAYS hits the standard toast path because the count is 0; in Story 3.x+, the compound toast kicks in automatically without component changes.
5. **The `DeleteCliente_OmitsContactosOrphanedHeader_WhenNoContactos` integration test** explicitly locks the Story 2.5 reality (no contactos → no header) so a future Story 3.x change must EXTEND, not BREAK, the contract.

**Database-level cascade (out of scope for Story 2.5 implementation, IN scope for the schema contract):**

When Story 3.1 lands the `contactos` table, the migration MUST declare:
```csharp
modelBuilder.Entity<ContactoEntity>()
    .HasOne<ClienteEntity>()
    .WithMany()
    .HasForeignKey(c => c.ClienteId)
    .IsRequired(false)
    .OnDelete(DeleteBehavior.SetNull);
```
This guarantees that `_db.Clientes.Remove(entity)` in Story 2.5's handler will NOT fail with a FK violation once contactos exist — the FK is automatically nulled by PostgreSQL.

**Why we don't manually count + set the header in Story 2.5:** counting from a non-existent table is impossible; faking a `0` count via the existing handler is the simplest forward-compat. The header behavior is wired end-to-end via the MSW test `ClienteDeleteDialog_confirm_204_with_orphan_header_shows_compound_toast` which fabricates the header. This proves the frontend path is correct without requiring real data.

### Backend Endpoint Pattern

```csharp
group.MapDelete("/{id:guid}", async (
    Guid id,
    DeleteClienteCommandHandler handler,
    HttpContext httpContext,
    CancellationToken ct) =>
{
    var result = await handler.Handle(new DeleteClienteCommand(id), ct);

    if (!result.Deleted)
    {
        return Results.Problem(
            title: "Cliente no encontrado.",
            statusCode: StatusCodes.Status404NotFound,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
            instance: $"/api/v1/clientes/{id}");
    }

    if (result.ContactosOrphaned > 0)
    {
        httpContext.Response.Headers.Append(
            "X-Contactos-Orphaned",
            result.ContactosOrphaned.ToString());
    }

    return Results.NoContent();
})
.WithName("DeleteCliente")
.Produces(StatusCodes.Status204NoContent)
.ProducesProblem(StatusCodes.Status404NotFound);
```

Notes:
- The 404 path uses `Results.Problem(...)` directly (not the global `ExceptionHandlingMiddleware`) — same pattern as the GET-by-id + PUT routes from Stories 2.2 + 2.4.
- The `X-Contactos-Orphaned` header is only set when the count is `> 0`. Forward-compat: in Story 2.5 the count is always 0, so this branch is unreachable — the header is omitted.
- The catch-all `MapDelete("/{id}", ...)` returns 400 Problem Details for non-UUID segments. Registered AFTER the GUID route so the constrained route still wins for valid UUIDs.

### Handler Pattern

```csharp
namespace SiesaAgents.Application.Clientes.Commands;

public class DeleteClienteCommandHandler
{
    private readonly IClienteRepository _repository;

    public DeleteClienteCommandHandler(IClienteRepository repository)
        => _repository = repository;

    public async Task<DeleteClienteResult> Handle(DeleteClienteCommand command, CancellationToken ct)
    {
        var entity = await _repository.GetByIdForUpdateAsync(command.Id, ct);
        if (entity is null)
            return new DeleteClienteResult(Deleted: false, ContactosOrphaned: 0);

        await _repository.RemoveAsync(entity, ct);
        await _repository.SaveChangesAsync(ct);

        return new DeleteClienteResult(Deleted: true, ContactosOrphaned: 0);
    }
}

public record DeleteClienteResult(bool Deleted, int ContactosOrphaned);
```

Reuses `GetByIdForUpdateAsync` (tracking variant) from Story 2.4 so EF Core can track the entity for removal. NO churn to existing repository methods.

### Backend Repository — New Method

```csharp
// IClienteRepository.cs
Task RemoveAsync(ClienteEntity entity, CancellationToken ct);

// ClienteRepository.cs
public Task RemoveAsync(ClienteEntity entity, CancellationToken ct)
{
    _db.Clientes.Remove(entity);
    return Task.CompletedTask;
}
```

`_db.Clientes.Remove(entity)` is synchronous; wrapping in `Task.CompletedTask` keeps the interface async-shaped without forcing a needless `Task.Run`.

### Frontend `useDeleteCliente` Pattern

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clienteApiRepository } from '../infrastructure/clienteApiRepository'
import type { DeleteClienteResult } from '../domain/IClienteRepository'

interface DeleteArgs {
  id: string
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()
  return useMutation<DeleteClienteResult, unknown, DeleteArgs>({
    mutationFn: ({ id }) => clienteApiRepository.delete(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.removeQueries({ queryKey: ['clientes', variables.id] })
    },
  })
}
```

Toast firing, dialog close, navigation all happen in the consuming component (`ClienteDeleteDialog`) — same separation-of-concerns rule as Stories 2.3's `useCreateCliente` and 2.4's `useUpdateCliente`.

### Frontend Error Handling Decision Tree (delete)

```
err
│
├── axios.isAxiosError(err) && status === 404
│     → toast('Cliente no encontrado. La lista se actualizó.', { duration: 5000, info })
│     → onOpenChange(false)
│     → navigate({ to: '/clientes' })
│     → cache invalidated by useDeleteCliente's onSuccess? — NO, this is the
│       error branch. The `useDeleteCliente` hook only invalidates on success.
│       The consuming component MUST manually invalidate on the 404 path to
│       keep the list panel in sync.
│
└── else (5xx, network, anything else)
      → toast.error('No se pudo eliminar. Intenta de nuevo.')
      → dialog STAYS OPEN
      → Confirmar button re-enabled (mutation.isPending → false after error)
```

**IMPLEMENTATION TWEAK — manual invalidate on 404 path:** the `useDeleteCliente` hook's `onSuccess` only fires on a 2xx response. A 404 lands in `onError`. To keep the list in sync after a 404 (the deleted-elsewhere row is no longer there), the component MUST manually call `queryClient.invalidateQueries({ queryKey: ['clientes'] })` AND `queryClient.removeQueries({ queryKey: ['clientes', clienteId] })` inside the 404 branch of the `onError` handler. Add `const queryClient = useQueryClient()` to `ClienteDeleteDialog` and invoke both calls before the navigation:

```tsx
if (axios.isAxiosError(err) && err.response?.status === 404) {
  queryClient.invalidateQueries({ queryKey: ['clientes'] })
  queryClient.removeQueries({ queryKey: ['clientes', clienteId] })
  toast(/* informational copy */)
  onOpenChange(false)
  navigate({ to: '/clientes' })
  return
}
```

This is reflected in the test `ClienteDeleteDialog_confirm_404_treats_as_success_with_informational_toast` (assert both cache calls are made on the 404 path).

### Frontend Layout (Story 2.5 changes — diff vs Story 2.4)

```
┌────────┬───────────────────────────┬───────────────────────────────────────┐
│  Nav   │  Clientes panel (280px)  │  Detail panel (flex-1)                │
│ Rail   │  ┌─────────────────────┐ │  ┌──────────────────────────────────┐ │
│ (72)   │  │ [Nuevo cliente]     │ │  │ [Eliminar] [Editar] ◄ NEW (2.5)  │ │
│        │  ├─────────────────────┤ │  │ Nombre   Cliente A                │ │
│        │  │ search input        │ │  │ NIT/RUC  900.123.456-7            │ │
│        │  ├─────────────────────┤ │  │ Teléfono +57 300 000 0000         │ │
│        │  │ Cliente A ◄ active  │ │  │ Ciudad   Medellín                 │ │
│        │  │ 900.123.456-7       │ │  └──────────────────────────────────┘ │
│        │  └─────────────────────┘ │                                       │
└────────┴───────────────────────────┴───────────────────────────────────────┘

Delete Confirmation Dialog:
┌─────────────────────────────────────┐
│  ¿Eliminar este cliente?    [✕]    │
├─────────────────────────────────────┤
│  Esta acción no se puede deshacer. │
│                                     │
├─────────────────────────────────────┤
│           [Cancelar]  [Confirmar]   │
└─────────────────────────────────────┘
```

Button styles:
- Destructive (`Eliminar`, `Confirmar`): `bg-red-600 text-white font-semibold hover:bg-red-700` (UX spec §Button Hierarchy).
- Secondary (`Cancelar`): `border border-slate-300 hover:bg-slate-50` (same as Stories 2.3/2.4).

### Why NOT Optimistic Delete?

- **Rollback complexity** — would require `onMutate` snapshot of BOTH `['clientes']` AND `['clientes', id]` caches, then `setQueryData` rollback on `onError`. The deleted entity could be ANYWHERE in the array; restoring it at the correct sort position requires a deep copy.
- **NFR2 budget** — a 2s round-trip with a `Eliminando…` button label is acceptable UX. The dialog stays mounted, so the user sees the work-in-progress affordance clearly.
- **Error UX consistency** — 5xx + network errors keep the dialog open with a red toast and the `Confirmar` button re-enabled, matching the Stories 2.3 + 2.4 mutation patterns. Optimistic would need an additional "your delete failed and was rolled back" flash.

Decision: **pure invalidation + removeQueries on success, no optimistic delete.**

### Idempotency Semantics

REST guidance says DELETE SHOULD be idempotent (multiple identical calls have the same effect as one). Our implementation is **caller-observable idempotent in effect** (system state is identical after 1 or N calls) but **NOT response-idempotent** (the first call returns 204, subsequent calls return 404). This is the dominant convention in production REST APIs and is documented by the test `DeleteCliente_IsIdempotentLikeRest_SecondDeleteReturns404`.

The frontend handles the 404 path as a soft-success (AC #7) precisely because of this: if the user double-clicked `Confirmar` and the first click already deleted the row, the second click's 404 is honored visually as "your intent was applied" rather than surfaced as an error.

### Out of Scope (Deferred Stories)

- Real cascade-SET-NULL behavior — Story 3.1 lands the `contactos` table with `OnDelete(DeleteBehavior.SetNull)`. Story 2.5 wires the forward-compat header path; the actual orphan count surfaces in 3.x.
- Audit log of deletions (`deleted_by_user_id`, soft-delete history) — explicitly out-of-scope for MVP per architecture.md scope.
- Bulk delete UI — not requested in epic 2.
- Undo (5s pull-to-undo toast pattern) — not in UX spec; would require soft-delete which is out of scope.
- Permission gating (only admins can delete) — auth/RBAC is out of MVP scope per NFR.

### Project Structure Notes

- New backend files (per `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure` lines 526–527, 597):
  - `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
  - `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/ClientesDeleteEndpointTests.cs`
- New frontend files (per architecture.md line 473):
  - `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
  - `frontend/src/modules/crm/clientes/application/__tests__/useDeleteCliente.test.tsx`
  - `frontend/src/modules/crm/clientes/presentation/ClienteDeleteDialog.tsx`
  - `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDeleteDialog.test.tsx`
- Modified frontend files:
  - `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — adds `DeleteClienteResult` + `delete(id)` signature
  - `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — adds `delete` method (reads `X-Contactos-Orphaned` header)
  - `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — adds `btn-eliminar-cliente` + mounts `ClienteDeleteDialog`
  - `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx` — adds 3 new tests for the Eliminar button
- Modified backend files:
  - `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — adds `MapDelete("/{id:guid}", ...)` + `MapDelete("/{id}", ...)` catch-all
  - `backend/src/SiesaAgents.API/Program.cs` — DI for `DeleteClienteCommandHandler`
  - `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — adds `RemoveAsync` signature
  - `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implements `RemoveAsync`
- Modified e2e files:
  - `e2e/pages/clientes.page.ts` — adds delete-flow testid locators (`btn-eliminar-cliente`, `cliente-delete-dialog`, `btn-confirmar-eliminar`, `btn-cancelar-eliminar`, four toast texts)
- New e2e files:
  - `e2e/tests/clientes/clientes-delete.spec.ts` — 3 UI scenarios
  - `e2e/tests/api/clientes-delete.api.spec.ts` — 5 API contract scenarios

### Detected Conflicts / Variances

- **`MasterCrud` rejection continues** — same UX/architecture justification as Stories 2.1 / 2.2 / 2.3 / 2.4. The delete confirmation is a focused alertdialog, not a CRUD orchestrator.
- **siesa-ui-kit `Alert` vs shadcn `Dialog`** — UX spec §"Confirmación de eliminación" recommends siesa-ui-kit `Alert`. Story 2.5 reuses the shadcn `Dialog` primitive already in the bundle (Stories 2.3/2.4) and upgrades the accessibility role to `alertdialog`. This avoids a new dependency surface and keeps the destructive flow visually consistent with create/edit dialogs. Intentional and documented.
- **No FluentValidation validator** for `DeleteClienteCommand` — route constraint `{id:guid}` + sibling catch-all are sufficient. Skipping the validator avoids a no-op DI registration. Documented above.
- **404 treated as soft-success on the frontend** — explicit UX call. A failed-because-it-was-already-gone delete is functionally indistinguishable from a successful delete from the user's perspective. The informational toast (amber, not red) signals "your intent was applied, just by a different mechanism." If user testing surfaces confusion, the copy can be revisited without changing the backend contract.
- **`X-Contactos-Orphaned` header is forward-compat for Story 3.x** — Story 2.5 always returns 0 contactos orphaned (the table does not exist yet). The header is omitted when the count is 0. Frontend and backend BOTH handle the header end-to-end in 2.5 via MSW + integration tests, so 3.x can light up the real count without further wiring.
- **`useDeleteCliente` invalidates on success only; component manually invalidates on 404** — the hook's responsibility is "happy path cache sync." The 404 soft-success path is component-level UX, so the cache calls live in `ClienteDeleteDialog`'s `onError` 404 branch. Documented in the Decision Tree section.
- **Bundle budget** — Story 2.4 eager chunk is 404.53 KB gzipped; Story 2.5 budgets ≤ +0 KB to the eager chunk (the new code lands in the lazy `clientes._clienteId` chunk).
- **`ClientesPage` POM extension — `btnEliminar` ambiguity** — the existing POM has a `btnEliminar` locator matching `getByRole('button', { name: /eliminar/i })`. With Story 2.5 there are now multiple "Eliminar" labels in the DOM (the destructive trigger + the dialog's Confirmar). Switch to testid-based locators (`btn-eliminar-cliente`, `btn-confirmar-eliminar`). Keep the legacy property pointing at the new locator to avoid breaking any existing crud spec.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-02-gestion-de-clientes.md#Story 2.5]
- Architecture — API & Communication Patterns (`DELETE /api/v1/clientes/{id}`, response shapes 204): [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Architecture — Process Patterns (mutation invalidation): [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Architecture — Enforcement Guidelines (Problem Details, no Swagger, DateTimeOffset, snake_case): [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Architecture — State Boundaries (query keys `['clientes']` + `['clientes', id]`): [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Architecture — Requirements to Structure Mapping (FR6 → `useDeleteCliente.ts` + `DeleteClienteCommandHandler.cs`, line 668): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- Architecture — Project Structure (`DeleteClienteCommand.cs`, `DeleteClienteCommandHandler.cs`, lines 526–527): [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Contactos cascade contract (`ON DELETE SET NULL`, line 229): [Source: _bmad-output/planning-artifacts/architecture.md#Data Model]
- PRD — Functional Requirement FR7 (delete cliente): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Client Management]
- PRD — Functional Requirement FR25 (sin cliente filter for orphaned contactos): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Data Quality & Administration]
- PRD — Functional Requirement FR27 (data changes propagate immediately): [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md#Data Quality & Administration]
- PRD — NFR2 (CRUD round-trip < 2s): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Performance]
- PRD — NFR6 (no stack trace exposure): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#Security]
- UX — Confirmación de eliminación (Alert pattern, Spanish copy, red destructive button): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Confirmación de eliminación]
- UX — Button Hierarchy (destructivo, red-600): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy]
- UX — Modal & Overlay Patterns (Esc + click outside + ✕, focus management): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modal & Overlay Patterns]
- UX — Navegación por teclado (Alert focus on Cancelar, Tab between buttons, Esc closes): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navegación por teclado]
- UX — Toasts (Spanish copy, 3s success / 5s error/info): [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Toasts]
- Test Design Epic 2 — P0 R-001 (DELETE cascade SET NULL), P1 confirmation dialog + cancel paths, P2 right panel returns to default + orphan compound toast: [Source: _bmad-output/test-design-epic-2.md#P0/P1/P2 sections for Story 2.5]
- Risk R-001 (cascade DELETE vs SET NULL): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Risk R-007 (TanStack invalidate after mutation): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Risk R-008 (XSS + oversized payload — N/A for delete but the 5xx fallback toast must respect NFR6): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Risk R-012 (toast Spanish copy): [Source: _bmad-output/test-design-epic-2.md#Risk Assessment]
- Story 2.1 (ClienteRepository, AppDbContext, ClienteEntity): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]
- Story 2.2 (split-panel layout, GetByIdAsync, 404 → null translation, ClienteDetailView states): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Story 2.3 (Create endpoint pattern, ClienteForm shell, ToastProvider mount, FluentValidation registration style): [Source: _bmad-output/implementation-artifacts/2-3-create-client.md]
- Story 2.4 (Update endpoint pattern, `GetByIdForUpdateAsync`, route-id override, sibling PUT catch-all, MSW + Vitest patterns, e2e POM patterns): [Source: _bmad-output/implementation-artifacts/2-4-edit-client.md]
- Story 1.3 (ExceptionHandlingMiddleware, Problem Details, DbContext, integration test factory): [Source: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md]
- Company standards — Frontend / Backend / Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- siesa-ui-kit MasterCrud reference (NOT used — see Variances): [Source: _bmad/bmm/workflows/3-solutioning/create-architecture/data/company-standards/mastercrud-use-reference.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (dev-story workflow, autonomous execution via sa-dev-story sub-agent)

### Debug Log References

- Backend: `dotnet build SiesaAgents.sln` → 0 errors, 0 warnings.
- Backend: `dotnet test` → **88/88 green** (32 unit + 56 integration; 7 new from Story 2.5).
- Frontend: `pnpm test --run` → **103/103 green** (90 baseline + 13 new from Story 2.5).
- Frontend: `pnpm run build` → eager chunk `index-*.js` at **404.53 KB gzipped** (≤ 410 KB target; identical to Story 2.4 baseline, so all new code landed in lazy chunks). Lazy `clientes._clienteId-*.js` at **5.55 KB / 1.89 KB gzipped** (≤ +3 KB budget).
- E2E `pnpm exec playwright test --list e2e/tests/clientes/clientes-delete.spec.ts e2e/tests/api/clientes-delete.api.spec.ts` → 8 unique tests recognised across all browser projects (live stack not exercised in this run — requires `dotnet run` + `pnpm dev`).

### Completion Notes List

- `Results.NoContent()` + custom-header pattern compiled cleanly under .NET 10 using the recommended fallback (`HttpContext.Response.Headers.Append` BEFORE returning `Results.NoContent()`). No reflection or custom `IResult` was required.
- FluentValidation validator for `DeleteClienteCommand` deliberately skipped — the route constraint `{id:guid}` + sibling catch-all `MapDelete("/{id}", ...)` cover the only invalid-input case at the HTTP layer; the handler input is just `Id`, so a validator would be a no-op DI registration.
- `DeleteCliente_OmitsContactosOrphanedHeader_WhenNoContactos` integration test passes and locks the forward-compat header contract: in Story 2.5 the cliente always has zero orphaned contactos (the table does not exist), so the response MUST NOT include the `X-Contactos-Orphaned` header. Story 3.x can extend this without breaking the contract.
- Frontend `useDeleteCliente` invalidates `['clientes']` AND `removeQueries({ queryKey: ['clientes', id] })` on 2xx only. The 404 soft-success branch in `ClienteDeleteDialog` manually re-runs both calls so the list stays in sync when the row vanished out-of-band.
- siesa-ui-kit `toast.info(...)` exists on the kit's `ToastProvider` export (verified against `node_modules/siesa-ui-kit/dist/components/Toast/ToastProvider.d.ts`) — used for the 404 soft-success amber toast. The existing test mocks were extended with `info: vi.fn()` to keep parity.
- `Eliminar` button placed FIRST in the action-bar source order ( `[Eliminar] [Editar]`, right-aligned with `gap-2`) so screen readers announce the destructive action first under the LTR locale, matching the visual order.
- `role="alertdialog"` + `aria-modal="true"` set on `DialogContent` so the WAI-ARIA upgrade (vs Radix's default `dialog` role) lands without touching the shared `Dialog` primitive — keeping the create/edit/delete flows visually consistent.
- POM update: the legacy `btnEliminar` / `btnConfirmarEliminar` properties are kept as aliases pointing at the new testid-based locators (`btn-eliminar-cliente` / `btn-confirmar-eliminar`) so any in-flight refs in existing crud specs continue to resolve.
- No new npm dependency introduced (re-uses shadcn `Dialog`, `siesa-ui-kit` `toast`, `axios`, `@tanstack/react-query`, `@tanstack/react-router`).

### File List

**New backend files:**
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Clientes/Commands/DeleteClienteCommandHandler.cs`
- `backend/tests/SiesaAgents.IntegrationTests/ClientesDeleteEndpointTests.cs`

**Modified backend files:**
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — added `MapDelete("/{id:guid}", ...)` + sibling catch-all `MapDelete("/{id}", ...)`.
- `backend/src/SiesaAgents.API/Program.cs` — registered `DeleteClienteCommandHandler` as scoped.
- `backend/src/SiesaAgents.Domain/Clientes/Interfaces/IClienteRepository.cs` — added `RemoveAsync` signature.
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` — implemented `RemoveAsync`.

**New frontend files:**
- `frontend/src/modules/crm/clientes/application/useDeleteCliente.ts`
- `frontend/src/modules/crm/clientes/application/__tests__/useDeleteCliente.test.tsx`
- `frontend/src/modules/crm/clientes/presentation/ClienteDeleteDialog.tsx`
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDeleteDialog.test.tsx`

**Modified frontend files:**
- `frontend/src/modules/crm/clientes/domain/IClienteRepository.ts` — added `DeleteClienteResult` + `delete(id)` signature.
- `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — implemented `delete` reading `X-Contactos-Orphaned`.
- `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — added `btn-eliminar-cliente` + mounted `ClienteDeleteDialog`.
- `frontend/src/modules/crm/clientes/presentation/__tests__/ClienteDetailView.test.tsx` — added 3 new tests for the Eliminar button; extended `siesa-ui-kit` mock with `info: vi.fn()`.

**New e2e files:**
- `e2e/tests/clientes/clientes-delete.spec.ts` — 3 UI scenarios.
- `e2e/tests/api/clientes-delete.api.spec.ts` — 5 API contract scenarios.

**Modified e2e files:**
- `e2e/pages/clientes.page.ts` — added testid-based delete locators (`btn-eliminar-cliente`, `cliente-delete-dialog`, `btn-confirmar-eliminar`, `btn-cancelar-eliminar`, four toast texts); legacy `btnEliminar` / `btnConfirmarEliminar` aliased to the new locators.
